# Day 4 — Caching, CDN & Asynchronous Systems

### Today's goal

By the end of today, you should be able to confidently explain:

* Why caching is needed
* Redis and cache strategies
* Cache invalidation
* Cache-aside pattern
* Cache stampede
* Hot keys
* CDN
* Message queues
* Synchronous vs asynchronous processing
* Retries & exponential backoff
* Dead Letter Queues
* Idempotency
* When to use each pattern in a system-design interview

---

# 1. Where We Are So Far

You should now have this mental model:

```text
                    ┌──────────────┐
                    │    Users     │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │     DNS      │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Load Balancer│
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
           API #1       API #2       API #3
              │            │            │
              └────────────┼────────────┘
                           │
                    ┌──────▼───────┐
                    │    Redis     │
                    │    Cache     │
                    └──────┬───────┘
                           │
                      Cache Miss
                           │
                           ▼
                    ┌──────────────┐
                    │   Database   │
                    └──────────────┘
```

We've already learned how to scale:

**API → Load Balancer → multiple servers**

and

**Database → Replication → Read Replicas → Sharding**

Today we're going to understand what happens when **the database is receiving far too many reads**.

---

# 2. Why Do We Need Caching?

Imagine:

```text
10,000 requests/sec
        │
        ▼
     API Server
        │
        ▼
    PostgreSQL
```

Suppose 90% of those requests ask for data that doesn't change frequently.

For example:

```text
GET /products/123
```

The product might change once every few hours.

But you're querying PostgreSQL thousands of times per second for the same product.

That's wasteful.

Instead:

```text
GET /products/123
        │
        ▼
      Redis
        │
     cache hit
        │
        ▼
     response
```

Now PostgreSQL doesn't need to handle those reads.

### Core idea

> **Cache = store frequently accessed data closer to the application so we don't repeatedly access the slower source of truth.**

---

# 3. Redis

Redis is commonly used as an in-memory cache.

Example:

```text
Key:
product:123

Value:
{
  "id": 123,
  "name": "iPhone",
  "price": 999
}
```

Instead of:

```text
API → PostgreSQL
```

we have:

```text
API → Redis
```

Redis is extremely fast because data is primarily served from memory.

---

# 4. Cache Hit vs Cache Miss

This is fundamental.

### Cache Hit

Data exists in cache.

```text
API
 │
 ▼
Redis
 │
 └── Data exists
       │
       ▼
    Response
```

Fast.

### Cache Miss

Data doesn't exist.

```text
API
 │
 ▼
Redis
 │
 └── Not found
       │
       ▼
   Database
       │
       ▼
   Store in Redis
       │
       ▼
    Response
```

This is probably the most important caching flow to remember.

---

# 5. Cache-Aside Pattern ⭐⭐⭐⭐⭐

This is the caching pattern you should know first.

Application manages the cache.

### Read

```text
        Request
           │
           ▼
        API
           │
           ▼
        Redis
        /    \
     Hit      Miss
      │         │
      │         ▼
      │       DB
      │         │
      │         ▼
      │      Redis
      │         │
      └────┬────┘
           ▼
        Response
```

### Code conceptually

```javascript
const cached = await redis.get(key);

if (cached) {
    return JSON.parse(cached);
}

const data = await db.getProduct(id);

await redis.set(key, JSON.stringify(data), {
    EX: 300
});

return data;
```

The database remains the **source of truth**.

Redis is just the **cache**.

---

# 6. What Happens When Data Changes?

This is where caching becomes interesting.

Suppose:

```text
DB:
price = $100

Redis:
price = $100
```

User changes price:

```text
DB:
price = $120

Redis:
price = $100   ❌
```

Now Redis contains stale data.

So we need **cache invalidation**.

---

# 7. Cache Invalidation

When updating the database:

```text
UPDATE product
        │
        ▼
   PostgreSQL
        │
        ▼
Delete/update Redis
```

For example:

```javascript
await db.updateProduct(id, data);

await redis.del(`product:${id}`);
```

Next request:

```text
Redis → MISS

       ↓

Database → $120

       ↓

Redis → $120
```

---

# 8. TTL — Time To Live

Another common strategy is to automatically expire cache entries.

Example:

```text
product:123
TTL = 300 seconds
```

After 5 minutes:

```text
Redis
  ↓
Expired
```

The next request retrieves fresh data from the database.

### Why TTL?

Because you don't want stale data living forever.

```text
Cache
 ├── fast
 └── potentially stale
```

TTL gives you a balance:

> **Performance vs freshness**

---

# 9. Cache Invalidation Is Hard

There's a famous engineering joke:

> "There are only two hard things in Computer Science: cache invalidation and naming things."

The reason is that you now have two copies:

```text
Database
   +
Cache
```

You have to keep them reasonably consistent.

Possible strategies:

### Strategy 1 — Delete cache after DB update

```text
DB update
   ↓
Redis DEL
```

Simple and common.

### Strategy 2 — Update cache

```text
DB update
   ↓
Redis SET new value
```

Faster for subsequent reads, but more coordination.

### Strategy 3 — TTL

```text
Cache automatically expires
```

Simple, but allows stale data until expiration.

---

# 10. Cache Stampede ⭐⭐⭐⭐

This is an important interview topic.

Suppose:

```text
product:123
```

expires at 12:00.

At exactly 12:00:

```text
10,000 requests
       │
       ▼
     Redis
       │
       ▼
     MISS
```

All 10,000 requests hit the database simultaneously.

```text
                 ┌──→ DB
                 ├──→ DB
10,000 requests ─┼──→ DB
                 ├──→ DB
                 └──→ DB
```

Your cache was supposed to **protect your database**.

Instead, it just caused a huge database spike.

This is called a:

> **Cache stampede / thundering herd**

---

# 11. How Do We Prevent Cache Stampede?

Several approaches exist.

### 1. Locking

Only one request rebuilds the cache.

```text
Request 1 → Redis MISS → acquire lock → DB
Request 2 → Redis MISS → wait
Request 3 → Redis MISS → wait
Request 4 → Redis MISS → wait
```

Once request 1 populates Redis:

```text
Redis
product:123
```

Others use it.

---

### 2. TTL Jitter

Instead of:

```text
Every cache entry expires after exactly 300 sec
```

use:

```text
300 + random(0-60) sec
```

So thousands of keys don't expire at exactly the same moment.

---

### 3. Background Refresh

Refresh the cache before expiration.

```text
Redis
  │
  ├── still serving old value
  │
  └── background refresh
             │
             ▼
            DB
```

This is useful for very hot data.

---

# 12. Hot Keys ⭐⭐⭐⭐

Suppose:

```text
product:123
```

is extremely popular.

Maybe 50% of all traffic is asking for it.

That's a **hot key**.

Even Redis can become stressed if enormous traffic concentrates on one key.

Possible solutions:

* Replicate/cache the hot value
* Distribute traffic
* Local in-process caching
* Add replicas
* Avoid expensive recomputation
* Precompute popular data

Interview principle:

> **Don't only think about total traffic. Look for traffic concentrated on a single resource.**

---

# 13. CDN

Now let's move one layer closer to the user.

Suppose you're serving:

```text
images
videos
CSS
JavaScript
fonts
static HTML
```

Do we really want every request going to our application?

```text
Canada ───────┐
USA ──────────┤
UK ───────────┼──→ API → Server
India ────────┤
Australia ────┘
```

No.

We can use a **CDN — Content Delivery Network**.

```text
                 CDN
          ┌───────┼───────┐
          ▼       ▼       ▼
        Canada   USA      India
          │       │        │
          └───────┼────────┘
                  │
               Origin
               Server
```

The CDN caches content geographically closer to users.

---

# 14. Redis vs CDN

This distinction is important.

### Redis

Usually used for:

```text
Dynamic application data
sessions
API responses
frequently accessed DB records
counters
```

### CDN

Usually used for:

```text
Images
Videos
CSS
JS
Fonts
Static files
Cached web content
```

Think:

```text
CDN → closer to USER

Redis → closer to APPLICATION
```

---

# 15. Now Introduce Message Queues

Caching solves **read scalability**.

But what happens when an operation is expensive?

Example:

```text
POST /signup
```

After signup you need to:

```text
Create user
Send email
Generate PDF
Send analytics event
Notify CRM
Send welcome notification
```

If your API does everything synchronously:

```text
Request
  │
  ▼
Create user
  │
  ▼
Send email
  │
  ▼
Generate PDF
  │
  ▼
Analytics
  │
  ▼
Response
```

The user waits for everything.

Bad.

---

# 16. Asynchronous Processing

Instead:

```text
User
 │
 ▼
API
 │
 ├── Create user
 │
 └── Queue message
          │
          ▼
        Worker
          │
          ├── Email
          ├── PDF
          └── Analytics
```

The API can respond quickly.

```text
API → "Signup successful"
```

Meanwhile:

```text
Worker → processes background job
```

---

# 17. Message Queue

Think of a queue as a buffer between producers and consumers.

```text
Producer
   │
   ▼
┌──────────────┐
│    Queue     │
│              │
│ job 1        │
│ job 2        │
│ job 3        │
│ job 4        │
└──────┬───────┘
       │
       ▼
    Consumer
```

Producer:

```text
API Server
```

Consumer:

```text
Worker
```

Examples of queue technologies:

* Amazon SQS
* RabbitMQ
* Kafka
* Redis Streams

Don't worry about the differences yet. We'll cover them later.

---

# 18. Why Use a Queue?

### 1. Faster API response

```text
API → Queue → return response
```

### 2. Absorb traffic spikes

Suppose:

```text
Normal:
1,000 jobs/sec

Spike:
50,000 jobs/sec
```

Instead of crashing workers:

```text
50,000 jobs
      ↓
    Queue
      ↓
workers process gradually
```

The queue acts as a **buffer**.

---

### 3. Decouple services

Without queue:

```text
Order Service
      ↓
Email Service
```

If Email Service is down:

```text
Order creation might fail ❌
```

With queue:

```text
Order Service
      ↓
    Queue
      ↓
Email Service
```

Email can recover later.

---

# 19. Retry

What if a worker processes:

```text
Send email
```

and the email service fails?

Don't immediately give up.

Use retries.

```text
Attempt 1 → fail
Attempt 2 → fail
Attempt 3 → success
```

But don't retry immediately thousands of times.

---

# 20. Exponential Backoff ⭐⭐⭐⭐

Instead:

```text
Retry 1 → wait 1 sec
Retry 2 → wait 2 sec
Retry 3 → wait 4 sec
Retry 4 → wait 8 sec
```

This is called:

> **Exponential backoff**

Often combined with some randomness (**jitter**) so many workers don't retry simultaneously.

---

# 21. Dead Letter Queue — DLQ

What happens if:

```text
Job
 ↓
FAIL
 ↓
Retry
 ↓
FAIL
 ↓
Retry
 ↓
FAIL
 ↓
Retry
 ↓
FAIL
```

You don't want it retrying forever.

After some maximum attempts:

```text
Main Queue
     │
     ▼
Retry 3 times
     │
     ▼
Dead Letter Queue
```

DLQ allows engineers to inspect and recover failed messages.

---

# 22. Idempotency ⭐⭐⭐⭐⭐

This is **very important**.

Imagine payment processing.

Request:

```text
POST /payment
```

Payment succeeds.

But response gets lost.

Client retries.

Now:

```text
Payment #1 → $100
Payment #2 → $100
```

Customer gets charged twice.

We need **idempotency**.

Example:

```text
Idempotency-Key:
abc123
```

Server stores:

```text
abc123 → payment result
```

If the same request comes again:

```text
abc123
```

Server returns the previous result instead of processing another payment.

---

# 23. Why Idempotency Matters With Queues

Queues often provide **at-least-once delivery**.

Meaning:

> A message may be delivered more than once.

Therefore:

```text
Queue
  ↓
Worker
  ↓
process job
```

must often be designed so that processing the same message twice doesn't cause corruption.

Example:

```text
Message ID: 123

Worker:
"Have I already processed 123?"

YES → skip

NO → process → mark completed
```

This is a very strong senior-level concept.

---

# 24. Synchronous vs Asynchronous

Memorize this:

### Synchronous

```text
Client
  ↓
API
  ↓
Service
  ↓
Response
```

Use when the client needs the result immediately.

Examples:

```text
GET product
login
fetch profile
check balance
```

### Asynchronous

```text
Client
  ↓
API
  ↓
Queue
  ↓
Worker
  ↓
Processing
```

Use when work can happen later.

Examples:

```text
Send email
Generate report
Resize image
Process video
Analytics
Notifications
```

---

# 25. Putting Everything Together

Let's upgrade our architecture.

```text
                         Users
                           │
                           ▼
                         CDN
                           │
                           ▼
                     Load Balancer
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
           API #1       API #2       API #3
              │            │            │
              └──────┬─────┴─────┬──────┘
                     │           │
                     ▼           ▼
                  Redis        Queue
                     │           │
                     ▼           ▼
                  Database     Workers
                     │
              ┌──────┴──────┐
              ▼             ▼
           Primary       Replicas
```

Now you have a much more scalable architecture.

---

# 26. The Mental Model You Need

When designing a system, ask:

### Too many reads?

```text
→ Cache
→ Redis
→ CDN
→ Read replicas
```

### Too much synchronous work?

```text
→ Queue
→ Workers
→ Async processing
```

### Traffic spikes?

```text
→ Queue
→ Autoscaling
→ Load balancing
→ Caching
```

### Service temporarily failing?

```text
→ Retry
→ Exponential backoff
→ Circuit breaker
→ DLQ
```

### Duplicate processing?

```text
→ Idempotency
```

### Stale data?

```text
→ TTL
→ Cache invalidation
→ Stronger consistency where needed
```

---

# 27. Interview Cheat Sheet ⭐

If interviewer asks:

**"How would you reduce database load?"**

Say:

> "I'd first identify whether the workload is read-heavy. For frequently accessed data, I'd introduce a cache such as Redis using cache-aside, with appropriate TTLs and invalidation. I'd also consider read replicas and indexes. If the data is static content, I'd put it behind a CDN."

---

**"How would you handle traffic spikes?"**

> "I'd use horizontal scaling and load balancing for the API layer, caching for repeated reads, and a message queue to absorb asynchronous workloads and smooth out spikes."

---

**"What happens if a worker fails?"**

> "I'd retry with exponential backoff and a maximum retry count. Messages that repeatedly fail would go to a dead-letter queue for investigation."

---

**"How do you prevent duplicate processing?"**

> "I'd make the operation idempotent, typically using an idempotency key or a unique operation ID that we persist and check before processing."

---

**"What's the problem with caching?"**

> "The main challenges are stale data, cache invalidation, cache stampedes, and hot keys. I'd use TTLs, explicit invalidation, request coalescing or locks for stampedes, and appropriate strategies for hot keys."

---

# 28. Day 4 — What You Should Memorize

Don't memorize 30 concepts.

Remember this:

```text
CACHE
─────
Redis
Cache hit / miss
Cache-aside
TTL
Invalidation
Stampede
Hot key


CDN
───
Static content
Closer to users


QUEUE
─────
Async processing
Traffic buffer
Decoupling


WORKERS
───────
Process jobs


FAILURES
────────
Retry
Exponential backoff
DLQ


DUPLICATES
──────────
Idempotency
```

And the most important system-design principle from today:

> **Use caching to avoid repeated work, and queues to move work out of the critical request path.**

---

# 🎯 Day 4 Exercise

Don't look for the answer yet.

### Scenario

You're designing a **notification system**.

The system needs to send:

* Email
* SMS
* Push notifications

Your API receives:

```text
POST /notifications
```

Traffic:

```text
10,000 requests/sec
```

Sending a notification can take **1–3 seconds**.

The external email/SMS providers sometimes fail temporarily.

### Design this:

```text
Client
   ↓
???
   ↓
???
   ↓
Email/SMS/Push
```

Answer these **5 questions**:

1. Should notification sending be synchronous or asynchronous? **Why?**
2. Where would you put a **queue**?
3. What happens if an email provider fails?
4. How would you prevent sending the same notification twice?
5. What happens if traffic suddenly jumps from **10K → 100K requests/sec**?

**Try answering in 5–8 sentences.** I'll review your design like a system-design interviewer and then we'll build the production-grade architecture.

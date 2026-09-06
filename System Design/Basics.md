Absolutely. In fact, **we should maintain notes alongside the learning**. I'll keep them focused on **interview revision**, not textbook-style explanations.

You can use these as your **Day 1 System Design notes**.

# System Design — Day 1 Notes

## 1. What is System Design?

System design is the process of deciding **how different components of a software system work together** to satisfy:

* Functional requirements — what the system does
* Non-functional requirements — how well it does it

Typical concerns:

```text
Scalability
Availability
Performance
Reliability
Consistency
Security
Cost
```

### Core idea

> Don't just ask "How do I build it?"
> Ask **"How will it behave when users, traffic, and data grow?"**

---

# 2. Basic Architecture

A common starting point:

```text
Users
  ↓
DNS
  ↓
Load Balancer
  ↓
API Servers
  ↓
Cache / Database
```

At larger scale:

```text
                         USERS
                           ↓
                          DNS
                           ↓
                    LOAD BALANCER
                           ↓
              ┌────────────┼────────────┐
              ↓            ↓            ↓
           API #1        API #2       API #3
              └────────────┼────────────┘
                           ↓
                     ┌─────┴─────┐
                     ↓           ↓
                   CACHE      DATABASE
                     │
                     ↓
                  MESSAGE
                   QUEUE
                     ↓
                  WORKERS
```

**Don't memorize the diagram. Understand why each component exists.**

---

# 3. Scaling

Scaling = handling increasing users, traffic, and data.

### Vertical Scaling

Make one server more powerful.

```text
2 CPU / 4 GB RAM
       ↓
16 CPU / 64 GB RAM
```

**Pros**

* Simple
* Little architectural change

**Cons**

* Hardware has limits
* Can become expensive
* Still one machine → potential single point of failure

---

### Horizontal Scaling ⭐

Add more servers.

```text
              Load Balancer
              /     |     \
             ↓      ↓      ↓
          Server1 Server2 Server3
```

**Pros**

* Handles more traffic
* Better availability
* Can scale incrementally

**Cons**

* More complexity
* Requires distributed-system considerations

### Interview phrase

> "I'd horizontally scale the stateless API servers behind a load balancer."

---

# 4. Load Balancer ⭐⭐⭐

A load balancer distributes incoming traffic across multiple servers.

```text
Users
  ↓
Load Balancer
  ↓
┌───────┬───────┬───────┐
Server1 Server2 Server3
```

Example:

```text
Request 1 → Server 1
Request 2 → Server 2
Request 3 → Server 3
Request 4 → Server 1
```

### Why?

Without it:

```text
Users → Server 1
         ↓
      overloaded
```

With it:

```text
Users → Load Balancer
             ↓
       ┌─────┼─────┐
       ↓     ↓     ↓
      API   API   API
```

### Common responsibilities

* Traffic distribution
* Health checks
* Removing unhealthy servers
* Sometimes TLS termination
* Sometimes routing

---

# 5. Stateless vs Stateful ⭐⭐⭐

### Stateful

The server keeps user/session information in its own memory.

```text
User
 ↓
Server 1

Server 1 remembers user
```

Problem:

```text
User
 ↓
Load Balancer
 ↓
Server 2

Server 2 doesn't know the state
```

---

### Stateless

The server doesn't depend on its own local memory to know the user's state.

```text
User
 ↓
Load Balancer
 ↓
Any API server
```

Every API server can process the request.

### Why stateless?

Makes horizontal scaling much easier.

```text
             Load Balancer
            /      |      \
           ↓       ↓       ↓
        API #1   API #2   API #3
```

Any server can handle any request.

### Interview phrase

> "I'd keep the API servers stateless so requests can be distributed across instances."

---

# 6. Cache ⭐⭐⭐⭐⭐

A cache stores frequently/repeatedly accessed data in a faster storage layer.

Common technology:

**Redis**

Basic flow:

```text
API
 ↓
Redis
 ↓
Database
```

More accurately:

```text
             API
              ↓
            Redis
           /     \
        HIT       MISS
         ↓          ↓
      Return     Database
                    ↓
                  Redis
                    ↓
                  Return
```

### Cache Hit

Data exists in cache.

```text
API → Redis → Data
```

Fast.

### Cache Miss

Data doesn't exist.

```text
API → Redis → MISS
              ↓
           Database
              ↓
            Redis
```

### Why cache?

* Reduce database load
* Improve latency
* Handle more read traffic

### Important

Don't say:

> "Redis is always faster and therefore we use it."

Better:

> "For frequently accessed data, caching can reduce database reads and improve response latency."

---

# 7. Database Scaling

A single database can eventually become a bottleneck.

One approach:

### Read Replicas

```text
             Database
                 │
          ┌──────┴──────┐
          ↓             ↓
       Primary       Replica
       Writes         Reads
```

Example:

```text
POST /users
     ↓
Primary

GET /users/123
     ↓
Replica
```

This helps when the workload is **read-heavy**.

---

# 8. SQL vs NoSQL

Don't memorize:

> SQL = bad at scale
> NoSQL = good at scale

That's incorrect.

Choose based on the system's requirements and access patterns.

### SQL

Examples:

* PostgreSQL
* MySQL

Good when you need:

* Relationships
* Transactions
* Strong consistency
* Complex queries
* Structured data

### NoSQL

Examples:

* DynamoDB
* MongoDB
* Cassandra

Useful when you need:

* Very large scale
* High throughput
* Flexible schema (depending on database)
* Simple/key-value access patterns
* Horizontal scaling

### Interview answer

> "I'd choose the database based on access patterns, consistency requirements, relationships, scale, and operational constraints."

---

# 9. Asynchronous Processing

Some work doesn't need to happen before the user receives a response.

Bad:

```text
Request
  ↓
Create account
  ↓
Send email
  ↓
Wait
  ↓
Response
```

Better:

```text
Request
  ↓
Create account
  ↓
Queue
  ↓
Response
```

Then:

```text
Queue
  ↓
Worker
  ↓
Email Service
```

### Why?

* Faster user response
* Decouples services
* Handles traffic spikes
* Enables retries
* Prevents slow operations from blocking requests

Common technologies:

```text
Kafka
RabbitMQ
AWS SQS
Google Pub/Sub
```

We'll cover these later.

---

# 10. Capacity Estimation ⭐⭐⭐⭐

Before designing a system, estimate its scale.

Example:

> 100 million users
> Each creates 1 URL/month

```text
100M URLs / month
```

Approximately:

```text
100,000,000
────────────── ≈ 38 writes/sec
2,592,000 seconds
```

So:

```text
≈ 38 writes/sec
```

If the system has a:

```text
1 write : 100 reads
```

ratio:

```text
Writes ≈ 38/sec
Reads  ≈ 3,800/sec
```

Now caching becomes very valuable.

---

# 11. Average vs Peak Traffic

Never assume traffic is constant.

Example:

```text
Average: 3,800 requests/sec
Peak:    10,000 requests/sec
```

Design around peak traffic and leave reasonable headroom.

### Interview phrase

> "I'd estimate both average and peak traffic because capacity needs to account for traffic spikes."

---

# 12. URL Shortener — Our Example

### Requirement

Convert:

```text
https://example.com/products/123456
```

into:

```text
https://short.ly/aB92x
```

And:

```text
https://short.ly/aB92x
```

redirects to the original URL.

### APIs

```text
POST /shorten
GET  /:shortCode
```

### Data

```text
shortCode
originalUrl
createdAt
expiresAt
```

Example:

```json
{
  "shortCode": "aB92x",
  "originalUrl": "https://example.com/products/123",
  "createdAt": "...",
  "expiresAt": "..."
}
```

### Architecture

```text
                    USER
                      ↓
               LOAD BALANCER
                      ↓
             API SERVER 1/2/3
                  ↙       ↘
             Redis       Database
```

### Create URL

```text
POST /shorten
      ↓
Generate ID
      ↓
Generate shortCode
      ↓
Save to DB
      ↓
Return short URL
```

### Redirect

```text
GET /aB92x
      ↓
Redis
   ↙       ↘
 HIT       MISS
  ↓          ↓
Return     Database
             ↓
           Redis
             ↓
           Return
```

**Important:** We are looking up the short code and redirecting to the original URL; we're not necessarily "decoding" the URL.

---

# 13. The System Design Interview Framework ⭐⭐⭐⭐⭐

This is the framework I want you to memorize.

```text
1. Requirements
       ↓
2. Scale / Capacity
       ↓
3. API Design
       ↓
4. Data Model
       ↓
5. High-Level Architecture
       ↓
6. Deep Dive
       ↓
7. Bottlenecks
       ↓
8. Trade-offs
```

### 1. Requirements

Ask:

```text
Who uses it?
What can they do?
What are the core features?
```

### 2. Scale

Estimate:

```text
Users
Requests/sec
Reads vs writes
Storage
Peak traffic
```

### 3. APIs

Define:

```text
POST /...
GET /...
DELETE /...
```

### 4. Data Model

Determine:

```text
What data?
How is it accessed?
How much data?
```

### 5. High-Level Architecture

Start simple:

```text
Client
 ↓
LB
 ↓
API
 ↓
Cache
 ↓
DB
```

Then add complexity **only when you have a reason**.

### 6. Deep Dive

Explore things such as:

```text
Caching
Database scaling
Queues
Consistency
Failure handling
```

### 7. Bottlenecks

Ask:

> "What's going to break first?"

### 8. Trade-offs

Explain:

> "I chose X because..., but the trade-off is..."

---

# 🔥 The 10 Things I Want You to Memorize Today

If you remember nothing else, remember these:

```text
1. Horizontal scaling
   → Add more servers

2. Load balancer
   → Distribute traffic

3. Stateless API
   → Any server can handle requests

4. Cache
   → Reduce expensive/repeated reads

5. Redis
   → Common in-memory cache

6. Read replica
   → Scale database reads

7. Queue
   → Move slow work asynchronously

8. Capacity estimation
   → Understand required scale

9. Peak traffic
   → Design for spikes, not just averages

10. Trade-offs
    → Every architectural decision has a cost
```

### One sentence to remember system design by:

> **"Start simple, estimate the scale, identify the bottleneck, then add the component that solves that bottleneck."**

That's the mindset I want you to develop rather than memorizing architecture diagrams.

**Next:** we'll continue exactly where we stopped — **"What happens when API Server #2 crashes?"** From there we'll learn **availability, health checks, redundancy, replication, and single points of failure.**

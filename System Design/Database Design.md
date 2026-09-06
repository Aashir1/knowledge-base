Perfect. **Day 3 starts now.**

Today is important because databases are where a lot of system-design interviews become difficult. We'll keep it practical and connect it to things you already know: **PostgreSQL/MySQL/MongoDB, APIs, Redis, and Node.js**.

# System Design — Day 3

## Database Design, Indexes, Replication & Sharding

### What you'll learn today

```text
1. Database fundamentals for system design
2. SQL vs NoSQL
3. Database indexes
4. Read vs write patterns
5. Replication
6. Sharding
7. Database bottlenecks
8. Putting everything into our URL Shortener
```

---

# 1. The Database Problem

Start with our basic system:

```text
User
  ↓
Load Balancer
  ↓
API Servers
  ↓
Database
```

Initially:

```text
1 API
1 Database
```

Then:

```text
10 API Servers
        ↓
     Database
```

The API layer scales horizontally.

But eventually:

> **The database becomes the bottleneck.**

For example:

```text
             10 API servers
          / / / / / / / / / /
                    ↓
              ┌───────────┐
              │ PostgreSQL│
              └───────────┘
                    💥
```

Adding more API servers doesn't help if every request eventually hits the same database.

This is one of the most important things to recognize in system design:

> **Scaling the application layer doesn't automatically scale the database.**

---

# 2. First Question: SQL or NoSQL?

You already know these technologies.

### SQL

Examples:

```text
PostgreSQL
MySQL
```

Data is generally organized into tables and relationships.

Example:

```text
users

id | name | email
---|------|------
1  | Ali  | ...
2  | John | ...
```

### NoSQL

Examples:

```text
MongoDB
DynamoDB
Cassandra
```

Data models vary, but common patterns include document and key-value access.

Example:

```json
{
  "shortCode": "aB92x",
  "originalUrl": "https://example.com/123"
}
```

---

# 3. Don't Use This Rule ❌

Never say:

> "NoSQL is faster than SQL, so I'll use NoSQL."

That's a weak system-design answer.

Instead ask:

```text
What data do I have?
        ↓
How will I access it?
        ↓
How much traffic?
        ↓
Do I need transactions?
        ↓
Do I need relationships?
        ↓
What consistency do I need?
        ↓
Choose database
```

---

# 4. SQL vs NoSQL — Interview Version

| Requirement                 | Usually favors |
| --------------------------- | -------------- |
| Complex relationships       | SQL            |
| Transactions                | SQL            |
| Complex queries             | SQL            |
| Strong relational integrity | SQL            |
| Simple key-value access     | NoSQL          |
| Massive horizontal scale    | NoSQL often    |
| Flexible document structure | Document NoSQL |
| Very high write throughput  | NoSQL often    |
| Strict schema               | SQL            |

**"Usually favors" is intentional.**

Modern databases overlap heavily, so don't treat this as an absolute rule.

---

# 5. Our URL Shortener

Our core data looks like:

```text
shortCode → originalURL
```

Example:

```text
aB92x → https://example.com/products/123
```

That's essentially a **key-value lookup**.

So a NoSQL/key-value database is a reasonable choice.

For example:

```text
Key:   aB92x

Value:
https://example.com/products/123
```

The important thing isn't:

> "NoSQL is better."

It's:

> "Our primary access pattern is a simple lookup by short code, so a key-value-oriented database fits naturally."

---

# 6. Database Indexes ⭐⭐⭐⭐⭐

This is **very important for interviews.**

Suppose we have:

```text
users

id
name
email
```

And 100 million users.

You execute:

```sql
SELECT *
FROM users
WHERE email = 'aashir@example.com';
```

Without an index, the database may need to examine many rows.

Conceptually:

```text
Row 1 ❌
Row 2 ❌
Row 3 ❌
...
Row 50,000,000 ❌
...
Row 72,483,912 ✅
```

That's expensive.

---

# 7. Add an Index

```sql
CREATE INDEX idx_users_email
ON users(email);
```

Now the database has a data structure specifically designed to locate records efficiently.

Conceptually:

```text
Query
  ↓
Index
  ↓
Find matching row
  ↓
Database row
```

Instead of scanning everything.

---

# 8. Why Indexes Matter

Without index:

```text
Query
  ↓
Scan lots of rows
  ↓
Slow
```

With index:

```text
Query
  ↓
Index lookup
  ↓
Matching rows
  ↓
Fast
```

### Interview answer

> "If a column is frequently used in filtering, joining, or ordering, I'd consider indexing it based on the query patterns."

Notice:

**Consider indexing.**

Not:

> "Index every column."

---

# 9. Indexes Have a Cost ⚠️

Indexes aren't free.

If you have:

```text
users table
      +
email index
      +
name index
      +
phone index
      +
address index
```

Every write may need to update those indexes.

Therefore:

```text
More indexes
     ↓
Faster reads
     ↓
But
     ↓
More storage + slower writes
```

### System design trade-off

> **Indexes improve read performance but add storage and write overhead.**

---

# 10. Read-Heavy vs Write-Heavy

This is another concept you should learn to identify immediately.

### Read-heavy

```text
1000 reads
100 writes
```

Example:

```text
Social media feed
Product catalog
URL shortener
```

Think:

```text
Caching
Read replicas
Indexes
CDN
```

---

### Write-heavy

```text
100 writes
10 reads
```

Examples could include:

```text
Telemetry
Logging
Analytics ingestion
IoT events
```

Think about:

```text
Queues
Batch processing
Partitioning
Write-optimized databases
```

---

# 11. Database Replication ⭐⭐⭐⭐⭐

We touched this yesterday.

Instead of one database:

```text
Database
```

we create copies:

```text
              Primary
             /       \
            ↓         ↓
        Replica 1  Replica 2
```

Primary usually handles writes:

```text
POST
PUT
DELETE
```

Replicas can handle reads:

```text
GET
```

Architecture:

```text
                   API
                  /   \
                 ↓     ↓
             WRITE     READ
                ↓       ↓
             Primary  Replica
                         ↑
                         │
                    replication
                         │
                       Primary
```

---

# 12. Why Replication?

### Reason 1 — Read scalability

Suppose:

```text
100,000 reads/sec
```

One database might struggle.

You can distribute reads:

```text
                 API
                  ↓
          ┌───────┼───────┐
          ↓       ↓       ↓
       Replica Replica Replica
          1       2       3
```

### Reason 2 — Availability

If one database instance fails:

```text
Replica 1 ❌
Replica 2 ✅
```

You still have another copy.

---

# 13. Replication Lag ⭐⭐⭐⭐

This is an interview favorite.

Suppose:

```text
User creates URL
       ↓
Primary
       ↓
aB92x saved
```

But replication takes some time.

Immediately:

```text
GET /aB92x
      ↓
Replica
      ↓
NOT FOUND
```

Why?

The replica hasn't caught up.

That's:

> **Replication lag**

Conceptually:

```text
Primary:
A B C D E F

Replica:
A B C D

       ↑
    behind
```

---

# 14. Strong vs Eventual Consistency

Replication introduces an important question:

> **How quickly must every reader see a write?**

### Strong consistency

After a successful write:

```text
Write → immediately visible to subsequent reads
```

You prioritize correctness/currentness.

### Eventual consistency

The system may temporarily return older data, but replicas eventually converge.

```text
Write
 ↓
Primary updated

Replica
 ↓
temporarily old
 ↓
replication
 ↓
updated
```

### Simple interview explanation

> **Strong consistency gives fresher reads but can introduce more coordination or latency. Eventual consistency can improve scalability and availability but allows temporary stale reads.**

Don't worry about advanced distributed consistency models yet.

---

# 15. Sharding ⭐⭐⭐⭐⭐

Replication creates copies of the **same data**.

Sharding is different.

With sharding, we **split the data across databases**.

Instead of:

```text
               Database
           1 billion records
```

we do:

```text
              ┌──────────────┐
              │   Database   │
              └──────┬───────┘
                     ↓
              split data
           /        |        \
          ↓         ↓         ↓
       Shard 1   Shard 2   Shard 3
```

Example:

```text
Shard 1 → Users 1–10M
Shard 2 → Users 10M–20M
Shard 3 → Users 20M–30M
```

---

# 16. Sharding Key

We need to decide:

> **Which shard should contain this data?**

That's the **shard key**.

Example:

```text
userId
```

Could determine where a user's data lives.

```text
userId
   ↓
hash(userId)
   ↓
Shard
```

For example:

```text
hash(123)
  ↓
Shard 2

hash(456)
  ↓
Shard 1
```

---

# 17. Replication vs Sharding

This is a **must-know distinction**.

### Replication

> **Copy the same data.**

```text
Primary
  ↓
Replica 1
Replica 2
```

Main benefits:

```text
Availability
Read scalability
```

### Sharding

> **Split different data across databases.**

```text
Shard 1 → Data A
Shard 2 → Data B
Shard 3 → Data C
```

Main benefit:

```text
Scale data/storage/write workload horizontally
```

### Easy memory trick

```text
Replication = COPY

Sharding = SPLIT
```

🔥 **Memorize that.**

---

# 18. Sharding Has Problems

Don't say:

> "Just shard the database."

Sharding adds significant complexity.

Problems include:

* Choosing a good shard key
* Hot partitions
* Cross-shard queries
* Cross-shard transactions
* Rebalancing
* Operational complexity

Example:

```text
Shard 1 → 90% traffic 🔥
Shard 2 → 5%
Shard 3 → 5%
```

You have a **hot shard**.

So choosing the shard key matters enormously.

---

# 19. URL Shortener: Do We Need Sharding?

Our system:

```text
100M URLs
```

Maybe eventually:

```text
10B URLs
```

At huge scale, one database might not be enough.

We could shard by:

```text
shortCode
```

Conceptually:

```text
                shortCode
                    ↓
                  hash
                    ↓
          ┌─────────┼─────────┐
          ↓         ↓         ↓
       Shard 1   Shard 2   Shard 3
```

But **don't introduce sharding unless scale requires it.**

This is a major interview principle:

> **Don't add complexity without a requirement.**

---

# 20. The Architecture We've Built

Now our URL shortener looks something like:

```text
                           USERS
                             │
                             ▼
                            DNS
                             │
                             ▼
                     ┌──────────────┐
                     │Load Balancer │
                     └──────┬───────┘
                            │
                  ┌─────────┼─────────┐
                  ↓         ↓         ↓
                API #1    API #2    API #3
                  │         │         │
                  └─────────┼─────────┘
                            │
                            ▼
                         REDIS
                       /       \
                    HIT         MISS
                     │            │
                     │            ▼
                     │        DATABASE
                     │        ┌───────┐
                     │        │Primary│
                     │        └───┬───┘
                     │            │
                     │      replication
                     │            │
                     │       ┌──────┴──────┐
                     │       ▼             ▼
                     │   Replica 1     Replica 2
                     │
                     └───────────┐
                                 ▼
                              RESPONSE
```

---

# 21. How to Explain This in an Interview

Suppose the interviewer asks:

> **"How would you design the database layer?"**

Don't dump everything you've learned.

Say something like:

> "The core access pattern is a lookup from a short code to the original URL. I'd start with a key-value-oriented database because the access pattern is simple. I'd add an index if using a relational database. Since the system is read-heavy, I'd put frequently accessed URLs in Redis to reduce database load. If read traffic grows further, I'd introduce read replicas. At very large data volumes, I'd consider sharding based on the access pattern and a well-distributed shard key."

That's a **much stronger Senior-level answer**.

---

# 22. Golden Rules — Day 3 ⭐

### Rule 1

> **Database choice follows access patterns and requirements.**

### Rule 2

> **Indexes optimize reads but add write/storage cost.**

### Rule 3

> **Replication = copy data.**

### Rule 4

> **Sharding = split data.**

### Rule 5

> **Read-heavy systems → think cache + read replicas.**

### Rule 6

> **Don't shard prematurely.**

### Rule 7

> **Replication can introduce replication lag.**

### Rule 8

> **Every scaling technique introduces trade-offs.**

---

# 🧠 Day 3 Revision Sheet

If you're revising quickly before an interview:

```text
DATABASE
│
├── SQL
│   ├── Relationships
│   ├── Transactions
│   └── Complex queries
│
├── NoSQL
│   ├── Key-value/document access
│   ├── Horizontal scalability
│   └── High throughput use cases
│
├── INDEX
│   ├── Faster reads
│   ├── Extra storage
│   └── Slower writes
│
├── REPLICATION
│   ├── Copy data
│   ├── Read scalability
│   ├── Availability
│   └── Replication lag
│
└── SHARDING
    ├── Split data
    ├── Horizontal database scaling
    ├── Shard key
    └── Hot partitions / complexity
```

### The one thing I want permanently in your head:

```text
          MORE USERS
              ↓
        API overloaded?
              ↓
       Horizontal scale
              ↓
       DB overloaded?
              ↓
    ┌─────────┴─────────┐
    ↓                   ↓
Read-heavy?          Write/data-heavy?
    ↓                   ↓
Cache                 Sharding
Read replicas         Partitioning
Indexes               Queues
```

That's the **reasoning process** we're building.

---

## 🎯 Day 3 Exercise

Let's test whether you've actually understood it.

Our URL shortener now has:

```text
10 million requests/sec
90% are GET /:shortCode
10% are POST /shorten
```

The database is struggling.

The interviewer asks:

> **"How would you scale the database?"**

Give me your answer in **3–5 sentences**.

Don't worry about being perfect. I'll challenge your answer like an interviewer, and then we'll move to **Day 4: Caching, CDN, Message Queues & Asynchronous Systems**.

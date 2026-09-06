# System Design — Day 2

## Availability, Failures & Redundancy

Today we'll continue from the URL Shortener and turn the basic architecture into something that can **survive failures**.

---

# 1. The Interview Question

Yesterday we had:

```text
                    USER
                      ↓
               LOAD BALANCER
                      ↓
             ┌────────┼────────┐
             ↓        ↓        ↓
           API #1   API #2   API #3
             └────────┼────────┘
                      ↓
                 ┌────┴────┐
                 ↓         ↓
               Redis      DB
```

The interviewer asks:

> **"What happens if API Server #2 crashes?"**

### Answer

Ideally, **nothing noticeable happens to the user.**

The Load Balancer detects that API #2 is unhealthy and stops sending traffic to it.

```text
Before:

             Load Balancer
             /     |     \
            ↓      ↓      ↓
          API1    API2    API3
                  💥


After:

             Load Balancer
                /       \
               ↓         ↓
             API1       API3
```

This is the fundamental idea of **high availability**.

---

# 2. Availability ⭐⭐⭐⭐⭐

Availability means:

> **The system is operational and accessible when users need it.**

A highly available system should continue working even when some components fail.

### Example

If you have:

```text
API1
API2
API3
```

and API2 fails:

```text
API1 ✅
API2 ❌
API3 ✅
```

The system can still serve requests.

### Key principle

> **Avoid having a single component whose failure brings down the entire system.**

That component is called a:

## Single Point of Failure (SPOF)

---

# 3. Single Point of Failure ⭐⭐⭐⭐⭐

Consider:

```text
Users
  ↓
Load Balancer
  ↓
API Servers
```

What if you only have:

```text
Users
  ↓
ONE API Server
  ↓
Database
```

If the API server dies:

```text
Users
  ↓
💥
```

The entire application is unavailable.

The API server is a **single point of failure**.

---

## Remove the SPOF

Instead:

```text
Users
  ↓
Load Balancer
  ↓
┌──────┬──────┬──────┐
API1  API2   API3
```

Now one API server can fail without taking down the entire application.

---

# 4. Health Checks ⭐⭐⭐⭐

How does the Load Balancer know that API #2 is dead?

**Health checks.**

The API exposes something like:

```text
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

The Load Balancer periodically checks:

```text
Load Balancer
     │
     ├──→ API1 /health → 200 ✅
     │
     ├──→ API2 /health → 500 ❌
     │
     └──→ API3 /health → 200 ✅
```

It removes API2 from the traffic pool.

```text
              Load Balancer
                 /     \
                ↓       ↓
              API1     API3
```

### Interview phrase

> "I'd configure health checks so the load balancer can detect unhealthy instances and stop routing traffic to them."

---

# 5. But What If the Load Balancer Dies?

Excellent.

You now have:

```text
Users
  ↓
ONE Load Balancer
  ↓
API1 API2 API3
```

Technically, your Load Balancer is now a **SPOF**.

At production scale, the infrastructure should itself be redundant.

Conceptually:

```text
                 Users
                   ↓
            ┌──────┴──────┐
            ↓             ↓
        Load Balancer  Load Balancer
            1             2
             \           /
              \         /
               API Servers
```

Cloud providers generally manage this kind of redundancy for managed load-balancing services.

### Important interview lesson

Whenever you draw one component, ask:

> **"If this component dies, does my system die?"**

If yes → you've found a potential SPOF.

---

# 6. Database Is More Difficult

Now consider:

```text
                    Load Balancer
                         ↓
                    API Servers
                         ↓
                     Database
```

What happens if the database crashes?

```text
API1 ─┐
API2 ─┼──→ 💥 DATABASE
API3 ─┘
```

Your API servers are healthy.

Your Load Balancer is healthy.

But the application is effectively **down**.

The database is a SPOF.

---

# 7. Database Replication ⭐⭐⭐⭐⭐

We can create copies of the database.

```text
                  ┌──────────────┐
                  │   Primary    │
                  │   Database   │
                  └──────┬───────┘
                         │
                  replication
                         │
              ┌──────────┴──────────┐
              ↓                     ↓
         Replica #1             Replica #2
```

Now we have multiple copies.

### Why?

If a replica fails:

```text
Primary ✅
Replica 1 ❌
Replica 2 ✅
```

We still have data available.

---

# 8. Primary vs Replica

Typically:

### Primary

Handles writes:

```text
POST
PUT
PATCH
DELETE
```

### Replica

Can handle reads:

```text
GET
```

Example:

```text
                   API
                  /   \
                 /     \
             WRITE      READ
               ↓         ↓
            Primary    Replica
```

This gives us two benefits:

1. **Availability**
2. **Read scalability**

---

# 9. What If Primary Database Dies?

Now we have:

```text
                  Primary 💥
                     ↓
                  Replica
```

We need a mechanism to promote a replica to become the new primary.

Conceptually:

```text
Before:

Primary  💥
Replica 1
Replica 2


After:

New Primary ← Replica 1
Replica 2
```

This is called **failover**.

### Failover

> Automatically switching from a failed component to a healthy redundant component.

---

# 10. Database Failover

A simplified architecture:

```text
                      API
                       ↓
                Database Cluster
                       │
              ┌────────┴────────┐
              ↓                 ↓
           Primary           Replica
              │                 │
              └──── replication ┘
```

If Primary fails:

```text
                      API
                       ↓
                Database Cluster
                       │
                       ↓
                    Replica
                  (new primary)
```

The application continues working.

---

# 11. But There's a Problem

Replication isn't necessarily instantaneous.

Suppose:

```text
User creates URL
        ↓
Primary DB
        ↓
shortCode = aB92x
```

The replica hasn't received the update yet.

Then:

```text
GET /aB92x
       ↓
Replica
       ↓
NOT FOUND
```

Even though the data exists on the primary.

This introduces a concept called:

# Replication Lag ⭐⭐⭐⭐

The replica may temporarily be behind the primary.

```text
Primary:
A B C D E

Replica:
A B C
      ↑
   behind
```

This leads us toward **consistency**.

We'll cover that soon.

---

# 12. Availability vs Consistency

This is an important distinction.

### Availability

> Can I get a response?

### Consistency

> Does the response contain the latest correct data?

You can sometimes have:

```text
Available ✅
but
Not immediately consistent ⚠️
```

Example:

```text
Write → Primary

Immediately read → Replica

Replica hasn't caught up yet
```

You get a response, but it may contain stale data.

---

# 13. Back to Redis

Yesterday we had:

```text
API
 ↓
Redis
 ↓
Database
```

What if Redis crashes?

```text
API
 ↓
💥 Redis
```

Should the entire application go down?

**No.**

Redis is usually a **cache**, not the source of truth.

The API can fall back to the database:

```text
API
 ↓
Redis ❌
 ↓
Database
 ↓
Return data
```

Then Redis can be rebuilt/populated again.

### Important interview concept

> **A cache failure should ideally degrade performance, not destroy availability.**

Without Redis:

```text
System still works
        ↓
but
        ↓
Database receives more traffic
```

This is called **graceful degradation**.

---

# 14. Complete Architecture

Our URL shortener is becoming:

```text
                         USERS
                           │
                           ▼
                          DNS
                           │
                           ▼
                   LOAD BALANCER
                    /           \
                   /             \
                  ▼               ▼
              API #1           API #2
                  │               │
                  └───────┬───────┘
                          │
                          ▼
                        REDIS
                       /     \
                    HIT       MISS
                     │          │
                     │          ▼
                     │       DATABASE
                     │       CLUSTER
                     │      /         \
                     │ Primary       Replica
                     │
                     └───────┐
                             ▼
                          RESPONSE
```

If API #1 dies:

```text
API #1 ❌
API #2 ✅
```

System continues.

If Redis dies:

```text
Redis ❌
   ↓
Database
```

System continues, but slower.

If database primary dies:

```text
Primary ❌
   ↓
Replica promoted
```

System can continue after failover.

---

# 15. The Failure Mindset ⭐⭐⭐⭐⭐

This is one of the biggest differences between junior and senior system design.

A junior might draw:

```text
User → API → DB
```

A senior asks:

```text
What if API dies?
What if DB dies?
What if Redis dies?
What if network fails?
What if traffic suddenly increases?
What if one region goes down?
What if a dependency becomes slow?
```

You don't need to solve every failure immediately.

But **you should actively look for them.**

---

# 16. Important Terms From Today

| Term                     | Meaning                                                 |
| ------------------------ | ------------------------------------------------------- |
| **Availability**         | System remains operational                              |
| **SPOF**                 | Component whose failure can bring down system           |
| **Redundancy**           | Multiple components performing/supporting same role     |
| **Health Check**         | Detect whether component is healthy                     |
| **Failover**             | Switch to backup when primary fails                     |
| **Replication**          | Copy data between database instances                    |
| **Primary**              | Usually handles writes                                  |
| **Replica**              | Copy that can serve reads                               |
| **Replication Lag**      | Replica temporarily behind primary                      |
| **Graceful Degradation** | System continues with reduced performance/functionality |
| **Consistency**          | Reads reflect the appropriate/latest state              |

---

# 🧠 Interview Cheat Sheet

### Q: What happens if an API server fails?

> Load balancer health checks detect the unhealthy instance and stop routing traffic to it. Other API instances continue serving requests.

### Q: How do you avoid a single point of failure?

> Use redundancy and multiple instances across failure domains.

### Q: What if the database fails?

> Use database replication and automated failover so a healthy replica can be promoted.

### Q: Why use replicas?

> To improve read scalability and provide redundancy/failover.

### Q: What happens if Redis fails?

> Treat Redis as a cache rather than the source of truth. Fall back to the database, accepting higher latency and database load.

### Q: What is replication lag?

> The delay between data being written to the primary and becoming available on a replica.

---

# ⭐ What You Should Memorize

Don't memorize all the diagrams.

Memorize this chain:

```text
Multiple API Servers
        ↓
   Load Balancer
        ↓
    Health Checks
        ↓
    No SPOF
```

And:

```text
Primary DB
    ↓
Replication
    ↓
Replica
    ↓
Failover
```

And:

```text
Redis failure
     ↓
Fallback to DB
     ↓
Slower system
     ↓
But system remains available
```

### The senior-level principle

> **Design for failure. Assume every component can eventually fail.**

---

## 📝 Quick Practice

Before we move to Day 3, answer these in your own words:

**1.** What's the difference between **horizontal scaling** and **redundancy**?

**2.** Why does having 3 API servers improve availability?

**3.** What happens when the primary database fails?

**4.** Why shouldn't Redis normally be treated as the source of truth?

**5.** What is replication lag?

You don't need perfect answers. **I'll correct them, then we'll move into Day 3: Database Design + SQL/NoSQL + Indexes + Replication + Sharding.**

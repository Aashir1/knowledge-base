
# 19. Query Optimization Basics ⭐⭐⭐⭐⭐

Query optimization is about making the database do **less unnecessary work**.

The mental model is:

```text
Slow Query
   ↓
What is the database doing?
   ↓
Scanning too many rows?
   ↓
Can an index be used?
   ↓
Is the WHERE condition index-friendly?
   ↓
Is the application making too many queries?
   ↓
Is pagination becoming expensive?
```

Think:

> **Reduce the amount of data scanned, reduce unnecessary work, and reduce unnecessary queries.**

---

# 1. Avoid Full Table Scans ⭐⭐⭐⭐⭐

## What is it?

A full table scan means the database examines **a large portion or all rows** in a table to find matching records.

Example:

```sql
SELECT *
FROM users
WHERE email = 'john@example.com';
```

If `email` has no useful index, the database may need to check:

```text
Row 1 → no
Row 2 → no
Row 3 → no
...
Row 1,000,000 → yes
```

That's a lot of work.

With an appropriate index:

```sql
CREATE INDEX idx_users_email
ON users(email);
```

the database may be able to find the matching row much more efficiently.

---

## Mental Model

```text
Full Table Scan

1M rows
   ↓
Check rows
   ↓
Find matching rows
```

vs.

```text
Index

Query
  ↓
Index
  ↓
Locate matching rows
  ↓
Read required rows
```

Think:

> **Don't search the whole book when the index can take you to the page.**

---

## Important Senior Point

⚠️ **A full table scan is not automatically bad.**

Suppose:

```sql
SELECT *
FROM users;
```

If you need almost every row, using an index may actually be more expensive than scanning the table sequentially.

The real goal is:

> **Avoid unnecessary full scans when a more efficient access path exists.**

The database optimizer decides between things like:

```text
Index Scan
Index Only Scan
Sequential / Full Table Scan
```

based on estimated cost.

---

## How Do You Find Out?

Use:

```sql
EXPLAIN
```

or:

```sql
EXPLAIN ANALYZE
```

Example:

```sql
EXPLAIN ANALYZE
SELECT *
FROM users
WHERE email = 'john@example.com';
```

Look at the actual execution plan rather than assuming an index will be used.

---

## Memory Trick

```text
Full Scan = Check many/all rows
```

---

## Interview Questions & Answers

### Q1. Is a full table scan always bad?

**Answer**

No. If a query needs a large percentage of the table, a sequential scan can be cheaper than using an index.

### Q2. How do you determine whether a query is scanning the whole table?

**Answer**

Use `EXPLAIN` or `EXPLAIN ANALYZE` and inspect the execution plan for a sequential/full table scan.

### Q3. How can you reduce unnecessary full scans?

**Answer**

Use appropriate indexes, write index-friendly predicates, select only required data, and verify the execution plan.

---

# 2. SARGable Queries ⭐⭐⭐⭐⭐

## What is SARGable?

SARGable means the query condition is written in a way that allows the database to efficiently use an index to search for rows.

Think:

```text
SARGable
   ↓
Search ARGument able
   ↓
Database can use an index efficiently
```

---

## Example — Non-SARGable

Suppose:

```sql
CREATE INDEX idx_users_email
ON users(email);
```

This query may prevent efficient use of that index:

```sql
SELECT *
FROM users
WHERE LOWER(email) = 'john@example.com';
```

Why?

Because the database is being asked to apply:

```text
LOWER(email)
```

to the column before comparing it.

---

## Better

If your application stores emails normalized to lowercase:

```sql
SELECT *
FROM users
WHERE email = 'john@example.com';
```

Now the indexed column is compared directly.

---

## Another Common Example

Suppose:

```sql
CREATE INDEX idx_orders_created_at
ON orders(created_at);
```

❌ Potentially non-SARGable:

```sql
WHERE DATE(created_at) = '2026-08-06'
```

The database has to apply `DATE()` to the column.

Instead, use a range:

```sql
WHERE created_at >= '2026-08-06'
  AND created_at < '2026-08-07'
```

Now the indexed column can be searched using a range.

---

## Another Example — Leading Wildcard

Index:

```sql
CREATE INDEX idx_users_name
ON users(name);
```

Potentially problematic:

```sql
WHERE name LIKE '%john%'
```

The leading `%` means the database cannot efficiently navigate a normal B-Tree index from the beginning of the value.

But:

```sql
WHERE name LIKE 'john%'
```

can often use a suitable B-Tree index because the search has a known prefix.

---

## Mental Model

Think:

```text
❌ Transform the column
WHERE FUNCTION(column) = value

❌ Hide the beginning of the value
WHERE column LIKE '%value'

✅ Compare the indexed column directly
WHERE column = value

✅ Use ranges
WHERE created_at >= ...
AND created_at < ...
```

The general principle:

> **Make the indexed column easy for the database to search.**

---

## Important Senior Point

"SARGable" does **not** mean:

> "Every function on a column makes an index impossible."

Database behavior varies, and some databases support functional/expression indexes.

For example, PostgreSQL can create:

```sql
CREATE INDEX idx_users_lower_email
ON users (LOWER(email));
```

Then:

```sql
WHERE LOWER(email) = 'john@example.com'
```

can potentially use that expression index.

So the senior-level answer is:

> **Prefer predicates that allow the optimizer to use normal indexes efficiently, but understand that functional indexes and database-specific optimizations can handle some otherwise non-SARGable expressions.**

---

## Memory Trick

```text
SARGable = Index-friendly WHERE condition
```

---

## Interview Questions & Answers

### Q1. What does SARGable mean?

**Answer**

It means a search predicate is written in a form that allows the database to efficiently use an index to locate matching rows.

### Q2. Give an example of a non-SARGable query.

**Answer**

For an indexed `created_at` column:

```sql
WHERE DATE(created_at) = '2026-08-06'
```

A range predicate is generally more index-friendly:

```sql
WHERE created_at >= '2026-08-06'
AND created_at < '2026-08-07'
```

### Q3. Does using a function always prevent index usage?

**Answer**

No. It can prevent use of a normal index, but some databases support expression/functional indexes that can index the computed expression.

---

# 3. N+1 Query Problem ⭐⭐⭐⭐⭐

## What is it?

The N+1 problem happens when the application executes:

```text
1 query
+
N additional queries
```

instead of retrieving the required data efficiently.

This is especially common when loading related data.

---

## Example

Suppose we want:

```text
Customers
   ↓
Orders
```

Application does:

```sql
SELECT *
FROM customers;
```

Returns 100 customers.

Then the application loops:

```javascript
for (const customer of customers) {
    await db.query(
        'SELECT * FROM orders WHERE customer_id = ?',
        [customer.id]
    );
}
```

Queries:

```text
1 customer query
+
100 order queries
=
101 queries
```

That's the **N+1 problem**.

---

## Mental Model

```text
N+1

Get customers
     ↓
100 customers
     ↓
Query orders for customer 1
Query orders for customer 2
Query orders for customer 3
...
Query orders for customer 100
```

The database isn't necessarily slow because each query is slow.

The problem is:

> **We are making too many round trips.**

---

## Better Approach — JOIN

Often you can retrieve the related data with one query:

```sql
SELECT
    c.id,
    c.name,
    o.id AS order_id,
    o.amount
FROM customers c
LEFT JOIN orders o
    ON o.customer_id = c.id;
```

Instead of:

```text
101 queries
```

you may have:

```text
1 query
```

---

## Another Approach — Batch Query

Sometimes a JOIN isn't the best solution.

You can fetch IDs first:

```sql
SELECT *
FROM customers;
```

Then retrieve orders in one query:

```sql
SELECT *
FROM orders
WHERE customer_id IN (1, 2, 3, ...);
```

Then group the results in application code.

```text
2 queries
instead of
101 queries
```

---

## Senior Full-Stack Connection

N+1 can happen at several layers:

```text
React
  ↓
API
  ↓
ORM
  ↓
Database
```

For example, an ORM may look innocent:

```javascript
const users = await User.findAll();

for (const user of users) {
    user.orders = await user.getOrders();
}
```

But internally it can generate:

```text
1 + N SQL queries
```

So as a senior developer, don't only inspect SQL manually.

Also understand what your:

```text
ORM
GraphQL resolvers
Data access layer
API
```

are generating.

---

## How to Detect It?

Look for:

```text
Repeated similar SQL queries
+
Queries executed inside loops
+
Large number of DB round trips
```

Database query logs and APM tools can help identify this.

---

## Memory Trick

```text
N+1 = 1 query + N repeated queries
```

---

## Interview Questions & Answers

### Q1. What is the N+1 problem?

**Answer**

It's when an application performs one query to retrieve a set of records and then performs another query for each record, resulting in N+1 database queries.

### Q2. How do you solve N+1?

**Answer**

Common solutions are JOINs, eager loading, batching with `IN`, or a DataLoader-style batching approach depending on the architecture.

### Q3. Can an ORM cause N+1?

**Answer**

Yes. Lazy-loaded relationships or queries inside loops can generate N+1 queries even when the application code doesn't explicitly show many SQL statements.

---

# 4. Pagination — OFFSET vs Cursor ⭐⭐⭐⭐⭐

Pagination becomes important when a table contains:

```text
100K
1M
100M+
```

rows.

You don't want:

```sql
SELECT *
FROM orders;
```

Instead, return a limited number of rows.

---

# OFFSET Pagination

## What is it?

Use:

```sql
LIMIT
OFFSET
```

Example:

```sql
SELECT *
FROM orders
ORDER BY created_at DESC
LIMIT 20
OFFSET 100;
```

Meaning:

```text
Skip 100 rows
Then return 20 rows
```

---

## Mental Model

```text
Page 1
OFFSET 0
→ rows 1-20

Page 2
OFFSET 20
→ rows 21-40

Page 3
OFFSET 40
→ rows 41-60
```

Simple and easy to implement.

---

## Advantages

✅ Simple

✅ Easy to understand

✅ Good for traditional page-number UIs

```text
1  2  3  4  5  ... 100
```

---

## Problem at Large Offsets

Consider:

```sql
LIMIT 20 OFFSET 1,000,000
```

The database may need to walk past a large number of rows before returning the next 20.

So:

```text
Small OFFSET
   ↓
Usually fine

Large OFFSET
   ↓
More work
   ↓
Potentially slower
```

---

## Another Problem — Changing Data

Imagine:

```text
Page 1 → rows A B C D
```

A new row is inserted before page 2 is fetched.

The next OFFSET may now point to a different position.

This can cause:

```text
Duplicates
Missing rows
```

when data changes between requests.

---

# Cursor Pagination

## What is it?

Instead of saying:

> "Skip 1,000,000 rows."

you say:

> "Give me the next 20 rows after this specific record."

Example:

```sql
SELECT *
FROM orders
WHERE created_at < '2026-08-06 10:00:00'
ORDER BY created_at DESC
LIMIT 20;
```

The value:

```text
2026-08-06 10:00:00
```

acts as the cursor.

---

## Mental Model

```text
First request
    ↓
Get first 20
    ↓
Last row = cursor
    ↓
Send cursor to API
    ↓
Next request
    ↓
Get rows after cursor
```

Think:

```text
OFFSET

"Skip N rows"


CURSOR

"Continue from here"
```

---

## Better Cursor — Use a Stable Unique Ordering

Using only:

```sql
ORDER BY created_at DESC
```

can be problematic if multiple rows have the same timestamp.

A common approach is to use:

```text
created_at + id
```

as a deterministic ordering/cursor.

For example:

```sql
SELECT *
FROM orders
WHERE (created_at, id) < ('2026-08-06 10:00:00', 500)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

The exact syntax and implementation can vary by database.

The important concept is:

> **Cursor pagination needs a stable, deterministic ordering.**

---

## OFFSET vs Cursor

|                 | OFFSET           | Cursor       |
| --------------- | ---------------- | ------------ |
| Simple          | ✅                | ❌            |
| Page numbers    | ✅                | Usually ❌    |
| Large datasets  | ❌ Can degrade    | ✅ Better     |
| Deep pagination | ❌ Expensive      | ✅ Efficient  |
| Changing data   | Can cause shifts | More stable  |
| Infinite scroll | Possible         | ⭐ Excellent  |
| Implementation  | Easy             | More complex |

---

## Mental Model

```text
OFFSET
   ↓
"Skip N"

Cursor
   ↓
"Continue from here"
```

---

## Senior Full-Stack Example

For an admin dashboard:

```text
Page 1
Page 2
Page 3
Page 4
```

OFFSET pagination may be perfectly reasonable.

For:

```text
Infinite scroll
Social feed
Large transaction history
Large event stream
```

cursor pagination is usually a better fit.

---

## Important Senior Point

Cursor pagination is **not automatically better for every use case**.

Choose based on the UX and query pattern:

```text
Traditional page navigation
        ↓
OFFSET can be appropriate

Large dataset + infinite scroll
        ↓
Cursor is usually better
```

---

## Memory Trick

```text
OFFSET = Skip

CURSOR = Continue
```

---

# 🧠 Query Optimization Mental Model

These four concepts are connected.

Don't memorize them separately:

```text
                 Query Performance
                        │
       ┌────────────────┼─────────────────┐
       ↓                ↓                 ↓
   Too many rows   Bad predicates     Too many queries
       │                │                 │
       ↓                ↓                 ↓
Full scan          SARGable           N+1
       │                │                 │
       └────────────────┼─────────────────┘
                        ↓
                  Query optimization
                        │
                        ↓
                  Pagination
                        │
                        ↓
              Don't retrieve unnecessary
                     large datasets
```

A simpler mental model:

```text
1. Scan less
      ↓
   Indexes / good access paths

2. Search efficiently
      ↓
   SARGable predicates

3. Query less
      ↓
   Avoid N+1

4. Return less
      ↓
   Good pagination
```

This is the **big picture**.

---

# ⚠️ Common Mistakes

### 1. "Full table scan = bad"

Not always.

A scan can be the best plan when retrieving a large percentage of a table.

---

### 2. "Add an index to fix every slow query"

Not necessarily.

The problem could be:

```text
Bad query
N+1
Too much data
Poor pagination
Incorrect joins
Missing statistics
```

Always inspect the execution plan.

---

### 3. Applying functions blindly to indexed columns

Potentially problematic:

```sql
WHERE DATE(created_at) = ...
```

Prefer a range when appropriate:

```sql
WHERE created_at >= ...
AND created_at < ...
```

---

### 4. Fixing N+1 by making one enormous JOIN

A JOIN can solve N+1, but don't blindly join every related table.

Consider:

```text
Result size
Duplicated rows
Memory usage
Network payload
Query complexity
```

Sometimes batching is better.

---

### 5. Assuming cursor pagination means "just use ID"

This:

```sql
WHERE id > 100
```

works for some use cases, but cursor pagination needs a **stable ordering** that matches the business requirement.

---

### 6. Using OFFSET for millions of rows without thinking about it

```sql
OFFSET 5000000
```

may require substantial work.

For deep pagination, cursor/keyset pagination is often more appropriate.

---

# 🚀 Module 6 — One-Page Revision

| Topic            | Remember                                             |
| ---------------- | ---------------------------------------------------- |
| Full Table Scan  | Database examines many/all rows                      |
| Avoid Full Scan  | Don't scan unnecessarily; verify with execution plan |
| SARGable         | Index-friendly search predicate                      |
| N+1              | 1 query + N repeated queries                         |
| N+1 Fix          | JOIN, eager loading, batching                        |
| OFFSET           | Skip N rows                                          |
| Cursor           | Continue from a known position                       |
| Large Pagination | Cursor/keyset usually scales better                  |
| Index            | Helps reduce rows that must be examined              |

---

# 🎯 Module 6 — Interview Quick Fire

### 1. Is a full table scan always bad?

No. It can be the cheapest plan when a large portion of the table is needed.

### 2. What does SARGable mean?

A predicate written so the database can efficiently use an index to search for matching rows.

### 3. Give a non-SARGable example.

```sql
WHERE DATE(created_at) = '2026-08-06'
```

A range on `created_at` is generally more index-friendly.

### 4. What is N+1?

One query retrieves N records, followed by one additional query per record.

### 5. How do you fix N+1?

Use JOINs, eager loading, batching, or DataLoader-style batching depending on the architecture.

### 6. OFFSET vs Cursor?

OFFSET skips rows; cursor pagination continues from a known position.

### 7. Why can OFFSET become slow?

Large offsets may require the database to process/skip many preceding rows before returning the requested page.

### 8. Why is cursor pagination better for large datasets?

It can jump directly to the next range using an indexed ordering value instead of repeatedly skipping an increasingly large number of rows.

### 9. Is cursor pagination always better?

No. OFFSET is simpler and can be perfectly appropriate for smaller datasets and page-number-based UIs.

### 10. How do you investigate a slow query?

Start with `EXPLAIN` / `EXPLAIN ANALYZE`, inspect the execution plan, look at rows scanned vs returned, indexes used, joins, sorting, and then measure the impact of changes.

---

# 🧠 30-Second Interview Response

> **For query optimization, I first look at the execution plan rather than assuming what's slow. I want to avoid unnecessary full table scans by using appropriate indexes and index-friendly, SARGable predicates. I also look for N+1 problems, especially when using ORMs or loading relationships in loops, and solve them with joins, eager loading, or batching. For pagination, OFFSET is simple and works well for traditional page-based UIs, but for large datasets and infinite scrolling I'd generally prefer cursor or keyset pagination because it avoids increasingly expensive large offsets.**

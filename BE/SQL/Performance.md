Absolutely. For Module 6, the core mental model should be:

> **Indexes are a shortcut for finding rows without examining the whole table.**

Then understand the different index types as different ways of building that shortcut.

# Module 6 — Performance

Performance is mainly about answering:

```text
Why is this query slow?
        ↓
How is the database finding the rows?
        ↓
Can an index help?
        ↓
Is the index actually being used?
        ↓
Is the query itself written efficiently?
```

For indexes, keep this mental model:

```text
Without Index
─────────────
Query
  ↓
Scan many/all rows
  ↓
Find matching rows


With Index
──────────
Query
  ↓
Use index
  ↓
Find matching row locations
  ↓
Read required rows
```

Think of an index like the **index of a book**:

> Instead of reading every page, you jump closer to where the information is.

---

# 17. Indexes ⭐⭐⭐⭐⭐

## What is an Index?

An index is a separate data structure that helps the database **find rows faster**.

Example:

```sql
SELECT *
FROM users
WHERE email = 'john@example.com';
```

Without an index on `email`, the database may need to examine many rows.

With:

```sql
CREATE INDEX idx_users_email
ON users(email);
```

the database can use the index to locate matching rows much faster.

---

## Mental Model

Think:

```text
Table
────────────────────
1 → John
2 → Sarah
3 → Mike
4 → Alex
5 → David
...
1,000,000 rows


Index
────────────────────
john@example.com  → row 1
sarah@example.com → row 2
mike@example.com  → row 3
...
```

The index is organized to make searching efficient.

But there is an important trade-off:

```text
Index
  ↓
Faster reads
  +
More storage
  +
Slower INSERT/UPDATE/DELETE
```

Why?

Because when the table changes, the database may also need to update the indexes.

---

## When Should You Consider an Index?

Indexes are especially useful for columns frequently used in:

```text
WHERE
JOIN
ORDER BY
sometimes GROUP BY
```

Example:

```sql
SELECT *
FROM orders
WHERE customer_id = 100;
```

An index on:

```sql
customer_id
```

may make this query much faster.

---

## Important Senior Point

> **Don't index every column.**

Every index has a cost.

```text
More indexes
     ↓
Faster some reads
     ↓
More disk usage
     ↓
More work on writes
```

The right question is:

> **"Which queries need to be fast?"**

Not:

> "Which columns can I index?"

---

# B-Tree Index ⭐⭐⭐⭐⭐

## What is it?

B-Tree is the **general-purpose index structure** and the common default for many relational databases, including PostgreSQL.

It is useful for values that can be ordered.

Examples:

```text
=
<
>
<=
>=
BETWEEN
ORDER BY
```

Example:

```sql
CREATE INDEX idx_users_age
ON users(age);
```

Query:

```sql
SELECT *
FROM users
WHERE age > 30;
```

The database can navigate the index instead of scanning every row.

---

## Mental Model

Think of a sorted tree:

```text
                 50
               /    \
             25      75
            /  \    /  \
          10   35  60   90
```

Instead of checking every value:

```text
10
11
12
13
...
90
```

the database navigates through the tree to narrow down the search.

The important idea is:

> **B-Tree allows efficient searching through ordered data.**

---

## Good Use Cases

```sql
WHERE id = 100

WHERE salary > 5000

WHERE created_at BETWEEN ... AND ...

ORDER BY created_at
```

---

## Memory Trick

```text
B-Tree = Ordered Search
```

---

## Interview Questions & Answers

### Q1. Why are B-Tree indexes useful?

**Answer**

They maintain ordered index entries, making equality, range queries, and many ordering operations efficient.

### Q2. What is the main trade-off of indexes?

**Answer**

Indexes improve reads but consume storage and add overhead to inserts, updates, and deletes because the index must also be maintained.

### Q3. Can an index always make a query faster?

**Answer**

No. If the query returns a large percentage of the table, an index may be less efficient than a sequential scan. The optimizer chooses the plan based on estimated cost.

---

# Composite Index ⭐⭐⭐⭐⭐

## What is it?

A composite index is an index on **multiple columns**.

```sql
CREATE INDEX idx_orders_customer_status
ON orders(customer_id, status);
```

The index is ordered by:

```text
customer_id
     ↓
status
```

---

## Mental Model

Think of a filing system:

```text
Customer
   ↓
Status
   ↓
Rows
```

So:

```text
customer_id = 10
       ↓
status = 'pending'
       ↓
matching orders
```

---

## Why Column Order Matters

Consider:

```sql
CREATE INDEX idx_orders
ON orders(customer_id, status);
```

This is designed around:

```text
customer_id → status
```

A query such as:

```sql
WHERE customer_id = 10
AND status = 'pending'
```

is a natural match.

A query using only:

```sql
WHERE customer_id = 10
```

can also often benefit.

But:

```sql
WHERE status = 'pending'
```

does not get the same benefit from the leading `customer_id` column.

### Mental Model

```text
Index:
(customer_id, status)

Think:

customer_id
     ↓
   status
```

The **leading/leftmost column matters**.

---

## Example

```sql
CREATE INDEX idx_orders_customer_status
ON orders(customer_id, status);
```

Good:

```sql
WHERE customer_id = 10
```

Good:

```sql
WHERE customer_id = 10
AND status = 'pending'
```

Potentially less useful:

```sql
WHERE status = 'pending'
```

---

## Important Senior Point

Don't blindly say:

> "Composite indexes always require all columns."

They don't.

The optimizer can use an index based on the query and index structure. The key interview concept is:

> **Column order matters, especially the leading columns.**

---

## Memory Trick

```text
Composite = Multiple columns

Leftmost column = Important
```

---

## Interview Questions & Answers

### Q1. Why does column order matter in a composite index?

**Answer**

The index is organized according to the column order. Queries that use the leading column(s) can generally make better use of the index.

### Q2. `(customer_id, status)` vs `(status, customer_id)` — are they the same?

**Answer**

No. They contain the same columns but have different ordering, so they can support different query patterns efficiently.

### Q3. How do you decide the order?

**Answer**

Based on real query patterns, filtering, joins, sorting, and selectivity—not simply by choosing the most selective column first.

---

# Covering Index ⭐⭐⭐⭐

## What is it?

A covering index contains **all the columns needed by a query**, allowing the database to potentially answer the query directly from the index without fetching the table rows.

Example:

```sql
SELECT customer_id, status
FROM orders
WHERE customer_id = 10;
```

Index:

```sql
CREATE INDEX idx_orders_customer_status
ON orders(customer_id, status);
```

The index contains everything the query needs:

```text
WHERE
customer_id

SELECT
customer_id
status
```

So the database may perform an **index-only scan** instead of reading the table rows.

---

## Mental Model

Normally:

```text
Query
  ↓
Index
  ↓
Find row
  ↓
Go to table
  ↓
Get data
```

Covering index can allow:

```text
Query
  ↓
Index
  ↓
Get everything needed
  ↓
Done
```

Fewer table accesses can improve performance.

---

## PostgreSQL Example — INCLUDE

PostgreSQL supports `INCLUDE` columns:

```sql
CREATE INDEX idx_orders_customer
ON orders(customer_id)
INCLUDE (status, total);
```

Now a query such as:

```sql
SELECT status, total
FROM orders
WHERE customer_id = 10;
```

may be able to use an index-only scan.

Important:

> `INCLUDE` columns are stored in the index for retrieval but are not part of the index's search ordering.

---

## Memory Trick

```text
Covering Index
      ↓
Index has everything query needs
```

---

## Interview Questions & Answers

### Q1. What is a covering index?

**Answer**

An index that contains all columns required by a query, allowing the database to potentially satisfy the query from the index without accessing the base table.

### Q2. Does a covering index always eliminate table access?

**Answer**

No. The optimizer may still choose another plan, and index-only scans can depend on database-specific visibility/storage conditions.

### Q3. Why can covering indexes improve performance?

**Answer**

They can reduce table lookups and therefore reduce I/O.

---

# Partial Index ⭐⭐⭐⭐

## What is it?

A partial index indexes **only rows matching a condition**.

Example:

```sql
CREATE INDEX idx_orders_pending
ON orders(customer_id)
WHERE status = 'pending';
```

Instead of indexing every order:

```text
All orders
──────────────
pending
completed
cancelled
failed
...
```

the index contains only:

```text
Pending orders
──────────────
customer_id
```

---

## Mental Model

```text
Full Index
──────────────
Indexes every row


Partial Index
──────────────
Indexes only important subset
```

This can make the index:

```text
Smaller
  ↓
Less storage
  ↓
Less maintenance
  ↓
Potentially faster for matching queries
```

---

## Example

Suppose 95% of orders are completed:

```text
95% → completed
5%  → pending
```

And the application frequently queries:

```sql
SELECT *
FROM orders
WHERE status = 'pending'
AND customer_id = 100;
```

A partial index can be useful:

```sql
CREATE INDEX idx_pending_orders_customer
ON orders(customer_id)
WHERE status = 'pending';
```

---

## Important Point

The query needs to match the partial-index predicate for the index to be useful.

Think:

```text
Index:
WHERE status = 'pending'

Query:
WHERE status = 'pending'
AND customer_id = 100
```

The query is asking for the same subset.

---

## Memory Trick

```text
Partial = Index only some rows
```

---

## Interview Questions & Answers

### Q1. What is a partial index?

**Answer**

An index created only for rows satisfying a specific condition.

### Q2. Why use a partial index?

**Answer**

To keep the index smaller and focused on frequently queried subsets of data, reducing storage and maintenance overhead.

### Q3. When is a partial index useful?

**Answer**

When a query frequently targets a relatively small subset, such as active users, pending orders, or non-deleted records.

---

# 🧠 Index Types — Mental Model

Don't memorize them as four unrelated terms.

Think:

```text
                 INDEX
                   │
       ┌───────────┼────────────┐
       ↓           ↓            ↓
    B-Tree     Composite     Partial
       │           │            │
   How data     Multiple      Which rows
   is ordered   columns       are indexed
                   │
                   ↓
               Covering
                   │
                   ↓
            What data query
            can get from index
```

Or simply:

```text
B-Tree
→ How is the data organized?

Composite
→ How many columns?

Covering
→ Does the index contain everything I need?

Partial
→ Do I need to index every row?
```

---

# ⚠️ Common Index Mistakes

### 1. Indexing everything

```text
❌ Add index to every column
```

Indexes have storage and write-maintenance costs.

---

### 2. Ignoring composite index order

```sql
(customer_id, status)
```

is not equivalent to:

```sql
(status, customer_id)
```

for query planning purposes.

---

### 3. Assuming indexes are always faster

For queries returning a large portion of a table, a sequential scan can be cheaper.

---

### 4. Creating indexes without looking at queries

Start with:

```text
What queries are slow?
        ↓
What does EXPLAIN say?
        ↓
Would an index help?
        ↓
Measure again
```

---

### 5. Forgetting write performance

Every additional index can add work to:

```text
INSERT
UPDATE
DELETE
```

---

# 🚀 Module 6 — One-Page Revision

| Topic               | Remember                                  |
| ------------------- | ----------------------------------------- |
| **Index**           | Shortcut for finding rows                 |
| **B-Tree**          | Ordered/general-purpose index             |
| **Composite**       | Index on multiple columns                 |
| **Column Order**    | Leading columns matter                    |
| **Covering**        | Index contains everything query needs     |
| **Index-only Scan** | Query can potentially avoid table access  |
| **Partial**         | Index only rows matching a condition      |
| **Trade-off**       | Faster reads, more storage/write overhead |

---

# 🎯 Module 6 — Interview Quick Fire

### 1. What is an index?

A data structure that helps the database find rows efficiently without scanning the entire table.

### 2. What is the main trade-off of indexes?

They improve reads but consume storage and add write overhead.

### 3. What is a B-Tree?

A general-purpose ordered index structure suitable for equality, range, and many ordering operations.

### 4. What is a composite index?

An index containing multiple columns.

### 5. Why does composite index order matter?

Because the index is organized according to the column order, so leading columns strongly influence which queries can use it efficiently.

### 6. What is a covering index?

An index containing all columns required by a query, potentially allowing an index-only scan.

### 7. What is a partial index?

An index containing only rows satisfying a specified condition.

### 8. Can an index make a query slower?

The index itself adds maintenance overhead to writes, and the optimizer may choose a sequential scan when that is cheaper for a particular query.

### 9. Should every WHERE column have an index?

No. Indexes should be based on actual query patterns, data distribution, and measured performance.

### 10. How do you know whether an index is actually helping?

Use the database's query plan tools, such as `EXPLAIN` / `EXPLAIN ANALYZE`, and compare the resulting performance.

---

# 🧠 30-Second Interview Response

> **An index is a data structure that helps the database locate rows efficiently instead of scanning the whole table. B-Tree is the common general-purpose index and works well for equality and range queries. Composite indexes cover multiple columns, where column order matters because the leading columns determine which query patterns can use the index efficiently. A covering index contains all the data needed by a query and can enable an index-only scan. A partial index indexes only rows matching a condition, which is useful for frequently queried subsets. The main trade-off is that indexes improve read performance but consume storage and add overhead to writes, so I would create them based on actual query patterns and verify their impact with EXPLAIN ANALYZE.**

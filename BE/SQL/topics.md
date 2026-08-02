# SQL Syllabus for Senior Full Stack Developer (20 Topics)

## Module 1 — Query Fundamentals

1. SQL execution order
2. WHERE, HAVING, DISTINCT, CASE, COALESCE
3. EXISTS vs IN vs ANY
4. UNION vs UNION ALL

---

## Module 2 — Joins ⭐⭐⭐⭐⭐

5. INNER, LEFT, RIGHT, FULL, SELF JOIN
6. Multi-table joins
7. Anti Join & Semi Join patterns

---

## Module 3 — Aggregation

8. GROUP BY
9. HAVING
10. Aggregate functions (COUNT, SUM, AVG, MIN, MAX)

---

## Module 4 — Advanced Queries ⭐⭐⭐⭐⭐

11. Subqueries
12. Common Table Expressions (CTEs)
13. Window Functions

* ROW_NUMBER
* RANK
* DENSE_RANK
* LAG
* LEAD
* Running Total

---

## Module 5 — Database Design

14. Relationships (1:1, 1:N, N:N)
15. Normalization (up to 3NF)
16. Constraints (PK, FK, UNIQUE, CHECK)

---

## Module 6 — Performance ⭐⭐⭐⭐⭐

17. Indexes

* B-Tree
* Composite
* Covering
* Partial (basic idea)

18. EXPLAIN / EXPLAIN ANALYZE
19. Query optimization basics

* Avoid full table scans
* SARGable queries
* N+1 problem
* Pagination (OFFSET vs Cursor)

---

## Module 7 — Transactions ⭐⭐⭐⭐⭐

20.

* ACID
* Transactions
* Isolation Levels
* Row Locking (`FOR UPDATE`)
* Deadlocks (concept)
* MVCC (basic understanding)

---

## Optional (Only if using PostgreSQL heavily)

* JSONB
* GIN Index
* Materialized Views
* Full Text Search

---

## What is **NOT** Important for Most Full Stack Interviews

You can safely skip these unless you're interviewing for a database-focused backend role:

* GROUPING SETS
* ROLLUP
* CUBE
* Recursive CTE (unless specifically required)
* Triggers
* Stored Procedures (know what they are)
* BRIN/GiST indexes
* Partitioning implementation details
* Sharding implementation
* Replication internals

---

## Priority (80/20)

If you master just these, you'll be ahead of most candidates:

1. SQL execution order
2. Joins
3. GROUP BY & HAVING
4. Window Functions
5. CTEs
6. Indexes
7. EXPLAIN ANALYZE
8. Transactions
9. Isolation Levels
10. Database Design
11. Query Optimization
12. Pagination

**This is the syllabus I'd recommend for your background (8+ years full stack with Node.js/React/PostgreSQL).** It's focused on what senior full-stack engineers are actually expected to know in interviews and day-to-day work, without drifting into DBA territory.

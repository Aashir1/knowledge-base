# Module 4 — Advanced Queries ⭐⭐⭐⭐⭐

> **Core idea:**
> **Subquery = query inside a query**
> **CTE = named temporary query result**
> **Window function = calculate across related rows without collapsing them**

This module is especially important for senior interviews because these techniques solve problems that are awkward with basic `GROUP BY` and `JOIN`.

---

# 1. Subqueries ⭐⭐⭐⭐⭐

## What is it?

A **subquery** is a query nested inside another SQL query.

```sql
SELECT *
FROM employees
WHERE salary > (
    SELECT AVG(salary)
    FROM employees
);
```

The inner query calculates the average salary, and the outer query finds employees above it.

---

## Mental Model

```text
Outer Query
    ↓
Needs a value/result
    ↓
Inner Query
    ↓
Provides that result
```

---

## Common Types

### Scalar Subquery

Returns **one value**.

```sql
SELECT *
FROM employees
WHERE salary > (
    SELECT AVG(salary)
    FROM employees
);
```

### Multi-row Subquery

Returns multiple values.

```sql
SELECT *
FROM employees
WHERE department_id IN (
    SELECT id
    FROM departments
    WHERE location = 'Toronto'
);
```

### Correlated Subquery ⭐⭐⭐⭐⭐

The inner query refers to the **outer query**.

```sql
SELECT e.name, e.salary
FROM employees e
WHERE e.salary > (
    SELECT AVG(e2.salary)
    FROM employees e2
    WHERE e2.department_id = e.department_id
);
```

Meaning:

> Find employees earning more than the average salary **of their own department**.

---

## Key Points

* Scalar → one value
* Multi-row → multiple values
* Correlated → inner query depends on outer row
* Correlated subqueries may execute repeatedly, so check the execution plan for performance.

---

## Memory Trick

> **Subquery = Ask SQL another question first.**

---

## Interview Q&A

### Q1. What is a correlated subquery?

> A correlated subquery references a column from the outer query, so its result depends on the current outer row.

### Q2. Subquery vs JOIN?

> A JOIN combines related datasets, while a subquery is useful when one query needs the result of another. The optimizer may transform them into similar execution plans, so readability and performance should guide the choice.

### Q3. Can a subquery return multiple rows?

> Yes, depending on how it's used. Operators like `IN`, `EXISTS`, `ANY`, or `ALL` are designed for multi-row subqueries.

---

# 2. Common Table Expressions (CTEs) ⭐⭐⭐⭐⭐

## What is it?

A **CTE** gives a name to a query result that you can reference in the main query.

```sql
WITH department_stats AS (
    SELECT department_id,
           AVG(salary) AS avg_salary
    FROM employees
    GROUP BY department_id
)
SELECT *
FROM department_stats
WHERE avg_salary > 7000;
```

---

## Mental Model

Think:

```text
Complex Query
     ↓
Break into named steps
     ↓
WITH step1 AS (...)
     ↓
WITH step2 AS (...)
     ↓
Final SELECT
```

---

## Why use CTEs?

Main benefits:

* Readability
* Break complex queries into logical steps
* Reuse a result within the same statement
* Recursive queries

---

## Multiple CTEs

```sql
WITH active_users AS (
    SELECT *
    FROM users
    WHERE status = 'ACTIVE'
),
user_orders AS (
    SELECT user_id, COUNT(*) AS total_orders
    FROM orders
    GROUP BY user_id
)
SELECT *
FROM active_users u
JOIN user_orders o
ON u.id = o.user_id;
```

---

## Recursive CTE ⭐⭐⭐

Used for hierarchical data.

Examples:

```text
Employee
  ↓
Manager
  ↓
Director
```

or:

```text
Category
  ↓
Subcategory
  ↓
Product
```

Basic structure:

```sql
WITH RECURSIVE hierarchy AS (
    -- anchor
    SELECT ...

    UNION ALL

    -- recursive part
    SELECT ...
    FROM hierarchy
    ...
)
SELECT *
FROM hierarchy;
```

You don't need to master recursive CTE implementation for most full-stack interviews; understand **what problem it solves**.

---

## Key Points

* CTE starts with `WITH`
* Makes complex queries easier to read
* Can have multiple CTEs
* Recursive CTE handles hierarchical data
* A CTE is **not automatically a temporary table**
* Don't assume CTEs always improve performance; optimization behavior depends on the database/version/query.

---

## Memory Trick

> **CTE = Name a query, then use it.**

---

## Interview Q&A

### Q1. CTE vs subquery?

> A CTE gives a complex query a name and makes multi-step SQL easier to read and maintain. A subquery is usually embedded directly inside another query.

### Q2. Does CTE improve performance?

> Not necessarily. CTEs primarily improve readability and structure. The optimizer determines the actual execution strategy.

### Q3. When would you use a recursive CTE?

> For hierarchical or tree-like data such as employee-manager relationships, categories, or organizational structures.

---

# 3. Window Functions ⭐⭐⭐⭐⭐

## What is it?

A window function performs a calculation across related rows **without collapsing them into one row**.

This is the key difference from `GROUP BY`.

---

## GROUP BY vs Window Function

### GROUP BY

```sql
SELECT department,
       AVG(salary)
FROM employees
GROUP BY department;
```

Result:

```text
IT       7500
HR       6000
```

Rows are **collapsed**.

---

### Window Function

```sql
SELECT name,
       department,
       salary,
       AVG(salary) OVER (
           PARTITION BY department
       ) AS dept_avg
FROM employees;
```

Result:

```text
Alice    IT    8000    7500
Bob      IT    7000    7500
Sara     HR    6000    6000
```

Original rows remain.

---

## Mental Model

> **GROUP BY = Collapse rows**
> **Window = Keep rows + calculate across them**

---

## Basic Syntax

```sql
function() OVER (
    PARTITION BY ...
    ORDER BY ...
)
```

### PARTITION BY

Defines the group/window.

### ORDER BY

Defines the order within the window.

---

## Memory Trick

> **Window = Calculate across rows without losing them.**

---

# 4. ROW_NUMBER ⭐⭐⭐⭐⭐

## What is it?

Assigns a **unique sequential number** to each row.

```sql
SELECT name,
       department,
       salary,
       ROW_NUMBER() OVER (
           PARTITION BY department
           ORDER BY salary DESC
       ) AS row_num
FROM employees;
```

Result:

```text
IT      Alice    9000    1
IT      Bob      8000    2
IT      John     8000    3
HR      Sara     7000    1
HR      Mike     6000    2
```

Even if salaries are equal, row numbers are different.

---

## Most Important Use Case ⭐⭐⭐⭐⭐

### Top 1 per group

```sql
WITH ranked AS (
    SELECT *,
           ROW_NUMBER() OVER (
               PARTITION BY department
               ORDER BY salary DESC
           ) AS rn
    FROM employees
)
SELECT *
FROM ranked
WHERE rn = 1;
```

Returns the highest-paid employee from each department.

---

## Memory Trick

> **ROW_NUMBER = Every row gets a unique number.**

---

# 5. RANK ⭐⭐⭐⭐⭐

## What is it?

Assigns the same rank to tied values and **leaves gaps** after ties.

```sql
SELECT name,
       salary,
       RANK() OVER (
           ORDER BY salary DESC
       ) AS rank
FROM employees;
```

Example:

```text
Salary    Rank
9000       1
8000       2
8000       2
7000       4
```

Notice:

```text
1 → 2 → 2 → 4
```

Rank `3` is skipped.

---

## Memory Trick

> **RANK = Ties share rank, gaps appear.**

---

# 6. DENSE_RANK ⭐⭐⭐⭐⭐

## What is it?

Same ranking behavior for ties, but **doesn't leave gaps**.

```text
Salary    DENSE_RANK
9000         1
8000         2
8000         2
7000         3
```

Compare:

```text
ROW_NUMBER:
1  2  3  4

RANK:
1  2  2  4

DENSE_RANK:
1  2  2  3
```

---

## Memory Trick

> **DENSE_RANK = RANK without gaps.**

---

## ⭐ Must Memorize This Comparison

| Function     | Ties? | Gaps? |
| ------------ | ----- | ----- |
| `ROW_NUMBER` | No    | No    |
| `RANK`       | Yes   | Yes   |
| `DENSE_RANK` | Yes   | No    |

---

## Interview Q&A

### Q1. ROW_NUMBER vs RANK?

> `ROW_NUMBER` always gives each row a unique number. `RANK` gives tied rows the same rank and skips the next rank.

### Q2. RANK vs DENSE_RANK?

> Both give tied rows the same rank, but `RANK` leaves gaps while `DENSE_RANK` doesn't.

### Q3. How would you find the second-highest salary?

Using `DENSE_RANK`:

```sql
WITH ranked AS (
    SELECT *,
           DENSE_RANK() OVER (
               ORDER BY salary DESC
           ) AS rnk
    FROM employees
)
SELECT *
FROM ranked
WHERE rnk = 2;
```

This handles duplicate salaries correctly.

---

# 7. LAG ⭐⭐⭐⭐

## What is it?

Returns a value from a **previous row**.

```sql
SELECT month,
       revenue,
       LAG(revenue) OVER (
           ORDER BY month
       ) AS previous_revenue
FROM sales;
```

Result:

```text
Month    Revenue    Previous
Jan      1000       NULL
Feb      1200       1000
Mar      1500       1200
```

---

## Common Use

Calculate change from previous row:

```sql
SELECT month,
       revenue,
       revenue - LAG(revenue) OVER (
           ORDER BY month
       ) AS change
FROM sales;
```

---

## Memory Trick

> **LAG = Look backward**

---

# 8. LEAD ⭐⭐⭐⭐

## What is it?

Opposite of `LAG`.

Returns a value from the **next row**.

```sql
SELECT month,
       revenue,
       LEAD(revenue) OVER (
           ORDER BY month
       ) AS next_revenue
FROM sales;
```

Result:

```text
Month    Revenue    Next
Jan      1000       1200
Feb      1200       1500
Mar      1500       NULL
```

---

## Memory Trick

> **LEAD = Look forward**

---

## LAG vs LEAD

```text
LAG  ← Previous row
LEAD → Next row
```

---

## Interview Q&A

### Q1. When would you use LAG?

> To compare the current row with a previous row, such as month-over-month revenue or previous transaction status.

### Q2. LAG vs LEAD?

> `LAG` accesses a previous row; `LEAD` accesses a following row.

---

# 9. Running Total ⭐⭐⭐⭐⭐

## What is it?

A running total continuously accumulates values as rows progress.

Example:

```text
Date    Amount    Running Total
Jan       100         100
Feb       200         300
Mar       150         450
```

---

## Query

```sql
SELECT date,
       amount,
       SUM(amount) OVER (
           ORDER BY date
           ROWS BETWEEN UNBOUNDED PRECEDING
                    AND CURRENT ROW
       ) AS running_total
FROM transactions;
```

---

## Mental Model

```text
Current row
+
Everything before it
=
Running total
```

---

## Key Points

The important part is:

```sql
SUM(amount) OVER (
    ORDER BY date
)
```

For interview understanding, know that the window frame determines exactly which rows are included. Explicitly specifying `ROWS` can avoid surprises when there are duplicate ordering values.

---

## Per Customer Running Total

```sql
SELECT customer_id,
       date,
       amount,
       SUM(amount) OVER (
           PARTITION BY customer_id
           ORDER BY date
           ROWS BETWEEN UNBOUNDED PRECEDING
                    AND CURRENT ROW
       ) AS running_total
FROM transactions;
```

Now each customer has their own running total.

---

## Memory Trick

> **Running Total = SUM + ORDER BY + Window**

---

# 🎯 Module 4 — One-Page Revision

| Topic               | Remember                                      |
| ------------------- | --------------------------------------------- |
| Subquery            | Query inside another query                    |
| Correlated Subquery | Inner query depends on outer row              |
| CTE                 | Name a query result using `WITH`              |
| Recursive CTE       | Hierarchical/tree data                        |
| Window Function     | Calculate across rows without collapsing them |
| `ROW_NUMBER`        | Unique sequential number                      |
| `RANK`              | Ties + gaps                                   |
| `DENSE_RANK`        | Ties + no gaps                                |
| `LAG`               | Previous row                                  |
| `LEAD`              | Next row                                      |
| Running Total       | `SUM() OVER (ORDER BY ...)`                   |

### ⭐ The most important comparison

```text
GROUP BY
→ Collapse rows

WINDOW FUNCTION
→ Keep rows + calculate
```

### Ranking

```text
ROW_NUMBER  → 1, 2, 3, 4
RANK        → 1, 2, 2, 4
DENSE_RANK  → 1, 2, 2, 3
```

### Navigation

```text
LAG  → ← previous
LEAD → → next
```

---

# 🎯 Senior Interview Quick Fire

### 1. Subquery vs CTE?

> A subquery is nested directly inside another query, while a CTE gives a query result a name using `WITH`, making complex multi-step queries easier to read and maintain.

### 2. What is a correlated subquery?

> A subquery that references the outer query, so its result depends on the current outer row.

### 3. What is a window function?

> A function that calculates across a set of related rows while keeping the individual rows in the result.

### 4. GROUP BY vs Window Function?

> `GROUP BY` collapses rows into groups. Window functions calculate across rows but preserve the original rows.

### 5. ROW_NUMBER vs RANK vs DENSE_RANK?

> `ROW_NUMBER` gives every row a unique number. `RANK` gives ties the same rank and leaves gaps. `DENSE_RANK` gives ties the same rank without gaps.

### 6. When would you use LAG?

> To compare a row with a previous row, such as calculating month-over-month changes.

### 7. LAG vs LEAD?

> `LAG` accesses a previous row; `LEAD` accesses a following row.

### 8. How do you calculate a running total?

> Use `SUM()` as a window function with an `ORDER BY`, typically with an explicit `ROWS` frame when deterministic row-by-row accumulation matters.

### 9. How do you get the top employee from each department?

> Use `ROW_NUMBER()` partitioned by department and ordered by salary descending, then filter for `row_number = 1`.

### 10. How do you get the second-highest distinct salary?

> Use `DENSE_RANK()` ordered by salary descending and filter for rank `2`.

---

## 🧠 30-Second Mental Summary

> **Subquery** gets a result for another query.
> **CTE** names a query so complex SQL can be broken into steps.
> **Window functions** calculate across rows without removing them.
> **ROW_NUMBER** gives unique positions, **RANK** allows ties with gaps, and **DENSE_RANK** allows ties without gaps.
> **LAG** looks backward, **LEAD** looks forward, and a running total uses `SUM()` over an ordered window.

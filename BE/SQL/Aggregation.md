
---

# 8. GROUP BY ⭐⭐⭐⭐⭐

## What is it?

`GROUP BY` combines rows with the same value into **groups**, usually so aggregate functions can calculate something per group.

```sql
SELECT department, COUNT(*)
FROM employees
GROUP BY department;
```

Result:

```text
IT        10
HR         5
Finance    8
```

---

## Mental Model

Think:

```text
Rows
 ↓
GROUP BY
 ↓
Groups
 ↓
Aggregate function
 ↓
Summary
```

Example:

```text
Employees
──────────────
IT
IT
HR
IT
HR

GROUP BY department

        ↓

IT  → 3
HR  → 2
```

---

## Key Points

* Every selected column must either be:

  * included in `GROUP BY`, or
  * wrapped in an aggregate function.
* `GROUP BY` usually works with `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`.
* It can group by multiple columns.

### Multiple columns

```sql
SELECT department, role, COUNT(*)
FROM employees
GROUP BY department, role;
```

This creates groups based on the **combination** of `department + role`.

---

## Common Mistake

❌

```sql
SELECT department, name, COUNT(*)
FROM employees
GROUP BY department;
```

`name` isn't grouped or aggregated.

✅

```sql
SELECT department, COUNT(*)
FROM employees
GROUP BY department;
```

---

## Memory Trick

> **GROUP BY = Make buckets**

---

## Interview Q&A

### Q1. What does GROUP BY do?

**Answer:**

> `GROUP BY` divides rows into groups based on one or more columns, allowing aggregate functions to calculate a value for each group.

### Q2. Can you select a column that isn't in GROUP BY?

**Answer:**

> Generally no, unless the column is inside an aggregate function. Some databases have special functional-dependency rules, but I wouldn't rely on that in portable SQL.

### Q3. Can you GROUP BY multiple columns?

**Answer:**

> Yes. SQL groups by the unique combination of those columns.

---

# 9. HAVING ⭐⭐⭐⭐⭐

You've already seen this in Module 1, but here its role in aggregation is important.

## What is it?

`HAVING` filters **groups after aggregation**.

```sql
SELECT department, COUNT(*) AS total
FROM employees
GROUP BY department
HAVING COUNT(*) > 5;
```

Meaning:

> Group employees by department, then keep only departments with more than 5 employees.

---

## Mental Model

```text
FROM
 ↓
WHERE       → Filter rows
 ↓
GROUP BY    → Create groups
 ↓
Aggregate   → Calculate
 ↓
HAVING      → Filter groups
```

---

## WHERE vs HAVING

| `WHERE`                         | `HAVING`           |
| ------------------------------- | ------------------ |
| Filters rows                    | Filters groups     |
| Before `GROUP BY`               | After `GROUP BY`   |
| Doesn't normally use aggregates | Can use aggregates |

### Example

```sql
SELECT department, COUNT(*) AS total
FROM employees
WHERE status = 'ACTIVE'
GROUP BY department
HAVING COUNT(*) > 5;
```

Here:

```text
WHERE  → only ACTIVE employees
GROUP BY → create department groups
HAVING → keep departments with > 5 active employees
```

---

## Common Mistake

❌

```sql
WHERE COUNT(*) > 5
```

Aggregate filtering belongs in `HAVING`.

---

## Memory Trick

> **WHERE = filter rows, HAVING = filter groups**

---

## Interview Q&A

### Q1. Why can't we use `COUNT()` in WHERE?

**Answer:**

> `WHERE` filters rows before aggregation happens, so the aggregate result doesn't exist yet. `HAVING` runs after grouping and aggregation.

### Q2. Can HAVING be used without GROUP BY?

**Answer:**

> Yes. Without `GROUP BY`, the entire result can be treated as one group.

---

# 10. Aggregate Functions ⭐⭐⭐⭐⭐

Aggregate functions take **multiple rows and produce a single value per group**.

The five you must know:

```text
COUNT
SUM
AVG
MIN
MAX
```

---

# COUNT()

Counts rows or non-NULL values.

### COUNT(*)

```sql
SELECT COUNT(*)
FROM employees;
```

Counts **all rows**.

### COUNT(column)

```sql
SELECT COUNT(email)
FROM employees;
```

Counts only rows where `email` is **not NULL**.

### COUNT(DISTINCT)

```sql
SELECT COUNT(DISTINCT department)
FROM employees;
```

Counts unique departments.

### ⭐ Important

```text
COUNT(*)              → all rows
COUNT(column)         → non-NULL values
COUNT(DISTINCT column) → unique non-NULL values
```

---

## Interview Q&A

### Q1. Difference between COUNT(*) and COUNT(column)?

**Answer:**

> `COUNT(*)` counts rows, including rows containing NULLs. `COUNT(column)` counts only rows where that column is not NULL.

---

# SUM()

Adds numeric values.

```sql
SELECT SUM(salary)
FROM employees;
```

Per department:

```sql
SELECT department, SUM(salary)
FROM employees
GROUP BY department;
```

### Important

`SUM()` ignores NULL values.

---

# AVG()

Calculates the average of non-NULL numeric values.

```sql
SELECT AVG(salary)
FROM employees;
```

### Important

```text
AVG(salary)
=
SUM(non-NULL salaries) / COUNT(non-NULL salaries)
```

So NULL values aren't treated as `0`.

---

## Common Mistake

If salaries are:

```text
5000
6000
NULL
```

Average is:

```text
5500
```

not:

```text
3666.67
```

---

# MIN()

Returns the minimum value.

```sql
SELECT MIN(salary)
FROM employees;
```

Can work with numbers, dates, and comparable values.

---

# MAX()

Returns the maximum value.

```sql
SELECT MAX(salary)
FROM employees;
```

Common use:

```sql
SELECT MAX(created_at)
FROM orders;
```

Finds the latest date.

---

# Conditional Aggregation ⭐⭐⭐⭐⭐

This is **very important for senior interviews**.

Combine `CASE` with aggregate functions.

### Example

Count active vs inactive users:

```sql
SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) AS active,
    SUM(CASE WHEN status = 'INACTIVE' THEN 1 ELSE 0 END) AS inactive
FROM users;
```

You can think:

```text
CASE → decide
SUM/COUNT → aggregate
```

---

## Another Example

```sql
SELECT department,
       SUM(CASE WHEN salary > 10000 THEN 1 ELSE 0 END) AS high_earners
FROM employees
GROUP BY department;
```

---

## Memory Trick

> **CASE decides, Aggregate counts/calculates.**

---

# NULL Behavior — Must Know

| Function        | NULL behavior               |
| --------------- | --------------------------- |
| `COUNT(*)`      | Counts NULL-containing rows |
| `COUNT(column)` | Ignores NULL                |
| `SUM(column)`   | Ignores NULL                |
| `AVG(column)`   | Ignores NULL                |
| `MIN(column)`   | Ignores NULL                |
| `MAX(column)`   | Ignores NULL                |

One important exception:

If there are **no non-NULL values**, `SUM`, `AVG`, `MIN`, and `MAX` generally return `NULL`, not `0`.

Use:

```sql
COALESCE(SUM(amount), 0)
```

when you need zero.

---

# 🎯 Module 3 — One-Page Revision

| Topic              | Remember                      |
| ------------------ | ----------------------------- |
| `GROUP BY`         | Creates groups/buckets        |
| `HAVING`           | Filters groups                |
| `COUNT(*)`         | Counts rows                   |
| `COUNT(column)`    | Counts non-NULL values        |
| `COUNT(DISTINCT)`  | Counts unique non-NULL values |
| `SUM()`            | Adds values                   |
| `AVG()`            | Average of non-NULL values    |
| `MIN()`            | Smallest/earliest value       |
| `MAX()`            | Largest/latest value          |
| `CASE + Aggregate` | Conditional aggregation       |

### The pattern to memorize

```sql
SELECT group_column,
       COUNT(*),
       SUM(amount),
       AVG(amount)
FROM table
WHERE row_condition
GROUP BY group_column
HAVING COUNT(*) > 5;
```

Think:

> **Filter rows → Group → Calculate → Filter groups**

---

# 🎯 Senior Interview Quick Fire

### 1. What is GROUP BY?

> It groups rows with the same values so aggregate functions can calculate a result for each group.

### 2. WHERE vs HAVING?

> `WHERE` filters individual rows before grouping; `HAVING` filters groups after aggregation.

### 3. COUNT(*) vs COUNT(column)?

> `COUNT(*)` counts rows, while `COUNT(column)` ignores NULL values.

### 4. Does AVG include NULL values?

> No. `AVG()` ignores NULL values when calculating the average.

### 5. How do you count only active users?

> Use conditional aggregation, for example `SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END)`.

### 6. Can GROUP BY contain multiple columns?

> Yes. It groups by the unique combination of those columns.

### 7. What happens when SUM has only NULL values?

> It returns NULL, so use `COALESCE(SUM(amount), 0)` if zero is required.

### 8. Why is conditional aggregation important?

> It lets us calculate multiple business metrics in a single query, such as total, active, inactive, or high-value records.

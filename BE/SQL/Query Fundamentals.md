
---

# Module 1 — Query Fundamentals

This module teaches **how SQL thinks** before we move to Joins, Window Functions, Indexes, and Query Optimization.

---

# 1. SQL Execution Order ⭐⭐⭐⭐⭐

## What is it?

Although we **write** SQL in one order, the database **executes** it in a different order.

Knowing this explains many SQL errors and interview questions.

---

## Why do we use it?

Understanding execution order helps you:

* Write correct queries
* Debug SQL errors
* Understand why aliases sometimes don't work
* Optimize queries

---

## Mental Model

Imagine searching employees.

```text
1. Get all employees
2. Remove unwanted employees
3. Make groups
4. Remove unwanted groups
5. Pick columns
6. Remove duplicates
7. Sort
8. Return rows
```

The database thinks like this—not like the query is written.

---

## Execution Order

| Step | Clause       | Purpose           |
| ---- | ------------ | ----------------- |
| 1    | FROM / JOIN  | Load data         |
| 2    | WHERE        | Filter rows       |
| 3    | GROUP BY     | Create groups     |
| 4    | HAVING       | Filter groups     |
| 5    | SELECT       | Choose columns    |
| 6    | DISTINCT     | Remove duplicates |
| 7    | ORDER BY     | Sort              |
| 8    | LIMIT/OFFSET | Return final rows |

---

## Example

```sql
SELECT department,
       COUNT(*) AS total
FROM employees
WHERE salary > 5000
GROUP BY department
HAVING COUNT(*) > 3
ORDER BY total DESC
LIMIT 5;
```

Database executes as:

```text
FROM
 ↓
WHERE
 ↓
GROUP BY
 ↓
HAVING
 ↓
SELECT
 ↓
ORDER BY
 ↓
LIMIT
```

---

## Key Points

✅ SQL execution ≠ SQL writing order

✅ WHERE executes before SELECT

✅ HAVING executes after GROUP BY

✅ ORDER BY happens almost at the end

---

## Common Mistakes

❌ Using SELECT alias inside WHERE

```sql
SELECT salary*12 AS annual_salary
FROM employees
WHERE annual_salary > 50000;
```

Correct

```sql
WHERE salary*12 > 50000;
```

---

## Memory Trick

```
FROM
WHERE
GROUP BY
HAVING
SELECT
DISTINCT
ORDER BY
LIMIT
```

Remember:

> **Find Workers, Group Happy Selected Data Ordered Last**

---

## Interview Questions & Answers

### Q1. Why can't we use aliases in WHERE?

**Answer**

Because `WHERE` executes before `SELECT`. The alias is created during the `SELECT` phase, so it doesn't exist when `WHERE` runs.

---

### Q2. Which executes first: WHERE or GROUP BY?

**Answer**

`WHERE` executes first to filter rows. Then `GROUP BY` groups the remaining rows.

---

### Q3. Which executes first: ORDER BY or SELECT?

**Answer**

`SELECT` executes before `ORDER BY`, which is why `ORDER BY` can use column aliases.

---

# 2. WHERE vs HAVING ⭐⭐⭐⭐⭐

## What is it?

Both filter data.

The difference is **what** they filter.

---

## Mental Model

```
Rows
 ↓
WHERE
 ↓
GROUP BY
 ↓
HAVING
```

**WHERE filters rows**

**HAVING filters groups**

---

## Example

### WHERE

```sql
SELECT *
FROM employees
WHERE salary > 5000;
```

Removes employees earning less than 5000.

---

### HAVING

```sql
SELECT department,
COUNT(*)
FROM employees
GROUP BY department
HAVING COUNT(*) > 5;
```

Removes departments having 5 or fewer employees.

---

## Key Points

✅ WHERE works before grouping

✅ HAVING works after grouping

✅ WHERE cannot use aggregate functions

✅ HAVING is mainly used with aggregate functions

---

## Common Mistake

Wrong

```sql
WHERE COUNT(*) > 5
```

Correct

```sql
HAVING COUNT(*) > 5
```

---

## Memory Trick

```
WHERE → Rows

HAVING → Groups
```

---

## Interview Questions & Answers

### Q1. Difference between WHERE and HAVING?

**Answer**

`WHERE` filters rows before grouping, while `HAVING` filters grouped data after aggregation.

---

### Q2. Can HAVING be used without GROUP BY?

**Answer**

Yes. If there's no `GROUP BY`, the entire result set is treated as one group, though it's uncommon.

---

### Q3. Why can't aggregate functions be used in WHERE?

**Answer**

Because `WHERE` executes before aggregation. Aggregate values don't exist yet.

---

# 3. DISTINCT ⭐⭐⭐

## What is it?

Removes duplicate rows from the result.

---

## Example

Table

```
Sales
Sales
IT
HR
```

Query

```sql
SELECT DISTINCT department
FROM employees;
```

Result

```
Sales
IT
HR
```

---

## Key Points

✅ Removes duplicate result rows

✅ Works on selected columns

✅ Duplicate check happens after SELECT

✅ May increase execution time because duplicates must be removed

---

## Common Mistake

```sql
SELECT DISTINCT department,salary
```

Duplicates are checked on **both columns together**, not just `department`.

---

## Memory Trick

```
DISTINCT = UNIQUE rows
```

---

## Interview Questions & Answers

### Q1. Does DISTINCT remove duplicate rows or duplicate values?

**Answer**

It removes duplicate rows based on the selected columns.

---

### Q2. Is DISTINCT expensive?

**Answer**

It can be. The database usually needs to sort or hash the result to eliminate duplicates.

---

# 4. CASE ⭐⭐⭐⭐

## What is it?

SQL's **if-else** statement.

---

## Example

```sql
SELECT name,
CASE
WHEN salary>10000 THEN 'High'
WHEN salary>5000 THEN 'Medium'
ELSE 'Low'
END AS level
FROM employees;
```

---

## Key Points

✅ Conditional logic

✅ Used inside SELECT

✅ Can also be used in ORDER BY

✅ Useful for reports

---

## Common Uses

* Categorization
* Conditional aggregation
* Custom sorting
* Dynamic labels

---

## Memory Trick

```
CASE = if...else
```

---

## Interview Questions & Answers

### Q1. Where can CASE be used?

**Answer**

Inside `SELECT`, `ORDER BY`, `GROUP BY`, and aggregate expressions. It provides conditional logic within SQL.

---

### Q2. Why is CASE useful?

**Answer**

It allows business logic, such as classifying employees into salary bands or conditionally calculating values, without additional application code.

---

# 5. COALESCE ⭐⭐⭐⭐

## What is it?

Returns the **first non-NULL value**.

---

## Example

```sql
SELECT
COALESCE(phone,mobile,'No Number')
FROM customers;
```

---

Another example

```sql
SELECT salary + COALESCE(bonus,0)
FROM employees;
```

---

## Key Points

✅ Handles NULL safely

✅ Takes multiple arguments

✅ Returns the first non-NULL value

✅ Commonly used in reports and calculations

---

## Common Mistake

Without COALESCE

```
5000 + NULL = NULL
```

With COALESCE

```
5000 + 0 = 5000
```

---

## Memory Trick

```
COALESCE

↓

First Available Value
```

---

## Interview Questions & Answers

### Q1. Why use COALESCE?

**Answer**

To replace `NULL` with a default value, preventing incorrect results or `NULL` propagation in calculations.

---

### Q2. Difference between COALESCE and CASE?

**Answer**

`COALESCE` is specifically for handling `NULL` values, while `CASE` is a general-purpose conditional expression.

---

# 6. EXISTS vs IN vs ANY ⭐⭐⭐⭐⭐

## Mental Model

```
IN

↓

Checks values


EXISTS

↓

Checks whether rows exist


ANY

↓

Compares with at least one value
```

---

## IN

```sql
WHERE department_id IN (1,2,3)
```

Use for **known value lists**.

---

## EXISTS

```sql
WHERE EXISTS(
SELECT 1
FROM orders o
WHERE o.customer_id=c.id
)
```

Use when checking whether related rows exist.

---

## ANY

```sql
WHERE salary > ANY(
SELECT salary
FROM managers
)
```

Means

```
Greater than at least one manager's salary.
```

---

## Key Points

| Operator | Best Use              |
| -------- | --------------------- |
| IN       | Known value list      |
| EXISTS   | Related row existence |
| ANY      | Comparison with a set |

---

## Performance

Modern databases (like PostgreSQL and MySQL) often optimize `IN` and `EXISTS` into similar execution plans. Choose the one that best expresses your intent unless profiling shows a difference.

---

## Memory Trick

```
IN

↓

Values

EXISTS

↓

Rows

ANY

↓

At least one
```

---

## Interview Questions & Answers

### Q1. EXISTS vs IN?

**Answer**

`IN` compares against a list of values, while `EXISTS` checks whether matching rows exist. `EXISTS` is commonly used with correlated subqueries.

---

### Q2. What does ANY mean?

**Answer**

It compares a value against a set and returns true if the comparison succeeds for at least one value in that set.

---

# 7. UNION vs UNION ALL ⭐⭐⭐⭐

## What is it?

Both combine the results of multiple queries.

---

## UNION

```sql
SELECT city FROM customers

UNION

SELECT city FROM suppliers;
```

Duplicates removed.

---

## UNION ALL

```sql
SELECT city FROM customers

UNION ALL

SELECT city FROM suppliers;
```

Duplicates kept.

---

## Key Points

| UNION                          | UNION ALL        |
| ------------------------------ | ---------------- |
| Removes duplicates             | Keeps duplicates |
| Slower                         | Faster           |
| Uses extra work to deduplicate | Simple append    |

---

## Best Practice

> Prefer **UNION ALL** unless duplicate removal is required.

---

## Memory Trick

```
UNION

↓

Unique

UNION ALL

↓

Everything
```

---

## Interview Questions & Answers

### Q1. UNION vs UNION ALL?

**Answer**

`UNION` removes duplicate rows, while `UNION ALL` preserves them. Since `UNION` performs deduplication, it is generally slower.

---

### Q2. Which one should we prefer?

**Answer**

Use `UNION ALL` by default if duplicates are acceptable. It's more efficient because it skips the deduplication step.

---

# 🚀 Module 1 — One-Page Revision

| Topic               | Remember                                                                  |
| ------------------- | ------------------------------------------------------------------------- |
| SQL Execution Order | `FROM → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT` |
| WHERE               | Filters rows before grouping                                              |
| HAVING              | Filters groups after grouping                                             |
| DISTINCT            | Removes duplicate result rows                                             |
| CASE                | SQL's `if...else`                                                         |
| COALESCE            | Returns the first non-NULL value                                          |
| IN                  | Compare against known values                                              |
| EXISTS              | Check if matching rows exist                                              |
| ANY                 | Compare with at least one value from a set                                |
| UNION               | Combine results and remove duplicates                                     |
| UNION ALL           | Combine results and keep duplicates                                       |

## 🎯 Module 1 Interview Quick Fire

1. **Why can't aliases be used in `WHERE`?**

   * Because `WHERE` executes before `SELECT`.

2. **`WHERE` vs `HAVING`?**

   * `WHERE` filters rows; `HAVING` filters groups.

3. **When do you use `DISTINCT`?**

   * To remove duplicate result rows.

4. **What is `CASE` used for?**

   * Conditional logic (`if...else`) inside SQL.

5. **Why use `COALESCE`?**

   * To replace `NULL` with the first available value.

6. **`EXISTS` vs `IN`?**

   * `IN` checks values; `EXISTS` checks for matching rows.

7. **What does `ANY` do?**

   * Compares against a set and succeeds if **at least one** value matches.

8. **`UNION` vs `UNION ALL`?**

   * `UNION` removes duplicates; `UNION ALL` keeps duplicates and is usually faster.

# Module 2 — JOINs ⭐⭐⭐⭐⭐

> **Goal:** Learn how to combine data from multiple tables efficiently. JOINs are among the most frequently asked SQL interview topics because almost every real-world application uses relational data.

---

# 1. What is a JOIN?

## What is it?

A **JOIN** combines rows from two or more tables based on a related column.

Example:

```text
Users
+----+--------+
| id | name   |
+----+--------+
| 1  | Alice  |
| 2  | Bob    |
+----+--------+

Orders
+----+---------+--------+
| id | user_id | amount |
+----+---------+--------+
|101 |    1    | 100    |
|102 |    1    | 250    |
|103 |    2    | 150    |
+----+---------+--------+
```

```sql
SELECT u.name, o.amount
FROM users u
JOIN orders o
ON u.id = o.user_id;
```

Result

```text
Alice   100
Alice   250
Bob     150
```

---

## Why do we use JOINs?

Most databases are **normalized**, meaning related data is stored in separate tables.

Instead of storing:

```text
Order
--------------
Order ID
User Name
User Email
Amount
```

We store

```text
Users
Orders
```

and JOIN them whenever needed.

---

## Mental Model

Imagine two Excel sheets.

JOIN means:

> **"Match rows where the keys are equal."**

Usually

```text
users.id = orders.user_id
```

---

# Types of JOINs

```text
                LEFT TABLE

     +---------------------------+
     |                           |
     |       INNER               |
     |     +-----------+         |
     |     |           |         |
     |     |           |         |
     |-----+-----------+---------|
           RIGHT TABLE
```

---

# 2. INNER JOIN ⭐⭐⭐⭐⭐

## What is it?

Returns **only matching rows** from both tables.

---

Example

```sql
SELECT u.name,
       o.amount
FROM users u
INNER JOIN orders o
ON u.id = o.user_id;
```

Result

```text
Alice   100
Alice   250
Bob     150
```

If a user has no orders, they won't appear.

---

## Key Points

✅ Most commonly used JOIN

✅ Returns intersection only

✅ Default JOIN means INNER JOIN

```sql
JOIN
```

is the same as

```sql
INNER JOIN
```

---

## Common Mistake

Thinking unmatched rows are included.

They're not.

---

## Memory Trick

> **INNER = Only Common Records**

---

## Interview Questions & Answers

### Q1. Difference between JOIN and INNER JOIN?

**Answer**

None. `JOIN` defaults to `INNER JOIN`.

---

### Q2. When do you use INNER JOIN?

**Answer**

When only records with matching values in both tables are needed.

---

# 3. LEFT JOIN ⭐⭐⭐⭐⭐

## What is it?

Returns

* all rows from the **left table**
* matching rows from the right table

If no match exists,

Right-side columns become NULL.

---

Example

Users

```text
Alice
Bob
Charlie
```

Orders

```text
Alice
Bob
```

Query

```sql
SELECT u.name,
       o.amount
FROM users u
LEFT JOIN orders o
ON u.id = o.user_id;
```

Result

```text
Alice    100
Bob      150
Charlie  NULL
```

---

## Key Points

✅ Keeps every left-table row

✅ Missing matches become NULL

---

## Common Mistake

```sql
SELECT *
FROM users u
LEFT JOIN orders o
ON u.id=o.user_id
WHERE o.amount > 100;
```

This behaves like an **INNER JOIN** because `WHERE` removes NULL rows.

Correct

```sql
ON u.id=o.user_id
AND o.amount>100
```

or

```sql
WHERE o.amount>100
OR o.amount IS NULL
```

---

## Memory Trick

> **LEFT = Keep Everything on the Left**

---

## Interview Questions & Answers

### Q1. Why does a LEFT JOIN sometimes behave like an INNER JOIN?

**Answer**

Because filtering the right table in the `WHERE` clause removes NULL rows, eliminating unmatched left-table rows.

---

### Q2. Common use cases?

**Answer**

Finding users without orders, products without reviews, employees without managers, etc.

---

# 4. RIGHT JOIN ⭐⭐⭐

## What is it?

Opposite of LEFT JOIN.

Keeps every row from the **right table**.

---

Example

```sql
SELECT *
FROM users u
RIGHT JOIN orders o
ON u.id=o.user_id;
```

---

## Key Points

✅ Keeps right table

✅ Less commonly used

Many teams rewrite it as LEFT JOIN for readability.

---

## Memory Trick

> **RIGHT = Keep Right Table**

---

## Interview Questions & Answers

### Q1. Should we use RIGHT JOIN?

**Answer**

It's valid, but many teams prefer `LEFT JOIN` because it's generally easier to read consistently.

---

# 5. FULL OUTER JOIN ⭐⭐⭐

## What is it?

Returns

* all left rows
* all right rows
* matching rows merged

Missing values become NULL.

---

Example

Users

```text
Alice
Bob
Charlie
```

Orders

```text
Alice
David
```

Result

```text
Alice
Bob
Charlie
David
```

---

## Key Points

✅ Returns everything

✅ Useful for comparing datasets

---

## Memory Trick

> **FULL = Everything**

---

## Interview Questions & Answers

### Q1. When is FULL JOIN useful?

**Answer**

When comparing two datasets and identifying matches as well as records unique to either side.

---

# 6. SELF JOIN ⭐⭐⭐⭐

## What is it?

Joining a table with itself.

---

Example

Employees

```text
id
manager_id
```

```sql
SELECT e.name Employee,
       m.name Manager
FROM employees e
LEFT JOIN employees m
ON e.manager_id=m.id;
```

---

Result

```text
Alice   John
Bob     Sarah
```

---

## Use Cases

* Employee → Manager

* Category → Parent Category

* Comments → Parent Comment

---

## Key Points

✅ Uses aliases

```sql
employees e
employees m
```

Otherwise SQL can't distinguish the tables.

---

## Memory Trick

> **SELF JOIN = Same table, different roles**

---

## Interview Questions & Answers

### Q1. Why are aliases required?

**Answer**

Because SQL must distinguish between the two logical instances of the same table.

---

# 7. Multi-table JOIN ⭐⭐⭐⭐

Joining more than two tables.

---

Example

```sql
SELECT
u.name,
o.id,
p.name
FROM users u
JOIN orders o
ON u.id=o.user_id
JOIN products p
ON o.product_id=p.id;
```

---

Mental model

```text
Users

↓

Orders

↓

Products
```

---

## Key Points

✅ SQL joins one table at a time

✅ Each JOIN builds on the previous result

---

## Interview Questions & Answers

### Q1. Is there a limit on JOINs?

**Answer**

SQL supports many joins, but excessive joins can make queries harder to maintain and may affect performance.

---

# 8. Semi Join ⭐⭐⭐⭐

SQL has **no explicit SEMI JOIN keyword**.

It is usually written using EXISTS.

---

Example

Return customers who placed orders.

```sql
SELECT *
FROM customers c
WHERE EXISTS(
SELECT 1
FROM orders o
WHERE o.customer_id=c.id
);
```

---

Result

Only customers.

No duplicate order rows.

---

## Why not INNER JOIN?

INNER JOIN

```text
Alice
Alice
Alice
Bob
```

EXISTS

```text
Alice
Bob
```

---

## Key Points

✅ Returns rows from the left table only

✅ Checks existence

✅ Usually implemented with EXISTS

---

## Memory Trick

> **SEMI = "Does a match exist?"**

---

## Interview Questions & Answers

### Q1. Why use EXISTS instead of INNER JOIN?

**Answer**

When you only need to know whether a related row exists. `EXISTS` avoids returning duplicate rows from the joined table.

---

# 9. Anti Join ⭐⭐⭐⭐

Again,

No SQL keyword.

Implemented using

LEFT JOIN

or

NOT EXISTS

---

Example

Users without orders.

```sql
SELECT u.*
FROM users u
LEFT JOIN orders o
ON u.id=o.user_id
WHERE o.id IS NULL;
```

Better

```sql
SELECT *
FROM users u
WHERE NOT EXISTS(
SELECT 1
FROM orders o
WHERE o.user_id=u.id
);
```

---

## Use Cases

* Customers without orders

* Products without inventory

* Employees without managers

---

## Key Points

✅ Finds missing relationships

✅ Very common interview question

---

## Memory Trick

> **ANTI = No Match Exists**

---

## Interview Questions & Answers

### Q1. Difference between Anti Join and Semi Join?

**Answer**

A **Semi Join** returns rows that **have** a matching record, while an **Anti Join** returns rows that **do not have** a matching record.

---

# 🚀 Module 2 — One-Page Revision

| Topic            | Remember                                                              |
| ---------------- | --------------------------------------------------------------------- |
| INNER JOIN       | Matching rows only                                                    |
| LEFT JOIN        | All left rows + matching right rows                                   |
| RIGHT JOIN       | All right rows + matching left rows                                   |
| FULL JOIN        | All rows from both tables                                             |
| SELF JOIN        | Join a table with itself                                              |
| Multi-table JOIN | Join more than two tables                                             |
| Semi Join        | `EXISTS` → return rows with a match                                   |
| Anti Join        | `NOT EXISTS` or `LEFT JOIN ... IS NULL` → return rows without a match |

---

# 🎯 Module 2 Interview Quick Fire

### 1. Which JOIN is used most in production?

**Answer:** `INNER JOIN` and `LEFT JOIN`.

---

### 2. Why does a LEFT JOIN become an INNER JOIN?

**Answer:** Filtering the right table in the `WHERE` clause removes `NULL` rows, effectively eliminating unmatched left rows.

---

### 3. Why is `EXISTS` preferred for Semi Joins?

**Answer:** Because you only need to know if a related row exists, not retrieve or duplicate rows from the joined table.

---

### 4. How do you find users who have never placed an order?

**Answer:** Use an Anti Join with `NOT EXISTS` (preferred) or `LEFT JOIN ... WHERE right_table.id IS NULL`.

---

### 5. What is a SELF JOIN?

**Answer:** Joining a table to itself using aliases, commonly for hierarchical data like employees and managers.

---

### 6. When should you use a FULL OUTER JOIN?

**Answer:** When you need every row from both tables, including matched and unmatched records.

---

### ⭐ Senior Interview Tip

When discussing joins in interviews, don't stop at syntax. Mention **cardinality**:

* **One-to-One** (`User ↔ Passport`)
* **One-to-Many** (`User → Orders`)
* **Many-to-Many** (`Students ↔ Courses` via a junction table)

Interviewers often transition from JOIN questions into **database design**, so understanding these relationships makes your answers much stronger.

Absolutely. I would restructure **Module 5** so that you first understand the **story/mental model**, and then use the detailed sections for interview revision.

# Module 5 — Database Design

Database design is about answering four questions:

```text
1. What are my entities?
        ↓
2. How are those entities related?
        ↓
3. How should I organize the data?
        ↓
4. How do I protect the data from invalid states?
```

So the overall mental model is:

```text
Entities
   ↓
Relationships
   ↓
Tables
   ↓
Normalization
   ↓
Constraints
```

Think of it as:

> **Design the structure → reduce unnecessary duplication → enforce the rules.**

---

# 14. Relationships — 1:1, 1:N, N:N ⭐⭐⭐⭐⭐

## Mental Model

First identify your **entities**.

Example:

```text
Customer
Order
Product
```

Now ask:

> "How are these entities related?"

### 1:1

```text
User ─────── Profile
```

One user has one profile.

```text
User 1 ───── 1 Profile
```

### 1:N

```text
Customer ─────── Orders
                  │
                  ├── Order 1
                  ├── Order 2
                  └── Order 3
```

One customer can have many orders.

```text
Customer 1 ───── N Orders
```

### N:N

```text
Students ─────── Courses
   │                │
   └──────┬─────────┘
          ↓
   student_courses
```

A student can take many courses, and a course can have many students.

Therefore we need a **junction table**.

---

## 1:1 — One-to-One

One record relates to exactly one record in another table.

```sql
CREATE TABLE users (
    id INT PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE user_profiles (
    id INT PRIMARY KEY,
    user_id INT UNIQUE,
    address TEXT,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
);
```

The `UNIQUE` constraint ensures that one user cannot have multiple profiles.

### When might we use it?

Useful when separating:

* Optional information
* Sensitive information
* Rarely accessed information
* Data with different access/security requirements

---

## 1:N — One-to-Many

One record can have many related records.

```sql
CREATE TABLE orders (
    id INT PRIMARY KEY,
    customer_id INT,
    amount DECIMAL(10,2),

    FOREIGN KEY (customer_id)
        REFERENCES customers(id)
);
```

The important rule:

> **The foreign key goes on the many side.**

```text
customers
    id
    ↓
orders
    customer_id
```

---

## N:N — Many-to-Many

Many records can relate to many records.

Example:

```text
Student
   ↕
Course
```

Use a junction table:

```sql
CREATE TABLE student_courses (
    student_id INT,
    course_id INT,

    PRIMARY KEY (student_id, course_id),

    FOREIGN KEY (student_id)
        REFERENCES students(id),

    FOREIGN KEY (course_id)
        REFERENCES courses(id)
);
```

The relationship becomes:

```text
students
    ↓
student_courses
    ↓
courses
```

---

## Key Points

✅ `1:1` → One ↔ One

✅ `1:N` → One → Many

✅ `N:N` → Many ↔ Many

✅ FK normally lives on the **many side**

✅ N:N requires a **junction table**

---

## Common Mistake

❌ Don't store multiple IDs inside one column:

```text
course_ids = "1,5,8,10"
```

Instead:

```text
student_courses

student_id | course_id
-----------|----------
1          | 5
1          | 8
1          | 10
```

---

## Memory Trick

```text
1:1 → One ↔ One
1:N → FK on Many
N:N → Junction Table
```

---

## Interview Questions & Answers

### Q1. Where does the foreign key go in a 1:N relationship?

**Answer**

On the **many side**. For example, `orders.customer_id` references `customers.id`.

### Q2. How do you implement N:N?

**Answer**

Use a junction table containing foreign keys to both tables, usually with a composite primary key or unique constraint on the pair.

### Q3. Why not store multiple IDs in one column?

**Answer**

It makes querying, indexing, validation, and referential integrity difficult. A junction table is the relational design.

---

# 15. Normalization — Up to 3NF ⭐⭐⭐⭐⭐

## Mental Model

Once you identify your tables and relationships, ask:

> **"Am I storing the same fact unnecessarily in multiple places?"**

Suppose we have:

```text
employees

employee_id | employee_name | department_id | department_name
------------|---------------|---------------|----------------
1           | John          | 10            | Engineering
2           | Sarah         | 10            | Engineering
3           | Mike          | 10            | Engineering
```

We are storing:

```text
Engineering
```

multiple times.

What happens if the department name changes?

We have to update multiple rows.

This creates an:

```text
UPDATE ANOMALY
```

Normalization helps us organize the data so that each fact is stored in the appropriate place.

---

# 1NF — Atomic Values

### Mental Model

Ask:

> **"Does each column contain one value?"**

❌ Bad:

```text
customer_id | phone_numbers
------------|----------------
1           | 123,456,789
```

One column contains multiple values.

✅ Better:

```text
customer_id | phone
------------|------
1           | 123
1           | 456
1           | 789
```

Or use a separate table.

### Rule

Each column should contain **atomic values**.

### Memory Trick

```text
1NF = One value per cell
```

---

# 2NF — Depend on the Whole Key

### Mental Model

2NF becomes important when you have a **composite key**.

Suppose:

```text
student_id
course_id
student_name
course_name
grade
```

Primary key:

```text
(student_id, course_id)
```

Now ask:

> "Does every non-key column depend on the WHOLE key?"

Look at:

```text
student_name
```

It only depends on:

```text
student_id
```

Not:

```text
student_id + course_id
```

Similarly:

```text
course_name
```

only depends on:

```text
course_id
```

But:

```text
grade
```

depends on:

```text
student_id + course_id
```

So we have **partial dependencies**.

Split the tables:

```text
students
---------
student_id
student_name

courses
---------
course_id
course_name

enrollments
-----------
student_id
course_id
grade
```

### Rule

> Every non-key column must depend on the **whole primary key**.

### Memory Trick

```text
2NF = Whole Key
```

---

# 3NF — Don't Depend on Another Non-Key Column

### Mental Model

Now ask:

> **"Does a non-key column depend on another non-key column?"**

Example:

```text
employees

employee_id
employee_name
department_id
department_name
```

Dependencies:

```text
employee_id
     ↓
department_id
     ↓
department_name
```

`department_name` doesn't directly depend on the employee.

It depends on:

```text
department_id
```

which is another non-key attribute.

This is a **transitive dependency**.

Split it:

```text
employees
---------
employee_id
employee_name
department_id


departments
-----------
department_id
department_name
```

Now:

```text
employee_id → employee information

department_id → department information
```

### Rule

> Non-key columns should depend on the key, the whole key, and nothing but the key.

### Memory Trick

```text
3NF = No non-key → non-key dependency
```

---

# Normalization Mental Model

Don't memorize 1NF, 2NF, 3NF as isolated definitions.

Think:

```text
START
  ↓
Are values atomic?
  ↓
1NF
  ↓
If composite key:
Does every column depend on the WHOLE key?
  ↓
2NF
  ↓
Does a non-key column depend on another non-key column?
  ↓
3NF
```

The classic interview memory trick:

```text
1NF → Atomic
2NF → Whole Key
3NF → Nothing but the Key
```

---

## Why Normalize?

Normalization helps prevent:

### Insert Anomaly

You can't insert one piece of information without unrelated information.

### Update Anomaly

The same fact exists in multiple rows and must be updated everywhere.

### Delete Anomaly

Deleting one record accidentally removes another important fact.

---

## Important Senior Point

Normalization is **not**:

> "The more tables, the better."

It is about **correctly representing dependencies and avoiding unnecessary duplication**.

Sometimes systems intentionally denormalize data for performance/read-heavy workloads.

Think:

```text
Normalization
     ↓
Consistency + less duplication

Denormalization
     ↓
Potentially faster reads
     ↓
More duplication / consistency responsibility
```

---

## Interview Questions & Answers

### Q1. Difference between 2NF and 3NF?

**Answer**

2NF removes **partial dependencies** on part of a composite key. 3NF removes **transitive dependencies**, where a non-key column depends on another non-key column.

### Q2. Is normalization always better?

**Answer**

No. Normalization improves consistency, but excessive normalization can require more joins. Some systems intentionally denormalize for performance.

### Q3. What problems does normalization prevent?

**Answer**

Primarily insert, update, and delete anomalies caused by unnecessary data duplication.

---

# 16. Constraints — PK, FK, UNIQUE, CHECK ⭐⭐⭐⭐⭐

## Mental Model

Relationships and normalization design the structure.

Now we need to **protect that structure**.

Think of constraints as:

> **Database guardrails.**

```text
PK
 ↓
Who is this row?

FK
 ↓
What does this row relate to?

UNIQUE
 ↓
Can this value repeat?

CHECK
 ↓
Is this value valid?
```

---

# PRIMARY KEY — PK

Uniquely identifies a row.

```sql
CREATE TABLE users (
    id INT PRIMARY KEY,
    name VARCHAR(100)
);
```

Properties:

```text
Unique
+
Not NULL
+
Identifies the row
```

A table has one primary key constraint, but it can be composed of multiple columns:

```sql
PRIMARY KEY (student_id, course_id)
```

This is a **composite primary key**.

### Memory Trick

```text
PK = Identity
```

---

# FOREIGN KEY — FK

Connects one table to another and enforces referential integrity.

```sql
CREATE TABLE orders (
    id INT PRIMARY KEY,
    customer_id INT,

    FOREIGN KEY (customer_id)
        REFERENCES customers(id)
);
```

Conceptually:

```text
customers.id
     ↑
     |
orders.customer_id
```

The FK ensures the relationship points to a valid referenced row, subject to the configured FK behavior.

### Memory Trick

```text
FK = Relationship
```

---

# UNIQUE

Prevents duplicate values.

```sql
CREATE TABLE users (
    id INT PRIMARY KEY,
    email VARCHAR(255) UNIQUE
);
```

Typical examples:

```text
email
username
employee_number
external_id
```

### Memory Trick

```text
UNIQUE = No duplicates
```

---

# CHECK

Enforces a condition.

```sql
CREATE TABLE employees (
    id INT PRIMARY KEY,
    salary DECIMAL(10,2),

    CHECK (salary >= 0)
);
```

Another example:

```sql
CHECK (status IN ('active', 'inactive'))
```

### Memory Trick

```text
CHECK = Must satisfy a rule
```

---

# All Constraints Together

```sql
CREATE TABLE users (
    id INT PRIMARY KEY,

    email VARCHAR(255) UNIQUE,

    age INT CHECK (age >= 18),

    department_id INT,

    FOREIGN KEY (department_id)
        REFERENCES departments(id)
);
```

Think:

```text
PRIMARY KEY
     ↓
Identifies the user

UNIQUE
     ↓
Email cannot duplicate

CHECK
     ↓
Age must be valid

FOREIGN KEY
     ↓
Department must be valid
```

---

## Important: Application Validation vs Database Constraints

As a senior developer, don't think:

```text
Frontend validation
       ↓
Backend validation
       ↓
Done
```

The database is the **final integrity boundary**.

Better:

```text
Frontend
   ↓
User-friendly validation
   ↓
Backend
   ↓
Business validation
   ↓
Database
   ↓
Constraints enforce critical invariants
```

Why?

Because data might come from:

```text
API
Background job
Admin tool
Migration
Another service
Script
```

The database should still protect critical integrity rules.

---

## Common Mistakes

❌ Thinking `PRIMARY KEY` and `UNIQUE` are identical.

```text
PK     → identifies the row
UNIQUE → prevents duplicate values
```

❌ Relying only on application validation.

❌ Using `ON DELETE CASCADE` automatically without considering the business relationship.

Common FK behaviors include:

```sql
ON DELETE CASCADE
ON DELETE SET NULL
ON DELETE RESTRICT
```

Choose based on the business requirement.

---

## Interview Questions & Answers

### Q1. PRIMARY KEY vs UNIQUE?

**Answer**

Both enforce uniqueness, but a primary key identifies the row and cannot be `NULL`. A table has one primary key constraint but can have multiple unique constraints.

### Q2. What is referential integrity?

**Answer**

It ensures relationships between tables remain valid. For example, an order's `customer_id` should reference an existing customer.

### Q3. Should validation happen in the application or database?

**Answer**

Both. Application validation improves user experience, while database constraints provide the final guarantee that critical data integrity rules cannot be bypassed.

---

# 🚀 Module 5 — One-Page Revision

## Mental Model

```text
1. Identify entities
        ↓
2. Define relationships
        ↓
3. Organize data
        ↓
4. Remove unnecessary duplication
        ↓
5. Enforce integrity
```

### Relationships

| Concept | Remember            |
| ------- | ------------------- |
| `1:1`   | One ↔ One           |
| `1:N`   | FK on the many side |
| `N:N`   | Junction table      |

### Normalization

| Form  | Remember                        |
| ----- | ------------------------------- |
| `1NF` | Atomic values                   |
| `2NF` | Depend on whole key             |
| `3NF` | No non-key → non-key dependency |

### Constraints

| Constraint | Remember                |
| ---------- | ----------------------- |
| `PK`       | Identifies the row      |
| `FK`       | Maintains relationships |
| `UNIQUE`   | Prevents duplicates     |
| `CHECK`    | Enforces a condition    |

---

# 🎯 Module 5 — Interview Quick Fire

### 1. How do you model a 1:N relationship?

Put the foreign key on the **many side**.

### 2. How do you model N:N?

Use a **junction table** containing FKs to both entities.

### 3. What is 1NF?

Each column contains **atomic values**.

### 4. What does 2NF solve?

**Partial dependency** on part of a composite key.

### 5. What does 3NF solve?

**Transitive dependency** between non-key attributes.

### 6. Why normalize?

To reduce unnecessary duplication and prevent **insert, update, and delete anomalies**.

### 7. PK vs FK?

`PK` identifies a row; `FK` represents a relationship to another table.

### 8. PK vs UNIQUE?

Both enforce uniqueness, but a table has one primary key and can have multiple unique constraints.

### 9. Why use CHECK?

To enforce valid values directly at the database level.

### 10. Should validation only happen in application code?

No. Critical integrity rules should also be enforced by the database.

---

# 🧠 30-Second Mental Model

> **Database design starts with entities and their relationships. For 1:N relationships, the foreign key goes on the many side, while N:N relationships need a junction table. Once the tables are designed, normalization helps reduce duplication and anomalies: 1NF means atomic values, 2NF means depending on the whole key, and 3NF removes non-key-to-non-key dependencies. Finally, constraints such as PK, FK, UNIQUE, and CHECK act as database-level guardrails to protect data integrity.**

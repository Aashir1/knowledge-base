# TypeScript Generics

## What is it?

Generics allow you to write **reusable, type-safe code** without fixing the type in advance.

Instead of writing separate functions for `string`, `number`, etc., you write one function that works with any type.

---

## How does it work?

Without Generics:

```ts
function getValue(value: string): string {
  return value;
}
```

Works only for strings.

With Generics:

```ts
function getValue<T>(value: T): T {
  return value;
}

getValue("Hello"); // string
getValue(10);      // number
getValue(true);    // boolean
```

`T` is a placeholder for any type.

---

## Generic Interface

```ts
interface ApiResponse<T> {
  data: T;
  success: boolean;
}

const user: ApiResponse<User> = {
  data: { id: 1, name: "Ali" },
  success: true,
};
```

---

## Generic Array

```ts
const numbers: Array<number> = [1, 2, 3];

// Same as
const numbers: number[] = [1, 2, 3];
```

---

## Memory Trick

> **Generics = Write once, work with any type.**

---

## Senior Interview Questions

### Q1: Why use Generics?

To write reusable functions, classes, and interfaces while maintaining type safety.

---

### Q2: What does `<T>` mean?

`T` is a **type parameter** (placeholder). It represents any type and is replaced when the function or class is used.

---

### Q3: Can a Generic have constraints?

Yes.

```ts
function printLength<T extends { length: number }>(item: T) {
  console.log(item.length);
}
```

Only types with a `length` property are allowed.

---

### Q4: Can Generics have multiple type parameters?

Yes.

```ts
function pair<T, U>(first: T, second: U) {
  return { first, second };
}

pair("Ali", 25);
```

---

## Common Mistakes

❌ Using `any` instead of Generics.

```ts
function getValue(value: any): any {}
```

This loses type safety.

✅ Better:

```ts
function getValue<T>(value: T): T {}
```

---

## Interview Answer (30 sec)

> Generics allow us to write reusable, type-safe code without knowing the exact type in advance. We define a type parameter, such as `<T>`, and TypeScript infers the actual type when the function, class, or interface is used. This avoids code duplication while preserving strong type checking.


# Utility Types (TypeScript)

## 1. Short explanation (What + Why)

**What:**
Utility Types are built-in TypeScript types that transform existing types (e.g., make properties optional, readonly, required, etc.).

**Why:**
They reduce code duplication and help create reusable, maintainable type definitions.

---

## 2. Simple internal working (Senior interview level)

Utility Types use **TypeScript generics + mapped types + conditional types** to transform an existing type at compile time.

Example:

```ts
type User = {
  id: number;
  name: string;
};
```

`Partial<User>` internally behaves like:

```ts
type Partial<T> = {
  [K in keyof T]?: T[K];
};
```

---

## 3. Common Utility Types

```ts
interface User {
  id: number;
  name: string;
  age?: number;
}
```

### `Partial<T>` → All optional

```ts
type UpdateUser = Partial<User>;
```

### `Required<T>` → All required

```ts
type FullUser = Required<User>;
```

### `Readonly<T>` → Cannot modify

```ts
const user: Readonly<User> = { id: 1, name: "John" };
// user.name = "Mike"; ❌
```

### `Pick<T, K>` → Select properties

```ts
type UserBasic = Pick<User, "id" | "name">;
```

### `Omit<T, K>` → Remove properties

```ts
type UserWithoutAge = Omit<User, "age">;
```

### `Record<K, T>` → Key-value object

```ts
type Users = Record<string, User>;
```

---

## 4. One-line memory trick

**"Utility Types transform existing types without rewriting them."**

---

# 5. Senior Interview Questions

### Q1. `Pick` vs `Omit`?

**Answer:**

* `Pick` → Keep selected properties.
* `Omit` → Remove selected properties.

---

### Q2. When do you use `Partial`?

**Answer:**
For update APIs, forms, or PATCH requests where only some fields are sent.

---

### Q3. Is `Readonly` runtime protection?

**Answer:**
No. It's **compile-time only**; JavaScript can still mutate the object unless it's frozen.

---

## 6. Common mistakes

❌ Assuming Utility Types affect runtime.

❌ Using `Partial` for API responses when fields are actually required.

❌ Confusing `Pick` and `Omit`.

---

# 7. 30-second interview response

"Utility Types are built-in TypeScript helpers that transform existing types without rewriting them. Common ones include `Partial`, `Required`, `Readonly`, `Pick`, `Omit`, and `Record`. They are implemented using generics and mapped types, improve code reusability, and provide compile-time type safety without affecting runtime behavior."


# Mapped Types (TypeScript)

## 1. Short explanation (What + Why)

**What:**
Mapped Types let you create a new type by **iterating over the properties of an existing type** and transforming them.

**Why:**
They reduce code duplication and allow reusable type transformations (e.g., making all properties optional, readonly, nullable, etc.).

---

## 2. Simple internal working (Senior interview level)

Internally, TypeScript:

1. Gets all property keys using `keyof`.
2. Loops over each key with `[K in keyof T]`.
3. Applies a transformation to each property's type.
4. Produces a **new type** at compile time.

Example:

```ts
interface User {
  id: number;
  name: string;
  active: boolean;
}

type OptionalUser = {
  [K in keyof User]?: User[K];
};
```

Equivalent to:

```ts
type OptionalUser = {
  id?: number;
  name?: string;
  active?: boolean;
};
```

> **Mapped Types exist only at compile time; they generate no JavaScript.**

---

## 3. Small practical example/code

### Example 1: Make every property readonly

```ts
interface User {
  id: number;
  name: string;
}

type ReadonlyUser = {
  readonly [K in keyof User]: User[K];
};
```

---

### Example 2: Make every property nullable

```ts
type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

type UserNullable = Nullable<User>;
```

Result:

```ts
{
  id: number | null;
  name: string | null;
}
```

---

### Example 3: Key Remapping (TS 4.1+)

```ts
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};
```

Result:

```ts
{
  getId: () => number;
  getName: () => string;
}
```

---

## 4. One-line memory trick

**"Mapped Types = `for...of` loop for TypeScript object properties."**

---

## 5. 3 important senior interview questions

### Q1. How are Utility Types related to Mapped Types?

**Answer:**

Most built-in Utility Types (`Partial`, `Readonly`, `Required`, `Pick`) are implemented using **Mapped Types**.

---

### Q2. What's the difference between Mapped Types and Index Signatures?

**Answer:**

* **Mapped Type:** Iterates over **existing keys** of another type.
* **Index Signature:** Allows **any key** of a certain type.

```ts
// Mapped Type
type T = {
  [K in keyof User]: User[K];
};

// Index Signature
type T = {
  [key: string]: string;
};
```

---

### Q3. What is key remapping?

**Answer:**

Key remapping (`as`) lets you **rename or filter properties** while creating a new type.

Example:

```ts
type Prefix<T> = {
  [K in keyof T as `api_${string & K}`]: T[K];
};
```

---

## 6. Common mistakes

* ❌ Confusing **Mapped Types** with **Index Signatures**.
* ❌ Forgetting `keyof` when iterating over properties.
* ❌ Assuming Mapped Types exist at runtime (they don't).
* ❌ Overusing custom mapped types when a built-in Utility Type already exists.

---

## 7. 30-second interview response

> "Mapped Types allow us to create new types by iterating over the keys of an existing type using `[K in keyof T]`. They're used to transform properties—for example, making them optional, readonly, nullable, or even renaming them with key remapping. Most built-in utility types like `Partial`, `Readonly`, and `Required` are implemented using mapped types. They improve code reuse and maintainability while providing compile-time type safety."

# Conditional Types (TypeScript)

## 1. Short explanation (What + Why)

**What:**
Conditional Types let you choose one type or another based on a condition.

**Why:**
They enable dynamic and reusable type logic, allowing types to adapt based on input.

**Syntax:**

```ts
T extends U ? X : Y
```

Read as: **"If `T` extends `U`, use `X`; otherwise use `Y`."**

---

## 2. Simple internal working (Senior interview level)

TypeScript evaluates the condition **at compile time**:

1. Check if `T` is assignable to `U`.
2. If **true**, return the first type.
3. Otherwise, return the second type.

Example:

```ts
type IsString<T> = T extends string ? true : false;
```

Usage:

```ts
type A = IsString<string>; // true
type B = IsString<number>; // false
```

> **Conditional Types exist only at compile time and generate no JavaScript.**

---

## 3. Small practical example/code

### Example 1: Basic Conditional Type

```ts
type IsNumber<T> = T extends number ? "Yes" : "No";

type A = IsNumber<number>; // "Yes"
type B = IsNumber<boolean>; // "No"
```

---

### Example 2: Using `infer`

Extract the return type of a function:

```ts
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type Fn = () => string;

type Result = MyReturnType<Fn>; // string
```

> `infer` lets TypeScript infer a type from another type.

---

### Example 3: Distributive Conditional Types

```ts
type ToArray<T> = T extends any ? T[] : never;

type Result = ToArray<string | number>;
```

Result:

```ts
string[] | number[]
```

TypeScript applies the condition to each member of the union individually.

---

## 4. One-line memory trick

**"Conditional Types = if-else statements for TypeScript types."**

---

## 5. 3 important senior interview questions

### Q1. What is the syntax of a Conditional Type?

**Answer:**

```ts
T extends U ? X : Y
```

If `T` satisfies `U`, TypeScript returns `X`; otherwise, it returns `Y`.

---

### Q2. What is `infer`?

**Answer:**

`infer` extracts a type inside a conditional type.

Example:

```ts
type Return<T> = T extends (...args: any[]) => infer R ? R : never;
```

It's commonly used in utility types like `ReturnType` and `Parameters`.

---

### Q3. What are distributive conditional types?

**Answer:**

When a conditional type receives a **union**, TypeScript evaluates each member separately.

```ts
type T<TValue> = TValue extends string ? "S" : "N";

type Result = T<string | number>; // "S" | "N"
```

---

## 6. Common mistakes

* ❌ Confusing Conditional Types with runtime `if` statements.
* ❌ Forgetting that they are **compile-time only**.
* ❌ Not understanding how unions distribute automatically.
* ❌ Misusing `infer` outside conditional types.

---

## 7. 30-second interview response

> "Conditional Types let us create types that change based on a condition using the syntax `T extends U ? X : Y`. They work like compile-time if-else statements and are widely used to build reusable utility types. Combined with `infer`, they can extract types such as function return types or parameter types. Many built-in utility types, including `ReturnType` and `Exclude`, are implemented using conditional types.`


That's a good point. For interview prep, I shouldn't assume you already know related concepts. Here's a better version that explains the differences briefly.

# Interface vs Type (TypeScript)

| **Interface**                                             | **Type**                                                                                                       |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Defines the shape of an object                            | Can define **objects, primitives (`string`), unions (`A \| B`), tuples (`[string, number]`), functions**, etc. |
| Two interfaces with the same name **merge automatically** | Two types with the same name cause an error                                                                    |
| Uses `extends` to inherit                                 | Uses `&` (intersection) to combine types                                                                       |
| Best for object models and classes                        | Best for advanced type manipulation                                                                            |

### Short Examples

#### 1. Object (Both can do this)

```ts
interface User {
  id: number;
  name: string;
}

type User = {
  id: number;
  name: string;
};
```

---

#### 2. Union (Only `type`)

A variable can be **one of multiple types**.

```ts
type Status = "loading" | "success" | "error";
```

---

#### 3. Tuple (Only `type`)

A fixed-length array with fixed types.

```ts
type UserInfo = [string, number];

// ["John", 25]
```

---

#### 4. Declaration Merging (Only `interface`)

Two interfaces with the same name automatically combine.

```ts
interface User {
  id: number;
}

interface User {
  name: string;
}

// Result:
interface User {
  id: number;
  name: string;
}
```

Doing the same with `type` gives an error.

---

### When to use?

* ✅ **Use `interface`** for object models, APIs, and classes.
* ✅ **Use `type`** when you need unions, tuples, conditional types, mapped types, or intersections.

---

### Memory Trick

* **Interface = Object Contract (can merge)**
* **Type = Everything (objects + advanced types)**

This style is much better for interviews because it introduces every concept briefly instead of assuming you already know terms like **union**, **tuple**, or **declaration merging**.

# REST API Design

## 1. Short Explanation (What + Why)

* **REST API** exposes resources through predictable **URLs + HTTP methods**.
* Good API design makes APIs **consistent, discoverable, secure, and easy to consume**.
* A production API should define clear **request/response contracts**, validation, errors, pagination, filtering, and versioning.
* Senior-level focus: not just making an endpoint work, but making the API **stable and maintainable as the system grows**.

---

## 2. Internal Working (Senior Interview Level)

### 1. HTTP Methods

Use methods according to their semantics:

| Method   | Purpose                    | Idempotent? |
| -------- | -------------------------- | ----------- |
| `GET`    | Read resource              | ✅           |
| `POST`   | Create / trigger operation | ❌ generally |
| `PUT`    | Replace resource           | ✅           |
| `PATCH`  | Partially update           | ✅ usually   |
| `DELETE` | Delete resource            | ✅           |

Example:

```text
GET    /api/v1/users/123
POST   /api/v1/users
PATCH  /api/v1/users/123
DELETE /api/v1/users/123
```

**Senior point:** Don't use `POST` for everything just because it is convenient.

---

### 2. HTTP Status Codes

Use status codes to communicate the result clearly.

```text
2xx → Success
4xx → Client/request problem
5xx → Server problem
```

Common ones:

* `200 OK` → successful read/update
* `201 Created` → resource created
* `204 No Content` → successful operation with no response body
* `400 Bad Request` → malformed/invalid request
* `401 Unauthorized` → authentication required/invalid
* `403 Forbidden` → authenticated but not allowed
* `404 Not Found` → resource doesn't exist
* `409 Conflict` → state conflict, e.g. duplicate email
* `422 Unprocessable Content` → validation/business input failure
* `429 Too Many Requests` → rate limit
* `500 Internal Server Error` → unexpected server failure

**Important:** `401` ≠ `403`.

---

### 3. Request / Response Structure

Keep the contract predictable.

```http
POST /api/v1/users
Content-Type: application/json
```

```json
{
  "name": "Aashir",
  "email": "aashir@example.com"
}
```

Response:

```json
{
  "data": {
    "id": "123",
    "name": "Aashir",
    "email": "aashir@example.com"
  }
}
```

For errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": {
      "email": "Invalid email format"
    }
  }
}
```

**Best practice:** Define a consistent API contract rather than letting every endpoint return errors differently.

---

### 4. Validation

Validate at the **API boundary** before business logic.

```text
Request
   ↓
Authentication
   ↓
Authorization
   ↓
Validation
   ↓
Business Logic
   ↓
Database
```

Validate:

* Required fields
* Types
* Formats
* Length/range
* Allowed enum values
* Business constraints where appropriate

Example with NestJS:

```ts
class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(2, 100)
  name: string;
}
```

**Senior point:** Never trust client-side validation. The backend must validate independently.

---

### 5. Error Handling

Use centralized error handling.

```text
Controller
    ↓
Service
    ↓
Error
    ↓
Global Error Handler
    ↓
Consistent HTTP Response
```

Avoid:

```json
{ "error": "Something went wrong" }
```

Prefer structured errors:

```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User was not found"
  }
}
```

Don't expose:

* Stack traces
* Database errors
* Internal service names
* Secrets
* Sensitive implementation details

**Senior best practice:** Log detailed internal errors, but return safe errors to clients.

---

### 6. Pagination

Never return thousands/millions of records by default.

### Offset pagination

```http
GET /users?page=2&limit=20
```

Simple and good for many admin/listing use cases.

**Problem:** Large offsets can become expensive and records can shift between requests.

### Cursor pagination

```http
GET /users?limit=20&cursor=eyJpZCI6MTAw...
```

Conceptually:

```text
Page 1
[101 ... 120]
       ↓ cursor
Page 2
[121 ... 140]
```

Better for:

* Large datasets
* Infinite scrolling
* Frequently changing data

**Senior answer:** Cursor pagination generally scales better for large, ordered datasets, while offset pagination is simpler and useful when users need page numbers.

---

### 7. Filtering and Sorting

Use query parameters:

```http
GET /products?
    category=books
    &status=active
    &sort=-createdAt
    &limit=20
```

Keep filters explicit and predictable.

Avoid exposing arbitrary database expressions:

```http
?sql=...
```

Validate:

* Allowed filter fields
* Allowed sort fields
* Maximum page size

---

### 8. API Versioning

APIs evolve, but existing clients shouldn't suddenly break.

Common approach:

```http
/api/v1/users
/api/v2/users
```

Version when you introduce **breaking changes**.

Examples:

```text
v1 → { "name": "Aashir" }

v2 → { "firstName": "Aashir", "lastName": "Khan" }
```

Don't create a new version for every small feature.

**Best practice:** Prefer backward-compatible changes whenever possible.

---

### 9. Idempotency

An operation is **idempotent** if repeating the same request produces the same intended result.

Example:

```http
PUT /users/123
```

Sending it twice should result in the same final state.

For payment/order creation, `POST` can be dangerous because network retries may create duplicates.

Use an **Idempotency-Key**:

```http
POST /payments
Idempotency-Key: abc-123
```

Server:

```text
Request
   ↓
Check idempotency key
   ↓
Already processed? ── Yes → return previous result
   │
   No
   ↓
Process payment
   ↓
Store result against key
```

This is especially important for **payments, orders, and other retryable operations**.

---

## 3. Practical Example

A production-style endpoint:

```http
GET /api/v1/orders?status=completed&limit=20&cursor=abc
```

Response:

```json
{
  "data": [
    {
      "id": "ord_123",
      "status": "completed",
      "total": 120
    }
  ],
  "pagination": {
    "nextCursor": "xyz",
    "hasMore": true
  }
}
```

This gives the frontend:

* Consistent resource structure
* Filtering
* Cursor pagination
* Explicit API version
* Predictable response format

---

## 4. One-line Memory Trick

> **A good REST API is predictable: correct method + status + validation + consistent errors + scalable querying + safe evolution.**

---

## 5. Three Important Senior Interview Questions

### Q1. How would you design a production API for listing users?

**Answer:**

I'd use something like:

```http
GET /api/v1/users?status=active&sort=-createdAt&limit=20&cursor=abc
```

I'd validate query parameters, enforce a maximum page size, use cursor pagination for large datasets, and return a consistent response containing `data` and pagination metadata.

**Follow-up:**
**Why cursor instead of offset?**

Cursor pagination avoids scanning/skipping large numbers of rows and behaves better when data changes frequently.

---

### Q2. What's the difference between 401 and 403?

**Answer:**

* **401** means the request lacks valid authentication credentials.
* **403** means the user is authenticated but **doesn't have permission**.

```text
No valid identity → 401
Valid identity + insufficient permission → 403
```

**Follow-up:**
Should an unknown user always receive `404`?

Not necessarily. In some authorization scenarios, returning `404` can prevent leaking the existence of a protected resource.

---

### Q3. How would you make a POST endpoint safe to retry?

**Answer:**

For operations such as payments or order creation, I'd support an **Idempotency-Key**.

The server stores the result associated with the key. If the same request is retried with that key, the server returns the original result instead of performing the operation again.

**Follow-up:**
Where would you store the idempotency key?

Typically in a durable store such as **Redis or the database**, depending on the operation's consistency and lifetime requirements.

---

## 6. Common Mistakes

* ❌ Using `POST` for every operation.
* ❌ Returning `200` for every response, including errors.
* ❌ Confusing **401 vs 403**.
* ❌ Trusting frontend validation.
* ❌ Returning raw database/stack-trace errors.
* ❌ Returning unlimited records from list endpoints.
* ❌ Using offset pagination blindly on huge tables.
* ❌ Allowing arbitrary fields for sorting/filtering.
* ❌ Breaking existing clients without versioning/backward compatibility.
* ❌ Ignoring retries for payment/order APIs.
* ❌ Making API responses inconsistent across endpoints.
* ❌ Putting business logic directly inside controllers.

### Senior Best Practices

Think about these when designing any API:

```text
Correct semantics
      ↓
Validation + Authorization
      ↓
Consistent response/errors
      ↓
Pagination + filtering
      ↓
Observability + rate limiting
      ↓
Backward compatibility
      ↓
Safe retries / idempotency
```

---

## 7. 30-Second Interview Answer

> **"When designing a production REST API, I focus first on clear resource-oriented endpoints and correct HTTP semantics. I use appropriate methods and status codes, validate requests at the API boundary, and return consistent response and error structures. For list endpoints, I support filtering, sorting, and pagination, using cursor pagination when the dataset is large or frequently changing. I also consider API versioning for breaking changes and idempotency for retry-sensitive operations like payments or order creation. The goal is an API that's predictable for clients, scalable, secure, and easy to evolve."**

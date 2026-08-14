# Authentication & Authorization

## 1. Short Explanation (What + Why)

### Authentication vs Authorization

* **Authentication (AuthN)** answers: **"Who are you?"**
* **Authorization (AuthZ)** answers: **"What are you allowed to do?"**
* After login, the application needs a way to remember the authenticated user. The two common approaches are **sessions** and **tokens**.
* **OAuth 2.0** defines delegated authorization flows, while **OIDC** adds an identity/authentication layer on top of OAuth 2.0.

### The complete mental model

```text
                    LOGIN
                      │
                      ▼
              Authentication
                      │
             ┌────────┴────────┐
             ▼                 ▼
          Session          Access Token
             │                 │
             │            Refresh Token
             │                 │
             └────────┬────────┘
                      ▼
                 API Request
                      │
                      ▼
              Authenticate Request
                      │
                "Who is this?"
                      │
                      ▼
              Authorize Request
                      │
              "Can they do this?"
                 ┌────┴────┐
                 ▼         ▼
               Allow      Deny
```

---

## 2. Internal Working (Senior Interview Level)

## A. Session-based Authentication

With sessions, the **server maintains the authentication state**.

### Login

```text
Browser                    Backend                  Session Store
   │                          │                          │
   │── email + password ─────►│                          │
   │                          │── verify password ──────►│
   │                          │                          │
   │                          │── create session ───────►│
   │                          │◄── sessionId ───────────│
   │                          │                          │
   │◄── Set-Cookie ───────────│                          │
```

The server stores something like:

```text
sessionId: abc123
userId:    user_42
expires:   ...
```

The browser stores:

```http
Cookie: sessionId=abc123
```

### Every API request

```text
Browser
   │
   │ Cookie: sessionId=abc123
   ▼
Backend
   │
   ├── Find session
   ├── Get userId
   ├── Load user/permissions
   └── Authorize request
```

### Scaling consideration

If you have multiple backend instances:

```text
                 Load Balancer
                 /           \
                ▼             ▼
             Server A      Server B
                \             /
                 \           /
                    Redis
```

The session store needs to be **shared**.

Otherwise:

```text
Request 1 → Server A → knows session
Request 2 → Server B → doesn't know session
```

A shared store such as **Redis** solves this.

### Session advantages

* Easy to revoke immediately.
* Server controls session lifetime.
* Sensitive authentication state doesn't need to be exposed to JavaScript.

### Session trade-off

* Requires server-side session state.
* Distributed systems usually need shared session storage.

---

# B. JWT Authentication

**JWT = JSON Web Token.**

A JWT is a **signed token containing claims**.

Structure:

```text
xxxxx.yyyyy.zzzzz
  │      │      │
Header Payload Signature
```

Example payload:

```json
{
  "sub": "user_42",
  "role": "admin",
  "iss": "auth.example.com",
  "aud": "orders-api",
  "exp": 1780000000
}
```

### Important

JWT payloads are normally **encoded, not encrypted**.

Therefore:

```text
Do NOT put:
- passwords
- secrets
- sensitive personal information
```

### Login flow

```text
Client
  │
  │ username + password
  ▼
Authentication Server
  │
  ├── verify credentials
  ├── create/sign access token
  └── create refresh token
  │
  ▼
Client
```

Then:

```http
Authorization: Bearer <access-token>
```

### API request flow

This is one of the most important flows to understand for interviews:

```text
Client
  │
  │ Authorization: Bearer JWT
  ▼
API
  │
  ├── Extract token
  │
  ├── Verify signature
  │
  ├── Check expiration
  │
  ├── Validate issuer/audience
  │
  ├── Read subject (sub)
  │
  ├── Identify user
  │
  └── Check permissions
         │
      ┌──┴──┐
      ▼     ▼
    Allow  Deny
```

### What does JWT verification actually mean?

The server verifies that:

1. The token was signed by a **trusted issuer/key**.
2. The token hasn't been modified.
3. It is **not expired**.
4. Relevant claims such as **issuer (`iss`) and audience (`aud`)** are valid.
5. The claims are acceptable for the requested API.

Only after this should the application trust the identity information.

---

# C. Access Token vs Refresh Token

Don't think of them as "two JWTs with different names."

They serve **different purposes**.

### Access Token

Used to access APIs.

```http
GET /api/orders
Authorization: Bearer <access-token>
```

Usually:

* Short-lived
* Sent frequently
* Limited permissions/scope

### Refresh Token

Used to obtain a **new access token**.

```text
Access Token
     │
     │ expires
     ▼
Refresh Token
     │
     ▼
Authorization Server
     │
     ▼
New Access Token
```

The refresh token generally **should not be sent to every API**.

It is sent to the **token/authorization server**.

### Why separate them?

Suppose:

```text
Access token = 15 minutes
Refresh token = days/weeks
```

If an access token is stolen:

```text
Attacker
   │
   └── can use it only until expiration
```

The user doesn't need to log in again because the refresh token can obtain another access token.

### Refresh token rotation

A stronger design:

```text
Refresh Token A
      │
      ▼
Token endpoint
      │
      ├── New Access Token
      └── New Refresh Token B
                     │
                     ▼
              Invalidate A
```

If an old refresh token is reused, the server can detect potential theft and revoke the token family/session.

---

# D. OAuth 2.0

OAuth 2.0 is an **authorization framework**, not a JWT format.

Its main question is:

> **"Can this client obtain permission to access a resource?"**

Example:

```text
Your application
      │
      │ "I need access to user's Google data"
      ▼
Google Authorization Server
      │
      │ User authenticates + grants consent
      ▼
Authorization Code
      │
      ▼
Your application
      │
      ▼
Access Token
      │
      ▼
Google API
```

### Authorization Code + PKCE

This is the important modern OAuth flow for public clients such as SPAs/mobile apps.

```text
1. Client creates code_verifier
          │
          ▼
2. Client creates code_challenge
          │
          ▼
3. Redirect user to Authorization Server
          │
          ▼
4. User logs in + grants consent
          │
          ▼
5. Authorization Server returns code
          │
          ▼
6. Client exchanges code + verifier
          │
          ▼
7. Authorization Server returns tokens
```

### Why PKCE?

It protects the authorization code from being useful to an attacker who intercepts it.

The attacker doesn't have the original **code_verifier**.

---

# E. OIDC

**OIDC = OpenID Connect.**

Think:

```text
OAuth 2.0
   +
Identity
   =
OIDC
```

OAuth answers:

> "What can this application access?"

OIDC answers:

> **"Who is the user?"**

OIDC introduces an **ID Token**, typically a JWT containing identity claims.

Example:

```json
{
  "sub": "user_42",
  "email": "user@example.com",
  "name": "Aashir"
}
```

### Important distinction

```text
OAuth 2.0 → Authorization
OIDC      → Authentication + Identity
JWT       → Token format
```

These are **not interchangeable concepts**.

---

# F. RBAC

**RBAC = Role-Based Access Control.**

Instead of checking individual users:

```text
if user.id === "123"
```

we assign roles:

```text
User
  │
  └── Role: Admin
              │
              ├── users:read
              ├── users:create
              ├── users:update
              └── users:delete
```

Then:

```text
Request
   │
   ▼
Authenticated User
   │
   ▼
Role
   │
   ▼
Permissions
   │
   ▼
Resource + Action
```

Example:

```ts
if (!user.permissions.includes("orders:delete")) {
  throw new ForbiddenException();
}
```

### 401 vs 403

Very important:

```text
Not authenticated
      ↓
     401

Authenticated but not allowed
      ↓
     403
```

Example:

```text
No valid token
      → 401 Unauthorized

Valid token + user cannot delete orders
      → 403 Forbidden
```

---

# G. Token Expiration

Access tokens should generally be **short-lived**.

JWT:

```json
{
  "sub": "user_42",
  "exp": 1780000000
}
```

The API checks:

```text
Current time < exp
       │
   ┌───┴───┐
   ▼       ▼
 Valid   Expired
   │       │
   ▼       ▼
Continue  401
```

### What happens when access token expires?

```text
Client
  │
  ├── API request
  │
  ▼
API
  │
  └── 401
        │
        ▼
Client uses refresh token
        │
        ▼
Authorization Server
        │
        ▼
New access token
        │
        ▼
Retry API request
```

### Important

Don't rely on the frontend to decide whether a token is valid.

The **API must validate expiration**.

---

# H. Secure Token Storage

This is a common senior interview topic.

### Option 1 — HttpOnly Cookie

```http
Set-Cookie:
  session=abc;
  HttpOnly;
  Secure;
  SameSite=Lax
```

**HttpOnly**

```text
JavaScript ❌ → cannot read cookie
Browser     ✅ → sends cookie
```

This helps protect against token theft through JavaScript-based XSS.

**Secure**

```text
Only sent over HTTPS
```

**SameSite**

Helps reduce cross-site request risks, including CSRF.

---

### Option 2 — localStorage

```js
localStorage.setItem("accessToken", token);
```

JavaScript can read it:

```js
localStorage.getItem("accessToken");
```

Therefore, if an attacker achieves XSS:

```text
XSS
 ↓
JavaScript executes
 ↓
localStorage.getItem(...)
 ↓
Token stolen
```

So storing long-lived sensitive credentials in `localStorage` has significant security implications.

### Important trade-off

There is **no universal "JWT must go here" rule**.

The storage strategy depends on the architecture:

| Storage                        | Main concern               |
| ------------------------------ | -------------------------- |
| **HttpOnly Cookie**            | CSRF must be considered    |
| **localStorage**               | XSS can expose token       |
| **Memory**                     | Lost on refresh/tab close  |
| **Secure server-side session** | Requires server-side state |

For browser applications, **HttpOnly + Secure + appropriate SameSite cookies** are commonly preferred when the architecture supports cookie-based authentication.

---

# I. Complete End-to-End Flow

This is the flow you should be able to draw in a senior interview.

```text
                    ┌──────────────────────┐
                    │ Authorization Server │
                    │      / IdP           │
                    └──────────┬───────────┘
                               │
                               │
1. Login                        │
   │                            │
   ▼                            │
Frontend ──────────────────────►│
                               │
                       Authenticate User
                               │
                               │
2. Tokens                       │
   ◄────────────────────────────┘
   │
   ├── Access Token
   └── Refresh Token
   │
   │
3. API Request
   │
   │ Authorization: Bearer <access>
   ▼
┌─────────────────┐
│ API / Resource  │
│ Server          │
└────────┬────────┘
         │
         ├── Verify signature
         ├── Check expiration
         ├── Check issuer/audience
         ├── Identify user
         │
         ▼
    Authorization
         │
         ├── Role?
         ├── Permission?
         └── Resource ownership?
         │
     ┌───┴────┐
     ▼        ▼
   Allow     Deny
     │        │
     ▼        ├── 401 if unauthenticated
 Controller   └── 403 if unauthorized
     │
     ▼
  Service
     │
     ▼
 Database
```

### If access token expires

```text
API
 │
 └── 401
      │
      ▼
Client
 │
 └── Refresh Token
       │
       ▼
Authorization Server
       │
       └── New Access Token
                  │
                  ▼
              API retry
```

---

## 3. Practical Example

### Backend authentication middleware

```ts
async function authenticate(req, res, next) {
  const token = extractBearerToken(req);

  if (!token) {
    return res.status(401).json({ error: "UNAUTHENTICATED" });
  }

  try {
    const payload = await verifyJwt(token);

    req.user = {
      id: payload.sub,
      roles: payload.roles,
    };

    next();
  } catch {
    return res.status(401).json({ error: "INVALID_TOKEN" });
  }
}
```

### Authorization

```ts
function requireRole(role: string) {
  return (req, res, next) => {
    if (!req.user.roles.includes(role)) {
      return res.status(403).json({
        error: "FORBIDDEN",
      });
    }

    next();
  };
}
```

Usage:

```ts
app.delete(
  "/users/:id",
  authenticate,
  requireRole("admin"),
  deleteUser
);
```

The important separation is:

```text
authenticate()
      ↓
"Who is this?"

requireRole()
      ↓
"Can they do this?"
```

---

## 4. One-line Memory Trick

> **AuthN = Who are you? → Credential/token → API verifies identity → AuthZ = What can you do?**

And remember:

> **JWT = token format, OAuth = authorization framework, OIDC = identity layer, Session = server-side authentication state.**

---

## 5. Three Important Senior Interview Questions

### Q1. Explain authentication end-to-end from login to API authorization.

**Answer:**

The user authenticates with an authentication/identity provider. After successful authentication, the application receives a session or tokens. For token-based authentication, the client sends the access token with API requests. The API verifies the token's signature and claims such as expiration, issuer, and audience, then identifies the user. Finally, authorization checks roles, permissions, or resource ownership before allowing the operation.

**Common follow-up:**
**Where should authorization happen?**

On the **backend/resource server**. Frontend checks are only for UX and must never be treated as security controls.

---

### Q2. JWT vs Session — which would you choose?

**Answer:**

I wouldn't choose based purely on scalability.

**Sessions** keep authentication state on the server, making revocation straightforward, but distributed applications need shared session storage.

**JWTs** can allow APIs to validate credentials without looking up a session on every request, which can be useful in distributed systems. However, revocation, rotation, token size, and secure storage become important design concerns.

For a traditional web application, sessions can be simpler. For distributed APIs or OAuth-based architectures, tokens can be a better fit.

**Common follow-up:**
**Does JWT eliminate database calls?**

No. JWT verification itself may not require a session lookup, but the API may still query the database for **user state, permissions, resource ownership, or other current information**.

---

### Q3. Why do we use access and refresh tokens?

**Answer:**

The access token is used for API access and should generally be short-lived. The refresh token is used only to obtain a new access token, allowing the user to remain logged in without repeatedly entering credentials.

If an access token is stolen, its short lifetime limits exposure. Refresh tokens require stronger protection and should generally support **rotation and revocation**.

**Common follow-up:**
**What happens if the refresh token is stolen?**

An attacker could potentially obtain new access tokens. That's why refresh tokens should be protected, rotated, monitored for reuse, and revocable.

---

## 6. Common Mistakes

* ❌ Saying **OAuth 2.0 is an authentication protocol**.
* ❌ Confusing **OIDC with OAuth 2.0**.
* ❌ Treating **JWT as an authentication protocol**.
* ❌ Saying "JWT is always better than sessions."
* ❌ Saying JWT is automatically **stateless in the entire application**.
* ❌ Assuming JWT payload is encrypted.
* ❌ Putting passwords or secrets inside JWTs.
* ❌ Trusting frontend authorization checks.
* ❌ Checking only the JWT signature and ignoring **`exp`, `iss`, or `aud`** where applicable.
* ❌ Making access tokens unnecessarily long-lived.
* ❌ Sending refresh tokens to every API.
* ❌ Ignoring refresh-token rotation/revocation.
* ❌ Storing long-lived credentials in `localStorage` without considering XSS.
* ❌ Forgetting **CSRF** when using cookies.
* ❌ Confusing `401` and `403`.
* ❌ Assuming every API request must query the database just to validate a JWT.
* ❌ Putting authorization logic entirely inside controllers without a clear permission model.

### Senior-level security checklist

```text
Authentication
 ├── Who issued the credential?
 ├── Is it valid?
 ├── Is it expired?
 ├── Is it intended for this API?
 │
Authorization
 ├── What role?
 ├── What permission?
 ├── Does user own the resource?
 │
Credential Security
 ├── HTTPS
 ├── Secure storage
 ├── Short-lived access token
 ├── Refresh rotation
 └── Revocation strategy
```

---

## 7. 30-Second Interview Answer

> **"Authentication answers who the user is, while authorization determines what they're allowed to do. After login, we can maintain authentication using a server-side session or tokens. In a modern OAuth/OIDC architecture, the user authenticates with the identity provider and the client receives an access token and potentially a refresh token. The access token is sent to the API, where the server verifies its signature and claims such as expiration, issuer, and audience. Once the user is identified, authorization checks roles, permissions, or resource ownership. For security, I'd use HTTPS, short-lived access tokens, protected and rotated refresh tokens, and secure credential storage, while also considering XSS and CSRF depending on the storage mechanism."**

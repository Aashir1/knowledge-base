# Frontend System Design

## Component Architecture (Frontend System Design)

### 1. Short explanation (What + Why)

**What:**
Component Architecture is the way a frontend application is broken down into **small, reusable, and independent UI components** with clear responsibilities.

**Why:**
It improves **reusability, maintainability, scalability, and testability**, making large applications easier to develop and evolve.

---

### 2. Simple internal working (Senior interview level)

A good component architecture follows a **hierarchical structure**:

```
App
 ├── Layout
 │    ├── Header
 │    ├── Sidebar
 │    └── Footer
 │
 └── Pages
      ├── ProductList
      │     ├── ProductCard
      │     ├── SearchBar
      │     └── Pagination
      │
      └── ProductDetails
            ├── ImageGallery
            ├── ProductInfo
            └── Reviews
```

**Key principles:**

* **Single Responsibility** → One component, one job.
* **Composition over inheritance** → Build complex UIs by combining simple components.
* **Reusable components** → Avoid duplicate code.
* **Separation of concerns** → Keep UI, business logic, and API calls separate.

---

### 3. Small practical example/code

#### ❌ Bad

```tsx
<ProductPage />
```

One component handles:

* Fetch API
* Search
* Filters
* Product list
* Pagination
* Modal
* Cart logic

Hard to maintain.

---

#### ✅ Good

```
ProductPage
 ├── SearchBar
 ├── Filters
 ├── ProductList
 │     └── ProductCard
 ├── Pagination
 └── CartDrawer
```

Each component has a **single responsibility**.

---

### 4. One-line memory trick

**"Small, reusable, and composable components with one responsibility."**

---

### 5. 3 important senior interview questions

#### Q1. What makes a good component?

**Answer:**

* Single responsibility
* Reusable
* Easy to test
* Minimal props
* Independent of other components

---

#### Q2. Smart vs Dumb (Container vs Presentational) Components?

**Answer:**

* **Smart (Container):** Handles state, API calls, and business logic.
* **Presentational (Dumb):** Receives props and renders UI only.

Example:

```
ProductsContainer
      │
      ▼
ProductList
      │
      ▼
ProductCard
```

---

#### Q3. How do you avoid prop drilling?

**Answer:**
Use:

* Context API
* Redux/Zustand
* Component composition
* Custom hooks

Choose the smallest scope possible before introducing global state.

---

### 6. Common mistakes

* ❌ Creating huge "God Components"
* ❌ Mixing UI, business logic, and API calls in one component
* ❌ Overusing global state
* ❌ Passing props through many levels (prop drilling)
* ❌ Duplicating similar components instead of reusing them

---

### 7. 30-second interview response

> "Component architecture is about organizing a frontend application into small, reusable, and independent components with clear responsibilities. I follow principles like single responsibility, composition over inheritance, and separation of concerns. I keep business logic separate from presentation, avoid large monolithic components, and use shared components and appropriate state management to build scalable and maintainable applications."


## Authentication (Frontend System Design)

### 1. Short explanation (What + Why)

**What:**
Authentication is the process of **verifying who the user is** before allowing access to an application.

**Why:**
It protects user data and ensures only valid users can access protected resources.

Common approaches:

* **Session-based authentication**
* **Token-based authentication (JWT/OAuth)**

---

### 2. Simple internal working (Senior interview level)

#### Token-based flow (common in modern FE apps)

```
User
 |
 | Login (username/password)
 ↓
Frontend
 |
 | Send credentials
 ↓
Backend
 |
 | Validate user
 | Generate token
 ↓
Frontend stores token
 |
 | Send token with API requests
 ↓
Backend verifies token
 |
 Access granted
```

Example:

```
POST /login

Response:
{
  accessToken: "abc123"
}
```

API request:

```
GET /profile

Authorization: Bearer abc123
```

---

#### Common token storage options

| Storage         | Pros              | Cons                     |
| --------------- | ----------------- | ------------------------ |
| Memory          | Safer from XSS    | Lost on refresh          |
| localStorage    | Persistent        | Vulnerable to XSS        |
| HttpOnly Cookie | Protected from JS | Requires CSRF protection |

---

### 3. Small practical example/code

#### Protecting frontend routes (React)

```tsx
function ProtectedRoute({ children }) {
  const user = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
}
```

Usage:

```tsx
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

---

#### Adding token to API requests

```ts
fetch("/api/profile", {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

---

### 4. One-line memory trick

**"Authentication answers: Who are you? Authorization answers: What can you access?"**

---

### 5. 3 important senior interview questions

#### Q1. Authentication vs Authorization?

**Answer:**

* **Authentication:** Verifies identity.

  * "Are you Aashir?"
* **Authorization:** Verifies permissions.

  * "Can Aashir delete this user?"

---

#### Q2. Where should JWT tokens be stored?

**Answer:**

Preferred:

* Short-lived access token in memory
* Refresh token in **HttpOnly Secure Cookie**

Avoid storing sensitive tokens in localStorage because XSS can access them.

---

#### Q3. How do you handle token expiration?

**Answer:**

Common approach:

1. Access token expires.
2. Frontend calls refresh token endpoint.
3. Backend validates refresh token.
4. New access token is issued.
5. User continues without re-login.

---

### 6. Common mistakes

* ❌ Storing sensitive tokens in localStorage without considering XSS.
* ❌ Implementing authentication only on frontend.
* ❌ Forgetting backend authorization checks.
* ❌ Keeping access tokens alive for a long time.
* ❌ Mixing authentication and authorization concepts.

---

### 7. 30-second interview response

> "Authentication is the process of verifying a user's identity. In frontend systems, we typically implement it using sessions or tokens like JWT. After login, the frontend receives credentials or tokens and sends them with future requests. For secure applications, I prefer short-lived access tokens with refresh tokens stored in HttpOnly cookies. Authentication verifies who the user is, while authorization controls what actions they are allowed to perform."

## API Caching (Frontend System Design)

### 1. Short explanation (What + Why)

**What:**
API caching is storing API responses temporarily so future requests can be served faster without calling the backend again.

**Why:**
It improves:

* Performance (faster response)
* User experience
* Reduces server load
* Saves network bandwidth

Example:

```
First request:
Frontend → API → Database → Response

Next request:
Frontend → Cache → Response
```

---

### 2. Simple internal working (Senior interview level)

#### Cache flow:

```
User Request
      |
      ↓
Check Cache
      |
 ┌────┴────┐
 |         |
Hit       Miss
 |         |
Return     Call API
Data       |
           ↓
        Store Response
           |
           ↓
        Return Data
```

#### Common caching layers:

```
Browser Cache
      ↓
CDN Cache
      ↓
Frontend Cache (React Query/SWR)
      ↓
API Gateway Cache
      ↓
Backend Cache (Redis)
      ↓
Database
```

---

### 3. Small practical example/code

#### React Query API caching

```ts
const { data } = useQuery({
  queryKey: ["users"],
  queryFn: fetchUsers,
  staleTime: 60000
});
```

Meaning:

* Cache users response for 60 seconds.
* Avoid unnecessary API calls during that time.

---

#### HTTP Cache Headers

Backend response:

```http
Cache-Control: max-age=3600
```

Browser can reuse the response for 1 hour.

---

### 4. Common caching strategies

#### Cache First

```
Check cache → Use cache → Update later
```

Good for:

* Static data
* Product catalogs

---

#### Network First

```
Try API → If fails, use cache
```

Good for:

* Frequently changing data

---

#### Stale While Revalidate

```
Return cached data immediately
        +
Fetch fresh data in background
```

Used by:

* SWR
* React Query

---

### 5. One-line memory trick

**"Cache = store previous responses to avoid repeating expensive work."**

---

### 6. 3 important senior interview questions

#### Q1. Where would you implement caching in a frontend system?

**Answer:**

Depends on data:

* Browser cache → static assets
* React Query/SWR → API response caching
* CDN → public resources
* Backend Redis → expensive server operations

---

#### Q2. How do you handle stale data?

**Answer:**

Use strategies like:

* TTL (time-to-live)
* Cache invalidation
* Stale-while-revalidate
* Manual cache updates after mutations

---

#### Q3. Why is cache invalidation difficult?

**Answer:**

Because cached data can become outdated after updates.

Example:

```
User updates profile
       ↓
Old profile still exists in cache
```

Solutions:

* Remove cache after mutation
* Update cache manually
* Use short expiration times

---

### 7. Common mistakes

* ❌ Caching sensitive user data incorrectly
* ❌ No cache invalidation strategy
* ❌ Using very long TTL for frequently changing data
* ❌ Ignoring cache consistency issues
* ❌ Caching POST/transaction responses without proper design

---

### 8. 30-second interview response

> "API caching is the process of storing API responses temporarily to avoid unnecessary network requests. In frontend systems, I usually handle it using tools like React Query or SWR, which provide caching, revalidation, and synchronization. The main challenges are cache invalidation and stale data handling, which can be managed using TTL, stale-while-revalidate strategies, and updating or removing cache after mutations."

## WebSocket Architecture (Frontend System Design)

### 1. Short explanation (What + Why)

**What:**
WebSocket is a communication protocol that provides a **persistent, two-way connection** between client and server over a single TCP connection.

**Why:**
It enables **real-time communication** where the server can push data to clients instantly without repeated API polling.

Common use cases:

* Chat applications
* Live notifications
* Stock prices
* Gaming
* Real-time dashboards
* Collaboration tools (Google Docs style)

---

### 2. Simple internal working (Senior Interview Level)

#### Traditional HTTP (Request/Response)

```text
Client  ─── Request ───> Server
Client  <── Response ─── Server
```

Client must ask again for new data.

---

#### WebSocket

```text
Client                 Server

   ─── HTTP Upgrade ───>
   <── Connection OK ───

   <==== Persistent Connection ====>

   <──── Message ────
   ──── Message ────>
```

#### Connection lifecycle:

1. Client starts HTTP request with upgrade header:

```http
GET /chat
Upgrade: websocket
Connection: Upgrade
```

2. Server accepts and upgrades connection.

3. TCP connection stays open.

4. Both sides can send messages anytime.

5. Connection closes when client/server disconnects.

---

### 3. Small practical example/code

#### Client (Browser)

```javascript
const socket = new WebSocket(
  "wss://api.example.com/chat"
);

socket.onopen = () => {
  socket.send("Hello Server");
};

socket.onmessage = (event) => {
  console.log(event.data);
};
```

---

#### Server (Node.js)

```javascript
const WebSocket = require("ws");

const server = new WebSocket.Server({
  port: 8080
});

server.on("connection", socket => {

  socket.on("message", message => {
    console.log(message);
  });

  socket.send("Connected!");
});
```

---

### 4. WebSocket Architecture in Large Systems

```text
                 Load Balancer
                      |
          -------------------------
          |           |           |
     WS Server    WS Server   WS Server
          |           |           |
          -------- Message Broker ------
                    |
                  Redis/Kafka
                    |
               Backend Services
```

#### Why Message Broker?

Because users may connect to different WebSocket servers.

Example:

```
User A → WS Server 1
User B → WS Server 2

A sends message to B

WS Server 1
      |
      ↓
 Redis Pub/Sub
      |
      ↓
WS Server 2
      |
      ↓
User B
```

---

### 5. One-line Memory Trick

**"WebSocket = Keep one connection open and let both sides talk anytime."**

---

### 6. 3 Important Senior Interview Questions

#### Q1. WebSocket vs HTTP polling?

**Answer:**

| WebSocket                 | HTTP Polling            |
| ------------------------- | ----------------------- |
| Persistent connection     | New request every time  |
| Server can push instantly | Client asks repeatedly  |
| Lower latency             | More network overhead   |
| Good for real-time apps   | Good for simple updates |

---

#### Q2. How do you scale WebSockets horizontally?

**Answer:**

Use:

* Load balancer with sticky sessions (if needed)
* Shared state/message broker (Redis Pub/Sub, Kafka)
* Multiple WebSocket servers

Because each server only knows its connected clients.

---

#### Q3. How do you handle WebSocket disconnection?

**Answer:**

Implement:

* Heartbeat/ping-pong mechanism
* Automatic reconnect
* Message retry strategy
* Connection state tracking

Example:

```
Client
 |
Ping every 30s
 |
Server responds Pong
 |
No response → reconnect
```

---

### 7. Common Mistakes

❌ Using WebSocket for everything
→ Normal APIs are better for CRUD operations.

❌ Keeping unlimited connections without resource management.

❌ Not handling reconnect scenarios.

❌ Storing connection state only in memory when using multiple servers.

❌ Forgetting authentication during WebSocket handshake.

---

### 8. 30-Second Interview Response

> "WebSocket provides a persistent, bidirectional connection between client and server, allowing real-time communication without repeated HTTP requests. The connection starts with an HTTP upgrade handshake and then both sides can send messages anytime. In scalable systems, multiple WebSocket servers are usually combined with a message broker like Redis Pub/Sub or Kafka to synchronize messages across instances. Important considerations are authentication, connection management, reconnection handling, and horizontal scaling."


---

## Frontend System Design Interview Checklist

Expected heavily for Senior/Principal roles — this is about architecting a whole feature and defending tradeoffs out loud.

**Practice designing:** chat app, dashboard, data table, Google Docs, YouTube, Gmail, e-commerce, analytics dashboard.

**Structure your answer around these pillars (use this as a checklist in the interview):**
1. **Component architecture** — how the UI breaks into reusable, well-scoped pieces (e.g., a chat app: `MessageList`, `MessageInput`, `ConversationSidebar`).
2. **State management** — what's local (`useState`) vs shared (Context/Redux/Zustand) vs server-owned (React Query/SWR cache).
3. **API caching & pagination/infinite scroll** — e.g., cache messages by conversation ID, paginate by cursor, prefetch the next page before the user hits the bottom.
4. **Error handling** — retries, fallback UI, optimistic updates that roll back on failure.
5. **Authentication** — token storage, protected routes, refresh flow.
6. **Code splitting & CDN** — split by route, serve static assets from edge locations near the user.
7. **SSR vs CSR vs SSG:**
   - **SSR**: server builds HTML per request → fresh data, slower TTFB, good SEO. (e.g., a live dashboard)
   - **CSR**: browser gets a blank shell + JS builds it → fast server, slow first paint. (e.g., an internal admin tool)
   - **SSG**: HTML built once at deploy time → fastest, but data can go stale. (e.g., a marketing/blog page)
8. **Security & monitoring** — sanitize inputs, CSP headers, error/performance tracking (Sentry, Datadog).

**Interview tip:** Always state assumptions out loud first ("I'll assume ~10k concurrent users, real-time updates matter more than perfect consistency") — that's what separates senior answers from junior ones.

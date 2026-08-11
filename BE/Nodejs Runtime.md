# Node.js Runtime

## 1. Short Explanation (What + Why)

* **Node.js** is a JavaScript runtime built on **V8** that executes JavaScript outside the browser.
* It uses a **single main JavaScript thread** with an **Event Loop** to handle many concurrent operations.
* **I/O operations** such as network requests, file access, and database calls can happen asynchronously without blocking JavaScript execution.
* The key idea: **Node doesn't create one JavaScript thread per request**; it efficiently coordinates many concurrent I/O operations.

---

## 2. Internal Working (Senior Interview Level)

### High-level model

```text
Incoming Requests
       │
       ▼
┌─────────────────┐
│  Node.js        │
│  Call Stack     │
│  Event Loop     │
└────────┬────────┘
         │
    Async I/O
         │
         ▼
┌─────────────────┐
│ OS / libuv      │
│ / Thread Pool   │
└────────┬────────┘
         │
         ▼
    Completion
         │
         ▼
   Callback / Promise
         │
         ▼
      Event Loop
         │
         ▼
      Call Stack
```

### 1. Call Stack

* JavaScript executes functions using the **Call Stack**.
* Synchronous code runs immediately on the stack.
* While the stack is executing a long-running task, **nothing else can execute on that JavaScript thread**.

```js
function a() {
  b();
}

function b() {
  console.log("Hello");
}

a();
```

```text
a()
 ↓
b()
 ↓
console.log()
 ↓
stack empty
```

---

### 2. Event Loop

The **Event Loop** continuously checks whether JavaScript has work to execute.

Simplified:

```text
Call Stack
    │
    │ empty?
    ▼
Event Loop
    │
    ├── process microtasks
    │
    └── process ready callbacks/tasks
```

It allows Node.js to start asynchronous operations and continue processing other requests instead of waiting.

---

### 3. I/O and libuv

Node relies heavily on **libuv** for asynchronous operations.

For example:

```js
const data = await fs.promises.readFile("file.txt");
```

Conceptually:

```text
JS Thread
   │
   ├── start file I/O
   │
   ├── continue other work
   │
   ▼
libuv / OS
   │
   ▼
I/O completes
   │
   ▼
Promise becomes fulfilled
   │
   ▼
Microtask queue
   │
   ▼
Event Loop → Call Stack
```

The important senior-level point:

> **Node's JavaScript execution is single-threaded, but Node itself is not limited to one thread.**
> OS facilities and libuv's **thread pool** can handle certain asynchronous operations.

---

### 4. Microtasks vs Macrotasks

**Microtasks** have higher priority than normal task/callback queues.

Common microtasks:

* `Promise.then/catch/finally`
* Continuations after `await`
* `queueMicrotask()`

Common task/callback sources:

* Timers such as `setTimeout`
* I/O callbacks
* Other event-loop phases

Simplified:

```text
Current synchronous code
        ↓
Microtasks
        ↓
Event-loop tasks/callbacks
        ↓
Microtasks
        ↓
Next event-loop work
```

Example:

```js
console.log("1");

setTimeout(() => console.log("2"), 0);

Promise.resolve().then(() => console.log("3"));

console.log("4");
```

Output:

```text
1
4
3
2
```

Because synchronous code runs first, then the **microtask**, then the timer callback.

---

### 5. async/await

`async/await` does **not** make JavaScript synchronous.

```js
async function getUser() {
  const user = await fetchUser();
  return user;
}
```

Conceptually:

```text
getUser()
   │
   ├── fetchUser() starts
   │
   ├── await → function yields
   │
   ▼
Event Loop handles other work
   │
   ▼
Promise resolves
   │
   ▼
await continuation → microtask
   │
   ▼
function continues
```

The important point:

> **`await` pauses the async function, not the entire Node.js thread.**

---

### 6. Blocking vs Non-blocking

**Blocking:**

```js
const result = heavyCalculation();
```

If `heavyCalculation()` takes 5 seconds, the JavaScript thread cannot process other work during those 5 seconds.

**Non-blocking:**

```js
const result = await database.query(...);
```

While the database operation is pending, Node can process other requests.

---

### 7. CPU-bound vs I/O-bound

| Type          | Example                                  | Node.js impact                             |
| ------------- | ---------------------------------------- | ------------------------------------------ |
| **I/O-bound** | DB, HTTP, filesystem                     | Usually handled efficiently asynchronously |
| **CPU-bound** | Image processing, encryption, huge loops | Can block Event Loop                       |

This distinction is extremely important in Node interviews.

### CPU-bound problem

```js
app.get("/report", (req, res) => {
  for (let i = 0; i < 10_000_000_000; i++) {
    // expensive calculation
  }

  res.send("done");
});
```

While this executes:

```text
Request A → CPU-heavy loop
                    │
                    ├── Request B waits
                    ├── Request C waits
                    └── Request D waits
```

Even though Node supports many concurrent connections, **the JavaScript thread is blocked**.

Solutions can include:

* **Worker Threads**
* Separate processes/services
* Job queues/background workers
* Moving expensive computation to another service

---

## 3. Practical Example

```js
const http = require("http");

http.createServer(async (req, res) => {
  const user = await fetchUserFromDB();

  res.end(JSON.stringify(user));
}).listen(3000);
```

While `fetchUserFromDB()` is waiting for the database:

```text
Request A
   │
   └── DB waiting ─────────────┐
                              │
Request B ──► processed        │
Request C ──► processed        │
Request D ──► processed        │
                              │
   ◄──────── DB result ────────┘
```

That's why Node is particularly effective for **I/O-heavy applications** such as APIs, real-time services, and web backends.

**Important:** `await` itself isn't what makes the operation non-blocking. The underlying API must actually be **asynchronous/non-blocking**.

---

## 4. One-line Memory Trick

> **Node uses one main JS thread, offloads waiting work, and uses the Event Loop to keep the thread moving—block that thread and concurrency suffers.**

---

## 5. Three Important Senior Interview Questions

### Q1. Why can Node.js handle thousands of concurrent requests if JavaScript is single-threaded?

**Answer:**

Node doesn't dedicate a JavaScript thread to every request. For I/O operations, it starts the operation and continues processing other work while the OS/libuv handles the waiting. When the operation completes, its callback or Promise continuation is scheduled back onto the Event Loop.

**Follow-up:**
**What happens with CPU-heavy work?**

It can block the single JavaScript thread, preventing the Event Loop from processing other requests.

---

### Q2. What happens when you block the Event Loop?

**Answer:**

The JavaScript thread cannot process other callbacks, timers, Promise continuations, or incoming request handlers. As a result, **latency increases for unrelated requests**, even if those requests themselves are lightweight.

```text
CPU-heavy task
      │
      ▼
Event Loop blocked
      │
      ├── Request A delayed
      ├── Request B delayed
      └── Request C delayed
```

**Follow-up:**
**How would you solve it?**

Use **Worker Threads**, background jobs, separate services/processes, or redesign the expensive operation.

---

### Q3. What is the difference between microtasks and macrotasks?

**Answer:**

Microtasks, such as Promise continuations, are processed with higher priority than normal event-loop tasks. After the current synchronous execution completes, Node processes pending microtasks before moving to subsequent event-loop work.

```js
console.log("A");

setTimeout(() => console.log("B"), 0);

Promise.resolve().then(() => console.log("C"));

console.log("D");
```

Output:

```text
A
D
C
B
```

**Follow-up:**
**Can microtasks cause problems?**

Yes. Continuously scheduling microtasks can **starve other Event Loop work**, delaying timers and I/O callbacks.

---

## 6. Common Mistakes

* ❌ Saying **"Node.js is single-threaded"** without explaining that Node/libuv can use OS facilities and a **thread pool**.
* ❌ Saying `async/await` creates a new thread.
* ❌ Saying `await` blocks the Node.js thread.
* ❌ Assuming all asynchronous work uses the libuv thread pool.
* ❌ Thinking `setTimeout(..., 0)` executes immediately.
* ❌ Ignoring **CPU-bound work** when discussing Node scalability.
* ❌ Using synchronous APIs such as `fs.readFileSync()` in request handlers unnecessarily.
* ❌ Running expensive loops, large JSON processing, or CPU-heavy transformations directly on the main thread.
* ❌ Saying Node is automatically faster than multi-threaded runtimes. **Workload matters.**

### Senior Best Practice

When designing Node.js services, always ask:

```text
Is this operation CPU-bound or I/O-bound?
             │
      ┌──────┴──────┐
      ▼             ▼
    I/O            CPU
      │             │
 Async APIs     Worker/process/
 are ideal      background job
```

---

## 7. 30-Second Interview Answer

> **"Node.js uses V8 to execute JavaScript and relies on an Event Loop for concurrency. The JavaScript execution itself happens on a main thread, but I/O operations can be handled asynchronously through the OS and libuv, allowing Node to process other requests while those operations are pending. When the I/O completes, the callback or Promise continuation is scheduled back onto the Event Loop. This makes Node very effective for I/O-bound workloads. However, CPU-heavy synchronous work blocks the Event Loop, increasing latency for all requests, so for CPU-bound tasks I'd use Worker Threads, background jobs, or separate services."**

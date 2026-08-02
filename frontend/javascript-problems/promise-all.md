# Promise.all() Implementation

## 1. Short explanation (What + Why)

**What:**
`Promise.all()` runs **multiple promises in parallel** and waits until **all of them succeed**.

**Why:**
It reduces total execution time by running independent async tasks concurrently.

Example:

* Fetch user
* Fetch orders
* Fetch notifications

Instead of waiting one by one, run all together.

---

## 2. Simple internal working (Senior Interview Level)

Without `Promise.all()` (Sequential)

```text
Request A (2s)
      ↓
Request B (2s)
      ↓
Request C (2s)

Total = 6 seconds
```

With `Promise.all()` (Parallel)

```text
Request A (2s)
Request B (2s)
Request C (2s)

↓

Wait for all

↓

Total ≈ 2 seconds
```

---

## 3. Small practical example/code

### Basic Usage

```javascript
const p1 = Promise.resolve("User");
const p2 = Promise.resolve("Orders");
const p3 = Promise.resolve("Profile");

Promise.all([p1, p2, p3]).then((results) => {
  console.log(results);
});
```

Output:

```text
["User", "Orders", "Profile"]
```

---

### Real-world Example

```javascript
const [user, posts, comments] = await Promise.all([
  fetch("/api/user").then(res => res.json()),
  fetch("/api/posts").then(res => res.json()),
  fetch("/api/comments").then(res => res.json())
]);
```

All three API calls start **at the same time**.

---

## 4. How to Implement `Promise.all()`

```javascript
function myPromiseAll(promises) {
  return new Promise((resolve, reject) => {
    const results = [];
    let completed = 0;

    if (promises.length === 0) {
      resolve([]);
      return;
    }

    promises.forEach((promise, index) => {
      Promise.resolve(promise)
        .then((value) => {
          results[index] = value; // preserve order
          completed++;

          if (completed === promises.length) {
            resolve(results);
          }
        })
        .catch(reject); // reject immediately
    });
  });
}
```



Usage:

```javascript
myPromiseAll([
  Promise.resolve(1),
  Promise.resolve(2),
  Promise.resolve(3)
]).then(console.log);

// [1,2,3]
```

```javascript

//own implementation

const myPromiseAll = (promises: Promise<any>[]) => {
    return new Promise((resolve, reject) => {

        if(promises.length === 0) return resolve([]);

        const responses = [];
        let promiseExecutionCount = 0;

        for (const [index, promise] of promises.entries()) {

            let individualResponse = undefined;
            promise
                .then(res => {
                    individualResponse = res;
                    promiseExecutionCount++;
                })
                .catch(err => reject(err))
                .finally(() => {
                    if (individualResponse !== undefined) {
                        responses[index] = individualResponse;
                        if (promiseExecutionCount === promises.length) {
                            return resolve(responses);
                        }
                    }

                })
        }
    })
}

```

---

## 5. One-line memory trick

**"Promise.all() = Run together, succeed together, fail fast."**

---

## 6. 3 Important Senior Interview Questions

### Q1. Does `Promise.all()` execute promises sequentially?

**Answer:**

No.

All promises **start immediately** and run in parallel (concurrently from JavaScript's perspective).

---

### Q2. What happens if one promise fails?

**Answer:**

`Promise.all()` **rejects immediately** with that error.

```javascript
Promise.all([
  Promise.resolve(1),
  Promise.reject("Error"),
  Promise.resolve(3)
]);
```

Result:

```text
Rejected: Error
```

---

### Q3. Does `Promise.all()` preserve order?

**Answer:**

Yes.

Even if promises finish in different orders, the returned array matches the **input order**.

```javascript
Promise.all([A, B, C])

↓

[A result, B result, C result]
```

---

## 7. Common mistakes

❌ Thinking promises execute one after another.

❌ Forgetting that one rejection causes the entire `Promise.all()` to reject.

❌ Not preserving the original order in a custom implementation.

❌ Forgetting to wrap values with `Promise.resolve()` (handles both promises and normal values).

---

## 8. 30-second interview response

> "Promise.all() runs multiple asynchronous operations concurrently and returns a single promise that resolves when all of them succeed. It preserves the input order of results regardless of completion order and rejects immediately if any promise fails. Internally, it tracks completed promises, stores results by index, and resolves once all have completed. It's ideal for independent API calls that can execute in parallel to improve performance."

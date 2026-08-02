```typescript

//throttle

const throttle = <T extends (...args: any[]) => void>(fn: T, millisecond: number) => {

    let canCall = true;

    return (...args: Parameters<T>) => {

        if (canCall) {
            fn(...args)
            canCall = false;
            setTimeout(() => {
                canCall = true
            }, millisecond)
        }
    }
}

```

# Throttle Implementation Notes

* **Purpose:** Limits how often a function can execute within a given time interval.

* **Behaviour:** This is a **leading-edge throttle**:

  * First call executes immediately.
  * Subsequent calls within the delay period are ignored.
  * After the delay, the function becomes available again.

* **State management:**

  * `canCall` acts as a lock/flag.
  * `true` → function execution is allowed.
  * `false` → calls are ignored until the timer resets it.

* **Flow:**

  1. Receive function call.
  2. Check `canCall`.
  3. If allowed:

     * Execute `fn(...args)`.
     * Disable further executions.
     * Start timer.
  4. After `millisecond`, re-enable execution.

* **TypeScript generics:**

  ```ts
  <T extends (...args: any[]) => void>
  ```

  * Ensures `fn` must be a function.
  * `Parameters<T>` preserves the original function's argument types when calling the throttled function.

* **Common use cases:**

  * Scroll events.
  * Resize handlers.
  * Mouse movement tracking.
  * Preventing excessive API calls.

* **Limitation:**

  * Does not support **trailing execution** (the last ignored call is not executed after the delay).
  * Does not preserve `this` context for object methods.

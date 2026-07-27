# Frontend Interview Preparation Guide

Based on `FE-interview-topics`, in order of importance. Each topic has: a simple explanation, then a short example or analogy to anchor it in memory.

---

## 1. JavaScript (Highest Priority)

### Closures, scope, hoisting
A closure is a function that keeps access to variables from where it was born, even after the outer function is done running. Think of it as a backpack the function carries around with it.

A closure gives a function access to its outer scope. In JavaScript, closures are created every time a function is created, at function creation time

```js
function makeCounter() {
  let count = 0;          // this variable lives in the "backpack"
  return () => ++count;   // the returned function keeps access to it
}
const counter = makeCounter();
counter(); // 1
counter(); // 2 — count survived between calls
```
**Hoisting:** `var` and function declarations are lifted to the top of scope (initialized as `undefined`). `let`/`const` are hoisted too but stay in a "temporal dead zone" — unusable until their line runs.

Traditionally (before ES6), JavaScript variables only had two kinds of scopes: function scope and global scope. Variables declared with var are either function-scoped or global-scoped, depending on whether they are declared within a function or outside a function. This can be tricky, because blocks with curly braces do not create scopes.

In ES6, JavaScript introduced the let and const declarations, which, among other things like temporal dead zones, allow you to create block-scoped variables.

A variable declared with let, const, or class is said to be in a "temporal dead zone" (TDZ) from the start of the block until code execution reaches the place where the variable is declared and initialized.

```js
console.log(a); // undefined (var hoisted)
var a = 1;
console.log(b); // ReferenceError (let is in the dead zone)
let b = 2;
```

### `this`, bind/call/apply
# JavaScript: `call()`, `apply()`, and `bind()`

The easiest way to remember these methods is by thinking about **what action they perform**.

```javascript
function greet() {
  console.log(`Hi, I'm ${this.name}`);
}

const person = { name: "Aashir" };
```

---

## 1. `call()` → **"Call it NOW"**

Runs the function immediately and sets the value of `this`.

```javascript
greet.call(person);
```

Think:

> "Hey `greet()`, call yourself right now for `person`."

---

## 2. `apply()` → **"Apply it NOW with an array"**

Works exactly like `call()`, but arguments are passed as an array.

```javascript
function intro(city, country) {
  console.log(this.name, city, country);
}

intro.apply(person, ["Toronto", "Canada"]);
```

Think:

> "Call it now, but my arguments are already inside an array."

---

## 3. `bind()` → **"Don't call it yet"**

`bind()` does **not** execute the function.

It returns a **new function** with `this` permanently set.

```javascript
const sayHi = greet.bind(person);

sayHi();
```

Think:

> "Create a new version of `greet()` that always uses `person`."

Nothing happens until you call `sayHi()`.

---

# Easy Analogy

Imagine you have a TV remote.

- **call()** → Press the power button **right now**.
- **apply()** → Press the power button **right now**, but the settings are already in a list.
- **bind()** → Save the remote as a favorite. **It doesn't turn on the TV yet**. You can use it later.

---

# One Sentence to Remember

- **call()** → Executes immediately.
- **apply()** → Executes immediately with array arguments.
- **bind()** → Returns a new function; executes later.

---

# Quick Comparison

```javascript
greet.call(person);            // Runs now

greet.apply(person);           // Runs now

const fn = greet.bind(person); // Doesn't run
fn();                          // Runs later
```

---

# Interview Answer (30 seconds)

> All three methods let us control the value of `this`.
>
> - **`call()`** invokes the function immediately and accepts arguments individually.
> - **`apply()`** invokes the function immediately but accepts arguments as an array.
> - **`bind()`** does not invoke the function. It returns a new function with `this` permanently bound, which can be called later.


# Event loop, microtasks vs macrotasks

When we executes JS code it creates **Global Execution Context**.
If anything has to be executed first it will go into the callstack.Callstack waits for nothing.
As anything comes into the callstack, callstack start executing it.

Timers: setTimeout, setInterval etc functions provided by Web Api (Browser)

After timer has passed JS push task into the queue/task queue.

Event queue comes into the picture it takes task from the queue and push it into the callstack for execution.

Micro Task queue contains the callbacks of promises. Micro task queue has higher priority then the queue/task queue.

Event queue has priority of Micro task queue if there are 2 tasks 1 in task queue and the another one is in Micro task queue. Event Loop will always pick task from Micro task queue.


JS is single-threaded. It runs your main script, then drains **all microtasks** (Promises, `queueMicrotask`), then runs **one macrotask** (`setTimeout`, UI events), then repeats.
```js
console.log('1');
setTimeout(() => console.log('2'), 0); // macrotask — waits its turn
Promise.resolve().then(() => console.log('3')); // microtask — jumps the line
console.log('4');
// Output: 1, 4, 3, 2
```
**Memory trick:** "Microtasks are VIP guests — they always get seated before the next round of regular guests (macrotasks)."

# Promises, async/await
A Promise is an IOU for a value that isn't ready yet. `async/await` just lets you write that IOU-waiting code so it looks synchronous.
```js
function getUser() {
  return new Promise((resolve) => setTimeout(() => resolve({ name: 'Aashir' }), 1000));
}
```
### What is `await`?

`await` pauses **only the async function**, not the entire JavaScript program.

```javascript
async function getUser() {
  const user = await fetch("/user");
  console.log(user);
}
```

Think of `await` as saying:

> "Pause this function until the Promise finishes."

---

## Does `await` block JavaScript?

**No.**

It pauses **only that function**, while JavaScript continues running other code.

Example:

```javascript
async function example() {
  console.log("1");

  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log("2");
}

example();

console.log("3");
```

Output:

```
1
3
2
```


## Prototypes & inheritance

### What is a Prototype?

A **prototype** is an object that is shared by all instances created from a constructor function.

Instead of every object having its own copy of a method, the method is stored on the constructor's `prototype`.

Example:

```javascript
function Person(name) {
  this.name = name;
}

// Setting the prototype
Person.prototype.greet = function () {
  console.log(`Hello, I'm ${this.name}`);
};

const user = new Person("Aashir");

user.greet(); // Hello, I'm Aashir
```

Here, we explicitly set the prototype using:

```javascript
Person.prototype.greet = ...
```

The `user` object doesn't have its own `greet()` method. JavaScript finds it on `Person.prototype`.

---

## Prototype Chain

When you access a property:

1. JavaScript checks the object itself.
2. If not found, it checks the object's prototype.
3. It keeps searching up the prototype chain until `null`.

```
user
  ↓
Person.prototype
  ↓
Object.prototype
  ↓
null
```

---

## Prototype Inheritance

```javascript
function Animal() {}

Animal.prototype.speak = function () {
  console.log("Animal speaks");
};

function Dog() {}

Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

const dog = new Dog();

dog.speak(); // Animal speaks
```

Here, `Dog.prototype` inherits from `Animal.prototype`, so every `Dog` instance can use `speak()`.

---

## Interview Answer (20 seconds)

> Every constructor function has a `prototype` object. Methods placed on the prototype are shared by all instances, saving memory. When a property isn't found on an object, JavaScript looks for it on its prototype, then continues up the prototype chain until it reaches `null`. This is how JavaScript implements inheritance.

### Modules
Split code into files, expose only what's needed.
```js
// math.js
export const add = (a, b) => a + b;
// app.js
import { add } from './math.js';
```

### Debounce & throttle
# JavaScript Debounce & Throttle (Simple Explanation)

## Why do we need them?

Some events happen **many times per second**, such as:

- Typing
- Scrolling
- Resizing
- Mouse movement

If we call an API or perform heavy calculations every time, the app becomes slow.

**Debounce** and **Throttle** help control how often a function runs.

---

# Debounce

## What is Debounce?

Debounce waits until the user **stops** doing something.

Think:

> **"Wait... if the user keeps typing, don't do anything. Once they stop for 500ms, execute."**

### Example

Search box

```
A
As
Aas
Aash
Aashi
Aashir
```

Without debounce:

```
6 API calls
```

With debounce (500ms):

```
1 API call
```

The API is called only after the user stops typing.

---

### Simple Timeline

```
Typing:

A ---- As ---- Aas ---- Aash ------ Stop

                    (500ms)

API Call
```

---

### Code

```javascript
function debounce(fn, delay) {
  let timer;

  return function (...args) {
    clearTimeout(timer);

    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}
```

Usage

```javascript
const search = debounce(() => {
  console.log("Searching...");
}, 500);
```

---

# Throttle

## What is Throttle?

Throttle allows the function to run **at most once** every X milliseconds.

Think:

> **"Run now, then ignore all calls until 500ms have passed."**

---

### Example

Scrolling

The user scrolls continuously.

Without throttle:

```
100 events
```

With throttle (500ms):

```
Runs every 500ms
```

---

### Simple Timeline

```
Scroll Scroll Scroll Scroll Scroll Scroll

|------500ms------|------500ms------|

Run                 Run
```

---

### Code

```javascript
function throttle(fn, delay) {
  let canRun = true;

  return function (...args) {
    if (!canRun) return;

    fn(...args);

    canRun = false;

    setTimeout(() => {
      canRun = true;
    }, delay);
  };
}
```

Usage

```javascript
const handleScroll = throttle(() => {
  console.log("Scrolling...");
}, 500);
```

---

# Difference

| Debounce | Throttle |
|----------|----------|
| Waits until the user stops | Runs at fixed intervals |
| Only the last action executes | First action executes immediately |
| Best for typing/search | Best for scrolling/resizing |

---

# Easy Analogy

Imagine pressing a doorbell.

### Debounce 🚪

You keep pressing:

```
Press Press Press Press
```

The bell rings **only after you stop pressing**.

---

### Throttle 🚦

Traffic light

Cars keep coming, but only **one car passes every 30 seconds**.

It doesn't matter how many cars arrive.

---

# When to Use

Use **Debounce** for:
- Search input
- Auto-save
- Form validation
- API calls while typing

Use **Throttle** for:
- Scroll events
- Window resize
- Mouse movement
- Infinite scrolling
- Drag events

---

# Interview Answer (30 seconds)

> Debounce delays execution until the user stops triggering an event for a specified time. It's commonly used for search inputs to avoid unnecessary API calls. Throttle limits a function to run at most once within a specified interval, making it ideal for high-frequency events like scrolling or resizing.

### Currying
Breaking a multi-argument function into a chain of one-argument functions.
```js
const add = (a) => (b) => (c) => a + b + c;
add(1)(2)(3); // 6
const addFive = add(5); // partially filled-in, reusable later
```

### Deep copy vs shallow copy
Shallow copy duplicates the top layer only — nested objects are still shared references. Deep copy duplicates everything, all the way down.
```js
const original = { name: 'A', address: { city: 'Lahore' } };
const shallow = { ...original };
shallow.address.city = 'Karachi';
console.log(original.address.city); // 'Karachi' — leaked! Same nested object.

const deep = structuredClone(original); // real independent copy
deep.address.city = 'Islamabad';
console.log(original.address.city); // still 'Karachi' — unaffected
```

### Memory leaks
Memory that should be released but isn't, because something is still holding a reference — most often a forgotten timer, event listener, or closure.
```js
function attach() {
  const bigData = new Array(1_000_000).fill('x');
  document.addEventListener('click', () => console.log(bigData.length));
  // bigData never gets garbage collected — the listener holds it forever
}
```
**Fix pattern:** always `removeEventListener` / `clearInterval` when a component unmounts.

### ES6+ features (quick reference)
```js
const { name, age = 18 } = person;     // destructuring + default
const combined = [...arr1, ...arr2];   // spread
const val = obj?.a?.b ?? 'fallback';   // optional chaining + nullish coalescing
const greet = (name) => `Hi ${name}!`; // arrow fn + template literal
```

### Practice implementing these from scratch (very common interview asks):
`Promise.all`, debounce, throttle, deep clone, an event emitter, `map`/`filter`/`reduce`, an LRU cache. Write these without looking anything up — that's the real test.

---
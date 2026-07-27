## 2. React

# React Rendering Lifecycle, Virtual DOM & Reconciliation (Simple Explanation)

These three concepts are closely related.

```
State/Props Change
        ↓
Component Re-renders
        ↓
Virtual DOM is Updated
        ↓
React compares Old vs New Virtual DOM (Reconciliation)
        ↓
Only the changed parts are updated in the Real DOM
```

---

# 1. Rendering Lifecycle

## What is Rendering?

Rendering means React executes your component function to determine what the UI should look like.

Example:

```jsx
function App() {
  return <h1>Hello</h1>;
}
```

React calls:

```javascript
App();
```

and gets

```jsx
<h1>Hello</h1>
```

Then it displays it on the screen.

---

## When does React render?

A component renders when:

- State changes
- Props change
- Parent component renders
- Context changes

Example:

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  console.log("Rendering...");

  return (
    <button onClick={() => setCount(count + 1)}>
      {count}
    </button>
  );
}
```

Every click:

```
State changes
      ↓
React renders Counter again
```

---

## React Rendering Lifecycle

```
Component mounts
      ↓
Render
      ↓
Commit to DOM
      ↓
User interacts
      ↓
State changes
      ↓
Render again
      ↓
Commit only changes
```

---

# 2. Virtual DOM

## What is the Virtual DOM?

The Virtual DOM is a **lightweight JavaScript copy of the Real DOM**.

Instead of updating the browser directly, React first updates this copy.

Example:

Real DOM

```html
<h1>Hello</h1>
```

Virtual DOM

```javascript
{
  type: "h1",
  props: {
    children: "Hello"
  }
}
```

---

When state changes

Old Virtual DOM

```
<h1>Hello</h1>
```

New Virtual DOM

```
<h1>Hello Aashir</h1>
```

React compares these two copies before touching the browser.

---

# Why use Virtual DOM?

Updating the Real DOM is expensive.

Updating a JavaScript object is very fast.

So React:

1. Updates Virtual DOM.
2. Finds what changed.
3. Updates only those parts in the Real DOM.

---

# 3. Reconciliation

## What is Reconciliation?

Reconciliation is React's process of comparing:

```
Old Virtual DOM
        VS
New Virtual DOM
```

and deciding **what actually needs to change**.

---

Example

Before

```jsx
<h1>Hello</h1>
```

After

```jsx
<h1>Hello Aashir</h1>
```

React sees only the text changed.

It updates only:

```
Hello
```

instead of recreating the whole page.

---

Another example

Before

```jsx
<div>
    <h1>Hello</h1>
    <button>Save</button>
</div>
```

After

```jsx
<div>
    <h1>Hello Aashir</h1>
    <button>Save</button>
</div>
```

React updates only:

```
<h1>
```

The button is untouched.

---

# Why are Keys important?

When rendering lists:

```jsx
users.map(user =>
    <User key={user.id} />
)
```

React uses `key` to identify which items:

- changed
- moved
- were removed
- were added

Without keys, React may recreate components unnecessarily, causing extra rendering and loss of component state.

---

# Easy Analogy

Imagine editing a Word document.

Without React:

Delete the entire document and rewrite everything.

With React:

Only change the sentence that was edited.

The Virtual DOM is the copy you're editing, and Reconciliation is comparing the old and new copies to update only what's different.

---

# Interview Answer (45 seconds)

> Whenever state or props change, React re-renders the component by executing its function again to create a new Virtual DOM. The Virtual DOM is a lightweight JavaScript representation of the UI. React then performs **Reconciliation**, where it compares the previous Virtual DOM with the new one (a process called diffing). Based on the differences, React updates only the necessary parts of the Real DOM instead of re-rendering the entire page, making UI updates efficient and improving performance.

## Fiber

Fiber is React's rendering engine (introduced in React 16).

Before Fiber, React rendered the entire UI in one go, which could block the main thread.

With Fiber, React breaks rendering into small units of work, allowing it to:
- Pause rendering
- Resume rendering later
- Prioritize urgent updates (e.g., typing over rendering a large list)

This makes the UI more responsive.

**Interview Answer:**
> Fiber is React's rendering engine that breaks rendering work into smaller tasks. This allows React to pause, prioritize urgent updates, and continue rendering later instead of blocking the browser.

---

## Concurrent Rendering

Concurrent Rendering allows React to interrupt a low-priority render to process a higher-priority update first.

Example:
- User is typing in an input (high priority)
- React is rendering a large list (low priority)

React pauses rendering the list, updates the input immediately, then resumes rendering the list.

This keeps the UI smooth and responsive.

---

## Suspense

Suspense lets a component wait for asynchronous work (such as lazy-loaded code or data) while displaying a fallback UI.

```jsx
<Suspense fallback={<Spinner />}>
  <ProfilePage />
</Suspense>
```

Instead of showing a blank page, React displays the spinner until `ProfilePage` is ready.

**Interview Answer:**
> Suspense allows React to display a fallback UI while waiting for a component or data to load, improving the user experience.
## React.memo, useMemo & useCallback

All three are **performance optimization tools**. They don't add new features—they help React avoid unnecessary work.

### React.memo

Prevents a component from re-rendering if its **props haven't changed** (shallow comparison).

```jsx
const ExpensiveRow = React.memo(({ data }) => {
  return <div>{data.name}</div>;
});
```

If `data` has the same reference, `ExpensiveRow` won't re-render.

---

### useMemo

Caches the **result of an expensive calculation** so it isn't recomputed on every render.

```jsx
const total = useMemo(
  () => items.reduce((a, b) => a + b, 0),
  [items]
);
```

The calculation runs again only if `items` changes.

---

### useCallback

Caches a **function reference** so a new function isn't created on every render.

```jsx
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

Useful when passing callbacks to memoized child components.

---

## Memory Trick

- **React.memo** → Memoize a **Component**
- **useMemo** → Memoize a **Value**
- **useCallback** → Memoize a **Callback (Function)**

> **Interview Answer:** React.memo prevents unnecessary component re-renders when props don't change. useMemo caches computed values, and useCallback caches function references. All three are used to optimize React performance, but they should only be used when there's a measurable performance benefit.

## Context API

Context API lets you share data across multiple components **without passing props through every intermediate component (prop drilling).**

```jsx
const ThemeContext = createContext("light");

<ThemeContext.Provider value="dark">
  <App />
</ThemeContext.Provider>
```

Any descendant component can access the value directly:

```jsx
const theme = useContext(ThemeContext);
```

Instead of:

```
App
 ↓
Layout
 ↓
Sidebar
 ↓
Menu
 ↓
Button
```

Passing `theme` as a prop through every level, Context lets `Button` access it directly.

---

### Common Use Cases

- Theme (Light/Dark)
- Current User
- Authentication
- Language (i18n)
- Feature Flags

---

### When NOT to Use Context

Context is **not a replacement for state management libraries** like Redux or Zustand.

Every consumer re-renders when the context value changes, so Context is best for data that changes infrequently.

---

### Interview Answer (30 seconds)

> Context API allows components to share data without prop drilling. A Provider supplies the value, and any descendant component can access it using `useContext()`. It's ideal for global data like themes, authentication, or language settings, but it's not intended for frequently changing application state because updates can cause all consuming components to re-render.

# Custom Hooks

## What is it?

A **custom hook** is a reusable JavaScript function that contains React hooks (`useState`, `useEffect`, etc.) to share **stateful logic** between components.

A custom hook **must start with `use`** so React can enforce the Rules of Hooks.

> **Important:** Custom hooks **share logic, not state**.

---

## How does it work?

When a component calls a custom hook:

1. React executes the hook.
2. The hook creates its own state and effects.
3. Each component gets its **own independent state**.

```
Component A
      │
      ▼
useWindowWidth()
      │
      ▼
Own State

Component B
      │
      ▼
useWindowWidth()
      │
      ▼
Own State
```

Although both components use the same hook, their state is completely separate.

---

## Example

```jsx
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return width;
}
```

Usage:

```jsx
function App() {
  const width = useWindowWidth();

  return <h1>Window Width: {width}</h1>;
}
```

---

## Memory Trick

- **Component** → UI
- **Custom Hook** → Reusable logic

> **Custom hooks share logic, not state.**

---

## Senior Interview Questions

### Q1: Why use custom hooks?

To reuse stateful logic across multiple components, reduce duplication, and keep components focused on rendering.

---

### Q2: Do custom hooks share state?

No.

Each component calling a custom hook gets its **own independent state**.

```jsx
const width1 = useWindowWidth(); // Component A
const width2 = useWindowWidth(); // Component B
```

`width1` and `width2` are different state instances.

---

### Q3: Can a custom hook call another custom hook?

Yes.

Custom hooks can use built-in hooks (`useState`, `useEffect`, etc.) and other custom hooks.

---

### Q4: Why must a custom hook start with `use`?

React uses the `use` prefix to identify hooks and enforce the **Rules of Hooks** through linting and runtime behavior.

---

### Q5: Can I conditionally call a custom hook?

No.

Just like built-in hooks, custom hooks must always be called at the top level and in the same order on every render.

❌ Wrong

```jsx
if (isLoggedIn) {
  useAuth();
}
```

✅ Correct

```jsx
const auth = useAuth();

if (isLoggedIn) {
  // use auth
}
```

---

### Q6: When should you create a custom hook?

When the same stateful logic is used in multiple components.

Examples:
- Authentication (`useAuth`)
- API requests (`useFetch`)
- Local Storage (`useLocalStorage`)
- Debouncing (`useDebounce`)
- Window Size (`useWindowWidth`)

---

## Common Mistakes

❌ Thinking custom hooks share state.

❌ Calling hooks conditionally inside a custom hook.

❌ Using a custom hook when a simple utility function would be enough.

❌ Forgetting cleanup inside `useEffect`, causing memory leaks.

---

## Interview Answer (30 sec)

> A custom hook is a reusable function that encapsulates stateful logic using React hooks. It allows multiple components to reuse the same logic without duplicating code while keeping components focused on rendering. Custom hooks must start with `use` and follow the same Rules of Hooks as built-in hooks. Each component that uses a custom hook gets its own independent state.

### Error boundaries
A component that catches JS errors in its children and shows a fallback instead of a white screen of death.
```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? <Fallback /> : this.props.children; }
}
```

### Code splitting
Ship JS in smaller chunks, loaded only when needed.
```jsx
const Settings = React.lazy(() => import('./Settings')); // loaded only when this route is visited
```

### Server Components & Hydration
Server Components render fully on the server and never ship their JS to the browser — less bundle, faster load. **Hydration** is React "waking up" server-rendered HTML in the browser and attaching event listeners/interactivity to it.
**Analogy:** Server rendering delivers a printed photo (looks complete). Hydration is React reaching into that photo and turning it into a live video you can interact with.

### Strict Mode
A dev-only wrapper that double-invokes certain functions (like component bodies) to help you catch side effects that shouldn't be there. It changes nothing in production.

**Coding practice:** Todo app, infinite scroll, modal, data table, tree view, file explorer, autocomplete, virtualized list — build these with plain React, no UI library, to prove you understand the mechanics.

---

# State Batching

## What is it?

State batching means React **groups multiple state updates into a single re-render** instead of rendering after every `setState()` call.

This improves performance by reducing unnecessary renders.

---

## How does it work?

Without batching:

```
setState()
↓
Render

setState()
↓
Render
```

With batching:

```
setState()
setState()
setState()
      ↓
One Render
```

---

## Example

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(c => c + 1);
    setCount(c => c + 1);
    setCount(c => c + 1);
  };

  return <button onClick={handleClick}>{count}</button>;
}
```

After one click:

```
count = 3
```

React performs **one render**, not three.

---

## Memory Trick

> **Multiple state updates → One render**

---

## Senior Interview Questions

### Q1: Why does React batch state updates?

To improve performance by reducing unnecessary re-renders.

---

### Q2: Does `setState()` update state immediately?

No.

State updates are **scheduled**, so reading the state immediately after `setState()` may return the old value.

---

### Q3: Why use the functional update?

```jsx
setCount(c => c + 1);
```

Because it always receives the **latest state**, making multiple updates reliable.

---

## Common Mistakes

❌ Expecting state to update immediately after `setState()`.

❌ Using:

```jsx
setCount(count + 1);
setCount(count + 1);
```

Both use the same `count` value.

✅ Correct:

```jsx
setCount(c => c + 1);
setCount(c => c + 1);
```

---

## Interview Answer (30 sec)

> State batching is React's optimization where multiple state updates are grouped into a single re-render. This reduces unnecessary rendering and improves performance. When the next state depends on the previous state, the functional update form (`setState(prev => ...)`) should be used to ensure each update uses the latest value.

# React Scheduler

## What is it?

The **React Scheduler** decides **when rendering should happen**.

It prioritizes urgent updates (like typing or clicking) over less important work (like rendering a large list).

---

## How does it work?

Instead of rendering everything at once, React can:

- Pause rendering
- Prioritize urgent updates
- Resume rendering later

Example:

```
User typing ✍️   → High Priority
Large list 📝    → Low Priority

Scheduler:
1. Update input first
2. Continue rendering the list
```

This keeps the UI responsive.

---

## Memory Trick

> **Scheduler = Traffic Controller for React updates.**

---

## Senior Interview Questions

### Q1: Is Scheduler the same as the Event Loop?

No.

The **Event Loop** is part of JavaScript.

The **Scheduler** is React's internal mechanism for prioritizing rendering work.

---

### Q2: Why was the Scheduler introduced?

To prevent long renders from blocking user interactions and improve responsiveness.

---

### Q3: Does the Scheduler make rendering faster?

Not necessarily.

It makes the app **feel faster** by prioritizing important updates.

---

## Common Mistakes

❌ Thinking Scheduler is part of JavaScript.

❌ Thinking Scheduler reduces render time.

It improves **responsiveness**, not rendering speed.

---

## Interview Answer (30 sec)

> The React Scheduler is React's internal priority system. It decides when rendering should occur by prioritizing urgent updates, such as user input, over less important rendering work. This keeps the UI responsive and enables features like Concurrent Rendering.

# React Profiler

## What is it?

The **React Profiler** is a tool used to **measure rendering performance**.

It helps identify:
- Which components re-rendered
- Why they re-rendered
- How long they took to render

---

## How does it work?

Open **React DevTools → Profiler**, record an interaction, and inspect:

- Components that rendered
- Render duration
- Render reason

Use it to find performance bottlenecks.

---

## Memory Trick

> **Profiler = Performance Debugger for React.**

---

## Senior Interview Questions

### Q1: Does Profiler improve performance?

No.

It only helps **identify** performance issues.

---

### Q2: When would you use React Profiler?

When investigating unnecessary re-renders or slow UI performance.

---

### Q3: What can React Profiler tell you?

- Which components rendered
- Why they rendered
- How long rendering took

---

## Common Mistakes

❌ Thinking Profiler optimizes performance.

❌ Using optimization hooks (`React.memo`, `useMemo`) without first profiling.

---

## Interview Answer (30 sec)

> React Profiler is a performance analysis tool available in React DevTools. It helps identify which components re-rendered, why they rendered, and how long rendering took. It's used to diagnose performance bottlenecks before applying optimizations like `React.memo` or `useMemo`.

# Hydration

## What is it?

**Hydration** is the process where React **attaches JavaScript to HTML generated by the server**, making the page interactive.

Without hydration, the page looks correct but buttons, forms, and events won't work.

---

## How does it work?

```
Server
   ↓
HTML sent to browser
   ↓
Page is visible
   ↓
React loads JavaScript
   ↓
Hydration
   ↓
Page becomes interactive
```

---

## Example

Before Hydration:

✅ Page is visible

❌ Button doesn't respond

After Hydration:

✅ Button works

```jsx
<button onClick={handleClick}>
  Click Me
</button>
```

---

## Memory Trick

> **Hydration = Adding interactivity to server-rendered HTML.**

---

## Senior Interview Questions

### Q1: Why do we need hydration?

Because server-rendered HTML is static. Hydration attaches event listeners and React logic to make it interactive.

---

### Q2: What is a hydration mismatch?

When the HTML generated on the server doesn't match what React renders on the client.

Common causes:
- `Math.random()`
- `Date.now()`
- Browser-only APIs (`window`, `localStorage`)
- Different data on server and client

---

### Q3: How can you avoid hydration mismatches?

- Keep initial server and client renders consistent.
- Access browser APIs inside `useEffect`.
- Avoid non-deterministic values during rendering.

---

## Common Mistakes

❌ Thinking hydration renders the page.

➡️ The server already rendered the HTML.

❌ Accessing `window` or `localStorage` during server rendering.

---

## Interview Answer (30 sec)

> Hydration is the process where React attaches JavaScript and event listeners to HTML that was already rendered on the server, making the page interactive. It's commonly used in SSR frameworks like Next.js. A common issue is a hydration mismatch, which occurs when the server-rendered HTML differs from the client's initial render.

# SSR vs CSR vs SSG vs ISR

## SSR (Server-Side Rendering)

### What is it?

The server generates the HTML **on every request**.

```
User Request
      ↓
Server renders page
      ↓
HTML sent to browser
```

✅ Always fresh data

❌ Slower than SSG

**Example:** Dashboard, user profile, stock prices

---

## CSR (Client-Side Rendering)

### What is it?

The server sends a minimal HTML page, and JavaScript builds the UI in the browser.

```
User Request
      ↓
Empty HTML
      ↓
JS downloads
      ↓
React renders page
```

✅ Rich interactive apps

❌ Slower initial load
❌ Worse SEO

**Example:** Gmail, Trello, Admin Panel

---

## SSG (Static Site Generation)

### What is it?

Pages are generated **at build time** and served as static HTML.

```
Build Time
      ↓
Generate HTML
      ↓
Store on CDN
      ↓
Serve instantly
```

✅ Fastest
✅ Best SEO

❌ Data changes require rebuilding

**Example:** Blog, Marketing Site, Documentation

---

## ISR (Incremental Static Regeneration)

### What is it?

Like SSG, but React/Next.js regenerates pages **after deployment**.

```
Build
      ↓
Static Page
      ↓
After X seconds
      ↓
Background Regeneration
```

```js
export async function getStaticProps() {
  return {
    props: {},
    revalidate: 60
  };
}
```

Every 60 seconds, the page can be regenerated with fresh data.

✅ Fast
✅ Fresh data
✅ No full rebuild

**Example:** E-commerce product pages, News websites

---

## Memory Trick

- **CSR** → Render in the **Client**
- **SSR** → Render on the **Server**
- **SSG** → Render during **Build**
- **ISR** → Static page + **Automatic Regeneration**

---

## Senior Interview Questions

### Q1: Which one is best for SEO?

**SSR, SSG, and ISR** because search engines receive fully rendered HTML.

---

### Q2: Which one is fastest?

**SSG**, since pages are pre-built and usually served from a CDN.

---

### Q3: When would you choose ISR over SSG?

When content changes periodically but doesn't need to be regenerated on every request (e.g., product catalog, news).

---

### Q4: Can a Next.js app use all four?

Yes.

Different routes/pages can use different rendering strategies.

---

## Common Mistakes

❌ Thinking SSR renders once.

➡️ SSR renders **on every request**.

❌ Thinking ISR regenerates every request.

➡️ It regenerates **only after the revalidation interval**.

❌ Thinking CSR is bad.

➡️ CSR is ideal for highly interactive applications.

---

## Interview Answer (30 sec)

> **CSR** renders the UI in the browser and is ideal for highly interactive apps. **SSR** renders the page on the server for every request, providing fresh data and good SEO. **SSG** generates pages at build time, making it the fastest option for static content. **ISR** extends SSG by regenerating static pages in the background after a specified interval, combining the performance of static pages with periodically updated content.

# React Server Components (RSC)

## What is it?

React Server Components are **components that render on the server** and send **HTML + serialized data** to the client.

Unlike Client Components, they **don't ship their JavaScript to the browser**, reducing bundle size.

---

## How does it work?

```
Browser Request
       ↓
Server renders component
       ↓
HTML sent to browser
       ↓
Only interactive components load JavaScript
```

Example:

```jsx
// Server Component (default in Next.js App Router)

async function Products() {
  const products = await getProducts();

  return <ProductList products={products} />;
}
```

No `useEffect` or client-side fetching is needed.

---

## Client Component

If a component needs:

- State
- Event handlers
- Browser APIs
- Hooks like `useState`

Add:

```jsx
"use client";
```

Example:

```jsx
"use client";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      {count}
    </button>
  );
}
```

---

## Memory Trick

- **Server Component** → Data & HTML
- **Client Component** → Interactivity

---

## Senior Interview Questions

### Q1: Why use React Server Components?

To reduce JavaScript sent to the browser, improve performance, and fetch data directly on the server.

---

### Q2: Can Server Components use `useState` or `useEffect`?

No.

Server Components cannot use client-side hooks or browser APIs.

---

### Q3: When do you use `"use client"`?

When the component needs:
- State
- Effects
- Event handlers
- Browser APIs (`window`, `localStorage`)

---

### Q4: Can a Server Component render a Client Component?

Yes.

A Server Component can import and render a Client Component.

```
Server Component
       ↓
Client Component
```

The reverse is **not allowed**.

---

## Common Mistakes

❌ Thinking Server Components replace Client Components.

➡️ They complement each other.

❌ Using `useState` or `useEffect` in a Server Component.

❌ Adding `"use client"` unnecessarily, increasing the JavaScript bundle.

---

## Interview Answer (30 sec)

> React Server Components render on the server and send HTML plus serialized data to the client, reducing the amount of JavaScript downloaded by the browser. They're ideal for data fetching and static UI. Components that require state, effects, event handlers, or browser APIs must be marked with `"use client"` and run as Client Components.

# React Compiler (React 19+)

## What is it?

The **React Compiler** is a build-time compiler that **automatically optimizes React components**.

It reduces unnecessary re-renders by automatically applying optimizations that previously required `React.memo`, `useMemo`, and `useCallback`.

---

## How does it work?

Before:

```jsx
const handleClick = useCallback(() => {
  save(id);
}, [id]);

const total = useMemo(() => calculate(items), [items]);

export default React.memo(Component);
```

After React Compiler:

```jsx
function Component() {
  // Write normal React code
}
```

The compiler automatically optimizes the component during build time.

---

## Memory Trick

> **React Compiler = Automatic Memoization**

---

## Senior Interview Questions

### Q1: Does React Compiler replace `React.memo`, `useMemo`, and `useCallback`?

Mostly yes.

It automatically performs many of these optimizations, reducing the need for manual memoization.

---

### Q2: Does React Compiler change how React works?

No.

It only optimizes the generated code. Your component logic remains the same.

---

### Q3: Will we never use `useMemo` or `useCallback` again?

Not necessarily.

There are still cases where manual optimization or specific behavior may be needed, but much less frequently.

---

## Common Mistakes

❌ Thinking React Compiler changes React's rendering behavior.

❌ Assuming all apps automatically use React Compiler.

➡️ It must be enabled and supported by the framework/build setup.

---

## Interview Answer (30 sec)

> React Compiler is a build-time optimization tool that automatically memoizes components and values where it's safe to do so. Its goal is to reduce unnecessary re-renders without requiring developers to manually use `React.memo`, `useMemo`, or `useCallback` in many cases. It improves performance while keeping component code simpler.

# Keys & List Rendering

## What is it?

A **key** is a unique identifier that helps React identify each item in a list.

React uses keys during **Reconciliation** to determine which items were:
- Added
- Removed
- Updated
- Moved

---

## How does it work?

```jsx
const users = [
  { id: 1, name: "Ali" },
  { id: 2, name: "Sara" }
];

return (
  <>
    {users.map(user => (
      <User key={user.id} user={user} />
    ))}
  </>
);
```

React compares keys instead of comparing every component.

---

## Why are Keys Important?

Without keys:

```
Ali
Sara
Ahmed (insert at top)
```

React may think **every item changed** and re-render them unnecessarily.

With keys:

```
1 → Ali
2 → Sara
3 → Ahmed
```

React knows only **Ahmed** was added.

---

## Memory Trick

> **Keys give each list item an identity.**

---

## Senior Interview Questions

### Q1: Why shouldn't we use the array index as a key?

Because if items are added, removed, or reordered, indexes change. React may reuse the wrong component, causing incorrect UI or lost state.

---

### Q2: When is it okay to use the array index as a key?

Only when:
- The list is static.
- Items are never added, removed, or reordered.

---

### Q3: What happens if two items have the same key?

React can't uniquely identify them, which can lead to incorrect updates and rendering bugs.

---

### Q4: Does the `key` prop get passed to the component?

No.

`key` is used internally by React and is **not available** inside the component.

```jsx
<User key={user.id} user={user} />
```

```jsx
function User(props) {
  console.log(props.key); // undefined
}
```

---

## Common Mistakes

❌ Using array index as the key for dynamic lists.

```jsx
users.map((user, index) => (
  <User key={index} />
));
```

✅ Better:

```jsx
users.map(user => (
  <User key={user.id} />
));
```

❌ Using duplicate keys.

---

## Interview Answer (30 sec)

> Keys are unique identifiers used by React to track items in a list during reconciliation. They help React determine which items were added, removed, moved, or updated, allowing it to update only the necessary DOM elements efficiently. For dynamic lists, stable unique IDs should be used instead of array indexes.

# Keys & List Rendering

## What is it?

A **key** is a unique identifier that helps React identify each item in a list.

React uses keys during **Reconciliation** to determine which items were:
- Added
- Removed
- Updated
- Moved

---

## How does it work?

```jsx
const users = [
  { id: 1, name: "Ali" },
  { id: 2, name: "Sara" }
];

return (
  <>
    {users.map(user => (
      <User key={user.id} user={user} />
    ))}
  </>
);
```

React compares keys instead of comparing every component.

---

## Why are Keys Important?

Without keys:

```
Ali
Sara
Ahmed (insert at top)
```

React may think **every item changed** and re-render them unnecessarily.

With keys:

```
1 → Ali
2 → Sara
3 → Ahmed
```

React knows only **Ahmed** was added.

---

## Memory Trick

> **Keys give each list item an identity.**

---

## Senior Interview Questions

### Q1: Why shouldn't we use the array index as a key?

Because if items are added, removed, or reordered, indexes change. React may reuse the wrong component, causing incorrect UI or lost state.

---

### Q2: When is it okay to use the array index as a key?

Only when:
- The list is static.
- Items are never added, removed, or reordered.

---

### Q3: What happens if two items have the same key?

React can't uniquely identify them, which can lead to incorrect updates and rendering bugs.

---

### Q4: Does the `key` prop get passed to the component?

No.

`key` is used internally by React and is **not available** inside the component.

```jsx
<User key={user.id} user={user} />
```

```jsx
function User(props) {
  console.log(props.key); // undefined
}
```

---

## Common Mistakes

❌ Using array index as the key for dynamic lists.

```jsx
users.map((user, index) => (
  <User key={index} />
));
```

✅ Better:

```jsx
users.map(user => (
  <User key={user.id} />
));
```

❌ Using duplicate keys.

---

## Interview Answer (30 sec)

> Keys are unique identifiers used by React to track items in a list during reconciliation. They help React determine which items were added, removed, moved, or updated, allowing it to update only the necessary DOM elements efficiently. For dynamic lists, stable unique IDs should be used instead of array indexes.

## 3. TypeScript

### Generics
A placeholder for a type, so one function/component works safely with many types.
```ts
function firstItem<T>(arr: T[]): T { return arr[0]; }
firstItem<number>([1, 2, 3]);   // T = number
firstItem<string>(['a', 'b']);  // T = string
```
**Analogy:** Generics are like a labeled box — you decide what goes inside (`T`) when you use it, not when you build the box.

### Utility types
Built-in transformers for existing types instead of writing new ones by hand.
```ts
interface User { id: number; name: string; email: string; }
type UserPreview = Pick<User, 'id' | 'name'>;   // only id + name
type OptionalUser = Partial<User>;              // all fields optional
type NoEmail = Omit<User, 'email'>;              // everything except email
```

### Mapped types
The mechanism *behind* utility types — looping over a type's keys to build a new type.
```ts
type ReadonlyUser = { readonly [K in keyof User]: User[K] };
```

### Conditional types & `infer`
Types that branch based on a condition; `infer` lets you "capture" a type you don't know yet.
```ts
type IsString<T> = T extends string ? true : false;
type A = IsString<'hi'>; // true

type ReturnOf<T> = T extends (...args: any[]) => infer R ? R : never;
type R1 = ReturnOf<() => number>; // number
```

### `keyof`
Gives you a union of an object type's property names — useful for type-safe property access.
```ts
type UserKeys = keyof User; // 'id' | 'name' | 'email'
function getProp<T, K extends keyof T>(obj: T, key: K) { return obj[key]; } // key must be a real property
```

### Discriminated unions & type narrowing
A union where every variant shares one common "tag" field, so TypeScript can figure out exactly which shape you have.
```ts
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; side: number };

function area(s: Shape) {
  if (s.kind === 'circle') return Math.PI * s.radius ** 2; // TS knows `radius` exists here
  return s.side ** 2; // TS knows it's the square variant here
}
```

### Interfaces vs types
Both describe object shapes. `interface` can be re-opened and merged later; `type` is more flexible (can represent unions, tuples, primitives) but is closed once declared.
```ts
interface Animal { name: string }
interface Animal { age: number } // ✅ merges automatically into one interface

type Point = { x: number } | [number, number]; // ✅ type can do unions, interface can't
```

---

## 4. HTML/CSS

### Flexbox vs Grid
Flexbox = one direction at a time (a row of nav items). Grid = rows *and* columns together (a full page layout).
```css
.nav { display: flex; justify-content: space-between; }     /* one axis */
.page { display: grid; grid-template-columns: 200px 1fr; }  /* two axes */
```

### Stacking context
Decides which overlapping element sits on top. A common trap: `z-index` only works within the same stacking context — a `z-index: 9999` child can still be hidden behind a lower `z-index` element if its parent creates a *new* stacking context (e.g., via `opacity` or `transform`).

### Accessibility (ARIA) & Semantic HTML
Use real tags (`<button>`, `<nav>`, `<article>`) instead of `<div onClick>` everywhere — screen readers and keyboards understand semantic tags for free.
```html
<button aria-pressed="true">Like</button> <!-- announces state to screen readers -->
```

### Responsive layouts
```css
@media (max-width: 768px) { .sidebar { display: none; } }
```

### CSS specificity
Inline style > ID > class/attribute > element. When two rules conflict, the more specific one wins regardless of order in the file.
```css
#header { color: red; }     /* specificity: 100 — wins */
.header { color: blue; }    /* specificity: 10 — loses even if written after */
```

### Performance & Animations
Animate `transform`/`opacity` (GPU-accelerated, no layout recalculation) instead of `width`/`top`/`left` (triggers reflow on every frame).
```css
.card { transition: transform 0.2s; } /* smooth, cheap */
.card:hover { transform: translateY(-4px); }
```

---

## 5. Frontend System Design

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

---

## 6. Next.js

- **App Router** — file-based routing under `app/`, supports nested layouts, Server Components by default.
- **Server Components** — render on the server, ship zero JS for that component.
- **Route Handlers** — `app/api/users/route.ts` exporting `GET`/`POST` — this *is* your backend endpoint inside Next.js.
- **Middleware** — runs before the request completes, e.g., redirect unauthenticated users at the edge:
  ```ts
  export function middleware(req) {
    if (!req.cookies.get('token')) return NextResponse.redirect('/login');
  }
  ```
- **ISR** — a static page regenerates itself in the background after N seconds, so users get speed *and* eventually-fresh content:
  ```ts
  export const revalidate = 60; // page regenerates at most once per minute
  ```
- **Streaming** — HTML is sent to the browser in chunks as each piece becomes ready, instead of waiting for the whole page (pairs with Suspense).
- **Server Actions** — call a server-side function directly from a form, no manual API route needed:
  ```ts
  async function createPost(formData: FormData) { 'use server'; /* runs on server */ }
  ```
- **Caching** — Next.js caches `fetch()` calls by default; the classic interview trap is "why is my data stale?" → answer: you need `{ cache: 'no-store' }` or a `revalidate` value.

---

## 7. Performance

- **Web Vitals**: **LCP** (how fast the biggest visible content loads), **INP** (how fast the page responds to a click/tap), **CLS** (how much content jumps around unexpectedly).
- **Lazy loading**: `<img loading="lazy" />` or `React.lazy()` — defer loading until needed.
- **Tree shaking**: unused exports get automatically stripped from the final bundle by the bundler.
- **Bundle splitting**: one big JS file → multiple smaller files loaded on demand.
- **Image optimization**: serve right-sized, modern formats (WebP/AVIF) instead of one oversized JPEG for every device.
- **React profiling**: use React DevTools Profiler to see *actual* re-render costs instead of guessing which component is slow.
- **Memoization & virtualization**: cache expensive computations (`useMemo`); for long lists, render only the ~20 visible rows instead of all 10,000 (libraries: `react-window`, `react-virtual`).

---

## 8. Browser Fundamentals

### Critical rendering path
`HTML → DOM` + `CSS → CSSOM` → combine into **Render Tree** → **Layout** (calculate positions/sizes) → **Paint** (draw pixels).

### Reflow vs Repaint
- **Reflow**: layout changes (size/position) — expensive, cascades to other elements.
- **Repaint**: only visual changes (color) — cheaper, no layout recalculation.
```js
element.style.width = '200px';  // triggers reflow
element.style.color = 'red';    // triggers repaint only
```

### Event bubbling/capturing
An event travels **down** from the root to the target first (capturing), then **back up** to the root (bubbling) — this is why a click on a button also fires listeners on its parent `<div>`.
```js
parent.addEventListener('click', () => console.log('parent'));
child.addEventListener('click', () => console.log('child'));
// clicking child logs: "child" then "parent" (bubbling, the default)
```

### CORS
The browser blocks a page on `siteA.com` from reading a response from `api.siteB.com` unless `siteB` explicitly allows it via an `Access-Control-Allow-Origin` header. **The server, not the browser, opts in.**

### Cookies vs Storage
Cookies are automatically sent with every request to that domain (good for session auth, but adds request weight). `localStorage`/`sessionStorage` stay in the browser only — you must manually attach them (e.g., in an `Authorization` header).

### Service Workers
A background script that intercepts network requests — enables offline mode and custom caching (this is what powers installable PWAs).

---

## 9. Security

### XSS (Cross-Site Scripting)
Attacker sneaks JS into your page, usually through unescaped user input, and it runs in *other* users' browsers.
```jsx
<div dangerouslySetInnerHTML={{ __html: userComment }} /> // ❌ if userComment = "<img src=x onerror=alert('hacked')>"
<div>{userComment}</div> // ✅ React escapes this automatically
```

### CSRF (Cross-Site Request Forgery)
Tricks a *logged-in* user's browser into firing a request they didn't intend (e.g., a hidden auto-submitting form on a malicious site that hits your bank's transfer endpoint, using the victim's existing cookies).
**Defense:** CSRF tokens + `SameSite` cookies.

### CSP (Content Security Policy)
A response header that whitelists where scripts/styles/images are allowed to load from, so even if an attacker injects a `<script src="evil.com">`, the browser refuses to run it.
```
Content-Security-Policy: script-src 'self' https://trusted-cdn.com;
```

### OAuth
Lets a user grant App A access to their data on App B ("Sign in with Google") without ever handing App A their Google password.

### JWT (JSON Web Token)
A signed token (`header.payload.signature`) carrying user identity — the server can verify it wasn't tampered with, without a database lookup, enabling stateless auth.

### SameSite cookies
```
Set-Cookie: session=abc123; SameSite=Strict
```
`Strict`/`Lax` stop the cookie from being sent on cross-site requests — a direct defense against CSRF.

---

## 10. Coding Interview (DSA)

Focus areas: arrays, strings, hash maps, sliding window, two pointers, stack, queue, binary search, trees, graphs, DFS/BFS, basic dynamic programming.

**Pattern-recognition cheat sheet:**
- "Subarray/substring with a condition" → **sliding window**
- "Sorted array, find a pair/triplet" → **two pointers**
- "Find in sorted data fast" → **binary search**
- "Count/group/dedupe fast" → **hash map**
- "Nested/recursive structure (folders, org chart)" → **tree + DFS**
- "Shortest path / level-by-level" → **BFS**
- "Overlapping subproblems, optimal choice" → **dynamic programming**

**Goal:** 150–200 problems solved with real understanding of *why* the pattern applies — not hundreds solved by memorizing solutions.

---

## Mock Interview Questions to Rehearse Out Loud

- Explain the JavaScript event loop (bonus: predict console.log order with setTimeout + Promise mixed in).
- How does React reconciliation work, and why do keys matter?
- Difference between `useMemo` and `useCallback` — give an example of each.
- Design a reusable DataTable (sorting, filtering, pagination, virtualization).
- Build an autocomplete component (debounced fetch, keyboard navigation, race condition handling).
- Why is React fast? (Virtual DOM + Fiber + batching)
- Explain React Fiber in your own words.
- SSR vs CSR vs SSG — when would you pick each, with a real example?
- Design a notification system (real-time delivery, read/unread state, dedupe).
- How would you optimize a slow React app? (profile first, then memoize/virtualize/split)
- How would you build infinite scrolling? (Intersection Observer + pagination)
- How would you implement authentication on the frontend? (token storage, refresh, protected routes)
- How would you handle optimistic UI updates? (update UI instantly, roll back on server error)
- Design a dashboard handling 100k+ records. (virtualization + server-side filtering/aggregation, not client-side)

---

## Resources

- **JavaScript:** Frontend Masters, JavaScript.info
- **React:** Epic React, React.dev
- **TypeScript:** Total TypeScript
- **System Design:** Frontend System Design (Alex Xu), YouTube
- **Coding:** LeetCode, NeetCode

---

## Your Edge

Given your background with React, Next.js, NestJS, AWS, and AI-assisted development, the areas most likely to set you apart are **JavaScript internals, frontend system design, React performance, and DSA coding**. If time is short, prioritize these four.

# useTransition

## 1. Problem

Imagine this UI:

```text
┌─────────────────────────┐
│ Search: React           │  ← User is typing
└─────────────────────────┘

        ↓

┌─────────────────────────┐
│ 10,000 search results   │  ← Expensive to render
│ ...                     │
└─────────────────────────┘
```

Every time the user types:

```text
R → Re → Rea → Reac → React
```

React may need to render a large amount of UI.

If that rendering is expensive:

```text
User types
    ↓
State update
    ↓
Expensive rendering
    ↓
UI becomes less responsive
```

**The problem:** Some UI updates are more urgent than others.

---

## 2. Why Normal Approach Can Become a Problem

Normally:

```tsx
setQuery("react");
```

React receives the state update and schedules the resulting rendering.

Now imagine the update causes a huge component tree to render:

```text
setQuery()
    ↓
React renders
    ↓
10,000 items
    ↓
expensive work
    ↓
typing can feel sluggish
```

But from the user's perspective:

```text
Typing "react"
      ↓
"I need to see my typing immediately"
```

While rendering thousands of results:

```text
"These results can catch up shortly."
```

So we need a way to tell React:

> **"This update is important, but it isn't urgent."**

That's what `useTransition` gives us.

---

## 3. Core Mental Model

The most important concept:

```text
             React Updates
                  │
        ┌─────────┴─────────┐
        ↓                   ↓
     Urgent              Transition
        │                   │
   "Do this now"       "Can wait a little"
        │                   │
   typing/clicking      expensive UI
```

When you write:

```tsx
startTransition(() => {
    setSomething(value);
});
```

you're telling React:

> **"Treat this state update as non-urgent."**

That's the mental model.

### Don't think:

```text
useTransition = delay this update
```

Think:

```text
useTransition = lower the priority of this update
```

---

## 4. Small Practical Example

Imagine switching between tabs where the Analytics tab is expensive to render:

```tsx
function Dashboard() {
    const [tab, setTab] = useState("home");
    const [isPending, startTransition] = useTransition();

    function changeTab(nextTab: string) {
        startTransition(() => {
            setTab(nextTab);
        });
    }

    return (
        <>
            <button onClick={() => changeTab("home")}>
                Home
            </button>

            <button onClick={() => changeTab("analytics")}>
                Analytics
            </button>

            {isPending && <span>Loading...</span>}

            <TabContent tab={tab} />
        </>
    );
}
```

The important part:

```tsx
startTransition(() => {
    setTab(nextTab);
});
```

You're telling React:

> **"Rendering the new tab is not as urgent as immediate user interactions."**

And:

```tsx
isPending
```

lets you show feedback while the transition is pending.

---

## 5. What Happens Internally

Let's follow the example.

### Step 1 — User clicks Analytics

```text
Click Analytics
      ↓
changeTab("analytics")
```

### Step 2 — Update is wrapped in `startTransition`

```tsx
startTransition(() => {
    setTab("analytics");
});
```

React now knows:

```text
"This state update is transition work."
```

### Step 3 — React starts rendering

```text
setTab("analytics")
        ↓
React renders Analytics
        ↓
potentially expensive work
```

### Step 4 — An urgent update happens

Suppose the user interacts with something else:

```text
Analytics rendering
       ↓
User types/clicks
       ↓
Urgent update arrives
```

React can prioritize the urgent work rather than treating everything equally.

Conceptually:

```text
URGENT UPDATE
     ↓
handle first

TRANSITION UPDATE
     ↓
continue when appropriate
```

### Step 5 — React finishes the transition

Once the transition work is ready, React commits the resulting UI.

So the important internal concept is:

> **React can schedule transition rendering with lower priority and allow more urgent work to take precedence.**

---

## 6. Common Confusion

### ❌ `useTransition` makes code faster

No.

If rendering takes 500ms, `useTransition` doesn't magically make it 100ms.

It improves **responsiveness**, not the underlying computation.

---

### ❌ `useTransition` is like `setTimeout`

No.

This:

```tsx
startTransition(() => {
    setState(value);
});
```

doesn't mean:

```text
wait 500ms
then execute
```

React decides when to work on the transition based on its scheduling.

---

### ❌ `useTransition` makes API calls faster

No.

It is primarily about **React state updates and rendering priority**.

---

### ❌ Put every `setState` inside `startTransition`

No.

You should identify updates that can safely be **non-urgent**.

For example:

```text
Input value
    ↓
URGENT

Large search result rendering
    ↓
TRANSITION
```

---

### ❌ Transition means background thread

No.

JavaScript isn't suddenly moved to another thread because you use `useTransition`.

---

## 7. Interview Questions

### Q1. What problem does `useTransition` solve?

`useTransition` helps keep the UI responsive when a state update causes expensive rendering.

It allows us to mark an update as **non-urgent**, so React can prioritize more urgent user interactions.

It doesn't make the expensive work faster; it changes how React **schedules the rendering work**.

---

### Q2. What does `startTransition` actually do?

`startTransition` tells React that state updates executed inside its callback are **transition updates**.

```tsx
startTransition(() => {
    setTab("analytics");
});
```

React can then treat that rendering work as lower priority than urgent updates.

**Follow-up:** Does it delay the state update by a fixed amount?
→ No. There is no fixed timer.

---

### Q3. What is `isPending`?

`isPending` tells us that React has transition work that is still pending.

```tsx
const [isPending, startTransition] = useTransition();
```

We can use it for UI feedback:

```tsx
{isPending && <Spinner />}
```

**Follow-up:** Does `isPending` mean an API request is pending?
→ Not necessarily. It represents the **React transition**, not network request status.

---

### Q4. `useTransition` vs `useDeferredValue`?

The easiest distinction:

```text
useTransition
      ↓
"I control the UPDATE."

startTransition(() => {
    setState(...)
});
```

Whereas:

```text
useDeferredValue
      ↓
"I already have the VALUE."

const deferredValue = useDeferredValue(value);
```

So:

> **`useTransition` marks an update as non-urgent; `useDeferredValue` gives you a deferred version of a value.**

---

### Q5. `useTransition` vs debounce?

They solve different problems.

```text
Debounce
    ↓
Wait for a period of time
    ↓
Useful for reducing API calls


useTransition
    ↓
Manage React rendering priority
    ↓
Useful for keeping UI responsive
```

A debounce might say:

> "Wait 300ms after the user stops typing."

A transition says:

> **"This rendering work is less urgent than other UI work."**

---

## 8. Revision Notes

### `useTransition`

```tsx
const [isPending, startTransition] = useTransition();

startTransition(() => {
    setState(value);
});
```

**Purpose:**

> Keep the UI responsive by marking expensive state updates as **non-urgent**.

**Mental model:**

```text
Normal update
    ↓
React treats it normally

Transition update
    ↓
React knows it can be interrupted/deprioritized
```

**`isPending`:**

```text
true
 ↓
transition still pending
```

**Use when:**

* expensive tab changes
* expensive filtering
* large UI updates
* expensive rendering caused by an interaction

**Don't use it for:**

* making API calls faster
* making JavaScript faster
* replacing debounce
* every `setState`

### Most important distinction

```text
useTransition
→ UPDATE priority

useDeferredValue
→ VALUE priority
```

### One-line memory trick

> **`useTransition` = "This update matters, but it doesn't need to happen urgently."**

---

## 30-Second Interview Answer

> **`useTransition` is a React hook that allows us to mark state updates as non-urgent. It's useful when an update can trigger expensive rendering and we want to keep urgent interactions, such as typing or clicking, responsive. React can prioritize those urgent updates over the transition work, and `isPending` lets us show feedback while the transition is pending. It doesn't make the underlying computation faster or delay work by a fixed amount; it mainly gives React more flexibility in scheduling rendering work.**

# Infinite Scroll (Frontend Coding Interview)

## 1. Short explanation (What + Why)

**What:**
Infinite Scroll is a pagination technique where **more data is automatically loaded** as the user reaches the bottom of the page.

**Why:**

* Better user experience
* No "Next Page" button
* Common in social media, e-commerce, and news feeds

Examples:

* Instagram
* LinkedIn
* Facebook
* X (Twitter)

---

# 2. Simple internal working (Senior Interview Level)

### Flow

```text
User scrolls
      |
      ↓
Reached bottom?
      |
     Yes
      |
      ↓
Fetch next page
      |
      ↓
Append new data
      |
      ↓
Keep scrolling...
```

---

### API Flow

```text
Page 1 → 20 items

↓

User reaches bottom

↓

GET /products?page=2

↓

Append next 20 items

↓

User reaches bottom

↓

GET /products?page=3
```

---

# 3. Small practical example/code

### Using Intersection Observer (Recommended)

```tsx
const observer = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) {
    fetchNextPage();
  }
});

observer.observe(loadMoreRef.current);
```

Attach `loadMoreRef` to a small `<div>` at the bottom of the list.

When it becomes visible, load the next page.

---

### Using React Query

```tsx
const {
  data,
  fetchNextPage,
  hasNextPage
} = useInfiniteQuery({
  queryKey: ["products"],
  queryFn: fetchProducts,
  getNextPageParam: lastPage => lastPage.nextPage
});
```

Here's a **simple React example** that demonstrates how `IntersectionObserver` works for infinite scrolling.

## Step 1: Component

```tsx
import { useEffect, useRef, useState } from "react";

export default function App() {
  const [items, setItems] = useState([1, 2, 3, 4, 5]);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // Simulate API call
  const fetchMore = () => {
    console.log("Fetching next page...");

    setItems((prev) => {
      const last = prev[prev.length - 1];

      return [
        ...prev,
        last + 1,
        last + 2,
        last + 3,
        last + 4,
        last + 5,
      ];
    });
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];

      if (entry.isIntersecting) {
        fetchMore();
      }
    });

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div>
      {items.map((item) => (
        <div
          key={item}
          style={{
            height: "100px",
            border: "1px solid gray",
            marginBottom: "10px",
          }}
        >
          Product {item}
        </div>
      ))}

      <div
        ref={loaderRef}
        style={{
          textAlign: "center",
          padding: "20px",
        }}
      >
        Loading...
      </div>
    </div>
  );
}
```

---

# How it works

### Initial Render

```text
Product 1
Product 2
Product 3
Product 4
Product 5

Loading...  <-- loaderRef
```

React renders the component.

---

### `useEffect()` runs once

```tsx
const observer = new IntersectionObserver(callback);
```

Creates the browser observer.

---

### Observe the loader

```tsx
observer.observe(loaderRef.current);
```

Now the browser starts watching only this element:

```tsx
<div ref={loaderRef}>
    Loading...
</div>
```

---

### User scrolls

Initially:

```text
Viewport

Product 1
Product 2
Product 3

Loading... ❌ Not Visible
```

Nothing happens.

---

After scrolling:

```text
Viewport

Product 4
Product 5

Loading... ✅ Visible
```

Browser automatically executes:

```tsx
(entries) => {
   const entry = entries[0];

   if(entry.isIntersecting){
       fetchMore();
   }
}
```

`entry.isIntersecting` becomes:

```tsx
true
```

---

### `fetchMore()` executes

```tsx
setItems(prev => [...prev, 6,7,8,9,10]);
```

Now React re-renders.

UI becomes

```text
Product 1
Product 2
...
Product 10

Loading...
```

Notice that **Loading... moved down automatically** because more products were added above it.

---

### User reaches bottom again

Browser again sees:

```tsx
loaderRef
```

is visible.

Callback runs again.

```tsx
fetchMore();
```

Now:

```text
Product 1
...
Product 15

Loading...
```

This repeats until your API indicates there are no more pages.

---

# Visual Flow

```text
Render
   │
   ▼
Observe "Loading..." div
   │
   ▼
User Scrolls
   │
   ▼
Loading div visible?
   │
 ┌─┴─────────┐
 │           │
 No         Yes
 │           │
Wait     fetchMore()
              │
              ▼
Update State
              │
              ▼
React Re-render
              │
              ▼
Loading div moves down
```

## Senior Interview Tip ⭐

In production, you should avoid calling `fetchMore()` repeatedly while a request is already in progress:

```tsx
if (entry.isIntersecting && hasNextPage && !isLoading) {
  fetchMore();
}
```

This prevents duplicate API requests and is the pattern interviewers expect for a robust infinite scroll implementation.


---

# 4. One-line memory trick

**"Infinite Scroll = Detect bottom → Fetch next page → Append data."**

---

# 5. 3 Important Senior Interview Questions

### Q1. Why use `IntersectionObserver` instead of the scroll event?

**Answer:**

Because it's:

* More efficient
* Doesn't fire continuously like `scroll`
* Better for performance
* Browser-optimized

---

### Q2. How do you prevent multiple API calls?

**Answer:**

Maintain flags:

```ts
if (loading || !hasNextPage) return;
```

Only request the next page when:

* Not already loading
* More data exists

---

### Q3. What challenges exist with infinite scroll?

**Answer:**

* Duplicate requests
* Large DOM causing slow rendering
* Losing scroll position
* End-of-list detection

Solutions:

* Loading flag
* Virtualization (`react-window`, `react-virtualized`)
* Cursor-based pagination
* Preserve scroll state

---

# 6. Common mistakes

❌ Using the `scroll` event without throttling

❌ Triggering multiple API calls simultaneously

❌ Not stopping when no more pages exist

❌ Replacing old data instead of appending

❌ Rendering thousands of DOM elements (no virtualization)

---

# 7. 30-second interview response

> "Infinite scroll automatically loads more data as the user reaches the end of the current list. In modern React applications, I prefer using `IntersectionObserver` instead of scroll events because it's more efficient. The backend returns paginated or cursor-based data, and the frontend appends new items while preventing duplicate requests with loading flags. For large datasets, I combine infinite scroll with virtualization to keep rendering performant."

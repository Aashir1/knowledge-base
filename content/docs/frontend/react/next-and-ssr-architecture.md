---
title: "Next and SSR Architecture"
---

## 5. Next.js / SSR Architecture

This is an important senior topic because interviewers usually care less about memorizing **SSR/SSG/ISR definitions** and more about whether you can choose the right rendering strategy for a real application.

---

# 1. The Mental Model 🧠

Think about Next.js rendering as one question:

> **Where and when should the UI be generated?**

### Where?

**Server**
→ SSR / RSC / SSG / ISR

**Browser**
→ CSR

### When?

**Every request**
→ SSR

**Build time**
→ SSG

**Periodically / on demand**
→ ISR

**After JavaScript loads**
→ CSR

A simple model:

```text
                 Where is UI generated?
                         │
             ┌───────────┴───────────┐
             │                       │
           Server                 Browser
             │                       │
      ┌──────┼──────┐               CSR
      │      │      │
     SSR    SSG    ISR
```

---

# 2. SSR vs CSR vs SSG vs ISR

### SSR — Server-Side Rendering

HTML is generated **on every request**.

```text
Browser
   ↓
Request
   ↓
Next.js Server
   ↓
Fetch data
   ↓
Generate HTML
   ↓
Browser
```

Example:

```text
User dashboard
```

If the page depends on the current authenticated user, server-side rendering can make sense.

### SSG — Static Site Generation

HTML is generated ahead of time.

```text
Build
 ↓
Generate HTML
 ↓
CDN
 ↓
Users
```

Good for:

* Documentation
* Marketing pages
* Blog posts
* Mostly static content

Very fast because the server doesn't need to generate the page for every request.

---

### ISR — Incremental Static Regeneration

Think:

> **Static page + controlled freshness**

The page is statically generated but can be regenerated later.

For example:

```text
Product page
     ↓
Static HTML
     ↓
Served quickly
     ↓
Revalidate after 60 seconds
```

Useful when data changes but doesn't need to be real-time.

---

### CSR — Client-Side Rendering

The browser gets JavaScript and fetches the data.

```text
Browser
 ↓
Load JS
 ↓
React renders
 ↓
API request
 ↓
Data
 ↓
UI
```

Useful for highly interactive application screens.

---

# 3. The Important Senior Insight

Don't ask:

> "Should I always use SSR?"

Ask:

> **"What rendering strategy matches the data and user experience?"**

For example:

| Page                      | Possible strategy            |
| ------------------------- | ---------------------------- |
| Marketing homepage        | SSG                          |
| Blog                      | SSG / ISR                    |
| Product catalog           | ISR                          |
| User dashboard            | Dynamic/server rendering     |
| Admin table               | CSR / server + client hybrid |
| Highly interactive editor | CSR                          |
| Public product details    | ISR                          |
| Personalized account page | Dynamic rendering            |

There isn't one "best" strategy for the whole application.

---

# 4. SSR Deep Dive — Benefits, Costs, and Optimization

### What actually happens in an SSR request

```text
User requests /products/42
        ↓
Server runs the route's code
        ↓
Fetch data (DB / APIs)
        ↓
Render components → HTML (+ styles)
        ↓
Send complete HTML to browser
        ↓
Browser paints content immediately   ← visible, NOT yet interactive
        ↓
JS downloads → React hydrates        ← now interactive
```

Important nuance:

> **SSR makes content visible sooner. It doesn't make it interactive sooner.**

Interactivity still waits for JS download + hydration.

---

### Why SSR helps

| Benefit                       | Why                                                                                     |
| ----------------------------- | --------------------------------------------------------------------------------------- |
| Faster first contentful paint | Browser receives ready HTML instead of an empty `<div id="root">`                       |
| No "white screen"             | Users see content before JS finishes loading                                            |
| SEO                           | Crawlers get fully rendered HTML instead of having to execute JS                        |
| Social previews               | Open Graph/Twitter cards read meta tags from HTML — CSR pages often show blank previews |
| Slow networks / weak devices  | Less rendering work on the client before content shows up                               |
| Less exposed logic            | Data fetching, secrets, and business logic stay on the server                           |

---

### What SSR costs

```text
Every request = server CPU + data fetching
        ↓
Higher server load & infrastructure cost
        ↓
Scaling concerns under high traffic
        ↓
Slow data source → slow TTFB → slow page
```

Also:

* More complex build/deploy setup (you need a running server, not just a CDN)
* Hydration cost on the client is still there
* Can be slower than SSG if nothing is cached

> **SSR moves work from the browser to the server — it doesn't remove the work.**

---

### Typical SSR use cases

* Content-heavy public sites — news, blogs, e-commerce
* SEO-critical pages that depend on organic search
* Personalized pages that also need fast first paint
* Users on slow or unreliable networks

---

### Optimizing SSR

**1. Watch TTFB (Time to First Byte)**

With SSR, the server must fetch data before it can send HTML. Slow queries = slow page.

* Optimize database queries
* Fetch only what the page needs

**2. Parallelize data fetching**

❌ Sequential (waterfall):

```tsx
const user = await getUser();
const orders = await getOrders();
const recs = await getRecommendations();
```

✅ Parallel:

```tsx
const [user, orders, recs] = await Promise.all([
  getUser(),
  getOrders(),
  getRecommendations(),
]);
```

Total time ≈ the slowest call instead of the sum of all calls.

**3. Stream HTML**

Don't make the whole page wait for the slowest piece of data:

```text
Send shell (header, layout) immediately
        ↓
Stream fast sections
        ↓
Stream slow sections when ready (Suspense boundaries)
```

In Next.js App Router: `loading.tsx` and `<Suspense>` boundaries enable this.

**4. Cache at multiple levels**

```text
CDN cache         → cached HTML at the edge
HTTP cache        → Cache-Control headers
Server/data cache → cached fetch / DB results
```

**5. Reduce client JS**

* Code splitting / lazy loading (`next/dynamic`)
* Keep client boundaries small → less to hydrate
* Avoid long main-thread tasks during hydration

**6. Route smartly**

```text
Public, SEO-critical pages  → SSR / SSG / ISR
Authenticated app screens   → can be CSR / dynamic
```

**7. Measure it**

* Lighthouse, WebPageTest
* Track TTFB, FCP, LCP, INP
* Monitor server health (CPU, latency, error rate) — SSR makes the server part of your frontend performance

---

# 5. Hydration

This is a very common senior interview topic.

### What is hydration?

The server sends HTML:

```html
<button>Like</button>
```

The browser displays it immediately.

But HTML alone isn't interactive.

React then:

```text
Server HTML
     ↓
Browser displays HTML
     ↓
JavaScript loads
     ↓
React hydrates
     ↓
Event handlers become active
```

So:

> **Hydration = React attaching its client-side behavior to server-rendered HTML.**

---

### Example

```tsx
<button onClick={() => setCount(count + 1)}>
  {count}
</button>
```

The server may produce:

```html
<button>0</button>
```

After hydration, React makes the button interactive.

---

# 6. Hydration Mismatch

A hydration mismatch happens when:

> Server-rendered output ≠ client-rendered output

Bad example:

```tsx
export default function Component() {
  return <div>{Math.random()}</div>
}
```

Server:

```text
0.123
```

Client:

```text
0.781
```

React sees different output.

Another common example:

```tsx
<div>{new Date().toLocaleString()}</div>
```

Server and browser can produce different values.

### Common causes

* `Math.random()`
* `Date.now()`
* Browser-only APIs
* Different locale/timezone
* Conditional rendering based on `window`
* Non-deterministic data

### Senior fix

Make the initial render deterministic.

Don't blindly "fix" every mismatch with:

```tsx
suppressHydrationWarning
```

That can hide the underlying problem.

---

# 7. Server Components vs Client Components

This is probably one of the **most important modern Next.js interview topics**.

Think:

### Server Component

```text
Runs on server
        ↓
Can access server resources
        ↓
Doesn't ship component JS to browser
```

### Client Component

```text
Runs in browser
        ↓
Can use state/effects/browser APIs
        ↓
Ships JS to browser
```

---

## Server Component

By default, components in the Next.js App Router are Server Components.

```tsx
export default async function UsersPage() {
  const users = await getUsers();

  return <UserList users={users} />;
}
```

You can fetch data directly on the server.

---

## Client Component

Use:

```tsx
"use client";
```

when you need client-side capabilities:

```tsx
"use client";

import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      {count}
    </button>
  );
}
```

---

# 8. The Most Important Client Component Rule

Don't think:

> "My page needs one interactive button, therefore the whole page must be client-side."

Instead:

```text
Server Component
│
├── Header
├── ProductDetails
├── ProductDescription
│
└── Client Component
       └── AddToCartButton
```

This keeps the interactive boundary small.

### Mental model

> **Push the client boundary down.**

This can reduce the amount of JavaScript sent to the browser.

---

# 9. What Server Components Are Good At

Server Components are excellent for:

* Fetching server-side data
* Accessing backend resources
* Keeping secrets on the server
* Reducing client JavaScript
* Rendering mostly static UI
* Building server/client composition

For example:

```text
ProductPage (Server)
│
├── ProductInfo (Server)
├── Reviews (Server)
└── AddToCart (Client)
```

This is often better than making the entire page:

```text
"use client"

ProductPage
   ↓
Everything runs on browser
```

---

# 10. What Client Components Are Good At

Client Components are necessary when you need:

* `useState`
* `useEffect`
* Event handlers
* Browser APIs
* Interactive UI
* Client-side subscriptions
* Certain client-side libraries

Example:

```tsx
"use client";

export function SearchBox() {
  const [query, setQuery] = useState("");

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}
```

---

# 11. Server → Client Boundary

A common architecture:

```text
                 Server
                   │
        ┌──────────┴──────────┐
        │                     │
   Fetch data             Auth/check
        │
        ↓
   Server Component
        │
        │ props
        ↓
   Client Component
        │
        ↓
   Interaction
```

The props passed to Client Components need to be serializable in the relevant Server/Client boundary.

---

# 12. Server Actions

Server Actions allow client-triggered operations to execute on the server.

Conceptually:

```text
User clicks Save
       ↓
Client
       ↓
Server Action
       ↓
Validate
       ↓
Database
       ↓
Revalidate UI
```

Example:

```tsx
"use server";

export async function createUser(formData: FormData) {
  const name = formData.get("name");

  // validate
  // database operation
}
```

The important point:

> **Server Actions are not a replacement for understanding APIs, authorization, validation, or architecture.**

You still need:

```text
Authentication
Authorization
Validation
Error handling
Database transaction handling
```

---

# 13. Server Actions vs API Routes

A useful interview distinction:

### API Route

Good when you need:

```text
REST endpoint
External consumers
Mobile application
Third-party integration
Explicit HTTP API
```

### Server Action

Useful for:

```text
UI → server mutation
Form submission
Internal application mutations
Server-side operations tightly coupled to UI
```

Think:

```text
External system
      ↓
   API route
```

versus:

```text
Your Next.js UI
      ↓
 Server Action
```

This isn't an absolute rule, but it's a useful architectural distinction.

---

# 14. Next.js Caching — The Senior-Level Mental Model

Caching is one of the areas where people get confused.

Don't memorize:

> "Next.js caches everything."

Instead ask:

> **What exactly is being cached, and for how long?**

Potential layers include:

```text
Request
  ↓
Data/API fetch
  ↓
Server rendering
  ↓
Router/client cache
  ↓
Browser/CDN
```

Each layer can have different caching behavior.

The important senior question is:

> **When does stale data become visible, and how do I invalidate it?**

---

# 15. Revalidation

Suppose:

```text
Product page
```

doesn't need second-by-second freshness.

You can use a revalidation strategy.

Conceptually:

```text
Generate page
     ↓
Serve cached version
     ↓
After revalidation period
     ↓
Regenerate
```

For example:

```tsx
fetch(url, {
  next: {
    revalidate: 60,
  },
});
```

Meaning the data can be revalidated around a 60-second freshness window.

---

# 16. On-Demand Revalidation

Sometimes you don't want to wait.

Example:

```text
Admin updates product
        ↓
Database updated
        ↓
Invalidate product cache
        ↓
Users see fresh product
```

Next.js provides mechanisms such as:

```text
revalidatePath()
revalidateTag()
```

Mental model:

```text
TIME BASED
     ↓
revalidate after N seconds

EVENT BASED
     ↓
invalidate when data changes
```

---

# 17. Real Production Example

Imagine an appointment platform.

```text
                    Next.js
                       │
          ┌────────────┴────────────┐
          │                         │
     Public pages              Authenticated app
          │                         │
       ISR/SSG                 Dynamic rendering
          │                         │
          └────────────┬────────────┘
                       │
                 Server Components
                       │
              ┌────────┴────────┐
              │                 │
          Appointment       User details
             data
              │
              ↓
       Client Components
              │
       ┌──────┴───────┐
       │              │
     Calendar       Form
       │              │
       └──────┬───────┘
              ↓
         API / Actions
              ↓
           Backend
```

The important thing is that **not everything is forced into one rendering model**.

---

# 18. Common Senior Mistakes

### ❌ Making everything `"use client"`

This can unnecessarily increase client-side JavaScript and move work to the browser.

Better:

```text
Server by default
     ↓
Client only where interaction requires it
```

---

### ❌ Thinking SSR means "better performance"

SSR can improve initial HTML delivery, but it also introduces server work.

You need to consider:

```text
Server processing
Network latency
Data fetching
Caching
HTML size
Hydration
Client JS
```

---

### ❌ Thinking Server Components mean "no JavaScript"

The application can still have JavaScript.

The point is that **Server Components themselves don't need to ship their component code to the browser in the same way Client Components do.**

---

### ❌ Fetching everything on the client

Example:

```text
Page loads
 ↓
Blank screen
 ↓
JS loads
 ↓
API request
 ↓
Data
 ↓
UI
```

For some application screens this is perfectly reasonable.

But for SEO/public content, server rendering can provide a better initial experience.

---

### ❌ Making the whole page a Client Component because of one button

Instead:

```text
Server Page
 ├── Server Content
 ├── Server Content
 └── Client Button
```

---

### ❌ Ignoring caching

A senior engineer should always ask:

> "What happens when this data changes?"

---

# 19. Senior Interview Questions

### Q1. SSR vs CSR?

**Answer:**

> SSR generates HTML on the server before sending it to the browser, while CSR relies more heavily on the browser to render the UI after JavaScript loads. SSR can improve initial rendering and SEO, while CSR is often useful for highly interactive application experiences.

---

### Q2. What is hydration?

> Hydration is the process where React attaches client-side behavior and event handlers to server-rendered HTML so the existing markup becomes interactive.

---

### Q3. What causes hydration mismatches?

> When the server and client produce different initial output. Common causes include timestamps, random values, browser-only APIs, locale differences, and non-deterministic rendering.

---

### Q4. Why use Server Components?

> They allow server-side data access and rendering while reducing the amount of component JavaScript that needs to be sent to the browser. They also let us keep sensitive server-side operations away from the client.

---

### Q5. When do you use `"use client"`?

> When a component needs client-side capabilities such as state, effects, event handlers, browser APIs, or client-only libraries. I try to keep the client boundary as small as practical.

---

### Q6. Should every Next.js page be a Server Component?

> No. Server Components are the default, but interactive sections should use Client Components where needed. The goal is to choose the boundary based on where client-side behavior is actually required.

---

### Q7. SSR vs SSG vs ISR?

> SSR generates the page per request, SSG generates it ahead of time, and ISR allows a statically generated page to be revalidated and regenerated later. I choose based on how dynamic the data is and how fresh it needs to be.

---

### Q8. When would you use CSR?

> For highly interactive or client-driven experiences where SEO and server-rendered initial content aren't major requirements, such as internal dashboards, complex editors, or highly interactive tools.

---

### Q9. What would you consider when choosing a rendering strategy?

> Data freshness, SEO requirements, personalization, initial load performance, server cost, client JavaScript, caching behavior, and how interactive the page is.

---

### Q10. Why shouldn't you make the whole application `"use client"`?

> It pushes more rendering and logic toward the browser, increases the client JavaScript footprint, and prevents us from taking advantage of Server Components and server-side data access where they're useful.

---

### Q11. What are the downsides of SSR?

> Every request costs server CPU and data fetching, which raises infrastructure cost and creates scaling concerns. TTFB depends on how fast your data sources respond, deploys need a running server instead of just a CDN, and the client still pays the hydration cost. So I'd use SSR where request-time data or SEO actually needs it, and use caching, SSG/ISR, or streaming elsewhere.

---

### Q12. How would you make an SSR page faster?

> First check TTFB: optimize slow queries and run independent fetches in parallel with `Promise.all` to avoid waterfalls. Then stream the page with Suspense so the shell shows up immediately and slow sections arrive later. Add caching at the CDN, HTTP, and data layers, and reduce client JS with smaller client boundaries and code splitting so hydration is cheaper. Finally, measure with Lighthouse/WebPageTest and server monitoring.

---

# 20. Easy Memory Trick 🧠

Remember:

### **SSR = Every Request**

### **SSG = Build**

### **ISR = Rebuild Later**

### **CSR = Browser**

And:

### **Server Component = Server Work**

### **Client Component = Interaction**

And finally:

> **Server by default → Client when interactive.**

---

# 21. 30-Second Interview Answer

If an interviewer asks:

**"How do you decide how to render a Next.js application?"**

You can say:

> "I start with the data and user experience rather than choosing SSR or CSR by default. For public or mostly static content, I'd consider SSG or ISR. For personalized or request-dependent content, server rendering makes more sense, while highly interactive sections can use Client Components. With the App Router, I generally keep components on the server by default and push the client boundary down to the parts that actually need state or browser interaction. I also consider caching, data freshness, SEO, client JavaScript, and server cost before choosing the final strategy."

### Final mental model

```text
             NEXT.JS RENDERING

                 What do I need?
                       │
        ┌──────────────┼──────────────┐
        │              │              │
     Static       Personalized    Interactive
        │              │              │
      SSG/ISR          SSR            CSR
        │              │              │
        └──────────────┼──────────────┘
                       ↓
               Server Components
                       │
             Need browser behavior?
                       │
                      YES
                       ↓
                Client Component
```

**Senior takeaway:** Don't treat SSR, CSR, SSG, and ISR as competing technologies. They are **tools for different data and UX requirements**. The senior-level skill is choosing the boundary and caching strategy deliberately.

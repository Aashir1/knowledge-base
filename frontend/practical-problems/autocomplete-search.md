# Autocomplete Search (Frontend Coding Interview)

## 1. Short explanation (What + Why)

**What:**
Autocomplete search is a UI feature where suggestions are displayed dynamically as the user types.

Example:

```
User types: "rea"

Suggestions:
- React
- React Native
- React Query
```

**Why:**
It improves user experience by helping users find results faster and reduces unnecessary API calls.

Common examples:

* Google Search
* Location search
* Product search
* User search

---

## 2. Simple internal working (Senior Interview Level)

Basic flow:

```
User types
    |
    ↓
Input change event
    |
    ↓
Debounce (wait for user to stop typing)
    |
    ↓
API request
    |
    ↓
Receive suggestions
    |
    ↓
Update dropdown UI
```

Without debounce:

```
User types "react"

r  → API call
re → API call
rea → API call
reac → API call
react → API call
```

5 unnecessary requests.

With debounce:

```
r
re
rea
reac
react
 |
(wait 300ms)
 |
↓
1 API call
```

---

## 3. Small practical example/code

### React Component

```tsx
function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      const response = await fetch(
        `/api/search?q=${query}`
      );

      const data = await response.json();
      setResults(data);
    }, 300);

    return () => clearTimeout(timer);

  }, [query]);


  return (
    <>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {results.map(item => (
        <div key={item.id}>
          {item.name}
        </div>
      ))}
    </>
  );
}
```

```tsx

import React from 'react';


const App = () => {
  const [text, setText] = React.useState('');
  const [elements, setElements] = React.useState([]);

  const debounce = (fn, seconds) => {
    let timer = null;

    return (...args) => {
      if(timer) clearInterval(timer);
      timer = setTimeout(() => fn(...args), seconds)
    }
  }

  const fetchData = (text) => {
    console.log('Fetch Data: ', text)
    fetch(`https://dummyjson.com/products/search?q=${text}`)
      .then(response => response.json())
      .then(json => {
        console.log('response: ', json)
        setElements(json)})
  }

  const debouncedTextChange = React.useCallback(debounce(fetchData, 1000), [])

  React.useEffect(()=>{
    debouncedTextChange(text)
  }, [text])

  return (
    <div>
      <input placeholder="Search Products" onChange={(e)=> setText(e.target.value)}/>
      {
         elements?.products?.map((post) => {
          return <p key={post.id}>{post.title}</p>
        })
      }
    </div>
  )
}

export default App;

```

---

### Production-level improvements (Senior discussion)

#### 1. Debounce API calls

Instead of calling API immediately:

```text
User typing
      |
      ↓
Debounce 300ms
      |
      ↓
API call
```

---

#### 2. Cancel previous requests

Problem:

```
Request 1: react
Request 2: react native
```

Request 1 may return after request 2 and overwrite data.

Solution:

```javascript
AbortController
```

Example:

```js
const controller = new AbortController();

fetch(url, {
  signal: controller.signal
});

controller.abort();
```

---

#### 3. Cache previous searches

Example:

```
Search:
react

Cache:
{
 react: [...]
}
```

Next time:

```
react → return cache
```

No API call.

---

## 4. One-line memory trick

**"Autocomplete = Input + Debounce + API + Cache + Suggestions."**

---

## 5. 3 Important Senior Interview Questions

### Q1. Why do we use debounce in autocomplete?

**Answer:**

Debounce prevents unnecessary API calls by waiting until the user stops typing before triggering the search request.

Benefits:

* Less server load
* Better performance
* Better user experience

---

### Q2. How do you handle race conditions in autocomplete?

**Answer:**

Example:

```
Request A: "rea"
Request B: "react"
```

If A finishes later, it can overwrite newer results.

Solutions:

* Abort previous request using `AbortController`
* Track request IDs
* Ignore outdated responses

---

### Q3. How would you design autocomplete for millions of records?

**Answer:**

Frontend:

* Debounce input
* Cache results
* Virtualize large dropdown lists

Backend:

* Search index (ElasticSearch)
* Pagination
* Ranking algorithm
* Prefix search optimization

---

## 6. Common mistakes

❌ Calling API on every keystroke

❌ No debounce

❌ Not handling empty input

❌ Ignoring API race conditions

❌ Rendering thousands of suggestions without virtualization

❌ Not handling loading/error states

---

## 7. 30-second interview response

> "Autocomplete search is a real-time suggestion feature where user input triggers search results. In a production implementation, I would debounce the input to avoid unnecessary API calls, cancel outdated requests using AbortController, cache repeated searches, and handle loading/error states. For large datasets, I would move search optimization to the backend using indexes and return paginated results while keeping the frontend optimized with virtualization."

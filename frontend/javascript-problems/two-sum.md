```javascript

//two sum

const twoSum = <T extends number[]>(arr: T, sum) => {

    const map = new Map();

    for (const [index, item] of arr.entries()) {

        const diff = sum - item;
        const ele = map.get(diff);

        if (ele === undefined) {
            map.set(item, index);
        } else {
            return [item, ele.getValue()]
        }
    }
}


```

Here are concise notes you can keep for interview revision.

---

# Two Sum Notes

## Problem

Given:

- An array of numbers.
- A target sum.

Return the **two indices** whose values add up to the target.

Example:

```text
arr = [2, 7, 11, 15]
target = 9

Output:
[0, 1]

Because:
2 + 7 = 9
```

---

# Brute Force

Compare every number with every other number.

```text
2 + 7
2 + 11
2 + 15
7 + 11
7 + 15
11 + 15
```

Time Complexity:

```text
O(n²)
```

Not optimal.

---

# Optimized Approach (HashMap)

## Mental Model

For every number ask:

> **"What number do I need to reach the target?"**

That number is called the **complement**.

```text
complement = target - currentNumber
```

---

## Algorithm

1. Create a `Map`.
2. Iterate through the array.
3. Calculate the complement.
4. Check whether the complement already exists in the map.
5. If yes, you've found the pair.
6. Otherwise, store the current number and its index.
7. Continue.

---

## Why store previous numbers?

When you're at the current number, all previous numbers are already in the map.

Example:

```text
Array:
[2, 7, 11, 15]

Target = 9
```

Iteration 1

```text
Current = 2

Need = 7

Map = {}

7 not found

Store:
2 → 0
```

---

Iteration 2

```text
Current = 7

Need = 2

Map

2 → 0

Found!

Return:
[0, 1]
```

---

# Map Structure

Store:

```text
Number → Index
```

Example:

```text
2 → 0
7 → 1
11 → 2
15 → 3
```

NOT

```text
Index → Number
```

because we search using the number.

---

# Complement Formula

Never do

```text
current - target
```

Always think

> I already have the current number.

> What number do I need?

```text
needed = target - current
```

Example

```text
Target = 20
Current = 6

Need

20 - 6 = 14
```

Ask:

> Have I already seen **14**?

---

# Flow

```text
Current Number
       │
       ▼
Calculate complement
(target - current)
       │
       ▼
Is complement in Map?
       │
  ┌────┴────┐
 Yes         No
 │            │
 ▼            ▼
Return      Store current
indices     number & index
```

---

# Complexity

Time:

```text
O(n)
```

Each element is visited once.

Space:

```text
O(n)
```

The map may store every element.

---

# Common Mistakes

❌ Wrong complement

```ts
item - target;
```

✅ Correct

```ts
target - item;
```

---

❌ Store

```text
Index → Number
```

✅ Store

```text
Number → Index
```

---

❌ Return values when the question asks for indices.

Always check what the problem requires.

---

# Interview One-Liner

> "I use a hash map to store previously seen numbers and their indices. For each current number, I calculate its complement (`target - current`) and check whether that complement has already been seen. If it has, I've found the pair; otherwise, I store the current number and continue. This gives an **O(n)** time solution with **O(n)** extra space."

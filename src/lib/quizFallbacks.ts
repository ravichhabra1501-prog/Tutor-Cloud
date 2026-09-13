export interface QuizQuestion {
  id: string;
  type: "mcq" | "fill_blank" | "short_answer";
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  hint: string;
}

export interface QuizPayload {
  questions: QuizQuestion[];
  aiMotivation: string;
}

export function getOfflineQuizFallback(
  topic: string,
  difficulty: string,
  displayName: string = "Scholar"
): QuizPayload {
  const normTopic = topic.toLowerCase();
  const normDiff = difficulty.toLowerCase();

  let questions: QuizQuestion[] = [];
  let aiMotivation = `Welcome back, ${displayName}! Our primary AI servers are currently processing high demand, so we've activated our local assessment sandbox. Tackle these custom questions to test your skills!`;

  if (normTopic.includes("javascript") || normTopic.includes("typescript")) {
    if (normDiff.includes("begin")) {
      questions = [
        {
          id: "js_b1",
          type: "mcq",
          question: "Which keyword is used to declare a block-scoped variable that cannot be reassigned?",
          options: ["var", "let", "const", "def"],
          correctAnswer: "const",
          explanation: "'const' creates a block-scoped read-only reference. It cannot be reassigned after declaration, unlike 'let' and 'var'.",
          hint: "Think of constants."
        },
        {
          id: "js_b2",
          type: "mcq",
          question: "What is the output of: console.log(typeof null); in JavaScript?",
          options: ["'null'", "'undefined'", "'object'", "'string'"],
          correctAnswer: "'object'",
          explanation: "This is a well-known legacy bug in JavaScript. 'typeof null' returns 'object' because null was represented as a null pointer in early JS versions.",
          hint: "It represents an empty object reference legacy-wise."
        },
        {
          id: "js_b3",
          type: "mcq",
          question: "Which of the following array methods creates a new array with all elements that pass a test?",
          options: ["map()", "filter()", "forEach()", "reduce()"],
          correctAnswer: "filter()",
          explanation: "'filter()' calls a provided callback function once for each element in an array, and constructs a new array of all the values for which the callback returns true.",
          hint: "You are filtering elements."
        },
        {
          id: "js_b4",
          type: "fill_blank",
          options: [],
          question: "What operator is used for strict equality comparison (checking both value and type) in JavaScript?",
          correctAnswer: "===",
          explanation: "The triple equals (===) operator performs a strict comparison, meaning it checks both the values and types of the operands without coercion.",
          hint: "Use three equal signs."
        },
        {
          id: "js_b5",
          type: "short_answer",
          options: [],
          question: "What is the difference between 'let' and 'var' regarding scoping?",
          correctAnswer: "let is block-scoped, while var is function-scoped.",
          explanation: "Variables declared with 'let' are confined to the immediate block '{}' they are defined in. Variables declared with 'var' are scoped to the nearest enclosing function.",
          hint: "Think about block level vs function level scope."
        }
      ];
    } else if (normDiff.includes("adv")) {
      questions = [
        {
          id: "js_a1",
          type: "mcq",
          question: "In TypeScript, what does the 'keyof' index type query operator do?",
          options: [
            "It yields a union of known public property names of a type.",
            "It checks if a key exists in an object at runtime.",
            "It registers a new key in the local namespace.",
            "It retrieves the value of a specified property."
          ],
          correctAnswer: "It yields a union of known public property names of a type.",
          explanation: "The 'keyof' operator takes an object type and produces a string or numeric literal union of its keys.",
          hint: "Produces keys as a union of literals."
        },
        {
          id: "js_a2",
          type: "mcq",
          question: "What is the primary difference between a TypeScript interface and a type alias?",
          options: [
            "Interfaces can be open for extension (declaration merging); type aliases cannot.",
            "Type aliases can inherit from other type aliases; interfaces cannot.",
            "Interfaces can represent union types; type aliases cannot.",
            "Type aliases are compiled to JavaScript objects; interfaces are erased entirely."
          ],
          correctAnswer: "Interfaces can be open for extension (declaration merging); type aliases cannot.",
          explanation: "Interfaces support declaration merging, meaning if you define two interfaces with the same name, they merge. Type aliases cannot be changed once declared.",
          hint: "Think of declaration merging."
        },
        {
          id: "js_a3",
          type: "mcq",
          question: "Which TypeScript utility type constructs a type by picking all properties from a Type and then removing a set of keys?",
          options: ["Pick<T, K>", "Exclude<T, U>", "Omit<T, K>", "Partial<T>"],
          correctAnswer: "Omit<T, K>",
          explanation: "Omit<T, K> constructs a type by picking all properties from T and then removing keys K.",
          hint: "The opposite of Pick."
        },
        {
          id: "js_a4",
          type: "fill_blank",
          options: [],
          question: "What TypeScript keyword is used to assert that a value is not null or undefined, also called the non-null assertion operator?",
          correctAnswer: "!",
          explanation: "The exclamation mark (!) is the non-null assertion operator in TypeScript, telling the compiler that an expression is guaranteed not to be null or undefined.",
          hint: "A single punctuation mark often used for emphasis."
        },
        {
          id: "js_a5",
          type: "short_answer",
          options: [],
          question: "Explain what a Closure is in JavaScript.",
          correctAnswer: "A closure is a function that retains access to its outer lexical scope even after the outer function has returned.",
          explanation: "In JavaScript, functions form closures around the scope they were created in, allowing them to access variables from that parent scope at any later time.",
          hint: "Inner functions remembering outer variables."
        }
      ];
    } else {
      // Intermediate JS/TS
      questions = [
        {
          id: "js_i1",
          type: "mcq",
          question: "Which of the following is true about JavaScript Promises?",
          options: [
            "They can be resolved multiple times.",
            "They have three states: pending, fulfilled, or rejected.",
            "They execute synchronously by default.",
            "They are used to bypass the call stack entirely."
          ],
          correctAnswer: "They have three states: pending, fulfilled, or rejected.",
          explanation: "A Promise is in one of three states: pending (initial state), fulfilled (completed successfully), or rejected (failed). Once settled, its state cannot change.",
          hint: "Think of the three possible phases of a promise."
        },
        {
          id: "js_i2",
          type: "mcq",
          question: "What is the purpose of TypeScript's 'unknown' type compared to 'any'?",
          options: [
            "unknown is type-safe because it requires a type check or assertion before performing operations on it.",
            "unknown can only hold null or undefined values.",
            "unknown compiles to a special helper function in JavaScript.",
            "There is no difference; they are completely interchangeable aliases."
          ],
          correctAnswer: "unknown is type-safe because it requires a type check or assertion before performing operations on it.",
          explanation: "'unknown' is the type-safe counterpart of 'any'. Anything is assignable to 'unknown', but 'unknown' is not assignable to anything else without a type assertion or control-flow type narrowing.",
          hint: "Safety first!"
        },
        {
          id: "js_i3",
          type: "mcq",
          question: "What does the 'asconst' assertion do in TypeScript?",
          options: [
            "It compiles the code to C-style constants.",
            "It prevents variables from being reassigned at runtime using Object.freeze.",
            "It signals the compiler to treat all properties as read-only and literal types.",
            "It declares a class as non-instantiable."
          ],
          correctAnswer: "It signals the compiler to treat all properties as read-only and literal types.",
          explanation: "Adding 'as const' to an expression converts array literals to read-only tuples, and object literals to read-only properties with literal types.",
          hint: "Compiler literal narrowing."
        },
        {
          id: "js_i4",
          type: "fill_blank",
          options: [],
          question: "What ES6 feature allows you to extract properties from an object or items from an array into distinct variables using a short syntax?",
          correctAnswer: "destructuring",
          explanation: "Destructuring binding syntax is a JavaScript expression that makes it possible to unpack values from arrays, or properties from objects, into distinct variables.",
          hint: "De-constructing."
        },
        {
          id: "js_i5",
          type: "short_answer",
          options: [],
          question: "What is the event loop in JavaScript?",
          correctAnswer: "The event loop is a mechanism that coordinates the execution of code, events, and sub-tasks, processing microtasks and macrotasks from queues.",
          explanation: "JavaScript is single-threaded. The event loop continuously polls the callback queue and pushes completed asynchronous callbacks onto the call stack when it is empty.",
          hint: "Think of single-threaded concurrency coordination."
        }
      ];
    }
  } else if (normTopic.includes("python")) {
    if (normDiff.includes("begin")) {
      questions = [
        {
          id: "py_b1",
          type: "mcq",
          question: "Which of the following is used to define a function in Python?",
          options: ["function", "def", "func", "define"],
          correctAnswer: "def",
          explanation: "In Python, the 'def' keyword is used to begin a function definition block.",
          hint: "Short for define."
        },
        {
          id: "py_b2",
          type: "mcq",
          question: "What is the main characteristic of a Python tuple?",
          options: [
            "Tuples are mutable and can be changed.",
            "Tuples are immutable and cannot be changed after creation.",
            "Tuples only store string values.",
            "Tuples automatically sort their elements."
          ],
          correctAnswer: "Tuples are immutable and cannot be changed after creation.",
          explanation: "Tuples are ordered collections of items that are immutable, meaning once created, elements cannot be added, removed, or changed.",
          hint: "Think about constant arrays."
        },
        {
          id: "py_b3",
          type: "mcq",
          question: "What is the index of the first element in a Python list?",
          options: ["1", "0", "-1", "first"],
          correctAnswer: "0",
          explanation: "Python lists are zero-indexed, meaning the first element is accessed at index 0.",
          hint: "Computers start counting at zero."
        },
        {
          id: "py_b4",
          type: "fill_blank",
          options: [],
          question: "What built-in function is used to find the number of items in a list or characters in a string?",
          correctAnswer: "len",
          explanation: "The 'len()' function returns the length (the number of items) of an object.",
          hint: "Short for length."
        },
        {
          id: "py_b5",
          type: "short_answer",
          options: [],
          question: "What is the difference between a list and a set in Python?",
          correctAnswer: "A list is ordered and allows duplicate elements, while a set is unordered and contains only unique elements.",
          explanation: "Lists maintain insertion order and permit duplicate values. Sets do not maintain guaranteed order and automatically filter out duplicates.",
          hint: "Duplicates vs unique elements."
        }
      ];
    } else if (normDiff.includes("adv")) {
      questions = [
        {
          id: "py_a1",
          type: "mcq",
          question: "What is a metaclass in Python?",
          options: [
            "A class whose instances are themselves classes.",
            "A special library for parsing meta-data.",
            "An abstract base class that cannot be inherited.",
            "A class that can only contain static methods."
          ],
          correctAnswer: "A class whose instances are themselves classes.",
          explanation: "In Python, classes are objects too. A metaclass is the class of a class. It defines how a class behaves and is constructed.",
          hint: "The blueprint of a blueprint."
        },
        {
          id: "py_a2",
          type: "mcq",
          question: "In Python, how does the Global Interpreter Lock (GIL) affect multi-threaded programs?",
          options: [
            "It allows true CPU-bound parallelism across multiple cores.",
            "It limits execution of Python bytecode to only one thread at a time, making multi-threading ineffective for CPU-bound tasks.",
            "It guarantees that files are locked automatically when opened.",
            "It speeds up execution of all recursive functions."
          ],
          correctAnswer: "It limits execution of Python bytecode to only one thread at a time, making multi-threading ineffective for CPU-bound tasks.",
          explanation: "The GIL is a mutex that protects access to Python objects, preventing multiple threads from executing Python bytecodes at once. This impacts CPU-bound multi-threaded programs.",
          hint: "One thread at a time rule."
        },
        {
          id: "py_a3",
          type: "mcq",
          question: "Which of the following is true regarding Python's 'coroutine' objects?",
          options: [
            "They are executed automatically upon instantiation.",
            "They must be defined with 'async def' and awaited or scheduled on an event loop to run.",
            "They run in a separate operating system process.",
            "They are obsolete and replaced by standard generator loops."
          ],
          correctAnswer: "They must be defined with 'async def' and awaited or scheduled on an event loop to run.",
          explanation: "In Python, functions defined with 'async def' are coroutines. Calling them returns a coroutine object, which must be awaited or executed inside an event loop like asyncio.",
          hint: "Think of asyncio workflow."
        },
        {
          id: "py_a4",
          type: "fill_blank",
          options: [],
          question: "What is the name of the special method used to initialize an object's attributes when a class is instantiated in Python?",
          correctAnswer: "__init__",
          explanation: "The '__init__' method is the constructor in Python, called automatically when a new instance of a class is created.",
          hint: "Double underscores, then init, then double underscores."
        },
        {
          id: "py_a5",
          type: "short_answer",
          options: [],
          question: "What are Generator functions in Python and what keyword do they use?",
          correctAnswer: "Generators are functions that return an iterator using the 'yield' keyword to produce values lazily.",
          explanation: "Instead of returning all values at once, generator functions yield values one by one, saving memory and processing time.",
          hint: "Produces items on the fly using a specific keyword starting with y."
        }
      ];
    } else {
      // Intermediate Python
      questions = [
        {
          id: "py_i1",
          type: "mcq",
          question: "What is a list comprehension in Python?",
          options: [
            "A tool for debugging list objects.",
            "A concise way to create lists using a single line loop.",
            "An optimized memory compression algorithm for list elements.",
            "A method to automatically sort nested list structures."
          ],
          correctAnswer: "A concise way to create lists using a single line loop.",
          explanation: "List comprehensions provide a concise syntax to create lists based on existing iterables, e.g., [x*2 for x in items].",
          hint: "Elegant single-line loop syntax."
        },
        {
          id: "py_i2",
          type: "mcq",
          question: "What does the 'with' statement represent in Python?",
          options: [
            "It is used for pattern matching inside loops.",
            "It sets up a context manager, ensuring setup and cleanup code (like closing files) is executed.",
            "It defines a global class reference scope.",
            "It permits writing conditional statements without indentation."
          ],
          correctAnswer: "It sets up a context manager, ensuring setup and cleanup code (like closing files) is executed.",
          explanation: "The 'with' statement simplifies exception handling by encapsulating common preparation and cleanup tasks in a context manager.",
          hint: "Automatic resource management."
        },
        {
          id: "py_i3",
          type: "mcq",
          question: "What is the difference between deepcopy and shallow copy in Python's copy module?",
          options: [
            "Shallow copy constructs a new object and recursively inserts copies of found objects; deepcopy does not.",
            "Shallow copy copies only reference pointers to nested objects; deepcopy recursively copies all nested objects.",
            "Deepcopy runs twice as fast as shallow copy.",
            "Deepcopy works only on list variables; shallow copy works on dictionaries."
          ],
          correctAnswer: "Shallow copy copies only reference pointers to nested objects; deepcopy recursively copies all nested objects.",
          explanation: "A shallow copy constructs a new collection object and then populates it with references to the child objects. A deep copy recursively copies everything, meaning changes inside nested elements won't affect the original.",
          hint: "Nested object replication depth."
        },
        {
          id: "py_i4",
          type: "fill_blank",
          options: [],
          question: "What keyword is used to import a module under a shorter, custom namespace alias in Python?",
          correctAnswer: "as",
          explanation: "The 'as' keyword is used to define an alias when importing modules (e.g., import pandas as pd).",
          hint: "Two letters, starting with a."
        },
        {
          id: "py_i5",
          type: "short_answer",
          options: [],
          question: "What is the purpose of *args and **kwargs in Python function parameters?",
          correctAnswer: "*args allows passing a variable number of positional arguments, while **kwargs allows passing keyword arguments.",
          explanation: "*args collects excess positional arguments as a tuple, whereas **kwargs collects excess keyword arguments as a dictionary.",
          hint: "Think about unpacking variable-length positional and keyword inputs."
        }
      ];
    }
  } else if (normTopic.includes("data structures") || normTopic.includes("algorithm")) {
    if (normDiff.includes("begin")) {
      questions = [
        {
          id: "ds_b1",
          type: "mcq",
          question: "Which data structure follows the Last-In, First-Out (LIFO) principle?",
          options: ["Queue", "Stack", "Binary Tree", "Linked List"],
          correctAnswer: "Stack",
          explanation: "A Stack is a linear data structure where elements can only be added (pushed) or removed (popped) from the top, following LIFO.",
          hint: "Like a stack of dinner plates."
        },
        {
          id: "ds_b2",
          type: "mcq",
          question: "What is the time complexity of looking up a value in an array by its index?",
          options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
          correctAnswer: "O(1)",
          explanation: "Array elements are stored contiguously in memory. Finding an element by index takes constant time O(1) using offset arithmetic.",
          hint: "Instant access."
        },
        {
          id: "ds_b3",
          type: "mcq",
          question: "Which of the following is a key characteristic of a Queue data structure?",
          options: [
            "It follows First-In, First-Out (FIFO) ordering.",
            "Elements are sorted automatically on insertion.",
            "It allows binary search recursively.",
            "It is restricted to integer elements."
          ],
          correctAnswer: "It follows First-In, First-Out (FIFO) ordering.",
          explanation: "Queues model waiting lines where the first element inserted is the first one to be removed (FIFO).",
          hint: "Like standing in line at a movie theater."
        },
        {
          id: "ds_b4",
          type: "fill_blank",
          options: [],
          question: "What search algorithm divides the search interval in half recursively, requiring a sorted array to work?",
          correctAnswer: "binary search",
          explanation: "Binary search compares the target value to the middle element of a sorted array and halves the search space repeatedly, operating in O(log n) time.",
          hint: "Divide and conquer search in two parts."
        },
        {
          id: "ds_b5",
          type: "short_answer",
          options: [],
          question: "What is the difference between a singly linked list and a doubly linked list?",
          correctAnswer: "Singly linked list nodes point only to the next node, while doubly linked list nodes point to both the next and previous nodes.",
          explanation: "Each node in a singly linked list has a single pointer. Doubly linked list nodes have two pointers, enabling bidirectional traversal.",
          hint: "Node pointer direction references."
        }
      ];
    } else if (normDiff.includes("adv")) {
      questions = [
        {
          id: "ds_a1",
          type: "mcq",
          question: "What is the time complexity of the Floyd-Warshall algorithm for finding all-pairs shortest paths in a graph?",
          options: ["O(V^2)", "O(E log V)", "O(V^3)", "O(V * E)"],
          correctAnswer: "O(V^3)",
          explanation: "Floyd-Warshall uses three nested loops over the vertices V to solve all-pairs shortest paths, resulting in O(V^3) time complexity.",
          hint: "Three nested loops over vertex set."
        },
        {
          id: "ds_a2",
          type: "mcq",
          question: "What data structure is typically used to implement a Priority Queue efficiently?",
          options: ["Binary Heap", "Balanced BST", "Singly Linked List", "Hash Table with Chaining"],
          correctAnswer: "Binary Heap",
          explanation: "A Binary Heap guarantees O(log n) insertion and O(log n) deletion of the priority element, making it ideal and compact for priority queues.",
          hint: "Min or max node-tree representation."
        },
        {
          id: "ds_a3",
          type: "mcq",
          question: "What is the worst-case time complexity of inserting a key into a Red-Black Tree?",
          options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
          correctAnswer: "O(log n)",
          explanation: "A Red-Black tree is a self-balancing binary search tree. Operations like search, insertion, and deletion are guaranteed to take O(log n) worst-case time.",
          hint: "Guaranteed balanced height lookup."
        },
        {
          id: "ds_a4",
          type: "fill_blank",
          options: [],
          question: "What algorithm design technique solves subproblems recursively and stores their results in a table (memoization/tabulation) to avoid redundant computation?",
          correctAnswer: "dynamic programming",
          explanation: "Dynamic Programming (DP) is a method for solving complex problems by breaking them down into simpler subproblems, storing overlapping solutions to avoid duplicate effort.",
          hint: "DP."
        },
        {
          id: "ds_a5",
          type: "short_answer",
          options: [],
          question: "Explain the difference between Dijkstra's and A* Search algorithms.",
          correctAnswer: "Dijkstra's explores paths based purely on actual cost from the source, while A* uses both actual cost and a heuristic to estimate the remaining distance.",
          explanation: "A* uses the formula f(n) = g(n) + h(n), where h(n) is the heuristic function. This guides A* to find the target much faster by focusing the search direction.",
          hint: "Heuristic guidance vs uniform cost."
        }
      ];
    } else {
      // Intermediate DSA
      questions = [
        {
          id: "ds_i1",
          type: "mcq",
          question: "What is the average-case time complexity of Quick Sort?",
          options: ["O(n)", "O(n log n)", "O(n^2)", "O(log n)"],
          correctAnswer: "O(n log n)",
          explanation: "On average, Quick Sort partitions the list into roughly equal halves at each step, yielding a tree of depth log n, with O(n) work per level.",
          hint: "Logarithmic factor multiplied by linear count."
        },
        {
          id: "ds_i2",
          type: "mcq",
          question: "Which graph traversal algorithm uses a Queue and visits nodes level-by-level (shallowest nodes first)?",
          options: ["Depth-First Search (DFS)", "Breadth-First Search (BFS)", "Kruskal's Algorithm", "Dijkstra's Algorithm"],
          correctAnswer: "Breadth-First Search (BFS)",
          explanation: "Breadth-First Search (BFS) explores vertices layer by layer from a starting node, using a queue queue to manage next nodes.",
          hint: "Think 'breadth' first."
        },
        {
          id: "ds_i3",
          type: "mcq",
          question: "What is a hash collision in a Hash Table?",
          options: [
            "When the hash function fails to run.",
            "When two different keys map to the same index.",
            "When a lookup exceeds the array bounds.",
            "When memory limits require resizing."
          ],
          correctAnswer: "When two different keys map to the same index.",
          explanation: "Because the hash space is smaller than the possible key space, two different keys can occasionally produce the same hash index. This is called a hash collision.",
          hint: "Two keys crashing into one slot."
        },
        {
          id: "ds_i4",
          type: "fill_blank",
          options: [],
          question: "What sorting algorithm splits an array in half, recursively sorts the halves, and then merges them back together?",
          correctAnswer: "merge sort",
          explanation: "Merge sort is a classic divide-and-conquer algorithm with a guaranteed O(n log n) runtime.",
          hint: "It combines (merges) sorted lists."
        },
        {
          id: "ds_i5",
          type: "short_answer",
          options: [],
          question: "What is the difference between a Tree and a Graph?",
          correctAnswer: "A tree is an acyclic connected graph, whereas a graph can contain cycles and disconnected components.",
          explanation: "Trees are specialized graphs with exactly one path between any two vertices, and no loops/cycles.",
          hint: "Think about loops and connectivity restrictions."
        }
      ];
    }
  } else if (normTopic.includes("styling") || normTopic.includes("html") || normTopic.includes("css")) {
    if (normDiff.includes("begin")) {
      questions = [
        {
          id: "st_b1",
          type: "mcq",
          question: "In HTML, which tag is used to create a hyperlink?",
          options: ["<link>", "<a>", "<href>", "<url>"],
          correctAnswer: "<a>",
          explanation: "The anchor tag <a> is used to define hyperlinks linking one page to another.",
          hint: "Anchor."
        },
        {
          id: "st_b2",
          type: "mcq",
          question: "What does CSS stand for?",
          options: [
            "Computer Style Sheets",
            "Cascading Style Sheets",
            "Creative Styling System",
            "Complex Syntax Styling"
          ],
          correctAnswer: "Cascading Style Sheets",
          explanation: "CSS stands for Cascading Style Sheets, describing how HTML elements are to be displayed on screen.",
          hint: "Waterfall-like styling rules."
        },
        {
          id: "st_b3",
          type: "mcq",
          question: "Which Tailwind utility class is used to add margin on all sides of an element?",
          options: ["p-4", "m-4", "mx-4", "gap-4"],
          correctAnswer: "m-4",
          explanation: "In Tailwind, classes starting with 'm-' configure margin, while 'p-' configure padding.",
          hint: "M for margin."
        },
        {
          id: "st_b4",
          type: "fill_blank",
          options: [],
          question: "Which HTML attribute specifies an alternate text for an image if the image cannot be displayed?",
          correctAnswer: "alt",
          explanation: "The 'alt' attribute provides alternative text for screen readers and as fallback text if an image fails to load.",
          hint: "Short for alternative."
        },
        {
          id: "st_b5",
          type: "short_answer",
          options: [],
          question: "What is the CSS Box Model?",
          correctAnswer: "The CSS Box Model is a container that consists of multiple layers: content, padding, border, and margin.",
          explanation: "Every element on a webpage is rendered as a rectangular box. The box model coordinates how these nested layer dimensions are calculated.",
          hint: "Content, padding, border, margin stack."
        }
      ];
    } else if (normDiff.includes("adv")) {
      questions = [
        {
          id: "st_a1",
          type: "mcq",
          question: "Which of the following describes Tailwind CSS v4's architecture?",
          options: [
            "It relies entirely on complex JavaScript compilation engines.",
            "It uses a modern compiler engine and is configured directly in CSS using the @import directives.",
            "It drops support for utility classes, switching to utility inline components.",
            "It requires an external relational database to store theme configurations."
          ],
          correctAnswer: "It uses a modern compiler engine and is configured directly in CSS using the @import directives.",
          explanation: "Tailwind CSS v4 introduces a streamlined CSS-first configuration engine, allowing customization inside CSS files using @theme and removing the necessity of tailwind.config.js.",
          hint: "Think CSS-first configuration."
        },
        {
          id: "st_a2",
          type: "mcq",
          question: "In CSS Grid, what does the 'minmax(0, 1fr)' calculation inside 'grid-template-columns' resolve?",
          options: [
            "It prevents grid items from shrinking below their content's intrinsic minimum size, resolving flex layout overflow issues.",
            "It restricts the grid layout to only 1 column.",
            "It calculates the mathematical average of screen height.",
            "It causes grid items to have zero width permanently."
          ],
          correctAnswer: "It prevents grid items from shrinking below their content's intrinsic minimum size, resolving flex layout overflow issues.",
          explanation: "By default, grid tracks can't shrink smaller than their content's minimum size. 'minmax(0, 1fr)' allows grid items to shrink all the way to 0, which prevents large content from overflowing the parent container.",
          hint: "Solves item minimum width shrink limits."
        },
        {
          id: "st_a3",
          type: "mcq",
          question: "Which CSS property regulates whether an element's custom scroll container should perform hardware-accelerated scrolling with momentum on touch screens?",
          options: ["scroll-behavior", "-webkit-overflow-scrolling", "will-change", "transform-style"],
          correctAnswer: "-webkit-overflow-scrolling",
          explanation: "'-webkit-overflow-scrolling: touch' enables momentum-based elastic scrolling on iOS Safari touch screens.",
          hint: "Vendor-prefixed overflow scrolling helper."
        },
        {
          id: "st_a4",
          type: "fill_blank",
          options: [],
          question: "What Tailwind responsive prefix is used to target screens starting from 1024px and wider?",
          correctAnswer: "lg",
          explanation: "In Tailwind, the 'lg:' breakpoint targets screens that are 1024px wide or larger.",
          hint: "Short for large."
        },
        {
          id: "st_a5",
          type: "short_answer",
          options: [],
          question: "Explain the difference between absolute, relative, and fixed positioning in CSS.",
          correctAnswer: "relative positions an element offset from its normal flow, absolute positions it relative to its closest positioned ancestor, and fixed positions it relative to the viewport.",
          explanation: "Relative remains in normal flow. Absolute departs from normal flow and matches relative ancestors. Fixed is stationary relative to the browser window.",
          hint: "Normal flow vs ancestral offsets vs browser frame alignment."
        }
      ];
    } else {
      // Intermediate CSS
      questions = [
        {
          id: "st_i1",
          type: "mcq",
          question: "How do you center an item both vertically and horizontally using Flexbox?",
          options: [
            "flex justify-center items-center",
            "flex text-center align-middle",
            "flex content-between self-center",
            "flex items-stretch float-none"
          ],
          correctAnswer: "flex justify-center items-center",
          explanation: "'justify-center' aligns items along the main axis, and 'items-center' aligns items along the cross axis in Flexbox.",
          hint: "Combine primary and secondary axis centering."
        },
        {
          id: "st_i2",
          type: "mcq",
          question: "What is the difference between 'opacity-0' and 'hidden' in Tailwind?",
          options: [
            "opacity-0 hides the element but it still occupies space and is interactive; hidden removes it from the layout flow.",
            "hidden makes the text blurry; opacity-0 makes it invisible.",
            "They behave identically.",
            "hidden triggers GPU acceleration; opacity-0 does not."
          ],
          correctAnswer: "opacity-0 hides the element but it still occupies space and is interactive; hidden removes it from the layout flow.",
          explanation: "'opacity: 0' makes the element fully transparent but keeps it in document flow. 'display: none' (hidden) completely excludes the element from the page layout.",
          hint: "Think about physical layout footprint."
        },
        {
          id: "st_i3",
          type: "mcq",
          question: "What does the 'z-index' property regulate in CSS?",
          options: [
            "The zoom level of an image.",
            "The vertical position (elevation) or stacking order of overlapping positioned elements.",
            "The horizontal offset of container grids.",
            "The size of the border padding."
          ],
          correctAnswer: "The vertical position (elevation) or stacking order of overlapping positioned elements.",
          explanation: "z-index specifies the stack order of elements along the Z-axis (pointing outwards towards the viewer). It only works on positioned elements.",
          hint: "The third dimension of depth."
        },
        {
          id: "st_i4",
          type: "fill_blank",
          options: [],
          question: "What Tailwind class is used to set the display mode of an element to CSS Grid?",
          correctAnswer: "grid",
          explanation: "The utility 'grid' sets display: grid on an element, enabling CSS grid layout behavior.",
          hint: "Four letters, sounds like matrix grid."
        },
        {
          id: "st_i5",
          type: "short_answer",
          options: [],
          question: "What is the purpose of media queries in responsive styling?",
          correctAnswer: "Media queries allow you to apply CSS styling rules selectively based on device characteristics like viewport width.",
          explanation: "This enables responsive design, showing different styles for mobile phones, tablets, and wide monitors.",
          hint: "Styling adaptation based on screen width dimensions."
        }
      ];
    }
  } else {
    // Relational Databases & SQL
    if (normDiff.includes("begin")) {
      questions = [
        {
          id: "db_b1",
          type: "mcq",
          question: "Which SQL clause is used to filter query results to match a specific condition?",
          options: ["GROUP BY", "WHERE", "ORDER BY", "SELECT"],
          correctAnswer: "WHERE",
          explanation: "The WHERE clause is used to filter records, returning only those that fulfill the specified condition.",
          hint: "Filter condition selector."
        },
        {
          id: "db_b2",
          type: "mcq",
          question: "What does SQL stand for?",
          options: [
            "Simple Query Language",
            "Structured Query Language",
            "System Queue Language",
            "Statistical Quantitative Logic"
          ],
          correctAnswer: "Structured Query Language",
          explanation: "SQL stands for Structured Query Language, the standard programming language for relational databases.",
          hint: "Structure and queries."
        },
        {
          id: "db_b3",
          type: "mcq",
          question: "Which SQL command is used to add new rows of data to a table?",
          options: ["UPDATE", "ADD ROW", "INSERT INTO", "CREATE LINE"],
          correctAnswer: "INSERT INTO",
          explanation: "The INSERT INTO statement is used to insert new records into a table.",
          hint: "Put in."
        },
        {
          id: "db_b4",
          type: "fill_blank",
          options: [],
          question: "What constraint is placed on a table column to uniquely identify each row, ensuring no duplicates and no null values?",
          correctAnswer: "PRIMARY KEY",
          explanation: "A PRIMARY KEY constraint uniquely identifies each record in a table. Primary keys must contain unique values and cannot contain NULL values.",
          hint: "Main identification key."
        },
        {
          id: "db_b5",
          type: "short_answer",
          options: [],
          question: "What is a Foreign Key in a database?",
          correctAnswer: "A Foreign Key is a column or set of columns in one table that references the Primary Key of another table, enforcing referential integrity.",
          explanation: "It creates a link between tables, preventing invalid data from being inserted into the foreign key column.",
          hint: "Link between tables referencing another key."
        }
      ];
    } else if (normDiff.includes("adv")) {
      questions = [
        {
          id: "db_a1",
          type: "mcq",
          question: "Which of the following correctly describes a Database Index?",
          options: [
            "It permanently copies the table to another disk partition.",
            "It is a data structure (e.g. B-Tree) that improves data retrieval speed, at the cost of additional storage and slower writes.",
            "It is a constraint that prevents duplicate keys from being created.",
            "It is a background daemon that schedules SQL execution."
          ],
          correctAnswer: "It is a data structure (e.g. B-Tree) that improves data retrieval speed, at the cost of additional storage and slower writes.",
          explanation: "An index allows database servers to search tables and find matching records extremely fast, but updates/inserts require updating the index, slightly slowing down write operations.",
          hint: "Speed up lookups via pointers."
        },
        {
          id: "db_a2",
          type: "mcq",
          question: "What does 'isolation' in ACID database transactions guarantee?",
          options: [
            "It ensures transactions are saved in distinct geographic databases.",
            "It ensures concurrent transactions execute without interfering with one another, as if they were running sequentially.",
            "It isolates errors to separate threads, preventing system crashes.",
            "It restricts table access to a single admin user."
          ],
          correctAnswer: "It ensures concurrent transactions execute without interfering with one another, as if they were running sequentially.",
          explanation: "ACID Isolation guarantees that concurrent transactions do not see intermediate, uncommitted states of other transactions, preventing inconsistencies like dirty reads.",
          hint: "Concurrency protection."
        },
        {
          id: "db_a3",
          type: "mcq",
          question: "Which SQL command is used to combine the results of two SELECT queries, excluding duplicate rows?",
          options: ["UNION", "UNION ALL", "JOIN", "MERGE"],
          correctAnswer: "UNION",
          explanation: "The UNION operator combines the result sets of two or more SELECT queries, automatically deduplicating rows. UNION ALL includes duplicates.",
          hint: "Deduplicated query combination."
        },
        {
          id: "db_a4",
          type: "fill_blank",
          options: [],
          question: "What SQL join type returns all records from the left table, and the matched records from the right table, filling with NULLs if there is no match?",
          correctAnswer: "LEFT JOIN",
          explanation: "A LEFT JOIN (or LEFT OUTER JOIN) returns all records from the left table, and matched rows from the right, filling right-side properties with NULL when no match exists.",
          hint: "Starts with direction Left."
        },
        {
          id: "db_a5",
          type: "short_answer",
          options: [],
          question: "Explain the difference between WHERE and HAVING in SQL.",
          correctAnswer: "WHERE filters rows before any groupings are made, whereas HAVING filters groups after GROUP BY is applied.",
          explanation: "You cannot use aggregate functions (like SUM, COUNT, AVG) inside WHERE. HAVING is designed specifically to filter aggregated records.",
          hint: "Pre-aggregation filtering vs post-aggregation filtering."
        }
      ];
    } else {
      // Intermediate SQL
      questions = [
        {
          id: "db_i1",
          type: "mcq",
          question: "Which JOIN type returns rows when there is a match in both tables?",
          options: ["LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "FULL OUTER JOIN"],
          correctAnswer: "INNER JOIN",
          explanation: "An INNER JOIN selects records that have matching values in both tables, ignoring rows that don't match on either side.",
          hint: "Standard intersection join."
        },
        {
          id: "db_i2",
          type: "mcq",
          question: "What is the purpose of SQL's GROUP BY clause?",
          options: [
            "To group columns into a single nested array.",
            "To aggregate data rows into summary rows based on shared values in specific columns.",
            "To sort the query result alphabetical order.",
            "To divide databases into multiple physical shards."
          ],
          correctAnswer: "To aggregate data rows into summary rows based on shared values in specific columns.",
          explanation: "GROUP BY is used with aggregate functions (like COUNT, MAX, MIN, SUM, AVG) to group the result-set by one or more columns.",
          hint: "Used for aggregation like COUNT or SUM."
        },
        {
          id: "db_i3",
          type: "mcq",
          question: "What does normalization in database schema design aim to do?",
          options: [
            "To increase data duplication and redundancy for backups.",
            "To minimize data redundancy and dependency, preventing data anomalies.",
            "To compile all schemas into SQL procedures.",
            "To convert text columns into numeric data automatically."
          ],
          correctAnswer: "To minimize data redundancy and dependency, preventing data anomalies.",
          explanation: "Normalization involves organizing columns and tables to ensure their dependencies are properly enforced, reducing redundant storage and keeping records accurate during writes.",
          hint: "Reduce repetition and duplication."
        },
        {
          id: "db_i4",
          type: "fill_blank",
          options: [],
          question: "Which aggregate function is used to calculate the average value of a numeric column in SQL?",
          correctAnswer: "AVG",
          explanation: "The AVG() function returns the average value of a numeric column.",
          hint: "Three-letter abbreviation of average."
        },
        {
          id: "db_i5",
          type: "short_answer",
          options: [],
          question: "What is the difference between TRUNCATE and DELETE in SQL?",
          correctAnswer: "TRUNCATE deletes all rows in a table instantly and cannot be filtered with WHERE, while DELETE removes specified rows and can be filtered.",
          explanation: "TRUNCATE is a DDL operation that drops and re-creates the table structure, which is much faster. DELETE is a DML operation that scans and removes rows individually, logging each deletion.",
          hint: "Table-level purge vs row-by-row removal."
        }
      ];
    }
  }

  return {
    questions,
    aiMotivation
  };
}

export function getOfflineEvaluationFallback(
  topic: string,
  score: number,
  totalQuestions: number,
  eloDelta: number,
  newElo: number,
  streakDays: number,
  displayName: string = "Scholar"
): string {
  const ratio = score / totalQuestions;
  if (ratio === 1) {
    return `Stellar performance, ${displayName}! You scored a perfect ${score}/${totalQuestions} on ${topic}. Your ELO rating has soared to ${newElo} (+${eloDelta}). A perfect adaptation score has been logged!`;
  } else if (ratio >= 0.7) {
    return `Excellent work, ${displayName}! You achieved a strong score of ${score}/${totalQuestions} on ${topic}, unlocking a mastery rating of ${newElo}. Keep practicing to master all advanced concepts!`;
  } else {
    return `Good effort, ${displayName}! You completed the ${topic} assessment. To push past your current ELO of ${newElo}, review the question explanations and try focusing on your flagged subtopics.`;
  }
}

export function getOfflineReminderFallback(
  displayName: string = "Student",
  streakDays: number = 0,
  weakTopics: string[] = []
) {
  const topicsText = weakTopics && weakTopics.length > 0 ? weakTopics[0] : "programming concepts";
  if (streakDays > 0) {
    return {
      title: "🔥 Keep Your Streak Alive!",
      body: `Don't break your amazing ${streakDays}-day streak, ${displayName}! Do a quick 5-question quiz now.`,
      type: "streak_alert" as const,
      motivationalTip: "Learning for just 5 minutes a day builds unstoppable momentum."
    };
  } else {
    return {
      title: "🚀 Ready for a Quick Practice?",
      body: `Boost your mastery in ${topicsText} today and level up your overall score.`,
      type: "new_exercise" as const,
      motivationalTip: "Every challenge you complete strengthens your cognitive endurance."
    };
  }
}

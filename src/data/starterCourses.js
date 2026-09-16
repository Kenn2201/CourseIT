export const STARTER_COURSES = [
  {
    $id: 'godot-nodes-and-scenes',
    title: 'Nodes and Scenes in Godot 4',
    source_url: 'https://docs.godotengine.org/en/stable/getting_started/step_by_step/nodes_and_scenes.html',
    overview: 'Master the fundamental building blocks of Godot 4: instantiating scenes, node trees, and scene composition.',
    recommended_next_step: 'Proceed to Godot Signals & Event Wiring',
    is_curated: true,
    category: 'Godot Engine',
    badge: 'Starter Template',
    $createdAt: '2026-09-17T00:00:00.000Z',
    steps: [
      {
        step_number: 1,
        title: 'Understand the Node as Godot\'s Basic Building Block',
        time_estimate: '~5 min',
        summary: 'Nodes are the fundamental objects in Godot. Every node has a name, editable properties, can receive callbacks to process each frame, and can be extended with scripts. Nodes only perform specific jobs (e.g. Sprite2D displays an image, Camera2D controls the viewport).'
      },
      {
        step_number: 2,
        title: 'Organize Nodes into a Hierarchical Scene Tree',
        time_estimate: '~10 min',
        summary: 'A scene is a collection of nodes arranged hierarchically in a tree. The tree has one single root node. When a parent node moves or transforms, all child nodes move along with it automatically.'
      },
      {
        step_number: 3,
        title: 'Create and Save a Scene in the Godot Editor',
        time_estimate: '~8 min',
        summary: 'In the Scene dock, click \'+\' to add a root node (such as Node2D or Control). Add child nodes under it. Save the scene file using Ctrl+S as a .tscn file inside your project\'s res:// folder.'
      },
      {
        step_number: 4,
        title: 'Instance Scenes to Reuse Game Components',
        time_estimate: '~12 min',
        summary: 'Scenes can be saved as templates and instanced inside other scenes (like a character or coin inside a game level). Click the link icon in the Scene dock to instance a saved .tscn file. Modifying the original scene updates all instances.'
      }
    ]
  },
  {
    $id: 'godot-using-signals',
    title: 'Using Signals to Decouple Game Objects',
    source_url: 'https://docs.godotengine.org/en/stable/getting_started/step_by_step/signals.html',
    overview: 'Emit custom signals, connect buttons and timers, and architect clean node communication without direct references.',
    recommended_next_step: 'Build your first 2D Game: Dodge the Creeps',
    is_curated: true,
    category: 'Godot Engine',
    badge: 'Starter Template',
    $createdAt: '2026-09-17T00:00:00.000Z',
    steps: [
      {
        step_number: 1,
        title: 'Declare Custom Signals in GDScript',
        time_estimate: '~5 min',
        summary: 'Use the signal keyword at the top of your GDScript file (e.g. signal health_changed(new_health)). Signals allow nodes to broadcast events without knowing who is listening.'
      },
      {
        step_number: 2,
        title: 'Emit Signals on Trigger Events',
        time_estimate: '~5 min',
        summary: 'Call health_changed.emit(current_health) inside your damage or collision logic. Godot will dispatch the signal to all connected listeners immediately.'
      },
      {
        step_number: 3,
        title: 'Connect Signals via the Godot Node Dock',
        time_estimate: '~8 min',
        summary: 'Select the emitting node, open the Node dock next to the Inspector, double-click the signal, and pick the target node to automatically generate a receiver callback method.'
      },
      {
        step_number: 4,
        title: 'Connect Signals via Code Dynamically',
        time_estimate: '~10 min',
        summary: 'Use button.pressed.connect(_on_button_pressed) in your _ready() function. This allows dynamically spawned enemies or projectiles to hook up their own cleanup callbacks safely.'
      }
    ]
  },
  {
    $id: 'react-server-components',
    title: 'React 19 Server Components & Actions',
    source_url: 'https://react.dev/reference/rsc/server-components',
    overview: 'Master async server transitions, useActionState, and zero-bundle-size server execution paths.',
    recommended_next_step: 'Integrate Optimistic UI Updates with useOptimistic',
    is_curated: true,
    category: 'React / Next.js',
    badge: 'Starter Template',
    $createdAt: '2026-09-17T00:00:00.000Z',
    steps: [
      {
        step_number: 1,
        title: 'Distinguish Server Components from Client Components',
        time_estimate: '~5 min',
        summary: 'In React 19, components in app directory execute on the server by default. They can directly access databases, file systems, and secret environment variables with zero client JavaScript bundle overhead.'
      },
      {
        step_number: 2,
        title: 'Add \'use client\' Directive for Interactivity',
        time_estimate: '~5 min',
        summary: 'Place the \'use client\' string at the very top of files that require useState, useEffect, browser events, or window listeners. Keep client boundaries as leaves of the component tree.'
      },
      {
        step_number: 3,
        title: 'Define Server Actions with \'use server\'',
        time_estimate: '~8 min',
        summary: 'Create async server functions that can be passed directly to HTML form action attributes: async function updateProfile(formData) { \'use server\'; ... }. React automatically posts and revalidates without manual fetch boilerplate.'
      },
      {
        step_number: 4,
        title: 'Handle Form State with useActionState',
        time_estimate: '~7 min',
        summary: 'Combine server actions with const [state, formAction, isPending] = useActionState(action, initialState) for built-in pending spinners, error states, and progressive enhancement.'
      }
    ]
  },
  {
    $id: 'rust-ownership-borrowing',
    title: 'Rust Ownership, References & Borrow Checker',
    source_url: 'https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html',
    overview: 'Conquer the borrow checker: understand stack vs heap allocation, mutable references, and lifetime scopes.',
    recommended_next_step: 'Explore Rust Structs & Method Implementation',
    is_curated: true,
    category: 'Rust Lang',
    badge: 'Starter Template',
    $createdAt: '2026-09-17T00:00:00.000Z',
    steps: [
      {
        step_number: 1,
        title: 'Understand the Three Rules of Ownership',
        time_estimate: '~5 min',
        summary: '1. Each value in Rust has an owner. 2. There can only be one owner at a time. 3. When the owner goes out of scope, the value is dropped automatically without a garbage collector.'
      },
      {
        step_number: 2,
        title: 'Move Semantics on Heap Allocation',
        time_estimate: '~8 min',
        summary: 'Assigning a heap variable (like String::from("hello")) to another variable moves ownership. The original variable is invalidated to prevent double-free errors. Use .clone() only when a deep copy is truly needed.'
      },
      {
        step_number: 3,
        title: 'Borrowing with Immutable References (&T)',
        time_estimate: '~7 min',
        summary: 'Pass &value to functions to borrow without taking ownership. You can have any number of immutable references (&T) active concurrently because none can mutate data.'
      },
      {
        step_number: 4,
        title: 'Mutable References (&mut T) and the Exclusive Rule',
        time_estimate: '~10 min',
        summary: 'If you have a mutable reference (&mut T) to data, you can have no other references (neither mutable nor immutable) to that data in the same scope, preventing data races at compile time.'
      }
    ]
  },
  {
    $id: 'docker-multi-stage-builds',
    title: 'Docker Multi-Stage Production Builds',
    source_url: 'https://docs.docker.com/build/building/multi-stage/',
    overview: 'Slash container sizes by 85%: separate build environments from runtime artifacts with clean Dockerfile stages.',
    recommended_next_step: 'Configure Docker Compose & Healthchecks',
    is_curated: true,
    category: 'Docker / DevOps',
    badge: 'Starter Template',
    $createdAt: '2026-09-17T00:00:00.000Z',
    steps: [
      {
        step_number: 1,
        title: 'Create the Builder Stage',
        time_estimate: '~5 min',
        summary: 'Start with FROM node:22-alpine AS builder. Copy package.json, run npm ci, copy source files, and run npm run build to produce the dist/ production bundle.'
      },
      {
        step_number: 2,
        title: 'Create the Lightweight Production Runtime Stage',
        time_estimate: '~5 min',
        summary: 'Define a second stage FROM nginx:alpine AS runner. This clean stage does not contain Node.js, npm, devDependencies, or build tooling, reducing the attack surface.'
      },
      {
        step_number: 3,
        title: 'Copy Only Built Artifacts with --from=builder',
        time_estimate: '~5 min',
        summary: 'Use COPY --from=builder /app/dist /usr/share/nginx/html. Only the compiled HTML/JS/CSS is transferred into the final image.'
      },
      {
        step_number: 4,
        title: 'Build and Verify Image Size',
        time_estimate: '~5 min',
        summary: 'Run docker build -t my-app:latest . and check docker images. Compare the 25MB final multi-stage image against a 900MB single-stage build.'
      }
    ]
  }
];

/**
 * Curated Starter Courses for CourseIT Ai
 *
 * Shared between client catalog and server resolvers to ensure
 * CourseTutor and course detail routes support starter courses seamlessly.
 */

export const STARTER_COURSES = [
  {
    $id: 'starter-godot-signals',
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
        summary: 'Use the signal keyword at the top of your GDScript file (e.g. signal health_changed(new_health)). Signals allow nodes to broadcast events without knowing who is listening.',
        implementation: '1. Open player script in Script dock.\n2. Add signal health_changed(new_health: int) at class top.\n3. Save script using Ctrl+S.',
        code_snippet: 'extends CharacterBody2D\n\nsignal health_changed(new_health: int)\nsignal player_died\n\nvar health: int = 100',
        pro_tip: 'Always type-hint custom signal arguments (e.g. (new_health: int)) to catch type mismatches at compile time.'
      },
      {
        step_number: 2,
        title: 'Emit Signals on Trigger Events',
        time_estimate: '~5 min',
        summary: 'Call health_changed.emit(current_health) inside your damage or collision logic. Godot will dispatch the signal to all connected listeners immediately.',
        implementation: '1. In take_damage() function, subtract health.\n2. Call health_changed.emit(health).\n3. Emit player_died if health reaches zero.',
        code_snippet: 'func take_damage(amount: int) -> void:\n    health = max(0, health - amount)\n    health_changed.emit(health)\n    if health == 0:\n        player_died.emit()',
        pro_tip: 'In Godot 4, use my_signal.emit() directly instead of the legacy Godot 3 emit_signal("my_signal").'
      },
      {
        step_number: 3,
        title: 'Connect Signals via the Godot Node Dock',
        time_estimate: '~8 min',
        summary: 'Select the emitting node, open the Node dock next to the Inspector, double-click the signal, and pick the target node to automatically generate a receiver callback method.',
        implementation: '1. In Scene tree dock, click Player node.\n2. Switch right sidebar from Inspector to Node tab.\n3. Double-click health_changed under Signals.\n4. Select HUD node and click Connect button.',
        code_snippet: '# Connected receiver callback in HUD.gd\nfunc _on_player_health_changed(new_health: int) -> void:\n    health_bar.value = new_health\n    health_label.text = "HP: %d" % new_health',
        pro_tip: 'Green connection icon in the script gutter confirms active signal binding.'
      },
      {
        step_number: 4,
        title: 'Connect Signals via Code Dynamically',
        time_estimate: '~10 min',
        summary: 'Use button.pressed.connect(_on_button_pressed) in your _ready() function. This allows dynamically spawned enemies or projectiles to hook up their own cleanup callbacks safely.',
        implementation: '1. In _ready(), grab node reference with $.\n2. Call .connect() passing the callable method.\n3. Implement the matching receiver method.',
        code_snippet: 'func _ready() -> void:\n    var restart_btn = $RestartButton\n    restart_btn.pressed.connect(_on_restart_pressed)\n\nfunc _on_restart_pressed() -> void:\n    get_tree().reload_current_scene()',
        pro_tip: 'Always check button.pressed.is_connected(callable) before re-connecting if nodes are reused.'
      }
    ]
  },
  {
    $id: 'starter-react-server-components',
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
        summary: 'In React 19, components execute on the server by default. They can directly access databases, file systems, and secret environment variables with zero client JavaScript bundle overhead.',
        implementation: '1. Create page file inside Next.js app directory.\n2. Export async default component without "use client".\n3. Directly await database or microservice queries.',
        code_snippet: '// app/dashboard/page.tsx (Server Component by default)\nimport db from \'@/lib/db\';\nimport { MetricsList } from \'./MetricsList\';\n\nexport default async function DashboardPage() {\n  const metrics = await db.metrics.findMany();\n  return <MetricsList initialData={metrics} />;\n}',
        pro_tip: 'Server Components never serialize internal database connection credentials to the client.'
      },
      {
        step_number: 2,
        title: 'Add "use client" Directive for Interactivity',
        time_estimate: '~5 min',
        summary: 'Place the "use client" string at the very top of files that require useState, useEffect, browser events, or window listeners. Keep client boundaries as leaves of the component tree.',
        implementation: '1. Add \'use client\'; as exact line 1 of interactive file.\n2. Import standard hooks (useState, useEffect).\n3. Keep non-interactive wrapper as a server component.',
        code_snippet: '\'use client\';\n\nimport { useState } from \'react\';\n\nexport function FilterBar({ onFilter }: { onFilter: (q: string) => void }) {\n  const [query, setQuery] = useState(\'\');\n  return (\n    <input\n      value={query}\n      onChange={(e) => {\n        setQuery(e.target.value);\n        onFilter(e.target.value);\n      }}\n      placeholder="Filter items..."\n    />\n  );\n}',
        pro_tip: 'Marking a file "use client" creates an import boundary: everything imported into it becomes part of the client bundle.'
      },
      {
        step_number: 3,
        title: 'Define Server Actions with "use server"',
        time_estimate: '~8 min',
        summary: 'Create async server functions that can be passed directly to HTML form action attributes: async function updateProfile(formData) { \'use server\'; ... }. React automatically posts and revalidates without manual fetch boilerplate.',
        implementation: '1. Create actions.ts with \'use server\'; at top.\n2. Export async functions taking FormData.\n3. Directly mutate database and revalidate cache tag.',
        code_snippet: '// app/actions.ts\n\'use server\';\n\nimport { revalidatePath } from \'next/cache\';\nimport db from \'@/lib/db\';\n\nexport async function updateUsername(formData: FormData) {\n  const username = formData.get(\'username\') as string;\n  await db.user.update({ where: { id: \'me\' }, data: { username } });\n  revalidatePath(\'/profile\');\n}',
        pro_tip: 'Server Actions work even before JavaScript has finished hydration in modern browsers (Progressive Enhancement).'
      },
      {
        step_number: 4,
        title: 'Handle Form State with useActionState',
        time_estimate: '~7 min',
        summary: 'Combine server actions with const [state, formAction, isPending] = useActionState(action, initialState) for built-in pending spinners, error states, and progressive enhancement.',
        implementation: '1. Import useActionState from \'react\'.\n2. Pass server action function and initial state.\n3. Bind formAction to <form action={formAction}>.\n4. Use isPending flag to disable submit button.',
        code_snippet: '\'use client\';\n\nimport { useActionState } from \'react\';\nimport { updateUsername } from \'./actions\';\n\nexport function ProfileForm() {\n  const [state, formAction, isPending] = useActionState(updateUsername, null);\n\n  return (\n    <form action={formAction}>\n      <input name="username" placeholder="New username" required />\n      <button type="submit" disabled={isPending}>\n        {isPending ? \'Updating...\' : \'Save Changes\'}\n      </button>\n    </form>\n  );\n}',
        pro_tip: 'React 19 replaces useFormState from react-dom with the standardized useActionState directly in core react.'
      }
    ]
  },
  {
    $id: 'starter-rust-ownership',
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
        summary: '1. Each value in Rust has an owner. 2. There can only be one owner at a time. 3. When the owner goes out of scope, the value is dropped automatically without a garbage collector.',
        implementation: '1. Create scope using { ... } braces.\n2. Instantiate heap object with String::from().\n3. Note automatic drop() call when scope closes.',
        code_snippet: 'fn main() {\n    {\n        let s = String::from("hello"); // s is valid from here\n        println!("{}", s);\n    } // this scope is now over, Rust calls drop() automatically\n}',
        pro_tip: 'Rust\'s RAII model guarantees zero memory leaks and zero runtime garbage collection pauses.'
      },
      {
        step_number: 2,
        title: 'Move Semantics on Heap Allocation',
        time_estimate: '~8 min',
        summary: 'Assigning a heap variable (like String::from("hello")) to another variable moves ownership. The original variable is invalidated to prevent double-free errors. Use .clone() only when a deep copy is truly needed.',
        implementation: '1. Create heap-allocated variable s1.\n2. Assign let s2 = s1.\n3. Note s1 is invalidated by the compiler to prevent double-free memory bugs.',
        code_snippet: 'fn main() {\n    let s1 = String::from("hello");\n    let s2 = s1; // Ownership moved to s2\n\n    // println!("{}", s1); // COMPILE ERROR: value borrowed after move\n    println!("{}", s2); // Works! s2 is the unique owner\n}',
        pro_tip: 'Stack-only types with fixed sizes (like i32, bool, f64) implement Copy and do not invalidate on assignment.'
      },
      {
        step_number: 3,
        title: 'Borrowing with Immutable References (&T)',
        time_estimate: '~7 min',
        summary: 'Pass &value to functions to borrow without taking ownership. You can have any number of immutable references (&T) active concurrently because none can mutate data.',
        implementation: '1. Add & to parameter type (e.g. &String).\n2. Call function with &s1.\n3. Read data without transferring ownership.',
        code_snippet: 'fn calculate_length(s: &String) -> usize {\n    s.len() // s borrows String without taking ownership\n}\n\nfn main() {\n    let s1 = String::from("hello");\n    let len = calculate_length(&s1);\n    println!("String \'{}\' has length {}.", s1, len); // s1 remains valid!\n}',
        pro_tip: 'Immutable references are read-only and can be safely shared across concurrent readers.'
      },
      {
        step_number: 4,
        title: 'Mutable References (&mut T) and the Exclusive Rule',
        time_estimate: '~10 min',
        summary: 'If you have a mutable reference (&mut T) to data, you can have no other references (neither mutable nor immutable) to that data in the same scope, preventing data races at compile time.',
        implementation: '1. Declare let mut s = ...\n2. Create &mut s reference.\n3. Ensure no active immutable references overlap in the same scope.',
        code_snippet: 'fn main() {\n    let mut s = String::from("hello");\n\n    let r1 = &s;\n    let r2 = &s;\n    println!("{} and {}", r1, r2);\n    // r1 and r2 lifetimes end here\n\n    let r3 = &mut s; // Allowed because r1 and r2 are no longer active\n    r3.push_str(", world!");\n    println!("{}", r3);\n}',
        pro_tip: 'The compiler enforces "one mutable reference OR multiple immutable references", completely eliminating data races.'
      }
    ]
  },
  {
    $id: 'starter-docker-builds',
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
        summary: 'Start with FROM node:22-alpine AS builder. Copy package.json, run npm ci, copy source files, and run npm run build to produce the dist/ production bundle.',
        implementation: '1. Create Dockerfile in project root.\n2. Declare builder stage with FROM node:22-alpine AS builder.\n3. Copy package.json and run npm ci.\n4. Copy source and run npm run build.',
        code_snippet: '# Stage 1: Build dependencies and artifacts\nFROM node:22-alpine AS builder\nWORKDIR /app\n\nCOPY package*.json ./\nRUN npm ci\n\nCOPY . .\nRUN npm run build',
        pro_tip: 'Copy package.json before source files so Docker caches the expensive npm ci layer between code changes.'
      },
      {
        step_number: 2,
        title: 'Create the Lightweight Production Runtime Stage',
        time_estimate: '~5 min',
        summary: 'Define a second stage FROM nginx:alpine AS runner. This clean stage does not contain Node.js, npm, devDependencies, or build tooling, reducing the attack surface.',
        implementation: '1. In same Dockerfile, define second stage FROM nginx:1.27-alpine AS runner.\n2. Set WORKDIR /usr/share/nginx/html.\n3. Clean out default welcome pages.',
        code_snippet: '# Stage 2: Minimal production runtime\nFROM nginx:1.27-alpine AS runner\nWORKDIR /usr/share/nginx/html\n\n# Strip default nginx welcome files\nRUN rm -rf ./*',
        pro_tip: 'Alpine-based runtime images weigh under 15MB compared to 1GB+ for standard Node/Ubuntu development images.'
      },
      {
        step_number: 3,
        title: 'Copy Only Built Artifacts with --from=builder',
        time_estimate: '~5 min',
        summary: 'Use COPY --from=builder /app/dist /usr/share/nginx/html. Only the compiled HTML/JS/CSS is transferred into the final image.',
        implementation: '1. Add COPY --from=builder command.\n2. Target nginx public web directory.\n3. Expose port 80 and define launch command.',
        code_snippet: '# Copy built assets from builder stage\nCOPY --from=builder /app/dist /usr/share/nginx/html\n\nEXPOSE 80\nCMD ["nginx", "-g", "daemon off;"]',
        pro_tip: 'Use --from=builder to cherry-pick only final compiled bundles, completely discarding SDKs, git history, and dev dependencies.'
      },
      {
        step_number: 4,
        title: 'Build and Verify Image Size',
        time_estimate: '~5 min',
        summary: 'Run docker build -t my-app:latest . and check docker images. Compare the 25MB final multi-stage image against a 900MB single-stage build.',
        implementation: '1. Execute docker build command in terminal.\n2. List local images to verify minimal footprint.\n3. Test run the container on port 8080.',
        code_snippet: '# Build container image\ndocker build -t my-app:production .\n\n# Inspect compressed image size\ndocker images | grep my-app\n\n# Test run on port 8080\ndocker run -d -p 8080:80 my-app:production',
        pro_tip: 'Always include a .dockerignore file ignoring node_modules, .git, and local logs to speed up context transfer.'
      }
    ]
  }
];

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Mobile Typography & Responsive Layout Directives (CRITICAL)

1. **Zero Mobile Text Overflow / Wrapping**: All numeric readings, sensor labels, status badges, timestamps, and footer tags on mobile viewports (< 640px) MUST use fluid typography (`text-2xl sm:text-3xl lg:text-4xl`), `whitespace-nowrap`, `shrink-0`, and `truncate` with `min-w-0` to guarantee text never clips or breaks onto a second line.
2. **Sensor Cards**: Numeric telemetry values must fit fluidly inside their containers across screen sizes down to 320px width.
3. **Raw Telemetry Stream**: Tables must use `overflow-x-auto` with `whitespace-nowrap` on all `<th>` and `<td>` elements.

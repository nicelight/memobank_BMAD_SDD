---
name: mb-analysis
description: >
  Optional Analysis before PRD: route vague ideas through
  facilitated brainstorming and a concise product brief without creating tasks.
---

# mb-analysis - Optional Analysis before PRD

- **What it does:** adds a lightweight Analysis phase before `/prd` when the idea is vague, unstable, or needs explicit product framing.
- **Use `/analysis` when:** you need a router that inspects current Memory Bank state and recommends the next command.
- **Use `/brainstorm` when:** the idea is raw and needs facilitated ideation. The AI acts as a coach; the user's product intent and choices remain the source of truth.
- **Use `/brief` when:** the concept is clear enough to produce a concise Product Brief, or after a brainstorming report exists.
- **Output:** optional artifacts under `.memory-bank/analysis/`.

Analysis is optional. Raw PRD text or an existing external PRD must be normalized and checked through `/write-prd` first, producing `.memory-bank/prd.md` with `type: prd`, `clarification_status: complete`, and `constitution_checked: true`; then `/prd` decomposes it. Brownfield projects should map the current codebase first with `/map-codebase` before planning deltas.

`/brief` creates the Product Brief as the input contract for `/write-prd`. It is not a PRD, backlog, research report, or marketing document.

The normal planning path is:

```text
/analysis -> /brainstorm -> /brief -> /write-prd -> /prd -> /prd-to-tasks FT-<NNN>
```

Analysis never creates task records. `/clarify-feature FT-<NNN>` is optional and only for a specific feature that is explicitly pending/blocked or has decomposition-affecting unresolved markers.

## Artifacts

- `.memory-bank/analysis/index.md`
- `.memory-bank/analysis/product-brief.md`
- `.memory-bank/analysis/brainstorming/BR-<NNN>.md`

Templates in `assets/` are reference shapes for those artifacts. They are intentionally compact and can be adapted during interactive sessions.

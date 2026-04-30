---
read_when:
    - 你看到一個 `.experimental` 設定鍵，並想知道它是否穩定
    - 你想試用預覽版執行階段功能，而不會將它們與一般預設值混淆
    - 你想要有一個地方可以查找目前文件中記載的實驗性旗標
summary: OpenClaw 中的實驗性旗標代表什麼，以及目前已記錄哪些旗標
title: 實驗性功能
x-i18n:
    generated_at: "2026-04-30T02:59:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a97e8efa180844e1ca94495d626956847a15a15bba0846aaf54ff9c918cda02
    source_path: concepts/experimental-features.md
    workflow: 16
---

Experimental features in OpenClaw are **opt-in preview surfaces**. They are
behind explicit flags because they still need real-world mileage before they
deserve a stable default or a long-lived public contract.

Treat them differently from normal config:

- Keep them **off by default** unless the related doc tells you to try one.
- Expect **shape and behavior to change** faster than stable config.
- Prefer the stable path first when one already exists.
- If you are rolling OpenClaw out broadly, test experimental flags in a smaller
  environment before baking them into a shared baseline.

## Currently documented flags

| Surface                  | Key                                                       | Use it when                                                                                                    | More                                                                                          |
| ------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Local model runtime      | `agents.defaults.experimental.localModelLean`             | A smaller or stricter local backend chokes on OpenClaw's full default tool surface                             | [Local Models](/zh-TW/gateway/local-models)                                                         |
| Memory search            | `agents.defaults.memorySearch.experimental.sessionMemory` | You want `memory_search` to index prior session transcripts and accept the extra storage/indexing cost         | [Memory configuration reference](/zh-TW/reference/memory-config#session-memory-search-experimental) |
| Structured planning tool | `tools.experimental.planTool`                             | You want the structured `update_plan` tool exposed for multi-step work tracking in compatible runtimes and UIs | [Gateway configuration reference](/zh-TW/gateway/config-tools#toolsexperimental)                    |

## Local model lean mode

`agents.defaults.experimental.localModelLean: true` is a pressure-release valve
for weaker local-model setups. It trims heavyweight default tools like
`browser`, `cron`, and `message` so the prompt shape is smaller and less brittle
for small-context or stricter OpenAI-compatible backends.

That is intentionally **not** the normal path. If your backend handles the full
runtime cleanly, leave this off.

## Experimental does not mean hidden

If a feature is experimental, OpenClaw should say so plainly in docs and in the
config path itself. What it should **not** do is smuggle preview behavior into a
stable-looking default knob and pretend that is normal. That's how config
surfaces get messy.

## Related

- [Features](/zh-TW/concepts/features)
- [Release channels](/zh-TW/install/development-channels)

---
read_when:
    - OpenClaw가 제공하는 도구를 이해하고 싶습니다
    - 도구를 구성하거나, 허용하거나, 거부해야 합니다
    - 기본 제공 도구, Skills, Plugin 중에서 선택하고 있습니다
summary: 'OpenClaw 도구 및 Plugin 개요: 에이전트가 수행할 수 있는 작업과 이를 확장하는 방법'
title: 도구 및 Plugin
x-i18n:
    generated_at: "2026-05-03T21:38:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d1f776639ec2a90d8c02418c4b2c62ae7534ea535f626bc1172f1301c32c6f0
    source_path: tools/index.md
    workflow: 16
---

Everything the agent does beyond generating text happens through **tools**.
Tools are how the agent reads files, runs commands, browses the web, sends
messages, and interacts with devices.

## Tools, skills, and plugins

OpenClaw has three layers that work together:

<Steps>
  <Step title="Tools are what the agent calls">
    A tool is a typed function the agent can invoke (e.g. `exec`, `browser`,
    `web_search`, `message`). OpenClaw ships a set of **built-in tools** and
    plugins can register additional ones.

    The agent sees tools as structured function definitions sent to the model API.

  </Step>

  <Step title="Skills teach the agent when and how">
    A skill is a markdown file (`SKILL.md`) injected into the system prompt.
    Skills give the agent context, constraints, and step-by-step guidance for
    using tools effectively. Skills live in your workspace, in shared folders,
    or ship inside plugins.

    [Skills reference](/ko/tools/skills) | [Creating skills](/ko/tools/creating-skills)

  </Step>

  <Step title="Plugins package everything together">
    A plugin is a package that can register any combination of capabilities:
    channels, model providers, tools, skills, speech, realtime transcription,
    realtime voice, media understanding, image generation, video generation,
    web fetch, web search, and more. Some plugins are **core** (shipped with
    OpenClaw), others are **external** (published on npm by the community).

    [Install and configure plugins](/ko/tools/plugin) | [Build your own](/ko/plugins/building-plugins)

  </Step>
</Steps>

## Built-in tools

These tools ship with OpenClaw and are available without installing any plugins:

| Tool                                       | What it does                                                          | Page                                                         |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Run shell commands, manage background processes                       | [Exec](/ko/tools/exec), [Exec Approvals](/ko/tools/exec-approvals) |
| `code_execution`                           | Run sandboxed remote Python analysis                                  | [Code Execution](/ko/tools/code-execution)                      |
| `browser`                                  | Control a Chromium browser (navigate, click, screenshot)              | [Browser](/ko/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Search the web, search X posts, fetch page content                    | [Web](/ko/tools/web), [Web Fetch](/ko/tools/web-fetch)             |
| `read` / `write` / `edit`                  | File I/O in the workspace                                             |                                                              |
| `apply_patch`                              | Multi-hunk file patches                                               | [Apply Patch](/ko/tools/apply-patch)                            |
| `message`                                  | Send messages across all channels                                     | [Agent Send](/ko/tools/agent-send)                              |
| `canvas`                                   | Drive node Canvas (present, eval, snapshot)                           |                                                              |
| `nodes`                                    | Discover and target paired devices                                    |                                                              |
| `cron` / `gateway`                         | Manage scheduled jobs; inspect, patch, restart, or update the gateway |                                                              |
| `image` / `image_generate`                 | Analyze or generate images                                            | [Image Generation](/ko/tools/image-generation)                  |
| `music_generate`                           | Generate music tracks                                                 | [Music Generation](/ko/tools/music-generation)                  |
| `video_generate`                           | Generate videos                                                       | [Video Generation](/ko/tools/video-generation)                  |
| `tts`                                      | One-shot text-to-speech conversion                                    | [TTS](/ko/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Session management, status, and sub-agent orchestration               | [Sub-agents](/ko/tools/subagents)                               |
| `session_status`                           | Lightweight `/status`-style readback and session model override       | [Session Tools](/ko/concepts/session-tool)                      |

For image work, use `image` for analysis and `image_generate` for generation or editing. If you target `openai/*`, `google/*`, `fal/*`, or another non-default image provider, configure that provider's auth/API key first.

For music work, use `music_generate`. If you target `google/*`, `minimax/*`, or another non-default music provider, configure that provider's auth/API key first.

For video work, use `video_generate`. If you target `qwen/*` or another non-default video provider, configure that provider's auth/API key first.

For workflow-driven audio generation, use `music_generate` when a plugin such as
ComfyUI registers it. This is separate from `tts`, which is text-to-speech.

`session_status` is the lightweight status/readback tool in the sessions group.
It answers `/status`-style questions about the current session and can
optionally set a per-session model override; `model=default` clears that
override. Like `/status`, it can backfill sparse token/cache counters and the
active runtime model label from the latest transcript usage entry.

`gateway` is the owner-only runtime tool for gateway operations:

- `config.schema.lookup` for one path-scoped config subtree before edits
- `config.get` for the current config snapshot + hash
- `config.patch` for partial config updates with restart
- `config.apply` only for full-config replacement
- `update.run` for explicit self-update + restart

For partial changes, prefer `config.schema.lookup` then `config.patch`. Use
`config.apply` only when you intentionally replace the entire config.
For broader config docs, read [Configuration](/ko/gateway/configuration) and
[Configuration reference](/ko/gateway/configuration-reference).
The tool also refuses to change `tools.exec.ask` or `tools.exec.security`;
legacy `tools.bash.*` aliases normalize to the same protected exec paths.

### Plugin-provided tools

Plugins can register additional tools. Some examples:

- [Diffs](/ko/tools/diffs) — diff viewer and renderer
- [LLM Task](/ko/tools/llm-task) — JSON-only LLM step for structured output
- [Lobster](/ko/tools/lobster) — typed workflow runtime with resumable approvals
- [Music Generation](/ko/tools/music-generation) — shared `music_generate` tool with workflow-backed providers
- [OpenProse](/ko/prose) — markdown-first workflow orchestration
- [Tokenjuice](/ko/tools/tokenjuice) — compact noisy `exec` and `bash` tool results

Plugin tools are still authored with `api.registerTool(...)` and declared in
the plugin manifest's `contracts.tools` list. OpenClaw captures the validated
tool descriptor during discovery and caches it by plugin source and contract, so
later tool planning can skip plugin runtime loading. Tool execution still loads
the owning plugin and calls the live registered implementation.

## Tool configuration

### Allow and deny lists

Control which tools the agent can call via `tools.allow` / `tools.deny` in
config. Deny always wins over allow.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw fails closed when an explicit allowlist resolves to no callable tools.
For example, `tools.allow: ["query_db"]` only works if a loaded plugin actually
registers `query_db`. If no built-in, plugin, or bundled MCP tool matches the
allowlist, the run stops before the model call instead of continuing as a
text-only run that could hallucinate tool results.

### Tool profiles

`tools.profile` sets a base allowlist before `allow`/`deny` is applied.
Per-agent override: `agents.list[].tools.profile`.

| Profile     | What it includes                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | All core and optional plugin tools; unrestricted baseline for broader command/control access                                                      |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | `session_status` only                                                                                                                             |

<Note>
`tools.profile: "messaging"` is intentionally narrow for channel-focused
agents. It leaves out broader command/control tools such as filesystem, runtime,
browser, canvas, nodes, cron, and gateway control. Use `tools.profile: "full"`
as the unrestricted baseline for broader command/control access, then trim
access with `tools.allow` / `tools.deny` when needed.
</Note>

`coding` includes lightweight web tools (`web_search`, `web_fetch`, `x_search`)
but not the full browser-control tool. Browser automation can drive real
sessions and logged-in profiles, so add it explicitly with
`tools.alsoAllow: ["browser"]` or a per-agent
`agents.list[].tools.alsoAllow: ["browser"]`.

<Note>
Configuring `tools.exec` or `tools.fs` under a restrictive profile (`messaging`, `minimal`) does not implicitly widen the profile's allowlist. Add explicit `tools.alsoAllow` entries (for example `["exec", "process"]` for exec, or `["read", "write", "edit"]` for fs) when you want a restrictive profile to use those configured sections. OpenClaw logs a startup warning when a config section is present without a matching `alsoAllow` grant.
</Note>

The `coding` and `messaging` profiles also allow configured bundle MCP tools
under the plugin key `bundle-mcp`. Add `tools.deny: ["bundle-mcp"]` when you
want a profile to keep its normal built-ins but hide all configured MCP tools.
The `minimal` profile does not include bundle MCP tools.

Example (broadest tool surface by default):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### Tool groups

Use `group:*` shorthands in allow/deny lists:

| 그룹               | 도구                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash`는 `exec`의 별칭으로 허용됨)                                         |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | 모든 기본 제공 OpenClaw 도구(Plugin 도구 제외)                                                           |

`sessions_history`는 범위가 제한되고 안전 필터가 적용된 회상 보기를 반환합니다. 원시 transcript 덤프로 작동하는 대신,
thinking 태그, `<relevant-memories>` 스캐폴딩, 일반 텍스트 도구 호출 XML
페이로드(`<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` 및 잘린 도구 호출 블록 포함),
다운그레이드된 도구 호출 스캐폴딩, 유출된 ASCII/전각 모델 제어
토큰, assistant 텍스트의 잘못된 MiniMax 도구 호출 XML을 제거한 다음,
비식별화/잘림 처리와 필요한 경우 크기가 너무 큰 행 플레이스홀더를 적용합니다.

### 제공자별 제한 사항

전역 기본값을 변경하지 않고 특정 제공자의 도구를 제한하려면 `tools.byProvider`를 사용하세요.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```

---
read_when:
    - OpenClaw'ın hangi araçları sunduğunu anlamak istiyorsunuz
    - Araçları yapılandırmanız, araçlara izin vermeniz veya araçları reddetmeniz gerekir
    - Yerleşik araçlar, Skills ve Plugin'lar arasında karar veriyorsunuz
summary: 'OpenClaw araçlarına ve Plugin''lere genel bakış: ajanın neler yapabileceği ve nasıl genişletileceği'
title: Araçlar ve Plugin'ler
x-i18n:
    generated_at: "2026-04-30T16:30:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7acfac11669b6f9696a368c08afada8d33e30ac2f452d507f5d1bc36bae367eb
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

    [Skills reference](/tr/tools/skills) | [Creating skills](/tr/tools/creating-skills)

  </Step>

  <Step title="Plugins package everything together">
    A plugin is a package that can register any combination of capabilities:
    channels, model providers, tools, skills, speech, realtime transcription,
    realtime voice, media understanding, image generation, video generation,
    web fetch, web search, and more. Some plugins are **core** (shipped with
    OpenClaw), others are **external** (published on npm by the community).

    [Install and configure plugins](/tr/tools/plugin) | [Build your own](/tr/plugins/building-plugins)

  </Step>
</Steps>

## Built-in tools

These tools ship with OpenClaw and are available without installing any plugins:

| Tool                                       | What it does                                                          | Page                                                         |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Run shell commands, manage background processes                       | [Exec](/tr/tools/exec), [Exec Approvals](/tr/tools/exec-approvals) |
| `code_execution`                           | Run sandboxed remote Python analysis                                  | [Code Execution](/tr/tools/code-execution)                      |
| `browser`                                  | Control a Chromium browser (navigate, click, screenshot)              | [Browser](/tr/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Search the web, search X posts, fetch page content                    | [Web](/tr/tools/web), [Web Fetch](/tr/tools/web-fetch)             |
| `read` / `write` / `edit`                  | File I/O in the workspace                                             |                                                              |
| `apply_patch`                              | Multi-hunk file patches                                               | [Apply Patch](/tr/tools/apply-patch)                            |
| `message`                                  | Send messages across all channels                                     | [Agent Send](/tr/tools/agent-send)                              |
| `canvas`                                   | Drive node Canvas (present, eval, snapshot)                           |                                                              |
| `nodes`                                    | Discover and target paired devices                                    |                                                              |
| `cron` / `gateway`                         | Manage scheduled jobs; inspect, patch, restart, or update the gateway |                                                              |
| `image` / `image_generate`                 | Analyze or generate images                                            | [Image Generation](/tr/tools/image-generation)                  |
| `music_generate`                           | Generate music tracks                                                 | [Music Generation](/tr/tools/music-generation)                  |
| `video_generate`                           | Generate videos                                                       | [Video Generation](/tr/tools/video-generation)                  |
| `tts`                                      | One-shot text-to-speech conversion                                    | [TTS](/tr/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Session management, status, and sub-agent orchestration               | [Sub-agents](/tr/tools/subagents)                               |
| `session_status`                           | Lightweight `/status`-style readback and session model override       | [Session Tools](/tr/concepts/session-tool)                      |

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
For broader config docs, read [Configuration](/tr/gateway/configuration) and
[Configuration reference](/tr/gateway/configuration-reference).
The tool also refuses to change `tools.exec.ask` or `tools.exec.security`;
legacy `tools.bash.*` aliases normalize to the same protected exec paths.

### Plugin-provided tools

Plugins can register additional tools. Some examples:

- [Diffs](/tr/tools/diffs) — diff viewer and renderer
- [LLM Task](/tr/tools/llm-task) — JSON-only LLM step for structured output
- [Lobster](/tr/tools/lobster) — typed workflow runtime with resumable approvals
- [Music Generation](/tr/tools/music-generation) — shared `music_generate` tool with workflow-backed providers
- [OpenProse](/tr/prose) — markdown-first workflow orchestration
- [Tokenjuice](/tr/tools/tokenjuice) — compact noisy `exec` and `bash` tool results

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
| `full`      | Unrestricted baseline for broader command/control access; same as leaving `tools.profile` unset                                                   |
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

| Grup               | Araçlar                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash`, `exec` için takma ad olarak kabul edilir)                         |
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
| `group:openclaw`   | Tüm yerleşik OpenClaw araçları (Plugin araçları hariç)                                                   |

`sessions_history`, sınırlı ve güvenlik filtresinden geçirilmiş bir geri çağırma görünümü döndürür. Düşünme etiketlerini, `<relevant-memories>` iskeletini, düz metin araç çağrısı XML yüklerini (`<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` ve kısaltılmış araç çağrısı blokları dahil),
derecesi düşürülmüş araç çağrısı iskeletini, sızmış ASCII/tam genişlikli model denetim belirteçlerini ve assistant metnindeki hatalı biçimlendirilmiş MiniMax araç çağrısı XML'ini ayıklar; ardından ham bir transkript dökümü gibi davranmak yerine redaksiyon/kısaltma ve olası aşırı büyük satır yer tutucuları uygular.

### Sağlayıcıya özgü kısıtlamalar

Genel varsayılanları değiştirmeden belirli sağlayıcılar için araçları kısıtlamak üzere `tools.byProvider` kullanın:

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

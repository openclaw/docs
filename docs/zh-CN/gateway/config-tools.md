---
read_when:
    - 配置 `tools.*` 策略、允许列表或实验性功能
    - 注册自定义提供商或覆盖基础 URL
    - 设置 OpenAI 兼容的自托管端点
sidebarTitle: Tools and custom providers
summary: 工具配置（策略、实验性开关、提供商支持的工具）和自定义提供商/基础 URL 设置
title: 配置——工具和自定义提供商
x-i18n:
    generated_at: "2026-07-11T20:30:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91f392efc7ca08ddd18875625ed3c95d21c5c12f70396594f8dc8e88a20293fc
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` 配置键和自定义提供商 / 基础 URL 设置。有关智能体、渠道和其他顶层配置键，请参阅[配置参考](/zh-CN/gateway/configuration-reference)。

## 工具

### 工具配置方案

`tools.profile` 会在 `tools.allow`/`tools.deny` 之前设置基础允许列表：

<Note>
本地新手引导默认会在未设置时，将新的本地配置设为 `tools.profile: "coding"`（保留现有的显式配置方案）。
</Note>

| 配置方案    | 包含                                                                                                                                                                                                                         |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | 仅 `session_status`                                                                                                                                                                                                          |
| `coding`    | `group:fs`、`group:runtime`、`group:web`、`group:sessions`、`group:memory`、`cron`、`get_goal`、`create_goal`、`update_goal`、`update_plan`、`skill_workshop`、`image`、`image_generate`、`music_generate`、`video_generate` |
| `messaging` | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status`                                                                                                                                      |
| `full`      | 无限制（与未设置相同）                                                                                                                                                                                                       |

`coding` 和 `messaging` 还会隐式允许 `bundle-mcp`（已配置的 MCP 服务器）。

### 工具组

| 组                 | 工具                                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`、`process`、`code_execution`（接受 `bash` 作为 `exec` 的别名）                                                                                    |
| `group:fs`         | `read`、`write`、`edit`、`apply_patch`                                                                                                                  |
| `group:sessions`   | `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`sessions_yield`、`subagents`、`session_status`、`spawn_task`、`dismiss_task`     |
| `group:memory`     | `memory_search`、`memory_get`                                                                                                                           |
| `group:web`        | `web_search`、`x_search`、`web_fetch`                                                                                                                   |
| `group:ui`         | `browser`、`canvas`                                                                                                                                     |
| `group:automation` | `heartbeat_respond`、`cron`、`gateway`                                                                                                                  |
| `group:messaging`  | `message`                                                                                                                                               |
| `group:nodes`      | `nodes`、`computer`                                                                                                                                     |
| `group:agents`     | `agents_list`、`get_goal`、`create_goal`、`update_goal`、`update_plan`、`skill_workshop`                                                                 |
| `group:media`      | `image`、`image_generate`、`music_generate`、`video_generate`、`tts`                                                                                    |
| `group:openclaw`   | 上述所有内置工具，但不包括 `read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas`（不包括插件工具）                                                |
| `group:plugins`    | 已加载插件拥有的工具，包括通过 `bundle-mcp` 暴露的已配置 MCP 服务器                                                                                    |

`spawn_task` 让编码智能体可以提出经确认的后续工作，而无需立即启动。Control UI 会将标题和摘要显示为可操作的操作块；由 Gateway 网关支持的 TUI 会显示等效的交互式提示。接受任一种提示都会创建一个新的托管工作树会话，并将完整提示发送到该会话，同时当前轮次继续进行。`dismiss_task` 使用 `spawn_task` 返回的临时 `task_id` 撤回仍处于待处理状态的建议。

仅当发起操作的界面能够接收并处理 Gateway 网关任务建议事件时，才会提供这些工具。渠道会话和本地/嵌入式 TUI 会话不会接收这些事件；渠道传输需要一种可移植的类型化任务操作，才能安全地暴露此流程。建议仅存在于当前进程中，并会在 Gateway 网关重启时消失。这两个工具仍属于 `coding` 配置方案和 `group:sessions`，因此当界面支持它们时，常规的 `tools.allow` 和 `tools.deny` 策略会自动配置它们。

### 沙箱工具策略中的 MCP 和插件工具

已配置的 MCP 服务器会作为 `bundle-mcp` 插件 ID 下由插件拥有的工具公开。常规工具配置方案可以允许这些工具，但对于沙箱隔离的会话，`tools.sandbox.tools` 是一道额外的门控。如果沙箱模式为 `"all"` 或 `"non-main"`，当需要显示 MCP/插件工具时，请在沙箱工具允许列表中包含以下条目之一：

- 对于来自 `mcp.servers`、由 OpenClaw 管理的 MCP 服务器，使用 `bundle-mcp`
- 对于特定原生插件，使用该插件 ID
- 对于所有已加载且由插件拥有的工具，使用 `group:plugins`
- 如果只需要一个服务器，使用确切的 MCP 服务器工具名称或服务器通配模式，例如 `outlook__send_mail` 或 `outlook__*`

服务器通配模式使用对提供商安全的 MCP 服务器前缀，不一定是原始的 `mcp.servers` 键。非 `[A-Za-z0-9_-]` 字符会变为 `-`，不以字母开头的名称会添加 `mcp-` 前缀，过长或重复的前缀可能会被截断或添加后缀；例如，`mcp.servers["Outlook Graph"]` 使用类似 `outlook-graph__*` 的通配模式。

```json5
{
  agents: { defaults: { sandbox: { mode: "all" } } },
  mcp: {
    servers: {
      outlook: { command: "node", args: ["./outlook-mcp.js"] },
    },
  },
  tools: {
    sandbox: {
      tools: {
        alsoAllow: ["web_search", "web_fetch", "memory_search", "memory_get", "bundle-mcp"],
      },
    },
  },
}
```

如果缺少该沙箱层条目，MCP 服务器仍可成功加载，但其工具会在提供商请求之前被过滤。使用 `openclaw doctor` 可以发现 `mcp.servers` 中由 OpenClaw 管理的服务器存在这种配置问题。从内置插件清单或 Claude `.mcp.json` 加载的 MCP 服务器使用相同的沙箱门控，但此诊断目前尚未列举这些来源；如果它们的工具在沙箱隔离的轮次中消失，请使用相同的允许列表条目。

### `tools.codeMode`

`tools.codeMode` 启用通用的 OpenClaw 代码模式界面。当在带工具的运行中启用时，常规 OpenClaw 工具会移至沙箱内的 `tools.*` 目录桥接层之后，而 MCP 工具可通过生成的 `MCP` 命名空间使用。模型通常会看到 `exec` 和 `wait`；像 `computer` 这样结构化结果无法通过仅限 JSON 的桥接层传递的工具则保持直接提供。

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

也接受简写形式：

```json5
{
  tools: { codeMode: true },
}
```

在代码模式下，MCP 声明通过只读虚拟 API 文件界面公开。访客代码可以调用 `API.list("mcp")` 和 `API.read("mcp/<server>.d.ts")`，在调用 `MCP.<server>.<tool>()` 之前检查 TypeScript 风格的签名。有关运行时契约、限制和调试步骤，请参阅[代码模式](/zh-CN/reference/code-mode)。

### `tools.allow` / `tools.deny`

全局工具允许/拒绝策略（拒绝优先）。不区分大小写，支持 `*` 通配符。即使 Docker 沙箱已关闭也会应用。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` 和 `apply_patch` 是不同的工具 ID。对于兼容的模型，`allow: ["write"]` 也会启用 `apply_patch`，但 `deny: ["write"]` 不会拒绝 `apply_patch`。要阻止所有文件修改，请拒绝 `group:fs`，或明确列出每个修改类工具：

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

<Note>
不能在同一作用域（`tools`、`tools.byProvider.<id>`、`agents.list[].tools`）中同时设置 `allow` 和 `alsoAllow`，否则配置验证会拒绝该配置。请将 `alsoAllow` 条目合并到 `allow` 中，或移除 `allow`，改用 `profile` + `alsoAllow`。
</Note>

### `tools.byProvider`

进一步限制特定提供商或模型可用的工具。顺序：基础配置档 → 提供商配置档 → 允许/拒绝。

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.toolsBySender`

限制特定请求者身份可用的工具。这是在渠道访问控制之上的纵深防御；发送者值必须来自渠道适配器，而不是消息文本。

```json5
{
  tools: {
    toolsBySender: {
      "channel:discord:1234567890123": { alsoAllow: ["group:fs"] },
      "id:guest-user-id": { deny: ["group:runtime", "group:fs"] },
      "*": { deny: ["exec", "process", "write", "edit", "apply_patch"] },
    },
  },
}
```

键使用显式前缀：`channel:<channelId>:<senderId>`、`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>` 或 `"*"`。渠道 ID 是 OpenClaw 的规范 ID；`teams` 等别名会规范化为 `msteams`。旧版无前缀键仅按 `id:` 接受。匹配顺序依次为渠道 + ID、ID、E.164、用户名、名称，最后是通配符。

当按 Agent 配置的 `agents.list[].tools.toolsBySender` 匹配时，它会覆盖全局发送者匹配，即使策略为空 `{}` 也是如此。

### `tools.elevated`

控制沙箱外提升权限的 Exec 访问：

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- 按 Agent 配置的覆盖项（`agents.list[].tools.elevated`）只能进一步收紧限制。
- `/elevated on|off|ask|full` 按会话存储状态；内联指令仅应用于单条消息。
- 提升权限的 `exec` 会绕过沙箱隔离，并使用配置的逃逸路径（默认为 `gateway`；当 Exec 目标为 `node` 时则为 `node`）。

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      approvalRunningNoticeMs: 10000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: true,
        allowModels: ["gpt-5.6-sol"],
      },
    },
  },
}
```

除 `applyPatch.allowModels` 外，所示值均为默认值（该项默认未设置或为空，表示任何兼容模型都可以使用 `apply_patch`）。当需审批的 Exec 长时间运行时，`approvalRunningNoticeMs` 会发出运行中通知；设为 `0` 可禁用该通知。

### `tools.loopDetection`

工具循环安全检查**默认禁用**。设置 `enabled: true` 可启用检测。可在 `tools.loopDetection` 中定义全局设置，并可在 `agents.list[].tools.loopDetection` 中按 Agent 覆盖。

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      unknownToolThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  为循环分析保留的工具调用历史记录上限。
</ParamField>
<ParamField path="warningThreshold" type="number">
  对重复且无进展的模式发出警告的阈值。
</ParamField>
<ParamField path="unknownToolThreshold" type="number">
  对同一个不可用或未知工具名称的调用连续失败达到此次数后，阻止继续重复调用。
</ParamField>
<ParamField path="criticalThreshold" type="number">
  用于阻止严重循环的更高重复阈值。
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  任何无进展运行的强制停止阈值。
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  对重复使用相同工具和相同参数的调用发出警告。
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  对已知轮询工具（`process.poll`、`command_status` 等）的无进展调用发出警告或予以阻止。
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  对交替出现且无进展的成对模式发出警告或予以阻止。
</ParamField>
<ParamField path="postCompactionGuard.windowSize" type="number">
  自动压缩后防护机制保持启用的尝试次数；如果智能体在此窗口内重复相同的（工具、参数、结果），则中止运行。
</ParamField>

<Warning>
如果 `warningThreshold >= criticalThreshold` 或 `criticalThreshold >= globalCircuitBreakerThreshold`，验证将失败。
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env (Brave provider)
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 20000,
        maxCharsCap: 20000,
        maxResponseBytes: 750000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

除 `provider` 和 `userAgent` 外，显示的值均为默认值。`maxResponseBytes` 会限制在 32000–10000000 之间；`maxChars` 会限制为不超过 `maxCharsCap`（可提高 `maxCharsCap` 以允许更大的响应）。

### `tools.media`

配置入站媒体理解（图像、音频和视频）：

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // deprecated: completions stay agent-mediated
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      image: {
        enabled: true,
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "gemma4:26b", timeoutSeconds: 300 }],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

这里按默认值显示了 `concurrency`（默认值为 `2`）、`audio.maxBytes`（默认值为 20 MB）和 `video.maxBytes`（默认值为 50 MB）；`image.maxBytes` 的默认值为 10 MB。各能力的请求超时默认值：图像和音频为 `60` 秒，视频为 `120` 秒。

<AccordionGroup>
  <Accordion title="Media model entry fields">
    **提供商条目**（`type: "provider"` 或省略）：

    - `provider`：API 提供商 ID（`openai`、`anthropic`、`google`/`gemini`、`groq` 等）
    - `model`：模型 ID 覆盖值
    - `profile` / `preferredProfile`：选择 `auth-profiles.json` 配置文件

    **CLI 条目**（`type: "cli"`）：

    - `command`：要运行的可执行文件
    - `args`：模板化参数（支持 `{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` 等；`openclaw doctor --fix` 会将已弃用的 `{input}` 占位符迁移为 `{{MediaPath}}`）

    **通用字段：**

    - `capabilities`：可选列表（`image`、`audio`、`video`）。每个提供商插件都会声明自己的默认能力集；例如，内置的 `openai` 提供商默认为图像和音频，`anthropic`/`minimax` 默认为图像，`google` 默认为图像、音频和视频，而 `groq` 默认为音频。
    - `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`：各条目的覆盖值。
    - 当智能体显式调用 `image` 工具时，`tools.media.image.timeoutSeconds` 以及对应图像模型条目中的 `timeoutSeconds` 也会生效。对于图像理解，此超时适用于请求本身，不会因之前的准备工作而缩短。
    - 失败时会回退到下一个条目。

    提供商身份验证遵循标准顺序：`auth-profiles.json` → 环境变量 → `models.providers.*.apiKey`。

    **异步完成字段：**

    - `asyncCompletion.directSend`：已弃用的兼容性标志。已完成的异步媒体任务仍由请求方会话协调，以便智能体接收结果、决定如何告知用户，并在来源交付需要时使用消息工具。

  </Accordion>
</AccordionGroup>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

控制会话工具（`sessions_list`、`sessions_history`、`sessions_send`）可以将哪些会话作为目标。

默认值：`tree`（当前会话及其派生的会话，例如子智能体）。

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Visibility scopes">
    - `self`：仅限当前会话键。
    - `tree`：当前会话及由当前会话派生的会话（子智能体）。
    - `agent`：属于当前智能体 ID 的任何会话（如果你在同一个智能体 ID 下按发送者运行会话，可能包括其他用户）。
    - `all`：任何会话。以其他智能体为目标仍需要 `tools.agentToAgent`。
    - 沙箱限制：当当前会话处于沙箱隔离状态，并且 `agents.defaults.sandbox.sessionToolsVisibility="spawned"`（默认值）时，即使 `tools.sessions.visibility="all"`，可见性也会被强制设为 `tree`。
    - 当值不是 `all` 时，`sessions_list` 会包含一个简洁的 `visibility` 字段，
      用于说明实际生效的模式，并警告当前范围之外的某些会话可能会被
      省略。

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

控制 `sessions_spawn` 对内联附件的支持。

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Attachment notes">
    - 附件要求设置 `enabled: true`。
    - 子智能体附件会被写入子工作区的 `.openclaw/attachments/<uuid>/`，并带有 `.manifest.json`。
    - ACP 附件仅支持图像；通过相同的文件数量、单文件字节数和总字节数限制后，附件会以内联方式转发给 ACP 运行时。
    - 附件内容会自动从持久化的转录记录中删减。
    - Base64 输入会接受严格的字母表和填充检查，并在解码前执行大小防护。
    - 子智能体附件目录的文件权限为 `0700`，文件的权限为 `0600`。
    - 子智能体清理遵循 `cleanup` 策略：`delete` 始终删除附件；仅当 `retainOnSessionKeep: true` 时，`keep` 才会保留附件。

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

实验性内置工具标志。默认关闭，除非适用严格智能体式 GPT-5 自动启用规则。

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`：启用结构化的 `update_plan` 工具，用于跟踪非简单的多步骤工作。
- 默认值：`false`，除非针对使用 `openai` 提供商和 GPT-5 系列模型 ID 的运行，将 `agents.defaults.embeddedAgent.executionContract`（或按智能体设置的覆盖值）设为 `"strict-agentic"`（这也包括 OpenAI Codex CLI 运行，因为 Codex 身份验证和模型路由位于 `openai` 提供商下）。设为 `true` 可在此范围之外强制启用该工具；设为 `false` 则即使在严格智能体式 GPT-5 运行中也保持关闭。
- 启用后，系统提示词还会添加使用指导，使模型仅在实质性工作中使用该工具，并且最多只保留一个处于 `in_progress` 状态的步骤。

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        announceTimeoutMs: 120000,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`：所派生子智能体的默认模型。如果省略，子智能体会继承调用方的模型。
- `allowAgents`：当请求方智能体未设置自己的 `subagents.allowAgents` 时，`sessions_spawn` 可使用的已配置目标智能体 ID 默认允许列表（`["*"]` 表示任何已配置的目标；默认值：仅限同一个智能体）。如果某个条目对应的智能体配置已被删除，`sessions_spawn` 会拒绝该过期条目，并且 `agents_list` 会将其省略；运行 `openclaw doctor --fix` 可清理这些条目。
- `maxConcurrent`：并发子智能体运行的最大数量。默认值：`8`。
- `runTimeoutSeconds`：调用方未传入自己的覆盖值时，`sessions_spawn` 使用的超时时间（秒）。默认值：`0`（不超时）；上面显示的 `900` 是常见的选择性启用值，并非内置默认值。
- `announceTimeoutMs`：Gateway 网关 `agent` 公告交付尝试的单次调用超时时间（毫秒）。默认值：`120000`。临时性重试可能会使公告的总等待时间超过一次配置的超时时间。
- `archiveAfterMinutes`：子智能体会话完成后到自动归档前的分钟数。默认值：`60`；`0` 表示禁用自动归档。
- 每个子智能体的工具策略：`tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## 自定义提供商和基础 URL

提供商插件会发布自己的模型目录条目。可通过配置中的 `models.providers` 或 `~/.openclaw/agents/<agentId>/agent/models.json` 添加自定义提供商。

为自定义或本地提供商配置 `baseUrl`，同时也是针对模型 HTTP 请求的一项严格限定的网络信任决策：OpenClaw 允许该精确的 `scheme://host:port` 来源通过受保护的提取路径，而无须添加单独的配置选项，也不会信任其他私有来源。

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai | etc.
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="身份验证与合并优先级">
    - 对于自定义身份验证需求，请使用 `authHeader: true` + `headers`。
    - 使用 `OPENCLAW_AGENT_DIR` 覆盖智能体配置根目录。
    - 匹配提供商 ID 时的合并优先级：
      - 智能体 `models.json` 中的非空 `baseUrl` 值优先。
      - 仅当该提供商在当前配置/身份验证配置文件上下文中不由 SecretRef 管理时，智能体中的非空 `apiKey` 值才优先。
      - 由 SecretRef 管理的提供商 `apiKey` 值会根据来源标记刷新（环境变量引用使用 `ENV_VAR_NAME`，文件/exec 引用使用 `secretref-managed`），而不是持久化已解析的密钥。
      - 由 SecretRef 管理的提供商标头值会根据来源标记刷新（环境变量引用使用 `secretref-env:ENV_VAR_NAME`，文件/exec 引用使用 `secretref-managed`）。
      - 智能体中为空或缺失的 `apiKey`/`baseUrl` 会回退到配置中的 `models.providers`。
      - 对于匹配模型的 `contextWindow`/`maxTokens`：如果显式配置值存在且有效（正有限数），则该值优先；否则使用隐式/生成的目录值。
      - 匹配模型的 `contextTokens` 遵循相同的“显式值优先，否则使用隐式值”规则；使用它可以限制实际上下文，而无需更改原生模型元数据。
      - 提供商插件目录以生成的、归插件所有的目录分片形式存储在智能体的插件状态中。
      - 如果你希望配置完全重写 `models.json` 并跳过合并归插件所有的目录分片，请使用 `models.mode: "replace"`。
      - 标记的持久化以来源为准：标记取自当前有效的来源配置快照（解析前），而不是已解析的运行时密钥值。

  </Accordion>
</AccordionGroup>

### 提供商字段详情

<AccordionGroup>
  <Accordion title="顶层目录">
    - `models.mode`：提供商目录行为（`merge` 或 `replace`）。
    - `models.providers`：以提供商 ID 为键的自定义提供商映射。
      - 安全编辑：对于增量更新，请使用 `openclaw config set models.providers.<id> '<json>' --strict-json --merge` 或 `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge`。除非传入 `--replace`，否则 `config set` 会拒绝破坏性替换。

  </Accordion>
  <Accordion title="提供商连接与身份验证">
    - `models.providers.*.api`：请求适配器（`openai-completions`、`openai-responses`、`openai-chatgpt-responses`、`anthropic-messages`、`google-generative-ai`、`google-vertex`、`github-copilot`、`bedrock-converse-stream`、`ollama`、`azure-openai-responses`）。对于 MLX、vLLM、SGLang 以及大多数兼容 OpenAI 的本地服务器等自托管 `/v1/chat/completions` 后端，请使用 `openai-completions`。具有 `baseUrl` 但未设置 `api` 的自定义提供商默认使用 `openai-completions`；仅当后端支持 `/v1/responses` 时才设置 `openai-responses`。
    - `models.providers.*.apiKey`：提供商凭证（优先使用 SecretRef/环境变量替换）。
    - `models.providers.*.auth`：身份验证策略（`api-key`、`token`、`oauth`、`aws-sdk`）。
    - `models.providers.*.contextWindow`：当模型条目未设置 `contextWindow` 时，此提供商下模型的默认原生上下文窗口。
    - `models.providers.*.contextTokens`：当模型条目未设置 `contextTokens` 时，此提供商下模型的默认实际运行时上下文上限。
    - `models.providers.*.maxTokens`：当模型条目未设置 `maxTokens` 时，此提供商下模型的默认输出令牌上限。
    - `models.providers.*.timeoutSeconds`：可选的按提供商模型 HTTP 请求超时时间（秒），涵盖连接、标头、正文和整个请求的中止处理。
    - `models.providers.*.injectNumCtxForOpenAICompat`：对于 Ollama + `openai-completions`，向请求中注入 `options.num_ctx`（默认值：`true`）。
    - `models.providers.*.authHeader`：在需要时强制通过 `Authorization` 标头传输凭证。
    - `models.providers.*.baseUrl`：上游 API 基础 URL。
    - `models.providers.*.headers`：用于代理/租户路由的额外静态标头。

  </Accordion>
  <Accordion title="请求传输覆盖">
    `models.providers.*.request`：模型提供商 HTTP 请求的传输覆盖配置。

    - `request.headers`：额外标头（与提供商默认值合并）。值支持 SecretRef。
    - `request.auth`：身份验证策略覆盖。模式：`"provider-default"`（使用提供商内置的身份验证）、`"authorization-bearer"`（配合 `token`）、`"header"`（配合 `headerName`、`value` 和可选的 `prefix`）。
    - `request.proxy`：HTTP 代理覆盖。模式：`"env-proxy"`（使用 `HTTP_PROXY`/`HTTPS_PROXY` 环境变量）、`"explicit-proxy"`（配合 `url`）。两种模式都接受可选的 `tls` 子对象。
    - `request.tls`：直接连接的 TLS 覆盖配置。字段：`ca`、`cert`、`key`、`passphrase`（均支持 SecretRef）、`serverName`、`insecureSkipVerify`。
    - `request.allowPrivateNetwork`：设为 `true` 时，允许模型提供商 HTTP 请求通过提供商 HTTP 获取防护访问私有、CGNAT 或类似地址范围。自定义/本地提供商的基础 URL 已默认信任精确配置的源，但元数据/链路本地源除外；这些源在未明确选择启用时仍会被阻止。将此项设为 `false` 可停用精确源信任。WebSocket 使用相同的 `request` 配置处理标头/TLS，但不受该获取操作的 SSRF 防护限制。默认值为 `false`。

  </Accordion>
  <Accordion title="模型目录条目">
    - `models.providers.*.models`：显式提供商模型目录条目。
    - `models.providers.*.models.*.input`：模型输入模态。纯文本模型使用 `["text"]`，原生图像/视觉模型使用 `["text", "image"]`。仅当所选模型标记为支持图像时，图像附件才会注入智能体轮次。
    - `models.providers.*.models.*.contextWindow`：原生模型上下文窗口元数据。它会覆盖该模型的提供商级 `contextWindow`。
    - `models.providers.*.models.*.contextTokens`：可选的运行时上下文上限。它会覆盖提供商级 `contextTokens`；当你希望实际上下文预算小于模型的原生 `contextWindow` 时使用此项；当两个值不同时，`openclaw models list` 会同时显示它们。
    - `models.providers.*.models.*.compat.supportsDeveloperRole`：可选的兼容性提示。对于具有非空、非原生 `baseUrl`（主机不是 `api.openai.com`）的 `api: "openai-completions"`，OpenClaw 会在运行时强制将此项设为 `false`。`baseUrl` 为空或省略时会保留 OpenAI 的默认行为。
    - `models.providers.*.models.*.compat.requiresStringContent`：针对仅支持字符串的 OpenAI 兼容聊天端点的可选兼容性提示。设为 `true` 时，OpenClaw 会在发送请求前将纯文本 `messages[].content` 数组展平为普通字符串。
    - `models.providers.*.models.*.compat.strictMessageKeys`：针对严格的 OpenAI 兼容聊天端点的可选兼容性提示。设为 `true` 时，OpenClaw 会在发送请求前将传出的 Chat Completions 消息对象精简为 `role` 和 `content`。
    - `models.providers.*.models.*.compat.thinkingFormat`：可选的思考载荷提示。对于 Together 风格的 `reasoning.enabled`，使用 `"together"`；对于顶层 `enable_thinking`，使用 `"qwen"`；对于 Qwen 系列且兼容 OpenAI、支持请求级聊天模板关键字参数的服务器（如 vLLM）上的 `chat_template_kwargs.enable_thinking`，使用 `"qwen-chat-template"`。配置的 vLLM Qwen 模型会为这些格式提供二元 `/think` 选项（`off`、`on`）。
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`：针对 DeepSeek 风格 Chat Completions 后端的可选兼容性提示，这类后端要求重放时先前的智能体助手消息保留 `reasoning_content`。设为 `true` 时，OpenClaw 会在传出的智能体助手消息中保留该字段。连接自定义的 DeepSeek 兼容代理时，如果该代理会拒绝移除了推理内容的请求，请使用此项。默认值为 `false`。

  </Accordion>
  <Accordion title="Amazon Bedrock 自动发现">
    - `plugins.entries.amazon-bedrock.config.discovery`：Bedrock 自动发现设置根节点。
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`：开启/关闭隐式发现。
    - `plugins.entries.amazon-bedrock.config.discovery.region`：用于发现的 AWS 区域。
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`：用于定向发现的可选提供商 ID 筛选器。
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`：发现刷新的轮询间隔。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`：已发现模型的后备上下文窗口。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`：已发现模型的后备最大输出令牌数。

  </Accordion>
</AccordionGroup>

交互式自定义提供商新手引导会根据已知的视觉模型 ID 模式推断图像输入支持，包括 GPT-4o/GPT-4.1/GPT-5+、`o1`/`o3`/`o4` 推理系列、Claude、Gemini、任何以 `-vl` 结尾的 ID（Qwen-VL 及类似模型），以及 LLaVA、Pixtral、InternVL、Mllama、MiniCPM-V 和 GLM-4V 等具名系列；对于已知的纯文本系列（Llama、DeepSeek、Mistral/Mixtral、Kimi/Moonshot、Codestral、Devstral、Phi、QwQ、CodeLlama，以及不带 vl/vision 后缀的纯 Qwen ID），它会跳过额外询问。对于未知模型 ID，仍会询问是否支持图像。非交互式新手引导使用相同的推断机制；传入 `--custom-image-input` 可强制使用支持图像的元数据，传入 `--custom-text-input` 可强制使用纯文本元数据。

### 提供商示例

<AccordionGroup>
  <Accordion title="Cerebras（GLM 4.7 / GPT OSS）">
    官方外部 `cerebras` 提供商插件可通过 `openclaw onboard --auth-choice cerebras-api-key` 完成配置。仅在需要覆盖默认值时才使用显式提供商配置。

    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/gpt-oss-120b"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/gpt-oss-120b": { alias: "GPT OSS 120B (Cerebras)" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          cerebras: {
            baseUrl: "https://api.cerebras.ai/v1",
            apiKey: "${CEREBRAS_API_KEY}",
            api: "openai-completions",
            models: [
              { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
              { id: "gpt-oss-120b", name: "GPT OSS 120B (Cerebras)" },
            ],
          },
        },
      },
    }
    ```

    使用 `cerebras/zai-glm-4.7` 可通过 Cerebras 使用该模型；使用 `zai/glm-4.7` 可直接通过 Z.AI 使用。

  </Accordion>
  <Accordion title="Kimi Coding">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: { "kimi/kimi-for-coding": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    兼容 Anthropic 的内置提供商。快捷方式：`openclaw onboard --auth-choice kimi-code-api-key`。

  </Accordion>
  <Accordion title="本地模型（LM Studio）">
    请参阅[本地模型](/zh-CN/gateway/local-models)。简而言之：在高性能硬件上通过 LM Studio Responses API 运行大型本地模型；同时合并托管模型以供回退。
  </Accordion>
  <Accordion title="MiniMax M3（直连）">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "Minimax" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    设置 `MINIMAX_API_KEY`。快捷方式：`openclaw onboard --auth-choice minimax-global-api` 或 `openclaw onboard --auth-choice minimax-cn-api`。模型目录默认使用 M3，同时也包含 M2.7 变体。在 Anthropic 兼容的流式传输路径上，除非你自行显式设置 `thinking`，否则 OpenClaw 默认禁用 MiniMax M2.x 的思考功能；MiniMax-M3（以及 M3.x）默认保持提供商的省略式/自适应思考路径。`/fast on` 或 `params.fastMode: true` 会将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。

  </Accordion>
  <Accordion title="Moonshot AI（Kimi）">
    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
            ],
          },
        },
      },
    }
    ```

    对于中国区端点，请使用 `baseUrl: "https://api.moonshot.cn/v1"` 或 `openclaw onboard --auth-choice moonshot-api-key-cn`。

    Moonshot 原生端点会声明其在共享 `openai-completions` 传输协议上兼容流式用量信息，OpenClaw 会根据端点能力而不是仅根据内置提供商 ID 启用该功能。

  </Accordion>
  <Accordion title="OpenCode">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "opencode/claude-opus-4-6" },
          models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
        },
      },
    }
    ```

    设置 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`）。Zen 目录使用 `opencode/...` 引用，Go 目录使用 `opencode-go/...` 引用。快捷方式：`openclaw onboard --auth-choice opencode-zen` 或 `openclaw onboard --auth-choice opencode-go`。

  </Accordion>
  <Accordion title="Synthetic（Anthropic 兼容）">
    ```json5
    {
      env: { SYNTHETIC_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
          models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          synthetic: {
            baseUrl: "https://api.synthetic.new/anthropic",
            apiKey: "${SYNTHETIC_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "hf:MiniMaxAI/MiniMax-M2.5",
                name: "MiniMax M2.5",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 192000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```

    基础 URL 应省略 `/v1`（Anthropic 客户端会自动附加它）。快捷方式：`openclaw onboard --auth-choice synthetic-api-key`。

  </Accordion>
  <Accordion title="Z.AI（GLM-4.7）">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-4.7" },
          models: { "zai/glm-4.7": {} },
        },
      },
    }
    ```

    设置 `ZAI_API_KEY`。模型引用使用规范的 `zai/*` 提供商 ID。快捷方式：`openclaw onboard --auth-choice zai-api-key`。

    - 通用端点：`https://api.z.ai/api/paas/v4`
    - 编程端点：`https://api.z.ai/api/coding/paas/v4`
    - 默认的 `zai-api-key` 身份验证选项会探测你的密钥并自动检测其所属端点（如果检测结果不确定，则回退到提示，默认选择全球端点）。此外还提供专用的中国区和编程套餐身份验证选项，供你显式选择。
    - 对于通用端点，请定义自定义提供商并覆盖基础 URL。

  </Accordion>
</AccordionGroup>

---

## 相关内容

- [配置 — 智能体](/zh-CN/gateway/config-agents)
- [配置 — 渠道](/zh-CN/gateway/config-channels)
- [配置参考](/zh-CN/gateway/configuration-reference) — 其他顶层键
- [工具和插件](/zh-CN/tools)

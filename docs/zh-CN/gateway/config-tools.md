---
read_when:
    - 配置 `tools.*` 策略、允许列表或实验性功能
    - 注册自定义提供商或覆盖基础 URL
    - 设置 OpenAI 兼容的自托管端点
sidebarTitle: Tools and custom providers
summary: 工具配置（策略、实验性开关、由提供商支持的工具）和自定义提供商/基础 URL 设置
title: 配置 — 工具和自定义提供商
x-i18n:
    generated_at: "2026-07-12T14:27:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 91f392efc7ca08ddd18875625ed3c95d21c5c12f70396594f8dc8e88a20293fc
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` 配置键以及自定义提供商 / 基础 URL 设置。有关智能体、渠道和其他顶层配置键，请参阅[配置参考](/zh-CN/gateway/configuration-reference)。

## 工具

### 工具配置文件

`tools.profile` 会在 `tools.allow`/`tools.deny` 之前设置基础允许列表：

<Note>
本地新手引导会在未设置时将新的本地配置默认为 `tools.profile: "coding"`（保留现有的显式配置文件）。
</Note>

| 配置文件    | 包含                                                                                                                                                                                                                         |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | 仅 `session_status`                                                                                                                                                                                                          |
| `coding`    | `group:fs`、`group:runtime`、`group:web`、`group:sessions`、`group:memory`、`cron`、`get_goal`、`create_goal`、`update_goal`、`update_plan`、`skill_workshop`、`image`、`image_generate`、`music_generate`、`video_generate` |
| `messaging` | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status`                                                                                                                                     |
| `full`      | 无限制（与未设置相同）                                                                                                                                                                                                       |

`coding` 和 `messaging` 还会隐式允许 `bundle-mcp`（已配置的 MCP 服务器）。

### 工具组

| 组                 | 工具                                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`、`process`、`code_execution`（接受 `bash` 作为 `exec` 的别名）                                                                                   |
| `group:fs`         | `read`、`write`、`edit`、`apply_patch`                                                                                                                  |
| `group:sessions`   | `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`sessions_yield`、`subagents`、`session_status`、`spawn_task`、`dismiss_task` |
| `group:memory`     | `memory_search`、`memory_get`                                                                                                                           |
| `group:web`        | `web_search`、`x_search`、`web_fetch`                                                                                                                   |
| `group:ui`         | `browser`、`canvas`                                                                                                                                     |
| `group:automation` | `heartbeat_respond`、`cron`、`gateway`                                                                                                                  |
| `group:messaging`  | `message`                                                                                                                                               |
| `group:nodes`      | `nodes`、`computer`                                                                                                                                     |
| `group:agents`     | `agents_list`、`get_goal`、`create_goal`、`update_goal`、`update_plan`、`skill_workshop`                                                                |
| `group:media`      | `image`、`image_generate`、`music_generate`、`video_generate`、`tts`                                                                                    |
| `group:openclaw`   | 上述所有内置工具，但不包括 `read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas`（不包括插件工具）                                               |
| `group:plugins`    | 已加载插件拥有的工具，包括通过 `bundle-mcp` 公开的已配置 MCP 服务器                                                                                    |

`spawn_task` 允许编码智能体提出经确认的后续工作，而不立即启动它。Control UI 将标题和摘要显示为可操作的标签；由 Gateway 网关支持的 TUI 则显示等效的交互式提示。接受任一提示都会创建一个新的托管工作树会话，并将完整提示发送到该会话，同时当前轮次继续进行。`dismiss_task` 使用 `spawn_task` 返回的临时 `task_id` 撤回仍处于待处理状态的建议。

仅当发起操作的界面能够接收并处理 Gateway 网关任务建议事件时，才会提供这些工具。渠道会话和本地/嵌入式 TUI 会话不会接收这些事件；渠道传输需要一种可移植的类型化任务操作，才能安全地公开此流程。建议位于进程本地，并会在 Gateway 网关重启时消失。这两个工具仍包含在 `coding` 配置文件和 `group:sessions` 中，因此，当界面支持它们时，常规 `tools.allow` 和 `tools.deny` 策略会自动对其进行配置。

### 沙箱工具策略中的 MCP 和插件工具

已配置的 MCP 服务器会以 `bundle-mcp` 插件 ID 下由插件拥有的工具形式公开。常规工具配置文件可以允许这些工具，但对于沙箱隔离的会话，`tools.sandbox.tools` 是一道额外的门控。如果沙箱模式为 `"all"` 或 `"non-main"`，当 MCP/插件工具应可见时，请在沙箱工具允许列表中加入以下条目之一：

- 对于来自 `mcp.servers`、由 OpenClaw 管理的 MCP 服务器，使用 `bundle-mcp`
- 对于特定原生插件，使用其插件 ID
- 对于所有已加载且由插件拥有的工具，使用 `group:plugins`
- 如果只需要一个服务器，则使用确切的 MCP 服务器工具名称或服务器 glob，例如 `outlook__send_mail` 或 `outlook__*`

服务器 glob 使用对提供商安全的 MCP 服务器前缀，不一定是原始的 `mcp.servers` 键。非 `[A-Za-z0-9_-]` 字符会变为 `-`，不以字母开头的名称会添加 `mcp-` 前缀，过长或重复的前缀可能会被截断或添加后缀；例如，`mcp.servers["Outlook Graph"]` 使用类似 `outlook-graph__*` 的 glob。

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

如果没有该沙箱层条目，MCP 服务器仍可成功加载，但其工具会在提供商请求之前被过滤掉。使用 `openclaw doctor` 可发现 `mcp.servers` 中由 OpenClaw 管理的服务器存在的这种配置情况。从内置插件清单或 Claude `.mcp.json` 加载的 MCP 服务器使用相同的沙箱门控，但此诊断目前尚未枚举这些来源；如果它们的工具在沙箱隔离的轮次中消失，请使用相同的允许列表条目。

### `tools.codeMode`

`tools.codeMode` 启用通用 OpenClaw 代码模式界面。为带有工具的运行启用后，常规 OpenClaw 工具会移至沙箱内的 `tools.*` 目录桥接之后，而 MCP 工具则可通过生成的 `MCP` 命名空间使用。模型通常会看到 `exec` 和 `wait`；像 `computer` 这样结构化结果无法通过仅支持 JSON 的桥接传递的工具仍保持直接提供。

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

全局工具允许/拒绝策略（拒绝优先）。不区分大小写，支持 `*` 通配符。即使 Docker 沙箱已关闭，该策略仍会应用。

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

进一步限制特定提供商或模型可使用的工具。顺序：基础配置文件 → 提供商配置文件 → 允许/拒绝。

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

限制特定请求者身份可使用的工具。这是在渠道访问控制之上实施的纵深防御；发送者值必须来自渠道适配器，而不能来自消息文本。

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

键使用显式前缀：`channel:<channelId>:<senderId>`、`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>` 或 `"*"`。渠道 ID 是 OpenClaw 的规范 ID；`teams` 等别名会规范化为 `msteams`。仅接受旧版无前缀键作为 `id:`。匹配顺序依次为渠道 + ID、ID、e164、用户名、名称，最后是通配符。

如果每 Agent 的 `agents.list[].tools.toolsBySender` 匹配，即使其策略为空 `{}`，也会覆盖全局发送者匹配。

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

- 每 Agent 覆盖项（`agents.list[].tools.elevated`）只能进一步收紧限制。
- `/elevated on|off|ask|full` 按会话存储状态；内联指令仅应用于单条消息。
- 提升权限的 `exec` 会绕过沙箱隔离，并使用配置的逃逸路径（默认为 `gateway`；当 Exec 目标为 `node` 时则使用 `node`）。

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

除 `applyPatch.allowModels` 外，所示值均为默认值（默认情况下为空或未设置，这意味着任何兼容模型都可以使用 `apply_patch`）。当需审批支持的 Exec 运行时间较长时，`approvalRunningNoticeMs` 会发出运行中通知；设为 `0` 可禁用该通知。

### `tools.loopDetection`

工具循环安全检查**默认禁用**。设置 `enabled: true` 可启用检测。可以在 `tools.loopDetection` 中定义全局设置，也可以在每 Agent 的 `agents.list[].tools.loopDetection` 中覆盖这些设置。

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
  为循环分析保留的最大工具调用历史记录数。
</ParamField>
<ParamField path="warningThreshold" type="number">
  发出警告的无进展重复模式阈值。
</ParamField>
<ParamField path="unknownToolThreshold" type="number">
  对同一不可用或未知工具名称的调用连续失败达到此次数后，阻止继续重复调用。
</ParamField>
<ParamField path="criticalThreshold" type="number">
  用于阻止严重循环的更高重复阈值。
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  对任何无进展运行执行硬停止的阈值。
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  对使用相同工具和相同参数的重复调用发出警告。
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  对已知轮询工具（`process.poll`、`command_status` 等）的无进展调用发出警告或予以阻止。
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  对交替出现的无进展成对模式发出警告或予以阻止。
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
        apiKey: "brave_api_key", // 或 BRAVE_API_KEY 环境变量（Brave 提供商）
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // 可选；省略以自动检测
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

除 `provider` 和 `userAgent` 外，所示值均为默认值。`maxResponseBytes` 限制在 32000–10000000 之间；`maxChars` 受 `maxCharsCap` 限制（提高 `maxCharsCap` 可允许更大的响应）。

### `tools.media`

配置入站媒体理解（图像/音频/视频）：

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // 已弃用：完成结果仍由智能体中介
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

`concurrency`（默认值为 `2`）、`audio.maxBytes`（默认值为 20 MB）和 `video.maxBytes`（默认值为 50 MB）显示的是各自的默认值；`image.maxBytes` 的默认值为 10 MB。各能力的请求超时默认值：图像/音频为 `60` 秒，视频为 `120` 秒。

<AccordionGroup>
  <Accordion title="媒体模型条目字段">
    **提供商条目**（`type: "provider"` 或省略）：

    - `provider`：API 提供商 ID（`openai`、`anthropic`、`google`/`gemini`、`groq` 等）
    - `model`：模型 ID 覆盖值
    - `profile` / `preferredProfile`：选择 `auth-profiles.json` 配置文件

    **CLI 条目**（`type: "cli"`）：

    - `command`：要运行的可执行文件
    - `args`：模板化参数（支持 `{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` 等；`openclaw doctor --fix` 会将已弃用的 `{input}` 占位符迁移为 `{{MediaPath}}`）

    **通用字段：**

    - `capabilities`：可选列表（`image`、`audio`、`video`）。每个提供商插件声明自己的默认能力集；例如，内置 `openai` 提供商默认为图像和音频，`anthropic`/`minimax` 默认为图像，`google` 默认为图像、音频和视频，`groq` 默认为音频。
    - `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`：各条目的覆盖值。
    - 当智能体显式调用 `image` 工具时，`tools.media.image.timeoutSeconds` 和对应图像模型条目中的 `timeoutSeconds` 也适用。对于图像理解，此超时应用于请求本身，不会因之前的准备工作而缩短。
    - 失败时回退到下一个条目。

    提供商身份验证遵循标准顺序：`auth-profiles.json` → 环境变量 → `models.providers.*.apiKey`。

    **异步完成字段：**

    - `asyncCompletion.directSend`：已弃用的兼容性标志。已完成的异步媒体任务仍通过请求方会话中介，以便智能体接收结果、决定如何告知用户，并在源端交付需要时使用消息工具。

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

默认值：`tree`（当前会话及其生成的会话，例如子智能体）。

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
  <Accordion title="可见性范围">
    - `self`：仅当前会话键。
    - `tree`：当前会话及当前会话生成的会话（子智能体）。
    - `agent`：属于当前智能体 ID 的任何会话（如果你在同一智能体 ID 下按发送者运行会话，可能包括其他用户）。
    - `all`：任何会话。跨智能体指定目标仍需要 `tools.agentToAgent`。
    - 沙箱限制：当当前会话处于沙箱隔离状态，并且 `agents.defaults.sandbox.sessionToolsVisibility="spawned"`（默认值）时，即使 `tools.sessions.visibility="all"`，可见性也会被强制设为 `tree`。
    - 当值不是 `all` 时，`sessions_list` 会包含一个简洁的 `visibility` 字段，
      用于说明实际生效的模式，并警告当前范围之外的某些会话可能会被
      省略。

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

控制 `sessions_spawn` 的内联附件支持。

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // 选择启用：设为 true 以允许内联文件附件
        maxTotalBytes: 5242880, // 所有文件合计 5 MB
        maxFiles: 50,
        maxFileBytes: 1048576, // 每个文件 1 MB
        retainOnSessionKeep: false, // cleanup="keep" 时保留附件
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="附件说明">
    - 附件要求 `enabled: true`。
    - 子智能体附件会具体写入子工作区的 `.openclaw/attachments/<uuid>/`，并包含 `.manifest.json`。
    - ACP 附件仅支持图像；通过相同的文件数量、单文件字节数和总字节数限制后，会以内联方式转发给 ACP 运行时。
    - 附件内容会自动从持久化的转录记录中隐去。
    - Base64 输入会接受严格的字符表和填充验证，并在解码前执行大小保护检查。
    - 子智能体附件的文件权限为：目录 `0700`，文件 `0600`。
    - 子智能体清理遵循 `cleanup` 策略：`delete` 始终移除附件；仅当 `retainOnSessionKeep: true` 时，`keep` 才会保留附件。

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

实验性内置工具标志。默认关闭，除非适用 strict-agentic GPT-5 自动启用规则。

```json5
{
  tools: {
    experimental: {
      planTool: true, // 启用实验性的 update_plan
    },
  },
}
```

- `planTool`：启用结构化 `update_plan` 工具，用于跟踪非简单的多步骤工作。
- 默认值：`false`，除非对于使用 `openai` 提供商、面向 GPT-5 系列模型 ID 的运行，`agents.defaults.embeddedAgent.executionContract`（或按智能体设置的覆盖值）设为 `"strict-agentic"`（这也包括 OpenAI Codex CLI 运行，因为 Codex 身份验证和模型路由位于 `openai` 提供商下）。设为 `true` 可在该范围之外强制启用此工具；设为 `false` 可确保即使是 strict-agentic GPT-5 运行也保持关闭。
- 启用后，系统提示词还会添加使用指南，使模型仅将其用于实质性工作，并确保最多只有一个步骤为 `in_progress`。

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

- `model`：生成的子智能体所使用的默认模型。如果省略，子智能体会继承调用方的模型。
- `allowAgents`：当请求方智能体未设置自己的 `subagents.allowAgents` 时，`sessions_spawn` 可使用的已配置目标智能体 ID 的默认允许列表（`["*"]` = 任意已配置目标；默认：仅同一智能体）。已删除智能体配置所对应的过期条目会被 `sessions_spawn` 拒绝，并从 `agents_list` 中省略；运行 `openclaw doctor --fix` 可清理这些条目。
- `maxConcurrent`：子智能体同时运行的最大数量。默认值：`8`。
- `runTimeoutSeconds`：当调用方未传递自己的覆盖值时，`sessions_spawn` 的超时时间（秒）。默认值：`0`（无超时）；上面显示的 `900` 是常用的选择启用值，而非内置默认值。
- `announceTimeoutMs`：Gateway 网关 `agent` 公告交付尝试的单次调用超时时间（毫秒）。默认值：`120000`。临时性重试可能会使公告总等待时间超过一次配置的超时时间。
- `archiveAfterMinutes`：子智能体会话完成后到自动归档前的分钟数。默认值：`60`；`0` 禁用自动归档。
- 按子智能体配置的工具策略：`tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## 自定义提供商和基础 URL

提供商插件会发布自己的模型目录条目。通过配置中的 `models.providers` 或 `~/.openclaw/agents/<agentId>/agent/models.json` 添加自定义提供商。

配置自定义/本地提供商的 `baseUrl`，同时也是针对模型 HTTP 请求的严格网络信任决策：OpenClaw 允许该确切的 `scheme://host:port` 源通过受保护的获取路径，而无需添加单独的配置选项或信任其他私有源。

```json5
{
  models: {
    mode: "merge", // merge（默认）| replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai | 等
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
  <Accordion title="身份验证和合并优先级">
    - 如有自定义身份验证需求，请使用 `authHeader: true` + `headers`。
    - 使用 `OPENCLAW_AGENT_DIR` 覆盖智能体配置根目录。
    - 匹配提供商 ID 时的合并优先级：
      - 智能体 `models.json` 中的非空 `baseUrl` 值优先。
      - 仅当该提供商在当前配置/身份验证配置文件上下文中不由 SecretRef 管理时，智能体的非空 `apiKey` 值才优先。
      - 由 SecretRef 管理的提供商 `apiKey` 值会从来源标记刷新（环境变量引用使用 `ENV_VAR_NAME`，文件/exec 引用使用 `secretref-managed`），而不会持久化已解析的密钥。
      - 由 SecretRef 管理的提供商请求头值会从来源标记刷新（环境变量引用使用 `secretref-env:ENV_VAR_NAME`，文件/exec 引用使用 `secretref-managed`）。
      - 智能体中为空或缺失的 `apiKey`/`baseUrl` 会回退到配置中的 `models.providers`。
      - 对于匹配模型的 `contextWindow`/`maxTokens`：当显式配置值存在且有效（正有限数）时，该值优先；否则使用隐式/生成的目录值。
      - 匹配模型的 `contextTokens` 遵循相同的“显式优先，否则使用隐式值”规则；使用它可在不更改模型原生元数据的情况下限制有效上下文。
      - 提供商插件目录以生成的、归插件所有的目录分片形式存储在智能体的插件状态中。
      - 如果希望配置完全重写 `models.json` 并跳过合并归插件所有的目录分片，请使用 `models.mode: "replace"`。
      - 标记持久化以来源为准：标记从活动的来源配置快照（解析前）写入，而不是从已解析的运行时密钥值写入。

  </Accordion>
</AccordionGroup>

### 提供商字段详情

<AccordionGroup>
  <Accordion title="顶层目录">
    - `models.mode`：提供商目录行为（`merge` 或 `replace`）。
    - `models.providers`：以提供商 ID 为键的自定义提供商映射。
      - 安全编辑：对于增量更新，请使用 `openclaw config set models.providers.<id> '<json>' --strict-json --merge` 或 `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge`。除非传入 `--replace`，否则 `config set` 会拒绝破坏性替换。

  </Accordion>
  <Accordion title="提供商连接和身份验证">
    - `models.providers.*.api`：请求适配器（`openai-completions`、`openai-responses`、`openai-chatgpt-responses`、`anthropic-messages`、`google-generative-ai`、`google-vertex`、`github-copilot`、`bedrock-converse-stream`、`ollama`、`azure-openai-responses`）。对于 MLX、vLLM、SGLang 以及大多数兼容 OpenAI 的本地服务器等自托管 `/v1/chat/completions` 后端，请使用 `openai-completions`。具有 `baseUrl` 但没有 `api` 的自定义提供商默认使用 `openai-completions`；仅当后端支持 `/v1/responses` 时才设置 `openai-responses`。
    - `models.providers.*.apiKey`：提供商凭据（首选 SecretRef/环境变量替换）。
    - `models.providers.*.auth`：身份验证策略（`api-key`、`token`、`oauth`、`aws-sdk`）。
    - `models.providers.*.contextWindow`：当模型条目未设置 `contextWindow` 时，该提供商下模型的默认原生上下文窗口。
    - `models.providers.*.contextTokens`：当模型条目未设置 `contextTokens` 时，该提供商下模型的默认有效运行时上下文上限。
    - `models.providers.*.maxTokens`：当模型条目未设置 `maxTokens` 时，该提供商下模型的默认输出 token 上限。
    - `models.providers.*.timeoutSeconds`：可选的提供商级模型 HTTP 请求超时时间（秒），涵盖连接、请求头、正文和总请求中止处理。
    - `models.providers.*.injectNumCtxForOpenAICompat`：对于 Ollama + `openai-completions`，在请求中注入 `options.num_ctx`（默认值：`true`）。
    - `models.providers.*.authHeader`：需要时强制通过 `Authorization` 请求头传输凭据。
    - `models.providers.*.baseUrl`：上游 API 基础 URL。
    - `models.providers.*.headers`：用于代理/租户路由的额外静态请求头。

  </Accordion>
  <Accordion title="请求传输覆盖">
    `models.providers.*.request`：模型提供商 HTTP 请求的传输覆盖设置。

    - `request.headers`：额外请求头（与提供商默认值合并）。值支持 SecretRef。
    - `request.auth`：身份验证策略覆盖。模式：`"provider-default"`（使用提供商内置身份验证）、`"authorization-bearer"`（与 `token` 配合使用）、`"header"`（与 `headerName`、`value` 以及可选的 `prefix` 配合使用）。
    - `request.proxy`：HTTP 代理覆盖。模式：`"env-proxy"`（使用 `HTTP_PROXY`/`HTTPS_PROXY` 环境变量）、`"explicit-proxy"`（与 `url` 配合使用）。两种模式都支持可选的 `tls` 子对象。
    - `request.tls`：直接连接的 TLS 覆盖。字段：`ca`、`cert`、`key`、`passphrase`（均支持 SecretRef）、`serverName`、`insecureSkipVerify`。
    - `request.allowPrivateNetwork`：设为 `true` 时，允许模型提供商 HTTP 请求通过提供商 HTTP fetch 防护访问私有、CGNAT 或类似地址范围。自定义/本地提供商基础 URL 已默认信任精确配置的来源，但元数据/link-local 来源除外；若未明确选择启用，这些来源仍会被阻止。将其设为 `false` 可退出精确来源信任。WebSocket 对请求头/TLS 使用同一 `request`，但不使用该 fetch SSRF 防护。默认值为 `false`。

  </Accordion>
  <Accordion title="模型目录条目">
    - `models.providers.*.models`：显式的提供商模型目录条目。
    - `models.providers.*.models.*.input`：模型输入模态。纯文本模型使用 `["text"]`，原生图像/视觉模型使用 `["text", "image"]`。仅当所选模型被标记为支持图像时，图像附件才会注入智能体轮次。
    - `models.providers.*.models.*.contextWindow`：模型原生上下文窗口元数据。此值会覆盖该模型的提供商级 `contextWindow`。
    - `models.providers.*.models.*.contextTokens`：可选的运行时上下文上限。此值会覆盖提供商级 `contextTokens`；当你希望有效上下文预算小于模型原生 `contextWindow` 时使用它；当两个值不同时，`openclaw models list` 会同时显示它们。
    - `models.providers.*.models.*.compat.supportsDeveloperRole`：可选的兼容性提示。对于具有非空、非原生 `baseUrl`（主机不是 `api.openai.com`）的 `api: "openai-completions"`，OpenClaw 会在运行时强制将其设为 `false`。`baseUrl` 为空/省略时保留 OpenAI 默认行为。
    - `models.providers.*.models.*.compat.requiresStringContent`：用于仅支持字符串的 OpenAI 兼容聊天端点的可选兼容性提示。设为 `true` 时，OpenClaw 会在发送请求前将纯文本 `messages[].content` 数组扁平化为普通字符串。
    - `models.providers.*.models.*.compat.strictMessageKeys`：用于严格的 OpenAI 兼容聊天端点的可选兼容性提示。设为 `true` 时，OpenClaw 会在发送请求前将传出的 Chat Completions 消息对象精简为 `role` 和 `content`。
    - `models.providers.*.models.*.compat.thinkingFormat`：可选的思考负载提示。对于 Together 风格的 `reasoning.enabled` 使用 `"together"`，对于顶层 `enable_thinking` 使用 `"qwen"`，对于支持请求级聊天模板 kwargs 的 Qwen 系列 OpenAI 兼容服务器（例如 vLLM）上的 `chat_template_kwargs.enable_thinking` 使用 `"qwen-chat-template"`。已配置的 vLLM Qwen 模型会为这些格式提供二元 `/think` 选项（`off`、`on`）。
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`：用于 DeepSeek 风格 Chat Completions 后端的可选兼容性提示，这类后端要求重放时先前的助手消息保留 `reasoning_content`。设为 `true` 时，OpenClaw 会在传出的助手消息中保留该字段。连接自定义 DeepSeek 兼容代理时，如果该代理会拒绝推理内容被移除后的请求，请使用此项。默认值为 `false`。

  </Accordion>
  <Accordion title="Amazon Bedrock 设备发现">
    - `plugins.entries.amazon-bedrock.config.discovery`：Bedrock 自动发现设置根节点。
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`：开启/关闭隐式发现。
    - `plugins.entries.amazon-bedrock.config.discovery.region`：用于发现的 AWS 区域。
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`：用于定向发现的可选提供商 ID 筛选器。
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`：发现刷新的轮询间隔。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`：已发现模型的后备上下文窗口。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`：已发现模型的后备最大输出 token 数。

  </Accordion>
</AccordionGroup>

交互式自定义提供商新手引导会为已知的视觉模型 ID 模式推断图像输入，包括 GPT-4o/GPT-4.1/GPT-5+、`o1`/`o3`/`o4` 推理系列、Claude、Gemini、任何带 `-vl` 后缀的 ID（Qwen-VL 及类似模型），以及 LLaVA、Pixtral、InternVL、Mllama、MiniCPM-V 和 GLM-4V 等命名系列；对于已知的纯文本系列（Llama、DeepSeek、Mistral/Mixtral、Kimi/Moonshot、Codestral、Devstral、Phi、QwQ、CodeLlama，以及没有 vl/vision 后缀的纯 Qwen ID），它会跳过额外问题。对于未知模型 ID，仍会提示是否支持图像。非交互式新手引导使用相同的推断方式；传入 `--custom-image-input` 可强制使用支持图像的元数据，传入 `--custom-text-input` 可强制使用纯文本元数据。

### 提供商示例

<AccordionGroup>
  <Accordion title="Cerebras（GLM 4.7 / GPT OSS）">
    官方外部 `cerebras` 提供商插件可通过 `openclaw onboard --auth-choice cerebras-api-key` 进行配置。仅在覆盖默认值时使用显式提供商配置。

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

    Cerebras 请使用 `cerebras/zai-glm-4.7`；直接使用 Z.AI 请使用 `zai/glm-4.7`。

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
    请参阅[本地模型](/zh-CN/gateway/local-models)。简而言之：在高性能硬件上通过 LM Studio Responses API 运行大型本地模型；同时保留已合并的托管模型作为回退。
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

    设置 `MINIMAX_API_KEY`。快捷方式：`openclaw onboard --auth-choice minimax-global-api` 或 `openclaw onboard --auth-choice minimax-cn-api`。模型目录默认使用 M3，同时也包含 M2.7 变体。在 Anthropic 兼容的流式传输路径上，除非你自行明确设置 `thinking`，否则 OpenClaw 默认禁用 MiniMax M2.x 的思考功能；MiniMax-M3（以及 M3.x）默认继续使用提供商的省略式/自适应思考路径。`/fast on` 或 `params.fastMode: true` 会将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。

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

    Moonshot 原生端点会声明与共享 `openai-completions` 传输上的流式用量信息兼容，而 OpenClaw 会根据端点能力启用此功能，而不是仅依据内置提供商 ID。

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
  <Accordion title="Synthetic（兼容 Anthropic）">
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

    基础 URL 不应包含 `/v1`（Anthropic 客户端会自动附加该路径）。快捷方式：`openclaw onboard --auth-choice synthetic-api-key`。

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
    - 默认的 `zai-api-key` 身份验证选项会探测你的密钥，并自动检测其所属端点（如果检测结果不确定，则回退到提示，默认选择 Global）。此外还提供专用的 CN 和 Coding-Plan 身份验证选项，供你明确选择。
    - 对于通用端点，请定义自定义提供商并覆盖基础 URL。

  </Accordion>
</AccordionGroup>

---

## 相关内容

- [配置 — 智能体](/zh-CN/gateway/config-agents)
- [配置 — 渠道](/zh-CN/gateway/config-channels)
- [配置参考](/zh-CN/gateway/configuration-reference) — 其他顶层键
- [工具和插件](/zh-CN/tools)

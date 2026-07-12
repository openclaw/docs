---
read_when:
    - 通过 ACP 运行编程 harnesses
    - 在消息渠道上设置绑定到对话的 ACP 会话
    - 将消息渠道对话绑定到持久 ACP 会话
    - ACP 后端、插件接线或完成结果交付的故障排查
    - 在聊天中操作 `/acp` 命令
sidebarTitle: ACP agents
summary: 通过 ACP 后端运行外部编码工具框架（Claude Code、Cursor、Gemini CLI、显式 Codex ACP、OpenClaw ACP、OpenCode）
title: ACP 智能体
x-i18n:
    generated_at: "2026-07-11T20:59:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f5a5588710bea3027583bf06587706eb476d3ad1a31b0ef798586fcb895aa9
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 会话允许
OpenClaw 通过 ACP 后端插件运行外部编码执行框架（Claude Code、Cursor、Copilot、Droid、
OpenClaw ACP、OpenCode、Gemini CLI，以及其他受支持的 ACPX 执行框架）。
每次启动都会作为一个[后台任务](/zh-CN/automation/tasks)进行跟踪。

<Note>
**ACP 是外部执行框架路径，而不是默认的 Codex 路径。** 原生
Codex app-server 插件负责 `/codex ...` 控制，以及智能体轮次中默认的
`openai/gpt-*` 嵌入式运行时；ACP 负责 `/acp ...` 控制和
`sessions_spawn({ runtime: "acp" })` 会话。

如果要让 Codex 或 Claude Code 作为外部 MCP 客户端直接连接到
现有 OpenClaw 渠道对话，请使用
[`openclaw mcp serve`](/zh-CN/cli/mcp)，而不是 ACP。
</Note>

## 我应该阅读哪个页面？

| 你想要……                                                                                       | 使用                                  | 说明                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 在当前对话中绑定或控制 Codex                                                                    | `/codex bind`、`/codex threads`       | 启用 `codex` 插件时使用原生 Codex app-server 路径：绑定聊天回复、转发图像、模型/快速模式/权限、停止和 Steer。ACP 是显式回退方案 |
| _通过_ OpenClaw 运行 Claude Code、Gemini CLI、显式 Codex ACP 或其他外部执行框架                  | 本页面                                | 聊天绑定会话、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、后台任务、运行时控制                                                                                           |
| 将 OpenClaw Gateway 网关会话作为 ACP 服务器公开给编辑器或客户端                                 | [`openclaw acp`](/zh-CN/cli/acp)            | 桥接模式：IDE/客户端通过 stdio/WebSocket 使用 ACP 与 OpenClaw 通信                                                                                                             |
| 将本地 AI CLI 复用为纯文本回退模型                                                              | [CLI 后端](/zh-CN/gateway/cli-backends)     | 不是 ACP：没有 OpenClaw 工具、ACP 控制或执行框架运行时                                                                                                                         |

## 是否可以开箱即用？

可以，但需要先安装官方 ACP 运行时插件：

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

源代码检出在执行 `pnpm install` 后，可以使用本地 `extensions/acpx`
工作区插件。运行 `/acp doctor` 进行就绪检查。

只有当 ACP **确实可用**时，OpenClaw 才会向智能体说明如何启动 ACP：
必须启用 ACP、不得禁用分派、当前会话不得被沙箱阻止，并且必须已加载
且运行状况正常的运行时后端。如果任何条件不满足，ACP Skills 和
`sessions_spawn` 的 ACP 指引都会保持隐藏，从而避免智能体建议使用
不可用的后端。

<AccordionGroup>
  <Accordion title="首次运行注意事项">
    - 如果设置了 `plugins.allow`，它就是限制性插件清单，且**必须**包含 `acpx`，否则已安装的 ACP 后端会被有意阻止（`/acp doctor` 会报告缺少允许列表条目）。
    - Codex ACP 适配器随 `acpx` 插件一起提供，并会尽可能在本地启动。
    - Codex ACP 使用隔离的 `CODEX_HOME` 运行。OpenClaw 会从主机 Codex 配置中复制受信任项目的信任条目，以及安全的模型/提供商路由配置（`model`、`model_provider`、`model_reasoning_effort`、`sandbox_mode` 和安全的 `model_providers.<name>` 字段）；身份验证、通知和钩子仅保留在主机配置中。
    - 其他目标执行框架适配器可能会在首次使用时通过 `npx` 按需获取。
    - 该执行框架所需的供应商身份验证必须已存在于主机上。
    - 如果主机无法使用 npm 或访问网络，首次运行时获取适配器会失败，直到预热缓存或通过其他方式安装适配器。

  </Accordion>
  <Accordion title="运行时前提条件">
    ACP 会启动真实的外部执行框架进程。OpenClaw 负责路由、
    后台任务状态、投递、绑定和策略；执行框架负责其提供商登录、
    模型目录、文件系统行为和原生工具。

    在归咎于 OpenClaw 之前，请确认：

    - `/acp doctor` 报告后端已启用且运行状况正常。
    - 设置 `acp.allowedAgents` 允许列表后，目标 ID 位于其中。
    - 执行框架命令可以在 Gateway 网关主机上启动。
    - 该执行框架具备提供商身份验证（`claude`、`codex`、`gemini`、`opencode`、`droid` 等）。
    - 所选模型存在于该执行框架中——模型 ID 无法跨执行框架通用。
    - 请求的 `cwd` 存在且可访问；或者省略 `cwd`，让后端使用其默认值。
    - 权限模式与工作内容匹配。非交互式会话无法点击原生权限提示，因此涉及大量写入/执行操作的编码任务通常需要能够以无头方式继续运行的 ACPX 权限配置文件。

  </Accordion>
</AccordionGroup>

默认情况下，OpenClaw 插件工具和内置 OpenClaw 工具**不会**向 ACP
执行框架公开。仅当执行框架需要直接调用这些工具时，才在
[ACP 智能体 - 设置](/zh-CN/tools/acp-agents-setup)中启用显式 MCP 桥接。

## 支持的执行框架目标

使用 `acpx` 后端时，可以将以下 ID 用作 `/acp spawn <id>` 或
`sessions_spawn({ runtime: "acp", agentId: "<id>" })` 的目标：

| 执行框架 ID | 典型后端                                       | 说明                                                                                 |
| ------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `claude`     | Claude Code ACP 适配器                         | 要求主机上已配置 Claude Code 身份验证。                                               |
| `codex`      | Codex ACP 适配器                               | 仅在原生 `/codex` 不可用或明确请求 ACP 时，作为显式 ACP 回退方案。                    |
| `copilot`    | GitHub Copilot ACP 适配器                      | 要求 Copilot CLI/运行时身份验证。                                                     |
| `cursor`     | Cursor CLI ACP（`cursor-agent acp`）           | 如果本地安装公开了不同的 ACP 入口点，请覆盖 acpx 命令。                               |
| `droid`      | Factory Droid CLI                              | 要求 Factory/Droid 身份验证，或执行框架环境中存在 `FACTORY_API_KEY`。                 |
| `fast-agent` | fast-agent-mcp ACP 适配器                      | 通过 `uvx` 按需获取。                                                                |
| `gemini`     | Gemini CLI ACP 适配器                          | 要求 Gemini CLI 身份验证或 API 密钥设置。                                             |
| `iflow`      | iFlow CLI                                      | 适配器可用性和模型控制取决于已安装的 CLI。                                            |
| `kilocode`   | Kilo Code CLI                                  | 适配器可用性和模型控制取决于已安装的 CLI。                                            |
| `kimi`       | Kimi/Moonshot CLI                              | 要求主机上已配置 Kimi/Moonshot 身份验证。                                             |
| `kiro`       | Kiro CLI                                       | 适配器可用性和模型控制取决于已安装的 CLI。                                            |
| `mux`        | Mux CLI ACP 适配器                             | 通过 `npx` 按需获取。                                                                |
| `opencode`   | OpenCode ACP 适配器                            | 要求 OpenCode CLI/提供商身份验证。                                                    |
| `openclaw`   | 通过 `openclaw acp` 实现的 OpenClaw Gateway 网关桥接 | 允许支持 ACP 的执行框架与 OpenClaw Gateway 网关会话通信。                       |
| `qoder`      | Qoder CLI                                      | 适配器可用性和模型控制取决于已安装的 CLI。                                            |
| `qwen`       | Qwen Code / Qwen CLI                           | 要求主机上已配置兼容 Qwen 的身份验证。                                                |
| `trae`       | Trae CLI ACP 适配器                            | 适配器可用性和模型控制取决于已安装的 CLI。                                            |

`pi`（pi-acp）也已注册到 acpx 后端，但它与上述其他目标并不属于
同一意义上的编码执行框架。

可以在 acpx 本身中配置自定义 acpx 智能体别名，但在分派前，
OpenClaw 策略仍会检查 `acp.allowedAgents` 和任何
`agents.list[].runtime.acp.agent` 映射。

## 操作员运行手册

从聊天中快速使用 `/acp` 的流程：

<Steps>
  <Step title="启动">
    `/acp spawn claude --bind here`、
    `/acp spawn gemini --mode persistent --thread auto`，或显式使用
    `/acp spawn codex --bind here`。
  </Step>
  <Step title="工作">
    在绑定的对话或线程中继续操作（也可以显式指定会话键）。
  </Step>
  <Step title="检查状态">
    `/acp status`
  </Step>
  <Step title="调整">
    `/acp model <provider/model>`、`/acp permissions <profile>`、
    `/acp timeout <seconds>`。
  </Step>
  <Step title="Steer">
    在不替换上下文的情况下：`/acp steer tighten logging and continue`。
  </Step>
  <Step title="停止">
    `/acp cancel`（当前轮次）或 `/acp close`（会话 + 绑定）。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="生命周期详情">
    - 启动操作会创建或恢复 ACP 运行时会话，在 OpenClaw 会话存储中记录 ACP 元数据，并且当运行由父级拥有时，可能会创建后台任务。
    - 父级拥有的 ACP 会话即使使用持久运行时会话，也会被视为后台工作；完成通知和跨界面投递通过父任务通知器处理，而不是将其作为普通的面向用户的聊天会话处理。
    - 任务维护会关闭已终止或失去父级的父级拥有型一次性 ACP 会话。只要仍存在活动的对话绑定，持久 ACP 会话就会保留；不存在活动绑定的陈旧持久会话会被关闭，避免在所属任务完成或其任务记录消失后被静默恢复。
    - 绑定后的后续消息会直接发送到 ACP 会话，直到绑定被关闭、取消聚焦、重置或过期。
    - Gateway 网关命令保留在本地。`/acp ...`、`/status` 和 `/unfocus` 绝不会作为普通提示文本发送给绑定的 ACP 执行框架。
    - 当后端支持取消时，`cancel` 会中止活动轮次；它不会删除绑定或会话元数据。
    - 从 OpenClaw 的角度看，`close` 会结束 ACP 会话并移除绑定。如果执行框架支持恢复，它可能仍会保留自己的上游历史记录。
    - `close` 后，acpx 插件会清理由 OpenClaw 拥有的包装器和适配器进程树，并在 Gateway 网关启动期间回收由 OpenClaw 拥有的陈旧 ACPX 孤立进程。
    - 空闲运行时工作进程在经过 `acp.runtime.ttlMinutes` 后可以被清理；存储的会话元数据仍可供 `/acp sessions` 使用。

  </Accordion>
  <Accordion title="原生 Codex 路由规则">
    启用**原生 Codex 插件**后，以下自然语言触发语句应路由到该插件：

    - “将此 Discord 渠道绑定到 Codex。”
    - “将此聊天附加到 Codex 线程 `<id>`。”
    - “显示 Codex 线程，然后绑定此线程。”

    原生 Codex 对话绑定是默认的聊天控制路径。
    OpenClaw 动态工具仍通过 OpenClaw 执行，而 shell/apply-patch 等
    Codex 原生工具则在 Codex 内部执行。对于 Codex 原生工具事件，
    OpenClaw 会为每个轮次注入原生钩子中继，使插件钩子能够阻止
    `before_tool_call`、观察 `after_tool_call`，并通过 OpenClaw 审批路由
    Codex `PermissionRequest` 事件。Codex `Stop` 钩子会中继到 OpenClaw
    `before_agent_finalize`，插件可在 Codex 最终确定回答之前请求再执行一次
    模型轮次。该中继刻意保持保守：它不会修改 Codex 原生工具参数，
    也不会重写 Codex 线程记录。只有当你需要 ACP 运行时/会话模型时，
    才使用显式 ACP。嵌入式 Codex 的支持边界记录在
    [Codex harness v1 支持契约](/zh-CN/plugins/codex-harness-runtime#v1-support-contract)
    中。

  </Accordion>
  <Accordion title="模型/提供商/运行时选择速查表">
    - 旧版 Codex 模型引用 - 由 Doctor 修复的旧版 Codex OAuth/订阅模型路由。
    - `openai/*` - 用于 OpenAI 智能体轮次的原生 Codex app-server 嵌入式运行时。
    - `/codex ...` - 原生 Codex 对话控制。
    - `/acp ...` 或 `runtime: "acp"` - 显式 ACP/acpx 控制。

  </Accordion>
  <Accordion title="ACP 路由的自然语言触发语句">
    应路由到 ACP 运行时的触发语句：

    - “将此任务作为一次性 Claude Code ACP 会话运行，并总结结果。”
    - “在线程中使用 Gemini CLI 执行此任务，然后在同一线程中继续后续交互。”
    - “通过 ACP 在后台线程中运行 Codex。”

    OpenClaw 会选择 `runtime: "acp"`，解析 harness `agentId`，在支持时绑定到
    当前对话或线程，并将后续交互路由到该会话，直至会话关闭或过期。仅当
    明确指定 ACP/acpx，或原生 Codex 插件无法执行所请求的操作时，Codex
    才会采用此路径。

    对于 `sessions_spawn`，仅当 ACP 已启用、请求方未处于沙箱隔离状态，
    且已加载 ACP 运行时后端时，才会公布 `runtime: "acp"`。
    `acp.dispatch.enabled=false` 会暂停自动 ACP 线程分派，但不会隐藏或阻止
    显式 `sessions_spawn({ runtime: "acp" })` 调用。它以 `codex`、`claude`、
    `droid`、`gemini` 或 `opencode` 等 ACP harness ID 为目标。除非
    `agents_list` 中的普通 OpenClaw 配置智能体 ID 已通过
    `agents.list[].runtime.type="acp"` 明确配置，否则不要传递该 ID；
    应改用默认子智能体运行时。当 OpenClaw 智能体配置了
    `runtime.type="acp"` 时，OpenClaw 使用 `runtime.acp.agent` 作为底层
    harness ID。

  </Accordion>
</AccordionGroup>

## ACP 与子智能体对比

需要外部 harness 运行时时使用 ACP。启用 `codex` 插件后，需要进行 Codex
对话绑定/控制时使用**原生 Codex app-server**。需要 OpenClaw 原生委派运行时，
使用**子智能体**。

| 领域          | ACP 会话                              | 子智能体运行                         |
| ------------- | ------------------------------------- | ------------------------------------ |
| 运行时        | ACP 后端插件（例如 acpx）             | OpenClaw 原生子智能体运行时          |
| 会话键        | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`    |
| 主要命令      | `/acp ...`                            | `/subagents ...`                     |
| 生成工具      | 带有 `runtime:"acp"` 的 `sessions_spawn` | `sessions_spawn`（默认运行时）    |

另请参阅[子智能体](/zh-CN/tools/subagents)。

## ACP 如何运行 Claude Code

通过 ACP 运行 Claude Code 时，技术栈如下：

1. OpenClaw ACP 会话控制平面。
2. 官方 `@openclaw/acpx` 运行时插件。
3. Claude ACP 适配器。
4. Claude 侧运行时/会话机制。

ACP Claude 是一个带有 ACP 控制、会话恢复、后台任务跟踪以及可选
对话/线程绑定的 **harness 会话**。

CLI 后端是独立的纯文本本地回退运行时——请参阅
[CLI 后端](/zh-CN/gateway/cli-backends)。

对于操作员，实际规则如下：

- **需要 `/acp spawn`、可绑定会话、运行时控制或持久 harness 工作？** 使用 ACP。
- **需要通过原始 CLI 进行简单的本地文本回退？** 使用 CLI 后端。

## 已绑定会话

### 心智模型

- **聊天界面**——人们持续交流的位置（Discord 频道、Telegram 话题、iMessage 聊天）。
- **ACP 会话**——OpenClaw 路由到的持久 Codex/Claude/Gemini 运行时状态。
- **子线程/话题**——仅由 `--thread ...` 创建的可选额外消息界面。
- **运行时工作区**——harness 运行所在的文件系统位置（`cwd`、仓库检出、后端工作区）。它独立于聊天界面。

### 当前对话绑定

`/acp spawn <harness> --bind here` 将当前对话固定到生成的 ACP 会话——
不创建子线程，继续使用同一聊天界面。OpenClaw 仍负责传输、身份验证、
安全和交付。该对话中的后续消息会路由到同一会话；`/new` 和 `/reset`
会在原位置重置会话；`/acp close` 会移除绑定。

示例：

```text
/codex bind                                              # 原生 Codex 绑定，将后续消息路由到此处
/codex model gpt-5.4                                     # 调整已绑定的原生 Codex 线程
/codex stop                                              # 控制正在进行的原生 Codex 轮次
/acp spawn codex --bind here                             # Codex 的显式 ACP 回退
/acp spawn codex --thread auto                           # 可能创建子线程/话题并在其中绑定
/acp spawn codex --bind here --cwd /workspace/repo       # 保持同一聊天绑定，Codex 在 /workspace/repo 中运行
```

<AccordionGroup>
  <Accordion title="绑定规则和互斥性">
    - `--bind here` 与 `--thread ...` 互斥。
    - `--bind here` 仅适用于声明支持当前对话绑定的渠道；否则 OpenClaw 会返回清晰的不支持提示。绑定会在 Gateway 网关重启后继续保留。
    - 在 Discord 上，`spawnSessions` 控制 `--thread auto|here` 的子线程创建，而不控制 `--bind here`。
    - 如果你生成到另一个 ACP 智能体且未指定 `--cwd`，OpenClaw 默认继承**目标智能体的**工作区。继承的路径不存在（`ENOENT`/`ENOTDIR`）时，会回退到后端默认值；其他访问错误（例如 `EACCES`）则会作为生成错误显示。
    - 在已绑定对话中，Gateway 网关管理命令仍在本地处理——即使普通后续文本会路由到已绑定的 ACP 会话，`/acp ...` 命令仍由 OpenClaw 处理；只要该界面启用了命令处理，`/status` 和 `/unfocus` 也始终在本地处理。

  </Accordion>
  <Accordion title="线程绑定会话">
    为渠道适配器启用线程绑定后：

    - OpenClaw 将线程绑定到目标 ACP 会话。
    - 该线程中的后续消息会路由到已绑定的 ACP 会话。
    - ACP 输出会发送回同一线程。
    - 取消聚焦/关闭/归档/空闲超时或最长存续期过期会移除绑定。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status` 和 `/unfocus` 是 Gateway 网关命令，而不是发送给 ACP harness 的提示词。

    线程绑定 ACP 所需的功能标志：

    - `acp.enabled=true`
    - `acp.dispatch.enabled` 默认开启（设为 `false` 可暂停自动 ACP 线程分派；显式 `sessions_spawn({ runtime: "acp" })` 调用仍然有效）。
    - 启用渠道适配器的线程会话生成（默认值：`true`）：
      - Discord：`channels.discord.threadBindings.spawnSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnSessions=true`

    线程绑定支持因适配器而异。如果当前渠道适配器不支持线程绑定，
    OpenClaw 会返回清晰的不支持/不可用提示。

  </Accordion>
  <Accordion title="支持线程的渠道">
    - 任何公开会话/线程绑定能力的渠道适配器。
    - 当前内置支持：**Discord** 线程/频道、**Telegram** 话题（群组/超级群组中的论坛话题和私信话题）。
    - 渠道插件可通过相同的绑定接口添加支持。

  </Accordion>
</AccordionGroup>

## 持久渠道绑定

对于非临时工作流，请在顶层 `bindings[]` 条目中配置持久 ACP 绑定。

### 绑定模型

<ParamField path="bindings[].type" type='"acp"'>
  标记持久 ACP 对话绑定。
</ParamField>
<ParamField path="bindings[].match" type="object">
  标识目标对话。各渠道的形式如下：

- **Discord 频道/线程：** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack 频道/私信：** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`。优先使用稳定的 Slack ID；频道绑定也会匹配该频道线程中的回复。
- **Telegram 论坛话题：** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **WhatsApp 私信/群组：** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`。直接聊天使用 `+15555550123` 等 E.164 号码，群组使用 `120363424282127706@g.us` 等 WhatsApp 群组 JID。
- **iMessage 私信/群组：** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。对于稳定的群组绑定，优先使用 `chat_id:*`。

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  所属 OpenClaw 智能体 ID。
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  可选的 ACP 覆盖值。
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  可选的面向操作员的标签。
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  可选的运行时工作目录。
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  可选的后端覆盖值。
</ParamField>

### 每个智能体的运行时默认值

使用 `agents.list[].runtime` 为每个智能体统一定义 ACP 默认值：

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`（harness ID，例如 `codex` 或 `claude`）
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ACP 已绑定会话的覆盖优先级：**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. 全局 ACP 默认值（例如 `acp.backend`）

### 示例

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

### 行为

- OpenClaw 会在通过特定渠道的准入检查之后、使用之前，确保已配置的 ACP 会话存在。
- 该渠道、话题或聊天中的消息会路由到已配置的 ACP 会话。
- 已配置的 ACP 绑定拥有其会话路由。对于匹配的绑定，渠道广播扇出不会取代已配置的 ACP 会话。
- 在已绑定的对话中，`/new` 和 `/reset` 会原地重置同一个 ACP 会话键。
- 临时运行时绑定（例如由线程聚焦流程创建的绑定）存在时仍然适用。
- 对于未显式指定 `cwd` 的跨智能体 ACP 派生，OpenClaw 会从智能体配置继承目标智能体工作区。
- 继承的工作区路径不存在时，会回退到后端的默认 cwd；路径存在但访问失败时，则会显示为派生错误。

## 启动 ACP 会话

有两种方式可以启动 ACP 会话：

<Tabs>
  <Tab title="通过 sessions_spawn">
    使用 `runtime: "acp"` 从智能体轮次或工具调用中启动 ACP 会话。

    ```json
    {
      "task": "Open the repo and summarize failing tests",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    `runtime` 默认为 `subagent`，因此对于 ACP 会话，请显式设置
    `runtime: "acp"`。如果省略 `agentId`，OpenClaw 会在已配置时使用
    `acp.defaultAgent`。`mode: "session"` 要求设置 `thread: true`，以保持
    持久的绑定对话。
    </Note>

  </Tab>
  <Tab title="通过 /acp 命令">
    使用 `/acp spawn` 从聊天中进行显式的操作员控制。

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    关键标志：

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    请参阅[斜杠命令](/zh-CN/tools/slash-commands)。

  </Tab>
</Tabs>

### `sessions_spawn` 参数

<ParamField path="task" type="string" required>
  发送到 ACP 会话的初始提示词。
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  对于 ACP 会话，必须为 `"acp"`。
</ParamField>
<ParamField path="agentId" type="string">
  ACP 目标 harness ID。如果已设置，则回退到 `acp.defaultAgent`。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  在支持的情况下请求线程绑定流程。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` 为一次性运行；`"session"` 为持久运行。如果设置了 `thread: true` 且
  省略了 `mode`，OpenClaw 可能会根据运行时路径默认采用持久行为。
  `mode: "session"` 要求设置 `thread: true`。
</ParamField>
<ParamField path="cwd" type="string">
  请求的运行时工作目录（由后端/运行时策略验证）。
  如果省略，ACP 派生会在已配置时继承目标智能体工作区；
  继承的路径不存在时会回退到后端默认值，而真实的访问错误
  则会被返回。
</ParamField>
<ParamField path="label" type="string">
  在会话/横幅文本中使用的面向操作员的标签。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  恢复现有 ACP 会话，而不是创建新会话。智能体会通过 `session/load`
  重放其对话历史。要求设置 `runtime: "acp"`。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` 会将初始 ACP 运行进度摘要作为系统事件流式传回请求方
  会话。接受的响应包括 `streamLogPath`，它指向会话范围的 JSONL
  日志（`<sessionId>.acp-stream.jsonl`），你可以跟踪该日志以查看完整的
  中继历史。除非设置 `streaming.progress.commentary=false`，否则父会话
  进度流默认显示助手评论和 ACP 状态进度。当未配置流模式时，Discord
  的父会话预览也默认使用进度模式。状态进度仍遵循
  `acp.stream.tagVisibility`，因此除非显式启用，否则 `plan` 等标签
  仍会隐藏。
</ParamField>

ACP `sessions_spawn` 运行使用 `agents.defaults.subagents.runTimeoutSeconds`
作为默认的子轮次时限。该工具不接受每次调用的超时覆盖值
（`runTimeoutSeconds`/`timeoutSeconds` 会被拒绝，并返回要求配置默认值的错误）。

<ParamField path="model" type="string">
  ACP 子会话的显式模型覆盖。Codex ACP 派生会在 `session/new` 之前，
  将 `openai/gpt-5.4` 等 OpenAI 引用规范化为 Codex ACP 启动配置；
  `openai/gpt-5.4/high` 等斜杠形式还会设置 Codex ACP 推理强度。
  省略时，如果已配置，`sessions_spawn({ runtime: "acp" })` 会使用现有的
  子智能体模型默认值（`agents.defaults.subagents.model` 或
  `agents.list[].subagents.model`）；否则会让 ACP harness 使用其自身的
  默认模型。其他 harness 必须声明 ACP `models` 并支持
  `session/set_model`；否则 OpenClaw/acpx 会明确失败，而不是静默回退到
  目标智能体的默认值。
</ParamField>
<ParamField path="thinking" type="string">
  显式的思考/推理强度。对于 Codex ACP，`minimal` 映射为低强度，
  `low`/`medium`/`high`/`xhigh` 直接映射，而 `off` 会省略
  推理强度启动覆盖。省略时，ACP 派生会使用现有的子智能体思考默认值，
  以及所选模型对应的
  `agents.defaults.models["provider/model"].params.thinking`。
</ParamField>

## 派生绑定和线程模式

<Tabs>
  <Tab title="--bind here|off">
    | 模式   | 行为                                                               |
    | ------ | ----------------------------------------------------------------------- |
    | `here` | 原地绑定当前活跃对话；如果没有活跃对话，则失败。 |
    | `off`  | 不创建当前对话绑定。                          |

    注意事项：

    - `--bind here` 是实现“让此渠道或聊天由 Codex 提供支持”的最简单操作员路径。
    - `--bind here` 不会创建子线程。
    - `--bind here` 仅适用于提供当前对话绑定支持的渠道。
    - `--bind` 和 `--thread` 不能在同一次 `/acp spawn` 调用中组合使用。

  </Tab>
  <Tab title="--thread auto|here|off">
    | 模式   | 行为                                                                                            |
    | ------ | ------------------------------------------------------------------------------------------------- |
    | `auto` | 位于活跃线程中时：绑定该线程。不在线程中时：在支持的情况下创建并绑定子线程。 |
    | `here` | 要求当前存在活跃线程；如果不在线程中，则失败。                                                  |
    | `off`  | 不绑定。会话以未绑定状态启动。                                                                 |

    注意事项：

    - 在不支持线程绑定的界面上，默认行为实际上是 `off`。
    - 线程绑定派生需要渠道策略支持：
      - Discord：`channels.discord.threadBindings.spawnSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnSessions=true`
    - 如果你想固定当前对话而不创建子线程，请使用 `--bind here`。

  </Tab>
</Tabs>

## 交付模型

ACP 会话既可以是交互式工作区，也可以是由父会话拥有的后台
工作。交付路径取决于其形式。

<AccordionGroup>
  <Accordion title="交互式 ACP 会话">
    交互式会话用于在可见的聊天界面上持续对话：

    - `/acp spawn ... --bind here` 将当前对话绑定到 ACP 会话。
    - `/acp spawn ... --thread ...` 将渠道线程/话题绑定到 ACP 会话。
    - 持久配置的 `bindings[].type="acp"` 会将匹配的对话路由到同一个 ACP 会话。

    已绑定对话中的后续消息会直接路由到 ACP
    会话，并且 ACP 输出会交付回同一个
    渠道/线程/话题。

    OpenClaw 发送给 harness 的内容：

    - 普通的已绑定后续消息会作为提示词文本发送，仅在 harness/后端支持时附带附件。
    - `/acp` 管理命令和本地 Gateway 网关命令会在分派到 ACP 之前被拦截。
    - 运行时生成的完成事件会针对每个目标进行具体化。OpenClaw 智能体会收到 OpenClaw 的内部运行时上下文信封；外部 ACP harness 会收到包含子任务结果和指令的纯提示词。原始 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` 信封绝不能发送到外部 harness，也不能作为 ACP 用户转录文本持久化。
    - ACP 转录条目使用用户可见的触发文本或纯完成提示词。内部事件元数据会尽可能以结构化形式保留在 OpenClaw 中，不会被视为用户编写的聊天内容。

  </Accordion>
  <Accordion title="由父会话拥有的一次性 ACP 会话">
    由另一个智能体运行派生的一次性 ACP 会话属于后台
    子任务，类似于子智能体：

    - 父会话使用 `sessions_spawn({ runtime: "acp", mode: "run" })` 请求执行工作。
    - 子会话在其自身的 ACP harness 会话中运行。
    - 子轮次在原生子智能体派生所用的同一个后台通道中运行，因此缓慢的 ACP harness 不会阻塞无关的主会话工作。
    - 完成结果通过任务完成通知路径报告回来。OpenClaw 在将内部完成元数据发送到外部 harness 之前，会将其转换为纯 ACP 提示词，因此 harness 不会看到仅供 OpenClaw 使用的运行时上下文标记。
    - 当需要面向用户的回复时，父会话会使用正常的助手口吻改写子会话结果。

    **不要**将此路径视为父会话与子会话之间的点对点聊天。
    子会话已经拥有向父会话返回完成结果的渠道。

  </Accordion>
  <Accordion title="sessions_send 和 A2A 交付">
    `sessions_send` 可以在派生后以另一个会话为目标。对于普通的对等
    会话，OpenClaw 会在注入消息后使用智能体到智能体（A2A）的后续路径：

    - 等待目标会话的回复。
    - 可以选择让请求方与目标方交换有限次数的后续轮次。
    - 要求目标方生成一条通知消息。
    - 将该通知交付到可见的渠道或线程。

    该 A2A 路径是对等发送的回退机制，适用于发送方需要可见后续消息的情况。当某个无关会话能够看到 ACP 目标并向其发送消息时，例如采用宽泛的 `tools.sessions.visibility` 设置时，该路径仍会保持启用。

    仅当请求方是其自身由父会话拥有的一次性 ACP 子会话的父会话时，OpenClaw 才会跳过 A2A 后续消息。在这种情况下，若在任务完成机制之上运行 A2A，可能会用子会话的结果唤醒父会话，将父会话的回复转发回子会话，并形成父子会话回声循环。对于这种自有子会话情况，`sessions_send` 结果会报告 `delivery.status="skipped"`，因为完成路径已经负责传递结果。

  </Accordion>
  <Accordion title="恢复现有会话">
    使用 `resumeSessionId` 继续之前的 ACP 会话，而不是重新开始。智能体通过 `session/load` 重放其对话历史记录，因此可以带着之前的完整上下文继续处理。

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    常见使用场景：

    - 将 Codex 会话从笔记本电脑移交到手机——让你的智能体从中断处继续。
    - 继续你之前在 CLI 中以交互方式启动的编码会话，现在通过智能体以无界面方式运行。
    - 继续因 Gateway 网关重启或空闲超时而中断的工作。

    注意事项：

    - `resumeSessionId` 仅在 `runtime: "acp"` 时适用；默认子智能体运行时会忽略这个仅限 ACP 的字段。
    - `streamTo` 仅在 `runtime: "acp"` 时适用；默认子智能体运行时会忽略这个仅限 ACP 的字段。
    - `resumeSessionId` 是主机本地的 ACP/harness 恢复 ID，而不是 OpenClaw 渠道会话键；OpenClaw 在分派前仍会检查 ACP 生成策略和目标智能体策略，而加载该上游 ID 的授权由 ACP 后端或 harness 负责。
    - `resumeSessionId` 会恢复上游 ACP 对话历史记录；`thread` 和 `mode` 仍会正常应用于你正在创建的新 OpenClaw 会话，因此 `mode: "session"` 仍要求 `thread: true`。
    - 目标智能体必须支持 `session/load`（Codex 和 Claude Code 均支持）。
    - 如果找不到该会话 ID，生成操作会失败并给出明确错误，而不会静默回退到新会话。

  </Accordion>
  <Accordion title="部署后冒烟测试">
    部署 Gateway 网关后，应运行实时端到端检查，而不是仅依赖单元测试：

    1. 在目标主机上验证已部署的 Gateway 网关版本和提交。
    2. 创建一个连接到实时智能体的临时 ACPX 桥接会话。
    3. 要求该智能体调用 `sessions_spawn`，并使用 `runtime: "acp"`、`agentId: "codex"`、`mode: "run"` 以及任务 `Reply with exactly LIVE-ACP-SPAWN-OK`。
    4. 验证 `accepted=yes`、真实的 `childSessionKey`，并确认没有验证器错误。
    5. 清理临时桥接会话。

    将门禁保持在 `mode: "run"`，并跳过 `streamTo: "parent"`——绑定线程的 `mode: "session"` 和流中继路径属于另外两项功能更丰富的集成验证。

  </Accordion>
</AccordionGroup>

## 沙箱兼容性

ACP 会话目前在主机运行时中运行，**而不是**在 OpenClaw 沙箱内运行。

<Warning>
**安全边界：**

- 外部 harness 可以根据其自身的 CLI 权限和所选 `cwd` 进行读写。
- OpenClaw 的沙箱策略**不会**封装 ACP harness 执行。
- OpenClaw 仍会强制执行 ACP 功能门禁、允许的智能体、会话所有权、渠道绑定和 Gateway 网关交付策略。
- 对于由沙箱强制保护的 OpenClaw 原生工作，请使用 `runtime: "subagent"`。

</Warning>

当前限制：

- 如果请求方会话已启用沙箱隔离，则 `sessions_spawn({ runtime: "acp" })` 和 `/acp spawn` 的 ACP 生成操作都会被阻止。
- 使用 `runtime: "acp"` 的 `sessions_spawn` 不支持 `sandbox: "require"`。

## 会话目标解析

大多数 `/acp` 操作都接受可选的会话目标（`session-key`、`session-id` 或 `session-label`）。

**解析顺序：**

1. 显式目标参数（或 `/acp steer` 的 `--session`）
   - 先尝试键
   - 然后尝试 UUID 格式的会话 ID
   - 最后尝试标签
2. 当前线程绑定（如果此对话/线程已绑定到 ACP 会话）。
3. 当前请求方会话回退。

当前对话绑定和线程绑定都会参与第 2 步。

如果无法解析任何目标，OpenClaw 会返回明确错误
（`Unable to resolve session target: ...`）。

## ACP 控制命令

| 命令                 | 作用                                                 | 示例                                                          |
| -------------------- | ---------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | 创建 ACP 会话；可选择绑定当前会话或线程。            | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 取消目标会话中正在进行的轮次。                       | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 向正在运行的会话发送引导指令。                       | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | 关闭会话并解除线程目标绑定。                         | `/acp close`                                                  |
| `/acp status`        | 显示后端、模式、状态、运行时选项和能力。             | `/acp status`                                                 |
| `/acp set-mode`      | 设置目标会话的运行时模式。                           | `/acp set-mode plan`                                          |
| `/acp set`           | 写入通用运行时配置选项。                             | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | 设置运行时工作目录覆盖值。                           | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 设置审批策略配置文件。                               | `/acp permissions strict`                                     |
| `/acp timeout`       | 设置运行时超时（秒）。                               | `/acp timeout 120`                                            |
| `/acp model`         | 设置运行时模型覆盖值。                               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | 移除会话运行时选项覆盖值。                           | `/acp reset-options`                                          |
| `/acp sessions`      | 列出存储中的近期 ACP 会话。                          | `/acp sessions`                                               |
| `/acp doctor`        | 显示后端健康状况、能力和可执行的修复措施。           | `/acp doctor`                                                 |
| `/acp install`       | 输出确定性的安装和启用步骤。                         | `/acp install`                                                |

运行时控制命令（`spawn`、`cancel`、`steer`、`close`、`status`、`set-mode`、`set`、`cwd`、`permissions`、`timeout`、`model` 和 `reset-options`）要求来自外部渠道的所有者身份，并要求内部 Gateway 网关客户端具备 `operator.admin`。经过授权但不是所有者的发送方仍可使用 `sessions`、`doctor`、`install` 和 `help`。

`/acp status` 会显示有效的运行时选项，以及运行时级别和后端级别的会话标识符。当后端缺少某项能力时，会明确显示不支持控制操作的错误。`/acp sessions` 会读取当前已绑定会话或请求方会话的存储；目标令牌（`session-key`、`session-id` 或 `session-label`）通过 Gateway 网关会话发现机制解析，包括按智能体自定义的 `session.store` 根目录。

### 运行时选项映射

`/acp` 提供便捷命令和通用设置命令。等效操作如下：

| 命令                         | 映射到                                | 说明                                                                                                                                                                                                                 |
| ---------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | 运行时配置键 `model`                  | 对于 Codex ACP，OpenClaw 会将 `openai/<model>` 规范化为适配器模型 ID，并将 `openai/gpt-5.4/high` 等斜杠推理后缀映射到 `reasoning_effort`。                                                                              |
| `/acp set thinking <level>`  | 规范选项 `thinking`                   | 如果存在后端公布的等效项，OpenClaw 会发送该等效项，依次优先使用 `thinking`、`effort`、`reasoning_effort` 或 `thought_level`。对于 Codex ACP，适配器会将值映射到 `reasoning_effort`。                                   |
| `/acp permissions <profile>` | 规范选项 `permissionProfile`          | 如果存在后端公布的等效项，OpenClaw 会发送该等效项，例如 `approval_policy`、`permission_profile`、`permissions` 或 `permission_mode`。                                                                                |
| `/acp timeout <seconds>`     | 规范选项 `timeoutSeconds`             | 如果存在后端公布的等效项，OpenClaw 会发送该等效项，例如 `timeout` 或 `timeout_seconds`。                                                                                                                            |
| `/acp cwd <path>`            | 运行时 `cwd` 覆盖值                   | 直接更新。                                                                                                                                                                                                           |
| `/acp set <key> <value>`     | 通用设置                              | `key=cwd` 使用 `cwd` 覆盖路径。                                                                                                                                                                                      |
| `/acp reset-options`         | 清除所有运行时覆盖值                  | -                                                                                                                                                                                                                    |

## acpx harness、插件设置和权限

有关 acpx harness 配置（Claude Code / Codex / Gemini CLI 别名）、plugin-tools 和 OpenClaw-tools MCP 桥接，以及 ACP 权限模式，请参阅 [ACP 智能体设置](/zh-CN/tools/acp-agents-setup)。

## 故障排查

| 症状                                                                                      | 可能原因                                                                                                           | 修复方法                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                                   | 后端插件缺失、已禁用或被 `plugins.allow` 阻止。                                                                    | 安装并启用后端插件；如果设置了该允许列表，请将 `acpx` 加入 `plugins.allow`，然后运行 `/acp doctor`。                                                                            |
| `ACP is disabled by policy (acp.enabled=false)`                                           | ACP 已被全局禁用。                                                                                                 | 设置 `acp.enabled=true`。                                                                                                                                                      |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`                         | 已禁用从普通线程消息自动分派。                                                                                     | 设置 `acp.dispatch.enabled=true` 以恢复自动线程路由；显式调用 `sessions_spawn({ runtime: "acp" })` 仍然有效。                                                                   |
| `ACP agent "<id>" is not allowed by policy`                                               | 智能体不在允许列表中。                                                                                             | 使用允许的 `agentId`，或更新 `acp.allowedAgents`。                                                                                                                             |
| `/acp doctor` reports backend not ready right after startup                               | 后端插件缺失、已禁用、被允许/拒绝策略阻止，或其配置的可执行文件不可用。                                            | 安装并启用后端插件，重新运行 `/acp doctor`；如果仍不健康，请检查后端安装或策略错误。                                                                                            |
| 找不到 Harness 命令                                                                       | 适配器 CLI 未安装、外部插件缺失，或非 Codex 适配器首次运行时的 `npx` 获取失败。                                    | 运行 `/acp doctor`，在 Gateway 网关主机上安装或预热适配器，或者显式配置 acpx 智能体命令。                                                                                       |
| Harness 报告找不到模型                                                                    | 模型 ID 对其他提供商或 Harness 有效，但不适用于此 ACP 目标。                                                       | 使用该 Harness 列出的模型、在 Harness 中配置模型，或省略覆盖设置。                                                                                                            |
| Harness 报告供应商身份验证错误                                                            | OpenClaw 运行正常，但目标 CLI 或提供商尚未登录。                                                                   | 在 Gateway 网关主机环境中登录，或提供所需的提供商密钥。                                                                                                                       |
| `Unable to resolve session target: ...`                                                   | 键、ID 或标签令牌错误。                                                                                            | 运行 `/acp sessions`，复制准确的键或标签，然后重试。                                                                                                                          |
| `--bind here requires running /acp spawn inside an active ... conversation`               | 在没有可绑定的活跃对话时使用了 `--bind here`。                                                                     | 转到目标聊天或渠道后重试，或者使用不绑定的生成方式。                                                                                                                          |
| `Conversation bindings are unavailable for <channel>.`                                    | 适配器不具备当前对话的 ACP 绑定能力。                                                                              | 在支持的情况下使用 `/acp spawn ... --thread ...`、配置顶层 `bindings[]`，或转到支持的渠道。                                                                                    |
| `--thread here requires running /acp spawn inside an active ... thread`                   | 在非线程上下文中使用了 `--thread here`。                                                                           | 转到目标线程，或使用 `--thread auto`/`off`。                                                                                                                                  |
| `Only <user-id> can rebind this channel/conversation/thread.`                             | 当前活跃绑定目标归另一位用户所有。                                                                                 | 以所有者身份重新绑定，或使用其他对话或线程。                                                                                                                                  |
| `Thread bindings are unavailable for <channel>.`                                          | 适配器不具备线程绑定能力。                                                                                         | 使用 `--thread off`，或转到支持的适配器或渠道。                                                                                                                               |
| `Sandboxed sessions cannot spawn ACP sessions ...`                                        | ACP 运行时位于主机端；请求方会话已进行沙箱隔离。                                                                   | 从沙箱隔离的会话中使用 `runtime="subagent"`，或从未进行沙箱隔离的会话中运行 ACP 生成操作。                                                                                     |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`                   | 为 ACP 运行时请求了 `sandbox="require"`。                                                                           | 如需强制沙箱隔离，请使用 `runtime="subagent"`；或者从未进行沙箱隔离的会话中使用 ACP，并设置 `sandbox="inherit"`。                                                              |
| `Cannot apply --model ... did not advertise model support`                                | 目标 Harness 未公开通用 ACP 模型切换功能。                                                                         | 使用公布支持 ACP `models`/`session/set_model` 的 Harness、使用 Codex ACP 模型引用，或者在 Harness 具有自己的启动标志时直接在其中配置模型。                                     |
| 绑定会话缺少 ACP 元数据                                                                   | ACP 会话元数据已过期或被删除。                                                                                     | 使用 `/acp spawn` 重新创建，然后重新绑定或聚焦线程。                                                                                                                          |
| `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` | `permissionMode` 阻止在非交互式 ACP 会话中写入或执行。                                                             | 将 `plugins.entries.acpx.config.permissionMode` 设置为 `approve-all`，然后重启 Gateway 网关。请参阅[权限配置](/zh-CN/tools/acp-agents-setup#permission-configuration)。             |
| ACP 会话提前失败且输出很少                                                                | 权限提示被 `permissionMode`/`nonInteractivePermissions` 阻止。                                                      | 检查 Gateway 网关日志中是否存在 `AcpRuntimeError`。如需完整权限，请设置 `permissionMode=approve-all`；如需优雅降级，请设置 `nonInteractivePermissions=deny`。                  |
| ACP 会话完成工作后无限期停滞                                                              | Harness 进程已完成，但 ACP 会话未报告完成。                                                                         | 更新 OpenClaw；当前的 acpx 清理机制会在关闭和 Gateway 网关启动时清除由 OpenClaw 所有的过期包装器及适配器进程。                                                               |
| Harness 看到了 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                                    | 内部事件信封泄漏到了 ACP 边界之外。                                                                                | 更新 OpenClaw 并重新运行完成流程；外部 Harness 应仅接收纯文本完成提示。                                                                                                      |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` 属于原生
Codex 钩子中继，而不属于 ACP/acpx。在已绑定的 Codex 聊天中，使用 `/new` 或
`/reset` 启动新会话；如果它成功一次，但在下一次原生工具调用时再次出现，请重启
Codex app-server 或 OpenClaw Gateway 网关，而不是反复执行 `/new`。请参阅
[Codex harness 故障排除](/zh-CN/plugins/codex-harness#troubleshooting)。
</Note>

## 相关内容

- [ACP 智能体设置](/zh-CN/tools/acp-agents-setup)
- [智能体发送](/zh-CN/tools/agent-send)
- [CLI 后端](/zh-CN/gateway/cli-backends)
- [Codex harness](/zh-CN/plugins/codex-harness)
- [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)
- [多智能体沙箱工具](/zh-CN/tools/multi-agent-sandbox-tools)
- [`openclaw acp`（桥接模式）](/zh-CN/cli/acp)
- [子智能体](/zh-CN/tools/subagents)

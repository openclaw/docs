---
read_when:
    - 配置 exec 审批或允许列表
    - 在 macOS 应用中实现 exec 审批用户体验
    - 审查沙箱逃逸提示词及其影响
sidebarTitle: Exec approvals
summary: 主机 exec 审批：策略开关、允许列表和 YOLO/strict 工作流
title: 执行审批
x-i18n:
    generated_at: "2026-05-06T00:32:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30733fe6580e7c10e3e61c5d050a60939512e67a6dc8b279adf703b30ec344ea
    source_path: tools/exec-approvals.md
    workflow: 16
---

执行审批是允许沙箱隔离的智能体在真实主机（`gateway` 或 `node`）上运行命令的**配套应用 / 节点主机防护栏**。这是一个安全联锁：只有当策略 + 允许列表 +（可选）用户审批全部一致时，命令才会被允许。执行审批叠加在工具策略和提升权限门控**之上**（除非提升权限设置为 `full`，这种情况会跳过审批）。

<Note>
有效策略取 `tools.exec.*` 和审批默认值中**更严格**的一方；如果省略某个审批字段，则使用 `tools.exec` 的值。主机执行也会使用该机器上的本地审批状态，一个主机本地的 `ask: "always"`（位于 `~/.openclaw/exec-approvals.json`）会持续提示，即使会话或配置默认值请求 `ask: "on-miss"`。
</Note>

## 检查有效策略

| 命令                                                          | 显示内容                                                                          |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | 请求的策略、主机策略来源，以及有效结果。                       |
| `openclaw exec-policy show`                                      | 本地机器的合并视图。                                                             |
| `openclaw exec-policy set` / `preset`                            | 一步同步本地请求策略与本地主机审批文件。 |

当本地作用域请求 `host=node` 时，`exec-policy show` 会报告该作用域在运行时由节点管理，而不是假装本地审批文件是真实来源。

如果配套应用 UI **不可用**，任何通常会触发提示的请求都会由 **ask 回退策略**解析（默认值：`deny`）。

<Tip>
原生聊天审批客户端可以在待处理审批消息上预置特定渠道的交互能力。例如，Matrix 会预置 reaction 快捷方式（`✅` 允许一次，`❌` 拒绝，`♾️` 始终允许），同时仍在消息中保留 `/approve ...` 命令作为回退。
</Tip>

## 适用位置

执行审批会在执行主机本地强制执行：

- **Gateway 网关主机** → Gateway 网关机器上的 `openclaw` 进程。
- **节点主机** → 节点运行器（macOS 配套应用或无头节点主机）。

### 信任模型

- 通过 Gateway 网关认证的调用方是该 Gateway 网关的受信任操作员。
- 已配对节点会把这种受信任操作员能力扩展到节点主机。
- 执行审批会降低意外执行风险，但**不是**按用户划分的认证边界。
- 已批准的节点主机运行会绑定规范执行上下文：规范 cwd、精确 argv、存在时的 env 绑定，以及适用时固定的可执行文件路径。
- 对于 shell 脚本以及直接调用解释器/运行时文件的情况，OpenClaw 也会尝试绑定一个具体的本地文件操作数。如果该绑定文件在审批后、执行前发生变化，运行会被拒绝，而不是执行已漂移的内容。
- 文件绑定是刻意的尽力而为，**不是**对每个解释器/运行时加载器路径的完整语义模型。如果审批模式无法识别出恰好一个可绑定的具体本地文件，它会拒绝生成由审批背书的运行，而不是假装已经完整覆盖。

### macOS 拆分

- **节点主机服务**通过本地 IPC 将 `system.run` 转发到 **macOS 应用**。
- **macOS 应用**会强制执行审批，并在 UI 上下文中执行命令。

## 设置和存储

审批存放在执行主机上的本地 JSON 文件中：

```text
~/.openclaw/exec-approvals.json
```

示例 schema：

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "source": "allow-always",
          "commandText": "rg -n TODO",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## 策略开关

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` — 阻止所有主机执行请求。
  - `allowlist` — 仅允许允许列表中的命令。
  - `full` — 允许所有内容（等同于提升权限）。

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` — 从不提示。
  - `on-miss` — 仅当允许列表不匹配时提示。
  - `always` — 每个命令都提示。当有效 ask 模式为 `always` 时，`allow-always` 持久信任**不会**抑制提示。

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  当需要提示但无法访问 UI 时的解析方式。

- `deny` — 阻止。
- `allowlist` — 仅当允许列表匹配时允许。
- `full` — 允许。

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  当为 `true` 时，OpenClaw 会把内联代码求值形式视为只能通过审批运行，
  即使解释器二进制文件本身已在允许列表中。对于无法清晰映射到一个稳定文件
  操作数的解释器加载器，这是一种纵深防御。
</ParamField>

严格模式会捕获的示例：

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

在严格模式下，这些命令仍需要显式审批，并且 `allow-always` 不会自动为它们持久化新的允许列表条目。

## YOLO 模式（无审批）

如果你希望主机执行在没有审批提示的情况下运行，必须同时打开**两层**策略：OpenClaw 配置中的请求执行策略（`tools.exec.*`）**以及** `~/.openclaw/exec-approvals.json` 中的主机本地审批策略。

除非你显式收紧它，否则 YOLO 是默认主机行为：

| 层级                 | YOLO 设置               |
| --------------------- | -------------------------- |
| `tools.exec.security` | `gateway`/`node` 上的 `full` |
| `tools.exec.ask`      | `off`                      |
| 主机 `askFallback`    | `full`                     |

<Warning>
**重要区别：**

- `tools.exec.host=auto` 选择执行运行在**哪里**：可用时使用沙箱，否则使用 Gateway 网关。
- YOLO 选择主机执行**如何**获批：`security=full` 加 `ask=off`。
- 在 YOLO 模式下，OpenClaw **不会**在已配置的主机执行策略之上再添加单独的启发式命令混淆审批门控或脚本预检拒绝层。
- `auto` 不会让 Gateway 网关路由变成沙箱隔离会话的自由覆盖项。来自 `auto` 的逐次调用 `host=node` 请求是允许的；只有在没有活动沙箱运行时时，来自 `auto` 的 `host=gateway` 才会被允许。若要使用稳定的非 auto 默认值，请设置 `tools.exec.host`，或显式使用 `/exec host=...`。

</Warning>

暴露自身非交互权限模式的 CLI 后端提供商可以遵循此策略。当 OpenClaw 请求的执行策略为 YOLO 时，Claude CLI 会添加 `--permission-mode bypassPermissions`。可以在 `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` 下使用显式 Claude 参数覆盖该后端行为，例如 `--permission-mode default`、`acceptEdits` 或 `bypassPermissions`。

如果你希望采用更保守的设置，请把任一层收紧回 `allowlist` / `on-miss` 或 `deny`。

### 持久 Gateway 网关主机“从不提示”设置

<Steps>
  <Step title="设置请求的配置策略">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="匹配主机审批文件">
    ```bash
    openclaw approvals set --stdin <<'EOF'
    {
      version: 1,
      defaults: {
        security: "full",
        ask: "off",
        askFallback: "full"
      }
    }
    EOF
    ```
  </Step>
</Steps>

### 本地快捷方式

```bash
openclaw exec-policy preset yolo
```

该本地快捷方式会同时更新：

- 本地 `tools.exec.host/security/ask`。
- 本地 `~/.openclaw/exec-approvals.json` 默认值。

它刻意仅限本地使用。若要远程更改 Gateway 网关主机或节点主机审批，请使用 `openclaw approvals set --gateway` 或 `openclaw approvals set --node <id|name|ip>`。

### 节点主机

对于节点主机，请改为在该节点上应用相同的审批文件：

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

<Note>
**仅限本地的限制：**

- `openclaw exec-policy` 不会同步节点审批。
- `openclaw exec-policy set --host node` 会被拒绝。
- 节点执行审批会在运行时从节点获取，因此面向节点的更新必须使用 `openclaw approvals --node ...`。

</Note>

### 仅会话快捷方式

- `/exec security=full ask=off` 仅更改当前会话。
- `/elevated full` 是一个应急快捷方式，也会为该会话跳过执行审批。

如果主机审批文件比配置更严格，仍然以更严格的主机策略为准。

## 允许列表（按智能体）

允许列表是**按智能体**划分的。如果存在多个智能体，请在 macOS 应用中切换你正在编辑的智能体。模式是 glob 匹配。

模式可以是已解析的二进制路径 glob，也可以是裸命令名 glob。裸名称只匹配通过 `PATH` 调用的命令，因此当命令为 `rg` 时，`rg` 可以匹配 `/opt/homebrew/bin/rg`，但**不能**匹配 `./rg` 或 `/tmp/rg`。如果你想信任某个特定二进制位置，请使用路径 glob。

旧版 `agents.default` 条目会在加载时迁移到 `agents.main`。像 `echo ok && pwd` 这样的 Shell 链仍需要每个顶级片段都满足允许列表规则。

示例：

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### 使用 argPattern 限制参数

当允许列表条目应匹配某个二进制文件和特定参数形状时，请添加 `argPattern`。OpenClaw 会针对解析后的命令参数评估该正则表达式，并排除可执行文件 token（`argv[0]`）。对于手写条目，参数会用单个空格连接，因此在需要精确匹配时请锚定该模式。

```json
{
  "version": 1,
  "agents": {
    "main": {
      "allowlist": [
        {
          "pattern": "python3",
          "argPattern": "^safe\\.py$"
        }
      ]
    }
  }
}
```

该条目允许 `python3 safe.py`；`python3 other.py` 是允许列表未命中。如果同一二进制文件还存在一个仅路径条目，不匹配的参数仍可回退到该仅路径条目。当目标是将该二进制文件限制为声明的参数时，请省略仅路径条目。

审批流程保存的条目可以使用内部分隔符格式来进行精确 argv 匹配。优先使用 UI 或审批流程重新生成这些条目，而不是手动编辑编码值。如果 OpenClaw 无法解析某个命令片段的 argv，带有 `argPattern` 的条目不会匹配。

每个允许列表条目支持：

| 字段               | 含义                                                          |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | 已解析的二进制路径 glob 或裸命令名 glob                       |
| `argPattern`       | 可选的 argv 正则；省略的条目仅匹配路径                        |
| `id`               | 用于 UI 身份标识的稳定 UUID                                   |
| `source`           | 条目来源，例如 `allow-always`                                 |
| `commandText`      | 审批流程创建条目时捕获的命令文本                              |
| `lastUsedAt`       | 上次使用时间戳                                                |
| `lastUsedCommand`  | 上次匹配的命令                                                |
| `lastResolvedPath` | 上次解析出的二进制路径                                        |

## 自动允许 Skills CLI

启用 **自动允许 Skills CLI** 后，已知 Skills 引用的可执行文件会在节点（macOS 节点或无头节点主机）上被视为已加入允许列表。这会通过 Gateway RPC 使用 `skills.bins` 获取 Skill 二进制文件列表。如果你想使用严格的手动允许列表，请禁用此项。

<Warning>
- 这是一个**隐式的便利允许列表**，独立于手动路径允许列表条目。
- 它适用于 Gateway 网关和节点位于同一信任边界内的可信操作员环境。
- 如果你需要严格的显式信任，请保持 `autoAllowSkills: false`，并且仅使用手动路径允许列表条目。

</Warning>

## 安全 bin 和审批转发

关于安全 bin（仅 stdin 快速路径）、解释器绑定细节，以及如何将审批提示转发到 Slack/Discord/Telegram（或将它们作为原生审批客户端运行），请参阅 [Exec 审批 — 高级](/zh-CN/tools/exec-approvals-advanced)。

## Control UI 编辑

使用 **Control UI → 节点 → Exec 审批** 卡片编辑默认值、每个智能体的覆盖项和允许列表。选择一个作用域（默认值或某个智能体），调整策略，添加/移除允许列表模式，然后点击**保存**。UI 会按模式显示上次使用的元数据，方便你保持列表整洁。

目标选择器会选择 **Gateway 网关**（本地审批）或一个**节点**。节点必须声明 `system.execApprovals.get/set`（macOS 应用或无头节点主机）。如果节点尚未声明 exec 审批，请直接编辑其本地 `~/.openclaw/exec-approvals.json`。

CLI：`openclaw approvals` 支持 Gateway 网关或节点编辑 — 请参阅 [审批 CLI](/zh-CN/cli/approvals)。

## 审批流程

当需要提示时，Gateway 网关会向操作员客户端广播 `exec.approval.requested`。Control UI 和 macOS 应用通过 `exec.approval.resolve` 解析它，然后 Gateway 网关将已批准的请求转发给节点主机。

对于 `host=node`，审批请求包含规范的 `systemRunPlan` 载荷。Gateway 网关在转发已批准的 `system.run` 请求时，会将该计划用作权威的命令/cwd/会话上下文。

这对异步审批延迟很重要：

- 节点 exec 路径会预先准备一个规范计划。
- 审批记录会存储该计划及其绑定元数据。
- 一旦批准，最终转发的 `system.run` 调用会复用已存储的计划，而不是信任后续调用方编辑。
- 如果调用方在审批请求创建后更改 `command`、`rawCommand`、`cwd`、`agentId` 或 `sessionKey`，Gateway 网关会因审批不匹配而拒绝转发的运行。

## 系统事件

Exec 生命周期会以系统消息呈现：

- `Exec running`（仅当命令超过运行通知阈值时）。
- `Exec finished`。
- `Exec denied`。

这些消息会在节点报告事件后发布到智能体的会话。Gateway 网关托管的 exec 审批会在命令完成时发出相同的生命周期事件（并可选地在运行时间超过阈值时发出）。受审批控制的 exec 会在这些消息中复用审批 ID 作为 `runId`，便于关联。

## 审批被拒绝时的行为

当异步 exec 审批被拒绝时，OpenClaw 会阻止智能体复用同一会话中相同命令任何早前运行的输出。拒绝原因会附带明确指导，说明没有可用的命令输出，从而阻止智能体声称存在新输出，或用先前成功运行的陈旧结果重复被拒绝的命令。

## 影响

- **`full`** 权限强大；尽可能优先使用允许列表。
- **`ask`** 让你保持参与，同时仍允许快速审批。
- 每个智能体的允许列表可防止一个智能体的审批泄漏到其他智能体。
- 审批仅适用于来自**授权发送者**的主机 exec 请求。未授权发送者不能发起 `/exec`。
- `/exec security=full` 是面向授权操作员的会话级便利功能，并且按设计会跳过审批。若要强制阻止主机 exec，请将审批安全性设置为 `deny`，或通过工具策略拒绝 `exec` 工具。

## 相关

<CardGroup cols={2}>
  <Card title="Exec approvals — advanced" href="/zh-CN/tools/exec-approvals-advanced" icon="gear">
    安全 bin、解释器绑定，以及将审批转发到聊天。
  </Card>
  <Card title="Exec tool" href="/zh-CN/tools/exec" icon="terminal">
    Shell 命令执行工具。
  </Card>
  <Card title="Elevated mode" href="/zh-CN/tools/elevated" icon="shield-exclamation">
    同样会跳过审批的应急路径。
  </Card>
  <Card title="Sandboxing" href="/zh-CN/gateway/sandboxing" icon="box">
    沙箱模式和工作区访问。
  </Card>
  <Card title="Security" href="/zh-CN/gateway/security" icon="lock">
    安全模型和加固。
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    何时使用每种控制方式。
  </Card>
  <Card title="Skills" href="/zh-CN/tools/skills" icon="sparkles">
    Skill 支持的自动允许行为。
  </Card>
</CardGroup>

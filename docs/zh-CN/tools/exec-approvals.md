---
read_when:
    - 配置执行审批或允许列表
    - 在 macOS 应用中实现执行审批 UX
    - 审查沙箱逃逸提示及其影响
summary: 执行审批、允许列表和沙箱逃逸提示
title: 执行审批
x-i18n:
    generated_at: "2026-04-25T03:24:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44bf7af57d322280f6d0089207041214b1233d0c9eca99656d51fc4aed88941b
    source_path: tools/exec-approvals.md
    workflow: 15
---

执行审批是**配套应用 / 节点主机防护栏**，用于让处于沙箱隔离的智能体在真实主机（`gateway` 或 `node`）上运行命令。这是一种安全联锁机制：只有当策略 + 允许列表 +（可选）用户审批全部同意时，命令才会被允许执行。执行审批叠加在工具策略和 elevated 门控机制**之上**（除非 elevated 设为 `full`，此时会跳过审批）。

<Note>
生效策略是 `tools.exec.*` 与审批默认值中**更严格**的那一个；如果某个审批字段被省略，则使用 `tools.exec` 的值。主机执行还会使用该机器上的本地审批状态——如果 `~/.openclaw/exec-approvals.json` 中存在主机本地的 `ask: "always"`，即使会话或配置默认值请求 `ask: "on-miss"`，系统仍然会持续提示。
</Note>

## 检查生效策略

- `openclaw approvals get`、`... --gateway`、`... --node <id|name|ip>` —— 显示请求的策略、主机策略来源以及最终生效结果。
- `openclaw exec-policy show` —— 显示本地机器上的合并视图。
- `openclaw exec-policy set|preset` —— 一步完成，将本地请求的策略与本地主机审批文件同步。

当本地作用域请求 `host=node` 时，`exec-policy show` 会在运行时将该作用域报告为由节点管理，而不是假装本地审批文件是真实来源。

如果配套应用 UI **不可用**，任何通常需要提示的请求都会由 **ask fallback** 处理（默认：拒绝）。

<Tip>
原生聊天审批客户端可以在待审批消息上预置特定渠道的便捷交互。例如，Matrix 会预置反应快捷方式（`✅` 允许一次、`❌` 拒绝、`♾️` 始终允许），同时仍在消息中保留 `/approve ...` 命令作为后备方案。
</Tip>

## 适用范围

执行审批会在执行主机本地强制执行：

- **gateway host** → Gateway 机器上的 `openclaw` 进程
- **node host** → 节点运行器（macOS 配套应用或无头节点主机）

信任模型说明：

- 通过 Gateway 认证的调用方，是该 Gateway 网关的受信任操作员。
- 已配对节点会将这种受信任操作员能力扩展到节点主机上。
- 执行审批可以降低意外执行风险，但并不是按用户划分的身份验证边界。
- 已批准的节点主机执行会绑定规范化执行上下文：规范化的 cwd、精确的 argv、存在时的 env 绑定，以及适用时固定的可执行文件路径。
- 对于 shell 脚本和直接的解释器 / 运行时文件调用，OpenClaw 还会尝试绑定一个具体的本地文件操作数。如果该绑定文件在审批后、执行前发生变化，运行将被拒绝，而不是执行已漂移的内容。
- 这种文件绑定是有意设计为“尽力而为”，而不是覆盖所有解释器 / 运行时加载路径的完整语义模型。如果审批模式无法识别并绑定**恰好一个**具体本地文件，它将拒绝签发基于审批的运行，而不是假装已经完全覆盖。

macOS 拆分：

- **node host service** 通过本地 IPC 将 `system.run` 转发给 **macOS app**。
- **macOS app** 负责执行审批 + 在 UI 上下文中运行命令。

## 设置与存储

审批存储在执行主机上的本地 JSON 文件中：

`~/.openclaw/exec-approvals.json`

示例结构：

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
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## 无需审批的 “YOLO” 模式

如果你希望主机执行在没有审批提示的情况下运行，必须同时放开**两个**策略层：

- OpenClaw 配置中的请求执行策略（`tools.exec.*`）
- `~/.openclaw/exec-approvals.json` 中主机本地的审批策略

除非你显式收紧，否则这现在是默认的主机行为：

- `tools.exec.security`：在 `gateway` / `node` 上设为 `full`
- `tools.exec.ask`：设为 `off`
- 主机 `askFallback`：设为 `full`

重要区别：

- `tools.exec.host=auto` 决定执行在哪里运行：有沙箱时在沙箱中，否则在 gateway 上运行。
- YOLO 决定主机执行如何获批：`security=full` 加 `ask=off`。
- 暴露其自身非交互权限模式的基于 CLI 的提供商可以遵循此策略。
  当 OpenClaw 请求的执行策略为 YOLO 时，Claude CLI 会添加 `--permission-mode bypassPermissions`。你可以通过 `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` 下的显式 Claude 参数覆盖该后端行为，例如 `--permission-mode default`、`acceptEdits` 或 `bypassPermissions`。
- 在 YOLO 模式下，OpenClaw 不会在已配置的主机执行策略之上，额外添加单独的启发式命令混淆审批门控或脚本预检拒绝层。
- `auto` 不会让 gateway 路由成为来自沙箱隔离会话的免费覆盖项。每次调用的 `host=node` 请求可在 `auto` 下被允许，而 `host=gateway` 只有在没有活动沙箱运行时时，才可从 `auto` 被允许。如果你想要稳定的非 auto 默认值，请设置 `tools.exec.host`，或显式使用 `/exec host=...`。

如果你想采用更保守的设置，可以将任一层重新收紧为 `allowlist` / `on-miss`
或 `deny`。

持久化的 gateway host “永不提示” 设置：

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

然后将主机审批文件设置为匹配值：

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

在当前机器上应用相同 gateway host 策略的本地快捷方式：

```bash
openclaw exec-policy preset yolo
```

该本地快捷方式会同时更新：

- 本地 `tools.exec.host/security/ask`
- 本地 `~/.openclaw/exec-approvals.json` 默认值

它有意只作用于本地。如果你需要远程更改 gateway host 或 node host 审批，请继续使用 `openclaw approvals set --gateway` 或
`openclaw approvals set --node <id|name|ip>`。

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

重要的仅本地限制：

- `openclaw exec-policy` 不会同步节点审批
- `openclaw exec-policy set --host node` 会被拒绝
- 节点执行审批会在运行时从节点获取，因此针对节点的更新必须使用 `openclaw approvals --node ...`

仅会话快捷方式：

- `/exec security=full ask=off` 只会更改当前会话。
- `/elevated full` 是一个紧急破窗快捷方式，也会为该会话跳过执行审批。

如果主机审批文件仍比配置更严格，仍以更严格的主机策略为准。

## 策略开关

### 安全性（`exec.security`）

- **deny**：阻止所有主机执行请求。
- **allowlist**：仅允许允许列表中的命令。
- **full**：允许所有内容（等同于 elevated）。

### 询问（`exec.ask`）

- **off**：从不提示。
- **on-miss**：仅当允许列表不匹配时提示。
- **always**：每个命令都提示。
- 当生效的询问模式为 `always` 时，`allow-always` 的持久信任不会抑制提示

### 询问后备（`askFallback`）

如果需要提示但没有可达的 UI，则由后备策略决定：

- **deny**：阻止。
- **allowlist**：仅当允许列表匹配时允许。
- **full**：允许。

### 内联解释器 eval 加固（`tools.exec.strictInlineEval`）

当 `tools.exec.strictInlineEval=true` 时，即使解释器二进制本身在允许列表中，OpenClaw 也会将内联代码求值形式视为“仅可通过审批执行”。

示例：

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

这是对那些无法干净映射到单一稳定文件操作数的解释器加载路径所做的纵深防御。在严格模式下：

- 这些命令仍然需要显式审批；
- `allow-always` 不会自动为它们持久保存新的允许列表条目。

## 允许列表（按智能体）

允许列表是**按智能体**划分的。如果存在多个智能体，请在 macOS 应用中切换你要编辑的智能体。模式使用 glob 匹配。
模式可以是已解析的二进制路径 glob，也可以是裸命令名 glob。裸名称只匹配通过 PATH 调用的命令，因此当命令是 `rg` 时，`rg` 可以匹配 `/opt/homebrew/bin/rg`，但不能匹配 `./rg` 或 `/tmp/rg`。如果你想信任某一个特定的二进制位置，请使用路径 glob。
旧版 `agents.default` 条目会在加载时迁移到 `agents.main`。
像 `echo ok && pwd` 这样的 shell 链式命令，仍然要求每个顶层片段都满足允许列表规则。

示例：

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

每个允许列表条目会跟踪：

- **id**：供 UI 标识使用的稳定 UUID（可选）
- **last used**：上次使用时间戳
- **last used command**
- **last resolved path**

## 自动允许 Skill CLI

启用 **Auto-allow skill CLIs** 后，已知 Skills 引用的可执行文件会在节点上（macOS 节点或无头节点主机）被视为已加入允许列表。这会通过 Gateway RPC 使用 `skills.bins` 获取 skill 二进制列表。如果你想使用严格的手动允许列表，请关闭此选项。

重要信任说明：

- 这是一个**隐式的便捷允许列表**，与手动路径允许列表条目分开。
- 它适用于 Gateway 网关与节点处于同一信任边界内的受信任操作员环境。
- 如果你需要严格的显式信任，请保持 `autoAllowSkills: false`，并仅使用手动路径允许列表条目。

## 安全二进制与审批转发

关于安全二进制（仅 stdin 的快速路径）、解释器绑定细节，以及如何将审批提示转发到 Slack/Discord/Telegram（或将它们作为原生审批客户端运行），请参见 [执行审批——高级](/zh-CN/tools/exec-approvals-advanced)。

<!-- moved to /tools/exec-approvals-advanced -->

## Control UI 编辑

使用 **Control UI → Nodes → Exec approvals** 卡片来编辑默认值、按智能体的覆盖项和允许列表。选择一个作用域（默认值或某个智能体），调整策略，添加 / 删除允许列表模式，然后点击 **Save**。UI 会为每个模式显示 **last used** 元数据，方便你保持列表整洁。

目标选择器可选择 **Gateway**（本地审批）或 **Node**。节点必须声明 `system.execApprovals.get/set`（macOS 应用或无头节点主机）。
如果某个节点尚未声明执行审批，请直接编辑其本地
`~/.openclaw/exec-approvals.json`。

CLI：`openclaw approvals` 支持编辑 gateway 或 node（参见 [Approvals CLI](/zh-CN/cli/approvals)）。

## 审批流程

当需要提示时，gateway 会向操作员客户端广播 `exec.approval.requested`。
Control UI 和 macOS 应用通过 `exec.approval.resolve` 进行处理，然后 gateway 会将已批准的请求转发到节点主机。

对于 `host=node`，审批请求会包含规范化的 `systemRunPlan` 负载。gateway 在转发已批准的 `system.run`
请求时，会将该 plan 作为权威的命令 / cwd / 会话上下文。

这对于异步审批延迟很重要：

- 节点执行路径会预先准备一个规范化 plan
- 审批记录会存储该 plan 及其绑定元数据
- 一旦获批，最终转发的 `system.run` 调用会复用已存储的 plan
  而不是信任调用方后续的修改
- 如果审批请求创建后，调用方更改了 `command`、`rawCommand`、`cwd`、`agentId` 或
  `sessionKey`，gateway 会将该转发运行拒绝为审批不匹配

## 系统事件

执行生命周期会作为系统消息呈现：

- `Exec running`（仅当命令超过“正在运行”通知阈值时显示）
- `Exec finished`
- `Exec denied`

这些消息会在节点上报事件后发布到智能体的会话中。
gateway host 执行审批也会在命令结束时发出相同的生命周期事件（如果运行时间超过阈值，也会在运行中发出可选事件）。
受审批门控的执行会在这些消息中复用审批 id 作为 `runId`，以便轻松关联。

## 审批被拒绝时的行为

当异步执行审批被拒绝时，OpenClaw 会阻止智能体复用该会话中此前同一命令任意一次运行的输出。拒绝原因会连同明确指引一起传递，说明没有可用的命令输出，这样可阻止智能体声称存在新的输出，或使用先前成功运行的陈旧结果重复已被拒绝的命令。

## 影响

- **full** 权限很强；如果可能，优先使用允许列表。
- **ask** 让你保持参与审批流程，同时仍可实现快速审批。
- 按智能体划分的允许列表可防止一个智能体的审批泄漏到其他智能体。
- 审批仅适用于来自**已授权发送方**的主机执行请求。未授权发送方无法发出 `/exec`。
- `/exec security=full` 是面向已授权操作员的会话级便捷方式，并且按设计会跳过审批。若要强制阻止主机执行，请将审批安全性设为 `deny`，或通过工具策略拒绝 `exec` 工具。

## 相关内容

<CardGroup cols={2}>
  <Card title="执行审批——高级" href="/zh-CN/tools/exec-approvals-advanced" icon="gear">
    安全二进制、解释器绑定以及将审批转发到聊天渠道。
  </Card>
  <Card title="Exec 工具" href="/zh-CN/tools/exec" icon="terminal">
    Shell 命令执行工具。
  </Card>
  <Card title="Elevated 模式" href="/zh-CN/tools/elevated" icon="shield-exclamation">
    也会跳过审批的紧急破窗路径。
  </Card>
  <Card title="沙箱隔离" href="/zh-CN/gateway/sandboxing" icon="box">
    沙箱模式与工作区访问。
  </Card>
  <Card title="安全性" href="/zh-CN/gateway/security" icon="lock">
    安全模型与加固。
  </Card>
  <Card title="沙箱隔离 vs 工具策略 vs elevated" href="/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    何时应使用各项控制。
  </Card>
  <Card title="Skills" href="/zh-CN/tools/skills" icon="sparkles">
    由 Skills 支持的自动允许行为。
  </Card>
</CardGroup>

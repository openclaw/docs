---
read_when:
    - 配置执行审批或允许列表
    - 在 macOS 应用中实现执行审批用户体验
    - 审查沙箱逃逸提示及其影响
summary: 执行审批、允许列表和沙箱逃逸提示
title: 执行审批
x-i18n:
    generated_at: "2026-04-23T23:21:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d7c5cd24e7c1831d5a865da6fa20f4c23280a0ec12b9e8f7f3245170a05a37d
    source_path: tools/exec-approvals.md
    workflow: 15
---

执行审批是**配套应用 / 节点主机防护栏**，用于让处于沙箱隔离的智能体在真实主机（`gateway` 或 `node`）上运行命令。它是一个安全联锁机制：只有当策略 + 允许列表 +（可选）用户审批三者全部一致同意时，命令才会被允许执行。执行审批会**叠加在**工具策略和 elevated 门控之上（除非 elevated 设为 `full`，这会跳过审批）。

<Note>
生效策略取 `tools.exec.*` 与审批默认值中**更严格**的一方；如果某个 approvals 字段被省略，则使用 `tools.exec` 的值。主机执行还会使用该机器上的本地 approvals 状态——如果 `~/.openclaw/exec-approvals.json` 中的主机本地 `ask: "always"` 已设置，即使会话或配置默认值请求 `ask: "on-miss"`，也仍然会持续弹出提示。
</Note>

## 检查生效策略

- `openclaw approvals get`、`... --gateway`、`... --node <id|name|ip>` —— 显示请求的策略、主机策略来源，以及最终生效结果。
- `openclaw exec-policy show` —— 显示本地机器上的合并视图。
- `openclaw exec-policy set|preset` —— 一步同时同步本地请求策略和本地主机 approvals 文件。

当本地作用域请求 `host=node` 时，`exec-policy show` 会在运行时将该作用域报告为由节点管理，而不是假装本地 approvals 文件才是事实来源。

如果配套应用 UI **不可用**，任何原本需要弹出提示的请求都会通过 **ask fallback** 处理（默认：拒绝）。

<Tip>
原生聊天审批客户端可以在待审批消息上预置特定渠道的便捷交互。例如，Matrix 会预置反应快捷方式（`✅`
允许一次、`❌` 拒绝、`♾️` 始终允许），同时仍然在消息中保留 `/approve ...`
命令作为后备方式。
</Tip>

## 适用范围

执行审批会在执行主机本地强制生效：

- **Gateway 网关主机** → Gateway 网关机器上的 `openclaw` 进程
- **节点主机** → 节点运行器（macOS 配套应用或无头节点主机）

信任模型说明：

- 通过 Gateway 网关认证的调用方，是该 Gateway 网关的受信任操作员。
- 已配对节点会将这种受信任操作员能力扩展到节点主机。
- 执行审批会降低误执行风险，但它并不是按用户划分的身份验证边界。
- 已批准的节点主机执行会绑定规范化执行上下文：规范化 `cwd`、精确 `argv`、存在时的环境变量绑定，以及适用时固定的可执行文件路径。
- 对于 shell 脚本以及直接调用解释器 / 运行时文件的情况，OpenClaw 还会尝试绑定一个具体的本地文件操作数。如果该绑定文件在审批后、执行前发生变化，则会拒绝执行，而不是执行已漂移的内容。
- 这种文件绑定有意设计为尽力而为，并不是对每一种解释器 / 运行时加载路径的完整语义建模。如果审批模式无法识别出**恰好一个**可绑定的具体本地文件，它会拒绝签发基于审批的执行，而不是假装已经完全覆盖。

macOS 拆分：

- **节点主机服务** 通过本地 IPC 将 `system.run` 转发给 **macOS 应用**。
- **macOS 应用** 负责执行审批并在 UI 上下文中运行命令。

## 设置与存储

审批信息保存在执行主机上的本地 JSON 文件中：

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

如果你希望主机执行在没有审批提示的情况下运行，你必须同时放开**两层**策略：

- OpenClaw 配置中的请求执行策略（`tools.exec.*`）
- `~/.openclaw/exec-approvals.json` 中的主机本地 approvals 策略

现在这已是默认主机行为，除非你显式收紧它：

- `tools.exec.security`: 在 `gateway` / `node` 上设为 `full`
- `tools.exec.ask`: `off`
- 主机 `askFallback`: `full`

重要区别：

- `tools.exec.host=auto` 选择执行运行的位置：有沙箱时在沙箱中，否则在 Gateway 网关上。
- YOLO 选择的是主机执行的审批方式：`security=full` 加 `ask=off`。
- 暴露自身非交互权限模式的基于 CLI 的提供商可以遵循此策略。
  Claude CLI 会在 OpenClaw 的请求执行策略为
  YOLO 时添加 `--permission-mode bypassPermissions`。你可以在
  `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` 下通过显式 Claude 参数覆盖该后端行为，例如
  `--permission-mode default`、`acceptEdits` 或 `bypassPermissions`。
- 在 YOLO 模式下，OpenClaw 不会在已配置的主机执行策略之上，再额外添加独立的启发式命令混淆审批门控或脚本预检拒绝层。
- `auto` 不会让 Gateway 网关路由成为沙箱隔离会话中的免费覆盖选项。允许从 `auto` 发起单次调用的 `host=node` 请求，而只有在没有活动沙箱运行时时，才允许从 `auto` 发起 `host=gateway`。如果你希望获得稳定的非 auto 默认值，请设置 `tools.exec.host` 或显式使用 `/exec host=...`。

如果你想使用更保守的设置，可以将任一层收紧回 `allowlist` / `on-miss`
或 `deny`。

持久化的 Gateway 网关主机 “永不提示” 设置：

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

然后将主机 approvals 文件设置为匹配值：

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

用于在当前机器上设置相同 Gateway 网关主机策略的本地快捷方式：

```bash
openclaw exec-policy preset yolo
```

该本地快捷方式会同时更新：

- 本地 `tools.exec.host/security/ask`
- 本地 `~/.openclaw/exec-approvals.json` 默认值

它有意仅在本地生效。如果你需要远程更改 Gateway 网关主机或节点主机审批，
请继续使用 `openclaw approvals set --gateway` 或
`openclaw approvals set --node <id|name|ip>`。

对于节点主机，请在该节点上应用相同的 approvals 文件：

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
- 节点执行审批会在运行时从节点获取，因此面向节点的更新必须使用 `openclaw approvals --node ...`

仅限当前会话的快捷方式：

- `/exec security=full ask=off` 只会更改当前会话。
- `/elevated full` 是一个紧急放行快捷方式，也会跳过该会话的执行审批。

如果主机 approvals 文件仍然比配置更严格，那么更严格的主机策略依然会生效。

## 策略旋钮

### 安全性（`exec.security`）

- **deny**：阻止所有主机执行请求。
- **allowlist**：仅允许允许列表中的命令。
- **full**：允许所有内容（等同于 elevated）。

### 询问（`exec.ask`）

- **off**：从不提示。
- **on-miss**：仅在允许列表不匹配时提示。
- **always**：每条命令都提示。
- 当生效的 ask 模式为 `always` 时，`allow-always` 的持久信任不会抑制提示

### 询问回退（`askFallback`）

如果需要提示，但没有可达的 UI，则由 fallback 决定：

- **deny**：阻止。
- **allowlist**：仅在允许列表匹配时允许。
- **full**：允许。

### 行内解释器求值加固（`tools.exec.strictInlineEval`）

当 `tools.exec.strictInlineEval=true` 时，即使解释器二进制本身已在允许列表中，OpenClaw 也会将行内代码求值形式视为仅可通过审批执行。

示例：

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

这是针对无法清晰映射到单一稳定文件操作数的解释器加载路径所做的纵深防御。在严格模式下：

- 这些命令仍然需要显式审批；
- `allow-always` 不会自动为它们持久化新的允许列表条目。

## 允许列表（按智能体划分）

允许列表是**按智能体**划分的。如果存在多个智能体，请在 macOS 应用中切换你正在编辑的智能体。模式为**不区分大小写的 glob 匹配**。
模式应解析为**二进制路径**（仅文件名的条目会被忽略）。
旧版 `agents.default` 条目会在加载时迁移到 `agents.main`。
像 `echo ok && pwd` 这样的 shell 链式命令，仍然要求每个顶层片段都满足允许列表规则。

示例：

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

每个允许列表条目会跟踪：

- **id**：用于 UI 标识的稳定 UUID（可选）
- **上次使用**
- **上次使用的命令**
- **上次解析的路径**

## 自动允许技能 CLI

当启用 **Auto-allow skill CLIs** 时，已知 Skills 引用的可执行文件会在节点上（macOS 节点或无头节点主机）被视为已加入允许列表。此功能会通过 Gateway 网关 RPC 使用
`skills.bins` 获取 Skills 二进制列表。如果你希望严格使用手动允许列表，请禁用此项。

重要信任说明：

- 这是一个**隐式的便捷允许列表**，与手动路径允许列表条目分开。
- 它适用于 Gateway 网关与节点位于同一信任边界内的受信任操作员环境。
- 如果你需要严格的显式信任，请保持 `autoAllowSkills: false`，并仅使用手动路径允许列表条目。

## 安全二进制与审批转发

有关安全二进制（仅 stdin 的快速路径）、解释器绑定细节，以及如何将审批提示转发到 Slack/Discord/Telegram（或将它们作为原生审批客户端运行），请参阅 [Exec approvals — advanced](/zh-CN/tools/exec-approvals-advanced)。

<!-- moved to /tools/exec-approvals-advanced -->

## Control UI 编辑

使用 **Control UI → Nodes → Exec approvals** 卡片来编辑默认值、按智能体划分的覆盖项和允许列表。选择一个作用域（默认值或某个智能体），调整策略，
添加 / 删除允许列表模式，然后点击 **Save**。UI 会显示每个模式的**上次使用**元数据，方便你保持列表整洁。

目标选择器可选择 **Gateway**（本地审批）或 **Node**。节点必须声明 `system.execApprovals.get/set`（macOS 应用或无头节点主机）。
如果某个节点尚未声明执行审批，请直接编辑其本地
`~/.openclaw/exec-approvals.json`。

CLI：`openclaw approvals` 支持编辑 gateway 或 node（参见 [Approvals CLI](/zh-CN/cli/approvals)）。

## 审批流程

当需要提示时，Gateway 网关会向操作员客户端广播 `exec.approval.requested`。
Control UI 和 macOS 应用通过 `exec.approval.resolve` 处理它，然后 Gateway 网关将
已批准的请求转发到节点主机。

对于 `host=node`，审批请求包含规范化的 `systemRunPlan` 负载。Gateway 网关在转发已批准的 `system.run`
请求时，会将该计划作为权威的命令 / `cwd` / 会话上下文。

这对异步审批延迟很重要：

- 节点执行路径会预先准备一个规范化计划
- 审批记录会存储该计划及其绑定元数据
- 一旦获批，最终转发的 `system.run` 调用会复用已存储的计划
  而不是信任调用方后续的编辑
- 如果调用方在创建审批请求后更改了 `command`、`rawCommand`、`cwd`、`agentId` 或
  `sessionKey`，Gateway 网关会将转发执行拒绝为审批不匹配

## 系统事件

执行生命周期会以系统消息的形式呈现：

- `Exec running`（仅当命令超过运行中通知阈值时）
- `Exec finished`
- `Exec denied`

这些消息会在节点报告事件后发布到智能体的会话中。
Gateway 网关主机执行审批在命令结束时也会发出相同的生命周期事件（如果运行时间超过阈值，也可选发出运行中事件）。
受审批门控的执行会在这些消息中复用审批 id 作为 `runId`，以便轻松关联。

## 审批被拒绝时的行为

当异步执行审批被拒绝时，OpenClaw 会阻止智能体在会话中复用同一命令任何更早一次运行的输出。拒绝原因会连同明确说明一起传递，指出没有可用的命令输出，从而阻止智能体声称存在新的输出，或在使用先前成功运行留下的陈旧结果时重复被拒绝的命令。

## 影响

- **full** 权限很强；尽可能优先使用允许列表。
- **ask** 可以让你保持知情，同时仍支持快速审批。
- 按智能体划分的允许列表可以防止某个智能体的审批泄漏到其他智能体。
- 审批仅适用于来自**已授权发送方**的主机执行请求。未授权发送方无法发出 `/exec`。
- `/exec security=full` 是面向已授权操作员的会话级便捷方式，并且按设计会跳过审批。要硬性阻止主机执行，请将 approvals security 设为 `deny`，或通过工具策略拒绝 `exec` 工具。

## 相关内容

<CardGroup cols={2}>
  <Card title="Exec approvals — advanced" href="/zh-CN/tools/exec-approvals-advanced" icon="gear">
    安全二进制、解释器绑定，以及向聊天转发审批。
  </Card>
  <Card title="Exec tool" href="/zh-CN/tools/exec" icon="terminal">
    Shell 命令执行工具。
  </Card>
  <Card title="Elevated mode" href="/zh-CN/tools/elevated" icon="shield-exclamation">
    也会跳过审批的紧急放行路径。
  </Card>
  <Card title="Sandboxing" href="/zh-CN/gateway/sandboxing" icon="box">
    沙箱模式与工作区访问。
  </Card>
  <Card title="Security" href="/zh-CN/gateway/security" icon="lock">
    安全模型与加固。
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    何时应使用各类控制方式。
  </Card>
  <Card title="Skills" href="/zh-CN/tools/skills" icon="sparkles">
    基于 Skills 的自动允许行为。
  </Card>
</CardGroup>

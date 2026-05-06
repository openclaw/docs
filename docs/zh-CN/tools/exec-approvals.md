---
read_when:
    - 配置 exec 审批或允许列表
    - 在 macOS 应用中实现 exec 审批用户体验
    - 审查沙箱逃逸提示及其影响
sidebarTitle: Exec approvals
summary: 主机执行审批：策略开关、允许列表和 YOLO/严格工作流
title: 执行审批
x-i18n:
    generated_at: "2026-05-06T03:09:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: c404fbc80624e31603cfc3f9ca6318534d53e0277af107600c726f97e11b223b
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec 批准是**配套应用 / node 主机防护栏**，用于允许沙箱隔离的智能体在真实主机（`gateway` 或 `node`）上运行命令。一个安全联锁机制：只有当策略 + allowlist +（可选）用户批准全部一致时，命令才会被允许。Exec 批准叠加在工具策略和提权门控**之上**（除非 elevated 设置为 `full`，此时会跳过批准）。

<Note>
有效策略是 `tools.exec.*` 和批准默认值中**更严格**的一个；如果省略了某个批准字段，则使用 `tools.exec` 值。主机 exec 还会使用该机器上的本地批准状态 - 如果 `~/.openclaw/exec-approvals.json` 中存在主机本地的 `ask: "always"`，即使会话或配置默认值请求 `ask: "on-miss"`，它仍会继续提示。
</Note>

## 检查有效策略

| 命令                                                             | 显示内容                                                                               |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | 请求的策略、主机策略来源以及有效结果。                                                 |
| `openclaw exec-policy show`                                      | 本地机器合并视图。                                                                     |
| `openclaw exec-policy set` / `preset`                            | 一步将本地请求策略与本地主机批准文件同步。                                             |

当本地作用域请求 `host=node` 时，`exec-policy show` 会报告该作用域在运行时由 node 管理，而不是假装本地批准文件是真相来源。

如果配套应用 UI **不可用**，任何通常会提示的请求都会由 **ask 回退**处理（默认：`deny`）。

<Tip>
原生聊天批准客户端可以在待处理批准消息上植入特定于渠道的便捷操作。例如，Matrix 会植入反应快捷方式（`✅` 允许一次，`❌` 拒绝，`♾️` 始终允许），同时仍在消息中保留 `/approve ...` 命令作为回退。
</Tip>

## 适用位置

Exec 批准在执行主机上本地强制执行：

- **Gateway 网关主机** → Gateway 网关机器上的 `openclaw` 进程。
- **Node 主机** → node runner（macOS 配套应用或无头 node 主机）。

### 信任模型

- 通过 Gateway 网关认证的调用方是该 Gateway 网关的可信操作者。
- 已配对节点会将该可信操作者能力扩展到 node 主机。
- Exec 批准会降低意外执行风险，但**不是**按用户划分的鉴权边界。
- 已批准的 node 主机运行会绑定规范执行上下文：规范 cwd、精确 argv、存在时的 env 绑定，以及适用时固定的可执行文件路径。
- 对于 shell 脚本和直接解释器/运行时文件调用，OpenClaw 还会尝试绑定一个具体的本地文件操作数。如果该绑定文件在批准后、执行前发生变化，运行会被拒绝，而不是执行已漂移的内容。
- 文件绑定有意保持尽力而为，**不是**对每个解释器/运行时加载器路径的完整语义模型。如果批准模式无法识别出恰好一个可绑定的具体本地文件，它会拒绝创建由批准背书的运行，而不是假装完全覆盖。

### macOS 拆分

- **node 主机服务**通过本地 IPC 将 `system.run` 转发给 **macOS 应用**。
- **macOS 应用**强制执行批准，并在 UI 上下文中执行命令。

## 设置和存储

批准位于执行主机上的本地 JSON 文件中：

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

## 策略旋钮

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - 阻止所有主机 exec 请求。
  - `allowlist` - 只允许 allowlist 中的命令。
  - `full` - 允许所有内容（等同于 elevated）。

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - 从不提示。
  - `on-miss` - 仅在 allowlist 不匹配时提示。
  - `always` - 对每条命令都提示。当有效 ask 模式为 `always` 时，`allow-always` 持久信任**不会**抑制提示。

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  当需要提示但无法访问 UI 时的解析方式。

- `deny` - 阻止。
- `allowlist` - 仅在 allowlist 匹配时允许。
- `full` - 允许。

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  当为 `true` 时，OpenClaw 会将内联代码求值形式视为仅可通过批准运行，即使解释器二进制文件本身在 allowlist 中。这是针对无法干净映射到一个稳定文件操作数的解释器加载器的纵深防御。
</ParamField>

严格模式会捕获的示例：

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

在严格模式下，这些命令仍需要显式批准，并且 `allow-always` 不会自动为它们持久化新的 allowlist 条目。

## YOLO 模式（无批准）

如果你希望主机 exec 在没有批准提示的情况下运行，必须打开**两个**策略层 - OpenClaw 配置中的请求 exec 策略（`tools.exec.*`）**以及** `~/.openclaw/exec-approvals.json` 中的主机本地批准策略。

除非你显式收紧，否则 YOLO 是默认主机行为：

| 层                    | YOLO 设置                  |
| --------------------- | -------------------------- |
| `tools.exec.security` | `gateway`/`node` 上为 `full` |
| `tools.exec.ask`      | `off`                      |
| 主机 `askFallback`    | `full`                     |

<Warning>
**重要区别：**

- `tools.exec.host=auto` 选择 exec **在哪里**运行：可用时在沙箱中，否则在 Gateway 网关上。
- YOLO 选择主机 exec **如何**被批准：`security=full` 加 `ask=off`。
- 在 YOLO 模式下，OpenClaw **不会**在已配置的主机 exec 策略之上添加单独的启发式命令混淆批准门控或脚本预检拒绝层。
- `auto` 不会让 Gateway 网关路由成为从沙箱隔离会话发起的免费覆盖。从 `auto` 发出的按调用 `host=node` 请求是允许的；只有在没有活动沙箱运行时时，从 `auto` 发出的 `host=gateway` 才被允许。若需要稳定的非 auto 默认值，请设置 `tools.exec.host`，或显式使用 `/exec host=...`。

</Warning>

暴露自身非交互式权限模式的 CLI 支持提供商可以遵循此策略。当 OpenClaw 的请求 exec 策略为 YOLO 时，Claude CLI 会添加 `--permission-mode bypassPermissions`。可在 `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` 下使用显式 Claude 参数覆盖该后端行为 - 例如 `--permission-mode default`、`acceptEdits` 或 `bypassPermissions`。

如果你想要更保守的设置，请将任一层收紧回 `allowlist` / `on-miss` 或 `deny`。

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
  <Step title="匹配主机批准文件">
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

它有意仅限本地。若要远程更改 Gateway 网关主机或 node 主机批准，请使用 `openclaw approvals set --gateway` 或 `openclaw approvals set --node <id|name|ip>`。

### Node 主机

对于 node 主机，请改为在该 node 上应用相同的批准文件：

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

- `openclaw exec-policy` 不会同步 node 批准。
- `openclaw exec-policy set --host node` 会被拒绝。
- Node exec 批准会在运行时从 node 获取，因此面向 node 的更新必须使用 `openclaw approvals --node ...`。

</Note>

### 仅会话快捷方式

- `/exec security=full ask=off` 仅更改当前会话。
- `/elevated full` 是一个紧急快捷方式，也会跳过该会话的 exec 批准。

如果主机批准文件仍然比配置更严格，则更严格的主机策略仍会胜出。

## Allowlist（按智能体）

Allowlist **按智能体**划分。如果存在多个智能体，请在 macOS 应用中切换正在编辑的智能体。模式是 glob 匹配。

模式可以是解析后的二进制文件路径 glob，也可以是裸命令名 glob。裸名称只匹配通过 `PATH` 调用的命令，因此当命令为 `rg` 时，`rg` 可以匹配 `/opt/homebrew/bin/rg`，但**不能**匹配 `./rg` 或 `/tmp/rg`。当你想信任某个特定二进制文件位置时，请使用路径 glob。

旧版 `agents.default` 条目会在加载时迁移到 `agents.main`。诸如 `echo ok && pwd` 的 shell 链仍需要每个顶层片段都满足 allowlist 规则。

示例：

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### 使用 argPattern 限制参数

当 allowlist 条目应匹配某个二进制文件和特定参数形状时，添加 `argPattern`。OpenClaw 会针对解析后的命令参数评估正则表达式，不包括可执行文件令牌（`argv[0]`）。对于手写条目，参数会用单个空格连接，因此当你需要精确匹配时请锚定该模式。

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

该条目允许 `python3 safe.py`；`python3 other.py` 是 allowlist 未命中。如果同一二进制文件也存在仅路径条目，未匹配的参数仍可回退到该仅路径条目。当目标是将该二进制文件限制为声明的参数时，请省略仅路径条目。

由批准流程保存的条目可以使用内部分隔符格式来进行精确 argv 匹配。优先使用 UI 或批准流程重新生成这些条目，而不是手动编辑编码值。如果 OpenClaw 无法解析某个命令片段的 argv，带有 `argPattern` 的条目不会匹配。

每个 allowlist 条目都支持：

| 字段              | 含义                                                       |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | 已解析的二进制路径 glob，或裸命令名称 glob           |
| `argPattern`       | 可选的 argv 正则表达式；省略的条目仅匹配路径            |
| `id`               | 用于 UI 标识的稳定 UUID                              |
| `source`           | 条目来源，例如 `allow-always`                          |
| `commandText`      | 审批流程创建条目时捕获的命令文本 |
| `lastUsedAt`       | 最近使用时间戳                                           |
| `lastUsedCommand`  | 最近匹配的命令                                     |
| `lastResolvedPath` | 最近解析出的二进制路径                                     |

## 自动允许技能 CLI

启用 **自动允许技能 CLI** 后，已知 Skills 引用的可执行文件会在节点（macOS 节点或无头节点主机）上视为已加入允许列表。这会通过 Gateway RPC 使用 `skills.bins` 获取技能二进制列表。如果你想使用严格的手动允许列表，请禁用此项。

<Warning>
- 这是一个**隐式便利允许列表**，独立于手动路径允许列表条目。
- 它面向可信操作员环境，其中 Gateway 网关和节点位于同一信任边界内。
- 如果你需要严格的显式信任，请保持 `autoAllowSkills: false`，并且只使用手动路径允许列表条目。

</Warning>

## 安全二进制和审批转发

有关安全二进制（仅 stdin 快速路径）、解释器绑定细节，以及如何将审批提示转发到 Slack/Discord/Telegram（或将它们作为原生审批客户端运行），请参阅 [Exec approvals - advanced](/zh-CN/tools/exec-approvals-advanced)。

## Control UI 编辑

使用 **Control UI → Nodes → Exec approvals** 卡片来编辑默认值、按智能体覆盖项和允许列表。选择一个作用域（默认值或某个智能体），调整策略，添加/移除允许列表模式，然后点击 **Save**。UI 会按模式显示最近使用的元数据，方便你保持列表整洁。

目标选择器可选择 **Gateway**（本地审批）或 **Node**。节点必须声明 `system.execApprovals.get/set`（macOS 应用或无头节点主机）。如果某个节点尚未声明 exec 审批，请直接编辑它的本地 `~/.openclaw/exec-approvals.json`。

CLI：`openclaw approvals` 支持编辑 Gateway 网关或节点，请参阅 [Approvals CLI](/zh-CN/cli/approvals)。

## 审批流程

需要提示时，Gateway 网关会向操作员客户端广播 `exec.approval.requested`。Control UI 和 macOS 应用会通过 `exec.approval.resolve` 解析它，然后 Gateway 网关将已批准的请求转发给节点主机。

对于 `host=node`，审批请求包含一个规范的 `systemRunPlan` 载荷。Gateway 网关在转发已批准的 `system.run` 请求时，会将该计划作为权威的 command/cwd/session 上下文。

这对异步审批延迟很重要：

- 节点 exec 路径会预先准备一个规范计划。
- 审批记录会存储该计划及其绑定元数据。
- 批准后，最终转发的 `system.run` 调用会复用已存储的计划，而不是信任后续调用方的编辑。
- 如果调用方在审批请求创建后更改了 `command`、`rawCommand`、`cwd`、`agentId` 或 `sessionKey`，Gateway 网关会以审批不匹配为由拒绝转发的运行。

## 系统事件

Exec 生命周期会以系统消息形式呈现：

- `Exec running`（仅当命令超过运行通知阈值时）。
- `Exec finished`。
- `Exec denied`。

这些消息会在节点报告事件后发布到智能体的会话。Gateway 网关主机 exec 审批会在命令完成时触发相同的生命周期事件（并且在运行时间超过阈值时可选触发运行中事件）。受审批保护的 exec 会在这些消息中复用审批 ID 作为 `runId`，便于关联。

## 审批被拒绝时的行为

当异步 exec 审批被拒绝时，OpenClaw 会阻止智能体在该会话中复用同一命令早先任何运行的输出。拒绝原因会附带明确指导，说明没有可用的命令输出，从而阻止智能体声称有新输出，或使用先前成功运行的陈旧结果重复被拒绝的命令。

## 影响

- **`full`** 功能很强；尽可能优先使用允许列表。
- **`ask`** 让你保持在流程中，同时仍允许快速审批。
- 按智能体设置的允许列表可防止一个智能体的审批泄漏到其他智能体。
- 审批只适用于来自**已授权发送方**的主机 exec 请求。未授权发送方无法发起 `/exec`。
- `/exec security=full` 是面向已授权操作员的会话级便利功能，按设计会跳过审批。若要硬性阻止主机 exec，请将审批安全级别设置为 `deny`，或通过工具策略拒绝 `exec` 工具。

## 相关

<CardGroup cols={2}>
  <Card title="Exec approvals - advanced" href="/zh-CN/tools/exec-approvals-advanced" icon="gear">
    安全二进制、解释器绑定，以及向聊天转发审批。
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
    何时使用各类控制。
  </Card>
  <Card title="Skills" href="/zh-CN/tools/skills" icon="sparkles">
    Skills 支持的自动允许行为。
  </Card>
</CardGroup>

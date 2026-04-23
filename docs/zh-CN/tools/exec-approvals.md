---
read_when:
    - 配置执行审批或允许列表
    - 在 macOS 应用中实现执行审批 UX
    - 审查沙箱逃逸提示及其影响
summary: 执行审批、允许列表和沙箱逃逸提示
title: 执行审批
x-i18n:
    generated_at: "2026-04-23T17:12:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b86106d3a145047ab2400d45aece0a66c7ec5ea4785e7538476c55477aab087
    source_path: tools/exec-approvals.md
    workflow: 15
---

# 执行审批

执行审批是让经过沙箱隔离的智能体在真实主机（`gateway` 或 `node`）上运行命令时的**配套应用 / 节点主机护栏**。它是一种安全联锁机制：只有当策略 + 允许列表 +（可选）用户审批全部同意时，命令才会被允许。执行审批叠加在工具策略和提权门控**之上**（除非提权设置为 `full`，此时会跳过审批）。

<Note>
生效策略是 `tools.exec.*` 与审批默认值中**更严格**的那个；如果审批字段被省略，则使用 `tools.exec` 的值。主机执行还会使用该机器上的本地审批状态——如果 `~/.openclaw/exec-approvals.json` 中主机本地设置了 `ask: "always"`，即使会话或配置默认值请求 `ask: "on-miss"`，也仍然会持续提示。
</Note>

## 检查生效策略

- `openclaw approvals get`、`... --gateway`、`... --node <id|name|ip>` —— 显示请求的策略、主机策略来源以及生效结果。
- `openclaw exec-policy show` —— 本地机器上的合并视图。
- `openclaw exec-policy set|preset` —— 一步将本地请求策略与本地主机审批文件同步。

当本地作用域请求 `host=node` 时，`exec-policy show` 会在运行时将该作用域报告为由节点管理，而不是假装本地审批文件是真实来源。

如果配套应用 UI **不可用**，任何通常会触发提示的请求都会由 **ask fallback** 处理（默认值：deny）。

<Tip>
原生聊天审批客户端可以为待处理的审批消息预置特定渠道的交互方式。例如，Matrix 会预置反应快捷方式（`✅` 允许一次、`❌` 拒绝、`♾️` 始终允许），同时仍保留消息中的 `/approve ...` 命令作为后备方案。
</Tip>

## 适用范围

执行审批会在执行所在主机上本地强制实施：

- **Gateway 网关主机** → Gateway 网关机器上的 `openclaw` 进程
- **节点主机** → 节点运行器（macOS 配套应用或无头节点主机）

信任模型说明：

- 通过 Gateway 网关认证的调用方，是该 Gateway 网关的受信操作员。
- 已配对节点会将这种受信操作员能力扩展到节点主机。
- 执行审批可降低意外执行风险，但不是按用户划分的认证边界。
- 已批准的节点主机运行会绑定规范执行上下文：规范 cwd、精确 argv、存在时的环境变量绑定，以及适用时固定的可执行文件路径。
- 对于 shell 脚本和直接解释器 / 运行时文件调用，OpenClaw 还会尝试绑定一个具体的本地文件操作数。如果该绑定文件在批准后、执行前发生变化，将拒绝运行，而不是执行已漂移的内容。
- 这种文件绑定有意采用尽力而为方式，并不是对每一种解释器 / 运行时加载路径的完整语义模型。如果审批模式无法准确识别并绑定**唯一一个**具体本地文件，它会拒绝签发基于审批的运行，而不是假装实现了完整覆盖。

macOS 拆分：

- **节点主机服务** 通过本地 IPC 将 `system.run` 转发给 **macOS 应用**。
- **macOS 应用** 负责执行审批 + 在 UI 上下文中执行命令。

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

## 无审批的 “YOLO” 模式

如果你希望主机执行在没有审批提示的情况下运行，你必须同时放开**两层**策略：

- OpenClaw 配置中的请求执行策略（`tools.exec.*`）
- `~/.openclaw/exec-approvals.json` 中主机本地的审批策略

这现在是默认的主机行为，除非你显式收紧它：

- `tools.exec.security`：在 `gateway` / `node` 上设为 `full`
- `tools.exec.ask`：设为 `off`
- 主机 `askFallback`：设为 `full`

重要区别：

- `tools.exec.host=auto` 选择执行运行的位置：如果有沙箱则在沙箱中，否则在 Gateway 网关上。
- YOLO 选择主机执行如何获批：`security=full` 加 `ask=off`。
- 在 YOLO 模式下，OpenClaw 不会在已配置的主机执行策略之上，再额外添加独立的启发式命令混淆审批门控或脚本预检拒绝层。
- `auto` 不会让来自沙箱会话的 Gateway 网关路由变成一个免费覆盖项。允许在 `auto` 下按次请求 `host=node`；只有在没有活动沙箱运行时时，才允许在 `auto` 下请求 `host=gateway`。如果你想使用稳定的非 auto 默认值，请设置 `tools.exec.host`，或显式使用 `/exec host=...`。

如果你想使用更保守的设置，可将任一层重新收紧为 `allowlist` / `on-miss`
或 `deny`。

持久的 Gateway 网关主机“永不提示”设置：

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

然后将主机审批文件设为匹配：

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

在当前机器上应用相同 Gateway 网关主机策略的本地快捷方式：

```bash
openclaw exec-policy preset yolo
```

该本地快捷方式会同时更新：

- 本地 `tools.exec.host/security/ask`
- 本地 `~/.openclaw/exec-approvals.json` 默认值

它有意仅作用于本地。如果你需要远程修改 Gateway 网关主机或节点主机审批，请继续使用 `openclaw approvals set --gateway` 或
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
- 节点执行审批会在运行时从节点拉取，因此面向节点的更新必须使用 `openclaw approvals --node ...`

仅会话快捷方式：

- `/exec security=full ask=off` 仅更改当前会话。
- `/elevated full` 是一种破窗应急快捷方式，也会对该会话跳过执行审批。

如果主机审批文件仍比配置更严格，则更严格的主机策略仍然优先。

## 策略选项

### 安全级别（`exec.security`）

- **deny**：阻止所有主机执行请求。
- **allowlist**：只允许允许列表中的命令。
- **full**：允许所有内容（等同于 elevated）。

### 询问方式（`exec.ask`）

- **off**：从不提示。
- **on-miss**：仅在允许列表未匹配时提示。
- **always**：每条命令都提示。
- 当生效的询问模式为 `always` 时，`allow-always` 持久信任不会抑制提示

### 提示后备（`askFallback`）

如果需要提示但没有可访问的 UI，则由后备策略决定：

- **deny**：阻止。
- **allowlist**：仅当允许列表匹配时允许。
- **full**：允许。

### 内联解释器 eval 加固（`tools.exec.strictInlineEval`）

当 `tools.exec.strictInlineEval=true` 时，OpenClaw 会将内联代码 eval 形式视为仅可通过审批运行，即使解释器二进制本身已在允许列表中。

示例：

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

这是针对无法清晰映射到单一稳定文件操作数的解释器加载器所做的纵深防御。在严格模式下：

- 这些命令仍然需要显式审批；
- `allow-always` 不会自动为它们持久化新的允许列表条目。

## 允许列表（按智能体）

允许列表是**按智能体**划分的。如果存在多个智能体，请在 macOS 应用中切换你正在编辑的智能体。模式采用**不区分大小写的 glob 匹配**。模式应解析为**二进制路径**（仅包含 basename 的条目会被忽略）。旧版 `agents.default` 条目会在加载时迁移到 `agents.main`。
像 `echo ok && pwd` 这样的 shell 链仍要求每个顶层片段都满足允许列表规则。

示例：

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

每个允许列表条目会跟踪：

- **id**：用于 UI 标识的稳定 UUID（可选）
- **上次使用**
- **上次使用的命令**
- **上次解析出的路径**

## 自动允许 Skills CLI

启用 **Auto-allow skill CLIs** 后，已知 Skills 引用的可执行文件会在节点上（macOS 节点或无头节点主机）被视为已加入允许列表。它通过 Gateway RPC 中的 `skills.bins` 获取 skill bin 列表。如果你想使用严格的手动允许列表，请禁用此功能。

重要信任说明：

- 这是一个**隐式的便捷允许列表**，与手动路径允许列表条目分开。
- 它面向 Gateway 网关与节点处于同一信任边界中的受信操作环境。
- 如果你要求严格的显式信任，请保持 `autoAllowSkills: false`，并仅使用手动路径允许列表条目。

## 安全二进制（仅 stdin）

`tools.exec.safeBins` 定义了一小组**仅 stdin** 的二进制文件（例如 `cut`），它们可以在 `allowlist` 模式下**无需**显式允许列表条目运行。安全二进制会拒绝位置文件参数和类似路径的 token，因此它们只能处理传入的数据流。应将其视为流过滤器的狭窄快速通道，而不是通用信任列表。

<Warning>
**不要**将解释器或运行时二进制（例如 `python3`、`node`、
`ruby`、`bash`、`sh`、`zsh`）添加到 `safeBins`。如果某个命令按设计可以执行代码求值、执行子命令或读取文件，应优先使用显式允许列表条目，并保持审批提示启用。自定义安全二进制必须在 `tools.exec.safeBinProfiles.<bin>` 中定义显式配置。
</Warning>

默认安全二进制：

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` 和 `sort` 不在默认列表中。如果你选择启用它们，请为其非 stdin 工作流保留显式允许列表条目。对于处于安全二进制模式下的 `grep`，请使用 `-e` / `--regexp` 提供模式；位置模式形式会被拒绝，因此无法将文件操作数伪装成有歧义的位置参数。

<AccordionGroup>
  <Accordion title="Argv 验证和被拒绝的标志">
    验证仅依据 argv 形状进行确定性判断（不检查主机文件系统中的文件是否存在），从而避免因允许 / 拒绝差异而产生文件存在性预言机行为。默认安全二进制会拒绝面向文件的选项；长选项采用失败关闭方式验证（未知标志和有歧义的缩写都会被拒绝）。

    按安全二进制配置划分的被拒绝标志：

    [//]: # "SAFE_BIN_DENIED_FLAGS:START"

    - `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
    - `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
    - `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
    - `wc`: `--files0-from`

    [//]: # "SAFE_BIN_DENIED_FLAGS:END"

    安全二进制还会在执行时强制将 argv token 视为**字面文本**来处理（对仅 stdin 片段不进行 glob 展开，也不进行 `$VARS` 展开），因此像 `*` 或 `$HOME/...` 这样的模式无法被用来伪装文件读取。

  </Accordion>

  <Accordion title="受信任的二进制目录">
    安全二进制必须从受信任的二进制目录解析（系统默认目录
    加上可选的 `tools.exec.safeBinTrustedDirs`）。`PATH` 条目绝不会
    自动视为受信任。默认受信任目录有意保持最小范围：
    `/bin`、`/usr/bin`。如果你的安全二进制可执行文件位于
    包管理器 / 用户路径中（例如 `/opt/homebrew/bin`、
    `/usr/local/bin`、`/opt/local/bin`、`/snap/bin`），请将它们显式添加到
    `tools.exec.safeBinTrustedDirs`。
  </Accordion>

  <Accordion title="Shell 链接、包装器和多路复用器">
    允许使用 shell 链接（`&&`、`||`、`;`），前提是每个顶层片段
    都满足允许列表要求（包括安全二进制或 Skills 自动允许）。
    在 `allowlist` 模式下，重定向仍不受支持。命令替换
    （`$()` / 反引号）会在允许列表解析期间被拒绝，包括双引号内部；
    如果你需要字面量 `$()` 文本，请使用单引号。

    在 macOS 配套应用审批中，包含 shell 控制符
    或展开语法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、
    `)`）的原始 shell 文本会被视为允许列表未命中，除非 shell 二进制本身已在
    允许列表中。

    对于 shell 包装器（`bash|sh|zsh ... -c/-lc`），请求作用域的 env
    覆盖会被缩减为一个小型显式允许列表（`TERM`、`LANG`、
    `LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。

    对于 `allowlist` 模式下的 `allow-always` 决策，已知分发包装器
    （`env`、`nice`、`nohup`、`stdbuf`、`timeout`）会持久化内部可执行文件
    路径，而不是包装器路径。Shell 多路复用器（`busybox`、`toybox`）
    对 shell applet（`sh`、`ash` 等）也会以相同方式解包。如果某个
    包装器或多路复用器无法被安全解包，就不会自动持久化任何允许列表条目。

    如果你将 `python3` 或 `node` 之类的解释器加入允许列表，建议优先设置
    `tools.exec.strictInlineEval=true`，这样内联 eval 仍然需要显式审批。
    在严格模式下，`allow-always` 仍可持久化无害的
    解释器 / 脚本调用，但内联 eval 载体不会被自动持久化。

  </Accordion>
</AccordionGroup>

### 安全二进制与允许列表

| 主题 | `tools.exec.safeBins` | 允许列表（`exec-approvals.json`） |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| 目标 | 自动允许狭义的 stdin 过滤器 | 显式信任特定可执行文件 |
| 匹配类型 | 可执行文件名 + 安全二进制 argv 策略 | 已解析的可执行文件路径 glob 模式 |
| 参数范围 | 受安全二进制配置和字面 token 规则限制 | 仅匹配路径；其他参数由你自行负责 |
| 典型示例 | `head`、`tail`、`tr`、`wc` | `jq`、`python3`、`node`、`ffmpeg`、自定义 CLI |
| 最佳用途 | 管道中的低风险文本转换 | 任何具有更广泛行为或副作用的工具 |

配置位置：

- `safeBins` 来自配置（`tools.exec.safeBins` 或按智能体的 `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` 来自配置（`tools.exec.safeBinTrustedDirs` 或按智能体的 `agents.list[].tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` 来自配置（`tools.exec.safeBinProfiles` 或按智能体的 `agents.list[].tools.exec.safeBinProfiles`）。按智能体的配置键会覆盖全局键。
- 允许列表条目存储在主机本地 `~/.openclaw/exec-approvals.json` 的 `agents.<id>.allowlist` 下（或通过 Control UI / `openclaw approvals allowlist ...`）。
- 当解释器 / 运行时二进制出现在 `safeBins` 中但没有显式配置时，`openclaw security audit` 会通过 `tools.exec.safe_bins_interpreter_unprofiled` 发出警告。
- `openclaw doctor --fix` 可以为缺失的自定义 `safeBinProfiles.<bin>` 条目生成 `{}` 脚手架（之后请审查并收紧）。解释器 / 运行时二进制不会被自动生成脚手架。

自定义配置示例：
__OC_I18N_900005__
如果你显式将 `jq` 加入 `safeBins`，OpenClaw 在安全二进制
模式下仍会拒绝 `env` 内建命令，因此 `jq -n env` 无法在没有显式允许列表路径
或审批提示的情况下转储主机进程环境。

## 在 Control UI 中编辑

使用 **Control UI → Nodes → 执行审批** 卡片来编辑默认值、按智能体
覆盖项和允许列表。选择一个作用域（默认值或某个智能体），调整策略，
添加 / 删除允许列表模式，然后点击 **Save**。UI 会显示每个模式的**上次使用**
元数据，便于你保持列表整洁。

目标选择器可选择 **Gateway**（本地审批）或 **Node**。节点
必须声明 `system.execApprovals.get/set`（macOS 应用或无头节点主机）。
如果某个节点尚未声明执行审批，请直接编辑其本地
`~/.openclaw/exec-approvals.json`。

CLI：`openclaw approvals` 支持编辑 Gateway 网关或节点（参见 [Approvals CLI](/cli/approvals)）。

## 审批流程

当需要提示时，Gateway 网关会向操作员客户端广播 `exec.approval.requested`。
Control UI 和 macOS 应用通过 `exec.approval.resolve` 处理该请求，然后 Gateway 网关再将
已批准的请求转发到节点主机。

对于 `host=node`，审批请求包含一个规范的 `systemRunPlan` 载荷。Gateway 网关会在转发已批准的 `system.run`
请求时，将该计划作为权威的 command / cwd / session 上下文。

这对异步审批延迟很重要：

- 节点执行路径会预先准备一个规范计划
- 审批记录会存储该计划及其绑定元数据
- 一旦获批，最终转发的 `system.run` 调用会复用已存储的计划
  ，而不是信任之后调用方的修改
- 如果调用方在创建审批请求后更改了 `command`、`rawCommand`、`cwd`、`agentId` 或
  `sessionKey`，Gateway 网关会将转发的运行拒绝为审批不匹配

## 解释器 / 运行时命令

基于审批的解释器 / 运行时执行有意采用保守策略：

- 始终绑定精确的 argv / cwd / env 上下文。
- 直接 shell 脚本和直接运行时文件形式会尽力绑定到一个具体的本地
  文件快照。
- 常见的包管理器包装形式如果最终仍解析到一个直接本地文件（例如
  `pnpm exec`、`pnpm node`、`npm exec`、`npx`），则会在绑定前解包。
- 如果 OpenClaw 无法为解释器 / 运行时命令准确识别**唯一一个**具体本地文件
  （例如包脚本、eval 形式、运行时特定加载链或含糊的多文件
  形式），则会拒绝基于审批的执行，而不是声称提供了并不具备的语义覆盖。
- 对于这些工作流，建议优先使用沙箱隔离、单独的主机边界，或显式的受信任
  allowlist / full 工作流，由操作员接受更宽泛的运行时语义。

当需要审批时，执行工具会立即返回一个审批 id。使用该 id 来关联后续系统事件
（`Exec finished` / `Exec denied`）。如果在超时前没有收到决策，
该请求会被视为审批超时，并显示为一个拒绝原因。

### 后续消息投递行为

在已批准的异步执行完成后，OpenClaw 会向同一会话发送一个后续 `agent` 轮次。

- 如果存在有效的外部投递目标（可投递渠道加目标 `to`），后续消息会通过该渠道投递。
- 在仅 webchat 或无外部目标的内部会话流中，后续消息仅保留在会话内（`deliver: false`）。
- 如果调用方显式请求严格的外部投递，但没有可解析的外部渠道，则请求会以 `INVALID_REQUEST` 失败。
- 如果启用了 `bestEffortDeliver` 且无法解析任何外部渠道，投递将降级为仅会话内，而不是失败。

确认对话框包含：

- command + args
- cwd
- 智能体 id
- 已解析的可执行文件路径
- host + 策略元数据

操作：

- **Allow once** → 立即运行
- **Always allow** → 加入允许列表 + 运行
- **Deny** → 阻止

## 将审批转发到聊天渠道

你可以将执行审批提示转发到任意聊天渠道（包括渠道插件），并通过 `/approve` 完成审批。
这使用的是正常的出站投递流水线。

配置：
__OC_I18N_900006__
在聊天中回复：
__OC_I18N_900007__
`/approve` 命令同时处理执行审批和插件审批。如果该 ID 不匹配任何待处理的执行审批，它会自动继续检查插件审批。

### 插件审批转发

插件审批转发使用与执行审批相同的投递流水线，但它在 `approvals.plugin` 下拥有自己
独立的配置。启用或禁用一方不会影响另一方。
__OC_I18N_900008__
其配置结构与 `approvals.exec` 完全一致：`enabled`、`mode`、`agentFilter`、
`sessionFilter` 和 `targets` 的工作方式相同。

支持共享交互式回复的渠道，会为执行审批和插件
审批都渲染相同的审批按钮。不支持共享交互式 UI 的渠道会回退为纯文本，并附带 `/approve`
说明。

### 任意渠道中的同聊天审批

当执行或插件审批请求来自一个可投递的聊天界面时，现在默认可以在同一聊天中
通过 `/approve` 完成审批。这适用于 Slack、Matrix 和 Microsoft Teams 等渠道，
同时也适用于现有的 Web UI 和终端 UI 流程。

这条共享的文本命令路径使用该会话的正常渠道认证模型。如果发起聊天本来就可以发送命令并接收回复，那么审批请求就不再需要单独的原生投递适配器来保持待处理状态。

Discord 和 Telegram 也支持同聊天 `/approve`，但即使禁用了原生审批投递，这些渠道在授权时仍会使用其
已解析的 approver 列表。

对于 Telegram 以及其他直接调用 Gateway 网关的原生审批客户端，
这种后备路径有意仅限于“未找到审批”失败。真正的
执行审批拒绝 / 错误不会被静默重试为插件审批。

### 原生审批投递

某些渠道也可以充当原生审批客户端。原生客户端会在共享的同聊天 `/approve`
流程之上，增加 approver 私信、原始聊天扇出以及渠道特定的交互式审批 UX。

当原生审批卡片 / 按钮可用时，该原生 UI 是面向
智能体的主要路径。除非工具结果说明聊天审批不可用或
手动审批是唯一剩余路径，否则智能体不应再额外回显重复的纯聊天
`/approve` 命令。

通用模型：

- 主机执行策略仍决定是否需要执行审批
- `approvals.exec` 控制是否将审批提示转发到其他聊天目标
- `channels.<channel>.execApprovals` 控制该渠道是否充当原生审批客户端

当满足以下所有条件时，原生审批客户端会自动启用私信优先投递：

- 该渠道支持原生审批投递
- approver 可通过显式 `execApprovals.approvers` 或该
  渠道文档说明的后备来源进行解析
- `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"`

将 `enabled: false` 设为显式禁用某个原生审批客户端。将 `enabled: true` 设为在 approver 可解析时强制
启用。公共原始聊天投递仍通过
`channels.<channel>.execApprovals.target` 显式控制。

常见问题：[为什么聊天审批有两个执行审批配置？](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord：`channels.discord.execApprovals.*`
- Slack：`channels.slack.execApprovals.*`
- Telegram：`channels.telegram.execApprovals.*`

这些原生审批客户端会在共享的
同聊天 `/approve` 流程和共享审批按钮之上，增加私信路由和可选的渠道扇出。

共享行为：

- Slack、Matrix、Microsoft Teams 以及类似的可投递聊天会对同聊天 `/approve` 使用正常的渠道认证模型
- 当原生审批客户端自动启用时，默认的原生投递目标是 approver 私信
- 对于 Discord 和 Telegram，只有已解析的 approver 才能批准或拒绝
- Discord approver 可以是显式配置（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Telegram approver 可以是显式配置（`execApprovals.approvers`），也可以从现有 owner 配置推断（`allowFrom`，以及在支持时用于私信的 `defaultTo`）
- Slack approver 可以是显式配置（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Slack 原生按钮会保留审批 id 类型，因此 `plugin:` id 可以解析插件审批，
  无需第二层 Slack 本地后备逻辑
- Matrix 原生私信 / 渠道路由和反应快捷方式同时处理执行审批和插件审批；
  插件授权仍来自 `channels.matrix.dm.allowFrom`
- 请求者不需要是 approver
- 当原始聊天本身已支持命令和回复时，该聊天可以直接通过 `/approve` 完成审批
- 原生 Discord 审批按钮按审批 id 类型路由：`plugin:` id 会
  直接进入插件审批，其余所有内容进入执行审批
- 原生 Telegram 审批按钮遵循与 `/approve` 相同的、受限的 exec 到插件后备逻辑
- 当原生 `target` 启用原始聊天投递时，审批提示会包含命令文本
- 待处理的执行审批默认会在 30 分钟后过期
- 如果没有操作员 UI 或已配置的审批客户端可以接受请求，提示将回退到 `askFallback`

Telegram 默认发送到 approver 私信（`target: "dm"`）。当你
希望审批提示也出现在发起的 Telegram 聊天 / 话题中时，可以切换为 `channel` 或 `both`。对于 Telegram 论坛
话题，OpenClaw 会为审批提示和审批后的后续消息保留该话题。

参见：

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC 流程
__OC_I18N_900009__
安全说明：

- Unix socket 模式为 `0600`，token 存储在 `exec-approvals.json` 中。
- 同 UID 对端检查。
- 质询 / 响应（nonce + HMAC token + 请求哈希）+ 短 TTL。

## 系统事件

执行生命周期会显示为系统消息：

- `Exec running`（仅当命令超过运行中通知阈值时）
- `Exec finished`
- `Exec denied`

这些消息会在节点报告事件后发布到智能体的会话中。
Gateway 网关主机执行审批在命令完成时也会发出相同的生命周期事件（如果运行时间超过阈值，还会可选发出运行中事件）。
受审批门控的执行会在这些消息中复用审批 id 作为 `runId`，便于关联。

## 审批被拒绝时的行为

当异步执行审批被拒绝时，OpenClaw 会阻止智能体复用
该会话中此前同一命令任何早期运行的输出。拒绝原因
会连同明确说明一起传递，指出没有可用的命令输出，从而阻止
智能体声称存在新的输出，或使用先前成功运行留下的陈旧结果
重复被拒绝的命令。

## 影响

- **full** 权限很强；如果可能，优先使用允许列表。
- **ask** 让你保持在流程中，同时仍支持快速审批。
- 按智能体划分的允许列表可防止某个智能体的审批泄漏到其他智能体。
- 审批仅适用于来自**已授权发送方**的主机执行请求。未授权发送方无法发出 `/exec`。
- `/exec security=full` 是已授权操作员的会话级便捷方式，并且按设计会跳过审批。要硬性阻止主机执行，请将审批安全级别设为 `deny`，或通过工具策略拒绝 `exec` 工具。

## 相关内容

<CardGroup cols={2}>
  <Card title="Exec 工具" href="/zh-CN/tools/exec" icon="terminal">
    Shell 命令执行工具。
  </Card>
  <Card title="提权模式" href="/zh-CN/tools/elevated" icon="shield-exclamation">
    同时跳过审批的破窗应急路径。
  </Card>
  <Card title="沙箱隔离" href="/zh-CN/gateway/sandboxing" icon="box">
    沙箱模式和工作区访问。
  </Card>
  <Card title="安全" href="/zh-CN/gateway/security" icon="lock">
    安全模型和加固。
  </Card>
  <Card title="沙箱 vs 工具策略 vs 提权" href="/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    何时使用每种控制方式。
  </Card>
  <Card title="Skills" href="/zh-CN/tools/skills" icon="sparkles">
    由 Skills 支持的自动允许行为。
  </Card>
</CardGroup>

---
read_when:
    - 配置 Exec 审批或允许列表时
    - 在 macOS 应用中实现 Exec 审批 UX 时
    - 审查沙箱逃逸提示及其影响时
summary: Exec 审批、允许列表和沙箱逃逸提示
title: Exec 审批
x-i18n:
    generated_at: "2026-04-07T18:43:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6041929185bab051ad873cc4822288cb7d6f0470e19e7ae7a16b70f76dfc2cd9
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Exec 审批

Exec 审批是用于让沙箱隔离智能体在真实主机（`gateway` 或 `node`）上运行命令的**配套应用 / 节点主机护栏机制**。你可以把它理解为一种安全联锁机制：只有当策略 + 允许列表 +（可选）用户审批全部一致同意时，命令才会被允许。
Exec 审批是对工具策略和 elevated 门控的**额外补充**（除非 elevated 设为 `full`，此时会跳过审批）。
生效策略取 `tools.exec.*` 与审批默认值中**更严格**的一方；如果某个审批字段被省略，则使用 `tools.exec` 中的值。
主机 exec 还会使用该机器上的本地审批状态。主机本地
`~/.openclaw/exec-approvals.json` 中的 `ask: "always"` 会持续提示，即使
会话或配置默认值请求的是 `ask: "on-miss"`。
使用 `openclaw approvals get`、`openclaw approvals get --gateway` 或
`openclaw approvals get --node <id|name|ip>` 可以检查请求的策略、
主机策略来源和最终生效结果。

如果**配套应用 UI** 不可用，任何需要提示的请求都会由**询问回退**处理（默认：拒绝）。

原生聊天审批客户端也可以在待处理审批消息上提供渠道特定的交互方式。例如，Matrix 可以在审批提示上预置反应快捷方式（`✅` 允许一次、`❌` 拒绝，以及可用时的 `♾️` 始终允许），同时仍保留消息中的 `/approve ...` 命令作为回退方式。

## 适用范围

Exec 审批会在执行主机本地强制执行：

- **Gateway 网关主机** → Gateway 网关机器上的 `openclaw` 进程
- **节点主机** → 节点运行器（macOS 配套应用或无头节点主机）

信任模型说明：

- 通过 Gateway 网关认证的调用方，是该 Gateway 网关的受信任操作员。
- 已配对节点会把这种受信任操作员能力扩展到节点主机上。
- Exec 审批可降低意外执行风险，但它不是按用户划分的认证边界。
- 已批准的节点主机运行会绑定规范执行上下文：规范 `cwd`、精确 `argv`、存在时的环境变量绑定，以及适用时固定的可执行文件路径。
- 对于 shell 脚本和直接解释器 / 运行时文件调用，OpenClaw 也会尝试绑定
  一个具体的本地文件操作数。如果该已绑定文件在审批后、执行前发生变化，
  则运行会被拒绝，而不是执行已漂移的内容。
- 这种文件绑定是有意设计为尽力而为，不是对每一种
  解释器 / 运行时加载路径的完整语义模型。如果审批模式无法准确识别出一个具体的本地
  文件进行绑定，它会拒绝生成带审批支持的运行，而不是假装具备完整覆盖能力。

macOS 拆分：

- **节点主机服务** 会通过本地 IPC 将 `system.run` 转发给 **macOS 应用**。
- **macOS 应用** 负责执行审批 + 在 UI 上下文中运行命令。

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

## 无审批的“YOLO”模式

如果你希望主机 exec 在没有审批提示的情况下运行，则必须同时放开**两层**策略：

- OpenClaw 配置中的请求 exec 策略（`tools.exec.*`）
- `~/.openclaw/exec-approvals.json` 中主机本地的审批策略

现在这是默认的主机行为，除非你显式收紧它：

- `tools.exec.security`: 在 `gateway` / `node` 上设为 `full`
- `tools.exec.ask`: `off`
- 主机 `askFallback`: `full`

重要区别：

- `tools.exec.host=auto` 决定 exec 在哪里运行：若有沙箱则在沙箱中，否则在 Gateway 网关上。
- YOLO 决定主机 exec 如何获批：`security=full` 加 `ask=off`。
- 在 YOLO 模式下，OpenClaw 不会在已配置的主机 exec 策略之上，再额外增加单独的启发式命令混淆审批门控。
- `auto` 不会让来自沙箱隔离会话的 Gateway 网关路由变成免费覆盖项。每次调用请求 `host=node` 时，在 `auto` 下是允许的；只有当没有活动沙箱运行时时，`host=gateway` 才会在 `auto` 下被允许。如果你想要稳定的非 auto 默认值，请设置 `tools.exec.host` 或显式使用 `/exec host=...`。

如果你想要更保守的设置，可以把任一层收紧回 `allowlist` / `on-miss`
或 `deny`。

持久化的 Gateway 网关主机“永不提示”设置：

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

然后将主机审批文件也设置为一致：

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

对于节点主机，请在该节点上应用相同的审批文件：

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

仅限当前会话的快捷方式：

- `/exec security=full ask=off` 只会修改当前会话。
- `/elevated full` 是一个紧急放行快捷方式，同时也会跳过该会话的 exec 审批。

如果主机审批文件仍比配置更严格，那么更严格的主机策略仍然会生效。

## 策略旋钮

### 安全级别（`exec.security`）

- **deny**：阻止所有主机 exec 请求。
- **allowlist**：只允许允许列表中的命令。
- **full**：允许一切（等同于 elevated）。

### 询问（`exec.ask`）

- **off**：从不提示。
- **on-miss**：仅当允许列表未命中时提示。
- **always**：每条命令都提示。
- 当生效的询问模式为 `always` 时，`allow-always` 的持久信任也不会抑制提示

### 询问回退（`askFallback`）

如果需要提示但没有可达 UI，则由回退策略决定：

- **deny**：阻止。
- **allowlist**：仅当允许列表命中时允许。
- **full**：允许。

### 内联解释器 eval 加固（`tools.exec.strictInlineEval`）

当 `tools.exec.strictInlineEval=true` 时，即使解释器二进制本身已在允许列表中，OpenClaw 仍会将内联代码求值形式视为仅能通过审批执行。

示例：

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

这是对那些无法清晰映射到单一稳定文件操作数的解释器加载路径进行的纵深防御。在严格模式下：

- 这些命令仍然需要显式审批；
- `allow-always` 不会自动为它们持久化新的允许列表条目。

## 允许列表（按智能体划分）

允许列表是**按智能体**区分的。如果存在多个智能体，请在 macOS 应用中切换你要编辑的智能体。模式匹配是**大小写不敏感的 glob 匹配**。
模式应解析为**二进制路径**（仅文件名的条目会被忽略）。
旧版 `agents.default` 条目会在加载时迁移到 `agents.main`。
像 `echo ok && pwd` 这样的 shell 链式命令仍要求每个顶层分段都满足允许列表规则。

示例：

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

每个允许列表条目会跟踪：

- **id**：用于 UI 标识的稳定 UUID（可选）
- **上次使用时间** 时间戳
- **上次使用的命令**
- **上次解析出的路径**

## 自动允许 Skills CLI

启用**自动允许 Skills CLI** 后，已知 Skills 引用的可执行文件会在节点上（macOS 节点或无头节点主机）被视为已加入允许列表。此功能会通过 Gateway 网关 RPC 使用
`skills.bins` 获取 skill 二进制列表。如果你希望使用严格的手动允许列表，请关闭它。

重要信任说明：

- 这是一个**隐式的便捷允许列表**，与手动路径允许列表条目分开。
- 它适用于 Gateway 网关与节点处于同一信任边界内的受信任操作员环境。
- 如果你要求严格的显式信任，请保持 `autoAllowSkills: false`，并仅使用手动路径允许列表条目。

## 安全二进制（仅 stdin）

`tools.exec.safeBins` 定义了一小组**仅 stdin** 的二进制程序（例如 `cut`），
它们可以在 allowlist 模式下**无需**显式允许列表条目即可运行。安全二进制会拒绝
位置文件参数和类似路径的 token，因此它们只能处理传入的数据流。
请将其视为面向流过滤器的狭窄快速通道，而不是通用信任列表。
**不要**把解释器或运行时二进制（例如 `python3`、`node`、`ruby`、`bash`、`sh`、`zsh`）加入 `safeBins`。
如果某个命令天生就可以执行代码、执行子命令或读取文件，请优先使用显式允许列表条目，并保持审批提示启用。
自定义安全二进制必须在 `tools.exec.safeBinProfiles.<bin>` 中定义显式配置。
验证仅依据 `argv` 形状以确定性方式完成（不检查主机文件系统中是否存在），这样可以
防止根据允许 / 拒绝差异推断文件是否存在。
默认安全二进制会拒绝面向文件的选项（例如 `sort -o`、`sort --output`、
`sort --files0-from`、`sort --compress-program`、`sort --random-source`、
`sort --temporary-directory`/`-T`、`wc --files0-from`、`jq -f/--from-file`、
`grep -f/--file`）。
安全二进制还会对破坏仅 stdin
行为的选项强制执行显式的按二进制划分的 flag 策略（例如 `sort -o/--output/--compress-program` 和 grep 递归 flag）。
长选项在 safe-bin 模式下会按失败即关闭方式验证：未知 flag 和有歧义的
缩写都会被拒绝。
被 safe-bin 配置拒绝的 flag：

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

安全二进制还会强制在执行时将 `argv` token 视为**字面文本**（对仅 stdin
分段不进行 glob 展开，也不进行 `$VARS` 展开），因此像 `*` 或 `$HOME/...` 这样的模式不能
被用来偷偷读取文件。
安全二进制还必须从受信任的二进制目录中解析（系统默认目录加上可选的
`tools.exec.safeBinTrustedDirs`）。`PATH` 条目绝不会被自动信任。
默认受信任的安全二进制目录有意保持最小：`/bin`、`/usr/bin`。
如果你的安全二进制可执行文件位于包管理器 / 用户路径中（例如
`/opt/homebrew/bin`、`/usr/local/bin`、`/opt/local/bin`、`/snap/bin`），请将它们显式添加
到 `tools.exec.safeBinTrustedDirs`。
在 allowlist 模式下，shell 链式命令和重定向不会被自动允许。

当每个顶层分段都满足允许列表时，允许使用 shell 链式命令（`&&`、`||`、`;`）
（包括安全二进制或 skill 自动允许）。在 allowlist 模式下，重定向仍不受支持。
在 allowlist 解析期间会拒绝命令替换（`$()` / 反引号），包括在
双引号内部；如果你需要字面的 `$()` 文本，请使用单引号。
在 macOS 配套应用审批中，包含 shell 控制或展开语法原始文本的 shell 命令
（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）会被视为允许列表未命中，除非
shell 二进制本身已加入允许列表。
对于 shell 包装器（`bash|sh|zsh ... -c/-lc`），请求范围内的环境变量覆盖会被收缩为一个
小型显式允许列表（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。
对于 allowlist 模式下的 allow-always 决定，已知的分发包装器
（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）会持久化内部可执行文件路径，而不是包装器
路径。对于 shell 多路复用器（`busybox`、`toybox`），在 shell applet（`sh`、`ash`、
等）场景下也会解包，从而持久化内部可执行文件，而不是多路复用器二进制。如果某个包装器或
多路复用器无法被安全解包，则不会自动持久化任何允许列表条目。
如果你将 `python3` 或 `node` 这类解释器加入允许列表，建议启用 `tools.exec.strictInlineEval=true`，这样内联 eval 仍然需要显式审批。在严格模式下，`allow-always` 仍然可以持久化无害的解释器 / 脚本调用，但不会自动持久化内联 eval 载体。

默认安全二进制：

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` 和 `sort` 不在默认列表中。如果你选择启用它们，请继续为
它们的非 stdin 工作流保留显式允许列表条目。
对于处于 safe-bin 模式下的 `grep`，请用 `-e`/`--regexp` 提供模式；
位置模式形式会被拒绝，这样文件操作数就不能通过歧义位置参数偷偷带入。

### 安全二进制与允许列表的区别

| 主题 | `tools.exec.safeBins` | 允许列表（`exec-approvals.json`） |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| 目标 | 自动允许狭窄的 stdin 过滤器 | 显式信任特定可执行文件 |
| 匹配类型 | 可执行文件名 + 安全二进制 `argv` 策略 | 已解析可执行文件路径的 glob 模式 |
| 参数范围 | 受安全二进制配置和字面 token 规则限制 | 仅路径匹配；参数的责任由你自行承担 |
| 典型示例 | `head`, `tail`, `tr`, `wc` | `jq`, `python3`, `node`, `ffmpeg`, 自定义 CLI |
| 最佳用途 | 管道中的低风险文本转换 | 任何行为更广或有副作用的工具 |

配置位置：

- `safeBins` 来自配置（`tools.exec.safeBins` 或按智能体划分的 `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` 来自配置（`tools.exec.safeBinTrustedDirs` 或按智能体划分的 `agents.list[].tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` 来自配置（`tools.exec.safeBinProfiles` 或按智能体划分的 `agents.list[].tools.exec.safeBinProfiles`）。按智能体划分的配置键会覆盖全局键。
- allowlist 条目位于主机本地 `~/.openclaw/exec-approvals.json` 的 `agents.<id>.allowlist` 下（或通过 Control UI / `openclaw approvals allowlist ...`）。
- 当解释器 / 运行时二进制出现在 `safeBins` 中但没有显式配置时，`openclaw security audit` 会以 `tools.exec.safe_bins_interpreter_unprofiled` 发出警告。
- `openclaw doctor --fix` 可以为缺失的自定义 `safeBinProfiles.<bin>` 条目脚手架生成 `{}`（之后请检查并收紧）。解释器 / 运行时二进制不会被自动脚手架生成。

自定义配置示例：
__OC_I18N_900004__
如果你显式将 `jq` 选择加入 `safeBins`，OpenClaw 在 safe-bin
模式下仍会拒绝 `env` 内建，因此 `jq -n env` 无法在没有显式允许列表路径
或审批提示的情况下导出主机进程环境变量。

## Control UI 编辑

使用 **Control UI → Nodes → Exec approvals** 卡片来编辑默认值、按智能体划分的
覆盖项和允许列表。选择一个范围（默认值或某个智能体），调整策略，
添加 / 删除允许列表模式，然后点击 **保存**。UI 会显示每个模式的**上次使用**
元数据，便于你保持列表整洁。

目标选择器可选择 **Gateway 网关**（本地审批）或 **节点**。节点
必须声明 `system.execApprovals.get/set`（macOS 应用或无头节点主机）。
如果某个节点尚未声明 exec 审批，请直接编辑它本地的
`~/.openclaw/exec-approvals.json`。

CLI：`openclaw approvals` 支持编辑 gateway 或节点（参见[审批 CLI](/cli/approvals)）。

## 审批流程

当需要提示时，Gateway 网关会向操作员客户端广播 `exec.approval.requested`。
Control UI 和 macOS 应用通过 `exec.approval.resolve` 进行处理，随后 Gateway 网关会把
已批准的请求转发到节点主机。

对于 `host=node`，审批请求会包含一个规范的 `systemRunPlan` 负载。Gateway 网关会在转发已批准的 `system.run`
请求时，将该计划用作权威的命令 / `cwd` / 会话上下文。

这对于异步审批延迟很重要：

- 节点 exec 路径会预先准备一个规范计划
- 审批记录会存储该计划及其绑定元数据
- 一旦获批，最终转发的 `system.run` 调用会复用已存储的计划
  ，而不是信任调用方后续的修改
- 如果调用方在审批请求创建后修改了 `command`、`rawCommand`、`cwd`、`agentId` 或
  `sessionKey`，Gateway 网关会以审批不匹配为由拒绝该转发运行

## 解释器 / 运行时命令

带审批支持的解释器 / 运行时运行在设计上是保守的：

- 始终会绑定精确的 `argv` / `cwd` / 环境变量上下文。
- 直接 shell 脚本和直接运行时文件形式会尽力绑定到一个具体本地
  文件快照。
- 仍可解析为一个直接本地文件的常见包管理器包装形式（例如
  `pnpm exec`、`pnpm node`、`npm exec`、`npx`）会在绑定前解包。
- 如果 OpenClaw 无法为某个解释器 / 运行时命令识别出恰好一个具体本地文件
  （例如包脚本、eval 形式、运行时特定加载链或含糊的多文件
  形式），则会拒绝带审批支持的执行，而不是声称具备它实际上没有的语义覆盖。
- 对于这些工作流，更适合使用沙箱隔离、单独的主机边界，或显式的受信任
  allowlist / full 工作流，由操作员接受更宽泛的运行时语义。

当需要审批时，exec 工具会立即返回一个审批 id。使用该 id 来
关联后续系统事件（`Exec finished` / `Exec denied`）。如果在超时前没有收到决策，
该请求会被视为审批超时，并以拒绝原因的形式呈现。

### 后续投递行为

在已批准的异步 exec 完成后，OpenClaw 会向同一会话发送一个后续 `agent` 回合。

- 如果存在有效的外部投递目标（可投递渠道加目标 `to`），后续投递会使用该渠道。
- 在仅 webchat 或仅内部会话、没有外部目标的流程中，后续投递会保持为仅会话（`deliver: false`）。
- 如果调用方显式请求严格的外部投递，但无法解析出外部渠道，请求会以 `INVALID_REQUEST` 失败。
- 如果启用了 `bestEffortDeliver` 且无法解析出外部渠道，投递会降级为仅会话，而不是失败。

确认对话框包括：

- 命令 + 参数
- `cwd`
- 智能体 id
- 已解析的可执行文件路径
- 主机 + 策略元数据

操作：

- **Allow once** → 立即运行
- **Always allow** → 加入允许列表并运行
- **Deny** → 阻止

## 将审批转发到聊天渠道

你可以将 exec 审批提示转发到任意聊天渠道（包括渠道插件），并通过 `/approve` 进行审批。这会使用常规的出站投递流水线。

配置：
__OC_I18N_900005__
在聊天中回复：
__OC_I18N_900006__
`/approve` 命令同时处理 exec 审批和插件审批。如果该 ID 不匹配待处理的 exec 审批，它会自动改为检查插件审批。

### 插件审批转发

插件审批转发使用与 exec 审批相同的投递流水线，但拥有其自己独立的
`approvals.plugin` 配置。启用或禁用其中一个不会影响另一个。
__OC_I18N_900007__
配置结构与 `approvals.exec` 完全一致：`enabled`、`mode`、`agentFilter`、
`sessionFilter` 和 `targets` 的工作方式都相同。

支持共享交互式回复的渠道会为 exec 和
插件审批都渲染相同的审批按钮。没有共享交互式 UI 的渠道会回退为带有 `/approve`
说明的纯文本。

### 任意渠道中的同聊天审批

当 exec 或插件审批请求来自可投递的聊天界面时，现在默认情况下可以直接在同一聊天中通过 `/approve` 批准。这适用于 Slack、Matrix 和
Microsoft Teams 等渠道，也适用于现有的 Web UI 和终端 UI 流程。

这条共享的文本命令路径使用该会话的常规渠道认证模型。如果原始聊天
本来就可以发送命令并接收回复，那么审批请求就不再需要
额外的原生投递适配器来保持待处理状态。

Discord 和 Telegram 也支持同聊天 `/approve`，但即使禁用了原生审批投递，这些渠道仍会使用它们已解析出的审批者列表进行授权。

对于 Telegram 及其他直接调用 Gateway 网关的原生审批客户端，
这种回退有意限制在“未找到审批”失败场景。真实的
exec 审批拒绝 / 错误不会被静默重试为插件审批。

### 原生审批投递

某些渠道也可以作为原生审批客户端。原生客户端会在共享的同聊天 `/approve`
流程基础上，额外提供审批者私信、原始聊天扇出以及渠道特定的交互式审批 UX。

当原生审批卡片 / 按钮可用时，该原生 UI 就是面向
智能体的主路径。除非工具结果表明聊天审批不可用，或
手动审批是唯一剩余路径，否则智能体不应再额外回显重复的纯聊天
`/approve` 命令。

通用模型：

- 是否需要 exec 审批，仍由主机 exec 策略决定
- `approvals.exec` 控制是否将审批提示转发到其他聊天目标
- `channels.<channel>.execApprovals` 控制该渠道是否充当原生审批客户端

当以下条件全部满足时，原生审批客户端会自动启用“私信优先”投递：

- 该渠道支持原生审批投递
- 可以从显式 `execApprovals.approvers` 或该
  渠道文档化的回退来源中解析出审批者
- `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"`

将 `enabled: false` 设为显式禁用某个原生审批客户端。将 `enabled: true` 设为在
审批者可解析时强制启用。公开的原始聊天投递仍需通过
`channels.<channel>.execApprovals.target` 显式开启。

FAQ：[为什么聊天审批有两个 exec 审批配置？](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

这些原生审批客户端会在共享的
同聊天 `/approve` 流程和共享审批按钮之上，增加私信路由和可选的频道扇出。

共享行为：

- Slack、Matrix、Microsoft Teams 以及类似的可投递聊天，都会对同聊天 `/approve` 使用常规渠道认证模型
- 当原生审批客户端自动启用时，默认原生投递目标是审批者私信
- 对于 Discord 和 Telegram，只有已解析出的审批者可以批准或拒绝
- Discord 审批者可以是显式指定的（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Telegram 审批者可以是显式指定的（`execApprovals.approvers`），也可以从现有 owner 配置（`allowFrom`，以及支持时用于私信的 `defaultTo`）推断
- Slack 审批者可以是显式指定的（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Slack 原生按钮会保留审批 id 类型，因此 `plugin:` id 可以解析插件审批，
  无需第二层 Slack 本地回退
- Matrix 原生私信 / 频道路由和反应快捷方式同时处理 exec 和插件审批；
  插件授权仍然来自 `channels.matrix.dm.allowFrom`
- 请求者不需要是审批者
- 当原始聊天本就支持命令和回复时，原始聊天可以直接通过 `/approve` 审批
- 原生 Discord 审批按钮会按审批 id 类型路由：`plugin:` id 会
  直接进入插件审批，其余全部进入 exec 审批
- 原生 Telegram 审批按钮遵循与 `/approve` 相同的有界 exec 到插件回退
- 当原生 `target` 启用原始聊天投递时，审批提示会包含命令文本
- 待处理的 exec 审批默认会在 30 分钟后过期
- 如果没有任何操作员 UI 或已配置的审批客户端可以接受该请求，提示会回退到 `askFallback`

Telegram 默认发送到审批者私信（`target: "dm"`）。如果你希望审批提示也出现在原始 Telegram 聊天 / 话题中，可以切换为 `channel` 或 `both`。对于 Telegram forum 话题，OpenClaw 会为审批提示和审批后的后续消息保留该话题。

参见：

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC 流程
__OC_I18N_900008__
安全说明：

- Unix socket 模式为 `0600`，token 存储在 `exec-approvals.json` 中。
- 同 UID 对等方检查。
- 挑战 / 响应（nonce + HMAC token + 请求哈希）+ 短 TTL。

## 系统事件

Exec 生命周期会以系统消息形式呈现：

- `Exec running`（仅当命令超过运行通知阈值时）
- `Exec finished`
- `Exec denied`

这些消息会在节点上报事件后发布到智能体的会话中。
Gateway 网关主机 exec 审批在命令完成时也会发出相同的生命周期事件（如果运行时间超过阈值，也可选择在运行中发出）。
带审批门控的 exec 会在这些消息中复用审批 id 作为 `runId`，便于关联。

## 审批被拒绝时的行为

当异步 exec 审批被拒绝时，OpenClaw 会阻止智能体在会话中复用
此前同一命令的任何早期运行输出。拒绝原因
会附带明确指引，说明没有可用命令输出，这样可以阻止
智能体声称存在新的输出，或重复被拒绝的命令并带上
此前成功运行的陈旧结果。

## 影响

- **full** 权限很强；可行时优先使用允许列表。
- **ask** 可以让你始终掌握情况，同时仍保留快速审批能力。
- 按智能体划分的允许列表可防止一个智能体的审批泄漏到其他智能体。
- 审批仅适用于来自**已授权发送者**的主机 exec 请求。未授权发送者不能发出 `/exec`。
- `/exec security=full` 是面向已授权操作员的会话级便捷方式，并且按设计会跳过审批。
  若要硬性阻止主机 exec，请将审批安全级别设为 `deny`，或通过工具策略拒绝 `exec` 工具。

相关内容：

- [Exec 工具](/zh-CN/tools/exec)
- [Elevated 模式](/zh-CN/tools/elevated)
- [Skills](/zh-CN/tools/skills)

## 相关

- [Exec](/zh-CN/tools/exec) — shell 命令执行工具
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 沙箱模式和工作区访问
- [安全](/zh-CN/gateway/security) — 安全模型与加固
- [沙箱与工具策略与 Elevated 的区别](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated) — 何时使用各自机制

---
read_when:
    - 配置 exec 批准或允许列表
    - 在 macOS 应用中实现 exec 批准 UX
    - 审查沙箱逃逸提示及其影响
summary: Exec 批准、允许列表和沙箱逃逸提示
title: Exec 批准
x-i18n:
    generated_at: "2026-04-05T10:12:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1efa3b78efe3ca6246acfb37830b103ede40cc5298dcc7da8e9fbc5f6cc88ef
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Exec 批准

Exec 批准是允许沙箱隔离智能体在真实主机（`gateway` 或 `node`）上运行
命令时使用的**配套应用 / 节点主机防护机制**。你可以把它理解为一种安全联锁：
只有当策略 + 允许列表 +（可选的）用户批准全部同意时，命令才会被允许。
Exec 批准是**额外叠加**在工具策略和 elevated 门控之上的（除非 elevated 设置为 `full`，这会跳过批准）。
生效策略取 `tools.exec.*` 与批准默认值中**更严格**的一方；如果某个批准字段被省略，则使用 `tools.exec` 的值。
主机 exec 还会使用该机器上的本地批准状态。本地主机上的
`~/.openclaw/exec-approvals.json` 中若设置了 `ask: "always"`，
即使会话或配置默认值请求 `ask: "on-miss"`，也仍会持续提示。
使用 `openclaw approvals get`、`openclaw approvals get --gateway` 或
`openclaw approvals get --node <id|name|ip>` 可检查请求策略、
主机策略来源以及最终生效结果。

如果**配套应用 UI** 不可用，任何需要提示的请求都会由 **ask 回退**
（默认：deny）来处理。

## 适用范围

Exec 批准会在执行主机本地强制执行：

- **gateway host** → Gateway 网关机器上的 `openclaw` 进程
- **node host** → 节点运行器（macOS 配套应用或无头节点主机）

信任模型说明：

- 已通过 Gateway 网关鉴权的调用方，是该 Gateway 网关的受信任操作员。
- 已配对的节点会将这种受信任操作员能力扩展到节点主机上。
- Exec 批准会降低意外执行风险，但它不是按用户划分的鉴权边界。
- 已批准的节点主机运行会绑定规范执行上下文：规范 cwd、精确 argv、
  环境变量绑定（如果存在），以及在适用时固定的可执行文件路径。
- 对于 shell 脚本和直接解释器/运行时文件调用，OpenClaw 还会尝试绑定
  一个具体的本地文件操作数。如果该绑定文件在批准后、执行前发生变化，
  运行会被拒绝，而不是执行发生漂移的内容。
- 这种文件绑定有意设计为尽力而为，而不是覆盖每一种
  解释器/运行时加载路径的完整语义模型。如果批准模式无法准确识别
  恰好一个可绑定的具体本地文件，它会拒绝生成一个带批准支持的运行，
  而不是假装实现了完整覆盖。

macOS 拆分：

- **node host service** 会通过本地 IPC 将 `system.run` 转发给 **macOS app**。
- **macOS app** 会在 UI 上下文中执行批准并运行命令。

## 设置和存储

批准信息存储在执行主机上的本地 JSON 文件中：

`~/.openclaw/exec-approvals.json`

示例模式：

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

## 无批准 “YOLO” 模式

如果你希望主机 exec 在没有批准提示的情况下运行，你必须同时放开**两层**策略：

- OpenClaw 配置中的请求 exec 策略（`tools.exec.*`）
- `~/.openclaw/exec-approvals.json` 中的主机本地批准策略

这现在是默认的主机行为，除非你显式收紧它：

- `tools.exec.security`: `full`，适用于 `gateway`/`node`
- `tools.exec.ask`: `off`
- 主机 `askFallback`: `full`

一个重要区别：

- `tools.exec.host=auto` 选择 exec 在哪里运行：有沙箱时用沙箱，否则用 gateway。
- YOLO 选择的是主机 exec 如何获得批准：`security=full` 加 `ask=off`。
- `auto` 不会把从沙箱隔离会话中路由到 gateway 变成一个可随意覆盖的自由选项。允许在每次调用中通过 `host=node` 请求从 `auto` 切换，而 `host=gateway` 只有在没有活跃沙箱运行时时才允许从 `auto` 切换。如果你想要稳定的非 auto 默认值，请设置 `tools.exec.host` 或显式使用 `/exec host=...`。

如果你想使用更保守的设置，请将任一层收紧回 `allowlist` / `on-miss`
或 `deny`。

持久化的 gateway host “永不提示” 设置：

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

然后将主机批准文件设置为匹配：

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

对于节点主机，请在该节点上应用相同的批准文件：

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

仅会话快捷方式：

- `/exec security=full ask=off` 只会修改当前会话。
- `/elevated full` 是一个紧急放行快捷方式，同时也会跳过该会话的 exec 批准。

如果主机批准文件仍然比配置更严格，则更严格的主机策略仍然会生效。

## 策略旋钮

### 安全（`exec.security`）

- **deny**：阻止所有主机 exec 请求。
- **allowlist**：仅允许允许列表中的命令。
- **full**：允许一切（等同于 elevated）。

### 询问（`exec.ask`）

- **off**：从不提示。
- **on-miss**：仅当允许列表未匹配时提示。
- **always**：每条命令都提示。
- 当生效的 ask 模式为 `always` 时，`allow-always` 持久信任不会抑制提示

### 询问回退（`askFallback`）

如果需要提示但没有可达的 UI，则回退决定：

- **deny**：阻止。
- **allowlist**：仅在允许列表匹配时允许。
- **full**：允许。

### 内联解释器 eval 加固（`tools.exec.strictInlineEval`）

当 `tools.exec.strictInlineEval=true` 时，OpenClaw 会将内联代码 eval 形式视为仅能通过批准执行，即使解释器二进制本身已在允许列表中。

示例：

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

这是针对无法干净映射到单一稳定文件操作数的解释器加载器所做的纵深防御。在 strict 模式下：

- 这些命令仍然需要显式批准；
- `allow-always` 不会自动为它们持久化新的允许列表条目。

## 允许列表（按智能体）

允许列表是**按智能体**划分的。如果存在多个智能体，请在 macOS 应用中切换你正在编辑的智能体。
模式使用**不区分大小写的 glob 匹配**。
模式应解析为**二进制路径**（仅文件名的条目会被忽略）。
旧版 `agents.default` 条目会在加载时迁移到 `agents.main`。
像 `echo ok && pwd` 这样的 shell 链式命令，仍要求每个顶层片段都满足允许列表规则。

示例：

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

每个允许列表条目会跟踪：

- **id**：用于 UI 身份的稳定 UUID（可选）
- **上次使用** 时间戳
- **上次使用的命令**
- **上次解析路径**

## 自动允许 Skills CLI

启用 **自动允许 Skills CLI** 后，已知 Skills 所引用的可执行文件
会在节点上（macOS 节点或无头节点主机）被视为已列入允许列表。该功能使用
Gateway 网关 RPC 上的 `skills.bins` 来获取 skill bin 列表。如果你想要严格的手动允许列表，请禁用它。

重要信任说明：

- 这是一个**隐式的便捷允许列表**，与手动路径允许列表条目分开。
- 它适用于 Gateway 网关与节点处于同一信任边界的受信任操作员环境。
- 如果你需要严格的显式信任，请保持 `autoAllowSkills: false`，并且只使用手动路径允许列表条目。

## 安全二进制（仅 stdin）

`tools.exec.safeBins` 定义了一小组**仅 stdin** 的二进制文件（例如 `cut`），
使它们可以在 allowlist 模式下**无需**显式允许列表条目即可运行。安全二进制会拒绝
位置文件参数和类路径 token，因此它们只能处理输入流。
应将其视为针对流过滤器的窄范围快速路径，而不是通用信任列表。
**不要**将解释器或运行时二进制（例如 `python3`、`node`、`ruby`、`bash`、`sh`、`zsh`）添加到 `safeBins`。
如果某个命令按设计就可以执行代码、运行子命令或读取文件，请优先使用显式允许列表条目，并保持批准提示开启。
自定义安全二进制必须在 `tools.exec.safeBinProfiles.<bin>` 中定义显式配置。
校验仅根据 argv 形状进行确定性判断（不检查主机文件系统上文件是否存在），
这样可以防止因允许/拒绝差异而形成文件存在性预言机行为。
默认安全二进制会拒绝面向文件的选项（例如 `sort -o`、`sort --output`、
`sort --files0-from`、`sort --compress-program`、`sort --random-source`、
`sort --temporary-directory`/`-T`、`wc --files0-from`、`jq -f/--from-file`、
`grep -f/--file`）。
安全二进制还会对破坏仅 stdin 行为的选项强制执行按二进制划分的显式标志策略
（例如 `sort -o/--output/--compress-program` 和 grep 递归标志）。
在 safe-bin 模式下，长选项校验采用默认拒绝：未知标志和有歧义的
缩写会被拒绝。
按 safe-bin 配置文件拒绝的标志：

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

安全二进制还会强制在执行时将 argv token 视为**字面文本**（不进行 glob 展开，
也不进行 `$VARS` 展开），用于仅 stdin 的片段，因此像 `*` 或 `$HOME/...` 这样的模式
不能被用来偷偷读取文件。
安全二进制还必须从受信任的二进制目录中解析（系统默认目录，加上可选的
`tools.exec.safeBinTrustedDirs`）。`PATH` 条目绝不会自动被信任。
默认的受信任安全二进制目录有意保持最小：`/bin`、`/usr/bin`。
如果你的安全二进制可执行文件位于包管理器/用户路径中（例如
`/opt/homebrew/bin`、`/usr/local/bin`、`/opt/local/bin`、`/snap/bin`），请显式将它们加入
`tools.exec.safeBinTrustedDirs`。
在 allowlist 模式下，shell 链接和重定向不会被自动允许。

当每个顶层片段都满足允许列表
（包括安全二进制或 skill 自动允许）时，允许使用 shell 链接（`&&`、`||`、`;`）。
在 allowlist 模式下，重定向仍不受支持。
命令替换（`$()` / 反引号）会在 allowlist 解析期间被拒绝，包括在双引号内部；
如果你需要字面量 `$()` 文本，请使用单引号。
在 macOS 配套应用批准中，包含 shell 控制或展开语法
（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）的原始 shell 文本
会被视为 allowlist miss，除非 shell 二进制本身已在允许列表中。
对于 shell 包装器（`bash|sh|zsh ... -c/-lc`），请求范围内的 env 覆盖会被缩减为一个很小的显式允许列表（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。
对于 allowlist 模式下的 allow-always 决策，已知的分发包装器
（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）会持久化内部可执行文件路径，而不是包装器
路径。shell 多路复用器（`busybox`、`toybox`）也会在 shell applet（`sh`、`ash`
等）场景下被解包，因此持久化的是内部可执行文件，而不是多路复用器二进制。如果某个包装器或
多路复用器无法安全解包，则不会自动持久化允许列表条目。
如果你将 `python3` 或 `node` 这样的解释器加入允许列表，建议启用 `tools.exec.strictInlineEval=true`，这样内联 eval 仍然需要显式批准。在 strict 模式下，`allow-always` 仍可以持久化无害的解释器/脚本调用，但不会自动持久化内联 eval 载体。

默认安全二进制：

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` 和 `sort` 不在默认列表中。如果你选择启用它们，请对其非 stdin 工作流保留显式允许列表条目。
对于 safe-bin 模式下的 `grep`，请使用 `-e`/`--regexp` 提供模式；
位置模式形式会被拒绝，以防文件操作数伪装成有歧义的位置参数。

### 安全二进制与允许列表的区别

| 主题 | `tools.exec.safeBins` | 允许列表（`exec-approvals.json`） |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| 目标 | 自动允许狭窄范围的 stdin 过滤器 | 显式信任特定可执行文件 |
| 匹配类型 | 可执行文件名 + safe-bin argv 策略 | 已解析的可执行文件路径 glob 模式 |
| 参数范围 | 受 safe-bin 配置文件和字面 token 规则限制 | 仅路径匹配；其他参数由你自己负责 |
| 典型示例 | `head`, `tail`, `tr`, `wc` | `jq`, `python3`, `node`, `ffmpeg`, 自定义 CLI |
| 最佳用途 | 低风险的管道文本转换 | 任何行为更宽或有副作用的工具 |

配置位置：

- `safeBins` 来自配置（`tools.exec.safeBins` 或按智能体的 `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` 来自配置（`tools.exec.safeBinTrustedDirs` 或按智能体的 `agents.list[].tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` 来自配置（`tools.exec.safeBinProfiles` 或按智能体的 `agents.list[].tools.exec.safeBinProfiles`）。按智能体的配置文件键会覆盖全局键。
- allowlist 条目位于主机本地 `~/.openclaw/exec-approvals.json` 的 `agents.<id>.allowlist` 下（或通过控制 UI / `openclaw approvals allowlist ...`）。
- 当解释器/运行时二进制出现在 `safeBins` 中却没有显式配置文件时，`openclaw security audit` 会发出 `tools.exec.safe_bins_interpreter_unprofiled` 警告。
- `openclaw doctor --fix` 可以为缺失的自定义 `safeBinProfiles.<bin>` 条目生成 `{}` 骨架（之后请检查并收紧）。解释器/运行时二进制不会自动生成骨架。

自定义配置文件示例：
__OC_I18N_900004__
如果你显式将 `jq` 选择加入 `safeBins`，OpenClaw 仍然会在 safe-bin
模式下拒绝 `env` 内置，因此 `jq -n env` 不能在没有显式允许列表路径
或批准提示的情况下转储主机进程环境。

## 控制 UI 编辑

使用 **控制 UI → 节点 → Exec 批准** 卡片来编辑默认值、按智能体
覆盖项和允许列表。选择一个作用域（默认值或某个智能体），调整策略，
添加/删除允许列表模式，然后点击 **保存**。UI 会显示每个模式的**上次使用**
元数据，以便你保持列表整洁。

目标选择器可选择 **Gateway**（本地批准）或某个 **节点**。节点
必须声明 `system.execApprovals.get/set`（macOS 应用或无头节点主机）。
如果某个节点尚未声明 exec 批准，请直接编辑其本地的
`~/.openclaw/exec-approvals.json`。

CLI：`openclaw approvals` 支持编辑 gateway 或 node（参见 [Approvals CLI](/cli/approvals)）。

## 批准流程

当需要提示时，gateway 会向操作员客户端广播 `exec.approval.requested`。
控制 UI 和 macOS 应用会通过 `exec.approval.resolve` 处理它，然后 gateway 将
已批准的请求转发给节点主机。

对于 `host=node`，批准请求会包含一个规范的 `systemRunPlan` 负载。gateway 会将
该计划作为转发已批准 `system.run` 请求时的权威命令/cwd/会话上下文。

这对异步批准延迟很重要：

- 节点 exec 路径会预先准备一个规范计划
- 批准记录会存储该计划及其绑定元数据
- 一旦获得批准，最终转发的 `system.run` 调用会复用已存储的计划，
  而不是信任调用方之后的修改
- 如果调用方在批准请求创建后修改了 `command`、`rawCommand`、`cwd`、`agentId` 或
  `sessionKey`，gateway 会将该转发运行拒绝为批准不匹配

## 解释器/运行时命令

带批准支持的解释器/运行时执行路径有意设计得较为保守：

- 始终会绑定精确的 argv/cwd/env 上下文。
- 直接 shell 脚本和直接运行时文件形式会尽力绑定到一个具体本地文件快照。
- 仍然能解析为单个直接本地文件的常见包管理器包装形式（例如
  `pnpm exec`、`pnpm node`、`npm exec`、`npx`）会在绑定前被解包。
- 如果 OpenClaw 无法为解释器/运行时命令识别出恰好一个具体本地文件
  （例如包脚本、eval 形式、运行时特定加载链，或有歧义的多文件形式），
  则会拒绝带批准支持的执行，而不是声称覆盖了并未真正覆盖的语义。
- 对于这些工作流，请优先使用沙箱隔离、单独的主机边界，或者
  采用显式可信的 allowlist/full 工作流，由操作员接受更广泛的运行时语义。

当需要批准时，exec 工具会立即返回一个批准 id。使用该 id 可关联后续系统事件（`Exec finished` / `Exec denied`）。如果在超时前没有收到决定，该请求会被视为批准超时，并作为拒绝原因显示。

### 后续投递行为

在已批准的异步 exec 完成后，OpenClaw 会向同一会话发送一次后续 `agent` 回合。

- 如果存在有效的外部投递目标（可投递渠道加目标 `to`），后续投递会使用该渠道。
- 在仅 Web 聊天或没有外部目标的内部会话流程中，后续投递会保持为仅会话（`deliver: false`）。
- 如果调用方显式请求严格的外部投递，但无法解析到外部渠道，则请求会以 `INVALID_REQUEST` 失败。
- 如果启用了 `bestEffortDeliver` 且无法解析外部渠道，投递会降级为仅会话，而不是失败。

确认对话框包含：

- 命令 + 参数
- cwd
- 智能体 id
- 已解析的可执行文件路径
- 主机 + 策略元数据

操作：

- **Allow once** → 立即运行
- **Always allow** → 加入允许列表 + 运行
- **Deny** → 阻止

## 将批准转发到聊天渠道

你可以将 exec 批准提示转发到任意聊天渠道（包括插件渠道），并通过 `/approve` 批准它们。这会使用普通的出站投递流水线。

配置：
__OC_I18N_900005__
在聊天中回复：
__OC_I18N_900006__
`/approve` 命令同时处理 exec 批准和插件批准。如果该 ID 不匹配待处理的 exec 批准，它会自动继续检查插件批准。

### 插件批准转发

插件批准转发使用与 exec 批准相同的投递流水线，但它在 `approvals.plugin` 下有自己独立的配置。启用或禁用其中一个不会影响另一个。
__OC_I18N_900007__
配置结构与 `approvals.exec` 完全相同：`enabled`、`mode`、`agentFilter`、
`sessionFilter` 和 `targets` 的工作方式一致。

支持共享交互式回复的渠道会为 exec 和插件批准渲染相同的批准按钮。没有共享交互式 UI 的渠道会回退为纯文本加 `/approve` 说明。

### 任意渠道中的同聊天批准

当某个 exec 或插件批准请求源自一个可投递聊天界面时，默认情况下，该聊天现在可以直接通过 `/approve` 批准它。这适用于 Slack、Matrix 和 Microsoft Teams 等渠道，此外也适用于现有的 Web UI 和终端 UI 流程。

这一路径共享的文本命令会使用该对话的普通渠道鉴权模型。如果发起聊天本来就可以发送命令和接收回复，那么批准请求不再需要单独的原生投递适配器才能保持待处理状态。

Discord 和 Telegram 也支持同聊天 `/approve`，但即使禁用了原生批准投递，这些渠道在授权时仍会使用各自已解析的 approver 列表。

对于 Telegram 和其他直接调用 Gateway 网关的原生批准客户端，
这种回退有意限制在“approval not found”失败上。真正的
exec 批准拒绝/错误不会静默重试为插件批准。

### 原生批准投递

某些渠道还可以充当原生批准客户端。原生客户端会在共享的同聊天 `/approve`
流程之上，增加 approver 私信、源聊天扇出和渠道特定的交互式批准 UX。

当原生批准卡片/按钮可用时，该原生 UI 就是面向智能体的主要路径。
除非工具结果表明聊天批准不可用，或手动批准是唯一剩余路径，
否则智能体不应再额外回显重复的纯聊天 `/approve` 命令。

通用模型：

- 是否需要 exec 批准仍由主机 exec 策略决定
- `approvals.exec` 控制是否将批准提示转发到其他聊天目标
- `channels.<channel>.execApprovals` 控制该渠道是否作为原生批准客户端运行

当以下条件全部满足时，原生批准客户端会自动启用私信优先投递：

- 该渠道支持原生批准投递
- 可以从显式 `execApprovals.approvers` 或该渠道文档说明的回退来源中解析 approver
- `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"`

将 `enabled: false` 设为显式禁用原生批准客户端。将 `enabled: true` 设为在 approver 可解析时强制启用。
公开的源聊天投递仍然通过 `channels.<channel>.execApprovals.target` 显式控制。

FAQ：[为什么聊天批准会有两个 exec 批准配置？](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord：`channels.discord.execApprovals.*`
- Slack：`channels.slack.execApprovals.*`
- Telegram：`channels.telegram.execApprovals.*`

这些原生批准客户端会在共享的同聊天 `/approve` 流程和共享批准按钮之上，增加私信路由和可选的渠道扇出。

共享行为：

- Slack、Matrix、Microsoft Teams 以及类似的可投递聊天，会对同聊天 `/approve` 使用普通渠道鉴权模型
- 当某个原生批准客户端自动启用时，默认的原生投递目标是 approver 私信
- 对于 Discord 和 Telegram，只有已解析的 approver 才可以批准或拒绝
- Discord approver 可以是显式的（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Telegram approver 可以是显式的（`execApprovals.approvers`），也可以从现有 owner 配置（`allowFrom`，以及在支持时用于私信的 `defaultTo`）推断
- Slack approver 可以是显式的（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Slack 原生按钮会保留批准 id 类型，因此 `plugin:` id 可以解析为插件批准，而无需第二层 Slack 本地回退
- Matrix 原生私信/渠道路由仅适用于 exec；Matrix 插件批准仍留在共享的同聊天 `/approve` 和可选的 `approvals.plugin` 转发路径上
- 请求者不需要是 approver
- 当源聊天本来就支持命令和回复时，源聊天可以直接通过 `/approve` 批准
- 原生 Discord 批准按钮会按批准 id 类型路由：`plugin:` id 会直接进入插件批准，其他一切会进入 exec 批准
- 原生 Telegram 批准按钮遵循与 `/approve` 相同的有界 exec 到插件回退逻辑
- 当原生 `target` 启用了源聊天投递时，批准提示会包含命令文本
- 待处理 exec 批准默认会在 30 分钟后过期
- 如果没有操作员 UI 或已配置的批准客户端可以接受请求，提示会回退到 `askFallback`

Telegram 默认投递到 approver 私信（`target: "dm"`）。当你希望批准提示也出现在源 Telegram 聊天/话题中时，可切换为 `channel` 或 `both`。对于 Telegram forum 话题，OpenClaw 会保留该话题，用于批准提示和批准后的后续消息。

请参阅：

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC 流程
__OC_I18N_900008__
安全说明：

- Unix socket 模式为 `0600`，token 存储在 `exec-approvals.json` 中。
- 同 UID 对等端检查。
- 挑战/响应（nonce + HMAC token + request hash）+ 短 TTL。

## 系统事件

Exec 生命周期会以系统消息形式呈现：

- `Exec running`（仅当命令超过运行提示阈值时）
- `Exec finished`
- `Exec denied`

这些事件会在节点上报后发布到智能体会话中。
Gateway 网关主机 exec 批准在命令完成时也会发出相同的生命周期事件（如果运行超过阈值，也可在运行中发出）。
受批准门控的 exec 会在这些消息中复用批准 id 作为 `runId`，以便轻松关联。

## 批准被拒绝时的行为

当异步 exec 批准被拒绝时，OpenClaw 会阻止智能体在该会话中复用
此前同一命令的任何早期运行输出。拒绝原因会附带显式说明，指出没有任何命令输出可用，
从而阻止智能体声称存在新的输出，或用先前成功运行的旧结果重复已被拒绝的命令。

## 影响

- **full** 功能强大；如有可能，应优先使用允许列表。
- **ask** 可以让你持续参与决策，同时仍能快速批准。
- 按智能体划分的允许列表可防止某个智能体的批准泄漏到其他智能体。
- 批准仅适用于来自**已授权发送方**的主机 exec 请求。未授权发送方不能发出 `/exec`。
- `/exec security=full` 是面向已授权操作员的会话级便捷方式，并且会按设计跳过批准。
  若要强制阻止主机 exec，请将批准安全级别设为 `deny`，或通过工具策略拒绝 `exec` 工具。

相关内容：

- [Exec 工具](/zh-CN/tools/exec)
- [Elevated 模式](/zh-CN/tools/elevated)
- [Skills](/zh-CN/tools/skills)

## 相关

- [Exec](/zh-CN/tools/exec) — shell 命令执行工具
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 沙箱模式和工作区访问
- [安全](/zh-CN/gateway/security) — 安全模型和加固
- [沙箱 vs 工具策略 vs Elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated) — 何时使用各自方案

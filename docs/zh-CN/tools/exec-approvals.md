---
read_when:
    - 配置执行批准或允许列表
    - 在 macOS 应用中实现执行批准 UX
    - 审查沙箱逃逸提示及其影响
summary: 执行批准、允许列表和沙箱逃逸提示
title: 执行批准
x-i18n:
    generated_at: "2026-04-23T17:31:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: edfc53f7f343969411f9cda848933e7a1ab80076257e4a0802910a910b3a47ea
    source_path: tools/exec-approvals.md
    workflow: 15
---

# 执行批准

执行批准是**配套应用 / 节点宿主机防护机制**，用于让处于沙箱隔离的智能体在真实宿主机（`gateway` 或 `node`）上运行命令。它是一种安全联锁：只有当策略 + 允许列表 +（可选的）用户批准全部一致同意时，命令才会被允许执行。执行批准叠加在工具策略和 elevated 门控**之上**（除非 elevated 设置为 `full`，此时会跳过批准）。

<Note>
生效策略取 `tools.exec.*` 与批准默认值中**更严格**的一方；如果某个批准字段被省略，则使用 `tools.exec` 中的值。宿主机执行还会使用该机器上的本地批准状态 —— 即使会话或配置默认值请求 `ask: "on-miss"`，`~/.openclaw/exec-approvals.json` 中宿主机本地的 `ask: "always"` 仍会持续提示。
</Note>

## 检查生效策略

- `openclaw approvals get`、`... --gateway`、`... --node <id|name|ip>` — 显示请求的策略、宿主机策略来源和最终生效结果。
- `openclaw exec-policy show` — 本地机器的合并视图。
- `openclaw exec-policy set|preset` — 一步将本地请求策略与本地宿主机批准文件同步。

当本地作用域请求 `host=node` 时，`exec-policy show` 会在运行时将该作用域报告为由节点管理，而不是假装本地批准文件才是真实来源。

如果配套应用 UI **不可用**，任何原本通常会触发提示的请求都会由 **ask 回退** 处理（默认值：deny）。

<Tip>
原生聊天批准客户端可以在待处理的批准消息上预置渠道特定的交互方式。例如，Matrix 会预置表情快捷方式（`✅` 允许一次、`❌` 拒绝、`♾️` 始终允许），同时仍在消息中保留 `/approve ...` 命令作为回退方案。
</Tip>

## 适用位置

执行批准会在执行宿主机本地强制执行：

- **Gateway 网关宿主机** → Gateway 网关机器上的 `openclaw` 进程
- **node 宿主机** → 节点运行器（macOS 配套应用或无头 node 宿主机）

信任模型说明：

- 通过 Gateway 网关认证的调用方，是该 Gateway 网关的受信任操作员。
- 已配对节点会将这种受信任操作员能力扩展到 node 宿主机。
- 执行批准可降低意外执行风险，但它不是按用户划分的认证边界。
- 已批准的 node 宿主机运行会绑定规范化执行上下文：规范化 cwd、精确 argv、存在时的 env 绑定，以及适用时固定的可执行文件路径。
- 对于 shell 脚本和直接解释器 / 运行时文件调用，OpenClaw 还会尝试绑定一个具体的本地文件操作数。如果该绑定文件在批准后、执行前发生变化，运行将被拒绝，而不是执行已漂移的内容。
- 这种文件绑定有意设计为尽力而为，并不是对每一种解释器 / 运行时加载路径的完整语义模型。如果批准模式无法识别并精确绑定唯一一个具体本地文件，它会拒绝签发基于批准的运行，而不是假装已完整覆盖。

macOS 拆分：

- **node 宿主服务** 通过本地 IPC 将 `system.run` 转发给 **macOS 应用**。
- **macOS 应用** 在 UI 上下文中执行批准检查并运行命令。

## 设置与存储

批准保存在执行宿主机上的本地 JSON 文件中：

`~/.openclaw/exec-approvals.json`

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
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## 无批准的 “YOLO” 模式

如果你希望宿主机执行在没有批准提示的情况下运行，你必须同时放开**两层**策略：

- OpenClaw 配置中的请求执行策略（`tools.exec.*`）
- `~/.openclaw/exec-approvals.json` 中宿主机本地的批准策略

现在这是默认的宿主机行为，除非你显式收紧它：

- `tools.exec.security`: 在 `gateway` / `node` 上使用 `full`
- `tools.exec.ask`: `off`
- 宿主机 `askFallback`: `full`

重要区别：

- `tools.exec.host=auto` 选择执行运行位置：有沙箱时在沙箱中运行，否则在 gateway 上运行。
- YOLO 决定宿主机执行如何被批准：`security=full` 且 `ask=off`。
- 在 YOLO 模式下，OpenClaw 不会在已配置的宿主机执行策略之上，额外增加单独的启发式命令混淆批准门控或脚本预检拒绝层。
- `auto` 不会让来自沙箱隔离会话的 gateway 路由成为免费覆盖项。每次调用的 `host=node` 请求在 `auto` 下是允许的，而 `host=gateway` 仅在没有活动沙箱运行时时，才允许从 `auto` 发起。如果你想要稳定的非 auto 默认值，请设置 `tools.exec.host`，或显式使用 `/exec host=...`。

如果你想要更保守的设置，可将任意一层收紧回 `allowlist` / `on-miss`
或 `deny`。

持久化的 gateway 宿主机 “永不提示” 设置：

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

然后将宿主机批准文件设置为匹配值：

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

在当前机器上应用相同 gateway 宿主机策略的本地快捷方式：

```bash
openclaw exec-policy preset yolo
```

该本地快捷方式会同时更新：

- 本地 `tools.exec.host/security/ask`
- 本地 `~/.openclaw/exec-approvals.json` 默认值

它有意仅限本地使用。如果你需要远程更改 gateway 宿主机或 node 宿主机的批准，
请继续使用 `openclaw approvals set --gateway` 或
`openclaw approvals set --node <id|name|ip>`。

对于 node 宿主机，请在该节点上应用相同的批准文件：

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

重要的仅限本地限制：

- `openclaw exec-policy` 不会同步节点批准
- `openclaw exec-policy set --host node` 会被拒绝
- node 执行批准会在运行时从节点获取，因此面向节点的更新必须使用 `openclaw approvals --node ...`

仅会话快捷方式：

- `/exec security=full ask=off` 只会更改当前会话。
- `/elevated full` 是一种紧急放行快捷方式，同时也会跳过该会话的执行批准。

如果宿主机批准文件仍比配置更严格，则仍以更严格的宿主机策略为准。

## 策略旋钮

### 安全性（`exec.security`）

- **deny**：阻止所有宿主机执行请求。
- **allowlist**：仅允许允许列表中的命令。
- **full**：允许所有内容（等同于 elevated）。

### 询问（`exec.ask`）

- **off**：从不提示。
- **on-miss**：仅在允许列表不匹配时提示。
- **always**：每个命令都提示。
- 当生效的询问模式为 `always` 时，`allow-always` 的持久信任不会抑制提示

### 询问回退（`askFallback`）

如果需要提示但没有可达的 UI，则由回退决定：

- **deny**：阻止。
- **allowlist**：仅在允许列表匹配时允许。
- **full**：允许。

### 内联解释器 eval 加固（`tools.exec.strictInlineEval`）

当 `tools.exec.strictInlineEval=true` 时，即使解释器二进制文件本身已在允许列表中，OpenClaw 也会将内联代码 eval 形式视为仅可通过批准执行。

示例：

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

这是对无法干净映射到单一稳定文件操作数的解释器加载器所做的纵深防御。在严格模式下：

- 这些命令仍然需要显式批准；
- `allow-always` 不会自动为它们持久化新的允许列表条目。

## 允许列表（按智能体）

允许列表是**按智能体**划分的。如果存在多个智能体，请在 macOS 应用中切换你正在编辑的智能体。模式采用**大小写不敏感的 glob 匹配**。
模式应解析为**二进制文件路径**（仅文件名的条目会被忽略）。
旧版 `agents.default` 条目会在加载时迁移到 `agents.main`。
Shell 链（例如 `echo ok && pwd`）仍然要求每个顶层片段都满足允许列表规则。

示例：

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

每个允许列表条目会跟踪：

- **id**：用于 UI 标识的稳定 UUID（可选）
- **上次使用**
- **上次使用的命令**
- **上次解析到的路径**

## 自动允许 skill CLI

启用 **自动允许 skill CLI** 后，已知 Skills 引用的可执行文件会在节点上（macOS 节点或无头 node 宿主机）被视为已加入允许列表。这会通过 Gateway 网关 RPC 使用
`skills.bins` 获取 skill bin 列表。如果你想要严格的手动允许列表，请禁用此功能。

重要信任说明：

- 这是一个**隐式的便利允许列表**，与手动路径允许列表条目分离。
- 它适用于 Gateway 网关与 node 位于同一信任边界内的受信任操作员环境。
- 如果你需要严格的显式信任，请保持 `autoAllowSkills: false`，并且只使用手动路径允许列表条目。

## 安全二进制文件（仅 stdin）

`tools.exec.safeBins` 定义了一小组**仅 stdin** 的二进制文件（例如 `cut`），它们可以在 allowlist 模式下**无需**显式允许列表条目运行。安全二进制文件会拒绝位置文件参数和类似路径的 token，因此它们只能处理输入流。应将它视为面向流过滤器的狭义快速通道，而不是通用信任列表。

<Warning>
**不要**将解释器或运行时二进制文件（例如 `python3`、`node`、
`ruby`、`bash`、`sh`、`zsh`）添加到 `safeBins` 中。如果命令按设计可以求值代码、执行子命令或读取文件，请优先使用显式允许列表条目，并保持批准提示启用。自定义安全二进制文件必须在 `tools.exec.safeBinProfiles.<bin>` 中定义显式 profile。
</Warning>

默认安全二进制文件：

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` 和 `sort` 不在默认列表中。如果你选择启用它们，请为其非 stdin 工作流保留显式允许列表条目。对于安全二进制文件模式下的 `grep`，
请使用 `-e` / `--regexp` 提供模式；位置模式形式会被拒绝，这样文件操作数就无法伪装成含糊的位置参数。

<AccordionGroup>
  <Accordion title="Argv 验证和被拒绝的标志">
    验证仅基于 argv 形状进行确定性判断（不检查宿主机文件系统中的存在性），这可防止因允许 / 拒绝差异而产生文件存在性预言机行为。默认安全二进制文件会拒绝面向文件的选项；长选项采用失败即关闭的验证方式（未知标志和有歧义的缩写都会被拒绝）。

    按安全二进制文件 profile 列出的被拒绝标志：

    [//]: # "SAFE_BIN_DENIED_FLAGS:START"

    - `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
    - `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
    - `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
    - `wc`: `--files0-from`

    [//]: # "SAFE_BIN_DENIED_FLAGS:END"

    安全二进制文件还会在执行时强制将 argv token 视为**字面文本**（对仅 stdin 片段不进行 glob 展开，也不进行 `$VARS` 扩展），因此像 `*` 或 `$HOME/...` 这样的模式无法被用来伪装文件读取。

  </Accordion>

  <Accordion title="受信任的二进制文件目录">
    安全二进制文件必须解析自受信任的二进制文件目录（系统默认值
    加上可选的 `tools.exec.safeBinTrustedDirs`）。`PATH` 条目绝不会
    被自动视为受信任。默认受信任目录有意保持最小化：
    `/bin`、`/usr/bin`。如果你的安全二进制文件可执行程序位于
    包管理器 / 用户路径中（例如 `/opt/homebrew/bin`、
    `/usr/local/bin`、`/opt/local/bin`、`/snap/bin`），请将它们显式添加到
    `tools.exec.safeBinTrustedDirs`。
  </Accordion>

  <Accordion title="Shell 链接、包装器和多路复用器">
    允许使用 Shell 链接（`&&`、`||`、`;`），前提是每个顶层片段
    都满足允许列表要求（包括安全二进制文件或 skill 自动允许）。
    在 allowlist 模式下，重定向仍不受支持。命令替换
    （`$()` / 反引号）会在 allowlist 解析期间被拒绝，包括在
    双引号内；如果你需要字面量 `$()` 文本，请使用单引号。

    在 macOS 配套应用批准中，包含 Shell 控制
    或扩展语法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、
    `)`）的原始 Shell 文本会被视为 allowlist 未命中，除非 Shell 二进制文件
    本身已在允许列表中。

    对于 Shell 包装器（`bash|sh|zsh ... -c/-lc`），请求作用域的 env
    覆盖会被收缩为一个小型显式允许列表（`TERM`、`LANG`、
    `LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。

    对于 allowlist 模式下的 `allow-always` 决策，已知的分发包装器
    （`env`、`nice`、`nohup`、`stdbuf`、`timeout`）会持久化内部可执行文件
    路径，而不是包装器路径。Shell 多路复用器（`busybox`、`toybox`）
    对其 Shell applet（`sh`、`ash` 等）也会以相同方式解包。如果某个
    包装器或多路复用器无法被安全解包，则不会自动持久化任何允许列表条目。

    如果你将 `python3` 或 `node` 之类的解释器加入允许列表，建议启用
    `tools.exec.strictInlineEval=true`，这样内联 eval 仍然需要
    显式批准。在严格模式下，`allow-always` 仍然可以持久化无害的
    解释器 / 脚本调用，但内联 eval 承载形式不会被自动持久化。

  </Accordion>
  </AccordionGroup>

### 安全二进制文件与 allowlist 的区别

| 主题 | `tools.exec.safeBins` | allowlist（`exec-approvals.json`） |
| ---- | --------------------- | ---------------------------------- |
| 目标 | 自动允许受限的 stdin 过滤器 | 显式信任特定可执行文件 |
| 匹配类型 | 可执行文件名 + 安全二进制文件 argv 策略 | 已解析的可执行文件路径 glob 模式 |
| 参数范围 | 受安全二进制文件 profile 和字面 token 规则限制 | 仅匹配路径；参数的其余部分由你自行负责 |
| 典型示例 | `head`、`tail`、`tr`、`wc` | `jq`、`python3`、`node`、`ffmpeg`、自定义 CLI |
| 最佳用途 | 管道中的低风险文本转换 | 任何行为更广泛或具有副作用的工具 |

配置位置：

- `safeBins` 来自配置（`tools.exec.safeBins` 或按智能体的 `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` 来自配置（`tools.exec.safeBinTrustedDirs` 或按智能体的 `agents.list[].tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` 来自配置（`tools.exec.safeBinProfiles` 或按智能体的 `agents.list[].tools.exec.safeBinProfiles`）。按智能体的 profile 键会覆盖全局键。
- allowlist 条目位于宿主机本地 `~/.openclaw/exec-approvals.json` 中的 `agents.<id>.allowlist` 下（或通过 Control UI / `openclaw approvals allowlist ...`）。
- 当解释器 / 运行时二进制文件出现在 `safeBins` 中但没有显式 profile 时，`openclaw security audit` 会发出 `tools.exec.safe_bins_interpreter_unprofiled` 警告。
- `openclaw doctor --fix` 可以为缺失的自定义 `safeBinProfiles.<bin>` 条目生成 `{}` 骨架（之后请审查并收紧）。解释器 / 运行时二进制文件不会被自动生成骨架。

自定义 profile 示例：
__OC_I18N_900005__
如果你显式将 `jq` 选择加入 `safeBins`，OpenClaw 在安全二进制文件
模式下仍会拒绝 `env` 内建，因此 `jq -n env` 无法在没有显式 allowlist 路径
或批准提示的情况下转储宿主进程环境。

## 在 Control UI 中编辑

使用 **Control UI → Nodes → Exec approvals** 卡片来编辑默认值、按智能体的
覆盖项以及 allowlist。选择一个作用域（默认值或某个智能体），调整策略，
添加 / 删除 allowlist 模式，然后点击 **Save**。UI 会显示每个模式的
**上次使用** 元数据，以便你保持列表整洁。

目标选择器可选择 **Gateway**（本地批准）或 **Node**。节点
必须声明 `system.execApprovals.get/set`（macOS 应用或无头 node 宿主机）。
如果某个节点尚未声明执行批准，请直接编辑它本地的
`~/.openclaw/exec-approvals.json`。

CLI：`openclaw approvals` 支持编辑 gateway 或 node（参见 [Approvals CLI](/cli/approvals)）。

## 批准流程

当需要提示时，gateway 会向操作员客户端广播 `exec.approval.requested`。
Control UI 和 macOS 应用通过 `exec.approval.resolve` 处理它，然后 gateway 将
已批准的请求转发给 node 宿主机。

对于 `host=node`，批准请求会包含规范化的 `systemRunPlan` 负载。gateway 会在转发已批准的 `system.run`
请求时，将该 plan 作为权威的命令 / cwd / 会话上下文。

这对异步批准延迟很重要：

- node 执行路径会预先准备一个规范化 plan
- 批准记录会存储该 plan 及其绑定元数据
- 一旦获得批准，最终转发的 `system.run` 调用会复用已存储的 plan
  而不是信任调用方之后的修改
- 如果调用方在批准请求创建后更改了 `command`、`rawCommand`、`cwd`、`agentId` 或
  `sessionKey`，gateway 会以批准不匹配为由拒绝
  该转发执行

## 解释器 / 运行时命令

基于批准的解释器 / 运行时执行刻意采取保守策略：

- 精确的 argv / cwd / env 上下文始终会被绑定。
- 直接 Shell 脚本和直接运行时文件形式会尽力绑定到一个具体的本地
  文件快照。
- 仍会解析为单个直接本地文件的常见包管理器包装形式（例如
  `pnpm exec`、`pnpm node`、`npm exec`、`npx`）会在绑定前被解包。
- 如果 OpenClaw 无法为某个解释器 / 运行时命令精确识别出唯一一个具体本地文件
  （例如包脚本、eval 形式、运行时特定的加载器链，或含糊的多文件
  形式），则基于批准的执行会被拒绝，而不是声称具备它实际上并不具备的
  语义覆盖能力。
- 对于这些工作流，优先考虑沙箱隔离、单独的宿主边界，或显式受信任的
  allowlist / full 工作流，由操作员接受更宽泛的运行时语义。

当需要批准时，exec 工具会立即返回一个批准 id。使用该 id 来
关联后续系统事件（`Exec finished` / `Exec denied`）。如果在超时前没有收到决定，
该请求会被视为批准超时，并作为拒绝原因呈现。

### 后续消息投递行为

已批准的异步 exec 完成后，OpenClaw 会向同一会话发送一个后续 `agent` 回合。

- 如果存在有效的外部投递目标（可投递的渠道加目标 `to`），后续投递会使用该渠道。
- 在仅 webchat 或无外部目标的内部会话流中，后续投递会保持仅会话内（`deliver: false`）。
- 如果调用方显式请求严格的外部投递，但无法解析出外部渠道，则请求会以 `INVALID_REQUEST` 失败。
- 如果启用了 `bestEffortDeliver` 且无法解析出外部渠道，则投递会降级为仅会话内，而不是失败。

确认对话框包括：

- command + args
- cwd
- 智能体 id
- 已解析的可执行文件路径
- host + policy 元数据

操作：

- **Allow once** → 立即运行
- **Always allow** → 添加到 allowlist + 运行
- **Deny** → 阻止

## 将批准转发到聊天渠道

你可以将执行批准提示转发到任何聊天渠道（包括渠道插件），并通过
`/approve` 批准它们。这使用正常的出站投递管道。

配置：
__OC_I18N_900006__
在聊天中回复：
__OC_I18N_900007__
`/approve` 命令同时处理执行批准和插件批准。如果该 ID 与待处理的执行批准不匹配，它会自动改为检查插件批准。

### 插件批准转发

插件批准转发使用与执行批准相同的投递管道，但在 `approvals.plugin` 下拥有自己独立的配置。启用或禁用其中一方不会影响另一方。
__OC_I18N_900008__
其配置结构与 `approvals.exec` 完全相同：`enabled`、`mode`、`agentFilter`、
`sessionFilter` 和 `targets` 的工作方式相同。

支持共享交互式回复的渠道会为执行批准和插件批准都渲染相同的批准按钮。没有共享交互式 UI 的渠道则会回退为带 `/approve`
说明的纯文本。

### 任意渠道中的同聊天批准

当执行或插件批准请求来自可投递的聊天界面时，现在默认可以在同一聊天中使用 `/approve` 进行批准。这适用于 Slack、Matrix 和 Microsoft Teams 等渠道，以及现有的 Web UI 和终端 UI 流程。

这种共享文本命令路径使用该会话的正常渠道认证模型。如果发起聊天本来就可以发送命令并接收回复，那么批准请求就不再需要单独的原生投递适配器才能保持待处理状态。

Discord 和 Telegram 也支持在同一聊天中使用 `/approve`，但即使禁用了原生批准投递，这些渠道在授权时仍会使用其已解析的批准人列表。

对于 Telegram 和其他直接调用 Gateway 网关的原生批准客户端，
这种回退有意仅限于“未找到批准”失败。真正的
执行批准拒绝 / 错误不会被静默重试为插件批准。

### 原生批准投递

某些渠道还可以充当原生批准客户端。原生客户端会在共享的同聊天 `/approve`
流程之上，增加批准人私信、来源聊天扇出以及渠道特定的交互式批准 UX。

当原生批准卡片 / 按钮可用时，该原生 UI 是主要的
智能体面向路径。除非工具结果表明聊天批准不可用，或手动批准是唯一剩余路径，否则智能体不应再额外回显一条重复的纯聊天
`/approve` 命令。

通用模型：

- 宿主机执行策略仍决定是否需要执行批准
- `approvals.exec` 控制是否将批准提示转发到其他聊天目标
- `channels.<channel>.execApprovals` 控制该渠道是否充当原生批准客户端

当以下条件全部满足时，原生批准客户端会自动启用私信优先投递：

- 该渠道支持原生批准投递
- 可以从显式的 `execApprovals.approvers` 或该
  渠道文档说明的回退来源解析出批准人
- `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"`

将 `enabled: false` 设为显式禁用某个原生批准客户端。将 `enabled: true` 设为在批准人可解析时强制启用它。公开的来源聊天投递仍通过
`channels.<channel>.execApprovals.target` 显式控制。

FAQ：[为什么聊天批准会有两个执行批准配置？](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord：`channels.discord.execApprovals.*`
- Slack：`channels.slack.execApprovals.*`
- Telegram：`channels.telegram.execApprovals.*`

这些原生批准客户端会在共享的同聊天 `/approve` 流程和共享批准按钮之上，
增加私信路由和可选的渠道扇出。

共享行为：

- Slack、Matrix、Microsoft Teams 以及类似的可投递聊天使用正常的渠道认证模型
  处理同聊天 `/approve`
- 当原生批准客户端自动启用时，默认的原生投递目标是批准人私信
- 对于 Discord 和 Telegram，只有已解析的批准人可以批准或拒绝
- Discord 批准人可以显式指定（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Telegram 批准人可以显式指定（`execApprovals.approvers`），也可以从现有的所有者配置推断（`allowFrom`，以及在支持时的私信 `defaultTo`）
- Slack 批准人可以显式指定（`execApprovals.approvers`），也可以从 `commands.ownerAllowFrom` 推断
- Slack 原生按钮会保留批准 id 类型，因此 `plugin:` id 可以解析为插件批准，
  而无需第二层 Slack 本地回退
- Matrix 原生私信 / 渠道路由和表情快捷方式同时处理执行批准和插件批准；
  插件授权仍来自 `channels.matrix.dm.allowFrom`
- 请求者不需要是批准人
- 如果来源聊天已支持命令和回复，则可直接在该聊天中通过 `/approve` 批准
- 原生 Discord 批准按钮按批准 id 类型路由：`plugin:` id 会
  直接进入插件批准，其他所有内容都进入执行批准
- 原生 Telegram 批准按钮遵循与 `/approve` 相同的有界执行到插件回退
- 当原生 `target` 启用来源聊天投递时，批准提示会包含命令文本
- 待处理的执行批准默认在 30 分钟后过期
- 如果没有操作员 UI 或已配置的批准客户端可接受请求，则提示会回退到 `askFallback`

Telegram 默认发送到批准人私信（`target: "dm"`）。如果你希望批准提示也显示在来源 Telegram 聊天 / 话题中，可以切换为 `channel` 或 `both`。对于 Telegram 论坛话题，OpenClaw 会保留该话题用于批准提示和批准后的后续消息。

参见：

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC 流程
__OC_I18N_900009__
安全说明：

- Unix socket 模式为 `0600`，token 存储在 `exec-approvals.json` 中。
- 同 UID 对等端检查。
- 质询 / 响应（nonce + HMAC token + 请求哈希）+ 短 TTL。

## 系统事件

执行生命周期会以系统消息的形式呈现：

- `Exec running`（仅当命令超过运行中通知阈值时）
- `Exec finished`
- `Exec denied`

这些事件会在节点上报该事件后发布到智能体的会话中。
Gateway 宿主机执行批准在命令完成时也会发出相同的生命周期事件（如果运行时间超过阈值，也可选择在运行中发出）。
受批准门控的执行会在这些消息中复用批准 id 作为 `runId`，便于关联。

## 批准被拒绝时的行为

当异步执行批准被拒绝时，OpenClaw 会阻止智能体复用
该会话中此前相同命令的任何运行输出。拒绝原因
会附带明确指引，说明没有可用的命令输出，从而阻止
智能体声称有新的输出，或使用先前成功运行的陈旧结果
重复被拒绝的命令。

## 影响

- **full** 很强大；尽可能优先使用 allowlist。
- **ask** 让你保持在决策环中，同时仍支持快速批准。
- 按智能体划分的 allowlist 可防止某个智能体的批准泄漏给其他智能体。
- 批准仅适用于来自**已授权发送方**的宿主机执行请求。未授权发送方无法发出 `/exec`。
- `/exec security=full` 是面向已授权操作员的会话级便捷方式，并且按设计会跳过批准。若要硬性阻止宿主机执行，请将批准安全性设为 `deny`，或通过工具策略拒绝 `exec` 工具。

## 相关内容

<CardGroup cols={2}>
  <Card title="Exec 工具" href="/zh-CN/tools/exec" icon="terminal">
    Shell 命令执行工具。
  </Card>
  <Card title="Elevated 模式" href="/zh-CN/tools/elevated" icon="shield-exclamation">
    同样会跳过批准的紧急放行路径。
  </Card>
  <Card title="沙箱隔离" href="/zh-CN/gateway/sandboxing" icon="box">
    沙箱模式和工作区访问。
  </Card>
  <Card title="安全" href="/zh-CN/gateway/security" icon="lock">
    安全模型与加固。
  </Card>
  <Card title="沙箱隔离 vs 工具策略 vs elevated" href="/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    何时应使用各项控制。
  </Card>
  <Card title="Skills" href="/zh-CN/tools/skills" icon="sparkles">
    由 skill 支持的自动允许行为。
  </Card>
</CardGroup>

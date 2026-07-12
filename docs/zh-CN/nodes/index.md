---
read_when:
    - 将 iOS/watchOS/Android 节点配对到 Gateway 网关
    - 使用节点画布/摄像头作为智能体上下文
    - 添加新的节点命令或 CLI 辅助函数
summary: 节点：配对、能力、权限，以及用于画布/摄像头/屏幕/设备/通知/系统的 CLI 辅助工具
title: 节点
x-i18n:
    generated_at: "2026-07-12T21:25:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c3a13a2b879bef2356a7b28fe207842d64061ba5333f14a1435cc65ae6da85f1
    source_path: nodes/index.md
    workflow: 16
---

**节点**是一种连接到 Gateway 网关的配套设备（macOS/iOS/watchOS/Android/无头设备），使用 `role: "node"`，并通过 `node.invoke` 暴露命令接口（例如 `canvas.*`、`camera.*`、`device.*`、`notifications.*`、`system.*`）。大多数节点使用操作员端口上的 Gateway 网关 WebSocket。可选的直连 Apple Watch 节点在同一端口上使用签名 HTTPS 轮询，因为 watchOS 会阻止普通应用使用通用底层网络功能。协议详情：[Gateway 协议](/zh-CN/gateway/protocol)。

旧版传输协议：[Bridge protocol](/zh-CN/gateway/bridge-protocol)（TCP JSONL；对于当前节点仅作历史参考）。

macOS 也可以在**节点模式**下运行：菜单栏应用作为一个节点连接到 Gateway 网关的
WS 服务器（因此可对这台 Mac 使用 `openclaw nodes …`）。该应用
会将原生 Canvas、摄像头、屏幕、通知和计算机控制命令
添加到 `openclaw node run` 所使用的同一节点主机命令接口中。不要在这台
Mac 上启动第二个 CLI 节点；该应用会将对应的 CLI 节点主机运行时作为
内部工作进程运行，并保持为唯一的 Gateway 网关连接和节点身份。

节点是**外围设备**，而不是网关：它们不运行网关服务，渠道消息（Telegram、WhatsApp 等）会到达网关，而不是节点。

故障排查运行手册：[/nodes/troubleshooting](/zh-CN/nodes/troubleshooting)

## 配对 + 状态

节点使用**设备配对**。节点在连接期间提供签名设备身份；Gateway 网关会为 `role: node` 创建设备配对请求。通过设备 CLI（或 UI）批准。直连 Apple Watch 设置使用管理员签发的短期、仅限节点的设置代码，批准其固定的低风险命令接口；后续扩展能力仍需要常规批准。

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

待处理的配对请求会在设备最后一次重试的 5 分钟后过期——持续重新连接的设备会维持其唯一的待处理请求（及 `requestId`）有效，而不是每隔几分钟生成一个新提示；完整的请求/批准生命周期请参阅[节点配对](/zh-CN/gateway/pairing)。如果节点重试时身份验证详情发生变化（角色/权限范围/公钥），之前的待处理请求会被取代，并创建新的 `requestId`——客户端会收到被取代请求的 `device.pair.resolved` 事件，你应在批准前重新运行 `openclaw devices list`。

- 当设备配对角色包含 `node` 时，`nodes status` 会将节点标记为**已配对**。
- 已连接且具有辅助功能权限的原生 Mac 可以报告合并后的
  物理输入活动。Gateway 网关会将最新的合格 Mac 标记为
  `active`，向智能体提供稳定的节点 ID 提示，并优先将节点连接
  警报路由到该 Mac，然后才进行延迟回退。有关设置、隐私、时序和
  故障排查，请参阅
  [活动计算机存在状态](/zh-CN/nodes/presence)。
- 设备配对记录是持久的已批准角色契约。令牌轮换始终位于该契约范围内；它无法将已配对节点升级为配对批准从未授予的角色。
- `node.pair.*`（CLI：`openclaw nodes pending/approve/reject/remove/rename`）是一个独立的、由网关所有的节点配对存储，用于跟踪节点在重新连接期间获准使用的命令/能力接口。它**不**控制传输身份验证——这由设备配对负责。
- `openclaw nodes remove --node <id|name|ip>` 会移除节点配对。对于由设备支持的节点，它会在已配对设备存储中撤销该设备的 `node` 角色，并断开该设备具有节点角色的会话：多角色设备会保留其记录，仅失去 `node` 角色；仅节点设备的记录则会被删除。它还会清除独立节点配对存储中的所有匹配条目。`operator.pairing` 可以移除其他设备上的非操作员节点记录；使用设备令牌的调用方在多角色设备上撤销自己的节点角色时，还需要 `operator.admin`。
- 批准所需的权限范围取决于待处理请求声明的命令：
  - 无命令请求：`operator.pairing`
  - 非 exec 节点命令：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`：`operator.pairing` + `operator.admin`

## 版本偏差和升级顺序

Gateway 网关 WebSocket 接受处于 N-1 协议窗口内且通过身份验证的节点客户端。
因此，当前的 v4 Gateway 网关会接受 v3 节点，前提是连接同时声明
`role: "node"` 和 `client.mode: "node"`。操作员和 UI 会话
仍必须使用当前协议。

对于分阶段的设备群升级，请先升级 Gateway 网关，再升级各个节点。
N-1 节点在升级期间仍然可见且可管理；Gateway 网关会记录
`legacy node protocol accepted`，并附带升级建议。配对、
设备身份验证、命令允许列表和 exec 审批仍然适用。
插件所有的能力和命令会保持隐藏，直到节点升级到
当前协议。早于 N-1 的节点需要先通过带外方式升级，
然后才能重新连接。

直连 watchOS HTTPS 传输要求使用当前协议版本；启用
直连模式前，请将 watch 应用与 Gateway 网关一同更新。

## 远程节点主机（system.run）

当 Gateway 网关运行在一台机器上，而你希望命令在另一台机器上执行时，请使用**节点主机**。模型仍与**网关**通信；选择 `host=node` 后，网关会将 `exec` 调用转发到**节点主机**。

| 角色         | 职责                                                   |
| ------------ | ---------------------------------------------------------------- |
| Gateway 网关主机 | 接收消息、运行模型、路由工具调用。            |
| 节点主机    | 在节点机器上执行 `system.run`/`system.which`。        |
| 审批    | 通过节点主机上的 `~/.openclaw/exec-approvals.json` 强制执行。 |

审批说明：

- 由审批支持的节点运行会绑定确切的请求上下文。exec 路径在审批前准备规范的 `systemRunPlan`；获得批准后，网关会转发已存储的计划，而不是调用方后来编辑的任何命令/cwd/会话字段，并在运行前重新验证工作目录。
- 对于直接执行 shell/运行时文件的情况，OpenClaw 还会尽力绑定一个具体的本地文件操作数；如果该文件在执行前发生变化，则拒绝运行。
- 如果 OpenClaw 无法为解释器/运行时命令准确识别一个具体的本地文件，则会拒绝由审批支持的执行，而不会假装能够完整覆盖运行时。对于更广泛的解释器语义，请使用沙箱隔离、独立主机，或明确可信的允许列表/完整工作流。

### 启动节点主机（前台）

在节点机器上：

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` 还接受 `--context-path`（Gateway 网关 WS 上下文路径）、`--tls`、`--tls-fingerprint <sha256>` 和 `--node-id`（覆盖旧版客户端实例 ID；这不会重置配对）。

### 通过 SSH 隧道连接远程网关（环回绑定）

如果 Gateway 网关绑定到环回地址（`gateway.bind=loopback`，本地模式下的默认值），远程节点主机将无法直接连接。请创建 SSH 隧道，并让节点主机连接到隧道的本地端。

示例（节点主机 -> 网关主机）：

```bash
# 终端 A（保持运行）：将本地 18790 转发到网关 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# 终端 B：导出网关令牌并通过隧道连接
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

说明：

- `openclaw node run` 支持令牌或密码身份验证。
- 首选环境变量：`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 配置回退项为 `gateway.auth.token` / `gateway.auth.password`。
- 在本地模式下，节点主机会有意忽略 `gateway.remote.token` / `gateway.remote.password`。
- 在远程模式下，可以根据远程优先级规则使用 `gateway.remote.token` / `gateway.remote.password`。
- 如果配置了有效的本地 `gateway.auth.*` SecretRef 但无法解析，节点主机身份验证会以失败关闭方式处理。
- 节点主机身份验证解析仅接受 `OPENCLAW_GATEWAY_*` 环境变量。

### 启动节点主机（服务）

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` 还接受 `--context-path`、`--tls`、`--tls-fingerprint`、`--node-id`（仅限旧版客户端实例 ID）、`--runtime <node|bun>`（默认值：node）和用于重新安装的 `--force`。还可以使用 `node status`、`node stop` 和 `node uninstall`。

### 配对 + 命名

在网关主机上：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

如果节点重试时身份验证详情发生变化，请重新运行 `openclaw devices list` 并批准当前的 `requestId`。

命名选项：

- 在 `openclaw node run` / `openclaw node install` 中使用 `--display-name`（持久保存在节点上的 `~/.openclaw/node.json` 中，与客户端实例 ID 和 Gateway 网关连接元数据一起存储）。
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`（网关覆盖名称）。

### 节点托管的 MCP 服务器

在节点机器的 `openclaw.json` 中配置 MCP 服务器，而不是在
Gateway 网关上配置：

```json5
{
  nodeHost: {
    mcp: {
      servers: {
        localDocs: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "/srv/docs"],
          toolFilter: {
            include: ["read_*", "search"],
          },
        },
        internalApi: {
          url: "https://mcp.internal.example/mcp",
          transport: "streamable-http",
          headers: {
            Authorization: "Bearer ${INTERNAL_MCP_TOKEN}",
          },
        },
      },
    },
  },
}
```

无头节点主机会启动这些服务器、列出其工具，并在连接后发布
描述符。工具调用通过 `mcp.tools.call.v1` 返回该节点；Gateway 网关不需要
匹配的 MCP 配置或 JS 插件。此节点托管的 v1 路径不支持 OAuth MCP
服务器。

当前节点主机在初次配对期间会声明内置的 `mcp.tools.call.v1` 命令族，
即使没有配置任何 MCP 服务器也是如此。在旧版 OpenClaw 上配对的节点
可能会在节点主机更新后请求一次性命令接口升级。此后添加、移除或筛选
服务器不需要重新配对，因为获批的命令族没有改变。重启
`openclaw node run` 或 `openclaw node restart` 以应用节点 MCP 配置更改；
节点主机不会监视此配置。

Gateway 网关操作员可以通过
`gateway.nodes.pluginTools.enabled: false` 忽略已配对节点发布的所有智能体可见工具，
包括节点托管的 MCP 工具。精确的命令拒绝项（例如
`gateway.nodes.denyCommands: ["mcp.tools.call.v1"]`）也会阻止执行。

### 节点托管的 Skills

将 Skills 安装在节点机器当前使用的 OpenClaw Skills 目录下，
默认目录为 `~/.openclaw/skills`。`OPENCLAW_HOME`、`OPENCLAW_STATE_DIR` 和
`OPENCLAW_CONFIG_PATH` 会移动该活动配置文件。对于 Skills，
`OPENCLAW_STATE_DIR` 具有优先权；否则，`skills/` 位于
`openclaw config file` 所打印路径的旁边。无头节点主机会在连接后发布有效的
`SKILL.md` 文件，并且仅在该节点保持连接时，Gateway 网关才会将它们添加到智能体 Skills
快照中。每个 Skills 目录名称都必须与 frontmatter 中的 `name`
字段匹配，以便抽象节点定位器映射到单个条目，而无需添加
其他协议字段。

初始节点角色配对会批准 Skills 发布。添加、移除或
更改 Skills 不需要再次配对或更改 Gateway 网关配置。
更改节点 Skills 文件后，请重启 `openclaw node run` 或
`openclaw node restart`；节点主机不会监视 Skills 目录。

托管在节点上的 Skills 条目会标识其节点，并携带其执行
位置。Skills 文件、引用的相对路径和二进制文件都保留在该
节点上。智能体使用常规 `read` 工具读取公布的 `node://.../SKILL.md`
位置。`file_fetch` 接受操作员批准的节点绝对路径，
而不接受节点 Skills 定位符；不具备常规读取工具的运行时，可以改为通过
`exec host=node node=<node-id>` 运行 `cat SKILL.md`，并将公布的
`node://.../skills/<name>` 目录用作 `workdir`。引用的文件和二进制文件
使用相同的 Exec 目标和工作目录。节点主机会根据
其当前 OpenClaw 状态目录解析该定位符，因此相对路径会在节点上解析，
而不是在 Gateway 网关计算机上解析。发布节点必须已批准 `system.run`，
且智能体的 Exec 策略必须允许 `host=node`；否则该 Skills 不会进入
该智能体的快照。

在节点上设置 `nodeHost.skills.enabled: false` 可停止发布。Gateway 网关
操作员可使用 `gateway.nodes.skills.enabled: false` 忽略所有已配对节点的
Skills。

### 无头身份状态

无头节点维护三个独立的状态文件：

- `~/.openclaw/node.json`：旧版客户端实例 ID（存储为 `nodeId`）、显示名称和 Gateway 网关连接元数据。
- `~/.openclaw/identity/device.json`：已签名的设备密钥对和派生的加密设备 ID。
- `~/.openclaw/identity/device-auth.json`：以加密设备 ID 和角色为键的已配对设备身份验证令牌。

对于已签名节点，Gateway 网关使用加密设备 ID 进行配对和
节点路由。客户端实例 ID 仅是连接元数据。因此，更改
`--node-id` 或仅删除 `node.json` 不会重置配对。有关
受支持的撤销并重新配对流程和升级说明，请参阅
[身份和配对状态](/zh-CN/cli/node#identity-and-pairing-state)。

### 将命令加入允许列表

Exec 审批是**按节点主机**配置的。从 Gateway 网关添加允许列表条目：

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

审批信息存储在节点主机的 `~/.openclaw/exec-approvals.json` 中。

### 将 Exec 指向节点

配置默认值（Gateway 网关配置）：

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

或者按会话配置：

```text
/exec host=node security=allowlist node=<id-or-name>
```

设置后，任何带有 `host=node` 的 `exec` 调用都会在节点主机上运行（受节点允许列表/审批约束）。

`host=auto` 本身不会隐式选择节点，但 `auto` 允许显式的单次调用 `host=node` 请求。如果希望节点 Exec 成为会话默认设置，请显式设置 `tools.exec.host=node` 或 `/exec host=node ...`。

相关内容：

- [节点主机 CLI](/zh-CN/cli/node)
- [Exec 工具](/zh-CN/tools/exec)
- [Exec 审批](/zh-CN/tools/exec-approvals)

### 本地模型推理

桌面或服务器节点可以公开该节点上运行的 Ollama 服务器所提供的聊天模型。智能体使用 Ollama 插件的 `node_inference` 工具发现已安装的模型，并远程运行有界提示词；Gateway 网关无需直接通过网络访问 Ollama。有关设置、模型筛选和直接验证命令，请参阅 [Ollama 节点本地推理](/zh-CN/providers/ollama#node-local-inference)。

### Codex 会话和转录记录

官方 `codex` 插件可以公开无头节点主机或原生 macOS 节点上
未归档的 Codex 会话。目录注册不再依赖
`supervision.enabled`；该选项控制面向智能体的监督工具。
该插件仍必须在两台计算机上都处于活动状态，而节点设置仍代表
本地同意：仅在 Gateway 网关上启用它无法读取另一台计算机的 Codex
状态。

节点会公布带版本的只读命令
`codex.appServer.threads.list.v1` 和
`codex.appServer.thread.turns.list.v1`。这些命令首次出现时，请批准节点配对
升级。Gateway 网关通过常规插件节点策略调用这些命令，并按主机隔离故障。

已配对节点的行会作为 **Codex** 分组显示在常规会话侧边栏中。
选择一行会打开常规聊天窗格，并通过有界、基于游标分页的
`thread/turns/list` 调用读取其持久化转录记录，其中包含完整的条目投影。节点调用传输仅支持请求/响应，无法
承载通过 Codex harness 继续原生线程所需的流式轮次、实时事件或审批。
因此，远程行无法使用 **继续** 和 **归档**。在 Gateway 网关计算机上，已存储且空闲的
行可以启动一个独立的模型锁定聊天分支。只有在
操作员确认没有其他 Codex 客户端正在使用相应会话后，二者才能归档；已存储
行的实时活动状态仍然未知。活动行无法创建分支或归档。

有关设置、分页、本地继续和元数据安全边界，请参阅
[监督 Codex 会话](/zh-CN/plugins/codex-supervision)。

### Claude 会话和转录记录

内置 `anthropic` 插件会发现 Gateway 网关和已配对节点上未归档的 Claude CLI 和 Claude
Desktop 会话。与 Codex 监督不同，
此功能无需单独选择启用：启用 Anthropic 插件且 `~/.claude/projects/`
存在时，远程 macOS 应用节点会公布
`anthropic.claude.sessions.list.v1` 和 `anthropic.claude.sessions.read.v1`。
这些命令首次出现时，请批准节点配对升级。

目录会将有效的 Claude CLI 项目索引记录与当前 `sdk-cli` JSONL 文件中有界的
元数据前缀合并。Claude Desktop 的本地
元数据提供 Desktop 标题和归档状态。当
两个来源引用同一个 Claude Code 会话 ID 时，以 Desktop 元数据为准；仅 CLI 的转录记录
仍然可见，因为 CLI 没有归档标志。转录记录读取使用不透明的
字节偏移游标和有界的文件反向读取，因此选择大型
会话或加载更早的页面时，不会将整个 JSONL 历史记录读入单个
Gateway 网关响应。

两个节点命令均为只读。它们仅通过通用的 `sessions.catalog.list` 和
`sessions.catalog.read` 方法，向具有 `operator.write` 的
已通过身份验证的操作员连接公开目录元数据和转录记录
内容。已配对节点的行保持仅查看状态。Gateway 网关本地的 Claude CLI
行可从常规聊天编辑器接管：OpenClaw 导入有界的
可见历史记录，在第一个轮次使用 `--fork-session` 恢复，并保持
源转录记录不变。Claude Desktop 行保持仅查看状态。

有关 Control UI 行为和存储来源，请参阅
[Anthropic：跨计算机的 Claude 会话](/zh-CN/providers/anthropic#claude-sessions-across-computers)。

## 调用命令

低级调用（原始 RPC）：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` 会阻止 `system.run` 和 `system.run.prepare`；这些命令只能通过带有 `host=node` 的 `exec` 工具运行（见上文）。对于常见的“向智能体提供 MEDIA 附件”工作流（画布、相机、屏幕、位置，见下文），还提供了更高级别的辅助命令。

## 命令策略

节点命令必须通过两个门控后才能调用：

1. 节点必须在其已通过身份验证的连接元数据（`connect.commands`）中声明该命令。
2. Gateway 网关基于平台和审批得出的允许列表必须包含已声明的命令。

各平台的默认允许列表（应用插件默认值和 `allowCommands`/`denyCommands` 覆盖之前）：

| 平台 | 默认允许的命令                                                                                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`、`location.get`、`device.info`、`device.status`、`contacts.search`、`calendar.events`、`reminders.list`、`photos.latest`、`motion.activity`、`motion.pedometer`、`system.notify`                                                                                                                        |
| watchOS  | `device.info`、`device.status`、`system.notify`                                                                                                                                                                                                                                                                       |
| Android  | `camera.list`、`location.get`、`notifications.list`、`notifications.actions`、`system.notify`、`device.info`、`device.status`、`device.permissions`、`device.health`、`device.apps`、`contacts.search`、`calendar.events`、`callLog.search`、`reminders.list`、`photos.latest`、`motion.activity`、`motion.pedometer` |
| macOS    | `camera.list`、`location.get`、`device.info`、`device.status`、`contacts.search`、`calendar.events`、`reminders.list`、`photos.latest`、`motion.activity`、`motion.pedometer`、`system.notify`                                                                                                                        |
| Windows  | `camera.list`、`location.get`、`device.info`、`device.status`、`system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify`（`system.run` 等节点主机命令受审批门控，见下文）                                                                                                                                                                                                                                  |

这些行描述的是 Gateway 网关策略上限，而不是每个节点应用都实现的命令。只有已连接节点也声明了某个命令时，该命令才可用。特别是，当前 macOS 应用并未声明 macOS 策略行中列出的设备和个人数据命令族。

`canvas.*` 命令（`canvas.present`、`canvas.hide`、`canvas.navigate`、`canvas.eval`、`canvas.snapshot`、`canvas.a2ui.*`）是 iOS、Android、macOS、Windows 和未知平台（不包括 Linux）上的插件默认命令；在 iOS 上，所有这些命令都仅限前台使用。

对于任何公布 `talk` 能力或声明 `talk.*` 命令的节点，默认允许 `talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once`，与平台标签无关。

桌面主机命令（`system.run`、`system.run.prepare`、`system.which`、`browser.proxy`、`mcp.tools.call.v1`，以及 macOS/Windows 上的 `screen.snapshot`）不属于上面的静态平台默认表。操作员批准声明这些命令的配对请求后，它们即可使用；此后，节点已批准的命令集会在重新连接时继续携带这些命令。

危险或高度涉及隐私的命令即使已由节点声明，仍需通过 `gateway.nodes.allowCommands` 显式选择启用：`camera.snap`、`camera.clip`、`screen.record`、`computer.act`、`contacts.add`、`calendar.add`、`reminders.add`、`sms.send`、`sms.search`。`gateway.nodes.denyCommands` 的优先级始终高于默认值和额外允许列表条目。有关桌面输入相关的其他 macOS、工具策略和启用门控，请参阅[计算机使用](/zh-CN/nodes/computer-use)。

插件拥有的节点命令可以添加 Gateway 网关节点调用策略。该策略在允许列表检查之后、转发到节点之前运行，因此原始 `node.invoke`、CLI 辅助命令和专用智能体工具共享同一插件权限边界。危险的插件节点命令仍需通过 `gateway.nodes.allowCommands` 显式选择启用。

节点更改其声明的命令列表后，请拒绝旧的设备配对并批准新请求，以便 Gateway 网关存储更新后的命令快照。

## 配置（`openclaw.json`）

节点相关设置位于 `gateway.nodes` 和 `tools.exec` 下：

```json5
{
  gateway: {
    nodes: {
      // 自动批准来自可信网络（CIDR 列表）的首次节点配对。
      // 未设置时禁用。仅适用于未请求权限范围的首次 role:node 请求；
      // 不会自动批准升级。
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
        // 通过 SSH 验证的自动批准（默认：启用）。当通过 SSH 回读的
        // 设备密钥完全匹配时，批准首次节点配对。
        sshVerify: true,
      },
      // 信任已配对节点发布的智能体可见插件工具（默认：true）。
      pluginTools: {
        enabled: true,
      },
      // 选择启用危险或高度涉及隐私的节点命令（camera.snap 等）。
      allowCommands: ["camera.snap", "screen.record"],
      // 即使默认值或 allowCommands 包含命令，也按确切命令名称阻止它。
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // 默认 Exec 主机："node" 会将所有 Exec 调用路由到已配对节点。
      host: "node",
      // 节点 Exec 的安全模式：仅允许已批准或已加入允许列表的命令。
      security: "allowlist",
      // 将 Exec 固定到特定节点（ID 或名称）。省略则允许使用任意节点。
      node: "build-node",
    },
  },
}
```

请使用确切的节点命令名称。即使平台默认值或 `allowCommands` 条目原本会允许某个命令，`denyCommands` 也会将其移除。默认情况下，已配对节点可以发布智能体可见的插件工具描述符，但每个描述符对应的命令仍必须位于节点已批准的命令范围内。设置 `gateway.nodes.pluginTools.enabled: false` 可忽略所有此类描述符。有关 Gateway 网关节点配对和命令策略字段的详细信息，请参阅 [Gateway 配置参考](/zh-CN/gateway/configuration-reference#gateway)。

按智能体覆盖 Exec 节点：

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: { exec: { node: "build-node" } },
      },
    ],
  },
}
```

## 屏幕截图（Canvas 快照）

如果节点正在显示 Canvas（WebView），`canvas.snapshot` 将返回 `{ format, base64 }`。

CLI 辅助命令（写入临时文件并输出保存路径）：

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Canvas 控制

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

注意：

- `canvas present` 接受 URL 或本地文件路径（`--target`），还可使用可选的 `--x/--y/--width/--height` 进行定位。
- `canvas eval` 接受内联 JS（`--js`）或位置参数。

### A2UI（Canvas）

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "你好"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

注意：

- 移动节点使用应用内置且由应用拥有的 A2UI 页面进行支持操作的渲染。
- 仅支持 A2UI v0.8 JSONL（拒绝 v0.9/createSurface）。
- iOS 和 Android 会渲染远程 Gateway 网关 Canvas 页面，但仅从应用内置且由应用拥有的 A2UI 页面分派 A2UI 按钮操作。在这些移动客户端上，由 Gateway 网关托管的 HTTP/HTTPS A2UI 页面只能渲染。
- macOS 可以从应用选择的、具有确切能力范围的 Gateway 网关 A2UI 页面分派操作。其他 HTTP/HTTPS 页面仍只能渲染。

## 照片和视频（节点摄像头）

照片（`jpg`）：

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # 默认：前后摄像头（2 行 MEDIA）
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
openclaw nodes camera snap --node <idOrNameOrIp> --device-id <id> --max-width 1200 --quality 0.9 --delay-ms 2000
```

视频片段（`mp4`）：

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

注意：

- 执行 `canvas.*` 和 `camera.*` 时，节点必须处于**前台**（后台调用会返回 `NODE_BACKGROUND_UNAVAILABLE`）。
- 节点会限制视频片段时长，使 base64 载荷保持在可控范围内（确切的各平台限制请参阅[摄像头捕获](/zh-CN/nodes/camera)）。在转发调用之前，`nodes` 智能体工具还会将请求的 `durationMs` 上限设为 300000（5 分钟）；节点本身会强制实施更严格的限制。
- Android 会尽可能提示授予 `CAMERA`/`RECORD_AUDIO` 权限；如果权限被拒绝，则会失败并返回 `*_PERMISSION_REQUIRED`。

## 屏幕录制（节点）

受支持的节点会公开 `screen.record`（mp4）。示例：

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

注意：

- `screen.record` 是否可用取决于节点平台。
- `nodes` 智能体工具会将请求的 `durationMs` 上限设为 300000（5 分钟）；节点可能会实施更严格的限制，以约束返回载荷的大小。
- 在受支持的平台上，`--no-audio` 会禁用麦克风捕获。
- 当有多个屏幕可用时，使用 `--screen <index>` 选择显示器（0 = 主显示器）。

## 位置（节点）

在设置中启用位置功能后，节点会公开 `location.get`。

CLI 辅助命令：

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

注意：

- 位置功能**默认关闭**。
- “始终允许”需要系统权限；后台获取采用尽力而为方式。
- 响应包含纬度/经度、精度（米）和时间戳。
- 完整的参数/响应结构和错误代码：[位置命令](/zh-CN/nodes/location-command)。

## SMS（Android 节点）

当用户授予 **SMS** 权限且设备支持电话功能时，Android 节点可以公开 `sms.send` 和 `sms.search`。这两个命令默认都被视为危险命令：在调用它们之前，Gateway 网关操作员还必须将它们添加到 `gateway.nodes.allowCommands`（参阅[命令策略](#command-policy)）。

对于只读 SMS 搜索，请在 `openclaw.json` 中显式选择启用：

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["sms.search"],
    },
  },
}
```

仅当节点还应能够发送消息时，才单独添加 `sms.send`。Android 权限和 Gateway 网关命令授权相互独立；授予手机权限不会修改 Gateway 网关策略。

底层调用：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"来自 OpenClaw 的问候"}'
```

注意：

- 可以在授予 `READ_SMS` 之前声明 `sms.search`，以便调用时能够返回权限诊断信息；读取消息仍需要该 Android 权限。
- 不支持电话功能且仅支持 Wi-Fi 的设备不会公布 `sms.send`。
- `requires explicit gateway.nodes.allowCommands opt-in` 错误表示手机已声明该命令，但 Gateway 网关操作员尚未授权它。

## 设备和个人数据命令

iOS 和 Android 节点默认会公布多个只读数据命令（参阅[命令策略](#command-policy)表）；Android 还会公开由其自身应用内设置控制的更多命令系列。

可用系列：

- `device.status`、`device.info` — iOS、Android、Windows。
- `device.permissions`、`device.health`、`device.apps` — 仅限 Android；`device.apps` 需要在 Android Settings 中启用 Installed Apps 共享，默认返回启动器中可见的应用。
- `notifications.list`、`notifications.actions` — 仅限 Android。
- `photos.latest` — iOS、Android。
- `contacts.search` — iOS、Android（默认为只读）；`contacts.add` 属于危险命令，需要 `gateway.nodes.allowCommands`。
- `calendar.events` — iOS、Android（默认为只读）；`calendar.add` 属于危险命令，需要 `gateway.nodes.allowCommands`。
- `reminders.list` — iOS、Android（默认为只读）；`reminders.add` 属于危险命令，需要 `gateway.nodes.allowCommands`。
- `callLog.search` — 仅限 Android。
- `motion.activity`、`motion.pedometer` — iOS、Android；是否可用取决于设备具有的传感器能力。

调用示例：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

## 系统命令（节点主机/mac 节点）

macOS 节点公开 `system.run`、`system.which`、`system.notify` 和 `system.execApprovals.get/set`。无头节点主机公开 `system.run.prepare`、`system.run`、`system.which` 和 `system.execApprovals.get/set`。

示例：

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "提醒" --body "Gateway 网关已就绪"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"bins":["git"]}'
```

注意：

- `system.run` 在载荷中返回 stdout/stderr/退出代码。
- Shell 执行现在通过设置了 `host=node` 的 `exec` 工具进行；`nodes` 仍是用于显式节点命令的直接 RPC 接口。
- `nodes invoke` 不公开 `system.run` 或 `system.run.prepare`；它们仍仅在 exec 路径上可用。
- exec 路径会在审批前准备规范的 `systemRunPlan`。审批通过后，Gateway 网关转发该已存储计划，而不是调用方后来编辑的任何命令/cwd/会话字段。
- `system.notify` 遵循 macOS 应用中的通知权限状态；支持 `--priority <passive|active|timeSensitive>` 和 `--delivery <system|overlay|auto>`。
- 无法识别的节点 `platform` / `deviceFamily` 元数据会使用保守的默认允许列表，其中不包含 `system.run` 和 `system.which`。如果你确实需要在未知平台上使用这些命令，请通过 `gateway.nodes.allowCommands` 显式添加它们。
- `system.run` 支持 `--cwd`、`--env KEY=VAL`、`--command-timeout` 和 `--needs-screen-recording`。
- 对于 Shell 包装器（`bash|sh|zsh ... -c/-lc`），请求范围内的 `--env` 值会缩减至显式允许列表（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。
- 在允许列表模式下，对“始终允许”的决定，已知的分派包装器（`env`、`flock`、`nice`、`nohup`、`stdbuf`、`timeout`）会持久化内部可执行文件路径，而不是包装器路径。如果无法安全地解包，则不会自动持久化任何允许列表条目。
- 在允许列表模式下的 Windows 节点主机上，通过 `cmd.exe /c` 运行 Shell 包装器需要审批（仅有允许列表条目不会自动允许该包装器形式）。
- 节点主机会忽略 `--env` 中的 `PATH` 覆盖，并在运行命令前移除一组数量较多且持续维护的解释器/Shell 启动变量（例如 `NODE_OPTIONS`、`PYTHONPATH`、`BASH_ENV`、`DYLD_*`、`LD_*`）。如果你需要额外的 PATH 条目，请配置节点主机服务的环境（或将工具安装到标准位置），而不是通过 `--env` 传递 `PATH`。
- 在 macOS 节点模式下，`system.run` 受 macOS 应用中的 Exec 审批控制（Settings → Exec approvals）。“询问”/允许列表/完全访问的行为与无界面节点主机相同；被拒绝的提示会返回 `SYSTEM_RUN_DENIED`。
- 在无界面节点主机上，`system.run` 受 Exec 审批（`~/.openclaw/exec-approvals.json`）控制；特别是在 macOS 上，请参阅下方[无界面节点主机](#headless-node-host-cross-platform)中的 Exec 主机路由环境变量。

## Exec 节点绑定

当有多个节点可用时，你可以将 exec 绑定到特定节点。此设置会为 `exec host=node` 指定默认节点（并且可按智能体覆盖）。

全局默认值：

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

按智能体覆盖：

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

取消设置以允许使用任意节点：

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## 权限映射

节点可在 `node.list` / `node.describe` 中包含 `permissions` 映射，以权限名称（例如 `screenRecording`、`accessibility`、`location`）作为键，并使用布尔值（`true` = 已授予）。

## 无界面节点主机（跨平台）

OpenClaw 可以运行一个连接到 Gateway 网关 WebSocket 并公开 `system.run` / `system.which` 的**无界面节点主机**（无 UI）。这适用于 Linux/Windows，或在服务器旁运行最小化节点。

启动方式：

```bash
openclaw node run --host <gateway-host> --port 18789
```

注意：

- 仍然需要配对（Gateway 网关会显示设备配对提示）。
- 客户端实例元数据、已签名的设备身份和配对身份验证分别使用不同的文件；请参阅[无界面身份状态](#headless-identity-state)。
- Exec 审批通过 `~/.openclaw/exec-approvals.json` 在本地强制执行（请参阅 [Exec 审批](/zh-CN/tools/exec-approvals)）。
- 在 macOS 上，无界面节点主机默认在本地执行 `system.run`。设置 `OPENCLAW_NODE_EXEC_HOST=app` 可通过配套应用的 Exec 主机路由 `system.run`；添加 `OPENCLAW_NODE_EXEC_FALLBACK=0` 可强制要求应用主机，并在其不可用时以拒绝方式失败。
- 当 Gateway 网关 WS 使用 TLS 时，请添加 `--tls` / `--tls-fingerprint`。

## Mac 节点模式

- macOS 菜单栏应用作为节点连接到 Gateway 网关 WS 服务器（因此可以针对这台 Mac 使用 `openclaw nodes …`）。
- 在远程模式下，应用会为 Gateway 网关端口打开 SSH 隧道并连接到 `localhost`。

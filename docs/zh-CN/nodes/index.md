---
read_when:
    - 将 iOS/watchOS/Android 节点配对到 Gateway 网关
    - 使用节点画布/摄像头提供 Agent 上下文
    - 添加新的节点命令或 CLI 辅助工具
summary: 节点：配对、能力、权限，以及用于画布/相机/屏幕/设备/通知/系统的 CLI 辅助工具
title: 节点
x-i18n:
    generated_at: "2026-07-12T14:32:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b59e34e93ec38c69d0cee274d2366eef22c6ff6619a8aea3c2d4a75721865b72
    source_path: nodes/index.md
    workflow: 16
---

**节点**是一种连接到 Gateway 网关的配套设备（macOS/iOS/watchOS/Android/无头设备），使用 `role: "node"`，并通过 `node.invoke` 公开命令接口（例如 `canvas.*`、`camera.*`、`device.*`、`notifications.*`、`system.*`）。大多数节点使用操作员端口上的 Gateway 网关 WebSocket。可选的直连 Apple Watch 节点在同一端口上使用签名 HTTPS 轮询，因为 watchOS 会阻止普通应用使用通用底层网络功能。协议详情：[Gateway 网关协议](/zh-CN/gateway/protocol)。

旧版传输协议：[Bridge protocol](/zh-CN/gateway/bridge-protocol)（TCP JSONL；仅作为当前节点的历史参考）。

macOS 也可以在**节点模式**下运行：菜单栏应用连接到 Gateway 网关的 WS 服务器，并将其本地画布/摄像头命令作为节点公开（因此可以针对这台 Mac 使用 `openclaw nodes …`）。在远程 Gateway 网关模式下，浏览器自动化由 CLI 节点主机（`openclaw node run` 或已安装的节点服务）处理，而不是由原生应用节点处理。

节点是**外围设备**，不是 Gateway 网关：它们不运行 Gateway 网关服务，渠道消息（Telegram、WhatsApp 等）会到达 Gateway 网关，而不是节点。

故障排查运行手册：[/nodes/troubleshooting](/zh-CN/nodes/troubleshooting)

## 配对 + 状态

节点使用**设备配对**。节点在连接期间出示签名的设备身份；Gateway 网关会为 `role: node` 创建设备配对请求。通过设备 CLI（或 UI）批准。直连 Apple Watch 设置使用由管理员签发的短期、仅限节点的设置代码，批准其固定的低风险命令接口；之后扩展能力仍需正常批准。

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

待处理的配对请求会在设备最后一次重试后 5 分钟过期——持续重新连接的设备会让其唯一的待处理请求（及 `requestId`）保持有效，而不是每隔几分钟生成一个新提示；完整的请求/批准生命周期请参阅[节点配对](/zh-CN/gateway/pairing)。如果节点使用已更改的身份验证详情（角色/权限范围/公钥）重试，先前的待处理请求会被取代，并创建新的 `requestId`——客户端会收到针对被取代请求的 `device.pair.resolved` 事件，你应在批准前重新运行 `openclaw devices list`。

- 当节点的设备配对角色包含 `node` 时，`nodes status` 会将该节点标记为**已配对**。
- 已连接且具有辅助功能权限的原生 Mac 可以报告合并后的
  物理输入活动。Gateway 网关会将最新的合格 Mac 标记为
  `active`，为智能体提供稳定的节点 ID 提示，并优先将节点连接
  警报路由到该设备，之后再延迟回退。有关设置、隐私、时序和
  故障排查，请参阅
  [活动计算机存在状态](/nodes/presence)。
- 设备配对记录是持久的已批准角色契约。令牌轮换保持在该契约范围内；它无法将已配对节点升级为配对批准从未授予的角色。
- `node.pair.*`（CLI：`openclaw nodes pending/approve/reject/remove/rename`）是一个独立的、由 Gateway 网关拥有的节点配对存储，用于在重新连接期间跟踪节点已获批准的命令/能力接口。它**不**控制传输身份验证——该操作由设备配对负责。
- `openclaw nodes remove --node <id|name|ip>` 会移除节点配对。对于由设备支持的节点，它会撤销已配对设备存储中该设备的 `node` 角色，并断开该设备的节点角色会话：混合角色设备会保留其记录，仅失去 `node` 角色，而仅限节点的设备记录会被删除。它还会从独立的节点配对存储中清除所有匹配条目。`operator.pairing` 可以移除其他设备上的非操作员节点记录；使用设备令牌的调用方若要撤销其自身在混合角色设备上的节点角色，还需要 `operator.admin`。
- 批准权限范围遵循待处理请求声明的命令：
  - 无命令请求：`operator.pairing`
  - 非 exec 节点命令：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`：`operator.pairing` + `operator.admin`

## 版本偏差和升级顺序

Gateway 网关 WebSocket 在 N-1 协议窗口内接受通过身份验证的节点客户端。
因此，当前 v4 Gateway 网关会接受 v3 节点，前提是连接同时声明
`role: "node"` 和 `client.mode: "node"`。操作员和 UI 会话仍必须
使用当前协议。

对于分阶段的设备群升级，请先升级 Gateway 网关，再升级每个节点。
N-1 节点在升级期间仍然可见且可管理；Gateway 网关会记录
`legacy node protocol accepted`，并附带升级建议。配对、
设备身份验证、命令允许列表和 exec 审批仍然适用。
在节点升级到当前协议之前，插件拥有的能力和命令会保持隐藏。
早于 N-1 的节点需要先通过带外方式升级，然后才能
重新连接。

直连 watchOS HTTPS 传输需要当前协议版本；启用直连模式前，
请同时更新手表应用和 Gateway 网关。

## 远程节点主机（system.run）

当 Gateway 网关运行在一台机器上，而你希望命令在另一台机器上执行时，请使用**节点主机**。模型仍与 **Gateway 网关**通信；选择 `host=node` 时，Gateway 网关会将 `exec` 调用转发到**节点主机**。

| 角色         | 职责                                                             |
| ------------ | ---------------------------------------------------------------- |
| Gateway 网关主机 | 接收消息、运行模型、路由工具调用。                               |
| 节点主机     | 在节点机器上执行 `system.run`/`system.which`。                    |
| 审批         | 通过节点主机上的 `~/.openclaw/exec-approvals.json` 强制执行。     |

审批说明：

- 由审批支持的节点运行会绑定确切的请求上下文。exec 路径会在审批前准备规范的 `systemRunPlan`；批准后，Gateway 网关会转发该已存储计划，而不是任何之后由调用方修改的命令/cwd/会话字段，并在运行前重新验证工作目录。
- 对于直接执行 shell/运行时文件的情况，OpenClaw 还会尽力绑定一个具体的本地文件操作数，并在该文件执行前发生更改时拒绝运行。
- 如果 OpenClaw 无法为解释器/运行时命令准确识别一个具体的本地文件，则会拒绝由审批支持的执行，而不会假装已覆盖整个运行时。对于更广泛的解释器语义，请使用沙箱隔离、独立主机，或明确受信任的允许列表/完整工作流。

### 启动节点主机（前台）

在节点机器上：

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` 还接受 `--context-path`（Gateway 网关 WS 上下文路径）、`--tls`、`--tls-fingerprint <sha256>` 和 `--node-id`（覆盖旧版客户端实例 ID；这不会重置配对）。

### 通过 SSH 隧道连接远程 Gateway 网关（回环绑定）

如果 Gateway 网关绑定到回环地址（`gateway.bind=loopback`，本地模式下的默认值），远程节点主机无法直接连接。请创建 SSH 隧道，并让节点主机指向隧道的本地端。

示例（节点主机 -> Gateway 网关主机）：

```bash
# 终端 A（保持运行）：将本地 18790 转发到 Gateway 网关的 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# 终端 B：导出 Gateway 网关令牌并通过隧道连接
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

说明：

- `openclaw node run` 支持令牌或密码身份验证。
- 首选环境变量：`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 配置回退为 `gateway.auth.token` / `gateway.auth.password`。
- 在本地模式下，节点主机会有意忽略 `gateway.remote.token` / `gateway.remote.password`。
- 在远程模式下，可以根据远程优先级规则使用 `gateway.remote.token` / `gateway.remote.password`。
- 如果配置了有效的本地 `gateway.auth.*` SecretRef 但未能解析，节点主机身份验证会以失败关闭方式终止。
- 节点主机身份验证解析仅接受 `OPENCLAW_GATEWAY_*` 环境变量。

### 启动节点主机（服务）

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` 还接受 `--context-path`、`--tls`、`--tls-fingerprint`、`--node-id`（仅限旧版客户端实例 ID）、`--runtime <node|bun>`（默认值：node）和用于重新安装的 `--force`。还可以使用 `node status`、`node stop` 和 `node uninstall`。

### 配对 + 命名

在 Gateway 网关主机上：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

如果节点使用已更改的身份验证详情重试，请重新运行 `openclaw devices list` 并批准当前的 `requestId`。

命名选项：

- 在 `openclaw node run` / `openclaw node install` 上使用 `--display-name`（会持久保存在节点的 `~/.openclaw/node.json` 中，与客户端实例 ID 和 Gateway 网关连接元数据存放在一起）。
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`（Gateway 网关覆盖）。

### 节点托管的 MCP 服务器

请在节点机器上的 `openclaw.json` 中配置 MCP 服务器，而不是在
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
描述符。工具调用会通过 `mcp.tools.call.v1` 返回该节点；
Gateway 网关不需要匹配的 MCP 配置或 JS 插件。此节点托管的 v1
路径不支持 OAuth MCP 服务器。

当前节点主机在首次配对期间会声明内置的 `mcp.tools.call.v1` 命令族，
即使未配置任何 MCP 服务器也是如此。在较旧 OpenClaw 版本上配对的节点，
可能会在节点主机更新后请求一次性命令接口升级。之后添加、移除或筛选
服务器不需要重新配对，因为已批准的命令族保持不变。请重启
`openclaw node run` 或 `openclaw node restart` 以应用节点 MCP 配置更改；
节点主机不会监视此配置。

Gateway 网关操作员可以使用
`gateway.nodes.pluginTools.enabled: false` 忽略已配对节点发布的所有
智能体可见工具，包括节点托管的 MCP 工具。精确的命令拒绝规则（例如
`gateway.nodes.denyCommands: ["mcp.tools.call.v1"]`）也会阻止执行。

### 节点托管的 Skills

请将 Skills 安装在节点机器当前使用的 OpenClaw Skills 目录下，
默认目录为 `~/.openclaw/skills`。`OPENCLAW_HOME`、`OPENCLAW_STATE_DIR` 和
`OPENCLAW_CONFIG_PATH` 会移动当前使用的配置文件。对于 Skills，
`OPENCLAW_STATE_DIR` 具有优先权；否则，`skills/` 位于
`openclaw config file` 所输出路径的旁边。无头节点主机在连接后会发布
有效的 `SKILL.md` 文件，并且仅当该节点保持连接时，Gateway 网关才会将它们
添加到智能体 Skills 快照中。每个 Skills 目录名称都必须与 `name`
frontmatter 字段匹配，以便抽象节点定位器映射到唯一条目，而无需添加
另一个协议字段。

首次节点角色配对会批准 Skills 发布。添加、移除或更改 Skills 不需要再次
配对或更改 Gateway 网关配置。更改节点 Skills 文件后，请重启
`openclaw node run` 或 `openclaw node restart`；节点主机不会监视 Skills 目录。

节点托管的技能条目会标识其节点并携带执行位置。技能文件、引用的相对路径和二进制文件都保留在该节点上。智能体使用常规 `read` 工具读取公布的 `node://.../SKILL.md` 位置。`file_fetch` 接受操作员批准的节点绝对路径，而不接受节点技能定位符；没有常规读取工具的运行时可以改为通过 `exec host=node node=<node-id>` 运行 `cat SKILL.md`，并将公布的 `node://.../skills/<name>` 目录用作 `workdir`。引用的文件和二进制文件使用相同的 Exec 目标和工作目录。节点主机会根据其当前 OpenClaw 状态目录解析该定位符，因此相对路径在节点上解析，而不是在 Gateway 网关计算机上解析。发布节点必须已获准使用 `system.run`，且智能体的 Exec 策略必须允许 `host=node`；否则，该技能不会进入该智能体的快照。

在节点上设置 `nodeHost.skills.enabled: false` 可停止发布。Gateway 网关操作员可以通过
`gateway.nodes.skills.enabled: false` 忽略所有已配对节点的技能。

### 无头身份状态

无头节点保留三个独立的状态文件：

- `~/.openclaw/node.json`：旧版客户端实例 ID（存储为 `nodeId`）、显示名称和 Gateway 网关连接元数据。
- `~/.openclaw/identity/device.json`：签名设备密钥对及派生的加密设备 ID。
- `~/.openclaw/identity/device-auth.json`：按加密设备 ID 和角色索引的已配对设备身份验证令牌。

对于已签名的节点，Gateway 网关使用加密设备 ID 进行配对和节点路由。客户端实例 ID 仅作为连接元数据。因此，更改 `--node-id` 或仅删除 `node.json` 不会重置配对。有关受支持的撤销并重新配对流程及升级说明，请参阅[身份和配对状态](/zh-CN/cli/node#identity-and-pairing-state)。

### 将命令加入允许列表

Exec 审批按**每个节点主机**分别管理。从 Gateway 网关添加允许列表条目：

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

或按会话配置：

```text
/exec host=node security=allowlist node=<id-or-name>
```

设置后，任何带有 `host=node` 的 `exec` 调用都会在节点主机上运行（受节点允许列表/审批约束）。

`host=auto` 本身不会隐式选择节点，但 `auto` 允许单次调用显式请求 `host=node`。如果希望节点 Exec 成为会话默认值，请显式设置 `tools.exec.host=node` 或 `/exec host=node ...`。

相关内容：

- [节点主机 CLI](/zh-CN/cli/node)
- [Exec 工具](/zh-CN/tools/exec)
- [Exec 审批](/zh-CN/tools/exec-approvals)

### 本地模型推理

桌面或服务器节点可以公开该节点上运行的 Ollama 服务器中的聊天模型。智能体使用 Ollama 插件的 `node_inference` 工具发现已安装的模型，并在远程运行有边界限制的提示词；Gateway 网关不需要直接通过网络访问 Ollama。有关设置、模型筛选和直接验证命令，请参阅 [Ollama 节点本地推理](/zh-CN/providers/ollama#node-local-inference)。

### Codex 会话和转录记录

官方 `codex` 插件可以公开无头节点主机或原生 macOS 节点上未归档的 Codex 会话。目录注册不再依赖 `supervision.enabled`；该选项用于控制面向智能体的监督工具。两台计算机上仍必须启用该插件，并且节点设置仍代表本地同意：仅在 Gateway 网关上启用并不能读取另一台计算机的 Codex 状态。

节点会公布带版本号的只读命令
`codex.appServer.threads.list.v1` 和
`codex.appServer.thread.turns.list.v1`。这些命令首次出现时，请批准节点配对升级。Gateway 网关通过常规插件节点策略调用这些命令，并按主机隔离故障。

已配对节点的行会作为 **Codex** 分组显示在常规会话侧边栏中。选择一行会打开常规聊天窗格，并通过有边界限制、基于游标分页且包含完整项目投影的
`thread/turns/list` 调用读取其持久化转录记录。节点调用传输仅支持请求/响应，无法承载通过 Codex harness 继续原生线程所需的流式轮次、实时事件或审批。因此，远程行无法使用**继续**和**归档**。在 Gateway 网关计算机上，已存储和空闲的行可以启动一个独立且锁定模型的聊天分支。仅当操作员确认没有其他 Codex 客户端正在使用时，二者才可归档；已存储行的实时活动情况仍然未知。活跃行无法创建分支或归档。

有关设置、分页、本地继续和元数据安全边界，请参阅[监督 Codex 会话](/plugins/codex-supervision)。

### Claude 会话和转录记录

内置 `anthropic` 插件会发现 Gateway 网关和已配对节点上未归档的 Claude CLI 与 Claude Desktop 会话。与 Codex 监督不同，此功能不需要单独选择启用：启用 Anthropic 插件且 `~/.claude/projects/` 存在时，远程 macOS 应用节点会公布
`anthropic.claude.sessions.list.v1` 和 `anthropic.claude.sessions.read.v1`。
这些命令首次出现时，请批准节点配对升级。

目录会将有效的 Claude CLI 项目索引记录与当前 `sdk-cli` JSONL 文件中有边界限制的元数据前缀合并。Claude Desktop 的本地元数据提供 Desktop 标题和归档状态。当两个来源引用同一个 Claude Code 会话 ID 时，以 Desktop 元数据为准；仅 CLI 的转录记录仍然可见，因为 CLI 没有归档标志。转录记录读取使用不透明的字节偏移游标和有边界限制的文件反向读取，因此选择大型会话或加载较早页面时，不会将整个 JSONL 历史记录读入单个 Gateway 网关响应。

两个节点命令均为只读。它们仅通过通用的 `sessions.catalog.list` 和
`sessions.catalog.read` 方法，将目录元数据和转录记录内容公开给具有
`operator.write` 权限的已验证操作员连接。已配对节点的行保持仅查看状态。Gateway 网关本地的 Claude CLI 行可以从常规聊天编辑器中接管：OpenClaw 会导入有边界限制的可见历史记录，在第一个轮次中使用 `--fork-session` 恢复，并保持源转录记录不变。Claude Desktop 行保持仅查看状态。

有关 Control UI 行为和存储来源，请参阅 [Anthropic：跨计算机使用 Claude 会话](/zh-CN/providers/anthropic#claude-sessions-across-computers)。

## 调用命令

低级调用（原始 RPC）：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` 会阻止 `system.run` 和 `system.run.prepare`；这些命令只能通过带有 `host=node` 的 `exec` 工具运行（见上文）。对于常见的“向智能体提供 MEDIA 附件”工作流（画布、摄像头、屏幕、位置，见下文），可使用更高级的辅助工具。

## 命令策略

节点命令必须通过两道关卡才能调用：

1. 节点必须在其经过身份验证的连接元数据（`connect.commands`）中声明该命令。
2. Gateway 网关根据平台和审批生成的允许列表必须包含已声明的命令。

各平台的默认允许列表（应用插件默认值以及 `allowCommands`/`denyCommands` 覆盖之前）：

| 平台 | 默认允许的命令                                                                                                                                                                                                                                                                                                        |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`、`location.get`、`device.info`、`device.status`、`contacts.search`、`calendar.events`、`reminders.list`、`photos.latest`、`motion.activity`、`motion.pedometer`、`system.notify`                                                                                                                        |
| watchOS  | `device.info`、`device.status`、`system.notify`                                                                                                                                                                                                                                                                       |
| Android  | `camera.list`、`location.get`、`notifications.list`、`notifications.actions`、`system.notify`、`device.info`、`device.status`、`device.permissions`、`device.health`、`device.apps`、`contacts.search`、`calendar.events`、`callLog.search`、`reminders.list`、`photos.latest`、`motion.activity`、`motion.pedometer` |
| macOS    | `camera.list`、`location.get`、`device.info`、`device.status`、`contacts.search`、`calendar.events`、`reminders.list`、`photos.latest`、`motion.activity`、`motion.pedometer`、`system.notify`                                                                                                                        |
| Windows  | `camera.list`、`location.get`、`device.info`、`device.status`、`system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify`（`system.run` 等节点主机命令受审批控制，见下文）                                                                                                                                                                                                                                                      |

这些行描述的是 Gateway 网关策略上限，而不是每个节点应用都实现的命令。仅当已连接节点也声明某命令时，该命令才可用。具体而言，当前 macOS 应用并未声明 macOS 策略行中列出的设备和个人数据命令族。

`canvas.*` 命令（`canvas.present`、`canvas.hide`、`canvas.navigate`、`canvas.eval`、`canvas.snapshot`、`canvas.a2ui.*`）是 iOS、Android、macOS、Windows 和未知平台（不包括 Linux）上的插件默认命令；在 iOS 上，所有这些命令都仅限前台使用。

对于任何公布 `talk` 能力或声明 `talk.*` 命令的节点，默认允许 `talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once`，不受平台标签影响。

桌面主机命令（`system.run`、`system.run.prepare`、`system.which`、`browser.proxy`、`mcp.tools.call.v1`，以及 macOS/Windows 上的 `screen.snapshot`）不属于上述静态平台默认表。操作员批准声明这些命令的配对请求后，这些命令即可使用；此后重新连接时，节点已获批准的命令集会继续携带它们。

危险或高度涉及隐私的命令即使已由节点声明，仍需通过 `gateway.nodes.allowCommands` 显式选择启用：`camera.snap`、`camera.clip`、`screen.record`、`computer.act`、`contacts.add`、`calendar.add`、`reminders.add`、`sms.send`、`sms.search`。`gateway.nodes.denyCommands` 的优先级始终高于默认值和额外允许列表条目。有关桌面输入所需的其他 macOS、工具策略和启用关卡，请参阅[计算机使用](/nodes/computer-use)。

插件拥有的节点命令可以添加 Gateway 网关节点调用策略。该策略在允许列表检查之后、转发到节点之前运行，因此原始 `node.invoke`、CLI 辅助命令和专用智能体工具共享同一个插件权限边界。危险的插件节点命令仍需通过 `gateway.nodes.allowCommands` 显式选择启用。

节点更改其声明的命令列表后，请拒绝旧的设备配对并批准新请求，以便 Gateway 网关存储更新后的命令快照。

## 配置（`openclaw.json`）

节点相关设置位于 `gateway.nodes` 和 `tools.exec` 下：

```json5
{
  gateway: {
    nodes: {
      // 自动批准来自可信网络（CIDR 列表）的首次节点配对。
      // 未设置时禁用。仅适用于首次 role:node 请求
      // 且未请求任何权限范围的情况；不会自动批准升级。
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
        // 经 SSH 验证的自动批准（默认：启用）。通过 SSH 回读的
        // 设备密钥完全匹配时，批准首次节点配对。
        sshVerify: true,
      },
      // 信任已配对节点发布的智能体可见插件工具（默认：true）。
      pluginTools: {
        enabled: true,
      },
      // 选择启用危险或高度涉及隐私的节点命令（camera.snap 等）。
      allowCommands: ["camera.snap", "screen.record"],
      // 即使默认值或 allowCommands 包含某个命令，也按确切命令名称阻止它。
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // 默认 exec 主机："node" 会将所有 exec 调用路由到已配对节点。
      host: "node",
      // 节点 exec 的安全模式：仅允许已批准或列入允许列表的命令。
      security: "allowlist",
      // 将 exec 固定到特定节点（ID 或名称）。省略则允许使用任意节点。
      node: "build-node",
    },
  },
}
```

请使用确切的节点命令名称。即使平台默认值或 `allowCommands` 条目原本会允许某个命令，`denyCommands` 也会将其移除。默认情况下，已配对节点可以发布智能体可见的插件工具描述符，但每个描述符的命令仍必须位于节点已批准的命令范围内。设置 `gateway.nodes.pluginTools.enabled: false` 可忽略所有此类描述符。有关 Gateway 网关节点配对和命令策略字段的详细信息，请参阅 [Gateway 配置参考](/zh-CN/gateway/configuration-reference#gateway)。

按智能体覆盖 exec 节点：

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

如果节点正在显示 Canvas（WebView），`canvas.snapshot` 会返回 `{ format, base64 }`。

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
- iOS 和 Android 会渲染远程 Gateway 网关 Canvas 页面，但 A2UI 按钮操作仅从应用内置且由应用拥有的 A2UI 页面分派。在这些移动客户端上，由 Gateway 网关托管的 HTTP/HTTPS A2UI 页面仅支持渲染。
- macOS 可以从应用选择的、具有确切能力权限范围的 Gateway 网关 A2UI 页面分派操作。其他 HTTP/HTTPS 页面仍仅支持渲染。

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

- 节点必须处于**前台**才能使用 `canvas.*` 和 `camera.*`（后台调用会返回 `NODE_BACKGROUND_UNAVAILABLE`）。
- 节点会限制视频片段时长，以使 base64 载荷保持在可管理范围内（各平台的确切限制请参阅[摄像头采集](/zh-CN/nodes/camera)）。`nodes` 智能体工具还会在转发调用前将请求的 `durationMs` 上限设为 300000（5 分钟）；节点本身会强制执行更严格的限制。
- Android 会在可能的情况下提示授予 `CAMERA`/`RECORD_AUDIO` 权限；权限被拒绝时会失败并返回 `*_PERMISSION_REQUIRED`。

## 屏幕录制（节点）

受支持的节点会公开 `screen.record`（mp4）。示例：

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

注意：

- `screen.record` 是否可用取决于节点平台。
- `nodes` 智能体工具会将请求的 `durationMs` 上限设为 300000（5 分钟）；节点可能会强制执行更严格的限制，以约束返回的载荷大小。
- `--no-audio` 会在受支持的平台上禁用麦克风采集。
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
- “始终允许”需要系统权限；后台获取仅尽力而为。
- 响应包括纬度/经度、精度（米）和时间戳。
- 完整的参数/响应结构和错误代码：[位置命令](/zh-CN/nodes/location-command)。

## SMS（Android 节点）

当用户授予 **SMS** 权限且设备支持电话功能时，Android 节点可以公开 `sms.send` 和 `sms.search`。这两个命令默认都被视为危险命令：在调用它们之前，Gateway 网关操作员还必须将它们添加到 `gateway.nodes.allowCommands`（请参阅[命令策略](#command-policy)）。

如需启用只读 SMS 搜索，请在 `openclaw.json` 中显式选择启用：

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["sms.search"],
    },
  },
}
```

仅当节点还应能够发送消息时，才单独添加 `sms.send`。Android 权限与 Gateway 网关命令授权相互独立；授予手机权限不会修改 Gateway 网关策略。

底层调用：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"来自 OpenClaw 的问候"}'
```

注意：

- `sms.search` 可以在授予 `READ_SMS` 之前声明，以便调用时返回权限诊断信息；读取消息仍需要该 Android 权限。
- 不支持电话功能且仅支持 Wi-Fi 的设备不会公布 `sms.send`。
- `requires explicit gateway.nodes.allowCommands opt-in` 错误表示手机已声明该命令，但 Gateway 网关操作员尚未授权。

## 设备和个人数据命令

iOS 和 Android 节点默认会公布多个只读数据命令（请参阅[命令策略](#command-policy)表）；Android 还会公开一个更大的命令系列，由其自身的应用内设置控制。

可用系列：

- `device.status`、`device.info` — iOS、Android、Windows。
- `device.permissions`、`device.health`、`device.apps` — 仅 Android；`device.apps` 要求在 Android Settings 中启用 Installed Apps 共享，默认返回启动器中可见的应用。
- `notifications.list`、`notifications.actions` — 仅 Android。
- `photos.latest` — iOS、Android。
- `contacts.search` — iOS、Android（默认只读）；`contacts.add` 属于危险命令，需要 `gateway.nodes.allowCommands`。
- `calendar.events` — iOS、Android（默认只读）；`calendar.add` 属于危险命令，需要 `gateway.nodes.allowCommands`。
- `reminders.list` — iOS、Android（默认只读）；`reminders.add` 属于危险命令，需要 `gateway.nodes.allowCommands`。
- `callLog.search` — 仅 Android。
- `motion.activity`、`motion.pedometer` — iOS、Android；是否可用取决于可用传感器能力。

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
openclaw nodes notify --node <idOrNameOrIp> --title "提示" --body "Gateway 网关已就绪"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"bins":["git"]}'
```

注意：

- `system.run` 在载荷中返回 stdout/stderr/退出代码。
- Shell 执行现在通过 `host=node` 的 `exec` 工具进行；`nodes` 仍是用于显式节点命令的直接 RPC 接口。
- `nodes invoke` 不公开 `system.run` 或 `system.run.prepare`；它们仅保留在 exec 路径上。
- exec 路径会在审批前准备规范的 `systemRunPlan`。审批获准后，Gateway 网关转发的是这个已存储的计划，而不是调用方后来编辑的命令/cwd/会话字段。
- `system.notify` 遵循 macOS 应用中的通知权限状态；支持 `--priority <passive|active|timeSensitive>` 和 `--delivery <system|overlay|auto>`。
- 无法识别的节点 `platform` / `deviceFamily` 元数据会使用保守的默认允许列表，其中不包含 `system.run` 和 `system.which`。如果你确实需要在未知平台上使用这些命令，请通过 `gateway.nodes.allowCommands` 显式添加。
- `system.run` 支持 `--cwd`、`--env KEY=VAL`、`--command-timeout` 和 `--needs-screen-recording`。
- 对于 shell 包装器（`bash|sh|zsh ... -c/-lc`），请求范围内的 `--env` 值会缩减为显式允许列表（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。
- 在允许列表模式下作出始终允许决定时，已知的分派包装器（`env`、`flock`、`nice`、`nohup`、`stdbuf`、`timeout`）会持久化内部可执行文件路径，而不是包装器路径。如果无法安全地解包，则不会自动持久化任何允许列表条目。
- 在允许列表模式下的 Windows 节点主机上，通过 `cmd.exe /c` 运行 shell 包装器需要审批（仅有允许列表条目不会自动允许这种包装器形式）。
- 节点主机会忽略 `--env` 中的 `PATH` 覆盖，并在运行命令前移除一组大量且持续维护的解释器/shell 启动变量（例如 `NODE_OPTIONS`、`PYTHONPATH`、`BASH_ENV`、`DYLD_*`、`LD_*`）。如果需要额外的 PATH 条目，请配置节点主机服务的环境（或将工具安装到标准位置），而不要通过 `--env` 传递 `PATH`。
- 在 macOS 节点模式下，`system.run` 受 macOS 应用中的 Exec 审批控制（Settings → Exec approvals）。询问/允许列表/完全模式的行为与无头节点主机相同；被拒绝的提示返回 `SYSTEM_RUN_DENIED`。
- 在无头节点主机上，`system.run` 受 Exec 审批控制（`~/.openclaw/exec-approvals.json`）；特别是在 macOS 上，请参阅下方[无头节点主机](#headless-node-host-cross-platform)中的 exec 主机路由环境变量。

## Exec 节点绑定

当有多个节点可用时，你可以将 exec 绑定到特定节点。这会设置 `exec host=node` 的默认节点（并可按智能体覆盖）。

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

节点可在 `node.list` / `node.describe` 中包含 `permissions` 映射，以权限名称（例如 `screenRecording`、`accessibility`、`location`）为键，并使用布尔值（`true` = 已授予）。

## 无头节点主机（跨平台）

OpenClaw 可以运行一个**无头节点主机**（无 UI），它连接到 Gateway 网关 WebSocket 并公开 `system.run` / `system.which`。这适用于 Linux/Windows，或在服务器旁运行最小化节点。

启动方式：

```bash
openclaw node run --host <gateway-host> --port 18789
```

注意：

- 仍需配对（Gateway 网关会显示设备配对提示）。
- 客户端实例元数据、已签名设备身份和配对身份验证使用不同的文件；请参阅[无头身份状态](#headless-identity-state)。
- Exec 审批通过 `~/.openclaw/exec-approvals.json` 在本地强制执行（请参阅 [Exec 审批](/zh-CN/tools/exec-approvals)）。
- 在 macOS 上，无头节点主机默认在本地执行 `system.run`。设置 `OPENCLAW_NODE_EXEC_HOST=app` 可通过配套应用的 exec 主机路由 `system.run`；再添加 `OPENCLAW_NODE_EXEC_FALLBACK=0` 可强制要求使用应用主机，并在其不可用时以失败关闭方式处理。
- 当 Gateway 网关 WS 使用 TLS 时，请添加 `--tls` / `--tls-fingerprint`。

## Mac 节点模式

- macOS 菜单栏应用作为节点连接到 Gateway 网关 WS 服务器（因此可对这台 Mac 使用 `openclaw nodes …`）。
- 在远程模式下，应用会为 Gateway 网关端口打开 SSH 隧道，并连接到 `localhost`。

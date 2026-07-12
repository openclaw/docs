---
read_when:
    - 实现或更新 Gateway 网关 WebSocket 客户端
    - 调试协议不匹配或连接失败
    - 重新生成协议架构/模型
summary: Gateway WebSocket 协议：握手、帧与版本控制
title: Gateway 网关协议
x-i18n:
    generated_at: "2026-07-12T14:29:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d71b75d49bf8a1ea2d835b1d8e532b1d01e87e8b64d6ab7dcb00f28791d3b8ac
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway 网关 WS 协议是 OpenClaw 唯一的控制平面和节点传输协议。操作员和节点客户端（CLI、Web UI、macOS 应用、iOS/Android 节点、无头节点）通过 WebSocket 连接，并在握手时声明**角色**和**权限范围**。

## 传输和帧格式

- WebSocket、文本帧、JSON 载荷。
- 第一帧**必须**是 `connect` 请求。
- 连接前帧的上限为 64 KiB（`MAX_PREAUTH_PAYLOAD_BYTES`）。握手后，遵循 `hello-ok.policy.maxPayload` 和 `hello-ok.policy.maxBufferedBytes`。启用诊断后，对于过大的入站帧和缓慢的出站缓冲区，Gateway 网关会在关闭连接或丢弃帧之前发出 `payload.large` 事件。这些事件包含 `surface`、字节大小、限制和安全的原因代码，绝不包含消息正文、附件内容、原始帧字节、令牌、Cookie 或密钥。

帧结构：

- 请求：`{type:"req", id, method, params}`
- 响应：`{type:"res", id, ok, payload|error}`
- 事件：`{type:"event", event, payload, seq?, stateVersion?}`

会产生副作用的方法需要幂等键（参见 schema）。

## 握手

Gateway 网关发送连接前质询：

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

客户端使用 `connect` 回复：

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 4,
    "maxProtocol": 4,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway 网关使用 `hello-ok` 响应：

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 4,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "auth": {
      "role": "operator",
      "scopes": ["operator.read", "operator.write"]
    },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`HelloOkSchema`（`packages/gateway-protocol/src/schema/frames.ts`）要求必须包含 `server`、`features`、`snapshot`、`policy` 和 `auth`。即使未签发设备令牌，`auth` 也会报告协商后的角色/权限范围（结构如上）。`pluginSurfaceUrls` 是可选项，它将插件界面名称（例如 `canvas`）映射到限定范围的托管 URL；该 URL 可能过期，因此节点会使用 `{ "surface": "canvas" }` 调用 `node.pluginSurface.refresh` 以获取新条目。已弃用的 `canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh` 路径不受支持；请使用插件界面。

当 Gateway 网关仍在完成启动辅助服务时，`connect` 可能返回可重试的 `UNAVAILABLE` 错误，其中包含 `details.reason: "startup-sidecars"` 和 `retryAfterMs`。请在连接时间预算内重试，而不要将其视为终止性的握手失败。

签发设备令牌时，`hello-ok.auth` 会添加该令牌：

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

内置二维码/设置代码引导是一条移动端移交流程。成功的基准设置代码连接会返回一个主节点令牌和一个受限的操作员令牌：

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": [],
    "deviceTokens": [
      {
        "deviceToken": "…",
        "role": "operator",
        "scopes": ["operator.approvals", "operator.read", "operator.talk.secrets", "operator.write"]
      }
    ]
  }
}
```

此操作员移交被有意限制：其权限足以启动移动端操作员循环和原生设置，包括用于读取 Talk 配置的 `operator.talk.secrets`，但不包括配对变更权限范围，也不包括 `operator.admin`。更广泛的配对/管理员访问权限需要单独经过批准的配对或令牌流程。仅当引导身份验证通过可信传输（`wss://` 或回环/本地配对）运行时，才持久化 `hello-ok.auth.deviceTokens`。

可信的同进程后端客户端（`client.id: "gateway-client"`、`client.mode: "backend"`）在使用共享 Gateway 网关令牌/密码进行身份验证时，可在直接回环连接中省略 `device`。此路径专用于内部控制平面 RPC（例如子智能体会话更新），可避免过时的 CLI/设备配对基准阻碍本地后端工作。远程、浏览器来源、节点以及显式使用设备令牌/设备身份的客户端仍需经过常规配对和权限范围升级检查。

### 工作节点角色和封闭协议

云端工作节点通过 Gateway 网关所有、固定主机密钥的 SSH 隧道使用专用回环入口。它仅接受工作节点身份，绝不会分派通用身份验证、节点事件、操作员 RPC 或插件方法。严格的 `connect` 会验证静态哈希存储的短期凭据，该凭据绑定到环境、bundle 哈希、所有者 epoch、RPC 集版本、过期时间以及一个可为空的会话；它还会单独检查当前版本和功能集。成功时返回最小化的 `worker-hello-ok`；功能协商独立于通用协议版本。帧保持在 64 KiB 以下。封闭允许列表包含 `worker.heartbeat`、`worker.transcript.commit` 和 `worker.live-event`。记录提交使用所有者 epoch 防护、Gateway 网关所有的会话绑定、基准叶节点比较并交换，以及持久序列重放；Gateway 网关通过常规会话写入器生成记录条目 ID 和父级 ID。每次 RPC 都会重新检查所有权和过期时间。

### 客户端能力

操作员客户端可以在 `connect.params.caps` 中声明可选能力：

- `tool-events`：接受结构化的工具生命周期事件。
- `inline-widgets`：可以呈现托管的内联微件工具结果。

客户端能力描述的是已连接的客户端，而非授权。智能体工具可以声明所需能力；除非所有要求都出现在发起请求的客户端的 `caps` 中，否则 Gateway 网关会省略这些工具。源自渠道的运行没有 Gateway 网关客户端能力，因此即使工具策略明确允许，受能力限制的工具也不可用。

### 节点连接示例

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 4,
    "maxProtocol": 4,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

节点在连接时声明能力：

- `caps`：高级类别，例如 `camera`、`canvas`、`screen`、
  `location`、`voice`、`talk`。
- `commands`：用于调用的命令允许列表。
- `permissions`：细粒度开关（例如 `screen.record`、`camera.capture`）。

Gateway 网关将这些视为声明，并实施服务器端允许列表。

## 角色和权限范围

有关完整的操作员权限范围模型、批准时检查和共享密钥语义，请参阅[操作员权限范围](/zh-CN/gateway/operator-scopes)。

角色：

- `operator`：控制平面客户端（CLI/UI/自动化）。
- `node`：能力宿主（摄像头/屏幕/画布/system.run）。
- `worker`：在专用封闭工作节点协议上运行的云端执行宿主。

操作员权限范围（`src/gateway/operator-scopes.ts`），完整的封闭集合：

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

将 `talk.config` 与 `includeSecrets: true` 一起使用时，需要 `operator.talk.secrets`（或
`operator.admin`）。包含密钥时，请从 `talk.resolved.config.apiKey` 读取当前 Talk 提供商的凭据；`talk.providers.<id>.apiKey`
会保持源数据形态，并且可能是 SecretRef 对象或经过脱敏的字符串。

插件注册的 Gateway 网关 RPC 方法可以请求自己的操作员权限范围，
但以下保留的核心前缀始终解析为 `operator.admin`
（`src/shared/gateway-method-policy.ts`）：`config.*`、`exec.approvals.*`、
`wizard.*`、`update.*`。

方法权限范围只是第一道门槛。通过
`chat.send` 到达的一些斜杠命令会执行更严格的命令级检查：即使 Gateway 网关客户端
已具有较低级别的操作员权限范围，持久化的 `/config set` 和
`/config unset` 写入仍需要 `operator.admin`。

除基础方法权限范围（`operator.pairing`）外，`node.pair.approve` 还会根据待处理请求声明的
`commands`（`src/infra/node-pairing-authz.ts`）额外执行批准时权限范围检查：

| 声明的命令                                                     | 所需权限范围                          |
| -------------------------------------------------------------- | ------------------------------------- |
| 无                                                             | `operator.pairing`                    |
| 非执行命令                                                     | `operator.pairing` + `operator.write` |
| 包含 `system.run`、`system.run.prepare` 或 `system.which`      | `operator.pairing` + `operator.admin` |

### Caps/命令/权限（节点）

节点在连接时声明能力：

- `caps`：高级能力类别，例如 `camera`、`canvas`、`screen`、
  `location`、`voice` 和 `talk`。
- `commands`：用于调用的命令允许列表。
- `permissions`：细粒度开关（例如 `screen.record`、`camera.capture`）。

Gateway 网关将这些视为**声明**，并实施服务器端允许列表。
成功连接或重新连接后，已连接的节点可以通过 `node.pluginTools.update`
发布可选的、对智能体可见的插件或 MCP 工具描述符。
无头节点宿主会通过重启来应用声明式 MCP 清单变更。
此更新方法是唯一的发布路径；`connect` 参数不接受插件工具描述符。
每个描述符必须使用提供商安全的工具 `name`，并指定节点当前命令允许列表中的
`command`。Gateway 网关信任已配对节点提供的描述符元数据，过滤掉批准命令范围之外的描述符，
在节点断开连接时将其移除，并拒绝操作员修改其他节点目录的尝试。将
`gateway.nodes.pluginTools.enabled: false` 设置为忽略节点发布的描述符。

已连接的节点宿主通过 `node.skills.update` 发布其完整的技能替换目录。
此节点角色方法是唯一的节点技能发布路径；`connect` 参数不接受技能。
每个描述符都包含安全的名称、描述和有界的 `SKILL.md` 内容。Gateway 网关使用常规 Skills 加载器解析该内容，
在节点连接期间将其包含在智能体技能快照中，并在断开连接时将其移除。将
`gateway.nodes.skills.enabled: false` 设置为忽略节点发布的 Skills。

## 在线状态

- `system-presence` 返回按设备身份作为键的条目，其中包括
  `deviceId`、`roles` 和 `scopes`，因此即使设备同时以操作员和节点身份连接，
  UI 也可以为每台设备显示一行。
- `node.list` 包含可选的 `lastSeenAtMs` 和 `lastSeenReason`。已连接的节点
  报告当前连接时间，并将原因设为 `connect`；已配对节点还可以通过受信任的节点事件
  报告持久的后台在线状态。

原生 macOS 节点也可以发送经过身份验证的 `node.presence.activity` 事件，
其中包含有界的输入空闲时间。Gateway 网关使用自己的时钟推导活动时间戳，
通过 `node.list` 和 `node.describe` 公开最近活跃的已连接 Mac，
并向具有读取权限范围的客户端广播 `node.presence` 更新。
有关选择、隐私、模型上下文和通知路由行为，请参阅[活动计算机在线状态](/nodes/presence)。

### 节点后台存活事件

节点调用 `node.event` 并传入 `event: "node.presence.alive"`，以记录
已配对节点在后台唤醒期间处于存活状态，但不会将其标记为已连接：

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` 是一个封闭枚举：`background`、`silent_push`、`bg_app_refresh`、
`significant_location`、`manual`、`connect`。未知值会规范化为
`background`（`src/shared/node-presence.ts`）。该事件仅针对
经过身份验证的节点设备会话持久化；没有设备或未配对的会话会返回
`handled: false`。

成功处理的 Gateway 网关会返回结构化结果：

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

较旧的 Gateway 网关可能只为 `node.event` 返回 `{ "ok": true }`；应将其
视为 RPC 已确认，而不是在线状态已持久化。

## 广播事件权限范围

服务器推送的广播事件受权限范围控制，因此仅具有配对权限范围或仅限节点的
会话不会被动接收会话内容
（`src/gateway/server-broadcast.ts`）：

- 聊天、智能体和工具结果帧（流式 `agent` 事件、工具结果
  事件）至少需要 `operator.read`。没有该权限的会话会完全跳过这些
  帧。
- 插件定义的 `plugin.*` 广播默认仅限 `operator.write` 或
  `operator.admin`；`plugin.approval.requested` /
  `plugin.approval.resolved` 等显式条目改用
  `operator.approvals`。
- 状态/传输事件（`heartbeat`、`presence`、`tick`、连接/断开连接
  生命周期）保持不受限制，使每个经过身份验证的会话都能观察
  传输运行状况。
- 未知的广播事件族默认受权限范围控制（故障时关闭），
  除非已注册的处理程序显式放宽限制。

每个客户端连接维护自己的单客户端序列号，因此即使不同客户端看到
事件流中经过不同权限范围筛选的子集，广播在相应套接字上仍保持
单调有序。

## RPC 方法族

`hello-ok.features.methods` 是一个保守的发现列表，由
`src/gateway/server-methods-list.ts` 加上已加载插件/渠道导出的
方法构建而成——它并不是每个方法的自动生成转储，而且某些方法（例如
`push.test`、`web.login.start`、`web.login.wait`、`sessions.usage`）
尽管是真实且可调用的方法，仍会被有意排除在发现列表之外。
应将其视为功能发现，而不是对
`src/gateway/server-methods/*.ts` 的完整枚举。

<AccordionGroup>
  <Accordion title="系统和身份">
    - `health` 返回缓存的或新探测的 Gateway 网关健康状况快照。
    - `diagnostics.stability` 返回近期的有界诊断稳定性记录：事件名称、计数、字节大小、内存读数、队列/会话状态、渠道/插件名称、会话 ID。不包含聊天文本、webhook 正文、工具输出、原始请求/响应正文、令牌、Cookie 或密钥。需要 `operator.read`。
    - `status` 返回 `/status` 风格的 Gateway 网关摘要；敏感字段仅向具有管理员权限范围的操作员客户端提供。
    - `gateway.identity.get` 返回中继和配对流程使用的 Gateway 网关设备身份。
    - `system-presence` 返回已连接操作员/节点设备的当前在线状态快照。
    - `system-event` 追加系统事件，并可更新/广播在线状态上下文。
    - `last-heartbeat` 返回最近持久化的 Heartbeat 事件。
    - `set-heartbeats` 切换 Gateway 网关上的 Heartbeat 处理。
    - `gateway.suspend.prepare` 仅在受跟踪的 Gateway 网关工作处于空闲状态时创建短期协作式挂起租约。`gateway.suspend.status` 检查该租约，`gateway.suspend.resume` 则在解除冻结或主机操作中止后释放该租约。

  </Accordion>

  <Accordion title="模型和用量">
    - `models.list` 返回运行时允许的模型目录。请参阅下文的“`models.list` 视图”。
    - `usage.status` 返回提供商用量窗口/剩余额度摘要。
    - `usage.cost` 返回日期范围内的汇总成本用量摘要。传入 `agentId` 可查询一个智能体，或传入 `agentScope: "all"` 以汇总已配置的智能体。
    - `doctor.memory.status` 返回当前默认 Agent 工作区的向量记忆/缓存嵌入就绪状态。仅在显式执行实时嵌入提供商 ping 时传入 `{ "probe": true }` 或 `{ "deep": true }`。传入 `{ "agentId": "agent-id" }` 可将 Dreaming 存储统计信息限定到一个 Agent 工作区；省略时则汇总已配置的 Dreaming 工作区。
    - `doctor.memory.dreamDiary`、`doctor.memory.backfillDreamDiary`、`doctor.memory.resetDreamDiary`、`doctor.memory.resetGroundedShortTerm`、`doctor.memory.repairDreamingArtifacts` 和 `doctor.memory.dedupeDreamDiary` 接受可选的 `{ "agentId": "agent-id" }`；省略时，它们会对已配置的默认 Agent 工作区执行操作。
    - `doctor.memory.remHarness` 为远程控制平面客户端返回有界的只读 REM harness 预览，其中包括工作区路径、记忆片段、渲染后的有依据 Markdown 和深度提升候选项。需要 `operator.read`。
    - `sessions.usage` 返回每个会话的用量摘要。传入 `agentId` 可查询一个智能体，或传入 `agentScope: "all"` 以同时列出已配置的智能体。
      这两种用量方法都接受带有 IANA `timeZone` 的 `mode: "specific"`，以支持感知夏令时的日历日边界和分桶。对于较旧的客户端，以及 Gateway 网关运行时无法识别所请求时区时的回退，仍支持 `utcOffset`。
    - `sessions.usage.timeseries` 返回一个会话的时间序列用量。
    - `sessions.usage.logs` 返回一个会话的用量日志条目。

  </Accordion>

  <Accordion title="渠道和登录辅助功能">
    - `channels.status` 返回内置 + 捆绑渠道/插件状态摘要。
    - `channels.logout` 在渠道支持时注销特定渠道/账号。
    - `web.login.start` 为当前支持二维码的 Web 渠道提供商启动二维码/Web 登录流程。
    - `web.login.wait` 等待该流程完成，并在成功后启动渠道。
    - `push.test` 向已注册的 iOS 节点发送测试 APNs 推送。
    - `voicewake.get` 返回存储的唤醒词触发器。
    - `voicewake.set` 更新唤醒词触发器并广播更改。

  </Accordion>

  <Accordion title="插件管理">
    - `plugins.list`（`operator.read`）返回已安装插件清单、本地精选的官方推荐项、诊断信息，以及当前安装模式是否允许变更。
    - `plugins.search`（`operator.read`）搜索可安装的 ClawHub 代码插件族和插件包族。传入非空的 `query`，以及可选的 1 到 100 之间的 `limit`。
    - `plugins.install`（`operator.admin`）安装官方目录条目 `{ source: "official", pluginId }`，或安装 ClawHub 软件包 `{ source: "clawhub", packageName, version?, acknowledgeClawHubRisk? }`。ClawHub 安装会保留 Gateway 网关信任、完整性和安装策略检查。安装成功后需要重启 Gateway 网关。
    - `plugins.setEnabled`（`operator.admin`）使用 `{ pluginId, enabled }` 更改一个已安装插件的启用策略。响应包含更新后的目录条目、重启元数据以及所有槽位选择警告。
    - `plugins.uninstall`（`operator.admin`）使用 `{ pluginId }` 移除一个外部安装的插件：配置引用、安装记录和托管文件。捆绑插件不能卸载，只能禁用。响应会列出移除操作，并且始终需要重启 Gateway 网关。

  </Accordion>

  <Accordion title="消息和日志">
    - `send` 是直接出站投递 RPC，用于在聊天运行器之外按渠道/账号/线程目标发送消息。
    - `logs.tail` 返回已配置的 Gateway 网关文件日志末尾内容，并提供游标/数量限制和最大字节数控制。

  </Accordion>

  <Accordion title="操作员终端">
    - `terminal.open` 为显式指定的 `agentId` 或默认智能体启动主机 PTY，并返回解析后的智能体、工作目录、shell 和隔离状态。
    - `terminal.input`、`terminal.resize` 和 `terminal.close` 只能操作调用方连接拥有的会话。
    - `terminal.data` 和 `terminal.exit` 事件只会流式传输到拥有该会话的连接。
    - 连接断开时，其会话会被分离而不是终止：在 `gateway.terminal.detachedSessionTimeoutSeconds` 指定的时间内（默认 300；`0` 恢复为断开连接时终止），这些会话仍可重新附加，同时近期输出会累积在有界的服务器端缓冲区中。
    - `terminal.list` 返回可附加的会话；`terminal.attach` 将处于活动或分离状态的会话重新绑定到调用方连接，并返回重放缓冲区（tmux 风格的接管——之前的活动所有者会收到原因是 `detached` 的 `terminal.exit`）；`terminal.text` 无需附加即可将缓冲区读取为纯文本。
    - 每种终端方法都需要 `operator.admin`；`gateway.terminal.enabled` 必须显式设为 true。完全沙箱隔离的智能体会被拒绝，而且智能体策略更改会关闭现有和正在创建的 PTY，包括已分离的 PTY。

  </Accordion>

  <Accordion title="Talk and TTS">
    - `talk.catalog` 返回用于语音、流式转写和实时语音的只读 Talk 提供商目录：规范提供商 ID、注册表别名、标签、配置状态、可选的组级 `ready` 结果、公开的模型/语音 ID、规范模式、传输协议、核心策略以及实时音频/能力标志，且不会返回提供商密钥或修改全局配置。当前 Gateway 网关会在应用运行时提供商选择后设置 `ready`；在较旧的 Gateway 网关上，若此项缺失，应视为未经验证。
    - `talk.config` 返回生效的 Talk 配置载荷；`includeSecrets` 需要 `operator.talk.secrets`（或 `operator.admin`）。
    - `talk.session.create` 为 `realtime/gateway-relay`、`transcription/gateway-relay` 或 `stt-tts/managed-room` 创建由 Gateway 网关所有的 Talk 会话。对于 `stt-tts/managed-room`，传递 `sessionKey` 的 `operator.write` 调用方还必须传递 `spawnedBy`，以获得限定范围的会话键可见性；创建无范围限定的 `sessionKey` 以及使用 `brain: "direct-tools"` 都需要 `operator.admin`。
    - `talk.session.join` 验证托管房间会话令牌，按需发出 `session.ready` 或 `session.replaced`，并返回房间/会话元数据以及最近的 Talk 事件，但绝不返回明文令牌或其哈希。
    - `talk.session.appendAudio` 将 base64 编码的 PCM 输入音频追加到由 Gateway 网关所有的实时中继和转写会话。
    - `talk.session.startTurn`、`talk.session.endTurn` 和 `talk.session.cancelTurn` 驱动托管房间的轮次生命周期，并在清除状态前拒绝过期轮次。
    - `talk.session.cancelOutput` 停止助手音频输出，主要用于 Gateway 网关中继会话中由 VAD 门控的插话。
    - `talk.session.submitToolResult` 完成由 Gateway 网关所有的实时中继会话所发出的提供商工具调用。请求会等待提供商桥接层公开的任何异步完成信号；提交失败时，关联的运行会保持活动状态，并且不会发出成功的工具结果事件。传递 `options: { willContinue: true }` 可提供中间工具输出；当提供商桥接层声明支持抑制且结果不应启动另一个响应时，传递 `options: { suppressResponse: true }`。
    - `talk.session.steer` 将活动运行的语音控制发送到由 Gateway 网关所有、以智能体为后端的 Talk 会话：`{ sessionId, text, mode? }`，其中 `mode` 为 `status`、`steer`、`cancel` 或 `followup`；省略模式时，将根据口述文本进行分类。
    - `talk.session.close` 关闭由 Gateway 网关所有的中继、转写或托管房间会话，并发出终止 Talk 事件。
    - `talk.mode` 为 WebChat/Control UI 客户端设置/广播当前 Talk 模式状态。
    - `talk.client.create` 使用 `webrtc` 或 `provider-websocket` 创建由客户端所有的实时提供商会话，而配置、凭据、指令和工具策略由 Gateway 网关所有。
    - `talk.client.toolCall` 允许由客户端所有的实时传输协议将提供商工具调用转发给 Gateway 网关策略。首个受支持的工具是 `openclaw_agent_consult`；客户端会获得运行 ID，并等待常规聊天生命周期事件，然后再提交特定于提供商的工具结果。
    - `talk.client.steer` 为由客户端所有的实时传输协议发送活动运行的语音控制。Gateway 网关从 `sessionKey` 解析活动的嵌入式运行，并返回结构化的接受/拒绝结果，而不是静默丢弃引导操作。
    - `talk.event` 是用于实时、转写、STT/TTS、托管房间、电话和会议适配器的单一 Talk 事件渠道。
    - `talk.speak` 通过当前活动的 Talk 语音提供商合成语音。
    - `tts.status` 返回 TTS 启用状态、当前活动的提供商、回退提供商以及提供商配置状态。
    - `tts.providers` 返回可见的 TTS 提供商清单。
    - `tts.enable` 和 `tts.disable` 切换 TTS 偏好设置状态。
    - `tts.setProvider` 更新首选 TTS 提供商。
    - `tts.convert` 执行一次性文本转语音转换。
    - `tts.speak`（`operator.write`）使用已配置的通用 TTS 提供商链渲染非空的 `text`，并以内联 `audioBase64` 的形式返回一个完整音频片段，同时返回 `provider` 以及可选的 `outputFormat`、`mimeType` 和 `fileExtension` 元数据。与 `tts.convert` 不同，它不返回 Gateway 网关本地路径；与 `talk.speak` 不同，它不需要 Talk 提供商。超过 `messages.tts.maxTextLength` 的文本会返回 `INVALID_REQUEST`；合成失败会返回 `UNAVAILABLE`。

  </Accordion>

  <Accordion title="密钥、配置、更新和向导">
    - `secrets.reload` 重新解析活跃的 SecretRef，并且仅在全部成功时替换运行时密钥状态。
    - `secrets.resolve` 为特定的命令/目标集合解析命令目标密钥赋值。
    - `config.get` 返回当前配置快照和哈希值。
    - `config.set` 写入经过验证的配置载荷。
    - `config.patch` 合并部分配置更新。破坏性的数组替换要求在 `replacePaths` 中包含受影响的路径；数组条目下的嵌套数组使用 `[]` 路径，例如 `agents.list[].skills`。
    - `config.apply` 验证并替换完整的配置载荷。
    - `config.schema` 返回 Control UI 和 CLI 工具使用的实时配置架构载荷：架构、`uiHints`、版本、生成元数据，以及可加载时的插件和渠道架构元数据。它包含与 UI 相同的标签/帮助文本中的 `title` / `description` 元数据；当存在匹配的字段文档时，也包括嵌套对象、通配符、数组项以及 `anyOf` / `oneOf` / `allOf` 组合分支。
    - `config.schema.lookup` 返回一个配置路径的路径范围查找载荷：规范化路径、浅层架构节点、匹配的提示和 `hintPath`、可选的 `reloadKind`，以及供 UI/CLI 逐层查看的直接子项摘要。`reloadKind` 是 `restart`、`hot` 或 `none` 之一（`src/config/schema.ts`），并反映所请求路径的 Gateway 网关配置重新加载规划器。查找架构节点保留面向用户的文档和常用验证字段（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、数字/字符串/数组/对象边界、`additionalProperties`、`deprecated`、`readOnly`、`writeOnly`）。子项摘要会公开 `key`、规范化的 `path`、`type`、`required`、`hasChildren`、可选的 `reloadKind`，以及匹配的 `hint` / `hintPath`。
    - `update.run` 运行 Gateway 网关更新流程，并且仅在更新成功时安排重启；具有会话的调用方可以包含 `continuationMessage`，使启动过程通过重启续接队列在重启后继续执行一个后续智能体轮次。来自控制平面的包管理器更新和受监管的 Git 检出更新会使用分离式托管服务交接，而不是在运行中的 Gateway 网关内替换包目录树或修改检出/构建输出。已启动的交接返回 `ok: true`，并包含 `result.reason: "managed-service-handoff-started"` 和 `handoff.status: "started"`；不可用或失败的交接返回 `ok: false`，并包含 `managed-service-handoff-unavailable` 或 `managed-service-handoff-failed`，当需要手动执行 shell 更新时还会包含 `handoff.command`。不可用意味着 OpenClaw 缺少安全的监管边界或持久的服务标识，例如 systemd 的 `OPENCLAW_SYSTEMD_UNIT`。在已启动的交接过程中，重启哨兵可能会短暂报告 `stats.reason: "restart-health-pending"`；续接会延迟到 CLI 验证已重启的 Gateway 网关并写入最终的 `ok` 哨兵之后。
    - `update.status` 刷新并返回最新的更新重启哨兵，包括可用时重启后正在运行的版本。
    - `wizard.start`、`wizard.next`、`wizard.status` 和 `wizard.cancel` 通过 WS RPC 提供新手引导向导。

  </Accordion>

  <Accordion title="智能体和工作区辅助工具">
    - `agents.list` 返回已配置的智能体条目，包括有效模型和运行时元数据。
    - `agents.create`、`agents.update` 和 `agents.delete` 管理智能体记录和工作区连接。
    - `agents.files.list`、`agents.files.get` 和 `agents.files.set` 管理向智能体公开的引导工作区文件。
    - `audit.activity.list` 返回带版本的仅元数据活动账本；`audit.list` 仍是兼容性安全的运行/工具 RPC。
    - `agents.workspace.list` 和 `agents.workspace.get`（`operator.read`）允许位于[操作员权限范围](/zh-CN/gateway/operator-scopes)所述可信操作员域中的客户端，以只读、分页方式浏览智能体的工作区目录。请求仅接受工作区相对路径；读取范围始终限制在解析真实路径后的工作区根目录内（拒绝通过符号链接和硬链接逃逸），受大小上限约束，并仅限 UTF-8 文本和常见图像类型（base64）。响应不会公开主机工作区路径。此命名空间不提供任何写入操作。
    - `tasks.list`、`tasks.get` 和 `tasks.cancel` 向 SDK 和操作员客户端公开 Gateway 网关任务账本。请参阅下文的[任务账本 RPC](#task-ledger-rpcs)。
    - `artifacts.list`、`artifacts.get` 和 `artifacts.download` 在显式的 `sessionKey`、`runId` 或 `taskId` 范围内，提供从转录记录派生的工件摘要和下载。运行和任务查询会在服务器端解析其所属会话，并且仅返回来源匹配的转录媒体；对于不安全或本地 URL 来源，系统会返回不支持下载，而不是在服务器端获取。
    - `environments.list` 和 `environments.status` 保留 Gateway 网关本地环境和节点环境的发现功能。已配置的云端工作节点，以及早期配置文件遗留的持久记录，会添加包含 `providerId`、可选 `leaseId`、`state`、`ageMs`、可选 `idleMs` 和 `attachedSessionIds` 的 `worker` 元数据。工作节点生命周期状态包括 `requested`、`provisioning`、`bootstrapping`、`ready`、`attached`、`idle`、`draining`、`destroying`、`destroyed`、`failed` 和 `orphaned`。
    - `environments.create`（`{ profileId, idempotencyKey }`）根据已配置的插件提供商配置文件预配工作节点；使用相同键重试时会复用持久操作。`environments.destroy`（`{ environmentId }`）请求以幂等方式拆除持久工作节点环境。两者都需要 `operator.admin`，属于控制平面写入操作，并返回与状态响应相同结构的环境摘要。
    - `agent.identity.get` 返回智能体或会话的有效助手身份。
    - `agent.wait` 等待运行结束，并在可用时返回终止状态快照。

  </Accordion>

  <Accordion title="会话控制">
    - `sessions.list` 返回当前会话索引；配置了智能体运行时后端时，其中还包括每行的 `agentRuntime` 元数据。
    - `sessions.subscribe` 和 `sessions.unsubscribe` 为当前 WS 客户端开启或关闭会话变更事件订阅。
    - `sessions.messages.subscribe` 和 `sessions.messages.unsubscribe` 为一个会话开启或关闭转录记录/消息事件订阅。传入 `includeApprovals: true` 后，还会接收经过净化的 `session.approval` 生命周期事件，但仅限持久化受众包含该确切会话且审查者绑定授权订阅客户端的审批。此时订阅响应还会包含有界的待处理 `approvalReplay`；当 `truncated` 为 false 时，它具有权威性。选择启用按每次订阅调用生效，不会持续保留：在不传 `includeApprovals: true` 的情况下重新订阅同一会话，会移除现有的审批订阅。除常规会话读取权限外，选择启用此功能还要求具备 `operator.admin`，或在已配对设备上具备 `operator.approvals`。
    - `sessions.preview` 返回特定会话键对应的有界转录记录预览。
    - `sessions.describe` 返回与确切会话键对应的一行 Gateway 网关会话记录。
    - `sessions.resolve` 解析会话目标或将其规范化。
    - `sessions.create` 创建新的会话条目。`worktree: true` 会预配一个托管工作树；可选的 `worktreeBaseRef`/`worktreeName` 用于选择基础引用和分支名称，`execNode`（`operator.admin`）则将会话 Exec 绑定到节点主机。创建的工作树会在结果中返回，并持久化到会话行中（`worktree: { id, branch, repoRoot }`）。如果条目已创建，但其嵌套的初始 `chat.send` 被拒绝，成功结果会包含 `runStarted: false` 和 `runError`；客户端可以保留提示词，并使用返回的会话键重试。
    - `sessions.groups.list`、`sessions.groups.put`、`sessions.groups.rename` 和 `sessions.groups.delete` 管理由 Gateway 网关拥有的自定义会话分组目录（名称 + 显示顺序）。成员关系仍保存在每个会话的 `category` 字段中；重命名和删除操作会在服务器端更新成员会话。
    - `sessions.send` 向现有会话发送消息。
    - `sessions.steer` 是用于活动会话的中断并引导变体。
    - `sessions.abort` 中止会话的活动工作。传入 `key` 及可选的 `runId`，或仅针对 Gateway 网关能够解析到会话的活动运行传入 `runId`。
    - `sessions.patch` 更新会话元数据/覆盖项，并报告解析后的规范模型以及有效的 `agentRuntime`。
    - `sessions.reset`、`sessions.delete` 和 `sessions.compact` 执行会话维护。
    - `sessions.get` 返回完整的已存储会话行。
    - 聊天执行仍使用 `chat.history`、`chat.send`、`chat.abort` 和 `chat.inject`。`chat.history` 会针对 UI 客户端进行显示规范化：从可见文本中移除内联指令标签；移除纯文本工具调用 XML 载荷（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块）和泄漏的 ASCII/全角模型控制令牌；省略仅包含静默令牌的助手行（确切的 `NO_REPLY` / `no_reply`）；超大行可替换为占位符。
    - `chat.message.get` 是用于读取单个可见转录记录条目的增量式有界完整消息读取器。传入 `sessionKey`、会话选择按智能体限定时可选的 `agentId`，以及此前通过 `chat.history` 提供的转录记录 `messageId`；如果存储的条目仍然可用且未超大，Gateway 网关会返回相同的显示规范化投影，但不受轻量历史记录截断上限约束。
    - `chat.toolTitles` 返回在 Control UI 中呈现的工具调用的简短用途标题（批量处理，最多 24 项，输入有界）。此功能通过 `gateway.controlUi.toolTitles` 选择启用（默认关闭）；禁用此功能的 Gateway 网关会返回 `{ titles: {}, disabled: true }`，且不调用模型，以便客户端停止请求。启用后，标题使用标准实用模型路由：优先使用显式配置的 `utilityModel`（这是操作员的决定，与所有实用任务一样，可能会将有界的任务内容发送给所选提供商），否则使用会话提供商声明的小模型默认值，从而不会隐式出现新的出站目标；空的 `utilityModel` 会将其完全禁用。标题绝不会回退到主模型。结果按工具名称 + 输入作为键缓存到每个智能体的状态数据库中，因此重复查看绝不会对同一调用重复计费。
    - `chat.send` 接受单轮 `fastMode: "auto"`，以便对自动截止时间之前启动的模型调用使用快速模式，而之后启动的重试、回退、工具结果或续接调用不使用快速模式。截止时间默认为 60 秒（`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`），并且可以通过 `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` 按模型配置。`chat.send` 调用方可以传入单轮 `fastAutoOnSeconds`，覆盖该请求的截止时间。

  </Accordion>

  <Accordion title="设备配对和设备令牌">
    - `device.pair.list` 返回待处理和已批准的配对设备。
    - `device.pair.setupCode` 创建移动端设置代码，并默认创建 PNG 二维码数据 URL。它要求 `operator.admin`，且有意从公布的设备发现信息中省略。结果包括 `setupCode`、可选的 `qrDataUrl`、`gatewayUrl`、非机密的 `auth` 标签和 `urlSource`。
    - `device.pair.approve`、`device.pair.reject` 和 `device.pair.remove` 管理设备配对记录。
    - `device.pair.rename` 分配操作员标签（`{ deviceId, label }`）；该标签优先于客户端报告的显示名称，并会在设备修复或重新批准后保留。
    - `device.token.rotate` 在已批准的角色和调用方权限范围边界内轮换已配对设备令牌。
    - `device.token.revoke` 在已批准的角色和调用方权限范围边界内撤销已配对设备令牌。

    设置代码嵌入了一个短期有效的引导凭据。客户端不得在配对流程之外
    记录或持久化该凭据。

  </Accordion>

  <Accordion title="节点配对、调用和待处理工作">
    - `node.pair.list`、`node.pair.approve`、`node.pair.reject` 和 `node.pair.remove` 涵盖节点能力审批。`node.pair.request` 和 `node.pair.verify` 已于 2026.7 随独立节点配对存储一并移除；待处理请求由 Gateway 网关在节点连接期间创建。
    - `node.list` 和 `node.describe` 返回已知/已连接的节点状态。
    - `node.rename` 更新已配对节点的标签。
    - `node.invoke` 将命令转发到已连接的节点。
    - `node.invoke.result` 返回调用请求的结果。
    - `mcp.tools.call.v1` 是用于调用已配置的节点本地 MCP 工具的无头节点主机命令。它通过 `node.invoke` 传递，要求节点声明该命令，并且仍受配对审批和 `gateway.nodes.denyCommands` 约束。
    - `node.event` 将节点发起的事件传回 Gateway 网关。
    - `node.pluginTools.update` 是替换已连接节点中对智能体可见的插件/MCP 工具描述符的唯一发布路径；`connect` 参数不会携带这些描述符。
    - `node.pending.pull` 和 `node.pending.ack` 是已连接节点的队列 API。
    - `node.pending.enqueue` 和 `node.pending.drain` 管理离线/断开连接节点的持久待处理工作。

  </Accordion>

  <Accordion title="审批系列">
    - `approval.get` 和 `approval.resolve` 是不区分类型的持久审批方法（权限范围 `operator.approvals`）。`approval.get` 返回经过净化的待处理或保留的终止状态投影，其中包含稳定的 `urlPath`；`approval.resolve` 接受规范审批 ID、显式的 `kind` 和决定，应用先回答者胜出的解析规则，并始终返回已记录的规范结果。
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list` 和 `exec.approval.resolve` 涵盖一次性 Exec 审批请求以及待处理审批的查询/重放。它们是位于协议边界、基于同一持久审批注册表的适配器。
    - `exec.approval.waitDecision` 等待一个待处理的 Exec 审批，并返回最终决定（超时时返回 `null`）。
    - `exec.approvals.get` 和 `exec.approvals.set` 管理 Gateway 网关 Exec 审批策略快照。
    - `exec.approvals.node.get` 和 `exec.approvals.node.set` 通过节点中继命令管理节点本地的 Exec 审批策略。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision` 和 `plugin.approval.resolve` 涵盖插件定义的审批流程。

  </Accordion>

  <Accordion title="自动化、Skills 和工具">
    - 自动化：`wake` 调度立即或在下次 Heartbeat 时注入唤醒文本；`cron.get`、`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` 管理定时工作。
    - `cron.run` 仍是用于手动运行的入队式 RPC。需要完成语义的客户端应读取返回的 `runId` 并轮询 `cron.runs`。
    - `cron.runs` 接受可选的非空 `runId` 过滤器，以便客户端可以跟踪一个排队中的手动运行，而无需与同一任务的其他历史条目竞争。
    - Skills 和工具：`commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。请参阅下文的[操作员辅助方法](#operator-helper-methods)。

  </Accordion>
</AccordionGroup>

### 常见事件系列

- `chat`：UI 聊天更新，例如 `chat.inject` 和其他仅限转录记录的聊天
  事件。在协议 v4 中，增量载荷携带 `deltaText`；`message` 仍是
  累积的助手快照。非前缀替换会设置
  `replace=true`，并将 `deltaText` 用作替换文本。
- `session.message`、`session.operation`、`session.tool`：已订阅会话的转录记录、进行中的
  会话操作和事件流更新。
- `session.approval`：面向明确选择启用的确切会话订阅者，提供经过净化的待处理和终止状态审批事实。子审批使用
  持久化的祖先受众；事件绝不会修改转录记录或唤醒智能体。
- `sessions.changed`：会话索引或元数据已更改。
- `presence`：系统在线状态快照更新。
- `tick`：周期性保活/存活事件。
- `health`：Gateway 健康快照更新。
- `heartbeat`：Heartbeat 事件流更新。
- `cron`：cron 运行/任务变更事件。
- `shutdown`：Gateway 网关关闭通知。
- `node.pair.requested` / `node.pair.resolved`：节点配对生命周期。
- `node.invoke.request`：节点调用请求广播。
- `device.pair.requested` / `device.pair.resolved`：已配对设备生命周期。
- `voicewake.changed`：唤醒词触发器配置已更改。
- `exec.approval.requested` / `exec.approval.resolved`：Exec 审批
  生命周期。
- `plugin.approval.requested` / `plugin.approval.resolved`：插件审批
  生命周期。

### 节点辅助方法

节点可以调用 `skills.bins` 获取当前技能可执行文件列表，
用于自动允许检查。

## 审计账本 RPC

`audit.activity.list` 为操作员客户端提供稳定的按时间从新到旧排列的智能体
运行、工具操作和选择启用的消息生命周期元数据视图。它要求
`operator.read`。查询不包括超过 30 天的记录，共享
SQLite 账本的上限为 100,000 条记录。过期行会在
Gateway 网关启动、每小时维护以及后续写入期间删除。有关数据模型和隐私语义，请参阅
[审计历史](/gateway/audit)。

- 参数：可选的精确 `agentId`、`sessionKey` 或 `runId`；可选的 `kind`
  （`"agent_run"`、`"tool_action"` 或 `"message"`）；可选的 `status`
  （`"started"`、`"succeeded"`、`"failed"`、`"cancelled"`、`"timed_out"`、
  `"blocked"` 或 `"unknown"`）；可选的消息 `direction`（`"inbound"` 或
  `"outbound"`）和精确 `channel`；可选的包含边界的 `after` / `before`
  Unix 毫秒时间范围；可选的 `limit`，范围为 `1` 到 `500`；以及可选的
  字符串 `cursor`，来自上一页。
- 结果：`{ "events": AuditActivityEventV1[], "nextCursor"?: string }`。

具名的 V1 结果联合类型为 Agent 运行、工具操作、入站消息和出站消息提供了独立的
schema。`eventType` 判别字段分别为
`agent_run`、`tool_action`、`inbound_message` 或 `outbound_message`；`kind` 和
消息 `direction` 仍可用于筛选和显示。每个事件都有整数
`schemaVersion: 1`。消息身份引用使用精确的
`hmac-sha256:v1:<32 hex key id>:<64 hex digest>` 格式；渠道发送者的 actor
id 使用相同格式。

所有变体都要求提供 `eventType`、`schemaVersion`、`eventId`、`sequence`、
`sourceSequence`、`occurredAt`、`kind`、`action`、`status`、`actor` 和
`redaction`。各变体字段如下：

| `eventType`        | 必填字段                                                          | 可选字段                                                                                                                        |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `agent_run`        | `agentId`、`runId`；`kind: "agent_run"`                           | `sessionKey`、`sessionId`、`errorCode`                                                                                          |
| `tool_action`      | `agentId`、`runId`；`kind: "tool_action"`                         | `sessionKey`、`sessionId`、`toolCallId`、`toolName`、`errorCode`                                                                |
| `inbound_message`  | `direction: "inbound"`、`channel`、`conversationKind`、`outcome`  | `agentId`、`runId`、`durationMs`、`resultCount`、身份引用、`reasonCode`、`errorCode`                                             |
| `outbound_message` | `direction: "outbound"`、`channel`、`conversationKind`、`outcome` | `agentId`、`runId`、`durationMs`、`resultCount`、身份引用、`reasonCode`、`deliveryKind`、`failureStage`、`errorCode`              |

封闭的消息枚举如下：

- `conversationKind`：`direct`、`group`、`channel` 或 `unknown`。
- 入站 `outcome`：`completed`、`skipped` 或 `failed`；可选的
  `reasonCode`：`duplicate`、`reply_operation_active`、
  `reply_operation_aborted`、`fast_abort`、`plugin_bound_handled`、
  `plugin_bound_unavailable`、`plugin_bound_declined`、`plugin_bound_error`、
  `before_dispatch_handled`、`acp_dispatch_completed`、`acp_dispatch_failed`、
  `acp_dispatch_empty` 或 `acp_dispatch_aborted`。
- 出站 `outcome`：`sent`、`suppressed`、`failed` 或 `unknown`；可选的
  `reasonCode`：`cancelled_by_message_sending_hook`、
  `cancelled_by_reply_payload_sending_hook`、
  `empty_after_message_sending_hook`、`empty_after_reply_payload_sending_hook`
  或 `no_visible_payload`。未返回平台身份的适配器会被标记为
  `unknown`，因为无法排除已经发生外部副作用。
- `deliveryKind`：`text`、`media` 或 `other`；`failureStage`：
  `platform_send`、`queue` 或 `unknown`。

终态字段彼此关联，并非各自独立可选：

| 变体             | 终态映射                                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Agent 运行       | `started` 没有 `errorCode`；每种非成功的结束状态都要求提供对应的 `run_*` 代码。                                                                                     |
| 工具操作         | `started` 和成功状态没有 `errorCode`；其他每种结束状态都要求提供对应的 `tool_*` 代码。                                                                              |
| 入站消息         | succeeded = `completed`；blocked = `skipped`；failed = `failed` 加 `message_processing_failed`。如果存在 `reasonCode`，它必须属于对应的终态类别。                    |
| 出站消息         | succeeded = `sent`；blocked = `suppressed` 加 `reasonCode`；failed = `failed` 加 `errorCode` 和 `failureStage`；unknown = `unknown` 加 `failureStage`。              |

每个活动事件都包含稳定的事件 id、单调递增的账本序列、源事件序列、时间戳、actor、操作、状态、整数
`schemaVersion: 1` 以及 `redaction: "metadata_only"`。运行和工具记录
要求包含 Agent 和运行来源信息，也可以包含会话来源信息。消息
记录可以包含 Agent 和运行 id，但有意永不包含
`sessionKey` 或 `sessionId`；因此，`sessionKey` 查询筛选器仅适用于
运行行和工具行。工具事件可以包含工具调用 id 和工具名称。

消息记录使用 `message.inbound.processed` 或
`message.outbound.finished`，并添加方向、渠道、会话类型、
规范化结果，以及可选的交付类型、失败阶段、持续时间、
结果计数、原因代码和安装环境本地使用密钥生成的
账号/会话/消息/目标伪名。这些伪名有助于
关联，但并非匿名化：状态数据库包含其密钥，
而 RPC 和 CLI 导出不包含。账本不存储提示词、消息
正文、工具参数、工具结果、命令输出或原始错误文本。
运行/工具的 `sessionKey` 值仍是原始关联元数据，并且可能嵌入
平台账号或对端 id；消息记录省略会话键。

对于入站行，`durationMs` 测量核心分发直至终态所用的时间，
`resultCount` 统计已最终确定并进入队列的工具、分块和回复载荷数量。对于
出站行，`durationMs` 涵盖从取得交付所有权到确认、
死信或协调完成的时间（包括排队等待时间），`resultCount`
统计已识别的实际平台发送次数。如果存在 `deliveryKind`，
它描述经过钩子和渲染后的有效载荷；被抑制或
崩溃状态不明确的行会省略该字段。

当前消息覆盖范围包括到达核心
分发的已接受入站消息，其中包括核心的重复/终态结果。出站覆盖范围会为
到达共享持久化交付边界的每个原始逻辑回复载荷写入一条终态记录；
分块和适配器扇出会聚合到 `resultCount` 中。可重试或状态不明确的排队发送
仅在确认、进入死信或协调完成后记录。绕过这些
共享边界的插件本地路径和直接发送路径目前尚未覆盖。有界工作队列采用尽力而为模式，
在失败或饱和时可能丢弃记录，因此此接口并不是
无损的合规归档。

记录功能默认启用，由
[`audit.enabled`](/zh-CN/gateway/configuration-reference#audit) 控制。消息记录由
`audit.messages` 单独控制，默认值为 `"off"`。禁用
记录后，`audit.activity.list` 仍会提供此前写入的记录，
直到它们过期。

已发布的 `audit.list` 请求、结果和 `AuditEvent` schema 保持
不变，并且仅返回 Agent 运行和工具操作记录。新的操作员
客户端应在 Gateway 网关声明支持时调用 `audit.activity.list`。旧版
Gateway 网关可能报告 `unknown method: audit.activity.list`，也可能因为
已发布版本先执行授权再查找方法，而对仅具有读取权限范围的请求报告 `missing scope:
operator.admin`。仅当该方法未被声明支持时，才将后者视为方法不存在。
随后，仅当筛选条件不需要消息类型、方向或渠道
支持时，客户端才能重试 `audit.list`。

使用 [`openclaw audit`](/zh-CN/cli/audit) 执行文本查询和有界 JSON 导出。

## 任务账本 RPC

操作员客户端通过任务账本 RPC
（`packages/gateway-protocol/src/schema/tasks.ts`）检查和取消 Gateway 网关后台任务记录。这些
RPC 返回经过清理的任务摘要，而不是原始运行时状态。

- `tasks.list` 要求 `operator.read`。
  - 参数：可选的 `status`（`"queued"`、`"running"`、`"completed"`、
    `"failed"`、`"cancelled"` 或 `"timed_out"`）或由这些状态组成的数组，
    可选的 `agentId`、可选的 `sessionKey`、范围为 `1` 到
    `500` 的可选 `limit`，以及可选的字符串 `cursor`。
  - 结果：`{ "tasks": TaskSummary[], "nextCursor"?: string }`。
- `tasks.get` 要求 `operator.read`。
  - 参数：`{ "taskId": string }`。
  - 结果：`{ "task": TaskSummary }`。
  - 缺失的任务 id 会返回 Gateway 网关的未找到错误格式。
- `tasks.cancel` 要求 `operator.write`。
  - 参数：`{ "taskId": string, "reason"?: string }`。
  - 结果：`{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`。
  - `found` 表示账本中是否存在匹配的任务。`cancelled`
    表示运行时是否接受或记录了取消操作。

`TaskSummary` 包含 `id`、`status` 和可选元数据：`kind`、
`runtime`、`title`、`agentId`、`sessionKey`、`childSessionKey`、`ownerKey`、
`runId`、`taskId`、`flowId`、`parentTaskId`、`sourceId`、时间戳、进度、
终态摘要和经过清理的错误文本。`agentId` 标识执行任务的 Agent；
`sessionKey` 和 `ownerKey` 保留请求者和控制上下文。

## 操作员辅助方法

- `commands.list`（`operator.read`）获取智能体的运行时命令清单。
  - `agentId` 是可选的；省略它可读取默认智能体工作区。
  - `scope` 控制主要 `name` 所针对的界面：`text` 返回不带前导 `/` 的主要文本命令标记；`native` 和默认的 `both` 路径会在可用时返回感知提供商的原生命令名称。
  - `textAliases` 包含精确的斜杠别名，例如 `/model` 和 `/m`。
  - `nativeName` 在存在时包含感知提供商的原生命令名称。
  - `provider` 是可选的，仅影响原生命名和原生插件命令的可用性。
  - `includeArgs=false` 会从响应中省略序列化的参数元数据。
- `tools.catalog`（`operator.read`）获取智能体的运行时工具目录。响应包含分组工具和来源元数据：
  - `source`：`core` 或 `plugin`
  - `pluginId`：当 `source="plugin"` 时的插件所有者
  - `optional`：插件工具是否为可选工具
- `tools.effective`（`operator.read`）获取会话的运行时有效工具清单。
  - `sessionKey` 是必需的。
  - Gateway 网关在服务端从会话中派生可信的运行时上下文，而不接受调用方提供的身份验证或交付上下文。
  - 响应是作用于会话范围、由服务器派生的活动清单投影，其中包括核心、插件、渠道以及已发现的 MCP 服务器工具。
  - 对于 MCP，`tools.effective` 是只读的：它可以让已预热会话的 MCP 目录经过最终工具策略后投影出来，但不会创建 MCP 运行时、连接传输协议或发出 `tools/list`。如果不存在匹配的已预热目录，响应可能包含 `mcp-not-yet-connected`、`mcp-not-yet-listed` 或 `mcp-stale-catalog` 等通知。
  - 有效工具条目使用 `source="core"`、`source="plugin"`、`source="channel"` 或 `source="mcp"`。
- `tools.invoke`（`operator.write`）通过与 `/tools/invoke` 相同的 Gateway 网关策略路径调用一个可用工具。
  - `name` 是必需的。`args`、`sessionKey`、`agentId`、`confirm` 和 `idempotencyKey` 是可选的。
  - 如果同时存在 `sessionKey` 和 `agentId`，解析出的会话智能体必须与 `agentId` 匹配。
  - `cron`、`gateway` 和 `nodes` 等仅限所有者使用的核心包装器需要所有者/管理员身份（`operator.admin`），尽管 `tools.invoke` 本身需要的是 `operator.write`。
  - 响应是面向 SDK 的信封，其中包含 `ok`、`toolName`、可选的 `output` 和类型化的 `error` 字段。审批或策略拒绝会在载荷中返回 `ok:false`，而不会绕过 Gateway 网关工具策略管线。
- `skills.status`（`operator.read`）获取智能体的可见技能清单。
  - `agentId` 是可选的；省略它可读取默认智能体工作区。
  - 响应包含资格状态、缺失的要求、配置检查和经过清理的安装选项，但不会暴露原始密钥值。
- `skills.search` 和 `skills.detail`（`operator.read`）返回 ClawHub 设备发现元数据。
- `skills.upload.begin`、`skills.upload.chunk` 和 `skills.upload.commit`（`operator.admin`）在安装私有技能归档之前暂存它。这是供可信客户端使用的独立管理员上传路径，并非普通的 ClawHub 技能安装流程；除非启用 `skills.install.allowUploadedArchives`，否则默认禁用。
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    创建绑定到该 slug 和 force 值的上传。
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` 在精确的解码偏移量处追加字节。
  - `skills.upload.commit({ uploadId, sha256? })` 验证最终大小和 SHA-256。提交只会完成上传，不会安装技能。
  - 上传的技能归档是根目录包含 `SKILL.md` 的 zip 归档。归档内部的目录名称绝不会决定安装目标。
- `skills.install`（`operator.admin`）有三种模式：
  - ClawHub 模式：`{ source: "clawhub", slug, version?, force? }` 将技能文件夹安装到默认智能体工作区的 `skills/` 目录。
  - 上传模式：`{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    将已提交的上传安装到默认智能体工作区的 `skills/<slug>` 目录。slug 和 force 值必须与原始 `skills.upload.begin` 请求匹配。除非启用 `skills.install.allowUploadedArchives`，否则会被拒绝；此设置不影响 ClawHub 安装。
  - Gateway 网关安装器模式：`{ name, installId, timeoutMs? }` 在 Gateway 网关主机上运行声明的 `metadata.openclaw.install` 操作。旧版客户端可能仍会发送 `dangerouslyForceUnsafeInstall`；此字段已弃用，仅出于协议兼容性而接受，并会被忽略。对于由操作员决定的安装，请使用 `security.installPolicy`。
- `skills.update`（`operator.admin`）有两种模式：
  - ClawHub 模式更新默认智能体工作区中一个已跟踪的 slug，或更新所有已跟踪的 ClawHub 安装。
  - 配置模式修补 `skills.entries.<skillKey>` 值，例如 `enabled`、`apiKey` 和 `env`。

### `models.list` 视图

`models.list` 接受可选的 `view` 参数
（`src/agents/model-catalog-visibility.ts`）：

- 省略或使用 `"default"`：如果已配置 `agents.defaults.models`，响应为允许的目录，其中包括针对 `provider/*` 条目动态发现的模型。否则，响应为完整的 Gateway 网关目录。
- `"configured"`：适合选择器大小的行为。如果已配置 `agents.defaults.models`，它仍然优先，其中包括针对 `provider/*` 条目按提供商范围执行的设备发现。如果没有允许列表，响应使用显式的 `models.providers.<provider>.models` 条目，并且仅在不存在已配置的模型行时回退到完整目录。
- `"provider-config"`：由源定义的 `models.providers.*.models` 清单，不受选择器允许列表影响。各行包含公开模型能力和感知路由的可用性，但会省略提供商端点、身份验证材料和运行时请求配置。
- `"all"`：完整的 Gateway 网关目录，绕过 `agents.defaults.models`。用于诊断/设备发现 UI，而非普通模型选择器。

## Exec 审批

- 当 Exec 请求需要审批时，Gateway 网关会广播 `exec.approval.requested`。
- 操作员客户端通过调用 `exec.approval.resolve` 进行处理（需要 `operator.approvals`）。
- 对于 `host=node`，`exec.approval.request` 必须包含 `systemRunPlan`
  （规范的 `argv`/`cwd`/`rawCommand`/会话元数据）。缺少 `systemRunPlan` 的请求会被拒绝。
- 获得批准后，转发的 `node.invoke system.run` 调用会复用该规范 `systemRunPlan`，将其作为权威的命令/cwd/会话上下文。
- 如果调用方在准备阶段与最终获批的 `system.run` 转发之间修改 `command`、`rawCommand`、`cwd`、`agentId` 或 `sessionKey`，Gateway 网关会拒绝运行，而不会信任修改后的载荷。

## 智能体交付回退

- `agent` 请求可包含 `deliver=true` 以请求出站交付。
- `bestEffortDeliver=false`（默认值）保持严格行为：无法解析或仅限内部的交付目标会返回 `INVALID_REQUEST`。
- 当无法解析任何可从外部交付的路由时（例如内部/webchat 会话或存在歧义的多渠道配置），`bestEffortDeliver=true` 允许回退为仅在会话中执行。
- 请求交付时，最终的 `agent` 结果可能包含 `result.deliveryStatus`，使用与
  [`openclaw agent --json --deliver`](/zh-CN/cli/agent#json-delivery-status) 中记录的相同 `sent`、`suppressed`、`partial_failed` 和 `failed` 状态。

## 版本控制

- `PROTOCOL_VERSION`、`MIN_CLIENT_PROTOCOL_VERSION`、
  `MIN_NODE_PROTOCOL_VERSION` 和 `MIN_PROBE_PROTOCOL_VERSION` 位于
  `packages/gateway-protocol/src/version.ts`。
- 客户端发送 `minProtocol` + `maxProtocol`。操作员和 UI 客户端必须在该范围内包含当前协议；当前客户端和服务器运行协议 v4。
- 同时具有 `role: "node"` 和 `client.mode: "node"` 的已通过身份验证客户端可以使用 N-1 节点协议（目前为 v3）。轻量级重启探针使用相同的 N-1 窗口。设备身份验证、配对、权限范围、命令策略和 Exec 审批不受此兼容窗口影响。由插件所有的节点能力和命令会被暂时隐藏，直到节点升级到当前协议，因为其托管界面不属于 N-1 合约。
- 架构和模型从 TypeBox 定义生成：
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### 客户端常量

参考客户端实现在 `packages/gateway-client/src/` 中
（OpenClaw 通过精简的 `src/gateway/client.ts` 门面将其包装）。这些默认值在协议 v4 中保持稳定，是第三方客户端的预期基准。

| 常量                                      | 默认值                                                | 来源                                                                                                                      |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_NODE_PROTOCOL_VERSION`               | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_PROBE_PROTOCOL_VERSION`              | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| 请求超时（每个 RPC）                      | `30_000` ms                                           | `packages/gateway-client/src/client.ts`（`requestTimeoutMs`）                                                             |
| 预认证/连接质询超时                       | `15_000` ms                                           | `packages/gateway-client/src/timeouts.ts`（`OPENCLAW_HANDSHAKE_TIMEOUT_MS` 环境变量可增加已配对服务器/客户端的时间预算）   |
| 初始重连退避                              | `1_000` ms                                            | `packages/gateway-client/src/client.ts`（`backoffMs`）                                                                    |
| 最大重连退避                              | `30_000` ms                                           | `packages/gateway-client/src/client.ts`（`scheduleReconnect`）                                                            |
| 设备令牌关闭后的快速重试限制              | `250` ms                                              | `packages/gateway-client/src/client.ts`                                                                                   |
| 调用 `terminate()` 前的强制停止宽限期     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                           |
| `stopAndWait()` 默认超时                   | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                |
| 默认 tick 间隔（`hello-ok` 前）            | `30_000` ms                                           | `packages/gateway-client/src/client.ts`                                                                                   |
| tick 超时关闭                             | 静默时间超过 `tickIntervalMs * 2` 时使用代码 `4000`   | `packages/gateway-client/src/client.ts`                                                                                   |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                                                         |

服务器会在 `hello-ok` 中通告实际生效的 `policy.tickIntervalMs`、
`policy.maxPayload` 和 `policy.maxBufferedBytes`；客户端应遵循这些值，
而不是握手前的默认值。

当每个待处理请求都设有截止时间时，参考客户端会让有限时请求使用其配置的截止时间。
如果 `expectFinal` 请求没有有限的 `timeoutMs`、任何请求设有
`timeoutMs: null`，或有限时请求与无界请求混合存在，则 tick 看门狗会保持启用。
如果入站事件和响应的静默时间超过 tick 超时阈值，客户端会使用代码 `4000`
关闭套接字，拒绝所有待处理请求并重新连接。重新连接后不会重放被拒绝的请求。

## 身份验证

- 共享密钥 Gateway 网关身份验证使用 `connect.params.auth.token` 或
  `connect.params.auth.password`，具体取决于配置的
  `gateway.auth.mode`（`"none" | "token" | "password" | "trusted-proxy"`）。
- Tailscale Serve（`gateway.auth.allowTailscale: true`）等携带身份信息的模式，
  或非回环的 `gateway.auth.mode: "trusted-proxy"`，会根据请求标头完成连接身份验证检查，
  而不是使用 `connect.params.auth.*`。
- 私有入口的 `gateway.auth.mode: "none"` 会完全跳过共享密钥连接身份验证；
  不要在公共/不受信任的入口上公开此模式。
- 配对后，Gateway 网关会签发一个作用域限定为连接角色 + 权限范围的设备令牌，
  并在 `hello-ok.auth.deviceToken` 中返回。客户端应在每次成功连接后将其持久化。
- 使用已存储的设备令牌重新连接时，还应复用为该令牌存储的已批准权限范围集。
  这样可保留已授予的读取/探测/状态访问权限，并避免重连时悄然缩减为更窄的、
  仅限管理员的隐式权限范围。
- 客户端连接身份验证组装（`packages/gateway-client/src/client.ts` 中的
  `selectConnectAuth`）：
  - `auth.password` 相互独立，设置后始终会转发。
  - `auth.token` 按以下优先顺序填充：首先是显式共享令牌，
    然后是显式 `deviceToken`，最后是已存储的每设备令牌（以
    `deviceId` + `role` 为键）。
  - 仅当上述方式均未解析出 `auth.token` 时，才会发送
    `auth.bootstrapToken`。共享令牌或任何已解析的设备令牌都会抑制它。
  - 在一次性的 `AUTH_TOKEN_MISMATCH` 重试中，仅受信任端点允许自动提升已存储的设备令牌：
    回环端点，或使用固定 `tlsFingerprint` 的 `wss://`。未固定指纹的公共
    `wss://` 不符合条件。
- 内置设置代码引导会返回主要节点的
  `hello-ok.auth.deviceToken`，并在 `hello-ok.auth.deviceTokens`
  中返回一个有界的操作员令牌，用于受信任的移动端交接。该操作员令牌包含
  `operator.talk.secrets`，用于读取原生 Talk 配置，但不包含配对变更权限范围和
  `operator.admin`。
- 当非基线设置代码引导等待批准时，
  `PAIRING_REQUIRED` 详细信息会包含 `recommendedNextStep: "wait_then_retry"`、
  `retryable: true` 和 `pauseReconnect: false`。继续使用相同的引导令牌重新连接，
  直到请求获批或令牌失效。
- 仅当连接通过 `wss://` 或回环/本地配对等受信任传输使用引导身份验证时，
  才持久化 `hello-ok.auth.deviceTokens`。
- 如果客户端提供显式 `deviceToken` 或显式 `scopes`，则调用方请求的权限范围集
  仍为权威值；仅当客户端复用已存储的每设备令牌时，才会复用缓存的权限范围。
- 可通过 `device.token.rotate` 和 `device.token.revoke` 轮换/撤销设备令牌
  （需要 `operator.pairing`）。轮换或撤销节点或其他非操作员角色还需要
  `operator.admin`。
- `device.token.rotate` 返回轮换元数据。仅对于已使用该设备令牌完成身份验证的
  同设备调用，它才会回显替换后的持有者令牌，使仅使用令牌的客户端能在重新连接前
  持久化替换令牌。共享令牌/管理员轮换不会回显持有者令牌。
- 令牌签发、轮换和撤销始终受限于该设备配对条目中记录的已批准角色集；
  令牌变更不能扩展到或指定配对批准从未授予的设备角色。
- 对于已配对设备的令牌会话，除非调用方还拥有 `operator.admin`，
  否则设备管理仅限自身范围：非管理员调用方只能管理其自身设备条目的操作员令牌。
  节点和其他非操作员令牌的管理仅限管理员，即使是调用方自己的设备也不例外。
- `device.token.rotate` 和 `device.token.revoke` 还会根据调用方当前会话的权限范围，
  检查目标操作员令牌的权限范围集。非管理员调用方无法轮换或撤销权限范围比自身
  当前持有范围更广的操作员令牌。
- 身份验证失败包括 `error.details.code` 及恢复提示：
  - `error.details.canRetryWithDeviceToken`（布尔值）
  - `error.details.recommendedNextStep`：`retry_with_device_token`、
    `update_auth_configuration`、`update_auth_credentials`、
    `wait_then_retry`、`review_auth_configuration` 之一
    （`packages/gateway-protocol/src/connect-error-details.ts`）。
- 客户端对 `AUTH_TOKEN_MISMATCH` 的处理：
  - 受信任的客户端可以尝试使用缓存的每设备令牌进行一次有界重试。
  - 如果该重试失败，则停止自动重连循环，并显示需要操作员采取行动的指引。
- `AUTH_SCOPE_MISMATCH` 表示设备令牌已被识别，但不涵盖请求的角色/权限范围。
  不要将其表述为令牌无效；应提示操作员重新配对，或批准更窄/更宽的权限范围约定。

## 设备身份与配对

- 节点应包含派生自密钥对指纹的稳定设备身份（`device.id`）。
- Gateway 网关按设备和角色颁发令牌。
- 除非启用了本地自动批准，否则新的设备 ID 必须经过配对批准。
- 配对自动批准主要适用于直接 local loopback 连接。
- OpenClaw 还为可信的共享密钥辅助程序流程提供一条范围有限的后端/容器本地自连接路径。
- 同一主机上的 tailnet 或 LAN 连接在配对时仍被视为远程连接，需要批准。
- WS 客户端通常会在 `connect` 期间提供 `device` 身份（操作员 + 节点）。唯一不需要设备身份的操作员例外是以下显式信任路径：
  - `gateway.controlUi.allowInsecureAuth=true`，用于仅限 localhost 的不安全 HTTP 兼容模式。
  - 成功通过 `gateway.auth.mode: "trusted-proxy"` 完成操作员 Control UI 身份验证。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（紧急避险选项，会严重降低安全性）。
  - 在预留的内部辅助程序路径上，通过直接 local loopback 发起的 `gateway-client` 后端 RPC。
- 省略设备身份会影响权限范围。当显式信任路径允许无设备身份的操作员连接时，OpenClaw 仍会将其自行声明的权限范围清空，除非该路径具有明确指定的权限范围保留例外。之后，受权限范围限制的方法会失败并返回 `missing scope`。
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` 是一条用于 Control UI 紧急避险的权限范围保留路径。它不会向任意自定义后端或 CLI 形式的 WebSocket 客户端授予权限范围。
- 预留的直接 local loopback `gateway-client` 后端辅助程序路径仅为内部本地控制平面 RPC 保留权限范围；自定义后端 ID 不适用此例外。
- 所有连接都必须对服务器提供的 `connect.challenge` nonce 进行签名。

### 设备身份验证迁移诊断

对于仍使用质询前签名行为的旧版客户端，`connect` 会在 `error.details.code` 下返回 `DEVICE_AUTH_*` 详细代码，并提供稳定的 `error.details.reason`。

常见迁移失败：

| 消息                        | details.code                     | details.reason           | 含义                                              |
| --------------------------- | -------------------------------- | ------------------------ | ------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 客户端省略了 `device.nonce`（或发送了空值）。     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 客户端使用过期或错误的 nonce 进行了签名。         |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 签名载荷与 v2 载荷不匹配。                        |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 签名时间戳超出了允许的时钟偏差范围。              |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` 与公钥指纹不匹配。                    |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公钥格式或规范化失败。                            |

迁移目标：

- 始终等待 `connect.challenge`。
- 对包含服务器 nonce 的 v2 载荷进行签名。
- 在 `connect.params.device.nonce` 中发送相同的 nonce。
- 首选签名载荷为 `v3`
  （`packages/gateway-client/src/device-auth.ts` 中的 `buildDeviceAuthPayloadV3`），
  除了 device/client/role/scopes/token/nonce 字段之外，
  它还会绑定 `platform` 和 `deviceFamily`。
- 为兼容性起见，仍接受旧版 `v2` 签名，但重新连接时，已配对设备的
  元数据固定仍会控制命令策略。

## TLS 和固定

- WS 连接支持 TLS（`gateway.tls` 配置）。
- 客户端可选择通过 `gateway.remote.tlsFingerprint` 或 CLI
  `--tls-fingerprint` 固定 Gateway 网关证书指纹。

## 范围

此协议公开完整的 Gateway 网关 API：状态、渠道、模型、聊天、
智能体、会话、节点、审批等。确切接口范围由从
`packages/gateway-protocol/src/schema.ts` 重新导出的 TypeBox schema 定义。

## 相关内容

- [Bridge protocol](/zh-CN/gateway/bridge-protocol)
- [Gateway 网关运行手册](/zh-CN/gateway)

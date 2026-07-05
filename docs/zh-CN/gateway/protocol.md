---
read_when:
    - 实现或更新 Gateway 网关 WS 客户端
    - 调试协议不匹配或连接失败
    - 重新生成协议架构/模型
summary: Gateway 网关 WebSocket 协议：握手、帧、版本控制
title: Gateway 网关协议
x-i18n:
    generated_at: "2026-07-05T01:56:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed4f3faff8575be8a4d11c2a1b20421dab961391935e5adc8e9f1c9ceb5fec61
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway 网关 WS 协议是 OpenClaw 的**单一控制平面 + 节点传输协议**。所有客户端（CLI、Web UI、macOS 应用、iOS/Android 节点、无头节点）都通过 WebSocket 连接，并在握手时声明它们的**角色** + **作用域**。

## 传输协议

- WebSocket，使用带 JSON 载荷的文本帧。
- 第一帧**必须**是 `connect` 请求。
- 连接前帧上限为 64 KiB。握手成功后，客户端应遵循 `hello-ok.policy.maxPayload` 和 `hello-ok.policy.maxBufferedBytes` 限制。启用诊断后，过大的入站帧和缓慢的出站缓冲区会在 Gateway 网关关闭或丢弃受影响帧之前发出 `payload.large` 事件。这些事件会保留大小、限制、表面和安全原因代码。它们不会保留消息正文、附件内容、原始帧正文、令牌、Cookie 或秘密值。

## 握手（connect）

Gateway 网关 → 客户端（连接前挑战）：

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

客户端 → Gateway 网关：

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
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

Gateway 网关 → 客户端：

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

当 Gateway 网关仍在完成启动 sidecar 时，`connect` 请求可能返回一个可重试的 `UNAVAILABLE` 错误，其中 `details.reason` 设置为 `"startup-sidecars"`，并带有 `retryAfterMs`。客户端应在其总体连接预算内重试该响应，而不是将其显示为终止性握手失败。

`server`、`features`、`snapshot` 和 `policy` 都是 schema（`packages/gateway-protocol/src/schema/frames.ts`）要求的字段。`auth` 也是必需的，并报告协商后的角色/作用域。`pluginSurfaceUrls` 是可选字段，会将插件表面名称（例如 `canvas`）映射到带作用域的托管 URL。

带作用域的插件表面 URL 可能会过期。节点可以使用 `{ "surface": "canvas" }` 调用 `node.pluginSurface.refresh`，以在 `pluginSurfaceUrls` 中接收新的条目。实验性 Canvas 插件重构不支持已弃用的 `canvasHostUrl`、`canvasCapability` 或 `node.canvas.capability.refresh` 兼容路径；当前原生客户端和 Gateway 网关必须使用插件表面。

未签发设备令牌时，`hello-ok.auth` 会报告协商后的权限，不包含令牌字段：

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

受信任的同进程后端客户端（`client.id: "gateway-client"`、`client.mode: "backend"`）在使用共享 Gateway 网关令牌/密码进行身份验证时，可以在直接回环连接上省略 `device`。此路径仅保留给内部控制平面 RPC，并避免过时的 CLI/设备配对基线阻塞本地后端工作，例如子智能体会话更新。远程客户端、浏览器源客户端、节点客户端，以及显式设备令牌/设备身份客户端，仍使用正常的配对和作用域升级检查。

签发设备令牌时，`hello-ok` 还会包含：

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

内置 QR/设置码引导是一条新的移动端移交路径。成功的基线设置码连接会返回一个主节点令牌，以及一个有界的操作员令牌：

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

操作员移交有意设置为有界，这样 QR 新手引导可以启动移动端操作员循环，并完成原生设置，而不会授予配对变更作用域或 `operator.admin`。它包含 `operator.talk.secrets`，因此原生客户端可以读取引导后所需的 Talk 配置。更广泛的配对和管理员访问需要单独批准的操作员配对或令牌流程。客户端只有在连接使用基于受信任传输（例如 `wss://` 或回环/本地配对）的引导身份验证时，才应持久化 `hello-ok.auth.deviceTokens`。

### 节点示例

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
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

## 帧格式

- **请求**：`{type:"req", id, method, params}`
- **响应**：`{type:"res", id, ok, payload|error}`
- **事件**：`{type:"event", event, payload, seq?, stateVersion?}`

有副作用的方法需要**幂等键**（见 schema）。

## 角色 + 作用域

完整的操作员作用域模型、审批时检查和共享秘密语义，请参见[操作员作用域](/zh-CN/gateway/operator-scopes)。

### 角色

- `operator` = 控制平面客户端（CLI/UI/自动化）。
- `node` = 能力宿主（camera/screen/canvas/system.run）。

### 作用域（operator）

常见作用域：

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

带有 `includeSecrets: true` 的 `talk.config` 需要 `operator.talk.secrets`（或 `operator.admin`）。包含秘密时，客户端应从 `talk.resolved.config.apiKey` 读取当前 Talk 提供商凭证；`talk.providers.<id>.apiKey` 保持源形态，可能是 SecretRef 对象或已遮蔽的字符串。

插件注册的 Gateway 网关 RPC 方法可以请求自己的操作员作用域，但保留的核心管理员前缀（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）始终解析为 `operator.admin`。

方法作用域只是第一道门。某些通过 `chat.send` 到达的斜杠命令会在此基础上应用更严格的命令级检查。例如，持久化 `/config set` 和 `/config unset` 写入需要 `operator.admin`。

`node.pair.approve` 在基础方法作用域之上，还有额外的审批时作用域检查：

- 无命令请求：`operator.pairing`
- 带非 exec 节点命令的请求：`operator.pairing` + `operator.write`
- 包含 `system.run`、`system.run.prepare` 或 `system.which` 的请求：`operator.pairing` + `operator.admin`

### 能力/命令/权限（node）

节点在连接时声明能力主张：

- `caps`：高级能力类别，例如 `camera`、`canvas`、`screen`、`location`、`voice` 和 `talk`。
- `commands`：调用允许列表。
- `permissions`：细粒度开关（例如 `screen.record`、`camera.capture`）。

Gateway 网关将这些视为**主张**，并强制执行服务端允许列表。

## 在线状态

- `system-presence` 返回按设备身份键控的条目。
- 在线状态条目包含 `deviceId`、`roles` 和 `scopes`，因此即使同一设备同时以 **operator** 和 **node** 身份连接，UI 也可以为每台设备显示一行。
- `node.list` 包含可选的 `lastSeenAtMs` 和 `lastSeenReason` 字段。已连接节点会将其当前连接时间作为 `lastSeenAtMs` 报告，原因是 `connect`；当受信任的节点事件更新其配对元数据时，已配对节点也可以报告持久的后台在线状态。

### 节点后台存活事件

节点可以使用 `event: "node.presence.alive"` 调用 `node.event`，以记录某个已配对节点在后台唤醒期间存活，但不将其标记为已连接。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` 是封闭枚举：`background`、`silent_push`、`bg_app_refresh`、`significant_location`、`manual` 或 `connect`。未知触发器字符串会在持久化前由 Gateway 网关规范化为 `background`。该事件仅对已认证的节点设备会话持久化；无设备或未配对会话返回 `handled: false`。

成功的 Gateway 网关会返回结构化结果：

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

较旧的 Gateway 网关可能仍会为 `node.event` 返回 `{ "ok": true }`；客户端应将其视为已确认的 RPC，而不是持久在线状态已保存。

## 广播事件作用域限定

服务端推送的 WebSocket 广播事件受作用域门控，因此仅限配对作用域或仅节点会话不会被动接收会话内容。

- **聊天、智能体和工具结果帧**（包括流式传输的 `agent` 事件和工具调用结果）至少需要 `operator.read`。没有 `operator.read` 的会话会完全跳过这些帧。
- **插件定义的 `plugin.*` 广播**会根据插件注册方式，受 `operator.write` 或 `operator.admin` 门控。
- **状态和传输事件**（`heartbeat`、`presence`、`tick`、连接/断开生命周期等）保持不受限制，以便每个已认证会话都能观测传输健康状况。
- **未知广播事件族**默认受作用域门控（失败关闭），除非已注册处理器明确放宽限制。

每个客户端连接都会保留自己的按客户端序列号，因此即使不同客户端看到事件流中不同的作用域过滤子集，广播也会在该 socket 上保持单调顺序。

## 常见 RPC 方法族

公开 WS 表面比上面的握手/身份验证示例更广。这不是生成的转储，`hello-ok.features.methods` 是一个保守的发现列表，由 `src/gateway/server-methods-list.ts` 加上已加载的插件/渠道方法导出构建。请将其视为功能发现，而不是 `src/gateway/server-methods/*.ts` 的完整枚举。

  <AccordionGroup>
  <Accordion title="系统和身份">
    - `health` 返回缓存的或新探测的 Gateway 网关健康快照。
    - `diagnostics.stability` 返回最近的有界诊断稳定性记录器。它保留事件名称、计数、字节大小、内存读数、队列/会话状态、渠道/插件名称和会话 ID 等运行元数据。它不保留聊天文本、webhook 正文、工具输出、原始请求或响应正文、令牌、cookie 或机密值。需要 `operator.read` 读取作用域。
    - `status` 返回 `/status` 风格的 Gateway 网关摘要；敏感字段仅对具有管理员作用域的操作员客户端包含。
    - `gateway.identity.get` 返回中继和配对流程使用的 Gateway 网关设备身份。
    - `system-presence` 返回已连接操作员/节点设备的当前在线状态快照。
    - `system-event` 追加系统事件，并可更新/广播在线状态上下文。
    - `last-heartbeat` 返回最新持久化的 Heartbeat 事件。
    - `set-heartbeats` 在 Gateway 网关上切换 Heartbeat 处理。

  </Accordion>

  <Accordion title="模型和用量">
    - `models.list` 返回运行时允许的模型目录。传入 `{ "view": "configured" }` 可获取适合选择器大小的已配置模型（先是 `agents.defaults.models`，然后是 `models.providers.*.models`），或传入 `{ "view": "all" }` 可获取完整目录。
    - `usage.status` 返回提供商用量窗口/剩余额度摘要。
    - `usage.cost` 返回某个日期范围的聚合成本用量摘要。
      传入 `agentId` 可查看一个智能体，或传入 `agentScope: "all"` 可聚合已配置的智能体。
    - `doctor.memory.status` 返回当前默认 Agent 工作区的向量记忆/缓存嵌入就绪状态。仅当调用方明确想要实时 ping 嵌入提供商时，才传入 `{ "probe": true }` 或 `{ "deep": true }`。感知 Dreaming 的客户端也可以传入 `{ "agentId": "agent-id" }`，将 Dreaming 存储统计限定到选定的 Agent 工作区；省略 `agentId` 会保留默认 Agent 回退，并聚合已配置的 Dreaming 工作区。
    - `doctor.memory.dreamDiary`、`doctor.memory.backfillDreamDiary`、`doctor.memory.resetDreamDiary`、`doctor.memory.resetGroundedShortTerm`、`doctor.memory.repairDreamingArtifacts` 和 `doctor.memory.dedupeDreamDiary` 接受可选的 `{ "agentId": "agent-id" }` 参数，用于选定 Agent 的 Dreaming 视图/操作。省略 `agentId` 时，它们会在已配置的默认 Agent 工作区上运行。
    - `doctor.memory.remHarness` 为远程控制平面客户端返回有界的只读 REM harness 预览。它可以包含工作区路径、记忆片段、渲染后的 grounded markdown 和深度提升候选项，因此调用方需要 `operator.read`。
    - `sessions.usage` 返回每会话用量摘要。传入 `agentId` 可查看一个
      智能体，或传入 `agentScope: "all"` 可一起列出已配置的智能体。
    - `sessions.usage.timeseries` 返回一个会话的时间序列用量。
    - `sessions.usage.logs` 返回一个会话的用量日志条目。

  </Accordion>

  <Accordion title="渠道和登录辅助">
    - `channels.status` 返回内置 + 捆绑渠道/插件状态摘要。
    - `channels.logout` 在渠道支持注销时，注销指定渠道/账号。
    - `web.login.start` 为当前支持二维码的 Web 渠道提供商启动二维码/Web 登录流程。
    - `web.login.wait` 等待该二维码/Web 登录流程完成，并在成功时启动渠道。
    - `push.test` 向已注册的 iOS 节点发送测试 APNs 推送。
    - `voicewake.get` 返回已存储的唤醒词触发器。
    - `voicewake.set` 更新唤醒词触发器并广播更改。

  </Accordion>

  <Accordion title="消息和日志">
    - `send` 是直接出站投递 RPC，用于聊天运行器之外面向渠道/账号/线程的发送。
    - `logs.tail` 返回已配置的 Gateway 网关文件日志尾部，并带有游标/限制和最大字节控制。

  </Accordion>

  <Accordion title="操作员终端">
    - `terminal.open` 为显式 `agentId` 或默认 Agent 启动主机 PTY，并返回解析后的 Agent、工作目录、shell 和限制状态。
    - `terminal.input`、`terminal.resize` 和 `terminal.close` 仅作用于调用连接拥有的会话。
    - `terminal.data` 和 `terminal.exit` 事件只流式发送到拥有该会话的连接。
    - 连接断开的会话会被分离，而不是被终止：它们会在 `gateway.terminal.detachedSessionTimeoutSeconds`（默认 300；`0` 会恢复为断开即终止）期间保持可重新附加，同时最近输出会累积在有界的服务器端缓冲区中。
    - `terminal.list` 返回可附加的会话；`terminal.attach` 将实时或已分离的会话重新绑定到调用连接，并返回重放缓冲区（类似 tmux 的接管方式——之前的实时拥有者会收到原因是 `detached` 的 `terminal.exit`）；`terminal.text` 不附加会话，直接以纯文本读取缓冲区。
    - 每个终端方法都需要 `operator.admin`；`gateway.terminal.enabled` 必须显式为 true。完全沙箱隔离的 Agent 会被拒绝，并且 Agent 策略变更会关闭现有和进行中的 PTY，包括已分离的 PTY。

  </Accordion>

  <Accordion title="Talk 和 TTS">
    - `talk.catalog` 返回只读 Talk 提供商目录，涵盖语音、流式转录和实时语音。它包含规范提供商 ID、注册表别名、标签、已配置状态、可选的组级 `ready` 结果、公开的模型/语音 ID、规范模式、传输协议、脑策略，以及实时音频/能力标志，同时不返回提供商机密，也不改变全局配置。当前 Gateway 网关会在应用运行时提供商选择后设置 `ready`；为了兼容较旧的 Gateway 网关，客户端应将缺少该字段视为未验证。
    - `talk.config` 返回生效的 Talk 配置载荷；`includeSecrets` 需要 `operator.talk.secrets`（或 `operator.admin`）。
    - `talk.session.create` 为 `realtime/gateway-relay`、`transcription/gateway-relay` 或 `stt-tts/managed-room` 创建由 Gateway 网关拥有的 Talk 会话。对于 `stt-tts/managed-room`，传入 `sessionKey` 的 `operator.write` 调用方还必须传入 `spawnedBy`，以实现有作用域的会话键可见性；无作用域的 `sessionKey` 创建和 `brain: "direct-tools"` 需要 `operator.admin`。
    - `talk.session.join` 验证 managed-room 会话令牌，按需发出 `session.ready` 或 `session.replaced` 事件，并返回房间/会话元数据以及最近的 Talk 事件，但不返回明文令牌或已存储的令牌哈希。
    - `talk.session.appendAudio` 向 Gateway 网关拥有的实时中继和转录会话追加 base64 PCM 输入音频。
    - `talk.session.startTurn`、`talk.session.endTurn` 和 `talk.session.cancelTurn` 驱动 managed-room 轮次生命周期，并在清除状态前拒绝过期轮次。
    - `talk.session.cancelOutput` 停止助手音频输出，主要用于 Gateway 网关中继会话中由 VAD 门控的打断。
    - `talk.session.submitToolResult` 完成由 Gateway 网关拥有的实时中继会话发出的提供商工具调用。当最终结果稍后会跟随时，传入 `options: { willContinue: true }` 作为中间工具输出；当工具结果应满足提供商调用而不启动另一条实时助手响应时，传入 `options: { suppressResponse: true }`。
    - `talk.session.steer` 将活动运行的语音控制发送到由 Gateway 网关拥有、Agent 支持的 Talk 会话。它接受 `{ sessionId, text, mode? }`，其中 `mode` 为 `status`、`steer`、`cancel` 或 `followup`；省略模式时，会根据语音文本分类。
    - `talk.session.close` 关闭由 Gateway 网关拥有的中继、转录或 managed-room 会话，并发出终端 Talk 事件。
    - `talk.mode` 为 WebChat/Control UI 客户端设置/广播当前 Talk 模式状态。
    - `talk.client.create` 使用 `webrtc` 或 `provider-websocket` 创建客户端拥有的实时提供商会话，同时 Gateway 网关拥有配置、凭证、指令和工具策略。
    - `talk.client.toolCall` 允许客户端拥有的实时传输协议将提供商工具调用转发给 Gateway 网关策略。第一个受支持的工具是 `openclaw_agent_consult`；客户端会收到运行 ID，并等待正常聊天生命周期事件后再提交提供商特定的工具结果。
    - `talk.client.steer` 为客户端拥有的实时传输协议发送活动运行语音控制。Gateway 网关会从 `sessionKey` 解析活动的嵌入式运行，并返回结构化的已接受/已拒绝结果，而不是静默丢弃 Steer。
    - `talk.event` 是实时、转录、STT/TTS、managed-room、电话和会议适配器的单一 Talk 事件渠道。
    - `talk.speak` 通过活动 Talk 语音提供商合成语音。
    - `tts.status` 返回 TTS 启用状态、活动提供商、回退提供商和提供商配置状态。
    - `tts.providers` 返回可见的 TTS 提供商清单。
    - `tts.enable` 和 `tts.disable` 切换 TTS 偏好设置状态。
    - `tts.setProvider` 更新首选 TTS 提供商。
    - `tts.convert` 运行一次性文本转语音转换。

  </Accordion>

  <Accordion title="密钥、配置、更新和向导">
    - `secrets.reload` 会重新解析活动 SecretRefs，并且仅在完全成功时替换运行时密钥状态。
    - `secrets.resolve` 会解析特定命令/目标集的命令目标密钥赋值。
    - `config.get` 返回当前配置快照和哈希。
    - `config.set` 写入已验证的配置载荷。
    - `config.patch` 合并部分配置更新。破坏性的数组
      替换要求受影响路径位于 `replacePaths` 中；数组条目下的嵌套数组
      使用 `[]` 路径，例如 `agents.list[].skills`。
    - `config.apply` 验证并替换完整配置载荷。
    - `config.schema` 返回 Control UI 和 CLI 工具使用的实时配置 schema 载荷：schema、`uiHints`、版本和生成元数据；当运行时可以加载时，还包括插件 + 渠道 schema 元数据。该 schema 包含从 UI 使用的相同标签和帮助文本派生的字段 `title` / `description` 元数据；当存在匹配的字段文档时，也包括嵌套对象、通配符、数组项以及 `anyOf` / `oneOf` / `allOf` 组合分支。
    - `config.schema.lookup` 返回一个配置路径的路径限定查询载荷：规范化路径、浅层 schema 节点、匹配的提示 + `hintPath`、可选 `reloadKind`，以及供 UI/CLI 下钻使用的直接子项摘要。`reloadKind` 是 `restart`、`hot` 或 `none` 之一，并镜像请求路径的 Gateway 网关配置重新加载规划器。查询 schema 节点会保留面向用户的文档和常见验证字段（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、数字/字符串/数组/对象边界，以及 `additionalProperties`、`deprecated`、`readOnly`、`writeOnly` 等标志）。子项摘要公开 `key`、规范化的 `path`、`type`、`required`、`hasChildren`、可选 `reloadKind`，以及匹配的 `hint` / `hintPath`。
    - `update.run` 运行 Gateway 网关更新流程，并且仅在更新本身成功时安排重启；带有会话的调用方可以包含 `continuationMessage`，以便启动时通过重启 continuation 队列恢复一个后续智能体轮次。来自控制平面的包管理器更新和受监督的 git-checkout 更新会使用分离的托管服务交接，而不是在实时 Gateway 网关内替换包树或更改 checkout/build 输出。已启动的交接会返回 `ok: true`，并带有 `result.reason: "managed-service-handoff-started"` 和 `handoff.status: "started"`；不可用或失败的交接会返回 `ok: false`，并带有 `managed-service-handoff-unavailable` 或 `managed-service-handoff-failed`，当需要手动 shell 更新时还会包含 `handoff.command`。不可用的交接表示 OpenClaw 缺少安全的 supervisor 边界或持久服务身份，例如 systemd 的 `OPENCLAW_SYSTEMD_UNIT`。在已启动的交接期间，重启 sentinel 可能会短暂报告 `stats.reason: "restart-health-pending"`；continuation 会延迟到 CLI 验证已重启的 Gateway 网关并写入最终 `ok` sentinel 之后。
    - `update.status` 刷新并返回最新的更新重启 sentinel，包括可用时的重启后运行版本。
    - `wizard.start`、`wizard.next`、`wizard.status` 和 `wizard.cancel` 通过 WS RPC 暴露新手引导向导。

  </Accordion>

  <Accordion title="智能体和工作区辅助方法">
    - `agents.list` 返回已配置的智能体条目，包括有效模型和运行时元数据。
    - `agents.create`、`agents.update` 和 `agents.delete` 管理智能体记录和工作区接线。
    - `agents.files.list`、`agents.files.get` 和 `agents.files.set` 管理为智能体暴露的引导工作区文件。
    - `tasks.list`、`tasks.get` 和 `tasks.cancel` 向 SDK 和 operator 客户端暴露 Gateway 网关任务账本。
    - `artifacts.list`、`artifacts.get` 和 `artifacts.download` 为显式 `sessionKey`、`runId` 或 `taskId` 作用域暴露从 transcript 派生的 artifact 摘要和下载。运行和任务查询会在服务端解析所属会话，并且只返回 provenance 匹配的 transcript 媒体；不安全或本地 URL 来源会返回不支持的下载，而不是在服务端获取。
    - `environments.list` 和 `environments.status` 向 SDK 客户端暴露只读的 Gateway 网关本地和节点环境发现。
    - `agent.identity.get` 返回智能体或会话的有效 assistant 身份。
    - `agent.wait` 等待运行完成，并在可用时返回终端快照。

  </Accordion>

  <Accordion title="会话控制">
    - `sessions.list` 返回当前会话索引；当配置了智能体运行时后端时，包括每行 `agentRuntime` 元数据。
    - `sessions.subscribe` 和 `sessions.unsubscribe` 为当前 WS 客户端切换会话变更事件订阅。
    - `sessions.messages.subscribe` 和 `sessions.messages.unsubscribe` 为一个会话切换 transcript/消息事件订阅。
    - `sessions.preview` 返回特定会话键的有界 transcript 预览。
    - `sessions.describe` 返回精确会话键的一行 Gateway 网关会话。
    - `sessions.resolve` 解析或规范化会话目标。
    - `sessions.create` 创建新的会话条目。
    - `sessions.send` 向现有会话发送消息。
    - `sessions.steer` 是活动会话的中断并 Steer 变体。
    - `sessions.abort` 中止会话的活动工作。调用方可以传入 `key` 加可选 `runId`，也可以只传入 `runId`，用于 Gateway 网关可解析到会话的活动运行。
    - `sessions.patch` 更新会话元数据/覆盖项，并报告已解析的规范模型以及有效 `agentRuntime`。
    - `sessions.reset`、`sessions.delete` 和 `sessions.compact` 执行会话维护。
    - `sessions.get` 返回完整的已存储会话行。
    - 聊天执行仍然使用 `chat.history`、`chat.send`、`chat.abort` 和 `chat.inject`。`chat.history` 会为 UI 客户端做显示规范化：从可见文本中剥离内联指令标签，剥离纯文本工具调用 XML 载荷（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块）和泄漏的 ASCII/全角模型控制 token，省略纯静默 token assistant 行，例如精确的 `NO_REPLY` / `no_reply`，并且可用占位符替换过大的行。
    - `chat.message.get` 是增量添加的、有界的单条可见 transcript 条目完整消息读取器。客户端传入 `sessionKey`、会话选择限定到智能体时的可选 `agentId`，以及先前通过 `chat.history` 暴露的 transcript `messageId`；当已存储条目仍可用且未过大时，Gateway 网关返回相同的显示规范化投影，但没有轻量 history 截断上限。
    - `chat.send` 接受单轮 `fastMode: "auto"`，用于让自动截止时间之前启动的模型调用使用 fast mode，然后让后续重试、fallback、工具结果或 continuation 调用不使用 fast mode。截止时间默认是 60 秒，并且可以按模型用 `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` 配置。`chat.send` 调用方可以传入单轮 `fastAutoOnSeconds`，以覆盖该请求的截止时间。

  </Accordion>

  <Accordion title="设备配对和设备 token">
    - `device.pair.list` 返回待处理和已批准的已配对设备。
    - `device.pair.setupCode` 创建移动端设置代码，并默认创建 PNG QR 数据 URL。它需要 `operator.admin`，并且有意从已通告发现中省略。结果包括 `setupCode`、可选 `qrDataUrl`、`gatewayUrl`、非密钥 `auth` 标签和 `urlSource`。
    - `device.pair.approve`、`device.pair.reject` 和 `device.pair.remove` 管理设备配对记录。
    - `device.token.rotate` 在已批准角色和调用方作用域边界内轮换已配对设备 token。
    - `device.token.revoke` 在已批准角色和调用方作用域边界内吊销已配对设备 token。

    设置代码会嵌入短生命周期的引导凭证。客户端不得
    在配对流程之外记录或持久化它。

  </Accordion>

  <Accordion title="节点配对、调用和待处理工作">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove` 和 `node.pair.verify` 覆盖节点配对和引导验证。
    - `node.list` 和 `node.describe` 返回已知/已连接节点状态。
    - `node.rename` 更新已配对节点标签。
    - `node.invoke` 将命令转发到已连接节点。
    - `node.invoke.result` 返回调用请求的结果。
    - `node.event` 将节点发起的事件带回 Gateway 网关。
    - `node.pending.pull` 和 `node.pending.ack` 是已连接节点队列 API。
    - `node.pending.enqueue` 和 `node.pending.drain` 管理离线/断开连接节点的持久待处理工作。

  </Accordion>

  <Accordion title="审批族">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list` 和 `exec.approval.resolve` 覆盖一次性 exec 审批请求以及待处理审批查询/重放。
    - `exec.approval.waitDecision` 等待一个待处理 exec 审批，并返回最终决定（超时时返回 `null`）。
    - `exec.approvals.get` 和 `exec.approvals.set` 管理 Gateway 网关 exec 审批策略快照。
    - `exec.approvals.node.get` 和 `exec.approvals.node.set` 通过节点 relay 命令管理节点本地 exec 审批策略。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision` 和 `plugin.approval.resolve` 覆盖插件定义的审批流程。

  </Accordion>

  <Accordion title="自动化、Skills 和工具">
    - 自动化：`wake` 安排立即或下一次 heartbeat 的唤醒文本注入；`cron.get`、`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` 管理定时工作。
    - `cron.run` 仍然是用于手动运行的入队式 RPC。需要完成语义的客户端应读取返回的 `runId` 并轮询 `cron.runs`。
    - `cron.runs` 接受可选的非空 `runId` 过滤器，以便客户端跟随一个已排队的手动运行，而不与同一作业的其他历史条目竞争。
    - Skills 和工具：`commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。

  </Accordion>
</AccordionGroup>

### 常见事件族

- `chat`：UI 聊天更新，例如 `chat.inject` 和其他仅 transcript 的聊天
  事件。在协议 v4 中，delta 载荷携带 `deltaText`；`message` 保持为
  累积 assistant 快照。非前缀替换会设置 `replace=true`
  并使用 `deltaText` 作为替换文本。
- `session.message`、`session.operation` 和 `session.tool`：已订阅
  会话的 transcript、进行中的会话 operation 以及事件流更新。
- `sessions.changed`：会话索引或元数据已更改。
- `presence`：系统 presence 快照更新。
- `tick`：周期性 keepalive / liveness 事件。
- `health`：Gateway 网关健康快照更新。
- `heartbeat`：heartbeat 事件流更新。
- `cron`：cron 运行/作业变更事件。
- `shutdown`：Gateway 网关关闭通知。
- `node.pair.requested` / `node.pair.resolved`：节点配对生命周期。
- `node.invoke.request`：节点调用请求广播。
- `device.pair.requested` / `device.pair.resolved`：已配对设备生命周期。
- `voicewake.changed`：唤醒词触发器配置已更改。
- `exec.approval.requested` / `exec.approval.resolved`：exec 审批
  生命周期。
- `plugin.approval.requested` / `plugin.approval.resolved`：插件审批
  生命周期。

### 节点辅助方法

- 节点可以调用 `skills.bins`，以获取当前技能可执行文件列表
  用于自动允许检查。

### 任务账本 RPC

操作员客户端可以通过任务账本 RPC 检查并取消 Gateway 网关后台任务记录。这些方法返回净化后的任务摘要，而不是原始运行时状态。

- `tasks.list` 需要 `operator.read`。
  - 参数：可选的 `status`（`"queued"`、`"running"`、`"completed"`、`"failed"`、`"cancelled"` 或 `"timed_out"`）或这些状态组成的数组，可选的 `agentId`，可选的 `sessionKey`，可选的 `limit`（从 `1` 到 `500`），以及可选字符串 `cursor`。
  - 结果：`{ "tasks": TaskSummary[], "nextCursor"?: string }`。
- `tasks.get` 需要 `operator.read`。
  - 参数：`{ "taskId": string }`。
  - 结果：`{ "task": TaskSummary }`。
  - 缺失的任务 ID 会返回 Gateway 网关 not-found 错误形状。
- `tasks.cancel` 需要 `operator.write`。
  - 参数：`{ "taskId": string, "reason"?: string }`。
  - 结果：
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`。
  - `found` 表示账本中是否有匹配任务。`cancelled` 表示运行时是否接受或记录了取消操作。

`TaskSummary` 包含 `id`、`status`，以及可选元数据，例如 `kind`、`runtime`、`title`、`agentId`、`sessionKey`、`childSessionKey`、`ownerKey`、`runId`、`taskId`、`flowId`、`parentTaskId`、`sourceId`、时间戳、进度、终止摘要，以及净化后的错误文本。`agentId` 标识执行任务的智能体；`sessionKey` 和 `ownerKey` 保留请求方和控制上下文。

### 操作员辅助方法

- 操作员可以调用 `commands.list`（`operator.read`）来获取某个智能体的运行时命令清单。
  - `agentId` 是可选的；省略它即可读取默认 Agent 工作区。
  - `scope` 控制主 `name` 面向哪个表面：
    - `text` 返回不带前导 `/` 的主文本命令令牌
    - `native` 和默认的 `both` 路径会在可用时返回感知提供商的原生命令名称
  - `textAliases` 携带精确的斜杠别名，例如 `/model` 和 `/m`。
  - `nativeName` 在存在时携带感知提供商的原生命令名称。
  - `provider` 是可选的，并且只影响原生命名以及原生插件命令可用性。
  - `includeArgs=false` 会从响应中省略序列化的参数元数据。
- 操作员可以调用 `tools.catalog`（`operator.read`）来获取某个智能体的运行时工具目录。响应包含分组后的工具和来源元数据：
  - `source`：`core` 或 `plugin`
  - `pluginId`：当 `source="plugin"` 时的插件所有者
  - `optional`：插件工具是否为可选
- 操作员可以调用 `tools.effective`（`operator.read`）来获取某个会话的运行时生效工具清单。
  - `sessionKey` 是必需的。
  - Gateway 网关会在服务端从会话中派生可信运行时上下文，而不是接受调用方提供的凭证或投递上下文。
  - 响应是服务端派生的、限定于会话范围的活跃清单投影，包括核心、插件、渠道以及已发现的 MCP 服务器工具。
  - 对于 MCP，`tools.effective` 是只读的：它可以将已预热会话的 MCP 目录通过最终工具策略进行投影，但不会创建 MCP 运行时、连接传输协议或发出 `tools/list`。如果不存在匹配的已预热目录，响应可能包含诸如 `mcp-not-yet-connected`、`mcp-not-yet-listed` 或 `mcp-stale-catalog` 的通知。
  - 生效工具条目使用 `source="core"`、`source="plugin"`、`source="channel"` 或 `source="mcp"`。
- 操作员可以调用 `tools.invoke`（`operator.write`），通过与 `/tools/invoke` 相同的 Gateway 网关策略路径调用一个可用工具。
  - `name` 是必需的。`args`、`sessionKey`、`agentId`、`confirm` 和 `idempotencyKey` 是可选的。
  - 如果同时存在 `sessionKey` 和 `agentId`，解析出的会话智能体必须匹配 `agentId`。
  - 仅限所有者的核心包装器，例如 `cron`、`gateway` 和 `nodes`，需要所有者/管理员身份（`operator.admin`），即使 `tools.invoke` 方法本身是 `operator.write`。
  - 响应是面向 SDK 的信封，包含 `ok`、`toolName`、可选的 `output`，以及带类型的 `error` 字段。审批或策略拒绝会在载荷中返回 `ok:false`，而不是绕过 Gateway 网关工具策略管线。
- 操作员可以调用 `skills.status`（`operator.read`）来获取某个智能体的可见 Skills 清单。
  - `agentId` 是可选的；省略它即可读取默认 Agent 工作区。
  - 响应包含资格、缺失要求、配置检查，以及净化后的安装选项，而不会暴露原始密钥值。
- 操作员可以调用 `skills.search` 和 `skills.detail`（`operator.read`）获取 ClawHub 发现元数据。
- 操作员可以调用 `skills.upload.begin`、`skills.upload.chunk` 和 `skills.upload.commit`（`operator.admin`）在安装前暂存私有技能归档。这是面向可信客户端的独立管理员上传路径，不是正常的 ClawHub 技能安装流程，并且默认禁用，除非启用了 `skills.install.allowUploadedArchives`。
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })` 会创建绑定到该 slug 和 force 值的上传。
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` 会在精确解码偏移处追加字节。
  - `skills.upload.commit({ uploadId, sha256? })` 会验证最终大小和 SHA-256。提交只会完成上传；它不会安装技能。
  - 上传的技能归档是包含 `SKILL.md` 根文件的 zip 归档。归档内部的目录名称绝不会选择安装目标。
- 操作员可以用三种模式调用 `skills.install`（`operator.admin`）：
  - ClawHub 模式：`{ source: "clawhub", slug, version?, force? }` 会把技能文件夹安装到默认 Agent 工作区的 `skills/` 目录。
  - 上传模式：`{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }` 会把已提交的上传安装到默认 Agent 工作区的 `skills/<slug>` 目录。slug 和 force 值必须匹配原始 `skills.upload.begin` 请求。除非启用了 `skills.install.allowUploadedArchives`，否则此模式会被拒绝。该设置不影响 ClawHub 安装。
  - Gateway 网关安装器模式：`{ name, installId, timeoutMs? }`
    会在 Gateway 网关主机上运行声明的 `metadata.openclaw.install` 操作。旧版客户端可能仍会发送 `dangerouslyForceUnsafeInstall`；此字段已弃用，仅为协议兼容性而接受，并且会被忽略。请使用 `security.installPolicy` 处理操作员拥有的安装决策。
- 操作员可以用两种模式调用 `skills.update`（`operator.admin`）：
  - ClawHub 模式会更新默认 Agent 工作区中的一个已跟踪 slug，或所有已跟踪的 ClawHub 安装。
  - 配置模式会修补 `skills.entries.<skillKey>` 值，例如 `enabled`、`apiKey` 和 `env`。

### `models.list` 视图

`models.list` 接受可选的 `view` 参数：

- 省略或 `"default"`：当前运行时行为。如果配置了 `agents.defaults.models`，响应就是允许的目录，包括针对 `provider/*` 条目动态发现的模型。否则响应是完整的 Gateway 网关目录。
- `"configured"`：适合选择器大小的行为。如果配置了 `agents.defaults.models`，它仍会优先，包括针对 `provider/*` 条目的提供商范围发现。没有允许列表时，响应使用显式的 `models.providers.*.models` 条目，仅当不存在已配置的模型行时才回退到完整目录。
- `"all"`：完整的 Gateway 网关目录，绕过 `agents.defaults.models`。请将其用于诊断和发现 UI，而不是普通模型选择器。

## Exec 审批

- 当 exec 请求需要审批时，Gateway 网关会广播 `exec.approval.requested`。
- 操作员客户端通过调用 `exec.approval.resolve` 进行处理（需要 `operator.approvals` 范围）。
- 对于 `host=node`，`exec.approval.request` 必须包含 `systemRunPlan`（规范的 `argv`/`cwd`/`rawCommand`/会话元数据）。缺少 `systemRunPlan` 的请求会被拒绝。
- 审批后，转发的 `node.invoke system.run` 调用会复用该规范 `systemRunPlan` 作为权威的命令/cwd/会话上下文。
- 如果调用方在准备和最终获批的 `system.run` 转发之间改变了 `command`、`rawCommand`、`cwd`、`agentId` 或 `sessionKey`，Gateway 网关会拒绝运行，而不是信任被改变的载荷。

## 智能体投递回退

- `agent` 请求可以包含 `deliver=true`，以请求出站投递。
- `bestEffortDeliver=false` 保持严格行为：无法解析或仅限内部的投递目标会返回 `INVALID_REQUEST`。
- `bestEffortDeliver=true` 允许在无法解析到外部可投递路由时回退为仅会话执行（例如内部/webchat 会话或存在歧义的多渠道配置）。
- 请求投递时，最终 `agent` 结果可能包含 `result.deliveryStatus`，使用与 [`openclaw agent --json --deliver`](/zh-CN/cli/agent#json-delivery-status) 记录的相同 `sent`、`suppressed`、`partial_failed` 和 `failed` 状态。

## 版本控制

- `PROTOCOL_VERSION` 位于 `packages/gateway-protocol/src/version.ts`。
- 客户端发送 `minProtocol` + `maxProtocol`；服务器会拒绝不包含其当前协议的范围。当前客户端和服务器需要协议 v4。
- 架构 + 模型从 TypeBox 定义生成：
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### 客户端常量

`src/gateway/client.ts` 中的参考客户端使用这些默认值。这些值在协议 v4 中保持稳定，并且是第三方客户端的预期基线。

| 常量                                      | 默认值                                                | 来源                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| 请求超时（每个 RPC）                      | `30_000` ms                                           | `src/gateway/client.ts`（`requestTimeoutMs`）                                              |
| 预认证 / 连接挑战超时                     | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts`（配置/环境可以提高配对的服务器/客户端预算）            |
| 初始重连退避                              | `1_000` ms                                            | `src/gateway/client.ts`（`backoffMs`）                                                     |
| 最大重连退避                              | `30_000` ms                                           | `src/gateway/client.ts`（`scheduleReconnect`）                                             |
| 设备令牌关闭后的快速重试限制              | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` 前的强制停止宽限期          | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` 默认超时                  | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| 默认 tick 间隔（`hello-ok` 之前）         | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Tick 超时关闭                             | 静默超过 `tickIntervalMs * 2` 时为 code `4000`        | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024`（25 MB）                           | `src/gateway/server-constants.ts`                                                          |

服务器会在 `hello-ok` 中通告有效的 `policy.tickIntervalMs`、`policy.maxPayload`
和 `policy.maxBufferedBytes`；客户端应遵循这些值，而不是握手前的默认值。

## 认证

- 共享密钥 Gateway 网关认证使用 `connect.params.auth.token` 或
  `connect.params.auth.password`，具体取决于配置的认证模式。
- 带身份的模式（例如 Tailscale Serve
  （`gateway.auth.allowTailscale: true`）或非 loopback 的
  `gateway.auth.mode: "trusted-proxy"`）会从请求标头满足连接认证检查，
  而不是使用 `connect.params.auth.*`。
- 私有入口 `gateway.auth.mode: "none"` 会完全跳过共享密钥连接认证；
  不要在公共/不受信任的入口上暴露该模式。
- 配对后，Gateway 网关会签发一个限定在连接角色 + 作用域内的**设备令牌**。
  它会在 `hello-ok.auth.deviceToken` 中返回，客户端应持久化它以供未来连接使用。
- 客户端应在任何成功连接后持久化主要的 `hello-ok.auth.deviceToken`。
- 使用该**已存储**设备令牌重连时，也应复用为该令牌存储的已批准作用域集合。
  这会保留已经授予的读取/探测/状态访问权限，并避免静默地将重连收窄为
  隐式的仅管理员作用域。
- 客户端连接认证组装（`src/gateway/client.ts` 中的 `selectConnectAuth`）：
  - `auth.password` 是正交的，设置后始终会转发。
  - `auth.token` 按优先级填充：先使用显式共享令牌，
    然后是显式 `deviceToken`，再然后是已存储的按设备令牌（按
    `deviceId` + `role` 作为键）。
  - 只有当上述内容都没有解析出 `auth.token` 时，才会发送
    `auth.bootstrapToken`。共享令牌或任何已解析的设备令牌都会抑制它。
  - 在一次性的 `AUTH_TOKEN_MISMATCH` 重试中自动提升已存储设备令牌，
    仅限于**可信端点**：loopback，或带有固定 `tlsFingerprint` 的 `wss://`。
    未固定的公共 `wss://` 不符合条件。
- 内置设置码引导会返回主节点 `hello-ok.auth.deviceToken`，并在
  `hello-ok.auth.deviceTokens` 中返回一个有界的操作者令牌，用于可信移动端交接。
  该操作者令牌包含用于原生 Talk 配置读取的 `operator.talk.secrets`，
  但不包含配对变更作用域和 `operator.admin`。
- 当非基线设置码引导正在等待批准时，`PAIRING_REQUIRED`
  详情会包含 `recommendedNextStep: "wait_then_retry"`、`retryable: true`
  和 `pauseReconnect: false`。客户端应继续使用同一个引导令牌重连，
  直到请求获得批准或令牌失效。
- 仅当连接在可信传输（例如 `wss://` 或 loopback/本地配对）上使用引导认证时，
  才持久化 `hello-ok.auth.deviceTokens`。
- 如果客户端提供了**显式** `deviceToken` 或显式 `scopes`，
  该调用方请求的作用域集合仍然是权威来源；只有当客户端复用已存储的按设备令牌时，
  才会复用缓存的作用域。
- 设备令牌可以通过 `device.token.rotate` 和 `device.token.revoke` 轮换/撤销
  （需要 `operator.pairing` 作用域）。轮换或撤销节点或其他非操作者角色
  还需要 `operator.admin`。
- `device.token.rotate` 返回轮换元数据。它只会为已使用该设备令牌认证的同设备调用
  回显替换后的 bearer 令牌，因此仅令牌客户端可以在重连前持久化替换令牌。
  共享/管理员轮换不会回显 bearer 令牌。
- 令牌签发、轮换和撤销都限定在该设备配对条目中记录的已批准角色集合内；
  令牌变更不能扩展或指向配对批准从未授予的设备角色。
- 对于已配对设备的令牌会话，除非调用方还拥有 `operator.admin`，
  否则设备管理是自限定的：非管理员调用方只能管理其**自己**设备条目的操作者令牌。
  节点和其他非操作者令牌管理仅限管理员，即使目标是调用方自己的设备。
- `device.token.rotate` 和 `device.token.revoke` 还会将目标操作者令牌作用域集合
  与调用方当前会话作用域进行检查。非管理员调用方不能轮换或撤销比自己已持有范围更广的操作者令牌。
- 认证失败包含 `error.details.code` 以及恢复提示：
  - `error.details.canRetryWithDeviceToken`（boolean）
  - `error.details.recommendedNextStep`（`retry_with_device_token`、`update_auth_configuration`、`update_auth_credentials`、`wait_then_retry`、`review_auth_configuration`）
- `AUTH_TOKEN_MISMATCH` 的客户端行为：
  - 可信客户端可以尝试一次有界重试，使用缓存的按设备令牌。
  - 如果该重试失败，客户端应停止自动重连循环，并显示操作者操作指引。
- `AUTH_SCOPE_MISMATCH` 表示设备令牌已被识别，但不覆盖请求的角色/作用域。
  客户端不应将其呈现为错误令牌；应提示操作者重新配对或批准更窄/更宽的作用域契约。

## 设备身份 + 配对

- 节点应包含从密钥对指纹派生的稳定设备身份（`device.id`）。
- Gateway 网关按设备 + 角色签发令牌。
- 新设备 ID 需要配对批准，除非启用了本地自动批准。
- 配对自动批准以直接 local loopback 连接为中心。
- OpenClaw 还有一条狭窄的后端/容器本地自连接路径，用于可信共享密钥辅助流程。
- 同主机 tailnet 或 LAN 连接仍会被视为远程配对，并且需要批准。
- WS 客户端通常会在 `connect` 期间包含 `device` 身份（操作者 + 节点）。
  唯一的无设备操作者例外是显式信任路径：
  - `gateway.controlUi.allowInsecureAuth=true`，用于仅 localhost 的不安全 HTTP 兼容性。
  - 成功的 `gateway.auth.mode: "trusted-proxy"` 操作者 Control UI 认证。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（破窗式应急，严重安全降级）。
  - 保留内部辅助路径上的 direct-loopback `gateway-client` 后端 RPC。
- 省略设备身份会影响作用域。当无设备操作者连接通过显式信任路径被允许时，
  OpenClaw 仍会将自声明作用域清空为空集合，除非该路径具有具名的作用域保留例外。
  受作用域保护的方法随后会以 `missing scope` 失败。
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` 是 Control UI 的破窗式
  作用域保留路径。它不会向任意自定义后端或 CLI 形态的 WebSocket 客户端授予作用域。
- 保留的 direct-loopback `gateway-client` 后端辅助路径仅为内部本地控制平面 RPC
  保留作用域；自定义后端 ID 不会获得此例外。
- 所有连接都必须签署服务器提供的 `connect.challenge` nonce。

### 设备认证迁移诊断

对于仍使用挑战前签名行为的旧版客户端，`connect` 现在会在 `error.details.code`
下返回 `DEVICE_AUTH_*` 详情代码，并带有稳定的 `error.details.reason`。

常见迁移失败：

| 消息                        | details.code                     | details.reason           | 含义                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 客户端省略了 `device.nonce`（或发送了空值）。      |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 客户端使用了过期/错误的 nonce 签名。              |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 签名载荷与 v2 载荷不匹配。                        |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 签名时间戳超出允许偏差。                          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` 与公钥指纹不匹配。                    |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公钥格式/规范化失败。                             |

迁移目标：

- 始终等待 `connect.challenge`。
- 签署包含服务器 nonce 的 v2 载荷。
- 在 `connect.params.device.nonce` 中发送同一个 nonce。
- 首选签名载荷为 `v3`，它除了 device/client/role/scopes/token/nonce 字段外，
  还绑定 `platform` 和 `deviceFamily`。
- 出于兼容性，旧版 `v2` 签名仍会被接受，但已配对设备的元数据固定仍会在重连时控制命令策略。

## TLS + 固定

- TLS 支持用于 WS 连接。
- 客户端可以选择固定 Gateway 网关证书指纹（见 `gateway.tls`
  配置以及 `gateway.remote.tlsFingerprint` 或 CLI `--tls-fingerprint`）。

## 作用域

此协议暴露**完整 Gateway 网关 API**（状态、频道、模型、聊天、
智能体、会话、节点、批准等）。确切表面由
`packages/gateway-protocol/src/schema.ts` 中的 TypeBox schema 定义。

## 相关内容

- [桥接协议](/zh-CN/gateway/bridge-protocol)
- [Gateway 网关运行手册](/zh-CN/gateway)

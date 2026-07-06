---
read_when:
    - 实现或更新 Gateway 网关 WS 客户端
    - 调试协议不匹配或连接失败
    - 重新生成协议架构/模型
summary: Gateway 网关 WebSocket 协议：握手、帧、版本控制
title: Gateway 网关协议
x-i18n:
    generated_at: "2026-07-06T21:48:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15e0635d1b96e8ceabc98cfcececebde873b901de7b4bae2048b4d5cd4909c9d
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway 网关 WS 协议是 OpenClaw 的单一控制平面和节点传输协议。每个客户端（CLI、Web UI、macOS 应用、iOS/Android 节点、无头节点）都通过 WebSocket 连接，并在握手时声明 **角色** 和 **权限范围**。

## 传输和帧格式

- WebSocket、文本帧、JSON 载荷。
- 第一帧**必须**是 `connect` 请求。
- 连接前帧上限为 64 KiB（`MAX_PREAUTH_PAYLOAD_BYTES`）。握手后，遵循 `hello-ok.policy.maxPayload` 和 `hello-ok.policy.maxBufferedBytes`。启用诊断后，过大的入站帧和缓慢的出站缓冲区会在 Gateway 网关关闭或丢弃帧之前发出 `payload.large` 事件。这些事件携带 `surface`、字节大小、限制和安全原因码，绝不携带消息正文、附件内容、原始帧字节、令牌、Cookie 或密钥。

帧形状：

- 请求：`{type:"req", id, method, params}`
- 响应：`{type:"res", id, ok, payload|error}`
- 事件：`{type:"event", event, payload, seq?, stateVersion?}`

有副作用的方法需要幂等键（见 schema）。

## 握手

Gateway 网关发送连接前挑战：

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

客户端用 `connect` 回复：

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

Gateway 网关用 `hello-ok` 响应：

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

`server`、`features`、`snapshot`、`policy` 和 `auth` 都是 `HelloOkSchema`（`packages/gateway-protocol/src/schema/frames.ts`）必需的。即使没有签发设备令牌，`auth` 也会报告协商后的角色/权限范围（形状如上）。`pluginSurfaceUrls` 是可选项，会将插件 surface 名称（例如 `canvas`）映射到有作用域的托管 URL；它可能会过期，因此节点会用 `{ "surface": "canvas" }` 调用 `node.pluginSurface.refresh` 来获取新的条目。已弃用的 `canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh` 路径不受支持；请使用插件 surface。

当 Gateway 网关仍在完成启动 sidecar 时，`connect` 可能返回可重试的 `UNAVAILABLE` 错误，并带有 `details.reason: "startup-sidecars"` 和 `retryAfterMs`。请在你的连接预算内重试，而不是将其视为终止性的握手失败。

签发设备令牌时，`hello-ok.auth` 会添加它：

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

内置 QR/设置码引导是移动端交接路径。成功的基线设置码连接会返回一个主节点令牌和一个有边界的操作员令牌：

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

这个操作员交接有意设置边界：足以启动移动端操作员循环和原生设置，包括用于 Talk 配置读取的 `operator.talk.secrets`，但没有配对变更权限范围，也没有 `operator.admin`。更广泛的配对/管理访问需要单独批准的配对或令牌流程。仅当引导认证通过可信传输（`wss://` 或 loopback/local 配对）运行时，才持久化 `hello-ok.auth.deviceTokens`。

受信任的同进程后端客户端（`client.id: "gateway-client"`、`client.mode: "backend"`）在用共享 Gateway 网关令牌/密码认证的直接 loopback 连接上可以省略 `device`。此路径保留给内部控制平面 RPC（例如子智能体会话更新），并避免过期的 CLI/设备配对基线阻塞本地后端工作。远程、浏览器来源、节点，以及显式设备令牌/设备身份客户端仍会经过常规配对和权限范围升级检查。

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

节点在连接时声明能力声明：

- `caps`：高级类别，例如 `camera`、`canvas`、`screen`、`location`、`voice`、`talk`。
- `commands`：调用用命令允许列表。
- `permissions`：细粒度开关（例如 `screen.record`、`camera.capture`）。

Gateway 网关将这些视为声明，并执行服务端允许列表。

## 角色和权限范围

有关完整的操作员权限范围模型、批准时检查和共享密钥语义，请参阅 [操作员权限范围](/zh-CN/gateway/operator-scopes)。

角色：

- `operator`：控制平面客户端（CLI/UI/自动化）。
- `node`：能力宿主（camera/screen/canvas/system.run）。

操作员权限范围（`src/gateway/operator-scopes.ts`），完整闭合集合：

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

带 `includeSecrets: true` 的 `talk.config` 需要 `operator.talk.secrets`（或 `operator.admin`）。包含密钥时，从 `talk.resolved.config.apiKey` 读取活跃 Talk 提供商凭据；`talk.providers.<id>.apiKey` 保持源形状，可能是 SecretRef 对象或已脱敏字符串。

插件注册的 Gateway 网关 RPC 方法可以请求自己的操作员权限范围，但这些保留的核心前缀始终解析为 `operator.admin`（`src/shared/gateway-method-policy.ts`）：`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`。

方法权限范围只是第一道门。一些通过 `chat.send` 到达的斜杠命令会应用更严格的命令级检查：持久性 `/config set` 和 `/config unset` 写入需要 `operator.admin`，即使 Gateway 网关客户端已经持有较低的操作员权限范围。

`node.pair.approve` 在基础方法权限范围（`operator.pairing`）之上还有额外的批准时权限范围检查，基于待处理请求声明的 `commands`（`src/infra/node-pairing-authz.ts`）：

| 声明的命令                                                       | 所需权限范围                          |
| -------------------------------------------------------------- | ------------------------------------- |
| 无                                                             | `operator.pairing`                    |
| 非 exec 命令                                                    | `operator.pairing` + `operator.write` |
| 包含 `system.run`、`system.run.prepare` 或 `system.which`       | `operator.pairing` + `operator.admin` |

## 在线状态

- `system-presence` 返回按设备身份键控的条目，包括 `deviceId`、`roles` 和 `scopes`，因此即使某个设备同时作为操作员和节点连接，UI 也可以为每个设备显示一行。
- `node.list` 包含可选的 `lastSeenAtMs` 和 `lastSeenReason`。已连接节点报告当前连接时间，原因是 `connect`；已配对节点也可以通过受信任的节点事件报告持久的后台在线状态。

### 节点后台存活事件

节点用 `event: "node.presence.alive"` 调用 `node.event`，记录已配对节点在后台唤醒期间存活，但不将其标记为已连接：

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` 是闭合枚举：`background`、`silent_push`、`bg_app_refresh`、`significant_location`、`manual`、`connect`。未知值会规范化为 `background`（`src/shared/node-presence.ts`）。该事件只会为已认证的节点设备会话持久化；无设备或未配对会话返回 `handled: false`。

成功的 Gateway 网关会返回结构化结果：

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

较旧的 Gateway 网关可能只为 `node.event` 返回 `{ "ok": true }`；请将其视为已确认的 RPC，而不是持久在线状态已保存。

## 广播事件作用域

服务端推送的广播事件受权限范围控制，因此仅配对权限范围或仅节点会话不会被动接收会话内容（`src/gateway/server-broadcast.ts`）：

- 聊天、智能体和工具结果帧（流式 `agent` 事件、工具结果事件）至少需要 `operator.read`。没有该权限范围的会话会完全跳过这些帧。
- 插件定义的 `plugin.*` 广播默认受限于 `operator.write` 或 `operator.admin`；显式条目（例如 `plugin.approval.requested` / `plugin.approval.resolved`）改用 `operator.approvals`。
- 状态/传输事件（`heartbeat`、`presence`、`tick`、连接/断开连接生命周期）保持不受限制，因此每个已认证会话都可以观察传输健康状况。
- 未知广播事件族默认受权限范围控制（失败关闭），除非注册的处理程序显式放宽它们。

每个客户端连接都保留自己的每客户端序列号，因此即使不同客户端看到经过不同权限范围过滤的事件流子集，广播在该 socket 上也会保持单调有序。

## RPC 方法族

`hello-ok.features.methods` 是一个保守的发现列表，由 `src/gateway/server-methods-list.ts` 加上已加载的插件/渠道方法导出构建而成，它不是每个方法的生成式转储，并且某些方法（例如 `push.test`、`web.login.start`、`web.login.wait`、`sessions.usage`）即使是真实且可调用的方法，也会被有意排除在发现之外。请将其视为功能发现，而不是 `src/gateway/server-methods/*.ts` 的完整枚举。

  <AccordionGroup>
  <Accordion title="系统和身份">
    - `health` 返回缓存的或最新探测到的 Gateway 网关健康快照。
    - `diagnostics.stability` 返回最近的有界诊断稳定性记录器：事件名称、计数、字节大小、内存读数、队列/会话状态、渠道/插件名称、会话 ID。不包含聊天文本、webhook 正文、工具输出、原始请求/响应正文、令牌、cookie 或机密。需要 `operator.read`。
    - `status` 返回 `/status` 风格的 Gateway 网关摘要；敏感字段仅面向具有管理员权限范围的操作员客户端。
    - `gateway.identity.get` 返回中继和配对流程使用的 Gateway 网关设备身份。
    - `system-presence` 返回已连接操作员/节点设备的当前在线状态快照。
    - `system-event` 追加系统事件，并可更新/广播在线状态上下文。
    - `last-heartbeat` 返回最新持久化的 Heartbeat 事件。
    - `set-heartbeats` 切换 Gateway 网关上的 Heartbeat 处理。

  </Accordion>

  <Accordion title="Models 和用量">
    - `models.list` 返回运行时允许的模型目录。见下方的 “`models.list` 视图”。
    - `usage.status` 返回提供商用量窗口/剩余配额摘要。
    - `usage.cost` 返回某个日期范围内的聚合成本用量摘要。传入 `agentId` 可查看单个智能体，或传入 `agentScope: "all"` 来聚合已配置的智能体。
    - `doctor.memory.status` 返回当前默认智能体工作区的向量记忆/缓存嵌入就绪状态。仅在明确需要实时嵌入提供商 ping 时传入 `{ "probe": true }` 或 `{ "deep": true }`。传入 `{ "agentId": "agent-id" }` 可将 Dreaming 存储统计限定到单个智能体工作区；省略时会聚合已配置的 Dreaming 工作区。
    - `doctor.memory.dreamDiary`、`doctor.memory.backfillDreamDiary`、`doctor.memory.resetDreamDiary`、`doctor.memory.resetGroundedShortTerm`、`doctor.memory.repairDreamingArtifacts` 和 `doctor.memory.dedupeDreamDiary` 接受可选的 `{ "agentId": "agent-id" }`；省略时，它们会在已配置的默认智能体工作区上运行。
    - `doctor.memory.remHarness` 为远程控制平面客户端返回有边界的只读 REM harness 预览，包括工作区路径、记忆片段、渲染后的 grounded markdown，以及深度提升候选项。需要 `operator.read`。
    - `sessions.usage` 返回按会话划分的用量摘要。传入 `agentId` 可查看单个智能体，或传入 `agentScope: "all"` 来一起列出已配置的智能体。
    - `sessions.usage.timeseries` 返回单个会话的时间序列用量。
    - `sessions.usage.logs` 返回单个会话的用量日志条目。

  </Accordion>

  <Accordion title="渠道和登录辅助工具">
    - `channels.status` 返回内置 + 捆绑渠道/插件状态摘要。
    - `channels.logout` 会在渠道支持时注销特定渠道/账号。
    - `web.login.start` 为当前支持二维码的 Web 渠道提供商启动二维码/Web 登录流程。
    - `web.login.wait` 等待该流程完成，并在成功后启动渠道。
    - `push.test` 向已注册的 iOS 节点发送测试 APNs 推送。
    - `voicewake.get` 返回已存储的唤醒词触发器。
    - `voicewake.set` 更新唤醒词触发器并广播更改。

  </Accordion>

  <Accordion title="消息和日志">
    - `send` 是用于在聊天运行器之外，按渠道/账号/线程定向发送的直接出站投递 RPC。
    - `logs.tail` 返回已配置 Gateway 网关文件日志的尾部内容，并带有游标/限制和最大字节数控制。

  </Accordion>

  <Accordion title="操作员终端">
    - `terminal.open` 会为显式 `agentId` 或默认智能体启动一个主机 PTY，并返回解析后的智能体、工作目录、shell 和隔离状态。
    - `terminal.input`、`terminal.resize` 和 `terminal.close` 只作用于调用连接所拥有的会话。
    - `terminal.data` 和 `terminal.exit` 事件只流式传输到拥有该会话的连接。
    - 连接断开的会话会被分离，而不是被终止：它们会在 `gateway.terminal.detachedSessionTimeoutSeconds` 期间保持可重新附加（默认 300；`0` 会恢复为断开即终止），同时最近输出会累积在有界的服务器端缓冲区中。
    - `terminal.list` 返回可附加的会话；`terminal.attach` 会将一个存活或已分离的会话重新绑定到调用连接，并返回重放缓冲区（tmux 风格接管——先前的存活拥有者会收到原因 为 `detached` 的 `terminal.exit`）；`terminal.text` 会以纯文本读取缓冲区而不附加。
    - 每个终端方法都需要 `operator.admin`；`gateway.terminal.enabled` 必须显式为 true。完全沙箱隔离的智能体会被拒绝，并且智能体策略变更会关闭现有和进行中的 PTY，包括已分离的 PTY。

  </Accordion>

  <Accordion title="Talk 和 TTS">
    - `talk.catalog` 返回用于语音、流式转录和实时语音的只读 Talk 提供商目录：规范提供商 ID、注册表别名、标签、已配置状态、可选的组级 `ready` 结果、公开的模型/语音 ID、规范模式、传输协议、脑策略，以及实时音频/能力标志，不返回提供商密钥，也不变更全局配置。当前 Gateway 网关会在应用运行时提供商选择后设置 `ready`；在旧版 Gateway 网关上，如果缺少该字段，应视为未经验证。
    - `talk.config` 返回有效的 Talk 配置载荷；`includeSecrets` 需要 `operator.talk.secrets`（或 `operator.admin`）。
    - `talk.session.create` 为 `realtime/gateway-relay`、`transcription/gateway-relay` 或 `stt-tts/managed-room` 创建一个由 Gateway 网关拥有的 Talk 会话。对于 `stt-tts/managed-room`，传入 `sessionKey` 的 `operator.write` 调用方还必须传入 `spawnedBy`，以实现限定范围的会话键可见性；未限定范围的 `sessionKey` 创建和 `brain: "direct-tools"` 需要 `operator.admin`。
    - `talk.session.join` 验证托管房间会话令牌，按需发出 `session.ready` 或 `session.replaced`，并返回房间/会话元数据以及最近的 Talk 事件，绝不返回明文令牌或其哈希。
    - `talk.session.appendAudio` 会将 base64 PCM 输入音频追加到由 Gateway 网关拥有的实时中继和转录会话。
    - `talk.session.startTurn`、`talk.session.endTurn` 和 `talk.session.cancelTurn` 驱动托管房间轮次生命周期，并在状态清除前拒绝过期轮次。
    - `talk.session.cancelOutput` 停止助手音频输出，主要用于 Gateway 网关中继会话中由 VAD 门控的打断。
    - `talk.session.submitToolResult` 完成由 Gateway 网关拥有的实时中继会话发出的提供商工具调用。当后续会有最终结果时，为临时工具输出传入 `options: { willContinue: true }`；当工具结果应满足提供商调用而不启动另一个实时响应时，传入 `options: { suppressResponse: true }`。
    - `talk.session.steer` 将活跃运行的语音控制发送到由 Gateway 网关拥有、智能体支撑的 Talk 会话中：`{ sessionId, text, mode? }`，其中 `mode` 是 `status`、`steer`、`cancel` 或 `followup`；省略模式时会根据语音文本分类。
    - `talk.session.close` 关闭由 Gateway 网关拥有的中继、转录或托管房间会话，并发出终止 Talk 事件。
    - `talk.mode` 为 WebChat/Control UI 客户端设置/广播当前 Talk 模式状态。
    - `talk.client.create` 使用 `webrtc` 或 `provider-websocket` 创建一个由客户端拥有的实时提供商会话，同时 Gateway 网关拥有配置、凭据、指令和工具策略。
    - `talk.client.toolCall` 允许由客户端拥有的实时传输协议将提供商工具调用转发给 Gateway 网关策略。第一个受支持的工具是 `openclaw_agent_consult`；客户端会获得一个运行 ID，并在提交提供商特定的工具结果前等待正常聊天生命周期事件。
    - `talk.client.steer` 为由客户端拥有的实时传输协议发送活跃运行的语音控制。Gateway 网关会从 `sessionKey` 解析活跃的嵌入式运行，并返回结构化的已接受/已拒绝结果，而不是静默丢弃 Steering。
    - `talk.event` 是面向实时、转录、STT/TTS、托管房间、电话和会议适配器的单一 Talk 事件渠道。
    - `talk.speak` 通过活跃的 Talk 语音提供商合成语音。
    - `tts.status` 返回 TTS 启用状态、活跃提供商、回退提供商和提供商配置状态。
    - `tts.providers` 返回可见的 TTS 提供商清单。
    - `tts.enable` 和 `tts.disable` 切换 TTS 偏好设置状态。
    - `tts.setProvider` 更新首选 TTS 提供商。
    - `tts.convert` 执行一次性文本转语音转换。
    - `tts.speak`（`operator.write`）使用已配置的通用 TTS 提供商链渲染非空 `text`，并以内联方式返回一个完整音频片段作为 `audioBase64`，同时返回 `provider` 以及可选的 `outputFormat`、`mimeType` 和 `fileExtension` 元数据。与 `tts.convert` 不同，它不返回 Gateway 网关本地路径；与 `talk.speak` 不同，它不需要 Talk 提供商。超过 `messages.tts.maxTextLength` 的文本会返回 `INVALID_REQUEST`；合成失败会返回 `UNAVAILABLE`。

  </Accordion>

  <Accordion title="密钥、配置、更新和向导">
    - `secrets.reload` 会重新解析活动 SecretRefs，并且仅在完全成功时替换运行时密钥状态。
    - `secrets.resolve` 会解析特定命令/目标集合的命令目标密钥赋值。
    - `config.get` 返回当前配置快照和哈希。
    - `config.set` 写入经过验证的配置载荷。
    - `config.patch` 合并部分配置更新。破坏性的数组替换要求受影响路径出现在 `replacePaths` 中；数组条目下的嵌套数组使用 `[]` 路径，例如 `agents.list[].skills`。
    - `config.apply` 验证并替换完整配置载荷。
    - `config.schema` 返回 Control UI 和 CLI 工具使用的实时配置 schema 载荷：schema、`uiHints`、版本、生成元数据，以及在可加载时的插件 + 渠道 schema 元数据。它包含来自与 UI 相同的标签/帮助文本的 `title` / `description` 元数据，包括嵌套对象、通配符、数组项，以及在存在匹配字段文档时的 `anyOf` / `oneOf` / `allOf` 组合分支。
    - `config.schema.lookup` 返回一个配置路径的路径作用域查找载荷：规范化路径、浅层 schema 节点、匹配的提示 + `hintPath`、可选的 `reloadKind`，以及用于 UI/CLI 下钻的直接子项摘要。`reloadKind` 是 `restart`、`hot` 或 `none`（`src/config/schema.ts`）之一，并且会映射所请求路径的 Gateway 网关配置重载规划器。查找 schema 节点会保留面向用户的文档和常见验证字段（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、数字/字符串/数组/对象边界、`additionalProperties`、`deprecated`、`readOnly`、`writeOnly`）。子项摘要暴露 `key`、规范化 `path`、`type`、`required`、`hasChildren`、可选 `reloadKind`，以及匹配的 `hint` / `hintPath`。
    - `update.run` 运行 Gateway 网关更新流程，并且仅在更新成功时安排重启；带有会话的调用方可以包含 `continuationMessage`，这样启动时会通过重启延续队列恢复一个后续智能体轮次。来自控制平面的包管理器更新和受监督的 git-checkout 更新会使用分离的托管服务交接，而不是在实时 Gateway 网关内替换包树或修改 checkout/build 输出。已启动的交接返回 `ok: true`，并带有 `result.reason: "managed-service-handoff-started"` 和 `handoff.status: "started"`；不可用或失败的交接返回 `ok: false`，并带有 `managed-service-handoff-unavailable` 或 `managed-service-handoff-failed`，在需要手动 shell 更新时还会带有 `handoff.command`。不可用表示 OpenClaw 缺少安全的监督者边界或持久服务身份，例如 systemd 的 `OPENCLAW_SYSTEMD_UNIT`。在已启动的交接期间，重启哨兵可能会短暂报告 `stats.reason: "restart-health-pending"`；延续会延迟到 CLI 验证已重启的 Gateway 网关并写入最终 `ok` 哨兵之后。
    - `update.status` 刷新并返回最新的更新重启哨兵，包括可用时的重启后运行版本。
    - `wizard.start`、`wizard.next`、`wizard.status` 和 `wizard.cancel` 通过 WS RPC 暴露新手引导向导。

  </Accordion>

  <Accordion title="智能体和工作区辅助方法">
    - `agents.list` 返回已配置的智能体条目，包括有效模型和运行时元数据。
    - `agents.create`、`agents.update` 和 `agents.delete` 管理智能体记录和工作区接线。
    - `agents.files.list`、`agents.files.get` 和 `agents.files.set` 管理向智能体暴露的引导工作区文件。
    - `audit.list` 返回智能体运行和工具操作事件的有界、仅元数据账本。
    - `agents.workspace.list` 和 `agents.workspace.get`（`operator.read`）为 [Operator scopes](/zh-CN/gateway/operator-scopes) 中描述的受信任操作员域内客户端，暴露只读、分页的智能体工作区目录浏览。请求仅接受相对于工作区的路径；读取会限制在经过 realpath 解析的工作区根目录内（拒绝符号链接和硬链接逃逸），设置大小上限，并且仅限 UTF-8 文本加常见图片类型（base64）。响应不会暴露主机工作区路径。此命名空间中没有写入操作。
    - `tasks.list`、`tasks.get` 和 `tasks.cancel` 向 SDK 和操作员客户端暴露 Gateway 网关任务账本。见下方的 [Task ledger RPCs](#task-ledger-rpcs)。
    - `artifacts.list`、`artifacts.get` 和 `artifacts.download` 为显式的 `sessionKey`、`runId` 或 `taskId` 作用域暴露从转录派生的工件摘要和下载。运行和任务查询会在服务器端解析所属会话，并且只返回具有匹配来源的转录媒体；不安全或本地 URL 来源会返回不支持的下载，而不是在服务器端抓取。
    - `environments.list` 和 `environments.status` 向 SDK 客户端暴露只读的 Gateway 网关本地和节点环境发现。
    - `agent.identity.get` 返回智能体或会话的有效助手身份。
    - `agent.wait` 等待运行完成，并在可用时返回终止快照。

  </Accordion>

  <Accordion title="会话控制">
    - `sessions.list` 返回当前会话索引，包括配置了智能体运行时后端时每行的 `agentRuntime` 元数据。
    - `sessions.subscribe` 和 `sessions.unsubscribe` 为当前 WS 客户端切换会话变更事件订阅。
    - `sessions.messages.subscribe` 和 `sessions.messages.unsubscribe` 为一个会话切换转录/消息事件订阅。
    - `sessions.preview` 返回特定会话键的有界转录预览。
    - `sessions.describe` 返回精确会话键的一行 Gateway 网关会话。
    - `sessions.resolve` 解析或规范化会话目标。
    - `sessions.create` 创建新的会话条目。
    - `sessions.send` 向现有会话发送消息。
    - `sessions.steer` 是活动会话的中断并 Steer 变体。
    - `sessions.abort` 中止会话的活动工作。传入 `key` 加可选的 `runId`，或者仅传入 `runId`，用于 Gateway 网关可解析到会话的活动运行。
    - `sessions.patch` 更新会话元数据/覆盖项，并报告解析后的规范模型以及有效 `agentRuntime`。
    - `sessions.reset`、`sessions.delete` 和 `sessions.compact` 执行会话维护。
    - `sessions.get` 返回完整存储的会话行。
    - 聊天执行仍使用 `chat.history`、`chat.send`、`chat.abort` 和 `chat.inject`。`chat.history` 会为 UI 客户端进行显示规范化：内联指令标签会从可见文本中剥离，纯文本工具调用 XML 载荷（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块）和泄漏的 ASCII/全角模型控制令牌会被剥离，纯静默令牌助手行（精确的 `NO_REPLY` / `no_reply`）会被省略，过大的行可以替换为占位符。
    - `chat.message.get` 是用于单个可见转录条目的增量式有界完整消息读取器。传入 `sessionKey`、会话选择按智能体作用域限定时的可选 `agentId`，以及先前通过 `chat.history` 暴露的转录 `messageId`；当已存储条目仍可用且未超大时，Gateway 网关会返回相同的显示规范化投影，但不带轻量历史截断上限。
    - `chat.send` 接受单轮 `fastMode: "auto"`，以便对自动截止时间之前启动的模型调用使用快速模式，然后在不使用快速模式的情况下启动后续重试、fallback、工具结果或延续调用。截止时间默认为 60 秒（`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`），并且可以通过 `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` 按模型配置。`chat.send` 调用方可以传入单轮 `fastAutoOnSeconds` 来覆盖该请求的截止时间。

  </Accordion>

  <Accordion title="设备配对和设备令牌">
    - `device.pair.list` 返回待处理和已批准的配对设备。
    - `device.pair.setupCode` 创建移动端设置代码，并默认创建 PNG QR 数据 URL。它要求 `operator.admin`，并且有意从广告发现中省略。结果包含 `setupCode`、可选 `qrDataUrl`、`gatewayUrl`、非密钥的 `auth` 标签，以及 `urlSource`。
    - `device.pair.approve`、`device.pair.reject` 和 `device.pair.remove` 管理设备配对记录。
    - `device.token.rotate` 在已批准角色和调用方作用域边界内轮换已配对设备令牌。
    - `device.token.revoke` 在已批准角色和调用方作用域边界内撤销已配对设备令牌。

    设置代码嵌入了短期有效的引导凭证。客户端不得
    在配对流程之外记录或持久化它。

  </Accordion>

  <Accordion title="节点配对、调用和待处理工作">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove` 和 `node.pair.verify` 覆盖节点配对和引导验证。
    - `node.list` 和 `node.describe` 返回已知/已连接节点状态。
    - `node.rename` 更新已配对节点标签。
    - `node.invoke` 将命令转发到已连接节点。
    - `node.invoke.result` 返回调用请求的结果。
    - `node.event` 将节点来源事件带回 Gateway 网关。
    - `node.pending.pull` 和 `node.pending.ack` 是已连接节点队列 API。
    - `node.pending.enqueue` 和 `node.pending.drain` 管理离线/断开连接节点的持久待处理工作。

  </Accordion>

  <Accordion title="审批族">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list` 和 `exec.approval.resolve` 覆盖一次性 exec 审批请求以及待处理审批查找/重放。
    - `exec.approval.waitDecision` 等待一个待处理 exec 审批，并返回最终决策（超时时返回 `null`）。
    - `exec.approvals.get` 和 `exec.approvals.set` 管理 Gateway 网关 exec 审批策略快照。
    - `exec.approvals.node.get` 和 `exec.approvals.node.set` 通过节点中继命令管理节点本地 exec 审批策略。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision` 和 `plugin.approval.resolve` 覆盖插件定义的审批流程。

  </Accordion>

  <Accordion title="自动化、Skills 和工具">
    - 自动化：`wake` 安排一次立即或下次 Heartbeat 的唤醒文本注入；`cron.get`、`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` 管理定时工作。
    - `cron.run` 仍是用于手动运行的入队式 RPC。需要完成语义的客户端应读取返回的 `runId` 并轮询 `cron.runs`。
    - `cron.runs` 接受可选的非空 `runId` 过滤器，这样客户端可以跟踪一个排队的手动运行，而不必与同一作业的其他历史条目竞态。
    - Skills 和工具：`commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。见下方的 [Operator helper methods](#operator-helper-methods)。

  </Accordion>
</AccordionGroup>

### 常见事件族

- `chat`：UI 聊天更新，例如 `chat.inject` 和其他仅用于转录的聊天事件。在协议 v4 中，增量载荷携带 `deltaText`；`message` 仍是累计的助手快照。非前缀替换会设置 `replace=true`，并使用 `deltaText` 作为替换文本。
- `session.message`、`session.operation`、`session.tool`：已订阅会话的转录、进行中的会话操作，以及事件流更新。
- `sessions.changed`：会话索引或元数据已更改。
- `presence`：系统在线状态快照更新。
- `tick`：周期性 keepalive/liveness 事件。
- `health`：Gateway 健康快照更新。
- `heartbeat`：Heartbeat 事件流更新。
- `cron`：cron 运行/作业变更事件。
- `shutdown`：Gateway 网关关闭通知。
- `node.pair.requested` / `node.pair.resolved`：节点配对生命周期。
- `node.invoke.request`：节点调用请求广播。
- `device.pair.requested` / `device.pair.resolved`：已配对设备生命周期。
- `voicewake.changed`：唤醒词触发配置已更改。
- `exec.approval.requested` / `exec.approval.resolved`：Exec 审批生命周期。
- `plugin.approval.requested` / `plugin.approval.resolved`：插件审批生命周期。

### 节点辅助方法

节点可以调用 `skills.bins` 来获取当前技能可执行文件列表，用于自动允许检查。

## 审计账本 RPC

`audit.list` 为操作员客户端提供稳定的按最新优先排序的智能体运行和工具操作元数据视图。它需要 `operator.read`。查询会排除早于 30 天的记录，共享 SQLite 账本上限为 100,000 条记录。过期行会在 Gateway 网关启动、每小时维护，以及后续写入期间删除。

- 参数：可选的精确 `agentId`、`sessionKey` 或 `runId`；可选 `kind`（`"agent_run"` 或 `"tool_action"`）；可选 `status`（`"started"`、`"succeeded"`、`"failed"`、`"cancelled"`、`"timed_out"`、`"blocked"` 或 `"unknown"`）；可选的包含边界的 `after` / `before` Unix 毫秒时间边界；可选的 `limit`，范围为 `1` 到 `500`；以及来自上一页的可选字符串 `cursor`。
- 结果：`{ "events": AuditEvent[], "nextCursor"?: string }`。

每个事件都包含稳定的事件 ID、单调递增的账本序列、源事件序列、时间戳、执行者、智能体/会话/运行来源、操作、状态，以及适用时的规范化错误代码。工具事件可以包含工具调用 ID 和工具名称。`redaction` 字段始终为 `"metadata_only"`：账本不会存储提示词、消息、工具参数、工具结果、命令输出或原始错误文本。

记录默认启用，并由 [`audit.enabled`](/zh-CN/gateway/configuration-reference#audit) 控制；禁用后，`audit.list` 会继续提供之前写入的记录，直到它们过期。

使用 [`openclaw audit`](/cli/audit) 进行文本查询和有界 JSON 导出。

## 任务账本 RPC

操作员客户端通过任务账本 RPC（`packages/gateway-protocol/src/schema/tasks.ts`）检查和取消 Gateway 网关后台任务记录。这些 RPC 返回经过清理的任务摘要，而不是原始运行时状态。

- `tasks.list` 需要 `operator.read`。
  - 参数：可选 `status`（`"queued"`、`"running"`、`"completed"`、`"failed"`、`"cancelled"` 或 `"timed_out"`）或这些状态的数组，可选 `agentId`，可选 `sessionKey`，可选 `limit`，范围为 `1` 到 `500`，以及可选字符串 `cursor`。
  - 结果：`{ "tasks": TaskSummary[], "nextCursor"?: string }`。
- `tasks.get` 需要 `operator.read`。
  - 参数：`{ "taskId": string }`。
  - 结果：`{ "task": TaskSummary }`。
  - 缺失的任务 ID 会返回 Gateway 网关 not-found 错误形状。
- `tasks.cancel` 需要 `operator.write`。
  - 参数：`{ "taskId": string, "reason"?: string }`。
  - 结果：`{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`。
  - `found` 表示账本中是否有匹配任务。`cancelled` 表示运行时是否接受或记录了取消。

`TaskSummary` 包含 `id`、`status` 和可选元数据：`kind`、`runtime`、`title`、`agentId`、`sessionKey`、`childSessionKey`、`ownerKey`、`runId`、`taskId`、`flowId`、`parentTaskId`、`sourceId`、时间戳、进度、终端摘要，以及经过清理的错误文本。`agentId` 标识正在执行任务的智能体；`sessionKey` 和 `ownerKey` 保留请求者和控制上下文。

## 操作员辅助方法

- `commands.list`（`operator.read`）获取某个智能体的运行时命令清单。
  - `agentId` 是可选的；省略它会读取默认 Agent 工作区。
  - `scope` 控制主 `name` 面向哪个表面：`text` 返回不带前导 `/` 的主文本命令令牌；`native` 和默认 `both` 路径在可用时返回提供商感知的原生命令名称。
  - `textAliases` 携带精确的斜杠别名，例如 `/model` 和 `/m`。
  - `nativeName` 在存在时携带提供商感知的原生命令名称。
  - `provider` 是可选的，只影响原生命名以及原生插件命令可用性。
  - `includeArgs=false` 会从响应中省略序列化参数元数据。
- `tools.catalog`（`operator.read`）获取某个智能体的运行时工具目录。响应包含分组工具和来源元数据：
  - `source`：`core` 或 `plugin`
  - `pluginId`：当 `source="plugin"` 时的插件所有者
  - `optional`：插件工具是否可选
- `tools.effective`（`operator.read`）获取某个会话的运行时有效工具清单。
  - `sessionKey` 是必需的。
  - Gateway 网关会从服务器端会话派生受信任的运行时上下文，而不是接受调用方提供的认证或投递上下文。
  - 响应是按会话范围、由服务器派生的活动清单投影，包括核心、插件、渠道，以及已发现的 MCP 服务器工具。
  - 对于 MCP，`tools.effective` 是只读的：它可以通过最终工具策略投影已预热会话的 MCP 目录，但不会创建 MCP 运行时、连接传输协议或发出 `tools/list`。如果没有匹配的已预热目录，响应可以包含诸如 `mcp-not-yet-connected`、`mcp-not-yet-listed` 或 `mcp-stale-catalog` 的提示。
  - 有效工具条目使用 `source="core"`、`source="plugin"`、`source="channel"` 或 `source="mcp"`。
- `tools.invoke`（`operator.write`）通过与 `/tools/invoke` 相同的 Gateway 网关策略路径调用一个可用工具。
  - `name` 是必需的。`args`、`sessionKey`、`agentId`、`confirm` 和 `idempotencyKey` 是可选的。
  - 如果同时存在 `sessionKey` 和 `agentId`，解析出的会话智能体必须匹配 `agentId`。
  - 仅所有者可用的核心包装器（例如 `cron`、`gateway` 和 `nodes`）需要所有者/管理员身份（`operator.admin`），即使 `tools.invoke` 本身是 `operator.write`。
  - 响应是面向 SDK 的封套，包含 `ok`、`toolName`、可选 `output`，以及类型化的 `error` 字段。审批或策略拒绝会在载荷中返回 `ok:false`，而不是绕过 Gateway 网关工具策略管道。
- `skills.status`（`operator.read`）获取某个智能体的可见技能清单。
  - `agentId` 是可选的；省略它会读取默认 Agent 工作区。
  - 响应包含资格、缺失要求、配置检查，以及经过清理且不暴露原始密钥值的安装选项。
- `skills.search` 和 `skills.detail`（`operator.read`）返回 ClawHub 发现元数据。
- `skills.upload.begin`、`skills.upload.chunk` 和 `skills.upload.commit`（`operator.admin`）会在安装前暂存一个私有技能归档。这是面向受信任客户端的独立管理员上传路径，不是常规 ClawHub 技能安装流程，并且默认禁用，除非启用 `skills.install.allowUploadedArchives`。
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })` 会创建一个绑定到该 slug 和 force 值的上传。
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` 会在精确解码偏移处追加字节。
  - `skills.upload.commit({ uploadId, sha256? })` 会验证最终大小和 SHA-256。提交只会完成上传；它不会安装技能。
  - 上传的技能归档是包含 `SKILL.md` 根文件的 zip 归档。归档内部目录名从不决定安装目标。
- `skills.install`（`operator.admin`）有三种模式：
  - ClawHub 模式：`{ source: "clawhub", slug, version?, force? }` 会将技能文件夹安装到默认 Agent 工作区的 `skills/` 目录中。
  - 上传模式：`{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }` 会将已提交的上传安装到默认 Agent 工作区的 `skills/<slug>` 目录中。slug 和 force 值必须匹配原始 `skills.upload.begin` 请求。除非启用 `skills.install.allowUploadedArchives`，否则会被拒绝；该设置不会影响 ClawHub 安装。
  - Gateway 网关安装器模式：`{ name, installId, timeoutMs? }` 会在 Gateway 网关主机上运行声明的 `metadata.openclaw.install` 操作。较旧客户端仍可能发送 `dangerouslyForceUnsafeInstall`；此字段已弃用，仅为协议兼容性接受，并会被忽略。请使用 `security.installPolicy` 来处理操作员拥有的安装决策。
- `skills.update`（`operator.admin`）有两种模式：
  - ClawHub 模式会更新默认 Agent 工作区中的一个已跟踪 slug，或所有已跟踪的 ClawHub 安装。
  - 配置模式会修补 `skills.entries.<skillKey>` 值，例如 `enabled`、`apiKey` 和 `env`。

### `models.list` 视图

`models.list` 接受一个可选 `view` 参数（`src/agents/model-catalog-visibility.ts`）：

- 省略或 `"default"`：如果配置了 `agents.defaults.models`，响应就是允许的目录，包括为 `provider/*` 条目动态发现的模型。否则，响应就是完整 Gateway 网关目录。
- `"configured"`：适合选择器大小的行为。如果配置了 `agents.defaults.models`，它仍然优先生效，包括为 `provider/*` 条目进行提供商范围的发现。没有 allowlist 时，响应使用显式 `models.providers.<provider>.models` 条目，仅在没有已配置模型行时回退到完整目录。
- `"all"`：完整 Gateway 网关目录，绕过 `agents.defaults.models`。用于诊断/发现 UI，而不是常规模型选择器。

## Exec 审批

- 当 exec 请求需要审批时，Gateway 网关会广播 `exec.approval.requested`。
- 操作员客户端通过调用 `exec.approval.resolve` 进行处理（需要 `operator.approvals`）。
- 对于 `host=node`，`exec.approval.request` 必须包含 `systemRunPlan`（规范的 `argv`/`cwd`/`rawCommand`/会话元数据）。缺少 `systemRunPlan` 的请求会被拒绝。
- 审批后，转发的 `node.invoke system.run` 调用会复用该规范 `systemRunPlan` 作为权威命令/cwd/会话上下文。
- 如果调用方在准备和最终审批后的 `system.run` 转发之间修改 `command`、`rawCommand`、`cwd`、`agentId` 或 `sessionKey`，Gateway 网关会拒绝运行，而不是信任被修改的载荷。

## 智能体投递回退

- `agent` 请求可以包含 `deliver=true` 来请求出站投递。
- `bestEffortDeliver=false`（默认值）保持严格行为：无法解析或仅内部可用的投递目标会返回 `INVALID_REQUEST`。
- `bestEffortDeliver=true` 允许在无法解析外部可投递路由时回退到仅会话执行（例如内部/webchat 会话或含糊的多渠道配置）。
- 当请求了投递时，最终 `agent` 结果可以包含 `result.deliveryStatus`，使用与 [`openclaw agent --json --deliver`](/zh-CN/cli/agent#json-delivery-status) 文档中相同的 `sent`、`suppressed`、`partial_failed` 和 `failed` 状态。

## 版本控制

- `PROTOCOL_VERSION`、`MIN_CLIENT_PROTOCOL_VERSION`、
  `MIN_NODE_PROTOCOL_VERSION` 和 `MIN_PROBE_PROTOCOL_VERSION` 位于
  `packages/gateway-protocol/src/version.ts`。
- 客户端发送 `minProtocol` + `maxProtocol`。操作员和 UI 客户端必须在该范围内
  包含当前协议；当前客户端和服务器运行协议 v4。
- 同时具备 `role: "node"` 和 `client.mode: "node"` 的已认证客户端
  可以使用 N-1 节点协议（当前为 v3）。轻量级重启探针使用
  相同的 N-1 窗口。设备认证、配对、权限范围、命令策略和 exec
  审批不受此兼容性窗口影响。插件拥有的节点能力和命令会被保留，直到节点升级到当前
  协议，因为它们托管的表面不属于 N-1 契约。
- 架构和模型从 TypeBox 定义生成：
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### 客户端常量

参考客户端实现在 `packages/gateway-client/src/`
（OpenClaw 通过轻量 `src/gateway/client.ts` facade 包装它）。这些
默认值在协议 v4 中保持稳定，并且是第三方客户端的预期基线。

| 常量                                      | 默认值                                                | 来源                                                                                                                      |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_NODE_PROTOCOL_VERSION`               | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_PROBE_PROTOCOL_VERSION`              | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| 请求超时（每个 RPC）                      | `30_000` ms                                           | `packages/gateway-client/src/client.ts`（`requestTimeoutMs`）                                                             |
| 预认证 / 连接质询超时                     | `15_000` ms                                           | `packages/gateway-client/src/timeouts.ts`（`OPENCLAW_HANDSHAKE_TIMEOUT_MS` 环境变量可以提高配对的服务器/客户端预算）      |
| 初始重连退避                              | `1_000` ms                                            | `packages/gateway-client/src/client.ts`（`backoffMs`）                                                                    |
| 最大重连退避                              | `30_000` ms                                           | `packages/gateway-client/src/client.ts`（`scheduleReconnect`）                                                            |
| 设备令牌关闭后的快速重试钳制              | `250` ms                                              | `packages/gateway-client/src/client.ts`                                                                                   |
| `terminate()` 前的强制停止宽限            | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                           |
| `stopAndWait()` 默认超时                  | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                |
| 默认 tick 间隔（`hello-ok` 前）           | `30_000` ms                                           | `packages/gateway-client/src/client.ts`                                                                                   |
| tick 超时关闭                             | 静默超过 `tickIntervalMs * 2` 时为代码 `4000`         | `packages/gateway-client/src/client.ts`                                                                                   |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024`（25 MB）                           | `src/gateway/server-constants.ts`                                                                                         |

服务器会在 `hello-ok` 中通告有效的 `policy.tickIntervalMs`、
`policy.maxPayload` 和 `policy.maxBufferedBytes`；客户端应遵循这些值，
而不是握手前的默认值。

## 认证

- 共享密钥 Gateway 网关认证使用 `connect.params.auth.token` 或
  `connect.params.auth.password`，具体取决于配置的
  `gateway.auth.mode`（`"none" | "token" | "password" | "trusted-proxy"`）。
- 带身份的模式，例如 Tailscale Serve（`gateway.auth.allowTailscale: true`）
  或非 loopback 的 `gateway.auth.mode: "trusted-proxy"`，会通过请求标头满足连接
  认证检查，而不是通过 `connect.params.auth.*`。
- 私有入口 `gateway.auth.mode: "none"` 会完全跳过共享密钥连接认证；
  不要在公共/不受信任入口上暴露该模式。
- 配对后，Gateway 网关会签发一个设备令牌，其作用域限定为连接
  角色 + 权限范围，并在 `hello-ok.auth.deviceToken` 中返回。客户端应在任何成功连接后
  持久化它。
- 使用该已存储设备令牌重连时，也应复用为该令牌存储的已批准
  权限范围集合。这会保留已授予的读/探针/状态访问权限，并避免将重连静默收缩到更窄的
  隐式仅管理员权限范围。
- 客户端连接认证组装（`packages/gateway-client/src/client.ts` 中的 `selectConnectAuth`）：
  - `auth.password` 是正交的，设置后始终转发。
  - `auth.token` 按优先级填充：首先是显式共享令牌，
    然后是显式 `deviceToken`，再然后是已存储的按设备令牌（按
    `deviceId` + `role` 作为键）。
  - `auth.bootstrapToken` 仅在上述内容均未解析出
    `auth.token` 时发送。共享令牌或任何已解析设备令牌都会抑制它。
  - 对已存储设备令牌的一次性
    `AUTH_TOKEN_MISMATCH` 重试自动提升仅限受信任端点：loopback，
    或带有固定 `tlsFingerprint` 的 `wss://`。未固定的公共 `wss://`
    不符合条件。
- 内置设置码 bootstrap 返回主节点
  `hello-ok.auth.deviceToken`，并在
  `hello-ok.auth.deviceTokens` 中返回一个有界操作员令牌，用于受信任的移动端移交。该操作员令牌
  包含 `operator.talk.secrets`，用于原生 Talk 配置读取，但
  排除配对变更权限范围和 `operator.admin`。
- 当非基线设置码 bootstrap 等待审批时，
  `PAIRING_REQUIRED` 详情包含 `recommendedNextStep: "wait_then_retry"`、
  `retryable: true` 和 `pauseReconnect: false`。继续使用相同的
  bootstrap 令牌重连，直到请求获批或令牌失效。
- 仅当连接在受信任传输（例如 `wss://` 或 loopback/本地配对）上使用 bootstrap
  认证时，才持久化 `hello-ok.auth.deviceTokens`。
- 如果客户端提供显式 `deviceToken` 或显式 `scopes`，该
  调用方请求的权限范围集合仍然具有权威性；仅当客户端复用已存储的按设备令牌时，
  才复用缓存的权限范围。
- 设备令牌可通过 `device.token.rotate` 和
  `device.token.revoke` 轮换/撤销（需要 `operator.pairing`）。轮换或撤销
  节点或其他非操作员角色还需要 `operator.admin`。
- `device.token.rotate` 返回轮换元数据。它仅对已使用该
  设备令牌认证的同设备调用回显替换 bearer 令牌，因此仅令牌客户端可以在
  重连前持久化其替换令牌。共享/管理员轮换不会回显 bearer 令牌。
- 令牌签发、轮换和撤销都被限定在该设备配对条目中记录的已批准角色
  集合内；令牌变更无法扩展或指向配对审批从未授予的设备角色。
- 对于已配对设备令牌会话，设备管理默认为自作用域，除非
  调用方还拥有 `operator.admin`：非管理员调用方只能管理其自身设备条目的
  操作员令牌。节点和其他非操作员令牌管理仅限管理员，即使是调用方自己的设备也如此。
- `device.token.rotate` 和 `device.token.revoke` 还会根据调用方的当前会话权限范围
  检查目标操作员令牌权限范围集合。
  非管理员调用方无法轮换或撤销比自身已持有范围更宽的操作员令牌。
- 认证失败包含 `error.details.code` 以及恢复提示：
  - `error.details.canRetryWithDeviceToken`（布尔值）
  - `error.details.recommendedNextStep`：`retry_with_device_token`、
    `update_auth_configuration`、`update_auth_credentials`、
    `wait_then_retry`、`review_auth_configuration`
    之一（`packages/gateway-protocol/src/connect-error-details.ts`）。
- `AUTH_TOKEN_MISMATCH` 的客户端行为：
  - 受信任客户端可以使用缓存的按设备令牌尝试一次有界重试。
  - 如果该重试失败，停止自动重连循环并显示操作员操作指引。
- `AUTH_SCOPE_MISMATCH` 表示设备令牌已被识别，但不覆盖
  请求的角色/权限范围。不要将其呈现为错误令牌；提示
  操作员重新配对，或批准更窄/更宽的权限范围契约。

## 设备身份和配对

- 节点应包含从密钥对指纹派生的稳定设备身份（`device.id`）。
- Gateway 网关按设备 + 角色签发令牌。
- 除非启用了本地自动审批，否则新设备 ID 需要配对审批。
- 配对自动审批以直接 local loopback 连接为中心。
- OpenClaw 还有一个狭窄的后端/容器本地自连接路径，用于
  受信任的共享密钥辅助流程。
- 同主机 tailnet 或 LAN 连接仍会按远程配对处理，
  并需要审批。
- WS 客户端通常在 `connect` 期间包含 `device` 身份（操作员 +
  节点）。唯一的无设备操作员例外是显式信任路径：
  - `gateway.controlUi.allowInsecureAuth=true`，用于仅 localhost 的不安全
    HTTP 兼容性。
  - 成功的 `gateway.auth.mode: "trusted-proxy"` 操作员 Control UI 认证。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（应急破例，严重
    安全降级）。
  - 预留内部辅助路径上的 direct-loopback `gateway-client` 后端 RPC。
- 省略设备身份会带来权限范围后果。当无设备
  操作员连接通过显式信任路径获准时，OpenClaw
  仍会将自声明权限范围清空为空集合，除非该路径具备
  具名权限范围保留例外。受权限范围控制的方法随后会因
  `missing scope` 失败。
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` 是 Control UI
  应急权限范围保留路径。它不会向任意
  自定义后端或 CLI 形态的 WebSocket 客户端授予权限范围。
- 预留的 direct-loopback `gateway-client` 后端辅助路径仅为内部本地控制平面 RPC
  保留权限范围；自定义后端 ID
  不会获得此例外。
- 所有连接都必须签名服务器提供的 `connect.challenge` nonce。

### 设备认证迁移诊断

对于仍使用质询前签名行为的旧版客户端，`connect`
会在 `error.details.code` 下返回 `DEVICE_AUTH_*` 详情代码，并带有稳定的
`error.details.reason`。

常见迁移失败：

| 消息                        | details.code                     | details.reason           | 含义                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 客户端省略了 `device.nonce`（或发送了空值）。     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 客户端使用过期/错误的 nonce 签名。                |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 签名载荷与 v2 载荷不匹配。                        |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 签名时间戳超出了允许的偏差范围。                  |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` 与公钥指纹不匹配。                    |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公钥格式/规范化失败。                             |

迁移目标：

- 始终等待 `connect.challenge`。
- 签署包含服务器 nonce 的 v2 载荷。
- 在 `connect.params.device.nonce` 中发送同一个 nonce。
- 首选签名载荷是 `v3`
  （`packages/gateway-client/src/device-auth.ts` 中的 `buildDeviceAuthPayloadV3`），
  除 device/client/role/scopes/token/nonce 字段外，还会绑定 `platform` 和 `deviceFamily`。
- 为了兼容性，旧版 `v2` 签名仍会被接受，但已配对设备
  元数据固定仍会控制重连时的命令策略。

## TLS 和固定

- WS 连接支持 TLS（`gateway.tls` 配置）。
- 客户端可以选择通过
  `gateway.remote.tlsFingerprint` 或 CLI `--tls-fingerprint` 固定 Gateway 网关证书指纹。

## 范围

此协议公开完整的 Gateway 网关 API：状态、渠道、模型、聊天、
智能体、会话、节点、审批等。确切表面由
从 `packages/gateway-protocol/src/schema.ts` 重新导出的 TypeBox 架构定义。

## 相关

- [Bridge protocol（旧版节点，历史参考）](/zh-CN/gateway/bridge-protocol)
- [Gateway 网关运行手册](/zh-CN/gateway)

---
read_when:
    - 实现或更新 Gateway 网关 WS 客户端
    - 调试协议不匹配或连接失败
    - 重新生成协议模式和模型
summary: Gateway 网关 WebSocket 协议：握手、帧、版本控制
title: Gateway 网关协议
x-i18n:
    generated_at: "2026-07-03T09:23:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b58ef44b15e7359ca919e487bcf94c86601f508500ece000aafd8d1a90fb1cf1
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway 网关 WS 协议是 OpenClaw 的**单一控制平面 + 节点传输协议**。所有客户端（CLI、Web UI、macOS 应用、iOS/Android 节点、无头节点）都通过 WebSocket 连接，并在握手时声明其**角色** + **作用域**。

## 传输

- WebSocket，带 JSON 负载的文本帧。
- 第一帧**必须**是 `connect` 请求。
- 连接前帧限制为 64 KiB。握手成功后，客户端应遵循 `hello-ok.policy.maxPayload` 和 `hello-ok.policy.maxBufferedBytes` 限制。启用诊断后，过大的入站帧和缓慢的出站缓冲区会在 Gateway 网关关闭连接或丢弃受影响帧之前发出 `payload.large` 事件。这些事件会保留大小、限制、表面和安全原因码。它们不会保留消息正文、附件内容、原始帧正文、令牌、cookie 或密钥值。

## 握手（connect）

Gateway 网关 → 客户端（连接前质询）：

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

当 Gateway 网关仍在完成启动 sidecar 时，`connect` 请求可能返回可重试的 `UNAVAILABLE` 错误，并将 `details.reason` 设为 `"startup-sidecars"`，同时带有 `retryAfterMs`。客户端应在其整体连接预算内重试该响应，而不是将其呈现为终止性的握手失败。

`server`、`features`、`snapshot` 和 `policy` 都是 schema（`packages/gateway-protocol/src/schema/frames.ts`）要求的字段。`auth` 也是必需字段，并报告协商后的角色/作用域。`pluginSurfaceUrls` 是可选字段，会将插件表面名称（例如 `canvas`）映射到带作用域的托管 URL。

带作用域的插件表面 URL 可能会过期。节点可以使用 `{ "surface": "canvas" }` 调用 `node.pluginSurface.refresh`，以在 `pluginSurfaceUrls` 中接收新的条目。实验性的 Canvas 插件重构不支持已弃用的 `canvasHostUrl`、`canvasCapability` 或 `node.canvas.capability.refresh` 兼容路径；当前原生客户端和 Gateway 网关必须使用插件表面。

未签发设备令牌时，`hello-ok.auth` 会报告协商后的权限，但不包含令牌字段：

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

受信任的同进程后端客户端（`client.id: "gateway-client"`、`client.mode: "backend"`）在使用共享 Gateway 网关令牌/密码认证时，可以在直接 loopback 连接上省略 `device`。此路径保留给内部控制平面 RPC，并避免陈旧的 CLI/设备配对基线阻塞本地后端工作，例如子智能体会话更新。远程客户端、浏览器来源客户端、节点客户端，以及显式设备令牌/设备身份客户端仍使用正常的配对和作用域升级检查。

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

内置 QR/设置码 bootstrap 是一条新的移动端交接路径。成功的基线设置码连接会返回一个主节点令牌以及一个有界的 operator 令牌：

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

operator 交接被有意限制，因此 QR 新手引导可以启动移动端 operator 循环，而不会授予 `operator.admin` 或 `operator.pairing`。它确实包含 `operator.talk.secrets`，以便原生客户端在 bootstrap 后读取所需的 Talk 配置。更广泛的 admin 和配对作用域需要单独批准的 operator 配对或令牌流程。客户端只有在连接使用 bootstrap 认证并通过受信任传输（例如 `wss://` 或 loopback/local 配对）时，才应持久化 `hello-ok.auth.deviceTokens`。

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

## 成帧

- **请求**：`{type:"req", id, method, params}`
- **响应**：`{type:"res", id, ok, payload|error}`
- **事件**：`{type:"event", event, payload, seq?, stateVersion?}`

有副作用的方法需要**幂等键**（参见 schema）。

## 角色 + 作用域

完整的 operator 作用域模型、审批时检查和共享密钥语义，请参阅 [Operator 作用域](/zh-CN/gateway/operator-scopes)。

### 角色

- `operator` = 控制平面客户端（CLI/UI/自动化）。
- `node` = 能力宿主（camera/screen/canvas/system.run）。

### 作用域（operator）

常用作用域：

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

带 `includeSecrets: true` 的 `talk.config` 需要 `operator.talk.secrets`（或 `operator.admin`）。包含密钥时，客户端应从 `talk.resolved.config.apiKey` 读取活跃 Talk 提供商凭证；`talk.providers.<id>.apiKey` 保持源形状，可能是 SecretRef 对象或已遮盖的字符串。

插件注册的 Gateway 网关 RPC 方法可以请求自己的 operator 作用域，但保留的核心 admin 前缀（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）始终解析为 `operator.admin`。

方法作用域只是第一道关卡。某些通过 `chat.send` 到达的斜杠命令会在其上应用更严格的命令级检查。例如，持久化的 `/config set` 和 `/config unset` 写入需要 `operator.admin`。

`node.pair.approve` 在基础方法作用域之上还有额外的审批时作用域检查：

- 无命令请求：`operator.pairing`
- 带非 exec 节点命令的请求：`operator.pairing` + `operator.write`
- 包含 `system.run`、`system.run.prepare` 或 `system.which` 的请求：`operator.pairing` + `operator.admin`

### 能力/命令/权限（节点）

节点在连接时声明能力主张：

- `caps`：高级能力类别，例如 `camera`、`canvas`、`screen`、`location`、`voice` 和 `talk`。
- `commands`：用于 invoke 的命令允许列表。
- `permissions`：细粒度开关（例如 `screen.record`、`camera.capture`）。

Gateway 网关将这些视为**主张**，并强制执行服务端允许列表。

## Presence

- `system-presence` 返回按设备身份作为键的条目。
- Presence 条目包含 `deviceId`、`roles` 和 `scopes`，因此 UI 可以为每台设备显示单行，即使它同时以 **operator** 和 **node** 连接。
- `node.list` 包含可选的 `lastSeenAtMs` 和 `lastSeenReason` 字段。已连接节点会将其当前连接时间报告为 `lastSeenAtMs`，原因是 `connect`；当可信节点事件更新配对元数据时，已配对节点也可以报告持久的后台 presence。

### 节点后台存活事件

节点可以调用带 `event: "node.presence.alive"` 的 `node.event`，以记录已配对节点在后台唤醒期间处于存活状态，但不将其标记为已连接。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` 是封闭枚举：`background`、`silent_push`、`bg_app_refresh`、`significant_location`、`manual` 或 `connect`。未知 trigger 字符串会在持久化前由 Gateway 网关规范化为 `background`。该事件仅对已认证的节点设备会话持久化；无设备或未配对会话会返回 `handled: false`。

成功的 Gateway 网关会返回结构化结果：

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

旧版 Gateway 网关对 `node.event` 可能仍返回 `{ "ok": true }`；客户端应将其视为已确认的 RPC，而不是持久 presence 持久化。

## 广播事件作用域限定

服务端推送的 WebSocket 广播事件受作用域门控，因此仅限配对作用域或仅节点会话不会被动接收会话内容。

- **聊天、智能体和工具结果帧**（包括流式 `agent` 事件和工具调用结果）至少需要 `operator.read`。没有 `operator.read` 的会话会完全跳过这些帧。
- **插件定义的 `plugin.*` 广播**会根据插件注册方式，由 `operator.write` 或 `operator.admin` 门控。
- **状态和传输事件**（`heartbeat`、presence、`tick`、连接/断开生命周期等）保持不受限制，以便每个已认证会话都能观察传输健康。
- **未知广播事件族**默认受作用域门控（失败关闭），除非已注册处理器显式放宽限制。

每个客户端连接都会保留自己的按客户端序列号，因此即使不同客户端看到的是事件流中经过不同作用域过滤的子集，广播也能在该 socket 上保持单调顺序。

## 常见 RPC 方法族

公开 WS 表面比上面的握手/认证示例更广。这不是生成式转储，`hello-ok.features.methods` 是一个保守的发现列表，由 `src/gateway/server-methods-list.ts` 加上已加载的插件/渠道方法导出构建而成。请将其视为功能发现，而不是对 `src/gateway/server-methods/*.ts` 的完整枚举。

  <AccordionGroup>
  <Accordion title="系统和身份">
    - `health` 返回缓存的或新探测的 Gateway 网关健康快照。
    - `diagnostics.stability` 返回近期有界的诊断稳定性记录器。它保留事件名称、计数、字节大小、内存读数、队列/会话状态、渠道/插件名称和会话 ID 等运维元数据。它不保留聊天文本、webhook 正文、工具输出、原始请求或响应正文、令牌、Cookie 或密钥值。需要操作员读取范围。
    - `status` 返回 `/status` 风格的 Gateway 网关摘要；敏感字段仅包含在具有管理员范围的操作员客户端中。
    - `gateway.identity.get` 返回中继和配对流程使用的 Gateway 网关设备身份。
    - `system-presence` 返回已连接操作员/节点设备的当前在线状态快照。
    - `system-event` 追加一个系统事件，并且可以更新/广播在线状态上下文。
    - `last-heartbeat` 返回最新持久化的 Heartbeat 事件。
    - `set-heartbeats` 在 Gateway 网关上切换 Heartbeat 处理。

  </Accordion>

  <Accordion title="模型和用量">
    - `models.list` 返回运行时允许的模型目录。传入 `{ "view": "configured" }` 可获取适合选择器大小的已配置模型（先是 `agents.defaults.models`，然后是 `models.providers.*.models`），或传入 `{ "view": "all" }` 获取完整目录。
    - `usage.status` 返回提供商用量窗口/剩余额度摘要。
    - `usage.cost` 返回某个日期范围内的聚合费用用量摘要。
      传入 `agentId` 可查看一个智能体，或传入 `agentScope: "all"` 来聚合已配置的智能体。
    - `doctor.memory.status` 返回活动默认 Agent 工作区的向量记忆/缓存 embedding 就绪状态。仅当调用方明确想要实时 ping embedding 提供商时，才传入 `{ "probe": true }` 或 `{ "deep": true }`。支持 Dreaming 的客户端也可以传入 `{ "agentId": "agent-id" }`，将 Dreaming 存储统计限定到选定的 Agent 工作区；省略 `agentId` 会保留默认 Agent 回退，并聚合已配置的 Dreaming 工作区。
    - `doctor.memory.dreamDiary`、`doctor.memory.backfillDreamDiary`、`doctor.memory.resetDreamDiary`、`doctor.memory.resetGroundedShortTerm`、`doctor.memory.repairDreamingArtifacts` 和 `doctor.memory.dedupeDreamDiary` 接受可选的 `{ "agentId": "agent-id" }` 参数，用于选定 Agent 的 Dreaming 视图/操作。省略 `agentId` 时，它们会作用于已配置的默认 Agent 工作区。
    - `doctor.memory.remHarness` 为远程控制平面客户端返回一个有界、只读的 REM harness 预览。它可以包含工作区路径、记忆片段、渲染后的 grounded Markdown 和深度提升候选项，因此调用方需要 `operator.read`。
    - `sessions.usage` 返回按会话划分的用量摘要。传入 `agentId` 可查看一个
      智能体，或传入 `agentScope: "all"` 一并列出已配置的智能体。
    - `sessions.usage.timeseries` 返回一个会话的时间序列用量。
    - `sessions.usage.logs` 返回一个会话的用量日志条目。

  </Accordion>

  <Accordion title="渠道和登录辅助工具">
    - `channels.status` 返回内置 + 内置打包的渠道/插件状态摘要。
    - `channels.logout` 在渠道支持登出时，登出特定渠道/账号。
    - `web.login.start` 为当前支持 QR 的 Web 渠道提供商启动 QR/Web 登录流程。
    - `web.login.wait` 等待该 QR/Web 登录流程完成，并在成功后启动渠道。
    - `push.test` 向已注册的 iOS 节点发送一条测试 APNs 推送。
    - `voicewake.get` 返回已存储的唤醒词触发器。
    - `voicewake.set` 更新唤醒词触发器并广播变更。

  </Accordion>

  <Accordion title="消息和日志">
    - `send` 是聊天运行器之外针对渠道/账号/线程的直接出站投递 RPC。
    - `logs.tail` 返回已配置的 Gateway 网关文件日志尾部，带有游标/限制和最大字节控制。

  </Accordion>

  <Accordion title="Talk 和 TTS">
    - `talk.catalog` 返回用于语音、流式转录和实时语音的只读 Talk 提供商目录。它包含规范提供商 ID、注册表别名、标签、已配置状态、可选的组级 `ready` 结果、暴露的模型/语音 ID、规范模式、传输、brain 策略和实时音频/能力标志，不返回提供商密钥，也不改变全局配置。当前 Gateway 网关会在应用运行时提供商选择后设置 `ready`；为兼容旧版 Gateway 网关，客户端应将其缺失视为未经验证。
    - `talk.config` 返回有效的 Talk 配置载荷；`includeSecrets` 需要 `operator.talk.secrets`（或 `operator.admin`）。
    - `talk.session.create` 为 `realtime/gateway-relay`、`transcription/gateway-relay` 或 `stt-tts/managed-room` 创建由 Gateway 网关拥有的 Talk 会话。对于 `stt-tts/managed-room`，传入 `sessionKey` 的 `operator.write` 调用方还必须传入 `spawnedBy`，以获得限定范围的会话键可见性；创建无范围的 `sessionKey` 以及 `brain: "direct-tools"` 都需要 `operator.admin`。
    - `talk.session.join` 验证托管房间会话令牌，按需发出 `session.ready` 或 `session.replaced` 事件，并返回房间/会话元数据以及近期 Talk 事件，不包含明文令牌或已存储的令牌哈希。
    - `talk.session.appendAudio` 向 Gateway 网关拥有的实时中继和转录会话追加 base64 PCM 输入音频。
    - `talk.session.startTurn`、`talk.session.endTurn` 和 `talk.session.cancelTurn` 驱动托管房间轮次生命周期，并在清除状态前拒绝过期轮次。
    - `talk.session.cancelOutput` 停止助手音频输出，主要用于 Gateway 网关中继会话中由 VAD 门控的插话。
    - `talk.session.submitToolResult` 完成由 Gateway 网关拥有的实时中继会话发出的提供商工具调用。当最终结果稍后会到达时，为中间工具输出传入 `options: { willContinue: true }`；当工具结果应满足提供商调用且不启动另一条实时助手响应时，传入 `options: { suppressResponse: true }`。
    - `talk.session.steer` 向由 Gateway 网关拥有、Agent 支持的 Talk 会话发送活动运行中的语音控制。它接受 `{ sessionId, text, mode? }`，其中 `mode` 为 `status`、`steer`、`cancel` 或 `followup`；省略的模式会根据语音文本分类。
    - `talk.session.close` 关闭由 Gateway 网关拥有的中继、转录或托管房间会话，并发出终止 Talk 事件。
    - `talk.mode` 为 WebChat/Control UI 客户端设置/广播当前 Talk 模式状态。
    - `talk.client.create` 使用 `webrtc` 或 `provider-websocket` 创建由客户端拥有的实时提供商会话，同时 Gateway 网关拥有配置、凭证、指令和工具策略。
    - `talk.client.toolCall` 允许由客户端拥有的实时传输将提供商工具调用转发到 Gateway 网关策略。第一个受支持的工具是 `openclaw_agent_consult`；客户端会收到一个运行 ID，并在提交提供商特定的工具结果前等待正常聊天生命周期事件。
    - `talk.client.steer` 为由客户端拥有的实时传输发送活动运行中的语音控制。Gateway 网关会根据 `sessionKey` 解析活动的嵌入运行，并返回结构化的已接受/已拒绝结果，而不是静默丢弃引导。
    - `talk.event` 是面向实时、转录、STT/TTS、托管房间、电话和会议适配器的单一 Talk 事件渠道。
    - `talk.speak` 通过活动的 Talk 语音提供商合成语音。
    - `tts.status` 返回 TTS 启用状态、活动提供商、回退提供商和提供商配置状态。
    - `tts.providers` 返回可见的 TTS 提供商清单。
    - `tts.enable` 和 `tts.disable` 切换 TTS 偏好状态。
    - `tts.setProvider` 更新首选 TTS 提供商。
    - `tts.convert` 运行一次性文本转语音转换。

  </Accordion>

  <Accordion title="密钥、配置、更新和向导">
    - `secrets.reload` 重新解析活动的 SecretRef，并且仅在完全成功时替换运行时密钥状态。
    - `secrets.resolve` 解析特定命令/目标集合的命令目标密钥分配。
    - `config.get` 返回当前配置快照和哈希。
    - `config.set` 写入经过验证的配置载荷。
    - `config.patch` 合并部分配置更新。破坏性的数组
      替换需要在 `replacePaths` 中包含受影响路径；数组条目下的嵌套数组使用 `[]` 路径，例如 `agents.list[].skills`。
    - `config.apply` 验证并替换完整配置载荷。
    - `config.schema` 返回 Control UI 和 CLI 工具使用的实时配置 schema 载荷：schema、`uiHints`、版本和生成元数据；当运行时可以加载插件 + 渠道 schema 元数据时，也会包含这些元数据。该 schema 包含从 UI 使用的相同标签和帮助文本派生的字段 `title` / `description` 元数据；当存在匹配的字段文档时，也包括嵌套对象、通配符、数组项以及 `anyOf` / `oneOf` / `allOf` 组合分支。
    - `config.schema.lookup` 返回某个配置路径的路径范围查找载荷：规范化路径、浅层 schema 节点、匹配的提示 + `hintPath`、可选的 `reloadKind`，以及用于 UI/CLI 下钻的直接子项摘要。`reloadKind` 是 `restart`、`hot` 或 `none` 之一，并镜像 Gateway 网关针对所请求路径的配置重载规划器。查找 schema 节点会保留面向用户的文档和常见验证字段（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、数字/字符串/数组/对象边界，以及 `additionalProperties`、`deprecated`、`readOnly`、`writeOnly` 等标志）。子项摘要暴露 `key`、规范化的 `path`、`type`、`required`、`hasChildren`、可选的 `reloadKind`，以及匹配的 `hint` / `hintPath`。
    - `update.run` 运行 Gateway 网关更新流程，并且仅当更新本身成功时才安排重启；带会话的调用方可以包含 `continuationMessage`，使启动通过重启延续队列恢复一个后续 Agent 轮次。来自控制平面的包管理器更新和受监督的 git checkout 更新会使用分离的托管服务交接，而不是在实时 Gateway 网关内替换包树或修改 checkout/build 输出。已启动的交接会返回 `ok: true`，并带有 `result.reason: "managed-service-handoff-started"` 和 `handoff.status: "started"`；不可用或失败的交接会返回 `ok: false`，并带有 `managed-service-handoff-unavailable` 或 `managed-service-handoff-failed`，当需要手动 shell 更新时还会包含 `handoff.command`。交接不可用表示 OpenClaw 缺少安全的监督器边界或持久的服务身份，例如用于 systemd 的 `OPENCLAW_SYSTEMD_UNIT`。在已启动的交接期间，重启哨兵可能会短暂报告 `stats.reason: "restart-health-pending"`；延续会延迟到 CLI 验证已重启的 Gateway 网关并写入最终 `ok` 哨兵之后。
    - `update.status` 刷新并返回最新的更新重启哨兵，包括可用时的重启后运行版本。
    - `wizard.start`、`wizard.next`、`wizard.status` 和 `wizard.cancel` 通过 WS RPC 暴露新手引导向导。

  </Accordion>

  <Accordion title="智能体和工作区辅助方法">
    - `agents.list` 返回已配置的智能体条目，包括有效模型和运行时元数据。
    - `agents.create`、`agents.update` 和 `agents.delete` 管理智能体记录和工作区接线。
    - `agents.files.list`、`agents.files.get` 和 `agents.files.set` 管理为智能体公开的引导工作区文件。
    - `tasks.list`、`tasks.get` 和 `tasks.cancel` 将 Gateway 网关任务台账公开给 SDK 和操作员客户端。
    - `artifacts.list`、`artifacts.get` 和 `artifacts.download` 为显式 `sessionKey`、`runId` 或 `taskId` 作用域公开从转录派生的工件摘要和下载。运行和任务查询会在服务端解析所属会话，并且只返回来源匹配的转录媒体；不安全或本地 URL 来源会返回不支持的下载，而不是在服务端抓取。
    - `environments.list` 和 `environments.status` 为 SDK 客户端公开只读的 Gateway 网关本地环境和节点环境发现。
    - `agent.identity.get` 返回智能体或会话的有效助手身份。
    - `agent.wait` 等待一次运行完成，并在可用时返回终止快照。

  </Accordion>

  <Accordion title="会话控制">
    - `sessions.list` 返回当前会话索引，包括配置了智能体运行时后端时每行的 `agentRuntime` 元数据。
    - `sessions.subscribe` 和 `sessions.unsubscribe` 为当前 WS 客户端切换会话变更事件订阅。
    - `sessions.messages.subscribe` 和 `sessions.messages.unsubscribe` 为一个会话切换转录/消息事件订阅。
    - `sessions.preview` 返回特定会话键的有界转录预览。
    - `sessions.describe` 返回精确会话键对应的一行 Gateway 网关会话。
    - `sessions.resolve` 解析或规范化会话目标。
    - `sessions.create` 创建新的会话条目。
    - `sessions.send` 向现有会话发送消息。
    - `sessions.steer` 是活动会话的中断并 Steer 变体。
    - `sessions.abort` 中止会话的活动工作。调用方可以传入 `key` 加可选 `runId`，也可以只传入 `runId`，用于 Gateway 网关能够解析到会话的活动运行。
    - `sessions.patch` 更新会话元数据/覆盖项，并报告解析后的规范模型以及有效 `agentRuntime`。
    - `sessions.reset`、`sessions.delete` 和 `sessions.compact` 执行会话维护。
    - `sessions.get` 返回完整存储的会话行。
    - 聊天执行仍使用 `chat.history`、`chat.send`、`chat.abort` 和 `chat.inject`。`chat.history` 会为 UI 客户端做显示规范化：从可见文本中剥离内联指令标签，剥离纯文本工具调用 XML 载荷（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 和被截断的工具调用块）以及泄露的 ASCII/全角模型控制令牌，省略精确 `NO_REPLY` / `no_reply` 等纯静默令牌助手行，且超大行可替换为占位符。
    - `chat.message.get` 是用于单个可见转录条目的追加式有界完整消息读取器。客户端传入 `sessionKey`，当会话选择限定在智能体作用域内时可选传入 `agentId`，再加上先前通过 `chat.history` 暴露的转录 `messageId`；当存储条目仍可用且未超大时，Gateway 网关会返回相同的显示规范化投影，但不应用轻量历史截断上限。
    - `chat.send` 接受单轮 `fastMode: "auto"`，用于对自动截止时间之前启动的模型调用使用快速模式，然后让后续重试、fallback、工具结果或延续调用不使用快速模式。截止时间默认为 60 秒，并可通过 `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` 按模型配置。`chat.send` 调用方可以传入单轮 `fastAutoOnSeconds` 来覆盖该请求的截止时间。

  </Accordion>

  <Accordion title="设备配对和设备令牌">
    - `device.pair.list` 返回待处理和已批准的配对设备。
    - `device.pair.approve`、`device.pair.reject` 和 `device.pair.remove` 管理设备配对记录。
    - `device.token.rotate` 在其已批准角色和调用方作用域边界内轮换配对设备令牌。
    - `device.token.revoke` 在其已批准角色和调用方作用域边界内吊销配对设备令牌。

  </Accordion>

  <Accordion title="节点配对、调用和待处理工作">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove` 和 `node.pair.verify` 覆盖节点配对和引导验证。
    - `node.list` 和 `node.describe` 返回已知/已连接节点状态。
    - `node.rename` 更新配对节点标签。
    - `node.invoke` 将命令转发到已连接节点。
    - `node.invoke.result` 返回调用请求的结果。
    - `node.event` 将节点发起的事件带回 gateway。
    - `node.pending.pull` 和 `node.pending.ack` 是已连接节点队列 API。
    - `node.pending.enqueue` 和 `node.pending.drain` 管理离线/断开连接节点的持久待处理工作。

  </Accordion>

  <Accordion title="审批族">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list` 和 `exec.approval.resolve` 覆盖一次性 exec 审批请求以及待处理审批查找/重放。
    - `exec.approval.waitDecision` 等待一个待处理 exec 审批，并返回最终决策（超时时返回 `null`）。
    - `exec.approvals.get` 和 `exec.approvals.set` 管理 gateway exec 审批策略快照。
    - `exec.approvals.node.get` 和 `exec.approvals.node.set` 通过节点中继命令管理节点本地 exec 审批策略。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision` 和 `plugin.approval.resolve` 覆盖插件定义的审批流程。

  </Accordion>

  <Accordion title="自动化、Skills 和工具">
    - 自动化：`wake` 调度立即或下一次 Heartbeat 唤醒文本注入；`cron.get`、`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` 管理定时工作。
    - `cron.run` 仍是用于手动运行的入队式 RPC。需要完成语义的客户端应读取返回的 `runId` 并轮询 `cron.runs`。
    - `cron.runs` 接受可选的非空 `runId` 过滤器，以便客户端跟踪一个已排队的手动运行，而不会与同一作业的其他历史条目发生竞态。
    - Skills 和工具：`commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。

  </Accordion>
</AccordionGroup>

### 常见事件族

- `chat`：UI 聊天更新，例如 `chat.inject` 和其他仅转录聊天
  事件。在协议 v4 中，增量载荷携带 `deltaText`；`message` 仍是
  累积的助手快照。非前缀替换会设置 `replace=true`
  并使用 `deltaText` 作为替换文本。
- `session.message`、`session.operation` 和 `session.tool`：已订阅
  会话的转录、进行中的会话操作和事件流更新。
- `sessions.changed`：会话索引或元数据已变更。
- `presence`：系统在线状态快照更新。
- `tick`：周期性 keepalive / 存活事件。
- `health`：gateway 健康快照更新。
- `heartbeat`：Heartbeat 事件流更新。
- `cron`：cron 运行/作业变更事件。
- `shutdown`：gateway 关闭通知。
- `node.pair.requested` / `node.pair.resolved`：节点配对生命周期。
- `node.invoke.request`：节点调用请求广播。
- `device.pair.requested` / `device.pair.resolved`：配对设备生命周期。
- `voicewake.changed`：唤醒词触发器配置已变更。
- `exec.approval.requested` / `exec.approval.resolved`：exec 审批
  生命周期。
- `plugin.approval.requested` / `plugin.approval.resolved`：插件审批
  生命周期。

### 节点辅助方法

- 节点可以调用 `skills.bins` 来获取当前技能可执行文件列表，
  用于自动允许检查。

### 任务台账 RPC

操作员客户端可以通过任务台账 RPC 检查并取消 Gateway 网关后台任务记录。
这些方法返回经过净化的任务摘要，而不是原始
运行时状态。

- `tasks.list` 需要 `operator.read`。
  - 参数：可选 `status`（`"queued"`、`"running"`、`"completed"`、
    `"failed"`、`"cancelled"` 或 `"timed_out"`）或这些状态的数组，
    可选 `agentId`、可选 `sessionKey`、从 `1` 到
    `500` 的可选 `limit`，以及可选字符串 `cursor`。
  - 结果：`{ "tasks": TaskSummary[], "nextCursor"?: string }`。
- `tasks.get` 需要 `operator.read`。
  - 参数：`{ "taskId": string }`。
  - 结果：`{ "task": TaskSummary }`。
  - 缺失任务 id 会返回 Gateway 网关 not-found 错误形状。
- `tasks.cancel` 需要 `operator.write`。
  - 参数：`{ "taskId": string, "reason"?: string }`。
  - 结果：
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`。
  - `found` 报告台账是否有匹配任务。`cancelled`
    报告运行时是否接受或记录了取消。

`TaskSummary` 包含 `id`、`status`，以及可选元数据，例如 `kind`、
`runtime`、`title`、`agentId`、`sessionKey`、`childSessionKey`、`ownerKey`、
`runId`、`taskId`、`flowId`、`parentTaskId`、`sourceId`、时间戳、进度、
终止摘要和经过净化的错误文本。`agentId` 标识执行任务的智能体；
`sessionKey` 和 `ownerKey` 保留请求方和控制上下文。

### 操作员辅助方法

- 运维人员可以调用 `commands.list`（`operator.read`）来获取某个智能体的运行时
  命令清单。
  - `agentId` 是可选的；省略它会读取默认智能体工作区。
  - `scope` 控制主 `name` 面向哪个表面：
    - `text` 返回不带前导 `/` 的主文本命令令牌
    - `native` 和默认的 `both` 路径会在可用时返回感知提供商的原生命令名称
  - `textAliases` 携带精确的斜杠别名，例如 `/model` 和 `/m`。
  - `nativeName` 在存在时携带感知提供商的原生命令名称。
  - `provider` 是可选的，并且只影响原生命名以及原生插件命令可用性。
  - `includeArgs=false` 会从响应中省略序列化的参数元数据。
- 运维人员可以调用 `tools.catalog`（`operator.read`）来获取某个智能体的运行时工具目录。响应包含分组工具和来源元数据：
  - `source`：`core` 或 `plugin`
  - `pluginId`：当 `source="plugin"` 时的插件所有者
  - `optional`：插件工具是否为可选
- 运维人员可以调用 `tools.effective`（`operator.read`）来获取某个会话的运行时生效工具清单。
  - `sessionKey` 是必需的。
  - Gateway 网关会在服务端从会话派生受信任的运行时上下文，而不是接受调用方提供的凭证或投递上下文。
  - 响应是一个按会话限定、由服务端派生的活动清单投影，包含核心、插件、渠道以及已发现的 MCP 服务器工具。
  - 对于 MCP，`tools.effective` 是只读的：它可以通过最终工具策略投影一个已预热会话的 MCP 目录，但不会创建 MCP 运行时、连接传输协议或发出 `tools/list`。如果不存在匹配的已预热目录，响应可能包含诸如 `mcp-not-yet-connected`、`mcp-not-yet-listed` 或 `mcp-stale-catalog` 的提示。
  - 生效工具条目使用 `source="core"`、`source="plugin"`、`source="channel"` 或 `source="mcp"`。
- 运维人员可以调用 `tools.invoke`（`operator.write`），通过与 `/tools/invoke` 相同的 Gateway 网关策略路径调用一个可用工具。
  - `name` 是必需的。`args`、`sessionKey`、`agentId`、`confirm` 和
    `idempotencyKey` 是可选的。
  - 如果 `sessionKey` 和 `agentId` 同时存在，解析出的会话智能体必须匹配
    `agentId`。
  - 仅所有者可用的核心包装器（例如 `cron`、`gateway` 和 `nodes`）需要所有者/管理员身份（`operator.admin`），即使 `tools.invoke`
    方法本身是 `operator.write`。
  - 响应是面向 SDK 的信封，包含 `ok`、`toolName`、可选的 `output`，以及带类型的
    `error` 字段。审批或策略拒绝会在载荷中返回 `ok:false`，而不是绕过 Gateway 网关工具策略流水线。
- 运维人员可以调用 `skills.status`（`operator.read`）来获取某个智能体的可见
  Skills 清单。
  - `agentId` 是可选的；省略它会读取默认智能体工作区。
  - 响应包含资格、缺失要求、配置检查，以及已脱敏的安装选项，不会暴露原始密钥值。
- 运维人员可以调用 `skills.search` 和 `skills.detail`（`operator.read`）来获取
  ClawHub 发现元数据。
- 运维人员可以调用 `skills.upload.begin`、`skills.upload.chunk` 和
  `skills.upload.commit`（`operator.admin`）来暂存私有 Skills 归档，然后再安装它。这是面向受信任客户端的独立管理员上传路径，不是常规 ClawHub Skills 安装流程，并且默认禁用，除非启用
  `skills.install.allowUploadedArchives`。
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    会创建一个绑定到该 slug 和 force 值的上传。
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` 会在精确的解码偏移处追加字节。
  - `skills.upload.commit({ uploadId, sha256? })` 会验证最终大小和
    SHA-256。提交只会完成上传；它不会安装该 Skills。
  - 上传的 Skills 归档是包含 `SKILL.md` 根文件的 zip 归档。归档的内部目录名称永远不会选择安装目标。
- 运维人员可以用三种模式调用 `skills.install`（`operator.admin`）：
  - ClawHub 模式：`{ source: "clawhub", slug, version?, force? }` 会将一个
    Skills 文件夹安装到默认智能体工作区的 `skills/` 目录。
  - 上传模式：`{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    会将已提交的上传安装到默认智能体工作区的 `skills/<slug>`
    目录。slug 和 force 值必须匹配原始
    `skills.upload.begin` 请求。除非启用
    `skills.install.allowUploadedArchives`，否则会拒绝此模式。该设置不会影响
    ClawHub 安装。
  - Gateway 网关安装器模式：`{ name, installId, timeoutMs? }`
    会在 Gateway 网关主机上运行已声明的 `metadata.openclaw.install` 操作。
    旧客户端仍可能发送 `dangerouslyForceUnsafeInstall`；此字段已弃用，仅为协议兼容性而接受，并会被忽略。请使用
    `security.installPolicy` 进行运维人员拥有的安装决策。
- 运维人员可以用两种模式调用 `skills.update`（`operator.admin`）：
  - ClawHub 模式会更新一个已跟踪的 slug，或更新默认智能体工作区中所有已跟踪的 ClawHub 安装。
  - 配置模式会修补 `skills.entries.<skillKey>` 值，例如 `enabled`、
    `apiKey` 和 `env`。

### `models.list` 视图

`models.list` 接受一个可选的 `view` 参数：

- 省略或 `"default"`：当前运行时行为。如果配置了 `agents.defaults.models`，响应就是允许的目录，包括为 `provider/*` 条目动态发现的模型。否则响应是完整 Gateway 网关目录。
- `"configured"`：适合选择器大小的行为。如果配置了 `agents.defaults.models`，它仍然优先，包括针对 `provider/*` 条目的按提供商限定发现。没有允许列表时，响应使用显式的 `models.providers.*.models` 条目，并且只有在不存在已配置模型行时才回退到完整目录。
- `"all"`：完整 Gateway 网关目录，绕过 `agents.defaults.models`。将它用于诊断和发现 UI，而不是常规模型选择器。

## Exec 审批

- 当 exec 请求需要审批时，Gateway 网关会广播 `exec.approval.requested`。
- 运维客户端通过调用 `exec.approval.resolve` 来解析（需要 `operator.approvals` 作用域）。
- 对于 `host=node`，`exec.approval.request` 必须包含 `systemRunPlan`（规范的 `argv`/`cwd`/`rawCommand`/会话元数据）。缺少 `systemRunPlan` 的请求会被拒绝。
- 审批后，转发的 `node.invoke system.run` 调用会复用该规范的
  `systemRunPlan`，作为权威命令/cwd/会话上下文。
- 如果调用方在准备阶段和最终已审批的 `system.run` 转发之间修改了 `command`、`rawCommand`、`cwd`、`agentId` 或
  `sessionKey`，Gateway 网关会拒绝运行，而不是信任被修改的载荷。

## 智能体投递回退

- `agent` 请求可以包含 `deliver=true` 来请求出站投递。
- `bestEffortDeliver=false` 保持严格行为：无法解析或仅内部的投递目标会返回 `INVALID_REQUEST`。
- `bestEffortDeliver=true` 允许在无法解析外部可投递路由时回退到仅会话执行（例如内部/webchat 会话或存在歧义的多渠道配置）。
- 最终 `agent` 结果在请求投递时可能包含 `result.deliveryStatus`，使用与 [`openclaw agent --json --deliver`](/zh-CN/cli/agent#json-delivery-status) 文档中相同的 `sent`、`suppressed`、`partial_failed` 和 `failed`
  状态。

## 版本控制

- `PROTOCOL_VERSION` 位于 `packages/gateway-protocol/src/version.ts`。
- 客户端发送 `minProtocol` + `maxProtocol`；服务器会拒绝不包含其当前协议的范围。当前客户端和服务器需要协议 v4。
- 架构 + 模型由 TypeBox 定义生成：
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### 客户端常量

`src/gateway/client.ts` 中的参考客户端使用这些默认值。值在协议 v4 中保持稳定，并且是第三方客户端的预期基线。

| 常量                                      | 默认值                                                | 来源                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| 请求超时（每个 RPC）                      | `30_000` ms                                           | `src/gateway/client.ts`（`requestTimeoutMs`）                                              |
| 预认证 / 连接质询超时                     | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts`（配置/环境变量可以提高配对的服务器/客户端预算）        |
| 初始重连退避                              | `1_000` ms                                            | `src/gateway/client.ts`（`backoffMs`）                                                     |
| 最大重连退避                              | `30_000` ms                                           | `src/gateway/client.ts`（`scheduleReconnect`）                                             |
| 设备令牌关闭后的快速重试钳制              | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` 前的强制停止宽限            | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` 默认超时                  | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| 默认 tick 间隔（`hello-ok` 前）            | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| tick 超时关闭                             | 静默超过 `tickIntervalMs * 2` 时使用代码 `4000`       | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024`（25 MB）                           | `src/gateway/server-constants.ts`                                                          |

服务器会在 `hello-ok` 中通告生效的 `policy.tickIntervalMs`、`policy.maxPayload`
和 `policy.maxBufferedBytes`；客户端应遵循这些值，而不是握手前默认值。

## 凭证

- 共享密钥 Gateway 网关认证会使用 `connect.params.auth.token` 或
  `connect.params.auth.password`，具体取决于配置的认证模式。
- 携带身份的模式，例如 Tailscale Serve
  (`gateway.auth.allowTailscale: true`) 或非环回
  `gateway.auth.mode: "trusted-proxy"`，会通过请求标头满足连接认证检查，
  而不是通过 `connect.params.auth.*`。
- 私有入口 `gateway.auth.mode: "none"` 会完全跳过共享密钥连接认证；
  不要在公共/不受信任的入口上暴露该模式。
- 配对后，Gateway 网关会签发一个限定到连接角色 + 作用域的**设备令牌**。
  它会在 `hello-ok.auth.deviceToken` 中返回，并应由客户端持久保存以供后续连接使用。
- 客户端应在任何成功连接后持久保存主 `hello-ok.auth.deviceToken`。
- 使用该**已存储**设备令牌重新连接时，也应复用该令牌已存储的已批准作用域集合。
  这会保留已授予的读/探测/状态访问权限，并避免在重连时静默收缩为更窄的隐式仅管理员作用域。
- 客户端连接认证组装（`src/gateway/client.ts` 中的 `selectConnectAuth`）：
  - `auth.password` 是正交的，并且设置后始终会转发。
  - `auth.token` 按优先级填充：显式共享令牌优先，
    然后是显式 `deviceToken`，再然后是已存储的每设备令牌（按
    `deviceId` + `role` 作为键）。
  - 仅当上述任何方式都未解析出 `auth.token` 时，才会发送
    `auth.bootstrapToken`。共享令牌或任何已解析的设备令牌都会抑制它。
  - 在一次性 `AUTH_TOKEN_MISMATCH` 重试中自动提升已存储设备令牌，仅限于**受信任端点**：
    环回，或带有固定 `tlsFingerprint` 的 `wss://`。未固定的公共 `wss://`
    不符合条件。
- 内置设置代码引导会返回主节点
  `hello-ok.auth.deviceToken`，并在 `hello-ok.auth.deviceTokens`
  中返回一个有界的操作员令牌，用于受信任的移动端交接。操作员令牌包含
  `operator.talk.secrets`，用于读取原生 Talk 配置，并排除
  `operator.admin` 和 `operator.pairing`。
- 当非基线设置代码引导正在等待批准时，`PAIRING_REQUIRED`
  详情会包含 `recommendedNextStep: "wait_then_retry"`、`retryable: true`
  和 `pauseReconnect: false`。客户端应使用同一个引导令牌持续重连，
  直到请求获得批准或令牌失效。
- 仅当连接在受信任传输（例如 `wss://` 或环回/本地配对）上使用引导认证时，
  才持久保存 `hello-ok.auth.deviceTokens`。
- 如果客户端提供**显式** `deviceToken` 或显式 `scopes`，
  该调用方请求的作用域集合仍具有权威性；仅当客户端复用已存储的每设备令牌时，
  才会复用缓存的作用域。
- 设备令牌可以通过 `device.token.rotate` 和
  `device.token.revoke` 轮换/撤销（需要 `operator.pairing` 作用域）。
  轮换或撤销节点或其他非操作员角色还需要 `operator.admin`。
- `device.token.rotate` 会返回轮换元数据。只有对于已使用该设备令牌认证的同设备调用，
  它才会回显替换用 bearer 令牌，以便仅令牌客户端能在重新连接前持久保存替换令牌。
  共享/管理员轮换不会回显 bearer 令牌。
- 令牌签发、轮换和撤销都限制在该设备配对条目中记录的已批准角色集合内；
  令牌变更无法扩展或指向配对批准从未授予的设备角色。
- 对于已配对设备的令牌会话，除非调用方也拥有 `operator.admin`，
  否则设备管理是自限定的：非管理员调用方只能管理其**自己**设备条目的操作员令牌。
  节点和其他非操作员令牌管理仅限管理员，即使目标是调用方自己的设备也是如此。
- `device.token.rotate` 和 `device.token.revoke` 还会根据调用方当前会话作用域，
  检查目标操作员令牌作用域集合。非管理员调用方无法轮换或撤销比自己已持有范围更宽的操作员令牌。
- 认证失败会包含 `error.details.code` 以及恢复提示：
  - `error.details.canRetryWithDeviceToken`（布尔值）
  - `error.details.recommendedNextStep`（`retry_with_device_token`、`update_auth_configuration`、`update_auth_credentials`、`wait_then_retry`、`review_auth_configuration`）
- `AUTH_TOKEN_MISMATCH` 的客户端行为：
  - 受信任客户端可以使用缓存的每设备令牌尝试一次有界重试。
  - 如果该重试失败，客户端应停止自动重连循环，并呈现操作员操作指引。
- `AUTH_SCOPE_MISMATCH` 表示设备令牌已被识别，但未覆盖请求的角色/作用域。
  客户端不应将其呈现为坏令牌；应提示操作员重新配对，或批准更窄/更宽的作用域契约。

## 设备身份 + 配对

- 节点应包含从密钥对指纹派生的稳定设备身份（`device.id`）。
- Gateway 网关按设备 + 角色签发令牌。
- 新设备 ID 需要配对批准，除非启用了本地自动批准。
- 配对自动批准以直接 local loopback 连接为中心。
- OpenClaw 还有一条狭窄的后端/容器本地自连接路径，用于受信任的共享密钥辅助流程。
- 同主机 tailnet 或 LAN 连接仍会被视为远程配对，并需要批准。
- WS 客户端通常会在 `connect` 期间包含 `device` 身份（操作员 + 节点）。
  唯一不带设备的操作员例外是显式信任路径：
  - `gateway.controlUi.allowInsecureAuth=true`，用于仅 localhost 的不安全 HTTP 兼容性。
  - 成功的 `gateway.auth.mode: "trusted-proxy"` 操作员 Control UI 认证。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（紧急破窗，严重降低安全性）。
  - 保留的内部辅助路径上的直接环回 `gateway-client` 后端 RPC。
- 省略设备身份会影响作用域。当不带设备的操作员连接通过显式信任路径被允许时，
  OpenClaw 仍会将自声明作用域清空为空集合，除非该路径有具名的作用域保留例外。
  受作用域门控的方法随后会因 `missing scope` 失败。
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` 是一条 Control UI
  紧急破窗作用域保留路径。它不会向任意自定义后端或 CLI 形态的 WebSocket 客户端授予作用域。
- 保留的直接环回 `gateway-client` 后端辅助路径仅为内部本地控制平面 RPC 保留作用域；
  自定义后端 ID 不会获得此例外。
- 所有连接都必须签名服务器提供的 `connect.challenge` nonce。

### 设备认证迁移诊断

对于仍使用挑战前签名行为的旧版客户端，`connect` 现在会在 `error.details.code`
下返回 `DEVICE_AUTH_*` 详情代码，并带有稳定的 `error.details.reason`。

常见迁移失败：

| 消息                        | details.code                     | details.reason           | 含义                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 客户端省略了 `device.nonce`（或发送为空）。        |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 客户端使用陈旧/错误的 nonce 进行签名。            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 签名载荷与 v2 载荷不匹配。                        |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 签名时间戳超出允许偏差。                          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` 与公钥指纹不匹配。                    |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公钥格式/规范化失败。                             |

迁移目标：

- 始终等待 `connect.challenge`。
- 签名包含服务器 nonce 的 v2 载荷。
- 在 `connect.params.device.nonce` 中发送同一个 nonce。
- 首选签名载荷是 `v3`，除了设备/客户端/角色/作用域/令牌/nonce 字段外，
  还会绑定 `platform` 和 `deviceFamily`。
- 为了兼容性，旧版 `v2` 签名仍会被接受，但已配对设备的元数据固定仍会控制重连时的命令策略。

## TLS + 固定

- WS 连接支持 TLS。
- 客户端可以选择固定 Gateway 网关证书指纹（参见 `gateway.tls`
  配置，以及 `gateway.remote.tlsFingerprint` 或 CLI `--tls-fingerprint`）。

## 作用域

此协议暴露**完整 Gateway 网关 API**（状态、渠道、模型、聊天、
智能体、会话、节点、审批等）。确切表面由
`packages/gateway-protocol/src/schema.ts` 中的 TypeBox schema 定义。

## 相关

- [桥接协议](/zh-CN/gateway/bridge-protocol)
- [Gateway 网关运行手册](/zh-CN/gateway)

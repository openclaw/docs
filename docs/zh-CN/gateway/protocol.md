---
read_when:
    - 实现或更新 Gateway 网关 WS 客户端
    - 调试协议不匹配或连接失败
    - 重新生成协议模式/模型
summary: Gateway 网关 WebSocket 协议：握手、帧、版本控制
title: Gateway 网关协议
x-i18n:
    generated_at: "2026-05-06T01:51:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a5eb7a84dbe0664fd78271408686a643dbc0579de5b5402fd1a8d33fd59221d
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway 网关 WS 协议是 OpenClaw 的**唯一控制平面 + 节点传输协议**。所有客户端（CLI、Web UI、macOS app、iOS/Android 节点、无头节点）都通过 WebSocket 连接，并在握手时声明它们的**角色** + **作用域**。

## 传输

- WebSocket，带 JSON 载荷的文本帧。
- 第一帧**必须**是 `connect` 请求。
- 连接前帧上限为 64 KiB。握手成功后，客户端应遵循 `hello-ok.policy.maxPayload` 和 `hello-ok.policy.maxBufferedBytes` 限制。启用诊断后，超大的入站帧和缓慢的出站缓冲区会在 Gateway 网关闭合连接或丢弃受影响帧之前发出 `payload.large` 事件。这些事件会保留大小、限制、表面以及安全原因代码。它们不会保留消息正文、附件内容、原始帧正文、令牌、Cookie 或秘密值。

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
    "maxProtocol": 3,
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
    "protocol": 3,
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

当 Gateway 网关仍在完成启动 sidecar 时，`connect` 请求可能返回可重试的 `UNAVAILABLE` 错误，其中 `details.reason` 设置为 `"startup-sidecars"` 并带有 `retryAfterMs`。客户端应在其整体连接预算内重试该响应，而不是将其作为终止性的握手失败呈现。

`server`、`features`、`snapshot` 和 `policy` 都是 schema（`src/gateway/protocol/schema/frames.ts`）要求的字段。`auth` 也是必需的，并报告协商后的角色/作用域。`canvasHostUrl` 是可选的。

未签发设备令牌时，`hello-ok.auth` 会报告不含令牌字段的协商权限：

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

受信任的同进程后端客户端（`client.id: "gateway-client"`、`client.mode: "backend"`）在使用共享 Gateway 网关令牌/密码认证时，可以在直接 local loopback 连接中省略 `device`。此路径保留给内部控制平面 RPC，并避免过期的 CLI/设备配对基线阻塞本地后端工作，例如子智能体会话更新。远程客户端、浏览器来源客户端、节点客户端以及显式设备令牌/设备身份客户端仍使用正常的配对和作用域升级检查。

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

在受信任的启动交接期间，`hello-ok.auth` 也可能在 `deviceTokens` 中包含额外的有界角色条目：

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

对于内置节点/operator 启动流程，主节点令牌保持 `scopes: []`，任何交接的 operator 令牌都限制在启动 operator 允许列表（`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`）内。启动作用域检查保持角色前缀：operator 条目只满足 operator 请求，非 operator 角色仍需要其自身角色前缀下的作用域。

### 节点示例

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
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

完整的 operator 作用域模型、审批时检查和共享秘密语义，请参阅 [Operator 作用域](/zh-CN/gateway/operator-scopes)。

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

带 `includeSecrets: true` 的 `talk.config` 需要 `operator.talk.secrets`（或 `operator.admin`）。

插件注册的 Gateway 网关 RPC 方法可以请求自己的 operator 作用域，但保留的核心 admin 前缀（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）始终解析为 `operator.admin`。

方法作用域只是第一道门。一些通过 `chat.send` 到达的斜杠命令会在此基础上应用更严格的命令级检查。例如，持久化 `/config set` 和 `/config unset` 写入需要 `operator.admin`。

`node.pair.approve` 在基础方法作用域之上还有额外的审批时作用域检查：

- 无命令请求：`operator.pairing`
- 带非 exec 节点命令的请求：`operator.pairing` + `operator.write`
- 包含 `system.run`、`system.run.prepare` 或 `system.which` 的请求：`operator.pairing` + `operator.admin`

### 能力/命令/权限（node）

节点在连接时声明能力声明：

- `caps`：高级能力类别，例如 `camera`、`canvas`、`screen`、`location`、`voice` 和 `talk`。
- `commands`：用于 invoke 的命令允许列表。
- `permissions`：细粒度开关（例如 `screen.record`、`camera.capture`）。

Gateway 网关将这些视为**声明**，并执行服务器端允许列表。

## 在线状态

- `system-presence` 返回按设备身份键控的条目。
- 在线状态条目包含 `deviceId`、`roles` 和 `scopes`，因此即使设备同时以 **operator** 和 **node** 身份连接，UI 也能为每个设备显示单行。
- `node.list` 包含可选的 `lastSeenAtMs` 和 `lastSeenReason` 字段。已连接节点以 `lastSeenAtMs` 报告其当前连接时间，原因为 `connect`；当受信任的节点事件更新其配对元数据时，已配对节点也可以报告持久的后台在线状态。

### 节点后台存活事件

节点可以使用 `event: "node.presence.alive"` 调用 `node.event`，以记录已配对节点在后台唤醒期间曾处于存活状态，而不将其标记为已连接。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` 是一个封闭枚举：`background`、`silent_push`、`bg_app_refresh`、`significant_location`、`manual` 或 `connect`。未知的触发器字符串会在持久化前由 Gateway 网关规范化为 `background`。该事件仅对已认证的节点设备会话持久化；无设备或未配对会话返回 `handled: false`。

成功的 Gateway 网关返回结构化结果：

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

较旧的 Gateway 网关仍可能为 `node.event` 返回 `{ "ok": true }`；客户端应将其视为已确认的 RPC，而不是持久在线状态已保存。

## 广播事件作用域限定

服务器推送的 WebSocket 广播事件受作用域门控，因此仅限配对作用域或仅节点会话不会被动接收会话内容。

- **聊天、智能体和工具结果帧**（包括流式 `agent` 事件和工具调用结果）至少需要 `operator.read`。没有 `operator.read` 的会话会完全跳过这些帧。
- **插件定义的 `plugin.*` 广播**会根据插件注册方式受 `operator.write` 或 `operator.admin` 门控。
- **Status 和传输事件**（`heartbeat`、`presence`、`tick`、连接/断开生命周期等）保持不受限制，以便每个已认证会话都能观察传输健康状态。
- **未知广播事件族**默认受作用域门控（失败关闭），除非注册的处理程序显式放宽限制。

每个客户端连接都会保留自己的逐客户端序列号，因此即使不同客户端看到事件流中不同的作用域过滤子集，广播也会在该 socket 上保持单调顺序。

## 常见 RPC 方法族

公开 WS 表面比上面的握手/认证示例更广。这不是生成的完整转储，`hello-ok.features.methods` 是一个保守的发现列表，由 `src/gateway/server-methods-list.ts` 加上已加载的插件/渠道方法导出构建。请将其视为功能发现，而不是 `src/gateway/server-methods/*.ts` 的完整枚举。

<AccordionGroup>
  <Accordion title="系统和身份">
    - `health` 返回缓存的或新探测的 Gateway 网关健康快照。
    - `diagnostics.stability` 返回最近的有界诊断稳定性记录器。它保留事件名称、计数、字节大小、内存读数、队列/会话状态、渠道/插件名称和会话 ID 等操作元数据。它不会保留聊天文本、webhook 正文、工具输出、原始请求或响应正文、令牌、Cookie 或秘密值。需要 operator read 作用域。
    - `status` 返回 `/status` 风格的 Gateway 网关摘要；敏感字段仅包含在具备 admin 作用域的 operator 客户端中。
    - `gateway.identity.get` 返回 relay 和配对流程使用的 Gateway 网关设备身份。
    - `system-presence` 返回已连接 operator/node 设备的当前在线状态快照。
    - `system-event` 追加系统事件，并可更新/广播在线状态上下文。
    - `last-heartbeat` 返回最新持久化的 Heartbeat 事件。
    - `set-heartbeats` 切换 Gateway 网关上的 Heartbeat 处理。

  </Accordion>

  <Accordion title="Models 和使用情况">
    - `models.list` 返回运行时允许的模型目录。传入 `{ "view": "configured" }` 可获取适合选择器显示的已配置模型（先是 `agents.defaults.models`，再是 `models.providers.*.models`），或传入 `{ "view": "all" }` 获取完整目录。
    - `usage.status` 返回提供商使用窗口/剩余额度摘要。
    - `usage.cost` 返回某个日期范围的聚合成本使用摘要。
    - `doctor.memory.status` 返回当前默认智能体工作区的向量记忆 / 缓存嵌入就绪状态。仅当调用方明确需要实时 ping 嵌入提供商时，才传入 `{ "probe": true }` 或 `{ "deep": true }`。
    - `doctor.memory.remHarness` 为远程控制平面客户端返回有界的只读 REM harness 预览。它可以包含工作区路径、记忆片段、渲染后的有依据 markdown，以及深度提升候选项，因此调用方需要 `operator.read`。
    - `sessions.usage` 返回按会话划分的使用摘要。
    - `sessions.usage.timeseries` 返回一个会话的时间序列使用情况。
    - `sessions.usage.logs` 返回一个会话的使用日志条目。

  </Accordion>

  <Accordion title="渠道和登录辅助工具">
    - `channels.status` 返回内置 + 捆绑渠道/插件状态摘要。
    - `channels.logout` 注销支持注销的特定渠道/账号。
    - `web.login.start` 为当前支持二维码的 Web 渠道提供商启动二维码/Web 登录流程。
    - `web.login.wait` 等待该二维码/Web 登录流程完成，并在成功后启动渠道。
    - `push.test` 向已注册的 iOS 节点发送测试 APNs 推送。
    - `voicewake.get` 返回已存储的唤醒词触发器。
    - `voicewake.set` 更新唤醒词触发器并广播更改。

  </Accordion>

  <Accordion title="消息和日志">
    - `send` 是直接出站投递 RPC，用于在聊天运行器外按渠道/账号/线程目标发送消息。
    - `logs.tail` 返回配置的 Gateway 网关文件日志尾部内容，并带有游标/限制和最大字节控制。

  </Accordion>

  <Accordion title="Talk 和 TTS">
    - `talk.catalog` 返回只读 Talk 提供商目录，用于语音、流式转录和实时语音。它包含提供商 ID、标签、已配置状态、公开的模型/语音 ID、规范模式、传输协议、brain 策略，以及实时音频/能力标志，不会返回提供商密钥或修改全局配置。
    - `talk.config` 返回有效的 Talk 配置载荷；`includeSecrets` 需要 `operator.talk.secrets`（或 `operator.admin`）。
    - `talk.session.create` 为 `realtime/gateway-relay`、`transcription/gateway-relay` 或 `stt-tts/managed-room` 创建由 Gateway 网关拥有的 Talk 会话。`brain: "direct-tools"` 需要 `operator.admin`。
    - `talk.session.join` 验证托管房间会话令牌，按需发出 `session.ready` 或 `session.replaced` 事件，并返回房间/会话元数据以及最近的 Talk 事件，不包含明文令牌或已存储的令牌哈希。
    - `talk.session.appendAudio` 将 base64 PCM 输入音频追加到由 Gateway 网关拥有的实时中继和转录会话。
    - `talk.session.startTurn`、`talk.session.endTurn` 和 `talk.session.cancelTurn` 驱动托管房间轮次生命周期，并在状态清除前拒绝过期轮次。
    - `talk.session.cancelOutput` 停止助手音频输出，主要用于 Gateway 网关中继会话中由 VAD 门控的插话。
    - `talk.session.submitToolResult` 完成由 Gateway 网关拥有的实时中继会话发出的提供商工具调用。
    - `talk.session.close` 关闭由 Gateway 网关拥有的中继、转录或托管房间会话，并发出终止 Talk 事件。
    - `talk.mode` 为 WebChat/Control UI 客户端设置/广播当前 Talk 模式状态。
    - `talk.client.create` 使用 `webrtc` 或 `provider-websocket` 创建客户端拥有的实时提供商会话，同时由 Gateway 网关拥有配置、凭证、指令和工具策略。
    - `talk.client.toolCall` 允许客户端拥有的实时传输将提供商工具调用转发给 Gateway 网关策略。第一个受支持的工具是 `openclaw_agent_consult`；客户端接收一个运行 ID，并等待正常聊天生命周期事件后再提交特定提供商的工具结果。
    - `talk.event` 是用于实时、转录、STT/TTS、托管房间、电话和会议适配器的单一 Talk 事件渠道。
    - `talk.speak` 通过当前活跃的 Talk 语音提供商合成语音。
    - `tts.status` 返回 TTS 启用状态、活跃提供商、回退提供商和提供商配置状态。
    - `tts.providers` 返回可见的 TTS 提供商清单。
    - `tts.enable` 和 `tts.disable` 切换 TTS 偏好设置状态。
    - `tts.setProvider` 更新首选 TTS 提供商。
    - `tts.convert` 运行一次性文本转语音转换。

  </Accordion>

  <Accordion title="密钥、配置、更新和向导">
    - `secrets.reload` 重新解析活跃的 SecretRefs，并且仅在完全成功时替换运行时密钥状态。
    - `secrets.resolve` 为特定命令/目标集合解析面向命令目标的密钥分配。
    - `config.get` 返回当前配置快照和哈希。
    - `config.set` 写入已验证的配置载荷。
    - `config.patch` 合并局部配置更新。
    - `config.apply` 验证并替换完整配置载荷。
    - `config.schema` 返回 Control UI 和 CLI 工具使用的实时配置 schema 载荷：schema、`uiHints`、版本和生成元数据，包括运行时可加载时的插件 + 渠道 schema 元数据。该 schema 包含字段 `title` / `description` 元数据，来源于 UI 使用的相同标签和帮助文本；当存在匹配的字段文档时，也包括嵌套对象、通配符、数组项，以及 `anyOf` / `oneOf` / `allOf` 组合分支。
    - `config.schema.lookup` 返回一个配置路径的路径范围查找载荷：规范化路径、浅层 schema 节点、匹配的提示 + `hintPath`，以及用于 UI/CLI 下钻的直接子项摘要。查找 schema 节点保留面向用户的文档和常见验证字段（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、数字/字符串/数组/对象边界，以及 `additionalProperties`、`deprecated`、`readOnly`、`writeOnly` 等标志）。子项摘要公开 `key`、规范化 `path`、`type`、`required`、`hasChildren`，以及匹配的 `hint` / `hintPath`。
    - `update.run` 运行 Gateway 网关更新流程，并且仅当更新本身成功时安排重启；带有会话的调用方可以包含 `continuationMessage`，这样启动会通过重启延续队列恢复一个后续智能体轮次。包管理器更新会在包替换后强制进行非延迟、无冷却时间的更新重启，避免旧 Gateway 网关进程继续从已替换的 `dist` 树中惰性加载。
    - `update.status` 返回最新缓存的更新重启哨兵，包括可用时重启后的运行版本。
    - `wizard.start`、`wizard.next`、`wizard.status` 和 `wizard.cancel` 通过 WS RPC 暴露新手引导向导。

  </Accordion>

  <Accordion title="智能体和工作区辅助工具">
    - `agents.list` 返回已配置的智能体条目，包括有效模型和运行时元数据。
    - `agents.create`、`agents.update` 和 `agents.delete` 管理智能体记录和工作区连接。
    - `agents.files.list`、`agents.files.get` 和 `agents.files.set` 管理为智能体公开的引导工作区文件。
    - `artifacts.list`、`artifacts.get` 和 `artifacts.download` 为显式 `sessionKey`、`runId` 或 `taskId` 范围公开从转录衍生的工件摘要和下载。运行和任务查询会在服务器端解析所属会话，并且仅返回具有匹配来源的转录媒体；不安全或本地 URL 来源会返回不支持的下载，而不是在服务器端抓取。
    - `environments.list` 和 `environments.status` 为 SDK 客户端公开只读的 Gateway 网关本地和节点环境发现。
    - `agent.identity.get` 返回智能体或会话的有效助手身份。
    - `agent.wait` 等待运行完成，并在可用时返回终止快照。

  </Accordion>

  <Accordion title="会话控制">
    - `sessions.list` 返回当前会话索引，包括配置了智能体运行时后端时每行的 `agentRuntime` 元数据。
    - `sessions.subscribe` 和 `sessions.unsubscribe` 为当前 WS 客户端切换会话更改事件订阅。
    - `sessions.messages.subscribe` 和 `sessions.messages.unsubscribe` 为一个会话切换转录/消息事件订阅。
    - `sessions.preview` 返回特定会话键的有界转录预览。
    - `sessions.describe` 返回精确会话键对应的一行 Gateway 网关会话。
    - `sessions.resolve` 解析或规范化会话目标。
    - `sessions.create` 创建新的会话条目。
    - `sessions.send` 向现有会话发送消息。
    - `sessions.steer` 是活跃会话的中断并 Steer 变体。
    - `sessions.abort` 中止会话的活跃工作。调用方可以传入 `key` 和可选的 `runId`，或者对于 Gateway 网关可以解析到会话的活跃运行，仅传入 `runId`。
    - `sessions.patch` 更新会话元数据/覆盖项，并报告已解析的规范模型以及有效的 `agentRuntime`。
    - `sessions.reset`、`sessions.delete` 和 `sessions.compact` 执行会话维护。
    - `sessions.get` 返回完整的已存储会话行。
    - 聊天执行仍使用 `chat.history`、`chat.send`、`chat.abort` 和 `chat.inject`。`chat.history` 会为 UI 客户端进行显示规范化：从可见文本中剥离内联指令标签，剥离纯文本工具调用 XML 载荷（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及被截断的工具调用块）和泄漏的 ASCII/全角模型控制令牌，省略纯静默令牌助手行，例如精确的 `NO_REPLY` / `no_reply`，并且可将超大行替换为占位符。

  </Accordion>

  <Accordion title="设备配对和设备令牌">
    - `device.pair.list` 返回待处理和已批准的配对设备。
    - `device.pair.approve`、`device.pair.reject` 和 `device.pair.remove` 管理设备配对记录。
    - `device.token.rotate` 在已批准角色和调用方范围边界内轮换配对设备令牌。
    - `device.token.revoke` 在已批准角色和调用方范围边界内撤销配对设备令牌。

  </Accordion>

  <Accordion title="节点配对、调用和待处理工作">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove` 和 `node.pair.verify` 覆盖节点配对和引导验证。
    - `node.list` 和 `node.describe` 返回已知/已连接节点状态。
    - `node.rename` 更新配对节点标签。
    - `node.invoke` 将命令转发到已连接节点。
    - `node.invoke.result` 返回调用请求的结果。
    - `node.event` 将节点发起的事件带回 Gateway 网关。
    - `node.canvas.capability.refresh` 刷新限定范围的画布能力令牌。
    - `node.pending.pull` 和 `node.pending.ack` 是已连接节点队列 API。
    - `node.pending.enqueue` 和 `node.pending.drain` 管理离线/断开连接节点的持久待处理工作。

  </Accordion>

  <Accordion title="审批系列">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list` 和 `exec.approval.resolve` 覆盖一次性执行审批请求以及待处理审批的查询/重放。
    - `exec.approval.waitDecision` 等待一个待处理的执行审批，并返回最终决策（超时时返回 `null`）。
    - `exec.approvals.get` 和 `exec.approvals.set` 管理 Gateway 网关执行审批策略快照。
    - `exec.approvals.node.get` 和 `exec.approvals.node.set` 通过节点中继命令管理节点本地的执行审批策略。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision` 和 `plugin.approval.resolve` 覆盖插件定义的审批流程。

  </Accordion>

  <Accordion title="自动化、Skills 和工具">
    - 自动化：`wake` 调度立即或下一次 Heartbeat 的唤醒文本注入；`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` 管理定时任务。
    - Skills 和工具：`commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。

  </Accordion>
</AccordionGroup>

### 常见事件系列

- `chat`：UI 聊天更新，例如 `chat.inject` 和其他仅限转录的聊天
  事件。
- `session.message` 和 `session.tool`：已订阅会话的转录/事件流更新。
- `sessions.changed`：会话索引或元数据已更改。
- `presence`：系统在线状态快照更新。
- `tick`：周期性保活 / 存活事件。
- `health`：Gateway 网关健康快照更新。
- `heartbeat`：Heartbeat 事件流更新。
- `cron`：cron 运行/任务变更事件。
- `shutdown`：Gateway 网关关闭通知。
- `node.pair.requested` / `node.pair.resolved`：节点配对生命周期。
- `node.invoke.request`：节点调用请求广播。
- `device.pair.requested` / `device.pair.resolved`：已配对设备生命周期。
- `voicewake.changed`：唤醒词触发配置已更改。
- `exec.approval.requested` / `exec.approval.resolved`：执行审批
  生命周期。
- `plugin.approval.requested` / `plugin.approval.resolved`：插件审批
  生命周期。

### 节点辅助方法

- 节点可以调用 `skills.bins`，以获取当前技能可执行文件列表，
  用于自动允许检查。

### 操作员辅助方法

- 操作员可以调用 `commands.list`（`operator.read`）来获取智能体的运行时
  命令清单。
  - `agentId` 是可选的；省略它可读取默认 Agent 工作区。
  - `scope` 控制主 `name` 目标所属的表面：
    - `text` 返回不带前导 `/` 的主文本命令令牌
    - `native` 和默认 `both` 路径在可用时返回提供商感知的原生命令名
  - `textAliases` 携带精确的斜杠别名，例如 `/model` 和 `/m`。
  - `nativeName` 在存在时携带提供商感知的原生命令名。
  - `provider` 是可选的，只影响原生命名以及原生插件命令可用性。
  - `includeArgs=false` 会从响应中省略序列化的参数元数据。
- 操作员可以调用 `tools.catalog`（`operator.read`）来获取智能体的运行时工具目录。响应包括分组工具和来源元数据：
  - `source`：`core` 或 `plugin`
  - `pluginId`：当 `source="plugin"` 时的插件所有者
  - `optional`：插件工具是否为可选
- 操作员可以调用 `tools.effective`（`operator.read`）来获取会话的运行时生效工具
  清单。
  - `sessionKey` 是必需的。
  - Gateway 网关会在服务端从会话派生可信运行时上下文，而不是接受
    调用方提供的认证或投递上下文。
  - 响应限定于会话范围，并反映当前活跃对话现在可以使用的内容，
    包括核心、插件和渠道工具。
- 操作员可以调用 `tools.invoke`（`operator.write`），通过与 `/tools/invoke`
  相同的 Gateway 网关策略路径调用一个可用工具。
  - `name` 是必需的。`args`、`sessionKey`、`agentId`、`confirm` 和
    `idempotencyKey` 是可选的。
  - 如果同时存在 `sessionKey` 和 `agentId`，解析出的会话智能体必须匹配
    `agentId`。
  - 响应是面向 SDK 的信封，包含 `ok`、`toolName`、可选的 `output` 和类型化
    `error` 字段。审批或策略拒绝会在载荷中返回 `ok:false`，而不是
    绕过 Gateway 网关工具策略管线。
- 操作员可以调用 `skills.status`（`operator.read`）来获取智能体的可见
  技能清单。
  - `agentId` 是可选的；省略它可读取默认 Agent 工作区。
  - 响应包括资格、缺失要求、配置检查，以及
    不暴露原始密钥值的已清理安装选项。
- 操作员可以调用 `skills.search` 和 `skills.detail`（`operator.read`）获取
  ClawHub 发现元数据。
- 操作员可以调用 `skills.install`（`operator.admin`），有两种模式：
  - ClawHub 模式：`{ source: "clawhub", slug, version?, force? }` 将
    技能文件夹安装到默认 Agent 工作区的 `skills/` 目录。
  - Gateway 网关安装器模式：`{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    在 Gateway 网关主机上运行声明的 `metadata.openclaw.install` 操作。
- 操作员可以调用 `skills.update`（`operator.admin`），有两种模式：
  - ClawHub 模式会更新默认 Agent 工作区中一个已跟踪的 slug，或所有已跟踪的 ClawHub 安装。
  - 配置模式会修补 `skills.entries.<skillKey>` 值，例如 `enabled`、
    `apiKey` 和 `env`。

### `models.list` 视图

`models.list` 接受可选的 `view` 参数：

- 省略或 `"default"`：当前运行时行为。如果已配置 `agents.defaults.models`，响应为允许的目录；否则响应为完整 Gateway 网关目录。
- `"configured"`：适合选择器规模的行为。如果已配置 `agents.defaults.models`，它仍然优先。否则响应使用显式的 `models.providers.*.models` 条目，仅在不存在已配置模型行时回退到完整目录。
- `"all"`：完整 Gateway 网关目录，绕过 `agents.defaults.models`。将其用于诊断和发现 UI，而不是普通模型选择器。

## 执行审批

- 当执行请求需要审批时，Gateway 网关会广播 `exec.approval.requested`。
- 操作员客户端通过调用 `exec.approval.resolve`（需要 `operator.approvals` 作用域）来处理。
- 对于 `host=node`，`exec.approval.request` 必须包含 `systemRunPlan`（规范 `argv`/`cwd`/`rawCommand`/会话元数据）。缺少 `systemRunPlan` 的请求会被拒绝。
- 审批后，转发的 `node.invoke system.run` 调用会复用该规范
  `systemRunPlan`，作为权威的命令/cwd/会话上下文。
- 如果调用方在准备和最终获批的 `system.run` 转发之间更改 `command`、`rawCommand`、`cwd`、`agentId` 或
  `sessionKey`，Gateway 网关会拒绝运行，而不是信任被更改的载荷。

## 智能体投递回退

- `agent` 请求可以包含 `deliver=true` 来请求出站投递。
- `bestEffortDeliver=false` 保持严格行为：无法解析或仅内部可用的投递目标返回 `INVALID_REQUEST`。
- `bestEffortDeliver=true` 允许在无法解析外部可投递路由时回退到仅会话执行（例如内部/webchat 会话或含糊的多渠道配置）。

## 版本管理

- `PROTOCOL_VERSION` 位于 `src/gateway/protocol/schema/protocol-schemas.ts`。
- 客户端发送 `minProtocol` + `maxProtocol`；服务器会拒绝不匹配的版本。
- 架构 + 模型由 TypeBox 定义生成：
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### 客户端常量

`src/gateway/client.ts` 中的参考客户端使用这些默认值。这些值在
协议 v3 中保持稳定，是第三方客户端的预期基线。

| 常量                                      | 默认值                                                | 来源                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| 请求超时（每个 RPC）                      | `30_000` ms                                           | `src/gateway/client.ts`（`requestTimeoutMs`）                                              |
| 预认证 / 连接挑战超时                     | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts`（config/env 可以提高已配对服务端/客户端预算）          |
| 初始重连退避                              | `1_000` ms                                            | `src/gateway/client.ts`（`backoffMs`）                                                     |
| 最大重连退避                              | `30_000` ms                                           | `src/gateway/client.ts`（`scheduleReconnect`）                                             |
| 设备令牌关闭后的快速重试限制              | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` 前的强制停止宽限            | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` 默认超时                  | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| 默认 tick 间隔（`hello-ok` 前）            | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Tick 超时关闭                             | 静默超过 `tickIntervalMs * 2` 时使用代码 `4000`       | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024`（25 MB）                           | `src/gateway/server-constants.ts`                                                          |

服务器会在 `hello-ok` 中通告生效的 `policy.tickIntervalMs`、`policy.maxPayload`
和 `policy.maxBufferedBytes`；客户端应遵循这些值，
而不是握手前的默认值。

## 认证

- 共享密钥 Gateway 网关身份验证使用 `connect.params.auth.token` 或
  `connect.params.auth.password`，具体取决于配置的身份验证模式。
- 带身份的模式，例如 Tailscale Serve
  (`gateway.auth.allowTailscale: true`) 或非 loopback 的
  `gateway.auth.mode: "trusted-proxy"`，会通过请求头满足 connect 身份验证检查，而不是使用
  `connect.params.auth.*`。
- 私有入口 `gateway.auth.mode: "none"` 会完全跳过共享密钥 connect 身份验证；
  不要在公共/不受信任的入口上暴露该模式。
- 配对后，Gateway 网关会颁发一个按连接角色 + scopes 限定范围的**设备令牌**。
  它会在 `hello-ok.auth.deviceToken` 中返回，并应由客户端持久保存，以供后续连接使用。
- 客户端应在任何成功连接后持久保存主 `hello-ok.auth.deviceToken`。
- 使用该**已存储**设备令牌重新连接时，也应复用为该令牌存储的已批准 scope 集。
  这会保留已授予的读取/探测/Status 访问权限，并避免将重新连接静默收窄为隐式的仅管理员 scope。
- 客户端 connect 身份验证组装（`src/gateway/client.ts` 中的 `selectConnectAuth`）：
  - `auth.password` 是正交的，设置后始终会转发。
  - `auth.token` 按优先级填充：先是显式共享令牌，然后是显式 `deviceToken`，再然后是已存储的按设备令牌（以
    `deviceId` + `role` 为键）。
  - 只有在以上都未解析出
    `auth.token` 时，才会发送 `auth.bootstrapToken`。共享令牌或任何解析出的设备令牌都会抑制它。
  - 在一次性
    `AUTH_TOKEN_MISMATCH` 重试中自动提升已存储设备令牌时，仅限于**受信任端点** —
    loopback，或带有固定 `tlsFingerprint` 的 `wss://`。未固定指纹的公共 `wss://`
    不符合条件。
- 额外的 `hello-ok.auth.deviceTokens` 条目是启动交接令牌。
  只有当 connect 在受信任传输上使用启动身份验证时，才持久保存它们，
  例如 `wss://` 或 loopback/local 配对。
- 如果客户端提供**显式** `deviceToken` 或显式 `scopes`，
  调用方请求的 scope 集仍然具有权威性；只有当客户端复用已存储的按设备令牌时，
  才会复用缓存的 scopes。
- 设备令牌可以通过 `device.token.rotate` 和
  `device.token.revoke` 轮换/撤销（需要 `operator.pairing` scope）。
- `device.token.rotate` 返回轮换元数据。它仅会对已经使用该设备令牌完成身份验证的同设备调用回显替换 bearer token，
  因此仅令牌客户端可以在重新连接前持久保存替换令牌。共享/管理员轮换不会回显 bearer token。
- 令牌颁发、轮换和撤销都限定在该设备配对条目中记录的已批准角色集内；令牌变更不能扩展或指向配对批准从未授予的设备角色。
- 对于已配对设备的令牌会话，除非调用方同时具有 `operator.admin`，否则设备管理是自作用域的：
  非管理员调用方只能移除/撤销/轮换其**自己的**设备条目。
- `device.token.rotate` 和 `device.token.revoke` 还会根据调用方当前会话 scopes
  检查目标 operator token scope 集。非管理员调用方不能轮换或撤销比自己已持有范围更宽的 operator token。
- 身份验证失败包含 `error.details.code` 以及恢复提示：
  - `error.details.canRetryWithDeviceToken`（布尔值）
  - `error.details.recommendedNextStep`（`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`）
- 客户端对 `AUTH_TOKEN_MISMATCH` 的行为：
  - 受信任客户端可以尝试一次有界重试，并使用缓存的按设备令牌。
  - 如果该重试失败，客户端应停止自动重新连接循环，并显示操作者操作指引。

## 设备身份 + 配对

- 节点应包含从密钥对指纹派生的稳定设备身份（`device.id`）。
- Gateway 网关会按设备 + 角色颁发令牌。
- 除非启用了本地自动批准，否则新的设备 ID 需要配对批准。
- 配对自动批准以直接 local loopback 连接为中心。
- OpenClaw 还有一个狭窄的后端/容器本地自连接路径，用于受信任的共享密钥辅助流程。
- 同主机 tailnet 或 LAN 连接在配对时仍被视为远程连接，并需要批准。
- WS 客户端通常会在 `connect` 期间包含 `device` 身份（operator +
  node）。唯一的无设备 operator 例外是显式信任路径：
  - `gateway.controlUi.allowInsecureAuth=true`，用于仅限 localhost 的不安全 HTTP 兼容性。
  - 成功的 `gateway.auth.mode: "trusted-proxy"` operator Control UI 身份验证。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（应急开关，严重降低安全性）。
  - 使用共享 Gateway 网关令牌/密码完成身份验证的 direct-loopback `gateway-client` 后端 RPC。
- 所有连接都必须签名服务器提供的 `connect.challenge` nonce。

### 设备身份验证迁移诊断

对于仍在使用挑战前签名行为的旧版客户端，`connect` 现在会在 `error.details.code` 下返回
`DEVICE_AUTH_*` 详情代码，并带有稳定的 `error.details.reason`。

常见迁移失败：

| 消息                        | details.code                     | details.reason           | 含义                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 客户端省略了 `device.nonce`（或发送为空）。        |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 客户端使用陈旧/错误的 nonce 签名。                |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 签名载荷与 v2 载荷不匹配。                        |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 签名时间戳超出允许偏差。                          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` 与公钥指纹不匹配。                    |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公钥格式/规范化失败。                             |

迁移目标：

- 始终等待 `connect.challenge`。
- 签名包含服务器 nonce 的 v2 载荷。
- 在 `connect.params.device.nonce` 中发送同一个 nonce。
- 首选签名载荷为 `v3`，除了设备/客户端/角色/scopes/令牌/nonce 字段外，
  还会绑定 `platform` 和 `deviceFamily`。
- 为兼容性仍接受旧版 `v2` 签名，但已配对设备的元数据固定仍会控制重新连接时的命令策略。

## TLS + 固定

- WS 连接支持 TLS。
- 客户端可以选择固定 Gateway 网关证书指纹（参见 `gateway.tls`
  配置，以及 `gateway.remote.tlsFingerprint` 或 CLI `--tls-fingerprint`）。

## 范围

此协议暴露**完整的 Gateway 网关 API**（Status、渠道、模型、聊天、
智能体、会话、节点、批准等）。确切的表面由
`src/gateway/protocol/schema.ts` 中的 TypeBox schemas 定义。

## 相关

- [Bridge protocol](/zh-CN/gateway/bridge-protocol)
- [Gateway 运行手册](/zh-CN/gateway)

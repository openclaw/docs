---
read_when:
    - 实现或更新 Gateway 网关 WS 客户端
    - 调试协议不匹配或连接失败
    - 重新生成协议架构/模型
summary: Gateway 网关 WebSocket 协议：握手、帧、版本控制
title: Gateway 网关协议
x-i18n:
    generated_at: "2026-05-01T08:21:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b80ee7d9a36f78b05b8ca83d70baf6ec53fc907ca25e8b4c2ab39350ff95c54
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway 网关 WS 协议是 OpenClaw 的**单一控制平面 + 节点传输协议**。
所有客户端（CLI、Web UI、macOS 应用、iOS/Android 节点、无头
节点）都通过 WebSocket 连接，并在握手时声明其**角色** + **作用域**。

## 传输协议

- WebSocket，带 JSON 载荷的文本帧。
- 第一帧**必须**是 `connect` 请求。
- 连接前帧大小上限为 64 KiB。握手成功后，客户端应遵循
  `hello-ok.policy.maxPayload` 和
  `hello-ok.policy.maxBufferedBytes` 限制。启用诊断后，
  过大的入站帧和缓慢的出站缓冲区会在 Gateway 网关关闭或丢弃受影响帧之前发出 `payload.large` 事件。
  这些事件会保留大小、限制、表面和安全原因代码。它们不会保留消息
  正文、附件内容、原始帧正文、令牌、Cookie 或密钥值。

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

当 Gateway 网关仍在完成启动 sidecar 时，`connect` 请求可能
返回可重试的 `UNAVAILABLE` 错误，其中 `details.reason` 设为
`"startup-sidecars"`，并带有 `retryAfterMs`。客户端应在其总体连接预算内重试该响应，
而不是将其作为终止性的握手失败呈现。

`server`、`features`、`snapshot` 和 `policy` 都是 schema
（`src/gateway/protocol/schema/frames.ts`）要求的字段。`auth` 也是必需字段，并报告
协商后的角色/作用域。`canvasHostUrl` 是可选字段。

未签发设备令牌时，`hello-ok.auth` 会报告协商后的
权限，不包含令牌字段：

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

受信任的同进程后端客户端（`client.id: "gateway-client"`，
`client.mode: "backend"`）在使用共享 Gateway 网关令牌/密码认证时，
可在直接 loopback 连接上省略 `device`。此路径仅保留给内部控制平面 RPC，
并避免过期的 CLI/设备配对基线阻塞本地后端工作，例如子智能体会话更新。
远程客户端、浏览器来源客户端、节点客户端，以及显式设备令牌/设备身份
客户端仍使用常规配对和作用域升级检查。

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

在受信任的启动交接期间，`hello-ok.auth` 也可能在 `deviceTokens` 中包含额外的
有界角色条目：

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

对于内置节点/operator 启动流程，主节点令牌保持
`scopes: []`，任何交接的 operator 令牌都保持受限于启动
operator 允许列表（`operator.approvals`、`operator.read`、
`operator.talk.secrets`、`operator.write`）。启动作用域检查保持
角色前缀约束：operator 条目只满足 operator 请求，非 operator
角色仍需要其自身角色前缀下的作用域。

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

带 `includeSecrets: true` 的 `talk.config` 需要 `operator.talk.secrets`
（或 `operator.admin`）。

插件注册的 Gateway 网关 RPC 方法可以请求自己的 operator 作用域，但
保留的核心管理员前缀（`config.*`、`exec.approvals.*`、`wizard.*`、
`update.*`）始终解析为 `operator.admin`。

方法作用域只是第一道门槛。通过 `chat.send` 触达的某些斜杠命令
会在其上应用更严格的命令级检查。例如，持久化
`/config set` 和 `/config unset` 写入需要 `operator.admin`。

`node.pair.approve` 在基础方法作用域之上，还会在批准时进行额外的作用域检查：

- 无命令请求：`operator.pairing`
- 带非 exec 节点命令的请求：`operator.pairing` + `operator.write`
- 包含 `system.run`、`system.run.prepare` 或 `system.which` 的请求：
  `operator.pairing` + `operator.admin`

### 能力/命令/权限（节点）

节点在连接时声明能力声明：

- `caps`：高级能力类别。
- `commands`：用于调用的命令允许列表。
- `permissions`：细粒度开关（例如 `screen.record`、`camera.capture`）。

Gateway 网关将这些视为**声明**，并强制执行服务器端允许列表。

## 在线状态

- `system-presence` 返回按设备身份键控的条目。
- 在线状态条目包含 `deviceId`、`roles` 和 `scopes`，因此 UI 可以为每台设备显示单行，
  即使它同时以 **operator** 和 **node** 身份连接。
- `node.list` 包含可选的 `lastSeenAtMs` 和 `lastSeenReason` 字段。已连接节点会将
  其当前连接时间作为 `lastSeenAtMs` 报告，原因是 `connect`；当受信任节点事件更新其配对元数据时，已配对节点也可以报告
  持久后台在线状态。

### 节点后台存活事件

节点可以调用带 `event: "node.presence.alive"` 的 `node.event`，以记录已配对节点在
后台唤醒期间处于存活状态，而不将其标记为已连接。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` 是封闭枚举：`background`、`silent_push`、`bg_app_refresh`、
`significant_location`、`manual` 或 `connect`。未知触发器字符串在持久化前会被 Gateway 网关规范化为
`background`。该事件仅对已认证的节点设备会话持久化；
无设备或未配对会话返回 `handled: false`。

成功的 Gateway 网关会返回结构化结果：

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

较旧的 Gateway 网关仍可能为 `node.event` 返回 `{ "ok": true }`；客户端应将其视为
已确认的 RPC，而不是持久在线状态的保存结果。

## 广播事件作用域限定

服务器推送的 WebSocket 广播事件受作用域控制，因此配对作用域或仅节点会话不会被动接收会话内容。

- **聊天、智能体和工具结果帧**（包括流式 `agent` 事件和工具调用结果）至少需要 `operator.read`。没有 `operator.read` 的会话会完全跳过这些帧。
- **插件定义的 `plugin.*` 广播**会根据插件注册方式受限于 `operator.write` 或 `operator.admin`。
- **Status 和传输事件**（`heartbeat`、`presence`、`tick`、连接/断开连接生命周期等）保持不受限制，以便每个已认证会话都能观察传输健康状况。
- **未知广播事件族**默认受作用域限制（失败关闭），除非注册处理程序明确放宽限制。

每个客户端连接都保留自己的每客户端序列号，因此即使不同客户端看到事件流中不同的作用域过滤子集，广播也能在该 socket 上保持单调顺序。

## 常见 RPC 方法族

公开 WS 表面比上面的握手/认证示例更广。这里
不是生成的转储；`hello-ok.features.methods` 是一个保守的
发现列表，由 `src/gateway/server-methods-list.ts` 加载的
插件/渠道方法导出构建。将其视为功能发现，而不是
`src/gateway/server-methods/*.ts` 的完整枚举。

<AccordionGroup>
  <Accordion title="系统和身份">
    - `health` 返回缓存的或新探测的 Gateway 网关健康快照。
    - `diagnostics.stability` 返回最近的有界诊断稳定性记录器。它保留事件名称、计数、字节大小、内存读数、队列/会话状态、渠道/插件名称和会话 ID 等操作元数据。它不会保留聊天文本、Webhook 正文、工具输出、原始请求或响应正文、令牌、Cookie 或密钥值。需要 operator 读取作用域。
    - `status` 返回 `/status` 风格的 Gateway 网关摘要；敏感字段仅包含给具有管理员作用域的 operator 客户端。
    - `gateway.identity.get` 返回中继和配对流程使用的 Gateway 网关设备身份。
    - `system-presence` 返回已连接 operator/node 设备的当前在线状态快照。
    - `system-event` 追加系统事件，并可更新/广播在线状态上下文。
    - `last-heartbeat` 返回最新持久化的 Heartbeat 事件。
    - `set-heartbeats` 切换 Gateway 网关上的 Heartbeat 处理。

  </Accordion>

  <Accordion title="Models 和用量">
    - `models.list` 返回运行时允许的模型目录。传入 `{ "view": "configured" }` 可获取适合选择器大小的已配置模型（先是 `agents.defaults.models`，然后是 `models.providers.*.models`），或传入 `{ "view": "all" }` 获取完整目录。
    - `usage.status` 返回提供商用量窗口/剩余额度摘要。
    - `usage.cost` 返回某个日期范围的聚合成本用量摘要。
    - `doctor.memory.status` 返回当前默认智能体工作区的向量记忆 / 缓存嵌入就绪状态。只有当调用方明确需要实时嵌入提供商 ping 时，才传入 `{ "probe": true }` 或 `{ "deep": true }`。
    - `doctor.memory.remHarness` 为远程控制平面客户端返回一个有界、只读的 REM harness 预览。它可以包含工作区路径、记忆片段、渲染后的 grounded Markdown，以及深度提升候选项，因此调用方需要 `operator.read`。
    - `sessions.usage` 返回每个会话的用量摘要。
    - `sessions.usage.timeseries` 返回一个会话的时间序列用量。
    - `sessions.usage.logs` 返回一个会话的用量日志条目。

  </Accordion>

  <Accordion title="渠道和登录辅助方法">
    - `channels.status` 返回内置 + 捆绑渠道/插件的 Status 摘要。
    - `channels.logout` 在渠道支持注销时，注销指定渠道/账号。
    - `web.login.start` 为当前支持 QR 的 Web 渠道提供商启动 QR/Web 登录流程。
    - `web.login.wait` 等待该 QR/Web 登录流程完成，并在成功后启动渠道。
    - `push.test` 向已注册的 iOS 节点发送测试 APNs 推送。
    - `voicewake.get` 返回已存储的唤醒词触发器。
    - `voicewake.set` 更新唤醒词触发器并广播变更。

  </Accordion>

  <Accordion title="消息和日志">
    - `send` 是用于在聊天运行器之外，按渠道/账号/线程目标发送消息的直接出站投递 RPC。
    - `logs.tail` 返回已配置的 Gateway 网关文件日志尾部，并带有游标/限制和最大字节数控制。

  </Accordion>

  <Accordion title="Talk 和 TTS">
    - `talk.config` 返回有效的 Talk 配置载荷；`includeSecrets` 需要 `operator.talk.secrets`（或 `operator.admin`）。
    - `talk.mode` 为 WebChat/Control UI 客户端设置/广播当前 Talk 模式状态。
    - `talk.speak` 通过当前活动的 Talk 语音提供商合成语音。
    - `tts.status` 返回 TTS 启用状态、活动提供商、回退提供商，以及提供商配置状态。
    - `tts.providers` 返回可见的 TTS 提供商清单。
    - `tts.enable` 和 `tts.disable` 切换 TTS 偏好状态。
    - `tts.setProvider` 更新首选 TTS 提供商。
    - `tts.convert` 运行一次性文本转语音转换。

  </Accordion>

  <Accordion title="密钥、配置、更新和向导">
    - `secrets.reload` 重新解析活动 SecretRefs，并且仅在完全成功时替换运行时密钥状态。
    - `secrets.resolve` 为特定命令/目标集合解析面向命令目标的密钥赋值。
    - `config.get` 返回当前配置快照和哈希。
    - `config.set` 写入已验证的配置载荷。
    - `config.patch` 合并部分配置更新。
    - `config.apply` 验证并替换完整配置载荷。
    - `config.schema` 返回 Control UI 和 CLI 工具使用的实时配置 schema 载荷：schema、`uiHints`、版本和生成元数据，包括运行时可以加载时的插件 + 渠道 schema 元数据。该 schema 包含字段 `title` / `description` 元数据，这些元数据派生自 UI 使用的相同标签和帮助文本；当存在匹配的字段文档时，也包括嵌套对象、通配符、数组项，以及 `anyOf` / `oneOf` / `allOf` 组合分支。
    - `config.schema.lookup` 为一个配置路径返回路径范围的查询载荷：规范化路径、浅层 schema 节点、匹配的提示 + `hintPath`，以及用于 UI/CLI 下钻的直接子项摘要。查询 schema 节点会保留面向用户的文档和常用验证字段（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、数值/字符串/数组/对象边界，以及 `additionalProperties`、`deprecated`、`readOnly`、`writeOnly` 等标志）。子项摘要公开 `key`、规范化 `path`、`type`、`required`、`hasChildren`，以及匹配的 `hint` / `hintPath`。
    - `update.run` 运行 Gateway 网关更新流程，并且仅当更新本身成功时安排重启。
    - `update.status` 返回最新缓存的更新重启哨兵，包括可用时重启后的运行版本。
    - `wizard.start`、`wizard.next`、`wizard.status` 和 `wizard.cancel` 通过 WS RPC 暴露新手引导向导。

  </Accordion>

  <Accordion title="智能体和工作区辅助方法">
    - `agents.list` 返回已配置的智能体条目，包括有效模型和运行时元数据。
    - `agents.create`、`agents.update` 和 `agents.delete` 管理智能体记录和工作区接线。
    - `agents.files.list`、`agents.files.get` 和 `agents.files.set` 管理为智能体公开的引导工作区文件。
    - `artifacts.list`、`artifacts.get` 和 `artifacts.download` 为显式的 `sessionKey`、`runId` 或 `taskId` 范围公开从转录记录派生的工件摘要和下载。运行和任务查询会在服务端解析所属会话，并且只返回带有匹配来源的转录媒体；不安全或本地 URL 来源会返回不支持的下载，而不是在服务端获取。
    - `agent.identity.get` 返回智能体或会话的有效助手身份。
    - `agent.wait` 等待一次运行完成，并在可用时返回终端快照。

  </Accordion>

  <Accordion title="会话控制">
    - `sessions.list` 返回当前会话索引，包括配置了智能体运行时后端时每一行的 `agentRuntime` 元数据。
    - `sessions.subscribe` 和 `sessions.unsubscribe` 为当前 WS 客户端切换会话变更事件订阅。
    - `sessions.messages.subscribe` 和 `sessions.messages.unsubscribe` 为一个会话切换转录记录/消息事件订阅。
    - `sessions.preview` 返回特定会话键的有界转录记录预览。
    - `sessions.resolve` 解析会话目标或将其规范化。
    - `sessions.create` 创建新的会话条目。
    - `sessions.send` 向现有会话发送消息。
    - `sessions.steer` 是活动会话的中断并 steering 变体。
    - `sessions.abort` 中止会话的活动工作。调用方可以传入 `key` 加可选的 `runId`，或只为 Gateway 网关可解析到会话的活动运行传入 `runId`。
    - `sessions.patch` 更新会话元数据/覆盖项，并报告已解析的规范模型以及有效的 `agentRuntime`。
    - `sessions.reset`、`sessions.delete` 和 `sessions.compact` 执行会话维护。
    - `sessions.get` 返回完整的已存储会话行。
    - 聊天执行仍然使用 `chat.history`、`chat.send`、`chat.abort` 和 `chat.inject`。`chat.history` 会为 UI 客户端做显示规范化：从可见文本中剥离内联指令标签，剥离纯文本工具调用 XML 载荷（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及被截断的工具调用块）和泄露的 ASCII/全角模型控制 token，省略仅包含静默 token 的助手行，例如精确的 `NO_REPLY` / `no_reply`，并且超大的行可以替换为占位符。

  </Accordion>

  <Accordion title="设备配对和设备 token">
    - `device.pair.list` 返回待处理和已批准的配对设备。
    - `device.pair.approve`、`device.pair.reject` 和 `device.pair.remove` 管理设备配对记录。
    - `device.token.rotate` 在其已批准角色和调用方范围边界内轮换配对设备 token。
    - `device.token.revoke` 在其已批准角色和调用方范围边界内撤销配对设备 token。

  </Accordion>

  <Accordion title="节点配对、调用和待处理工作">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove` 和 `node.pair.verify` 覆盖节点配对和引导验证。
    - `node.list` 和 `node.describe` 返回已知/已连接的节点状态。
    - `node.rename` 更新已配对节点标签。
    - `node.invoke` 将命令转发到已连接节点。
    - `node.invoke.result` 返回调用请求的结果。
    - `node.event` 将节点发起的事件带回 Gateway 网关。
    - `node.canvas.capability.refresh` 刷新有范围的 canvas 能力 token。
    - `node.pending.pull` 和 `node.pending.ack` 是已连接节点队列 API。
    - `node.pending.enqueue` 和 `node.pending.drain` 管理离线/断开连接节点的持久待处理工作。

  </Accordion>

  <Accordion title="审批族">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list` 和 `exec.approval.resolve` 覆盖一次性 exec 审批请求以及待处理审批查询/重放。
    - `exec.approval.waitDecision` 等待一个待处理 exec 审批，并返回最终决策（或在超时时返回 `null`）。
    - `exec.approvals.get` 和 `exec.approvals.set` 管理 Gateway 网关 exec 审批策略快照。
    - `exec.approvals.node.get` 和 `exec.approvals.node.set` 通过节点中继命令管理节点本地 exec 审批策略。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision` 和 `plugin.approval.resolve` 覆盖插件定义的审批流程。

  </Accordion>

  <Accordion title="自动化、Skills 和工具">
    - 自动化：`wake` 安排立即或下一次 Heartbeat 的唤醒文本注入；`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` 管理定时工作。
    - Skills 和工具：`commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。

  </Accordion>
</AccordionGroup>

### 常见事件族

- `chat`：UI 聊天更新，例如 `chat.inject` 和其他仅转录记录的聊天
  事件。
- `session.message` 和 `session.tool`：已订阅会话的转录记录/事件流更新。
- `sessions.changed`：会话索引或元数据已变更。
- `presence`：系统在线状态快照更新。
- `tick`：周期性 keepalive / 活跃性事件。
- `health`：Gateway 网关健康快照更新。
- `heartbeat`：Heartbeat 事件流更新。
- `cron`：cron 运行/任务变更事件。
- `shutdown`：Gateway 网关关闭通知。
- `node.pair.requested` / `node.pair.resolved`：节点配对生命周期。
- `node.invoke.request`：节点调用请求广播。
- `device.pair.requested` / `device.pair.resolved`：配对设备生命周期。
- `voicewake.changed`：唤醒词触发器配置已变更。
- `exec.approval.requested` / `exec.approval.resolved`：exec 审批
  生命周期。
- `plugin.approval.requested` / `plugin.approval.resolved`：插件审批
  生命周期。

### 节点辅助方法

- 节点可以调用 `skills.bins` 来获取当前 Skills 可执行文件列表，
  用于自动允许检查。

### 操作者辅助方法

- 操作者可以调用 `commands.list`（`operator.read`）来获取智能体的运行时命令清单。
  - `agentId` 是可选的；省略它会读取默认智能体工作区。
  - `scope` 控制主 `name` 面向哪个界面：
    - `text` 返回不带前导 `/` 的主文本命令令牌
    - `native` 和默认的 `both` 路径会在可用时返回感知提供商的原生命令名称
  - `textAliases` 携带精确的斜杠别名，例如 `/model` 和 `/m`。
  - `nativeName` 在存在时携带感知提供商的原生命令名称。
  - `provider` 是可选的，并且只影响原生命名以及原生插件命令可用性。
  - `includeArgs=false` 会从响应中省略序列化的参数元数据。
- 操作者可以调用 `tools.catalog`（`operator.read`）来获取智能体的运行时工具目录。响应包含分组工具和来源元数据：
  - `source`：`core` 或 `plugin`
  - `pluginId`：当 `source="plugin"` 时的插件所有者
  - `optional`：插件工具是否可选
- 操作者可以调用 `tools.effective`（`operator.read`）来获取会话的运行时生效工具清单。
  - `sessionKey` 是必需的。
  - Gateway 网关会从服务端会话派生受信任的运行时上下文，而不是接受调用方提供的认证或交付上下文。
  - 响应限定于会话范围，并反映当前活动对话现在可使用的内容，包括核心、插件和渠道工具。
- 操作者可以调用 `tools.invoke`（`operator.write`），通过与 `/tools/invoke` 相同的 Gateway 网关策略路径调用一个可用工具。
  - `name` 是必需的。`args`、`sessionKey`、`agentId`、`confirm` 和 `idempotencyKey` 是可选的。
  - 如果同时存在 `sessionKey` 和 `agentId`，解析出的会话智能体必须匹配 `agentId`。
  - 响应是面向 SDK 的封包，包含 `ok`、`toolName`、可选的 `output`，以及带类型的 `error` 字段。审批或策略拒绝会在载荷中返回 `ok:false`，而不是绕过 Gateway 网关工具策略流程。
- 操作者可以调用 `skills.status`（`operator.read`）来获取智能体的可见 Skills 清单。
  - `agentId` 是可选的；省略它会读取默认智能体工作区。
  - 响应包含资格、缺失要求、配置检查，以及经过脱敏的安装选项，不会暴露原始密钥值。
- 操作者可以调用 `skills.search` 和 `skills.detail`（`operator.read`）获取 ClawHub 发现元数据。
- 操作者可以通过两种模式调用 `skills.install`（`operator.admin`）：
  - ClawHub 模式：`{ source: "clawhub", slug, version?, force? }` 会把 Skills 文件夹安装到默认智能体工作区的 `skills/` 目录中。
  - Gateway 网关安装器模式：`{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` 会在 Gateway 网关主机上运行声明的 `metadata.openclaw.install` 操作。
- 操作者可以通过两种模式调用 `skills.update`（`operator.admin`）：
  - ClawHub 模式会更新一个已跟踪的 slug，或更新默认智能体工作区中所有已跟踪的 ClawHub 安装。
  - 配置模式会修补 `skills.entries.<skillKey>` 值，例如 `enabled`、`apiKey` 和 `env`。

### `models.list` 视图

`models.list` 接受可选的 `view` 参数：

- 省略或 `"default"`：当前运行时行为。如果配置了 `agents.defaults.models`，响应就是允许的目录；否则响应是完整的 Gateway 网关目录。
- `"configured"`：适合选择器大小的行为。如果配置了 `agents.defaults.models`，它仍然优先。否则响应使用显式的 `models.providers.*.models` 条目，只有在不存在已配置的模型行时才回退到完整目录。
- `"all"`：完整的 Gateway 网关目录，绕过 `agents.defaults.models`。将它用于诊断和发现 UI，而不是普通模型选择器。

## Exec 审批

- 当执行请求需要审批时，Gateway 网关会广播 `exec.approval.requested`。
- 操作者客户端通过调用 `exec.approval.resolve` 进行处理（需要 `operator.approvals` 作用域）。
- 对于 `host=node`，`exec.approval.request` 必须包含 `systemRunPlan`（规范的 `argv`/`cwd`/`rawCommand`/会话元数据）。缺少 `systemRunPlan` 的请求会被拒绝。
- 审批后，转发的 `node.invoke system.run` 调用会复用该规范 `systemRunPlan`，将其作为权威的命令/cwd/会话上下文。
- 如果调用方在准备阶段和最终已审批的 `system.run` 转发之间修改 `command`、`rawCommand`、`cwd`、`agentId` 或 `sessionKey`，Gateway 网关会拒绝运行，而不是信任被修改的载荷。

## 智能体交付回退

- `agent` 请求可以包含 `deliver=true` 来请求出站交付。
- `bestEffortDeliver=false` 保持严格行为：无法解析或仅限内部的交付目标会返回 `INVALID_REQUEST`。
- `bestEffortDeliver=true` 允许在无法解析外部可交付路由时回退到仅会话执行（例如内部/webchat 会话或存在歧义的多渠道配置）。

## 版本控制

- `PROTOCOL_VERSION` 位于 `src/gateway/protocol/schema/protocol-schemas.ts`。
- 客户端发送 `minProtocol` + `maxProtocol`；服务器会拒绝不匹配项。
- Schema + 模型由 TypeBox 定义生成：
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### 客户端常量

`src/gateway/client.ts` 中的参考客户端使用这些默认值。这些值在 protocol v3 中保持稳定，并且是第三方客户端的预期基线。

| 常量                                      | 默认值                                                | 来源                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| 请求超时（每个 RPC）                      | `30_000` ms                                           | `src/gateway/client.ts`（`requestTimeoutMs`）                                              |
| 预认证 / 连接挑战超时                     | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts`（配置/环境变量可以提高成对的服务器/客户端预算）        |
| 初始重连退避                              | `1_000` ms                                            | `src/gateway/client.ts`（`backoffMs`）                                                     |
| 最大重连退避                              | `30_000` ms                                           | `src/gateway/client.ts`（`scheduleReconnect`）                                             |
| 设备令牌关闭后的快速重试限制              | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` 前的强制停止宽限期          | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` 默认超时                  | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| 默认 tick 间隔（`hello-ok` 之前）         | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| tick 超时关闭                             | 静默超过 `tickIntervalMs * 2` 时使用代码 `4000`       | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024`（25 MB）                           | `src/gateway/server-constants.ts`                                                          |

服务器会在 `hello-ok` 中通告生效的 `policy.tickIntervalMs`、`policy.maxPayload` 和 `policy.maxBufferedBytes`；客户端应遵循这些值，而不是握手前的默认值。

## 认证

- 共享密钥 Gateway 网关身份验证使用 `connect.params.auth.token` 或
  `connect.params.auth.password`，具体取决于配置的身份验证模式。
- 携带身份信息的模式，例如 Tailscale Serve
  (`gateway.auth.allowTailscale: true`) 或非 loopback
  `gateway.auth.mode: "trusted-proxy"`，通过请求头而不是 `connect.params.auth.*`
  满足连接身份验证检查。
- 私有入口 `gateway.auth.mode: "none"` 会完全跳过共享密钥连接身份验证；不要在公共/不受信任入口上暴露该模式。
- 配对后，Gateway 网关会签发一个限定于连接
  角色 + 作用域的**设备令牌**。它会在 `hello-ok.auth.deviceToken` 中返回，客户端应持久化它以便未来连接使用。
- 客户端应在任何成功连接后持久化主要的 `hello-ok.auth.deviceToken`。
- 使用该**已存储**设备令牌重新连接时，还应复用为该令牌存储的已批准作用域集合。这样可保留已授予的读取/探测/Status 访问权限，并避免将重连静默收缩为更窄的隐式仅管理员作用域。
- 客户端侧连接身份验证组装（`src/gateway/client.ts` 中的 `selectConnectAuth`）：
  - `auth.password` 是正交的，并且在设置后始终会转发。
  - `auth.token` 按优先级顺序填充：显式共享令牌优先，然后是显式 `deviceToken`，再是已存储的按设备令牌（以 `deviceId` + `role` 为键）。
  - 仅当上述项都没有解析出 `auth.token` 时，才会发送 `auth.bootstrapToken`。共享令牌或任何已解析的设备令牌都会抑制它。
  - 在一次性 `AUTH_TOKEN_MISMATCH` 重试中，将已存储设备令牌自动提升为仅限**受信任端点**：loopback，或带有固定 `tlsFingerprint` 的 `wss://`。未固定指纹的公共 `wss://` 不符合条件。
- 额外的 `hello-ok.auth.deviceTokens` 条目是 bootstrap 交接令牌。仅当连接在受信任传输上使用 bootstrap 身份验证时才持久化它们，例如 `wss://` 或 loopback/local 配对。
- 如果客户端提供**显式** `deviceToken` 或显式 `scopes`，则该调用方请求的作用域集合仍然具有权威性；仅当客户端复用已存储的按设备令牌时，才会复用缓存的作用域。
- 设备令牌可通过 `device.token.rotate` 和
  `device.token.revoke` 轮换/撤销（需要 `operator.pairing` 作用域）。
- `device.token.rotate` 返回轮换元数据。它仅对已使用该设备令牌完成身份验证的同一设备调用回显替换 bearer 令牌，因此仅令牌客户端可以在重新连接前持久化其替换令牌。共享/管理员轮换不会回显 bearer 令牌。
- 令牌签发、轮换和撤销都受限于该设备配对条目中记录的已批准角色集合；令牌变更不能扩展或定位到配对批准从未授予的设备角色。
- 对于已配对设备令牌会话，除非调用方同时拥有 `operator.admin`，否则设备管理为自作用域：非管理员调用方只能移除/撤销/轮换其**自己的**设备条目。
- `device.token.rotate` 和 `device.token.revoke` 还会根据调用方当前会话作用域检查目标 operator
  令牌作用域集合。非管理员调用方不能轮换或撤销比其已持有权限更广的 operator 令牌。
- 身份验证失败包含 `error.details.code` 以及恢复提示：
  - `error.details.canRetryWithDeviceToken`（布尔值）
  - `error.details.recommendedNextStep`（`retry_with_device_token`、`update_auth_configuration`、`update_auth_credentials`、`wait_then_retry`、`review_auth_configuration`）
- `AUTH_TOKEN_MISMATCH` 的客户端行为：
  - 受信任客户端可以尝试一次有界重试，使用缓存的按设备令牌。
  - 如果该重试失败，客户端应停止自动重连循环，并显示操作员操作指导。

## 设备身份 + 配对

- 节点应包含一个由密钥对指纹派生的稳定设备身份（`device.id`）。
- Gateway 网关按设备 + 角色签发令牌。
- 除非启用了本地自动批准，否则新的设备 ID 需要配对批准。
- 配对自动批准以直接 local loopback 连接为中心。
- OpenClaw 还提供一个狭窄的后端/容器本地自连接路径，用于受信任的共享密钥辅助流程。
- 同主机 tailnet 或 LAN 连接在配对时仍被视为远程连接，并且需要批准。
- WS 客户端通常会在 `connect` 期间包含 `device` 身份（operator +
  node）。仅有的无设备 operator 例外是显式信任路径：
  - `gateway.controlUi.allowInsecureAuth=true` 用于仅限 localhost 的不安全 HTTP 兼容性。
  - 成功的 `gateway.auth.mode: "trusted-proxy"` operator Control UI 身份验证。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（破窗选项，严重降低安全性）。
  - 使用共享 Gateway 网关令牌/密码完成身份验证的 direct-loopback `gateway-client` 后端 RPC。
- 所有连接都必须签署服务器提供的 `connect.challenge` nonce。

### 设备身份验证迁移诊断

对于仍使用挑战前签名行为的旧版客户端，`connect` 现在会在 `error.details.code` 下返回
`DEVICE_AUTH_*` 详情代码，并带有稳定的 `error.details.reason`。

常见迁移失败：

| 消息                        | details.code                     | details.reason           | 含义                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 客户端省略了 `device.nonce`（或发送了空值）。      |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 客户端使用过期/错误的 nonce 签名。                |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 签名载荷与 v2 载荷不匹配。                        |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 已签名时间戳超出允许偏差。                        |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` 与公钥指纹不匹配。                    |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公钥格式/规范化失败。                             |

迁移目标：

- 始终等待 `connect.challenge`。
- 签署包含服务器 nonce 的 v2 载荷。
- 在 `connect.params.device.nonce` 中发送相同的 nonce。
- 首选签名载荷是 `v3`，它除了 device/client/role/scopes/token/nonce 字段外，还绑定 `platform` 和 `deviceFamily`。
- 旧版 `v2` 签名仍会被接受以保持兼容性，但已配对设备的元数据固定仍会控制重连时的命令策略。

## TLS + 固定

- TLS 支持 WS 连接。
- 客户端可以选择固定 Gateway 网关证书指纹（请参阅 `gateway.tls`
  配置以及 `gateway.remote.tlsFingerprint` 或 CLI `--tls-fingerprint`）。

## 作用域

该协议暴露**完整 Gateway 网关 API**（Status、渠道、模型、聊天、
智能体、会话、节点、批准等）。确切接口由
`src/gateway/protocol/schema.ts` 中的 TypeBox schema 定义。

## 相关

- [Bridge protocol](/zh-CN/gateway/bridge-protocol)
- [Gateway 网关运行手册](/zh-CN/gateway)

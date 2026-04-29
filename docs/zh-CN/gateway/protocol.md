---
read_when:
    - 实现或更新 Gateway 网关 WS 客户端
    - 调试协议不匹配或连接失败
    - 重新生成协议架构/模型
summary: Gateway 网关 WebSocket 协议：握手、帧、版本控制
title: Gateway 网关协议
x-i18n:
    generated_at: "2026-04-29T04:57:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 713a72b15f029aad00a4c6427fefeef08643aee830f23eac05e53b50f43d048c
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway 网关 WS 协议是 OpenClaw 的**单一控制平面 + 节点传输协议**。
所有客户端（CLI、Web UI、macOS 应用、iOS/Android 节点、无头节点）
都通过 WebSocket 连接，并在握手时声明它们的**角色** + **范围**。

## 传输协议

- WebSocket，带 JSON 载荷的文本帧。
- 第一帧**必须**是 `connect` 请求。
- 连接前帧限制为 64 KiB。握手成功后，客户端应遵循
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

`server`、`features`、`snapshot` 和 `policy` 都是架构
（`src/gateway/protocol/schema/frames.ts`）要求的字段。`auth` 也是必需的，并报告
协商后的角色/范围。`canvasHostUrl` 是可选的。

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

受信任的同进程后端客户端（`client.id: "gateway-client"`、
`client.mode: "backend"`）在使用共享 Gateway 网关令牌/密码进行身份验证时，
可以在直接 local loopback 连接上省略 `device`。此路径保留给内部控制平面 RPC，
并避免过时的 CLI/设备配对基线阻塞本地后端工作，例如子智能体会话更新。远程客户端、
浏览器源客户端、节点客户端，以及显式设备令牌/设备身份客户端仍使用正常的配对和范围升级检查。

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

在受信任的引导交接期间，`hello-ok.auth` 也可能在 `deviceTokens` 中包含额外的
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

对于内置节点/操作员引导流程，主节点令牌保持为
`scopes: []`，任何交接的操作员令牌都保持限制在引导
操作员允许列表内（`operator.approvals`、`operator.read`、
`operator.talk.secrets`、`operator.write`）。引导范围检查保持
角色前缀：操作员条目只满足操作员请求，非操作员
角色仍需要其自身角色前缀下的范围。

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

## 成帧

- **请求**：`{type:"req", id, method, params}`
- **响应**：`{type:"res", id, ok, payload|error}`
- **事件**：`{type:"event", event, payload, seq?, stateVersion?}`

有副作用的方法需要**幂等键**（见架构）。

## 角色 + 范围

### 角色

- `operator` = 控制平面客户端（CLI/UI/自动化）。
- `node` = 能力宿主（camera/screen/canvas/system.run）。

### 范围（操作员）

常用范围：

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

带有 `includeSecrets: true` 的 `talk.config` 需要 `operator.talk.secrets`
（或 `operator.admin`）。

插件注册的 Gateway 网关 RPC 方法可以请求自己的操作员范围，但
保留的核心管理员前缀（`config.*`、`exec.approvals.*`、`wizard.*`、
`update.*`）始终解析为 `operator.admin`。

方法范围只是第一道门槛。通过
`chat.send` 到达的某些斜杠命令会在此之上应用更严格的命令级检查。例如，持久化的
`/config set` 和 `/config unset` 写入需要 `operator.admin`。

`node.pair.approve` 在基础方法范围之外，还具有额外的批准时范围检查：

- 无命令请求：`operator.pairing`
- 带有非 exec 节点命令的请求：`operator.pairing` + `operator.write`
- 包含 `system.run`、`system.run.prepare` 或 `system.which` 的请求：
  `operator.pairing` + `operator.admin`

### 能力/命令/权限（节点）

节点在连接时声明能力主张：

- `caps`：高级能力类别。
- `commands`：用于调用的命令允许列表。
- `permissions`：细粒度开关（例如 `screen.record`、`camera.capture`）。

Gateway 网关将这些视为**主张**，并强制执行服务端允许列表。

## 在线状态

- `system-presence` 返回以设备身份为键的条目。
- 在线状态条目包含 `deviceId`、`roles` 和 `scopes`，因此即使某个设备同时以**操作员**和**节点**身份连接，
  UI 也可以为每个设备显示单独一行。
- `node.list` 包含可选的 `lastSeenAtMs` 和 `lastSeenReason` 字段。已连接节点会将
  当前连接时间报告为 `lastSeenAtMs`，原因为 `connect`；当受信任的节点事件更新其配对元数据时，
  已配对节点也可以报告持久的后台在线状态。

### 节点后台存活事件

节点可以调用带有 `event: "node.presence.alive"` 的 `node.event`，以记录已配对节点在
后台唤醒期间处于存活状态，而不将其标记为已连接。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` 是闭合枚举：`background`、`silent_push`、`bg_app_refresh`、
`significant_location`、`manual` 或 `connect`。未知触发器字符串会在持久化前由
Gateway 网关规范化为 `background`。该事件仅对经过身份验证的节点
设备会话是持久的；无设备或未配对会话返回 `handled: false`。

成功的 Gateway 网关会返回结构化结果：

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

较旧的 Gateway 网关可能仍会为 `node.event` 返回 `{ "ok": true }`；客户端应将其视为
已确认的 RPC，而不是持久在线状态已保存。

## 广播事件范围限定

服务端推送的 WebSocket 广播事件会进行范围门控，因此配对范围或仅节点会话不会被动接收会话内容。

- **聊天、智能体和工具结果帧**（包括流式 `agent` 事件和工具调用结果）至少需要 `operator.read`。没有 `operator.read` 的会话会完全跳过这些帧。
- **插件定义的 `plugin.*` 广播**会根据插件注册方式，门控到 `operator.write` 或 `operator.admin`。
- **Status 和传输事件**（`heartbeat`、`presence`、`tick`、连接/断开生命周期等）保持不受限制，因此每个经过身份验证的会话都可以观察传输健康状态。
- **未知广播事件族**默认进行范围门控（失败关闭），除非注册的处理程序明确放宽限制。

每个客户端连接都维护自己的每客户端序列号，因此即使不同客户端看到不同的范围过滤事件流子集，广播也会在该套接字上保持单调顺序。

## 常见 RPC 方法族

公开 WS 表面比上面的握手/身份验证示例更广。
这不是生成的转储 — `hello-ok.features.methods` 是一个保守的
设备发现列表，基于 `src/gateway/server-methods-list.ts` 加上已加载的
插件/渠道方法导出构建。将其视为功能设备发现，而不是
`src/gateway/server-methods/*.ts` 的完整枚举。

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` 返回缓存的或新探测的 Gateway 网关健康快照。
    - `diagnostics.stability` 返回最近的有界诊断稳定性记录器。它会保留事件名称、计数、字节大小、内存读数、队列/会话状态、渠道/插件名称和会话 ID 等运行元数据。它不会保留聊天文本、Webhook 正文、工具输出、原始请求或响应正文、令牌、Cookie 或密钥值。需要操作员读取范围。
    - `status` 返回 `/status` 风格的 Gateway 网关摘要；敏感字段仅包含在管理员范围的操作员客户端中。
    - `gateway.identity.get` 返回中继和配对流程使用的 Gateway 网关设备身份。
    - `system-presence` 返回已连接操作员/节点设备的当前在线状态快照。
    - `system-event` 追加系统事件，并可以更新/广播在线状态上下文。
    - `last-heartbeat` 返回最新持久化的心跳事件。
    - `set-heartbeats` 切换 Gateway 网关上的心跳处理。

  </Accordion>

  <Accordion title="Models and usage">
    - `models.list` 返回运行时允许的模型目录。传入 `{ "view": "configured" }` 可获得适合选择器大小的已配置模型（先是 `agents.defaults.models`，然后是 `models.providers.*.models`），或传入 `{ "view": "all" }` 获取完整目录。
    - `usage.status` 返回提供商使用窗口/剩余额度摘要。
    - `usage.cost` 返回某个日期范围的聚合成本使用摘要。
    - `doctor.memory.status` 返回活动默认 Agent 工作区的向量内存/缓存嵌入就绪状态。仅当调用方明确需要实时嵌入提供商 ping 时，才传入 `{ "probe": true }` 或 `{ "deep": true }`。
    - `sessions.usage` 返回按会话划分的使用摘要。
    - `sessions.usage.timeseries` 返回一个会话的时间序列使用情况。
    - `sessions.usage.logs` 返回一个会话的使用日志条目。

  </Accordion>

  <Accordion title="渠道和登录辅助方法">
    - `channels.status` 返回内置 + 捆绑渠道/插件的 Status 摘要。
    - `channels.logout` 在渠道支持登出的情况下登出指定渠道/账号。
    - `web.login.start` 为当前支持二维码的 Web 渠道提供商启动二维码/Web 登录流程。
    - `web.login.wait` 等待该二维码/Web 登录流程完成，并在成功后启动渠道。
    - `push.test` 向已注册的 iOS 节点发送测试 APNs 推送。
    - `voicewake.get` 返回已存储的唤醒词触发器。
    - `voicewake.set` 更新唤醒词触发器并广播变更。

  </Accordion>

  <Accordion title="消息和日志">
    - `send` 是直接出站投递 RPC，用于在聊天运行器之外按渠道/账号/线程目标发送消息。
    - `logs.tail` 返回已配置的 Gateway 网关文件日志尾部内容，并支持游标/限制和最大字节控制。

  </Accordion>

  <Accordion title="Talk 和 TTS">
    - `talk.config` 返回生效的 Talk 配置载荷；`includeSecrets` 需要 `operator.talk.secrets`（或 `operator.admin`）。
    - `talk.mode` 为 WebChat/Control UI 客户端设置/广播当前 Talk 模式状态。
    - `talk.speak` 通过活动的 Talk 语音提供商合成语音。
    - `tts.status` 返回 TTS 启用状态、活动提供商、后备提供商和提供商配置状态。
    - `tts.providers` 返回可见的 TTS 提供商清单。
    - `tts.enable` 和 `tts.disable` 切换 TTS 偏好状态。
    - `tts.setProvider` 更新首选 TTS 提供商。
    - `tts.convert` 执行一次性文本转语音转换。

  </Accordion>

  <Accordion title="密钥、配置、更新和向导">
    - `secrets.reload` 重新解析活动的 SecretRefs，并且仅在完全成功时替换运行时密钥状态。
    - `secrets.resolve` 为特定命令/目标集合解析面向命令目标的密钥分配。
    - `config.get` 返回当前配置快照和哈希。
    - `config.set` 写入经过验证的配置载荷。
    - `config.patch` 合并部分配置更新。
    - `config.apply` 验证并替换完整配置载荷。
    - `config.schema` 返回 Control UI 和 CLI 工具使用的实时配置 schema 载荷：schema、`uiHints`、版本和生成元数据，包括运行时可加载时的插件 + 渠道 schema 元数据。该 schema 包含字段 `title` / `description` 元数据，它们来自 UI 使用的同一组标签和帮助文本；当存在匹配的字段文档时，也包括嵌套对象、通配符、数组项，以及 `anyOf` / `oneOf` / `allOf` 组合分支。
    - `config.schema.lookup` 返回一个配置路径的路径限定查询载荷：规范化路径、浅层 schema 节点、匹配的提示 + `hintPath`，以及用于 UI/CLI 下钻的直接子项摘要。查询 schema 节点会保留面向用户的文档和常见验证字段（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、数字/字符串/数组/对象边界，以及 `additionalProperties`、`deprecated`、`readOnly`、`writeOnly` 等标志）。子项摘要会暴露 `key`、规范化的 `path`、`type`、`required`、`hasChildren`，以及匹配的 `hint` / `hintPath`。
    - `update.run` 运行 Gateway 网关更新流程，并且仅在更新本身成功时安排重启。
    - `update.status` 返回最新缓存的更新重启哨兵，包括可用时重启后的运行版本。
    - `wizard.start`、`wizard.next`、`wizard.status` 和 `wizard.cancel` 通过 WS RPC 暴露新手引导向导。

  </Accordion>

  <Accordion title="智能体和工作区辅助方法">
    - `agents.list` 返回已配置的智能体条目，包括生效模型和运行时元数据。
    - `agents.create`、`agents.update` 和 `agents.delete` 管理智能体记录和工作区连接。
    - `agents.files.list`、`agents.files.get` 和 `agents.files.set` 管理为智能体暴露的引导工作区文件。
    - `agent.identity.get` 返回智能体或会话的生效助手身份。
    - `agent.wait` 等待一次运行完成，并在可用时返回终态快照。

  </Accordion>

  <Accordion title="会话控制">
    - `sessions.list` 返回当前会话索引。
    - `sessions.subscribe` 和 `sessions.unsubscribe` 为当前 WS 客户端切换会话变更事件订阅。
    - `sessions.messages.subscribe` 和 `sessions.messages.unsubscribe` 为一个会话切换转录/消息事件订阅。
    - `sessions.preview` 返回特定会话键的有界转录预览。
    - `sessions.resolve` 解析会话目标或将其规范化。
    - `sessions.create` 创建新的会话条目。
    - `sessions.send` 向现有会话发送消息。
    - `sessions.steer` 是活动会话的中断并引导变体。
    - `sessions.abort` 中止会话的活动工作。
    - `sessions.patch` 更新会话元数据/覆盖项。
    - `sessions.reset`、`sessions.delete` 和 `sessions.compact` 执行会话维护。
    - `sessions.get` 返回完整的已存储会话行。
    - 聊天执行仍使用 `chat.history`、`chat.send`、`chat.abort` 和 `chat.inject`。`chat.history` 会为 UI 客户端进行显示规范化：从可见文本中去除内联指令标签，去除纯文本工具调用 XML 载荷（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 和被截断的工具调用块）以及泄漏的 ASCII/全角模型控制令牌，省略完全由静默令牌组成的助手行，例如精确的 `NO_REPLY` / `no_reply`，并且过大的行可替换为占位符。

  </Accordion>

  <Accordion title="设备配对和设备令牌">
    - `device.pair.list` 返回待处理和已批准的配对设备。
    - `device.pair.approve`、`device.pair.reject` 和 `device.pair.remove` 管理设备配对记录。
    - `device.token.rotate` 在其已批准角色和调用方作用域边界内轮换配对设备令牌。
    - `device.token.revoke` 在其已批准角色和调用方作用域边界内撤销配对设备令牌。

  </Accordion>

  <Accordion title="节点配对、调用和待处理工作">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove` 和 `node.pair.verify` 覆盖节点配对和引导验证。
    - `node.list` 和 `node.describe` 返回已知/已连接的节点状态。
    - `node.rename` 更新配对节点标签。
    - `node.invoke` 将命令转发到已连接节点。
    - `node.invoke.result` 返回调用请求的结果。
    - `node.event` 将节点发起的事件带回 Gateway 网关。
    - `node.canvas.capability.refresh` 刷新有作用域的 canvas 能力令牌。
    - `node.pending.pull` 和 `node.pending.ack` 是已连接节点队列 API。
    - `node.pending.enqueue` 和 `node.pending.drain` 管理离线/断开连接节点的持久待处理工作。

  </Accordion>

  <Accordion title="审批族">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list` 和 `exec.approval.resolve` 覆盖一次性执行审批请求以及待处理审批查询/重放。
    - `exec.approval.waitDecision` 等待一个待处理的执行审批，并返回最终决定（超时时返回 `null`）。
    - `exec.approvals.get` 和 `exec.approvals.set` 管理 Gateway 网关执行审批策略快照。
    - `exec.approvals.node.get` 和 `exec.approvals.node.set` 通过节点中继命令管理节点本地执行审批策略。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision` 和 `plugin.approval.resolve` 覆盖插件定义的审批流程。

  </Accordion>

  <Accordion title="自动化、Skills 和工具">
    - 自动化：`wake` 调度立即或下一次心跳的唤醒文本注入；`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` 管理计划工作。
    - Skills 和工具：`commands.list`、`skills.*`、`tools.catalog`、`tools.effective`。

  </Accordion>
</AccordionGroup>

### 常见事件族

- `chat`：UI 聊天更新，例如 `chat.inject` 和其他仅转录聊天事件。
- `session.message` 和 `session.tool`：已订阅会话的转录/事件流更新。
- `sessions.changed`：会话索引或元数据已变更。
- `presence`：系统在线状态快照更新。
- `tick`：周期性 keepalive / 活性事件。
- `health`：Gateway 网关健康快照更新。
- `heartbeat`：心跳事件流更新。
- `cron`：cron 运行/作业变更事件。
- `shutdown`：Gateway 网关关闭通知。
- `node.pair.requested` / `node.pair.resolved`：节点配对生命周期。
- `node.invoke.request`：节点调用请求广播。
- `device.pair.requested` / `device.pair.resolved`：配对设备生命周期。
- `voicewake.changed`：唤醒词触发器配置已变更。
- `exec.approval.requested` / `exec.approval.resolved`：执行审批生命周期。
- `plugin.approval.requested` / `plugin.approval.resolved`：插件审批生命周期。

### 节点辅助方法

- 节点可以调用 `skills.bins`，以获取当前技能可执行文件列表，用于自动允许检查。

### 操作员辅助方法

- 操作员可以调用 `commands.list`（`operator.read`）获取智能体的运行时命令清单。
  - `agentId` 是可选的；省略它会读取默认 Agent 工作区。
  - `scope` 控制主要 `name` 面向哪个界面：
    - `text` 返回不带前导 `/` 的主要文本命令令牌
    - `native` 和默认的 `both` 路径会在可用时返回提供商感知的原生命名
  - `textAliases` 携带精确的斜杠别名，例如 `/model` 和 `/m`。
  - `nativeName` 携带存在时的提供商感知原生命令名称。
  - `provider` 是可选的，并且只影响原生命名以及原生插件命令可用性。
  - `includeArgs=false` 会从响应中省略序列化的参数元数据。
- 操作员可以调用 `tools.catalog`（`operator.read`）获取智能体的运行时工具目录。响应包括分组工具和来源元数据：
  - `source`：`core` 或 `plugin`
  - `pluginId`：当 `source="plugin"` 时的插件所有者
  - `optional`：插件工具是否可选
- 操作员可以调用 `tools.effective`（`operator.read`）获取会话的运行时生效工具清单。
  - `sessionKey` 是必需的。
  - Gateway 网关会从服务端会话派生受信任的运行时上下文，而不是接受调用方提供的认证或投递上下文。
  - 响应限定于会话范围，并反映当前活动对话现在可以使用的内容，包括核心、插件和渠道工具。
- 操作员可以调用 `skills.status`（`operator.read`）获取智能体的可见技能清单。
  - `agentId` 是可选的；省略它会读取默认 Agent 工作区。
  - 响应包括资格、缺失要求、配置检查，以及不会暴露原始密钥值的已脱敏安装选项。
- 操作员可以调用 `skills.search` 和 `skills.detail`（`operator.read`）获取 ClawHub 设备发现元数据。
- 操作员可以通过两种模式调用 `skills.install`（`operator.admin`）：
  - ClawHub 模式：`{ source: "clawhub", slug, version?, force? }` 将技能文件夹安装到默认 Agent 工作区的 `skills/` 目录。
  - Gateway 网关安装器模式：`{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` 在 Gateway 网关主机上运行声明的 `metadata.openclaw.install` 操作。
- 操作员可以通过两种模式调用 `skills.update`（`operator.admin`）：
  - ClawHub 模式会更新默认 Agent 工作区中的一个已跟踪 slug，或所有已跟踪的 ClawHub 安装。
  - 配置模式会修补 `skills.entries.<skillKey>` 值，例如 `enabled`、`apiKey` 和 `env`。

### `models.list` 视图

`models.list` 接受可选的 `view` 参数：

- 省略或 `"default"`：当前运行时行为。如果配置了 `agents.defaults.models`，响应为允许的目录；否则响应为完整 Gateway 网关目录。
- `"configured"`：适合选择器的行为。如果配置了 `agents.defaults.models`，它仍然优先。否则，响应使用显式的 `models.providers.*.models` 条目，仅在不存在已配置模型行时才回退到完整目录。
- `"all"`：完整 Gateway 网关目录，绕过 `agents.defaults.models`。将其用于诊断和设备发现 UI，而不是常规模型选择器。

## Exec 批准

- 当 exec 请求需要批准时，Gateway 网关会广播 `exec.approval.requested`。
- 操作员客户端通过调用 `exec.approval.resolve` 来完成处理（需要 `operator.approvals` scope）。
- 对于 `host=node`，`exec.approval.request` 必须包含 `systemRunPlan`（规范的 `argv`/`cwd`/`rawCommand`/会话元数据）。缺少 `systemRunPlan` 的请求会被拒绝。
- 批准后，转发的 `node.invoke system.run` 调用会复用该规范
  `systemRunPlan` 作为权威的命令/cwd/会话上下文。
- 如果调用方在 prepare 和最终已批准的 `system.run` 转发之间改变了 `command`、`rawCommand`、`cwd`、`agentId` 或
  `sessionKey`，Gateway 网关会拒绝运行，而不是信任被改变的 payload。

## 智能体投递回退

- `agent` 请求可以包含 `deliver=true` 以请求出站投递。
- `bestEffortDeliver=false` 保持严格行为：无法解析或仅限内部的投递目标会返回 `INVALID_REQUEST`。
- `bestEffortDeliver=true` 允许在无法解析外部可投递路由时回退到仅会话执行（例如内部/webchat 会话或有歧义的多渠道配置）。

## 版本控制

- `PROTOCOL_VERSION` 位于 `src/gateway/protocol/schema/protocol-schemas.ts`。
- 客户端发送 `minProtocol` + `maxProtocol`；服务器会拒绝不匹配项。
- schema + 模型由 TypeBox 定义生成：
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### 客户端常量

`src/gateway/client.ts` 中的参考客户端使用这些默认值。这些值在
协议 v3 中保持稳定，并且是第三方客户端的预期基线。

| 常量                                      | 默认值                                                | 来源                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| 请求超时（每个 RPC）                      | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| 预认证 / 连接质询超时                     | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts`（配置/环境变量可提高配对的服务器/客户端预算）          |
| 初始重连退避                              | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| 最大重连退避                              | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| 设备 token 关闭后的快速重试钳制           | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` 前的强制停止宽限            | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` 默认超时                  | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| 默认 tick 间隔（`hello-ok` 前）           | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Tick 超时关闭                             | 静默超过 `tickIntervalMs * 2` 时使用 code `4000`      | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

服务器会在 `hello-ok` 中公布有效的 `policy.tickIntervalMs`、`policy.maxPayload`
和 `policy.maxBufferedBytes`；客户端应遵循这些值，
而不是握手前的默认值。

## 凭证

- 共享密钥 Gateway 网关凭证使用 `connect.params.auth.token` 或
  `connect.params.auth.password`，取决于配置的凭证模式。
- 携带身份的模式（例如 Tailscale Serve
  (`gateway.auth.allowTailscale: true`) 或非 loopback
  `gateway.auth.mode: "trusted-proxy"`）会从
  请求标头而不是 `connect.params.auth.*` 满足连接凭证检查。
- 私有入口 `gateway.auth.mode: "none"` 会完全跳过共享密钥连接凭证；
  不要在公共/不受信任的入口暴露该模式。
- 配对后，Gateway 网关会签发一个限定到连接
  角色 + scope 的**设备 token**。它会在 `hello-ok.auth.deviceToken` 中返回，客户端应持久化它以供将来连接使用。
- 客户端应在任何成功连接后持久化主 `hello-ok.auth.deviceToken`。
- 使用该**已存储**设备 token 重连时，也应复用该 token 的已存储
  已批准 scope 集。这会保留已授予的读取/探测/Status 访问，
  并避免把重连静默收缩到更窄的隐式仅管理员 scope。
- 客户端侧连接凭证组装（`src/gateway/client.ts` 中的 `selectConnectAuth`）：
  - `auth.password` 是正交的，只要设置就始终转发。
  - `auth.token` 按优先级填充：显式共享 token 优先，
    然后是显式 `deviceToken`，再然后是已存储的按设备 token（由
    `deviceId` + `role` 作为键）。
  - 仅当上述都未解析出 `auth.token` 时，才发送 `auth.bootstrapToken`。
    共享 token 或任何已解析的设备 token 都会抑制它。
  - 在一次性 `AUTH_TOKEN_MISMATCH` 重试时自动提升已存储设备 token
    仅限于**受信任端点**——
    loopback，或带有固定 `tlsFingerprint` 的 `wss://`。未固定的公共 `wss://`
    不符合条件。
- 额外的 `hello-ok.auth.deviceTokens` 条目是 bootstrap 移交 token。
  仅当连接在受信任传输（例如 `wss://` 或 loopback/local 配对）上使用 bootstrap 凭证时才持久化它们。
- 如果客户端提供**显式** `deviceToken` 或显式 `scopes`，则该
  调用方请求的 scope 集保持权威；只有当客户端复用已存储的按设备 token 时，
  才会复用缓存的 scope。
- 设备 token 可以通过 `device.token.rotate` 和
  `device.token.revoke` 轮换/撤销（需要 `operator.pairing` scope）。
- `device.token.rotate` 返回轮换元数据。仅对于已经使用
  该设备 token 认证的同设备调用，它会回显替换 bearer token，
  因此仅 token 客户端可在重连前持久化其替换项。共享/管理员轮换不会回显 bearer token。
- token 签发、轮换和撤销会被限制在该设备配对条目中记录的已批准角色集内；
  token 变更不能扩展或定位到配对批准从未授予的设备角色。
- 对于配对设备 token 会话，除非调用方也具有 `operator.admin`，
  否则设备管理是自限定的：非管理员调用方只能移除/撤销/轮换
  其**自己的**设备条目。
- `device.token.rotate` 和 `device.token.revoke` 还会根据调用方当前会话 scope
  检查目标操作员 token scope 集。非管理员调用方不能轮换或撤销比其已持有权限更宽的操作员 token。
- 凭证失败包含 `error.details.code` 以及恢复提示：
  - `error.details.canRetryWithDeviceToken`（布尔值）
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` 的客户端行为：
  - 受信任客户端可以尝试使用缓存的按设备 token 进行一次有界重试。
  - 如果该重试失败，客户端应停止自动重连循环并显示操作员操作指引。

## 设备身份 + 配对

- 节点应包含从密钥对指纹派生的稳定设备身份（`device.id`）。
- Gateway 网关按设备 + 角色签发 token。
- 新设备 ID 需要配对批准，除非启用了本地自动批准。
- 配对自动批准以直接 local loopback 连接为中心。
- OpenClaw 还为
  受信任共享密钥辅助流程提供了一个狭窄的后端/容器本地自连接路径。
- 同主机 tailnet 或 LAN 连接仍被视为远程配对，
  并且需要批准。
- WS 客户端通常在 `connect` 期间包含 `device` 身份（操作员 +
  节点）。唯一的无设备操作员例外是显式信任路径：
  - `gateway.controlUi.allowInsecureAuth=true` 用于仅 localhost 的不安全 HTTP 兼容性。
  - 成功的 `gateway.auth.mode: "trusted-proxy"` 操作员 Control UI 凭证。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（应急手段，严重安全降级）。
  - 使用共享 Gateway 网关 token/password 认证的 direct-loopback `gateway-client` 后端 RPC。
- 所有连接都必须签名服务器提供的 `connect.challenge` nonce。

### 设备凭证迁移诊断

对于仍使用质询前签名行为的旧版客户端，`connect` 现在会在
`error.details.code` 下返回 `DEVICE_AUTH_*` 详情代码，并带有稳定的 `error.details.reason`。

常见迁移失败：

| 消息                        | details.code                     | details.reason           | 含义                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 客户端省略了 `device.nonce`（或发送为空）。        |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 客户端使用过期/错误 nonce 签名。                  |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 签名 payload 与 v2 payload 不匹配。                |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 签名时间戳超出允许偏差。                          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` 与公钥指纹不匹配。                    |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公钥格式/规范化失败。                             |

迁移目标：

- 始终等待 `connect.challenge`。
- 签名包含服务器 nonce 的 v2 payload。
- 在 `connect.params.device.nonce` 中发送相同 nonce。
- 首选签名 payload 是 `v3`，除设备/客户端/角色/scope/token/nonce 字段外，
  它还绑定 `platform` 和 `deviceFamily`。
- 为了兼容，仍接受旧版 `v2` 签名，但配对设备
  元数据固定仍会在重连时控制命令策略。

## TLS + 固定

- WS 连接支持 TLS。
- 客户端可以选择固定 Gateway 网关证书指纹（请参阅 `gateway.tls`
  配置，以及 `gateway.remote.tlsFingerprint` 或 CLI `--tls-fingerprint`）。

## 范围

此协议公开 **完整的 Gateway 网关 API**（Status、渠道、模型、聊天、
智能体、会话、节点、审批等）。确切的表面由
`src/gateway/protocol/schema.ts` 中的 TypeBox schema 定义。

## 相关

- [桥接协议](/zh-CN/gateway/bridge-protocol)
- [Gateway 网关运行手册](/zh-CN/gateway)

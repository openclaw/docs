---
read_when:
    - 实现或更新 gateway WS 客户端
    - 调试协议不匹配或连接失败
    - 重新生成协议 schema/models
summary: Gateway 网关 WebSocket 协议：握手、帧、版本控制
title: Gateway Protocol
x-i18n:
    generated_at: "2026-04-05T08:25:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: c37f5b686562dda3ba3516ac6982ad87b2f01d8148233284e9917099c6e96d87
    source_path: gateway/protocol.md
    workflow: 15
---

# Gateway protocol（WebSocket）

Gateway 网关 WS 协议是 OpenClaw 的**单一控制平面 + 节点传输层**。所有客户端（CLI、web UI、macOS 应用、iOS/Android 节点、headless 节点）都通过 WebSocket 连接，并在握手时声明自己的**角色** + **scope**。

## 传输

- WebSocket，使用带 JSON 负载的文本帧。
- 第一帧**必须**是一个 `connect` 请求。

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
  "payload": { "type": "hello-ok", "protocol": 3, "policy": { "tickIntervalMs": 15000 } }
}
```

当签发了设备 token 时，`hello-ok` 还会包含：

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

在受信任的 bootstrap 交接过程中，`hello-ok.auth` 还可能在 `deviceTokens` 中包含额外的有界角色条目：

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

对于内置的 node/operator bootstrap 流程，主 node token 仍保持为
`scopes: []`，而任何交接的 operator token 都会被限制在 bootstrap
operator 允许列表内（`operator.approvals`、`operator.read`、
`operator.talk.secrets`、`operator.write`）。Bootstrap scope 检查仍保持
按角色前缀进行：operator 条目只满足 operator 请求，非 operator
角色仍然需要自身角色前缀下的 scopes。

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

有副作用的方法需要 **idempotency keys**（见 schema）。

## 角色 + scopes

### 角色

- `operator` = 控制平面客户端（CLI/UI/自动化）。
- `node` = 能力宿主（camera/screen/canvas/system.run）。

### Scopes（operator）

常见 scopes：

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

带 `includeSecrets: true` 的 `talk.config` 需要 `operator.talk.secrets`
（或 `operator.admin`）。

由插件注册的 gateway RPC 方法可以请求自己的 operator scope，但
保留的核心管理员前缀（`config.*`、`exec.approvals.*`、`wizard.*`、
`update.*`）始终解析为 `operator.admin`。

方法 scope 只是第一道门槛。某些通过
`chat.send` 到达的斜杠命令还会在其上叠加更严格的命令级检查。例如，持久化的
`/config set` 和 `/config unset` 写入需要 `operator.admin`。

`node.pair.approve` 在基础方法 scope 之上还有额外的审批时 scope 检查：

- 无命令请求：`operator.pairing`
- 带非 exec node 命令的请求：`operator.pairing` + `operator.write`
- 包含 `system.run`、`system.run.prepare` 或 `system.which` 的请求：
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions（node）

节点在连接时声明能力声明：

- `caps`：高层能力类别。
- `commands`：供 invoke 使用的命令允许列表。
- `permissions`：细粒度开关（例如 `screen.record`、`camera.capture`）。

Gateway 网关将这些视为**声明**，并在服务端强制执行允许列表。

## 在线状态

- `system-presence` 返回按设备身份键控的条目。
- 在线状态条目包含 `deviceId`、`roles` 和 `scopes`，这样 UI 就可以在设备同时以 **operator** 和 **node** 身份连接时，仍显示为单行。

## 常见 RPC 方法族

本页不是自动生成的完整清单，但公开 WS 接口比上面的握手/认证示例更广。下面是 Gateway 网关当前暴露的主要方法族。

`hello-ok.features.methods` 是一个保守的发现列表，由
`src/gateway/server-methods-list.ts` 加上已加载的插件/渠道方法导出构建而成。
应将其视为功能发现，而不是
`src/gateway/server-methods/*.ts` 中每个可调用辅助方法的自动生成清单。

### 系统与身份

- `health` 返回缓存的或新近探测的 gateway 健康快照。
- `status` 返回类似 `/status` 的 gateway 摘要；敏感字段
  仅对具有 admin scope 的 operator 客户端可见。
- `gateway.identity.get` 返回 relay 和
  pairing 流程所使用的 gateway 设备身份。
- `system-presence` 返回当前已连接
  operator/node 设备的在线状态快照。
- `system-event` 追加系统事件，并可更新/广播在线状态
  上下文。
- `last-heartbeat` 返回最近一次持久化的 heartbeat 事件。
- `set-heartbeats` 切换 gateway 上的 heartbeat 处理。

### 模型与使用情况

- `models.list` 返回运行时允许的模型目录。
- `usage.status` 返回 provider 使用窗口/剩余额度摘要。
- `usage.cost` 返回某个日期范围的聚合成本使用摘要。
- `doctor.memory.status` 返回活动默认智能体工作区的
  向量 memory / embedding 就绪状态。
- `sessions.usage` 返回按会话统计的使用摘要。
- `sessions.usage.timeseries` 返回某个会话的时间序列使用情况。
- `sessions.usage.logs` 返回某个会话的使用日志条目。

### 渠道与登录辅助

- `channels.status` 返回内置 + 内置插件/渠道状态摘要。
- `channels.logout` 让特定渠道/账户登出，前提是该渠道
  支持登出。
- `web.login.start` 为当前支持 QR 的 web
  渠道 provider 启动 QR/web 登录流程。
- `web.login.wait` 等待该 QR/web 登录流程完成，并在成功后启动
  渠道。
- `push.test` 向已注册的 iOS node 发送一个测试 APNs push。
- `voicewake.get` 返回已存储的唤醒词触发器。
- `voicewake.set` 更新唤醒词触发器并广播变更。

### 消息与日志

- `send` 是直接的出站投递 RPC，用于在聊天运行器之外按渠道/账户/线程目标发送消息。
- `logs.tail` 返回已配置的 gateway 文件日志尾部，支持 cursor/limit 和
  max-byte 控制。

### Talk 和 TTS

- `talk.config` 返回生效的 Talk 配置负载；`includeSecrets`
  需要 `operator.talk.secrets`（或 `operator.admin`）。
- `talk.mode` 为 WebChat/Control UI
  客户端设置/广播当前 Talk 模式状态。
- `talk.speak` 通过当前激活的 Talk 语音 provider 合成语音。
- `tts.status` 返回 TTS 启用状态、当前 provider、回退 providers
  以及 provider 配置状态。
- `tts.providers` 返回可见的 TTS provider 清单。
- `tts.enable` 和 `tts.disable` 切换 TTS 偏好状态。
- `tts.setProvider` 更新首选 TTS provider。
- `tts.convert` 运行一次性 text-to-speech 转换。

### Secrets、配置、更新和向导

- `secrets.reload` 重新解析活动 SecretRef，并且仅在完全成功时切换运行时 secret 状态。
- `secrets.resolve` 为特定
  command/target 集合解析命令目标 secret 分配。
- `config.get` 返回当前配置快照和 hash。
- `config.set` 写入经过校验的配置负载。
- `config.patch` 合并部分配置更新。
- `config.apply` 校验并替换完整配置负载。
- `config.schema` 返回供 Control UI 和
  CLI 工具使用的实时配置 schema 负载：schema、`uiHints`、版本和生成元数据，
  包括在运行时可加载时的插件 + 渠道 schema 元数据。该 schema
  包含字段 `title` / `description` 元数据，这些元数据来自与 UI 使用相同的标签
  和帮助文本，包括嵌套对象、通配符、数组项以及 `anyOf` / `oneOf` / `allOf`
  组合分支（在存在匹配字段文档时）。
- `config.schema.lookup` 返回某个配置
  路径的按路径限定查找负载：标准化路径、一个浅层 schema 节点、匹配的
  hint + `hintPath`，以及供 UI/CLI 下钻使用的直接子项摘要。
  - 查找 schema 节点会保留用户可见文档和常见校验字段：
    `title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、
    数值/字符串/数组/对象边界，以及诸如
    `additionalProperties`、`deprecated`、`readOnly`、`writeOnly` 的布尔标志。
  - 子项摘要暴露 `key`、标准化 `path`、`type`、`required`、
    `hasChildren`，以及匹配到的 `hint` / `hintPath`。
- `update.run` 运行 gateway 更新流程，并且仅在
  更新本身成功时安排重启。
- `wizard.start`、`wizard.next`、`wizard.status` 和 `wizard.cancel` 通过
  WS RPC 暴露新手引导向导。

### 现有主要方法族

#### 智能体与工作区辅助

- `agents.list` 返回已配置的智能体条目。
- `agents.create`、`agents.update` 和 `agents.delete` 管理智能体记录和
  工作区连线。
- `agents.files.list`、`agents.files.get` 和 `agents.files.set` 管理为智能体暴露的
  bootstrap 工作区文件。
- `agent.identity.get` 返回某个智能体或
  会话的生效 assistant 身份。
- `agent.wait` 等待一次运行结束，并在
  可用时返回终态快照。

#### 会话控制

- `sessions.list` 返回当前会话索引。
- `sessions.subscribe` 和 `sessions.unsubscribe` 切换当前 WS 客户端的
  会话变更事件订阅。
- `sessions.messages.subscribe` 和 `sessions.messages.unsubscribe` 切换某个会话的
  transcript/message 事件订阅。
- `sessions.preview` 返回特定 session
  key 的有界 transcript 预览。
- `sessions.resolve` 解析或规范化某个会话目标。
- `sessions.create` 创建新的会话条目。
- `sessions.send` 向现有会话发送消息。
- `sessions.steer` 是活动会话的中断并引导变体。
- `sessions.abort` 中止某个会话的活动工作。
- `sessions.patch` 更新会话元数据/覆盖项。
- `sessions.reset`、`sessions.delete` 和 `sessions.compact` 执行会话维护。
- `sessions.get` 返回完整存储的会话行。
- 聊天执行仍使用 `chat.history`、`chat.send`、`chat.abort` 和
  `chat.inject`。
- `chat.history` 针对 UI 客户端做了显示标准化：可见文本中的内联指令标签会被移除，
  纯文本工具调用 XML 负载（包括
  `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、
  `<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及
  被截断的工具调用块）和泄露的 ASCII/全角模型控制 token
  会被移除，纯静默 token 的 assistant 行（例如精确的 `NO_REPLY` /
  `no_reply`）会被省略，过大的行则可能被占位符替换。

#### 设备配对与设备 token

- `device.pair.list` 返回待处理和已批准的配对设备。
- `device.pair.approve`、`device.pair.reject` 和 `device.pair.remove` 管理
  设备配对记录。
- `device.token.rotate` 在已批准的角色
  和 scope 边界内轮换某个配对设备 token。
- `device.token.revoke` 撤销某个配对设备 token。

#### Node 配对、invoke 和待处理工作

- `node.pair.request`、`node.pair.list`、`node.pair.approve`、
  `node.pair.reject` 和 `node.pair.verify` 涵盖 node 配对和 bootstrap
  校验。
- `node.list` 和 `node.describe` 返回已知/已连接 node 状态。
- `node.rename` 更新某个已配对 node 标签。
- `node.invoke` 将命令转发给已连接 node。
- `node.invoke.result` 返回某个 invoke 请求的结果。
- `node.event` 将 node 发起的事件带回 gateway。
- `node.canvas.capability.refresh` 刷新带 scope 的 canvas 能力 token。
- `node.pending.pull` 和 `node.pending.ack` 是已连接 node 的队列 API。
- `node.pending.enqueue` 和 `node.pending.drain` 管理离线/断开连接 node 的持久待处理工作。

#### 审批方法族

- `exec.approval.request` 和 `exec.approval.resolve` 处理一次性 exec
  审批请求。
- `exec.approval.waitDecision` 等待一个待处理的 exec 审批，并返回
  最终决定（或在超时时返回 `null`）。
- `exec.approvals.get` 和 `exec.approvals.set` 管理 gateway exec 审批
  策略快照。
- `exec.approvals.node.get` 和 `exec.approvals.node.set` 通过 node 中继命令管理 node 本地 exec
  审批策略。
- `plugin.approval.request`、`plugin.approval.waitDecision` 和
  `plugin.approval.resolve` 处理插件定义的审批流程。

#### 其他主要方法族

- 自动化：
  - `wake` 调度立即或下一次 heartbeat 的唤醒文本注入
  - `cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、
    `cron.run`、`cron.runs`
- Skills/工具：`skills.*`、`tools.catalog`、`tools.effective`

### 常见事件族

- `chat`：UI 聊天更新，例如 `chat.inject` 和其他仅 transcript 的聊天
  事件。
- `session.message` 和 `session.tool`：订阅会话的 transcript/事件流更新。
- `sessions.changed`：会话索引或元数据已变更。
- `presence`：系统在线状态快照更新。
- `tick`：周期性 keepalive / 存活事件。
- `health`：gateway 健康快照更新。
- `heartbeat`：heartbeat 事件流更新。
- `cron`：cron 运行/任务变更事件。
- `shutdown`：gateway 关闭通知。
- `node.pair.requested` / `node.pair.resolved`：node 配对生命周期。
- `node.invoke.request`：node invoke 请求广播。
- `device.pair.requested` / `device.pair.resolved`：配对设备生命周期。
- `voicewake.changed`：唤醒词触发器配置已变更。
- `exec.approval.requested` / `exec.approval.resolved`：exec 审批
  生命周期。
- `plugin.approval.requested` / `plugin.approval.resolved`：插件审批
  生命周期。

### Node 辅助方法

- 节点可以调用 `skills.bins`，以获取当前 skill 可执行文件列表，
  用于自动允许检查。

### Operator 辅助方法

- Operators 可以调用 `tools.catalog`（`operator.read`）来获取某个
  智能体的运行时工具目录。响应包含分组后的工具和来源元数据：
  - `source`：`core` 或 `plugin`
  - `pluginId`：当 `source="plugin"` 时的插件所有者
  - `optional`：某个插件工具是否为可选
- Operators 可以调用 `tools.effective`（`operator.read`）来获取某个
  会话的运行时生效工具清单。
  - `sessionKey` 为必填。
  - gateway 会从会话在服务端派生可信运行时上下文，而不是接受
    调用方提供的认证或投递上下文。
  - 响应以会话为作用域，并反映当前活动对话此刻可使用的内容，
    包括 core、plugin 和渠道工具。
- Operators 可以调用 `skills.status`（`operator.read`）来获取某个
  智能体可见的 skill 清单。
  - `agentId` 为可选；省略时读取默认智能体工作区。
  - 响应包含资格状态、缺失要求、配置检查，以及
    已清理的安装选项，而不会暴露原始 secret 值。
- Operators 可以调用 `skills.search` 和 `skills.detail`（`operator.read`）来获取
  ClawHub 发现元数据。
- Operators 可以调用 `skills.install`（`operator.admin`），支持两种模式：
  - ClawHub 模式：`{ source: "clawhub", slug, version?, force? }` 将某个
    skill 文件夹安装到默认智能体工作区的 `skills/` 目录中。
  - Gateway 安装器模式：`{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    在 gateway 主机上运行一个已声明的 `metadata.openclaw.install` 操作。
- Operators 可以调用 `skills.update`（`operator.admin`），支持两种模式：
  - ClawHub 模式更新某个已跟踪 slug 或默认智能体工作区中的所有已跟踪 ClawHub 安装项。
  - 配置模式修补 `skills.entries.<skillKey>` 的值，例如 `enabled`、
    `apiKey` 和 `env`。

## Exec 审批

- 当某个 exec 请求需要审批时，gateway 会广播 `exec.approval.requested`。
- Operator 客户端通过调用 `exec.approval.resolve` 来处理（需要 `operator.approvals` scope）。
- 对于 `host=node`，`exec.approval.request` 必须包含 `systemRunPlan`（规范化的 `argv`/`cwd`/`rawCommand`/会话元数据）。缺少 `systemRunPlan` 的请求会被拒绝。
- 审批后，被转发的 `node.invoke system.run` 调用会复用该规范化
  `systemRunPlan` 作为权威命令/cwd/会话上下文。
- 如果调用方在 prepare 与最终获批的 `system.run` 转发之间篡改了
  `command`、`rawCommand`、`cwd`、`agentId` 或
  `sessionKey`，gateway 会拒绝该运行，而不会信任被篡改的负载。

## 智能体投递回退

- `agent` 请求可以包含 `deliver=true` 以请求出站投递。
- `bestEffortDeliver=false` 保持严格行为：未解析或仅内部可用的投递目标会返回 `INVALID_REQUEST`。
- `bestEffortDeliver=true` 允许在无法解析外部可投递路由时回退为仅会话执行（例如内部/webchat 会话或存在歧义的多渠道配置）。

## 版本控制

- `PROTOCOL_VERSION` 位于 `src/gateway/protocol/schema.ts`。
- 客户端发送 `minProtocol` + `maxProtocol`；服务器会拒绝不匹配。
- Schemas + models 从 TypeBox 定义生成：
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

## 认证

- 共享密钥 gateway 认证使用 `connect.params.auth.token` 或
  `connect.params.auth.password`，具体取决于已配置的认证模式。
- 像 Tailscale Serve
  （`gateway.auth.allowTailscale: true`）或非 loopback
  `gateway.auth.mode: "trusted-proxy"` 这样的带身份模式，会从
  请求头而不是 `connect.params.auth.*` 中满足 connect 认证检查。
- 私有入口的 `gateway.auth.mode: "none"` 会完全跳过共享密钥 connect 认证；
  不要在公开/不可信入口上暴露该模式。
- 完成配对后，Gateway 网关会签发一个按连接
  角色 + scopes 限定的**设备 token**。它会在 `hello-ok.auth.deviceToken` 中返回，客户端应将其持久保存，以用于后续连接。
- 客户端在任何成功连接后都应持久保存主 `hello-ok.auth.deviceToken`。
- 使用该**已存储**设备 token 重连时，也应复用该 token 已存储的
  已批准 scope 集。这可以保留之前已授予的读/探测/status 访问权限，并避免在重连时静默收窄为更窄的隐式 admin-only scope。
- 正常 connect 认证优先级是：显式共享 token/password 优先，其次是显式 `deviceToken`，再其次是按设备存储的 token，最后是 bootstrap token。
- 额外的 `hello-ok.auth.deviceTokens` 条目是 bootstrap 交接 token。
  仅当连接使用了 bootstrap 认证且运行在如 `wss://` 或 loopback/本地配对这类可信传输上时，才持久保存它们。
- 如果客户端提供了**显式** `deviceToken` 或显式 `scopes`，则该
  调用方请求的 scope 集仍然是权威的；只有当客户端复用已存储的按设备 token 时，才会复用缓存的 scopes。
- 设备 token 可通过 `device.token.rotate` 和
  `device.token.revoke` 轮换/撤销（需要 `operator.pairing` scope）。
- Token 签发/轮换始终受限于
  该设备配对条目中记录的已批准角色集；轮换 token 不能把设备扩展到配对审批从未授予过的角色。
- 对于配对设备 token 会话，除非调用方还拥有 `operator.admin`，否则设备管理是自作用域的：非管理员调用方只能移除/撤销/轮换**自己的**设备条目。
- `device.token.rotate` 还会根据调用方当前会话 scopes 检查所请求的 operator scope 集。非管理员调用方不能将 token 轮换为比自己当前持有的更宽的 operator scope 集。
- 认证失败会包含 `error.details.code` 以及恢复提示：
  - `error.details.canRetryWithDeviceToken`（布尔值）
  - `error.details.recommendedNextStep`（`retry_with_device_token`、`update_auth_configuration`、`update_auth_credentials`、`wait_then_retry`、`review_auth_configuration`）
- 对 `AUTH_TOKEN_MISMATCH` 的客户端行为：
  - 受信任客户端可以使用缓存的按设备 token 尝试一次有界重试。
  - 如果该重试失败，客户端应停止自动重连循环，并向操作员显示后续操作指引。

## 设备身份 + 配对

- 节点应包含稳定的设备身份（`device.id`），它来源于
  keypair 指纹。
- Gateways 按设备 + 角色签发 token。
- 除非启用了本地自动批准，否则新的设备 ID 需要配对审批。
- 配对自动批准以直接本地 loopback 连接为中心。
- OpenClaw 还为
  可信共享密钥辅助流提供了一条狭义的后端/容器本地自连接路径。
- 同主机 tailnet 或 LAN 连接仍被视为远程配对，
  需要审批。
- 所有 WS 客户端都必须在 `connect` 时包含 `device`
  身份（operator + node）。
  Control UI 只能在以下模式下省略它：
  - `gateway.controlUi.allowInsecureAuth=true`，用于仅 localhost 的不安全 HTTP 兼容。
  - 成功的 `gateway.auth.mode: "trusted-proxy"` operator Control UI 认证。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（破窗开关，严重降低安全性）。
- 所有连接都必须对服务器提供的 `connect.challenge` nonce 进行签名。

### 设备认证迁移诊断

对于仍在使用挑战前签名行为的旧版客户端，`connect` 现在会在
`error.details.code` 下返回 `DEVICE_AUTH_*` 细节代码，并带有稳定的 `error.details.reason`。

常见迁移失败：

| 消息 | details.code | details.reason | 含义 |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 客户端省略了 `device.nonce`（或发送了空值）。 |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 客户端使用过期/错误的 nonce 进行了签名。 |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 签名负载与 v2 负载不匹配。 |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 签名时间戳超出允许偏差。 |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` 与 public key 指纹不匹配。 |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Public key 格式/规范化失败。 |

迁移目标：

- 始终等待 `connect.challenge`。
- 对包含服务器 nonce 的 v2 负载进行签名。
- 在 `connect.params.device.nonce` 中发送相同的 nonce。
- 首选签名负载是 `v3`，它除了 device/client/role/scopes/token/nonce 字段外，还绑定 `platform` 和 `deviceFamily`。
- 出于兼容性，旧版 `v2` 签名仍然被接受，但配对设备的元数据钉住机制仍会在重连时控制命令策略。

## TLS + pinning

- WS 连接支持 TLS。
- 客户端可选择钉住 gateway 证书指纹（参见 `gateway.tls`
  配置，以及 `gateway.remote.tlsFingerprint` 或 CLI `--tls-fingerprint`）。

## 范围

该协议暴露了**完整 gateway API**（status、channels、models、chat、
agent、sessions、nodes、approvals 等）。确切接口由
`src/gateway/protocol/schema.ts` 中的 TypeBox schemas 定义。

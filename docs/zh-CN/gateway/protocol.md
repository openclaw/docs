---
read_when:
    - 实现或更新 Gateway 网关 WS 客户端时
    - 调试协议不匹配或连接失败时
    - 重新生成协议 schema / 模型时
summary: Gateway 网关 WebSocket 协议：握手、帧、版本控制
title: Gateway 网关协议
x-i18n:
    generated_at: "2026-04-05T21:59:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: dcf6b4a88bb213e0704a767bf466329c8b33656919e933668f5f6ef06864ea55
    source_path: gateway/protocol.md
    workflow: 15
---

# Gateway 网关协议（WebSocket）

Gateway 网关 WS 协议是 OpenClaw 的**单一控制平面 + 节点传输协议**。所有客户端（CLI、Web UI、macOS 应用、iOS / Android 节点、无头节点）都通过 WebSocket 连接，并在握手时声明其**角色**和**作用域**。

## 传输

- WebSocket，使用带有 JSON 负载的文本帧。
- 第一帧**必须**是 `connect` 请求。

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

发放设备令牌时，`hello-ok` 还会包含：

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

在受信任的引导交接期间，`hello-ok.auth` 还可能在 `deviceTokens` 中包含额外的受限角色条目：

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

对于内置的 node / operator 引导流程，主 node 令牌保持为 `scopes: []`，而任何交接的 operator 令牌都保持受限于引导 operator 允许列表（`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`）。引导作用域检查始终保持按角色前缀进行：operator 条目只能满足 operator 请求，而非 operator 角色仍然需要其自身角色前缀下的作用域。

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

有副作用的方法需要**幂等键**（参见 schema）。

## 角色 + 作用域

### 角色

- `operator` = 控制平面客户端（CLI / UI / 自动化）。
- `node` = 能力宿主（camera / screen / canvas / system.run）。

### 作用域（operator）

常见作用域：

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

带有 `includeSecrets: true` 的 `talk.config` 需要 `operator.talk.secrets`（或 `operator.admin`）。

插件注册的 Gateway 网关 RPC 方法可以请求其自己的 operator 作用域，但保留的核心管理前缀（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）始终解析为 `operator.admin`。

方法作用域只是第一道门槛。通过 `chat.send` 到达的一些斜杠命令还会在此之上应用更严格的命令级检查。例如，持久化的 `/config set` 和 `/config unset` 写入需要 `operator.admin`。

`node.pair.approve` 也在基础方法作用域之上增加了额外的审批时作用域检查：

- 无命令请求：`operator.pairing`
- 带有非 exec 节点命令的请求：`operator.pairing` + `operator.write`
- 包含 `system.run`、`system.run.prepare` 或 `system.which` 的请求：
  `operator.pairing` + `operator.admin`

### caps / commands / permissions（node）

节点在连接时声明能力声明：

- `caps`：高层能力类别。
- `commands`：用于 invoke 的命令允许列表。
- `permissions`：细粒度开关（例如 `screen.record`、`camera.capture`）。

Gateway 网关将这些视为**声明**，并在服务端强制执行允许列表。

## 在线状态

- `system-presence` 返回按设备身份键控的条目。
- 在线状态条目包含 `deviceId`、`roles` 和 `scopes`，这样 UI 即使在同一设备同时以 **operator** 和 **node** 连接时，也能显示为单行。

## 常见 RPC 方法族

本页不是生成的完整导出，但公开的 WS 接口比上面的握手 / 认证示例更广。这些是 Gateway 网关当前公开的主要方法族。

`hello-ok.features.methods` 是一个保守的发现列表，由 `src/gateway/server-methods-list.ts` 加上已加载的插件 / 渠道方法导出构建而成。应将其视为功能发现，而不是 `src/gateway/server-methods/*.ts` 中实现的每个可调用辅助函数的生成导出。

### 系统和身份

- `health` 返回缓存的或新探测的 Gateway 网关健康状态快照。
- `status` 返回 `/status` 风格的 Gateway 网关摘要；敏感字段仅对具有 admin 作用域的 operator 客户端包含。
- `gateway.identity.get` 返回中继和配对流程使用的 Gateway 网关设备身份。
- `system-presence` 返回当前已连接 operator / node 设备的在线状态快照。
- `system-event` 追加系统事件，并可更新 / 广播在线状态上下文。
- `last-heartbeat` 返回最新持久化的心跳事件。
- `set-heartbeats` 切换 Gateway 网关上的心跳处理。

### 模型和用量

- `models.list` 返回运行时允许的模型目录。
- `usage.status` 返回提供商用量窗口 / 剩余额度摘要。
- `usage.cost` 返回某日期范围内的聚合成本用量摘要。
- `doctor.memory.status` 返回活动默认 agent 工作区的向量记忆 / embedding 就绪状态。
- `sessions.usage` 返回按会话统计的用量摘要。
- `sessions.usage.timeseries` 返回单个会话的时间序列用量。
- `sessions.usage.logs` 返回单个会话的用量日志条目。

### 渠道和登录辅助

- `channels.status` 返回内置 + 内置打包的渠道 / 插件状态摘要。
- `channels.logout` 在渠道支持登出的情况下登出特定渠道 / 账户。
- `web.login.start` 为当前支持 QR 的 Web 渠道提供商启动 QR / Web 登录流程。
- `web.login.wait` 等待该 QR / Web 登录流程完成，并在成功时启动渠道。
- `push.test` 向已注册的 iOS 节点发送测试 APNs 推送。
- `voicewake.get` 返回已存储的唤醒词触发器。
- `voicewake.set` 更新唤醒词触发器并广播变更。

### 消息和日志

- `send` 是直接的出站投递 RPC，用于在聊天运行器之外按渠道 / 账户 / 线程目标发送消息。
- `logs.tail` 返回配置的 Gateway 网关文件日志尾部，支持 cursor / limit 和最大字节控制。

### Talk 和 TTS

- `talk.config` 返回生效的 Talk 配置负载；`includeSecrets` 需要 `operator.talk.secrets`（或 `operator.admin`）。
- `talk.mode` 为 WebChat / Control UI 客户端设置 / 广播当前 Talk 模式状态。
- `talk.speak` 通过当前活动的 Talk 语音提供商合成语音。
- `tts.status` 返回 TTS 启用状态、活动提供商、回退提供商和提供商配置状态。
- `tts.providers` 返回可见的 TTS 提供商清单。
- `tts.enable` 和 `tts.disable` 切换 TTS 偏好状态。
- `tts.setProvider` 更新首选 TTS 提供商。
- `tts.convert` 执行一次性文本转语音转换。

### Secrets、配置、更新和向导

- `secrets.reload` 重新解析活动 SecretRef，并且仅在完全成功时替换运行时 secret 状态。
- `secrets.resolve` 为特定命令 / 目标集解析命令目标 secret 分配。
- `config.get` 返回当前配置快照和哈希值。
- `config.set` 写入经过校验的配置负载。
- `config.patch` 合并部分配置更新。
- `config.apply` 校验并替换完整配置负载。
- `config.schema` 返回 Control UI 和 CLI 工具使用的实时配置 schema 负载：schema、`uiHints`、版本和生成元数据；当运行时能够加载时，还包括插件 + 渠道 schema 元数据。该 schema 包含从 UI 使用的相同标签和帮助文本派生的字段 `title` / `description` 元数据，包括在存在匹配字段文档时的嵌套对象、通配符、数组项以及 `anyOf` / `oneOf` / `allOf` 组合分支。
- `config.schema.lookup` 返回单个配置路径的路径作用域查找负载：规范化路径、浅层 schema 节点、匹配的 hint + `hintPath`，以及供 UI / CLI 下钻的直接子项摘要。
  - 查找 schema 节点保留面向用户的文档和常见校验字段：
    `title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、
    数值 / 字符串 / 数组 / 对象边界，以及诸如
    `additionalProperties`、`deprecated`、`readOnly`、`writeOnly` 的布尔标志。
  - 子项摘要暴露 `key`、规范化 `path`、`type`、`required`、
    `hasChildren`，以及匹配的 `hint` / `hintPath`。
- `update.run` 运行 Gateway 网关更新流程，并且仅在更新本身成功时安排重启。
- `wizard.start`、`wizard.next`、`wizard.status` 和 `wizard.cancel` 通过 WS RPC 暴露新手引导向导。

### 现有主要方法族

#### agent 和工作区辅助

- `agents.list` 返回已配置的 agent 条目。
- `agents.create`、`agents.update` 和 `agents.delete` 管理 agent 记录和工作区接线。
- `agents.files.list`、`agents.files.get` 和 `agents.files.set` 管理为 agent 暴露的引导工作区文件。
- `agent.identity.get` 返回某个 agent 或会话的生效助手身份。
- `agent.wait` 等待一次运行结束，并在可用时返回终态快照。

#### 会话控制

- `sessions.list` 返回当前会话索引。
- `sessions.subscribe` 和 `sessions.unsubscribe` 为当前 WS 客户端切换会话变更事件订阅。
- `sessions.messages.subscribe` 和 `sessions.messages.unsubscribe` 为单个会话切换转录 / 消息事件订阅。
- `sessions.preview` 返回特定会话键的受限转录预览。
- `sessions.resolve` 解析或规范化会话目标。
- `sessions.create` 创建新会话条目。
- `sessions.send` 向现有会话发送消息。
- `sessions.steer` 是活动会话的中断并引导变体。
- `sessions.abort` 中止某个会话的活动工作。
- `sessions.patch` 更新会话元数据 / 覆盖项。
- `sessions.reset`、`sessions.delete` 和 `sessions.compact` 执行会话维护。
- `sessions.get` 返回完整存储的会话行。
- 聊天执行仍使用 `chat.history`、`chat.send`、`chat.abort` 和 `chat.inject`。
- `chat.history` 已为 UI 客户端进行显示规范化：内联指令标签会从可见文本中移除，纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块）和泄露的 ASCII / 全角模型控制标记会被移除，纯静默标记的助手行（例如完全等于 `NO_REPLY` / `no_reply`）会被省略，过大的行可能会被占位符替换。

#### 设备配对和设备令牌

- `device.pair.list` 返回待处理和已批准的配对设备。
- `device.pair.approve`、`device.pair.reject` 和 `device.pair.remove` 管理设备配对记录。
- `device.token.rotate` 在已批准的角色和作用域边界内轮换已配对设备令牌。
- `device.token.revoke` 撤销已配对设备令牌。

#### 节点配对、调用和待处理工作

- `node.pair.request`、`node.pair.list`、`node.pair.approve`、
  `node.pair.reject` 和 `node.pair.verify` 涵盖节点配对和引导验证。
- `node.list` 和 `node.describe` 返回已知 / 已连接节点状态。
- `node.rename` 更新已配对节点标签。
- `node.invoke` 将命令转发到已连接节点。
- `node.invoke.result` 返回 invoke 请求的结果。
- `node.event` 将源自节点的事件带回 Gateway 网关。
- `node.canvas.capability.refresh` 刷新有作用域限制的 canvas 能力令牌。
- `node.pending.pull` 和 `node.pending.ack` 是已连接节点队列 API。
- `node.pending.enqueue` 和 `node.pending.drain` 为离线 / 断开连接节点管理持久化待处理工作。

#### 审批方法族

- `exec.approval.request` 和 `exec.approval.resolve` 涵盖一次性 exec 审批请求。
- `exec.approval.waitDecision` 等待一个待处理 exec 审批并返回最终决定（或在超时时返回 `null`）。
- `exec.approvals.get` 和 `exec.approvals.set` 管理 Gateway 网关 exec 审批策略快照。
- `exec.approvals.node.get` 和 `exec.approvals.node.set` 通过节点中继命令管理节点本地 exec 审批策略。
- `plugin.approval.request`、`plugin.approval.waitDecision` 和
  `plugin.approval.resolve` 涵盖插件定义的审批流程。

#### 其他主要方法族

- automation：
  - `wake` 安排立即或下一次心跳时注入唤醒文本
  - `cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、
    `cron.run`、`cron.runs`
- Skills / 工具：`skills.*`、`tools.catalog`、`tools.effective`

### 常见事件族

- `chat`：UI 聊天更新，例如 `chat.inject` 和其他仅转录的聊天事件。
- `session.message` 和 `session.tool`：已订阅会话的转录 / 事件流更新。
- `sessions.changed`：会话索引或元数据已更改。
- `presence`：系统在线状态快照更新。
- `tick`：周期性保活 / 存活事件。
- `health`：Gateway 网关健康状态快照更新。
- `heartbeat`：心跳事件流更新。
- `cron`：cron 运行 / 任务变更事件。
- `shutdown`：Gateway 网关关闭通知。
- `node.pair.requested` / `node.pair.resolved`：节点配对生命周期。
- `node.invoke.request`：节点 invoke 请求广播。
- `device.pair.requested` / `device.pair.resolved`：已配对设备生命周期。
- `voicewake.changed`：唤醒词触发器配置已更改。
- `exec.approval.requested` / `exec.approval.resolved`：exec 审批生命周期。
- `plugin.approval.requested` / `plugin.approval.resolved`：插件审批生命周期。

### 节点辅助方法

- 节点可以调用 `skills.bins` 来获取当前 Skills 可执行文件列表，以供自动允许检查使用。

### operator 辅助方法

- operator 可以调用 `tools.catalog`（`operator.read`）来获取某个 agent 的运行时工具目录。响应包含分组后的工具和来源元数据：
  - `source`：`core` 或 `plugin`
  - `pluginId`：当 `source="plugin"` 时的插件所有者
  - `optional`：插件工具是否为可选
- operator 可以调用 `tools.effective`（`operator.read`）来获取某个会话的运行时生效工具清单。
  - `sessionKey` 是必填项。
  - Gateway 网关从服务端的会话中派生受信任的运行时上下文，而不是接受调用方提供的认证或投递上下文。
  - 响应按会话限定，并反映当前活动对话此刻可用的内容，包括 core、插件和渠道工具。
- operator 可以调用 `skills.status`（`operator.read`）来获取某个 agent 的可见 Skills 清单。
  - `agentId` 是可选的；省略它可读取默认 agent 工作区。
  - 响应包含资格、缺失要求、配置检查和已清理的安装选项，而不会暴露原始 secret 值。
- operator 可以调用 `skills.search` 和 `skills.detail`（`operator.read`）来获取 ClawHub 发现元数据。
- operator 可以通过两种模式调用 `skills.install`（`operator.admin`）：
  - ClawHub 模式：`{ source: "clawhub", slug, version?, force? }` 将 skill 文件夹安装到默认 agent 工作区的 `skills/` 目录中。
  - Gateway 网关安装器模式：`{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    在 Gateway 网关宿主机上运行已声明的 `metadata.openclaw.install` 操作。
- operator 可以通过两种模式调用 `skills.update`（`operator.admin`）：
  - ClawHub 模式会更新一个被跟踪的 slug，或更新默认 agent 工作区中的所有被跟踪 ClawHub 安装项。
  - 配置模式会修补 `skills.entries.<skillKey>` 值，例如 `enabled`、
    `apiKey` 和 `env`。

## Exec 审批

- 当某个 exec 请求需要审批时，Gateway 网关会广播 `exec.approval.requested`。
- operator 客户端通过调用 `exec.approval.resolve` 来处理（需要 `operator.approvals` 作用域）。
- 对于 `host=node`，`exec.approval.request` 必须包含 `systemRunPlan`（规范化的 `argv` / `cwd` / `rawCommand` / 会话元数据）。缺少 `systemRunPlan` 的请求会被拒绝。
- 审批后，转发的 `node.invoke system.run` 调用会复用该规范化
  `systemRunPlan` 作为权威的命令 / cwd / 会话上下文。
- 如果调用方在 prepare 与最终获批的 `system.run` 转发之间修改了
  `command`、`rawCommand`、`cwd`、`agentId` 或
  `sessionKey`，Gateway 网关将拒绝该运行，而不是信任被修改的负载。

## agent 投递回退

- `agent` 请求可以包含 `deliver=true` 以请求出站投递。
- `bestEffortDeliver=false` 保持严格行为：无法解析或仅内部可用的投递目标会返回 `INVALID_REQUEST`。
- `bestEffortDeliver=true` 允许在无法解析任何外部可投递路由时回退到仅会话执行（例如内部 / webchat 会话或含糊的多渠道配置）。

## 版本控制

- `PROTOCOL_VERSION` 位于 `src/gateway/protocol/schema.ts`。
- 客户端发送 `minProtocol` + `maxProtocol`；服务器会拒绝不匹配。
- Schemas + 模型由 TypeBox 定义生成：
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

## 认证

- 基于共享密钥的 Gateway 网关认证使用 `connect.params.auth.token` 或
  `connect.params.auth.password`，具体取决于配置的认证模式。
- 携带身份的模式，例如 Tailscale Serve
  （`gateway.auth.allowTailscale: true`）或非 loopback 的
  `gateway.auth.mode: "trusted-proxy"`，会通过请求头而不是 `connect.params.auth.*` 满足 connect 认证检查。
- 私有入口的 `gateway.auth.mode: "none"` 会完全跳过基于共享密钥的 connect 认证；不要在公共 / 不受信任入口上暴露该模式。
- 配对后，Gateway 网关会发放一个**设备令牌**，其作用域受连接角色 + 作用域限制。它会在 `hello-ok.auth.deviceToken` 中返回，客户端应将其持久化以供未来连接使用。
- 客户端在任意成功连接后都应持久化主 `hello-ok.auth.deviceToken`。
- 使用该**已存储**设备令牌重新连接时，也应复用为该令牌存储的已批准作用域集。这可以保留先前已授予的读取 / 探测 / 状态访问权限，并避免重新连接时悄然收缩为更窄的隐式仅管理员作用域。
- 正常 connect 认证优先级为：显式共享 token / password 优先，然后是显式 `deviceToken`，再然后是按设备存储的令牌，最后是引导令牌。
- 额外的 `hello-ok.auth.deviceTokens` 条目是引导交接令牌。仅在连接使用了受信任传输（如 `wss://` 或 loopback / 本地配对）并采用引导认证时才持久化它们。
- 如果客户端提供了**显式** `deviceToken` 或显式 `scopes`，则该调用方请求的作用域集保持权威；只有在客户端复用按设备存储的令牌时，才会复用缓存作用域。
- 设备令牌可通过 `device.token.rotate` 和
  `device.token.revoke` 轮换 / 撤销（需要 `operator.pairing` 作用域）。
- 令牌发放 / 轮换始终受该设备配对条目中记录的已批准角色集约束；轮换令牌不能将设备扩展到配对审批从未授予的角色。
- 对于已配对设备令牌会话，除非调用方还拥有 `operator.admin`，否则设备管理是自限定的：非管理员调用方只能移除 / 撤销 / 轮换其**自己的**设备条目。
- `device.token.rotate` 还会根据调用方当前会话作用域检查所请求的 operator 作用域集。非管理员调用方不能将令牌轮换为比其当前持有更宽的 operator 作用域集。
- 认证失败会包含 `error.details.code` 以及恢复提示：
  - `error.details.canRetryWithDeviceToken`（布尔值）
  - `error.details.recommendedNextStep`（`retry_with_device_token`、`update_auth_configuration`、`update_auth_credentials`、`wait_then_retry`、`review_auth_configuration`）
- `AUTH_TOKEN_MISMATCH` 的客户端行为：
  - 受信任客户端可以尝试使用缓存的按设备令牌进行一次有限重试。
  - 如果该重试失败，客户端应停止自动重连循环，并向 operator 显示需要人工操作的指导。

## 设备身份 + 配对

- 节点应包含稳定的设备身份（`device.id`），该身份应派生自密钥对指纹。
- Gateway 网关按设备 + 角色发放令牌。
- 除非启用了本地自动批准，否则新的设备 ID 需要配对审批。
- 配对自动批准以直接本地 local loopback 连接为中心。
- OpenClaw 还提供一条狭窄的后端 / 容器本地自连接路径，用于受信任的共享密钥辅助流程。
- 对 operator 设备的本地自动批准会播种一个受限的按设备令牌基线，而不是持久化任意请求的 operator 作用域。共享密钥会话仍可能比静默发放的设备令牌更宽。
- 同主机 tailnet 或 LAN 连接在配对上仍视为远程连接，并需要批准。
- 所有 WS 客户端在 `connect` 期间都必须包含 `device` 身份（operator + node）。
  Control UI 仅可在以下模式中省略它：
  - `gateway.controlUi.allowInsecureAuth=true`，用于仅 localhost 的不安全 HTTP 兼容。
  - 成功的 `gateway.auth.mode: "trusted-proxy"` operator Control UI 认证。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（破窗开关，严重降低安全性）。
- 所有连接都必须对服务器提供的 `connect.challenge` nonce 进行签名。

### 设备认证迁移诊断

对于仍使用挑战前签名行为的旧版客户端，`connect` 现在会在 `error.details.code` 下返回 `DEVICE_AUTH_*` 详细代码，并在 `error.details.reason` 中提供稳定原因。

常见迁移失败：

| 消息 | details.code | details.reason | 含义 |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 客户端省略了 `device.nonce`（或发送为空）。 |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 客户端使用过期 / 错误的 nonce 签名。 |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 签名负载与 v2 负载不匹配。 |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 签名时间戳超出允许的时钟偏差。 |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` 与公钥指纹不匹配。 |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公钥格式 / 规范化失败。 |

迁移目标：

- 始终等待 `connect.challenge`。
- 对包含服务器 nonce 的 v2 负载进行签名。
- 在 `connect.params.device.nonce` 中发送相同的 nonce。
- 首选签名负载为 `v3`，它除 device / client / role / scopes / token / nonce 字段之外，还绑定 `platform` 和 `deviceFamily`。
- 出于兼容性，旧版 `v2` 签名仍然被接受，但已配对设备元数据固定仍会在重连时控制命令策略。

## TLS + 固定

- WS 连接支持 TLS。
- 客户端可以选择固定 Gateway 网关证书指纹（参见 `gateway.tls`
  配置以及 `gateway.remote.tlsFingerprint` 或 CLI `--tls-fingerprint`）。

## 范围

此协议暴露**完整的 Gateway 网关 API**（status、channels、models、chat、
agent、sessions、nodes、approvals 等）。其精确接口由 `src/gateway/protocol/schema.ts` 中的 TypeBox schema 定义。

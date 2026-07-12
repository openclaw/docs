---
read_when:
    - 设置 Signal 支持
    - 调试 Signal 消息收发
summary: 通过 signal-cli（原生守护进程或 bbernhard 容器）支持 Signal、设置路径和号码模型
title: Signal
x-i18n:
    generated_at: "2026-07-12T14:19:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: db2497d0d6dcdc61cf9f7388929f9ee107602c9ed97bd248e20e67519e878b8b
    source_path: channels/signal.md
    workflow: 16
---

Signal 是一个可下载的渠道插件（`@openclaw/signal`）。Gateway 网关通过 HTTP 与 `signal-cli` 通信：可使用原生守护进程（JSON-RPC + SSE），也可使用 [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) 容器（REST + WebSocket）。OpenClaw 不内嵌 libsignal。

## 号码模型（请先阅读）

- Gateway 网关连接到一个 **Signal 设备**：即 `signal-cli` 账户。
- 在**你的个人 Signal 账户**上运行 Bot，会导致它忽略你自己发送的消息（循环保护）。
- 如果希望“我向 Bot 发消息，然后它回复”，请使用一个**单独的 Bot 号码**。

## 安装

```bash
openclaw plugins install @openclaw/signal
```

不带来源的插件说明符会先尝试 ClawHub，然后回退到 npm。可使用 `openclaw plugins install clawhub:@openclaw/signal` 或 `npm:@openclaw/signal` 强制指定来源。`plugins install` 会注册并启用插件，无需单独执行 `enable` 步骤。常规安装规则请参阅[插件](/zh-CN/tools/plugin)。

## 快速设置

<Steps>
  <Step title="选择号码">
    为 Bot 使用一个**单独的 Signal 号码**（推荐）。
  </Step>
  <Step title="安装插件">
    ```bash
    openclaw plugins install @openclaw/signal
    ```
  </Step>
  <Step title="运行引导式设置">
    ```bash
    openclaw channels add
    ```
    向导会检测 `signal-cli` 是否位于 `PATH` 中；如果缺失，它会提供安装选项：在 Linux x86-64 上下载官方原生 GraalVM 构建，或在 macOS 和其他架构上通过 Homebrew 安装。然后，它会提示输入 Bot 号码和 `signal-cli` 路径。
  </Step>
  <Step title="关联或注册账户">
    - **二维码关联（最快）：**运行 `signal-cli link -n "OpenClaw"`，然后使用 Signal 扫码。请参阅[路径 A](#setup-path-a-link-existing-signal-account-qr)。
    - **短信注册：**使用专用号码，通过验证码 + 短信验证完成注册。请参阅[路径 B](#setup-path-b-register-dedicated-bot-number-sms-linux)。

  </Step>
  <Step title="验证并配对">
    ```bash
    openclaw gateway call channels.status --params '{"probe":true}'
    ```
    发送第一条私信并批准配对：`openclaw pairing approve signal <CODE>`。
  </Step>
</Steps>

最小配置：

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

| 字段         | 说明                                                  |
| ------------ | ----------------------------------------------------- |
| `account`    | 采用 E.164 格式的 Bot 电话号码（`+15551234567`）      |
| `cliPath`    | `signal-cli` 的路径（若在 `PATH` 中则为 `signal-cli`） |
| `configPath` | 作为 `--config` 传递的 signal-cli 配置目录            |
| `dmPolicy`   | 私信访问策略（推荐使用 `pairing`）                    |
| `allowFrom`  | 允许发送私信的电话号码或 `uuid:<id>` 值               |

多账户支持：使用 `channels.signal.accounts`，为每个账户设置配置和可选的 `name`。共享模式请参阅[多账户渠道](/zh-CN/gateway/config-channels#multi-account-all-channels)。

## 功能说明

- 确定性路由：回复始终返回 Signal。
- 私信共享智能体的主会话；群组相互隔离（`agent:<agentId>:signal:group:<groupId>`）。
- 默认情况下，Signal 可以写入由 `/config set|unset` 触发的配置更新（需要 `commands.config: true`）。可通过 `channels.signal.configWrites: false` 禁用。

## 设置路径 A：关联现有 Signal 账户（二维码）

1. 安装 `signal-cli`（JVM 或原生构建），或者让 `openclaw channels add` 为你安装。
2. 关联 Bot 账户：运行 `signal-cli link -n "OpenClaw"`，然后在 Signal 中扫描二维码。
3. 配置 Signal 并启动 Gateway 网关。

## 设置路径 B：注册专用 Bot 号码（短信，Linux）

如果要使用专用 Bot 号码，而不是关联现有的 Signal 应用账户，请采用此方式。以下流程已在 Ubuntu 24 上测试。

1. 获取一个可以接收短信的号码（固定电话也可使用语音验证）。专用 Bot 号码可避免账户/会话冲突。
2. 在 Gateway 网关主机上安装 `signal-cli`：

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

如果使用 JVM 构建（`signal-cli-${VERSION}.tar.gz`），请先安装 JRE。请及时更新 `signal-cli`；上游说明指出，随着 Signal 服务器 API 发生变化，旧版本可能会失效。

3. 注册并验证号码：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

如果需要验证码（完成此步骤需要访问浏览器）：

1. 打开 `https://signalcaptchas.org/registration/generate.html`。
2. 完成验证码，从 "Open Signal" 复制 `signalcaptcha://...` 链接目标。
3. 如果可能，请从与浏览器会话相同的外部 IP 运行命令（验证码令牌会很快过期）。
4. 立即注册并验证：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. 配置 OpenClaw，重启 Gateway 网关并验证渠道：

```bash
# 如果将 Gateway 网关作为用户 systemd 服务运行：
systemctl --user restart openclaw-gateway.service

# 然后验证：
openclaw doctor
openclaw channels status --probe
```

5. 配对你的私信发送者：
   - 向 Bot 号码发送任意消息。
   - 在服务器上批准：`openclaw pairing approve signal <PAIRING_CODE>`。
   - 将 Bot 号码保存为手机联系人，以避免显示 "Unknown contact"。

<Warning>
使用 `signal-cli` 注册电话号码账户可能会使该号码在主要 Signal 应用中的会话失去身份验证。建议使用专用 Bot 号码；或者使用二维码关联模式，以保留现有的手机应用设置。
</Warning>

上游参考资料：

- `signal-cli` README：`https://github.com/AsamK/signal-cli`
- 验证码流程：`https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- 关联流程：`https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 外部守护进程模式（httpUrl）

如果要自行管理 `signal-cli`（例如 JVM 冷启动较慢、容器初始化或共享 CPU），请单独运行守护进程，并将 OpenClaw 指向它：

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

这样会跳过自动启动和 OpenClaw 的启动等待。对于自动启动较慢的情况，请设置 `channels.signal.startupTimeoutMs`。

## 容器模式（bbernhard/signal-cli-rest-api）

除了以原生方式运行 `signal-cli`，还可以使用 [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) Docker 容器。该容器在 `signal-cli` 外封装了一层 REST + WebSocket 接口。

要求：

- 容器**必须**以 `MODE=json-rpc` 运行，才能实时接收消息。
- 在连接 OpenClaw 之前，请先在容器内注册或关联 Signal 账户。

`docker-compose.yml` 服务示例：

```yaml
signal-cli:
  image: bbernhard/signal-cli-rest-api:latest
  environment:
    MODE: json-rpc
  ports:
    - "8080:8080"
  volumes:
    - signal-cli-data:/home/.local/share/signal-cli
```

OpenClaw 配置：

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      httpUrl: "http://signal-cli:8080",
      autoStart: false,
      apiMode: "container", // 或使用 "auto" 进行自动检测
    },
  },
}
```

`apiMode` 控制 OpenClaw 使用的协议：

| 值            | 行为                                                                                 |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | （默认）探测两种传输方式；流式传输会验证容器 WebSocket 接收功能                      |
| `"native"`    | 强制使用原生 signal-cli（`/api/v1/rpc` 上的 JSON-RPC、`/api/v1/events` 上的 SSE）     |
| `"container"` | 强制使用 bbernhard 容器（`/v2/send` 上的 REST、`/v1/receive/{account}` 上的 WebSocket） |

当 `apiMode` 为 `"auto"` 时，OpenClaw 会为每个守护进程 URL 缓存检测到的模式 30 秒，以避免重复探测（两种传输方式均正常时优先使用原生模式）。只有在 `/v1/receive/{account}` 成功升级为 WebSocket 后，流式传输才会选择容器接收模式，而这要求设置 `MODE=json-rpc`。

在容器公开了相应 API 的情况下，容器模式支持与原生模式相同的 Signal 操作：发送、接收、附件、输入状态指示、已读/已查看回执、表情回应、群组和带样式文本。OpenClaw 会将原生 Signal RPC 调用转换为容器的 REST 负载，其中包括 `group.{base64(internal_id)}` 群组 ID，以及格式化文本使用的 `text_mode: "styled"`。

运维说明：

- 容器模式应使用 `autoStart: false`；选择 `apiMode: "container"` 时，OpenClaw 不应启动原生守护进程。
- 接收消息时使用 `MODE=json-rpc`。`MODE=normal` 可能使 `/v1/about` 看起来运行正常，但 `/v1/receive/{account}` 不会升级到 WebSocket，因此 OpenClaw 在 `auto` 模式下不会选择容器接收流式传输。
- 当 `httpUrl` 指向 bbernhard REST API 时，设置 `apiMode: "container"`；当它指向原生 `signal-cli` JSON-RPC/SSE 时，设置 `"native"`；当部署方式可能变化时，设置 `"auto"`。
- 容器附件下载遵循与原生模式相同的媒体字节限制。如果服务器发送 `Content-Length`，会在完整缓冲超大响应之前将其拒绝；否则会在流式传输过程中将其拒绝。

## 访问控制（私信 + 群组）

私信：

- 默认值：`channels.signal.dmPolicy = "pairing"`。
- 未知发送者会收到配对码；在获得批准前，其消息会被忽略（配对码在 1 小时后过期）。
- 通过 `openclaw pairing list signal` 和 `openclaw pairing approve signal <CODE>` 批准。
- 配对是 Signal 私信默认的令牌交换方式。详情请参阅：[配对](/zh-CN/channels/pairing)
- 仅有 UUID 的发送者（来自 `sourceUuid`）会以 `uuid:<id>` 的形式存储在 `channels.signal.allowFrom` 中。

群组：

- `channels.signal.groupPolicy = open | allowlist | disabled`。
- 设置 `allowlist` 时，`channels.signal.groupAllowFrom` 控制哪些群组或发送者可以触发群组回复；条目可以是 Signal 群组 ID（原始格式、`group:<id>` 或 `signal:group:<id>`）、发送者电话号码、`uuid:<id>` 值或 `*`。
- `channels.signal.groups["<group-id>" | "*"]` 可以使用 `requireMention`、`tools` 和 `toolsBySender` 覆盖群组行为。
- 在多账户设置中，使用 `channels.signal.accounts.<id>.groups` 进行按账户覆盖。
- 通过 `groupAllowFrom` 将群组加入允许列表，本身不会禁用提及门控。除非显式设置 `requireMention: true`，否则专门配置的 `channels.signal.groups["<group-id>"]` 条目会处理每一条群组消息。
- 运行时说明：如果完全缺少 `channels.signal`，运行时会在群组检查中回退到 `groupPolicy="allowlist"`（即使已设置 `channels.defaults.groupPolicy`）。

## 工作原理（行为）

- 原生模式：`signal-cli` 作为守护进程运行；Gateway 网关通过 SSE 读取事件。
- 容器模式：Gateway 网关通过 REST API 发送消息，并通过 WebSocket 接收消息。
- 入站消息会规范化为共享的渠道信封。
- 回复始终路由回同一号码或群组。
- 如果后端接受入站时间戳和作者，对入站消息的回复会包含原生 Signal 引用元数据；如果引用元数据缺失或被拒绝，OpenClaw 会将回复作为普通消息发送。
- 使用 `channels.signal.replyToMode = off | first | all | batched` 配置原生引用的使用方式，或通过 `channels.signal.replyToModeByChatType.direct/group` 按聊天类型覆盖。`channels.signal.accounts.<id>` 下的账户级值优先。

## 媒体 + 限制

- 出站文本会按照 `channels.signal.textChunkLimit` 分块（默认值为 4000）。
- 可选的换行分块：设置 `channels.signal.chunkMode="newline"`，先按空行（段落边界）拆分，再按长度分块。
- 支持附件（从 `signal-cli` 获取 base64 数据）。
- 当缺少 `contentType` 时，语音留言附件会使用 `signal-cli` 文件名作为 MIME 回退，因此音频转录仍可识别 AAC 语音备忘录。
- 默认媒体上限：`channels.signal.mediaMaxMb`（默认值为 8）。
- 使用 `channels.signal.ignoreAttachments` 跳过媒体下载。
- 群组历史上下文使用 `channels.signal.historyLimit`（或 `channels.signal.accounts.*.historyLimit`），并回退到 `messages.groupChat.historyLimit`。设置为 `0` 可禁用（默认值为 50）。

## 正在输入状态 + 已读回执

- **正在输入指示器**：OpenClaw 通过 `signal-cli sendTyping` 发送正在输入信号，并在回复运行期间持续刷新。
- **已读回执**：当 `channels.signal.sendReadReceipts` 为 true 时，OpenClaw 会转发已允许私信的已读回执。
- `signal-cli` 不会提供群组的已读回执。

## 生命周期状态表情回应

设置 `messages.statusReactions.enabled: true`，让 Signal 在入站轮次中显示共享的排队中/思考中/工具/压缩/完成/错误表情回应生命周期。Signal 使用入站消息的时间戳作为表情回应目标；发送群组表情回应时，会使用 Signal 群组 ID，并将原始发送者作为目标作者。

状态表情回应还需要确认表情回应和匹配的 `messages.ackReactionScope`（`direct`、`group-all`、`group-mentions` 或 `all`）。设置 `channels.signal.reactionLevel: "off"` 可禁用 Signal 状态表情回应。

`messages.removeAckAfterReply: true` 会在配置的保留时间过后清除最终状态表情回应。否则，Signal 会在最终完成/错误状态后恢复初始确认表情回应。

## 表情回应（消息工具）

使用 `message action=react`，并设置 `channel=signal`。

- 目标：发送者的 E.164 或 UUID（使用配对输出中的 `uuid:<id>`；也可直接使用 UUID）。
- `messageId` 是要回应的消息对应的 Signal 时间戳。
- 群组表情回应需要 `targetAuthor` 或 `targetAuthorUuid`。

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

配置：

- `channels.signal.actions.reactions`：启用/禁用表情回应操作（默认值为 true）。
- `channels.signal.reactionLevel`：`off | ack | minimal | extensive`（默认值为 `minimal`）。
  - `off`/`ack` 会禁用智能体表情回应（消息工具 `react` 会报错）。
  - `minimal`/`extensive` 会启用智能体表情回应并设置指导级别。
- 按账户覆盖：`channels.signal.accounts.<id>.actions.reactions`、`channels.signal.accounts.<id>.reactionLevel`。

## 审批表情回应

Signal Exec 和插件审批提示使用顶层的 `approvals.exec` 和 `approvals.plugin` 路由块。Signal 没有 `channels.signal.execApprovals` 块。

- `👍` 单次批准。
- `👎` 拒绝。
- 当请求提供持久批准选项时，使用 `/approve <id> allow-always`。

审批表情回应的解析要求在 `channels.signal.allowFrom`、`channels.signal.defaultTo` 或匹配的账户级字段中明确配置 Signal 审批者。即使未明确配置审批者，同一直接聊天中的 Exec 审批提示仍可隐藏重复的本地 `/approve` 回退；没有审批者的群组审批会继续显示本地回退。

## 投递目标（CLI/cron）

- 私信：`signal:+15551234567`（或直接使用 E.164）。
- UUID 私信：`uuid:<id>`（或直接使用 UUID）。
- 群组：`signal:group:<groupId>`。
- 用户名：`username:<name>`（如果你的 Signal 账户支持）。

## 别名

为重复使用的 Signal 目标配置稳定名称。别名仅是 OpenClaw 侧配置；不会创建或编辑 Signal 联系人。

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
        jane: "uuid:123e4567-e89b-12d3-a456-426614174000",
        ops: "group:<groupId>",
      },
      defaultTo: "signal:me",
    },
  },
}
```

可在任何接受 Signal 投递目标的位置使用别名：

```bash
openclaw message send --channel signal --target signal:ops --message "部署已完成"
```

按账户配置的别名会继承顶层别名，并可添加或覆盖名称：

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
      },
      accounts: {
        work: {
          aliases: {
            ops: "group:<workGroupId>",
          },
        },
      },
    },
  },
}
```

`openclaw directory peers list --channel signal` 和 `openclaw directory groups list --channel signal` 会列出已配置的别名。Signal 目录由配置提供支持；它不会实时查询 Signal 联系人，也不会修改 Signal 账户。

## 故障排查

首先按以下顺序运行：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

然后根据需要确认私信配对状态：

```bash
openclaw pairing list signal
```

常见故障：

- 守护进程可访问但没有回复：验证账户/守护进程设置（`httpUrl`、`account`）和接收模式。
- 私信被忽略：发送者正在等待配对批准。
- 群组消息被忽略：群组发送者/提及门控阻止了投递。
- 编辑后出现配置验证错误：运行 `openclaw doctor --fix`。
- 诊断中缺少 Signal：确认 `channels.signal.enabled: true`。

额外检查：

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

有关分诊流程，请参阅[渠道故障排除](/zh-CN/channels/troubleshooting)。

## 安全说明

- `signal-cli` 在本地存储账户密钥（通常位于 `~/.local/share/signal-cli/data/`）。
- 在迁移服务器或重新构建前，备份 Signal 账户状态。
- 除非你明确希望允许更广泛的私信访问，否则请保持 `channels.signal.dmPolicy: "pairing"`。
- 仅注册或恢复流程需要 SMS 验证，但失去对号码/账户的控制可能会使重新注册复杂化。

## 配置参考（Signal）

完整配置：[配置](/zh-CN/gateway/configuration)

提供商选项：

- `channels.signal.enabled`：启用/禁用渠道启动。
- `channels.signal.apiMode`：`auto | native | container`（默认值：auto）。请参阅[容器模式](#container-mode-bbernhardsignal-cli-rest-api)。
- `channels.signal.account`：Bot 账户的 E.164。
- `channels.signal.cliPath`：`signal-cli` 的路径。
- `channels.signal.configPath`：可选的 `signal-cli --config` 目录。
- `channels.signal.httpUrl`：完整的守护进程 URL（覆盖主机/端口）。
- `channels.signal.httpHost`、`channels.signal.httpPort`：守护进程绑定地址（默认值为 `127.0.0.1:8080`）。
- `channels.signal.autoStart`：自动生成守护进程（未设置 `httpUrl` 时默认值为 true）。
- `channels.signal.startupTimeoutMs`：启动等待超时时间，单位为毫秒（最小值 1000，上限 120000；默认值为 30000）。
- `channels.signal.receiveMode`：`on-start | manual`。
- `channels.signal.ignoreAttachments`：跳过附件下载。
- `channels.signal.ignoreStories`：忽略来自守护进程的快拍。
- `channels.signal.sendReadReceipts`：转发已读回执。
- `channels.signal.dmPolicy`：`pairing | allowlist | open | disabled`（默认值：pairing）。
- `channels.signal.allowFrom`：私信允许列表（E.164 或 `uuid:<id>`）。`open` 要求使用 `"*"`。Signal 没有用户名；请使用电话号码/UUID ID。
- `channels.signal.aliases`：OpenClaw 侧用于私信或群组投递目标的别名。
- `channels.signal.groupPolicy`：`open | allowlist | disabled`（默认值：allowlist）。
- `channels.signal.groupAllowFrom`：群组允许列表；接受 Signal 群组 ID（原始格式、`group:<id>` 或 `signal:group:<id>`）、发送者的 E.164 号码或 `uuid:<id>` 值。
- `channels.signal.groups`：以 Signal 群组 ID（或 `"*"`）为键的按群组覆盖。支持的字段：`requireMention`、`tools`、`toolsBySender`。
- `channels.signal.accounts.<id>.groups`：用于多账户设置的 `channels.signal.groups` 按账户版本。
- `channels.signal.accounts.<id>.aliases`：按账户配置的别名，与顶层别名合并。
- `channels.signal.replyToMode`：原生回复引用模式，`off | first | all | batched`（默认值：`all`）。
- `channels.signal.replyToModeByChatType.direct`、`channels.signal.replyToModeByChatType.group`：按聊天类型覆盖原生回复引用设置。
- `channels.signal.accounts.<id>.replyToMode`、`channels.signal.accounts.<id>.replyToModeByChatType.direct`、`channels.signal.accounts.<id>.replyToModeByChatType.group`：按账户覆盖回复引用设置。
- `channels.signal.historyLimit`：作为上下文包含的最大群组消息数（0 表示禁用）。
- `channels.signal.dmHistoryLimit`：以用户轮次计的私信历史记录限制。按用户覆盖：`channels.signal.dms["<phone_or_uuid>"].historyLimit`。
- `channels.signal.textChunkLimit`：出站分块的字符数（默认值为 4000）。
- `channels.signal.chunkMode`：`length`（默认值）或 `newline`，后者会先按空行（段落边界）拆分，再按长度分块。
- `channels.signal.mediaMaxMb`：入站/出站媒体上限，单位为 MB（默认值为 8）。
- `channels.signal.reactionLevel`：`off | ack | minimal | extensive`（默认值为 `minimal`）。请参阅[表情回应](#reactions-message-tool)。
- `channels.signal.reactionNotifications`：`off | own | all | allowlist`（默认值为 `own`）——智能体何时收到其他人的入站表情回应通知。
- `channels.signal.reactionAllowlist`：当 `reactionNotifications: "allowlist"` 时，其表情回应会通知智能体的发送者。
- `channels.signal.blockStreaming`、`channels.signal.blockStreamingCoalesce`：渠道间共享的分块模式流式传输控制。请参阅[流式传输](/zh-CN/concepts/streaming)。

相关全局选项：

- `agents.list[].groupChat.mentionPatterns`（Signal 不支持原生提及）。
- `messages.groupChat.mentionPatterns`（全局回退）。
- `messages.responsePrefix`。

## 相关内容

- [渠道概览](/zh-CN/channels) - 所有受支持的渠道
- [配对](/zh-CN/channels/pairing) - 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) - 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) - 消息的会话路由
- [安全性](/zh-CN/gateway/security) - 访问模型和安全加固

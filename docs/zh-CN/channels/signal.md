---
read_when:
    - 设置 Signal 支持
    - 调试 Signal 发送/接收
summary: 通过 signal-cli 支持 Signal（原生守护进程或 bbernhard 容器）、设置路径和号码模型
title: Signal
x-i18n:
    generated_at: "2026-05-10T19:23:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d92f94f6c1363a795366501bb5c6d5f09756c03f156b482d17021c276e3577c
    source_path: channels/signal.md
    workflow: 16
---

Status：外部 CLI 集成。Gateway 网关通过 HTTP 与 `signal-cli` 通信——可以是原生守护进程（JSON-RPC + SSE），也可以是 bbernhard/signal-cli-rest-api 容器（REST + WebSocket）。

## 前置条件

- OpenClaw 已安装在你的服务器上（下面的 Linux 流程已在 Ubuntu 24 上测试）。
- 以下之一：
  - 主机上可用的 `signal-cli`（原生模式），**或**
  - `bbernhard/signal-cli-rest-api` Docker 容器（容器模式）。
- 一个可以接收一次验证短信的电话号码（用于短信注册路径）。
- 注册期间可访问浏览器以完成 Signal 验证码（`signalcaptchas.org`）。

## 快速设置（初学者）

1. 为机器人使用一个**单独的 Signal 号码**（推荐）。
2. 安装 `signal-cli`（如果使用 JVM 构建版本，则需要 Java）。
3. 选择一种设置路径：
   - **路径 A（二维码链接）：** `signal-cli link -n "OpenClaw"` 并用 Signal 扫描。
   - **路径 B（短信注册）：** 使用验证码 + 短信验证注册一个专用号码。
4. 配置 OpenClaw 并重启 Gateway 网关。
5. 发送第一条私信并批准配对（`openclaw pairing approve signal <CODE>`）。

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

字段参考：

| 字段        | 描述                                              |
| ----------- | ------------------------------------------------- |
| `account`   | E.164 格式的机器人电话号码（`+15551234567`）      |
| `cliPath`   | `signal-cli` 路径（如果在 `PATH` 中则为 `signal-cli`） |
| `dmPolicy`  | 私信访问策略（推荐 `pairing`）                    |
| `allowFrom` | 允许发送私信的电话号码或 `uuid:<id>` 值           |

## 它是什么

- 通过 `signal-cli` 实现的 Signal 渠道（不是嵌入式 libsignal）。
- 确定性路由：回复始终回到 Signal。
- 私信共享智能体的主会话；群组是隔离的（`agent:<agentId>:signal:group:<groupId>`）。

## 配置写入

默认情况下，Signal 允许写入由 `/config set|unset` 触发的配置更新（需要 `commands.config: true`）。

使用以下配置禁用：

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## 号码模型（重要）

- Gateway 网关连接到一个 **Signal 设备**（`signal-cli` 账号）。
- 如果你在**自己的个人 Signal 账号**上运行机器人，它会忽略你自己的消息（循环保护）。
- 对于“我给机器人发短信，它回复我”这种场景，请使用一个**单独的机器人号码**。

## 设置路径 A：链接现有 Signal 账号（二维码）

1. 安装 `signal-cli`（JVM 或原生构建版本）。
2. 链接机器人账号：
   - `signal-cli link -n "OpenClaw"`，然后在 Signal 中扫描二维码。
3. 配置 Signal 并启动 Gateway 网关。

示例：

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

多账号支持：使用 `channels.signal.accounts`，为每个账号设置配置和可选的 `name`。共享模式见 [`gateway/configuration`](/zh-CN/gateway/config-channels#multi-account-all-channels)。

## 设置路径 B：注册专用机器人号码（短信，Linux）

当你想使用专用机器人号码，而不是链接现有 Signal 应用账号时，使用此路径。

1. 获取一个可以接收短信的号码（座机可使用语音验证）。
   - 使用专用机器人号码以避免账号/会话冲突。
2. 在 Gateway 网关主机上安装 `signal-cli`：

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

如果使用 JVM 构建版本（`signal-cli-${VERSION}.tar.gz`），请先安装 JRE 25+。
保持 `signal-cli` 更新；上游说明旧版本可能会因 Signal 服务器 API 变化而失效。

3. 注册并验证号码：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

如果需要验证码：

1. 打开 `https://signalcaptchas.org/registration/generate.html`。
2. 完成验证码，并从“Open Signal”复制 `signalcaptcha://...` 链接目标。
3. 尽可能从与浏览器会话相同的外部 IP 运行。
4. 立即再次运行注册（验证码令牌很快过期）：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. 配置 OpenClaw，重启 Gateway 网关，并验证渠道：

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. 配对你的私信发送者：
   - 向机器人号码发送任意消息。
   - 在服务器上批准代码：`openclaw pairing approve signal <PAIRING_CODE>`。
   - 将机器人号码保存为你手机上的联系人，以避免出现“未知联系人”。

<Warning>
使用 `signal-cli` 注册电话号码账号可能会取消该号码的主 Signal 应用会话认证。优先使用专用机器人号码；如果需要保留现有手机应用设置，请使用二维码链接模式。
</Warning>

上游参考：

- `signal-cli` README：`https://github.com/AsamK/signal-cli`
- 验证码流程：`https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- 链接流程：`https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 外部守护进程模式（httpUrl）

如果你想自行管理 `signal-cli`（JVM 冷启动较慢、容器初始化或共享 CPU），请单独运行守护进程，并让 OpenClaw 指向它：

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

这会跳过 OpenClaw 内部的自动生成进程和启动等待。自动生成进程时如果启动较慢，请设置 `channels.signal.startupTimeoutMs`。

## 容器模式（bbernhard/signal-cli-rest-api）

你可以使用 [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) Docker 容器，而不是原生运行 `signal-cli`。它将 `signal-cli` 包装在 REST API 和 WebSocket 接口之后。

要求：

- 容器**必须**以 `MODE=json-rpc` 运行，才能实时接收消息。
- 在连接 OpenClaw 之前，请在容器内注册或链接你的 Signal 账号。

示例 `docker-compose.yml` 服务：

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
      apiMode: "container", // or "auto" to detect automatically
    },
  },
}
```

`apiMode` 字段控制 OpenClaw 使用哪种协议：

| 值            | 行为                                                                                 |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | （默认）探测两种传输；流式传输会验证容器 WebSocket 接收                              |
| `"native"`    | 强制使用原生 signal-cli（`/api/v1/rpc` 上的 JSON-RPC，`/api/v1/events` 上的 SSE）     |
| `"container"` | 强制使用 bbernhard 容器（`/v2/send` 上的 REST，`/v1/receive/{account}` 上的 WebSocket） |

当 `apiMode` 为 `"auto"` 时，OpenClaw 会将检测到的模式缓存 30 秒，以避免重复探测。只有在 `/v1/receive/{account}` 升级到 WebSocket 之后，才会为流式传输选择容器接收，而这需要 `MODE=json-rpc`。

在容器暴露匹配 API 的情况下，容器模式支持与原生模式相同的 Signal 渠道操作：发送、接收、附件、输入指示器、已读/已查看回执、表情回应、群组和样式文本。OpenClaw 会将其原生 Signal RPC 调用转换为容器的 REST 负载，包括 `group.{base64(internal_id)}` 群组 ID 和用于格式化文本的 `text_mode: "styled"`。

运维注意事项：

- 在容器模式下使用 `autoStart: false`。选择 `apiMode: "container"` 时，OpenClaw 不应生成原生守护进程。
- 使用 `MODE=json-rpc` 进行接收。`MODE=normal` 可能让 `/v1/about` 看起来健康，但 `/v1/receive/{account}` 不会升级到 WebSocket，因此 OpenClaw 在 `auto` 模式下不会选择容器接收流式传输。
- 当你知道 `httpUrl` 指向 bbernhard 的 REST API 时，设置 `apiMode: "container"`。当你知道它指向原生 `signal-cli` JSON-RPC/SSE 时，设置 `apiMode: "native"`。部署可能变化时，使用 `"auto"`。
- 容器附件下载遵循与原生模式相同的媒体字节限制。当服务器发送 `Content-Length` 时，过大的响应会在完全缓冲前被拒绝；否则会在流式传输期间被拒绝。

## 访问控制（私信 + 群组）

私信：

- 默认值：`channels.signal.dmPolicy = "pairing"`。
- 未知发送者会收到配对代码；消息会被忽略，直到批准为止（代码 1 小时后过期）。
- 通过以下方式批准：
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- 配对是 Signal 私信的默认令牌交换方式。详情：[配对](/zh-CN/channels/pairing)
- 仅 UUID 的发送者（来自 `sourceUuid`）会以 `uuid:<id>` 的形式存储在 `channels.signal.allowFrom` 中。

群组：

- `channels.signal.groupPolicy = open | allowlist | disabled`。
- 当设置为 `allowlist` 时，`channels.signal.groupAllowFrom` 控制哪些群组或发送者可以触发群组回复；条目可以是 Signal 群组 ID（原始值、`group:<id>` 或 `signal:group:<id>`）、发送者电话号码、`uuid:<id>` 值或 `*`。
- `channels.signal.groups["<group-id>" | "*"]` 可以使用 `requireMention`、`tools` 和 `toolsBySender` 覆盖群组行为。
- 在多账号设置中，使用 `channels.signal.accounts.<id>.groups` 进行按账号覆盖。
- 通过 `groupAllowFrom` 将 Signal 群组加入允许列表，本身不会禁用提及门控。除非设置了 `requireMention=true`，否则专门配置的 `channels.signal.groups["<group-id>"]` 条目会处理每条群组消息。
- 运行时说明：如果完全缺少 `channels.signal`，运行时会在群组检查中回退到 `groupPolicy="allowlist"`（即使设置了 `channels.defaults.groupPolicy`）。

## 工作方式（行为）

- 原生模式：`signal-cli` 作为守护进程运行；Gateway 网关通过 SSE 读取事件。
- 容器模式：Gateway 网关通过 REST API 发送，并通过 WebSocket 接收。
- 入站消息会被规范化为共享渠道信封。
- 回复始终路由回同一号码或群组。

## 媒体 + 限制

- 出站文本会按 `channels.signal.textChunkLimit` 分块（默认 4000）。
- 可选换行分块：设置 `channels.signal.chunkMode="newline"`，先按空行（段落边界）拆分，再按长度分块。
- 支持附件（从 `signal-cli` 获取 base64）。
- 当 `contentType` 缺失时，语音备注附件会使用 `signal-cli` 文件名作为 MIME 回退，因此音频转写仍可识别 AAC 语音备忘录。
- 默认媒体上限：`channels.signal.mediaMaxMb`（默认 8）。
- 使用 `channels.signal.ignoreAttachments` 跳过媒体下载。
- 群组历史上下文使用 `channels.signal.historyLimit`（或 `channels.signal.accounts.*.historyLimit`），回退到 `messages.groupChat.historyLimit`。设置为 `0` 可禁用（默认 50）。

## 输入中 + 已读回执

- **输入指示器**：OpenClaw 通过 `signal-cli sendTyping` 发送输入信号，并在回复运行期间刷新它们。
- **已读回执**：当 `channels.signal.sendReadReceipts` 为 true 时，OpenClaw 会为允许的私信转发已读回执。
- Signal-cli 不会暴露群组的已读回执。

## 表情回应（消息工具）

- 将 `message action=react` 与 `channel=signal` 搭配使用。
- 目标：发送者 E.164 或 UUID（使用配对输出中的 `uuid:<id>`；不带前缀的 UUID 也可以）。
- `messageId` 是你要回应的消息的 Signal 时间戳。
- 群组回应需要 `targetAuthor` 或 `targetAuthorUuid`。

示例：

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

配置：

- `channels.signal.actions.reactions`：启用/禁用回应操作（默认 true）。
- `channels.signal.reactionLevel`：`off | ack | minimal | extensive`。
  - `off`/`ack` 会禁用智能体回应（消息工具 `react` 会报错）。
  - `minimal`/`extensive` 会启用智能体回应并设置引导级别。
- 按账户覆盖：`channels.signal.accounts.<id>.actions.reactions`、`channels.signal.accounts.<id>.reactionLevel`。

## 交付目标（CLI/cron）

- 私信：`signal:+15551234567`（或纯 E.164）。
- UUID 私信：`uuid:<id>`（或不带前缀的 UUID）。
- 群组：`signal:group:<groupId>`。
- 用户名：`username:<name>`（如果你的 Signal 账户支持）。

## 故障排除

先运行这组排查命令：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

然后按需确认私信配对状态：

```bash
openclaw pairing list signal
```

常见故障：

- 守护进程可访问但没有回复：验证账户/守护进程设置（`httpUrl`、`account`）和接收模式。
- 私信被忽略：发送者正在等待配对批准。
- 群组消息被忽略：群组发送者/提及门控阻止了交付。
- 编辑后出现配置验证错误：运行 `openclaw doctor --fix`。
- 诊断中缺少 Signal：确认 `channels.signal.enabled: true`。

额外检查：

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

分流排查流程：[/channels/troubleshooting](/zh-CN/channels/troubleshooting)。

## 安全说明

- `signal-cli` 会在本地存储账户密钥（通常是 `~/.local/share/signal-cli/data/`）。
- 在服务器迁移或重建前，备份 Signal 账户状态。
- 除非你明确想要更宽泛的私信访问权限，否则保留 `channels.signal.dmPolicy: "pairing"`。
- SMS 验证只在注册或恢复流程中需要，但如果失去对号码/账户的控制，重新注册可能会变得复杂。

## 配置参考（Signal）

完整配置：[配置](/zh-CN/gateway/configuration)

提供商选项：

- `channels.signal.enabled`：启用/禁用渠道启动。
- `channels.signal.apiMode`：`auto | native | container`（默认：auto）。参见[容器模式](#container-mode-bbernhardsignal-cli-rest-api)。
- `channels.signal.account`：机器人账户的 E.164。
- `channels.signal.cliPath`：`signal-cli` 的路径。
- `channels.signal.httpUrl`：完整守护进程 URL（覆盖 host/port）。
- `channels.signal.httpHost`、`channels.signal.httpPort`：守护进程绑定地址（默认 127.0.0.1:8080）。
- `channels.signal.autoStart`：自动生成守护进程（如果未设置 `httpUrl`，默认 true）。
- `channels.signal.startupTimeoutMs`：启动等待超时时间，单位 ms（上限 120000）。
- `channels.signal.receiveMode`：`on-start | manual`。
- `channels.signal.ignoreAttachments`：跳过附件下载。
- `channels.signal.ignoreStories`：忽略来自守护进程的 stories。
- `channels.signal.sendReadReceipts`：转发已读回执。
- `channels.signal.dmPolicy`：`pairing | allowlist | open | disabled`（默认：pairing）。
- `channels.signal.allowFrom`：私信允许列表（E.164 或 `uuid:<id>`）。`open` 需要 `"*"`。Signal 没有用户名；请使用手机号/UUID ID。
- `channels.signal.groupPolicy`：`open | allowlist | disabled`（默认：allowlist）。
- `channels.signal.groupAllowFrom`：群组允许列表；接受 Signal 群组 ID（原始值、`group:<id>` 或 `signal:group:<id>`）、发送者 E.164 号码，或 `uuid:<id>` 值。
- `channels.signal.groups`：按群组覆盖，以 Signal 群组 ID（或 `"*"`）为键。支持的字段：`requireMention`、`tools`、`toolsBySender`。
- `channels.signal.accounts.<id>.groups`：多账户设置中 `channels.signal.groups` 的按账户版本。
- `channels.signal.historyLimit`：作为上下文纳入的最大群组消息数（0 表示禁用）。
- `channels.signal.dmHistoryLimit`：以用户轮次计的私信历史限制。按用户覆盖：`channels.signal.dms["<phone_or_uuid>"].historyLimit`。
- `channels.signal.textChunkLimit`：出站分块大小（字符数）。
- `channels.signal.chunkMode`：`length`（默认）或 `newline`，用于在按长度分块前按空行（段落边界）拆分。
- `channels.signal.mediaMaxMb`：入站/出站媒体上限（MB）。

相关全局选项：

- `agents.list[].groupChat.mentionPatterns`（Signal 不支持原生提及）。
- `messages.groupChat.mentionPatterns`（全局回退）。
- `messages.responsePrefix`。

## 相关内容

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固

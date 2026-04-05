---
read_when:
    - 设置 Signal 支持时
    - 调试 Signal 发送/接收时
summary: 通过 signal-cli（JSON-RPC + SSE）提供的 Signal 支持、设置路径和号码模型
title: Signal
x-i18n:
    generated_at: "2026-04-05T08:17:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdd855eb353aca6a1c2b04d14af0e3da079349297b54fa8243562c52b29118d9
    source_path: channels/signal.md
    workflow: 15
---

# Signal（signal-cli）

状态：外部 CLI 集成。Gateway 网关通过 HTTP JSON-RPC + SSE 与 `signal-cli` 通信。

## 前提条件

- 已在你的服务器上安装 OpenClaw（下面的 Linux 流程已在 Ubuntu 24 上测试）。
- 在 Gateway 网关运行的主机上可使用 `signal-cli`。
- 一个能够接收一次验证短信的电话号码（用于短信注册路径）。
- 注册过程中可访问 Signal 验证码页面（`signalcaptchas.org`）的浏览器。

## 快速设置（新手）

1. 为机器人使用一个**单独的 Signal 号码**（推荐）。
2. 安装 `signal-cli`（如果你使用 JVM 构建，则需要 Java）。
3. 选择一种设置路径：
   - **路径 A（QR 链接）：**`signal-cli link -n "OpenClaw"`，然后使用 Signal 扫描。
   - **路径 B（短信注册）：**使用验证码 + 短信验证注册一个专用号码。
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

字段说明：

| 字段 | 说明 |
| ----------- | ------------------------------------------------- |
| `account` | E.164 格式的机器人电话号码（`+15551234567`） |
| `cliPath` | `signal-cli` 的路径（如果在 `PATH` 中则填写 `signal-cli`） |
| `dmPolicy` | 私信访问策略（推荐 `pairing`） |
| `allowFrom` | 允许发送私信的电话号码或 `uuid:<id>` 值 |

## 它是什么

- 通过 `signal-cli` 提供的 Signal 渠道（不是嵌入式 libsignal）。
- 确定性路由：回复始终返回到 Signal。
- 私信共享智能体的主会话；群组是隔离的（`agent:<agentId>:signal:group:<groupId>`）。

## 配置写入

默认情况下，Signal 允许写入由 `/config set|unset` 触发的配置更新（需要 `commands.config: true`）。

可通过以下方式禁用：

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## 号码模型（重要）

- Gateway 网关连接到一个 **Signal 设备**（`signal-cli` 账户）。
- 如果你在**自己的个人 Signal 账户**上运行机器人，它会忽略你自己发出的消息（循环保护）。
- 若要实现“我给机器人发短信，它会回复”，请使用一个**单独的机器人号码**。

## 设置路径 A：链接现有 Signal 账户（QR）

1. 安装 `signal-cli`（JVM 或原生构建）。
2. 链接一个机器人账户：
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

多账户支持：使用 `channels.signal.accounts` 并为每个账户配置各自的设置，以及可选的 `name`。共享模式见 [`gateway/configuration`](/gateway/configuration-reference#multi-account-all-channels)。

## 设置路径 B：注册专用机器人号码（短信，Linux）

当你希望使用一个专用机器人号码，而不是链接现有 Signal 应用账户时，请使用此路径。

1. 获取一个能够接收短信的号码（或固话的语音验证）。
   - 使用专用机器人号码，以避免账户/会话冲突。
2. 在 Gateway 网关主机上安装 `signal-cli`：

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

如果你使用 JVM 构建（`signal-cli-${VERSION}.tar.gz`），请先安装 JRE 25+。
请保持 `signal-cli` 为最新版本；上游说明旧版本可能会因 Signal 服务器 API 变化而失效。

3. 注册并验证该号码：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

如果需要验证码：

1. 打开 `https://signalcaptchas.org/registration/generate.html`。
2. 完成验证码，然后从 “Open Signal” 中复制 `signalcaptcha://...` 链接目标。
3. 尽量从与浏览器会话相同的外部 IP 运行。
4. 立即再次运行注册（验证码令牌过期很快）：

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
   - 在你的手机中将该机器人号码保存为联系人，以避免显示“未知联系人”。

重要说明：使用 `signal-cli` 注册某个电话号码账户，可能会使该号码的主 Signal 应用会话失去认证。优先使用专用机器人号码；如果你需要保留现有手机应用设置，请使用 QR 链接模式。

上游参考：

- `signal-cli` README：`https://github.com/AsamK/signal-cli`
- 验证码流程：`https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- 链接流程：`https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 外部守护进程模式（httpUrl）

如果你希望自行管理 `signal-cli`（例如 JVM 冷启动慢、容器初始化慢或共享 CPU），可以单独运行守护进程，并让 OpenClaw 指向它：

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

这会跳过 OpenClaw 内部的自动启动和启动等待。对于自动启动时的慢启动情况，请设置 `channels.signal.startupTimeoutMs`。

## 访问控制（私信 + 群组）

私信：

- 默认：`channels.signal.dmPolicy = "pairing"`。
- 未知发送者会收到配对码；在获得批准前，其消息会被忽略（代码 1 小时后过期）。
- 通过以下方式批准：
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- 配对是 Signal 私信的默认令牌交换方式。详情参见：[配对](/channels/pairing)
- 仅 UUID 的发送者（来自 `sourceUuid`）会以 `uuid:<id>` 形式存储在 `channels.signal.allowFrom` 中。

群组：

- `channels.signal.groupPolicy = open | allowlist | disabled`。
- 当设置为 `allowlist` 时，`channels.signal.groupAllowFrom` 控制在群组中谁可以触发。
- `channels.signal.groups["<group-id>" | "*"]` 可通过 `requireMention`、`tools` 和 `toolsBySender` 覆盖群组行为。
- 在多账户设置中，使用 `channels.signal.accounts.<id>.groups` 进行按账户覆盖。
- 运行时说明：如果完全缺少 `channels.signal`，运行时会在群组检查中回退到 `groupPolicy="allowlist"`（即使设置了 `channels.defaults.groupPolicy` 也是如此）。

## 工作原理（行为）

- `signal-cli` 作为守护进程运行；Gateway 网关通过 SSE 读取事件。
- 入站消息会被规范化为共享渠道信封格式。
- 回复始终路由回相同的号码或群组。

## 媒体 + 限制

- 出站文本会按 `channels.signal.textChunkLimit` 分块（默认 4000）。
- 可选换行分块：设置 `channels.signal.chunkMode="newline"`，可在按长度分块前先按空行（段落边界）拆分。
- 支持附件（从 `signal-cli` 获取 base64）。
- 默认媒体上限：`channels.signal.mediaMaxMb`（默认 8）。
- 使用 `channels.signal.ignoreAttachments` 可跳过媒体下载。
- 群组历史上下文使用 `channels.signal.historyLimit`（或 `channels.signal.accounts.*.historyLimit`），并回退到 `messages.groupChat.historyLimit`。设置为 `0` 表示禁用（默认 50）。

## 正在输入 + 已读回执

- **输入指示器**：OpenClaw 通过 `signal-cli sendTyping` 发送输入信号，并在回复运行期间持续刷新。
- **已读回执**：当 `channels.signal.sendReadReceipts` 为 true 时，OpenClaw 会为已允许的私信转发已读回执。
- Signal-cli 不暴露群组的已读回执。

## 反应（消息工具）

- 使用 `message action=react`，并设置 `channel=signal`。
- 目标：发送者 E.164 或 UUID（使用配对输出中的 `uuid:<id>`；裸 UUID 也可）。
- `messageId` 是你要添加反应的 Signal 消息时间戳。
- 群组反应需要 `targetAuthor` 或 `targetAuthorUuid`。

示例：

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

配置：

- `channels.signal.actions.reactions`：启用/禁用反应操作（默认 true）。
- `channels.signal.reactionLevel`：`off | ack | minimal | extensive`。
  - `off`/`ack` 会禁用智能体反应（消息工具 `react` 会报错）。
  - `minimal`/`extensive` 会启用智能体反应，并设置指导级别。
- 每账户覆盖：`channels.signal.accounts.<id>.actions.reactions`、`channels.signal.accounts.<id>.reactionLevel`。

## 投递目标（CLI/cron）

- 私信：`signal:+15551234567`（或普通 E.164）。
- UUID 私信：`uuid:<id>`（或裸 UUID）。
- 群组：`signal:group:<groupId>`。
- 用户名：`username:<name>`（如果你的 Signal 账户支持）。

## 故障排除

请先运行以下排查阶梯：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

然后在需要时确认私信配对状态：

```bash
openclaw pairing list signal
```

常见故障：

- 守护进程可访问但没有回复：检查账户/守护进程设置（`httpUrl`、`account`）和接收模式。
- 私信被忽略：发送者仍在等待配对批准。
- 群组消息被忽略：群组发送者/mention 门控阻止了投递。
- 编辑后出现配置校验错误：运行 `openclaw doctor --fix`。
- 诊断中缺少 Signal：确认 `channels.signal.enabled: true`。

额外检查：

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

分诊流程参见：[/channels/troubleshooting](/channels/troubleshooting)。

## 安全说明

- `signal-cli` 会在本地存储账户密钥（通常位于 `~/.local/share/signal-cli/data/`）。
- 在服务器迁移或重建前，请备份 Signal 账户状态。
- 除非你明确希望更宽松的私信访问，否则请保持 `channels.signal.dmPolicy: "pairing"`。
- 短信验证仅在注册或恢复流程中需要，但如果失去对该号码/账户的控制，重新注册会变得复杂。

## 配置参考（Signal）

完整配置：[配置](/gateway/configuration)

提供商选项：

- `channels.signal.enabled`：启用/禁用渠道启动。
- `channels.signal.account`：机器人账户的 E.164。
- `channels.signal.cliPath`：`signal-cli` 的路径。
- `channels.signal.httpUrl`：完整守护进程 URL（覆盖 host/port）。
- `channels.signal.httpHost`、`channels.signal.httpPort`：守护进程绑定地址（默认 127.0.0.1:8080）。
- `channels.signal.autoStart`：自动启动守护进程（若未设置 `httpUrl`，默认 true）。
- `channels.signal.startupTimeoutMs`：启动等待超时（毫秒，最大 120000）。
- `channels.signal.receiveMode`：`on-start | manual`。
- `channels.signal.ignoreAttachments`：跳过附件下载。
- `channels.signal.ignoreStories`：忽略守护进程中的动态消息。
- `channels.signal.sendReadReceipts`：转发已读回执。
- `channels.signal.dmPolicy`：`pairing | allowlist | open | disabled`（默认：pairing）。
- `channels.signal.allowFrom`：私信 allowlist（E.164 或 `uuid:<id>`）。`open` 需要 `"*"`。Signal 没有用户名；请使用电话/UUID ID。
- `channels.signal.groupPolicy`：`open | allowlist | disabled`（默认：allowlist）。
- `channels.signal.groupAllowFrom`：群组发送者 allowlist。
- `channels.signal.groups`：按 Signal 群组 id（或 `"*"`）键控的每群组覆盖。支持字段：`requireMention`、`tools`、`toolsBySender`。
- `channels.signal.accounts.<id>.groups`：多账户设置中 `channels.signal.groups` 的按账户版本。
- `channels.signal.historyLimit`：作为上下文包含的最大群组消息数（`0` 表示禁用）。
- `channels.signal.dmHistoryLimit`：按用户轮次计算的私信历史上限。按用户覆盖：`channels.signal.dms["<phone_or_uuid>"].historyLimit`。
- `channels.signal.textChunkLimit`：出站分块大小（字符）。
- `channels.signal.chunkMode`：`length`（默认）或 `newline`；会在按长度分块前按空行（段落边界）拆分。
- `channels.signal.mediaMaxMb`：入站/出站媒体上限（MB）。

相关全局选项：

- `agents.list[].groupChat.mentionPatterns`（Signal 不支持原生 mentions）。
- `messages.groupChat.mentionPatterns`（全局回退）。
- `messages.responsePrefix`。

## 相关内容

- [渠道概览](/channels) — 所有受支持渠道
- [配对](/channels/pairing) — 私信认证与配对流程
- [群组](/channels/groups) — 群聊行为和 mention 门控
- [渠道路由](/channels/channel-routing) — 消息的会话路由
- [安全](/gateway/security) — 访问模型与加固

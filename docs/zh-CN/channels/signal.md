---
read_when:
    - 设置 Signal 支持
    - 调试 Signal 发送/接收
summary: 通过 signal-cli（JSON-RPC + SSE）实现 Signal 支持、设置路径和号码模型
title: Signal
x-i18n:
    generated_at: "2026-05-06T04:33:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: b0290318ed0cda8f258a96da379b9774418fd888e1b78271a051c98b327a2f45
    source_path: channels/signal.md
    workflow: 16
---

Status：外部 CLI 集成。Gateway 网关通过 HTTP JSON-RPC + SSE 与 `signal-cli` 通信。

## 前提条件

- OpenClaw 已安装在你的服务器上（下面的 Linux 流程已在 Ubuntu 24 上测试）。
- `signal-cli` 在 Gateway 网关运行的主机上可用。
- 一个可以接收一次验证短信的电话号码（用于短信注册路径）。
- 注册期间可通过浏览器访问 Signal captcha（`signalcaptchas.org`）。

## 快速设置（初学者）

1. 为机器人使用一个**单独的 Signal 号码**（推荐）。
2. 安装 `signal-cli`（如果你使用 JVM 构建版本，则需要 Java）。
3. 选择一种设置路径：
   - **路径 A（二维码链接）：** `signal-cli link -n "OpenClaw"`，然后用 Signal 扫描。
   - **路径 B（短信注册）：** 使用 captcha + 短信验证注册一个专用号码。
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

| 字段        | 描述                                                 |
| ----------- | ---------------------------------------------------- |
| `account`   | E.164 格式的机器人电话号码（`+15551234567`）          |
| `cliPath`   | `signal-cli` 的路径（如果在 `PATH` 中则为 `signal-cli`） |
| `dmPolicy`  | 私信访问策略（推荐 `pairing`）                       |
| `allowFrom` | 允许发送私信的电话号码或 `uuid:<id>` 值              |

## 它是什么

- 通过 `signal-cli` 实现的 Signal 渠道（不是嵌入式 libsignal）。
- 确定性路由：回复始终返回到 Signal。
- 私信共享智能体的主会话；群组会隔离（`agent:<agentId>:signal:group:<groupId>`）。

## 配置写入

默认情况下，Signal 允许写入由 `/config set|unset` 触发的配置更新（需要 `commands.config: true`）。

用以下配置禁用：

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## 号码模型（重要）

- Gateway 网关连接到一个 **Signal 设备**（`signal-cli` 账号）。
- 如果你在**自己的个人 Signal 账号**上运行机器人，它会忽略你自己的消息（循环保护）。
- 对于“我给机器人发短信，它回复我”的用法，请使用一个**单独的机器人号码**。

## 设置路径 A：链接现有 Signal 账号（二维码）

1. 安装 `signal-cli`（JVM 或原生构建版本）。
2. 链接一个机器人账号：
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

多账号支持：使用带有每账号配置和可选 `name` 的 `channels.signal.accounts`。共享模式见 [`gateway/configuration`](/zh-CN/gateway/config-channels#multi-account-all-channels)。

## 设置路径 B：注册专用机器人号码（短信，Linux）

当你想使用专用机器人号码，而不是链接现有 Signal 应用账号时，请使用此路径。

1. 获取一个可以接收短信的号码（或固定电话的语音验证）。
   - 使用专用机器人号码，避免账号/会话冲突。
2. 在 Gateway 网关主机上安装 `signal-cli`：

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

如果你使用 JVM 构建版本（`signal-cli-${VERSION}.tar.gz`），请先安装 JRE 25+。
保持 `signal-cli` 更新；上游说明旧版本可能会随着 Signal 服务器 API 变化而失效。

3. 注册并验证号码：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

如果需要 captcha：

1. 打开 `https://signalcaptchas.org/registration/generate.html`。
2. 完成 captcha，从“Open Signal”复制 `signalcaptcha://...` 链接目标。
3. 尽可能从与浏览器会话相同的外部 IP 运行。
4. 立即再次运行注册（captcha token 很快会过期）：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. 配置 OpenClaw，重启 Gateway 网关，验证渠道：

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
   - 在手机上将机器人号码保存为联系人，以避免“未知联系人”。

<Warning>
使用 `signal-cli` 注册电话号码账号可能会让该号码的主 Signal 应用会话取消认证。优先使用专用机器人号码；如果你需要保留现有手机应用设置，请使用二维码链接模式。
</Warning>

上游参考：

- `signal-cli` README：`https://github.com/AsamK/signal-cli`
- Captcha 流程：`https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- 链接流程：`https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 外部守护进程模式（httpUrl）

如果你想自行管理 `signal-cli`（JVM 冷启动较慢、容器初始化或共享 CPU），请单独运行守护进程并让 OpenClaw 指向它：

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

这会跳过 OpenClaw 内的自动生成和启动等待。自动生成时如果启动较慢，请设置 `channels.signal.startupTimeoutMs`。

## 访问控制（私信 + 群组）

私信：

- 默认：`channels.signal.dmPolicy = "pairing"`。
- 未知发送者会收到配对代码；批准前消息会被忽略（代码 1 小时后过期）。
- 通过以下方式批准：
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- 配对是 Signal 私信的默认 token 交换方式。详情：[配对](/zh-CN/channels/pairing)
- 仅 UUID 的发送者（来自 `sourceUuid`）会以 `uuid:<id>` 存储在 `channels.signal.allowFrom` 中。

群组：

- `channels.signal.groupPolicy = open | allowlist | disabled`。
- 设置 `allowlist` 时，`channels.signal.groupAllowFrom` 控制哪些群组或发送者可以触发群组回复；条目可以是 Signal 群组 ID（原始值、`group:<id>` 或 `signal:group:<id>`）、发送者电话号码、`uuid:<id>` 值或 `*`。
- `channels.signal.groups["<group-id>" | "*"]` 可以使用 `requireMention`、`tools` 和 `toolsBySender` 覆盖群组行为。
- 在多账号设置中，使用 `channels.signal.accounts.<id>.groups` 进行每账号覆盖。
- 通过 `groupAllowFrom` 将 Signal 群组加入允许列表，本身不会禁用提及门控。除非设置 `requireMention=true`，否则专门配置的 `channels.signal.groups["<group-id>"]` 条目会处理每条群组消息。
- 运行时说明：如果完全缺失 `channels.signal`，运行时会回退到 `groupPolicy="allowlist"` 进行群组检查（即使设置了 `channels.defaults.groupPolicy`）。

## 工作方式（行为）

- `signal-cli` 作为守护进程运行；Gateway 网关通过 SSE 读取事件。
- 入站消息会规范化为共享渠道信封。
- 回复始终路由回同一个号码或群组。

## 媒体 + 限制

- 出站文本会按 `channels.signal.textChunkLimit` 分块（默认 4000）。
- 可选换行分块：设置 `channels.signal.chunkMode="newline"`，可先按空行（段落边界）拆分，再按长度分块。
- 支持附件（从 `signal-cli` 获取 base64）。
- 当缺少 `contentType` 时，语音备注附件会使用 `signal-cli` 文件名作为 MIME 回退，因此音频转录仍可分类 AAC 语音备忘录。
- 默认媒体上限：`channels.signal.mediaMaxMb`（默认 8）。
- 使用 `channels.signal.ignoreAttachments` 跳过媒体下载。
- 群组历史上下文使用 `channels.signal.historyLimit`（或 `channels.signal.accounts.*.historyLimit`），并回退到 `messages.groupChat.historyLimit`。设置为 `0` 可禁用（默认 50）。

## 输入状态 + 已读回执

- **输入状态指示器**：OpenClaw 通过 `signal-cli sendTyping` 发送输入状态信号，并在回复运行时刷新它们。
- **已读回执**：当 `channels.signal.sendReadReceipts` 为 true 时，OpenClaw 会转发允许的私信的已读回执。
- signal-cli 不会暴露群组的已读回执。

## 反应（消息工具）

- 使用带有 `channel=signal` 的 `message action=react`。
- 目标：发送者 E.164 或 UUID（使用配对输出中的 `uuid:<id>`；裸 UUID 也可）。
- `messageId` 是你要反应的消息的 Signal 时间戳。
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
  - `off`/`ack` 禁用智能体反应（消息工具 `react` 会报错）。
  - `minimal`/`extensive` 启用智能体反应并设置指导级别。
- 每账号覆盖：`channels.signal.accounts.<id>.actions.reactions`、`channels.signal.accounts.<id>.reactionLevel`。

## 递送目标（CLI/cron）

- 私信：`signal:+15551234567`（或纯 E.164）。
- UUID 私信：`uuid:<id>`（或裸 UUID）。
- 群组：`signal:group:<groupId>`。
- 用户名：`username:<name>`（如果你的 Signal 账号支持）。

## 故障排除

先运行此排查阶梯：

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

常见失败：

- 守护进程可达但没有回复：验证账号/守护进程设置（`httpUrl`、`account`）和接收模式。
- 私信被忽略：发送者正在等待配对批准。
- 群组消息被忽略：群组发送者/提及门控阻止了递送。
- 编辑后出现配置验证错误：运行 `openclaw doctor --fix`。
- 诊断中缺少 Signal：确认 `channels.signal.enabled: true`。

额外检查：

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

排查流程见：[/channels/troubleshooting](/zh-CN/channels/troubleshooting)。

## 安全注意事项

- `signal-cli` 会在本地存储账号密钥（通常是 `~/.local/share/signal-cli/data/`）。
- 在服务器迁移或重建前备份 Signal 账号状态。
- 除非你明确想要更宽松的私信访问，否则保持 `channels.signal.dmPolicy: "pairing"`。
- 只有注册或恢复流程才需要短信验证，但失去对号码/账号的控制会让重新注册变复杂。

## 配置参考（Signal）

完整配置：[配置](/zh-CN/gateway/configuration)

提供商选项：

- `channels.signal.enabled`：启用/禁用渠道启动。
- `channels.signal.account`：机器人账号的 E.164。
- `channels.signal.cliPath`：`signal-cli` 的路径。
- `channels.signal.httpUrl`：完整守护进程 URL（覆盖主机/端口）。
- `channels.signal.httpHost`、`channels.signal.httpPort`：守护进程绑定（默认 127.0.0.1:8080）。
- `channels.signal.autoStart`：自动启动守护进程（如果未设置 `httpUrl`，默认 true）。
- `channels.signal.startupTimeoutMs`：启动等待超时时间，单位为 ms（上限 120000）。
- `channels.signal.receiveMode`：`on-start | manual`。
- `channels.signal.ignoreAttachments`：跳过附件下载。
- `channels.signal.ignoreStories`：忽略来自守护进程的动态。
- `channels.signal.sendReadReceipts`：转发已读回执。
- `channels.signal.dmPolicy`：`pairing | allowlist | open | disabled`（默认：pairing）。
- `channels.signal.allowFrom`：私信允许列表（E.164 或 `uuid:<id>`）。`open` 需要 `"*"`。Signal 没有用户名；使用手机号/UUID ID。
- `channels.signal.groupPolicy`：`open | allowlist | disabled`（默认：allowlist）。
- `channels.signal.groupAllowFrom`：群组允许列表；接受 Signal 群组 ID（原始值、`group:<id>` 或 `signal:group:<id>`）、发送者 E.164 号码，或 `uuid:<id>` 值。
- `channels.signal.groups`：按 Signal 群组 ID（或 `"*"`）作为键的每群组覆盖配置。支持字段：`requireMention`、`tools`、`toolsBySender`。
- `channels.signal.accounts.<id>.groups`：多账号设置中 `channels.signal.groups` 的每账号版本。
- `channels.signal.historyLimit`：作为上下文包含的最大群组消息数（0 会禁用）。
- `channels.signal.dmHistoryLimit`：以用户轮次计的私信历史限制。每用户覆盖配置：`channels.signal.dms["<phone_or_uuid>"].historyLimit`。
- `channels.signal.textChunkLimit`：出站分块大小（字符）。
- `channels.signal.chunkMode`：`length`（默认）或 `newline`，用于在按长度分块前按空行（段落边界）拆分。
- `channels.signal.mediaMaxMb`：入站/出站媒体上限（MB）。

相关全局选项：

- `agents.list[].groupChat.mentionPatterns`（Signal 不支持原生提及）。
- `messages.groupChat.mentionPatterns`（全局回退）。
- `messages.responsePrefix`。

## 相关

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信认证和配对流程
- [群组](/zh-CN/channels/groups) — 群组聊天行为和提及门控
- [渠道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固

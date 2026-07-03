---
read_when:
    - 设置 Signal 支持
    - 调试 Signal 发送/接收
summary: 通过 signal-cli（原生守护进程或 bbernhard 容器）支持 Signal、设置路径和号码模型
title: Signal
x-i18n:
    generated_at: "2026-07-03T15:19:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 862afe3764e89aa026d245f57134b8e8e157539f24975ca341d67296fb8852d0
    source_path: channels/signal.md
    workflow: 16
---

状态：外部 CLI 集成。Gateway 网关通过 HTTP 与 `signal-cli` 通信，即原生守护进程（JSON-RPC + SSE）或 bbernhard/signal-cli-rest-api 容器（REST + WebSocket）。

## 前提条件

- 你的服务器上已安装 OpenClaw（下面的 Linux 流程已在 Ubuntu 24 上测试）。
- 以下之一：
  - 主机上可用 `signal-cli`（原生模式），**或**
  - `bbernhard/signal-cli-rest-api` Docker 容器（容器模式）。
- 一个可以接收一条验证 SMS 的电话号码（用于 SMS 注册路径）。
- 注册期间可通过浏览器访问 Signal captcha（`signalcaptchas.org`）。

## 快速设置（初学者）

1. 为机器人使用一个**单独的 Signal 号码**（推荐）。
2. 安装 OpenClaw 插件：

```bash
openclaw plugins install @openclaw/signal
```

3. 安装 `signal-cli`（如果使用 JVM 构建版本，则需要 Java）。
4. 选择一个设置路径：
   - **路径 A（QR 链接）：** `signal-cli link -n "OpenClaw"`，然后用 Signal 扫描。
   - **路径 B（SMS 注册）：** 使用 captcha + SMS 验证注册一个专用号码。
5. 配置 OpenClaw 并重启 Gateway 网关。
6. 发送第一条私信并批准配对（`openclaw pairing approve signal <CODE>`）。

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

| 字段         | 描述                                               |
| ------------ | -------------------------------------------------- |
| `account`    | E.164 格式的机器人电话号码（`+15551234567`）       |
| `cliPath`    | `signal-cli` 的路径（如果在 `PATH` 上则为 `signal-cli`） |
| `configPath` | 作为 `--config` 传递的 signal-cli 配置目录         |
| `dmPolicy`   | 私信访问策略（推荐 `pairing`）                     |
| `allowFrom`  | 允许发送私信的电话号码或 `uuid:<id>` 值            |

## 它是什么

- 通过 `signal-cli` 实现的 Signal 渠道（不是嵌入式 libsignal）。
- 确定性路由：回复始终返回到 Signal。
- 私信共享智能体的主会话；群组是隔离的（`agent:<agentId>:signal:group:<groupId>`）。

## 配置写入

默认情况下，Signal 允许写入由 `/config set|unset` 触发的配置更新（需要 `commands.config: true`）。

用以下配置禁用：

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## 号码模型（重要）

- Gateway 网关连接到一个 **Signal 设备**（`signal-cli` 账户）。
- 如果你在**自己的个人 Signal 账户**上运行机器人，它会忽略你自己的消息（循环保护）。
- 如果想要“我给机器人发短信，它会回复”，请使用一个**单独的机器人号码**。

## 设置路径 A：链接现有 Signal 账户（QR）

1. 安装 `signal-cli`（JVM 或原生构建版本）。
2. 链接一个机器人账户：
   - `signal-cli link -n "OpenClaw"`，然后在 Signal 中扫描 QR。
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

多账户支持：使用 `channels.signal.accounts`，并为每个账户设置配置和可选的 `name`。共享模式见 [`gateway/configuration`](/zh-CN/gateway/config-channels#multi-account-all-channels)。

## 设置路径 B：注册专用机器人号码（SMS，Linux）

当你想使用专用机器人号码，而不是链接现有 Signal 应用账户时，请使用此路径。

1. 获取一个可以接收 SMS 的号码（或座机的语音验证）。
   - 使用专用机器人号码，避免账户/会话冲突。
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

如果需要 captcha：

1. 打开 `https://signalcaptchas.org/registration/generate.html`。
2. 完成 captcha，从“Open Signal”复制 `signalcaptcha://...` 链接目标。
3. 尽可能从与浏览器会话相同的外部 IP 运行。
4. 立即再次运行注册（captcha 令牌很快过期）：

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

5. 配对你的私信发送方：
   - 向机器人号码发送任意消息。
   - 在服务器上批准代码：`openclaw pairing approve signal <PAIRING_CODE>`。
   - 将机器人号码保存为手机联系人，以避免“Unknown contact”。

<Warning>
使用 `signal-cli` 注册电话号码账户可能会使该号码的主 Signal 应用会话失效。优先使用专用机器人号码；如果需要保留现有手机应用设置，请使用 QR 链接模式。
</Warning>

上游参考：

- `signal-cli` README：`https://github.com/AsamK/signal-cli`
- Captcha 流程：`https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- 链接流程：`https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 外部守护进程模式（httpUrl）

如果你想自行管理 `signal-cli`（JVM 冷启动慢、容器初始化或共享 CPU），请单独运行守护进程，并将 OpenClaw 指向它：

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

这会跳过 OpenClaw 内部的自动启动和启动等待。自动启动时如果启动较慢，请设置 `channels.signal.startupTimeoutMs`。

## 容器模式（bbernhard/signal-cli-rest-api）

你可以使用 [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) Docker 容器，而不是原生运行 `signal-cli`。它将 `signal-cli` 包装在 REST API 和 WebSocket 接口后面。

要求：

- 容器**必须**以 `MODE=json-rpc` 运行，才能实时接收消息。
- 在连接 OpenClaw 之前，请先在容器中注册或链接你的 Signal 账户。

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

当 `apiMode` 为 `"auto"` 时，OpenClaw 会将检测到的模式缓存 30 秒，以避免重复探测。只有在 `/v1/receive/{account}` 升级到 WebSocket 后，容器接收才会被选为流式传输方式，这需要 `MODE=json-rpc`。

在容器暴露匹配 API 的位置，容器模式支持与原生模式相同的 Signal 渠道操作：发送、接收、附件、正在输入指示器、已读/已查看回执、回应、群组和样式化文本。OpenClaw 会将其原生 Signal RPC 调用转换为容器的 REST payload，包括 `group.{base64(internal_id)}` 群组 ID，以及用于格式化文本的 `text_mode: "styled"`。

运维说明：

- 容器模式请使用 `autoStart: false`。选择 `apiMode: "container"` 时，OpenClaw 不应启动原生守护进程。
- 接收消息请使用 `MODE=json-rpc`。`MODE=normal` 可能让 `/v1/about` 看起来正常，但 `/v1/receive/{account}` 不会升级到 WebSocket，因此 OpenClaw 在 `auto` 模式下不会选择容器接收流式传输。
- 当你知道 `httpUrl` 指向 bbernhard 的 REST API 时，设置 `apiMode: "container"`。当你知道它指向原生 `signal-cli` JSON-RPC/SSE 时，设置 `apiMode: "native"`。部署可能变化时使用 `"auto"`。
- 容器附件下载遵循与原生模式相同的媒体字节限制。当服务器发送 `Content-Length` 时，过大的响应会在完整缓冲前被拒绝；否则会在流式传输过程中拒绝。

## 访问控制（私信 + 群组）

私信：

- 默认：`channels.signal.dmPolicy = "pairing"`。
- 未知发送方会收到配对代码；在批准前，消息会被忽略（代码 1 小时后过期）。
- 通过以下方式批准：
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- 配对是 Signal 私信的默认令牌交换方式。详情：[配对](/zh-CN/channels/pairing)
- 仅 UUID 的发送方（来自 `sourceUuid`）会以 `uuid:<id>` 存储在 `channels.signal.allowFrom` 中。

群组：

- `channels.signal.groupPolicy = open | allowlist | disabled`。
- 当设置为 `allowlist` 时，`channels.signal.groupAllowFrom` 控制哪些群组或发送方可以触发群组回复；条目可以是 Signal 群组 ID（原始值、`group:<id>` 或 `signal:group:<id>`）、发送方电话号码、`uuid:<id>` 值或 `*`。
- `channels.signal.groups["<group-id>" | "*"]` 可以用 `requireMention`、`tools` 和 `toolsBySender` 覆盖群组行为。
- 多账户设置中使用 `channels.signal.accounts.<id>.groups` 进行按账户覆盖。
- 通过 `groupAllowFrom` 将 Signal 群组加入允许列表，本身不会禁用提及门控。一个专门配置的 `channels.signal.groups["<group-id>"]` 条目会处理每条群组消息，除非设置了 `requireMention=true`。
- 运行时说明：如果完全缺少 `channels.signal`，运行时会在群组检查中回退到 `groupPolicy="allowlist"`（即使设置了 `channels.defaults.groupPolicy`）。

## 工作方式（行为）

- 原生模式：`signal-cli` 作为守护进程运行；Gateway 网关通过 SSE 读取事件。
- 容器模式：Gateway 网关通过 REST API 发送，并通过 WebSocket 接收。
- 入站消息会被规范化为共享渠道信封。
- 回复始终路由回相同的号码或群组。

## 媒体 + 限制

- 出站文本会按 `channels.signal.textChunkLimit` 分块（默认 4000）。
- 可选换行分块：设置 `channels.signal.chunkMode="newline"`，在按长度分块前先按空行（段落边界）拆分。
- 支持附件（从 `signal-cli` 获取 base64）。
- 当缺少 `contentType` 时，语音备注附件会使用 `signal-cli` 文件名作为 MIME 回退，因此音频转录仍可分类 AAC 语音备忘录。
- 默认媒体上限：`channels.signal.mediaMaxMb`（默认 8）。
- 使用 `channels.signal.ignoreAttachments` 跳过媒体下载。
- 群组历史上下文使用 `channels.signal.historyLimit`（或 `channels.signal.accounts.*.historyLimit`），并回退到 `messages.groupChat.historyLimit`。设置为 `0` 可禁用（默认 50）。

## 正在输入 + 已读回执

- **输入指示器**：OpenClaw 通过 `signal-cli sendTyping` 发送输入信号，并在回复运行时刷新它们。
- **已读回执**：当 `channels.signal.sendReadReceipts` 为 true 时，OpenClaw 会为允许的私信转发已读回执。
- signal-cli 不会暴露群组的已读回执。

## 生命周期状态回应

设置 `messages.statusReactions.enabled: true`，让 Signal 在入站轮次上显示共享的
排队/思考/工具/压缩/完成/错误回应生命周期。
Signal 使用入站消息时间戳作为回应目标；群组
回应会使用 Signal 群组 id 加原始发送者作为
目标作者发送。

状态回应还需要一个 ack 回应和匹配的
`messages.ackReactionScope`（`direct`、`group-all`、`group-mentions` 或 `all`）。
设置 `channels.signal.reactionLevel: "off"` 可禁用 Signal 状态回应。
消息工具 `react` 操作仍然更严格：它要求
`reactionLevel: "minimal"` 或 `"extensive"`。

`messages.removeAckAfterReply: true` 会在配置的保留时间后清除最终状态回应。
否则 Signal 会在最终完成/错误状态之后恢复初始 ack 回应。

## 回应（消息工具）

- 使用 `message action=react` 并设置 `channel=signal`。
- 目标：发送者 E.164 或 UUID（使用配对输出中的 `uuid:<id>`；裸 UUID 也可用）。
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
  - `minimal`/`extensive` 会启用智能体回应并设置指导级别。
- 按账号覆盖：`channels.signal.accounts.<id>.actions.reactions`、`channels.signal.accounts.<id>.reactionLevel`。

## 审批回应

Signal exec 和插件审批提示使用顶层 `approvals.exec` 和
`approvals.plugin` 路由块。Signal 没有
`channels.signal.execApprovals` 块。

- `👍` 批准一次。
- `👎` 拒绝。
- 当请求提供持久审批时，使用 `/approve <id> allow-always`。

审批回应解析需要来自
`channels.signal.allowFrom`、`channels.signal.defaultTo` 或匹配账号级字段的显式 Signal 审批者。
直接同聊天 exec 审批提示仍可在没有显式审批者的情况下抑制重复的本地 `/approve` 回退；
无审批者的群组审批会保持本地回退可见。

## 投递目标（CLI/cron）

- 私信：`signal:+15551234567`（或普通 E.164）。
- UUID 私信：`uuid:<id>`（或裸 UUID）。
- 群组：`signal:group:<groupId>`。
- 用户名：`username:<name>`（如果你的 Signal 账号支持）。

## 别名

当你想为重复使用的 Signal 目标设置稳定名称时，配置别名。
别名仅是 OpenClaw 侧配置；它们不会创建或编辑 Signal 联系人。

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

在接受 Signal 投递目标的任何位置使用别名：

```bash
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
```

按账号别名会继承顶层别名，并可添加或覆盖名称：

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

`openclaw directory peers list --channel signal` 和
`openclaw directory groups list --channel signal` 会列出已配置的别名。Signal
目录由配置支持；它不会实时查询 Signal 联系人或
修改 Signal 账号。

## 故障排除

先运行这个排查阶梯：

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

常见失败：

- 守护进程可达但没有回复：验证账号/守护进程设置（`httpUrl`、`account`）和接收模式。
- 私信被忽略：发送者正在等待配对审批。
- 群组消息被忽略：群组发送者/提及门控阻止投递。
- 编辑后出现配置验证错误：运行 `openclaw doctor --fix`。
- 诊断中缺少 Signal：确认 `channels.signal.enabled: true`。

额外检查：

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

分诊流程见：[/channels/troubleshooting](/zh-CN/channels/troubleshooting)。

## 安全说明

- `signal-cli` 会在本地存储账号密钥（通常是 `~/.local/share/signal-cli/data/`）。
- 在服务器迁移或重建前备份 Signal 账号状态。
- 保持 `channels.signal.dmPolicy: "pairing"`，除非你明确想要更宽泛的私信访问。
- SMS 验证仅在注册或恢复流程中需要，但失去对号码/账号的控制可能会让重新注册更复杂。

## 配置参考（Signal）

完整配置：[配置](/zh-CN/gateway/configuration)

提供商选项：

- `channels.signal.enabled`：启用/禁用渠道启动。
- `channels.signal.apiMode`：`auto | native | container`（默认：auto）。参见 [容器模式](#container-mode-bbernhardsignal-cli-rest-api)。
- `channels.signal.account`：Bot 账号的 E.164。
- `channels.signal.cliPath`：`signal-cli` 的路径。
- `channels.signal.configPath`：可选的 `signal-cli --config` 目录。
- `channels.signal.httpUrl`：完整守护进程 URL（覆盖主机/端口）。
- `channels.signal.httpHost`、`channels.signal.httpPort`：守护进程绑定（默认 127.0.0.1:8080）。
- `channels.signal.autoStart`：自动生成守护进程（如果未设置 `httpUrl`，默认 true）。
- `channels.signal.startupTimeoutMs`：启动等待超时，单位 ms（上限 120000）。
- `channels.signal.receiveMode`：`on-start | manual`。
- `channels.signal.ignoreAttachments`：跳过附件下载。
- `channels.signal.ignoreStories`：忽略来自守护进程的 stories。
- `channels.signal.sendReadReceipts`：转发已读回执。
- `channels.signal.dmPolicy`：`pairing | allowlist | open | disabled`（默认：pairing）。
- `channels.signal.allowFrom`：私信允许列表（E.164 或 `uuid:<id>`）。`open` 需要 `"*"`。Signal 没有用户名；使用电话/UUID id。
- `channels.signal.aliases`：OpenClaw 侧用于私信或群组投递目标的别名。
- `channels.signal.groupPolicy`：`open | allowlist | disabled`（默认：allowlist）。
- `channels.signal.groupAllowFrom`：群组允许列表；接受 Signal 群组 ID（原始值、`group:<id>` 或 `signal:group:<id>`）、发送者 E.164 号码或 `uuid:<id>` 值。
- `channels.signal.groups`：按 Signal 群组 id（或 `"*"`）键控的按群组覆盖。支持字段：`requireMention`、`tools`、`toolsBySender`。
- `channels.signal.accounts.<id>.groups`：用于多账号设置的 `channels.signal.groups` 按账号版本。
- `channels.signal.accounts.<id>.aliases`：按账号别名，会与顶层别名合并。
- `channels.signal.historyLimit`：作为上下文包含的最大群组消息数（0 禁用）。
- `channels.signal.dmHistoryLimit`：以用户轮次计的私信历史限制。按用户覆盖：`channels.signal.dms["<phone_or_uuid>"].historyLimit`。
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
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固

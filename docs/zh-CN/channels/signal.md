---
read_when:
    - 设置 Signal 支持
    - 调试 Signal 消息收发
summary: 通过 signal-cli（原生守护进程或 bbernhard 容器）支持 Signal、设置路径和号码模型
title: Signal
x-i18n:
    generated_at: "2026-07-16T11:22:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3941a5f0cde97b87c46b27f2b865cf473093dad0a5a5ada06b1934466420a6ea
    source_path: channels/signal.md
    workflow: 16
---

Signal 是一个可下载的渠道插件（`@openclaw/signal`）。Gateway 网关通过 HTTP 与 `signal-cli` 通信：可以使用原生守护进程（JSON-RPC + SSE），也可以使用 [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) 容器（REST + WebSocket）。OpenClaw 不内嵌 libsignal。

## 号码模型（请先阅读）

- Gateway 网关连接到一个 **Signal 设备**：即 `signal-cli` 账户。
- 在**你的个人 Signal 账户**上运行 Bot，会导致它忽略你自己发送的消息（循环保护）。
- 如果需要“我给 Bot 发消息，它会回复”，请使用一个**单独的 Bot 号码**。

## 安装

```bash
openclaw plugins install @openclaw/signal
```

对于不带来源的插件规范，系统会先尝试 ClawHub，然后回退到 npm。使用 `openclaw plugins install clawhub:@openclaw/signal` 或 `npm:@openclaw/signal` 可强制指定来源。`plugins install` 会注册并启用插件；无需单独执行 `enable` 步骤。常规安装规则请参阅[插件](/zh-CN/tools/plugin)。

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
    向导会检测 `signal-cli` 是否位于 `PATH` 中；如果缺失，则会提供安装选项：在 Linux x86-64 上下载官方原生 GraalVM 构建，在 macOS 和其他架构上则通过 Homebrew 安装。然后，它会提示输入 Bot 号码和 `signal-cli` 路径。

    对于非交互式设置，`openclaw channels add --channel signal` 还接受使用 `--signal-number <e164>` 指定 Bot 电话号码，并使用 `--http-host <host>` 和 `--http-port <port>` 指定 Signal 守护进程端点（默认为 `127.0.0.1:8080`）。

  </Step>
  <Step title="关联或注册账户">
    - **二维码关联（最快）：** `signal-cli link -n "OpenClaw"`，然后使用 Signal 扫描。请参阅[路径 A](#setup-path-a-link-existing-signal-account-qr)。
    - **短信注册：** 使用专用号码，通过验证码和短信验证完成注册。请参阅[路径 B](#setup-path-b-register-dedicated-bot-number-sms-linux)。

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

| 字段        | 说明                                       |
| ------------ | ------------------------------------------------- |
| `account`    | E.164 格式的 Bot 电话号码（`+15551234567`） |
| `cliPath`    | `signal-cli` 的路径（如果位于 `PATH` 中，则为 `signal-cli`）  |
| `configPath` | 通过 `--config` 传入的 signal-cli 配置目录        |
| `dmPolicy`   | 私信访问策略（推荐使用 `pairing`）          |
| `allowFrom`  | 允许发送私信的电话号码或 `uuid:<id>` 值 |

多账户支持：使用 `channels.signal.accounts` 提供各账户配置和可选的 `name`。共享模式请参阅[多账户渠道](/zh-CN/gateway/config-channels#multi-account-all-channels)。

## 工作原理

- 确定性路由：回复始终返回 Signal。
- 私信共享智能体的主会话；群组相互隔离（`agent:<agentId>:signal:group:<groupId>`）。
- 默认情况下，Signal 可以写入由 `/config set|unset` 触发的配置更新（需要 `commands.config: true`）。可通过 `channels.signal.configWrites: false` 禁用。

## 设置路径 A：关联现有 Signal 账户（二维码）

1. 安装 `signal-cli`（JVM 或原生构建），也可以让 `openclaw channels add` 代为安装。
2. 关联 Bot 账户：运行 `signal-cli link -n "OpenClaw"`，然后在 Signal 中扫描二维码。
3. 配置 Signal 并启动 Gateway 网关。

## 设置路径 B：注册专用 Bot 号码（短信，Linux）

如果要使用专用 Bot 号码，而不是关联现有 Signal 应用账户，请使用此方式。以下流程已在 Ubuntu 24 上测试。

1. 获取一个可以接收短信的号码（固定电话也可以使用语音验证）。使用专用 Bot 号码可以避免账户或会话冲突。
2. 在 Gateway 网关主机上安装 `signal-cli`：

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

如果使用 JVM 构建（`signal-cli-${VERSION}.tar.gz`），请先安装 JRE。请及时更新 `signal-cli`；上游说明指出，Signal 服务器 API 发生变化时，旧版本可能会无法使用。

3. 注册并验证号码：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

如果需要验证码（完成此步骤需要访问浏览器）：

1. 打开 `https://signalcaptchas.org/registration/generate.html`。
2. 完成验证码，然后从 “Open Signal” 复制 `signalcaptcha://...` 链接目标。
3. 尽可能从与浏览器会话相同的外部 IP 运行命令（验证码令牌很快就会过期）。
4. 立即注册并验证：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. 配置 OpenClaw，重启 Gateway 网关，然后验证渠道：

```bash
# 如果将 Gateway 网关作为用户 systemd 服务运行：
systemctl --user restart openclaw-gateway.service

# 然后验证：
openclaw doctor
openclaw channels status --probe
```

5. 配对你的私信发送方：
   - 向 Bot 号码发送任意消息。
   - 在服务器上批准：`openclaw pairing approve signal <PAIRING_CODE>`。
   - 将 Bot 号码保存为手机联系人，以避免出现 “Unknown contact”。

<Warning>
使用 `signal-cli` 注册电话号码账户，可能会使该号码的主要 Signal 应用会话失去身份验证。建议使用专用 Bot 号码，或使用二维码关联模式以保留现有的手机应用设置。
</Warning>

上游参考资料：

- `signal-cli` README：`https://github.com/AsamK/signal-cli`
- 验证码流程：`https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- 关联流程：`https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 外部守护进程模式（httpUrl）

如果需要自行管理 `signal-cli`（例如 JVM 冷启动较慢、需要初始化容器或使用共享 CPU），请单独运行守护进程，并将 OpenClaw 指向该进程：

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

这会跳过自动生成进程和 OpenClaw 的启动等待。对于自动生成但启动较慢的情况，请设置 `channels.signal.startupTimeoutMs`。

## 容器模式（bbernhard/signal-cli-rest-api）

除了以原生方式运行 `signal-cli`，还可以使用 [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) Docker 容器，该容器在 `signal-cli` 外封装了一层 REST + WebSocket 接口。

要求：

- 容器**必须**使用 `MODE=json-rpc` 运行，才能实时接收消息。
- 在连接 OpenClaw 之前，请先在容器内注册或关联你的 Signal 账户。

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
      apiMode: "container", // 或使用 "auto" 自动检测
    },
  },
}
```

`apiMode` 控制 OpenClaw 使用的协议：

| 值         | 行为                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | （默认）探测两种传输方式；流式传输会验证容器的 WebSocket 接收能力    |
| `"native"`    | 强制使用原生 signal-cli（`/api/v1/rpc` 上的 JSON-RPC，`/api/v1/events` 上的 SSE）         |
| `"container"` | 强制使用 bbernhard 容器（`/v2/send` 上的 REST，`/v1/receive/{account}` 上的 WebSocket） |

当 `apiMode` 为 `"auto"` 时，OpenClaw 会按守护进程 URL 将检测到的模式缓存 30 秒，以避免重复探测（两种传输方式均正常时，优先使用原生模式）。只有在 `/v1/receive/{account}` 成功升级到 WebSocket 后，系统才会为流式传输选择容器接收模式，而这需要 `MODE=json-rpc`。

当容器公开匹配的 API 时，容器模式支持与原生模式相同的 Signal 操作：发送、接收、附件、输入状态指示器、已读/已查看回执、表情回应、群组和样式文本。OpenClaw 会将原生 Signal RPC 调用转换为容器的 REST 载荷，其中包括 `group.{base64(internal_id)}` 群组 ID 和用于格式化文本的 `text_mode: "styled"`。

运维说明：

- 容器模式应使用 `autoStart: false`；选择 `apiMode: "container"` 时，OpenClaw 不应生成原生守护进程。
- 使用 `MODE=json-rpc` 接收消息。`MODE=normal` 可能会使 `/v1/about` 看起来状态正常，但 `/v1/receive/{account}` 不会升级为 WebSocket，因此 OpenClaw 在 `auto` 模式下不会选择容器接收流式传输。
- 当 `httpUrl` 指向 bbernhard REST API 时，请设置 `apiMode: "container"`；当其指向原生 `signal-cli` JSON-RPC/SSE 时，请设置 `"native"`；部署方式可能变化时，请设置 `"auto"`。
- 容器附件下载遵循与原生模式相同的媒体字节限制。当服务器发送 `Content-Length` 时，系统会在完整缓冲之前拒绝超大响应；否则会在流式传输过程中进行限制。

## 访问控制（私信 + 群组）

私信：

- 默认值：`channels.signal.dmPolicy = "pairing"`。
- 未知发送方会收到配对码；在获得批准之前，其消息会被忽略（配对码在 1 小时后过期）。
- 通过 `openclaw pairing list signal` 和 `openclaw pairing approve signal <CODE>` 批准。
- 配对是 Signal 私信的默认令牌交换方式。详情请参阅：[配对](/zh-CN/channels/pairing)
- 仅有 UUID 的发送方（来自 `sourceUuid`）会以 `uuid:<id>` 的形式存储在 `channels.signal.allowFrom` 中。

群组：

- `channels.signal.groupPolicy = open | allowlist | disabled`。
- 设置 `allowlist` 后，`channels.signal.groupAllowFrom` 控制哪些群组或发送方可以触发群组回复；条目可以是 Signal 群组 ID（原始格式、`group:<id>` 或 `signal:group:<id>`）、发送方电话号码、`uuid:<id>` 值或 `*`。
- `channels.signal.groups["<group-id>" | "*"]` 可以使用 `requireMention`、`tools` 和 `toolsBySender` 覆盖群组行为。
- 在多账户设置中，使用 `channels.signal.accounts.<id>.groups` 提供按账户覆盖的配置。
- 通过 `groupAllowFrom` 将 Signal 群组加入允许列表，本身不会禁用提及门控。除非设置了 `requireMention=true`，否则明确配置的 `channels.signal.groups["<group-id>"]` 条目会处理每一条群组消息。
- 使用 `requireMention=true` 时，系统会根据结构化提及元数据，将 Signal 原生 @提及与 Bot 账户的电话号码或 `accountUuid` 进行匹配。已配置的 `mentionPatterns` 仍用作纯文本回退。
- 运行时说明：如果完全缺少 `channels.signal`，运行时会回退到 `groupPolicy="allowlist"` 进行群组检查（即使已设置 `channels.defaults.groupPolicy`）。

带有限上下文的提及门控群组：

```json5
{
  channels: {
    signal: {
      account: "+15551234567",
      accountUuid: "bot-signal-uuid",
      groupPolicy: "allowlist",
      groupAllowFrom: ["group:<signal-group-id>"],
      historyLimit: 8,
      groups: {
        "<signal-group-id>": { requireMention: true },
      },
    },
  },
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
}
```

允许的群组消息如果未提及机器人，将不会触发响应，只会保留在有界的待处理历史窗口中。当后续原生 @提及或后备文本提及触发机器人时，OpenClaw 会包含这些近期上下文，并回复同一群组。被跳过的附件正文不会下载；它们可能仅以精简的媒体占位符形式出现在待处理上下文中。

## 工作原理（行为）

- 原生模式：`signal-cli` 作为守护进程运行；Gateway 网关通过 SSE 读取事件。
- 容器模式：Gateway 网关通过 REST API 发送，并通过 WebSocket 接收。
- 入站消息会标准化为共享渠道信封。
- 回复始终路由回同一号码或群组。
- 回复入站消息时，如果后端接受入站时间戳和作者，则会包含原生 Signal 引用元数据；如果引用元数据缺失或被拒绝，OpenClaw 会将回复作为普通消息发送。
- 使用 `channels.signal.replyToMode = off | first | all | batched` 配置原生引用，或使用 `channels.signal.replyToModeByChatType.direct/group` 按聊天类型覆盖。`channels.signal.accounts.<id>` 下的账户级值优先。

## 媒体和限制

- 出站文本按 `channels.signal.textChunkLimit` 分块（默认 4000）。
- 可选的换行分块：设置 `channels.signal.streaming.chunkMode="newline"`，先按空行（段落边界）拆分，再按长度分块。
- 支持附件（从 `signal-cli` 获取 base64）。
- 当缺少 `contentType` 时，语音便笺附件使用 `signal-cli` 文件名作为 MIME 后备值，以便音频转录仍能将 AAC 语音备忘录分类。
- 默认媒体上限：`channels.signal.mediaMaxMb`（默认 8）。
- 使用 `channels.signal.ignoreAttachments` 跳过媒体下载。
- 群组历史上下文使用 `channels.signal.historyLimit`（或 `channels.signal.accounts.*.historyLimit`），后备为 `messages.groupChat.historyLimit`。设置 `0` 可禁用（默认 50）。

## 正在输入状态和已读回执

- **正在输入指示器**：OpenClaw 通过 `signal-cli sendTyping` 发送正在输入信号，并在回复运行期间持续刷新。
- **已读回执**：当 `channels.signal.sendReadReceipts` 为 true 时，OpenClaw 会转发已允许私信的已读回执。
- `signal-cli` 不会公开群组的已读回执。

## 生命周期状态表情回应

设置 `messages.statusReactions.enabled: true`，让 Signal 在入站轮次中显示共享的已排队/思考中/工具/压缩/完成/错误表情回应生命周期。Signal 使用入站消息的时间戳作为表情回应目标；群组表情回应使用 Signal 群组 ID，并以原始发送者作为目标作者发送。

状态表情回应还需要确认表情回应和匹配的 `messages.ackReactionScope`（`direct`、`group-all`、`group-mentions` 或 `all`）。设置 `channels.signal.reactionLevel: "off"` 可禁用 Signal 状态表情回应。

`messages.removeAckAfterReply: true` 会在配置的保留时间后清除最终状态表情回应。否则，Signal 会在最终完成/错误状态后恢复初始确认表情回应。

## 表情回应（消息工具）

将 `message action=react` 与 `channel=signal` 配合使用。

- 目标：发送者的 E.164 或 UUID（使用配对输出中的 `uuid:<id>`；裸 UUID 也可以）。
- `messageId` 是要添加表情回应的消息对应的 Signal 时间戳。
- 群组表情回应需要 `targetAuthor` 或 `targetAuthorUuid`。

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

配置：

- `channels.signal.actions.reactions`：启用/禁用表情回应操作（默认为 true）。
- `channels.signal.reactionLevel`：`off | ack | minimal | extensive`（默认为 `minimal`）。
  - `off`/`ack` 会禁用智能体表情回应（消息工具 `react` 会报错）。
  - `minimal`/`extensive` 会启用智能体表情回应并设置指导级别。
- 按账户覆盖：`channels.signal.accounts.<id>.actions.reactions`、`channels.signal.accounts.<id>.reactionLevel`。

## 审批表情回应

Signal Exec 和插件审批提示使用顶层 `approvals.exec` 和 `approvals.plugin` 路由块。Signal 没有 `channels.signal.execApprovals` 块。

- `👍` 批准一次。
- `👎` 拒绝。
- 当请求提供永久批准选项时，使用 `/approve <id> allow-always`。

解析审批表情回应需要在 `channels.signal.allowFrom`、`channels.signal.defaultTo` 或匹配的账户级字段中明确指定 Signal 审批者。同一聊天中的直接 Exec 审批提示即使没有明确审批者，仍可禁止重复的本地 `/approve` 后备提示；没有审批者的群组审批会继续显示本地后备提示。

## 投递目标（CLI/cron）

- 私信：`signal:+15551234567`（或纯 E.164）。
- UUID 私信：`uuid:<id>`（或裸 UUID）。
- 群组：`signal:group:<groupId>`。
- 用户名：`username:<name>`（如果你的 Signal 账户支持）。

## 别名

为经常使用的 Signal 目标配置稳定名称的别名。别名仅是 OpenClaw 侧配置；它们不会创建或编辑 Signal 联系人。

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

`openclaw directory peers list --channel signal` 和 `openclaw directory groups list --channel signal` 会列出已配置的别名。Signal 目录由配置支持；它不会实时查询 Signal 联系人，也不会修改 Signal 账户。

## 故障排查

首先运行以下排查步骤：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

如有需要，再确认私信配对状态：

```bash
openclaw pairing list signal
```

常见故障：

- 守护进程可访问但没有回复：验证账户/守护进程设置（`httpUrl`、`account`）和接收模式。
- 私信被忽略：发送者正在等待配对批准。
- 群组消息被忽略：群组发送者/提及门控阻止了投递。
- 编辑后出现配置验证错误：运行 `openclaw doctor --fix`。
- 诊断信息中缺少 Signal：确认 `channels.signal.enabled: true`。

其他检查：

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

有关分诊流程，请参阅[渠道故障排除](/zh-CN/channels/troubleshooting)。

## 安全说明

- `signal-cli` 在本地存储账户密钥（通常为 `~/.local/share/signal-cli/data/`）。
- 在迁移或重建服务器之前，请备份 Signal 账户状态。
- 保留 `channels.signal.dmPolicy: "pairing"`，除非明确需要更宽泛的私信访问权限。
- 仅注册或恢复流程需要 SMS 验证，但失去对号码/账户的控制可能会使重新注册变得复杂。

## 配置参考（Signal）

完整配置：[配置](/zh-CN/gateway/configuration)

提供商选项：

- `channels.signal.enabled`：启用/禁用渠道启动。
- `channels.signal.apiMode`：`auto | native | container`（默认：auto）。请参阅[容器模式](#container-mode-bbernhardsignal-cli-rest-api)。
- `channels.signal.account`：机器人账户的 E.164。
- `channels.signal.accountUuid`：用于原生 @提及检测和循环保护的可选机器人账户 UUID。
- `channels.signal.cliPath`：`signal-cli` 的路径。
- `channels.signal.configPath`：可选的 `signal-cli --config` 目录。
- `channels.signal.httpUrl`：完整的守护进程 URL（覆盖主机/端口）。
- `channels.signal.httpHost`、`channels.signal.httpPort`：守护进程绑定地址（默认为 `127.0.0.1:8080`）。
- `channels.signal.autoStart`：自动生成守护进程（未设置 `httpUrl` 时默认为 true）。
- `channels.signal.startupTimeoutMs`：启动等待超时，以 ms 为单位（最小值 1000，上限 120000；默认值 30000）。
- `channels.signal.receiveMode`：`on-start | manual`。
- `channels.signal.ignoreAttachments`：跳过附件下载。
- `channels.signal.ignoreStories`：忽略来自守护进程的快拍。
- `channels.signal.sendReadReceipts`：转发已读回执。
- `channels.signal.dmPolicy`：`pairing | allowlist | open | disabled`（默认：配对）。
- `channels.signal.allowFrom`：私信允许列表（E.164 或 `uuid:<id>`）。`open` 需要 `"*"`。Signal 没有用户名；请使用电话/UUID ID。
- `channels.signal.aliases`：用于私信或群组投递目标的 OpenClaw 侧别名。
- `channels.signal.groupPolicy`：`open | allowlist | disabled`（默认：允许列表）。
- `channels.signal.groupAllowFrom`：群组允许列表；接受 Signal 群组 ID（原始格式、`group:<id>` 或 `signal:group:<id>`）、发送者 E.164 号码或 `uuid:<id>` 值。
- `channels.signal.groups`：以 Signal 群组 ID（或 `"*"`）为键的按群组覆盖。支持的字段：`requireMention`、`tools`、`toolsBySender`。
- `channels.signal.accounts.<id>.groups`：多账户设置中 `channels.signal.groups` 的按账户版本。
- `channels.signal.accounts.<id>.aliases`：按账户配置的别名，与顶层别名合并。
- `channels.signal.replyToMode`：原生回复引用模式，`off | first | all | batched`（默认：`all`）。
- `channels.signal.replyToModeByChatType.direct`、`channels.signal.replyToModeByChatType.group`：按聊天类型配置的原生回复引用覆盖。
- `channels.signal.accounts.<id>.replyToMode`、`channels.signal.accounts.<id>.replyToModeByChatType.direct`、`channels.signal.accounts.<id>.replyToModeByChatType.group`：按账户配置的回复引用覆盖。
- `channels.signal.historyLimit`：作为上下文包含的最大群组消息数（0 表示禁用）。
- `channels.signal.dmHistoryLimit`：以用户轮次计的私信历史限制。按用户覆盖：`channels.signal.dms["<phone_or_uuid>"].historyLimit`。
- `channels.signal.textChunkLimit`：出站分块的字符数（默认 4000）。
- `channels.signal.streaming.chunkMode`：`length`（默认）或 `newline`，用于先按空行（段落边界）拆分，再按长度分块。
- `channels.signal.mediaMaxMb`：入站/出站媒体上限，以 MB 为单位（默认 8）。
- `channels.signal.reactionLevel`：`off | ack | minimal | extensive`（默认为 `minimal`）。请参阅[表情回应](#reactions-message-tool)。
- `channels.signal.reactionNotifications`：`off | own | all | allowlist`（默认为 `own`）——智能体何时收到他人传入表情回应的通知。
- `channels.signal.reactionAllowlist`：当 `reactionNotifications: "allowlist"` 时，其表情回应会通知智能体的发送者。
- `channels.signal.streaming.block.enabled`、`channels.signal.streaming.block.coalesce`：所有渠道共享的分块流式传输控制项。请参阅[流式传输](/zh-CN/concepts/streaming)。

相关全局选项：

- `agents.list[].groupChat.mentionPatterns`（纯文本回退；配置了 Bot 账户身份后，会从结构化元数据中检测 Signal 原生 @提及）。
- `messages.groupChat.mentionPatterns`（全局回退）。
- `messages.responsePrefix`。

## 相关内容

- [渠道概览](/zh-CN/channels) - 所有受支持的渠道
- [配对](/zh-CN/channels/pairing) - 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) - 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) - 消息的会话路由
- [安全性](/zh-CN/gateway/security) - 访问模型和安全强化

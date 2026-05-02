---
read_when:
    - 开发 Nextcloud Talk 渠道功能
summary: Nextcloud Talk 支持状态、能力和配置
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-05-02T21:57:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4956586ae8622118dcf136f4279c6ed1c2895fd4bb4576a7f5799de600a95740
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Status：内置插件（webhook 机器人）。支持私信、房间、表情回应和 Markdown 消息。

## 内置插件

Nextcloud Talk 在当前 OpenClaw 版本中作为内置插件提供，因此
普通打包构建不需要单独安装。

如果你使用的是较旧构建，或自定义安装中排除了 Nextcloud Talk，
请直接安装 npm package：

通过 CLI 安装（npm registry）：

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

使用裸 package 可跟随当前官方发布标签。只有在需要可复现安装时，
才固定精确版本。

本地检出（从 git repo 运行时）：

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

详情：[插件](/zh-CN/tools/plugin)

## 快速设置（初学者）

1. 确保 Nextcloud Talk 插件可用。
   - 当前打包的 OpenClaw 版本已经内置它。
   - 较旧/自定义安装可以使用上面的命令手动添加。
2. 在你的 Nextcloud 服务器上创建一个机器人：

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. 在目标房间设置中启用该机器人。
4. 配置 OpenClaw：
   - 配置：`channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - 或环境变量：`NEXTCLOUD_TALK_BOT_SECRET`（仅默认账户）

   CLI 设置：

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   等效的显式字段：

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   基于文件的 secret：

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. 重启 Gateway 网关（或完成设置）。

最小配置：

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## 注意事项

- 机器人不能发起私信。用户必须先给机器人发送消息。
- Webhook URL 必须能被 Gateway 网关访问；如果位于代理之后，请设置 `webhookPublicUrl`。
- 机器人 API 不支持媒体上传；媒体会以 URL 形式发送。
- webhook payload 不区分私信和房间；设置 `apiUser` + `apiPassword` 以启用房间类型查询（否则私信会被视为房间）。

## 访问控制（私信）

- 默认值：`channels.nextcloud-talk.dmPolicy = "pairing"`。未知发送者会收到配对码。
- 通过以下方式批准：
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- 公开私信：`channels.nextcloud-talk.dmPolicy="open"` 加上 `channels.nextcloud-talk.allowFrom=["*"]`。
- `allowFrom` 只匹配 Nextcloud 用户 ID；显示名称会被忽略。

## 房间（群组）

- 默认值：`channels.nextcloud-talk.groupPolicy = "allowlist"`（需要提及）。
- 使用 `channels.nextcloud-talk.rooms` 将房间加入允许列表：

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- 如需不允许任何房间，请保持允许列表为空，或设置 `channels.nextcloud-talk.groupPolicy="disabled"`。

## 能力

| 功能         | Status        |
| --------------- | ------------- |
| 私信 | 支持     |
| 房间           | 支持     |
| 线程         | 不支持 |
| 媒体           | 仅 URL      |
| 表情回应       | 支持     |
| 原生命令 | 不支持 |

## 配置参考（Nextcloud Talk）

完整配置：[配置](/zh-CN/gateway/configuration)

提供商选项：

- `channels.nextcloud-talk.enabled`：启用/禁用渠道启动。
- `channels.nextcloud-talk.baseUrl`：Nextcloud 实例 URL。
- `channels.nextcloud-talk.botSecret`：机器人共享 secret。
- `channels.nextcloud-talk.botSecretFile`：普通文件 secret 路径。符号链接会被拒绝。
- `channels.nextcloud-talk.apiUser`：用于房间查询（私信检测）的 API 用户。
- `channels.nextcloud-talk.apiPassword`：用于房间查询的 API/app 密码。
- `channels.nextcloud-talk.apiPasswordFile`：API 密码文件路径。
- `channels.nextcloud-talk.webhookPort`：webhook 监听器端口（默认：8788）。
- `channels.nextcloud-talk.webhookHost`：webhook host（默认：0.0.0.0）。
- `channels.nextcloud-talk.webhookPath`：webhook path（默认：/nextcloud-talk-webhook）。
- `channels.nextcloud-talk.webhookPublicUrl`：外部可访问的 webhook URL。
- `channels.nextcloud-talk.dmPolicy`：`pairing | allowlist | open | disabled`。
- `channels.nextcloud-talk.allowFrom`：私信允许列表（用户 ID）。`open` 需要 `"*"`。
- `channels.nextcloud-talk.groupPolicy`：`allowlist | open | disabled`。
- `channels.nextcloud-talk.groupAllowFrom`：群组允许列表（用户 ID）。
- `channels.nextcloud-talk.rooms`：每个房间的设置和允许列表。
- `channels.nextcloud-talk.historyLimit`：群组历史记录限制（0 表示禁用）。
- `channels.nextcloud-talk.dmHistoryLimit`：私信历史记录限制（0 表示禁用）。
- `channels.nextcloud-talk.dms`：每个私信的覆盖项（historyLimit）。
- `channels.nextcloud-talk.textChunkLimit`：出站文本分块大小（字符数）。
- `channels.nextcloud-talk.chunkMode`：`length`（默认）或 `newline`，用于在按长度分块前按空行（段落边界）拆分。
- `channels.nextcloud-talk.blockStreaming`：为此渠道禁用分块流式传输。
- `channels.nextcloud-talk.blockStreamingCoalesce`：分块流式传输合并调优。
- `channels.nextcloud-talk.mediaMaxMb`：入站媒体上限（MB）。

## 相关

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信认证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [渠道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固

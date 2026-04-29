---
read_when:
    - 开发 Nextcloud Talk 渠道功能
summary: Nextcloud Talk 支持状态、能力和配置
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-29T05:37:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: fcbe8a65adfddc95d2b4944af88f9982e23a1676752efec2bbf40cfc4dd846d2
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Status：内置插件（webhook bot）。支持私信、房间、回应和 Markdown 消息。

## 内置插件

Nextcloud Talk 在当前 OpenClaw 版本中作为内置插件提供，因此
普通打包构建不需要单独安装。

如果你使用的是旧版构建，或是不包含 Nextcloud Talk 的自定义安装，
请在发布当前 npm 包后安装它：

通过 CLI 安装（npm registry，存在当前包时）：

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

如果 npm 报告 OpenClaw 所有的包已弃用，请使用当前打包的
OpenClaw 构建，或在发布更新的 npm 包前使用本地 checkout 路径。

本地 checkout（从 git repo 运行时）：

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

详情：[插件](/zh-CN/tools/plugin)

## 快速设置（初学者）

1. 确保 Nextcloud Talk 插件可用。
   - 当前打包的 OpenClaw 版本已经内置它。
   - 旧版/自定义安装可以用上面的命令手动添加它。
2. 在你的 Nextcloud 服务器上创建 bot：

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. 在目标房间设置中启用 bot。
4. 配置 OpenClaw：
   - 配置：`channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - 或环境变量：`NEXTCLOUD_TALK_BOT_SECRET`（仅默认账户）

   CLI 设置：

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   等价的显式字段：

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   文件后端密钥：

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

## 备注

- Bot 不能主动发起私信。用户必须先给 bot 发送消息。
- Gateway 网关 必须能够访问 webhook URL；如果位于代理后面，请设置 `webhookPublicUrl`。
- bot API 不支持媒体上传；媒体会作为 URL 发送。
- webhook payload 不区分私信和房间；设置 `apiUser` + `apiPassword` 可启用房间类型查询（否则私信会被视为房间）。

## 访问控制（私信）

- 默认：`channels.nextcloud-talk.dmPolicy = "pairing"`。未知发送者会收到配对码。
- 通过以下方式批准：
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- 公开私信：`channels.nextcloud-talk.dmPolicy="open"` 加 `channels.nextcloud-talk.allowFrom=["*"]`。
- `allowFrom` 仅匹配 Nextcloud 用户 ID；显示名称会被忽略。

## 房间（群组）

- 默认：`channels.nextcloud-talk.groupPolicy = "allowlist"`（需要提及）。
- 用 `channels.nextcloud-talk.rooms` 将房间加入允许列表：

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

- 要不允许任何房间，请保持允许列表为空，或设置 `channels.nextcloud-talk.groupPolicy="disabled"`。

## 能力

| 功能 | Status |
| --------------- | ------------- |
| 私信 | 支持 |
| 房间 | 支持 |
| 线程 | 不支持 |
| 媒体 | 仅 URL |
| 回应 | 支持 |
| 原生命令 | 不支持 |

## 配置参考（Nextcloud Talk）

完整配置：[配置](/zh-CN/gateway/configuration)

提供商选项：

- `channels.nextcloud-talk.enabled`：启用/禁用渠道启动。
- `channels.nextcloud-talk.baseUrl`：Nextcloud 实例 URL。
- `channels.nextcloud-talk.botSecret`：bot 共享密钥。
- `channels.nextcloud-talk.botSecretFile`：常规文件密钥路径。符号链接会被拒绝。
- `channels.nextcloud-talk.apiUser`：用于房间查询（私信检测）的 API 用户。
- `channels.nextcloud-talk.apiPassword`：用于房间查询的 API/app 密码。
- `channels.nextcloud-talk.apiPasswordFile`：API 密码文件路径。
- `channels.nextcloud-talk.webhookPort`：webhook 监听端口（默认：8788）。
- `channels.nextcloud-talk.webhookHost`：webhook host（默认：0.0.0.0）。
- `channels.nextcloud-talk.webhookPath`：webhook path（默认：/nextcloud-talk-webhook）。
- `channels.nextcloud-talk.webhookPublicUrl`：外部可访问的 webhook URL。
- `channels.nextcloud-talk.dmPolicy`：`pairing | allowlist | open | disabled`。
- `channels.nextcloud-talk.allowFrom`：私信允许列表（用户 ID）。`open` 需要 `"*"`。
- `channels.nextcloud-talk.groupPolicy`：`allowlist | open | disabled`。
- `channels.nextcloud-talk.groupAllowFrom`：群组允许列表（用户 ID）。
- `channels.nextcloud-talk.rooms`：按房间的设置和允许列表。
- `channels.nextcloud-talk.historyLimit`：群组历史记录限制（0 表示禁用）。
- `channels.nextcloud-talk.dmHistoryLimit`：私信历史记录限制（0 表示禁用）。
- `channels.nextcloud-talk.dms`：按私信的覆盖项（historyLimit）。
- `channels.nextcloud-talk.textChunkLimit`：出站文本分块大小（字符）。
- `channels.nextcloud-talk.chunkMode`：`length`（默认）或 `newline`，用于在按长度分块前按空行（段落边界）拆分。
- `channels.nextcloud-talk.blockStreaming`：为此渠道禁用分块流式传输。
- `channels.nextcloud-talk.blockStreamingCoalesce`：分块流式传输合并调优。
- `channels.nextcloud-talk.mediaMaxMb`：入站媒体上限（MB）。

## 相关

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [渠道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固

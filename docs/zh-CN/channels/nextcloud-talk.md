---
read_when:
    - 开发 Nextcloud Talk 渠道功能
summary: Nextcloud Talk 支持状态、能力和配置
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-05-10T19:22:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: e4b3b2d074cc8d3c19223dbb0c306c6861717d0f35e638e3aab04b03647fd248
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Status: 内置插件（webhook bot）。支持私信、房间、回应和 Markdown 消息。

## 内置插件

Nextcloud Talk 在当前 OpenClaw 版本中作为内置插件发布，因此
正常的打包构建不需要单独安装。

如果你使用较旧构建，或自定义安装中排除了 Nextcloud Talk，
请直接安装 npm 包：

通过 CLI 安装（npm 注册表）：

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

使用裸包可跟随当前官方发布标签。只有在需要可复现安装时才固定精确
版本。

本地检出（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

详情：[插件](/zh-CN/tools/plugin)

## 快速设置（新手）

1. 确保 Nextcloud Talk 插件可用。
   - 当前打包的 OpenClaw 版本已经内置它。
   - 较旧/自定义安装可以使用上面的命令手动添加它。
2. 在你的 Nextcloud 服务器上创建一个 bot：

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

3. 在目标房间设置中启用该 bot。
4. 配置 OpenClaw：
   - 配置：`channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - 或环境变量：`NEXTCLOUD_TALK_BOT_SECRET`（仅默认账号）

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

   文件支持的 secret：

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

- Bot 无法主动发起私信。用户必须先给 bot 发送消息。
- webhook URL 必须能被 Gateway 网关访问；如果位于代理之后，请设置 `webhookPublicUrl`。
- bot API 不支持媒体上传；媒体会以 URL 形式发送。
- webhook 载荷不会区分私信和房间；设置 `apiUser` + `apiPassword` 以启用房间类型查找（否则私信会被视为房间）。

## 访问控制（私信）

- 默认：`channels.nextcloud-talk.dmPolicy = "pairing"`。未知发送者会收到配对码。
- 通过以下方式批准：
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- 公开私信：`channels.nextcloud-talk.dmPolicy="open"` 加上 `channels.nextcloud-talk.allowFrom=["*"]`。
- `allowFrom` 只匹配 Nextcloud 用户 ID；显示名称会被忽略。

## 房间（群组）

- 默认：`channels.nextcloud-talk.groupPolicy = "allowlist"`（提及门控）。
- 使用 `channels.nextcloud-talk.rooms` 将房间加入 allowlist：

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

- 若不允许任何房间，请保持 allowlist 为空，或设置 `channels.nextcloud-talk.groupPolicy="disabled"`。

## 能力

| 功能         | Status        |
| --------------- | ------------- |
| 私信 | 支持     |
| 房间           | 支持     |
| 线程         | 不支持 |
| 媒体           | 仅 URL      |
| 回应       | 支持     |
| 原生命令 | 不支持 |

## 配置参考（Nextcloud Talk）

完整配置：[配置](/zh-CN/gateway/configuration)

提供商选项：

- `channels.nextcloud-talk.enabled`：启用/禁用渠道启动。
- `channels.nextcloud-talk.baseUrl`：Nextcloud 实例 URL。
- `channels.nextcloud-talk.botSecret`：bot 共享 secret。
- `channels.nextcloud-talk.botSecretFile`：常规文件 secret 路径。符号链接会被拒绝。
- `channels.nextcloud-talk.apiUser`：用于房间查找（私信检测）的 API 用户。
- `channels.nextcloud-talk.apiPassword`：用于房间查找的 API/app 密码。
- `channels.nextcloud-talk.apiPasswordFile`：API 密码文件路径。
- `channels.nextcloud-talk.webhookPort`：webhook 监听端口（默认：8788）。
- `channels.nextcloud-talk.webhookHost`：webhook 主机（默认：0.0.0.0）。
- `channels.nextcloud-talk.webhookPath`：webhook 路径（默认：/nextcloud-talk-webhook）。
- `channels.nextcloud-talk.webhookPublicUrl`：外部可访问的 webhook URL。
- `channels.nextcloud-talk.dmPolicy`：`pairing | allowlist | open | disabled`。
- `channels.nextcloud-talk.allowFrom`：私信 allowlist（用户 ID）。`open` 需要 `"*"`。
- `channels.nextcloud-talk.groupPolicy`：`allowlist | open | disabled`。
- `channels.nextcloud-talk.groupAllowFrom`：群组 allowlist（用户 ID）。
- `channels.nextcloud-talk.rooms`：按房间设置和 allowlist。
- 静态发送者访问组可以通过 `accessGroup:<name>` 从 `allowFrom` 和 `groupAllowFrom` 引用。
- `channels.nextcloud-talk.historyLimit`：群组历史限制（0 表示禁用）。
- `channels.nextcloud-talk.dmHistoryLimit`：私信历史限制（0 表示禁用）。
- `channels.nextcloud-talk.dms`：按私信覆盖（historyLimit）。
- `channels.nextcloud-talk.textChunkLimit`：出站文本分块大小（字符）。
- `channels.nextcloud-talk.chunkMode`：`length`（默认）或 `newline`，用于先按空行（段落边界）拆分，再按长度分块。
- `channels.nextcloud-talk.blockStreaming`：为此渠道禁用分块流式传输。
- `channels.nextcloud-talk.blockStreamingCoalesce`：分块流式传输合并调优。
- `channels.nextcloud-talk.mediaMaxMb`：入站媒体上限（MB）。

## 相关

- [频道概览](/zh-CN/channels) — 所有支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) — 群组聊天行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全性](/zh-CN/gateway/security) — 访问模型和加固

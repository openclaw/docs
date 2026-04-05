---
read_when:
    - 处理 Nextcloud Talk 渠道功能时
summary: Nextcloud Talk 支持状态、功能与配置
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-05T08:15:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 900402afe67cf3ce96103d55158eb28cffb29c9845b77248e70d7653b12ae810
    source_path: channels/nextcloud-talk.md
    workflow: 15
---

# Nextcloud Talk

状态：内置渠道插件（webhook 机器人）。支持私信、房间、反应和 Markdown 消息。

## 内置插件

Nextcloud Talk 作为当前 OpenClaw 版本中的内置插件随附提供，因此普通打包构建不需要单独安装。

如果你使用的是较旧版本，或是不包含 Nextcloud Talk 的自定义安装，请手动安装：

通过 CLI 安装（npm registry）：

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

本地检出安装（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

详情参见：[插件](/tools/plugin)

## 快速设置（新手）

1. 确保 Nextcloud Talk 插件可用。
   - 当前打包版 OpenClaw 已内置该插件。
   - 较旧/自定义安装可使用上面的命令手动添加。
2. 在你的 Nextcloud 服务器上，创建一个机器人：

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. 在目标房间设置中启用该机器人。
4. 配置 OpenClaw：
   - 配置：`channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - 或环境变量：`NEXTCLOUD_TALK_BOT_SECRET`（仅默认账户）
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

## 说明

- 机器人不能主动发起私信。用户必须先向机器人发送消息。
- webhook URL 必须可被 Gateway 网关访问；如果位于代理之后，请设置 `webhookPublicUrl`。
- 机器人 API 不支持媒体上传；媒体会以 URL 形式发送。
- webhook 负载无法区分私信和房间；请设置 `apiUser` + `apiPassword` 以启用房间类型查询（否则私信会被当作房间处理）。

## 访问控制（私信）

- 默认：`channels.nextcloud-talk.dmPolicy = "pairing"`。未知发送者会收到配对码。
- 通过以下方式批准：
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- 公开私信：`channels.nextcloud-talk.dmPolicy="open"`，并且 `channels.nextcloud-talk.allowFrom=["*"]`。
- `allowFrom` 仅匹配 Nextcloud 用户 ID；显示名称会被忽略。

## 房间（群组）

- 默认：`channels.nextcloud-talk.groupPolicy = "allowlist"`（受 mention 门控）。
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

- 如需不允许任何房间访问，请保持 allowlist 为空，或设置 `channels.nextcloud-talk.groupPolicy="disabled"`。

## 功能

| 功能 | 状态 |
| --------------- | ------------- |
| 私信 | 支持 |
| 房间 | 支持 |
| 线程 | 不支持 |
| 媒体 | 仅 URL |
| 反应 | 支持 |
| 原生命令 | 不支持 |

## 配置参考（Nextcloud Talk）

完整配置：[配置](/gateway/configuration)

提供商选项：

- `channels.nextcloud-talk.enabled`：启用/禁用渠道启动。
- `channels.nextcloud-talk.baseUrl`：Nextcloud 实例 URL。
- `channels.nextcloud-talk.botSecret`：机器人共享密钥。
- `channels.nextcloud-talk.botSecretFile`：常规文件密钥路径。不接受符号链接。
- `channels.nextcloud-talk.apiUser`：用于房间查询的 API 用户（私信检测）。
- `channels.nextcloud-talk.apiPassword`：用于房间查询的 API/应用密码。
- `channels.nextcloud-talk.apiPasswordFile`：API 密码文件路径。
- `channels.nextcloud-talk.webhookPort`：webhook 监听端口（默认：8788）。
- `channels.nextcloud-talk.webhookHost`：webhook 主机（默认：0.0.0.0）。
- `channels.nextcloud-talk.webhookPath`：webhook 路径（默认：/nextcloud-talk-webhook）。
- `channels.nextcloud-talk.webhookPublicUrl`：外部可访问的 webhook URL。
- `channels.nextcloud-talk.dmPolicy`：`pairing | allowlist | open | disabled`。
- `channels.nextcloud-talk.allowFrom`：私信 allowlist（用户 ID）。`open` 需要 `"*"`。
- `channels.nextcloud-talk.groupPolicy`：`allowlist | open | disabled`。
- `channels.nextcloud-talk.groupAllowFrom`：群组 allowlist（用户 ID）。
- `channels.nextcloud-talk.rooms`：按房间设置及 allowlist。
- `channels.nextcloud-talk.historyLimit`：群组历史记录上限（`0` 表示禁用）。
- `channels.nextcloud-talk.dmHistoryLimit`：私信历史记录上限（`0` 表示禁用）。
- `channels.nextcloud-talk.dms`：按私信覆盖（`historyLimit`）。
- `channels.nextcloud-talk.textChunkLimit`：出站文本分块大小（字符数）。
- `channels.nextcloud-talk.chunkMode`：`length`（默认）或 `newline`；会在按长度分块前按空行（段落边界）拆分。
- `channels.nextcloud-talk.blockStreaming`：为该渠道禁用分块流式传输。
- `channels.nextcloud-talk.blockStreamingCoalesce`：分块流式传输合并调优。
- `channels.nextcloud-talk.mediaMaxMb`：入站媒体大小上限（MB）。

## 相关内容

- [渠道概览](/channels) — 所有受支持渠道
- [配对](/channels/pairing) — 私信认证与配对流程
- [群组](/channels/groups) — 群聊行为和 mention 门控
- [渠道路由](/channels/channel-routing) — 消息的会话路由
- [安全](/gateway/security) — 访问模型与加固

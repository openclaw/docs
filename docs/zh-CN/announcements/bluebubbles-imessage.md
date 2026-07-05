---
read_when:
    - 你使用的是旧的 BlueBubbles 渠道，需要迁移到 iMessage
    - 你正在选择受支持的 OpenClaw iMessage 设置
    - 你需要一段关于移除 BlueBubbles 的简短说明
summary: OpenClaw 已移除 BlueBubbles 支持。对于新的和已迁移的 iMessage 设置，请使用内置的 iMessage 插件和 imsg。
title: BlueBubbles removal and the imsg iMessage path
x-i18n:
    generated_at: "2026-07-05T11:00:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dec7d3f27e0df6431494d864b0c7ae7457574797e199f9a2cb6931d28feacd0
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# BlueBubbles removal and the imsg iMessage path

OpenClaw 不再随附 BlueBubbles 渠道。iMessage 支持通过内置的 `imessage` 插件运行：Gateway 网关会在本地或通过 SSH 包装器将 [`imsg`](https://github.com/steipete/imsg) 作为子进程启动，并通过 stdin/stdout 使用 JSON-RPC 通信。没有服务器，没有 webhook，没有端口。

如果你的配置仍包含 `channels.bluebubbles`，请将其迁移到 `channels.imessage`。旧版 `/channels/bluebubbles` 文档 URL 会重定向到 [Coming from BlueBubbles](/zh-CN/channels/imessage-from-bluebubbles)，其中包含完整的配置转换表和切换检查清单。

## 变更内容

- 受支持的 iMessage 路径没有 BlueBubbles HTTP 服务器、webhook 路由、REST 密码或 BlueBubbles 插件运行时。
- OpenClaw 会通过 `imsg` 在已登录 Messages.app 的 Mac 上读取并监听消息。
- 基本发送、接收、历史记录和媒体使用常规 `imsg` 表面以及 macOS 权限。
- 高级操作（线程回复、Tapback 表情回应、编辑、撤回、效果、已读回执、输入指示器、群组管理）需要私有 API 桥接：运行 `imsg launch`，这要求禁用 SIP。
- Linux 和 Windows Gateway 网关仍可通过将 `channels.imessage.cliPath` 指向在已登录 Mac 上运行 `imsg` 的 SSH 包装器来使用 iMessage。

## 要做什么

1. 在 Messages Mac 上安装并验证 `imsg`：

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. 向运行 `imsg` 和 OpenClaw 的进程上下文授予完全磁盘访问权限和自动化权限。

3. 转换旧配置：

   ```json5
   {
     channels: {
       imessage: {
         enabled: true,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"],
         groupPolicy: "allowlist",
         groupAllowFrom: ["+15555550123"],
         groups: {
           "*": { requireMention: true },
         },
         includeAttachments: true,
       },
     },
   }
   ```

4. 重启 Gateway 网关并验证：

   ```bash
   openclaw channels status --probe
   ```

5. 在删除旧 BlueBubbles 服务器前，测试私信、群组、附件以及你依赖的任何私有 API 操作。

## 迁移说明

- `channels.bluebubbles.serverUrl` 和 `channels.bluebubbles.password` 没有对应的 iMessage 配置；没有需要访问或认证的服务器。
- `allowFrom`、`groupAllowFrom`、`groups`、`includeAttachments`、`attachmentRoots`、`mediaMaxMb`、`textChunkLimit` 和 `actions.*` 在 `channels.imessage` 下保持原含义。
- `channels.imessage.includeAttachments` 默认仍为关闭。如果你期望入站照片、语音备忘录、视频或文件到达智能体，请显式设置它。
- 使用 `groupPolicy: "allowlist"` 时，请复制旧的 `groups` 块，包括任何 `"*"` 通配符条目。群组发送者允许列表和群组注册表是独立的门控；如果 `groups` 块有条目但没有匹配的 `chat_id`（或没有 `"*"`），消息会在运行时被丢弃，而空的 `groups` 块会记录启动警告，即使发送者过滤仍允许消息通过。
- 带有 `match.channel: "bluebubbles"` 的 ACP 绑定必须改为 `"imessage"`。
- 旧 BlueBubbles 会话键不会变成 iMessage 会话键。配对审批基于发送者句柄，因此复制的 `allowFrom` 条目会继续工作，但 BlueBubbles 会话键下的对话历史不会迁移过去。

## 另请参阅

- [Coming from BlueBubbles](/zh-CN/channels/imessage-from-bluebubbles)
- [iMessage](/zh-CN/channels/imessage)
- [Configuration reference - iMessage](/zh-CN/gateway/config-channels#imessage)

---
read_when:
    - 你使用了旧的 BlueBubbles 渠道，需要迁移到 iMessage
    - 你正在选择受支持的 OpenClaw iMessage 设置
    - 你需要一段关于 BlueBubbles 移除的简短说明
summary: OpenClaw 已移除对 BlueBubbles 的支持。对于新的和迁移后的 iMessage 设置，请搭配 imsg 使用内置的 iMessage 插件。
title: BlueBubbles removal and the imsg iMessage path
x-i18n:
    generated_at: "2026-05-11T20:20:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 970e33772534fd3e3d8d3012222bdd9c645ed713b8d38cff21b25b276ae1f544
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# BlueBubbles removal and the imsg iMessage path

OpenClaw 不再附带 BlueBubbles 渠道。iMessage 支持现在通过内置的 `imessage` 插件运行，该插件会在本地或通过 SSH 包装器启动 [`imsg`](https://github.com/steipete/imsg)，并通过 stdin/stdout 使用 JSON-RPC 通信。

如果你的配置仍包含 `channels.bluebubbles`，请将其迁移到 `channels.imessage`。旧版 `/channels/bluebubbles` 文档 URL 会重定向到 [Coming from BlueBubbles](/zh-CN/channels/imessage-from-bluebubbles)，其中包含完整的配置转换表和切换检查清单。

## 有哪些变化

- 受支持的 OpenClaw iMessage 路径中没有 BlueBubbles HTTP 服务器、webhook 路由、REST 密码或 BlueBubbles 插件运行时。
- OpenClaw 会在已登录 Messages.app 的 Mac 上通过 `imsg` 读取并监听 Messages。
- 基本发送、接收、历史记录和媒体使用常规 `imsg` 表面以及 macOS 权限。
- 线程回复、tapback、编辑、撤回、效果、已读回执、输入指示器和群组管理等高级操作需要 `imsg launch`，并且需要可用的私有 API bridge。
- Linux 和 Windows Gateway 网关仍可通过将 `channels.imessage.cliPath` 设置为 SSH 包装器来使用 iMessage，该包装器会在已登录的 Mac 上运行 `imsg`。

## 需要做什么

1. 在 Messages Mac 上安装并验证 `imsg`：

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. 向运行 `imsg` 和 OpenClaw 的进程上下文授予完整磁盘访问权限和自动化权限。

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

5. 在删除旧 BlueBubbles 服务器之前，测试私信、群组、附件以及你依赖的任何私有 API 操作。

## 迁移说明

- `channels.bluebubbles.serverUrl` 和 `channels.bluebubbles.password` 没有对应的 iMessage 等价项。
- `channels.bluebubbles.allowFrom`、`groupAllowFrom`、`groups`、`includeAttachments`、附件根目录、媒体大小限制、分块和操作开关都有 iMessage 等价项。
- `channels.imessage.includeAttachments` 默认仍为关闭。如果你希望入站照片、语音备忘录、视频或文件到达智能体，请显式设置它。
- 使用 `groupPolicy: "allowlist"` 时，请复制旧的 `groups` 块，包括任何 `"*"` 通配符条目。群组发送者允许列表和群组注册表是两个独立门禁。
- 匹配 `channel: "bluebubbles"` 的 ACP 绑定必须改为 `channel: "imessage"`。
- 旧 BlueBubbles 会话键不会变成 iMessage 会话键。配对批准会按 handle 继承，但 BlueBubbles 会话键下的对话历史不会继承。

## 另请参阅

- [Coming from BlueBubbles](/zh-CN/channels/imessage-from-bluebubbles)
- [iMessage](/zh-CN/channels/imessage)
- [Configuration reference - iMessage](/zh-CN/gateway/config-channels#imessage)

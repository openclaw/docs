---
read_when:
    - 你之前使用的是旧版 BlueBubbles 渠道，现在需要迁移到 iMessage
    - 你正在选择受支持的 OpenClaw iMessage 设置
    - 你需要一段关于移除 BlueBubbles 的简短说明
summary: OpenClaw 已移除对 BlueBubbles 的支持。对于新建和迁移的 iMessage 设置，请使用内置的 iMessage 插件搭配 imsg。
title: BlueBubbles removal and the imsg iMessage path
x-i18n:
    generated_at: "2026-07-11T20:18:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dec7d3f27e0df6431494d864b0c7ae7457574797e199f9a2cb6931d28feacd0
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# BlueBubbles removal and the imsg iMessage path

OpenClaw 不再提供 BlueBubbles 渠道。iMessage 支持通过内置的 `imessage` 插件实现：Gateway 网关在本地或通过 SSH 包装器将 [`imsg`](https://github.com/steipete/imsg) 作为子进程启动，并通过 stdin/stdout 使用 JSON-RPC 与其通信。无需服务器、webhook 或端口。

如果你的配置仍包含 `channels.bluebubbles`，请将其迁移到 `channels.imessage`。旧版 `/channels/bluebubbles` 文档 URL 会重定向到 [Coming from BlueBubbles](/zh-CN/channels/imessage-from-bluebubbles)，其中包含完整的配置转换表和切换检查清单。

## 变更内容

- 受支持的 iMessage 路径不包含 BlueBubbles HTTP 服务器、webhook 路由、REST 密码或 BlueBubbles 插件运行时。
- OpenClaw 通过已登录 Messages.app 的 Mac 上的 `imsg` 读取和监视“信息”。
- 基本的发送、接收、历史记录和媒体功能使用常规 `imsg` 接口和 macOS 权限。
- 高级操作（串联回复、点按回应、编辑、撤回、特效、已读回执、输入状态指示和群组管理）需要私有 API 桥接：运行 `imsg launch`，这要求禁用 SIP。
- Linux 和 Windows 上的 Gateway 网关仍可使用 iMessage，方法是将 `channels.imessage.cliPath` 指向一个 SSH 包装器，由该包装器在已登录的 Mac 上运行 `imsg`。

## 操作步骤

1. 在运行“信息”的 Mac 上安装并验证 `imsg`：

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. 为运行 `imsg` 和 OpenClaw 的进程上下文授予“完全磁盘访问权限”和“自动化”权限。

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

5. 在删除旧 BlueBubbles 服务器前，测试私信、群组、附件以及你依赖的所有私有 API 操作。

## 迁移说明

- `channels.bluebubbles.serverUrl` 和 `channels.bluebubbles.password` 没有对应的 iMessage 配置；无需连接服务器，也无需进行身份验证。
- `allowFrom`、`groupAllowFrom`、`groups`、`includeAttachments`、`attachmentRoots`、`mediaMaxMb`、`textChunkLimit` 和 `actions.*` 在 `channels.imessage` 下保持原有含义。
- `channels.imessage.includeAttachments` 默认仍为关闭状态。如果你希望智能体接收传入的照片、语音备忘录、视频或文件，请显式设置此项。
- 使用 `groupPolicy: "allowlist"` 时，请复制旧的 `groups` 块，包括所有 `"*"` 通配符条目。群组发送者允许列表和群组注册表是相互独立的限制条件；如果 `groups` 块包含条目，但没有匹配的 `chat_id`（也没有 `"*"`），则运行时会丢弃消息；空的 `groups` 块会记录启动警告，但发送者过滤仍允许消息通过。
- 使用 `match.channel: "bluebubbles"` 的 ACP 绑定必须改为 `"imessage"`。
- 旧的 BlueBubbles 会话键不会转换为 iMessage 会话键。配对审批以发送者标识为依据，因此复制的 `allowFrom` 条目仍然有效，但 BlueBubbles 会话键下的对话历史记录不会迁移。

## 另请参阅

- [Coming from BlueBubbles](/zh-CN/channels/imessage-from-bluebubbles)
- [iMessage](/zh-CN/channels/imessage)
- [Configuration reference - iMessage](/zh-CN/gateway/config-channels#imessage)

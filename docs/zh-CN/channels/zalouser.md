---
read_when:
    - 为 OpenClaw 设置 Zalo Personal
    - 调试 Zalo Personal 的登录或消息流程
summary: Zalo 个人账号通过原生 zca-js（二维码登录）支持、能力和配置
title: Zalo 个人版
x-i18n:
    generated_at: "2026-05-06T16:00:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: d56cbf0a6300709e9fe23421cd134acc68852d0025f305c73413308f412349e8
    source_path: channels/zalouser.md
    workflow: 16
---

Status: 实验性。此集成通过 OpenClaw 内部的原生 `zca-js` 自动化一个**个人 Zalo 账号**。

<Warning>
这是非官方集成，可能导致账号被暂停或封禁。使用风险由你自行承担。
</Warning>

## 内置插件

Zalo Personal 在当前 OpenClaw 版本中作为内置插件提供，因此正常的
打包构建不需要单独安装。

如果你使用的是较旧构建，或是不包含 Zalo Personal 的自定义安装，
请直接安装 npm 包：

- 通过 CLI 安装：`openclaw plugins install @openclaw/zalouser`
- 固定版本：`openclaw plugins install @openclaw/zalouser@2026.5.2`
- 或从源码检出安装：`openclaw plugins install ./path/to/local/zalouser-plugin`
- 详情：[插件](/zh-CN/tools/plugin)

不需要外部 `zca`/`openzca` CLI 二进制文件。

## 快速设置（初学者）

1. 确保 Zalo Personal 插件可用。
   - 当前打包的 OpenClaw 版本已内置它。
   - 较旧或自定义安装可以使用上面的命令手动添加它。
2. 登录（二维码，在 Gateway 网关机器上）：
   - `openclaw channels login --channel zalouser`
   - 使用 Zalo 移动应用扫描二维码。
3. 启用渠道：

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. 重启 Gateway 网关（或完成设置）。
5. 私信访问默认使用配对；首次联系时批准配对码。

## 它是什么

- 完全通过 `zca-js` 在进程内运行。
- 使用原生事件监听器接收入站消息。
- 通过 JS API（文本/媒体/链接）直接发送回复。
- 专为 Zalo Bot API 不可用的“个人账号”使用场景设计。

## 命名

渠道 ID 是 `zalouser`，以明确表示这会自动化一个**个人 Zalo 用户账号**（非官方）。我们将 `zalo` 保留给未来可能的官方 Zalo API 集成。

## 查找 ID（目录）

使用目录 CLI 发现对端/群组及其 ID：

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 限制

- 出站文本会分块到约 2000 个字符（Zalo 客户端限制）。
- 默认阻止流式传输。

## 访问控制（私信）

`channels.zalouser.dmPolicy` 支持：`pairing | allowlist | open | disabled`（默认：`pairing`）。

`channels.zalouser.allowFrom` 应使用稳定的 Zalo 用户 ID。在交互式设置期间，输入的名称可以使用插件的进程内联系人查找解析为 ID。

如果配置中仍保留原始名称，启动时只有在启用 `channels.zalouser.dangerouslyAllowNameMatching: true` 时才会解析它。如果未选择启用该选项，运行时发件人检查仅使用 ID，原始名称会在授权时被忽略。

通过以下方式批准：

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## 群组访问（可选）

- 默认：`channels.zalouser.groupPolicy = "open"`（允许群组）。未设置时，使用 `channels.defaults.groupPolicy` 覆盖默认值。
- 使用以下配置限制为允许列表：
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups`（键应为稳定的群组 ID；名称仅在启用 `channels.zalouser.dangerouslyAllowNameMatching: true` 时才会在启动时解析为 ID）
  - `channels.zalouser.groupAllowFrom`（控制允许的群组中哪些发件人可以触发 bot）
- 阻止所有群组：`channels.zalouser.groupPolicy = "disabled"`。
- 配置向导可以提示输入群组允许列表。
- 启动时，OpenClaw 仅在启用 `channels.zalouser.dangerouslyAllowNameMatching: true` 时，才会将允许列表中的群组/用户名称解析为 ID 并记录映射。
- 群组允许列表匹配默认仅使用 ID。除非启用 `channels.zalouser.dangerouslyAllowNameMatching: true`，否则未解析的名称会在认证时被忽略。
- `channels.zalouser.dangerouslyAllowNameMatching: true` 是一种应急兼容模式，会重新启用可变的启动时名称解析和运行时群组名称匹配。
- 如果未设置 `groupAllowFrom`，运行时会回退到 `allowFrom` 进行群组发件人检查。
- 发件人检查同时适用于普通群组消息和控制命令（例如 `/new`、`/reset`）。

示例：

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### 群组提及门控

- `channels.zalouser.groups.<group>.requireMention` 控制群组回复是否需要提及。
- 解析顺序：精确群组 ID/名称 -> 规范化群组 slug -> `*` -> 默认值（`true`）。
- 这同时适用于允许列表群组和开放群组模式。
- 引用 bot 消息会计为群组激活的隐式提及。
- 已授权的控制命令（例如 `/new`）可以绕过提及门控。
- 当群组消息因需要提及而被跳过时，OpenClaw 会将其存为待处理群组历史，并在下一条被处理的群组消息中包含它。
- 群组历史限制默认使用 `messages.groupChat.historyLimit`（回退值 `50`）。你可以使用 `channels.zalouser.historyLimit` 为每个账号覆盖它。

示例：

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## 多账号

账号会映射到 OpenClaw 状态中的 `zalouser` 配置文件。示例：

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## 输入状态、回应和送达确认

- OpenClaw 在分发回复前会发送输入状态事件（尽力而为）。
- 频道动作中支持 `zalouser` 的消息回应动作 `react`。
  - 使用 `remove: true` 从消息中移除特定回应 emoji。
  - 回应语义：[回应](/zh-CN/tools/reactions)
- 对于包含事件元数据的入站消息，OpenClaw 会发送已送达 + 已读确认（尽力而为）。

## 故障排除

**登录无法保持：**

- `openclaw channels status --probe`
- 重新登录：`openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**允许列表/群组名称未解析：**

- 在 `allowFrom`/`groupAllowFrom` 中使用数字 ID，并在 `groups` 中使用稳定的群组 ID。如果你确实需要精确的好友/群组名称，请启用 `channels.zalouser.dangerouslyAllowNameMatching: true`。

**从旧的基于 CLI 的设置升级：**

- 移除所有旧的外部 `zca` 进程假设。
- 该渠道现在完全在 OpenClaw 中运行，不需要外部 CLI 二进制文件。

## 相关

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信认证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固

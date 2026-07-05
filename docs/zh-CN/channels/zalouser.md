---
read_when:
    - 为 OpenClaw 设置 Zalo Personal
    - 调试 Zalo Personal 登录或消息流
summary: 通过原生 zca-js（二维码登录）支持 Zalo Personal 账号、能力和配置
title: Zalo Personal
x-i18n:
    generated_at: "2026-07-05T11:06:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 962697c4a56dfb733fe4973e23129ccb365506e35c09e673365842f45a837949
    source_path: channels/zalouser.md
    workflow: 16
---

状态：实验性。此集成通过原生 `zca-js` 在进程内自动化一个**个人 Zalo 账号**，无需外部 CLI 二进制文件。

<Warning>
这是一个非官方集成，可能导致账号被暂停或封禁。使用风险由你自行承担。
</Warning>

## 安装

Zalo Personal 是官方外部插件，不内置于核心中。使用前请先安装：

```bash
openclaw plugins install @openclaw/zalouser
```

- 固定版本：`openclaw plugins install @openclaw/zalouser@<version>`
- 从源码检出安装：`openclaw plugins install ./path/to/local/zalouser-plugin`
- 详情：[插件](/zh-CN/tools/plugin)

## 快速设置

1. 安装插件（见上文）。
2. 登录（QR，在 Gateway 网关机器上）：
   - `openclaw channels login --channel zalouser`
   - 使用 Zalo 移动应用扫描 QR 码。
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
5. 私信访问默认使用配对；首次联系时批准配对代码。

## 它是什么

- 完全通过 `zca-js` 库在进程内运行（无需外部 `zca`/`openzca` 二进制文件）。
- 使用原生事件监听器（`message`、`error`）接收入站消息。
- 通过 JS API 直接发送回复（文本/媒体/链接）。
- 面向 Zalo Bot API 不可用的“个人账号”使用场景设计。

## 命名

渠道 ID 是 `zalouser`，用于明确表示这是在自动化一个**个人 Zalo 用户账号**（非官方）。`zalo` 保留给未来可能的官方 Zalo API 集成。

## 查找 ID（目录）

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 限制

- 出站文本会被分块为 2000 个字符（Zalo 客户端限制）。
- 不支持流式传输。

## 访问控制（私信）

`channels.zalouser.dmPolicy`：`pairing | allowlist | open | disabled`（默认：`pairing`）。

`channels.zalouser.allowFrom` 应使用稳定的 Zalo 用户 ID。它也可以引用静态发送者访问组（`accessGroup:<name>`）。在交互式设置期间，输入的名称可以使用插件的进程内联系人查找解析为 ID。

如果原始名称仍保留在配置中，启动时仅在启用 `channels.zalouser.dangerouslyAllowNameMatching: true` 时解析它。没有此显式启用时，运行时发送者检查仅基于 ID，原始名称会被忽略，不用于授权。

通过以下命令批准：

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## 群组访问（可选）

- 默认：`channels.zalouser.groupPolicy = "allowlist"`（群组需要显式 allowlist 条目）。
- 打开所有群组：`channels.zalouser.groupPolicy = "open"`。
- 阻止所有群组：`channels.zalouser.groupPolicy = "disabled"`。
- 使用 `groupPolicy = "allowlist"` 时：
  - `channels.zalouser.groups` 键应为稳定的群组 ID；名称仅在启用 `channels.zalouser.dangerouslyAllowNameMatching: true` 时才会在启动时解析为 ID。
  - `channels.zalouser.groupAllowFrom` 控制允许的群组中哪些发送者可以触发 bot；可以用 `accessGroup:<name>` 引用静态发送者访问组。
- 配置向导可以提示输入群组 allowlist。
- 群组 allowlist 匹配默认仅基于 ID。除非启用 `channels.zalouser.dangerouslyAllowNameMatching: true`，否则未解析的名称会被忽略，不用于身份验证。
- `channels.zalouser.dangerouslyAllowNameMatching: true` 是一种 break-glass 兼容模式，会重新启用可变的启动名称解析和运行时群组名称匹配。
- 对于普通群组消息，`groupAllowFrom` **不会**回退到 `allowFrom`：在 allowlist 群组中将其留空会向任何发送者开放该群组。已授权的控制命令（例如 `/new`）是例外；当 `groupAllowFrom` 为空时，命令发送者检查会回退到 `allowFrom`。

示例：

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { enabled: true },
        "Work Chat": { enabled: true },
      },
    },
  },
}
```

<Note>
`channels.zalouser.groups.<id>.allow` 是旧版字段名；当前配置使用 `enabled`。`openclaw doctor --fix` 会自动将 `allow` 迁移为 `enabled`。
</Note>

### 群组提及门控

- `channels.zalouser.groups.<group>.requireMention` 控制群组回复是否需要提及。
- 解析顺序：group id -> `group:<id>` alias -> group name/slug（基于名称的候选项仅在 `dangerouslyAllowNameMatching: true` 时适用）-> `*` -> 默认（`true`）。
- 同时适用于 allowlist 群组和开放群组模式。
- 引用 bot 消息会计为用于群组激活的隐式提及。
- 已授权的控制命令（例如 `/new`）可以绕过提及门控。
- 当群组消息因为需要提及而被跳过时，OpenClaw 会将其存储为待处理群组历史记录，并在下一条已处理的群组消息中包含它。
- 群组历史记录限制：`channels.zalouser.historyLimit`，然后是 `messages.groupChat.historyLimit`，然后回退为 `50`。

示例：

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { enabled: true, requireMention: true },
        "Work Chat": { enabled: true, requireMention: false },
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

## 环境变量

配置文件选择也可以来自环境变量：

| 变量               | 用途                                                                       |
| ------------------ | -------------------------------------------------------------------------- |
| `ZALOUSER_PROFILE` | 当渠道或账号配置中未设置 `profile` 时要使用的配置文件名称。 |
| `ZCA_PROFILE`      | 旧版回退，仅在未设置 `ZALOUSER_PROFILE` 时使用。             |

配置文件名称会选择 OpenClaw 状态中保存的 Zalo 登录凭据。解析顺序：

1. 配置中的显式 `profile`。
2. `ZALOUSER_PROFILE`。
3. `ZCA_PROFILE`。
4. 非默认账号使用账号 ID，默认账号使用 `default`。

对于多账号设置，建议在配置中为每个账号设置 `profile`，这样一个环境变量不会让多个账号共享同一个登录会话。

## 输入状态、表情回应和送达确认

- OpenClaw 会在发送回复前发送输入状态事件（尽力而为）。
- 渠道操作中支持 `zalouser` 的消息表情回应操作 `react`。
  - 使用 `remove: true` 从消息中移除特定表情回应 emoji。
  - 表情回应语义：[表情回应](/zh-CN/tools/reactions)
- 对于包含事件元数据的入站消息，OpenClaw 会发送已送达 + 已读确认（尽力而为）。

## 故障排查

**登录无法保持：**

- `openclaw channels status --probe`
- 重新登录：`openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Allowlist/群组名称没有解析：**

- 在 `allowFrom`/`groupAllowFrom` 中使用数字 ID，并在 `groups` 中使用稳定的群组 ID。如果你确实需要精确的好友/群组名称，请启用 `channels.zalouser.dangerouslyAllowNameMatching: true`。

**从旧的外部 `zca`/基于 CLI 的设置升级：**

- 移除任何外部 `zca` 进程假设；该渠道现在通过 `zca-js` 完全在进程内运行，无需外部 CLI 二进制文件。

## 相关

- [渠道概览](/zh-CN/channels) - 所有支持的渠道
- [配对](/zh-CN/channels/pairing) - 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) - 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) - 消息的会话路由
- [安全](/zh-CN/gateway/security) - 访问模型和加固

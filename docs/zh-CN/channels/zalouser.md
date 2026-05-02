---
read_when:
    - 为 OpenClaw 设置 Zalo Personal
    - 调试 Zalo Personal 登录或消息流程
summary: 通过原生 zca-js（二维码登录）提供的 Zalo 个人账号支持、能力和配置
title: Zalo 个人版
x-i18n:
    generated_at: "2026-05-02T21:05:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8bd665c47705e0213e1a7c05c3242d6ff745346cdee184da4884e5365807b2d
    source_path: channels/zalouser.md
    workflow: 16
---

Status：实验性。此集成通过 OpenClaw 内部原生的 `zca-js` 自动化一个**个人 Zalo 账号**。

<Warning>
这是非官方集成，可能导致账号被暂停或封禁。使用风险由你自行承担。
</Warning>

## 内置插件

Zalo Personal 在当前 OpenClaw 版本中作为内置插件随附，因此普通的
打包构建不需要单独安装。

如果你使用的是旧版构建，或自定义安装中排除了 Zalo Personal，
请直接安装 npm 包：

- 通过 CLI 安装：`openclaw plugins install @openclaw/zalouser`
- Beta 渠道：`openclaw plugins install @openclaw/zalouser@beta`
- 或从源码检出安装：`openclaw plugins install ./path/to/local/zalouser-plugin`
- 详情：[插件](/zh-CN/tools/plugin)

不需要外部 `zca`/`openzca` CLI 二进制文件。

## 快速设置（初学者）

1. 确保 Zalo Personal 插件可用。
   - 当前打包的 OpenClaw 版本已经内置它。
   - 旧版/自定义安装可以用上面的命令手动添加。
2. 登录（QR，在 Gateway 网关机器上）：
   - `openclaw channels login --channel zalouser`
   - 用 Zalo 移动应用扫描 QR 码。
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
- 直接通过 JS API 发送回复（文本/媒体/链接）。
- 面向 Zalo Bot API 不可用的“个人账号”使用场景而设计。

## 命名

渠道 ID 是 `zalouser`，用于明确表示它自动化的是**个人 Zalo 用户账号**（非官方）。我们保留 `zalo`，用于未来可能出现的官方 Zalo API 集成。

## 查找 ID（目录）

使用目录 CLI 发现联系人/群组及其 ID：

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 限制

- 出站文本会被分块到约 2000 个字符（Zalo 客户端限制）。
- 默认阻止流式传输。

## 访问控制（私信）

`channels.zalouser.dmPolicy` 支持：`pairing | allowlist | open | disabled`（默认：`pairing`）。

`channels.zalouser.allowFrom` 接受用户 ID 或名称。设置期间，会使用插件的进程内联系人查找将名称解析为 ID。

通过以下命令批准：

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## 群组访问（可选）

- 默认值：`channels.zalouser.groupPolicy = "open"`（允许群组）。未设置时，使用 `channels.defaults.groupPolicy` 覆盖默认值。
- 使用以下配置限制为允许列表：
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups`（键应为稳定的群组 ID；启动时会在可能的情况下将名称解析为 ID）
  - `channels.zalouser.groupAllowFrom`（控制允许群组中的哪些发送者可以触发机器人）
- 阻止所有群组：`channels.zalouser.groupPolicy = "disabled"`。
- 配置向导可以提示输入群组允许列表。
- 启动时，OpenClaw 会将允许列表中的群组/用户名称解析为 ID，并记录映射。
- 默认情况下，群组允许列表匹配仅按 ID 进行。除非启用 `channels.zalouser.dangerouslyAllowNameMatching: true`，否则未解析的名称会在身份验证中被忽略。
- `channels.zalouser.dangerouslyAllowNameMatching: true` 是一个应急兼容模式，会重新启用可变的群组名称匹配。
- 如果未设置 `groupAllowFrom`，运行时会回退到 `allowFrom` 来检查群组发送者。
- 发送者检查同时适用于普通群组消息和控制命令（例如 `/new`、`/reset`）。

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
- 引用机器人消息会计为用于群组激活的隐式提及。
- 已授权的控制命令（例如 `/new`）可以绕过提及门控。
- 当群组消息因需要提及而被跳过时，OpenClaw 会将其存储为待处理群组历史，并在下一条被处理的群组消息中包含它。
- 群组历史限制默认使用 `messages.groupChat.historyLimit`（回退值为 `50`）。你可以用 `channels.zalouser.historyLimit` 按账号覆盖。

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

- OpenClaw 会在分发回复前发送输入状态事件（尽力而为）。
- 渠道操作中，`zalouser` 支持消息回应操作 `react`。
  - 使用 `remove: true` 从消息中移除特定回应表情。
  - 回应语义：[回应](/zh-CN/tools/reactions)
- 对于包含事件元数据的入站消息，OpenClaw 会发送已送达 + 已读确认（尽力而为）。

## 故障排除

**登录未保持：**

- `openclaw channels status --probe`
- 重新登录：`openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**允许列表/群组名称未解析：**

- 在 `allowFrom`/`groupAllowFrom`/`groups` 中使用数字 ID，或使用精确的好友/群组名称。

**从旧的基于 CLI 的设置升级：**

- 移除任何旧的外部 `zca` 进程假设。
- 该渠道现在完全在 OpenClaw 内运行，不需要外部 CLI 二进制文件。

## 相关内容

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [渠道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固

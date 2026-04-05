---
read_when:
    - 为 OpenClaw 设置 Zalo Personal
    - 调试 Zalo Personal 登录或消息流
summary: 通过原生 `zca-js`（二维码登录）提供 Zalo 个人账号支持，以及相关能力和配置
title: Zalo Personal
x-i18n:
    generated_at: "2026-04-05T08:18:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 331b95041463185472d242cb0a944972f0a8e99df8120bda6350eca86ad5963f
    source_path: channels/zalouser.md
    workflow: 15
---

# Zalo Personal（非官方）

状态：实验性。此集成通过 OpenClaw 内部的原生 `zca-js` 自动化一个 **Zalo 个人账号**。

> **警告：** 这是一个非官方集成，可能会导致账号被暂停或封禁。请自行承担使用风险。

## 内置插件

Zalo Personal 作为当前 OpenClaw 版本中的内置插件提供，因此普通打包构建无需单独安装。

如果你使用的是较旧版本，或是不包含 Zalo Personal 的自定义安装，请手动安装：

- 通过 CLI 安装：`openclaw plugins install @openclaw/zalouser`
- 或从源码检出安装：`openclaw plugins install ./path/to/local/zalouser-plugin`
- 详情：[插件](/tools/plugin)

不需要额外的 `zca`/`openzca` CLI 二进制文件。

## 快速设置（新手）

1. 确保 Zalo Personal 插件可用。
   - 当前打包的 OpenClaw 版本已内置该插件。
   - 较旧版本或自定义安装可使用上面的命令手动添加。
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
5. 私信访问默认使用配对；首次联系时请批准配对码。

## 它是什么

- 通过 `zca-js` 完全在进程内运行。
- 使用原生事件监听器接收入站消息。
- 通过 JS API 直接发送回复（文本/媒体/链接）。
- 面向无法使用 Zalo Bot API 的“个人账号”使用场景而设计。

## 命名

渠道 id 为 `zalouser`，以明确表示这是在自动化一个 **Zalo 个人用户账号**（非官方）。我们保留 `zalo`，用于未来可能推出的官方 Zalo API 集成。

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

`channels.zalouser.allowFrom` 接受用户 ID 或名称。在设置期间，会使用插件的进程内联系人查询将名称解析为 ID。

通过以下命令批准：

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## 群组访问（可选）

- 默认：`channels.zalouser.groupPolicy = "open"`（允许群组）。未设置时，可使用 `channels.defaults.groupPolicy` 覆盖默认值。
- 使用以下配置限制为允许列表：
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups`（键应为稳定的群组 ID；如果可能，启动时会将名称解析为 ID）
  - `channels.zalouser.groupAllowFrom`（控制允许群组中哪些发送者可以触发机器人）
- 阻止所有群组：`channels.zalouser.groupPolicy = "disabled"`。
- 配置向导可以提示你设置群组允许列表。
- 启动时，OpenClaw 会将允许列表中的群组/用户名称解析为 ID，并记录映射。
- 默认情况下，群组允许列表匹配仅基于 ID。除非启用 `channels.zalouser.dangerouslyAllowNameMatching: true`，否则无法解析的名称会在鉴权时被忽略。
- `channels.zalouser.dangerouslyAllowNameMatching: true` 是一种紧急兼容模式，会重新启用可变群组名称匹配。
- 如果未设置 `groupAllowFrom`，运行时会回退到 `allowFrom` 进行群组发送者检查。
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
- 解析顺序：精确群组 id/名称 -> 标准化群组 slug -> `*` -> 默认值（`true`）。
- 这同时适用于允许列表中的群组和开放群组模式。
- 已授权的控制命令（例如 `/new`）可以绕过提及门控。
- 当群组消息因需要提及而被跳过时，OpenClaw 会将其存储为待处理的群组历史，并在下一条被处理的群组消息中包含这些内容。
- 群组历史上限默认使用 `messages.groupChat.historyLimit`（回退值为 `50`）。你可以通过 `channels.zalouser.historyLimit` 为每个账号覆盖此设置。

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

账号会映射到 OpenClaw 状态中的 `zalouser` 配置档。示例：

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

## 正在输入、反应和送达确认

- OpenClaw 会在发送回复前发送“正在输入”事件（尽力而为）。
- 渠道操作中，`zalouser` 支持消息反应动作 `react`。
  - 使用 `remove: true` 可从消息中移除指定的反应表情。
  - 反应语义：[反应](/tools/reactions)
- 对于包含事件元数据的入站消息，OpenClaw 会发送已送达 + 已查看确认（尽力而为）。

## 故障排除

**登录无法保持：**

- `openclaw channels status --probe`
- 重新登录：`openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**允许列表/群组名称未解析：**

- 在 `allowFrom`/`groupAllowFrom`/`groups` 中使用数字 ID，或使用精确的好友/群组名称。

**从旧版基于 CLI 的设置升级：**

- 删除任何关于旧外部 `zca` 进程的假设。
- 该渠道现在完全在 OpenClaw 内运行，无需外部 CLI 二进制文件。

## 相关内容

- [渠道概览](/channels) — 所有支持的渠道
- [配对](/channels/pairing) — 私信身份验证和配对流程
- [群组](/channels/groups) — 群聊行为和提及门控
- [渠道路由](/channels/channel-routing) — 消息的会话路由
- [安全](/gateway/security) — 访问模型和加固

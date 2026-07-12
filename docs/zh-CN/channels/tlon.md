---
read_when:
    - 开发 Tlon/Urbit 渠道功能
summary: Tlon/Urbit 支持状态、能力和配置
title: Tlon
x-i18n:
    generated_at: "2026-07-11T20:20:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d53ea7d97a7445910c5692a247758b652e1fce82793e65950e1e21a10fa16813
    source_path: channels/tlon.md
    workflow: 16
---

Tlon 是一款构建于 Urbit 之上的去中心化通信工具。OpenClaw 会连接到你的 Urbit ship，并回复私信和群聊消息。默认情况下，群组回复需要 @ 提及，同时还会应用授权规则和所有者审批流程。

状态：内置插件。支持私信、群组提及、话题串、富文本、图片上传/下载以及所有者审批系统。不支持表情回应和投票。

## 内置插件

当前 OpenClaw 版本已内置 Tlon；打包构建无需单独安装。

对于未包含该插件的旧版构建或自定义安装，请从 npm 安装：

```bash
openclaw plugins install @openclaw/tlon
```

使用不带版本号的软件包名称可跟踪当前发布标签。仅在需要可复现安装时固定版本（`@openclaw/tlon@x.y.z`）。

从本地检出安装：

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

详情：[插件](/zh-CN/tools/plugin)

## 设置

```bash
openclaw channels add --channel tlon --ship ~sampel-palnet --url https://your-ship-host --code lidlut-tabwed-pillex-ridrup
```

或者直接编辑配置：

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // 建议：设为你的 ship，始终获得授权
    },
  },
}
```

直接编辑配置后，请重启 Gateway 网关。然后向机器人发送私信，或在群组渠道中 @ 提及它。

## 私有网络/LAN 中的 ship

默认情况下，OpenClaw 会阻止私有/内部主机名和 IP 地址范围，以防御 SSRF。如果你的 ship 运行在私有网络中（localhost、LAN IP 或内部主机名），请明确选择启用：

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
    },
  },
}
```

这适用于 `http://localhost:8080`、`http://192.168.x.x:8080` 和 `http://my-ship.local:8080` 等目标。仅应为你信任的 ship URL 启用此选项；它会禁用该账户 HTTP 请求的 SSRF 防护。

<Note>
`channels.tlon.allowPrivateNetwork`（扁平键）已停用。`openclaw doctor --fix` 会自动将其迁移至 `channels.tlon.network.dangerouslyAllowPrivateNetwork`。
</Note>

## 群组渠道

手动固定渠道，或启用自动发现：

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
      autoDiscoverChannels: true,
    },
  },
}
```

未在配置中设置时，`autoDiscoverChannels` 默认为 `false`；设置向导的提示默认选择“是”，并明确写入 `true`。启用后，OpenClaw 会在启动时通过 scry 查询已加入的群组，在接受群组邀请时监视新渠道，并且每 2 分钟重新检查一次。

## 访问控制

私信允许列表（空列表表示除 `ownerShip` 之外，不允许任何 ship 发送私信）：

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

每个渠道的群组授权模式默认为 `restricted`。使用 `defaultAuthorizedShips` 设置基线，并按渠道 nest 覆盖：

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

机器人在话题串内回复后，会继续响应该话题串中的后续消息，无需再次提及它。

## 所有者和审批系统

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

所有者 ship 在任何位置都获得授权：私信邀请始终自动接受，群组邀请始终自动接受，渠道消息始终通过授权检查。所有者无需包含在 `dmAllowlist`、`defaultAuthorizedShips` 或 `groupInviteAllowlist` 中。

设置 `ownerShip` 后，未经授权的请求不会被直接丢弃，而是会加入待审批队列，并通过私信通知所有者：

- 来自不在 `dmAllowlist` 中的 ship 的私信请求
- 发送者未通过授权检查的渠道提及
- 来自不在 `groupInviteAllowlist` 中的 ship 的群组邀请（自动接受功能关闭时，或该功能已开启但邀请者不在允许列表中时）

所有者可通过私信回复来处理请求：

| 所有者回复                   | 效果                                             |
| ---------------------------- | ------------------------------------------------ |
| `approve` / `deny` / `block` | 处理最近一项待审批请求                           |
| `approve <id>` / `deny <id>` | 按 ID 处理指定的审批请求                         |
| `block`                      | 同时在原生系统中屏蔽该 ship，使其无法重新连接   |
| `unblock ~ship`              | 解除原生系统中的屏蔽                             |
| `blocked`                    | 列出当前已屏蔽的 ship                            |
| `pending`                    | 列出待处理的审批请求                             |

如果未配置 `ownerShip`，未经授权的私信和渠道提及只会被丢弃并记录到日志中，不会发出审批提示。

## 自动接受设置

自动接受来自已在 `dmAllowlist` 中的 ship 的私信邀请（无论此标志如何设置，所有者的邀请始终会自动接受）：

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

自动接受允许列表中的群组邀请（失败时关闭：当 `autoAcceptGroupInvites: true` 且 `groupInviteAllowlist` 为空时，不会接受任何非所有者的邀请）：

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
      groupInviteAllowlist: ["~zod"],
    },
  },
}
```

## 通过 Urbit 设置存储热重载

首次运行时，上述大部分设置（`dmAllowlist`、`groupInviteAllowlist`、`groupChannels`、`defaultAuthorizedShips`、`autoDiscoverChannels`、`autoAcceptDmInvites`、`autoAcceptGroupInvites`、`ownerShip`、`showModelSignature`）会镜像到 ship 的 `%settings` 智能体（desk 为 `moltbot`，bucket 为 `tlon`），此后会从中实时读取。因此，通过 Landscape 客户端或内置 Skills 的设置命令进行的更改无需重启 Gateway 网关即可生效。`channelRules` 和待审批请求也会以 JSON 格式持久化到该位置。对于从未写入设置存储的值，文件配置仍然是事实来源。

## 投递目标（CLI/cron）

与 `openclaw message send` 或 cron 投递配合使用：

- 私信：`~sampel-palnet` 或 `dm/~sampel-palnet`
- 群组：`chat/~host-ship/channel` 或 `group:~host-ship/channel`

## 内置 Skills

该插件内置了 [`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)，这是一个用于直接执行 Urbit 操作的 CLI。安装插件后即可自动使用：

- **动态**：提及、回复、未读消息
- **渠道**：列出、创建、重命名
- **联系人**：列出/获取/更新个人资料
- **群组**：创建、加入、邀请/申请流程、角色
- **Hooks**：管理渠道 Hooks
- **消息**：历史记录、搜索
- **私信**：发送、添加表情回应、接受/拒绝
- **帖子**：添加表情回应、删除
- **笔记本**：向日记渠道发布内容
- **设置**：通过上述设置存储热重载插件配置

## 能力

| 功能         | 状态                                         |
| ------------ | -------------------------------------------- |
| 私信         | 支持                                         |
| 群组/渠道    | 支持（默认需要提及）                         |
| 话题串       | 支持（加入后会持续回复）                     |
| 富文本       | Markdown 会转换为 Tlon 原生格式              |
| 图片         | 下载传入图片，上传传出图片                   |
| 表情回应     | 仅可通过[内置 Skills](#bundled-skill)使用    |
| 投票         | 不支持                                       |
| 原生命令     | 默认仅限所有者                               |

## 故障排查

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

常见故障：

- **私信被忽略**：发送者不在 `dmAllowlist` 中，且未配置用于审批流程的 `ownerShip`。
- **群组消息被忽略**：渠道未被发现或固定，或者发送者未通过授权检查，且没有用于将请求加入审批队列的 `ownerShip`。
- **连接错误**：检查 ship URL 是否可访问；对于本地 ship，请设置 `network.dangerouslyAllowPrivateNetwork`。
- **身份验证错误**：登录代码会轮换，请从你的 ship 复制当前代码。

## 配置参考

完整配置：[配置](/zh-CN/gateway/configuration)

| 键                                                     | 含义                                                           |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `channels.tlon.enabled`                                | 启用/禁用渠道启动。                                            |
| `channels.tlon.ship`                                   | 机器人的 Urbit ship 名称（例如 `~sampel-palnet`）。            |
| `channels.tlon.url`                                    | ship URL（例如 `https://sampel-palnet.tlon.network`）。        |
| `channels.tlon.code`                                   | ship 登录代码。                                                |
| `channels.tlon.network.dangerouslyAllowPrivateNetwork` | 允许 localhost/LAN ship URL（选择启用 SSRF 例外）。            |
| `channels.tlon.ownerShip`                              | 所有者 ship：始终获得授权，并接收审批请求。                    |
| `channels.tlon.dmAllowlist`                            | 允许发送私信的 ship（空列表表示除所有者外均不允许）。          |
| `channels.tlon.autoAcceptDmInvites`                    | 自动接受来自 `dmAllowlist` 中 ship 的私信。                    |
| `channels.tlon.autoAcceptGroupInvites`                 | 自动接受来自 `groupInviteAllowlist` 的群组邀请。               |
| `channels.tlon.groupInviteAllowlist`                   | 群组邀请会被自动接受的 ship。                                  |
| `channels.tlon.autoDiscoverChannels`                   | 自动发现已加入的群组渠道（默认值：`false`）。                  |
| `channels.tlon.groupChannels`                          | 手动固定的渠道 nest。                                          |
| `channels.tlon.defaultAuthorizedShips`                 | 获得所有渠道授权的 ship（无匹配规则时使用）。                  |
| `channels.tlon.authorization.channelRules`             | 按渠道 nest 设置身份验证模式和允许列表。                       |
| `channels.tlon.showModelSignature`                     | 在回复后附加 `_[由 <model> 生成]_`。                           |
| `channels.tlon.responsePrefix`                         | 添加到传出回复开头的静态前缀。                                 |
| `channels.tlon.accounts.<id>`                          | 其他具名账户（多 ship 设置）。                                 |

## 说明

- 群组回复需要 @ 提及（例如 `~your-bot-ship`），除非机器人已加入该话题串。
- 话题串回复会发送到话题串内；机器人还会收到预置到智能体上下文中的话题串最近 10 条消息。
- 富文本（粗体、斜体、代码、标题、列表）会转换为 Tlon 原生格式。
- 发送要求汇总渠道内容的传入消息（例如“汇总此渠道”）时，会触发内置的历史记录汇总功能，而不是常规回复流程。

## 相关内容

- [渠道概览](/zh-CN/channels) — 所有受支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全性](/zh-CN/gateway/security) — 访问模型和安全强化

---
read_when:
    - 正在开发 Tlon/Urbit 渠道功能
summary: Tlon/Urbit 支持状态、能力和配置
title: Tlon
x-i18n:
    generated_at: "2026-07-05T11:04:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d53ea7d97a7445910c5692a247758b652e1fce82793e65950e1e21a10fa16813
    source_path: channels/tlon.md
    workflow: 16
---

Tlon 是基于 Urbit 构建的去中心化消息工具。OpenClaw 会连接到你的 Urbit ship，并响应私信和群聊消息。默认情况下，群组回复需要 @ 提及，并在其上叠加授权规则和所有者审批流程。

状态：内置插件。支持私信、群组提及、线程、富文本、图片上传/下载，以及所有者审批系统。不支持表情回应和投票。

## 内置插件

Tlon 随当前 OpenClaw 版本内置发布；打包构建无需单独安装。

在不包含它的旧版构建或自定义安装中，请从 npm 安装：

```bash
openclaw plugins install @openclaw/tlon
```

使用裸包名以跟踪当前发布标签。仅在需要可复现安装时固定版本（`@openclaw/tlon@x.y.z`）。

从本地 checkout 安装：

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

详情：[插件](/zh-CN/tools/plugin)

## 设置

```bash
openclaw channels add --channel tlon --ship ~sampel-palnet --url https://your-ship-host --code lidlut-tabwed-pillex-ridrup
```

或直接编辑配置：

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommended: your ship, always authorized
    },
  },
}
```

直接编辑配置后，重启 Gateway 网关。然后向 bot 发送私信，或在群组频道中 @ 提及它。

## 私有/LAN ship

默认情况下，OpenClaw 会阻止私有/内部主机名和 IP 范围，以提供 SSRF 保护。如果你的 ship 运行在私有网络上（localhost、LAN IP、内部主机名），请显式选择启用：

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

适用于 `http://localhost:8080`、`http://192.168.x.x:8080` 和 `http://my-ship.local:8080` 等目标。仅对你信任的 ship URL 启用此项；它会为该账户的 HTTP 请求禁用 SSRF 保护。

<Note>
`channels.tlon.allowPrivateNetwork`（扁平键）已退役。`openclaw doctor --fix` 会自动将它移动到 `channels.tlon.network.dangerouslyAllowPrivateNetwork`。
</Note>

## 群组频道

手动固定频道，或开启自动发现：

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

在配置中未设置时，`autoDiscoverChannels` 默认为 `false`；设置向导默认将提示设为是，并显式写入 `true`。开启后，OpenClaw 会在启动时 scry 已加入的群组，在接受群组邀请时监听新频道，并每 2 分钟重新检查一次。

## 访问控制

私信允许列表（空 = 除非发送者是 `ownerShip`，否则不允许私信）：

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

群组授权默认按频道设为 `restricted`。设置 `defaultAuthorizedShips` 作为基线，并按频道 nest 覆盖：

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

bot 在线程内回复过一次后，会继续响应该线程中的后续消息，无需再次提及。

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

所有者 ship 在所有位置都已授权：私信邀请始终自动接受，群组邀请始终自动接受，频道消息始终通过授权。所有者不需要位于 `dmAllowlist`、`defaultAuthorizedShips` 或 `groupInviteAllowlist` 中。

设置 `ownerShip` 后，未授权请求不会只是被丢弃，而是会排入待审批队列，并向所有者发送私信：

- 来自不在 `dmAllowlist` 中的 ship 的私信请求
- 发送者未通过授权的频道中的提及
- 来自不在 `groupInviteAllowlist` 中的 ship 的群组邀请（当自动接受关闭，或已开启但邀请者不在允许列表中时）

所有者在私信中回复以处理请求：

| 所有者回复                  | 效果                                               |
| ---------------------------- | ---------------------------------------------------- |
| `approve` / `deny` / `block` | 处理最近的待审批请求             |
| `approve <id>` / `deny <id>` | 按 id 处理特定审批                    |
| `block`                      | 同时原生屏蔽该 ship，使其无法重新连接 |
| `unblock ~ship`              | 撤销原生屏蔽                              |
| `blocked`                    | 列出当前已屏蔽的 ship                        |
| `pending`                    | 列出待审批请求                      |

未配置 `ownerShip` 时，未授权私信和频道提及只会被丢弃并记录日志；不会出现审批提示。

## 自动接受设置

自动接受来自已在 `dmAllowlist` 中的 ship 的私信邀请（无论此标志如何，所有者始终会自动接受）：

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

从允许列表自动接受群组邀请（失败时关闭：当 `autoAcceptGroupInvites: true` 且 `groupInviteAllowlist` 为空时，不会接受任何非所有者邀请）：

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

## 通过 Urbit settings store 热重载

上述大多数设置（`dmAllowlist`、`groupInviteAllowlist`、`groupChannels`、`defaultAuthorizedShips`、`autoDiscoverChannels`、`autoAcceptDmInvites`、`autoAcceptGroupInvites`、`ownerShip`、`showModelSignature`）会在首次运行时镜像到 ship 的 `%settings` agent（desk `moltbot`，bucket `tlon`），之后会从那里实时读取，因此通过 Landscape 客户端或内置 skill 的设置命令所做的更改无需重启 Gateway 网关即可生效。`channelRules` 和待审批请求也会以 JSON 形式持久化在那里。对于从未写入 settings store 的值，文件配置仍是事实来源。

## 递送目标（CLI/cron）

与 `openclaw message send` 或 cron 递送配合使用：

- 私信：`~sampel-palnet` 或 `dm/~sampel-palnet`
- 群组：`chat/~host-ship/channel` 或 `group:~host-ship/channel`

## 内置 skill

该插件内置 [`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)，这是用于直接 Urbit 操作的 CLI；安装插件后会自动可用：

- **活动**：提及、回复、未读
- **频道**：列出、创建、重命名
- **联系人**：列出/获取/更新个人资料
- **群组**：创建、加入、邀请/请求流程、角色
- **Hooks**：管理频道 hooks
- **消息**：历史、搜索
- **私信**：发送、回应、接受/拒绝
- **帖子**：回应、删除
- **Notebook**：发布到 diary 频道
- **设置**：通过上述 settings store 热重载插件配置

## 能力

| 功能         | 状态                                        |
| --------------- | --------------------------------------------- |
| 直接消息 | 支持                                     |
| 群组/频道 | 支持（默认需要提及）          |
| 线程         | 支持（加入后会持续回复） |
| 富文本       | Markdown 转换为 Tlon 的原生格式    |
| 图片          | 入站下载，出站上传         |
| 表情回应       | 仅通过[内置 skill](#bundled-skill)  |
| 投票           | 不支持                                 |
| 原生命令 | 默认仅所有者可用                         |

## 故障排查

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

常见故障：

- **私信被忽略**：发送者不在 `dmAllowlist` 中，且未为审批流程配置 `ownerShip`。
- **群组消息被忽略**：频道未发现/未固定，或发送者未通过授权且没有 `ownerShip` 来排队审批。
- **连接错误**：检查 ship URL 是否可访问；为本地 ship 设置 `network.dangerouslyAllowPrivateNetwork`。
- **凭证错误**：登录代码会轮换，请从你的 ship 复制当前代码。

## 配置参考

完整配置：[配置](/zh-CN/gateway/configuration)

| 键                                                    | 含义                                                        |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `channels.tlon.enabled`                                | 启用/禁用渠道启动。                                |
| `channels.tlon.ship`                                   | Bot 的 Urbit ship 名称（例如 `~sampel-palnet`）。                 |
| `channels.tlon.url`                                    | Ship URL（例如 `https://sampel-palnet.tlon.network`）。          |
| `channels.tlon.code`                                   | Ship 登录代码。                                               |
| `channels.tlon.network.dangerouslyAllowPrivateNetwork` | 允许 localhost/LAN ship URL（SSRF 选择启用）。                   |
| `channels.tlon.ownerShip`                              | 所有者 ship：始终授权，接收审批请求。     |
| `channels.tlon.dmAllowlist`                            | 允许发送私信的 ship（空 = 除所有者外无）。              |
| `channels.tlon.autoAcceptDmInvites`                    | 自动接受来自 `dmAllowlist` 中 ship 的私信。                   |
| `channels.tlon.autoAcceptGroupInvites`                 | 自动接受来自 `groupInviteAllowlist` 的群组邀请。         |
| `channels.tlon.groupInviteAllowlist`                   | 其群组邀请会被自动接受的 ship。                   |
| `channels.tlon.autoDiscoverChannels`                   | 自动发现已加入的群组频道（默认：`false`）。        |
| `channels.tlon.groupChannels`                          | 手动固定的频道 nest。                                 |
| `channels.tlon.defaultAuthorizedShips`                 | 对所有频道授权的 ship（无规则匹配时使用）。 |
| `channels.tlon.authorization.channelRules`             | 按频道 nest 配置的授权模式 + 允许列表。                        |
| `channels.tlon.showModelSignature`                     | 将 `_[Generated by <model>]_` 追加到回复。                  |
| `channels.tlon.responsePrefix`                         | 预置到出站回复的静态前缀。                   |
| `channels.tlon.accounts.<id>`                          | 额外命名账户（多 ship 设置）。                 |

## 说明

- 群组回复需要 @ 提及（例如 `~your-bot-ship`），除非 bot 已经加入该线程。
- 线程回复会落在线程内；bot 还会为智能体预置线程上下文中的最后 10 条消息。
- 富文本（粗体、斜体、代码、标题、列表）会转换为 Tlon 的原生格式。
- 发送请求频道摘要的入站消息（例如“总结此频道”）会触发内置历史摘要，而不是正常回复流程。

## 相关

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信认证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固

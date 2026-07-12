---
read_when:
    - 你希望 OpenClaw 通过 Nostr 接收私信
    - 你正在设置去中心化消息传递
summary: 通过 NIP-04 加密消息实现的 Nostr 私信渠道
title: Nostr
x-i18n:
    generated_at: "2026-07-11T20:21:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31fa283f706036a37795ddad71602058ba94388a9cb01044927c4bb2d83ba4a8
    source_path: channels/nostr.md
    workflow: 16
---

Nostr 是一个可下载的渠道插件（`@openclaw/nostr`），使 OpenClaw 能够通过 Nostr 中继接收和回复采用 NIP-04 加密的私信。每个 Gateway 网关仅支持一个账号；仅支持私信。

## 安装

```bash
openclaw plugins install @openclaw/nostr
```

使用不带版本的包说明符可跟随当前官方发布标签。仅当需要可复现安装时，才固定到确切版本。

从本地检出安装（开发工作流）：

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

安装或启用插件后，重启 Gateway 网关。安装插件后，新手引导（`openclaw onboard`）和 `openclaw channels add` 会从共享渠道目录中显示 Nostr。

### 非交互式设置

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

使用 `--use-env` 可将 `NOSTR_PRIVATE_KEY` 保留在环境中，而不是把密钥存储在配置中（仅适用于默认账号）。

## 快速设置

1. 生成 Nostr 密钥对（如有需要）：

```bash
# 使用 nak
nak key generate
```

2. 添加到配置：

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
    },
  },
}
```

3. 导出密钥：

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. 重启 Gateway 网关。

## 配置参考

| 键           | 类型     | 默认值                                      | 说明                                              |
| ------------ | -------- | ------------------------------------------- | ------------------------------------------------- |
| `privateKey` | string   | 必填                                        | `nsec` 或十六进制格式的私钥；允许使用密钥引用    |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | 中继 URL（WebSocket）                             |
| `dmPolicy`   | string   | `pairing`                                   | 私信访问策略                                      |
| `allowFrom`  | string[] | `[]`                                        | 允许的发送者公钥                                  |
| `enabled`    | boolean  | `true`                                      | 启用或禁用渠道                                    |
| `name`       | string   | -                                           | 显示名称                                          |
| `profile`    | object   | -                                           | NIP-01 个人资料元数据                             |

## 个人资料元数据

个人资料数据会作为 NIP-01 `kind:0` 事件发布。你可以在 Control UI（Channels -> Nostr -> Profile）中管理，也可以直接在配置中设置。

示例：

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Personal assistant DM bot",
        picture: "https://example.com/avatar.png",
        banner: "https://example.com/banner.png",
        website: "https://example.com",
        nip05: "openclaw@example.com",
        lud16: "openclaw@example.com",
      },
    },
  },
}
```

注意：

- 个人资料 URL 必须使用 `https://`。
- 从中继导入时会合并字段，并保留本地覆盖值。

## 访问控制

### 私信策略

- **配对**（默认）：未知发送者会收到配对码。
- **允许列表**：只有 `allowFrom` 中的公钥可以发送私信。
- **开放**：允许公开传入私信（需要设置 `allowFrom: ["*"]`）。
- **禁用**：忽略传入私信。

执行说明：

- 在执行发送者策略和 NIP-04 解密之前，会先验证传入事件的签名，因此伪造事件会被尽早拒绝。
- 发送配对回复时，不会解密或处理原始私信正文。
- 传入私信会受到速率限制（全局和按发送者），超大负载会在解密前被丢弃。

### 允许列表示例

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      dmPolicy: "allowlist",
      allowFrom: ["npub1abc...", "npub1xyz..."],
    },
  },
}
```

## 密钥格式

接受的格式：

- **私钥：**`nsec...` 或 64 字符十六进制字符串
- **公钥（`allowFrom`）：**`npub...` 或十六进制字符串

## 中继

默认值：`relay.damus.io` 和 `nos.lol`。

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nostr.wine"],
    },
  },
}
```

提示：

- 使用 2 至 3 个中继以提供冗余。
- 避免使用过多中继（会增加延迟和重复）。
- 付费中继可以提高可靠性。
- 本地中继适合用于测试（`ws://localhost:7777`）。

## 协议支持

| NIP    | 状态   | 说明                              |
| ------ | ------ | --------------------------------- |
| NIP-01 | 已支持 | 基本事件格式和个人资料元数据      |
| NIP-04 | 已支持 | 加密私信（`kind:4`）              |
| NIP-17 | 已规划 | 礼物封装私信                      |
| NIP-44 | 已规划 | 版本化加密                        |

## 测试

### 本地中继

```bash
# 启动 strfry
docker run -p 7777:7777 ghcr.io/hoytech/strfry
```

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["ws://localhost:7777"],
    },
  },
}
```

### 手动测试

1. 从 Gateway 网关日志或 `openclaw channels status` 中记下机器人的公钥（十六进制格式；如有需要，请在客户端中转换为 npub）。
2. 打开一个 Nostr 客户端（Amethyst、Damus 等）。
3. 向机器人公钥发送私信。
4. 验证回复。

## 故障排查

### 无法接收消息

- 验证私钥有效。
- 确保中继 URL 可访问并使用 `wss://`（本地中继可使用 `ws://`）。
- 确认 `enabled` 未设置为 `false`。
- 检查 Gateway 网关日志中是否存在中继连接错误。

### 无法发送回复

- 检查中继是否接受写入。
- 验证出站连接。
- 留意中继速率限制。

### 重复回复

- 使用多个中继时，这属于预期行为。
- 消息会按事件 ID 去重；只有首次投递会触发回复。

## 安全性

- 切勿提交私钥。
- 使用环境变量存储密钥。
- 对于生产环境中的机器人，建议使用 `allowlist`。
- 在执行发送者策略之前会验证签名，并且会在解密之前执行发送者策略，因此伪造事件会被尽早拒绝，未知发送者也无法强制系统执行完整的加密运算。

## 限制（MVP）

- 仅支持私信（不支持群聊）。
- 不支持媒体附件。
- 仅支持 NIP-04（已规划支持 NIP-17 礼物封装）。

## 相关内容

- [渠道概览](/zh-CN/channels) — 所有受支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全性](/zh-CN/gateway/security) — 访问模型和安全加固

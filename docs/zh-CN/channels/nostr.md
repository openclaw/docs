---
read_when:
    - 你希望 OpenClaw 通过 Nostr 接收私信
    - 你正在设置去中心化消息传递
summary: Nostr 私信渠道，通过 NIP-04 加密消息
title: Nostr
x-i18n:
    generated_at: "2026-07-05T11:04:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31fa283f706036a37795ddad71602058ba94388a9cb01044927c4bb2d83ba4a8
    source_path: channels/nostr.md
    workflow: 16
---

Nostr 是一个可下载的渠道插件（`@openclaw/nostr`），让 OpenClaw 能通过 Nostr 中继接收和回复 NIP-04 加密私信。每个 Gateway 网关一个账户；仅支持私信。

## 安装

```bash
openclaw plugins install @openclaw/nostr
```

使用裸包规范来跟随当前官方发布标签。仅在需要可复现安装时固定精确版本。

从本地检出安装（开发工作流）：

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

安装或启用插件后重启 Gateway 网关。安装插件后，新手引导（`openclaw onboard`）和 `openclaw channels add` 会从共享渠道目录中显示 Nostr。

### 非交互式设置

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

使用 `--use-env` 将 `NOSTR_PRIVATE_KEY` 保留在环境变量中，而不是把密钥存入配置（仅默认账户）。

## 快速设置

1. 生成 Nostr 密钥对（如需要）：

```bash
# Using nak
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

| 键名         | 类型     | 默认值                                      | 描述                                                     |
| ------------ | -------- | ------------------------------------------- | -------------------------------------------------------- |
| `privateKey` | string   | 必填                                       | `nsec` 或十六进制格式的私钥；允许 secret ref             |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | 中继 URL（WebSocket）                                    |
| `dmPolicy`   | string   | `pairing`                                   | 私信访问策略                                             |
| `allowFrom`  | string[] | `[]`                                        | 允许的发送方公钥                                         |
| `enabled`    | boolean  | `true`                                      | 启用/禁用渠道                                            |
| `name`       | string   | -                                           | 显示名称                                                 |
| `profile`    | object   | -                                           | NIP-01 个人资料元数据                                    |

## 个人资料元数据

个人资料数据会作为 NIP-01 `kind:0` 事件发布。你可以从 Control UI（Channels -> Nostr -> Profile）管理它，也可以直接在配置中设置。

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
- 从中继导入会合并字段并保留本地覆盖。

## 访问控制

### 私信策略

- **pairing**（默认）：未知发送方会收到配对码。
- **allowlist**：只有 `allowFrom` 中的公钥可以发送私信。
- **open**：公开入站私信（需要 `allowFrom: ["*"]`）。
- **disabled**：忽略入站私信。

执行说明：

- 在发送方策略和 NIP-04 解密之前会验证入站事件签名，因此伪造事件会被提前拒绝。
- 配对回复会在不解密或处理原始私信正文的情况下发送。
- 入站私信会受到速率限制（全局和按发送方），过大的载荷会在解密前被丢弃。

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

- **私钥：** `nsec...` 或 64 字符十六进制
- **公钥（`allowFrom`）：** `npub...` 或十六进制

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

- 使用 2-3 个中继以提高冗余。
- 避免使用过多中继（延迟、重复）。
- 付费中继可以提高可靠性。
- 本地中继适合测试（`ws://localhost:7777`）。

## 协议支持

| NIP    | 状态   | 描述                                  |
| ------ | ------ | ------------------------------------- |
| NIP-01 | 已支持 | 基础事件格式 + 个人资料元数据         |
| NIP-04 | 已支持 | 加密私信（`kind:4`）                  |
| NIP-17 | 计划中 | 礼物包装私信                          |
| NIP-44 | 计划中 | 带版本的加密                          |

## 测试

### 本地中继

```bash
# Start strfry
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

1. 从 Gateway 网关日志或 `openclaw channels status` 记下 Bot 公钥（十六进制；如需要，在你的客户端中转换为 npub）。
2. 打开 Nostr 客户端（Amethyst、Damus 等）。
3. 给 Bot 公钥发送私信。
4. 验证响应。

## 故障排查

### 收不到消息

- 验证私钥有效。
- 确保中继 URL 可访问并使用 `wss://`（本地使用 `ws://`）。
- 确认 `enabled` 不是 `false`。
- 检查 Gateway 网关日志中的中继连接错误。

### 不发送响应

- 检查中继是否接受写入。
- 验证出站连接。
- 留意中继速率限制。

### 响应重复

- 使用多个中继时这是预期情况。
- 消息会按事件 ID 去重；只有第一次送达会触发响应。

## 安全

- 切勿提交私钥。
- 对密钥使用环境变量。
- 生产 Bot 建议使用 `allowlist`。
- 在发送方策略之前会验证签名，并且发送方策略会在解密之前执行，因此伪造事件会被提前拒绝，未知发送方也无法强制执行完整的加密计算。

## 限制（MVP）

- 仅支持私信（不支持群聊）。
- 不支持媒体附件。
- 仅支持 NIP-04（计划支持 NIP-17 gift-wrap）。

## 相关

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固

---
read_when:
    - 你希望 OpenClaw 通过 Nostr 接收私信
    - 你正在设置去中心化消息传递
summary: 通过 NIP-04 加密消息实现的 Nostr 私信渠道
title: Nostr
x-i18n:
    generated_at: "2026-05-02T21:04:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3bf033d99b779cdf7b038461c9155694e22f65b1d54dbc28d0314bcf5424ddf
    source_path: channels/nostr.md
    workflow: 16
---

**Status：** 可选内置插件（默认禁用，直到完成配置）。

Nostr 是一个用于社交网络的去中心化协议。此渠道使 OpenClaw 能够通过 NIP-04 接收和回复加密的直接消息（私信）。

## 内置插件

当前 OpenClaw 版本将 Nostr 作为内置插件发布，因此普通打包
构建不需要单独安装。

### 较旧/自定义安装

- 新手引导（`openclaw onboard`）和 `openclaw channels add` 仍会从共享渠道目录中显示
  Nostr。
- 如果你的构建排除了内置 Nostr，请直接安装 npm 包。

```bash
openclaw plugins install @openclaw/nostr
```

当你使用 OpenClaw beta 渠道，并且 npmjs
显示 `beta` 领先于 `latest` 时，请使用 `@openclaw/nostr@beta`。

使用本地检出（开发工作流）：

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

安装或启用插件后，重启 Gateway 网关。

### 非交互式设置

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

使用 `--use-env` 将 `NOSTR_PRIVATE_KEY` 保留在环境中，而不是把密钥存入配置。

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

| 键           | 类型     | 默认值                                      | 描述                              |
| ------------ | -------- | ------------------------------------------- | --------------------------------- |
| `privateKey` | string   | 必填                                        | `nsec` 或十六进制格式的私钥       |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | 中继 URL（WebSocket）             |
| `dmPolicy`   | string   | `pairing`                                   | 私信访问策略                      |
| `allowFrom`  | string[] | `[]`                                        | 允许的发送方公钥                  |
| `enabled`    | boolean  | `true`                                      | 启用/禁用渠道                     |
| `name`       | string   | -                                           | 显示名称                          |
| `profile`    | object   | -                                           | NIP-01 个人资料元数据             |

## 个人资料元数据

个人资料数据会作为 NIP-01 `kind:0` 事件发布。你可以从 Control UI（Channels -> Nostr -> Profile）管理它，或直接在配置中设置。

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

强制执行说明：

- 入站事件签名会先于发送方策略和 NIP-04 解密进行验证，因此伪造事件会被提前拒绝。
- 配对回复会在不处理原始私信正文的情况下发送。
- 入站私信会受到速率限制，超大载荷会在解密前被丢弃。

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

- 使用 2-3 个中继以实现冗余。
- 避免使用过多中继（延迟、重复）。
- 付费中继可以提高可靠性。
- 本地中继适合测试（`ws://localhost:7777`）。

## 协议支持

| NIP    | Status | 描述                            |
| ------ | ------ | ------------------------------- |
| NIP-01 | 已支持 | 基本事件格式 + 个人资料元数据   |
| NIP-04 | 已支持 | 加密私信（`kind:4`）            |
| NIP-17 | 已计划 | 礼物包装私信                    |
| NIP-44 | 已计划 | 版本化加密                      |

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

1. 从日志中记下 bot 公钥（npub）。
2. 打开一个 Nostr 客户端（Damus、Amethyst 等）。
3. 向 bot 公钥发送私信。
4. 验证响应。

## 故障排除

### 未收到消息

- 验证私钥有效。
- 确保中继 URL 可访问并使用 `wss://`（本地使用 `ws://`）。
- 确认 `enabled` 不是 `false`。
- 检查 Gateway 网关日志中的中继连接错误。

### 未发送响应

- 检查中继是否接受写入。
- 验证出站连接能力。
- 留意中继速率限制。

### 重复响应

- 使用多个中继时这是预期情况。
- 消息会按事件 ID 去重；只有第一次送达会触发响应。

## 安全

- 切勿提交私钥。
- 对密钥使用环境变量。
- 对生产 bot 考虑使用 `allowlist`。
- 签名会先于发送方策略进行验证，并且发送方策略会在解密前强制执行，因此伪造事件会被提前拒绝，未知发送方也无法强制执行完整加密工作。

## 限制（MVP）

- 仅支持直接消息（不支持群聊）。
- 不支持媒体附件。
- 仅支持 NIP-04（已计划 NIP-17 礼物包装）。

## 相关

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [渠道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固

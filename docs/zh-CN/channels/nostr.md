---
read_when:
    - 你想让 OpenClaw 通过 Nostr 接收私信
    - 你正在设置去中心化消息传递
summary: 通过 NIP-04 加密消息实现的 Nostr 私信渠道
title: Nostr
x-i18n:
    generated_at: "2026-05-02T21:57:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6158c22c0ffc5aea56d0ac2b68955f30c3a785013dba5410cbd70f9b689dc3c
    source_path: channels/nostr.md
    workflow: 16
---

**Status：** 可选内置插件（默认禁用，直到配置后启用）。

Nostr 是一种用于社交网络的去中心化协议。此渠道让 OpenClaw 能够通过 NIP-04 接收并回复加密私信。

## 内置插件

当前 OpenClaw 版本以内置插件形式随附 Nostr，因此常规打包构建
不需要单独安装。

### 较旧/自定义安装

- 新手引导（`openclaw onboard`）和 `openclaw channels add` 仍会从共享渠道目录中展示
  Nostr。
- 如果你的构建排除了内置 Nostr，请直接安装 npm 包。

```bash
openclaw plugins install @openclaw/nostr
```

使用裸包名可跟随当前官方发布标签。仅在需要可复现安装时才固定精确
版本。

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

使用 `--use-env` 可将 `NOSTR_PRIVATE_KEY` 保留在环境中，而不是把密钥存入配置。

## 快速设置

1. 生成 Nostr 密钥对（如果需要）：

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

| 键           | 类型     | 默认值                                      | 描述                                |
| ------------ | -------- | ------------------------------------------- | ----------------------------------- |
| `privateKey` | string   | required                                    | `nsec` 或十六进制格式的私钥         |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | 中继 URL（WebSocket）               |
| `dmPolicy`   | string   | `pairing`                                   | 私信访问策略                        |
| `allowFrom`  | string[] | `[]`                                        | 允许的发送者公钥                    |
| `enabled`    | boolean  | `true`                                      | 启用/禁用渠道                       |
| `name`       | string   | -                                           | 显示名称                            |
| `profile`    | object   | -                                           | NIP-01 个人资料元数据               |

## 个人资料元数据

个人资料数据会作为 NIP-01 `kind:0` 事件发布。你可以从控制界面（渠道 -> Nostr -> 个人资料）管理它，或直接在配置中设置。

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
- 从中继导入会合并字段，并保留本地覆盖项。

## 访问控制

### 私信策略

- **pairing**（默认）：未知发送者会收到配对码。
- **allowlist**：只有 `allowFrom` 中的公钥可以发送私信。
- **open**：公开入站私信（需要 `allowFrom: ["*"]`）。
- **disabled**：忽略入站私信。

强制执行说明：

- 在发送者策略和 NIP-04 解密之前会验证入站事件签名，因此伪造事件会被提前拒绝。
- 配对回复会在不处理原始私信正文的情况下发送。
- 入站私信会受到速率限制，过大的载荷会在解密前被丢弃。

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

- 使用 2-3 个中继以提供冗余。
- 避免使用过多中继（延迟、重复）。
- 付费中继可以提高可靠性。
- 本地中继适合测试（`ws://localhost:7777`）。

## 协议支持

| NIP    | Status    | 描述                                  |
| ------ | --------- | ------------------------------------- |
| NIP-01 | Supported | 基本事件格式 + 个人资料元数据         |
| NIP-04 | Supported | 加密私信（`kind:4`）                  |
| NIP-17 | Planned   | 礼物包装私信                          |
| NIP-44 | Planned   | 版本化加密                            |

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

1. 从日志中记下机器人的公钥（npub）。
2. 打开一个 Nostr 客户端（Damus、Amethyst 等）。
3. 向机器人公钥发送私信。
4. 验证响应。

## 故障排除

### 未收到消息

- 验证私钥有效。
- 确保中继 URL 可访问并使用 `wss://`（本地可使用 `ws://`）。
- 确认 `enabled` 不是 `false`。
- 检查 Gateway 网关日志中的中继连接错误。

### 未发送响应

- 检查中继是否接受写入。
- 验证出站连接。
- 留意中继速率限制。

### 重复响应

- 使用多个中继时属于预期情况。
- 消息会按事件 ID 去重；只有首次投递会触发响应。

## 安全

- 切勿提交私钥。
- 对密钥使用环境变量。
- 对生产机器人考虑使用 `allowlist`。
- 会在发送者策略之前验证签名，并在解密之前强制执行发送者策略，因此伪造事件会被提前拒绝，未知发送者也无法强制执行完整加密工作。

## 限制（MVP）

- 仅支持直接消息（不支持群聊）。
- 不支持媒体附件。
- 仅支持 NIP-04（计划支持 NIP-17 礼物包装）。

## 相关内容

- [渠道概览](/zh-CN/channels) — 所有受支持渠道
- [配对](/zh-CN/channels/pairing) — 私信认证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [渠道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固

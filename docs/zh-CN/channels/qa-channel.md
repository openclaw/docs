---
read_when:
    - 你正在将合成 QA 传输接入本地或 CI 测试运行
    - 你需要内置的 qa-channel 配置面
    - 你正在迭代端到端 QA 自动化
summary: 用于确定性 OpenClaw QA 场景的模拟 Slack 类渠道插件
title: QA channel
x-i18n:
    generated_at: "2026-05-10T19:23:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f28962032bc5f6b228de731ae6bd9a22831604b506b7073aeffba19ac22e0e8
    source_path: channels/qa-channel.md
    workflow: 16
    postprocess_version: locale-links-v1
---

`qa-channel` 是用于自动化 OpenClaw QA 的内置合成消息传输。它不是生产渠道，而是用于演练真实传输机制所使用的同一渠道插件边界，同时保持状态确定且完全可检查。

## 它的作用

- Slack 类目标语法：
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- 共享的 `channel:` 和 `group:` 对话会作为群组/频道房间轮次呈现给智能体，因此它们会演练 Discord、Slack、Telegram 以及类似传输机制所使用的同一可见回复和消息工具路由策略。
- 基于 HTTP 的合成总线，用于入站消息注入、出站转录捕获、创建线程、回应、编辑、删除，以及搜索/读取操作。
- 主机侧自检运行器，会将 Markdown 报告写入 `.artifacts/qa-e2e/`。

## 配置

```json
{
  "channels": {
    "qa-channel": {
      "baseUrl": "http://127.0.0.1:43123",
      "botUserId": "openclaw",
      "botDisplayName": "OpenClaw QA",
      "allowFrom": ["*"],
      "pollTimeoutMs": 1000
    }
  }
}
```

账号键名：

- `enabled` - 此账号的总开关。
- `name` - 可选显示标签。
- `baseUrl` - 合成总线 URL。
- `botUserId` - 目标语法中使用的 Matrix 风格机器人用户 ID。
- `botDisplayName` - 出站消息的显示名称。
- `pollTimeoutMs` - 长轮询等待窗口。介于 100 和 30000 之间的整数。
- `allowFrom` - 发送者允许列表（用户 ID 或 `"*"`）。私信和允许列表群组策略都使用这些合成发送者 ID。
- `groupPolicy` - 共享房间策略：`"open"`（默认）、`"allowlist"` 或 `"disabled"`。
- `groupAllowFrom` - 可选的共享房间发送者允许列表。在 `"allowlist"` 下省略时，QA Channel 会回退到 `allowFrom`。
- `groups.<room>.requireMention` - 在特定群组/频道房间中，回复前要求提及机器人。`groups."*"` 设置默认值。
- `defaultTo` - 未提供目标时的回退目标。
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - 按操作划分的工具门控。

顶层多账号键名：

- `accounts` - 以账号 ID 为键的命名逐账号覆盖记录。
- `defaultAccount` - 配置多个账号时的首选账号 ID。

## 运行器

主机侧自检（在 `.artifacts/qa-e2e/` 下写入 Markdown 报告）：

```bash
pnpm qa:e2e
```

这会通过 `qa-lab` 路由，启动仓库内 QA 总线，引导内置 `qa-channel` 运行时切片，并运行确定性自检。

完整的仓库支持场景套件：

```bash
pnpm openclaw qa suite
```

针对 QA Gateway 网关通道并行运行场景。有关场景、配置档案和提供商模式，请参阅 [QA overview](/zh-CN/concepts/qa-e2e-automation)。

Docker 支持的 QA 站点（Gateway 网关 + QA Lab 调试器 UI 位于同一栈中）：

```bash
pnpm qa:lab:up
```

构建 QA 站点，启动 Docker 支持的 Gateway 网关 + QA Lab 栈，并打印 QA Lab URL。随后你可以选择场景、选择模型通道、启动单次运行，并实时查看结果。QA Lab 调试器独立于已发布的 Control UI 包。

## 相关内容

- [QA overview](/zh-CN/concepts/qa-e2e-automation) - 整体栈、传输适配器、场景编写
- [Matrix QA](/zh-CN/concepts/qa-matrix) - 驱动真实渠道的实时传输运行器示例
- [配对](/zh-CN/channels/pairing)
- [群组](/zh-CN/channels/groups)
- [渠道概览](/zh-CN/channels)

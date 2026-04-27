---
read_when:
    - 你正在将合成 QA 传输接入本地或 CI 测试运行中
    - 你需要内置的 QA channel 配置界面
    - 你正在迭代端到端 QA 自动化
summary: 用于确定性 OpenClaw QA 场景的合成 Slack 类渠道插件
title: QA channel
x-i18n:
    generated_at: "2026-04-27T17:44:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1de1f52da1a14c845cf2a536ddc6f36ab52ed6364f68d9ece32ce272e2a2f96
    source_path: channels/qa-channel.md
    workflow: 15
---

`qa-channel` 是用于自动化 OpenClaw QA 的内置合成消息传输。它不是生产渠道——它的存在是为了在保持状态确定且完全可检查的同时，演练真实传输所使用的同一渠道插件边界。

## 它的作用

- Slack 类目标语法：
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- 基于 HTTP 的合成总线，用于入站消息注入、出站消息记录捕获、线程创建、反应、编辑、删除，以及搜索/读取操作。
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

账户键名：

- `enabled` — 此账户的主开关。
- `name` — 可选显示标签。
- `baseUrl` — 合成总线 URL。
- `botUserId` — 目标语法中使用的 Matrix 风格机器人用户 id。
- `botDisplayName` — 出站消息的显示名称。
- `pollTimeoutMs` — 长轮询等待窗口。取值为 100 到 30000 之间的整数。
- `allowFrom` — 发送者允许列表（用户 id 或 `"*"`）。
- `defaultTo` — 未提供目标时使用的回退目标。
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — 按操作划分的工具门控。

顶层多账户键名：

- `accounts` — 以账户 id 为键、包含具名逐账户覆盖项的记录。
- `defaultAccount` — 配置了多个账户时的首选账户 id。

## 运行器

主机侧自检（会在 `.artifacts/qa-e2e/` 下写入 Markdown 报告）：

```bash
pnpm qa:e2e
```

这会通过 `qa-lab` 路由，启动仓库内 QA 总线，引导内置的 `qa-channel` 运行时切片，并运行确定性的自检。

完整的仓库支持场景套件：

```bash
pnpm openclaw qa suite
```

并行运行针对 QA gateway 通道的场景。关于场景、配置文件和提供商模式，请参阅 [QA overview](/zh-CN/concepts/qa-e2e-automation)。

Docker 支持的 QA 站点（Gateway 网关 + QA Lab 调试器 UI 集成在同一个栈中）：

```bash
pnpm qa:lab:up
```

这会构建 QA 站点，启动由 Docker 支持的 Gateway 网关 + QA Lab 栈，并输出 QA Lab URL。之后你可以在其中选择场景、选择模型通道、启动单次运行，并实时查看结果。QA Lab 调试器独立于已发布的 Control UI 打包内容。

## 相关内容

- [QA overview](/zh-CN/concepts/qa-e2e-automation) — 整体栈、传输适配器、场景编写
- [Matrix QA](/zh-CN/concepts/qa-matrix) — 驱动真实渠道的示例实时传输运行器
- [配对](/zh-CN/channels/pairing)
- [群组](/zh-CN/channels/groups)
- [渠道概览](/zh-CN/channels)

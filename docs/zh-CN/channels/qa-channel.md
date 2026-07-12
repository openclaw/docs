---
read_when:
    - 你正在将合成 QA 传输接入本地或 CI 测试运行中
    - 你需要内置的 QA channel 配置界面
    - 你正在迭代端到端 QA 自动化
summary: 用于确定性 OpenClaw QA 场景的合成 Slack 类渠道插件
title: QA channel
x-i18n:
    generated_at: "2026-07-11T20:20:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33af6ef31515e0cab0ee2540f48f3ffea8aba3d13915dc8cf66111599354187
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` 是用于自动化 OpenClaw QA 的仓库本地合成消息传输层（`extensions/qa-channel`，私有包，不包含在打包安装中）。它不是生产渠道，而是用于通过真实传输层所使用的同一渠道插件边界进行测试，同时保持状态确定且完全可检查。

## 功能

- Slack 级目标语法：
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- 共享的 `channel:` 和 `group:` 对话会作为群组/渠道房间轮次呈现给智能体，因此它们会测试 Discord、Slack、Telegram 及类似传输层所使用的同一可见回复和消息工具路由策略。
- 基于 HTTP 的合成总线，用于注入入站消息、捕获出站记录、创建线程、添加表情回应、编辑、删除，以及执行搜索/读取操作。
- 主机端自检运行器，会将 Markdown 报告写入 `.artifacts/qa-e2e/`。

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

账户键：

- `enabled` - 此账户的总开关。
- `name` - 可选的显示标签。
- `baseUrl` - 合成总线 URL。设置此项后，该账户即视为已配置。
- `botUserId` - 目标语法中使用的合成机器人用户 ID（默认值：`openclaw`）。
- `botDisplayName` - 出站消息的显示名称（默认值：`OpenClaw QA`）。
- `pollTimeoutMs` - 长轮询等待窗口。取值为 100 到 30000 之间的整数（默认值：1000）。
- `allowFrom` - 发件人允许列表（用户 ID 或 `"*"`；默认值：`["*"]`）。私信始终使用 `open` 策略；采用允许列表的群组策略也使用这些合成发件人 ID。
- `groupPolicy` - 共享房间策略：`"open"`（默认值）、`"allowlist"` 或 `"disabled"`。
- `groupAllowFrom` - 可选的共享房间发件人允许列表。在 `"allowlist"` 下省略时，QA Channel 会回退到 `allowFrom`。
- `groups.<room>.requireMention` - 要求在特定群组/渠道房间中提及机器人后才回复（默认值：false）。`groups."*"` 用于设置默认值；每个房间的 `tools` / `toolsBySender` 用于设置工具策略覆盖项。
- `defaultTo` - 未提供目标时使用的回退目标。
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - 按操作控制工具使用权限。

顶层多账户键：

- `accounts` - 以账户 ID 为键的具名账户级覆盖项记录。
- `defaultAccount` - 配置多个账户时的首选账户 ID。

## 运行器

主机端自检（将 Markdown 报告写入 `.artifacts/qa-e2e/`）：

```bash
pnpm qa:e2e
```

此命令通过 `qa-lab` 进行路由，启动仓库内的 QA 总线，引导 `qa-channel` 运行时切片，并运行确定性自检。

完整的仓库支持场景套件：

```bash
pnpm openclaw qa suite
```

针对 QA Gateway 网关通道并行运行场景。有关场景、配置文件和提供商模式，请参阅 [QA overview](/zh-CN/concepts/qa-e2e-automation)。

基于 Docker 的 QA 站点（Gateway 网关 + QA Lab 调试器 UI，位于同一技术栈中）：

```bash
pnpm qa:lab:up
```

构建 QA 站点，启动基于 Docker 的 Gateway 网关 + QA Lab 技术栈，并输出 QA Lab URL。你可以在其中选择场景和模型通道、启动单次运行，并实时查看结果。QA Lab 调试器与发布的 Control UI 包相互独立。

## 相关内容

- [QA overview](/zh-CN/concepts/qa-e2e-automation) - 整体技术栈、传输适配器和场景编写
- [Matrix QA](/zh-CN/concepts/qa-matrix) - 驱动真实渠道的实时传输运行器示例
- [配对](/zh-CN/channels/pairing)
- [群组](/zh-CN/channels/groups)
- [渠道概览](/zh-CN/channels)

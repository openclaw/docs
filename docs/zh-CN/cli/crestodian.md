---
read_when:
    - 你在不带任何命令的情况下运行 openclaw，并且想了解 Crestodian
    - 你需要一种无配置且安全的方式来检查或修复 OpenClaw
    - 你正在设计或启用消息渠道救援模式
summary: Crestodian 的 CLI 参考和安全模型，即无配置且安全的设置与修复助手
title: Crestodian
x-i18n:
    generated_at: "2026-04-25T10:04:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19ee9b794152c69e3db8fa89e2876de30cc076db527ec7ee06f103e7d25a4d03
    source_path: cli/crestodian.md
    workflow: 15
---

# `openclaw crestodian`

Crestodian 是 OpenClaw 的本地设置、修复和配置助手。它旨在在正常智能体路径损坏时仍然可访问。

在不带任何命令的情况下运行 `openclaw` 会在交互式终端中启动 Crestodian。运行 `openclaw crestodian` 会显式启动同一个助手。

## Crestodian 会显示什么

启动时，交互式 Crestodian 会打开与 `openclaw tui` 使用的相同 TUI shell，但使用 Crestodian 聊天后端。聊天日志会从一个紧凑的系统概览开始：

- 配置路径及其有效性
- 已配置的智能体和默认智能体
- 默认模型
- 本地 Codex 和 Claude Code CLI 的可用性
- OpenAI 和 Anthropic API 密钥是否存在
- 规划器模式（`deterministic` 或通过已配置模型进行模型辅助）
- 本地文档路径或公开文档 URL
- Git 检出时的本地源码路径，否则为 OpenClaw GitHub 源码 URL
- Gateway 网关 可达性
- 立即推荐的下一步操作

它不会为了启动而转储密钥，也不会加载插件 CLI 命令。TUI 仍然提供正常的页眉、聊天日志、状态行、页脚、自动补全和编辑器控件。

Crestodian 使用与常规智能体相同的 OpenClaw 参考发现机制。在 Git 检出中，它会将自己指向本地 `docs/` 和本地源码树。在 npm 包安装中，它会使用内置的包文档，并链接到 [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)，同时明确指导你在文档不足时查看源码。

## 示例

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work model openai/gpt-5.5" --yes
openclaw crestodian --message "set default model openai/gpt-5.5" --yes
openclaw onboard --modern
```

在 Crestodian TUI 中：

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## 安全启动

Crestodian 的启动路径刻意保持精简。它可以在以下情况下运行：

- 缺少 `openclaw.json`
- `openclaw.json` 无效
- Gateway 网关 已停止
- 插件命令注册不可用
- 尚未配置任何智能体

`openclaw --help` 和 `openclaw --version` 仍然使用正常的快速路径。非交互式的 `openclaw` 会以一条简短消息退出，而不是打印根帮助，因为无命令产品就是 Crestodian。

## 操作与批准

Crestodian 使用类型化操作，而不是临时编辑配置。

只读操作可以立即运行：

- 显示概览
- 列出智能体
- 显示模型/后端状态
- 运行 Status 或健康检查
- 检查 Gateway 网关 可达性
- 运行 doctor，但不进行交互式修复
- 验证配置
- 显示审计日志路径

持久化操作在交互模式下需要对话式批准，除非你为直接命令传入 `--yes`：

- 写入配置
- 运行 `config set`
- 通过 `config set-ref` 设置受支持的 SecretRef 值
- 运行设置/新手引导引导流程
- 更改默认模型
- 启动、停止或重启 Gateway 网关
- 创建智能体
- 运行会重写配置或状态的 doctor 修复

已应用的写入会记录到：

```text
~/.openclaw/audit/crestodian.jsonl
```

发现过程不会被审计。只有已应用的操作和写入会被记录。

`openclaw onboard --modern` 会将 Crestodian 作为现代新手引导预览启动。普通的 `openclaw onboard` 仍然运行经典新手引导。

## 设置引导

`setup` 是一种聊天优先的新手引导引导方式。它只通过类型化配置操作写入，并且会先请求批准。

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

当未配置任何模型时，setup 会按以下顺序选择第一个可用后端，并告诉你它选择了什么：

- 已存在的显式模型（如果已配置）
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

如果这些都不可用，setup 仍会写入默认工作区，并将模型保留为未设置状态。安装或登录 Codex/Claude Code，或暴露 `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`，然后再次运行 setup。

## 模型辅助规划器

Crestodian 始终以确定性模式启动。对于确定性解析器无法理解的模糊命令，本地 Crestodian 可以通过 OpenClaw 的正常运行时路径进行一次受限的规划器轮次。它会优先使用已配置的 OpenClaw 模型。如果尚无可用的已配置模型，它可以回退到机器上已存在的本地运行时：

- Claude Code CLI：`claude-cli/claude-opus-4-7`
- Codex app-server harness：`openai/gpt-5.5`，使用 `embeddedHarness.runtime: "codex"`
- Codex CLI：`codex-cli/gpt-5.5`

模型辅助规划器不能直接更改配置。它必须先将请求转换为 Crestodian 的某个类型化命令，然后才会应用正常的批准和审计规则。Crestodian 会在运行任何操作之前打印它所使用的模型和解释后的命令。无配置的回退规划器轮次是临时的，在运行时支持的情况下会禁用工具，并使用临时工作区/会话。

消息渠道救援模式不会使用模型辅助规划器。远程救援保持确定性，这样受损或被入侵的正常智能体路径就不能被用作配置编辑器。

## 切换到智能体

使用自然语言选择器可离开 Crestodian 并打开正常的 TUI：

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`、`openclaw chat` 和 `openclaw terminal` 仍会直接打开正常智能体 TUI。它们不会启动 Crestodian。

切换到正常 TUI 后，使用 `/crestodian` 可返回 Crestodian。你可以附带后续请求：

```text
/crestodian
/crestodian restart gateway
```

TUI 中的智能体切换会留下一个提示，表明 `/crestodian` 可用。

## 消息救援模式

消息救援模式是 Crestodian 的消息渠道入口点。它适用于你的正常智能体已失效，但像 WhatsApp 这样的受信任渠道仍能接收命令的情况。

支持的文本命令：

- `/crestodian <request>`

操作员流程：

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

也可以通过本地提示或救援模式将智能体创建加入队列：

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

远程救援模式是一个管理员界面。必须将其视为远程配置修复，而不是普通聊天。

远程救援的安全契约：

- 当沙箱隔离处于激活状态时禁用。如果某个智能体/会话处于沙箱隔离状态，Crestodian 必须拒绝远程救援，并说明需要本地 CLI 修复。
- 默认有效状态是 `auto`：仅在受信任的 YOLO 操作中允许远程救援，也就是运行时已具有未沙箱隔离的本地权限时。
- 需要显式的所有者身份。救援不得接受通配发送者规则、开放群组策略、未认证 webhook 或匿名渠道。
- 默认仅限所有者私信。群组/渠道救援需要显式选择启用，并且仍应将批准提示路由到所有者私信。
- 远程救援不能打开本地 TUI，也不能切换到交互式智能体会话。要进行智能体交接，请使用本地 `openclaw`。
- 即使在救援模式下，持久化写入仍然需要批准。
- 审计每一个已应用的救援操作，包括渠道、账户、发送者、会话键、操作、变更前配置哈希和变更后配置哈希。
- 永远不要回显密钥。SecretRef 检查应报告可用性，而不是值。
- 如果 Gateway 网关 仍然存活，优先使用 Gateway 网关 的类型化操作。如果 Gateway 网关 已失效，则只使用不依赖正常 Agent loop 的最小本地修复界面。

配置结构：

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
    },
  },
}
```

`enabled` 应接受：

- `"auto"`：默认值。仅当有效运行时是 YOLO 且沙箱隔离关闭时允许。
- `false`：绝不允许消息渠道救援。
- `true`：在所有者/渠道检查通过时显式允许救援。这仍然不能绕过沙箱隔离拒绝。

默认 `"auto"` YOLO 姿态是：

- 沙箱模式解析为 `off`
- `tools.exec.security` 解析为 `full`
- `tools.exec.ask` 解析为 `off`

远程救援由 Docker 通道覆盖：

```bash
pnpm test:docker:crestodian-rescue
```

无配置本地规划器回退由以下命令覆盖：

```bash
pnpm test:docker:crestodian-planner
```

一个选择启用的实时渠道命令界面冒烟测试会检查 `/crestodian status`，以及通过救援处理器完成的持久化批准往返：

```bash
pnpm test:live:crestodian-rescue-channel
```

通过 Crestodian 进行的全新无配置设置由以下命令覆盖：

```bash
pnpm test:docker:crestodian-first-run
```

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Doctor](/zh-CN/cli/doctor)
- [TUI](/zh-CN/cli/tui)
- [沙箱](/zh-CN/cli/sandbox)
- [安全](/zh-CN/cli/security)

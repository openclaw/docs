---
read_when:
    - 你在不指定任何命令的情况下运行 openclaw，并想了解 Crestodian
    - 你需要一种在无配置情况下也安全的方式来检查或修复 OpenClaw
    - 你正在设计或启用消息渠道救援模式
summary: Crestodian 的 CLI 参考和安全模型，一个无配置安全型设置和修复辅助工具
title: Crestodian
x-i18n:
    generated_at: "2026-05-10T19:27:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9124629ed8d4df00b8d4bee683bae3d336b7fadfa5a4fc8d84fb5e51be540fb
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian 是 OpenClaw 的本地设置、修复和配置助手。它被设计为在正常智能体路径损坏时仍可访问。

不带命令运行 `openclaw` 会在交互式终端中启动 Crestodian。运行 `openclaw crestodian` 会显式启动同一个助手。

## Crestodian 显示什么

启动时，交互式 Crestodian 会打开与 `openclaw tui` 相同的 TUI shell，并使用 Crestodian 聊天后端。聊天日志会以简短问候开头：

- 何时启动 Crestodian
- Crestodian 实际使用的模型或确定性规划器路径
- 配置有效性和默认智能体
- 首次启动探测中的 Gateway 网关可达性
- Crestodian 可以执行的下一个调试操作

它不会为了启动而转储密钥或加载插件 CLI 命令。TUI 仍提供正常的页眉、聊天日志、状态行、页脚、自动补全和编辑器控件。

使用 `status` 查看详细清单，其中包含配置路径、文档/源码路径、本地 CLI 探测、API key 是否存在、智能体、模型和 Gateway 网关详情。

Crestodian 使用与常规智能体相同的 OpenClaw 参考发现机制。在 Git checkout 中，它会指向本地 `docs/` 和本地源码树。在 npm 包安装中，它使用随包提供的文档，并链接到 [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)，同时明确提示在文档不足时查看源码。

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
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
plugin uninstall openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## 安全启动

Crestodian 的启动路径刻意保持很小。它可以在以下情况下运行：

- `openclaw.json` 缺失
- `openclaw.json` 无效
- Gateway 网关不可用
- 插件命令注册不可用
- 尚未配置任何智能体

`openclaw --help` 和 `openclaw --version` 仍使用正常的快速路径。非交互式 `openclaw` 会以一条简短消息退出，而不是打印根帮助，因为无命令产品是 Crestodian。

## 操作和批准

Crestodian 使用类型化操作，而不是临时编辑配置。

只读操作可以立即运行：

- 显示概览
- 列出智能体
- 列出已安装插件
- 搜索 ClawHub 插件
- 显示模型/后端状态
- 运行状态或健康检查
- 检查 Gateway 网关可达性
- 运行不带交互式修复的 Doctor
- 验证配置
- 显示审计日志路径

持久化操作在交互模式中需要对话式批准，除非你为直接命令传入 `--yes`：

- 写入配置
- 运行 `config set`
- 通过 `config set-ref` 设置受支持的 SecretRef 值
- 运行设置/新手引导 bootstrap
- 更改默认模型
- 启动、停止或重启 Gateway 网关
- 创建智能体
- 从 ClawHub 或 npm 安装插件
- 卸载插件
- 运行会重写配置或状态的 Doctor 修复

已应用的写入会记录在：

```text
~/.openclaw/audit/crestodian.jsonl
```

发现不会被审计。只会记录已应用的操作和写入。

`openclaw onboard --modern` 会将 Crestodian 作为现代新手引导预览启动。普通 `openclaw onboard` 仍运行经典新手引导。

## 设置 bootstrap

`setup` 是聊天优先的新手引导 bootstrap。它只通过类型化配置操作写入，并会先请求批准。

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

当没有配置模型时，setup 会按以下顺序选择第一个可用后端，并告诉你它选择了什么：

- 现有显式模型，如果已配置
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

如果都不可用，setup 仍会写入默认工作区，并保持模型未设置。安装或登录 Codex/Claude Code，或暴露 `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`，然后再次运行 setup。

## 模型辅助规划器

Crestodian 始终以确定性模式启动。对于确定性解析器不理解的模糊命令，本地 Crestodian 可以通过 OpenClaw 的正常运行时路径进行一次有界规划器轮次。它会先使用已配置的 OpenClaw 模型。如果尚无可用的已配置模型，它可以回退到机器上已存在的本地运行时：

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex app-server harness: `openai/gpt-5.5`
- Codex CLI: `codex-cli/gpt-5.5`

模型辅助规划器不能直接修改配置。它必须将请求转换为 Crestodian 的某个类型化命令，然后适用正常的批准和审计规则。Crestodian 会在运行任何内容前打印它使用的模型和解释出的命令。无配置回退规划器轮次是临时的，在运行时支持时会禁用工具，并使用临时工作区/会话。

消息渠道救援模式不使用模型辅助规划器。远程救援保持确定性，因此损坏或被入侵的正常智能体路径不能被用作配置编辑器。

## 切换到智能体

使用自然语言选择器离开 Crestodian 并打开正常 TUI：

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`、`openclaw chat` 和 `openclaw terminal` 仍会直接打开正常智能体 TUI。它们不会启动 Crestodian。

切换到正常 TUI 后，使用 `/crestodian` 返回 Crestodian。你可以包含一个后续请求：

```text
/crestodian
/crestodian restart gateway
```

TUI 内的智能体切换会留下一个面包屑，提示 `/crestodian` 可用。

## 消息救援模式

消息救援模式是 Crestodian 的消息渠道入口点。它用于你的正常智能体已失效，但 WhatsApp 等受信任渠道仍能接收命令的情况。

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

也可以从本地提示或救援模式排队创建智能体：

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

远程救援模式是管理表面。它必须被视为远程配置修复，而不是正常聊天。

远程救援的安全契约：

- 当沙箱隔离处于活动状态时禁用。如果智能体/会话处于沙箱隔离状态，Crestodian 必须拒绝远程救援，并说明需要本地 CLI 修复。
- 默认有效状态为 `auto`：仅在受信任的 YOLO 操作中允许远程救援，此时运行时已经拥有未沙箱隔离的本地权限。
- 要求明确的所有者身份。救援不得接受通配符发送者规则、开放群组策略、未经身份验证的 webhook 或匿名渠道。
- 默认仅限所有者私信。群组/渠道救援需要显式选择加入。
- 插件搜索和列表是只读的。插件安装默认仅限本地，因为它会下载可执行代码。当救援策略允许持久化写入时，插件卸载可以作为已批准的修复操作允许。
- 远程救援不能打开本地 TUI，也不能切换到交互式智能体会话。使用本地 `openclaw` 进行智能体交接。
- 即使在救援模式中，持久化写入仍需要批准。
- 审计每个已应用的救援操作。消息渠道救援会记录渠道、账户、发送者和源地址元数据。修改配置的操作还会记录前后的配置哈希。
- 永远不要回显密钥。SecretRef 检查应报告可用性，而不是值。
- 如果 Gateway 网关在线，优先使用 Gateway 网关类型化操作。如果 Gateway 网关已失效，则只使用不依赖正常 Agent loop 的最小本地修复表面。

配置形状：

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

- `"auto"`：默认。仅当有效运行时为 YOLO 且沙箱隔离关闭时允许。
- `false`：从不允许消息渠道救援。
- `true`：当所有者/渠道检查通过时显式允许救援。这仍不得绕过沙箱隔离拒绝。

默认 `"auto"` YOLO 姿态是：

- sandbox 模式解析为 `off`
- `tools.exec.security` 解析为 `full`
- `tools.exec.ask` 解析为 `off`

远程救援由 Docker lane 覆盖：

```bash
pnpm test:docker:crestodian-rescue
```

无配置本地规划器回退由以下命令覆盖：

```bash
pnpm test:docker:crestodian-planner
```

一个选择加入的实时渠道命令表面烟测会检查 `/crestodian status`，以及通过救援处理程序的一次持久化批准往返：

```bash
pnpm test:live:crestodian-rescue-channel
```

通过 Crestodian 进行全新无配置设置由以下命令覆盖：

```bash
pnpm test:docker:crestodian-first-run
```

该 lane 从空状态目录开始，将裸 `openclaw` 路由到 Crestodian，设置默认模型，创建一个额外智能体，通过插件启用和 token SecretRef 配置 Discord，验证配置，并检查审计日志。QA Lab 也有一个基于仓库的场景，覆盖相同的 Ring 0 流程：

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## 相关

- [CLI 参考](/zh-CN/cli)
- [Doctor](/zh-CN/cli/doctor)
- [TUI](/zh-CN/cli/tui)
- [沙箱](/zh-CN/cli/sandbox)
- [安全](/zh-CN/cli/security)

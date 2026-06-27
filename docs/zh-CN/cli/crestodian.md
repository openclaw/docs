---
read_when:
    - 你在设置后不带任何命令运行 openclaw，并想了解 Crestodian
    - 你需要一种配置无关且安全的方式来检查或修复 OpenClaw
    - 你正在设计或启用消息渠道救援模式
summary: Crestodian 的 CLI 参考和安全模型：一个无配置安全的设置与修复辅助工具
title: Crestodian
x-i18n:
    generated_at: "2026-06-27T01:36:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0933a05ee02ff54e99c2909aa3e0e67fd6ed3b38b541d5b96af07defdf23b80d
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian 是 OpenClaw 的本地设置、修复和配置助手。它的设计目标是在正常智能体路径损坏时仍可访问。

当活动配置文件缺失或没有作者写入的设置（为空或仅包含元数据）时，运行不带命令的 `openclaw` 会先启动经典新手引导。配置文件已有作者写入的设置后，运行不带命令的 `openclaw` 会在交互式终端中启动 Crestodian。运行 `openclaw crestodian` 会显式启动同一个助手。

## Crestodian 显示什么

启动时，交互式 Crestodian 会打开 `openclaw tui` 使用的同一个 TUI shell，并使用 Crestodian 聊天后端。聊天日志以简短问候开始：

- 何时启动 Crestodian
- Crestodian 实际使用的模型或确定性规划器路径
- 配置有效性和默认智能体
- 首次启动探测中的 Gateway 网关可达性
- Crestodian 可以执行的下一个调试操作

它不会为了启动而转储密钥或加载插件 CLI 命令。TUI 仍提供正常的页眉、聊天日志、状态行、页脚、自动补全和编辑器控件。

使用 `status` 查看详细清单，其中包含配置路径、文档/源码路径、本地 CLI 探测、API key 是否存在、智能体、模型和 Gateway 网关详情。

Crestodian 使用与常规智能体相同的 OpenClaw 参考发现。在 Git checkout 中，它会指向本地 `docs/` 和本地源码树。在 npm package 安装中，它使用内置 package 文档并链接到 [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)，并明确提示在文档不足时查看源码。

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

在 Crestodian TUI 内：

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

Crestodian 的启动路径有意保持很小。它可以在以下情况下运行：

- `openclaw.json` 缺失
- `openclaw.json` 无效
- Gateway 网关已关闭
- 插件命令注册不可用
- 尚未配置任何智能体

`openclaw --help` 和 `openclaw --version` 仍使用正常快速路径。非交互式裸 `openclaw` 会以简短消息退出，而不是打印根帮助。在全新安装中，该消息指向非交互式新手引导；设置完成后，它指向一次性 Crestodian 命令。

## 操作和审批

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

持久化操作在交互模式下需要对话式审批，除非你为直接命令传入 `--yes`：

- 写入配置
- 运行 `config set`
- 通过 `config set-ref` 设置受支持的 SecretRef 值
- 运行设置/新手引导引导流程
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

发现不会审计。只会记录已应用的操作和写入。

`openclaw onboard --modern` 会将 Crestodian 作为现代新手引导预览启动。普通 `openclaw onboard` 仍运行经典新手引导。

## 设置引导

`setup` 是聊天优先的新手引导引导流程。它只通过类型化配置操作写入，并会先请求审批。

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

当未配置模型时，设置会按以下顺序选择第一个可用后端，并告诉你它选择了什么：

- 已有显式模型（如果已配置）
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-8`
- Claude Code CLI -> `claude-cli/claude-opus-4-8`
- Codex -> 通过 Codex app-server harness 使用 `openai/gpt-5.5`

如果都不可用，设置仍会写入默认工作区，并让模型保持未设置。安装或登录 Codex/Claude Code，或暴露 `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`，然后再次运行设置。

## 模型辅助规划器

Crestodian 始终以确定性模式启动。对于确定性解析器无法理解的模糊命令，本地 Crestodian 可以通过 OpenClaw 的正常运行时路径执行一次有界规划器轮次。它会先使用已配置的 OpenClaw 模型。如果尚无可用的已配置模型，它可以回退到机器上已有的本地运行时：

- Claude Code CLI：`claude-cli/claude-opus-4-8`
- Codex app-server harness：`openai/gpt-5.5`

模型辅助规划器不能直接修改配置。它必须将请求转换为 Crestodian 的某个类型化命令，然后应用正常审批和审计规则。Crestodian 会在运行任何操作前打印它使用的模型以及解释出的命令。无配置回退规划器轮次是临时的，在运行时支持时会禁用工具，并使用临时工作区/会话。

消息渠道救援模式不使用模型辅助规划器。远程救援保持确定性，这样损坏或被攻陷的正常智能体路径就不能被用作配置编辑器。

## 切换到智能体

使用自然语言选择器离开 Crestodian 并打开正常 TUI：

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`、`openclaw chat` 和 `openclaw terminal` 仍会直接打开正常智能体 TUI。它们不会启动 Crestodian。

切换到正常 TUI 后，使用 `/crestodian` 返回 Crestodian。你可以包含后续请求：

```text
/crestodian
/crestodian restart gateway
```

TUI 内的智能体切换会留下一个面包屑，提示 `/crestodian` 可用。

## 消息救援模式

消息救援模式是 Crestodian 的消息渠道入口点。它用于正常智能体已失效，但 WhatsApp 等受信任渠道仍能接收命令的情况。

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

也可以从本地提示符或救援模式排队创建智能体：

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

远程救援模式是管理员界面。它必须被视为远程配置修复，而不是普通聊天。

远程救援的安全契约：

- 在沙箱隔离处于活动状态时禁用。如果智能体/会话是沙箱隔离的，Crestodian 必须拒绝远程救援，并说明需要本地 CLI 修复。
- 默认有效状态为 `auto`：仅在受信任的 YOLO 操作中允许远程救援，此时运行时已经拥有未沙箱隔离的本地权限。
- 需要显式所有者身份。救援不得接受通配符发送者规则、开放群组策略、未认证 webhook 或匿名渠道。
- 默认仅所有者私信。群组/渠道救援需要显式选择启用。
- 插件搜索和列表是只读的。插件安装默认仅限本地，因为它会下载可执行代码。当救援策略允许持久化写入时，插件卸载可作为已审批修复操作允许。
- 远程救援不能打开本地 TUI 或切换到交互式智能体会话。使用本地 `openclaw` 进行智能体移交。
- 持久化写入仍需要审批，即使在救援模式中也是如此。
- 审计每个已应用的救援操作。消息渠道救援会记录渠道、账号、发送者和源地址元数据。修改配置的操作还会记录修改前后的配置哈希。
- 永不回显密钥。SecretRef 检查应报告可用性，而不是值。
- 如果 Gateway 网关存活，优先使用 Gateway 网关类型化操作。如果 Gateway 网关已死，仅使用不依赖正常智能体循环的最小本地修复界面。

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

- `"auto"`：默认。仅在有效运行时为 YOLO 且沙箱隔离关闭时允许。
- `false`：绝不允许消息渠道救援。
- `true`：当所有者/渠道检查通过时显式允许救援。这仍不得绕过沙箱隔离拒绝。

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

一个选择启用的实时渠道命令界面 smoke 会检查 `/crestodian status`，并通过救援处理器检查一次持久化审批往返：

```bash
pnpm test:live:crestodian-rescue-channel
```

通过显式 Crestodian 命令进行的无配置设置由以下命令覆盖：

```bash
pnpm test:docker:crestodian-first-run
```

该通道从空状态目录开始，验证现代新手引导 Crestodian 入口点，设置默认模型，创建额外智能体，通过插件启用加 token SecretRef 配置 Discord，验证配置，并检查审计日志。QA Lab 也为同一个 Ring 0 流程提供了一个由仓库支持的场景：

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## 相关

- [CLI 参考](/zh-CN/cli)
- [Doctor](/zh-CN/cli/doctor)
- [TUI](/zh-CN/cli/tui)
- [沙箱](/zh-CN/cli/sandbox)
- [安全](/zh-CN/cli/security)

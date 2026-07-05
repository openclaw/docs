---
read_when:
    - 你在设置后不带命令运行 openclaw，并想了解 Crestodian
    - 你需要一种无需配置也安全的方式来检查或修复 OpenClaw
    - 你正在设计或启用消息渠道救援模式
summary: Crestodian 的 CLI 参考和安全模型，这是一个无配置安全的设置与修复辅助工具
title: Crestodian
x-i18n:
    generated_at: "2026-07-05T11:09:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: abe91886e3faeebc20203639cd811a515509e252e29b11fb7d710e9924cb556f
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian 是 OpenClaw 的本地设置、修复和配置助手。当正常智能体路径损坏时，它仍然可用：它可以在 `openclaw.json` 缺失或无效、Gateway 网关宕机、插件命令注册不可用，或尚未配置任何智能体时运行。

## 启动时机

不带子命令运行 `openclaw` 时，会根据配置状态进行路由：

- 配置缺失，或存在但没有用户编写的设置（为空，或仅包含 `$schema`/`meta` 键）：启动经典新手引导。
- 配置存在但验证失败：启动 Crestodian。
- 配置存在且有效：打开正常的智能体 TUI（连接到可访问的已配置 Gateway 网关，若没有可访问的 Gateway 网关则在本地运行）。在 TUI 中使用 `/crestodian`，或直接运行 `openclaw crestodian`，即可进入 Crestodian。

运行 `openclaw crestodian` 始终会显式启动 Crestodian，不受配置状态影响。`openclaw --help` 和 `openclaw --version` 保持正常的快速路径。

非交互式裸 `openclaw`（无 TTY）会退出并显示一条简短消息，而不是打印根帮助：在全新安装时指向非交互式新手引导；配置无效时指向 `openclaw crestodian --message "status"`；配置有效时指向 `openclaw agent --local ...`。

`openclaw onboard --modern` 会将 Crestodian 作为现代新手引导预览启动。普通的 `openclaw onboard` 保持经典新手引导。

## Crestodian 显示内容

交互式 Crestodian 会打开与 `openclaw tui` 相同的 TUI shell，并使用 Crestodian 聊天后端。启动问候会涵盖：

- 配置有效性和默认智能体
- Crestodian 正在使用的模型或确定性规划器路径
- 首次启动探测得到的 Gateway 网关可达性
- 下一步推荐的调试操作

它不会转储密钥，也不会仅为了启动而加载插件 CLI 命令。

使用 `status` 查看详细清单：配置路径、文档/源代码路径、本地 CLI 探测、API key 是否存在、智能体、模型和 Gateway 网关详情。

Crestodian 使用与常规智能体相同的参考资料发现机制：在 Git checkout 中，它指向本地 `docs/` 和源代码树；在 npm 安装中，它使用内置文档并链接到 [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)，并提示当文档不足时检查源代码。

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

## 操作和审批

Crestodian 使用类型化操作，而不是临时编辑配置。

只读，立即运行：显示概览、列出智能体、列出已安装插件、搜索 ClawHub 插件、显示模型/后端状态、运行状态/健康检查、检查 Gateway 网关可达性、运行不带交互式修复的 Doctor、验证配置、显示审计日志路径。

持久性操作，需要对话式审批（或对直接命令使用 `--yes`）：写入配置、`config set`、`config set-ref`、设置/新手引导引导启动、更改默认模型、启动/停止/重启 Gateway 网关、创建智能体、安装或卸载插件、运行会重写配置或状态的 Doctor 修复。

已应用的写入会记录到 `~/.openclaw/audit/crestodian.jsonl`。发现操作不会被审计；只有已应用的操作和写入会被审计。

当宿主支持遮蔽输入时，渠道设置可以作为托管对话运行。本地 Crestodian TUI 不接受敏感的向导答案；它会改为引导你使用 `openclaw channels add --channel <channel>`，该命令的交互式提示会遮蔽凭证。

## 设置引导启动

`setup` 是聊天优先的新手引导引导启动。它只通过类型化配置操作写入，并且会先请求审批。

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

当未配置模型时，setup 会按以下顺序选择第一个可用后端，并告诉你它选择了什么：

1. 现有显式模型（如果已经配置）。
2. `OPENAI_API_KEY` -> `openai/gpt-5.5`
3. `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-8`
4. Claude Code CLI -> `claude-cli/claude-opus-4-8`
5. Codex -> 通过 Codex app-server harness 使用 `openai/gpt-5.5`

如果都不可用，setup 仍会写入默认工作区，并保持模型未设置。安装或登录 Codex/Claude Code，或暴露 `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`，然后再次运行 setup。

## 模型辅助规划器

交互式 Crestodian 以 AI 优先。精确键入的命令会立即且确定性地运行。其他每条消息都会通过与常规 OpenClaw 智能体相同的嵌入式 Agent loop 运行，但限制为一个 ring-zero `crestodian` 工具，该工具封装了类型化操作：读取操作可自由运行，变更需要你针对该确切操作进行对话式确认，并且每个已应用的写入都会被审计并重新验证。智能体会话会持久化，因此 custodian 拥有真正的多轮记忆。它首先使用已配置的 OpenClaw 模型；如果没有可用模型，则回退到机器上已有的本地运行时：

- Claude Code CLI：`claude-cli/claude-opus-4-8`（Agent loop；ring-zero 工具通过 MCP 提供，见下方信任模型）
- Codex app-server harness：`openai/gpt-5.5`（Agent loop，强制执行单工具允许列表）

当 Agent loop 不可用时，Crestodian 会降级为有界的单轮规划器；如果没有任何模型，则降级为确定性的类型化命令。规划器不能直接变更配置；它必须将请求翻译为 Crestodian 的某个类型化命令，并应用正常的审批/审计规则。Crestodian 会在运行任何内容前打印它使用的模型和解释得到的命令。回退规划器轮次是临时的，在运行时支持时禁用工具，并使用临时工作区/会话。

消息渠道救援模式永远不会使用模型辅助规划器。远程救援保持确定性，因此损坏或被攻陷的正常智能体路径不能被用作配置编辑器。

### CLI harness 信任模型

嵌入式运行时和 Codex app-server harness 会直接强制执行 ring-zero 限制：运行携带一个仅包含 `crestodian` 工具的工具允许列表。CLI harness（Claude Code、Gemini CLI）无法强制执行 OpenClaw 工具允许列表 — CLI 拥有自己的原生工具和自己的权限策略，因此如果被要求限制某个工具，OpenClaw 会失败关闭。对于 CLI-harness 模型，Crestodian 会改为：

- 注入一个专用 MCP 服务器，只提供 `crestodian` 工具，并在本次运行中替换 OpenClaw 的正常 MCP 工具表面（对于 Claude Code，生成的配置会通过 `--strict-mcp-config` 应用，因此不会加载其他 MCP 服务器），
- 将每个配置变更保留在该工具的审批和审计契约内 — 读取可自由运行，写入需要你的对话式确认，并且每个已应用写入都会被审计并重新验证，
- 将原生工具（文件读取、shell）留给 harness。它们遵循与这台机器上正常 OpenClaw 智能体运行相同的权限姿态：在 OpenClaw 的默认 exec 设置下，Claude Code 以绕过权限的方式运行；受限制的 `tools.exec` 配置会回退到 CLI 自己的权限策略。

只有 Crestodian 会话会获得 crestodian MCP 服务器；正常智能体运行永远看不到此工具。将 CLI-harness 模型上的 Crestodian 会话视为同一主机上的正常本地智能体运行：ring-zero 工具为配置修复添加了一条经过审计、带审批门控的路径，但它不会阻止 harness 的原生工具直接触碰文件。Codex app-server 回退和 API-key 模型会强制执行严格的单工具循环；当你想要强限制时，优先使用它们。

## 切换到智能体

使用自然语言选择器离开 Crestodian 并打开正常 TUI：

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`、`openclaw chat` 和 `openclaw terminal` 会直接打开正常智能体 TUI；它们不会启动 Crestodian。切换到正常 TUI 后，`/crestodian` 会返回 Crestodian，也可以附带后续请求：

```text
/crestodian
/crestodian restart gateway
```

## 消息救援模式

消息救援模式是 Crestodian 的消息渠道入口点：当你的正常智能体已失效，但可信渠道（例如 WhatsApp）仍能接收命令时使用它。

支持的命令：`/crestodian <request>`。

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

智能体创建也可以在本地或通过救援排队：

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

远程救援是管理表面，必须像远程配置修复一样对待，而不是普通聊天。

远程救援的安全契约：

- 当智能体/会话启用沙箱隔离时禁用；Crestodian 会拒绝远程救援并指向本地 CLI 修复。
- 默认有效状态为 `auto`：仅在可信 YOLO 操作中允许远程救援，此时运行时已经拥有未沙箱隔离的本地权限（`tools.exec.security` 解析为 `full` 且 `tools.exec.ask` 解析为 `off`，沙箱模式为 `off`）。
- 需要显式的所有者身份；不允许通配符发送者规则、开放群组策略、未认证 webhooks 或匿名渠道。
- 默认仅限所有者私信；群组/频道救援需要显式选择启用。
- 插件搜索和列表是只读的。插件安装始终仅限本地（在救援中被阻止，即使其他方面已启用），因为它会下载可执行代码。插件卸载可作为持久性救援操作被审批。
- 远程救援无法打开本地 TUI，也无法切换到交互式智能体会话；使用本地 `openclaw` 进行智能体交接。
- 即使在救援模式下，持久性写入仍需要审批。
- 每个已应用的救援操作都会被审计。消息渠道救援会记录渠道、账号、发送者和源地址元数据；会变更配置的操作还会记录变更前后的配置哈希。
- 绝不回显密钥。SecretRef 检查报告的是可用性，而不是值。
- 如果 Gateway 网关处于存活状态，救援优先使用 Gateway 网关类型化操作；如果它已宕机，救援只使用不依赖正常 Agent loop 的最小本地修复表面。

配置形状：

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
      "pendingTtlMinutes": 15,
    },
  },
}
```

- `enabled`：`"auto"`（默认）仅当有效运行时为 YOLO 且沙箱隔离关闭时允许救援；`false` 永不允许消息渠道救援；`true` 在所有者/渠道检查通过时显式允许救援（仍受沙箱隔离拒绝约束）。
- `ownerDmOnly`：将救援限制为所有者直接消息。默认值为 `true`。
- `pendingTtlMinutes`：待处理救援写入在过期前为 `/crestodian yes` 审批保持打开的时长。默认值为 `15`。

远程救援由 Docker lane 覆盖：

```bash
pnpm test:docker:crestodian-rescue
```

无配置本地规划器回退由以下命令覆盖：

```bash
pnpm test:docker:crestodian-planner
```

一个可选启用的实时渠道命令界面冒烟检查会通过救援处理程序检查 `/crestodian status`，并完成一次持久审批往返：

```bash
pnpm test:live:crestodian-rescue-channel
```

通过显式 Crestodian 命令进行的无配置设置由以下命令覆盖：

```bash
pnpm test:docker:crestodian-first-run
```

该测试通道从空状态目录开始，验证现代新手引导 Crestodian 入口点，设置默认模型，创建额外的智能体，通过插件启用和 token SecretRef 配置 Discord，验证配置，并检查审计日志。QA Lab 为同一个 Ring 0 流程提供了一个由仓库支持的场景：

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Doctor](/zh-CN/cli/doctor)
- [TUI](/zh-CN/cli/tui)
- [沙箱](/zh-CN/cli/sandbox)
- [安全](/zh-CN/cli/security)

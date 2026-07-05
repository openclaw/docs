---
read_when:
    - 你在设置后不带命令运行 openclaw，并想了解 Crestodian
    - 你需要一种在无配置情况下也安全的方式来检查或修复 OpenClaw
    - 你正在设计或启用消息渠道救援模式
summary: Crestodian 的 CLI 参考和安全模型，这是一个无需配置且安全的设置和修复助手
title: Crestodian
x-i18n:
    generated_at: "2026-07-05T17:41:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: da05f022b0fbff985b89a96e29ef5e987e97e017a5e40d50dfe0daf7eb03bf4f
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian 是 OpenClaw 的本地设置、修复和配置助手。当正常智能体路径损坏时，它仍可访问：在 `openclaw.json` 缺失或无效、Gateway 网关关闭、插件命令注册不可用，或尚未配置智能体时，它都可以运行。

## 启动时机

不带子命令运行 `openclaw` 会根据配置状态路由：

- 配置缺失，或存在但没有已编写的设置（空配置，或只有 `$schema`/`meta` 键）：启动经典新手引导。
- 配置存在但验证失败：启动 Crestodian。
- 配置存在且有效：打开正常智能体 TUI（连接到可访问的已配置 Gateway 网关；如果没有可访问的 Gateway 网关，则在本地运行）。在 TUI 中使用 `/crestodian`，或直接运行 `openclaw crestodian`，即可进入 Crestodian。

运行 `openclaw crestodian` 始终会显式启动 Crestodian，不受配置状态影响。`openclaw --help` 和 `openclaw --version` 保持正常的快速路径。

非交互式裸 `openclaw`（无 TTY）会退出并显示简短消息，而不是打印根帮助：在全新安装时指向非交互式新手引导；配置无效时指向 `openclaw crestodian --message "status"`；配置有效时指向 `openclaw agent --local ...`。

`openclaw onboard --modern` 会启动 Crestodian 作为现代新手引导预览。普通 `openclaw onboard` 保持经典新手引导。

## Crestodian 显示什么

交互式 Crestodian 会打开与 `openclaw tui` 相同的 TUI 外壳，并使用 Crestodian 聊天后端。启动问候会涵盖：

- 配置有效性和默认智能体
- Crestodian 正在使用的模型或确定性规划器路径
- 首次启动探测得到的 Gateway 网关可达性
- 下一步推荐的调试操作

它不会转储密钥，也不会仅为了启动而加载插件 CLI 命令。

使用 `status` 查看详细清单：配置路径、文档/源路径、本地 CLI 探测、API key 是否存在、智能体、模型和 Gateway 网关详情。

Crestodian 使用与常规智能体相同的参考发现机制：在 Git checkout 中，它指向本地 `docs/` 和源代码树；在 npm 安装中，它使用内置文档并链接到 [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)，并提示在文档不足时检查源代码。

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

## 操作与审批

Crestodian 使用类型化操作，而不是临时编辑配置。

只读，立即运行：显示概览、列出智能体、列出已安装插件、搜索 ClawHub 插件、显示模型/后端状态、运行状态/健康检查、检查 Gateway 网关可达性、运行不带交互式修复的 Doctor、验证配置、显示审计日志路径。

持久化，需要对话式审批（或对直接命令使用 `--yes`）：写入配置、`config set`、`config set-ref`、设置/新手引导 bootstrap、更改默认模型、启动/停止/重启 Gateway 网关、创建智能体、安装或卸载插件、运行会重写配置或状态的 Doctor 修复。

已应用的写入会记录到 `~/.openclaw/audit/crestodian.jsonl`。发现过程不会审计；只审计已应用的操作和写入。

当宿主支持掩码输入时，渠道设置可以作为托管对话运行。本地 Crestodian TUI 不接受敏感的向导答案；它会改为引导你使用 `openclaw channels add --channel <channel>`，该命令的交互式提示会对凭证做掩码处理。

## 设置 bootstrap

`setup` 是聊天优先的新手引导 bootstrap。它只通过类型化配置操作写入，并会先请求审批。

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

未配置模型时，setup 会按以下顺序选择第一个可用后端，并告诉你它选择了什么：

1. 现有显式模型，如果已经配置。
2. `OPENAI_API_KEY` -> `openai/gpt-5.5`
3. `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-8`
4. Claude Code CLI -> `claude-cli/claude-opus-4-8`
5. Codex -> 通过 Codex app-server harness 使用 `openai/gpt-5.5`
6. Gemini CLI -> `google-gemini-cli/gemini-3.1-pro-preview`

如果都不可用，setup 仍会写入默认工作区，并让模型保持未设置。安装或登录 Codex/Claude Code/Gemini CLI，或暴露 `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`，然后再次运行 setup。

macOS 应用通过 `crestodian.setup.detect` 和 `crestodian.setup.activate` Gateway 网关方法驱动同一套阶梯：detect 会列出它找到的每个可复用后端；activate 会对一个候选执行实时测试（一次真实的 “reply with OK” completion），并且只在测试通过后持久化模型、工作区和 Gateway 网关默认值。失败的候选永远不会更改配置；应用会自动沿阶梯向下尝试，最后提供手动 API key 步骤（Anthropic、OpenAI 或 Google），该步骤同样会在保存前通过相同方式验证。

## 模型辅助规划器

交互式 Crestodian 以 AI 优先。精确的类型化命令会立即且确定性地运行。其他每条消息都会通过与常规 OpenClaw 智能体相同的嵌入式智能体循环运行，但限制为一个 ring-zero `crestodian` 工具，该工具封装类型化操作：读取操作可自由运行，变更需要你对该确切操作进行对话式确认，并且每次已应用写入都会被审计并重新验证。智能体会话会持久化，因此 custodian 具备真实的多轮记忆。它会优先使用已配置的 OpenClaw 模型；没有可用模型时，会回退到机器上已存在的本地运行时：

- Claude Code CLI：`claude-cli/claude-opus-4-8`（智能体循环；ring-zero 工具通过 MCP 提供，参见下面的信任模型）
- Codex app-server harness：`openai/gpt-5.5`（带强制单工具 allow-list 的智能体循环）

当智能体循环不可用时，Crestodian 会降级为有界的单轮规划器；如果没有任何模型，则降级为确定性的类型化命令。规划器不能直接变更配置；它必须将请求转换为 Crestodian 的某个类型化命令，并适用正常的审批/审计规则。Crestodian 会在运行任何内容之前打印它使用的模型和解释出的命令。回退规划器轮次是临时的，在运行时支持时会禁用工具，并使用临时工作区/会话。

消息渠道救援模式永远不会使用模型辅助规划器。远程救援保持确定性，以免损坏或被攻陷的正常智能体路径被用作配置编辑器。

### CLI harness 信任模型

嵌入式运行时和 Codex app-server harness 会直接强制 ring-zero 限制：运行携带的工具 allow-list 只有 `crestodian` 工具。CLI harness（Claude Code、Gemini CLI）无法强制 OpenClaw 工具 allow-list，因为 CLI 拥有其原生工具和自己的权限策略，所以如果要求 OpenClaw 限制它，OpenClaw 会失败关闭。对于 CLI-harness 模型，Crestodian 改为：

- 注入专用 MCP 服务器，只提供 `crestodian` 工具，并在该次运行中替换 OpenClaw 的正常 MCP 工具表面（对于 Claude Code，生成的配置会通过 `--strict-mcp-config` 应用，因此不会加载其他 MCP 服务器），
- 将每次配置变更保留在该工具的审批和审计契约内——读取可自由运行，写入需要你的对话式确认，并且每次已应用写入都会被审计并重新验证，
- 将原生工具（文件读取、shell）留给 harness。它们遵循这台机器上正常 OpenClaw 智能体运行的相同权限姿态：在 OpenClaw 默认 exec 设置下，Claude Code 会以绕过权限的方式运行；受限的 `tools.exec` 配置会回退到 CLI 自己的权限策略。

只有 Crestodian 会话会获得 crestodian MCP 服务器；正常智能体运行永远看不到此工具。将 CLI-harness 模型上的 Crestodian 会话视为同一主机上的正常本地智能体运行：ring-zero 工具为配置修复增加了一条经过审计、受审批门控的路径，但它不会阻止 harness 的原生工具直接触碰文件。Codex app-server 回退和 API key 模型会强制严格的单工具循环；当你需要硬限制时，优先使用这些模型。

## 切换到智能体

使用自然语言选择器离开 Crestodian 并打开正常 TUI：

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`、`openclaw chat` 和 `openclaw terminal` 会直接打开正常智能体 TUI；它们不会启动 Crestodian。切换到正常 TUI 后，`/crestodian` 会返回 Crestodian，并可选择携带后续请求：

```text
/crestodian
/crestodian restart gateway
```

## 消息救援模式

消息救援模式是 Crestodian 的消息渠道入口点：当你的正常智能体已失效，但受信任渠道（例如 WhatsApp）仍能接收命令时使用它。

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

远程救援是管理表面，必须像远程配置修复一样对待，而不是正常聊天。

远程救援的安全契约：

- 当智能体/会话启用沙箱隔离时禁用；Crestodian 会拒绝远程救援并指向本地 CLI 修复。
- 默认有效状态为 `auto`：仅在受信任的 YOLO 操作中允许远程救援，此时运行时已经具备未沙箱隔离的本地权限（`tools.exec.security` 解析为 `full`，`tools.exec.ask` 解析为 `off`，且沙箱模式为 `off`）。
- 需要显式所有者身份；不允许通配符发送者规则、开放群组策略、未经认证的 Webhooks 或匿名渠道。
- 默认仅允许所有者私信；群组/渠道救援需要显式选择加入。
- 插件搜索和列表是只读的。插件安装始终仅限本地（在救援中被阻止，即使其他情况下已启用），因为它会下载可执行代码。插件卸载可以作为持久化救援操作获批。
- 远程救援不能打开本地 TUI，也不能切换到交互式智能体会话；使用本地 `openclaw` 进行智能体交接。
- 持久化写入即使在救援模式下仍需要审批。
- 每个已应用的救援操作都会被审计。消息渠道救援会记录渠道、账号、发送者和源地址元数据；变更配置的操作还会记录变更前后的配置哈希。
- 密钥永远不会回显。SecretRef 检查只报告可用性，不报告值。
- 如果 Gateway 网关存活，救援会优先使用 Gateway 网关类型化操作；如果它已失效，救援只使用不依赖正常智能体循环的最小本地修复表面。

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

- `enabled`：`"auto"`（默认）仅在有效运行时为 YOLO 且沙箱隔离关闭时允许救援；`false` 永不允许消息渠道救援；`true` 在所有者/渠道检查通过时显式允许救援（仍受沙箱隔离拒绝限制）。
- `ownerDmOnly`：将救援限制为所有者私信。默认值为 `true`。
- `pendingTtlMinutes`：待处理救援写入在过期前，为 `/crestodian yes` 审批保持开放的时长。默认值为 `15`。

远程救援由 Docker 通道覆盖：

```bash
pnpm test:docker:crestodian-rescue
```

无配置本地规划器 fallback 由以下命令覆盖：

```bash
pnpm test:docker:crestodian-planner
```

一个可选启用的实时渠道命令表面烟雾测试会检查 `/crestodian status`，并通过救援处理程序执行一次持久审批往返：

```bash
pnpm test:live:crestodian-rescue-channel
```

通过显式 Crestodian 命令进行的无配置设置由以下命令覆盖：

```bash
pnpm test:docker:crestodian-first-run
```

该通道从空状态目录开始，验证现代 onboard Crestodian 入口点，设置默认模型，创建额外智能体，通过插件启用和令牌 SecretRef 配置 Discord，验证配置，并检查审计日志。QA Lab 为相同的 Ring 0 流程提供了一个由仓库支持的场景：

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## 相关

- [CLI 参考](/zh-CN/cli)
- [Doctor](/zh-CN/cli/doctor)
- [TUI](/zh-CN/cli/tui)
- [沙箱](/zh-CN/cli/sandbox)
- [Security](/zh-CN/cli/security)

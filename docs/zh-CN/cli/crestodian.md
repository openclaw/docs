---
read_when:
    - 你已完成推理设置，并希望 Crestodian 配置其余部分
    - 你需要使用本地设置智能体检查或修复 OpenClaw
    - 你正在设计或启用消息渠道救援模式
summary: 基于推理的 Crestodian 设置和修复助手的 CLI 参考与安全模型
title: Crestodian
x-i18n:
    generated_at: "2026-07-12T14:23:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: af4861a48fb26159cb8e0c29d08ab5c3776283eb5392dcbe08c9a28d01f4abf5
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

对话式 Crestodian 是 OpenClaw 的本地设置、修复和配置智能体。
它仅在实际默认模型完成一次真实轮次后启动。全新安装会先建立推理；
格式错误的配置仍走经典 Doctor 路径。

## 启动时机

运行不带子命令的 `openclaw` 时，会根据配置状态进行路由：

- 配置缺失，或配置存在但没有用户编写的设置（为空，或仅包含 `$schema`/`meta` 键）：启动带实时 AI 验证的引导式新手引导。
- 配置存在但验证失败：启动经典新手引导，报告问题并引导你运行 `openclaw doctor`。
- 配置存在且有效：打开普通智能体 TUI。如果已配置的 Gateway 网关可访问，且其默认智能体有模型，
  则会直接进入该 UI，而不经过新手引导或 Crestodian。之后可在 TUI 中使用 `/crestodian`，或直接运行
  `openclaw crestodian` 来进入 Crestodian。

运行 `openclaw crestodian` 时，会先实时测试已配置的默认模型。轮次通过后启动 Crestodian。交互式测试失败时，会打开引导式推理设置，并在候选项通过后转交给 Crestodian。推理不可用时，单次、JSON 和其他非交互式请求会失败，并提示运行 `openclaw onboard`。`openclaw --help` 和 `openclaw --version` 仍使用其正常的快速路径。

非交互式运行裸 `openclaw`（无 TTY）时，会显示简短消息并退出，而不是打印根级帮助：如果是全新安装或安装无效，它会指向非交互式新手引导；如果配置有效，则会指向 `openclaw agent --local ...`。

`openclaw onboard --modern` 仍是 Crestodian 的兼容别名，但使用相同的推理门控：推理正常时打开聊天；交互式失败时启动引导式推理设置；非交互式失败时退出并显示新手引导说明。`openclaw onboard --classic` 会打开完整的分步向导。

## Crestodian 显示的内容

交互式 Crestodian 会打开与 `openclaw tui` 相同的 TUI 外壳，并使用 Crestodian 聊天后端。启动问候语涵盖：

- 配置有效性和默认智能体
- Crestodian 正在使用的已验证模型
- 首次启动探测得到的 Gateway 网关可达性
- 下一项推荐的调试操作

它不会转储密钥，也不会仅为启动而加载插件 CLI 命令。

使用 `status` 查看详细清单：配置路径、文档/源代码路径、本地 CLI 探测、密钥/令牌是否存在、智能体、模型和 Gateway 网关详情。

Crestodian 使用与普通智能体相同的参考资料发现机制：在 Git 检出中，它会指向本地 `docs/` 和源代码树；在 npm 安装中，它会使用内置文档并链接到 [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)，同时建议在文档不足时检查源代码。

## 示例

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work" --yes
openclaw crestodian --message "set default model openai/gpt-5.6" --yes
openclaw onboard --modern
```

在 Crestodian TUI 中：

```text
status
health
doctor
validate config
setup
setup workspace ~/Projects/work
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
configure model provider
set default model openai/gpt-5.6
channels
channel info slack
connect slack
open channel wizard for slack
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## 操作和审批

Crestodian 使用类型化操作，而不是临时编辑配置。

只读操作会立即运行：显示概览、列出智能体、列出已安装插件、搜索 ClawHub 插件、显示模型/后端状态、运行状态/健康检查、检查 Gateway 网关可达性、运行不含交互式修复的 Doctor、验证配置，以及显示审计日志路径。

启动引导式渠道设置（`connect telegram`）也会立即运行。其向导会收集明确答案，并负责执行由此产生的写入。

持久性操作需要对话式审批（直接命令也可使用 `--yes`）：写入配置、`config set`、`config set-ref`、设置/新手引导引导启动、更改默认模型、启动/停止/重启 Gateway 网关、创建智能体和安装插件。

Crestodian 内不提供 Doctor 修复，因为这些修复可能会重写为当前会话提供推理能力的提供商、身份验证或默认智能体推理路由。请退出 Crestodian，并在终端中运行 `openclaw doctor --fix`。只读的 `doctor` 在 Crestodian 内仍可使用。

新智能体会继承经过实时验证的默认推理路由。智能体 ID `crestodian` 为拥有特权的虚拟管理员保留，不能创建为普通智能体。

`config set` 和 `config set-ref` 不能更改推理路由状态，
包括推理提供商凭据、顶层 `auth.*`、模型目录、
CLI 后端、默认/按智能体配置的模型路由、智能体参数/工具或根级
`tools.*`。也会拒绝在 `env.*`、`secrets.*`、`plugins.*` 和 `$include`
下执行原始写入，因为它们可能替换凭据解析或提供商激活方式。
Gateway 网关和渠道身份验证仍是普通配置表面。对于已经
配置的路由，请使用类型化插件/渠道工作流和
`set default model <provider/model>`；保存前会对该路由进行实时测试。若要配置或
修复提供商/身份验证访问，请退出 Crestodian 并运行 `openclaw onboard`。

Crestodian 内拒绝卸载插件，因为移除提供商
插件可能会禁用为当前会话提供推理能力的路由。请退出 Crestodian，
并在终端中运行 `openclaw plugins uninstall <id>`。

你可以用自己的话进行审批：明确无歧义的回复（“yes”“sure”“go ahead”“not now”）会根据一个封闭的确定性列表进行解析。当已配置的路由支持单独的补全调用时，其他回复可以仅根据你的消息和待处理提案进行分类——绝不会由对话模型自行分类，因为它不能自行批准。无法分类或存在歧义的回复会使提案保持待处理状态，并由对话再次询问。

已应用的写入会记录在 `~/.openclaw/audit/crestodian.jsonl` 中。发现操作不会被审计；只有已应用的操作和写入会被记录。

渠道设置可以作为托管式对话运行，直到需要输入密钥为止。本地
Crestodian TUI 不接受敏感的向导答案，因为终端
聊天输入可见。它会立即提供 `open channel wizard`，将
所选渠道带入采用掩码输入的终端向导；你也可以稍后运行
`openclaw channels add --channel <channel>`。

### 切换到采用掩码输入的渠道设置

本地聊天可以将控制权交给采用掩码输入的渠道向导：

```text
open channel wizard for slack
channel info slack
```

`open channel wizard for <channel>` 会在聊天
TUI 关闭后打开采用掩码输入的渠道设置。请先使用 `channel info <channel>` 查看渠道标签、设置
状态、先决条件摘要和文档链接。

Crestodian 绝不会从自身会话内部更改提供商/身份验证访问：该
会话已经依赖此推理路由。对于模型提供商的设置或
修复，`configure model provider` 只会返回退出/新手引导说明，不会
启动向导或写入配置。请退出 Crestodian 并运行 `openclaw
onboard`；新手引导会暂存凭据，并且只保存能够
完成真实实时轮次的路由。新手引导成功后，再次启动 Crestodian。

## 设置引导启动

在引导式新手引导已经建立推理之后，`setup` 会配置其余工作区和 Gateway 网关状态。它只通过类型化配置操作写入，并会先请求审批。

```text
setup
setup workspace ~/Projects/work
```

`setup` 会保留已验证的实际模型。它不会配置或
替换推理。

如果缺少推理或实时检查失败，请离开 Crestodian 并运行 `openclaw onboard`。引导式新手引导会检测已配置的模型、API 密钥和已通过身份验证的本地 CLI，要求每个候选项给出真实回复，并且只持久化通过测试的路由。跨过这一边界后，Crestodian 会立即启动，随后便可配置工作区、Gateway 网关、渠道、智能体、插件和其他可选功能。

当 macOS 应用连接到已配置的 Gateway 网关，
且其默认智能体已经配置模型时，会完全跳过这一流程，直接打开普通智能体
UI。
对于全新或不完整的 Gateway 网关，应用会通过
`crestodian.setup.detect` 和 `crestodian.setup.activate` Gateway 网关方法驱动推理流程：
detect 会列出找到的所有候选后端，activate 会实时测试一个
候选项（实际执行一次“reply with OK”补全），并且仅在测试通过后持久化该路由
所需的模型、凭据和提供商/运行时状态。工作区和 Gateway 网关默认值仍留给 Crestodian 配置。失败的候选项
绝不会更改配置；应用会自动沿候选列表依次尝试，最后
提供手动密钥/令牌步骤，其中的选项来自 Gateway 网关当前启用的
文本推理提供商插件。所选提供商负责提供其初始模型
和配置，凭据也会以相同方式验证后再保存。

Codex 监管和其他可选插件功能不属于此
推理激活事务。仅在推理正常工作并且 Crestodian
已启动后配置这些功能；现有插件策略和明确的
监管退出设置在推理设置期间不会被改动。

## AI 对话

交互式 Crestodian 的自由形式对话使用与普通 OpenClaw 智能体相同的 Agent loop，但仅限使用一个具有 ring-zero 权限的 OpenClaw 权威工具 `crestodian`，该工具封装了类型化操作。读取操作可自由运行；变更操作需要你针对该确切操作进行对话式审批（请参阅“操作和审批”）；每次已应用的写入都会被审计并重新验证。智能体会话会持久化，因此 Crestodian 具有真正的多轮记忆。如果经过验证的推理路由之后停止工作，请返回 `openclaw onboard` 进行修复，然后再继续。

宿主不会将自然语言请求解析为操作。自由形式
消息——包括看似命令的文本和“why did my
gateway stop?”之类的问题——会发送给 AI，由 AI 通过 `crestodian` 工具
将请求映射到类型化操作。

当变更操作处于待处理状态时，只有来自封闭列表的明确无歧义的批准或拒绝短语
才会在不使用推理的情况下得到解析。存在歧义的同意会发送到
单独配置的补全调用，否则将以拒绝方式安全失败。结构化
向导字段和精确的宿主导航属于 UI 控件，而不是自然语言
操作解析。有一项密钥卫生例外尤其重要：对敏感路径（令牌、密钥、密码）执行
精确的 `config set` 时，内容绝不会发送给
模型。宿主会创建经过脱敏的提案，该值也会在
AI 可见的历史记录中被掩码。对于密钥，优先使用 `config set-ref <path> env <ENV_VAR>`。

消息渠道救援模式绝不会使用模型辅助规划器。远程救援保持确定性，因此损坏或已遭入侵的普通智能体路径无法被用作配置编辑器。

### CLI harness 信任模型

嵌入式运行时和 Codex app-server harness 会直接执行 ring-zero
限制：运行时携带的 OpenClaw 工具允许列表中只有
`crestodian` 工具。对于 Codex，OpenClaw 还会为该次运行禁用环境、原生
执行、多智能体、目标、应用/插件、skill/MCP、Web 搜索和
`request_user_input` 表面。Codex 仍会注入其惰性的原生 `update_plan`
实用工具；它可以更新模型的临时检查清单，但不能写入文件
或 OpenClaw 配置。CLI harness 不使用 OpenClaw 的允许列表，
因此 Crestodian 只接受其自身工具选择契约能够证明
具备相同限制的后端：

- 可选择的后端（包括 Claude Code）启动时，原生工具选择为空，并且只有一个 MCP 工具 `crestodian`。Claude 生成的 MCP 配置通过 `--strict-mcp-config` 应用，因此不会加载其他 MCP 服务器。
- 声明不使用原生工具的后端会获得同一个 Crestodian 专用 MCP 服务器。
- 始终启用原生工具或原生工具状态未知的后端会在推理前采取故障关闭策略；它们无法托管 Crestodian 会话。

只有 Crestodian 会话会获得 crestodian MCP 服务器；普通智能体运行永远不会看到此工具。因此，可选择且无原生工具的 CLI 后端和使用 API key 的模型会强制执行严格的单工具循环。Codex app-server 模型会强制仅使用一个 OpenClaw 权限工具以及无实际操作的原生规划实用工具。在这三种情况下，设置写入仍仅限于 Crestodian 经审计的审批契约。

Gemini CLI 仍可用于普通智能体，但它无法强制执行推理门控所需的无工具探测，因此无法托管 Crestodian。

## 切换到智能体

使用自然语言选择指令离开 Crestodian，并打开普通 TUI：

```text
与智能体对话
与 work 智能体对话
切换到 main 智能体
```

`openclaw tui`、`openclaw chat` 和 `openclaw terminal` 会直接打开普通智能体 TUI；它们不会启动 Crestodian。切换到普通 TUI 后，使用 `/crestodian` 可返回 Crestodian，还可以附带后续请求：

```text
/crestodian
/crestodian restart gateway
```

## 消息救援模式

消息救援模式是 Crestodian 的消息渠道入口点：当普通智能体已无法工作，但受信任的渠道（例如 WhatsApp）仍能接收命令时，请使用此模式。

这是一个确定性的紧急命令处理程序，而不是对话式 Crestodian 智能体。它不会引导全新设置，也不会放宽 Crestodian 聊天的推理门控。

支持的命令：`/crestodian <request>`。救援模式仅接受精确输入的命令语法——自然语言会被拒绝并附带提示，绝不会被猜测性地转换为操作，也绝不会咨询任何模型。

```text
你在受信任的所有者私信中：/crestodian status
OpenClaw：Crestodian 救援模式。Gateway 网关可达：否。配置有效：否。
你：/crestodian restart gateway
OpenClaw：计划：重启 Gateway 网关。回复 /crestodian yes 以应用。
你：/crestodian yes
OpenClaw：已应用。已写入审计条目。
```

也可以在本地或通过救援模式将智能体创建操作加入队列：

```text
create agent work workspace ~/Projects/work model openai/gpt-5.6-sol
/crestodian create agent work workspace ~/Projects/work
```

创建智能体时，只能指定当前经实时验证的默认模型。省略模型可继承该路由。

远程救援是一个管理界面，必须像远程配置修复一样对待，而不是作为普通聊天使用。

远程救援的安全契约：

- 当智能体/会话启用沙箱隔离时，此功能会被禁用；Crestodian 会拒绝远程救援，并指引你使用本地 CLI 修复。
- 默认有效状态为 `auto`：仅在受信任的 YOLO 操作中允许远程救援，此时运行时已拥有未经过沙箱隔离的本地权限（`tools.exec.security` 解析为 `full`，`tools.exec.ask` 解析为 `off`，且沙箱模式为 `off`）。
- 必须明确指定所有者身份；不允许使用通配符发送者规则、开放的群组策略、未经身份验证的 Webhooks 或匿名渠道。
- 默认仅允许所有者私信；群组/渠道救援需要明确选择启用。
- 插件搜索和列表操作为只读。插件安装始终只能在本地执行（即使其他情况下已启用，在救援模式中仍会被阻止），因为它会下载可执行代码。本地 Crestodian 和救援模式都会拒绝卸载插件；请从终端运行 `openclaw plugins uninstall <id>`。
- 远程救援无法打开本地 TUI，也无法切换到交互式智能体会话；请使用本地 `openclaw` 完成智能体移交。
- 即使在救援模式中，持久化写入仍需审批。
- 每个已应用的救援操作都会接受审计。消息渠道救援会记录渠道、账号、发送者和源地址元数据；修改配置的操作还会记录修改前后的配置哈希。
- 绝不会回显密钥。SecretRef 检查仅报告是否可用，不会报告具体值。
- 如果 Gateway 网关仍在运行，救援模式会优先使用 Gateway 网关类型化操作；如果 Gateway 网关已停止，则救援模式仅使用不依赖普通智能体循环的最小本地修复界面。

配置结构：

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

- `enabled`：`"auto"`（默认值）仅在有效运行时为 YOLO 且沙箱隔离关闭时允许救援；`false` 始终不允许消息渠道救援；`true` 会在所有者/渠道检查通过时明确允许救援（仍受沙箱隔离拒绝规则约束）。
- `ownerDmOnly`：将救援限制为所有者私信。默认值为 `true`。
- `pendingTtlMinutes`：待处理的救援写入在过期前保持开放、等待通过 `/crestodian yes` 审批的时长。默认值为 `15`。

远程救援由以下 Docker 测试通道覆盖：

```bash
pnpm test:docker:crestodian-rescue
```

可选择启用的实时渠道命令界面冒烟测试会检查 `/crestodian status`，并通过救援处理程序完成一轮持久化审批往返：

```bash
pnpm test:live:crestodian-rescue-channel
```

受推理门控保护的打包版一次性设置由以下测试覆盖：

```bash
pnpm test:docker:crestodian-first-run
```

此打包版 CLI 测试通道从空状态目录开始，并证明 Crestodian 在没有推理能力时会采取故障关闭策略。随后，它会通过打包版激活模块测试并激活伪造的 Claude。只有在此之后，模糊请求才会到达规划器并解析为类型化设置，接着通过一次性命令创建额外的智能体、通过启用插件并配置 token SecretRef 来设置 Discord、验证配置并检查审计日志。此测试通道提供门控/操作方面的辅助证据；它不会测试交互式新手引导，也不会测试 Crestodian 的智能体/工具/审批对话。下方的 QA Lab 场景会重定向到同一个 Docker 测试通道：

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Doctor](/zh-CN/cli/doctor)
- [TUI](/zh-CN/cli/tui)
- [沙箱](/zh-CN/cli/sandbox)
- [安全性](/zh-CN/cli/security)

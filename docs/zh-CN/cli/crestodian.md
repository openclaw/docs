---
read_when:
    - 你已完成推理设置，并希望 Crestodian 配置其余部分
    - 你需要使用本地设置智能体检查或修复 OpenClaw
    - 你正在设计或启用消息渠道救援模式
summary: 基于推理的 Crestodian 设置与修复辅助工具的 CLI 参考和安全模型
title: Crestodian
x-i18n:
    generated_at: "2026-07-11T20:23:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af4861a48fb26159cb8e0c29d08ab5c3776283eb5392dcbe08c9a28d01f4abf5
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

对话式 Crestodian 是 OpenClaw 的本地设置、修复和配置智能体。它仅在实际生效的默认模型完成一次真实轮次后启动。全新安装会先建立推理能力；格式错误的配置仍走经典 Doctor 流程。

## 启动时机

运行不带子命令的 `openclaw` 时，会根据配置状态进行路由：

- 配置缺失，或配置存在但不含用户编写的设置（为空，或仅含 `$schema`/`meta` 键）：启动带实时 AI 验证的引导式新手引导。
- 配置存在但验证失败：启动经典新手引导，报告问题并引导你运行 `openclaw doctor`。
- 配置存在且有效：打开常规智能体 TUI。如果已配置的 Gateway 网关可访问，且其默认智能体具有模型，则会直接进入该界面，不经过新手引导或 Crestodian。之后可在 TUI 中使用 `/crestodian`，或直接运行 `openclaw crestodian`，进入 Crestodian。

运行 `openclaw crestodian` 时，会先对已配置的默认模型进行实时测试。成功完成一个轮次后启动 Crestodian。交互模式下测试失败会打开引导式推理设置，并在某个候选方案通过后转交给 Crestodian。当推理不可用时，单次、JSON 及其他非交互请求会失败，并提示运行 `openclaw onboard`。`openclaw --help` 和 `openclaw --version` 保持原有的快速路径。

非交互式运行不带参数的 `openclaw`（无 TTY）时，会输出一条简短消息并退出，而不是打印根帮助信息：对于全新安装或无效安装，它会指向非交互式新手引导；配置有效时，则指向 `openclaw agent --local ...`。

`openclaw onboard --modern` 仍是 Crestodian 的兼容别名，但使用相同的推理门控：推理正常时打开聊天；交互模式失败时启动引导式推理设置；非交互模式失败时退出并提供新手引导说明。`openclaw onboard --classic` 会打开完整的分步向导。

## Crestodian 显示的内容

交互式 Crestodian 会打开与 `openclaw tui` 相同的 TUI 外壳，并使用 Crestodian 聊天后端。启动问候语涵盖：

- 配置有效性和默认智能体
- Crestodian 正在使用的已验证模型
- 首次启动探测所得的 Gateway 网关可访问性
- 下一项建议的调试操作

它不会泄露机密，也不会仅为启动而加载插件 CLI 命令。

使用 `status` 查看详细清单：配置路径、文档/源代码路径、本地 CLI 探测结果、密钥/令牌是否存在、智能体、模型和 Gateway 网关详情。

Crestodian 使用与常规智能体相同的参考资料发现机制：在 Git 检出中，它会指向本地 `docs/` 和源代码树；在 npm 安装中，它会使用内置文档并链接至 [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)，同时提示你在文档不足时查阅源代码。

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

Crestodian 使用类型化操作，而不是临时直接编辑配置。

只读操作会立即运行：显示概览、列出智能体、列出已安装插件、搜索 ClawHub 插件、显示模型/后端状态、运行状态/健康检查、检查 Gateway 网关可访问性、运行不含交互式修复的 Doctor、验证配置，以及显示审计日志路径。

启动引导式渠道设置（`connect telegram`）也会立即运行。其向导会收集明确答案，并负责执行由此产生的写入。

持久化操作需要通过对话审批（直接命令也可使用 `--yes`）：写入配置、`config set`、`config set-ref`、设置/新手引导引导初始化、更改默认模型、启动/停止/重启 Gateway 网关、创建智能体以及安装插件。

Crestodian 内部不提供 Doctor 修复，因为这些修复可能会重写为当前会话提供支持的提供商、身份验证或默认智能体推理路由。请退出 Crestodian，并在终端中运行 `openclaw doctor --fix`。Crestodian 内部仍可使用只读的 `doctor`。

新智能体会继承经过实时验证的默认推理路由。智能体 ID `crestodian` 为拥有特权的虚拟管理员保留，不能创建为普通智能体。

`config set` 和 `config set-ref` 不能更改推理路由状态，包括推理提供商凭据、顶层 `auth.*`、模型目录、CLI 后端、默认/按智能体配置的模型路由、智能体参数/工具或根级 `tools.*`。也会拒绝对 `env.*`、`secrets.*`、`plugins.*` 和 `$include` 执行原始写入，因为这些写入可能替换凭据解析方式或提供商激活状态。Gateway 网关和渠道身份验证仍属于常规配置表面。请使用类型化的插件/渠道工作流；对于已经配置的路由，请使用 `set default model <provider/model>`，该命令会先实时测试路由，再保存配置。若要配置或修复提供商/身份验证访问，请退出 Crestodian 并运行 `openclaw onboard`。

Crestodian 内部拒绝卸载插件，因为移除提供商插件可能会禁用为当前会话提供支持的推理路由。请退出 Crestodian，并在终端中运行 `openclaw plugins uninstall <id>`。

你可以用自己的话表达审批：明确的回复（“是”“可以”“继续”“暂时不要”）会根据一个封闭的确定性列表解析。当配置的路由支持独立的补全调用时，其他回复可以仅根据你的消息和待处理提案进行分类——绝不会由对话模型自身分类，因为它不能自行审批。无法分类或含义不明确的回复会使提案保持待处理状态，并由对话再次询问。

已应用的写入会记录在 `~/.openclaw/audit/crestodian.jsonl` 中。发现操作不会接受审计；仅审计已应用的操作和写入。

渠道设置可以作为托管式对话运行，直到需要输入机密。由于终端聊天输入可见，本地 Crestodian TUI 不接受向导中的敏感答案。它会立即提供 `open channel wizard`，将所选渠道传递给采用掩码输入的终端向导；你也可以稍后运行 `openclaw channels add --channel <channel>`。

### 切换到采用掩码输入的渠道设置

本地聊天可以将控制权交给采用掩码输入的渠道向导：

```text
open channel wizard for slack
channel info slack
```

`open channel wizard for <channel>` 会在聊天 TUI 关闭后打开采用掩码输入的渠道设置。请先使用 `channel info <channel>` 查看渠道标签、设置状态、前提条件摘要和文档链接。

Crestodian 绝不会在自身会话中更改提供商/身份验证访问：该会话本身已经依赖这条推理路由。对于模型提供商的设置或修复，`configure model provider` 会返回退出/新手引导说明，不会启动向导或写入配置。请退出 Crestodian 并运行 `openclaw onboard`；新手引导会暂存凭据，并且只保存能够完成一次真实实时轮次的路由。新手引导成功后，再次启动 Crestodian。

## 设置引导初始化

引导式新手引导已经建立推理能力后，`setup` 会配置其余工作区和 Gateway 网关状态。它仅通过类型化配置操作执行写入，并会先请求审批。

```text
setup
setup workspace ~/Projects/work
```

`setup` 会保留已验证且实际生效的模型。它不会配置或替换推理。

如果缺少推理能力或实时检查失败，请离开 Crestodian 并运行 `openclaw onboard`。引导式新手引导会检测已配置的模型、API 密钥和已通过身份验证的本地 CLI，要求每个候选方案给出真实回复，并且仅持久化通过测试的路由。越过这一边界后，Crestodian 会立即启动，随后便可配置工作区、Gateway 网关、渠道、智能体、插件和其他可选功能。

当 macOS 应用连接到已配置的 Gateway 网关，且其默认智能体已经配置模型时，它会完全跳过这一流程，直接打开常规智能体界面。
对于全新或配置不完整的 Gateway 网关，应用会通过 `crestodian.setup.detect` 和 `crestodian.setup.activate` Gateway 网关方法驱动推理选择流程：detect 会列出找到的所有候选后端；activate 会对一个候选方案进行实时测试（真实执行一次“回复 OK”的补全），并且仅在测试通过后，才持久化该路由所需的模型、凭据以及提供商/运行时状态。工作区和 Gateway 网关默认值仍留给 Crestodian 配置。失败的候选方案绝不会更改配置；应用会自动依次尝试后续候选方案，最后提供手动密钥/令牌步骤，其中会填充 Gateway 网关当前文本推理提供商插件的信息。所选提供商拥有其初始模型和配置，凭据也会以相同方式验证后再保存。

Codex 监管和其他可选插件功能不属于这项推理激活事务。请仅在推理正常且 Crestodian 已启动后配置这些功能；推理设置期间，现有插件策略和明确的监管退出设置保持不变。

## AI 对话

交互式 Crestodian 的自由形式对话通过与常规 OpenClaw 智能体相同的 Agent loop 运行，但仅限使用一个拥有零环权限的 OpenClaw 权威工具 `crestodian`，该工具封装了类型化操作。读取操作可以自由运行；变更操作需要你针对该项具体操作进行对话审批（参见“操作和审批”）；每项已应用的写入都会接受审计和重新验证。智能体会话会持久化，因此 Crestodian 拥有真正的多轮记忆。如果经过验证的推理路由之后停止工作，请返回 `openclaw onboard` 修复，然后再继续。

宿主不会将自然语言请求解析为操作。自由形式消息——包括看似命令的文本以及“为什么我的 Gateway 网关停止了？”之类的问题——都会发送给 AI，由 AI 通过 `crestodian` 工具将请求映射到类型化操作。

当存在待处理的变更操作时，只有封闭列表中的明确批准或拒绝用语才会在不使用推理的情况下解析。含义不明确的同意会交给单独配置的补全调用处理，否则将以关闭方式失败。结构化向导字段和精确的宿主导航属于界面控件，不是自然语言操作解析。一个与机密卫生相关的例外尤其重要：针对敏感路径（令牌、密钥、密码）的精确 `config set` 永远不会传递给模型。宿主会创建经过脱敏的提案，并在 AI 可见的历史记录中隐藏该值。对于机密，请优先使用 `config set-ref <path> env <ENV_VAR>`。

消息渠道救援模式绝不会使用模型辅助规划器。远程救援保持确定性，因此损坏或被入侵的常规智能体路径无法被用作配置编辑器。

### CLI harness 信任模型

嵌入式运行时和 Codex app-server harness 会直接强制执行零环权限限制：该次运行携带一个 OpenClaw 工具允许列表，其中仅包含 `crestodian` 工具。对于 Codex，OpenClaw 还会在该次运行中禁用环境、原生执行、多智能体、目标、应用/插件、技能/MCP、Web 搜索和 `request_user_input` 表面。Codex 仍会注入其无实际操作能力的原生 `update_plan` 实用工具；它可以更新模型的临时检查清单，但不能写入文件或 OpenClaw 配置。CLI harness 不使用 OpenClaw 的允许列表，因此 Crestodian 仅接受那些自身工具选择契约能够证明同等限制的后端：

- 可选择的后端（包括 Claude Code）启动时不选择任何原生工具，只提供一个 MCP 工具 `crestodian`。Claude 生成的 MCP 配置通过 `--strict-mcp-config` 应用，因此不会加载其他 MCP 服务器。
- 声明不使用原生工具的后端会获得同一个专用 Crestodian MCP 服务器。
- 始终启用原生工具或原生工具状态未知的后端会在推理前以默认拒绝方式失败；它们无法托管 Crestodian 会话。

只有 Crestodian 会话会获得 crestodian MCP 服务器；普通智能体运行永远看不到此工具。因此，可选择且无原生工具的 CLI 后端和使用 API 密钥的模型会强制执行字面意义上的单工具循环。Codex app-server 模型会强制仅使用一个 OpenClaw 权限工具以及无实际操作能力的原生规划工具。在这三种情况下，设置写入仍仅限于 Crestodian 经审计的审批契约。

Gemini CLI 仍可供普通智能体使用，但它无法强制执行推理门控所需的无工具探测，因此无法托管 Crestodian。

## 切换到智能体

使用自然语言选择指令离开 Crestodian，并打开普通 TUI：

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`、`openclaw chat` 和 `openclaw terminal` 会直接打开普通智能体 TUI；它们不会启动 Crestodian。切换到普通 TUI 后，使用 `/crestodian` 可返回 Crestodian，并可选择附带后续请求：

```text
/crestodian
/crestodian restart gateway
```

## 消息救援模式

消息救援模式是 Crestodian 的消息渠道入口点：当普通智能体已无法运行，但受信任渠道（例如 WhatsApp）仍能接收命令时，请使用此模式。

这是确定性的紧急命令处理程序，而不是对话式 Crestodian 智能体。它不会引导全新设置，也不会放宽 Crestodian 聊天的推理门控。

支持的命令：`/crestodian <request>`。救援功能仅接受精确输入的命令语法——自然语言会被拒绝并附带提示，绝不会被猜测转换为操作，也绝不会调用模型。

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

也可以在本地或通过救援功能将智能体创建操作加入队列：

```text
create agent work workspace ~/Projects/work model openai/gpt-5.6-sol
/crestodian create agent work workspace ~/Projects/work
```

创建智能体时，只能指定当前经过实时验证的默认模型。省略模型即可继承该路由。

远程救援属于管理界面，必须像远程配置修复一样对待，而不是将其视为普通聊天。

远程救援的安全契约：

- 当智能体或会话启用沙箱隔离时禁用；Crestodian 会拒绝远程救援，并引导使用本地 CLI 修复。
- 默认有效状态为 `auto`：仅在受信任的 YOLO 操作中允许远程救援，此时运行时已拥有不受沙箱限制的本地权限（`tools.exec.security` 解析为 `full`，`tools.exec.ask` 解析为 `off`，且沙箱模式为 `off`）。
- 必须明确指定所有者身份；不允许通配符发送者规则、开放群组策略、未经身份验证的 Webhooks 或匿名渠道。
- 默认仅允许所有者私信；群组或渠道救援需要显式选择启用。
- 插件搜索和列出操作为只读。插件安装始终只能在本地执行（即使在其他情况下已启用，救援模式中仍会阻止），因为它会下载可执行代码。本地 Crestodian 和救援模式都会拒绝卸载插件；请在终端中运行 `openclaw plugins uninstall <id>`。
- 远程救援无法打开本地 TUI，也无法切换到交互式智能体会话；请使用本地 `openclaw` 进行智能体移交。
- 即使在救援模式下，持久化写入仍需要审批。
- 每个已应用的救援操作都会被审计。消息渠道救援会记录渠道、账户、发送者和源地址元数据；修改配置的操作还会记录修改前后的配置哈希。
- 绝不会回显密钥。检查 SecretRef 时只会报告是否可用，而不会报告值。
- 如果 Gateway 网关仍在运行，救援功能会优先使用 Gateway 网关的类型化操作；如果 Gateway 网关已停止，则救援功能只使用不依赖普通智能体循环的最小本地修复界面。

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

- `enabled`：`"auto"`（默认值）仅在有效运行时为 YOLO 且沙箱隔离关闭时允许救援；`false` 始终不允许消息渠道救援；`true` 会在所有者和渠道检查通过时显式允许救援（仍受沙箱隔离拒绝规则约束）。
- `ownerDmOnly`：将救援限制为所有者私信。默认值为 `true`。
- `pendingTtlMinutes`：待处理的救援写入在等待 `/crestodian yes` 审批时保持有效的时长，超时后失效。默认值为 `15`。

Docker 测试通道覆盖远程救援：

```bash
pnpm test:docker:crestodian-rescue
```

可选启用的实时渠道命令界面冒烟测试会检查 `/crestodian status`，并通过救援处理程序完成一次持久化操作的完整审批往返：

```bash
pnpm test:live:crestodian-rescue-channel
```

以下命令覆盖受推理门控保护的打包版一次性设置：

```bash
pnpm test:docker:crestodian-first-run
```

此打包版 CLI 测试通道从空状态目录启动，并证明 Crestodian 会在无法进行推理时以默认拒绝方式失败。随后，它通过打包的激活模块测试并激活模拟 Claude。只有完成这些步骤后，模糊请求才会到达规划器并解析为类型化设置；接着执行一次性命令，以创建额外的智能体、通过启用插件并配置令牌 SecretRef 来设置 Discord、验证配置并检查审计日志。此测试通道提供支持性的门控和操作证据；它不会测试交互式新手引导，也不会测试 Crestodian 的智能体、工具及审批对话。下方的 QA Lab 场景会重定向到同一个 Docker 测试通道：

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Doctor](/zh-CN/cli/doctor)
- [TUI](/zh-CN/cli/tui)
- [沙箱](/zh-CN/cli/sandbox)
- [安全性](/zh-CN/cli/security)

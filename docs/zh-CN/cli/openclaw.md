---
read_when:
    - 你已完成推理设置，并希望 OpenClaw 配置其余部分
    - 你需要使用本地设置智能体检查或修复 OpenClaw
    - 你正在设计或启用消息渠道救援模式
summary: 基于推理的 OpenClaw 设置和修复助手的 CLI 参考与安全模型
title: OpenClaw 设置智能体
x-i18n:
    generated_at: "2026-07-16T11:33:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4cf52eeaf14dd2e2bc388c69a1566d4956d42d27cd28cd74b3f1fbee5a2b2e5f
    source_path: cli/openclaw.md
    workflow: 16
---

# `openclaw setup`

OpenClaw 内置了一个系统智能体——它以“OpenClaw”的身份进行交互——用于本地设置、修复和配置（以前称为 Crestodian）。它仅在实际生效的默认模型完成一次真实轮次后启动。
全新安装会先建立推理能力；配置格式错误时仍沿用经典 Doctor 流程。

## 启动时机

运行不带子命令的 `openclaw` 时，会根据配置状态进行路由：

- 配置缺失，或配置存在但不含用户编写的设置（为空，或仅包含 `$schema`/`meta` 键）：启动带实时 AI 验证的引导式新手引导。
- 配置存在但验证失败：启动经典新手引导，报告问题并引导你使用 `openclaw doctor`。
- 配置存在且有效：打开正常的智能体 TUI。如果已配置的 Gateway 网关可访问，且其默认智能体已有模型，则会直接进入该 UI，而不经过新手引导或 OpenClaw。之后可在 TUI 中使用 `/openclaw`，或直接运行
  `openclaw setup`，进入 OpenClaw。

运行 `openclaw setup` 时，会先对已配置的默认模型执行实时测试。轮次通过后即启动 OpenClaw。交互模式下测试失败时，会打开引导式推理设置，并在候选项通过后移交给 OpenClaw。当推理不可用时，一次性请求、JSON 请求及其他非交互式请求会失败，并提示运行 `openclaw onboard`。`openclaw --help` 和 `openclaw --version` 保持其正常的快速路径。

在非交互环境中直接运行 `openclaw`（无 TTY）时，会退出并显示简短消息，而不是输出根帮助信息：对于全新安装或无效安装，它会指向非交互式新手引导；配置有效时，则指向 `openclaw agent --local ...`。

`openclaw onboard --modern` 仍是 OpenClaw 的兼容别名，但使用相同的推理门控：推理正常时打开聊天；交互模式失败时启动引导式推理设置；非交互模式失败时退出并显示新手引导说明。`openclaw onboard --classic` 会打开完整的分步向导。

## OpenClaw 显示的内容

交互式 OpenClaw 会打开与 `openclaw tui` 相同的 TUI shell，但使用 OpenClaw 聊天后端。启动问候信息包括：

- 配置有效性和默认智能体
- OpenClaw 正在使用的已验证模型
- 首次启动探测得到的 Gateway 网关可访问性
- 下一项建议的调试操作

它不会为了启动而输出机密信息或加载插件 CLI 命令。

使用 `status` 查看详细清单：配置路径、文档/源代码路径、本地 CLI 探测、密钥/令牌是否存在、智能体、模型以及 Gateway 网关详情。

OpenClaw 使用与常规智能体相同的参考资料发现机制：在 Git 检出目录中，它会指向本地 `docs/` 和源代码树；通过 npm 安装时，它会使用内置文档并链接到 [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)，同时建议在文档不足时查看源代码。

## 示例

```bash
openclaw
openclaw setup
openclaw setup --json
openclaw setup --message "模型"
openclaw setup --message "验证配置"
openclaw setup --message "设置工作区 ~/Projects/work" --yes
openclaw setup --message "将默认模型设置为 openai/gpt-5.6" --yes
openclaw onboard --modern
```

在 OpenClaw TUI 中：

```text
状态
健康检查
Doctor
验证配置
设置
设置工作区 ~/Projects/work
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
Gateway 网关状态
重启 Gateway 网关
智能体
创建智能体 work，工作区为 ~/Projects/work
模型
配置模型提供商
将默认模型设置为 openai/gpt-5.6
渠道
渠道信息 slack
连接 slack
打开 slack 的渠道向导
插件列表
搜索 slack 插件
plugin install clawhub:openclaw-codex-app-server
与 work 智能体交谈
与 ~/Projects/work 对应的智能体交谈
审计
退出
```

## 操作和审批

OpenClaw 使用类型化操作，而不是临时直接编辑配置。

只读操作会立即运行：显示概览、列出智能体、列出已安装的插件、搜索 ClawHub 插件、显示模型/后端状态、运行状态/健康检查、检查 Gateway 网关可访问性、在不进行交互式修复的情况下运行 Doctor、验证配置，以及显示审计日志路径。

启动引导式渠道设置（`connect telegram`）也会立即运行。其向导会收集明确的回答，并负责最终产生的写入操作。

持久化操作需要通过对话审批（直接执行命令时也可使用 `--yes`）：写入配置、`config set`、`config set-ref`、设置/新手引导初始化、更改默认模型、启动/停止/重启 Gateway 网关、创建智能体以及安装插件。

OpenClaw 内部无法执行 Doctor 修复，因为修复可能重写当前会话所依赖的提供商、身份验证或默认智能体推理路由。请退出 OpenClaw，并在终端中运行 `openclaw doctor --fix`。OpenClaw 内仍可使用只读的 `doctor`。

新智能体会继承经过实时验证的默认推理路由。智能体 ID `openclaw` 和 `crestodian` 保留给系统智能体，不能作为普通智能体创建。已停用的 ID 仍会被阻止，以防旧配置占用它。

`config set` 和 `config set-ref` 无法更改推理路由状态，
包括推理提供商凭据、顶层 `auth.*`、模型目录、
CLI 后端、默认/按智能体配置的模型路由、智能体参数/工具或根级
`tools.*`。在 `env.*`、`secrets.*`、`plugins.*` 和 `$include`
下进行原始写入也会被拒绝，因为它们可能替换凭据解析方式或提供商
激活状态。Gateway 网关和渠道身份验证仍属于常规配置范围。请使用类型化插件/渠道工作流，并对
已经配置的路由使用 `set default model <provider/model>`；
保存前会对该路由执行实时测试。如需配置或
修复提供商/身份验证访问，请退出 OpenClaw 并运行 `openclaw onboard`。

OpenClaw 内部不允许卸载插件，因为移除提供商
插件可能会禁用当前会话所依赖的推理路由。请退出 OpenClaw，
并在终端中运行 `openclaw plugins uninstall <id>`。

你可以用自己的话进行审批：明确无歧义的回复（“是”“可以”“继续”“暂时不要”）会根据一个封闭的确定性列表进行判定。当已配置的路由支持单独的补全调用时，其他回复可以仅根据你的消息和待处理提案进行分类——绝不会由对话模型自身分类，因为它不能自行批准。无法分类或存在歧义的回复会使提案保持待处理状态，并由对话再次询问。

已应用的写入操作记录在 `~/.openclaw/audit/system-agent.jsonl` 中。发现操作不会被审计；仅审计已应用的操作和写入。

渠道设置可以通过托管式对话运行，直到需要输入机密信息为止。由于终端
聊天输入可见，本地 OpenClaw TUI 不接受向导中的敏感回答。它会立即提供 `open channel wizard`，
将所选渠道带入带遮蔽输入的终端向导；你也可以稍后运行
`openclaw channels add --channel <channel>`。

### 切换到带遮蔽输入的渠道设置

本地聊天可以将控制权移交给带遮蔽输入的渠道向导：

```text
打开 slack 的渠道向导
渠道信息 slack
```

`open channel wizard for <channel>` 会在聊天
TUI 关闭后打开带遮蔽输入的渠道设置。请先使用 `channel info <channel>` 查看渠道标签、设置
状态、先决条件摘要和文档链接。

OpenClaw 绝不会在自身会话内部更改提供商/身份验证访问：该
会话本身已经依赖此推理路由。对于模型提供商设置或
修复，`configure model provider` 会返回退出/新手引导说明，而不会
启动向导或写入配置。退出 OpenClaw 并运行 `openclaw
onboard`；新手引导会暂存凭据，并且仅保存能够
完成真实实时轮次的路由。新手引导成功后，再次启动 OpenClaw。

## 设置初始化

在引导式新手引导已经建立推理能力后，`setup` 会配置剩余的工作区和 Gateway 网关状态。它仅通过类型化配置操作进行写入，并会先请求审批。

```text
设置
设置工作区 ~/Projects/work
```

`setup` 会保留已验证的实际生效模型。它不会配置或
替换推理设置。

如果缺少推理能力或实时检查失败，请离开 OpenClaw 并运行 `openclaw onboard`。引导式新手引导会检测已配置的模型、API 密钥和已经过身份验证的本地 CLI，要求每个候选项给出真实回复，并且只持久化通过测试的路由。越过该边界后，OpenClaw 会立即启动，随后即可配置工作区、Gateway 网关、渠道、智能体、插件及其他可选功能。

当 macOS 应用连接到已配置的 Gateway 网关，且其默认智能体已经配置模型时，会完全跳过此流程阶梯，直接打开正常的智能体
UI。
对于全新或不完整的 Gateway 网关，应用会通过
`openclaw.setup.detect` 和 `openclaw.setup.activate` Gateway 网关方法驱动推理流程阶梯：
detect 会列出发现的每个候选后端；activate 会实时测试一个
候选项（真实执行一次“回复 OK”的补全），并且仅在测试通过后持久化该路由所需的模型、
凭据和提供商/运行时状态。工作区和 Gateway 网关默认设置仍由 OpenClaw 处理。失败的候选项
绝不会更改配置；应用会自动沿流程阶梯继续尝试，最后
提供手动输入密钥/令牌的步骤，其中的选项来自 Gateway 网关当前启用的
文本推理提供商插件。所选提供商负责定义其入门模型
和配置，凭据也会以相同方式验证后再保存。

Codex 监督和其他可选插件功能不属于此
推理激活事务。仅在推理正常工作且 OpenClaw 已启动后进行配置；推理设置期间不会更改现有插件策略和明确的
监督退出设置。

## AI 对话

交互式 OpenClaw 的自由形式对话使用与常规 OpenClaw 智能体相同的 Agent loop，但权限仅限于一个零环级 OpenClaw 权限工具 `openclaw`，该工具封装类型化操作。读取操作可以自由运行；变更操作需要你针对该具体操作进行对话审批（参见“操作和审批”）；每次应用的写入都会被审计并重新验证。智能体会话会持久化，因此 OpenClaw 具备真正的多轮记忆。如果经过验证的推理路由之后停止工作，请返回 `openclaw onboard` 并修复，然后再继续。

宿主不会将自然语言请求解析为操作。自由形式
消息——包括类似命令的文本以及“为什么我的
Gateway 网关停止了？”之类的问题——都会发送给 AI，AI 可以通过 `openclaw` 工具将请求映射到类型化操作。

当有待处理的变更操作时，只有封闭列表中明确无歧义的批准或拒绝短语可以在不使用推理的情况下得到判定。存在歧义的同意会交给
单独配置的补全调用，否则按失败关闭处理。结构化
向导字段和精确的宿主导航属于 UI 控件，而不是自然语言
操作解析。有一个机密信息保护例外尤其重要：在敏感路径（令牌、密钥、密码）上执行的
精确 `config set` 永远不会发送给
模型。宿主会创建经过遮盖的提案，并在
AI 可见的历史记录中遮蔽该值。对于机密信息，优先使用 `config set-ref <path> env <ENV_VAR>`。

消息渠道救援模式绝不会使用模型辅助规划器。远程救援保持确定性，因此即使正常智能体路径损坏或遭到入侵，也无法将其用作配置编辑器。

### CLI harness 信任模型

嵌入式运行时和 Codex app-server harness 直接强制执行 ring-zero
限制：该运行携带一个 OpenClaw 工具允许列表，其中仅包含
`openclaw` 工具。对于 Codex，OpenClaw 还会为该运行禁用环境、原生
执行、多智能体、目标、应用/插件、技能/MCP、Web 搜索和
`request_user_input` 表面。Codex 仍会注入其惰性的原生 `update_plan`
实用工具；它可以更新模型的临时检查清单，但无法写入文件
或 OpenClaw 配置。CLI harness 不使用 OpenClaw 的允许列表，
因此 OpenClaw 仅接纳自身工具选择契约能够证明
相同限制的后端：

- 可选择的后端（包括 Claude Code）启动时使用空的原生工具
  选择以及一个 MCP 工具 `openclaw`。Claude 生成的 MCP 配置通过
  `--strict-mcp-config` 应用，因此不会加载其他 MCP 服务器。
- 声明不含原生工具的后端会收到同一个专用 OpenClaw
  MCP 服务器。
- 始终启用原生工具或原生工具未知的后端会在推理前以失败关闭方式终止；它们
  无法承载 OpenClaw 会话。

只有 OpenClaw 会话会获得 openclaw MCP 服务器；普通智能体运行
永远不会看到此工具。因此，可选择/无原生工具的 CLI 后端和 API 密钥模型
会强制执行字面意义上的单工具循环。Codex app-server 模型强制使用
单个 OpenClaw 权限工具以及惰性的原生规划实用工具。在所有
三种情况下，设置写入仍局限于 OpenClaw 经审计的审批
契约。

Gemini CLI 仍可供普通智能体使用，但它无法强制执行
推理门禁所需的无工具探测，因此无法承载 OpenClaw。

## 切换到智能体

使用自然语言选择器离开 OpenClaw 并打开普通 TUI：

```text
与智能体交谈
与 work 智能体交谈
切换到 main 智能体
```

`openclaw tui`、`openclaw chat` 和 `openclaw terminal` 会直接打开普通智能体 TUI；它们不会启动 OpenClaw。切换到普通 TUI 后，`/openclaw` 会返回 OpenClaw，并可选择附带后续请求：

```text
/openclaw
/openclaw 重启 Gateway 网关
```

## 消息救援模式

消息救援模式是 OpenClaw 的消息渠道入口点：当普通智能体已停止工作，但受信任的渠道（例如 WhatsApp）仍能接收命令时，请使用此模式。

这是一个确定性的紧急命令处理程序，而不是对话式
OpenClaw 智能体。它不会引导全新设置，也不会放宽 OpenClaw
聊天的推理门禁。

支持的命令：`/openclaw <request>`。救援仅接受精确输入的命令语法——自然语言会被拒绝并给出提示，绝不会猜测并转换为操作，也绝不会咨询模型。

```text
你，在受信任的所有者私信中：/openclaw status
OpenClaw：OpenClaw 救援模式。Gateway 网关可达：否。配置有效：否。
你：/openclaw restart gateway
OpenClaw：计划：重启 Gateway 网关。回复 /openclaw yes 以应用。
你：/openclaw yes
OpenClaw：已应用。审计条目已写入。
```

也可以在本地或通过救援将智能体创建加入队列：

```text
创建智能体 work 工作区 ~/Projects/work 模型 openai/gpt-5.6-sol
/openclaw create agent work workspace ~/Projects/work
```

创建智能体时只能指定当前经过实时验证的默认模型。省略
模型即可继承该路由。

远程救援属于管理表面，必须像远程配置修复一样处理，而不能视为普通聊天。

远程救援的安全契约：

- 当智能体/会话启用沙箱隔离时禁用；OpenClaw 会拒绝远程救援，并引导使用本地 CLI 修复。
- 默认有效状态为 `auto`：仅在受信任的 YOLO 操作中允许远程救援，此时运行时已拥有未经过沙箱隔离的本地权限（`tools.exec.security` 解析为 `full`，且 `tools.exec.ask` 解析为 `off`，沙箱模式为 `off`）。
- 需要明确的所有者身份；不允许通配符发送者规则、开放群组策略、未经身份验证的 Webhooks 或匿名渠道。
- 默认仅允许所有者私信；群组/渠道救援需要明确选择启用。
- 插件搜索和列表操作为只读。插件安装始终只能在本地执行（即使其他情况下已启用，在救援模式中仍会被阻止），因为它会下载可执行代码。本地 OpenClaw 和救援模式均拒绝卸载插件；请从终端运行 `openclaw plugins uninstall <id>`。
- 远程救援无法打开本地 TUI 或切换到交互式智能体会话；请使用本地 `openclaw` 进行智能体交接。
- 即使在救援模式下，持久化写入仍需要审批。
- 待处理审批仅可使用一次。同一账户、渠道和发送者发出的任何更新救援命令都会撤销旧计划；执行失败也会消耗审批，因此请重新发送命令以重试。
- 每个已应用的救援操作都会被审计。消息渠道救援会记录渠道、账户、发送者和源地址元数据；修改配置的操作还会记录修改前后的配置哈希。
- 绝不会回显密钥。SecretRef 检查报告的是可用性，而不是具体值。
- 如果 Gateway 网关处于活动状态，救援会优先使用 Gateway 网关的类型化操作；如果 Gateway 网关已停止工作，救援仅使用不依赖普通智能体循环的最小本地修复表面。

配置结构：

```jsonc
{
  "systemAgent": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
      "pendingTtlMinutes": 15,
    },
  },
}
```

- `enabled`：`"auto"`（默认值）仅在有效运行时为 YOLO 且沙箱隔离关闭时允许救援；`false` 从不允许消息渠道救援；`true` 在所有者/渠道检查通过时明确允许救援（仍受沙箱隔离拒绝规则约束）。
- `ownerDmOnly`：将救援限制为所有者直接消息。默认值为 `true`。
- `pendingTtlMinutes`：待处理的救援写入在过期前保持开放以等待 `/openclaw yes` 审批的时长。默认值为 `15`。

`openclaw doctor --fix` 会将旧版 `crestodian` 配置块迁移到
`systemAgent`。运行时仅读取规范配置块。

远程救援由以下 Docker 通道覆盖：

```bash
pnpm test:docker:system-agent-rescue
```

一个可选启用的实时渠道命令表面冒烟测试会检查 `/openclaw status`，以及通过救援处理程序完成的一次持久化审批往返：

```bash
pnpm test:live:system-agent-rescue-channel
```

受推理门禁保护的打包版一次性设置由以下命令覆盖：

```bash
pnpm test:docker:system-agent-first-run
```

该打包版 CLI 通道从空状态目录启动，并证明 OpenClaw
在没有推理能力时会以失败关闭方式终止。随后，它通过打包的激活模块测试并激活假的 Claude。
只有在此之后，模糊请求才会到达规划器并解析为类型化设置，接着执行一次性命令来创建
额外智能体、通过启用插件并使用令牌
SecretRef 配置 Discord、验证配置并检查审计日志。此通道提供
门禁/操作的辅助证据；它不会执行交互式新手引导，也不会执行
OpenClaw 智能体/工具/审批对话。下面的 QA Lab 场景会重定向到
同一个 Docker 通道：

```bash
pnpm openclaw qa suite --scenario system-agent-ring-zero-setup
```

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Doctor](/zh-CN/cli/doctor)
- [TUI](/zh-CN/cli/tui)
- [沙箱](/zh-CN/cli/sandbox)
- [安全性](/zh-CN/cli/security)

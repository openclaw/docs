---
read_when:
    - 你想在 OpenClaw 中使用 Anthropic 模型
    - 你希望浏览已配对计算机上的 Claude CLI 或 Claude Desktop 会话
summary: 在 OpenClaw 中通过 API 密钥或 Claude CLI 使用 Anthropic Claude
title: Anthropic
x-i18n:
    generated_at: "2026-07-12T14:42:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f15c88c33120f64d0c1c64b291380f4b8824c13262ba0b2a57662003cfb26adc
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic 构建 **Claude** 模型系列。OpenClaw 支持两种身份验证方式：

- **API key** - 使用按量计费的方式直接访问 Anthropic API（`anthropic/*` 模型）
- **Claude CLI** - 复用同一主机上现有的 Claude Code 登录

## 用量和费用跟踪

OpenClaw 会检测可用的 Anthropic 凭据，并选择匹配的用量界面：

- Claude 订阅/设置凭据会显示配额周期和可选的额外用量预算。
- `ANTHROPIC_ADMIN_KEY` 或 `ANTHROPIC_ADMIN_API_KEY` 会在 Control UI 的 **用量** 中显示提供商报告的 30 天组织费用和 Messages API 用量，包括每日支出、令牌/缓存总量、热门模型和费用类别。
- Anthropic 提供商配置文件中存储的 `sk-ant-admin...` 凭据会被自动识别为 Admin API key。

Admin API 费用历史记录来自 Anthropic 的 [Usage and Cost API](https://platform.claude.com/docs/en/manage-claude/usage-cost-api)。这是提供商的实际账单，与 OpenClaw 根据会话得出的估算费用相互独立。

<Warning>
OpenClaw 的 Claude CLI 后端以非交互式打印模式（`claude -p`）运行已安装的 Claude Code CLI。Anthropic 当前的 Claude Code 文档将该模式描述为 Agent SDK/程序化用法。Anthropic 于 2026 年 6 月 15 日发布的支持更新暂停了此前宣布的独立 Agent SDK 计费变更：Claude Agent SDK、`claude -p` 和第三方应用用量仍计入已登录订阅的用量限制，并且在 Anthropic 修订该计划期间，此前宣布的每月 Agent SDK 额度不可用。

交互式 Claude Code 仍计入已登录 Claude 套餐的用量限制。API key 身份验证采用直接按量付费的计费方式，不依赖该套餐。对于长期运行的 Gateway 网关主机、共享自动化以及需要可预测生产支出的场景，请使用 Anthropic API key。

Anthropic 当前的支持文章可能会在 OpenClaw 未发布新版本的情况下更改此行为：

- [Claude Code CLI 参考](https://code.claude.com/docs/en/cli-usage)
- [在你的 Claude 套餐中使用 Claude Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [在你的 Pro 或 Max 套餐中使用 Claude Code](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [在你的 Team 或 Enterprise 套餐中使用 Claude Code](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [管理 Claude Code 费用](https://code.claude.com/docs/en/costs)

</Warning>

## 入门指南

<Tabs>
  <Tab title="API key">
    **最适合：** 标准 API 访问和按量计费。

    <Steps>
      <Step title="获取 API key">
        在 [Anthropic Console](https://console.anthropic.com/) 中创建 API key。
      </Step>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard
        # 选择：Anthropic API key
        ```

        或直接传入密钥：

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### 配置示例

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **最适合：** 无需单独的 API key，即可复用现有的 Claude CLI 登录。

    <Steps>
      <Step title="确保 Claude CLI 已安装并登录">
        使用以下命令验证：

        ```bash
        claude --version
        ```
      </Step>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard
        # 选择：Claude CLI
        ```

        OpenClaw 会检测并复用现有的 Claude CLI 凭据。
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude CLI 后端的设置和运行时详情参见 [CLI 后端](/zh-CN/gateway/cli-backends)。
    </Note>

    <Warning>
    复用 Claude CLI 要求 OpenClaw 进程与 Claude CLI 登录在同一主机上运行。Docker 安装可以持久化容器主目录，并在其中登录 Claude Code；请参阅 [Docker 中的 Claude CLI 后端](/zh-CN/install/docker#claude-cli-backend-in-docker)。[Podman](/zh-CN/install/podman) 等其他容器安装不会在设置或运行时挂载主机的 `~/.claude`；请在其中使用 Anthropic API key，或选择由 OpenClaw 管理 OAuth 的提供商，例如 [OpenAI Codex](/zh-CN/providers/openai)。
    </Warning>

    ### 配置示例

    建议使用规范的 Anthropic 模型引用，并添加 CLI 运行时覆盖：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    为实现兼容性，旧版 `claude-cli/claude-opus-4-7` 模型引用仍然有效，但新配置应将提供商/模型选择保留为 `anthropic/*`，并将执行后端放入提供商/模型运行时策略中。

    ### 计费和 `claude -p`

    OpenClaw 使用 Claude Code 的非交互式 `claude -p` 路径运行 Claude CLI。Anthropic 当前将该路径视为 Agent SDK/程序化用法：

    - Anthropic 于 2026 年 6 月 15 日发布的支持更新暂停了此前宣布的独立 Agent SDK 额度计划。
    - 订阅套餐中的 Claude Agent SDK、`claude -p` 和第三方应用用量仍计入已登录订阅的用量限制。
    - 在 Anthropic 修订该计划期间，此前宣布的每月 Agent SDK 额度不可用。
    - Console/API key 登录采用按量付费的 API 计费方式，不会获得订阅版 Agent SDK 额度。

    有关暂停通知，请参阅 Anthropic 的 [Agent SDK 套餐文章](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)；有关订阅行为，请参阅 Claude Code 的 [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan) 和 [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan) 套餐文章。

    Anthropic 可能会在 OpenClaw 未发布新版本的情况下更改 Claude Code 的计费和速率限制行为。当计费可预测性很重要时，请检查 `claude auth status`、`/status` 和 Anthropic 的相关文档。

    <Tip>
    对于共享生产自动化，请使用 Anthropic API key，而不是 Claude CLI。OpenClaw 还支持来自 [OpenAI Codex](/zh-CN/providers/openai)、[Qwen Cloud](/zh-CN/providers/qwen)、[MiniMax](/zh-CN/providers/minimax) 和 [Z.AI / GLM](/zh-CN/providers/zai) 的订阅式选项。
    </Tip>

  </Tab>
</Tabs>

## 跨计算机的 Claude 会话

内置的 Anthropic 插件会在常规会话侧边栏中添加一个 **Claude Code** 分组。各行会在常规聊天窗格中打开。它会发现 Gateway 网关和已连接节点主机上未归档的 Claude Code 会话：

- Claude CLI 会话来自有效的项目索引记录和当前 JSONL 文件，这些文件受限长度的元数据前缀会标识 `~/.claude/projects/` 下的非侧链 `sdk-cli` 会话。
- 当 Claude Desktop 的元数据指向同一 Claude Code 会话 ID 时，其会话会使用 Desktop 标题、活动时间和归档状态。
- 仅 CLI 会话没有归档标志，因此只要其对话记录仍然存在，该会话便会保持可见。

无需额外的 OpenClaw 配置。Anthropic 插件已内置且默认启用；当本地 `~/.claude/projects/` 目录存在时，原生 macOS 节点会公布只读 Claude 会话命令。这些命令首次出现时，请批准节点配对升级。

侧边栏会从每台主机最新的受限页面开始，并按常规的 30 秒周期刷新。使用目录分组下方的 **加载更多会话**，可为每台仍有更多历史记录的主机追加下一页；追加的行会保持可见，并在刷新时以相同深度重新获取。目录客户端使用 `sessions.catalog.list`；打开一行时使用 `sessions.catalog.read`。

选择一行时，会先读取最新的对话记录页面。**加载更早的对话记录项目** 会沿用不透明的字节游标，从 JSONL 文件读取另一个受限区段，而不是加载完整历史记录。常规用户、助手、推理、工具调用和工具结果内容均会保留。超过节点/Gateway 网关安全上限的单个项目会明确标记为已截断。

对于 Gateway 网关本地的 `claude-cli` 行，在常规编辑器中输入内容会调用 `sessions.catalog.continue`。OpenClaw 会重新解析本地目录记录，创建或复用模型锁定的原生会话，导入最多 200 个可见项目或 512 KiB，并初始化 Claude CLI 绑定。第一轮使用 `--fork-session` 恢复；Claude 会为分叉分配新的会话 ID，因此后续轮次使用该分叉，而源会话保持不变。Claude Desktop 和配对节点中的行仅可查看。

<Note>
配对节点上的 Claude 会话为只读。OpenClaw 不会修改 Claude Desktop 元数据、归档 Claude 会话，也不会在会话所属计算机上启动第二个运行程序。该页面需要具有写入权限范围的操作员连接，因为它使用经过身份验证的 `node.invoke` 传输，尽管两个 Claude 节点命令都是只读的。
</Note>

有关节点命令和安全边界，请参阅[节点：Claude 会话和对话记录](/zh-CN/nodes#claude-sessions-and-transcripts)。

## 思考默认值（Claude Sonnet 5、Mythos 5、Fable 5、4.8 和 4.6）

`anthropic/claude-sonnet-5` 默认使用 `high` 强度的自适应思考。使用 `/think off` 可禁用思考，使用 `/think xhigh|max` 可启用模型更高的原生强度级别。对于 Sonnet 5，OpenClaw 会省略手动思考预算、自定义采样参数、助手预填充和 Priority Tier，因为 Anthropic 不支持在此模型的请求中使用这些功能。
目录采用 Anthropic 的推介期输入/输出定价 `$2/$10`，有效期截至 2026 年 8 月 31 日；标准 `$3/$15` 定价自 2026 年 9 月 1 日起生效。

`anthropic/claude-fable-5` 始终使用自适应思考，默认强度为 `high`。Anthropic 不允许为此模型禁用思考，因此 `/think off` 和 `/think minimal` 会映射到 `low` 强度。OpenClaw 还会在 Fable 5 请求中省略自定义温度值，因为 Anthropic 会拒绝对任何启用思考的请求覆盖温度。

`anthropic/claude-mythos-5` 是一个限量开放模型，采用相同的始终启用自适应思考的约定。OpenClaw 默认使用 `high`，将 `/think off` 和 `/think minimal` 映射到 `low`，并省略调用方选择的采样参数。
目录会公布其 1,000,000 令牌上下文窗口、128,000 令牌输出限制、图像输入功能以及 `$10/$50` 输入/输出定价。

Claude Opus 4.8 在 OpenClaw 中默认关闭思考。当你使用 `/think high|xhigh|max` 显式启用自适应思考时，OpenClaw 会发送 Anthropic 的 Opus 4.8 强度值；Claude 4.6 模型（Opus 4.6 和 Sonnet 4.6）默认为 `adaptive`。

使用 `/think:<level>` 对每条消息进行覆盖，或在模型参数中设置：

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
相关 Anthropic 文档：
- [自适应思考](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [扩展思考](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## 安全拒绝回退（Claude Fable 5）

<Warning>
使用 Claude Fable 5 也意味着会使用 Claude Opus 4.8。Fable 5 附带的安全分类器可能会拒绝请求，而 Anthropic 认可的恢复方式是让 `claude-opus-4-8` 处理该轮次。对于直接使用 API key 的请求，OpenClaw 会自动选择加入此机制，因此部分 Fable 轮次会由 Claude Opus 4.8 回答并按其计费。如果你的策略或预算无法接受由 Opus 处理的轮次，请勿选择 `anthropic/claude-fable-5`。
</Warning>

### 此机制存在的原因

对于受限领域中的请求，Fable 5 分类器会返回 `stop_reason: "refusal"`，同时也会对接近敏感领域的正常工作产生误报（安全工具、生命科学，甚至只是要求模型复现其原始推理过程）。如果没有回退机制，即使其他 Claude 模型能够正常处理，该轮次仍会因错误而终止——Anthropic 自己的拒绝消息也会提示 API 集成方配置回退模型。

### 工作原理

1. 对于每个直接使用 API key 向 `anthropic/claude-fable-5` 发出的请求，OpenClaw 都会发送 Anthropic 的服务端回退加入配置：`server-side-fallback-2026-06-01` beta 标头以及 `fallbacks: [{"model": "claude-opus-4-8"}]`。Claude Opus 4.8 是 Anthropic 唯一允许用于 Fable 5 的回退目标。
2. 只有安全分类器的拒绝才会触发回退。速率限制、过载和服务器错误的行为与之前完全相同，并会通过 OpenClaw 的常规[模型故障转移](/zh-CN/concepts/model-failover)机制处理。
3. 补救会在同一次调用中发生。如果在产生任何输出前被拒绝，除了延迟外不会留下可见痕迹；整个回答均来自 Opus 4.8。如果在流式传输中途被拒绝，已生成的部分文本会保留为回退模型继续生成时的前缀，而被拒绝模型的推理和工具调用会按照 Anthropic 的重放规则丢弃（不得将其回传或执行）。
4. 如果 Claude Opus 4.8 也拒绝请求，该轮次会像此功能推出之前一样，将拒绝呈现为错误。

回退发生在 Anthropic API 层，因此无需将 `claude-opus-4-8` 加入你配置的模型列表或回退链——能够使用 Fable 的 API key 始终可以调用 Opus。

### 可观测性和计费

- 由回退模型处理的轮次会在助手消息中记录一条 `provider_fallback` 诊断信息，其中包含 `fromModel` 和 `toModel`，并且消息的 `responseModel` 会报告 `claude-opus-4-8`。
- Anthropic 按每次尝试计费：产生输出前的拒绝免费，补救请求按 Claude Opus 4.8 费率计费（目前为 Fable 5 费率的一半）。为了保持一致，OpenClaw 会按 Opus 费率估算由回退模型处理的轮次成本。
- 如果在流式传输中途被拒绝，Anthropic 还会对 Fable 已流式传输的部分额外计费；该部分会在 API 的每次尝试用量中报告，但不会计入 OpenClaw 的单轮次估算。

### 适用范围

适用于通过 API key 身份验证向 `api.anthropic.com` 请求 `anthropic/claude-fable-5` 的情况。OAuth（复用 Claude CLI 订阅）、代理基础 URL、Bedrock、Vertex 和 Foundry 请求均不受影响，发生拒绝时仍会呈现为错误。

已通过实时验证：如果未配置回退，要求 Fable 5 复现其原始思维链的无害提示词会被拒绝，并返回 `category: "reasoning_extraction"`；通过 OpenClaw 发送同一提示词则会返回由 Opus 正常处理的回答，并附带 `provider_fallback` 诊断信息。

有关底层行为，请参阅 Anthropic 的[拒绝和回退指南](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)。

## 提示词缓存

OpenClaw 支持 Anthropic 面向 API key 身份验证的提示词缓存功能。

| 值                  | 缓存时长 | 说明                              |
| ------------------- | -------- | --------------------------------- |
| `"short"`（默认值） | 5 分钟   | 对 API key 身份验证自动应用       |
| `"long"`            | 1 小时   | 延长缓存                          |
| `"none"`            | 不缓存   | 禁用提示词缓存                    |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="按智能体覆盖缓存设置">
    使用模型级参数作为基准，然后通过 `agents.list[].params` 覆盖特定智能体：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    配置合并顺序：

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params`（匹配 `id`，按键覆盖）

    这样可以让一个智能体保留长期缓存，同时让同一模型上的另一个智能体针对突发式或低复用流量禁用缓存。

  </Accordion>

  <Accordion title="Bedrock Claude 注意事项">
    - Bedrock 上的 Anthropic Claude 模型（`amazon-bedrock/*anthropic.claude*`）在配置后接受 `cacheRetention` 透传。
    - 非 Anthropic 的 Bedrock 模型会在运行时被强制设为 `cacheRetention: "none"`。
    - 如果未设置显式值，API key 智能默认值还会为 Bedrock 上的 Claude 引用预设 `cacheRetention: "short"`。

  </Accordion>
</AccordionGroup>

## 高级配置

<AccordionGroup>
  <Accordion title="快速模式">
    对于通过 API key 直接发送到 `api.anthropic.com` 的流量，OpenClaw 的共享 `/fast` 开关会设置 Anthropic 的 `service_tier` 字段。

    | 命令 | 映射为 |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - 仅适用于使用 API key 直接向 `api.anthropic.com` 发出的请求。OAuth/订阅令牌请求和代理路由绝不会获得 `service_tier` 字段。
    - 同时设置时，显式的 `serviceTier` 或 `service_tier` 参数会覆盖 `/fast`。
    - 对于没有 Priority Tier 容量的账户，`service_tier: "auto"` 可能会解析为 `standard`。

    </Note>

  </Accordion>

  <Accordion title="媒体理解（图像和 PDF）">
    内置 Anthropic 插件会注册图像和 PDF 理解能力。OpenClaw 会根据已配置的 Anthropic 身份验证自动解析媒体能力，无需额外配置。

    | 属性         | 值                    |
    | ------------ | --------------------- |
    | 默认模型     | `claude-opus-4-8`     |
    | 支持的输入   | 图像、PDF 文档        |

    当图像或 PDF 附加到对话时，OpenClaw 会自动通过 Anthropic 媒体理解提供商路由该内容。

  </Accordion>

  <Accordion title="1M 上下文窗口">
    Claude Sonnet 5、Mythos 5 和 Fable 5 拥有精确的 1,000,000 token 输入窗口，并支持最多 128,000 个输出 token。Anthropic 的 1M 上下文窗口也已在具备自适应思考能力的 Claude 4.x 模型上正式可用：Opus 4.8、Opus 4.7、Opus 4.6 和 Sonnet 4.6。OpenClaw 会自动确定这些模型的大小，无需 `params.context1m`：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-5": {},
            "anthropic/claude-mythos-5": {},
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    较旧的配置可以保留 `params.context1m: true`；对于这些模型，它是无害的空操作，并且无论如何，OpenClaw 都不再发送已停用的 `context-1m-2025-08-07` beta 标头。请求标头解析期间会丢弃值为该内容的旧版 `anthropicBeta` 配置条目，而不受支持的旧版 Claude 模型仍会使用其常规上下文窗口。

    对于 Claude CLI 后端（`claude-cli/*`），`params.context1m: true` 的行为相同：符合条件且已具备正式可用能力的 Opus 和 Sonnet 模型会自动获得 1M 窗口，因此该参数在那里同样是可选的。

    <Warning>
    需要你的 Anthropic 凭据拥有长上下文访问权限。OAuth/订阅令牌身份验证会保留其所需的 Anthropic beta 标头，但如果旧版配置中仍存在已停用的 1M beta 标头，OpenClaw 会将其移除。
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 的 1M 上下文">
    `anthropic/claude-opus-4-8` 及其 `claude-cli` 变体默认拥有 1M 上下文窗口，无需 `params.context1m: true`。
  </Accordion>
</AccordionGroup>

## 故障排查

<AccordionGroup>
  <Accordion title="401 错误/令牌突然失效">
    Anthropic 令牌身份验证会过期，也可能被撤销。对于新设置，请改用 Anthropic API key。
  </Accordion>

  <Accordion title='未找到提供商 "anthropic" 的 API key'>
    Anthropic 身份验证是**按智能体**配置的；新智能体不会继承主智能体的密钥。请为该智能体重新运行新手引导（或在 Gateway 网关主机上配置 API key），然后使用 `openclaw models status` 验证。
  </Accordion>

  <Accordion title='未找到配置文件 "anthropic:default" 的凭据'>
    运行 `openclaw models status` 查看当前使用的身份验证配置文件。重新运行新手引导，或为该配置文件路径配置 API key。
  </Accordion>

  <Accordion title="没有可用的身份验证配置文件（全部处于冷却状态）">
    在 `openclaw models status --json` 中检查 `auth.unusableProfiles`。Anthropic 的速率限制冷却可能仅作用于特定模型，因此同系列的其他 Anthropic 模型仍可能可用。添加另一个 Anthropic 配置文件，或等待冷却结束。
  </Accordion>
</AccordionGroup>

<Note>
更多帮助：[故障排查](/zh-CN/help/troubleshooting)和[常见问题](/zh-CN/help/faq)。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="CLI 后端" href="/zh-CN/gateway/cli-backends" icon="terminal">
    Claude CLI 后端的设置和运行时详细信息。
  </Card>
  <Card title="提示词缓存" href="/zh-CN/reference/prompt-caching" icon="database">
    提示词缓存如何跨提供商工作。
  </Card>
  <Card title="OAuth 和身份验证" href="/zh-CN/gateway/authentication" icon="key">
    身份验证详细信息和凭据复用规则。
  </Card>
</CardGroup>

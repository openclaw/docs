---
read_when:
    - 选择或切换模型，配置别名
    - 调试模型故障转移 / “所有模型都失败了”
    - 了解认证配置档案及其管理方式
sidebarTitle: Models FAQ
summary: 常见问题：模型默认值、选择、别名、切换、故障转移和认证配置档案
title: 常见问题：模型与认证
x-i18n:
    generated_at: "2026-04-25T17:30:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: e060b48951b76d76a7f613b2abe3fdd845e34ae9eb5cbb36f45544f114edace7
    source_path: help/faq-models.md
    workflow: 15
---

  模型和认证配置档案相关问答。关于设置、会话、Gateway 网关、渠道以及
  故障排除，请参见主 [常见问题](/zh-CN/help/faq)。

  ## 模型：默认值、选择、别名、切换

  <AccordionGroup>
  <Accordion title='“默认模型”是什么？'>
    OpenClaw 的默认模型就是你设置在：

    ```
    agents.defaults.model.primary
    ```

    的那个值。

    模型使用 `provider/model` 的形式引用（例如：`openai/gpt-5.5` 或 `openai-codex/gpt-5.5`）。如果你省略 provider，OpenClaw 会先尝试别名，然后尝试对该精确模型 id 的唯一已配置 provider 匹配，只有在这之后才会回退到已配置默认 provider 这一已弃用的兼容路径。如果该 provider 不再暴露已配置的默认模型，OpenClaw 会回退到第一个已配置的 provider/model，而不是暴露一个陈旧的、已移除 provider 的默认值。你仍然应该**显式**设置 `provider/model`。

  </Accordion>

  <Accordion title="你推荐使用什么模型？">
    **推荐默认值：** 使用你的 provider 栈中可用的最新一代最强模型。
    **对于启用工具或处理不受信任输入的智能体：** 优先考虑模型能力，而不是成本。
    **对于日常/低风险聊天：** 使用更便宜的后备模型，并按智能体角色进行路由。

    MiniMax 有自己的文档：[MiniMax](/zh-CN/providers/minimax) 和
    [本地模型](/zh-CN/gateway/local-models)。

    经验法则：对于高风险工作，使用**你负担得起的最佳模型**；对于日常聊天或摘要，使用更便宜的
    模型。你可以按智能体路由模型，并使用子智能体来并行处理长任务（每个子智能体都会消耗 token）。参见 [Models](/zh-CN/concepts/models) 和
    [Sub-agents](/zh-CN/tools/subagents)。

    强烈警告：较弱或过度量化的模型更容易受到提示词注入
    和不安全行为的影响。参见 [Security](/zh-CN/gateway/security)。

    更多背景信息：[Models](/zh-CN/concepts/models)。

  </Accordion>

  <Accordion title="如何在不清空配置的情况下切换模型？">
    使用**模型命令**或只编辑**模型**字段。避免整份配置替换。

    安全选项：

    - 在聊天中使用 `/model`（快速、按会话）
    - `openclaw models set ...`（只更新模型配置）
    - `openclaw configure --section model`（交互式）
    - 编辑 `~/.openclaw/openclaw.json` 中的 `agents.defaults.model`

    除非你打算替换整个配置，否则应避免对部分对象使用 `config.apply`。
    对于 RPC 编辑，先用 `config.schema.lookup` 检查，并优先使用 `config.patch`
    来进行部分更新。lookup 载荷会给出规范化路径、浅层 schema 文档/约束，以及直接子项摘要。
    如果你确实覆盖了配置，请从备份恢复，或重新运行 `openclaw doctor` 进行修复。

    文档：[Models](/zh-CN/concepts/models)、[Configure](/zh-CN/cli/configure)、[Config](/zh-CN/cli/config)、[Doctor](/zh-CN/gateway/doctor)。

  </Accordion>

  <Accordion title="我可以使用自托管模型吗（llama.cpp、vLLM、Ollama）？">
    可以。Ollama 是使用本地模型最简单的路径。

    最快的设置方式：

    1. 从 `https://ollama.com/download` 安装 Ollama
    2. 拉取一个本地模型，例如 `ollama pull gemma4`
    3. 如果你也想使用云模型，运行 `ollama signin`
    4. 运行 `openclaw onboard` 并选择 `Ollama`
    5. 选择 `Local` 或 `Cloud + Local`

    说明：

    - `Cloud + Local` 会同时提供云模型和你的本地 Ollama 模型
    - 像 `kimi-k2.5:cloud` 这样的云模型不需要本地拉取
    - 如需手动切换，使用 `openclaw models list` 和 `openclaw models set ollama/<model>`

    安全说明：较小或高度量化的模型更容易受到提示词注入
    的影响。对于任何可以使用工具的机器人，我们强烈建议使用**大模型**。
    如果你仍想使用小模型，请启用沙箱隔离并使用严格的工具 allowlist。

    文档：[Ollama](/zh-CN/providers/ollama)、[本地模型](/zh-CN/gateway/local-models)、
    [模型提供商](/zh-CN/concepts/model-providers)、[Security](/zh-CN/gateway/security)、
    [沙箱隔离](/zh-CN/gateway/sandboxing)。

  </Accordion>

  <Accordion title="OpenClaw、Flawd 和 Krill 在模型上使用什么？">
    - 这些部署可能彼此不同，并且可能随时间变化；没有固定的 provider 推荐。
    - 使用 `openclaw models status` 检查每个网关上的当前运行时设置。
    - 对于安全敏感/启用工具的智能体，使用可用的最新一代最强模型。
  </Accordion>

  <Accordion title="如何在运行时切换模型（无需重启）？">
    将 `/model` 命令作为一条独立消息发送：

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    这些是内置别名。自定义别名可以通过 `agents.defaults.models` 添加。

    你可以通过 `/model`、`/model list` 或 `/model status` 列出可用模型。

    `/model`（以及 `/model list`）会显示一个紧凑的编号选择器。按编号选择：

    ```
    /model 3
    ```

    你也可以为 provider 强制指定一个认证配置档案（按会话）：

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    提示：`/model status` 会显示当前处于活动状态的智能体、正在使用的 `auth-profiles.json` 文件，以及下一个将尝试的认证配置档案。
    它还会在可用时显示已配置的 provider 端点（`baseUrl`）和 API 模式（`api`）。

    **如何取消固定我用 @profile 设置的配置档案？**

    重新运行 `/model`，**不要**带 `@profile` 后缀：

    ```
    /model anthropic/claude-opus-4-6
    ```

    如果你想返回默认值，请从 `/model` 中选择它（或发送 `/model <默认 provider/model>`）。
    使用 `/model status` 确认当前活动的认证配置档案。

  </Accordion>

  <Accordion title="我可以日常任务用 GPT 5.5，编码时用 Codex 5.5 吗？">
    可以。设置其中一个为默认值，并在需要时切换：

    - **快速切换（按会话）：** 对当前直接 OpenAI API key 任务使用 `/model openai/gpt-5.5`，或对 GPT-5.5 Codex OAuth 任务使用 `/model openai-codex/gpt-5.5`。
    - **默认值：** 将 `agents.defaults.model.primary` 设为 `openai/gpt-5.5` 用于 API key 用法，或设为 `openai-codex/gpt-5.5` 用于 GPT-5.5 Codex OAuth 用法。
    - **子智能体：** 将编码任务路由到使用不同默认模型的子智能体。

    参见 [Models](/zh-CN/concepts/models) 和 [Slash commands](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何为 GPT 5.5 配置快速模式？">
    使用会话切换或配置默认值中的任意一种：

    - **按会话：** 当会话正在使用 `openai/gpt-5.5` 或 `openai-codex/gpt-5.5` 时，发送 `/fast on`。
    - **按模型默认值：** 将 `agents.defaults.models["openai/gpt-5.5"].params.fastMode` 或 `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` 设置为 `true`。

    示例：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    对于 OpenAI，快速模式会在受支持的原生 Responses 请求上映射为 `service_tier = "priority"`。会话级 `/fast` 覆盖优先于配置默认值。

    参见 [Thinking and fast mode](/zh-CN/tools/thinking) 和 [OpenAI fast mode](/zh-CN/providers/openai#fast-mode)。

  </Accordion>

  <Accordion title='为什么我会看到 “Model ... is not allowed”，然后没有回复？'>
    如果设置了 `agents.defaults.models`，它就会变成 `/model` 和任何
    会话覆盖的 **allowlist**。选择一个不在该列表中的模型会返回：

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    这个错误会**替代**正常回复返回。修复方法：将该模型添加到
    `agents.defaults.models`，移除 allowlist，或从 `/model list` 中选择一个模型。

  </Accordion>

  <Accordion title='为什么我会看到 “Unknown model: minimax/MiniMax-M2.7”？'>
    这意味着**provider 未配置**（未找到 MiniMax provider 配置或认证
    配置档案），因此该模型无法解析。

    修复检查清单：

    1. 升级到当前的 OpenClaw 版本（或从源码 `main` 运行），然后重启 Gateway 网关。
    2. 确保已配置 MiniMax（通过向导或 JSON），或环境变量/认证配置档案中存在
       MiniMax 认证，以便注入匹配的 provider
       （`minimax` 使用 `MINIMAX_API_KEY`，`minimax-portal` 使用 `MINIMAX_OAUTH_TOKEN` 或已存储的 MiniMax
       OAuth）。
    3. 针对你的认证路径使用精确模型 id（区分大小写）：
       API key 设置使用 `minimax/MiniMax-M2.7` 或 `minimax/MiniMax-M2.7-highspeed`，
       OAuth 设置使用 `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`。
    4. 运行：

       ```bash
       openclaw models list
       ```

       并从列表中选择（或在聊天中使用 `/model list`）。

    参见 [MiniMax](/zh-CN/providers/minimax) 和 [Models](/zh-CN/concepts/models)。

  </Accordion>

  <Accordion title="我可以把 MiniMax 设为默认值，把 OpenAI 用于复杂任务吗？">
    可以。将 **MiniMax 设为默认值**，并在需要时**按会话**切换模型。
    后备仅用于**错误**，而不是“高难度任务”，因此请使用 `/model` 或单独的智能体。

    **选项 A：按会话切换**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    然后：

    ```
    /model gpt
    ```

    **选项 B：分离智能体**

    - 智能体 A 默认值：MiniMax
    - 智能体 B 默认值：OpenAI
    - 按智能体进行路由，或使用 `/agent` 切换

    文档：[Models](/zh-CN/concepts/models)、[Multi-Agent Routing](/zh-CN/concepts/multi-agent)、[MiniMax](/zh-CN/providers/minimax)、[OpenAI](/zh-CN/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt 是内置快捷方式吗？">
    是的。OpenClaw 附带了一些默认简写（仅当模型存在于 `agents.defaults.models` 中时才生效）：

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → API key 设置中为 `openai/gpt-5.5`，配置为 Codex OAuth 时为 `openai-codex/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    如果你设置了同名自定义别名，以你的值为准。

  </Accordion>

  <Accordion title="如何定义/覆盖模型快捷方式（别名）？">
    别名来自 `agents.defaults.models.<modelId>.alias`。示例：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    然后 `/model sonnet`（或在支持时使用 `/<alias>`）会解析到该模型 ID。

  </Accordion>

  <Accordion title="如何添加来自其他 provider 的模型，例如 OpenRouter 或 Z.AI？">
    OpenRouter（按 token 付费；模型很多）：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI（GLM 模型）：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    如果你引用了某个 provider/model，但缺少所需的 provider key，你会得到运行时认证错误（例如 `No API key found for provider "zai"`）。

    **添加新智能体后出现 No API key found for provider**

    这通常意味着**新智能体**有一个空的认证存储。认证是按智能体隔离的，
    存储在：

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    修复选项：

    - 运行 `openclaw agents add <id>` 并在向导中配置认证。
    - 或者将主智能体 `agentDir` 中的 `auth-profiles.json` 复制到新智能体的 `agentDir` 中。

    **不要**在多个智能体之间复用 `agentDir`；这会导致认证/会话冲突。

  </Accordion>
</AccordionGroup>

## 模型故障转移和 “All models failed”

<AccordionGroup>
  <Accordion title="故障转移是如何工作的？">
    故障转移分为两个阶段：

    1. 同一 provider 内的**认证配置档案轮换**。
    2. 回退到 `agents.defaults.model.fallbacks` 中的下一个模型，即**模型后备**。

    对失败的配置档案会应用冷却时间（指数退避），因此即使 provider 遇到速率限制或暂时故障，OpenClaw 也能继续响应。

    速率限制桶不仅包含普通的 `429` 响应。OpenClaw
    也会将诸如 `Too many concurrent requests`、
    `ThrottlingException`、`concurrency limit reached`、
    `workers_ai ... quota limit exceeded`、`resource exhausted`，以及周期性
    用量窗口限制（`weekly/monthly limit reached`）这样的消息视为值得故障转移的
    速率限制。

    某些看起来像计费问题的响应并不是 `402`，而某些 HTTP `402`
    响应也仍会停留在那个瞬时错误桶中。如果 provider 在 `401` 或 `403` 上返回
    明确的计费文本，OpenClaw 仍然可以将其保留在
    计费通道中，但 provider 特定的文本匹配器仍然限定在拥有它们的
    provider 范围内（例如 OpenRouter 的 `Key limit exceeded`）。如果某条 `402`
    消息看起来更像可重试的用量窗口限制，或者
    组织/工作区支出限制（`daily limit reached, resets tomorrow`、
    `organization spending limit exceeded`），OpenClaw 会将其视为
    `rate_limit`，而不是长期计费禁用。

    上下文溢出错误则不同：像
    `request_too_large`、`input exceeds the maximum number of tokens`、
    `input token count exceeds the maximum number of input tokens`、
    `input is too long for the model` 或 `ollama error: context length
    exceeded` 这样的特征，会停留在压缩/重试路径上，而不是推进模型
    后备。

    通用服务器错误文本的判断范围刻意比“任何带有
    unknown/error 的内容”更窄。OpenClaw 确实会将 provider 范围内的瞬时错误形态视为
    值得故障转移的超时/过载信号，例如 Anthropic 裸 `An unknown error occurred`、OpenRouter 裸
    `Provider returned error`、停止原因错误如 `Unhandled stop reason:
    error`、带有瞬时服务器文本的 JSON `api_error` 载荷
    （`internal server error`、`unknown error, 520`、`upstream error`、`backend
    error`），以及 provider 忙碌错误如 `ModelNotReadyException`，前提是匹配到对应的 provider 上下文。
    通用内部后备文本如 `LLM request failed with an unknown
    error.` 会保持保守，不会仅凭自身触发模型后备。

  </Accordion>

  <Accordion title='“No credentials found for profile anthropic:default” 是什么意思？'>
    这表示系统尝试使用认证配置档案 ID `anthropic:default`，但无法在预期的认证存储中找到与之对应的凭证。

    **修复检查清单：**

    - **确认认证配置档案存放位置**（新路径与旧路径）
      - 当前：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - 旧版：`~/.openclaw/agent/*`（由 `openclaw doctor` 迁移）
    - **确认你的环境变量已被 Gateway 网关加载**
      - 如果你在 shell 中设置了 `ANTHROPIC_API_KEY`，但通过 systemd/launchd 运行 Gateway 网关，它可能不会继承该变量。请将它放入 `~/.openclaw/.env`，或启用 `env.shellEnv`。
    - **确保你编辑的是正确的智能体**
      - 多智能体设置意味着可能存在多个 `auth-profiles.json` 文件。
    - **进行模型/认证状态完整性检查**
      - 使用 `openclaw models status` 查看已配置模型，以及 provider 是否已认证。

    **针对 “No credentials found for profile anthropic” 的修复检查清单**

    这意味着当前运行被固定到一个 Anthropic 认证配置档案，但 Gateway 网关
    无法在其认证存储中找到它。

    - **使用 Claude CLI**
      - 在网关主机上运行 `openclaw models auth login --provider anthropic --method cli --set-default`。
    - **如果你想改用 API key**
      - 在**网关主机**上的 `~/.openclaw/.env` 中放入 `ANTHROPIC_API_KEY`。
      - 清除任何强制缺失配置档案的固定顺序：

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **确认你是在网关主机上运行命令**
      - 在远程模式下，认证配置档案存储在 Gateway 网关所在机器上，而不是你的笔记本电脑上。

  </Accordion>

  <Accordion title="为什么它还会尝试 Google Gemini 并失败？">
    如果你的模型配置将 Google Gemini 作为后备项（或你切换到了 Gemini 简写），OpenClaw 会在模型后备期间尝试它。如果你没有配置 Google 凭证，就会看到 `No API key found for provider "google"`。

    修复方法：要么提供 Google 认证，要么从 `agents.defaults.model.fallbacks` / 别名中移除或避免使用 Google 模型，这样后备就不会路由到那里。

    **LLM request rejected: thinking signature required（Google Antigravity）**

    原因：会话历史包含**没有签名的 thinking 块**（通常来自
    中止/部分流式传输）。Google Antigravity 要求 thinking 块必须带签名。

    修复方法：OpenClaw 现在会为 Google Antigravity Claude 去除未签名的 thinking 块。如果问题仍然出现，请开启一个**新会话**，或为该智能体设置 `/thinking off`。

  </Accordion>
</AccordionGroup>

## 认证配置档案：它们是什么以及如何管理

相关内容：[/concepts/oauth](/zh-CN/concepts/oauth)（OAuth 流程、令牌存储、多账户模式）

<AccordionGroup>
  <Accordion title="什么是认证配置档案？">
    认证配置档案是一个绑定到 provider 的具名凭证记录（OAuth 或 API key）。配置档案存储在：

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="典型的配置档案 ID 是什么样的？">
    OpenClaw 使用带 provider 前缀的 ID，例如：

    - `anthropic:default`（没有邮箱身份时较常见）
    - `anthropic:<email>` 用于 OAuth 身份
    - 你自定义的 ID（例如 `anthropic:work`）

  </Accordion>

  <Accordion title="我可以控制优先尝试哪个认证配置档案吗？">
    可以。配置支持配置档案的可选元数据，以及按 provider 划分的顺序（`auth.order.<provider>`）。这**不会**存储密钥；它只是将 ID 映射到 provider/模式，并设置轮换顺序。

    如果某个配置档案处于短期**冷却**（速率限制/超时/认证失败）或更长期的**禁用**状态（计费/额度不足），OpenClaw 可能会临时跳过它。要检查这一点，请运行 `openclaw models status --json` 并查看 `auth.unusableProfiles`。调优项：`auth.cooldowns.billingBackoffHours*`。

    速率限制冷却可以按模型划分作用域。某个配置档案
    对一个模型处于冷却状态时，对于同一 provider 下的兄弟模型仍可能可用，
    而计费/禁用窗口仍会阻止整个配置档案。

    你也可以通过 CLI 设置一个**按智能体**的顺序覆盖（存储在该智能体的 `auth-state.json` 中）：

    ```bash
    # 默认针对已配置的默认智能体（省略 --agent）
    openclaw models auth order get --provider anthropic

    # 将轮换锁定为单个配置档案（只尝试这一个）
    openclaw models auth order set --provider anthropic anthropic:default

    # 或设置显式顺序（provider 内后备）
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # 清除覆盖（回退到配置中的 auth.order / round-robin）
    openclaw models auth order clear --provider anthropic
    ```

    要指定某个特定智能体：

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    要验证实际会尝试什么，请使用：

    ```bash
    openclaw models status --probe
    ```

    如果某个已存储配置档案未包含在显式顺序中，probe 会对该配置档案报告
    `excluded_by_auth_order`，而不是悄悄尝试它。

  </Accordion>

  <Accordion title="OAuth 和 API key 有什么区别？">
    OpenClaw 两者都支持：

    - **OAuth** 通常会利用订阅访问权限（在适用情况下）。
    - **API key** 使用按 token 计费。

    向导明确支持 Anthropic Claude CLI、OpenAI Codex OAuth 和 API key。

  </Accordion>
</AccordionGroup>

## 相关内容

- [FAQ](/zh-CN/help/faq) — 主常见问题
- [FAQ — quick start and first-run setup](/zh-CN/help/faq-first-run)
- [Model selection](/zh-CN/concepts/model-providers)
- [Model failover](/zh-CN/concepts/model-failover)

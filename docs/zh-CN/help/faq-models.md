---
read_when:
    - 选择或切换模型，配置别名
    - 排查模型故障转移 / “All models failed”
    - 了解认证配置文件及其管理方式
sidebarTitle: Models FAQ
summary: 常见问题：模型默认值、选择、别名、切换、故障转移和认证配置文件
title: 常见问题：模型与认证
x-i18n:
    generated_at: "2026-04-24T04:03:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8acc0bc1ea7096ba4743defb2a1766a62ccf6c44202df82ee9c1c04e5ab62222
    source_path: help/faq-models.md
    workflow: 15
---

  模型与认证配置文件相关问答。关于设置、会话、Gateway 网关、渠道和故障排除，请参见主 [常见问题](/zh-CN/help/faq)。

  ## 模型：默认值、选择、别名、切换

  <AccordionGroup>
  <Accordion title='“默认模型”是什么？'>
    OpenClaw 的默认模型就是你设置在以下位置的模型：

    ```
    agents.defaults.model.primary
    ```

    模型以 `provider/model` 的形式引用（例如：`openai/gpt-5.4` 或 `openai-codex/gpt-5.5`）。如果你省略提供商，OpenClaw 会先尝试别名，然后尝试与该精确模型 ID 唯一匹配的已配置提供商，最后才通过已弃用的兼容路径回退到已配置的默认提供商。如果该提供商不再公开已配置的默认模型，OpenClaw 会回退到第一个已配置的提供商 / 模型，而不是暴露一个陈旧的、已移除提供商默认值。你仍然应该**显式**设置 `provider/model`。

  </Accordion>

  <Accordion title="你推荐什么模型？">
    **推荐默认值：** 使用你提供商栈中可用的最强、最新一代模型。
    **对于启用工具或处理不受信任输入的智能体：** 优先考虑模型能力，而不是成本。
    **对于日常 / 低风险聊天：** 使用更便宜的回退模型，并按智能体角色进行路由。

    MiniMax 有自己的文档： [MiniMax](/zh-CN/providers/minimax) 和
    [本地模型](/zh-CN/gateway/local-models)。

    经验法则：对于高风险工作，使用**你负担得起的最佳模型**；对于日常聊天或摘要，使用更便宜的
    模型。你可以按智能体配置模型路由，并使用子智能体来并行处理长任务（每个子智能体都会消耗 token）。参见 [Models](/zh-CN/concepts/models) 和
    [Sub-agents](/zh-CN/tools/subagents)。

    强烈警告：较弱或过度量化的模型更容易受到提示注入和不安全行为的影响。参见 [Security](/zh-CN/gateway/security)。

    更多背景信息： [Models](/zh-CN/concepts/models)。

  </Accordion>

  <Accordion title="如何在不清空配置的情况下切换模型？">
    使用**模型命令**，或只编辑**模型**字段。避免整份配置替换。

    安全选项：

    - 聊天中的 `/model`（快捷，按会话生效）
    - `openclaw models set ...`（只更新模型配置）
    - `openclaw configure --section model`（交互式）
    - 编辑 `~/.openclaw/openclaw.json` 中的 `agents.defaults.model`

    除非你确实打算替换整个配置，否则应避免对部分对象使用 `config.apply`。
    对于 RPC 编辑，请先使用 `config.schema.lookup` 检查，并优先使用 `config.patch`
    进行部分更新。lookup 负载会为你提供标准化路径、浅层 schema 文档 / 约束，以及直接子项摘要。
    如果你确实覆盖了配置，请从备份恢复，或重新运行 `openclaw doctor` 进行修复。

    文档： [Models](/zh-CN/concepts/models)、[Configure](/zh-CN/cli/configure)、[Config](/zh-CN/cli/config)、[Doctor](/zh-CN/gateway/doctor)。

  </Accordion>

  <Accordion title="我可以使用自托管模型吗（llama.cpp、vLLM、Ollama）？">
    可以。Ollama 是使用本地模型最简单的路径。

    最快设置方式：

    1. 从 `https://ollama.com/download` 安装 Ollama
    2. 拉取一个本地模型，例如 `ollama pull gemma4`
    3. 如果你也想使用云模型，运行 `ollama signin`
    4. 运行 `openclaw onboard` 并选择 `Ollama`
    5. 选择 `Local` 或 `Cloud + Local`

    注意：

    - `Cloud + Local` 会同时提供云模型和你的本地 Ollama 模型
    - 像 `kimi-k2.5:cloud` 这样的云模型不需要本地拉取
    - 如需手动切换，请使用 `openclaw models list` 和 `openclaw models set ollama/<model>`

    安全说明：更小或高度量化的模型更容易受到提示注入攻击。对于任何可以使用工具的 bot，我们强烈建议使用**大模型**。
    如果你仍想使用小模型，请启用沙箱隔离和严格的工具允许列表。

    文档： [Ollama](/zh-CN/providers/ollama)、[本地模型](/zh-CN/gateway/local-models)、
    [模型提供商](/zh-CN/concepts/model-providers)、[Security](/zh-CN/gateway/security)、
    [沙箱隔离](/zh-CN/gateway/sandboxing)。

  </Accordion>

  <Accordion title="OpenClaw、Flawd 和 Krill 使用什么模型？">
    - 这些部署可能不同，并且会随时间变化；不存在固定的提供商推荐。
    - 使用 `openclaw models status` 检查每个 gateway 上当前的运行时设置。
    - 对于安全敏感 / 启用工具的智能体，请使用可用的最强、最新一代模型。
  </Accordion>

  <Accordion title="如何动态切换模型（无需重启）？">
    将 `/model` 命令作为独立消息使用：

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    这些是内置别名。可以通过 `agents.defaults.models` 添加自定义别名。

    你可以使用 `/model`、`/model list` 或 `/model status` 列出可用模型。

    `/model`（以及 `/model list`）会显示一个紧凑的编号选择器。可按编号选择：

    ```
    /model 3
    ```

    你还可以为该提供商强制指定特定认证配置文件（按会话生效）：

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    提示：`/model status` 会显示当前处于活动状态的智能体、正在使用的 `auth-profiles.json` 文件，以及接下来将尝试的认证配置文件。
    在可用时，它还会显示已配置的提供商端点（`baseUrl`）和 API 模式（`api`）。

    **如何取消固定我通过 @profile 设置的配置文件？**

    不带 `@profile` 后缀重新运行 `/model`：

    ```
    /model anthropic/claude-opus-4-6
    ```

    如果你想返回默认值，可从 `/model` 中选择默认模型（或发送 `/model <default provider/model>`）。
    使用 `/model status` 确认当前活动的认证配置文件。

  </Accordion>

  <Accordion title="我可以用 GPT 5.5 处理日常任务，用 Codex 5.5 编码吗？">
    可以。将其中一个设为默认值，并按需切换：

    - **快速切换（按会话）：** 对当前直接 OpenAI API 密钥任务使用 `/model openai/gpt-5.4`，或对 GPT-5.5 Codex OAuth 任务使用 `/model openai-codex/gpt-5.5`。
    - **默认值：** 对 API 密钥用法，将 `agents.defaults.model.primary` 设为 `openai/gpt-5.4`；对 GPT-5.5 Codex OAuth 用法，将其设为 `openai-codex/gpt-5.5`。
    - **子智能体：** 将编码任务路由给具有不同默认模型的子智能体。

    一旦 OpenAI 在公共 API 上启用
    GPT-5.5，就支持通过直接 API 密钥访问 `openai/gpt-5.5`。在此之前，GPT-5.5 仅支持订阅 / OAuth。

    参见 [Models](/zh-CN/concepts/models) 和 [斜杠命令](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何为 GPT 5.5 配置快速模式？">
    可使用会话级开关或配置默认值：

    - **按会话：** 当会话使用 `openai/gpt-5.4` 或 `openai-codex/gpt-5.5` 时，发送 `/fast on`。
    - **按模型默认值：** 将 `agents.defaults.models["openai/gpt-5.4"].params.fastMode` 或 `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` 设为 `true`。

    示例：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    对于 OpenAI，快速模式会映射到受支持原生 Responses 请求上的 `service_tier = "priority"`。会话级 `/fast` 覆盖优先于配置默认值。

    参见 [Thinking and fast mode](/zh-CN/tools/thinking) 和 [OpenAI fast mode](/zh-CN/providers/openai#fast-mode)。

  </Accordion>

  <Accordion title='为什么我会看到 “Model ... is not allowed”，然后没有回复？'>
    如果设置了 `agents.defaults.models`，它就会成为 `/model` 和任何
    会话覆盖的**允许列表**。选择不在该列表中的模型会返回：

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    该错误会**替代**正常回复返回。修复方法：将该模型加入
    `agents.defaults.models`，移除允许列表，或从 `/model list` 中选择一个模型。

  </Accordion>

  <Accordion title='为什么我会看到 “Unknown model: minimax/MiniMax-M2.7”？'>
    这意味着**提供商未配置**（未找到 MiniMax 提供商配置或认证
    配置文件），因此无法解析该模型。

    修复检查清单：

    1. 升级到当前的 OpenClaw 版本（或从源码 `main` 运行），然后重启 gateway。
    2. 确保已配置 MiniMax（通过向导或 JSON），或者环境变量 / 认证配置文件中存在
       MiniMax 认证，以便注入匹配的提供商
       （`minimax` 使用 `MINIMAX_API_KEY`，`minimax-portal` 使用 `MINIMAX_OAUTH_TOKEN` 或存储的 MiniMax
       OAuth）。
    3. 对你的认证路径使用精确的模型 ID（区分大小写）：
       API 密钥设置用 `minimax/MiniMax-M2.7` 或 `minimax/MiniMax-M2.7-highspeed`，
       OAuth 设置用 `minimax-portal/MiniMax-M2.7` 或
       `minimax-portal/MiniMax-M2.7-highspeed`。
    4. 运行：

       ```bash
       openclaw models list
       ```

       并从列表中选择（或在聊天中使用 `/model list`）。

    参见 [MiniMax](/zh-CN/providers/minimax) 和 [Models](/zh-CN/concepts/models)。

  </Accordion>

  <Accordion title="我可以将 MiniMax 作为默认值，并用 OpenAI 处理复杂任务吗？">
    可以。将 **MiniMax 设为默认值**，并在需要时**按会话**切换模型。
    回退机制用于处理**错误**，而不是“高难度任务”，因此请使用 `/model` 或单独的智能体。

    **选项 A：按会话切换**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    然后：

    ```
    /model gpt
    ```

    **选项 B：单独的智能体**

    - 智能体 A 默认值：MiniMax
    - 智能体 B 默认值：OpenAI
    - 按智能体进行路由，或使用 `/agent` 切换

    文档： [Models](/zh-CN/concepts/models)、[Multi-agent routing](/zh-CN/concepts/multi-agent)、[MiniMax](/zh-CN/providers/minimax)、[OpenAI](/zh-CN/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt 是内置快捷方式吗？">
    是的。OpenClaw 附带了一些默认简写（仅当模型存在于 `agents.defaults.models` 中时才会生效）：

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → API 密钥设置使用 `openai/gpt-5.4`，配置为 Codex OAuth 时使用 `openai-codex/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    如果你设置了同名的自定义别名，则以你的值为准。

  </Accordion>

  <Accordion title="如何定义 / 覆盖模型快捷方式（别名）？">
    别名来自 `agents.defaults.models.<modelId>.alias`。例如：

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

    然后 `/model sonnet`（或在支持时使用 `/<alias>`）会解析为该模型 ID。

  </Accordion>

  <Accordion title="如何添加来自 OpenRouter 或 Z.AI 等其他提供商的模型？">
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

    如果你引用了某个 provider/model，但缺少所需的提供商密钥，就会收到运行时认证错误（例如 `No API key found for provider "zai"`）。

    **添加新智能体后显示 No API key found for provider**

    这通常意味着**新智能体**的认证存储为空。认证是按智能体区分的，
    存储在：

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    修复选项：

    - 运行 `openclaw agents add <id>`，并在向导中配置认证。
    - 或者将主智能体 `agentDir` 中的 `auth-profiles.json` 复制到新智能体的 `agentDir` 中。

    不要在多个智能体之间复用 `agentDir`；这会导致认证 / 会话冲突。

  </Accordion>
</AccordionGroup>

## 模型故障转移与 “All models failed”

<AccordionGroup>
  <Accordion title="故障转移是如何工作的？">
    故障转移分两个阶段进行：

    1. 在同一提供商内进行**认证配置文件轮换**。
    2. **模型回退**到 `agents.defaults.model.fallbacks` 中的下一个模型。

    对失败的配置文件会应用冷却时间（指数退避），因此即使某个提供商受到速率限制或暂时失败，OpenClaw 也能继续响应。

    速率限制桶不仅包含普通的 `429` 响应。OpenClaw
    也会将诸如 `Too many concurrent requests`、
    `ThrottlingException`、`concurrency limit reached`、
    `workers_ai ... quota limit exceeded`、`resource exhausted` 以及周期性
    用量窗口限制（`weekly/monthly limit reached`）之类的消息视为值得进行故障转移的
    速率限制。

    某些看起来像计费问题的响应并不是 `402`，而某些 HTTP `402`
    响应也仍然属于这种瞬时错误桶。如果提供商在 `401` 或 `403` 上返回
    明确的计费文本，OpenClaw 仍然可以将其保留在
    计费通道中，但提供商特定的文本匹配器仍限定在拥有它们的
    提供商范围内（例如 OpenRouter 的 `Key limit exceeded`）。如果某条 `402`
    消息看起来更像是可重试的用量窗口或
    organization/workspace 支出限制（`daily limit reached, resets tomorrow`、
    `organization spending limit exceeded`），OpenClaw 会将其视为
    `rate_limit`，而不是长期计费禁用。

    上下文溢出错误则不同：像
    `request_too_large`、`input exceeds the maximum number of tokens`、
    `input token count exceeds the maximum number of input tokens`、
    `input is too long for the model` 或 `ollama error: context length
    exceeded` 这样的特征会保留在压缩 / 重试路径中，而不是推进模型回退。

    通用服务器错误文本被有意收窄，而不是“任何包含
    unknown/error 的内容都算”。当提供商上下文
    匹配时，OpenClaw 的确会将诸如 Anthropic 纯文本 `An unknown error occurred`、OpenRouter 纯文本
    `Provider returned error`、停止原因错误如 `Unhandled stop reason:
    error`、带有瞬时服务器文本的 JSON `api_error` 负载
    （`internal server error`、`unknown error, 520`、`upstream error`、`backend
    error`），以及像 `ModelNotReadyException` 这样的提供商繁忙错误，
    视为值得进行故障转移的超时 / 过载信号。
    像 `LLM request failed with an unknown
    error.` 这样的通用内部回退文本则保持保守，不会单独触发模型回退。

  </Accordion>

  <Accordion title='“No credentials found for profile anthropic:default” 是什么意思？'>
    这表示系统尝试使用认证配置文件 ID `anthropic:default`，但在预期的认证存储中找不到对应凭证。

    **修复检查清单：**

    - **确认认证配置文件的存储位置**（新路径与旧路径）
      - 当前：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - 旧版：`~/.openclaw/agent/*`（由 `openclaw doctor` 迁移）
    - **确认你的环境变量已被 Gateway 网关加载**
      - 如果你在 shell 中设置了 `ANTHROPIC_API_KEY`，但通过 systemd/launchd 运行 Gateway 网关，它可能不会继承该变量。请将其放入 `~/.openclaw/.env`，或启用 `env.shellEnv`。
    - **确保你编辑的是正确的智能体**
      - 多智能体设置意味着可能存在多个 `auth-profiles.json` 文件。
    - **进行模型 / 认证状态完整性检查**
      - 使用 `openclaw models status` 查看已配置模型，以及提供商是否已认证。

    **“No credentials found for profile anthropic” 的修复检查清单**

    这意味着当前运行被固定到某个 Anthropic 认证配置文件，但 Gateway 网关
    无法在其认证存储中找到它。

    - **使用 Claude CLI**
      - 在 gateway 主机上运行 `openclaw models auth login --provider anthropic --method cli --set-default`。
    - **如果你想改用 API 密钥**
      - 在**gateway 主机**上的 `~/.openclaw/.env` 中放入 `ANTHROPIC_API_KEY`。
      - 清除任何强制使用缺失配置文件的固定顺序：

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **确认你是在 gateway 主机上运行命令**
      - 在远程模式下，认证配置文件存储在 gateway 机器上，而不是你的笔记本电脑上。

  </Accordion>

  <Accordion title="为什么它还尝试了 Google Gemini 并失败了？">
    如果你的模型配置将 Google Gemini 作为回退项（或者你切换到了 Gemini 简写），OpenClaw 会在模型回退期间尝试它。如果你尚未配置 Google 凭证，就会看到 `No API key found for provider "google"`。

    修复方法：要么提供 Google 认证，要么从 `agents.defaults.model.fallbacks` / 别名中移除或避免使用 Google 模型，这样回退就不会路由到它。

    **LLM request rejected: thinking signature required（Google Antigravity）**

    原因：会话历史中包含**没有签名的 thinking 块**（通常来自
    已中止 / 不完整的流）。Google Antigravity 要求 thinking 块带有签名。

    修复：OpenClaw 现在会为 Google Antigravity Claude 去除未签名的 thinking 块。如果问题仍然出现，请启动一个**新会话**，或对该智能体设置 `/thinking off`。

  </Accordion>
</AccordionGroup>

## 认证配置文件：它们是什么以及如何管理

相关：[/concepts/oauth](/zh-CN/concepts/oauth)（OAuth 流程、令牌存储、多账户模式）

<AccordionGroup>
  <Accordion title="什么是认证配置文件？">
    认证配置文件是绑定到某个提供商的命名凭证记录（OAuth 或 API 密钥）。配置文件存储在：

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="典型的配置文件 ID 是什么？">
    OpenClaw 使用带提供商前缀的 ID，例如：

    - `anthropic:default`（没有电子邮件身份时很常见）
    - `anthropic:<email>` 用于 OAuth 身份
    - 你自己选择的自定义 ID（例如 `anthropic:work`）

  </Accordion>

  <Accordion title="我可以控制优先尝试哪个认证配置文件吗？">
    可以。配置支持配置文件的可选元数据以及按提供商划分的顺序（`auth.order.<provider>`）。这**不会**存储机密；它只是将 ID 映射到提供商 / 模式，并设置轮换顺序。

    如果某个配置文件处于短暂的**冷却**状态（速率限制 / 超时 / 认证失败）或较长的**禁用**状态（计费 / 额度不足），OpenClaw 可能会暂时跳过它。要检查这一点，请运行 `openclaw models status --json` 并查看 `auth.unusableProfiles`。调优项：`auth.cooldowns.billingBackoffHours*`。

    速率限制冷却时间可以按模型划分。某个配置文件
    即使在某个模型上处于冷却中，仍然可能对同一提供商上的兄弟模型可用，
    而计费 / 禁用窗口仍会阻止整个配置文件。

    你还可以通过 CLI 设置**按智能体**的顺序覆盖（存储在该智能体的 `auth-state.json` 中）：

    ```bash
    # 默认使用已配置的默认智能体（省略 --agent）
    openclaw models auth order get --provider anthropic

    # 将轮换锁定到单个配置文件（只尝试这个）
    openclaw models auth order set --provider anthropic anthropic:default

    # 或设置显式顺序（提供商内部回退）
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # 清除覆盖（回退到配置 auth.order / round-robin）
    openclaw models auth order clear --provider anthropic
    ```

    如果要指定特定智能体：

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    要验证实际会尝试什么，请使用：

    ```bash
    openclaw models status --probe
    ```

    如果某个已存储配置文件未包含在显式顺序中，probe 会为该配置文件报告
    `excluded_by_auth_order`，而不是静默尝试它。

  </Accordion>

  <Accordion title="OAuth 和 API 密钥有什么区别？">
    OpenClaw 两者都支持：

    - **OAuth** 通常会利用订阅访问权限（在适用情况下）。
    - **API keys** 使用按 token 计费。

    向导明确支持 Anthropic Claude CLI、OpenAI Codex OAuth 和 API keys。

  </Accordion>
</AccordionGroup>

## 相关内容

- [常见问题](/zh-CN/help/faq) —— 主常见问题
- [常见问题——快速开始与首次运行设置](/zh-CN/help/faq-first-run)
- [模型选择](/zh-CN/concepts/model-providers)
- [模型故障转移](/zh-CN/concepts/model-failover)

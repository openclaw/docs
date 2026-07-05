---
read_when:
    - 选择或切换模型，配置别名
    - 调试模型故障转移 / “所有模型均失败”
    - 理解身份验证配置文件以及如何管理它们
sidebarTitle: Models FAQ
summary: 常见问题：模型默认值、选择、别名、切换、故障转移和凭证配置档
title: 常见问题：模型和凭证
x-i18n:
    generated_at: "2026-07-05T11:21:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 071e89c01120849179d3bc372153eb2c76a0fa4e93846df42920f0d961d597df
    source_path: help/faq-models.md
    workflow: 16
---

  模型和凭证配置文件问答。有关设置、会话、Gateway 网关、渠道和
  故障排除，请参阅主 [常见问题](/zh-CN/help/faq)。

  ## Models：默认值、选择、别名、切换

  <AccordionGroup>
  <Accordion title='什么是“默认模型”？'>
    使用以下项设置：

    ```text
    agents.defaults.model.primary
    ```

    模型是 `provider/model` 引用（例如：`openai/gpt-5.5`、
    `anthropic/claude-sonnet-4-6`）。始终显式设置 `provider/model`。如果
    省略提供商，OpenClaw 会先尝试匹配别名，然后尝试该模型 ID 的唯一
    已配置提供商匹配，最后回退到已配置的默认提供商（已弃用的兼容路径）。如果该
    提供商不再具有已配置的默认模型，OpenClaw 会回退到第一个已配置的
    提供商/模型，而不是陈旧的默认值。

  </Accordion>

  <Accordion title="你推荐什么模型？">
    使用你的提供商栈提供的最强最新一代模型，
    尤其是用于启用工具或处理不可信输入的智能体时；较弱或
    过度量化的模型更容易受到提示注入和不安全
    行为影响（请参阅 [安全](/zh-CN/gateway/security)）。按智能体角色将更便宜的模型路由到
    常规/低风险聊天。

    按智能体路由模型，并使用子智能体并行处理长任务（每个
    子智能体都会消耗自己的 token）。请参阅 [Models](/zh-CN/concepts/models)、
    [子智能体](/zh-CN/tools/subagents)、[MiniMax](/zh-CN/providers/minimax) 和
    [本地模型](/zh-CN/gateway/local-models)。

  </Accordion>

  <Accordion title="如何在不清空配置的情况下切换模型？">
    只更改模型字段，避免完整替换配置。

    - 聊天中的 `/model`（按会话，请参阅 [斜杠命令](/zh-CN/tools/slash-commands)）
    - `openclaw models set ...`（仅更新模型配置）
    - `openclaw configure --section model`（交互式）
    - 直接编辑 `~/.openclaw/openclaw.json` 中的 `agents.defaults.model`

    对于 RPC 编辑，请先用 `config.schema.lookup` 检查（规范化
    路径、浅层 schema 文档、子项摘要），然后优先使用 `config.patch`，
    而不是用部分对象调用 `config.apply`。如果你确实覆盖了配置，
    请从备份恢复，或运行 `openclaw doctor` 修复。

    文档：[Models](/zh-CN/concepts/models)、[配置](/zh-CN/cli/configure)、
    [配置](/zh-CN/cli/config)、[Doctor](/zh-CN/gateway/doctor)。

  </Accordion>

  <Accordion title="我可以使用自托管模型（llama.cpp、vLLM、Ollama）吗？">
    可以，Ollama 是最简单的路径。快速设置：

    1. 从 `https://ollama.com/download` 安装 Ollama
    2. 拉取本地模型，例如 `ollama pull gemma4`
    3. 如果也要使用云端模型，运行 `ollama signin`
    4. 运行 `openclaw onboard`，选择 `Ollama`，然后选择 `Local` 或 `Cloud + Local`

    `Cloud + Local` 会提供云端模型以及你的本地 Ollama 模型；
    `kimi-k2.5:cloud` 等云端模型无需本地拉取。手动切换：
    `openclaw models list`，然后 `openclaw models set ollama/<model>`。

    较小/大量量化的模型更容易受到提示注入影响。
    对任何具有工具访问权限的 Bot 使用大型模型；如果仍然使用小模型，
    请启用沙箱隔离和严格的工具 allowlist。

    文档：[Ollama](/zh-CN/providers/ollama)、[本地模型](/zh-CN/gateway/local-models)、
    [模型提供商](/zh-CN/concepts/model-providers)、[安全](/zh-CN/gateway/security)、
    [沙箱隔离](/zh-CN/gateway/sandboxing)。

  </Accordion>

  <Accordion title="如何即时切换模型（无需重启）？">
    将 `/model <name>` 作为独立消息发送。请参阅
    [斜杠命令](/zh-CN/tools/slash-commands) 获取完整命令列表，包括编号选择器（`/model`、`/model
    list`、`/model 3`）、用于清除会话覆盖的 `/model default`，以及
    用于查看端点/API 模式详情的 `/model status`。

    使用 `@profile` 为每个会话强制指定凭证配置文件：

    ```text
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    若要取消通过 `@profile` 固定的配置文件，请在不带该后缀的情况下重新运行 `/model`
    （例如 `/model anthropic/claude-opus-4-6`），或从
    `/model` 中选择默认值。使用 `/model status` 确认当前活动的凭证配置文件。

  </Accordion>

  <Accordion title="如果两个提供商公开了相同的模型 ID，/model 会使用哪一个？">
    `/model provider/model` 会选择该精确提供商路由。例如，
    `qianfan/deepseek-v4-flash` 和 `deepseek/deepseek-v4-flash` 是不同的
    引用，即使模型 ID 相同；OpenClaw 不会在裸 ID 匹配时静默切换
    提供商。

    用户选择的 `/model` 引用在回退时是严格的：如果该
    提供商/模型不可用，回复会以可见方式失败，而不是
    回退到 `agents.defaults.model.fallbacks`。已配置的回退链
    仍适用于已配置默认值、cron 任务主模型和
    自动选择的回退状态。当允许非会话覆盖运行
    使用回退时，OpenClaw 会先尝试请求的提供商/模型，然后
    尝试已配置的回退，最后尝试已配置的主模型；因此重复的裸
    模型 ID 永远不会直接跳回默认提供商。

    请参阅 [Models](/zh-CN/concepts/models) 和 [模型故障转移](/zh-CN/concepts/model-failover)。

  </Accordion>

  <Accordion title="我可以将 GPT 5.5 用于日常任务，将 Codex 5.5 用于编码吗？">
    可以，模型选择和运行时选择是分开的：

    - **Native Codex 编码智能体：**将 `agents.defaults.model.primary` 设置为
      `openai/gpt-5.5`。使用 `openclaw models auth login --provider
      openai` 登录 ChatGPT/Codex 订阅凭证。
    - **智能体循环之外的直接 OpenAI API 任务：**为图像、嵌入、语音、实时和其他
      非智能体 OpenAI API 表面配置
      `OPENAI_API_KEY`。
    - **OpenAI 智能体 API-key 凭证：**`/model openai/gpt-5.5`，并使用有序的
      `openai` API-key 配置文件。
    - **子智能体：**将编码任务路由到专注于 Codex 的智能体，并使用其
      自己的 `openai/gpt-5.5` 模型。

    请参阅 [Models](/zh-CN/concepts/models) 和 [斜杠命令](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何为 GPT 5.5 配置快速模式？">
    - **按会话：**在使用 `openai/gpt-5.5` 时发送 `/fast on`。
    - **按模型默认值：**将
      `agents.defaults.models["openai/gpt-5.5"].params.fastMode` 设置为 `true`。
    - **自动截止：**`/fast auto` 或 `params.fastMode: "auto"` 会让新的
      模型调用在截止前以快速模式运行，然后让后续重试、回退、
      工具结果或续写调用在不使用快速模式的情况下运行。截止时间默认为
      60 秒；可在模型上用 `params.fastAutoOnSeconds` 覆盖。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: "auto",
                fastAutoOnSeconds: 30,
              },
            },
          },
        },
      },
    }
    ```

    快速模式会在原生 OpenAI Responses 请求上映射到 `service_tier = "priority"`；
    现有 `service_tier` 值会保留，快速模式不会
    重写 `reasoning` 或 `text.verbosity`。会话 `/fast` 覆盖优先于
    配置默认值。

    请参阅 [思考和快速模式](/zh-CN/tools/thinking)，以及
    [OpenAI](/zh-CN/providers/openai) 提供商页面上高级配置下的快速模式部分。

  </Accordion>

  <Accordion title='为什么我看到“Model ... is not allowed”，然后没有回复？'>
    如果设置了 `agents.defaults.models`，它会成为
    `/model` 和会话覆盖的 **allowlist**。选择该列表之外的模型会返回
    以下内容，而不是正常回复：

    ```text
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    修复方式：将精确模型添加到 `agents.defaults.models`，为动态目录添加
    `"provider/*": {}` 这样的提供商通配符，移除
    allowlist，或从 `/model list` 中选择模型。如果命令还
    包含 `--runtime codex`，请先更新 allowlist，然后重试
    相同的 `/model provider/model --runtime codex` 命令。

  </Accordion>

  <Accordion title='为什么我看到“Unknown model: minimax/MiniMax-M3”？'>
    如果你使用的是较旧的 OpenClaw 版本，请先升级（或从源码
    `main` 运行）并重启 Gateway 网关；`MiniMax-M3` 可能尚未在你
    已安装版本的目录中。否则，就是 MiniMax 提供商未
    配置（未找到提供商条目或凭证配置文件），因此模型无法
    解析。请参阅 [MiniMax](/zh-CN/providers/minimax) 提供商页面上的故障排查部分，
    获取完整修复检查清单、提供商/模型 ID 表和配置块示例。

  </Accordion>

  <Accordion title="我可以默认使用 MiniMax，并将 OpenAI 用于复杂任务吗？">
    可以。将 MiniMax 作为默认值，并按会话切换模型；回退
    用于错误，而不是用于“困难任务”，因此请使用 `/model` 或单独的智能体。

    **选项 A：按会话切换**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    然后 `/model gpt`。

    **选项 B：单独智能体**：智能体 A 默认使用 MiniMax，智能体 B
    默认使用 OpenAI；按智能体路由，或使用 `/agent` 切换。

    文档：[Models](/zh-CN/concepts/models)、[多 Agent 路由](/zh-CN/concepts/multi-agent)、
    [MiniMax](/zh-CN/providers/minimax)、[OpenAI](/zh-CN/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt 是内置快捷方式吗？">
    是，它们是内置简写，仅在目标模型存在于
    `agents.defaults.models` 时应用：

    | 别名 | 解析为 |
    | --- | --- |
    | `opus` | `anthropic/claude-opus-4-8` |
    | `sonnet` | `anthropic/claude-sonnet-4-6` |
    | `gpt` | `openai/gpt-5.4` |
    | `gpt-mini` | `openai/gpt-5.4-mini` |
    | `gpt-nano` | `openai/gpt-5.4-nano` |
    | `gemini` | `google/gemini-3.1-pro-preview` |
    | `gemini-flash` | `google/gemini-3-flash-preview` |
    | `gemini-flash-lite` | `google/gemini-3.1-flash-lite` |

    你自己定义的同名别名会覆盖内置别名。

  </Accordion>

  <Accordion title="如何定义/覆盖模型快捷方式（别名）？">
    别名位于 `agents.defaults.models.<modelId>.alias`：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
          },
        },
      },
    }
    ```

    然后 `/model sonnet`（或在支持时使用 `/<alias>`）会解析到该
    模型 ID。

  </Accordion>

  <Accordion title="如何添加来自 OpenRouter 或 Z.AI 等其他提供商的模型？">
    OpenRouter（按 token 付费；模型众多）：

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

    Z.AI (GLM) 模型：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5.1" },
          models: { "zai/glm-5.1": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    引用的提供商/模型缺少提供商密钥会引发运行时
    凭证错误（例如 `No API key found for provider "zai"`）。

    **添加新智能体后找不到提供商的 API key**

    新智能体的凭证存储为空；凭证按智能体存储，位置为：

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    修复：运行 `openclaw agents add <id>` 并在向导中配置凭证，或
    仅从主智能体的存储中复制可移植的静态 `api_key`/`token` 配置文件。对于 OAuth，在新智能体需要自己的
    账户时从该智能体登录。完整的 `agentDir` 复用和凭证共享规则请参阅
    [多 Agent 路由](/zh-CN/concepts/multi-agent) —— 绝不要在多个智能体之间复用
    `agentDir`。

  </Accordion>
</AccordionGroup>

## 模型故障转移和“All models failed”

<AccordionGroup>
  <Accordion title="故障转移如何工作？">
    两个阶段：

    1. 同一提供商内的**凭证配置文件轮换**。
    2. **模型回退**到 `agents.defaults.model.fallbacks` 中的下一个模型。

    冷却时间会应用到失败的配置文件（指数退避），因此当某个提供商被限流或临时失败时，OpenClaw
    仍能继续响应。

    限流桶覆盖的不只是普通的 `429`：`Too many concurrent
    requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai
    ... quota limit exceeded`、`resource exhausted`，以及周期性
    使用窗口限制（`weekly/monthly limit reached`）都会算作
    值得触发故障转移的限流。

    计费响应并不总是 `402`，而且某些 `402` 会留在
    临时/限流桶中，而不是进入计费通道。`401`/`403` 上的明确
    计费文本仍可路由到计费；提供商特定的
    文本匹配器（例如 OpenRouter `Key limit exceeded`）仍限定在其
    自己的提供商范围内。读起来像可重试使用窗口或
    组织/工作区花费限制（`daily limit reached, resets tomorrow`、
    `organization spending limit exceeded`）的 `402` 会被视为 `rate_limit`，而不是
    长时间计费禁用。

    上下文溢出错误完全不会走回退路径 —— 像
    `request_too_large`、`input exceeds the maximum number of tokens`、
    `input token count exceeds the maximum number of input tokens`、`input is
    too long for the model` 或 `ollama error: context length exceeded` 这样的特征会进入
    压缩/重试，而不是推进模型回退。

    通用服务器错误文本的范围比“任何包含 unknown/error
    的内容”更窄。确实算作故障转移信号的提供商范围临时形态包括：
    Anthropic 裸 `An unknown error occurred`、OpenRouter 裸
    `Provider returned error`、像 `Unhandled stop reason:
    error` 这样的停止原因错误、带临时服务器文本（`internal
    server error`、`unknown error, 520`、`upstream error`、`backend error`）的 JSON
    `api_error` 负载，以及在提供商上下文匹配时像
    `ModelNotReadyException` 这样的提供商忙碌错误。像 `LLM request failed
    with an unknown error.` 这样的通用内部回退文本保持保守，单独不会触发回退。

  </Accordion>

  <Accordion title='“No credentials found for profile anthropic:default”是什么意思？'>
    凭证配置文件 ID `anthropic:default` 在预期的凭证存储中没有凭证。

    **修复清单：**

    - 确认配置文件存放位置 —— 当前：
      `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`；旧版：
      `~/.openclaw/agent/*`（由 `openclaw doctor` 迁移）。
    - 确认 Gateway 网关加载了你的环境变量。仅在
      你的 shell 中设置的 `ANTHROPIC_API_KEY` 不会传递给通过 systemd/launchd 运行的 Gateway 网关 —— 请把它放入
      `~/.openclaw/.env` 或启用 `env.shellEnv`。
    - 确认你正在编辑正确的智能体 —— 多 Agent 设置会有
      多个 `auth-profiles.json` 文件。
    - 运行 `openclaw models status` 查看已配置的模型和提供商
      凭证状态。

    **对于“No credentials found for profile anthropic”（没有邮箱后缀）：**

    本次运行被固定到一个 Gateway 网关找不到的 Anthropic 配置文件。

    - 使用 Claude CLI：在 Gateway 网关主机上运行 `openclaw models auth login --provider anthropic
      --method cli --set-default`。
    - 如果更想使用 API key：在 Gateway 网关主机上的
      `~/.openclaw/.env` 中放入 `ANTHROPIC_API_KEY`，然后清除任何强制使用缺失配置文件的固定顺序：

      ```bash
      openclaw models auth order clear --provider anthropic
      ```

    - 远程模式：凭证配置文件位于 Gateway 网关机器上，而不是你的
      笔记本电脑上 —— 确认你是在那台机器上运行命令。

  </Accordion>

  <Accordion title="为什么它也尝试了 Google Gemini 并失败？">
    如果你的模型配置包含 Google Gemini 作为回退（或你
    切换到了 Gemini 简写），OpenClaw 会在回退期间尝试它。未配置
    Google 凭证会得到 `No API key found for provider
    "google"`。修复：添加 Google 凭证，或从
    `agents.defaults.model.fallbacks`/别名中移除 Google 模型。

    **LLM 请求被拒绝：需要 thinking 签名（Google Antigravity）**

    原因：会话历史中存在没有签名的 thinking 块（通常
    来自中止/部分流）；Google Antigravity 要求 thinking
    块带有签名。OpenClaw 会为 Google
    Antigravity Claude 去除未签名的 thinking 块；如果它仍然出现，请开始新会话或为该智能体设置
    `/thinking off`。

  </Accordion>
</AccordionGroup>

## 凭证配置文件：它们是什么以及如何管理

相关：[/concepts/oauth](/zh-CN/concepts/oauth)（OAuth 流程、令牌存储、多账户模式）

<AccordionGroup>
  <Accordion title="什么是凭证配置文件？">
    与提供商绑定的具名凭证记录（OAuth 或 API key），存储在：

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    在不导出密钥的情况下检查已保存的配置文件：`openclaw models auth
    list`（可选 `--provider <id>` 或 `--json`）。参阅
    [模型 CLI](/zh-CN/cli/models#auth-profiles)。

  </Accordion>

  <Accordion title="典型的配置文件 ID 是什么？">
    带提供商前缀：`anthropic:default`（没有邮箱身份时很常见）、OAuth 身份的 `anthropic:<email>`，或你
    选择的自定义 ID（例如 `anthropic:work`）。

  </Accordion>

  <Accordion title="我可以控制先尝试哪个凭证配置文件吗？">
    可以。`auth.order.<provider>` 配置按提供商设置轮换顺序
    （仅元数据 —— 不存储密钥）。

    OpenClaw 可能会跳过处于短暂**冷却**（限流、
    超时、凭证失败）或更长**禁用**状态
    （计费/余额不足）的配置文件。用 `openclaw models status
    --json` 检查并查看 `auth.unusableProfiles`。用
    `auth.cooldowns.billingBackoffHours*` 调整。限流冷却可以按模型限定 —— 一个模型上正在冷却的配置文件仍然可以服务同一提供商上的
    兄弟模型；计费/禁用窗口会阻止整个
    配置文件。

    设置每智能体的顺序覆盖（存储在该智能体的 `auth-state.json` 中）：

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic

    # Target a specific agent
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    验证实际会尝试什么：`openclaw models status --probe`。显式顺序中省略的
    已存储配置文件会报告 `excluded_by_auth_order`，而不是被静默尝试。

  </Accordion>

  <Accordion title="OAuth 和 API key 有什么区别？">
    - **OAuth / CLI 登录**通常在提供商支持时使用订阅访问。对于 Anthropic，OpenClaw 的 Claude CLI 后端
      使用 Claude Code `claude -p`，Anthropic 目前将其视为
      Agent SDK/程序化使用，并从订阅使用限制中扣除 ——
      当前计费暂停状态和来源链接请参阅 [Anthropic](/zh-CN/providers/anthropic)。
    - **API keys** 使用按令牌付费的计费方式。

    向导支持 Anthropic Claude CLI、OpenAI Codex OAuth 和 API
    keys。

  </Accordion>
</AccordionGroup>

## 相关

- [常见问题](/zh-CN/help/faq) —— 主常见问题
- [常见问题 —— 快速开始和首次运行设置](/zh-CN/help/faq-first-run)
- [模型选择](/zh-CN/concepts/model-providers)
- [模型故障转移](/zh-CN/concepts/model-failover)

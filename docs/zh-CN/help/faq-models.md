---
read_when:
    - 选择或切换模型，配置别名
    - 调试模型故障转移 / “所有模型均失败”
    - 了解凭证配置档案以及如何管理它们
sidebarTitle: Models FAQ
summary: 常见问题：模型默认值、选择、别名、切换、故障转移和凭证配置文件
title: 常见问题：模型和凭证
x-i18n:
    generated_at: "2026-06-28T20:42:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3bfff016fc8b5afff5dde2b939b7fa431aa5a0309aa2833e7dd4675b638ca225
    source_path: help/faq-models.md
    workflow: 16
---

  模型和认证配置档案问答。关于设置、会话、Gateway 网关、渠道和
  故障排除，请参阅主 [常见问题](/zh-CN/help/faq)。

  ## Models：默认值、选择、别名、切换

  <AccordionGroup>
  <Accordion title='什么是“默认模型”？'>
    OpenClaw 的默认模型就是你设置为以下值的模型：

    ```
    agents.defaults.model.primary
    ```

    模型以 `provider/model` 引用（例如：`openai/gpt-5.5` 或 `anthropic/claude-sonnet-4-6`）。如果省略提供商，OpenClaw 会先尝试别名，然后尝试与该精确模型 id 唯一匹配的已配置提供商，最后才会回退到已配置的默认提供商，这是一个已弃用的兼容路径。如果该提供商不再公开已配置的默认模型，OpenClaw 会回退到第一个已配置的提供商/模型，而不是暴露一个已移除提供商的过期默认值。你仍然应该**显式**设置 `provider/model`。

  </Accordion>

  <Accordion title="你推荐什么模型？">
    **推荐默认值：**使用你的提供商栈中可用的最强最新一代模型。
    **对于启用工具或处理不受信任输入的智能体：**优先考虑模型能力，而不是成本。
    **对于日常/低风险聊天：**使用更便宜的备用模型，并按智能体角色路由。

    MiniMax 有自己的文档：[MiniMax](/zh-CN/providers/minimax) 和
    [本地模型](/zh-CN/gateway/local-models)。

    经验法则：对高风险工作使用**你能负担得起的最佳模型**，对日常聊天或摘要使用更便宜的
    模型。你可以按智能体路由模型，并使用子智能体来
    并行处理长任务（每个子智能体都会消耗 token）。请参阅 [Models](/zh-CN/concepts/models) 和
    [子智能体](/zh-CN/tools/subagents)。

    强警告：较弱/过度量化的模型更容易受到提示词
    注入和不安全行为的影响。请参阅 [安全](/zh-CN/gateway/security)。

    更多背景：[Models](/zh-CN/concepts/models)。

  </Accordion>

  <Accordion title="如何在不清空配置的情况下切换模型？">
    使用**模型命令**，或只编辑**模型**字段。避免整体替换配置。

    安全选项：

    - 聊天中的 `/model`（快速、按会话）
    - `openclaw models set ...`（只更新模型配置）
    - `openclaw configure --section model`（交互式）
    - 编辑 `~/.openclaw/openclaw.json` 中的 `agents.defaults.model`

    除非你有意替换整个配置，否则避免用部分对象调用 `config.apply`。
    对于 RPC 编辑，先用 `config.schema.lookup` 检查，并优先使用 `config.patch`。lookup 载荷会提供规范化路径、浅层 schema 文档/约束，以及直接子项摘要。
    用于部分更新。
    如果你确实覆盖了配置，请从备份恢复，或重新运行 `openclaw doctor` 修复。

    文档：[Models](/zh-CN/concepts/models)、[配置](/zh-CN/cli/configure)、[配置](/zh-CN/cli/config)、[Doctor](/zh-CN/gateway/doctor)。

  </Accordion>

  <Accordion title="我可以使用自托管模型（llama.cpp、vLLM、Ollama）吗？">
    可以。Ollama 是本地模型最简单的路径。

    最快设置：

    1. 从 `https://ollama.com/download` 安装 Ollama
    2. 拉取本地模型，例如 `ollama pull gemma4`
    3. 如果也想使用云模型，运行 `ollama signin`
    4. 运行 `openclaw onboard` 并选择 `Ollama`
    5. 选择 `Local` 或 `Cloud + Local`

    说明：

    - `Cloud + Local` 会提供云模型加你的本地 Ollama 模型
    - `kimi-k2.5:cloud` 等云模型不需要本地拉取
    - 对于手动切换，使用 `openclaw models list` 和 `openclaw models set ollama/<model>`

    安全注意事项：较小或高度量化的模型更容易受到提示词
    注入影响。对于任何可以使用工具的 Bot，我们强烈建议使用**大模型**。
    如果你仍想使用小模型，请启用沙箱隔离和严格的工具 allowlist。

    文档：[Ollama](/zh-CN/providers/ollama)、[本地模型](/zh-CN/gateway/local-models)、
    [模型提供商](/zh-CN/concepts/model-providers)、[安全](/zh-CN/gateway/security)、
    [沙箱隔离](/zh-CN/gateway/sandboxing)。

  </Accordion>

  <Accordion title="OpenClaw、Flawd 和 Krill 使用什么模型？">
    - 这些部署可能不同，并且可能随时间变化；没有固定的提供商推荐。
    - 使用 `openclaw models status` 检查每个 Gateway 网关上的当前运行时设置。
    - 对于安全敏感/启用工具的智能体，使用可用的最强最新一代模型。

  </Accordion>

  <Accordion title="如何即时切换模型（无需重启）？">
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

    这些是内置别名。自定义别名可以通过 `agents.defaults.models` 添加。

    你可以用 `/model`、`/model list` 或 `/model status` 列出可用模型。

    `/model`（以及 `/model list`）会显示一个紧凑的编号选择器。按编号选择：

    ```
    /model 3
    ```

    你也可以为提供商强制指定特定认证配置档案（按会话）：

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    提示：`/model status` 会显示哪个智能体处于活跃状态、正在使用哪个 `auth-profiles.json` 文件，以及下一步会尝试哪个认证配置档案。
    如果可用，它还会显示已配置的提供商端点（`baseUrl`）和 API 模式（`api`）。

    **如何取消固定我用 @profile 设置的配置档案？**

    重新运行 `/model`，但**不要**带 `@profile` 后缀：

    ```
    /model anthropic/claude-opus-4-6
    ```

    如果你想回到默认值，请从 `/model` 中选择它（或发送 `/model <default provider/model>`）。
    使用 `/model status` 确认哪个认证配置档案处于活跃状态。

  </Accordion>

  <Accordion title="如果两个提供商公开相同的模型 id，/model 会使用哪一个？">
    `/model provider/model` 会为该会话选择精确的提供商路由。

    例如，`qianfan/deepseek-v4-flash` 和 `deepseek/deepseek-v4-flash` 是不同的模型引用，尽管两者都包含 `deepseek-v4-flash`。OpenClaw 不应仅仅因为裸模型 id 匹配，就静默地从一个提供商切换到另一个。

    用户选择的 `/model` 引用对回退策略也是严格的。如果所选提供商/模型不可用，回复会以可见方式失败，而不是从 `agents.defaults.model.fallbacks` 回答。已配置的回退链仍适用于已配置的默认值、cron 作业主模型，以及自动选择的回退状态。

    如果从非会话覆盖启动的运行允许使用回退，OpenClaw 会先尝试请求的提供商/模型，然后尝试已配置的回退，最后才尝试已配置的主模型。这可以防止重复的裸模型 id 直接跳回默认提供商。

    请参阅 [Models](/zh-CN/concepts/models) 和 [模型故障转移](/zh-CN/concepts/model-failover)。

  </Accordion>

  <Accordion title="我可以把 GPT 5.5 用于日常任务，把 Codex 5.5 用于编码吗？">
    可以。将模型选择和运行时选择分开处理：

    - **Native Codex 编码智能体：**将 `agents.defaults.model.primary` 设置为 `openai/gpt-5.5`。当你想使用 ChatGPT/Codex 订阅认证时，用 `openclaw models auth login --provider openai` 登录。
    - **智能体循环之外的直接 OpenAI API 任务：**为图像、嵌入、语音、实时和其他非智能体 OpenAI API 表面配置 `OPENAI_API_KEY`。
    - **OpenAI 智能体 API key 认证：**使用 `/model openai/gpt-5.5`，并配合有序的 `openai` API key 配置档案。
    - **子智能体：**将编码任务路由到一个专注 Codex、拥有自己 `openai/gpt-5.5` 模型的智能体。

    请参阅 [Models](/zh-CN/concepts/models) 和 [斜杠命令](/zh-CN/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何为 GPT 5.5 配置快速模式？">
    使用会话开关或配置默认值：

    - **按会话：**当会话正在使用 `openai/gpt-5.5` 时发送 `/fast on`。
    - **按模型默认值：**将 `agents.defaults.models["openai/gpt-5.5"].params.fastMode` 设置为 `true`。
    - **自动截止：**使用 `/fast auto` 或 `params.fastMode: "auto"`，让新的模型调用在自动截止前以快速模式开始，然后让后续重试、回退、工具结果或续接调用在不使用快速模式的情况下开始。截止默认值为 60 秒；在活跃模型上设置 `params.fastAutoOnSeconds` 可以更改它。

    示例：

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

    对于 OpenAI，快速模式会映射到受支持原生 Responses 请求上的 `service_tier = "priority"`。会话 `/fast` 覆盖优先于配置默认值。Codex app-server 轮次只能在轮次开始时接收该层级，因此 `auto` 会应用到下一个由 OpenClaw 启动的模型轮次，而不是已经运行中的 app-server 轮次内部。

    请参阅 [思考和快速模式](/zh-CN/tools/thinking) 与 [OpenAI 快速模式](/zh-CN/providers/openai#fast-mode)。

  </Accordion>

  <Accordion title='为什么我会看到“Model ... is not allowed”，然后没有回复？'>
    如果设置了 `agents.defaults.models`，它就会成为 `/model` 和任何
    会话覆盖的 **allowlist**。选择不在该列表中的模型会返回：

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    该错误会被返回，**而不是**正常回复。修复方法：将精确模型添加到
    `agents.defaults.models`，为动态提供商目录添加诸如 `"provider/*": {}` 的提供商通配符，移除 allowlist，或从 `/model list` 中选择一个模型。
    如果命令还包含 `--runtime codex`，请先更新 allowlist，然后重试
    相同的 `/model provider/model --runtime codex` 命令。

  </Accordion>

  <Accordion title='为什么我会看到“Unknown model: minimax/MiniMax-M3”？'>
    这意味着**提供商未配置**（未找到 MiniMax 提供商配置或认证
    配置档案），因此无法解析该模型。

    修复清单：

    1. 升级到当前 OpenClaw 版本（或从源代码 `main` 运行），然后重启 Gateway 网关。
    2. 确保 MiniMax 已配置（向导或 JSON），或者 MiniMax 认证
       存在于环境变量/认证配置档案中，以便可注入匹配的提供商
       （`MINIMAX_API_KEY` 用于 `minimax`，`MINIMAX_OAUTH_TOKEN` 或存储的 MiniMax
       OAuth 用于 `minimax-portal`）。
    3. 为你的认证路径使用精确模型 id（区分大小写）：
       `minimax/MiniMax-M3`、`minimax/MiniMax-M2.7` 或
       `minimax/MiniMax-M2.7-highspeed` 用于 API key 设置，或者
       `minimax-portal/MiniMax-M3`、`minimax-portal/MiniMax-M2.7` 或
       `minimax-portal/MiniMax-M2.7-highspeed` 用于 OAuth 设置。
    4. 运行：

       ```bash
       openclaw models list
       ```

       并从列表中选择（或在聊天中使用 `/model list`）。

    请参阅 [MiniMax](/zh-CN/providers/minimax) 和 [Models](/zh-CN/concepts/models)。

  </Accordion>

  <Accordion title="我可以把 MiniMax 作为默认值，并用 OpenAI 处理复杂任务吗？">
    可以。使用 **MiniMax 作为默认值**，并在需要时**按会话**切换模型。
    回退用于**错误**，而不是“困难任务”，所以请使用 `/model` 或单独的智能体。

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

    然后：

    ```
    /model gpt
    ```

    **选项 B：单独的智能体**

    - 智能体 A 默认值：MiniMax
    - 智能体 B 默认值：OpenAI
    - 按智能体路由，或使用 `/agent` 切换

    文档：[Models](/zh-CN/concepts/models)、[多 Agent 路由](/zh-CN/concepts/multi-agent)、[MiniMax](/zh-CN/providers/minimax)、[OpenAI](/zh-CN/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt 是内置快捷方式吗？">
    是。OpenClaw 内置了一些默认简写（仅在模型存在于 `agents.defaults.models` 中时应用）：

    - `opus` → `anthropic/claude-opus-4-8`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite`

    如果你用相同名称设置自己的别名，你的值会优先。

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

    如果你引用了某个提供商/模型，但缺少所需的提供商密钥，你会收到运行时凭证错误（例如 `No API key found for provider "zai"`）。

    **添加新智能体后找不到提供商的 API key**

    这通常表示**新智能体**的凭证存储为空。凭证按智能体存储，并保存在：

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    修复选项：

    - 运行 `openclaw agents add <id>`，并在向导中配置凭证。
    - 或者只将可移植的静态 `api_key` / `token` 配置文件从主智能体的凭证存储复制到新智能体的凭证存储。
    - 对于 OAuth 配置文件，如果新智能体需要自己的账号，请从新智能体登录；否则 OpenClaw 可以读取默认/主智能体，而无需克隆刷新 token。

    不要在多个智能体之间复用 `agentDir`；这会导致凭证/会话冲突。

  </Accordion>
</AccordionGroup>

## 模型故障转移和“所有模型都失败”

<AccordionGroup>
  <Accordion title="故障转移如何工作？">
    故障转移分两个阶段发生：

    1. 同一提供商内的**凭证配置文件轮换**。
    2. **模型回退**到 `agents.defaults.model.fallbacks` 中的下一个模型。

    冷却会应用到失败的配置文件（指数退避），因此即使某个提供商被限流或暂时失败，OpenClaw 也可以继续响应。

    限流桶包含的不只是普通 `429` 响应。OpenClaw
    也会将 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、
    `workers_ai ... quota limit exceeded`、`resource exhausted` 以及周期性的
    用量窗口限制（`weekly/monthly limit reached`）等消息视为值得故障转移的
    限流。

    有些看起来像计费的响应并不是 `402`，而有些 HTTP `402`
    响应也会留在这个瞬时桶中。如果提供商在 `401` 或 `403` 上返回
    明确的计费文本，OpenClaw 仍然可以把它放在
    计费通道中，但特定于提供商的文本匹配器仍限定在拥有它们的
    提供商范围内（例如 OpenRouter 的 `Key limit exceeded`）。如果 `402`
    消息看起来像可重试的用量窗口或
    组织/工作区支出限制（`daily limit reached, resets tomorrow`、
    `organization spending limit exceeded`），OpenClaw 会把它视为
    `rate_limit`，而不是长期计费禁用。

    上下文溢出错误不同：诸如
    `request_too_large`、`input exceeds the maximum number of tokens`、
    `input token count exceeds the maximum number of input tokens`、
    `input is too long for the model` 或 `ollama error: context length
    exceeded` 之类的特征会留在压缩/重试路径上，而不是推进模型
    回退。

    通用服务器错误文本有意比“任何包含
    unknown/error 的内容”更窄。OpenClaw 确实会将提供商范围内的瞬时形态
    视为值得故障转移的超时/过载信号，例如 Anthropic 裸
    `An unknown error occurred`、OpenRouter 裸
    `Provider returned error`、类似 `Unhandled stop reason:
    error` 的停止原因错误、带瞬时服务器文本的 JSON `api_error` 载荷
    （`internal server error`、`unknown error, 520`、`upstream error`、`backend
    error`），以及类似 `ModelNotReadyException` 的提供商繁忙错误，前提是提供商上下文
    匹配。
    类似 `LLM request failed with an unknown
    error.` 的通用内部回退文本会保持保守，本身不会触发模型回退。

  </Accordion>

  <Accordion title='“找不到 profile anthropic:default 的凭证”是什么意思？'>
    这表示系统尝试使用凭证配置文件 ID `anthropic:default`，但无法在预期的凭证存储中找到它的凭证。

    **修复检查清单：**

    - **确认凭证配置文件存放位置**（新路径与旧路径）
      - 当前：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - 旧版：`~/.openclaw/agent/*`（由 `openclaw doctor` 迁移）
    - **确认你的环境变量已由 Gateway 网关加载**
      - 如果你在 shell 中设置了 `ANTHROPIC_API_KEY`，但通过 systemd/launchd 运行 Gateway 网关，它可能不会继承该变量。将它放入 `~/.openclaw/.env`，或启用 `env.shellEnv`。
    - **确保你正在编辑正确的智能体**
      - 多 Agent 设置意味着可能存在多个 `auth-profiles.json` 文件。
    - **对模型/凭证状态做完整性检查**
      - 使用 `openclaw models status` 查看已配置模型以及提供商是否已认证。

    **“找不到 profile anthropic 的凭证”的修复检查清单**

    这表示运行被固定到某个 Anthropic 凭证配置文件，但 Gateway 网关
    无法在其凭证存储中找到它。

    - **使用 Claude CLI**
      - 在 Gateway 网关主机上运行 `openclaw models auth login --provider anthropic --method cli --set-default`。
    - **如果你想改用 API key**
      - 在**Gateway 网关主机**上的 `~/.openclaw/.env` 中放入 `ANTHROPIC_API_KEY`。
      - 清除任何强制使用缺失配置文件的固定顺序：

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **确认你正在 Gateway 网关主机上运行命令**
      - 在远程模式下，凭证配置文件位于 Gateway 网关机器上，而不是你的笔记本电脑上。

  </Accordion>

  <Accordion title="为什么它也尝试了 Google Gemini 并失败？">
    如果你的模型配置将 Google Gemini 包含为回退（或你切换到了 Gemini 简写），OpenClaw 会在模型回退期间尝试它。如果你尚未配置 Google 凭证，你会看到 `No API key found for provider "google"`。

    修复：提供 Google 凭证，或者在 `agents.defaults.model.fallbacks` / 别名中移除/避免 Google 模型，这样回退就不会路由到那里。

    **LLM 请求被拒绝：需要 thinking 签名（Google Antigravity）**

    原因：会话历史包含**没有签名的 thinking 块**（通常来自
    中止/部分流）。Google Antigravity 要求 thinking 块带有签名。

    修复：OpenClaw 现在会为 Google Antigravity Claude 移除未签名的 thinking 块。如果仍然出现，请启动一个**新会话**，或为该智能体设置 `/thinking off`。

  </Accordion>
</AccordionGroup>

## 凭证配置文件：它们是什么以及如何管理

相关：[/concepts/oauth](/zh-CN/concepts/oauth)（OAuth 流程、token 存储、多账号模式）

<AccordionGroup>
  <Accordion title="什么是凭证配置文件？">
    凭证配置文件是绑定到提供商的具名凭证记录（OAuth 或 API key）。配置文件位于：

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    要在不输出密钥的情况下检查已保存的配置文件，请运行 `openclaw models auth list`（可选加上 `--provider <id>` 或 `--json`）。详见 [模型 CLI](/zh-CN/cli/models#auth-profiles)。

  </Accordion>

  <Accordion title="典型的配置文件 ID 有哪些？">
    OpenClaw 使用带提供商前缀的 ID，例如：

    - `anthropic:default`（没有电子邮件身份时常见）
    - `anthropic:<email>` 用于 OAuth 身份
    - 你选择的自定义 ID（例如 `anthropic:work`）

  </Accordion>

  <Accordion title="我能控制先尝试哪个凭证配置文件吗？">
    可以。配置支持配置文件的可选元数据，以及按提供商设置顺序（`auth.order.<provider>`）。这**不会**存储密钥；它会将 ID 映射到提供商/模式，并设置轮换顺序。

    如果某个配置文件处于短暂**冷却**（限流/超时/凭证失败）或更长的**禁用**状态（计费/额度不足），OpenClaw 可能会暂时跳过它。要检查这一点，请运行 `openclaw models status --json` 并查看 `auth.unusableProfiles`。调优项：`auth.cooldowns.billingBackoffHours*`。

    限流冷却可以按模型限定。某个配置文件如果正在为一个模型
    冷却，仍可用于同一提供商上的兄弟模型，
    而计费/禁用窗口仍会阻止整个配置文件。

    你也可以通过 CLI 设置**按智能体**的顺序覆盖（存储在该智能体的 `auth-state.json` 中）：

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile (only try this one)
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    要指定某个智能体：

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    要验证实际会尝试什么，请使用：

    ```bash
    openclaw models status --probe
    ```

    如果存储的配置文件被排除在显式顺序之外，probe 会为该配置文件报告
    `excluded_by_auth_order`，而不是静默尝试它。

  </Accordion>

  <Accordion title="OAuth 和 API key 有什么区别？">
    OpenClaw 同时支持两者：

    - **OAuth / CLI 登录**通常会在提供商支持时利用订阅访问。对于 Anthropic，OpenClaw 的 Claude CLI 后端使用
      Claude Code `claude -p`；Anthropic 目前将其视为 Agent
      SDK/程序化使用。Anthropic 已暂停 2026 年 6 月 15 日的单独 Agent
      SDK 额度变更，因此目前它仍会消耗订阅用量
      限额。请参阅 Anthropic 的 [Agent SDK 计划
      文章](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
      获取当前暂停通知。
    - **API key** 使用按 token 付费的计费方式。

    向导明确支持 Anthropic Claude CLI、OpenAI Codex OAuth 和 API key。

  </Accordion>
</AccordionGroup>

## 相关

- [常见问题](/zh-CN/help/faq) — 主要常见问题
- [常见问题 — 快速开始和首次运行设置](/zh-CN/help/faq-first-run)
- [模型选择](/zh-CN/concepts/model-providers)
- [模型故障转移](/zh-CN/concepts/model-failover)

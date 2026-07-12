---
read_when:
    - 你正在通过脚本或 CI 自动执行新手引导
    - 你需要特定提供商的非交互式示例
sidebarTitle: CLI automation
summary: OpenClaw CLI 的脚本化新手引导和 Agent 设置
title: CLI 自动化
x-i18n:
    generated_at: "2026-07-12T14:46:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: de3115fd0c675b92f22cf9c44ddd307a854e499c6f163235f991368429b2c152
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

使用 `openclaw onboard --non-interactive` 编写设置脚本。它要求使用 `--accept-risk`：非交互式设置可以在没有确认提示的情况下写入凭据和守护进程配置，因此该标志表示明确确认相关风险。

<Note>
`--json` 并不表示启用非交互模式。脚本需要明确传入 `--non-interactive --accept-risk`。
</Note>

## 非交互式基准示例

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-bootstrap \
  --skip-skills
```

添加 `--json` 可获得机器可读的摘要。

- `--gateway-port` 默认为 `18789`；仅在需要覆盖默认值时传入。
- `--skip-bootstrap` 跳过创建默认工作区文件，适用于预先填充自有工作区的自动化流程。
- `--secret-input-mode ref` 会在身份验证配置文件中存储由环境变量支持的引用（`{ source: "env", provider: "default", id: "<ENV_VAR>" }`），而不是明文密钥。在非交互式 `ref` 模式下，提供商环境变量必须已在进程环境中设置：如果传入内联密钥标志，但未设置与其匹配的环境变量，操作会立即失败。

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref
```

## 特定提供商示例

<AccordionGroup>
  <Accordion title="Anthropic API 密钥示例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Cloudflare AI Gateway 示例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "your-account-id" \
      --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Gemini 示例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Mistral 示例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Moonshot 示例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ollama 示例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="OpenCode 示例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-bind loopback
    ```
    对于 Go 目录，请改用 `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"`。
  </Accordion>
  <Accordion title="Synthetic 示例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Vercel AI Gateway 示例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Z.AI 示例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="自定义提供商示例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-bind loopback
    ```

    `--custom-api-key` 是可选的；某些端点不要求进行身份验证。如果省略，新手引导会检查环境中的 `CUSTOM_API_KEY`。`--custom-provider-id` 是可选的，省略时会根据基础 URL 自动派生。`--custom-compatibility` 默认为 `openai`（其他值：`openai-responses`、`anthropic`）。

    OpenClaw 会根据已知的视觉模型 ID 模式（`gpt-4o`、`claude-3/4`、`gemini`、`-vl`/`vision` 后缀及类似模式）推断图像输入支持。对于无法识别的视觉模型，添加 `--custom-image-input` 可强制启用图像输入，或添加 `--custom-text-input` 强制仅使用文本输入。

    引用模式变体，将 `apiKey` 存储为 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`：

    ```bash
    export CUSTOM_API_KEY="your-key"
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --secret-input-mode ref \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-bind loopback
    ```

  </Accordion>
</AccordionGroup>

Anthropic setup-token 身份验证仍受支持，但当本地 Claude CLI 已登录时，OpenClaw 会优先复用 Claude CLI。对于生产环境，建议使用 Anthropic API key。

## 添加另一个智能体

`openclaw agents add <name>` 会创建一个独立的智能体，它拥有自己的工作区、会话和身份验证配置文件。在不带 `--workspace`（且不带其他标志）的情况下运行此命令会启动交互式向导；传入 `--workspace`、`--model`、`--agent-dir`、`--bind` 或 `--non-interactive` 中的任意一个标志时，将以非交互方式运行，且必须同时提供 `--workspace`。

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

该命令写入的配置键（新智能体 ID 对应的 `agents.list[]` 条目）：

- `name`
- `workspace`
- `agentDir`
- `model`（仅当传入 `--model` 时）

注意：

- 默认工作区（在交互式向导中省略 `--workspace` 时）：`~/.openclaw/workspace-<agentId>`。
- `--bind <channel[:accountId]>` 可重复使用；添加绑定可将入站消息路由到新智能体（向导也可以通过交互方式完成此操作）。
- 智能体名称会规范化为有效的智能体 ID；`main` 为保留名称。

## 相关文档

- 新手引导中心：[新手引导（CLI）](/zh-CN/start/wizard)
- 完整参考：[CLI 设置参考](/zh-CN/start/wizard-cli-reference)
- 命令参考：[`openclaw onboard`](/zh-CN/cli/onboard)

---
read_when:
    - 你正在脚本或 CI 中自动化新手引导
    - 你需要针对特定提供商的非交互式示例
sidebarTitle: CLI automation
summary: OpenClaw CLI 的脚本化新手引导和 Agent 设置
title: CLI 自动化
x-i18n:
    generated_at: "2026-07-05T11:44:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9373e7e3815d349e13b98ab68338ff41e8ad3004b49c242acd6c3f8e114f9e3c
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

使用 `openclaw onboard --non-interactive` 编写设置脚本。它要求使用 `--accept-risk`：非交互式设置可以在没有确认提示的情况下写入凭证和守护进程配置，因此该标志是明确的风险确认。

<Note>
`--json` 并不表示非交互模式。请为脚本显式传入 `--non-interactive --accept-risk`。
</Note>

## 基线非交互式示例

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

添加 `--json` 以获得机器可读的摘要。

- `--gateway-port` 默认为 `18789`；仅在需要覆盖时传入。
- `--skip-bootstrap` 会跳过创建默认工作区文件，适用于会预先填充自己工作区的自动化。
- `--secret-input-mode ref` 会在凭证配置文件中存储由环境支持的引用（`{ source: "env", provider: "default", id: "<ENV_VAR>" }`），而不是明文密钥。在非交互式 `ref` 模式下，提供商环境变量必须已在进程环境中设置：如果传入内联密钥标志但未设置匹配的环境变量，会快速失败。

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref
```

## 提供商特定示例

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
  <Accordion title="Cloudflare AI Gateway 网关示例">
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
    如需 Go 目录，请改用 `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"`。
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
  <Accordion title="Vercel AI Gateway 网关示例">
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

    `--custom-api-key` 是可选的；某些端点不需要凭证。如果省略，新手引导会检查环境中的 `CUSTOM_API_KEY`。`--custom-provider-id` 是可选的，省略时会从基础 URL 自动派生。`--custom-compatibility` 默认为 `openai`（其他值：`openai-responses`、`anthropic`）。

    OpenClaw 会从已知的视觉模型 ID 模式推断图像输入支持（`gpt-4o`、`claude-3/4`、`gemini`、`-vl`/`vision` 后缀，以及类似模式）。添加 `--custom-image-input` 可为未识别的视觉模型强制启用，或添加 `--custom-text-input` 强制仅文本。

    Ref 模式变体，将 `apiKey` 存储为 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`：

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

Anthropic 设置令牌凭证仍受支持，但当本地 Claude CLI 登录可用时，OpenClaw 更倾向于复用 Claude CLI。对于生产环境，优先使用 Anthropic API 密钥。

## 添加另一个 agent

`openclaw agents add <name>` 会创建一个单独的 agent，并拥有自己的工作区、会话和凭证配置文件。不带 `--workspace`（且没有其他标志）运行它会启动交互式向导；传入 `--workspace`、`--model`、`--agent-dir`、`--bind` 或 `--non-interactive` 中任意一个都会以非交互方式运行，然后要求提供 `--workspace`。

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

它写入的配置键（新 agent ID 的 `agents.list[]` 条目）：

- `name`
- `workspace`
- `agentDir`
- `model`（仅在传入 `--model` 时）

说明：

- 默认工作区（在交互式向导中省略 `--workspace` 时）：`~/.openclaw/workspace-<agentId>`。
- `--bind <channel[:accountId]>` 可重复；添加绑定以将入站消息路由到新 agent（向导也可以交互式完成此操作）。
- agent 名称会规范化为有效的 agent ID；`main` 为保留值。

## 相关文档

- 新手引导中心：[新手引导（CLI）](/zh-CN/start/wizard)
- 完整参考：[CLI 设置参考](/zh-CN/start/wizard-cli-reference)
- 命令参考：[`openclaw onboard`](/zh-CN/cli/onboard)

---
read_when:
    - 你正在腳本或 CI 中自動化入門流程
    - 你需要特定提供者的非互動式範例
sidebarTitle: CLI automation
summary: OpenClaw 命令列介面的腳本化入門與代理設定
title: 命令列介面自動化
x-i18n:
    generated_at: "2026-07-05T11:44:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9373e7e3815d349e13b98ab68338ff41e8ad3004b49c242acd6c3f8e114f9e3c
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

使用 `openclaw onboard --non-interactive` 來編寫設定腳本。它需要 `--accept-risk`：非互動式設定可以在沒有確認提示的情況下寫入認證與常駐程式設定，因此此旗標是明確的風險確認。

<Note>
`--json` 不代表非互動模式。請為腳本明確傳入 `--non-interactive --accept-risk`。
</Note>

## 基準非互動式範例

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

加入 `--json` 可取得機器可讀的摘要。

- `--gateway-port` 預設為 `18789`；只有在需要覆寫時才傳入。
- `--skip-bootstrap` 會略過建立預設工作區檔案，適用於會預先填入自身工作區的自動化。
- `--secret-input-mode ref` 會在認證設定檔中儲存由 env 支援的參照（`{ source: "env", provider: "default", id: "<ENV_VAR>" }`），而不是明文金鑰。在非互動式 `ref` 模式中，提供者 env 變數必須已設定於處理程序環境中：若傳入內嵌金鑰旗標但沒有對應的 env 變數，會快速失敗。

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref
```

## 提供者專屬範例

<AccordionGroup>
  <Accordion title="Anthropic API key example">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Cloudflare AI Gateway example">
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
  <Accordion title="Gemini example">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Mistral example">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Moonshot example">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ollama example">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="OpenCode example">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-bind loopback
    ```
    如需 Go 目錄，請切換為 `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"`。
  </Accordion>
  <Accordion title="Synthetic example">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Vercel AI Gateway example">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Z.AI example">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Custom provider example">
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

    `--custom-api-key` 是選用的；部分端點不需要認證。若省略，入門設定會檢查 env 中的 `CUSTOM_API_KEY`。`--custom-provider-id` 是選用的，省略時會從基底 URL 自動衍生。`--custom-compatibility` 預設為 `openai`（其他值：`openai-responses`、`anthropic`）。

    OpenClaw 會根據已知的視覺模型 ID 模式推斷圖片輸入支援（`gpt-4o`、`claude-3/4`、`gemini`、`-vl`/`vision` 後綴，以及類似模式）。針對未辨識的視覺模型，加入 `--custom-image-input` 可強制啟用；或加入 `--custom-text-input` 可強制僅使用文字。

    Ref 模式變體，將 `apiKey` 儲存為 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`：

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

Anthropic setup-token 認證仍受支援，但當本機 Claude 命令列介面登入可用時，OpenClaw 偏好重用 Claude 命令列介面。正式環境建議使用 Anthropic API 金鑰。

## 新增另一個 agent

`openclaw agents add <name>` 會建立一個獨立的 agent，並具備自己的工作區、工作階段與認證設定檔。在沒有 `--workspace`（且沒有其他旗標）的情況下執行，會啟動互動式精靈；傳入 `--workspace`、`--model`、`--agent-dir`、`--bind` 或 `--non-interactive` 中任一項，會以非互動方式執行，接著要求提供 `--workspace`。

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

它寫入的設定鍵（新 agent ID 的 `agents.list[]` 項目）：

- `name`
- `workspace`
- `agentDir`
- `model`（只有在傳入 `--model` 時）

注意事項：

- 預設工作區（在互動式精靈中省略 `--workspace` 時）：`~/.openclaw/workspace-<agentId>`。
- `--bind <channel[:accountId]>` 可重複使用；新增繫結可將傳入訊息路由至新的 agent（精靈也可以互動式完成此操作）。
- agent 名稱會正規化為有效的 agent ID；`main` 為保留名稱。

## 相關文件

- 入門設定中心：[入門設定（命令列介面）](/zh-TW/start/wizard)
- 完整參考：[命令列介面設定參考](/zh-TW/start/wizard-cli-reference)
- 指令參考：[`openclaw onboard`](/zh-TW/cli/onboard)

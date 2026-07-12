---
read_when:
    - 你正在指令碼或 CI 中自動執行初始設定
    - 你需要特定供應商的非互動式範例
sidebarTitle: CLI automation
summary: OpenClaw 命令列介面的指令化新手引導與代理程式設定
title: 命令列介面自動化
x-i18n:
    generated_at: "2026-07-12T14:49:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: de3115fd0c675b92f22cf9c44ddd307a854e499c6f163235f991368429b2c152
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

使用 `openclaw onboard --non-interactive` 以指令碼執行設定。此命令需要 `--accept-risk`：非互動式設定可在沒有確認提示的情況下寫入認證資訊與常駐程式設定，因此此旗標用於明確確認你已知悉風險。

<Note>
`--json` 不代表啟用非互動模式。請在指令碼中明確傳入 `--non-interactive --accept-risk`。
</Note>

## 基本非互動式範例

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

加入 `--json` 以取得機器可讀的摘要。

- `--gateway-port` 預設為 `18789`；僅在需要覆寫時傳入。
- `--skip-bootstrap` 會略過建立預設工作區檔案，適用於會預先填入自有工作區的自動化流程。
- `--secret-input-mode ref` 會在驗證設定檔中儲存由環境變數支援的參照（`{ source: "env", provider: "default", id: "<ENV_VAR>" }`），而非明文金鑰。在非互動式 `ref` 模式中，供應商的環境變數必須已設定於程序環境中：若傳入行內金鑰旗標，卻未設定其對應的環境變數，命令會立即失敗。

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref
```

## 各供應商專屬範例

<AccordionGroup>
  <Accordion title="Anthropic API 金鑰範例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Cloudflare AI Gateway 範例">
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
  <Accordion title="Gemini 範例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Mistral 範例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Moonshot 範例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ollama 範例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="OpenCode 範例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-bind loopback
    ```
    若要使用 Go 目錄，請改用 `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"`。
  </Accordion>
  <Accordion title="Synthetic 範例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Vercel AI Gateway 範例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Z.AI 範例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="自訂供應商範例">
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

    `--custom-api-key` 為選用項目；部分端點不需要驗證。若省略，初始設定程序會檢查環境中的 `CUSTOM_API_KEY`。`--custom-provider-id` 為選用項目，省略時會根據基礎 URL 自動產生。`--custom-compatibility` 預設為 `openai`（其他值：`openai-responses`、`anthropic`）。

    OpenClaw 會根據已知的視覺模型 ID 模式推斷是否支援影像輸入（`gpt-4o`、`claude-3/4`、`gemini`、`-vl`/`vision` 後綴及類似模式）。若要為無法辨識的視覺模型強制啟用影像輸入，請加入 `--custom-image-input`；若要強制僅使用文字，請加入 `--custom-text-input`。

    參照模式變體，將 `apiKey` 儲存為 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`：

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

Anthropic setup-token 驗證仍受支援，但當本機已有 Claude CLI 登入時，OpenClaw 會優先重用 Claude CLI。若用於正式環境，請優先使用 Anthropic API 金鑰。

## 新增另一個代理程式

`openclaw agents add <name>` 會建立獨立的代理程式，並擁有自己的工作區、工作階段和驗證設定檔。不加 `--workspace`（且未使用其他旗標）執行時，會啟動互動式精靈；若傳入 `--workspace`、`--model`、`--agent-dir`、`--bind` 或 `--non-interactive` 中的任何一項，則會以非互動方式執行，此時必須提供 `--workspace`。

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

此命令寫入的設定鍵（新代理程式 ID 的 `agents.list[]` 項目）：

- `name`
- `workspace`
- `agentDir`
- `model`（僅在傳入 `--model` 時）

注意事項：

- 預設工作區（在互動式精靈中省略 `--workspace` 時）：`~/.openclaw/workspace-<agentId>`。
- `--bind <channel[:accountId]>` 可重複使用；新增繫結以將傳入訊息路由至新的代理程式（精靈也能以互動方式執行此操作）。
- 代理程式名稱會正規化為有效的代理程式 ID；`main` 為保留值。

## 相關文件

- 初始設定中心：[初始設定（命令列介面）](/zh-TW/start/wizard)
- 完整參考資料：[命令列介面設定參考資料](/zh-TW/start/wizard-cli-reference)
- 命令參考資料：[`openclaw onboard`](/zh-TW/cli/onboard)

---
read_when:
    - 你想要搭配 OpenClaw 使用 Hugging Face Inference
    - 你需要 HF 權杖環境變數或 CLI 認證選項
summary: Hugging Face Inference 設定（身分驗證 + 模型選擇）
title: Hugging Face（推論）
x-i18n:
    generated_at: "2026-04-30T03:31:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93b3049e8d42787acba12ec3ddf70603159251dae1d870047f8ffc9242f202a5
    source_path: providers/huggingface.md
    workflow: 16
---

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) 透過單一路由器 API 提供與 OpenAI 相容的聊天補全。你只需一個權杖，就能存取許多模型（DeepSeek、Llama 等）。OpenClaw 使用**與 OpenAI 相容的端點**（僅限聊天補全）；若要使用文字轉圖片、嵌入或語音，請直接使用 [HF 推論用戶端](https://huggingface.co/docs/api-inference/quicktour)。

- 提供者：`huggingface`
- 驗證：`HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN`（具備 **Make calls to Inference Providers** 的細粒度權杖）
- API：與 OpenAI 相容（`https://router.huggingface.co/v1`）
- 計費：單一 HF 權杖；[定價](https://huggingface.co/docs/inference-providers/pricing) 依照提供者費率，並提供免費級別。

## 開始使用

<Steps>
  <Step title="建立細粒度權杖">
    前往 [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained)，建立新的細粒度權杖。

    <Warning>
    權杖必須啟用 **Make calls to Inference Providers** 權限，否則 API 請求會被拒絕。
    </Warning>

  </Step>
  <Step title="執行上手流程">
    在提供者下拉選單中選擇 **Hugging Face**，然後在提示時輸入你的 API 金鑰：

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="選取預設模型">
    在 **預設 Hugging Face 模型**下拉選單中，挑選你想要的模型。當你有有效權杖時，清單會從 Inference API 載入；否則會顯示內建清單。你的選擇會儲存為預設模型。

    你也可以稍後在設定中設定或變更預設模型：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
        },
      },
    }
    ```

  </Step>
  <Step title="確認模型可用">
    ```bash
    openclaw models list --provider huggingface
    ```
  </Step>
</Steps>

### 非互動式設定

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

這會將 `huggingface/deepseek-ai/DeepSeek-R1` 設為預設模型。

## 模型 ID

模型參照使用 `huggingface/<org>/<model>` 形式（Hub 風格 ID）。下方清單來自 **GET** `https://router.huggingface.co/v1/models`；你的目錄可能包含更多項目。

| 模型                   | 參照（加上 `huggingface/` 前綴）    |
| ---------------------- | ----------------------------------- |
| DeepSeek R1            | `deepseek-ai/DeepSeek-R1`           |
| DeepSeek V3.2          | `deepseek-ai/DeepSeek-V3.2`         |
| Qwen3 8B               | `Qwen/Qwen3-8B`                     |
| Qwen2.5 7B Instruct    | `Qwen/Qwen2.5-7B-Instruct`          |
| Qwen3 32B              | `Qwen/Qwen3-32B`                    |
| Llama 3.3 70B Instruct | `meta-llama/Llama-3.3-70B-Instruct` |
| Llama 3.1 8B Instruct  | `meta-llama/Llama-3.1-8B-Instruct`  |
| GPT-OSS 120B           | `openai/gpt-oss-120b`               |
| GLM 4.7                | `zai-org/GLM-4.7`                   |
| Kimi K2.5              | `moonshotai/Kimi-K2.5`              |

<Tip>
你可以在任何模型 ID 後附加 `:fastest` 或 `:cheapest`。請在 [Inference Provider 設定](https://hf.co/settings/inference-providers)中設定你的預設順序；完整清單請參閱 [Inference Providers](https://huggingface.co/docs/inference-providers) 和 **GET** `https://router.huggingface.co/v1/models`。
</Tip>

## 進階設定

<AccordionGroup>
  <Accordion title="模型探索與上手下拉選單">
    OpenClaw 會直接呼叫 **Inference 端點**來探索模型：

    ```bash
    GET https://router.huggingface.co/v1/models
    ```

    （選用：傳送 `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` 或 `$HF_TOKEN` 以取得完整清單；某些端點在未驗證時會回傳子集。）回應為 OpenAI 風格的 `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`。

    當你設定 Hugging Face API 金鑰（透過上手流程、`HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN`）時，OpenClaw 會使用這個 GET 來探索可用的聊天補全模型。在**互動式設定**期間，輸入權杖後，你會看到一個**預設 Hugging Face 模型**下拉選單，內容來自該清單（或在請求失敗時使用內建目錄）。執行階段（例如 Gateway 啟動）若存在金鑰，OpenClaw 會再次呼叫 **GET** `https://router.huggingface.co/v1/models` 來重新整理目錄。清單會與內建目錄合併（用於內容視窗和成本等中繼資料）。如果請求失敗或未設定金鑰，則只會使用內建目錄。

  </Accordion>

  <Accordion title="模型名稱、別名和策略尾碼">
    - **來自 API 的名稱：** 當 API 回傳 `name`、`title` 或 `display_name` 時，模型顯示名稱會**從 GET /v1/models 補全**；否則會從模型 ID 推導（例如 `deepseek-ai/DeepSeek-R1` 會變成「DeepSeek R1」）。
    - **覆寫顯示名稱：** 你可以在設定中為每個模型設定自訂標籤，讓它在 CLI 和 UI 中以你想要的方式顯示：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (fast)" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheap)" },
          },
        },
      },
    }
    ```

    - **策略尾碼：** OpenClaw 內附的 Hugging Face 文件和輔助工具目前將這兩個尾碼視為內建策略變體：
      - **`:fastest`** — 最高吞吐量。
      - **`:cheapest`** — 每個輸出權杖的最低成本。

      你可以將這些新增為 `models.providers.huggingface.models` 中的獨立項目，或使用帶有尾碼的 `model.primary`。你也可以在 [Inference Provider 設定](https://hf.co/settings/inference-providers)中設定預設提供者順序（無尾碼 = 使用該順序）。

    - **設定合併：** 合併設定時，會保留 `models.providers.huggingface.models` 中現有的項目（例如 `models.json` 中的項目）。因此你在那裡設定的任何自訂 `name`、`alias` 或模型選項都會被保留。

  </Accordion>

  <Accordion title="環境與守護程式設定">
    如果 Gateway 以守護程式執行（launchd/systemd），請確保 `HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN` 可供該程序使用（例如在 `~/.openclaw/.env` 中，或透過 `env.shellEnv`）。

    <Note>
    OpenClaw 同時接受 `HUGGINGFACE_HUB_TOKEN` 和 `HF_TOKEN` 作為環境變數別名。任一個都可使用；如果兩者都已設定，`HUGGINGFACE_HUB_TOKEN` 優先。
    </Note>

  </Accordion>

  <Accordion title="設定：DeepSeek R1 搭配 Qwen 後備">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-R1",
            fallbacks: ["huggingface/Qwen/Qwen3-8B"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="設定：Qwen 搭配 cheapest 與 fastest 變體">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/Qwen/Qwen3-8B" },
          models: {
            "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
            "huggingface/Qwen/Qwen3-8B:cheapest": { alias: "Qwen3 8B (cheapest)" },
            "huggingface/Qwen/Qwen3-8B:fastest": { alias: "Qwen3 8B (fastest)" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="設定：DeepSeek + Llama + GPT-OSS 搭配別名">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.2",
            fallbacks: [
              "huggingface/meta-llama/Llama-3.3-70B-Instruct",
              "huggingface/openai/gpt-oss-120b",
            ],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.2": { alias: "DeepSeek V3.2" },
            "huggingface/meta-llama/Llama-3.3-70B-Instruct": { alias: "Llama 3.3 70B" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="設定：多個 Qwen 和 DeepSeek 搭配策略尾碼">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest" },
          models: {
            "huggingface/Qwen/Qwen2.5-7B-Instruct": { alias: "Qwen2.5 7B" },
            "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest": { alias: "Qwen2.5 7B (cheap)" },
            "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fast)" },
            "huggingface/meta-llama/Llama-3.1-8B-Instruct": { alias: "Llama 3.1 8B" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    所有提供者、模型參照和容錯移轉行為的概觀。
  </Card>
  <Card title="模型選擇" href="/zh-TW/concepts/models" icon="brain">
    如何選擇和設定模型。
  </Card>
  <Card title="Inference Providers 文件" href="https://huggingface.co/docs/inference-providers" icon="book">
    Hugging Face Inference Providers 官方文件。
  </Card>
  <Card title="設定" href="/zh-TW/gateway/configuration" icon="gear">
    完整設定參考。
  </Card>
</CardGroup>

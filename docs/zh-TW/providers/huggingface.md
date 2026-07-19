---
read_when:
    - 你想要搭配 OpenClaw 使用 Hugging Face Inference
    - 你需要 HF 權杖環境變數或命令列介面驗證選項
summary: Hugging Face 推論設定（驗證 + 模型選擇）
title: Hugging Face（推論）
x-i18n:
    generated_at: "2026-07-19T13:59:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 92c400b78c5ad2cc724ad4029560dccc5bc2006fdeae400fc6b58998e727e17c
    source_path: providers/huggingface.md
    workflow: 16
---

[Hugging Face 推論提供者](https://huggingface.co/docs/inference-providers)透過單一權杖，在許多託管模型（DeepSeek、Llama 等）前提供與 OpenAI 相容的聊天完成路由器。OpenClaw **僅與聊天完成端點**通訊；若要使用文字轉圖片、嵌入或語音功能，請直接使用 [HF 推論用戶端](https://huggingface.co/docs/api-inference/quicktour)。

| 屬性         | 值                                                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| 提供者 ID    | `huggingface`                                                                                                         |
| 外掛         | 隨附（預設啟用，無須安裝步驟）                                                                                            |
| 驗證環境變數 | `HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN`（細粒度權杖）                                                                     |
| API          | 與 OpenAI 相容（`https://router.huggingface.co/v1`）                                                                                       |
| 計費         | 單一 HF 權杖；[價格](https://huggingface.co/docs/inference-providers/pricing)依提供者費率計算，並提供免費方案               |

## 開始使用

<Steps>
  <Step title="建立細粒度權杖">
    前往 [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained)，並建立新的細粒度權杖。

    <Warning>
    權杖必須啟用 **Make calls to Inference Providers** 權限，否則 API 請求會遭到拒絕。
    </Warning>

  </Step>
  <Step title="執行初始設定">
    在提供者下拉式選單中選擇 **Hugging Face**，然後在出現提示時輸入 API 金鑰：

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="選擇預設模型">
    在 **Default Hugging Face model** 下拉式選單中選擇模型。權杖有效時，清單會從推論 API 載入；否則 OpenClaw 會顯示下方的內建目錄。你的選擇會儲存為 `agents.defaults.model.primary`：

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

將 `huggingface/deepseek-ai/DeepSeek-R1` 設為預設模型。

## 模型 ID

模型參照使用 `huggingface/<org>/<model>` 格式（Hub 樣式 ID）。OpenClaw 的內建目錄：

| 模型          | 參照（前綴為 `huggingface/`） |
| ------------- | ---------------------------------- |
| DeepSeek R1   | `deepseek-ai/DeepSeek-R1`                 |
| DeepSeek V3.1 | `deepseek-ai/DeepSeek-V3.1`                 |
| GPT-OSS 120B  | `openai/gpt-oss-120b`                 |

<Tip>
權杖有效時，OpenClaw 也會在初始設定期間與閘道啟動時，透過 **GET** `https://router.huggingface.co/v1/models` 探索其他所有模型，因此你的目錄可包含遠多於上述三個模型的項目。你可以將 `:fastest` 或 `:cheapest` 附加至任何模型 ID；HF 的路由器會將請求路由至相符的推論提供者。請在[推論提供者設定](https://hf.co/settings/inference-providers)中設定預設提供者順序。
</Tip>

## 進階設定

<AccordionGroup>
  <Accordion title="模型探索與初始設定下拉式選單">
    OpenClaw 使用以下方式探索模型：

    ```bash
    GET https://router.huggingface.co/v1/models
    Authorization: Bearer $HUGGINGFACE_HUB_TOKEN   # 或 $HF_TOKEN
    ```

    回應採用 OpenAI 樣式：`{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`。

    設定金鑰後（透過初始設定、`HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN`），互動式設定期間的 **Default Hugging Face model** 下拉式選單會由此端點填入。閘道啟動時會重複相同的呼叫，以重新整理目錄。探索到的模型會與上述內建目錄合併（ID 相符時，用於內容範圍和成本等中繼資料）。若請求失敗、未傳回資料，或未設定金鑰，OpenClaw 會僅回復使用內建目錄。

    若要停用探索但不移除提供者：

    ```bash
    openclaw config set plugins.entries.huggingface.config.discovery.enabled false
    ```

  </Accordion>

  <Accordion title="模型名稱、別名與政策後綴">
    - **API 提供的名稱：**探索到的模型會在存在時使用 API 的 `name`、`title` 或 `display_name`；否則 OpenClaw 會從模型 ID 衍生名稱（例如 `deepseek-ai/DeepSeek-R1` 會成為「DeepSeek R1」）。
    - **覆寫顯示名稱：**在設定中為每個模型設定自訂標籤：

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

    - **政策後綴：**`:fastest` 與 `:cheapest` 是 HF 路由器的慣例，並非 OpenClaw 會改寫的內容：後綴會作為模型 ID 的一部分原樣傳送，而 HF 的路由器會選擇相符的推論提供者。如果你希望每個後綴都有不同的別名，請將每個變體新增為 `models.providers.huggingface.models` 下的個別項目（或新增至 `model.primary`）。
    - **設定合併：**設定合併時會保留 `models.providers.huggingface.models` 中的現有項目（例如 `models.json` 中的項目），因此你在該處設定的任何自訂 `name`、`alias` 或模型選項，都會在重新啟動後繼續保留。

  </Accordion>

  <Accordion title="環境與常駐程式設定">
    若閘道以常駐程式（launchd/systemd）方式執行，請確保該程序可存取 `HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN`（例如在 `~/.openclaw/.env` 中設定，或透過 `env.shellEnv` 提供）。

    <Note>
    OpenClaw 同時接受 `HUGGINGFACE_HUB_TOKEN` 與 `HF_TOKEN`。若兩者皆已設定，則以 `HUGGINGFACE_HUB_TOKEN` 為優先。
    </Note>

  </Accordion>

  <Accordion title="設定：DeepSeek R1 搭配後援模型">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-R1",
            fallbacks: ["huggingface/openai/gpt-oss-120b"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="設定：DeepSeek 搭配最低成本與最快變體">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheapest)" },
            "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fastest)" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="設定：DeepSeek + GPT-OSS 搭配別名">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.1",
            fallbacks: ["huggingface/openai/gpt-oss-120b"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.1": { alias: "DeepSeek V3.1" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    所有提供者、模型參照與容錯移轉行為的概覽。
  </Card>
  <Card title="模型選擇" href="/zh-TW/concepts/models" icon="brain">
    如何選擇及設定模型。
  </Card>
  <Card title="推論提供者文件" href="https://huggingface.co/docs/inference-providers" icon="book">
    Hugging Face 推論提供者的官方文件。
  </Card>
  <Card title="設定" href="/zh-TW/gateway/configuration" icon="gear">
    完整設定參考。
  </Card>
</CardGroup>

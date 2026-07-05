---
read_when:
    - 您想要搭配 OpenClaw 使用 Hugging Face Inference
    - 你需要 HF token 環境變數或命令列介面驗證選項
summary: Hugging Face Inference 設定（驗證 + 模型選擇）
title: Hugging Face（推論）
x-i18n:
    generated_at: "2026-07-05T11:37:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4e0d98c844c053484559254a0bdf4258c3d39954ac5804cdb0d081a651b89df
    source_path: providers/huggingface.md
    workflow: 16
---

[Hugging Face 推論提供者](https://huggingface.co/docs/inference-providers) 會在許多託管模型（DeepSeek、Llama 等）前方，以單一權杖公開相容於 OpenAI 的聊天補全路由器。OpenClaw **只會呼叫聊天補全端點**；若要使用文字轉圖片、嵌入或語音，請直接使用 [HF 推論用戶端](https://huggingface.co/docs/api-inference/quicktour)。

| 屬性         | 值                                                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| 提供者 ID    | `huggingface`                                                                                                               |
| 外掛         | 內建（預設啟用，無需安裝步驟）                                                                                              |
| 驗證環境變數 | `HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN`（細粒度權杖）                                                                          |
| API          | 相容於 OpenAI（`https://router.huggingface.co/v1`）                                                                          |
| 計費         | 單一 HF 權杖；[定價](https://huggingface.co/docs/inference-providers/pricing) 依提供者費率計算，並提供免費層級 |

## 開始使用

<Steps>
  <Step title="建立細粒度權杖">
    前往 [Hugging Face 設定權杖](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained)，並建立新的細粒度權杖。

    <Warning>
    權杖必須啟用 **Make calls to Inference Providers** 權限，否則 API 請求會被拒絕。
    </Warning>

  </Step>
  <Step title="執行初始設定">
    在提供者下拉選單中選擇 **Hugging Face**，然後在提示時輸入你的 API 金鑰：

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="選擇預設模型">
    在 **預設 Hugging Face 模型** 下拉選單中選擇模型。當你的權杖有效時，清單會從 Inference API 載入；否則 OpenClaw 會顯示下方的內建目錄。你的選擇會儲存為 `agents.defaults.model.primary`：

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

模型參照使用 `huggingface/<org>/<model>` 形式（Hub 風格 ID）。OpenClaw 的內建目錄：

| 模型                         | 參照（加上 `huggingface/` 前綴）       |
| ---------------------------- | ----------------------------------------- |
| DeepSeek R1                  | `deepseek-ai/DeepSeek-R1`                 |
| DeepSeek V3.1                | `deepseek-ai/DeepSeek-V3.1`               |
| GPT-OSS 120B                 | `openai/gpt-oss-120b`                     |
| Llama 3.3 70B Instruct Turbo | `meta-llama/Llama-3.3-70B-Instruct-Turbo` |

<Tip>
當你的權杖有效時，OpenClaw 也會在初始設定期間與閘道啟動時，從 **GET** `https://router.huggingface.co/v1/models` 探索任何其他模型，因此你的目錄可以包含遠多於上述四個模型的項目。你可以在任何模型 ID 後附加 `:fastest` 或 `:cheapest`；HF 的路由器會路由到相符的推論提供者。請在 [推論提供者設定](https://hf.co/settings/inference-providers) 中設定你的預設提供者順序。
</Tip>

## 進階設定

<AccordionGroup>
  <Accordion title="模型探索與初始設定下拉選單">
    OpenClaw 會使用以下方式探索模型：

    ```bash
    GET https://router.huggingface.co/v1/models
    Authorization: Bearer $HUGGINGFACE_HUB_TOKEN   # or $HF_TOKEN
    ```

    回應採 OpenAI 風格：`{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`。

    設定金鑰後（初始設定、`HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN`），互動式設定期間的 **預設 Hugging Face 模型** 下拉選單會由此端點填入。閘道啟動時會重複相同呼叫以重新整理目錄。探索到的模型會與上方內建目錄合併（當 ID 相符時，用於內容視窗與成本等中繼資料）。如果請求失敗、沒有回傳資料，或未設定金鑰，OpenClaw 只會退回使用內建目錄。

    停用探索但不移除提供者：

    ```bash
    openclaw config set plugins.entries.huggingface.config.discovery.enabled false
    ```

  </Accordion>

  <Accordion title="模型名稱、別名與策略後綴">
    - **來自 API 的名稱：** 探索到的模型會在存在時使用 API 的 `name`、`title` 或 `display_name`；否則 OpenClaw 會從模型 ID 衍生名稱（例如 `deepseek-ai/DeepSeek-R1` 會變成「DeepSeek R1」）。
    - **覆寫顯示名稱：** 在設定中為每個模型設定自訂標籤：

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

    - **策略後綴：** `:fastest` 與 `:cheapest` 是 HF 路由器慣例，不是 OpenClaw 會改寫的內容：後綴會作為模型 ID 的一部分原樣送出，而 HF 的路由器會選擇相符的推論提供者。如果你想為每個後綴使用不同別名，請將每個變體以自己的項目加入 `models.providers.huggingface.models`（或加入 `model.primary`）。
    - **設定合併：** `models.providers.huggingface.models` 中既有的項目（例如 `models.json` 中的項目）會在設定合併時保留，因此你在那裡設定的任何自訂 `name`、`alias` 或模型選項都會在重新啟動後保留。

  </Accordion>

  <Accordion title="環境與精靈設定">
    如果閘道以精靈形式執行（launchd/systemd），請確認 `HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN` 可供該程序使用（例如放在 `~/.openclaw/.env` 中，或透過 `env.shellEnv`）。

    <Note>
    OpenClaw 同時接受 `HUGGINGFACE_HUB_TOKEN` 與 `HF_TOKEN`。如果兩者都有設定，`HUGGINGFACE_HUB_TOKEN` 會優先使用。
    </Note>

  </Accordion>

  <Accordion title="設定：DeepSeek R1 搭配備援">
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

  <Accordion title="設定：DeepSeek 搭配 cheapest 與 fastest 變體">
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

  <Accordion title="設定：DeepSeek + Llama + GPT-OSS 搭配別名">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.1",
            fallbacks: [
              "huggingface/meta-llama/Llama-3.3-70B-Instruct-Turbo",
              "huggingface/openai/gpt-oss-120b",
            ],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.1": { alias: "DeepSeek V3.1" },
            "huggingface/meta-llama/Llama-3.3-70B-Instruct-Turbo": { alias: "Llama 3.3 70B Turbo" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
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
    所有提供者、模型參照與容錯移轉行為的概覽。
  </Card>
  <Card title="模型選擇" href="/zh-TW/concepts/models" icon="brain">
    如何選擇與設定模型。
  </Card>
  <Card title="推論提供者文件" href="https://huggingface.co/docs/inference-providers" icon="book">
    官方 Hugging Face Inference Providers 文件。
  </Card>
  <Card title="設定" href="/zh-TW/gateway/configuration" icon="gear">
    完整設定參考。
  </Card>
</CardGroup>

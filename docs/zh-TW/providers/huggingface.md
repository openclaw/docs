---
read_when:
    - 您想搭配 OpenClaw 使用 Hugging Face Inference
    - 你需要設定 HF 權杖環境變數，或選擇使用命令列介面驗證
summary: Hugging Face 推論設定（驗證 + 模型選擇）
title: Hugging Face（推論）
x-i18n:
    generated_at: "2026-07-11T21:44:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4e0d98c844c053484559254a0bdf4258c3d39954ac5804cdb0d081a651b89df
    source_path: providers/huggingface.md
    workflow: 16
---

[Hugging Face 推論供應商](https://huggingface.co/docs/inference-providers)透過單一權杖，在眾多託管模型（DeepSeek、Llama 等）前方提供與 OpenAI 相容的聊天補全路由器。OpenClaw **僅與聊天補全端點通訊**；若要使用文字轉圖像、嵌入或語音功能，請直接使用 [HF 推論用戶端](https://huggingface.co/docs/api-inference/quicktour)。

| 屬性         | 值                                                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| 供應商 ID    | `huggingface`                                                                                                               |
| 外掛         | 隨附（預設啟用，無須安裝）                                                                                                 |
| 驗證環境變數 | `HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN`（細粒度權杖）                                                                         |
| API          | 與 OpenAI 相容（`https://router.huggingface.co/v1`）                                                                        |
| 計費         | 單一 HF 權杖；[定價](https://huggingface.co/docs/inference-providers/pricing)依供應商費率計算，並提供免費額度                |

## 開始使用

<Steps>
  <Step title="Create a fine-grained token">
    前往 [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained)，並建立新的細粒度權杖。

    <Warning>
    權杖必須啟用 **Make calls to Inference Providers** 權限，否則 API 請求將遭拒絕。
    </Warning>

  </Step>
  <Step title="Run onboarding">
    在供應商下拉式選單中選擇 **Hugging Face**，然後在提示時輸入 API 金鑰：

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Select a default model">
    在 **預設 Hugging Face 模型**下拉式選單中選擇模型。權杖有效時，清單會從推論 API 載入；否則 OpenClaw 會顯示下方的內建目錄。您的選擇會儲存至 `agents.defaults.model.primary`：

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
  <Step title="Verify the model is available">
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

模型參照採用 `huggingface/<org>/<model>` 格式（Hub 風格 ID）。OpenClaw 的內建目錄如下：

| 模型                         | 參照（加上 `huggingface/` 前綴）          |
| ---------------------------- | ----------------------------------------- |
| DeepSeek R1                  | `deepseek-ai/DeepSeek-R1`                 |
| DeepSeek V3.1                | `deepseek-ai/DeepSeek-V3.1`               |
| GPT-OSS 120B                 | `openai/gpt-oss-120b`                     |
| Llama 3.3 70B Instruct Turbo | `meta-llama/Llama-3.3-70B-Instruct-Turbo` |

<Tip>
當權杖有效時，OpenClaw 也會在初始設定和閘道啟動時，透過 **GET** `https://router.huggingface.co/v1/models` 探索任何其他模型，因此您的目錄可包含遠多於上述四個模型的項目。您可以在任何模型 ID 後附加 `:fastest` 或 `:cheapest`；HF 路由器會將請求路由至符合條件的推論供應商。請在[推論供應商設定](https://hf.co/settings/inference-providers)中設定預設供應商順序。
</Tip>

## 進階設定

<AccordionGroup>
  <Accordion title="Model discovery and onboarding dropdown">
    OpenClaw 使用以下方式探索模型：

    ```bash
    GET https://router.huggingface.co/v1/models
    Authorization: Bearer $HUGGINGFACE_HUB_TOKEN   # 或 $HF_TOKEN
    ```

    回應採用 OpenAI 風格：`{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`。

    設定金鑰後（透過初始設定、`HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN`），互動式設定期間的 **預設 Hugging Face 模型**下拉式選單會使用此端點的資料填入。閘道啟動時會重複相同呼叫以重新整理目錄。探索到的模型會與上述內建目錄合併（當 ID 相符時，會使用內建目錄提供內容窗口和成本等中繼資料）。如果請求失敗、未傳回資料或未設定金鑰，OpenClaw 將僅改用內建目錄。

    停用探索功能而不移除供應商：

    ```bash
    openclaw config set plugins.entries.huggingface.config.discovery.enabled false
    ```

  </Accordion>

  <Accordion title="Model names, aliases, and policy suffixes">
    - **來自 API 的名稱：**探索到的模型會在可用時使用 API 的 `name`、`title` 或 `display_name`；否則 OpenClaw 會從模型 ID 衍生名稱（例如，`deepseek-ai/DeepSeek-R1` 會變成「DeepSeek R1」）。
    - **覆寫顯示名稱：**在設定中為每個模型指定自訂標籤：

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

    - **策略後綴：**`​​:fastest` 和 `:cheapest` 是 HF 路由器慣例，而非 OpenClaw 會改寫的內容：後綴會原封不動地作為模型 ID 的一部分傳送，由 HF 路由器選擇符合條件的推論供應商。如果您希望每個後綴各有不同的別名，請在 `models.providers.huggingface.models` 下將每個變體新增為獨立項目（或將其設於 `model.primary`）。
    - **設定合併：**設定合併時，會保留 `models.providers.huggingface.models` 中的現有項目（例如 `models.json` 內的項目），因此您在其中設定的任何自訂 `name`、`alias` 或模型選項都會在重新啟動後保留。

  </Accordion>

  <Accordion title="Environment and daemon setup">
    如果閘道以常駐程式（launchd/systemd）執行，請確保該程序可取得 `HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN`（例如，透過 `~/.openclaw/.env` 或 `env.shellEnv`）。

    <Note>
    OpenClaw 同時接受 `HUGGINGFACE_HUB_TOKEN` 和 `HF_TOKEN`。如果兩者皆有設定，會優先使用 `HUGGINGFACE_HUB_TOKEN`。
    </Note>

  </Accordion>

  <Accordion title="Config: DeepSeek R1 with fallback">
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

  <Accordion title="Config: DeepSeek with cheapest and fastest variants">
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

  <Accordion title="Config: DeepSeek + Llama + GPT-OSS with aliases">
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

## 相關內容

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-TW/concepts/model-providers" icon="layers">
    所有供應商、模型參照與容錯移轉行為的概覽。
  </Card>
  <Card title="Model selection" href="/zh-TW/concepts/models" icon="brain">
    如何選擇及設定模型。
  </Card>
  <Card title="Inference Providers docs" href="https://huggingface.co/docs/inference-providers" icon="book">
    Hugging Face 推論供應商官方文件。
  </Card>
  <Card title="Configuration" href="/zh-TW/gateway/configuration" icon="gear">
    完整設定參考。
  </Card>
</CardGroup>

---
read_when:
    - 你想要一組可用於多種 LLM 的 API 金鑰
    - 你想透過 OpenRouter 在 OpenClaw 中執行模型
    - 你想使用 OpenRouter 進行影像生成
    - 你想使用 OpenRouter 進行影片生成
summary: 使用 OpenRouter 的統一 API，在 OpenClaw 中存取多種模型
title: OpenRouter
x-i18n:
    generated_at: "2026-05-04T02:45:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6b7299408aa0de7530e2248c7fa5dae8c09095e2d20a0e9d12a64cab83966fc
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter 提供**統一 API**，可透過單一端點和 API 金鑰將請求路由到多種模型。它與 OpenAI 相容，因此大多數 OpenAI SDK 只要切換基底 URL 即可運作。

## 開始使用

<Steps>
  <Step title="取得你的 API 金鑰">
    在 [openrouter.ai/keys](https://openrouter.ai/keys) 建立 API 金鑰。
  </Step>
  <Step title="執行 onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="（選用）切換到特定模型">
    Onboarding 預設使用 `openrouter/auto`。之後可選擇具體模型：

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## 設定範例

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## 模型參照

<Note>
模型參照遵循 `openrouter/<provider>/<model>` 模式。如需可用提供者和模型的完整清單，請參閱 [/concepts/model-providers](/zh-TW/concepts/model-providers)。
</Note>

內建備援範例：

| 模型參照                          | 備註                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | OpenRouter 自動路由          |
| `openrouter/moonshotai/kimi-k2.6` | 透過 MoonshotAI 使用 Kimi K2.6 |

## 圖片產生

OpenRouter 也可以支援 `image_generate` 工具。在 `agents.defaults.imageGenerationModel` 下使用 OpenRouter 圖片模型：

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

OpenClaw 會使用 `modalities: ["image", "text"]` 將圖片請求傳送到 OpenRouter 的聊天補全圖片 API。Gemini 圖片模型會透過 OpenRouter 的 `image_config` 接收支援的 `aspectRatio` 和 `resolution` 提示。對於速度較慢的 OpenRouter 圖片模型，請使用 `agents.defaults.imageGenerationModel.timeoutMs`；`image_generate` 工具每次呼叫的 `timeoutMs` 參數仍會優先。

## 影片產生

OpenRouter 也可以透過其非同步 `/videos` API 支援 `video_generate` 工具。在 `agents.defaults.videoGenerationModel` 下使用 OpenRouter 影片模型：

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openrouter/google/veo-3.1-fast",
      },
    },
  },
}
```

OpenClaw 會將文字轉影片和圖片轉影片作業提交給 OpenRouter，輪詢傳回的 `polling_url`，並從 OpenRouter 的 `unsigned_urls` 或文件化的作業內容端點下載完成的影片。參考圖片預設會作為第一/最後影格圖片傳送；標記為 `reference_image` 的圖片會作為 OpenRouter 輸入參考傳送。內建的 `google/veo-3.1-fast` 預設值宣告目前支援 4/6/8 秒時長、`720P`/`1080P` 解析度，以及 `16:9`/`9:16` 長寬比。OpenRouter 未註冊影片轉影片，因為上游影片產生 API 目前接受文字和圖片參考。

## 文字轉語音

OpenRouter 也可以透過其與 OpenAI 相容的 `/audio/speech` 端點作為 TTS 提供者使用。

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

如果省略 `messages.tts.providers.openrouter.apiKey`，TTS 會重用 `models.providers.openrouter.apiKey`，然後才使用 `OPENROUTER_API_KEY`。

## 驗證與標頭

OpenRouter 底層會使用帶有你的 API 金鑰的 Bearer 權杖。

在實際 OpenRouter 請求（`https://openrouter.ai/api/v1`）中，OpenClaw 也會加入 OpenRouter 文件化的應用程式歸因標頭：

| 標頭                      | 值                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
如果你將 OpenRouter 提供者重新指向其他 proxy 或基底 URL，OpenClaw **不會**注入這些 OpenRouter 專用標頭或 Anthropic 快取標記。
</Warning>

## 進階設定

<AccordionGroup>
  <Accordion title="回應快取">
    OpenRouter 回應快取需要選擇啟用。可使用模型參數為每個 OpenRouter 模型啟用：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/auto": {
              params: {
                responseCache: true,
                responseCacheTtlSeconds: 300,
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw 會傳送 `X-OpenRouter-Cache: true`，並在設定時傳送 `X-OpenRouter-Cache-TTL`。`responseCacheClear: true` 會強制重新整理目前請求，並儲存替換回應。也接受 snake_case 別名（`response_cache`、`response_cache_ttl_seconds` 和 `response_cache_clear`）。

    這與提供者提示快取以及 OpenRouter 的 Anthropic `cache_control` 標記不同。它只會套用在已驗證的 `openrouter.ai` 路由上，不會套用在自訂 proxy 基底 URL。

  </Accordion>

  <Accordion title="Anthropic 快取標記">
    在已驗證的 OpenRouter 路由上，Anthropic 模型參照會保留 OpenRouter 專用的 Anthropic `cache_control` 標記，OpenClaw 會使用這些標記在系統/開發者提示區塊上提升提示快取重用率。
  </Accordion>

  <Accordion title="Anthropic 推理預填">
    在已驗證的 OpenRouter 路由上，啟用推理的 Anthropic 模型參照會在請求到達 OpenRouter 前移除結尾的助理預填輪次，以符合 Anthropic 對推理對話必須以使用者輪次結尾的要求。
  </Accordion>

  <Accordion title="思考 / 推理注入">
    在支援的非 `auto` 路由上，OpenClaw 會將選定的思考層級對應到 OpenRouter proxy 推理 payload。不支援的模型提示和 `openrouter/auto` 會略過該推理注入。Hunter Alpha 也會對過期設定的模型參照略過 proxy 推理，因為 OpenRouter 可能會針對該已淘汰路由在推理欄位中傳回最終答案文字。
  </Accordion>

  <Accordion title="DeepSeek V4 推理重播">
    在已驗證的 OpenRouter 路由上，`openrouter/deepseek/deepseek-v4-flash` 和 `openrouter/deepseek/deepseek-v4-pro` 會在重播的助理輪次中補上缺失的 `reasoning_content`，讓思考/工具對話保留 DeepSeek V4 所需的後續形狀。
  </Accordion>

  <Accordion title="僅 OpenAI 的請求形塑">
    OpenRouter 仍會透過 proxy 風格的 OpenAI 相容路徑執行，因此不會轉送原生僅 OpenAI 的請求形塑，例如 `serviceTier`、Responses `store`、OpenAI 推理相容 payload，以及提示快取提示。
  </Accordion>

  <Accordion title="Gemini 支援的路由">
    Gemini 支援的 OpenRouter 參照會留在 proxy-Gemini 路徑上：OpenClaw 會在該處保留 Gemini thought-signature 清理，但不會啟用原生 Gemini 重播驗證或 bootstrap 重寫。
  </Accordion>

  <Accordion title="提供者路由中繼資料">
    如果你在模型參數下傳入 OpenRouter 提供者路由，OpenClaw 會在共用串流包裝器執行前，將其作為 OpenRouter 路由中繼資料轉送。
  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照和容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    agents、模型和提供者的完整設定參考。
  </Card>
</CardGroup>

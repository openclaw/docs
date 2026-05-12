---
read_when:
    - 你想要一個可用於多個大型語言模型的 API 金鑰
    - 你想在 OpenClaw 中透過 OpenRouter 執行模型
    - 您想使用 OpenRouter 進行影像生成
    - 你想使用 OpenRouter 進行影片生成
summary: 使用 OpenRouter 的統一 API 在 OpenClaw 中存取多種模型
title: OpenRouter
x-i18n:
    generated_at: "2026-05-12T08:46:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0dbf2b5a69636eb18471dd7d1dcf05ee30da931e2e3b5c9ae5d44a20d3e46f78
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter 提供一個**統一 API**，可透過單一端點與 API key 將請求路由到多種模型。它與 OpenAI 相容，因此大多數 OpenAI SDK 只要切換 base URL 即可運作。

## 開始使用

<Steps>
  <Step title="取得你的 API key">
    在 [openrouter.ai/keys](https://openrouter.ai/keys) 建立 API key。
  </Step>
  <Step title="執行入門設定">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="（選用）切換到特定模型">
    入門設定預設使用 `openrouter/auto`。稍後可選擇具體模型：

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
模型參照遵循 `openrouter/<provider>/<model>` 模式。若要查看可用供應商與模型的完整清單，請參閱 [/concepts/model-providers](/zh-TW/concepts/model-providers)。
</Note>

內建備援範例：

| 模型參照                          | 備註                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | OpenRouter 自動路由          |
| `openrouter/moonshotai/kimi-k2.6` | 透過 MoonshotAI 使用 Kimi K2.6 |
| `openrouter/moonshotai/kimi-k2.5` | 透過 MoonshotAI 使用 Kimi K2.5 |

## 圖像生成

OpenRouter 也可以支援 `image_generate` 工具。在 `agents.defaults.imageGenerationModel` 下使用 OpenRouter 圖像模型：

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

OpenClaw 會使用 `modalities: ["image", "text"]`，將圖像請求傳送到 OpenRouter 的 chat completions 圖像 API。Gemini 圖像模型會透過 OpenRouter 的 `image_config` 接收支援的 `aspectRatio` 與 `resolution` 提示。較慢的 OpenRouter 圖像模型可使用 `agents.defaults.imageGenerationModel.timeoutMs`；`image_generate` 工具每次呼叫的 `timeoutMs` 參數仍會優先。

## 影片生成

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

OpenClaw 會將文字轉影片與圖像轉影片作業提交到 OpenRouter，輪詢回傳的 `polling_url`，並從 OpenRouter 的 `unsigned_urls` 或文件化的作業內容端點下載完成的影片。參考圖像預設會以第一/最後一影格圖像傳送；標記為 `reference_image` 的圖像會作為 OpenRouter 輸入參考傳送。內建的 `google/veo-3.1-fast` 預設值宣告目前支援 4/6/8 秒時長、`720P`/`1080P` 解析度，以及 `16:9`/`9:16` 長寬比。OpenRouter 未註冊影片轉影片，因為上游影片生成 API 目前接受文字與圖像參考。

## 文字轉語音

OpenRouter 也可以透過其與 OpenAI 相容的 `/audio/speech` 端點作為 TTS 供應商使用。

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

如果省略 `messages.tts.providers.openrouter.apiKey`，TTS 會重用 `models.providers.openrouter.apiKey`，接著使用 `OPENROUTER_API_KEY`。

## 語音轉文字（傳入音訊）

OpenRouter 可以透過共用的 `tools.media.audio` 路徑，使用其 STT 端點（`/audio/transcriptions`）轉錄傳入的語音/音訊附件。這適用於任何會將傳入語音/音訊轉送到媒體理解預檢的通道 Plugin。

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "openrouter", model: "openai/whisper-large-v3-turbo" }],
      },
    },
  },
}
```

OpenClaw 會以 JSON 傳送 OpenRouter STT 請求，並在 `input_audio` 下放入 base64 音訊（OpenRouter STT 合約），而不是以 multipart OpenAI 表單上傳傳送。

## 驗證與標頭

OpenRouter 底層使用帶有你的 API key 的 Bearer token。

在實際 OpenRouter 請求（`https://openrouter.ai/api/v1`）上，OpenClaw 也會加入 OpenRouter 文件記載的應用歸因標頭：

| 標頭                      | 值                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
如果你將 OpenRouter 供應商重新指向其他代理或 base URL，OpenClaw **不會**注入這些 OpenRouter 專用標頭或 Anthropic 快取標記。
</Warning>

## 進階設定

<AccordionGroup>
  <Accordion title="回應快取">
    OpenRouter 回應快取需要選擇啟用。可透過模型參數，針對每個 OpenRouter 模型啟用：

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

    OpenClaw 會傳送 `X-OpenRouter-Cache: true`，並在設定後傳送 `X-OpenRouter-Cache-TTL`。`responseCacheClear: true` 會強制重新整理目前請求，並儲存替代回應。也接受 Snake_case 別名（`response_cache`、`response_cache_ttl_seconds` 和 `response_cache_clear`）。

    這不同於供應商提示快取，也不同於 OpenRouter 的 Anthropic `cache_control` 標記。它只會套用於已驗證的 `openrouter.ai` 路由，而不是自訂代理 base URL。

  </Accordion>

  <Accordion title="Anthropic 快取標記">
    在已驗證的 OpenRouter 路由上，Anthropic 模型參照會保留 OpenRouter 專用的 Anthropic `cache_control` 標記，OpenClaw 會用它來改善系統/開發者提示區塊的提示快取重用。
  </Accordion>

  <Accordion title="Anthropic 推理預填">
    在已驗證的 OpenRouter 路由上，啟用推理的 Anthropic 模型參照會在請求送達 OpenRouter 之前移除尾端 assistant 預填回合，以符合 Anthropic 要求推理對話必須以使用者回合結尾的規定。
  </Accordion>

  <Accordion title="思考 / 推理注入">
    在支援的非 `auto` 路由上，OpenClaw 會將選取的思考層級對應到 OpenRouter 代理推理 payload。不支援的模型提示與 `openrouter/auto` 會略過該推理注入。Hunter Alpha 也會針對過期設定的模型參照略過代理推理，因為 OpenRouter 可能會在該退役路由的推理欄位中回傳最終答案文字。
  </Accordion>

  <Accordion title="DeepSeek V4 推理重播">
    在已驗證的 OpenRouter 路由上，`openrouter/deepseek/deepseek-v4-flash` 和 `openrouter/deepseek/deepseek-v4-pro` 會在重播的 assistant 回合上補齊缺少的 `reasoning_content`，讓思考/工具對話維持 DeepSeek V4 所需的後續形狀。OpenClaw 會為這些路由傳送 OpenRouter 支援的 `reasoning_effort` 值；`xhigh` 是宣告的最高層級，過期的 `max` 覆寫會對應到 `xhigh`。
  </Accordion>

  <Accordion title="僅限 OpenAI 的請求成形">
    OpenRouter 仍會走代理風格的 OpenAI 相容路徑，因此不會轉送原生 OpenAI 專用請求成形，例如 `serviceTier`、Responses `store`、OpenAI 推理相容 payload，以及提示快取提示。
  </Accordion>

  <Accordion title="Gemini 支援的路由">
    Gemini 支援的 OpenRouter 參照會保留在代理 Gemini 路徑：OpenClaw 會在其中保留 Gemini thought-signature 清理，但不會啟用原生 Gemini 重播驗證或 bootstrap 重寫。
  </Accordion>

  <Accordion title="供應商路由中繼資料">
    如果你在模型參數下傳入 OpenRouter 供應商路由，OpenClaw 會在共用串流包裝器執行前，將其作為 OpenRouter 路由中繼資料轉送。
  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照和容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    agents、models 和 providers 的完整設定參考。
  </Card>
</CardGroup>

---
read_when:
    - 你想要一個適用於多個大型語言模型的單一 API 金鑰
    - 你想在 OpenClaw 中透過 OpenRouter 執行模型
    - 您想使用 OpenRouter 進行圖片生成
    - 您想使用 OpenRouter 生成影片
summary: 使用 OpenRouter 的統一 API 在 OpenClaw 中存取多種模型
title: OpenRouter
x-i18n:
    generated_at: "2026-05-10T19:49:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5016c522cb2239dadebbfe63459d0e00f43b3dc76aa49cd5b4acfd542b31be71
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter 提供一個**統一 API**，可透過單一端點和 API 金鑰將請求路由到多個模型。它與 OpenAI 相容，因此多數 OpenAI SDK 只要切換 base URL 即可使用。

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
模型參照遵循 `openrouter/<provider>/<model>` 模式。如需可用 provider 和模型的完整清單，請參閱 [/concepts/model-providers](/zh-TW/concepts/model-providers)。
</Note>

隨附的 fallback 範例：

| 模型參照                          | 備註                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | OpenRouter 自動路由          |
| `openrouter/moonshotai/kimi-k2.6` | 透過 MoonshotAI 使用 Kimi K2.6 |
| `openrouter/moonshotai/kimi-k2.5` | 透過 MoonshotAI 使用 Kimi K2.5 |

## 圖像生成

OpenRouter 也可支援 `image_generate` 工具。請在 `agents.defaults.imageGenerationModel` 下使用 OpenRouter 圖像模型：

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

OpenClaw 會使用 `modalities: ["image", "text"]`，將圖像請求送到 OpenRouter 的 chat completions image API。Gemini 圖像模型會透過 OpenRouter 的 `image_config` 接收支援的 `aspectRatio` 和 `resolution` 提示。對於較慢的 OpenRouter 圖像模型，請使用 `agents.defaults.imageGenerationModel.timeoutMs`；`image_generate` 工具每次呼叫的 `timeoutMs` 參數仍會優先。

## 影片生成

OpenRouter 也可透過其非同步 `/videos` API 支援 `video_generate` 工具。請在 `agents.defaults.videoGenerationModel` 下使用 OpenRouter 影片模型：

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

OpenClaw 會向 OpenRouter 提交文字轉影片與圖像轉影片作業、輪詢回傳的 `polling_url`，並從 OpenRouter 的 `unsigned_urls` 或文件記載的作業內容端點下載完成的影片。參考圖像預設會作為第一/最後一幀圖像傳送；標記為 `reference_image` 的圖像會作為 OpenRouter 輸入參考傳送。隨附的 `google/veo-3.1-fast` 預設值會宣告目前支援的 4/6/8 秒時長、`720P`/`1080P` 解析度，以及 `16:9`/`9:16` 長寬比。OpenRouter 未註冊影片轉影片，因為上游影片生成 API 目前接受文字和圖像參考。

## 文字轉語音

OpenRouter 也可透過其 OpenAI 相容的 `/audio/speech` 端點作為 TTS provider 使用。

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

如果省略 `messages.tts.providers.openrouter.apiKey`，TTS 會重用 `models.providers.openrouter.apiKey`，再來是 `OPENROUTER_API_KEY`。

## 驗證與標頭

OpenRouter 底層會以你的 API 金鑰使用 Bearer token。

在實際的 OpenRouter 請求中（`https://openrouter.ai/api/v1`），OpenClaw 也會加入 OpenRouter 文件記載的應用程式歸因標頭：

| 標頭                      | 值                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
如果你將 OpenRouter provider 重新指向其他 proxy 或 base URL，OpenClaw **不會**注入這些 OpenRouter 專用標頭或 Anthropic 快取標記。
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

    OpenClaw 會傳送 `X-OpenRouter-Cache: true`，並在設定時傳送 `X-OpenRouter-Cache-TTL`。`responseCacheClear: true` 會強制重新整理目前請求，並儲存替換後的回應。也接受 snake_case 別名（`response_cache`、`response_cache_ttl_seconds` 和 `response_cache_clear`）。

    這與 provider prompt caching 和 OpenRouter 的 Anthropic `cache_control` 標記不同。它只會套用在已驗證的 `openrouter.ai` 路由，不會套用在自訂 proxy base URL。

  </Accordion>

  <Accordion title="Anthropic 快取標記">
    在已驗證的 OpenRouter 路由上，Anthropic 模型參照會保留 OpenClaw 用於在 system/developer prompt 區塊上提升 prompt-cache 重用率的 OpenRouter 專用 Anthropic `cache_control` 標記。
  </Accordion>

  <Accordion title="Anthropic reasoning 預填">
    在已驗證的 OpenRouter 路由上，啟用 reasoning 的 Anthropic 模型參照會在請求到達 OpenRouter 前，移除尾端的 assistant 預填 turns，以符合 Anthropic 要求 reasoning 對話必須以 user turn 結尾的規則。
  </Accordion>

  <Accordion title="思考 / 推理注入">
    在支援的非 `auto` 路由上，OpenClaw 會將選取的思考層級映射到 OpenRouter proxy reasoning payload。不支援的模型提示和 `openrouter/auto` 會略過該 reasoning 注入。Hunter Alpha 也會針對過時的已設定模型參照略過 proxy reasoning，因為 OpenRouter 可能會在該已淘汰路由的 reasoning 欄位中回傳最終答案文字。
  </Accordion>

  <Accordion title="DeepSeek V4 reasoning 重播">
    在已驗證的 OpenRouter 路由上，`openrouter/deepseek/deepseek-v4-flash` 和 `openrouter/deepseek/deepseek-v4-pro` 會在重播的 assistant turns 上補齊缺少的 `reasoning_content`，讓思考/工具對話維持 DeepSeek V4 所需的後續形狀。OpenClaw 會為這些路由傳送 OpenRouter 支援的 `reasoning_effort` 值；`xhigh` 是宣告的最高層級，過時的 `max` override 會映射到 `xhigh`。
  </Accordion>

  <Accordion title="僅限 OpenAI 的請求塑形">
    OpenRouter 仍會走 proxy 風格的 OpenAI 相容路徑，因此不會轉送 native OpenAI 專用的請求塑形，例如 `serviceTier`、Responses `store`、OpenAI reasoning-compat payload，以及 prompt-cache 提示。
  </Accordion>

  <Accordion title="Gemini 支援的路由">
    Gemini 支援的 OpenRouter 參照會維持在 proxy-Gemini 路徑：OpenClaw 會在該處保留 Gemini thought-signature 清理，但不會啟用 native Gemini 重播驗證或 bootstrap 重寫。
  </Accordion>

  <Accordion title="Provider 路由中繼資料">
    如果你在模型參數下傳入 OpenRouter provider routing，OpenClaw 會在共用 stream wrapper 執行前，將其作為 OpenRouter routing metadata 轉送。
  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇 provider、模型參照和 failover 行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    agents、models 和 providers 的完整設定參考。
  </Card>
</CardGroup>

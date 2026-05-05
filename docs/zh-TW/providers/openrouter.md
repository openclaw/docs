---
read_when:
    - 你想要一個可用於多個 LLM 的單一 API 金鑰
    - 你想在 OpenClaw 中透過 OpenRouter 執行模型
    - 您想使用 OpenRouter 進行影像生成
    - 您想使用 OpenRouter 進行影片生成
summary: 使用 OpenRouter 的統一 API 在 OpenClaw 中存取多種模型
title: OpenRouter
x-i18n:
    generated_at: "2026-05-05T01:48:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2876669c6fcc958ac13c19930cd23977b8ec27ae57069d9231932cc13c75244
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter 提供**統一 API**，可透過單一端點和 API 金鑰將請求路由到許多模型。它相容於 OpenAI，因此大多數 OpenAI SDK 只要切換基礎 URL 即可使用。

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
    Onboarding 預設為 `openrouter/auto`。稍後可選擇具體模型：

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

內建後援範例：

| 模型參照                          | 備註                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | OpenRouter 自動路由          |
| `openrouter/moonshotai/kimi-k2.6` | 透過 MoonshotAI 使用 Kimi K2.6 |

## 圖像生成

OpenRouter 也可以支援 `image_generate` 工具。請在 `agents.defaults.imageGenerationModel` 下使用 OpenRouter 圖像模型：

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

OpenClaw 會使用 `modalities: ["image", "text"]` 將圖像請求傳送到 OpenRouter 的 chat completions 圖像 API。Gemini 圖像模型會透過 OpenRouter 的 `image_config` 接收支援的 `aspectRatio` 和 `resolution` 提示。對於較慢的 OpenRouter 圖像模型，請使用 `agents.defaults.imageGenerationModel.timeoutMs`；`image_generate` 工具每次呼叫的 `timeoutMs` 參數仍會優先套用。

## 影片生成

OpenRouter 也可以透過其非同步 `/videos` API 支援 `video_generate` 工具。請在 `agents.defaults.videoGenerationModel` 下使用 OpenRouter 影片模型：

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

OpenClaw 會將文字轉影片和圖像轉影片工作提交給 OpenRouter，輪詢傳回的 `polling_url`，並從 OpenRouter 的 `unsigned_urls` 或記載的工作內容端點下載完成的影片。參考圖像預設會作為首格/末格圖像傳送；標記為 `reference_image` 的圖像會作為 OpenRouter 輸入參考傳送。內建的 `google/veo-3.1-fast` 預設會宣告目前支援的 4/6/8 秒長度、`720P`/`1080P` 解析度，以及 `16:9`/`9:16` 長寬比。OpenRouter 未註冊影片轉影片，因為上游影片生成 API 目前接受文字與圖像參考。

## 文字轉語音

OpenRouter 也可以透過其相容 OpenAI 的 `/audio/speech` 端點作為 TTS provider 使用。

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

如果省略 `messages.tts.providers.openrouter.apiKey`，TTS 會重用 `models.providers.openrouter.apiKey`，再使用 `OPENROUTER_API_KEY`。

## 驗證與標頭

OpenRouter 底層會使用搭配你 API 金鑰的 Bearer token。

在實際的 OpenRouter 請求（`https://openrouter.ai/api/v1`）上，OpenClaw 也會加入 OpenRouter 文件記載的應用程式歸因標頭：

| 標頭                      | 值                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
如果你將 OpenRouter provider 重新指向其他 proxy 或基礎 URL，OpenClaw **不會**注入這些 OpenRouter 專用標頭或 Anthropic 快取標記。
</Warning>

## 進階設定

<AccordionGroup>
  <Accordion title="回應快取">
    OpenRouter 回應快取需要選擇啟用。透過模型參數為每個 OpenRouter 模型啟用：

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

    OpenClaw 會傳送 `X-OpenRouter-Cache: true`，並在設定後傳送 `X-OpenRouter-Cache-TTL`。`responseCacheClear: true` 會強制重新整理目前請求並儲存替換回應。也接受 snake_case 別名（`response_cache`、`response_cache_ttl_seconds` 和 `response_cache_clear`）。

    這與 provider prompt caching 和 OpenRouter 的 Anthropic `cache_control` 標記不同。它只會套用在已驗證的 `openrouter.ai` 路由上，而不是自訂 proxy 基礎 URL。

  </Accordion>

  <Accordion title="Anthropic 快取標記">
    在已驗證的 OpenRouter 路由上，Anthropic 模型參照會保留 OpenRouter 專用的 Anthropic `cache_control` 標記，OpenClaw 會用這些標記在 system/developer prompt 區塊上提升 prompt-cache 重用率。
  </Accordion>

  <Accordion title="Anthropic reasoning 預填">
    在已驗證的 OpenRouter 路由上，啟用 reasoning 的 Anthropic 模型參照會在請求到達 OpenRouter 前移除結尾的 assistant 預填回合，以符合 Anthropic 對 reasoning 對話必須以 user 回合結尾的要求。
  </Accordion>

  <Accordion title="Thinking / reasoning 注入">
    在支援的非 `auto` 路由上，OpenClaw 會將選取的 thinking 層級對應到 OpenRouter proxy reasoning payload。不支援的模型提示和 `openrouter/auto` 會略過該 reasoning 注入。Hunter Alpha 也會因為 OpenRouter 可能在該已退役路由的 reasoning 欄位中傳回最終答案文字，而對過時設定的模型參照略過 proxy reasoning。
  </Accordion>

  <Accordion title="DeepSeek V4 reasoning 重播">
    在已驗證的 OpenRouter 路由上，`openrouter/deepseek/deepseek-v4-flash` 和 `openrouter/deepseek/deepseek-v4-pro` 會在重播的 assistant 回合補上缺少的 `reasoning_content`，讓 thinking/tool 對話維持 DeepSeek V4 要求的後續形狀。OpenClaw 會為這些路由傳送 OpenRouter 支援的 `reasoning_effort` 值；`xhigh` 是宣告的最高層級，過時的 `max` 覆寫會對應到 `xhigh`。
  </Accordion>

  <Accordion title="僅 OpenAI 的請求塑形">
    OpenRouter 仍會經由 proxy 風格的 OpenAI 相容路徑執行，因此不會轉送原生僅 OpenAI 的請求塑形，例如 `serviceTier`、Responses `store`、OpenAI reasoning 相容 payload，以及 prompt-cache 提示。
  </Accordion>

  <Accordion title="Gemini 支援的路由">
    Gemini 支援的 OpenRouter 參照會維持在 proxy-Gemini 路徑上：OpenClaw 會在該處保留 Gemini thought-signature 清理，但不會啟用原生 Gemini 重播驗證或 bootstrap 重寫。
  </Accordion>

  <Accordion title="Provider 路由中繼資料">
    如果你在模型參數下傳遞 OpenRouter provider 路由，OpenClaw 會在共用串流包裝器執行前，將其作為 OpenRouter 路由中繼資料轉送。
  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇 provider、模型參照與容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    agents、模型和 provider 的完整設定參考。
  </Card>
</CardGroup>

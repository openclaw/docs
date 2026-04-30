---
read_when:
    - 你想要一個適用於多種 LLM 的單一 API 金鑰
    - 你想透過 OpenRouter 在 OpenClaw 中執行模型
    - 您想使用 OpenRouter 進行圖像生成
    - 您想使用 OpenRouter 進行影片生成
summary: 使用 OpenRouter 的統一 API 在 OpenClaw 中存取多種模型
title: OpenRouter
x-i18n:
    generated_at: "2026-04-30T03:33:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 47206ce7279eb8a38f71b5c40d34646ad01df2cac25860b629951f9cec73270f
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter 提供一個**統一 API**，可透過單一端點和 API 金鑰將請求路由至多種模型。它與 OpenAI 相容，因此大多數 OpenAI SDK 只要切換基底 URL 就能使用。

## 開始使用

<Steps>
  <Step title="取得你的 API 金鑰">
    在 [openrouter.ai/keys](https://openrouter.ai/keys) 建立 API 金鑰。
  </Step>
  <Step title="執行入門設定">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="（選用）切換至特定模型">
    入門設定預設使用 `openrouter/auto`。之後可選擇具體模型：

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
模型參照遵循 `openrouter/<provider>/<model>` 模式。如需可用供應商與模型的完整清單，請參閱 [/concepts/model-providers](/zh-TW/concepts/model-providers)。
</Note>

內建備援範例：

| 模型參照                          | 備註                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | OpenRouter 自動路由          |
| `openrouter/moonshotai/kimi-k2.6` | 透過 MoonshotAI 使用 Kimi K2.6 |

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

OpenClaw 會使用 `modalities: ["image", "text"]`，將圖像請求傳送至 OpenRouter 的聊天完成圖像 API。Gemini 圖像模型會透過 OpenRouter 的 `image_config` 接收支援的 `aspectRatio` 和 `resolution` 提示。較慢的 OpenRouter 圖像模型請使用 `agents.defaults.imageGenerationModel.timeoutMs`；`image_generate` 工具每次呼叫的 `timeoutMs` 參數仍會優先。

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

OpenClaw 會將文字轉影片和圖像轉影片作業提交給 OpenRouter，輪詢傳回的 `polling_url`，並從 OpenRouter 的 `unsigned_urls` 或文件記載的作業內容端點下載完成的影片。參考圖像預設會以第一/最後一格圖像送出；標記為 `reference_image` 的圖像會作為 OpenRouter 輸入參照送出。內建的 `google/veo-3.1-fast` 預設值宣告目前支援 4/6/8 秒長度、`720P`/`1080P` 解析度，以及 `16:9`/`9:16` 長寬比。OpenRouter 未註冊影片轉影片，因為上游影片生成 API 目前接受文字和圖像參照。

## 文字轉語音

OpenRouter 也可透過其與 OpenAI 相容的 `/audio/speech` 端點作為 TTS 供應商使用。

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

## 驗證與標頭

OpenRouter 底層會使用帶有你 API 金鑰的 Bearer 權杖。

在實際 OpenRouter 請求（`https://openrouter.ai/api/v1`）中，OpenClaw 也會加入 OpenRouter 文件記載的應用程式歸因標頭：

| 標頭                      | 值                    |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
如果你將 OpenRouter 供應商重新指向其他代理或基底 URL，OpenClaw **不會**注入這些 OpenRouter 專用標頭或 Anthropic 快取標記。
</Warning>

## 進階設定

<AccordionGroup>
  <Accordion title="Anthropic 快取標記">
    在已驗證的 OpenRouter 路由上，Anthropic 模型參照會保留 OpenRouter 專用的 Anthropic `cache_control` 標記，OpenClaw 會用它們在系統/開發者提示區塊上更好地重用提示快取。
  </Accordion>

  <Accordion title="思考／推理注入">
    在支援的非 `auto` 路由上，OpenClaw 會將選取的思考層級對應至 OpenRouter 代理推理酬載。不支援的模型提示和 `openrouter/auto` 會略過該推理注入。Hunter Alpha 也會對過期設定的模型參照略過代理推理，因為 OpenRouter 可能會針對該已停用路由在推理欄位中傳回最終答案文字。
  </Accordion>

  <Accordion title="僅限 OpenAI 的請求調整">
    OpenRouter 仍會走代理式的 OpenAI 相容路徑，因此不會轉發原生僅限 OpenAI 的請求調整，例如 `serviceTier`、Responses `store`、OpenAI 推理相容酬載，以及提示快取提示。
  </Accordion>

  <Accordion title="Gemini 支援的路由">
    Gemini 支援的 OpenRouter 參照會留在代理 Gemini 路徑上：OpenClaw 會在該處保留 Gemini 思考簽章清理，但不會啟用原生 Gemini 重播驗證或啟動重寫。
  </Accordion>

  <Accordion title="供應商路由中繼資料">
    如果你在模型參數下傳遞 OpenRouter 供應商路由，OpenClaw 會在共用串流包裝器執行前，將它作為 OpenRouter 路由中繼資料轉發。
  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照與容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    agents、models 和 providers 的完整設定參考。
  </Card>
</CardGroup>

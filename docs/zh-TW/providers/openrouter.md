---
read_when:
    - 你想用單一 API 金鑰存取多種 LLMs
    - 你想在 OpenClaw 中透過 OpenRouter 執行模型
    - 你想使用 OpenRouter 進行影像生成
    - 你想使用 OpenRouter 進行音樂生成
    - 你想要使用 OpenRouter 進行影片生成
summary: 使用 OpenRouter 的統一 API 在 OpenClaw 中存取多種模型
title: OpenRouter
x-i18n:
    generated_at: "2026-06-27T19:56:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40f1888d388de6f97329fc681da97d6c82eeba5d35b3861bde71ebc7c76e19e7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter 提供**統一 API**，可透過單一端點和 API 金鑰將請求路由到多種模型。它與 OpenAI 相容，因此大多數 OpenAI SDK 只要切換基底 URL 即可使用。

## 開始使用

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="執行 OAuth 入門設定">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw 會開啟 OpenRouter 的瀏覽器登入流程，將 PKCE
        代碼交換為 OpenRouter API 金鑰，並將該金鑰儲存在預設的
        OpenRouter 驗證設定檔中。在遠端/無頭主機上，OpenClaw 會列印
        登入 URL，並要求你在登入後貼上重新導向 URL。
      </Step>
      <Step title="（選用）切換到特定模型">
        入門設定預設為 `openrouter/auto`。稍後可選擇具體模型：

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="API 金鑰">
    <Steps>
      <Step title="取得你的 API 金鑰">
        在 [openrouter.ai/keys](https://openrouter.ai/keys) 建立 API 金鑰。
      </Step>
      <Step title="執行 API 金鑰入門設定">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="（選用）切換到特定模型">
        入門設定預設為 `openrouter/auto`。稍後可選擇具體模型：

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
</Tabs>

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
模型參照遵循 `openrouter/<provider>/<model>` 模式。如需完整的可用
供應商與模型清單，請參閱 [/concepts/model-providers](/zh-TW/concepts/model-providers)。
</Note>

內建備援範例：

| 模型參照                          | 備註                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | OpenRouter 自動路由          |
| `openrouter/openrouter/fusion`    | OpenRouter Fusion 路由器     |
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

OpenClaw 會使用 `modalities: ["image", "text"]`，將圖像請求傳送到 OpenRouter 的聊天補全圖像 API。Gemini 圖像模型會透過 OpenRouter 的 `image_config` 接收支援的 `aspectRatio` 和 `resolution` 提示。對於較慢的 OpenRouter 圖像模型，請使用 `agents.defaults.imageGenerationModel.timeoutMs`；`image_generate` 工具的逐次呼叫 `timeoutMs` 參數仍會優先。

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

OpenClaw 會向 OpenRouter 提交文字轉影片與圖像轉影片作業、輪詢
傳回的 `polling_url`，並從 OpenRouter 的 `unsigned_urls` 或文件化的
作業內容端點下載完成的影片。參考圖像預設會以第一/最後一格圖像
送出；標記為 `reference_image` 的圖像會作為 OpenRouter 輸入參照送出。
內建的 `google/veo-3.1-fast` 預設值會宣告目前支援的 4/6/8
秒時長、`720P`/`1080P` 解析度，以及 `16:9`/`9:16` 長寬比。
OpenRouter 未註冊影片轉影片，因為上游影片生成 API 目前接受文字與圖像參照。

## 音樂生成

OpenRouter 也可以透過聊天補全音訊輸出支援 `music_generate` 工具。
在 `agents.defaults.musicGenerationModel` 下使用 OpenRouter 音訊模型：

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "openrouter/google/lyria-3-pro-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

內建的 OpenRouter 音樂供應商預設為
`google/lyria-3-pro-preview`，並且也公開
`google/lyria-3-clip-preview`。OpenClaw 會送出 `modalities: ["text",
"audio"]`、啟用串流、收集串流音訊區塊，並將結果儲存為生成媒體以供頻道傳遞。
Lyria 模型可透過共用的 `music_generate image=...`
參數接受參考圖像。

## 文字轉語音

OpenRouter 也可透過其 OpenAI 相容的
`/audio/speech` 端點作為 TTS 供應商使用。

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          speakerVoice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

如果省略 `messages.tts.providers.openrouter.apiKey`，TTS 會重用
`models.providers.openrouter.apiKey`，再使用 `OPENROUTER_API_KEY`。

## 語音轉文字（傳入音訊）

OpenRouter 可以透過共用的 `tools.media.audio` 路徑，使用其 STT 端點
（`/audio/transcriptions`）轉錄傳入的語音/音訊附件。這適用於任何會將
傳入語音/音訊轉送至媒體理解預檢的頻道外掛。

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

OpenClaw 會將 OpenRouter STT 請求以 JSON 傳送，並在
`input_audio` 下放入 base64 音訊（OpenRouter STT 合約），而不是以 multipart OpenAI 表單上傳。

## Fusion 路由器

當你想讓一個 OpenClaw 模型參照並行詢問多個
OpenRouter 模型、讓 OpenRouter 評判其答案，並透過正常的 OpenRouter 供應商端點回傳
單一最終回應時，請使用 OpenRouter Fusion。由於
上游模型 slug 是 `openrouter/fusion`，OpenClaw 模型參照同時包含
OpenClaw 供應商前綴與上游 OpenRouter 命名空間：

```bash
openclaw models set openrouter/openrouter/fusion
```

透過模型的 `params.extraBody` 設定 Fusion 的面板與評審。這些
欄位會轉送到 OpenRouter 聊天補全請求本文中。Fusion
可搭配 OpenRouter OAuth 入門設定或 API 金鑰入門設定使用；如果使用
OAuth，請從下方範例省略 `env.OPENROUTER_API_KEY` 行。

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/openrouter/fusion" },
      models: {
        "openrouter/openrouter/fusion": {
          params: {
            extraBody: {
              plugins: [
                {
                  id: "fusion",
                  analysis_models: [
                    "google/gemini-3.5-flash",
                    "moonshotai/kimi-k2.6",
                    "deepseek/deepseek-v4-pro",
                  ],
                  model: "google/gemini-3.5-flash",
                },
              ],
            },
          },
        },
      },
    },
  },
}
```

`analysis_models` 清單是並行面板，而 Fusion
外掛設定內的 `model` 是評審模型。在正常 OpenClaw agent/chat 回合中，不要將頂層 `tool_choice` 設為
`"required"` 來嘗試強制使用 Fusion；OpenClaw 回合可能包含 OpenClaw 工具定義，而頂層必要
工具選擇可能會要求使用其中一個工具，而不是 Fusion 路由器。當
此 Fusion 外掛設定存在時，OpenClaw 也會加入一則已清理的
系統提示註記，其中包含已設定的分析模型與評審模型，讓
代理程式能回答關於目前 Fusion 面板的問題。其他 `extraBody`
欄位不會複製到提示中。

Fusion 的設計本來就較慢。OpenRouter 可能會將同一個 OpenClaw 提示傳送給
多個分析模型，然後執行最終評審/綜合步驟，因此延遲通常
高於直接的單一模型請求。請將 Fusion 用於需要審慎、
高品質答案或升級路徑的情境，而不是作為
對延遲敏感聊天的預設。若要獲得更快回應，請保持面板精簡，並選擇
較快的分析與評審模型。

使用一次性本機模型呼叫測試已設定的參照：

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## 驗證與標頭

OpenRouter 在底層使用含有你 API 金鑰的 Bearer 權杖。OpenRouter
OAuth 是會發出 OpenRouter API 金鑰的 PKCE 登入流程，因此 OpenClaw 會將
結果儲存為手動 API 金鑰設定路徑所使用的相同 `openrouter:default` API 金鑰驗證設定檔。

對於現有安裝，可登入或輪換已儲存的 OpenRouter 金鑰，而不必
重新執行完整入門設定：

```bash
openclaw models auth login --provider openrouter --method oauth
```

當你想貼上在 OpenRouter 手動建立的金鑰時，請使用
`openclaw models auth login --provider openrouter --method api-key`。

在實際 OpenRouter 請求（`https://openrouter.ai/api/v1`）上，OpenClaw 也會加入
OpenRouter 文件化的應用程式歸屬標頭：

| 標頭                      | 值                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
如果你將 OpenRouter 供應商重新指向其他代理或基底 URL，OpenClaw
**不會**注入那些 OpenRouter 專屬標頭或 Anthropic 快取標記。
</Warning>

## 進階設定

<AccordionGroup>
  <Accordion title="回應快取">
    OpenRouter 回應快取是選擇加入。使用模型參數為每個 OpenRouter 模型啟用：

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

    OpenClaw 會傳送 `X-OpenRouter-Cache: true`，並在設定時傳送
    `X-OpenRouter-Cache-TTL`。`responseCacheClear: true` 會強制重新整理
    目前請求並儲存替代回應。也接受 snake_case 別名
    （`response_cache`、`response_cache_ttl_seconds` 和
    `response_cache_clear`）。

    這與供應商提示快取以及 OpenRouter 的
    Anthropic `cache_control` 標記是分開的。它只會套用在已驗證的
    `openrouter.ai` 路由上，不會套用在自訂代理基底 URL 上。

  </Accordion>

  <Accordion title="Anthropic 快取標記">
    在已驗證的 OpenRouter 路由上，Anthropic 模型參照會保留
    OpenRouter 專屬的 Anthropic `cache_control` 標記，OpenClaw 會使用這些標記
    讓系統/開發者提示區塊更能重用提示快取。
  </Accordion>

  <Accordion title="Anthropic 推理預填">
    在已驗證的 OpenRouter 路由上，啟用推理的 Anthropic 模型參照會在請求抵達 OpenRouter
    前移除結尾的助理預填回合，以符合 Anthropic 對推理對話必須以使用者回合結尾的要求。
  </Accordion>

  <Accordion title="思考 / 推理注入">
    在支援的非 `auto` 路由上，OpenClaw 會將所選的思考層級對應到
    OpenRouter 代理推理酬載。不支援的模型提示和 `openrouter/auto`
    會略過該推理注入。Hunter Alpha 也會對過期的已設定模型參照略過代理推理，因為 OpenRouter
    可能會在該已停用路由的推理欄位中傳回最終答案文字。
  </Accordion>

  <Accordion title="DeepSeek V4 推理重播">
    在已驗證的 OpenRouter 路由上，`openrouter/deepseek/deepseek-v4-flash` 和
    `openrouter/deepseek/deepseek-v4-pro` 會在重播的助理回合中填補缺少的 `reasoning_content`，
    讓思考/工具對話保持 DeepSeek V4 要求的後續形狀。OpenClaw 會為這些路由傳送 OpenRouter 支援的
    `reasoning_effort` 值；`xhigh` 是公告的最高層級，而過期的 `max` 覆寫會對應到 `xhigh`。
  </Accordion>

  <Accordion title="僅限 OpenAI 的請求塑形">
    OpenRouter 仍會經過代理式 OpenAI 相容路徑，因此不會轉送原生僅限 OpenAI 的請求塑形，例如
    `serviceTier`、Responses `store`、OpenAI 推理相容酬載，以及提示快取提示。
  </Accordion>

  <Accordion title="Gemini 支援的路由">
    Gemini 支援的 OpenRouter 參照會保留在代理 Gemini 路徑上：OpenClaw 會在該處保留
    Gemini 思考簽章清理，但不會啟用原生 Gemini 重播驗證或啟動重寫。
  </Accordion>

  <Accordion title="提供者路由中繼資料">
    OpenRouter 支援用於底層提供者路由的 `provider` 請求物件。
    使用 `models.providers.openrouter.params.provider` 為所有 OpenRouter 文字模型請求設定預設政策：

    ```json5
    {
      models: {
        providers: {
          openrouter: {
            params: {
              provider: {
                sort: "latency",
                require_parameters: true,
                data_collection: "deny",
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw 會將該物件作為請求 `provider` 酬載轉送給 OpenRouter。
    請使用 OpenRouter 文件記載的 snake_case 欄位，包括 `sort`、`only`、`ignore`、`order`、`allow_fallbacks`、`require_parameters`、
    `data_collection`、`quantizations`、`max_price`、`preferred_max_latency`、
    `preferred_min_throughput`、`zdr` 和 `enforce_distillable_text`。

    個別模型參數仍會覆寫提供者範圍的路由物件：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/anthropic/claude-sonnet-4-6": {
              params: {
                provider: {
                  order: ["anthropic"],
                  allow_fallbacks: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    這只適用於 OpenRouter chat-completions 路由。直接的 Anthropic、
    Google、OpenAI 或自訂提供者路由會忽略 OpenRouter 路由參數。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照和容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    代理、模型和提供者的完整設定參考。
  </Card>
</CardGroup>

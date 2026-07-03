---
read_when:
    - 你想要一個可用於多種 LLM 的單一 API 金鑰
    - 你想在 OpenClaw 中透過 OpenRouter 執行模型
    - 您想使用 OpenRouter 進行圖片生成
    - 你想使用 OpenRouter 進行音樂生成
    - 你想使用 OpenRouter 進行影片生成
summary: 使用 OpenRouter 的統一 API 在 OpenClaw 中存取多種模型
title: OpenRouter
x-i18n:
    generated_at: "2026-07-03T09:22:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca36f2a7afd35ea4d276f61ded28524aed7d15715b29eea9aaac0ac6e4abab40
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter 提供 **統一 API**，可將請求路由到單一端點和 API 金鑰後方的多個模型。它與 OpenAI 相容，因此大多數 OpenAI SDK 只要切換 base URL 即可使用。

## 開始使用

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="執行 OAuth 初始設定">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw 會開啟 OpenRouter 的瀏覽器登入流程，將 PKCE code 交換為 OpenRouter API 金鑰，並將該金鑰儲存在預設的 OpenRouter auth profile 中。在遠端/無頭主機上，OpenClaw 會列印登入 URL，並要求你登入後貼上 redirect URL。
      </Step>
      <Step title="（選用）切換到特定模型">
        初始設定預設為 `openrouter/auto`。稍後可選擇具體模型：

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
      <Step title="執行 API 金鑰初始設定">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="（選用）切換到特定模型">
        初始設定預設為 `openrouter/auto`。稍後可選擇具體模型：

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
模型參照遵循 `openrouter/<provider>/<model>` 模式。如需可用 provider 和模型的完整清單，請參閱 [/concepts/model-providers](/zh-TW/concepts/model-providers)。
</Note>

內建 fallback 範例：

| 模型參照                          | 備註                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | OpenRouter 自動路由          |
| `openrouter/openrouter/fusion`    | OpenRouter Fusion router     |
| `openrouter/moonshotai/kimi-k2.6` | 透過 MoonshotAI 使用 Kimi K2.6 |
| `openrouter/moonshotai/kimi-k2.5` | 透過 MoonshotAI 使用 Kimi K2.5 |

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

OpenClaw 會使用 `modalities: ["image", "text"]` 將圖像請求傳送到 OpenRouter 的 chat completions image API。Gemini 圖像模型會透過 OpenRouter 的 `image_config` 接收支援的 `aspectRatio` 和 `resolution` 提示。對於較慢的 OpenRouter 圖像模型，請使用 `agents.defaults.imageGenerationModel.timeoutMs`；`image_generate` 工具每次呼叫的 `timeoutMs` 參數仍會優先適用。

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

OpenClaw 會將 text-to-video 和 image-to-video 工作提交給 OpenRouter，輪詢回傳的 `polling_url`，並從 OpenRouter 的 `unsigned_urls` 或已記錄的 job content 端點下載完成的影片。參考圖像預設會作為第一/最後一幀圖像傳送；標記為 `reference_image` 的圖像會作為 OpenRouter input references 傳送。內建的 `google/veo-3.1-fast` 預設會宣告目前支援的 4/6/8 秒時長、`720P`/`1080P` 解析度，以及 `16:9`/`9:16` 長寬比。OpenRouter 未註冊 video-to-video，因為上游影片生成 API 目前接受文字和圖像參考。

## 音樂生成

OpenRouter 也可以透過 chat completions audio output 支援 `music_generate` 工具。請在 `agents.defaults.musicGenerationModel` 下使用 OpenRouter 音訊模型：

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

內建的 OpenRouter 音樂 provider 預設為 `google/lyria-3-pro-preview`，並且也公開 `google/lyria-3-clip-preview`。OpenClaw 會傳送 `modalities: ["text", "audio"]`、啟用串流、收集串流音訊片段，並將結果儲存為生成的媒體以供頻道傳遞。Lyria 模型會透過共用的 `music_generate image=...` 參數接受參考圖像。

## 文字轉語音

OpenRouter 也可以透過其與 OpenAI 相容的 `/audio/speech` 端點作為 TTS provider 使用。

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

如果省略 `messages.tts.providers.openrouter.apiKey`，TTS 會重用 `models.providers.openrouter.apiKey`，接著使用 `OPENROUTER_API_KEY`。

## 語音轉文字（傳入音訊）

OpenRouter 可以透過共用的 `tools.media.audio` 路徑，使用其 STT 端點（`/audio/transcriptions`）轉錄傳入的語音/音訊附件。這適用於任何會將傳入語音/音訊轉送到媒體理解預檢的頻道外掛。

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

OpenClaw 會將 OpenRouter STT 請求以 JSON 傳送，並在 `input_audio` 下放置 base64 音訊（OpenRouter STT contract），而不是使用 multipart OpenAI form uploads。

## Fusion router

當你希望一個 OpenClaw 模型參照能平行詢問多個 OpenRouter 模型、讓 OpenRouter 評判其答案，並透過一般 OpenRouter provider 端點回傳單一最終回應時，請使用 OpenRouter Fusion。因為上游模型 slug 是 `openrouter/fusion`，OpenClaw 模型參照會同時包含 OpenClaw provider prefix 和上游 OpenRouter namespace：

```bash
openclaw models set openrouter/openrouter/fusion
```

請透過模型的 `params.extraBody` 設定 Fusion 的 panel 和 judge。這些欄位會被轉送到 OpenRouter chat-completions 請求 body。Fusion 可搭配 OpenRouter OAuth 初始設定或 API 金鑰初始設定使用；如果你使用 OAuth，請從下方範例省略 `env.OPENROUTER_API_KEY` 行。

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

`analysis_models` 清單是平行 panel，而 Fusion 外掛設定內的 `model` 是 judge model。在一般 OpenClaw agent/chat 回合中，不要將頂層 `tool_choice` 設為 `"required"` 來嘗試強制使用 Fusion；OpenClaw 回合可能包含 OpenClaw 工具定義，而頂層 required tool choice 可能會要求其中一個工具，而不是 Fusion router。當存在此 Fusion 外掛設定時，OpenClaw 也會加入一則已淨化的 system-prompt note，其中包含已設定的 analysis models 和 judge model，讓 agent 可以回答有關目前 Fusion panel 的問題。其他 `extraBody` 欄位不會複製到 prompt 中。

Fusion 的設計本來就較慢。OpenRouter 可能會將相同的 OpenClaw prompt 傳送到多個 analysis models，然後執行最終 judge/synthesis 步驟，因此延遲通常高於直接的單一模型請求。請將 Fusion 用於需要審慎、高品質回答或升級路徑的情境，而不是作為對延遲敏感聊天的預設值。若要更快回應，請縮小 panel，並選擇較快的 analysis 和 judge models。

使用一次性本機模型呼叫測試設定的參照：

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## 驗證與標頭

OpenRouter 在底層使用 Bearer token 搭配你的 API 金鑰。OpenRouter OAuth 是一個會核發 OpenRouter API 金鑰的 PKCE login flow，因此 OpenClaw 會將結果儲存為與手動 API 金鑰設定路徑相同的 `openrouter:default` API-key auth profile。

對於既有安裝，若要登入或輪替已儲存的 OpenRouter 金鑰，而不重新執行完整初始設定：

```bash
openclaw models auth login --provider openrouter --method oauth
```

當你想貼上自己在 OpenRouter 手動建立的金鑰時，請使用 `openclaw models auth login --provider openrouter --method api-key`。

在實際 OpenRouter 請求（`https://openrouter.ai/api/v1`）上，OpenClaw 也會加入 OpenRouter 文件記載的 app-attribution headers：

| 標頭                      | 值                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
如果你將 OpenRouter provider 重新指向其他 proxy 或 base URL，OpenClaw **不會** 注入那些 OpenRouter-specific headers 或 Anthropic cache markers。
</Warning>

## 進階設定

<AccordionGroup>
  <Accordion title="回應快取">
    OpenRouter response caching 是 opt-in。請使用模型參數，針對每個 OpenRouter 模型啟用：

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

    OpenClaw 會傳送 `X-OpenRouter-Cache: true`，且在設定時傳送 `X-OpenRouter-Cache-TTL`。`responseCacheClear: true` 會強制重新整理目前請求，並儲存替換後的回應。也接受 snake_case aliases（`response_cache`、`response_cache_ttl_seconds` 和 `response_cache_clear`）。

    這與 provider prompt caching 以及 OpenRouter 的 Anthropic `cache_control` markers 分開。它只會套用在已驗證的 `openrouter.ai` routes，而不是自訂 proxy base URLs。

  </Accordion>

  <Accordion title="Anthropic cache markers">
    在已驗證的 OpenRouter routes 上，Anthropic 模型參照會保留 OpenClaw 用於在 system/developer prompt blocks 上提高 prompt-cache 重用率的 OpenRouter-specific Anthropic `cache_control` markers。
  </Accordion>

  <Accordion title="Anthropic 推理預填">
    在已驗證的 OpenRouter 路由上，啟用推理的 Anthropic 模型參照會在請求抵達 OpenRouter
    前捨棄結尾的 assistant 預填回合，以符合 Anthropic 要求推理對話必須以 user
    回合結尾的規定。
  </Accordion>

  <Accordion title="思考 / 推理注入">
    在支援的非 `auto` 路由上，OpenClaw 會將所選的思考層級對應到
    OpenRouter proxy 推理酬載。不支援的模型提示與
    `openrouter/auto` 會略過該推理注入。Hunter Alpha 也會針對過期的已設定模型參照略過
    proxy 推理，因為 OpenRouter 可能會針對該已退役路由在推理欄位中回傳最終答案文字。
  </Accordion>

  <Accordion title="DeepSeek V4 推理重播">
    在已驗證的 OpenRouter 路由上，`openrouter/deepseek/deepseek-v4-flash` 與
    `openrouter/deepseek/deepseek-v4-pro` 會在重播的 assistant 回合上補齊缺少的 `reasoning_content`，
    讓思考/工具對話維持 DeepSeek V4 所要求的後續形狀。OpenClaw 會針對這些路由傳送 OpenRouter 支援的
    `reasoning.effort` 值；較低的非關閉層級會對應到
    `high`，而過期的 `max` 覆寫會對應到 `xhigh`。
  </Accordion>

  <Accordion title="僅限 OpenAI 的請求塑形">
    OpenRouter 仍會經由 proxy 風格的 OpenAI 相容路徑執行，因此
    像是 `serviceTier`、Responses `store`、
    OpenAI 推理相容酬載，以及提示快取提示等原生僅限 OpenAI 的請求塑形不會被轉送。
  </Accordion>

  <Accordion title="Gemini 支援的路由">
    Gemini 支援的 OpenRouter 參照會保留在 proxy-Gemini 路徑上：OpenClaw 會在該處保留
    Gemini thought-signature 清理，但不會啟用原生 Gemini
    重播驗證或 bootstrap 重寫。
  </Accordion>

  <Accordion title="供應商路由中繼資料">
    OpenRouter 支援用於底層供應商路由的 `provider` 請求物件。
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

    OpenClaw 會將該物件作為請求 `provider`
    酬載轉送給 OpenRouter。請使用 OpenRouter 文件記載的 snake_case 欄位，包括 `sort`、
    `only`、`ignore`、`order`、`allow_fallbacks`、`require_parameters`、
    `data_collection`、`quantizations`、`max_price`、`preferred_max_latency`、
    `preferred_min_throughput`、`zdr` 與 `enforce_distillable_text`。

    個別模型參數仍會覆寫供應商範圍的路由物件：

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
    Google、OpenAI 或自訂供應商路由會忽略 OpenRouter 路由參數。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照與容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    agent、模型與供應商的完整設定參考。
  </Card>
</CardGroup>

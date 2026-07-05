---
read_when:
    - 你想要用單一 API 金鑰存取多個 LLMs
    - 您想在 OpenClaw 中透過 OpenRouter 執行模型
    - 你想使用 OpenRouter 進行圖片生成
    - 你想使用 OpenRouter 進行音樂生成
    - 你想使用 OpenRouter 進行影片生成
summary: 使用 OpenRouter 的統一 API 在 OpenClaw 中存取多種模型
title: OpenRouter
x-i18n:
    generated_at: "2026-07-05T11:38:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e500fa78c096a5d16d7099d12a4e96659f15e44be09c3ad6dfcbafdb5f6827fb
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter 會將請求路由到同一個 API 和同一把金鑰背後的多個模型。它與 OpenAI 相容，因此 OpenClaw 會透過與其他代理提供者相同的 `openai-completions` 風格傳輸與其通訊。

## 開始使用

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="執行 OAuth 初始設定">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw 會開啟 OpenRouter 的瀏覽器登入流程（PKCE）、將程式碼交換為 OpenRouter API 金鑰，並將它儲存在預設的 OpenRouter 驗證設定檔中。在遠端或無頭主機上，OpenClaw 會列印登入 URL，並要求你在登入後貼上重新導向 URL。
      </Step>
      <Step title="（選用）切換到特定模型">
        初始設定預設為 `openrouter/auto`。之後可選擇具體模型：

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
        初始設定預設為 `openrouter/auto`。之後可選擇具體模型：

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
模型參照遵循 `openrouter/<provider>/<model>` 模式。如需可用提供者與模型的完整清單，請參閱 [/concepts/model-providers](/zh-TW/concepts/model-providers)。
</Note>

即時目錄探索不可用時使用的內建備援模型：

| 模型參照                          | 備註                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | OpenRouter 自動路由          |
| `openrouter/moonshotai/kimi-k2.6` | 透過 MoonshotAI 的 Kimi K2.6 |
| `openrouter/moonshotai/kimi-k2.5` | 透過 MoonshotAI 的 Kimi K2.5 |

任何其他 `openrouter/<provider>/<model>` 參照，包括 `openrouter/openrouter/fusion`（請參閱 [Fusion 路由器](#fusion-router)），都會依據 OpenRouter 的即時模型目錄動態解析。

## 圖片生成

OpenRouter 可以支援 `image_generate` 工具。在 `agents.defaults.imageGenerationModel` 下設定 OpenRouter 圖片模型：

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

OpenClaw 會使用 `modalities: ["image", "text"]`，將圖片請求傳送到 OpenRouter 的 chat-completions 圖片 API。Gemini 圖片模型還會透過 OpenRouter 的 `image_config` 接收 `aspectRatio` 和 `resolution` 提示；其他圖片模型則不會。對較慢的模型使用 `agents.defaults.imageGenerationModel.timeoutMs`；`image_generate` 工具每次呼叫的 `timeoutMs` 仍會優先。

## 影片生成

OpenRouter 可以透過其非同步 `/videos` API 支援 `video_generate` 工具。在 `agents.defaults.videoGenerationModel` 下設定 OpenRouter 影片模型：

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

OpenClaw 會提交文字轉影片與圖片轉影片工作、輪詢傳回的 `polling_url`，並從 OpenRouter 的 `unsigned_urls` 或工作內容端點下載完成的影片。參照圖片預設為首格/末格圖片；標記為 `reference_image` 的圖片則會作為輸入參照傳送。內建的 `google/veo-3.1-fast` 預設支援 4/6/8 秒時長、`720P`/`1080P` 解析度，以及 `16:9`/`9:16` 長寬比。不支援影片轉影片：上游 API 只接受文字與圖片參照。

## 音樂生成

OpenRouter 可以透過 chat-completions 音訊輸出支援 `music_generate` 工具。在 `agents.defaults.musicGenerationModel` 下設定 OpenRouter 音訊模型：

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

內建的 OpenRouter 音樂提供者預設為 `google/lyria-3-pro-preview`，並也公開 `google/lyria-3-clip-preview`。OpenClaw 會傳送 `modalities: ["text", "audio"]`、串流回應、收集音訊片段，並將結果儲存為生成媒體以供通道傳遞。Lyria 模型可透過共用的 `music_generate image=...` 參數接受一張參照圖片。

## 文字轉語音

OpenRouter 可以透過其與 OpenAI 相容的 `/audio/speech` 端點作為 TTS 提供者。

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

如果省略 `messages.tts.providers.openrouter.apiKey`，TTS 會退回使用 `models.providers.openrouter.apiKey`，再退回使用 `OPENROUTER_API_KEY`。

## 語音轉文字（傳入音訊）

OpenRouter 可以透過共用的 `tools.media.audio` 路徑，使用其 STT 端點（`/audio/transcriptions`）轉錄傳入的語音/音訊附件。這適用於任何會將傳入語音/音訊轉送到媒體理解預檢的通道外掛。

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

OpenClaw 會將 OpenRouter STT 請求作為 JSON 傳送，並在 `input_audio` 下放置 base64 音訊（OpenRouter 的 STT 合約），而不是 multipart OpenAI 表單上傳。

## Fusion 路由器

OpenRouter Fusion 會將一個 OpenClaw 模型參照平行傳送到多個 OpenRouter 模型，讓 OpenRouter 評判其答案，並透過一般 OpenRouter 端點回傳一個最終回應。上游模型 slug 是 `openrouter/fusion`，因此 OpenClaw 模型參照同時包含 OpenClaw 提供者前綴和上游 OpenRouter 命名空間：

```bash
openclaw models set openrouter/openrouter/fusion
```

透過模型的 `params.extraBody` 設定 Fusion 的面板與評判模型；這些欄位會直接轉送到 OpenRouter chat-completions 請求主體。Fusion 可搭配 OAuth 或 API 金鑰初始設定使用；如果你使用 OAuth，請省略下方的 `env.OPENROUTER_API_KEY` 行。

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

`analysis_models` 是平行面板；Fusion 外掛設定內的 `model` 是評判模型。在一般代理/聊天回合中，不要將頂層 `tool_choice` 設為 `"required"` 來嘗試強制使用 Fusion：OpenClaw 回合可以包含自己的工具定義，而頂層必要工具選擇可能會選到那些工具之一，而不是 Fusion 路由器。當存在此 Fusion 外掛設定時，OpenClaw 會加入經過清理的系統提示註記，列出已設定的分析模型與評判模型，讓代理能回答關於自身 Fusion 面板的問題。其他 `extraBody` 欄位不會複製到提示中。

Fusion 的設計本來就較慢：OpenRouter 會將提示分發到多個分析模型，然後執行評判/綜合步驟，因此延遲會高於直接的單模型請求。將它用於審慎、高品質答案或升級路徑，而不是作為延遲敏感的預設值。保持面板精簡，並選擇較快的分析/評判模型以加快回應。

使用一次性本機呼叫測試已設定的參照：

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## 驗證與標頭

OpenRouter 使用來自你的 API 金鑰的 Bearer token。OpenRouter OAuth 是會發行 OpenRouter API 金鑰的 PKCE 登入流程，因此 OpenClaw 會將結果儲存在與手動 API 金鑰設定相同的 `openrouter:default` API 金鑰驗證設定檔中。

若要在既有安裝上登入或輪替已儲存的金鑰，而不重新執行完整初始設定：

```bash
openclaw models auth login --provider openrouter --method oauth
openclaw models auth login --provider openrouter --method api-key
```

在已驗證的 OpenRouter 請求（`https://openrouter.ai/api/v1`）上，OpenClaw 會加入 OpenRouter 文件記載的應用程式歸因標頭：

| 標頭                      | 值                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
如果你將 OpenRouter 提供者重新指向其他代理或基底 URL，OpenClaw **不會**注入那些 OpenRouter 專用標頭或 Anthropic 快取標記。
</Warning>

## 進階設定

<AccordionGroup>
  <Accordion title="回應快取">
    OpenRouter 回應快取採選用啟用。依模型啟用：

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

    OpenClaw 會傳送 `X-OpenRouter-Cache: true`，並在設定時傳送 `X-OpenRouter-Cache-TTL`。`responseCacheClear: true` 會強制重新整理目前請求，並儲存替換回應。接受 snake_case 別名（`response_cache`、`response_cache_ttl_seconds`、`response_cache_clear`），也接受不含 `Seconds` 後綴的 `responseCacheTtl` / `response_cache_ttl`。

    這與提供者提示快取以及 OpenRouter 的 Anthropic `cache_control` 標記分開。它只適用於已驗證的 `openrouter.ai` 路由，不適用於自訂代理基底 URL。

  </Accordion>

  <Accordion title="Anthropic 快取標記">
    在已驗證的 OpenRouter 路由上，Anthropic 模型參照會保留 OpenRouter 的 Anthropic `cache_control` 標記，以便在系統/開發者提示區塊上更好地重用提示快取。
  </Accordion>

  <Accordion title="Anthropic reasoning 預填">
    在已驗證的 OpenRouter 路由上，啟用 reasoning 的 Anthropic 模型參照會在請求送達 OpenRouter 前移除尾端的 assistant 預填回合，以符合 Anthropic 要求 reasoning 對話必須以使用者回合結束的規定。
  </Accordion>

  <Accordion title="思考／推理注入">
    在支援的非 `auto` 路由上，OpenClaw 會將選取的思考層級
    對應到 OpenRouter 代理推理酬載。`openrouter/auto` 和不支援的
    模型提示會略過該注入。過期的 `openrouter/hunter-alpha` 參照也會
    略過它，因為 OpenRouter 可能會在該已淘汰路由的推理
    欄位中傳回最終答案文字。
  </Accordion>

  <Accordion title="DeepSeek V4 推理重播">
    在已驗證的 OpenRouter 路由上，`openrouter/deepseek/deepseek-v4-flash` 和
    `openrouter/deepseek/deepseek-v4-pro` 會在重播的助理輪次中填入缺少的 `reasoning_content`，
    讓思考／工具對話維持 DeepSeek
    V4 所需的後續形狀。OpenClaw 會為這些路由傳送 OpenRouter 支援的
    `reasoning.effort` 值：`xhigh`/`max` 對應到 `xhigh`，
    其他所有非關閉層級都對應到 `high`。
  </Accordion>

  <Accordion title="僅限 OpenAI 的請求塑形">
    OpenRouter 會透過代理式 OpenAI 相容路徑執行，因此不會轉送原生
    僅限 OpenAI 的請求塑形，例如 `serviceTier`、Responses `store`、
    OpenAI 推理相容酬載，以及提示快取提示。
  </Accordion>

  <Accordion title="Gemini 支援的路由">
    Gemini 支援的 OpenRouter 參照會維持在代理 Gemini 路徑上：OpenClaw 會在那裡保留
    Gemini 思考簽章清理，但不會啟用原生
    Gemini 重播驗證或啟動重寫。
  </Accordion>

  <Accordion title="供應商路由中繼資料">
    OpenRouter 支援用於底層供應商路由的 `provider` 請求物件。
    使用 `models.providers.openrouter.params.provider` 為所有 OpenRouter 文字模型請求
    設定預設政策：

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
    `preferred_min_throughput`、`zdr`，以及 `enforce_distillable_text`。

    個別模型參數會覆寫供應商範圍的路由物件：

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
    Google、OpenAI，或自訂供應商路由會忽略 OpenRouter 路由參數。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照，以及容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    agents、models 和 providers 的完整設定參考。
  </Card>
</CardGroup>

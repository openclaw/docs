---
read_when:
    - 你想用單一 API 金鑰存取多種大型語言模型
    - 你想要在 OpenClaw 中透過 OpenRouter 執行模型
    - 你想使用 OpenRouter 產生圖片
    - 你想使用 OpenRouter 產生音樂
    - 你想使用 OpenRouter 生成影片
summary: 使用 OpenRouter 的統一 API，在 OpenClaw 中存取多種模型
title: OpenRouter
x-i18n:
    generated_at: "2026-07-11T21:43:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3047a4da1727db1463d77fcc566231b528e2c34cc64eccaa36827e2927cc60a7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter 透過單一 API 和單一金鑰，將請求路由至多個模型。它與
OpenAI 相容，因此 OpenClaw 會使用與其他代理提供者相同的
`openai-completions` 樣式傳輸方式與其通訊。

## 開始使用

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="執行 OAuth 初始設定">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw 會開啟 OpenRouter 的瀏覽器登入流程（PKCE），以授權碼
        換取 OpenRouter API 金鑰，並將其儲存在預設的 OpenRouter
        驗證設定檔中。在遠端或無頭主機上，OpenClaw 會顯示登入網址，
        並要求你在登入後貼上重新導向網址。
      </Step>
      <Step title="（選用）切換至特定模型">
        初始設定預設使用 `openrouter/auto`。你可以稍後選擇具體模型：

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="API 金鑰">
    <Steps>
      <Step title="取得你的 API 金鑰">
        請在 [openrouter.ai/keys](https://openrouter.ai/keys) 建立 API 金鑰。
      </Step>
      <Step title="執行 API 金鑰初始設定">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="（選用）切換至特定模型">
        初始設定預設使用 `openrouter/auto`。你可以稍後選擇具體模型：

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
模型參照遵循 `openrouter/<provider>/<model>` 格式。如需可用提供者與模型的完整清單，
請參閱 [/concepts/model-providers](/zh-TW/concepts/model-providers)。
</Note>

當無法即時探索目錄時，會使用下列內建備援模型：

| 模型參照                          | 備註                     |
| --------------------------------- | ------------------------ |
| `openrouter/auto`                 | OpenRouter 自動路由      |
| `openrouter/moonshotai/kimi-k2.6` | 透過 MoonshotAI 使用 Kimi K2.6 |
| `openrouter/moonshotai/kimi-k2.5` | 透過 MoonshotAI 使用 Kimi K2.5 |

任何其他 `openrouter/<provider>/<model>` 參照，包括
`openrouter/openrouter/fusion`（請參閱 [Fusion 路由器](#fusion-router)），都會
根據 OpenRouter 的即時模型目錄動態解析。

## 圖片生成

OpenRouter 可作為 `image_generate` 工具的後端。請在
`agents.defaults.imageGenerationModel` 下設定 OpenRouter 圖片模型：

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

OpenClaw 會使用 `modalities: ["image", "text"]`，將圖片請求傳送至
OpenRouter 的聊天補全圖片 API。Gemini 圖片模型還會透過 OpenRouter 的
`image_config` 接收 `aspectRatio` 和 `resolution` 提示；其他圖片模型則不會。
對於速度較慢的模型，請使用 `agents.defaults.imageGenerationModel.timeoutMs`；
但 `image_generate` 工具每次呼叫的 `timeoutMs` 仍具有較高優先順序。

## 影片生成

OpenRouter 可透過其非同步 `/videos` API，作為 `video_generate` 工具的後端。
請在 `agents.defaults.videoGenerationModel` 下設定 OpenRouter 影片模型：

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

OpenClaw 會提交文字轉影片和圖片轉影片工作，輪詢傳回的
`polling_url`，並從 OpenRouter 的 `unsigned_urls` 或工作內容端點下載完成的影片。
參考圖片預設作為首格／末格圖片；標記為 `reference_image` 的圖片則會改為作為輸入參照傳送。
內建的 `google/veo-3.1-fast` 預設模型支援 4／6／8 秒的影片長度、
`720P`／`1080P` 解析度，以及 `16:9`／`9:16` 長寬比。
不支援影片轉影片：上游 API 僅接受文字與圖片參照。

## 音樂生成

OpenRouter 可透過聊天補全的音訊輸出，作為 `music_generate` 工具的後端。
請在 `agents.defaults.musicGenerationModel` 下設定 OpenRouter 音訊模型：

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

內建的 OpenRouter 音樂提供者預設使用 `google/lyria-3-pro-preview`，
並另提供 `google/lyria-3-clip-preview`。OpenClaw 會傳送 `modalities:
["text", "audio"]`、串流處理回應、收集音訊區塊，並將結果儲存為產生的媒體，
以供傳送至頻道。Lyria 模型可透過共用的 `music_generate image=...`
參數接受一張參考圖片。串流音訊、逐字稿保留內容，以及衍生的 SSE 事件封裝，
皆受 `agents.defaults.mediaMaxMb` 限制（預設音訊上限為 16 MB）。

## 文字轉語音

OpenRouter 可透過其與 OpenAI 相容的 `/audio/speech` 端點，作為 TTS 供應商。

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

若省略 `messages.tts.providers.openrouter.apiKey`，TTS 會依序退回使用 `models.providers.openrouter.apiKey`，再使用 `OPENROUTER_API_KEY`。

## 語音轉文字（傳入音訊）

OpenRouter 可透過共用的 `tools.media.audio` 路徑，使用其 STT 端點（`/audio/transcriptions`）轉錄傳入的語音／音訊附件。這適用於任何將傳入語音／音訊轉送至媒體理解預檢的頻道外掛。

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

OpenClaw 會依 OpenRouter 的 STT 規格，以 JSON 傳送 OpenRouter STT 請求，並將 base64 音訊置於 `input_audio` 下，而非使用 multipart OpenAI 表單上傳。

## Fusion 路由器

OpenRouter Fusion 會將一個 OpenClaw 模型參照並行傳送至多個 OpenRouter 模型，讓 OpenRouter 評審其回答，再透過一般的 OpenRouter 端點傳回一個最終回應。上游模型代稱為 `openrouter/fusion`，因此 OpenClaw 模型參照同時包含 OpenClaw 供應商前綴與上游 OpenRouter 命名空間：

```bash
openclaw models set openrouter/openrouter/fusion
```

請透過模型的 `params.extraBody` 設定 Fusion 的模型小組與評審；這些欄位會直接轉送至 OpenRouter 的聊天補全請求本文。Fusion 可搭配 OAuth 或 API 金鑰完成初始設定；若使用 OAuth，請省略下方的 `env.OPENROUTER_API_KEY` 行。

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

`analysis_models` 是並行運作的模型小組；Fusion 外掛設定內的 `model` 是評審模型。在一般代理程式／聊天回合中，請勿將頂層 `tool_choice` 設為 `"required"` 來嘗試強制使用 Fusion：OpenClaw 回合可能包含自身的工具定義，而頂層的必要工具選擇可能會選取其中一項工具，而非 Fusion 路由器。存在此 Fusion 外掛設定時，OpenClaw 會新增經過清理的系統提示詞附註，列出已設定的分析模型與評審模型，讓代理程式能回答有關自身 Fusion 模型小組的問題。其他 `extraBody` 欄位不會複製到提示詞中。

Fusion 本來就設計得較慢：OpenRouter 會將提示詞分送至多個分析模型，再執行評審／統整步驟，因此延遲會高於直接向單一模型發出請求。請將其用於需要審慎、高品質回答或升級處理的路徑，而不要作為對延遲敏感的預設選項。維持精簡的模型小組，並選擇較快的分析／評審模型，以加快回應速度。

使用一次性的本機呼叫測試已設定的參照：

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## 驗證與標頭

OpenRouter 使用來自您 API 金鑰的 Bearer 權杖。OpenRouter OAuth 是一種 PKCE 登入流程，會核發 OpenRouter API 金鑰，因此 OpenClaw 會將結果儲存在手動設定 API 金鑰時所使用的同一個 `openrouter:default` API 金鑰驗證設定檔中。

若要在現有安裝中登入或輪替已儲存的金鑰，而不重新執行完整的初始設定流程：

```bash
openclaw models auth login --provider openrouter --method oauth
openclaw models auth login --provider openrouter --method api-key
```

對於已驗證的 OpenRouter 請求（`https://openrouter.ai/api/v1`），OpenClaw 會加入 OpenRouter 文件所述的應用程式歸屬標頭：

| 標頭                      | 值                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

  <Warning>
  如果您將 OpenRouter 提供者重新指向其他代理伺服器或基礎 URL，OpenClaw
  **不會**注入這些 OpenRouter 專用標頭或 Anthropic 快取標記。
  </Warning>

  ## 進階設定

  <AccordionGroup>
  <Accordion title="回應快取">
    OpenRouter 回應快取需選擇啟用。請針對各模型啟用：

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

    OpenClaw 會傳送 `X-OpenRouter-Cache: true`，並在設定後傳送
    `X-OpenRouter-Cache-TTL`。`responseCacheClear: true` 會強制重新整理
    目前的請求，並儲存替代回應。也接受蛇形命名別名
    （`response_cache`、`response_cache_ttl_seconds`、
    `response_cache_clear`），以及不含 `Seconds` 後綴的
    `responseCacheTtl` / `response_cache_ttl`。

    此功能與提供者提示詞快取及 OpenRouter 的 Anthropic
    `cache_control` 標記互相獨立。它僅適用於已驗證的
    `openrouter.ai` 路由，不適用於自訂代理伺服器基礎 URL。

  </Accordion>

  <Accordion title="Anthropic 快取標記">
    在已驗證的 OpenRouter 路由上，Anthropic 模型參照會保留 OpenRouter 的
    Anthropic `cache_control` 標記，以便在系統／開發者提示詞區塊上
    更有效地重複使用提示詞快取。
  </Accordion>

  <Accordion title="Anthropic 推理預填">
    在已驗證的 OpenRouter 路由上，啟用推理的 Anthropic 模型參照
    會在請求抵達 OpenRouter 前移除尾端的助理預填輪次，
    以符合 Anthropic 對推理對話必須以使用者輪次結束的要求。
  </Accordion>

  <Accordion title="思考／推理注入">
    在支援的非 `auto` 路由上，OpenClaw 會將所選的思考層級
    對應至 OpenRouter 代理推理酬載。`openrouter/auto` 和不支援的
    模型提示會略過該注入。過時的 `openrouter/hunter-alpha` 參照也會
    略過，因為 OpenRouter 可能會在該已淘汰路由的推理欄位中傳回最終答案文字。
  </Accordion>

  <Accordion title="DeepSeek V4 推理重播">
    在已驗證的 OpenRouter 路由上，`openrouter/deepseek/deepseek-v4-flash` 和
    `openrouter/deepseek/deepseek-v4-pro` 會在重播的助理輪次中補上缺少的
    `reasoning_content`，使思考／工具對話維持 DeepSeek V4
    所要求的後續格式。OpenClaw 會為這些路由傳送 OpenRouter 支援的
    `reasoning.effort` 值：`xhigh`／`max` 對應至 `xhigh`，
    其他所有非關閉層級則對應至 `high`。
  </Accordion>

  <Accordion title="僅限 OpenAI 的請求塑形">
    OpenRouter 透過代理式的 OpenAI 相容路徑運作，因此不會轉送
    僅限原生 OpenAI 的請求塑形，例如 `serviceTier`、Responses 的 `store`、
    OpenAI 推理相容酬載，以及提示快取提示。
  </Accordion>

  <Accordion title="以 Gemini 為後端的路由">
    以 Gemini 為後端的 OpenRouter 參照會維持使用代理 Gemini 路徑：OpenClaw 會在該處保留
    Gemini 思考簽章清理，但不會啟用原生
    Gemini 重播驗證或啟動改寫。
  </Accordion>

  <Accordion title="提供者路由中繼資料">
    OpenRouter 支援使用 `provider` 請求物件來路由至底層提供者。
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

    OpenClaw 會將該物件作為請求的 `provider` 酬載轉送至 OpenRouter。
    請使用 OpenRouter 文件所述的蛇形命名欄位，包括 `sort`、
    `only`、`ignore`、`order`、`allow_fallbacks`、`require_parameters`、
    `data_collection`、`quantizations`、`max_price`、`preferred_max_latency`、
    `preferred_min_throughput`、`zdr` 和 `enforce_distillable_text`。

    各模型的參數會覆寫提供者全域的路由物件：

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

    這僅適用於 OpenRouter 的聊天補全路由。直接使用 Anthropic、
    Google、OpenAI 或自訂提供者的路由會忽略 OpenRouter 路由參數。

  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照及容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    代理程式、模型及提供者的完整設定參考。
  </Card>
</CardGroup>

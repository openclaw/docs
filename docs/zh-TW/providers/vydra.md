---
read_when:
    - 你想在 OpenClaw 中使用 Vydra 產生媒體內容
    - 你需要 Vydra API 金鑰設定指南
summary: 在 OpenClaw 中使用 Vydra 的圖片、影片與語音功能
title: Vydra
x-i18n:
    generated_at: "2026-07-22T10:45:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cc3856c2dd740e87d70d7eedefd9eae7905ab547aa0d68a1c479a305c59b2982
    source_path: providers/vydra.md
    workflow: 16
---

隨附的 Vydra 外掛新增：

- 透過 `vydra/grok-imagine` 產生圖片
- 透過 `vydra/veo3`（文字轉影片）和 `vydra/kling`（圖片轉影片）產生影片
- 透過 Vydra 由 ElevenLabs 支援的 TTS 路由進行語音合成

OpenClaw 對這三項功能使用相同的 `VYDRA_API_KEY`。

| 屬性            | 值                                                                        |
| --------------- | ------------------------------------------------------------------------- |
| 提供者 ID       | `vydra`                                                        |
| 外掛            | 隨附，`enabledByDefault: true`                                                  |
| 驗證環境變數    | `VYDRA_API_KEY`                                                        |
| 初始設定旗標    | `--auth-choice vydra-api-key`                                                        |
| 直接命令列旗標  | `--vydra-api-key <key>`                                                        |
| 合約            | `imageGenerationProviders`、`videoGenerationProviders`、`speechProviders`               |
| 基礎 URL        | `https://www.vydra.ai/api/v1`（使用 `www` 主機）                        |

<Warning>
使用 `https://www.vydra.ai/api/v1` 作為基礎 URL。Vydra 的根網域主機（`https://vydra.ai/api/v1`）目前會重新導向至 `www`。部分 HTTP 用戶端會在跨主機重新導向時捨棄 `Authorization`，導致有效的 API 金鑰出現誤導性的驗證失敗。隨附的外掛會將任何已設定的 `vydra.ai` 基礎 URL 正規化為 `www.vydra.ai`，以避免此問題。
</Warning>

## 設定

<Steps>
  <Step title="執行互動式初始設定">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    或直接設定環境變數：

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="選擇預設功能">
    從下列功能（圖片、影片或語音）中選擇一項或多項，並套用相符的設定。
  </Step>
</Steps>

## 功能

<AccordionGroup>
  <Accordion title="圖片產生">
    預設且唯一隨附的圖片模型：

    - `vydra/grok-imagine`

    將其設為預設圖片提供者：

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "vydra/grok-imagine",
          },
        },
      },
    }
    ```

    隨附支援僅限文字轉圖片，每次要求最多產生一張圖片。Vydra 託管的編輯路由需要遠端圖片 URL，而隨附的外掛不會新增 Vydra 專用的上傳橋接功能。

    <Note>
    如需共用工具參數、提供者選擇及容錯移轉行為，請參閱[圖片產生](/zh-TW/tools/image-generation)。
    </Note>

  </Accordion>

  <Accordion title="影片產生">
    已註冊的影片模型：

    - `vydra/veo3` 用於文字轉影片（拒絕圖片參照輸入）
    - `vydra/kling` 用於圖片轉影片（必須正好提供一個遠端圖片 URL）

    將 Vydra 設為預設影片提供者：

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "vydra/veo3",
          },
        },
      },
    }
    ```

    注意事項：

    - `vydra/kling` 會預先拒絕本機檔案上傳；僅支援遠端圖片 URL 參照。
    - Vydra 的 `kling` HTTP 路由對於要求 `image_url` 或 `video_url` 的行為並不一致；隨附的提供者會在這兩個欄位中傳送相同的遠端圖片 URL。
    - 隨附的外掛採取保守策略，不會轉送未記載於文件中的樣式控制項，例如長寬比、解析度、浮水印或產生的音訊。

    <Note>
    如需共用工具參數、提供者選擇及容錯移轉行為，請參閱[影片產生](/zh-TW/tools/video-generation)。
    </Note>

  </Accordion>

  <Accordion title="影片即時測試">
    提供者專屬的即時測試涵蓋範圍：

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    隨附的 Vydra 即時測試檔案涵蓋：

    - `vydra/veo3` 文字轉影片
    - `vydra/kling` 使用遠端圖片 URL 進行圖片轉影片

    視需要覆寫遠端圖片測試資料：

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="語音合成">
    將 Vydra 設為語音提供者：

    ```json5
    {
      tts: {
        provider: "vydra",
        providers: {
          vydra: {
            apiKey: "${VYDRA_API_KEY}",
            voiceId: "21m00Tcm4TlvDq8ikWAM",
          },
        },
      },
    }
    ```

    預設值：

    - 模型：`elevenlabs/tts`
    - 語音 ID：`21m00Tcm4TlvDq8ikWAM`（“Rachel”）

    隨附的外掛會公開這個已知可正常運作的預設語音，並傳回 MP3 音訊檔案。

  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="提供者目錄" href="/zh-TW/providers/index" icon="list">
    瀏覽所有可用的提供者。
  </Card>
  <Card title="圖片產生" href="/zh-TW/tools/image-generation" icon="image">
    共用圖片工具參數與提供者選擇。
  </Card>
  <Card title="影片產生" href="/zh-TW/tools/video-generation" icon="video">
    共用影片工具參數與提供者選擇。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/config-agents#agent-defaults" icon="gear">
    代理程式預設值與模型設定。
  </Card>
</CardGroup>

---
read_when:
    - 你想在 OpenClaw 中使用 Vydra 媒體生成
    - 你需要 Vydra API 金鑰設定指引
summary: 在 OpenClaw 中使用 Vydra 影像、影片和語音
title: Vydra
x-i18n:
    generated_at: "2026-06-27T19:58:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb1128d877e06a274fe07c42282a7990c322e4d88d4232a1cac78e54deaf163
    source_path: providers/vydra.md
    workflow: 16
---

內建 Vydra 外掛新增：

- 透過 `vydra/grok-imagine` 產生圖片
- 透過 `vydra/veo3` 和 `vydra/kling` 產生影片
- 透過 Vydra 的 ElevenLabs 後端 TTS 路由進行語音合成

OpenClaw 會對這三種能力使用相同的 `VYDRA_API_KEY`。

| 屬性            | 值                                                                        |
| --------------- | ------------------------------------------------------------------------- |
| 提供者 id       | `vydra`                                                                   |
| 外掛            | 內建，`enabledByDefault: true`                                            |
| 驗證環境變數    | `VYDRA_API_KEY`                                                           |
| 初始設定旗標    | `--auth-choice vydra-api-key`                                             |
| 直接命令列介面旗標 | `--vydra-api-key <key>`                                                   |
| 合約            | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| 基礎 URL        | `https://www.vydra.ai/api/v1`（使用 `www` 主機）                          |

<Warning>
  使用 `https://www.vydra.ai/api/v1` 作為基礎 URL。Vydra 的 apex 主機（`https://vydra.ai/api/v1`）目前會重新導向至 `www`。部分 HTTP 用戶端會在跨主機重新導向時捨棄 `Authorization`，導致有效的 API 金鑰變成誤導性的驗證失敗。內建外掛會直接使用 `www` 基礎 URL 來避免這個問題。
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
  <Step title="選擇預設能力">
    選擇下列一項或多項能力（圖片、影片或語音），並套用相符的設定。
  </Step>
</Steps>

## 能力

<AccordionGroup>
  <Accordion title="圖片產生">
    預設圖片模型：

    - `vydra/grok-imagine`

    將它設為預設圖片提供者：

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

    目前內建支援僅限文字轉圖片。Vydra 的託管編輯路由預期使用遠端圖片 URL，而 OpenClaw 尚未在內建外掛中加入 Vydra 專用的上傳橋接。

    <Note>
    請參閱[圖片產生](/zh-TW/tools/image-generation)，了解共用工具參數、提供者選擇和容錯移轉行為。
    </Note>

  </Accordion>

  <Accordion title="影片產生">
    已註冊的影片模型：

    - `vydra/veo3` 用於文字轉影片
    - `vydra/kling` 用於圖片轉影片

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

    - `vydra/veo3` 內建僅作為文字轉影片。
    - `vydra/kling` 目前需要遠端圖片 URL 參照。本機檔案上傳會預先遭到拒絕。
    - Vydra 目前的 `kling` HTTP 路由對於是否需要 `image_url` 或 `video_url` 一直不一致；內建提供者會將同一個遠端圖片 URL 對應到兩個欄位。
    - 內建外掛保持保守，不會轉送未記錄的樣式調整參數，例如長寬比、解析度、浮水印或產生的音訊。

    <Note>
    請參閱[影片產生](/zh-TW/tools/video-generation)，了解共用工具參數、提供者選擇和容錯移轉行為。
    </Note>

  </Accordion>

  <Accordion title="影片即時測試">
    提供者專屬的即時涵蓋範圍：

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    內建 Vydra 即時檔案現在涵蓋：

    - `vydra/veo3` 文字轉影片
    - `vydra/kling` 使用遠端圖片 URL 的圖片轉影片

    需要時覆寫遠端圖片測試素材：

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="語音合成">
    將 Vydra 設為語音提供者：

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              speakerVoiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    預設值：

    - 模型：`elevenlabs/tts`
    - 語音 id：`21m00Tcm4TlvDq8ikWAM`

    內建外掛目前公開一個已知可用的預設語音，並回傳 MP3 音訊檔案。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="提供者目錄" href="/zh-TW/providers/index" icon="list">
    瀏覽所有可用的提供者。
  </Card>
  <Card title="圖片產生" href="/zh-TW/tools/image-generation" icon="image">
    共用圖片工具參數和提供者選擇。
  </Card>
  <Card title="影片產生" href="/zh-TW/tools/video-generation" icon="video">
    共用影片工具參數和提供者選擇。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/config-agents#agent-defaults" icon="gear">
    Agent 預設值和模型設定。
  </Card>
</CardGroup>

---
read_when:
    - 你想在 OpenClaw 中使用 Vydra 媒體生成功能
    - 你需要 Vydra API 金鑰設定指南
summary: 在 OpenClaw 中使用 Vydra 的圖片、影片和語音
title: Vydra
x-i18n:
    generated_at: "2026-04-30T03:35:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85420c3f337c13313bf571d5ee92c1f1988ff8119d401e7ec0ea0db1e74d9b69
    source_path: providers/vydra.md
    workflow: 16
---

隨附的 Vydra Plugin 會加入：

- 透過 `vydra/grok-imagine` 產生圖片
- 透過 `vydra/veo3` 和 `vydra/kling` 產生影片
- 透過 Vydra 以 ElevenLabs 支援的 TTS 路由進行語音合成

OpenClaw 會對這三項功能使用相同的 `VYDRA_API_KEY`。

<Warning>
使用 `https://www.vydra.ai/api/v1` 作為基底 URL。

Vydra 的 apex 主機 (`https://vydra.ai/api/v1`) 目前會重新導向至 `www`。部分 HTTP 用戶端會在該跨主機重新導向時捨棄 `Authorization`，使有效的 API 金鑰變成誤導性的驗證失敗。隨附的 Plugin 會直接使用 `www` 基底 URL 以避免此情況。
</Warning>

## 設定

<Steps>
  <Step title="執行互動式 onboarding">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    或直接設定環境變數：

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="選擇預設功能">
    選擇下列一或多項功能（圖片、影片或語音），並套用相符的設定。
  </Step>
</Steps>

## 功能

<AccordionGroup>
  <Accordion title="圖片產生">
    預設圖片模型：

    - `vydra/grok-imagine`

    將其設定為預設圖片提供者：

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

    目前隨附支援僅限文字轉圖片。Vydra 的託管編輯路由需要遠端圖片 URL，而 OpenClaw 尚未在隨附 Plugin 中加入 Vydra 專用的上傳橋接。

    <Note>
    請參閱[圖片產生](/zh-TW/tools/image-generation)，了解共用工具參數、提供者選擇和容錯移轉行為。
    </Note>

  </Accordion>

  <Accordion title="影片產生">
    已註冊的影片模型：

    - `vydra/veo3` 用於文字轉影片
    - `vydra/kling` 用於圖片轉影片

    將 Vydra 設定為預設影片提供者：

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

    - `vydra/veo3` 隨附為僅支援文字轉影片。
    - `vydra/kling` 目前需要遠端圖片 URL 參照。本機檔案上傳會預先被拒絕。
    - Vydra 目前的 `kling` HTTP 路由對於是否需要 `image_url` 或 `video_url` 一直不一致；隨附的提供者會將相同的遠端圖片 URL 對應到這兩個欄位。
    - 隨附的 Plugin 維持保守，不會轉送未記載的樣式旋鈕，例如長寬比、解析度、浮水印或產生的音訊。

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

    隨附的 Vydra 即時檔案現在涵蓋：

    - `vydra/veo3` 文字轉影片
    - `vydra/kling` 使用遠端圖片 URL 進行圖片轉影片

    需要時覆寫遠端圖片 fixture：

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="語音合成">
    將 Vydra 設定為語音提供者：

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              voiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    預設值：

    - 模型：`elevenlabs/tts`
    - 語音 ID：`21m00Tcm4TlvDq8ikWAM`

    隨附的 Plugin 目前公開一個已知可用的預設語音，並會傳回 MP3 音訊檔案。

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

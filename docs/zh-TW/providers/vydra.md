---
read_when:
    - 你想要在 OpenClaw 中使用 Vydra 媒體生成
    - 你需要 Vydra API 金鑰設定指南
summary: 在 OpenClaw 中使用 Vydra 圖像、影片和語音
title: Vydra
x-i18n:
    generated_at: "2026-07-05T11:44:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e775bdd6f4ec7d1f5189910af450b92d8d6e831c17c338271afee962636ba69f
    source_path: providers/vydra.md
    workflow: 16
---

內建的 Vydra 外掛會新增：

- 透過 `vydra/grok-imagine` 產生圖片
- 透過 `vydra/veo3`（文字轉影片）和 `vydra/kling`（圖片轉影片）產生影片
- 透過 Vydra 的 ElevenLabs 後端 TTS 路由進行語音合成

OpenClaw 對這三項功能都使用相同的 `VYDRA_API_KEY`。

| 屬性            | 值                                                                        |
| --------------- | ------------------------------------------------------------------------- |
| 供應商 id       | `vydra`                                                                   |
| 外掛            | 內建，`enabledByDefault: true`                                            |
| 驗證環境變數    | `VYDRA_API_KEY`                                                           |
| 入門設定旗標    | `--auth-choice vydra-api-key`                                             |
| 直接命令列介面旗標 | `--vydra-api-key <key>`                                                   |
| 合約            | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| 基底 URL        | `https://www.vydra.ai/api/v1`（使用 `www` 主機）                          |

<Warning>
請使用 `https://www.vydra.ai/api/v1` 作為基底 URL。Vydra 的根網域主機（`https://vydra.ai/api/v1`）目前會重新導向到 `www`。有些 HTTP 用戶端會在這種跨主機重新導向時丟棄 `Authorization`，導致有效的 API 金鑰變成誤導性的驗證失敗。內建外掛會將任何已設定的 `vydra.ai` 基底 URL 正規化為 `www.vydra.ai`，以避免這個問題。
</Warning>

## 設定

<Steps>
  <Step title="執行互動式入門設定">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    或直接設定環境變數：

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="選擇預設功能">
    選擇下列一項或多項功能（圖片、影片或語音），並套用相符的設定。
  </Step>
</Steps>

## 功能

<AccordionGroup>
  <Accordion title="圖片產生">
    預設且唯一的內建圖片模型：

    - `vydra/grok-imagine`

    將它設定為預設圖片供應商：

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

    內建支援僅限文字轉圖片，每次請求最多一張圖片。Vydra 的託管編輯路由預期使用遠端圖片 URL，而內建外掛不會新增 Vydra 專用的上傳橋接。

    <Note>
    請參閱[圖片產生](/zh-TW/tools/image-generation)，了解共用工具參數、供應商選擇和容錯移轉行為。
    </Note>

  </Accordion>

  <Accordion title="影片產生">
    已註冊的影片模型：

    - `vydra/veo3` 用於文字轉影片（拒絕圖片參考輸入）
    - `vydra/kling` 用於圖片轉影片（需要正好一個遠端圖片 URL）

    將 Vydra 設定為預設影片供應商：

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

    - `vydra/kling` 會預先拒絕本機檔案上傳；只有遠端圖片 URL 參考能運作。
    - Vydra 的 `kling` HTTP 路由對於是否需要 `image_url` 或 `video_url` 一直不一致；內建供應商會在這兩個欄位中傳送相同的遠端圖片 URL。
    - 內建外掛採取保守做法，不會轉送未記載的樣式旋鈕，例如長寬比、解析度、浮水印或產生的音訊。

    <Note>
    請參閱[影片產生](/zh-TW/tools/video-generation)，了解共用工具參數、供應商選擇和容錯移轉行為。
    </Note>

  </Accordion>

  <Accordion title="影片即時測試">
    供應商專屬的即時涵蓋範圍：

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    內建的 Vydra 即時檔案涵蓋：

    - `vydra/veo3` 文字轉影片
    - 使用遠端圖片 URL 的 `vydra/kling` 圖片轉影片

    需要時覆寫遠端圖片測試固定資料：

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="語音合成">
    將 Vydra 設定為語音供應商：

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
    - 聲音 id：`21m00Tcm4TlvDq8ikWAM`（"Rachel"）

    內建外掛會公開這個已知可用的預設聲音，並傳回 MP3 音訊檔案。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="供應商目錄" href="/zh-TW/providers/index" icon="list">
    瀏覽所有可用的供應商。
  </Card>
  <Card title="圖片產生" href="/zh-TW/tools/image-generation" icon="image">
    共用圖片工具參數和供應商選擇。
  </Card>
  <Card title="影片產生" href="/zh-TW/tools/video-generation" icon="video">
    共用影片工具參數和供應商選擇。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/config-agents#agent-defaults" icon="gear">
    Agent 預設值和模型設定。
  </Card>
</CardGroup>

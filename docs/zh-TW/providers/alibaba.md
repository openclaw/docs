---
read_when:
    - 你想在 OpenClaw 中使用 Alibaba Wan 影片生成
    - 你需要設定 Model Studio 或 DashScope API 金鑰，才能產生影片
summary: OpenClaw 中的 Alibaba Model Studio Wan 影片生成
title: 阿里巴巴模型工作室
x-i18n:
    generated_at: "2026-05-06T02:55:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: c390da201e2c8685fafa6171a6028bf18fc676b2d46f784651f91cdc6137fdf2
    source_path: providers/alibaba.md
    workflow: 16
---

OpenClaw 隨附一個 `alibaba` Plugin，會為 Alibaba Model Studio（DashScope 的國際名稱）上的 Wan 模型註冊影片生成提供者。此 Plugin 預設啟用；你只需要設定 API 金鑰。

| 屬性             | 值                                                                              |
| ---------------- | ------------------------------------------------------------------------------- |
| 提供者 id        | `alibaba`                                                                       |
| Plugin           | 隨附，`enabledByDefault: true`                                                  |
| Auth 環境變數    | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY`（第一個符合者優先） |
| Onboarding 旗標  | `--auth-choice alibaba-model-studio-api-key`                                    |
| 直接 CLI 旗標    | `--alibaba-model-studio-api-key <key>`                                          |
| 預設模型         | `alibaba/wan2.6-t2v`                                                            |
| 預設基礎 URL     | `https://dashscope-intl.aliyuncs.com`                                           |

## 開始使用

<Steps>
  <Step title="設定 API 金鑰">
    使用 onboarding 將金鑰儲存到 `alibaba` 提供者：

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    或在安裝/onboarding 期間直接傳入金鑰：

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    或在啟動 Gateway 前匯出任一受支援的環境變數：

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # or DASHSCOPE_API_KEY=...
    # or QWEN_API_KEY=...
    ```

  </Step>
  <Step title="設定預設影片模型">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="確認提供者已設定">
    ```bash
    openclaw models list --provider alibaba
    ```

    清單應包含全部五個隨附的 Wan 模型。如果無法解析 `MODELSTUDIO_API_KEY`，`openclaw models status --json` 會在 `auth.unusableProfiles` 下回報缺少的認證。

  </Step>
</Steps>

<Note>
  Alibaba Plugin 和 [Qwen Plugin](/zh-TW/providers/qwen) 都會對 DashScope 進行驗證，並接受重疊的環境變數。使用 `alibaba/...` 模型 id 來驅動專用的 Wan 影片介面；當你需要 Qwen 的聊天、嵌入或媒體理解介面時，請使用 `qwen/...` id。
</Note>

## 內建 Wan 模型

| 模型參照                   | 模式                      |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v`       | 文字轉影片（預設）        |
| `alibaba/wan2.6-i2v`       | 圖片轉影片                |
| `alibaba/wan2.6-r2v`       | 參照轉影片                |
| `alibaba/wan2.6-r2v-flash` | 參照轉影片（快速）        |
| `alibaba/wan2.7-r2v`       | 參照轉影片                |

## 功能與限制

隨附的提供者會對應 DashScope 的 Wan 影片 API 上限。三種模式共用相同的每次請求影片數量與時長上限；只有輸入形狀不同。

| 模式               | 最大輸出影片數 | 最大輸入圖片數 | 最大輸入影片數 | 最長時長 | 支援的控制項                                              |
| ------------------ | -------------- | -------------- | -------------- | -------- | --------------------------------------------------------- |
| 文字轉影片         | 1              | n/a            | n/a            | 10 s     | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| 圖片轉影片         | 1              | 1              | n/a            | 10 s     | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| 參照轉影片         | 1              | n/a            | 4              | 10 s     | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

當請求省略 `durationSeconds` 時，提供者會傳送 DashScope 接受的預設值 **5 秒**。在[影片生成工具](/zh-TW/tools/video-generation)上明確設定 `durationSeconds`，可延長到最多 10 s。

<Warning>
  參照圖片與影片輸入必須是遠端 `http(s)` URL。DashScope 的參照模式不接受本機檔案路徑；請先上傳到物件儲存空間，或使用已會產生公開 URL 的[媒體工具](/zh-TW/tools/media-overview)流程。
</Warning>

## 進階設定

<AccordionGroup>
  <Accordion title="覆寫 DashScope 基礎 URL">
    提供者預設使用國際 DashScope 端點。若要指定中國區域端點，請設定：

    ```json5
    {
      models: {
        providers: {
          alibaba: {
            baseUrl: "https://dashscope.aliyuncs.com",
          },
        },
      },
    }
    ```

    提供者會在建構 AIGC 任務 URL 前移除結尾斜線。

  </Accordion>

  <Accordion title="Auth 環境優先順序">
    OpenClaw 會依下列順序從環境變數解析 Alibaba API 金鑰，並採用第一個非空值：

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    已設定的 `auth.profiles` 項目（透過 `openclaw models auth login` 設定）會覆寫環境變數解析。請參閱[模型 FAQ 中的 Auth 設定檔](/zh-TW/help/faq-models#what-is-an-auth-profile)，了解設定檔輪換、冷卻與覆寫機制。

  </Accordion>

  <Accordion title="與 Qwen Plugin 的關係">
    兩個隨附 Plugin 都會與 DashScope 通訊，並接受重疊的 API 金鑰。請使用：

    - `alibaba/wan*.*` id 來驅動本頁所記錄的專用 Wan 影片提供者。
    - `qwen/*` id 用於 Qwen 聊天、嵌入與媒體理解（請參閱 [Qwen](/zh-TW/providers/qwen)）。

    只要設定一次 `MODELSTUDIO_API_KEY`，就會驗證兩個 Plugin，因為 auth 環境變數清單刻意重疊；你不需要分別 onboarding 每個 Plugin。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用影片工具參數與提供者選擇。
  </Card>
  <Card title="Qwen" href="/zh-TW/providers/qwen" icon="microchip">
    在相同 DashScope auth 上設定 Qwen 聊天、嵌入與媒體理解。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/config-agents#agent-defaults" icon="gear">
    Agent 預設值與模型設定。
  </Card>
  <Card title="模型 FAQ" href="/zh-TW/help/faq-models" icon="circle-question">
    Auth 設定檔、切換模型，以及解決「no profile」錯誤。
  </Card>
</CardGroup>

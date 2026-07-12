---
read_when:
    - 你想在 OpenClaw 中使用阿里巴巴 Wan 影片生成功能
    - 你需要設定 Model Studio 或 DashScope API 金鑰，才能生成影片
summary: OpenClaw 中的阿里巴巴百鍊 Wan 影片生成
title: 阿里巴巴模型工作室
x-i18n:
    generated_at: "2026-07-11T21:41:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb74e2361500ccfbc5d3c4f2d08c3b62aacba8c79c704570952e2181abacf9fb
    source_path: providers/alibaba.md
    workflow: 16
---

隨附的 `alibaba` 外掛會為 Alibaba Model Studio（DashScope 的國際名稱）上的 Wan 模型註冊影片生成供應商。此功能預設啟用，只需要 API 金鑰。

| 屬性             | 值                                                                              |
| ---------------- | ------------------------------------------------------------------------------- |
| 供應商 ID        | `alibaba`                                                                       |
| 外掛             | 隨附，`enabledByDefault: true`                                                   |
| 驗證環境變數     | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY`（第一個符合者優先） |
| 新手設定旗標     | `--auth-choice alibaba-model-studio-api-key`                                    |
| 直接命令列介面旗標 | `--alibaba-model-studio-api-key <key>`                                          |
| 預設模型         | `alibaba/wan2.6-t2v`                                                            |
| 預設基底 URL     | `https://dashscope-intl.aliyuncs.com`                                           |

## 開始使用

<Steps>
  <Step title="設定 API 金鑰">
    透過新手設定，將金鑰儲存至 `alibaba` 供應商：

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    或直接傳入金鑰：

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    或在啟動閘道前匯出其中一個可接受的環境變數：

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # 或 DASHSCOPE_API_KEY=...
    # 或 QWEN_API_KEY=...
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
  <Step title="確認供應商已設定">
    ```bash
    openclaw models list --provider alibaba
    ```

    清單會包含全部五個隨附的 Wan 模型。如果無法解析 `MODELSTUDIO_API_KEY`，`openclaw models status --json` 會在 `auth.unusableProfiles` 下回報缺少的認證資訊。

  </Step>
</Steps>

<Note>
  Alibaba 外掛和 [Qwen 外掛](/zh-TW/providers/qwen) 都會向 DashScope 進行驗證，並接受部分相同的環境變數。專用 Wan 影片介面請使用 `alibaba/...` 模型 ID；Qwen 聊天、嵌入或媒體理解功能則使用 `qwen/...` ID。
</Note>

## 內建 Wan 模型

| 模型參照                   | 模式                    |
| -------------------------- | ----------------------- |
| `alibaba/wan2.6-t2v`       | 文字轉影片（預設）      |
| `alibaba/wan2.6-i2v`       | 圖片轉影片              |
| `alibaba/wan2.6-r2v`       | 參考素材轉影片          |
| `alibaba/wan2.6-r2v-flash` | 參考素材轉影片（快速）  |
| `alibaba/wan2.7-r2v`       | 參考素材轉影片          |

## 功能與限制

這三種模式的每次請求影片數量和時長上限都相同，只有輸入格式不同。

| 模式             | 最大輸出影片數 | 最大輸入圖片數 | 最大輸入影片數 | 最長時長 | 支援的控制項                                              |
| ---------------- | -------------- | -------------- | -------------- | -------- | --------------------------------------------------------- |
| 文字轉影片       | 1              | 不適用         | 不適用         | 10 秒    | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| 圖片轉影片       | 1              | 1              | 不適用         | 10 秒    | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| 參考素材轉影片   | 1              | 不適用         | 4              | 10 秒    | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

省略 `durationSeconds` 的請求會採用 DashScope 接受的預設值 **5 秒**。若要延長至最多 10 秒，請在[影片生成工具](/zh-TW/tools/video-generation)中明確設定 `durationSeconds`。

<Warning>
  參考圖片和影片輸入必須是遠端 `http(s)` URL；DashScope 的參考模式會拒絕本機檔案路徑。請先上傳至物件儲存空間，或使用已能產生公開 URL 的[媒體工具](/zh-TW/tools/media-overview)流程。
</Warning>

## 進階設定

<AccordionGroup>
  <Accordion title="覆寫 DashScope 基底 URL">
    此供應商預設使用 DashScope 的國際端點。若要指定中國地區端點：

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

    供應商會先移除結尾斜線，再建構 AIGC 任務 URL。

  </Accordion>

  <Accordion title="驗證環境變數優先順序">
    OpenClaw 會依下列順序從環境變數解析 Alibaba API 金鑰，並採用第一個非空值：

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    已設定的 `auth.profiles` 項目（透過 `openclaw models auth login` 設定）會覆寫環境變數解析。關於設定檔輪替、冷卻期和覆寫機制，請參閱[模型常見問題中的驗證設定檔](/zh-TW/help/faq-models#auth-profiles-what-they-are-and-how-to-manage-them)。

  </Accordion>

  <Accordion title="與 Qwen 外掛的關係">
    這兩個隨附外掛都會與 DashScope 通訊，並接受部分相同的 API 金鑰。請使用：

    - `alibaba/wan*.*` ID：用於本頁記載的專用 Wan 影片供應商。
    - `qwen/*` ID：用於 Qwen 聊天、嵌入和媒體理解（請參閱 [Qwen](/zh-TW/providers/qwen)）。

    只要設定一次 `MODELSTUDIO_API_KEY`，即可驗證兩個外掛，因為驗證環境變數清單刻意有所重疊；不需要分別為每個外掛執行新手設定。

  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用影片工具參數與供應商選擇。
  </Card>
  <Card title="Qwen" href="/zh-TW/providers/qwen" icon="microchip">
    使用相同 DashScope 驗證的 Qwen 聊天、嵌入和媒體理解設定。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/config-agents#agent-defaults" icon="gear">
    代理程式預設值與模型設定。
  </Card>
  <Card title="模型常見問題" href="/zh-TW/help/faq-models" icon="circle-question">
    驗證設定檔、切換模型，以及解決「沒有設定檔」錯誤。
  </Card>
</CardGroup>

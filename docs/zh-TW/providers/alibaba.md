---
read_when:
    - 你想在 OpenClaw 中使用 Alibaba Wan 影片生成
    - 影片生成需要設定 Model Studio 或 DashScope API 金鑰
summary: OpenClaw 中的 Alibaba Model Studio Wan 影片生成
title: 阿里巴巴 Model Studio
x-i18n:
    generated_at: "2026-07-05T11:39:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb74e2361500ccfbc5d3c4f2d08c3b62aacba8c79c704570952e2181abacf9fb
    source_path: providers/alibaba.md
    workflow: 16
---

內建的 `alibaba` 外掛會為 Alibaba Model Studio（DashScope 的國際名稱）上的 Wan 模型註冊影片生成提供者。它預設啟用；只需要 API 金鑰。

| 屬性             | 值                                                                              |
| ---------------- | ------------------------------------------------------------------------------- |
| 提供者 ID        | `alibaba`                                                                       |
| 外掛             | 內建，`enabledByDefault: true`                                                  |
| 驗證環境變數     | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY`（第一個符合者優先） |
| 入門設定旗標     | `--auth-choice alibaba-model-studio-api-key`                                    |
| 直接命令列介面旗標 | `--alibaba-model-studio-api-key <key>`                                          |
| 預設模型         | `alibaba/wan2.6-t2v`                                                            |
| 預設基底 URL     | `https://dashscope-intl.aliyuncs.com`                                           |

## 開始使用

<Steps>
  <Step title="設定 API 金鑰">
    透過入門設定，將金鑰儲存到 `alibaba` 提供者：

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

    清單會包含全部五個內建 Wan 模型。如果無法解析 `MODELSTUDIO_API_KEY`，`openclaw models status --json` 會在 `auth.unusableProfiles` 下回報缺少的憑證。

  </Step>
</Steps>

<Note>
  Alibaba 外掛和 [Qwen 外掛](/zh-TW/providers/qwen) 都會對 DashScope 進行驗證，並接受重疊的環境變數。專用的 Wan 影片介面請使用 `alibaba/...` 模型 ID；Qwen 聊天、嵌入或媒體理解請使用 `qwen/...` ID。
</Note>

## 內建 Wan 模型

| 模型參照                   | 模式                      |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v`       | 文字轉影片（預設）        |
| `alibaba/wan2.6-i2v`       | 圖片轉影片                |
| `alibaba/wan2.6-r2v`       | 參考轉影片                |
| `alibaba/wan2.6-r2v-flash` | 參考轉影片（快速）        |
| `alibaba/wan2.7-r2v`       | 參考轉影片                |

## 功能與限制

三種模式共用相同的每次請求影片數量與長度上限；只有輸入形狀不同。

| 模式             | 最大輸出影片數 | 最大輸入圖片數 | 最大輸入影片數 | 最長時間 | 支援的控制項                                              |
| ---------------- | -------------- | -------------- | -------------- | -------- | --------------------------------------------------------- |
| 文字轉影片       | 1              | 不適用         | 不適用         | 10 秒    | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| 圖片轉影片       | 1              | 1              | 不適用         | 10 秒    | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| 參考轉影片       | 1              | 不適用         | 4              | 10 秒    | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

省略 `durationSeconds` 的請求會使用 DashScope 接受的預設值 **5 秒**。若要延長到最多 10 秒，請在[影片生成工具](/zh-TW/tools/video-generation)上明確設定 `durationSeconds`。

<Warning>
  參考圖片與影片輸入必須是遠端 `http(s)` URL；DashScope 的參考模式會拒絕本機檔案路徑。請先上傳到物件儲存，或使用已會產生公開 URL 的[媒體工具](/zh-TW/tools/media-overview)流程。
</Warning>

## 進階設定

<AccordionGroup>
  <Accordion title="覆寫 DashScope 基底 URL">
    提供者預設使用國際 DashScope 端點。若要指定中國區域端點：

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

    提供者會先移除結尾斜線，再建構 AIGC 任務 URL。

  </Accordion>

  <Accordion title="驗證環境變數優先順序">
    OpenClaw 會依下列順序從環境變數解析 Alibaba API 金鑰，採用第一個非空值：

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    已設定的 `auth.profiles` 項目（透過 `openclaw models auth login` 設定）會覆寫環境變數解析。請參閱[模型常見問題中的驗證設定檔](/zh-TW/help/faq-models#auth-profiles-what-they-are-and-how-to-manage-them)，了解設定檔輪替、冷卻與覆寫機制。

  </Accordion>

  <Accordion title="與 Qwen 外掛的關係">
    兩個內建外掛都會與 DashScope 通訊，並接受重疊的 API 金鑰。請使用：

    - `alibaba/wan*.*` ID：用於本頁記錄的專用 Wan 影片提供者。
    - `qwen/*` ID：用於 Qwen 聊天、嵌入與媒體理解（請參閱 [Qwen](/zh-TW/providers/qwen)）。

    設定一次 `MODELSTUDIO_API_KEY` 即可驗證兩個外掛，因為驗證環境變數清單是刻意重疊的；不需要分別對每個外掛執行入門設定。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用的影片工具參數與提供者選擇。
  </Card>
  <Card title="Qwen" href="/zh-TW/providers/qwen" icon="microchip">
    在相同 DashScope 驗證上設定 Qwen 聊天、嵌入與媒體理解。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/config-agents#agent-defaults" icon="gear">
    代理程式預設值與模型設定。
  </Card>
  <Card title="模型常見問題" href="/zh-TW/help/faq-models" icon="circle-question">
    驗證設定檔、切換模型，以及解決「沒有設定檔」錯誤。
  </Card>
</CardGroup>

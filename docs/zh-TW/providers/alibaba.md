---
read_when:
    - 您想在 OpenClaw 中使用 Alibaba Wan 影片生成
    - 你需要設定 Model Studio 或 DashScope API 金鑰才能生成影片
summary: OpenClaw 中的 Alibaba Model Studio Wan 影片生成
title: 阿里巴巴模型工作室
x-i18n:
    generated_at: "2026-04-30T03:29:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: c5abfe9ab595f2a323d6113995bf3075aa92c7f329b934d048e7ece256d94899
    source_path: providers/alibaba.md
    workflow: 16
---

OpenClaw 隨附一個用於 Alibaba Model Studio / DashScope 上 Wan 模型的 `alibaba` 影片生成提供者。

- 提供者：`alibaba`
- 建議的驗證：`MODELSTUDIO_API_KEY`
- 也接受：`DASHSCOPE_API_KEY`、`QWEN_API_KEY`
- API：DashScope / Model Studio 非同步影片生成

## 開始使用

<Steps>
  <Step title="設定 API 金鑰">
    ```bash
    openclaw onboard --auth-choice qwen-standard-api-key
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
  <Step title="確認提供者可用">
    ```bash
    openclaw models list --provider alibaba
    ```
  </Step>
</Steps>

<Note>
任何接受的驗證金鑰（`MODELSTUDIO_API_KEY`、`DASHSCOPE_API_KEY`、`QWEN_API_KEY`）都可以使用。`qwen-standard-api-key` 入門設定選項會設定共用的 DashScope 憑證。
</Note>

## 內建 Wan 模型

隨附的 `alibaba` 提供者目前註冊：

| 模型參照                   | 模式                      |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v`       | 文字轉影片                |
| `alibaba/wan2.6-i2v`       | 圖片轉影片                |
| `alibaba/wan2.6-r2v`       | 參考轉影片                |
| `alibaba/wan2.6-r2v-flash` | 參考轉影片（快速）        |
| `alibaba/wan2.7-r2v`       | 參考轉影片                |

## 目前限制

| 參數                  | 限制                                                      |
| --------------------- | --------------------------------------------------------- |
| 輸出影片              | 每個請求最多 **1** 個                                    |
| 輸入圖片              | 最多 **1** 張                                            |
| 輸入影片              | 最多 **4** 個                                            |
| 時長                  | 最多 **10 秒**                                           |
| 支援的控制項          | `size`、`aspectRatio`、`resolution`、`audio`、`watermark` |
| 參考圖片/影片         | 僅限遠端 `http(s)` URL                                   |

<Warning>
參考圖片/影片模式目前需要**遠端 http(s) URL**。參考輸入不支援本機檔案路徑。
</Warning>

## 進階設定

<AccordionGroup>
  <Accordion title="與 Qwen 的關係">
    隨附的 `qwen` 提供者也使用 Alibaba 託管的 DashScope 端點來進行
    Wan 影片生成。請使用：

    - 當你想使用標準的 Qwen 提供者介面時，使用 `qwen/...`
    - 當你想使用直接由供應商擁有的 Wan 影片介面時，使用 `alibaba/...`

    如需更多詳細資訊，請參閱 [Qwen 提供者文件](/zh-TW/providers/qwen)。

  </Accordion>

  <Accordion title="驗證金鑰優先順序">
    OpenClaw 會依此順序檢查驗證金鑰：

    1. `MODELSTUDIO_API_KEY`（建議）
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    其中任何一個都可以驗證 `alibaba` 提供者。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用影片工具參數與提供者選擇。
  </Card>
  <Card title="Qwen" href="/zh-TW/providers/qwen" icon="microchip">
    Qwen 提供者設定與 DashScope 整合。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/config-agents#agent-defaults" icon="gear">
    Agent 預設值與模型設定。
  </Card>
</CardGroup>

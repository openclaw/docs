---
read_when:
    - 你想要搭配 OpenClaw 使用本機 ComfyUI 工作流程
    - 你想使用 Comfy Cloud 進行影像、影片或音樂工作流程
    - 你需要隨附的 comfy 外掛設定鍵
summary: ComfyUI 工作流程影像、影片與音樂生成在 OpenClaw 中的設定
title: ComfyUI
x-i18n:
    generated_at: "2026-07-05T11:40:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0602dcad22ed36e8cbf5b04f5098f613d48fcd6af55b0e13804cfeb4533d0247
    source_path: providers/comfy.md
    workflow: 16
---

OpenClaw 隨附內建的 `comfy` 外掛，用於由工作流程驅動的 ComfyUI 執行。此
外掛完全由工作流程驅動：OpenClaw 不會將通用的 `size`、
`aspectRatio`、`resolution`、`durationSeconds` 或 TTS 風格控制項對應到
你的圖表。

| 屬性         | 詳細資訊                                                                         |
| ------------ | -------------------------------------------------------------------------------- |
| 提供者       | `comfy`                                                                          |
| 模型         | `comfy/workflow`                                                                 |
| 共用工具     | `image_generate`、`video_generate`、`music_generate`                             |
| 驗證         | 本機 ComfyUI 不需要；Comfy Cloud 使用 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY` |
| API          | ComfyUI `/prompt` / `/history` / `/view`；Comfy Cloud `/api/*`                   |

## 支援內容

- 從工作流程 JSON 產生與編輯影像（編輯會使用 1 張已上傳的參考影像）
- 從工作流程 JSON 產生影片，可由文字轉影片或影像轉影片（1 張參考影像）
- 透過共用的 `music_generate` 工具產生音樂/音訊，可選擇使用 1 張參考影像
- 從已設定的節點下載輸出；若未設定，則從所有符合的輸出節點下載

## 開始使用

選擇在你自己的機器上執行 ComfyUI，或使用 Comfy Cloud。

<Tabs>
  <Tab title="本機">
    **最適合：** 在你的機器或 LAN 上執行自己的 ComfyUI 執行個體。

    <Steps>
      <Step title="在本機啟動 ComfyUI">
        確認你的本機 ComfyUI 執行個體正在執行（預設為 `http://127.0.0.1:8188`）。
      </Step>
      <Step title="準備你的工作流程 JSON">
        匯出或建立 ComfyUI 工作流程 JSON 檔案。記下提示輸入節點與你希望 OpenClaw 讀取的輸出節點的節點 ID。
      </Step>
      <Step title="設定提供者">
        設定 `mode: "local"` 並指向你的工作流程檔案。最小影像範例：

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "local",
                  baseUrl: "http://127.0.0.1:8188",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```
      </Step>
      <Step title="設定預設模型">
        將 OpenClaw 指向你已設定能力的 `comfy/workflow` 模型：

        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="驗證">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **最適合：** 在 Comfy Cloud 上執行工作流程，而不需要管理本機 GPU 資源。

    <Steps>
      <Step title="取得 API 金鑰">
        在 [comfy.org](https://comfy.org) 註冊，並從你的帳戶儀表板產生 API 金鑰。
      </Step>
      <Step title="設定 API 金鑰">
        透過下列任一方法提供你的金鑰：

        ```bash
        # Onboarding flag
        openclaw onboard --comfy-api-key "your-key"

        # Environment variable (preferred for daemons)
        export COMFY_API_KEY="your-key"

        # Alternative environment variable
        export COMFY_CLOUD_API_KEY="your-key"

        # Or inline in config
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="準備你的工作流程 JSON">
        匯出或建立 ComfyUI 工作流程 JSON 檔案。記下提示輸入節點與輸出節點的節點 ID。
      </Step>
      <Step title="設定提供者">
        設定 `mode: "cloud"` 並指向你的工作流程檔案：

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "cloud",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```

        <Tip>
        Cloud 模式會將 `baseUrl` 預設為 `https://cloud.comfy.org`。只有在使用自訂雲端端點時才設定 `baseUrl`。
        </Tip>
      </Step>
      <Step title="設定預設模型">
        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="驗證">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 設定

Comfy 支援共用的頂層連線設定，以及按能力劃分的工作流程區段（`image`、`video`、`music`）：

```json5
{
  plugins: {
    entries: {
      comfy: {
        config: {
          mode: "local",
          baseUrl: "http://127.0.0.1:8188",
          image: {
            workflowPath: "./workflows/flux-api.json",
            promptNodeId: "6",
            outputNodeId: "9",
          },
          video: {
            workflowPath: "./workflows/video-api.json",
            promptNodeId: "12",
            outputNodeId: "21",
          },
          music: {
            workflowPath: "./workflows/music-api.json",
            promptNodeId: "3",
            outputNodeId: "18",
          },
        },
      },
    },
  },
}
```

### 共用鍵

| 鍵                    | 類型                   | 說明                                                                                  |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `mode`                | `"local"` 或 `"cloud"` | 連線模式。預設為 `"local"`。                                                         |
| `baseUrl`             | string                 | 本機預設為 `http://127.0.0.1:8188`，雲端預設為 `https://cloud.comfy.org`。 |
| `apiKey`              | string                 | 選用的內嵌金鑰，可替代 `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY` 環境變數。 |
| `allowPrivateNetwork` | boolean                | 在雲端模式中允許私人/LAN `baseUrl`。                                                  |

### 各能力鍵

這些鍵適用於 `image`、`video` 或 `music` 區段內：

| 鍵                           | 必填     | 預設值   | 說明                                                                         |
| ---------------------------- | -------- | -------- | ---------------------------------------------------------------------------- |
| `workflow` 或 `workflowPath` | 是       | --       | 內嵌工作流程 JSON，或 ComfyUI 工作流程 JSON 檔案的路徑。                    |
| `promptNodeId`               | 是       | --       | 接收文字提示的節點 ID。                                                     |
| `promptInputName`            | 否       | `"text"` | 提示節點上的輸入名稱。                                                       |
| `outputNodeId`               | 否       | --       | 要讀取輸出的節點 ID。若省略，會使用所有符合的輸出節點。                    |
| `pollIntervalMs`             | 否       | `1500`   | 作業完成輪詢間隔，單位為毫秒。                                               |
| `timeoutMs`                  | 否       | `300000` | 工作流程執行逾時，單位為毫秒。                                               |

`image` 和 `video` 區段也支援參考影像輸入節點：

| 鍵                    | 必填                                 | 預設值    | 說明                                                 |
| --------------------- | ------------------------------------ | --------- | ---------------------------------------------------- |
| `inputImageNodeId`    | 是（傳入參考影像時）                 | --        | 接收已上傳參考影像的節點 ID。                       |
| `inputImageInputName` | 否                                   | `"image"` | 影像節點上的輸入名稱。                               |

`apiKey` 接受文字字串或 [secret reference](/zh-TW/gateway/configuration-reference#secrets) 物件。

## 工作流程詳細資訊

<AccordionGroup>
  <Accordion title="影像工作流程">
    將預設影像模型設定為 `comfy/workflow`：

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    **參考影像編輯範例：**

    若要使用已上傳參考影像啟用影像編輯，請將 `inputImageNodeId` 新增到你的影像設定：

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              image: {
                workflowPath: "./workflows/edit-api.json",
                promptNodeId: "6",
                inputImageNodeId: "7",
                inputImageInputName: "image",
                outputNodeId: "9",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="影片工作流程">
    將預設影片模型設定為 `comfy/workflow`：

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    Comfy 影片工作流程透過已設定的圖表支援文字轉影片與影像轉影片。

    <Note>
    OpenClaw 不會將輸入影片傳入 Comfy 工作流程。僅支援文字提示與單張參考影像作為輸入。
    </Note>

  </Accordion>

  <Accordion title="音樂工作流程">
    內建外掛會為由工作流程定義的音訊或音樂輸出註冊音樂產生提供者，並透過共用的 `music_generate` 工具公開。它接受選用的參考影像（最多 1 張）：

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    使用 `music` 設定區段指向你的音訊工作流程 JSON 和輸出節點。

  </Accordion>

  <Accordion title="向後相容性">
    現有的頂層影像設定（沒有巢狀 `image` 區段）仍可運作：

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              workflowPath: "./workflows/flux-api.json",
              promptNodeId: "6",
              outputNodeId: "9",
            },
          },
        },
      },
    }
    ```

    OpenClaw 會將該舊版形狀視為影像工作流程設定。你不需要立即遷移，但建議新設定使用巢狀的 `image` / `video` / `music` 區段。如果你只使用影像產生，舊版扁平設定與新的巢狀 `image` 區段在功能上等同。

  </Accordion>

  <Accordion title="即時測試">
    內建外掛提供選擇性啟用的即時覆蓋率：

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    除非已設定符合的 Comfy 工作流程區段，否則即時測試會略過個別影像、影片或音樂案例。

  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="Image Generation" href="/zh-TW/tools/image-generation" icon="image">
    圖像生成工具的設定與使用方式。
  </Card>
  <Card title="Video Generation" href="/zh-TW/tools/video-generation" icon="video">
    影片生成工具的設定與使用方式。
  </Card>
  <Card title="Music Generation" href="/zh-TW/tools/music-generation" icon="music">
    音樂與音訊生成工具的設定。
  </Card>
  <Card title="Provider Directory" href="/zh-TW/providers/index" icon="layers">
    所有提供者與模型參照的概覽。
  </Card>
  <Card title="Configuration reference" href="/zh-TW/gateway/config-agents#agent-defaults" icon="gear">
    完整設定參考，包含 agent 預設值。
  </Card>
</CardGroup>

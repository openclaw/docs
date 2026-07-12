---
read_when:
    - 你想要搭配 OpenClaw 使用本機 ComfyUI 工作流程
    - 您想使用 Comfy Cloud 執行圖片、影片或音樂工作流程
    - 你需要隨附的 comfy 外掛設定鍵值
summary: OpenClaw 中的 ComfyUI 工作流程圖片、影片與音樂生成設定
title: ComfyUI
x-i18n:
    generated_at: "2026-07-11T21:42:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74150d202a422de8e0f4b2b82d5d12bd42eb46991e8ef688832208e1a2ff7793
    source_path: providers/comfy.md
    workflow: 16
---

OpenClaw 隨附一個內建的 `comfy` 外掛，用於執行由工作流程驅動的 ComfyUI。此
外掛完全由工作流程驅動：OpenClaw 不會將通用的 `size`、
`aspectRatio`、`resolution`、`durationSeconds` 或文字轉語音式控制項對應至
您的圖形。

| 屬性         | 詳細資料                                                                         |
| ------------ | -------------------------------------------------------------------------------- |
| 提供者       | `comfy`                                                                          |
| 模型         | `comfy/workflow`                                                                 |
| 共用工具     | `image_generate`、`video_generate`、`music_generate`                             |
| 驗證         | 本機 ComfyUI 不需要；Comfy Cloud 使用 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY` |
| API          | ComfyUI `/prompt` / `/history` / `/view`；Comfy Cloud `/api/*`                   |

## 支援的功能

- 使用工作流程 JSON 產生及編輯圖片（編輯時接受 1 張上傳的參考圖片）
- 使用工作流程 JSON 進行文字轉影片或圖片轉影片（1 張參考圖片）
- 透過共用的 `music_generate` 工具產生音樂／音訊，可選擇提供 1 張參考圖片
- 從已設定的節點下載輸出；若未設定節點，則從所有相符的輸出節點下載

## 開始使用

選擇在自己的機器上執行 ComfyUI，或使用 Comfy Cloud。

<Tabs>
  <Tab title="Local">
    **最適合：** 在您的機器或區域網路上執行自己的 ComfyUI 執行個體。

    <Steps>
      <Step title="Start ComfyUI locally">
        確認您的本機 ComfyUI 執行個體正在執行（預設為 `http://127.0.0.1:8188`）。
      </Step>
      <Step title="Prepare your workflow JSON">
        匯出或建立 ComfyUI 工作流程 JSON 檔案。記下提示詞輸入節點，以及您希望 OpenClaw 讀取之輸出節點的節點 ID。
      </Step>
      <Step title="Configure the provider">
        設定 `mode: "local"` 並指向您的工作流程檔案。最小圖片範例：

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
      <Step title="Set the default model">
        將 OpenClaw 指向您已設定之功能的 `comfy/workflow` 模型：

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
      <Step title="Verify">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **最適合：** 在 Comfy Cloud 上執行工作流程，而無須管理本機 GPU 資源。

    <Steps>
      <Step title="Get an API key">
        在 [comfy.org](https://comfy.org) 註冊，並從您的帳戶儀表板產生 API 金鑰。
      </Step>
      <Step title="Set the API key">
        使用下列任一方式提供金鑰：

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
      <Step title="Prepare your workflow JSON">
        匯出或建立 ComfyUI 工作流程 JSON 檔案。記下提示詞輸入節點及輸出節點的節點 ID。
      </Step>
      <Step title="Configure the provider">
        設定 `mode: "cloud"` 並指向您的工作流程檔案：

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
        雲端模式的 `baseUrl` 預設為 `https://cloud.comfy.org`。僅在使用自訂雲端端點時設定 `baseUrl`。
        </Tip>
      </Step>
      <Step title="Set the default model">
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
      <Step title="Verify">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 設定

Comfy 支援共用的頂層連線設定，以及各功能的工作流程區段（`image`、`video`、`music`）：

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

| 鍵                    | 類型                     | 說明                                                                                  |
| --------------------- | ------------------------ | ------------------------------------------------------------------------------------- |
| `mode`                | `"local"` 或 `"cloud"`   | 連線模式。預設為 `"local"`。                                                         |
| `baseUrl`             | 字串                     | 本機預設為 `http://127.0.0.1:8188`，雲端預設為 `https://cloud.comfy.org`。            |
| `apiKey`              | 字串                     | 選用的內嵌金鑰，可取代 `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY` 環境變數。             |
| `allowPrivateNetwork` | 布林值                   | 允許在雲端模式中使用私人／區域網路 `baseUrl`，或使用本機私人 DNS FQDN。               |

<Note>
在 `local` 模式中，回送／私人 IP 常值，以及 `http://comfyui:8188` 等單一標籤服務名稱，無須 `allowPrivateNetwork` 即可使用。外觀類似公用網域的私人 DNS FQDN（例如 `https://comfy.local.example.com`）需要設定 `allowPrivateNetwork: true`。私人來源的信任範圍仍僅限於已設定的通訊協定、主機名稱及連接埠；本機重新導向不可離開已設定的主機名稱，而雲端重新導向至公用 CDN 時，則會使用預設的 SSRF 政策進行檢查。
</Note>

### 各功能的鍵

這些鍵適用於 `image`、`video` 或 `music` 區段內：

| 鍵                           | 必要 | 預設值   | 說明                                                                         |
| ---------------------------- | ---- | -------- | ---------------------------------------------------------------------------- |
| `workflow` 或 `workflowPath` | 是   | --       | 內嵌工作流程 JSON，或 ComfyUI 工作流程 JSON 檔案的路徑。                     |
| `promptNodeId`               | 是   | --       | 接收文字提示詞的節點 ID。                                                    |
| `promptInputName`            | 否   | `"text"` | 提示詞節點上的輸入名稱。                                                     |
| `outputNodeId`               | 否   | --       | 要讀取輸出的節點 ID。若省略，則使用所有相符的輸出節點。                     |
| `pollIntervalMs`             | 否   | `1500`   | 等待工作完成時的輪詢間隔，以毫秒為單位。                                     |
| `timeoutMs`                  | 否   | `300000` | 工作流程執行的逾時時間，以毫秒為單位。                                       |

`image` 與 `video` 區段也支援參考圖片輸入節點：

| 鍵                    | 必要                         | 預設值    | 說明                             |
| --------------------- | ---------------------------- | --------- | -------------------------------- |
| `inputImageNodeId`    | 是（傳入參考圖片時）         | --        | 接收已上傳參考圖片的節點 ID。    |
| `inputImageInputName` | 否                           | `"image"` | 圖片節點上的輸入名稱。           |

`apiKey` 接受常值字串或[密鑰參照](/zh-TW/gateway/configuration-reference#secrets)物件。

## 工作流程詳細資料

<AccordionGroup>
  <Accordion title="Image workflows">
    將預設圖片模型設定為 `comfy/workflow`：

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

    **參考圖片編輯範例：**

    若要使用上傳的參考圖片啟用圖片編輯，請將 `inputImageNodeId` 加入圖片設定：

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

  <Accordion title="Video workflows">
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

    Comfy 影片工作流程透過已設定的圖形支援文字轉影片及圖片轉影片。

    <Note>
    OpenClaw 不會將輸入影片傳入 Comfy 工作流程。輸入僅支援文字提示詞和單張參考圖片。
    </Note>

  </Accordion>

  <Accordion title="Music workflows">
    內建外掛會註冊一個音樂產生提供者，用於工作流程定義的音訊或音樂輸出，並透過共用的 `music_generate` 工具呈現。它接受選用的參考圖片（最多 1 張）：

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    使用 `music` 設定區段指向您的音訊工作流程 JSON 及輸出節點。

  </Accordion>

  <Accordion title="Backward compatibility">
    現有的頂層圖片設定（不含巢狀 `image` 區段）仍可運作：

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

    OpenClaw 會將該舊版結構視為圖片工作流程設定。您不需要立即遷移，但新設定建議使用巢狀的 `image` / `video` / `music` 區段。如果您只使用圖片產生功能，舊版扁平設定與新版巢狀 `image` 區段在功能上相同。

  </Accordion>

  <Accordion title="Live tests">
    內建外掛提供可選擇啟用的即時測試涵蓋範圍：

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    除非已設定對應的 Comfy 工作流程區段，否則即時測試會略過個別的圖片、影片或音樂案例。

  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="圖片生成" href="/zh-TW/tools/image-generation" icon="image">
    圖片生成工具的設定與使用方式。
  </Card>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    影片生成工具的設定與使用方式。
  </Card>
  <Card title="音樂生成" href="/zh-TW/tools/music-generation" icon="music">
    音樂與音訊生成工具的設定。
  </Card>
  <Card title="提供者目錄" href="/zh-TW/providers/index" icon="layers">
    所有提供者與模型參照的概覽。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/config-agents#agent-defaults" icon="gear">
    包含代理程式預設值的完整設定參考。
  </Card>
</CardGroup>

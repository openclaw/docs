---
read_when:
    - 你想將 Qwen 與 OpenClaw 搭配使用
    - 你先前使用了 Qwen OAuth
summary: 透過 OpenClaw 外掛使用 Qwen Cloud
title: Qwen
x-i18n:
    generated_at: "2026-06-27T19:57:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e42a38f3e7f2db54092886f2ef8c3ab27163c3c3d0f9b4d95affd58555f58d3
    source_path: providers/qwen.md
    workflow: 16
---

OpenClaw 現在將 Qwen 視為具備一級支援的供應商外掛，並使用標準 ID
`qwen`。此供應商外掛以 Qwen Cloud / Alibaba DashScope 與
Coding Plan 端點為目標，保留舊版 `modelstudio` ID 作為相容性
別名繼續運作，並且也以供應商 `qwen-oauth` 暴露 Qwen Portal 權杖流程。

- 供應商：`qwen`
- Portal 供應商：[`qwen-oauth`](/zh-TW/providers/qwen-oauth)
- 偏好的環境變數：`QWEN_API_KEY`
- 為了相容性也接受：`MODELSTUDIO_API_KEY`、`DASHSCOPE_API_KEY`
- API 風格：與 OpenAI 相容

<Tip>
如果你想使用 `qwen3.6-plus`，請優先選用**標準（按量付費）**端點。
Coding Plan 支援可能會落後於公開目錄。
</Tip>

## 安裝外掛

安裝官方外掛，然後重新啟動閘道：

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## 開始使用

選擇你的方案類型，並依照設定步驟操作。

<Tabs>
  <Tab title="Coding Plan（訂閱）">
    **最適合：** 透過 Qwen Coding Plan 存取的訂閱制使用情境。

    <Steps>
      <Step title="取得你的 API 金鑰">
        從 [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) 建立或複製 API 金鑰。
      </Step>
      <Step title="執行初始設定">
        針對**全球**端點：

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        針對**中國**端點：

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="設定預設模型">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="確認模型可用">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    舊版 `modelstudio-*` auth-choice ID 和 `modelstudio/...` 模型參照仍會
    作為相容性別名運作，但新的設定流程應優先使用標準的
    `qwen-*` auth-choice ID 與 `qwen/...` 模型參照。如果你定義了精確的
    自訂 `models.providers.modelstudio` 項目並使用另一個 `api` 值，該
    自訂供應商會擁有 `modelstudio/...` 參照，而不是使用 Qwen 相容性
    別名。
    </Note>

  </Tab>

  <Tab title="標準（按量付費）">
    **最適合：** 透過標準 Model Studio 端點按量付費存取，包括可能無法在 Coding Plan 使用的 `qwen3.6-plus` 等模型。

    <Steps>
      <Step title="取得你的 API 金鑰">
        從 [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) 建立或複製 API 金鑰。
      </Step>
      <Step title="執行初始設定">
        針對**全球**端點：

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        針對**中國**端點：

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="設定預設模型">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="確認模型可用">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    舊版 `modelstudio-*` auth-choice ID 和 `modelstudio/...` 模型參照仍會
    作為相容性別名運作，但新的設定流程應優先使用標準的
    `qwen-*` auth-choice ID 與 `qwen/...` 模型參照。如果你定義了精確的
    自訂 `models.providers.modelstudio` 項目並使用另一個 `api` 值，該
    自訂供應商會擁有 `modelstudio/...` 參照，而不是使用 Qwen 相容性
    別名。
    </Note>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **最適合：** 用於 `https://portal.qwen.ai/v1` 的 Qwen Portal 權杖。

    請參閱 [Qwen OAuth / Portal](/zh-TW/providers/qwen-oauth)，查看專用供應商
    頁面與遷移注意事項。

    <Steps>
      <Step title="提供你的 Portal 權杖">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="設定預設模型">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen-oauth/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="確認模型可用">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth` 使用與 DashScope 供應商相同的 `QWEN_API_KEY` 環境變數名稱，
    但透過 OpenClaw 初始設定進行設定時，會將驗證儲存在 `qwen-oauth`
    供應商 ID 底下。
    </Note>

  </Tab>
</Tabs>

## 方案類型與端點

| 方案                       | 區域   | 驗證選項                   | 端點                                             |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| 標準（按量付費）           | 中國   | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| 標準（按量付費）           | 全球   | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan（訂閱）        | 中國   | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan（訂閱）        | 全球   | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |
| Qwen Portal                | 全球   | `qwen-oauth`               | `portal.qwen.ai/v1`                              |

供應商會根據你的驗證選項自動選擇端點。標準選項使用 `qwen-*`
系列；`modelstudio-*` 僅作為相容性用途保留。
你可以在設定中使用自訂 `baseUrl` 覆寫。

<Tip>
**管理金鑰：** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**文件：** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## 內建目錄

OpenClaw 目前隨附這份 Qwen 靜態目錄。設定後的目錄會感知端點：
Coding Plan 設定會省略已知僅能在標準端點運作的模型。

| 模型參照                    | 輸入        | 上下文    | 備註                                               |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | 文字、圖片  | 1,000,000 | 預設模型                                           |
| `qwen/qwen3.6-plus`         | 文字、圖片  | 1,000,000 | 需要此模型時，請優先使用標準端點                   |
| `qwen/qwen3-max-2026-01-23` | 文字        | 262,144   | Qwen Max 系列                                      |
| `qwen/qwen3-coder-next`     | 文字        | 262,144   | 編碼                                               |
| `qwen/qwen3-coder-plus`     | 文字        | 1,000,000 | 編碼                                               |
| `qwen/MiniMax-M2.5`         | 文字        | 1,000,000 | 已啟用推理                                         |
| `qwen/glm-5`                | 文字        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | 文字        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | 文字、圖片  | 262,144   | 透過 Alibaba 使用 Moonshot AI                      |
| `qwen-oauth/qwen3.5-plus`   | 文字、圖片  | 1,000,000 | Qwen Portal 預設值                                 |

<Note>
即使模型存在於靜態目錄中，可用性仍可能因端點與計費方案而異。
</Note>

## 思考控制

針對已啟用推理的 Qwen Cloud 模型，供應商會將 OpenClaw
思考等級對應到 DashScope 的頂層 `enable_thinking` 請求旗標。停用
思考時會傳送 `enable_thinking: false`；其他思考等級會傳送
`enable_thinking: true`。

## 多模態附加功能

`qwen` 外掛也會在**標準** DashScope 端點（不是 Coding Plan 端點）
暴露多模態能力：

- 透過 `qwen-vl-max-latest` 進行**影片理解**
- 透過 `wan2.6-t2v`（預設）、`wan2.6-i2v`、`wan2.6-r2v`、`wan2.6-r2v-flash`、`wan2.7-r2v` 進行 **Wan 影片生成**

若要使用 Qwen 作為預設影片供應商：

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
請參閱[影片生成](/zh-TW/tools/video-generation)，了解共用工具參數、供應商選擇與容錯移轉行為。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="圖片與影片理解">
    Qwen 外掛會在**標準** DashScope 端點（不是 Coding Plan 端點）
    註冊圖片與影片的媒體理解能力。

    | 屬性          | 值                    |
    | ------------- | --------------------- |
    | 模型          | `qwen-vl-max-latest`  |
    | 支援的輸入    | 圖片、影片            |

    媒體理解會從已設定的 Qwen 驗證自動解析，不需要額外設定。
    請確保你使用的是標準（按量付費）端點，才能支援媒體理解。

  </Accordion>

  <Accordion title="Qwen 3.6 Plus 可用性">
    `qwen3.6-plus` 可在標準（按量付費）Model Studio
    端點使用：

    - 中國：`dashscope.aliyuncs.com/compatible-mode/v1`
    - 全球：`dashscope-intl.aliyuncs.com/compatible-mode/v1`

    如果 Coding Plan 端點對 `qwen3.6-plus` 回傳「不支援的模型」錯誤，
    請改用標準（按量付費），而不是 Coding Plan 端點/金鑰組合。

    OpenClaw 的 Qwen 靜態目錄不會在 Coding Plan 端點宣告 `qwen3.6-plus`，
    但在 `models.providers.qwen.models` 底下明確設定的
    `qwen/qwen3.6-plus` 項目，會在 Coding Plan baseUrl 上受到採用，
    因此如果 Aliyun 在你的訂閱中啟用該模型，你可以選擇加入它。
    上游 API 仍會決定呼叫是否成功。

  </Accordion>

  <Accordion title="能力規劃">
    `qwen` 外掛正被定位為完整 Qwen Cloud 介面的供應商歸屬處，
    而不只是編碼/文字模型。

    - **文字/聊天模型：** 可透過此外掛使用
    - **工具呼叫、結構化輸出、思考：** 繼承自 OpenAI 相容傳輸
    - **圖片生成：** 規劃在供應商外掛層提供
    - **圖片/影片理解：** 可透過此外掛在標準端點使用
    - **語音/音訊：** 規劃在供應商外掛層提供
    - **記憶嵌入/重排序：** 規劃透過嵌入配接器介面提供
    - **影片生成：** 可透過此外掛經由共用影片生成能力使用

  </Accordion>

  <Accordion title="影片生成詳細資料">
    針對影片生成，OpenClaw 會先將已設定的 Qwen 區域對應到相符的
    DashScope AIGC 主機，再提交工作：

    - 全球/國際：`https://dashscope-intl.aliyuncs.com`
    - 中國：`https://dashscope.aliyuncs.com`

    這表示一般指向 Coding Plan 或標準 Qwen 主機的
    `models.providers.qwen.baseUrl`，仍會讓影片生成使用正確的
    區域 DashScope 影片端點。

    目前的 Qwen 影片生成限制：

    - 每個請求最多 **1** 部輸出影片
    - 最多 **1** 張輸入圖片
    - 最多 **4** 部輸入影片
    - 最長 **10 秒** 時長
    - 支援 `size`、`aspectRatio`、`resolution`、`audio` 與 `watermark`
    - 參考圖片/影片模式目前需要**遠端 http(s) URL**。本機
      檔案路徑會在前置階段被拒絕，因為 DashScope 影片端點不接受為這些參考上傳的本機緩衝區。

  </Accordion>

  <Accordion title="串流用量相容性">
    原生 Model Studio 端點會在共用的 `openai-completions` 傳輸上宣告串流用量相容性。OpenClaw 現在會依據端點能力判定，因此以相同原生主機為目標的 DashScope 相容自訂提供者 ID，會繼承相同的串流用量行為，而不再需要特別使用內建的 `qwen` 提供者 ID。

    原生串流用量相容性同時適用於 Coding Plan 主機與標準 DashScope 相容主機：

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="多模態端點區域">
    多模態介面（影片理解與 Wan 影片生成）使用的是
    **標準** DashScope 端點，而不是 Coding Plan 端點：

    - 全球/國際標準基礎 URL：`https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - 中國標準基礎 URL：`https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="環境與守護行程設定">
    如果閘道以守護行程（launchd/systemd）執行，請確保 `QWEN_API_KEY`
    可供該行程使用（例如放在 `~/.openclaw/.env`，或透過
    `env.shellEnv`）。
  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照與容錯移轉行為。
  </Card>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用的影片工具參數與提供者選擇。
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/zh-TW/providers/alibaba" icon="cloud">
    舊版 ModelStudio 提供者與遷移注意事項。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    一般疑難排解與常見問題。
  </Card>
</CardGroup>

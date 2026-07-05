---
read_when:
    - 你想要搭配 OpenClaw 使用 Qwen
    - 你先前使用過 Qwen OAuth
summary: 透過其 OpenClaw 外掛使用 Qwen Cloud
title: Qwen
x-i18n:
    generated_at: "2026-07-05T11:43:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3678ac0e56ee7cae00cb4a7e17a051734b288ebb4dfab47cb99e5b7ab745c3ce
    source_path: providers/qwen.md
    workflow: 16
---

Qwen Cloud 是官方外部 OpenClaw 供應商外掛，標準 id 為 `qwen`。它以 Qwen Cloud / Alibaba DashScope Standard 和 Coding Plan 端點為目標，會保留舊版 `modelstudio` id 作為相容性別名繼續運作，並將 Qwen Portal 權杖流程作為獨立供應商 [`qwen-oauth`](/zh-TW/providers/qwen-oauth) 公開。

| 屬性                   | 值                                         |
| ---------------------- | ------------------------------------------ |
| 供應商                 | `qwen`                                     |
| Portal 供應商          | [`qwen-oauth`](/zh-TW/providers/qwen-oauth)      |
| 偏好的環境變數         | `QWEN_API_KEY`                             |
| 也接受（相容性）       | `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY` |
| API 風格               | OpenAI-compatible                          |

<Tip>
對於 `qwen3.6-plus`，請使用 **Standard（隨用隨付）** 端點。它不適用於 Coding Plan 端點。
</Tip>

## 安裝外掛

`qwen` 以官方外部外掛形式提供，未與核心綁定。安裝它並重新啟動閘道：

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## 開始使用

選擇你的方案類型並依照設定步驟操作。

<Tabs>
  <Tab title="Coding Plan（訂閱）">
    **最適合：** 透過 Qwen Coding Plan 進行訂閱制存取。

    <Steps>
      <Step title="取得你的 API 金鑰">
        從 [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) 建立或複製 API 金鑰。
      </Step>
      <Step title="執行上線設定">
        對於 **Global** 端點：

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        對於 **China** 端點：

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
    舊版 `modelstudio-*` auth-choice id 和 `modelstudio/...` 模型參照仍會以
    相容性別名運作，但新的設定流程應優先使用標準
    `qwen-*` auth-choice id 和 `qwen/...` 模型參照。如果你定義了精確的
    自訂 `models.providers.modelstudio` 項目並使用另一個 `api` 值，該
    自訂供應商會擁有 `modelstudio/...` 參照，而不是 Qwen 相容性
    別名。
    </Note>

  </Tab>

  <Tab title="Standard（隨用隨付）">
    **最適合：** 透過 Standard Model Studio 端點進行隨用隨付存取，包括 `qwen3.6-plus` 這類不適用於 Coding Plan 的模型。

    <Steps>
      <Step title="取得你的 API 金鑰">
        從 [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) 建立或複製 API 金鑰。
      </Step>
      <Step title="執行上線設定">
        對於 **Global** 端點：

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        對於 **China** 端點：

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
    舊版 `modelstudio-*` auth-choice id 和 `modelstudio/...` 模型參照仍會以
    相容性別名運作，但新的設定流程應優先使用標準
    `qwen-*` auth-choice id 和 `qwen/...` 模型參照。如果你定義了精確的
    自訂 `models.providers.modelstudio` 項目並使用另一個 `api` 值，該
    自訂供應商會擁有 `modelstudio/...` 參照，而不是 Qwen 相容性
    別名。
    </Note>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **最適合：** 用於 `https://portal.qwen.ai/v1` 的 Qwen Portal 權杖。

    請參閱 [Qwen OAuth / Portal](/zh-TW/providers/qwen-oauth)，了解專用供應商
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
    `qwen-oauth` 使用與 Qwen Cloud
    供應商相同的 `QWEN_API_KEY` 環境變數名稱，但透過 OpenClaw 上線設定進行設定時，
    會將驗證資訊儲存在 `qwen-oauth` 供應商 id 底下。
    </Note>

  </Tab>
</Tabs>

## 方案類型與端點

| 方案                       | 區域   | 驗證選項                   | 端點                                             |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Coding Plan（訂閱）        | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan（訂閱）        | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |
| Qwen Portal                | Global | `qwen-oauth`               | `portal.qwen.ai/v1`                              |
| Standard（隨用隨付）       | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard（隨用隨付）       | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |

供應商會根據你的驗證選項自動選擇端點。標準
選項使用 `qwen-*` 系列；`modelstudio-*` 僅保留作相容性用途。
可在設定中使用自訂 `baseUrl` 覆寫。

<Tip>
**管理金鑰：** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**文件：** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## 內建目錄

OpenClaw 隨附此 Qwen 靜態目錄。該目錄會感知端點：Coding
Plan 設定會省略僅能在 Standard 端點運作的模型。

| 模型參照                    | 輸入        | 上下文    | 備註                    |
| --------------------------- | ----------- | --------- | ----------------------- |
| `qwen/qwen3.5-plus`         | 文字、影像  | 1,000,000 | 預設模型                |
| `qwen/qwen3.6-plus`         | 文字、影像  | 1,000,000 | 僅限 Standard 端點      |
| `qwen/qwen3-max-2026-01-23` | 文字        | 262,144   | Qwen Max 系列           |
| `qwen/qwen3-coder-next`     | 文字        | 262,144   | 程式編寫                |
| `qwen/qwen3-coder-plus`     | 文字        | 1,000,000 | 程式編寫                |
| `qwen/MiniMax-M2.5`         | 文字        | 1,000,000 | 已啟用推理              |
| `qwen/glm-5`                | 文字        | 202,752   | GLM                     |
| `qwen/glm-4.7`              | 文字        | 202,752   | GLM                     |
| `qwen/kimi-k2.5`            | 文字、影像  | 262,144   | 透過 Alibaba 使用 Moonshot AI |
| `qwen-oauth/qwen3.5-plus`   | 文字、影像  | 1,000,000 | Qwen Portal 預設        |

<Note>
即使模型存在於靜態目錄中，可用性仍可能因端點與計費方案而異。
</Note>

## 思考控制

`qwen/MiniMax-M2.5` 是內建
目錄中唯一啟用推理的模型。對於 `qwen` 系列上的推理模型，供應商會將
OpenClaw 思考層級對應到 DashScope 頂層 `enable_thinking` 請求
旗標：停用思考會傳送 `enable_thinking: false`，其他任何層級都會傳送
`enable_thinking: true`。自訂模型可以在
模型項目上設定 `compat.thinkingFormat: "qwen-chat-template"`，選擇使用替代的 chat-template
思考酬載。

## 多模態附加功能

`qwen` 外掛僅在 **Standard** DashScope
端點上公開多模態能力，不包含 Coding Plan 端點：

- 透過 `qwen-vl-max-latest` 進行**影像與影片理解**
- 透過 `wan2.6-t2v`（預設）、`wan2.6-i2v`、`wan2.6-r2v`、`wan2.6-r2v-flash`、`wan2.7-r2v` 進行 **Wan 影片生成**

媒體理解會從已設定的 Qwen 驗證資訊自動解析；不需要額外
設定。請確認你使用的是 Standard（隨用隨付）端點，媒體理解才能
運作。

若要將 Qwen 設為預設影片供應商：

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

影片生成限制：每次請求 1 個輸出影片，最多 1 張輸入影像
（影像轉影片）、最多 4 個輸入影片（影片轉影片）、最長 10 秒
時長。支援 `size`、`aspectRatio`、`resolution`、`audio` 和
`watermark`。參考影像/影片輸入需要遠端 http(s) URL；本機
檔案路徑會在前期被拒絕，因為 DashScope 影片端點不接受為這些參考
上傳的本機緩衝區。

<Note>
請參閱 [影片生成](/zh-TW/tools/video-generation)，了解共用工具參數、供應商選擇與容錯移轉行為。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="Qwen 3.6 Plus 可用性">
    `qwen3.6-plus` 可在 Standard（隨用隨付）端點使用：

    - China：`dashscope.aliyuncs.com/compatible-mode/v1`
    - Global：`dashscope-intl.aliyuncs.com/compatible-mode/v1`

    如果 Coding Plan 端點針對
    `qwen3.6-plus` 回傳「不支援的模型」錯誤，請改用 Standard（隨用隨付），而不是 Coding Plan
    端點/金鑰組合。

    OpenClaw 的 Qwen 靜態目錄不會在 Coding
    Plan 端點上宣告 `qwen3.6-plus`，但在
    `models.providers.qwen.models` 底下明確設定的 `qwen/qwen3.6-plus` 項目會在 Coding Plan base URL 上受到採用，因此如果 Aliyun 在你的訂閱中啟用該模型，
    你可以選擇加入該模型。上游 API 仍會決定呼叫是否成功。

  </Accordion>

  <Accordion title="影片生成區域路由">
    OpenClaw 會在提交影片工作前，將已設定的 Qwen 區域對應到相符的 DashScope AIGC 主機：

    - Global/Intl：`https://dashscope-intl.aliyuncs.com`
    - China：`https://dashscope.aliyuncs.com`

    指向 Coding Plan 或 Standard Qwen 主機的普通
    `models.providers.qwen.baseUrl`，仍會將影片生成路由到相符的
    區域 DashScope 影片端點。

  </Accordion>

  <Accordion title="串流用量相容性">
    原生 Qwen 端點會在共用
    `openai-completions` 傳輸上宣告串流用量相容性，因此以相同原生主機為目標的 DashScope 相容自訂供應商 id，無需特別使用
    內建 `qwen` 供應商 id，也會繼承相同行為。這同時適用於 Coding
    Plan 和 Standard 端點：

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="能力規劃">
    `qwen` 外掛正被定位為完整 Qwen
    Cloud 介面的供應商歸屬，而不只是程式編寫/文字模型。

    - **文字／聊天模型：** 可透過外掛使用
    - **工具呼叫、結構化輸出、思考：** 繼承自 OpenAI 相容傳輸
    - **圖片生成：** 規劃在供應商外掛層
    - **圖片／影片理解：** 可透過 Standard 端點上的外掛使用
    - **語音／音訊：** 規劃在供應商外掛層
    - **記憶嵌入／重新排序：** 規劃透過嵌入配接器介面
    - **影片生成：** 可透過外掛經由共用影片生成能力使用

  </Accordion>

  <Accordion title="環境與守護程式設定">
    如果閘道以守護程式（launchd/systemd）執行，請確保 `QWEN_API_KEY`
    可供該程序使用（例如，在 `~/.openclaw/.env` 中，或透過
    `env.shellEnv`）。
  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照與容錯移轉行為。
  </Card>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用影片工具參數與供應商選擇。
  </Card>
  <Card title="Alibaba Model Studio" href="/zh-TW/providers/alibaba" icon="cloud">
    同一 DashScope 平台上的內建 Wan 影片生成供應商。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    一般疑難排解與常見問題。
  </Card>
</CardGroup>

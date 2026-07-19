---
read_when:
    - 你想搭配 OpenClaw 使用 Qwen
    - 你有 Alibaba Cloud Token Plan 訂閱方案
summary: 透過 OpenClaw 外掛使用 Qwen Cloud
title: Qwen
x-i18n:
    generated_at: "2026-07-19T14:01:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 74f94a35631dcdf8c9afc12e86d7a9d6b51a359411ba36f8820f8b1e7c03a27a
    source_path: providers/qwen.md
    workflow: 16
---

Qwen Cloud 是 OpenClaw 官方外部供應商外掛，其正式 id 為 `qwen`。它以 Qwen Cloud / Alibaba DashScope Standard 與 Coding Plan 端點為目標，將 Token Plan 公開為 `qwen-token-plan`，保留 `modelstudio` 作為相容性別名，並獨立擁有 Alibaba 文件所述的 `bailian-token-plan` 自訂供應商 id。

| 屬性                   | 值                                         |
| ---------------------- | ------------------------------------------ |
| 供應商                 | `qwen`                         |
| Token Plan 供應商      | `qwen-token-plan`                         |
| 偏好的環境變數         | `QWEN_API_KEY`                         |
| Token Plan 環境變數    | `QWEN_TOKEN_PLAN_API_KEY`                         |
| 亦接受（相容性）       | `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`     |
| API 風格               | OpenAI 相容                                |

<Tip>
`qwen3.7-plus` 和 `qwen3.6-plus` 可搭配 Coding Plan 與 Standard 端點使用。
若要使用 `qwen3.7-max` 或 `qwen3.6-flash`，請使用 **Standard（按用量付費）**端點。
</Tip>

## 安裝外掛

`qwen` 以官方外部外掛形式提供，未隨核心綁定。請安裝此外掛並重新啟動閘道：

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## 開始使用

選擇方案類型，並依照設定步驟操作。

<Tabs>
  <Tab title="Coding Plan（訂閱制）">
    **最適合：**透過 Qwen Coding Plan 取得訂閱制存取權。

    <Steps>
      <Step title="取得 API 金鑰">
        從 [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) 建立或複製 API 金鑰。
      </Step>
      <Step title="執行初始設定">
        若使用**全球**端點：

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        若使用**中國**端點：

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
    舊版 `modelstudio-*` 驗證選項 id 和 `modelstudio/...` 模型參照仍可
    作為相容性別名運作，但新的設定流程應優先使用正式的
    `qwen-*` 驗證選項 id 和 `qwen/...` 模型參照。如果你定義了完全相符的
    自訂 `models.providers.modelstudio` 項目，且其 `api` 值不同，該
    自訂供應商將擁有 `modelstudio/...` 參照，而非 Qwen 相容性
    別名。
    </Note>

  </Tab>

  <Tab title="Standard（按用量付費）">
    **最適合：**透過 Standard Model Studio 端點取得按用量付費的存取權，包括 Coding Plan 不提供的 `qwen3.7-max` 和 `qwen3.6-flash`。

    <Steps>
      <Step title="取得 API 金鑰">
        從 [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) 建立或複製 API 金鑰。
      </Step>
      <Step title="執行初始設定">
        若使用**全球**端點：

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        若使用**中國**端點：

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
    舊版 `modelstudio-*` 驗證選項 id 和 `modelstudio/...` 模型參照仍可
    作為相容性別名運作，但新的設定流程應優先使用正式的
    `qwen-*` 驗證選項 id 和 `qwen/...` 模型參照。如果你定義了完全相符的
    自訂 `models.providers.modelstudio` 項目，且其 `api` 值不同，該
    自訂供應商將擁有 `modelstudio/...` 參照，而非 Qwen 相容性
    別名。
    </Note>

  </Tab>

  <Tab title="Token Plan（團隊版）">
    **最適合：**透過 Alibaba Cloud Model Studio，以點數制團隊訂閱存取 Qwen 和支援的第三方模型。

    <Steps>
      <Step title="取得專用金鑰">
        指派 Token Plan 席次，並建立其專用的 `sk-sp-...` 金鑰。Token Plan、Coding Plan 與按用量付費金鑰不可互換。請參閱[全球 Token Plan 概覽](https://www.alibabacloud.com/help/en/model-studio/token-plan-overview)或[中國 Token Plan 概覽](https://help.aliyun.com/zh/model-studio/token-plan-overview)。
      </Step>
      <Step title="執行初始設定">
        若使用位於新加坡的**全球／國際**端點：

        ```bash
        openclaw onboard --auth-choice qwen-token-plan
        ```

        若使用位於北京的**中國**端點：

        ```bash
        openclaw onboard --auth-choice qwen-token-plan-cn
        ```
      </Step>
      <Step title="確認供應商">
        ```bash
        openclaw models list --provider qwen-token-plan
        openclaw agent --model qwen-token-plan/qwen3.7-plus --message "回覆：Token Plan 已就緒"
        ```
      </Step>
    </Steps>

    <Note>
    Alibaba 的 OpenClaw 指南使用 `bailian-token-plan` 作為手動自訂
    供應商。該外掛會將此 id 註冊為相容性擁有者，但新的
    設定應使用 `qwen-token-plan`。完全相符的自訂
    `models.providers.bailian-token-plan` 項目會保有其已設定之
    傳輸方式與目錄的擁有權；它絕不會合併至正式的 OpenAI 目錄。
    </Note>

    <Warning>
    Token Plan 僅限用於互動式 OpenClaw 工作階段。請勿將其用於
    排程工作、無人值守指令碼或應用程式後端。Alibaba 表示，
    非互動式使用可能導致訂閱遭停權或其 API 金鑰遭撤銷。
    </Warning>

  </Tab>

</Tabs>

## 方案類型與端點

| 方案                       | 區域 | 驗證選項                   | 端點                                                             |
| -------------------------- | ---- | -------------------------- | ---------------------------------------------------------------- |
| Coding Plan（訂閱制）      | 中國 | `qwen-api-key-cn`         | `coding.dashscope.aliyuncs.com/v1`                                               |
| Coding Plan（訂閱制）      | 全球 | `qwen-api-key`         | `coding-intl.dashscope.aliyuncs.com/v1`                                               |
| Standard（按用量付費）     | 中國 | `qwen-standard-api-key-cn`         | `dashscope.aliyuncs.com/compatible-mode/v1`                                               |
| Standard（按用量付費）     | 全球 | `qwen-standard-api-key`         | `dashscope-intl.aliyuncs.com/compatible-mode/v1`                                               |
| Token Plan（團隊版）       | 中國 | `qwen-token-plan-cn`         | `token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`                                               |
| Token Plan（團隊版）       | 全球 | `qwen-token-plan`         | `token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`                                               |

供應商會根據你的驗證選項自動選取端點。正式
選項使用 `qwen-*` 系列；`modelstudio-*` 僅保留供相容性使用。
可在設定中使用自訂 `baseUrl` 覆寫。

<Tip>
**管理金鑰：**[home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**文件：**[docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## 內建目錄

OpenClaw 隨附此 Qwen 靜態目錄。該目錄可感知端點：Coding
Plan 設定會省略僅能在 Standard 端點上運作的模型。

| 模型參照                    | 輸入         | 上下文    | 備註                    |
| --------------------------- | ------------ | --------- | ----------------------- |
| `qwen/qwen3.5-plus`          | 文字、圖片   | 1,000,000 | 預設模型                |
| `qwen/qwen3.6-flash`          | 文字、圖片   | 1,000,000 | 僅限 Standard 端點      |
| `qwen/qwen3.6-plus`          | 文字、圖片   | 1,000,000 | Coding Plan + Standard  |
| `qwen/qwen3.7-max`          | 文字         | 1,000,000 | 僅限 Standard 端點      |
| `qwen/qwen3.7-plus`          | 文字、圖片   | 1,000,000 | Coding Plan + Standard  |
| `qwen/qwen3-max-2026-01-23`          | 文字         | 262,144   | Qwen Max 系列           |
| `qwen/qwen3-coder-next`          | 文字         | 262,144   | 程式設計                |
| `qwen/qwen3-coder-plus`          | 文字         | 1,000,000 | 程式設計                |
| `qwen/MiniMax-M2.5`          | 文字         | 1,000,000 | 已啟用推理              |
| `qwen/glm-5`          | 文字         | 202,752   | GLM                     |
| `qwen/glm-4.7`          | 文字         | 202,752   | GLM                     |
| `qwen/kimi-k2.5`          | 文字、圖片   | 262,144   | 透過 Alibaba 使用 Moonshot AI |

<Note>
即使模型存在於靜態目錄中，可用性仍可能因端點和計費方案而異。
</Note>

### Token Plan 目錄

Token Plan 使用獨立且須完全相符字串的允許清單。此處不包含僅供圖片生成的方案
模型，因為它們使用不同的 API。

| 模型參照                            | 輸入         | 上下文    |
| ----------------------------------- | ------------ | --------- |
| `qwen-token-plan/qwen3.7-max`                  | 文字         | 1,000,000 |
| `qwen-token-plan/qwen3.7-plus`                  | 文字、圖片   | 1,000,000 |
| `qwen-token-plan/qwen3.6-plus`                  | 文字、圖片   | 1,000,000 |
| `qwen-token-plan/qwen3.6-flash`                  | 文字、圖片   | 1,000,000 |
| `qwen-token-plan/deepseek-v4-pro`                  | 文字         | 1,000,000 |
| `qwen-token-plan/deepseek-v4-flash`                  | 文字         | 1,000,000 |
| `qwen-token-plan/deepseek-v3.2`                  | 文字         | 131,072   |
| `qwen-token-plan/kimi-k2.7-code`                  | 文字、圖片   | 262,144   |
| `qwen-token-plan/kimi-k2.6`                  | 文字、圖片   | 262,144   |
| `qwen-token-plan/kimi-k2.5`                  | 文字、圖片   | 262,144   |
| `qwen-token-plan/glm-5.2`                  | 文字         | 1,000,000 |
| `qwen-token-plan/glm-5.1`                  | 文字         | 202,752   |
| `qwen-token-plan/glm-5`                  | 文字         | 202,752   |
| `qwen-token-plan/MiniMax-M2.5`                  | 文字         | 196,608   |

## 思考控制

`qwen3.7-max`、`qwen3.7-plus`、`qwen3.6-flash` 和 `qwen3.6-plus` 在
內建目錄中已啟用推理。對於 `qwen` 系列的推理模型，
供應商會將 OpenClaw 思考層級對應至 DashScope 頂層的
`enable_thinking` 請求旗標：停用思考時傳送 `enable_thinking: false`，
其他任何層級則傳送 `enable_thinking: true`。自訂模型可透過在
模型項目上設定 `compat.thinkingFormat: "qwen-chat-template"`，選擇使用替代的聊天範本思考承載資料。

Token Plan 模型也會標示為具備推理能力。`kimi-k2.7-code` 和
`MiniMax-M2.5` 僅支援思考，因此即使工作階段要求
`/think off`，OpenClaw 仍會保持啟用思考。DeepSeek V4 會將 `minimal` 至 `high` 對應至
服務的 `high` 推理強度，並將 `xhigh` 或 `max` 對應至 `max`。GLM 5.2 接受
從 `minimal` 至 `max` 的完整範圍；GLM 5.1 和 GLM 5 接受至
`xhigh`，且三者皆預設為 `high`。其他混合模型會遵循
所要求的開啟／關閉狀態。

## 多模態附加功能

`qwen` 外掛僅在 **Standard** DashScope
端點上提供多模態功能，不適用於 Coding Plan 端點：

- **透過 `qwen3.6-plus` 理解圖片與影片**
- **透過 `wan2.6-t2v`（預設）、`wan2.6-i2v`、`wan2.6-r2v`、`wan2.6-r2v-flash`、`wan2.7-r2v` 生成 Wan 影片**

媒體理解功能會根據已設定的 Qwen 驗證自動解析；不需要額外
設定。請確認使用 Standard（按用量付費）端點，媒體理解功能才能
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

影片生成限制：每個請求輸出 1 部影片、最多 1 張輸入圖片
（圖片轉影片）、最多 4 部輸入影片（影片轉影片），最長
10 秒。支援 `size`、`aspectRatio`、`resolution`、`audio` 和
`watermark`。參考圖片／影片輸入必須使用遠端 http(s) URL；本機
檔案路徑會預先遭到拒絕，因為 DashScope 影片端點不接受
為這些參考資料上傳的本機緩衝區。

<Note>
關於共用工具參數、供應商選擇和容錯移轉行為，請參閱[影片生成](/zh-TW/tools/video-generation)。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="Qwen 3.6 和 3.7 可用性">
    `qwen3.7-plus` 和 `qwen3.6-plus` 可用於 Coding Plan 和 Standard 端點。`qwen3.7-max` 和 `qwen3.6-flash` 僅限 Standard。Standard（隨用隨付）端點為：

    - 中國：`dashscope.aliyuncs.com/compatible-mode/v1`
    - 全球：`dashscope-intl.aliyuncs.com/compatible-mode/v1`

    OpenClaw 會從 Coding Plan 目錄中省略 `qwen3.7-max` 和 `qwen3.6-flash`。
    如果 Coding Plan 端點針對其中任一項傳回「不支援的模型」錯誤，
    請改用相符的 Standard 端點和金鑰。

  </Accordion>

  <Accordion title="影片生成區域路由">
    OpenClaw 會先將設定的 Qwen 區域對應至相符的 DashScope AIGC 主機，
    再提交影片工作：

    - 全球／國際：`https://dashscope-intl.aliyuncs.com`
    - 中國：`https://dashscope.aliyuncs.com`

    一般的 `models.providers.qwen.baseUrl` 無論指向 Coding Plan
    或 Standard Qwen 主機，仍會將影片生成路由至相符的
    區域 DashScope 影片端點。

  </Accordion>

  <Accordion title="串流用量相容性">
    原生 Qwen 端點會在共用的 `openai-completions` 傳輸上宣告串流用量相容性，
    因此以相同原生主機為目標、與 DashScope 相容的自訂供應商 ID
    會繼承相同行為，而不需要特別使用內建的
    `qwen` 供應商 ID。這適用於 Coding Plan、
    Standard 和 Token Plan 端點：

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="功能規劃">
    `qwen` 外掛的定位是作為完整 Qwen
    Cloud 功能介面的供應商歸屬處，而不僅是程式設計／文字模型。

    - **文字／聊天模型：**可透過外掛使用
    - **工具呼叫、結構化輸出、思考：**繼承自 OpenAI 相容傳輸
    - **圖片生成：**規劃於供應商外掛層提供
    - **圖片／影片理解：**可透過 Standard 端點上的外掛使用
    - **語音／音訊：**規劃於供應商外掛層提供
    - **記憶嵌入／重新排序：**規劃透過嵌入配接器介面提供
    - **影片生成：**可透過外掛及共用影片生成功能使用

  </Accordion>

  <Accordion title="環境與常駐程式設定">
    如果閘道以常駐程式（launchd/systemd）執行，請確保該程序可存取
    `QWEN_API_KEY` 或 `QWEN_TOKEN_PLAN_API_KEY`（例如放在
    `~/.openclaw/.env` 中，或透過 `env.shellEnv` 提供）。
  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照和容錯移轉行為。
  </Card>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用影片工具參數和供應商選擇。
  </Card>
  <Card title="Alibaba Model Studio" href="/zh-TW/providers/alibaba" icon="cloud">
    同一 DashScope 平台上的內建 Wan 影片生成供應商。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    一般疑難排解和常見問題。
  </Card>
</CardGroup>

---
read_when:
    - 你想在 OpenClaw 中使用 Z.AI／GLM 模型
    - 您需要完成簡單的 ZAI_API_KEY 設定
summary: 透過 OpenClaw 使用 Z.AI（GLM 模型）
title: Z.AI
x-i18n:
    generated_at: "2026-07-11T21:45:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab29149da39cbf82fe041ea5932a860c461320e14bf26f83f69060d7ae0ae00a
    source_path: providers/zai.md
    workflow: 16
---

Z.AI 是 **GLM** 模型的 API 平台。它為 GLM 提供 REST API，
並使用 API 金鑰進行驗證。請在 Z.AI 主控台中建立您的 API 金鑰。
OpenClaw 使用 `zai` 提供者搭配 Z.AI API 金鑰。

| 屬性     | 值                                           |
| -------- | -------------------------------------------- |
| 提供者   | `zai`                                        |
| 套件     | `@openclaw/zai-provider`                     |
| 驗證     | `ZAI_API_KEY`（舊版別名：`Z_AI_API_KEY`）    |
| API      | Z.AI 聊天補全（Bearer 驗證）                 |

## GLM 模型

GLM 是模型系列，而非獨立的提供者。在 OpenClaw 中，GLM 模型使用
`zai/glm-5.2` 之類的參照：提供者為 `zai`，模型 ID 為 `glm-5.2`。

## 開始使用

請先安裝提供者外掛：

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="自動偵測端點">
    **最適合：**大多數使用者。OpenClaw 會使用您的 API 金鑰探測支援的 Z.AI 端點，並自動套用正確的基礎 URL。

    <Steps>
      <Step title="執行初始設定">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="確認模型已列出">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="明確指定區域端點">
    **最適合：**想要強制使用特定 Coding Plan 或一般 API 介面的使用者。

    <Steps>
      <Step title="選擇正確的初始設定選項">
        ```bash
        # Coding Plan 全球端點（建議 Coding Plan 使用者使用）
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan 中國端點（中國地區）
        openclaw onboard --auth-choice zai-coding-cn

        # 一般 API
        openclaw onboard --auth-choice zai-global

        # 一般 API 中國端點（中國地區）
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="確認模型已列出">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

### 端點

| 初始設定選項        | 基礎 URL                                      | 預設模型      |
| ------------------- | --------------------------------------------- | ------------- |
| `zai-global`        | `https://api.z.ai/api/paas/v4`                | `glm-5.1`     |
| `zai-cn`            | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`     |
| `zai-coding-global` | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`     |
| `zai-coding-cn`     | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`     |

`zai-api-key` 會使用您的金鑰逐一探測各端點的聊天補全 API，從這四個端點中
自動偵測可用端點；它會先檢查一般端點（`zai-global`，接著是
`zai-cn`），再檢查 Coding Plan 端點（`zai-coding-global`，接著是
`zai-coding-cn`），並在第一個接受請求的端點停止。如果您的金鑰在兩者
皆可使用，請明確指定 `--auth-choice`，以強制使用 Coding Plan 端點。

## 設定範例

<Tip>
`zai-api-key` 可讓 OpenClaw 從金鑰偵測相符的 Z.AI 端點，並自動套用
正確的基礎 URL。若要強制使用特定 Coding Plan 或一般 API 介面，請使用
明確的區域選項。
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 使用 Coding Plan 端點。
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## 內建目錄

`zai` 提供者外掛會在外掛資訊清單中附帶其目錄，因此唯讀清單可在不載入
提供者執行階段的情況下顯示已知的 GLM 項目：

```bash
openclaw models list --all --provider zai
```

資訊清單支援的目錄目前包含：

| 模型參照             | 備註                            |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | Coding Plan 預設值；100 萬上下文 |
| `zai/glm-5.1`        | 一般 API 預設值                 |
| `zai/glm-5`          |                                 |
| `zai/glm-5-turbo`    |                                 |
| `zai/glm-5v-turbo`   |                                 |
| `zai/glm-4.7`        |                                 |
| `zai/glm-4.7-flash`  |                                 |
| `zai/glm-4.7-flashx` |                                 |
| `zai/glm-4.6`        |                                 |
| `zai/glm-4.6v`       |                                 |
| `zai/glm-4.5`        |                                 |
| `zai/glm-4.5-air`    |                                 |
| `zai/glm-4.5-flash`  |                                 |
| `zai/glm-4.5v`       |                                 |

<Tip>
GLM 模型可透過 `zai/<model>` 使用（例如：`zai/glm-5`）。
</Tip>

<Note>
Coding Plan 設定預設使用 `zai/glm-5.2`；一般 API 設定則維持使用
`zai/glm-5.1`。在 Coding Plan 端點上，若金鑰或方案未提供 GLM-5.2，
自動偵測會依序退回使用 `glm-5.1` 和 `glm-4.7`。GLM 版本與可用性可能
變更；請執行 `openclaw models list --all --provider zai`，查看您所安裝
版本已知的目錄。
</Note>

## 思考層級

<Tabs>
  <Tab title="GLM-5.2">
    完整範圍：`off`、`low`、`high`、`max`（預設為 `off`）。OpenClaw 會透過
    請求承載資料中的 `reasoning_effort`，將 `low` 和 `high` 對應至 Z.AI 的
    `high` 推理強度，並將 `max` 對應至 Z.AI 的 `max` 強度。
  </Tab>
  <Tab title="其他 GLM 模型">
    僅支援二元切換：`off` 和 `low`（在選擇器中顯示為 `on`），預設為
    `off`。將思考設為 `off` 會傳送 `thinking: { type: "disabled" }`；
    其他任何層級皆不會修改請求承載資料（套用 Z.AI 本身的預設推理行為）。
  </Tab>
</Tabs>

將思考設為 `off`，可避免回應在顯示可見文字之前，先將輸出額度耗費於
`reasoning_content`。

## 進階設定

<AccordionGroup>
  <Accordion title="向前解析未知的 GLM-5 模型">
    若未知的 `glm-5*` ID 符合目前 GLM-5 系列的格式，仍會在提供者路徑上
    使用 `glm-4.7` 範本合成由提供者擁有的中繼資料，以進行向前解析。
  </Accordion>

  <Accordion title="工具呼叫串流">
    Z.AI 工具呼叫串流預設會啟用 `tool_stream`。若要停用：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="保留思考內容">
    保留思考內容需選擇啟用，因為 Z.AI 要求重播完整的歷史
    `reasoning_content`，這會增加提示詞權杖數。可針對每個模型啟用：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.2": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    啟用且思考功能開啟時，OpenClaw 會傳送
    `thinking: { type: "enabled", clear_thinking: false }`，並針對同一份
    OpenAI 相容逐字記錄重播先前的 `reasoning_content`。蛇形命名的
    `preserve_thinking` 參數鍵也可作為別名使用。

    進階使用者仍可使用 `params.extra_body.thinking` 覆寫確切的提供者
    承載資料。

  </Accordion>

  <Accordion title="影像理解">
    Z.AI 外掛會註冊影像理解功能。

    | 屬性          | 值          |
    | ------------- | ----------- |
    | 模型          | `glm-4.6v`  |

    影像理解功能會從已設定的 Z.AI 驗證資訊自動解析，無須額外設定。

  </Accordion>

  <Accordion title="驗證詳細資料">
    - Z.AI 使用您的 API 金鑰進行 Bearer 驗證。
    - `zai-api-key` 初始設定選項會使用您的金鑰探測支援的端點，自動偵測相符的 Z.AI 端點。
    - 若要強制使用特定 API 介面，請使用明確的區域選項（`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn`）。
    - 舊版環境變數 `Z_AI_API_KEY` 仍受支援；若未設定 `ZAI_API_KEY`，OpenClaw 會在啟動時將其複製至 `ZAI_API_KEY`。

  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照與容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整的 OpenClaw 設定結構描述，包括提供者與模型設定。
  </Card>
</CardGroup>

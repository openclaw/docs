---
read_when:
    - 你想在 OpenClaw 中使用 Z.AI / GLM 模型
    - 你需要簡單設定 ZAI_API_KEY
summary: 搭配 OpenClaw 使用 Z.AI（GLM 模型）
title: Z.AI
x-i18n:
    generated_at: "2026-07-16T11:55:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7f7adf0e2f436f9081891013c0092ce4717bf302b2a4a2e997d9561d7d40211a
    source_path: providers/zai.md
    workflow: 16
---

Z.AI 是 **GLM** 模型的 API 平台。它為 GLM 提供 REST API，並
使用 API 金鑰進行驗證。請在 Z.AI 主控台中建立你的 API 金鑰。
OpenClaw 使用 `zai` 提供者搭配 Z.AI API 金鑰。

| 屬性 | 值                                        |
| -------- | -------------------------------------------- |
| 提供者 | `zai`                                        |
| 套件  | `@openclaw/zai-provider`                     |
| 驗證     | `ZAI_API_KEY`（舊版別名：`Z_AI_API_KEY`） |
| API      | Z.AI Chat Completions（Bearer 驗證）          |

## GLM 模型

GLM 是一個模型系列，而非獨立的提供者。在 OpenClaw 中，GLM 模型使用
如 `zai/glm-5.2` 的參照：提供者為 `zai`，模型 ID 為 `glm-5.2`。

## 開始使用

先安裝提供者外掛：

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="自動偵測端點">
    **最適合：**大多數使用者。OpenClaw 會使用你的 API 金鑰探測支援的 Z.AI 端點，並自動套用正確的基底 URL。

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
        # Coding Plan 全球版（建議 Coding Plan 使用者使用）
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan 中國版（中國地區）
        openclaw onboard --auth-choice zai-coding-cn

        # 一般 API
        openclaw onboard --auth-choice zai-global

        # 一般 API 中國版（中國地區）
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

| 初始設定選項   | 基底 URL                                      | 預設模型 |
| ------------------- | --------------------------------------------- | ------------- |
| `zai-global`        | `https://api.z.ai/api/paas/v4`                | `glm-5.1`     |
| `zai-cn`            | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`     |
| `zai-coding-global` | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`     |
| `zai-coding-cn`     | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`     |

`zai-api-key` 會以你的金鑰逐一探測這四個端點的
chat-completions API，先檢查一般端點（`zai-global`，
接著是 `zai-cn`），再檢查 Coding Plan 端點（`zai-coding-global`，接著是
`zai-coding-cn`），並在第一個接受要求的端點停止，藉此自動偵測其中一個端點。
如果你的金鑰在兩者皆可使用，請使用明確的 `--auth-choice` 以強制使用 Coding Plan 端點。

## 速率限制與過載

Z.AI 將 Coding Plan 與通用代理工具描述為容量
受管理的服務。根據 Z.AI 自有文件：

- [通用代理工具](https://docs.z.ai/devpack/tool/others)
  （包括 OpenClaw）採盡力而為的方式提供服務。在推論負載高峰期間，
  通常約為新加坡時間下午 2 點至 6 點，部分要求可能會暫時
  遇到速率限制。
- [Coding Plan 速率與並行限制](https://docs.z.ai/devpack/usage-policy)
  與方案等級相關，並可依資源可用性動態調整。
  離峰時段可能會有更高的並行上限。
- [API 錯誤碼 `1302`](https://docs.z.ai/api-reference/api-code) 表示「要求已達
  速率限制」。API 錯誤碼 `1305` 表示「服務可能
  暫時過載，請稍後再試」。

如果你在繁忙時段看到暫時性的 `429` 或 `1305` 回應，請等待後
重試要求。如果失敗在非尖峰時段仍可重現，或只
發生於某個端點、模型或要求格式，請先檢查已設定的端點
與模型：

```bash
openclaw models list --all --provider zai
openclaw config get models.providers.zai.baseUrl
```

Coding Plan 金鑰應使用 Coding Plan 端點，例如
`https://api.z.ai/api/coding/paas/v4`；一般 API 金鑰應使用一般 API
端點，例如 `https://api.z.ai/api/paas/v4`。使用相同
金鑰與端點時持續失敗，可能表示提供者端拒絕要求或方案限制，
而非一般的尖峰負載節流。

## 設定範例

<Tip>
`zai-api-key` 可讓 OpenClaw 根據金鑰偵測相符的 Z.AI 端點，並
自動套用正確的基底 URL。若要強制使用特定 Coding Plan 或一般 API 介面，
請使用明確的區域選項。
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

`zai` 提供者外掛會將其目錄隨附於外掛資訊清單中，因此唯讀
清單可以在不載入提供者執行階段的情況下顯示已知的 GLM 資料列：

```bash
openclaw models list --all --provider zai
```

資訊清單支援的目錄目前包括：

| 模型參照            | 備註                           |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | Coding Plan 預設值；1M 上下文 |
| `zai/glm-5.1`        | 一般 API 預設值             |
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
GLM 模型可透過 `zai/<model>` 取得（範例：`zai/glm-5`）。
</Tip>

<Note>
Coding Plan 設定預設為 `zai/glm-5.2`；一般 API 設定則保留
`zai/glm-5.1`。在 Coding Plan 端點上，當金鑰或方案未提供 GLM-5.2 時，
自動偵測會依序回退至 `glm-5.1` 和 `glm-4.7`。GLM
版本與可用性可能變更；請執行 `openclaw models list --all --provider zai`
以查看已安裝版本所知的目錄。
</Note>

## 思考層級

<Tabs>
  <Tab title="GLM-5.2">
    完整範圍：`off`、`low`、`high`、`max`（預設為 `off`）。OpenClaw 會透過要求承載資料中的 `reasoning_effort`，
    將 `low` 和 `high` 對應至 Z.AI 的 `high` 推理強度，並將 `max` 對應至 Z.AI 的
    `max` 強度。
  </Tab>
  <Tab title="其他 GLM 模型">
    僅提供二元切換：`off` 和 `low`（在選擇器中顯示為 `on`），預設為
    `off`。將思考設為 `off` 會傳送 `thinking: { type: "disabled" }`；
    任何其他層級都不會修改要求承載資料（套用 Z.AI 自有的預設
    推理行為）。
  </Tab>
</Tabs>

將思考設為 `off`，可避免回應先將輸出預算耗費在
`reasoning_content`，而非可見文字上。

## 進階設定

<AccordionGroup>
  <Accordion title="向前解析未知的 GLM-5 模型">
    當 ID 符合目前 GLM-5 系列的格式時，未知的 `glm-5*` ID 仍會在提供者路徑上向前解析，
    方法是從 `glm-4.7` 範本合成提供者擁有的中繼資料。
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
    保留思考內容為選用功能，因為 Z.AI 要求重播完整的歷史
    `reasoning_content`，這會增加提示詞 Token 數量。請依模型啟用：

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

    啟用且開啟思考時，OpenClaw 會傳送
    `thinking: { type: "enabled", clear_thinking: false }`，並為同一份 OpenAI 相容對話記錄重播先前的
    `reasoning_content`。蛇形命名的
    `preserve_thinking` 參數鍵也可作為別名。

    進階使用者仍可使用
    `params.extra_body.thinking` 覆寫確切的提供者承載資料。

  </Accordion>

  <Accordion title="圖片理解">
    Z.AI 外掛會註冊圖片理解功能。

    | 屬性      | 值       |
    | ------------- | ----------- |
    | 模型         | `glm-4.6v`  |

    圖片理解會根據已設定的 Z.AI 驗證自動解析，不需要
    額外設定。

  </Accordion>

  <Accordion title="驗證詳細資料">
    - Z.AI 使用你的 API 金鑰進行 Bearer 驗證。
    - `zai-api-key` 初始設定選項會使用你的金鑰探測支援的端點，以自動偵測相符的 Z.AI 端點。
    - 若要強制使用特定 API 介面，請使用明確的區域選項（`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn`）。
    - 仍接受舊版環境變數 `Z_AI_API_KEY`；若未設定 `ZAI_API_KEY`，OpenClaw 會在啟動時將其複製到 `ZAI_API_KEY`。

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

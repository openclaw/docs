---
read_when:
    - 你想在 OpenClaw 中使用 Z.AI / GLM 模型
    - 你需要一個簡單的 ZAI_API_KEY 設定
summary: 使用 Z.AI（GLM 模型）搭配 OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-07-05T11:44:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab29149da39cbf82fe041ea5932a860c461320e14bf26f83f69060d7ae0ae00a
    source_path: providers/zai.md
    workflow: 16
---

Z.AI 是 **GLM** 模型的 API 平台。它為 GLM 提供 REST API，並使用 API 金鑰進行驗證。請在 Z.AI 主控台建立你的 API 金鑰。
OpenClaw 使用 `zai` 提供者搭配 Z.AI API 金鑰。

| 屬性 | 值                                           |
| -------- | -------------------------------------------- |
| 提供者 | `zai`                                        |
| 套件  | `@openclaw/zai-provider`                     |
| 驗證     | `ZAI_API_KEY`（舊版別名：`Z_AI_API_KEY`） |
| API      | Z.AI 聊天補全（Bearer 驗證）          |

## GLM 模型

GLM 是一個模型家族，而不是獨立的提供者。在 OpenClaw 中，GLM 模型使用
像 `zai/glm-5.2` 這樣的參照：提供者 `zai`，模型 ID `glm-5.2`。

## 開始使用

先安裝提供者外掛：

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Auto-detect endpoint">
    **最適合：** 大多數使用者。OpenClaw 會使用你的 API 金鑰探測支援的 Z.AI 端點，並自動套用正確的基礎 URL。

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Verify the model is listed">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Explicit regional endpoint">
    **最適合：** 想要強制使用特定 Coding Plan 或一般 API 介面的使用者。

    <Steps>
      <Step title="Pick the right onboarding choice">
        ```bash
        # Coding Plan Global (recommended for Coding Plan users)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (China region)
        openclaw onboard --auth-choice zai-coding-cn

        # General API
        openclaw onboard --auth-choice zai-global

        # General API CN (China region)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Verify the model is listed">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

### 端點

| 入門設定選項   | 基礎 URL                                      | 預設模型 |
| ------------------- | --------------------------------------------- | ------------- |
| `zai-global`        | `https://api.z.ai/api/paas/v4`                | `glm-5.1`     |
| `zai-cn`            | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`     |
| `zai-coding-global` | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`     |
| `zai-coding-cn`     | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`     |

`zai-api-key` 會以你的金鑰逐一探測這四個端點的
chat-completions API，藉此自動偵測其中之一；它會先檢查一般端點（`zai-global`，
再檢查 `zai-cn`），接著才檢查 Coding Plan 端點（`zai-coding-global`，再檢查
`zai-coding-cn`），並在第一個接受請求的端點停止。
如果你的金鑰兩者皆可使用，請使用明確的 `--auth-choice` 來強制使用 Coding Plan 端點。

## 設定範例

<Tip>
`zai-api-key` 讓 OpenClaw 從金鑰偵測相符的 Z.AI 端點，並自動套用正確的基礎 URL。
當你想要強制使用特定 Coding Plan 或一般 API 介面時，請使用明確的區域選項。
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 uses the Coding Plan endpoint.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## 內建目錄

`zai` 提供者外掛會在外掛 manifest 中隨附其目錄，因此唯讀
列表不需要載入提供者執行階段，就能顯示已知的 GLM 列：

```bash
openclaw models list --all --provider zai
```

manifest 支援的目錄目前包含：

| 模型參照            | 備註                           |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | Coding Plan 預設；1M 上下文 |
| `zai/glm-5.1`        | 一般 API 預設             |
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
GLM 模型可以用 `zai/<model>` 取得（範例：`zai/glm-5`）。
</Tip>

<Note>
Coding Plan 設定預設為 `zai/glm-5.2`；一般 API 設定則維持
`zai/glm-5.1`。在 Coding Plan 端點上，當金鑰/方案未提供 GLM-5.2 時，
自動偵測會退回 `glm-5.1`，再退回 `glm-4.7`。GLM
版本與可用性可能變更；請執行 `openclaw models list --all --provider zai`
查看你已安裝版本所知的目錄。
</Note>

## 思考層級

<Tabs>
  <Tab title="GLM-5.2">
    完整範圍：`off`、`low`、`high`、`max`（預設為 `off`）。OpenClaw 會透過請求酬載上的
    `reasoning_effort`，將 `low` 與 `high` 對應到 Z.AI 的 `high` 推理強度，並將 `max` 對應到 Z.AI 的
    `max` 強度。
  </Tab>
  <Tab title="Other GLM models">
    僅二元切換：`off` 與 `low`（在選擇器中顯示為 `on`），預設為
    `off`。將思考設為 `off` 會送出 `thinking: { type: "disabled" }`；
    任何其他層級都會保持請求酬載不變（套用 Z.AI 自身的預設
    推理行為）。
  </Tab>
</Tabs>

將思考設為 `off` 可避免回應在可見文字之前，先把輸出預算耗費在
`reasoning_content` 上。

## 進階設定

<AccordionGroup>
  <Accordion title="Forward-resolving unknown GLM-5 models">
    未知的 `glm-5*` ID 仍會在提供者路徑上向前解析，方法是在該 ID
    符合目前 GLM-5 家族形狀時，從 `glm-4.7` 範本合成提供者擁有的中繼資料。
  </Accordion>

  <Accordion title="Tool-call streaming">
    Z.AI 工具呼叫串流預設啟用 `tool_stream`。若要停用它：

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

  <Accordion title="Preserved thinking">
    保留思考是選擇性啟用，因為 Z.AI 要求重新播放完整歷史
    `reasoning_content`，這會增加提示詞 token。可針對每個模型啟用：

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

    啟用後且思考為開啟時，OpenClaw 會送出
    `thinking: { type: "enabled", clear_thinking: false }`，並針對同一份 OpenAI 相容 transcript
    重新播放先前的 `reasoning_content`。snake_case
    `preserve_thinking` 參數鍵可作為別名使用。

    進階使用者仍可使用
    `params.extra_body.thinking` 覆寫精確的提供者酬載。

  </Accordion>

  <Accordion title="Image understanding">
    Z.AI 外掛註冊了圖片理解。

    | 屬性      | 值       |
    | ------------- | ----------- |
    | 模型         | `glm-4.6v`  |

    圖片理解會從已設定的 Z.AI 驗證自動解析，不需要
    額外設定。

  </Accordion>

  <Accordion title="Auth details">
    - Z.AI 使用你的 API 金鑰進行 Bearer 驗證。
    - `zai-api-key` 入門設定選項會使用你的金鑰探測支援的端點，藉此自動偵測相符的 Z.AI 端點。
    - 當你想要強制使用特定 API 介面時，請使用明確的區域選項（`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn`）。
    - 舊版環境變數 `Z_AI_API_KEY` 仍會被接受；如果 `ZAI_API_KEY` 未設定，OpenClaw 會在啟動時將它複製到 `ZAI_API_KEY`。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照與容錯移轉行為。
  </Card>
  <Card title="Configuration reference" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整的 OpenClaw 設定結構描述，包含提供者與模型設定。
  </Card>
</CardGroup>

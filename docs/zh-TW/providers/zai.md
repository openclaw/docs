---
read_when:
    - 你想在 OpenClaw 中使用 Z.AI / GLM 模型
    - 你需要簡單設定 ZAI_API_KEY
summary: 搭配 OpenClaw 使用 Z.AI（GLM 模型）
title: Z.AI
x-i18n:
    generated_at: "2026-06-27T19:58:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a40675d3db518c090828bcc46c3bca348d1bed1027ba6b80228aa27773efd10f
    source_path: providers/zai.md
    workflow: 16
---

Z.AI 是 **GLM** 模型的 API 平台。它為 GLM 提供 REST API，並使用 API 金鑰進行驗證。請在 Z.AI 主控台建立你的 API 金鑰。
OpenClaw 使用 `zai` 供應商搭配 Z.AI API 金鑰。

| 屬性 | 值                                           |
| ---- | -------------------------------------------- |
| 供應商 | `zai`                                        |
| 套件 | `@openclaw/zai-provider`                     |
| 驗證 | `ZAI_API_KEY`（舊版別名：`Z_AI_API_KEY`） |
| API | Z.AI Chat Completions（Bearer 驗證）          |

## GLM 模型

GLM 是一個模型系列，不是獨立的供應商。在 OpenClaw 中，GLM 模型使用
像 `zai/glm-5.2` 這樣的參照：供應商 `zai`，模型 ID `glm-5.2`。

## 開始使用

先安裝供應商外掛：

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Auto-detect endpoint">
    **最適合：** 大多數使用者。OpenClaw 會使用你的 API 金鑰探測支援的 Z.AI 端點，並自動套用正確的基底 URL。

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

## 設定範例

<Tip>
`zai-api-key` 讓 OpenClaw 從金鑰偵測相符的 Z.AI 端點，並自動套用正確的基底 URL。當你想強制使用特定 Coding Plan 或一般 API 介面時，請使用明確的區域選項。
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

`zai` 供應商外掛會在外掛資訊清單中附帶其目錄，因此唯讀
清單可以在不載入供應商執行階段的情況下顯示已知的 GLM 列：

```bash
openclaw models list --all --provider zai
```

由資訊清單支援的目錄目前包含：

| 模型參照             | 備註                            |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | Coding Plan 預設值；1M 上下文 |
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
GLM 模型可透過 `zai/<model>` 使用（範例：`zai/glm-5`）。
</Tip>

<Tip>
GLM-5.2 支援 `off`、`low`、`high` 和 `max` 思考層級。OpenClaw 會將
`low` 和 `high` 對應到 Z.AI 的高推理投入，並將 `max` 對應到最大投入。
</Tip>

<Note>
Coding Plan 設定預設為 `zai/glm-5.2`；一般 API 設定保留
`zai/glm-5.1`。當所選方案未公開 GLM-5.2 時，端點自動偵測會退回到 `glm-5.1` 或 `glm-4.7`。
GLM 版本和可用性可能會變更；執行 `openclaw models list --all --provider zai` 以查看你已安裝版本已知的目錄。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="Forward-resolving unknown GLM-5 models">
    未知的 `glm-5*` ID 仍會在供應商路徑上向前解析：當 ID 符合目前 GLM-5 系列形狀時，會從 `glm-4.7` 範本合成供應商擁有的中繼資料。
  </Accordion>

  <Accordion title="Tool-call streaming">
    Z.AI 工具呼叫串流預設啟用 `tool_stream`。若要停用：

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

  <Accordion title="Thinking and preserved thinking">
    Z.AI 思考會遵循 OpenClaw 的 `/think` 控制。關閉思考時，
    OpenClaw 會傳送 `thinking: { type: "disabled" }`，避免回應在可見文字之前，把輸出預算花在 `reasoning_content` 上。

    保留思考是選擇性啟用，因為 Z.AI 要求重新播放完整歷史
    `reasoning_content`，這會增加提示詞權杖。可針對每個模型啟用：

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

    啟用且思考開啟時，OpenClaw 會傳送
    `thinking: { type: "enabled", clear_thinking: false }`，並針對同一份 OpenAI 相容轉錄重新播放先前的
    `reasoning_content`。

    進階使用者仍可使用 `params.extra_body.thinking` 覆寫確切的供應商承載。

  </Accordion>

  <Accordion title="Image understanding">
    Z.AI 外掛會註冊影像理解。

    | 屬性          | 值          |
    | ------------- | ----------- |
    | 模型          | `glm-4.6v`  |

    影像理解會從已設定的 Z.AI 驗證自動解析，不需要額外設定。

  </Accordion>

  <Accordion title="Auth details">
    - Z.AI 使用你的 API 金鑰進行 Bearer 驗證。
    - `zai-api-key` 入門設定選項會使用你的金鑰探測支援的端點，自動偵測相符的 Z.AI 端點。
    - 當你想強制使用特定 API 介面時，請使用明確的區域選項（`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn`）。
    - 舊版環境變數 `Z_AI_API_KEY` 仍會被接受；如果 `ZAI_API_KEY` 未設定，OpenClaw 會在啟動時將它複製到 `ZAI_API_KEY`。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照和容錯移轉行為。
  </Card>
  <Card title="Configuration reference" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整的 OpenClaw 設定結構描述，包括供應商和模型設定。
  </Card>
</CardGroup>

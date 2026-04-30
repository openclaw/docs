---
read_when:
    - 你想在 OpenClaw 中使用 Z.AI / GLM 模型
    - 你需要簡單設定 ZAI_API_KEY
summary: 搭配 OpenClaw 使用 Z.AI（GLM 模型）
title: Z.AI
x-i18n:
    generated_at: "2026-04-30T03:35:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0192797b9e023065a384b0428830e73877a5088d2c40c2190d5322273294607d
    source_path: providers/zai.md
    workflow: 16
---

Z.AI 是 **GLM** 模型的 API 平台。它為 GLM 提供 REST API，並使用 API 金鑰
進行驗證。請在 Z.AI 主控台建立你的 API 金鑰。OpenClaw 會使用 `zai` 提供者
搭配 Z.AI API 金鑰。

- 提供者：`zai`
- 驗證：`ZAI_API_KEY`
- API：Z.AI Chat Completions（Bearer 驗證）

## 開始使用

<Tabs>
  <Tab title="自動偵測端點">
    **最適合：** 大多數使用者。OpenClaw 會從金鑰偵測相符的 Z.AI 端點，並自動套用正確的基底 URL。

    <Steps>
      <Step title="執行入門設定">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="設定預設模型">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="確認模型可用">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="明確指定區域端點">
    **最適合：** 想強制使用特定 Coding Plan 或一般 API 介面的使用者。

    <Steps>
      <Step title="選擇正確的入門設定選項">
        ```bash
        # Coding Plan Global（建議 Coding Plan 使用者使用）
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN（中國區域）
        openclaw onboard --auth-choice zai-coding-cn

        # 一般 API
        openclaw onboard --auth-choice zai-global

        # 一般 API CN（中國區域）
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="設定預設模型">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="確認模型可用">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 內建目錄

OpenClaw 目前會為內建的 `zai` 提供者預置：

| 模型參照             | 備註       |
| -------------------- | ---------- |
| `zai/glm-5.1`        | 預設模型   |
| `zai/glm-5`          |            |
| `zai/glm-5-turbo`    |            |
| `zai/glm-5v-turbo`   |            |
| `zai/glm-4.7`        |            |
| `zai/glm-4.7-flash`  |            |
| `zai/glm-4.7-flashx` |            |
| `zai/glm-4.6`        |            |
| `zai/glm-4.6v`       |            |
| `zai/glm-4.5`        |            |
| `zai/glm-4.5-air`    |            |
| `zai/glm-4.5-flash`  |            |
| `zai/glm-4.5v`       |            |

<Tip>
GLM 模型可用作 `zai/<model>`（範例：`zai/glm-5`）。預設內建模型參照為 `zai/glm-5.1`。
</Tip>

## 進階設定

<AccordionGroup>
  <Accordion title="向前解析未知的 GLM-5 模型">
    未知的 `glm-5*` ID 仍會在內建提供者路徑上向前解析，方式是在該 ID
    符合目前 GLM-5 系列形狀時，從 `glm-4.7` 範本合成提供者擁有的中繼資料。
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

  <Accordion title="思考與保留思考">
    Z.AI 思考會遵循 OpenClaw 的 `/think` 控制。關閉思考時，
    OpenClaw 會傳送 `thinking: { type: "disabled" }`，避免回應在可見文字前
    將輸出預算花在 `reasoning_content` 上。

    保留思考是選擇加入的功能，因為 Z.AI 要求重播完整歷史
    `reasoning_content`，這會增加提示詞 token。可針對每個模型啟用：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.1": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    啟用且思考開啟時，OpenClaw 會傳送
    `thinking: { type: "enabled", clear_thinking: false }`，並針對同一份 OpenAI 相容轉錄重播先前的
    `reasoning_content`。

    進階使用者仍可使用 `params.extra_body.thinking`
    覆寫確切的提供者承載內容。

  </Accordion>

  <Accordion title="影像理解">
    內建的 Z.AI Plugin 會註冊影像理解。

    | 屬性          | 值          |
    | ------------- | ----------- |
    | 模型          | `glm-4.6v`  |

    影像理解會從設定的 Z.AI 驗證自動解析，不需要
    額外設定。

  </Accordion>

  <Accordion title="驗證詳細資料">
    - Z.AI 使用你的 API 金鑰進行 Bearer 驗證。
    - `zai-api-key` 入門設定選項會從金鑰前綴自動偵測相符的 Z.AI 端點。
    - 當你想強制使用特定 API 介面時，請使用明確的區域選項（`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn`）。

  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="GLM 模型系列" href="/zh-TW/providers/glm" icon="microchip">
    GLM 的模型系列概觀。
  </Card>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照與容錯移轉行為。
  </Card>
</CardGroup>

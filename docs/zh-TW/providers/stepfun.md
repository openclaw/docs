---
read_when:
    - 你想在 OpenClaw 中使用 StepFun 模型
    - 您需要 StepFun 設定指南
summary: 在 OpenClaw 中使用 StepFun 模型
title: StepFun
x-i18n:
    generated_at: "2026-04-30T03:34:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9d43f6e8cda9703a0b9b82d079b282ed5c955676b99b946529582af230d8d10
    source_path: providers/stepfun.md
    workflow: 16
---

OpenClaw 包含一個內建的 StepFun 供應商 Plugin，具備兩個供應商 ID：

- `stepfun` 用於標準端點
- `stepfun-plan` 用於 Step Plan 端點

<Warning>
標準與 Step Plan 是**不同的供應商**，具有不同的端點與模型 ref 前綴（`stepfun/...` 與 `stepfun-plan/...`）。請搭配 `.com` 端點使用中國金鑰，並搭配 `.ai` 端點使用全球金鑰。
</Warning>

## 區域與端點概覽

| 端點      | 中國 (`.com`)                          | 全球 (`.ai`)                         |
| --------- | -------------------------------------- | ------------------------------------- |
| 標準      | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

驗證環境變數：`STEPFUN_API_KEY`

## 內建目錄

標準 (`stepfun`)：

| 模型 ref                 | Context | 最大輸出   | 備註             |
| ------------------------ | ------- | ---------- | ---------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536     | 預設標準模型     |

Step Plan (`stepfun-plan`)：

| 模型 ref                           | Context | 最大輸出   | 備註                     |
| ---------------------------------- | ------- | ---------- | ------------------------ |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536     | 預設 Step Plan 模型      |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536     | 額外的 Step Plan 模型    |

## 開始使用

選擇你的供應商介面，並依照設定步驟操作。

<Tabs>
  <Tab title="標準">
    **最適合：**透過標準 StepFun 端點進行一般用途使用。

    <Steps>
      <Step title="選擇你的端點區域">
        | 驗證選項                         | 端點                             | 區域     |
        | -------------------------------- | -------------------------------- | -------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | 國際     |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | 中國     |
      </Step>
      <Step title="執行 onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        或使用中國端點：

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="非互動式替代方案">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="確認模型可用">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    ### 模型 ref

    - 預設模型：`stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **最適合：**Step Plan 推理端點。

    <Steps>
      <Step title="選擇你的端點區域">
        | 驗證選項                     | 端點                                    | 區域     |
        | ---------------------------- | --------------------------------------- | -------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | 國際     |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | 中國     |
      </Step>
      <Step title="執行 onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        或使用中國端點：

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="非互動式替代方案">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="確認模型可用">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    ### 模型 ref

    - 預設模型：`stepfun-plan/step-3.5-flash`
    - 替代模型：`stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## 進階設定

<AccordionGroup>
  <Accordion title="完整設定：標準供應商">
    ```json5
    {
      env: { STEPFUN_API_KEY: "your-key" },
      agents: { defaults: { model: { primary: "stepfun/step-3.5-flash" } } },
      models: {
        mode: "merge",
        providers: {
          stepfun: {
            baseUrl: "https://api.stepfun.ai/v1",
            api: "openai-completions",
            apiKey: "${STEPFUN_API_KEY}",
            models: [
              {
                id: "step-3.5-flash",
                name: "Step 3.5 Flash",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="完整設定：Step Plan 供應商">
    ```json5
    {
      env: { STEPFUN_API_KEY: "your-key" },
      agents: { defaults: { model: { primary: "stepfun-plan/step-3.5-flash" } } },
      models: {
        mode: "merge",
        providers: {
          "stepfun-plan": {
            baseUrl: "https://api.stepfun.ai/step_plan/v1",
            api: "openai-completions",
            apiKey: "${STEPFUN_API_KEY}",
            models: [
              {
                id: "step-3.5-flash",
                name: "Step 3.5 Flash",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
              {
                id: "step-3.5-flash-2603",
                name: "Step 3.5 Flash 2603",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="備註">
    - 此供應商已內建於 OpenClaw，因此沒有單獨的 Plugin 安裝步驟。
    - `step-3.5-flash-2603` 目前僅在 `stepfun-plan` 上公開。
    - 單一驗證流程會為 `stepfun` 與 `stepfun-plan` 寫入符合區域的設定檔，因此兩個介面可以一起被探索到。
    - 使用 `openclaw models list` 與 `openclaw models set <provider/model>` 來檢查或切換模型。

  </Accordion>
</AccordionGroup>

<Note>
如需更廣泛的供應商概覽，請參閱[模型供應商](/zh-TW/concepts/model-providers)。
</Note>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    所有供應商、模型 ref 與容錯移轉行為的概覽。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    供應商、模型與 Plugin 的完整設定結構描述。
  </Card>
  <Card title="模型選擇" href="/zh-TW/concepts/models" icon="brain">
    如何選擇與設定模型。
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    StepFun API 金鑰管理與文件。
  </Card>
</CardGroup>

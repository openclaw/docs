---
read_when:
    - 你想在 OpenClaw 中使用 StepFun 模型
    - 你需要 StepFun 設定指南
summary: 搭配 OpenClaw 使用 StepFun 模型
title: StepFun
x-i18n:
    generated_at: "2026-07-05T11:39:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 172b7ad5c2cf7cac9a99e391d0454efa4611acedd378d92b2b7ca47511bc0e5e
    source_path: providers/stepfun.md
    workflow: 16
---

StepFun 以外部官方外掛 (`@openclaw/stepfun-provider`) 形式提供，並包含兩個供應商 ID：

- `stepfun` 用於標準端點
- `stepfun-plan` 用於 Step Plan 端點

<Warning>
標準與 Step Plan 是**不同的供應商**，具有不同的端點與模型參照前綴（`stepfun/...` 與 `stepfun-plan/...`）。請將中國金鑰搭配 `.com` 端點使用，將全球金鑰搭配 `.ai` 端點使用。
</Warning>

## 安裝外掛

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## 區域與端點概覽

| 端點      | 中國 (`.com`)                         | 全球 (`.ai`)                        |
| --------- | -------------------------------------- | ------------------------------------- |
| 標準      | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

驗證環境變數：`STEPFUN_API_KEY`

## 內建型錄

標準 (`stepfun`)：

| 模型參照                 | 上下文  | 最大輸出   | 備註             |
| ------------------------ | ------- | ---------- | ---------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536     | 預設標準模型     |

Step Plan (`stepfun-plan`)：

| 模型參照                           | 上下文  | 最大輸出   | 備註                    |
| ---------------------------------- | ------- | ---------- | ----------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536     | 預設 Step Plan 模型     |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536     | 額外的 Step Plan 模型   |

## 開始使用

<Tabs>
  <Tab title="Standard">
    最適合透過標準 StepFun 端點進行通用用途。

    <Steps>
      <Step title="Choose your endpoint region">
        | 驗證選項                         | 端點                          | 區域 |
        | -------------------------------- | ----------------------------- | ---- |
        | `stepfun-standard-api-key-intl` | `https://api.stepfun.ai/v1`  | 國際 |
        | `stepfun-standard-api-key-cn`   | `https://api.stepfun.com/v1` | 中國 |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        中國端點：

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="Non-interactive alternative">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    預設模型：`stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    最適合 Step Plan 推理端點。

    <Steps>
      <Step title="Choose your endpoint region">
        | 驗證選項                      | 端點                                      | 區域 |
        | ------------------------------ | ------------------------------------------ | ---- |
        | `stepfun-plan-api-key-intl` | `https://api.stepfun.ai/step_plan/v1`  | 國際 |
        | `stepfun-plan-api-key-cn`   | `https://api.stepfun.com/step_plan/v1` | 中國 |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        中國端點：

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="Non-interactive alternative">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    預設模型：`stepfun-plan/step-3.5-flash`
    替代模型：`stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

單一驗證流程會為 `stepfun` 與 `stepfun-plan` 寫入符合區域的設定檔，因此一次上線設定後即可同時探索到兩個介面。

## 進階設定

<AccordionGroup>
  <Accordion title="Full config: Standard provider">
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

  <Accordion title="Full config: Step Plan provider">
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

  <Accordion title="Notes">
    - `step-3.5-flash-2603` 目前僅在 `stepfun-plan` 上公開。
    - 使用 `openclaw models list` 與 `openclaw models set <provider/model>` 來檢查或切換模型。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="Model providers" href="/zh-TW/concepts/model-providers" icon="layers">
    所有供應商、模型參照與容錯移轉行為的概覽。
  </Card>
  <Card title="Configuration reference" href="/zh-TW/gateway/configuration-reference" icon="gear">
    供應商、模型與外掛的完整設定結構描述。
  </Card>
  <Card title="Models CLI" href="/zh-TW/concepts/models" icon="brain">
    如何選擇與設定模型。
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    StepFun API 金鑰管理與文件。
  </Card>
</CardGroup>

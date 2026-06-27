---
read_when:
    - 你想在 OpenClaw 中使用 StepFun 模型
    - 你需要 StepFun 設定指南
summary: 搭配 OpenClaw 使用 StepFun 模型
title: StepFun
x-i18n:
    generated_at: "2026-06-27T19:57:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c5d684382ae98a981f6f441f7eb49c01342598952bcf16dc251d0bdfb526ca
    source_path: providers/stepfun.md
    workflow: 16
---

StepFun 提供者外掛支援兩個提供者 ID：

- `stepfun` 用於標準端點
- `stepfun-plan` 用於 Step Plan 端點

<Warning>
標準與 Step Plan 是**不同的提供者**，具備不同端點與模型參照前綴（`stepfun/...` 與 `stepfun-plan/...`）。`.com` 端點請使用中國金鑰，`.ai` 端點請使用全球金鑰。
</Warning>

## 安裝外掛

安裝官方外掛，然後重新啟動閘道：

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## 區域與端點概覽

| 端點      | 中國 (`.com`)                          | 全球 (`.ai`)                         |
| --------- | -------------------------------------- | ------------------------------------ |
| 標準      | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`          |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

驗證環境變數：`STEPFUN_API_KEY`

## 內建目錄

標準（`stepfun`）：

| 模型參照                 | 上下文  | 最大輸出 | 備註           |
| ------------------------ | ------- | -------- | -------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536   | 預設標準模型   |

Step Plan（`stepfun-plan`）：

| 模型參照                           | 上下文  | 最大輸出 | 備註                    |
| ---------------------------------- | ------- | -------- | ----------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536   | 預設 Step Plan 模型     |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536   | 額外的 Step Plan 模型   |

## 開始使用

選擇你的提供者介面，並依照設定步驟操作。

<Tabs>
  <Tab title="標準">
    **最適合：** 透過標準 StepFun 端點進行一般用途使用。

    <Steps>
      <Step title="選擇你的端點區域">
        | 驗證選項                         | 端點                             | 區域 |
        | -------------------------------- | -------------------------------- | ---- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | 國際 |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | 中國 |
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
      <Step title="非互動式替代方式">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="驗證模型可用">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    ### 模型參照

    - 預設模型：`stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **最適合：** Step Plan 推理端點。

    <Steps>
      <Step title="選擇你的端點區域">
        | 驗證選項                     | 端點                                    | 區域 |
        | ---------------------------- | --------------------------------------- | ---- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | 國際 |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | 中國 |
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
      <Step title="非互動式替代方式">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="驗證模型可用">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    ### 模型參照

    - 預設模型：`stepfun-plan/step-3.5-flash`
    - 替代模型：`stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## 進階設定

<AccordionGroup>
  <Accordion title="完整設定：標準提供者">
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

  <Accordion title="完整設定：Step Plan 提供者">
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
    - 此提供者是官方外部套件；請先安裝再進行設定。
    - `step-3.5-flash-2603` 目前只在 `stepfun-plan` 上公開。
    - 單一驗證流程會為 `stepfun` 和 `stepfun-plan` 寫入符合區域的設定檔，因此兩個介面都可以一起被探索。
    - 使用 `openclaw models list` 和 `openclaw models set <provider/model>` 來檢查或切換模型。

  </Accordion>
</AccordionGroup>

<Note>
如需更完整的提供者概覽，請參閱[模型提供者](/zh-TW/concepts/model-providers)。
</Note>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    所有提供者、模型參照與容錯移轉行為的概覽。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    提供者、模型與外掛的完整設定結構描述。
  </Card>
  <Card title="模型選擇" href="/zh-TW/concepts/models" icon="brain">
    如何選擇與設定模型。
  </Card>
  <Card title="StepFun 平台" href="https://platform.stepfun.com" icon="globe">
    StepFun API 金鑰管理與文件。
  </Card>
</CardGroup>

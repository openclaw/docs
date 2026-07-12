---
read_when:
    - 你想在 OpenClaw 中使用 StepFun 模型
    - 你需要 StepFun 設定指南
summary: 搭配 OpenClaw 使用 StepFun 模型
title: StepFun
x-i18n:
    generated_at: "2026-07-12T14:49:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c65e6d395f4ea890efc0e4847ec21dc1c2796fa240d20ca3e6d40eea480ed9f4
    source_path: providers/stepfun.md
    workflow: 16
---

StepFun 以外部官方外掛（`@openclaw/stepfun-provider`）形式提供，包含兩個供應商 ID：

- `stepfun` 用於標準端點
- `stepfun-plan` 用於 Step Plan 端點

<Warning>
標準端點與 Step Plan 是具有不同端點及模型參照前綴（`stepfun/...` 與 `stepfun-plan/...`）的**獨立供應商**。`.com` 端點請使用中國金鑰，`.ai` 端點則使用全球金鑰。
</Warning>

## 安裝外掛

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## 區域與端點概覽

| 端點      | 中國（`.com`）                          | 全球（`.ai`）                         |
| --------- | -------------------------------------- | ------------------------------------- |
| 標準      | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

驗證環境變數：`STEPFUN_API_KEY`

## 內建目錄

標準（`stepfun`）：

| 模型參照                 | 上下文  | 最大輸出   | 備註                         |
| ------------------------ | ------- | ---------- | ------------------------------ |
| `stepfun/step-3.5-flash` | 262,144 | 65,536     | 預設標準模型                 |
| `stepfun/step-3.7-flash` | 262,144 | 262,144    | 支援多模態影像輸入           |

Step Plan（`stepfun-plan`）：

| 模型參照                           | 上下文  | 最大輸出   | 備註                         |
| ---------------------------------- | ------- | ---------- | ------------------------------ |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536     | 預設 Step Plan 模型          |
| `stepfun-plan/step-3.7-flash`      | 262,144 | 262,144    | 支援多模態影像輸入           |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536     | 額外的 Step Plan 模型        |

## 開始使用

<Tabs>
  <Tab title="標準">
    最適合透過標準 StepFun 端點進行一般用途。

    <Steps>
      <Step title="選擇端點區域">
        | 驗證選項                         | 端點                          | 區域 |
        | -------------------------------- | ----------------------------- | -------------- |
        | `stepfun-standard-api-key-intl` | `https://api.stepfun.ai/v1`  | 國際 |
        | `stepfun-standard-api-key-cn`   | `https://api.stepfun.com/v1` | 中國 |
      </Step>
      <Step title="執行初始設定">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        中國端點：

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
      <Step title="確認模型可用">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    預設模型：`stepfun/step-3.5-flash`
    替代模型：`stepfun/step-3.7-flash`

  </Tab>

  <Tab title="Step Plan">
    最適合 Step Plan 推理端點。

    <Steps>
      <Step title="選擇端點區域">
        | 驗證選項                      | 端點                                     | 區域 |
        | ------------------------------ | ------------------------------------------ | -------------- |
        | `stepfun-plan-api-key-intl` | `https://api.stepfun.ai/step_plan/v1`  | 國際 |
        | `stepfun-plan-api-key-cn`   | `https://api.stepfun.com/step_plan/v1` | 中國 |
      </Step>
      <Step title="執行初始設定">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        中國端點：

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
      <Step title="確認模型可用">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    預設模型：`stepfun-plan/step-3.5-flash`
    替代模型：`stepfun-plan/step-3.7-flash`、`stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

單次驗證流程會為 `stepfun` 與 `stepfun-plan` 寫入區域相符的設定檔，因此執行一次初始設定後，就會同時探索到兩者。

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
                id: "step-3.7-flash",
                name: "Step 3.7 Flash",
                reasoning: true,
                input: ["text", "image"],
                thinkingLevelMap: { off: "low", minimal: "low", xhigh: "high", max: "high" },
                cost: { input: 0.2, output: 1.15, cacheRead: 0.04, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
                compat: {
                  supportsStore: false,
                  supportsDeveloperRole: false,
                  supportsUsageInStreaming: false,
                  supportsReasoningEffort: true,
                  supportsStrictMode: false,
                  supportedReasoningEfforts: ["low", "medium", "high"],
                  maxTokensField: "max_tokens",
                  reasoningEffortMap: {
                    off: "low",
                    none: "low",
                    minimal: "low",
                    low: "low",
                    medium: "medium",
                    high: "high",
                    xhigh: "high",
                    adaptive: "high",
                    max: "high",
                  },
                },
              },
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
                id: "step-3.7-flash",
                name: "Step 3.7 Flash",
                reasoning: true,
                input: ["text", "image"],
                thinkingLevelMap: { off: "low", minimal: "low", xhigh: "high", max: "high" },
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
                compat: {
                  supportsStore: false,
                  supportsDeveloperRole: false,
                  supportsUsageInStreaming: false,
                  supportsReasoningEffort: true,
                  supportsStrictMode: false,
                  supportedReasoningEfforts: ["low", "medium", "high"],
                  maxTokensField: "max_tokens",
                  reasoningEffortMap: {
                    off: "low",
                    none: "low",
                    minimal: "low",
                    low: "low",
                    medium: "medium",
                    high: "high",
                    xhigh: "high",
                    adaptive: "high",
                    max: "high",
                  },
                },
              },
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
    - `step-3.7-flash` 可透過 OpenClaw 接受文字與影像輸入。StepFun 的 API 也支援影片，但 OpenClaw 尚未將影片列為模型輸入模態。
    - Step 3.7 支援 `low`、`medium` 與 `high` 推理強度。由於模型沒有非推理模式，`/think off` 會對應至 `low`。
    - `step-3.5-flash-2603` 目前僅透過 `stepfun-plan` 提供。
    - 使用 `openclaw models list` 與 `openclaw models set <provider/model>` 檢查或切換模型。

  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型供應商" href="/zh-TW/concepts/model-providers" icon="layers">
    所有供應商、模型參照與容錯移轉行為的概覽。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    供應商、模型與外掛的完整設定結構描述。
  </Card>
  <Card title="模型命令列介面" href="/zh-TW/concepts/models" icon="brain">
    如何選擇及設定模型。
  </Card>
  <Card title="StepFun 平台" href="https://platform.stepfun.com" icon="globe">
    StepFun API 金鑰管理與文件。
  </Card>
</CardGroup>

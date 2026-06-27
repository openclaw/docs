---
read_when:
    - 你想要將 Arcee AI 與 OpenClaw 搭配使用
    - 你需要 API 金鑰環境變數或命令列介面驗證選項
summary: Arcee AI 設定（驗證 + 模型選擇）
title: Arcee AI
x-i18n:
    generated_at: "2026-06-27T19:52:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15570c1d018104377a473fe5f9b556d9a6ffd2dea6db5d55d46ca3702e237101
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) 透過 OpenAI 相容 API 提供 Trinity 系列混合專家模型的存取。所有 Trinity 模型皆採 Apache 2.0 授權。

Arcee AI 模型可透過 Arcee 平台直接存取，或透過 [OpenRouter](/zh-TW/providers/openrouter) 存取。

| 屬性 | 值                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| 提供者 | `arcee`                                                                               |
| 驗證     | `ARCEEAI_API_KEY`（直接）或 `OPENROUTER_API_KEY`（透過 OpenRouter）                   |
| API      | OpenAI 相容                                                                     |
| 基底 URL | `https://api.arcee.ai/api/v1`（直接）或 `https://openrouter.ai/api/v1`（OpenRouter） |

## 安裝外掛

安裝官方外掛，然後重新啟動閘道：

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

## 開始使用

<Tabs>
  <Tab title="Direct (Arcee platform)">
    <Steps>
      <Step title="Get an API key">
        在 [Arcee AI](https://chat.arcee.ai/) 建立 API 金鑰。
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Via OpenRouter">
    <Steps>
      <Step title="Get an API key">
        在 [OpenRouter](https://openrouter.ai/keys) 建立 API 金鑰。
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        相同的模型參照可用於直接與 OpenRouter 設定（例如 `arcee/trinity-large-thinking`）。
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 非互動式設定

<Tabs>
  <Tab title="Direct (Arcee platform)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="Via OpenRouter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## 內建目錄

OpenClaw 目前隨附此 Arcee 靜態目錄：

| 模型參照                      | 名稱                   | 輸入 | 上下文 | 成本（每 100 萬輸入/輸出） | 備註                                     |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text  | 256K    | $0.25 / $0.90        | 預設模型；已啟用推理          |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text  | 128K    | $0.25 / $1.00        | 通用；400B 參數，13B 啟用  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text  | 128K    | $0.045 / $0.15       | 快速且具成本效益；函式呼叫 |

<Tip>
入門預設會將 `arcee/trinity-large-thinking` 設為預設模型。
</Tip>

## 支援的功能

| 功能                                       | 支援                                    |
| --------------------------------------------- | -------------------------------------------- |
| 串流                                     | 是                                          |
| 工具使用 / 函式呼叫                   | 是（Trinity Mini、Trinity Large Preview）    |
| 結構化輸出（JSON 模式和 JSON schema） | 是                                          |
| 延伸思考                             | 是（Trinity Large Thinking；工具已停用） |

<AccordionGroup>
  <Accordion title="Environment note">
    如果閘道以 daemon（launchd/systemd）執行，請確認該程序可使用 `ARCEEAI_API_KEY`
    （或 `OPENROUTER_API_KEY`）（例如，在
    `~/.openclaw/.env` 中或透過 `env.shellEnv`）。
  </Accordion>

  <Accordion title="OpenRouter routing">
    透過 OpenRouter 使用 Arcee 模型時，適用相同的 `arcee/*` 模型參照。
    OpenClaw 會根據你的驗證選擇透明地處理路由。請參閱
    [OpenRouter 提供者文件](/zh-TW/providers/openrouter) 以了解 OpenRouter 專屬的
    設定詳細資訊。
  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/zh-TW/providers/openrouter" icon="shuffle">
    透過單一 API 金鑰存取 Arcee 模型和許多其他模型。
  </Card>
  <Card title="Model selection" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照和容錯移轉行為。
  </Card>
</CardGroup>

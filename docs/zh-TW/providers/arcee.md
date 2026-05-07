---
read_when:
    - 您想要將 Arcee AI 與 OpenClaw 搭配使用
    - 你需要 API 金鑰環境變數或 CLI 驗證選項
summary: Arcee AI 設定（身分驗證 + 模型選擇）
title: Arcee AI
x-i18n:
    generated_at: "2026-05-07T15:08:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c3775ac2783da0833988c68621bd81c73a3b3e8240c26b4c1b590c1e9df2a8f
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) 透過與 OpenAI 相容的 API，提供 Trinity 系列 mixture-of-experts 模型的存取。所有 Trinity 模型皆採 Apache 2.0 授權。

Arcee AI 模型可透過 Arcee 平台直接存取，或透過 [OpenRouter](/zh-TW/providers/openrouter) 存取。

| 屬性 | 值                                                                                    |
| -------- | ------------------------------------------------------------------------------------- |
| Provider | `arcee`                                                                               |
| Auth     | `ARCEEAI_API_KEY`（直接）或 `OPENROUTER_API_KEY`（透過 OpenRouter）                   |
| API      | 與 OpenAI 相容                                                                        |
| Base URL | `https://api.arcee.ai/api/v1`（直接）或 `https://openrouter.ai/api/v1`（OpenRouter） |

## 開始使用

<Tabs>
  <Tab title="直接（Arcee 平台）">
    <Steps>
      <Step title="取得 API 金鑰">
        在 [Arcee AI](https://chat.arcee.ai/) 建立 API 金鑰。
      </Step>
      <Step title="執行 onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="設定預設模型">
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

  <Tab title="透過 OpenRouter">
    <Steps>
      <Step title="取得 API 金鑰">
        在 [OpenRouter](https://openrouter.ai/keys) 建立 API 金鑰。
      </Step>
      <Step title="執行 onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="設定預設模型">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        相同的模型 ref 適用於直接與 OpenRouter 設定（例如 `arcee/trinity-large-thinking`）。
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 非互動式設定

<Tabs>
  <Tab title="直接（Arcee 平台）">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="透過 OpenRouter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## 內建目錄

OpenClaw 目前隨附此 Arcee 目錄：

| 模型 ref                       | 名稱                   | 輸入 | 上下文 | 成本（每 100 萬輸入/輸出） | 備註                                      |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text  | 256K    | $0.25 / $0.90        | 預設模型；已啟用推理                      |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text  | 128K    | $0.25 / $1.00        | 通用；400B 參數，13B active               |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text  | 128K    | $0.045 / $0.15       | 快速且符合成本效益；函式呼叫              |

<Tip>
onboarding 預設集會將 `arcee/trinity-large-thinking` 設為預設模型。
</Tip>

## 支援的功能

| 功能                                          | 支援                                         |
| --------------------------------------------- | -------------------------------------------- |
| 串流                                          | 是                                           |
| 工具使用 / 函式呼叫                          | 是（Trinity Mini、Trinity Large Preview）    |
| 結構化輸出（JSON 模式與 JSON schema）        | 是                                           |
| 擴展思考                                      | 是（Trinity Large Thinking；工具已停用）     |

<AccordionGroup>
  <Accordion title="環境注意事項">
    如果 Gateway 以 daemon（launchd/systemd）形式執行，請確認 `ARCEEAI_API_KEY`
    （或 `OPENROUTER_API_KEY`）可供該程序使用（例如，在
    `~/.openclaw/.env` 中，或透過 `env.shellEnv`）。
  </Accordion>

  <Accordion title="OpenRouter 路由">
    透過 OpenRouter 使用 Arcee 模型時，適用相同的 `arcee/*` 模型 ref。
    OpenClaw 會根據你的驗證選擇透明處理路由。請參閱
    [OpenRouter provider 文件](/zh-TW/providers/openrouter)，了解 OpenRouter 專屬
    設定詳細資訊。
  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/zh-TW/providers/openrouter" icon="shuffle">
    使用單一 API 金鑰存取 Arcee 模型與許多其他模型。
  </Card>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇 providers、模型 refs 與容錯移轉行為。
  </Card>
</CardGroup>

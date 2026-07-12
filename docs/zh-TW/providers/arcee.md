---
read_when:
    - 你想要搭配 OpenClaw 使用 Arcee AI
    - 你需要 API 金鑰環境變數或命令列介面驗證選項
summary: Arcee AI 設定（驗證 + 模型選擇）
title: Arcee AI
x-i18n:
    generated_at: "2026-07-11T21:43:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe519393db3cf39f1b14b8121603b6f667102ac8c122fb6560d9b73a6ee6b0a3
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) 透過相容 OpenAI 的 API 提供 Trinity 混合專家模型系列。所有 Trinity 模型皆採用 Apache 2.0 授權。Arcee 是 OpenClaw 的官方外掛，未隨核心一併提供，因此在進行初始設定前需要先安裝。

您可以透過 Arcee 平台直接存取 Arcee 模型，或透過 [OpenRouter](/zh-TW/providers/openrouter) 存取。

| 屬性     | 值                                                                                    |
| -------- | ------------------------------------------------------------------------------------- |
| 提供者   | `arcee`                                                                               |
| 驗證     | `ARCEEAI_API_KEY`（直接）或 `OPENROUTER_API_KEY`（透過 OpenRouter）                   |
| API      | 相容 OpenAI                                                                           |
| 基礎 URL | `https://api.arcee.ai/api/v1`（直接）或 `https://openrouter.ai/api/v1`（OpenRouter） |

## 安裝外掛

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

## 開始使用

<Tabs>
  <Tab title="直接使用（Arcee 平台）">
    <Steps>
      <Step title="取得 API 金鑰">
        在 [Arcee AI](https://chat.arcee.ai/) 建立 API 金鑰。
      </Step>
      <Step title="執行初始設定">
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
      <Step title="執行初始設定">
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

        直接使用與透過 OpenRouter 設定時，皆使用相同的模型參照。
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 非互動式設定

<Tabs>
  <Tab title="直接使用（Arcee 平台）">
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

| 模型參照                       | 名稱                   | 輸入 | 上下文 | 最大輸出 | 成本（每百萬輸入／輸出） | 工具 | 備註                                       |
| ------------------------------ | ---------------------- | ---- | ------ | -------- | ------------------------ | ---- | ------------------------------------------ |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | 文字 | 256K   | 80K      | $0.25 / $0.90            | 否   | 預設模型；延伸思考                         |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | 文字 | 128K   | 16K      | $0.25 / $1.00            | 是   | 通用；4,000 億個參數，130 億個啟用參數    |
| `arcee/trinity-mini`           | Trinity Mini 26B       | 文字 | 128K   | 80K      | $0.045 / $0.15           | 是   | 快速且具成本效益；函式呼叫                 |

<Tip>
初始設定的預設組態會將 `arcee/trinity-large-thinking` 設為預設模型。
</Tip>

## 支援的功能

| 功能                                | 支援情況                                     |
| ----------------------------------- | -------------------------------------------- |
| 串流                                | 是                                           |
| 工具使用／函式呼叫                  | 是（Trinity Mini、Trinity Large Preview）    |
| 結構化輸出（JSON 模式與 JSON 結構描述） | 是                                       |
| 延伸思考                            | 是（Trinity Large Thinking；工具已停用）     |

<AccordionGroup>
  <Accordion title="環境注意事項">
    如果閘道以常駐程式（launchd/systemd）方式執行，請確保該程序可以使用 `ARCEEAI_API_KEY`
    （或 `OPENROUTER_API_KEY`），例如將其設定於
    `~/.openclaw/.env` 或透過 `env.shellEnv` 設定。
  </Accordion>

  <Accordion title="OpenRouter 路由">
    透過 OpenRouter 使用 Arcee 模型時，仍使用相同的 `arcee/*` 模型參照。
    OpenClaw 會根據您的驗證選項透明地進行路由。如需 OpenRouter 專屬的
    設定詳細資訊，請參閱
    [OpenRouter 提供者文件](/zh-TW/providers/openrouter)。
  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/zh-TW/providers/openrouter" icon="shuffle">
    使用單一 API 金鑰存取 Arcee 模型及眾多其他模型。
  </Card>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照與容錯移轉行為。
  </Card>
</CardGroup>

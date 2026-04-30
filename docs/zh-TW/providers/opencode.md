---
read_when:
    - 你想要 OpenCode 託管的模型存取權
    - 你想要在 Zen 與 Go 目錄之間做選擇
summary: 搭配 OpenClaw 使用 OpenCode Zen 和 Go 目錄
title: OpenCode
x-i18n:
    generated_at: "2026-04-30T03:33:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: cb0521b038e519f139c66f98ddef4919d8c43ce64018ef8af8f7b42ac00114a4
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode 在 OpenClaw 中公開兩個託管目錄：

| 目錄 | 前綴            | 執行階段提供者 |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

兩個目錄都使用相同的 OpenCode API 金鑰。OpenClaw 將執行階段提供者 ID
分開保留，讓上游的逐模型路由維持正確，但入門設定和文件會將它們視為
同一個 OpenCode 設定。

## 開始使用

<Tabs>
  <Tab title="Zen catalog">
    **最適合：** 精選的 OpenCode 多模型代理（Claude、GPT、Gemini）。

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        或直接傳入金鑰：

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Set a Zen model as the default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Go catalog">
    **最適合：** OpenCode 託管的 Kimi、GLM 和 MiniMax 系列。

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        或直接傳入金鑰：

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Set a Go model as the default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 設定範例

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## 內建目錄

### Zen

| 屬性         | 值                                                                   |
| ---------------- | ----------------------------------------------------------------------- |
| 執行階段提供者 | `opencode`                                                              |
| 範例模型   | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro` |

### Go

| 屬性         | 值                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| 執行階段提供者 | `opencode-go`                                                            |
| 範例模型   | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## 進階設定

<AccordionGroup>
  <Accordion title="API key aliases">
    `OPENCODE_ZEN_API_KEY` 也支援作為 `OPENCODE_API_KEY` 的別名。
  </Accordion>

  <Accordion title="Shared credentials">
    在設定期間輸入一組 OpenCode 金鑰，會同時儲存兩個執行階段
    提供者的憑證。你不需要分別為每個目錄執行入門設定。
  </Accordion>

  <Accordion title="Billing and dashboard">
    你會登入 OpenCode、新增帳務詳細資料，並複製你的 API 金鑰。帳務
    與目錄可用性由 OpenCode 儀表板管理。
  </Accordion>

  <Accordion title="Gemini replay behavior">
    Gemini 支援的 OpenCode 參照會留在 proxy-Gemini 路徑上，因此 OpenClaw 會在
    那裡保留 Gemini 思考簽章清理，而不啟用原生 Gemini
    重播驗證或啟動重寫。
  </Accordion>

  <Accordion title="Non-Gemini replay behavior">
    非 Gemini 的 OpenCode 參照會保留最小的 OpenAI 相容重播政策。
  </Accordion>
</AccordionGroup>

<Tip>
在設定期間輸入一組 OpenCode 金鑰，會同時儲存 Zen 和
Go 執行階段提供者的憑證，因此你只需要執行一次入門設定。
</Tip>

## 相關

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照和容錯移轉行為。
  </Card>
  <Card title="Configuration reference" href="/zh-TW/gateway/configuration-reference" icon="gear">
    代理程式、模型和提供者的完整設定參考。
  </Card>
</CardGroup>

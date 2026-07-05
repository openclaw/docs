---
read_when:
    - 你想要 OpenCode 託管的模型存取權
    - 你想在 Zen 與 Go 目錄之間選擇
summary: 搭配 OpenClaw 使用 OpenCode Zen 和 Go 型錄
title: OpenCode
x-i18n:
    generated_at: "2026-07-05T11:42:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de287eb8a349f26c265f95b8b1de3af4035aa2bdc3501c7279f714d297bb8b9b
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode 在 OpenClaw 中公開兩個託管目錄：

| 目錄 | 前綴              | 執行階段提供者 |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

兩個目錄共用同一把 OpenCode API 金鑰（`OPENCODE_API_KEY`，別名
`OPENCODE_ZEN_API_KEY`）。OpenClaw 會將執行階段提供者 ID 保持分開，讓
上游的個別模型路由維持正確，但初始設定與文件會將它們視為
同一個 OpenCode 設定。

## 開始使用

<Tabs>
  <Tab title="Zen catalog">
    **最適合：** 精選的 OpenCode 多模型代理（Claude、GPT、Gemini、GLM、
    DeepSeek、Kimi、MiniMax、Qwen）。

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
    **最適合：** OpenCode 託管的 Kimi、GLM、MiniMax、Qwen 與 DeepSeek 模型陣容。

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

| 屬性             | 值                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------- |
| 執行階段提供者 | `opencode`                                                                                    |
| 範例模型         | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

執行 `openclaw models list --provider opencode` 查看完整的目前清單，其中
也包含免費級別列，例如 `opencode/big-pickle` 和
`opencode/deepseek-v4-flash-free`。

### Go

| 屬性             | 值                                                                       |
| ---------------- | ------------------------------------------------------------------------ |
| 執行階段提供者 | `opencode-go`                                                            |
| 範例模型         | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

請參閱 [OpenCode Go](/zh-TW/providers/opencode-go) 以取得完整的 Go 模型表。

## 進階設定

<AccordionGroup>
  <Accordion title="API key aliases">
    `OPENCODE_ZEN_API_KEY` 也可作為 `OPENCODE_API_KEY` 的別名使用。
  </Accordion>

  <Accordion title="Shared credentials">
    在設定期間輸入一把 OpenCode 金鑰，會為兩個執行階段
    提供者儲存憑證。你不需要分別為每個目錄執行初始設定。
  </Accordion>

  <Accordion title="Getting an API key">
    建立 OpenCode 帳戶，並在
    [opencode.ai/auth](https://opencode.ai/auth) 產生 API 金鑰。計費與目錄
    可用性會從 OpenCode 儀表板管理。
  </Accordion>

  <Accordion title="Gemini replay behavior">
    Gemini 支援的 OpenCode 參照會保留在 proxy-Gemini 路徑上，因此 OpenClaw 會在那裡保留
    Gemini thought-signature 清理，而不啟用原生 Gemini
    重播驗證或啟動重寫。
  </Accordion>

  <Accordion title="Non-Gemini replay behavior">
    非 Gemini 的 OpenCode 參照會保留最小 OpenAI 相容重播政策。
  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="OpenCode Go" href="/zh-TW/providers/opencode-go" icon="server">
    完整的 Go 目錄參考。
  </Card>
  <Card title="Model selection" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照與故障轉移行為。
  </Card>
  <Card title="Configuration reference" href="/zh-TW/gateway/configuration-reference" icon="gear">
    代理程式、模型與提供者的完整設定參考。
  </Card>
</CardGroup>

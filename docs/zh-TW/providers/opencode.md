---
read_when:
    - 你想要存取由 OpenCode 託管的模型
    - 您想在 Zen 與 Go 目錄之間做選擇
summary: 搭配 OpenClaw 使用 OpenCode Zen 與 Go 目錄
title: OpenCode
x-i18n:
    generated_at: "2026-07-11T21:43:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de287eb8a349f26c265f95b8b1de3af4035aa2bdc3501c7279f714d297bb8b9b
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode 在 OpenClaw 中提供兩個託管目錄：

| 目錄    | 前綴              | 執行階段供應商 |
| ------- | ----------------- | -------------- |
| **Zen** | `opencode/...`    | `opencode`     |
| **Go**  | `opencode-go/...` | `opencode-go`  |

兩個目錄共用一組 OpenCode API 金鑰（`OPENCODE_API_KEY`，別名為
`OPENCODE_ZEN_API_KEY`）。OpenClaw 將執行階段供應商 ID 分開，以確保
上游的個別模型路由維持正確，但初始設定與文件會將兩者視為同一套
OpenCode 設定。

## 開始使用

<Tabs>
  <Tab title="Zen 目錄">
    **最適合：** 精選的 OpenCode 多模型代理服務（Claude、GPT、Gemini、GLM、
    DeepSeek、Kimi、MiniMax、Qwen）。

    <Steps>
      <Step title="執行初始設定">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        或直接傳入金鑰：

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="將 Zen 模型設為預設模型">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="確認模型可用">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Go 目錄">
    **最適合：** 由 OpenCode 託管的 Kimi、GLM、MiniMax、Qwen 與 DeepSeek 模型陣容。

    <Steps>
      <Step title="執行初始設定">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        或直接傳入金鑰：

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="將 Go 模型設為預設模型">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="確認模型可用">
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

| 屬性           | 值                                                                                            |
| -------------- | --------------------------------------------------------------------------------------------- |
| 執行階段供應商 | `opencode`                                                                                    |
| 模型範例       | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

執行 `openclaw models list --provider opencode` 可查看目前的完整清單，其中
也包含 `opencode/big-pickle` 和
`opencode/deepseek-v4-flash-free` 等免費方案項目。

### Go

| 屬性           | 值                                                                       |
| -------------- | ------------------------------------------------------------------------ |
| 執行階段供應商 | `opencode-go`                                                            |
| 模型範例       | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

如需完整的 Go 模型表格，請參閱 [OpenCode Go](/zh-TW/providers/opencode-go)。

## 進階設定

<AccordionGroup>
  <Accordion title="API 金鑰別名">
    `OPENCODE_ZEN_API_KEY` 也可作為 `OPENCODE_API_KEY` 的別名使用。
  </Accordion>

  <Accordion title="共用憑證">
    在設定期間輸入一組 OpenCode 金鑰，會為兩個執行階段供應商儲存憑證。
    你不需要分別為每個目錄執行初始設定。
  </Accordion>

  <Accordion title="取得 API 金鑰">
    請建立 OpenCode 帳戶，並前往
    [opencode.ai/auth](https://opencode.ai/auth) 產生 API 金鑰。帳務與目錄
    可用性均透過 OpenCode 儀表板管理。
  </Accordion>

  <Accordion title="Gemini 重播行為">
    以 Gemini 為基礎的 OpenCode 參照會繼續使用代理 Gemini 路徑，因此 OpenClaw
    會在該處保留 Gemini 思考簽章清理機制，而不啟用原生 Gemini
    重播驗證或啟動重寫。
  </Accordion>

  <Accordion title="非 Gemini 重播行為">
    非 Gemini 的 OpenCode 參照會保留最低限度的 OpenAI 相容重播原則。
  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="OpenCode Go" href="/zh-TW/providers/opencode-go" icon="server">
    完整的 Go 目錄參考資料。
  </Card>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照與容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    代理程式、模型與供應商的完整設定參考資料。
  </Card>
</CardGroup>

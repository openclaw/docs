---
read_when:
    - 你想要 OpenCode Go 目錄
    - 你需要 Go 託管模型的執行階段模型參照
summary: 使用共用的 OpenCode 設定搭配 OpenCode Go 目錄
title: OpenCode Go
x-i18n:
    generated_at: "2026-06-27T19:56:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb4e6bd452eeebca5456b0cd70e7622e07ed050a07ff9d6d00926f32efe90569
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go 是 [OpenCode](/zh-TW/providers/opencode) 中的 Go 目錄。
它使用與 Zen 目錄相同的 `OPENCODE_API_KEY`，但保留執行階段
提供者 ID `opencode-go`，以便上游的逐模型路由保持正確。

| 屬性             | 值                              |
| ---------------- | ------------------------------- |
| 執行階段提供者   | `opencode-go`                   |
| 驗證             | `OPENCODE_API_KEY`              |
| 父層設定         | [OpenCode](/zh-TW/providers/opencode) |

## 內建目錄

OpenClaw 從內建的 OpenClaw 模型登錄檔取得大多數 Go 目錄列，
並在登錄檔追上之前補充目前的上游列。執行
`openclaw models list --provider opencode-go` 以取得目前的模型清單。

此提供者包含：

| 模型參照                        | 名稱                  |
| ------------------------------- | --------------------- |
| `opencode-go/glm-5`             | GLM-5                 |
| `opencode-go/glm-5.1`           | GLM-5.1               |
| `opencode-go/glm-5.2`           | GLM-5.2               |
| `opencode-go/kimi-k2.5`         | Kimi K2.5             |
| `opencode-go/kimi-k2.6`         | Kimi K2.6（3 倍限制） |
| `opencode-go/kimi-k2.7-code`    | Kimi K2.7 Code        |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro       |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash     |
| `opencode-go/mimo-v2-omni`      | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`       | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus          |

GLM-5.2 使用 100 萬 token 的上下文視窗，並支援最多 131K 個輸出 token。

## 開始使用

<Tabs>
  <Tab title="互動式">
    <Steps>
      <Step title="執行初始設定">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="將 Go 模型設為預設值">
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

  <Tab title="非互動式">
    <Steps>
      <Step title="直接傳入金鑰">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
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
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## 進階設定

<AccordionGroup>
  <Accordion title="路由行為">
    當模型參照使用 `opencode-go/...` 時，OpenClaw 會自動處理逐模型路由。
    不需要額外的提供者設定。
  </Accordion>

  <Accordion title="執行階段參照慣例">
    執行階段參照保持明確：Zen 使用 `opencode/...`，Go 使用 `opencode-go/...`。
    這會在兩個目錄之間保持上游逐模型路由正確。
  </Accordion>

  <Accordion title="共用憑證">
    Zen 和 Go 目錄都使用相同的 `OPENCODE_API_KEY`。在設定期間輸入
    金鑰會為兩個執行階段提供者儲存憑證。
  </Accordion>
</AccordionGroup>

<Tip>
請參閱 [OpenCode](/zh-TW/providers/opencode)，了解共用的初始設定概覽，以及完整的
Zen + Go 目錄參考。
</Tip>

## 相關

<CardGroup cols={2}>
  <Card title="OpenCode（父層）" href="/zh-TW/providers/opencode" icon="server">
    共用的初始設定、目錄概覽和進階注意事項。
  </Card>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照和容錯移轉行為。
  </Card>
</CardGroup>

---
read_when:
    - 您想要 OpenCode Go 目錄
    - 你需要 Go 託管模型的執行階段模型 refs
summary: 使用 OpenCode Go 目錄搭配共用的 OpenCode 設定
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-30T03:32:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b2b5ba7f81cc101c3e9abdd79a18dc523a4f18b10242a0513b288fcbcc975e4
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go 是 [OpenCode](/zh-TW/providers/opencode) 內的 Go 目錄。
它使用與 Zen 目錄相同的 `OPENCODE_API_KEY`，但保留執行階段
提供者 ID `opencode-go`，讓上游逐模型路由保持正確。

| 屬性             | 值                              |
| ---------------- | ------------------------------- |
| 執行階段提供者   | `opencode-go`                   |
| 驗證             | `OPENCODE_API_KEY`              |
| 上層設定         | [OpenCode](/zh-TW/providers/opencode) |

## 內建目錄

OpenClaw 從隨附的 Pi 模型登錄檔取得大多數 Go 目錄列，並在登錄檔追上前
補充目前的上游列。執行 `openclaw models list --provider opencode-go` 以查看目前的模型清單。

此提供者包含：

| 模型參照                        | 名稱                  |
| ------------------------------- | --------------------- |
| `opencode-go/glm-5`             | GLM-5                 |
| `opencode-go/glm-5.1`           | GLM-5.1               |
| `opencode-go/kimi-k2.5`         | Kimi K2.5             |
| `opencode-go/kimi-k2.6`         | Kimi K2.6（3 倍限制） |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro       |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash     |
| `opencode-go/mimo-v2-omni`      | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`       | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus          |

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
    執行階段參照會保持明確：Zen 使用 `opencode/...`，Go 使用 `opencode-go/...`。
    這會讓兩個目錄的上游逐模型路由都保持正確。
  </Accordion>

  <Accordion title="共用憑證">
    Zen 和 Go 目錄都使用相同的 `OPENCODE_API_KEY`。在設定期間輸入
    金鑰會為兩個執行階段提供者儲存憑證。
  </Accordion>
</AccordionGroup>

<Tip>
請參閱 [OpenCode](/zh-TW/providers/opencode)，了解共用的初始設定概觀與完整的
Zen + Go 目錄參考。
</Tip>

## 相關

<CardGroup cols={2}>
  <Card title="OpenCode（上層）" href="/zh-TW/providers/opencode" icon="server">
    共用的初始設定、目錄概觀與進階備註。
  </Card>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照與容錯移轉行為。
  </Card>
</CardGroup>

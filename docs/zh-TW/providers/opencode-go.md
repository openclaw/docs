---
read_when:
    - 你想要 OpenCode Go 目錄
    - 你需要 Go 託管模型的執行階段模型 refs
summary: 使用共用的 OpenCode 設定搭配 OpenCode Go 目錄
title: OpenCode Go
x-i18n:
    generated_at: "2026-07-05T11:38:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: decfc453b812c1264fc3e976dca4e1289171bac67b9e268f6cd9e5076b5aa78b
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go 是 [OpenCode](/zh-TW/providers/opencode) 內的 Go 目錄。它與 Zen 目錄共用 `OPENCODE_API_KEY` 認證，但保留自己的執行階段提供者 ID (`opencode-go`)，讓上游的逐模型路由保持正確。

| 屬性             | 值                                                 |
| ---------------- | -------------------------------------------------- |
| 執行階段提供者   | `opencode-go`                                      |
| 驗證             | `OPENCODE_API_KEY`（別名：`OPENCODE_ZEN_API_KEY`） |
| 父層設定         | [OpenCode](/zh-TW/providers/opencode)                    |

## 開始使用

<Tabs>
  <Tab title="互動式">
    <Steps>
      <Step title="執行上線設定">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="將 Go 模型設為預設">
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

## 內建目錄

執行 `openclaw models list --provider opencode-go` 取得目前的模型清單。隨附列項：

| 模型參照                        | 名稱              | 上下文    | 最大輸出   | 圖像輸入 |
| ------------------------------- | ----------------- | --------- | ---------- | -------- |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro   | 1M        | 384K       | 否       |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash | 1M        | 384K       | 否       |
| `opencode-go/glm-5`             | GLM-5             | 202,752   | 32,768     | 否       |
| `opencode-go/glm-5.1`           | GLM-5.1           | 202,752   | 32,768     | 否       |
| `opencode-go/glm-5.2`           | GLM-5.2           | 1M        | 131,072    | 否       |
| `opencode-go/hy3-preview`       | HY3 Preview       | 262,144   | 32,768     | 否       |
| `opencode-go/kimi-k2.5`         | Kimi K2.5         | 262,144   | 65,536     | 是       |
| `opencode-go/kimi-k2.6`         | Kimi K2.6         | 262,144   | 65,536     | 是       |
| `opencode-go/kimi-k2.7-code`    | Kimi K2.7 Code    | 262,144   | 262,144    | 是       |
| `opencode-go/mimo-v2-omni`      | MiMo V2 Omni      | 262,144   | 32,000     | 是       |
| `opencode-go/mimo-v2.5`         | MiMo V2.5         | 1M        | 128,000    | 是       |
| `opencode-go/mimo-v2-pro`       | MiMo V2 Pro       | 1,048,576 | 32,000     | 否       |
| `opencode-go/mimo-v2.5-pro`     | MiMo V2.5 Pro     | 1,048,576 | 128,000    | 否       |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5      | 204,800   | 65,536     | 否       |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7      | 204,800   | 131,072    | 否       |
| `opencode-go/minimax-m3`        | MiniMax M3        | 204,800   | 131,072    | 否       |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus      | 262,144   | 65,536     | 是       |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus      | 262,144   | 65,536     | 是       |
| `opencode-go/qwen3.7-max`       | Qwen3.7 Max       | 1M        | 65,536     | 否       |
| `opencode-go/qwen3.7-plus`      | Qwen3.7 Plus      | 1M        | 65,536     | 是       |

## 進階設定

<AccordionGroup>
  <Accordion title="路由行為">
    OpenClaw 會自動路由任何 `opencode-go/...` 模型參照。不需要額外的提供者設定。
  </Accordion>

  <Accordion title="執行階段參照慣例">
    執行階段參照保持明確：Zen 使用 `opencode/...`，Go 使用 `opencode-go/...`。這可讓兩個目錄的上游逐模型路由保持正確。
  </Accordion>

  <Accordion title="共用認證">
    一個 `OPENCODE_API_KEY` 涵蓋 Zen 和 Go 兩個目錄。在設定期間輸入金鑰，會為兩個執行階段提供者儲存認證。
  </Accordion>
</AccordionGroup>

<Tip>
請參閱 [OpenCode](/zh-TW/providers/opencode)，了解共用的上線設定概觀，以及完整的 Zen + Go 目錄參考。
</Tip>

## 相關

<CardGroup cols={2}>
  <Card title="OpenCode（父層）" href="/zh-TW/providers/opencode" icon="server">
    共用上線設定、目錄概觀，以及進階注意事項。
  </Card>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照，以及容錯移轉行為。
  </Card>
</CardGroup>

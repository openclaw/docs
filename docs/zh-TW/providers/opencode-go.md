---
read_when:
    - 你需要 OpenCode Go 目錄
    - 你需要 Go 託管模型的執行階段模型參照
summary: 搭配共用的 OpenCode 設定使用 OpenCode Go 目錄
title: OpenCode Go
x-i18n:
    generated_at: "2026-07-12T14:49:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: df647721e8966fd4fad3178550b071a2eb827148fe765bda53b3d7c97ceaadc2
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go 是 [OpenCode](/zh-TW/providers/opencode) 內的 Go 目錄。它與 Zen 目錄共用
`OPENCODE_API_KEY` 認證資訊，但保有自己的執行階段供應商 ID
（`opencode-go`），以確保上游依模型路由維持正確。

| 屬性             | 值                                                 |
| ---------------- | -------------------------------------------------- |
| 執行階段供應商   | `opencode-go`                                      |
| 驗證             | `OPENCODE_API_KEY`（別名：`OPENCODE_ZEN_API_KEY`） |
| 上層設定         | [OpenCode](/zh-TW/providers/opencode)                    |

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

## 內建目錄

執行 `openclaw models list --provider opencode-go` 以取得目前的模型清單。
隨附項目：

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
| `opencode-go/mimo-v2.5`         | MiMo V2.5         | 1M        | 128,000    | 是       |
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
    OpenClaw 會自動路由任何 `opencode-go/...` 模型參照。不需要額外的
    供應商設定。
  </Accordion>

  <Accordion title="執行階段參照慣例">
    執行階段參照會維持明確：Zen 使用 `opencode/...`，Go 使用
    `opencode-go/...`。這可確保兩個目錄的上游依模型路由維持正確。
  </Accordion>

  <Accordion title="共用認證資訊">
    一組 `OPENCODE_API_KEY` 同時適用於 Zen 和 Go 目錄。在設定期間輸入
    金鑰，會為兩個執行階段供應商儲存認證資訊。
  </Accordion>
</AccordionGroup>

<Tip>
請參閱 [OpenCode](/zh-TW/providers/opencode)，瞭解共用的初始設定概覽，以及完整的
Zen + Go 目錄參考資料。
</Tip>

## 相關內容

<CardGroup cols={2}>
  <Card title="OpenCode（上層）" href="/zh-TW/providers/opencode" icon="server">
    共用初始設定、目錄概覽與進階說明。
  </Card>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照與容錯移轉行為。
  </Card>
</CardGroup>

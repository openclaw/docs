---
read_when:
    - 你想在 OpenClaw 中使用 GLM 模型
    - 你需要模型命名慣例與設定
summary: GLM 模型系列概觀 + 如何在 OpenClaw 中使用
title: GLM（智譜）
x-i18n:
    generated_at: "2026-04-30T03:31:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0272f0621559c0aba2c939dc52771ac2c94a20f9f7201c1f71d80a9c2197c7e7
    source_path: providers/glm.md
    workflow: 16
---

# GLM 模型

GLM 是透過 Z.AI 平台提供的**模型系列**（不是公司）。在 OpenClaw 中，GLM
模型會透過 `zai` 提供者和像 `zai/glm-5` 這樣的模型 ID 存取。

## 開始使用

<Steps>
  <Step title="選擇驗證路徑並執行入門設定">
    選擇符合你的 Z.AI 方案與地區的入門設定選項：

    | 驗證選項 | 最適合 |
    | ----------- | -------- |
    | `zai-api-key` | 通用 API 金鑰設定，並自動偵測端點 |
    | `zai-coding-global` | Coding Plan 使用者（全球） |
    | `zai-coding-cn` | Coding Plan 使用者（中國地區） |
    | `zai-global` | 一般 API（全球） |
    | `zai-cn` | 一般 API（中國地區） |

    ```bash
    # Example: generic auto-detect
    openclaw onboard --auth-choice zai-api-key

    # Example: Coding Plan global
    openclaw onboard --auth-choice zai-coding-global
    ```

  </Step>
  <Step title="將 GLM 設為預設模型">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="確認模型可用">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## 設定範例

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
`zai-api-key` 會讓 OpenClaw 從金鑰偵測對應的 Z.AI 端點，並
自動套用正確的基底 URL。當你想強制使用特定 Coding Plan 或一般 API 介面時，
請使用明確的地區選項。
</Tip>

## 內建目錄

OpenClaw 目前會為 bundled `zai` 提供者植入這些 GLM 參照：

| 模型           | 模型            |
| --------------- | ---------------- |
| `glm-5.1`       | `glm-4.7`        |
| `glm-5`         | `glm-4.7-flash`  |
| `glm-5-turbo`   | `glm-4.7-flashx` |
| `glm-5v-turbo`  | `glm-4.6`        |
| `glm-4.5`       | `glm-4.6v`       |
| `glm-4.5-air`   |                  |
| `glm-4.5-flash` |                  |
| `glm-4.5v`      |                  |

<Note>
預設的 bundled 模型參照是 `zai/glm-5.1`。GLM 版本與可用性
可能會變更；請查看 Z.AI 文件以取得最新資訊。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="端點自動偵測">
    當你使用 `zai-api-key` 驗證選項時，OpenClaw 會檢查金鑰格式，
    以判斷正確的 Z.AI 基底 URL。明確的地區選項
    (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) 會覆寫
    自動偵測，並直接固定端點。
  </Accordion>

  <Accordion title="提供者詳細資訊">
    GLM 模型由 `zai` 執行階段提供者提供服務。如需完整的提供者
    設定、地區端點和其他功能，請參閱
    [Z.AI 提供者文件](/zh-TW/providers/zai)。
  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="Z.AI 提供者" href="/zh-TW/providers/zai" icon="server">
    完整的 Z.AI 提供者設定與地區端點。
  </Card>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照和容錯移轉行為。
  </Card>
</CardGroup>

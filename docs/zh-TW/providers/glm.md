---
read_when:
    - 您想在 OpenClaw 中使用 GLM 模型
    - 你需要了解模型命名慣例與設定
summary: GLM 模型系列概覽及其在 OpenClaw 中的使用方式
title: GLM（智譜）
x-i18n:
    generated_at: "2026-05-06T02:55:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 190b8834e3f11cdb90c9bdb1844bfad3a79383776540f733e601437157b7a093
    source_path: providers/glm.md
    workflow: 16
---

GLM 是可透過 [Z.AI](https://z.ai) 平台使用的模型系列（不是公司）。在 OpenClaw 中，GLM 模型會透過內建的 `zai` provider 存取，使用像是 `zai/glm-5.1` 的 refs。

| 屬性                | 值                                                                          |
| ------------------- | --------------------------------------------------------------------------- |
| Provider id         | `zai`                                                                       |
| Plugin              | 內建，`enabledByDefault: true`                                              |
| 驗證環境變數        | `ZAI_API_KEY` 或 `Z_AI_API_KEY`                                             |
| onboarding 選項     | `zai-api-key`, `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn` |
| API                 | OpenAI 相容                                                                 |
| 預設 base URL       | `https://api.z.ai/api/paas/v4`                                              |
| 建議預設值          | `zai/glm-5.1`                                                               |
| 預設影像模型        | `zai/glm-4.6v`                                                              |

## 開始使用

<Steps>
  <Step title="選擇驗證路徑並執行 onboarding">
    選擇符合你的 Z.AI 方案與區域的 onboarding 選項。通用的 `zai-api-key` 選項會從金鑰形狀自動偵測相符的端點；當你想強制使用特定 Coding Plan 或一般 API 介面時，請使用明確的區域選項。

    | 驗證選項            | 最適合                                              |
    | ------------------- | --------------------------------------------------- |
    | `zai-api-key`       | 具端點自動偵測的一般 API 金鑰                      |
    | `zai-coding-global` | Coding Plan 使用者（全球）                         |
    | `zai-coding-cn`     | Coding Plan 使用者（中國區域）                     |
    | `zai-global`        | 一般 API（全球）                                   |
    | `zai-cn`            | 一般 API（中國區域）                               |

    <CodeGroup>

```bash 自動偵測
openclaw onboard --auth-choice zai-api-key
```

```bash Coding Plan（全球）
openclaw onboard --auth-choice zai-coding-global
```

```bash Coding Plan（中國）
openclaw onboard --auth-choice zai-coding-cn
```

```bash 一般 API（全球）
openclaw onboard --auth-choice zai-global
```

```bash 一般 API（中國）
openclaw onboard --auth-choice zai-cn
```

    </CodeGroup>

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
  `zai-api-key` 讓 OpenClaw 從金鑰形狀偵測相符的 Z.AI 端點，並自動套用正確的 base URL。當你想固定使用特定 Coding Plan 或一般 API 介面時，請使用明確的區域選項。
</Tip>

## 內建目錄

內建的 `zai` provider 會植入 13 個 GLM 模型 refs。所有項目都支援 reasoning，除非另有標示；`glm-5v-turbo` 和 `glm-4.6v` 除文字外也接受影像輸入。

| 模型 ref             | 備註                                               |
| -------------------- | -------------------------------------------------- |
| `zai/glm-5.1`        | 預設模型。reasoning，僅文字，202k context。       |
| `zai/glm-5`          | reasoning，僅文字，202k context。                 |
| `zai/glm-5-turbo`    | reasoning，僅文字，202k context。                 |
| `zai/glm-5v-turbo`   | reasoning，文字 + 影像，202k context。            |
| `zai/glm-4.7`        | reasoning，僅文字，204k context。                 |
| `zai/glm-4.7-flash`  | reasoning，僅文字，200k context。                 |
| `zai/glm-4.7-flashx` | reasoning，僅文字。                               |
| `zai/glm-4.6`        | reasoning，僅文字。                               |
| `zai/glm-4.6v`       | reasoning，文字 + 影像。預設影像模型。           |
| `zai/glm-4.5`        | reasoning，僅文字。                               |
| `zai/glm-4.5-air`    | reasoning，僅文字。                               |
| `zai/glm-4.5-flash`  | reasoning，僅文字。                               |
| `zai/glm-4.5v`       | reasoning，文字 + 影像。                          |

<Note>
  GLM 版本和可用性可能會變動。執行 `openclaw models list --provider zai` 查看你已安裝版本所知道的目錄列，並查看 Z.AI 的文件以了解新增或已棄用的模型。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="端點自動偵測">
    當你使用 `zai-api-key` 驗證選項時，OpenClaw 會檢查金鑰形狀以判斷正確的 Z.AI base URL。明確的區域選項（`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`）會覆寫自動偵測並直接固定端點。
  </Accordion>

  <Accordion title="Provider 詳細資訊">
    GLM 模型由 `zai` runtime provider 提供。完整的 provider 設定、區域端點和其他能力，請參閱 [Z.AI provider 頁面](/zh-TW/providers/zai)。
  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="Z.AI provider" href="/zh-TW/providers/zai" icon="server">
    完整的 Z.AI provider 設定與區域端點。
  </Card>
  <Card title="模型 providers" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇 providers、模型 refs 與容錯移轉行為。
  </Card>
  <Card title="思考模式" href="/zh-TW/tools/thinking" icon="brain">
    適用於具 reasoning 能力的 GLM 系列的 `/think` 層級。
  </Card>
  <Card title="模型常見問題" href="/zh-TW/help/faq-models" icon="circle-question">
    驗證 profiles、切換模型，以及解決「no profile」錯誤。
  </Card>
</CardGroup>

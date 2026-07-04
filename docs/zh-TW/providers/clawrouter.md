---
read_when:
    - 你想要用一個受管金鑰來支援多個模型供應商
    - 你需要在 OpenClaw 中使用 ClawRouter 模型探索或配額回報
summary: 透過 ClawRouter 路由憑證範圍限定的模型，並顯示受管理配額
title: ClawRouter
x-i18n:
    generated_at: "2026-07-04T03:35:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 363426cc68e74f6a910f6fa956c323449ab827aee43db4320e98620245e593d2
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter 讓 OpenClaw 可用一個受政策範圍限制的金鑰存取多個上游模型供應商。內建外掛只會探索該金鑰允許的模型，透過各模型宣告的通訊協定進行路由，並在 OpenClaw 使用量介面回報該金鑰的預算與彙總使用量。

你不需要在 OpenClaw 主機上安裝或驗證每個上游供應商外掛。上游憑證與供應商專屬轉送都留在 ClawRouter 中。OpenClaw 只需要內建的 `@openclaw/clawrouter` 外掛和已核發的 ClawRouter 憑證。

| 屬性          | 值                                       |
| ------------- | ---------------------------------------- |
| 供應商        | `clawrouter`                             |
| 套件          | `@openclaw/clawrouter`                   |
| 驗證          | `CLAWROUTER_API_KEY`                     |
| 預設 URL      | `https://clawrouter.openclaw.ai`         |
| 模型目錄      | 透過 `/v1/catalog` 依憑證範圍限制        |
| 配額          | 透過 `/v1/usage` 提供每月預算與使用量    |

## 開始使用

<Steps>
  <Step title="取得受範圍限制的憑證">
    向你的 ClawRouter 管理員索取一組憑證，其政策應包含你可使用的供應商、模型與每月預算。憑證只會在核發時顯示一次。
  </Step>
  <Step title="設定 OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    此外掛已內建於 OpenClaw。如果你的設定有設定 `plugins.allow`，請先將 `clawrouter` 加入該清單再啟用。若為自訂部署，請將 `models.providers.clawrouter.baseUrl` 設為 ClawRouter 來源；預設值為 `https://clawrouter.openclaw.ai`。

  </Step>
  <Step title="列出已授權模型">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    請完全依照回傳內容使用模型參照。它們會保留上游命名空間，例如 `clawrouter/openai/...`、`clawrouter/anthropic/...` 或 `clawrouter/google/...`。如果你的設定中 `agents.defaults.models` 是允許清單，請將每個選定的 ClawRouter 參照加入其中。

  </Step>
  <Step title="選取模型">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    你也可以用 `openclaw agent --model clawrouter/<provider>/<model> --message "..."` 為單次執行選取回傳的模型。

  </Step>
</Steps>

## 模型探索

`GET /v1/catalog` 是真實來源。OpenClaw 不會另外提供第二份固定的 ClawRouter 模型清單。在下列情況下，設定於 ClawRouter 的模型會出現：

- 憑證的政策授權其供應商；
- 供應商連線已啟用並就緒；
- 目錄模型宣告支援的 LLM 能力；且
- 目錄公開外掛支援的傳輸合約。

因此，將另一個模型加入受支援的 ClawRouter 供應商，不需要 OpenClaw 發行新版或安裝另一個供應商外掛。下一次目錄重新整理就會探索到它。需要新線路通訊協定的模型，必須先在 ClawRouter 外掛中支援，OpenClaw 才會公告它。

## 通訊協定與供應商外掛

你不需要安裝每個上游公司的驗證外掛。ClawRouter 擁有上游憑證；它的目錄會告訴 OpenClaw 要使用哪種傳輸。此外掛支援：

| 目錄路由                       | OpenClaw 傳輸          |
| ------------------------------ | ---------------------- |
| OpenAI 相容聊天                | `openai-completions`   |
| OpenAI 相容 Responses          | `openai-responses`     |
| 原生 Anthropic Messages        | `anthropic-messages`   |
| 原生 Google Gemini 串流        | `google-generative-ai` |

此外掛也會為這些家族套用相符的重放與工具架構政策。使用其他請求或串流格式的目錄列，會刻意不公告為 OpenClaw 文字模型。請在 ClawRouter 中將這些供應商正規化為其中一種受支援合約，而不是傳送不相容的承載資料。

## 配額與使用量

ClawRouter 的 `/v1/usage` 回應會提供給一般 OpenClaw 供應商使用量介面。當金鑰有限額時，`/status` 和相關儀表板狀態會顯示每月預算期間，以及請求、權杖與花費總計。未計量金鑰仍會顯示彙總使用量，但不會顯示百分比期間。

配額查詢使用與模型探索相同的受範圍限制金鑰。配額查詢失敗不會阻止模型執行。

使用下列指令檢查即時快照：

```bash
openclaw status --usage
openclaw models status
```

相同的供應商快照也可供聊天中的 `/status` 和 OpenClaw 使用量 UI 使用。預算是政策範圍層級，因此另一個用戶端使用相同 ClawRouter 政策發出的請求，可能會改變剩餘百分比。

## 疑難排解

| 症狀                                     | 檢查                                                                                                                                           |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 沒有 ClawRouter 模型                     | 確認外掛已啟用且由 `plugins.allow` 允許，然後檢查憑證是否有效，且至少授權一個就緒供應商。                                                    |
| 已設定的 ClawRouter 模型遺失             | 檢查其 `/v1/catalog` 能力與路由格式。不支援的傳輸合約會被刻意過濾。                                                                            |
| `Unknown model: clawrouter/...`          | 當該設定對應被用作允許清單時，請將精確的目錄參照加入 `agents.defaults.models`。                                                                |
| 目錄或使用量回傳 `401` 或 `403`          | 重新核發或重新設定 ClawRouter 憑證範圍；OpenClaw 不會退回使用上游供應商金鑰。                                                                  |
| 探索後模型呼叫失敗                       | 檢查 ClawRouter 中的供應商連線與上游健康狀態，然後在其就緒狀態恢復後重試。                                                                     |
| 使用量有總計但沒有百分比                 | 該政策未計量；請在 ClawRouter 中加入每月預算，以公開百分比期間。                                                                               |

## 安全性行為

- 目錄探索受限於已設定的代理金鑰範圍，並依金鑰快取。
- 代理金鑰只會在請求分派時附加；不會儲存在模型中繼資料中。
- 原生 Anthropic 與 Gemini 模型 ID 只會在分派時重寫為其上游 ID。
- 不支援或未授權的目錄列會失敗關閉，且無法被選取。

## 相關

<CardGroup cols={2}>
  <Card title="模型供應商" href="/zh-TW/concepts/model-providers" icon="layers">
    供應商設定與模型選取。
  </Card>
  <Card title="使用量追蹤" href="/zh-TW/concepts/usage-tracking" icon="chart-line">
    OpenClaw 使用量與狀態介面。
  </Card>
</CardGroup>

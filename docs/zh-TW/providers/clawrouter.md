---
read_when:
    - 你想要用一個受管理的金鑰來支援多個模型提供者
    - 你需要 OpenClaw 中的 ClawRouter 模型探索或配額回報
summary: 透過 ClawRouter 路由憑證範圍模型並顯示受管理的配額
title: ClawRouter
x-i18n:
    generated_at: "2026-07-05T11:40:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 888516e7b7c8bd25e15c9506e6b10f0b4847274755cc72377cb06415a55cb988
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter 讓 OpenClaw 能以一個依政策範圍限定的金鑰使用多個上游模型提供者。內建的 `clawrouter` 外掛只會探索該金鑰允許的模型，透過每個模型宣告的通訊協定進行路由，並在 OpenClaw 使用量介面回報該金鑰的預算與彙總使用量。

上游憑證與提供者專屬轉送會保留在 ClawRouter 中，因此你不需要在 OpenClaw 主機上安裝或驗證每個上游提供者外掛。此外掛隨 OpenClaw 內建提供（`enabledByDefault: true`）；你只需要一組已核發的 ClawRouter 憑證。

| 屬性          | 值                                       |
| ------------- | ---------------------------------------- |
| 提供者        | `clawrouter`                             |
| 外掛          | 內建（包含在 OpenClaw 中）               |
| 驗證          | `CLAWROUTER_API_KEY`                     |
| 預設 URL      | `https://clawrouter.openclaw.ai`         |
| 模型目錄      | 透過 `/v1/catalog` 依憑證範圍限定        |
| 配額          | 透過 `/v1/usage` 提供每月預算與使用量    |

## 開始使用

<Steps>
  <Step title="取得範圍限定的憑證">
    向你的 ClawRouter 管理員索取一組憑證，其政策應包含你可使用的提供者、模型與每月預算。憑證只會在核發時顯示一次。
  </Step>
  <Step title="設定 OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` 是內建外掛，並預設啟用。如果你的設定有設定 `plugins.allow`，請先將 `clawrouter` 加入該清單，再啟用它。若是自訂部署，請將 `models.providers.clawrouter.baseUrl` 設為 ClawRouter 來源；預設值是 `https://clawrouter.openclaw.ai`。

  </Step>
  <Step title="列出已授權的模型">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    請完全依照回傳內容使用模型參照。它們會保留上游命名空間，例如 `clawrouter/openai/gpt-5.5`、`clawrouter/anthropic/claude-sonnet-4-6` 或 `clawrouter/google/gemini-3.5-flash`。如果你的設定中 `agents.defaults.models` 是允許清單，請將每個選定的 ClawRouter 參照加入其中。

  </Step>
  <Step title="選取模型">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    你也可以使用 `openclaw agent --model clawrouter/<provider>/<model> --message "..."`，為單次執行選取回傳的模型。

  </Step>
</Steps>

## 模型探索

`GET /v1/catalog` 會回傳 `{ providers: [...] }`，其中每個提供者項目會列出自己的 `models[]`（包含上游 ID、能力與定價）以及支援的請求路由。OpenClaw 不會隨附第二份固定的 ClawRouter 模型清單。目錄模型會在符合下列條件時公告為 OpenClaw 模型：

- 憑證的政策授權其提供者；
- 目錄模型公告支援的 LLM 能力（`llm.responses`、`llm.chat`、`llm.messages`，或具備相符串流路由的 `llm.stream`）；且
- 提供者針對下列其中一種傳輸公開相符路由。

將模型加入受支援的 ClawRouter 提供者不需要 OpenClaw 發行新版：下一次目錄重新整理（每個憑證範圍快取 60 秒）就會探索到它。需要新線路通訊協定的模型，必須先有外掛支援。

## 通訊協定與提供者外掛

ClawRouter 擁有上游憑證；其目錄會告訴 OpenClaw 要使用哪種傳輸，因此你不需要安裝每家上游公司的驗證外掛。

| 目錄能力 / 路由                                          | OpenClaw 傳輸          |
| -------------------------------------------------------- | ---------------------- |
| `llm.responses`（OpenAI 相容提供者）                     | `openai-responses`     |
| `llm.chat`（OpenAI 相容提供者）                          | `openai-completions`   |
| `llm.messages` + `anthropic.messages` 路由               | `anthropic-messages`   |
| `llm.stream` + 串流 `google.generate_content` 路由       | `google-generative-ai` |

此外掛也會為這些系列套用相符的重播與工具結構描述政策（OpenAI/DeepSeek/Gemini 工具結構描述相容性；原生 Anthropic 與 Google Gemini 重播政策）。若目錄提供者只公開不受支援的請求格式，會有意不公告為 OpenClaw 文字模型。請在 ClawRouter 中將這些提供者標準化為其中一種受支援的合約，而不是傳送不相容的酬載。

## 配額與使用量

ClawRouter 的 `/v1/usage` 回應會供給一般 OpenClaw 提供者使用量介面：請求、權杖與花費總計，以及金鑰有限額時的每月預算期間。未計量的金鑰仍會顯示彙總使用量，但不會顯示百分比期間。

配額查詢會使用與模型探索相同的範圍限定金鑰。配額查詢失敗不會阻擋模型執行。

使用以下命令檢查即時快照：

```bash
openclaw status --usage
openclaw models status
```

相同的提供者快照也可在聊天中的 `/status` 與 OpenClaw 使用量 UI 取得。預算是整個政策共用的，因此另一個用戶端若使用相同 ClawRouter 政策提出請求，可能會改變剩餘百分比。

## 疑難排解

| 症狀                                     | 檢查                                                                                                                                           |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 沒有 ClawRouter 模型                     | 確認外掛已啟用，且 `plugins.allow` 允許它，然後檢查憑證是否有效，並授權至少一個就緒的提供者。                                                  |
| 已設定的 ClawRouter 模型遺失             | 檢查其 `/v1/catalog` 能力與路由支援。不受支援的傳輸合約會有意被篩除。                                                                          |
| `Unknown model: clawrouter/...`          | 當該設定對應表作為允許清單使用時，請將精確的目錄參照加入 `agents.defaults.models`。                                                            |
| 目錄或使用量回傳 `401` 或 `403`          | 重新核發或重新限定 ClawRouter 憑證範圍；OpenClaw 不會退回使用上游提供者金鑰。                                                                 |
| 探索後模型呼叫失敗                       | 在 ClawRouter 中檢查提供者連線與上游健康狀態，然後在其就緒狀態恢復後重試。                                                                     |
| 使用量有總計但沒有百分比                 | 該政策未計量；請在 ClawRouter 中加入每月預算，以公開百分比期間。                                                                               |

## 安全行為

- 目錄探索會限定於已設定的代理金鑰，並依憑證範圍快取（代理目錄、工作區目錄、驗證設定檔 ID 與基礎 URL）。
- 代理金鑰只會在請求分派時附加；不會儲存在模型中繼資料中。
- 原生 Anthropic 與 Gemini 模型 ID 只會在分派時改寫為其上游 ID。
- 不受支援或未授權的目錄列會採取失敗關閉，不可選取。

## 相關

<CardGroup cols={2}>
  <Card title="模型提供者" href="/zh-TW/concepts/model-providers" icon="layers">
    提供者設定與模型選取。
  </Card>
  <Card title="使用量追蹤" href="/zh-TW/concepts/usage-tracking" icon="chart-line">
    OpenClaw 使用量與狀態介面。
  </Card>
</CardGroup>

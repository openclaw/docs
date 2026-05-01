---
read_when:
    - 你希望 OpenClaw 記住自然的後續提問
    - 你想了解推斷式簽到與提醒有何不同
    - 您想檢閱或解除後續承諾
sidebarTitle: Commitments
summary: 針對非精確提醒的簽到所推斷的後續追蹤記憶
title: 推斷出的承諾
x-i18n:
    generated_at: "2026-05-01T02:44:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78841d87fe749aa5b04a967218396df1c1a7884c5767b09215c96aee34fa2014
    source_path: concepts/commitments.md
    workflow: 16
---

承諾是短期存在的後續追蹤記憶。啟用後，OpenClaw 可以
注意到某段對話建立了未來回訪的機會，並記得稍後再提出。

範例：

- 你提到明天有面試。OpenClaw 可能會在之後回訪。
- 你說你很疲憊。OpenClaw 可能稍後詢問你是否睡了覺。
- 代理表示會在某件事改變後跟進。OpenClaw 可能會追蹤
  那個未閉合事項。

承諾不是像 `MEMORY.md` 那樣的持久事實，也不是精確的
提醒。它們介於記憶與自動化之間：OpenClaw 會記住一個
綁定於對話的義務，然後由 Heartbeat 在到期時送出。

## 啟用承諾

承諾預設為關閉。請在設定中啟用：

```bash
openclaw config set commitments.enabled true
openclaw config set commitments.maxPerDay 3
```

等效的 `openclaw.json`：

```json
{
  "commitments": {
    "enabled": true,
    "maxPerDay": 3
  }
}
```

`commitments.maxPerDay` 會限制在滾動的一天內，每個代理工作階段
可以送出的推斷後續追蹤數量。預設值為 `3`。

## 運作方式

代理回覆後，OpenClaw 可能會在獨立脈絡中執行隱藏的背景擷取流程。
該流程只尋找推斷出的後續追蹤承諾。它不會寫入可見對話，也不會要求主要代理
針對擷取流程進行推理。

找到高信心候選項目時，OpenClaw 會儲存一項承諾，其中包含：

- 代理 id
- 工作階段金鑰
- 原始頻道與傳送目標
- 到期時間範圍
- 簡短的建議回訪內容
- 供 Heartbeat 判斷是否送出的非指令性中繼資料

傳送會透過 Heartbeat 進行。承諾到期時，Heartbeat
會將該承諾加入同一代理與頻道範圍的 Heartbeat 回合中。
模型可以送出一則自然的回訪訊息，或回覆 `HEARTBEAT_OK` 來略過它。
如果 Heartbeat 設定為 `target: "none"`，到期承諾會保留在內部，
不會送出外部回訪。承諾傳送提示不會重播原始對話文字，而到期承諾的 Heartbeat 回合
會在沒有 OpenClaw 工具的情況下執行。

OpenClaw 絕不會在寫入推斷出的承諾後立即傳送它。
到期時間會被限制在承諾建立後至少一個 Heartbeat 間隔之後，
因此後續追蹤不會在被推斷出的同一刻回響。

## 範圍

承諾會限定在建立時的確切代理與頻道脈絡中。在 Discord 中與某個代理對話時
推斷出的後續追蹤，不會由另一個代理、另一個頻道或不相關的工作階段送出。

此範圍是此功能的一部分。自然回訪應該感覺像同一段對話的延續，
而不是全域提醒系統。

## 承諾與提醒

| 需求                                            | 使用                                     |
| ----------------------------------------------- | ---------------------------------------- |
| "Remind me at 3 PM"                             | [排程任務](/zh-TW/automation/cron-jobs) |
| "Ping me in 20 minutes"                         | [排程任務](/zh-TW/automation/cron-jobs) |
| "Run this report every weekday"                 | [排程任務](/zh-TW/automation/cron-jobs) |
| "I have an interview tomorrow"                  | 承諾                              |
| "I was up all night"                            | 承諾                              |
| "Follow up if I do not answer this open thread" | 承諾                              |

精確的使用者請求本來就屬於排程器路徑。承諾只用於
推斷出的後續追蹤：也就是使用者沒有要求提醒，
但對話明確建立了有用的未來回訪時刻。

## 管理承諾

使用 CLI 檢查並清除已儲存的承諾：

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

請參閱 [`openclaw commitments`](/zh-TW/cli/commitments) 取得命令參考。

## 隱私權與成本

承諾擷取會使用一次 LLM 流程，因此啟用它會在符合條件的回合後增加背景模型
用量。該流程會對使用者可見的對話隱藏，但它可以讀取最近的交流，以判斷是否存在
後續追蹤。

已儲存的承諾是本機 OpenClaw 狀態。它們是操作性記憶，不是
長期記憶。使用以下命令停用此功能：

```bash
openclaw config set commitments.enabled false
```

## 疑難排解

如果預期的後續追蹤沒有出現：

- 確認 `commitments.enabled` 為 `true`。
- 檢查 `openclaw commitments --all` 中是否有待處理、已略過、已延後或已過期的
  記錄。
- 確保該代理的 Heartbeat 正在執行。
- 檢查該代理工作階段的 `commitments.maxPerDay` 是否已達上限。
- 請記住，精確提醒會被承諾擷取略過，應改為出現在[排程任務](/zh-TW/automation/cron-jobs)下。

## 相關

- [記憶概觀](/zh-TW/concepts/memory)
- [Active memory](/zh-TW/concepts/active-memory)
- [Heartbeat](/zh-TW/gateway/heartbeat)
- [排程任務](/zh-TW/automation/cron-jobs)
- [`openclaw commitments`](/zh-TW/cli/commitments)
- [設定參考](/zh-TW/gateway/configuration-reference#commitments)

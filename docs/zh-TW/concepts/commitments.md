---
read_when:
    - 你想讓 OpenClaw 記住自然的後續提問
    - 您想了解推斷的報到與提醒有何不同
    - 你想要檢視或解除後續承諾事項
sidebarTitle: Commitments
summary: 針對非精確提醒的例行確認所推斷出的後續記憶
title: 推斷出的承諾事項
x-i18n:
    generated_at: "2026-04-30T02:58:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f51af0ac2c9841258fbeeb8f2f98dba6f438b8e0c9433f601a0504d6ef27111
    source_path: concepts/commitments.md
    workflow: 16
---

承諾是短期存在的後續記憶。啟用後，OpenClaw 可以
注意到某段對話建立了未來回訪的機會，並記得
稍後再提出。

範例：

- 你提到明天有面試。OpenClaw 之後可能會回訪。
- 你說你很疲憊。OpenClaw 稍後可能會詢問你是否睡了覺。
- 代理說它會在某件事改變後跟進。OpenClaw 可能會追蹤
  這個未閉合循環。

承諾不是像 `MEMORY.md` 那樣的持久事實，也不是精確的
提醒。它們位於記憶與自動化之間：OpenClaw 會記住一個
受對話約束的義務，然後由 Heartbeat 在到期時送達。

## 啟用承諾

承諾預設為關閉。在設定中啟用：

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

`commitments.maxPerDay` 會限制每個代理工作階段在滾動一天內
可送達的推論後續追蹤數量。預設值為 `3`。

## 運作方式

在代理回覆後，OpenClaw 可能會在獨立脈絡中執行隱藏的背景
擷取流程。該流程只尋找推論出的後續承諾。它不會寫入可見
對話，也不會要求主要代理推理擷取結果。

當它找到高信心候選項時，OpenClaw 會儲存一項承諾，其中包含：

- 代理 ID
- 工作階段金鑰
- 原始頻道與送達目標
- 到期時間範圍
- 簡短的建議回訪內容
- 足夠的來源脈絡，供 Heartbeat 判斷是否送出

送達透過 Heartbeat 進行。當承諾到期時，Heartbeat 會將該承諾
加入同一代理與頻道範圍的 Heartbeat 回合。模型可以送出一則
自然的回訪，或回覆 `HEARTBEAT_OK` 來略過。

OpenClaw 絕不會在寫入推論承諾後立即送達。到期時間會被限制為
至少在承諾建立後的一個 Heartbeat 間隔之後，因此後續追蹤不會在
被推論出的同一刻回響回來。

## 範圍

承諾的範圍限定在建立時的精確代理與頻道脈絡中。在 Discord 與
某個代理對話時推論出的後續追蹤，不會由另一個代理、另一個頻道
或無關的工作階段送達。

這個範圍是此功能的一部分。自然回訪應該感覺像同一段對話的延續，
而不是全域提醒系統。

## 承諾與提醒

| 需求                                            | 使用                                      |
| ----------------------------------------------- | ---------------------------------------- |
| "下午 3 點提醒我"                              | [排程工作](/zh-TW/automation/cron-jobs) |
| "20 分鐘後提醒我"                              | [排程工作](/zh-TW/automation/cron-jobs) |
| "每個工作日執行這份報告"                       | [排程工作](/zh-TW/automation/cron-jobs) |
| "我明天有面試"                                 | 承諾                              |
| "我整晚沒睡"                                   | 承諾                              |
| "如果我沒有回覆這個開放討論串就跟進"           | 承諾                              |

精確的使用者請求已屬於排程器路徑。承諾只適用於推論出的後續追蹤：
也就是使用者沒有要求提醒，但對話明確建立了有用未來回訪的時刻。

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

## 隱私與成本

承諾擷取會使用一次 LLM 流程，因此啟用後會在符合條件的回合之後
增加背景模型使用量。該流程對使用者可見的對話是隱藏的，但它可以
讀取判斷是否存在後續追蹤所需的近期交流。

已儲存的承諾是本機 OpenClaw 狀態。它們是操作性記憶，不是
長期記憶。使用以下命令停用此功能：

```bash
openclaw config set commitments.enabled false
```

## 疑難排解

如果預期的後續追蹤沒有出現：

- 確認 `commitments.enabled` 為 `true`。
- 檢查 `openclaw commitments --all`，查看待處理、已略過、已延後或已過期的
  記錄。
- 確保代理的 Heartbeat 正在執行。
- 檢查該代理工作階段是否已達到 `commitments.maxPerDay`。
- 請記住，精確提醒會被承諾擷取略過，並且應改為出現在
  [排程工作](/zh-TW/automation/cron-jobs) 下。

## 相關

- [記憶概觀](/zh-TW/concepts/memory)
- [Active Memory](/zh-TW/concepts/active-memory)
- [Heartbeat](/zh-TW/gateway/heartbeat)
- [排程工作](/zh-TW/automation/cron-jobs)
- [`openclaw commitments`](/zh-TW/cli/commitments)
- [設定參考](/zh-TW/gateway/configuration-reference#commitments)

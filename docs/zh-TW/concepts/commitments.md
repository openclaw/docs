---
read_when:
    - 你希望 OpenClaw 記住自然的後續提問
    - 你想了解推斷的簽到與提醒有何不同
    - 你想要檢閱或駁回後續承諾
sidebarTitle: Commitments
summary: 推斷用於非精確提醒事項簽到的後續記憶
title: 推斷出的承諾
x-i18n:
    generated_at: "2026-07-05T11:12:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4708cd337c7755a4f16e14154050dc43b6033e71bfda9de5e8fdaa9c6ce0277
    source_path: concepts/commitments.md
    workflow: 16
---

承諾事項是短期的後續追蹤記憶。啟用後，OpenClaw 可以
注意到對話產生了未來追蹤確認的機會，並記住稍後再提出。

範例：

- 你提到明天有面試。OpenClaw 可能會在事後追蹤確認。
- 你說你很疲憊。OpenClaw 可能稍後詢問你是否有睡覺。
- 代理表示會在某件事變化後跟進。OpenClaw 可能會追蹤
  那個未完成的循環。

承諾事項不是像 `MEMORY.md` 那樣的持久事實，也不是精確的
提醒。它們介於記憶和自動化之間：OpenClaw 記住一個
與對話綁定的義務，然後由心跳偵測在到期時送出。

## 啟用承諾事項

承諾事項預設關閉（`commitments.enabled: false`）。在設定中啟用：

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

`commitments.maxPerDay` 限制每個代理工作階段在滾動一天內可以送出的
推斷後續追蹤數量。預設值是 `3`。

## 運作方式

在代理回覆後，OpenClaw 可能會在單獨的上下文中執行隱藏的背景擷取階段，
並停用工具。該階段只會尋找推斷出的後續追蹤承諾事項。它
不會寫入可見對話，也不會要求主要代理
推理擷取結果。

當找到高信心候選項目時，OpenClaw 會儲存一個承諾事項，其中包含：

- 代理 ID
- 工作階段金鑰
- 原始頻道和傳送目標
- 到期時間範圍
- 簡短的建議追蹤確認
- 供心跳偵測判斷是否送出的非指令性中繼資料

傳送會透過心跳偵測進行。當承諾事項到期時，心跳偵測
會把該承諾事項加入同一代理與頻道範圍的心跳偵測回合。
提示會明確警告承諾事項中繼資料不可信，並指示
模型不要遵循其中的指令，也不要因此使用工具。
模型可以送出一則自然的追蹤確認，或回覆 `HEARTBEAT_OK` 來略過。
如果心跳偵測設定為 `target: "none"`，到期的承諾事項會保持在
內部，不會送出外部追蹤確認。承諾事項傳送提示不會
重播原始對話文字，只會包含建議的追蹤確認和
中繼資料，而且到期承諾事項的心跳偵測回合會在沒有 OpenClaw 工具的情況下執行。

OpenClaw 絕不會在寫入推斷承諾事項後立即傳送。
到期時間會被限制為至少在承諾事項建立後的一個心跳偵測間隔之後，
因此後續追蹤不會在剛被推斷出的同一刻立刻回傳。

## 範圍

承諾事項的範圍限於建立它們時的確切代理和頻道上下文。
在 Discord 中與某個代理交談時推斷出的後續追蹤，不會
由另一個代理、另一個頻道或不相關的工作階段傳送。

這個範圍是此功能的一部分。自然的追蹤確認應該感覺像同一段
對話的延續，而不是全域提醒系統。

## 承諾事項與提醒

| 需求                                            | 使用                                     |
| ----------------------------------------------- | ---------------------------------------- |
| "下午 3 點提醒我"                              | [排程任務](/zh-TW/automation/cron-jobs) |
| "20 分鐘後提醒我"                              | [排程任務](/zh-TW/automation/cron-jobs) |
| "每個工作日執行這份報告"                       | [排程任務](/zh-TW/automation/cron-jobs) |
| "我明天有面試"                                 | 承諾事項                              |
| "我整晚沒睡"                                   | 承諾事項                              |
| "如果我沒有回覆這個未完成討論串就跟進"         | 承諾事項                              |

精確的使用者請求本來就屬於排程器路徑。承諾事項只
適用於推斷出的後續追蹤：也就是使用者沒有要求提醒，
但對話明確產生了有用未來追蹤確認的時刻。

## 管理承諾事項

使用命令列介面檢查並清除已儲存的承諾事項：

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

完整命令參考請見 [`openclaw commitments`](/zh-TW/cli/commitments)。

## 隱私與成本

承諾事項擷取會使用一次 LLM 處理階段，因此啟用後會在符合條件的回合後
增加背景模型用量。該階段會從使用者可見的
對話中隱藏，但它可以讀取判斷是否存在後續追蹤所需的
近期交流。

儲存的承諾事項是本機 OpenClaw 狀態。它們是操作性記憶，而不是
長期記憶。使用以下方式停用此功能：

```bash
openclaw config set commitments.enabled false
```

## 疑難排解

如果預期的後續追蹤沒有出現：

- 確認 `commitments.enabled` 是 `true`。
- 檢查 `openclaw commitments --all` 是否有待處理、已略過、已延後或已過期的
  記錄。
- 確認該代理的心跳偵測正在執行。
- 檢查 `commitments.maxPerDay` 是否已在該
  代理工作階段達到上限。
- 請記住，精確提醒會被承諾事項擷取略過，並應該
  改為出現在[排程任務](/zh-TW/automation/cron-jobs)下。

## 相關

- [記憶總覽](/zh-TW/concepts/memory)
- [主動記憶](/zh-TW/concepts/active-memory)
- [心跳偵測](/zh-TW/gateway/heartbeat)
- [排程任務](/zh-TW/automation/cron-jobs)
- [`openclaw commitments`](/zh-TW/cli/commitments)
- [設定參考](/zh-TW/gateway/configuration-reference#commitments)

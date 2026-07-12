---
read_when:
    - 你希望 OpenClaw 能記住自然的後續對話
    - 您想了解推斷式報到與提醒有何不同
    - 您想要檢視或取消後續承諾
sidebarTitle: Commitments
summary: 針對非精確提醒的確認聯絡所推斷出的後續記憶
title: 推定的承諾
x-i18n:
    generated_at: "2026-07-11T21:16:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4708cd337c7755a4f16e14154050dc43b6033e71bfda9de5e8fdaa9c6ce0277
    source_path: concepts/commitments.md
    workflow: 16
---

承諾是短期存在的後續記憶。啟用後，OpenClaw 可以察覺對話中產生了日後關心的契機，並記住稍後再提出。

範例：

- 你提到明天有面試。OpenClaw 可能會在面試後關心情況。
- 你說自己筋疲力盡。OpenClaw 可能稍後詢問你是否有睡覺。
- 代理程式表示會在某件事發生變化後跟進。OpenClaw 可能會追蹤這個尚未完成的事項。

承諾不是像 `MEMORY.md` 那樣的持久事實，也不是精確的提醒。它介於記憶與自動化之間：OpenClaw 會記住與對話相關的待辦承諾，然後在到期時透過心跳偵測送達。

## 啟用承諾

承諾預設為關閉（`commitments.enabled: false`）。請在設定中啟用：

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

`commitments.maxPerDay` 限制每個代理程式工作階段在滾動計算的一天內，最多可以送達多少個推斷出的後續事項。預設值為 `3`。

## 運作方式

代理程式回覆後，OpenClaw 可能會在獨立的上下文中執行隱藏的背景擷取流程，並停用工具。該流程只會尋找推斷出的後續承諾，不會寫入可見的對話，也不會要求主要代理程式對擷取結果進行推理。

找到可信度高的候選項目時，OpenClaw 會儲存一項承諾，其中包含：

- 代理程式 ID
- 工作階段金鑰
- 原始頻道與傳送目標
- 到期時間範圍
- 簡短的建議關心內容
- 供心跳偵測判斷是否傳送的非指令性中繼資料

傳送作業會透過心跳偵測進行。承諾到期時，心跳偵測會將該承諾加入同一代理程式與頻道範圍的心跳偵測回合。提示會明確警告承諾中繼資料不受信任，並指示模型不要遵循其中的指令，也不要因此使用工具。模型可以傳送一則自然的關心訊息，或回覆 `HEARTBEAT_OK` 將其忽略。如果心跳偵測設定了 `target: "none"`，到期的承諾會保留在內部，不會對外傳送關心訊息。承諾傳送提示不會重播原始對話文字，只會包含建議的關心內容與中繼資料；到期承諾的心跳偵測回合也不會使用 OpenClaw 工具。

OpenClaw 絕不會在寫入推斷出的承諾後立即傳送。到期時間會限制為承諾建立後至少經過一個心跳偵測間隔，因此後續訊息不會在剛推斷出的同一時刻立即回傳。

## 範圍

承諾的範圍限定於建立承諾時的確切代理程式與頻道上下文。在 Discord 中與某個代理程式交談時推斷出的後續事項，不會由其他代理程式、其他頻道或不相關的工作階段傳送。

這種範圍限制是此功能的一部分。自然的關心應讓人感覺像是同一段對話的延續，而不是全域提醒系統。

## 承諾與提醒的差異

| 需求                                            | 使用                                     |
| ----------------------------------------------- | ---------------------------------------- |
| 「下午 3 點提醒我」                             | [排程工作](/zh-TW/automation/cron-jobs)        |
| 「20 分鐘後通知我」                             | [排程工作](/zh-TW/automation/cron-jobs)        |
| 「每個工作日執行這份報告」                      | [排程工作](/zh-TW/automation/cron-jobs)        |
| 「我明天有面試」                                | 承諾                                     |
| 「我整晚都沒睡」                                | 承諾                                     |
| 「如果我沒有回覆這個未結討論串，請跟進」        | 承諾                                     |

使用者的明確要求原本就應由排程器處理。承諾只適用於推斷出的後續事項：也就是使用者並未要求提醒，但對話明確產生了日後關心的有用契機。

## 管理承諾

使用命令列介面檢查及清除已儲存的承諾：

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

如需完整的命令參考，請參閱 [`openclaw commitments`](/zh-TW/cli/commitments)。

## 隱私權與成本

承諾擷取會使用一次大型語言模型處理流程，因此啟用此功能後，會在符合條件的回合結束後增加背景模型用量。該流程不會顯示在使用者可見的對話中，但可以讀取判斷是否存在後續事項所需的近期對話內容。

儲存的承諾是 OpenClaw 的本機狀態。它們屬於操作記憶，而非長期記憶。使用以下指令停用此功能：

```bash
openclaw config set commitments.enabled false
```

## 疑難排解

如果預期的後續事項沒有出現：

- 確認 `commitments.enabled` 為 `true`。
- 使用 `openclaw commitments --all` 檢查待處理、已忽略、已延後或已過期的記錄。
- 確認該代理程式的心跳偵測正在執行。
- 檢查該代理程式工作階段是否已達到 `commitments.maxPerDay` 的上限。
- 請記住，承諾擷取會略過精確提醒；這類提醒應改為顯示在[排程工作](/zh-TW/automation/cron-jobs)中。

## 相關內容

- [記憶概覽](/zh-TW/concepts/memory)
- [主動記憶](/zh-TW/concepts/active-memory)
- [心跳偵測](/zh-TW/gateway/heartbeat)
- [排程工作](/zh-TW/automation/cron-jobs)
- [`openclaw commitments`](/zh-TW/cli/commitments)
- [設定參考](/zh-TW/gateway/configuration-reference#commitments)

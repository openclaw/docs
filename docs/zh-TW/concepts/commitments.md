---
read_when:
    - 你希望 OpenClaw 能記住自然的後續對話
    - 你想了解推斷的簽到與提醒有何不同
    - 你想要檢視或解除後續承諾
sidebarTitle: Commitments
summary: 針對非精確提醒的簽到，推斷出的後續記憶
title: 推斷的承諾
x-i18n:
    generated_at: "2026-07-16T11:31:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4fa3a3654b628b63c5319144d63f122db53fff7170a0c8339e2c5a1147961e35
    source_path: concepts/commitments.md
    workflow: 16
---

承諾是短期的後續記憶。啟用後，OpenClaw 可以
察覺對話產生了未來適合關心的時機，並記住在稍後
再次提起。

範例：

- 你提到明天有一場面試。OpenClaw 之後可能會關心面試結果。
- 你說自己筋疲力盡。OpenClaw 稍後可能會詢問你是否有睡覺。
- 代理程式表示會在某件事發生變化後跟進。OpenClaw 可能會追蹤
  這個尚未完成的事項。

承諾不是像 `MEMORY.md` 這類持久事實，也不是精確的
提醒。它們介於記憶與自動化之間：OpenClaw 會記住一項
與對話相關的義務，然後由心跳偵測在到期時傳送。

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

`commitments.maxPerDay` 限制每個代理程式工作階段在滾動的一天內可傳送的推斷後續事項
數量。預設值為 `3`。

## 運作方式

代理程式回覆後，OpenClaw 可能會在獨立的情境中執行隱藏的背景擷取程序，
且停用工具。該程序只會尋找推斷出的後續承諾。它
不會寫入可見對話，也不會要求主要代理程式
對擷取作業進行推理。

找到高信心的候選項目時，OpenClaw 會儲存一項承諾，其中包含：

- 代理程式 ID
- 工作階段金鑰
- 原始頻道與傳送目標
- 到期時間範圍
- 簡短的建議關心訊息
- 供心跳偵測判斷是否傳送的非指令性中繼資料

傳送會透過心跳偵測進行。承諾到期時，心跳偵測會將承諾
加入同一代理程式與頻道範圍的心跳偵測回合中。
提示會明確警告承諾中繼資料不可信任，並指示
模型不得遵循其中的指令，或因為其中的內容而使用工具。
模型可以傳送一則自然的關心訊息，或回覆 `HEARTBEAT_OK` 將其略過。
如果心跳偵測設定為 `target: "none"`，到期的承諾會維持
在內部，不會傳送外部關心訊息。承諾傳送提示不會
重播原始對話文字，只會包含建議的關心訊息與
中繼資料，而且到期承諾的心跳偵測回合不會使用 OpenClaw 工具。

OpenClaw 絕不會在寫入推斷出的承諾後立即傳送它。
到期時間至少會限制為承諾建立後的一個心跳偵測間隔，
因此後續訊息不會在推斷出的同一時刻立即重複回傳。

## 範圍

承諾的範圍限定為建立承諾時所處的確切代理程式與頻道情境。
在 Discord 中與某個代理程式交談時推斷出的後續事項，不會
由另一個代理程式、另一個頻道或不相關的工作階段傳送。

此範圍是這項功能的一部分。自然的關心訊息應讓人感覺像是同一段
對話的延續，而不是全域提醒系統。

## 承諾與提醒的比較

| 需求                                            | 使用方式                                 |
| ----------------------------------------------- | ---------------------------------------- |
| “下午 3 點提醒我”                               | [排程工作](/zh-TW/automation/cron-jobs) |
| “20 分鐘後通知我”                               | [排程工作](/zh-TW/automation/cron-jobs) |
| “每個工作日執行這份報告”                       | [排程工作](/zh-TW/automation/cron-jobs) |
| “我明天有一場面試”                              | 承諾                              |
| “我整晚都沒睡”                                  | 承諾                              |
| “如果我沒有回覆這個未結討論串，請跟進”          | 承諾                              |

使用者的明確要求本來就屬於排程器路徑。承諾僅適用於
推斷出的後續事項：使用者未要求提醒，
但對話明確產生了未來值得關心的時機。

## 管理承諾

使用命令列介面檢查及清除已儲存的承諾：

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

完整的命令參考請參閱 [`openclaw commitments`](/zh-TW/cli/commitments)。

## 隱私權與成本

承諾擷取會使用一次 LLM 程序，因此啟用後會在符合條件的回合結束後
增加背景模型用量。該程序不會顯示在使用者可見的
對話中，但可以讀取判斷是否存在後續事項所需的近期對話。

儲存的承諾是共用 SQLite 狀態資料庫中的本機 OpenClaw
操作記憶，而不是長期記憶。使用以下指令停用此功能：

```bash
openclaw config set commitments.enabled false
```

## 疑難排解

如果預期的後續事項沒有出現：

- 確認 `commitments.enabled` 為 `true`。
- 檢查 `openclaw commitments --all` 中是否有待處理、已略過、已延後或已過期的
  記錄。
- 確保該代理程式的心跳偵測正在執行。
- 檢查該代理程式工作階段是否已達到 `commitments.maxPerDay`。
- 請記住，承諾擷取會略過精確提醒，這些提醒應改為顯示在
  [排程工作](/zh-TW/automation/cron-jobs)中。

## 相關內容

- [記憶概覽](/zh-TW/concepts/memory)
- [主動記憶](/zh-TW/concepts/active-memory)
- [心跳偵測](/zh-TW/gateway/heartbeat)
- [排程工作](/zh-TW/automation/cron-jobs)
- [`openclaw commitments`](/zh-TW/cli/commitments)
- [設定參考](/zh-TW/gateway/configuration-reference#commitments)

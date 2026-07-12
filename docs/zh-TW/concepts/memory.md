---
read_when:
    - 你想了解記憶的運作方式
    - 你想知道該寫入哪些記憶檔案
summary: OpenClaw 如何跨工作階段記住資訊
title: 記憶體概覽
x-i18n:
    generated_at: "2026-07-11T21:15:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c77d71dd6b1916b923fbf72c373f20128c4f604f96cc76150ea27e0f13a541f8
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw 會透過在代理程式的工作區（預設為 `~/.openclaw/workspace`）中寫入純 Markdown 檔案來記住資訊。模型只會記得儲存到磁碟的內容；不存在隱藏狀態。

## 運作方式

你的代理程式有三種與記憶相關的檔案：

- **`MEMORY.md`** — 長期記憶。持久保存的事實、偏好與決策。會在工作階段開始時載入。
- **`memory/YYYY-MM-DD.md`**（或 `memory/YYYY-MM-DD-<slug>.md`）— 每日筆記。持續累積的情境與觀察。在未附帶其他內容的 `/new` 或 `/reset` 中，系統會自動載入今天與昨天的日期筆記；包含識別名稱的變體（例如由內建工作階段記憶鉤子寫入的檔案）也會與僅含日期的檔案一併載入。
- **`DREAMS.md`**（選用）— 供人工檢閱的夢境日誌與夢境整理摘要，包括以事實為依據的歷史回填項目。

<Tip>
如果你希望代理程式記住某件事，只要告訴它：「記住我偏好 TypeScript。」它就會將筆記寫入適當的檔案。
</Tip>

## 各類資訊的存放位置

`MEMORY.md` 是精簡且經過整理的層級：包含應在工作階段開始時可用的持久事實、偏好、常設決策與簡短摘要。它不是原始逐字記錄、每日紀錄或完整封存檔。

`memory/YYYY-MM-DD.md` 檔案是工作層級：包含詳細的每日筆記、觀察、工作階段摘要，以及日後可能仍有用的原始情境。這些內容會建立索引供 `memory_search` 與 `memory_get` 使用，但不會在每一輪對話中注入啟動提示。

隨著時間推移，代理程式會從每日筆記中提煉有用內容放入 `MEMORY.md`，並移除過時的長期項目。產生的工作區指示與心跳偵測流程會定期執行這項工作；你不需要為每個細節手動編輯 `MEMORY.md`。

如果 `MEMORY.md` 超出啟動檔案預算，OpenClaw 會完整保留磁碟上的檔案，但會截斷注入情境的副本。請將此視為一個訊號：將詳細內容移至 `memory/*.md`、在 `MEMORY.md` 中僅保留持久摘要，或在你願意使用更多提示預算時提高啟動限制。使用 `/context list`、`/context detail` 或 `openclaw doctor` 可查看原始大小、注入大小與截斷狀態。

## 對動作敏感的記憶

大多數記憶都是一般 Markdown 筆記。有些記憶會影響代理程式日後應採取的行動；對於這類記憶，除了事實本身，也應記錄何時可以安全地依據該筆記採取行動。

當筆記涉及以下事項時，請記錄其行動界線：

- 核准或權限要求，
- 暫時性限制，
- 移交給另一個工作階段、討論串或人員，
- 到期條件，
- 可安全行動的時機，
- 來源或擁有者的權限，
- 避免採取某個看似誘人行動的指示。

實用的對動作敏感記憶會明確指出：

- 什麼會改變未來的行為，
- 它在何時或哪些條件下適用，
- 它何時到期，或什麼條件會解除行動限制，
- 代理程式應避免做什麼，
- 如果來源或擁有者會影響信任或權限，應指出其身分。

記憶可以保存核准情境，但不會強制執行政策。請使用 OpenClaw 的核准設定、沙箱機制與排程任務來實施嚴格的操作控制。

範例：

```md
API 遷移正在另一個工作階段中設計。未來的對話輪次不應從此討論串編輯 API 實作；在遷移計畫完成前，僅將此處的發現作為設計輸入。
```

另一個範例：

```md
來自不受信任來源的報告必須先經過檢閱，才能提升其地位。未來的對話輪次應僅將其視為證據；在受信任的檢閱者確認內容前，不要將其儲存為持久記憶。
```

這並非每筆記憶都必須遵循的結構；簡單事實可以維持精簡。若遺失時機、權限、到期條件或可安全行動的情境，可能導致代理程式日後採取錯誤行動，請使用對動作敏感的界線。

推斷得出且短期有效的後續事項，請使用[承諾事項](/zh-TW/concepts/commitments)。精確提醒、定時檢查與週期性工作，請使用[排程任務](/zh-TW/automation/cron-jobs)。記憶仍可概述任一路徑相關的持久情境。

## 推斷出的承諾事項

有些未來的後續事項並非持久事實。如果你提到明天有面試，實用的記憶可能是「面試後關心進展」，而不是「永遠將此資訊儲存在 `MEMORY.md` 中」。

[承諾事項](/zh-TW/concepts/commitments)是針對這類情況的選用短期後續記憶。OpenClaw 會在隱藏的背景處理階段推斷這些事項，將其範圍限定於相同的代理程式與頻道，並透過心跳偵測傳送到期的關心訊息。明確指定的提醒仍使用[排程任務](/zh-TW/automation/cron-jobs)。

## 記憶工具

代理程式有兩個用於處理記憶的工具：

- **`memory_search`** — 使用語意搜尋尋找相關筆記，即使用詞與原文不同也能找到。
- **`memory_get`** — 讀取特定記憶檔案或行範圍。

這兩個工具都由作用中的記憶外掛提供（預設為 `memory-core`）。

## 記憶搜尋

設定嵌入向量提供者後，`memory_search` 會使用混合搜尋：將向量相似度（語意）與關鍵字比對（ID 和程式碼符號等精確詞彙）結合。只要具有任何受支援提供者的 API 金鑰，即可立即使用。

<Info>
OpenClaw 預設使用 OpenAI 嵌入向量。若要使用 Gemini、Voyage、Mistral、Bedrock、DeepInfra、本機 GGUF、Ollama、LM Studio、GitHub Copilot 或通用的 OpenAI 相容端點，請明確設定 `agents.defaults.memorySearch.provider`。
</Info>

如需瞭解搜尋的運作方式、調校選項與提供者設定，請參閱[記憶搜尋](/zh-TW/concepts/memory-search)。

## 記憶後端

<CardGroup cols={3}>
<Card title="內建（預設）" icon="database" href="/zh-TW/concepts/memory-builtin">
以 SQLite 為基礎。無須額外設定即可使用關鍵字搜尋、向量相似度與混合搜尋。不需要額外相依套件。
</Card>
<Card title="QMD" icon="search" href="/zh-TW/concepts/memory-qmd">
本機優先的輔助程序，提供重新排序、查詢擴展，以及為工作區外目錄建立索引的能力。
</Card>
<Card title="Honcho" icon="brain" href="/zh-TW/concepts/memory-honcho">
具備使用者建模、語意搜尋與多代理程式感知能力的 AI 原生跨工作階段記憶。需安裝外掛。
</Card>
<Card title="LanceDB" icon="layers" href="/zh-TW/plugins/memory-lancedb">
以 LanceDB 為基礎的記憶，具備 OpenAI 相容嵌入向量、自動回憶、自動擷取，以及本機 Ollama 嵌入向量支援。需安裝外掛。
</Card>
</CardGroup>

## 知識 Wiki 層

如果你希望持久記憶的運作方式更接近有人維護的知識庫，而不是原始筆記，請使用內建的 `memory-wiki` 外掛。它會將持久知識編譯成 Wiki 儲存庫，提供確定性的頁面結構、結構化主張與證據、矛盾與新鮮度追蹤、產生的儀表板、編譯後的摘要，以及 Wiki 原生工具（`wiki_status`、`wiki_search`、`wiki_get`、`wiki_apply`、`wiki_lint`）。

`memory-wiki` 不會取代作用中的記憶外掛；回憶、提升與夢境整理仍由作用中的記憶外掛負責。`memory-wiki` 會在其旁加入一個包含豐富來源資訊的知識層。

<CardGroup cols={1}>
<Card title="記憶 Wiki" icon="book" href="/zh-TW/plugins/memory-wiki">
將持久記憶編譯成包含豐富來源資訊的 Wiki 儲存庫，並提供主張、儀表板、橋接模式與適用於 Obsidian 的工作流程。
</Card>
</CardGroup>

## 自動清理記憶

在[壓縮](/zh-TW/concepts/compaction)摘要對話之前，OpenClaw 會執行一輪無提示處理，提醒代理程式將重要情境儲存至記憶檔案。此功能預設啟用；設定 `agents.defaults.compaction.memoryFlush.enabled: false` 可將其停用。

若要讓該整理輪次使用本機模型，請設定只套用於記憶清理輪次的精確覆寫（它不會繼承作用中工作階段的模型後援鏈）：

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

<Tip>
記憶清理可防止壓縮期間遺失情境。如果代理程式在對話中取得尚未寫入檔案的重要事實，系統會在產生摘要前自動儲存這些內容。
</Tip>

## 夢境整理

夢境整理是一個選用的背景記憶整合處理階段。它會收集短期回憶訊號、為候選項目評分，並僅將符合條件的項目提升至長期記憶（`MEMORY.md`）：

- **選用**：預設停用。
- **排程執行**：啟用後，`memory-core` 會自動管理一項週期性的排程工作，以執行完整的夢境整理。
- **設定門檻**：提升項目必須通過分數、回憶頻率與查詢多樣性門檻。
- **可供檢閱**：階段摘要與日誌項目會寫入 `DREAMS.md`，供人工檢閱。

如需瞭解各階段的行為、評分訊號與夢境日誌詳細資訊，請參閱[夢境整理](/zh-TW/concepts/dreaming)。

## 以事實為依據的回填與即時提升

夢境整理系統有兩條相關的檢閱路徑：

- **即時夢境整理**使用 `memory/.dreams/` 下的短期夢境整理儲存區，也是一般深度階段用來決定哪些項目可提升至 `MEMORY.md` 的依據。
- **以事實為依據的回填**會將歷史 `memory/YYYY-MM-DD.md` 筆記作為獨立的每日檔案讀取，並將結構化檢閱輸出寫入 `DREAMS.md`。

以事實為依據的回填可用來重播較舊的筆記，並在不手動編輯 `MEMORY.md` 的情況下，檢查系統認為哪些內容具有持久性。

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

`--stage-short-term` 旗標會將以事實為依據的持久候選項目暫存到一般深度階段已使用的同一個短期夢境整理儲存區；它不會直接提升這些項目。因此：

- `DREAMS.md` 仍是供人工檢閱的介面。
- 短期儲存區仍是面向機器的排序介面。
- `MEMORY.md` 仍只會由深度提升程序寫入。

若要復原重播，且不影響一般日誌項目或正常的回憶狀態：

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## 命令列介面

```bash
openclaw memory status          # 檢查索引狀態與提供者
openclaw memory search "query"  # 從命令列搜尋
openclaw memory index --force   # 重建索引
```

## 延伸閱讀

- [記憶搜尋](/zh-TW/concepts/memory-search)：搜尋管線、提供者與調校。
- [內建記憶引擎](/zh-TW/concepts/memory-builtin)：預設的 SQLite 後端。
- [QMD 記憶引擎](/zh-TW/concepts/memory-qmd)：進階的本機優先輔助程序。
- [Honcho 記憶](/zh-TW/concepts/memory-honcho)：AI 原生跨工作階段記憶。
- [LanceDB 記憶](/zh-TW/plugins/memory-lancedb)：使用 OpenAI 相容嵌入向量、以 LanceDB 為基礎的外掛。
- [記憶 Wiki](/zh-TW/plugins/memory-wiki)：編譯式知識儲存庫與 Wiki 原生工具。
- [夢境整理](/zh-TW/concepts/dreaming)：將短期回憶在背景提升為長期記憶。
- [記憶設定參考](/zh-TW/reference/memory-config)：所有設定選項。
- [壓縮](/zh-TW/concepts/compaction)：壓縮與記憶的互動方式。
- [主動記憶](/zh-TW/concepts/active-memory)：互動式聊天工作階段的子代理程式記憶。

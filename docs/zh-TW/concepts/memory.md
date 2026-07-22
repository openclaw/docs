---
read_when:
    - 你想瞭解記憶的運作方式
    - 你想知道要寫入哪些記憶檔案
summary: OpenClaw 如何跨工作階段記住資訊
title: 記憶概覽
x-i18n:
    generated_at: "2026-07-22T10:30:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cdfd5276d6289a4ee38b5203eb5443312c4b040d4ea67abe4a9c579703136339
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw 會將內容寫入代理程式工作區中的純 Markdown 檔案（預設為 `~/.openclaw/workspace`），藉此記住資訊。模型只會記住儲存到磁碟的內容；沒有隱藏狀態。

## 運作方式

你的代理程式有三個記憶相關檔案：

- **`MEMORY.md`** — 長期記憶。持久保存的事實、偏好和決策。於工作階段開始時載入。
- **`memory/YYYY-MM-DD.md`**（或 `memory/YYYY-MM-DD-<slug>.md`）— 每日筆記。
  持續累積的脈絡和觀察。在單純使用 `/new` 或 `/reset` 時，今天和昨天帶日期的筆記會自動載入；帶有短名稱的變體（例如內建工作階段記憶鉤子所寫入的檔案）也會與僅含日期的檔案一併納入。
- **`DREAMS.md`**（選用）— 供人工審閱的夢境日誌與夢境整理摘要，包括以事實為依據的歷史回填項目。

<Tip>
如果你想讓代理程式記住某件事，只要告訴它：“記住我偏好 TypeScript。”它就會將筆記寫入適當的檔案。
</Tip>

## 各類內容的存放位置

`MEMORY.md` 是精簡且經過整理的層級：持久保存的事實、偏好、常設決策，以及應於工作階段開始時可用的簡短摘要。它不是原始逐字稿、每日日誌或完整封存檔。

`memory/YYYY-MM-DD.md` 檔案是工作層級：詳細的每日筆記、觀察、工作階段摘要，以及之後可能仍有用的原始脈絡。這些檔案會建立索引以供 `memory_search` 和 `memory_get` 使用，但不會在每一輪都注入啟動提示詞。

隨著時間推移，代理程式會從每日筆記中提煉有用內容並寫入 `MEMORY.md`，同時移除過時的長期項目。產生的工作區指示和心跳偵測流程會定期執行此作業；你不需要為每個細節手動編輯 `MEMORY.md`。

如果 `MEMORY.md` 超過啟動檔案預算，OpenClaw 會完整保留磁碟上的檔案，但截斷注入脈絡的副本。這表示你應將詳細內容移至 `memory/*.md`，在 `MEMORY.md` 中只保留持久摘要；如果願意使用更多提示詞預算，也可以提高啟動限制。使用 `/context list`、`/context detail` 或 `openclaw doctor` 可查看原始大小、注入大小及截斷狀態。

## 從程式設計助理匯入

控制介面可從 Codex 和 Claude Code 匯入現有的本機記憶。
開啟 **Settings** → **Import Memory**，選擇目的地代理程式、檢閱偵測到的檔案，然後確認匯入。OpenClaw 僅複製 Markdown 記憶：

- Codex：位於 `~/.codex/memories`（或 `CODEX_HOME/memories`）下整併後的 `MEMORY.md` 和 `memory_summary.md` 檔案。不會匯入原始執行記錄和逐字稿檔案。
- Claude Code：每個專案在 `~/.claude/projects/*/memory` 下的自動記憶目錄內之 Markdown 檔案，以及存在時由使用者設定的 `autoMemoryDirectory`。專案指示、工作階段、設定和認證資訊不屬於這項僅限記憶的動作。

匯入的檔案會分別保留在所選代理程式工作區的 `memory/imports/codex/` 和 `memory/imports/claude-code/` 下。系統會為它們建立索引以供 `memory_search` 使用，並可透過 `memory_get` 存取；它們不會合併至代理程式的啟動 `MEMORY.md`。來源檔案不會變更。

預覽會標示目的地衝突。啟用 **Replace existing imports** 可取代這些檔案；套用時會建立經驗證的匯入前備份，並在遷移報告中保留被覆寫檔案的逐項副本。

## 動作敏感型記憶

大多數記憶都是一般 Markdown 筆記。有些記憶會影響代理程式之後應採取的動作；對於這類記憶，除了事實本身之外，還應記錄何時可以安全地依據該筆記採取動作。

當筆記涉及以下內容時，請記錄該動作界線：

- 核准或權限要求，
- 暫時性限制，
- 移交給其他工作階段、討論串或人員，
- 到期條件，
- 可安全採取動作的時間，
- 來源或擁有者的權限，
- 避免採取某個誘人動作的指示。

實用的動作敏感型記憶會清楚說明：

- 哪些內容會改變未來行為，
- 何時或在什麼條件下適用，
- 何時到期，或什麼情況會解除動作限制，
- 代理程式應避免做什麼，
- 來源或擁有者是誰（如果這會影響信任或權限）。

記憶可以保留核准脈絡，但不會強制執行政策。若需嚴格的作業控制，請使用 OpenClaw 核准設定、沙箱和排程工作。

範例：

```md
API 遷移正在另一個工作階段中設計。未來的輪次不應從此討論串編輯
API 實作；在遷移計畫確定之前，這裡的發現只能作為設計輸入。
```

另一個範例：

```md
來自不受信任來源的報告需要經過審閱才能提升使用層級。未來的輪次
應僅將其視為證據；在受信任的審閱者確認內容前，不要將其儲存為
持久記憶。
```

這並非每筆記憶都必須遵循的結構；簡單事實可以維持精簡。若遺失時間、權限、到期或可安全採取動作的脈絡，可能導致代理程式日後採取錯誤動作，請使用動作敏感型界線。

如需精確提醒、定時檢查和週期性工作，請使用[排程工作](/zh-TW/automation/cron-jobs)。記憶仍可摘要這些工作周邊的持久脈絡。

## 已停用的推斷承諾

有些未來的後續事項不是持久事實。如果你提到明天有一場面試，有用的記憶可能是“面試後關心進度”，而不是“將此內容永久儲存在 `MEMORY.md` 中”。

推斷承諾實驗已停用。OpenClaw 不再擷取或傳送這些後續事項。請使用[排程工作](/zh-TW/automation/cron-jobs)執行未來動作；舊版 `openclaw commitments` 命令仍可用來檢查或捨棄既有的已儲存資料列。

## 記憶工具

代理程式有兩個處理記憶的工具：

- **`memory_search`** — 使用語意搜尋尋找相關筆記，即使用詞與原文不同也能找到。
- **`memory_get`** — 讀取特定記憶檔案或行範圍。

這兩個工具均由使用中的記憶外掛提供（預設：`memory-core`）。

## 記憶搜尋

設定嵌入提供者後，`memory_search` 會使用混合搜尋：將向量相似度（語意）與關鍵字比對（ID 和程式碼符號等確切詞彙）結合。只要有任何受支援提供者的 API 金鑰，即可直接使用。

<Info>
OpenClaw 預設使用 OpenAI 嵌入。請明確設定 `memory.search.provider`，以使用 Gemini、Voyage、Mistral、Bedrock、DeepInfra、本機 GGUF、Ollama、LM Studio、GitHub Copilot 或一般 OpenAI 相容端點。
</Info>

請參閱[記憶搜尋](/zh-TW/concepts/memory-search)，了解搜尋運作方式、調整選項和提供者設定。

## 記憶後端

<CardGroup cols={3}>
<Card title="內建（預設）" icon="database" href="/zh-TW/concepts/memory-builtin">
以 SQLite 為基礎。開箱即可使用關鍵字搜尋、向量相似度和混合搜尋。不需要額外相依套件。
</Card>
<Card title="QMD" icon="search" href="/zh-TW/concepts/memory-qmd">
本機優先的附屬服務，具備重新排序、查詢擴展，以及為工作區外目錄建立索引的能力。
</Card>
<Card title="Honcho" icon="brain" href="/zh-TW/concepts/memory-honcho">
AI 原生的跨工作階段記憶，具備使用者建模、語意搜尋和多代理程式感知能力。需安裝外掛。
</Card>
<Card title="LanceDB" icon="layers" href="/zh-TW/plugins/memory-lancedb">
由 LanceDB 支援的記憶，具備 OpenAI 相容嵌入、自動回想、自動擷取，以及本機 Ollama 嵌入支援。需安裝外掛。
</Card>
</CardGroup>

## 知識 Wiki 層

如果你希望持久記憶的運作方式更接近有人維護的知識庫，而非原始筆記，請使用內建的 `memory-wiki` 外掛。它會將持久知識編譯為 Wiki 儲存庫，具備確定性的頁面結構、結構化主張與證據、矛盾與時效性追蹤、產生的儀表板、編譯式摘要，以及 Wiki 原生工具（`wiki_status`、`wiki_search`、`wiki_get`、`wiki_apply`、`wiki_lint`）。

`memory-wiki` 不會取代使用中的記憶外掛；使用中的記憶外掛仍負責回想、提升和夢境整理。`memory-wiki` 會在旁新增一個具有豐富來源資訊的知識層。

<CardGroup cols={1}>
<Card title="記憶 Wiki" icon="book" href="/zh-TW/plugins/memory-wiki">
將持久記憶編譯為具有豐富來源資訊的 Wiki 儲存庫，其中包含主張、儀表板、橋接模式，以及適用於 Obsidian 的工作流程。
</Card>
</CardGroup>

## 自動記憶清理

在[壓縮](/zh-TW/concepts/compaction)摘要對話之前，OpenClaw 會執行一個無聲輪次，提醒代理程式將重要脈絡儲存至記憶檔案。此功能預設開啟；設定 `agents.defaults.compaction.memoryFlush.enabled: false` 可將其關閉。

若要讓該維護輪次使用本機模型，請設定僅套用至記憶清理輪次的精確覆寫（它不會繼承使用中工作階段的模型備援鏈）：

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
記憶清理可防止壓縮期間遺失脈絡。如果對話中有尚未寫入檔案的重要事實，代理程式會在產生摘要前自動儲存。
</Tip>

## 夢境整理

夢境整理是選用的背景記憶整併程序。它會收集短期回想訊號、為候選項目評分，並僅將符合資格的項目提升至長期記憶（`MEMORY.md`）：

- **選用啟用**：預設停用。
- **排程執行**：啟用時，`memory-core` 會自動管理一個週期性排程工作，以執行完整的夢境整理程序。
- **門檻控管**：提升項目必須通過分數、回想頻率和查詢多樣性門檻。
- **可審閱**：階段摘要和日誌項目會寫入 `DREAMS.md`，供人工審閱。

請參閱[夢境整理](/zh-TW/concepts/dreaming)，了解各階段行為、評分訊號和夢境日誌詳細資訊。

## 依據事實的回填與即時提升

夢境整理系統有兩個相關的審閱管道：

- **即時夢境整理**會使用 `memory/.dreams/` 下的短期夢境整理儲存區，也是一般深度階段用來決定哪些內容能提升至 `MEMORY.md` 的依據。
- **依據事實的回填**會將歷史 `memory/YYYY-MM-DD.md` 筆記讀取為獨立的每日檔案，並將結構化審閱輸出寫入 `DREAMS.md`。

依據事實的回填適合重新處理較舊的筆記，並檢查系統認為哪些內容值得持久保留，而不需要手動編輯 `MEMORY.md`。

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

`--stage-short-term` 旗標會將依據事實產生的持久候選項目暫存至一般深度階段已在使用的同一個短期夢境整理儲存區；它不會直接提升這些項目。因此：

- `DREAMS.md` 仍是人工審閱介面。
- 短期儲存區仍是供機器使用的排序介面。
- `MEMORY.md` 仍只會由深度提升程序寫入。

若要復原某次重新處理，而不影響一般日誌項目或正常回想狀態：

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## 命令列介面

```bash
openclaw memory status          # 檢查索引狀態和提供者
openclaw memory search "query"  # 從命令列搜尋
openclaw memory index --force   # 重建索引
```

## 延伸閱讀

- [記憶搜尋](/zh-TW/concepts/memory-search)：搜尋流水線、供應商與調校。
- [內建記憶引擎](/zh-TW/concepts/memory-builtin)：預設的 SQLite 後端。
- [QMD 記憶引擎](/zh-TW/concepts/memory-qmd)：進階的本機優先輔助程序。
- [Honcho 記憶](/zh-TW/concepts/memory-honcho)：AI 原生的跨工作階段記憶。
- [Memory LanceDB](/zh-TW/plugins/memory-lancedb)：由 LanceDB 支援的外掛，採用與 OpenAI 相容的嵌入。
- [Memory Wiki](/zh-TW/plugins/memory-wiki)：編譯式知識庫與 Wiki 原生工具。
- [夢境整理](/zh-TW/concepts/dreaming)：在背景將短期回憶提升為長期記憶。
- [記憶設定參考](/zh-TW/reference/memory-config)：所有設定選項。
- [壓縮](/zh-TW/concepts/compaction)：壓縮如何與記憶互動。
- [主動記憶](/zh-TW/concepts/active-memory)：用於互動式聊天工作階段的子代理程式記憶。

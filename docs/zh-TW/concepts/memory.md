---
read_when:
    - 你想了解記憶的運作方式
    - 你想知道要寫入哪些記憶檔案
summary: OpenClaw 如何跨工作階段記住資訊
title: 記憶體概觀
x-i18n:
    generated_at: "2026-07-14T13:38:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 22542c5df22f1602c89bae05760a5418224d8ee1f1a73679203dec9b2f091f2a
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw 會透過在你的代理程式工作區（預設為 `~/.openclaw/workspace`）中寫入純 Markdown 檔案來記住資訊。模型只會記得儲存到磁碟的內容；不存在隱藏狀態。

## 運作方式

你的代理程式有三種與記憶相關的檔案：

- **`MEMORY.md`** — 長期記憶。持久保存的事實、偏好與決策。會在工作階段開始時載入。
- **`memory/YYYY-MM-DD.md`**（或 `memory/YYYY-MM-DD-<slug>.md`）— 每日筆記。
  持續累積的情境與觀察。在單獨使用 `/new` 或 `/reset` 時，今天與昨天按日期命名的筆記會自動載入；包含 slug 的變體（例如由隨附的工作階段記憶鉤子寫入者）也會與僅含日期的檔案一起載入。
- **`DREAMS.md`**（選用）— 供人工檢閱的夢境日誌與夢境整理摘要，包括有依據的歷史回填項目。

<Tip>
如果你希望代理程式記住某件事，只要告訴它：“記住我偏好 TypeScript。”它就會將這則筆記寫入適當的檔案。
</Tip>

## 各類資訊的存放位置

`MEMORY.md` 是精簡且經過整理的層級：持久保存的事實、偏好、既定決策，以及應在工作階段開始時就能取得的簡短摘要。它不是原始對話記錄、每日紀錄或完整封存。

`memory/YYYY-MM-DD.md` 檔案是工作層級：詳細的每日筆記、觀察、工作階段摘要，以及日後可能仍有用的原始情境。這些檔案會建立索引以供 `memory_search` 和 `memory_get` 使用，但不會在每一輪都注入啟動提示詞。

隨著時間推移，代理程式會將每日筆記中的實用內容提煉至 `MEMORY.md`，並移除過時的長期項目。產生的工作區指示與心跳偵測流程會定期執行此作業；你不需要為每項細節手動編輯 `MEMORY.md`。

如果 `MEMORY.md` 超過啟動檔案的預算，OpenClaw 會完整保留磁碟上的檔案，但截斷注入情境的副本。請將其視為一項訊號：把詳細內容移至 `memory/*.md`、在 `MEMORY.md` 中只保留持久摘要，或在你願意花費更多提示詞預算時提高啟動限制。使用 `/context list`、`/context detail` 或 `openclaw doctor`，可查看原始大小、注入大小與截斷狀態。

## 從程式設計助理匯入

控制介面可從 Codex 和 Claude Code 匯入現有的本機記憶。開啟 **Settings** → **Import Memory**，選擇目的地代理程式、檢閱偵測到的檔案，然後確認匯入。OpenClaw 只會複製 Markdown 記憶：

- Codex：位於 `~/.codex/memories`（或 `CODEX_HOME/memories`）下的整合式 `MEMORY.md` 與 `memory_summary.md` 檔案。不會匯入原始執行歷程與對話記錄檔案。
- Claude Code：每個專案位於 `~/.claude/projects/*/memory` 下的自動記憶目錄中的 Markdown 檔案，以及存在時由使用者設定的 `autoMemoryDirectory`。專案指示、工作階段、設定與認證資訊不屬於這項僅限記憶的操作。

匯入的檔案會分別保留在所選代理程式工作區的 `memory/imports/codex/` 與 `memory/imports/claude-code/` 下。系統會為這些檔案建立索引以供 `memory_search` 使用，並可透過 `memory_get` 存取；它們不會合併至代理程式的啟動 `MEMORY.md`。來源檔案不會變更。

預覽會標示目的地衝突。啟用 **Replace existing imports** 可取代這些檔案；套用時會建立經驗證的匯入前備份，並在遷移報告中保留遭覆寫檔案的個別副本。

## 動作敏感型記憶

大多數記憶都是一般 Markdown 筆記。有些記憶會影響代理程式日後應採取的動作；針對這類記憶，請記錄何時可以安全地根據筆記採取動作，而不只是事實本身。

當筆記涉及下列情況時，請記錄該動作界線：

- 核准或權限要求，
- 暫時性限制，
- 交接給另一個工作階段、討論串或人員，
- 到期條件，
- 可安全採取動作的時機，
- 來源或擁有者的權限，
- 避免執行誘人動作的指示。

實用的動作敏感型記憶會清楚說明：

- 哪些內容會改變未來行為，
- 何時或在什麼條件下適用，
- 何時到期，或什麼條件可解除動作限制，
- 代理程式應避免執行哪些動作，
- 來源或擁有者是誰（如果這會影響信任或權限）。

記憶可以保留核准情境，但不會強制執行政策。若需要嚴格的操作控制，請使用 OpenClaw 核准設定、沙箱與排程任務。

範例：

```md
API 遷移正在另一個工作階段中設計。未來的對話輪次不應從這個討論串編輯 API 實作；在遷移計畫完成前，這裡的發現只能作為設計輸入。
```

另一個範例：

```md
來自不受信任來源的報告需要經過檢閱才能提升。未來的對話輪次應只將它視為證據；在受信任的檢閱者確認內容之前，不要將它儲存為持久記憶。
```

這並非每項記憶都必須遵循的綱要；簡單事實可以保持精簡。如果遺失時機、權限、到期或可安全採取動作的情境，可能導致代理程式日後做出錯誤動作，請使用動作敏感型界線。

對於推斷得出且短期存在的後續事項，請使用[承諾](/zh-TW/concepts/commitments)。對於精確提醒、定時檢查與週期性工作，請使用[排程任務](/zh-TW/automation/cron-jobs)。記憶仍可摘要任一路徑相關的持久情境。

## 推斷承諾

有些未來的後續事項並不是持久事實。如果你提到明天有一場面試，實用的記憶可能是“面試後關心後續”，而不是“將這件事永久儲存在 `MEMORY.md`”。

[承諾](/zh-TW/concepts/commitments)是針對這類情況選擇啟用、短期存在的後續記憶。OpenClaw 會在隱藏的背景處理中推斷這些承諾、將其限定於相同代理程式與頻道，並透過心跳偵測傳送到期的關心訊息。明確設定的提醒仍使用[排程任務](/zh-TW/automation/cron-jobs)。

## 記憶工具

代理程式有兩個可用於處理記憶的工具：

- **`memory_search`** — 使用語意搜尋尋找相關筆記，即使措辭與原始內容不同也能找到。
- **`memory_get`** — 讀取特定記憶檔案或行範圍。

這兩個工具都由作用中的記憶外掛提供（預設：`memory-core`）。

## 記憶搜尋

設定嵌入向量提供者後，`memory_search` 會使用混合搜尋：將向量相似度（語意）與關鍵字比對（ID 和程式碼符號等精確詞彙）結合。只要具備任何受支援提供者的 API 金鑰，即可直接使用。

<Info>
OpenClaw 預設使用 OpenAI 嵌入向量。明確設定 `agents.defaults.memorySearch.provider`，即可使用 Gemini、Voyage、Mistral、Bedrock、DeepInfra、本機 GGUF、Ollama、LM Studio、GitHub Copilot，或一般 OpenAI 相容端點。
</Info>

如需瞭解搜尋的運作方式、調校選項與提供者設定，請參閱[記憶搜尋](/zh-TW/concepts/memory-search)。

## 記憶後端

<CardGroup cols={3}>
<Card title="內建（預設）" icon="database" href="/zh-TW/concepts/memory-builtin">
以 SQLite 為基礎。可直接使用關鍵字搜尋、向量相似度與混合搜尋。不需要額外相依套件。
</Card>
<Card title="QMD" icon="search" href="/zh-TW/concepts/memory-qmd">
本機優先的輔助服務，具備重新排序、查詢擴展，以及為工作區外部目錄建立索引的能力。
</Card>
<Card title="Honcho" icon="brain" href="/zh-TW/concepts/memory-honcho">
以 AI 為原生設計的跨工作階段記憶，具備使用者建模、語意搜尋與多代理程式感知能力。需安裝外掛。
</Card>
<Card title="LanceDB" icon="layers" href="/zh-TW/plugins/memory-lancedb">
以 LanceDB 為基礎的記憶，具備 OpenAI 相容嵌入向量、自動回想、自動擷取，以及本機 Ollama 嵌入向量支援。需安裝外掛。
</Card>
</CardGroup>

## 知識 Wiki 層

如果你希望持久記憶更像是經過維護的知識庫，而不是原始筆記，請使用隨附的 `memory-wiki` 外掛。它會將持久知識編譯成 Wiki 儲存庫，其中包含確定性的頁面結構、結構化聲明與證據、矛盾與新鮮度追蹤、產生的儀表板、編譯摘要，以及 Wiki 原生工具（`wiki_status`、`wiki_search`、`wiki_get`、`wiki_apply`、`wiki_lint`）。

`memory-wiki` 不會取代作用中的記憶外掛；作用中的記憶外掛仍負責回想、提升與夢境整理。`memory-wiki` 會在其旁新增一個具有豐富來源資訊的知識層。

<CardGroup cols={1}>
<Card title="記憶 Wiki" icon="book" href="/zh-TW/plugins/memory-wiki">
將持久記憶編譯成具有豐富來源資訊的 Wiki 儲存庫，其中包含聲明、儀表板、橋接模式與適合 Obsidian 的工作流程。
</Card>
</CardGroup>

## 自動清理記憶

在[壓縮](/zh-TW/concepts/compaction)摘要你的對話之前，OpenClaw 會執行一個靜默對話輪次，提醒代理程式將重要情境儲存至記憶檔案。此功能預設開啟；將 `agents.defaults.compaction.memoryFlush.enabled: false` 設定為關閉即可停用。

若要讓該整理輪次使用本機模型，請設定只套用於記憶清理輪次的明確覆寫值（它不會繼承作用中工作階段的模型備援鏈）：

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
記憶清理可避免壓縮期間遺失情境。如果代理程式在對話中取得尚未寫入檔案的重要事實，系統會在產生摘要前自動儲存這些事實。
</Tip>

## 夢境整理

夢境整理是選用的背景記憶整合處理。它會收集短期回想訊號、為候選項目評分，並只將符合資格的項目提升至長期記憶（`MEMORY.md`）：

- **選擇啟用**：預設停用。
- **排程執行**：啟用時，`memory-core` 會自動管理一項週期性排程工作，以執行完整的夢境整理掃描。
- **門檻控管**：提升必須通過分數、回想頻率與查詢多樣性關卡。
- **可檢閱**：階段摘要與日誌項目會寫入 `DREAMS.md`，以供人工檢閱。

如需瞭解階段行為、評分訊號與夢境日誌詳細資訊，請參閱[夢境整理](/zh-TW/concepts/dreaming)。

## 有依據的回填與即時提升

夢境整理系統有兩條相關的檢閱路徑：

- **即時夢境整理**會使用 `memory/.dreams/` 下的短期夢境整理儲存區，正常的深度階段會透過它決定哪些內容可升級至 `MEMORY.md`。
- **有依據的回填**會將歷史 `memory/YYYY-MM-DD.md` 筆記作為獨立的每日檔案讀取，並將結構化檢閱輸出寫入 `DREAMS.md`。

有依據的回填適合用來重新處理較舊的筆記，並檢查系統認為哪些內容具有持久價值，而不需要手動編輯 `MEMORY.md`。

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

`--stage-short-term` 旗標會將有依據的持久候選項目暫存至正常深度階段已在使用的相同短期夢境整理儲存區；它不會直接提升這些項目。因此：

- `DREAMS.md` 仍是人工檢閱介面。
- 短期儲存區仍是面向機器的排序介面。
- `MEMORY.md` 仍只會由深度提升流程寫入。

若要復原重新處理，而不影響一般日誌項目或正常回想狀態：

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
- [Honcho 記憶](/zh-TW/concepts/memory-honcho)：AI 原生的跨工作階段記憶。
- [Memory LanceDB](/zh-TW/plugins/memory-lancedb)：以 LanceDB 為後端、支援 OpenAI 相容嵌入向量的外掛。
- [Memory Wiki](/zh-TW/plugins/memory-wiki)：經編譯的知識庫與 Wiki 原生工具。
- [夢境整理](/zh-TW/concepts/dreaming)：在背景將短期回憶提升為長期記憶。
- [記憶設定參考](/zh-TW/reference/memory-config)：所有設定選項。
- [壓縮](/zh-TW/concepts/compaction)：壓縮如何與記憶互動。
- [主動記憶](/zh-TW/concepts/active-memory)：用於互動式聊天工作階段的子代理程式記憶。

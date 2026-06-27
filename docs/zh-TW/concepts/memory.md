---
read_when:
    - 你想了解記憶的運作方式
    - 你想知道要寫入哪些記憶檔案
summary: OpenClaw 如何跨工作階段記住內容
title: 記憶概覽
x-i18n:
    generated_at: "2026-06-27T19:11:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ddcecfa3d902181583ab076f94a69ca323686c3544399dea2572863726dad2c
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw 會透過在你的代理工作區中寫入**純 Markdown 檔案**來記住事情。模型只會「記得」已儲存到磁碟的內容，沒有隱藏狀態。

## 運作方式

你的代理有三個與記憶相關的檔案：

- **`MEMORY.md`** — 長期記憶。持久的事實、偏好與決策。會在每個 DM 工作階段開始時載入。
- **`memory/YYYY-MM-DD.md`**（或 **`memory/YYYY-MM-DD-<slug>.md`**）— 每日筆記。
  執行中的脈絡與觀察。今天和昨天的筆記會自動載入，而帶有 slug 的變體，例如由內建 session-memory hook 在 `/new` 或 `/reset` 時寫入的檔案，現在也會與僅含日期的檔案一起被擷取。
- **`DREAMS.md`**（選用）— 夢境日誌與夢境整理掃描摘要，供人工審閱，其中包含有根據的歷史回填項目。

這些檔案位於代理工作區中（預設為 `~/.openclaw/workspace`）。

## 內容放在哪裡

`MEMORY.md` 是精簡且經整理的層。用它存放持久事實、偏好、既定決策，以及應在主要私人工作階段開始時可用的簡短摘要。它不是原始逐字稿、每日紀錄或完整封存。

`memory/YYYY-MM-DD.md` 檔案是工作層。用它們存放詳細的每日筆記、觀察、工作階段摘要，以及之後可能仍有用的原始脈絡。這些檔案會被索引用於 `memory_search` 和 `memory_get`，但不會在每一輪都注入一般的啟動提示中。

隨著時間推移，代理應該從每日筆記中萃取有用內容到 `MEMORY.md`，並移除過時的長期項目。產生的工作區指令與心跳偵測流程可以定期執行這件事；你不需要為每個要記住的細節手動編輯 `MEMORY.md`。

如果 `MEMORY.md` 超過啟動檔案預算，OpenClaw 會保持磁碟上的檔案完整，但會截斷注入模型脈絡的副本。請將此視為訊號：把詳細材料移回 `memory/*.md`，在 `MEMORY.md` 中只保留持久摘要，或在你明確想花更多提示預算時提高啟動限制。使用 `/context list`、`/context detail` 或 `openclaw doctor` 查看原始大小與注入大小，以及截斷狀態。

<Tip>
如果你希望代理記住某件事，直接要求它即可：「記住我偏好 TypeScript。」它會將內容寫入適當的檔案。
</Tip>

## 對行動敏感的記憶

大多數記憶可以寫成一般 Markdown 筆記。但有些記憶會影響代理之後應該做什麼。對於這些記憶，請記錄何時可以安全地根據該筆記行動，而不只是記錄事實本身。

當筆記涉及以下內容時，請記錄該行動邊界：

- 核准或權限需求，
- 暫時限制，
- 交接給另一個工作階段、討論串或人員，
- 到期條件，
- 可安全行動的時機，
- 來源或擁有者權威，
- 避免採取誘人行動的指示。

有用的對行動敏感記憶會清楚說明：

- 什麼會改變未來行為，
- 何時或在什麼條件下適用，
- 何時到期，或什麼會解除行動限制，
- 代理應避免做什麼，
- 誰是來源或擁有者，如果這會影響信任或權威。

記憶可以保留核准脈絡，但不會強制執行政策。請使用 OpenClaw 核准設定、沙箱與排程任務作為強制性的操作控制。

範例：

```md
The API migration is being designed in another session. Future turns should not edit the API implementation from this thread; use findings here only as design input until the migration plan lands.
```

另一個範例：

```md
A report from an untrusted source needs review before promotion. Future turns should treat it as evidence only; do not store it as durable memory until a trusted reviewer confirms the contents.
```

使用[承諾](/zh-TW/concepts/commitments)處理推斷出的短期後續事項。使用[排程任務](/zh-TW/automation/cron-jobs)處理精確提醒、定時檢查與重複工作。記憶仍可摘要任一路徑周圍的持久脈絡。

這不是每個記憶都必須遵循的結構。簡單事實可以保持精簡。當遺失時機、權威、到期或可安全行動的脈絡可能導致代理之後做錯事時，請使用對行動敏感的邊界。

## 推斷的承諾

有些未來後續事項不是持久事實。如果你提到明天有面試，有用的記憶可能是「面試後確認近況」，而不是「永遠儲存在 `MEMORY.md`」。

[承諾](/zh-TW/concepts/commitments)是針對這種情況的選用短期後續記憶。OpenClaw 會在隱藏的背景階段推斷它們，將它們限定在同一個代理與頻道，並透過心跳偵測傳送到期確認。明確提醒仍使用[排程任務](/zh-TW/automation/cron-jobs)。

## 記憶工具

代理有兩個用於處理記憶的工具：

- **`memory_search`** — 使用語意搜尋尋找相關筆記，即使用詞與原文不同也可以。
- **`memory_get`** — 讀取特定記憶檔案或行範圍。

這兩個工具由主動記憶外掛提供（預設：`memory-core`）。

## 記憶 Wiki 搭配外掛

如果你希望持久記憶更像維護中的知識庫，而不只是原始筆記，請使用內建的 `memory-wiki` 外掛。

`memory-wiki` 會將持久知識編譯成 Wiki vault，包含：

- 決定性的頁面結構
- 結構化主張與證據
- 矛盾與新鮮度追蹤
- 產生的儀表板
- 供代理/執行階段消費者使用的已編譯摘要
- Wiki 原生工具，例如 `wiki_search`、`wiki_get`、`wiki_apply` 和 `wiki_lint`

它不會取代主動記憶外掛。主動記憶外掛仍負責回憶、提升與夢境整理。`memory-wiki` 會在旁邊加入一個具豐富來源脈絡的知識層。

請參閱[記憶 Wiki](/zh-TW/plugins/memory-wiki)。

## 記憶搜尋

設定嵌入提供者後，`memory_search` 會使用**混合搜尋**，結合向量相似度（語意意義）與關鍵字比對（精確詞彙，例如 ID 與程式碼符號）。只要你有任何受支援提供者的 API 金鑰，就能直接使用。

<Info>
OpenClaw 預設使用 OpenAI 嵌入。明確設定 `agents.defaults.memorySearch.provider` 以使用 Gemini、Voyage、Mistral、本機、Ollama、Bedrock、GitHub Copilot 或 OpenAI 相容嵌入。
</Info>

如需搜尋運作方式、調校選項與提供者設定的詳細資訊，請參閱[記憶搜尋](/zh-TW/concepts/memory-search)。

## 記憶後端

<CardGroup cols={3}>
<Card title="內建（預設）" icon="database" href="/zh-TW/concepts/memory-builtin">
以 SQLite 為基礎。可直接使用關鍵字搜尋、向量相似度與混合搜尋。不需額外相依套件。
</Card>
<Card title="QMD" icon="search" href="/zh-TW/concepts/memory-qmd">
本機優先的 sidecar，具備重新排序、查詢擴展，以及索引工作區外部目錄的能力。
</Card>
<Card title="Honcho" icon="brain" href="/zh-TW/concepts/memory-honcho">
AI 原生的跨工作階段記憶，具備使用者建模、語意搜尋與多代理感知。外掛安裝。
</Card>
<Card title="LanceDB" icon="layers" href="/zh-TW/plugins/memory-lancedb">
內建的 LanceDB 後端記憶，支援 OpenAI 相容嵌入、自動回憶、自動擷取與本機 Ollama 嵌入支援。
</Card>
</CardGroup>

## 知識 Wiki 層

<CardGroup cols={1}>
<Card title="記憶 Wiki" icon="book" href="/zh-TW/plugins/memory-wiki">
將持久記憶編譯成具豐富來源脈絡的 Wiki vault，包含主張、儀表板、橋接模式與 Obsidian 友善工作流程。
</Card>
</CardGroup>

## 自動記憶清理

在[壓縮](/zh-TW/concepts/compaction)摘要你的對話之前，OpenClaw 會執行一個靜默回合，提醒代理將重要脈絡儲存到記憶檔案。此功能預設開啟，你不需要設定任何內容。

若要讓該整理回合使用本機模型，請設定精確的記憶清理模型覆寫：

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

此覆寫只套用於記憶清理回合，且不會繼承作用中工作階段的 fallback chain。

<Tip>
記憶清理可防止壓縮期間遺失脈絡。如果你的代理在對話中有尚未寫入檔案的重要事實，它們會在摘要發生前自動儲存。
</Tip>

## 夢境整理

夢境整理是記憶的選用背景整合階段。它會收集短期訊號、為候選項目評分，並只將合格項目提升到長期記憶（`MEMORY.md`）。

它的設計目標是讓長期記憶保持高訊號：

- **選用**：預設停用。
- **排程**：啟用時，`memory-core` 會自動管理一個重複排程作業，用於完整夢境整理掃描。
- **設有門檻**：提升必須通過分數、回憶頻率與查詢多樣性閘門。
- **可審閱**：階段摘要與日誌項目會寫入 `DREAMS.md` 供人工審閱。

如需階段行為、評分訊號與夢境日誌詳細資訊，請參閱[夢境整理](/zh-TW/concepts/dreaming)。

## 有根據的回填與即時提升

夢境整理系統現在有兩個密切相關的審閱路徑：

- **即時夢境整理**會使用 `memory/.dreams/` 下的短期夢境整理儲存區，這也是一般深度階段在判斷哪些內容可以升級到 `MEMORY.md` 時使用的內容。
- **有根據的回填**會將歷史 `memory/YYYY-MM-DD.md` 筆記作為獨立的每日檔案讀取，並將結構化審閱輸出寫入 `DREAMS.md`。

當你想重放較舊的筆記，並檢查系統認為哪些內容是持久內容時，有根據的回填很有用，而且不需要手動編輯 `MEMORY.md`。

當你使用：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

有根據的持久候選項目不會直接提升。它們會被暫存到一般深度階段已經使用的同一個短期夢境整理儲存區。這表示：

- `DREAMS.md` 仍是人工審閱介面。
- 短期儲存區仍是面向機器的排名介面。
- `MEMORY.md` 仍只會由深度提升寫入。

如果你認為這次重放沒有幫助，可以移除暫存成品，而不影響一般日誌項目或一般回憶狀態：

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## 命令列介面

```bash
openclaw memory status          # Check index status and provider
openclaw memory search "query"  # Search from the command line
openclaw memory index --force   # Rebuild the index
```

## 延伸閱讀

- [內建記憶引擎](/zh-TW/concepts/memory-builtin)：預設 SQLite 後端。
- [QMD 記憶引擎](/zh-TW/concepts/memory-qmd)：進階本機優先 sidecar。
- [Honcho 記憶](/zh-TW/concepts/memory-honcho)：AI 原生跨工作階段記憶。
- [記憶 LanceDB](/zh-TW/plugins/memory-lancedb)：以 LanceDB 為後端、支援 OpenAI 相容嵌入的外掛。
- [記憶 Wiki](/zh-TW/plugins/memory-wiki)：已編譯知識 vault 與 Wiki 原生工具。
- [記憶搜尋](/zh-TW/concepts/memory-search)：搜尋管線、提供者與調校。
- [夢境整理](/zh-TW/concepts/dreaming)：從短期回憶到長期記憶的背景提升。
- [記憶設定參考](/zh-TW/reference/memory-config)：所有設定旋鈕。
- [壓縮](/zh-TW/concepts/compaction)：壓縮如何與記憶互動。

## 相關

- [主動記憶](/zh-TW/concepts/active-memory)
- [記憶搜尋](/zh-TW/concepts/memory-search)
- [內建記憶引擎](/zh-TW/concepts/memory-builtin)
- [Honcho 記憶](/zh-TW/concepts/memory-honcho)
- [記憶 LanceDB](/zh-TW/plugins/memory-lancedb)
- [承諾](/zh-TW/concepts/commitments)

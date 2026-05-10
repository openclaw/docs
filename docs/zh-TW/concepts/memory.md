---
read_when:
    - 你想了解記憶功能的運作方式
    - 你想知道要寫入哪些記憶檔案
summary: OpenClaw 如何跨工作階段記住資訊
title: 記憶概覽
x-i18n:
    generated_at: "2026-05-10T19:30:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef7a67b06615897167d7aac8a9f52fe7df9eee86f5d8d1504291ec750e674833
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw 透過在你的代理工作區中寫入**純 Markdown 檔案**來記住事情。模型只會「記得」已儲存到磁碟的內容，沒有隱藏狀態。

## 運作方式

你的代理有三個與記憶相關的檔案：

- **`MEMORY.md`** — 長期記憶。持久的事實、偏好和決策。會在每個 DM 工作階段開始時載入。
- **`memory/YYYY-MM-DD.md`** — 每日筆記。進行中的脈絡和觀察。今天和昨天的筆記會自動載入。
- **`DREAMS.md`**（選用）— Dream Diary 和 Dreaming 掃描摘要，供人員審閱，包含有根據的歷史回填項目。

這些檔案位於代理工作區中（預設為 `~/.openclaw/workspace`）。

## 內容應放在哪裡

`MEMORY.md` 是精簡、經整理的層級。用於持久的事實、偏好、既定決策，以及應在主要私人工作階段開始時可用的簡短摘要。它並非用來作為原始逐字稿、每日記錄或完整封存。

`memory/YYYY-MM-DD.md` 檔案是工作層級。用於詳細的每日筆記、觀察、工作階段摘要，以及日後可能仍有用的原始脈絡。這些檔案會被索引用於 `memory_search` 和 `memory_get`，但不會在每一輪都注入一般的啟動提示中。

隨著時間推移，代理應該將每日筆記中的有用材料提煉到 `MEMORY.md`，並移除過時的長期項目。產生的工作區指示和 Heartbeat 流程可以定期執行這件事；你不需要為每個記住的細節手動編輯 `MEMORY.md`。

如果 `MEMORY.md` 超過啟動檔案預算，OpenClaw 會完整保留磁碟上的檔案，但會截斷注入模型脈絡的副本。請將這視為一個訊號：把詳細材料移回 `memory/*.md`，在 `MEMORY.md` 中只保留持久摘要，或是在你明確想花更多提示預算時提高啟動限制。使用 `/context list`、`/context detail` 或 `openclaw doctor` 查看原始大小與注入大小，以及截斷狀態。

<Tip>
如果你想讓代理記住某件事，只要要求它：「記住我偏好 TypeScript。」它會將其寫入適當的檔案。
</Tip>

## 推斷的承諾

有些未來的後續事項不是持久事實。如果你提到明天有面試，有用的記憶可能是「面試後關心一下」，而不是「永遠儲存在 `MEMORY.md` 中」。

[Commitments](/zh-TW/concepts/commitments) 是針對這種情況的選用、短期後續記憶。OpenClaw 會在隱藏的背景流程中推斷它們，將範圍限定在同一個代理和頻道，並透過 Heartbeat 傳送到期的關心訊息。明確的提醒仍使用[排程任務](/zh-TW/automation/cron-jobs)。

## 記憶工具

代理有兩個用於處理記憶的工具：

- **`memory_search`** — 使用語意搜尋尋找相關筆記，即使用詞與原文不同也能找到。
- **`memory_get`** — 讀取特定記憶檔案或行範圍。

這兩個工具由 Active Memory Plugin 提供（預設：`memory-core`）。

## Memory Wiki 隨附 Plugin

如果你希望持久記憶的行為更像維護中的知識庫，而不只是原始筆記，請使用隨附的 `memory-wiki` Plugin。

`memory-wiki` 會將持久知識編譯成 wiki vault，包含：

- 確定性的頁面結構
- 結構化主張和證據
- 矛盾與新鮮度追蹤
- 產生的儀表板
- 提供給代理／執行階段消費者的編譯摘要
- wiki 原生工具，例如 `wiki_search`、`wiki_get`、`wiki_apply` 和 `wiki_lint`

它不會取代 Active Memory Plugin。Active Memory Plugin 仍負責回憶、提升和 Dreaming。`memory-wiki` 會在旁邊新增一個富含來源脈絡的知識層。

請參閱 [Memory Wiki](/zh-TW/plugins/memory-wiki)。

## 記憶搜尋

設定嵌入提供者後，`memory_search` 會使用**混合搜尋**，結合向量相似度（語意意義）與關鍵字比對（ID 和程式碼符號等精確詞彙）。只要你有任何支援提供者的 API 金鑰，就能立即使用。

<Info>
OpenClaw 會從可用的 API 金鑰自動偵測你的嵌入提供者。如果你已設定 OpenAI、Gemini、Voyage 或 Mistral 金鑰，記憶搜尋會自動啟用。
</Info>

如需搜尋運作方式、調整選項和提供者設定的詳細資訊，請參閱[記憶搜尋](/zh-TW/concepts/memory-search)。

## 記憶後端

<CardGroup cols={3}>
<Card title="內建（預設）" icon="database" href="/zh-TW/concepts/memory-builtin">
以 SQLite 為基礎。可立即使用關鍵字搜尋、向量相似度和混合搜尋。沒有額外相依性。
</Card>
<Card title="QMD" icon="search" href="/zh-TW/concepts/memory-qmd">
Local-first sidecar，具備重新排序、查詢擴展，以及索引工作區外部目錄的能力。
</Card>
<Card title="Honcho" icon="brain" href="/zh-TW/concepts/memory-honcho">
AI 原生跨工作階段記憶，具備使用者建模、語意搜尋和多代理感知。Plugin 安裝。
</Card>
<Card title="LanceDB" icon="layers" href="/zh-TW/plugins/memory-lancedb">
隨附的 LanceDB 支援記憶，具備 OpenAI 相容嵌入、自動回憶、自動擷取，以及本機 Ollama 嵌入支援。
</Card>
</CardGroup>

## 知識 wiki 層

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/zh-TW/plugins/memory-wiki">
將持久記憶編譯成富含來源脈絡的 wiki vault，具備主張、儀表板、橋接模式，以及適合 Obsidian 的工作流程。
</Card>
</CardGroup>

## 自動記憶清除

在 [Compaction](/zh-TW/concepts/compaction) 摘要你的對話之前，OpenClaw 會執行一個靜默回合，提醒代理將重要脈絡儲存到記憶檔案。這是預設啟用的，你不需要設定任何東西。

若要將這個整理回合保留在本機模型上，請設定精確的記憶清除模型覆寫：

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

此覆寫只套用於記憶清除回合，不會繼承作用中工作階段的備援鏈。

<Tip>
記憶清除可避免 Compaction 期間的脈絡遺失。如果你的代理在對話中有尚未寫入檔案的重要事實，它們會在摘要發生前自動儲存。
</Tip>

## Dreaming

Dreaming 是記憶的選用背景整合流程。它會收集短期訊號、為候選項目評分，並只將符合資格的項目提升到長期記憶（`MEMORY.md`）。

它的設計目標是讓長期記憶保持高訊號：

- **選用**：預設停用。
- **已排程**：啟用後，`memory-core` 會自動管理一個週期性的 Cron 工作，用於完整 Dreaming 掃描。
- **有門檻**：提升必須通過分數、回憶頻率和查詢多樣性門檻。
- **可審閱**：階段摘要和日記項目會寫入 `DREAMS.md`，供人員審閱。

如需階段行為、評分訊號和 Dream Diary 詳細資訊，請參閱 [Dreaming](/zh-TW/concepts/dreaming)。

## 有根據的回填與即時提升

Dreaming 系統現在有兩個密切相關的審閱管道：

- **即時 Dreaming** 會使用 `memory/.dreams/` 底下的短期 Dreaming 儲存區，也就是一般深度階段在判斷哪些內容可以升級到 `MEMORY.md` 時所使用的來源。
- **有根據的回填** 會將歷史 `memory/YYYY-MM-DD.md` 筆記作為獨立每日檔案讀取，並將結構化審閱輸出寫入 `DREAMS.md`。

當你想重播較舊的筆記，並檢查系統認為哪些內容是持久內容，而不想手動編輯 `MEMORY.md` 時，有根據的回填很有用。

當你使用：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

有根據的持久候選項目不會直接被提升。它們會被暫存到一般深度階段已在使用的同一個短期 Dreaming 儲存區。這表示：

- `DREAMS.md` 仍是人員審閱介面。
- 短期儲存區仍是面向機器的排序介面。
- `MEMORY.md` 仍只由深度提升寫入。

如果你認為這次重播沒有用，可以移除暫存成品，而不影響一般日記項目或正常回憶狀態：

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Check index status and provider
openclaw memory search "query"  # Search from the command line
openclaw memory index --force   # Rebuild the index
```

## 延伸閱讀

- [內建記憶引擎](/zh-TW/concepts/memory-builtin)：預設 SQLite 後端。
- [QMD 記憶引擎](/zh-TW/concepts/memory-qmd)：進階 local-first sidecar。
- [Honcho 記憶](/zh-TW/concepts/memory-honcho)：AI 原生跨工作階段記憶。
- [Memory LanceDB](/zh-TW/plugins/memory-lancedb)：具備 OpenAI 相容嵌入的 LanceDB 支援 Plugin。
- [Memory Wiki](/zh-TW/plugins/memory-wiki)：編譯知識 vault 和 wiki 原生工具。
- [記憶搜尋](/zh-TW/concepts/memory-search)：搜尋管線、提供者和調整。
- [Dreaming](/zh-TW/concepts/dreaming)：從短期回憶背景提升到長期記憶。
- [記憶設定參考](/zh-TW/reference/memory-config)：所有設定旋鈕。
- [Compaction](/zh-TW/concepts/compaction)：Compaction 如何與記憶互動。

## 相關

- [Active memory](/zh-TW/concepts/active-memory)
- [記憶搜尋](/zh-TW/concepts/memory-search)
- [內建記憶引擎](/zh-TW/concepts/memory-builtin)
- [Honcho 記憶](/zh-TW/concepts/memory-honcho)
- [Memory LanceDB](/zh-TW/plugins/memory-lancedb)
- [Commitments](/zh-TW/concepts/commitments)

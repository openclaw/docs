---
read_when:
    - 你想了解記憶的運作方式
    - 你想知道要寫入哪些記憶檔案
summary: OpenClaw 如何跨工作階段記住事項
title: 記憶概覽
x-i18n:
    generated_at: "2026-04-30T03:00:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: ecf6cf2c95ce3ee78d62923e795f16957088f0eb6620ed50647cff05b99bd572
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw 透過在你的代理工作區中寫入**純 Markdown 檔案**來記住事情。模型只會「記住」儲存到磁碟的內容，沒有隱藏狀態。

## 運作方式

你的代理有三個與記憶相關的檔案：

- **`MEMORY.md`** — 長期記憶。持久保存的事實、偏好與決策。每次 DM 工作階段開始時都會載入。
- **`memory/YYYY-MM-DD.md`** — 每日筆記。持續累積的脈絡與觀察。今天和昨天的筆記會自動載入。
- **`DREAMS.md`**（選用）— Dream Diary 與 dreaming 掃描摘要，供人工審閱，包括有依據的歷史回填項目。

這些檔案位於代理工作區中（預設為 `~/.openclaw/workspace`）。

<Tip>
如果你想讓代理記住某件事，只要告訴它：「Remember that I prefer TypeScript.」它就會寫入適當的檔案。
</Tip>

## 推斷出的承諾

有些未來的後續事項不是持久事實。如果你提到明天有一場面試，有用的記憶可能是「面試後追蹤一下」，而不是「永遠儲存在 `MEMORY.md`」。

[承諾](/zh-TW/concepts/commitments)是針對這種情況的選擇性、短期後續記憶。OpenClaw 會在隱藏的背景處理中推斷它們，將其範圍限制在同一個代理與頻道，並透過 heartbeat 傳送到期的追蹤提醒。明確的提醒仍然使用[排程任務](/zh-TW/automation/cron-jobs)。

## 記憶工具

代理有兩個用於處理記憶的工具：

- **`memory_search`** — 使用語意搜尋尋找相關筆記，即使用詞與原文不同也可以。
- **`memory_get`** — 讀取特定記憶檔案或行範圍。

這兩個工具都由 Active Memory Plugin 提供（預設：`memory-core`）。

## Memory Wiki 配套 Plugin

如果你希望持久記憶的行為更像一個維護中的知識庫，而不只是原始筆記，請使用內建的 `memory-wiki` Plugin。

`memory-wiki` 會將持久知識編譯成 wiki vault，包含：

- 決定性的頁面結構
- 結構化主張與證據
- 矛盾與新鮮度追蹤
- 產生的儀表板
- 供代理/執行階段使用者使用的已編譯摘要
- wiki 原生工具，例如 `wiki_search`、`wiki_get`、`wiki_apply` 和 `wiki_lint`

它不會取代 Active Memory Plugin。Active Memory Plugin 仍然負責回想、提升與 dreaming。`memory-wiki` 會在旁邊新增一個具備豐富來源脈絡的知識層。

請參閱 [Memory Wiki](/zh-TW/plugins/memory-wiki)。

## 記憶搜尋

設定嵌入提供者後，`memory_search` 會使用**混合搜尋**，也就是結合向量相似度（語意意義）與關鍵字比對（像 ID 和程式碼符號這樣的精確詞）。只要你有任何受支援提供者的 API 金鑰，就能立即使用。

<Info>
OpenClaw 會根據可用的 API 金鑰自動偵測你的嵌入提供者。如果你已設定 OpenAI、Gemini、Voyage 或 Mistral 金鑰，記憶搜尋會自動啟用。
</Info>

如需搜尋運作方式、調校選項與提供者設定的詳細資訊，請參閱[記憶搜尋](/zh-TW/concepts/memory-search)。

## 記憶後端

<CardGroup cols={3}>
<Card title="內建（預設）" icon="database" href="/zh-TW/concepts/memory-builtin">
以 SQLite 為基礎。可立即使用關鍵字搜尋、向量相似度與混合搜尋。不需要額外相依項。
</Card>
<Card title="QMD" icon="search" href="/zh-TW/concepts/memory-qmd">
本機優先的 sidecar，支援重新排序、查詢擴展，以及索引工作區外部目錄的能力。
</Card>
<Card title="Honcho" icon="brain" href="/zh-TW/concepts/memory-honcho">
AI 原生的跨工作階段記憶，具備使用者建模、語意搜尋與多代理感知。Plugin 安裝。
</Card>
<Card title="LanceDB" icon="layers" href="/zh-TW/plugins/memory-lancedb">
內建以 LanceDB 為基礎的記憶，具備 OpenAI 相容嵌入、自動回想、自動擷取，以及本機 Ollama 嵌入支援。
</Card>
</CardGroup>

## 知識 wiki 層

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/zh-TW/plugins/memory-wiki">
將持久記憶編譯成具備豐富來源脈絡的 wiki vault，包含主張、儀表板、橋接模式，以及對 Obsidian 友善的工作流程。
</Card>
</CardGroup>

## 自動記憶清理寫入

在 [Compaction](/zh-TW/concepts/compaction) 摘要你的對話之前，OpenClaw 會執行一個靜默回合，提醒代理將重要脈絡儲存到記憶檔案。此功能預設開啟，你不需要設定任何內容。

若要讓該維護回合使用本機模型，請設定精確的記憶清理寫入模型覆寫：

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

此覆寫只套用到記憶清理寫入回合，不會繼承目前工作階段的備援鏈。

<Tip>
記憶清理寫入可防止 Compaction 期間的脈絡遺失。如果你的代理在對話中有尚未寫入檔案的重要事實，這些內容會在摘要產生前自動儲存。
</Tip>

## Dreaming

Dreaming 是記憶的選用背景整合處理。它會收集短期訊號、為候選項目評分，並只將符合資格的項目提升到長期記憶（`MEMORY.md`）。

它的設計目標是讓長期記憶維持高訊號：

- **選擇性啟用**：預設停用。
- **已排程**：啟用時，`memory-core` 會自動管理一個用於完整 dreaming 掃描的週期性 Cron 工作。
- **有門檻**：提升必須通過分數、回想頻率與查詢多樣性關卡。
- **可審閱**：階段摘要與日記項目會寫入 `DREAMS.md`，供人工審閱。

如需階段行為、評分訊號與 Dream Diary 詳細資訊，請參閱 [Dreaming](/zh-TW/concepts/dreaming)。

## 有依據的回填與即時提升

dreaming 系統現在有兩個密切相關的審閱路徑：

- **即時 dreaming** 會使用 `memory/.dreams/` 底下的短期 dreaming 儲存區，這也是一般深度階段在決定哪些內容可以晉升到 `MEMORY.md` 時使用的來源。
- **有依據的回填** 會將歷史 `memory/YYYY-MM-DD.md` 筆記作為獨立日檔讀取，並將結構化審閱輸出寫入 `DREAMS.md`。

當你想重新播放較舊的筆記，並檢查系統認為哪些內容具備持久價值，而不想手動編輯 `MEMORY.md` 時，有依據的回填很有用。

當你使用：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

有依據的持久候選項目不會直接提升。它們會被暫存到一般深度階段已使用的同一個短期 dreaming 儲存區。這表示：

- `DREAMS.md` 仍然是人工審閱介面。
- 短期儲存區仍然是面向機器的排序介面。
- `MEMORY.md` 仍然只會由深度提升寫入。

如果你判定這次重播沒有幫助，可以移除暫存的產物，而不影響一般日記項目或正常回想狀態：

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # 檢查索引狀態與提供者
openclaw memory search "query"  # 從命令列搜尋
openclaw memory index --force   # 重建索引
```

## 延伸閱讀

- [內建記憶引擎](/zh-TW/concepts/memory-builtin)：預設 SQLite 後端。
- [QMD 記憶引擎](/zh-TW/concepts/memory-qmd)：進階的本機優先 sidecar。
- [Honcho memory](/zh-TW/concepts/memory-honcho)：AI 原生的跨工作階段記憶。
- [Memory LanceDB](/zh-TW/plugins/memory-lancedb)：以 LanceDB 為基礎、具備 OpenAI 相容嵌入的 Plugin。
- [Memory Wiki](/zh-TW/plugins/memory-wiki)：已編譯的知識 vault 與 wiki 原生工具。
- [記憶搜尋](/zh-TW/concepts/memory-search)：搜尋管線、提供者與調校。
- [Dreaming](/zh-TW/concepts/dreaming)：從短期回想到長期記憶的背景提升。
- [記憶設定參考](/zh-TW/reference/memory-config)：所有設定旋鈕。
- [Compaction](/zh-TW/concepts/compaction)：Compaction 如何與記憶互動。

## 相關

- [Active Memory](/zh-TW/concepts/active-memory)
- [記憶搜尋](/zh-TW/concepts/memory-search)
- [內建記憶引擎](/zh-TW/concepts/memory-builtin)
- [Honcho memory](/zh-TW/concepts/memory-honcho)
- [Memory LanceDB](/zh-TW/plugins/memory-lancedb)
- [承諾](/zh-TW/concepts/commitments)

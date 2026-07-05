---
read_when:
    - 你想了解記憶如何運作
    - 你想知道要寫入哪些記憶檔案
summary: OpenClaw 如何在不同工作階段之間記住事物
title: 記憶概覽
x-i18n:
    generated_at: "2026-07-05T11:13:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c77d71dd6b1916b923fbf72c373f20128c4f604f96cc76150ea27e0f13a541f8
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw 會透過在你的代理程式工作區（預設為 `~/.openclaw/workspace`）寫入純 Markdown 檔案來記住資訊。模型只會記得已儲存到磁碟的內容；沒有隱藏狀態。

## 運作方式

你的代理程式有三個與記憶相關的檔案：

- **`MEMORY.md`** — 長期記憶。持久的事實、偏好與決策。會在工作階段開始時載入。
- **`memory/YYYY-MM-DD.md`**（或 `memory/YYYY-MM-DD-<slug>.md`）— 每日筆記。執行中的脈絡與觀察。在單純的 `/new` 或 `/reset` 時，今天與昨天的日期筆記會自動載入；帶有 slug 的變體，例如由內建 session-memory hook 寫入的檔案，也會與僅含日期的檔案一起被擷取。
- **`DREAMS.md`**（選用）— 夢境日誌與夢境整理掃描摘要，供人工審閱，包含有根據的歷史回填項目。

<Tip>
如果你想讓代理程式記住某件事，只要告訴它：「記住我偏好 TypeScript。」它會把筆記寫入適當的檔案。
</Tip>

## 內容放在哪裡

`MEMORY.md` 是精簡、經整理的層級：持久的事實、偏好、常設決策，以及應在工作階段開始時可用的短摘要。它不是原始逐字稿、每日記錄或完整封存。

`memory/YYYY-MM-DD.md` 檔案是工作層級：詳細的每日筆記、觀察、工作階段摘要，以及之後仍可能有用的原始脈絡。這些檔案會被索引用於 `memory_search` 與 `memory_get`，但不會在每一輪都注入 bootstrap 提示。

隨著時間推移，代理程式會將每日筆記中的有用材料萃取到 `MEMORY.md`，並移除過時的長期項目。產生的工作區指令與心跳偵測流程會定期執行此操作；你不需要為每個細節手動編輯 `MEMORY.md`。

如果 `MEMORY.md` 超過 bootstrap 檔案預算，OpenClaw 會保持磁碟上的檔案完整，但截斷注入脈絡的副本。請把這視為一個訊號：將詳細材料移到 `memory/*.md`，在 `MEMORY.md` 中只保留持久摘要，或是在你想花費更多提示預算時提高 bootstrap 限制。使用 `/context list`、`/context detail` 或 `openclaw doctor` 查看原始大小與注入大小，以及截斷狀態。

## 對動作敏感的記憶

大多數記憶都是一般 Markdown 筆記。有些會影響代理程式之後應該做什麼；對於這類記憶，請記錄何時可以安全地根據該筆記行動，而不只是記錄事實本身。

當筆記涉及以下內容時，請記錄該動作邊界：

- 核准或權限要求，
- 暫時性限制，
- 交接給另一個工作階段、執行緒或人員，
- 到期條件，
- 可安全行動的時機，
- 來源或擁有者權威，
- 避免採取某個誘人動作的指令。

有用的對動作敏感記憶會清楚說明：

- 什麼會改變未來行為，
- 何時或在什麼條件下適用，
- 何時到期，或什麼會解鎖行動，
- 代理程式應避免做什麼，
- 來源或擁有者是誰，如果這會影響信任或權威。

記憶可以保留核准脈絡，但不會強制執行政策。請使用 OpenClaw 核准設定、沙箱與排程任務作為強制性操作控制。

範例：

```md
The API migration is being designed in another session. Future turns should
not edit the API implementation from this thread; use findings here only as
design input until the migration plan lands.
```

另一個範例：

```md
A report from an untrusted source needs review before promotion. Future turns
should treat it as evidence only; do not store it as durable memory until a
trusted reviewer confirms the contents.
```

這不是每個記憶都必須遵守的結構；簡單事實可以保持簡潔。當遺失時機、權威、到期或可安全行動脈絡可能導致代理程式之後做錯事時，請使用對動作敏感的邊界。

針對推論出的短期後續事項，請使用[承諾](/zh-TW/concepts/commitments)。針對精確提醒、定時檢查與週期性工作，請使用[排程任務](/zh-TW/automation/cron-jobs)。記憶仍可摘要任一路徑周圍的持久脈絡。

## 推論出的承諾

有些未來後續事項不是持久事實。如果你提到明天有面試，有用的記憶可能是「面試後追蹤」，而不是「永遠儲存在 `MEMORY.md` 中」。

[承諾](/zh-TW/concepts/commitments)是針對此情境的選擇性短期後續記憶。OpenClaw 會在隱藏的背景流程中推論它們，將其限定在同一個代理程式與頻道範圍內，並透過心跳偵測傳遞到期的追蹤提醒。明確提醒仍使用[排程任務](/zh-TW/automation/cron-jobs)。

## 記憶工具

代理程式有兩個用於處理記憶的工具：

- **`memory_search`** — 使用語意搜尋尋找相關筆記，即使用詞與原文不同也可以。
- **`memory_get`** — 讀取特定記憶檔案或行範圍。

這兩個工具都由主動記憶外掛提供（預設：`memory-core`）。

## 記憶搜尋

設定 embedding provider 後，`memory_search` 會使用混合搜尋：向量相似度（語意）結合關鍵字比對（像 ID 與程式碼符號這類精確詞彙）。只要為任何支援的 provider 提供 API key，即可直接使用。

<Info>
OpenClaw 預設使用 OpenAI embeddings。明確設定 `agents.defaults.memorySearch.provider` 可使用 Gemini、Voyage、Mistral、Bedrock、DeepInfra、local GGUF、Ollama、LM Studio、GitHub Copilot，或通用 OpenAI-compatible endpoint。
</Info>

請參閱[記憶搜尋](/zh-TW/concepts/memory-search)，了解搜尋的運作方式、調校選項與 provider 設定。

## 記憶後端

<CardGroup cols={3}>
<Card title="Builtin (default)" icon="database" href="/zh-TW/concepts/memory-builtin">
基於 SQLite。內建支援關鍵字搜尋、向量相似度與混合搜尋。沒有額外相依項。
</Card>
<Card title="QMD" icon="search" href="/zh-TW/concepts/memory-qmd">
本機優先的 sidecar，具備重新排序、查詢擴展，以及索引工作區外部目錄的能力。
</Card>
<Card title="Honcho" icon="brain" href="/zh-TW/concepts/memory-honcho">
AI 原生的跨工作階段記憶，具備使用者建模、語意搜尋與多代理程式感知。外掛安裝。
</Card>
<Card title="LanceDB" icon="layers" href="/zh-TW/plugins/memory-lancedb">
以 LanceDB 為後端的記憶，支援 OpenAI-compatible embeddings、自動回想、自動擷取，以及本機 Ollama embedding 支援。外掛安裝。
</Card>
</CardGroup>

## 知識 wiki 層

如果你想讓持久記憶的行為更像維護中的知識庫，而不是原始筆記，請使用內建的 `memory-wiki` 外掛。它會將持久知識編譯成 wiki vault，具備確定性的頁面結構、結構化聲明與證據、矛盾與新鮮度追蹤、產生的儀表板、編譯摘要，以及 wiki 原生工具（`wiki_status`、`wiki_search`、`wiki_get`、`wiki_apply`、`wiki_lint`）。

`memory-wiki` 不會取代主動記憶外掛；主動記憶外掛仍擁有回想、提升與夢境整理。`memory-wiki` 會在旁邊加入一個富含來源脈絡的知識層。

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/zh-TW/plugins/memory-wiki">
將持久記憶編譯成富含來源脈絡的 wiki vault，具備聲明、儀表板、橋接模式，以及對 Obsidian 友善的工作流程。
</Card>
</CardGroup>

## 自動記憶 flush

在[壓縮](/zh-TW/concepts/compaction)摘要你的對話之前，OpenClaw 會執行一個靜默回合，提醒代理程式將重要脈絡儲存到記憶檔案。這預設為開啟；設定 `agents.defaults.compaction.memoryFlush.enabled: false` 可將其關閉。

若要讓該整理回合使用本機模型，請設定只套用到 memory-flush 回合的精確覆寫（它不會繼承目前工作階段的模型 fallback chain）：

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
記憶 flush 會在壓縮期間防止脈絡遺失。如果代理程式在對話中有尚未寫入檔案的重要事實，它們會在摘要發生前自動儲存。
</Tip>

## 夢境整理

夢境整理是選用的背景記憶整合流程。它會收集短期回想訊號、為候選項評分，並只將符合資格的項目提升到長期記憶（`MEMORY.md`）：

- **選擇啟用**：預設停用。
- **已排程**：啟用時，`memory-core` 會自動管理一個用於完整夢境整理掃描的週期性排程工作。
- **有門檻**：提升必須通過分數、回想頻率與查詢多樣性門檻。
- **可審閱**：階段摘要與日誌項目會寫入 `DREAMS.md` 供人工審閱。

請參閱[夢境整理](/zh-TW/concepts/dreaming)，了解階段行為、評分訊號與夢境日誌詳細資訊。

## 有根據的回填與即時提升

夢境整理系統有兩個相關的審閱路徑：

- **即時夢境整理**會使用 `memory/.dreams/` 底下的短期夢境整理儲存區，也是一般深度階段用來決定哪些項目升級到 `MEMORY.md` 的依據。
- **有根據的回填**會將歷史 `memory/YYYY-MM-DD.md` 筆記讀取為獨立日期檔案，並將結構化審閱輸出寫入 `DREAMS.md`。

有根據的回填適合用來重播較舊的筆記，並檢查系統認為哪些內容具有持久性，而不需要手動編輯 `MEMORY.md`。

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

`--stage-short-term` 旗標會將有根據的持久候選項暫存到一般深度階段已使用的同一個短期夢境整理儲存區；它不會直接提升它們。因此：

- `DREAMS.md` 仍是人工審閱表面。
- 短期儲存區仍是面向機器的排序表面。
- `MEMORY.md` 仍只會由深度提升寫入。

若要復原一次重播，而不碰一般日誌項目或一般回想狀態：

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

- [記憶搜尋](/zh-TW/concepts/memory-search)：搜尋管線、provider 與調校。
- [內建記憶引擎](/zh-TW/concepts/memory-builtin)：預設 SQLite 後端。
- [QMD 記憶引擎](/zh-TW/concepts/memory-qmd)：進階的本機優先 sidecar。
- [Honcho 記憶](/zh-TW/concepts/memory-honcho)：AI 原生跨工作階段記憶。
- [Memory LanceDB](/zh-TW/plugins/memory-lancedb)：以 LanceDB 為後端、具備 OpenAI-compatible embeddings 的外掛。
- [Memory Wiki](/zh-TW/plugins/memory-wiki)：編譯後的知識 vault 與 wiki 原生工具。
- [夢境整理](/zh-TW/concepts/dreaming)：從短期回想到長期記憶的背景提升。
- [記憶設定參考](/zh-TW/reference/memory-config)：所有設定旋鈕。
- [壓縮](/zh-TW/concepts/compaction)：壓縮如何與記憶互動。
- [主動記憶](/zh-TW/concepts/active-memory)：互動式聊天工作階段的子代理程式記憶。

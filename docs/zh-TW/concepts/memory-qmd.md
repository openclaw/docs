---
read_when:
    - 你想將 QMD 設定為你的記憶體後端
    - 你想要進階記憶功能，例如重新排序或額外的已索引路徑
summary: 本地優先的搜尋 sidecar，具備 BM25、向量、重新排序與查詢擴展
title: QMD 記憶引擎
x-i18n:
    generated_at: "2026-07-05T11:15:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4fc87c31835a6a1fdabbb271902334755b9801e51a5b2a3cb5525f1657e9317
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) 是一個本地優先的搜尋輔助程式，會與
OpenClaw 一起執行。它在單一二進位檔中結合 BM25、向量搜尋與重新排序，
也可以索引工作區記憶檔案以外的內容。

## 相較於內建功能增加了什麼

- **重新排序與查詢擴展**，以提升召回率。
- **索引額外目錄** - 專案文件、團隊筆記、磁碟上的任何內容。
- **索引工作階段逐字稿** - 召回較早的對話。
- **完全本地** - 搭配官方 llama.cpp 提供者外掛執行，並會自動下載 GGUF 模型。
- **自動後備** - 如果 QMD 無法使用，OpenClaw 會無縫退回內建引擎。

## 開始使用

### 先決條件

- 安裝 QMD：`npm install -g @tobilu/qmd` 或 `bun install -g @tobilu/qmd`
- 允許擴充功能的 SQLite 建置版本（macOS 上使用 `brew install sqlite`）。
- QMD 必須位於閘道的 `PATH`。
- macOS 和 Linux 可直接運作。Windows 透過 WSL2 支援最佳。

### 啟用

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw 會在 `~/.openclaw/agents/<agentId>/qmd/` 下建立自含式 QMD 主目錄，並自動管理輔助程式生命週期 - 集合、更新與嵌入執行都會為你處理。
它偏好目前的 QMD 集合與 MCP 查詢形狀，但會在需要時退回替代的集合模式旗標與較舊的 MCP 工具名稱。
啟動協調也會在仍存在同名舊版 QMD 集合時，將過期的受管理集合重新建立回其標準模式。

## 輔助程式如何運作

- OpenClaw 會從你的工作區記憶檔案與任何已設定的 `memory.qmd.paths` 建立集合，然後在 QMD 管理器開啟時以及之後定期執行 `qmd update`（`memory.qmd.update.interval`，預設 `5m`）。重新整理會透過 QMD 子行程執行，而不是程序內檔案系統爬取。語意搜尋模式也會執行 `qmd embed`（`memory.qmd.update.embedInterval`，預設 `60m`）。
- 預設工作區集合會追蹤 `MEMORY.md` 加上 `memory/` 樹狀目錄。小寫的 `memory.md` 不會作為根記憶檔案被索引。
- QMD 自身的掃描器會忽略隱藏路徑，以及常見的依賴項目/建置目錄，例如 `.git`、`.cache`、`node_modules`、`vendor`、`dist` 與 `build`。閘道啟動預設不會初始化 QMD（`memory.qmd.update.startup` 預設為 `off`），因此冷啟動會避免在首次使用記憶前匯入記憶執行階段或建立長時間存在的監看器。
- 將 `memory.qmd.update.startup` 設為 `idle` 或 `immediate`，即可仍在閘道啟動時初始化 QMD。`memory.qmd.update.onBoot` 預設為 `true`，並會在啟動時執行初始重新整理；將它設為 `false` 可略過該立即重新整理（當已設定更新或嵌入間隔時，長時間存在的管理器仍會開啟，因此 QMD 會繼續擁有其一般監看器/計時器）。
- 搜尋會使用已設定的 `searchMode`（預設：`search`；也支援 `vsearch` 與 `query`）。`search` 僅使用 BM25，因此 OpenClaw 會在該模式略過語意向量就緒探測與嵌入維護。如果某個模式失敗，OpenClaw 會使用 `qmd query` 重試。
- 當 `searchMode` 為 `query` 時，將 `memory.qmd.rerank` 設為 `false`，即可使用 QMD 的混合查詢路徑但不使用重新排序器（需要 QMD 2.1 或更新版本）。OpenClaw 會將 `--no-rerank` 傳給直接 QMD 命令列介面路徑，並將 `rerank: false` 傳給 QMD 的 MCP 查詢工具。
- 對於公告支援多集合篩選器的 QMD 發行版本，OpenClaw 會將相同來源的集合分組成一次 QMD 搜尋呼叫。較舊的 QMD 發行版本會保留相容的逐集合後備。
- 如果 QMD 完全失敗，OpenClaw 會退回內建 SQLite 引擎。重複的聊天回合嘗試會在開啟失敗後短暫退避，因此遺失的二進位檔或損壞的輔助程式依賴項目不會造成重試風暴；`openclaw memory status` 和一次性命令列介面探測仍會直接重新檢查 QMD。

<Info>
首次搜尋可能很慢 - QMD 會在第一次執行 `qmd query` 時自動下載 GGUF 模型（約 2 GB），用於重新排序與查詢擴展。
</Info>

## 搜尋效能與相容性

OpenClaw 會讓 QMD 搜尋路徑同時相容於目前與較舊的 QMD 安裝。

啟動時，OpenClaw 會針對每個管理器檢查一次已安裝 QMD 的說明文字。如果二進位檔公告支援多個集合篩選器，OpenClaw 會用一個命令搜尋所有相同來源的集合：

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

這可避免為每個持久記憶集合啟動一個 QMD 子行程。
工作階段逐字稿集合會保留在自己的來源群組中，因此混合的 `memory` + `sessions` 搜尋仍會從兩個來源提供結果多樣化器輸入。

較舊的 QMD 建置版本只接受一個集合篩選器。當 OpenClaw 偵測到其中一種建置版本時，會保留相容路徑，並在合併與去重結果前分別搜尋每個集合。

若要手動檢查已安裝的合約，請執行：

```bash
qmd --help | grep -i collection
```

目前的 QMD 說明會提到鎖定一個或多個集合。較舊的說明通常描述單一集合。

## 模型覆寫

QMD 模型環境變數會從閘道程序原樣傳遞，因此你可以全域調整 QMD，而不必新增 OpenClaw 設定：

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

變更嵌入模型後，請重新執行嵌入，讓索引符合新的向量空間。

## 索引額外路徑

將 QMD 指向其他目錄，使它們可被搜尋：

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

來自額外路徑的片段會在搜尋結果中顯示為 `qmd/<collection>/<relative-path>`。
`memory_get` 了解此前綴，並會從正確的集合根目錄讀取。

## 索引工作階段逐字稿

啟用工作階段索引以召回較早的對話。QMD 同時需要一般的 `memorySearch` 工作階段來源與 QMD 逐字稿匯出器：

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        experimental: { sessionMemory: true },
        sources: ["memory", "sessions"],
      },
    },
  },
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

逐字稿會以清理過的使用者/助理回合匯出到 `~/.openclaw/agents/<id>/qmd/sessions/` 下的專用 QMD 集合。只設定 `memorySearch.experimental.sessionMemory` 不會將逐字稿匯出到 QMD。

工作階段命中仍會依 [`tools.sessions.visibility`](/zh-TW/gateway/config-tools#toolssessions) 篩選。
預設的 `tree` 可見性不會暴露不相關的同代理工作階段。如果閘道分派的工作階段應可從另一個獨立 DM 工作階段召回，請有意地設定 `tools.sessions.visibility: "agent"`。

## 搜尋範圍

預設情況下，QMD 搜尋結果只會顯示在直接工作階段中（不包含群組或頻道聊天）。設定 `memory.qmd.scope` 可變更此行為：

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

上方片段是實際的預設規則。當範圍拒絕搜尋時，OpenClaw 會記錄一則警告，其中包含推導出的頻道與聊天類型，讓空結果更容易偵錯。

## 引用

當 `memory.citations` 為 `auto` 或 `on` 時，搜尋片段會附加 `Source: <path>#L<line>`（或 `#L<start>-L<end>`）頁尾。在 `auto` 模式中，頁尾只會針對直接聊天工作階段加入。將 `memory.citations = "off"` 設為可省略頁尾，同時仍在內部將路徑傳遞給代理。

## 何時使用

當你需要以下功能時，請選擇 QMD：

- 重新排序以取得更高品質的結果。
- 搜尋工作區外的專案文件或筆記。
- 召回過去的工作階段對話。
- 不需 API 金鑰的完全本地搜尋。

對於較簡單的設定，[內建引擎](/zh-TW/concepts/memory-builtin) 不需額外依賴項目即可良好運作。

## 疑難排解

**找不到 QMD？** 請確認二進位檔位於閘道的 `PATH`。如果 OpenClaw 以服務形式執行，請建立符號連結：
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`。

如果 `qmd --version` 在你的 shell 中可運作，但 OpenClaw 仍回報 `spawn qmd ENOENT`，閘道程序的 `PATH` 可能與互動式 shell 不同。請明確指定二進位檔：

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      command: "/absolute/path/to/qmd",
    },
  },
}
```

在安裝 QMD 的環境中使用 `command -v qmd`，然後用 `openclaw memory status --deep` 重新檢查。

**首次搜尋非常慢？** QMD 會在首次使用時下載 GGUF 模型。使用 OpenClaw 所用的相同 XDG 目錄執行 `qmd query "test"` 來預熱。

**搜尋期間有許多 QMD 子行程？** 如果可能，請更新 QMD。只有在已安裝的 QMD 公告支援多個 `-c` 篩選器時，OpenClaw 才會對相同來源的多集合搜尋使用一個程序；否則會為正確性保留較舊的逐集合後備。

**僅 BM25 的 QMD 仍嘗試建置 llama.cpp？** 設定 `memory.qmd.searchMode = "search"`。OpenClaw 會將該模式視為僅詞彙模式，略過 QMD 向量狀態探測與嵌入維護，並將語意就緒檢查留給 `vsearch` 或 `query` 設定。

**搜尋逾時？** 增加 `memory.qmd.limits.timeoutMs`（預設：4000ms）。對於較慢的硬體，請將其設得更高，例如 `120000`。

**群組或頻道聊天中結果為空？** 這是預設 `memory.qmd.scope` 的預期行為，它只允許直接工作階段。如果你想在那裡取得 QMD 結果，請為 `group` 或 `channel` 聊天類型新增 `allow` 規則。

**根記憶搜尋突然變得太廣？** 重新啟動閘道，或等待下一次啟動協調。OpenClaw 會在偵測到同名衝突時，將過期的受管理集合重新建立回標準的 `MEMORY.md` 與 `memory/` 模式。

**工作區可見的暫存 repo 導致 `ENAMETOOLONG` 或索引中斷？**
QMD 遍歷遵循底層 QMD 掃描器，而不是 OpenClaw 的內建符號連結規則。請將暫存 monorepo checkout 放在 `.tmp/` 等隱藏目錄下，或放在已索引 QMD 根目錄之外，直到 QMD 公開循環安全遍歷或明確排除控制。

## 設定

如需完整設定介面（`memory.qmd.*`）、搜尋模式、更新間隔、範圍規則與所有其他調整項，請參閱[記憶設定參考](/zh-TW/reference/memory-config)。

## 相關

- [記憶概觀](/zh-TW/concepts/memory)
- [內建記憶引擎](/zh-TW/concepts/memory-builtin)
- [Honcho 記憶](/zh-TW/concepts/memory-honcho)

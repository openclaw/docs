---
read_when:
    - 您想將 QMD 設定為您的記憶後端
    - 你想要像重新排序或額外索引路徑等進階記憶功能
summary: 本機優先的搜尋輔助服務，具備 BM25、向量、重新排序與查詢擴展
title: QMD 記憶引擎
x-i18n:
    generated_at: "2026-04-30T03:00:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71980e3701f9a5ddcfbbfa41497ef51d2aae2993b2326591124cc0a87f9a849f
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) 是一個本機優先的搜尋 sidecar，會與 OpenClaw 並行執行。它在單一二進位檔中結合 BM25、向量搜尋與重新排序，且可以索引工作區記憶檔案以外的內容。

## 相較於內建功能新增了什麼

- **重新排序與查詢擴展**，以提升召回率。
- **索引額外目錄** -- 專案文件、團隊筆記、磁碟上的任何內容。
- **索引工作階段轉錄** -- 召回較早的對話。
- **完全本機執行** -- 使用選用的 node-llama-cpp 執行階段套件，並自動下載 GGUF 模型。
- **自動備援** -- 如果 QMD 無法使用，OpenClaw 會無縫退回內建引擎。

## 開始使用

### 先決條件

- 安裝 QMD：`npm install -g @tobilu/qmd` 或 `bun install -g @tobilu/qmd`
- 允許擴充功能的 SQLite 建置版本（macOS 上可用 `brew install sqlite`）。
- QMD 必須位於 Gateway 的 `PATH` 中。
- macOS 與 Linux 可直接使用。Windows 最建議透過 WSL2 支援。

### 啟用

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw 會在 `~/.openclaw/agents/<agentId>/qmd/` 下建立自含式 QMD 主目錄，並自動管理 sidecar 生命週期 -- collections、更新與嵌入執行都會替你處理。它會優先使用目前的 QMD collection 與 MCP 查詢形狀，但必要時仍會退回替代的 collection pattern 旗標與較舊的 MCP tool 名稱。啟動時的協調也會在仍存在同名舊版 QMD collection 時，將過時的受管理 collections 重新建立回其標準 patterns。

## sidecar 的運作方式

- OpenClaw 會從你的工作區記憶檔案與任何已設定的 `memory.qmd.paths` 建立 collections，接著在 QMD manager 開啟時執行 `qmd update`，並於之後定期執行（預設每 5 分鐘一次）。這些重新整理會透過 QMD 子程序執行，而不是在程序內爬取檔案系統。語意模式也會執行 `qmd embed`。
- 預設工作區 collection 會追蹤 `MEMORY.md` 加上 `memory/` 樹狀目錄。小寫的 `memory.md` 不會被索引為根記憶檔案。
- QMD 自己的掃描器會忽略隱藏路徑，以及常見的相依性/建置目錄，例如 `.git`、`.cache`、`node_modules`、`vendor`、`dist` 與 `build`。Gateway 啟動時預設不會初始化 QMD，因此冷啟動可避免在首次使用記憶之前匯入記憶執行階段或建立長時間存活的 watcher。
- 如果你仍想要 Gateway 啟動時重新整理，請將 `memory.qmd.update.startup` 設為 `idle` 或 `immediate`。選擇加入的啟動重新整理會使用一次性的 QMD 子程序路徑，而不是建立完整、長時間存活的程序內 watcher。
- 搜尋會使用已設定的 `searchMode`（預設：`search`；也支援 `vsearch` 與 `query`）。`search` 只使用 BM25，因此 OpenClaw 會在該模式中略過語意向量就緒探測與嵌入維護。如果某個模式失敗，OpenClaw 會用 `qmd query` 重試。
- 對於宣告支援多 collection 篩選器的 QMD 版本，OpenClaw 會將相同來源的 collections 分組到一次 QMD 搜尋呼叫中。較舊的 QMD 版本會保留相容的逐 collection 備援。
- 如果 QMD 完全失敗，OpenClaw 會退回內建 SQLite 引擎。重複的聊天回合嘗試會在開啟失敗後短暫退避，因此缺少二進位檔或損壞的 sidecar 相依性不會造成重試風暴；`openclaw memory status` 與一次性 CLI 探測仍會直接重新檢查 QMD。

<Info>
第一次搜尋可能很慢 -- QMD 會在第一次執行 `qmd query` 時自動下載用於重新排序與查詢擴展的 GGUF 模型（約 2 GB）。
</Info>

## 搜尋效能與相容性

OpenClaw 會讓 QMD 搜尋路徑同時相容於目前與較舊的 QMD 安裝。

啟動時，OpenClaw 會針對每個 manager 檢查已安裝的 QMD 說明文字一次。如果二進位檔宣告支援多個 collection 篩選器，OpenClaw 會用一個命令搜尋所有相同來源的 collections：

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

這可避免為每個持久記憶 collection 啟動一個 QMD 子程序。工作階段轉錄 collections 會保留在自己的來源群組中，因此混合 `memory` + `sessions` 搜尋仍會從兩種來源提供結果多樣化器輸入。

較舊的 QMD 建置版本只接受一個 collection 篩選器。當 OpenClaw 偵測到這些建置版本之一時，會保留相容路徑，並分別搜尋每個 collection，再合併與去除重複結果。

若要手動檢查已安裝的合約，請執行：

```bash
qmd --help | grep -i collection
```

目前的 QMD 說明會表示 collection 篩選器可以鎖定一個或多個 collections。較舊的說明通常描述單一 collection。

## 模型覆寫

QMD 模型環境變數會從 Gateway 程序原樣傳遞，因此你可以全域調整 QMD，而不需要新增 OpenClaw 設定：

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

變更嵌入模型後，請重新執行嵌入，讓索引符合新的向量空間。

## 索引額外路徑

將 QMD 指向其他目錄，讓它們可以被搜尋：

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

額外路徑中的片段會在搜尋結果中顯示為 `qmd/<collection>/<relative-path>`。`memory_get` 了解這個前綴，並會從正確的 collection 根目錄讀取。

## 索引工作階段轉錄

啟用工作階段索引以召回較早的對話：

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

轉錄會以經過清理的 User/Assistant 回合匯出到 `~/.openclaw/agents/<id>/qmd/sessions/` 下的專用 QMD collection。

## 搜尋範圍

預設情況下，QMD 搜尋結果會顯示於直接與頻道工作階段（不含群組）。設定 `memory.qmd.scope` 以變更此行為：

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

當範圍拒絕搜尋時，OpenClaw 會記錄一則警告，其中包含推導出的頻道與聊天類型，讓空結果更容易除錯。

## 引用

當 `memory.citations` 為 `auto` 或 `on` 時，搜尋片段會包含 `Source: <path#line>` 頁尾。將 `memory.citations = "off"` 設為關閉即可省略該頁尾，同時仍在內部將路徑傳遞給 agent。

## 何時使用

當你需要以下功能時，請選擇 QMD：

- 重新排序以取得更高品質的結果。
- 搜尋工作區以外的專案文件或筆記。
- 召回過去的工作階段對話。
- 不需 API 金鑰的完全本機搜尋。

對於較簡單的設定，[內建引擎](/zh-TW/concepts/memory-builtin) 不需要額外相依性即可良好運作。

## 疑難排解

**找不到 QMD？** 請確認二進位檔位於 Gateway 的 `PATH` 中。如果 OpenClaw 以服務形式執行，請建立符號連結：
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`。

如果 `qmd --version` 可在你的 shell 中運作，但 OpenClaw 仍回報 `spawn qmd ENOENT`，Gateway 程序的 `PATH` 可能與你的互動式 shell 不同。請明確固定二進位檔：

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

在安裝 QMD 的環境中使用 `command -v qmd`，接著以 `openclaw memory status --deep` 重新檢查。

**第一次搜尋非常慢？** QMD 會在第一次使用時下載 GGUF 模型。請使用與 OpenClaw 相同的 XDG 目錄，以 `qmd query "test"` 預先暖機。

**搜尋期間有許多 QMD 子程序？** 如果可能，請更新 QMD。只有在已安裝的 QMD 宣告支援多個 `-c` 篩選器時，OpenClaw 才會針對相同來源的多 collection 搜尋使用單一程序；否則會為了正確性保留較舊的逐 collection 備援。

**只使用 BM25 的 QMD 仍嘗試建置 llama.cpp？** 請設定 `memory.qmd.searchMode = "search"`。OpenClaw 會將該模式視為僅詞彙模式，不會執行 QMD 向量狀態探測或嵌入維護，並將語意就緒檢查留給 `vsearch` 或 `query` 設定。

**搜尋逾時？** 增加 `memory.qmd.limits.timeoutMs`（預設：4000ms）。較慢的硬體可設為 `120000`。

**群組聊天中結果為空？** 檢查 `memory.qmd.scope` -- 預設只允許直接與頻道工作階段。

**根記憶搜尋突然變得太寬？** 重新啟動 Gateway，或等待下一次啟動協調。OpenClaw 偵測到同名衝突時，會將過時的受管理 collections 重新建立回標準 `MEMORY.md` 與 `memory/` patterns。

**工作區可見的暫存 repos 導致 `ENAMETOOLONG` 或索引損壞？**
QMD traversal 目前遵循底層 QMD 掃描器行為，而不是 OpenClaw 的內建符號連結規則。在 QMD 公開 cycle-safe traversal 或明確排除控制之前，請將暫存 monorepo checkouts 放在 `.tmp/` 等隱藏目錄下，或放在已索引 QMD roots 之外。

## 設定

完整的設定介面（`memory.qmd.*`）、搜尋模式、更新間隔、範圍規則與所有其他旋鈕，請參閱[記憶設定參考](/zh-TW/reference/memory-config)。

## 相關

- [記憶概覽](/zh-TW/concepts/memory)
- [內建記憶引擎](/zh-TW/concepts/memory-builtin)
- [Honcho 記憶](/zh-TW/concepts/memory-honcho)

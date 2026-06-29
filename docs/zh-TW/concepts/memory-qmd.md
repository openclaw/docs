---
read_when:
    - 你想將 QMD 設定為你的記憶後端
    - 你想要進階記憶功能，例如重新排序或額外的索引路徑
summary: 本地優先搜尋輔助程式，具備 BM25、向量、重新排序與查詢擴展
title: QMD 記憶引擎
x-i18n:
    generated_at: "2026-06-28T22:33:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 14af147882829451f026f0b9b6cc052c6e2129626a4ab0d0b1c7b77a31c1c050
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) 是一個本地優先的搜尋 sidecar，會與 OpenClaw
並行執行。它在單一二進位檔中結合 BM25、向量搜尋與重新排序，也能索引工作區記憶檔案以外的內容。

## 相較於內建功能增加了什麼

- **重新排序與查詢擴充**，以提升召回率。
- **索引額外目錄** -- 專案文件、團隊筆記、磁碟上的任何內容。
- **索引工作階段逐字稿** -- 召回先前的對話。
- **完全本地** -- 透過官方 llama.cpp 提供者外掛執行，並
  自動下載 GGUF 模型。
- **自動備援** -- 若 QMD 無法使用，OpenClaw 會無縫退回
  內建引擎。

## 開始使用

### 先決條件

- 安裝 QMD：`npm install -g @tobilu/qmd` 或 `bun install -g @tobilu/qmd`
- 允許擴充功能的 SQLite 建置版本（macOS 上為 `brew install sqlite`）。
- QMD 必須位於閘道的 `PATH` 中。
- macOS 與 Linux 可直接使用。Windows 透過 WSL2 支援最佳。

### 啟用

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw 會在
`~/.openclaw/agents/<agentId>/qmd/` 下建立自足式 QMD 主目錄，並自動管理 sidecar 生命週期 -- 集合、更新與嵌入執行都會代你處理。
它偏好目前的 QMD 集合與 MCP 查詢形狀，但仍會在需要時退回替代的集合模式旗標與較舊的 MCP 工具名稱。
開機時的協調也會在仍存在同名較舊 QMD 集合時，將過時的受管理集合重新建立回其標準模式。

## sidecar 如何運作

- OpenClaw 會從你的工作區記憶檔案與任何已設定的
  `memory.qmd.paths` 建立集合，接著在 QMD 管理器開啟時執行 `qmd update`，並在之後定期執行（預設每 5 分鐘一次）。這些重新整理透過 QMD 子行程執行，而不是行程內檔案系統爬取。語意模式也會執行 `qmd embed`。
- 預設工作區集合會追蹤 `MEMORY.md` 以及 `memory/`
  樹狀目錄。小寫的 `memory.md` 不會作為根記憶檔案被索引。
- QMD 自身的掃描器會忽略隱藏路徑，以及常見的相依性/建置目錄，例如 `.git`、`.cache`、`node_modules`、`vendor`、`dist` 與
  `build`。閘道啟動時預設不會初始化 QMD，因此冷開機會避免在首次使用記憶前匯入記憶執行階段或建立長期存在的監看器。
- 若你仍想在閘道啟動時初始化 QMD，請將
  `memory.qmd.update.startup` 設為 `idle` 或 `immediate`。使用
  `memory.qmd.update.onBoot: true` 時，啟動會執行初始重新整理。使用
  `onBoot: false` 時，啟動會略過該立即重新整理，但在已設定更新或嵌入間隔時仍會開啟長期存在的管理器，讓 QMD 能擁有其一般監看器與計時器。
- 搜尋會使用已設定的 `searchMode`（預設：`search`；也支援
  `vsearch` 與 `query`）。`search` 僅使用 BM25，因此 OpenClaw 會在該模式中略過語意向量就緒探測與嵌入維護。若某模式失敗，OpenClaw 會使用 `qmd query` 重試。
- 當 `searchMode` 為 `query` 時，將 `memory.qmd.rerank` 設為 `false`，即可使用 QMD 不含重新排序器的混合查詢路徑。OpenClaw 會將 `--no-rerank` 傳給直接 QMD 命令列介面路徑，並將 `rerank: false` 傳給 QMD 的 MCP 查詢工具。此選項需要 QMD 2.1 或更新版本。
- 對於標示支援多集合篩選器的 QMD 發行版，OpenClaw 會將同來源集合分組到單一 QMD 搜尋呼叫中。較舊的 QMD 發行版會保留相容的逐集合備援。
- 若 QMD 完全失敗，OpenClaw 會退回內建 SQLite 引擎。
  重複的聊天回合嘗試會在開啟失敗後短暫退避，避免缺少二進位檔或損壞的 sidecar 相依性造成重試風暴；
  `openclaw memory status` 與一次性命令列介面探測仍會直接重新檢查 QMD。

<Info>
首次搜尋可能較慢 -- QMD 會在第一次執行 `qmd query` 時自動下載 GGUF 模型（約 2 GB），用於重新排序與查詢擴充。
</Info>

## 搜尋效能與相容性

OpenClaw 會讓 QMD 搜尋路徑同時相容目前與較舊的 QMD
安裝。

啟動時，OpenClaw 會針對每個管理器檢查一次已安裝 QMD 的說明文字。若該二進位檔標示支援多個集合篩選器，OpenClaw 會用一個命令搜尋所有同來源集合：

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

這可避免為每個持久記憶集合啟動一個 QMD 子行程。
工作階段逐字稿集合會保留在自己的來源群組中，因此混合
`memory` + `sessions` 搜尋仍會把兩種來源的結果提供給結果多樣化器。

較舊的 QMD 建置版本只接受一個集合篩選器。當 OpenClaw 偵測到這類建置版本時，會保留相容路徑，並在合併與去重結果前分別搜尋每個集合。

若要手動檢查已安裝的合約，請執行：

```bash
qmd --help | grep -i collection
```

目前的 QMD 說明表示集合篩選器可指定一個或多個集合。
較舊的說明通常描述單一集合。

## 模型覆寫

QMD 模型環境變數會從閘道行程原樣傳遞，因此你可以在不新增 OpenClaw 設定的情況下全域調整 QMD：

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

變更嵌入模型後，請重新執行嵌入，讓索引符合新的向量空間。

## 索引額外路徑

將 QMD 指向其他目錄，讓它們可被搜尋：

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

額外路徑的片段會在搜尋結果中顯示為 `qmd/<collection>/<relative-path>`。
`memory_get` 能理解此前綴，並從正確的集合根目錄讀取。

## 索引工作階段逐字稿

啟用工作階段索引以召回先前的對話。QMD 需要一般
`memorySearch` 工作階段來源與 QMD 逐字稿匯出器兩者：

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

逐字稿會以已清理的 User/Assistant 回合匯出到
`~/.openclaw/agents/<id>/qmd/sessions/` 下的專用 QMD
集合。僅設定 `memorySearch.experimental.sessionMemory` 不會將逐字稿匯出到 QMD。

工作階段命中仍會依
[`tools.sessions.visibility`](/zh-TW/gateway/config-tools#toolssessions) 篩選。預設的
`tree` 可見性不會暴露不相關的同代理工作階段。若閘道分派的工作階段應可從另一個私訊工作階段召回，請有意地設定
`tools.sessions.visibility: "agent"`。

## 搜尋範圍

預設情況下，QMD 搜尋結果會在直接與頻道工作階段中呈現
（不包含群組）。設定 `memory.qmd.scope` 可變更此行為：

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

當範圍拒絕搜尋時，OpenClaw 會記錄警告，包含推導出的頻道與聊天類型，讓空結果更容易除錯。

## 引用

當 `memory.citations` 為 `auto` 或 `on` 時，搜尋片段會包含
`Source: <path#line>` 頁尾。將 `memory.citations = "off"` 設定為省略頁尾，同時仍在內部將路徑傳給代理。

## 何時使用

在你需要以下能力時選擇 QMD：

- 重新排序，以取得更高品質的結果。
- 搜尋工作區外的專案文件或筆記。
- 召回過去的工作階段對話。
- 不需要 API 金鑰的完全本地搜尋。

對於較簡單的設定，[內建引擎](/zh-TW/concepts/memory-builtin) 在沒有額外相依性的情況下也能良好運作。

## 疑難排解

**找不到 QMD？** 請確認二進位檔位於閘道的 `PATH` 中。若 OpenClaw
以服務方式執行，請建立符號連結：
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`。

若 `qmd --version` 可在你的 shell 中運作，但 OpenClaw 仍回報
`spawn qmd ENOENT`，閘道行程的 `PATH` 可能與你的互動式 shell
不同。請明確固定二進位檔：

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

在安裝 QMD 的環境中使用 `command -v qmd`，接著以
`openclaw memory status --deep` 重新檢查。

**首次搜尋非常慢？** QMD 會在首次使用時下載 GGUF 模型。請使用與 OpenClaw 相同的 XDG 目錄執行 `qmd query "test"` 來預熱。

**搜尋期間出現許多 QMD 子行程？** 若可行，請更新 QMD。OpenClaw 只有在已安裝的 QMD 標示支援多個 `-c` 篩選器時，才會針對同來源多集合搜尋使用單一行程；否則會為了正確性保留較舊的逐集合備援。

**僅 BM25 的 QMD 仍試圖建置 llama.cpp？** 設定
`memory.qmd.searchMode = "search"`。OpenClaw 會將該模式視為僅詞彙搜尋，不會執行 QMD 向量狀態探測或嵌入維護，並將語意就緒檢查留給 `vsearch` 或 `query` 設定。

**搜尋逾時？** 增加 `memory.qmd.limits.timeoutMs`（預設：4000ms）。
對較慢的硬體設定為 `120000`。

**群組聊天中結果為空？** 檢查 `memory.qmd.scope` -- 預設只允許直接與頻道工作階段。

**根記憶搜尋突然變得太廣？** 重新啟動閘道，或等待下一次啟動協調。OpenClaw 在偵測到同名衝突時，會將過時的受管理集合重新建立回標準的 `MEMORY.md` 與 `memory/` 模式。

**工作區可見的暫存 repo 導致 `ENAMETOOLONG` 或索引損壞？**
QMD 遍歷目前遵循底層 QMD 掃描器行為，而不是 OpenClaw 的內建符號連結規則。請將暫存 monorepo checkout 放在 `.tmp/` 這類隱藏目錄下，或放在已索引 QMD 根目錄之外，直到 QMD 暴露循環安全的遍歷或明確排除控制。

## 設定

如需完整設定介面（`memory.qmd.*`）、搜尋模式、更新間隔、範圍規則與所有其他調整項，請參閱
[記憶設定參考](/zh-TW/reference/memory-config)。

## 相關

- [記憶概觀](/zh-TW/concepts/memory)
- [內建記憶引擎](/zh-TW/concepts/memory-builtin)
- [Honcho 記憶](/zh-TW/concepts/memory-honcho)

---
read_when:
    - 您想將 QMD 設定為您的記憶後端
    - 你想要進階記憶功能，例如重新排序或額外的索引路徑
summary: 本機優先的搜尋側車，搭配 BM25、向量、重新排序與查詢擴展
title: QMD 記憶引擎
x-i18n:
    generated_at: "2026-06-27T19:11:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 101a29a88a34ebbb6f9414fc91f599db2a6f098bd8c320737d3c8fbc78785f4a
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) 是一個本地優先的搜尋輔助程序，會與
OpenClaw 一起執行。它在單一二進位檔中結合 BM25、向量搜尋和重新排序，
也可以索引工作區記憶檔以外的內容。

## 相較於內建功能新增了什麼

- **重新排序和查詢擴展**，提升召回率。
- **索引額外目錄** -- 專案文件、團隊筆記、磁碟上的任何內容。
- **索引工作階段逐字稿** -- 回想先前的對話。
- **完全本地** -- 搭配官方 llama.cpp 提供者外掛執行，並
  自動下載 GGUF 模型。
- **自動備援** -- 如果 QMD 無法使用，OpenClaw 會無縫退回到
  內建引擎。

## 開始使用

### 先決條件

- 安裝 QMD：`npm install -g @tobilu/qmd` 或 `bun install -g @tobilu/qmd`
- 允許擴充功能的 SQLite 建置版本（macOS 上使用 `brew install sqlite`）。
- QMD 必須在閘道的 `PATH` 上。
- macOS 和 Linux 可直接使用。Windows 最適合透過 WSL2 支援。

### 啟用

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw 會在 `~/.openclaw/agents/<agentId>/qmd/` 下建立自包含的 QMD 主目錄，
並自動管理輔助程序生命週期 -- 集合、更新和嵌入執行都會代為處理。
它會優先使用目前的 QMD 集合和 MCP 查詢形狀，但必要時仍會退回到
替代集合模式旗標和較舊的 MCP 工具名稱。啟動時的協調也會在仍存在
同名的較舊 QMD 集合時，將過時的受管理集合重新建立回其標準模式。

## 輔助程序如何運作

- OpenClaw 會從你的工作區記憶檔以及任何已設定的 `memory.qmd.paths`
  建立集合，然後在 QMD 管理器開啟時執行 `qmd update`，之後也會定期執行
  （預設每 5 分鐘一次）。這些重新整理會透過 QMD 子程序執行，而不是
  程序內的檔案系統爬取。語意模式也會執行 `qmd embed`。
- 預設工作區集合會追蹤 `MEMORY.md` 加上 `memory/` 樹狀目錄。
  小寫的 `memory.md` 不會作為根記憶檔被索引。
- QMD 自身的掃描器會忽略隱藏路徑，以及常見的相依項目/建置目錄，
  例如 `.git`、`.cache`、`node_modules`、`vendor`、`dist` 和 `build`。
  閘道啟動預設不會初始化 QMD，因此冷啟動會避免在首次使用記憶前
  匯入記憶執行階段或建立長時間存在的監看器。
- 如果你仍想在閘道啟動時初始化 QMD，請將
  `memory.qmd.update.startup` 設為 `idle` 或 `immediate`。使用
  `memory.qmd.update.onBoot: true` 時，啟動會執行初始重新整理。使用
  `onBoot: false` 時，啟動會略過該立即重新整理，但當已設定更新或嵌入
  間隔時仍會開啟長時間存在的管理器，讓 QMD 可以擁有其一般監看器和計時器。
- 搜尋會使用已設定的 `searchMode`（預設：`search`；也支援 `vsearch` 和
  `query`）。`search` 僅使用 BM25，因此 OpenClaw 會在該模式略過語意
  向量就緒探測和嵌入維護。如果某個模式失敗，OpenClaw 會使用 `qmd query`
  重試。
- 當 `searchMode` 是 `query` 時，將 `memory.qmd.rerank` 設為 `false`，
  即可使用不含重新排序器的 QMD 混合查詢路徑。OpenClaw 會將 `--no-rerank`
  傳給直接的 QMD 命令列介面路徑，並將 `rerank: false` 傳給 QMD 的 MCP
  查詢工具。此選項需要 QMD 2.1 或更新版本。
- 搭配宣告支援多集合篩選器的 QMD 發行版本時，OpenClaw 會將同來源集合
  分組到一次 QMD 搜尋呼叫中。較舊的 QMD 發行版本會保留相容的
  個別集合備援。
- 如果 QMD 完全失敗，OpenClaw 會退回到內建 SQLite 引擎。重複的聊天輪次
  嘗試會在開啟失敗後短暫退避，因此缺少二進位檔或損壞的輔助程序相依項目
  不會造成重試風暴；`openclaw memory status` 和一次性命令列介面探測
  仍會直接重新檢查 QMD。

<Info>
第一次搜尋可能會很慢 -- QMD 會在第一次執行 `qmd query` 時自動下載
GGUF 模型（約 2 GB），用於重新排序和查詢擴展。
</Info>

## 搜尋效能與相容性

OpenClaw 會讓 QMD 搜尋路徑同時相容於目前和較舊的 QMD 安裝。

啟動時，OpenClaw 會針對每個管理器檢查一次已安裝的 QMD 說明文字。如果
二進位檔宣告支援多個集合篩選器，OpenClaw 會用一個命令搜尋所有
同來源集合：

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

這會避免為每個持久記憶集合啟動一個 QMD 子程序。工作階段逐字稿集合會
保留在自己的來源群組中，因此混合的 `memory` + `sessions` 搜尋仍會提供
來自兩個來源的結果多樣化輸入。

較舊的 QMD 建置版本只接受一個集合篩選器。當 OpenClaw 偵測到這類建置版本時，
會保留相容性路徑，並在合併和去除重複結果前分別搜尋每個集合。

若要手動檢查已安裝的合約，請執行：

```bash
qmd --help | grep -i collection
```

目前的 QMD 說明會表示集合篩選器可以指向一個或多個集合。
較舊的說明通常會描述單一集合。

## 模型覆寫

QMD 模型環境變數會從閘道程序原樣傳遞，因此你可以在不新增 OpenClaw
設定的情況下全域調整 QMD：

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

變更嵌入模型後，請重新執行嵌入，讓索引符合新的向量空間。

## 索引額外路徑

將 QMD 指向其他目錄，使其可被搜尋：

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

額外路徑中的片段會在搜尋結果中顯示為
`qmd/<collection>/<relative-path>`。`memory_get` 了解此前置詞，
並會從正確的集合根目錄讀取。

## 索引工作階段逐字稿

啟用工作階段索引以回想先前的對話：

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

逐字稿會以清理過的使用者/助理輪次匯出到
`~/.openclaw/agents/<id>/qmd/sessions/` 下的專用 QMD 集合。

## 搜尋範圍

預設情況下，QMD 搜尋結果會顯示在直接和頻道工作階段中
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

當範圍拒絕搜尋時，OpenClaw 會記錄包含衍生頻道和聊天類型的警告，
讓空結果更容易除錯。

## 引用

當 `memory.citations` 是 `auto` 或 `on` 時，搜尋片段會包含
`Source: <path#line>` 頁尾。將 `memory.citations = "off"` 設定為關閉，
即可省略頁尾，同時仍在內部將路徑傳給代理程式。

## 使用時機

在你需要下列項目時選擇 QMD：

- 透過重新排序取得更高品質的結果。
- 搜尋工作區外的專案文件或筆記。
- 回想過去的工作階段對話。
- 不需要 API 金鑰的完全本地搜尋。

對於較簡單的設定，[內建引擎](/zh-TW/concepts/memory-builtin) 不需要額外相依項目，
也能運作良好。

## 疑難排解

**找不到 QMD？** 請確認二進位檔位於閘道的 `PATH` 上。如果 OpenClaw
以服務方式執行，請建立符號連結：
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`。

如果 `qmd --version` 在你的 shell 中可運作，但 OpenClaw 仍回報
`spawn qmd ENOENT`，閘道程序的 `PATH` 可能與互動式 shell 不同。
請明確指定二進位檔：

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

在安裝 QMD 的環境中使用 `command -v qmd`，然後用
`openclaw memory status --deep` 重新檢查。

**第一次搜尋非常慢？** QMD 會在首次使用時下載 GGUF 模型。請使用與
OpenClaw 相同的 XDG 目錄執行 `qmd query "test"` 來預熱。

**搜尋期間出現許多 QMD 子程序？** 若可行，請更新 QMD。只有當已安裝的
QMD 宣告支援多個 `-c` 篩選器時，OpenClaw 才會針對同來源多集合搜尋使用
單一程序；否則會為了正確性保留較舊的個別集合備援。

**僅 BM25 的 QMD 仍嘗試建置 llama.cpp？** 設定
`memory.qmd.searchMode = "search"`。OpenClaw 會將該模式視為僅詞彙搜尋，
不會執行 QMD 向量狀態探測或嵌入維護，並將語意就緒檢查留給 `vsearch`
或 `query` 設定。

**搜尋逾時？** 增加 `memory.qmd.limits.timeoutMs`（預設：4000ms）。
對較慢的硬體可設為 `120000`。

**群組聊天中出現空結果？** 檢查 `memory.qmd.scope` -- 預設只允許直接和
頻道工作階段。

**根記憶搜尋突然變得太廣？** 重新啟動閘道，或等待下一次啟動協調。
當 OpenClaw 偵測到同名衝突時，會將過時的受管理集合重新建立回標準
`MEMORY.md` 和 `memory/` 模式。

**工作區可見的暫存儲存庫造成 `ENAMETOOLONG` 或索引損壞？**
QMD 遍歷目前遵循底層 QMD 掃描器行為，而不是 OpenClaw 的內建符號連結規則。
在 QMD 暴露具循環安全性的遍歷或明確排除控制前，請將暫存 monorepo
簽出放在 `.tmp/` 等隱藏目錄下，或放在已索引的 QMD 根目錄之外。

## 設定

如需完整設定介面（`memory.qmd.*`）、搜尋模式、更新間隔、範圍規則
以及所有其他調整項目，請參閱
[記憶設定參考](/zh-TW/reference/memory-config)。

## 相關

- [記憶概觀](/zh-TW/concepts/memory)
- [內建記憶引擎](/zh-TW/concepts/memory-builtin)
- [Honcho 記憶](/zh-TW/concepts/memory-honcho)

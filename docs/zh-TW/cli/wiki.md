---
read_when:
    - 你想使用 memory-wiki 命令列介面
    - 你正在記錄或變更 `openclaw wiki`
summary: '`openclaw wiki` 的命令列介面參考（memory-wiki vault 狀態、搜尋、編譯、lint、套用、橋接與 Obsidian 輔助工具）'
title: 維基
x-i18n:
    generated_at: "2026-06-27T19:09:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6679a5aad41a19dbcad6075c190c3eb533e3ba13a6d5018d56988a23b2d9023
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

檢查並維護 `memory-wiki` 保存庫。

由內建的 `memory-wiki` 外掛提供。

相關：

- [記憶 Wiki 外掛](/zh-TW/plugins/memory-wiki)
- [記憶概觀](/zh-TW/concepts/memory)
- [命令列介面：memory](/zh-TW/cli/memory)

## 用途

當你需要具備下列能力的已編譯知識保存庫時，請使用 `openclaw wiki`：

- Wiki 原生搜尋與頁面讀取
- 具豐富來源脈絡的綜合摘要
- 矛盾與新鮮度報告
- 從主動記憶外掛進行橋接匯入
- 選用的 Obsidian 命令列介面輔助工具

## 常用命令

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki okf import ./knowledge-catalog/okf/bundles/ga4
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki search "who should I ask about Teams?" --mode route-question
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

openclaw wiki bridge import
openclaw wiki unsafe-local import

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## 命令

### `wiki status`

檢查目前的保存庫模式、健康狀態，以及 Obsidian 命令列介面的可用性。

當你不確定保存庫是否已初始化、橋接模式是否健康，或 Obsidian 整合是否可用時，請先使用此命令。

當橋接模式啟用且設定為讀取記憶成品時，此命令會查詢正在執行的閘道，因此它會看到與代理程式／執行階段記憶相同的主動記憶外掛脈絡。

### `wiki doctor`

執行 Wiki 健康檢查，並顯示設定或保存庫問題。

當橋接模式啟用且設定為讀取記憶成品時，此命令會先查詢正在執行的閘道，再建構報告。已停用的橋接匯入，以及未讀取記憶成品的橋接設定，會維持本機／離線模式。

典型問題包括：

- 已啟用橋接模式但沒有公開記憶成品
- 保存庫版面配置無效或遺失
- 預期使用 Obsidian 模式時，缺少外部 Obsidian 命令列介面

### `wiki init`

建立 Wiki 保存庫版面配置與起始頁面。

這會初始化根結構，包括頂層索引與快取目錄。

### `wiki ingest <path-or-url>`

將內容匯入 Wiki 來源層。

注意事項：

- URL 擷取由 `ingest.allowUrlIngest` 控制
- 匯入的來源頁面會在前置資料中保留來源脈絡
- 啟用時，擷取後可自動執行編譯

### `wiki okf import <path>`

將已解開的 Open Knowledge Format 組合包匯入為 Wiki 概念頁面。

匯入器會讀取 OKF 目錄樹中每個非保留的 `.md` 概念文件，要求必須有非空的 `type` 欄位，並將未知的 OKF `type` 值視為通用概念。保留的 OKF `index.md` 與 `log.md` 檔案不會作為概念匯入。

匯入的頁面會攤平成 `concepts/` 之下，因此現有的 Wiki 編譯、搜尋、取得、摘要與儀表板流程可以立即看到它們。原始 OKF 概念 ID、`type`、`resource`、`tags`、時間戳記、來源路徑，以及完整前置資料都會保留在頁面前置資料中。內部 OKF Markdown 連結會改寫為產生的 Wiki 頁面；損壞或外部連結則保持不變。

範例：

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

重建索引、相關區塊、儀表板與已編譯摘要。

這會在下列位置寫入穩定的機器面向成品：

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

如果啟用 `render.createDashboards`，編譯也會重新整理報告頁面。

### `wiki lint`

檢查保存庫並回報：

- 結構問題
- 來源脈絡缺口
- 矛盾
- 開放問題
- 低信心頁面／主張
- 過期頁面／主張

在有意義的 Wiki 更新後執行此命令。

### `wiki search <query>`

搜尋 Wiki 內容。

行為取決於設定：

- `search.backend`：`shared` 或 `local`
- `search.corpus`：`wiki`、`memory` 或 `all`
- `--mode`：`auto`、`find-person`、`route-question`、`source-evidence` 或
  `raw-claim`

當你需要 Wiki 專屬排名或來源脈絡細節時，請使用 `wiki search`。若只需要一次廣泛的共用回想查詢，且主動記憶外掛公開共用搜尋，請優先使用 `openclaw memory search`。

搜尋模式可協助代理程式選擇正確介面：

- `find-person`：別名、帳號、社群資料、標準 ID，以及人物頁面
- `route-question`：詢問對象／最適用情境提示，以及關係脈絡
- `source-evidence`：來源頁面與結構化證據欄位
- `raw-claim`：含主張／證據中繼資料的結構化主張文字

範例：

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

當結果符合結構化主張時，文字輸出會包含 `Claim:` 與 `Evidence:` 行。JSON 輸出另外會公開 `matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、`evidenceKinds` 與 `evidenceSourceIds`，供代理程式端深入查詢。

### `wiki get <lookup>`

透過 ID 或相對路徑讀取 Wiki 頁面。

範例：

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

套用窄範圍變更，而不進行自由格式頁面手術式編輯。

支援流程包括：

- 建立／更新綜合摘要頁面
- 更新頁面中繼資料
- 附加來源 ID
- 新增問題
- 新增矛盾
- 更新信心／狀態
- 寫入結構化主張

此命令存在的目的，是讓 Wiki 可以安全演進，而不必手動編輯受管理的區塊。

### `wiki bridge import`

從主動記憶外掛將公開記憶成品匯入橋接支援的來源頁面。

當你處於 `bridge` 模式，且想將最新匯出的記憶成品拉入 Wiki 保存庫時，請使用此命令。

對於啟用中的橋接成品讀取，命令列介面會透過閘道 RPC 路由匯入，因此匯入會使用執行階段記憶外掛脈絡。如果橋接匯入已停用，或成品讀取已關閉，命令會保留本機／離線的零匯入行為。

### `wiki unsafe-local import`

在 `unsafe-local` 模式中，從明確設定的本機路徑匯入。

這是刻意設計為實驗性，且僅限同一台機器使用。

### `wiki obsidian ...`

適用於以 Obsidian 友善模式執行的保存庫的 Obsidian 輔助命令。

子命令：

- `status`
- `search`
- `open`
- `command`
- `daily`

當啟用 `obsidian.useOfficialCli` 時，這些命令需要官方 `obsidian` 命令列介面位於 `PATH` 上。

## 實務使用指引

- 當來源脈絡與頁面識別很重要時，使用 `wiki search` + `wiki get`。
- 使用 `wiki apply`，而不是手動編輯受管理的產生區段。
- 在信任矛盾或低信心內容之前，先使用 `wiki lint`。
- 當你希望在大量匯入或來源變更後立即取得新的儀表板與已編譯摘要時，使用 `wiki compile`。
- 當資料目錄、文件匯出或代理程式強化管線已經輸出 OKF Markdown 組合包時，使用 `wiki okf import`。
- 當橋接模式依賴新匯出的記憶成品時，使用 `wiki bridge import`。

## 設定關聯

`openclaw wiki` 的行為由下列項目塑造：

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

請參閱[記憶 Wiki 外掛](/zh-TW/plugins/memory-wiki)以取得完整設定模型。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [記憶 Wiki](/zh-TW/plugins/memory-wiki)

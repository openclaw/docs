---
read_when:
    - 你需要一個用於本機 OpenClaw 狀態的一級備份封存檔
    - 你想要在重設或解除安裝前預覽將包含哪些路徑
summary: '`openclaw backup` 的命令列介面參考（建立本機備份封存檔）'
title: 備份
x-i18n:
    generated_at: "2026-07-12T14:23:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b40206e74b43edd6c1d2b00de3cbe9fcfa053bfbb2ffdff0323fb8c1671c28ea
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

為 OpenClaw 的狀態、設定、驗證設定檔、頻道／供應商認證資訊、工作階段，以及選用的工作區建立本機備份封存檔。

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T08-00-00.000+08-00-openclaw-backup.tar.gz
```

## 注意事項

- 封存檔內嵌一個 `manifest.json`，其中包含解析後的來源路徑與封存檔配置。
- 預設輸出是在目前工作目錄中建立以時間戳記命名的 `.tar.gz` 封存檔。時間戳記檔名使用你電腦的本地時區，並包含 UTC 時差。如果目前工作目錄位於要備份的來源樹狀目錄內，OpenClaw 會改用你的家目錄作為預設封存檔位置。
- 絕不覆寫現有的封存檔。若輸出路徑位於來源狀態／工作區樹狀目錄內，系統會拒絕該路徑，以避免將封存檔本身納入備份。
- `openclaw backup verify <archive>` 會檢查封存檔是否恰好包含一個根層級資訊清單、拒絕路徑遍歷形式的封存路徑與 SQLite 附屬檔案、確認資訊清單宣告的每個酬載皆存在、驗證每個 SQLite 快照的檔案形式，並對標準 OpenClaw 資料庫執行完整的完整性與角色檢查。專用的外掛結構描述會保持不透明，因為它們可能需要擁有者定義的 SQLite 功能。`openclaw backup create --verify` 會在寫入封存檔後立即執行該驗證。
- `openclaw backup create --only-config` 僅備份使用中的 JSON 設定檔。

## 備份內容

`openclaw backup create` 會根據你的本機 OpenClaw 安裝規劃來源：

- 狀態目錄（通常是 `~/.openclaw`）
- 使用中的設定檔路徑
- 當解析後的 `credentials/` 目錄位於狀態目錄之外時，納入該目錄
- 從目前設定中找到的工作區目錄，除非你傳入 `--no-include-workspace`

驗證設定檔與其他個別代理程式的執行階段狀態，會儲存在狀態目錄下的 SQLite 中（`agents/<agentId>/agent/openclaw-agent.sqlite`），因此會自動包含在狀態備份項目中。

`--only-config` 會略過狀態、認證資訊目錄與工作區的探索，並且只封存使用中的設定檔路徑。

OpenClaw 會在建立封存檔前將路徑標準化：如果設定檔、認證資訊目錄或工作區已位於狀態目錄內，就不會將它們重複列為獨立的頂層備份來源。系統會略過不存在的路徑。

建立封存檔時，OpenClaw 會略過已知且持續變動、沒有還原價值的檔案：使用中的代理程式工作階段逐字稿、排程執行記錄、輪替記錄、傳遞佇列、狀態目錄下的通訊端／PID／暫存檔，以及相關的耐久佇列暫存檔。JSON 結果中的 `skippedVolatileCount` 會回報刻意省略的檔案數量。狀態目錄下的 SQLite 資料庫會使用 `VACUUM INTO` 進行壓縮，避免已刪除頁面的殘留內容進入封存檔，且不會複製使用中的 WAL／SHM 檔案。如果某個外掛擁有的資料庫需要目前無法使用且由擁有者定義的 SQLite 功能，系統會以封閉方式失敗，而不會退回原始頁面複製。透過工作區備份納入的 SQLite 檔案會視為工作區檔案複製，不受此壓縮保證涵蓋。

狀態目錄之 `extensions/` 樹狀目錄下已安裝外掛的原始碼與資訊清單檔案會納入備份，但其巢狀的 `node_modules/` 相依套件樹狀目錄會被略過，因為它們是可重新建置的安裝成品。還原封存檔後，如果還原的外掛回報缺少相依套件，請使用 `openclaw plugins update <id>`，或透過 `openclaw plugins install <spec> --force` 重新安裝。

## 無效設定的行為

`openclaw backup` 會略過一般設定預檢，因此即使在復原期間仍可提供協助。工作區探索需要有效的設定，因此當設定檔存在但無效，且仍啟用工作區備份時，`openclaw backup create` 會立即失敗。

若要在此情況下進行部分備份，請使用 `--no-include-workspace` 重新執行：這會繼續將狀態、設定與外部認證資訊目錄納入範圍，同時完全略過工作區探索。

即使設定格式錯誤，`--only-config` 仍可運作，因為它不會為了探索工作區而剖析設定。

## 大小與效能

OpenClaw 不會強制執行內建的最大備份大小或單一檔案大小限制。實際限制來自：

- 寫入暫存封存檔與最終封存檔所需的可用空間
- 走訪大型工作區樹狀目錄並將其壓縮為 `.tar.gz` 所需的時間
- 使用 `--verify` 或 `openclaw backup verify` 重新掃描封存檔所需的時間
- 目的地檔案系統的行為：OpenClaw 優先使用不覆寫的硬連結發布步驟，若不支援硬連結，則退回獨佔複製

大型工作區通常是影響封存檔大小的主要因素。使用 `--no-include-workspace` 可獲得更小、更快的備份，或使用 `--only-config` 建立最小的封存檔。

## 相關內容

- [命令列介面參考](/zh-TW/cli)

---
read_when:
    - 你需要一個針對本機 OpenClaw 狀態的一級備份封存。
    - 你想在重設或解除安裝前預覽會包含哪些路徑
summary: '`openclaw backup` 的命令列介面參考（建立本機備份封存）'
title: 備份
x-i18n:
    generated_at: "2026-07-05T11:06:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48487eb747b88111899106f507b4ce6364b56c65b88da2e33c43fc160c6b17a9
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

為 OpenClaw 狀態、設定、驗證設定檔、頻道/提供者憑證、工作階段，以及選擇性包含的工作區，建立本機備份封存檔。

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

- 封存檔會內嵌一個 `manifest.json`，其中包含已解析的來源路徑和封存檔配置。
- 預設輸出是在目前工作目錄中產生帶有時間戳記的 `.tar.gz` 封存檔。帶有時間戳記的檔名會使用你機器的本機時區，並包含 UTC 偏移量。如果目前工作目錄位於已備份的來源樹內，OpenClaw 會改用你的家目錄作為預設封存檔位置。
- 現有封存檔永遠不會被覆寫。來源狀態/工作區樹內的輸出路徑會被拒絕，以避免自我包含。
- `openclaw backup verify <archive>` 會檢查封存檔是否只包含一個根清單、拒絕遍歷式封存檔路徑，並確認清單宣告的每個酬載都存在於 tarball 中。`openclaw backup create --verify` 會在寫入封存檔後立即執行該驗證。
- `openclaw backup create --only-config` 只會備份作用中的 JSON 設定檔。

## 備份內容

`openclaw backup create` 會從你的本機 OpenClaw 安裝規劃來源：

- 狀態目錄（通常是 `~/.openclaw`）
- 作用中的設定檔路徑
- 當已解析的 `credentials/` 目錄存在於狀態目錄外時
- 從目前設定中探索到的工作區目錄，除非你傳入 `--no-include-workspace`

驗證設定檔和其他每個代理程式的執行階段狀態都位於狀態目錄下的 SQLite 中（`agents/<agentId>/agent/openclaw-agent.sqlite`），因此它們會自動由狀態備份項目涵蓋。

`--only-config` 會略過狀態、憑證目錄和工作區探索，只封存作用中的設定檔路徑。

OpenClaw 會先將路徑標準化，再建立封存檔：如果設定、憑證目錄或工作區已經位於狀態目錄內，它們不會作為個別的頂層備份來源重複收錄。缺少的路徑會被略過。

建立封存檔期間，OpenClaw 會略過已知正在即時變更且沒有還原價值的檔案：作用中的代理程式工作階段逐字稿、排程執行記錄、滾動記錄、傳遞佇列、狀態目錄下的 socket/pid/暫存檔，以及相關的持久佇列暫存檔。JSON 結果的 `skippedVolatileCount` 會回報有多少檔案被刻意省略。狀態目錄下的 SQLite 資料庫會以安全方式建立快照（`VACUUM INTO`），而不是即時複製，因此開啟中的 WAL/SHM 檔不會損壞備份。

狀態目錄的 `extensions/` 樹下已安裝的外掛來源和清單檔會被包含，但其巢狀的 `node_modules/` 相依性樹會被略過，因為它們是可重建的安裝成品。還原封存檔後，如果還原的外掛回報缺少相依性，請使用 `openclaw plugins update <id>`，或使用 `openclaw plugins install <spec> --force` 重新安裝。

## 無效設定行為

`openclaw backup` 會繞過一般設定預檢，因此在復原期間仍能提供協助。工作區探索取決於有效設定，所以當設定檔存在但無效，且工作區備份仍啟用時，`openclaw backup create` 會快速失敗。

在這種情況下若要建立部分備份，請改用 `--no-include-workspace` 重新執行：它會將狀態、設定和外部憑證目錄保留在範圍內，同時完全略過工作區探索。

`--only-config` 也可在設定格式錯誤時運作，因為它不會解析設定來進行工作區探索。

## 大小與效能

OpenClaw 不會強制執行內建的備份大小上限或單檔大小限制。實際限制來自：

- 可用空間需足以寫入暫存封存檔和最終封存檔
- 走訪大型工作區樹並將其壓縮成 `.tar.gz` 所需的時間
- 使用 `--verify` 或 `openclaw backup verify` 重新掃描封存檔所需的時間
- 目的地檔案系統行為：OpenClaw 偏好使用不覆寫的硬連結發布步驟，並在不支援硬連結時退回使用獨占複製

大型工作區通常是封存檔大小的主要因素。使用 `--no-include-workspace` 可取得較小/較快的備份，或使用 `--only-config` 取得最小封存檔。

## 相關

- [命令列介面參考](/zh-TW/cli)

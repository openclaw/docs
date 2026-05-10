---
read_when:
    - 你想要一個完整支援本機 OpenClaw 狀態的備份封存檔
    - 您想在重設或解除安裝前預覽會包含哪些路徑
summary: '`openclaw backup` 的 CLI 參考（建立本機備份封存檔）'
title: 備份
x-i18n:
    generated_at: "2026-05-10T19:27:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c95cf475a563ad4f0a2dbaeda504b265580545c9d3f6f71d2f4d2a183e76a5c
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

為 OpenClaw 狀態、設定、驗證設定檔、頻道/提供者認證資料、工作階段，以及選用的工作區建立本機備份封存檔。

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T00-00-00.000Z-openclaw-backup.tar.gz
```

## 注意事項

- 封存檔包含一個 `manifest.json` 檔案，其中列出解析後的來源路徑與封存檔配置。
- 預設輸出是在目前工作目錄中帶有時間戳記的 `.tar.gz` 封存檔。
- 如果目前工作目錄位於已備份的來源樹內，OpenClaw 會退回使用你的主目錄作為預設封存檔位置。
- 既有封存檔絕不會被覆寫。
- 會拒絕位於來源狀態/工作區樹內的輸出路徑，以避免自我包含。
- `openclaw backup verify <archive>` 會驗證封存檔正好包含一個根資訊清單、拒絕穿越樣式的封存檔路徑，並檢查資訊清單宣告的每個承載項目都存在於 tarball 中。
- `openclaw backup create --verify` 會在寫入封存檔後立即執行該驗證。
- `openclaw backup create --only-config` 只會備份作用中的 JSON 設定檔。

## 備份內容

`openclaw backup create` 會從你的本機 OpenClaw 安裝規劃備份來源：

- OpenClaw 本機狀態解析器傳回的狀態目錄，通常是 `~/.openclaw`
- 作用中的設定檔路徑
- 已解析的 `credentials/` 目錄，當它存在於狀態目錄之外時
- 從目前設定探索到的工作區目錄，除非你傳入 `--no-include-workspace`

模型驗證設定檔已經是狀態目錄的一部分，位於
`agents/<agentId>/agent/auth-profiles.json` 下，因此通常會由狀態備份項目涵蓋。

如果你使用 `--only-config`，OpenClaw 會略過狀態、認證資料目錄與工作區探索，只封存作用中的設定檔路徑。

OpenClaw 會在建立封存檔之前將路徑正規化。如果設定、
認證資料目錄或工作區已經位於狀態目錄內，
它們不會作為個別頂層備份來源重複加入。缺少的路徑會被
略過。

封存檔承載會儲存這些來源樹中的檔案內容，而內嵌的 `manifest.json` 會記錄已解析的絕對來源路徑，以及每個資產使用的封存檔配置。

建立封存檔期間，OpenClaw 會略過已知沒有還原價值的即時變動檔案，包括作用中的代理工作階段逐字稿、cron 執行記錄、滾動記錄、傳遞佇列、狀態目錄下的 socket/pid/temp 檔案，以及相關的持久佇列暫存檔。JSON 結果包含 `skippedVolatileCount`，讓自動化流程可以看出有多少檔案被刻意省略。

狀態目錄的 `extensions/` 樹下已安裝的 Plugin 來源與資訊清單檔案會被包含，但其巢狀 `node_modules/` 相依性樹會被略過。這些相依性是可重建的安裝成品；還原封存檔後，當還原的 Plugin 回報缺少相依性時，請使用 `openclaw plugins update <id>`，或以 `openclaw plugins install <spec> --force` 重新安裝該 Plugin。

## 無效設定行為

`openclaw backup` 會刻意繞過一般設定預檢，讓它在復原期間仍能提供協助。由於工作區探索取決於有效設定，當設定檔存在但無效且工作區備份仍啟用時，`openclaw backup create` 現在會快速失敗。

如果你在這種情況下仍想要部分備份，請重新執行：

```bash
openclaw backup create --no-include-workspace
```

這會將狀態、設定與外部認證資料目錄保留在範圍內，同時
完全略過工作區探索。

如果你只需要設定檔本身的副本，`--only-config` 也能在設定格式錯誤時運作，因為它不依賴解析設定來進行工作區探索。

## 大小與效能

OpenClaw 不會強制執行內建的最大備份大小或單一檔案大小限制。

實務限制來自本機電腦與目的地檔案系統：

- 可用空間，需足以寫入暫存封存檔以及最終封存檔
- 走訪大型工作區樹並將其壓縮成 `.tar.gz` 所需的時間
- 如果你使用 `openclaw backup create --verify` 或執行 `openclaw backup verify`，重新掃描封存檔所需的時間
- 目的地路徑的檔案系統行為。OpenClaw 偏好使用不覆寫的硬連結發布步驟，並在不支援硬連結時退回使用獨占複製

大型工作區通常是封存檔大小的主要驅動因素。如果你想要較小或較快的備份，請使用 `--no-include-workspace`。

若要取得最小的封存檔，請使用 `--only-config`。

## 相關

- [CLI 參考](/zh-TW/cli)

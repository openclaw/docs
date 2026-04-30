---
read_when:
    - 您想要一個用於本機 OpenClaw 狀態的一流備份封存檔
    - 你想在重設或解除安裝前預覽會包含哪些路徑
summary: '`openclaw backup` 的 CLI 參考 (建立本機備份封存檔)'
title: 備份
x-i18n:
    generated_at: "2026-04-30T02:51:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c16f953bb32a1613181448f0e4c6ba8777383bce95bddc856dc7e1c3afe8550
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

建立 OpenClaw 狀態、設定、授權設定檔、頻道/供應者憑證、工作階段，以及選擇性工作區的本機備份封存檔。

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

- 封存檔包含一個 `manifest.json` 檔案，其中含有解析後的來源路徑與封存檔配置。
- 預設輸出是在目前工作目錄中建立具時間戳記的 `.tar.gz` 封存檔。
- 如果目前工作目錄位於已備份的來源樹內，OpenClaw 會改用你的家目錄作為預設封存檔位置。
- 永遠不會覆寫既有封存檔。
- 來源狀態/工作區樹內的輸出路徑會被拒絕，以避免自我包含。
- `openclaw backup verify <archive>` 會驗證封存檔只包含一個根資訊清單、拒絕穿越式封存檔路徑，並檢查資訊清單宣告的每個承載內容都存在於 tarball 中。
- `openclaw backup create --verify` 會在寫入封存檔後立即執行該驗證。
- `openclaw backup create --only-config` 只會備份作用中的 JSON 設定檔。

## 會備份哪些內容

`openclaw backup create` 會從你的本機 OpenClaw 安裝規劃備份來源：

- OpenClaw 本機狀態解析器回傳的狀態目錄，通常是 `~/.openclaw`
- 作用中的設定檔路徑
- 當解析後的 `credentials/` 目錄存在於狀態目錄之外時
- 從目前設定中探索到的工作區目錄，除非你傳入 `--no-include-workspace`

模型授權設定檔已經是狀態目錄的一部分，位於
`agents/<agentId>/agent/auth-profiles.json` 下，因此通常會由狀態備份項目涵蓋。

如果你使用 `--only-config`，OpenClaw 會略過狀態、憑證目錄與工作區探索，只封存作用中的設定檔路徑。

OpenClaw 會在建立封存檔前將路徑正規化。如果設定、憑證目錄或工作區已位於狀態目錄內，它們不會被重複成個別的頂層備份來源。缺少的路徑會被略過。

封存檔承載內容會儲存那些來源樹中的檔案內容，而內嵌的 `manifest.json` 會記錄解析後的絕對來源路徑，以及每個資產使用的封存檔配置。

狀態目錄 `extensions/` 樹下已安裝的 Plugin 原始碼與資訊清單檔案會被包含，但其巢狀 `node_modules/` 相依性樹會被略過。這些相依性是可重建的安裝成品；還原封存檔後，當還原的 Plugin 回報缺少相依性時，請使用 `openclaw plugins update <id>`，或使用 `openclaw plugins install <spec> --force` 重新安裝 Plugin。

## 無效設定行為

`openclaw backup` 會刻意略過一般設定預檢，讓它仍能在復原期間提供協助。由於工作區探索取決於有效設定，現在當設定檔存在但無效，且工作區備份仍啟用時，`openclaw backup create` 會快速失敗。

如果你在這種情況下仍想要部分備份，請重新執行：

```bash
openclaw backup create --no-include-workspace
```

這會將狀態、設定與外部憑證目錄保留在範圍內，同時完全略過工作區探索。

如果你只需要設定檔本身的副本，`--only-config` 在設定格式錯誤時也能運作，因為它不依賴解析設定來進行工作區探索。

## 大小與效能

OpenClaw 不會強制內建的最大備份大小或單檔大小限制。

實務限制來自本機機器與目的地檔案系統：

- 暫存封存檔寫入加上最終封存檔所需的可用空間
- 走訪大型工作區樹並將其壓縮成 `.tar.gz` 所需的時間
- 如果你使用 `openclaw backup create --verify` 或執行 `openclaw backup verify`，重新掃描封存檔所需的時間
- 目的地路徑的檔案系統行為。OpenClaw 偏好採用不覆寫的硬連結發布步驟，並在不支援硬連結時退回到獨占複製

大型工作區通常是封存檔大小的主要因素。如果你想要較小或較快的備份，請使用 `--no-include-workspace`。

若要取得最小的封存檔，請使用 `--only-config`。

## 相關

- [CLI 參考](/zh-TW/cli)

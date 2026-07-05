---
read_when:
    - 正在封裝 OpenClaw.app
    - 偵錯 macOS 閘道 launchd 服務
    - 在 macOS 上安裝閘道命令列介面
summary: macOS 上的閘道執行階段（外部 launchd 服務）
title: macOS 上的閘道
x-i18n:
    generated_at: "2026-07-05T11:26:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1637aaf009383045ce25c0c13d8b39223ea08d5d26b9fa376d2c97f0030c9eb
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app 不會內建節點/Bun 或閘道執行階段。macOS app
預期使用**外部** `openclaw` 命令列介面安裝，不會將閘道作為
子程序啟動，並會管理每位使用者的 launchd 服務來讓閘道
持續執行（或連接到已在執行中的本機閘道）。

## 自動設定

在全新的 Mac 上，於入門設定期間選擇**這台 Mac**。app 會在
閘道精靈之前執行其已簽署、內建的安裝程式指令碼：它會在
`~/.openclaw` 下安裝使用者空間的節點執行階段和相符的 `openclaw` 命令列介面，
然後安裝並啟動每位使用者的 launchd 服務。此路徑不需要
終端機、Homebrew 或管理員權限。

app 只內建安裝程式指令碼，不內建節點或閘道內容；
設定需要網際網路連線，才能下載執行階段和相符的
OpenClaw 套件。

## 手動復原

手動安裝建議使用節點 24；節點 22.19+ 也可運作。全域安裝
`openclaw`：

```bash
npm install -g openclaw@<version>
```

自動設定失敗後，使用**重試設定**。如果仍然失敗，
請使用上述命令手動安裝命令列介面，然後在入門設定中選擇**再次檢查**。

## Launchd（作為 LaunchAgent 的閘道）

標籤：`ai.openclaw.gateway`（預設設定檔），或命名設定檔的
`ai.openclaw.<profile>`。

Plist 位置（每位使用者）：`~/Library/LaunchAgents/ai.openclaw.gateway.plist`
（或 `ai.openclaw.<profile>.plist`）。

macOS app 在本機模式中負責預設設定檔的 LaunchAgent 安裝/更新。
命令列介面也可以直接安裝它：`openclaw gateway install`
（命名設定檔透過 `OPENCLAW_PROFILE` 環境變數選取）。

行為：

- 「OpenClaw 啟用中」會啟用/停用 LaunchAgent。
- 結束 app **不會**停止閘道（launchd 會讓它保持運作）。
- 如果閘道已在設定的連接埠上執行，app 會連接到它，
  而不是啟動新的閘道。

記錄：

- launchd stdout：`~/Library/Logs/openclaw/gateway.log`（設定檔使用
  `gateway-<profile>.log`）
- launchd stderr：已抑制

## 版本相容性

macOS app 會檢查閘道版本是否與自身版本相符。入門設定會在現有命令列介面遺失或
不相容時自動執行受管理的設定。使用**重試設定**來重新執行安裝，
或在修復外部命令列介面後使用**再次檢查**。

## macOS 上的狀態目錄

請將 OpenClaw 狀態保留在本機、非同步的磁碟上。避免使用 iCloud Drive 和其他
雲端同步資料夾；同步延遲和檔案鎖定可能會影響工作階段、
憑證和閘道狀態。

只有在需要覆寫時，才將 `OPENCLAW_STATE_DIR` 設為本機路徑。
`openclaw doctor` 會針對常見的雲端同步狀態路徑發出警告，並建議
移回本機儲存空間。請參閱
[環境變數](/zh-TW/help/environment#path-related-env-vars)和
[Doctor](/zh-TW/gateway/doctor)。

## 偵錯 app 連線能力

從原始碼 checkout 使用 macOS 偵錯命令列介面，以執行與 app 使用相同的閘道
WebSocket 交握和探索邏輯：

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` 接受 `--url`、`--token`、`--timeout`、`--probe` 和 `--json`
（以及用戶端身分覆寫；執行時加上 `--help` 可查看完整清單）。
`discover` 接受 `--timeout`、`--json` 和 `--include-local`。當你需要
區分命令列介面探索與 app 端連線問題時，請將探索輸出與
`openclaw gateway discover --json` 比較。

## 煙霧檢查

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

然後：

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## 相關

- [macOS app](/zh-TW/platforms/macos)
- [閘道 runbook](/zh-TW/gateway)

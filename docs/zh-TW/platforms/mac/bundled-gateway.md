---
read_when:
    - 封裝 OpenClaw.app
    - 偵錯 macOS 閘道 launchd 服務
    - 安裝適用於 macOS 的閘道命令列介面
summary: macOS 上的閘道執行階段（外部 launchd 服務）
title: macOS 上的閘道
x-i18n:
    generated_at: "2026-07-14T13:50:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 30c1ae14d8f8eaab73d0e2b725292d7411c2c8b5e0e0c32ad13989c01340d054
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app 不包含節點或閘道執行階段。macOS App
需要安裝**外部** `openclaw` 命令列介面，不會將閘道作為
子程序啟動，而是管理個別使用者的 launchd 服務，讓閘道持續
執行（或連接至已在執行的本機閘道）。

## 自動設定

在全新的 Mac 上，於初始設定期間選擇 **This Mac**。App 會在閘道精靈啟動前，執行其
已簽署且隨附的安裝程式指令碼：它會安裝
使用者空間的節點執行階段及相符的 `openclaw` 命令列介面至 `~/.openclaw`，
接著安裝並啟動個別使用者的 launchd 服務。此方式不需要
終端機、Homebrew 或管理員權限。

App 僅包含安裝程式指令碼，不包含節點或閘道承載內容；
設定時需要網際網路連線，才能下載執行階段及相符的
OpenClaw 套件。

## 手動復原

手動安裝建議使用節點 24.15+；節點 22.22.3+ 也能運作。全域安裝
`openclaw`：

```bash
npm install -g openclaw@<version>
```

自動設定失敗後，請使用 **Retry setup**。如果仍然失敗，
請使用上述命令手動安裝命令列介面，接著在初始設定中選擇 **Check again**。

## Launchd（將閘道作為 LaunchAgent）

標籤：`ai.openclaw.gateway`（預設設定檔），或命名設定檔使用 `ai.openclaw.<profile>`。

Plist 位置（個別使用者）：`~/Library/LaunchAgents/ai.openclaw.gateway.plist`
（或 `ai.openclaw.<profile>.plist`）。

在本機模式下，macOS App 負責預設設定檔的 LaunchAgent 安裝與更新。
命令列介面也能直接安裝：`openclaw gateway install`
（透過 `OPENCLAW_PROFILE` 環境變數選擇命名設定檔）。

行為：

- "OpenClaw Active" 會啟用／停用 LaunchAgent。
- 結束 App **不會**停止閘道（launchd 會讓它持續執行）。
- 如果閘道已在設定的連接埠上執行，App 會連接至該閘道，
  而不會啟動新的閘道。

記錄：

- launchd 標準輸出：`~/Library/Logs/openclaw/gateway.log`（設定檔使用
  `gateway-<profile>.log`）
- launchd 標準錯誤：已抑制
- 如果主機因重複出現 `EADDRINUSE` 或快速重新啟動而陷入迴圈，請檢查
  是否有重複的 `ai.openclaw.gateway`／`ai.openclaw.node` LaunchAgent，以及
  [閘道疑難排解](/zh-TW/gateway/troubleshooting#macos-launchd-supervisor-loop-with-duplicate-gatewaynode-launchagents)中的
  launchd 標記因應措施。

## 版本相容性

macOS App 會將閘道版本與自身版本進行比對。當現有命令列介面
缺失或不相容時，初始設定會自動執行受管理的設定。使用 **Retry setup**
可重新執行安裝；修復外部命令列介面後，則使用 **Check again**。

## macOS 上的狀態目錄

請將 OpenClaw 狀態保存在本機且未同步的磁碟上。避免使用 iCloud Drive
及其他雲端同步資料夾；同步延遲與檔案鎖定可能會影響工作階段、
認證資訊及閘道狀態。

只有需要覆寫時，才將 `OPENCLAW_STATE_DIR` 設為本機路徑。
`openclaw doctor` 會針對常見的雲端同步狀態路徑發出警告，並建議
移回本機儲存空間。請參閱
[環境變數](/zh-TW/help/environment#path-related-env-vars)及
[Doctor](/zh-TW/gateway/doctor)。

## 偵錯 App 連線能力

從原始碼簽出目錄使用 macOS 偵錯命令列介面，以執行 App 所使用的相同閘道
WebSocket 交握與探索邏輯：

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` 接受 `--url`、`--token`、`--timeout`、`--probe` 和 `--json`
（另有用戶端身分覆寫選項；使用 `--help` 執行可查看完整清單）。
`discover` 接受 `--timeout`、`--json` 和 `--include-local`。需要
區分命令列介面探索與 App 端連線問題時，請將探索輸出與
`openclaw gateway discover --json` 進行比較。

## 基本功能檢查

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

接著：

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## 相關內容

- [macOS App](/zh-TW/platforms/macos)
- [閘道操作手冊](/zh-TW/gateway)

---
read_when:
    - 封裝 OpenClaw.app
    - 偵錯 macOS 閘道 launchd 服務
    - 安裝適用於 macOS 的閘道命令列介面
summary: macOS 上的閘道執行環境（外部 launchd 服務）
title: macOS 上的閘道
x-i18n:
    generated_at: "2026-07-12T14:39:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e6a871678fcbc617cb87dc4f0610419187a0b67cea7105e02a6cde70d44e85f3
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app 不會內建 Node/Bun 或閘道執行階段。macOS App
預期使用**外部**安裝的 `openclaw` 命令列介面，不會將閘道啟動為
子行程，並管理每位使用者專屬的 launchd 服務，讓閘道持續
執行（或連接至已在本機執行的閘道）。

## 自動設定

在全新的 Mac 上，於首次設定期間選擇 **This Mac**。App 會在閘道精靈之前執行其
已簽署且內建的安裝程式指令碼：它會在 `~/.openclaw` 下安裝
使用者空間的 Node 執行階段與相符的 `openclaw` 命令列介面，
接著安裝並啟動每位使用者專屬的 launchd 服務。此流程不需要
終端機、Homebrew 或管理員權限。

App 僅內建安裝程式指令碼，不包含 Node 或閘道承載內容；
設定時需要網際網路連線，以下載執行階段與相符的
OpenClaw 套件。

## 手動復原

手動安裝建議使用 Node 24；Node 22.19+ 也可運作。全域安裝
`openclaw`：

```bash
npm install -g openclaw@<version>
```

自動設定失敗後，請使用 **Retry setup**。如果仍然失敗，
請使用上述命令手動安裝命令列介面，接著在首次設定中選擇 **Check again**。

## Launchd（將閘道設為 LaunchAgent）

標籤：`ai.openclaw.gateway`（預設設定檔），或命名設定檔使用
`ai.openclaw.<profile>`。

Plist 位置（每位使用者）：`~/Library/LaunchAgents/ai.openclaw.gateway.plist`
（或 `ai.openclaw.<profile>.plist`）。

在本機模式中，macOS App 負責預設設定檔的 LaunchAgent 安裝與更新。
命令列介面也可以直接安裝：`openclaw gateway install`
（命名設定檔透過 `OPENCLAW_PROFILE` 環境變數選取）。

行為：

- "OpenClaw Active" 會啟用或停用 LaunchAgent。
- 結束 App **不會**停止閘道（launchd 會讓它持續執行）。
- 如果閘道已在設定的連接埠上執行，App 會連接至該閘道，
  而不是啟動新的閘道。

記錄：

- launchd 標準輸出：`~/Library/Logs/openclaw/gateway.log`（設定檔使用
  `gateway-<profile>.log`）
- launchd 標準錯誤：已抑制
- 如果主機因重複出現 `EADDRINUSE` 或快速重新啟動而陷入迴圈，請檢查
  重複的 `ai.openclaw.gateway` / `ai.openclaw.node` LaunchAgent，以及
  [閘道疑難排解](/zh-TW/gateway/troubleshooting#macos-launchd-supervisor-loop-with-duplicate-gatewaynode-launchagents)
  中的 launchd 標記因應措施。

## 版本相容性

macOS App 會將閘道版本與自身版本進行比對。當現有命令列介面缺少或
不相容時，首次設定會自動執行受管理的設定。使用 **Retry setup**
重複安裝，或在修復外部命令列介面後使用 **Check again**。

## macOS 上的狀態目錄

請將 OpenClaw 狀態保留在本機未同步的磁碟上。避免使用 iCloud Drive 與其他
雲端同步資料夾；同步延遲與檔案鎖定可能影響工作階段、
認證資訊及閘道狀態。

只有在需要覆寫時，才將 `OPENCLAW_STATE_DIR` 設為本機路徑。
`openclaw doctor` 會針對常見的雲端同步狀態路徑發出警告，並建議
移回本機儲存空間。請參閱
[環境變數](/zh-TW/help/environment#path-related-env-vars)與
[Doctor](/zh-TW/gateway/doctor)。

## 偵錯 App 連線

從原始碼簽出目錄使用 macOS 偵錯命令列介面，以測試 App 所使用的相同閘道
WebSocket 交握與探索邏輯：

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` 接受 `--url`、`--token`、`--timeout`、`--probe` 與 `--json`
（另有用戶端身分覆寫選項；使用 `--help` 執行以查看完整清單）。
`discover` 接受 `--timeout`、`--json` 與 `--include-local`。當你需要
區分命令列介面探索問題與 App 端連線問題時，請將探索輸出與
`openclaw gateway discover --json` 進行比較。

## 基本運作檢查

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

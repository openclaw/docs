---
read_when:
    - 封裝 OpenClaw.app
    - 偵錯 macOS 閘道 launchd 服務
    - 安裝適用於 macOS 的閘道命令列介面
summary: macOS 上的閘道執行階段（外部 launchd 服務）
title: macOS 上的閘道
x-i18n:
    generated_at: "2026-07-04T06:23:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a8b646f4cae43cb66acbf3527ef2af9ccaf4b6f2678a464586a110e5e9b3662
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app 不再內建節點/Bun 或閘道執行階段。macOS App
預期使用**外部** `openclaw` 命令列介面安裝，不會將閘道作為
子行程產生，並管理每位使用者的 launchd 服務，以保持閘道
持續執行（或在本機已有閘道執行時附加到現有閘道）。

## 自動設定

在全新的 Mac 上，於入門設定期間選擇 **這台 Mac**。App 會在閘道精靈之前執行其已簽署的
內建安裝程式，在 `~/.openclaw` 下安裝使用者空間的節點執行階段
以及相符的 `openclaw` 命令列介面，然後安裝並啟動
每位使用者的 launchd 服務。此路徑不需要 Terminal、Homebrew 或
管理員存取權。

App 內建的是安裝程式指令碼，而不是節點或閘道酬載。因此設定
需要網際網路連線，以下載執行階段和相符的
OpenClaw 套件。

## 手動復原

手動安裝建議使用節點 24。節點 22 LTS，目前為 `22.19+`，
也可使用。然後全域安裝 `openclaw`：

```bash
npm install -g openclaw@<version>
```

自動設定失敗後，使用 **重試設定**。如果仍然失敗，請使用
上述命令手動安裝命令列介面，然後在入門設定中選擇 **再次檢查**。
節點仍是建議的閘道執行階段。

## Launchd（作為 LaunchAgent 的閘道）

標籤：

- `ai.openclaw.gateway`（或 `ai.openclaw.<profile>`；舊版 `com.openclaw.*` 可能仍會保留）

Plist 位置（每位使用者）：

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  （或 `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`）

管理器：

- macOS App 在本機模式中負責 LaunchAgent 的安裝/更新。
- 命令列介面也可以安裝它：`openclaw gateway install`。

行為：

- 「OpenClaw 啟用」會啟用/停用 LaunchAgent。
- 結束 App **不會** 停止閘道（launchd 會讓它保持執行）。
- 如果設定的連接埠上已有閘道在執行，App 會附加到
  該閘道，而不是啟動新的閘道。

記錄：

- launchd stdout：`~/Library/Logs/openclaw/gateway.log`（設定檔使用 `gateway-<profile>.log`）
- launchd stderr：已抑制

## 版本相容性

macOS App 會根據自身版本檢查閘道版本。當現有命令列介面遺失或
不相容時，入門設定會自動執行受管理的設定。使用 **重試設定** 以重複安裝，或在修復外部命令列介面後使用 **再次檢查**。

## macOS 上的狀態目錄

請將 OpenClaw 狀態保留在本機、非同步的磁碟上。避免使用 iCloud Drive 和其他
雲端同步資料夾，因為同步延遲和檔案鎖定可能會影響工作階段、
憑證和閘道狀態。

只有在需要覆寫時，才將 `OPENCLAW_STATE_DIR` 設為本機路徑。
`openclaw doctor` 會針對常見的雲端同步狀態路徑提出警告，並建議
移回本機儲存。請參閱
[環境變數](/zh-TW/help/environment#path-related-env-vars)和
[Doctor](/zh-TW/gateway/doctor)。

## 偵錯 App 連線能力

從原始碼 checkout 使用 macOS 偵錯命令列介面，以執行與 App 使用的相同閘道
WebSocket 握手和探索邏輯：

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` 接受 `--url`、`--token`、`--timeout` 和 `--json`。`discover`
接受 `--timeout`、`--json` 和 `--include-local`。當你需要將命令列介面探索
與 App 端連線問題分開時，請將探索輸出與 `openclaw gateway discover --json` 比較。

## 基本驗證

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

## 相關內容

- [macOS App](/zh-TW/platforms/macos)
- [閘道執行手冊](/zh-TW/gateway)

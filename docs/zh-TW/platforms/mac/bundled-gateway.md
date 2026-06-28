---
read_when:
    - 封裝 OpenClaw.app
    - 偵錯 macOS 閘道 launchd 服務
    - 安裝 macOS 版閘道命令列介面
summary: macOS 上的閘道執行階段（外部 launchd 服務）
title: macOS 上的閘道
x-i18n:
    generated_at: "2026-06-28T00:12:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5317e82435ecf179407116339507a666957a8e23a07a49665233b22f22f5b155
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app 不再隨附節點/Bun 或閘道執行階段。macOS app
預期使用**外部** `openclaw` 命令列介面安裝，不會將閘道作為
子程序產生，並會管理每位使用者的 launchd 服務，讓閘道
持續執行（或在已有本機閘道執行時附加到該閘道）。

## 安裝命令列介面（本機模式必要）

節點 24 是 Mac 上的預設執行階段。節點 22 LTS，目前為 `22.19+`，仍可相容使用。接著全域安裝 `openclaw`：

```bash
npm install -g openclaw@<version>
```

macOS app 的**安裝命令列介面**按鈕會執行 app
內部使用的相同全域安裝流程：它會先偏好 npm，接著是 pnpm，若 bun 是唯一
偵測到的套件管理器，才會使用 bun。節點仍是建議的閘道執行階段。

## Launchd（閘道作為 LaunchAgent）

標籤：

- `ai.openclaw.gateway`（或 `ai.openclaw.<profile>`；舊版 `com.openclaw.*` 可能仍會保留）

Plist 位置（每位使用者）：

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  （或 `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`）

管理器：

- macOS app 在本機模式中擁有 LaunchAgent 安裝/更新。
- 命令列介面也可以安裝它：`openclaw gateway install`。

行為：

-「OpenClaw Active」會啟用/停用 LaunchAgent。
- 結束 app **不會**停止閘道（launchd 會讓它保持運作）。
- 如果閘道已在設定的連接埠上執行，app 會附加到
  該閘道，而不是啟動新的閘道。

記錄：

- launchd stdout：`~/Library/Logs/openclaw/gateway.log`（設定檔使用 `gateway-<profile>.log`）
- launchd stderr：已抑制

## 版本相容性

macOS app 會依照自身版本檢查閘道版本。如果兩者
不相容，請更新全域命令列介面以符合 app 版本。

## macOS 上的狀態目錄

請將 OpenClaw 狀態保存在本機、未同步的磁碟上。避免使用 iCloud Drive 和其他
雲端同步資料夾，因為同步延遲和檔案鎖定可能影響工作階段、
認證和閘道狀態。

只有在需要覆寫時，才將 `OPENCLAW_STATE_DIR` 設為本機路徑。
`openclaw doctor` 會針對常見的雲端同步狀態路徑發出警告，並建議
移回本機儲存空間。請參閱
[環境變數](/zh-TW/help/environment#path-related-env-vars) 和
[Doctor](/zh-TW/gateway/doctor)。

## 偵錯 app 連線能力

從原始碼 checkout 使用 macOS 偵錯命令列介面，以執行與 app 相同的閘道
WebSocket 交握與探索邏輯：

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` 接受 `--url`、`--token`、`--timeout` 和 `--json`。`discover`
接受 `--timeout`、`--json` 和 `--include-local`。當你需要將命令列介面探索
與 app 端連線問題分開時，請將探索輸出與 `openclaw gateway discover --json` 比較。

## 冒煙檢查

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

## 相關

- [macOS app](/zh-TW/platforms/macos)
- [閘道操作手冊](/zh-TW/gateway)

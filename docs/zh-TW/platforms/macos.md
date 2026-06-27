---
read_when:
    - 實作 macOS 應用程式功能
    - 在 macOS 上變更閘道生命週期或節點橋接
summary: OpenClaw macOS 輔助應用程式（選單列 + 閘道代理程式）
title: macOS 應用程式
x-i18n:
    generated_at: "2026-06-27T19:32:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e637a1ae5ca66dfb6255fb6a233436ae0cf04b972f96446e8dc3d703486c9fa
    source_path: platforms/macos.md
    workflow: 16
---

macOS 應用程式是 OpenClaw 的**選單列夥伴**。它負責權限、在本機管理/附加到閘道（launchd 或手動），並將 macOS 功能以節點形式公開給代理。

## 它的功能

- 在選單列顯示原生通知和狀態。
- 負責 TCC 提示（通知、輔助使用、螢幕錄製、麥克風、語音辨識、自動化/AppleScript）。
- 執行或連線到閘道（本機或遠端）。
- 公開僅限 macOS 的工具（Canvas、Camera、Screen Recording、`system.run`）。
- 在**遠端**模式（launchd）啟動本機節點主機服務，並在**本機**模式停止它。
- 可選擇託管 **PeekabooBridge** 以進行 UI 自動化。
- 依要求透過 npm、pnpm 或 bun 安裝全域命令列介面（`openclaw`）（應用程式偏好 npm，其次是 pnpm，再來是 bun；節點 仍是建議的閘道執行環境）。

## 本機與遠端模式

- **本機**（預設）：如果已有執行中的本機閘道，應用程式會附加到它；否則會透過 `openclaw gateway install` 啟用 launchd 服務。
- **遠端**：應用程式透過 SSH/Tailscale 連線到閘道，且絕不啟動本機程序。
  應用程式會啟動本機**節點主機服務**，讓遠端閘道可以連到這台 Mac。
  應用程式不會將閘道作為子程序產生。
  閘道探索現在會優先使用 Tailscale MagicDNS 名稱，而不是原始 tailnet IP，因此當 tailnet IP 變更時，Mac 應用程式能更可靠地恢復。

## Launchd 控制

應用程式會管理標記為 `ai.openclaw.gateway` 的每使用者 LaunchAgent
（使用 `--profile`/`OPENCLAW_PROFILE` 時則為 `ai.openclaw.<profile>`；舊版 `com.openclaw.*` 仍會卸載）。

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

執行具名設定檔時，將標籤替換為 `ai.openclaw.<profile>`。

如果尚未安裝 LaunchAgent，請從應用程式啟用，或執行
`openclaw gateway install`。

如果閘道反覆消失數分鐘到數小時，且只有在你觸碰 Control UI 或透過 SSH 進入主機後才恢復，請參閱 [Gateway troubleshooting](/zh-TW/gateway/troubleshooting#macos-gateway-silently-stops-responding-then-resumes-when-you-touch-the-dashboard) 中關於 macOS Maintenance Sleep / `ENETDOWN` 當機與 launchd 重新產生保護閘門的疑難排解說明。

## 節點功能（mac）

macOS 應用程式會將自身呈現為節點。常用命令：

- Canvas：`canvas.present`、`canvas.navigate`、`canvas.eval`、`canvas.snapshot`、`canvas.a2ui.*`
- Camera：`camera.snap`、`camera.clip`
- Screen：`screen.snapshot`、`screen.record`
- System：`system.run`、`system.notify`

節點會回報 `permissions` 映射，讓代理可以判斷允許的操作。

節點服務 + 應用程式 IPC：

- 當無頭節點主機服務正在執行（遠端模式）時，它會作為節點連線到閘道 WS。
- `system.run` 透過本機 Unix socket 在 macOS 應用程式（UI/TCC 情境）中執行；提示與輸出會留在應用程式內。

圖示（SCI）：

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## 執行核准（system.run）

`system.run` 由 macOS 應用程式中的**執行核准**控制（設定 → 執行核准）。
安全性 + 詢問 + 允許清單會儲存在 Mac 本機：

```
~/.openclaw/exec-approvals.json
```

範例：

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

注意事項：

- `allowlist` 項目是解析後二進位路徑的 glob 模式，或由 PATH 呼叫命令使用的裸命令名稱。
- 包含 shell 控制或展開語法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）的原始 shell 命令文字會被視為允許清單未命中，並需要明確核准（或將 shell 二進位檔加入允許清單）。
- 在提示中選擇「永遠允許」會將該命令加入允許清單。
- `system.run` 環境覆寫會被篩選（丟棄 `PATH`、`DYLD_*`、`LD_*`、`BASHOPTS`、`FPATH`、`KSH_ENV`、`NODE_OPTIONS`、`NODE_REDIRECT_WARNINGS`、`NODE_REPL_EXTERNAL_MODULE`、`NODE_REPL_HISTORY`、`NODE_V8_COVERAGE`、`PYTHON*`、`PERL*`、`RUBYOPT`、`SHELLOPTS`、`PS4`、`TCLLIBPATH`），然後與應用程式的環境合併。
- 對於 shell 包裝器（`bash|sh|zsh ... -c/-lc`），請求範圍的環境覆寫會縮減為一個小型明確允許清單（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。
- 在允許清單模式中，對於永遠允許的決策，已知的派送包裝器（`env`、`flock`、`nice`、`nohup`、`stdbuf`、`timeout`）會保留內部可執行檔路徑，而不是包裝器路徑。如果無法安全解除包裝，則不會自動保留允許清單項目。

## 深層連結

應用程式會註冊 `openclaw://` URL scheme 供本機動作使用。

### `openclaw://agent`

觸發閘道 `agent` 請求。
__OC_I18N_900004__
查詢參數：

- `message`（必填）
- `sessionKey`（選填）
- `thinking`（選填）
- `deliver` / `to` / `channel`（選填）
- `timeoutSeconds`（選填）
- `key`（選填的無人值守模式金鑰）

安全性：

- 沒有 `key` 時，應用程式會提示確認。
- 沒有 `key` 時，應用程式會對確認提示強制套用較短的訊息限制，並忽略 `deliver` / `to` / `channel`。
- 有有效的 `key` 時，執行會是無人值守（用於個人自動化）。

## 入門流程（典型）

1. 安裝並啟動 **OpenClaw.app**。
2. 完成權限檢查清單（TCC 提示）。
3. 確認**本機**模式已啟用，且閘道正在執行。
4. 如果你想使用終端機存取，請安裝命令列介面。

## 狀態目錄位置（macOS）

避免將 OpenClaw 狀態目錄放在 iCloud 或其他雲端同步資料夾中。
同步支援的路徑可能增加延遲，並偶爾造成工作階段和認證資料的檔案鎖定/同步競態。

建議使用本機非同步狀態路徑，例如：
__OC_I18N_900005__
如果 `openclaw doctor` 偵測到狀態位於：

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

它會發出警告並建議移回本機路徑。

## 建置與開發工作流程（原生）

- `cd apps/macos && swift build`
- `swift run OpenClaw`（或 Xcode）
- 封裝應用程式：`scripts/package-mac-app.sh`

## 偵錯閘道連線能力（macOS 命令列介面）

使用偵錯命令列介面來執行與 macOS 應用程式相同的閘道 WebSocket 交握和探索邏輯，無需啟動應用程式。
__OC_I18N_900006__
連線選項：

- `--url <ws://host:port>`：覆寫設定
- `--mode <local|remote>`：從設定解析（預設：設定或本機）
- `--probe`：強制執行全新的健康探測
- `--timeout <ms>`：請求逾時（預設：`15000`）
- `--json`：用於差異比較的結構化輸出

探索選項：

- `--include-local`：包含原本會被篩選為「本機」的閘道
- `--timeout <ms>`：整體探索視窗（預設：`2000`）
- `--json`：用於差異比較的結構化輸出

<Tip>
與 `openclaw gateway discover --json` 比較，以了解 macOS 應用程式的探索管線（`local.` 加上設定的廣域網域，並具有廣域與 Tailscale Serve 後援）是否不同於節點 命令列介面基於 `dns-sd` 的探索。
</Tip>

## 遠端連線管線（SSH 通道）

當 macOS 應用程式以**遠端**模式執行時，它會開啟 SSH 通道，讓本機 UI 元件可以像連到 localhost 一樣與遠端閘道通訊。

### 控制通道（閘道 WebSocket 連接埠）

- **用途：** 健康檢查、狀態、Web Chat、設定，以及其他控制平面呼叫。
- **本機連接埠：** 閘道連接埠（預設 `18789`），一律穩定。
- **遠端連接埠：** 遠端主機上的相同閘道連接埠。
- **行為：** 沒有隨機本機連接埠；應用程式會重用現有健康通道，或在需要時重新啟動它。
- **SSH 形狀：** `ssh -N -L <local>:127.0.0.1:<remote>` 搭配 BatchMode + ExitOnForwardFailure + keepalive 選項。
- **IP 回報：** SSH 通道使用 loopback，因此閘道會看到節點 IP 為 `127.0.0.1`。如果你想顯示真實用戶端 IP，請使用 **Direct (ws/wss)** 傳輸（請參閱 [macOS remote access](/zh-TW/platforms/mac/remote)）。

設定步驟請參閱 [macOS remote access](/zh-TW/platforms/mac/remote)。通訊協定詳細資訊請參閱 [Gateway protocol](/zh-TW/gateway/protocol)。

## 相關文件

- [Gateway runbook](/zh-TW/gateway)
- [Gateway (macOS)](/zh-TW/platforms/mac/bundled-gateway)
- [macOS permissions](/zh-TW/platforms/mac/permissions)
- [Canvas](/zh-TW/platforms/mac/canvas)

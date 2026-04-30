---
read_when:
    - 實作 macOS 應用程式功能
    - 變更 macOS 上的 Gateway 生命週期或 Node 橋接
summary: OpenClaw macOS 輔助應用程式（選單列 + Gateway 代理程式）
title: macOS 應用程式
x-i18n:
    generated_at: "2026-04-30T03:21:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ed98cd4865f2117728d4349c9be99d9c2e20f4d86a77c80f5ba0b5520eb81cd
    source_path: platforms/macos.md
    workflow: 16
---

macOS 應用程式是 OpenClaw 的**選單列輔助程式**。它負責權限、
在本機管理/連接 Gateway（launchd 或手動），並將 macOS
功能作為 Node 暴露給代理。

## 功能

- 在選單列顯示原生通知與狀態。
- 負責 TCC 提示（通知、輔助使用、螢幕錄製、麥克風、
  語音辨識、自動化/AppleScript）。
- 執行或連線到 Gateway（本機或遠端）。
- 暴露僅限 macOS 的工具（Canvas、Camera、Screen Recording、`system.run`）。
- 在**遠端**模式啟動本機 Node host 服務（launchd），並在**本機**模式停止它。
- 可選擇託管 **PeekabooBridge** 以進行 UI 自動化。
- 依要求透過 npm、pnpm 或 bun 安裝全域 CLI（`openclaw`）（應用程式偏好 npm，其次 pnpm，再來是 bun；Node 仍是建議的 Gateway 執行環境）。

## 本機與遠端模式

- **本機**（預設）：如果已有執行中的本機 Gateway，應用程式會連接到它；
  否則會透過 `openclaw gateway install` 啟用 launchd 服務。
- **遠端**：應用程式透過 SSH/Tailscale 連線到 Gateway，且絕不啟動
  本機程序。
  應用程式會啟動本機 **Node host 服務**，讓遠端 Gateway 可以連到這台 Mac。
  應用程式不會將 Gateway 產生為子程序。
  Gateway 探索現在會優先使用 Tailscale MagicDNS 名稱，而不是原始 tailnet IP，
  因此當 tailnet IP 變更時，Mac 應用程式能更可靠地復原。

## Launchd 控制

應用程式管理標記為 `ai.openclaw.gateway` 的每使用者 LaunchAgent
（使用 `--profile`/`OPENCLAW_PROFILE` 時為 `ai.openclaw.<profile>`；舊版 `com.openclaw.*` 仍會卸載）。

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

執行具名設定檔時，請將標籤替換為 `ai.openclaw.<profile>`。

如果尚未安裝 LaunchAgent，請從應用程式啟用，或執行
`openclaw gateway install`。

## Node 功能（mac）

macOS 應用程式會將自己呈現為 Node。常用命令：

- Canvas：`canvas.present`、`canvas.navigate`、`canvas.eval`、`canvas.snapshot`、`canvas.a2ui.*`
- Camera：`camera.snap`、`camera.clip`
- Screen：`screen.snapshot`、`screen.record`
- System：`system.run`、`system.notify`

Node 會回報 `permissions` 對應，讓代理可以判斷允許哪些操作。

Node 服務 + 應用程式 IPC：

- 當無頭 Node host 服務正在執行（遠端模式）時，它會以 Node 身分連線到 Gateway WS。
- `system.run` 透過本機 Unix socket 在 macOS 應用程式（UI/TCC 情境）中執行；提示 + 輸出會留在應用程式內。

圖表（SCI）：

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## 執行核准（system.run）

`system.run` 由 macOS 應用程式中的**執行核准**控制（設定 → 執行核准）。
安全性 + 詢問 + allowlist 會儲存在 Mac 本機的：

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

- `allowlist` 項目是已解析二進位檔路徑的 glob 模式，或透過 PATH 呼叫的命令裸名。
- 包含 shell 控制或展開語法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）的原始 shell 命令文字會被視為 allowlist 未命中，並需要明確核准（或將 shell 二進位檔加入 allowlist）。
- 在提示中選擇「一律允許」會將該命令加入 allowlist。
- `system.run` 環境覆寫會經過篩選（移除 `PATH`、`DYLD_*`、`LD_*`、`NODE_OPTIONS`、`PYTHON*`、`PERL*`、`RUBYOPT`、`SHELLOPTS`、`PS4`），然後與應用程式的環境合併。
- 對於 shell 包裝器（`bash|sh|zsh ... -c/-lc`），請求範圍的環境覆寫會縮減為一個小型明確 allowlist（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。
- 對於 allowlist 模式中的一律允許決策，已知的分派包裝器（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）會保存內部可執行檔路徑，而不是包裝器路徑。如果無法安全解除包裝，則不會自動保存 allowlist 項目。

## 深層連結

應用程式會註冊 `openclaw://` URL 配置，以供本機動作使用。

### `openclaw://agent`

觸發 Gateway `agent` 請求。
__OC_I18N_900004__
查詢參數：

- `message`（必要）
- `sessionKey`（選用）
- `thinking`（選用）
- `deliver` / `to` / `channel`（選用）
- `timeoutSeconds`（選用）
- `key`（選用的無人值守模式金鑰）

安全性：

- 沒有 `key` 時，應用程式會提示確認。
- 沒有 `key` 時，應用程式會對確認提示強制套用簡短訊息限制，並忽略 `deliver` / `to` / `channel`。
- 使用有效的 `key` 時，執行會是無人值守（適用於個人自動化）。

## 入門流程（典型）

1. 安裝並啟動 **OpenClaw.app**。
2. 完成權限檢查清單（TCC 提示）。
3. 確認**本機**模式已啟用且 Gateway 正在執行。
4. 如果需要終端機存取，請安裝 CLI。

## 狀態目錄位置（macOS）

避免將 OpenClaw 狀態目錄放在 iCloud 或其他雲端同步資料夾中。
同步支援的路徑可能增加延遲，並偶爾導致工作階段和憑證的檔案鎖定/同步競爭。

建議使用本機非同步狀態路徑，例如：
__OC_I18N_900005__
如果 `openclaw doctor` 偵測到狀態位於：

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

它會發出警告，並建議移回本機路徑。

## 建置與開發工作流程（原生）

- `cd apps/macos && swift build`
- `swift run OpenClaw`（或 Xcode）
- 封裝應用程式：`scripts/package-mac-app.sh`

## 偵錯 Gateway 連線能力（macOS CLI）

使用偵錯 CLI 測試 macOS 應用程式所用的同一套 Gateway WebSocket 交握與探索
邏輯，而不需要啟動應用程式。
__OC_I18N_900006__
連線選項：

- `--url <ws://host:port>`：覆寫設定
- `--mode <local|remote>`：從設定解析（預設：設定或本機）
- `--probe`：強制執行新的健康探測
- `--timeout <ms>`：請求逾時（預設：`15000`）
- `--json`：用於比對差異的結構化輸出

探索選項：

- `--include-local`：包含原本會被篩選為「本機」的 Gateway
- `--timeout <ms>`：整體探索時間窗（預設：`2000`）
- `--json`：用於比對差異的結構化輸出

<Tip>
與 `openclaw gateway discover --json` 比較，以查看 macOS 應用程式的探索管線（`local.` 加上已設定的廣域網域，並帶有廣域與 Tailscale Serve 備援）是否不同於 Node CLI 基於 `dns-sd` 的探索。
</Tip>

## 遠端連線管線（SSH 通道）

當 macOS 應用程式以**遠端**模式執行時，它會開啟 SSH 通道，讓本機 UI
元件可以像 Gateway 位於 localhost 上一樣與遠端 Gateway 通訊。

### 控制通道（Gateway WebSocket 連接埠）

- **用途：**健康檢查、狀態、Web Chat、設定，以及其他控制平面呼叫。
- **本機連接埠：**Gateway 連接埠（預設 `18789`），始終穩定。
- **遠端連接埠：**遠端主機上的相同 Gateway 連接埠。
- **行為：**沒有隨機本機連接埠；應用程式會重用現有健康通道，
  或在需要時重新啟動它。
- **SSH 形狀：**`ssh -N -L <local>:127.0.0.1:<remote>`，搭配 BatchMode +
  ExitOnForwardFailure + keepalive 選項。
- **IP 回報：**SSH 通道使用 loopback，因此 Gateway 會看到 Node
  IP 為 `127.0.0.1`。如果希望顯示真實用戶端
  IP，請使用**直接（ws/wss）**傳輸（請參閱 [macOS 遠端存取](/zh-TW/platforms/mac/remote)）。

設定步驟請參閱 [macOS 遠端存取](/zh-TW/platforms/mac/remote)。通訊協定
詳細資料請參閱 [Gateway 通訊協定](/zh-TW/gateway/protocol)。

## 相關文件

- [Gateway 作業手冊](/zh-TW/gateway)
- [Gateway（macOS）](/zh-TW/platforms/mac/bundled-gateway)
- [macOS 權限](/zh-TW/platforms/mac/permissions)
- [Canvas](/zh-TW/platforms/mac/canvas)

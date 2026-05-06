---
read_when:
    - 實作 macOS 應用程式功能
    - 變更 macOS 上的 Gateway 生命週期或 Node 橋接
summary: OpenClaw macOS 配套應用程式（選單列 + Gateway 代理程式）
title: macOS 應用程式
x-i18n:
    generated_at: "2026-05-06T02:53:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b7a49338aa710f406b7ad3303bb98e61cc63864e7cf08d656b7a49d37caa3d0
    source_path: platforms/macos.md
    workflow: 16
---

macOS app 是 OpenClaw 的**選單列伴隨程式**。它負責權限、
在本機管理／附加至 Gateway（launchd 或手動），並將 macOS
能力以 Node 形式公開給代理程式。

## 它的功能

- 在選單列顯示原生通知與狀態。
- 負責 TCC 提示（通知、輔助使用、螢幕錄製、麥克風、
  語音辨識、自動化／AppleScript）。
- 執行或連線至 Gateway（本機或遠端）。
- 公開僅限 macOS 的工具（Canvas、Camera、Screen Recording、`system.run`）。
- 在**遠端**模式中啟動本機 Node 主機服務（launchd），並在**本機**模式中停止它。
- 可選擇託管 **PeekabooBridge** 以進行 UI 自動化。
- 依請求透過 npm、pnpm 或 bun 安裝全域 CLI（`openclaw`）（app 偏好 npm，其次是 pnpm，再其次是 bun；Node 仍是建議的 Gateway 執行階段）。

## 本機與遠端模式

- **本機**（預設）：如果有正在執行的本機 Gateway，app 會附加至它；
  否則會透過 `openclaw gateway install` 啟用 launchd 服務。
- **遠端**：app 透過 SSH/Tailscale 連線至 Gateway，且永不啟動
  本機程序。
  app 會啟動本機 **Node 主機服務**，讓遠端 Gateway 可以連到這台 Mac。
  app 不會將 Gateway 生為子程序。
  Gateway 探索現在會優先使用 Tailscale MagicDNS 名稱，而不是原始 tailnet IP，
  因此當 tailnet IP 變更時，Mac app 能更可靠地復原。

## Launchd 控制

app 會管理每位使用者的 LaunchAgent，標籤為 `ai.openclaw.gateway`
（使用 `--profile`/`OPENCLAW_PROFILE` 時則為 `ai.openclaw.<profile>`；舊版 `com.openclaw.*` 仍會卸載）。

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

執行具名設定檔時，請將標籤替換為 `ai.openclaw.<profile>`。

如果尚未安裝 LaunchAgent，請從 app 啟用它，或執行
`openclaw gateway install`。

## Node 能力（mac）

macOS app 會將自己呈現為 Node。常見命令：

- Canvas：`canvas.present`、`canvas.navigate`、`canvas.eval`、`canvas.snapshot`、`canvas.a2ui.*`
- Camera：`camera.snap`、`camera.clip`
- Screen：`screen.snapshot`、`screen.record`
- System：`system.run`、`system.notify`

Node 會回報 `permissions` 對應表，讓代理程式可以判斷允許哪些操作。

Node 服務 + app IPC：

- 當無頭 Node 主機服務正在執行（遠端模式）時，它會以 Node 身分連線至 Gateway WS。
- `system.run` 會透過本機 Unix socket 在 macOS app 中執行（UI/TCC 情境）；提示 + 輸出會留在 app 內。

圖表（SCI）：

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## 執行核准（system.run）

`system.run` 由 macOS app 中的**執行核准**控制（設定 → 執行核准）。
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

- `allowlist` 項目是解析後二進位路徑的 glob 模式，或是透過 PATH 呼叫命令時的裸命令名稱。
- 包含 shell 控制或展開語法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）的原始 shell 命令文字會被視為允許清單未命中，並需要明確核准（或將 shell 二進位檔加入允許清單）。
- 在提示中選擇「永遠允許」會將該命令加入允許清單。
- `system.run` 環境覆寫會被篩選（丟棄 `PATH`、`DYLD_*`、`LD_*`、`NODE_OPTIONS`、`PYTHON*`、`PERL*`、`RUBYOPT`、`SHELLOPTS`、`PS4`），然後與 app 的環境合併。
- 對於 shell 包裝器（`bash|sh|zsh ... -c/-lc`），請求範圍的環境覆寫會縮減為小型明確允許清單（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。
- 在允許清單模式中，對永遠允許的決策，已知派送包裝器（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）會保存內部可執行檔路徑，而不是包裝器路徑。如果無法安全解除包裝，則不會自動保存任何允許清單項目。

## 深層連結

app 會註冊 `openclaw://` URL scheme 以執行本機動作。

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

- 沒有 `key` 時，app 會提示確認。
- 沒有 `key` 時，app 會對確認提示強制套用短訊息限制，並忽略 `deliver` / `to` / `channel`。
- 使用有效的 `key` 時，執行為無人值守（適用於個人自動化）。

## 入門流程（典型）

1. 安裝並啟動 **OpenClaw.app**。
2. 完成權限檢查清單（TCC 提示）。
3. 確認**本機**模式已啟用且 Gateway 正在執行。
4. 如果你想要終端機存取，請安裝 CLI。

## 狀態目錄位置（macOS）

避免將你的 OpenClaw 狀態目錄放在 iCloud 或其他雲端同步資料夾中。
同步支援的路徑可能會增加延遲，且偶爾會造成工作階段與憑證的檔案鎖定／同步競態。

偏好使用本機非同步狀態路徑，例如：
__OC_I18N_900005__
如果 `openclaw doctor` 偵測到狀態位於：

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

它會發出警告並建議移回本機路徑。

## 建置與開發工作流程（原生）

- `cd apps/macos && swift build`
- `swift run OpenClaw`（或 Xcode）
- 封裝 app：`scripts/package-mac-app.sh`

## 偵錯 Gateway 連線能力（macOS CLI）

使用偵錯 CLI 來測試與 macOS app 相同的 Gateway WebSocket 交握與探索
邏輯，而不啟動 app。
__OC_I18N_900006__
連線選項：

- `--url <ws://host:port>`：覆寫設定
- `--mode <local|remote>`：從設定解析（預設：設定或本機）
- `--probe`：強制全新健康探測
- `--timeout <ms>`：請求逾時（預設：`15000`）
- `--json`：用於差異比對的結構化輸出

探索選項：

- `--include-local`：包含原本會被篩選為「本機」的 Gateway
- `--timeout <ms>`：整體探索視窗（預設：`2000`）
- `--json`：用於差異比對的結構化輸出

<Tip>
與 `openclaw gateway discover --json` 比較，以查看 macOS app 的探索管線（`local.` 加上已設定的廣域網域，並具備廣域與 Tailscale Serve 後援）是否不同於 Node CLI 的 `dns-sd` 探索。
</Tip>

## 遠端連線管線（SSH 通道）

當 macOS app 在**遠端**模式中執行時，它會開啟 SSH 通道，讓本機 UI
元件可以像 Gateway 在 localhost 上一樣與遠端 Gateway 通訊。

### 控制通道（Gateway WebSocket 連接埠）

- **用途：**健康檢查、狀態、Web Chat、設定，以及其他控制平面呼叫。
- **本機連接埠：**Gateway 連接埠（預設 `18789`），始終穩定。
- **遠端連接埠：**遠端主機上的相同 Gateway 連接埠。
- **行為：**沒有隨機本機連接埠；app 會重用現有健康通道，
  或在需要時重新啟動它。
- **SSH 形態：**`ssh -N -L <local>:127.0.0.1:<remote>`，搭配 BatchMode +
  ExitOnForwardFailure + keepalive 選項。
- **IP 回報：**SSH 通道使用 loopback，因此 gateway 會看到 Node
  IP 為 `127.0.0.1`。如果你想讓真實用戶端 IP 出現，請使用 **Direct (ws/wss)** 傳輸（請參閱 [macOS 遠端存取](/zh-TW/platforms/mac/remote)）。

設定步驟請參閱 [macOS 遠端存取](/zh-TW/platforms/mac/remote)。協定
詳細資訊請參閱 [Gateway 協定](/zh-TW/gateway/protocol)。

## 相關文件

- [Gateway runbook](/zh-TW/gateway)
- [Gateway (macOS)](/zh-TW/platforms/mac/bundled-gateway)
- [macOS 權限](/zh-TW/platforms/mac/permissions)
- [Canvas](/zh-TW/platforms/mac/canvas)

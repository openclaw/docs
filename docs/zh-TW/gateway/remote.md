---
read_when:
    - 執行或疑難排解遠端閘道設定
summary: 使用閘道 WS、SSH 通道與 tailnet 進行遠端存取
title: 遠端存取
x-i18n:
    generated_at: "2026-06-27T19:20:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5f885026fe76acb46f49955c6e485e08714a5cc5e90c165d20e25cea1acf864
    source_path: gateway/remote.md
    workflow: 16
---

此儲存庫支援遠端閘道存取，做法是在專用主機（桌面/伺服器）上保持單一閘道（主節點）執行，並讓用戶端連線到它。

- 對於**操作員（你 / macOS 應用程式）**：當閘道可連線時，直接使用 LAN/Tailnet WebSocket 最簡單；SSH 通道是通用的備援方案。
- 對於**節點（iOS/Android 和未來裝置）**：連線到閘道 **WebSocket**（視需要使用 LAN/tailnet 或 SSH 通道）。

## 核心概念

- 閘道 WebSocket 通常會在你設定的連接埠上繫結到 **loopback**（預設為 18789）。
- 若要遠端使用，請透過 Tailscale Serve 或受信任的 LAN/Tailnet 繫結公開它，或透過 SSH 轉發 loopback 連接埠。

## 常見 VPN 與 tailnet 設定

把**閘道主機**想成代理程式所在的位置。它擁有工作階段、驗證設定檔、頻道和狀態。你的筆記型電腦、桌上型電腦和節點會連線到該主機。

### tailnet 中的常駐閘道

在持續運作的主機（VPS 或家用伺服器）上執行閘道，並透過 **Tailscale** 或 SSH 存取。

- **最佳使用體驗：**保留 `gateway.bind: "loopback"`，並為控制 UI 使用 **Tailscale Serve**。
- **受信任的 LAN/Tailnet：**將閘道繫結到私人介面，並使用 `gateway.remote.transport: "direct"` 直接連線。
- **備援：**保留 loopback，並從任何需要存取的機器建立 SSH 通道。
- **範例：**[exe.dev](/zh-TW/install/exe-dev)（簡易 VM）或 [Hetzner](/zh-TW/install/hetzner)（生產 VPS）。

適合筆記型電腦經常睡眠，但你希望代理程式常駐執行的情境。

### 家用桌面執行閘道

筆記型電腦**不**執行代理程式。它會遠端連線：

- 使用 macOS 應用程式的遠端模式（Settings → General → OpenClaw runs）。
- 當閘道可透過 LAN/Tailnet 連線時，應用程式會直接連線；當你選擇 SSH 時，它會開啟並管理 SSH 通道。

操作手冊：[macOS 遠端存取](/zh-TW/platforms/mac/remote)。

### 筆記型電腦執行閘道

讓閘道保持在本機，但安全地公開它：

- 從其他機器建立到筆記型電腦的 SSH 通道，或
- 使用 Tailscale Serve 公開控制 UI，並讓閘道僅限 loopback。

指南：[Tailscale](/zh-TW/gateway/tailscale) 和 [Web 概覽](/zh-TW/web)。

## 命令流程（在哪裡執行什麼）

一個閘道服務擁有狀態 + 頻道。節點是周邊裝置。

流程範例（Telegram → 節點）：

- Telegram 訊息抵達**閘道**。
- 閘道執行**代理程式**，並決定是否呼叫節點工具。
- 閘道透過閘道 WebSocket（`node.*` RPC）呼叫**節點**。
- 節點回傳結果；閘道回覆到 Telegram。

注意事項：

- **節點不執行閘道服務。**除非你刻意執行隔離的設定檔，否則每台主機只應執行一個閘道（請參閱[多個閘道](/zh-TW/gateway/multiple-gateways)）。
- macOS 應用程式的「節點模式」只是透過閘道 WebSocket 連線的節點用戶端。

## SSH 通道（命令列介面 + 工具）

建立到遠端閘道 WS 的本機通道：

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

通道啟動後：

- `openclaw health` 和 `openclaw status --deep` 現在會透過 `ws://127.0.0.1:18789` 連到遠端閘道。
- `openclaw gateway status`、`openclaw gateway health`、`openclaw gateway probe` 和 `openclaw gateway call` 也可在需要時透過 `--url` 指向轉發後的 URL。

<Note>
將 `18789` 替換為你設定的 `gateway.port`（或 `--port` 或 `OPENCLAW_GATEWAY_PORT`）。
</Note>

<Warning>
當你傳入 `--url` 時，命令列介面不會回退使用設定或環境憑證。請明確包含 `--token` 或 `--password`。缺少明確憑證會導致錯誤。
</Warning>

## 命令列介面遠端預設值

你可以保存遠端目標，讓命令列介面命令預設使用它：

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

當閘道僅限 loopback 時，請將 URL 保持為 `ws://127.0.0.1:18789`，並先開啟 SSH 通道。
在 macOS 應用程式的 SSH 通道傳輸中，探索到的閘道主機名稱屬於
`gateway.remote.sshTarget`；`gateway.remote.url` 仍是本機通道 URL。
如果這些連接埠不同，請將 `gateway.remote.remotePort` 設為 SSH 主機上的閘道連接埠。

對於已可透過受信任 LAN 或 Tailnet 存取的閘道，請使用直接模式：

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      transport: "direct",
      url: "ws://192.168.0.202:18789",
      token: "your-token",
    },
  },
}
```

## 憑證優先順序

閘道憑證解析在 call/probe/status 路徑和 Discord exec-approval 監控中遵循同一份共用合約。Node-host 使用相同的基礎合約，但有一個本機模式例外（它會刻意忽略 `gateway.remote.*`）：

- 明確憑證（`--token`、`--password` 或工具 `gatewayToken`）在接受明確驗證的呼叫路徑上永遠優先。
- URL 覆寫安全性：
  - 命令列介面 URL 覆寫（`--url`）絕不重用隱含的設定/env 憑證。
  - Env URL 覆寫（`OPENCLAW_GATEWAY_URL`）只能使用 env 憑證（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）。
- 本機模式預設值：
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`（只有在本機驗證 token 輸入未設定時，才會套用遠端備援）
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`（只有在本機驗證 password 輸入未設定時，才會套用遠端備援）
- 遠端模式預設值：
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-host 本機模式例外：`gateway.remote.token` / `gateway.remote.password` 會被忽略。
- 遠端 probe/status token 檢查預設是嚴格的：以遠端模式為目標時，它們只使用 `gateway.remote.token`（沒有本機 token 備援）。
- 閘道 env 覆寫只使用 `OPENCLAW_GATEWAY_*`。

## 聊天 UI 遠端存取

WebChat 不再使用獨立的 HTTP 連接埠。SwiftUI 聊天 UI 會直接連線到閘道 WebSocket。

- 透過 SSH 轉發 `18789`（見上方），然後將用戶端連線到 `ws://127.0.0.1:18789`。
- 對於 LAN/Tailnet 直接模式，將用戶端連線到設定的私人 `ws://` 或安全 `wss://` URL。
- 在 macOS 上，建議使用應用程式的遠端模式，它會自動管理選取的傳輸方式。

## macOS 應用程式遠端模式

macOS 選單列應用程式可以端到端驅動相同設定（遠端狀態檢查、WebChat 和 Voice Wake 轉發）。

操作手冊：[macOS 遠端存取](/zh-TW/platforms/mac/remote)。

## 安全規則（遠端/VPN）

簡短版：除非你確定需要繫結，否則**讓閘道僅限 loopback**。

- **Loopback + SSH/Tailscale Serve** 是最安全的預設值（沒有公開暴露）。
- 明文 `ws://` 可用於 loopback、LAN、link-local、`.local`、`.ts.net` 和 Tailscale CGNAT 主機。公開遠端主機必須使用 `wss://`。
- **非 loopback 繫結**（`lan`/`tailnet`/`custom`，或 loopback 不可用時的 `auto`）必須使用閘道驗證：token、password，或具身分感知能力的反向代理，並設定 `gateway.auth.mode: "trusted-proxy"`。
- `gateway.remote.token` / `.password` 是用戶端憑證來源。它們本身**不會**設定伺服器驗證。
- 本機呼叫路徑只有在 `gateway.auth.*` 未設定時，才能使用 `gateway.remote.*` 作為備援。
- 如果 `gateway.auth.token` / `gateway.auth.password` 明確透過 SecretRef 設定且無法解析，解析會失敗關閉（不會用遠端備援遮蔽）。
- 使用 `wss://` 時，`gateway.remote.tlsFingerprint` 會釘選遠端 TLS 憑證，包括 macOS 直接模式。若未設定或先前未儲存釘選，macOS 只會在通過一般系統信任後釘選首次使用的憑證；macOS 尚未信任的自簽或私人 CA 閘道需要明確指紋，或使用透過 SSH 的遠端模式。
- **Tailscale Serve** 可在 `gateway.auth.allowTailscale: true` 時，透過身分
  標頭驗證控制 UI/WebSocket 流量；HTTP API 端點不使用該 Tailscale 標頭驗證，
  而是遵循閘道的一般 HTTP 驗證模式。此無 token 流程假設閘道主機受信任。
  如果你希望所有地方都使用共用密鑰驗證，請將其設為 `false`。
- **Trusted-proxy** 驗證預設預期非 loopback 的身分感知代理設定。
  同主機 loopback 反向代理需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`。
- 將瀏覽器控制視為操作員存取：僅限 tailnet + 明確的節點配對。

深入說明：[安全性](/zh-TW/gateway/security)。

### macOS：透過 LaunchAgent 建立持久 SSH 通道

對於連線到遠端閘道的 macOS 用戶端，最簡單的持久設定是使用 SSH `LocalForward` 設定項目，加上 LaunchAgent，讓通道在重新開機和當機後仍保持運作。

#### 步驟 1：新增 SSH 設定

編輯 `~/.ssh/config`：

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

將 `<REMOTE_IP>` 和 `<REMOTE_USER>` 替換為你的值。

#### 步驟 2：複製 SSH 金鑰（一次性）

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### 步驟 3：設定閘道 token

將 token 儲存在設定中，使其在重新啟動後仍保留：

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### 步驟 4：建立 LaunchAgent

將此儲存為 `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### 步驟 5：載入 LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

通道會在登入時自動啟動，在當機時重新啟動，並保持轉發連接埠可用。

<Note>
如果你有較舊設定留下的 `com.openclaw.ssh-tunnel` LaunchAgent，請卸載並刪除它。
</Note>

#### 疑難排解

檢查通道是否正在執行：

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

重新啟動通道：

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

停止通道：

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| 設定項目                             | 功能                                                         |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | 將本機連接埠 18789 轉發到遠端連接埠 18789                  |
| `ssh -N`                             | 不執行遠端命令的 SSH（僅限連接埠轉發）                      |
| `KeepAlive`                          | 如果通道當機，會自動重新啟動通道                            |
| `RunAtLoad`                          | LaunchAgent 在登入時載入時啟動通道                          |

## 相關

- [Tailscale](/zh-TW/gateway/tailscale)
- [驗證](/zh-TW/gateway/authentication)
- [遠端閘道設定](/zh-TW/gateway/remote-gateway-readme)

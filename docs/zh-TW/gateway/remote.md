---
read_when:
    - 執行或疑難排解遠端閘道設定
summary: 使用閘道 WS、SSH 通道與 tailnet 進行遠端存取
title: 遠端存取
x-i18n:
    generated_at: "2026-07-05T11:23:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78daaad7bcb9f80072eaa2d6946bff9f28ba1ec4f95a68edb0d24cf7f9c3fec2
    source_path: gateway/remote.md
    workflow: 16
---

OpenClaw 會在一台主機上執行一個閘道（主控端），並讓每個用戶端都連線到它。閘道擁有工作階段、驗證設定檔、頻道與狀態；其他所有元件都是用戶端。

- **操作者**（你，或 macOS 應用程式）：當閘道可連線時，直接 LAN/Tailnet WebSocket 最簡單；SSH 通道是通用的備援方式。
- **節點**（iOS/Android 與其他裝置）：連線到閘道 **WebSocket**（LAN/tailnet 或 SSH 通道）。

## 核心概念

閘道 WebSocket 預設會繫結到**回送介面**，連接埠為 `18789`（`gateway.port`）。若要遠端使用，請透過 Tailscale Serve / 受信任的 LAN-Tailnet 繫結公開它，或透過 SSH 轉送回送連接埠。

## 拓撲選項

| 設定                              | 閘道執行的位置                                                                                              | 最適合                                                                                                                                              |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 在你的 tailnet 中常駐的閘道       | 常駐主機（VPS 或家用伺服器），透過 Tailscale 或 SSH 連線                                                    | 經常睡眠但需要代理常駐的筆電。請參閱 [exe.dev](/zh-TW/install/exe-dev)（簡易 VM）或 [Hetzner](/zh-TW/install/hetzner)（正式環境 VPS）。                         |
| 家用桌機                          | 桌機；筆電透過 macOS 應用程式的遠端模式連線（Settings → Connection → OpenClaw runs）                        | 將代理保留在會持續開機的硬體上。執行手冊：[macOS 遠端存取](/zh-TW/platforms/mac/remote)。                                                                 |
| 筆電                              | 筆電，透過 SSH 通道或 Tailscale Serve 安全公開（保留 `gateway.bind: "loopback"`）                            | 單機設定。請參閱 [Tailscale](/zh-TW/gateway/tailscale) 與 [網頁](/zh-TW/web)。                                                                                  |

對於常駐與筆電設定，建議保留 `gateway.bind: "loopback"`，並使用 **Tailscale Serve** 提供控制 UI，或搭配 `gateway.remote.transport: "direct"` 使用受信任的 LAN/Tailnet 繫結。SSH 通道是可在任何機器上運作的備援方式。

## 命令流程（哪些東西在哪裡執行）

一個閘道擁有狀態與頻道；節點是周邊裝置。範例（Telegram 訊息路由到節點工具）：

1. Telegram 訊息抵達**閘道**。
2. 閘道執行**代理**，由它決定是否呼叫節點工具。
3. 閘道透過閘道 WebSocket（`node.invoke` RPC）呼叫**節點**。
4. 節點回傳結果；閘道回覆 Telegram。

節點不會執行閘道服務。除非你刻意執行隔離的設定檔，否則每台主機只應執行一個閘道（請參閱[多個閘道](/zh-TW/gateway/multiple-gateways)）。macOS 應用程式的「節點模式」只是透過閘道 WebSocket 連線的節點用戶端。

## SSH 通道（命令列介面 + 工具）

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

通道啟用後，`openclaw health` 與 `openclaw status --deep` 會透過 `ws://127.0.0.1:18789` 連到遠端閘道。`openclaw gateway status`、`openclaw gateway health`、`openclaw gateway probe` 與 `openclaw gateway call` 也可以透過 `--url` 指向轉送後的 URL。

<Note>
請將 `18789` 替換為你設定的 `gateway.port`（或 `--port` / `OPENCLAW_GATEWAY_PORT`）。
</Note>

<Warning>
`--url` 絕不會回退使用設定或環境憑證。請明確傳入 `--token` 或 `--password`；若未傳入，用戶端不會傳送憑證，且在目標閘道要求驗證時連線會失敗。
</Warning>

## 命令列介面遠端預設值

保存遠端目標，讓命令列介面命令預設使用它：

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

當閘道僅限回送介面時，請將 URL 保持為 `ws://127.0.0.1:18789`，並先開啟 SSH 通道。在 macOS 應用程式的 SSH 通道傳輸中，探索到的閘道主機名稱會放在 `gateway.remote.sshTarget`（`user@host` 或 `user@host:port`）；`gateway.remote.url` 則保持為本機通道 URL。如果遠端連接埠與本機連接埠不同，請設定 `gateway.remote.remotePort`。

主機金鑰驗證預設為嚴格模式（`gateway.remote.sshHostKeyPolicy: "strict"`）。改設為 `"openssh"` 可改由你實際生效的 OpenSSH 設定處理；啟用前請先檢閱你的使用者與系統 SSH 設定。

對於已可在受信任 LAN 或 Tailnet 上連線的閘道，請使用直接模式：

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

閘道憑證解析在 call/probe/status 路徑與 Discord exec-approval 監控中遵循同一份共用合約。Node-host 使用相同合約，但有一個本機模式例外（它會忽略 `gateway.remote.*`）。

- 明確憑證（`--token`、`--password` 或工具的 `gatewayToken`）在接受明確驗證的呼叫路徑上永遠優先。
- URL 覆寫安全性：
  - 命令列介面 `--url` 絕不會重用隱含的 config/env 憑證。
  - Env `OPENCLAW_GATEWAY_URL` 只能使用 env 憑證（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）。
- 本機模式預設值：
  - token：`OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`（只有在本機 token 未設定時才使用遠端備援）
  - password：`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`（只有在本機 password 未設定時才使用遠端備援）
- 遠端模式預設值：
  - token：`gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password：`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-host 本機模式例外：`gateway.remote.token` / `gateway.remote.password` 會被忽略。
- 遠端 probe/status token 檢查預設為嚴格模式：在目標為遠端模式時，只使用 `gateway.remote.token`（不會回退到本機 token）。
- 閘道 env 覆寫只使用 `OPENCLAW_GATEWAY_*`。

## 聊天 UI 遠端存取

WebChat 沒有獨立的 HTTP 連接埠；SwiftUI 聊天 UI 會直接連線到閘道 WebSocket。

- 透過 SSH 轉送 `18789`（見上文），然後將用戶端連線到 `ws://127.0.0.1:18789`。
- 對於 LAN/Tailnet 直接模式，將用戶端連線到設定好的私有 `ws://` 或安全 `wss://` URL。
- 在 macOS 上，應用程式的遠端模式會自動管理所選傳輸方式。

## macOS 應用程式遠端模式

macOS 選單列應用程式會端到端驅動相同設定：遠端狀態檢查、WebChat 與 Voice Wake 轉送。執行手冊：[macOS 遠端存取](/zh-TW/platforms/mac/remote)。

## 安全規則（遠端/VPN）

除非你確定需要繫結，否則請讓閘道**僅限回送介面**。

- **回送介面 + SSH/Tailscale Serve** 是最安全的預設值（不公開暴露）。
- 明文 `ws://` 可用於回送介面、私有/LAN（RFC 1918）、link-local、CGNAT、`.local` 與 `.ts.net` 主機。公開遠端主機必須使用 `wss://`。
- **非回送介面繫結**（`lan`/`tailnet`/`custom`，或在回送介面不可用時的 `auto`）必須使用閘道驗證：token、password，或搭配 `gateway.auth.mode: "trusted-proxy"` 的身分感知反向代理。
- `gateway.remote.token` / `.password` 是用戶端憑證來源；它們本身不會設定伺服器驗證。
- 本機呼叫路徑只有在 `gateway.auth.*` 未設定時，才可以使用 `gateway.remote.*` 作為備援。
- 如果 `gateway.auth.token` / `gateway.auth.password` 是透過 SecretRef 明確設定且無法解析，解析會以關閉方式失敗（不會用遠端備援遮蔽）。
- `gateway.remote.tlsFingerprint` 會為 `wss://` 釘選遠端 TLS 憑證，包括 macOS 直接模式。若沒有儲存的釘選，macOS 只會在正常系統信任通過後於首次使用時釘選；自簽或私有 CA 的閘道需要明確 fingerprint，或使用 Remote over SSH。
- **Tailscale Serve** 可在 `gateway.auth.allowTailscale: true` 時，透過身分標頭驗證控制 UI/WebSocket 流量。HTTP API 端點不使用該標頭驗證，而是遵循閘道的一般 HTTP 驗證模式。這種無 token 流程假設閘道主機受信任；若要在所有地方使用 shared-secret 驗證，請將其設為 `false`。
- **Trusted-proxy** 驗證預設需要非回送介面的身分感知代理。同主機回送反向代理需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`。
- 將瀏覽器控制視為操作者存取：僅限 tailnet，加上有意識的節點配對。

深入說明：[安全性](/zh-TW/gateway/security)。

### macOS：透過 LaunchAgent 建立持久 SSH 通道

對於 macOS 用戶端，最簡單的持久設定是使用 SSH `LocalForward` 設定項目，再搭配一個 LaunchAgent，讓通道在重新開機與當機後保持存活。

#### 步驟 1：新增 SSH 設定

編輯 `~/.ssh/config`：

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

將 `<REMOTE_IP>` 與 `<REMOTE_USER>` 替換為你的值。

#### 步驟 2：複製 SSH 金鑰（一次性）

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### 步驟 3：設定閘道 token

```bash
openclaw config set gateway.remote.token "<your-token>"
```

如果遠端閘道使用 password 驗證，請改用 `gateway.remote.password`。`OPENCLAW_GATEWAY_TOKEN` 仍可作為 shell 層級覆寫，但持久的遠端用戶端設定是 `gateway.remote.token` / `gateway.remote.password`。

#### 步驟 4：建立 LaunchAgent

儲存為 `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`：

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

通道會在登入時自動啟動、當機後重新啟動，並讓轉送連接埠維持可用。

<Note>
如果你有舊設定留下的 `com.openclaw.ssh-tunnel` LaunchAgent，請卸載並刪除它。
</Note>

#### 疑難排解

```bash
# Check if the tunnel is running
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789

# Restart the tunnel
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel

# Stop the tunnel
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| 設定項目                             | 功能                                                         |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | 將本機連接埠 18789 轉送到遠端連接埠 18789                  |
| `ssh -N`                             | 不執行遠端命令的 SSH（僅用於連接埠轉送）                    |
| `KeepAlive`                          | 若通道當機，會自動重新啟動通道                              |
| `RunAtLoad`                          | LaunchAgent 在登入時載入後啟動通道                          |

## 相關內容

- [Tailscale](/zh-TW/gateway/tailscale)
- [驗證](/zh-TW/gateway/authentication)
- [遠端閘道設定](/zh-TW/gateway/remote-gateway-readme)

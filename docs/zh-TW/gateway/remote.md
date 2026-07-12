---
read_when:
    - 執行或疑難排解遠端閘道設定
summary: 使用閘道 WebSocket、SSH 通道與 Tailscale 網路進行遠端存取
title: 遠端存取
x-i18n:
    generated_at: "2026-07-11T21:22:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78daaad7bcb9f80072eaa2d6946bff9f28ba1ec4f95a68edb0d24cf7f9c3fec2
    source_path: gateway/remote.md
    workflow: 16
---

OpenClaw 在一台主機上執行一個閘道（主控端），並將每個用戶端連線至該閘道。閘道管理工作階段、驗證設定檔、頻道和狀態；其他一切都是用戶端。

- **操作人員**（您或 macOS 應用程式）：若閘道可連線，直接使用區域網路/Tailnet WebSocket 最為簡單；SSH 通道則是通用的備援方案。
- **節點**（iOS/Android 和其他裝置）：連線至閘道 **WebSocket**（區域網路/Tailnet 或 SSH 通道）。

## 核心概念

閘道 WebSocket 預設繫結至 **local loopback**，連接埠為 `18789`（`gateway.port`）。如需遠端使用，請透過 Tailscale Serve／受信任的區域網路-Tailnet 繫結公開服務，或透過 SSH 轉送 local loopback 連接埠。

## 拓撲選項

| 設定                              | 閘道執行位置                                                                                              | 最適合                                                                                                                                                     |
| --------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tailnet 中的常駐閘道             | 持續運作的主機（VPS 或家用伺服器），透過 Tailscale 或 SSH 存取                                           | 經常進入睡眠但需要代理程式持續運作的筆記型電腦。請參閱 [exe.dev](/zh-TW/install/exe-dev)（簡易 VM）或 [Hetzner](/zh-TW/install/hetzner)（正式環境 VPS）。                 |
| 家用桌上型電腦                    | 桌上型電腦；筆記型電腦透過 macOS 應用程式的遠端模式連線（Settings → Connection → OpenClaw runs）          | 將代理程式保留在持續開機的硬體上。操作手冊：[macOS 遠端存取](/zh-TW/platforms/mac/remote)。                                                                       |
| 筆記型電腦                        | 筆記型電腦，透過 SSH 通道或 Tailscale Serve 安全公開（保持 `gateway.bind: "loopback"`）                   | 單機設定。請參閱 [Tailscale](/zh-TW/gateway/tailscale) 和 [網頁](/zh-TW/web)。                                                                                          |

對於常駐和筆記型電腦設定，建議保持 `gateway.bind: "loopback"`，並使用 **Tailscale Serve** 提供控制介面，或使用受信任的區域網路/Tailnet 繫結搭配 `gateway.remote.transport: "direct"`。SSH 通道是可從任何機器使用的備援方案。

## 命令流程（各部分在何處執行）

一個閘道管理狀態和頻道；節點則是周邊裝置。範例（Telegram 訊息路由至節點工具）：

1. Telegram 訊息抵達**閘道**。
2. 閘道執行**代理程式**，由代理程式決定是否呼叫節點工具。
3. 閘道透過閘道 WebSocket（`node.invoke` RPC）呼叫**節點**。
4. 節點回傳結果；閘道回覆 Telegram。

節點不會執行閘道服務。除非您有意執行隔離的設定檔，否則每台主機只應執行一個閘道（請參閱[多個閘道](/zh-TW/gateway/multiple-gateways)）。macOS 應用程式的「節點模式」只是透過閘道 WebSocket 運作的節點用戶端。

## SSH 通道（命令列介面與工具）

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

建立通道後，`openclaw health` 和 `openclaw status --deep` 會透過 `ws://127.0.0.1:18789` 連線至遠端閘道。`openclaw gateway status`、`openclaw gateway health`、`openclaw gateway probe` 和 `openclaw gateway call` 也可以透過 `--url` 指向轉送後的 URL。

<Note>
請將 `18789` 替換為您設定的 `gateway.port`（或 `--port`／`OPENCLAW_GATEWAY_PORT`）。
</Note>

<Warning>
`--url` 絕不會退回使用設定或環境中的憑證。請明確傳入 `--token` 或 `--password`；若未傳入，用戶端不會傳送任何憑證，而當目標閘道要求驗證時，連線將會失敗。
</Warning>

## 命令列介面遠端預設值

儲存遠端目標，讓命令列介面命令預設使用該目標：

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

當閘道僅限 local loopback 時，請將 URL 保持為 `ws://127.0.0.1:18789`，並先開啟 SSH 通道。在 macOS 應用程式的 SSH 通道傳輸方式中，探索到的閘道主機名稱應填入 `gateway.remote.sshTarget`（`user@host` 或 `user@host:port`）；`gateway.remote.url` 則維持為本機通道 URL。若遠端連接埠與本機連接埠不同，請設定 `gateway.remote.remotePort`。

預設會嚴格驗證主機金鑰（`gateway.remote.sshHostKeyPolicy: "strict"`）。若要改由您實際套用的 OpenSSH 設定處理，請將其設為 `"openssh"`；啟用前請檢查您的使用者與系統 SSH 設定。

若閘道已可透過受信任的區域網路或 Tailnet 連線，請使用直接模式：

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

閘道憑證解析在呼叫／探測／狀態路徑與 Discord 執行核准監控中遵循同一套共用契約。節點主機也使用相同契約，但有一項本機模式例外（會忽略 `gateway.remote.*`）。

- 明確指定的憑證（`--token`、`--password` 或工具的 `gatewayToken`）在接受明確驗證資訊的呼叫路徑上永遠優先。
- URL 覆寫安全性：
  - 命令列介面 `--url` 絕不會重複使用隱含的設定／環境憑證。
  - 環境變數 `OPENCLAW_GATEWAY_URL` 僅可使用環境憑證（`OPENCLAW_GATEWAY_TOKEN`／`OPENCLAW_GATEWAY_PASSWORD`）。
- 本機模式預設值：
  - 權杖：`OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`（僅在未設定本機權杖時才使用遠端備援）
  - 密碼：`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`（僅在未設定本機密碼時才使用遠端備援）
- 遠端模式預設值：
  - 權杖：`gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - 密碼：`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- 節點主機的本機模式例外：忽略 `gateway.remote.token`／`gateway.remote.password`。
- 遠端探測／狀態權杖檢查預設採嚴格模式：以遠端模式為目標時，只使用 `gateway.remote.token`（不退回使用本機權杖）。
- 閘道環境變數覆寫僅使用 `OPENCLAW_GATEWAY_*`。

## 聊天介面遠端存取

WebChat 沒有獨立的 HTTP 連接埠；SwiftUI 聊天介面會直接連線至閘道 WebSocket。

- 透過 SSH 轉送 `18789`（見上文），然後讓用戶端連線至 `ws://127.0.0.1:18789`。
- 若使用區域網路/Tailnet 直接模式，請讓用戶端連線至已設定的私有 `ws://` 或安全的 `wss://` URL。
- 在 macOS 上，應用程式的遠端模式會自動管理所選的傳輸方式。

## macOS 應用程式遠端模式

macOS 選單列應用程式會端對端管理相同的設定，包括遠端狀態檢查、WebChat 和語音喚醒轉送。操作手冊：[macOS 遠端存取](/zh-TW/platforms/mac/remote)。

## 安全性規則（遠端/VPN）

除非您確定需要繫結，否則請將閘道保持為**僅限 local loopback**。

- **Local loopback + SSH/Tailscale Serve** 是最安全的預設選項（不會公開暴露）。
- 明文 `ws://` 可用於 local loopback、私有／區域網路（RFC 1918）、鏈路本機、CGNAT、`.local` 和 `.ts.net` 主機。公網遠端主機必須使用 `wss://`。
- **非 local loopback 繫結**（`lan`／`tailnet`／`custom`，或 local loopback 不可用時的 `auto`）必須使用閘道驗證：權杖、密碼，或搭配 `gateway.auth.mode: "trusted-proxy"` 的身分感知反向代理。
- `gateway.remote.token`／`.password` 是用戶端憑證來源；它們本身不會設定伺服器驗證。
- 僅當未設定 `gateway.auth.*` 時，本機呼叫路徑才可使用 `gateway.remote.*` 作為備援。
- 若透過 SecretRef 明確設定的 `gateway.auth.token`／`gateway.auth.password` 無法解析，解析會採封閉式失敗（不會以遠端備援掩蓋問題）。
- `gateway.remote.tlsFingerprint` 會固定 `wss://` 的遠端 TLS 憑證，包括 macOS 直接模式。若沒有已儲存的固定指紋，macOS 只會在一般系統信任檢查通過後於首次使用時固定；使用自我簽署憑證或私有 CA 的閘道需要明確的指紋，或改用透過 SSH 的遠端連線。
- 當 `gateway.auth.allowTailscale: true` 時，**Tailscale Serve** 可透過身分標頭驗證控制介面/WebSocket 流量。HTTP API 端點不使用該標頭驗證，而是遵循閘道的一般 HTTP 驗證模式。此無權杖流程假設閘道主機可信任；若要在所有位置使用共用密鑰驗證，請將其設為 `false`。
- **受信任代理**驗證預設要求使用非 local loopback 的身分感知代理。同一主機上的 local loopback 反向代理需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`。
- 將瀏覽器控制視同操作人員存取：僅限 Tailnet，並有意識地進行節點配對。

深入說明：[安全性](/zh-TW/gateway/security)。

### macOS：透過 LaunchAgent 建立持續性 SSH 通道

對 macOS 用戶端而言，最簡單的持續性設定是使用 SSH `LocalForward` 設定項目，搭配在重新啟動和當機後維持通道運作的 LaunchAgent。

#### 步驟 1：新增 SSH 設定

編輯 `~/.ssh/config`：

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

請將 `<REMOTE_IP>` 和 `<REMOTE_USER>` 替換為您的值。

#### 步驟 2：複製 SSH 金鑰（一次性）

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### 步驟 3：設定閘道權杖

```bash
openclaw config set gateway.remote.token "<your-token>"
```

若遠端閘道使用密碼驗證，請改用 `gateway.remote.password`。`OPENCLAW_GATEWAY_TOKEN` 仍可作為 Shell 層級的覆寫值，但持久性的遠端用戶端設定應使用 `gateway.remote.token`／`gateway.remote.password`。

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

通道會在登入時自動啟動、在當機後重新啟動，並持續維持轉送連接埠運作。

<Note>
若您保留了舊設定中的 `com.openclaw.ssh-tunnel` LaunchAgent，請將其卸載並刪除。
</Note>

#### 疑難排解

```bash
# 檢查通道是否正在執行
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789

# 重新啟動通道
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel

# 停止通道
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| 設定項目                             | 功能說明                                                 |
| ------------------------------------ | -------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | 將本機連接埠 18789 轉送至遠端連接埠 18789               |
| `ssh -N`                             | 不執行遠端命令的 SSH（僅轉送連接埠）                    |
| `KeepAlive`                          | 若通道當機，自動重新啟動                                 |
| `RunAtLoad`                          | 登入時載入 LaunchAgent 並啟動通道                        |

## 相關內容

- [Tailscale](/zh-TW/gateway/tailscale)
- [驗證](/zh-TW/gateway/authentication)
- [遠端閘道設定](/zh-TW/gateway/remote-gateway-readme)

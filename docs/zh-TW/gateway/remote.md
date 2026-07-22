---
read_when:
    - 執行遠端閘道設定或進行疑難排解
summary: 使用閘道 WS、SSH 通道與 tailnet 進行遠端存取
title: 遠端存取
x-i18n:
    generated_at: "2026-07-22T13:19:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f05e32fcfa16d5ddfcd684d0550c9af311914e2b4d91c95edad3490dc2e56d9
    source_path: gateway/remote.md
    workflow: 16
---

OpenClaw 會在主機上執行一個閘道（主控端），並將每個用戶端連線至該閘道。閘道負責工作階段、驗證設定檔、頻道與狀態；其他一切皆為用戶端。

- **操作人員**（你或 macOS App）：當閘道可連線時，直接使用 LAN/Tailnet WebSocket 最為簡單；SSH 通道則是通用的備援方案。
- **節點**（iOS/Android 與其他裝置）：連線至閘道 **WebSocket**（LAN/tailnet 或 SSH 通道）。

## 核心概念

閘道 WebSocket 預設繫結至**回送介面**，連接埠為 `18789`（`gateway.port`）。若要從遠端使用，可以透過 Tailscale Serve／受信任的 LAN-Tailnet 繫結公開，或透過 SSH 轉送回送連接埠。

## 拓撲選項

| 設定                              | 閘道的執行位置                                                                                            | 最適合                                                                                                                                                 |
| --------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tailnet 中持續運作的閘道          | 常駐主機（VPS 或家用伺服器），透過 Tailscale 或 SSH 連線                                                  | 經常休眠、但需要代理程式持續運作的筆記型電腦。請參閱 [exe.dev](/zh-TW/install/exe-dev)（簡易 VM）或 [Hetzner](/zh-TW/install/hetzner)（正式環境 VPS）。 |
| 家用桌上型電腦                    | 桌上型電腦；筆記型電腦透過 macOS App 的遠端模式連線（Settings → Connection → OpenClaw runs）             | 讓代理程式在持續開機的硬體上執行。操作手冊：[macOS 遠端存取](/zh-TW/platforms/mac/remote)。                                                                  |
| 筆記型電腦                        | 筆記型電腦，透過 SSH 通道或 Tailscale Serve 安全公開（保留 `gateway.bind: "loopback"`）                  | 單機設定。請參閱 [Tailscale](/zh-TW/gateway/tailscale) 和 [Web](/zh-TW/web)。                                                                                       |

對於持續運作與筆記型電腦設定，建議保留 `gateway.bind: "loopback"`，並對控制介面使用 **Tailscale Serve**，或搭配 `gateway.remote.transport: "direct"` 使用受信任的 LAN/Tailnet 繫結。SSH 通道是可在任何機器上使用的備援方案。

## 命令流程（各項作業的執行位置）

一個閘道負責狀態與頻道；節點則是周邊裝置。範例（將 Telegram 訊息路由至節點工具）：

1. Telegram 訊息抵達**閘道**。
2. 閘道執行**代理程式**，由代理程式決定是否呼叫節點工具。
3. 閘道透過閘道 WebSocket（`node.invoke` RPC）呼叫**節點**。
4. 節點傳回結果；閘道回覆 Telegram。

節點不會執行閘道服務。除非刻意執行彼此隔離的設定檔，否則每台主機只應執行一個閘道（請參閱[多個閘道](/zh-TW/gateway/multiple-gateways)）。macOS App 的「節點模式」只是透過閘道 WebSocket 連線的節點用戶端。

## SSH 通道（命令列介面 + 工具）

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

通道建立後，`openclaw health` 和 `openclaw status --deep` 會透過 `ws://127.0.0.1:18789` 連線至遠端閘道。`openclaw gateway status`、`openclaw gateway health`、`openclaw gateway probe` 和 `openclaw gateway call` 也可以透過 `--url` 指向已轉送的 URL。

<Note>
請將 `18789` 替換為你設定的 `gateway.port`（或 `--port`／`OPENCLAW_GATEWAY_PORT`）。
</Note>

<Warning>
`--url` 絕不會退回使用設定或環境認證資訊。請明確傳入 `--token` 或 `--password`；若未傳入，用戶端不會傳送任何認證資訊，而當目標閘道要求驗證時，連線便會失敗。
</Warning>

## 命令列介面的遠端預設值

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

當閘道僅限回送介面時，請將 URL 保持為 `ws://127.0.0.1:18789`，並先開啟 SSH 通道。在 macOS App 的 SSH 通道傳輸方式中，探索到的閘道主機名稱應填入 `gateway.remote.sshTarget`（`user@host` 或 `user@host:port`）；`gateway.remote.url` 則維持為本機通道 URL。如果遠端連接埠與本機連接埠不同，請設定 `gateway.remote.remotePort`。

預設會嚴格驗證主機金鑰（`gateway.remote.sshHostKeyPolicy: "strict"`）。將其設為 `"openssh"`，即可改由你實際生效的 OpenSSH 設定處理；啟用前，請檢查你的使用者與系統 SSH 設定。

若閘道已可從受信任的 LAN 或 Tailnet 連線，請使用直接模式：

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

## 認證資訊優先順序

閘道認證資訊解析在呼叫／探測／狀態路徑與 Discord 執行核准監控中遵循同一份共用契約。節點主機使用相同契約，但本機模式有一項例外（會忽略 `gateway.remote.*`）。

- 在接受明確驗證的呼叫路徑中，明確認證資訊（`--token`、`--password` 或工具的 `gatewayToken`）一律優先。
- URL 覆寫安全性：
  - 命令列介面的 `--url` 絕不會重複使用隱含的設定／環境認證資訊。
  - 環境變數 `OPENCLAW_GATEWAY_URL` 只能使用環境認證資訊（`OPENCLAW_GATEWAY_TOKEN`／`OPENCLAW_GATEWAY_PASSWORD`）。
- 本機模式預設值：
  - 權杖：`OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`（僅在未設定本機權杖時，才退回使用遠端值）
  - 密碼：`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`（僅在未設定本機密碼時，才退回使用遠端值）
- 遠端模式預設值：
  - 權杖：`gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - 密碼：`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- 節點主機的本機模式例外：忽略 `gateway.remote.token`／`gateway.remote.password`。
- 遠端探測／狀態權杖檢查預設採用嚴格模式：以遠端模式為目標時，只使用 `gateway.remote.token`（不退回使用本機權杖）。
- 閘道環境覆寫僅使用 `OPENCLAW_GATEWAY_*`。

## 聊天介面的遠端存取

WebChat 沒有獨立的 HTTP 連接埠；SwiftUI 聊天介面會直接連線至閘道 WebSocket。

- 透過 SSH 轉送 `18789`（見上文），然後將用戶端連線至 `ws://127.0.0.1:18789`。
- 若使用 LAN/Tailnet 直接模式，請將用戶端連線至已設定的私人 `ws://` 或安全的 `wss://` URL。
- 在 macOS 上，App 的遠端模式會自動管理所選的傳輸方式。

## macOS App 遠端模式

macOS 選單列 App 會端對端驅動相同的設定流程：遠端狀態檢查、WebChat 與語音喚醒轉送。操作手冊：[macOS 遠端存取](/zh-TW/platforms/mac/remote)。

## 安全規則（遠端／VPN）

除非確定需要繫結，否則請讓閘道**僅限回送介面**。

- **回送介面 + SSH/Tailscale Serve** 是最安全的預設值（不公開暴露）。
- 回送介面、私人／LAN（RFC 1918）、鏈路本機、CGNAT、`.local` 和 `.ts.net` 主機可接受明文 `ws://`。公用遠端主機必須使用 `wss://`。
- **非回送介面繫結**（`lan`/`tailnet`/`custom`，或無法使用回送介面時的 `auto`）必須使用閘道驗證：權杖、密碼，或搭配 `gateway.auth.mode: "trusted-proxy"`、可感知身分的反向 Proxy。
- `gateway.remote.token`／`.password` 是用戶端認證資訊來源；它們本身不會設定伺服器驗證。
- 只有在未設定 `gateway.auth.*` 時，本機呼叫路徑才能退回使用 `gateway.remote.*`。
- 如果透過 SecretRef 明確設定的 `gateway.auth.token`／`gateway.auth.password` 無法解析，解析會以關閉方式失敗（不會以遠端備援掩蓋）。
- `gateway.remote.tlsFingerprint` 會固定 `wss://` 的遠端 TLS 憑證，包括操作人員／控制流量，以及 macOS 直接模式中的配套節點。若未儲存固定值，macOS 只會在一般系統信任驗證通過後，於首次使用時固定憑證；使用自我簽署或私人 CA 的閘道需要明確的指紋，或使用透過 SSH 的遠端模式。
- 當 `gateway.auth.allowTailscale: true` 時，**Tailscale Serve** 可透過身分標頭驗證控制介面／WebSocket 流量。HTTP API 端點不使用該標頭驗證，而是遵循閘道的一般 HTTP 驗證模式。此無權杖流程假設閘道主機可信任；將其設為 `false`，即可在所有位置使用共用祕密驗證。
- **受信任的 Proxy** 驗證預設需要非回送介面、可感知身分的 Proxy。同一主機上的回送反向 Proxy 需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`。
- 請將瀏覽器控制視同操作人員存取：僅限 Tailnet，並刻意進行節點配對。

深入瞭解：[安全性](/zh-TW/gateway/security)。

### macOS：透過 LaunchAgent 建立持續 SSH 通道

對 macOS 用戶端而言，最簡單的持續設定方式是使用包含 SSH `LocalForward` 設定項目的設定檔，再搭配 LaunchAgent，讓通道在重新開機與當機後持續運作。

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

#### 步驟 2：複製 SSH 金鑰（僅需一次）

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### 步驟 3：設定閘道權杖

```bash
openclaw config set gateway.remote.token "<your-token>"
```

如果遠端閘道使用密碼驗證，請改用 `gateway.remote.password`。`OPENCLAW_GATEWAY_TOKEN` 作為 Shell 層級覆寫仍然有效，但持久的遠端用戶端設定應使用 `gateway.remote.token`／`gateway.remote.password`。

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

通道會在登入時自動啟動、當機時重新啟動，並讓轉送的連接埠持續可用。

<Note>
如果舊設定遺留了 `com.openclaw.ssh-tunnel` LaunchAgent，請卸載並刪除它。
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

| 設定項目                             | 功能                                                         |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | 將本機連接埠 18789 轉送至遠端連接埠 18789                   |
| `ssh -N`                             | 不執行遠端命令的 SSH（僅轉送連接埠）                         |
| `KeepAlive`                          | 若通道當機，自動重新啟動通道                                 |
| `RunAtLoad`                          | 登入時載入 LaunchAgent 後啟動通道                            |

## 相關內容

- [Tailscale](/zh-TW/gateway/tailscale)
- [驗證](/zh-TW/gateway/authentication)
- [遠端閘道設定](/zh-TW/gateway/remote-gateway-readme)

---
read_when:
    - 執行或疑難排解遠端閘道設定
summary: 使用閘道 WS、SSH 通道與 tailnets 進行遠端存取
title: 遠端存取
x-i18n:
    generated_at: "2026-07-03T23:26:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb6fd38698480f1dff93a6e4819082711e8e4395556a2fd85a8eb772ef6fbe31
    source_path: gateway/remote.md
    workflow: 16
---

此 repo 支援遠端閘道存取，做法是在專用主機（桌機/伺服器）上保持單一閘道（主閘道）執行，並讓用戶端連線到它。

- 對於**操作者（你 / macOS app）**：當閘道可連線時，直接 LAN/Tailnet WebSocket 最簡單；SSH tunnel 是通用的備援方案。
- 對於**節點（iOS/Android 與未來裝置）**：連線到閘道 **WebSocket**（視需要使用 LAN/tailnet 或 SSH tunnel）。

## 核心概念

- 閘道 WebSocket 通常會繫結到你設定連接埠上的 **loopback**（預設為 18789）。
- 若要遠端使用，請透過 Tailscale Serve 或受信任的 LAN/Tailnet 繫結公開它，或透過 SSH 轉發 loopback 連接埠。

## 常見 VPN 與 tailnet 設定

把**閘道主機**視為 agent 所在的位置。它擁有 session、auth profile、channel 與 state。你的筆電、桌機與節點都會連線到該主機。

### tailnet 中常駐的閘道

在持續運作的主機（VPS 或家用伺服器）上執行閘道，並透過 **Tailscale** 或 SSH 連線。

- **最佳使用者體驗：**保留 `gateway.bind: "loopback"`，並對控制介面使用 **Tailscale Serve**。
- **受信任的 LAN/Tailnet：**將閘道繫結到私人介面，並用 `gateway.remote.transport: "direct"` 直接連線。
- **備援：**保留 loopback，並從任何需要存取的機器建立 SSH tunnel。
- **範例：**[exe.dev](/zh-TW/install/exe-dev)（簡易 VM）或 [Hetzner](/zh-TW/install/hetzner)（生產環境 VPS）。

適合筆電經常睡眠，但你希望 agent 常駐的情境。

### 家用桌機執行閘道

筆電**不**執行 agent。它會遠端連線：

- 使用 macOS app 的遠端模式（Settings → General → OpenClaw runs）。
- 當閘道可透過 LAN/Tailnet 連線時，app 會直接連線；當你選擇 SSH 時，則會開啟並管理 SSH tunnel。

Runbook：[macOS 遠端存取](/zh-TW/platforms/mac/remote)。

### 筆電執行閘道

保持閘道在本機執行，但安全地公開它：

- 從其他機器 SSH tunnel 到筆電，或
- 用 Tailscale Serve 公開控制介面，並保持閘道僅限 loopback。

指南：[Tailscale](/zh-TW/gateway/tailscale) 與 [Web 概覽](/zh-TW/web)。

## 命令流程（哪裡執行什麼）

一個閘道服務擁有 state + channel。節點是周邊裝置。

流程範例（Telegram → 節點）：

- Telegram 訊息抵達**閘道**。
- 閘道執行 **agent**，並決定是否呼叫節點工具。
- 閘道透過閘道 WebSocket（`node.*` RPC）呼叫**節點**。
- 節點回傳結果；閘道再回覆到 Telegram。

注意事項：

- **節點不會執行閘道服務。**除非你刻意執行隔離的 profile（請參閱[多個閘道](/zh-TW/gateway/multiple-gateways)），否則每台主機只應執行一個閘道。
- macOS app 的「節點模式」只是透過閘道 WebSocket 運作的節點用戶端。

## SSH tunnel（命令列介面 + 工具）

建立通往遠端閘道 WS 的本機 tunnel：

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

tunnel 啟動後：

- `openclaw health` 與 `openclaw status --deep` 現在會透過 `ws://127.0.0.1:18789` 連到遠端閘道。
- `openclaw gateway status`、`openclaw gateway health`、`openclaw gateway probe` 與 `openclaw gateway call` 也可以在需要時透過 `--url` 指向轉發後的 URL。

<Note>
將 `18789` 替換為你設定的 `gateway.port`（或 `--port` 或 `OPENCLAW_GATEWAY_PORT`）。
</Note>

<Warning>
當你傳入 `--url` 時，命令列介面不會退回使用 config 或環境憑證。請明確包含 `--token` 或 `--password`。缺少明確憑證會導致錯誤。
</Warning>

## 命令列介面遠端預設值

你可以持久保存遠端目標，讓命令列介面命令預設使用它：

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

當閘道僅限 loopback 時，請將 URL 保持為 `ws://127.0.0.1:18789`，並先開啟 SSH tunnel。
在 macOS app 的 SSH tunnel transport 中，探索到的閘道 hostname 應放在
`gateway.remote.sshTarget`；`gateway.remote.url` 仍維持本機 tunnel URL。
如果這些連接埠不同，請將 `gateway.remote.remotePort` 設為 SSH 主機上的閘道連接埠。
主機金鑰驗證預設為嚴格模式。受管理的 alias 可以透過
`gateway.remote.sshHostKeyPolicy: "openssh"` 明確使用其有效的 OpenSSH 信任政策；啟用前請檢查相符的使用者與系統
SSH 設定。

對於已可在受信任 LAN 或 Tailnet 上連線的閘道，請使用 direct mode：

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

閘道憑證解析在 call/probe/status 路徑與 Discord exec-approval 監控之間遵循同一個共享合約。Node-host 使用相同的基礎合約，但有一個 local-mode 例外（它會刻意忽略 `gateway.remote.*`）：

- 明確憑證（`--token`、`--password` 或工具 `gatewayToken`）在接受明確 auth 的 call 路徑上永遠優先。
- URL 覆寫安全性：
  - 命令列介面 URL 覆寫（`--url`）絕不重用隱含的 config/env 憑證。
  - Env URL 覆寫（`OPENCLAW_GATEWAY_URL`）只可以使用 env 憑證（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）。
- Local mode 預設值：
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`（只有在 local auth token input 未設定時才會套用 remote fallback）
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`（只有在 local auth password input 未設定時才會套用 remote fallback）
- Remote mode 預設值：
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-host local-mode 例外：`gateway.remote.token` / `gateway.remote.password` 會被忽略。
- Remote probe/status token 檢查預設為嚴格模式：在指向 remote mode 時，它們只使用 `gateway.remote.token`（沒有 local token fallback）。
- 閘道 env 覆寫只使用 `OPENCLAW_GATEWAY_*`。

## Chat UI 遠端存取

WebChat 不再使用獨立的 HTTP 連接埠。SwiftUI 聊天介面會直接連線到閘道 WebSocket。

- 透過 SSH 轉發 `18789`（見上方），然後讓用戶端連線到 `ws://127.0.0.1:18789`。
- 對於 LAN/Tailnet direct mode，讓用戶端連線到已設定的私人 `ws://` 或安全 `wss://` URL。
- 在 macOS 上，優先使用 app 的遠端模式，它會自動管理選定的 transport。

## macOS app 遠端模式

macOS menu bar app 可以端到端驅動相同設定（遠端狀態檢查、WebChat 與 Voice Wake forwarding）。

Runbook：[macOS 遠端存取](/zh-TW/platforms/mac/remote)。

## 安全規則（遠端/VPN）

簡短版：**除非你確定需要繫結，否則請保持閘道僅限 loopback**。

- **Loopback + SSH/Tailscale Serve** 是最安全的預設值（不公開暴露）。
- 明文 `ws://` 可接受用於 loopback、LAN、link-local、`.local`、`.ts.net` 與 Tailscale CGNAT 主機。公開的遠端主機必須使用 `wss://`。
- **非 loopback 繫結**（`lan`/`tailnet`/`custom`，或 loopback 無法使用時的 `auto`）必須使用閘道 auth：token、password，或具備身份感知能力且搭配 `gateway.auth.mode: "trusted-proxy"` 的 reverse proxy。
- `gateway.remote.token` / `.password` 是用戶端憑證來源。它們本身**不會**設定伺服器 auth。
- 只有在 `gateway.auth.*` 未設定時，本機 call 路徑才可使用 `gateway.remote.*` 作為 fallback。
- 如果 `gateway.auth.token` / `gateway.auth.password` 透過 SecretRef 明確設定但未解析，解析會 fail closed（不會用 remote fallback 遮蔽）。
- 使用 `wss://` 時，`gateway.remote.tlsFingerprint` 會釘選遠端 TLS cert，包括 macOS direct mode。若未設定或先前未儲存 pin，macOS 只會在一般系統信任通過後釘選首次使用的憑證；macOS 尚未信任的自簽或私人 CA 閘道需要明確 fingerprint 或 Remote over SSH。
- 當 `gateway.auth.allowTailscale: true` 時，**Tailscale Serve** 可以透過身份
  header 驗證控制介面/WebSocket 流量；HTTP API endpoint 不會
  使用該 Tailscale header auth，而是遵循閘道的一般 HTTP
  auth mode。這個無 token 流程假設閘道主機是受信任的。如果你想要所有地方都使用 shared-secret auth，請將其設為
  `false`。
- **Trusted-proxy** auth 預設預期非 loopback 的身份感知 proxy 設定。
  同主機 loopback reverse proxy 需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`。
- 將瀏覽器控制視為操作者存取：僅限 tailnet + 明確的節點配對。

深入說明：[安全性](/zh-TW/gateway/security)。

### macOS：透過 LaunchAgent 建立持久 SSH tunnel

對於連線到遠端閘道的 macOS 用戶端，最簡單的持久設定是使用 SSH `LocalForward` config entry 加上 LaunchAgent，讓 tunnel 在重新開機與 crash 後仍保持存活。

#### 步驟 1：新增 SSH config

編輯 `~/.ssh/config`：

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

將 `<REMOTE_IP>` 與 `<REMOTE_USER>` 替換為你的值。

#### 步驟 2：複製 SSH key（一次性）

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### 步驟 3：設定閘道 token

將 token 儲存在 config 中，讓它在 restart 後仍保持：

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### 步驟 4：建立 LaunchAgent

將以下內容儲存為 `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`：

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

tunnel 會在登入時自動啟動、在 crash 後重新啟動，並保持轉發連接埠可用。

<Note>
如果你有較舊設定留下的 `com.openclaw.ssh-tunnel` LaunchAgent，請卸載並刪除它。
</Note>

#### 疑難排解

檢查 tunnel 是否正在執行：

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

重新啟動 tunnel：

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

停止 tunnel：

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Config entry                         | 功能                                                         |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | 將本機連接埠 18789 轉發到遠端連接埠 18789                   |
| `ssh -N`                             | 不執行遠端命令的 SSH（僅做連接埠轉發）                      |
| `KeepAlive`                          | 如果 tunnel crash，會自動重新啟動                            |
| `RunAtLoad`                          | 在登入時 LaunchAgent 載入後啟動 tunnel                      |

## 相關

- [Tailscale](/zh-TW/gateway/tailscale)
- [驗證](/zh-TW/gateway/authentication)
- [遠端閘道設定](/zh-TW/gateway/remote-gateway-readme)

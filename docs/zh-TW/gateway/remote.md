---
read_when:
    - 執行或疑難排解遠端 Gateway 設定
summary: 使用 SSH 通道（Gateway WS）和 tailnet 進行遠端存取
title: 遠端存取
x-i18n:
    generated_at: "2026-04-30T03:08:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 116ffba71801d3363eba293997ee4a5c8ad083a82298e57e68f678510263650a
    source_path: gateway/remote.md
    workflow: 16
---

此 repo 透過在專用主機（桌面/server）上保持單一 Gateway（master）執行，並讓 client 連接到它，來支援「remote over SSH」。

- 對於 **operator（你 / macOS app）**：SSH tunneling 是通用 fallback。
- 對於 **node（iOS/Android 與未來裝置）**：連接到 Gateway **WebSocket**（視需要使用 LAN/tailnet 或 SSH tunnel）。

## 核心概念

- Gateway WebSocket 會在你設定的連接埠上綁定到 **loopback**（預設為 18789）。
- 若要遠端使用，你會透過 SSH 轉送該 loopback 連接埠（或使用 tailnet/VPN，減少 tunnel 需求）。

## 常見 VPN 與 tailnet 設定

把 **Gateway host** 想成 agent 所在的位置。它擁有 session、auth profile、channel 與 state。你的 laptop、desktop 與 node 都會連接到該 host。

### tailnet 中 always-on 的 Gateway

在持續運作的 host（VPS 或 home server）上執行 Gateway，並透過 **Tailscale** 或 SSH 存取。

- **最佳 UX：** 保持 `gateway.bind: "loopback"`，並使用 **Tailscale Serve** 提供 Control UI。
- **Fallback：** 保持 loopback，並從任何需要存取的 machine 建立 SSH tunnel。
- **範例：** [exe.dev](/zh-TW/install/exe-dev)（簡易 VM）或 [Hetzner](/zh-TW/install/hetzner)（production VPS）。

當你的 laptop 經常睡眠，但你希望 agent always-on 時，這是理想做法。

### Home desktop 執行 Gateway

laptop **不會** 執行 agent。它會遠端連接：

- 使用 macOS app 的 **Remote over SSH** 模式（Settings → General → OpenClaw runs）。
- app 會開啟並管理 tunnel，因此 WebChat 與 health check 都能直接運作。

Runbook：[macOS remote access](/zh-TW/platforms/mac/remote)。

### Laptop 執行 Gateway

保持 Gateway 在本機執行，但安全地公開它：

- 從其他 machine 對 laptop 建立 SSH tunnel，或
- 使用 Tailscale Serve 提供 Control UI，並讓 Gateway 維持 loopback-only。

指南：[Tailscale](/zh-TW/gateway/tailscale) 與 [Web overview](/zh-TW/web)。

## Command flow（哪裡執行什麼）

一個 gateway service 擁有 state + channel。Node 是周邊裝置。

Flow 範例（Telegram → node）：

- Telegram 訊息抵達 **Gateway**。
- Gateway 執行 **agent**，並決定是否呼叫 node tool。
- Gateway 透過 Gateway WebSocket（`node.*` RPC）呼叫 **node**。
- Node 回傳結果；Gateway 再回覆到 Telegram。

注意：

- **Node 不會執行 gateway service。** 除非你刻意執行隔離的 profile，否則每個 host 只應執行一個 gateway（請參閱 [Multiple gateways](/zh-TW/gateway/multiple-gateways)）。
- macOS app 的「node mode」只是透過 Gateway WebSocket 連線的 node client。

## SSH tunnel（CLI + tools）

建立到遠端 Gateway WS 的本機 tunnel：

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

tunnel 啟動後：

- `openclaw health` 與 `openclaw status --deep` 現在會透過 `ws://127.0.0.1:18789` 存取遠端 gateway。
- `openclaw gateway status`、`openclaw gateway health`、`openclaw gateway probe` 與 `openclaw gateway call` 也可以在需要時透過 `--url` 指向轉送後的 URL。

<Note>
將 `18789` 替換為你設定的 `gateway.port`（或 `--port` 或 `OPENCLAW_GATEWAY_PORT`）。
</Note>

<Warning>
當你傳入 `--url` 時，CLI 不會 fallback 到 config 或 environment credential。請明確包含 `--token` 或 `--password`。缺少明確 credential 會導致錯誤。
</Warning>

## CLI 遠端預設值

你可以持久化一個遠端 target，讓 CLI command 預設使用它：

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

當 gateway 是 loopback-only 時，讓 URL 維持 `ws://127.0.0.1:18789`，並先開啟 SSH tunnel。
在 macOS app 的 SSH tunnel transport 中，discovered gateway hostname 應放在
`gateway.remote.sshTarget`；`gateway.remote.url` 仍是本機 tunnel URL。

## Credential 優先順序

Gateway credential resolution 在 call/probe/status path 與 Discord exec-approval monitoring 之間遵循一個共用 contract。Node-host 使用相同的 base contract，但有一個 local-mode exception（它會刻意忽略 `gateway.remote.*`）：

- Explicit credentials（`--token`、`--password` 或 tool `gatewayToken`）在接受 explicit auth 的 call path 上永遠優先。
- URL override safety：
  - CLI URL override（`--url`）絕不重用 implicit config/env credentials。
  - Env URL override（`OPENCLAW_GATEWAY_URL`）只能使用 env credentials（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）。
- Local mode defaults：
  - token：`OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`（remote fallback 只在 local auth token input 未設定時套用）
  - password：`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`（remote fallback 只在 local auth password input 未設定時套用）
- Remote mode defaults：
  - token：`gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password：`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-host local-mode exception：`gateway.remote.token` / `gateway.remote.password` 會被忽略。
- Remote probe/status token check 預設是 strict：在 target 為 remote mode 時，它們只使用 `gateway.remote.token`（沒有 local token fallback）。
- Gateway env override 只使用 `OPENCLAW_GATEWAY_*`。

## 透過 SSH 使用 Chat UI

WebChat 不再使用獨立的 HTTP port。SwiftUI chat UI 會直接連接到 Gateway WebSocket。

- 透過 SSH 轉送 `18789`（見上方），然後讓 client 連接到 `ws://127.0.0.1:18789`。
- 在 macOS 上，偏好使用 app 的「Remote over SSH」模式，它會自動管理 tunnel。

## macOS app Remote over SSH

macOS menu bar app 可以 end-to-end 驅動相同設定（remote status check、WebChat 與 Voice Wake forwarding）。

Runbook：[macOS remote access](/zh-TW/platforms/mac/remote)。

## 安全規則（remote/VPN）

簡短版：除非你確定需要 bind，否則 **保持 Gateway loopback-only**。

- **Loopback + SSH/Tailscale Serve** 是最安全的預設值（沒有公開暴露）。
- Plaintext `ws://` 預設僅限 loopback。對於受信任的 private network，
  在 client process 上設定 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 作為
  break-glass。沒有對應的 `openclaw.json`；這必須是建立 WebSocket 連線的
  client 的 process environment。
- **Non-loopback binds**（`lan`/`tailnet`/`custom`，或 loopback 不可用時的 `auto`）必須使用 gateway auth：token、password，或搭配 `gateway.auth.mode: "trusted-proxy"` 的 identity-aware reverse proxy。
- `gateway.remote.token` / `.password` 是 client credential source。它們本身**不會**設定 server auth。
- Local call path 只有在 `gateway.auth.*` 未設定時，才可以使用 `gateway.remote.*` 作為 fallback。
- 如果 `gateway.auth.token` / `gateway.auth.password` 透過 SecretRef 明確設定但無法解析，resolution 會 fail closed（不會用 remote fallback 掩蓋）。
- `gateway.remote.tlsFingerprint` 會在使用 `wss://` 時 pin 遠端 TLS cert。
- **Tailscale Serve** 可在 `gateway.auth.allowTailscale: true` 時，透過 identity
  header 驗證 Control UI/WebSocket traffic；HTTP API endpoint 不使用該
  Tailscale header auth，而是遵循 gateway 的一般 HTTP auth mode。此 tokenless
  flow 假設 gateway host 是受信任的。若你希望所有地方都使用 shared-secret auth，請將它設為
  `false`。
- **Trusted-proxy** auth 預設期待 non-loopback 的 identity-aware proxy setup。
  Same-host loopback reverse proxy 需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`。
- 將 browser control 視為 operator access：tailnet-only + deliberate node pairing。

深入說明：[Security](/zh-TW/gateway/security)。

### macOS：透過 LaunchAgent 建立持久 SSH tunnel

對於連接到遠端 gateway 的 macOS client，最簡單的持久設定是使用 SSH `LocalForward` config entry，加上 LaunchAgent，在重新開機與 crash 後保持 tunnel 存活。

#### Step 1：新增 SSH config

編輯 `~/.ssh/config`：

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

將 `<REMOTE_IP>` 與 `<REMOTE_USER>` 替換為你的值。

#### Step 2：複製 SSH key（一次性）

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Step 3：設定 gateway token

將 token 儲存在 config 中，讓它在 restart 後仍然保留：

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Step 4：建立 LaunchAgent

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

#### Step 5：載入 LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

tunnel 會在 login 時自動啟動、在 crash 後重新啟動，並保持 forwarded port 可用。

<Note>
如果你有舊設定遺留的 `com.openclaw.ssh-tunnel` LaunchAgent，請 unload 並刪除它。
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
| `LocalForward 18789 127.0.0.1:18789` | 將本機 port 18789 轉送到遠端 port 18789                     |
| `ssh -N`                             | 不執行遠端 command 的 SSH（僅用於 port-forwarding）          |
| `KeepAlive`                          | 如果 tunnel crash，會自動重新啟動                           |
| `RunAtLoad`                          | 在 login 時 LaunchAgent 載入後啟動 tunnel                   |

## 相關

- [Tailscale](/zh-TW/gateway/tailscale)
- [Authentication](/zh-TW/gateway/authentication)
- [Remote gateway setup](/zh-TW/gateway/remote-gateway-readme)

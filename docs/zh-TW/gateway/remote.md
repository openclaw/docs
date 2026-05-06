---
read_when:
    - 執行或疑難排解遠端 Gateway 設定
summary: 使用 SSH 隧道（Gateway WS）與 tailnet 網路進行遠端存取
title: 遠端存取
x-i18n:
    generated_at: "2026-05-06T09:10:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6272f4ee9fa52091d461cd70be05ccf01c209c3b26fe98a71752f6ea86ea448
    source_path: gateway/remote.md
    workflow: 16
---

這個 repo 透過在專用主機（桌面電腦/伺服器）上維持單一 Gateway（master）執行，並讓用戶端連線到它，支援「透過 SSH 遠端」使用。

- 對於 **operator（你 / macOS app）**：SSH tunneling 是通用 fallback。
- 對於 **節點（iOS/Android 和未來裝置）**：連線到 Gateway **WebSocket**（視需要使用 LAN/tailnet 或 SSH tunnel）。

## 核心概念

- Gateway WebSocket 會在你設定的連接埠（預設為 18789）綁定到 **loopback**。
- 若要遠端使用，你會透過 SSH 轉送該 loopback 連接埠（或使用 tailnet/VPN，減少 tunnel 使用）。

## 常見 VPN 與 tailnet 設定

把 **Gateway 主機** 想成 agent 所在的位置。它擁有 session、auth profile、channel 和狀態。你的筆電、桌面電腦和節點會連線到該主機。

### tailnet 中常駐的 Gateway

在持久主機（VPS 或家用伺服器）上執行 Gateway，並透過 **Tailscale** 或 SSH 存取它。

- **最佳 UX：** 保持 `gateway.bind: "loopback"`，並使用 **Tailscale Serve** 提供 Control UI。
- **Fallback：** 保持 loopback，並從任何需要存取的機器建立 SSH tunnel。
- **範例：** [exe.dev](/zh-TW/install/exe-dev)（簡易 VM）或 [Hetzner](/zh-TW/install/hetzner)（production VPS）。

適合筆電經常休眠，但你想讓 agent 持續常駐的情境。

### 家用桌面電腦執行 Gateway

筆電**不會**執行 agent。它會遠端連線：

- 使用 macOS app 的 **Remote over SSH** 模式（Settings → General → OpenClaw runs）。
- app 會開啟並管理 tunnel，因此 WebChat 和健康檢查都能直接運作。

Runbook：[macOS remote access](/zh-TW/platforms/mac/remote)。

### 筆電執行 Gateway

讓 Gateway 維持本機執行，但安全地公開它：

- 從其他機器建立到筆電的 SSH tunnel，或
- 使用 Tailscale Serve 提供 Control UI，並讓 Gateway 僅限 loopback。

指南：[Tailscale](/zh-TW/gateway/tailscale) 和 [Web overview](/zh-TW/web)。

## 命令流程（什麼在哪裡執行）

一個 gateway 服務擁有狀態 + channel。節點是週邊裝置。

流程範例（Telegram → 節點）：

- Telegram 訊息抵達 **Gateway**。
- Gateway 執行 **agent**，並決定是否呼叫節點工具。
- Gateway 透過 Gateway WebSocket（`node.*` RPC）呼叫 **節點**。
- 節點回傳結果；Gateway 回覆到 Telegram。

注意：

- **節點不會執行 gateway 服務。** 每台主機只應執行一個 gateway，除非你刻意執行隔離的 profile（請參閱 [Multiple gateways](/zh-TW/gateway/multiple-gateways)）。
- macOS app 的「node mode」只是透過 Gateway WebSocket 連線的節點用戶端。

## SSH tunnel（CLI + 工具）

建立到遠端 Gateway WS 的本機 tunnel：

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

tunnel 啟動後：

- `openclaw health` 和 `openclaw status --deep` 現在會透過 `ws://127.0.0.1:18789` 連到遠端 gateway。
- `openclaw gateway status`、`openclaw gateway health`、`openclaw gateway probe` 和 `openclaw gateway call` 也可在需要時透過 `--url` 指向轉送後的 URL。

<Note>
將 `18789` 替換為你設定的 `gateway.port`（或 `--port` 或 `OPENCLAW_GATEWAY_PORT`）。
</Note>

<Warning>
當你傳入 `--url` 時，CLI 不會 fallback 到 config 或 environment credentials。請明確包含 `--token` 或 `--password`。缺少明確 credentials 會是錯誤。
</Warning>

## CLI 遠端預設值

你可以保留遠端目標，讓 CLI 命令預設使用它：

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

當 gateway 僅限 loopback 時，請將 URL 保持為 `ws://127.0.0.1:18789`，並先開啟 SSH tunnel。
在 macOS app 的 SSH tunnel transport 中，探索到的 gateway hostname 屬於
`gateway.remote.sshTarget`；`gateway.remote.url` 仍是本機 tunnel URL。

## Credential precedence

Gateway credential resolution 會在 call/probe/status 路徑和 Discord exec-approval monitoring 中遵循同一個 shared contract。Node-host 使用相同的基礎 contract，但有一個 local-mode exception（它會刻意忽略 `gateway.remote.*`）：

- 明確 credentials（`--token`、`--password` 或工具 `gatewayToken`）在接受 explicit auth 的 call path 中永遠優先。
- URL override 安全性：
  - CLI URL overrides（`--url`）絕不重用 implicit config/env credentials。
  - Env URL overrides（`OPENCLAW_GATEWAY_URL`）只能使用 env credentials（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）。
- Local mode 預設值：
  - token：`OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`（只有在 local auth token input 未設定時才套用 remote fallback）
  - password：`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`（只有在 local auth password input 未設定時才套用 remote fallback）
- Remote mode 預設值：
  - token：`gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password：`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-host local-mode exception：會忽略 `gateway.remote.token` / `gateway.remote.password`。
- Remote probe/status token 檢查預設是 strict：以 remote mode 為目標時，它們只使用 `gateway.remote.token`（沒有 local token fallback）。
- Gateway env overrides 只使用 `OPENCLAW_GATEWAY_*`。

## 透過 SSH 使用 Chat UI

WebChat 不再使用獨立的 HTTP 連接埠。SwiftUI chat UI 會直接連線到 Gateway WebSocket。

- 透過 SSH 轉送 `18789`（見上方），然後讓用戶端連線到 `ws://127.0.0.1:18789`。
- 在 macOS 上，建議使用 app 的「Remote over SSH」模式，它會自動管理 tunnel。

## macOS app Remote over SSH

macOS 選單列 app 可以端到端驅動相同設定（remote status checks、WebChat 和 Voice Wake forwarding）。

Runbook：[macOS remote access](/zh-TW/platforms/mac/remote)。

## 安全規則（remote/VPN）

簡短版：除非你確定需要 bind，否則**保持 Gateway 僅限 loopback**。

- **Loopback + SSH/Tailscale Serve** 是最安全的預設值（不公開曝露）。
- Plaintext `ws://` 預設僅限 loopback。對於可信任的 private networks，
  請在 client process 上設定 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`
  作為 break-glass。沒有對應的 `openclaw.json`；這必須是建立 WebSocket
  connection 的 client 的 process environment。
- **Non-loopback binds**（`lan`/`tailnet`/`custom`，或 loopback 不可用時的 `auto`）必須使用 gateway auth：token、password，或具備 identity-aware 的 reverse proxy 搭配 `gateway.auth.mode: "trusted-proxy"`。
- `gateway.remote.token` / `.password` 是 client credential sources。它們本身**不會**設定 server auth。
- Local call path 只有在 `gateway.auth.*` 未設定時，才能使用 `gateway.remote.*` 作為 fallback。
- 如果 `gateway.auth.token` / `gateway.auth.password` 透過 SecretRef 明確設定且無法解析，resolution 會 fail closed（不會以 remote fallback 掩蓋）。
- `gateway.remote.tlsFingerprint` 會在使用 `wss://` 時 pin 遠端 TLS cert。
- 當 `gateway.auth.allowTailscale: true` 時，**Tailscale Serve** 可以透過 identity
  header 驗證 Control UI/WebSocket traffic；HTTP API endpoints 不使用該
  Tailscale header auth，而是遵循 gateway 一般的 HTTP auth mode。這個
  tokenless flow 假設 gateway 主機可信任。如果你想讓所有地方都使用 shared-secret auth，請將它設定為
  `false`。
- **Trusted-proxy** auth 預設預期 non-loopback identity-aware proxy setups。
  Same-host loopback reverse proxies 需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`。
- 將 browser control 視為 operator access：tailnet-only + deliberate node pairing。

深入說明：[Security](/zh-TW/gateway/security)。

### macOS：透過 LaunchAgent 持久化 SSH tunnel

對於連線到遠端 gateway 的 macOS 用戶端，最簡單的持久設定是使用 SSH `LocalForward` config entry，再加上一個 LaunchAgent，讓 tunnel 在重新開機和 crash 後仍保持存活。

#### 步驟 1：新增 SSH config

編輯 `~/.ssh/config`：

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

將 `<REMOTE_IP>` 和 `<REMOTE_USER>` 替換成你的值。

#### 步驟 2：複製 SSH key（一次性）

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### 步驟 3：設定 gateway token

將 token 儲存在 config 中，讓它在重新啟動後仍保留：

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

tunnel 會在登入時自動啟動、crash 後重新啟動，並保持轉送的連接埠可用。

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

| Config entry                         | 作用                                                         |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | 將本機連接埠 18789 轉送到遠端連接埠 18789                  |
| `ssh -N`                             | 不執行遠端命令的 SSH（僅 port-forwarding）                  |
| `KeepAlive`                          | 如果 tunnel crash，會自動重新啟動                           |
| `RunAtLoad`                          | LaunchAgent 在登入時載入時啟動 tunnel                       |

## 相關

- [Tailscale](/zh-TW/gateway/tailscale)
- [Authentication](/zh-TW/gateway/authentication)
- [Remote gateway setup](/zh-TW/gateway/remote-gateway-readme)

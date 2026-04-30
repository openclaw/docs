---
read_when:
    - 執行無頭式 Node 主機
    - 配對用於 system.run 的非 macOS 節點
summary: '`openclaw node` 的 CLI 參考（無頭節點主機）'
title: Node
x-i18n:
    generated_at: "2026-04-30T02:54:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 40f623b163a3c3bcd2d3ff218c5e62a4acba45f7e3f16694d8da62a004b77706
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

執行一個連線到 Gateway WebSocket，並在這台機器上公開
`system.run` / `system.which` 的 **無頭 Node 主機**。

## 為什麼使用 Node 主機？

當你想讓代理在網路中的**其他機器上執行命令**，但不想在那裡安裝完整的 macOS companion app 時，請使用 Node 主機。

常見使用情境：

- 在遠端 Linux/Windows 機器上執行命令（建置伺服器、實驗室機器、NAS）。
- 讓 exec 在 gateway 上保持**沙箱化**，但將已核准的執行委派給其他主機。
- 為自動化或 CI 節點提供輕量、無頭的執行目標。

執行仍受 **exec 核准**與 Node 主機上的逐代理允許清單保護，因此你可以讓命令存取維持在明確且限定的範圍內。

## 瀏覽器代理（零設定）

如果 Node 上未停用 `browser.enabled`，Node 主機會自動宣告瀏覽器代理。這可讓代理在該 Node 上使用瀏覽器自動化，而不需要額外設定。

預設情況下，代理會公開該 Node 的一般瀏覽器設定檔介面。如果你設定了 `nodeHost.browserProxy.allowProfiles`，代理會變成限制模式：未列入允許清單的設定檔目標會被拒絕，且持久設定檔的建立/刪除路由會透過代理被封鎖。

如有需要，可在 Node 上停用：

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## 執行（前景）

```bash
openclaw node run --host <gateway-host> --port 18789
```

選項：

- `--host <host>`：Gateway WebSocket 主機（預設：`127.0.0.1`）
- `--port <port>`：Gateway WebSocket 連接埠（預設：`18789`）
- `--tls`：對 gateway 連線使用 TLS
- `--tls-fingerprint <sha256>`：預期的 TLS 憑證指紋（sha256）
- `--node-id <id>`：覆寫 node id（清除 pairing token）
- `--display-name <name>`：覆寫 Node 顯示名稱

## Node 主機的 Gateway 驗證

`openclaw node run` 和 `openclaw node install` 會從 config/env 解析 gateway 驗證（Node 命令沒有 `--token`/`--password` 旗標）：

- 會先檢查 `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 接著使用本機設定後援：`gateway.auth.token` / `gateway.auth.password`。
- 在本機模式中，Node 主機刻意不繼承 `gateway.remote.token` / `gateway.remote.password`。
- 如果 `gateway.auth.token` / `gateway.auth.password` 透過 SecretRef 明確設定但無法解析，Node 驗證解析會關閉失敗（不以遠端後援遮蔽）。
- 在 `gateway.mode=remote` 中，遠端用戶端欄位（`gateway.remote.token` / `gateway.remote.password`）也會依遠端優先順序規則納入資格。
- Node 主機驗證解析只採用 `OPENCLAW_GATEWAY_*` 環境變數。

對於連線到受信任私人網路中非 loopback `ws://` Gateway 的 Node，請設定 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`。若未設定，Node 啟動會關閉失敗，並要求你使用 `wss://`、SSH 通道或 Tailscale。
這是程序環境的選擇加入項，不是 `openclaw.json` 設定鍵。
當 `openclaw node install` 的安裝命令環境中存在此項時，會將它持久化到受監督的 Node 服務中。

## 服務（背景）

將無頭 Node 主機安裝為使用者服務。

```bash
openclaw node install --host <gateway-host> --port 18789
```

選項：

- `--host <host>`：Gateway WebSocket 主機（預設：`127.0.0.1`）
- `--port <port>`：Gateway WebSocket 連接埠（預設：`18789`）
- `--tls`：對 gateway 連線使用 TLS
- `--tls-fingerprint <sha256>`：預期的 TLS 憑證指紋（sha256）
- `--node-id <id>`：覆寫 node id（清除 pairing token）
- `--display-name <name>`：覆寫 Node 顯示名稱
- `--runtime <runtime>`：服務執行階段（`node` 或 `bun`）
- `--force`：如果已安裝，重新安裝/覆寫

管理服務：

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

使用 `openclaw node run` 以前景方式執行 Node 主機（無服務）。

服務命令接受 `--json`，以產生機器可讀輸出。

Node 主機會在程序內重試 Gateway 重新啟動與網路關閉。如果 Gateway 回報終端 token/password/bootstrap 驗證暫停，Node 主機會記錄關閉詳細資訊並以非零狀態結束，讓 launchd/systemd 可以用新的設定與憑證重新啟動它。需要 pairing 的暫停會保留在前景流程中，讓待處理請求可以被核准。

## Pairing

第一次連線會在 Gateway 上建立待處理的裝置 pairing 請求（`role: node`）。
透過以下方式核准：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

在嚴格控管的 Node 網路中，Gateway 操作者可以明確選擇加入，從受信任 CIDR 自動核准首次 Node pairing：

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

此功能預設停用。它只套用於沒有要求 scopes 的全新 `role: node` pairing。操作者/瀏覽器用戶端、Control UI、WebChat，以及 role、scope、metadata 或 public-key 升級仍需要手動核准。

如果 Node 使用變更後的驗證詳細資訊（role/scopes/public key）重試 pairing，先前的待處理請求會被取代，並建立新的 `requestId`。
核准前請再次執行 `openclaw devices list`。

Node 主機會將其 node id、token、顯示名稱與 gateway 連線資訊儲存在
`~/.openclaw/node.json`。

## Exec 核准

`system.run` 受本機 exec 核准控管：

- `~/.openclaw/exec-approvals.json`
- [Exec 核准](/zh-TW/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>`（從 Gateway 編輯）

對於已核准的非同步 Node exec，OpenClaw 會在提示前準備標準的 `systemRunPlan`。
後續已核准的 `system.run` 轉送會重用該已儲存的計畫，因此在核准請求建立後對 command/cwd/session 欄位的編輯會被拒絕，而不是改變 Node 執行的內容。

## 相關

- [CLI 參考](/zh-TW/cli)
- [Nodes](/zh-TW/nodes)

---
read_when:
    - 執行無頭節點主機
    - 配對非 macOS 節點以使用 system.run
summary: '`openclaw node` 的 CLI 參考（無頭節點主機）'
title: Node
x-i18n:
    generated_at: "2026-05-06T17:54:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: af4735ac4961dc36fd3f11299eb3ec4e156835e7257b21a79bb1d4b467445faa
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

執行一個連線到 Gateway WebSocket 的**無頭 Node 主機**，並在這台機器上公開
`system.run` / `system.which`。

## 為什麼使用 Node 主機？

當你想讓代理程式在網路中的**其他機器上執行命令**，但不想在那裡安裝完整的 macOS companion app 時，請使用 Node 主機。

常見使用案例：

- 在遠端 Linux/Windows 機器上執行命令（建置伺服器、實驗室機器、NAS）。
- 讓 exec 在 gateway 上保持**沙盒化**，但將已核准的執行委派給其他主機。
- 為自動化或 CI Node 提供輕量、無頭的執行目標。

執行仍受 **exec 核准**與 Node 主機上的每代理程式允許清單保護，因此你可以讓命令存取保持限定且明確。

## 瀏覽器 Proxy（零設定）

如果 Node 上的 `browser.enabled` 未停用，Node 主機會自動宣告瀏覽器 Proxy。這可讓代理程式在該 Node 上使用瀏覽器自動化，無需額外設定。

預設情況下，Proxy 會公開 Node 的一般瀏覽器設定檔介面。如果你設定
`nodeHost.browserProxy.allowProfiles`，Proxy 會變成限制模式：
非允許清單中的設定檔目標會遭拒，且持久設定檔的建立/刪除路由會透過 Proxy 被封鎖。

如有需要，可在 Node 上停用它：

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
- `--node-id <id>`：覆寫 Node id（清除配對 token）
- `--display-name <name>`：覆寫 Node 顯示名稱

## Node 主機的 Gateway 驗證

`openclaw node run` 和 `openclaw node install` 會從設定/env 解析 gateway 驗證（Node 命令沒有 `--token`/`--password` 旗標）：

- 會先檢查 `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 接著使用本機設定後援：`gateway.auth.token` / `gateway.auth.password`。
- 在本機模式下，Node 主機刻意不繼承 `gateway.remote.token` / `gateway.remote.password`。
- 如果 `gateway.auth.token` / `gateway.auth.password` 明確透過 SecretRef 設定但無法解析，Node 驗證解析會失敗關閉（不會用遠端後援掩蓋）。
- 在 `gateway.mode=remote` 中，遠端用戶端欄位（`gateway.remote.token` / `gateway.remote.password`）也會依遠端優先順序規則符合資格。
- Node 主機驗證解析只遵循 `OPENCLAW_GATEWAY_*` env vars。

若 Node 要連線到受信任私人網路上非迴圈位址的 `ws://` Gateway，請設定
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`。若未設定，Node 啟動會失敗關閉，並要求你使用 `wss://`、SSH 通道或 Tailscale。
這是程序環境的選擇加入，不是 `openclaw.json` 設定鍵。
當安裝命令環境中存在此值時，`openclaw node install` 會將它保存到受監督的 Node 服務中。

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
- `--node-id <id>`：覆寫 Node id（清除配對 token）
- `--display-name <name>`：覆寫 Node 顯示名稱
- `--runtime <runtime>`：服務 runtime（`node` 或 `bun`）
- `--force`：如果已安裝則重新安裝/覆寫

管理服務：

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

使用 `openclaw node run` 執行前景 Node 主機（沒有服務）。

服務命令接受 `--json` 以輸出機器可讀的內容。

Node 主機會在程序內重試 Gateway 重新啟動與網路關閉。如果 Gateway 回報終止性的 token/password/bootstrap 驗證暫停，Node 主機會記錄關閉詳細資訊並以非零狀態結束，讓 launchd/systemd 可以用新的設定與認證重新啟動它。需要配對的暫停會留在前景流程中，以便待處理的請求可被核准。

## 配對

第一次連線會在 Gateway 上建立待處理的裝置配對請求（`role: node`）。
透過以下方式核准：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

在嚴格控管的 Node 網路中，Gateway 操作者可以明確選擇加入，從受信任 CIDR 自動核准首次 Node 配對：

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

此功能預設停用。它只適用於沒有請求範圍的全新 `role: node` 配對。操作者/瀏覽器用戶端、Control UI、WebChat，以及角色、範圍、中繼資料或公開金鑰升級仍需要手動核准。

如果 Node 以變更後的驗證詳細資訊（角色/範圍/公開金鑰）重試配對，先前待處理的請求會被取代，並建立新的 `requestId`。
核准前請再次執行 `openclaw devices list`。

Node 主機會將其 Node id、token、顯示名稱與 gateway 連線資訊儲存在
`~/.openclaw/node.json`。

## Exec 核准

`system.run` 由本機 exec 核准控管：

- `~/.openclaw/exec-approvals.json`
- [Exec 核准](/zh-TW/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>`（從 Gateway 編輯）

對於已核准的非同步 Node exec，OpenClaw 會在提示前準備標準的 `systemRunPlan`。
稍後已核准的 `system.run` 轉送會重用該已儲存的計畫，因此在核准請求建立後對 command/cwd/session 欄位所做的編輯會被拒絕，而不是改變 Node 執行的內容。

## 相關

- [CLI 參考](/zh-TW/cli)
- [Node](/zh-TW/nodes)

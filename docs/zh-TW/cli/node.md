---
read_when:
    - 執行無周邊節點主機
    - 配對非 macOS 節點以使用 system.run
summary: '`openclaw node`（無頭節點主機）的命令列介面參考'
title: 節點
x-i18n:
    generated_at: "2026-06-27T19:06:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03a1b02e90f8f5f7edcfb2e7fd75ef0cbbdeae79dc0ce91339f31a80daeaaa92
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

執行一個**無介面的節點主機**，連線到閘道 WebSocket，並在此機器上公開
`system.run` / `system.which`。

## 為什麼使用節點主機？

當你希望代理在網路中的**其他機器上執行命令**，但不想在那裡安裝完整的 macOS
伴隨應用程式時，請使用節點主機。

常見使用情境：

- 在遠端 Linux/Windows 機器上執行命令（建置伺服器、實驗室機器、NAS）。
- 將 exec 保持在閘道上**沙箱化**，但將已核准的執行委派給其他主機。
- 為自動化或 CI 節點提供輕量、無介面的執行目標。

執行仍會受到節點主機上的 **exec 核准**與各代理允許清單保護，因此你可以讓命令存取保持有範圍且明確。

## 瀏覽器代理（零設定）

如果節點上的 `browser.enabled` 未被停用，節點主機會自動公告瀏覽器代理。這讓代理能在該節點上使用瀏覽器自動化，而不需要額外設定。

預設情況下，代理會公開節點的一般瀏覽器設定檔介面。如果你設定
`nodeHost.browserProxy.allowProfiles`，代理會變成限制模式：
未列入允許清單的設定檔目標會被拒絕，且持久設定檔的建立/刪除路由會透過代理被封鎖。

如有需要，可在節點上停用：

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

- `--host <host>`：閘道 WebSocket 主機（預設：`127.0.0.1`）
- `--port <port>`：閘道 WebSocket 連接埠（預設：`18789`）
- `--tls`：對閘道連線使用 TLS
- `--tls-fingerprint <sha256>`：預期的 TLS 憑證指紋（sha256）
- `--node-id <id>`：覆寫節點 ID（清除配對權杖）
- `--display-name <name>`：覆寫節點顯示名稱

## 節點主機的閘道驗證

`openclaw node run` 和 `openclaw node install` 會從 config/env 解析閘道驗證（節點命令上沒有 `--token`/`--password` 旗標）：

- 會先檢查 `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 然後使用本機設定後援：`gateway.auth.token` / `gateway.auth.password`。
- 在本機模式中，節點主機刻意不繼承 `gateway.remote.token` / `gateway.remote.password`。
- 如果 `gateway.auth.token` / `gateway.auth.password` 透過 SecretRef 明確設定但無法解析，節點驗證解析會關閉失敗（不會以遠端後援遮蔽）。
- 在 `gateway.mode=remote` 中，遠端用戶端欄位（`gateway.remote.token` / `gateway.remote.password`）也會依遠端優先順序規則納入資格。
- 節點主機驗證解析只採用 `OPENCLAW_GATEWAY_*` 環境變數。

對於連線到純文字 `ws://` 閘道的節點，會接受 loopback、私人 IP
字面值、`.local`，以及 Tailnet `*.ts.net` 主機。對於其他受信任的私人 DNS
名稱，請設定 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`；否則節點啟動會關閉失敗，並要求你使用 `wss://`、SSH 通道或
Tailscale。這是程序環境的選擇加入，不是 `openclaw.json` 設定鍵。
當 `openclaw node install` 的安裝命令環境中存在它時，會將其持久化到受監督的節點服務中。

## 服務（背景）

將無介面的節點主機安裝為使用者服務。

```bash
openclaw node install --host <gateway-host> --port 18789
```

選項：

- `--host <host>`：閘道 WebSocket 主機（預設：`127.0.0.1`）
- `--port <port>`：閘道 WebSocket 連接埠（預設：`18789`）
- `--tls`：對閘道連線使用 TLS
- `--tls-fingerprint <sha256>`：預期的 TLS 憑證指紋（sha256）
- `--node-id <id>`：覆寫節點 ID（清除配對權杖）
- `--display-name <name>`：覆寫節點顯示名稱
- `--runtime <runtime>`：服務執行階段（`node` 或 `bun`）
- `--force`：如果已安裝，則重新安裝/覆寫

管理服務：

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

使用 `openclaw node run` 執行前景節點主機（無服務）。

服務命令接受 `--json` 以輸出機器可讀格式。

節點主機會在程序內重試閘道重新啟動與網路關閉。如果閘道回報終止性的權杖/密碼/bootstrap 驗證暫停，節點主機會記錄關閉詳細資訊並以非零狀態結束，讓 launchd/systemd 能用新的設定與憑證重新啟動它。需要配對的暫停會停留在前景流程中，讓待處理請求可以被核准。

## 配對

第一次連線會在閘道上建立待處理裝置配對請求（`role: node`）。
透過以下方式核准：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

在嚴格控管的節點網路中，閘道操作員可以明確選擇加入，從受信任的 CIDR 自動核准首次節點配對：

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

此功能預設停用。它只適用於沒有請求範圍的新 `role: node` 配對。操作員/瀏覽器用戶端、控制介面、WebChat，以及角色、範圍、中繼資料或公開金鑰升級仍需要手動核准。

如果節點以變更後的驗證詳細資料（角色/範圍/公開金鑰）重試配對，先前的待處理請求會被取代，並建立新的 `requestId`。
核准前請再次執行 `openclaw devices list`。

節點主機會將其節點 ID、權杖、顯示名稱，以及閘道連線資訊儲存在
`~/.openclaw/node.json`。

## Exec 核准

`system.run` 受本機 exec 核准控管：

- `$OPENCLAW_STATE_DIR/exec-approvals.json`，或在未設定該變數時使用
  `~/.openclaw/exec-approvals.json`
- [Exec 核准](/zh-TW/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>`（從閘道編輯）

對於已核准的非同步節點 exec，OpenClaw 會在提示前準備一個標準 `systemRunPlan`。
稍後已核准的 `system.run` 轉送會重用該已儲存的計畫，因此在核准請求建立後對命令/cwd/session 欄位的編輯會被拒絕，而不是變更節點要執行的內容。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [節點](/zh-TW/nodes)

---
read_when:
    - 執行無頭節點主機
    - 配對非 macOS 節點以使用 system.run
summary: '`openclaw node`（無介面節點主機）的命令列介面參考'
title: 節點
x-i18n:
    generated_at: "2026-07-05T11:10:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6bb4efe3852bcbb7802acd882d698c44b62579ca8756c8e50473ce1aa97cad1b
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

執行一個**無頭節點主機**，連線到閘道 WebSocket，並在此機器上公開
`system.run` / `system.which`。

## 為什麼使用節點主機？

當你希望代理在你的網路中的**其他機器上執行命令**，但不想在那些機器上安裝完整的 macOS companion app 時，請使用節點主機。

常見使用案例：

- 在遠端 Linux/Windows 機器上執行命令（建置伺服器、實驗室機器、NAS）。
- 在閘道上讓 exec 維持**沙箱隔離**，但將已核准的執行委派給其他主機。
- 為自動化或 CI 節點提供輕量、無頭的執行目標。

執行仍會受到節點主機上的 **exec 核准**與每代理允許清單保護，因此你可以讓命令存取保持有範圍且明確。

## 瀏覽器代理（零設定）

如果節點上未停用 `browser.enabled`，節點主機會自動通告瀏覽器代理。這可讓代理在該節點上使用瀏覽器自動化，而不需要額外設定。

預設情況下，代理會公開節點的一般瀏覽器設定檔介面。如果你設定
`nodeHost.browserProxy.allowProfiles`，代理會變為限制模式：
不在允許清單中的設定檔目標會被拒絕，且持久設定檔的建立/刪除路由會透過代理被封鎖。

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
- `--context-path <path>`：閘道 WebSocket 內容路徑（例如 `/openclaw-gw`）。會附加到 WebSocket URL。
- `--tls`：對閘道連線使用 TLS
- `--tls-fingerprint <sha256>`：預期的 TLS 憑證指紋（sha256）
- `--node-id <id>`：覆寫節點 ID（清除配對權杖）
- `--display-name <name>`：覆寫節點顯示名稱

## 節點主機的閘道驗證

`openclaw node run` 和 `openclaw node install` 會從設定/env 解析閘道驗證（節點命令沒有 `--token`/`--password` 旗標）：

- 會先檢查 `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 接著使用本機設定後援：`gateway.auth.token` / `gateway.auth.password`。
- 在本機模式中，節點主機刻意不繼承 `gateway.remote.token` / `gateway.remote.password`。
- 如果 `gateway.auth.token` / `gateway.auth.password` 已透過 SecretRef 明確設定但無法解析，節點驗證解析會失敗即關閉（不以遠端後援遮蔽）。
- 在 `gateway.mode=remote` 中，遠端用戶端欄位（`gateway.remote.token` / `gateway.remote.password`）也會依遠端優先順序規則符合資格。
- 節點主機驗證解析只接受 `OPENCLAW_GATEWAY_*` env vars。

對於連線到純文字 `ws://` 閘道的節點，會接受 loopback、私有 IP
字面值、`.local`，以及 Tailnet `*.ts.net` 主機。對於其他受信任的私有 DNS 名稱，請設定 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`；若未設定，節點啟動會失敗即關閉，並要求你使用 `wss://`、SSH tunnel 或
Tailscale。這是程序環境選擇加入，不是 `openclaw.json` 設定鍵。
當 `openclaw node install` 出現在安裝命令環境中時，會將它保存到受監督的節點服務。

## 服務（背景）

將無頭節點主機安裝為使用者服務（macOS 上為 launchd，Linux 上為 systemd，Windows 上為 Windows Task Scheduler）。

```bash
openclaw node install --host <gateway-host> --port 18789
```

選項：

- `--host <host>`：閘道 WebSocket 主機（預設：`127.0.0.1`）
- `--port <port>`：閘道 WebSocket 連接埠（預設：`18789`）
- `--context-path <path>`：閘道 WebSocket 內容路徑（例如 `/openclaw-gw`）。會附加到 WebSocket URL。
- `--tls`：對閘道連線使用 TLS
- `--tls-fingerprint <sha256>`：預期的 TLS 憑證指紋（sha256）
- `--node-id <id>`：覆寫節點 ID（清除配對權杖）
- `--display-name <name>`：覆寫節點顯示名稱
- `--runtime <runtime>`：服務執行階段（`node` 或 `bun`）
- `--force`：若已安裝，則重新安裝/覆寫

管理服務：

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

使用 `openclaw node run` 執行前景節點主機（不使用服務）。

服務命令接受 `--json` 以輸出機器可讀格式。

節點主機會在程序內重試閘道重新啟動與網路關閉。如果閘道回報終止性的權杖/密碼/bootstrap 驗證暫停，節點主機會記錄關閉詳細資訊並以非零狀態退出，讓 launchd/systemd/Task Scheduler 可以使用新的設定與認證重新啟動它。需要配對的暫停會留在前景流程中，以便核准待處理的請求。

## 配對

第一次連線會在閘道上建立待處理的裝置配對請求（`role: node`）。
透過以下方式核准：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

在嚴格控管的節點網路中，閘道操作者可以明確選擇加入，從受信任 CIDR 自動核准首次節點配對：

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

這預設為停用（未設定 `autoApproveCidrs`）。它只適用於來自閘道信任之用戶端 IP、沒有請求範圍的全新 `role: node` 配對。操作者/瀏覽器用戶端、Control UI、WebChat，以及角色、範圍、中繼資料或公開金鑰升級仍需要手動核准。

如果節點以變更後的驗證詳細資訊（角色/範圍/公開金鑰）重試配對，先前的待處理請求會被取代，並建立新的 `requestId`。
核准前請再次執行 `openclaw devices list`。

節點主機會將其節點 ID、權杖、顯示名稱和閘道連線資訊儲存在 OpenClaw 狀態目錄中的 `node.json`（預設為 `~/.openclaw`，或在設定時使用 `$OPENCLAW_STATE_DIR`）。

## Exec 核准

`system.run` 受本機 exec 核准控管：

- `$OPENCLAW_STATE_DIR/exec-approvals.json`，或
  未設定變數時的 `~/.openclaw/exec-approvals.json`
- [Exec 核准](/zh-TW/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>`（從閘道編輯）

對於已核准的非同步節點 exec，OpenClaw 會在提示前準備標準的 `systemRunPlan`。
稍後核准的 `system.run` 轉送會重用該已儲存的計畫，因此在核准請求建立後對 command/cwd/session 欄位的編輯會被拒絕，而不是改變節點要執行的內容。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [節點](/zh-TW/nodes)

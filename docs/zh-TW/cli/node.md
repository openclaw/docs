---
read_when:
    - 執行無頭節點主機
    - 配對非 macOS 節點以使用 system.run
summary: '`openclaw node`（無頭節點主機）的命令列介面參考資料'
title: 節點
x-i18n:
    generated_at: "2026-07-16T11:30:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d17b96b8829bef4202ff220d9b20e04c183702f997f669120cb16aa7191235b6
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

執行一個連線至閘道 WebSocket 的**無介面節點主機**，並在這台機器上公開
`system.run` / `system.which`。

在 macOS 上，選單列應用程式已將此節點主機執行階段內嵌至自身的
節點連線，並加入原生 Mac 功能。只有在刻意要使用不含應用程式的無介面節點時，才在
Mac 上使用 `openclaw node run`。同時執行兩者會為同一台機器建立兩個節點身分。

## 為何使用節點主機？

若要讓代理程式在網路中的**其他機器上執行命令**，但不想在那些機器上安裝完整的
macOS 配套應用程式，請使用節點主機。

常見使用案例：

- 在遠端 Linux/Windows 機器上執行命令（建置伺服器、實驗室機器、NAS）。
- 讓 exec 在閘道上保持**沙箱隔離**，但將已核准的執行委派給其他主機。
- 為自動化或 CI 節點提供輕量、無介面的執行目標。

節點主機上的**執行核准**與各代理程式允許清單仍會保護執行作業，因此可讓命令存取範圍保持受限且明確。

`openclaw node run` 可在連線後發布由外掛或 MCP 支援的工具。
閘道預設信任已配對節點提供的描述元，同時要求每個描述元的命令必須維持在節點已核准的命令範圍內。
代理程式會將每個接受的描述元視為一般外掛工具，但執行仍會經過
`node.invoke`，因此節點中斷連線後，新代理程式執行中便不再有該工具。
閘道操作員可透過
`gateway.nodes.pluginTools.enabled: false` 停用發布功能。

若要使用宣告式 MCP 工具，請在節點機器上的 `openclaw.json` 中，於
`nodeHost.mcp.servers` 下加入一般 MCP 伺服器結構，然後重新啟動節點主機。
節點會宣告受核准管制的 `mcp.tools.call.v1` 命令系列，並在連線後發布列出的工具；
之後變更伺服器清單不需要重新配對。請參閱
[節點託管的 MCP 伺服器](/zh-TW/nodes#node-hosted-mcp-servers)。

## 瀏覽器代理（零設定）

若節點上的 `browser.enabled` 未停用，節點主機會自動公布瀏覽器代理。
這可讓代理程式在該節點上使用瀏覽器自動化，而無須額外設定。

代理預設會公開節點的一般瀏覽器設定檔介面。若設定
`nodeHost.browserProxy.allowProfiles`，代理將採取限制模式：
系統會拒絕指定不在允許清單內的設定檔，並透過代理封鎖永久設定檔的建立／刪除路由。

如有需要，請在節點上停用：

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
- `--context-path <path>`：閘道 WebSocket 內容路徑（例如 `/openclaw-gw`）。會附加至 WebSocket URL。
- `--tls`：閘道連線使用 TLS
- `--no-tls`：即使本機閘道設定已啟用 TLS，仍強制使用純文字閘道連線
- `--tls-fingerprint <sha256>`：預期的 TLS 憑證指紋（sha256）
- `--node-id <id>`：覆寫儲存在共用 SQLite 狀態中的用戶端執行個體 ID（不會重設配對）
- `--display-name <name>`：覆寫節點顯示名稱

## 節點主機的閘道驗證

`openclaw node run` 和 `openclaw node install` 會從設定／環境解析閘道驗證（節點命令不提供 `--token`/`--password` 旗標）：

- 優先檢查 `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 然後回退至本機設定：`gateway.auth.token` / `gateway.auth.password`。
- 在本機模式下，節點主機刻意不繼承 `gateway.remote.token` / `gateway.remote.password`。
- 若透過 SecretRef 明確設定的 `gateway.auth.token` / `gateway.auth.password` 無法解析，節點驗證解析會以關閉方式失敗（不會以遠端回退掩蓋問題）。
- 在 `gateway.mode=remote` 中，遠端用戶端欄位（`gateway.remote.token` / `gateway.remote.password`）也會依遠端優先順序規則納入考量。
- 節點主機驗證解析只採用 `OPENCLAW_GATEWAY_*` 環境變數。

對於連線至純文字 `ws://` 閘道的節點，系統接受迴路位址、私有 IP
常值、`.local`，以及 Tailnet `*.ts.net` 主機。對於其他受信任的
私有 DNS 名稱，請設定 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`；若未設定，
節點啟動會以關閉方式失敗，並要求你使用 `wss://`、SSH 通道或
Tailscale。這是處理程序環境的選擇性啟用項目，而不是 `openclaw.json` 設定
鍵。
若安裝命令環境中存在此設定，`openclaw node install` 會將其保留至受監督的節點服務中。

## 服務（背景）

將無介面節點主機安裝為使用者服務（macOS 使用 launchd、Linux 使用 systemd、
Windows 使用 Windows 工作排程器）。

```bash
openclaw node install --host <gateway-host> --port 18789
```

選項：

- `--host <host>`：閘道 WebSocket 主機（預設：`127.0.0.1`）
- `--port <port>`：閘道 WebSocket 連接埠（預設：`18789`）
- `--context-path <path>`：閘道 WebSocket 內容路徑（例如 `/openclaw-gw`）。會附加至 WebSocket URL。
- `--tls`：閘道連線使用 TLS
- `--tls-fingerprint <sha256>`：預期的 TLS 憑證指紋（sha256）
- `--node-id <id>`：覆寫儲存在共用 SQLite 狀態中的用戶端執行個體 ID（不會重設配對）
- `--display-name <name>`：覆寫節點顯示名稱
- `--runtime <runtime>`：服務執行階段（`node`）
- `--force`：若已安裝則重新安裝／覆寫

管理服務：

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

使用 `openclaw node run` 執行前景節點主機（不使用服務）。

服務命令接受 `--json`，以輸出機器可讀的內容。

節點主機會在處理程序內重試閘道重新啟動及網路關閉。若閘道回報終止性的權杖／密碼／啟動驗證暫停，
節點主機會記錄關閉詳細資料並以非零代碼結束，讓 launchd/systemd/工作排程器可使用最新設定與認證資訊重新啟動。
需要配對的暫停會留在前景流程中，以便核准待處理的要求。

## 配對

第一次連線會在閘道上建立待處理的裝置配對要求（`role: node`）。

當閘道主機能以非互動方式透過 SSH 連線至節點主機（相同使用者、
受信任的主機金鑰）時，待處理要求會自動獲得核准：閘道會透過 SSH 在節點主機上執行
`openclaw node identity --json`，並在裝置金鑰完全相符時予以核准。
此功能預設啟用；請參閱
[經 SSH 驗證的裝置自動核准](/zh-TW/gateway/pairing#ssh-verified-device-auto-approval-default)，
了解需求及停用方式（`gateway.nodes.pairing.sshVerify: false`）。

否則，請透過下列方式手動核准：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

檢查閘道據以驗證的本機節點身分：

```bash
openclaw node identity --json
```

它會輸出 `identity/device.json` 中的裝置 ID 和公開金鑰，且絕不會
建立或修改身分檔案。

在受到嚴格管控的節點網路中，閘道操作員可明確選擇自動核准來自受信任 CIDR 的首次節點配對：

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

此功能預設停用（未設定 `autoApproveCidrs`）。它僅適用於來自閘道所信任用戶端 IP、
未要求範圍的全新 `role: node` 配對。操作員／瀏覽器用戶端、控制介面、WebChat，以及角色、
範圍、中繼資料或公開金鑰升級仍須手動核准。

如果節點使用已變更的驗證詳細資料（角色／範圍／公開金鑰）重試配對，
先前的待處理要求會被取代，並建立新的 `requestId`。
核准前請再次執行 `openclaw devices list`。

### 身分與配對狀態

無介面節點會將其用戶端執行個體 ID，與閘道用於配對及路由的已簽署裝置
身分分開。此狀態位於 OpenClaw 狀態目錄（預設為 `~/.openclaw`，若設定
`$OPENCLAW_STATE_DIR` 則使用該值）：

| 狀態                                         | 用途                                                                                                                              |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `state/openclaw.sqlite` (`node_host_config`) | 用戶端執行個體 ID、顯示名稱及閘道連線中繼資料。用戶端會將此 ID 作為 `instanceId` 傳送。                     |
| `identity/device.json`                       | 已簽署的 Ed25519 金鑰組及衍生的裝置 ID。對於已簽署連線，此裝置 ID 是用於路由的節點 ID 及配對身分。 |
| `identity/device-auth.json`                  | 已配對裝置權杖，以密碼編譯裝置 ID 和角色作為索引鍵。                                                                 |

`--node-id` 只會變更共用 SQLite 狀態中的用戶端執行個體 ID。它不會
變更密碼編譯裝置 ID 或清除配對驗證。使用 `openclaw doctor --fix` 移轉已淘汰的
`node.json`，同樣不會重設配對。若要撤銷並重新配對節點：

1. 在閘道上執行 `openclaw nodes remove --node <id|name|ip>`。
2. 在節點上，使用 `openclaw node restart` 重新啟動已安裝的服務，或
   停止後重新執行前景 `openclaw node run` 命令。這會啟動
   裝置配對流程。如果 `openclaw devices list` 未顯示要求，
   且節點回報 `AUTH_DEVICE_TOKEN_MISMATCH`，請再重新啟動或重新執行一次。
   遭拒絕的嘗試會清除現已撤銷的本機權杖；下一次
   嘗試即可要求配對。
3. 在閘道上執行 `openclaw devices list`，然後執行
   `openclaw devices approve <deviceRequestId>`。
4. 再次重新啟動或重新執行節點。因配對而暫停的用戶端不會在核准後
   自動恢復；此次重新連線會建立獨立的
   命令範圍要求。
5. 在閘道上執行 `openclaw nodes pending`，然後執行
   `openclaw nodes approve <nodeRequestId>`。

這兩個要求 ID 並不相同。適用的受信任 CIDR 原則可
自動核准首次裝置配對步驟；命令範圍核准仍是
獨立的檢查。

舊版 OpenClaw 將節點主機狀態儲存在 `node.json` 中，且可能在其中留下
已淘汰的 `token` 欄位。停止節點主機並執行一次 `openclaw doctor --fix`；
Doctor 會將支援的身分及連線欄位匯入 SQLite、捨棄未使用的權杖欄位、
驗證資料列，並移除已淘汰的檔案。只要該檔案或中斷的 Doctor 宣告仍然存在，
一般節點命令便會以關閉方式失敗，並顯示此修復指示。請將 `identity/` 下的兩個檔案保持私密；
其中包含裝置金鑰組和驗證權杖。

## 執行核准

`system.run` 受本機執行核准管制：

- `$OPENCLAW_STATE_DIR/exec-approvals.json`，或
  在未設定變數時使用 `~/.openclaw/exec-approvals.json`
- [執行核准](/zh-TW/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>`（從閘道編輯）

對於已核准的非同步節點執行，OpenClaw 會在提示前準備標準化的 `systemRunPlan`。
之後核准的 `system.run` 轉送會重複使用該已儲存
計畫，因此在建立核准要求後對命令／cwd／工作階段欄位所做的編輯
會遭拒絕，而不會變更節點執行的內容。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [節點](/zh-TW/nodes)

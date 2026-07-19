---
read_when:
    - 執行無頭節點主機
    - 配對非 macOS 節點以使用 system.run
summary: '`openclaw node`（無頭節點主機）的命令列介面參考指南'
title: 節點
x-i18n:
    generated_at: "2026-07-19T13:40:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c229e50dcff790a08ef155561a15a39220d6dccdc263d4a3d01ab8592f48de73
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

執行連線至閘道 WebSocket 的**無頭節點主機**，並在此機器上公開
`system.run` / `system.which`。

在 macOS 上，選單列應用程式已將此節點主機執行階段嵌入其本身的
節點連線，並加入原生 Mac 功能。只有在你刻意想要不含應用程式的無頭節點時，才在
Mac 上使用 `openclaw node run`。同時執行兩者會為同一台機器建立兩個節點身分。

## 為何使用節點主機？

當你想讓代理程式在網路中的**其他機器上執行命令**，但不想在那些機器上安裝完整的 macOS
配套應用程式時，請使用節點主機。

常見使用案例：

- 在遠端 Linux/Windows 機器上執行命令（建置伺服器、實驗室機器、NAS）。
- 讓 exec 在閘道上保持**沙箱隔離**，但將已核准的執行委派給其他主機。
- 為自動化或 CI 節點提供輕量的無頭執行目標。

執行仍受節點主機上的 **exec 核准**與各代理程式允許清單保護，因此你可以讓命令存取範圍保持明確且受限。

`openclaw node run` 連線後可以發布由外掛或 MCP 支援的工具。
閘道預設信任已配對節點提供的描述元，同時要求每個描述元的命令都必須保留在節點已核准的命令介面內。
代理程式會將每個已接受的描述元視為一般外掛工具，但執行仍會
經過 `node.invoke`，因此中斷節點連線會從新的
代理程式執行中移除該工具。閘道操作員可以使用
`gateway.nodes.pluginTools.enabled: false` 停用發布。

若要使用宣告式 MCP 工具，請在節點機器上的 `openclaw.json` 中，
於 `nodeHost.mcp.servers` 下加入一般 MCP 伺服器結構，然後重新啟動
節點主機。節點會宣告受核准管控的 `mcp.tools.call.v1` 命令
系列，並在連線後發布列出的工具；之後變更伺服器清單
不需要重新配對。請參閱
[節點託管的 MCP 伺服器](/zh-TW/nodes#node-hosted-mcp-servers)。

## 瀏覽器代理（零設定）

若節點上未停用 `browser.enabled`，節點主機會自動公布瀏覽器代理。
這可讓代理程式在該節點上使用瀏覽器自動化，而不需額外設定。

預設情況下，代理會公開節點的一般瀏覽器設定檔介面。如果你
設定 `nodeHost.browserProxy.allowProfiles`，代理將變得更嚴格：
系統會拒絕指定不在允許清單內的設定檔，並透過代理封鎖永久設定檔的
建立／刪除路由。

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
- `--context-path <path>`：閘道 WebSocket 內容路徑（例如 `/openclaw-gw`）。附加至 WebSocket URL。
- `--tls`：對閘道連線使用 TLS
- `--no-tls`：即使本機閘道設定啟用 TLS，也強制使用明文閘道連線
- `--tls-fingerprint <sha256>`：預期的 TLS 憑證指紋（sha256）
- `--node-id <id>`：覆寫儲存在共用 SQLite 狀態中的用戶端執行個體 ID（不會重設配對）
- `--display-name <name>`：覆寫節點顯示名稱

## 節點主機的閘道驗證

`openclaw node run` 和 `openclaw node install` 會從設定／環境解析閘道驗證（節點命令沒有 `--token`/`--password` 旗標）：

- 會先檢查 `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 接著回退至本機設定：`gateway.auth.token` / `gateway.auth.password`。
- 在本機模式中，節點主機刻意不繼承 `gateway.remote.token` / `gateway.remote.password`。
- 如果透過 SecretRef 明確設定了 `gateway.auth.token` / `gateway.auth.password`，但無法解析，節點驗證解析會以關閉方式失敗（不會以遠端回退掩蓋）。
- 在 `gateway.mode=remote` 中，遠端用戶端欄位（`gateway.remote.token` / `gateway.remote.password`）也會依遠端優先順序規則納入考量。
- 節點主機驗證解析只採用 `OPENCLAW_GATEWAY_*` 環境變數。

對於連線至明文 `ws://` 閘道的節點，可接受回送位址、私有 IP
常值、`.local`，以及 Tailnet `*.ts.net` 主機。對於其他
受信任的私有 DNS 名稱，請設定 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`；若未設定，
節點啟動會以關閉方式失敗，並要求你使用 `wss://`、SSH 通道或
Tailscale。這是程序環境的選擇性啟用項目，而不是 `openclaw.json` 設定
鍵。
如果安裝命令的環境中存在此設定，`openclaw node install` 會將其保存至受監管的節點服務中。

## 服務（背景）

將無頭節點主機安裝為使用者服務（macOS 上使用 launchd、Linux 上使用 systemd，
Windows 上使用 Windows Task Scheduler）。

```bash
openclaw node install --host <gateway-host> --port 18789
```

選項：

- `--host <host>`：閘道 WebSocket 主機（預設：`127.0.0.1`）
- `--port <port>`：閘道 WebSocket 連接埠（預設：`18789`）
- `--context-path <path>`：閘道 WebSocket 內容路徑（例如 `/openclaw-gw`）。附加至 WebSocket URL。
- `--tls`：對閘道連線使用 TLS
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

服務命令接受 `--json`，以輸出機器可讀格式。

節點主機會在程序內重試閘道重新啟動和網路連線關閉。如果
閘道回報終止性的權杖／密碼／啟動驗證暫停，節點主機會
記錄關閉詳細資料並以非零狀態結束，讓 launchd/systemd/Task Scheduler 可以
使用最新的設定和認證資訊重新啟動。需要配對的暫停會保留在
前景流程中，以便核准待處理的要求。

## 配對

第一次連線會在閘道上建立待處理的裝置配對要求（`role: node`）。

當閘道主機可以非互動方式透過 SSH 連線至節點主機（相同使用者、
受信任的主機金鑰）時，待處理要求會自動核准：閘道
透過 SSH 在節點主機上執行 `openclaw node identity --json`，並在
裝置金鑰完全相符時核准。此功能預設啟用；請參閱
[經 SSH 驗證的裝置自動核准](/zh-TW/gateway/pairing#ssh-verified-device-auto-approval-default)，
了解需求以及如何停用（`gateway.nodes.pairing.sshVerify: false`）。

否則請透過下列方式手動核准：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

檢查閘道用來驗證的本機節點身分：

```bash
openclaw node identity --json
```

它會列印 `state/openclaw.sqlite` 中 `primary` 資料列的裝置 ID 和公開金鑰，
且絕不會建立資料庫或新身分。

在嚴格管控的節點網路中，閘道操作員可以明確選擇啟用
從受信任 CIDR 自動核准首次節點配對：

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

此功能預設停用（未設定 `autoApproveCidrs`）。它僅適用於
未要求任何範圍、來自閘道信任之用戶端 IP 的全新
`role: node` 配對。操作員／瀏覽器用戶端、Control UI、WebChat，以及角色、
範圍、中繼資料或公開金鑰升級仍需手動核准。

如果節點使用已變更的驗證詳細資料（角色／範圍／公開金鑰）重試配對，
先前待處理的要求會被取代，並建立新的 `requestId`。
核准前請再次執行 `openclaw devices list`。

### 身分與配對狀態

無頭節點會將其用戶端執行個體 ID，與閘道用於配對和路由的已簽署裝置
身分分開。此狀態位於 OpenClaw 狀態目錄（預設為 `~/.openclaw`，
設定後則為 `$OPENCLAW_STATE_DIR`）：

| 狀態                                                     | 用途                                                                                                                             |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `state/openclaw.sqlite` (`node_host_config`)             | 用戶端執行個體 ID、顯示名稱和閘道連線中繼資料。用戶端會將此 ID 作為 `instanceId` 傳送。                     |
| `state/openclaw.sqlite` (`device_identities`, `primary`) | 已簽署的 Ed25519 金鑰組和衍生的裝置 ID。對於已簽署的連線，此裝置 ID 是路由所用的節點 ID 和配對身分。 |
| `identity/device-auth.json`                              | 已配對裝置權杖，以密碼編譯裝置 ID 和角色為鍵。                                                                                   |

`--node-id` 只會變更共用 SQLite 狀態中的用戶端執行個體 ID。它
不會變更密碼編譯裝置 ID，也不會清除配對驗證。使用 `openclaw doctor --fix`
移轉已淘汰的 `node.json`，同樣不會重設配對。若要撤銷節點並重新配對：

1. 在閘道上執行 `openclaw nodes remove --node <id|name|ip>`。
2. 在節點上使用 `openclaw node restart` 重新啟動已安裝的服務，或
   停止並重新執行前景 `openclaw node run` 命令。這會啟動
   裝置配對流程。如果 `openclaw devices list` 未顯示要求，
   且節點回報 `AUTH_DEVICE_TOKEN_MISMATCH`，請再次重新啟動或重新執行。
   被拒絕的嘗試會清除現在已撤銷的本機權杖；下一次
   嘗試即可要求配對。
3. 在閘道上執行 `openclaw devices list`，然後執行
   `openclaw devices approve <deviceRequestId>`。
4. 再次重新啟動或重新執行節點。因配對而暫停的用戶端不會在
   核准後自動繼續；此次重新連線會建立獨立的
   命令介面要求。
5. 在閘道上執行 `openclaw nodes pending`，然後執行
   `openclaw nodes approve <nodeRequestId>`。

這兩個要求 ID 不同。適用的受信任 CIDR 政策可以
自動核准首次裝置配對步驟；命令介面核准仍是
另一項獨立檢查。

較舊的 OpenClaw 版本會將節點主機狀態儲存在 `node.json`，並將已簽署
身分儲存在 `identity/device.json`。停止節點主機並執行一次
`openclaw doctor --fix`；Doctor 會接管每個已淘汰的來源、進行驗證、
匯入並確認標準 SQLite 資料列，然後移除舊檔案。當任一已淘汰檔案
或中斷的 Doctor 接管仍存在時，一般節點命令會以關閉方式失敗，並顯示此修復指示。
請將 `state/openclaw.sqlite` 和 `identity/device-auth.json` 保持私密；它們包含裝置金鑰組和驗證
權杖。裝置驗證仍使用獨立的儲存區，不會因身分移轉而重寫。

## Exec 核准

`system.run` 受本機 exec 核准管控：

- `$OPENCLAW_STATE_DIR/exec-approvals.json`，或
  在未設定變數時使用 `~/.openclaw/exec-approvals.json`
- [Exec 核准](/zh-TW/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>`（從閘道編輯）

對於已核准的非同步節點 exec，OpenClaw 會在提示前準備標準的
`systemRunPlan`。之後核准的 `system.run` 轉送會重複使用該儲存的
計畫，因此核准要求建立後對命令／cwd／工作階段欄位所做的編輯
會遭到拒絕，而不會變更節點實際執行的內容。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [節點](/zh-TW/nodes)

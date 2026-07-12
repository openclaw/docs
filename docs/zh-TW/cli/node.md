---
read_when:
    - 執行無頭節點主機
    - 配對非 macOS 節點以使用 system.run
summary: '`openclaw node` 的命令列介面參考（無介面節點主機）'
title: 節點
x-i18n:
    generated_at: "2026-07-12T21:23:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c350655e902f36ecf578c98edf0583ee6621dea6b916cc8da08c35673fef8e49
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

執行連線至閘道 WebSocket 的**無介面節點主機**，並在此機器上公開
`system.run` / `system.which`。

在 macOS 上，選單列應用程式已將此節點主機執行環境嵌入其本身的
節點連線，並加入原生 Mac 功能。只有在你刻意想使用不含應用程式的
無介面節點時，才應在 Mac 上使用 `openclaw node run`。同時執行
兩者會為同一台機器建立兩個節點身分。

## 為什麼要使用節點主機？

當你想讓代理程式在網路中的**其他機器上執行命令**，但不想在那些機器上
安裝完整的 macOS 配套應用程式時，可使用節點主機。

常見使用案例：

- 在遠端 Linux/Windows 機器（建置伺服器、實驗室機器、NAS）上執行命令。
- 在閘道上保持執行作業**受沙箱隔離**，但將已核准的執行委派給其他主機。
- 為自動化或 CI 節點提供輕量、無介面的執行目標。

執行作業仍受節點主機上的**執行核准**和各代理程式允許清單保護，
因此你可以讓命令存取範圍保持明確且有所限制。

`openclaw node run` 連線後可以發布由外掛或 MCP 支援的工具。
閘道預設信任來自已配對節點的描述項，但要求每個描述項的命令
仍須位於該節點已核准的命令介面中。代理程式會將每個接受的描述項
視為一般外掛工具，但執行仍會經過 `node.invoke`，因此中斷節點連線
會從新的代理程式執行中移除該工具。閘道操作員可以使用
`gateway.nodes.pluginTools.enabled: false` 停用發布功能。

若要使用宣告式 MCP 工具，請在節點機器的 `openclaw.json` 中，
於 `nodeHost.mcp.servers` 下加入一般的 MCP 伺服器結構，然後重新啟動
節點主機。節點會宣告受核准管控的 `mcp.tools.call.v1` 命令
系列，並在連線後發布列出的工具；之後變更伺服器清單
不需要重新配對。請參閱
[節點託管的 MCP 伺服器](/zh-TW/nodes#node-hosted-mcp-servers)。

## 瀏覽器代理（零設定）

如果節點上的 `browser.enabled` 未停用，節點主機會自動公告瀏覽器代理。
這可讓代理程式在該節點上使用瀏覽器自動化，而不需要額外設定。

代理預設會公開節點的一般瀏覽器設定檔介面。如果你設定
`nodeHost.browserProxy.allowProfiles`，代理會轉為限制模式：
系統會拒絕以不在允許清單中的設定檔為目標，並封鎖透過代理建立／刪除
永久設定檔的路由。

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
- `--no-tls`：即使本機閘道設定已啟用 TLS，仍強制使用純文字閘道連線
- `--tls-fingerprint <sha256>`：預期的 TLS 憑證指紋（sha256）
- `--node-id <id>`：覆寫儲存在 `node.json` 中的舊版用戶端執行個體 ID（不會重設配對）
- `--display-name <name>`：覆寫節點顯示名稱

## 節點主機的閘道驗證

`openclaw node run` 和 `openclaw node install` 會從設定／環境解析閘道驗證（節點命令沒有 `--token`／`--password` 旗標）：

- 會先檢查 `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 接著使用本機設定後援：`gateway.auth.token` / `gateway.auth.password`。
- 在本機模式中，節點主機刻意不繼承 `gateway.remote.token` / `gateway.remote.password`。
- 如果透過 SecretRef 明確設定了 `gateway.auth.token` / `gateway.auth.password`，但無法解析，節點驗證解析會採取失敗關閉（不以遠端後援遮蔽問題）。
- 在 `gateway.mode=remote` 中，遠端用戶端欄位（`gateway.remote.token` / `gateway.remote.password`）也會依遠端優先順序規則納入考量。
- 節點主機驗證解析只採用 `OPENCLAW_GATEWAY_*` 環境變數。

若節點要連線至純文字 `ws://` 閘道，則接受回送位址、私有 IP
常值、`.local` 和 Tailnet `*.ts.net` 主機。若要使用其他
受信任的私有 DNS 名稱，請設定 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`；
若未設定，節點啟動會採取失敗關閉，並要求你使用 `wss://`、SSH 通道或
Tailscale。這是程序環境的選擇性啟用項目，而非 `openclaw.json` 設定
鍵。
當安裝命令環境中存在此設定時，`openclaw node install` 會將其保存至
受監管的節點服務中。

## 服務（背景）

將無介面節點主機安裝為使用者服務（macOS 使用 launchd、Linux 使用
systemd、Windows 使用 Windows Task Scheduler）。

```bash
openclaw node install --host <gateway-host> --port 18789
```

選項：

- `--host <host>`：閘道 WebSocket 主機（預設：`127.0.0.1`）
- `--port <port>`：閘道 WebSocket 連接埠（預設：`18789`）
- `--context-path <path>`：閘道 WebSocket 內容路徑（例如 `/openclaw-gw`）。附加至 WebSocket URL。
- `--tls`：對閘道連線使用 TLS
- `--tls-fingerprint <sha256>`：預期的 TLS 憑證指紋（sha256）
- `--node-id <id>`：覆寫儲存在 `node.json` 中的舊版用戶端執行個體 ID（不會重設配對）
- `--display-name <name>`：覆寫節點顯示名稱
- `--runtime <runtime>`：服務執行環境（`node` 或 `bun`）
- `--force`：若已安裝，則重新安裝／覆寫

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

節點主機會在程序內重試閘道重新啟動及網路連線關閉。如果
閘道回報終止性的權杖／密碼／啟動驗證暫停，節點主機
會記錄關閉詳細資訊並以非零狀態結束，使 launchd/systemd/Task Scheduler
能使用最新的設定和認證資訊重新啟動。需要配對的暫停會留在
前景流程中，以便核准待處理的要求。

## 配對

第一次連線會在閘道上建立待處理的裝置配對要求（`role: node`）。

當閘道主機能以非互動方式透過 SSH 連線至節點主機（相同使用者、
受信任的主機金鑰）時，待處理的要求會自動獲得核准：閘道會
透過 SSH 在節點主機上執行 `openclaw node identity --json`，並在
裝置金鑰完全相符時核准。此功能預設啟用；關於需求及如何停用
（`gateway.nodes.pairing.sshVerify: false`），請參閱
[經 SSH 驗證的裝置自動核准](/zh-TW/gateway/pairing#ssh-verified-device-auto-approval-default)。

否則，請透過下列命令手動核准：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

檢查閘道用於驗證的本機節點身分：

```bash
openclaw node identity --json
```

它會輸出 `identity/device.json` 中的裝置 ID 和公開金鑰，且絕不會
建立或修改身分檔案。

在受到嚴格控管的節點網路上，閘道操作員可以明確選擇啟用
自動核准來自受信任 CIDR 的首次節點配對：

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

此功能預設停用（未設定 `autoApproveCidrs`）。它只適用於
未要求任何範圍、來自閘道信任之用戶端 IP 的全新 `role: node`
配對。操作員／瀏覽器用戶端、控制介面、WebChat，以及角色、
範圍、中繼資料或公開金鑰升級仍需手動核准。

如果節點使用已變更的驗證詳細資訊（角色／範圍／公開金鑰）重試配對，
先前的待處理要求會被取代，並建立新的 `requestId`。
核准前請再次執行 `openclaw devices list`。

### 身分與配對狀態

無介面節點會將其舊版用戶端執行個體 ID，與閘道用於配對和路由的
已簽署裝置身分分開。這些檔案位於 OpenClaw 狀態目錄中
（預設為 `~/.openclaw`；設定 `$OPENCLAW_STATE_DIR` 時則使用該目錄）：

| 檔案                        | 用途                                                                                                                                       |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `node.json`                 | 舊版 `nodeId` 鍵下的用戶端執行個體 ID、顯示名稱，以及閘道連線中繼資料。用戶端會以 `instanceId` 傳送此值。 |
| `identity/device.json`      | 已簽署的 Ed25519 金鑰組與衍生的裝置 ID。對於已簽署連線，此裝置 ID 是用於路由的節點 ID 和配對身分。              |
| `identity/device-auth.json` | 已配對的裝置權杖，依密碼編譯裝置 ID 和角色索引。                                                                              |

`--node-id` 只會變更 `node.json` 中的用戶端執行個體 ID。它不會
變更密碼編譯裝置 ID 或清除配對驗證。僅刪除
`node.json` 同樣不會重設配對。若要撤銷並重新配對節點：

1. 在閘道上執行 `openclaw nodes remove --node <id|name|ip>`。
2. 在節點上使用 `openclaw node restart` 重新啟動已安裝的服務，或
   停止並重新執行前景 `openclaw node run` 命令。這會啟動
   裝置配對流程。如果 `openclaw devices list` 未顯示要求，
   且節點回報 `AUTH_DEVICE_TOKEN_MISMATCH`，請再重新啟動或重新執行
   一次。遭拒的嘗試會清除現在已遭撤銷的本機權杖；下一次
   嘗試即可要求配對。
3. 在閘道上執行 `openclaw devices list`，然後執行
   `openclaw devices approve <deviceRequestId>`。
4. 再次重新啟動或重新執行節點。因配對而暫停的用戶端不會在核准後
   自動恢復；此次重新連線會建立獨立的命令介面要求。
5. 在閘道上執行 `openclaw nodes pending`，然後執行
   `openclaw nodes approve <nodeRequestId>`。

這兩個要求 ID 彼此不同。適用的受信任 CIDR 原則可以
自動核准首次裝置配對步驟；命令介面核准仍是
獨立的檢查。

舊版 OpenClaw 發行版本可能會在 `node.json` 中留下舊版 `token` 欄位。
目前的 OpenClaw 不使用該欄位，並會在節點主機下次儲存檔案時將其移除。
請將 `identity/` 下的兩個檔案保持私密；它們包含裝置金鑰組和驗證權杖。

## 執行核准

`system.run` 受本機執行核准管控：

- `$OPENCLAW_STATE_DIR/exec-approvals.json`，或
  未設定變數時使用 `~/.openclaw/exec-approvals.json`
- [執行核准](/zh-TW/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>`（從閘道編輯）

對於已核准的非同步節點執行，OpenClaw 會在提示前準備標準的
`systemRunPlan`。後續已核准的 `system.run` 轉送會重複使用該儲存的
計畫，因此在建立核准要求後對命令／cwd／工作階段欄位所做的編輯
會遭到拒絕，而不會變更節點執行的內容。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [節點](/zh-TW/nodes)

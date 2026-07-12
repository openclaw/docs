---
read_when:
    - 執行無頭節點主機
    - 配對非 macOS 節點以使用 system.run
summary: '`openclaw node` 的命令列介面參考（無頭節點主機）'
title: 節點
x-i18n:
    generated_at: "2026-07-12T14:23:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 076449123d8b3e9cb092a2bd7de311b87b27a128cb381fc343c68d18aeb634a0
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

執行連線至閘道 WebSocket 的**無介面節點主機**，並在此機器上公開
`system.run` / `system.which`。

## 為什麼使用節點主機？

當你希望代理程式在網路中的**其他機器上執行命令**，但不想在那些機器上安裝完整的 macOS 輔助應用程式時，請使用節點主機。

常見使用案例：

- 在遠端 Linux/Windows 機器上執行命令（建置伺服器、實驗室機器、NAS）。
- 讓 exec 在閘道上保持**沙箱隔離**，但將已核准的執行委派給其他主機。
- 為自動化或 CI 節點提供輕量、無介面的執行目標。

節點主機上的 **exec 核准**和各代理程式允許清單仍會保護命令執行，因此你可以明確限制命令存取範圍。

`openclaw node run` 連線後可以發布由外掛或 MCP 支援的工具。
閘道預設信任已配對節點提供的描述元，同時要求每個描述元的命令仍屬於該節點已核准的命令介面。代理程式會將每個已接受的描述元視為一般外掛工具，但執行仍會經由 `node.invoke`，因此中斷節點連線後，新的代理程式執行將不再提供該工具。閘道操作員可使用
`gateway.nodes.pluginTools.enabled: false` 停用發布功能。

若要使用宣告式 MCP 工具，請在節點機器的 `openclaw.json` 中，於
`nodeHost.mcp.servers` 下加入一般 MCP 伺服器結構，然後重新啟動節點主機。節點會宣告受核准機制保護的 `mcp.tools.call.v1` 命令系列，並在連線後發布列出的工具；之後變更伺服器清單不需要重新配對。請參閱
[節點託管的 MCP 伺服器](/zh-TW/nodes#node-hosted-mcp-servers)。

## 瀏覽器代理（零設定）

如果節點上未停用 `browser.enabled`，節點主機會自動宣告瀏覽器代理。這讓代理程式無須額外設定，即可在該節點上使用瀏覽器自動化。

代理預設會公開節點的一般瀏覽器設定檔介面。如果你設定
`nodeHost.browserProxy.allowProfiles`，代理將改為限制模式：
不在允許清單中的設定檔目標會遭到拒絕，且代理會封鎖持久設定檔的建立／刪除路由。

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
- `--context-path <path>`：閘道 WebSocket 內容路徑（例如 `/openclaw-gw`）。會附加至 WebSocket URL。
- `--tls`：對閘道連線使用 TLS
- `--no-tls`：即使本機閘道設定已啟用 TLS，仍強制使用純文字閘道連線
- `--tls-fingerprint <sha256>`：預期的 TLS 憑證指紋（sha256）
- `--node-id <id>`：覆寫儲存在 `node.json` 中的舊版用戶端執行個體 ID（不會重設配對）
- `--display-name <name>`：覆寫節點顯示名稱

## 節點主機的閘道驗證

`openclaw node run` 與 `openclaw node install` 會從設定／環境解析閘道驗證（節點命令不提供 `--token`／`--password` 旗標）：

- 先檢查 `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 接著退回本機設定：`gateway.auth.token` / `gateway.auth.password`。
- 在本機模式中，節點主機刻意不繼承 `gateway.remote.token` / `gateway.remote.password`。
- 如果透過 SecretRef 明確設定 `gateway.auth.token` / `gateway.auth.password`，但無法解析，節點驗證解析會採取失敗關閉（不會以遠端後援掩蓋問題）。
- 在 `gateway.mode=remote` 中，遠端用戶端欄位（`gateway.remote.token` / `gateway.remote.password`）也會依照遠端優先順序規則納入考量。
- 節點主機驗證解析只採用 `OPENCLAW_GATEWAY_*` 環境變數。

節點連線至純文字 `ws://` 閘道時，可接受回送位址、私有 IP
常值、`.local` 與 Tailnet `*.ts.net` 主機。若為其他受信任的私有 DNS 名稱，請設定 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`；若未設定，節點啟動會採取失敗關閉，並要求你使用 `wss://`、SSH 通道或
Tailscale。這是程序環境的選擇性設定，而不是 `openclaw.json` 設定鍵。
如果安裝命令的環境中存在此設定，`openclaw node install` 會將其持久保存到受監督的節點服務中。

## 服務（背景）

將無介面節點主機安裝為使用者服務（macOS 上使用 launchd、Linux 上使用 systemd、Windows 上使用 Windows Task Scheduler）。

```bash
openclaw node install --host <gateway-host> --port 18789
```

選項：

- `--host <host>`：閘道 WebSocket 主機（預設：`127.0.0.1`）
- `--port <port>`：閘道 WebSocket 連接埠（預設：`18789`）
- `--context-path <path>`：閘道 WebSocket 內容路徑（例如 `/openclaw-gw`）。會附加至 WebSocket URL。
- `--tls`：對閘道連線使用 TLS
- `--tls-fingerprint <sha256>`：預期的 TLS 憑證指紋（sha256）
- `--node-id <id>`：覆寫儲存在 `node.json` 中的舊版用戶端執行個體 ID（不會重設配對）
- `--display-name <name>`：覆寫節點顯示名稱
- `--runtime <runtime>`：服務執行階段（`node` 或 `bun`）
- `--force`：若已安裝，則重新安裝／覆寫

管理服務：

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

若要使用前景節點主機（不使用服務），請執行 `openclaw node run`。

服務命令接受 `--json`，以輸出機器可讀格式。

節點主機會在程序內重試閘道重新啟動及網路連線關閉。如果閘道回報終止性的權杖／密碼／啟動驗證暫停，節點主機會記錄關閉詳細資訊並以非零狀態結束，讓 launchd/systemd/Task Scheduler 能以最新的設定和認證資訊重新啟動。需要配對的暫停會留在前景流程中，以便核准待處理的要求。

## 配對

第一次連線會在閘道上建立待處理的裝置配對要求（`role: node`）。

當閘道主機可以非互動方式透過 SSH 連線至節點主機（相同使用者、受信任的主機金鑰）時，待處理要求會自動獲得核准：閘道會透過 SSH 在節點主機上執行 `openclaw node identity --json`，並在裝置金鑰完全相符時核准。此功能預設啟用；相關需求及停用方式（`gateway.nodes.pairing.sshVerify: false`），請參閱
[透過 SSH 驗證的裝置自動核准](/zh-TW/gateway/pairing#ssh-verified-device-auto-approval-default)。

否則，請手動核准：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

檢查閘道用於驗證的本機節點身分：

```bash
openclaw node identity --json
```

此命令會顯示 `identity/device.json` 中的裝置 ID 與公開金鑰，且絕不會建立或修改身分檔案。

在嚴格控管的節點網路中，閘道操作員可明確選擇自動核准來自受信任 CIDR 的首次節點配對：

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

此功能預設停用（未設定 `autoApproveCidrs`）。它只適用於未要求任何範圍、來自閘道信任之用戶端 IP 的全新 `role: node` 配對。操作員／瀏覽器用戶端、Control UI、WebChat，以及角色、範圍、中繼資料或公開金鑰升級，仍需手動核准。

如果節點以已變更的驗證詳細資訊（角色／範圍／公開金鑰）重試配對，先前待處理的要求會被取代，並建立新的 `requestId`。
核准前請再次執行 `openclaw devices list`。

### 身分與配對狀態

無介面節點會將舊版用戶端執行個體 ID，與閘道用於配對及路由的簽署裝置身分分開。這些檔案位於 OpenClaw 狀態目錄中（預設為 `~/.openclaw`，設定 `$OPENCLAW_STATE_DIR` 時則使用該目錄）：

| 檔案                        | 用途                                                                                                                                       |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `node.json`                 | 舊版 `nodeId` 鍵下的用戶端執行個體 ID、顯示名稱及閘道連線中繼資料。用戶端會將此值作為 `instanceId` 傳送。 |
| `identity/device.json`      | 已簽署的 Ed25519 金鑰組及衍生的裝置 ID。對於已簽署的連線，此裝置 ID 是路由使用的節點 ID 與配對身分。              |
| `identity/device-auth.json` | 已配對的裝置權杖，以密碼學裝置 ID 與角色為索引鍵。                                                                              |

`--node-id` 只會變更 `node.json` 中的用戶端執行個體 ID。它不會變更密碼學裝置 ID，也不會清除配對驗證。只刪除
`node.json` 同樣不會重設配對。若要撤銷節點並重新配對：

1. 在閘道上執行 `openclaw nodes remove --node <id|name|ip>`。
2. 在節點上，使用 `openclaw node restart` 重新啟動已安裝的服務，或停止並重新執行前景 `openclaw node run` 命令。這會啟動裝置配對流程。如果 `openclaw devices list` 未顯示要求，且節點回報 `AUTH_DEVICE_TOKEN_MISMATCH`，請再重新啟動或重新執行一次。遭拒的嘗試會清除目前已撤銷的本機權杖；下一次嘗試即可要求配對。
3. 在閘道上執行 `openclaw devices list`，接著執行
   `openclaw devices approve <deviceRequestId>`。
4. 再次重新啟動或重新執行節點。因配對而暫停的用戶端不會在核准後自動繼續；此次重新連線會建立個別的命令介面要求。
5. 在閘道上執行 `openclaw nodes pending`，接著執行
   `openclaw nodes approve <nodeRequestId>`。

這兩個要求 ID 不同。適用的受信任 CIDR 原則可以自動核准首次裝置配對步驟；命令介面核准仍是個別的檢查。

較舊的 OpenClaw 版本可能會在 `node.json` 中留下舊版 `token` 欄位。
目前的 OpenClaw 不會使用該欄位，並會在節點主機下次儲存檔案時將其移除。請將 `identity/` 下的兩個檔案保持私密；其中包含裝置金鑰組與驗證權杖。

## Exec 核准

`system.run` 受本機 exec 核准機制保護：

- `$OPENCLAW_STATE_DIR/exec-approvals.json`，或在未設定該變數時使用
  `~/.openclaw/exec-approvals.json`
- [Exec 核准](/zh-TW/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>`（從閘道編輯）

對於已核准的非同步節點 exec，OpenClaw 會在提示核准前準備標準化的 `systemRunPlan`。
稍後轉送已核准的 `system.run` 時，會重複使用儲存的計畫，因此在建立核准要求後對命令／cwd／工作階段欄位所做的編輯將遭到拒絕，而不會變更節點實際執行的內容。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [節點](/zh-TW/nodes)

---
read_when:
    - 不執行完整代理回合即呼叫工具
    - 建置需要強制執行工具政策的自動化流程
summary: 透過閘道 HTTP 端點直接叫用單一工具
title: 工具呼叫 API
x-i18n:
    generated_at: "2026-07-11T21:23:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d07f765d63255e718d5e558b662589e77b2992538f43288cd83e6e3f2a06dda
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

OpenClaw 的閘道提供一個 HTTP 端點，可直接叫用單一工具。此端點一律啟用，並使用閘道驗證與工具政策。與 OpenAI 相容的 `/v1/*` 介面相同，共用密鑰的持有人權杖驗證會被視為對整個閘道具有受信任的操作員存取權限。

- `POST /tools/invoke`
- 與閘道使用相同的連接埠（WS + HTTP 多工）：`http://<gateway-host>:<port>/tools/invoke`
- 預設要求本文大小上限：2 MB

## 驗證

使用閘道驗證設定。

常見的 HTTP 驗證方式：

- 共用密鑰驗證（`gateway.auth.mode="token"` 或 `"password"`）：`Authorization: Bearer <token-or-password>`
- 攜帶受信任身分的 HTTP 驗證（`gateway.auth.mode="trusted-proxy"`）：透過已設定且可感知身分的代理伺服器路由，並由其注入必要的身分標頭
- 私人入口開放驗證（`gateway.auth.mode="none"`）：不需要驗證標頭

注意事項：

- `mode="token"` 使用 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
- `mode="password"` 使用 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
- `mode="trusted-proxy"` 要求 HTTP 要求來自已設定的受信任代理來源；同一主機上的 local loopback 代理需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`。
- 略過代理的同一主機內部呼叫端，可使用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` 作為本機直接備援。任何 `Forwarded`、`X-Forwarded-*` 或 `X-Real-IP` 標頭證據，都會讓要求繼續走受信任代理路徑。
- 如果已設定 `gateway.auth.rateLimit` 且驗證失敗次數過多，端點會傳回 `429`，並包含 `Retry-After`。

## 安全邊界（重要）

請將此端點視為該閘道執行個體的**完整操作員存取權限**介面。

- 此處的 HTTP 持有人驗證並非狹義的個別使用者範圍模型。
- 此端點的有效閘道權杖／密碼應視為擁有者／操作員憑證。
- 對於共用密鑰驗證模式（`token` 和 `password`），即使呼叫端傳送較窄的 `x-openclaw-scopes` 標頭，此端點仍會還原一般的完整操作員預設值。
- 共用密鑰驗證也會將對此端點的直接工具叫用視為擁有者傳送者回合。
- 攜帶受信任身分的 HTTP 模式（受信任代理驗證，或私人入口上的 `gateway.auth.mode="none"`）會在提供 `x-openclaw-scopes` 時遵循其設定，否則回退至一般的操作員預設範圍集合。
- 請僅將此端點保留在 local loopback／尾端網路／私人入口上；不要直接暴露於公用網際網路。

驗證矩陣：

| 驗證模式                                                                                | 行為                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `token` 或 `password` + `Authorization: Bearer ...`                                     | 證明持有共用的閘道操作員密鑰。忽略較窄的 `x-openclaw-scopes`。還原完整的預設操作員範圍集合：`operator.admin`、`operator.approvals`、`operator.pairing`、`operator.read`、`operator.talk.secrets`、`operator.write`。將直接工具叫用視為擁有者傳送者回合。 |
| 攜帶受信任身分的 HTTP（受信任代理驗證，或私人入口上的 `mode="none"`）                    | 驗證外層受信任身分或部署邊界。提供 `x-openclaw-scopes` 時遵循其設定。缺少該標頭時，回退至一般的操作員預設範圍集合。只有當呼叫端明確縮小範圍並省略 `operator.admin` 時，才會失去擁有者語意。                                                                        |

## 要求本文

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

欄位：

- `tool` / `name`（字串，必填）：要叫用的工具名稱。如果兩者皆有傳送，則以 `name` 為優先。
- `action`（字串，選填）：如果工具結構描述支援 `action` 屬性，且 `args` 尚未設定該屬性，則合併至 `args.action`。
- `args`（物件，選填）：工具專用引數。
- `sessionKey`（字串，選填）：目標工作階段金鑰。如果省略或設為 `"main"`，閘道會使用已設定的主要工作階段金鑰（遵循 `session.mainKey` 與預設代理程式；在全域工作階段範圍中則使用 `global`）。
- `agentId`（字串，選填）：解析該代理程式的工作階段金鑰。如果它與已明確指定且對應至不同代理程式的 `sessionKey` 衝突，則以 `400` 回報錯誤。
- `idempotencyKey`（字串，選填）：用於為叫用衍生穩定的工具呼叫 ID。
- `dryRun`（布林值，選填）：保留供未來使用；目前會被忽略。

## 政策與路由行為

工具可用性會透過與閘道代理程式相同的政策鏈進行篩選：

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- 群組政策（如果工作階段金鑰對應至群組或頻道）
- 子代理程式政策（使用子代理程式工作階段金鑰叫用時）

如果政策不允許某個工具，端點會傳回 **404**。

重要邊界注意事項：

- 執行核准是操作員防護措施，並非此 HTTP 端點的獨立授權邊界。如果工具可透過閘道驗證與工具政策從此處存取，`/tools/invoke` 不會額外新增逐次呼叫的核准提示。
- 如果可從此處存取 `exec`，請將其視為可變更狀態的殼層介面。拒絕 `write`、`edit`、`apply_patch` 或 HTTP 檔案系統寫入工具，並不會讓殼層執行變成唯讀。
- 不要與不受信任的呼叫端共用閘道持有人憑證。如果需要跨信任邊界進行隔離，請執行個別的閘道（最好使用不同的作業系統使用者／主機）。

即使工作階段政策允許工具，閘道 HTTP 預設也會套用硬性拒絕清單：

| 工具             | 原因                                                    |
| ---------------- | ------------------------------------------------------- |
| `exec`           | 直接執行命令（RCE 介面）                               |
| `spawn`          | 建立任意子處理程序（RCE 介面）                         |
| `shell`          | 執行殼層命令（RCE 介面）                               |
| `fs_write`       | 任意修改主機上的檔案                                   |
| `fs_delete`      | 任意刪除主機上的檔案                                   |
| `fs_move`        | 任意移動／重新命名主機上的檔案                         |
| `apply_patch`    | 套用修補程式可重寫任意檔案                             |
| `sessions_spawn` | 工作階段協調；從遠端產生代理程式屬於 RCE               |
| `sessions_send`  | 跨工作階段訊息注入                                     |
| `cron`           | 持續性自動化控制平面                                   |
| `gateway`        | 閘道控制平面；防止透過 HTTP 重新設定                    |
| `nodes`          | 節點命令轉送可觸及已配對主機上的 `system.run`           |

`cron`、`gateway` 和 `nodes` 也僅限擁有者使用：即使不在此預設拒絕清單中，非擁有者呼叫端也無法在此介面上叫用它們。

透過 `gateway.tools` 自訂一般拒絕清單：

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list for owner/admin callers
      allow: ["gateway"],
    },
  },
}
```

`gateway.tools.allow` 是暴露覆寫，而非範圍提升。在攜帶身分的 HTTP 模式中，即使 `cron`、`gateway` 和 `nodes` 列於 `gateway.tools.allow`，沒有擁有者／管理員身分（`operator.admin`）的呼叫端仍無法使用。共用密鑰持有人驗證仍遵循上述完整的受信任操作員規則。

為協助群組政策解析內容脈絡，你可以選擇設定：

- `x-openclaw-message-channel: <channel>`（範例：`slack`、`telegram`）
- `x-openclaw-account-id: <accountId>`（存在多個帳戶時）
- `x-openclaw-message-to: <target>`（訊息工具政策的傳遞目標）
- `x-openclaw-thread-id: <threadId>`（訊息工具政策的討論串內容脈絡）

## 回應

| 狀態   | 意義                                                                                           |
| ------ | ---------------------------------------------------------------------------------------------- |
| `200`  | `{ ok: true, result }`                                                                         |
| `400`  | `{ ok: false, error: { type, message } }`（無效要求或工具輸入錯誤）                            |
| `401`  | 未經授權                                                                                       |
| `403`  | `{ ok: false, error: { type, message, requiresApproval? } }`（工具呼叫遭政策封鎖）             |
| `404`  | 工具不可用（找不到或不在允許清單中）                                                         |
| `405`  | 不允許使用此方法                                                                               |
| `408`  | 讀取要求本文逾時                                                                               |
| `413`  | 要求本文超過承載資料大小上限                                                                   |
| `429`  | 驗證受到速率限制（已設定 `Retry-After`）                                                      |
| `500`  | `{ ok: false, error: { type, message } }`（非預期的工具執行錯誤；訊息已淨化）                  |

## 範例

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```

## 相關內容

- [閘道通訊協定](/zh-TW/gateway/protocol)
- [工具與外掛](/zh-TW/tools)

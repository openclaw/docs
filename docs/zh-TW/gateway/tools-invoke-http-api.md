---
read_when:
    - 不執行完整 agent 回合而呼叫工具
    - 建置需要工具政策強制執行的自動化
summary: 透過 Gateway HTTP 端點直接叫用單一工具
title: 工具呼叫 API
x-i18n:
    generated_at: "2026-07-05T11:20:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d07f765d63255e718d5e558b662589e77b2992538f43288cd83e6e3f2a06dda
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

OpenClaw 的閘道會公開一個 HTTP 端點，用於直接叫用單一工具。它一律啟用，並使用閘道驗證加上工具政策。與 OpenAI 相容的 `/v1/*` 介面一樣，共用密鑰 bearer 驗證會被視為整個閘道的受信任操作者存取。

- `POST /tools/invoke`
- 與閘道相同的連接埠（WS + HTTP 多工）：`http://<gateway-host>:<port>/tools/invoke`
- 預設最大請求本文大小：2 MB

## 驗證

使用閘道驗證設定。

常見 HTTP 驗證路徑：

- 共用密鑰驗證（`gateway.auth.mode="token"` 或 `"password"`）：`Authorization: Bearer <token-or-password>`
- 帶有受信任身分的 HTTP 驗證（`gateway.auth.mode="trusted-proxy"`）：透過已設定的身分感知代理路由，並讓它注入必要的身分標頭
- 私有入口開放驗證（`gateway.auth.mode="none"`）：不需要驗證標頭

注意事項：

- `mode="token"` 使用 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
- `mode="password"` 使用 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
- `mode="trusted-proxy"` 要求 HTTP 請求來自已設定的受信任代理來源；同主機 loopback 代理需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`。
- 繞過代理的內部同主機呼叫者，可以使用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` 作為本機直接備援。任何 `Forwarded`、`X-Forwarded-*` 或 `X-Real-IP` 標頭證據都會讓請求改走 trusted-proxy 路徑。
- 如果已設定 `gateway.auth.rateLimit` 且發生太多驗證失敗，端點會傳回帶有 `Retry-After` 的 `429`。

## 安全邊界（重要）

請將此端點視為閘道實例的**完整操作者存取**介面。

- 這裡的 HTTP bearer 驗證不是狹義的逐使用者範圍模型。
- 此端點的有效閘道 token/password 應被視為擁有者/操作者憑證。
- 對於共用密鑰驗證模式（`token` 與 `password`），即使呼叫者傳送較窄的 `x-openclaw-scopes` 標頭，端點也會還原一般的完整操作者預設值。
- 共用密鑰驗證也會將此端點上的直接工具叫用視為擁有者寄送者回合。
- 帶有受信任身分的 HTTP 模式（受信任代理驗證，或私有入口上的 `gateway.auth.mode="none"`）會在存在 `x-openclaw-scopes` 時遵循它，否則退回到一般的操作者預設範圍集合。
- 僅將此端點保留在 loopback/tailnet/私有入口上；不要直接暴露到公開網際網路。

驗證矩陣：

| 驗證模式                                                                                | 行為                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `token` 或 `password` + `Authorization: Bearer ...`                                     | 證明持有共用閘道操作者密鑰。忽略較窄的 `x-openclaw-scopes`。還原完整預設操作者範圍集合：`operator.admin`、`operator.approvals`、`operator.pairing`、`operator.read`、`operator.talk.secrets`、`operator.write`。將直接工具叫用視為擁有者寄送者回合。 |
| 帶有受信任身分的 HTTP（受信任代理驗證，或私有入口上的 `mode="none"`） | 驗證外層受信任身分或部署邊界。存在 `x-openclaw-scopes` 時遵循它。標頭不存在時退回到一般操作者預設範圍集合。只有在呼叫者明確縮小範圍並省略 `operator.admin` 時，才會失去擁有者語意。                               |

## 請求本文

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

- `tool` / `name`（字串，必填）：要叫用的工具名稱。若兩者都傳送，`name` 優先。
- `action`（字串，選填）：如果工具 schema 支援 `action` 屬性，且 `args` 尚未設定，則合併到 `args.action`。
- `args`（物件，選填）：工具專屬引數。
- `sessionKey`（字串，選填）：目標工作階段鍵。如果省略或為 `"main"`，閘道會使用已設定的主工作階段鍵（遵循 `session.mainKey` 與預設代理，或在全域工作階段範圍中使用 `global`）。
- `agentId`（字串，選填）：解析該代理的工作階段鍵。如果它與已明確指定且已對應到不同代理的 `sessionKey` 衝突，則以 `400` 回報錯誤。
- `idempotencyKey`（字串，選填）：用於為叫用衍生穩定的工具呼叫 ID。
- `dryRun`（布林值，選填）：保留供未來使用；目前會被忽略。

## 政策 + 路由行為

工具可用性會透過閘道代理所使用的相同政策鏈進行篩選：

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- 群組政策（如果工作階段鍵對應到群組或頻道）
- 子代理政策（使用子代理工作階段鍵叫用時）

如果政策不允許某個工具，端點會傳回 **404**。

重要邊界注意事項：

- Exec 核准是操作者防護措施，不是此 HTTP 端點的獨立授權邊界。如果工具可透過閘道驗證 + 工具政策在此處觸達，`/tools/invoke` 不會增加額外的逐次呼叫核准提示。
- 如果 `exec` 可在此處觸達，請將它視為可變更狀態的 shell 介面。拒絕 `write`、`edit`、`apply_patch` 或 HTTP 檔案系統寫入工具，不會讓 shell 執行變成唯讀。
- 不要與不受信任的呼叫者共用閘道 bearer 憑證。如果你需要跨信任邊界的隔離，請執行獨立的閘道（理想情況下使用不同的 OS 使用者/主機）。

閘道 HTTP 預設也會套用硬性拒絕清單（即使工作階段政策允許該工具）：

| 工具             | 原因                                                    |
| ---------------- | --------------------------------------------------------- |
| `exec`           | 直接命令執行（RCE 介面）                    |
| `spawn`          | 任意子程序建立（RCE 介面）            |
| `shell`          | Shell 命令執行（RCE 介面）                     |
| `fs_write`       | 主機上的任意檔案變更                       |
| `fs_delete`      | 主機上的任意檔案刪除                       |
| `fs_move`        | 主機上的任意檔案移動/重新命名                    |
| `apply_patch`    | 套用補丁可重寫任意檔案             |
| `sessions_spawn` | 工作階段編排；遠端產生代理是 RCE    |
| `sessions_send`  | 跨工作階段訊息注入                           |
| `cron`           | 持久自動化控制平面                       |
| `gateway`        | 閘道控制平面；防止透過 HTTP 重新設定  |
| `nodes`          | 節點命令轉送可觸達配對主機上的 `system.run` |

`cron`、`gateway` 與 `nodes` 也僅限擁有者：即使不在此預設拒絕清單中，非擁有者呼叫者也無法在此介面上叫用它們。

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

`gateway.tools.allow` 是暴露覆寫，不是範圍升級。在帶有身分的 HTTP 模式中，即使列在 `gateway.tools.allow`，`cron`、`gateway` 與 `nodes` 仍無法供沒有擁有者/管理員身分（`operator.admin`）的呼叫者使用。共用密鑰 bearer 驗證仍遵循上方的完整受信任操作者規則。

為協助群組政策解析脈絡，你可以選擇性設定：

- `x-openclaw-message-channel: <channel>`（範例：`slack`、`telegram`）
- `x-openclaw-account-id: <accountId>`（存在多個帳號時）
- `x-openclaw-message-to: <target>`（訊息工具政策的傳遞目標）
- `x-openclaw-thread-id: <threadId>`（訊息工具政策的執行緒脈絡）

## 回應

| 狀態 | 意義                                                                                        |
| ------ | ---------------------------------------------------------------------------------------------- |
| `200`  | `{ ok: true, result }`                                                                         |
| `400`  | `{ ok: false, error: { type, message } }`（無效請求或工具輸入錯誤）                |
| `401`  | 未授權                                                                                   |
| `403`  | `{ ok: false, error: { type, message, requiresApproval? } }`（工具呼叫遭政策封鎖）     |
| `404`  | 工具不可用（找不到或未列入允許清單）                                              |
| `405`  | 不允許的方法                                                                             |
| `408`  | 讀取請求本文逾時                                                                    |
| `413`  | 請求本文超過最大承載大小                                                     |
| `429`  | 驗證受到速率限制（已設定 `Retry-After`）                                                          |
| `500`  | `{ ok: false, error: { type, message } }`（非預期工具執行錯誤；訊息已淨化） |

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

## 相關

- [閘道協定](/zh-TW/gateway/protocol)
- [工具與外掛](/zh-TW/tools)

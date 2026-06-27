---
read_when:
    - 在不執行完整代理回合的情況下呼叫工具
    - 建置需要工具政策強制執行的自動化
summary: 透過閘道 HTTP 端點直接叫用單一工具
title: 工具叫用 API
x-i18n:
    generated_at: "2026-06-27T19:23:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2023505f5a705b62e2fd685d64d3f9bd7788d09adfe89ac99604e6660c78ad8a
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

OpenClaw 的閘道公開了一個簡單的 HTTP 端點，可直接呼叫單一工具。它一律啟用，並使用閘道驗證加上工具政策。與 OpenAI 相容的 `/v1/*` 介面一樣，共用密鑰 bearer 驗證會被視為整個閘道的受信任操作者存取權。

- `POST /tools/invoke`
- 與閘道相同的連接埠（WS + HTTP 多工）：`http://<gateway-host>:<port>/tools/invoke`

預設最大酬載大小為 2 MB。

## 驗證

使用閘道驗證設定。

常見 HTTP 驗證路徑：

- 共用密鑰驗證（`gateway.auth.mode="token"` 或 `"password"`）：
  `Authorization: Bearer <token-or-password>`
- 帶有受信任身分的 HTTP 驗證（`gateway.auth.mode="trusted-proxy"`）：
  透過已設定、可感知身分的代理路由，並讓它注入
  必要的身分標頭
- 私有入口開放驗證（`gateway.auth.mode="none"`）：
  不需要驗證標頭

注意事項：

- 當 `gateway.auth.mode="token"` 時，使用 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
- 當 `gateway.auth.mode="password"` 時，使用 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
- 當 `gateway.auth.mode="trusted-proxy"` 時，HTTP 請求必須來自
  已設定的受信任代理來源；同主機 loopback 代理需要明確設定
  `gateway.auth.trustedProxy.allowLoopback = true`。
- 繞過代理的內部同主機呼叫端可以使用
  `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` 作為本機直接
  後援。任何 `Forwarded`、`X-Forwarded-*` 或 `X-Real-IP` 標頭證據
  都會讓請求改走 trusted-proxy 路徑。
- 如果已設定 `gateway.auth.rateLimit` 且驗證失敗次數過多，端點會回傳 `429` 並附上 `Retry-After`。

## 安全邊界（重要）

請將此端點視為閘道執行個體的**完整操作者存取權**介面。

- 這裡的 HTTP bearer 驗證不是狹義的逐使用者範圍模型。
- 此端點的有效閘道 token/password 應視為擁有者/操作者憑證。
- 對於共用密鑰驗證模式（`token` 和 `password`），即使呼叫端傳送較窄的 `x-openclaw-scopes` 標頭，端點也會還原一般完整操作者預設值。
- 共用密鑰驗證也會將此端點上的直接工具呼叫視為擁有者傳送者回合。
- 帶有受信任身分的 HTTP 模式（例如受信任代理驗證，或私有入口上的 `gateway.auth.mode="none"`）會在 `x-openclaw-scopes` 存在時遵循它，否則退回一般操作者預設範圍集合。
- 請只將此端點放在 loopback/tailnet/私有入口；不要直接暴露到公用網際網路。

驗證矩陣：

- `gateway.auth.mode="token"` 或 `"password"` + `Authorization: Bearer ...`
  - 證明持有共用閘道操作者密鑰
  - 忽略較窄的 `x-openclaw-scopes`
  - 還原完整預設操作者範圍集合：
    `operator.admin`、`operator.approvals`、`operator.pairing`、
    `operator.read`、`operator.talk.secrets`、`operator.write`
  - 將此端點上的直接工具呼叫視為擁有者傳送者回合
- 帶有受信任身分的 HTTP 模式（例如受信任代理驗證，或私有入口上的 `gateway.auth.mode="none"`）
  - 驗證某個外部受信任身分或部署邊界
  - 當標頭存在時遵循 `x-openclaw-scopes`
  - 當標頭不存在時退回一般操作者預設範圍集合
  - 只有在呼叫端明確縮小範圍並省略 `operator.admin` 時才會失去擁有者語意

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

- `tool`（字串，必要）：要呼叫的工具名稱。
- `action`（字串，選用）：如果工具結構描述支援 `action`，且 args 酬載省略了它，則會對應到 args。
- `args`（物件，選用）：工具特定引數。
- `sessionKey`（字串，選用）：目標工作階段鍵。如果省略或為 `"main"`，閘道會使用已設定的主要工作階段鍵（遵循 `session.mainKey` 和預設代理，或在全域範圍中使用 `global`）。
- `dryRun`（布林值，選用）：保留供未來使用；目前會被忽略。

## 政策 + 路由行為

工具可用性會透過閘道代理使用的相同政策鏈進行篩選：

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- 群組政策（如果工作階段鍵對應到群組或頻道）
- 子代理政策（以子代理工作階段鍵呼叫時）

如果政策不允許某個工具，端點會回傳 **404**。

重要邊界注意事項：

- Exec 核准是操作者護欄，不是此 HTTP 端點的獨立授權邊界。如果某個工具可透過閘道驗證 + 工具政策在這裡存取，`/tools/invoke` 不會新增額外的逐次呼叫核准提示。
- 如果 `exec` 可在這裡存取，請將它視為可變更的 shell 介面。拒絕 `write`、`edit`、`apply_patch` 或 HTTP 檔案系統寫入工具，不會讓 shell 執行變成唯讀。
- 不要與不受信任的呼叫端共用閘道 bearer 憑證。如果你需要跨信任邊界隔離，請執行分開的閘道（理想情況下也使用分開的作業系統使用者/主機）。

閘道 HTTP 預設也會套用硬性拒絕清單（即使工作階段政策允許該工具）：

- `exec` - 直接命令執行（RCE 介面）
- `spawn` - 任意子行程建立（RCE 介面）
- `shell` - shell 命令執行（RCE 介面）
- `fs_write` - 在主機上任意變更檔案
- `fs_delete` - 在主機上任意刪除檔案
- `fs_move` - 在主機上任意移動/重新命名檔案
- `apply_patch` - 套用修補程式可重寫任意檔案
- `sessions_spawn` - 工作階段編排；遠端產生代理屬於 RCE
- `sessions_send` - 跨工作階段訊息注入
- `cron` - 持久自動化控制平面
- `gateway` - 閘道控制平面；防止透過 HTTP 重新設定
- `nodes` - 節點命令轉送可觸及配對主機上的 system.run
- `whatsapp_login` - 需要終端 QR 掃描的互動式設定；會在 HTTP 上掛起

你可以透過 `gateway.tools` 自訂此拒絕清單：

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

`gateway.tools.allow` 是暴露覆寫，不是範圍升級。在
帶有身分的 HTTP 模式中，即使 `cron`、`gateway` 和 `nodes`
列在 `gateway.tools.allow` 中，對於沒有擁有者/管理員身分
（`operator.admin`）的呼叫端仍然不可用。共用密鑰 bearer 驗證仍會遵循
上方的完整受信任操作者規則。

為了協助群組政策解析內容，你可以選擇性設定：

- `x-openclaw-message-channel: <channel>`（範例：`slack`、`telegram`）
- `x-openclaw-account-id: <accountId>`（存在多個帳號時）

## 回應

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }`（無效請求或工具輸入錯誤）
- `401` → 未授權
- `429` → 驗證受到速率限制（已設定 `Retry-After`）
- `404` → 工具不可用（找不到或未列入允許清單）
- `405` → 不允許的方法
- `500` → `{ ok: false, error: { type, message } }`（非預期工具執行錯誤；訊息已清理）

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

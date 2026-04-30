---
read_when:
    - 在不執行完整代理回合的情況下呼叫工具
    - 建置需要強制執行工具政策的自動化流程
summary: 透過 Gateway HTTP 端點直接叫用單一工具
title: 工具呼叫 API
x-i18n:
    generated_at: "2026-04-30T03:09:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ba20b7471de76e7f6bccc4d7a3d72c00d9d7b9843ad4e74825685c992a33f1a
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

# 工具呼叫 (HTTP)

OpenClaw 的 Gateway 提供一個簡單的 HTTP 端點，可直接呼叫單一工具。它一律啟用，並使用 Gateway 驗證與工具政策。與 OpenAI 相容的 `/v1/*` 介面一樣，共用密鑰 bearer 驗證會被視為整個 Gateway 的受信任操作員存取權限。

- `POST /tools/invoke`
- 與 Gateway 相同連接埠（WS + HTTP 多工）：`http://<gateway-host>:<port>/tools/invoke`

預設最大承載大小為 2 MB。

## 驗證

使用 Gateway 驗證設定。

常見的 HTTP 驗證路徑：

- 共用密鑰驗證（`gateway.auth.mode="token"` 或 `"password"`）：
  `Authorization: Bearer <token-or-password>`
- 帶有受信任身分的 HTTP 驗證（`gateway.auth.mode="trusted-proxy"`）：
  透過已設定的身分感知代理路由，並讓它注入
  必要的身分標頭
- 私有入口開放驗證（`gateway.auth.mode="none"`）：
  不需要驗證標頭

注意事項：

- 當 `gateway.auth.mode="token"` 時，使用 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
- 當 `gateway.auth.mode="password"` 時，使用 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
- 當 `gateway.auth.mode="trusted-proxy"` 時，HTTP 請求必須來自
  已設定的受信任代理來源；同主機 local loopback 代理需要明確設定
  `gateway.auth.trustedProxy.allowLoopback = true`。
- 如果已設定 `gateway.auth.rateLimit` 且發生太多驗證失敗，此端點會傳回 `429` 並帶有 `Retry-After`。

## 安全邊界（重要）

請將此端點視為 Gateway 執行個體的**完整操作員存取**介面。

- 此處的 HTTP bearer 驗證不是狹義的每使用者範圍模型。
- 此端點的有效 Gateway 權杖/密碼應被視為擁有者/操作員憑證。
- 對於共用密鑰驗證模式（`token` 和 `password`），即使呼叫者傳送較窄的 `x-openclaw-scopes` 標頭，此端點也會還原一般完整操作員預設值。
- 共用密鑰驗證也會將此端點上的直接工具呼叫視為擁有者傳送者回合。
- 帶有受信任身分的 HTTP 模式（例如受信任代理驗證，或私有入口上的 `gateway.auth.mode="none"`）會在 `x-openclaw-scopes` 存在時遵循它，否則退回一般操作員預設範圍集。
- 僅將此端點保留在 local loopback/tailnet/私有入口上；請勿直接暴露到公用網際網路。

驗證矩陣：

- `gateway.auth.mode="token"` 或 `"password"` + `Authorization: Bearer ...`
  - 證明持有共用 Gateway 操作員密鑰
  - 忽略較窄的 `x-openclaw-scopes`
  - 還原完整預設操作員範圍集：
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - 將此端點上的直接工具呼叫視為擁有者傳送者回合
- 帶有受信任身分的 HTTP 模式（例如受信任代理驗證，或私有入口上的 `gateway.auth.mode="none"`）
  - 驗證某個外部受信任身分或部署邊界
  - 當標頭存在時遵循 `x-openclaw-scopes`
  - 當標頭不存在時退回一般操作員預設範圍集
  - 僅在呼叫者明確縮窄範圍並省略 `operator.admin` 時失去擁有者語意

## 請求主體

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

- `tool`（字串，必填）：要呼叫的工具名稱。
- `action`（字串，選填）：如果工具結構描述支援 `action` 且 args 承載省略它，則會對應到 args。
- `args`（物件，選填）：工具專用引數。
- `sessionKey`（字串，選填）：目標工作階段鍵。如果省略或為 `"main"`，Gateway 會使用已設定的主要工作階段鍵（遵循 `session.mainKey` 和預設代理，或在全域範圍中使用 `global`）。
- `dryRun`（布林值，選填）：保留供未來使用；目前會被忽略。

## 政策 + 路由行為

工具可用性會透過 Gateway 代理所使用的相同政策鏈進行篩選：

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- 群組政策（如果工作階段鍵對應到群組或頻道）
- 子代理政策（使用子代理工作階段鍵呼叫時）

如果政策不允許某個工具，此端點會傳回 **404**。

重要邊界注意事項：

- Exec 核准是操作員防護措施，不是此 HTTP 端點的獨立授權邊界。如果某個工具可透過 Gateway 驗證 + 工具政策在此處存取，`/tools/invoke` 不會新增額外的逐次呼叫核准提示。
- 請勿與不受信任的呼叫者分享 Gateway bearer 憑證。如果需要跨信任邊界隔離，請執行不同的 Gateway（理想情況下也使用不同的作業系統使用者/主機）。

Gateway HTTP 預設也會套用硬性拒絕清單（即使工作階段政策允許該工具）：

- `exec` — 直接命令執行（RCE 介面）
- `spawn` — 任意子程序建立（RCE 介面）
- `shell` — shell 命令執行（RCE 介面）
- `fs_write` — 主機上的任意檔案變更
- `fs_delete` — 主機上的任意檔案刪除
- `fs_move` — 主機上的任意檔案移動/重新命名
- `apply_patch` — 修補套用可重寫任意檔案
- `sessions_spawn` — 工作階段編排；遠端生成代理屬於 RCE
- `sessions_send` — 跨工作階段訊息注入
- `cron` — 持久自動化控制平面
- `gateway` — Gateway 控制平面；防止透過 HTTP 重新設定
- `nodes` — 節點命令轉送可觸及配對主機上的 system.run
- `whatsapp_login` — 需要終端 QR 掃描的互動式設定；在 HTTP 上會掛起

你可以透過 `gateway.tools` 自訂此拒絕清單：

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list
      allow: ["gateway"],
    },
  },
}
```

為協助群組政策解析內容脈絡，你可以選擇性設定：

- `x-openclaw-message-channel: <channel>`（範例：`slack`、`telegram`）
- `x-openclaw-account-id: <accountId>`（存在多個帳戶時）

## 回應

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }`（無效請求或工具輸入錯誤）
- `401` → 未授權
- `429` → 驗證受到速率限制（已設定 `Retry-After`）
- `404` → 工具不可用（找不到或未列入允許清單）
- `405` → 不允許的方法
- `500` → `{ ok: false, error: { type, message } }`（未預期的工具執行錯誤；已清理訊息）

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

- [Gateway 通訊協定](/zh-TW/gateway/protocol)
- [工具與 plugins](/zh-TW/tools)

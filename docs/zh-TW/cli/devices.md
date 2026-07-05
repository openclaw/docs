---
read_when:
    - 你正在核准裝置配對請求
    - 你需要輪替或撤銷裝置權杖
summary: '`openclaw devices` 的命令列介面參考（裝置配對 + 權杖輪替/撤銷）'
title: 裝置
x-i18n:
    generated_at: "2026-07-05T11:07:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d6233acac966b3fd83618935e732366a40650503cb2e21b347e93be3e1ce5d5
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

管理裝置配對請求與裝置範圍的權杖。

## 常用選項

- `--url <url>`：Gateway WebSocket URL（已設定時預設為 `gateway.remote.url`）
- `--token <token>`：Gateway 權杖（如有需要）
- `--password <password>`：Gateway 密碼（密碼驗證）
- `--timeout <ms>`：RPC 逾時
- `--json`：JSON 輸出（建議用於指令碼）

<Warning>
當你設定 `--url` 時，命令列介面不會退回使用設定或環境憑證。請明確傳入 `--token` 或 `--password`，否則命令會出錯。
</Warning>

## 命令

### `openclaw devices list`

列出待處理的配對請求與已配對裝置。

```bash
openclaw devices list
openclaw devices list --json
```

對於已配對裝置上的待處理請求，輸出會在裝置目前已核准的存取權旁顯示所請求的存取權，因此範圍/角色升級會清楚可見，而不會看起來像遺失的配對。

### `openclaw devices approve [requestId] [--latest]`

依精確的 `requestId` 核准待處理的配對請求。省略 `requestId`，或傳入 `--latest`，只會預覽最新的待處理請求並結束（代碼 1）；請使用精確的請求 ID 重新執行以核准。

```bash
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

<Note>
如果裝置使用已變更的驗證詳細資料（角色、範圍或公開金鑰）重試配對，OpenClaw 會以新的 `requestId` 取代先前的待處理項目。請在核准前立即執行 `openclaw devices list` 以取得目前的 ID。
</Note>

核准行為：

- 如果裝置已配對並請求更寬的範圍或角色，OpenClaw 會保留既有核准，並建立新的待處理升級請求。核准前，請在 `openclaw devices list` 中比較 `Requested` 與 `Approved`，或使用 `--latest` 預覽。
- 核准 `node` 角色或其他非操作者角色需要 `operator.admin`。`operator.pairing` 足以核准操作者裝置，但僅限於所請求的操作者範圍仍在呼叫者自身範圍內。請參閱[操作者範圍](/zh-TW/gateway/operator-scopes)。
- 如果已設定 `gateway.nodes.pairing.autoApproveCidrs`，來自相符用戶端 IP 的首次 `role: node` 請求可以在出現在此清單前自動核准。預設停用；絕不適用於操作者/瀏覽器用戶端或升級請求。

### `openclaw devices reject <requestId>`

拒絕待處理的裝置配對請求。

```bash
openclaw devices reject <requestId>
```

### `openclaw devices remove <deviceId>`

移除一個已配對裝置項目。

```bash
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

使用已配對裝置權杖驗證的呼叫者只能移除其**自己的**裝置項目。移除其他裝置需要 `operator.admin`。

### `openclaw devices clear --yes [--pending]`

大量清除已配對裝置。由 `--yes` 把關。

```bash
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

`--pending` 也會拒絕所有待處理的配對請求。

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

輪替某個角色的裝置權杖，並可選擇更新其範圍。

```bash
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

- 目標角色必須已存在於該裝置已核准的配對合約中；輪替不能鑄造新的未核准角色。
- 省略 `--scope` 會在之後重新連線時重用已儲存權杖的快取已核准範圍。傳入明確的 `--scope` 值會取代未來快取權杖重新連線所使用的已儲存範圍集合。
- 非管理員的已配對裝置呼叫者只能輪替其**自己的**裝置權杖，且目標範圍集合必須維持在呼叫者自身的操作者範圍內；輪替不能鑄造或保留比呼叫者既有範圍更寬的權杖。

以 JSON 傳回輪替中繼資料。如果呼叫者在以該裝置權杖驗證時輪替自己的權杖，回應會包含替換權杖，讓用戶端可在重新連線前持久保存它。共用/管理員輪替絕不回傳持有人權杖。

### `openclaw devices revoke --device <id> --role <role>`

撤銷某個角色的裝置權杖。

```bash
openclaw devices revoke --device <deviceId> --role node
```

非管理員的已配對裝置呼叫者只能撤銷其**自己的**裝置權杖。撤銷其他裝置的權杖需要 `operator.admin`。目標範圍集合也必須符合呼叫者自身的操作者範圍；僅配對呼叫者無法撤銷管理員/寫入操作者權杖。

## 備註

- 這些命令需要 `operator.pairing`（或 `operator.admin`）範圍。非操作者裝置角色一律需要 `operator.admin`；請參閱[操作者範圍](/zh-TW/gateway/operator-scopes)。
- 權杖輪替與撤銷會保持在裝置已核准的配對角色集合與範圍基準內。零散的快取權杖項目不會授予權杖管理目標。
- 對於已配對裝置權杖工作階段，跨裝置管理（`remove`、`rotate`、`revoke`）預設只能管理自身，除非呼叫者具備 `operator.admin`。
- 權杖輪替會傳回新權杖（敏感）— 請將其視為秘密。
- 如果 local loopback 上無法使用配對範圍，且未傳入明確的 `--url`，`list`/`approve` 可以退回使用本機配對狀態。

## 權杖漂移復原檢查清單

當 Control UI 或其他用戶端持續因 `AUTH_TOKEN_MISMATCH`、`AUTH_DEVICE_TOKEN_MISMATCH` 或 `AUTH_SCOPE_MISMATCH` 失敗時，請使用此清單。

1. 確認目前的閘道權杖來源：

   ```bash
   openclaw config get gateway.auth.token
   ```

2. 列出已配對裝置並識別受影響的裝置 ID：

   ```bash
   openclaw devices list
   ```

3. 輪替受影響裝置的操作者權杖：

   ```bash
   openclaw devices rotate --device <deviceId> --role operator
   ```

4. 如果輪替仍不足，移除過時配對並重新核准：

   ```bash
   openclaw devices remove <deviceId>
   openclaw devices list
   openclaw devices approve <requestId>
   ```

5. 使用目前的共用權杖/密碼重試用戶端連線。

備註：

- 一般重新連線驗證優先順序：先使用明確的共用權杖/密碼，接著是明確的 `deviceToken`，再來是已儲存的裝置權杖，最後是啟動權杖。
- 受信任的 `AUTH_TOKEN_MISMATCH` 復原可以暫時同時傳送共用權杖與已儲存的裝置權杖，以進行一次有界限的重試。
- `AUTH_SCOPE_MISMATCH` 表示裝置權杖已被識別，但未攜帶所請求的範圍集合；在變更共用閘道驗證前，先修正配對/範圍核准合約。

相關：

- [儀表板驗證疑難排解](/zh-TW/web/dashboard#if-you-see-unauthorized-1008)
- [閘道疑難排解](/zh-TW/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Paperclip / `openclaw_gateway` 首次執行核准

透過 `openclaw_gateway` 配接器連線的 Paperclip 代理會與任何其他新用戶端一樣，經過相同的首次執行裝置配對核准。如果 Paperclip 回報 `openclaw_gateway_pairing_required`，請核准待處理裝置並重試。

```bash
openclaw devices approve --latest
```

預覽會列印精確的 `openclaw devices approve <requestId>` 命令；請確認詳細資料，然後使用請求 ID 重新執行該命令以核准。對於遠端閘道或明確憑證，請在預覽與核准時傳入相同選項：

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

若要避免每次重新啟動後都重新核准，請在 Paperclip 中設定持久的 `adapterConfig.devicePrivateKeyPem`，而不是讓它在每次執行時產生新的暫時裝置身分：

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

如果核准持續失敗，請先執行 `openclaw devices list` 以確認存在待處理請求。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [節點](/zh-TW/nodes)

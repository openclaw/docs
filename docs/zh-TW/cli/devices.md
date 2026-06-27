---
read_when:
    - 你正在核准裝置配對請求
    - 你需要輪替或撤銷裝置權杖
summary: '`openclaw devices` 的命令列介面參考（裝置配對 + 權杖輪替/撤銷）'
title: 裝置
x-i18n:
    generated_at: "2026-06-27T19:04:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08d6945af4fa2403a97dfec94af7bbd0dc746efe90d3e5b4c9f5c5d6d27d70a4
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

管理裝置配對要求與裝置範圍權杖。

## 命令

### `openclaw devices list`

列出待處理的配對要求與已配對的裝置。

```
openclaw devices list
openclaw devices list --json
```

當裝置已配對時，待處理要求輸出會在裝置目前已核准的存取權旁顯示要求的存取權。這會明確呈現範圍/角色升級，而不是看起來像配對已遺失。

### `openclaw devices remove <deviceId>`

移除一筆已配對裝置項目。

當你使用已配對的裝置權杖驗證時，非管理員呼叫端只能移除**自己的**裝置項目。移除其他裝置需要 `operator.admin`。

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

批次清除已配對裝置。

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

依精確的 `requestId` 核准待處理的裝置配對要求。如果省略 `requestId` 或傳入 `--latest`，OpenClaw 只會列印選取的待處理要求並結束；請在驗證詳細資料後，使用精確的要求 ID 重新執行核准。

<Note>
如果裝置使用變更後的驗證詳細資料（角色、範圍或公開金鑰）重試配對，OpenClaw 會取代先前的待處理項目並簽發新的 `requestId`。請在核准前立刻執行 `openclaw devices list`，以使用目前的 ID。
</Note>

如果裝置已配對，並要求更廣的範圍或更廣的角色，OpenClaw 會保留現有核准並建立新的待處理升級要求。請檢視 `openclaw devices list` 中的 `Requested` 與 `Approved` 欄，或使用 `openclaw devices approve --latest` 在核准前預覽精確的升級內容。

如果閘道已明確設定 `gateway.nodes.pairing.autoApproveCidrs`，來自相符用戶端 IP 的首次 `role: node` 要求可在出現在此清單前獲得核准。該政策預設停用，且永遠不適用於操作者/瀏覽器用戶端或升級要求。

核准節點或其他非操作者裝置角色需要 `operator.admin`。只有在要求的操作者範圍維持在呼叫端自身範圍內時，`operator.pairing` 才足以核准操作者裝置。請參閱[操作者範圍](/zh-TW/gateway/operator-scopes)了解核准時的檢查。

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

## Paperclip / `openclaw_gateway` 首次執行核准

當新的 Paperclip 代理首次透過 `openclaw_gateway` 轉接器連線時，閘道可能會要求一次性的裝置配對核准，執行才能成功。如果 Paperclip 回報 `openclaw_gateway_pairing_required`，請核准待處理裝置並重試。

對於本機閘道，預覽最新的待處理要求：

```bash
openclaw devices approve --latest
```

預覽會列印精確的 `openclaw devices approve <requestId>` 命令。驗證要求詳細資料後，使用要求 ID 重新執行該命令以核准。

對於遠端閘道或明確認證資料，請在預覽與核准時傳入相同選項：

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

若要避免重新啟動後再次核准，請在 Paperclip 轉接器設定中保留持久裝置金鑰，而不是每次執行都產生新的暫時身分：

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

如果核准持續失敗，請先執行 `openclaw devices list`，確認待處理要求存在。

### `openclaw devices reject <requestId>`

拒絕待處理的裝置配對要求。

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

輪替特定角色的裝置權杖（可選擇更新範圍）。目標角色必須已存在於該裝置已核准的配對合約中；輪替無法簽發新的未核准角色。如果你省略 `--scope`，之後使用儲存的已輪替權杖重新連線時，會重用該權杖快取的已核准範圍。如果你傳入明確的 `--scope` 值，這些值會成為未來快取權杖重新連線時儲存的範圍集合。非管理員已配對裝置呼叫端只能輪替**自己的**裝置權杖。目標權杖範圍集合必須維持在呼叫端工作階段自身的操作者範圍內；輪替無法簽發或保留比呼叫端既有權限更廣的操作者權杖。

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

以 JSON 傳回輪替中繼資料。如果呼叫端在使用該裝置權杖驗證時輪替自己的權杖，回應也會包含替換權杖，讓用戶端可在重新連線前保存它。共用/管理員輪替不會回顯 bearer 權杖。

### `openclaw devices revoke --device <id> --role <role>`

撤銷特定角色的裝置權杖。

非管理員已配對裝置呼叫端只能撤銷**自己的**裝置權杖。撤銷其他裝置的權杖需要 `operator.admin`。目標權杖範圍集合也必須符合呼叫端工作階段自身的操作者範圍；僅配對呼叫端無法撤銷管理員/寫入操作者權杖。

```
openclaw devices revoke --device <deviceId> --role node
```

以 JSON 傳回撤銷結果。

## 常用選項

- `--url <url>`：閘道 WebSocket URL（設定後預設為 `gateway.remote.url`）。
- `--token <token>`：閘道權杖（如需要）。
- `--password <password>`：閘道密碼（密碼驗證）。
- `--timeout <ms>`：RPC 逾時。
- `--json`：JSON 輸出（建議用於腳本）。

<Warning>
當你設定 `--url` 時，命令列介面不會退回使用設定或環境認證資料。請明確傳入 `--token` 或 `--password`。缺少明確認證資料會是錯誤。
</Warning>

## 注意事項

- 權杖輪替會傳回新權杖（敏感資訊）。請將其視為祕密。
- 這些命令需要 `operator.pairing`（或 `operator.admin`）範圍。某些核准也要求呼叫端持有目標裝置會簽發或繼承的操作者範圍。非操作者裝置角色需要 `operator.admin`；請參閱[操作者範圍](/zh-TW/gateway/operator-scopes)。
- `gateway.nodes.pairing.autoApproveCidrs` 是僅適用於新節點裝置配對的選擇啟用閘道政策；它不會變更命令列介面的核准權限。
- 權杖輪替與撤銷會維持在該裝置已核准的配對角色集合與已核准範圍基準內。零散的快取權杖項目不會授予權杖管理目標。
- 對於已配對裝置權杖工作階段，跨裝置管理僅限管理員：除非呼叫端具有 `operator.admin`，否則 `remove`、`rotate` 和 `revoke` 僅限自身操作。
- 權杖變更也受呼叫端範圍限制：僅配對工作階段無法輪替或撤銷目前帶有 `operator.admin` 或 `operator.write` 的權杖。
- `devices clear` 會刻意受到 `--yes` 閘門限制。
- 如果 local loopback 上無法使用配對範圍（且未傳入明確的 `--url`），list/approve 可使用本機配對後援。
- `devices approve` 在簽發權杖前需要明確的要求 ID；省略 `requestId` 或傳入 `--latest` 只會預覽最新的待處理要求。

## 權杖偏移復原檢查清單

當控制 UI 或其他用戶端持續因 `AUTH_TOKEN_MISMATCH`、`AUTH_DEVICE_TOKEN_MISMATCH` 或 `AUTH_SCOPE_MISMATCH` 失敗時，請使用此清單。

1. 確認目前的閘道權杖來源：

```bash
openclaw config get gateway.auth.token
```

2. 列出已配對裝置並識別受影響的裝置 ID：

```bash
openclaw devices list
```

3. 為受影響裝置輪替操作者權杖：

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. 如果輪替不足，移除過期配對並再次核准：

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. 使用目前的共用權杖/密碼重試用戶端連線。

注意事項：

- 一般重新連線驗證優先順序為明確的共用權杖/密碼優先，接著是明確的 `deviceToken`，再來是已儲存的裝置權杖，最後是 bootstrap 權杖。
- 受信任的 `AUTH_TOKEN_MISMATCH` 復原可在一次有界重試中，暫時同時傳送共用權杖與已儲存的裝置權杖。
- `AUTH_SCOPE_MISMATCH` 表示裝置權杖已被辨識，但未帶有所要求的範圍集合；在變更共用閘道驗證前，請先修正配對/範圍核准合約。

相關：

- [儀表板驗證疑難排解](/zh-TW/web/dashboard#if-you-see-unauthorized-1008)
- [閘道疑難排解](/zh-TW/gateway/troubleshooting#dashboard-control-ui-connectivity)

## 相關

- [命令列介面參考](/zh-TW/cli)
- [節點](/zh-TW/nodes)

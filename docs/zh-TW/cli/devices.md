---
read_when:
    - 你正在核准裝置配對請求
    - 您需要輪替或撤銷裝置權杖
summary: '`openclaw devices` 的命令列介面參考（裝置配對 + 權杖輪替/撤銷）'
title: 裝置
x-i18n:
    generated_at: "2026-07-11T21:11:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fb10f7a484fec06bfa5e53ae50181b12a9724746176bbace330ec468235494
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

管理裝置配對請求與裝置範圍權杖。

## 常用選項

- `--url <url>`：閘道 WebSocket URL（設定時預設使用 `gateway.remote.url`）
- `--token <token>`：閘道權杖（如有需要）
- `--password <password>`：閘道密碼（密碼驗證）
- `--timeout <ms>`：RPC 逾時時間
- `--json`：JSON 輸出（建議用於指令碼）

<Warning>
設定 `--url` 時，命令列介面不會回退使用設定或環境中的憑證。請明確傳入 `--token` 或 `--password`，否則命令會發生錯誤。
</Warning>

## 命令

### `openclaw devices list`

列出待處理的配對請求與已配對裝置。

```bash
openclaw devices list
openclaw devices list --json
```

如果已配對裝置有待處理的請求，輸出會在裝置目前已核准的存取權限旁顯示所要求的存取權限，讓範圍／角色升級清楚可見，而不會看起來像是配對遺失。

已配對裝置的顯示名稱依下列優先順序決定：操作者標籤（來自 `devices rename` 的 `operatorLabel`）、用戶端 `displayName`、`clientId`，最後是 `deviceId`。

### `openclaw devices approve [requestId] [--latest]`

透過確切的 `requestId` 核准待處理的配對請求。省略 `requestId` 或傳入 `--latest` 時，只會預覽最新的待處理請求並結束（結束代碼 1）；請使用確切的請求 ID 重新執行以核准。

```bash
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

<Note>
如果裝置使用已變更的驗證詳細資料（角色、範圍或公開金鑰）重試配對，OpenClaw 會以新的 `requestId` 取代先前的待處理項目。請在核准前立即執行 `openclaw devices list`，以取得目前的 ID。
</Note>

核准行為：

- 如果裝置已配對並要求更廣泛的範圍或角色，OpenClaw 會保留現有核准，並建立新的待處理升級請求。核准前，請在 `openclaw devices list` 中比較 `Requested` 與 `Approved`，或使用 `--latest` 預覽。
- 核准 `node` 角色或其他非操作者角色需要 `operator.admin`。`operator.pairing` 足以核准操作者裝置，但前提是要求的操作者範圍未超出呼叫者本身的範圍。請參閱[操作者範圍](/zh-TW/gateway/operator-scopes)。
- 如果已設定 `gateway.nodes.pairing.autoApproveCidrs`，來自相符用戶端 IP 的首次 `role: node` 請求可能會在出現在此清單之前自動核准。預設停用；絕不適用於操作者／瀏覽器用戶端或升級請求。
- `gateway.nodes.pairing.sshVerify`（預設啟用）會在閘道透過 SSH 驗證節點主機上的裝置金鑰時，自動核准首次 `role: node` 請求。因此，請求可能在出現後不久即變為已核准。設定 `sshVerify: false` 可停用 SSH 驗證；此設定獨立於 `autoApproveCidrs`，因此若要僅允許手動配對，也必須取消設定後者。

### `openclaw devices reject <requestId>`

拒絕待處理的裝置配對請求。

```bash
openclaw devices reject <requestId>
```

### `openclaw devices remove <deviceId>`

移除一筆已配對裝置項目。

```bash
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

使用已配對裝置權杖驗證的呼叫者只能移除其**自己的**裝置項目。移除其他裝置需要 `operator.admin`。

### `openclaw devices rename --device <id> --name <label>`

為已配對裝置指派操作者標籤。標籤屬於擁有者端狀態：配對修復與角色重新核准後仍會保留，且不會變更穩定的 `deviceId`。

```bash
openclaw devices rename --device <deviceId> --name "Kitchen Mac"
openclaw devices rename --device <deviceId> --name "Kitchen Mac" --json
```

- `--name` 為必填，會移除前後空白、不得為空，且上限為 64 個字元。
- 顯示介面（命令列介面清單、Control UI 清冊）會優先使用操作者標籤，而非用戶端回報的顯示名稱。
- 非管理員的已配對裝置呼叫者只能重新命名其**自己的**裝置。重新命名其他裝置需要 `operator.admin`。

### `openclaw devices clear --yes [--pending]`

批次清除已配對裝置。必須透過 `--yes` 確認。

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

- 目標角色必須已存在於該裝置已核准的配對合約中；輪替無法建立未經核准的新角色。
- 省略 `--scope` 時，後續重新連線會重複使用已儲存權杖的快取核准範圍。傳入明確的 `--scope` 值時，會取代儲存的範圍集合，供日後使用快取權杖重新連線。
- 非管理員的已配對裝置呼叫者只能輪替其**自己的**裝置權杖，而且目標範圍集合不得超出呼叫者本身的操作者範圍；輪替無法建立或保留比呼叫者現有權限更廣泛的權杖。

以 JSON 傳回輪替中繼資料。如果呼叫者在使用該裝置權杖驗證時輪替自己的權杖，回應會包含替代權杖，讓用戶端可在重新連線前將其保存。共用／管理員輪替絕不會回傳持有者權杖。

### `openclaw devices revoke --device <id> --role <role>`

撤銷某個角色的裝置權杖。

```bash
openclaw devices revoke --device <deviceId> --role node
```

非管理員的已配對裝置呼叫者只能撤銷其**自己的**裝置權杖。撤銷其他裝置的權杖需要 `operator.admin`。目標範圍集合也不得超出呼叫者本身的操作者範圍；只有配對權限的呼叫者無法撤銷具有管理員／寫入權限的操作者權杖。

## 注意事項

- 這些命令需要 `operator.pairing`（或 `operator.admin`）範圍。非操作者裝置角色一律需要 `operator.admin`；請參閱[操作者範圍](/zh-TW/gateway/operator-scopes)。
- 權杖輪替與撤銷僅限於裝置已核准的配對角色集合及範圍基準。零散的快取權杖項目不會授予權杖管理目標。
- 對於已配對裝置權杖工作階段，跨裝置管理（`remove`、`rename`、`rotate`、`revoke`）僅限自身，除非呼叫者具有 `operator.admin`。
- 權杖輪替會傳回新權杖（敏感資訊）——請將其視為機密資料。
- 如果 local loopback 上無法使用配對範圍，且未明確傳入 `--url`，`list`／`approve` 可以回退使用本機配對狀態。

## 權杖偏移復原檢查清單

當 Control UI 或其他用戶端持續因 `AUTH_TOKEN_MISMATCH`、`AUTH_DEVICE_TOKEN_MISMATCH` 或 `AUTH_SCOPE_MISMATCH` 而失敗時，請使用此清單。

1. 確認目前的閘道權杖來源：

   ```bash
   openclaw config get gateway.auth.token
   ```

2. 列出已配對裝置並找出受影響的裝置 ID：

   ```bash
   openclaw devices list
   ```

3. 輪替受影響裝置的操作者權杖：

   ```bash
   openclaw devices rotate --device <deviceId> --role operator
   ```

4. 如果輪替仍不足以解決問題，請移除過時的配對並重新核准：

   ```bash
   openclaw devices remove <deviceId>
   openclaw devices list
   openclaw devices approve <requestId>
   ```

5. 使用目前的共用權杖／密碼重試用戶端連線。

注意事項：

- 一般重新連線的驗證優先順序：先使用明確指定的共用權杖／密碼，再使用明確指定的 `deviceToken`，接著使用已儲存的裝置權杖，最後使用啟動權杖。
- 受信任的 `AUTH_TOKEN_MISMATCH` 復原可以在一次有限制的重試中，暫時同時傳送共用權杖與已儲存的裝置權杖。
- `AUTH_SCOPE_MISMATCH` 表示裝置權杖已被識別，但不包含要求的範圍集合；請先修正配對／範圍核准合約，再變更共用閘道驗證。

相關內容：

- [儀表板驗證疑難排解](/zh-TW/web/dashboard#if-you-see-unauthorized-1008)
- [閘道疑難排解](/zh-TW/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Paperclip／`openclaw_gateway` 首次執行核准

透過 `openclaw_gateway` 介面卡連線的 Paperclip 代理程式，會與任何其他新用戶端一樣，經過首次執行的裝置配對核准。如果 Paperclip 回報 `openclaw_gateway_pairing_required`，請核准待處理的裝置後重試。

```bash
openclaw devices approve --latest
```

預覽會印出確切的 `openclaw devices approve <requestId>` 命令；請驗證詳細資料，然後使用該請求 ID 重新執行命令以核准。若使用遠端閘道或明確指定的憑證，請在預覽與核准時傳入相同的選項：

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

若要避免每次重新啟動後都必須重新核准，請在 Paperclip 中設定持久的 `adapterConfig.devicePrivateKeyPem`，而不要讓它每次執行時都產生新的暫時裝置身分：

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

如果核准持續失敗，請先執行 `openclaw devices list`，確認待處理的請求確實存在。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [節點](/zh-TW/nodes)

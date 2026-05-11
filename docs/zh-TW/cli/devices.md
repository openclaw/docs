---
read_when:
    - 您正在核准裝置配對請求
    - 你需要輪換或撤銷裝置權杖
summary: CLI 參考：`openclaw devices`（裝置配對 + 權杖輪替/撤銷）
title: 裝置
x-i18n:
    generated_at: "2026-05-11T20:25:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: b38caf47697d5fd6c630285c53919f3a5eaf704b1992e57adb1902e20e2a0fc0
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

管理裝置配對要求和裝置範圍權杖。

## 命令

### `openclaw devices list`

列出待處理的配對要求和已配對的裝置。

```
openclaw devices list
openclaw devices list --json
```

當裝置已配對時，待處理要求輸出會在裝置目前已核准存取權旁顯示所要求的存取權。這會明確呈現範圍/角色升級，而不是看起來像配對遺失。

### `openclaw devices remove <deviceId>`

移除一筆已配對裝置項目。

當你使用已配對裝置權杖完成驗證時，非管理員呼叫者只能移除**自己的**裝置項目。移除其他裝置需要 `operator.admin`。

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

大量清除已配對裝置。

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

依精確的 `requestId` 核准待處理的裝置配對要求。如果省略 `requestId` 或傳入 `--latest`，OpenClaw 只會列印選取的待處理要求並結束；請在確認詳細資料後，使用精確的要求 ID 重新執行核准。

<Note>
如果裝置以變更後的驗證詳細資料（角色、範圍或公開金鑰）重試配對，OpenClaw 會取代先前的待處理項目並發出新的 `requestId`。請在核准前立即執行 `openclaw devices list`，以使用目前的 ID。
</Note>

如果裝置已配對，並要求更寬的範圍或更寬的角色，OpenClaw 會保留現有核准並建立新的待處理升級要求。請在 `openclaw devices list` 中檢視 `Requested` 與 `Approved` 欄，或使用 `openclaw devices approve --latest` 在核准前預覽精確的升級內容。

如果 Gateway 已明確設定 `gateway.nodes.pairing.autoApproveCidrs`，來自相符用戶端 IP 的首次 `role: node` 要求可能會在出現在此清單前被核准。該政策預設停用，且永遠不適用於操作者/瀏覽器用戶端或升級要求。

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

拒絕待處理的裝置配對要求。

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

輪換特定角色的裝置權杖（可選擇更新範圍）。
目標角色必須已存在於該裝置已核准的配對合約中；輪換無法鑄造新的未核准角色。
如果省略 `--scope`，之後使用已儲存輪換權杖重新連線時，會重用該權杖快取的已核准範圍。如果傳入明確的 `--scope` 值，這些值會成為未來快取權杖重新連線時儲存的範圍集合。
非管理員的已配對裝置呼叫者只能輪換**自己的**裝置權杖。
目標權杖範圍集合必須維持在呼叫者工作階段自己的操作者範圍內；輪換無法鑄造或保留比呼叫者既有權限更寬的操作者權杖。

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

以 JSON 傳回輪換中繼資料。如果呼叫者在使用該裝置權杖完成驗證時輪換自己的權杖，回應也會包含替換權杖，讓用戶端能在重新連線前將其保留。共享/管理員輪換不會回傳持有人權杖。

### `openclaw devices revoke --device <id> --role <role>`

撤銷特定角色的裝置權杖。

非管理員的已配對裝置呼叫者只能撤銷**自己的**裝置權杖。
撤銷其他裝置的權杖需要 `operator.admin`。
目標權杖範圍集合也必須符合呼叫者工作階段自己的操作者範圍；僅配對的呼叫者無法撤銷管理員/寫入操作者權杖。

```
openclaw devices revoke --device <deviceId> --role node
```

以 JSON 傳回撤銷結果。

## 常用選項

- `--url <url>`：Gateway WebSocket URL（已設定時預設為 `gateway.remote.url`）。
- `--token <token>`：Gateway 權杖（如需要）。
- `--password <password>`：Gateway 密碼（密碼驗證）。
- `--timeout <ms>`：RPC 逾時。
- `--json`：JSON 輸出（建議用於腳本）。

<Warning>
當你設定 `--url` 時，CLI 不會退回使用設定或環境憑證。請明確傳入 `--token` 或 `--password`。缺少明確憑證會造成錯誤。
</Warning>

## 備註

- 權杖輪換會傳回新權杖（敏感資訊）。請將其視為祕密處理。
- 這些命令需要 `operator.pairing`（或 `operator.admin`）範圍。部分核准也要求呼叫者持有目標裝置將鑄造或繼承的操作者範圍；請參閱[操作者範圍](/zh-TW/gateway/operator-scopes)。
- `gateway.nodes.pairing.autoApproveCidrs` 是一項需選擇啟用的 Gateway 政策，僅適用於新的節點裝置配對；它不會改變 CLI 核准權限。
- 權杖輪換和撤銷會維持在該裝置已核准的配對角色集合與已核准範圍基準內。零散的快取權杖項目不會授予權杖管理目標。
- 對於已配對裝置的權杖工作階段，跨裝置管理僅限管理員：
  `remove`、`rotate` 和 `revoke` 都只能對自己操作，除非呼叫者擁有 `operator.admin`。
- 權杖變更也受呼叫者範圍限制：僅配對工作階段無法輪換或撤銷目前帶有 `operator.admin` 或 `operator.write` 的權杖。
- `devices clear` 會刻意由 `--yes` 保護。
- 如果 local loopback 上無法使用配對範圍（且未傳入明確的 `--url`），list/approve 可以使用本機配對後援。
- `devices approve` 在鑄造權杖前需要明確的要求 ID；省略 `requestId` 或傳入 `--latest` 只會預覽最新的待處理要求。

## 權杖漂移復原檢查清單

當 Control UI 或其他用戶端持續因 `AUTH_TOKEN_MISMATCH`、`AUTH_DEVICE_TOKEN_MISMATCH` 或 `AUTH_SCOPE_MISMATCH` 失敗時使用此清單。

1. 確認目前的 gateway 權杖來源：

```bash
openclaw config get gateway.auth.token
```

2. 列出已配對裝置並識別受影響的裝置 ID：

```bash
openclaw devices list
```

3. 輪換受影響裝置的操作者權杖：

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. 如果輪換仍不足，移除過期配對並重新核准：

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. 使用目前的共享權杖/密碼重試用戶端連線。

備註：

- 一般重新連線驗證優先順序為：先使用明確的共享權杖/密碼，再使用明確的 `deviceToken`，再使用已儲存的裝置權杖，最後使用 bootstrap 權杖。
- 受信任的 `AUTH_TOKEN_MISMATCH` 復原可以暫時同時傳送共享權杖和已儲存的裝置權杖，用於一次有界限的重試。
- `AUTH_SCOPE_MISMATCH` 表示裝置權杖已被識別，但未帶有所要求的範圍集合；請先修正配對/範圍核准合約，再變更共享 gateway 驗證。

相關：

- [Dashboard 驗證疑難排解](/zh-TW/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway 疑難排解](/zh-TW/gateway/troubleshooting#dashboard-control-ui-connectivity)

## 相關

- [CLI 參考](/zh-TW/cli)
- [節點](/zh-TW/nodes)

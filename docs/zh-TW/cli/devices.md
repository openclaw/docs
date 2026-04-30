---
read_when:
    - 你正在核准裝置配對請求
    - 你需要輪替或撤銷裝置權杖
summary: '`openclaw devices` 的 CLI 參考（裝置配對 + 權杖輪替/撤銷）'
title: 裝置
x-i18n:
    generated_at: "2026-04-30T02:52:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: df105135a12ec733e45a67792e8447628f1538fc2536a008d615d46d1eaff5c8
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

管理裝置配對請求和裝置範圍的權杖。

## 命令

### `openclaw devices list`

列出待處理的配對請求和已配對的裝置。

```
openclaw devices list
openclaw devices list --json
```

待處理請求的輸出會在裝置目前已核准的存取權旁邊顯示請求的存取權，前提是該裝置已經配對。這會讓範圍/角色升級明確可見，而不是看起來像配對遺失了。

### `openclaw devices remove <deviceId>`

移除一個已配對的裝置項目。

當你使用已配對裝置權杖進行身分驗證時，非管理員呼叫者只能移除**自己的**裝置項目。移除其他裝置需要 `operator.admin`。

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

大量清除已配對的裝置。

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

依精確的 `requestId` 核准待處理的裝置配對請求。如果省略 `requestId` 或傳入 `--latest`，OpenClaw 只會列印選取的待處理請求後結束；請先確認詳細資料，再使用精確的請求 ID 重新執行核准。

<Note>
如果裝置以變更後的驗證詳細資料（角色、範圍或公開金鑰）重試配對，OpenClaw 會取代先前的待處理項目，並發出新的 `requestId`。請在核准前立即執行 `openclaw devices list`，以使用目前的 ID。
</Note>

如果裝置已經配對，並要求更廣的範圍或更廣的角色，OpenClaw 會保留現有核准，並建立新的待處理升級請求。請查看 `openclaw devices list` 中的 `Requested` 與 `Approved` 欄位，或使用 `openclaw devices approve --latest` 在核准前預覽精確的升級內容。

如果 Gateway 明確設定了 `gateway.nodes.pairing.autoApproveCidrs`，來自相符用戶端 IP 的首次 `role: node` 請求可以在出現在此清單之前獲得核准。該原則預設停用，且永遠不適用於操作者/瀏覽器用戶端或升級請求。

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

拒絕待處理的裝置配對請求。

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

輪替特定角色的裝置權杖（可選擇更新範圍）。
目標角色必須已存在於該裝置已核准的配對合約中；輪替不能鑄造新的未核准角色。
如果你省略 `--scope`，之後使用已儲存輪替權杖重新連線時，會重用該權杖快取的已核准範圍。如果你傳入明確的 `--scope` 值，這些值會成為未來快取權杖重新連線所儲存的範圍集合。
非管理員的已配對裝置呼叫者只能輪替**自己的**裝置權杖。
目標權杖範圍集合必須維持在呼叫者工作階段自己的操作者範圍內；輪替不能鑄造或保留比呼叫者已擁有者更廣的操作者權杖。

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

以 JSON 傳回輪替中繼資料。如果呼叫者在使用該裝置權杖進行身分驗證時輪替自己的權杖，回應也會包含替換權杖，讓用戶端可在重新連線前保存它。共享/管理員輪替不會回傳承載權杖。

### `openclaw devices revoke --device <id> --role <role>`

撤銷特定角色的裝置權杖。

非管理員的已配對裝置呼叫者只能撤銷**自己的**裝置權杖。
撤銷其他裝置的權杖需要 `operator.admin`。
目標權杖範圍集合也必須符合呼叫者工作階段自己的操作者範圍；僅配對的呼叫者不能撤銷管理員/寫入操作者權杖。

```
openclaw devices revoke --device <deviceId> --role node
```

以 JSON 傳回撤銷結果。

## 常用選項

- `--url <url>`：Gateway WebSocket URL（設定時預設為 `gateway.remote.url`）。
- `--token <token>`：Gateway 權杖（如有需要）。
- `--password <password>`：Gateway 密碼（密碼驗證）。
- `--timeout <ms>`：RPC 逾時。
- `--json`：JSON 輸出（建議用於指令碼）。

<Warning>
當你設定 `--url` 時，CLI 不會回退到設定或環境認證。請明確傳入 `--token` 或 `--password`。缺少明確認證會導致錯誤。
</Warning>

## 備註

- 權杖輪替會傳回新的權杖（敏感資訊）。請將它視為機密。
- 這些命令需要 `operator.pairing`（或 `operator.admin`）範圍。
- `gateway.nodes.pairing.autoApproveCidrs` 是一項選用的 Gateway 原則，僅適用於新的節點裝置配對；它不會變更 CLI 核准權限。
- 權杖輪替和撤銷會維持在該裝置已核准的配對角色集合，以及已核准的範圍基準內。游離的快取權杖項目不會授予權杖管理目標。
- 對於已配對裝置權杖工作階段，跨裝置管理僅限管理員：
  `remove`、`rotate` 和 `revoke` 僅限自身操作，除非呼叫者擁有
  `operator.admin`。
- 權杖變更也受呼叫者範圍限制：僅配對工作階段不能
  輪替或撤銷目前帶有 `operator.admin` 或
  `operator.write` 的權杖。
- `devices clear` 會刻意以 `--yes` 作為門檻。
- 如果配對範圍在 local loopback 上無法使用（且未傳入明確的 `--url`），list/approve 可以使用本機配對後援。
- `devices approve` 在鑄造權杖前需要明確的請求 ID；省略 `requestId` 或傳入 `--latest` 只會預覽最新的待處理請求。

## 權杖漂移復原檢查清單

當 Control UI 或其他用戶端持續因 `AUTH_TOKEN_MISMATCH` 或 `AUTH_DEVICE_TOKEN_MISMATCH` 失敗時，請使用此清單。

1. 確認目前的 Gateway 權杖來源：

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

4. 如果輪替仍不足，移除過期配對並重新核准：

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. 使用目前的共享權杖/密碼重試用戶端連線。

備註：

- 一般重新連線的驗證優先順序是明確共享權杖/密碼優先，接著是明確的 `deviceToken`，再來是已儲存的裝置權杖，最後是啟動權杖。
- 受信任的 `AUTH_TOKEN_MISMATCH` 復原可以在一次有界重試中，暫時同時傳送共享權杖和已儲存的裝置權杖。

相關：

- [儀表板驗證疑難排解](/zh-TW/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway 疑難排解](/zh-TW/gateway/troubleshooting#dashboard-control-ui-connectivity)

## 相關

- [CLI 參考](/zh-TW/cli)
- [節點](/zh-TW/nodes)

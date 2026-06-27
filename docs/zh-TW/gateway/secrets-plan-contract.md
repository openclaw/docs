---
read_when:
    - 產生或審查 `openclaw secrets apply` 計畫
    - 偵錯 `Invalid plan target path` 錯誤
    - 了解目標類型與路徑驗證行為
summary: '`secrets apply` 計畫的契約：目標驗證、路徑比對，以及 `auth-profiles.json` 目標範圍'
title: 密鑰套用計畫契約
x-i18n:
    generated_at: "2026-06-27T19:21:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03f0ca9b433553a2f6d86d01b8c227a24b6f53ef7034a94bd648fbf04c81f13e
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

此頁面定義 `openclaw secrets apply` 強制執行的嚴格合約。

如果目標不符合這些規則，apply 會在變更設定前失敗。

## 計畫檔案形狀

`openclaw secrets apply --from <plan.json>` 預期 `targets` 是由計畫目標組成的陣列：

```json5
{
  version: 1,
  protocolVersion: 1,
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.openai.apiKey",
      pathSegments: ["models", "providers", "openai", "apiKey"],
      providerId: "openai",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
    {
      type: "auth-profiles.api_key.key",
      path: "profiles.openai:default.key",
      pathSegments: ["profiles", "openai:default", "key"],
      agentId: "main",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
  ],
}
```

## 提供者 upsert 與刪除

計畫也可以包含兩個選用的最上層欄位，在逐目標寫入的同時變更
`secrets.providers` 對應表：

- `providerUpserts` — 以提供者別名為鍵的物件。每個值都是一個
  提供者定義（與 `openclaw.json` 中 `secrets.providers.<alias>`
  下接受的形狀相同，例如 `exec` 或 `file` 提供者）。
- `providerDeletes` — 要移除的提供者別名陣列。

`providerUpserts` 會在 `targets` 之前執行，因此 `target.ref.provider` 可以
參照同一份計畫在 `providerUpserts` 中引入的提供者別名。若沒有這項支援，參照尚未在
`openclaw.json` 中設定之別名的計畫會因 `provider "<alias>" is not
configured` 而失敗。

```json5
{
  version: 1,
  protocolVersion: 1,
  providerUpserts: {
    onepassword_anthropic: {
      source: "exec",
      command: "/usr/bin/op",
      args: ["read", "op://Vault/Anthropic/credential"],
    },
  },
  providerDeletes: ["legacy_unused_alias"],
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.anthropic.apiKey",
      pathSegments: ["models", "providers", "anthropic", "apiKey"],
      providerId: "anthropic",
      ref: { source: "exec", provider: "onepassword_anthropic", id: "credential" },
    },
  ],
}
```

透過 `providerUpserts` 引入的 Exec 提供者仍受 [Exec 提供者同意行為](#exec-provider-consent-behavior)中的
exec 同意規則約束：
包含 exec 提供者的計畫在寫入模式中需要 `--allow-exec`。

## 支援的目標範圍

計畫目標可用於以下支援憑證路徑：

- [SecretRef 憑證介面](/zh-TW/reference/secretref-credential-surface)

## 目標類型行為

一般規則：

- `target.type` 必須可被辨識，且必須符合正規化後的 `target.path` 形狀。

相容性別名仍可供既有計畫使用：

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## 路徑驗證規則

每個目標都會以以下全部規則驗證：

- `type` 必須是可辨識的目標類型。
- `path` 必須是非空的點分隔路徑。
- `pathSegments` 可以省略。若有提供，正規化後必須與 `path` 完全相同。
- 禁用片段會被拒絕：`__proto__`、`prototype`、`constructor`。
- 正規化路徑必須符合目標類型已註冊的路徑形狀。
- 如果設定了 `providerId` 或 `accountId`，它必須符合路徑中編碼的 ID。
- `auth-profiles.json` 目標需要 `agentId`。
- 建立新的 `auth-profiles.json` 對應時，請包含 `authProfileProvider`。

## 失敗行為

如果目標驗證失敗，apply 會以如下錯誤結束：

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

無效計畫不會提交任何寫入。

## Exec 提供者同意行為

- `--dry-run` 預設會略過 exec SecretRef 檢查。
- 包含 exec SecretRefs/提供者的計畫在寫入模式中會被拒絕，除非設定了 `--allow-exec`。
- 驗證/套用包含 exec 的計畫時，請在 dry-run 和寫入命令中都傳入 `--allow-exec`。

## 執行階段與稽核範圍附註

- 僅參照的 `auth-profiles.json` 項目（`keyRef`/`tokenRef`）會包含在執行階段解析與稽核涵蓋範圍中。
- `secrets apply` 會寫入支援的 `openclaw.json` 目標、支援的 `auth-profiles.json` 目標，以及選用的清理目標。

## 操作者檢查

```bash
# Validate plan without writes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Then apply for real
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# For exec-containing plans, opt in explicitly in both modes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

如果 apply 因無效目標路徑訊息而失敗，請使用 `openclaw secrets configure` 重新產生計畫，或將目標路徑修正為上方支援的形狀。

## 相關文件

- [祕密管理](/zh-TW/gateway/secrets)
- [命令列介面 `secrets`](/zh-TW/cli/secrets)
- [SecretRef 憑證介面](/zh-TW/reference/secretref-credential-surface)
- [設定參考](/zh-TW/gateway/configuration-reference)

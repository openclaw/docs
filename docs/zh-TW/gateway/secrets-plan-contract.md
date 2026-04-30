---
read_when:
    - 產生或審查 `openclaw secrets apply` 計畫
    - 偵錯 `Invalid plan target path` 錯誤
    - 了解目標類型與路徑驗證行為
summary: '`secrets apply` 計畫的契約：目標驗證、路徑比對，以及 `auth-profiles.json` 目標範圍'
title: 機密資訊套用計畫契約
x-i18n:
    generated_at: "2026-04-30T03:09:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 80214353a1368b249784aa084c714e043c2d515706357d4ba1f111a3c68d1a84
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

本頁定義 `openclaw secrets apply` 強制執行的嚴格契約。

如果目標不符合這些規則，套用作業會在變更設定前失敗。

## 計畫檔案格式

`openclaw secrets apply --from <plan.json>` 預期會收到包含計畫目標的 `targets` 陣列：

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

## 支援的目標範圍

下列位置中支援的認證資料路徑可接受計畫目標：

- [SecretRef 認證資料介面](/zh-TW/reference/secretref-credential-surface)

## 目標類型行為

一般規則：

- `target.type` 必須可識別，且必須符合正規化後的 `target.path` 形狀。

為了相容性，現有計畫仍可使用別名：

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## 路徑驗證規則

每個目標都會以下列所有規則驗證：

- `type` 必須是可識別的目標類型。
- `path` 必須是非空的點分隔路徑。
- `pathSegments` 可以省略。如果提供，正規化後必須與 `path` 完全相同。
- 禁止使用的區段會被拒絕：`__proto__`、`prototype`、`constructor`。
- 正規化後的路徑必須符合目標類型註冊的路徑形狀。
- 如果設定了 `providerId` 或 `accountId`，它必須符合路徑中編碼的 ID。
- `auth-profiles.json` 目標需要 `agentId`。
- 建立新的 `auth-profiles.json` 對應時，請包含 `authProfileProvider`。

## 失敗行為

如果目標驗證失敗，套用作業會結束並顯示類似以下的錯誤：

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

無效計畫不會提交任何寫入。

## Exec 提供者同意行為

- `--dry-run` 預設會略過 exec SecretRef 檢查。
- 包含 exec SecretRefs/providers 的計畫在寫入模式下會被拒絕，除非設定 `--allow-exec`。
- 驗證或套用包含 exec 的計畫時，請在 dry-run 和寫入命令中都傳入 `--allow-exec`。

## 執行階段與稽核範圍注意事項

- 僅參照的 `auth-profiles.json` 項目（`keyRef`/`tokenRef`）會納入執行階段解析與稽核涵蓋範圍。
- `secrets apply` 會寫入支援的 `openclaw.json` 目標、支援的 `auth-profiles.json` 目標，以及選用的清除目標。

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

如果套用作業因無效目標路徑訊息而失敗，請使用 `openclaw secrets configure` 重新產生計畫，或將目標路徑修正為上述支援的形狀。

## 相關文件

- [Secrets 管理](/zh-TW/gateway/secrets)
- [CLI `secrets`](/zh-TW/cli/secrets)
- [SecretRef 認證資料介面](/zh-TW/reference/secretref-credential-surface)
- [設定參考](/zh-TW/gateway/configuration-reference)

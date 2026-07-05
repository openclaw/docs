---
read_when:
    - 產生或審查 `openclaw secrets apply` 計畫
    - 偵錯 `Invalid plan target path` 錯誤
    - 了解目標類型與路徑驗證行為
summary: '`secrets apply` 計畫的契約：目標驗證、路徑比對，以及 `auth-profiles.json` 目標範圍'
title: 密鑰套用計畫契約
x-i18n:
    generated_at: "2026-07-05T11:23:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ddaf3df7f0be326fa1c8dc8c360b03697fb58329d03c4eb8106a8740ddf6c47a
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

此頁面定義 `openclaw secrets apply` 強制執行的嚴格契約。如果目標不符合這些規則，apply 會在變更任何檔案前失敗。

## 計畫檔案結構

`openclaw secrets apply --from <plan.json>` 預期有一個由計畫目標組成的 `targets` 陣列：

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

`openclaw secrets configure` 會產生這種結構的計畫。你也可以手寫或編輯一個。

## 提供者 upsert 與刪除

計畫也可以包含兩個選用的頂層欄位，這些欄位會在每個目標寫入之外，同步變更 `secrets.providers` 對應：

- `providerUpserts` -- 以提供者別名為鍵的物件。每個值都是一個提供者定義（與 `openclaw.json` 中 `secrets.providers.<alias>` 底下接受的結構相同，例如 `exec` 或 `file` 提供者）。
- `providerDeletes` -- 要移除的提供者別名陣列。

`providerUpserts` 會在 `targets` 之前執行，因此 `target.ref.provider` 可以參照同一個計畫在 `providerUpserts` 中引入的提供者別名。若沒有這個順序，參照尚未在 `openclaw.json` 中設定之別名的計畫，會因 `provider "<alias>" is not configured` 而失敗。

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

透過 `providerUpserts` 引入的 Exec 提供者仍受 [Exec 提供者同意行為](#exec-provider-consent-behavior) 中的 exec 同意規則約束：包含 exec 提供者的計畫，在寫入模式中需要 `--allow-exec`。

## 支援的目標範圍

計畫目標可用於 [SecretRef 認證資訊表面](/zh-TW/reference/secretref-credential-surface) 中支援的認證資訊路徑。

## 目標類型行為

`target.type` 必須是可辨識的目標類型，且正規化後的 `target.path` 必須符合該類型已註冊的路徑結構。

除了標準類型名稱外，某些目標類型也接受相容性別名作為 `target.type`，供既有計畫使用：

| 標準類型                             | 接受的別名                                      |
| ------------------------------------ | ----------------------------------------------- |
| `models.providers.apiKey`            | `models.providers.*.apiKey`                     |
| `skills.entries.apiKey`              | `skills.entries.*.apiKey`                       |
| `channels.googlechat.serviceAccount` | `channels.googlechat.accounts.*.serviceAccount` |

## 路徑驗證規則

每個目標都會用以下所有規則驗證：

- `type` 必須是可辨識的目標類型。
- `path` 必須是非空的點號路徑。
- `pathSegments` 可以省略。如果提供，正規化後必須與 `path` 完全相同。
- 禁止的片段會被拒絕：`__proto__`、`prototype`、`constructor`。
- 正規化後的路徑必須符合該目標類型已註冊的路徑結構。
- 如果設定了 `providerId` 或 `accountId`，它必須符合路徑中編碼的 id。
- `auth-profiles.json` 目標需要 `agentId`。
- 建立新的 `auth-profiles.json` 對應時，請包含 `authProfileProvider`。

## 失敗行為

如果目標驗證失敗，apply 會以下列錯誤結束：

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

無效計畫不會提交任何寫入：目標解析與路徑驗證會在觸碰任何檔案之前執行。另外，一旦有效計畫開始寫入，apply 會先快照每個被觸碰的檔案；如果同一次執行中稍後的寫入失敗，就會還原那些快照，因此部分寫入絕不會讓設定、auth-profile 或 env 狀態不同步。

## Exec 提供者同意行為

- `--dry-run` 預設會略過 exec SecretRef 檢查。
- 包含 exec SecretRefs/提供者的計畫，在寫入模式中會被拒絕，除非設定 `--allow-exec`。
- 驗證/套用包含 exec 的計畫時，請在 dry-run 與寫入命令中都傳入 `--allow-exec`。

## 執行階段與稽核範圍注意事項

- 僅參照的 `auth-profiles.json` 項目（`keyRef`/`tokenRef`）會納入執行階段認證資訊解析與稽核涵蓋範圍。
- `secrets apply` 會寫入支援的 `openclaw.json` 目標、支援的 `auth-profiles.json` 目標，以及三個選用的清理流程，每個預設都會啟用：`scrubEnv`（從 `.env` 移除已遷移的明文值）、`scrubAuthProfilesForProviderTargets`（針對計畫剛遷移的提供者，清除 `auth-profiles.json` 中的明文/未使用參照殘留），以及 `scrubLegacyAuthJson`（從舊版 `auth.json` 存放區移除已遷移的 `api_key` 項目）。在計畫中將 `options.scrubEnv`、`options.scrubAuthProfilesForProviderTargets`、`options.scrubLegacyAuthJson` 任一項設為 `false`，即可略過該流程。

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

如果 apply 因無效目標路徑訊息而失敗，請用 `openclaw secrets configure` 重新產生計畫，或將目標路徑修正為上述支援的結構。

## 相關文件

- [Secrets 管理](/zh-TW/gateway/secrets)
- [命令列介面 `secrets`](/zh-TW/cli/secrets)
- [SecretRef 認證資訊表面](/zh-TW/reference/secretref-credential-surface)
- [設定參考](/zh-TW/gateway/configuration-reference)

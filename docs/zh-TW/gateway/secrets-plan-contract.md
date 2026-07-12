---
read_when:
    - 產生或審查 `openclaw secrets apply` 計畫
    - 偵錯 `Invalid plan target path` 錯誤
    - 了解目標類型與路徑驗證行為
summary: '`secrets apply` 計畫的契約：目標驗證、路徑比對，以及 `auth-profiles.json` 目標範圍'
title: 密鑰套用計畫合約
x-i18n:
    generated_at: "2026-07-11T21:23:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ddaf3df7f0be326fa1c8dc8c360b03697fb58329d03c4eb8106a8740ddf6c47a
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

本頁定義 `openclaw secrets apply` 強制執行的嚴格契約。若目標不符合這些規則，套用作業會在修改任何檔案前失敗。

## 計畫檔案格式

`openclaw secrets apply --from <plan.json>` 預期其中包含由計畫目標組成的 `targets` 陣列：

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

`openclaw secrets configure` 會產生此格式的計畫。你也可以手動撰寫或編輯計畫。

## 提供者的新增或更新與刪除

計畫也可以包含兩個選用的頂層欄位，在寫入各個目標的同時修改 `secrets.providers` 對應表：

- `providerUpserts` -- 以提供者別名為鍵的物件。每個值都是提供者定義（格式與 `openclaw.json` 中 `secrets.providers.<alias>` 接受的格式相同，例如 `exec` 或 `file` 提供者）。
- `providerDeletes` -- 要移除的提供者別名陣列。

`providerUpserts` 會在 `targets` 之前執行，因此 `target.ref.provider` 可以參照同一計畫在 `providerUpserts` 中新增的提供者別名。若沒有此執行順序，參照尚未在 `openclaw.json` 中設定之別名的計畫會失敗，並顯示 `provider "<alias>" is not configured`。

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

透過 `providerUpserts` 新增的 Exec 提供者仍須遵守 [Exec 提供者同意行為](#exec-provider-consent-behavior)中的 Exec 同意規則：包含 Exec 提供者的計畫在寫入模式下需要使用 `--allow-exec`。

## 支援的目標範圍

計畫目標僅接受 [SecretRef 憑證介面](/zh-TW/reference/secretref-credential-surface)中支援的憑證路徑。

## 目標類型行為

`target.type` 必須是可識別的目標類型，且正規化後的 `target.path` 必須符合該類型已註冊的路徑格式。

除了標準類型名稱外，部分目標類型也接受相容性別名作為現有計畫的 `target.type`：

| 標準類型                             | 接受的別名                                      |
| ------------------------------------ | ----------------------------------------------- |
| `models.providers.apiKey`            | `models.providers.*.apiKey`                     |
| `skills.entries.apiKey`              | `skills.entries.*.apiKey`                       |
| `channels.googlechat.serviceAccount` | `channels.googlechat.accounts.*.serviceAccount` |

## 路徑驗證規則

每個目標都會依照以下所有規則進行驗證：

- `type` 必須是可識別的目標類型。
- `path` 必須是非空的點號分隔路徑。
- `pathSegments` 可以省略。若有提供，正規化後必須與 `path` 完全相同。
- 禁止使用以下區段：`__proto__`、`prototype`、`constructor`。
- 正規化後的路徑必須符合該目標類型已註冊的路徑格式。
- 若設定了 `providerId` 或 `accountId`，則必須與路徑中編碼的 ID 相符。
- `auth-profiles.json` 目標需要 `agentId`。
- 建立新的 `auth-profiles.json` 對應時，請包含 `authProfileProvider`。

## 失敗行為

若目標驗證失敗，套用作業會結束並顯示類似以下的錯誤：

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

無效計畫不會提交任何寫入：系統會在觸及任何檔案前完成目標解析與路徑驗證。另外，有效計畫開始寫入後，套用作業會先建立所有受影響檔案的快照；若同一次執行中後續的寫入失敗，便會還原這些快照，因此部分寫入絕不會導致設定、驗證設定檔或環境變數狀態不同步。

## Exec 提供者同意行為

- `--dry-run` 預設會略過 Exec SecretRef 檢查。
- 除非設定 `--allow-exec`，否則在寫入模式下會拒絕包含 Exec SecretRef／提供者的計畫。
- 驗證或套用包含 Exec 的計畫時，請在試執行與寫入命令中都傳入 `--allow-exec`。

## 執行階段與稽核範圍說明

- 僅含參照的 `auth-profiles.json` 項目（`keyRef`／`tokenRef`）會納入執行階段憑證解析與稽核涵蓋範圍。
- `secrets apply` 會寫入支援的 `openclaw.json` 目標、支援的 `auth-profiles.json` 目標，以及三個選用且預設啟用的清除程序：`scrubEnv`（從 `.env` 移除已遷移的明文值）、`scrubAuthProfilesForProviderTargets`（針對計畫剛遷移的提供者，清除 `auth-profiles.json` 中殘留的明文或未使用參照）以及 `scrubLegacyAuthJson`（從舊版 `auth.json` 儲存區移除已遷移的 `api_key` 項目）。若要略過任一程序，請在計畫中將 `options.scrubEnv`、`options.scrubAuthProfilesForProviderTargets` 或 `options.scrubLegacyAuthJson` 設為 `false`。

## 操作者檢查

```bash
# 驗證計畫但不寫入
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# 接著實際套用
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# 對於包含 Exec 的計畫，兩種模式都必須明確選擇啟用
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

若套用作業因無效目標路徑訊息而失敗，請使用 `openclaw secrets configure` 重新產生計畫，或將目標路徑修正為上述支援的格式。

## 相關文件

- [密鑰管理](/zh-TW/gateway/secrets)
- [命令列介面 `secrets`](/zh-TW/cli/secrets)
- [SecretRef 憑證介面](/zh-TW/reference/secretref-credential-surface)
- [設定參考](/zh-TW/gateway/configuration-reference)

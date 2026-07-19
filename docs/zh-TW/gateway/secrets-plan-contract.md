---
read_when:
    - 產生或審查 `openclaw secrets apply` 計畫
    - 偵錯 `Invalid plan target path` 錯誤
    - 了解目標類型與路徑驗證行為
summary: '`secrets apply` 計畫的契約：目標驗證、路徑比對，以及 `auth-profiles.json` 目標範圍'
title: 機密資訊套用計畫契約
x-i18n:
    generated_at: "2026-07-19T13:45:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 71ee8afd958646930af4db3bbad08e033ff79da48890a989d72b361abcbda3bb
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

本頁定義由 `openclaw secrets apply` 強制執行的嚴格契約。若目標不符合這些規則，套用作業會在修改任何檔案前失敗。

## 計畫檔案需求

`openclaw secrets apply --from <plan.json>` 接受最大 16 MiB（16,777,216 位元組）的一般檔案。此限制適用於完整的序列化檔案，包括空白字元。目錄、FIFO、裝置檔案及超過此限制的檔案，都會在 JSON 剖析或目標驗證前遭到拒絕。

`openclaw secrets configure --plan-out <plan.json>` 會在建立檔案前，對 UTF-8 序列化輸出強制執行相同限制。手動編寫的計畫及外部計畫產生器，也必須讓序列化檔案維持在此限制內。

## 計畫檔案結構

`openclaw secrets apply --from <plan.json>` 預期收到由計畫目標組成的 `targets` 陣列：

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

`openclaw secrets configure` 會產生此結構的計畫。你也可以手動編寫或編輯計畫。

## 提供者的新增或更新與刪除

計畫也可包含兩個選用的頂層欄位，以便在寫入各個目標的同時修改 `secrets.providers` 對應表：

- `providerUpserts` -- 以提供者別名為索引鍵的物件。每個值都是一個提供者定義（其結構與 `openclaw.json` 中 `secrets.providers.<alias>` 所接受的結構相同，例如 `exec` 或 `file` 提供者）。
- `providerDeletes` -- 要移除的提供者別名陣列。

`providerUpserts` 會在 `targets` 前執行，因此 `target.ref.provider` 可以參照同一計畫在 `providerUpserts` 中引入的提供者別名。若沒有此執行順序，參照尚未在 `openclaw.json` 中設定之別名的計畫，會因 `provider "<alias>" is not configured` 而失敗。

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

透過 `providerUpserts` 引入的 exec 提供者，仍須遵守[Exec 提供者同意行為](#exec-provider-consent-behavior)中的 exec 同意規則：包含 exec 提供者的計畫在寫入模式中需要 `--allow-exec`。

## 支援的目標範圍

計畫目標接受 [SecretRef 認證資訊介面](/zh-TW/reference/secretref-credential-surface)中支援的認證資訊路徑。

## 目標類型行為

`target.type` 必須是可辨識的目標類型，而正規化後的 `target.path` 必須符合該類型已註冊的路徑結構。

除了標準類型名稱外，部分目標類型也接受 `target.type` 作為現有計畫的相容性別名：

| 標準類型                             | 接受的別名                                      |
| ------------------------------------ | ----------------------------------------------- |
| `models.providers.apiKey`            | `models.providers.*.apiKey`                     |
| `skills.entries.apiKey`              | `skills.entries.*.apiKey`                       |
| `channels.googlechat.serviceAccount` | `channels.googlechat.accounts.*.serviceAccount` |

## 路徑驗證規則

每個目標都會依下列所有規則進行驗證：

- `type` 必須是可辨識的目標類型。
- `path` 必須是非空白的點分隔路徑。
- `pathSegments` 可以省略。若有提供，正規化後必須與 `path` 的路徑完全相同。
- 禁止的區段會遭到拒絕：`__proto__`、`prototype`、`constructor`。
- 正規化後的路徑必須符合目標類型已註冊的路徑結構。
- 若已設定 `providerId` 或 `accountId`，其值必須符合路徑中編碼的 ID。
- `auth-profiles.json` 目標需要 `agentId`。
- 建立新的 `auth-profiles.json` 對應時，請包含 `authProfileProvider`。

## 失敗行為

若目標驗證失敗，套用作業會結束並顯示類似以下的錯誤：

```text
models.providers.apiKey 的計畫目標路徑無效：models.providers.openai.baseUrl
```

無效的計畫不會提交任何寫入：目標解析及路徑驗證會在接觸任何檔案前執行。另外，有效計畫開始寫入後，套用作業會先建立每個受影響檔案的快照；若同一次執行中的後續寫入失敗，便會還原這些快照，因此部分寫入絕不會導致設定、驗證設定檔或環境狀態不同步。

## Exec 提供者同意行為

- `--dry-run` 預設會略過 exec SecretRef 檢查。
- 在寫入模式中，除非已設定 `--allow-exec`，否則包含 exec SecretRef／提供者的計畫會遭到拒絕。
- 驗證／套用包含 exec 的計畫時，請在模擬執行和寫入命令中都傳入 `--allow-exec`。

## 執行階段與稽核範圍注意事項

- 僅含參照的 `auth-profiles.json` 項目（`keyRef`/`tokenRef`）會納入執行階段認證資訊解析與稽核涵蓋範圍。
- `secrets apply` 會寫入支援的 `openclaw.json` 目標、支援的 `auth-profiles.json` 目標，以及三個選用且預設啟用的清除階段：`scrubEnv`（從有效狀態與作用中設定目錄內的 `.env` 檔案移除已遷移的純文字值）、`scrubAuthProfilesForProviderTargets`（針對計畫剛遷移的提供者，清除 `auth-profiles.json` 中的純文字／未使用參照殘留項目），以及 `scrubLegacyAuthJson`（從舊版 `auth.json` 儲存區刪除已遷移的 `api_key` 項目）。在計畫中將 `options.scrubEnv`、`options.scrubAuthProfilesForProviderTargets`、`options.scrubLegacyAuthJson` 中的任何一項設為 `false`，即可略過對應階段。

## 操作者檢查

```bash
# 驗證計畫但不寫入
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# 接著實際套用
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# 對於包含 exec 的計畫，請在兩種模式中明確選擇啟用
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

若套用作業因目標路徑無效訊息而失敗，請使用 `openclaw secrets configure` 重新產生計畫，或將目標路徑修正為上述支援的結構。

## 相關文件

- [密鑰管理](/zh-TW/gateway/secrets)
- [命令列介面 `secrets`](/zh-TW/cli/secrets)
- [SecretRef 認證資訊介面](/zh-TW/reference/secretref-credential-surface)
- [設定參考](/zh-TW/gateway/configuration-reference)

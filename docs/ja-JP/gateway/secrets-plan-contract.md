---
read_when:
    - '`openclaw secrets apply` プランの生成またはレビュー'
    - '`Invalid plan target path` エラーのデバッグ'
    - ターゲットの種類とパス検証の動作を理解する
summary: '`secrets apply` プランのコントラクト：ターゲット検証、パス照合、`auth-profiles.json` ターゲットのスコープ'
title: シークレット適用プランのコントラクト
x-i18n:
    generated_at: "2026-07-11T22:15:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ddaf3df7f0be326fa1c8dc8c360b03697fb58329d03c4eb8106a8740ddf6c47a
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

このページでは、`openclaw secrets apply` によって適用される厳密な契約を定義します。ターゲットがこれらのルールに一致しない場合、apply はファイルを変更する前に失敗します。

## プランファイルの形式

`openclaw secrets apply --from <plan.json>` は、プランターゲットの `targets` 配列を想定します。

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

`openclaw secrets configure` はこの形式のプランを生成します。手動で作成または編集することもできます。

## プロバイダーの追加・更新と削除

プランには、ターゲットごとの書き込みとともに `secrets.providers` マップを変更する、次の2つの省略可能なトップレベルフィールドも含められます。

- `providerUpserts` -- プロバイダーエイリアスをキーとするオブジェクト。各値はプロバイダー定義です（`openclaw.json` の `secrets.providers.<alias>` で受け付けられるものと同じ形式。たとえば `exec` または `file` プロバイダー）。
- `providerDeletes` -- 削除するプロバイダーエイリアスの配列。

`providerUpserts` は `targets` より先に実行されるため、`target.ref.provider` は同じプランの `providerUpserts` で導入されるプロバイダーエイリアスを参照できます。この順序でない場合、`openclaw.json` にまだ設定されていないエイリアスを参照するプランは、`provider "<alias>" is not configured` というエラーで失敗します。

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

`providerUpserts` で導入される exec プロバイダーにも、[Exec プロバイダーの同意動作](#exec-provider-consent-behavior)にある exec の同意ルールが適用されます。exec プロバイダーを含むプランでは、書き込みモードで `--allow-exec` が必要です。

## サポート対象のターゲット範囲

プランターゲットは、[SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)に記載されたサポート対象の認証情報パスで受け付けられます。

## ターゲット型の動作

`target.type` は認識可能なターゲット型である必要があり、正規化された `target.path` はその型に登録されたパス形式と一致する必要があります。

一部のターゲット型では、既存のプラン向けに、正規の型名に加えて互換性エイリアスを `target.type` として受け付けます。

| 正規の型                             | 受け付けるエイリアス                            |
| ------------------------------------ | ----------------------------------------------- |
| `models.providers.apiKey`            | `models.providers.*.apiKey`                     |
| `skills.entries.apiKey`              | `skills.entries.*.apiKey`                       |
| `channels.googlechat.serviceAccount` | `channels.googlechat.accounts.*.serviceAccount` |

## パス検証ルール

各ターゲットは、次のすべての条件で検証されます。

- `type` は認識可能なターゲット型である必要があります。
- `path` は空でないドット区切りパスである必要があります。
- `pathSegments` は省略できます。指定する場合、正規化後のパスが `path` と完全に一致する必要があります。
- 禁止されているセグメント `__proto__`、`prototype`、`constructor` は拒否されます。
- 正規化されたパスは、ターゲット型に登録されたパス形式と一致する必要があります。
- `providerId` または `accountId` が設定されている場合、パスにエンコードされた ID と一致する必要があります。
- `auth-profiles.json` のターゲットには `agentId` が必要です。
- 新しい `auth-profiles.json` マッピングを作成する場合は、`authProfileProvider` を含めます。

## 失敗時の動作

ターゲットが検証に失敗した場合、apply は次のようなエラーを出して終了します。

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

無効なプランでは、書き込みは一切確定されません。ターゲットの解決とパスの検証は、ファイルに触れる前に実行されます。また、有効なプランが書き込みを開始すると、apply は最初に変更対象のすべてのファイルのスナップショットを作成し、同じ実行内の後続の書き込みが失敗した場合はそれらのスナップショットを復元します。そのため、部分的な書き込みによって設定、認証プロファイル、または環境変数の状態が不整合になることはありません。

## Exec プロバイダーの同意動作

- `--dry-run` は、デフォルトで exec SecretRef のチェックを省略します。
- exec SecretRef またはプロバイダーを含むプランは、`--allow-exec` が設定されていない限り、書き込みモードで拒否されます。
- exec を含むプランを検証または適用する場合は、ドライランと書き込みの両方のコマンドに `--allow-exec` を渡します。

## ランタイムと監査範囲に関する注意事項

- 参照のみの `auth-profiles.json` エントリ（`keyRef`/`tokenRef`）は、ランタイムの認証情報解決と監査の対象に含まれます。
- `secrets apply` は、サポート対象の `openclaw.json` ターゲットと `auth-profiles.json` ターゲットに書き込み、さらにデフォルトで有効な3つの省略可能なスクラブ処理を実行します。`scrubEnv`（移行済みの平文値を `.env` から削除）、`scrubAuthProfilesForProviderTargets`（プランで移行したプロバイダーについて、`auth-profiles.json` に残る平文または未使用の参照を消去）、`scrubLegacyAuthJson`（従来の `auth.json` ストアから移行済みの `api_key` エントリを削除）です。処理を省略するには、プラン内の `options.scrubEnv`、`options.scrubAuthProfilesForProviderTargets`、`options.scrubLegacyAuthJson` のいずれかを `false` に設定します。

## 運用者向け確認手順

```bash
# 書き込まずにプランを検証
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# 続いて実際に適用
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# exec を含むプランでは、両方のモードで明示的に許可
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

無効なターゲットパスを示すメッセージで apply が失敗した場合は、`openclaw secrets configure` でプランを再生成するか、ターゲットパスを上記のサポート対象形式に修正してください。

## 関連ドキュメント

- [シークレット管理](/ja-JP/gateway/secrets)
- [CLI `secrets`](/ja-JP/cli/secrets)
- [SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)
- [設定リファレンス](/ja-JP/gateway/configuration-reference)

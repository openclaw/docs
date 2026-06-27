---
read_when:
    - '`openclaw secrets apply` 計画の生成またはレビュー'
    - '`Invalid plan target path` エラーのデバッグ'
    - ターゲット種別とパス検証の動作を理解する
summary: '`secrets apply` 計画のコントラクト: ターゲット検証、パスマッチング、`auth-profiles.json` ターゲットスコープ'
title: シークレット適用計画のコントラクト
x-i18n:
    generated_at: "2026-06-27T11:34:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03f0ca9b433553a2f6d86d01b8c227a24b6f53ef7034a94bd648fbf04c81f13e
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

このページは、`openclaw secrets apply` によって強制される厳密な契約を定義します。

ターゲットがこれらのルールに一致しない場合、apply は設定を変更する前に失敗します。

## プランファイルの形式

`openclaw secrets apply --from <plan.json>` は、プランターゲットの `targets` 配列を期待します。

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

## プロバイダーの upsert と削除

プランには、ターゲットごとの書き込みと並行して `secrets.providers` マップを変更する、任意のトップレベルフィールドを 2 つ含めることもできます。

- `providerUpserts` — プロバイダー別名をキーにしたオブジェクトです。各値はプロバイダー定義です（`openclaw.json` の `secrets.providers.<alias>` で受け付けられるものと同じ形式。たとえば `exec` または `file` プロバイダー）。
- `providerDeletes` — 削除するプロバイダー別名の配列です。

`providerUpserts` は `targets` より前に実行されるため、`target.ref.provider` は同じプランが `providerUpserts` で導入するプロバイダー別名を参照できます。これがない場合、`openclaw.json` にまだ設定されていない別名を参照するプランは `provider "<alias>" is not
configured` で失敗します。

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

`providerUpserts` で導入された exec プロバイダーにも、[Exec プロバイダーの同意動作](#exec-provider-consent-behavior) の exec 同意ルールが適用されます。exec プロバイダーを含むプランでは、書き込みモードで `--allow-exec` が必要です。

## サポートされるターゲット範囲

プランターゲットは、次のサポート対象の認証情報パスで受け付けられます。

- [SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)

## ターゲットタイプの動作

一般ルール:

- `target.type` は認識される必要があり、正規化された `target.path` の形式と一致している必要があります。

既存のプラン向けに、互換性別名は引き続き受け付けられます。

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## パス検証ルール

各ターゲットは、次のすべてで検証されます。

- `type` は認識されるターゲットタイプである必要があります。
- `path` は空でないドットパスである必要があります。
- `pathSegments` は省略できます。指定する場合、`path` とまったく同じパスに正規化される必要があります。
- 禁止されたセグメントは拒否されます: `__proto__`、`prototype`、`constructor`。
- 正規化されたパスは、ターゲットタイプに登録されたパス形式と一致する必要があります。
- `providerId` または `accountId` が設定されている場合、パスにエンコードされた ID と一致する必要があります。
- `auth-profiles.json` ターゲットには `agentId` が必要です。
- 新しい `auth-profiles.json` マッピングを作成する場合は、`authProfileProvider` を含めます。

## 失敗時の動作

ターゲットが検証に失敗した場合、apply は次のようなエラーで終了します。

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

無効なプランでは書き込みはコミットされません。

## Exec プロバイダーの同意動作

- `--dry-run` は、デフォルトで exec SecretRef チェックをスキップします。
- exec SecretRef/プロバイダーを含むプランは、`--allow-exec` が設定されていない限り、書き込みモードで拒否されます。
- exec を含むプランを検証または適用する場合は、dry-run と書き込みコマンドの両方で `--allow-exec` を渡します。

## ランタイムと監査範囲の注記

- ref のみの `auth-profiles.json` エントリ（`keyRef`/`tokenRef`）は、ランタイム解決と監査対象に含まれます。
- `secrets apply` は、サポート対象の `openclaw.json` ターゲット、サポート対象の `auth-profiles.json` ターゲット、および任意のスクラブターゲットを書き込みます。

## オペレーターチェック

```bash
# Validate plan without writes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Then apply for real
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# For exec-containing plans, opt in explicitly in both modes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

apply が無効なターゲットパスのメッセージで失敗した場合は、`openclaw secrets configure` でプランを再生成するか、ターゲットパスを上記のサポート対象形式に修正してください。

## 関連ドキュメント

- [シークレット管理](/ja-JP/gateway/secrets)
- [CLI `secrets`](/ja-JP/cli/secrets)
- [SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)
- [設定リファレンス](/ja-JP/gateway/configuration-reference)

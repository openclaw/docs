---
read_when:
    - '`openclaw secrets apply` 計画の生成またはレビュー'
    - '`Invalid plan target path` エラーのデバッグ'
    - 対象タイプとパス検証の動作を理解する
summary: '`secrets apply` プランのコントラクト: ターゲット検証、パスマッチング、`auth-profiles.json` ターゲットスコープ'
title: Secrets 適用計画コントラクト
x-i18n:
    generated_at: "2026-07-05T11:25:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ddaf3df7f0be326fa1c8dc8c360b03697fb58329d03c4eb8106a8740ddf6c47a
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

このページは、`openclaw secrets apply` によって強制される厳密なコントラクトを定義します。ターゲットがこれらのルールに一致しない場合、apply はどのファイルも変更する前に失敗します。

## プランファイルの形状

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

`openclaw secrets configure` はこの形状でプランを生成します。手書きまたは編集することもできます。

## プロバイダーの upsert と削除

プランには、ターゲットごとの書き込みに加えて `secrets.providers` マップを変更する、2 つの任意のトップレベルフィールドを含めることもできます。

- `providerUpserts` -- プロバイダーエイリアスをキーにしたオブジェクトです。各値はプロバイダー定義です（`openclaw.json` の `secrets.providers.<alias>` で受け付けられるものと同じ形状。例: `exec` または `file` プロバイダー）。
- `providerDeletes` -- 削除するプロバイダーエイリアスの配列です。

`providerUpserts` は `targets` より前に実行されるため、`target.ref.provider` は同じプランが `providerUpserts` で導入するプロバイダーエイリアスを参照できます。この順序がない場合、`openclaw.json` でまだ構成されていないエイリアスを参照するプランは、`provider "<alias>" is not configured` で失敗します。

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

`providerUpserts` を通じて導入された exec プロバイダーにも、[exec プロバイダー同意動作](#exec-provider-consent-behavior) の exec 同意ルールが適用されます。exec プロバイダーを含むプランでは、書き込みモードで `--allow-exec` が必要です。

## サポートされるターゲットスコープ

プランターゲットは、[SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface) のサポートされる認証情報パスで受け付けられます。

## ターゲットタイプの動作

`target.type` は認識されるターゲットタイプである必要があり、正規化された `target.path` はそのタイプの登録済みパス形状と一致する必要があります。

一部のターゲットタイプは、正規タイプ名に加えて、既存プラン向けに `target.type` として互換エイリアスを受け付けます。

| 正規タイプ                         | 受け付けるエイリアス                          |
| ------------------------------------ | ----------------------------------------------- |
| `models.providers.apiKey`            | `models.providers.*.apiKey`                     |
| `skills.entries.apiKey`              | `skills.entries.*.apiKey`                       |
| `channels.googlechat.serviceAccount` | `channels.googlechat.accounts.*.serviceAccount` |

## パス検証ルール

各ターゲットは、以下のすべてで検証されます。

- `type` は認識されるターゲットタイプである必要があります。
- `path` は空でないドットパスである必要があります。
- `pathSegments` は省略できます。指定する場合、`path` と完全に同じパスに正規化される必要があります。
- 禁止されたセグメントは拒否されます: `__proto__`、`prototype`、`constructor`。
- 正規化されたパスは、ターゲットタイプの登録済みパス形状と一致する必要があります。
- `providerId` または `accountId` が設定されている場合、パスにエンコードされた ID と一致する必要があります。
- `auth-profiles.json` ターゲットには `agentId` が必要です。
- 新しい `auth-profiles.json` マッピングを作成する場合は、`authProfileProvider` を含めます。

## 失敗時の動作

ターゲットが検証に失敗すると、apply は次のようなエラーで終了します。

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

無効なプランでは書き込みはコミットされません。ターゲット解決とパス検証は、どのファイルにも触れる前に実行されます。別途、有効なプランが書き込みを開始すると、apply は最初に触れるすべてのファイルのスナップショットを作成し、同じ実行内の後続の書き込みが失敗した場合はそれらのスナップショットを復元します。そのため、部分的な書き込みによって config、auth-profile、env の状態が同期しなくなることはありません。

## exec プロバイダー同意動作

- `--dry-run` はデフォルトで exec SecretRef チェックをスキップします。
- exec SecretRef/プロバイダーを含むプランは、`--allow-exec` が設定されていない限り、書き込みモードで拒否されます。
- exec を含むプランを検証/適用する場合は、dry-run と書き込みコマンドの両方で `--allow-exec` を渡します。

## ランタイムと監査スコープの注記

- ref のみの `auth-profiles.json` エントリ（`keyRef`/`tokenRef`）は、ランタイム認証情報解決と監査範囲に含まれます。
- `secrets apply` は、サポートされる `openclaw.json` ターゲット、サポートされる `auth-profiles.json` ターゲット、および 3 つの任意のスクラブパスを書き込みます。各スクラブパスはデフォルトで有効です: `scrubEnv`（移行済みの平文値を `.env` から削除）、`scrubAuthProfilesForProviderTargets`（プランが移行したばかりのプロバイダーについて、`auth-profiles.json` 内の平文/未使用 ref の残留物をクリア）、`scrubLegacyAuthJson`（レガシー `auth.json` ストアから移行済みの `api_key` エントリを削除）。そのパスをスキップするには、プラン内で `options.scrubEnv`、`options.scrubAuthProfilesForProviderTargets`、`options.scrubLegacyAuthJson` のいずれかを `false` に設定します。

## オペレーター確認

```bash
# Validate plan without writes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Then apply for real
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# For exec-containing plans, opt in explicitly in both modes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

apply が無効なターゲットパスのメッセージで失敗する場合は、`openclaw secrets configure` でプランを再生成するか、ターゲットパスを上記のサポートされる形状に修正します。

## 関連ドキュメント

- [シークレット管理](/ja-JP/gateway/secrets)
- [CLI `secrets`](/ja-JP/cli/secrets)
- [SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)
- [構成リファレンス](/ja-JP/gateway/configuration-reference)

---
read_when:
    - ランタイムで SecretRef を再解決する場合
    - 平文の残留物や未解決の参照を監査する場合
    - SecretRef を設定し、一方向のスクラブ変更を適用する場合
summary: '`openclaw secrets` の CLI リファレンス（再読み込み、監査、設定、適用）'
title: シークレット
x-i18n:
    generated_at: "2026-04-24T04:51:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6fe1933ca6a9f2a24fbbe20fa3b83bf8f6493ea6c94061e135b4e1b48c33d62c
    source_path: cli/secrets.md
    workflow: 15
---

# `openclaw secrets`

`openclaw secrets` は SecretRef を管理し、アクティブなランタイムスナップショットを健全に保つために使用します。

コマンドの役割:

- `reload`: gateway RPC（`secrets.reload`）。参照を再解決し、完全成功時にのみランタイムスナップショットを切り替えます（config の書き込みなし）。
- `audit`: 設定/auth/生成済みモデルストアおよびレガシー残留物を読み取り専用でスキャンし、平文、未解決の参照、優先順位ドリフトを検出します（`--allow-exec` が設定されていない限り exec 参照はスキップされます）。
- `configure`: プロバイダー設定、ターゲットマッピング、事前チェック用の対話型プランナー（TTY 必須）。
- `apply`: 保存済みプランを実行します（検証のみには `--dry-run`。dry-run はデフォルトで exec チェックをスキップし、書き込みモードでは `--allow-exec` が設定されていない限り exec を含むプランを拒否します）。その後、対象の平文残留物をスクラブします。

推奨オペレーターループ:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

プランに `exec` SecretRef/プロバイダーが含まれている場合は、dry-run と書き込み apply コマンドの両方で `--allow-exec` を渡してください。

CI/ゲート向けの終了コードに関する注記:

- `audit --check` は検出事項があると `1` を返します。
- 未解決の参照は `2` を返します。

関連:

- シークレットガイド: [Secrets Management](/ja-JP/gateway/secrets)
- 認証情報サーフェス: [SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface)
- セキュリティガイド: [Security](/ja-JP/gateway/security)

## ランタイムスナップショットを再読み込みする

シークレット参照を再解決し、ランタイムスナップショットをアトミックに切り替えます。

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

注:

- gateway RPC メソッド `secrets.reload` を使用します。
- 解決に失敗した場合、gateway は最後に正常だったスナップショットを保持し、エラーを返します（部分的な有効化は行いません）。
- JSON レスポンスには `warningCount` が含まれます。

オプション:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--json`

## 監査

OpenClaw 状態をスキャンして次を検出します。

- 平文のシークレット保存
- 未解決の参照
- 優先順位ドリフト（`auth-profiles.json` の認証情報が `openclaw.json` の参照をシャドーイングしている状態）
- 生成済み `agents/*/agent/models.json` の残留物（プロバイダーの `apiKey` 値および機密性のあるプロバイダーヘッダー）
- レガシー残留物（レガシー auth ストアエントリ、OAuth リマインダー）

ヘッダー残留物に関する注記:

- 機密性のあるプロバイダーヘッダー検出は、名前ヒューリスティックに基づいています（一般的な auth/credential ヘッダー名と、`authorization`、`x-api-key`、`token`、`secret`、`password`、`credential` などの断片）。

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

終了動作:

- `--check` は検出事項があると非ゼロで終了します。
- 未解決の参照は、より優先度の高い非ゼロコードで終了します。

レポート形状の主な項目:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- 検出コード:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## 設定する（対話型ヘルパー）

プロバイダーと SecretRef の変更を対話的に構築し、事前チェックを実行し、必要に応じて適用します。

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

フロー:

- 最初にプロバイダー設定（`secrets.providers` エイリアスの `add/edit/remove`）。
- 次に認証情報マッピング（フィールドを選択して `{source, provider, id}` 参照を割り当て）。
- 最後に事前チェックと任意の適用。

フラグ:

- `--providers-only`: `secrets.providers` のみ設定し、認証情報マッピングをスキップします。
- `--skip-provider-setup`: プロバイダー設定をスキップし、既存のプロバイダーへ認証情報をマッピングします。
- `--agent <id>`: `auth-profiles.json` のターゲット検出と書き込みを 1 つのエージェントストアに限定します。
- `--allow-exec`: 事前チェック/適用時の exec SecretRef チェックを許可します（プロバイダーコマンドを実行する場合があります）。

注:

- 対話型 TTY が必要です。
- `--providers-only` と `--skip-provider-setup` は組み合わせできません。
- `configure` は `openclaw.json` 内のシークレットを保持するフィールドと、選択したエージェントスコープの `auth-profiles.json` を対象にします。
- `configure` は picker フロー内で新しい `auth-profiles.json` マッピングの直接作成をサポートします。
- 正式にサポートされるサーフェス: [SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface)。
- 適用前に事前解決を実行します。
- 事前チェック/適用に exec 参照が含まれる場合は、両方のステップで `--allow-exec` を設定したままにしてください。
- 生成されたプランでは、デフォルトでスクラブオプション（`scrubEnv`、`scrubAuthProfilesForProviderTargets`、`scrubLegacyAuthJson` がすべて有効）が使われます。
- 適用パスは、スクラブされた平文値に対して一方向です。
- `--apply` がない場合でも、事前チェック後に `Apply this plan now?` が CLI で確認されます。
- `--apply` があり（かつ `--yes` がない）場合、CLI は追加の不可逆確認を求めます。
- `--json` はプラン + 事前チェックレポートを出力しますが、このコマンドには引き続き対話型 TTY が必要です。

exec プロバイダー安全性に関する注記:

- Homebrew インストールでは、しばしば `/opt/homebrew/bin/*` 配下にシンボリックリンクされたバイナリが公開されます。
- `allowSymlinkCommand: true` は、信頼されたパッケージマネージャーパスで必要な場合にのみ設定し、`trustedDirs`（例: `["/opt/homebrew"]`）と組み合わせてください。
- Windows では、プロバイダーパスの ACL 検証が利用できない場合、OpenClaw は closed で失敗します。信頼できるパスに限り、そのプロバイダーで `allowInsecurePath: true` を設定するとパスセキュリティチェックをバイパスできます。

## 保存済みプランを適用する

以前に生成したプランを適用または事前チェックします。

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

exec 動作:

- `--dry-run` はファイルを書き込まずに事前チェックを検証します。
- dry-run では、exec SecretRef チェックはデフォルトでスキップされます。
- 書き込みモードでは、`--allow-exec` が設定されていない限り、exec SecretRef/プロバイダーを含むプランを拒否します。
- どちらのモードでも、exec プロバイダーチェック/実行に明示的に同意するには `--allow-exec` を使用してください。

プラン契約の詳細（許可されるターゲットパス、検証ルール、失敗セマンティクス）:

- [Secrets Apply Plan Contract](/ja-JP/gateway/secrets-plan-contract)

`apply` が更新する可能性があるもの:

- `openclaw.json`（SecretRef ターゲット + プロバイダー upsert/delete）
- `auth-profiles.json`（プロバイダーターゲットのスクラブ）
- レガシー `auth.json` の残留物
- 値が移行された `~/.openclaw/.env` の既知のシークレットキー

## ロールバックバックアップがない理由

`secrets apply` は、古い平文値を含むロールバックバックアップを意図的に書き込みません。

安全性は、厳格な事前チェック + 障害時の best-effort なインメモリ復元を伴う、ほぼアトミックな適用によって確保されます。

## 例

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

`audit --check` がまだ平文の検出事項を報告する場合は、報告された残りのターゲットパスを更新し、再度監査を実行してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [シークレット管理](/ja-JP/gateway/secrets)

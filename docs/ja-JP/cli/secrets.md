---
read_when:
    - 実行時にシークレット参照を再解決する
    - 平文の残存箇所と未解決の参照を監査しています
    - SecretRefs の設定と一方向のスクラブ変更の適用
summary: '`openclaw secrets` の CLI リファレンス（再読み込み、監査、設定、適用）'
title: シークレット
x-i18n:
    generated_at: "2026-07-11T22:03:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1ac0d0f6e29ae52d9dd03e3333665062ccd961ed22a2b06ca7fa7fde128e177
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

SecretRef を管理し、アクティブなランタイムスナップショットを正常な状態に保ちます。

| コマンド    | 役割                                                                                                                                                                                                                   |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | Gateway RPC（`secrets.reload`）：参照を再解決し、すべて成功した場合にのみランタイムスナップショットを入れ替えます（設定への書き込みは行いません）                                                                        |
| `audit`     | 設定、認証、生成済みモデルの各ストアとレガシー残存データを読み取り専用でスキャンし、平文、未解決の参照、優先順位のずれを検出します（`--allow-exec` を指定しない限り、exec 参照はスキップされます）                          |
| `configure` | プロバイダーのセットアップ、ターゲットのマッピング、事前検証を行う対話型プランナーです（TTY が必要です）                                                                                                                |
| `apply`     | 保存済みプランを実行し（`--dry-run` は検証のみを行い、デフォルトでは exec チェックをスキップします。書き込みモードでは、`--allow-exec` を指定しない限り exec を含むプランを拒否します）、対象の平文残存データを消去します |

推奨される運用手順：

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

プランに `exec` SecretRef またはプロバイダーが含まれる場合は、ドライランと書き込みの両方の `apply` コマンドに `--allow-exec` を指定してください。

CI／ゲート用の終了コード：

- `audit --check` は検出事項がある場合に `1` を返します。
- 未解決の参照がある場合は、`--check` の有無にかかわらず `2` を返します。

関連項目：[シークレット管理](/ja-JP/gateway/secrets) · [SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface) · [セキュリティ](/ja-JP/gateway/security)

## ランタイムスナップショットの再読み込み

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Gateway RPC メソッド `secrets.reload` を使用します。解決に失敗した場合、Gateway は最後に正常だったスナップショットを維持してエラーを返します（部分的な有効化は行いません）。JSON レスポンスには `warningCount` が含まれます。

オプション：`--url <url>`、`--token <token>`、`--timeout <ms>`、`--json`。

## 監査

OpenClaw の状態をスキャンし、以下を検出します：

- シークレットの平文保存
- 未解決の参照
- 優先順位のずれ（`auth-profiles.json` の認証情報が `openclaw.json` の参照を隠している状態）
- 生成済みの `agents/*/agent/models.json` に残存するデータ（プロバイダーの `apiKey` 値と機密性の高いプロバイダーヘッダー）
- レガシー残存データ（レガシー認証ストアのエントリ、OAuth のリマインダー）

機密性の高いプロバイダーヘッダーの検出は、名前に基づくヒューリスティックを使用します。一般的な認証／認証情報の断片（`authorization`、`x-api-key`、`token`、`secret`、`password`、`credential`）に名前が一致するヘッダーを検出します。

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

レポートの形式：

- `status`：`clean | findings | unresolved`
- `resolution`：`refsChecked`、`skippedExecRefs`、`resolvabilityComplete`
- `summary`：`plaintextCount`、`unresolvedRefCount`、`shadowedRefCount`、`legacyResidueCount`
- 検出コード：`PLAINTEXT_FOUND`、`REF_UNRESOLVED`、`REF_SHADOWED`、`LEGACY_RESIDUE`

## 設定（対話型ヘルパー）

プロバイダーと SecretRef の変更を対話形式で構築し、事前検証を実行して、必要に応じて適用します：

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

フロー：最初にプロバイダーをセットアップし（`secrets.providers` のエイリアスを追加、編集、削除）、次に認証情報をマッピングし（フィールドを選択し、`{source, provider, id}` 参照を割り当て）、その後、事前検証と任意の適用を行います。

フラグ：

- `--providers-only`：`secrets.providers` のみを設定し、認証情報のマッピングをスキップします
- `--skip-provider-setup`：プロバイダーのセットアップをスキップし、認証情報を既存のプロバイダーにマッピングします
- `--agent <id>`：`auth-profiles.json` のターゲット検出と書き込みの範囲を、1 つのエージェントストアに限定します
- `--allow-exec`：事前検証／適用時の exec SecretRef チェックを許可します（プロバイダーのコマンドが実行される場合があります）

`--providers-only` と `--skip-provider-setup` は併用できません。

注：

- 対話型 TTY が必要です。
- `openclaw.json` 内のシークレットを含むフィールドと、選択したエージェント範囲の `auth-profiles.json` を対象とします。正規にサポートされるサーフェス：[SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)。
- 選択フロー内で、新しい `auth-profiles.json` マッピングを直接作成できます。
- 適用前に事前解決を実行します。
- 生成されるプランでは、消去オプション（`scrubEnv`、`scrubAuthProfilesForProviderTargets`、`scrubLegacyAuthJson`）がデフォルトで有効です。消去された平文値に対する適用操作は元に戻せません。
- `--apply` を指定しない場合でも、事前検証後に CLI が `Apply this plan now?` と確認します。
- `--apply` を指定し、`--yes` を指定しない場合、CLI は取り消し不能な移行について追加の確認を求めます。
- `--json` はプランと事前検証レポートを出力しますが、対話型 TTY は引き続き必要です。

### exec プロバイダーの安全性

Homebrew のインストールでは、`/opt/homebrew/bin/*` 以下にシンボリックリンクされたバイナリが公開されることがよくあります。信頼できるパッケージマネージャーのパスで必要な場合にのみ `allowSymlinkCommand: true` を設定し、`trustedDirs`（例：`["/opt/homebrew"]`）と併用してください。Windows では、プロバイダーのパスに対して ACL 検証を利用できない場合、OpenClaw は安全側に倒して処理を拒否します。信頼できるパスに限り、そのプロバイダーに `allowInsecurePath: true` を設定すると、パスのセキュリティチェックを迂回できます。

## 保存済みプランの適用

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` はファイルに書き込まずに事前検証を行います。ドライランでは、exec SecretRef チェックはデフォルトでスキップされます。書き込みモードでは、`--allow-exec` を指定しない限り、exec SecretRef またはプロバイダーを含むプランを拒否します。どちらのモードでも、exec プロバイダーのチェック／実行を明示的に許可するには `--allow-exec` を使用します。

`apply` が更新する可能性があるもの：

- `openclaw.json`（SecretRef ターゲットとプロバイダーの追加／更新／削除）
- `auth-profiles.json`（プロバイダーターゲットの消去）
- レガシーな `auth.json` の残存データ
- 値が移行された `~/.openclaw/.env` 内の既知のシークレットキー

プランの契約に関する詳細（許可されるターゲットパス、検証ルール、失敗時のセマンティクス）：[シークレット適用プランの契約](/ja-JP/gateway/secrets-plan-contract)。

### ロールバック用バックアップを作成しない理由

`secrets apply` は、古い平文値を含むロールバック用バックアップを意図的に書き込みません。安全性は、厳格な事前検証と準アトミックな適用に加え、失敗時にメモリ内でベストエフォートの復元を行うことで確保されます。

## 例

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

`audit --check` が引き続き平文の検出事項を報告する場合は、報告された残りのターゲットパスを更新し、監査を再実行してください。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [シークレット管理](/ja-JP/gateway/secrets)
- [Vault SecretRef](/plugins/vault)

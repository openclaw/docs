---
read_when:
    - 実行時にシークレット参照を再解決する
    - 平文の残存物と未解決の参照を監査する
    - SecretRefs を構成し、一方向のスクラブ変更を適用する
summary: '`openclaw secrets` の CLI リファレンス（reload、audit、configure、apply）'
title: シークレット
x-i18n:
    generated_at: "2026-07-05T11:13:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba89e153f8875017860cdf0d9af5cbfba0d1632968f5c408196b2403f20d719c
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

SecretRef を管理し、アクティブなランタイムスナップショットを健全に保ちます。

| コマンド    | 役割                                                                                                                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | Gateway RPC (`secrets.reload`): 参照を再解決し、完全に成功した場合にのみランタイムスナップショットを差し替えます（設定への書き込みなし）                                                     |
| `audit`     | 設定/auth/生成済みモデルストアとレガシー残存データを、平文、未解決の参照、優先順位のずれについて読み取り専用でスキャンします（`--allow-exec` がない限り exec 参照はスキップ）                |
| `configure` | プロバイダー設定、ターゲットマッピング、プリフライトのための対話型プランナーです（TTY が必要）                                                                                              |
| `apply`     | 保存済みプランを実行し（`--dry-run` は検証のみ行い、デフォルトで exec チェックをスキップします。書き込みモードは `--allow-exec` がない限り exec を含むプランを拒否します）、対象の平文残存データを消去します |

推奨されるオペレーターループ:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

プランに `exec` SecretRef/プロバイダーが含まれる場合は、ドライランと書き込みの両方の `apply` コマンドに `--allow-exec` を渡してください。

CI/ゲート向けの終了コード:

- `audit --check` は検出事項がある場合に `1` を返します。
- 未解決の参照は（`--check` に関係なく）`2` を返します。

関連: [シークレット管理](/ja-JP/gateway/secrets) · [SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface) · [セキュリティ](/ja-JP/gateway/security)

## ランタイムスナップショットの再読み込み

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Gateway RPC メソッド `secrets.reload` を使用します。解決に失敗した場合、Gateway は最後に正常だったスナップショットを保持し、エラーを返します（一部だけの有効化は行いません）。JSON レスポンスには `warningCount` が含まれます。

オプション: `--url <url>`, `--token <token>`, `--timeout <ms>`, `--json`.

## 監査

OpenClaw の状態について次をスキャンします:

- 平文のシークレット保存
- 未解決の参照
- 優先順位のずれ（`openclaw.json` の参照を覆い隠す `auth-profiles.json` の認証情報）
- 生成済みの `agents/*/agent/models.json` 残存データ（プロバイダーの `apiKey` 値と機密性の高いプロバイダーヘッダー）
- レガシー残存データ（レガシー auth ストアエントリ、OAuth リマインダー）

機密性の高いプロバイダーヘッダーの検出は名前のヒューリスティックに基づきます。一般的な auth/認証情報の断片（`authorization`, `x-api-key`, `token`, `secret`, `password`, `credential`）に名前が一致するヘッダーをフラグします。

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

レポートの形:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- 検出コード: `PLAINTEXT_FOUND`, `REF_UNRESOLVED`, `REF_SHADOWED`, `LEGACY_RESIDUE`

## Configure（対話型ヘルパー）

プロバイダーと SecretRef の変更を対話的に構築し、プリフライトを実行し、任意で適用します:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

フロー: まずプロバイダー設定（`secrets.providers` エイリアスの追加/編集/削除）、次に認証情報マッピング（フィールドの選択、`{source, provider, id}` 参照の割り当て）、その後プリフライトと任意の適用を行います。

フラグ:

- `--providers-only`: `secrets.providers` のみを設定し、認証情報マッピングをスキップします
- `--skip-provider-setup`: プロバイダー設定をスキップし、認証情報を既存プロバイダーにマッピングします
- `--agent <id>`: `auth-profiles.json` のターゲット検出と書き込みを 1 つのエージェントストアにスコープします
- `--allow-exec`: プリフライト/適用中の exec SecretRef チェックを許可します（プロバイダーコマンドを実行する可能性があります）

`--providers-only` と `--skip-provider-setup` は組み合わせられません。

注記:

- 対話型 TTY が必要です。
- 選択されたエージェントスコープについて、`openclaw.json` と `auth-profiles.json` 内のシークレットを含むフィールドを対象にします。正規にサポートされるサーフェス: [SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)。
- ピッカーフロー内で新しい `auth-profiles.json` マッピングを直接作成できます。
- 適用前にプリフライト解決を実行します。
- 生成されるプランでは、消去オプションがデフォルトで有効です（`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`）。消去された平文値について、適用は一方向です。
- `--apply` がない場合でも、CLI はプリフライト後に `Apply this plan now?` と確認します。
- `--apply` がある場合（かつ `--yes` がない場合）、CLI は追加で不可逆な移行の確認を求めます。
- `--json` はプランとプリフライトレポートを出力しますが、それでも対話型 TTY が必要です。

### Exec プロバイダーの安全性

Homebrew インストールでは、多くの場合 `/opt/homebrew/bin/*` の下にシンボリックリンクされたバイナリが公開されます。信頼済みのパッケージマネージャーパスで必要な場合にのみ、`trustedDirs`（例: `["/opt/homebrew"]`）と組み合わせて `allowSymlinkCommand: true` を設定してください。Windows では、プロバイダーパスの ACL 検証を利用できない場合、OpenClaw はフェイルクローズします。信頼済みパスに限り、そのプロバイダーで `allowInsecurePath: true` を設定してパスのセキュリティチェックをバイパスできます。

## 保存済みプランを適用する

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` はファイルを書き込まずにプリフライトを検証します。ドライランでは、exec SecretRef チェックはデフォルトでスキップされます。書き込みモードは、`--allow-exec` がない限り exec SecretRef/プロバイダーを含むプランを拒否します。どちらのモードでも exec プロバイダーチェック/実行を明示的に有効にするには、`--allow-exec` を使用します。

`apply` が更新する可能性があるもの:

- `openclaw.json`（SecretRef ターゲット + プロバイダーの upsert/削除）
- `auth-profiles.json`（プロバイダーターゲットの消去）
- レガシー `auth.json` 残存データ
- 移行された値を持つ `~/.openclaw/.env` の既知のシークレットキー

プラン契約の詳細（許可されるターゲットパス、検証ルール、失敗時のセマンティクス）: [Secrets Apply Plan Contract](/ja-JP/gateway/secrets-plan-contract)。

### ロールバックバックアップがない理由

`secrets apply` は、古い平文値を含むロールバックバックアップを意図的に書き込みません。安全性は、厳密なプリフライトと概ねアトミックな適用、失敗時のベストエフォートなメモリ内復元によって確保されます。

## 例

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

`audit --check` がまだ平文の検出事項を報告する場合は、残りの報告されたターゲットパスを更新し、監査を再実行してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [シークレット管理](/ja-JP/gateway/secrets)

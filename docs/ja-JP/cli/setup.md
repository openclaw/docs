---
read_when:
    - CLI オンボーディングウィザードで初回セットアップを行っている
    - デフォルトのワークスペースパスを設定したい
    - スクリプトにはベースラインのみのセットアップフラグが必要です
summary: '`openclaw setup` の CLI リファレンス（オンボーディングのエイリアス。フラグでベースラインセットアップを利用可能）'
title: セットアップ
x-i18n:
    generated_at: "2026-07-05T11:14:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d99baef64a6fc6a1227c820866340fe5fd66b3cabd3ef5e9c34268272191021
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` は `openclaw onboard` と同じガイド付きオンボーディングフロー
（認証、ワークスペース、Gateway、チャンネル、スキル、ヘルスチェック）を実行します。ウィザードを使わずに
config/workspace フォルダーだけを初期化する必要がある場合は `--baseline` を使用します。

`setup` は `openclaw onboard` と同じオンボーディングフラグを受け付けます。これには
認証（`--auth-choice`、`--token`、プロバイダーキー用フラグ）、Gateway
（`--gateway-port`、`--gateway-bind`、`--gateway-auth`、`--install-daemon`）、
Tailscale（`--tailscale`）、リセット（`--reset`、`--reset-scope`）、フロー
（`--flow quickstart|advanced|manual|import`）、およびスキップフラグ
（`--skip-channels`、`--skip-skills`、`--skip-bootstrap`、`--skip-search`、
`--skip-health`、`--skip-ui`、`--skip-hooks`）が含まれます。完全なフラグリファレンスと
非対話型の例については、[オンボーディング](/ja-JP/cli/onboard) と
[CLI 自動化](/ja-JP/start/wizard-cli-automation) を参照してください。`openclaw onboard --modern`（Crestodian
会話型アシスタント）に相当する `setup` はありません。

<Note>
`openclaw setup` は変更可能な config インストール向けです。Nix mode（`OPENCLAW_NIX_MODE=1`）では、config ファイルが Nix によって管理されるため、OpenClaw は setup による書き込みを拒否します。ファーストパーティの [nix-openclaw クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)、または別の Nix パッケージ向けの同等のソース config を使用してください。
</Note>

## オプション

| フラグ                       | 説明                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | エージェントのワークスペースディレクトリ（デフォルト `~/.openclaw/workspace`、`agents.defaults.workspace` として保存）。 |
| `--baseline`               | オンボーディングなしで、ベースラインの config/workspace/session フォルダーを作成します。                                |
| `--wizard`                 | 互換性のために受け付けられます。setup はデフォルトでオンボーディングを実行します。                                       |
| `--non-interactive`        | プロンプトなしでオンボーディングを実行します。                                                                     |
| `--accept-risk`            | フルシステムのエージェントアクセスリスクを了承します。`--non-interactive` と併用する場合は必須です。                       |
| `--mode <mode>`            | オンボーディングモード: `local` または `remote`。                                                               |
| `--flow <flow>`            | オンボーディングフロー: `quickstart`、`advanced`、`manual`、または `import`。                                      |
| `--reset`                  | オンボーディング前に config + 認証情報 + セッションをリセットします（ワークスペースは `--reset-scope full` の場合のみ）。 |
| `--reset-scope <scope>`    | リセット範囲: `config`、`config+creds+sessions`、または `full`。                                          |
| `--import-from <provider>` | オンボーディング中に実行する移行プロバイダー。                                                        |
| `--import-source <path>`   | `--import-from` のソースエージェントホーム。                                                              |
| `--import-secrets`         | オンボーディング移行中にサポート対象のシークレットをインポートします。                                               |
| `--remote-url <url>`       | リモート Gateway WebSocket URL。                                                                       |
| `--remote-token <token>`   | リモート Gateway トークン（任意）。                                                                    |
| `--json`                   | JSON サマリーを出力します。                                                                              |

### ベースラインモード

`openclaw setup --baseline` は以前のベースラインのみの動作を保持します。
config、workspace、session ディレクトリを作成し、その後オンボーディングを
実行せずに終了します。

## 例

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 注意

- ベースライン setup の後、完全なガイド付きジャーニーには `openclaw setup` または `openclaw onboard` を実行し、対象を絞った変更には `openclaw configure` を実行し、チャンネルアカウントを追加するには `openclaw channels add` を実行します。
- Hermes の状態が検出された場合、対話型オンボーディングは自動的に移行を提案できます。インポートオンボーディングには新規 setup が必要です。オンボーディング外でのドライラン計画、バックアップ、上書きモードには [移行](/ja-JP/cli/migrate) を使用してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [オンボーディング](/ja-JP/cli/onboard)
- [オンボーディング（CLI）](/ja-JP/start/wizard)
- [はじめに](/ja-JP/start/getting-started)
- [インストール概要](/ja-JP/install)

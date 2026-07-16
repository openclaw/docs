---
read_when:
    - セットアップや修復について OpenClaw とチャットしたい場合
    - オンボーディングウィザードを使用して初回セットアップを行っています
    - デフォルトのワークスペースパスを設定する場合
    - スクリプトにはベースラインのみのセットアップフラグが必要です
summary: '`openclaw setup` の CLI リファレンス（オンボーディングへのフォールバックを備えたシステムエージェントチャット）'
title: セットアップ
x-i18n:
    generated_at: "2026-07-16T11:38:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3395dbfe94c2f9686757fff85db709f0a9ed0ac9579e8e3c80ee1d51038f8e18
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` はシステムエージェントのエントリーポイントです。設定済みのシステムでは、引数なしの
`openclaw setup` で対話型の OpenClaw チャットが開きます。新規システムでは、
ガイド付きオンボーディングに移行します。1 回のリクエストには `-m`/`--message` を使用し、
ウィザードを使わずに設定/ワークスペースフォルダーを初期化するには `--baseline` を使用します。

ルーティング順序:

1. オンボーディングのオプション（`--wizard`、`--baseline`、ワークスペース、リセット、
   非対話型、フロー、モード、Gateway、デーモン、スキップ、インポート、リモート、または認証
   オプション）を指定すると、`openclaw onboard` とまったく同じようにオンボーディングが実行されます。
2. `-m`/`--message` または `--yes` を指定すると、システムエージェントが実行されます。
3. ルーティングオプションを指定しない場合、設定済みの対話型システムでは OpenClaw が開きます。
   新規システムではオンボーディングが実行されます。設定済みのシステムでは、TTY がなくても `--json` によって
   システム概要が出力されます。オンボーディングオプションを指定した場合は、オンボーディングの
   JSON サマリーが維持されます。

ガイド付きモードでは、`--workspace <dir>` が OpenClaw に提案されるワークスペースです。
その提案を承認した後にのみ永続化されます。ベースライン、クラシック、および
非対話型セットアップでは、それぞれの通常のフローを通じて指定されたワークスペースが永続化されます。

ガイド付き推論検出は、macOS または Linux 上の Gateway ホストで実行されます。CLI
と macOS アプリは、同じ Gateway 管理の検出機能を呼び出します。この機能は、設定済みの
モデル、対応している CLI ログイン、API キー環境変数、およびインストール済みの
Ollama または LM Studio モデルを確認します。この自動処理でローカルモデルが
ダウンロードされることはありません。選択された候補は、プロバイダーとモデルの設定が
保存される前に、実際の補完リクエストに応答する必要があります。

`setup` は、認証（`--auth-choice`、`--token`、プロバイダーキーのフラグ）、
Gateway（`--gateway-port`、`--gateway-bind`、`--gateway-auth`、`--install-daemon`）、
Tailscale（`--tailscale`）、リセット（`--reset`、`--reset-scope`）、フロー
（`--flow quickstart|advanced|manual|import`）、およびスキップフラグ
（`--skip-channels`、`--skip-skills`、`--skip-bootstrap`、`--skip-search`、
`--skip-health`、`--skip-ui`、`--skip-hooks`）を含め、`openclaw onboard` と同じオンボーディングフラグを受け付けます。
フラグの完全なリファレンスと非対話型の例については、[オンボード](/ja-JP/cli/onboard)および
[CLI の自動化](/ja-JP/start/wizard-cli-automation)を参照してください。`openclaw onboard --modern` は、同じ推論ゲート付き
OpenClaw アシスタント用の互換性エントリとして引き続き使用できます。

<Note>
`openclaw setup` は、変更可能な設定を使用するインストール向けです。Nix モード（`OPENCLAW_NIX_MODE=1`）では設定ファイルが Nix によって管理されているため、OpenClaw はセットアップによる書き込みを拒否します。ファーストパーティの [nix-openclaw クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)、または別の Nix パッケージ向けの同等のソース設定を使用してください。
</Note>

## オプション

| フラグ                       | 説明                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `-m, --message <text>`     | OpenClaw リクエストを 1 回実行します。                                                                             |
| `--yes`                    | 1 回の `--message` リクエストで、永続的な設定の書き込みを承認します。                                         |
| `--workspace <dir>`        | ガイド付きモードでのワークスペースの提案。ベースライン、クラシック、および非対話型セットアップでは直接永続化されます。 |
| `--baseline`               | オンボーディングを行わずに、ベースラインの設定/ワークスペース/セッションフォルダーを作成します。                                  |
| `--wizard`                 | 対話型オンボーディングを強制します。                                                                         |
| `--non-interactive`        | プロンプトなしでオンボーディングを実行します。                                                                       |
| `--accept-risk`            | システム全体へのエージェントアクセスのリスクを承認します。`--non-interactive` と併用する場合に必須です。                         |
| `--mode <mode>`            | オンボーディングモード: `local` または `remote`。                                                                 |
| `--flow <flow>`            | オンボーディングフロー: `quickstart`、`advanced`、`manual`、または `import`。                                        |
| `--reset`                  | オンボーディングの前に設定、認証情報、およびセッションをリセットします（ワークスペースは `--reset-scope full` の場合のみ）。   |
| `--reset-scope <scope>`    | リセット範囲: `config`、`config+creds+sessions`、または `full`。                                            |
| `--import-from <provider>` | オンボーディング中に実行する移行プロバイダー。                                                          |
| `--import-source <path>`   | `--import-from` のソースエージェントホーム。                                                                |
| `--import-secrets`         | オンボーディング移行中に対応しているシークレットをインポートします。                                                 |
| `--remote-url <url>`       | リモート Gateway WebSocket URL。                                                                         |
| `--remote-token <token>`   | リモート Gateway トークン（任意）。                                                                      |
| `--json`                   | 設定済みのシステム: OpenClaw の概要。オンボーディングルート: オンボーディングのサマリー。                           |

`--classic` と `--non-interactive` は相互排他的です。クラシックでは
プロンプト付きウィザードが開き、非対話型セットアップでは自動化パスが使用されます。

### ベースラインモード

`openclaw setup --baseline` は、従来のベースライン専用の動作を維持します。
設定、ワークスペース、およびセッションのディレクトリを作成し、
オンボーディングを実行せずに終了します。

## 例

```bash
openclaw setup
openclaw setup -m "status"
openclaw setup -m "restart gateway" --yes
openclaw setup --json
openclaw setup --wizard
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 注記

- ベースラインセットアップ後、完全なガイド付き手順には `openclaw onboard`、対象を絞った変更には `openclaw configure`、チャンネルアカウントの追加には `openclaw channels add` を実行します。
- Hermes の状態が検出された場合、対話型オンボーディングで移行が自動的に提案されることがあります。インポートオンボーディングには新規セットアップが必要です。オンボーディング外でドライラン計画、バックアップ、および上書きモードを使用するには、[移行](/ja-JP/cli/migrate)を使用してください。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [オンボード](/ja-JP/cli/onboard)
- [オンボーディング（CLI）](/ja-JP/start/wizard)
- [はじめに](/ja-JP/start/getting-started)
- [インストールの概要](/ja-JP/install)

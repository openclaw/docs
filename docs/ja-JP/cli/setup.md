---
read_when:
    - CLI オンボーディングウィザードを使用して初回セットアップを行っています
    - デフォルトのワークスペースパスを設定したい場合
    - スクリプトにはベースラインのみのセットアップフラグが必要です
summary: '`openclaw setup` の CLI リファレンス（オンボーディングのエイリアス。フラグで基本セットアップを利用可能）'
title: セットアップ
x-i18n:
    generated_at: "2026-07-11T22:04:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe3c631a2ed7328ab7e7d1438adff2d6112514b3fdcfb82923ba6ea04650c385
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` は `openclaw onboard` と同じガイド付きオンボーディングフローを実行します。
最初に推論設定を検証して永続化し、次に Crestodian を起動して
ワークスペース、Gateway、チャンネル、Skills、健全性を設定します。ウィザードを使用せず、
設定／ワークスペースフォルダーの初期化のみが必要な場合は `--baseline` を使用します。

ガイド付きモードでは、`--workspace <dir>` は Crestodian に提案されるワークスペースです。
その提案を承認した後にのみ永続化されます。ベースライン、クラシック、および
非対話型セットアップでは、指定されたワークスペースが通常のフローを通じて永続化されます。

`setup` は、認証（`--auth-choice`、`--token`、プロバイダーキーフラグ）、Gateway
（`--gateway-port`、`--gateway-bind`、`--gateway-auth`、`--install-daemon`）、
Tailscale（`--tailscale`）、リセット（`--reset`、`--reset-scope`）、フロー
（`--flow quickstart|advanced|manual|import`）、スキップフラグ
（`--skip-channels`、`--skip-skills`、`--skip-bootstrap`、`--skip-search`、
`--skip-health`、`--skip-ui`、`--skip-hooks`）など、`openclaw onboard` と同じ
オンボーディングフラグを受け付けます。フラグの完全なリファレンスと
非対話型の例については、[オンボーディング](/ja-JP/cli/onboard)および
[CLI 自動化](/ja-JP/start/wizard-cli-automation)を参照してください。
`openclaw onboard --modern` は、推論設定によって制御される Crestodian アシスタントの
互換性エイリアスであり、`setup` に相当するものはありません。

<Note>
`openclaw setup` は、変更可能な設定を使用するインストール向けです。Nix モード（`OPENCLAW_NIX_MODE=1`）では、設定ファイルが Nix によって管理されているため、OpenClaw はセットアップによる書き込みを拒否します。公式の [nix-openclaw クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)、または別の Nix パッケージ向けの同等のソース設定を使用してください。
</Note>

## オプション

| フラグ                     | 説明                                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | ガイド付きモードでのワークスペース候補。ベースライン、クラシック、非対話型セットアップでは直接永続化されます。 |
| `--baseline`               | オンボーディングを実行せずに、基本設定／ワークスペース／セッションフォルダーを作成します。                     |
| `--wizard`                 | 互換性のために受け付けられます。セットアップはデフォルトでオンボーディングを実行します。                       |
| `--non-interactive`        | プロンプトなしでオンボーディングを実行します。                                                               |
| `--accept-risk`            | システム全体へのエージェントアクセスのリスクを了承します。`--non-interactive` とともに指定する必要があります。 |
| `--mode <mode>`            | オンボーディングモード：`local` または `remote`。                                                            |
| `--flow <flow>`            | オンボーディングフロー：`quickstart`、`advanced`、`manual`、または `import`。                                |
| `--reset`                  | オンボーディング前に設定、認証情報、セッションをリセットします（ワークスペースは `--reset-scope full` の場合のみ）。 |
| `--reset-scope <scope>`    | リセット範囲：`config`、`config+creds+sessions`、または `full`。                                            |
| `--import-from <provider>` | オンボーディング中に実行する移行元プロバイダー。                                                              |
| `--import-source <path>`   | `--import-from` で使用する移行元エージェントのホームディレクトリ。                                           |
| `--import-secrets`         | オンボーディング移行中に対応しているシークレットをインポートします。                                         |
| `--remote-url <url>`       | リモート Gateway の WebSocket URL。                                                                        |
| `--remote-token <token>`   | リモート Gateway のトークン（任意）。                                                                       |
| `--json`                   | JSON の概要を出力します。                                                                                   |

`--classic` と `--non-interactive` は同時に指定できません。クラシックでは
プロンプト付きウィザードが開きますが、非対話型セットアップでは自動化パスが使用されます。

### ベースラインモード

`openclaw setup --baseline` は、従来のベースラインのみの動作を維持します。
設定、ワークスペース、セッションの各ディレクトリを作成した後、
オンボーディングを実行せずに終了します。

## 例

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 注意事項

- ベースラインセットアップ後、完全なガイド付き手順を実行するには `openclaw setup` または `openclaw onboard` を、特定の設定を変更するには `openclaw configure` を、チャンネルアカウントを追加するには `openclaw channels add` を実行します。
- Hermes の状態が検出された場合、対話型オンボーディングで移行が自動的に提示されることがあります。インポートオンボーディングには新規セットアップが必要です。オンボーディング外でドライラン計画、バックアップ、上書きモードを使用するには、[移行](/ja-JP/cli/migrate)を使用してください。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [オンボーディング](/ja-JP/cli/onboard)
- [オンボーディング（CLI）](/ja-JP/start/wizard)
- [はじめに](/ja-JP/start/getting-started)
- [インストール概要](/ja-JP/install)

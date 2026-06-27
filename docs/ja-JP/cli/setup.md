---
read_when:
    - 完全な CLI オンボーディングなしで初回セットアップを行う
    - デフォルトのワークスペースパスを設定したい
    - すべてのフラグと、セットアップがベースラインモードとウィザードモードをどのように判断するかが必要です
summary: '`openclaw setup` の CLI リファレンス（設定とワークスペースを初期化し、任意でオンボーディングを実行）'
title: セットアップ
x-i18n:
    generated_at: "2026-06-27T11:03:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42bc570cf4c43338d6ca6202aace7c9d669fb1ac6d8bd8b61a591086fff2896a
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

ベースライン設定とエージェントワークスペースを初期化します。オンボーディングフラグが指定されている場合は、ウィザードも実行します。

<Note>
`openclaw setup` は変更可能な設定インストール向けです。Nix モード（`OPENCLAW_NIX_MODE=1`）では、設定ファイルが Nix によって管理されるため、OpenClaw は setup による書き込みを拒否します。ファーストパーティの [nix-openclaw クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)、または別の Nix パッケージ向けの同等のソース設定を使用してください。
</Note>

## オプション

| Flag                       | 説明                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | エージェントワークスペースディレクトリ（デフォルトは `~/.openclaw/workspace`、`agents.defaults.workspace` として保存）。 |
| `--wizard`                 | 対話型オンボーディングを実行します。                                                                         |
| `--non-interactive`        | プロンプトなしでオンボーディングを実行します。                                                                     |
| `--accept-risk`            | システム全体へのエージェントアクセスリスクを承認します。`--non-interactive` では必須です。                       |
| `--mode <mode>`            | オンボーディングモード: `local` または `remote`。                                                               |
| `--import-from <provider>` | オンボーディング中に実行する移行プロバイダー。                                                        |
| `--import-source <path>`   | `--import-from` 用のソースエージェントホーム。                                                              |
| `--import-secrets`         | オンボーディング移行中にサポート対象のシークレットをインポートします。                                               |
| `--remote-url <url>`       | リモート Gateway WebSocket URL。                                                                       |
| `--remote-token <token>`   | リモート Gateway トークン（任意）。                                                                    |

### ウィザードの自動トリガー

`openclaw setup` は、`--wizard` がなくても、次のいずれかのフラグが明示的に指定されている場合にウィザードを実行します。

`--wizard`, `--non-interactive`, `--accept-risk`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## 例

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 注記

- 通常の `openclaw setup` は、完全なオンボーディングフローを実行せずに設定とワークスペースを初期化します。
- 通常の setup の後は、完全なガイド付きの流れには `openclaw onboard`、対象を絞った変更には `openclaw configure`、チャンネルアカウントの追加には `openclaw channels add` を実行します。
- Hermes の状態が検出された場合、対話型オンボーディングで移行を自動的に提示できます。インポートオンボーディングには新しい setup が必要です。オンボーディング外でのドライラン計画、バックアップ、上書きモードには [移行](/ja-JP/cli/migrate) を使用してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [オンボーディング（CLI）](/ja-JP/start/wizard)
- [はじめに](/ja-JP/start/getting-started)
- [インストール概要](/ja-JP/install)

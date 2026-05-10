---
read_when:
    - 完全な CLI オンボーディングを使わずに初回セットアップを行っています
    - デフォルトのワークスペースパスを設定したい場合
    - すべてのフラグと、setup がベースラインモードとウィザードモードのどちらを選択するかの判断方法が必要です
summary: '`openclaw setup` の CLI リファレンス（設定とワークスペースを初期化し、必要に応じてオンボーディングを実行）'
title: セットアップ
x-i18n:
    generated_at: "2026-05-10T19:29:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55f0d771bb07c4c69293a470d54f4b6bb108ee521889bfb944fe450b24938b5e
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

ベースライン設定とエージェントワークスペースを初期化します。オンボーディングフラグが指定されている場合は、ウィザードも実行します。

<Note>
`openclaw setup` は変更可能な設定インストール用です。Nix モード (`OPENCLAW_NIX_MODE=1`) では、設定ファイルが Nix によって管理されるため、OpenClaw は setup の書き込みを拒否します。ファーストパーティの [nix-openclaw クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)、または別の Nix パッケージ向けの同等のソース設定を使用してください。
</Note>

## オプション

| フラグ                       | 説明                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | エージェントワークスペースディレクトリ (デフォルトは `~/.openclaw/workspace`; `agents.defaults.workspace` として保存されます)。 |
| `--wizard`                 | 対話型オンボーディングを実行します。                                                                         |
| `--non-interactive`        | プロンプトなしでオンボーディングを実行します。                                                                     |
| `--mode <mode>`            | オンボーディングモード: `local` または `remote`。                                                               |
| `--import-from <provider>` | オンボーディング中に実行する移行プロバイダー。                                                        |
| `--import-source <path>`   | `--import-from` のソースエージェントホーム。                                                              |
| `--import-secrets`         | オンボーディング移行中に対応しているシークレットをインポートします。                                               |
| `--remote-url <url>`       | リモート Gateway WebSocket URL。                                                                       |
| `--remote-token <token>`   | リモート Gateway トークン (任意)。                                                                    |

### ウィザードの自動トリガー

`openclaw setup` は、`--wizard` がなくても、これらのフラグのいずれかが明示的に指定されている場合にウィザードを実行します。

`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## 例

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 注記

- 単純な `openclaw setup` は、完全なオンボーディングフローを実行せずに設定とワークスペースを初期化します。
- 単純な setup の後は、完全なガイド付きジャーニーには `openclaw onboard`、対象を絞った変更には `openclaw configure`、チャンネルアカウントの追加には `openclaw channels add` を実行してください。
- Hermes の状態が検出された場合、対話型オンボーディングは移行を自動的に提案できます。インポートオンボーディングには新規 setup が必要です。オンボーディング外でのドライラン計画、バックアップ、上書きモードには [移行](/ja-JP/cli/migrate) を使用してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [オンボーディング (CLI)](/ja-JP/start/wizard)
- [はじめに](/ja-JP/start/getting-started)
- [インストール概要](/ja-JP/install)

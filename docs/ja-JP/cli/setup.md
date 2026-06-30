---
read_when:
    - CLI オンボーディングウィザードで初回セットアップを行っています
    - デフォルトのワークスペースパスを設定したい
    - スクリプトにはベースラインのみのセットアップフラグが必要です
summary: '`openclaw setup` の CLI リファレンス（オンボーディングのエイリアス。ベースラインセットアップはフラグで利用可能）'
title: セットアップ
x-i18n:
    generated_at: "2026-06-30T22:06:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797c023d5ba27920fbea9828c9bb12f6c10d25dd3aa6fc68fe9c742f432ebb05
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

完全な CLI オンボーディングフローを実行します。`openclaw setup` は `openclaw onboard` のエイリアスです。ウィザードなしで config/workspace フォルダーだけを初期化する必要がある場合は `--baseline` を使用します。

<Note>
`openclaw setup` は変更可能な設定インストール向けです。Nix モード (`OPENCLAW_NIX_MODE=1`) では、設定ファイルが Nix によって管理されるため、OpenClaw は setup の書き込みを拒否します。ファーストパーティの [nix-openclaw クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)、または別の Nix パッケージ用の同等のソース設定を使用してください。
</Note>

## オプション

| フラグ                     | 説明                                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | エージェント workspace ディレクトリ (デフォルトは `~/.openclaw/workspace`、`agents.defaults.workspace` として保存)。 |
| `--baseline`               | オンボーディングなしでベースラインの config/workspace/session フォルダーを作成します。              |
| `--wizard`                 | 互換性のために受け付けます。setup はデフォルトでオンボーディングを実行します。                     |
| `--non-interactive`        | プロンプトなしでオンボーディングを実行します。                                                      |
| `--accept-risk`            | システム全体へのエージェントアクセスリスクを承認します。`--non-interactive` では必須です。          |
| `--mode <mode>`            | オンボーディングモード: `local` または `remote`。                                                    |
| `--import-from <provider>` | オンボーディング中に実行する移行プロバイダー。                                                      |
| `--import-source <path>`   | `--import-from` 用のソースエージェントホーム。                                                       |
| `--import-secrets`         | オンボーディング移行中に対応しているシークレットをインポートします。                                |
| `--remote-url <url>`       | リモート Gateway WebSocket URL。                                                                     |
| `--remote-token <token>`   | リモート Gateway トークン (任意)。                                                                   |

### ベースラインモード

`openclaw setup --baseline` は以前のベースライン専用の動作を維持します。config、workspace、session ディレクトリを作成してから、オンボーディングを実行せずに終了します。

## 例

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 注記

- 通常の `openclaw setup` は `openclaw onboard` と同じガイド付きジャーニーを実行します。
- ベースライン setup の後は、完全なガイド付きジャーニーには `openclaw setup` または `openclaw onboard`、対象を絞った変更には `openclaw configure`、チャンネルアカウントの追加には `openclaw channels add` を実行します。
- Hermes の状態が検出された場合、対話型オンボーディングで移行を自動的に提案できます。インポートオンボーディングには新規 setup が必要です。オンボーディング外でのドライラン計画、バックアップ、上書きモードには [移行](/ja-JP/cli/migrate) を使用してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [オンボーディング (CLI)](/ja-JP/start/wizard)
- [はじめに](/ja-JP/start/getting-started)
- [インストール概要](/ja-JP/install)

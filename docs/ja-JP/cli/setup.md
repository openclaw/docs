---
read_when:
    - 完全な CLI オンボーディングなしで初回セットアップを行っています
    - デフォルトのワークスペースパスを設定したい
summary: '`openclaw setup` の CLI リファレンス（設定とワークスペースの初期化）'
title: セットアップ
x-i18n:
    generated_at: "2026-05-02T20:44:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 805f60c81f5fc216fc446641efe0bcb60bb6c34b3a50a6fc9e767461206e5f90
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`~/.openclaw/openclaw.json` とエージェントワークスペースを初期化します。

関連:

- はじめに: [はじめに](/ja-JP/start/getting-started)
- CLI オンボーディング: [オンボーディング (CLI)](/ja-JP/start/wizard)

## 例

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## オプション

- `--workspace <dir>`: エージェントワークスペースディレクトリ (`agents.defaults.workspace` として保存)
- `--wizard`: オンボーディングを実行
- `--non-interactive`: プロンプトなしでオンボーディングを実行
- `--mode <local|remote>`: オンボーディングモード
- `--import-from <provider>`: オンボーディング中に実行する移行プロバイダー
- `--import-source <path>`: `--import-from` 用の移行元エージェントホーム
- `--import-secrets`: オンボーディング移行中にサポート対象のシークレットをインポート
- `--remote-url <url>`: リモート Gateway WebSocket URL
- `--remote-token <token>`: リモート Gateway トークン

セットアップ経由でオンボーディングを実行するには:

```bash
openclaw setup --wizard
```

注:

- 通常の `openclaw setup` は、完全なオンボーディングフローなしで構成とワークスペースを初期化します。
- 通常のセットアップ後、`openclaw configure` を実行してモデル、チャネル、Gateway、プラグイン、Skills、またはヘルスチェックを選択します。
- オンボーディングフラグ (`--wizard`、`--non-interactive`、`--mode`、`--import-from`、`--import-source`、`--import-secrets`、`--remote-url`、`--remote-token`) が存在すると、オンボーディングは自動実行されます。
- Hermes の状態が検出された場合、対話型オンボーディングで移行を自動的に提示できます。インポートオンボーディングには新規セットアップが必要です。ドライラン計画、バックアップ、オンボーディング外での上書きモードには [移行](/ja-JP/cli/migrate) を使用してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [インストール概要](/ja-JP/install)

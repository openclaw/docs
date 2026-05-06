---
read_when:
    - 完全な CLI オンボーディングなしで初回セットアップを行っています
    - デフォルトのワークスペースパスを設定したい場合
summary: '`openclaw setup` の CLI リファレンス（設定とワークスペースの初期化）'
title: セットアップ
x-i18n:
    generated_at: "2026-05-06T17:54:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a47d41f8c6c59395eaa4bc6055fa09f863af819c7920e29969793904180c910
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`~/.openclaw/openclaw.json` とエージェントワークスペースを初期化します。

<Note>
`openclaw setup` は可変設定のインストール用です。Nix モード (`OPENCLAW_NIX_MODE=1`) では、設定ファイルが Nix によって管理されるため、OpenClaw は setup による書き込みを拒否します。エージェントは公式の [nix-openclaw クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)、または別の Nix パッケージ向けの同等のソース設定を使用する必要があります。
</Note>

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
- `--import-source <path>`: `--import-from` のソースエージェントホーム
- `--import-secrets`: オンボーディング移行中にサポートされるシークレットをインポート
- `--remote-url <url>`: リモート Gateway WebSocket URL
- `--remote-token <token>`: リモート Gateway トークン

setup 経由でオンボーディングを実行するには:

```bash
openclaw setup --wizard
```

注意:

- プレーンな `openclaw setup` は、完全なオンボーディングフローなしで設定とワークスペースを初期化します。
- プレーンな setup の後、`openclaw configure` を実行して、モデル、チャンネル、Gateway、plugins、Skills、またはヘルスチェックを選択します。
- オンボーディングフラグ (`--wizard`、`--non-interactive`、`--mode`、`--import-from`、`--import-source`、`--import-secrets`、`--remote-url`、`--remote-token`) のいずれかが存在する場合、オンボーディングは自動実行されます。
- Hermes の状態が検出された場合、対話型オンボーディングで移行を自動的に提示できます。インポートオンボーディングには新規 setup が必要です。オンボーディング外でのドライラン計画、バックアップ、上書きモードには [移行](/ja-JP/cli/migrate) を使用してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [インストール概要](/ja-JP/install)

---
read_when:
    - 完全なCLIオンボーディングを使わずに初回セットアップを行っている場合
    - デフォルトのワークスペースパスを設定したい場合
summary: '`openclaw setup` のCLIリファレンス（設定 + ワークスペースの初期化）'
title: セットアップ
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T04:51:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 650b0faf99ef1bc24ec6514661093a9a2ba7edead2e2622b863d51553c44f267
    source_path: cli/setup.md
    workflow: 15
---

# `openclaw setup`

`~/.openclaw/openclaw.json`とエージェントワークスペースを初期化します。

関連:

- はじめに: [はじめに](/ja-JP/start/getting-started)
- CLIオンボーディング: [Onboarding (CLI)](/ja-JP/start/wizard)

## 例

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## オプション

- `--workspace <dir>`: エージェントワークスペースディレクトリ（`agents.defaults.workspace`として保存）
- `--wizard`: オンボーディングを実行
- `--non-interactive`: プロンプトなしでオンボーディングを実行
- `--mode <local|remote>`: オンボーディングモード
- `--remote-url <url>`: リモートGateway WebSocket URL
- `--remote-token <token>`: リモートGatewayトークン

setup経由でオンボーディングを実行するには:

```bash
openclaw setup --wizard
```

注意:

- 通常の`openclaw setup`は、完全なオンボーディングフローなしで設定 + ワークスペースを初期化します。
- いずれかのオンボーディングフラグ（`--wizard`、`--non-interactive`、`--mode`、`--remote-url`、`--remote-token`）が存在すると、オンボーディングが自動実行されます。

## 関連

- [CLI reference](/ja-JP/cli)
- [インストール概要](/ja-JP/install)

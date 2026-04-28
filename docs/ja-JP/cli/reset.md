---
read_when:
    - CLIをインストールしたままローカル状態を消去したい場合
    - 何が削除されるかのドライランを実行したい場合
summary: '`openclaw reset` のCLIリファレンス（ローカル状態/設定のリセット）'
title: リセット
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T04:51:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4a4aba32fb44905d079bf2a22e582a3affbe9809eac9af237ce3e48da72b42c
    source_path: cli/reset.md
    workflow: 15
---

# `openclaw reset`

ローカルの設定/状態をリセットします（CLIはインストールされたままです）。

オプション:

- `--scope <scope>`: `config`、`config+creds+sessions`、または`full`
- `--yes`: 確認プロンプトをスキップ
- `--non-interactive`: プロンプトを無効化。`--scope`と`--yes`が必要
- `--dry-run`: ファイルを削除せずに実行内容を表示

例:

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

注意:

- ローカル状態を削除する前に復元可能なスナップショットが欲しい場合は、先に`openclaw backup create`を実行してください。
- `--scope`を省略すると、`openclaw reset`は対話型プロンプトを使用して削除対象を選択します。
- `--non-interactive`は、`--scope`と`--yes`の両方が設定されている場合のみ有効です。

## 関連

- [CLI reference](/ja-JP/cli)

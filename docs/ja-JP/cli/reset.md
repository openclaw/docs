---
read_when:
    - CLI をインストールしたまま、ローカルの状態を消去したい場合
    - 削除される内容を事前に確認したい場合
summary: '`openclaw reset` の CLI リファレンス（ローカルの状態/設定をリセット）'
title: リセット
x-i18n:
    generated_at: "2026-07-11T22:09:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f18af9c5e187217de4c02f4b55de9a1c94f7246b74056dc660aa172168edcef9
    source_path: cli/reset.md
    workflow: 16
---

# `openclaw reset`

ローカルの設定/状態をリセットします（CLI はインストールされたままです）。

```bash
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

## オプション

- `--scope <scope>`: `config`、`config+creds+sessions`、または `full`
- `--yes`: 確認プロンプトを省略
- `--non-interactive`: プロンプトを無効化。`--scope` と `--yes` が必要
- `--dry-run`: ファイルを削除せずに実行内容を表示

## スコープ

| スコープ                | 削除対象                                                                                                      | 最初に Gateway を停止 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------- |
| `config`                | 設定ファイルのみ                                                                                              | いいえ                |
| `config+creds+sessions` | 設定ファイル、OAuth/認証情報ディレクトリ、エージェントごとのセッションディレクトリ                            | はい                  |
| `full`                  | 状態ディレクトリ（設定/認証情報がその内部にある場合はそれらを含む）、ワークスペースディレクトリ、ワークスペース証明 | はい                  |

`config+creds+sessions` と `full` は、状態を削除する前に、実行中の管理対象 Gateway サービスを停止します。

## 注意事項

- ローカル状態を削除する前に、復元可能なスナップショットを作成するため、まず `openclaw backup create` を実行してください。
- `--scope` を指定しない場合、`openclaw reset` は削除するスコープを対話形式で確認します。
- `--non-interactive` は、`--scope` と `--yes` の両方が設定されている場合にのみ有効です。
- `config+creds+sessions` と `full` は、完了時に `Next: openclaw onboard --install-daemon` を表示します。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)

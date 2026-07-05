---
read_when:
    - CLIをインストールしたままローカル状態を消去したい場合
    - 削除される内容のドライランを確認したい
summary: '`openclaw reset` の CLI リファレンス（ローカルの状態/設定をリセット）'
title: リセット
x-i18n:
    generated_at: "2026-07-05T11:13:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f18af9c5e187217de4c02f4b55de9a1c94f7246b74056dc660aa172168edcef9
    source_path: cli/reset.md
    workflow: 16
---

# `openclaw reset`

ローカル設定/状態をリセットします（CLI のインストールは保持します）。

```bash
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

## オプション

- `--scope <scope>`: `config`、`config+creds+sessions`、または `full`
- `--yes`: 確認プロンプトをスキップします
- `--non-interactive`: プロンプトを無効にします。`--scope` と `--yes` が必要です
- `--dry-run`: ファイルを削除せずに実行される操作を表示します

## スコープ

| スコープ                | 削除対象                                                                                              | 先に Gateway を停止 |
| ----------------------- | ----------------------------------------------------------------------------------------------------- | ------------------- |
| `config`                | 設定ファイルのみ                                                                                      | いいえ              |
| `config+creds+sessions` | 設定ファイル、OAuth/認証情報ディレクトリ、エージェントごとのセッションディレクトリ                   | はい                |
| `full`                  | 状態ディレクトリ（その中にネストされた設定/認証情報を含む）に加え、ワークスペースディレクトリとワークスペース attestations | はい                |

`config+creds+sessions` と `full` は、状態を削除する前に実行中の管理対象 Gateway サービスを停止します。

## 注記

- ローカル状態を削除する前に、復元可能なスナップショットとしてまず `openclaw backup create` を実行します。
- `--scope` なしで `openclaw reset` を実行すると、削除するスコープを対話的に尋ねます。
- `--non-interactive` は、`--scope` と `--yes` の両方が設定されている場合にのみ有効です。
- `config+creds+sessions` と `full` は、完了時に `Next: openclaw onboard --install-daemon` を表示します。

## 関連

- [CLI リファレンス](/ja-JP/cli)

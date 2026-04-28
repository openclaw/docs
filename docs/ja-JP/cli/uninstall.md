---
read_when:
    - gateway サービスやローカル状態を削除したい場合
    - まず dry-run を行いたい場合
summary: '`openclaw uninstall` の CLI リファレンス（gateway サービスとローカルデータの削除）'
title: アンインストール
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T04:52:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: b774fc006e989068b9126aff2a72888fd808a2e0e3d5ea8b57e6ab9d9f1b63ee
    source_path: cli/uninstall.md
    workflow: 15
---

# `openclaw uninstall`

gateway サービスとローカルデータをアンインストールします（CLI 自体は残ります）。

オプション:

- `--service`: gateway サービスを削除
- `--state`: 状態と設定を削除
- `--workspace`: workspace ディレクトリを削除
- `--app`: macOS アプリを削除
- `--all`: サービス、状態、workspace、アプリを削除
- `--yes`: 確認プロンプトをスキップ
- `--non-interactive`: プロンプトを無効化。`--yes` が必要
- `--dry-run`: ファイルを削除せず、実行される操作を表示

例:

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

注記:

- 状態や workspace を削除する前に復元可能なスナップショットが必要な場合は、先に `openclaw backup create` を実行してください。
- `--all` は、サービス、状態、workspace、アプリをまとめて削除する短縮形です。
- `--non-interactive` には `--yes` が必要です。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [アンインストール](/ja-JP/install/uninstall)

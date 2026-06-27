---
read_when:
    - Gateway サービスおよび/またはローカル状態を削除したい場合
    - まずドライランを実行したい場合
summary: '`openclaw uninstall` のCLIリファレンス（gatewayサービス + ローカルデータを削除）'
title: アンインストール
x-i18n:
    generated_at: "2026-06-27T11:04:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f90fa8cf513e2e8cd422c3b8a880e7fd20fb71131a3ec88260e765daa2ace543
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Gateway サービス + ローカルデータをアンインストールします（CLI は残ります）。

オプション:

- `--service`: Gateway サービスを削除する
- `--state`: 状態と設定を削除する
- `--workspace`: ワークスペースディレクトリを削除する
- `--app`: macOS アプリを削除する
- `--all`: サービス、状態、ワークスペース、アプリを削除する
- `--yes`: 確認プロンプトをスキップする
- `--non-interactive`: プロンプトを無効にする。`--yes` が必要
- `--dry-run`: ファイルを削除せずに実行される操作を表示する

例:

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

注:

- 状態やワークスペースを削除する前に復元可能なスナップショットが必要な場合は、先に `openclaw backup create` を実行してください。
- `--state` は、`--workspace` も選択されていない限り、設定済みのワークスペースディレクトリを保持します。
- `--all` は、サービス、状態、ワークスペース、アプリをまとめて削除するための省略形です。
- `--non-interactive` には `--yes` が必要です。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [アンインストール](/ja-JP/install/uninstall)

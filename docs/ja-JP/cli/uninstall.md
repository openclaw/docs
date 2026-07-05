---
read_when:
    - Gateway サービスおよび local state を削除したい場合
    - まずドライランを実行したい
summary: '`openclaw uninstall` の CLI リファレンス（gateway サービス + ローカルデータを削除）'
title: アンインストール
x-i18n:
    generated_at: "2026-07-05T11:14:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1e2e3996cf6d5c0fd11e5054c8fe60f7f8d25047193bb13944ca170bf77b581a
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Gateway サービスやローカルデータをアンインストールします。CLI 自体は
削除されません。npm/pnpm で別途アンインストールしてください。

## オプション

| フラグ              | デフォルト | 説明                                                 |
| ------------------- | ---------- | ---------------------------------------------------- |
| `--service`         | `false`    | Gateway サービスを削除します。                       |
| `--state`           | `false`    | 状態と設定を削除します。                             |
| `--workspace`       | `false`    | ワークスペースディレクトリを削除します。             |
| `--app`             | `false`    | macOS アプリを削除します。                           |
| `--all`             | `false`    | `--service --state --workspace --app` の短縮形です。 |
| `--yes`             | `false`    | 確認プロンプトをスキップします。                     |
| `--non-interactive` | `false`    | プロンプトを無効にします。`--yes` が必要です。       |
| `--dry-run`         | `false`    | ファイルを削除せずに予定されている操作を出力します。 |

スコープフラグを指定しない場合、対話式の複数選択プロンプトで削除するコンポーネントを選びます
（デフォルトでは service、state、workspace が事前選択されています）。

## 例

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

## 注記

- state またはワークスペースを削除する前に、復元可能なスナップショットとして
  まず `openclaw backup create` を実行してください。
- `--state` は、`--workspace` も選択されていない限り、設定済みのワークスペースディレクトリを保持します。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [アンインストール](/ja-JP/install/uninstall)

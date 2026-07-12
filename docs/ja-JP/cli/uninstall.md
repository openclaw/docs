---
read_when:
    - Gateway サービスおよび／またはローカル状態を削除する場合
    - まずドライランを実行したい場合
summary: '`openclaw uninstall` の CLI リファレンス（Gateway サービスとローカルデータを削除）'
title: アンインストール
x-i18n:
    generated_at: "2026-07-11T22:09:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1e2e3996cf6d5c0fd11e5054c8fe60f7f8d25047193bb13944ca170bf77b581a
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Gateway サービスおよびローカルデータの一方または両方をアンインストールします。CLI 自体は削除されません。別途 npm/pnpm を使用してアンインストールしてください。

## オプション

| フラグ              | デフォルト | 説明                                                     |
| ------------------- | ---------- | -------------------------------------------------------- |
| `--service`         | `false`    | Gateway サービスを削除します。                           |
| `--state`           | `false`    | 状態と設定を削除します。                                 |
| `--workspace`       | `false`    | ワークスペースディレクトリを削除します。                 |
| `--app`             | `false`    | macOS アプリを削除します。                               |
| `--all`             | `false`    | `--service --state --workspace --app` の短縮指定です。   |
| `--yes`             | `false`    | 確認プロンプトを省略します。                             |
| `--non-interactive` | `false`    | プロンプトを無効にします。`--yes` が必要です。           |
| `--dry-run`         | `false`    | ファイルを削除せず、実行予定の操作を表示します。         |

対象範囲を指定するフラグがない場合は、削除するコンポーネントを選択する対話型の複数選択プロンプトが表示されます（デフォルトでは、サービス、状態、ワークスペースが事前選択されています）。

## 例

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

## 注意事項

- 状態またはワークスペースを削除する前に、復元可能なスナップショットを作成するため、最初に `openclaw backup create` を実行してください。
- `--state` では、`--workspace` も選択されていない限り、設定済みのワークスペースディレクトリが保持されます。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [アンインストール](/ja-JP/install/uninstall)

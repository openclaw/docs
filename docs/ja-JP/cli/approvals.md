---
read_when:
    - CLI から exec 承認を編集したい場合
    - gateway または node ホスト上の許可リストを管理する必要がある場合
summary: '`openclaw approvals` と `openclaw exec-policy` の CLI リファレンス'
title: 承認
x-i18n:
    generated_at: "2026-04-24T04:49:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7403f0e35616db5baf3d1564c8c405b3883fc3e5032da9c6a19a32dba8c5fb7d
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

**ローカルホスト**、**gateway ホスト**、または **node ホスト** の exec 承認を管理します。
デフォルトでは、コマンドはディスク上のローカル承認ファイルを対象にします。gateway を対象にするには `--gateway` を、特定の node を対象にするには `--node` を使ってください。

エイリアス: `openclaw exec-approvals`

関連:

- Exec 承認: [Exec approvals](/ja-JP/tools/exec-approvals)
- Nodes: [Nodes](/ja-JP/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` は、要求された
`tools.exec.*` 設定とローカルホスト承認ファイルを 1 ステップで揃えるための
ローカル向け簡易コマンドです。

次のことをしたい場合に使います:

- ローカルの要求ポリシー、ホスト承認ファイル、有効なマージ結果を確認する
- YOLO や deny-all のようなローカルプリセットを適用する
- ローカルの `tools.exec.*` とローカルの `~/.openclaw/exec-approvals.json` を同期する

例:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

出力モード:

- `--json` なし: 人が読めるテーブル表示を出力します
- `--json`: 機械可読な構造化出力を出力します

現在のスコープ:

- `exec-policy` は **ローカル専用** です
- ローカル設定ファイルとローカル承認ファイルをまとめて更新します
- gateway ホストや node ホストにはポリシーをプッシュしません
- node exec 承認は実行時に node から取得され、代わりに node 指定の approvals コマンドで管理する必要があるため、このコマンドでは `--host node` は拒否されます
- `openclaw exec-policy show` は、ローカル承認ファイルから有効ポリシーを導出する代わりに、`host=node` スコープを実行時 node 管理としてマークします

リモートホスト承認を直接編集する必要がある場合は、引き続き `openclaw approvals set --gateway`
または `openclaw approvals set --node <id|name|ip>` を使ってください。

## よく使うコマンド

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` は、ローカル、gateway、および node ターゲットに対する有効な exec ポリシーを表示するようになりました:

- 要求された `tools.exec` ポリシー
- ホスト承認ファイルポリシー
- 優先順位ルール適用後の有効結果

優先順位は意図的なものです:

- ホスト承認ファイルは、強制可能なソースオブトゥルースです
- 要求された `tools.exec` ポリシーは意図を狭めたり広げたりできますが、有効結果は依然としてホストルールから導出されます
- `--node` は node ホスト承認ファイルと gateway `tools.exec` ポリシーを組み合わせます。両方が実行時に適用されるためです
- gateway 設定が利用できない場合、CLI は node 承認スナップショットにフォールバックし、最終的な実行時ポリシーを計算できなかったことを注記します

## ファイルから承認を置き換える

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` は厳密な JSON だけでなく JSON5 も受け付けます。`--file` または `--stdin` のいずれか一方を使ってください。両方は使えません。

## 「確認しない」/ YOLO の例

ホストが exec 承認で止まらないようにするには、ホスト承認デフォルトを `full` + `off` に設定します:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

node バリアント:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

これは **ホスト承認ファイル** のみを変更します。要求された OpenClaw ポリシーも揃えるには、次も設定してください:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

この例で `tools.exec.host=gateway` なのは次の理由です:

- `host=auto` は依然として「利用可能なら sandbox、そうでなければ gateway」を意味します。
- YOLO はルーティングではなく承認に関するものです。
- sandbox が設定されていても host exec を使いたい場合は、`gateway` または `/exec host=gateway` でホスト選択を明示してください。

これは現在の host-default YOLO 動作に一致します。承認を厳しくしたい場合は、より制限してください。

ローカルショートカット:

```bash
openclaw exec-policy preset yolo
```

このローカルショートカットは、要求されたローカル `tools.exec.*` 設定と
ローカル承認デフォルトの両方をまとめて更新します。意図としては上記の手動 2 ステップ設定と同等ですが、対象はローカルマシンのみです。

## 許可リストヘルパー

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## 共通オプション

`get`、`set`、`allowlist add|remove` はすべて次をサポートします:

- `--node <id|name|ip>`
- `--gateway`
- 共通 node RPC オプション: `--url`、`--token`、`--timeout`、`--json`

ターゲット指定に関する注記:

- ターゲットフラグなしは、ディスク上のローカル承認ファイルを意味します
- `--gateway` は gateway ホスト承認ファイルを対象にします
- `--node` は id、name、IP、または id プレフィックスを解決した後、1 つの node ホストを対象にします

`allowlist add|remove` はさらに次をサポートします:

- `--agent <id>`（デフォルトは `*`）

## 注記

- `--node` は `openclaw nodes` と同じリゾルバを使います（id、name、ip、または id プレフィックス）。
- `--agent` のデフォルトは `"*"` で、すべてのエージェントに適用されます。
- node ホストは `system.execApprovals.get/set` を通知している必要があります（macOS アプリまたは headless node ホスト）。
- 承認ファイルはホストごとに `~/.openclaw/exec-approvals.json` に保存されます。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Exec approvals](/ja-JP/tools/exec-approvals)

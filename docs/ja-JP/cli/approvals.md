---
read_when:
    - CLI から exec 承認を編集したい
    - Gateway または Node ホストで許可リストを管理する必要がある
summary: '`openclaw approvals` と `openclaw exec-policy` の CLI リファレンス'
title: 承認
x-i18n:
    generated_at: "2026-06-27T10:52:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e5521622ee48237d3cc9feaa54906d026dfb15da4c9b9b17655cd59b35cae19d
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

**ローカルホスト**、**Gateway ホスト**、または **node ホスト**の exec 承認を管理します。
デフォルトでは、コマンドはディスク上のローカル承認ファイルを対象にします。Gateway を対象にするには `--gateway` を、特定の node を対象にするには `--node` を使用します。

エイリアス: `openclaw exec-approvals`

関連:

- Exec 承認: [Exec 承認](/ja-JP/tools/exec-approvals)
- Node: [Node](/ja-JP/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` は、要求された
`tools.exec.*` config とローカルホストの承認ファイルを 1 ステップで整合させるためのローカル簡易コマンドです。

次のことをしたい場合に使用します。

- ローカルの要求ポリシー、ホスト承認ファイル、有効なマージ結果を確認する
- YOLO や deny-all などのローカルプリセットを適用する
- ローカルの `tools.exec.*` とローカルホストの承認ファイルを同期する

例:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

出力モード:

- `--json` なし: 人間が読めるテーブルビューを出力します
- `--json`: 機械可読の構造化出力を出力します

現在のスコープ:

- `exec-policy` は**ローカル専用**です
- ローカル config ファイルとローカル承認ファイルを一緒に更新します
- ポリシーを Gateway ホストや node ホストへプッシュ**しません**
- node の exec 承認は実行時に node から取得され、代わりに node 対象の承認コマンドで管理する必要があるため、このコマンドでは `--host node` は拒否されます
- `openclaw exec-policy show` は、ローカル承認ファイルから有効なポリシーを導出する代わりに、`host=node` スコープを実行時に node 管理としてマークします

リモートホスト承認を直接編集する必要がある場合は、引き続き `openclaw approvals set --gateway`
または `openclaw approvals set --node <id|name|ip>` を使用してください。

## よく使うコマンド

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` は、ローカル、Gateway、node 対象の有効な exec ポリシーを表示するようになりました。

- 要求された `tools.exec` ポリシー
- ホスト承認ファイルのポリシー
- 優先順位ルール適用後の有効な結果

優先順位は意図的です。

- ホスト承認ファイルが、強制可能な信頼できる唯一の情報源です
- 要求された `tools.exec` ポリシーは意図を狭めたり広げたりできますが、有効な結果は引き続きホストルールから導出されます
- `--node` は node ホスト承認ファイルと Gateway の `tools.exec` ポリシーを組み合わせます。どちらも実行時に適用されるためです
- Gateway config を利用できない場合、CLI は node 承認スナップショットにフォールバックし、最終的な実行時ポリシーを計算できなかったことを記録します

## ファイルから承認を置き換える

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` は厳密な JSON だけでなく JSON5 も受け付けます。`--file` と `--stdin` のどちらか一方を使用し、両方は使用しないでください。

## 「確認を出さない」/ YOLO の例

exec 承認で停止してはならないホストでは、ホスト承認のデフォルトを `full` + `off` に設定します。

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

Node 版:

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

これは**ホスト承認ファイル**だけを変更します。要求された OpenClaw ポリシーも整合させるには、次も設定します。

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

この例で `tools.exec.host=gateway` とする理由:

- `host=auto` は引き続き「利用可能な場合は sandbox、そうでなければ Gateway」を意味します。
- YOLO は承認に関するものであり、ルーティングに関するものではありません。
- sandbox が設定されている場合でもホスト exec を使いたい場合は、`gateway` または `/exec host=gateway` でホスト選択を明示してください。

省略された `askFallback` のデフォルトは `deny` です。確認を出さない動作を維持すべき UI なしホストをアップグレードする場合は、`askFallback: "full"` を
明示的に設定してください。

ローカルショートカット:

```bash
openclaw exec-policy preset yolo
```

このローカルショートカットは、要求されたローカル `tools.exec.*` config と
ローカル承認のデフォルトの両方を一緒に更新します。意図としては上記の手動 2 ステップ
設定と同等ですが、ローカルマシンに対してのみ有効です。

## allowlist ヘルパー

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## 共通オプション

`get`、`set`、`allowlist add|remove` はすべて次をサポートします。

- `--node <id|name|ip>`
- `--gateway`
- 共有 node RPC オプション: `--url`、`--token`、`--timeout`、`--json`

対象指定の注意:

- 対象フラグなしは、ディスク上のローカル承認ファイルを意味します
- `--gateway` は Gateway ホスト承認ファイルを対象にします
- `--node` は id、名前、IP、または id プレフィックスを解決した後、1 つの node ホストを対象にします

`allowlist add|remove` は次もサポートします。

- `--agent <id>` (デフォルトは `*`)

## 注記

- `--node` は `openclaw nodes` と同じリゾルバー (id、名前、ip、または id プレフィックス) を使用します。
- `--agent` のデフォルトは `"*"` で、すべての agent に適用されます。
- node ホストは `system.execApprovals.get/set` (macOS アプリまたはヘッドレス node ホスト) を advertise している必要があります。
- 承認ファイルは、OpenClaw state dir 内にホストごとに保存されます
  (`$OPENCLAW_STATE_DIR/exec-approvals.json`、または
  変数が未設定の場合は `~/.openclaw/exec-approvals.json`)。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Exec 承認](/ja-JP/tools/exec-approvals)

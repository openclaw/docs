---
read_when:
    - CLIからexec承認を編集したい場合
    - GatewayまたはNodeホスト上の許可リストを管理する必要があります
summary: '`openclaw approvals` と `openclaw exec-policy` のCLIリファレンス'
title: 承認
x-i18n:
    generated_at: "2026-04-23T14:01:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e4e031df737e3bdde97ece81fe50eafbb4384557b40c6d52cf2395cf30721a3
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

**ローカルホスト**、**Gatewayホスト**、または **Nodeホスト** のexec承認を管理します。
デフォルトでは、コマンドはディスク上のローカル承認ファイルを対象にします。Gatewayを対象にするには `--gateway`、特定のNodeを対象にするには `--node` を使用します。

エイリアス: `openclaw exec-approvals`

関連:

- Exec承認: [Exec approvals](/ja-JP/tools/exec-approvals)
- Node: [Nodes](/ja-JP/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` は、要求された `tools.exec.*` 設定とローカルホスト承認ファイルを1ステップで同期させるためのローカル用便利コマンドです。

以下を行いたい場合に使用します:

- ローカルで要求されているポリシー、ホスト承認ファイル、および有効なマージ結果を確認する
- YOLOやdeny-allのようなローカルプリセットを適用する
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

- `--json` なし: 人間向けのテーブル表示を出力します
- `--json` あり: 機械可読な構造化出力を出力します

現在のスコープ:

- `exec-policy` は**ローカル専用**です
- ローカル設定ファイルとローカル承認ファイルを一緒に更新します
- GatewayホストやNodeホストへポリシーをプッシュすることは**ありません**
- `--host node` はこのコマンドでは拒否されます。Nodeのexec承認は実行時にNodeから取得されるため、代わりにNode対象の承認コマンドで管理する必要があります
- `openclaw exec-policy show` は、ローカル承認ファイルから有効ポリシーを導出する代わりに、`host=node` スコープを実行時にNode管理として表示します

リモートホスト承認を直接編集する必要がある場合は、引き続き `openclaw approvals set --gateway`
または `openclaw approvals set --node <id|name|ip>` を使用してください。

## 一般的なコマンド

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` は、ローカル、Gateway、およびNodeターゲットに対する有効なexecポリシーを表示するようになりました:

- 要求された `tools.exec` ポリシー
- ホスト承認ファイルのポリシー
- 優先順位ルール適用後の有効結果

この優先順位は意図的なものです:

- 強制可能な真の情報源はホスト承認ファイルです
- 要求された `tools.exec` ポリシーは意図を狭めたり広げたりできますが、有効な結果は依然としてホストルールから導出されます
- `--node` は、Nodeホスト承認ファイルとGatewayの `tools.exec` ポリシーを組み合わせます。両方が実行時に適用されるためです
- Gateway設定が利用できない場合、CLIはNode承認スナップショットへフォールバックし、最終的な実行時ポリシーを計算できなかったことを注記します

## ファイルから承認を置き換える

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` は厳密なJSONだけでなくJSON5を受け付けます。`--file` または `--stdin` のいずれかを使用し、両方は使用しないでください。

## 「確認しない」/ YOLO の例

exec承認で止まってほしくないホストでは、ホスト承認のデフォルトを `full` + `off` に設定します:

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

Node版:

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

これで変更されるのは**ホスト承認ファイル**のみです。要求されたOpenClawポリシーも揃えるには、以下も設定してください:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

この例で `tools.exec.host=gateway` とする理由:

- `host=auto` は依然として「利用可能ならサンドボックス、そうでなければGateway」を意味します。
- YOLOはルーティングではなく承認に関するものです。
- サンドボックスが設定されていてもホストexecを使いたい場合は、`gateway` または `/exec host=gateway` でホスト選択を明示してください。

これは現在のホストデフォルトYOLO動作と一致します。承認を厳しくしたい場合は調整してください。

ローカル用ショートカット:

```bash
openclaw exec-policy preset yolo
```

このローカル用ショートカットは、要求されたローカル `tools.exec.*` 設定と
ローカル承認デフォルトの両方を一緒に更新します。意図としては上記の手動2ステップ設定と同等ですが、ローカルマシンに対してのみです。

## 許可リストヘルパー

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## 一般オプション

`get`、`set`、および `allowlist add|remove` はすべて以下をサポートします:

- `--node <id|name|ip>`
- `--gateway`
- 共通のNode RPCオプション: `--url`, `--token`, `--timeout`, `--json`

ターゲット指定に関する注意:

- ターゲットフラグなしは、ディスク上のローカル承認ファイルを意味します
- `--gateway` はGatewayホスト承認ファイルを対象にします
- `--node` はid、name、IP、またはid接頭辞を解決した後、そのNodeホストを対象にします

`allowlist add|remove` は以下もサポートします:

- `--agent <id>`（デフォルトは `*`）

## 注意

- `--node` は `openclaw nodes` と同じリゾルバーを使用します（id、name、ip、またはid接頭辞）。
- `--agent` のデフォルトは `"*"` で、これはすべてのエージェントに適用されます。
- Nodeホストは `system.execApprovals.get/set` を広告している必要があります（macOSアプリまたはヘッドレスNodeホスト）。
- 承認ファイルはホストごとに `~/.openclaw/exec-approvals.json` に保存されます。

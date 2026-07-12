---
read_when:
    - CLI から exec 承認を編集したい場合
    - Gateway または Node ホスト上で許可リストを管理する必要があります
summary: '`openclaw approvals` と `openclaw exec-policy` の CLI リファレンス'
title: 承認
x-i18n:
    generated_at: "2026-07-11T22:01:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5b045a4dee3726a7df2368b704a00464dc9e575bf77747103e34ebdfe0aa2df
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

**ローカルホスト**、**Gateway ホスト**、または **Node ホスト**の実行承認を管理します。対象フラグを指定しない場合、コマンドはディスク上のローカル承認ファイルを読み書きします。Gateway を対象にするには `--gateway`、特定の Node を対象にするには `--node <id|name|ip>` を使用します。

エイリアス: `openclaw exec-approvals`

関連項目: [実行承認](/ja-JP/tools/exec-approvals)、[Node](/ja-JP/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` は、要求された `tools.exec.*` 設定とローカルホストの承認ファイルを、1 回の操作で同期させる**ローカル専用**の便利なコマンドです。

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

プリセット（`yolo`、`cautious`、`deny-all`）は、`host`、`security`、`ask`、`askFallback` をまとめて適用します。`set` は渡したフラグのみを適用します。受け付ける各値は検証されます（`--host auto|sandbox|gateway|node`、`--security deny|allowlist|full`、`--ask off|on-miss|always`、`--ask-fallback deny|allowlist|full`）。

適用範囲:

- ローカル設定ファイルとローカル承認ファイルをまとめて更新します。ポリシーを Gateway や Node ホストへ送信することはありません。
- `--host node` は拒否されます。Node の実行承認は実行時に Node から取得されるため、ローカルの `exec-policy` では同期できません。代わりに `openclaw approvals set --node <id|name|ip>` を使用してください。
- `exec-policy show` は、ローカル承認ファイルから実効ポリシーを導出する代わりに、`host=node` のスコープを実行時に Node が管理するものとして表示します。

リモートホストの承認には、`openclaw approvals set --gateway` または `openclaw approvals set --node <id|name|ip>` を直接使用します。

## よく使うコマンド

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`get` は、対象に対する実効実行ポリシーを表示します。これには、要求された `tools.exec` ポリシー、ホストの承認ファイルのポリシー、およびそれらをマージした実効結果が含まれます。Windows コンパニオンなど、ホストネイティブのポリシーを持つ Node では、OpenClaw の承認ファイルに基づくポリシー計算を適用せず、そのポリシーを直接表示します。

ファイルベースの Node では、マージされた表示にホスト側で解決されたポリシーのスナップショットが必要です。古い Node では、Gateway が要求したポリシーがホストにも適用されると仮定せず、実効ポリシーを利用不可として表示します。

<Note>
セッションごとの `/exec` オーバーライドは含まれません。現在のデフォルトを確認するには、該当するセッションで `/exec` を実行してください。
</Note>

優先順位:

- ホストの承認ファイルが、強制適用可能な信頼できる唯一の情報源です。
- 要求された `tools.exec` ポリシーによって意図を制限または拡張できますが、実効結果はホストのルールから導出されます。
- `--node` は、Node ホストの承認ファイルと Gateway の `tools.exec` ポリシーを組み合わせます（実行時には両方が適用されます）。
- Gateway の設定を利用できない場合、CLI は Node の承認スナップショットにフォールバックし、最終的な実行時ポリシーを計算できなかったことを示します。

## ファイルから承認を置き換える

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` は厳密な JSON だけでなく、JSON5 も受け付けます。`--file` と `--stdin` のいずれか一方を使用し、両方を同時に使用しないでください。

ホストネイティブの Windows Node は、独自のポリシー形式を使用します。

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  defaultAction: "deny",
  rules: [{ pattern: "hostname", action: "allow" }]
}
EOF
```

CLI はまず Node の現在のハッシュを読み取り、それを更新とともに送信します。そのため、同時に行われたローカル編集は上書きされず、更新が拒否されます。この操作は Node のルール一覧全体を置き換えるため、`rules` は必須です。`defaultAction` は任意です。ネイティブポリシーが無効であると報告する Node は、リモートから設定できません。まず、そのホストでポリシーを有効化または設定してください。ホストネイティブのポリシーは、`allowlist add|remove` ヘルパーをサポートしません。

## 「プロンプトを表示しない」/ YOLO の例

実行承認で停止しないようにするホストでは、ホスト承認のデフォルトを `full` + `off` に設定します。

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

OpenClaw の承認ファイルを公開する Node では、同じ内容を `openclaw approvals set --node <id|name|ip> --stdin` とともに使用します。ホストネイティブの Node では、上記の所有者固有の形式が必要です。

これは**ホストの承認ファイル**のみを変更します。要求された OpenClaw ポリシーも一致させるには、次も設定します。

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

ここで `tools.exec.host=gateway` を明示しているのは、`host=auto` が引き続き「利用可能な場合はサンドボックス、それ以外は Gateway」を意味するためです。YOLO は承認に関する設定であり、ルーティングに関する設定ではありません。サンドボックスが設定されていてもホストで実行したい場合は、`gateway`（または `/exec host=gateway`）を使用します。

省略した `askFallback` のデフォルトは `deny` です。プロンプトを表示しない動作を維持する必要がある UI のないホストをアップグレードする場合は、`askFallback: "full"` を明示的に設定します。

ローカルマシンだけで同じ意図を適用するショートカット:

```bash
openclaw exec-policy preset yolo
```

## 許可リスト用ヘルパー

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## 共通オプション

`get`、`set`、`allowlist add|remove` はすべて、次のオプションをサポートします。

- `--node <id|name|ip>`（ID、名前、IP、または ID のプレフィックスを解決します。`openclaw nodes` と同じリゾルバーを使用します）
- `--gateway`
- 共通の Node RPC オプション: `--url`、`--token`、`--timeout`、`--json`

対象フラグを指定しない場合は、ディスク上のローカル承認ファイルが対象になります。

`allowlist add|remove` は `--agent <id>` もサポートします（デフォルトは `"*"` で、すべてのエージェントに適用されます）。

## 注記

- Node ホストは `system.execApprovals.get/set` を公開している必要があります（macOS アプリ、ヘッドレス Node ホスト、または Windows コンパニオン）。
- 承認ファイルはホストごとに OpenClaw の状態ディレクトリへ保存されます。`$OPENCLAW_STATE_DIR/exec-approvals.json`、または変数が未設定の場合は `~/.openclaw/exec-approvals.json` です。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [実行承認](/ja-JP/tools/exec-approvals)

---
read_when:
    - CLI から exec 承認を編集する場合
    - GatewayまたはNodeホスト上で許可リストを管理する必要があります
summary: '`openclaw approvals` と `openclaw exec-policy` の CLI リファレンス'
title: 承認
x-i18n:
    generated_at: "2026-07-12T14:21:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f5b045a4dee3726a7df2368b704a00464dc9e575bf77747103e34ebdfe0aa2df
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

**ローカルホスト**、**Gateway ホスト**、または **Node ホスト**の exec 承認を管理します。ターゲットフラグを指定しない場合、コマンドはディスク上のローカル承認ファイルを読み書きします。Gateway をターゲットにするには `--gateway`、特定の Node をターゲットにするには `--node <id|name|ip>` を使用します。

エイリアス: `openclaw exec-approvals`

関連項目: [Exec 承認](/ja-JP/tools/exec-approvals)、[Node](/ja-JP/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` は、要求された `tools.exec.*` 設定とローカルホストの承認ファイルを 1 回の操作で同期させる、**ローカル専用**の便利なコマンドです。

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

プリセット（`yolo`、`cautious`、`deny-all`）は、`host`、`security`、`ask`、`askFallback` をまとめて適用します。`set` は渡したフラグのみを適用し、受け付けた各値を検証します（`--host auto|sandbox|gateway|node`、`--security deny|allowlist|full`、`--ask off|on-miss|always`、`--ask-fallback deny|allowlist|full`）。

スコープ:

- ローカル設定ファイルとローカル承認ファイルをまとめて更新します。ポリシーを Gateway や Node ホストにプッシュすることはありません。
- `--host node` は拒否されます。Node の exec 承認は実行時に Node から取得されるため、ローカルの `exec-policy` では同期できません。代わりに `openclaw approvals set --node <id|name|ip>` を使用してください。
- `exec-policy show` は、ローカル承認ファイルから有効なポリシーを導出する代わりに、`host=node` スコープを実行時に Node によって管理されるものとして示します。

リモートホストの承認には、`openclaw approvals set --gateway` または `openclaw approvals set --node <id|name|ip>` を直接使用してください。

## 一般的なコマンド

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`get` は、ターゲットに対する有効な exec ポリシーとして、要求された `tools.exec` ポリシー、ホストの承認ファイルのポリシー、およびマージ後の有効な結果を表示します。Windows コンパニオンなど、ホストネイティブのポリシーを持つ Node では、OpenClaw の承認ファイルのポリシー計算を適用せず、そのポリシーを直接表示します。

ファイルベースの Node では、マージされたビューにホスト側で解決されたポリシースナップショットが必要です。古い Node では、Gateway が要求したポリシーがホストにも適用されると仮定せず、有効なポリシーを利用不可として表示します。

<Note>
セッション単位の `/exec` オーバーライドは含まれません。現在のデフォルトを確認するには、該当するセッションで `/exec` を実行してください。
</Note>

優先順位:

- ホストの承認ファイルが、強制適用可能な信頼できる唯一の情報源です。
- 要求された `tools.exec` ポリシーは意図を狭めたり広げたりできますが、有効な結果はホストのルールから導出されます。
- `--node` は、Node ホストの承認ファイルと Gateway の `tools.exec` ポリシーを組み合わせます（実行時には両方が適用されます）。
- Gateway 設定を利用できない場合、CLI は Node の承認スナップショットにフォールバックし、最終的な実行時ポリシーを計算できなかったことを示します。

## ファイルから承認を置き換える

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` は厳密な JSON だけでなく、JSON5 も受け付けます。`--file` または `--stdin` のいずれか一方を使用し、両方を同時に使用しないでください。

ホストネイティブの Windows Node は、独自のポリシー形式を使用します。

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  defaultAction: "deny",
  rules: [{ pattern: "hostname", action: "allow" }]
}
EOF
```

CLI はまず Node の現在のハッシュを読み取り、更新とともに送信します。そのため、同時に行われたローカル編集は上書きされず、拒否されます。この操作は Node のルール一覧全体を置き換えるため、`rules` は必須です。`defaultAction` は任意です。ネイティブポリシーが無効であると報告する Node は、リモートから設定できません。まずそのホストでポリシーを有効化または設定してください。ホストネイティブのポリシーは、`allowlist add|remove` ヘルパーをサポートしません。

## 「プロンプトを表示しない」/ YOLO の例

exec 承認で処理を停止させないホストでは、ホスト承認のデフォルトを `full` + `off` に設定します。

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

OpenClaw 承認ファイルを公開する Node では、同じ内容を `openclaw approvals set --node <id|name|ip> --stdin` で使用します。ホストネイティブの Node では、上記の所有者固有の形式が必要です。

これは **ホストの承認ファイル**のみを変更します。要求された OpenClaw ポリシーも一致させるには、次も設定します。

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

ここで `tools.exec.host=gateway` を明示しているのは、`host=auto` が依然として「利用可能な場合は sandbox、そうでなければ Gateway」を意味するためです。YOLO は承認に関するものであり、ルーティングに関するものではありません。sandbox が設定されている場合でもホストで exec を実行するには、`gateway`（または `/exec host=gateway`）を使用してください。

省略された `askFallback` のデフォルトは `deny` です。プロンプトを表示しない動作を維持する必要がある UI のないホストをアップグレードする場合は、`askFallback: "full"` を明示的に設定してください。

ローカルマシンだけで同じ意図を適用するショートカット:

```bash
openclaw exec-policy preset yolo
```

## 許可リストヘルパー

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## 共通オプション

`get`、`set`、`allowlist add|remove` はすべて次をサポートします。

- `--node <id|name|ip>`（ID、名前、IP、または ID プレフィックスを解決します。`openclaw nodes` と同じリゾルバーです）
- `--gateway`
- 共通の Node RPC オプション: `--url`、`--token`、`--timeout`、`--json`

ターゲットフラグを指定しない場合、ディスク上のローカル承認ファイルが対象になります。

`allowlist add|remove` は `--agent <id>` もサポートします（デフォルトは `"*"` で、すべてのエージェントに適用されます）。

## 注記

- Node ホストは `system.execApprovals.get/set` を公開する必要があります（macOS アプリ、ヘッドレス Node ホスト、または Windows コンパニオン）。
- 承認ファイルはホストごとに OpenClaw の状態ディレクトリへ保存されます。`$OPENCLAW_STATE_DIR/exec-approvals.json`、または変数が未設定の場合は `~/.openclaw/exec-approvals.json` です。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [Exec 承認](/ja-JP/tools/exec-approvals)

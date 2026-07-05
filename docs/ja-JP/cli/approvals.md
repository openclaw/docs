---
read_when:
    - CLI から exec 承認を編集したい
    - Gateway または Node ホストで許可リストを管理する必要がある
summary: '`openclaw approvals` と `openclaw exec-policy` の CLI リファレンス'
title: 承認
x-i18n:
    generated_at: "2026-07-05T11:09:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 30e1f55104d5f762d7eec95f2bba5e0cc52acb3005255aa9fd5c121fb959a0e7
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

**ローカルホスト**、**Gateway ホスト**、または**ノードホスト**の exec 承認を管理します。ターゲットフラグを指定しない場合、コマンドはディスク上のローカル承認ファイルを読み書きします。Gateway を対象にするには `--gateway` を使い、特定のノードを対象にするには `--node <id|name|ip>` を使います。

エイリアス: `openclaw exec-approvals`

関連: [Exec 承認](/ja-JP/tools/exec-approvals)、[ノード](/ja-JP/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` は、要求された `tools.exec.*` 設定とローカルホストの承認ファイルを 1 ステップで同期する、**ローカル専用**の便利コマンドです。

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

プリセット (`yolo`, `cautious`, `deny-all`) は `host`、`security`、`ask`、`askFallback` をまとめて適用します。`set` は渡したフラグだけを適用します。受け付けられる各値は検証されます (`--host auto|sandbox|gateway|node`, `--security deny|allowlist|full`, `--ask off|on-miss|always`, `--ask-fallback deny|allowlist|full`)。

スコープ:

- ローカル設定ファイルとローカル承認ファイルをまとめて更新します。ポリシーを Gateway やノードホストへプッシュしません。
- `--host node` は拒否されます。ノードの exec 承認は実行時にノードから取得されるため、ローカルの `exec-policy` では同期できません。代わりに `openclaw approvals set --node <id|name|ip>` を使ってください。
- `exec-policy show` は、ローカル承認ファイルから有効ポリシーを導出する代わりに、`host=node` スコープを実行時にノード管理として表示します。

リモートホストの承認には、`openclaw approvals set --gateway` または `openclaw approvals set --node <id|name|ip>` を直接使ってください。

## よく使うコマンド

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`get` は対象の有効な exec ポリシーを表示します。要求された `tools.exec` ポリシー、ホスト承認ファイルのポリシー、そしてマージ後の有効な結果です。

優先順位:

- ホスト承認ファイルが、強制適用可能な信頼できる情報源です。
- 要求された `tools.exec` ポリシーは意図を狭めたり広げたりできますが、有効な結果はホストルールから導出されます。
- `--node` は、ノードホストの承認ファイルと Gateway の `tools.exec` ポリシーを組み合わせます。どちらも実行時に適用されます。
- Gateway 設定を利用できない場合、CLI はノード承認スナップショットにフォールバックし、最終的な実行時ポリシーを計算できなかったことを示します。

## ファイルから承認を置き換える

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` は厳密な JSON だけでなく JSON5 も受け付けます。`--file` と `--stdin` のどちらか一方を使い、両方は使わないでください。

## 「プロンプトを出さない」/ YOLO の例

exec 承認で停止すべきでないホストでは、ホスト承認のデフォルトを `full` + `off` に設定します。

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

ノード版: 同じ本文を `openclaw approvals set --node <id|name|ip> --stdin` とともに使います。

これは**ホスト承認ファイル**だけを変更します。要求される OpenClaw ポリシーも揃えるには、次も設定します。

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

ここで `tools.exec.host=gateway` を明示しているのは、`host=auto` が依然として「サンドボックスが利用可能ならサンドボックス、そうでなければ Gateway」を意味するためです。YOLO は承認に関するものであり、ルーティングに関するものではありません。サンドボックスが設定されていてもホスト exec を使いたい場合は、`gateway` (または `/exec host=gateway`) を使ってください。

省略された `askFallback` のデフォルトは `deny` です。UI のないホストを、プロンプトを出さない動作のままアップグレードする場合は、`askFallback: "full"` を明示的に設定してください。

同じ意図をローカルマシンだけで実現するローカルショートカット:

```bash
openclaw exec-policy preset yolo
```

## Allowlist ヘルパー

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## 共通オプション

`get`、`set`、`allowlist add|remove` はすべて次をサポートします。

- `--node <id|name|ip>` (id、名前、IP、または id プレフィックスを解決します。`openclaw nodes` と同じリゾルバーです)
- `--gateway`
- 共有ノード RPC オプション: `--url`、`--token`、`--timeout`、`--json`

ターゲットフラグがない場合は、ディスク上のローカル承認ファイルを意味します。

`allowlist add|remove` は `--agent <id>` もサポートします (デフォルトは `"*"` で、すべてのエージェントに適用されます)。

## 注意

- ノードホストは `system.execApprovals.get/set` を公開している必要があります (macOS アプリまたはヘッドレスノードホスト)。
- 承認ファイルは OpenClaw state dir 内にホストごとに保存されます。`$OPENCLAW_STATE_DIR/exec-approvals.json`、または変数が未設定の場合は `~/.openclaw/exec-approvals.json` です。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Exec 承認](/ja-JP/tools/exec-approvals)

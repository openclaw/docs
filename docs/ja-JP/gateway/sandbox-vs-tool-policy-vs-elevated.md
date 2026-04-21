---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'ツールがブロックされる理由: sandbox ランタイム、ツールの許可/拒否ポリシー、昇格された exec ゲート'
title: Sandbox とツールポリシーと昇格権限
x-i18n:
    generated_at: "2026-04-21T04:45:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: a85378343df0594be451212cb4c95b349a0cc7cd1f242b9306be89903a450db1
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

# Sandbox とツールポリシーと昇格権限

OpenClaw には、関連しているものの異なる 3 つの制御があります。

1. **Sandbox**（`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`）は、**ツールがどこで実行されるか**（sandbox バックエンドか host か）を決定します。
2. **ツールポリシー**（`tools.*`、`tools.sandbox.tools.*`、`agents.list[].tools.*`）は、**どのツールが利用可能/許可されるか** を決定します。
3. **昇格権限**（`tools.elevated.*`、`agents.list[].tools.elevated.*`）は、sandbox 化されているときに sandbox の外で実行するための **exec 専用のエスケープハッチ** です（デフォルトでは `gateway`、または exec ターゲットが `node` に設定されている場合は `node`）。

## クイックデバッグ

インスペクタを使って、OpenClaw が _実際に_ 何をしているかを確認してください。

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

出力内容:

- 有効な sandbox モード/スコープ/ワークスペースアクセス
- セッションが現在 sandbox 化されているかどうか（main か non-main か）
- 有効な sandbox ツールの許可/拒否（およびそれが agent/global/default のどこから来たか）
- 昇格権限のゲートと修正用のキーパス

## Sandbox: ツールがどこで実行されるか

sandbox 化は `agents.defaults.sandbox.mode` によって制御されます。

- `"off"`: すべてが host 上で実行されます。
- `"non-main"`: non-main セッションのみが sandbox 化されます（グループ/チャネルでよくある「意外な」動作）。
- `"all"`: すべてが sandbox 化されます。

完全なマトリクス（スコープ、workspace マウント、イメージ）は [Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。

### バインドマウント（セキュリティの簡易チェック）

- `docker.binds` は sandbox ファイルシステムを _貫通_ します。マウントしたものは、指定したモード（`:ro` または `:rw`）でコンテナ内から見えるようになります。
- モードを省略した場合のデフォルトは読み書き可です。ソース/シークレットには `:ro` を優先してください。
- `scope: "shared"` は agent 単位の bind を無視します（global bind のみ適用されます）。
- OpenClaw は bind ソースを 2 回検証します。まず正規化されたソースパスに対して、その後で最も深い既存の祖先を通じた解決後に再度検証します。symlink 親を使ったエスケープでは、ブロック対象パスや許可ルートのチェックを回避できません。
- 存在しない leaf パスも安全に検査されます。`/workspace/alias-out/new-file` が symlink 化された親を通じてブロック対象パスや設定済み許可ルート外に解決される場合、その bind は拒否されます。
- `/var/run/docker.sock` を bind すると、実質的に sandbox に host 制御を渡すことになります。意図した場合にのみ行ってください。
- workspace アクセス（`workspaceAccess: "ro"`/`"rw"`）は bind モードとは独立しています。

## ツールポリシー: どのツールが存在し、呼び出せるか

重要なのは 2 つのレイヤーです。

- **ツールプロファイル**: `tools.profile` と `agents.list[].tools.profile`（ベースの許可リスト）
- **Provider ツールプロファイル**: `tools.byProvider[provider].profile` と `agents.list[].tools.byProvider[provider].profile`
- **グローバル/agent 単位のツールポリシー**: `tools.allow`/`tools.deny` と `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Provider ツールポリシー**: `tools.byProvider[provider].allow/deny` と `agents.list[].tools.byProvider[provider].allow/deny`
- **Sandbox ツールポリシー**（sandbox 化されているときのみ適用）: `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` と `agents.list[].tools.sandbox.tools.*`

経験則:

- `deny` が常に優先されます。
- `allow` が空でない場合、それ以外はすべてブロックされたものとして扱われます。
- ツールポリシーは絶対的な停止条件です。拒否された `exec` ツールを `/exec` で上書きすることはできません。
- `/exec` は、認可された送信者に対してセッションのデフォルトを変更するだけで、ツールアクセスを付与しません。
  Provider ツールキーは、`provider`（例: `google-antigravity`）または `provider/model`（例: `openai/gpt-5.4`）のどちらでも受け付けます。

### ツールグループ（短縮記法）

ツールポリシー（global、agent、sandbox）は、複数のツールに展開される `group:*` エントリをサポートします。

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

利用可能なグループ:

- `group:runtime`: `exec`, `process`, `code_execution`（`bash` は `exec` のエイリアスとして受け付けられます）
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`
- `group:media`: `image`, `image_generate`, `video_generate`, `tts`
- `group:openclaw`: すべての組み込み OpenClaw ツール（provider plugin は除く）

## 昇格権限: exec 専用の「host で実行」

昇格権限は追加のツールを付与しません。影響するのは `exec` のみです。

- sandbox 化されている場合、`/elevated on`（または `elevated: true` を付けた `exec`）で sandbox の外で実行されます（承認は引き続き適用される場合があります）。
- セッションの exec 承認をスキップするには `/elevated full` を使ってください。
- すでに直接実行されている場合、昇格権限は実質的には no-op です（それでもゲート対象です）。
- 昇格権限は skill スコープではなく、ツールの許可/拒否も上書きしません。
- 昇格権限は `host=auto` からの任意のクロスホスト上書きを付与しません。通常の exec ターゲットルールに従い、設定済み/セッションのターゲットがすでに `node` の場合にのみ `node` を維持します。
- `/exec` は昇格権限とは別物です。認可された送信者向けにセッション単位の exec デフォルトを調整するだけです。

ゲート:

- 有効化: `tools.elevated.enabled`（および必要に応じて `agents.list[].tools.elevated.enabled`）
- 送信者許可リスト: `tools.elevated.allowFrom.<provider>`（および必要に応じて `agents.list[].tools.elevated.allowFrom.<provider>`）

[Elevated Mode](/ja-JP/tools/elevated) を参照してください。

## よくある「sandbox jail」の修正方法

### 「ツール X は sandbox ツールポリシーによりブロックされています」

修正用キー（どれか 1 つを選択）:

- sandbox を無効化する: `agents.defaults.sandbox.mode=off`（または agent 単位で `agents.list[].sandbox.mode=off`）
- sandbox 内でそのツールを許可する:
  - `tools.sandbox.tools.deny`（または agent 単位の `agents.list[].tools.sandbox.tools.deny`）から削除する
  - または `tools.sandbox.tools.allow`（または agent 単位の allow）に追加する

### 「main だと思っていたのに、なぜ sandbox 化されているのですか？」

`"non-main"` モードでは、グループ/チャネルキーは main では _ありません_。main セッションキー（`sandbox explain` に表示されます）を使うか、モードを `"off"` に切り替えてください。

## 関連項目

- [Sandboxing](/ja-JP/gateway/sandboxing) -- sandbox の完全なリファレンス（モード、スコープ、バックエンド、イメージ）
- [Multi-Agent Sandbox & Tools](/ja-JP/tools/multi-agent-sandbox-tools) -- agent 単位の上書きと優先順位
- [Elevated Mode](/ja-JP/tools/elevated)

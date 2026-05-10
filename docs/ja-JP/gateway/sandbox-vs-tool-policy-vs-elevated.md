---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'ツールがブロックされる理由: サンドボックスランタイム、ツールの許可/拒否ポリシー、および昇格 exec ゲート'
title: サンドボックス、ツールポリシー、昇格の違い
x-i18n:
    generated_at: "2026-05-10T19:36:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d670aa4f2e0f2265590e0de6198de841e744d210bbc54d291cb448d368e63b6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw には、関連するものの異なる 3 つの制御があります。

1. **サンドボックス** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) は、**ツールをどこで実行するか** (サンドボックスバックエンドかホストか) を決めます。
2. **ツールポリシー** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) は、**どのツールを利用可能/許可するか**を決めます。
3. **昇格** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) は、サンドボックス化されているときに (`gateway` がデフォルト、または exec ターゲットが `node` に設定されている場合は `node`) サンドボックス外で実行するための **exec 専用の脱出口**です。

## クイックデバッグ

インスペクターを使って、OpenClaw が_実際に_何をしているかを確認します。

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

出力内容:

- 有効なサンドボックスモード/スコープ/ワークスペースアクセス
- セッションが現在サンドボックス化されているかどうか (main と non-main)
- 有効なサンドボックスツールの許可/拒否 (および agent/global/default のどこから来たか)
- 昇格ゲートと修正用キーのパス

## サンドボックス: ツールを実行する場所

サンドボックス化は `agents.defaults.sandbox.mode` で制御されます。

- `"off"`: すべてがホスト上で実行されます。
- `"non-main"`: non-main セッションだけがサンドボックス化されます (グループ/チャネルでよくある「意外な挙動」)。
- `"all"`: すべてがサンドボックス化されます。

完全なマトリクス (スコープ、ワークスペースマウント、イメージ) は [サンドボックス化](/ja-JP/gateway/sandboxing) を参照してください。

### バインドマウント (セキュリティの簡易確認)

- `docker.binds` はサンドボックスのファイルシステムを_貫通_します。マウントしたものは、設定したモード (`:ro` または `:rw`) でコンテナ内から見えます。
- モードを省略した場合のデフォルトは読み書き可能です。ソース/シークレットには `:ro` を優先してください。
- `scope: "shared"` は agent ごとのバインドを無視します (グローバルバインドのみが適用されます)。
- OpenClaw はバインド元を 2 回検証します。まず正規化されたソースパスで検証し、その後、最も深い既存の祖先を通して解決した後に再度検証します。symlink 親による脱出では、ブロック済みパスや許可ルートのチェックを回避できません。
- 存在しないリーフパスも安全にチェックされます。`/workspace/alias-out/new-file` が symlink された親を通してブロック済みパスまたは設定済み許可ルート外に解決される場合、そのバインドは拒否されます。
- `/var/run/docker.sock` をバインドすると、実質的にホスト制御をサンドボックスに渡すことになります。意図している場合にのみ行ってください。
- ワークスペースアクセス (`workspaceAccess: "ro"`/`"rw"`) はバインドモードとは独立しています。

## ツールポリシー: どのツールが存在し呼び出せるか

重要なレイヤーは 2 つあります。

- **ツールプロファイル**: `tools.profile` と `agents.list[].tools.profile` (ベースの許可リスト)
- **プロバイダーツールプロファイル**: `tools.byProvider[provider].profile` と `agents.list[].tools.byProvider[provider].profile`
- **グローバル/agent ごとのツールポリシー**: `tools.allow`/`tools.deny` と `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **プロバイダーツールポリシー**: `tools.byProvider[provider].allow/deny` と `agents.list[].tools.byProvider[provider].allow/deny`
- **サンドボックスツールポリシー** (サンドボックス化されている場合にのみ適用): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` と `agents.list[].tools.sandbox.tools.*`

経験則:

- `deny` が常に優先されます。
- `allow` が空でない場合、それ以外はすべてブロック扱いになります。
- ツールポリシーはハードストップです。`/exec` では拒否された `exec` ツールを上書きできません。
- ツールポリシーは名前でツールの可用性をフィルタリングします。`exec` 内部の副作用は検査しません。`exec` が許可されている場合、`write`、`edit`、`apply_patch` を拒否してもシェルコマンドが読み取り専用になるわけではありません。
- `/exec` は承認された送信者のセッションデフォルトだけを変更します。ツールアクセスは付与しません。
  プロバイダーツールキーは `provider` (例: `google-antigravity`) または `provider/model` (例: `openai/gpt-5.4`) のどちらも受け付けます。

### ツールグループ (省略記法)

ツールポリシー (グローバル、agent、サンドボックス) は、複数のツールに展開される `group:*` エントリをサポートします。

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

- `group:runtime`: `exec`, `process`, `code_execution` (`bash` は `exec` のエイリアスとして受け付けられます)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
  読み取り専用 agent では、サンドボックスのファイルシステムポリシーまたは別のホスト境界が読み取り専用制約を強制していない限り、変更系ファイルシステムツールに加えて `group:runtime` も拒否してください。
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `heartbeat_respond`, `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`, `update_plan`
- `group:media`: `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`: すべての組み込み OpenClaw ツール (プロバイダー Plugin は除外)

## 昇格: exec 専用の「ホスト上で実行」

昇格は追加のツールを付与**しません**。`exec` にのみ影響します。

- サンドボックス化されている場合、`/elevated on` (または `elevated: true` を指定した `exec`) はサンドボックス外で実行されます (承認は引き続き適用される場合があります)。
- セッションの exec 承認をスキップするには `/elevated full` を使います。
- すでに直接実行している場合、昇格は実質的に no-op です (それでもゲートは適用されます)。
- 昇格は **Skills スコープではなく**、ツールの許可/拒否を上書き**しません**。
- 昇格は `host=auto` から任意のクロスホスト上書きを付与しません。通常の exec ターゲットルールに従い、設定済み/セッションターゲットがすでに `node` の場合にのみ `node` を保持します。
- `/exec` は昇格とは別です。承認された送信者のセッションごとの exec デフォルトのみを調整します。

ゲート:

- 有効化: `tools.elevated.enabled` (必要に応じて `agents.list[].tools.elevated.enabled`)
- 送信者の許可リスト: `tools.elevated.allowFrom.<provider>` (必要に応じて `agents.list[].tools.elevated.allowFrom.<provider>`)

[昇格モード](/ja-JP/tools/elevated) を参照してください。

## よくある「サンドボックス隔離」修正

### 「ツール X がサンドボックスツールポリシーでブロックされた」

修正用キー (いずれかを選択):

- サンドボックスを無効化: `agents.defaults.sandbox.mode=off` (または agent ごとの `agents.list[].sandbox.mode=off`)
- サンドボックス内でツールを許可:
  - `tools.sandbox.tools.deny` から削除する (または agent ごとの `agents.list[].tools.sandbox.tools.deny`)
  - または `tools.sandbox.tools.allow` に追加する (または agent ごとの allow)

### 「これは main だと思っていたのに、なぜサンドボックス化されているのか」

`"non-main"` モードでは、グループ/チャネルキーは main _ではありません_。main セッションキー (`sandbox explain` に表示) を使うか、モードを `"off"` に切り替えてください。

## 関連

- [サンドボックス化](/ja-JP/gateway/sandboxing) -- 完全なサンドボックスリファレンス (モード、スコープ、バックエンド、イメージ)
- [マルチ agent のサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) -- agent ごとの上書きと優先順位
- [昇格モード](/ja-JP/tools/elevated)

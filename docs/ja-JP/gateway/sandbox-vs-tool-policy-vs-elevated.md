---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'ツールがブロックされる理由: サンドボックスランタイム、ツールの許可/拒否ポリシー、昇格された実行ゲート'
title: Sandbox とツールポリシーと昇格
x-i18n:
    generated_at: "2026-07-05T11:26:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4b5263d956c9ff5ef148383a78feb7483f7d4ea23c31d62cc994ac2d85d0d150
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw には、関連しているが異なる 3 つの制御があります。

1. **サンドボックス** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) は、**ツールをどこで実行するか**（サンドボックスバックエンドかホストか）を決めます。
2. **ツールポリシー** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) は、**どのツールを利用可能または許可するか**を決めます。
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) は、サンドボックス化されているときにサンドボックス外で実行するための **`exec` 専用の脱出口**です（デフォルトでは `gateway`、または exec ターゲットが `node` に設定されている場合は `node`）。

## クイックデバッグ

インスペクターを使うと、OpenClaw が_実際に_何をしているかを確認できます。

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

出力される内容:

- 有効なサンドボックスモード、スコープ、ワークスペースアクセス
- セッションが現在サンドボックス化されているかどうか（main と non-main）
- 有効なサンドボックスツールの allow/deny（および agent/global/default のどこから来たか）
- Elevated のゲートと修正用のキーパス

## サンドボックス: ツールをどこで実行するか

サンドボックス化は `agents.defaults.sandbox.mode` で制御されます。

- `"off"`: すべてがホスト上で実行されます。
- `"non-main"`: non-main セッションだけがサンドボックス化されます（グループやチャンネルでよくある「意外な挙動」）。
- `"all"`: すべてがサンドボックス化されます。

`agents.defaults.sandbox.workspaceAccess` は、サンドボックスから見える範囲を制御します: `"none"`、`"ro"`、または `"rw"`。

完全なマトリクス（スコープ、ワークスペースマウント、イメージ）については、[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。

### バインドマウント（セキュリティのクイックチェック）

- `docker.binds` はサンドボックスのファイルシステムを_貫通_します。マウントしたものは、設定したモード（`:ro` または `:rw`）でコンテナ内から見えます。
- モードを省略するとデフォルトは読み書き可能です。ソースやシークレットには `:ro` を優先してください。
- `scope: "shared"` はエージェントごとの bind を無視します（グローバル bind だけが適用されます）。
- OpenClaw は bind ソースを 2 回検証します。まず正規化されたソースパスで検証し、その後、存在する最も深い祖先を通して解決した後に再度検証します。シンボリックリンクの親を使った脱出では、ブロック済みパスや許可済みルートのチェックを回避できません。
- 存在しないリーフパスも安全にチェックされます。`/workspace/alias-out/new-file` がシンボリックリンクされた親を通じてブロック済みパス、または設定された許可済みルートの外側に解決される場合、その bind は拒否されます。
- `/var/run/docker.sock` をバインドすると、実質的にホスト制御をサンドボックスへ渡すことになります。意図した場合にのみ行ってください。
- ワークスペースアクセス（`workspaceAccess`）は bind モードとは独立しています。

## ツールポリシー: どのツールが存在し呼び出し可能か

重要なレイヤーは次の 2 つです。

- **ツールプロファイル**: `tools.profile` と `agents.list[].tools.profile`（基本 allowlist）
- **プロバイダーツールプロファイル**: `tools.byProvider[provider].profile` と `agents.list[].tools.byProvider[provider].profile`
- **グローバル/エージェントごとのツールポリシー**: `tools.allow`/`tools.deny` と `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **プロバイダーツールポリシー**: `tools.byProvider[provider].allow/deny` と `agents.list[].tools.byProvider[provider].allow/deny`
- **サンドボックスツールポリシー**（サンドボックス化されている場合にのみ適用）: `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` と `agents.list[].tools.sandbox.tools.*`

経験則:

- `deny` が常に優先されます。
- `allow` が空でない場合、それ以外はすべてブロック扱いになります。
- ツールポリシーは最終的な停止条件です。`/exec` で拒否された `exec` ツールを上書きすることはできません。
- ツールポリシーは名前でツールの可用性をフィルタリングします。`exec` 内部の副作用は検査しません。`exec` が許可されている場合、`write`、`edit`、または `apply_patch` を拒否しても、シェルコマンドが読み取り専用になるわけではありません。
- `/exec` は認可された送信者のセッションデフォルトを変更するだけで、ツールアクセスを付与しません。
- プロバイダーツールキーは `provider`（例: `google-antigravity`）または `provider/model`（例: `openai/gpt-5.4`）のどちらも受け付けます。
- Gateway ログには、ツールポリシー手順がツールを削除した場合、またはサンドボックスツールポリシーが呼び出しをブロックした場合に、`agents/tool-policy` 監査エントリが含まれます。`openclaw logs` を使って、ルールラベル、設定キー、影響を受けたツール名を確認してください。

### ツールグループ（省略記法）

ツールポリシー（グローバル、エージェント、サンドボックス）は、複数のツールへ展開される `group:*` エントリをサポートします。

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

| グループ           | ツール                                                                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution`（`bash` は `exec` のエイリアスとして受け付けられます）                                                                 |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                    |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`                                   |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                             |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                     |
| `group:ui`         | `browser`, `canvas`                                                                                                                                       |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                    |
| `group:messaging`  | `message`                                                                                                                                                 |
| `group:nodes`      | `nodes`                                                                                                                                                   |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`                                                                  |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                      |
| `group:openclaw`   | ほとんどの組み込み OpenClaw ツール（`read`/`write`/`edit`/`apply_patch`/`exec`/`process` のファイルシステムおよびランタイムプリミティブ、`canvas`、プロバイダー Plugin は除外） |
| `group:plugins`    | 読み込まれたすべての Plugin 所有ツール。`bundle-mcp` を通じて公開される設定済み MCP サーバーを含みます                                                   |

読み取り専用エージェントでは、サンドボックスファイルシステムポリシーまたは別のホスト境界が読み取り専用制約を強制しない限り、変更系ファイルシステムツールに加えて `group:runtime` も拒否してください。

サンドボックス化された MCP サーバーでは、サンドボックスツールポリシーが 2 つ目の allow ゲートになります。`mcp.servers` が設定されているのに、サンドボックス化されたターンで組み込みツールしか表示されない場合は、`bundle-mcp`、`group:plugins`、または `outlook__send_mail` や `outlook__*` のようなサーバープレフィックス付き MCP ツール名/glob を `tools.sandbox.tools.alsoAllow` に追加し、その後 Gateway を再起動/再読み込みしてツールリストを再取得してください。サーバー glob はプロバイダーセーフな MCP サーバープレフィックスを使います。非 `-[A-Za-z0-9_-]` 文字は `-` になり、文字で始まらない名前には `mcp-` プレフィックスが付き、長いプレフィックスや重複するプレフィックスは切り詰められるかサフィックスが付く場合があります。

`openclaw doctor` は現在、`mcp.servers` 内の OpenClaw 管理サーバーについてこの形をチェックします。バンドルされた Plugin マニフェストや Claude `.mcp.json` から読み込まれた MCP サーバーも同じサンドボックスゲートを使いますが、この診断はまだそれらのソースを列挙しません。サンドボックス化されたターンでそれらのツールが消える場合は、同じ allowlist エントリを使用してください。

## Elevated: `exec` 専用の「ホスト上で実行」

Elevated は追加のツールを付与**しません**。`exec` にだけ影響します。

- サンドボックス化されている場合、`/elevated on`（または `elevated: true` 付きの `exec`）はサンドボックス外で実行します（承認は引き続き適用される場合があります）。
- セッションの exec 承認をスキップするには `/elevated full` を使用します。
- すでに直接実行されている場合、Elevated は実質的に no-op です（それでもゲートは適用されます）。
- Elevated は Skills スコープではなく、ツール allow/deny を上書き**しません**。
- Elevated は `host=auto` から任意のクロスホスト上書きを付与しません。通常の exec ターゲットルールに従い、設定済み/セッションターゲットがすでに `node` の場合にのみ `node` を維持します。
- `/exec` は Elevated とは別です。認可された送信者に対して、セッションごとの exec デフォルトを調整するだけです。

ゲート:

- 有効化: `tools.elevated.enabled`（および任意で `agents.list[].tools.elevated.enabled`）
- 送信者 allowlist: `tools.elevated.allowFrom.<provider>`（および任意で `agents.list[].tools.elevated.allowFrom.<provider>`）

[Elevated モード](/ja-JP/tools/elevated)を参照してください。

## よくある「サンドボックス隔離」の修正

### 「ツール X がサンドボックスツールポリシーでブロックされた」

修正キー（いずれかを選択）:

- サンドボックスを無効化: `agents.defaults.sandbox.mode=off`（またはエージェントごとに `agents.list[].sandbox.mode=off`）
- サンドボックス内でツールを許可:
  - `tools.sandbox.tools.deny` から削除する（またはエージェントごとの `agents.list[].tools.sandbox.tools.deny`）
  - または `tools.sandbox.tools.allow` に追加する（またはエージェントごとの allow）
- `openclaw logs` で `agents/tool-policy` エントリを確認してください。サンドボックスモードと、allow ルールまたは deny ルールのどちらがツールをブロックしたかが記録されます。

### 「これは main だと思っていたのに、なぜサンドボックス化されているのか」

`"non-main"` モードでは、グループ/チャンネルキーは main では_ありません_。main セッションキー（`sandbox explain` で表示）を使用するか、モードを `"off"` に切り替えてください。

## 関連

- [サンドボックス化](/ja-JP/gateway/sandboxing) -- 完全なサンドボックスリファレンス（モード、スコープ、バックエンド、イメージ）
- [マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) -- エージェントごとの上書きと優先順位
- [Elevated モード](/ja-JP/tools/elevated)

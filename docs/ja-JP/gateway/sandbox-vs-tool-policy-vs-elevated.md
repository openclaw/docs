---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: ツールがブロックされる理由：サンドボックスランタイム、ツールの許可／拒否ポリシー、昇格実行ゲート
title: サンドボックス、ツールポリシー、昇格の違い
x-i18n:
    generated_at: "2026-07-12T14:36:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2fce3dab337e89fc2b196f59e763a169d76206ce2695744e00252c158b161260
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw には、関連しているものの異なる 3 つの制御があります。

1. **サンドボックス**（`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`）は、**ツールを実行する場所**（サンドボックスバックエンドまたはホスト）を決定します。
2. **ツールポリシー**（`tools.*`、`tools.sandbox.tools.*`、`agents.list[].tools.*`）は、**利用可能または許可されるツール**を決定します。
3. **昇格実行**（`tools.elevated.*`、`agents.list[].tools.elevated.*`）は、サンドボックス化されている場合に、サンドボックス外で実行するための **exec 専用の緊急回避手段**です（デフォルトは `gateway`。exec ターゲットが `node` に設定されている場合は `node`）。

## クイックデバッグ

インスペクターを使用して、OpenClaw が_実際に_何をしているかを確認します。

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

次の情報が出力されます。

- 有効なサンドボックスのモード、スコープ、ワークスペースアクセス
- セッションが現在サンドボックス化されているかどうか（メインと非メイン）
- 有効なサンドボックスツールの許可／拒否設定（およびエージェント、グローバル、デフォルトのどこから取得されたか）
- 昇格実行のゲートと修正用キーのパス

## サンドボックス：ツールを実行する場所

サンドボックス化は `agents.defaults.sandbox.mode` で制御されます。

- `"off"`：すべてがホスト上で実行されます。
- `"non-main"`：非メインセッションのみがサンドボックス化されます（グループ／チャンネルでよくある「予想外」の原因です）。
- `"all"`：すべてがサンドボックス化されます。

`agents.defaults.sandbox.workspaceAccess` は、サンドボックスから見える範囲を制御します。設定値は `"none"`、`"ro"`、または `"rw"` です。

完全なマトリクス（スコープ、ワークスペースのマウント、イメージ）については、[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。

### バインドマウント（セキュリティのクイックチェック）

- `docker.binds` はサンドボックスのファイルシステムを_貫通_します。マウントしたものはすべて、指定したモード（`:ro` または `:rw`）でコンテナ内から見えます。
- モードを省略した場合のデフォルトは読み書き可能です。ソースやシークレットには `:ro` を推奨します。
- `scope: "shared"` では、エージェントごとのバインドは無視されます（グローバルバインドのみが適用されます）。
- OpenClaw はバインド元を 2 回検証します。最初に正規化されたソースパスを検証し、次に存在する最深の祖先を通じて解決した後、再度検証します。親シンボリックリンクを利用した脱出によって、ブロック対象パスや許可ルートのチェックを回避することはできません。
- 存在しない末端パスも安全にチェックされます。`/workspace/alias-out/new-file` がシンボリックリンクになっている親を通じてブロック対象パスまたは設定済みの許可ルート外に解決される場合、そのバインドは拒否されます。
- `/var/run/docker.sock` をバインドすると、事実上サンドボックスにホストの制御権を渡すことになります。意図的な場合にのみ行ってください。
- ワークスペースアクセス（`workspaceAccess`）は、バインドモードとは独立しています。

## ツールポリシー：存在するツールと呼び出し可能なツール

次のレイヤーが重要です。

- **ツールプロファイル**：`tools.profile` および `agents.list[].tools.profile`（基本許可リスト）
- **プロバイダーツールプロファイル**：`tools.byProvider[provider].profile` および `agents.list[].tools.byProvider[provider].profile`
- **グローバル／エージェントごとのツールポリシー**：`tools.allow`/`tools.deny` および `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **プロバイダーツールポリシー**：`tools.byProvider[provider].allow/deny` および `agents.list[].tools.byProvider[provider].allow/deny`
- **サンドボックスツールポリシー**（サンドボックス化されている場合にのみ適用）：`tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` および `agents.list[].tools.sandbox.tools.*`

経験則：

- `deny` が常に優先されます。
- `allow` が空でない場合、それ以外はすべてブロック対象として扱われます。
- ツールポリシーは絶対的な制限です。`/exec` で、拒否された `exec` ツールを上書きすることはできません。
- ツールポリシーは名前に基づいてツールの可用性をフィルタリングします。`exec` 内部の副作用は検査しません。`exec` が許可されている場合、`write`、`edit`、または `apply_patch` を拒否しても、シェルコマンドが読み取り専用になるわけではありません。
- `/exec` は、認可された送信者に対するセッションのデフォルトのみを変更します。ツールへのアクセス権は付与しません。
- プロバイダーツールキーには、`provider`（例：`google-antigravity`）または `provider/model`（例：`openai/gpt-5.4`）のいずれかを指定できます。
- ツールポリシーのステップによってツールが削除された場合や、サンドボックスツールポリシーによって呼び出しがブロックされた場合、Gateway ログには `agents/tool-policy` 監査エントリが記録されます。ルールラベル、設定キー、影響を受けたツール名を確認するには、`openclaw logs` を使用してください。

### ツールグループ（略記）

ツールポリシー（グローバル、エージェント、サンドボックス）は、複数のツールに展開される `group:*` エントリをサポートします。

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

利用可能なグループ：

| グループ           | ツール                                                                                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`、`process`、`code_execution`（`bash` は `exec` のエイリアスとして使用できます）                                                                      |
| `group:fs`         | `read`、`write`、`edit`、`apply_patch`                                                                                                                     |
| `group:sessions`   | `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`sessions_yield`、`subagents`、`session_status`                                      |
| `group:memory`     | `memory_search`、`memory_get`                                                                                                                              |
| `group:web`        | `web_search`、`x_search`、`web_fetch`                                                                                                                      |
| `group:ui`         | `browser`、`canvas`                                                                                                                                        |
| `group:automation` | `heartbeat_respond`、`cron`、`gateway`                                                                                                                     |
| `group:messaging`  | `message`                                                                                                                                                  |
| `group:nodes`      | `nodes`、`computer`                                                                                                                                        |
| `group:agents`     | `agents_list`、`get_goal`、`create_goal`、`update_goal`、`update_plan`、`skill_workshop`                                                                     |
| `group:media`      | `image`、`image_generate`、`music_generate`、`video_generate`、`tts`                                                                                       |
| `group:openclaw`   | 組み込み OpenClaw ツールの大部分（`read`/`write`/`edit`/`apply_patch`/`exec`/`process` のファイルシステムおよびランタイムプリミティブ、`canvas`、プロバイダー Plugin を除く） |
| `group:plugins`    | `bundle-mcp` を通じて公開される設定済み MCP サーバーを含む、読み込まれた Plugin 所有のすべてのツール                                                       |

読み取り専用エージェントでは、サンドボックスのファイルシステムポリシーまたは別のホスト境界によって読み取り専用制約が適用されない限り、ファイルシステムを変更するツールに加えて `group:runtime` も拒否してください。

サンドボックス化された MCP サーバーでは、サンドボックスのツールポリシーが第2の許可ゲートになります。`mcp.servers` が設定されているにもかかわらず、サンドボックス化されたターンで組み込みツールしか表示されない場合は、`bundle-mcp`、`group:plugins`、または `outlook__send_mail` や `outlook__*` のようなサーバープレフィックス付きの MCP ツール名／glob を `tools.sandbox.tools.alsoAllow` に追加し、Gateway を再起動／再読み込みしてツール一覧を再取得してください。サーバーの glob では、プロバイダーで安全に使用できる MCP サーバープレフィックスを使用します。英数字・アンダースコア・ハイフン（`[A-Za-z0-9_-]`）以外の文字は `-` に変換され、文字で始まらない名前には `mcp-` プレフィックスが付き、長いプレフィックスや重複するプレフィックスは切り詰められるかサフィックスが付く場合があります。

現在、`openclaw doctor` は `mcp.servers` 内の OpenClaw が管理するサーバーについて、この形式を確認します。バンドルされた Plugin マニフェストまたは Claude の `.mcp.json` から読み込まれる MCP サーバーにも同じサンドボックスゲートが適用されますが、この診断ではまだそれらのソースを列挙しません。サンドボックス化されたターンでそれらのツールが表示されなくなった場合は、同じ許可リストエントリを使用してください。

## Elevated：exec 専用の「ホスト上で実行」

Elevated は追加のツールを許可**しません**。影響するのは `exec` のみです。

- サンドボックス化されている場合、`/elevated on`（または `elevated: true` を指定した `exec`）はサンドボックス外で実行されます（承認が引き続き適用される場合があります）。
- セッション中の exec の承認を省略するには、`/elevated full` を使用します。
- すでに直接実行している場合、elevated は実質的に何も行いません（引き続きゲートの対象です）。
- Elevated は Skills 単位では**なく**、ツールの許可／拒否を上書き**しません**。
- Elevated は `host=auto` から任意のホストをまたぐ上書きを許可しません。通常の exec ターゲットルールに従い、設定済みまたはセッションのターゲットがすでに `node` の場合にのみ `node` を維持します。
- `/exec` は elevated とは別です。認可された送信者に対するセッション単位の exec デフォルトを調整するだけです。

ゲート:

- 有効化: `tools.elevated.enabled`（および必要に応じて `agents.list[].tools.elevated.enabled`）
- 送信者許可リスト: `tools.elevated.allowFrom.<provider>`（および必要に応じて `agents.list[].tools.elevated.allowFrom.<provider>`）

[昇格モード](/ja-JP/tools/elevated)を参照してください。

## よくある「サンドボックスへの閉じ込め」の修正

### 「Tool X がサンドボックスのツールポリシーによってブロックされる」

修正用のキー（いずれか1つを選択）:

- サンドボックスを無効にする: `agents.defaults.sandbox.mode=off`（またはエージェントごとに `agents.list[].sandbox.mode=off`）
- サンドボックス内でツールを許可する:
  - `tools.sandbox.tools.deny`（またはエージェントごとの `agents.list[].tools.sandbox.tools.deny`）から削除する
  - または `tools.sandbox.tools.allow`（またはエージェントごとの許可リスト）に追加する
- `openclaw logs` で `agents/tool-policy` エントリを確認します。サンドボックスモードと、許可ルールまたは拒否ルールのどちらがツールをブロックしたかが記録されています。

### 「これは main だと思っていたのに、なぜサンドボックス化されているのですか？」

`"non-main"` モードでは、グループ/チャンネルキーは main では_ありません_。main セッションキー（`sandbox explain` に表示）を使用するか、モードを `"off"` に切り替えてください。

## 関連項目

- [サンドボックス化](/ja-JP/gateway/sandboxing) -- サンドボックスの完全なリファレンス（モード、スコープ、バックエンド、イメージ）
- [マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) -- エージェントごとのオーバーライドと優先順位
- [昇格モード](/ja-JP/tools/elevated)

---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: ツールがブロックされる理由：サンドボックスランタイム、ツールの許可／拒否ポリシー、昇格実行ゲート
title: サンドボックス、ツールポリシー、昇格の違い
x-i18n:
    generated_at: "2026-07-11T22:17:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fce3dab337e89fc2b196f59e763a169d76206ce2695744e00252c158b161260
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw には、関連しているものの異なる3つの制御があります。

1. **サンドボックス**（`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`）は、**ツールをどこで実行するか**（サンドボックスバックエンドまたはホスト）を決定します。
2. **ツールポリシー**（`tools.*`、`tools.sandbox.tools.*`、`agents.list[].tools.*`）は、**どのツールを利用可能／許可するか**を決定します。
3. **昇格**（`tools.elevated.*`、`agents.list[].tools.elevated.*`）は、サンドボックス化されている場合に、サンドボックス外で実行するための **`exec` 専用の脱出口**です（デフォルトは `gateway`。`exec` のターゲットが `node` に設定されている場合は `node`）。

## クイックデバッグ

OpenClaw が_実際に_何をしているか確認するには、インスペクターを使用します。

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

次の情報が出力されます。

- 有効なサンドボックスのモード／スコープ／ワークスペースアクセス
- セッションが現在サンドボックス化されているか（メインか非メインか）
- 有効なサンドボックスツールの許可／拒否（およびエージェント／グローバル／デフォルトのどこから取得されたか）
- 昇格ゲートと修正用キーのパス

## サンドボックス：ツールの実行場所

サンドボックス化は `agents.defaults.sandbox.mode` で制御します。

- `"off"`：すべてホスト上で実行します。
- `"non-main"`：非メインセッションのみサンドボックス化します（グループ／チャンネルでよくある「予想外」の原因です）。
- `"all"`：すべてサンドボックス化します。

`agents.defaults.sandbox.workspaceAccess` は、サンドボックスから参照できる範囲を制御します。指定値は `"none"`、`"ro"`、`"rw"` です。

完全な対応表（スコープ、ワークスペースのマウント、イメージ）については、[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。

### バインドマウント（セキュリティのクイックチェック）

- `docker.binds` はサンドボックスのファイルシステムを_貫通_します。マウントしたものは、設定したモード（`:ro` または `:rw`）でコンテナ内から参照できます。
- モードを省略した場合、デフォルトは読み書き可能です。ソースやシークレットには `:ro` を推奨します。
- `scope: "shared"` では、エージェント単位のバインドは無視されます（グローバルバインドのみ適用されます）。
- OpenClaw はバインド元を2回検証します。最初に正規化されたソースパスを検証し、次に存在する最深の祖先を経由して解決した後に再度検証します。親ディレクトリのシンボリックリンクを利用した脱出では、ブロック対象パスや許可ルートのチェックを回避できません。
- 存在しない末端パスも安全にチェックされます。`/workspace/alias-out/new-file` がシンボリックリンクの親を経由してブロック対象パスまたは設定済みの許可ルート外へ解決される場合、そのバインドは拒否されます。
- `/var/run/docker.sock` をバインドすると、実質的にサンドボックスへホストの制御権を渡すことになります。意図した場合にのみ行ってください。
- ワークスペースアクセス（`workspaceAccess`）は、バインドモードとは独立しています。

## ツールポリシー：存在し、呼び出し可能なツール

次のレイヤーが重要です。

- **ツールプロファイル**：`tools.profile` および `agents.list[].tools.profile`（基本許可リスト）
- **プロバイダーツールプロファイル**：`tools.byProvider[provider].profile` および `agents.list[].tools.byProvider[provider].profile`
- **グローバル／エージェント単位のツールポリシー**：`tools.allow`/`tools.deny` および `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **プロバイダーツールポリシー**：`tools.byProvider[provider].allow/deny` および `agents.list[].tools.byProvider[provider].allow/deny`
- **サンドボックスツールポリシー**（サンドボックス化されている場合のみ適用）：`tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` および `agents.list[].tools.sandbox.tools.*`

基本ルール：

- `deny` が常に優先されます。
- `allow` が空でない場合、それ以外はすべてブロック対象として扱われます。
- ツールポリシーは最終的な制限です。`/exec` で拒否された `exec` ツールを上書きすることはできません。
- ツールポリシーは名前に基づいてツールの可用性をフィルタリングし、`exec` 内部の副作用は検査しません。`exec` が許可されている場合、`write`、`edit`、`apply_patch` を拒否しても、シェルコマンドが読み取り専用になるわけではありません。
- `/exec` は、許可された送信者に対するセッションのデフォルトのみを変更し、ツールへのアクセス権は付与しません。
- プロバイダーツールキーには、`provider`（例：`google-antigravity`）または `provider/model`（例：`openai/gpt-5.4`）を指定できます。
- ツールポリシーのステップによってツールが削除された場合や、サンドボックスツールポリシーによって呼び出しがブロックされた場合、Gateway のログには `agents/tool-policy` 監査エントリが記録されます。ルールラベル、設定キー、影響を受けたツール名を確認するには、`openclaw logs` を使用してください。

### ツールグループ（省略記法）

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
| `group:runtime`    | `exec`、`process`、`code_execution`（`bash` は `exec` の別名として受け付けられます）                                                                        |
| `group:fs`         | `read`、`write`、`edit`、`apply_patch`                                                                                                                     |
| `group:sessions`   | `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`sessions_yield`、`subagents`、`session_status`                                    |
| `group:memory`     | `memory_search`、`memory_get`                                                                                                                              |
| `group:web`        | `web_search`、`x_search`、`web_fetch`                                                                                                                      |
| `group:ui`         | `browser`、`canvas`                                                                                                                                        |
| `group:automation` | `heartbeat_respond`、`cron`、`gateway`                                                                                                                     |
| `group:messaging`  | `message`                                                                                                                                                  |
| `group:nodes`      | `nodes`、`computer`                                                                                                                                        |
| `group:agents`     | `agents_list`、`get_goal`、`create_goal`、`update_goal`、`update_plan`、`skill_workshop`                                                                   |
| `group:media`      | `image`、`image_generate`、`music_generate`、`video_generate`、`tts`                                                                                       |
| `group:openclaw`   | OpenClaw の組み込みツールの大部分（ファイルシステムおよびランタイムのプリミティブである `read`/`write`/`edit`/`apply_patch`/`exec`/`process`、`canvas`、プロバイダーPluginを除く） |
| `group:plugins`    | `bundle-mcp` を通じて公開される設定済み MCP サーバーを含む、ロード済みPlugin所有のすべてのツール                                                           |

読み取り専用エージェントでは、サンドボックスのファイルシステムポリシーまたは別のホスト境界によって読み取り専用制約が強制されていない限り、ファイルシステムを変更するツールに加えて `group:runtime` も拒否してください。

サンドボックス化された MCP サーバーでは、サンドボックスツールポリシーが2つ目の許可ゲートになります。`mcp.servers` が設定されているにもかかわらず、サンドボックス化されたターンに組み込みツールしか表示されない場合は、`bundle-mcp`、`group:plugins`、または `outlook__send_mail` や `outlook__*` のようなサーバープレフィックス付きの MCP ツール名／glob を `tools.sandbox.tools.alsoAllow` に追加し、Gateway を再起動／再読み込みしてツール一覧を再取得してください。サーバーの glob では、プロバイダーで安全に使用できる MCP サーバープレフィックスを使用します。`[A-Za-z0-9_-]` 以外の文字は `-` になり、英字で始まらない名前には `mcp-` プレフィックスが付き、長いプレフィックスや重複するプレフィックスは切り詰められたりサフィックスが付けられたりする場合があります。

現在、`openclaw doctor` は `mcp.servers` 内の OpenClaw 管理サーバーについて、この構成をチェックします。バンドルされたPluginマニフェストまたは Claude の `.mcp.json` から読み込まれた MCP サーバーにも同じサンドボックスゲートが使用されますが、この診断ではまだそれらのソースを列挙しません。サンドボックス化されたターンでツールが表示されなくなった場合は、同じ許可リストエントリを使用してください。

## 昇格：`exec` 専用の「ホスト上で実行」

昇格によって追加のツールが付与されることは**ありません**。影響するのは `exec` のみです。

- サンドボックス化されている場合、`/elevated on`（または `elevated: true` を指定した `exec`）はサンドボックス外で実行されます（承認が引き続き適用される場合があります）。
- セッションで `exec` の承認を省略するには、`/elevated full` を使用します。
- すでに直接実行している場合、昇格は実質的に何も行いません（ゲートは引き続き適用されます）。
- 昇格は Skills 単位ではなく、ツールの許可／拒否を上書きすることも**ありません**。
- 昇格では、`host=auto` から任意の別ホストへ上書きすることはできません。通常の `exec` ターゲットルールに従い、設定済み／セッションのターゲットがすでに `node` の場合にのみ `node` を維持します。
- `/exec` は昇格とは別です。許可された送信者に対して、セッション単位の `exec` デフォルトを調整するだけです。

ゲート：

- 有効化：`tools.elevated.enabled`（および必要に応じて `agents.list[].tools.elevated.enabled`）
- 送信者の許可リスト：`tools.elevated.allowFrom.<provider>`（および必要に応じて `agents.list[].tools.elevated.allowFrom.<provider>`）

[昇格モード](/ja-JP/tools/elevated)を参照してください。

## よくある「サンドボックス監獄」の解決方法

### 「ツール X がサンドボックスツールポリシーによってブロックされた」

修正用キー（いずれか1つを選択）：

- サンドボックスを無効化：`agents.defaults.sandbox.mode=off`（またはエージェント単位の `agents.list[].sandbox.mode=off`）
- サンドボックス内でツールを許可：
  - `tools.sandbox.tools.deny`（またはエージェント単位の `agents.list[].tools.sandbox.tools.deny`）からそのツールを削除する
  - または `tools.sandbox.tools.allow`（またはエージェント単位の許可リスト）に追加する
- `openclaw logs` で `agents/tool-policy` エントリを確認してください。サンドボックスモードと、許可ルールまたは拒否ルールのどちらがツールをブロックしたかが記録されています。

### 「メインだと思っていたのに、なぜサンドボックス化されているのか？」

`"non-main"` モードでは、グループ／チャンネルのキーはメインでは_ありません_。メインセッションキー（`sandbox explain` に表示）を使用するか、モードを `"off"` に切り替えてください。

## 関連項目

- [サンドボックス化](/ja-JP/gateway/sandboxing) -- サンドボックスの完全なリファレンス（モード、スコープ、バックエンド、イメージ）
- [マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) -- エージェント単位の上書きと優先順位
- [昇格モード](/ja-JP/tools/elevated)

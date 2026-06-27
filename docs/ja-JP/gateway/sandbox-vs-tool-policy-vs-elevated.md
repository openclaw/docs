---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'ツールがブロックされる理由: サンドボックスランタイム、ツールの許可/拒否ポリシー、および昇格された exec ゲート'
title: サンドボックスとツールポリシーと昇格
x-i18n:
    generated_at: "2026-06-27T11:33:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4156cc494a6aff4fb9c44cbca8fdfde10a3343dde624c485833dd7508e4c4d6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw には、関連するが異なる 3 つの制御があります。

1. **サンドボックス** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) は、**ツールをどこで実行するか** (サンドボックスバックエンドかホストか) を決めます。
2. **ツールポリシー** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) は、**どのツールを利用可能または許可するか**を決めます。
3. **昇格** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) は、サンドボックス化されているときにサンドボックスの外で実行するための **exec専用の脱出口**です (デフォルトでは `gateway`、または exec ターゲットが `node` に設定されている場合は `node`)。

## クイックデバッグ

インスペクターを使って、OpenClaw が_実際に_何をしているかを確認します。

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

出力される内容:

- 有効なサンドボックスのモード/スコープ/ワークスペースアクセス
- セッションが現在サンドボックス化されているかどうか (main と non-main)
- 有効なサンドボックスツールの許可/拒否 (およびそれがエージェント/グローバル/デフォルトのどこから来たか)
- 昇格ゲートと修正用のキーパス

## サンドボックス: ツールをどこで実行するか

サンドボックス化は `agents.defaults.sandbox.mode` で制御されます。

- `"off"`: すべてがホスト上で実行されます。
- `"non-main"`: non-main セッションだけがサンドボックス化されます (グループ/チャンネルでよくある「意外な」動作)。
- `"all"`: すべてがサンドボックス化されます。

完全なマトリクス (スコープ、ワークスペースマウント、イメージ) については、[サンドボックス化](/ja-JP/gateway/sandboxing) を参照してください。

### バインドマウント (セキュリティのクイックチェック)

- `docker.binds` はサンドボックスのファイルシステムを_貫通_します。マウントしたものは、設定したモード (`:ro` または `:rw`) でコンテナ内から見えます。
- モードを省略するとデフォルトは読み書き可能です。ソース/シークレットには `:ro` を推奨します。
- `scope: "shared"` はエージェントごとの bind を無視します (グローバル bind だけが適用されます)。
- OpenClaw は bind ソースを 2 回検証します。最初は正規化されたソースパスで、次に存在する最も深い祖先を通して解決した後でもう一度検証します。シンボリックリンク親による脱出は、ブロックパスや許可ルートのチェックを迂回しません。
- 存在しないリーフパスも安全にチェックされます。`/workspace/alias-out/new-file` がシンボリックリンクされた親を通してブロックされたパス、または設定済みの許可ルート外に解決される場合、その bind は拒否されます。
- `/var/run/docker.sock` を bind すると、実質的にホスト制御をサンドボックスに渡すことになります。意図した場合にのみ行ってください。
- ワークスペースアクセス (`workspaceAccess: "ro"`/`"rw"`) は bind モードとは独立しています。

## ツールポリシー: どのツールが存在し、呼び出せるか

重要なレイヤーは 2 つあります。

- **ツールプロファイル**: `tools.profile` と `agents.list[].tools.profile` (基本の許可リスト)
- **プロバイダーツールプロファイル**: `tools.byProvider[provider].profile` と `agents.list[].tools.byProvider[provider].profile`
- **グローバル/エージェントごとのツールポリシー**: `tools.allow`/`tools.deny` と `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **プロバイダーツールポリシー**: `tools.byProvider[provider].allow/deny` と `agents.list[].tools.byProvider[provider].allow/deny`
- **サンドボックスツールポリシー** (サンドボックス化されている場合のみ適用): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` と `agents.list[].tools.sandbox.tools.*`

目安:

- `deny` が常に優先されます。
- `allow` が空でない場合、それ以外はすべてブロックされたものとして扱われます。
- ツールポリシーは最終的な停止点です。`/exec` は拒否された `exec` ツールを上書きできません。
- ツールポリシーは名前でツールの可用性をフィルタリングします。`exec` の内部で起こる副作用は検査しません。`exec` が許可されている場合、`write`、`edit`、`apply_patch` を拒否してもシェルコマンドが読み取り専用になるわけではありません。
- `/exec` は、承認済み送信者に対してセッションのデフォルトを変更するだけです。ツールアクセスを付与するものではありません。
  プロバイダーツールキーは、`provider` (例: `google-antigravity`) または `provider/model` (例: `openai/gpt-5.4`) のどちらも受け付けます。
- Gateway ログには、ツールポリシーのステップがツールを削除した場合、またはサンドボックスツールポリシーが呼び出しをブロックした場合に、`agents/tool-policy` 監査エントリが含まれます。ルールラベル、設定キー、影響を受けたツール名を確認するには `openclaw logs` を使います。

### ツールグループ (省略記法)

ツールポリシー (グローバル、エージェント、サンドボックス) は、複数のツールに展開される `group:*` エントリをサポートします。

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

- `group:runtime`: `exec`, `process`, `code_execution` (`bash` は `exec` の別名として受け付けられます)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
  読み取り専用エージェントでは、サンドボックスのファイルシステムポリシーまたは別のホスト境界が読み取り専用制約を強制していない限り、変更系のファイルシステムツールに加えて `group:runtime` も拒否してください。
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
- `group:plugins`: 読み込まれた Plugin 所有のすべてのツール。`bundle-mcp` 経由で公開された設定済み MCP サーバーを含みます

サンドボックス化された MCP サーバーでは、サンドボックスツールポリシーが 2 つ目の許可ゲートになります。`mcp.servers` が設定されているのに、サンドボックス化されたターンで組み込みツールしか表示されない場合は、`bundle-mcp`、`group:plugins`、または `outlook__send_mail` や `outlook__*` のようなサーバープレフィックス付き MCP ツール名/グロブを `tools.sandbox.tools.alsoAllow` に追加し、その後 Gateway を再起動/再読み込みしてツール一覧を再取得してください。サーバーグロブは、プロバイダー安全な MCP サーバープレフィックスを使用します。非 ` [A-Za-z0-9_-]` 文字は `-` になり、文字で始まらない名前には `mcp-` プレフィックスが付き、長いプレフィックスや重複するプレフィックスは切り詰められたりサフィックスが付いたりする場合があります。

`openclaw doctor` は現在、`mcp.servers` 内の OpenClaw 管理サーバーについてこの形をチェックします。バンドルされた Plugin マニフェストまたは Claude `.mcp.json` から読み込まれた MCP サーバーも同じサンドボックスゲートを使用しますが、この診断はまだそれらのソースを列挙しません。サンドボックス化されたターンでそれらのツールが消える場合は、同じ許可リストエントリを使用してください。

## 昇格: exec専用の「ホスト上で実行」

昇格は追加のツールを付与**しません**。`exec` にのみ影響します。

- サンドボックス化されている場合、`/elevated on` (または `elevated: true` を指定した `exec`) はサンドボックス外で実行します (承認は引き続き適用される場合があります)。
- セッションで exec 承認をスキップするには `/elevated full` を使います。
- すでに直接実行している場合、昇格は実質的に no-op です (それでもゲートは適用されます)。
- 昇格は Skills スコープではなく、ツールの許可/拒否を上書き**しません**。
- 昇格は `host=auto` から任意のクロスホスト上書きを付与しません。通常の exec ターゲットルールに従い、設定済み/セッションターゲットがすでに `node` の場合にのみ `node` を維持します。
- `/exec` は昇格とは別です。承認済み送信者に対して、セッションごとの exec デフォルトを調整するだけです。

ゲート:

- 有効化: `tools.elevated.enabled` (および任意で `agents.list[].tools.elevated.enabled`)
- 送信者許可リスト: `tools.elevated.allowFrom.<provider>` (および任意で `agents.list[].tools.elevated.allowFrom.<provider>`)

[昇格モード](/ja-JP/tools/elevated) を参照してください。

## よくある「サンドボックス監禁」の修正

### 「ツール X がサンドボックスツールポリシーによってブロックされた」

修正用キー (いずれかを選択):

- サンドボックスを無効化: `agents.defaults.sandbox.mode=off` (またはエージェントごとの `agents.list[].sandbox.mode=off`)
- サンドボックス内でツールを許可:
  - `tools.sandbox.tools.deny` (またはエージェントごとの `agents.list[].tools.sandbox.tools.deny`) から削除する
  - または `tools.sandbox.tools.allow` (またはエージェントごとの allow) に追加する
- `agents/tool-policy` エントリを `openclaw logs` で確認してください。サンドボックスモードと、allow ルールまたは deny ルールのどちらがツールをブロックしたかが記録されます。

### 「これは main だと思っていたのに、なぜサンドボックス化されているのか」

`"non-main"` モードでは、グループ/チャンネルキーは main では_ありません_。メインセッションキー (`sandbox explain` に表示されます) を使うか、モードを `"off"` に切り替えてください。

## 関連

- [サンドボックス化](/ja-JP/gateway/sandboxing) -- 完全なサンドボックスリファレンス (モード、スコープ、バックエンド、イメージ)
- [マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) -- エージェントごとの上書きと優先順位
- [昇格モード](/ja-JP/tools/elevated)

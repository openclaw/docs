---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'ツールがブロックされる理由: サンドボックスランタイム、ツールの許可/拒否ポリシー、および昇格された exec ゲート'
title: サンドボックス、ツールポリシー、昇格の違い
x-i18n:
    generated_at: "2026-05-06T09:05:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd303355774e3d73161b5704ba664d7418160e9b6792a904c7d5092e0351b320
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw には、関連するものの異なる 3 つの制御があります。

1. **サンドボックス** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) は、**ツールがどこで実行されるか** (サンドボックスバックエンドかホストか) を決めます。
2. **ツールポリシー** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) は、**どのツールが利用可能/許可されるか**を決めます。
3. **昇格** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) は、サンドボックス化されている場合にサンドボックス外で実行するための **exec 専用の脱出口**です (デフォルトは `gateway`、または exec ターゲットが `node` に設定されている場合は `node`)。

## クイックデバッグ

OpenClaw が_実際に_何をしているかを確認するには、インスペクターを使います。

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

出力内容:

- 有効なサンドボックスモード/スコープ/ワークスペースアクセス
- セッションが現在サンドボックス化されているかどうか (main と non-main)
- 有効なサンドボックスツールの許可/拒否 (およびそれがエージェント/グローバル/デフォルトのどれに由来するか)
- 昇格ゲートと修正用キーのパス

## サンドボックス: ツールが実行される場所

サンドボックス化は `agents.defaults.sandbox.mode` で制御されます。

- `"off"`: すべてがホスト上で実行されます。
- `"non-main"`: non-main セッションだけがサンドボックス化されます (グループ/チャンネルでよくある「想定外」)。
- `"all"`: すべてがサンドボックス化されます。

完全なマトリクス (スコープ、ワークスペースマウント、イメージ) については、[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。

### バインドマウント (セキュリティクイックチェック)

- `docker.binds` はサンドボックスのファイルシステムを_貫通_します。マウントしたものは、設定したモード (`:ro` または `:rw`) でコンテナ内から見えるようになります。
- モードを省略した場合のデフォルトは読み書き可能です。ソース/シークレットには `:ro` を優先してください。
- `scope: "shared"` はエージェントごとのバインドを無視します (グローバルバインドだけが適用されます)。
- OpenClaw はバインド元を 2 回検証します。まず正規化されたソースパスで検証し、次に存在する最も深い祖先を解決した後でもう一度検証します。シンボリックリンクの親を使った脱出で、ブロック済みパスや許可済みルートのチェックを迂回することはできません。
- 存在しないリーフパスも安全にチェックされます。`/workspace/alias-out/new-file` がシンボリックリンク化された親を通じてブロック済みパス、または設定済みの許可済みルート外に解決される場合、そのバインドは拒否されます。
- `/var/run/docker.sock` をバインドすると、事実上ホスト制御をサンドボックスに渡すことになります。意図している場合にのみ行ってください。
- ワークスペースアクセス (`workspaceAccess: "ro"`/`"rw"`) はバインドモードとは独立しています。

## ツールポリシー: どのツールが存在し呼び出せるか

重要なレイヤーは 2 つあります。

- **ツールプロファイル**: `tools.profile` と `agents.list[].tools.profile` (ベース許可リスト)
- **プロバイダーツールプロファイル**: `tools.byProvider[provider].profile` と `agents.list[].tools.byProvider[provider].profile`
- **グローバル/エージェントごとのツールポリシー**: `tools.allow`/`tools.deny` と `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **プロバイダーツールポリシー**: `tools.byProvider[provider].allow/deny` と `agents.list[].tools.byProvider[provider].allow/deny`
- **サンドボックスツールポリシー** (サンドボックス化されている場合にのみ適用): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` と `agents.list[].tools.sandbox.tools.*`

経験則:

- `deny` は常に優先されます。
- `allow` が空でない場合、それ以外はすべてブロック扱いになります。
- ツールポリシーは最終的な遮断点です。`/exec` で拒否された `exec` ツールを上書きすることはできません。
- `/exec` は認可済み送信者のセッションデフォルトを変更するだけです。ツールアクセスを付与するものではありません。
  プロバイダーツールキーは、`provider` (例: `google-antigravity`) または `provider/model` (例: `openai/gpt-5.4`) のどちらも受け付けます。

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
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `heartbeat_respond`, `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`, `update_plan`
- `group:media`: `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`: すべての組み込み OpenClaw ツール (プロバイダープラグインは除く)

## 昇格: exec 専用の「ホストで実行」

昇格は追加のツールを付与**しません**。`exec` にのみ影響します。

- サンドボックス化されている場合、`/elevated on` (または `elevated: true` 付きの `exec`) はサンドボックス外で実行されます (承認は引き続き適用される場合があります)。
- セッションで exec 承認をスキップするには `/elevated full` を使います。
- すでに直接実行されている場合、昇格は実質的に no-op です (ただしゲートは適用されます)。
- 昇格は **Skills スコープではなく**、ツールの許可/拒否を上書き**しません**。
- 昇格は `host=auto` から任意のクロスホスト上書きを付与するものではありません。通常の exec ターゲットルールに従い、設定済み/セッションターゲットがすでに `node` の場合にのみ `node` を保持します。
- `/exec` は昇格とは別です。認可済み送信者に対するセッションごとの exec デフォルトを調整するだけです。

ゲート:

- 有効化: `tools.elevated.enabled` (および任意で `agents.list[].tools.elevated.enabled`)
- 送信者の許可リスト: `tools.elevated.allowFrom.<provider>` (および任意で `agents.list[].tools.elevated.allowFrom.<provider>`)

[昇格モード](/ja-JP/tools/elevated)を参照してください。

## よくある「サンドボックスの閉じ込め」の修正

### 「ツール X がサンドボックスツールポリシーによってブロックされました」

修正用キー (いずれかを選択):

- サンドボックスを無効化: `agents.defaults.sandbox.mode=off` (またはエージェントごとに `agents.list[].sandbox.mode=off`)
- サンドボックス内でツールを許可:
  - `tools.sandbox.tools.deny` (またはエージェントごとの `agents.list[].tools.sandbox.tools.deny`) から削除する
  - または `tools.sandbox.tools.allow` (またはエージェントごとの allow) に追加する

### 「これは main だと思っていたのに、なぜサンドボックス化されているのですか?」

`"non-main"` モードでは、グループ/チャンネルキーは main では_ありません_。main セッションキー (`sandbox explain` に表示されます) を使うか、モードを `"off"` に切り替えてください。

## 関連

- [サンドボックス化](/ja-JP/gateway/sandboxing) -- サンドボックスの完全なリファレンス (モード、スコープ、バックエンド、イメージ)
- [マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) -- エージェントごとの上書きと優先順位
- [昇格モード](/ja-JP/tools/elevated)

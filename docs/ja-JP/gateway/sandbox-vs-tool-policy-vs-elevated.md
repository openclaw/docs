---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'ツールがブロックされる理由: サンドボックスランタイム、ツールの許可/拒否ポリシー、昇格された exec ゲート'
title: サンドボックス、ツールポリシー、昇格権限の違い
x-i18n:
    generated_at: "2026-05-06T05:06:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 516632295f10c29f87047ad3eebd842e35ab2a8effa4f8a6108e87f58cea3e1b
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw には、関連しているが異なる 3 つの制御があります。

1. **サンドボックス** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) は、**ツールがどこで実行されるか** (サンドボックスバックエンドかホストか) を決めます。
2. **ツールポリシー** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) は、**どのツールが利用可能または許可されるか**を決めます。
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) は、サンドボックス化されているときにサンドボックス外で実行するための **exec 専用の退避口**です (デフォルトでは `gateway`、または exec ターゲットが `node` に設定されている場合は `node`)。

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
- 有効なサンドボックスツールの許可/拒否 (および agent/global/default のどこから来たか)
- elevated のゲートと修正用キーのパス

## サンドボックス: ツールが実行される場所

サンドボックス化は `agents.defaults.sandbox.mode` で制御されます。

- `"off"`: すべてがホスト上で実行されます。
- `"non-main"`: non-main セッションだけがサンドボックス化されます (グループ/チャンネルでよくある「意外な挙動」)。
- `"all"`: すべてがサンドボックス化されます。

完全なマトリクス (スコープ、ワークスペースマウント、イメージ) については、[サンドボックス化](/ja-JP/gateway/sandboxing) を参照してください。

### バインドマウント (セキュリティ簡易チェック)

- `docker.binds` はサンドボックスのファイルシステムに_穴を開けます_: マウントしたものは、設定したモード (`:ro` または `:rw`) でコンテナ内から見えるようになります。
- モードを省略するとデフォルトは読み書き可能です。ソース/シークレットには `:ro` を推奨します。
- `scope: "shared"` はエージェントごとのバインドを無視します (グローバルバインドだけが適用されます)。
- OpenClaw はバインド元を 2 回検証します。最初は正規化されたソースパスで、その後、存在する最も深い祖先を通して解決した後にもう一度検証します。シンボリックリンク親による脱出では、ブロック済みパスや許可ルートのチェックを回避できません。
- 存在しないリーフパスも安全にチェックされます。`/workspace/alias-out/new-file` がシンボリックリンクされた親を通じてブロック済みパスまたは設定済みの許可ルート外へ解決される場合、そのバインドは拒否されます。
- `/var/run/docker.sock` をバインドすると、事実上サンドボックスにホスト制御を渡すことになります。意図している場合にのみ行ってください。
- ワークスペースアクセス (`workspaceAccess: "ro"`/`"rw"`) は、バインドモードとは独立しています。

## ツールポリシー: どのツールが存在し、呼び出せるか

重要なレイヤーは 2 つあります。

- **ツールプロファイル**: `tools.profile` と `agents.list[].tools.profile` (ベースの許可リスト)
- **プロバイダーツールプロファイル**: `tools.byProvider[provider].profile` と `agents.list[].tools.byProvider[provider].profile`
- **グローバル/エージェントごとのツールポリシー**: `tools.allow`/`tools.deny` と `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **プロバイダーツールポリシー**: `tools.byProvider[provider].allow/deny` と `agents.list[].tools.byProvider[provider].allow/deny`
- **サンドボックスツールポリシー** (サンドボックス化されている場合にのみ適用): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` と `agents.list[].tools.sandbox.tools.*`

経験則:

- `deny` が常に優先されます。
- `allow` が空でない場合、それ以外はすべてブロック扱いになります。
- ツールポリシーが最終的な停止条件です。`/exec` は拒否された `exec` ツールを上書きできません。
- `/exec` は認可された送信者のセッションデフォルトだけを変更します。ツールアクセスは付与しません。
  プロバイダーツールキーは `provider` (例: `google-antigravity`) または `provider/model` (例: `openai/gpt-5.4`) のどちらも受け付けます。

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

- `group:runtime`: `exec`, `process`, `code_execution` (`bash` は
  `exec` の別名として受け付けられます)
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
- `group:openclaw`: すべての組み込み OpenClaw ツール (プロバイダー Plugin は除く)

## Elevated: exec 専用の「ホストで実行」

Elevated は追加のツールを付与**しません**。`exec` にだけ影響します。

- サンドボックス化されている場合、`/elevated on` (または `elevated: true` を指定した `exec`) はサンドボックス外で実行されます (承認が引き続き適用される場合があります)。
- セッションの exec 承認を省略するには `/elevated full` を使用します。
- すでに直接実行している場合、elevated は実質的に no-op です (それでもゲートは適用されます)。
- Elevated は Skills のスコープではなく、ツールの allow/deny を上書き**しません**。
- Elevated は `host=auto` から任意のクロスホスト上書きを付与しません。通常の exec ターゲットルールに従い、設定済み/セッションターゲットがすでに `node` の場合にのみ `node` を保持します。
- `/exec` は elevated とは別です。認可された送信者のセッションごとの exec デフォルトだけを調整します。

ゲート:

- 有効化: `tools.elevated.enabled` (必要に応じて `agents.list[].tools.elevated.enabled`)
- 送信者の許可リスト: `tools.elevated.allowFrom.<provider>` (必要に応じて `agents.list[].tools.elevated.allowFrom.<provider>`)

[Elevated Mode](/ja-JP/tools/elevated) を参照してください。

## 一般的な「サンドボックスの閉じ込め」の修正

### 「ツール X がサンドボックスツールポリシーによりブロックされました」

修正用キー (いずれかを選択):

- サンドボックスを無効化: `agents.defaults.sandbox.mode=off` (またはエージェントごとの `agents.list[].sandbox.mode=off`)
- サンドボックス内でツールを許可:
  - `tools.sandbox.tools.deny` から削除する (またはエージェントごとの `agents.list[].tools.sandbox.tools.deny`)
  - または `tools.sandbox.tools.allow` に追加する (またはエージェントごとの allow)

### 「これは main だと思っていたのに、なぜサンドボックス化されているのですか?」

`"non-main"` モードでは、グループ/チャンネルキーは main では_ありません_。main セッションキー (`sandbox explain` に表示されます) を使うか、モードを `"off"` に切り替えてください。

## 関連

- [サンドボックス化](/ja-JP/gateway/sandboxing) -- サンドボックスの完全リファレンス (モード、スコープ、バックエンド、イメージ)
- [マルチエージェントサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) -- エージェントごとの上書きと優先順位
- [Elevated Mode](/ja-JP/tools/elevated)

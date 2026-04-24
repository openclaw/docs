---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'ツールがブロックされる理由: サンドボックスランタイム、ツールの許可/拒否ポリシー、特権 exec ゲート'
title: サンドボックス vs ツールポリシー vs 特権実行
x-i18n:
    generated_at: "2026-04-24T04:59:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 74bb73023a3f7a85a0c020b2e8df69610ab8f8e60f8ab6142f8da7810dc08429
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

OpenClaw には、関連しているものの異なる 3 つの制御があります。

1. **サンドボックス**（`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`）は、**ツールがどこで実行されるか**（サンドボックスバックエンドかホストか）を決めます。
2. **ツールポリシー**（`tools.*`、`tools.sandbox.tools.*`、`agents.list[].tools.*`）は、**どのツールが利用可能/許可されるか**を決めます。
3. **特権実行**（`tools.elevated.*`、`agents.list[].tools.elevated.*`）は、サンドボックス化されているときにサンドボックスの外で実行するための **exec 専用のエスケープハッチ** です（デフォルトは `gateway`、または exec ターゲットが `node` に設定されている場合は `node`）。

## クイックデバッグ

OpenClaw が**実際に**何をしているかを見るには inspector を使います。

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

出力内容:

- 実効サンドボックスモード/スコープ/ワークスペースアクセス
- セッションが現在サンドボックス化されているかどうか（main か non-main か）
- 実効サンドボックスツール allow/deny（およびそれが agent/global/default のどこ由来か）
- 特権実行ゲートと修正用キーパス

## サンドボックス: ツールがどこで実行されるか

サンドボックス化は `agents.defaults.sandbox.mode` で制御されます。

- `"off"`: すべてホストで実行されます。
- `"non-main"`: non-main セッションだけがサンドボックス化されます（グループ/チャンネルでよくある「意外な」挙動）。
- `"all"`: すべてサンドボックス化されます。

完全なマトリクス（スコープ、ワークスペースマウント、イメージ）については [Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。

### バインドマウント（セキュリティの簡易確認）

- `docker.binds` はサンドボックスファイルシステムを**貫通**します。マウントしたものは、設定したモード（`:ro` または `:rw`）でコンテナ内に見えるようになります。
- モードを省略した場合のデフォルトは read-write です。ソース/シークレットには `:ro` を推奨します。
- `scope: "shared"` はエージェントごとの binds を無視します（グローバル bind のみ適用）。
- OpenClaw は bind ソースを 2 回検証します。最初に正規化されたソースパスで、その後、最も深い既存の祖先を通して解決した後でも再度検証します。シンボリックリンク親を使ったエスケープでは、blocked-path や allowed-root チェックを回避できません。
- 存在しない末端パスも安全に検査されます。`/workspace/alias-out/new-file` が、シンボリックリンクされた親を通じて blocked path や設定済み許可ルート外へ解決される場合、その bind は拒否されます。
- `/var/run/docker.sock` を bind すると、実質的にホスト制御をサンドボックスへ渡すことになります。意図的な場合にのみ行ってください。
- ワークスペースアクセス（`workspaceAccess: "ro"`/`"rw"`）は bind モードとは独立しています。

## ツールポリシー: どのツールが存在し/呼び出せるか

重要なのは 2 つのレイヤーです。

- **ツールプロファイル**: `tools.profile` と `agents.list[].tools.profile`（ベース許可リスト）
- **プロバイダーツールプロファイル**: `tools.byProvider[provider].profile` と `agents.list[].tools.byProvider[provider].profile`
- **グローバル/エージェントごとのツールポリシー**: `tools.allow`/`tools.deny` と `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **プロバイダーツールポリシー**: `tools.byProvider[provider].allow/deny` と `agents.list[].tools.byProvider[provider].allow/deny`
- **サンドボックスツールポリシー**（サンドボックス化されているときのみ適用）: `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` と `agents.list[].tools.sandbox.tools.*`

経験則:

- `deny` が常に優先されます。
- `allow` が空でない場合、それ以外はすべてブロック扱いです。
- ツールポリシーが最終的な停止点です。`/exec` では拒否された `exec` ツールを上書きできません。
- `/exec` は、認可された送信者のセッションデフォルトを変更するだけで、ツールアクセスを付与しません。
  プロバイダーツールキーは `provider`（例 `google-antigravity`）または `provider/model`（例 `openai/gpt-5.4`）のどちらも受け付けます。

### ツールグループ（省略形）

ツールポリシー（グローバル、agent、sandbox）は、複数のツールに展開される `group:*` エントリをサポートします。

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

- `group:runtime`: `exec`, `process`, `code_execution`（`bash` は
  `exec` の別名として受け付け）
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
- `group:openclaw`: すべての組み込み OpenClaw ツール（provider Plugin は除外）

## 特権実行: exec 専用の「ホストで実行」

特権実行は追加のツールを**付与しません**。影響するのは `exec` のみです。

- サンドボックス化されている場合、`/elevated on`（または `elevated: true` を付けた `exec`）はサンドボックス外で実行されます（承認は引き続き必要な場合があります）。
- セッション中の exec 承認をスキップするには `/elevated full` を使います。
- すでに直接実行中なら、特権実行は実質的に no-op です（それでもゲートはあります）。
- 特権実行は **Skill スコープではなく**、ツール allow/deny を上書き**しません**。
- 特権実行は `host=auto` からの任意の cross-host 上書きを付与しません。通常の exec ターゲットルールに従い、設定済み/セッションのターゲットがすでに `node` の場合にのみ `node` を維持します。
- `/exec` は特権実行とは別です。認可された送信者向けに、セッションごとの exec デフォルトを調整するだけです。

ゲート:

- 有効化: `tools.elevated.enabled`（および任意で `agents.list[].tools.elevated.enabled`）
- 送信者許可リスト: `tools.elevated.allowFrom.<provider>`（および任意で `agents.list[].tools.elevated.allowFrom.<provider>`）

[Elevated Mode](/ja-JP/tools/elevated) を参照してください。

## よくある「サンドボックスの檻」修正

### 「ツール X がサンドボックスツールポリシーによりブロックされた」

修正用キー（いずれかを選択）:

- サンドボックスを無効化: `agents.defaults.sandbox.mode=off`（またはエージェントごとに `agents.list[].sandbox.mode=off`）
- サンドボックス内でそのツールを許可:
  - `tools.sandbox.tools.deny`（またはエージェントごとの `agents.list[].tools.sandbox.tools.deny`）から削除する
  - または `tools.sandbox.tools.allow`（またはエージェントごとの allow）に追加する

### 「これが main だと思っていたのに、なぜサンドボックス化されているのか？」

`"non-main"` モードでは、group/channel キーは _main_ ではありません。main セッションキー（`sandbox explain` に表示されます）を使うか、モードを `"off"` に切り替えてください。

## 関連

- [Sandboxing](/ja-JP/gateway/sandboxing) -- 完全なサンドボックスリファレンス（モード、スコープ、バックエンド、イメージ）
- [Multi-Agent Sandbox & Tools](/ja-JP/tools/multi-agent-sandbox-tools) -- エージェントごとの上書きと優先順位
- [Elevated Mode](/ja-JP/tools/elevated)

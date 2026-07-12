---
read_when:
    - OpenClaw エージェントランタイムのコードまたはテストに取り組む
    - エージェントランタイムのリント、型チェック、ライブテストのフローを実行する
summary: OpenClaw エージェントランタイムの開発ワークフロー：ビルド、テスト、ライブ検証
title: OpenClaw エージェントランタイムのワークフロー
x-i18n:
    generated_at: "2026-07-12T14:35:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 044f05779bef4ad18478081ba44d84356723c8a0be764440aa9d2b976d167324
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

OpenClaw リポジトリのエージェントランタイム（`src/agents/`）向け開発者ワークフロー。

## 型チェックと lint

- デフォルトのローカルゲート: `pnpm check`（型チェック、lint、ポリシーガード）
- ビルドゲート: 変更がビルド出力、パッケージング、遅延読み込み、またはモジュール境界に影響する可能性がある場合は `pnpm build`
- push 前の完全なゲート: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`

## エージェントランタイムテストの実行

エージェントランタイムのユニットテストスイートを実行します。

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

最初の glob には、`agent-tools*`、`agent-settings`、および
`agent-tool-definition-adapter*` の各スイートも含まれます。

ライブテストはユニットテスト設定から除外されています。ライブテスト用の
ラッパーを使用して実行してください（`OPENCLAW_LIVE_TEST=1` を設定し、プロバイダーの認証情報が必要です）。

```bash
pnpm test:live src/agents/embedded-agent-runner-extraparams.live.test.ts
```

## 手動テスト

- Gateway を開発モードで実行します（`OPENCLAW_SKIP_CHANNELS=1` によりチャンネル接続をスキップします）: `pnpm gateway:dev`
- Gateway 経由でエージェントのターンを1回トリガーします: `pnpm openclaw agent --message "Hello" --thinking low`
- 対話型デバッグには TUI を使用します: `pnpm tui`

ツール呼び出しの動作を確認するには、`read` または `exec` アクションを実行するようプロンプトで指示し、
ツールのストリーミングとペイロード処理を観察します。

## クリーンな状態へのリセット

状態は OpenClaw の状態ディレクトリに保存されます。デフォルトは `~/.openclaw` で、
`$OPENCLAW_STATE_DIR` が設定されている場合はその値が使用されます。このディレクトリからの相対パスは次のとおりです。

| パス                                           | 保存内容                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `openclaw.json`                                | 設定                                                             |
| `state/openclaw.sqlite`                        | 共有ランタイム状態データベース                                      |
| `agents/<agentId>/agent/openclaw-agent.sqlite` | エージェント単位のモデル認証プロファイル（API キー + OAuth）とランタイム状態 |
| `credentials/`                                 | 認証プロファイルストア外のプロバイダー／チャンネル認証情報        |
| `agents/<agentId>/sessions/`                   | トランスクリプト履歴とレガシーセッションの移行元            |
| `sessions/`                                    | レガシーな単一エージェント用セッションストア（古いインストールのみ）              |
| `workspace/`                                   | デフォルトのエージェントワークスペース（追加のエージェントは `workspace-<agentId>` を使用）   |

完全にリセットするには、これらのパスを削除します。より限定的なリセットは次のとおりです。

- セッションのみ: `agents/<agentId>/agent/openclaw-agent.sqlite` は削除しないでください。セッション行は、エージェント単位の他の状態とともにそこに保存されています。1つのチャットで新しいセッションを開始するには `/new` または `/reset` を使用し、セッションのメンテナンスには `openclaw sessions cleanup` を使用します。
- 認証を維持: `agents/<agentId>/agent/openclaw-agent.sqlite` と `credentials/` をそのまま残します。

レガシーな `auth-profiles.json` ファイルは、ランタイムでは読み込まれなくなりました。
`openclaw doctor --fix` を実行すると、これらが SQLite ストアにインポートされます。

## リファレンス

- [テスト](/ja-JP/help/testing)
- [はじめに](/ja-JP/start/getting-started)

## 関連項目

- [OpenClaw エージェントランタイムのアーキテクチャ](/ja-JP/agent-runtime-architecture)

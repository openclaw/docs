---
read_when:
    - OpenClaw エージェントランタイムのコードまたはテストに取り組む
    - agent-runtime の lint、typecheck、live test フローの実行
summary: 'OpenClaw エージェントランタイムの開発者ワークフロー: ビルド、テスト、ライブ検証'
title: OpenClaw エージェントランタイムのワークフロー
x-i18n:
    generated_at: "2026-06-27T11:57:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbe2a192ff7954577f8cbeae33676cbfd330f297d31c1917d2ab52898c2c5064
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

OpenClaw で OpenClaw エージェントランタイムに取り組むための健全なワークフロー。

## 型チェックと lint

- デフォルトのローカルゲート: `pnpm check`
- ビルドゲート: 変更がビルド出力、パッケージング、または遅延読み込み/モジュール境界に影響する可能性がある場合は `pnpm build`
- エージェントランタイム変更の完全なランディングゲート: `pnpm check && pnpm test`

## エージェントランタイムテストの実行

Vitest で agent-runtime テストセットを直接実行します。

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-tools*.test.ts" \
  "src/agents/agent-settings.test.ts" \
  "src/agents/agent-tool-definition-adapter*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

ライブプロバイダー演習を含めるには:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/embedded-agent-runner-extraparams.live.test.ts
```

これは主要なエージェントランタイムのユニットスイートを対象にします。

- `src/agents/agent-*.test.ts`
- `src/agents/embedded-agent-*.test.ts`
- `src/agents/agent-tools*.test.ts`
- `src/agents/agent-settings.test.ts`
- `src/agents/agent-tool-definition-adapter.test.ts`
- `src/agents/agent-hooks/*.test.ts`

## 手動テスト

推奨フロー:

- 開発モードで Gateway を実行します。
  - `pnpm gateway:dev`
- エージェントを直接トリガーします。
  - `pnpm openclaw agent --message "Hello" --thinking low`
- インタラクティブなデバッグには TUI を使用します。
  - `pnpm tui`

ツール呼び出しの動作については、`read` または `exec` アクションをプロンプトし、ツールストリーミングとペイロード処理を確認できるようにします。

## クリーンスレートリセット

状態は OpenClaw 状態ディレクトリの下にあります。デフォルトは `~/.openclaw` です。`OPENCLAW_STATE_DIR` が設定されている場合は、代わりにそのディレクトリを使用します。

すべてをリセットするには:

- 設定用の `openclaw.json`
- モデル認証プロファイル（API キー + OAuth）用の `agents/<agentId>/agent/auth-profiles.json`
- 認証プロファイルストアの外にまだ存在するプロバイダー/チャネル状態用の `credentials/`
- エージェントセッション履歴用の `agents/<agentId>/sessions/`
- セッションインデックス用の `agents/<agentId>/sessions/sessions.json`
- レガシーパスが存在する場合は `sessions/`
- 空のワークスペースが必要な場合は `workspace/`

セッションだけをリセットしたい場合は、そのエージェントの `agents/<agentId>/sessions/` を削除します。認証を保持したい場合は、`agents/<agentId>/agent/auth-profiles.json` と `credentials/` 配下のプロバイダー状態をそのまま残します。

## 参考資料

- [テスト](/ja-JP/help/testing)
- [はじめに](/ja-JP/start/getting-started)

## 関連

- [OpenClaw エージェントランタイムアーキテクチャ](/ja-JP/agent-runtime-architecture)

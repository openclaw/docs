---
read_when:
    - Pi 統合コードやテストに取り組んでいる場合
    - Pi 固有の lint、typecheck、ライブテストフローを実行している場合
summary: 'Pi 統合向け開発ワークフロー: ビルド、テスト、ライブ検証'
title: Pi 開発ワークフロー
x-i18n:
    generated_at: "2026-04-24T05:07:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb626bf21bc731b8ca7bb2a48692e17c8b93f2b6ffa471ed9e70d9c91cd57149
    source_path: pi-dev.md
    workflow: 15
---

このガイドは、OpenClaw で Pi 統合に取り組むための無理のないワークフローをまとめたものです。

## Type Checking と Linting

- デフォルトのローカルゲート: `pnpm check`
- ビルドゲート: 変更がビルド出力、パッケージング、または lazy-loading / module 境界に影響し得る場合は `pnpm build`
- Pi に大きく関わる変更の完全な着地ゲート: `pnpm check && pnpm test`

## Pi テストの実行

Pi に特化したテストセットを Vitest で直接実行します:

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

ライブプロバイダ実行も含めるには:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

これにより、主な Pi ユニットスイートがカバーされます:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## 手動テスト

推奨フロー:

- dev モードで gateway を起動:
  - `pnpm gateway:dev`
- エージェントを直接トリガー:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- インタラクティブデバッグには TUI を使う:
  - `pnpm tui`

ツール呼び出し動作を見るには、`read` または `exec` アクションを促すプロンプトを送って、ツールストリーミングとペイロード処理を確認してください。

## クリーンスレートリセット

state は OpenClaw state ディレクトリ配下にあります。デフォルトは `~/.openclaw` です。`OPENCLAW_STATE_DIR` が設定されている場合は、代わりにそのディレクトリを使ってください。

すべてをリセットするには:

- 設定用の `openclaw.json`
- モデル認証プロファイル（API キー + OAuth）用の `agents/<agentId>/agent/auth-profiles.json`
- auth profile ストア外にまだ存在するプロバイダ / チャネル状態用の `credentials/`
- エージェントセッション履歴用の `agents/<agentId>/sessions/`
- セッションインデックス用の `agents/<agentId>/sessions/sessions.json`
- 旧来パスが存在する場合の `sessions/`
- 空の workspace にしたい場合の `workspace/`

セッションだけをリセットしたい場合は、そのエージェントの `agents/<agentId>/sessions/` を削除してください。認証を保持したい場合は、`agents/<agentId>/agent/auth-profiles.json` と `credentials/` 配下の各種プロバイダ状態は残してください。

## 参考資料

- [Testing](/ja-JP/help/testing)
- [はじめに](/ja-JP/start/getting-started)

## 関連

- [Pi integration architecture](/ja-JP/pi)

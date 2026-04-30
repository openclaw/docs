---
read_when:
    - Pi 統合コードまたはテストに取り組む
    - Pi 固有の lint、型チェック、ライブテストフローを実行する
summary: 'Pi 統合の開発者ワークフロー: ビルド、テスト、ライブ検証'
title: Pi 開発ワークフロー
x-i18n:
    generated_at: "2026-04-30T05:22:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c4025c8ed1a4dff0d8116440fd48f375264eb4cac06f71afebf8c05f3470ab4
    source_path: pi-dev.md
    workflow: 16
---

OpenClaw の Pi 統合に取り組むための健全なワークフロー。

## 型チェックと lint

- デフォルトのローカルゲート: `pnpm check`
- ビルドゲート: 変更がビルド出力、パッケージング、または lazy-loading/module 境界に影響する可能性がある場合は `pnpm build`
- Pi 関連の大きな変更向けの完全な landing ゲート: `pnpm check && pnpm test`

## Pi テストの実行

Pi に重点を置いたテストセットを Vitest で直接実行します。

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

live provider の演習を含めるには、次を実行します。

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

これは主要な Pi ユニットスイートをカバーします。

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## 手動テスト

推奨フロー:

- Gateway を開発モードで実行します。
  - `pnpm gateway:dev`
- エージェントを直接トリガーします。
  - `pnpm openclaw agent --message "Hello" --thinking low`
- 対話的なデバッグには TUI を使用します。
  - `pnpm tui`

ツール呼び出しの動作については、ツールストリーミングとペイロード処理を確認できるように、`read` または `exec` アクションを促してください。

## クリーンスレートのリセット

状態は OpenClaw の状態ディレクトリ配下にあります。デフォルトは `~/.openclaw` です。`OPENCLAW_STATE_DIR` が設定されている場合は、代わりにそのディレクトリを使用します。

すべてをリセットするには、次を対象にします。

- 設定用の `openclaw.json`
- モデル認証プロファイル（APIキー + OAuth）用の `agents/<agentId>/agent/auth-profiles.json`
- 認証プロファイルストアの外側にまだ存在するプロバイダー/チャネル状態用の `credentials/`
- エージェントセッション履歴用の `agents/<agentId>/sessions/`
- セッションインデックス用の `agents/<agentId>/sessions/sessions.json`
- レガシーパスが存在する場合は `sessions/`
- 空のワークスペースが必要な場合は `workspace/`

セッションだけをリセットしたい場合は、そのエージェントの `agents/<agentId>/sessions/` を削除します。認証を保持したい場合は、`agents/<agentId>/agent/auth-profiles.json` と `credentials/` 配下のプロバイダー状態をそのまま残します。

## 参考資料

- [テスト](/ja-JP/help/testing)
- [はじめに](/ja-JP/start/getting-started)

## 関連

- [Pi 統合アーキテクチャ](/ja-JP/pi)

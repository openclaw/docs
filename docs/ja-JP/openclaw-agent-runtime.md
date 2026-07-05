---
read_when:
    - OpenClaw エージェントランタイムのコードまたはテストに取り組む
    - agent-runtime lint、typecheck、ライブテストフローの実行
summary: 'OpenClaw エージェントランタイムの開発者ワークフロー: ビルド、テスト、ライブ検証'
title: OpenClaw エージェントランタイムのワークフロー
x-i18n:
    generated_at: "2026-07-05T11:28:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e5150689bc102a372b65b1c9bf0a378c7ccb0578d38a750571887dcbe0650e8a
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

OpenClaw リポジトリ内のエージェントランタイム (`src/agents/`) 向け開発者ワークフロー。

## 型チェックと lint

- デフォルトのローカルゲート: `pnpm check` (型チェック、lint、ポリシーガード)
- ビルドゲート: 変更がビルド出力、パッケージング、または遅延読み込み/モジュール境界に影響する可能性がある場合は `pnpm build`
- 完全なプッシュ前ゲート: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`

## エージェントランタイムテストの実行

エージェントランタイムのユニットスイートを実行します。

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

最初のグロブには、`agent-tools*`、`agent-settings`、および
`agent-tool-definition-adapter*` スイートも含まれます。

ライブテストはユニット設定から除外されています。ライブ
ラッパー経由で実行してください (`OPENCLAW_LIVE_TEST=1` を設定し、プロバイダーの認証情報が必要です)。

```bash
pnpm test:live src/agents/embedded-agent-runner-extraparams.live.test.ts
```

## 手動テスト

- Gateway を開発モードで実行します (`OPENCLAW_SKIP_CHANNELS=1` によりチャンネル接続をスキップ): `pnpm gateway:dev`
- Gateway 経由でエージェントターンを 1 回トリガーします: `pnpm openclaw agent --message "Hello" --thinking low`
- 対話的なデバッグには TUI を使用します: `pnpm tui`

ツール呼び出しの挙動については、`read` または `exec` アクションを促すことで、
ツールのストリーミングとペイロード処理を確認できます。

## クリーンスレートリセット

状態は OpenClaw の状態ディレクトリに保存されます。デフォルトは `~/.openclaw`、
設定されている場合は `$OPENCLAW_STATE_DIR` です。そのディレクトリからの相対パスは次のとおりです。

| パス                                           | 保持する内容                                                         |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `openclaw.json`                                | 設定                                                               |
| `state/openclaw.sqlite`                        | 共有ランタイム状態データベース                                     |
| `agents/<agentId>/agent/openclaw-agent.sqlite` | エージェントごとのモデル認証プロファイル (API キー + OAuth) とランタイム状態 |
| `credentials/`                                 | 認証プロファイルストア外のプロバイダー/チャンネル認証情報          |
| `agents/<agentId>/sessions/`                   | セッショントランスクリプトと `sessions.json` インデックス           |
| `sessions/`                                    | レガシーな単一エージェントセッションストア (古いインストールのみ) |
| `workspace/`                                   | デフォルトのエージェントワークスペース (追加エージェントは `workspace-<agentId>` を使用) |

完全にリセットするには、これらのパスを削除します。より範囲を絞ったリセット:

- セッションのみ: そのエージェントの `agents/<agentId>/sessions/` を削除します。
- 認証を保持: `agents/<agentId>/agent/openclaw-agent.sqlite` と `credentials/` はそのまま残します。

レガシーな `auth-profiles.json` ファイルはランタイムでは読み取られなくなりました。
`openclaw doctor --fix` がそれらを SQLite ストアにインポートします。

## 参考

- [テスト](/ja-JP/help/testing)
- [はじめに](/ja-JP/start/getting-started)

## 関連

- [OpenClaw エージェントランタイムアーキテクチャ](/ja-JP/agent-runtime-architecture)

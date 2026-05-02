---
read_when:
    - セッションのルーティングと分離を理解したい場合
    - マルチユーザー構成で DM スコープを設定したい場合
    - 日次またはアイドル時のセッションリセットをデバッグしている
summary: OpenClaw が会話セッションを管理する仕組み
title: セッション管理
x-i18n:
    generated_at: "2026-05-02T04:54:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1bde2ab8f1589ed477df959aecf59c282bb086bfe93159397252021a1d6393b
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw は会話を **セッション** に整理します。各メッセージは、送信元（DM、グループチャット、Cron ジョブなど）に基づいてセッションへルーティングされます。

## メッセージのルーティング方法

| 送信元          | 動作                  |
| --------------- | ------------------------- |
| ダイレクトメッセージ | 既定では共有セッション |
| グループチャット     | グループごとに分離        |
| ルーム/チャンネル  | ルームごとに分離         |
| Cron ジョブ       | 実行ごとに新規セッション     |
| Webhook        | フックごとに分離         |

## DM の分離

既定では、継続性のためにすべての DM が 1 つのセッションを共有します。これは単一ユーザー構成では問題ありません。

<Warning>
複数の人がエージェントにメッセージを送れる場合は、DM の分離を有効にしてください。有効にしないと、すべてのユーザーが同じ会話コンテキストを共有します。つまり、Alice のプライベートメッセージが Bob に見えてしまいます。
</Warning>

**修正方法:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolate by channel + sender
  },
}
```

その他のオプション:

- `main` (既定) -- すべての DM が 1 つのセッションを共有します。
- `per-peer` -- 送信者ごとに分離します (チャンネルをまたいで)。
- `per-channel-peer` -- チャンネル + 送信者ごとに分離します (推奨)。
- `per-account-channel-peer` -- アカウント + チャンネル + 送信者ごとに分離します。

<Tip>
同じ人が複数のチャンネルから連絡してくる場合は、`session.identityLinks` を使ってその人の ID をリンクし、1 つのセッションを共有させます。
</Tip>

### リンク済みチャンネルをドックする

ドックコマンドを使うと、ユーザーは新しいセッションを開始せずに、現在のダイレクトチャットセッションの返信ルートを別のリンク済みチャンネルへ移動できます。例、設定、トラブルシューティングについては、[チャンネルドッキング](/ja-JP/concepts/channel-docking) を参照してください。

`openclaw security audit` で構成を確認してください。

## セッションのライフサイクル

セッションは期限切れになるまで再利用されます。

- **日次リセット** (既定) -- Gateway ホストのローカル時刻で午前 4:00 に新しいセッションになります。日次の鮮度は現在の `sessionId` が開始された時点に基づき、後続のメタデータ書き込みには基づきません。
- **アイドルリセット** (任意) -- 一定時間アクティビティがないと新しいセッションになります。`session.reset.idleMinutes` を設定します。アイドル鮮度は最後の実際のユーザー/チャンネル操作に基づくため、Heartbeat、Cron、exec システムイベントはセッションを維持しません。
- **手動リセット** -- チャットで `/new` または `/reset` を入力します。`/new <model>` はモデルも切り替えます。

日次リセットとアイドルリセットの両方が設定されている場合は、先に期限切れになった方が適用されます。Heartbeat、Cron、exec、その他のシステムイベントのターンはセッションメタデータを書き込むことがありますが、それらの書き込みは日次またはアイドルリセットの鮮度を延長しません。リセットによってセッションが切り替わると、古いセッション向けにキューに入っていたシステムイベント通知は破棄されるため、古いバックグラウンド更新が新しいセッションの最初のプロンプトに前置されることはありません。

プロバイダー所有のアクティブな CLI セッションを持つセッションは、暗黙の日次既定では切断されません。これらのセッションをタイマーで期限切れにする必要がある場合は、`/reset` を使うか、`session.reset` を明示的に設定してください。

## 状態の保存場所

すべてのセッション状態は **Gateway** が所有します。UI クライアントはセッションデータを Gateway に問い合わせます。

- **ストア:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **トランスクリプト:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` はライフサイクルのタイムスタンプを別々に保持します。

- `sessionStartedAt`: 現在の `sessionId` が開始された時刻。日次リセットはこれを使用します。
- `lastInteractionAt`: アイドル寿命を延長する最後のユーザー/チャンネル操作。
- `updatedAt`: ストア行の最後の変更時刻。一覧表示や pruning に便利ですが、日次/アイドルリセットの鮮度については権威ではありません。

`sessionStartedAt` がない古い行は、利用可能な場合、トランスクリプト JSONL のセッションヘッダーから解決されます。古い行に `lastInteractionAt` もない場合、アイドル鮮度は後続の管理用書き込みではなく、そのセッション開始時刻にフォールバックします。

## セッションメンテナンス

OpenClaw は時間の経過とともにセッションストレージを自動的に制限します。既定では `warn` モードで実行されます (クリーンアップ対象を報告します)。自動クリーンアップを行うには、`session.maintenance.mode` を `"enforce"` に設定します。

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

本番規模の `maxEntries` 制限では、Gateway ランタイムの書き込みは小さな高水位バッファを使い、バッチで設定済みの上限までクリーンアップします。セッションストアの読み取りは、Gateway 起動中にエントリを pruning したり上限適用したりしません。これにより、起動のたびや分離された Cron セッションごとにストア全体のクリーンアップを実行することを避けます。`openclaw sessions cleanup --enforce` は上限を即座に適用します。

`openclaw sessions cleanup --dry-run` でプレビューできます。

## セッションの検査

- `openclaw status` -- セッションストアのパスと最近のアクティビティ。
- `openclaw sessions --json` -- すべてのセッション (`--active <minutes>` でフィルター)。
- チャット内の `/status` -- コンテキスト使用量、モデル、トグル。
- `/context list` -- システムプロンプトに含まれるもの。

## 関連情報

- [セッション pruning](/ja-JP/concepts/session-pruning) -- ツール結果のトリミング
- [Compaction](/ja-JP/concepts/compaction) -- 長い会話の要約
- [セッションツール](/ja-JP/concepts/session-tool) -- セッションをまたぐ作業のためのエージェントツール
- [セッション管理の詳細](/ja-JP/reference/session-management-compaction) -- ストアスキーマ、トランスクリプト、送信ポリシー、送信元メタデータ、高度な設定
- [マルチエージェント](/ja-JP/concepts/multi-agent) — エージェント間のルーティングとセッション分離
- [バックグラウンドタスク](/ja-JP/automation/tasks) — 切り離された作業がセッション参照付きのタスクレコードを作成する仕組み
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — 受信メッセージがセッションへルーティングされる仕組み

## 関連

- [セッション pruning](/ja-JP/concepts/session-pruning)
- [セッションツール](/ja-JP/concepts/session-tool)
- [コマンドキュー](/ja-JP/concepts/queue)

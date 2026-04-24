---
read_when:
    - 自動返信実行または並行性を変更しています
summary: 受信自動返信実行を直列化するコマンドキューデザイン
title: コマンドキュー
x-i18n:
    generated_at: "2026-04-24T04:54:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa442e9aa2f0d6d95770d43e987d19ce8d9343450b302ee448e1fa4ab3feeb15
    source_path: concepts/queue.md
    workflow: 15
---

# コマンドキュー（2026-01-16）

複数のエージェント実行が衝突しないように、受信自動返信実行（すべてのチャンネル）を小さなプロセス内キューで直列化しつつ、セッション間では安全な並列性を維持します。

## なぜ必要か

- 自動返信実行は高コストになり得る（LLM 呼び出し）うえ、複数の受信メッセージが近接して到着すると衝突することがあります。
- 直列化により、共有リソース（セッションファイル、ログ、CLI stdin）の競合を避けられ、上流のレート制限に達する可能性も減らせます。

## 仕組み

- レーンを認識する FIFO キューが各レーンを設定可能な並行数上限で排出します（未設定レーンのデフォルトは 1、main はデフォルト 4、subagent は 8）。
- `runEmbeddedPiAgent` は **セッションキー** 単位（レーン `session:<key>`）でキュー投入し、セッションごとに同時実行が 1 つだけになることを保証します。
- 各セッション実行はその後 **グローバルレーン**（デフォルトでは `main`）にもキュー投入されるため、全体の並列性は `agents.defaults.maxConcurrent` で制限されます。
- verbose logging が有効な場合、開始前に約 2 秒以上待ったキュー済み実行は短い通知を発行します。
- 入力中インジケーターは、キュー投入時点で（チャンネルが対応していれば）即座に発火するため、順番待ち中でもユーザー体験は変わりません。

## キューモード（チャンネルごと）

受信メッセージは、現在の実行を steer したり、followup ターンを待ったり、その両方を行ったりできます。

- `steer`: 現在の実行に即時注入します（次のツール境界の後に保留中ツール呼び出しをキャンセルします）。ストリーミング中でない場合は followup にフォールバックします。
- `followup`: 現在の実行が終了した後、次のエージェントターン用にキュー投入します。
- `collect`: キュー済みメッセージを **1 つの** followup ターンにまとめます（デフォルト）。メッセージが異なるチャンネル/スレッドを対象にしている場合は、ルーティングを保つため個別に排出されます。
- `steer-backlog`（別名 `steer+backlog`）: 今すぐ steer し、**かつ** followup ターン用にメッセージも保持します。
- `interrupt`（レガシー）: そのセッションのアクティブな実行を abort し、最新メッセージを実行します。
- `queue`（レガシーエイリアス）: `steer` と同じです。

steer-backlog は、steer 済み実行の後に followup 応答が返ることがあるため、
ストリーミングサーフェスでは重複に見えることがあります。受信メッセージごとに
1 つの応答にしたい場合は、`collect` / `steer` を推奨します。
スタンドアロンコマンドとして `/queue collect` を送信する（セッションごと）か、`messages.queue.byChannel.discord: "collect"` を設定してください。

デフォルト（config で未設定の場合）:

- すべてのサーフェス → `collect`

`messages.queue` を使ってグローバルまたはチャンネルごとに設定します。

```json5
{
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## キューオプション

オプションは `followup`、`collect`、`steer-backlog` に適用されます（また、`steer` が followup にフォールバックした場合にも適用されます）。

- `debounceMs`: followup ターン開始前に静止を待ちます（「continue, continue」を防ぐ）。
- `cap`: セッションごとの最大キュー済みメッセージ数。
- `drop`: オーバーフローポリシー（`old`、`new`、`summarize`）。

summarize は、破棄されたメッセージの短い箇条書きを保持し、合成 followup プロンプトとして注入します。
デフォルト: `debounceMs: 1000`、`cap: 20`、`drop: summarize`。

## セッションごとの上書き

- スタンドアロンコマンドとして `/queue <mode>` を送信すると、現在のセッションにそのモードを保存します。
- オプションは組み合わせ可能です: `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` または `/queue reset` でセッション上書きをクリアします。

## スコープと保証

- Gateway 返信パイプラインを使うすべての受信チャンネル（WhatsApp web、Telegram、Slack、Discord、Signal、iMessage、webchat など）の自動返信エージェント実行に適用されます。
- デフォルトレーン（`main`）は、受信 + main Heartbeat に対してプロセス全体で共有されます。複数セッションを並列に実行するには `agents.defaults.maxConcurrent` を設定してください。
- 追加レーン（例: `cron`、`subagent`）が存在する場合があり、バックグラウンドジョブは受信返信をブロックせず並列実行できます。これらの分離実行は [バックグラウンドタスク](/ja-JP/automation/tasks) として追跡されます。
- セッションごとのレーンは、特定のセッションに同時に触れるエージェント実行が 1 つだけであることを保証します。
- 外部依存関係やバックグラウンド worker thread は不要で、純粋な TypeScript + promises です。

## トラブルシューティング

- コマンドが止まっているように見える場合は、verbose logs を有効にし、「queued for …ms」の行を探してキューが排出されていることを確認してください。
- キュー深度が必要な場合は、verbose logs を有効にし、キュー時間の行を確認してください。

## 関連

- [セッション管理](/ja-JP/concepts/session)
- [リトライポリシー](/ja-JP/concepts/retry)

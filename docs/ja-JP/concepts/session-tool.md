---
read_when:
    - エージェントが利用できるセッションツールを理解したい場合
    - クロスセッションアクセスまたは sub-agent 生成を設定したい場合
    - 状態を確認したい場合や、生成された sub-agent を制御したい場合
summary: クロスセッション状態、リコール、メッセージング、sub-agent オーケストレーション向けエージェントツール
title: セッションツール
x-i18n:
    generated_at: "2026-04-24T04:54:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3032178a83e662009c3ea463f02cb20d604069d1634d5c24a9f86988e676b2e
    source_path: concepts/session-tool.md
    workflow: 15
---

OpenClaw は、セッションをまたいで作業し、状態を確認し、
sub-agent をオーケストレーションするためのツールをエージェントに提供します。

## 利用可能なツール

| ツール | 説明 |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | セッションを任意のフィルター付きで一覧表示します（kind、label、agent、recency、preview） |
| `sessions_history` | 特定セッションのトランスクリプトを読み取ります |
| `sessions_send`    | 別のセッションにメッセージを送信し、必要に応じて待機します |
| `sessions_spawn`   | バックグラウンド作業用の分離された sub-agent セッションを生成します |
| `sessions_yield`   | 現在のターンを終了し、後続の sub-agent 結果を待機します |
| `subagents`        | このセッション用に生成された sub-agent を一覧表示、steer、または kill します |
| `session_status`   | `/status` 形式のカードを表示し、必要に応じてセッションごとのモデル上書きを設定します |

## セッションの一覧表示と読み取り

`sessions_list` は、キー、agentId、kind、channel、model、
トークン数、タイムスタンプを含むセッションを返します。kind（`main`、`group`、`cron`、`hook`、
`node`）、完全一致の `label`、完全一致の `agentId`、検索テキスト、または recency
（`activeMinutes`）でフィルターできます。メールボックス形式のトリアージが必要な場合は、
可視性スコープ付きの派生タイトル、最後のメッセージのプレビュースニペット、または各行の
制限付き最近メッセージも要求できます。派生タイトルとプレビューは、呼び出し元が
設定済みセッションツール可視性ポリシーの下ですでに閲覧可能なセッションに対してのみ生成されるため、
無関係なセッションは隠されたままです。

`sessions_history` は、特定のセッションの会話トランスクリプトを取得します。
デフォルトではツール結果は除外されます。表示するには `includeTools: true` を渡してください。
返される表示は、意図的に制限され、安全性フィルタが適用されています。

- assistant テキストはリコール前に正規化されます:
  - thinking タグは削除されます
  - `<relevant-memories>` / `<relevant_memories>` のスキャフォールディングブロックは削除されます
  - `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、および
    `<function_calls>...</function_calls>` のようなプレーンテキストのツール呼び出し XML ペイロードブロックは、
    正常に閉じられない切り詰められたペイロードを含めて削除されます
  - `[Tool Call: ...]`、
    `[Tool Result ...]`、`[Historical context ...]` のようなダウングレードされたツール呼び出し/結果スキャフォールディングは削除されます
  - `<|assistant|>` のような漏えいしたモデル制御トークン、その他の ASCII
    `<|...|>` トークン、および全角の `<｜...｜>` バリアントは削除されます
  - `<invoke ...>` /
    `</minimax:tool_call>` のような不正な MiniMax ツール呼び出し XML は削除されます
- 認証情報/トークン風のテキストは返される前にリダクトされます
- 長いテキストブロックは切り詰められます
- 非常に大きな履歴では古い行が落とされるか、過大な行が
  `[sessions_history omitted: message too large]` に置き換えられることがあります
- ツールは `truncated`、`droppedMessages`、
  `contentTruncated`、`contentRedacted`、`bytes` などの要約フラグを報告します

どちらのツールも、**セッションキー**（`"main"` など）または
前回の list 呼び出しで取得した **session ID** のどちらかを受け付けます。

完全にバイト単位で一致するトランスクリプトが必要な場合は、
`sessions_history` を生ダンプとして扱うのではなく、ディスク上のトランスクリプトファイルを確認してください。

## セッション間メッセージの送信

`sessions_send` は別のセッションにメッセージを配信し、必要に応じて
応答を待機します。

- **Fire-and-forget:** `timeoutSeconds: 0` を設定するとキュー投入して
  即座に返ります。
- **返信を待機:** タイムアウトを設定すると、応答をインラインで取得できます。

対象が応答した後、OpenClaw は **reply-back ループ** を実行でき、
エージェント同士がメッセージを交互に送ります（最大 5 ターン）。対象エージェントは
`REPLY_SKIP` を返して早期終了できます。

## 状態確認とオーケストレーションのヘルパー

`session_status` は、現在のセッションまたは別の可視セッションに対する軽量な
`/status` 相当ツールです。使用状況、時間、モデル/ランタイム状態、および存在する場合は
関連するバックグラウンドタスクコンテキストを報告します。`/status` と同様に、
最新のトランスクリプト使用状況エントリーから疎なトークン/キャッシュカウンターを補完でき、
`model=default` でセッションごとの上書きをクリアします。

`sessions_yield` は、次のメッセージを待機中のフォローアップイベントにするために、
意図的に現在のターンを終了します。sub-agent を生成した後、完了結果を
ポーリングループを構築せずに次のメッセージとして受け取りたい場合に使用します。

`subagents` は、すでに生成された OpenClaw
sub-agent 用の制御プレーンヘルパーです。以下をサポートします。

- `action: "list"` でアクティブ/最近の実行を確認
- `action: "steer"` で実行中の子へ追加のガイダンスを送信
- `action: "kill"` で 1 つの子または `all` を停止

## sub-agent の生成

`sessions_spawn` は、デフォルトでバックグラウンドタスク用の分離されたセッションを作成します。
これは常にノンブロッキングで、`runId` と
`childSessionKey` を返して即座に戻ります。

主なオプション:

- `runtime: "subagent"`（デフォルト）または外部ハーネスエージェント用の `"acp"`。
- 子セッション用の `model` および `thinking` 上書き。
- `thread: true` で生成をチャットスレッド（Discord、Slack など）にバインド。
- `sandbox: "require"` で子に対してサンドボックス化を強制。
- `context: "fork"` は、子が現在の
  リクエスターのトランスクリプトを必要とするネイティブ sub-agent 用です。クリーンな子にするには省略するか `context: "isolated"` を使用します。

デフォルトの leaf sub-agent にはセッションツールは付与されません。
`maxSpawnDepth >= 2` の場合、深さ 1 のオーケストレーター sub-agent には追加で
`sessions_spawn`、`subagents`、`sessions_list`、`sessions_history` が付与されるため、
自分の子を管理できます。leaf 実行には引き続き再帰的な
オーケストレーションツールは付与されません。

完了後、announce ステップが結果をリクエスターのチャンネルへ投稿します。
完了配信は、利用可能な場合はバインド済みのスレッド/トピックルーティングを保持し、
完了元がチャンネルしか識別しない場合でも、OpenClaw は直接
配信用にリクエスターセッションの保存済みルート（`lastChannel` / `lastTo`）を再利用できます。

ACP 固有の動作については、[ACP Agents](/ja-JP/tools/acp-agents) を参照してください。

## 可視性

セッションツールは、エージェントが見られる範囲を制限するためにスコープされています。

| レベル | スコープ |
| ------- | ---------------------------------------- |
| `self`  | 現在のセッションのみ |
| `tree`  | 現在のセッション + 生成された sub-agent |
| `agent` | このエージェントのすべてのセッション |
| `all`   | すべてのセッション（設定されていればエージェント横断） |

デフォルトは `tree` です。サンドボックス化されたセッションは、設定に関係なく
`tree` に制限されます。

## さらに読む

- [Session Management](/ja-JP/concepts/session) -- ルーティング、ライフサイクル、メンテナンス
- [ACP Agents](/ja-JP/tools/acp-agents) -- 外部ハーネスの生成
- [Multi-agent](/ja-JP/concepts/multi-agent) -- マルチエージェントアーキテクチャ
- [Gateway Configuration](/ja-JP/gateway/configuration) -- セッションツール設定ノブ

## 関連

- [セッション管理](/ja-JP/concepts/session)
- [セッション削除](/ja-JP/concepts/session-pruning)

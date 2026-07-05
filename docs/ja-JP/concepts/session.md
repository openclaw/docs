---
read_when:
    - セッションルーティングと分離を理解したい
    - 複数ユーザー設定向けに DM スコープを構成したい
    - 日次またはアイドル状態のセッションリセットをデバッグしている
summary: OpenClaw が会話セッションを管理する仕組み
title: セッション管理
x-i18n:
    generated_at: "2026-07-05T11:21:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ad901508e6c39e34fba7cb944b2d8db72524a0327f2bbc1738b3ed449e34b7d
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw は、すべての受信メッセージを送信元に基づいて **セッション** にルーティングします:
DM、グループチャット、Cron ジョブなど。すべてのセッション状態は
**Gateway** が所有し、UI クライアントはセッションデータを Gateway に問い合わせます。

## メッセージのルーティング方法

| 送信元          | 動作                  |
| --------------- | ------------------------- |
| ダイレクトメッセージ | デフォルトで共有セッション |
| グループチャット     | グループごとに分離        |
| ルーム/チャンネル  | ルームごとに分離         |
| Cron ジョブ       | 実行ごとに新規セッション     |
| Webhook        | フックごとに分離         |

## DM 分離

デフォルトでは、継続性のためすべての DM が 1 つのセッションを共有します。これは
単一ユーザーのセットアップでは問題ありません。

<Warning>
複数の人がエージェントにメッセージを送れる場合は、DM 分離を有効にしてください。有効にしないと、すべての
ユーザーが同じ会話コンテキストを共有するため、Alice のプライベートメッセージが
Bob に見えてしまいます。
</Warning>

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolate by channel + sender
  },
}
```

`session.dmScope` のオプション:

| 値                      | 動作                                  |
| -------------------------- | ----------------------------------------- |
| `main` (デフォルト)           | すべての DM が 1 つのセッションを共有                 |
| `per-peer`                 | 送信者ごとに分離し、チャンネルをまたぐ        |
| `per-channel-peer`         | チャンネル + 送信者ごとに分離 (推奨) |
| `per-account-channel-peer` | アカウント + チャンネル + 送信者ごとに分離     |

<Tip>
同じ人が複数のチャンネルから連絡してくる場合は、
`session.identityLinks` を使って各 ID を 1 つの正規ピア ID にマッピングし、
セッションを共有させます。
</Tip>

### リンク済みチャンネルのドック

ドックコマンドは、新しいセッションを開始せずに、現在のダイレクトチャットセッションの返信先ルートを別の
リンク済みチャンネルへ移動します。例、設定、
トラブルシューティングについては [チャンネルドッキング](/ja-JP/concepts/channel-docking) を参照してください。

`openclaw security audit` でセットアップを検証してください。

## セッションのライフサイクル

セッションは `session.reset` によって期限切れになるまで再利用されます:

- **日次リセット** (デフォルト `mode: "daily"`) - Gateway ホスト上の設定済みローカル
  時刻 (`session.reset.atHour`、デフォルト `4`、0-23) に新しいセッションを開始します。日次の
  新鮮さは、後続のメタデータ書き込みではなく、現在の `sessionId` が開始した時点に基づきます。
- **アイドルリセット** (`mode: "idle"`) - `session.reset.idleMinutes`
  の非アクティブ時間後に新しいセッションを開始します。アイドルの新鮮さは最後の実際のユーザー/チャンネル
  操作に基づくため、Heartbeat、Cron、exec システムイベントは
  セッションを維持しません。
- **手動リセット** - チャットで `/new` または `/reset` と入力します。`/new <model>` は
  モデルも切り替えます。

日次リセットとアイドルリセットの両方が設定されている場合は、先に期限切れになった方が優先されます。
Heartbeat、Cron、exec、その他のシステムイベントターンはセッションメタデータを書き込むことがありますが、
これらの書き込みは日次またはアイドルリセットの新鮮さを延長しません。リセットによって
セッションが切り替わると、古いセッションのキュー済みシステムイベント通知は破棄されるため、
古いバックグラウンド更新が新しいセッションの最初のプロンプトの前に追加されることはありません。

プロバイダー所有の CLI セッションがアクティブなセッションは、暗黙の日次デフォルトでは切られません。
それらのセッションをタイマーで期限切れにする必要がある場合は、`/reset` を使うか `session.reset` を明示的に設定してください。

チャット種別ごと、またはチャンネルごとにデフォルトを上書きします:

```json5
{
  session: {
    reset: { mode: "daily", atHour: 4 },
    resetByType: {
      group: { mode: "idle", idleMinutes: 120 },
      thread: { mode: "daily", atHour: 6 },
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 },
    },
  },
}
```

`resetByType` は `direct` (レガシーエイリアス `dm`)、`group`、`thread` をサポートします。
レガシーのトップレベル `session.idleMinutes` は、`session.reset`/`resetByType` ブロックが設定されていない場合に、
アイドルモードのデフォルトに対する互換エイリアスとして引き続き機能します。

## 状態の保存場所

- **ストア:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **トランスクリプト:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` は個別のライフサイクルタイムスタンプを保持します:

- `sessionStartedAt`: 現在の `sessionId` が開始した時刻。日次リセットはこれを使用します。
- `lastInteractionAt`: アイドル存続期間を延長する最後のユーザー/チャンネル操作。
- `updatedAt`: 最後のストア行の変更時刻。一覧表示や pruning に役立ちますが、
  日次/アイドルリセットの新鮮さについての正規情報ではありません。

`sessionStartedAt` がない古い行は、利用可能な場合、トランスクリプト JSONL の
セッションヘッダーから解決されます。古い行に `lastInteractionAt` もない場合、
アイドルの新鮮さは後続の記録管理書き込みではなく、そのセッション開始時刻にフォールバックします。

## セッションメンテナンス

OpenClaw は `session.maintenance` によって時間の経過に伴うセッションストレージを制限します。デフォルトは
次のとおりです:

```json5
{
  session: {
    maintenance: {
      mode: "enforce", // "enforce" applies cleanup; "warn" only reports
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

本番規模の `maxEntries` 制限では、Gateway ランタイムの書き込みは小さな
高水位バッファを使い、設定された上限までバッチでクリーンアップします。
セッションストアの読み取りは Gateway 起動時にエントリを prune したり上限を適用したりしないため、
起動や分離された Cron セッションがストア全体のクリーンアップコストを払うことはありません。
`openclaw sessions cleanup --enforce` は上限を即座に適用します。

Gateway モデル実行プローブセッションは、デフォルトで短命です。
`agent:*:explicit:model-run-<uuid>` に一致する行は固定の `24h` 保持を使用しますが、クリーンアップは
圧力で制御されます。つまり、セッションエントリのメンテナンス/上限制約に達した場合にのみ古いプローブ行を削除し、
より広い古いエントリの経過時間カットオフとエントリ上限の前に実行されます。通常の direct、group、thread、Cron、hook、Heartbeat、
ACP、サブエージェントセッションは、この 24h 保持を継承しません。

メンテナンスは、グループセッションやスレッドスコープのチャットセッションを含む永続的な外部会話ポインターを保持しつつ、
合成された Cron、hook、Heartbeat、ACP、サブエージェントのエントリが経過時間により削除されることも許可します。

以前に DM 分離を使用し、その後 `session.dmScope` を
`main` に戻した場合は、
`openclaw sessions cleanup --dry-run --fix-dm-scope` で古いピアキー付き DM 行をプレビューします。同じフラグを適用すると、
それらの古い direct-DM 行は廃止され、トランスクリプトは削除済み
アーカイブとして保持されます。

任意のメンテナンス実行は `openclaw sessions cleanup --dry-run` でプレビューできます。

## セッションの確認

| コマンド                    | 表示内容                                           |
| -------------------------- | ----------------------------------------------- |
| `openclaw status`          | セッションストアのパスと最近のアクティビティ          |
| `openclaw sessions --json` | すべてのセッション (`--active <minutes>` でフィルター) |
| チャット内の `/status`          | コンテキスト使用量、モデル、トグル               |
| `/context list`            | システムプロンプトに含まれる内容                    |

## 関連資料

- [セッション pruning](/ja-JP/concepts/session-pruning) - ツール結果のトリミング
- [Compaction](/ja-JP/concepts/compaction) - 長い会話の要約
- [セッションツール](/ja-JP/concepts/session-tool) - セッションをまたぐ作業のためのエージェントツール
- [セッション管理の詳細](/ja-JP/reference/session-management-compaction) -
  ストアスキーマ、トランスクリプト、送信ポリシー、送信元メタデータ、高度な設定
- [マルチエージェント](/ja-JP/concepts/multi-agent) - エージェント間のルーティングとセッション分離
- [バックグラウンドタスク](/ja-JP/automation/tasks) - 切り離された作業がセッション参照付きのタスクレコードを作成する仕組み
- [チャンネルルーティング](/ja-JP/channels/channel-routing) - 受信メッセージがセッションへルーティングされる仕組み

## 関連

- [セッション pruning](/ja-JP/concepts/session-pruning)
- [セッションツール](/ja-JP/concepts/session-tool)
- [コマンドキュー](/ja-JP/concepts/queue)

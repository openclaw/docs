---
read_when:
    - セッションのルーティングと分離について理解したい場合
    - マルチユーザー設定向けにDMのスコープを構成する場合
    - 日次またはアイドル時のセッションリセットをデバッグする
summary: OpenClaw が会話セッションを管理する仕組み
title: セッション管理
x-i18n:
    generated_at: "2026-07-12T14:26:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8ec9e33b4d288fa12016092ab2201431631fc9cb77e6e9d4261d348d5a849f65
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw は、すべての受信メッセージを、その送信元（DM、グループチャット、cron ジョブなど）に基づいて **セッション** にルーティングします。すべてのセッション状態は
**Gateway** が所有し、UI クライアントは Gateway にセッションデータを問い合わせます。

## メッセージのルーティング方法

| 送信元          | 動作                  |
| --------------- | ------------------------- |
| ダイレクトメッセージ | デフォルトでは共有セッション |
| グループチャット     | グループごとに分離        |
| ルーム/チャンネル    | ルームごとに分離          |
| Cron ジョブ          | 実行ごとに新しいセッション |
| Webhook              | フックごとに分離          |

## DM の分離

デフォルトでは、継続性を保つため、すべての DM が 1 つのセッションを共有します。これは
単一ユーザーのセットアップには適しています。

<Warning>
複数のユーザーがエージェントにメッセージを送信できる場合は、DM の分離を有効にしてください。有効にしないと、すべての
ユーザーが同じ会話コンテキストを共有するため、Alice のプライベートメッセージが
Bob にも見えることになります。
</Warning>

```json5
{
  session: {
    dmScope: "per-channel-peer", // チャンネル + 送信者ごとに分離
  },
}
```

`session.dmScope` のオプション:

| 値                         | 動作                                      |
| -------------------------- | ----------------------------------------- |
| `main`（デフォルト）       | すべての DM が 1 つのセッションを共有     |
| `per-peer`                 | チャンネルをまたいで送信者ごとに分離      |
| `per-channel-peer`         | チャンネル + 送信者ごとに分離（推奨）     |
| `per-account-channel-peer` | アカウント + チャンネル + 送信者ごとに分離 |

<Tip>
同じ人物が複数のチャンネルから連絡してくる場合は、
`session.identityLinks` を使用して各 ID を 1 つの正規ピア ID にマッピングし、
同じセッションを共有させます。
</Tip>

### リンク済みチャンネルへのドッキング

ドックコマンドは、新しいセッションを開始せずに、現在のダイレクトチャットセッションの返信ルートを別の
リンク済みチャンネルへ移動します。例、設定、トラブルシューティングについては、
[チャンネルドッキング](/ja-JP/concepts/channel-docking)を参照してください。

`openclaw security audit` でセットアップを確認してください。

## セッションのライフサイクル

セッションは、`session.reset` に従って期限切れになるまで再利用されます。

- **毎日のリセット**（デフォルトは `mode: "daily"`）- Gateway ホストで設定されたローカル
  時刻（`session.reset.atHour`、デフォルトは `4`、0-23）になると新しいセッションを開始します。毎日の
  有効期間は、後続のメタデータ書き込みではなく、現在の `sessionId` が開始された時刻に基づきます。
- **アイドルリセット**（`mode: "idle"`）- `session.reset.idleMinutes`
  の非アクティブ状態が続くと新しいセッションを開始します。アイドルの有効期間は、最後の実際のユーザー/チャンネル
  操作に基づくため、Heartbeat、Cron、exec のシステムイベントによって
  セッションが維持されることはありません。
- **手動リセット** - チャットで `/new` または `/reset` と入力します。`/new <model>` は
  モデルの切り替えも行います。

毎日のリセットとアイドルリセットの両方を設定した場合は、先に期限切れになった方が適用されます。
Heartbeat、Cron、exec、その他のシステムイベントによるターンはセッションメタデータを書き込む場合がありますが、
これらの書き込みによって毎日またはアイドルリセットの有効期間が延長されることはありません。リセットによって
セッションが切り替わると、古いセッションにキューイングされていたシステムイベント通知は
破棄されるため、古いバックグラウンド更新が新しいセッションの最初のプロンプトの先頭に追加されることはありません。

プロバイダーが所有するアクティブな CLI セッションがあるセッションは、暗黙の
毎日のデフォルトでは終了しません。これらのセッションをタイマーで期限切れにする必要がある場合は、`/reset` を使用するか、
`session.reset` を明示的に設定してください。

チャットタイプまたはチャンネルごとにデフォルトを上書きできます。

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

`resetByType` は `direct`（レガシーエイリアスは `dm`）、`group`、`thread` をサポートします。
レガシーなトップレベルの `session.idleMinutes` は、`session.reset`/`resetByType` ブロックが設定されていない場合、
アイドルモードのデフォルトに対する互換エイリアスとして引き続き機能します。

## 状態の保存場所

- **ランタイムセッション行:** `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **アーカイブ済みトランスクリプトファイル:** `~/.openclaw/agents/<agentId>/sessions/`
- **レガシー行の移行元:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`

エージェントごとの SQLite データベース内のセッション行には、個別のライフサイクル
タイムスタンプが保持されます。

- `sessionStartedAt`: 現在の `sessionId` が開始された時刻。毎日のリセットで使用されます。
- `lastInteractionAt`: アイドル有効期間を延長する最後のユーザー/チャンネル操作。
- `updatedAt`: ストア行が最後に変更された時刻。一覧表示やプルーニングには役立ちますが、
  毎日/アイドルリセットの有効期間を決定する基準ではありません。

古いインストールからの移行時には、Gateway の起動時と `openclaw doctor
--fix` の実行時に、レガシーな `sessions.json` の行と使用中のトランスクリプト JSONL 履歴が
自動的に SQLite へインポートされます。`sessionStartedAt` がない行については、利用可能な場合、
レガシーなトランスクリプト JSONL のセッションヘッダーから値が解決されます。古い行に
`lastInteractionAt` もない場合、アイドルの有効期間は、後続の管理用書き込みではなく、
そのセッションの開始時刻にフォールバックします。明示的な検査または検証証拠が必要な場合は、
`openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` と[Doctor の移行
手順](/ja-JP/cli/doctor#session-sqlite-migration)を使用してください。

## セッションのメンテナンス

OpenClaw は `session.maintenance` によって、時間の経過に伴うセッションストレージを制限します。
デフォルトは次のとおりです。

```json5
{
  session: {
    maintenance: {
      mode: "enforce", // "enforce" はクリーンアップを適用し、"warn" は報告のみ
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

本番規模の `maxEntries` 制限では、Gateway ランタイムの書き込みは小さな
高水位バッファを使用し、バッチ処理で設定された上限まで削減します。
Gateway の起動中、セッションストアの読み取りではエントリのプルーニングや上限制限を行わないため、
起動処理や分離された Cron セッションでストア全体のクリーンアップコストが発生することはありません。
`openclaw sessions cleanup --enforce` は上限を即座に適用します。

Gateway のモデル実行プローブセッションは、デフォルトでは短期間のみ保持されます。
`agent:*:explicit:model-run-<uuid>` に一致する行には固定の `24h` 保持期間が適用されますが、クリーンアップは
負荷が条件となります。古いプローブ行が削除されるのは、セッションエントリの
メンテナンス/上限負荷に達した場合のみで、より広範な古いエントリの
経過時間しきい値およびエントリ上限より前に実行されます。通常のダイレクト、グループ、スレッド、Cron、フック、Heartbeat、
ACP、サブエージェントのセッションには、この 24h の保持期間は継承されません。

メンテナンスでは、グループセッションやスレッド単位のチャットセッションを含む永続的な外部会話ポインターを
保持しつつ、合成された Cron、フック、Heartbeat、ACP、サブエージェントのエントリは
時間経過による削除が可能です。

以前に DM の分離を使用し、その後 `session.dmScope` を
`main` に戻した場合は、
`openclaw sessions cleanup --dry-run --fix-dm-scope` で古いピアキー形式の DM 行をプレビューできます。同じフラグを適用すると、
これらの古いダイレクト DM 行が廃止され、そのトランスクリプトは削除済み
アーカイブとして保持されます。

メンテナンス処理は、`openclaw sessions cleanup --dry-run` でプレビューできます。

## セッションの検査

| コマンド                   | 表示内容                                        |
| -------------------------- | ----------------------------------------------- |
| `openclaw status`          | セッションストアのパスと最近のアクティビティ    |
| `openclaw sessions --json` | すべてのセッション（`--active <minutes>` で絞り込み） |
| チャット内の `/status`     | コンテキスト使用量、モデル、切り替え設定         |
| `/context list`            | システムプロンプトに含まれる内容                 |

## 関連資料

- [セッション検索](/concepts/session-search) - 過去のトランスクリプトを横断する全文検索
- [セッションのプルーニング](/ja-JP/concepts/session-pruning) - ツール結果の切り詰め
- [Compaction](/ja-JP/concepts/compaction) - 長い会話の要約
- [セッションツール](/ja-JP/concepts/session-tool) - セッションをまたぐ作業用のエージェントツール
- [セッション管理の詳細](/ja-JP/reference/session-management-compaction) -
  ストアスキーマ、トランスクリプト、送信ポリシー、送信元メタデータ、高度な設定
- [マルチエージェント](/ja-JP/concepts/multi-agent) - エージェント間のルーティングとセッション分離
- [バックグラウンドタスク](/ja-JP/automation/tasks) - 分離された作業によってセッション参照付きのタスクレコードが作成される仕組み
- [チャンネルルーティング](/ja-JP/channels/channel-routing) - 受信メッセージがセッションへルーティングされる仕組み

## 関連項目

- [セッションのプルーニング](/ja-JP/concepts/session-pruning)
- [セッションツール](/ja-JP/concepts/session-tool)
- [コマンドキュー](/ja-JP/concepts/queue)

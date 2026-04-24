---
read_when:
    - スケジュール済みジョブとウェイクアップが必要な場合
    - cron の実行とログをデバッグしている場合
summary: '`openclaw cron` の CLI リファレンス（バックグラウンドジョブのスケジュールと実行）'
title: Cron
x-i18n:
    generated_at: "2026-04-24T04:50:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: d3f5c262092b9b5b821ec824bc02dbbd806936d91f1d03ac6eb789f7e71ffc07
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Gateway スケジューラの cron ジョブを管理します。

関連:

- Cron ジョブ: [Cron jobs](/ja-JP/automation/cron-jobs)

ヒント: 完全なコマンド一覧を確認するには `openclaw cron --help` を実行してください。

注記: `openclaw cron list` と `openclaw cron show <job-id>` は、解決された
配信ルートをプレビューします。`channel: "last"` の場合、プレビューには
ルートが main/current セッションから解決されたか、fail closed になるかが表示されます。

注記: 分離された `cron add` ジョブはデフォルトで `--announce` 配信です。出力を内部のみに保つには `--no-deliver` を使ってください。`--deliver` は引き続き `--announce` の非推奨エイリアスとして残っています。

注記: 分離 cron のチャット配信は共有されます。`--announce` は最終返信に対する
ランナーのフォールバック配信です。`--no-deliver` はそのフォールバックを無効にしますが、
チャットルートが利用可能な場合のエージェントの `message` ツールは削除しません。

注記: 1 回限りの（`--at`）ジョブはデフォルトで成功後に削除されます。保持するには `--keep-after-run` を使ってください。

注記: `--session` は `main`、`isolated`、`current`、`session:<id>` をサポートします。
作成時にアクティブセッションへバインドするには `current` を使い、明示的な永続セッションキーには
`session:<id>` を使ってください。

注記: 1 回限りの CLI ジョブでは、オフセットなしの `--at` 日時は、同時に
`--tz <iana>` を渡さない限り UTC として扱われます。`--tz <iana>` を渡した場合は、
指定したタイムゾーン内のローカル壁時計時刻として解釈されます。

注記: 定期ジョブは、連続エラー後に指数再試行バックオフ（30 秒 → 1 分 → 5 分 → 15 分 → 60 分）を使うようになり、次回の成功実行後に通常スケジュールへ戻ります。

注記: `openclaw cron run` は、手動実行が実行キューに入った時点で返るようになりました。成功レスポンスには `{ ok: true, enqueued: true, runId }` が含まれます。最終結果は `openclaw cron runs --id <job-id>` で追跡してください。

注記: `openclaw cron run <job-id>` はデフォルトで強制実行します。以前の
「期限が来ているときだけ実行」動作を維持するには `--due` を使ってください。

注記: 分離 cron ターンは、古い確認応答だけの返信を抑制します。最初の結果が
中間的なステータス更新にすぎず、最終回答を担う子孫サブエージェント実行が存在しない場合、
cron は配信前に本当の結果を得るため一度だけ再プロンプトします。

注記: 分離 cron 実行がサイレントトークン（`NO_REPLY` /
`no_reply`）だけを返した場合、cron は直接送信配信とフォールバックの
キュー済み要約パスの両方を抑制するため、チャットには何も投稿されません。

注記: `cron add|edit --model ...` は、そのジョブに対して選択された許可済みモデルを使います。
そのモデルが許可されていない場合、cron は警告を出し、代わりにジョブのエージェント/デフォルト
モデル選択へフォールバックします。設定されたフォールバックチェーンは引き続き適用されますが、
明示的なジョブ単位フォールバックリストのない単純なモデルオーバーライドでは、エージェントの
プライマリが隠れた追加リトライ対象として付加されることはなくなりました。

注記: 分離 cron のモデル優先順位は、最初に Gmail フックオーバーライド、次にジョブ単位
`--model`、次に保存済み cron セッションのモデルオーバーライド、最後に通常の
エージェント/デフォルト選択です。

注記: 分離 cron の Fast mode は、解決されたライブモデル選択に従います。モデル設定の
`params.fastMode` はデフォルトで適用されますが、保存済みセッションの `fastMode`
オーバーライドは引き続き設定より優先されます。

注記: 分離実行で `LiveSessionModelSwitchError` が発生した場合、cron は
切り替え後のプロバイダ/モデル（存在する場合は切り替え後の認証プロファイルオーバーライドも）を
永続化してから再試行します。外側の再試行ループは、初回試行の後に 2 回の切り替え再試行に
制限され、それ以降は無限ループせず中断します。

注記: 失敗通知は最初に `delivery.failureDestination` を使い、次に
グローバル `cron.failureDestination`、最後に明示的な失敗通知先が設定されていない場合は
ジョブのプライマリ announce ターゲットへフォールバックします。

注記: 保持/削除は設定で制御されます:

- `cron.sessionRetention`（デフォルト `24h`）は完了した分離実行セッションを削除します。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` は `~/.openclaw/cron/runs/<jobId>.jsonl` を削除します。

アップグレード注記: 現在の配信/保存形式より前の古い cron ジョブがある場合は、
`openclaw doctor --fix` を実行してください。Doctor は現在、旧来の cron フィールド
（`jobId`、`schedule.cron`、旧来の `threadId` を含むトップレベル配信フィールド、
payload `provider` 配信エイリアス）を正規化し、`cron.webhook` が設定されている場合は
単純な `notify: true` Webhook フォールバックジョブを明示的な Webhook 配信へ移行します。

## よくある編集

メッセージを変えずに配信設定を更新する:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

分離ジョブの配信を無効にする:

```bash
openclaw cron edit <job-id> --no-deliver
```

分離ジョブで軽量ブートストラップコンテキストを有効にする:

```bash
openclaw cron edit <job-id> --light-context
```

特定チャネルに announce する:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

軽量ブートストラップコンテキストで分離ジョブを作成する:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` は分離エージェントターンジョブにのみ適用されます。cron 実行では、
軽量モードは完全なワークスペースブートストラップセットを注入する代わりに、
ブートストラップコンテキストを空のままに保ちます。

配信の責務に関する注記:

- 分離 cron のチャット配信は共有されます。チャットルートが利用可能であれば、
  エージェントは `message` ツールで直接送信できます。
- `announce` は、エージェントが解決済みターゲットへ直接送信しなかった場合にのみ、
  最終返信をフォールバック配信します。`webhook` は完了したペイロードを URL に POST します。
  `none` はランナーのフォールバック配信を無効にします。

## よく使う管理コマンド

手動実行:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs` のエントリには、意図した cron ターゲット、解決されたターゲット、
message ツール送信、フォールバック利用、および配信状態を含む配信診断が含まれます。

エージェント/セッションの再ターゲット:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

配信の調整:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

失敗配信に関する注記:

- `delivery.failureDestination` は分離ジョブでサポートされます。
- メインセッションジョブでは、プライマリ配信モードが `webhook` の場合にのみ
  `delivery.failureDestination` を使えます。
- 失敗通知先を何も設定せず、ジョブがすでにチャネルへ announce している場合、
  失敗通知は同じ announce ターゲットを再利用します。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [スケジュール済みタスク](/ja-JP/automation/cron-jobs)

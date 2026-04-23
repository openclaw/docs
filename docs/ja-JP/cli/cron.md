---
read_when:
    - スケジュールされたジョブとウェイクアップが必要です
    - Cron の実行とログをデバッグしています
summary: '`openclaw cron` の CLI リファレンス（バックグラウンドジョブをスケジュールして実行）'
title: cron
x-i18n:
    generated_at: "2026-04-23T14:01:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5216f220748b05df5202af778878b37148d6abe235be9fe82ddcf976d51532a
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Gateway scheduler の Cron ジョブを管理します。

関連:

- Cron jobs: [Cron jobs](/ja-JP/automation/cron-jobs)

ヒント: 完全なコマンドサーフェスは `openclaw cron --help` を実行してください。

注: `openclaw cron list` と `openclaw cron show <job-id>` は、解決済みの配信ルートをプレビューします。`channel: "last"` の場合、このプレビューには、ルートが main/current session から解決されたか、あるいは fail closed になるかが表示されます。

注: 分離された `cron add` ジョブは、デフォルトで `--announce` 配信になります。出力を内部だけに留めるには `--no-deliver` を使用してください。`--deliver` は `--announce` の非推奨エイリアスとして残っています。

注: 分離された cron の chat 配信は共有されます。`--announce` は最終 reply の runner fallback 配信です。`--no-deliver` はその fallback を無効にしますが、chat route が利用可能なときに agent の `message` tool を削除するわけではありません。

注: one-shot（`--at`）ジョブは、デフォルトで成功後に削除されます。保持するには `--keep-after-run` を使用してください。

注: `--session` は `main`、`isolated`、`current`、`session:<id>` をサポートします。作成時点のアクティブ session にバインドするには `current` を使用し、明示的な永続 session key には `session:<id>` を使用してください。

注: one-shot CLI ジョブでは、オフセットなしの `--at` 日時は、`--tz <iana>` も指定しない限り UTC として扱われます。`--tz <iana>` を指定すると、そのローカル wall-clock time が指定 timezone で解釈されます。

注: recurring jobs は、連続エラー後に指数的 retry backoff（30s → 1m → 5m → 15m → 60m）を使用するようになり、次の successful run の後に通常のスケジュールへ戻ります。

注: `openclaw cron run` は、手動実行が実行キューに入った時点で返るようになりました。成功レスポンスには `{ ok: true, enqueued: true, runId }` が含まれます。最終結果は `openclaw cron runs --id <job-id>` で追跡してください。

注: `openclaw cron run <job-id>` はデフォルトで force-run します。以前の「期限が来ている場合のみ実行」動作を維持するには `--due` を使用してください。

注: 分離された cron turns は、古い acknowledgement-only replies を抑制します。最初の結果が単なる中間ステータス更新で、最終的な回答を担当する descendant subagent run が存在しない場合、cron は配信前に実際の結果を得るために 1 回だけ再プロンプトします。

注: 分離された cron run が silent token（`NO_REPLY` / `no_reply`）のみを返した場合、cron は直接の outbound 配信と fallback の queued summary path も抑制するため、chat には何も投稿されません。

注: `cron add|edit --model ...` は、その選択した allowed model をジョブに使用します。model が許可されていない場合、cron は警告を出し、代わりにジョブの agent/default model selection にフォールバックします。設定済みの fallback chains は引き続き適用されますが、明示的なジョブごとの fallback list を持たない単純な model override では、agent primary は隠れた追加 retry target としてはもう追加されません。

注: 分離された cron の model 優先順位は、Gmail-hook override が最優先、その次にジョブごとの `--model`、その次に保存済みの cron-session model override、最後に通常の agent/default selection です。

注: 分離された cron の fast mode は、解決済みの live model selection に従います。model config の `params.fastMode` はデフォルトで適用されますが、保存済み session の `fastMode` override がある場合はそれが config より優先されます。

注: 分離実行で `LiveSessionModelSwitchError` が発生した場合、cron は switched provider/model（および存在する場合は switched auth profile override）を永続化してから retry します。外側の retry loop は、初回試行後 2 回の switch retry に制限されており、その後は無限ループせず中止します。

注: failure notifications は、まず `delivery.failureDestination`、次にグローバルな `cron.failureDestination` を使用し、明示的な failure destination が設定されていない場合のみ、ジョブの primary announce target にフォールバックします。

注: retention/pruning は config で制御します。

- `cron.sessionRetention`（デフォルト `24h`）は、完了した分離 run sessions を prune します。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` は `~/.openclaw/cron/runs/<jobId>.jsonl` を prune します。

アップグレード注記: 現在の配信/store 形式より前の古い cron jobs がある場合は、`openclaw doctor --fix` を実行してください。Doctor は現在、旧来の cron fields（`jobId`, `schedule.cron`, 旧 `threadId` を含むトップレベルの delivery fields, payload `provider` delivery aliases）を正規化し、`cron.webhook` が設定されている場合は単純な `notify: true` webhook fallback jobs を明示的な webhook 配信へ移行します。

## よくある編集

メッセージを変更せずに配信設定を更新する:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

分離ジョブの配信を無効にする:

```bash
openclaw cron edit <job-id> --no-deliver
```

分離ジョブで軽量 bootstrap context を有効にする:

```bash
openclaw cron edit <job-id> --light-context
```

特定の channel に announce する:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

軽量 bootstrap context 付きの分離ジョブを作成する:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` は、分離された agent-turn jobs にのみ適用されます。cron runs では、lightweight mode は workspace の完全な bootstrap set を注入する代わりに、bootstrap context を空のまま維持します。

配信 ownership に関する注記:

- 分離された cron の chat 配信は共有されます。chat route が利用可能な場合、agent は `message` tool で直接送信できます。
- `announce` は、agent が解決済み target に直接送信しなかった場合にのみ、最終 reply を fallback 配信します。`webhook` は完了した payload を URL に投稿します。
  `none` は runner fallback 配信を無効にします。

## よくある管理コマンド

手動実行:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs` のエントリには、意図された cron target、解決済み target、message-tool 送信、fallback の使用状況、配信状態を含む配信診断が含まれます。

Agent/session の再ターゲット:

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

failure 配信に関する注記:

- 分離ジョブでは `delivery.failureDestination` がサポートされます。
- main-session jobs では、primary
  delivery mode が `webhook` の場合にのみ `delivery.failureDestination` を使用できます。
- failure destination を何も設定しておらず、ジョブがすでに channel に announce している場合、failure notifications は同じ announce target を再利用します。

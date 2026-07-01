---
read_when:
    - スケジュールされたジョブとウェイクアップが必要な場合
    - Cron 実行とログをデバッグしている
summary: '`openclaw cron` の CLI リファレンス（バックグラウンドジョブをスケジュールして実行）'
title: Cron
x-i18n:
    generated_at: "2026-07-01T02:57:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aed39843e183b3d441908ad4ac0578d44b6f0d482905871efc3421fd9820a1cc
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gateway スケジューラの Cron ジョブを管理します。

<Tip>
完全なコマンド範囲については `openclaw cron --help` を実行してください。概念ガイドについては [Cron ジョブ](/ja-JP/automation/cron-jobs) を参照してください。
</Tip>

## ジョブをすばやく作成する

`openclaw cron create` は `openclaw cron add` のエイリアスです。新しいジョブでは、スケジュールを先に、プロンプトを後に置きます。

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

ジョブがチャットターゲットへ配信する代わりに、完了したペイロードを POST する必要がある場合は `--webhook <url>` を使用します。

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

隔離されたエージェント/モデル実行を開始せず、OpenClaw cron 内で実行されるべき決定的なシェル形式のジョブには `--command` を使用します。

<Note>
コマンド Cron ジョブは、管理者が作成する Gateway 自動化です。作成、編集、
削除、または手動実行には `operator.admin` が必要です。スケジュールされた実行は、
後で Gateway プロセス内で実行され、エージェントの `tools.exec` ツール呼び出しとしては実行されません。
`tools.exec.*` と exec 承認は、引き続きモデルから見える exec ツールを制御します。
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` は `argv: ["sh", "-lc", <shell>]` を保存します。正確な argv 実行には `--command-argv '["node","scripts/report.mjs"]'` を使用します。コマンドジョブは stdout/stderr をキャプチャし、通常の Cron 履歴を記録し、隔離ジョブと同じ `announce`、`webhook`、または `none` 配信モードを通じて出力をルーティングします。`NO_REPLY` だけを出力するコマンドは抑制されます。

## セッション

`--session` は `main`、`isolated`、`current`、または `session:<id>` を受け付けます。

<AccordionGroup>
  <Accordion title="セッションキー">
    - `main` はエージェントのメインセッションにバインドします。
    - `isolated` は各実行に対して新しいトランスクリプトとセッション ID を作成します。
    - `current` は作成時点のアクティブセッションにバインドします。
    - `session:<id>` は明示的な永続セッションキーに固定します。

  </Accordion>
  <Accordion title="隔離セッションのセマンティクス">
    隔離実行は周囲の会話コンテキストをリセットします。チャンネルとグループのルーティング、送信/キューポリシー、昇格、オリジン、ACP ランタイムバインディングは新しい実行でリセットされます。安全な設定と、明示的にユーザーが選択したモデルまたは認証のオーバーライドは、実行間で引き継がれる場合があります。
  </Accordion>
</AccordionGroup>

## 配信

`openclaw cron list` と `openclaw cron show <job-id>` は、解決された配信ルートをプレビューします。`channel: "last"` では、プレビューにメインまたは現在のセッションからルートが解決されたか、fail closed になるかが表示されます。

プロバイダー接頭辞付きターゲットは、未解決の announce チャンネルを明確にできます。たとえば、`delivery.channel` が省略されている、または `last` の場合、`to: "telegram:123"` は Telegram を選択します。読み込まれた Plugin が公開する接頭辞だけがプロバイダーセレクタです。`delivery.channel` が明示されている場合、接頭辞はそのチャンネルと一致する必要があります。`channel: "whatsapp"` と `to: "telegram:123"` の組み合わせは拒否されます。`imessage:` や `sms:` などのサービス接頭辞は、チャンネル所有のターゲット構文のままです。

<Note>
隔離された `cron add` ジョブは、デフォルトで `--announce` 配信になります。出力を内部に保持するには `--no-deliver` を使用します。`--deliver` は `--announce` の非推奨エイリアスとして残ります。
</Note>

### 配信の所有権

隔離 Cron のチャット配信は、エージェントとランナーで共有されます。

- チャットルートが利用可能な場合、エージェントは `message` ツールを使用して直接送信できます。
- `announce` は、エージェントが解決済みターゲットへ直接送信しなかった場合にのみ、最終返信をフォールバック配信します。
- `webhook` は完了したペイロードを URL に投稿します。
- `none` はランナーのフォールバック配信を無効にします。

Webhook 配信を設定するには `cron add|create --webhook <url>` または `cron edit <job-id> --webhook <url>` を使用します。`--webhook` を `--announce`、`--no-deliver`、`--channel`、`--to`、`--thread-id`、`--account` などのチャット配信フラグと組み合わせないでください。

`cron edit <job-id>` は、`--clear-channel`、`--clear-to`、`--clear-thread-id`、`--clear-account` で個別の配信ルーティングフィールドを解除できます（それぞれ対応する設定フラグと組み合わせると拒否されます）。ランナーのフォールバック配信だけを無効にする `--no-deliver` とは異なり、これらは保存済みフィールドを削除するため、ジョブはそのルート部分を再びデフォルトから解決します。

`--announce` は最終返信のランナーフォールバック配信です。`--no-deliver` はそのフォールバックを無効にしますが、チャットルートが利用可能な場合のエージェントの `message` ツールは削除しません。

アクティブなチャットから作成されたリマインダーは、フォールバック announce 配信用にライブチャット配信ターゲットを保持します。内部セッションキーは小文字の場合があります。Matrix ルーム ID など、大文字小文字を区別するプロバイダー ID の信頼できる情報源として使用しないでください。

### 失敗時の配信

失敗通知は次の順序で解決されます。

1. ジョブ上の `delivery.failureDestination`。
2. グローバルな `cron.failureDestination`。
3. ジョブのプライマリ announce ターゲット（明示的な失敗宛先が設定されていない場合）。

<Note>
メインセッションジョブは、プライマリ配信モードが `webhook` の場合にのみ `delivery.failureDestination` を使用できます。隔離ジョブはすべてのモードで受け付けます。
</Note>

注: 隔離 Cron 実行では、返信ペイロードが生成されない場合でも
実行レベルのエージェント失敗をジョブエラーとして扱うため、モデル/プロバイダーの失敗もエラー
カウンターを増やし、失敗通知をトリガーします。

コマンド Cron ジョブは隔離エージェントターンを開始しません。終了コード 0 は
`ok` を記録します。ゼロ以外の終了、シグナル、タイムアウト、または出力なしタイムアウトは `error` を記録し、
同じ失敗通知パスをトリガーできます。

隔離実行が最初のモデルリクエスト前にタイムアウトした場合、`openclaw cron show`
と `openclaw cron runs` には、
`setup timed out before runner start` や
`stalled before first model call (last phase: context-engine)` のようなフェーズ固有のエラーが含まれます。
CLI バックエンドのプロバイダーでは、外部
CLI ターンが開始するまでモデル前ウォッチドッグが有効なままになるため、セッション検索、フック、認証、プロンプト、CLI セットアップの停止は
モデル前 Cron 失敗として報告されます。

## スケジュール

### ワンショットジョブ

`--at <datetime>` はワンショット実行をスケジュールします。オフセットのない日時は UTC として扱われます。ただし、`--tz <iana>` も渡した場合は、指定されたタイムゾーンの壁時計時刻として解釈されます。

<Note>
ワンショットジョブは、デフォルトで成功後に削除されます。保持するには `--keep-after-run` を使用します。
</Note>

### 繰り返しジョブ

繰り返しジョブは、連続エラー後に指数関数的なリトライバックオフを使用します: 30s、1m、5m、15m、60m。次に成功した実行の後、スケジュールは通常に戻ります。

スキップされた実行は、実行エラーとは別に追跡されます。リトライバックオフには影響しませんが、`openclaw cron edit <job-id> --failure-alert-include-skipped` によって、失敗アラートで繰り返しのスキップ実行通知を受け取るようにできます。

ローカル設定済みモデルプロバイダーを対象とする隔離ジョブでは、Cron はエージェントターンを開始する前に軽量なプロバイダープリフライトを実行します。Loopback、プライベートネットワーク、`.local` の `api: "ollama"` プロバイダーは `/api/tags` でプローブされます。vLLM、SGLang、LM Studio などのローカル OpenAI 互換プロバイダーは `/models` でプローブされます。エンドポイントに到達できない場合、実行は `skipped` として記録され、後のスケジュールで再試行されます。一致する停止中のエンドポイントは、多数のジョブが同じローカルサーバーに集中してアクセスすることを避けるため、5 分間キャッシュされます。

注: Cron ジョブ、保留中のランタイム状態、実行履歴は共有 SQLite 状態データベースに保存されます。レガシーの `jobs.json`、`jobs-state.json`、`runs/*.jsonl` ファイルは一度インポートされ、`.migrated` サフィックス付きにリネームされます。インポート後は、JSON ファイルを編集する代わりに `openclaw cron add|edit|remove` でスケジュールを編集してください。

### 手動実行

`openclaw cron run <job-id>` はデフォルトで強制実行し、手動実行がキューに入るとすぐに戻ります。成功レスポンスには `{ ok: true, enqueued: true, runId }` が含まれます。返された `runId` を使用して、後の結果を確認します。

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

スクリプトが、その正確にキュー投入された実行が終端ステータスを記録するまでブロックする必要がある場合は、`--wait` を追加します。

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

`--wait` を指定すると、CLI は引き続き最初に `cron.run` を呼び出し、その後返された `runId` に対して `cron.runs` をポーリングします。コマンドは、実行がステータス `ok` で終了した場合にのみ `0` で終了します。実行が `error` または `skipped` で終了した場合、Gateway レスポンスに `runId` が含まれない場合、または `--wait-timeout` が期限切れになった場合は、ゼロ以外で終了します。`--poll-interval` はゼロより大きい必要があります。

<Note>
ジョブが現在期限到来している場合にのみ手動コマンドを実行したい場合は、`--due` を使用します。`--due --wait` が実行をキューに入れない場合、コマンドはポーリングせずに通常の非実行レスポンスを返します。
</Note>

## モデル

`cron add|edit --model <ref>` はジョブで許可されたモデルを選択します。`cron add|edit --fallbacks <list>` はジョブ単位のフォールバックモデルを設定します。たとえば `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5` です。フォールバックなしの厳格な実行には `--fallbacks ""` を渡します。`cron edit <job-id> --clear-fallbacks` はジョブ単位のフォールバックオーバーライドを削除します。`cron edit <job-id> --clear-model` はジョブ単位のモデルオーバーライドを削除し、ジョブが通常の Cron モデル選択優先順位（保存済み Cron セッションオーバーライドがあればそれ、なければエージェント/デフォルトモデル）に従うようにします。`--model` と組み合わせることはできません。`cron add|edit --thinking <level>` はジョブ単位の thinking オーバーライドを設定します。`cron edit <job-id> --clear-thinking` はそれを削除し、ジョブが通常の Cron thinking 優先順位に従うようにします。また、`--thinking` と組み合わせることはできません。

<Warning>
モデルが許可されていない、または解決できない場合、Cron はジョブのエージェントやデフォルトモデル選択へフォールバックする代わりに、明示的な検証エラーで実行を失敗させます。
</Warning>

Cron の `--model` は **ジョブのプライマリ** であり、チャットセッションの `/model` オーバーライドではありません。つまり、次のようになります。

- 選択されたジョブモデルが失敗した場合でも、設定済みのモデルフォールバックは引き続き適用されます。
- ジョブ単位のペイロード `fallbacks` が存在する場合、設定済みのフォールバックリストを置き換えます。
- 空のジョブ単位フォールバックリスト（ジョブペイロード/API 内の `--fallbacks ""` または `fallbacks: []`）は、Cron 実行を厳格にします。
- ジョブに `--model` があり、フォールバックリストが設定されていない場合、エージェントプライマリが隠れたリトライターゲットとして追加されないよう、OpenClaw は明示的な空のフォールバックオーバーライドを渡します。
- ローカルプロバイダープリフライトチェックは、Cron 実行を `skipped` とマークする前に、設定済みフォールバックを順に確認します。

`openclaw doctor` は、`payload.model` がすでに設定されているジョブを、プロバイダー名前空間の数と `agents.defaults.model` との不一致を含めて報告します。認証、プロバイダー、または課金の動作がライブチャットとスケジュール済みジョブの間で異なるように見える場合は、このチェックを使用してください。

### 隔離 Cron のモデル優先順位

隔離 Cron は、次の順序でアクティブモデルを解決します。

1. Gmail フックのオーバーライド。
2. ジョブ単位の `--model`。
3. 保存済み Cron セッションのモデルオーバーライド（ユーザーが選択している場合）。
4. エージェントまたはデフォルトのモデル選択。

### 高速モード

隔離 Cron の高速モードは、解決されたライブモデル選択に従います。モデル設定 `params.fastMode` はデフォルトで適用されますが、保存済みセッションの `fastMode` オーバーライドは設定より優先されます。解決されたモードが `auto` の場合、カットオフは選択されたモデルの `params.fastAutoOnSeconds` 値を使用し、デフォルトは 60 秒です。

### ライブモデル切り替えのリトライ

隔離実行が `LiveSessionModelSwitchError` をスローした場合、Cron はリトライ前に、アクティブな実行に対して切り替え後のプロバイダーとモデル（存在する場合は切り替え後の認証プロファイルオーバーライドも）を永続化します。外側のリトライループは、最初の試行後に 2 回の切り替えリトライまでに制限され、その後は無限ループせずに中止します。

## 実行出力と拒否

### 古い確認応答の抑制

隔離 Cron ターンは、古い確認応答のみの返信を抑制します。最初の結果が単なる暫定ステータス更新であり、子孫サブエージェント実行が最終的な回答に責任を持たない場合、Cron は配信前に本当の結果を一度だけ再プロンプトします。

### サイレントトークン抑制

隔離された Cron 実行がサイレントトークン（`NO_REPLY` または `no_reply`）だけを返した場合、Cron は直接のアウトバウンド配信とフォールバックのキュー済み要約経路の両方を抑制するため、チャットには何も投稿されません。

### 構造化された拒否

隔離された Cron 実行では、埋め込み実行からの構造化された実行拒否メタデータを権威ある拒否シグナルとして使用します。また、ネストされた構造化エラーメッセージが `SYSTEM_RUN_DENIED` または `INVALID_REQUEST` で始まる場合、ノードホストの `UNAVAILABLE` ラッパーも尊重します。

Cron は、埋め込み実行が構造化された拒否メタデータも提供していない限り、最終出力の文章や承認拒否のように見えるフレーズを拒否として分類しません。そのため、通常のアシスタントのテキストはブロックされたコマンドとして扱われません。

`cron list` と実行履歴では、ブロックされたコマンドを `ok` として報告する代わりに、拒否理由を表示します。

## 保持

保持と pruning は config で制御されます。

- `cron.sessionRetention`（デフォルト `24h`）は、完了した隔離実行セッションを pruning します。
- `cron.runLog.keepLines` は、ジョブごとに保持される SQLite 実行履歴行を pruning します。`cron.runLog.maxBytes` は、古いファイルベースの実行ログとの互換性のために引き続き受け付けられます。

## 古いジョブの移行

<Note>
現在の配信形式とストア形式より前の Cron ジョブがある場合は、`openclaw doctor --fix` を実行してください。Doctor は、レガシー Cron フィールド（`jobId`、`schedule.cron`、レガシー `threadId` を含むトップレベルの配信フィールド、payload の `provider` 配信エイリアス）を正規化し、`notify: true` の Webhook フォールバックジョブを `cron.webhook` から明示的な Webhook 配信へ移行します。すでにチャットへ告知しているジョブはその配信を維持し、完了 Webhook の宛先を取得します。`cron.webhook` が未設定の場合、移行先のないジョブでは不活性なトップレベルの `notify` マーカーが削除されます（既存の配信は変更されずに保持されます）。そのため、`doctor --fix` はそれらについて繰り返し警告しなくなります。
</Note>

## よくある編集

メッセージを変更せずに配信設定を更新します。

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

隔離ジョブの配信を無効化します。

```bash
openclaw cron edit <job-id> --no-deliver
```

隔離ジョブの軽量 bootstrap context を有効化します。

```bash
openclaw cron edit <job-id> --light-context
```

特定のチャンネルに告知します。

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Telegram フォーラムトピックに告知します。

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

軽量 bootstrap context を持つ隔離ジョブを作成します。

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` は隔離された agent-turn ジョブにのみ適用されます。Cron 実行では、軽量モードは完全な workspace bootstrap セットを注入する代わりに、bootstrap context を空のままにします。

正確な argv、cwd、env、stdin、出力制限を持つコマンドジョブを作成します。

```bash
openclaw cron create "*/30 * * * *" \
  --name "Position export" \
  --command-argv '["node","scripts/export-position.mjs"]' \
  --command-cwd "/srv/app" \
  --command-env "NODE_ENV=production" \
  --command-input '{"mode":"summary"}' \
  --timeout-seconds 120 \
  --no-output-timeout-seconds 30 \
  --output-max-bytes 65536 \
  --webhook "https://example.invalid/openclaw/cron"
```

## よく使う管理コマンド

手動実行と検査:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron get <job-id>
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron run <job-id> --wait --wait-timeout 10m
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
openclaw cron runs --id <job-id> --limit 50
openclaw cron runs --id <job-id> --run-id <run-id>
```

`openclaw cron list` は、デフォルトですべての一致するジョブを表示します。`--agent <id>` を渡すと、有効な正規化済み agent id が一致するジョブだけを表示します。保存された agent id がないジョブは、設定済みのデフォルト agent として数えられます。

`openclaw cron get <job-id>` は、保存されたジョブ JSON を直接返します。配信経路のプレビューを含む人間が読みやすい表示が必要な場合は、`cron show <job-id>` を使用してください。

`cron list --json` と `cron show <job-id> --json` には、各ジョブにトップレベルの `status` フィールドが含まれます。これは `enabled`、`state.runningAtMs`、`state.lastRunStatus` から計算されます。値は `disabled`、`running`、`ok`、`error`、`skipped`、`idle` です。これは人間が読みやすいステータス列を反映しているため、外部ツールはジョブ状態を再導出せずに読み取れます。

`cron runs` のエントリには、意図された Cron ターゲット、解決済みターゲット、message-tool 送信、フォールバック使用、配信済み状態を含む配信診断が含まれます。

Agent とセッションの再ターゲット:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` は、agent-turn ジョブで `--agent` が省略された場合に警告し、デフォルト agent（`main`）へフォールバックします。特定の agent に固定するには、作成時に `--agent <id>` を渡してください。

配信の微調整:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --webhook "https://example.invalid/openclaw/cron"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [スケジュールされたタスク](/ja-JP/automation/cron-jobs)

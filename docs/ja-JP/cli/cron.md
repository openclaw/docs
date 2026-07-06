---
read_when:
    - スケジュールされたジョブとウェイクアップが必要な場合
    - Cron の実行とログをデバッグしている
summary: '`openclaw cron` のCLIリファレンス（バックグラウンドジョブをスケジュールして実行）'
title: Cron
x-i18n:
    generated_at: "2026-07-06T10:47:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e16335b13f92229df0ba49c320e2714e39ab3e503e8e72f376ec2c5b0803cf7
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gateway スケジューラの Cron ジョブを管理します。

<Tip>
完全なコマンド面は `openclaw cron --help` を実行して確認してください。概念ガイドは [Cron ジョブ](/ja-JP/automation/cron-jobs) を参照してください。
</Tip>

<Note>
すべての Cron 変更（`add`/`create`、`update`/`edit`、`remove`、`run`）には `operator.admin` が必要です。コマンドペイロードの実行は、agent の `tools.exec` ツール呼び出しとしてではなく、Gateway プロセス内で直接実行されます。モデルから見える exec ツールには、引き続き `tools.exec.*` と exec 承認が適用されます。
</Note>

## ジョブをすばやく作成する

`openclaw cron create` は `openclaw cron add` のエイリアスです。新しいジョブでは、スケジュールを先に、プロンプトを次に指定します。

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

ジョブがチャットターゲットへ配信する代わりに、完了したペイロードを POST する必要がある場合は、`--webhook <url>` を使用します。

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

分離された agent/モデル実行を開始せずに OpenClaw cron 内で実行される、決定論的なシェル形式のジョブには `--command` を使用します。

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` は `argv: ["sh", "-lc", <shell>]` を保存します。厳密な argv 実行には `--command-argv '["node","scripts/report.mjs"]'` を使用します。コマンドジョブは stdout/stderr を取得し、通常の Cron 履歴を記録し、分離ジョブと同じ `announce`、`webhook`、または `none` の配信モードで出力をルーティングします。`NO_REPLY` だけを出力するコマンドは抑制されます。

## セッション

`--session` は `main`、`isolated`、`current`、または `session:<id>` を受け付けます。

<AccordionGroup>
  <Accordion title="セッションキー">
    - `main` は agent のメインセッションにバインドします。
    - `isolated` は実行ごとに新しいトランスクリプトとセッション ID を作成します。
    - `current` は作成時点のアクティブセッションにバインドします。
    - `session:<id>` は明示的な永続セッションキーに固定します。

  </Accordion>
  <Accordion title="分離セッションのセマンティクス">
    分離実行は、周囲の会話コンテキストをリセットします。チャネルとグループのルーティング、送信/キューポリシー、昇格、送信元、ACP ランタイムバインディングは、新しい実行向けにリセットされます。安全な設定と、ユーザーが明示的に選択したモデルまたは認証の上書きは、実行間で引き継ぐことができます。
  </Accordion>
</AccordionGroup>

## 配信

`openclaw cron list` と `openclaw cron show <job-id>` は、解決済みの配信ルートをプレビューします。`channel: "last"` の場合、プレビューにはルートがメインセッションまたは現在のセッションから解決されたか、または fail closed になるかが表示されます。

プロバイダープレフィックス付きターゲットは、未解決の announce チャネルを明確化できます。たとえば、`delivery.channel` が省略されているか `last` の場合、`to: "telegram:123"` は Telegram を選択します。読み込まれた Plugin が通知しているプレフィックスだけがプロバイダーセレクタです。`delivery.channel` が明示されている場合、プレフィックスはそのチャネルと一致する必要があります。`channel: "whatsapp"` と `to: "telegram:123"` の組み合わせは拒否されます。`imessage:` や `sms:` などのサービスプレフィックスは、引き続きチャネル所有のターゲット構文です。

<Note>
分離された `cron add` ジョブは、デフォルトで `--announce` 配信になります。出力を内部に保持するには `--no-deliver` を使用します。`--deliver` は `--announce` の非推奨エイリアスとして残ります。
</Note>

### 配信の所有権

分離 Cron のチャット配信は、agent とランナーで共有されます。

- チャットルートが利用可能な場合、agent は `message` ツールを使用して直接送信できます。
- `announce` は、agent が解決済みターゲットに直接送信しなかった場合にのみ、最終返信をフォールバック配信します。
- `webhook` は完了したペイロードを URL に投稿します。
- `none` はランナーのフォールバック配信を無効にします。

Webhook 配信を設定するには、`cron add|create --webhook <url>` または `cron edit <job-id> --webhook <url>` を使用します。`--webhook` を、`--announce`、`--no-deliver`、`--channel`、`--to`、`--thread-id`、`--account` などのチャット配信フラグと組み合わせないでください。

`cron edit <job-id>` は、`--clear-channel`、`--clear-to`、`--clear-thread-id`、`--clear-account` で個別の配信ルーティングフィールドを解除できます（それぞれ対応する設定フラグと組み合わせると拒否されます）。ランナーのフォールバック配信だけを無効にする `--no-deliver` とは異なり、これらは保存済みフィールドを削除するため、ジョブはそのルート部分を再びデフォルトから解決します。

`--announce` は最終返信のランナーフォールバック配信です。`--no-deliver` はそのフォールバックを無効にしますが、チャットルートが利用可能な場合に agent の `message` ツールを削除するものではありません。

アクティブなチャットから作成されたリマインダーは、フォールバック announce 配信向けにライブチャット配信ターゲットを保持します。内部セッションキーは小文字の場合があります。Matrix ルーム ID など、大文字と小文字を区別するプロバイダー ID の真実の情報源として使用しないでください。

### 失敗時の配信

失敗通知は次の順序で解決されます。

1. ジョブの `delivery.failureDestination`。
2. グローバルな `cron.failureDestination`。
3. ジョブの主 announce ターゲット（上記のどちらも具体的な宛先に解決されない場合）。

<Note>
メインセッションジョブは、主配信モードが `webhook` の場合にのみ `delivery.failureDestination` を使用できます。分離ジョブではすべてのモードで受け付けます。
</Note>

分離 Cron 実行は、返信ペイロードが生成されない場合でも、実行レベルの agent 失敗をジョブエラーとして扱います。そのため、モデル/プロバイダーの失敗もエラーカウンターを増やし、失敗通知をトリガーします。

コマンド Cron ジョブは、分離された agent ターンを開始しません。終了コード 0 は `ok` として記録されます。非ゼロ終了、シグナル、タイムアウト、または出力なしタイムアウトは `error` として記録され、同じ失敗通知パスをトリガーできます。

分離実行が最初のモデルリクエスト前にタイムアウトした場合、`openclaw cron show` と `openclaw cron runs` には、`setup timed out before runner start` のようなフェーズ固有のエラー、または最後に確認された起動フェーズ（たとえば `context-engine`）を示す停止メッセージが含まれます。CLI ベースのプロバイダーでは、外部 CLI ターンが開始するまでプリモデルウォッチドッグがアクティブなままになるため、セッション検索、フック、認証、プロンプト、CLI セットアップの停止はプリモデル Cron 失敗として報告されます。

## スケジュール

### ワンショットジョブ

`--at <datetime>` はワンショット実行をスケジュールします。オフセットなしの日時は、`--tz <iana>` も渡さない限り UTC として扱われます。`--tz <iana>` を渡すと、指定されたタイムゾーンの壁時計時刻として解釈されます。

<Note>
ワンショットジョブは、デフォルトで成功後に削除されます。保持するには `--keep-after-run` を使用します。
</Note>

### 繰り返しジョブ

繰り返しジョブは、連続エラー後に指数的リトライバックオフを使用します: 30s、1m、5m、15m、60m。次回の成功実行後、スケジュールは通常に戻ります。

スキップされた実行は、実行エラーとは別に追跡されます。リトライバックオフには影響しませんが、`openclaw cron edit <job-id> --failure-alert-include-skipped` により、失敗アラートに繰り返しのスキップ実行通知を含めることができます。

ローカルに設定されたモデルプロバイダー（loopback、プライベートネットワーク、または `.local` 上のベース URL）を対象にする分離ジョブでは、Cron は agent ターンを開始する前に軽量なプロバイダープリフライトを実行します。`api: "ollama"` プロバイダーは `/api/tags` でプローブされます。他のローカル OpenAI 互換プロバイダー（`api: "openai-completions"`、例: vLLM、SGLang、LM Studio）は `/models` でプローブされます。エンドポイントに到達できない場合、実行は `skipped` として記録され、後のスケジュールで再試行されます。到達可能性の結果はエンドポイントごとに 5 分間キャッシュされるため、同じローカルサーバーに対する多数のジョブが繰り返しプローブして負荷をかけることはありません。

Cron ジョブ、保留中のランタイム状態、実行履歴は共有 SQLite 状態データベースに保存されます。従来の `jobs.json`、`<name>-state.json`、`runs/*.jsonl` ファイルは一度だけインポートされ、`.migrated` サフィックス付きにリネームされます。インポート後は、JSON ファイルを編集する代わりに `openclaw cron add|edit|remove` でスケジュールを編集してください。

### 手動実行

`openclaw cron run <job-id>` はデフォルトで強制実行し、手動実行がキューに入るとすぐに戻ります。成功レスポンスには `{ ok: true, enqueued: true, runId }` が含まれます。後の結果を確認するには、返された `runId` を使用します。

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

スクリプトが、その正確にキューへ入れられた実行が終端ステータスを記録するまでブロックする必要がある場合は、`--wait` を追加します。

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

`--wait` を使用しても、CLI は最初に `cron.run` を呼び出し、その後返された `runId` について `cron.runs` をポーリングします。コマンドは、実行がステータス `ok` で終了した場合にのみ `0` で終了します。実行が `error` または `skipped` で終了した場合、Gateway レスポンスに `runId` が含まれない場合、または `--wait-timeout` が期限切れになった場合（デフォルトは `10m`、デフォルトで `2s` ごとにポーリング）、非ゼロで終了します。`--poll-interval` は 0 より大きい必要があります。

<Note>
ジョブが現在期限到来している場合にのみ手動コマンドを実行したいときは、`--due` を使用します。`--due --wait` が実行をキューに入れない場合、コマンドはポーリングする代わりに通常の非実行レスポンスを返します。
</Note>

## モデル

`cron add|edit --model <ref>` は、ジョブで許可されたモデルを選択します。`cron add|edit --fallbacks <list>` はジョブごとのフォールバックモデルを設定します。たとえば `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5` です。フォールバックなしの厳格な実行には `--fallbacks ""` を渡します。`cron edit <job-id> --clear-fallbacks` はジョブごとのフォールバック上書きを削除します。`cron edit <job-id> --clear-model` はジョブごとのモデル上書きを削除し、ジョブが通常の Cron モデル選択優先順位（保存済みの Cron セッション上書きがあればそれ、なければ agent/デフォルトモデル）に従うようにします。これは `--model` と組み合わせることはできません。`cron add|edit --thinking <level>` はジョブごとの thinking 上書きを設定します。`cron edit <job-id> --clear-thinking` はそれを削除し、ジョブが通常の Cron thinking 優先順位に従うようにします。これは `--thinking` と組み合わせることはできません。

<Warning>
モデルが許可されていない、または解決できない場合、Cron はジョブの agent やデフォルトモデル選択にフォールバックするのではなく、明示的な検証エラーで実行を失敗させます。
</Warning>

Cron の `--model` はチャットセッションの `/model` 上書きではなく、**ジョブのプライマリ**です。つまり、次のようになります。

- 選択されたジョブモデルが失敗した場合でも、設定済みモデルフォールバックは引き続き適用されます。
- ジョブごとのペイロード `fallbacks` が存在する場合、設定済みフォールバックリストを置き換えます。
- 空のジョブごとのフォールバックリスト（ジョブペイロード/API 内の `--fallbacks ""` または `fallbacks: []`）は、Cron 実行を厳格にします。
- ジョブに `--model` があり、フォールバックリストが設定されていない場合、OpenClaw は明示的な空のフォールバック上書きを渡すため、agent プライマリが隠れたリトライターゲットとして追加されることはありません。
- ローカルプロバイダープリフライトチェックは、Cron 実行を `skipped` としてマークする前に、設定済みフォールバックをたどります。

`openclaw doctor` は、`payload.model` がすでに設定されているジョブを報告します。これには、プロバイダー名前空間の数と `agents.defaults.model` との不一致が含まれます。ライブチャットとスケジュール済みジョブで認証、プロバイダー、または課金の動作が異なるように見える場合は、このチェックを使用してください。

### 分離 Cron のモデル優先順位

分離 Cron は、次の順序でアクティブモデルを解決します。

1. Gmail フック上書き。
2. ジョブごとの `--model`。
3. 保存済み Cron セッションモデル上書き（ユーザーが選択した場合）。
4. Agent またはデフォルトモデル選択。

### 高速モード

分離 Cron の高速モードは、解決済みのライブモデル選択に従います。モデル設定 `params.fastMode` はデフォルトで適用されますが、保存済みセッションの `fastMode` 上書きがある場合は、引き続き設定より優先されます。解決済みモードが `auto` の場合、カットオフには選択されたモデルの `params.fastAutoOnSeconds` 値が使用され、デフォルトは 60 秒です。

### ライブモデル切り替えリトライ

分離実行が `LiveSessionModelSwitchError` をスローした場合、Cron はリトライ前に、切り替え後のプロバイダーとモデル（存在する場合は切り替え後の認証プロファイル上書きも）をアクティブ実行に永続化します。外側のリトライループは、初回試行後に 2 回の切り替えリトライまでに制限され、その後は永久ループせずに中止します。

## 実行出力と拒否

### 古い確認応答の抑制

分離 Cron ターンは、古い確認応答だけの返信を抑制します。最初の結果が単なる途中ステータス更新であり、最終的な回答に責任を持つ子孫 subagent 実行がない場合、Cron は配信前に実際の結果を一度だけ再プロンプトします。

### サイレントトークンの抑制

分離された cron 実行がサイレントトークン（`NO_REPLY` または `no_reply`）だけを返した場合、cron は直接の送信配信とフォールバックのキュー済み要約パスの両方を抑制するため、チャットには何も投稿されません。

### 構造化された拒否

分離された cron 実行では、埋め込み実行からの構造化された実行拒否メタデータ（`SYSTEM_RUN_DENIED` または `INVALID_REQUEST` とコード化された致命的な exec-tool エラー）を、正式な拒否シグナルとして使用します。また、これらのコードのいずれかを含むネストされた構造化エラーをラップする node-host の `UNAVAILABLE` ラッパーも尊重します。

埋め込み実行が構造化された拒否メタデータも提供していない限り、cron は最終出力の文章や承認拒否のように見えるフレーズを拒否として分類しません。そのため、通常のアシスタントテキストはブロックされたコマンドとして扱われません。

`cron list` と実行履歴は、ブロックされたコマンドを `ok` として報告する代わりに、拒否理由を表示します。

## 保持

保持とプルーニングは設定で制御されます。

- `cron.sessionRetention`（デフォルト `24h`、無効にするには `false`）は、完了した分離実行セッションをプルーニングします。
- `cron.runLog.keepLines`（デフォルト `2000`）は、ジョブごとに保持された SQLite 実行履歴行をプルーニングします。`cron.runLog.maxBytes`（デフォルト `2000000`）は、古いファイルベースの実行ログとの互換性のため引き続き受け入れられます。SQLite のプルーニングは行数ベースです。

## 古いジョブの移行

<Note>
現在の配信形式と保存形式より前の cron ジョブがある場合は、`openclaw doctor --fix` を実行してください。Doctor は、レガシー cron フィールド（`jobId`、`schedule.cron`、レガシー `threadId` を含むトップレベル配信フィールド、payload の `provider` 配信エイリアス）を正規化し、`cron.webhook` からの `notify: true` Webhook フォールバックジョブを明示的な Webhook 配信へ移行します。すでにチャットへ通知しているジョブはその配信を維持し、完了 Webhook の宛先を取得します。`cron.webhook` が未設定の場合、移行先のないジョブでは不活性なトップレベルの `notify` マーカーが削除されます（既存の配信は変更されず保持されます）。そのため、`doctor --fix` がそれらについて再警告し続けることはなくなります。
</Note>

## よくある編集

メッセージを変更せずに配信設定を更新します。

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

分離ジョブの配信を無効にします。

```bash
openclaw cron edit <job-id> --no-deliver
```

分離ジョブの軽量ブートストラップコンテキストを有効にします。

```bash
openclaw cron edit <job-id> --light-context
```

特定のチャンネルに通知します。

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Telegram フォーラムトピックに通知します。

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

軽量ブートストラップコンテキストを使う分離ジョブを作成します。

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` は、分離されたエージェントターンジョブのみに適用されます。cron 実行では、軽量モードはワークスペースの完全なブートストラップセットを注入する代わりに、ブートストラップコンテキストを空のままにします。

正確な argv、cwd、env、stdin、出力制限を指定してコマンドジョブを作成します。

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

## よくある管理コマンド

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

`openclaw cron list` は、デフォルトですべての一致するジョブを表示します。実効的に正規化されたエージェント id が一致するジョブだけを表示するには、`--agent <id>` を渡します。保存されたエージェント id がないジョブは、設定されたデフォルトエージェントとして扱われます。

`openclaw cron get <job-id>` は、保存されたジョブ JSON を直接返します。配信ルートのプレビューを含む人間が読みやすい表示が必要な場合は、`cron show <job-id>` を使用します。

`cron list --json` と `cron show <job-id> --json` は、各ジョブにトップレベルの `status` フィールドを含めます。これは `enabled`、`state.runningAtMs`、`state.lastRunStatus` から計算されます。値は `disabled`、`running`、`ok`、`error`、`skipped`、または `idle` です。JSON のステータスは正規のまま装飾されないため、外部ツールは再導出せずにジョブ状態を読み取れます。人間向け出力では、繰り返される `error` ステータスに失敗回数が付加される場合があります。

`cron runs` のエントリには、意図された cron ターゲット、解決済みターゲット、message-tool 送信、フォールバック使用、配信済み状態を含む配信診断が含まれます。

エージェントとセッションの再ターゲット:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` は、エージェントターンジョブで `--agent` が省略されると警告し、デフォルトエージェント（`main`）にフォールバックします。特定のエージェントに固定するには、作成時に `--agent <id>` を渡します。

配信の調整:

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

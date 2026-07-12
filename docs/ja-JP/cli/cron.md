---
read_when:
    - スケジュール済みジョブとウェイクアップを利用したい場合
    - Cron の実行とログをデバッグする
summary: '`openclaw cron` の CLI リファレンス（バックグラウンドジョブのスケジュール設定と実行）'
title: Cron
x-i18n:
    generated_at: "2026-07-11T22:02:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e16335b13f92229df0ba49c320e2714e39ab3e503e8e72f376ec2c5b0803cf7
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gateway スケジューラーの cron ジョブを管理します。

<Tip>
コマンドの全機能については、`openclaw cron --help` を実行してください。概念ガイドについては、[Cron ジョブ](/ja-JP/automation/cron-jobs)を参照してください。
</Tip>

<Note>
すべての cron 変更操作（`add`/`create`、`update`/`edit`、`remove`、`run`）には `operator.admin` が必要です。コマンドペイロードの実行は、エージェントの `tools.exec` ツール呼び出しとしてではなく、Gateway プロセス内で直接行われます。モデルに公開される exec ツールには、引き続き `tools.exec.*` と exec 承認が適用されます。
</Note>

## ジョブをすばやく作成する

`openclaw cron create` は `openclaw cron add` のエイリアスです。新しいジョブでは、スケジュールを先に、プロンプトを後に指定します。

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

チャットの宛先へ配信する代わりに、完了したペイロードを POST するジョブには `--webhook <url>` を使用します。

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

分離されたエージェント／モデル実行を開始せず、OpenClaw cron 内で実行する決定的なシェル形式のジョブには `--command` を使用します。

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` は `argv: ["sh", "-lc", <shell>]` を保存します。argv をそのまま実行するには、`--command-argv '["node","scripts/report.mjs"]'` を使用します。コマンドジョブは stdout/stderr をキャプチャし、通常の cron 履歴を記録して、分離ジョブと同じ `announce`、`webhook`、または `none` の配信モードで出力をルーティングします。`NO_REPLY` だけを出力するコマンドは抑制されます。

## セッション

`--session` には `main`、`isolated`、`current`、または `session:<id>` を指定できます。

<AccordionGroup>
  <Accordion title="セッションキー">
    - `main` はエージェントのメインセッションに関連付けます。
    - `isolated` は実行ごとに新しいトランスクリプトとセッション ID を作成します。
    - `current` は作成時点のアクティブなセッションに関連付けます。
    - `session:<id>` は明示的な永続セッションキーに固定します。

  </Accordion>
  <Accordion title="分離セッションのセマンティクス">
    分離実行では、周囲の会話コンテキストがリセットされます。チャネルとグループのルーティング、送信／キューポリシー、権限昇格、オリジン、および ACP ランタイムの関連付けは、新しい実行用にリセットされます。安全な設定と、ユーザーが明示的に選択したモデルまたは認証のオーバーライドは、実行間で引き継ぐことができます。
  </Accordion>
</AccordionGroup>

## 配信

`openclaw cron list` と `openclaw cron show <job-id>` は、解決済みの配信ルートをプレビューします。`channel: "last"` の場合、ルートがメインセッションまたは現在のセッションのどちらから解決されたか、あるいはフェイルクローズするかがプレビューに表示されます。

プロバイダー接頭辞付きの宛先を使うと、未解決の announce チャネルを明確に区別できます。たとえば、`to: "telegram:123"` は、`delivery.channel` が省略されているか `last` の場合に Telegram を選択します。読み込まれた Plugin が公開する接頭辞だけがプロバイダーセレクターになります。`delivery.channel` が明示されている場合、接頭辞はそのチャネルと一致する必要があります。`channel: "whatsapp"` と `to: "telegram:123"` の組み合わせは拒否されます。`imessage:` や `sms:` などのサービス接頭辞は、引き続きチャネルが所有する宛先構文です。

<Note>
分離された `cron add` ジョブは、デフォルトで `--announce` 配信を使用します。出力を内部に留めるには `--no-deliver` を使用します。`--deliver` は、非推奨の `--announce` エイリアスとして引き続き使用できます。
</Note>

### 配信の所有権

分離された cron のチャット配信は、エージェントとランナーで共有されます。

- チャットルートが利用可能な場合、エージェントは `message` ツールを使って直接送信できます。
- `announce` は、エージェントが解決済みの宛先へ直接送信しなかった場合にのみ、最終応答をフォールバック配信します。
- `webhook` は、完了したペイロードを URL に POST します。
- `none` は、ランナーによるフォールバック配信を無効にします。

Webhook 配信を設定するには、`cron add|create --webhook <url>` または `cron edit <job-id> --webhook <url>` を使用します。`--webhook` を、`--announce`、`--no-deliver`、`--channel`、`--to`、`--thread-id`、`--account` などのチャット配信フラグと組み合わせないでください。

`cron edit <job-id>` では、`--clear-channel`、`--clear-to`、`--clear-thread-id`、`--clear-account` を使用して、個々の配信ルーティングフィールドを解除できます（それぞれ、対応する設定フラグとの併用は拒否されます）。ランナーによるフォールバック配信のみを無効にする `--no-deliver` とは異なり、これらは保存済みフィールドを削除するため、ジョブはルートの該当部分を再びデフォルトから解決します。

`--announce` は、最終応答に対するランナーのフォールバック配信です。`--no-deliver` はそのフォールバックを無効にしますが、チャットルートが利用可能な場合にエージェントの `message` ツールを削除するものではありません。

アクティブなチャットから作成されたリマインダーは、フォールバックの announce 配信用に、現在のチャット配信先を保持します。内部セッションキーは小文字の場合があります。Matrix ルーム ID など、大文字と小文字を区別するプロバイダー ID の信頼できる情報源として使用しないでください。

### 失敗時の配信

失敗通知は、次の順序で解決されます。

1. ジョブの `delivery.failureDestination`。
2. グローバルの `cron.failureDestination`。
3. ジョブの主要な announce 宛先（上記のどちらも具体的な宛先として解決されない場合）。

<Note>
メインセッションのジョブは、主要配信モードが `webhook` の場合にのみ `delivery.failureDestination` を使用できます。分離ジョブでは、すべてのモードで使用できます。
</Note>

分離された cron 実行では、応答ペイロードが生成されない場合でも、実行レベルのエージェント障害をジョブエラーとして扱います。そのため、モデル／プロバイダーの障害でもエラーカウンターが増加し、失敗通知がトリガーされます。

コマンド cron ジョブは、分離されたエージェントターンを開始しません。終了コードが 0 の場合は `ok`、0 以外の終了、シグナル、タイムアウト、または出力なしタイムアウトの場合は `error` と記録され、同じ失敗通知経路をトリガーできます。

分離実行が最初のモデルリクエスト前にタイムアウトした場合、`openclaw cron show` と `openclaw cron runs` には、`setup timed out before runner start` のようなフェーズ固有のエラー、または最後に確認された起動フェーズ（たとえば `context-engine`）を示す停止メッセージが含まれます。CLI ベースのプロバイダーでは、外部 CLI ターンが開始するまでモデル実行前のウォッチドッグが有効なため、セッション検索、フック、認証、プロンプト、および CLI セットアップの停止は、モデル実行前の cron 障害として報告されます。

## スケジュール設定

### 1 回限りのジョブ

`--at <datetime>` は、1 回限りの実行をスケジュールします。オフセットのない日時は、`--tz <iana>` も渡さない限り UTC として扱われます。`--tz <iana>` を渡した場合は、指定したタイムゾーンの現地時刻として解釈されます。

<Note>
1 回限りのジョブは、デフォルトでは成功後に削除されます。保持するには `--keep-after-run` を使用します。
</Note>

### 定期ジョブ

定期ジョブでは、連続エラー後に指数的な再試行バックオフを使用します。間隔は 30 秒、1 分、5 分、15 分、60 分です。次回の実行が成功すると、通常のスケジュールに戻ります。

スキップされた実行は、実行エラーとは別に追跡されます。再試行バックオフには影響しませんが、`openclaw cron edit <job-id> --failure-alert-include-skipped` を指定すると、繰り返しスキップされた実行についても失敗アラートを通知できます。

ローカルに設定されたモデルプロバイダー（ベース URL がループバック、プライベートネットワーク、または `.local`）を対象とする分離ジョブでは、エージェントターンを開始する前に、cron が軽量なプロバイダー事前確認を実行します。`api: "ollama"` プロバイダーは `/api/tags` で確認され、その他のローカルな OpenAI 互換プロバイダー（`api: "openai-completions"`、例: vLLM、SGLang、LM Studio）は `/models` で確認されます。エンドポイントに到達できない場合、実行は `skipped` として記録され、後続のスケジュールで再試行されます。同じローカルサーバーを対象とする多数のジョブが繰り返し確認して負荷をかけないよう、到達可能性の結果はエンドポイントごとに 5 分間キャッシュされます。

Cron ジョブ、保留中のランタイム状態、および実行履歴は、共有 SQLite 状態データベースに保存されます。旧形式の `jobs.json`、`<name>-state.json`、`runs/*.jsonl` ファイルは一度だけインポートされ、`.migrated` 接尾辞付きの名前に変更されます。インポート後は JSON ファイルを編集せず、`openclaw cron add|edit|remove` でスケジュールを編集してください。

### 手動実行

`openclaw cron run <job-id>` はデフォルトで強制実行し、手動実行がキューに登録されるとすぐに返ります。成功時の応答には `{ ok: true, enqueued: true, runId }` が含まれます。返された `runId` を使用して、後から結果を確認します。

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

スクリプトで、そのキュー登録された実行が終了状態を記録するまで待機する必要がある場合は、`--wait` を追加します。

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

`--wait` を指定しても、CLI は最初に `cron.run` を呼び出し、その後、返された `runId` に対して `cron.runs` をポーリングします。実行がステータス `ok` で完了した場合にのみ、コマンドは `0` で終了します。実行が `error` または `skipped` で完了した場合、Gateway の応答に `runId` が含まれない場合、または `--wait-timeout` が期限切れになった場合（デフォルトは `10m`、デフォルトでは `2s` ごとにポーリング）は、0 以外で終了します。`--poll-interval` は 0 より大きい値である必要があります。

<Note>
ジョブが現在実行予定の場合にのみ手動コマンドを実行するには、`--due` を使用します。`--due --wait` で実行がキューに登録されなかった場合、コマンドはポーリングせず、通常の未実行応答を返します。
</Note>

## モデル

`cron add|edit --model <ref>` は、ジョブで使用できるモデルを選択します。`cron add|edit --fallbacks <list>` はジョブ単位のフォールバックモデルを設定します。たとえば、`--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5` のように指定します。フォールバックなしの厳格な実行には `--fallbacks ""` を渡します。`cron edit <job-id> --clear-fallbacks` は、ジョブ単位のフォールバックオーバーライドを削除します。`cron edit <job-id> --clear-model` は、ジョブ単位のモデルオーバーライドを削除し、ジョブが通常の cron モデル選択優先順位（保存済みの cron セッションオーバーライドが存在する場合はそれを使用し、それ以外の場合はエージェント／デフォルトモデルを使用）に従うようにします。これは `--model` と組み合わせることはできません。`cron add|edit --thinking <level>` はジョブ単位の思考オーバーライドを設定します。`cron edit <job-id> --clear-thinking` はこれを削除して、ジョブが通常の cron 思考設定の優先順位に従うようにします。これは `--thinking` と組み合わせることはできません。

<Warning>
モデルが許可されていないか解決できない場合、cron はジョブのエージェントまたはデフォルトモデル選択にフォールバックせず、明示的な検証エラーで実行を失敗させます。
</Warning>

Cron の `--model` は**ジョブのプライマリ**であり、チャットセッションの `/model` オーバーライドではありません。つまり、次のように動作します。

- 選択されたジョブモデルが失敗した場合でも、設定済みのモデルフォールバックが適用されます。
- ジョブ単位のペイロードに `fallbacks` が存在する場合、設定済みのフォールバックリストを置き換えます。
- ジョブ単位の空のフォールバックリスト（ジョブのペイロード／API 内の `--fallbacks ""` または `fallbacks: []`）は、cron 実行を厳格にします。
- ジョブに `--model` が指定されていてもフォールバックリストが設定されていない場合、OpenClaw は明示的な空のフォールバックオーバーライドを渡すため、エージェントのプライマリが隠れた再試行先として追加されることはありません。
- ローカルプロバイダーの事前確認では、cron 実行を `skipped` として記録する前に、設定済みのフォールバックを順に確認します。

`openclaw doctor` は、すでに `payload.model` が設定されているジョブについて、プロバイダー名前空間ごとの件数と `agents.defaults.model` との不一致を含めて報告します。ライブチャットとスケジュール済みジョブの間で、認証、プロバイダー、または請求の動作が異なるように見える場合は、この確認を使用してください。

### 分離 cron のモデル優先順位

分離 cron は、次の順序でアクティブなモデルを解決します。

1. Gmail フックのオーバーライド。
2. ジョブ単位の `--model`。
3. 保存済みの cron セッションモデルオーバーライド（ユーザーが選択した場合）。
4. エージェントまたはデフォルトのモデル選択。

### 高速モード

分離 cron の高速モードは、解決済みのライブモデル選択に従います。モデル設定の `params.fastMode` がデフォルトで適用されますが、保存済みセッションの `fastMode` オーバーライドは引き続き設定より優先されます。解決済みモードが `auto` の場合、しきい値には選択されたモデルの `params.fastAutoOnSeconds` 値が使用され、デフォルトは 60 秒です。

### ライブモデル切り替えの再試行

分離実行で `LiveSessionModelSwitchError` がスローされた場合、cron は再試行前に、切り替え後のプロバイダーとモデル（および存在する場合は切り替え後の認証プロファイルオーバーライド）をアクティブな実行用に永続化します。外側の再試行ループは、最初の試行後に 2 回の切り替え再試行までに制限され、それを超えると無限ループせず中止します。

## 実行出力と拒否

### 古い確認応答の抑制

分離された cron ターンでは、古い確認応答のみの返信を抑制します。最初の結果が中間ステータス更新だけであり、最終的な回答を担当する子孫サブエージェント実行がない場合、cron は配信前に実際の結果を得るため、一度だけ再プロンプトします。

### サイレントトークンの抑制

分離された cron 実行がサイレントトークン（`NO_REPLY` または `no_reply`）のみを返した場合、cron は直接の外部配信とフォールバックのキュー済み要約経路の両方を抑制するため、チャットには何も投稿されません。

### 構造化された拒否

分離された cron 実行では、埋め込み実行からの構造化された実行拒否メタデータ（`SYSTEM_RUN_DENIED` または `INVALID_REQUEST` とコード化された致命的な実行ツールエラー）を、正式な拒否シグナルとして使用します。また、これらのコードのいずれかを含むネストされた構造化エラーをラップする Node ホストの `UNAVAILABLE` も認識します。

埋め込み実行が構造化された拒否メタデータも提供していない限り、cron は最終出力の文章や承認拒否のように見えるフレーズを拒否として分類しません。そのため、通常のアシスタントテキストがブロックされたコマンドとして扱われることはありません。

`cron list` と実行履歴には、ブロックされたコマンドを `ok` と報告する代わりに、拒否理由が表示されます。

## 保持

保持とプルーニングは設定で制御します。

- `cron.sessionRetention`（デフォルトは `24h`、無効にする場合は `false`）は、完了した分離実行セッションをプルーニングします。
- `cron.runLog.keepLines`（デフォルトは `2000`）は、ジョブごとに保持される SQLite 実行履歴行をプルーニングします。`cron.runLog.maxBytes`（デフォルトは `2000000`）は、以前のファイルベースの実行ログとの互換性のため引き続き受け付けられます。SQLite のプルーニングは行数に基づきます。

## 古いジョブの移行

<Note>
現在の配信および保存形式より前に作成された cron ジョブがある場合は、`openclaw doctor --fix` を実行してください。Doctor は、従来の cron フィールド（`jobId`、`schedule.cron`、従来の `threadId` を含むトップレベルの配信フィールド、ペイロードの `provider` 配信エイリアス）を正規化し、`notify: true` の Webhook フォールバックジョブを `cron.webhook` から明示的な Webhook 配信へ移行します。すでにチャットへ通知するジョブはその配信を維持し、完了 Webhook の送信先が追加されます。`cron.webhook` が未設定の場合、移行先のないジョブでは動作しないトップレベルの `notify` マーカーが削除されます（既存の配信は変更されず保持されます）。これにより、`doctor --fix` がそれらについて繰り返し警告し続けることはなくなります。
</Note>

## 一般的な編集

メッセージを変更せずに配信設定を更新します。

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

分離されたジョブの配信を無効にします。

```bash
openclaw cron edit <job-id> --no-deliver
```

分離されたジョブで軽量なブートストラップコンテキストを有効にします。

```bash
openclaw cron edit <job-id> --light-context
```

特定のチャンネルに通知します。

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Telegram フォーラムのトピックに通知します。

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

軽量なブートストラップコンテキストを使用する分離ジョブを作成します。

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` は、分離されたエージェントターンジョブにのみ適用されます。cron 実行では、軽量モードはワークスペースの完全なブートストラップセットを挿入せず、ブートストラップコンテキストを空のままにします。

正確な argv、cwd、環境変数、標準入力、出力制限を指定したコマンドジョブを作成します。

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

## 一般的な管理コマンド

手動実行と確認：

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

`openclaw cron list` は、デフォルトですべての一致するジョブを表示します。`--agent <id>` を渡すと、有効な正規化済みエージェント ID が一致するジョブのみを表示します。保存されたエージェント ID がないジョブは、設定済みのデフォルトエージェントとして扱われます。

`openclaw cron get <job-id>` は、保存されているジョブの JSON を直接返します。配信経路のプレビューを含む人間が読みやすい表示が必要な場合は、`cron show <job-id>` を使用します。

`cron list --json` と `cron show <job-id> --json` は、各ジョブに `enabled`、`state.runningAtMs`、`state.lastRunStatus` から計算されたトップレベルの `status` フィールドを含みます。値は `disabled`、`running`、`ok`、`error`、`skipped`、`idle` のいずれかです。外部ツールがジョブの状態を再計算せずに読み取れるよう、JSON のステータスは正規形式かつ装飾なしのままです。人間向け出力では、繰り返される `error` ステータスに失敗回数が付加される場合があります。

`cron runs` の各エントリには、意図された cron の送信先、解決後の送信先、メッセージツールによる送信、フォールバックの使用、配信済み状態を含む配信診断情報が含まれます。

エージェントとセッションの再割り当て：

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

エージェントターンジョブで `--agent` を省略すると、`openclaw cron add` は警告を表示し、デフォルトエージェント（`main`）にフォールバックします。特定のエージェントに固定するには、作成時に `--agent <id>` を渡します。

配信の調整：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --webhook "https://example.invalid/openclaw/cron"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [スケジュールされたタスク](/ja-JP/automation/cron-jobs)

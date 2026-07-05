---
read_when:
    - スケジュールされたジョブとウェイクアップが必要な場合
    - Cron 実行とログをデバッグしている
summary: '`openclaw cron`（バックグラウンドジョブをスケジュールして実行）の CLI リファレンス'
title: Cron
x-i18n:
    generated_at: "2026-07-05T11:07:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c759d15a6abac04ccb5de852a14a4a985895886b6dbc29717ede7e83f9dcb75a
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gateway スケジューラの cron ジョブを管理します。

<Tip>
完全なコマンド範囲については `openclaw cron --help` を実行してください。概念ガイドについては [Cron ジョブ](/ja-JP/automation/cron-jobs) を参照してください。
</Tip>

<Note>
すべての cron 変更（`add`/`create`、`update`/`edit`、`remove`、`run`）には `operator.admin` が必要です。コマンドペイロードの実行は、エージェントの `tools.exec` ツール呼び出しとしてではなく、Gateway プロセス内で直接実行されます。`tools.exec.*` と exec 承認は、モデルから見える exec ツールを引き続き制御します。
</Note>

## ジョブをすばやく作成する

`openclaw cron create` は `openclaw cron add` のエイリアスです。新しいジョブでは、スケジュールを先に、プロンプトを後に指定します。

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

分離されたエージェント/モデル実行を開始せず、OpenClaw cron 内で実行される決定論的なシェル形式のジョブには `--command` を使用します。

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` は `argv: ["sh", "-lc", <shell>]` を保存します。正確な argv 実行には `--command-argv '["node","scripts/report.mjs"]'` を使用します。コマンドジョブは stdout/stderr をキャプチャし、通常の cron 履歴を記録し、分離ジョブと同じ `announce`、`webhook`、または `none` 配信モードを通じて出力をルーティングします。`NO_REPLY` のみを出力するコマンドは抑制されます。

## セッション

`--session` は `main`、`isolated`、`current`、または `session:<id>` を受け付けます。

<AccordionGroup>
  <Accordion title="セッションキー">
    - `main` はエージェントのメインセッションにバインドします。
    - `isolated` は各実行ごとに新しいトランスクリプトとセッション ID を作成します。
    - `current` は作成時点のアクティブセッションにバインドします。
    - `session:<id>` は明示的な永続セッションキーに固定します。

  </Accordion>
  <Accordion title="分離セッションのセマンティクス">
    分離実行は周囲の会話コンテキストをリセットします。チャネルとグループのルーティング、送信/キューポリシー、権限昇格、オリジン、ACP ランタイムバインディングは新しい実行用にリセットされます。安全な設定と、ユーザーが明示的に選択したモデルまたは認証のオーバーライドは、実行間で引き継げます。
  </Accordion>
</AccordionGroup>

## 配信

`openclaw cron list` と `openclaw cron show <job-id>` は解決済みの配信ルートをプレビューします。`channel: "last"` の場合、プレビューはルートがメインセッションまたは現在のセッションから解決されたか、またはフェイルクローズするかを示します。

プロバイダープレフィックス付きターゲットは、未解決の通知チャネルを曖昧さなく指定できます。たとえば、`to: "telegram:123"` は `delivery.channel` が省略されているか `last` の場合に Telegram を選択します。読み込まれた Plugin が広告するプレフィックスのみがプロバイダーセレクターです。`delivery.channel` が明示されている場合、プレフィックスはそのチャネルと一致する必要があります。`channel: "whatsapp"` と `to: "telegram:123"` の組み合わせは拒否されます。`imessage:` や `sms:` などのサービスプレフィックスは、引き続きチャネル所有のターゲット構文です。

<Note>
分離された `cron add` ジョブはデフォルトで `--announce` 配信になります。出力を内部に留めるには `--no-deliver` を使用します。`--deliver` は `--announce` の非推奨エイリアスとして残っています。
</Note>

### 配信の所有権

分離 cron のチャット配信は、エージェントとランナーの間で共有されます。

- チャットルートが利用可能な場合、エージェントは `message` ツールを使って直接送信できます。
- `announce` は、エージェントが解決済みターゲットへ直接送信しなかった場合にのみ、最終応答をフォールバック配信します。
- `webhook` は完了したペイロードを URL に投稿します。
- `none` はランナーのフォールバック配信を無効にします。

Webhook 配信を設定するには、`cron add|create --webhook <url>` または `cron edit <job-id> --webhook <url>` を使用します。`--webhook` を `--announce`、`--no-deliver`、`--channel`、`--to`、`--thread-id`、`--account` などのチャット配信フラグと組み合わせないでください。

`cron edit <job-id>` は、`--clear-channel`、`--clear-to`、`--clear-thread-id`、`--clear-account` で個別の配信ルーティングフィールドを解除できます（それぞれ対応する設定フラグと組み合わせると拒否されます）。ランナーのフォールバック配信だけを無効にする `--no-deliver` とは異なり、これらは保存済みフィールドを削除するため、ジョブはそのルート部分を再びデフォルトから解決します。

`--announce` は最終応答のランナーフォールバック配信です。`--no-deliver` はそのフォールバックを無効にしますが、チャットルートが利用可能な場合にエージェントの `message` ツールを削除するわけではありません。

アクティブなチャットから作成されたリマインダーは、フォールバック通知配信用にライブチャット配信ターゲットを保持します。内部セッションキーは小文字の場合があります。Matrix ルーム ID など、大文字小文字を区別するプロバイダー ID の信頼できる情報源として使用しないでください。

### 失敗時の配信

失敗通知は次の順序で解決されます。

1. ジョブ上の `delivery.failureDestination`。
2. グローバルな `cron.failureDestination`。
3. ジョブのプライマリ通知ターゲット（上記のいずれも具体的な宛先に解決されない場合）。

<Note>
メインセッションジョブで `delivery.failureDestination` を使用できるのは、プライマリ配信モードが `webhook` の場合のみです。分離ジョブはすべてのモードで受け付けます。
</Note>

分離 cron 実行は、応答ペイロードが生成されない場合でも、実行レベルのエージェント失敗をジョブエラーとして扱います。そのため、モデル/プロバイダーの失敗でもエラーカウンターが増加し、失敗通知がトリガーされます。

コマンド cron ジョブは分離エージェントターンを開始しません。終了コード 0 は `ok` を記録します。非ゼロ終了、シグナル、タイムアウト、または出力なしタイムアウトは `error` を記録し、同じ失敗通知パスをトリガーできます。

分離実行が最初のモデルリクエスト前にタイムアウトした場合、`openclaw cron show` と `openclaw cron runs` には、`setup timed out before runner start` などのフェーズ固有エラー、または最後に把握された起動フェーズ（たとえば `context-engine`）を示す停止メッセージが含まれます。CLI ベースのプロバイダーでは、外部 CLI ターンが開始するまでプリモデルウォッチドッグが有効なままなので、セッション検索、フック、認証、プロンプト、CLI セットアップの停止はプリモデル cron 失敗として報告されます。

## スケジューリング

### ワンショットジョブ

`--at <datetime>` はワンショット実行をスケジュールします。オフセットのない日時は、`--tz <iana>` も渡さない限り UTC として扱われます。`--tz <iana>` を渡すと、指定されたタイムゾーンの壁時計時刻として解釈されます。

<Note>
ワンショットジョブはデフォルトで成功後に削除されます。保持するには `--keep-after-run` を使用します。
</Note>

### 繰り返しジョブ

繰り返しジョブは、連続エラーの後に指数バックオフで再試行します: 30秒、1分、5分、15分、60分。次回の成功実行後、スケジュールは通常に戻ります。

スキップされた実行は実行エラーとは別に追跡されます。再試行バックオフには影響しませんが、`openclaw cron edit <job-id> --failure-alert-include-skipped` により、失敗アラートで繰り返しのスキップ実行通知を有効にできます。

local loopback、プライベートネットワーク、または `.local` 上のベース URL を持つローカル設定済みモデルプロバイダーを対象とする分離ジョブでは、cron はエージェントターンを開始する前に軽量なプロバイダープリフライトを実行します。`api: "ollama"` プロバイダーは `/api/tags` で検査されます。その他のローカル OpenAI 互換プロバイダー（`api: "openai-completions"`、例: vLLM、SGLang、LM Studio）は `/models` で検査されます。エンドポイントに到達できない場合、実行は `skipped` として記録され、後のスケジュールで再試行されます。到達可能性の結果はエンドポイントごとに 5 分間キャッシュされるため、同じローカルサーバーに対する多数のジョブが繰り返しの検査で負荷をかけることはありません。

cron ジョブ、保留中のランタイム状態、実行履歴は共有 SQLite 状態データベースにあります。従来の `jobs.json`、`<name>-state.json`、`runs/*.jsonl` ファイルは一度だけインポートされ、`.migrated` サフィックス付きにリネームされます。インポート後は、JSON ファイルを編集する代わりに `openclaw cron add|edit|remove` でスケジュールを編集してください。

### 手動実行

`openclaw cron run <job-id>` はデフォルトで強制実行し、手動実行がキューに入るとすぐに戻ります。成功した応答には `{ ok: true, enqueued: true, runId }` が含まれます。返された `runId` を使用して後の結果を調べます。

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

スクリプトがその正確なキュー済み実行の終端ステータス記録までブロックする必要がある場合は `--wait` を追加します。

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

`--wait` を指定しても、CLI はまず `cron.run` を呼び出し、その後返された `runId` に対して `cron.runs` をポーリングします。コマンドは、実行がステータス `ok` で完了した場合にのみ `0` で終了します。実行が `error` または `skipped` で完了した場合、Gateway 応答に `runId` が含まれない場合、または `--wait-timeout` が期限切れになった場合（デフォルトは `10m`、デフォルトで `2s` ごとにポーリング）は非ゼロで終了します。`--poll-interval` は 0 より大きい必要があります。

<Note>
ジョブが現在期限到来している場合にのみ手動コマンドを実行したい場合は、`--due` を使用します。`--due --wait` が実行をキューに入れない場合、コマンドはポーリングする代わりに通常の非実行応答を返します。
</Note>

## モデル

`cron add|edit --model <ref>` はジョブで許可されたモデルを選択します。`cron add|edit --fallbacks <list>` はジョブごとのフォールバックモデルを設定します。たとえば `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5` です。フォールバックなしの厳密な実行には `--fallbacks ""` を渡します。`cron edit <job-id> --clear-fallbacks` はジョブごとのフォールバックオーバーライドを削除します。`cron edit <job-id> --clear-model` はジョブごとのモデルオーバーライドを削除し、ジョブが通常の cron モデル選択優先順位（存在する場合は保存済み cron セッションオーバーライド、そうでなければエージェント/デフォルトモデル）に従うようにします。これは `--model` と組み合わせることはできません。`cron add|edit --thinking <level>` はジョブごとの thinking オーバーライドを設定します。`cron edit <job-id> --clear-thinking` はそれを削除し、ジョブが通常の cron thinking 優先順位に従うようにします。これは `--thinking` と組み合わせることはできません。

<Warning>
モデルが許可されていない、または解決できない場合、cron はジョブのエージェントまたはデフォルトモデル選択にフォールバックする代わりに、明示的な検証エラーで実行を失敗させます。
</Warning>

Cron の `--model` はチャットセッションの `/model` オーバーライドではなく、**ジョブのプライマリ**です。つまり、次のようになります。

- 選択されたジョブモデルが失敗した場合でも、設定済みモデルフォールバックは適用されます。
- ジョブごとのペイロード `fallbacks` が存在する場合、設定済みフォールバックリストを置き換えます。
- 空のジョブごとのフォールバックリスト（ジョブペイロード/API で `--fallbacks ""` または `fallbacks: []`）は、cron 実行を厳密にします。
- ジョブに `--model` があり、フォールバックリストが設定されていない場合、OpenClaw は明示的に空のフォールバックオーバーライドを渡すため、エージェントのプライマリが隠れた再試行ターゲットとして追加されることはありません。
- ローカルプロバイダーのプリフライトチェックは、cron 実行を `skipped` とマークする前に設定済みフォールバックをたどります。

`openclaw doctor` は、`payload.model` がすでに設定されているジョブを、プロバイダー名前空間の件数や `agents.defaults.model` との不一致を含めて報告します。認証、プロバイダー、または課金の動作がライブチャットとスケジュール済みジョブの間で異なるように見える場合は、そのチェックを使用してください。

### 分離 cron のモデル優先順位

分離 cron は、次の順序でアクティブモデルを解決します。

1. Gmail フックオーバーライド。
2. ジョブごとの `--model`。
3. 保存済み cron セッションモデルオーバーライド（ユーザーが選択した場合）。
4. エージェントまたはデフォルトモデル選択。

### 高速モード

分離 cron の高速モードは、解決済みのライブモデル選択に従います。モデル設定 `params.fastMode` はデフォルトで適用されますが、保存済みセッション `fastMode` オーバーライドがある場合は設定より優先されます。解決済みモードが `auto` の場合、カットオフは選択されたモデルの `params.fastAutoOnSeconds` 値を使用し、デフォルトは 60 秒です。

### ライブモデル切り替えの再試行

分離実行が `LiveSessionModelSwitchError` をスローした場合、cron は再試行前に、アクティブな実行用に切り替え後のプロバイダーとモデル（存在する場合は切り替え後の認証プロファイルオーバーライド）を永続化します。外側の再試行ループは、最初の試行後に 2 回の切り替え再試行までに制限され、その後は無限ループする代わりに中止されます。

## 実行出力と拒否

### 古い確認応答の抑制

分離 cron ターンは、古い確認応答のみの返信を抑制します。最初の結果が単なる一時的なステータス更新であり、最終的な回答を担当する子孫サブエージェント実行がない場合、cron は配信前に実際の結果を一度だけ再プロンプトします。

### サイレントトークンの抑制

分離 cron 実行がサイレントトークン（`NO_REPLY` または `no_reply`）だけを返した場合、cron は直接の外向き配信とフォールバックのキュー済み要約パスの両方を抑制するため、チャットには何も投稿されません。

### 構造化された拒否

分離 cron 実行は、埋め込み実行からの構造化された実行拒否メタデータ（`SYSTEM_RUN_DENIED` または `INVALID_REQUEST` とコード化された致命的な exec-tool エラー）を、権威ある拒否シグナルとして使用します。また、これらのコードのいずれかを含むネストされた構造化エラーをラップする node-host の `UNAVAILABLE` ラッパーも尊重します。

cron は、埋め込み実行が構造化された拒否メタデータも提供していない限り、最終出力の文章や承認拒否に見えるフレーズを拒否として分類しません。そのため、通常のアシスタントテキストはブロックされたコマンドとして扱われません。

`cron list` と実行履歴は、ブロックされたコマンドを `ok` と報告する代わりに、拒否理由を表示します。

## 保持

保持とプルーニングは config で制御されます。

- `cron.sessionRetention`（デフォルトは `24h`、無効にするには `false`）は、完了した分離実行セッションをプルーニングします。
- `cron.runLog.keepLines`（デフォルトは `2000`）は、ジョブごとに保持された SQLite 実行履歴行をプルーニングします。`cron.runLog.maxBytes`（デフォルトは `2000000`）は、古いファイルベースの実行ログとの互換性のために引き続き受け付けられます。SQLite のプルーニングは行数ベースです。

## 古いジョブの移行

<Note>
現在の配信形式と保存形式より前の cron ジョブがある場合は、`openclaw doctor --fix` を実行してください。Doctor はレガシー cron フィールド（`jobId`、`schedule.cron`、レガシー `threadId` を含むトップレベルの配信フィールド、payload `provider` 配信エイリアス）を正規化し、`notify: true` の Webhook フォールバックジョブを `cron.webhook` から明示的な Webhook 配信へ移行します。すでにチャットへ通知しているジョブはその配信を維持し、完了 Webhook の送信先を取得します。`cron.webhook` が未設定の場合、移行先のないジョブでは不活性なトップレベルの `notify` マーカーが削除されます（既存の配信は変更されずに保持されます）。そのため、`doctor --fix` はそれらについて再警告し続けなくなります。
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

分離ジョブで軽量ブートストラップコンテキストを有効にします。

```bash
openclaw cron edit <job-id> --light-context
```

特定のチャンネルへ通知します。

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Telegram フォーラムトピックへ通知します。

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

軽量ブートストラップコンテキスト付きの分離ジョブを作成します。

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` は分離されたエージェントターンジョブにのみ適用されます。cron 実行では、軽量モードは完全なワークスペースブートストラップセットを注入する代わりに、ブートストラップコンテキストを空に保ちます。

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

`openclaw cron list` はデフォルトですべての一致するジョブを表示します。実効的に正規化されたエージェント ID が一致するジョブだけを表示するには、`--agent <id>` を渡します。保存されたエージェント ID のないジョブは、設定済みのデフォルトエージェントとして数えられます。

`openclaw cron get <job-id>` は、保存されたジョブ JSON を直接返します。配信ルートのプレビューを含む人間が読みやすい表示が必要な場合は、`cron show <job-id>` を使用します。

`cron list --json` と `cron show <job-id> --json` は、各ジョブにトップレベルの `status` フィールドを含めます。これは `enabled`、`state.runningAtMs`、`state.lastRunStatus` から計算されます。値は `disabled`、`running`、`ok`、`error`、`skipped`、または `idle` です。これは人間が読みやすいステータス列を反映するため、外部ツールはジョブ状態を再導出せずに読み取れます。

`cron runs` エントリには、意図された cron ターゲット、解決済みターゲット、message-tool 送信、フォールバックの使用、配信済み状態を含む配信診断が含まれます。

エージェントとセッションの再ターゲット:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` は、エージェントターンジョブで `--agent` が省略された場合に警告し、デフォルトエージェント（`main`）へフォールバックします。特定のエージェントに固定するには、作成時に `--agent <id>` を渡します。

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

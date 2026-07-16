---
read_when:
    - スケジュールされたジョブとウェイクアップを使用したい場合
    - Cron の実行とログをデバッグする
summary: '`openclaw cron` の CLI リファレンス（バックグラウンドジョブのスケジュール設定と実行）'
title: Cron
x-i18n:
    generated_at: "2026-07-16T11:32:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: eb897fde0798563144703cd2f3a2bc6c20229aa4135af9c6db41995e66ffd2d1
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gateway スケジューラの cron ジョブを管理します。

<Tip>
コマンド全体の詳細については、`openclaw cron --help` を実行してください。概念ガイドについては、[Cron ジョブ](/ja-JP/automation/cron-jobs)を参照してください。
</Tip>

<Note>
すべての cron 変更操作（`add`/`create`、`update`/`edit`、`remove`、`run`）には `operator.admin` が必要です。コマンドペイロードの実行は、エージェントの `tools.exec` ツール呼び出しとしてではなく、Gateway プロセス内で直接実行されます。モデルから参照可能な exec ツールには、引き続き `tools.exec.*` と exec 承認が適用されます。
</Note>

## ジョブをすばやく作成する

`openclaw cron create` は `openclaw cron add` のエイリアスです。新しいジョブでは、スケジュールを先に、プロンプトを後に指定します。

```bash
openclaw cron create "0 7 * * *" \
  "夜間の更新を要約してください。" \
  --name "朝の概要" \
  --agent ops
```

チャットターゲットに配信する代わりに、完了したペイロードを POST するジョブには `--webhook <url>` を使用します。

```bash
openclaw cron create "0 18 * * 1-5" \
  "今日のデプロイを JSON 形式で要約してください。" \
  --name "デプロイ概要" \
  --webhook "https://example.invalid/openclaw/cron"
```

分離されたエージェント／モデル実行を開始せず、OpenClaw cron 内で動作する決定論的なシェル形式のジョブには `--command` を使用します。

```bash
openclaw cron create "*/15 * * * *" \
  --name "キュー深度の調査" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` は `argv: ["sh", "-lc", <shell>]` を保存します。argv を厳密に指定して実行するには `--command-argv '["node","scripts/report.mjs"]'` を使用します。コマンドジョブは stdout/stderr をキャプチャし、通常の cron 履歴を記録して、分離ジョブと同じ `announce`、`webhook`、または `none` の配信モードで出力をルーティングします。`NO_REPLY` だけを出力するコマンドは抑制されます。

## セッション

`--session` には `main`、`isolated`、`current`、または `session:<id>` を指定できます。

<AccordionGroup>
  <Accordion title="セッションキー">
    - `main` はエージェントのメインセッションにバインドします。
    - `isolated` は実行ごとに新しいトランスクリプトとセッション ID を作成します。
    - `current` は作成時点でアクティブなセッションにバインドします。
    - `session:<id>` は明示的な永続セッションキーに固定します。

  </Accordion>
  <Accordion title="分離セッションのセマンティクス">
    分離実行では、周囲の会話コンテキストがリセットされます。チャネルとグループのルーティング、送信／キューポリシー、権限昇格、オリジン、ACP ランタイムのバインドは、新しい実行用にリセットされます。安全な設定と、ユーザーが明示的に選択したモデルまたは認証のオーバーライドは、実行間で引き継ぐことができます。
  </Accordion>
</AccordionGroup>

## 配信

`openclaw cron list` と `openclaw cron show <job-id>` は、解決された配信ルートをプレビューします。`channel: "last"` の場合、プレビューにはルートがメインセッションと現在のセッションのどちらから解決されたか、またはフェイルクローズになるかが表示されます。

プロバイダー接頭辞付きのターゲットを使用すると、未解決の通知チャネルを明確に指定できます。たとえば、`delivery.channel` が省略されているか `last` の場合、`to: "telegram:123"` は Telegram を選択します。読み込まれた Plugin が通知する接頭辞のみが、プロバイダーセレクターとして使用されます。`delivery.channel` が明示的に指定されている場合、接頭辞はそのチャネルと一致する必要があります。`channel: "whatsapp"` と `to: "telegram:123"` の組み合わせは拒否されます。`imessage:` や `sms:` などのサービス接頭辞は、引き続きチャネルが所有するターゲット構文です。

<Note>
分離された `cron add` ジョブのデフォルトは、`--announce` 配信です。出力を内部に保持するには `--no-deliver` を使用します。`--deliver` は、`--announce` の非推奨エイリアスとして残されています。
</Note>

### 配信の所有権

分離された cron のチャット配信は、エージェントとランナーで共有されます。

- チャットルートを利用できる場合、エージェントは `message` ツールを使用して直接送信できます。
- `announce` は、エージェントが解決済みターゲットに直接送信しなかった場合に限り、最終応答をフォールバック配信します。
- `webhook` は完了したペイロードを URL に POST します。
- `none` はランナーのフォールバック配信を無効にします。

Webhook 配信を設定するには、`cron add|create --webhook <url>` または `cron edit <job-id> --webhook <url>` を使用します。`--webhook` を、`--announce`、`--no-deliver`、`--channel`、`--to`、`--thread-id`、`--account` などのチャット配信フラグと組み合わせないでください。

`cron edit <job-id>` は、`--clear-channel`、`--clear-to`、`--clear-thread-id`、`--clear-account` を使用して個別の配信ルーティングフィールドを解除できます（それぞれ、対応する設定フラグとの併用は拒否されます）。ランナーのフォールバック配信のみを無効にする `--no-deliver` とは異なり、これらは保存されたフィールドを削除するため、ジョブはそのルート部分を再びデフォルトから解決します。

`--announce` は、最終応答に対するランナーのフォールバック配信です。`--no-deliver` はそのフォールバックを無効にしますが、チャットルートを利用できる場合にエージェントの `message` ツールを削除することはありません。

アクティブなチャットから作成されたリマインダーでは、フォールバック通知配信用に現在のチャット配信ターゲットが保持されます。内部セッションキーは小文字の場合があります。Matrix のルーム ID など、大文字と小文字が区別されるプロバイダー ID の信頼できる情報源として使用しないでください。

### 失敗時の配信

失敗通知は次の順序で解決されます。

1. ジョブの `delivery.failureDestination`。
2. グローバルな `cron.failureDestination`。
3. ジョブのプライマリ通知ターゲット（上記のいずれも具体的な宛先として解決されない場合）。

<Note>
メインセッションのジョブで `delivery.failureDestination` を使用できるのは、プライマリ配信モードが `webhook` の場合に限られます。分離ジョブでは、すべてのモードで使用できます。
</Note>

分離された cron 実行では、応答ペイロードが生成されない場合でも、実行レベルのエージェント障害をジョブエラーとして扱います。そのため、モデル／プロバイダーの障害でもエラーカウンターが増加し、失敗通知がトリガーされます。

コマンド cron ジョブは、分離されたエージェントターンを開始しません。終了コードが 0 の場合は `ok` が記録され、0 以外の終了、シグナル、タイムアウト、または無出力タイムアウトの場合は `error` が記録され、同じ失敗通知経路がトリガーされることがあります。

分離実行が最初のモデルリクエスト前にタイムアウトした場合、`openclaw cron show` と `openclaw cron runs` には、`setup timed out before runner start` などのフェーズ固有のエラー、または最後に確認された起動フェーズを示す停止メッセージ（例: `context-engine`）が含まれます。CLI ベースのプロバイダーでは、外部 CLI ターンが開始するまでモデル前ウォッチドッグが有効なため、セッション検索、フック、認証、プロンプト、CLI セットアップの停止は、モデル前の cron 障害として報告されます。

## スケジュール

### 1 回限りのジョブ

`--at <datetime>` は 1 回限りの実行をスケジュールします。オフセットのない日時は UTC として扱われます。ただし、`--tz <iana>` も渡した場合は、指定されたタイムゾーンの現地時刻として解釈されます。

<Note>
1 回限りのジョブは、デフォルトでは成功後に削除されます。保持するには `--keep-after-run` を使用します。
</Note>

### 定期ジョブ

定期ジョブでは、連続エラーの後に指数バックオフによる再試行を行います（30s、1m、5m、15m、60m）。次回の実行が成功すると、通常のスケジュールに戻ります。

スキップされた実行は、実行エラーとは別に追跡されます。再試行バックオフには影響しませんが、`openclaw cron edit <job-id> --failure-alert-include-skipped` を使用すると、繰り返しスキップされた実行の通知を失敗アラートに含めることができます。

ローカルに設定されたモデルプロバイダー（loopback、プライベートネットワーク、または `.local` 上のベース URL）を対象とする分離ジョブでは、cron はエージェントターンの開始前に軽量なプロバイダー事前確認を実行します。`api: "ollama"` プロバイダーは `/api/tags` で、それ以外のローカルな OpenAI 互換プロバイダー（`api: "openai-completions"`、例: vLLM、SGLang、LM Studio）は `/models` で確認されます。エンドポイントに到達できない場合、実行は `skipped` として記録され、後のスケジュールで再試行されます。同じローカルサーバーに対する多数のジョブが繰り返し確認を行わないよう、到達可能性の結果はエンドポイントごとに 5 分間キャッシュされます。

cron ジョブ、保留中のランタイム状態、実行履歴は、共有 SQLite 状態データベースに保存されます。従来の `jobs.json`、`<name>-state.json`、`runs/*.jsonl` ファイルは一度だけインポートされ、`.migrated` 接尾辞を付けて名前が変更されます。インポート後は、JSON ファイルを編集する代わりに `openclaw cron add|edit|remove` でスケジュールを編集してください。

### 手動実行

`openclaw cron run <job-id>` はデフォルトで強制実行し、手動実行がキューに入るとすぐに返ります。成功時の応答には `{ ok: true, enqueued: true, runId }` が含まれます。返された `runId` を使用して、後で結果を確認します。

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

スクリプトが、そのキューに入れられた実行が終了ステータスを記録するまでブロックする必要がある場合は、`--wait` を追加します。

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

`--wait` を指定した場合でも、CLI は最初に `cron.run` を呼び出し、その後、返された `runId` について `cron.runs` をポーリングします。実行がステータス `ok` で終了した場合に限り、コマンドは `0` で終了します。実行が `error` または `skipped` で終了した場合、Gateway の応答に `runId` が含まれない場合、または `--wait-timeout` の期限が切れた場合（デフォルトは `10m`、デフォルトでは `2s` ごとにポーリング）、0 以外で終了します。`--poll-interval` は 0 より大きくなければなりません。

<Note>
ジョブが現在実行予定の場合に限り手動コマンドを実行するには、`--due` を使用します。`--due --wait` が実行をキューに追加しない場合、コマンドはポーリングせず、通常の未実行応答を返します。
</Note>

## モデル

`cron add|edit --model <ref>` はジョブで許可されるモデルを選択します。`cron add|edit --fallbacks <list>` はジョブごとのフォールバックモデルを設定します（例: `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`）。フォールバックなしで厳密に実行するには `--fallbacks ""` を渡します。`cron edit <job-id> --clear-fallbacks` はジョブごとのフォールバックオーバーライドを削除します。`cron edit <job-id> --clear-model` はジョブごとのモデルオーバーライドを削除し、ジョブが通常の cron モデル選択優先順位（保存された cron セッションのオーバーライドがある場合はそれを使用し、それ以外の場合はエージェント／デフォルトモデルを使用）に従うようにします。`--model` とは組み合わせられません。`cron add|edit --thinking <level>` はジョブごとの思考オーバーライドを設定します。`cron edit <job-id> --clear-thinking` はそれを削除して、ジョブが通常の cron 思考優先順位に従うようにします。`--thinking` とは組み合わせられません。

<Warning>
モデルが許可されていないか解決できない場合、cron はジョブのエージェントまたはデフォルトモデルの選択にフォールバックせず、明示的な検証エラーで実行を失敗させます。
</Warning>

Cron の `--model` はチャットセッションの `/model` オーバーライドではなく、**ジョブのプライマリ**です。つまり、次のようになります。

- 選択したジョブモデルが失敗した場合でも、設定済みのモデルフォールバックが適用されます。
- ジョブごとのペイロード `fallbacks` が存在する場合、設定済みのフォールバックリストを置き換えます。
- ジョブごとの空のフォールバックリスト（ジョブのペイロード／API 内の `--fallbacks ""` または `fallbacks: []`）により、cron 実行は厳密になります。
- ジョブに `--model` が設定されていてもフォールバックリストが設定されていない場合、OpenClaw は明示的な空のフォールバックオーバーライドを渡すため、エージェントのプライマリが暗黙の再試行ターゲットとして追加されることはありません。
- ローカルプロバイダーの事前確認では、cron 実行を `skipped` として記録する前に、設定済みのフォールバックを順に確認します。

`openclaw doctor` は、`payload.model` がすでに設定されているジョブを、プロバイダー名前空間の件数と `agents.defaults.model` との不一致を含めて報告します。ライブチャットとスケジュール済みジョブの間で、認証、プロバイダー、または課金の動作が異なる場合は、この確認を使用してください。

### 分離 cron のモデル優先順位

分離 cron は、次の順序でアクティブなモデルを解決します。

1. Gmail フックのオーバーライド。
2. ジョブごとの `--model`。
3. 保存された cron セッションのモデルオーバーライド（ユーザーが選択した場合）。
4. エージェントまたはデフォルトのモデル選択。

### 高速モード

分離された Cron の高速モードは、解決済みのライブモデル選択に従います。モデル設定 `params.fastMode` がデフォルトで適用されますが、保存されたセッションの `fastMode` オーバーライドは引き続き設定より優先されます。解決済みのモードが `auto` の場合、カットオフには選択されたモデルの `params.fastAutoOnSeconds` 値が使用され、デフォルトは 60 秒です。

### ライブモデル切り替えの再試行

分離された実行が `LiveSessionModelSwitchError` をスローした場合、Cron は再試行前に、切り替え後のプロバイダーとモデル（存在する場合は切り替え後の認証プロファイルのオーバーライドも）をアクティブな実行に永続化します。外側の再試行ループでは、最初の試行後の切り替え再試行は 2 回までに制限され、その後は無限ループせずに中止します。

## 実行出力と拒否

### 古い確認応答の抑制

分離された Cron ターンでは、古い確認応答のみの返信を抑制します。最初の結果が単なる暫定ステータス更新で、最終的な回答を担当する子孫サブエージェント実行がない場合、Cron は配信前に実際の結果を求めて 1 回だけ再プロンプトします。

### サイレントトークンの抑制

分離された Cron 実行がサイレントトークン（`NO_REPLY` または `no_reply`）のみを返した場合、Cron は直接の送信配信とフォールバックのキュー済み要約経路の両方を抑制するため、チャットには何も投稿されません。

### 構造化された拒否

分離された Cron 実行では、埋め込み実行からの構造化された実行拒否メタデータ（`SYSTEM_RUN_DENIED` または `INVALID_REQUEST` としてコード化された致命的な実行ツールエラー）を、正式な拒否シグナルとして使用します。また、これらのコードのいずれかを持つネストされた構造化エラーをラップする Node ホストの `UNAVAILABLE` ラッパーも認識します。

埋め込み実行が構造化された拒否メタデータも提供しない限り、Cron は最終出力の文章や承認を求めているように見える拒否フレーズを拒否として分類しません。そのため、通常のアシスタントテキストがブロックされたコマンドとして扱われることはありません。

`cron list` と実行履歴では、ブロックされたコマンドを `ok` として報告する代わりに、拒否理由が表示されます。

## 保持

保持動作：

- `cron.sessionRetention`（デフォルトは `24h`、無効にするには `false`）は、完了した分離実行セッションを削除します。
- 実行履歴は、Cron ジョブごとに最新の 2000 件の終了行を保持します。消失した行には、標準の 24 時間の消失タスククリーンアップ期間が引き続き適用されます。

## 古いジョブの移行

<Note>
現在の配信形式および保存形式より前に作成された Cron ジョブがある場合は、`openclaw doctor --fix` を実行してください。Doctor は、従来の Cron フィールド（`jobId`、`schedule.cron`、従来の `threadId` を含むトップレベルの配信フィールド、ペイロードの `provider` 配信エイリアス）を正規化し、`notify: true` Webhook フォールバックジョブを `cron.webhook` から明示的な Webhook 配信へ移行します。すでにチャットへ通知するジョブはその配信を維持し、完了 Webhook の宛先が追加されます。`cron.webhook` が未設定の場合、移行先のないジョブから無効なトップレベルの `notify` マーカーが削除されます（既存の配信は変更されずに維持されます）。これにより、`doctor --fix` がそれらについて繰り返し警告しなくなります。
</Note>

## 一般的な編集

メッセージを変更せずに配信設定を更新する：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

分離されたジョブの配信を無効にする：

```bash
openclaw cron edit <job-id> --no-deliver
```

分離されたジョブで軽量なブートストラップコンテキストを有効にする：

```bash
openclaw cron edit <job-id> --light-context
```

特定のチャンネルに通知する：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Telegram フォーラムのトピックに通知する：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

軽量なブートストラップコンテキストを使用する分離ジョブを作成する：

```bash
openclaw cron create "0 7 * * *" \
  "夜間の更新を要約してください。" \
  --name "軽量な朝の概要" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` は、分離されたエージェントターンのジョブにのみ適用されます。Cron 実行では、軽量モードはワークスペースのブートストラップセット全体を注入せず、ブートストラップコンテキストを空のままにします。

正確な argv、cwd、env、stdin、および出力制限を指定してコマンドジョブを作成する：

```bash
openclaw cron create "*/30 * * * *" \
  --name "ポジションのエクスポート" \
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

`openclaw cron list` は、デフォルトですべての一致するジョブを表示します。実効的な正規化済みエージェント ID が一致するジョブのみを表示するには、`--agent <id>` を渡します。保存されたエージェント ID がないジョブは、設定済みのデフォルトエージェントとして扱われます。

`openclaw cron get <job-id>` は、保存されたジョブの JSON を直接返します。配信ルートのプレビューを含む、人間が読みやすい表示が必要な場合は、`cron show <job-id>` を使用します。

`cron list --json` と `cron show <job-id> --json` は、各ジョブにトップレベルの `status` フィールドを含みます。このフィールドは、`enabled`、`state.runningAtMs`、および `state.lastRunStatus` から算出されます。値は、`disabled`、`running`、`ok`、`error`、`skipped`、または `idle` です。外部ツールがジョブの状態を再導出せずに読み取れるように、JSON のステータスは標準形式のまま装飾されません。人間向けの出力では、繰り返される `error` ステータスに失敗回数が付加される場合があります。

`cron runs` のエントリには、想定された Cron の宛先、解決済みの宛先、メッセージツールによる送信、フォールバックの使用、および配信済み状態を含む配信診断が含まれます。

エージェントとセッションの再指定：

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` は、エージェントターンのジョブで `--agent` が省略された場合に警告し、デフォルトのエージェント（`main`）へフォールバックします。特定のエージェントに固定するには、作成時に `--agent <id>` を渡します。

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

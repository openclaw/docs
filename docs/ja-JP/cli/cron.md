---
read_when:
    - スケジュールされたジョブとウェイクアップが必要な場合
    - Cron の実行とログをデバッグしている
summary: '`openclaw cron` の CLI リファレンス（バックグラウンドジョブをスケジュールして実行する）'
title: Cron
x-i18n:
    generated_at: "2026-05-10T19:27:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1575213cfcc6cb9991e0aed48722e737d930570ce8527532188b345810982892
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gateway スケジューラの cron ジョブを管理します。

<Tip>
完全なコマンド一覧は `openclaw cron --help` を実行してください。概念ガイドは [Cron ジョブ](/ja-JP/automation/cron-jobs) を参照してください。
</Tip>

## セッション

`--session` は `main`、`isolated`、`current`、または `session:<id>` を受け付けます。

<AccordionGroup>
  <Accordion title="セッションキー">
    - `main` はエージェントのメインセッションにバインドします。
    - `isolated` は実行ごとに新しいトランスクリプトとセッション ID を作成します。
    - `current` は作成時点のアクティブセッションにバインドします。
    - `session:<id>` は明示的な永続セッションキーに固定します。

  </Accordion>
  <Accordion title="分離セッションのセマンティクス">
    分離実行では周囲の会話コンテキストがリセットされます。チャネルとグループのルーティング、送信/キュー方針、昇格、起点、ACP ランタイムバインディングは新しい実行のためにリセットされます。安全な設定と、ユーザーが明示的に選択したモデルまたは認証のオーバーライドは、実行間で引き継げます。
  </Accordion>
</AccordionGroup>

## 配信

`openclaw cron list` と `openclaw cron show <job-id>` は解決済みの配信ルートをプレビューします。`channel: "last"` の場合、プレビューはルートがメインセッションまたは現在のセッションから解決されたか、またはクローズドに失敗するかを表示します。

プロバイダー接頭辞付きターゲットを使うと、未解決の通知チャネルを曖昧さなく指定できます。たとえば、`delivery.channel` が省略されているか `last` の場合、`to: "telegram:123"` は Telegram を選択します。読み込まれた Plugin によって広告された接頭辞だけがプロバイダーセレクターです。`delivery.channel` が明示されている場合、接頭辞はそのチャネルと一致する必要があります。`channel: "whatsapp"` と `to: "telegram:123"` の組み合わせは拒否されます。`imessage:` や `sms:` などのサービス接頭辞は、引き続きチャネル所有のターゲット構文です。

<Note>
分離された `cron add` ジョブは既定で `--announce` 配信になります。出力を内部に留めるには `--no-deliver` を使用してください。`--deliver` は `--announce` の非推奨エイリアスとして残ります。
</Note>

### 配信の所有権

分離 cron チャット配信は、エージェントとランナーの間で共有されます。

- エージェントは、チャットルートが利用可能な場合に `message` ツールを使用して直接送信できます。
- `announce` は、エージェントが解決済みターゲットへ直接送信しなかった場合にのみ、最終応答をフォールバック配信します。
- `webhook` は完了したペイロードを URL に投稿します。
- `none` はランナーのフォールバック配信を無効にします。

`--announce` は、最終応答に対するランナーのフォールバック配信です。`--no-deliver` はそのフォールバックを無効にしますが、チャットルートが利用可能な場合にエージェントの `message` ツールを削除するわけではありません。

アクティブなチャットから作成されたリマインダーは、フォールバック通知配信用にライブチャット配信ターゲットを保持します。内部セッションキーは小文字の場合があります。Matrix ルーム ID など、大文字小文字を区別するプロバイダー ID の信頼できる情報源として使用しないでください。

### 失敗配信

失敗通知は次の順序で解決されます。

1. ジョブの `delivery.failureDestination`。
2. グローバルの `cron.failureDestination`。
3. ジョブのプライマリ通知ターゲット（明示的な失敗宛先が設定されていない場合）。

<Note>
メインセッションのジョブは、プライマリ配信モードが `webhook` の場合にのみ `delivery.failureDestination` を使用できます。分離ジョブではすべてのモードで使用できます。
</Note>

注: 分離 cron 実行では、応答ペイロードが生成されない場合でも、実行レベルのエージェント失敗をジョブエラーとして扱うため、モデル/プロバイダーの失敗もエラーカウンターを増やし、失敗通知をトリガーします。

分離実行が最初のモデルリクエストの前にタイムアウトした場合、`openclaw cron show` と `openclaw cron runs` には、`setup timed out before runner start` や `stalled before first model call (last phase: context-engine)` などのフェーズ固有エラーが含まれます。
CLI ベースのプロバイダーでは、外部 CLI ターンが開始するまでモデル前ウォッチドッグがアクティブなままになるため、セッション検索、フック、認証、プロンプト、CLI セットアップの停止はモデル前の cron 失敗として報告されます。

## スケジュール設定

### ワンショットジョブ

`--at <datetime>` はワンショット実行をスケジュールします。オフセットなしの日時は、`--tz <iana>` も渡さない限り UTC として扱われます。`--tz <iana>` を渡すと、指定されたタイムゾーンの壁時計時刻として解釈されます。

<Note>
ワンショットジョブは既定で成功後に削除されます。保持するには `--keep-after-run` を使用してください。
</Note>

### 繰り返しジョブ

繰り返しジョブは、連続エラー後に指数的リトライバックオフを使用します: 30s、1m、5m、15m、60m。次の実行が成功すると、スケジュールは通常に戻ります。

スキップされた実行は、実行エラーとは別に追跡されます。リトライバックオフには影響しませんが、`openclaw cron edit <job-id> --failure-alert-include-skipped` を使うと、失敗アラートに繰り返しのスキップ実行通知を含めることができます。

ローカルに設定されたモデルプロバイダーを対象にする分離ジョブでは、cron はエージェントターンを開始する前に軽量なプロバイダープリフライトを実行します。Loopback、プライベートネットワーク、`.local` の `api: "ollama"` プロバイダーは `/api/tags` でプローブされます。vLLM、SGLang、LM Studio などのローカル OpenAI 互換プロバイダーは `/models` でプローブされます。エンドポイントに到達できない場合、実行は `skipped` として記録され、後のスケジュールで再試行されます。一致する停止エンドポイントは、同じローカルサーバーに多数のジョブが集中しないよう 5 分間キャッシュされます。

注: cron ジョブ定義は `jobs.json` に保存され、保留中のランタイム状態は `jobs-state.json` に保存されます。`jobs.json` が外部で編集された場合、Gateway は変更されたスケジュールを再読み込みし、古い保留スロットをクリアします。書式のみの書き換えでは保留スロットはクリアされません。

### 手動実行

`openclaw cron run` は手動実行がキューに入るとすぐに戻ります。成功レスポンスには `{ ok: true, enqueued: true, runId }` が含まれます。最終的な結果を追跡するには `openclaw cron runs --id <job-id>` を使用してください。

<Note>
`openclaw cron run <job-id>` は既定で強制実行します。古い「期限到来時のみ実行」の動作を維持するには `--due` を使用してください。
</Note>

## モデル

`cron add|edit --model <ref>` は、ジョブで許可されたモデルを選択します。

<Warning>
モデルが許可されていないか解決できない場合、cron はジョブのエージェントまたは既定のモデル選択にフォールバックせず、明示的な検証エラーで実行を失敗させます。
</Warning>

Cron の `--model` はチャットセッションの `/model` オーバーライドではなく、**ジョブのプライマリ**です。つまり、次のようになります。

- 選択されたジョブモデルが失敗した場合でも、設定済みのモデルフォールバックは引き続き適用されます。
- ジョブごとのペイロード `fallbacks` が存在する場合、設定済みのフォールバックリストを置き換えます。
- ジョブごとの空のフォールバックリスト（ジョブペイロード/API の `fallbacks: []`）は、cron 実行を厳格にします。
- ジョブに `--model` があり、フォールバックリストが設定されていない場合、OpenClaw は明示的な空のフォールバックオーバーライドを渡すため、エージェントのプライマリが隠れたリトライターゲットとして追加されません。

### 分離 cron のモデル優先順位

分離 cron は、次の順序でアクティブモデルを解決します。

1. Gmail フックのオーバーライド。
2. ジョブごとの `--model`。
3. 保存済み cron セッションのモデルオーバーライド（ユーザーが選択した場合）。
4. エージェントまたは既定のモデル選択。

### 高速モード

分離 cron の高速モードは、解決されたライブモデル選択に従います。モデル設定の `params.fastMode` は既定で適用されますが、保存済みセッションの `fastMode` オーバーライドがある場合は設定より優先されます。

### ライブモデル切り替えのリトライ

分離実行が `LiveSessionModelSwitchError` をスローした場合、cron はリトライ前に、切り替えられたプロバイダーとモデル（存在する場合は切り替えられた認証プロファイルのオーバーライドも）をアクティブな実行に永続化します。外側のリトライループは、初回試行後に 2 回の切り替えリトライまでに制限され、その後は無限ループせずに中止します。

## 実行出力と拒否

### 古い確認応答の抑制

分離 cron ターンでは、古くなった確認応答のみの返信を抑制します。最初の結果が単なる暫定ステータス更新であり、最終的な回答を担う子孫サブエージェント実行がない場合、cron は配信前に実際の結果を 1 回再プロンプトします。

### サイレントトークンの抑制

分離 cron 実行がサイレントトークン（`NO_REPLY` または `no_reply`）だけを返した場合、cron は直接のアウトバウンド配信とフォールバックのキュー済み要約パスの両方を抑制するため、チャットには何も投稿されません。

### 構造化された拒否

分離 cron 実行では、埋め込み実行からの構造化された実行拒否メタデータを優先し、その後 `SYSTEM_RUN_DENIED`、`INVALID_REQUEST`、承認バインディング拒否フレーズなど、最終出力内の既知の拒否マーカーにフォールバックします。

`cron list` と実行履歴は、ブロックされたコマンドを `ok` として報告するのではなく、拒否理由を表示します。

## 保持

保持とプルーニングは設定で制御されます。

- `cron.sessionRetention`（既定 `24h`）は、完了した分離実行セッションをプルーニングします。
- `cron.runLog.maxBytes` と `cron.runLog.keepLines` は `~/.openclaw/cron/runs/<jobId>.jsonl` をプルーニングします。

## 古いジョブの移行

<Note>
現在の配信形式およびストア形式より前の cron ジョブがある場合は、`openclaw doctor --fix` を実行してください。Doctor は従来の cron フィールド（`jobId`、`schedule.cron`、従来の `threadId` を含むトップレベル配信フィールド、ペイロードの `provider` 配信エイリアス）を正規化し、`cron.webhook` が設定されている場合、単純な `notify: true` webhook フォールバックジョブを明示的な webhook 配信に移行します。
</Note>

## よく使う編集

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

特定のチャネルに通知します。

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Telegram フォーラムトピックに通知します。

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

軽量ブートストラップコンテキスト付きの分離ジョブを作成します。

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` は分離エージェントターンジョブにのみ適用されます。cron 実行では、軽量モードは完全なワークスペースブートストラップセットを注入せず、ブートストラップコンテキストを空のままにします。

## よく使う管理コマンド

手動実行と調査:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`openclaw cron list` は既定で一致するすべてのジョブを表示します。実効的に正規化されたエージェント ID が一致するジョブだけを表示するには `--agent <id>` を渡してください。保存済みのエージェント ID がないジョブは、設定済みの既定エージェントとして扱われます。

`cron list --json` と `cron show <job-id> --json` は、各ジョブにトップレベルの `status` フィールドを含めます。これは `enabled`、`state.runningAtMs`、`state.lastRunStatus` から計算されます。値は `disabled`、`running`、`ok`、`error`、`skipped`、または `idle` です。これは人間が読めるステータス列と対応しているため、外部ツールはジョブ状態を再導出せずに読み取れます。

`cron runs` エントリには、意図された cron ターゲット、解決済みターゲット、message ツール送信、フォールバック使用、配信済み状態を含む配信診断が含まれます。

エージェントとセッションの再ターゲット:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` は、エージェントターンジョブで `--agent` が省略されている場合に警告し、既定エージェント（`main`）にフォールバックします。特定のエージェントに固定するには、作成時に `--agent <id>` を渡してください。

配信の調整:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [スケジュール済みタスク](/ja-JP/automation/cron-jobs)

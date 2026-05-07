---
read_when:
    - スケジュールされたジョブとウェイクアップが必要な場合
    - Cron の実行とログをデバッグしています
summary: '`openclaw cron` の CLI リファレンス（バックグラウンドジョブをスケジュールして実行する）'
title: Cron
x-i18n:
    generated_at: "2026-05-07T13:13:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: de49599c3ebaba88b65dbb6b2b545c0f094575935d9fd0ce0b7bd34470f8e345
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gateway スケジューラの Cron ジョブを管理します。

<Tip>
完全なコマンドサーフェスについては `openclaw cron --help` を実行してください。概念ガイドについては [Cron ジョブ](/ja-JP/automation/cron-jobs) を参照してください。
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
    分離実行では周辺の会話コンテキストがリセットされます。新しい実行では、チャンネルとグループのルーティング、送信/キューポリシー、昇格、オリジン、ACP ランタイムバインディングがリセットされます。安全な設定と、ユーザーが明示的に選択したモデルまたは認証の上書きは、実行間で引き継がれる場合があります。
  </Accordion>
</AccordionGroup>

## 配信

`openclaw cron list` と `openclaw cron show <job-id>` は、解決済みの配信ルートをプレビューします。`channel: "last"` の場合、プレビューにはルートがメインセッションまたは現在のセッションから解決されたか、あるいは失敗して閉じるかが表示されます。

プロバイダー接頭辞付きのターゲットは、未解決の通知チャンネルを曖昧さなく指定できます。たとえば、`delivery.channel` が省略されているか `last` の場合、`to: "telegram:123"` は Telegram を選択します。読み込まれた plugin が公開している接頭辞のみがプロバイダーセレクターです。`delivery.channel` が明示されている場合、接頭辞はそのチャンネルと一致する必要があります。`channel: "whatsapp"` と `to: "telegram:123"` の組み合わせは拒否されます。`imessage:` や `sms:` などのサービス接頭辞は、引き続きチャンネル所有のターゲット構文です。

<Note>
分離された `cron add` ジョブはデフォルトで `--announce` 配信になります。出力を内部に留めるには `--no-deliver` を使用してください。`--deliver` は `--announce` の非推奨エイリアスとして残っています。
</Note>

### 配信の所有権

分離 Cron チャット配信は、エージェントとランナーの間で共有されます。

- チャットルートが利用可能な場合、エージェントは `message` ツールを使用して直接送信できます。
- `announce` は、エージェントが解決済みターゲットへ直接送信しなかった場合にのみ、最終返信をフォールバック配信します。
- `webhook` は完了したペイロードを URL に投稿します。
- `none` はランナーのフォールバック配信を無効にします。

`--announce` は最終返信に対するランナーのフォールバック配信です。`--no-deliver` はそのフォールバックを無効にしますが、チャットルートが利用可能な場合にエージェントの `message` ツールを削除するわけではありません。

アクティブなチャットから作成されたリマインダーは、フォールバック通知配信用のライブチャット配信ターゲットを保持します。内部セッションキーは小文字の場合があります。Matrix ルーム ID など、大文字小文字を区別するプロバイダー ID の信頼できる情報源として使用しないでください。

### 失敗時の配信

失敗通知は次の順序で解決されます。

1. ジョブの `delivery.failureDestination`。
2. グローバルな `cron.failureDestination`。
3. ジョブのプライマリ通知ターゲット（明示的な失敗宛先が設定されていない場合）。

<Note>
メインセッションジョブでは、プライマリ配信モードが `webhook` の場合にのみ `delivery.failureDestination` を使用できます。分離ジョブではすべてのモードで使用できます。
</Note>

注: 分離 Cron 実行では、返信ペイロードが生成されない場合でも、実行レベルのエージェント失敗をジョブエラーとして扱います。そのため、モデル/プロバイダーの失敗でもエラーカウンターが増加し、失敗通知がトリガーされます。

## スケジューリング

### 単発ジョブ

`--at <datetime>` は単発実行をスケジュールします。オフセットなしの日時は、`--tz <iana>` も渡さない限り UTC として扱われます。`--tz <iana>` を渡した場合は、指定したタイムゾーンの壁時計時刻として解釈されます。

<Note>
単発ジョブはデフォルトで成功後に削除されます。保持するには `--keep-after-run` を使用してください。
</Note>

### 繰り返しジョブ

繰り返しジョブでは、連続エラーの後に指数的リトライバックオフを使用します: 30s、1m、5m、15m、60m。次に成功した実行の後、スケジュールは通常に戻ります。

スキップされた実行は、実行エラーとは別に追跡されます。リトライバックオフには影響しませんが、`openclaw cron edit <job-id> --failure-alert-include-skipped` を使うと、失敗アラートに繰り返しのスキップ実行通知を含めるよう選択できます。

ローカルに設定されたモデルプロバイダーを対象とする分離ジョブでは、Cron はエージェントターンを開始する前に軽量のプロバイダープリフライトを実行します。Loopback、プライベートネットワーク、`.local` の `api: "ollama"` プロバイダーは `/api/tags` でプローブされます。vLLM、SGLang、LM Studio などのローカル OpenAI 互換プロバイダーは `/models` でプローブされます。エンドポイントに到達できない場合、実行は `skipped` として記録され、後のスケジュールで再試行されます。一致する停止中のエンドポイントは、同じローカルサーバーに多数のジョブが殺到するのを避けるため 5 分間キャッシュされます。

注: Cron ジョブ定義は `jobs.json` に保存され、保留中のランタイム状態は `jobs-state.json` に保存されます。`jobs.json` が外部で編集された場合、Gateway は変更されたスケジュールを再読み込みし、古い保留スロットをクリアします。フォーマットのみの書き換えでは保留スロットはクリアされません。

### 手動実行

`openclaw cron run` は、手動実行がキューに入るとすぐに戻ります。成功レスポンスには `{ ok: true, enqueued: true, runId }` が含まれます。最終的な結果を追跡するには `openclaw cron runs --id <job-id>` を使用してください。

<Note>
`openclaw cron run <job-id>` はデフォルトで強制実行します。従来の「期限が来ている場合のみ実行」動作を維持するには `--due` を使用してください。
</Note>

## モデル

`cron add|edit --model <ref>` は、ジョブで許可されたモデルを選択します。

<Warning>
モデルが許可されていない、または解決できない場合、Cron はジョブのエージェントやデフォルトモデル選択にフォールバックせず、明示的な検証エラーで実行を失敗させます。
</Warning>

Cron の `--model` は**ジョブのプライマリ**であり、チャットセッションの `/model` 上書きではありません。つまり、次のようになります。

- 選択したジョブモデルが失敗した場合でも、設定済みのモデルフォールバックが適用されます。
- ジョブごとのペイロード `fallbacks` が存在する場合、設定済みのフォールバックリストを置き換えます。
- ジョブごとの空のフォールバックリスト（ジョブペイロード/API の `fallbacks: []`）は、Cron 実行を厳密にします。
- ジョブに `--model` があり、フォールバックリストが設定されていない場合、OpenClaw は明示的な空のフォールバック上書きを渡すため、エージェントのプライマリが隠れたリトライターゲットとして追加されません。

### 分離 Cron のモデル優先順位

分離 Cron は、次の順序でアクティブモデルを解決します。

1. Gmail フックの上書き。
2. ジョブごとの `--model`。
3. 保存された Cron セッションモデル上書き（ユーザーが選択した場合）。
4. エージェントまたはデフォルトモデル選択。

### 高速モード

分離 Cron の高速モードは、解決されたライブモデル選択に従います。モデル設定 `params.fastMode` はデフォルトで適用されますが、保存されたセッションの `fastMode` 上書きが設定より優先されます。

### ライブモデル切り替えのリトライ

分離実行が `LiveSessionModelSwitchError` をスローした場合、Cron はリトライ前に、切り替え後のプロバイダーとモデル（および存在する場合は切り替え後の認証プロファイル上書き）をアクティブな実行に永続化します。外側のリトライループは初回試行後に最大 2 回の切り替えリトライに制限され、その後は無限ループせずに中止します。

## 実行出力と拒否

### 古い確認応答の抑制

分離 Cron ターンは、古い確認応答のみの返信を抑制します。最初の結果が単なる中間ステータス更新であり、最終的な回答に責任を持つ子孫サブエージェント実行がない場合、Cron は配信前に実際の結果を一度だけ再プロンプトします。

### サイレントトークンの抑制

分離 Cron 実行がサイレントトークン（`NO_REPLY` または `no_reply`）のみを返した場合、Cron は直接のアウトバウンド配信とフォールバックのキュー済み要約パスの両方を抑制するため、チャットには何も投稿されません。

### 構造化された拒否

分離 Cron 実行は、埋め込み実行からの構造化された実行拒否メタデータを優先し、その後、最終出力内の既知の拒否マーカーにフォールバックします。たとえば `SYSTEM_RUN_DENIED`、`INVALID_REQUEST`、承認バインディング拒否フレーズなどです。

`cron list` と実行履歴は、ブロックされたコマンドを `ok` として報告するのではなく、拒否理由を表示します。

## 保持

保持とプルーニングは設定で制御されます。

- `cron.sessionRetention`（デフォルト `24h`）は、完了した分離実行セッションをプルーニングします。
- `cron.runLog.maxBytes` と `cron.runLog.keepLines` は `~/.openclaw/cron/runs/<jobId>.jsonl` をプルーニングします。

## 古いジョブの移行

<Note>
現在の配信形式とストア形式より前の Cron ジョブがある場合は、`openclaw doctor --fix` を実行してください。Doctor はレガシー Cron フィールド（`jobId`、`schedule.cron`、レガシー `threadId` を含むトップレベル配信フィールド、ペイロードの `provider` 配信エイリアス）を正規化し、`cron.webhook` が設定されている場合、単純な `notify: true` Webhook フォールバックジョブを明示的な Webhook 配信へ移行します。
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

特定のチャンネルへ通知します。

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Telegram フォーラムトピックへ通知します。

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

軽量ブートストラップコンテキストを持つ分離ジョブを作成します。

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` は、分離エージェントターンジョブにのみ適用されます。Cron 実行では、軽量モードにより、完全なワークスペースブートストラップセットを注入する代わりにブートストラップコンテキストが空のままになります。

## よく使う管理コマンド

手動実行と検査:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`openclaw cron list` はデフォルトで一致するすべてのジョブを表示します。実効的に正規化されたエージェント ID が一致するジョブのみを表示するには `--agent <id>` を渡してください。保存されたエージェント ID がないジョブは、設定済みのデフォルトエージェントとして扱われます。

`cron list --json` と `cron show <job-id> --json` は、各ジョブにトップレベルの `status` フィールドを含めます。これは `enabled`、`state.runningAtMs`、`state.lastRunStatus` から計算されます。値は `disabled`、`running`、`ok`、`error`、`skipped`、または `idle` です。これは人間が読めるステータス列と対応しているため、外部ツールはジョブ状態を再導出せずに読み取れます。

`cron runs` エントリには、意図された Cron ターゲット、解決済みターゲット、message ツール送信、フォールバック使用、配信済み状態を含む配信診断が含まれます。

エージェントとセッションの再ターゲット:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` は、エージェントターンジョブで `--agent` が省略されると警告し、デフォルトエージェント（`main`）にフォールバックします。特定のエージェントに固定するには、作成時に `--agent <id>` を渡してください。

配信の調整:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [スケジュールされたタスク](/ja-JP/automation/cron-jobs)

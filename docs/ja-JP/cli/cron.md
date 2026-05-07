---
read_when:
    - スケジュールされたジョブとウェイクアップを使いたい場合
    - Cron の実行とログをデバッグしている
summary: '`openclaw cron` の CLI リファレンス（バックグラウンドジョブをスケジュールして実行）'
title: Cron
x-i18n:
    generated_at: "2026-05-07T01:50:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b6c894cc4f2a7d86b67b2b5bd7c6338dc442af09befed83117567b3a254fe9
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gateway スケジューラーの Cron ジョブを管理します。

<Tip>
`openclaw cron --help` を実行すると、コマンド全体を確認できます。概念ガイドは [Cron ジョブ](/ja-JP/automation/cron-jobs) を参照してください。
</Tip>

## セッション

`--session` は `main`、`isolated`、`current`、または `session:<id>` を受け付けます。

<AccordionGroup>
  <Accordion title="セッションキー">
    - `main` はエージェントのメインセッションにバインドします。
    - `isolated` は実行ごとに新しいトランスクリプトとセッション ID を作成します。
    - `current` は作成時点のアクティブなセッションにバインドします。
    - `session:<id>` は明示的な永続セッションキーに固定します。

  </Accordion>
  <Accordion title="分離セッションのセマンティクス">
    分離実行では、周囲の会話コンテキストがリセットされます。チャネルとグループのルーティング、送信/キューポリシー、昇格、起点、ACP ランタイムバインディングは新しい実行用にリセットされます。安全な設定と、ユーザーが明示的に選択したモデルまたは認証のオーバーライドは、実行間で引き継ぐことができます。
  </Accordion>
</AccordionGroup>

## 配信

`openclaw cron list` と `openclaw cron show <job-id>` は、解決済みの配信ルートをプレビューします。`channel: "last"` の場合、プレビューにはルートがメインセッションまたは現在のセッションから解決されたか、またはフェイルクローズするかが表示されます。

プロバイダー接頭辞付きのターゲットを使うと、未解決の通知チャネルを曖昧さなく指定できます。たとえば、`delivery.channel` が省略されているか `last` の場合、`to: "telegram:123"` は Telegram を選択します。読み込まれた plugin が公開している接頭辞だけがプロバイダーセレクターです。`delivery.channel` が明示されている場合、接頭辞はそのチャネルと一致している必要があります。`channel: "whatsapp"` と `to: "telegram:123"` の組み合わせは拒否されます。`imessage:` や `sms:` などのサービス接頭辞は、チャネル所有のターゲット構文のままです。

<Note>
分離 `cron add` ジョブは、デフォルトで `--announce` 配信を使います。出力を内部に留めるには `--no-deliver` を使います。`--deliver` は `--announce` の非推奨エイリアスとして残っています。
</Note>

### 配信の所有権

分離 Cron チャット配信は、エージェントとランナーで共有されます。

- チャットルートが利用可能な場合、エージェントは `message` ツールを使って直接送信できます。
- `announce` は、エージェントが解決済みターゲットへ直接送信しなかった場合にのみ、最終返信をフォールバック配信します。
- `webhook` は完了したペイロードを URL に投稿します。
- `none` はランナーのフォールバック配信を無効にします。

`--announce` は最終返信に対するランナーのフォールバック配信です。`--no-deliver` はそのフォールバックを無効にしますが、チャットルートが利用可能な場合にエージェントの `message` ツールを削除するわけではありません。

アクティブなチャットから作成されたリマインダーは、フォールバック通知配信用にライブチャット配信ターゲットを保持します。内部セッションキーは小文字の場合があります。Matrix ルーム ID など、大文字小文字を区別するプロバイダー ID の信頼できる情報源として使わないでください。

### 失敗時の配信

失敗通知は次の順序で解決されます。

1. ジョブの `delivery.failureDestination`。
2. グローバルの `cron.failureDestination`。
3. ジョブの主要通知ターゲット（明示的な失敗時の宛先が設定されていない場合）。

<Note>
メインセッションのジョブで `delivery.failureDestination` を使えるのは、主要配信モードが `webhook` の場合だけです。分離ジョブはすべてのモードで受け付けます。
</Note>

注: 分離 Cron 実行では、返信ペイロードが生成されない場合でも、実行レベルのエージェント失敗をジョブエラーとして扱います。そのため、モデル/プロバイダーの失敗でもエラーカウンターが増加し、失敗通知がトリガーされます。

## スケジューリング

### 1 回限りのジョブ

`--at <datetime>` は 1 回限りの実行をスケジュールします。オフセットのない日時は、`--tz <iana>` も渡している場合を除き UTC として扱われます。`--tz <iana>` を渡すと、指定したタイムゾーンの壁時計時刻として解釈されます。

<Note>
1 回限りのジョブは、デフォルトでは成功後に削除されます。保持するには `--keep-after-run` を使います。
</Note>

### 繰り返しジョブ

繰り返しジョブは、連続エラー後に指数的なリトライバックオフを使います: 30 秒、1 分、5 分、15 分、60 分。次回の実行が成功すると、スケジュールは通常に戻ります。

スキップされた実行は、実行エラーとは別に追跡されます。リトライバックオフには影響しませんが、`openclaw cron edit <job-id> --failure-alert-include-skipped` を使うと、失敗アラートに繰り返しのスキップ実行通知を含めるようにできます。

ローカルに設定されたモデルプロバイダーを対象にする分離ジョブでは、Cron はエージェントターンを開始する前に軽量なプロバイダープリフライトを実行します。Loopback、プライベートネットワーク、`.local` の `api: "ollama"` プロバイダーは `/api/tags` でプローブされます。vLLM、SGLang、LM Studio などのローカル OpenAI 互換プロバイダーは `/models` でプローブされます。エンドポイントに到達できない場合、実行は `skipped` として記録され、後のスケジュールで再試行されます。一致する停止中のエンドポイントは、同じローカルサーバーを多数のジョブが叩くことを避けるため 5 分間キャッシュされます。

注: Cron ジョブ定義は `jobs.json` に保存され、保留中のランタイム状態は `jobs-state.json` に保存されます。`jobs.json` が外部で編集された場合、Gateway は変更されたスケジュールを再読み込みし、古い保留スロットをクリアします。フォーマットのみの書き換えでは保留スロットはクリアされません。

### 手動実行

`openclaw cron run` は、手動実行がキューに入るとすぐに戻ります。成功応答には `{ ok: true, enqueued: true, runId }` が含まれます。最終的な結果を追跡するには `openclaw cron runs --id <job-id>` を使います。

<Note>
`openclaw cron run <job-id>` はデフォルトで強制実行します。以前の「期限が来ている場合だけ実行する」動作を維持するには `--due` を使います。
</Note>

## モデル

`cron add|edit --model <ref>` は、ジョブに許可されたモデルを選択します。

<Warning>
モデルが許可されていないか解決できない場合、Cron はジョブのエージェントまたはデフォルトのモデル選択へフォールバックするのではなく、明示的な検証エラーで実行を失敗させます。
</Warning>

Cron の `--model` は **ジョブのプライマリ** であり、チャットセッションの `/model` オーバーライドではありません。つまり、次のようになります。

- 選択されたジョブモデルが失敗した場合でも、設定済みのモデルフォールバックは引き続き適用されます。
- ジョブごとのペイロード `fallbacks` が存在する場合、設定済みのフォールバックリストを置き換えます。
- ジョブごとの空のフォールバックリスト（ジョブペイロード/API の `fallbacks: []`）は、Cron 実行を厳格にします。
- ジョブに `--model` があり、フォールバックリストが設定されていない場合、OpenClaw は明示的な空のフォールバックオーバーライドを渡し、エージェントのプライマリが隠れたリトライターゲットとして追加されないようにします。

### 分離 Cron のモデル優先順位

分離 Cron は、次の順序でアクティブなモデルを解決します。

1. Gmail フックのオーバーライド。
2. ジョブごとの `--model`。
3. 保存済み Cron セッションモデルオーバーライド（ユーザーが選択した場合）。
4. エージェントまたはデフォルトのモデル選択。

### 高速モード

分離 Cron の高速モードは、解決済みのライブモデル選択に従います。モデル設定 `params.fastMode` はデフォルトで適用されますが、保存済みセッションの `fastMode` オーバーライドは設定より優先されます。

### ライブモデル切り替えリトライ

分離実行が `LiveSessionModelSwitchError` をスローした場合、Cron は再試行前に、切り替え後のプロバイダーとモデル（切り替え後の認証プロファイルオーバーライドが存在する場合はそれも）をアクティブな実行用に永続化します。外側のリトライループは初回試行後に最大 2 回の切り替えリトライに制限され、その後は無限ループせずに中止します。

## 実行出力と拒否

### 古い確認応答の抑制

分離 Cron ターンは、古い確認応答のみの返信を抑制します。最初の結果が中間ステータス更新だけで、最終的な回答を担当する子孫サブエージェント実行がない場合、Cron は配信前に本当の結果を一度だけ再プロンプトします。

### サイレントトークンの抑制

分離 Cron 実行がサイレントトークン（`NO_REPLY` または `no_reply`）だけを返した場合、Cron は直接の外向き配信とフォールバックのキュー済みサマリーパスの両方を抑制するため、チャットには何も投稿されません。

### 構造化された拒否

分離 Cron 実行は、埋め込み実行からの構造化された実行拒否メタデータを優先し、その後、最終出力内の既知の拒否マーカーにフォールバックします。たとえば、`SYSTEM_RUN_DENIED`、`INVALID_REQUEST`、承認バインディング拒否フレーズなどです。

`cron list` と実行履歴は、ブロックされたコマンドを `ok` として報告するのではなく、拒否理由を表示します。

## 保持

保持とプルーニングは設定で制御されます。

- `cron.sessionRetention`（デフォルト `24h`）は、完了した分離実行セッションをプルーニングします。
- `cron.runLog.maxBytes` と `cron.runLog.keepLines` は `~/.openclaw/cron/runs/<jobId>.jsonl` をプルーニングします。

## 古いジョブの移行

<Note>
現在の配信形式と保存形式より前の Cron ジョブがある場合は、`openclaw doctor --fix` を実行してください。Doctor はレガシー Cron フィールド（`jobId`、`schedule.cron`、レガシー `threadId` を含むトップレベル配信フィールド、ペイロードの `provider` 配信エイリアス）を正規化し、`cron.webhook` が設定されている場合は単純な `notify: true` Webhook フォールバックジョブを明示的な Webhook 配信へ移行します。

Doctor は、`"default"`、`"null"`、空文字列、JSON の `null` など、永続化された Cron の `payload.model` センチネルも削除します。Cron ランタイムは引き続き、空でない任意の `payload.model` 文字列を明示的なモデルオーバーライドとして扱い、`agents.defaults.models` に対して検証します。ジョブでエージェント/デフォルトのモデル選択を使うべき場合は、model キーを省略してください。
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

分離ジョブで軽量なブートストラップコンテキストを有効にします。

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

軽量なブートストラップコンテキストを持つ分離ジョブを作成します。

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` は分離エージェントターンジョブにのみ適用されます。Cron 実行では、軽量モードはワークスペースの完全なブートストラップセットを注入する代わりに、ブートストラップコンテキストを空に保ちます。

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

`openclaw cron list` は、デフォルトですべての一致するジョブを表示します。`--agent <id>` を渡すと、有効に正規化されたエージェント ID が一致するジョブだけを表示します。保存済みエージェント ID がないジョブは、設定済みのデフォルトエージェントとして扱われます。

`cron runs` のエントリには、意図された Cron ターゲット、解決済みターゲット、message ツール送信、フォールバック使用、配信済み状態を含む配信診断が含まれます。

エージェントとセッションの再ターゲット:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` は、エージェントターンジョブで `--agent` が省略されると警告し、デフォルトエージェント（`main`）にフォールバックします。特定のエージェントに固定するには、作成時に `--agent <id>` を渡します。

配信の微調整:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [スケジュール済みタスク](/ja-JP/automation/cron-jobs)

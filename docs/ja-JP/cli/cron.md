---
read_when:
    - スケジュールされたジョブとウェイクアップが必要な場合
    - Cron の実行とログをデバッグしています
summary: '`openclaw cron` の CLI リファレンス（バックグラウンドジョブをスケジュールして実行）'
title: Cron
x-i18n:
    generated_at: "2026-04-30T09:34:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03d79e0e2c71f673c900b84eb2beeab705662c1d016e1d0567323c8da73060bb
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gateway スケジューラの Cron ジョブを管理します。

<Tip>
完全なコマンド範囲を確認するには `openclaw cron --help` を実行してください。概念ガイドは [Cron ジョブ](/ja-JP/automation/cron-jobs) を参照してください。
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
    分離実行では、周囲の会話コンテキストがリセットされます。チャネルとグループのルーティング、送信/キューのポリシー、権限昇格、オリジン、ACP ランタイムバインディングは新しい実行用にリセットされます。安全な設定と、ユーザーが明示的に選択したモデルまたは認証の上書きは、実行間で引き継がれることがあります。
  </Accordion>
</AccordionGroup>

## 配信

`openclaw cron list` と `openclaw cron show <job-id>` は、解決済みの配信ルートをプレビューします。`channel: "last"` の場合、プレビューにはルートがメインセッションまたは現在のセッションから解決されたか、または fail closed になるかが表示されます。

<Note>
分離された `cron add` ジョブは、デフォルトで `--announce` 配信になります。出力を内部に留めるには `--no-deliver` を使用してください。`--deliver` は `--announce` の非推奨エイリアスとして残ります。
</Note>

### 配信の所有権

分離 Cron チャット配信は、エージェントとランナーの間で共有されます。

- チャットルートが利用可能な場合、エージェントは `message` ツールを使用して直接送信できます。
- `announce` は、エージェントが解決済みのターゲットへ直接送信しなかった場合にのみ、最終返信をフォールバック配信します。
- `webhook` は完了したペイロードを URL に投稿します。
- `none` はランナーのフォールバック配信を無効にします。

`--announce` は最終返信用のランナーフォールバック配信です。`--no-deliver` はそのフォールバックを無効にしますが、チャットルートが利用可能な場合にエージェントの `message` ツールを削除するものではありません。

アクティブなチャットから作成されたリマインダーは、フォールバックの announce 配信用にライブチャット配信ターゲットを保持します。内部セッションキーは小文字になる場合があります。Matrix ルーム ID など、大文字と小文字を区別するプロバイダー ID の信頼できる情報源として使用しないでください。

### 失敗配信

失敗通知は次の順序で解決されます。

1. ジョブの `delivery.failureDestination`。
2. グローバルの `cron.failureDestination`。
3. ジョブのプライマリ announce ターゲット（明示的な失敗先が設定されていない場合）。

<Note>
メインセッションジョブで `delivery.failureDestination` を使用できるのは、プライマリ配信モードが `webhook` の場合のみです。分離ジョブではすべてのモードで受け付けます。
</Note>

注: 分離 Cron 実行では、返信ペイロードが生成されない場合でも、実行レベルのエージェント失敗をジョブエラーとして扱うため、モデル/プロバイダーの失敗もエラーカウンターを増やし、失敗通知をトリガーします。

## スケジューリング

### 単発ジョブ

`--at <datetime>` は単発実行をスケジュールします。オフセットのない日時は、`--tz <iana>` も渡していない限り UTC として扱われます。`--tz <iana>` を渡すと、指定されたタイムゾーンの wall-clock 時刻として解釈されます。

<Note>
単発ジョブはデフォルトで成功後に削除されます。保持するには `--keep-after-run` を使用してください。
</Note>

### 繰り返しジョブ

繰り返しジョブは、連続エラーの後に指数関数的なリトライバックオフを使用します: 30s、1m、5m、15m、60m。次回の実行が成功すると、スケジュールは通常に戻ります。

スキップされた実行は、実行エラーとは別に追跡されます。リトライバックオフには影響しませんが、`openclaw cron edit <job-id> --failure-alert-include-skipped` を使うと、失敗アラートに繰り返しのスキップ実行通知を含めるようにできます。

ローカルに構成されたモデルプロバイダーを対象とする分離ジョブでは、Cron はエージェントターンを開始する前に軽量なプロバイダープリフライトを実行します。Loopback、プライベートネットワーク、`.local` の `api: "ollama"` プロバイダーは `/api/tags` でプローブされます。vLLM、SGLang、LM Studio などのローカル OpenAI 互換プロバイダーは `/models` でプローブされます。エンドポイントに到達できない場合、その実行は `skipped` として記録され、後続のスケジュールで再試行されます。一致する停止中のエンドポイントは、同じローカルサーバーに多数のジョブが集中してアクセスするのを避けるため、5 分間キャッシュされます。

注: Cron ジョブ定義は `jobs.json` に保存され、保留中のランタイム状態は `jobs-state.json` に保存されます。`jobs.json` が外部で編集された場合、Gateway は変更されたスケジュールを再読み込みし、古い保留スロットをクリアします。フォーマットのみの書き換えでは保留スロットはクリアされません。

### 手動実行

`openclaw cron run` は、手動実行がキューに入るとすぐに戻ります。成功レスポンスには `{ ok: true, enqueued: true, runId }` が含まれます。最終的な結果を追跡するには `openclaw cron runs --id <job-id>` を使用してください。

<Note>
`openclaw cron run <job-id>` はデフォルトで強制実行します。以前の「期限が来ている場合のみ実行する」動作を維持するには `--due` を使用してください。
</Note>

## モデル

`cron add|edit --model <ref>` は、ジョブで許可されたモデルを選択します。

<Warning>
モデルが許可されていない、または解決できない場合、Cron はジョブのエージェントまたはデフォルトのモデル選択へフォールバックせず、明示的な検証エラーで実行を失敗させます。
</Warning>

Cron の `--model` は、チャットセッションの `/model` 上書きではなく、**ジョブのプライマリ**です。つまり、次のようになります。

- 選択されたジョブモデルが失敗した場合も、構成済みのモデルフォールバックは適用されます。
- ジョブごとのペイロード `fallbacks` が存在する場合、構成済みのフォールバックリストを置き換えます。
- ジョブごとの空のフォールバックリスト（ジョブペイロード/API 内の `fallbacks: []`）は、Cron 実行を厳密にします。
- ジョブに `--model` があり、フォールバックリストが構成されていない場合、OpenClaw は明示的な空のフォールバック上書きを渡し、エージェントのプライマリが隠れた再試行ターゲットとして追加されないようにします。

### 分離 Cron のモデル優先順位

分離 Cron は、次の順序でアクティブなモデルを解決します。

1. Gmail-hook の上書き。
2. ジョブごとの `--model`。
3. 保存された Cron セッションのモデル上書き（ユーザーが選択した場合）。
4. エージェントまたはデフォルトのモデル選択。

### 高速モード

分離 Cron の高速モードは、解決済みのライブモデル選択に従います。モデル構成の `params.fastMode` はデフォルトで適用されますが、保存されたセッションの `fastMode` 上書きは構成より優先されます。

### ライブモデル切り替えのリトライ

分離実行が `LiveSessionModelSwitchError` をスローした場合、Cron は再試行前に、切り替え後のプロバイダーとモデル（存在する場合は切り替え後の認証プロファイル上書きも）をアクティブな実行用に永続化します。外側のリトライループは、最初の試行後に 2 回の切り替えリトライまでに制限され、その後は無限ループせずに中止します。

## 実行出力と拒否

### 古い確認応答の抑制

分離 Cron ターンでは、古い確認応答のみの返信を抑制します。最初の結果が単なる暫定ステータス更新で、最終的な回答に責任を持つ子孫サブエージェント実行がない場合、Cron は配信前に実際の結果を一度だけ再プロンプトします。

### サイレントトークンの抑制

分離 Cron 実行がサイレントトークン（`NO_REPLY` または `no_reply`）のみを返した場合、Cron は直接のアウトバウンド配信とフォールバックのキュー済み要約パスの両方を抑制するため、チャットには何も投稿されません。

### 構造化された拒否

分離 Cron 実行は、埋め込み実行からの構造化された実行拒否メタデータを優先し、その後 `SYSTEM_RUN_DENIED`、`INVALID_REQUEST`、承認バインディング拒否フレーズなど、最終出力内の既知の拒否マーカーにフォールバックします。

`cron list` と実行履歴は、ブロックされたコマンドを `ok` として報告する代わりに、拒否理由を表示します。

## 保持

保持とプルーニングは構成で制御されます。

- `cron.sessionRetention`（デフォルト `24h`）は、完了した分離実行セッションをプルーニングします。
- `cron.runLog.maxBytes` と `cron.runLog.keepLines` は `~/.openclaw/cron/runs/<jobId>.jsonl` をプルーニングします。

## 古いジョブの移行

<Note>
現在の配信形式とストア形式より前の Cron ジョブがある場合は、`openclaw doctor --fix` を実行してください。Doctor はレガシー Cron フィールド（`jobId`、`schedule.cron`、レガシー `threadId` を含むトップレベル配信フィールド、ペイロードの `provider` 配信エイリアス）を正規化し、`cron.webhook` が構成されている場合は単純な `notify: true` の Webhook フォールバックジョブを明示的な Webhook 配信へ移行します。
</Note>

## 一般的な編集

メッセージを変更せずに配信設定を更新します。

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

分離ジョブの配信を無効にします。

```bash
openclaw cron edit <job-id> --no-deliver
```

分離ジョブの軽量なブートストラップコンテキストを有効にします。

```bash
openclaw cron edit <job-id> --light-context
```

特定のチャネルへ announce します。

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Telegram フォーラムトピックへ announce します。

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

`--light-context` は分離されたエージェントターンジョブにのみ適用されます。Cron 実行では、軽量モードにより、完全なワークスペースブートストラップセットを注入する代わりにブートストラップコンテキストを空のままにします。

## 一般的な管理コマンド

手動実行と検査:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs` のエントリには、意図された Cron ターゲット、解決済みターゲット、message-tool 送信、フォールバックの使用、配信状態を含む配信診断が含まれます。

エージェントとセッションの再ターゲット:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` は、エージェントターンジョブで `--agent` が省略された場合に警告し、デフォルトエージェント（`main`）へフォールバックします。特定のエージェントに固定するには、作成時に `--agent <id>` を渡してください。

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

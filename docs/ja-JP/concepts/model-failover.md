---
read_when:
    - auth profile のローテーション、クールダウン、または model フォールバックの挙動を診断する
    - auth profile または model のフェイルオーバールールを更新する
    - セッションの model オーバーライドがフォールバック再試行とどのように相互作用するかを理解する
sidebarTitle: Model failover
summary: OpenClaw が auth profile をローテーションし、models 間でフォールバックする方法
title: モデルフェイルオーバー
x-i18n:
    generated_at: "2026-04-26T11:27:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e681a456f75073bb34e7af94234efeee57c6c25e9414da19eb9527ccba5444a
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw は失敗を 2 段階で処理します。

1. 現在の provider 内での **auth profile ローテーション**
2. `agents.defaults.model.fallbacks` 内の次の model への **model フォールバック**

このドキュメントでは、ランタイムルールと、それを支えるデータについて説明します。

## ランタイムフロー

通常のテキスト実行では、OpenClaw は候補を次の順序で評価します。

<Steps>
  <Step title="セッション状態を解決">
    アクティブなセッション model と auth-profile の優先設定を解決します。
  </Step>
  <Step title="候補チェーンを構築">
    現在選択されているセッション model から model 候補チェーンを構築し、その後に `agents.defaults.model.fallbacks` を順番に続け、override から実行が開始された場合は最後に設定済み primary で終わります。
  </Step>
  <Step title="現在の provider を試行">
    auth-profile のローテーション/クールダウンルールを使って現在の provider を試行します。
  </Step>
  <Step title="フェイルオーバー対象エラーで前進">
    その provider がフェイルオーバー対象のエラーで使い果たされた場合、次の model 候補へ進みます。
  </Step>
  <Step title="フォールバック override を永続化">
    再試行が始まる前に、選択されたフォールバック override を永続化し、他のセッション読取側が、runner がこれから使用する provider/model と同じものを見られるようにします。
  </Step>
  <Step title="失敗時は限定的にロールバック">
    フォールバック候補が失敗した場合、その失敗した候補とまだ一致しているときに限り、フォールバックが所有するセッション override フィールドだけをロールバックします。
  </Step>
  <Step title="使い果たしたら FallbackSummaryError を送出">
    すべての候補が失敗した場合、試行ごとの詳細と、わかっている場合は最も早いクールダウン期限を含む `FallbackSummaryError` を送出します。
  </Step>
</Steps>

これは意図的に「セッション全体を保存して復元する」よりも狭い範囲です。reply runner は、フォールバック用に自分が所有する model 選択フィールドだけを永続化します。

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

これにより、失敗したフォールバック再試行が、試行中に発生した手動の `/model` 変更やセッションローテーション更新のような、より新しい無関係のセッション変更を上書きするのを防ぎます。

## 認証ストレージ（keys + OAuth）

OpenClaw は API key と OAuth token の両方に **auth profile** を使います。

- secrets は `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` に保存されます（旧形式: `~/.openclaw/agent/auth-profiles.json`）。
- ランタイムの auth ルーティング状態は `~/.openclaw/agents/<agentId>/agent/auth-state.json` に保存されます。
- Config の `auth.profiles` / `auth.order` は **メタデータ + ルーティング専用** です（secrets は含みません）。
- 旧形式のインポート専用 OAuth ファイル: `~/.openclaw/credentials/oauth.json`（初回使用時に `auth-profiles.json` にインポートされます）。

詳細: [OAuth](/ja-JP/concepts/oauth)

認証情報の型:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（一部 provider では `projectId`/`enterpriseUrl` も含む）

## Profile ID

OAuth ログインでは、複数アカウントを共存させるために個別の profile が作成されます。

- デフォルト: email が利用できない場合は `provider:default`
- email 付き OAuth: `provider:<email>`（例: `google-antigravity:user@gmail.com`）

profiles は `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` の `profiles` 配下に保存されます。

## ローテーション順序

ある provider が複数の profile を持つ場合、OpenClaw は次のように順序を選びます。

<Steps>
  <Step title="明示的な config">
    `auth.order[provider]`（設定されている場合）。
  </Step>
  <Step title="設定済み profile">
    provider でフィルタした `auth.profiles`。
  </Step>
  <Step title="保存済み profile">
    その provider 用の `auth-profiles.json` 内のエントリ。
  </Step>
</Steps>

明示的な順序が設定されていない場合、OpenClaw はラウンドロビン順を使用します。

- **第一キー:** profile の型（**API key より OAuth を優先**）
- **第二キー:** `usageStats.lastUsed`（各型内で最も古いものを先に）
- **クールダウン中/無効化された profile** は末尾に移動され、最も早く期限切れになる順に並びます。

### セッションのスティッキー性（キャッシュ効率向上）

OpenClaw は provider キャッシュを温かいまま保つために、**選ばれた auth profile をセッションごとに固定**します。リクエストごとにはローテーションしません。固定された profile は次の場合まで再利用されます。

- セッションがリセットされる（`/new` / `/reset`）
- Compaction が完了する（compaction count が増加する）
- profile がクールダウン中または無効化される

`/model …@<profileId>` による手動選択は、そのセッションに **ユーザー override** を設定し、新しいセッションが始まるまでは自動ローテーションされません。

<Note>
自動固定された profile（セッション router が選択したもの）は **優先設定** として扱われます。最初に試行されますが、レート制限やタイムアウト時には OpenClaw が別の profile にローテーションすることがあります。ユーザー固定 profile はその profile にロックされたままです。失敗し、model フォールバックが設定されている場合、OpenClaw は profile を切り替える代わりに次の model へ進みます。
</Note>

### OAuth が「失われたように見える」理由

同じ provider に OAuth profile と API key profile の両方がある場合、固定されていないと、ラウンドロビンによってメッセージ間でそれらが切り替わることがあります。1 つの profile を強制するには、次のいずれかを使います。

- `auth.order[provider] = ["provider:profileId"]` で固定する
- UI/チャット画面が対応している場合、profile override 付きの `/model …` によるセッション単位 override を使う

## クールダウン

profile が auth/レート制限エラー（またはレート制限に見えるタイムアウト）で失敗すると、OpenClaw はそれをクールダウン状態にし、次の profile に移ります。

<AccordionGroup>
  <Accordion title="レート制限 / タイムアウトのバケットに入るもの">
    そのレート制限バケットは単なる `429` より広く、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted`、`weekly/monthly limit reached` のような定期的な利用枠制限などの provider メッセージも含みます。

    形式エラー/無効リクエストエラー（たとえば Cloud Code Assist の tool call ID 検証失敗）もフェイルオーバー対象として扱われ、同じクールダウンを使います。`Unhandled stop reason: error`、`stop reason: error`、`reason: error` のような OpenAI 互換の stop-reason エラーは、タイムアウト/フェイルオーバーシグナルとして分類されます。

    一般的なサーバーテキストも、その発生元が既知の一時的パターンに一致する場合は、そのタイムアウトバケットに入ることがあります。たとえば、pi-ai の stream-wrapper の単独メッセージ `An unknown error occurred` は、provider stream が具体的な詳細なしに `stopReason: "aborted"` または `stopReason: "error"` で終了したときに pi-ai がこれを出すため、すべての provider に対してフェイルオーバー対象として扱われます。`internal server error`、`unknown error, 520`、`upstream error`、`backend error` のような一時的サーバーテキストを含む JSON `api_error` ペイロードも、フェイルオーバー対象のタイムアウトとして扱われます。

    bare `Provider returned error` のような OpenRouter 固有の一般的 upstream テキストは、provider コンテキストが実際に OpenRouter の場合にのみタイムアウトとして扱われます。`LLM request failed with an unknown error.` のような一般的な内部フォールバックテキストは保守的に扱われ、それ自体ではフェイルオーバーを引き起こしません。

  </Accordion>
  <Accordion title="SDK retry-after の上限">
    一部の provider SDK は、それ以外だと制御を OpenClaw に戻す前に長い `Retry-After` 待機を行うことがあります。Anthropic や OpenAI のような Stainless ベースの SDK では、OpenClaw は SDK 内部の `retry-after-ms` / `retry-after` 待機をデフォルトで 60 秒に制限し、より長い再試行可能レスポンスはすぐに表面化して、このフェイルオーバーパスを実行できるようにします。上限の調整や無効化は `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` で行います。詳細は [Retry behavior](/ja-JP/concepts/retry) を参照してください。
  </Accordion>
  <Accordion title="Model スコープのクールダウン">
    レート制限のクールダウンは model スコープにもできます。

    - OpenClaw は、失敗した model id がわかっている場合、レート制限失敗に対して `cooldownModel` を記録します。
    - 同じ provider 上の sibling model は、クールダウンが別の model にスコープされている場合でも試行できます。
    - billing/disabled の期間は、models をまたいで profile 全体をブロックします。

  </Accordion>
</AccordionGroup>

クールダウンには指数バックオフを使用します。

- 1 分
- 5 分
- 25 分
- 1 時間（上限）

状態は `auth-state.json` の `usageStats` 配下に保存されます。

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## Billing による無効化

billing/credit の失敗（たとえば「insufficient credits」や「credit balance too low」）はフェイルオーバー対象として扱われますが、通常は一時的ではありません。短いクールダウンの代わりに、OpenClaw はその profile を **disabled** としてマークし（より長いバックオフ付き）、次の profile/provider にローテーションします。

<Note>
billing に見えるレスポンスがすべて `402` とは限らず、HTTP `402` がすべてここに入るわけでもありません。provider が代わりに `401` や `403` を返した場合でも、OpenClaw は明示的な billing テキストを billing 系として扱いますが、provider 固有の matcher はその provider に限定されたままです（例: OpenRouter の `403 Key limit exceeded`）。

一方、一時的な `402` の利用枠や organization/workspace の支出上限エラーは、メッセージが再試行可能に見える場合（例: `weekly usage limit exhausted`、`daily limit reached, resets tomorrow`、`organization spending limit exceeded`）は `rate_limit` として分類されます。これらは長い billing-disable パスではなく、短いクールダウン/フェイルオーバーパスに留まります。
</Note>

状態は `auth-state.json` に保存されます。

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

デフォルト:

- billing バックオフは **5 時間** から始まり、billing failure ごとに倍増し、**24 時間** で上限になります。
- profile が **24 時間** 失敗していなければ、バックオフカウンタはリセットされます（設定可能）。
- overloaded 再試行では、model フォールバック前に **同一 provider profile のローテーションを 1 回** 許可します。
- overloaded 再試行はデフォルトで **0 ms バックオフ** を使用します。

## Model フォールバック

ある provider のすべての profile が失敗した場合、OpenClaw は `agents.defaults.model.fallbacks` 内の次の model に移ります。これは、profile ローテーションを使い果たした auth failure、レート制限、タイムアウトに適用されます（その他のエラーではフォールバックは進みません）。

overloaded とレート制限エラーは、billing クールダウンよりも積極的に処理されます。デフォルトでは、OpenClaw は同一 provider の auth-profile 再試行を 1 回許可し、その後待機せずに次に設定された model フォールバックへ切り替えます。`ModelNotReadyException` のような provider-busy シグナルはその overloaded バケットに入ります。これは `auth.cooldowns.overloadedProfileRotations`、`auth.cooldowns.overloadedBackoffMs`、`auth.cooldowns.rateLimitedProfileRotations` で調整できます。

実行が model override（hooks または CLI）で始まった場合でも、設定済みフォールバックを試した後に `agents.defaults.model.primary` で終わります。

### 候補チェーンのルール

OpenClaw は、現在要求されている `provider/model` と設定済みフォールバックから候補リストを構築します。

<AccordionGroup>
  <Accordion title="ルール">
    - 要求された model は常に最初です。
    - 明示的に設定されたフォールバックは重複排除されますが、model allowlist によるフィルタは行われません。これらは明示的な運用者の意図として扱われます。
    - 現在の実行が、同じ provider 系列内の設定済みフォールバック上にすでにいる場合、OpenClaw は設定済みチェーン全体を使い続けます。
    - 現在の実行が config とは異なる provider 上にあり、その現在の model が設定済みフォールバックチェーンの一部でない場合、OpenClaw は別 provider の無関係な設定済みフォールバックを追加しません。
    - 実行が override から開始された場合、設定済み primary が最後に追加され、前の候補が使い果たされたら通常のデフォルトに戻れるようにします。

  </Accordion>
</AccordionGroup>

### どのエラーでフォールバックが進むか

<Tabs>
  <Tab title="継続する条件">
    - auth failure
    - レート制限とクールダウン使い切り
    - overloaded/provider-busy エラー
    - タイムアウト形のフェイルオーバーエラー
    - billing による無効化
    - `LiveSessionModelSwitchError`。これはフェイルオーバーパスに正規化されるため、古い永続化済み model が外側の再試行ループを作ることはありません
    - 候補がまだ残っている場合の、その他の未認識エラー

  </Tab>
  <Tab title="継続しない条件">
    - タイムアウト/フェイルオーバー形ではない明示的な中断
    - compaction/retry ロジック内に留めるべきコンテキストオーバーフローエラー（例: `request_too_large`、`INVALID_ARGUMENT: input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`The input is too long for the model`、`ollama error: context length exceeded`）
    - 候補が残っていない時点での最終的な unknown error

  </Tab>
</Tabs>

### クールダウンスキップと probe の挙動

ある provider のすべての auth profile がすでにクールダウン中でも、OpenClaw はその provider を永続的に自動スキップするわけではありません。候補ごとに判断します。

<AccordionGroup>
  <Accordion title="候補ごとの判断">
    - 永続的な auth failure は provider 全体を即座にスキップします。
    - billing による無効化は通常スキップしますが、再起動なしで回復できるように、primary 候補はスロットル付きで probe されることがあります。
    - primary 候補は、provider ごとのスロットル付きで、クールダウン期限の近くで probe されることがあります。
    - 同一 provider のフォールバック sibling は、失敗が一時的に見える場合（`rate_limit`、`overloaded`、または unknown）には、クールダウン中でも試行されることがあります。これは特に、レート制限が model スコープで、sibling model がすぐに回復し得る場合に重要です。
    - 一時的クールダウン probe は、1 回のフォールバック実行につき provider ごとに 1 回に制限されるため、単一 provider が cross-provider フォールバックを停滞させることはありません。

  </Accordion>
</AccordionGroup>

## セッション override とライブ model 切り替え

セッション model の変更は共有状態です。アクティブ runner、`/model` コマンド、compaction/セッション更新、ライブセッション照合はすべて、同じセッションエントリの一部を読み書きします。

つまり、フォールバック再試行はライブ model 切り替えと協調する必要があります。

- 保留中のライブ切り替えとしてマークされるのは、明示的なユーザー主導の model 変更だけです。これには `/model`、`session_status(model=...)`、`sessions.patch` が含まれます。
- フォールバックローテーション、Heartbeat override、Compaction のようなシステム主導の model 変更は、それ自体では保留中のライブ切り替えをマークしません。
- フォールバック再試行が始まる前に、reply runner は選択されたフォールバック override フィールドをセッションエントリに永続化します。
- ライブセッション照合は、古いランタイム model フィールドより、永続化されたセッション override を優先します。
- フォールバック試行が失敗した場合、runner は自分が書き込んだ override フィールドだけを、しかもそれらがまだその失敗した候補と一致している場合に限ってロールバックします。

これにより、典型的な競合を防ぎます。

<Steps>
  <Step title="primary が失敗">
    選択された primary model が失敗します。
  </Step>
  <Step title="メモリ内でフォールバックを選択">
    フォールバック候補がメモリ内で選択されます。
  </Step>
  <Step title="セッションストアはまだ古い primary を指す">
    セッションストアはまだ古い primary を反映しています。
  </Step>
  <Step title="ライブ照合が古い状態を読む">
    ライブセッション照合が古いセッション状態を読み取ります。
  </Step>
  <Step title="再試行が元に戻される">
    フォールバック試行が始まる前に、再試行が古い model に戻されてしまいます。
  </Step>
</Steps>

永続化されたフォールバック override によってこの隙間は閉じられ、限定的なロールバックによって、より新しい手動またはランタイムのセッション変更は保護されます。

## 可観測性と失敗サマリー

`runWithModelFallback(...)` は、ログとユーザー向けクールダウンメッセージに使われる試行ごとの詳細を記録します。

- 試行された provider/model
- reason（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found` などのフェイルオーバー理由）
- 任意の status/code
- 人間向け可読なエラーサマリー

すべての候補が失敗すると、OpenClaw は `FallbackSummaryError` を送出します。外側の reply runner はこれを使って、「すべての models が一時的にレート制限中です」のような、より具体的なメッセージを構築し、わかっている場合は最も早いクールダウン期限も含めることができます。

そのクールダウンサマリーは model 認識型です。

- 試行された provider/model チェーンに無関係な model スコープのレート制限は無視されます
- 残っているブロックが、その model を引き続きブロックしている一致する model スコープのレート制限である場合、OpenClaw は最後に一致した期限を報告します

## 関連する config

次については [Gateway configuration](/ja-JP/gateway/configuration) を参照してください。

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` ルーティング

より広い model 選択とフォールバックの概要については [Models](/ja-JP/concepts/models) を参照してください。

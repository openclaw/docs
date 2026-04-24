---
read_when:
    - 認証プロファイルのローテーション、クールダウン、またはモデルフォールバックの動作を診断する場合
    - 認証プロファイルまたはモデルのフェイルオーバールールを更新する場合
    - セッションモデルの上書きがフォールバック再試行とどう相互作用するかを理解する場合
summary: OpenClaw が認証プロファイルをローテーションし、モデル間でフォールバックする仕組み
title: モデルフェイルオーバー
x-i18n:
    generated_at: "2026-04-24T04:53:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8921c9edd4699d8c623229cd3c82a92768d720fa9711862c270d6edb665841af
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw は、失敗を 2 段階で処理します。

1. 現在のプロバイダー内での**認証プロファイルのローテーション**
2. `agents.defaults.model.fallbacks` 内の次のモデルへの**モデルフォールバック**

このドキュメントでは、ランタイムルールとそれを支えるデータについて説明します。

## ランタイムフロー

通常のテキスト実行では、OpenClaw は次の順で候補を評価します。

1. 現在選択されているセッションモデル
2. 設定された `agents.defaults.model.fallbacks` を順番に
3. 実行が override から始まった場合は、最後に設定されたプライマリモデル

各候補の内部では、OpenClaw は
次のモデル候補へ進む前に認証プロファイルのフェイルオーバーを試します。

高レベルな流れ:

1. アクティブなセッションモデルと認証プロファイルの優先設定を解決する
2. モデル候補チェーンを構築する
3. 現在のプロバイダーを、認証プロファイルのローテーション/クールダウンルール付きで試す
4. そのプロバイダーがフェイルオーバーに値するエラーで使い尽くされたら、次の
   モデル候補へ移る
5. 再試行開始前に選択されたフォールバック override を永続化し、他の
   セッションリーダーがランナーが使おうとしているのと同じプロバイダー/モデルを見られるようにする
6. フォールバック候補が失敗した場合、その失敗した候補とまだ一致しているときに限り、
   フォールバック所有のセッション override フィールドだけをロールバックする
7. すべての候補が失敗した場合、各試行の詳細と、分かっている場合は最も早いクールダウン期限を含む `FallbackSummaryError` を投げる

これは意図的に「セッション全体を保存して復元する」より狭い範囲です。返信ランナーは
フォールバックのために、自身が所有するモデル選択フィールドだけを永続化します。

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

これにより、失敗したフォールバック再試行が、実行中に起きた `/model` の手動変更やセッションローテーション更新など、
新しい無関係なセッション変更を上書きするのを防ぎます。

## 認証ストレージ（キー + OAuth）

OpenClaw は、API キーと OAuth トークンの両方に **auth profiles** を使用します。

- シークレットは `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` に保存されます（レガシー: `~/.openclaw/agent/auth-profiles.json`）。
- ランタイムの認証ルーティング状態は `~/.openclaw/agents/<agentId>/agent/auth-state.json` に保存されます。
- config の `auth.profiles` / `auth.order` は **メタデータ + ルーティングのみ** です（シークレットは含みません）。
- レガシーのインポート専用 OAuth ファイル: `~/.openclaw/credentials/oauth.json`（初回使用時に `auth-profiles.json` へインポートされます）。

詳細: [/concepts/oauth](/ja-JP/concepts/oauth)

認証情報タイプ:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（一部プロバイダーでは `projectId`/`enterpriseUrl` も追加）

## プロファイル ID

OAuth ログインでは、複数アカウントを共存させるために個別のプロファイルが作成されます。

- デフォルト: メールアドレスがない場合は `provider:default`
- メールアドレス付き OAuth: `provider:<email>`（例 `google-antigravity:user@gmail.com`）

プロファイルは `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` の `profiles` 配下に保存されます。

## ローテーション順序

プロバイダーに複数のプロファイルがある場合、OpenClaw は次のように順序を選びます。

1. **明示的な config**: `auth.order[provider]`（設定されている場合）
2. **設定済みプロファイル**: プロバイダーで絞り込まれた `auth.profiles`
3. **保存済みプロファイル**: そのプロバイダーの `auth-profiles.json` エントリ

明示的な順序が設定されていない場合、OpenClaw はラウンドロビン順を使います。

- **主キー:** プロファイルタイプ（**OAuth が API キーより先**）
- **副キー:** `usageStats.lastUsed`（各タイプ内で最も古いものから）
- **クールダウン/無効化されたプロファイル** は末尾へ移動し、期限が最も早い順に並びます

### セッション固定性（キャッシュに優しい）

OpenClaw は、プロバイダーキャッシュを温かく保つために、**選ばれた auth profile をセッション単位で固定** します。
リクエストごとにはローテーションしません。固定されたプロファイルは、次の場合まで再利用されます。

- セッションがリセットされる（`/new` / `/reset`）
- Compaction が完了する（compaction count が増える）
- そのプロファイルがクールダウン中/無効化される

`/model …@<profileId>` による手動選択は、そのセッションに対する **ユーザー override** を設定し、
新しいセッションが始まるまで自動ローテーションされません。

自動固定されたプロファイル（セッションルーターによって選択されたもの）は **優先設定** として扱われます。
最初に試されますが、レート制限/タイムアウト時には OpenClaw が別のプロファイルへローテーションすることがあります。
ユーザー固定のプロファイルはそのプロファイルにロックされたままです。そのプロファイルが失敗し、モデルフォールバックが
設定されている場合、OpenClaw はプロファイルを切り替える代わりに次のモデルへ進みます。

### OAuth が「失われたように見える」理由

同じプロバイダーに OAuth プロファイルと API キープロファイルの両方がある場合、固定されていないと、ラウンドロビンによってメッセージ間でそれらが切り替わることがあります。1 つのプロファイルに固定するには:

- `auth.order[provider] = ["provider:profileId"]` で固定する、または
- セッションごとの override を `/model …` にプロファイル override を付けて使う（UI/chat surface が対応している場合）

## クールダウン

プロファイルが認証/レート制限エラー（またはレート制限に見えるタイムアウト）で失敗すると、
OpenClaw はそれをクールダウン状態にして次のプロファイルへ移ります。
このレート制限バケットは単なる `429` より広く、`Too many concurrent requests`、`ThrottlingException`、
`concurrency limit reached`、`workers_ai ... quota limit exceeded`、
`throttled`、`resource exhausted`、および `weekly/monthly limit reached`
のような定期使用ウィンドウ制限などのプロバイダーメッセージも含みます。
フォーマット/無効リクエストエラー（例: Cloud Code Assist の tool call ID
検証失敗）もフェイルオーバーに値すると扱われ、同じクールダウンを使います。
OpenAI 互換の stop-reason エラー、たとえば `Unhandled stop reason: error`、
`stop reason: error`、`reason: error` はタイムアウト/フェイルオーバー
シグナルとして分類されます。
ソースが既知の一時的パターンと一致する場合、プロバイダースコープの一般的なサーバーテキストも
そのタイムアウトバケットに入ることがあります。たとえば Anthropic の生の
`An unknown error occurred` や、`internal server error`、`unknown error, 520`、`upstream error`、
`backend error` などの一時的なサーバーテキストを含む JSON `api_error` ペイロードは、フェイルオーバーに値するタイムアウトとして扱われます。OpenRouter 固有の
一般的な上流テキスト、たとえば生の `Provider returned error` も、プロバイダーコンテキストが
実際に OpenRouter のときだけタイムアウトとして扱われます。`LLM request failed with an unknown error.` のような
一般的な内部フォールバックテキストは保守的に扱われ、それ単体ではフェイルオーバーをトリガーしません。

一部のプロバイダー SDK は、そうしないと長い `Retry-After` ウィンドウのあいだ
制御を OpenClaw に返す前に sleep する場合があります。Anthropic や
OpenAI のような Stainless ベースの SDK では、OpenClaw は SDK 内部の `retry-after-ms` / `retry-after` 待機をデフォルトで 60
秒に制限し、それより長い再試行可能レスポンスを即時に表面化してこの
フェイルオーバー経路を動かせるようにします。この上限の調整または無効化は
`OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` で行います。[/concepts/retry](/ja-JP/concepts/retry) を参照してください。

レート制限クールダウンはモデルスコープにもできます。

- OpenClaw は、失敗した
  モデル ID が分かっている場合、レート制限失敗に対して `cooldownModel` を記録します。
- 同じプロバイダー上の兄弟モデルでも、そのクールダウンが
  別のモデルに限定されていれば試すことができます。
- 課金/無効化ウィンドウは、モデルをまたいでプロファイル全体を引き続きブロックします。

クールダウンは指数バックオフを使います。

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

## 課金による無効化

課金/クレジット失敗（たとえば「insufficient credits」や「credit balance too low」）はフェイルオーバーに値すると扱われますが、通常は一時的ではありません。短いクールダウンの代わりに、OpenClaw はそのプロファイルを **無効化** としてマークし（より長いバックオフ付きで）、次のプロファイル/プロバイダーへローテーションします。

すべての課金系レスポンスが `402` とは限らず、すべての HTTP `402` が
ここに入るわけでもありません。OpenClaw は、プロバイダーが代わりに `401` や `403` を返した場合でも、
明示的な課金テキストは課金レーンに残しますが、プロバイダー固有のマッチャーはそれを所有する
プロバイダーに限定されます（たとえば OpenRouter の `403 Key limit
exceeded`）。一方で、一時的な `402` 使用ウィンドウや
組織/ワークスペースの支出上限エラーは、メッセージが再試行可能に見える場合
`rate_limit` として分類されます（たとえば `weekly usage limit exhausted`、`daily
limit reached, resets tomorrow`、`organization spending limit exceeded`）。
これらは長い
課金無効化経路ではなく、短いクールダウン/フェイルオーバー経路に残ります。

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

- 課金バックオフは **5 時間** から始まり、課金失敗ごとに倍増し、**24 時間** で上限になります。
- バックオフカウンターは、そのプロファイルが **24 時間** 失敗しなければリセットされます（設定可能）。
- 過負荷再試行では、モデルフォールバック前に **同一プロバイダー内の 1 回のプロファイルローテーション** を許可します。
- 過負荷再試行のバックオフはデフォルトで **0 ms** です。

## モデルフォールバック

プロバイダーのすべてのプロファイルが失敗すると、OpenClaw は
`agents.defaults.model.fallbacks` の次のモデルへ移ります。これは認証失敗、レート制限、および
プロファイルローテーションを使い果たしたタイムアウトに適用されます（その他のエラーではフォールバックは進みません）。

過負荷エラーとレート制限エラーは、課金クールダウンよりも積極的に扱われます。デフォルトでは、OpenClaw は同一プロバイダー内で 1 回の auth-profile 再試行を許可し、その後待たずに次の設定済みモデルフォールバックへ切り替えます。
`ModelNotReadyException` のようなプロバイダービジーシグナルは、この過負荷バケットに入ります。
これは `auth.cooldowns.overloadedProfileRotations`、
`auth.cooldowns.overloadedBackoffMs`、
`auth.cooldowns.rateLimitedProfileRotations` で調整できます。

実行がモデル override（hooks または CLI）から始まった場合でも、フォールバックは
設定済みフォールバックを試した後、最後に `agents.defaults.model.primary` で終わります。

### 候補チェーンのルール

OpenClaw は、現在要求されている `provider/model`
と設定済みフォールバックから候補リストを構築します。

ルール:

- 要求されたモデルは常に最初です。
- 明示的に設定されたフォールバックは重複排除されますが、モデル
  allowlist ではフィルタされません。これは明示的なオペレーター意図として扱われます。
- 現在の実行が同じプロバイダーファミリー内の設定済みフォールバック上にすでにある場合、
  OpenClaw は設定済みチェーン全体を引き続き使用します。
- 現在の実行が config と異なるプロバイダー上にあり、その現在の
  モデルが設定済みフォールバックチェーンの一部でない場合、OpenClaw は
  別のプロバイダーの無関係な設定済みフォールバックを追加しません。
- 実行が override から始まった場合、設定済みプライマリが最後に追加されるため、
  より前の候補が尽きた時点でチェーンが通常のデフォルトに戻って落ち着くことができます。

### どのエラーでフォールバックが進むか

モデルフォールバックは次の場合に継続します。

- 認証失敗
- レート制限とクールダウン枯渇
- 過負荷/プロバイダービジーエラー
- タイムアウト形のフェイルオーバーエラー
- 課金による無効化
- `LiveSessionModelSwitchError`。これはフェイルオーバー経路に正規化されるため、
  古い永続化モデルが外側の再試行ループを作りません
- まだ候補が残っている場合の、その他の未認識エラー

モデルフォールバックは次の場合に継続しません。

- タイムアウト/フェイルオーバー形ではない明示的中止
- compaction/retry ロジック内に留めるべきコンテキストオーバーフローエラー
  （たとえば `request_too_large`、`INVALID_ARGUMENT: input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`The input is too long for the model`、`ollama error: context
length exceeded`）
- 候補がもう残っていない時点での最終的な未知のエラー

### クールダウンスキップ vs probe の動作

プロバイダーのすべての auth profile がすでにクールダウン中であっても、OpenClaw は
そのプロバイダーを永遠に自動スキップするわけではありません。候補ごとに判断します。

- 永続的な認証失敗は、プロバイダー全体を即座にスキップします。
- 課金による無効化は通常スキップされますが、再起動なしでも復旧可能にするため、
  プライマリ候補はスロットル付きで probe されることがあります。
- プライマリ候補は、プロバイダーごとの
  スロットル付きで、クールダウン期限が近づいた時点で probe されることがあります。
- 同一プロバイダー内のフォールバック兄弟モデルは、失敗が一時的に見える場合（`rate_limit`、`overloaded`、または unknown）には、
  クールダウン中でも試行されることがあります。これは特に、レート制限がモデルスコープで、兄弟モデルが
  すぐに回復する可能性がある場合に重要です。
- 一時的クールダウン probe は、1 回のフォールバック実行につきプロバイダーごとに 1 回までに制限されるため、
  単一プロバイダーがクロスプロバイダーフォールバックを停滞させません。

## セッション override とライブモデル切り替え

セッションモデル変更は共有状態です。アクティブなランナー、`/model` コマンド、
compaction/session 更新、ライブセッション再調整は、すべて同じセッションエントリの一部を読み書きします。

つまり、フォールバック再試行はライブモデル切り替えと協調する必要があります。

- 保留中のライブ切り替えとしてマークされるのは、明示的なユーザー主導のモデル変更だけです。それには
  `/model`、`session_status(model=...)`、`sessions.patch` が含まれます。
- フォールバックローテーション、Heartbeat override、
  compaction などのシステム主導のモデル変更は、それ自体では保留中のライブ切り替えをマークしません。
- フォールバック再試行開始前に、返信ランナーは選択された
  フォールバック override フィールドをセッションエントリへ永続化します。
- ライブセッション再調整は、古いランタイムモデルフィールドよりも、永続化されたセッション override を優先します。
- フォールバック試行が失敗した場合、ランナーは自分が書き込んだ override フィールドだけを、
  それらがまだその失敗した候補と一致している場合に限ってロールバックします。

これにより、典型的なレースを防ぎます。

1. プライマリが失敗する。
2. フォールバック候補がメモリ上で選ばれる。
3. セッションストアにはまだ古いプライマリが残っている。
4. ライブセッション再調整が古いセッション状態を読む。
5. フォールバック試行が始まる前に、再試行が古いモデルへ戻される。

永続化されたフォールバック override がこの隙間を閉じ、
狭い範囲のロールバックにより、新しい手動またはランタイムのセッション変更がそのまま保たれます。

## 可観測性と失敗サマリー

`runWithModelFallback(...)` は、ログと
ユーザー向けクールダウンメッセージのもとになる試行ごとの詳細を記録します。

- 試行された provider/model
- 理由（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found`、および
  類似のフェイルオーバー理由）
- 任意の status/code
- 人間可読なエラーサマリー

すべての候補が失敗すると、OpenClaw は `FallbackSummaryError` を投げます。外側の
返信ランナーはこれを使って、「すべてのモデルが一時的に rate-limited です」のような
より具体的なメッセージを構築し、分かっている場合は最も早いクールダウン期限を含めることができます。

このクールダウンサマリーはモデル認識型です。

- 試行された
  provider/model チェーンに無関係なモデルスコープのレート制限は無視されます
- 残っているブロックが一致するモデルスコープのレート制限である場合、OpenClaw
  はそのモデルを引き続きブロックしている最後の一致期限を報告します

## 関連設定

以下については [Gateway configuration](/ja-JP/gateway/configuration) を参照してください。

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` ルーティング

より広いモデル選択とフォールバックの概要については [Models](/ja-JP/concepts/models) を参照してください。

---
read_when:
    - 認証プロファイルのローテーション、クールダウン、またはモデルのフォールバック動作の診断
    - 認証プロファイルまたはモデルのフォールバックルールの更新
    - セッションのモデルオーバーライドがフォールバック再試行とどのように相互作用するかを理解する
summary: OpenClaw が認証プロファイルをローテーションし、モデル間でフォールバックする仕組み
title: モデルのフォールバック
x-i18n:
    generated_at: "2026-04-25T18:16:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: e128c288ed420874f1b5eb28ecaa4ada66f09152c1b0b73b1d932bf5e86b6dd7
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw は失敗を 2 段階で処理します。

1. 現在のプロバイダー内での**認証プロファイルのローテーション**
2. `agents.defaults.model.fallbacks` 内の次のモデルへの**モデルのフォールバック**

このドキュメントでは、ランタイムルールと、それを支えるデータについて説明します。

## ランタイムフロー

通常のテキスト実行では、OpenClaw は次の順序で候補を評価します。

1. 現在選択されているセッションモデル
2. 設定された `agents.defaults.model.fallbacks` を順番に
3. 実行がオーバーライドから開始された場合は、最後に設定済みのプライマリモデル

各候補の内部では、OpenClaw は次のモデル候補へ進む前に、認証プロファイルのフェイルオーバーを試します。

大まかなシーケンス:

1. アクティブなセッションモデルと認証プロファイル設定を解決する。
2. モデル候補チェーンを構築する。
3. 認証プロファイルのローテーション / クールダウンルールを使って現在のプロバイダーを試す。
4. そのプロバイダーがフェイルオーバー対象のエラーで使い尽くされた場合、次のモデル候補に移る。
5. 再試行が始まる前に、選択されたフォールバックオーバーライドを永続化し、他のセッションリーダーがランナーがこれから使うのと同じプロバイダー / モデルを見られるようにする。
6. フォールバック候補が失敗した場合は、その失敗した候補とまだ一致しているときに限り、フォールバックが所有するセッションオーバーライドフィールドのみをロールバックする。
7. すべての候補が失敗した場合は、各試行の詳細と、判明している場合は最も早いクールダウン期限を含む `FallbackSummaryError` を投げる。

これは意図的に「セッション全体を保存して復元する」よりも狭い範囲です。返信ランナーは、フォールバックのために自分が所有するモデル選択フィールドだけを永続化します。

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

これにより、失敗したフォールバック再試行が、試行の実行中に発生した手動の `/model` 変更やセッションローテーション更新など、新しい無関係なセッション変更を上書きするのを防ぎます。

## 認証ストレージ（キー + OAuth）

OpenClaw は API キーと OAuth トークンの両方に**認証プロファイル**を使います。

- シークレットは `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` に保存されます（レガシー: `~/.openclaw/agent/auth-profiles.json`）。
- ランタイムの認証ルーティング状態は `~/.openclaw/agents/<agentId>/agent/auth-state.json` に保存されます。
- 設定 `auth.profiles` / `auth.order` は**メタデータ + ルーティング専用**です（シークレットは含みません）。
- レガシーのインポート専用 OAuth ファイル: `~/.openclaw/credentials/oauth.json`（初回使用時に `auth-profiles.json` にインポートされます）。

詳細: [/concepts/oauth](/ja-JP/concepts/oauth)

認証情報の型:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（一部のプロバイダーでは `projectId` / `enterpriseUrl` も含む）

## プロファイル ID

OAuth ログインでは、複数のアカウントを共存させられるように、個別のプロファイルが作成されます。

- デフォルト: メールアドレスが利用できない場合は `provider:default`
- メールアドレス付き OAuth: `provider:<email>`（例: `google-antigravity:user@gmail.com`）

プロファイルは `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` の `profiles` 配下に保存されます。

## ローテーション順

プロバイダーに複数のプロファイルがある場合、OpenClaw は次のように順序を決めます。

1. **明示的な設定**: `auth.order[provider]`（設定されている場合）
2. **設定済みプロファイル**: プロバイダーで絞り込んだ `auth.profiles`
3. **保存済みプロファイル**: そのプロバイダーの `auth-profiles.json` 内のエントリ

明示的な順序が設定されていない場合、OpenClaw はラウンドロビン順を使います。

- **主キー:** プロファイル種別（**OAuth を API キーより優先**）
- **副キー:** `usageStats.lastUsed`（各種別内で最も古いものから）
- **クールダウン中 / 無効化されたプロファイル** は末尾に移され、期限が最も早い順に並べられます。

### セッションのスティッキー性（キャッシュに優しい）

OpenClaw は、プロバイダーのキャッシュを温かく保つため、**選択した認証プロファイルをセッションごとに固定**します。
**リクエストごとには**ローテーションしません。固定されたプロファイルは、次の場合まで再利用されます。

- セッションがリセットされる（`/new` / `/reset`）
- Compaction が完了する（compaction count が増加する）
- そのプロファイルがクールダウン中 / 無効化される

`/model …@<profileId>` による手動選択は、そのセッションの**ユーザーオーバーライド**を設定し、新しいセッションが始まるまで自動ローテーションされません。

自動固定されたプロファイル（セッションルーターが選択したもの）は、**優先設定**として扱われます。
最初に試されますが、レート制限やタイムアウト時には OpenClaw が別のプロファイルへローテーションすることがあります。
ユーザーが固定したプロファイルはそのプロファイルにロックされたままで、失敗してモデルフォールバックが設定されている場合、OpenClaw はプロファイルを切り替えずに次のモデルへ移ります。

### OAuth が「失われたように見える」理由

同じプロバイダーに OAuth プロファイルと API キープロファイルの両方がある場合、固定されていないと、ラウンドロビンによってメッセージ間でそれらが切り替わることがあります。単一のプロファイルを強制するには:

- `auth.order[provider] = ["provider:profileId"]` で固定する、または
- プロファイルオーバーライド付きの `/model …` によるセッション単位オーバーライドを使う（UI / チャット画面が対応している場合）

## クールダウン

プロファイルが認証エラー / レート制限エラー（またはレート制限に見えるタイムアウト）で失敗すると、OpenClaw はそれをクールダウン状態にして次のプロファイルへ移ります。
このレート制限バケットは単なる `429` より広く、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted`、`weekly/monthly limit reached` のような定期利用ウィンドウ制限といったプロバイダーメッセージも含みます。
フォーマット / 無効リクエストエラー（例: Cloud Code Assist のツール呼び出し ID 検証失敗）はフェイルオーバー対象として扱われ、同じクールダウンが使われます。
`Unhandled stop reason: error`、`stop reason: error`、`reason: error` のような OpenAI 互換の stop-reason エラーは、タイムアウト / フェイルオーバー信号として分類されます。
一般的なサーバーテキストも、ソースが既知の一時的パターンに一致する場合は、そのタイムアウトバケットに入ることがあります。たとえば、素の pi-ai ストリームラッパーメッセージ `An unknown error occurred` は、pi-ai が特定の詳細なしに `stopReason: "aborted"` または `stopReason: "error"` でプロバイダーストリームを終了したときにそれを発するため、すべてのプロバイダーでフェイルオーバー対象として扱われます。`internal server error`、`unknown error, 520`、`upstream error`、`backend error` のような一時的なサーバーテキストを含む JSON `api_error` ペイロードも、フェイルオーバー対象のタイムアウトとして扱われます。
OpenRouter 固有の一般的な upstream テキスト、たとえば素の `Provider returned error` は、プロバイダーコンテキストが実際に OpenRouter の場合にのみタイムアウトとして扱われます。
`LLM request failed with an unknown error.` のような一般的な内部フォールバックテキストは保守的に扱われ、それ単体ではフェイルオーバーをトリガーしません。

一部のプロバイダー SDK は、制御を OpenClaw に戻す前に長い `Retry-After` ウィンドウのあいだスリープすることがあります。Anthropic や OpenAI などの Stainless ベース SDK では、OpenClaw は SDK 内部の `retry-after-ms` / `retry-after` 待機をデフォルトで 60 秒に制限し、より長い再試行可能レスポンスはこのフェイルオーバーパスを実行できるよう即座に表面化します。上限の調整または無効化は `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` で行います。詳細は [/concepts/retry](/ja-JP/concepts/retry) を参照してください。

レート制限クールダウンはモデル単位にすることもできます。

- OpenClaw は、失敗したモデル ID が分かっている場合、レート制限失敗に対して `cooldownModel` を記録します。
- 同じプロバイダー上の兄弟モデルであれば、クールダウンが別のモデルにスコープされている場合でも試行できます。
- 課金 / 無効化ウィンドウは、モデルをまたいでそのプロファイル全体をブロックします。

クールダウンは指数バックオフを使います。

- 1 分
- 5 分
- 25 分
- 1 時間（上限）

状態は `auth-state.json` の `usageStats` に保存されます。

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

課金 / クレジット失敗（たとえば「insufficient credits」や「credit balance too low」）はフェイルオーバー対象として扱われますが、通常は一時的ではありません。短いクールダウンの代わりに、OpenClaw はそのプロファイルを**無効化**としてマークし（より長いバックオフ付き）、次のプロファイル / プロバイダーへローテーションします。

課金っぽいレスポンスが常に `402` とは限らず、HTTP `402` が常にここに入るとも限りません。OpenClaw は、プロバイダーが代わりに `401` や `403` を返した場合でも、明示的な課金テキストは課金レーンに保持しますが、プロバイダー固有のマッチャーはそのプロバイダーにスコープされたままです（例: OpenRouter の `403 Key limit exceeded`）。一方で、一時的な `402` の利用ウィンドウや organization / workspace の spend limit エラーは、メッセージが再試行可能に見える場合は `rate_limit` として分類されます（例: `weekly usage limit exhausted`、`daily limit reached, resets tomorrow`、`organization spending limit exceeded`）。これらは長い課金無効化パスではなく、短いクールダウン / フェイルオーバーパスに留まります。

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
- バックオフカウンターは、プロファイルが **24 時間** 失敗していなければリセットされます（設定可能）。
- 過負荷時の再試行では、モデルフォールバック前に **同一プロバイダー内で 1 回の認証プロファイルローテーション** を許可します。
- 過負荷時の再試行はデフォルトで **0 ms のバックオフ** を使います。

## モデルのフォールバック

あるプロバイダーのすべてのプロファイルが失敗すると、OpenClaw は `agents.defaults.model.fallbacks` の次のモデルへ移ります。これは認証失敗、レート制限、プロファイルローテーションを使い切ったタイムアウトに適用されます（それ以外のエラーではフォールバックは進みません）。

過負荷エラーとレート制限エラーは、課金クールダウンよりも積極的に処理されます。デフォルトでは、OpenClaw は同一プロバイダー内で 1 回の認証プロファイル再試行を許可し、その後は待たずに次に設定されたモデルフォールバックへ切り替えます。`ModelNotReadyException` のようなプロバイダー多忙シグナルは、この過負荷バケットに入ります。これは `auth.cooldowns.overloadedProfileRotations`、`auth.cooldowns.overloadedBackoffMs`、`auth.cooldowns.rateLimitedProfileRotations` で調整できます。

実行がモデルオーバーライド（フックや CLI）で始まった場合でも、設定済みフォールバックを試した後の最後は `agents.defaults.model.primary` になります。

### 候補チェーンのルール

OpenClaw は、現在要求されている `provider/model` と設定済みフォールバックから候補リストを構築します。

ルール:

- 要求されたモデルは常に先頭です。
- 明示的に設定されたフォールバックは重複排除されますが、モデル allowlist ではフィルタリングされません。これは明示的な運用者の意図として扱われます。
- 現在の実行が同じプロバイダーファミリー内の設定済みフォールバック上にすでにある場合、OpenClaw は設定済みチェーン全体を使い続けます。
- 現在の実行が設定と異なるプロバイダー上にあり、その現在のモデルが設定済みフォールバックチェーンにまだ含まれていない場合、OpenClaw は別のプロバイダーの無関係な設定済みフォールバックを追加しません。
- 実行がオーバーライドから開始された場合、設定済みプライマリが末尾に追加されるため、先行する候補が使い尽くされたときに通常のデフォルトへ戻れます。

### どのエラーでフォールバックが進むか

モデルのフォールバックは次の場合に継続します。

- 認証失敗
- レート制限とクールダウン枯渇
- 過負荷 / プロバイダー多忙エラー
- タイムアウト系のフェイルオーバーエラー
- 課金による無効化
- `LiveSessionModelSwitchError`。これはフェイルオーバーパスに正規化されるため、古い永続化モデルが外側の再試行ループを作りません
- まだ候補が残っている場合の、その他の未認識エラー

モデルのフォールバックは次の場合には継続しません。

- タイムアウト / フェイルオーバー系ではない明示的な中断
- compaction / retry ロジック内に留まるべきコンテキストオーバーフローエラー
  （例: `request_too_large`、`INVALID_ARGUMENT: input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`The input is too long for the model`、`ollama error: context
length exceeded`）
- 候補がもう残っていないときの最終的な不明エラー

### クールダウン時のスキップとプローブの動作

あるプロバイダーのすべての認証プロファイルがすでにクールダウン中でも、OpenClaw はそのプロバイダーを自動的に永久スキップするわけではありません。候補ごとに判断します。

- 永続的な認証失敗では、そのプロバイダー全体を即座にスキップします。
- 課金による無効化は通常スキップされますが、再起動なしで復旧できるよう、プライマリ候補はスロットル付きでプローブされることがあります。
- プライマリ候補は、プロバイダーごとのスロットルを伴って、クールダウン期限の近くでプローブされることがあります。
- 同一プロバイダー内のフォールバック兄弟モデルは、失敗が一時的に見える場合（`rate_limit`、`overloaded`、または不明）には、クールダウン中でも試行されることがあります。これは特に、レート制限がモデル単位であり、兄弟モデルならすぐに回復する可能性がある場合に重要です。
- 一時的なクールダウンプローブは、フォールバック実行ごとにプロバイダーごと 1 回に制限されるため、単一のプロバイダーがクロスプロバイダーのフォールバックを停滞させることはありません。

## セッションオーバーライドとライブモデル切り替え

セッションモデルの変更は共有状態です。アクティブなランナー、`/model` コマンド、Compaction / セッション更新、ライブセッションのリコンシリエーションは、同じセッションエントリの一部を読み書きします。

つまり、フォールバック再試行はライブモデル切り替えと協調する必要があります。

- 保留中のライブ切り替えをマークするのは、明示的なユーザー主導のモデル変更だけです。これには `/model`、`session_status(model=...)`、`sessions.patch` が含まれます。
- フォールバックローテーション、Heartbeat オーバーライド、Compaction などのシステム主導のモデル変更は、それ自体では保留中のライブ切り替えをマークしません。
- フォールバック再試行が始まる前に、返信ランナーは選択されたフォールバックオーバーライドフィールドをセッションエントリに永続化します。
- ライブセッションのリコンシリエーションは、古いランタイムモデルフィールドよりも永続化されたセッションオーバーライドを優先します。
- フォールバック試行が失敗した場合、ランナーは自分が書いたオーバーライドフィールドだけを、しかもそれらがまだその失敗した候補と一致している場合に限ってロールバックします。

これにより、典型的な競合を防ぎます。

1. プライマリが失敗する。
2. フォールバック候補がメモリ内で選択される。
3. セッションストアにはまだ古いプライマリが残っている。
4. ライブセッションのリコンシリエーションが古いセッション状態を読む。
5. フォールバック試行が始まる前に、再試行が古いモデルへ戻されてしまう。

永続化されたフォールバックオーバーライドがこの隙間を塞ぎ、限定的なロールバックによって、より新しい手動またはランタイムのセッション変更はそのまま保たれます。

## 可観測性と失敗サマリー

`runWithModelFallback(...)` は、ログとユーザー向けクールダウンメッセージに使われる試行ごとの詳細を記録します。

- 試行した provider / model
- reason（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found`、および同様のフェイルオーバー理由）
- 任意の status / code
- 人が読めるエラー要約

すべての候補が失敗した場合、OpenClaw は `FallbackSummaryError` を投げます。外側の返信ランナーはこれを使って、「すべてのモデルが一時的にレート制限されています」のような、より具体的なメッセージを構築し、判明している場合は最も早いクールダウン期限を含めることができます。

そのクールダウンサマリーはモデルを考慮します。

- 試行された provider / model チェーンに無関係な、モデル単位のレート制限は無視されます。
- 残っているブロックがそのモデルに一致するモデル単位のレート制限である場合、OpenClaw はそのモデルを依然としてブロックしている最後の一致期限を報告します。

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

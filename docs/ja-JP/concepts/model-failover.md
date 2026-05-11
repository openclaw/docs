---
read_when:
    - 認証プロファイルのローテーション、クールダウン、またはモデルのフォールバック動作の診断
    - 認証プロファイルまたはモデルのフェイルオーバールールの更新
    - セッションモデルのオーバーライドがフォールバック再試行とどのように相互作用するかを理解する
sidebarTitle: Model failover
summary: OpenClaw が認証プロファイルをローテーションし、モデル間でフォールバックする仕組み
title: モデルのフェイルオーバー
x-i18n:
    generated_at: "2026-05-11T20:28:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3983218c9de67bbd100eab655c319ed97350d43e00c826febd47cb014cbe6cf
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw は失敗を 2 段階で処理します。

1. 現在のプロバイダー内での**認証プロファイルのローテーション**。
2. `agents.defaults.model.fallbacks` 内の次のモデルへの**モデルフォールバック**。

このドキュメントでは、ランタイム規則とそれを支えるデータについて説明します。

## ランタイムフロー

通常のテキスト実行では、OpenClaw は次の順序で候補を評価します。

<Steps>
  <Step title="セッション状態を解決">
    アクティブなセッションモデルと認証プロファイルの優先設定を解決します。
  </Step>
  <Step title="候補チェーンを構築">
    現在のモデル選択と、その選択ソースに対するフォールバックポリシーから、モデル候補チェーンを構築します。設定済みデフォルト、cron ジョブのプライマリ、自動選択されたフォールバックモデルは、設定済みフォールバックを使用できます。明示的なユーザーセッション選択は厳密です。
  </Step>
  <Step title="現在のプロバイダーを試行">
    認証プロファイルのローテーション/クールダウン規則に従って、現在のプロバイダーを試行します。
  </Step>
  <Step title="フェイルオーバー対象のエラーで進む">
    そのプロバイダーがフェイルオーバー対象のエラーで使い切られた場合、次のモデル候補へ移動します。
  </Step>
  <Step title="フォールバックオーバーライドを永続化">
    リトライが始まる前に、選択したフォールバックオーバーライドを永続化します。これにより、他のセッションリーダーは、ランナーがこれから使用するものと同じプロバイダー/モデルを参照できます。永続化されたモデルオーバーライドには `modelOverrideSource: "auto"` が付けられます。
  </Step>
  <Step title="失敗時は限定的にロールバック">
    フォールバック候補が失敗した場合、その失敗した候補とまだ一致しているときに限り、フォールバックが所有するセッションオーバーライドフィールドだけをロールバックします。
  </Step>
  <Step title="使い切った場合は FallbackSummaryError をスロー">
    すべての候補が失敗した場合、試行ごとの詳細と、判明している場合は最短のクールダウン期限を含む `FallbackSummaryError` をスローします。
  </Step>
</Steps>

これは意図的に「セッション全体を保存して復元する」よりも狭い範囲です。返信ランナーは、フォールバック用に自身が所有するモデル選択フィールドだけを永続化します。

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

これにより、失敗したフォールバックリトライが、試行の実行中に発生した手動の `/model` 変更やセッションローテーション更新など、新しい無関係なセッション変更を上書きするのを防ぎます。

## 選択ソースポリシー

OpenClaw は、選択されたプロバイダー/モデルと、それが選択された理由を分離します。そのソースが、フォールバックチェーンを許可するかどうかを制御します。

- **設定済みデフォルト**: `agents.defaults.model.primary` は `agents.defaults.model.fallbacks` を使用します。
- **エージェントプライマリ**: `agents.list[].model` は、そのエージェントモデルオブジェクトが独自の `fallbacks` を含まない限り厳密です。厳密な動作を明示するには `fallbacks: []` を使用し、そのエージェントをモデルフォールバックに参加させるには空でないリストを指定します。
- **自動フォールバックオーバーライド**: ランタイムフォールバックは、リトライ前に `providerOverride`、`modelOverride`、`modelOverrideSource: "auto"`、および選択された起点モデルを書き込みます。その自動オーバーライドは、設定済みフォールバックチェーンを引き続き進めることができ、`/new`、`/reset`、`sessions.reset` によってクリアされます。明示的な `heartbeat.model` なしで実行される Heartbeat も、その起点が現在の設定済みデフォルトと一致しなくなった場合、直接の自動オーバーライドをクリアします。
- **ユーザーセッションオーバーライド**: `/model`、モデルピッカー、`session_status(model=...)`、`sessions.patch` は `modelOverrideSource: "user"` を書き込みます。これは正確なセッション選択です。選択されたプロバイダー/モデルが返信を生成する前に失敗した場合、OpenClaw は無関係な設定済みフォールバックから回答するのではなく、その失敗を報告します。
- **レガシーセッションオーバーライド**: 古いセッションエントリには、`modelOverrideSource` なしで `modelOverride` が含まれる場合があります。OpenClaw はそれらをユーザーオーバーライドとして扱うため、明示的な古い選択が黙ってフォールバック動作へ変換されることはありません。
- **cron ペイロードモデル**: cron ジョブの `payload.model` / `--model` はジョブプライマリであり、ユーザーセッションオーバーライドではありません。ジョブが `payload.fallbacks` を提供しない限り、設定済みフォールバックを使用します。`payload.fallbacks: []` は cron 実行を厳密にします。

## 認証ストレージ（キー + OAuth）

OpenClaw は API キーと OAuth トークンの両方に**認証プロファイル**を使用します。

- シークレットは `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` にあります（レガシー: `~/.openclaw/agent/auth-profiles.json`）。
- ランタイム認証ルーティング状態は `~/.openclaw/agents/<agentId>/agent/auth-state.json` にあります。
- 設定 `auth.profiles` / `auth.order` は**メタデータ + ルーティングのみ**です（シークレットなし）。
- レガシーのインポート専用 OAuth ファイル: `~/.openclaw/credentials/oauth.json`（初回使用時に `auth-profiles.json` へインポートされます）。

詳細: [OAuth](/ja-JP/concepts/oauth)

認証情報の種類:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（一部のプロバイダーでは `projectId`/`enterpriseUrl` も含む）

## プロファイル ID

OAuth ログインは、複数のアカウントが共存できるように個別のプロファイルを作成します。

- デフォルト: メールアドレスが利用できない場合は `provider:default`。
- メールアドレス付き OAuth: `provider:<email>`（例: `google-antigravity:user@gmail.com`）。

プロファイルは `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 内の `profiles` の下にあります。

## ローテーション順序

プロバイダーに複数のプロファイルがある場合、OpenClaw は次のような順序を選択します。

<Steps>
  <Step title="明示的な設定">
    `auth.order[provider]`（設定されている場合）。
  </Step>
  <Step title="設定済みプロファイル">
    `auth.profiles` をプロバイダーでフィルターしたもの。
  </Step>
  <Step title="保存済みプロファイル">
    そのプロバイダーの `auth-profiles.json` 内のエントリ。
  </Step>
</Steps>

明示的な順序が設定されていない場合、OpenClaw はラウンドロビン順序を使用します。

- **主キー:** プロファイル種別（**API キーより OAuth が先**）。
- **副キー:** `usageStats.lastUsed`（各種別内で最も古いものが先）。
- **クールダウン中/無効化されたプロファイル**は末尾に移動され、最短期限順に並べられます。

### セッションの固定性（キャッシュに優しい）

OpenClaw はプロバイダーキャッシュを温めたままにするため、**セッションごとに選択された認証プロファイルを固定**します。リクエストごとにはローテーションしません。固定されたプロファイルは、次のいずれかまで再利用されます。

- セッションがリセットされる（`/new` / `/reset`）
- Compaction が完了する（compaction カウントが増加する）
- プロファイルがクールダウン中/無効化されている

`/model …@<profileId>` による手動選択は、そのセッションの**ユーザーオーバーライド**を設定し、新しいセッションが始まるまで自動ローテーションされません。

<Note>
自動固定プロファイル（セッションルーターによって選択されたもの）は**優先設定**として扱われます。最初に試行されますが、OpenClaw はレート制限/タイムアウト時に別のプロファイルへローテーションする場合があります。元のプロファイルが再び利用可能になると、新しい実行では、選択されたモデルやランタイムを変更せずに再びそれを優先できます。ユーザー固定プロファイルはそのプロファイルにロックされたままです。失敗してモデルフォールバックが設定されている場合、OpenClaw はプロファイルを切り替えるのではなく、次のモデルへ移動します。
</Note>

### OpenAI Codex サブスクリプションと API キーバックアップ

OpenAI エージェントモデルでは、認証とランタイムは分離されています。`openai/gpt-*` は
Codex ハーネス上に留まり、認証は Codex サブスクリプションプロファイルと
OpenAI API キーバックアップの間でローテーションできます。

ユーザー向けの順序には `auth.order.openai` を使用します。

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

既存の Codex サブスクリプションプロファイルは、引き続きレガシーの
`openai-codex:*` プロファイル ID を使用する場合があります。順序付けされた API キーバックアップは通常の
`openai:*` API キープロファイルにできます。サブスクリプションが Codex 使用量制限に達すると、
Codex が提供する場合、OpenClaw は正確なリセット時刻を記録し、次に
順序付けされた認証プロファイルを試し、実行を Codex ハーネス内に保ちます。リセット時刻を
過ぎると、サブスクリプションプロファイルは再び対象になり、次の自動
選択でそこへ戻ることができます。

そのセッションで 1 つのアカウント/キーを強制したい場合にのみ、ユーザー固定プロファイルを使用します。ユーザー固定プロファイルは意図的に厳密であり、黙って
別のプロファイルへ移動しません。

## クールダウン

認証/レート制限エラー（またはレート制限のように見えるタイムアウト）によってプロファイルが失敗した場合、OpenClaw はそれをクールダウンにマークし、次のプロファイルへ移動します。

<AccordionGroup>
  <Accordion title="レート制限 / タイムアウトバケットに入るもの">
    そのレート制限バケットは単純な `429` より広く、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted`、および `weekly/monthly limit reached` のような定期的な使用ウィンドウ制限などのプロバイダーメッセージも含みます。

    形式/無効リクエストエラーは通常終端的です。同じペイロードをリトライしても同じように失敗するため、OpenClaw は認証プロファイルをローテーションするのではなく、それらを表面化します。既知のリトライ修復パスは明示的に参加できます。たとえば Cloud Code Assist のツール呼び出し ID 検証失敗はサニタイズされ、`allowFormatRetry` ポリシーを通じて 1 回リトライされます。`Unhandled stop reason: error`、`stop reason: error`、`reason: error` のような OpenAI 互換の停止理由エラーは、タイムアウト/フェイルオーバー信号として分類されます。

    ソースが既知の一時的パターンに一致する場合、汎用サーバーテキストもそのタイムアウトバケットに入ることがあります。たとえば、素の pi-ai ストリームラッパーメッセージ `An unknown error occurred` は、すべてのプロバイダーでフェイルオーバー対象として扱われます。これは pi-ai が、プロバイダーストリームが具体的な詳細なしで `stopReason: "aborted"` または `stopReason: "error"` によって終了したときにそれを発するためです。`internal server error`、`unknown error, 520`、`upstream error`、`backend error` のような一時的なサーバーテキストを含む JSON `api_error` ペイロードも、フェイルオーバー対象のタイムアウトとして扱われます。

    OpenRouter 固有の汎用アップストリームテキスト、たとえば素の `Provider returned error` は、プロバイダーコンテキストが実際に OpenRouter の場合にのみタイムアウトとして扱われます。`LLM request failed with an unknown error.` のような汎用内部フォールバックテキストは保守的な扱いのままで、それ自体ではフェイルオーバーをトリガーしません。

  </Accordion>
  <Accordion title="SDK retry-after 上限">
    一部のプロバイダー SDK は、OpenClaw に制御を返す前に、長い `Retry-After` ウィンドウの間スリープする場合があります。Anthropic や OpenAI などの Stainless ベース SDK については、OpenClaw は SDK 内部の `retry-after-ms` / `retry-after` 待機をデフォルトで 60 秒に制限し、より長いリトライ可能レスポンスは即座に表面化するため、このフェイルオーバーパスを実行できます。上限を調整または無効化するには `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` を使用してください。[リトライ動作](/ja-JP/concepts/retry)を参照してください。
  </Accordion>
  <Accordion title="モデルスコープのクールダウン">
    レート制限クールダウンはモデルスコープにもできます。

    - 失敗したモデル ID が判明している場合、OpenClaw はレート制限失敗に対して `cooldownModel` を記録します。
    - クールダウンが別のモデルにスコープされている場合、同じプロバイダー上の兄弟モデルは引き続き試行できます。
    - 請求/無効化ウィンドウは、モデルをまたいでプロファイル全体を引き続きブロックします。

  </Accordion>
</AccordionGroup>

クールダウンは指数バックオフを使用します。

- 1 分
- 5 分
- 25 分
- 1 時間（上限）

状態は `auth-state.json` 内の `usageStats` に保存されます。

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

## 請求による無効化

請求/クレジット失敗（たとえば "insufficient credits" / "credit balance too low"）はフェイルオーバー対象として扱われますが、通常は一時的ではありません。短いクールダウンではなく、OpenClaw はプロファイルを**無効化**（より長いバックオフ付き）としてマークし、次のプロファイル/プロバイダーへローテーションします。

<Note>
請求のようなレスポンスがすべて `402` とは限らず、HTTP `402` がすべてここに入るわけでもありません。プロバイダーが代わりに `401` または `403` を返す場合でも、OpenClaw は明示的な請求テキストを請求レーンに保ちますが、プロバイダー固有のマッチャーは、それを所有するプロバイダーにスコープされたままです（たとえば OpenRouter `403 Key limit exceeded`）。

一方、一時的な `402` の使用期間エラーや組織/ワークスペースの支出上限エラーは、メッセージがリトライ可能に見える場合（たとえば `weekly usage limit exhausted`、`daily limit reached, resets tomorrow`、または `organization spending limit exceeded`）に `rate_limit` と分類されます。それらは長い課金無効化パスではなく、短いクールダウン/フェイルオーバーパスに留まります。
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

- 課金バックオフは **5 時間** から始まり、課金失敗ごとに倍増し、**24 時間** で上限に達します。
- プロファイルが **24 時間** 失敗していない場合、バックオフカウンターはリセットされます（設定可能）。
- 過負荷リトライでは、モデルフォールバックの前に **同一プロバイダー内で 1 回のプロファイルローテーション** を許可します。
- 過負荷リトライはデフォルトで **0 ms backoff** を使用します。

## モデルフォールバック

プロバイダーのすべてのプロファイルが失敗すると、OpenClaw は `agents.defaults.model.fallbacks` の次のモデルに移動します。これは、プロファイルローテーションを使い切った認証失敗、レート制限、タイムアウトに適用されます（その他のエラーではフォールバックは進みません）。十分な詳細を公開しないプロバイダーエラーも、フォールバック状態では正確にラベル付けされます。`empty_response` はプロバイダーが使用可能なメッセージまたはステータスを返さなかったことを意味し、`no_error_details` はプロバイダーが明示的に `Unknown error (no error details in response)` を返したことを意味し、`unclassified` は OpenClaw が生のプレビューを保持したものの、まだどの分類器にも一致しなかったことを意味します。

過負荷エラーとレート制限エラーは、課金クールダウンより積極的に処理されます。デフォルトでは、OpenClaw は同一プロバイダーの認証プロファイルリトライを 1 回許可し、その後は待機せずに次の設定済みモデルフォールバックへ切り替えます。プロバイダーがビジーであることを示す `ModelNotReadyException` などのシグナルは、この過負荷バケットに入ります。これは `auth.cooldowns.overloadedProfileRotations`、`auth.cooldowns.overloadedBackoffMs`、`auth.cooldowns.rateLimitedProfileRotations` で調整します。

実行が、設定済みのデフォルトプライマリ、Cron ジョブのプライマリ、明示的なフォールバックを持つエージェントプライマリ、または自動選択されたフォールバックオーバーライドから開始すると、OpenClaw は対応する設定済みフォールバックチェーンをたどることができます。明示的なフォールバックのないエージェントプライマリと、明示的なユーザー選択（たとえば `/model ollama/qwen3.5:27b`、モデルピッカー、`sessions.patch`、または一回限りの CLI プロバイダー/モデルオーバーライド）は厳密です。そのプロバイダー/モデルに到達できないか、返信を生成する前に失敗した場合、OpenClaw は無関係なフォールバックから回答せず、その失敗を報告します。

### 候補チェーンのルール

OpenClaw は、現在要求されている `provider/model` と設定済みフォールバックから候補リストを構築します。

<AccordionGroup>
  <Accordion title="ルール">
    - 要求されたモデルが常に最初です。
    - 明示的に設定されたフォールバックは重複排除されますが、モデル許可リストではフィルタリングされません。明示的なオペレーターの意図として扱われます。
    - 現在の実行が同じプロバイダーファミリー内の設定済みフォールバック上にすでにある場合、OpenClaw は設定済みチェーン全体を使い続けます。
    - 明示的なフォールバックオーバーライドが指定されていない場合、要求されたモデルが別のプロバイダーを使用していても、設定済みプライマリより前に設定済みフォールバックが試行されます。
    - フォールバックランナーに明示的なフォールバックオーバーライドが指定されていない場合、設定済みプライマリが末尾に追加されるため、先行候補を使い切った後にチェーンを通常のデフォルトへ戻すことができます。
    - 呼び出し元が `fallbacksOverride` を指定した場合、ランナーは要求されたモデルとそのオーバーライドリストだけを使用します。空リストはモデルフォールバックを無効にし、設定済みプライマリが隠れたリトライ対象として追加されるのを防ぎます。

  </Accordion>
</AccordionGroup>

### フォールバックを進めるエラー

<Tabs>
  <Tab title="継続する場合">
    - 認証失敗
    - レート制限とクールダウンの枯渇
    - 過負荷/プロバイダービジーのエラー
    - タイムアウト型のフェイルオーバーエラー
    - 課金無効化
    - `LiveSessionModelSwitchError`。これは古い永続化モデルによって外側のリトライループが生じないよう、フェイルオーバーパスに正規化されます
    - 残り候補がまだある場合のその他の未認識エラー

  </Tab>
  <Tab title="継続しない場合">
    - タイムアウト/フェイルオーバー型ではない明示的な中止
    - Compaction/リトライロジック内に留まるべきコンテキストオーバーフローエラー（たとえば `request_too_large`、`INVALID_ARGUMENT: input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`The input is too long for the model`、または `ollama error: context length exceeded`）
    - 残り候補がない場合の最終的な不明エラー

  </Tab>
</Tabs>

### クールダウンのスキップとプローブ動作

プロバイダーのすべての認証プロファイルがすでにクールダウン中の場合、OpenClaw はそのプロバイダーを永久に自動スキップするわけではありません。候補ごとに判断します。

<AccordionGroup>
  <Accordion title="候補ごとの判断">
    - 永続的な認証失敗では、プロバイダー全体を即座にスキップします。
    - 課金無効化では通常スキップしますが、再起動なしで復旧できるよう、プライマリ候補はスロットル付きで引き続きプローブできます。
    - プライマリ候補は、プロバイダーごとのスロットルのもとで、クールダウン期限の近くにプローブされることがあります。
    - 同一プロバイダーのフォールバック兄弟候補は、失敗が一時的に見える場合（`rate_limit`、`overloaded`、または不明）、クールダウン中でも試行できます。これは、レート制限がモデルスコープで、兄弟モデルならすぐに復旧できる可能性がある場合に特に重要です。
    - 一時的なクールダウンプローブは、1 回のフォールバック実行につきプロバイダーごとに 1 回に制限されるため、単一のプロバイダーがプロバイダー横断のフォールバックを停滞させることはありません。

  </Accordion>
</AccordionGroup>

## セッションオーバーライドとライブモデル切り替え

セッションのモデル変更は共有状態です。アクティブなランナー、`/model` コマンド、Compaction/セッション更新、ライブセッションの照合はすべて、同じセッションエントリの一部を読み書きします。

つまり、フォールバックリトライはライブモデル切り替えと協調する必要があります。

- 明示的なユーザー駆動のモデル変更だけが、保留中のライブ切り替えをマークします。これには `/model`、`session_status(model=...)`、`sessions.patch` が含まれます。
- フォールバックローテーション、Heartbeat オーバーライド、Compaction などのシステム駆動のモデル変更は、それだけで保留中のライブ切り替えをマークすることはありません。
- ユーザー駆動のモデルオーバーライドはフォールバックポリシー上の正確な選択として扱われるため、選択されたプロバイダーに到達できない場合、`agents.defaults.model.fallbacks` によって覆い隠されるのではなく失敗として表面化します。
- フォールバックリトライが開始する前に、返信ランナーは選択されたフォールバックオーバーライドフィールドをセッションエントリに永続化します。
- 自動フォールバックオーバーライドは後続ターンでも選択されたままになるため、OpenClaw はメッセージごとに既知の不良プライマリをプローブしません。`/new`、`/reset`、`sessions.reset` は自動由来のオーバーライドをクリアし、セッションを設定済みデフォルトに戻します。
- `/status` は選択されたモデルを表示し、フォールバック状態が異なる場合はアクティブなフォールバックモデルと理由も表示します。
- ライブセッションの照合では、古いランタイムモデルフィールドよりも永続化されたセッションオーバーライドを優先します。
- ライブ切り替えエラーがアクティブなフォールバックチェーン内の後続候補を指している場合、OpenClaw は無関係な候補を先にたどらず、その選択されたモデルへ直接ジャンプします。
- フォールバック試行が失敗した場合、ランナーは自分が書き込んだオーバーライドフィールドだけをロールバックし、しかもそれらがその失敗候補とまだ一致している場合に限ります。

これにより、典型的な競合を防ぎます。

<Steps>
  <Step title="プライマリが失敗">
    選択されたプライマリモデルが失敗します。
  </Step>
  <Step title="メモリ内でフォールバックを選択">
    フォールバック候補がメモリ内で選択されます。
  </Step>
  <Step title="セッションストアはまだ古いプライマリを示す">
    セッションストアはまだ古いプライマリを反映しています。
  </Step>
  <Step title="ライブ照合が古い状態を読む">
    ライブセッションの照合が古いセッション状態を読み取ります。
  </Step>
  <Step title="リトライが引き戻される">
    フォールバック試行が開始する前に、リトライが古いモデルへ引き戻されます。
  </Step>
</Steps>

永続化されたフォールバックオーバーライドはこの隙間を閉じ、狭いロールバックにより、新しい手動またはランタイムのセッション変更をそのまま保ちます。

## 可観測性と失敗サマリー

`runWithModelFallback(...)` は、ログとユーザー向けクールダウンメッセージに渡される試行ごとの詳細を記録します。

- 試行されたプロバイダー/モデル
- 理由（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found`、および同様のフェイルオーバー理由）
- 任意のステータス/コード
- 人間が読めるエラーサマリー

構造化された `model_fallback_decision` ログには、候補が失敗、スキップ、または後続のフォールバックが成功した場合に、フラットな `fallbackStep*` フィールドも含まれます。これらのフィールドは試行された遷移（`fallbackStepFromModel`、`fallbackStepToModel`、`fallbackStepFromFailureReason`、`fallbackStepFromFailureDetail`、`fallbackStepFinalOutcome`）を明示するため、最終フォールバックも失敗した場合でも、ログおよび診断エクスポーターはプライマリ失敗を再構成できます。

すべての候補が失敗すると、OpenClaw は `FallbackSummaryError` をスローします。外側の返信ランナーはそれを使って「すべてのモデルが一時的にレート制限されています」のようなより具体的なメッセージを組み立て、判明している場合は最も早いクールダウン期限を含めることができます。

そのクールダウンサマリーはモデルを考慮します。

- 試行されたプロバイダー/モデルチェーンに関係しないモデルスコープのレート制限は無視されます
- 残っているブロックが一致するモデルスコープのレート制限である場合、OpenClaw はそのモデルをまだブロックしている最後の一致期限を報告します

## 関連設定

以下については [Gateway 構成](/ja-JP/gateway/configuration) を参照してください。

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` のルーティング

より広範なモデル選択とフォールバックの概要については、[モデル](/ja-JP/concepts/models) を参照してください。

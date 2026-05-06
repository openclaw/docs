---
read_when:
    - 認証プロファイルのローテーション、クールダウン、またはモデルのフォールバック動作の診断
    - 認証プロファイルまたはモデルのフェイルオーバールールの更新
    - セッションのモデルオーバーライドとフォールバック再試行の相互作用を理解する
sidebarTitle: Model failover
summary: OpenClaw が認証プロファイルをローテーションし、モデル間でフォールバックする仕組み
title: モデルのフェイルオーバー
x-i18n:
    generated_at: "2026-05-06T05:01:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9a77ec2bd4a959db5a56e53b002b8bc5ea9a2efe3c914da61ac8d25de41d6c1
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw は失敗を 2 段階で処理します。

1. 現在のプロバイダー内での **認証プロファイルのローテーション**。
2. `agents.defaults.model.fallbacks` 内の次のモデルへの **モデルフォールバック**。

このドキュメントでは、ランタイムルールと、それを支えるデータについて説明します。

## ランタイムフロー

通常のテキスト実行では、OpenClaw は次の順序で候補を評価します。

<Steps>
  <Step title="セッション状態を解決">
    アクティブなセッションモデルと認証プロファイル設定を解決します。
  </Step>
  <Step title="候補チェーンを構築">
    現在のモデル選択と、その選択元に対するフォールバックポリシーから、モデル候補チェーンを構築します。構成済みデフォルト、cron ジョブのプライマリ、自動選択されたフォールバックモデルは、構成済みフォールバックを使用できます。明示的なユーザーセッション選択は厳密です。
  </Step>
  <Step title="現在のプロバイダーを試行">
    認証プロファイルのローテーション/クールダウンルールを使って現在のプロバイダーを試行します。
  </Step>
  <Step title="フェイルオーバー対象エラーで進む">
    そのプロバイダーがフェイルオーバー対象エラーで使い尽くされた場合、次のモデル候補へ移動します。
  </Step>
  <Step title="フォールバック上書きを永続化">
    再試行が始まる前に、選択されたフォールバック上書きを永続化します。これにより、他のセッション読み取り側は、ランナーがこれから使用するものと同じプロバイダー/モデルを確認できます。永続化されたモデル上書きには `modelOverrideSource: "auto"` が付けられます。
  </Step>
  <Step title="失敗時に狭くロールバック">
    フォールバック候補が失敗した場合、それらがまだその失敗した候補と一致しているときだけ、フォールバックが所有するセッション上書きフィールドをロールバックします。
  </Step>
  <Step title="使い尽くしたら FallbackSummaryError をスロー">
    すべての候補が失敗した場合、試行ごとの詳細と、判明している場合は最も早いクールダウン期限を含む `FallbackSummaryError` をスローします。
  </Step>
</Steps>

これは意図的に「セッション全体を保存して復元する」よりも狭い範囲です。返信ランナーは、フォールバックのために自分が所有するモデル選択フィールドだけを永続化します。

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

これにより、失敗したフォールバック再試行が、試行中に発生した手動の `/model` 変更やセッションローテーション更新など、より新しい無関係なセッション変更を上書きすることを防ぎます。

## 選択元ポリシー

OpenClaw は、選択されたプロバイダー/モデルと、それが選択された理由を分離します。その選択元によって、フォールバックチェーンが許可されるかどうかが決まります。

- **構成済みデフォルト**: `agents.defaults.model.primary` は `agents.defaults.model.fallbacks` を使用します。
- **エージェントプライマリ**: `agents.list[].model` は、そのエージェントモデルオブジェクトが独自の `fallbacks` を含まない限り厳密です。厳密な動作を明示するには `fallbacks: []` を使用し、そのエージェントでモデルフォールバックを有効にするには空でないリストを指定します。
- **自動フォールバック上書き**: ランタイムフォールバックは、再試行前に `providerOverride`、`modelOverride`、`modelOverrideSource: "auto"` を書き込みます。その自動上書きは、構成済みフォールバックチェーンを引き続き進むことができ、`/new`、`/reset`、`sessions.reset` によってクリアされます。
- **ユーザーセッション上書き**: `/model`、モデルピッカー、`session_status(model=...)`、`sessions.patch` は `modelOverrideSource: "user"` を書き込みます。これは正確なセッション選択です。選択されたプロバイダー/モデルが返信を生成する前に失敗した場合、OpenClaw は無関係な構成済みフォールバックから回答するのではなく、その失敗を報告します。
- **レガシーセッション上書き**: 古いセッションエントリには、`modelOverrideSource` なしで `modelOverride` が含まれている場合があります。OpenClaw はこれらをユーザー上書きとして扱うため、古い明示的な選択が暗黙にフォールバック動作へ変換されることはありません。
- **Cron ペイロードモデル**: cron ジョブの `payload.model` / `--model` はジョブプライマリであり、ユーザーセッション上書きではありません。ジョブが `payload.fallbacks` を指定しない限り、構成済みフォールバックを使用します。`payload.fallbacks: []` は cron 実行を厳密にします。

## 認証ストレージ（キー + OAuth）

OpenClaw は API キーと OAuth トークンの両方に **認証プロファイル** を使用します。

- シークレットは `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` に保存されます（レガシー: `~/.openclaw/agent/auth-profiles.json`）。
- ランタイムの認証ルーティング状態は `~/.openclaw/agents/<agentId>/agent/auth-state.json` に保存されます。
- 構成の `auth.profiles` / `auth.order` は **メタデータ + ルーティングのみ** です（シークレットは含みません）。
- レガシーのインポート専用 OAuth ファイル: `~/.openclaw/credentials/oauth.json`（初回使用時に `auth-profiles.json` へインポートされます）。

詳細: [OAuth](/ja-JP/concepts/oauth)

資格情報タイプ:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（一部のプロバイダーでは `projectId`/`enterpriseUrl` も含む）

## プロファイル ID

OAuth ログインでは、複数のアカウントが共存できるように個別のプロファイルが作成されます。

- デフォルト: メールアドレスが利用できない場合は `provider:default`。
- メールアドレス付き OAuth: `provider:<email>`（例: `google-antigravity:user@gmail.com`）。

プロファイルは `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` の `profiles` 配下に保存されます。

## ローテーション順序

プロバイダーに複数のプロファイルがある場合、OpenClaw は次のような順序を選択します。

<Steps>
  <Step title="明示的な構成">
    `auth.order[provider]`（設定されている場合）。
  </Step>
  <Step title="構成済みプロファイル">
    プロバイダーでフィルターされた `auth.profiles`。
  </Step>
  <Step title="保存済みプロファイル">
    そのプロバイダーの `auth-profiles.json` 内のエントリ。
  </Step>
</Steps>

明示的な順序が構成されていない場合、OpenClaw はラウンドロビン順序を使用します。

- **プライマリキー:** プロファイルタイプ（**API キーより OAuth が先**）。
- **セカンダリキー:** `usageStats.lastUsed`（各タイプ内で古い順）。
- **クールダウン中/無効化されたプロファイル** は末尾に移動され、最も早い期限順に並べられます。

### セッションの固定性（キャッシュに優しい）

OpenClaw は、プロバイダーキャッシュを温かく保つために、**選択された認証プロファイルをセッションごとに固定**します。リクエストごとにはローテーション**しません**。固定されたプロファイルは、次のいずれかが発生するまで再利用されます。

- セッションがリセットされる（`/new` / `/reset`）
- Compaction が完了する（compaction カウントが増える）
- プロファイルがクールダウン中/無効化されている

`/model …@<profileId>` による手動選択は、そのセッションに **ユーザー上書き** を設定し、新しいセッションが開始されるまで自動ローテーションされません。

<Note>
自動固定プロファイル（セッションルーターによって選択されたもの）は **設定** として扱われます。最初に試行されますが、レート制限/タイムアウト時には OpenClaw が別のプロファイルへローテーションする場合があります。ユーザー固定プロファイルはそのプロファイルにロックされたままです。失敗してモデルフォールバックが構成されている場合、OpenClaw はプロファイルを切り替えるのではなく、次のモデルへ移動します。
</Note>

### OAuth が「失われたように見える」理由

同じプロバイダーに OAuth プロファイルと API キープロファイルの両方がある場合、固定されていない限り、ラウンドロビンによってメッセージ間でそれらが切り替わることがあります。単一のプロファイルを強制するには:

- `auth.order[provider] = ["provider:profileId"]` で固定する、または
- `/model …` とプロファイル上書きを使って、セッションごとの上書きを使用する（使用している UI/チャットサーフェスでサポートされている場合）。

## クールダウン

プロファイルが認証/レート制限エラー（またはレート制限のように見えるタイムアウト）で失敗した場合、OpenClaw はそれをクールダウン中としてマークし、次のプロファイルへ移動します。

<AccordionGroup>
  <Accordion title="レート制限 / タイムアウトのバケットに入るもの">
    そのレート制限バケットは単純な `429` より広く、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted`、`weekly/monthly limit reached` などの定期的な使用量ウィンドウ制限といったプロバイダーメッセージも含みます。

    形式/無効リクエストエラー（たとえば Cloud Code Assist のツール呼び出し ID 検証失敗）は、フェイルオーバー対象として扱われ、同じクールダウンを使用します。`Unhandled stop reason: error`、`stop reason: error`、`reason: error` などの OpenAI 互換停止理由エラーは、タイムアウト/フェイルオーバーシグナルとして分類されます。

    汎用的なサーバーテキストも、ソースが既知の一時的パターンに一致する場合、そのタイムアウトバケットに入ることがあります。たとえば、裸の pi-ai ストリームラッパーメッセージ `An unknown error occurred` は、pi-ai がプロバイダーストリームを具体的な詳細なしに `stopReason: "aborted"` または `stopReason: "error"` で終了したときに出力するため、すべてのプロバイダーでフェイルオーバー対象として扱われます。`internal server error`、`unknown error, 520`、`upstream error`、`backend error` などの一時的なサーバーテキストを含む JSON `api_error` ペイロードも、フェイルオーバー対象のタイムアウトとして扱われます。

    裸の `Provider returned error` などの OpenRouter 固有の汎用アップストリームテキストは、プロバイダーコンテキストが実際に OpenRouter の場合にのみタイムアウトとして扱われます。`LLM request failed with an unknown error.` のような汎用的な内部フォールバックテキストは保守的に扱われ、それ単体ではフェイルオーバーをトリガーしません。

  </Accordion>
  <Accordion title="SDK retry-after 上限">
    一部のプロバイダー SDK は、OpenClaw に制御を返す前に長い `Retry-After` ウィンドウの間スリープする場合があります。Anthropic や OpenAI などの Stainless ベース SDK では、OpenClaw は SDK 内部の `retry-after-ms` / `retry-after` 待機をデフォルトで 60 秒に制限し、より長い再試行可能レスポンスを即座に表面化させることで、このフェイルオーバーパスを実行できるようにします。上限の調整または無効化には `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` を使用します。[Retry behavior](/ja-JP/concepts/retry) を参照してください。
  </Accordion>
  <Accordion title="モデルスコープのクールダウン">
    レート制限クールダウンはモデルスコープにもできます。

    - 失敗したモデル ID が判明している場合、OpenClaw はレート制限失敗について `cooldownModel` を記録します。
    - 同じプロバイダー上の兄弟モデルは、クールダウンが別のモデルにスコープされている場合、引き続き試行できます。
    - 請求/無効化ウィンドウは、モデルをまたいでプロファイル全体を引き続きブロックします。

  </Accordion>
</AccordionGroup>

クールダウンは指数バックオフを使用します。

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

## 請求による無効化

請求/クレジット失敗（たとえば "insufficient credits" / "credit balance too low"）はフェイルオーバー対象として扱われますが、通常は一時的ではありません。短いクールダウンの代わりに、OpenClaw はそのプロファイルを **無効化**（より長いバックオフ付き）としてマークし、次のプロファイル/プロバイダーへローテーションします。

<Note>
請求の形をしたすべてのレスポンスが `402` であるとは限らず、すべての HTTP `402` がここに入るわけでもありません。OpenClaw は、プロバイダーが代わりに `401` や `403` を返した場合でも、明示的な請求テキストを請求レーンに保持します。ただし、プロバイダー固有のマッチャーは、それを所有するプロバイダーにスコープされたままです（たとえば OpenRouter の `403 Key limit exceeded`）。

一方、一時的な `402` の使用量ウィンドウおよび組織/ワークスペースの支出制限エラーは、メッセージが再試行可能に見える場合（たとえば `weekly usage limit exhausted`、`daily limit reached, resets tomorrow`、`organization spending limit exceeded`）、`rate_limit` として分類されます。これらは長い請求無効化パスではなく、短いクールダウン/フェイルオーバーパスに残ります。
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

- 請求バックオフは **5 時間** から開始し、請求失敗ごとに倍増し、**24 時間** で上限に達します。
- プロファイルが **24 時間** 失敗していない場合、バックオフカウンターはリセットされます（構成可能）。
- 過負荷リトライでは、モデルフォールバック前に **同一プロバイダー内で 1 回のプロファイルローテーション** を許可します。
- 過負荷リトライはデフォルトで **0 ms バックオフ** を使用します。

## モデルフォールバック

プロバイダーのすべてのプロファイルが失敗した場合、OpenClaw は `agents.defaults.model.fallbacks` 内の次のモデルへ移動します。これは、プロファイルローテーションを使い尽くした認証失敗、レート制限、タイムアウトに適用されます（その他のエラーではフォールバックは進みません）。十分な詳細を公開しないプロバイダーエラーも、フォールバック状態では正確にラベル付けされます。`empty_response` はプロバイダーが使用可能なメッセージまたはステータスを返さなかったこと、`no_error_details` はプロバイダーが明示的に `Unknown error (no error details in response)` を返したこと、`unclassified` は OpenClaw が生のプレビューを保持したものの、まだ分類器が一致していないことを意味します。

過負荷エラーとレート制限エラーは、課金クールダウンよりも積極的に処理されます。デフォルトでは、OpenClaw は同一プロバイダーの認証プロファイルで1回だけ再試行し、その後は待機せずに次に設定されたモデルフォールバックへ切り替えます。`ModelNotReadyException` のようなプロバイダー混雑シグナルは、この過負荷カテゴリに入ります。これは `auth.cooldowns.overloadedProfileRotations`、`auth.cooldowns.overloadedBackoffMs`、`auth.cooldowns.rateLimitedProfileRotations` で調整できます。

実行が設定済みのデフォルトプライマリ、Cron ジョブのプライマリ、明示的なフォールバックを持つエージェントプライマリ、または自動選択されたフォールバックオーバーライドから開始される場合、OpenClaw は対応する設定済みフォールバックチェーンをたどることができます。明示的なフォールバックを持たないエージェントプライマリと、明示的なユーザー選択（たとえば `/model ollama/qwen3.5:27b`、モデルピッカー、`sessions.patch`、または単発の CLI プロバイダー/モデルオーバーライド）は厳格です。そのプロバイダー/モデルに到達できないか、返信を生成する前に失敗した場合、OpenClaw は無関係なフォールバックから回答するのではなく、その失敗を報告します。

### 候補チェーンのルール

OpenClaw は、現在リクエストされている `provider/model` と設定済みフォールバックから候補リストを構築します。

<AccordionGroup>
  <Accordion title="ルール">
    - リクエストされたモデルは常に最初です。
    - 明示的に設定されたフォールバックは重複排除されますが、モデル許可リストではフィルターされません。これは明示的な運用者の意図として扱われます。
    - 現在の実行が同じプロバイダーファミリー内の設定済みフォールバック上にすでにある場合、OpenClaw は設定済みチェーン全体を使い続けます。
    - 現在の実行が設定とは異なるプロバイダー上にあり、その現在のモデルが設定済みフォールバックチェーンにまだ含まれていない場合、OpenClaw は別プロバイダーの無関係な設定済みフォールバックを追加しません。
    - フォールバックランナーに明示的なフォールバックオーバーライドが指定されていない場合、設定済みプライマリは末尾に追加されます。これにより、より前の候補が使い果たされた後、チェーンは通常のデフォルトへ戻って安定できます。
    - 呼び出し元が `fallbacksOverride` を指定した場合、ランナーはリクエストされたモデルとそのオーバーライドリストだけを使用します。空のリストはモデルフォールバックを無効にし、設定済みプライマリが隠れた再試行先として追加されることを防ぎます。

  </Accordion>
</AccordionGroup>

### フォールバックを進めるエラー

<Tabs>
  <Tab title="継続する場合">
    - 認証失敗
    - レート制限とクールダウンの枯渇
    - 過負荷/プロバイダー混雑エラー
    - タイムアウト型のフェイルオーバーエラー
    - 課金による無効化
    - `LiveSessionModelSwitchError`。これはフェイルオーバーパスに正規化され、古い永続化モデルが外側の再試行ループを作らないようにします
    - 候補がまだ残っている場合のその他の認識されないエラー

  </Tab>
  <Tab title="継続しない場合">
    - タイムアウト/フェイルオーバー型ではない明示的な中断
    - Compaction/再試行ロジック内に留まるべきコンテキスト超過エラー（たとえば `request_too_large`、`INVALID_ARGUMENT: input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`The input is too long for the model`、または `ollama error: context length exceeded`）
    - 候補が残っていない場合の最終的な不明エラー

  </Tab>
</Tabs>

### クールダウンのスキップとプローブ動作

あるプロバイダーのすべての認証プロファイルがすでにクールダウン中の場合でも、OpenClaw はそのプロバイダーを自動的に永久スキップするわけではありません。候補ごとに判断します。

<AccordionGroup>
  <Accordion title="候補ごとの判断">
    - 永続的な認証失敗は、プロバイダー全体を即座にスキップします。
    - 課金による無効化は通常スキップしますが、プライマリ候補はスロットル下でプローブされる場合があり、再起動なしで復旧できる可能性があります。
    - プライマリ候補は、クールダウン期限の近くで、プロバイダーごとのスロットルに従ってプローブされる場合があります。
    - 失敗が一時的（`rate_limit`、`overloaded`、または不明）に見える場合、同一プロバイダーの兄弟フォールバックはクールダウン中でも試行できます。これは、レート制限がモデルスコープで、兄弟モデルがすぐに回復できる可能性がある場合に特に重要です。
    - 一時的なクールダウンプローブは、単一のプロバイダーがプロバイダー横断フォールバックを停滞させないよう、フォールバック実行ごとにプロバイダーあたり1回に制限されます。

  </Accordion>
</AccordionGroup>

## セッションオーバーライドとライブモデル切り替え

セッションモデルの変更は共有状態です。アクティブなランナー、`/model` コマンド、Compaction/セッション更新、ライブセッション調整はすべて、同じセッションエントリーの一部を読み書きします。

つまり、フォールバック再試行はライブモデル切り替えと連携する必要があります。

- 明示的なユーザー主導のモデル変更だけが、保留中のライブ切り替えをマークします。これには `/model`、`session_status(model=...)`、`sessions.patch` が含まれます。
- フォールバックローテーション、Heartbeat オーバーライド、Compaction などのシステム主導のモデル変更は、それ自体では保留中のライブ切り替えをマークしません。
- ユーザー主導のモデルオーバーライドは、フォールバックポリシー上は厳密な選択として扱われます。そのため、選択されたプロバイダーに到達できない場合は、`agents.defaults.model.fallbacks` によって隠されるのではなく、失敗として表面化します。
- フォールバック再試行が開始される前に、返信ランナーは選択されたフォールバックオーバーライドフィールドをセッションエントリーに永続化します。
- 自動フォールバックオーバーライドは後続のターンでも選択されたままになるため、OpenClaw はすべてのメッセージで既知の不良プライマリをプローブしません。`/new`、`/reset`、`sessions.reset` は自動由来のオーバーライドをクリアし、セッションを設定済みデフォルトに戻します。
- `/status` は選択されたモデルを表示し、フォールバック状態が異なる場合はアクティブなフォールバックモデルと理由も表示します。
- ライブセッション調整では、古いランタイムモデルフィールドよりも永続化されたセッションオーバーライドが優先されます。
- ライブ切り替えエラーがアクティブなフォールバックチェーン内の後続候補を指している場合、OpenClaw は無関係な候補を先にたどるのではなく、その選択されたモデルへ直接ジャンプします。
- フォールバック試行が失敗した場合、ランナーは自分が書き込んだオーバーライドフィールドだけをロールバックし、それらがまだその失敗候補と一致している場合に限ります。

これにより、典型的な競合を防ぎます。

<Steps>
  <Step title="プライマリが失敗する">
    選択されたプライマリモデルが失敗します。
  </Step>
  <Step title="フォールバックがメモリ内で選ばれる">
    フォールバック候補がメモリ内で選ばれます。
  </Step>
  <Step title="セッションストアはまだ古いプライマリを示している">
    セッションストアはまだ古いプライマリを反映しています。
  </Step>
  <Step title="ライブ調整が古い状態を読む">
    ライブセッション調整が古いセッション状態を読みます。
  </Step>
  <Step title="再試行が元に戻される">
    フォールバック試行が開始される前に、再試行が古いモデルへ戻されます。
  </Step>
</Steps>

永続化されたフォールバックオーバーライドはこの隙間を閉じ、狭い範囲のロールバックは新しい手動またはランタイムのセッション変更をそのまま保ちます。

## 観測性と失敗サマリー

`runWithModelFallback(...)` は、ログとユーザー向けクールダウンメッセージに使われる試行ごとの詳細を記録します。

- 試行されたプロバイダー/モデル
- 理由（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found`、および同様のフェイルオーバー理由）
- 任意のステータス/コード
- 人間が読めるエラーサマリー

構造化された `model_fallback_decision` ログには、候補が失敗、スキップ、または後続フォールバックで成功した場合に、フラットな `fallbackStep*` フィールドも含まれます。これらのフィールドは試行された遷移を明示するため（`fallbackStepFromModel`、`fallbackStepToModel`、`fallbackStepFromFailureReason`、`fallbackStepFromFailureDetail`、`fallbackStepFinalOutcome`）、ログおよび診断エクスポーターは、最終フォールバックも失敗した場合でもプライマリ失敗を再構築できます。

すべての候補が失敗すると、OpenClaw は `FallbackSummaryError` をスローします。外側の返信ランナーはこれを使って、「すべてのモデルが一時的にレート制限されています」のようなより具体的なメッセージを作成し、既知の場合は最も早いクールダウン期限を含めることができます。

そのクールダウンサマリーはモデルを考慮します。

- 試行されたプロバイダー/モデルチェーンに無関係なモデルスコープのレート制限は無視されます
- 残っているブロックが一致するモデルスコープのレート制限である場合、OpenClaw はそのモデルをまだブロックしている最後の一致期限を報告します

## 関連設定

以下については [Gateway 設定](/ja-JP/gateway/configuration) を参照してください。

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` ルーティング

より広範なモデル選択とフォールバックの概要については [モデル](/ja-JP/concepts/models) を参照してください。

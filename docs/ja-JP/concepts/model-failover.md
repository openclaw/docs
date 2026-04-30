---
read_when:
    - 認証プロファイルのローテーション、クールダウン、またはモデルフォールバック動作の診断
    - 認証プロファイルまたはモデルのフェイルオーバールールの更新
    - セッションモデルのオーバーライドがフォールバック再試行とどのように相互作用するかを理解する
sidebarTitle: Model failover
summary: OpenClaw が認証プロファイルをローテーションし、モデル間でフォールバックする仕組み
title: モデルのフェイルオーバー
x-i18n:
    generated_at: "2026-04-30T05:08:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: af8c343186105256cb2e1a65cdfc3e0042ce8d3d14d21cd007d90174e35b98e7
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw は失敗を2段階で処理します。

1. 現在のプロバイダー内での**認証プロファイルのローテーション**。
2. `agents.defaults.model.fallbacks` 内の次のモデルへの**モデルフォールバック**。

このドキュメントでは、ランタイムのルールと、それを支えるデータについて説明します。

## ランタイムフロー

通常のテキスト実行では、OpenClaw は次の順序で候補を評価します。

<Steps>
  <Step title="セッション状態を解決する">
    アクティブなセッションモデルと認証プロファイル設定を解決します。
  </Step>
  <Step title="候補チェーンを構築する">
    現在のモデル選択と、その選択元に対するフォールバックポリシーから、モデル候補チェーンを構築します。設定済みのデフォルト、Cron ジョブのプライマリ、自動選択されたフォールバックモデルは、設定済みのフォールバックを使用できます。明示的なユーザーセッション選択は厳密です。
  </Step>
  <Step title="現在のプロバイダーを試す">
    認証プロファイルのローテーション/クールダウンルールに従って、現在のプロバイダーを試します。
  </Step>
  <Step title="フェイルオーバー対象のエラーで進む">
    そのプロバイダーがフェイルオーバー対象のエラーで使い切られた場合、次のモデル候補へ移動します。
  </Step>
  <Step title="フォールバック上書きを永続化する">
    再試行が始まる前に、選択されたフォールバック上書きを永続化します。これにより、他のセッション読み取り側は、ランナーがまさに使用しようとしている同じプロバイダー/モデルを確認できます。永続化されたモデル上書きには `modelOverrideSource: "auto"` が設定されます。
  </Step>
  <Step title="失敗時に限定的にロールバックする">
    フォールバック候補が失敗した場合、その失敗した候補とまだ一致しているときに限り、フォールバックが所有するセッション上書きフィールドだけをロールバックします。
  </Step>
  <Step title="使い切った場合は FallbackSummaryError を投げる">
    すべての候補が失敗した場合、試行ごとの詳細と、分かっている場合は最短のクールダウン期限を含む `FallbackSummaryError` を投げます。
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

OpenClaw は、選択されたプロバイダー/モデルと、それが選択された理由を分離します。その選択元によって、フォールバックチェーンが許可されるかどうかが制御されます。

- **設定済みデフォルト**: `agents.defaults.model.primary` は `agents.defaults.model.fallbacks` を使用します。
- **エージェントプライマリ**: `agents.list[].model` は、そのエージェントのモデルオブジェクトが独自の `fallbacks` を含まない限り厳密です。厳密な動作を明示するには `fallbacks: []` を使用し、そのエージェントでモデルフォールバックを有効にするには空でないリストを指定します。
- **自動フォールバック上書き**: ランタイムフォールバックは、再試行前に `providerOverride`、`modelOverride`、`modelOverrideSource: "auto"` を書き込みます。その自動上書きは設定済みフォールバックチェーンを進み続けることができ、`/new`、`/reset`、`sessions.reset` によってクリアされます。
- **ユーザーセッション上書き**: `/model`、モデルピッカー、`session_status(model=...)`、`sessions.patch` は `modelOverrideSource: "user"` を書き込みます。これは正確なセッション選択です。選択されたプロバイダー/モデルが返信を生成する前に失敗した場合、OpenClaw は無関係な設定済みフォールバックで回答するのではなく、その失敗を報告します。
- **レガシーセッション上書き**: 古いセッションエントリには、`modelOverrideSource` なしで `modelOverride` が含まれている場合があります。OpenClaw は、それらをユーザー上書きとして扱うため、古い明示的な選択が暗黙にフォールバック動作へ変換されることはありません。
- **Cron ペイロードモデル**: Cron ジョブの `payload.model` / `--model` はジョブプライマリであり、ユーザーセッション上書きではありません。ジョブが `payload.fallbacks` を提供しない限り、設定済みフォールバックを使用します。`payload.fallbacks: []` は Cron 実行を厳密にします。

## 認証ストレージ（キー + OAuth）

OpenClaw は、API キーと OAuth トークンの両方に**認証プロファイル**を使用します。

- シークレットは `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` に保存されます（レガシー: `~/.openclaw/agent/auth-profiles.json`）。
- ランタイムの認証ルーティング状態は `~/.openclaw/agents/<agentId>/agent/auth-state.json` に保存されます。
- 設定の `auth.profiles` / `auth.order` は**メタデータ + ルーティングのみ**です（シークレットは含まれません）。
- レガシーのインポート専用 OAuth ファイル: `~/.openclaw/credentials/oauth.json`（初回使用時に `auth-profiles.json` にインポートされます）。

詳細: [OAuth](/ja-JP/concepts/oauth)

認証情報の種類:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（一部のプロバイダーでは `projectId`/`enterpriseUrl` も含む）

## プロファイル ID

OAuth ログインは、複数のアカウントが共存できるように個別のプロファイルを作成します。

- デフォルト: メールアドレスが利用できない場合は `provider:default`。
- メールアドレス付き OAuth: `provider:<email>`（例: `google-antigravity:user@gmail.com`）。

プロファイルは `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` の `profiles` 配下に保存されます。

## ローテーション順序

プロバイダーに複数のプロファイルがある場合、OpenClaw は次のような順序を選択します。

<Steps>
  <Step title="明示的な設定">
    `auth.order[provider]`（設定されている場合）。
  </Step>
  <Step title="設定済みプロファイル">
    プロバイダーでフィルターされた `auth.profiles`。
  </Step>
  <Step title="保存済みプロファイル">
    そのプロバイダーの `auth-profiles.json` 内のエントリ。
  </Step>
</Steps>

明示的な順序が設定されていない場合、OpenClaw はラウンドロビン順序を使用します。

- **プライマリキー:** プロファイルの種類（**API キーより OAuth が先**）。
- **セカンダリキー:** `usageStats.lastUsed`（各種類内で古いものが先）。
- **クールダウン中/無効化されたプロファイル**は末尾に移動され、期限が早い順に並びます。

### セッション固定（キャッシュに優しい）

OpenClaw は、プロバイダーのキャッシュを温かく保つために、**選択された認証プロファイルをセッションごとに固定**します。リクエストごとにはローテーション**しません**。固定されたプロファイルは次のいずれかまで再利用されます。

- セッションがリセットされる（`/new` / `/reset`）
- Compaction が完了する（Compaction カウントが増える）
- プロファイルがクールダウン中/無効化されている

`/model …@<profileId>` による手動選択は、そのセッションに対する**ユーザー上書き**を設定し、新しいセッションが開始されるまで自動ローテーションされません。

<Note>
自動固定されたプロファイル（セッションルーターによって選択されたもの）は**設定**として扱われます。最初に試されますが、レート制限/タイムアウト時に OpenClaw が別のプロファイルへローテーションする場合があります。ユーザー固定プロファイルはそのプロファイルに固定されたままです。失敗し、モデルフォールバックが設定されている場合、OpenClaw はプロファイルを切り替えるのではなく、次のモデルへ移動します。
</Note>

### OAuth が「失われたように見える」理由

同じプロバイダーに OAuth プロファイルと API キープロファイルの両方がある場合、固定されていない限り、ラウンドロビンによってメッセージ間で切り替わることがあります。単一のプロファイルを強制するには、次のいずれかを使用します。

- `auth.order[provider] = ["provider:profileId"]` で固定する、または
- `/model …` とプロファイル上書きを使用して、セッションごとの上書きを使う（UI/チャットサーフェスでサポートされている場合）。

## クールダウン

プロファイルが認証/レート制限エラー（またはレート制限のように見えるタイムアウト）によって失敗した場合、OpenClaw はそのプロファイルをクールダウン中としてマークし、次のプロファイルへ移動します。

<AccordionGroup>
  <Accordion title="レート制限 / タイムアウトのバケットに入るもの">
    そのレート制限バケットは単純な `429` より広く、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted`、`weekly/monthly limit reached` などの定期的な使用枠制限といったプロバイダーメッセージも含まれます。

    フォーマット/無効リクエストエラー（例: Cloud Code Assist のツール呼び出し ID 検証失敗）はフェイルオーバー対象として扱われ、同じクールダウンを使用します。`Unhandled stop reason: error`、`stop reason: error`、`reason: error` などの OpenAI 互換停止理由エラーは、タイムアウト/フェイルオーバーシグナルとして分類されます。

    一般的なサーバーテキストも、ソースが既知の一時的パターンに一致する場合、そのタイムアウトバケットに入ることがあります。たとえば、素の pi-ai ストリームラッパーメッセージ `An unknown error occurred` は、すべてのプロバイダーでフェイルオーバー対象として扱われます。これは、プロバイダーストリームが具体的な詳細なしに `stopReason: "aborted"` または `stopReason: "error"` で終了したときに pi-ai がそれを出力するためです。`internal server error`、`unknown error, 520`、`upstream error`、`backend error` などの一時的なサーバーテキストを含む JSON `api_error` ペイロードも、フェイルオーバー対象のタイムアウトとして扱われます。

    素の `Provider returned error` など、OpenRouter 固有の一般的なアップストリームテキストは、プロバイダーコンテキストが実際に OpenRouter の場合に限り、タイムアウトとして扱われます。`LLM request failed with an unknown error.` などの一般的な内部フォールバックテキストは保守的に扱われ、それだけではフェイルオーバーをトリガーしません。

  </Accordion>
  <Accordion title="SDK の retry-after 上限">
    一部のプロバイダー SDK は、OpenClaw に制御を返す前に長い `Retry-After` 時間だけスリープする場合があります。Anthropic や OpenAI などの Stainless ベース SDK では、OpenClaw はデフォルトで SDK 内部の `retry-after-ms` / `retry-after` 待機を60秒に制限し、より長い再試行可能レスポンスは即座に表面化させることで、このフェイルオーバーパスを実行できるようにします。上限を調整または無効化するには `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` を使用します。[再試行の動作](/ja-JP/concepts/retry) を参照してください。
  </Accordion>
  <Accordion title="モデル単位のクールダウン">
    レート制限クールダウンはモデル単位にすることもできます。

    - OpenClaw は、失敗したモデル ID が分かっている場合、レート制限失敗について `cooldownModel` を記録します。
    - クールダウンが別のモデルにスコープされている場合、同じプロバイダー上の兄弟モデルは引き続き試すことができます。
    - 請求/無効化ウィンドウは、モデルをまたいでプロファイル全体をブロックします。

  </Accordion>
</AccordionGroup>

クールダウンには指数バックオフを使用します。

- 1分
- 5分
- 25分
- 1時間（上限）

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

請求/クレジットの失敗（例: 「insufficient credits」/「credit balance too low」）はフェイルオーバー対象として扱われますが、通常は一時的ではありません。短いクールダウンではなく、OpenClaw はそのプロファイルを**無効化**（より長いバックオフ付き）としてマークし、次のプロファイル/プロバイダーへローテーションします。

<Note>
請求に見えるレスポンスがすべて `402` とは限らず、HTTP `402` がすべてここに入るわけでもありません。OpenClaw は、プロバイダーが代わりに `401` または `403` を返した場合でも、明示的な請求テキストを請求レーンに保持しますが、プロバイダー固有のマッチャーはそれを所有するプロバイダーにスコープされたままです（例: OpenRouter `403 Key limit exceeded`）。

一方、一時的な `402` 使用枠ウィンドウや組織/ワークスペースの支出上限エラーは、メッセージが再試行可能に見える場合（例: `weekly usage limit exhausted`、`daily limit reached, resets tomorrow`、`organization spending limit exceeded`）、`rate_limit` として分類されます。それらは長い請求無効化パスではなく、短いクールダウン/フェイルオーバーパスに残ります。
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

- 請求バックオフは**5時間**から始まり、請求失敗ごとに倍増し、**24時間**で上限に達します。
- プロファイルが**24時間**失敗していない場合、バックオフカウンターはリセットされます（設定可能）。
- 過負荷時の再試行では、モデルフォールバックの前に**同一プロバイダー内で1回のプロファイルローテーション**を許可します。
- 過負荷時の再試行は、デフォルトで**0 ms バックオフ**を使用します。

## モデルフォールバック

プロバイダーのすべてのプロファイルが失敗した場合、OpenClaw は `agents.defaults.model.fallbacks` 内の次のモデルへ移動します。これは、認証失敗、レート制限、およびプロファイルローテーションを使い切ったタイムアウトに適用されます（他のエラーではフォールバックは進みません）。十分な詳細を公開しないプロバイダーエラーも、フォールバック状態では正確にラベル付けされます。`empty_response` はプロバイダーが使用可能なメッセージまたはステータスを返さなかったことを意味し、`no_error_details` はプロバイダーが明示的に `Unknown error (no error details in response)` を返したことを意味し、`unclassified` は OpenClaw が未加工のプレビューを保持したものの、まだどの分類器にも一致していないことを意味します。

過負荷およびレート制限エラーは、課金クールダウンよりも積極的に処理されます。デフォルトでは、OpenClaw は同一プロバイダーの認証プロファイル再試行を1回許可し、その後は待機せずに次に設定されたモデルフォールバックへ切り替えます。`ModelNotReadyException` などのプロバイダー混雑シグナルは、その過負荷カテゴリに分類されます。これは `auth.cooldowns.overloadedProfileRotations`、`auth.cooldowns.overloadedBackoffMs`、`auth.cooldowns.rateLimitedProfileRotations` で調整します。

実行が、設定済みのデフォルト primary、Cron ジョブの primary、明示的なフォールバックを持つエージェント primary、または自動選択されたフォールバック上書きから開始された場合、OpenClaw は一致する設定済みフォールバックチェーンをたどれます。明示的なフォールバックを持たないエージェント primary と、明示的なユーザー選択（たとえば `/model ollama/qwen3.5:27b`、モデルピッカー、`sessions.patch`、または一回限りの CLI プロバイダー/モデル上書き）は厳密です。そのプロバイダー/モデルに到達できない、または返信を生成する前に失敗した場合、OpenClaw は無関係なフォールバックで応答するのではなく、失敗を報告します。

### 候補チェーンのルール

OpenClaw は現在要求されている `provider/model` と設定済みフォールバックから候補リストを構築します。

<AccordionGroup>
  <Accordion title="ルール">
    - 要求されたモデルは常に先頭です。
    - 明示的に設定されたフォールバックは重複排除されますが、モデル許可リストではフィルタリングされません。これはオペレーターの明示的な意図として扱われます。
    - 現在の実行が同じプロバイダーファミリー内の設定済みフォールバック上にすでにある場合、OpenClaw は設定済みチェーン全体を使い続けます。
    - 現在の実行が設定とは異なるプロバイダー上にあり、その現在のモデルが設定済みフォールバックチェーンの一部ではない場合、OpenClaw は別プロバイダーの無関係な設定済みフォールバックを追加しません。
    - フォールバックランナーに明示的なフォールバック上書きが指定されていない場合、設定済み primary が末尾に追加されるため、前の候補が尽きた後にチェーンを通常のデフォルトへ戻せます。
    - 呼び出し元が `fallbacksOverride` を指定した場合、ランナーは要求されたモデルとその上書きリストだけを使用します。空のリストはモデルフォールバックを無効にし、設定済み primary が隠れた再試行先として追加されることを防ぎます。

  </Accordion>
</AccordionGroup>

### フォールバックを進めるエラー

<Tabs>
  <Tab title="継続するもの">
    - 認証失敗
    - レート制限とクールダウン枯渇
    - 過負荷/プロバイダー混雑エラー
    - タイムアウト型のフェイルオーバーエラー
    - 課金無効化
    - `LiveSessionModelSwitchError`。これはフェイルオーバーパスへ正規化されるため、古い永続化モデルが外側の再試行ループを作りません
    - 候補がまだ残っている場合の、その他の認識されないエラー

  </Tab>
  <Tab title="継続しないもの">
    - タイムアウト/フェイルオーバー型ではない明示的な中止
    - Compaction/再試行ロジックの内側に留まるべきコンテキスト超過エラー（たとえば `request_too_large`、`INVALID_ARGUMENT: input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`The input is too long for the model`、または `ollama error: context length exceeded`）
    - 候補が残っていない場合の最後の不明エラー

  </Tab>
</Tabs>

### クールダウンのスキップとプローブ動作

プロバイダーのすべての認証プロファイルがすでにクールダウン中でも、OpenClaw はそのプロバイダーを永久に自動スキップするわけではありません。候補ごとに判断します。

<AccordionGroup>
  <Accordion title="候補ごとの判断">
    - 永続的な認証失敗は、プロバイダー全体を即座にスキップします。
    - 課金無効化は通常スキップされますが、再起動なしで復旧できるように、primary 候補はスロットル付きでプローブされる場合があります。
    - primary 候補は、プロバイダーごとのスロットル付きで、クールダウン期限の近くにプローブされる場合があります。
    - 失敗が一時的（`rate_limit`、`overloaded`、または不明）に見える場合、同一プロバイダーのフォールバック兄弟は、クールダウン中でも試行される場合があります。これは、レート制限がモデルスコープで、兄弟モデルがすぐに復旧できる可能性がある場合に特に重要です。
    - 一時的なクールダウンプローブは、単一プロバイダーがプロバイダー横断のフォールバックを停滞させないように、フォールバック実行ごとにプロバイダーあたり1回に制限されます。

  </Accordion>
</AccordionGroup>

## セッション上書きとライブモデル切り替え

セッションモデルの変更は共有状態です。アクティブなランナー、`/model` コマンド、Compaction/セッション更新、ライブセッション調整はすべて、同じセッションエントリの一部を読み書きします。

そのため、フォールバック再試行はライブモデル切り替えと協調する必要があります。

- 明示的なユーザー主導のモデル変更だけが、保留中のライブ切り替えとしてマークされます。これには `/model`、`session_status(model=...)`、`sessions.patch` が含まれます。
- フォールバックローテーション、Heartbeat 上書き、Compaction などのシステム主導のモデル変更は、それ自体では保留中のライブ切り替えとしてマークされません。
- ユーザー主導のモデル上書きは、フォールバックポリシーにおける正確な選択として扱われるため、到達不能な選択済みプロバイダーは `agents.defaults.model.fallbacks` によって隠されるのではなく、失敗として表面化します。
- フォールバック再試行を開始する前に、返信ランナーは選択されたフォールバック上書きフィールドをセッションエントリへ永続化します。
- 自動フォールバック上書きは後続ターンでも選択されたままになるため、OpenClaw は既知の不良 primary をメッセージごとにプローブしません。`/new`、`/reset`、`sessions.reset` は自動由来の上書きをクリアし、セッションを設定済みデフォルトへ戻します。
- `/status` は選択されたモデルを表示し、フォールバック状態が異なる場合は、アクティブなフォールバックモデルと理由も表示します。
- ライブセッション調整は、古いランタイムモデルフィールドよりも、永続化されたセッション上書きを優先します。
- ライブ切り替えエラーがアクティブなフォールバックチェーン内の後続候補を指している場合、OpenClaw は無関係な候補を先にたどるのではなく、その選択済みモデルへ直接ジャンプします。
- フォールバック試行が失敗した場合、ランナーは自分が書き込んだ上書きフィールドだけを、かつそれらがその失敗した候補とまだ一致する場合に限ってロールバックします。

これにより、典型的な競合を防ぎます。

<Steps>
  <Step title="Primary が失敗する">
    選択された primary モデルが失敗します。
  </Step>
  <Step title="フォールバックがメモリ内で選ばれる">
    フォールバック候補がメモリ内で選ばれます。
  </Step>
  <Step title="セッションストアはまだ古い primary を示す">
    セッションストアはまだ古い primary を反映しています。
  </Step>
  <Step title="ライブ調整が古い状態を読む">
    ライブセッション調整が古いセッション状態を読みます。
  </Step>
  <Step title="再試行が巻き戻る">
    フォールバック試行が始まる前に、再試行が古いモデルへ巻き戻されます。
  </Step>
</Steps>

永続化されたフォールバック上書きがこの隙間を閉じ、範囲を絞ったロールバックが新しい手動またはランタイムのセッション変更を保持します。

## 可観測性と失敗サマリー

`runWithModelFallback(...)` は、ログとユーザー向けクールダウンメッセージに供給される試行ごとの詳細を記録します。

- 試行されたプロバイダー/モデル
- 理由（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found`、および類似のフェイルオーバー理由）
- 任意のステータス/コード
- 人間が読めるエラーサマリー

構造化された `model_fallback_decision` ログには、候補が失敗、スキップ、または後続のフォールバックが成功した場合に、フラットな `fallbackStep*` フィールドも含まれます。これらのフィールドは試行された遷移を明示するため（`fallbackStepFromModel`、`fallbackStepToModel`、`fallbackStepFromFailureReason`、`fallbackStepFromFailureDetail`、`fallbackStepFinalOutcome`）、ログおよび診断エクスポーターは、最終フォールバックも失敗した場合でも primary の失敗を再構築できます。

すべての候補が失敗すると、OpenClaw は `FallbackSummaryError` をスローします。外側の返信ランナーはこれを使用して、「すべてのモデルが一時的にレート制限されています」のような、より具体的なメッセージを作成し、既知の場合は最短のクールダウン期限を含められます。

そのクールダウンサマリーはモデルを認識します。

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

より広範なモデル選択とフォールバックの概要については、[モデル](/ja-JP/concepts/models) を参照してください。

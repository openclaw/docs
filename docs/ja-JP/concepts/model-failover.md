---
read_when:
    - 認証プロファイルのローテーション、クールダウン、またはモデルのフォールバック動作を診断する
    - 認証プロファイルまたはモデルのフェイルオーバールールを更新する
    - セッションのモデルオーバーライドがフォールバック再試行とどのように相互作用するかを理解する
sidebarTitle: Model failover
summary: OpenClaw が認証プロファイルをローテーションし、モデル間でフォールバックする仕組み
title: モデルのフェイルオーバー
x-i18n:
    generated_at: "2026-05-10T19:31:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65de51fd4916aac8183a10afdfe3e0259cb85442de39e6d50fddf8a95bd420ae
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw は失敗を 2 段階で処理します。

1. 現在のプロバイダー内での**認証プロファイルのローテーション**。
2. `agents.defaults.model.fallbacks` 内の次のモデルへの**モデルフォールバック**。

このドキュメントでは、ランタイムルールと、それを支えるデータについて説明します。

## ランタイムフロー

通常のテキスト実行では、OpenClaw は次の順序で候補を評価します。

<Steps>
  <Step title="セッション状態を解決する">
    アクティブなセッションモデルと認証プロファイル設定を解決します。
  </Step>
  <Step title="候補チェーンを構築する">
    現在のモデル選択と、その選択元に対するフォールバックポリシーから、モデル候補チェーンを構築します。構成済みのデフォルト、Cron ジョブのプライマリ、自動選択されたフォールバックモデルは、構成済みのフォールバックを使用できます。明示的なユーザーセッション選択は厳密です。
  </Step>
  <Step title="現在のプロバイダーを試す">
    認証プロファイルのローテーション/クールダウンルールに従って、現在のプロバイダーを試します。
  </Step>
  <Step title="フェイルオーバー対象エラーで先へ進む">
    そのプロバイダーがフェイルオーバー対象エラーで使い尽くされた場合、次のモデル候補へ移動します。
  </Step>
  <Step title="フォールバック上書きを永続化する">
    再試行が始まる前に、選択されたフォールバック上書きを永続化します。これにより、他のセッション読み取り側は、ランナーがこれから使用するプロバイダー/モデルと同じものを参照できます。永続化されたモデル上書きには `modelOverrideSource: "auto"` が付けられます。
  </Step>
  <Step title="失敗時は限定的にロールバックする">
    フォールバック候補が失敗した場合、それらがまだその失敗した候補と一致しているときだけ、フォールバックが所有するセッション上書きフィールドをロールバックします。
  </Step>
  <Step title="使い尽くしたら FallbackSummaryError を投げる">
    すべての候補が失敗した場合、試行ごとの詳細と、判明している場合は最も早いクールダウン期限を含む `FallbackSummaryError` を投げます。
  </Step>
</Steps>

これは意図的に「セッション全体を保存して復元する」よりも狭い範囲にしています。返信ランナーは、フォールバックのために自身が所有するモデル選択フィールドだけを永続化します。

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

これにより、失敗したフォールバック再試行が、試行の実行中に発生した手動の `/model` 変更やセッションローテーション更新など、より新しい無関係なセッション変更を上書きすることを防ぎます。

## 選択元ポリシー

OpenClaw は、選択されたプロバイダー/モデルと、それが選択された理由を分離します。その選択元が、フォールバックチェーンを許可するかどうかを制御します。

- **構成済みデフォルト**: `agents.defaults.model.primary` は `agents.defaults.model.fallbacks` を使用します。
- **エージェントプライマリ**: `agents.list[].model` は、そのエージェントモデルオブジェクトに独自の `fallbacks` が含まれていない限り厳密です。厳密な動作を明示するには `fallbacks: []` を使用し、そのエージェントでモデルフォールバックを有効にするには空でないリストを指定します。
- **自動フォールバック上書き**: ランタイムフォールバックは、再試行前に `providerOverride`、`modelOverride`、`modelOverrideSource: "auto"`、および選択された元モデルを書き込みます。その自動上書きは、構成済みフォールバックチェーンを進み続けることができ、`/new`、`/reset`、`sessions.reset` によってクリアされます。明示的な `heartbeat.model` なしで実行される Heartbeat も、その元モデルが現在の構成済みデフォルトと一致しなくなった場合、直接の自動上書きをクリアします。
- **ユーザーセッション上書き**: `/model`、モデルピッカー、`session_status(model=...)`、`sessions.patch` は `modelOverrideSource: "user"` を書き込みます。これは厳密なセッション選択です。選択されたプロバイダー/モデルが返信を生成する前に失敗した場合、OpenClaw は無関係な構成済みフォールバックから回答するのではなく、失敗を報告します。
- **レガシーセッション上書き**: 古いセッションエントリには、`modelOverrideSource` なしの `modelOverride` がある場合があります。OpenClaw はそれらをユーザー上書きとして扱うため、明示的な古い選択が暗黙にフォールバック動作へ変換されることはありません。
- **Cron ペイロードモデル**: Cron ジョブの `payload.model` / `--model` はジョブプライマリであり、ユーザーセッション上書きではありません。ジョブが `payload.fallbacks` を提供しない限り、構成済みフォールバックを使用します。`payload.fallbacks: []` は Cron 実行を厳密にします。

## 認証ストレージ（キー + OAuth）

OpenClaw は、API キーと OAuth トークンの両方に**認証プロファイル**を使用します。

- シークレットは `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` にあります（レガシー: `~/.openclaw/agent/auth-profiles.json`）。
- ランタイムの認証ルーティング状態は `~/.openclaw/agents/<agentId>/agent/auth-state.json` にあります。
- 構成の `auth.profiles` / `auth.order` は**メタデータ + ルーティングのみ**です（シークレットは含みません）。
- レガシーのインポート専用 OAuth ファイル: `~/.openclaw/credentials/oauth.json`（初回使用時に `auth-profiles.json` へインポートされます）。

詳細: [OAuth](/ja-JP/concepts/oauth)

認証情報の種類:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（一部のプロバイダーでは `projectId`/`enterpriseUrl` も含む）

## プロファイル ID

OAuth ログインでは、複数アカウントが共存できるように個別のプロファイルを作成します。

- デフォルト: メールアドレスが利用できない場合は `provider:default`。
- メールアドレス付き OAuth: `provider:<email>`（例: `google-antigravity:user@gmail.com`）。

プロファイルは、`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` の `profiles` 配下にあります。

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

- **プライマリキー:** プロファイルタイプ（**API キーより OAuth を優先**）。
- **セカンダリキー:** `usageStats.lastUsed`（各タイプ内で古いものから）。
- **クールダウン/無効化されたプロファイル**は末尾へ移動され、最も早い期限順に並べられます。

### セッションの固定性（キャッシュに優しい）

OpenClaw は、プロバイダーキャッシュを温めておくために、**選択された認証プロファイルをセッションごとに固定**します。リクエストごとにはローテーション**しません**。固定されたプロファイルは、次のいずれかが発生するまで再利用されます。

- セッションがリセットされる（`/new` / `/reset`）
- Compaction が完了する（Compaction カウントが増加する）
- プロファイルがクールダウン中/無効化中である

`/model …@<profileId>` による手動選択は、そのセッションに**ユーザー上書き**を設定し、新しいセッションが開始されるまで自動ローテーションされません。

<Note>
自動固定プロファイル（セッションルーターが選択したもの）は**設定**として扱われます。最初に試されますが、レート制限/タイムアウト時には OpenClaw が別のプロファイルへローテーションする場合があります。ユーザー固定プロファイルはそのプロファイルにロックされたままです。失敗し、モデルフォールバックが構成されている場合、OpenClaw はプロファイルを切り替えるのではなく次のモデルへ移動します。
</Note>

### OAuth が「失われたように見える」理由

同じプロバイダーに OAuth プロファイルと API キープロファイルの両方がある場合、固定されていない限り、ラウンドロビンによりメッセージ間でそれらが切り替わることがあります。単一のプロファイルを強制するには、次のいずれかを使用します。

- `auth.order[provider] = ["provider:profileId"]` で固定する、または
- `/model …` を使用して、プロファイル上書き付きのセッションごとの上書きを使う（UI/チャットサーフェスでサポートされている場合）。

## クールダウン

認証/レート制限エラー（またはレート制限のように見えるタイムアウト）によってプロファイルが失敗した場合、OpenClaw はそれをクールダウンとしてマークし、次のプロファイルへ移動します。

<AccordionGroup>
  <Accordion title="レート制限 / タイムアウトバケットに入るもの">
    そのレート制限バケットは単純な `429` よりも広く、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted` などのプロバイダーメッセージや、`weekly/monthly limit reached` のような定期的な使用量ウィンドウ制限も含みます。

    フォーマット/無効なリクエストエラーは、同じペイロードを再試行しても同じように失敗するため、通常は終端エラーです。そのため OpenClaw は認証プロファイルをローテーションするのではなく、それらを表面化します。既知の再試行修復パスは明示的にオプトインできます。たとえば Cloud Code Assist のツール呼び出し ID 検証失敗は、`allowFormatRetry` ポリシーを通じてサニタイズされ、1 回再試行されます。`Unhandled stop reason: error`、`stop reason: error`、`reason: error` などの OpenAI 互換の停止理由エラーは、タイムアウト/フェイルオーバーシグナルとして分類されます。

    ソースが既知の一時的パターンと一致する場合、汎用サーバーテキストもそのタイムアウトバケットに入ることがあります。たとえば、素の pi-ai ストリームラッパーメッセージ `An unknown error occurred` は、すべてのプロバイダーでフェイルオーバー対象として扱われます。これは、プロバイダーストリームが具体的な詳細なしに `stopReason: "aborted"` または `stopReason: "error"` で終了したときに pi-ai がそれを出力するためです。`internal server error`、`unknown error, 520`、`upstream error`、`backend error` などの一時的なサーバーテキストを含む JSON `api_error` ペイロードも、フェイルオーバー対象のタイムアウトとして扱われます。

    OpenRouter 固有の汎用アップストリームテキスト、たとえば素の `Provider returned error` は、プロバイダーコンテキストが実際に OpenRouter の場合にのみタイムアウトとして扱われます。`LLM request failed with an unknown error.` のような汎用の内部フォールバックテキストは保守的に扱われ、それ自体ではフェイルオーバーをトリガーしません。

  </Accordion>
  <Accordion title="SDK retry-after の上限">
    一部のプロバイダー SDK は、OpenClaw に制御を返す前に長い `Retry-After` ウィンドウの間スリープする場合があります。Anthropic や OpenAI などの Stainless ベース SDK では、OpenClaw は SDK 内部の `retry-after-ms` / `retry-after` 待機をデフォルトで 60 秒に制限し、それより長い再試行可能レスポンスをすぐに表面化して、このフェイルオーバーパスを実行できるようにします。上限の調整または無効化には `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` を使用します。[再試行動作](/ja-JP/concepts/retry)を参照してください。
  </Accordion>
  <Accordion title="モデルスコープのクールダウン">
    レート制限クールダウンはモデルスコープにもできます。

    - 失敗したモデル ID が判明している場合、OpenClaw はレート制限失敗に対して `cooldownModel` を記録します。
    - クールダウンが別のモデルにスコープされている場合、同じプロバイダー上の兄弟モデルは引き続き試行できます。
    - 課金/無効化ウィンドウは、引き続きモデルをまたいでプロファイル全体をブロックします。

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

## 課金による無効化

課金/クレジット失敗（たとえば「insufficient credits」/「credit balance too low」）はフェイルオーバー対象として扱われますが、通常は一時的ではありません。短いクールダウンの代わりに、OpenClaw はプロファイルを**無効化**（より長いバックオフ付き）としてマークし、次のプロファイル/プロバイダーへローテーションします。

<Note>
課金のように見えるレスポンスがすべて `402` とは限らず、HTTP `402` がすべてここに入るわけでもありません。プロバイダーが代わりに `401` または `403` を返した場合でも、OpenClaw は明示的な課金テキストを課金レーンに保持します。ただし、プロバイダー固有のマッチャーは、それを所有するプロバイダーにスコープされたままです（たとえば OpenRouter の `403 Key limit exceeded`）。

一方で、一時的な `402` 使用量ウィンドウおよび組織/ワークスペースの支出上限エラーは、メッセージが再試行可能に見える場合（たとえば `weekly usage limit exhausted`、`daily limit reached, resets tomorrow`、`organization spending limit exceeded`）、`rate_limit` として分類されます。それらは長い課金無効化パスではなく、短いクールダウン/フェイルオーバーパスに留まります。
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

- 課金バックオフは**5 時間**から始まり、課金失敗ごとに倍増し、**24 時間**で上限に達します。
- プロファイルが **24 時間**失敗していない場合、バックオフカウンターはリセットされます（構成可能）。
- 過負荷時の再試行では、モデルフォールバックの前に**同一プロバイダー内で 1 回のプロファイルローテーション**を許可します。
- 過負荷時の再試行は、デフォルトで **0 ms バックオフ**を使用します。

## モデルフォールバック

すべてのプロバイダーのプロファイルが失敗した場合、OpenClaw は `agents.defaults.model.fallbacks` 内の次のモデルに移ります。これは、認証失敗、レート制限、プロファイルローテーションを使い切ったタイムアウトに適用されます（その他のエラーではフォールバックは進みません）。十分な詳細を公開しないプロバイダーエラーも、フォールバック状態では正確にラベル付けされます。`empty_response` はプロバイダーが使用可能なメッセージまたはステータスを返さなかったことを意味し、`no_error_details` はプロバイダーが明示的に `Unknown error (no error details in response)` を返したことを意味し、`unclassified` は OpenClaw が生のプレビューを保持したものの、まだ分類器に一致しなかったことを意味します。

過負荷エラーとレート制限エラーは、請求クールダウンよりも積極的に処理されます。デフォルトでは、OpenClaw は同一プロバイダー内で認証プロファイルの再試行を 1 回許可し、その後は待機せずに次に設定されたモデルフォールバックへ切り替えます。`ModelNotReadyException` のようなプロバイダービジー信号は、この過負荷の分類に入ります。これは `auth.cooldowns.overloadedProfileRotations`、`auth.cooldowns.overloadedBackoffMs`、`auth.cooldowns.rateLimitedProfileRotations` で調整します。

実行が、設定済みのデフォルトプライマリ、cron ジョブのプライマリ、明示的なフォールバックを持つエージェントのプライマリ、または自動選択されたフォールバックオーバーライドから開始された場合、OpenClaw は対応する設定済みフォールバックチェーンをたどることができます。明示的なフォールバックを持たないエージェントのプライマリと、明示的なユーザー選択（たとえば `/model ollama/qwen3.5:27b`、モデルピッカー、`sessions.patch`、または一回限りの CLI プロバイダー/モデルオーバーライド）は厳格です。そのプロバイダー/モデルに到達できない、または返信を生成する前に失敗した場合、OpenClaw は無関係なフォールバックで回答する代わりに失敗を報告します。

### 候補チェーンのルール

OpenClaw は、現在要求されている `provider/model` と設定済みフォールバックから候補リストを構築します。

<AccordionGroup>
  <Accordion title="ルール">
    - 要求されたモデルは常に先頭です。
    - 明示的に設定されたフォールバックは重複排除されますが、モデル許可リストではフィルタリングされません。これは明示的な運用者の意図として扱われます。
    - 現在の実行が同じプロバイダーファミリー内の設定済みフォールバック上にすでにある場合、OpenClaw は設定済みチェーン全体の使用を継続します。
    - 現在の実行が設定とは異なるプロバイダー上にあり、その現在のモデルが設定済みフォールバックチェーンの一部ではない場合、OpenClaw は別プロバイダーの無関係な設定済みフォールバックを追加しません。
    - フォールバックランナーに明示的なフォールバックオーバーライドが渡されていない場合、設定済みプライマリが末尾に追加されるため、それ以前の候補を使い切った後に通常のデフォルトへ戻って落ち着くことができます。
    - 呼び出し元が `fallbacksOverride` を渡した場合、ランナーは要求されたモデルとそのオーバーライドリストのみを使用します。空のリストはモデルフォールバックを無効にし、設定済みプライマリが隠れた再試行先として追加されることを防ぎます。

  </Accordion>
</AccordionGroup>

### どのエラーでフォールバックが進むか

<Tabs>
  <Tab title="継続するもの">
    - 認証失敗
    - レート制限とクールダウン枯渇
    - 過負荷/プロバイダービジーエラー
    - タイムアウト型のフェイルオーバーエラー
    - 請求による無効化
    - `LiveSessionModelSwitchError`。古い永続化モデルが外側の再試行ループを作らないよう、フェイルオーバーパスに正規化されます
    - 候補がまだ残っている場合の、その他の未認識エラー

  </Tab>
  <Tab title="継続しないもの">
    - タイムアウト/フェイルオーバー型ではない明示的な中止
    - Compaction/再試行ロジック内にとどめるべきコンテキスト超過エラー（たとえば `request_too_large`、`INVALID_ARGUMENT: input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`The input is too long for the model`、または `ollama error: context length exceeded`）
    - 候補が残っていない場合の最終的な不明エラー

  </Tab>
</Tabs>

### クールダウンのスキップとプローブ動作

あるプロバイダーのすべての認証プロファイルがすでにクールダウン中でも、OpenClaw はそのプロバイダーを永久に自動スキップするわけではありません。候補ごとに判断します。

<AccordionGroup>
  <Accordion title="候補ごとの判断">
    - 永続的な認証失敗は、プロバイダー全体を即座にスキップします。
    - 請求による無効化は通常スキップしますが、再起動せずに回復できるよう、プライマリ候補はスロットル付きでプローブされる場合があります。
    - プライマリ候補は、プロバイダーごとのスロットル付きで、クールダウン期限の近くにプローブされる場合があります。
    - 失敗が一時的に見える場合（`rate_limit`、`overloaded`、または不明）、同一プロバイダーのフォールバック兄弟はクールダウン中でも試行される場合があります。これは、レート制限がモデルスコープで、兄弟モデルがすぐに回復できる可能性がある場合に特に重要です。
    - 一時的クールダウンのプローブは、単一のプロバイダーがプロバイダー間フォールバックを停滞させないよう、フォールバック実行ごとにプロバイダーあたり 1 回に制限されます。

  </Accordion>
</AccordionGroup>

## セッションオーバーライドとライブモデル切り替え

セッションモデルの変更は共有状態です。アクティブなランナー、`/model` コマンド、Compaction/セッション更新、ライブセッションの照合は、すべて同じセッションエントリの一部を読み書きします。

つまり、フォールバック再試行はライブモデル切り替えと連携する必要があります。

- 明示的なユーザー主導のモデル変更だけが、保留中のライブ切り替えをマークします。これには `/model`、`session_status(model=...)`、`sessions.patch` が含まれます。
- フォールバックローテーション、Heartbeat オーバーライド、Compaction のようなシステム主導のモデル変更は、それ自体では保留中のライブ切り替えをマークしません。
- ユーザー主導のモデルオーバーライドはフォールバックポリシー上、正確な選択として扱われるため、到達できない選択済みプロバイダーは `agents.defaults.model.fallbacks` によって隠されるのではなく、失敗として表面化します。
- フォールバック再試行が始まる前に、返信ランナーは選択されたフォールバックオーバーライドフィールドをセッションエントリへ永続化します。
- 自動フォールバックオーバーライドは後続のターンでも選択されたままになるため、OpenClaw は既知の不良プライマリをメッセージごとにプローブしません。`/new`、`/reset`、`sessions.reset` は自動由来のオーバーライドをクリアし、セッションを設定済みデフォルトへ戻します。
- `/status` は選択済みモデルを表示し、フォールバック状態が異なる場合はアクティブなフォールバックモデルと理由も表示します。
- ライブセッションの照合は、古いランタイムモデルフィールドよりも永続化されたセッションオーバーライドを優先します。
- ライブ切り替えエラーがアクティブなフォールバックチェーン内の後続候補を指している場合、OpenClaw は無関係な候補を先にたどらず、その選択済みモデルへ直接ジャンプします。
- フォールバック試行が失敗した場合、ランナーは自身が書き込んだオーバーライドフィールドだけを、かつそれらがまだその失敗候補と一致している場合にのみロールバックします。

これにより、典型的な競合を防ぎます。

<Steps>
  <Step title="プライマリ失敗">
    選択済みプライマリモデルが失敗します。
  </Step>
  <Step title="メモリ上でフォールバックを選択">
    フォールバック候補がメモリ上で選択されます。
  </Step>
  <Step title="セッションストアはまだ古いプライマリを示している">
    セッションストアはまだ古いプライマリを反映しています。
  </Step>
  <Step title="ライブ照合が古い状態を読む">
    ライブセッション照合が古いセッション状態を読みます。
  </Step>
  <Step title="再試行が戻される">
    フォールバック試行が始まる前に、再試行が古いモデルへ戻されます。
  </Step>
</Steps>

永続化されたフォールバックオーバーライドがこの隙間を閉じ、狭いロールバックによって新しい手動またはランタイムのセッション変更はそのまま保たれます。

## 可観測性と失敗サマリー

`runWithModelFallback(...)` は、ログとユーザー向けクールダウンメッセージに渡される試行ごとの詳細を記録します。

- 試行したプロバイダー/モデル
- 理由（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found`、および同様のフェイルオーバー理由）
- 任意のステータス/コード
- 人間が読めるエラーサマリー

構造化された `model_fallback_decision` ログには、候補が失敗、スキップ、または後続フォールバックで成功した場合に、フラットな `fallbackStep*` フィールドも含まれます。これらのフィールドは試行された遷移を明示します（`fallbackStepFromModel`、`fallbackStepToModel`、`fallbackStepFromFailureReason`、`fallbackStepFromFailureDetail`、`fallbackStepFinalOutcome`）。そのため、ログおよび診断エクスポーターは、最終的なフォールバックも失敗した場合でも、プライマリ失敗を再構築できます。

すべての候補が失敗した場合、OpenClaw は `FallbackSummaryError` をスローします。外側の返信ランナーはそれを使って、「すべてのモデルが一時的にレート制限されています」のような、より具体的なメッセージを構築し、分かっている場合は最も早いクールダウン期限を含めることができます。

このクールダウンサマリーはモデルを認識します。

- 試行されたプロバイダー/モデルチェーンと無関係なモデルスコープのレート制限は無視されます
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

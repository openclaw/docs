---
read_when:
    - トークン使用量、コスト、コンテキストウィンドウの説明
    - コンテキスト増大またはCompaction動作のデバッグ
summary: OpenClaw がプロンプトコンテキストを構築し、トークン使用量とコストを報告する仕組み
title: トークンの使用量とコスト
x-i18n:
    generated_at: "2026-07-11T22:42:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07c79e137d6809ccf8c435ef62641c0cc7579b3ec43acd513e430a7ab91cd47c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw は文字数ではなく、**トークン数**を追跡します。トークンはモデルごとに異なりますが、多くの
OpenAI 形式のモデルでは、英語テキストの場合、1 トークンあたり平均約 4 文字です。

## システムプロンプトの構築方法

OpenClaw は実行のたびに独自のシステムプロンプトを組み立てます。これには以下が含まれます。

- ツール一覧と簡単な説明
- Skills 一覧（メタデータのみ。指示は必要に応じて `read` で読み込まれます）。ネイティブ
  Codex ターンでは、コンパクトな Skills ブロックがターン単位のコラボレーション用
  開発者指示として渡されます。その他のハーネスでは、通常のプロンプト領域に渡されます。
  `skills.limits.maxSkillsPromptChars` によって上限が設定され、必要に応じてエージェントごとに
  `agents.list[].skillsLimits.maxSkillsPromptChars` で上書きできます。
- 自己更新の指示
- ワークスペースとブートストラップファイル（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、
  `IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、新規の場合は `BOOTSTRAP.md`、さらに
  存在する場合は `MEMORY.md`）。挿入される大きなファイルは
  `agents.defaults.bootstrapMaxChars`（デフォルト: `20000`）で切り詰められます。ブートストラップへの
  挿入総量は `agents.defaults.bootstrapTotalMaxChars`（デフォルト:
  `60000`）で制限されます。
  - ネイティブ Codex ターンでは、そのワークスペースでメモリツールを使用できる場合、
    未加工の `MEMORY.md` は貼り付けられません。代わりに、ターン単位のコラボレーション用
    開発者指示に短いメモリ参照情報が渡され、必要に応じてメモリツールを使用します。
    ツールが無効である場合、メモリ検索を利用できない場合、またはアクティブなワークスペースが
    エージェントのメモリワークスペースと異なる場合、`MEMORY.md` は通常の上限付き
    ターンコンテキスト経路にフォールバックします。
  - ルートにある小文字の `memory.md` は挿入されません。これは
    `openclaw doctor --fix` 用のレガシー修復入力であり、同コマンドによって `MEMORY.md` に移行されます。
  - `memory/*.md` の日次ファイルは通常のブートストラッププロンプトには含まれません。
    通常のターンでは、メモリツールを通じて必要に応じて利用されます。リセット時または起動時の
    モデル実行では、その最初のターンに限り、最近の日次メモリを含む一度限りの
    起動コンテキストブロックを先頭に追加できます。これは
    `agents.defaults.startupContext` で制御されます。通常のチャットでの `/new` と `/reset` は、
    モデルを呼び出さずに受け付けられます。
  - Compaction 後の `AGENTS.md` 抜粋は別枠であり、
    `agents.defaults.compaction.postCompactionSections` による明示的なオプトインが必要です。
- 時刻（UTC とユーザーのタイムゾーン）
- 返信タグと Heartbeat の動作
- ランタイムメタデータ（ホスト、OS、モデル、思考）

詳細な内訳については、[システムプロンプト](/ja-JP/concepts/system-prompt)を参照してください。

認証情報や認証スニペットを文書化する場合は、ドキュメントのみの変更で
シークレットスキャナーの誤検出を避けるため、
[シークレットプレースホルダー規則](/ja-JP/reference/secret-placeholder-conventions)を使用してください。

## コンテキストウィンドウに算入されるもの

モデルが受け取るものはすべてコンテキスト上限に算入されます。

- システムプロンプト（上記の全セクション）
- 会話履歴（ユーザーとアシスタントのメッセージ）
- ツール呼び出しとツール結果
- 添付ファイルとトランスクリプト（画像、音声、ファイル）
- Compaction の要約とプルーニング生成物
- プロバイダーのラッパーまたは安全性ヘッダー（表示されませんが、算入されます）

ランタイム負荷の高い領域には、
`agents.defaults.contextLimits`（エージェントごとの上書きは
`agents.list[].contextLimits`）で明示的な上限が個別に設定されています。

| キー                     | 目的                                                                     |
| ------------------------ | ------------------------------------------------------------------------ |
| `memoryGetMaxChars`      | 切り詰め前に `memory_get` が返す最大文字数。                              |
| `memoryGetDefaultLines`  | リクエストで `lines` が省略された場合の `memory_get` のデフォルト行範囲。 |
| `toolResultMaxChars`     | 単一のライブツール結果に対する高度な上限（最大 `1000000` 文字）。         |
| `postCompactionMaxChars` | Compaction 後の更新時に `AGENTS.md` から保持される最大文字数。             |

これらは上限付きのランタイム抜粋と、ランタイムが所有する挿入ブロックであり、
ブートストラップ上限、起動コンテキスト上限、Skills プロンプト上限とは別です。

`toolResultMaxChars` はデフォルトでは未設定です。そのため OpenClaw は、有効なモデルの
コンテキストウィンドウからライブツール結果の上限を算出します。100K トークン未満では
`16000` 文字、100K トークン以上では `32000` 文字、200K トークン以上では `64000` 文字です。
より大きな明示的上限を設定した場合でも、ランタイムのコンテキスト占有率ガードにより、
単一のツール結果はコンテキストウィンドウの 30% に制限されます。

画像については、OpenClaw はプロバイダーを呼び出す前に、トランスクリプトやツールの
画像ペイロードを縮小します。`agents.defaults.imageMaxDimensionPx`（デフォルト:
`1200`）で調整できます。

- 値を小さくすると、ビジョントークンの使用量とペイロードサイズが減少します。
- 値を大きくすると、OCR や UI を多用するスクリーンショットの視覚的な詳細がより多く保持されます。

実用的な内訳（挿入ファイルごとのサイズ、ツール、Skills、システムプロンプトのサイズ）を
確認するには、`/context list` または `/context detail` を使用してください。
[コンテキスト](/ja-JP/concepts/context)も参照してください。

## 現在のトークン使用量を確認する方法

チャットでは以下を使用します。

- `/status` -> セッションのモデル、コンテキスト使用量、直前の応答の入力・出力トークン数、
  およびアクティブなモデルにローカル価格が設定されている場合の推定コストを表示する、
  絵文字付きのステータスカード。
- `/usage off|tokens|full` -> すべての返信に応答ごとの使用量フッターを追加します。
  セッションごとに保持されます（`responseUsage` として保存）。
  - `/usage reset`（別名: `inherit`、`clear`、`default`）はセッションの上書きを消去し、
    設定済みのデフォルトを再び継承するようにします。
  - `/usage tokens` はターンのトークンとキャッシュの詳細を表示します。
  - `/usage full` はモデル、コンテキスト、コストの詳細をコンパクトに表示します。推定コストは、
    OpenClaw がアクティブなモデルの使用量メタデータとローカル価格を保持している場合にのみ
    表示されます。カスタムの `messages.usageTemplate` レイアウトには、
    トークンやキャッシュのフィールドを含めることができます。
- `/usage cost` -> OpenClaw のセッションログに基づくローカルコストの概要。

その他の領域では以下を使用します。

- **TUI/Web TUI:** `/status` と `/usage` がサポートされています。
- **CLI:** `openclaw status --usage` と `openclaw channels list` は、
  正規化されたプロバイダーのクォータ期間を表示します（応答ごとのコストではなく `X% left`）。
  現在使用量期間に対応しているプロバイダーは、Claude（Anthropic）、ClawRouter、Copilot
  （GitHub）、DeepSeek、Gemini（Google Gemini CLI）、MiniMax、OpenAI、Xiaomi、
  Xiaomi Token Plan、z.ai です。

使用量を表示する各領域では、表示前に一般的なプロバイダー固有のフィールド別名を
正規化します。OpenAI 系の Responses トラフィックでは、
`input_tokens`/`output_tokens` と `prompt_tokens`/`completion_tokens` の両方が対象となるため、
トランスポート固有のフィールド名によって `/status`、`/usage`、セッション要約の内容は変わりません。
Gemini CLI の使用量も正規化されます。デフォルトの `stream-json` パーサーはアシスタントの
`message` イベントを読み取り、`stats.cached` は `cacheRead` に対応付けられます。また、CLI が
明示的な `stats.input` フィールドを省略した場合は、`stats.input_tokens - stats.cached` が
使用されます。レガシー JSON の上書きでは、引き続き `response` から返信テキストを読み取ります。

ネイティブな OpenAI 系の Responses トラフィックでは、WebSocket/SSE の使用量別名も
同じ方法で正規化され、`total_tokens` が存在しないか `0` の場合、合計値は正規化された
入力と出力の合計にフォールバックします。

現在のセッションスナップショットの情報が少ない場合、`/status` と `session_status` は、
最新のトランスクリプト使用量ログからトークン数、キャッシュ数、アクティブなランタイムモデルの
ラベルを復元できます。既存のゼロではないライブ値は、引き続きトランスクリプトの
フォールバック値より優先されます。また、保存された合計値が存在しないか小さい場合は、
プロンプト指向の、より大きなトランスクリプト合計値が優先されることがあります。

プロバイダーのクォータ期間に使用する認証は、まずプロバイダー固有のフックから取得されます。
プロバイダーにフックがない場合、またはフックでトークンを解決できない場合、OpenClaw は
認証プロファイル、環境変数、設定から、一致する OAuth/API キー認証情報を探してフォールバックします。

アシスタントのトランスクリプトエントリには、同じ正規化済み使用量形式が保持されます。
アクティブなモデルに価格が設定され、プロバイダーが使用量メタデータを返す場合は、
`usage.cost` も含まれます。これにより、ライブランタイム状態が失われた後でも、
`/usage cost` とトランスクリプトを利用したセッションステータスに安定した情報源が提供されます。

OpenClaw は、プロバイダーの使用量集計を現在のコンテキストスナップショットとは分けて保持します。
プロバイダーの `usage.total` には、キャッシュ済み入力、出力、複数回のツールループに伴う
モデル呼び出しが含まれることがあります。そのため、コストやテレメトリには有用ですが、
ライブのコンテキストウィンドウを過大に見積もる可能性があります。コンテキスト表示と診断では、
`context.used` に最新のプロンプトスナップショット（`promptTokens`。プロンプトスナップショットが
利用できない場合は最後のモデル呼び出し）を使用します。

## コストの推定（表示される場合）

コストはモデルの価格設定から推定されます。

```text
models.providers.<provider>.models[].cost
```

これらは `input`、`output`、`cacheRead`、`cacheWrite` に対する
**100 万トークンあたりの米ドル額**です。価格が設定されていない場合、`/usage full` はコストを
省略します。すべての返信でトークンやキャッシュの詳細が必要な場合は、`/usage tokens` または
カスタムの `messages.usageTemplate` を使用してください。コスト表示は API キー認証に限定されません。
`aws-sdk` のような API キーを使用しないプロバイダーでも、設定されたモデルエントリに
ローカル価格が含まれ、プロバイダーが使用量メタデータを返す場合は推定コストを表示できます。

サイドカーとチャンネルが Gateway の準備完了経路に到達すると、OpenClaw は、ローカル価格が
まだ設定されていないモデル参照に対して、任意のバックグラウンド価格ブートストラップを開始します。
このブートストラップは、リモートの OpenRouter と LiteLLM の価格カタログを取得します。
オフラインまたは制限付きネットワークでこれらのカタログ取得を省略するには、
`models.pricing.enabled: false` を設定してください。明示的な
`models.providers.*.models[].cost` エントリは、引き続きローカルコストの推定に使用されます。

## キャッシュ TTL とプルーニングの影響

プロバイダーのプロンプトキャッシュは、キャッシュ TTL の期間内でのみ適用されます。OpenClaw は、
必要に応じて **キャッシュ TTL プルーニング**を実行できます。キャッシュ TTL の期限が切れると
セッションをプルーニングし、その後キャッシュ期間をリセットします。これにより、以降のリクエストでは
履歴全体を再キャッシュする代わりに、新しくキャッシュされたコンテキストを再利用できます。
セッションが TTL を超えてアイドル状態になった場合でも、キャッシュ書き込みコストを低く抑えられます。

[Gateway の設定](/ja-JP/gateway/configuration)で設定し、動作の詳細については
[セッションのプルーニング](/ja-JP/concepts/session-pruning)を参照してください。

Heartbeat を使用すると、アイドル期間をまたいでキャッシュを**ウォームな状態**に保てます。
モデルのキャッシュ TTL が `1h` の場合、Heartbeat の間隔をそれより少し短く（例: `55m`）設定すると、
プロンプト全体の再キャッシュを回避し、キャッシュ書き込みコストを削減できます。

マルチエージェント構成では、共有モデル設定を 1 つ維持しながら、
`agents.list[].params.cacheRetention` を使用してエージェントごとにキャッシュ動作を調整できます。

各設定項目の詳細なガイドについては、[プロンプトキャッシュ](/ja-JP/reference/prompt-caching)を参照してください。

Anthropic API の価格体系では、キャッシュ読み取りは入力トークンより大幅に安価ですが、
キャッシュ書き込みにはより高い倍率で料金が発生します。最新の料金と TTL 倍率については、
Anthropic のプロンプトキャッシュ料金を参照してください。
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 例: Heartbeat で 1 時間のキャッシュをウォームな状態に保つ

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### 例: エージェントごとのキャッシュ戦略を使用する混合トラフィック

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # default baseline for most agents
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # keep long cache warm for deep sessions
    - id: "alerts"
      params:
        cacheRetention: "none" # avoid cache writes for bursty notifications
```

`agents.list[].params` は、選択されたモデルの `params` に上書きマージされます。そのため、
`cacheRetention` だけを上書きし、その他のモデルのデフォルト値は変更せずに継承できます。

### Anthropic の 100 万トークンコンテキスト

OpenClaw は、Opus 4.8、Opus 4.7、Opus 4.6、Sonnet 4.6 など、一般提供で 100 万トークンに
対応する Claude 4.x モデルに対して、Anthropic の 100 万トークンコンテキストウィンドウを
設定します。これらのモデルでは `params.context1m: true` は不要です。

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

古い設定では `context1m: true` を維持できますが、OpenClaw はこの設定に対して、
廃止された Anthropic の `context-1m-2025-08-07` ベータヘッダーを送信しなくなりました。
また、対応していない古い Claude モデルのコンテキストを 100 万トークンに拡張することもありません。

要件：認証情報がロングコンテキストの使用対象である必要があります。対象でない場合、
Anthropic はそのリクエストに対してプロバイダー側のレート制限エラーを返します。

OAuth/サブスクリプショントークン
（`sk-ant-oat-*`）で Anthropic を認証する場合、OpenClaw は OAuth に必要な Anthropic ベータ
ヘッダーを維持しつつ、古い設定に廃止済みの `context-1m-*` ベータが残っていれば削除します。

## トークン負荷を軽減するためのヒント

- `/compact` を使用して長いセッションを要約します。
- ワークフロー内の大きなツール出力を削減します。
- スクリーンショットを多用するセッションでは、`agents.defaults.imageMaxDimensionPx` を小さくします。
- スキルの説明は短く保ちます（スキル一覧はプロンプトに挿入されます）。
- 冗長な探索作業には、より小さいモデルを優先します。

スキル一覧による正確なオーバーヘッドの計算式については、[Skills](/ja-JP/tools/skills)を参照してください。

## 関連項目

- [API の使用量とコスト](/ja-JP/reference/api-usage-costs)
- [プロンプトキャッシュ](/ja-JP/reference/prompt-caching)
- [使用量の追跡](/ja-JP/concepts/usage-tracking)

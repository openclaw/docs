---
read_when:
    - トークン使用量、コスト、またはコンテキストウィンドウの説明
    - デバッグコンテキストの増大またはCompactionの挙動
summary: OpenClaw がプロンプトコンテキストを構築し、トークン使用量とコストを報告する仕組み
title: トークン使用量とコスト
x-i18n:
    generated_at: "2026-07-05T11:46:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07c79e137d6809ccf8c435ef62641c0cc7579b3ec43acd513e430a7ab91cd47c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw は**トークン**を追跡し、文字数は追跡しません。トークンはモデル固有ですが、ほとんどの
OpenAI スタイルのモデルでは、英語テキストで平均およそ 1 トークンあたり 4 文字です。

## システムプロンプトの構築方法

OpenClaw は実行ごとに独自のシステムプロンプトを組み立てます。これには以下が含まれます。

- ツール一覧 + 短い説明
- Skills 一覧 (メタデータのみ。手順は必要に応じて `read` で読み込まれます)。ネイティブ
  Codex ターンでは、コンパクトな Skills ブロックをターンスコープのコラボレーション用
  developer instructions として受け取ります。その他のハーネスでは通常のプロンプト面に含まれます。
  `skills.limits.maxSkillsPromptChars` によって制限され、任意でエージェントごとの
  `agents.list[].skillsLimits.maxSkillsPromptChars` で上書きできます。
- 自己更新手順
- ワークスペース + ブートストラップファイル (`AGENTS.md`, `SOUL.md`, `TOOLS.md`,
  `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, 新規時の `BOOTSTRAP.md`、さらに
  存在する場合は `MEMORY.md`)。大きな注入ファイルは
  `agents.defaults.bootstrapMaxChars` (デフォルト: `20000`) によって切り詰められます。ブートストラップ
  注入全体は `agents.defaults.bootstrapTotalMaxChars` (デフォルト:
  `60000`) によって上限が設定されます。
  - ネイティブ Codex ターンでは、そのワークスペースでメモリツールが利用可能な場合、生の
    `MEMORY.md` は貼り付けません。代わりにターンスコープのコラボレーション用 developer instructions 内で
    小さなメモリポインターを受け取り、必要に応じてメモリツールを使用します。ツールが無効、メモリ検索が利用不可、または
    アクティブなワークスペースがエージェントメモリのワークスペースと異なる場合、`MEMORY.md` は
    通常の制限付きターンコンテキスト経路にフォールバックします。
  - ルートの小文字 `memory.md` は注入されません。これは `openclaw doctor --fix` 用のレガシー修復入力であり、
    `MEMORY.md` に移行されます。
  - `memory/*.md` の日次ファイルは通常のブートストラッププロンプトには含まれません。
    通常ターンではメモリツール経由のオンデマンドのままです。リセット/起動時のモデル実行では、
    `agents.defaults.startupContext` によって制御される、その最初のターン用の最近の
    日次メモリを含む一回限りの起動コンテキストブロックを先頭に付けることができます。素のチャット `/new` と `/reset` は
    モデルを呼び出さずに確認応答されます。
  - Compaction 後の `AGENTS.md` 抜粋は別扱いであり、明示的な
    `agents.defaults.compaction.postCompactionSections` オプトインが必要です。
- 時刻 (UTC + ユーザータイムゾーン)
- 返信タグ + Heartbeat 動作
- ランタイムメタデータ (ホスト/OS/モデル/thinking)

完全な内訳は [システムプロンプト](/ja-JP/concepts/system-prompt) を参照してください。

認証情報や認証スニペットを文書化する場合は、docs のみの変更で secret scanner の誤検知を避けるために
[シークレットプレースホルダー規約](/ja-JP/reference/secret-placeholder-conventions) を使用してください。

## コンテキストウィンドウに含まれるもの

モデルが受け取るすべてのものがコンテキスト制限にカウントされます。

- システムプロンプト (上記のすべてのセクション)
- 会話履歴 (ユーザー + アシスタントメッセージ)
- ツール呼び出しとツール結果
- 添付ファイル/トランスクリプト (画像、音声、ファイル)
- Compaction サマリーと pruning アーティファクト
- プロバイダーラッパーまたは安全性ヘッダー (表示されませんが、カウントされます)

ランタイム負荷の大きい面には、`agents.defaults.contextLimits` の下に独自の明示的な上限があります
(エージェントごとの上書きは `agents.list[].contextLimits` の下)。

| キー                     | 目的                                                                     |
| ------------------------ | ------------------------------------------------------------------------ |
| `memoryGetMaxChars`      | `memory_get` が切り詰め前に返す最大文字数。                              |
| `memoryGetDefaultLines`  | リクエストが `lines` を省略した場合のデフォルトの `memory_get` 行ウィンドウ。 |
| `toolResultMaxChars`     | 1 つのライブツール結果に対する高度な上限 (`1000000` 文字まで)。          |
| `postCompactionMaxChars` | Compaction 後のリフレッシュ中に `AGENTS.md` から保持される最大文字数。   |

これらは制限付きランタイム抜粋とランタイム所有の注入ブロックであり、
ブートストラップ制限、起動コンテキスト制限、Skills プロンプト制限とは別です。

`toolResultMaxChars` はデフォルトでは未設定のため、OpenClaw は有効なモデルコンテキストウィンドウから
ライブツール結果の上限を導出します。100K トークン未満では `16000` 文字、
100K+ トークンでは `32000` 文字、200K+ トークンでは `64000` 文字です。
ランタイムのコンテキスト共有ガードは、より大きな明示的上限が設定されている場合でも、1 つのツール結果を
コンテキストウィンドウの 30% に制限します。

画像については、OpenClaw はプロバイダー呼び出し前にトランスクリプト/ツール画像ペイロードを縮小します。
`agents.defaults.imageMaxDimensionPx` (デフォルト: `1200`) で調整します。

- 低い値は vision-token 使用量とペイロードサイズを減らします。
- 高い値は OCR/UI の多いスクリーンショットで、より多くの視覚的詳細を保持します。

実用的な内訳 (注入ファイルごと、ツール、Skills、システムプロンプトサイズ) には、
`/context list` または `/context detail` を使用してください。[Context](/ja-JP/concepts/context) を参照してください。

## 現在のトークン使用量を確認する方法

チャットでは以下を使用します。

- `/status` -> セッションモデル、コンテキスト使用量、直近レスポンスの入力/出力トークン、および
  アクティブモデルにローカル価格が設定されている場合の推定コストを含む、絵文字豊富なステータスカード。
- `/usage off|tokens|full` -> 各レスポンスにレスポンスごとの使用量フッターを追加します。
  セッションごとに永続化されます (`responseUsage` として保存)。
  - `/usage reset` (エイリアス: `inherit`, `clear`, `default`) はセッションの上書きをクリアし、
    設定済みデフォルトを再継承させます。
  - `/usage tokens` はターンのトークン/キャッシュ詳細を表示します。
  - `/usage full` はコンパクトなモデル/コンテキスト/コスト詳細を表示します。推定コストは
    OpenClaw に使用量メタデータとアクティブモデルのローカル価格がある場合にのみ表示されます。
    カスタム `messages.usageTemplate` レイアウトにはトークン/キャッシュフィールドを含められます。
- `/usage cost` -> OpenClaw セッションログからのローカルコストサマリー。

その他の面:

- **TUI/Web TUI:** `/status` と `/usage` がサポートされています。
- **CLI:** `openclaw status --usage` と `openclaw channels list` は、正規化された
  プロバイダークォータウィンドウ (`X% left`、レスポンスごとのコストではありません) を表示します。
  現在の使用量ウィンドウプロバイダー: Claude (Anthropic)、ClawRouter、Copilot
  (GitHub)、DeepSeek、Gemini (Google Gemini CLI)、MiniMax、OpenAI、Xiaomi、
  Xiaomi Token Plan、z.ai。

使用量表示面では、表示前に一般的なプロバイダーネイティブのフィールドエイリアスを正規化します。
OpenAI ファミリーの Responses トラフィックでは、`input_tokens`/`output_tokens` と
`prompt_tokens`/`completion_tokens` の両方が含まれるため、トランスポート固有のフィールド名によって
`/status`、`/usage`、またはセッションサマリーが変わることはありません。Gemini CLI の使用量も正規化されます。
デフォルトの `stream-json` パーサーはアシスタントの `message` イベントを読み取り、`stats.cached` は
`cacheRead` にマップされ、CLI が明示的な `stats.input` フィールドを省略した場合は
`stats.input_tokens - stats.cached` が使用されます。レガシー JSON 上書きは引き続き
`response` から返信テキストを読み取ります。

ネイティブ OpenAI ファミリーの Responses トラフィックでは、WebSocket/SSE 使用量エイリアスも同じように正規化され、
`total_tokens` が欠落しているか `0` の場合、合計は正規化済みの入力 + 出力にフォールバックします。

現在のセッションスナップショットが疎な場合、`/status` と `session_status` は、直近のトランスクリプト使用量ログから
トークン/キャッシュカウンターとアクティブなランタイムモデルラベルを復元できます。既存のゼロでないライブ値は
トランスクリプトフォールバック値よりも優先され、保存済み合計が欠落しているか小さい場合は、より大きなプロンプト寄りの
トランスクリプト合計が勝つことがあります。

プロバイダークォータウィンドウの使用量認証は、まずプロバイダー固有のフックから取得されます。プロバイダーにフックがない
(またはフックがトークンを解決しない) 場合、OpenClaw は auth プロファイル、env、または config から一致する
OAuth/API キー認証情報にフォールバックします。

アシスタントのトランスクリプトエントリは、アクティブモデルに価格設定が構成され、プロバイダーが使用量メタデータを返す場合の
`usage.cost` を含め、同じ正規化済み使用量形状を永続化します。これにより、ライブランタイム状態がなくなった後でも、
`/usage cost` とトランスクリプトベースのセッションステータスに安定したソースが提供されます。

OpenClaw はプロバイダー使用量会計を現在のコンテキストスナップショットとは別に保持します。
プロバイダーの `usage.total` にはキャッシュ済み入力、出力、および複数のツールループモデル呼び出しを含めることができるため、
コストとテレメトリには有用ですが、ライブコンテキストウィンドウを過大表示する可能性があります。
コンテキスト表示と診断では、`context.used` に対して最新のプロンプトスナップショット (`promptTokens`、または
プロンプトスナップショットがない場合は直近のモデル呼び出し) を使用します。

## コスト推定 (表示される場合)

コストはモデル価格設定 config から推定されます。

```text
models.providers.<provider>.models[].cost
```

これらは `input`、`output`、`cacheRead`、`cacheWrite` に対する **100 万トークンあたりの USD** です。
価格設定が欠落している場合、`/usage full` はコストを省略します。各返信でトークン/キャッシュ詳細が必要な場合は、
`/usage tokens` またはカスタム `messages.usageTemplate` を使用してください。コスト表示は API キー認証に限定されません。
`aws-sdk` などの非 API キープロバイダーでも、設定済みモデルエントリにローカル価格が含まれ、プロバイダーが使用量メタデータを返す場合は、
推定コストを表示できます。

sidecar とチャネルが Gateway ready 経路に到達した後、OpenClaw は、ローカル価格をまだ持たない設定済みモデル参照に対して、
任意のバックグラウンド価格ブートストラップを開始します。そのブートストラップはリモートの OpenRouter と
LiteLLM 価格カタログを取得します。オフラインまたは制限付きネットワークでこれらのカタログ取得をスキップするには、
`models.pricing.enabled: false` を設定してください。明示的な
`models.providers.*.models[].cost` エントリは引き続きローカルコスト推定に使用されます。

## キャッシュ TTL と pruning の影響

プロバイダーのプロンプトキャッシュはキャッシュ TTL ウィンドウ内でのみ適用されます。OpenClaw は任意で
**cache-ttl pruning** を実行できます。キャッシュ TTL が期限切れになるとセッションを pruning し、
その後キャッシュウィンドウをリセットして、以降のリクエストが履歴全体を再キャッシュする代わりに、新しくキャッシュされた
コンテキストを再利用できるようにします。これにより、セッションが TTL を超えてアイドルになった場合のキャッシュ書き込みコストを抑えられます。

[Gateway 設定](/ja-JP/gateway/configuration) で設定し、動作の詳細は [セッション pruning](/ja-JP/concepts/session-pruning) を参照してください。

Heartbeat はアイドルギャップをまたいでキャッシュを**温かい**状態に保てます。モデルキャッシュ TTL が `1h` の場合、
Heartbeat 間隔をそれより少し短く (例: `55m`) 設定すると、プロンプト全体の再キャッシュを避け、キャッシュ書き込みコストを削減できます。

マルチエージェント構成では、1 つの共有モデル config を維持しながら、`agents.list[].params.cacheRetention` によって
エージェントごとにキャッシュ動作を調整できます。

項目ごとの完全なガイドは [プロンプトキャッシュ](/ja-JP/reference/prompt-caching) を参照してください。

Anthropic API の価格設定では、キャッシュ読み取りは入力トークンより大幅に安価ですが、キャッシュ書き込みはより高い倍率で課金されます。
最新のレートと TTL 倍率については、Anthropic のプロンプトキャッシュ価格を参照してください:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 例: Heartbeat で 1h キャッシュを温かい状態に保つ

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

### 例: エージェントごとのキャッシュ戦略を使った混合トラフィック

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

`agents.list[].params` は選択されたモデルの `params` の上にマージされるため、`cacheRetention` だけを上書きし、
他のモデルデフォルトは変更せずに継承できます。

### Anthropic 1M コンテキスト

OpenClaw は Opus 4.8、Opus 4.7、Opus 4.6、Sonnet 4.6 などの GA 対応 Claude 4.x モデルを
Anthropic の 1M コンテキストウィンドウでサイズ設定します。これらのモデルに
`params.context1m: true` は不要です。

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

古い config では `context1m: true` を保持できますが、OpenClaw はこの設定に対して Anthropic の廃止済み
`context-1m-2025-08-07` ベータヘッダーを送信しなくなり、サポートされていない古い Claude モデルを 1M に拡張しません。

要件: 認証情報がロングコンテキスト利用の対象である必要があります。対象外の場合、
Anthropic はそのリクエストに対してプロバイダー側のレート制限エラーを返します。

OAuth/サブスクリプショントークン
(`sk-ant-oat-*`) で Anthropic を認証する場合、OpenClaw は OAuth で必要な Anthropic beta
ヘッダーを保持しつつ、古い設定に残っている場合は廃止済みの `context-1m-*` beta を取り除きます。

## トークン負荷を減らすためのヒント

- 長いセッションを要約するには `/compact` を使用します。
- ワークフロー内の大きなツール出力を短くします。
- スクリーンショットが多いセッションでは `agents.defaults.imageMaxDimensionPx` を下げます。
- skill の説明は短く保ちます（skill リストはプロンプトに挿入されます）。
- 冗長で探索的な作業には、より小さいモデルを優先します。

正確な skill リストのオーバーヘッド計算式については [Skills](/ja-JP/tools/skills) を参照してください。

## 関連

- [API の使用量とコスト](/ja-JP/reference/api-usage-costs)
- [プロンプトキャッシュ](/ja-JP/reference/prompt-caching)
- [使用状況の追跡](/ja-JP/concepts/usage-tracking)

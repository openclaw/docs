---
read_when:
    - トークン使用量、コスト、またはコンテキストウィンドウの説明
    - コンテキスト増大またはCompaction動作のデバッグ
summary: OpenClaw がプロンプトコンテキストを構築し、トークン使用量とコストをレポートする仕組み
title: トークン使用量とコスト
x-i18n:
    generated_at: "2026-06-27T13:03:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0035ec9cf8d97aa6e78b9d95549cfb458af3bc2b5a4e2db83708281465c7e1af
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw は文字数ではなく **トークン**を追跡します。トークンはモデル固有ですが、ほとんどの
OpenAI スタイルのモデルでは、英語テキストで 1 トークンあたり平均約 4 文字です。

## システムプロンプトの構築方法

OpenClaw は実行ごとに独自のシステムプロンプトを組み立てます。これには以下が含まれます。

- ツール一覧 + 短い説明
- Skills 一覧（メタデータのみ。手順は必要に応じて `read` で読み込まれます）。
  ネイティブ Codex ターンは、コンパクトな Skills ブロックをターンスコープの
  コラボレーション開発者向け指示として受け取ります。他のハーネスは通常の
  プロンプト面で受け取ります。これは `skills.limits.maxSkillsPromptChars` によって制限され、
  `agents.list[].skillsLimits.maxSkillsPromptChars` でエージェントごとの任意の上書きができます。
- 自己更新手順
- ワークスペース + ブートストラップファイル（新規の場合は `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`、存在する場合は `MEMORY.md`）。ネイティブ Codex ターンは、そのワークスペースでメモリツールが利用可能な場合、設定済みエージェントワークスペースから生の `MEMORY.md` を貼り付けません。代わりに、ターンスコープのコラボレーション開発者向け指示に小さなメモリポインターを含め、必要に応じてメモリツールを使用します。ツールが無効、メモリ検索が利用不可、またはアクティブワークスペースがエージェントメモリワークスペースと異なる場合、`MEMORY.md` は通常の制限付きターンコンテキストパスを使用します。小文字のルート `memory.md` は注入されません。これは `MEMORY.md` と組み合わせた場合に `openclaw doctor --fix` のレガシー修復入力になります。大きな注入ファイルは `agents.defaults.bootstrapMaxChars`（デフォルト: 20000）で切り詰められ、ブートストラップ注入全体は `agents.defaults.bootstrapTotalMaxChars`（デフォルト: 60000）で上限が設定されます。`memory/*.md` の日次ファイルは通常のブートストラッププロンプトの一部ではありません。通常のターンではメモリツール経由のオンデマンドのままですが、リセット/起動時のモデル実行では、その最初のターンに最近の日次メモリを含む一回限りの起動コンテキストブロックを前置できます。素のチャット `/new` と `/reset` コマンドは、モデルを呼び出さずに確認応答されます。起動プリリュードは `agents.defaults.startupContext` で制御されます。Compaction 後の AGENTS.md 抜粋は別物で、明示的な `agents.defaults.compaction.postCompactionSections` のオプトインが必要です。
- 時刻（UTC + ユーザーのタイムゾーン）
- 返信タグ + Heartbeat の動作
- ランタイムメタデータ（ホスト/OS/モデル/思考）

完全な内訳は [システムプロンプト](/ja-JP/concepts/system-prompt) を参照してください。

認証情報や認証スニペットを文書化する場合は、docs のみの変更で
シークレットスキャナーの誤検知を避けるために
[シークレットプレースホルダー規約](/ja-JP/reference/secret-placeholder-conventions) を使用してください。

## コンテキストウィンドウに含まれるもの

モデルが受け取るものはすべてコンテキスト制限にカウントされます。

- システムプロンプト（上記に列挙したすべてのセクション）
- 会話履歴（ユーザー + アシスタントメッセージ）
- ツール呼び出しとツール結果
- 添付ファイル/トランスクリプト（画像、音声、ファイル）
- Compaction サマリーと枝刈り成果物
- プロバイダーラッパーまたは安全ヘッダー（表示されませんが、それでもカウントされます）

ランタイム負荷の高い一部の面には、独自の明示的な上限があります。

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

エージェントごとの上書きは `agents.list[].contextLimits` 配下にあります。これらのノブは、
制限付きのランタイム抜粋と、ランタイムが所有する注入ブロックのためのものです。
ブートストラップ制限、起動コンテキスト制限、Skills プロンプト制限とは別です。

`toolResultMaxChars` は高度な上限です（最大 `1000000` 文字）。未設定の場合、OpenClaw は
有効なモデルコンテキストウィンドウからライブツール結果の上限を選択します。100K トークン未満では `16000` 文字、
100K+ トークンでは `32000` 文字、200K+ トークンでは `64000` 文字で、いずれもランタイムのコンテキスト共有ガードによってさらに制限されます。

画像については、OpenClaw はプロバイダー呼び出しの前にトランスクリプト/ツール画像ペイロードをダウンスケールします。
これを調整するには `agents.defaults.imageMaxDimensionPx`（デフォルト: `1200`）を使用します。

- 低い値は通常、ビジョントークン使用量とペイロードサイズを削減します。
- 高い値は OCR/UI が多いスクリーンショットでより多くの視覚的ディテールを保持します。

実用的な内訳（注入ファイルごと、ツール、Skills、システムプロンプトサイズ）には、`/context list` または `/context detail` を使用します。[コンテキスト](/ja-JP/concepts/context) を参照してください。

## 現在のトークン使用量を確認する方法

チャットで以下を使用します。

- `/status` → セッションモデル、コンテキスト使用量、直近レスポンスの入力/出力トークン、およびアクティブモデルにローカル価格が設定されている場合の **推定コスト**を含む **絵文字豊富なステータスカード**。
- `/usage off|tokens|full` → すべての返信に **レスポンスごとの使用量フッター**を追加します。
  - セッションごとに保持されます（`responseUsage` として保存）。
  - `/usage reset`（エイリアス: `inherit`, `clear`, `default`） — セッションの上書きをクリアし、セッションが設定済みデフォルトを再継承するようにします。
  - `/usage full` は、OpenClaw に使用量メタデータがあり、アクティブモデルのローカル価格がある場合にのみ推定コストを表示します。それ以外の場合はトークンのみを表示します。
- `/usage cost` → OpenClaw セッションログからローカルコストサマリーを表示します。

その他の面:

- **TUI/Web TUI:** `/status` + `/usage` がサポートされています。
- **CLI:** `openclaw status --usage` と `openclaw channels list` は、
  正規化されたプロバイダークォータウィンドウ（レスポンスごとのコストではなく `X% left`）を表示します。
  現在の使用量ウィンドウプロバイダー: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, z.ai。

使用量面は、表示前に一般的なプロバイダーネイティブのフィールドエイリアスを正規化します。
OpenAI ファミリーの Responses トラフィックでは、これには `input_tokens` /
`output_tokens` と `prompt_tokens` / `completion_tokens` の両方が含まれるため、トランスポート固有の
フィールド名によって `/status`、`/usage`、またはセッションサマリーが変わることはありません。
Gemini CLI の使用量も正規化されます。デフォルトの `stream-json` パーサーは
アシスタントの `message` イベントを読み取り、CLI が明示的な
`stats.input` フィールドを省略した場合は、`stats.cached` が `cacheRead` にマップされ、
`stats.input_tokens - stats.cached` が使用されます。レガシー JSON 上書きでは、返信テキストを引き続き
`response` から読み取ります。
ネイティブ OpenAI ファミリーの Responses トラフィックでは、WebSocket/SSE の使用量エイリアスも
同じ方法で正規化され、`total_tokens` が欠落しているか `0` の場合、合計は正規化された入力 + 出力にフォールバックします。
現在のセッションスナップショットが疎な場合、`/status` と `session_status` は、
最新のトランスクリプト使用量ログからトークン/キャッシュカウンターとアクティブなランタイムモデルラベルも復元できます。
既存の非ゼロのライブ値はトランスクリプトのフォールバック値よりも優先され、保存済み合計が欠落しているか小さい場合は、
より大きなプロンプト指向のトランスクリプト合計が勝つことがあります。
プロバイダークォータウィンドウの使用量認証は、利用可能な場合はプロバイダー固有のフックから取得されます。
それ以外の場合、OpenClaw は認証プロファイル、環境変数、または設定から一致する OAuth/API キー認証情報にフォールバックします。
アシスタントのトランスクリプトエントリは、アクティブモデルに価格が設定され、プロバイダーが使用量メタデータを返す場合の
`usage.cost` を含め、同じ正規化済み使用量形状を永続化します。これにより、ライブランタイム状態がなくなった後でも、
`/usage cost` とトランスクリプトに基づくセッションステータスに安定したソースが提供されます。

OpenClaw は、プロバイダー使用量の会計を現在のコンテキストスナップショットとは分離して保持します。
プロバイダーの `usage.total` には、キャッシュ済み入力、出力、複数回の
ツールループモデル呼び出しが含まれることがあるため、コストとテレメトリには有用ですが、
ライブコンテキストウィンドウを過大表示する可能性があります。コンテキスト表示と診断では、
`context.used` に最新のプロンプトスナップショット（`promptTokens`、またはプロンプトスナップショットがない場合は直近のモデル呼び出し）を使用します。

## コスト推定（表示される場合）

コストはモデル価格設定から推定されます。

```
models.providers.<provider>.models[].cost
```

これらは `input`、`output`、`cacheRead`、`cacheWrite` の **100 万トークンあたりの USD** です。
価格設定がない場合、OpenClaw はトークンのみを表示します。コスト表示は API キー認証に限定されません。
`aws-sdk` などの非 API キープロバイダーも、設定済みモデルエントリにローカル価格が含まれ、
プロバイダーが使用量メタデータを返す場合は推定コストを表示できます。

サイドカーとチャネルが Gateway の準備完了パスに到達した後、OpenClaw は、
まだローカル価格を持たない設定済みモデル参照に対して、任意のバックグラウンド価格ブートストラップを開始します。
このブートストラップはリモートの OpenRouter と LiteLLM の価格カタログを取得します。オフラインまたは制限付きネットワークで
これらのカタログ取得をスキップするには、`models.pricing.enabled: false` を設定します。明示的な
`models.providers.*.models[].cost` エントリは、引き続きローカルコスト推定を駆動します。

## キャッシュ TTL と枝刈りの影響

プロバイダーのプロンプトキャッシュは、キャッシュ TTL ウィンドウ内でのみ適用されます。OpenClaw は
任意で **cache-ttl pruning** を実行できます。キャッシュ TTL が期限切れになった時点でセッションを枝刈りし、
その後キャッシュウィンドウをリセットすることで、以降のリクエストが全履歴を再キャッシュする代わりに
新しくキャッシュされたコンテキストを再利用できるようにします。これにより、セッションが TTL を超えてアイドルになった場合の
キャッシュ書き込みコストを低く保てます。

[Gateway 設定](/ja-JP/gateway/configuration) で設定し、
動作の詳細は [セッション枝刈り](/ja-JP/concepts/session-pruning) を参照してください。

Heartbeat は、アイドルの空白をまたいでキャッシュを **ウォーム**に保つことができます。モデルのキャッシュ TTL が
`1h` の場合、Heartbeat 間隔をそれより少し短く（例: `55m`）設定すると、
プロンプト全体の再キャッシュを避け、キャッシュ書き込みコストを削減できます。

マルチエージェント構成では、1 つの共有モデル設定を維持し、`agents.list[].params.cacheRetention` でエージェントごとにキャッシュ動作を調整できます。

ノブごとの完全なガイドは、[プロンプトキャッシュ](/ja-JP/reference/prompt-caching) を参照してください。

Anthropic API の価格では、キャッシュ読み取りは入力トークンより大幅に安く、
キャッシュ書き込みはより高い倍率で課金されます。最新の料金と TTL 倍率については、Anthropic のプロンプトキャッシュ価格を参照してください:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 例: Heartbeat で 1h キャッシュをウォームに保つ

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

### 例: エージェントごとのキャッシュ戦略を使う混在トラフィック

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # ほとんどのエージェントのデフォルト基準
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # 深いセッション向けに長いキャッシュをウォームに保つ
    - id: "alerts"
      params:
        cacheRetention: "none" # バースト的な通知でキャッシュ書き込みを避ける
```

`agents.list[].params` は選択されたモデルの `params` の上にマージされるため、
`cacheRetention` だけを上書きし、他のモデルデフォルトを変更せずに継承できます。

### Anthropic 1M コンテキスト

OpenClaw は Opus 4.8、Opus 4.7、Opus 4.6、
Sonnet 4.6 などの GA 対応 Claude 4.x モデルを、Anthropic の 1M コンテキストウィンドウでサイズ設定します。
これらのモデルに `params.context1m: true` は不要です。

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

古い設定では `context1m: true` を維持できますが、OpenClaw はこの設定に対して
Anthropic の廃止済み `context-1m-2025-08-07` ベータヘッダーを送信しなくなり、
サポートされていない古い Claude モデルを 1M に拡張しません。

要件: 認証情報が長文コンテキスト使用の対象である必要があります。対象でない場合、
Anthropic はそのリクエストに対してプロバイダー側のレート制限エラーを返します。

OAuth/サブスクリプショントークン（`sk-ant-oat-*`）で Anthropic を認証する場合、
OpenClaw は OAuth に必要な Anthropic ベータヘッダーを保持しつつ、古い設定に残っている場合は
廃止済みの `context-1m-*` ベータを取り除きます。

## トークン圧力を減らすヒント

- 長いセッションを要約するには `/compact` を使用します。
- ワークフロー内の大きなツール出力を削減します。
- スクリーンショットが多いセッションでは `agents.defaults.imageMaxDimensionPx` を下げます。
- Skills の説明を短く保ちます（Skills 一覧はプロンプトに注入されます）。
- 冗長で探索的な作業には小さめのモデルを優先します。

正確な Skills 一覧のオーバーヘッド計算式については、[Skills](/ja-JP/tools/skills) を参照してください。

## 関連

- [API 使用量とコスト](/ja-JP/reference/api-usage-costs)
- [プロンプトキャッシュ](/ja-JP/reference/prompt-caching)
- [使用量追跡](/ja-JP/concepts/usage-tracking)

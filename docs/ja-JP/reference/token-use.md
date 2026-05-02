---
read_when:
    - トークン使用量、コスト、またはコンテキストウィンドウの説明
    - コンテキストの増大や Compaction の動作のデバッグ
summary: OpenClaw がプロンプトコンテキストを構築し、トークン使用量とコストを報告する仕組み
title: トークン使用量とコスト
x-i18n:
    generated_at: "2026-05-02T21:06:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 648c1624aa81e896dacdbdc10784ca10fba2e43114823903da6455e7de512ace
    source_path: reference/token-use.md
    workflow: 16
---

# トークン使用量とコスト

OpenClaw は文字数ではなく **トークン** を追跡します。トークンはモデル固有ですが、ほとんどの
OpenAI 風モデルでは、英語テキストで平均して 1 トークンあたり約 4 文字です。

## システムプロンプトの構築方法

OpenClaw は実行のたびに独自のシステムプロンプトを組み立てます。含まれる内容は次のとおりです。

- ツール一覧 + 短い説明
- Skills 一覧（メタデータのみ。手順は必要に応じて `read` で読み込まれます）。
  コンパクトな Skills ブロックは `skills.limits.maxSkillsPromptChars` で上限が設定され、
  任意でエージェントごとのオーバーライドを
  `agents.list[].skillsLimits.maxSkillsPromptChars` に設定できます。
- 自己更新の手順
- ワークスペース + ブートストラップファイル（新規時の `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、存在する場合は `MEMORY.md`）。小文字のルート `memory.md` は注入されません。`MEMORY.md` と併用される場合に `openclaw doctor --fix` のレガシー修復入力になります。大きなファイルは `agents.defaults.bootstrapMaxChars`（デフォルト: 12000）で切り詰められ、ブートストラップ注入全体は `agents.defaults.bootstrapTotalMaxChars`（デフォルト: 60000）で上限が設定されます。`memory/*.md` の日次ファイルは通常のブートストラッププロンプトには含まれません。通常のターンではメモリツール経由でオンデマンドのままですが、リセット/起動時のモデル実行では、その最初のターン用に最近の日次メモリを含む 1 回限りの起動コンテキストブロックを先頭に追加できます。素のチャット `/new` と `/reset` コマンドは、モデルを呼び出さずに確認されます。起動プレリュードは `agents.defaults.startupContext` で制御されます。
- 時刻（UTC + ユーザーのタイムゾーン）
- 返信タグ + Heartbeat の動作
- ランタイムメタデータ（ホスト/OS/モデル/thinking）

詳しい内訳は [システムプロンプト](/ja-JP/concepts/system-prompt) を参照してください。

## コンテキストウィンドウに含まれるもの

モデルが受け取るすべてのものがコンテキスト制限にカウントされます。

- システムプロンプト（上記のすべてのセクション）
- 会話履歴（ユーザー + アシスタントメッセージ）
- ツール呼び出しとツール結果
- 添付ファイル/トランスクリプト（画像、音声、ファイル）
- Compaction サマリーと枝刈りアーティファクト
- プロバイダーのラッパーまたは安全性ヘッダー（表示されませんが、カウントされます）

ランタイム負荷の高い一部の面には、独自の明示的な上限があります。

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

エージェントごとのオーバーライドは `agents.list[].contextLimits` の下にあります。これらのノブは、
境界付きのランタイム抜粋とランタイム所有の注入ブロック用です。ブートストラップ制限、
起動コンテキスト制限、Skills プロンプト制限とは別です。

画像については、OpenClaw はプロバイダー呼び出しの前にトランスクリプト/ツール画像ペイロードを縮小します。
これを調整するには `agents.defaults.imageMaxDimensionPx`（デフォルト: `1200`）を使用します。

- 低い値にすると、通常はビジョントークン使用量とペイロードサイズが減ります。
- 高い値にすると、OCR/UI が多いスクリーンショットでより多くの視覚的詳細が保持されます。

実用的な内訳（注入されたファイルごと、ツール、Skills、システムプロンプトサイズ）を見るには、`/context list` または `/context detail` を使用します。[コンテキスト](/ja-JP/concepts/context) を参照してください。

## 現在のトークン使用量を確認する方法

チャットで次を使用します。

- `/status` → セッションモデル、コンテキスト使用量、
  直近レスポンスの入力/出力トークン、**推定コスト**（API キーのみ）を含む **絵文字付きのステータスカード**。
- `/usage off|tokens|full` → すべての返信に **レスポンスごとの使用量フッター** を追加します。
  - セッションごとに保持されます（`responseUsage` として保存）。
  - OAuth 認証では **コストが非表示** になります（トークンのみ）。
- `/usage cost` → OpenClaw セッションログからローカルのコスト概要を表示します。

その他の面:

- **TUI/Web TUI:** `/status` + `/usage` がサポートされています。
- **CLI:** `openclaw status --usage` と `openclaw channels list` は、
  正規化されたプロバイダーのクォータウィンドウ（レスポンスごとのコストではなく `X% left`）を表示します。
  現在の使用量ウィンドウのプロバイダー: Anthropic、GitHub Copilot、Gemini CLI、
  OpenAI Codex、MiniMax、Xiaomi、z.ai。

使用量表示では、表示前に一般的なプロバイダー固有フィールドのエイリアスを正規化します。
OpenAI 系 Responses トラフィックでは、これに `input_tokens` /
`output_tokens` と `prompt_tokens` / `completion_tokens` の両方が含まれるため、トランスポート固有の
フィールド名によって `/status`、`/usage`、セッションサマリーは変わりません。
Gemini CLI の JSON 使用量も正規化されます。返信テキストは `response` から取得され、
`stats.cached` は `cacheRead` にマップされ、CLI が明示的な `stats.input` フィールドを省略した場合は
`stats.input_tokens - stats.cached` が使用されます。
ネイティブの OpenAI 系 Responses トラフィックでは、WebSocket/SSE の使用量エイリアスも
同じ方法で正規化され、`total_tokens` がないか `0` の場合は、合計が正規化された入力 + 出力にフォールバックします。
現在のセッションスナップショットが疎な場合、`/status` と `session_status` は、
最新のトランスクリプト使用量ログからトークン/キャッシュカウンターとアクティブなランタイムモデルラベルを復元することもできます。
既存のゼロでないライブ値は、引き続きトランスクリプトフォールバック値より優先されます。また、保存済み合計がないか小さい場合は、
より大きなプロンプト指向のトランスクリプト合計が優先されることがあります。
プロバイダーのクォータウィンドウ用の使用量認証は、利用可能な場合はプロバイダー固有のフックから取得されます。
それ以外の場合、OpenClaw は認証プロファイル、環境、または設定から一致する OAuth/API キー資格情報にフォールバックします。
アシスタントのトランスクリプトエントリは、アクティブモデルに価格が設定され、プロバイダーが使用量メタデータを返す場合の
`usage.cost` を含め、同じ正規化済み使用量形式を保持します。これにより、ライブのランタイム状態がなくなった後でも、
`/usage cost` とトランスクリプトに基づくセッションステータスに安定したソースが提供されます。

OpenClaw は、プロバイダー使用量の会計を現在のコンテキストスナップショットとは別に保持します。
プロバイダーの `usage.total` には、キャッシュ済み入力、出力、複数のツールループモデル呼び出しが含まれることがあるため、
コストとテレメトリには有用ですが、ライブのコンテキストウィンドウを過大評価することがあります。コンテキスト表示と診断では、
`context.used` に最新のプロンプトスナップショット（`promptTokens`、またはプロンプトスナップショットが利用できない場合は直近のモデル呼び出し）を使用します。

## コスト推定（表示される場合）

コストはモデル価格設定の設定から推定されます。

```
models.providers.<provider>.models[].cost
```

これらは `input`、`output`、`cacheRead`、`cacheWrite` の **100 万トークンあたりの USD** です。
価格設定がない場合、OpenClaw はトークンのみを表示します。OAuth トークンではドル建てコストは表示されません。

サイドカーとチャンネルが Gateway の準備完了パスに到達した後、OpenClaw は、ローカル価格設定がまだない設定済みモデル参照に対して
任意のバックグラウンド価格設定ブートストラップを開始します。このブートストラップはリモートの OpenRouter と LiteLLM の
価格カタログを取得します。オフラインまたは制限付きネットワークでそれらのカタログ取得をスキップするには、
`models.pricing.enabled: false` を設定します。明示的な
`models.providers.*.models[].cost` エントリは、引き続きローカルのコスト推定を駆動します。

## キャッシュ TTL と枝刈りの影響

プロバイダーのプロンプトキャッシュは、キャッシュ TTL ウィンドウ内でのみ適用されます。OpenClaw は任意で
**キャッシュ TTL 枝刈り** を実行できます。キャッシュ TTL が期限切れになるとセッションを枝刈りし、
その後キャッシュウィンドウをリセットすることで、以降のリクエストが履歴全体を再キャッシュするのではなく、
新しくキャッシュされたコンテキストを再利用できるようにします。これにより、セッションが TTL を超えてアイドルになった場合の
キャッシュ書き込みコストを低く保てます。

[Gateway 設定](/ja-JP/gateway/configuration)で設定し、動作の詳細は
[セッション枝刈り](/ja-JP/concepts/session-pruning)を参照してください。

Heartbeat はアイドルの間隔をまたいでキャッシュを **温かく** 保てます。モデルのキャッシュ TTL が `1h` の場合、
Heartbeat 間隔をそれより少し短く（例: `55m`）設定すると、完全なプロンプトの再キャッシュを避けられ、
キャッシュ書き込みコストを削減できます。

マルチエージェント構成では、共有モデル設定を 1 つ維持しながら、
`agents.list[].params.cacheRetention` でエージェントごとにキャッシュ動作を調整できます。

すべてのノブについての詳しいガイドは、[プロンプトキャッシュ](/ja-JP/reference/prompt-caching)を参照してください。

Anthropic API の価格では、キャッシュ読み取りは入力トークンより大幅に安価ですが、
キャッシュ書き込みは高い倍率で課金されます。最新の料金と TTL 倍率については Anthropic の
プロンプトキャッシュ価格を参照してください:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 例: Heartbeat で 1h キャッシュを温かく保つ

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

### 例: エージェントごとのキャッシュ戦略を持つ混合トラフィック

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

`agents.list[].params` は選択したモデルの `params` の上にマージされるため、
`cacheRetention` だけをオーバーライドし、他のモデルデフォルトは変更せずに継承できます。

### 例: Anthropic 1M コンテキストベータヘッダーを有効にする

Anthropic の 1M コンテキストウィンドウは現在ベータゲートされています。OpenClaw は、サポートされている Opus
または Sonnet モデルで `context1m` を有効にした場合に、必要な `anthropic-beta` 値を注入できます。

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

これは Anthropic の `context-1m-2025-08-07` ベータヘッダーにマップされます。

これは、そのモデルエントリで `context1m: true` が設定されている場合にのみ適用されます。

要件: 資格情報が長いコンテキストの使用に適格である必要があります。適格でない場合、
Anthropic はそのリクエストに対してプロバイダー側のレート制限エラーで応答します。

OAuth/サブスクリプショントークン（`sk-ant-oat-*`）で Anthropic を認証する場合、
Anthropic は現在その組み合わせを HTTP 401 で拒否するため、OpenClaw は `context-1m-*` ベータヘッダーをスキップします。

## トークン圧迫を減らすためのヒント

- 長いセッションを要約するには `/compact` を使用します。
- ワークフロー内の大きなツール出力を削ります。
- スクリーンショットが多いセッションでは `agents.defaults.imageMaxDimensionPx` を下げます。
- Skill の説明を短く保ちます（Skill 一覧はプロンプトに注入されます）。
- 冗長で探索的な作業には、より小さいモデルを優先します。

正確な Skill 一覧のオーバーヘッド計算式については、[Skills](/ja-JP/tools/skills) を参照してください。

## 関連

- [API 使用量とコスト](/ja-JP/reference/api-usage-costs)
- [プロンプトキャッシュ](/ja-JP/reference/prompt-caching)
- [使用量追跡](/ja-JP/concepts/usage-tracking)

---
read_when:
    - トークン使用量、コスト、またはコンテキストウィンドウの説明
    - コンテキストの増大またはCompactionの動作をデバッグする
summary: OpenClaw がプロンプトコンテキストを構築し、トークン使用量とコストを報告する仕組み
title: トークン使用量とコスト
x-i18n:
    generated_at: "2026-05-06T09:09:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51c0fc6bdfb32edc1908d0a25ddbc0e90d745ef38fede02fbeca612ca1a5f59e
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw は文字数ではなく **トークン** を追跡します。トークンはモデルごとに異なりますが、ほとんどの
OpenAI 形式のモデルでは、英語テキストで 1 トークンあたり平均約 4 文字です。

## システムプロンプトの構築方法

OpenClaw は実行ごとに独自のシステムプロンプトを組み立てます。含まれるものは次のとおりです。

- ツール一覧 + 短い説明
- Skills 一覧（メタデータのみ。手順は必要に応じて `read` で読み込まれます）。
  コンパクトな Skills ブロックは `skills.limits.maxSkillsPromptChars` によって制限され、
  エージェントごとの任意の上書きは
  `agents.list[].skillsLimits.maxSkillsPromptChars` で指定できます。
- 自己更新手順
- ワークスペース + ブートストラップファイル（新規の場合は `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、存在する場合は `MEMORY.md`）。小文字のルート `memory.md` は注入されません。これは `MEMORY.md` と組み合わせた場合に `openclaw doctor --fix` 用のレガシー修復入力です。大きなファイルは `agents.defaults.bootstrapMaxChars`（デフォルト: 12000）によって切り詰められ、ブートストラップ注入全体は `agents.defaults.bootstrapTotalMaxChars`（デフォルト: 60000）で上限が設定されます。`memory/*.md` の日次ファイルは通常のブートストラッププロンプトの一部ではありません。通常のターンではメモリツール経由のオンデマンドのままですが、リセット/起動時のモデル実行では、その最初のターンに最近の日次メモリを含む一回限りの起動コンテキストブロックを先頭に付加できます。素のチャット `/new` および `/reset` コマンドは、モデルを呼び出さずに確認応答されます。起動プレリュードは `agents.defaults.startupContext` によって制御されます。
- 時刻（UTC + ユーザーのタイムゾーン）
- 返信タグ + Heartbeat の動作
- ランタイムメタデータ（ホスト/OS/モデル/thinking）

完全な内訳は [システムプロンプト](/ja-JP/concepts/system-prompt) を参照してください。

## コンテキストウィンドウに含まれるもの

モデルが受け取るすべてのものがコンテキスト制限にカウントされます。

- システムプロンプト（上記に列挙したすべてのセクション）
- 会話履歴（ユーザー + アシスタントメッセージ）
- ツール呼び出しとツール結果
- 添付ファイル/トランスクリプト（画像、音声、ファイル）
- Compaction サマリーとプルーニング成果物
- プロバイダーラッパーまたは安全性ヘッダー（表示されませんが、カウントされます）

ランタイム負荷の高い一部のサーフェスには、独自の明示的な上限があります。

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

エージェントごとの上書きは `agents.list[].contextLimits` 配下にあります。これらのノブは、
制限付きのランタイム抜粋とランタイム所有の注入ブロック用です。ブートストラップ制限、
起動コンテキスト制限、Skills プロンプト制限とは別です。

画像については、OpenClaw はプロバイダー呼び出しの前にトランスクリプト/ツール画像ペイロードを縮小します。
これを調整するには `agents.defaults.imageMaxDimensionPx`（デフォルト: `1200`）を使用します。

- 低い値にすると、通常はビジョントークン使用量とペイロードサイズが減ります。
- 高い値にすると、OCR/UI の多いスクリーンショットでより多くの視覚的詳細を保持できます。

実用的な内訳（注入ファイル、ツール、Skills、システムプロンプトサイズごと）を確認するには、`/context list` または `/context detail` を使用します。[コンテキスト](/ja-JP/concepts/context) を参照してください。

## 現在のトークン使用量を確認する方法

チャットで次を使用します。

- `/status` → セッションモデル、コンテキスト使用量、
  直近応答の入力/出力トークン、**推定コスト**（API キーのみ）を含む **絵文字付きステータスカード**。
- `/usage off|tokens|full` → すべての返信に **応答ごとの使用量フッター** を追加します。
  - セッションごとに永続化されます（`responseUsage` として保存）。
  - OAuth 認証では **コストは非表示** です（トークンのみ）。
- `/usage cost` → OpenClaw セッションログからローカルコストサマリーを表示します。

その他のサーフェス:

- **TUI/Web TUI:** `/status` + `/usage` がサポートされています。
- **CLI:** `openclaw status --usage` と `openclaw channels list` は、
  正規化されたプロバイダークォータウィンドウ（応答ごとのコストではなく `X% left`）を表示します。
  現在の使用量ウィンドウプロバイダー: Anthropic、GitHub Copilot、Gemini CLI、
  OpenAI Codex、MiniMax、Xiaomi、z.ai。

使用量サーフェスは、表示前に一般的なプロバイダー固有フィールドの別名を正規化します。
OpenAI ファミリーの Responses トラフィックでは、これには `input_tokens` /
`output_tokens` と `prompt_tokens` / `completion_tokens` の両方が含まれるため、トランスポート固有の
フィールド名によって `/status`、`/usage`、セッションサマリーが変わることはありません。
Gemini CLI の JSON 使用量も正規化されます。返信テキストは `response` から取得され、
`stats.cached` は `cacheRead` に対応し、CLI が明示的な `stats.input` フィールドを省略した場合は
`stats.input_tokens - stats.cached` が使用されます。
ネイティブの OpenAI ファミリー Responses トラフィックでは、WebSocket/SSE の使用量エイリアスも
同じ方法で正規化され、`total_tokens` が存在しない、または `0` の場合は、合計が正規化された入力 + 出力にフォールバックします。
現在のセッションスナップショットがまばらな場合、`/status` と `session_status` は
直近のトランスクリプト使用量ログからトークン/キャッシュカウンターとアクティブなランタイムモデルラベルも復元できます。
既存のゼロでないライブ値は引き続きトランスクリプトフォールバック値より優先され、保存済み合計がない、または小さい場合は、より大きいプロンプト指向の
トランスクリプト合計が優先されることがあります。
プロバイダークォータウィンドウの使用量認証は、利用可能な場合はプロバイダー固有フックから取得されます。
それ以外の場合、OpenClaw は認証プロファイル、環境変数、または設定から一致する OAuth/API キー資格情報にフォールバックします。
アシスタントのトランスクリプトエントリは、プロバイダーが使用量メタデータを返し、アクティブモデルに価格が設定されている場合の
`usage.cost` を含め、同じ正規化済み使用量形状を永続化します。これにより、ライブランタイム状態がなくなった後でも
`/usage cost` とトランスクリプトに基づくセッションステータスに安定したソースが提供されます。

OpenClaw は、プロバイダー使用量の会計を現在のコンテキスト
スナップショットとは分けて保持します。プロバイダーの `usage.total` には、キャッシュ済み入力、出力、複数の
ツールループモデル呼び出しが含まれる場合があるため、コストとテレメトリには有用ですが、
ライブコンテキストウィンドウを過大に示すことがあります。コンテキスト表示と診断では、最新のプロンプト
スナップショット（`promptTokens`、またはプロンプトスナップショットが利用できない場合は直近のモデル呼び出し）を `context.used` に使用します。

## コスト推定（表示される場合）

コストはモデル価格設定から推定されます。

```
models.providers.<provider>.models[].cost
```

これらは `input`、`output`、`cacheRead`、`cacheWrite` の **100 万トークンあたりの USD** です。
価格がない場合、OpenClaw はトークンのみを表示します。OAuth トークンでは
ドル建てコストは表示されません。

サイドカーとチャネルが Gateway ready パスに到達すると、OpenClaw は、まだローカル価格がない
設定済みモデル参照に対して、任意のバックグラウンド価格ブートストラップを開始します。
そのブートストラップは、リモートの OpenRouter と LiteLLM の価格カタログを取得します。
オフラインまたは制限付きネットワークでこれらのカタログ取得をスキップするには、`models.pricing.enabled: false` を設定します。明示的な
`models.providers.*.models[].cost` エントリは引き続きローカルコスト
推定を駆動します。

## キャッシュ TTL とプルーニングの影響

プロバイダープロンプトキャッシュは、キャッシュ TTL ウィンドウ内でのみ適用されます。OpenClaw は任意で
**cache-ttl プルーニング** を実行できます。キャッシュ TTL が期限切れになるとセッションをプルーニングし、その後キャッシュウィンドウをリセットして、以降のリクエストが
履歴全体を再キャッシュする代わりに、新しくキャッシュされたコンテキストを再利用できるようにします。これにより、セッションが TTL を超えてアイドルになった場合の
キャッシュ書き込みコストを低く保てます。

[Gateway 設定](/ja-JP/gateway/configuration) で設定し、
動作の詳細は [セッションプルーニング](/ja-JP/concepts/session-pruning) を参照してください。

Heartbeat はアイドルのギャップをまたいでキャッシュを **温かい** 状態に保てます。モデルキャッシュ TTL が
`1h` の場合、Heartbeat 間隔をその少し下（例: `55m`）に設定すると、
プロンプト全体の再キャッシュを避け、キャッシュ書き込みコストを削減できます。

マルチエージェント構成では、1 つの共有モデル設定を維持しつつ、
`agents.list[].params.cacheRetention` でエージェントごとにキャッシュ動作を調整できます。

ノブごとの完全なガイドは [プロンプトキャッシュ](/ja-JP/reference/prompt-caching) を参照してください。

Anthropic API の価格設定では、キャッシュ読み取りは入力トークンより大幅に安価である一方、
キャッシュ書き込みはより高い倍率で課金されます。最新のレートと TTL 倍率については、Anthropic の
プロンプトキャッシュ価格設定を参照してください:
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

### 例: エージェントごとのキャッシュ戦略を使った混在トラフィック

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

`agents.list[].params` は選択されたモデルの `params` の上にマージされるため、
`cacheRetention` だけを上書きし、他のモデルデフォルトは変更せずに継承できます。

### 例: Anthropic 1M コンテキストベータヘッダーを有効にする

Anthropic の 1M コンテキストウィンドウは現在ベータゲートされています。OpenClaw は、対応する Opus
または Sonnet モデルで `context1m` を有効にすると、必要な
`anthropic-beta` 値を注入できます。

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

これは Anthropic の `context-1m-2025-08-07` ベータヘッダーに対応します。

これは、そのモデルエントリで `context1m: true` が設定されている場合にのみ適用されます。

要件: 資格情報が長コンテキスト使用の対象である必要があります。対象でない場合、
Anthropic はそのリクエストに対してプロバイダー側のレート制限エラーで応答します。

OAuth/サブスクリプショントークン（`sk-ant-oat-*`）で Anthropic に認証する場合、
OpenClaw は `context-1m-*` ベータヘッダーをスキップします。Anthropic が現在、
その組み合わせを HTTP 401 で拒否するためです。

## トークン圧を減らすためのヒント

- 長いセッションを要約するには `/compact` を使用します。
- ワークフロー内の大きなツール出力を削減します。
- スクリーンショットの多いセッションでは `agents.defaults.imageMaxDimensionPx` を下げます。
- Skill の説明は短く保ちます（Skill 一覧はプロンプトに注入されます）。
- 冗長で探索的な作業には、より小さいモデルを優先します。

正確な Skill 一覧のオーバーヘッド式については [Skills](/ja-JP/tools/skills) を参照してください。

## 関連

- [API 使用量とコスト](/ja-JP/reference/api-usage-costs)
- [プロンプトキャッシュ](/ja-JP/reference/prompt-caching)
- [使用量追跡](/ja-JP/concepts/usage-tracking)

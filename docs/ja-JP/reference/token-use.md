---
read_when:
    - トークン使用量、コスト、またはコンテキストウィンドウの説明
    - コンテキストの増大またはCompactionの動作のデバッグ
summary: OpenClaw がプロンプトコンテキストを構築し、トークン使用量とコストをレポートする仕組み
title: トークンの使用量とコスト
x-i18n:
    generated_at: "2026-04-30T05:34:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: a3807ccae3313a731c2673edace8a5b37dc22259d436a67b4d787e45682dad3c
    source_path: reference/token-use.md
    workflow: 16
---

# トークン使用量とコスト

OpenClaw は文字数ではなく **トークン** を追跡します。トークンはモデルごとに異なりますが、ほとんどの
OpenAI スタイルのモデルでは、英語テキストで平均して 1 トークンあたり約 4 文字です。

## システムプロンプトの構築方法

OpenClaw は実行ごとに独自のシステムプロンプトを組み立てます。含まれる内容は次のとおりです。

- ツール一覧 + 短い説明
- Skills 一覧（メタデータのみ。手順は必要に応じて `read` で読み込まれます）。
  コンパクトな Skills ブロックは `skills.limits.maxSkillsPromptChars` によって制限され、
  エージェントごとの任意のオーバーライドは
  `agents.list[].skillsLimits.maxSkillsPromptChars` にあります。
- 自己更新手順
- ワークスペース + ブートストラップファイル（新規時の `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` に加え、存在する場合は `MEMORY.md`）。小文字のルート `memory.md` は注入されません。これは `MEMORY.md` と組み合わせた場合に `openclaw doctor --fix` のレガシー修復入力として使われます。大きいファイルは `agents.defaults.bootstrapMaxChars`（デフォルト: 12000）で切り詰められ、ブートストラップ注入全体は `agents.defaults.bootstrapTotalMaxChars`（デフォルト: 60000）で上限が設定されます。`memory/*.md` の日次ファイルは通常のブートストラッププロンプトには含まれません。通常ターンではメモリツールを通じてオンデマンドのままですが、リセット/起動時のモデル実行では、その最初のターンに最近の日次メモリを含む一回限りの起動コンテキストブロックを先頭に追加できます。素のチャット `/new` と `/reset` コマンドは、モデルを呼び出さずに確認応答されます。起動プレリュードは `agents.defaults.startupContext` で制御されます。
- 時刻（UTC + ユーザーのタイムゾーン）
- 返信タグ + Heartbeat の動作
- ランタイムメタデータ（ホスト/OS/モデル/thinking）

詳細な内訳は [システムプロンプト](/ja-JP/concepts/system-prompt) を参照してください。

## コンテキストウィンドウに含まれるもの

モデルが受け取るすべてのものがコンテキスト上限にカウントされます。

- システムプロンプト（上記のすべてのセクション）
- 会話履歴（ユーザー + アシスタントのメッセージ）
- ツール呼び出しとツール結果
- 添付ファイル/トランスクリプト（画像、音声、ファイル）
- Compaction の要約と枝刈りアーティファクト
- プロバイダーのラッパーまたは安全性ヘッダー（表示されませんが、カウントされます）

ランタイム負荷が高い一部のサーフェスには、独自の明示的な上限があります。

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

エージェントごとのオーバーライドは `agents.list[].contextLimits` の下にあります。これらのノブは、
制限付きのランタイム抜粋と、ランタイム所有の注入ブロック向けです。ブートストラップ上限、起動コンテキスト上限、Skills プロンプト上限とは
別です。

画像については、OpenClaw はプロバイダー呼び出しの前にトランスクリプト/ツール画像ペイロードを縮小します。
これを調整するには `agents.defaults.imageMaxDimensionPx`（デフォルト: `1200`）を使用します。

- 値を小さくすると、通常はビジョントークン使用量とペイロードサイズが減ります。
- 値を大きくすると、OCR/UI が多いスクリーンショットでより多くの視覚的詳細を保持できます。

実用的な内訳（注入ファイルごと、ツール、Skills、システムプロンプトサイズ）を見るには、`/context list` または `/context detail` を使用します。[コンテキスト](/ja-JP/concepts/context) を参照してください。

## 現在のトークン使用量を確認する方法

チャットで次を使用します。

- `/status` → セッションモデル、コンテキスト使用量、
  直近のレスポンスの入力/出力トークン、**推定コスト**（API キーのみ）を含む **絵文字が豊富なステータスカード**。
- `/usage off|tokens|full` → すべての返信に **レスポンスごとの使用量フッター** を追加します。
  - セッションごとに永続化されます（`responseUsage` として保存）。
  - OAuth 認証では **コストが非表示** になります（トークンのみ）。
- `/usage cost` → OpenClaw セッションログからローカルのコスト要約を表示します。

その他のサーフェス:

- **TUI/Web TUI:** `/status` + `/usage` がサポートされています。
- **CLI:** `openclaw status --usage` と `openclaw channels list` は
  正規化されたプロバイダーのクォータウィンドウ（レスポンスごとのコストではなく `X% left`）を表示します。
  現在の使用量ウィンドウプロバイダー: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, z.ai。

使用量サーフェスでは、表示前に一般的なプロバイダーネイティブのフィールド別名を正規化します。
OpenAI ファミリーの Responses トラフィックでは、`input_tokens` /
`output_tokens` と `prompt_tokens` / `completion_tokens` の両方が含まれるため、トランスポート固有の
フィールド名によって `/status`、`/usage`、セッション要約が変わることはありません。
Gemini CLI の JSON 使用量も正規化されます。返信テキストは `response` から取得され、
`stats.cached` は `cacheRead` にマップされ、CLI が明示的な `stats.input` フィールドを省略した場合は
`stats.input_tokens - stats.cached` が使用されます。
ネイティブの OpenAI ファミリー Responses トラフィックでは、WebSocket/SSE の使用量別名も
同じ方法で正規化され、`total_tokens` が存在しないか `0` の場合は、合計は正規化された入力 + 出力にフォールバックします。
現在のセッションスナップショットが疎な場合、`/status` と `session_status` は、
最新のトランスクリプト使用量ログからトークン/キャッシュカウンターとアクティブなランタイムモデルラベルも復元できます。
既存のゼロでないライブ値は引き続きトランスクリプトのフォールバック値より優先され、
保存済みの合計が存在しないか小さい場合は、より大きいプロンプト指向の
トランスクリプト合計が採用されることがあります。
プロバイダーのクォータウィンドウの使用量認証は、利用可能な場合はプロバイダー固有のフックから取得されます。
それ以外の場合、OpenClaw は認証プロファイル、環境変数、または設定から一致する OAuth/API キー認証情報にフォールバックします。
アシスタントのトランスクリプトエントリは、アクティブなモデルに価格設定が構成され、プロバイダーが使用量メタデータを返す場合の
`usage.cost` を含め、同じ正規化された使用量形状を永続化します。これにより、ライブランタイム状態がなくなった後でも、
`/usage cost` とトランスクリプトに基づくセッションステータスに安定したソースが提供されます。

OpenClaw はプロバイダーの使用量会計を現在のコンテキストスナップショットとは分離して保持します。
プロバイダーの `usage.total` には、キャッシュされた入力、出力、複数の
ツールループのモデル呼び出しが含まれることがあるため、コストとテレメトリには有用ですが、
ライブコンテキストウィンドウを過大に示す場合があります。コンテキスト表示と診断では、`context.used` に最新のプロンプト
スナップショット（`promptTokens`、またはプロンプトスナップショットがない場合は直近のモデル呼び出し）を使用します。

## コスト見積もり（表示される場合）

コストはモデル価格設定に基づいて見積もられます。

```
models.providers.<provider>.models[].cost
```

これらは `input`、`output`、`cacheRead`、`cacheWrite` の **100 万トークンあたりの USD** です。価格設定がない場合、OpenClaw はトークンのみを表示します。OAuth トークンではドルコストは表示されません。

Gateway 起動時には、ローカル価格設定がまだない構成済みモデル参照に対して、任意のバックグラウンド価格ブートストラップも実行されます。そのブートストラップは、リモートの OpenRouter と LiteLLM の価格カタログを取得します。オフラインまたは制限されたネットワークで起動時のカタログ取得をスキップするには、`models.pricing.enabled: false` を設定してください。明示的な `models.providers.*.models[].cost` エントリは引き続きローカルのコスト見積もりに使用されます。

## キャッシュ TTL と枝刈りの影響

プロバイダーのプロンプトキャッシュは、キャッシュ TTL ウィンドウ内でのみ適用されます。OpenClaw は任意で **cache-ttl 枝刈り** を実行できます。キャッシュ TTL が期限切れになるとセッションを枝刈りし、その後キャッシュウィンドウをリセットすることで、以後のリクエストが全履歴を再キャッシュする代わりに、新しくキャッシュされたコンテキストを再利用できるようにします。これにより、セッションが TTL を超えてアイドルになった場合のキャッシュ書き込みコストを低く抑えられます。

[Gateway 設定](/ja-JP/gateway/configuration) で構成し、動作の詳細は [セッション枝刈り](/ja-JP/concepts/session-pruning) を参照してください。

Heartbeat はアイドル期間をまたいでキャッシュを **温かい** 状態に保つことができます。モデルのキャッシュ TTL が `1h` の場合、Heartbeat 間隔をそれより少し短く（例: `55m`）設定すると、完全なプロンプトの再キャッシュを避け、キャッシュ書き込みコストを削減できます。

マルチエージェント構成では、共有モデル設定を 1 つ維持しつつ、`agents.list[].params.cacheRetention` でエージェントごとにキャッシュ動作を調整できます。

すべてのノブを個別に説明した完全なガイドは、[プロンプトキャッシュ](/ja-JP/reference/prompt-caching) を参照してください。

Anthropic API 価格では、キャッシュ読み取りは入力トークンより大幅に安価ですが、キャッシュ書き込みはより高い倍率で課金されます。最新のレートと TTL 係数については、Anthropic のプロンプトキャッシュ価格を参照してください:
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
`cacheRetention` だけをオーバーライドし、他のモデルデフォルトは変更せずに継承できます。

### 例: Anthropic 1M コンテキストベータヘッダーを有効にする

Anthropic の 1M コンテキストウィンドウは現在ベータ制限されています。OpenClaw は、サポートされる Opus
または Sonnet モデルで `context1m` を有効にした場合に、必要な
`anthropic-beta` 値を注入できます。

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

要件: 認証情報がロングコンテキスト使用の対象である必要があります。対象でない場合、
Anthropic はそのリクエストに対してプロバイダー側のレート制限エラーで応答します。

OAuth/サブスクリプショントークン（`sk-ant-oat-*`）で Anthropic を認証している場合、
Anthropic が現在 HTTP 401 でその組み合わせを拒否するため、OpenClaw は `context-1m-*` ベータヘッダーをスキップします。

## トークン圧力を下げるためのヒント

- 長いセッションを要約するには `/compact` を使用します。
- ワークフロー内の大きいツール出力を削減します。
- スクリーンショットが多いセッションでは `agents.defaults.imageMaxDimensionPx` を下げます。
- Skills の説明は短く保ちます（Skills 一覧はプロンプトに注入されます）。
- 冗長で探索的な作業には、より小さいモデルを優先します。

正確な Skills 一覧のオーバーヘッド計算式については、[Skills](/ja-JP/tools/skills) を参照してください。

## 関連

- [API 使用量とコスト](/ja-JP/reference/api-usage-costs)
- [プロンプトキャッシュ](/ja-JP/reference/prompt-caching)
- [使用量追跡](/ja-JP/concepts/usage-tracking)

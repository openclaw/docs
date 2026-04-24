---
read_when:
    - token 使用量、コスト、またはコンテキストウィンドウを説明する場合
    - コンテキスト増大や Compaction の動作をデバッグする場合
summary: OpenClaw がプロンプトコンテキストを構築し、token 使用量とコストをどのように報告するか
title: トークン使用量とコスト
x-i18n:
    generated_at: "2026-04-24T05:21:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a95e7592a06bd750c0bfc9303d8cec2a538756e95f35c3001dc960cfebcadbf
    source_path: reference/token-use.md
    workflow: 15
---

# トークン使用量とコスト

OpenClaw は**文字数ではなくトークン**を追跡します。トークンはモデルごとに異なりますが、多くの
OpenAI 方式モデルでは英語テキストで平均して 1 トークンあたり約 4 文字です。

## システムプロンプトの構築方法

OpenClaw は毎回の実行で独自のシステムプロンプトを組み立てます。これには次が含まれます。

- Tool リスト + 短い説明
- Skills リスト（メタデータのみ。指示は `read` により必要時に読み込まれます）。
  コンパクトな skills ブロックは `skills.limits.maxSkillsPromptChars` で制限され、
  オプションのエージェントごとの上書きは
  `agents.list[].skillsLimits.maxSkillsPromptChars` です。
- 自己更新の指示
- workspace + bootstrap ファイル（`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, 新規時は `BOOTSTRAP.md`、存在する場合は `MEMORY.md`）。ルートの小文字 `memory.md` は注入されません。これは `MEMORY.md` と組み合わせたときの `openclaw doctor --fix` 用の旧来修復入力です。大きなファイルは `agents.defaults.bootstrapMaxChars`（デフォルト: 12000）で切り詰められ、bootstrap 注入全体は `agents.defaults.bootstrapTotalMaxChars`（デフォルト: 60000）で上限が設定されます。`memory/*.md` の日次ファイルは通常の bootstrap プロンプトには含まれません。通常のターンでは memory tools によるオンデマンドのままですが、素の `/new` と `/reset` では、その最初のターンに限り最近の日次 memory を含む one-shot の startup-context ブロックが先頭に追加されることがあります。その startup prelude は `agents.defaults.startupContext` で制御されます。
- 時刻（UTC + ユーザータイムゾーン）
- 返信タグ + Heartbeat 動作
- ランタイムメタデータ（host/OS/model/thinking）

完全な内訳は [System Prompt](/ja-JP/concepts/system-prompt) を参照してください。

## コンテキストウィンドウに含まれるもの

モデルが受け取るものはすべてコンテキスト制限に含まれます。

- システムプロンプト（上記のすべてのセクション）
- 会話履歴（ユーザー + アシスタントメッセージ）
- Tool 呼び出しと tool 結果
- 添付ファイル/トランスクリプト（画像、音声、ファイル）
- Compaction の要約と pruning アーティファクト
- プロバイダーラッパーや安全性ヘッダー（見えなくてもカウントされる）

一部のランタイム負荷が高いサーフェスには、独自の明示的上限もあります。

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

エージェントごとの上書きは `agents.list[].contextLimits` 配下にあります。これらの設定項目は、
境界付きランタイム抜粋と、ランタイム所有の注入ブロック向けです。これらは
bootstrap 制限、startup-context 制限、skills プロンプト制限とは別です。

画像については、OpenClaw は provider 呼び出し前に transcript/tool 画像ペイロードを縮小します。
これを調整するには `agents.defaults.imageMaxDimensionPx`（デフォルト: `1200`）を使います。

- 値を小さくすると、通常は vision-token 使用量とペイロードサイズが減ります。
- 値を大きくすると、OCR/UI 中心のスクリーンショットでより多くの視覚的詳細を保持します。

実践的な内訳（注入ファイルごと、tools、Skills、システムプロンプトサイズごと）を見るには、`/context list` または `/context detail` を使ってください。[Context](/ja-JP/concepts/context) を参照してください。

## 現在のトークン使用量を見る方法

チャット内では次を使います。

- `/status` → セッションモデル、コンテキスト使用量、
  直近応答の入力/出力トークン、**推定コスト**（API キー時のみ）を表示する**絵文字豊富なステータスカード**。
- `/usage off|tokens|full` → すべての返信に**応答ごとの usage フッター**を追加します。
  - セッションごとに永続化されます（`responseUsage` として保存）。
  - OAuth auth では**コストを非表示**にします（トークンのみ）。
- `/usage cost` → OpenClaw セッションログからローカルのコスト概要を表示します。

その他のサーフェス:

- **TUI/Web TUI:** `/status` + `/usage` をサポート。
- **CLI:** `openclaw status --usage` と `openclaw channels list` は
  正規化された provider quota window（応答ごとのコストではなく `X% left`）を表示します。
  現在の usage-window provider: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, z.ai。

usage サーフェスは、表示前に一般的な provider ネイティブのフィールドエイリアスを正規化します。
OpenAI 系 Responses トラフィックでは、これには `input_tokens` /
`output_tokens` と `prompt_tokens` / `completion_tokens` の両方が含まれるため、トランスポート固有の
フィールド名が `/status`、`/usage`、またはセッション概要を変えることはありません。
Gemini CLI JSON usage も正規化されます。返信テキストは `response` から取得され、
`stats.cached` は `cacheRead` にマッピングされ、CLI が明示的な `stats.input` フィールドを省略した場合は
`stats.input_tokens - stats.cached` が使われます。
ネイティブ OpenAI 系 Responses トラフィックでは、WebSocket/SSE の usage エイリアスも
同じように正規化され、`total_tokens` が欠けている、または `0` の場合は、合計値は正規化済み入力 + 出力にフォールバックします。
現在のセッションスナップショットが疎な場合、`/status` と `session_status` は
最新のトランスクリプト usage ログから token/cache カウンターとアクティブなランタイムモデルラベルも復元できます。既存の非ゼロのライブ値は引き続きトランスクリプト由来のフォールバック値より優先され、保存済み合計が欠けているか小さい場合は、より大きいプロンプト指向の
トランスクリプト合計が優先されることがあります。
provider quota window の usage auth は、利用可能な場合は provider 固有フックから取得されます。そうでない場合、OpenClaw は auth profile、env、または config から一致する OAuth/API キー認証情報にフォールバックします。
アシスタントのトランスクリプトエントリーは、正規化された同じ usage 形状を永続化します。これには、アクティブモデルに価格設定があり、provider が usage メタデータを返す場合の
`usage.cost` も含まれます。これにより、ライブランタイム state が失われた後でも、
`/usage cost` とトランスクリプト依存の session status に安定した情報源が提供されます。

## コスト見積もり（表示される場合）

コストは、あなたのモデル価格設定 config から見積もられます。

```
models.providers.<provider>.models[].cost
```

これらは `input`, `output`, `cacheRead`, `cacheWrite` に対する**100 万トークンあたりの USD** です。価格設定がない場合、OpenClaw はトークンのみを表示します。OAuth token ではドル建てコストは表示されません。

## キャッシュ TTL と pruning の影響

provider のプロンプトキャッシュは、キャッシュ TTL ウィンドウ内でのみ適用されます。OpenClaw は
オプションで **cache-ttl pruning** を実行できます。これはキャッシュ TTL の期限切れ後にセッションを pruning し、その後キャッシュウィンドウをリセットして、後続リクエストが完全な履歴を再キャッシュする代わりに、新しくキャッシュされたコンテキストを再利用できるようにするものです。これにより、セッションが TTL を超えてアイドルになった場合のキャッシュ書き込みコストを低く保てます。

設定は [Gateway configuration](/ja-JP/gateway/configuration) で行い、
動作詳細は [Session pruning](/ja-JP/concepts/session-pruning) を参照してください。

Heartbeat はアイドルギャップをまたいでキャッシュを**温かい状態**に保てます。モデルキャッシュ TTL
が `1h` の場合、Heartbeat 間隔をそれより少し短く（たとえば `55m`）設定すると、完全なプロンプトの再キャッシュを避けられ、キャッシュ書き込みコストを減らせます。

マルチエージェント構成では、共有モデル config を 1 つ保ちながら、
`agents.list[].params.cacheRetention` でエージェントごとにキャッシュ動作を調整できます。

設定項目ごとの完全ガイドは [Prompt Caching](/ja-JP/reference/prompt-caching) を参照してください。

Anthropic API の価格設定では、cache read は input
token より大幅に安く、cache write はより高い倍率で課金されます。最新の料金と TTL 倍率については、Anthropic の prompt caching 価格設定を参照してください:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 例: Heartbeat で 1 時間キャッシュを温かく保つ

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

### 例: エージェントごとのキャッシュ戦略を持つ混在トラフィック

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # 多くのエージェント向けのデフォルトベースライン
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # 深いセッションのために長いキャッシュを温かく保つ
    - id: "alerts"
      params:
        cacheRetention: "none" # バースト的通知ではキャッシュ書き込みを避ける
```

`agents.list[].params` は、選択されたモデルの `params` の上にマージされるため、
`cacheRetention` だけを上書きして、他のモデルデフォルトはそのまま継承できます。

### 例: Anthropic 1M コンテキスト beta ヘッダーを有効にする

Anthropic の 1M コンテキストウィンドウは現在 beta 制限付きです。OpenClaw は、
サポートされる Opus または Sonnet モデルで `context1m` を有効にすると、必要な
`anthropic-beta` 値を注入できます。

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

これは Anthropic の `context-1m-2025-08-07` beta ヘッダーに対応します。

これは、そのモデルエントリーに `context1m: true` が設定されている場合にのみ適用されます。

要件: 認証情報は long-context 利用対象である必要があります。そうでない場合、
Anthropic はそのリクエストに対して provider 側の rate limit エラーを返します。

Anthropic を OAuth/サブスクリプション token（`sk-ant-oat-*`）で認証している場合、
Anthropic は現在その組み合わせを HTTP 401 で拒否するため、OpenClaw は
`context-1m-*` beta ヘッダーをスキップします。

## トークン圧力を減らすためのヒント

- 長いセッションは `/compact` を使って要約する。
- ワークフロー内の大きな tool 出力を削る。
- スクリーンショットが多いセッションでは `agents.defaults.imageMaxDimensionPx` を下げる。
- skill 説明は短く保つ（skill リストはプロンプトに注入される）。
- 冗長で探索的な作業には、より小さいモデルを優先する。

正確な skill リストのオーバーヘッド計算式については [Skills](/ja-JP/tools/skills) を参照してください。

## 関連

- [API 使用量とコスト](/ja-JP/reference/api-usage-costs)
- [プロンプトキャッシュ](/ja-JP/reference/prompt-caching)
- [使用量トラッキング](/ja-JP/concepts/usage-tracking)

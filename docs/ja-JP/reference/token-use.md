---
read_when:
    - トークン使用量、コスト、またはコンテキストウィンドウの説明
    - コンテキスト増大やCompaction動作のデバッグ
summary: OpenClawがプロンプトコンテキストを構築し、トークン使用量とコストを報告する仕組み
title: トークン使用量とコスト
x-i18n:
    generated_at: "2026-04-21T04:51:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: d26db37353941e247eb26f84bfa105896318b3239b2975d6e033c6e9ceda6b0d
    source_path: reference/token-use.md
    workflow: 15
---

# トークン使用量とコスト

OpenClawは文字数ではなく**トークン**を追跡します。トークンはモデル依存ですが、多くのOpenAI系モデルでは英語テキストで平均して1トークンあたり約4文字です。

## システムプロンプトの構築方法

OpenClawは、実行のたびに独自のシステムプロンプトを組み立てます。これには次が含まれます。

- ツール一覧 + 短い説明
- Skills一覧（メタデータのみ。命令は必要時に `read` で読み込まれます）。
  コンパクトなSkillsブロックは `skills.limits.maxSkillsPromptChars` で制限され、エージェントごとの任意の上書きは `agents.list[].skillsLimits.maxSkillsPromptChars` にあります。
- 自己更新の命令
- ワークスペース + ブートストラップファイル（`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` は新規時、さらに `MEMORY.md` が存在する場合、または小文字の代替として `memory.md`）。大きなファイルは `agents.defaults.bootstrapMaxChars`（デフォルト: 12000）で切り詰められ、ブートストラップ全体の注入は `agents.defaults.bootstrapTotalMaxChars`（デフォルト: 60000）で上限が設けられます。`memory/*.md` の日次ファイルは通常のブートストラッププロンプトには含まれません。通常のターンではmemoryツール経由のオンデマンドのままですが、素の `/new` と `/reset` では、その最初のターン向けに最近の日次memoryを含む一回限りの起動コンテキストブロックを前置できることがあります。その起動プレリュードは `agents.defaults.startupContext` で制御されます。
- 時刻（UTC + ユーザーのタイムゾーン）
- 返信タグ + Heartbeat動作
- 実行時メタデータ（ホスト/OS/モデル/thinking）

完全な内訳は [System Prompt](/ja-JP/concepts/system-prompt) を参照してください。

## コンテキストウィンドウに何が含まれるか

モデルが受け取るものはすべてコンテキスト制限に含まれます。

- システムプロンプト（上記のすべてのセクション）
- 会話履歴（ユーザー + アシスタントメッセージ）
- ツール呼び出しとツール結果
- 添付ファイル/トランスクリプト（画像、音声、ファイル）
- Compaction要約とpruning成果物
- プロバイダラッパーまたは安全性ヘッダ（見えなくてもカウントされます）

一部の実行時負荷が高い画面には、独自の明示的上限があります。

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

エージェントごとの上書きは `agents.list[].contextLimits` にあります。これらのノブは、制限付き実行時抜粋と実行時所有ブロックの注入用です。これらはブートストラップ上限、起動コンテキスト上限、Skillsプロンプト上限とは別です。

画像については、OpenClawはプロバイダ呼び出し前にトランスクリプト/ツールの画像ペイロードを縮小します。これを調整するには `agents.defaults.imageMaxDimensionPx`（デフォルト: `1200`）を使ってください。

- 値を低くすると、通常はvisionトークン使用量とペイロードサイズが減ります。
- 値を高くすると、OCR/UI中心のスクリーンショットでより多くの視覚的詳細を保持できます。

実用的な内訳（注入ファイルごと、ツール、Skills、システムプロンプトサイズ）を見るには、`/context list` または `/context detail` を使ってください。詳しくは [Context](/ja-JP/concepts/context) を参照してください。

## 現在のトークン使用量を見る方法

チャットでは次を使います。

- `/status` → セッションモデル、コンテキスト使用量、最後の応答の入力/出力トークン、**推定コスト**（APIキー認証のみ）を含む**絵文字豊富なステータスカード**。
- `/usage off|tokens|full` → すべての返信に**応答ごとの使用量フッター**を追加します。
  - セッションごとに永続化されます（`responseUsage` として保存）。
  - OAuth認証では**コストを非表示**にします（トークンのみ）。
- `/usage cost` → OpenClawセッションログからローカルコスト概要を表示します。

その他の画面:

- **TUI/Web TUI:** `/status` + `/usage` をサポート。
- **CLI:** `openclaw status --usage` と `openclaw channels list` は、正規化されたプロバイダクォータウィンドウ（応答ごとのコストではなく `X% left`）を表示します。
  現在の使用量ウィンドウ対応プロバイダ: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi, z.ai。

使用量画面では、表示前に一般的なプロバイダネイティブ項目エイリアスを正規化します。OpenAIファミリーのResponsesトラフィックでは、`input_tokens` / `output_tokens` と `prompt_tokens` / `completion_tokens` の両方が含まれるため、トランスポート固有の項目名が `/status`、`/usage`、セッション概要を変えることはありません。Gemini CLIのJSON使用量も正規化されます。返信テキストは `response` から取得され、`stats.cached` は `cacheRead` に対応付けられ、CLIが明示的な `stats.input` 項目を省略した場合は `stats.input_tokens - stats.cached` が使われます。  
ネイティブOpenAIファミリーのResponsesトラフィックでは、WebSocket/SSE使用量エイリアスも同じように正規化され、`total_tokens` が欠けているか `0` の場合は、合計が正規化済みの入力 + 出力へフォールバックします。  
現在のセッションスナップショットが疎な場合、`/status` と `session_status` は、最新のトランスクリプト使用量ログからトークン/キャッシュカウンタとアクティブな実行時モデルラベルも復元できます。既存の非ゼロlive値は引き続きトランスクリプト由来のフォールバック値より優先され、保存済み合計が欠けているか小さい場合には、より大きいプロンプト指向のトランスクリプト合計が優先されることがあります。  
プロバイダクォータウィンドウ用の使用量認証は、利用可能ならプロバイダ固有フックから取得されます。そうでない場合、OpenClawは認証プロファイル、env、または設定から一致するOAuth/APIキー認証情報へフォールバックします。  
アシスタントのトランスクリプト項目は、アクティブモデルに価格設定があり、プロバイダが使用量メタデータを返すとき、`usage.cost` を含む同じ正規化済み使用量形状を永続化します。これにより、live実行時状態が消えた後でも `/usage cost` とトランスクリプトベースのセッションステータスに安定した情報源が提供されます。

## コスト見積もり（表示される場合）

コストは、モデル価格設定に基づいて見積もられます。

```
models.providers.<provider>.models[].cost
```

これらは `input`、`output`、`cacheRead`、`cacheWrite` に対する**100万トークンあたりのUSD**です。価格設定がない場合、OpenClawはトークンのみを表示します。OAuthトークンではドルコストは表示されません。

## キャッシュTTLとpruningの影響

プロバイダのプロンプトキャッシュは、キャッシュTTLウィンドウ内でのみ適用されます。OpenClawは任意で**cache-ttl pruning**を実行できます。キャッシュTTLの期限切れ後にセッションをpruneし、その後キャッシュウィンドウをリセットすることで、以降のリクエストが履歴全体を再キャッシュする代わりに新しくキャッシュされたコンテキストを再利用できるようにします。これにより、セッションがTTLを超えてアイドル状態になったときのキャッシュ書き込みコストを低く抑えます。

設定は [Gateway configuration](/ja-JP/gateway/configuration) にあり、動作の詳細は [Session pruning](/ja-JP/concepts/session-pruning) を参照してください。

Heartbeatは、アイドル間隔をまたいでキャッシュを**温かい状態**に保てます。モデルのキャッシュTTLが `1h` の場合、Heartbeat間隔をその少し手前（たとえば `55m`）に設定すると、完全なプロンプトの再キャッシュを避け、キャッシュ書き込みコストを減らせます。

マルチエージェント構成では、1つの共有モデル設定を保ちつつ、`agents.list[].params.cacheRetention` でエージェントごとにキャッシュ動作を調整できます。

ノブごとの完全ガイドは [Prompt Caching](/ja-JP/reference/prompt-caching) を参照してください。

Anthropic APIの価格設定では、キャッシュ読み取りは入力トークンよりかなり安く、キャッシュ書き込みはより高い倍率で課金されます。最新の料金とTTL倍率については、Anthropicのプロンプトキャッシュ価格設定を参照してください:  
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 例: Heartbeatで1時間キャッシュを温かいままに保つ

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
          cacheRetention: "long" # ほとんどのエージェント向けのデフォルト基準
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # 深いセッション向けに長いキャッシュを温かく保つ
    - id: "alerts"
      params:
        cacheRetention: "none" # バースト的通知ではキャッシュ書き込みを避ける
```

`agents.list[].params` は、選択されたモデルの `params` の上にマージされるため、`cacheRetention` だけを上書きし、他のモデルデフォルトはそのまま継承できます。

### 例: Anthropic 1Mコンテキストのベータヘッダを有効にする

Anthropicの1Mコンテキストウィンドウは現在ベータ制限付きです。対応するOpusまたはSonnetモデルで `context1m` を有効にすると、OpenClawは必要な `anthropic-beta` 値を注入できます。

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

これはAnthropicの `context-1m-2025-08-07` ベータヘッダに対応付けられます。

これは、そのモデル項目で `context1m: true` が設定されている場合にのみ適用されます。

要件: 認証情報が長コンテキスト使用の対象である必要があります。そうでない場合、Anthropicはそのリクエストに対してプロバイダ側のレート制限エラーを返します。

AnthropicをOAuth/サブスクリプショントークン（`sk-ant-oat-*`）で認証している場合、Anthropicが現在その組み合わせをHTTP 401で拒否するため、OpenClawは `context-1m-*` ベータヘッダをスキップします。

## トークン圧力を減らすためのヒント

- 長いセッションは `/compact` で要約する。
- ワークフロー内の大きなツール出力を削減する。
- スクリーンショットの多いセッションでは `agents.defaults.imageMaxDimensionPx` を下げる。
- Skillの説明は短く保つ（Skill一覧はプロンプトに注入されます）。
- 冗長で探索的な作業では、より小さいモデルを優先する。

Skills一覧の正確なオーバーヘッド計算式は [Skills](/ja-JP/tools/skills) を参照してください。

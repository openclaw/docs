---
read_when:
    - トークン使用量、コスト、またはコンテキストウィンドウの説明
    - コンテキスト増大またはCompaction動作のデバッグ
summary: OpenClaw がプロンプトコンテキストを構築し、トークン使用量とコストを報告する仕組み
title: トークン使用量とコスト
x-i18n:
    generated_at: "2026-07-01T18:07:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99e3de70aeb447bb58ae414c2c5908945e8173b9b8f2bf7e4c2eb9781657c44c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw は文字数ではなく **トークン** を追跡します。トークンはモデル固有ですが、ほとんどの
OpenAI 形式のモデルでは、英語テキストで平均して 1 トークンあたり約 4 文字です。

## システムプロンプトの構築方法

OpenClaw は実行ごとに独自のシステムプロンプトを組み立てます。含まれる内容は次のとおりです。

- ツール一覧 + 短い説明
- Skills 一覧（メタデータのみ。手順は必要に応じて `read` で読み込まれます）。
  ネイティブ Codex ターンは、コンパクトな Skills ブロックをターンスコープの
  コラボレーション用 developer instructions として受け取ります。他のハーネスは通常の
  プロンプト面で受け取ります。これは `skills.limits.maxSkillsPromptChars` によって制限され、
  `agents.list[].skillsLimits.maxSkillsPromptChars` でエージェントごとの任意の上書きができます。
- 自己更新手順
- ワークスペース + ブートストラップファイル（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、新規時の `BOOTSTRAP.md`、存在する場合の `MEMORY.md`）。ネイティブ Codex ターンでは、そのワークスペースでメモリツールが利用可能な場合、設定されたエージェントワークスペースから生の `MEMORY.md` は貼り付けません。代わりに、ターンスコープのコラボレーション用 developer instructions に小さなメモリポインターを含め、必要に応じてメモリツールを使用します。ツールが無効、メモリ検索が利用不可、またはアクティブワークスペースがエージェントメモリワークスペースと異なる場合、`MEMORY.md` は通常の制限付きターンコンテキスト経路を使用します。小文字のルート `memory.md` は注入されません。これは `MEMORY.md` と組み合わせた場合に `openclaw doctor --fix` 用のレガシー修復入力です。大きな注入ファイルは `agents.defaults.bootstrapMaxChars`（デフォルト: 20000）で切り詰められ、ブートストラップ注入全体は `agents.defaults.bootstrapTotalMaxChars`（デフォルト: 60000）で上限が設定されます。`memory/*.md` の日次ファイルは通常のブートストラッププロンプトには含まれません。通常ターンではメモリツール経由でオンデマンドのままですが、リセット/起動時のモデル実行では、その最初のターンに最近の日次メモリを含む一回限りの起動コンテキストブロックを前置できます。素のチャット `/new` と `/reset` コマンドは、モデルを呼び出さずに受理されます。起動時の前置は `agents.defaults.startupContext` で制御されます。Compaction 後の AGENTS.md 抜粋は別扱いで、明示的な `agents.defaults.compaction.postCompactionSections` のオプトインが必要です。
- 時刻（UTC + ユーザーのタイムゾーン）
- 返信タグ + Heartbeat の動作
- ランタイムメタデータ（ホスト/OS/モデル/thinking）

詳細な内訳は [システムプロンプト](/ja-JP/concepts/system-prompt) を参照してください。

認証情報や認証スニペットを文書化するときは、docs のみの変更でシークレットスキャナーの誤検知を避けるため、
[シークレットプレースホルダー規約](/ja-JP/reference/secret-placeholder-conventions) を使用してください。

## コンテキストウィンドウに含まれるもの

モデルが受け取るすべてのものがコンテキスト制限にカウントされます。

- システムプロンプト（上記のすべてのセクション）
- 会話履歴（ユーザー + アシスタントメッセージ）
- ツール呼び出しとツール結果
- 添付ファイル/トランスクリプト（画像、音声、ファイル）
- Compaction 要約と剪定アーティファクト
- プロバイダーラッパーまたは安全性ヘッダー（表示されませんが、カウントされます）

一部のランタイム負荷が高い面には、独自の明示的な上限があります。

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

エージェントごとの上書きは `agents.list[].contextLimits` 配下にあります。これらのノブは、
制限付きランタイム抜粋と、注入されるランタイム所有ブロック用です。ブートストラップ制限、
起動コンテキスト制限、Skills プロンプト制限とは別です。

`toolResultMaxChars` は高度な上限（最大 `1000000` 文字）です。未設定の場合、OpenClaw は
有効なモデルコンテキストウィンドウからライブツール結果の上限を選択します。100K トークン未満では `16000` 文字、
100K+ トークンでは `32000` 文字、200K+ トークンでは `64000` 文字で、いずれもランタイムのコンテキスト共有ガードによって制限されます。

画像については、OpenClaw はプロバイダー呼び出しの前にトランスクリプト/ツール画像ペイロードを縮小します。
これを調整するには `agents.defaults.imageMaxDimensionPx`（デフォルト: `1200`）を使用します。

- 値を小さくすると、通常はビジョントークン使用量とペイロードサイズが減ります。
- 値を大きくすると、OCR/UI が多いスクリーンショットでより多くの視覚的詳細を保持できます。

実用的な内訳（注入ファイルごと、ツール、Skills、システムプロンプトサイズ）を見るには、`/context list` または `/context detail` を使用します。[コンテキスト](/ja-JP/concepts/context) を参照してください。

## 現在のトークン使用量を確認する方法

チャットで次を使用します。

- `/status` → セッションモデル、コンテキスト使用量、
  直近レスポンスの入力/出力トークン、アクティブモデルにローカル料金が設定されている場合の **推定コスト** を含む **絵文字豊富なステータスカード**。
- `/usage off|tokens|full` → すべての返信に **レスポンスごとの使用量フッター** を追加します。
  - セッションごとに永続化されます（`responseUsage` として保存）。
  - `/usage reset`（エイリアス: `inherit`、`clear`、`default`）— セッションの上書きをクリアし、セッションが設定済みデフォルトを再継承するようにします。
  - `/usage tokens` はターンのトークン/キャッシュ詳細を表示します。
  - `/usage full` はコンパクトなモデル/コンテキスト/コスト詳細を表示します。推定コストは、
    OpenClaw に使用量メタデータとアクティブモデルのローカル料金がある場合にのみ表示されます。
    カスタム `messages.usageTemplate` レイアウトには、トークン/キャッシュフィールドを含められます。
- `/usage cost` → OpenClaw セッションログからローカルコスト要約を表示します。

その他の面:

- **TUI/Web TUI:** `/status` + `/usage` がサポートされています。
- **CLI:** `openclaw status --usage` と `openclaw channels list` は、
  正規化されたプロバイダー割り当てウィンドウ（レスポンスごとのコストではなく `X% left`）を表示します。
  現在の使用量ウィンドウプロバイダー: Anthropic、GitHub Copilot、Gemini CLI、
  OpenAI Codex、MiniMax、Xiaomi、z.ai。

使用量表示面では、表示前に一般的なプロバイダーネイティブのフィールドエイリアスを正規化します。
OpenAI ファミリーの Responses トラフィックでは、`input_tokens` /
`output_tokens` と `prompt_tokens` / `completion_tokens` の両方が含まれるため、トランスポート固有の
フィールド名によって `/status`、`/usage`、またはセッション要約が変わることはありません。
Gemini CLI の使用量も正規化されます。デフォルトの `stream-json` パーサーはアシスタントの
`message` イベントを読み取り、CLI が明示的な `stats.input` フィールドを省略した場合は、
`stats.cached` が `cacheRead` にマップされ、`stats.input_tokens - stats.cached` が使用されます。
レガシー JSON 上書きでは、引き続き `response` から返信テキストを読み取ります。
ネイティブ OpenAI ファミリーの Responses トラフィックでは、WebSocket/SSE 使用量エイリアスも同じ方法で正規化され、
`total_tokens` が欠落している、または `0` の場合は、正規化された入力 + 出力に合計がフォールバックします。
現在のセッションスナップショットが疎な場合、`/status` と `session_status` は、
直近のトランスクリプト使用量ログからトークン/キャッシュカウンターとアクティブなランタイムモデルラベルも復元できます。
既存のゼロでないライブ値は、トランスクリプトのフォールバック値より引き続き優先されます。また、保存済み合計が欠落しているか小さい場合は、
より大きなプロンプト指向のトランスクリプト合計が優先されることがあります。
プロバイダー割り当てウィンドウの使用量認証は、利用可能な場合はプロバイダー固有のフックから取得されます。
それ以外の場合、OpenClaw は auth プロファイル、env、または config から一致する OAuth/API キー認証情報にフォールバックします。
アシスタントのトランスクリプトエントリは、アクティブモデルに料金が設定され、プロバイダーが使用量メタデータを返す場合の
`usage.cost` を含め、同じ正規化済み使用量形状を永続化します。これにより、ライブランタイム状態がなくなった後でも、
`/usage cost` とトランスクリプトに基づくセッションステータスに安定したソースが提供されます。

OpenClaw は、プロバイダー使用量会計を現在のコンテキストスナップショットとは別に保持します。
プロバイダーの `usage.total` には、キャッシュ済み入力、出力、複数のツールループモデル呼び出しが含まれる場合があるため、
コストとテレメトリには有用ですが、ライブコンテキストウィンドウを過大表示する可能性があります。
コンテキスト表示と診断は、`context.used` に対して最新のプロンプトスナップショット（`promptTokens`、またはプロンプトスナップショットが
利用できない場合は直近のモデル呼び出し）を使用します。

## コスト推定（表示される場合）

コストはモデル料金設定から推定されます。

```
models.providers.<provider>.models[].cost
```

これらは `input`、`output`、`cacheRead`、`cacheWrite` の **100 万トークンあたりの USD** です。
料金が欠落している場合、`/usage full` はコストを省略します。すべての返信でトークン/キャッシュ詳細が必要な場合は、
`/usage tokens` またはカスタム `messages.usageTemplate` を使用してください。コスト表示は API キー認証に限定されません。
`aws-sdk` などの非 API キープロバイダーでも、設定済みモデルエントリにローカル料金が含まれ、プロバイダーが使用量メタデータを返す場合は、
推定コストを表示できます。

サイドカーとチャンネルが Gateway の準備完了経路に到達した後、OpenClaw は、
まだローカル料金を持たない設定済みモデル参照に対して、任意のバックグラウンド料金ブートストラップを開始します。
そのブートストラップは、リモートの OpenRouter と LiteLLM の料金カタログを取得します。
オフラインまたは制限付きネットワークでそれらのカタログ取得をスキップするには、`models.pricing.enabled: false` を設定します。
明示的な `models.providers.*.models[].cost` エントリは、引き続きローカルコスト推定を駆動します。

## キャッシュ TTL と剪定の影響

プロバイダーのプロンプトキャッシュは、キャッシュ TTL ウィンドウ内でのみ適用されます。OpenClaw は任意で
**cache-ttl 剪定** を実行できます。キャッシュ TTL が期限切れになるとセッションを剪定し、その後キャッシュウィンドウをリセットして、
以降のリクエストが履歴全体を再キャッシュする代わりに、新しくキャッシュされたコンテキストを再利用できるようにします。
これにより、セッションが TTL を超えてアイドル状態になった場合のキャッシュ書き込みコストを低く保てます。

[Gateway 設定](/ja-JP/gateway/configuration) で設定し、動作の詳細は [セッション剪定](/ja-JP/concepts/session-pruning) を参照してください。

Heartbeat はアイドルの間隔をまたいでキャッシュを **温かい** 状態に保てます。モデルのキャッシュ TTL が `1h` の場合、
Heartbeat 間隔をそれより少し短く（例: `55m`）設定すると、プロンプト全体の再キャッシュを避け、キャッシュ書き込みコストを削減できます。

マルチエージェント構成では、共有モデル設定を 1 つ維持しつつ、
`agents.list[].params.cacheRetention` でエージェントごとにキャッシュ動作を調整できます。

ノブごとの完全なガイドは、[プロンプトキャッシュ](/ja-JP/reference/prompt-caching) を参照してください。

Anthropic API の料金では、キャッシュ読み取りは入力トークンより大幅に安く、
キャッシュ書き込みはより高い倍率で課金されます。最新の料金と TTL 乗数については、Anthropic の
プロンプトキャッシュ料金を参照してください。
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

### 例: エージェントごとのキャッシュ戦略を持つ混在トラフィック

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
`cacheRetention` のみを上書きし、他のモデルデフォルトを変更せずに継承できます。

### Anthropic 1M コンテキスト

OpenClaw は、Opus 4.8、Opus 4.7、Opus 4.6、
Sonnet 4.6 などの GA 対応 Claude 4.x モデルを Anthropic の 1M コンテキストウィンドウでサイズ設定します。
これらのモデルに `params.context1m: true` は不要です。

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

古い config では `context1m: true` を保持できますが、OpenClaw はこの設定に対して
Anthropic の廃止済み `context-1m-2025-08-07` ベータヘッダーを送信しなくなり、
サポートされていない古い Claude モデルを 1M に拡張しません。

要件: 認証情報が長文コンテキスト使用の対象である必要があります。対象でない場合、
Anthropic はそのリクエストに対してプロバイダー側のレート制限エラーを返します。

OAuth/サブスクリプショントークン（`sk-ant-oat-*`）で Anthropic を認証する場合、
OpenClaw は OAuth に必要な Anthropic ベータヘッダーを保持しつつ、
古い config に残っている場合は廃止済みの `context-1m-*` ベータを取り除きます。

## トークン圧迫を減らすためのヒント

- 長いセッションを要約するには `/compact` を使用します。
- ワークフロー内の大きなツール出力を短くします。
- スクリーンショットが多いセッションでは `agents.defaults.imageMaxDimensionPx` を下げます。
- スキルの説明は短く保ちます（スキル一覧はプロンプトに挿入されます）。
- 冗長で探索的な作業には、より小さいモデルを優先します。

正確なスキル一覧のオーバーヘッド計算式については、[Skills](/ja-JP/tools/skills) を参照してください。

## 関連

- [API の使用量とコスト](/ja-JP/reference/api-usage-costs)
- [プロンプトキャッシュ](/ja-JP/reference/prompt-caching)
- [使用状況の追跡](/ja-JP/concepts/usage-tracking)

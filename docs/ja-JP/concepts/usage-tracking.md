---
read_when:
    - プロバイダーの使用量/クォータ画面を接続しています
    - 使用状況の追跡動作または認証要件を説明する必要があります
summary: 使用状況追跡の表示面と認証情報要件
title: 使用状況の追跡
x-i18n:
    generated_at: "2026-07-06T21:48:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e50a48efec908acacf3b9fa31113a4a56553ae07c806d04e4b20aa7bf88b0b5
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## 概要

- 各プロバイダーの使用量エンドポイントから、プロバイダーの使用量/クォータを直接取得します。推定のプロバイダー課金額は含めません。プロバイダーが報告するプラン名、クォータ期間、残高、支出、予算、日次コスト履歴、トークン/モデルの内訳、またはアカウント状態の概要のみを表示します。
- 人間が読めるクォータ期間の出力は、プロバイダーが消費済みクォータ、残りクォータ、または生のカウントのみを報告する場合でも、`X% left` に正規化されます。リセット可能なクォータ期間がないプロバイダーでは、代わりにプロバイダー概要テキストが表示されます（たとえば残高）。
- セッションレベルの `/status` と `session_status` ツールは、ライブセッションスナップショットにトークン/モデルデータがない場合、セッションのトランスクリプトログにフォールバックします。このフォールバックは不足しているトークン/キャッシュカウンターを補完し、アクティブなランタイムモデルラベルを復元でき、セッションメタデータが欠落しているか小さい場合（`totalTokensFresh !== true`、ゼロ、またはトランスクリプト由来の値を下回る場合）は、より大きいプロンプト寄りの合計を優先します。ゼロでないライブ値は常にフォールバックより優先されます。

## 表示される場所

- チャット内の `/status`: セッショントークンと推定コスト（API キーモデルのみ）を含むステータスカード。利用可能な場合、**現在のモデルプロバイダー**のプロバイダー使用量が、正規化された `X% left` 期間またはプロバイダー概要テキストとして表示されます。
- チャット内の `/usage off|tokens|full`: 応答ごとの使用量フッター。
- チャット内の `/usage cost`: OpenClaw セッションログから集計されたローカルコスト概要。
- CLI: `openclaw status --usage` は、プロバイダーごとの完全な使用量/クォータ内訳を出力します。
- CLI: `openclaw models status` は OAuth/トークン認証プロファイルを一覧表示し、使用量期間がある各プロバイダーの横に概要を表示します。
- Control UI: **使用量**には、OpenClaw のセッション由来のトークン分析と推定コスト分析の上に、プロバイダーのプランと課金カードが表示されます。Anthropic と OpenAI 管理 API の認証情報を追加すると、プロバイダーが報告する今日、7日間、30日間の支出、日次トレンド、トークン合計、上位モデル、コストカテゴリが表示されます。
- macOS メニューバー: プロバイダー使用量スナップショットが利用可能な場合、Context の下にルートの「使用量」セクションが表示されます。[メニューバー](/ja-JP/platforms/mac/menu-bar)を参照してください。

`openclaw channels list` はプロバイダー使用量を出力しなくなりました。代わりに `openclaw status` または `openclaw models list` を案内します。

## Anthropic と OpenAI のコスト履歴

サブスクリプションクォータと API 課金は、異なるプロバイダーサーフェスです。

- Anthropic のサブスクリプション/セットアップ認証情報は、引き続き Claude のクォータ期間と任意の追加使用量予算を表示します。代わりに組織の Usage and Cost API 履歴を表示するには、`ANTHROPIC_ADMIN_KEY` または `ANTHROPIC_ADMIN_API_KEY` を設定します。`sk-ant-admin` で始まる Anthropic プロバイダー認証情報は自動的に検出されます。
- OpenAI ChatGPT/Codex OAuth は、引き続きプラン、クォータ期間、クレジット残高を表示します。代わりに組織のコストと補完使用量履歴を表示するには、`OPENAI_ADMIN_KEY` を設定します。任意で `OPENAI_PROJECT_ID` を設定すると、1 つのプロジェクトにスコープできます。OpenClaw は、`OPENAI_API_KEY`、プロバイダー設定、または認証プロファイルの推論認証情報を組織 API に送信しません。これらのキーはカスタムエンドポイントに属している可能性があるためです。

管理認証情報は実際の組織課金を提供するため優先されます。OpenClaw は、これらのプロバイダー報告合計をローカルセッション推定値と合算しません。この 2 つのセクションは意図的に異なる問いに答えます。

## デフォルトの使用量フッターモード

`/usage off|tokens|full` はセッションのフッターを設定し、そのセッションに記憶されます。`messages.responseUsage` は、まだ選択していないセッションにそのモードをシードするため、毎回 `/usage` を入力しなくてもフッターをデフォルトでオンにできます。

すべてのチャンネルに 1 つのモードを設定するか、`default` フォールバック付きのチャンネル別マップを設定します。

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

受け付ける値: `"off"`、`"tokens"`、`"full"`、およびレガシーエイリアス `"on"`（`"tokens"` として扱われます）。

### 3 つの異なるセッション状態

セッションの `responseUsage` フィールドには、表現可能な 3 つの状態があり、それぞれ意味が異なります。

| 状態                | 保存値                          | 実効モード                                                            |
| ------------------- | ------------------------------- | --------------------------------------------------------------------- |
| **未設定 / 継承**   | `undefined` (absent)            | `messages.responseUsage` 設定のデフォルトにフォールスルーし、その後 `off`。 |
| **明示的にオフ**    | `"off"` (stored)                | 常にオフ。オフ以外の設定デフォルトではフッターを再有効化できません。  |
| **明示的にオン**    | `"tokens"` or `"full"` (stored) | 設定デフォルトに関係なく、そのモード。                                |

### 優先順位

実効モード = セッション上書き → チャンネル設定エントリ → `default` → `off`。

明示的な `/usage off` は、セッション内にリテラル値 `"off"` として**永続化**され、「未設定」と同じではありません。オフ以外の `messages.responseUsage` デフォルトは、ユーザーが明示的に無効化した後にフッターを再びオンにすることはできません。

### リセットとオフの違い

- `/usage off` はフッターを強制的にオフにし、その選択を永続化します。設定されたオフ以外のデフォルトでこれを上書きすることはできません。
- `/usage reset`（エイリアス: `default`、`inherit`、`inherited`、`clear`、`unpin`）はセッション上書きをクリアします。その後、セッションは実効設定デフォルト（`messages.responseUsage`）を**継承**します。デフォルトが設定されていない場合、フッターはオフのままです。
- 完全なセッションリセット（`/reset` または `/new`）またはセッションロールオーバーは、明示的な使用量モード設定を**保持**するため、ユーザーの表示選択はセッションロールオーバー後も維持されます。上書きをクリアするのは `/usage reset`（およびそのエイリアス）のみです。

### トグル動作

引数なしの `/usage` は、オフ → tokens → full → オフの順に切り替えます。サイクルの開始点は現在の**実効**モード（未設定の場合はセッション上書きが設定デフォルトにフォールスルー）であるため、サイクルは常にユーザーが現在フッターで見ているものと一致します。

### 設定

設定がない場合、従来の動作（`/usage` までフッターはオフ）が維持されます。セッション上書きをクリアして設定済みデフォルトを再継承するには、`/usage reset` を使用します。

## カスタム `/usage full` フッター

`/usage tokens` は常にプレーンな `Usage: X in / Y out` 行をレンダリングします（利用可能な場合はキャッシュと推定コストのサフィックスも追加）。以下で説明するより情報量の多いフッターをレンダリングするのは `/usage full` のみです。

`/usage full` は、これらのフィールドが利用可能な場合、モデル、reasoning、fast/slow、コンテキストウィンドウ、コストを含む組み込みのコンパクトなフッターを表示します。組み込みフッターにテンプレートファイルは不要です。

`messages.usageTemplate` は高度なカスタムレイアウト専用です。値は JSON ファイルパス（`~` 対応）またはインラインオブジェクトで、有効な場合は組み込みフッターを置き換えます。ファイルパスは監視され、変更時にライブで再読み込みされます。

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

テンプレートがない、または空の場合は、静かに組み込みフッターへフォールバックします。読み取れない、または無効な設定済みテンプレート（不正な JSON、またはレンダリング可能な出力ピースがない形状）も組み込みフッターへフォールバックし、オペレーター警告を出します。

カスタムテンプレートは組み込み形状から始め、変更したい部分を編集します。

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": {
    "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿",
    "block": "░▏▎▍▌▋▊▉█",
    "shade": "░▒▓█",
    "moon": "🌑🌘🌗🌖🌕",
    "level": "▁▂▃▄▅▆▇█",
    "weather": ["🥶", "☁️", "🌥", "⛅️", "🌤", "☀️"],
    "plants": ["🪾", "🍂", "🌱", "☘️", "🍀", "🌿"],
    "moons6": ["🌑", "🌚", "🌘", "🌗", "🌖", "🌝"],
  },
  "aliases": {
    "models": {
      "claude-opus-4-6": "opus46",
      "claude-opus-4-8": "opus48",
      "claude-sonnet-4-6": "sonnet46",
      "claude-haiku-4-5": "haiku45",
      "gpt-5.5": "gpt5.5",
    },
    "reasoning": {
      "off": "🌑",
      "minimal": "🌚",
      "low": "🌘",
      "medium": "🌗",
      "high": "🌕",
      "xhigh": "🌝",
    },
  },
  "output": {
    "sep": "",
    "default": [
      { "text": "{model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": "🔄" } },
      { "map": "model.is_override", "cases": { "true": "📌" } },
      { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
      {
        "when": "context.max_tokens",
        "text": " | 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
      ],
    },
  },
}
```

### 形状

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "low-to-high glyphs" }, // string (1 glyph/char) or array
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // joins surviving pieces
    "default": [
      /* pieces */
    ], // fallback for any surface
    "surfaces": {
      "discord": [
        /* pieces */
      ],
      "telegram": [
        /* pieces */
      ],
    },
  },
}
```

各サーフェスは**ピース**の順序付きリストです。エンジンは各ピースをレンダリングし、空のものを落とし、残ったものを `sep` で結合します。エントリがないサーフェスは `output.default` を使用します。

### コントラクトパス

ピースはターンごとのコントラクトからドットパスで値を読み取ります。存在しない値は空になります（そのため、`when` ガードまたは `|fallback` によってピースをクリーンに保てます）。

| パス                                                                                | 意味                                                                                              |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `surface`                                                                           | チャンネル ID（`discord`/`telegram`/など）                                                               |
| `agentId` / `chat_type`                                                             | 所有するエージェント ID / チャットサーフェス種別                                                                  |
| `model.id` / `model.display_name` / `model.provider`                                | モデル ID / 表示名 / プロバイダー ID                                                                |
| `model.actual`, `model.resolved_ref`                                                | そのターンで実際に使用されたプロバイダー/モデル参照                                                        |
| `model.requested`                                                                   | リクエストされたプロバイダー/モデル参照（フォールバック前）                                                       |
| `model.reasoning`                                                                   | effort（`off` から `xhigh` まで）                                                                       |
| `model.is_fallback` / `model.is_override`                                           | ブール値: フォールバック使用 / モデル固定                                                                   |
| `model.override_source` / `model.auth_mode`                                         | オーバーライド元ラベル / 認証情報モード（`oauth`, `api-key`, `token`, `mixed`, `aws-sdk`, `unknown`） |
| `state.fast_mode`                                                                   | ブール値: 高速と低速                                                                                   |
| `state.compactions`                                                                 | セッションの Compaction 回数                                                                     |
| `context.max_tokens` / `context.used_tokens` / `context.pct_used`                   | ウィンドウ予算 / 使用中トークン / 0-100 の使用率                                                         |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | ターン集計                                                                                       |
| `usage.cache_read_tokens` / `usage.cache_write_tokens`                              | そのターンのキャッシュ読み取りトークンとキャッシュ書き込みトークン                                                       |
| `usage.has_tokens` / `usage.has_split_tokens` / `usage.has_total_only_tokens`       | トークン表示ガード                                                                                 |
| `usage.cache_hit_pct`                                                               | 合計プロンプトトークンに占めるキャッシュ読み取りの割合                                                              |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | 最後のモデル呼び出しのみ（`cache_read_tokens`, `cache_write_tokens`, `total_tokens` も含む）           |
| `cost.turn_usd` / `cost.available`                                                  | 推定ターンコスト / コスト表が解決されたかどうか                                                  |
| `timing.duration_ms`                                                                | 実時間でのターン所要時間                                                                             |
| `identity.name` / `identity.emoji` / `identity.avatar`                              | エージェントの ID 名 / 絵文字 / アバター                                                                 |
| `session.id`                                                                        | セッション ID                                                                                           |

（プロバイダーのレート制限ウィンドウはこの契約には**含まれません**。現在、配列値のパスは存在しないため、`each` ピースには反復対象がありません。）

### 動詞

値は左から右へ動詞を通して処理されます。動詞ではないセグメントはフォールバックです。

| 動詞            | 効果                                | 例                           |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | コンパクトな数値                         | `272000 -> 272k`                  |
| `fixed:N`       | N 桁の小数（デフォルト 2）                | `0.0377`                          |
| `dur`           | 秒を期間へ変換                   | `14820 -> 4h07m`                  |
| `pct`           | `%` を付加                            | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | 使用済みから残量を求める             |
| `alias:TABLE`   | `aliases` で検索し、未登録ならそのまま出力 | `medium -> 🌗`                    |
| `meter:W:SCALE` | 0-100 の値を W セルのグリフバーで表示   | `[⣿⣿⠐⠐⠐]`（`meter:1` = 1 グリフ） |

### ピース形式

- `{ "text": "📚 {context.max_tokens|num}" }`: リテラル + 補間。
- `{ "when": "<path>", "text": "..." }`: パスが truthy の場合のみレンダー。
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: 値をグリフへ変換（`_default` ケースは一致しない値を扱う）。
- `{ "each": "<array-path>", "item": "{label}" }`: 配列値のパスを反復（現在の契約パスに配列はありません）。

### 例

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿" },
  "aliases": { "reasoning": { "medium": "🌗", "high": "🌕" } },
  "output": {
    "surfaces": {
      "discord": [
        { "text": "{model.display_name}" },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
      ],
    },
  },
}
```

たとえば `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k` のようにレンダーされます。

## プロバイダー + 認証情報

使用量は、使用可能なプロバイダー使用量認証を解決できない場合は非表示になります。OpenClaw は
`contracts.usageProviders` を宣言し、`resolveUsageAuth` と
`fetchUsageSnapshot` の両方を実装する有効なプロバイダー Plugin を自動検出します。
個別のコアプロバイダー許可リストはありません。静的契約により、すべてのプロバイダー Plugin をインポートせずに
検出スコープを保ちます。各 Plugin が上流エンドポイントとレスポンスマッピングを所有します。
共有スナップショットは、プラン名、クォータウィンドウ、残高、支出、予算を
CLI、アプリ、Control UI のコンシューマーに対してプロバイダー中立に保ちます。

- **Anthropic (Claude)**: 認証プロファイル内の OAuth トークン。OAuth トークンに
  `user:profile` スコープがない場合、設定されていれば `claude.ai` Web セッション（`CLAUDE_AI_SESSION_KEY`,
  `CLAUDE_WEB_SESSION_KEY`、または `CLAUDE_WEB_COOKIE` 内の `sessionKey=` Cookie）へフォールバックします。
  Anthropic が報告する場合、モデルスコープの制限と、有効化された追加使用量の月間支出/予算が含まれます。
  明示的な Anthropic Admin API キー、または自動検出された `sk-ant-admin...` プロバイダープロファイルでは、
  代わりに 30 日間の組織コストと Messages API 履歴が表示されます。
- **ClawRouter**: API キー（`CLAWROUTER_API_KEY`）。設定されている場合は月間予算ウィンドウと
  型付き USD 予算を表示します。それ以外の場合は、集計支出と
  リクエスト/トークン/コストのサマリーを表示します。
- **DeepSeek**: env/config/認証ストア経由の API キー（`DEEPSEEK_API_KEY`）。
  プロバイダーが報告する各通貨残高を表示します。
- **GitHub Copilot**: 認証プロファイル内の OAuth トークン。
- **Gemini CLI**: 認証プロファイル内の OAuth トークン。
- **MiniMax**: API キーまたは MiniMax OAuth 認証プロファイル。OpenClaw は
  `minimax`、`minimax-cn`、`minimax-portal` を同じ MiniMax クォータ
  サーフェスとして扱い、保存済みの MiniMax OAuth が存在する場合はそれを優先し、それ以外の場合は
  `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、または `MINIMAX_API_KEY` にフォールバックします。
  使用量ポーリングは、設定されている場合は `models.providers.minimax-portal.baseUrl`
  または `models.providers.minimax.baseUrl` から Coding Plan ホストを導出し、それ以外の場合は
  MiniMax CN ホストを使用します。
  MiniMax の生の `usage_percent` / `usagePercent` フィールドは**残り**
  クォータを意味するため、OpenClaw は表示前に反転します。存在する場合は
  カウントベースのフィールドが優先されます。
  - ウィンドウラベルは、存在する場合はプロバイダーの hours/minutes フィールドから取得し、その後
    `start_time` / `end_time` の範囲へフォールバックします。
  - Coding Plan エンドポイントが `model_remains` を返す場合、OpenClaw は
    チャットモデルのエントリを優先し、明示的な
    `window_hours` / `window_minutes` フィールドがない場合はタイムスタンプからウィンドウラベルを導出し、モデル
    名をプランラベルに含めます。
- **OpenAI (Codex/ChatGPT プラン)**: 認証プロファイル内の OAuth トークン（アカウント ID が存在する場合は `ChatGPT-Account-Id`
  ヘッダーを送信）。ChatGPT プラン、リセット可能な
  Codex ウィンドウ、報告される場合はクレジット残高を表示します。クレジットはプロバイダー
  クレジットのままです。OpenClaw はそれらをドルとして表示しません。`OPENAI_ADMIN_KEY` は、
  キーに Usage Dashboard アクセス権がある場合、30 日間の組織コストと completions 使用量履歴を追加します。
  推論認証情報が組織 API に転送されることはありません。
- **OpenRouter**: API キーまたは OAuth 裏付けの API キー（`OPENROUTER_API_KEY` または認証
  プロファイル）。アカウントクレジットエンドポイントとキーのクォータエンドポイントを組み合わせるため、
  認証情報がアクセスできる場合、アカウント残高/支出、キー予算、日次/週次/月次の使用量が
  表示されます。どちらのエンドポイントも独立してスナップショットを補強できます。
- **Venice**: env/config/認証ストア経由の API キー（`VENICE_API_KEY`）。報告される場合、USD と
  DIEM の残高に加えて DIEM エポック割り当て使用量を表示します。
- **Xiaomi MiMo**: 2 つの個別の使用量サーフェス。従量課金は API キー
  （`XIAOMI_API_KEY`）を使用し、Token Plan は別のキー（`XIAOMI_TOKEN_PLAN_API_KEY`）を使用します。
  どちらも現在クォータウィンドウを報告しません。
- **z.ai**: env/config/認証ストア経由の API キー（`ZAI_API_KEY` または `Z_AI_API_KEY`）。

## 関連

- [トークン使用量とコスト](/ja-JP/reference/token-use)
- [API 使用量とコスト](/ja-JP/reference/api-usage-costs)
- [プロンプトキャッシュ](/ja-JP/reference/prompt-caching)
- [メニューバー](/ja-JP/platforms/mac/menu-bar)

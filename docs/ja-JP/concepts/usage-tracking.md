---
read_when:
    - プロバイダーの使用量／クォータ表示を接続しているところです
    - 使用状況の追跡動作または認証要件を説明する必要がある
summary: 使用状況の追跡画面と認証情報の要件
title: 使用量の追跡
x-i18n:
    generated_at: "2026-07-11T22:12:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c413dcbe838d94c57ba3f6ef9609331e139de6d0abbdb3860753a519bd490314
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## 概要

- 各プロバイダーの使用量エンドポイントから、使用量とクォータを直接取得します。プロバイダー料金の推定は行わず、プロバイダーが報告するプラン名、クォータ期間、残高、支出、予算、日別コスト履歴、トークン／モデル別内訳、またはアカウント状態の概要のみを使用します。
- 人が読みやすいクォータ期間の出力は、プロバイダーが消費済みクォータ、残りクォータ、または生の件数のみを報告する場合でも、`X% left` に正規化されます。リセット可能なクォータ期間がないプロバイダーでは、代わりにプロバイダーの概要テキスト（残高など）が表示されます。
- セッション単位の `/status` と `session_status` ツールは、ライブセッションのスナップショットにトークン／モデルデータがない場合、セッションのトランスクリプトログにフォールバックします。このフォールバックは、不足しているトークン／キャッシュカウンターを補完し、アクティブなランタイムモデルのラベルを復元できるほか、セッションメタデータがないか値が小さい場合（`totalTokensFresh !== true`、ゼロ、またはトランスクリプトから算出した値未満）、プロンプトを基準とした大きい方の合計を優先します。ゼロ以外のライブ値は、常にフォールバックより優先されます。

## 表示される場所

- チャット内の `/status`：セッショントークン数と推定コスト（API キーモデルのみ）を含むステータスカード。プロバイダー使用量が利用可能な場合は、**現在のモデルのプロバイダー**について、正規化された `X% left` の期間またはプロバイダー概要テキストを表示します。
- チャット内の `/usage off|tokens|full`：応答ごとの使用量フッター。
- チャット内の `/usage cost`：OpenClaw のセッションログから集計したローカルコスト概要。
- CLI：`openclaw status --usage` は、プロバイダーごとの使用量／クォータの完全な内訳を出力します。
- CLI：`openclaw models status` は OAuth／トークン認証プロファイルを一覧表示し、使用期間がある各プロバイダーの横にその概要を表示します。
- Control UI：**使用量**には、OpenClaw がセッションから算出したトークンおよび推定コスト分析の上に、プロバイダーのプランと請求カードが表示されます。Anthropic および OpenAI Admin API の認証情報を追加すると、プロバイダーが報告する当日、7 日間、30 日間の支出、日別推移、トークン合計、上位モデル、コストカテゴリも表示されます。
- Control UI：チャット作成欄のコンテキストリングのポップオーバーには、サブスクリプションプロバイダーの**プラン使用量**が表示されます。期間別のバー（5 時間、週次、モデル単位）、リセット時刻、判明している場合はプロバイダープラン（例：`Max (20x)`）、追加使用量クレジットが含まれます。プラン経由で請求されるセッションではトークン単位の金額推定が非表示になり、API 請求のセッションでは `Est. cost` と種類別コスト内訳が引き続き表示されます。Claude Code CLI（`claude-cli`）のセットアップでも、同じ Anthropic サブスクリプション使用量を再利用します。
- macOS メニューバー：プロバイダー使用量のスナップショットが利用可能な場合、Context の下にルートの「使用量」セクションが表示されます。[メニューバー](/ja-JP/platforms/mac/menu-bar)を参照してください。

`openclaw channels list` はプロバイダー使用量を出力しなくなりました。代わりに、`openclaw status` または `openclaw models list` を案内します。

## Anthropic と OpenAI のコスト履歴

サブスクリプションクォータと API 請求は、プロバイダーの異なる機能領域です。

- Anthropic のサブスクリプション／セットアップ認証情報では、引き続き Claude のクォータ期間と、任意の追加使用量予算が表示されます。組織の Usage API と Cost API の履歴を表示するには、`ANTHROPIC_ADMIN_KEY` または `ANTHROPIC_ADMIN_API_KEY` を設定します。`sk-ant-admin` で始まる Anthropic プロバイダー認証情報は自動検出されます。
- OpenAI ChatGPT／Codex OAuth では、引き続きプラン、クォータ期間、クレジット残高が表示されます。組織のコストおよび補完使用量の履歴を表示するには `OPENAI_ADMIN_KEY` を設定し、必要に応じて `OPENAI_PROJECT_ID` を設定して 1 つのプロジェクトに限定します。これらのキーはカスタムエンドポイント用である可能性があるため、OpenClaw は `OPENAI_API_KEY`、プロバイダー設定、または認証プロファイルの推論用認証情報を組織 API に送信しません。

管理者認証情報は実際の組織請求情報を提供するため、優先されます。OpenClaw は、プロバイダーが報告するこれらの合計とローカルのセッション推定値を合算しません。この 2 つのセクションは、意図的に異なる問いに答えるものです。

## 使用量フッターのデフォルトモード

`/usage off|tokens|full` はセッションのフッターを設定し、そのセッションで記憶されます。`messages.responseUsage` は、モードをまだ選択していないセッションの初期値として使用されるため、毎回 `/usage` を入力しなくてもフッターをデフォルトで有効にできます。

すべてのチャンネルに 1 つのモードを設定するか、`default` フォールバックを含むチャンネル別マップを設定します。

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // または: { "default": "off", "discord": "full" }
  },
}
```

使用可能な値：`"off"`、`"tokens"`、`"full"`、および従来のエイリアス `"on"`（`"tokens"` として扱われます）。

### 3 つの異なるセッション状態

セッションの `responseUsage` フィールドには、表現可能な状態が 3 つあり、それぞれ意味が異なります。

| 状態                       | 保存される値                          | 有効なモード                                                                 |
| -------------------------- | ------------------------------------- | ---------------------------------------------------------------------------- |
| **未設定／継承**           | `undefined`（存在しない）             | `messages.responseUsage` の設定デフォルト、続いて `off` にフォールスルーします。 |
| **明示的にオフ**           | `"off"`（保存済み）                   | 常にオフ。オフ以外の設定デフォルトでフッターを再度有効にはできません。       |
| **明示的にオン**           | `"tokens"` または `"full"`（保存済み） | 設定デフォルトに関係なく、そのモードになります。                             |

### 優先順位

有効なモード = セッションのオーバーライド → チャンネル設定エントリ → `default` → `off`。

明示的な `/usage off` は、「未設定」と同じではなく、リテラル値 `"off"` としてセッションに**永続化**されます。ユーザーが明示的に無効化した後は、オフ以外の `messages.responseUsage` デフォルトでフッターを再度有効にはできません。

### リセットとオフの違い

- `/usage off` はフッターを強制的にオフにし、その選択を永続化します。設定されたオフ以外のデフォルトで上書きすることはできません。
- `/usage reset`（エイリアス：`default`、`inherit`、`inherited`、`clear`、`unpin`）は、セッションのオーバーライドを消去します。その後、セッションは有効な設定デフォルト（`messages.responseUsage`）を**継承**します。デフォルトが設定されていない場合、フッターはオフのままです。
- 完全なセッションリセット（`/reset` または `/new`）やセッションのロールオーバーでも、明示的な使用量モード設定は**保持**されるため、ユーザーの表示設定はセッションのロールオーバー後も維持されます。オーバーライドを消去するのは `/usage reset`（およびそのエイリアス）のみです。

### 切り替え動作

引数なしの `/usage` は、off → tokens → full → off の順に切り替わります。切り替えの開始点は現在の**有効な**モード（未設定の場合はセッションのオーバーライドから設定デフォルトへフォールスルー）であるため、切り替えはユーザーが現在フッターで目にしている状態と常に一致します。

### 設定

設定がない場合は従来の動作（`/usage` を実行するまでフッターはオフ）が維持されます。セッションのオーバーライドを消去して、設定済みのデフォルトを再び継承するには `/usage reset` を使用します。

## カスタム `/usage full` フッター

`/usage tokens` は常に単純な `Usage: X in / Y out` 行を表示します（利用可能な場合は、キャッシュおよび推定コストの接尾辞も追加されます）。以下で説明する高機能なフッターを表示するのは `/usage full` のみです。

`/usage full` は、利用可能なフィールドに応じて、モデル、推論、fast／slow、コンテキストウィンドウ、コストを含む組み込みのコンパクトなフッターを表示します。組み込みフッターにテンプレートファイルは必要ありません。

`messages.usageTemplate` は高度なカスタムレイアウト専用です。値には JSON ファイルパス（`~` をサポート）またはインラインオブジェクトを指定でき、有効な場合は組み込みフッターを置き換えます。ファイルパスは監視され、変更時にライブで再読み込みされます。

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

テンプレートがないか空の場合は、通知せず組み込みフッターにフォールバックします。設定されたテンプレートが読み取れないか無効な場合（不正な JSON、または描画可能な出力要素がない構造）も組み込みフッターにフォールバックし、運用者向けの警告を出力します。

カスタムテンプレートは組み込みの構造から始め、変更したい部分を編集してください。

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

### 構造

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "low-to-high glyphs" }, // 文字列（1 グリフ／文字）または配列
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // 残った要素を結合
    "default": [/* 要素 */], // あらゆるサーフェスのフォールバック
    "surfaces": {
      "discord": [/* 要素 */],
      "telegram": [/* 要素 */],
    },
  },
}
```

各サーフェスは順序付きの**要素**リストです。エンジンは各要素を描画し、空のものを除外して、残ったものを `sep` で結合します。エントリがないサーフェスでは `output.default` が使用されます。

### コントラクトパス

各要素は、ターンごとのコントラクトからドットパスで値を読み取ります。存在しない値は空になります（そのため、`when` ガードまたは `|fallback` によって要素をきれいに保てます）。

| パス                                                                                | 意味                                                                                              |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `surface`                                                                           | チャンネル ID（`discord`/`telegram`/など）                                                               |
| `agentId` / `chat_type`                                                             | 所有エージェント ID / チャットサーフェスの種類                                                                  |
| `model.id` / `model.display_name` / `model.provider`                                | モデル ID / 表示名 / プロバイダー ID                                                                |
| `model.actual`, `model.resolved_ref`                                                | そのターンで実際に使用されたプロバイダー/モデル参照                                                        |
| `model.requested`                                                                   | 要求されたプロバイダー/モデル参照（フォールバック前）                                                       |
| `model.reasoning`                                                                   | エフォート（`off` から `xhigh`）                                                                       |
| `model.is_fallback` / `model.is_override`                                           | 真偽値：フォールバックを使用 / モデルを固定                                                                   |
| `model.override_source` / `model.auth_mode`                                         | オーバーライド元ラベル / 認証情報モード（`oauth`、`api-key`、`token`、`mixed`、`aws-sdk`、`unknown`） |
| `state.fast_mode`                                                                   | 真偽値：高速または低速                                                                                   |
| `state.compactions`                                                                 | セッションの Compaction 回数                                                                     |
| `context.max_tokens` / `context.used_tokens` / `context.pct_used`                   | ウィンドウ予算 / 使用済みトークン / 使用率 0〜100                                                         |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | ターンの集計値                                                                                       |
| `usage.cache_read_tokens` / `usage.cache_write_tokens`                              | そのターンのキャッシュ読み取りおよびキャッシュ書き込みトークン                                               |
| `usage.has_tokens` / `usage.has_split_tokens` / `usage.has_total_only_tokens`       | トークン表示のガード条件                                                                                 |
| `usage.cache_hit_pct`                                                               | プロンプトトークン合計に占めるキャッシュ読み取りの割合                                                        |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | 最後のモデル呼び出しのみ（`cache_read_tokens`、`cache_write_tokens`、`total_tokens` も含む）           |
| `cost.turn_usd` / `cost.available`                                                  | ターンの推定コスト / コスト表を解決できたかどうか                                                            |
| `timing.duration_ms`                                                                | ターンの実時間                                                                                         |
| `identity.name` / `identity.emoji` / `identity.avatar`                              | エージェントの識別名 / 絵文字 / アバター                                                                  |
| `session.id`                                                                        | セッション ID                                                                                           |

（プロバイダーのレート制限ウィンドウは、このコントラクトには**含まれません**。現在、配列値を持つパスは存在しないため、`each` ピースには反復対象がありません。）

### 動詞

値を左から右へ動詞に通します。動詞ではないセグメントがフォールバックになります。

| 動詞            | 効果                                | 例                           |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | 件数を短縮表記                         | `272000 -> 272k`                  |
| `fixed:N`       | 小数点以下 N 桁（デフォルトは 2）       | `0.0377`                          |
| `dur`           | 秒数を期間表記に変換                    | `14820 -> 4h07m`                  |
| `pct`           | `%` を付加                            | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | 使用済みから残りへ変換             |
| `alias:TABLE`   | `aliases` から検索し、未登録なら元の値を出力 | `medium -> 🌗`                    |
| `meter:W:SCALE` | 0〜100 の値を W セルのグリフバーで表示   | `[⣿⣿⠐⠐⠐]`（`meter:1` = 1 グリフ） |

### ピースの形式

- `{ "text": "📚 {context.max_tokens|num}" }`：リテラル + 補間。
- `{ "when": "<path>", "text": "..." }`：パスが真値の場合のみレンダリング。
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`：値をグリフへ変換（`_default` ケースで一致しない値を処理）。
- `{ "each": "<array-path>", "item": "{label}" }`：配列値を持つパスを反復（現在のコントラクトには配列のパスはありません）。

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

たとえば `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k` とレンダリングされます。

## プロバイダーと認証情報

利用可能なプロバイダー使用量認証を解決できない場合、使用量は非表示になります。OpenClaw は、
`contracts.usageProviders` を宣言し、`resolveUsageAuth` と
`fetchUsageSnapshot` の両方を実装する、有効なプロバイダー Plugin を
自動的に検出します。コア側に個別のプロバイダー許可リストはありません。静的
コントラクトにより、すべてのプロバイダー Plugin をインポートせずに検出範囲を
限定できます。各 Plugin は、独自のアップストリームエンドポイントとレスポンスの
マッピングを所有します。共有スナップショットでは、プラン名、クォータウィンドウ、
残高、支出、予算をプロバイダーに依存しない形式で保持し、CLI、アプリ、
コントロール UI の利用側で使用できます。

- **Anthropic（Claude）**：認証プロファイル内の OAuth トークン。OAuth トークンに
  `user:profile` スコープがない場合、設定されていれば `claude.ai` のウェブセッション
  （`CLAUDE_AI_SESSION_KEY`、`CLAUDE_WEB_SESSION_KEY`、または `CLAUDE_WEB_COOKIE` 内の
  `sessionKey=` Cookie）へフォールバックします。
  Anthropic から報告される場合は、モデル単位の制限と、有効化された追加使用量の月間支出/予算も
  含まれます。明示的な Anthropic Admin API キー、または自動検出された
  `sk-ant-admin...` プロバイダープロファイルを使用する場合は、代わりに過去 30 日間の
  組織コストと Messages API の履歴が表示されます。
- **ClawRouter**：API キー（`CLAWROUTER_API_KEY`）。設定されている場合は月間予算ウィンドウと
  型付きの USD 予算を表示します。それ以外の場合は、合計支出と
  リクエスト/トークン/コストの概要を表示します。
- **DeepSeek**：環境変数/設定/認証ストアを介した API キー（`DEEPSEEK_API_KEY`）。
  プロバイダーから報告された各通貨の残高を表示します。
- **GitHub Copilot**：認証プロファイル内の OAuth トークン。
- **Gemini CLI**：認証プロファイル内の OAuth トークン。
- **MiniMax**：API キーまたは MiniMax OAuth 認証プロファイル。OpenClaw は
  `minimax`、`minimax-cn`、`minimax-portal` を同じ MiniMax クォータ
  サーフェスとして扱い、保存済みの MiniMax OAuth が存在する場合はそれを優先し、
  それ以外の場合は `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、または
  `MINIMAX_API_KEY` へフォールバックします。
  使用量のポーリングでは、設定されている場合は `models.providers.minimax-portal.baseUrl`
  または `models.providers.minimax.baseUrl` から Coding Plan のホストを導出し、
  それ以外の場合は MiniMax CN ホストを使用します。
  MiniMax の生の `usage_percent` / `usagePercent` フィールドは**残り**
  クォータを意味するため、OpenClaw は表示前に値を反転します。件数ベースのフィールドが
  存在する場合は、そちらが優先されます。
  - ウィンドウラベルは、存在する場合はプロバイダーの時間/分フィールドから取得し、
    それ以外の場合は `start_time` / `end_time` の期間へフォールバックします。
  - Coding Plan エンドポイントが `model_remains` を返す場合、OpenClaw は
    チャットモデルのエントリを優先し、明示的な `window_hours` / `window_minutes`
    フィールドがない場合はタイムスタンプからウィンドウラベルを導出し、プランラベルに
    モデル名を含めます。
- **OpenAI（Codex/ChatGPT プラン）**：認証プロファイル内の OAuth トークン（アカウント ID が
  存在する場合は `ChatGPT-Account-Id` ヘッダーを送信）。ChatGPT プラン、
  リセット可能な Codex ウィンドウ、報告される場合はクレジット残高を表示します。
  クレジットはプロバイダーのクレジットとして扱われ、OpenClaw がドルとして表示することは
  ありません。`OPENAI_ADMIN_KEY` を指定すると、そのキーに Usage Dashboard へのアクセス権が
  ある場合、過去 30 日間の組織コストと completions 使用量の履歴が追加されます。
  推論用の認証情報が組織 API に転送されることはありません。
- **OpenRouter**：API キーまたは OAuth に裏付けられた API キー
  （`OPENROUTER_API_KEY` または認証プロファイル）。アカウントクレジットのエンドポイントと
  キークォータのエンドポイントを組み合わせ、認証情報からアクセスできる場合は、
  アカウント残高/支出、キー予算、日次/週次/月次の使用量を表示します。
  どちらのエンドポイントも、個別にスナップショットを補完できます。
- **Venice**：環境変数/設定/認証ストアを介した API キー（`VENICE_API_KEY`）。
  報告される場合は、USD と DIEM の残高に加えて、DIEM エポック割り当ての使用量を表示します。
- **Xiaomi MiMo**：2 つの独立した使用量サーフェス。従量課金制では API キー
  （`XIAOMI_API_KEY`）を使用し、Token Plan では別のキー
  （`XIAOMI_TOKEN_PLAN_API_KEY`）を使用します。現在、どちらもクォータウィンドウを
  報告しません。
- **z.ai**：環境変数/設定/認証ストアを介した API キー（`ZAI_API_KEY` または `Z_AI_API_KEY`）。

## 関連項目

- [トークン使用量とコスト](/ja-JP/reference/token-use)
- [API 使用量とコスト](/ja-JP/reference/api-usage-costs)
- [プロンプトキャッシュ](/ja-JP/reference/prompt-caching)
- [メニューバー](/ja-JP/platforms/mac/menu-bar)

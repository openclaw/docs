---
read_when:
    - プロバイダーの使用量/クォータ画面を接続しているところです
    - OpenClaw の使用状況追跡の挙動または認証要件を説明する必要がある
summary: 使用状況追跡のサーフェスと認証情報の要件
title: 使用状況の追跡
x-i18n:
    generated_at: "2026-07-05T11:19:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 680240a1a8aa9f4d440de87f62ebfe96ac136375f8b35ca3cc44524846b36ccf
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## これは何か

- 各プロバイダーの使用量エンドポイントから、プロバイダー使用量/クォータを直接取得します。推定コストはありません。プロバイダーが報告するクォータウィンドウ、残高、またはアカウント状態の概要のみです。
- 人間が読めるクォータウィンドウの出力は、プロバイダーが消費済みクォータ、残りクォータ、または生のカウントのみを報告する場合でも、`X% left` に正規化されます。リセット可能なクォータウィンドウがないプロバイダーでは、代わりにプロバイダー概要テキスト（たとえば残高）が表示されます。
- セッションレベルの `/status` と `session_status` ツールは、ライブセッションスナップショットにトークン/モデルデータがない場合、セッションのトランスクリプトログにフォールバックします。そのフォールバックは欠けているトークン/キャッシュカウンターを補完し、アクティブなランタイムモデルラベルを復元でき、セッションメタデータが欠落しているか小さい場合（`totalTokensFresh !== true`、ゼロ、またはトランスクリプト由来の値未満）には、プロンプト寄りの大きい合計を優先します。ゼロでないライブ値は常にフォールバックより優先されます。

## 表示される場所

- チャット内の `/status`: セッショントークンと推定コスト（API キーモデルのみ）を含むステータスカード。プロバイダー使用量は、利用可能な場合に **現在のモデルプロバイダー** について、正規化された `X% left` ウィンドウまたはプロバイダー概要テキストとして表示されます。
- チャット内の `/usage off|tokens|full`: 応答ごとの使用量フッター。
- チャット内の `/usage cost`: OpenClaw セッションログから集計したローカルコスト概要。
- CLI: `openclaw status --usage` は、プロバイダーごとの使用量/クォータの完全な内訳を出力します。
- CLI: `openclaw models status` は OAuth/トークン認証プロファイルを一覧表示し、使用量ウィンドウを持つ各プロバイダーの横にその概要を表示します。
- macOS メニューバー: プロバイダー使用量スナップショットが利用可能な場合、Context の下にルートの「使用量」セクションが表示されます。[メニューバー](/ja-JP/platforms/mac/menu-bar)を参照してください。

`openclaw channels list` はプロバイダー使用量を出力しなくなりました。代わりに `openclaw status` または `openclaw models list` を案内します。

## デフォルトの使用量フッターモード

`/usage off|tokens|full` はセッションのフッターを設定し、そのセッションで記憶されます。`messages.responseUsage` は、まだ選択されていないセッションにそのモードを初期値として与えるため、毎回 `/usage` を入力しなくてもフッターをデフォルトで有効にできます。

すべてのチャンネルに 1 つのモードを設定するか、`default` フォールバック付きのチャンネル別マップを設定します。

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

受け付ける値: `"off"`、`"tokens"`、`"full"`、およびレガシー別名 `"on"`（`"tokens"` として扱われます）。

### 3 つの異なるセッション状態

セッションの `responseUsage` フィールドには、表現可能な状態が 3 つあり、それぞれ意味が異なります。

| 状態                | 保存値                          | 有効モード                                                            |
| ------------------- | ------------------------------- | --------------------------------------------------------------------- |
| **未設定 / 継承**   | `undefined`（存在しない）       | `messages.responseUsage` 設定のデフォルトにフォールスルーし、その後 `off`。 |
| **明示的にオフ**    | `"off"`（保存される）           | 常にオフ。オフ以外の設定デフォルトでフッターを再有効化できません。    |
| **明示的にオン**    | `"tokens"` または `"full"`（保存される） | 設定デフォルトに関係なく、そのモード。                                |

### 優先順位

有効モード = セッション上書き → チャンネル設定エントリ → `default` → `off`。

明示的な `/usage off` は、セッション内にリテラル値 `"off"` として **永続化** され、「未設定」とは同じではありません。オフ以外の `messages.responseUsage` デフォルトは、ユーザーが明示的に無効化した後にフッターを再びオンにできません。

### リセットとオフの違い

- `/usage off` はフッターを強制的にオフにし、その選択を永続化します。設定されたオフ以外のデフォルトはこれを上書きできません。
- `/usage reset`（別名: `default`、`inherit`、`inherited`、`clear`、`unpin`）はセッション上書きをクリアします。その後、セッションは有効な設定デフォルト（`messages.responseUsage`）を **継承** します。デフォルトが設定されていない場合、フッターはオフのままです。
- 完全なセッションリセット（`/reset` または `/new`）やセッションロールオーバーでは、明示的な使用量モード設定が **保持** されるため、ユーザーの表示選択はセッションロールオーバー後も維持されます。上書きをクリアするのは `/usage reset`（およびその別名）のみです。

### トグル動作

引数なしの `/usage` は、off → tokens → full → off の順に循環します。循環の開始点は **有効な** 現在のモード（未設定の場合はセッション上書きから設定デフォルトへフォールスルー）であるため、循環は常にユーザーが現在フッターで見ている内容と一致します。

### 設定

設定がない場合、以前の動作が維持されます（`/usage` までフッターはオフ）。セッション上書きをクリアして設定済みデフォルトを再継承するには、`/usage reset` を使用します。

## カスタム `/usage full` フッター

`/usage tokens` は常に、プレーンな `Usage: X in / Y out` 行（利用可能な場合はキャッシュと推定コストの接尾辞も含む）を表示します。以下で説明する、よりリッチなフッターを表示するのは `/usage full` のみです。

`/usage full` は、モデル、推論、fast/slow、コンテキストウィンドウ、コストの各フィールドが利用可能な場合に、それらを含む組み込みのコンパクトなフッターを表示します。組み込みフッターにはテンプレートファイルは不要です。

`messages.usageTemplate` は高度なカスタムレイアウト専用です。値は JSON ファイルパス（`~` をサポート）またはインラインオブジェクトで、有効な場合は組み込みフッターを置き換えます。ファイルパスは監視され、変更時にライブで再読み込みされます。

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

テンプレートが欠落している、または空の場合は、静かに組み込みフッターへフォールバックします。読み取れない、または無効な設定テンプレート（不正な JSON、またはレンダリング可能な出力パーツがない形状）も組み込みフッターへフォールバックし、オペレーター警告を出します。

カスタムテンプレートは組み込みの形状から始め、変更したい部分を編集します。

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

各サーフェスは **ピース** の順序付きリストです。エンジンはそれぞれをレンダリングし、空のものを削除し、残ったものを `sep` で結合します。エントリがないサーフェスは `output.default` を使用します。

### コントラクトパス

ピースは、ターンごとのコントラクトからドットパスで値を読み取ります。存在しない値は空になります（そのため `when` ガードまたは `|fallback` により、ピースをクリーンに保てます）。

| Path                                                                                | 意味                                                                                                 |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `surface`                                                                           | チャンネル ID（`discord`/`telegram`/など）                                                           |
| `agentId` / `chat_type`                                                             | 所有するエージェント ID / チャットサーフェス種別                                                     |
| `model.id` / `model.display_name` / `model.provider`                                | モデル ID / 表示名 / プロバイダー ID                                                                |
| `model.actual`, `model.resolved_ref`                                                | そのターンで実際に使用されたプロバイダー/モデル参照                                                  |
| `model.requested`                                                                   | 要求されたプロバイダー/モデル参照（フォールバック前）                                                |
| `model.reasoning`                                                                   | effort（`off` から `xhigh`）                                                                        |
| `model.is_fallback` / `model.is_override`                                           | ブール値: フォールバック使用 / モデル固定                                                            |
| `model.override_source` / `model.auth_mode`                                         | オーバーライド元ラベル / 認証情報モード（`oauth`, `api-key`, `token`, `mixed`, `aws-sdk`, `unknown`） |
| `state.fast_mode`                                                                   | ブール値: 高速 vs 低速                                                                               |
| `state.compactions`                                                                 | セッションの Compaction 回数                                                                         |
| `context.max_tokens` / `context.used_tokens` / `context.pct_used`                   | ウィンドウ予算 / 使用中のトークン / 使用率 0-100                                                     |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | ターン集計                                                                                           |
| `usage.cache_read_tokens` / `usage.cache_write_tokens`                              | そのターンのキャッシュ読み取りトークンとキャッシュ書き込みトークン                                   |
| `usage.has_tokens` / `usage.has_split_tokens` / `usage.has_total_only_tokens`       | トークン表示ガード                                                                                   |
| `usage.cache_hit_pct`                                                               | プロンプトトークン合計に占めるキャッシュ読み取りの割合                                               |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | 最終モデル呼び出しのみ（`cache_read_tokens`, `cache_write_tokens`, `total_tokens` も含む）            |
| `cost.turn_usd` / `cost.available`                                                  | 推定ターンコスト / コストテーブルを解決できたか                                                      |
| `timing.duration_ms`                                                                | 壁時計時間でのターン所要時間                                                                         |
| `identity.name` / `identity.emoji` / `identity.avatar`                              | エージェント ID 名 / 絵文字 / アバター                                                               |
| `session.id`                                                                        | セッション ID                                                                                        |

（プロバイダーのレート制限ウィンドウはこの契約には**含まれません**。現在、配列値のパスはないため、`each` ピースには反復する対象がありません。）

### 動詞

値を左から右へ動詞に通します。動詞でないセグメントはフォールバックです。

| 動詞            | 効果                                  | 例                                |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | コンパクトな件数                      | `272000 -> 272k`                  |
| `fixed:N`       | N 桁の小数（デフォルト 2）            | `0.0377`                          |
| `dur`           | 秒を期間に変換                        | `14820 -> 4h07m`                  |
| `pct`           | `%` を追加                            | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | 使用済みから残量へ                |
| `alias:TABLE`   | `aliases` で検索し、未登録ならそのまま出力 | `medium -> 🌗`                    |
| `meter:W:SCALE` | 0-100 の値に対する W セルのグリフバー | `[⣿⣿⠐⠐⠐]`（`meter:1` = 1 グリフ） |

### ピース形式

- `{ "text": "📚 {context.max_tokens|num}" }`: リテラル + 補間。
- `{ "when": "<path>", "text": "..." }`: パスが truthy の場合のみ描画。
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: 値をグリフへ変換（`_default` ケースが一致しない値をカバーします）。
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

たとえば `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k` のように描画されます。

## プロバイダー + 認証情報

使用状況は、使用可能なプロバイダー使用状況認証を解決できない場合に非表示になります。プロバイダーは
独自の使用状況取得ロジックを提供します。それが利用できない場合、OpenClaw は認証プロファイル、環境変数、
または設定から OAuth/API キー認証情報を照合する方法へフォールバックします。

- **Anthropic (Claude)**: 認証プロファイル内の OAuth トークン。OAuth トークンに
  `user:profile` スコープがない場合、設定されていれば `claude.ai` Web セッション（`CLAUDE_AI_SESSION_KEY`,
  `CLAUDE_WEB_SESSION_KEY`、または `CLAUDE_WEB_COOKIE` 内の `sessionKey=` cookie）へフォールバックします。
- **ClawRouter**: API キー（`CLAWROUTER_API_KEY`）。予算が設定されている場合は月間予算ウィンドウを表示し、
  それ以外の場合はリクエスト/トークン/コストの概要を表示します。
- **DeepSeek**: env/config/auth store 経由の API キー（`DEEPSEEK_API_KEY`）。
  パーセント残量のクォータウィンドウではなく、プロバイダーが報告したアカウント残高をテキストとして表示します。
- **GitHub Copilot**: 認証プロファイル内の OAuth トークン。
- **Gemini CLI**: 認証プロファイル内の OAuth トークン。
- **MiniMax**: API キーまたは MiniMax OAuth 認証プロファイル。OpenClaw は
  `minimax`, `minimax-cn`, `minimax-portal` を同じ MiniMax クォータサーフェスとして扱い、
  保存済みの MiniMax OAuth が存在する場合はそれを優先し、それ以外の場合は
  `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` へフォールバックします。
  使用状況ポーリングは、設定されている場合は `models.providers.minimax-portal.baseUrl`
  または `models.providers.minimax.baseUrl` から Coding Plan ホストを導出し、それ以外の場合は
  MiniMax CN ホストを使用します。
  MiniMax の生の `usage_percent` / `usagePercent` フィールドは**残り**クォータを意味するため、
  OpenClaw は表示前に反転します。件数ベースのフィールドが存在する場合はそれが優先されます。
  - ウィンドウラベルは、存在する場合はプロバイダーの hours/minutes フィールドから取得し、
    その後 `start_time` / `end_time` の範囲へフォールバックします。
  - coding-plan エンドポイントが `model_remains` を返す場合、OpenClaw は
    チャットモデルエントリを優先し、明示的な `window_hours` / `window_minutes` フィールドがない場合はタイムスタンプからウィンドウラベルを導出し、
    プランラベルにモデル名を含めます。
- **OpenAI (Codex/ChatGPT プラン)**: 認証プロファイル内の OAuth トークン（アカウント ID が存在する場合は
  `ChatGPT-Account-Id` ヘッダーを送信）。API キーのみの OpenAI 使用状況は追跡されません。
- **Xiaomi MiMo**: 2 つの別個の使用状況サーフェス。従量課金は API キー
  （`XIAOMI_API_KEY`）を使用し、Token Plan は別のキー（`XIAOMI_TOKEN_PLAN_API_KEY`）を使用します。
  どちらも現在はクォータウィンドウを報告しません。
- **z.ai**: env/config/auth store 経由の API キー（`ZAI_API_KEY` または `Z_AI_API_KEY`）。

## 関連

- [トークン使用量とコスト](/ja-JP/reference/token-use)
- [API 使用量とコスト](/ja-JP/reference/api-usage-costs)
- [プロンプトキャッシュ](/ja-JP/reference/prompt-caching)
- [メニューバー](/ja-JP/platforms/mac/menu-bar)

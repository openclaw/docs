---
read_when:
    - プロバイダーの使用量/クォータのサーフェスを接続している
    - 使用状況の追跡動作または認証要件を説明する必要がある
summary: 使用状況追跡サーフェスと認証情報要件
title: 使用状況の追跡
x-i18n:
    generated_at: "2026-07-01T18:06:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa9b2b0b19ca0b4beeea40bfd50b07a92155178d5ec0e1877013843e0caba4fb
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## 概要

- プロバイダーの使用量/クォータを、その使用量エンドポイントから直接取得します。
- 推定コストはありません。プロバイダーが報告するクォータ期間またはアカウント状態の要約のみです。
- 人間が読みやすいクォータ期間のステータス出力は、上流 API が消費済みクォータ、残りクォータ、または生のカウントのみを報告する場合でも、`X% left` に正規化されます。リセット可能なクォータ期間がないプロバイダーでは、残高など、代わりにプロバイダー要約テキストを表示できます。
- セッションレベルの `/status` と `session_status` は、ライブセッションのスナップショットが疎な場合、最新のトランスクリプト使用量エントリにフォールバックできます。このフォールバックは不足しているトークン/キャッシュカウンターを補完し、アクティブなランタイムモデルラベルを復元でき、セッションメタデータがないか小さい場合はプロンプト指向の大きい合計を優先します。既存のゼロでないライブ値は引き続き優先されます。

## 表示される場所

- チャット内の `/status`: セッショントークン + 推定コスト(API キーのみ)を含む、絵文字豊富なステータスカード。利用可能な場合、プロバイダー使用量は**現在のモデルプロバイダー**について、正規化された `X% left` 期間またはプロバイダー要約テキストとして表示されます。
- チャット内の `/usage off|tokens|full`: 応答ごとの使用量フッター。
- チャット内の `/usage cost`: OpenClaw セッションログから集計したローカルコスト要約。
- CLI: `openclaw status --usage` はプロバイダーごとの完全な内訳を出力します。
- CLI: `openclaw channels list` はプロバイダー設定と一緒に同じ使用量スナップショットを出力します(スキップするには `--no-usage` を使用)。
- macOS メニューバー: コンテキスト配下の「使用量」セクション(利用可能な場合のみ)。

## デフォルトの使用量フッターモード

`/usage off|tokens|full` はセッションのフッターを設定し、そのセッションで記憶されます。`messages.responseUsage` は、まだ選択していないセッションにそのモードをシードするため、毎回 `/usage` を入力しなくてもフッターをデフォルトでオンにできます。

すべてのチャンネルに 1 つのモードを設定するか、`default` フォールバック付きのチャンネル別マップを設定します。

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

### 3 つの異なるセッション状態

セッションの `responseUsage` フィールドには 3 つの表現可能な状態があり、それぞれ意味が異なります。

| 状態                | 保存値                          | 有効モード                                                            |
| ------------------- | ------------------------------- | --------------------------------------------------------------------- |
| **未設定 / 継承**   | `undefined` (不在)              | `messages.responseUsage` 設定デフォルトへフォールスルーし、その後 `off`。 |
| **明示的にオフ**    | `"off"` (保存済み)              | 常にオフ。オフ以外の設定デフォルトでフッターを再有効化することはできません。 |
| **明示的にオン**    | `"tokens"` または `"full"` (保存済み) | 設定デフォルトに関係なく、そのモード。                                |

### 優先順位

有効モード = セッション上書き → チャンネル設定エントリ → `default` → `off`。

明示的な `/usage off` は、セッション内にリテラル値 `"off"` として**永続化**され、「未設定」とは同じではありません。つまり、ユーザーが明示的に無効化した後は、オフ以外の `messages.responseUsage` デフォルトでフッターを再度オンにすることはできません。

### リセットとオフの違い

- `/usage off` — フッターを強制的にオフにし、その選択を永続化します。設定済みのオフ以外のデフォルトではこれを上書きできません。
- `/usage reset` (エイリアス: `inherit`, `clear`, `default`) — セッション上書きをクリアします。その後セッションは有効な設定デフォルト(`messages.responseUsage`)を**継承**します。デフォルトが設定されていない場合、フッターはオフです(以前と変わりません)。フッターを明示的にオンにせずに「デフォルトへ戻る」場合に使います。
- 完全なセッションリセット(`/reset` または `/new`)またはセッションロールオーバーは、明示的な使用量モード設定を**保持**するため、ユーザーの表示選択はセッションロールオーバー後も維持されます。上書きを実際にクリアするのは `/usage reset` (およびそのエイリアス)だけです。

### トグル動作

引数なしの `/usage` は off → tokens → full → off の順に循環します。循環の開始点は**有効な**現在のモード(未設定の場合はセッション上書きから設定デフォルトへフォールスルー)なので、循環は常にユーザーがフッターで見ている内容と一致します。

### 設定

設定がない場合は従来の動作が維持されます(フッターは `/usage` までオフ)。セッション上書きをクリアして設定済みデフォルトを再継承するには `/usage reset` を使用します。

## カスタム `/usage full` フッター

`/usage full` は、モデル、推論、fast/slow、コンテキストウィンドウ、利用可能な場合はコストを含む組み込みのコンパクトなフッターを表示します。トークンとキャッシュのフィールドはカスタムテンプレートでも引き続き使用できます。テンプレートファイルは不要です。

`messages.usageTemplate` は高度なカスタムレイアウト専用です。値は JSON ファイルパス(`~` 対応)またはインラインオブジェクトで、有効な場合は組み込みフッターを置き換えます。

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

テンプレートが存在しない、または空の場合は、静かに組み込みフッターへフォールバックします。読み取れない、または無効な設定済みテンプレートも組み込みフッターへフォールバックし、オペレーター警告を出します。

カスタムテンプレートは組み込みの形から始め、変更したい部分を編集します。

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
        "text": "\u00A0| 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      { "when": "cost.turn_usd", "text": "\u00A0💰{cost.turn_usd|fixed:4}" },
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
          "text": "\u00A0| 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        { "when": "cost.turn_usd", "text": "\u00A0💰{cost.turn_usd|fixed:4}" },
      ],
    },
  },
}
```

### 形

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

各サーフェスは**ピース**の順序付きリストです。エンジンはそれぞれをレンダリングし、空を落とし、残ったものを `sep` で結合します。エントリがないサーフェスは `output.default` を使用します。

### コントラクトパス

ピースはターンごとのコントラクトからドットパスで値を読み取ります。不在の値は空になります(そのため `when` ガードまたは `|fallback` によりピースをきれいに保てます)。

| パス                                                                                | 意味                                   |
| ----------------------------------------------------------------------------------- | -------------------------------------- |
| `surface`                                                                           | チャンネル ID (`discord`/`telegram`/など) |
| `model.provider` / `model.display_name`                                             | プロバイダー ID / モデル ID            |
| `model.reasoning`                                                                   | effort (`off` から `xhigh`)            |
| `model.is_fallback` / `model.is_override`                                           | bool: フォールバック使用 / モデル固定  |
| `state.fast_mode`                                                                   | bool: fast と slow                     |
| `context.max_tokens` / `context.pct_used`                                           | ウィンドウ予算 / 0-100 使用済み        |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | ターン集計                             |
| `usage.has_split_tokens` / `usage.has_total_only_tokens` / `usage.cache_hit_pct`    | トークン表示ガードとキャッシュ割合     |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | 最終モデル呼び出しのみ                 |
| `cost.turn_usd`                                                                     | 推定ターンコスト                       |
| `identity.name` / `identity.emoji`                                                  | エージェント名 / 選択された絵文字      |

(プロバイダーのレート制限期間はこのコントラクトに**含まれません**。)

### 動詞

値を左から右へ動詞に通します。動詞ではないセグメントはフォールバックです。

| 動詞            | 効果                                  | 例                                |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | コンパクトなカウント                  | `272000 -> 272k`                  |
| `fixed:N`       | N 桁の小数(デフォルト 2)              | `0.0377`                          |
| `dur`           | 秒を期間へ                            | `14820 -> 4h07m`                  |
| `pct`           | `%` を追加                            | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | 使用済みから残りへ                |
| `alias:TABLE`   | `aliases` で検索し、未登録ならそのまま表示 | `medium -> 🌗`                    |
| `meter:W:SCALE` | 0-100 の値に対する W セルのグリフバー | `[⣿⣿⠐⠐⠐]` (`meter:1` = 1 グリフ) |

### ピース形式

- `{ "text": "📚 {context.max_tokens|num}" }`: リテラル + 補間。
- `{ "when": "<path>", "text": "..." }`: パスが truthy の場合のみレンダリングします。
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: 値をグリフへ。
- `{ "each": "limits.windows", "item": "{label}" }`: 配列を反復します。

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

## プロバイダー + 認証情報

- **Anthropic (Claude)**: 認証プロファイル内の OAuth トークン。
- **GitHub Copilot**: 認証プロファイル内の OAuth トークン。
- **Gemini CLI**: 認証プロファイル内の OAuth トークン。
  - JSON 使用量は `stats` にフォールバックします。`stats.cached` は
    `cacheRead` に正規化されます。
- **OpenAI Codex**: 認証プロファイル内の OAuth トークン（存在する場合は accountId を使用）。
- **MiniMax**: API キーまたは MiniMax OAuth 認証プロファイル。OpenClaw は
  `minimax`、`minimax-cn`、`minimax-portal` を同じ MiniMax クォータ
  サーフェスとして扱い、保存済みの MiniMax OAuth が存在する場合はそれを優先し、それ以外の場合は
  `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、または `MINIMAX_API_KEY` にフォールバックします。
  使用量ポーリングは、設定されている場合 `models.providers.minimax-portal.baseUrl`
  または `models.providers.minimax.baseUrl` から Coding Plan ホストを導出し、それ以外の場合は
  MiniMax CN ホストを使用します。
  MiniMax の生の `usage_percent` / `usagePercent` フィールドは **残り**
  クォータを意味するため、OpenClaw は表示前にそれらを反転します。存在する場合は
  カウントベースのフィールドが優先されます。
  - Coding Plan のウィンドウラベルは、存在する場合はプロバイダーの hours/minutes フィールドから取得され、
    その後 `start_time` / `end_time` の範囲にフォールバックします。
  - Coding Plan エンドポイントが `model_remains` を返す場合、OpenClaw は
    chat-model エントリを優先し、明示的な
    `window_hours` / `window_minutes` フィールドがない場合はタイムスタンプからウィンドウラベルを導出し、プランラベルにモデル
    名を含めます。
- **Xiaomi MiMo**: env/config/auth ストア経由の API キー（`XIAOMI_API_KEY`）。
- **z.ai**: env/config/auth ストア経由の API キー。
- **DeepSeek**: env/config/auth ストア経由の API キー（`DEEPSEEK_API_KEY`）。
  OpenClaw は DeepSeek の残高エンドポイントを呼び出し、プロバイダーから報告された
  残高を、残りパーセントのクォータウィンドウではなくテキストとして表示します。

使用可能なプロバイダー使用量認証を解決できない場合、使用量は非表示になります。プロバイダーは
Plugin 固有の使用量認証ロジックを提供できます。それ以外の場合、OpenClaw は認証プロファイル、環境変数、
または設定から一致する OAuth/API キー資格情報にフォールバックします。

## 関連

- [トークン使用量とコスト](/ja-JP/reference/token-use)
- [API 使用量とコスト](/ja-JP/reference/api-usage-costs)
- [プロンプトキャッシュ](/ja-JP/reference/prompt-caching)

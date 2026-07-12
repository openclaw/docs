---
read_when:
    - デフォルトモデルを変更する、またはプロバイダーの認証状態を確認する場合
    - 利用可能なモデル／プロバイダーをスキャンし、認証プロファイルをデバッグする場合
summary: '`openclaw models` の CLI リファレンス（ステータス／一覧／設定／スキャン、エイリアス、フォールバック、認証）'
title: モデル
x-i18n:
    generated_at: "2026-07-12T14:23:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 330598225664ff961ab41bf6358226ad64eb43e941be7f422cfde0fe9d93cea8
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

モデルの検出、スキャン、設定（デフォルトモデル、フォールバック、認証プロファイル）。

関連項目:

- プロバイダーとモデル: [モデル](/ja-JP/providers/models)
- モデル選択の概念と `/models` スラッシュコマンド: [モデルの概念](/ja-JP/concepts/models)
- プロバイダー認証のセットアップ: [はじめに](/ja-JP/start/getting-started)

## よく使うコマンド

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
openclaw models scan
```

`status` および `auth` サブコマンドは、設定済みエージェントを対象にするための `--agent <id>` を受け付けます。`list`、`scan`、`aliases`、`fallbacks`/`image-fallbacks` は常に設定済みのデフォルトエージェントを使用し、`set`/`set-image` は `--agent` を明示的に拒否します。省略した場合、`--agent` 対応コマンドは、設定されていれば `OPENCLAW_AGENT_DIR` を使用し、それ以外の場合は設定済みのデフォルトエージェントを使用します。

### ステータス

`openclaw models status` は、解決済みのデフォルトモデルとフォールバックに加えて、認証の概要を表示します。プロバイダーの使用状況スナップショットが利用可能な場合、OAuth/API キーのステータスセクションには、プロバイダーの使用期間とクォータのスナップショットが含まれます。現在の使用期間対応プロバイダーは、Anthropic、GitHub Copilot、Gemini CLI、OpenAI、MiniMax、Xiaomi、z.ai です。使用状況の認証情報は、利用可能な場合はプロバイダー固有のフックから取得されます。それ以外の場合、OpenClaw は認証プロファイル、環境変数、または設定から、一致する OAuth/API キー認証情報を使用します。

`--json` 出力では、`auth.providers` は環境変数、設定、ストアを考慮したプロバイダー概要であり、`auth.oauth` は認証ストア内のプロファイルの健全性のみを示します。

オプション:

| フラグ                    | 効果                                                                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `--json`                  | JSON 出力。標準出力を `jq` にパイプできる状態に保つため、認証プロファイル、プロバイダー、起動時の診断は標準エラー出力に送られます。 |
| `--plain`                 | プレーンテキスト出力。                                                                                                             |
| `--check`                 | 認証の期限切れが近い、または期限切れの場合に 0 以外で終了します: `1` = 期限切れ/欠落、`2` = 期限切れ間近。                           |
| `--probe`                 | 設定済み認証プロファイルのライブプローブ。実際にリクエストを送信するため、トークンを消費し、レート制限が発生する可能性があります。  |
| `--probe-provider <name>` | 1 つのプロバイダーのみをプローブします。                                                                                            |
| `--probe-profile <id>`    | 特定の認証プロファイル ID をプローブします（繰り返し指定またはカンマ区切り）。                                                      |
| `--probe-timeout <ms>`    | プローブごとのタイムアウト。                                                                                                       |
| `--probe-concurrency <n>` | 同時実行するプローブ数。                                                                                                           |
| `--probe-max-tokens <n>`  | プローブの最大トークン数（ベストエフォート）。                                                                                     |
| `--agent <id>`            | 設定済みエージェント ID。`OPENCLAW_AGENT_DIR` より優先されます。                                                                    |

プローブ行の取得元には、認証プロファイル、環境変数の認証情報、または `models.json` があります。プローブステータスの分類: `ok`、`auth`、`rate_limit`、`billing`、`timeout`、`format`、`unknown`、`no_model`。

プローブがモデル呼び出しに到達しなかった場合に想定される詳細/理由コード:

- `excluded_by_auth_order`: 保存済みプロファイルは存在しますが、明示的な `auth.order.<provider>` から除外されているため、プローブは試行せず除外されたことを報告します。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`: プロファイルは存在しますが、使用資格がないか、解決できません。
- `ineligible_profile`: 別の理由により、プロファイルがプロバイダー設定と互換性を持ちません。
- `no_model`: プロバイダーの認証情報は存在しますが、OpenClaw はそのプロバイダーについてプローブ可能なモデル候補を解決できませんでした。

OpenAI ChatGPT/Codex OAuth のトラブルシューティングでは、`openclaw models status`、`openclaw models auth list --provider openai`、`openclaw config get agents.defaults.model --json` を使用すると、エージェントがネイティブ Codex ランタイムを通じて `openai/*` に使用できる `openai` OAuth プロファイルを持っているかどうかを最も迅速に確認できます。[OpenAI プロバイダーのセットアップ](/ja-JP/providers/openai#check-and-recover-codex-oauth-routing)を参照してください。

### 一覧

`openclaw models list` は読み取り専用です。設定、認証プロファイル、既存のカタログ状態、プロバイダー所有のカタログ行を読み取りますが、`models.json` を書き換えることはありません。

オプション: `--all`（完全なカタログ）、`--local`（ローカルモデルに絞り込み）、`--provider <id>`、`--json`、`--plain`。

注記:

- `Auth` 列は読み取り専用です。OpenAI などのプロバイダー所有モデルルートでは、各行の API/ベース URL ルートを、有効な `auth.order` 内の使用可能なプロファイル、環境変数/設定の認証情報、および解決済みのコマンドスコープ SecretRef と照合します。具体的な OpenAI 行では、そのルートポリシーが利用できない場合、プロバイダーレベルの認証を借用せず不明のままになります。プロバイダーのみのレガシーチェックとその他のプロバイダーでは、プロバイダーレベルの動作が維持されます。Plugin の合成認証メタデータはランタイム機能のヒントにすぎず、ネイティブアカウント認証の証明ではないため、レジストリから明確な証拠がない限り、アカウント依存のルートは不明のままです。このコマンドは、プロバイダーランタイムの読み込み、キーチェーンのシークレットの読み取り、プロバイダー API の呼び出し、正確な実行準備状況の証明を行いません。
- `models list --all --provider <id>` には、そのプロバイダーでまだ認証していない場合でも、Plugin マニフェストまたはバンドルされたプロバイダーカタログのメタデータから取得した、プロバイダー所有の静的カタログ行が含まれることがあります。一致する認証が設定されるまで、これらの行は引き続き利用不可として表示されます。
- `models list` は、プロバイダーカタログの検出が遅い場合でも、コントロールプレーンの応答性を維持します。デフォルトビューと設定済みビューは、短い待機時間の後に設定済みまたは合成モデル行へフォールバックし、検出をバックグラウンドで完了させます。検出された正確な完全版カタログが必要で、プロバイダーの検出を待つことができる場合は、`--all` を使用してください。
- 広範な `models list --all` は、プロバイダーランタイムの補足フックを読み込まず、マニフェストカタログ行をレジストリ行より優先してマージします。プロバイダーで絞り込まれたマニフェストの高速パスでは、`static` とマークされたプロバイダーのみを使用します。`refreshable` とマークされたプロバイダーはレジストリ/キャッシュを基盤とし、マニフェスト行を補足として追加します。一方、`runtime` とマークされたプロバイダーはレジストリ/ランタイム検出を継続して使用します。
- `models list` は、ネイティブモデルのメタデータとランタイム上限を区別して保持します。テーブル出力では、有効なランタイム上限がネイティブのコンテキストウィンドウと異なる場合、`Ctx` に `contextTokens/contextWindow` が表示されます。プロバイダーがその上限を公開している場合、JSON 行には `contextTokens` が含まれます。
- プロバイダー所有のルートについて、`models list` は 1 つの論理的なプロバイダー/モデル行を、選択されたルートに投影します。`Input` と `Ctx` は、完全に一致する物理ルートのカタログ行のみから取得され、明示的に設定された論理オーバーライドが最後に適用されます。ルート選択を解決できない場合、兄弟ルートのメタデータを借用せず、機能フィールドは不明として表示されます。
- `models list --provider <id>` は、`moonshot` や `openai` などのプロバイダー ID で絞り込みます。`Moonshot AI` など、対話型プロバイダー選択画面の表示ラベルは受け付けません。
- モデル参照は、**最初の** `/` で分割して解析されます。モデル ID に `/` が含まれる場合（OpenRouter 形式）は、プロバイダープレフィックスを含めてください（例: `openrouter/moonshotai/kimi-k2`）。
- プロバイダーを省略した場合、OpenClaw はまず入力をエイリアスとして解決し、次にその正確なモデル ID に対する一意の設定済みプロバイダー一致として解決します。それでも解決できない場合にのみ、非推奨警告を表示して設定済みのデフォルトプロバイダーへフォールバックします。そのプロバイダーが設定済みのデフォルトモデルを公開しなくなった場合、OpenClaw は削除済みプロバイダーの古いデフォルトを表示する代わりに、最初の設定済みプロバイダー/モデルへフォールバックします。
- `models status` は、シークレットではないプレースホルダー（例: `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`）について、シークレットとしてマスクする代わりに、認証出力に `marker(<value>)` を表示する場合があります。

### デフォルトモデル/画像モデルの設定

```bash
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
```

`set` は `agents.defaults.model.primary` に書き込み、`set-image` は `agents.defaults.imageModel.primary` に書き込みます。どちらも `provider/model` または設定済みエイリアスを受け付けます。`set` は、新しく選択したモデルで必要な場合、Codex/Copilot ランタイム Plugin のインストールも修復しますが、`set-image` は修復しません。どちらのコマンドも `--agent` を受け付けず、常にエージェントのデフォルト設定へ書き込みます。

### スキャン

`models scan` は OpenRouter の公開 `:free` カタログを読み取り、フォールバック用途の候補をランク付けします。カタログ自体は公開されているため、メタデータのみのスキャンに OpenRouter キーは必要ありません。

デフォルトでは、OpenClaw はライブモデル呼び出しによってツールと画像のサポートをプローブしようとします。OpenRouter キーが設定されていない場合、コマンドはメタデータのみの出力へフォールバックし、`:free` モデルでもプローブと推論には `OPENROUTER_API_KEY` が必要であることを説明します。

オプション:

- `--no-probe`（メタデータのみ。設定/シークレットを参照しません）
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>`（カタログリクエストおよびプローブごとのタイムアウト）
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` と `--set-image` にはライブプローブが必要です。メタデータのみのスキャン結果は参考情報であり、設定には適用されません。

## エイリアス

```bash
openclaw models aliases list [--json] [--plain]
openclaw models aliases add <alias> <model-or-alias>
openclaw models aliases remove <alias>
```

エイリアスは、モデルエントリごとに `agents.defaults.models.<key>.alias` として保存されます。`add` はまず `<model-or-alias>` を正規のプロバイダー/モデルキーに解決するため、エイリアスに別のエイリアスを割り当てると、連鎖するのではなく参照先が変更されます。

## フォールバック

```bash
openclaw models fallbacks list [--json] [--plain]
openclaw models fallbacks add <model-or-alias>
openclaw models fallbacks remove <model-or-alias>
openclaw models fallbacks clear
```

`agents.defaults.model.fallbacks` を管理します。`openclaw models image-fallbacks list|add|remove|clear` は、同じサブコマンド形式で、対応する `agents.defaults.imageModel.fallbacks` リストを管理します。

## 認証プロファイル

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth login-github-copilot
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token --provider <id>
openclaw models auth order get --provider <id>
openclaw models auth order set --provider <id> <profileIds...>
openclaw models auth order clear --provider <id>
```

`models auth add` は対話型の認証ヘルパーです。選択したプロバイダーに応じて、プロバイダーの認証フロー（OAuth/API キー）を開始するか、トークンを手動で貼り付ける手順を案内します。

`models auth list` は、トークン、API キー、OAuth シークレットの内容を表示せずに、選択したエージェントに保存されている認証プロファイルを一覧表示します。`openai` などの単一プロバイダーに絞り込むには `--provider <id>` を使用し、スクリプトで処理するには `--json` を使用してください。

`models auth login` は、プロバイダー Plugin の認証フロー（OAuth/API キー）を実行します。インストール済みのプロバイダーを確認するには、`openclaw plugins list` を使用してください。`login` は、ログイン時に名前付きプロファイルをサポートするプロバイダー向けの `--profile-id <id>`（同じプロバイダーの複数のログインを分けて保持する場合に使用）、特定の認証方式を選択する `--method <id>`、`--method device-code` のショートカットである `--device-code`、プロバイダー推奨のデフォルトモデルを適用する `--set-default`、およびそのプロバイダーの既存プロファイルを先に削除する `--force`（キャッシュされた OAuth プロファイルが動作しない場合や、アカウントを切り替える場合に使用）を受け付けます。

`models auth login-github-copilot` は `models auth login --provider github-copilot --method device`（GitHub デバイスフロー）のショートカットです。プロンプトを表示せずに既存プロファイルを上書きするには、`--yes` を使用できます。

`openclaw models auth --agent <id> <subcommand>`を使用すると、認証結果を設定済みの特定のエージェントストアに書き込めます。親の`--agent`フラグは、`add`、`list`、`login`、`paste-api-key`、`setup-token`、`paste-token`、`login-github-copilot`、および`order get`/`set`/`clear`で有効です。

OpenAIモデルでは、`--provider openai`のデフォルトはChatGPT/Codexアカウントへのログインです。OpenAI APIキープロファイルを追加する場合にのみ`--method api-key`を使用してください。通常は、Codexサブスクリプションの制限に備えたバックアップとして使用します。古いレガシーOpenAI Codexプレフィックスの認証/プロファイル状態を`openai`に移行するには、`openclaw doctor --fix`を実行します。

例:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

注:

- `paste-api-key`は別の場所で生成されたAPIキーを受け付け、キーの値を入力するよう求め、`--profile-id`を渡さない限りデフォルトのプロファイルID`<provider>:manual`に書き込みます。自動化では、たとえば`printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`のように、標準入力からキーをパイプしてください。
- `setup-token`と`paste-token`は、トークン認証方式を公開するプロバイダー向けの汎用トークンコマンドとして引き続き使用できます。
- `setup-token`には対話型TTYが必要で、プロバイダーのトークン認証方式を実行します（プロバイダーが`setup-token`方式を公開している場合、デフォルトではその方式を使用します）。
- `paste-token`には`--provider`が必要です。デフォルトではトークン値の入力を求め、`--profile-id`を渡さない限りデフォルトのプロファイルID`<provider>:manual`に書き込みます。自動化では、プロバイダーの認証情報がシェル履歴やプロセス一覧に表示されないよう、引数として渡すのではなく、標準入力からトークンをパイプしてください。
- `paste-token --expires-in <duration>`は、`365d`や`12h`などの相対期間から算出したトークンの絶対有効期限を保存します。
- `openai`では、OpenAI APIキーとChatGPT/OAuthトークン情報は異なる認証形式です。`sk-...`形式のOpenAI APIキーには`paste-api-key`を使用し、`paste-token`はトークン認証情報にのみ使用してください。
- Anthropic: `setup-token`/`paste-token`は`anthropic`向けのOpenClaw認証経路としてサポートされていますが、ホスト上でClaude CLI（`claude -p`）を利用できる場合、OpenClawはその再利用を優先します。
- `auth order get/set/clear`は、1つのプロバイダーについてエージェント単位の認証プロファイル順序オーバーライドを管理し、`auth-state.json`に保存します（`auth.order.<provider>`設定キーとは別です）。`set`には、優先順位順に1つ以上のプロファイルIDを指定します。`clear`を実行すると、設定またはラウンドロビンによる順序付けにフォールバックします。

## 関連項目

- [CLIリファレンス](/ja-JP/cli)
- [モデルの選択](/ja-JP/concepts/model-providers)
- [モデルのフェイルオーバー](/ja-JP/concepts/model-failover)

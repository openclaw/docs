---
read_when:
    - デフォルトモデルを変更するか、プロバイダーの認証ステータスを表示したい場合
    - 利用可能なモデル/プロバイダーをスキャンし、認証プロファイルをデバッグしたい場合
summary: '`openclaw models` の CLI リファレンス（status/list/set/scan、エイリアス、フォールバック、認証）'
title: モデル
x-i18n:
    generated_at: "2026-07-05T11:12:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58fdd11c745bc823f7dac5be9aa75f7dbbe622b66ffb9d9fd3505f0453371f88
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

モデルの検出、スキャン、設定（デフォルトモデル、フォールバック、認証プロファイル）。

関連:

- プロバイダー + モデル: [モデル](/ja-JP/providers/models)
- モデル選択の概念 + `/models` スラッシュコマンド: [モデルの概念](/ja-JP/concepts/models)
- プロバイダー認証のセットアップ: [はじめに](/ja-JP/start/getting-started)

## よく使うコマンド

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
openclaw models scan
```

`status` と `auth` サブコマンドは、設定済みエージェントを対象にするための `--agent <id>` を受け付けます。`list`、`scan`、`aliases`、`fallbacks`/`image-fallbacks` は常に設定済みのデフォルトエージェントを使用し、`set`/`set-image` は `--agent` を明示的に拒否します。省略した場合、`--agent` 対応コマンドは、設定されていれば `OPENCLAW_AGENT_DIR` を使用し、それ以外は設定済みのデフォルトエージェントを使用します。

### ステータス

`openclaw models status` は、解決済みのデフォルト/フォールバックと認証の概要を表示します。プロバイダー使用状況のスナップショットが利用可能な場合、OAuth/APIキーのステータスセクションには、プロバイダーの使用期間とクォータのスナップショットが含まれます。現在の使用期間プロバイダー: Anthropic、GitHub Copilot、Gemini CLI、OpenAI、MiniMax、Xiaomi、z.ai。使用状況の認証は、利用可能な場合はプロバイダー固有のフックから取得されます。それ以外の場合、OpenClaw は認証プロファイル、env、または設定から一致する OAuth/APIキー認証情報へフォールバックします。

`--json` 出力では、`auth.providers` は env/config/store を認識するプロバイダー概要であり、`auth.oauth` は認証ストアのプロファイル健全性のみです。

オプション:

| フラグ                    | 効果                                                                                                             |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `--json`                  | JSON 出力。stdout を `jq` にパイプ可能なままにするため、認証プロファイル、プロバイダー、起動診断は stderr に出力されます。 |
| `--plain`                 | プレーンテキスト出力。                                                                                           |
| `--check`                 | 認証が期限切れ間近/期限切れの場合に非ゼロで終了します: `1` = 期限切れ/欠落、`2` = 期限切れ間近。                  |
| `--probe`                 | 設定済み認証プロファイルのライブプローブ。実際のリクエストです。トークンを消費し、レート制限を引き起こす場合があります。 |
| `--probe-provider <name>` | 1 つのプロバイダーのみをプローブします。                                                                          |
| `--probe-profile <id>`    | 特定の認証プロファイル ID をプローブします（繰り返しまたはカンマ区切り）。                                       |
| `--probe-timeout <ms>`    | プローブごとのタイムアウト。                                                                                      |
| `--probe-concurrency <n>` | 同時プローブ数。                                                                                                  |
| `--probe-max-tokens <n>`  | プローブの最大トークン数（ベストエフォート）。                                                                    |
| `--agent <id>`            | 設定済みエージェント ID。`OPENCLAW_AGENT_DIR` を上書きします。                                                    |

プローブ行は、認証プロファイル、env 認証情報、または `models.json` から取得される場合があります。プローブのステータス分類: `ok`、`auth`、`rate_limit`、`billing`、`timeout`、`format`、`unknown`、`no_model`。

プローブがモデル呼び出しに到達しない場合に想定されるプローブ詳細/理由コード:

- `excluded_by_auth_order`: 保存済みプロファイルは存在しますが、明示的な `auth.order.<provider>` がそれを省略したため、プローブは試行する代わりに除外を報告します。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`: プロファイルは存在しますが、対象外または解決不能です。
- `ineligible_profile`: 別の理由で、プロファイルがプロバイダー設定と互換性がありません。
- `no_model`: プロバイダー認証は存在しますが、OpenClaw はそのプロバイダー用にプローブ可能なモデル候補を解決できませんでした。

OpenAI ChatGPT/Codex OAuth のトラブルシューティングでは、`openclaw models status`、`openclaw models auth list --provider openai`、`openclaw config get agents.defaults.model --json` が、エージェントがネイティブ Codex ランタイムを通じて `openai/*` に使用できる `openai` OAuth プロファイルを持っているかを確認する最短の方法です。[OpenAI プロバイダーのセットアップ](/ja-JP/providers/openai#check-and-recover-codex-oauth-routing)を参照してください。

### 一覧

`openclaw models list` は読み取り専用です。設定、認証プロファイル、既存のカタログ状態、プロバイダー所有のカタログ行を読み取りますが、`models.json` を書き換えることはありません。

オプション: `--all`（完全なカタログ）、`--local`（ローカルモデルに絞り込み）、`--provider <id>`、`--json`、`--plain`。

注記:

- `Auth` 列はプロバイダーレベルで読み取り専用です。これは、ローカル認証プロファイルメタデータ、env マーカー、設定済みプロバイダーキー、ローカルプロバイダーマーカー、AWS Bedrock env/プロファイルマーカー、Plugin 合成認証メタデータから計算されます。プロバイダーランタイムを読み込むこと、キーチェーンシークレットを読み取ること、プロバイダー API を呼び出すこと、モデルごとの正確な実行準備状況を証明することはありません。
- `models list --all --provider <id>` は、まだそのプロバイダーで認証していない場合でも、Plugin マニフェストまたはバンドルされたプロバイダーカタログメタデータからプロバイダー所有の静的カタログ行を含めることがあります。それらの行は、一致する認証が設定されるまで引き続き利用不可として表示されます。
- `models list` は、プロバイダーカタログ検出が遅い間もコントロールプレーンの応答性を保ちます。デフォルトビューと設定済みビューは、短い待機の後に設定済みまたは合成モデル行へフォールバックし、検出はバックグラウンドで完了させます。正確な完全検出済みカタログが必要で、プロバイダー検出を待つ意思がある場合は `--all` を使用します。
- 広範な `models list --all` は、プロバイダーランタイム補足フックを読み込まずに、マニフェストカタログ行をレジストリ行の上にマージします。プロバイダーで絞り込んだマニフェスト高速パスは、`static` とマークされたプロバイダーのみを使用します。`refreshable` とマークされたプロバイダーはレジストリ/キャッシュベースのままで、マニフェスト行を補足として追加します。一方、`runtime` とマークされたプロバイダーはレジストリ/ランタイム検出のままです。
- `models list` はネイティブモデルメタデータとランタイム上限を区別して保持します。テーブル出力では、有効なランタイム上限がネイティブのコンテキストウィンドウと異なる場合、`Ctx` は `contextTokens/contextWindow` を表示します。JSON 行には、プロバイダーがその上限を公開する場合に `contextTokens` が含まれます。
- `models list --provider <id>` は、`moonshot` や `openai` などのプロバイダー ID で絞り込みます。`Moonshot AI` など、対話型プロバイダーピッカーの表示ラベルは受け付けません。
- モデル参照は **最初の** `/` で分割して解析されます。モデル ID に `/` が含まれる場合（OpenRouter スタイル）、プロバイダープレフィックスを含めます（例: `openrouter/moonshotai/kimi-k2`）。
- プロバイダーを省略した場合、OpenClaw はまず入力をエイリアスとして解決し、次にその正確なモデル ID に対する一意の設定済みプロバイダー一致として解決し、その後にのみ非推奨警告付きで設定済みデフォルトプロバイダーへフォールバックします。そのプロバイダーが設定済みデフォルトモデルをもう公開していない場合、OpenClaw は古い削除済みプロバイダーのデフォルトを表示する代わりに、最初の設定済みプロバイダー/モデルへフォールバックします。
- `models status` は、非シークレットのプレースホルダー（例: `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`）をシークレットとしてマスクする代わりに、認証出力で `marker(<value>)` を表示する場合があります。

### デフォルト / 画像モデルを設定

```bash
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
```

`set` は `agents.defaults.model.primary` に書き込みます。`set-image` は `agents.defaults.imageModel.primary` に書き込みます。どちらも `provider/model` または設定済みエイリアスを受け付けます。`set` は、新しく選択されたモデルが必要とする場合に Codex/Copilot ランタイム Plugin インストールも修復します。`set-image` は修復しません。どちらのコマンドも `--agent` を受け付けません。常にエージェントのデフォルトを書き込みます。

### スキャン

`models scan` は OpenRouter の公開 `:free` カタログを読み取り、フォールバック用途の候補をランク付けします。カタログ自体は公開されているため、メタデータのみのスキャンには OpenRouter キーは不要です。

デフォルトでは、OpenClaw はライブモデル呼び出しでツールと画像のサポートをプローブしようとします。OpenRouter キーが設定されていない場合、コマンドはメタデータのみの出力へフォールバックし、`:free` モデルでもプローブと推論には `OPENROUTER_API_KEY` が必要であることを説明します。

オプション:

- `--no-probe`（メタデータのみ。設定/シークレットの検索なし）
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>`（カタログリクエストとプローブごとのタイムアウト）
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` と `--set-image` にはライブプローブが必要です。メタデータのみのスキャン結果は情報提供用であり、設定には適用されません。

## エイリアス

```bash
openclaw models aliases list [--json] [--plain]
openclaw models aliases add <alias> <model-or-alias>
openclaw models aliases remove <alias>
```

エイリアスは、モデルエントリごとに `agents.defaults.models.<key>.alias` として保存されます。`add` はまず `<model-or-alias>` を正規の provider/model キーへ解決するため、エイリアスにエイリアスを設定すると、チェーンするのではなく参照先を付け替えます。

## フォールバック

```bash
openclaw models fallbacks list [--json] [--plain]
openclaw models fallbacks add <model-or-alias>
openclaw models fallbacks remove <model-or-alias>
openclaw models fallbacks clear
```

`agents.defaults.model.fallbacks` を管理します。`openclaw models image-fallbacks list|add|remove|clear` は、同じサブコマンド形状で並行する `agents.defaults.imageModel.fallbacks` リストを管理します。

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

`models auth add` は対話型の認証ヘルパーです。選択したプロバイダーに応じて、プロバイダー認証フロー（OAuth/APIキー）を起動するか、手動のトークン貼り付けへ案内します。

`models auth list` は、選択したエージェントの保存済み認証プロファイルを、トークン、APIキー、OAuth シークレット素材を出力せずに一覧表示します。`openai` など 1 つのプロバイダーに絞り込むには `--provider <id>` を使用し、スクリプトには `--json` を使用します。

`models auth login` はプロバイダー Plugin の認証フロー（OAuth/APIキー）を実行します。インストール済みのプロバイダーを確認するには `openclaw plugins list` を使用します。`login` は、ログイン中に名前付きプロファイルをサポートするプロバイダー向けの `--profile-id <id>`（同じプロバイダーの複数ログインを分離して保持するために使用）、特定の認証方式を選ぶための `--method <id>`、`--method device-code` のショートカットである `--device-code`、プロバイダー推奨のデフォルトモデルを適用する `--set-default`、そのプロバイダーの既存プロファイルを先に削除する `--force`（キャッシュされた OAuth プロファイルが詰まっている場合やアカウントを切り替えたい場合に使用）を受け付けます。

`models auth login-github-copilot` は `models auth login --provider github-copilot --method device`（GitHub デバイスフロー）のショートカットです。プロンプトなしで既存プロファイルを上書きするための `--yes` を受け付けます。

認証結果を特定の設定済みエージェントストアに書き込むには、`openclaw models auth --agent <id> <subcommand>` を使用します。親の `--agent` フラグは、`add`、`list`、`login`、`paste-api-key`、`setup-token`、`paste-token`、`login-github-copilot`、および `order get`/`set`/`clear` で尊重されます。

OpenAI モデルでは、`--provider openai` はデフォルトで ChatGPT/Codex アカウントログインになります。OpenAI APIキー プロファイルを追加したい場合、通常は Codex サブスクリプション上限のバックアップとして、`--method api-key` のみを使用します。古いレガシー OpenAI Codex プレフィックスの認証/プロファイル状態を `openai` に移行するには、`openclaw doctor --fix` を実行します。

例:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

注記:

- `paste-api-key` は別の場所で生成された API キーを受け取り、キーの値の入力を求めます。`--profile-id` を渡さない限り、デフォルトのプロファイル ID `<provider>:manual` に書き込みます。自動化では、たとえば `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai` のように、キーを標準入力にパイプしてください。
- `setup-token` と `paste-token` は、トークン認証方式を公開するプロバイダー向けの汎用トークンコマンドのままです。
- `setup-token` には対話型 TTY が必要で、プロバイダーのトークン認証方式を実行します。そのプロバイダーが `setup-token` 方式を公開している場合は、デフォルトでそれを使用します。
- `paste-token` には `--provider` が必要です。デフォルトではトークン値の入力を求め、`--profile-id` を渡さない限り、デフォルトのプロファイル ID `<provider>:manual` に書き込みます。自動化では、プロバイダーの認証情報がシェル履歴やプロセス一覧に表示されないように、トークンを引数として渡す代わりに標準入力にパイプしてください。
- `paste-token --expires-in <duration>` は、`365d` や `12h` のような相対期間から絶対トークン有効期限を保存します。
- `openai` では、OpenAI API キーと ChatGPT/OAuth トークンデータは異なる認証形式です。`sk-...` OpenAI API キーには `paste-api-key` を使用し、`paste-token` はトークン認証データにのみ使用してください。
- Anthropic: `setup-token`/`paste-token` は `anthropic` 向けにサポートされている OpenClaw 認証経路ですが、OpenClaw は利用可能な場合、ホスト上の Claude CLI (`claude -p`) の再利用を優先します。
- `auth order get/set/clear` は、1 つのプロバイダーに対するエージェントごとの認証プロファイル順序オーバーライドを管理します。これは `auth-state.json` に保存されます（`auth.order.<provider>` 設定キーとは別です）。`set` は優先順で 1 つ以上のプロファイル ID を受け取ります。`clear` は設定/ラウンドロビン順序にフォールバックします。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [モデル選択](/ja-JP/concepts/model-providers)
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)

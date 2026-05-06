---
read_when:
    - デフォルトモデルを変更するか、プロバイダーの認証ステータスを確認したい
    - 利用可能なモデル/プロバイダーをスキャンし、認証プロファイルをデバッグしたい場合
summary: '`openclaw models` の CLI リファレンス（status/list/set/scan、エイリアス、フォールバック、認証）'
title: モデル
x-i18n:
    generated_at: "2026-05-06T19:35:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7749d97382529587d54ea96466edc880a731f2c2d39eed1677e4fbf129f11435
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

モデルの検出、スキャン、構成（デフォルトモデル、フォールバック、認証プロファイル）。

関連:

- プロバイダー + モデル: [モデル](/ja-JP/providers/models)
- モデル選択の概念 + `/models` スラッシュコマンド: [モデルの概念](/ja-JP/concepts/models)
- プロバイダー認証の設定: [はじめに](/ja-JP/start/getting-started)

## よく使うコマンド

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` は、解決済みのデフォルト/フォールバックと認証の概要を表示します。
プロバイダー使用状況スナップショットが利用可能な場合、OAuth/APIキーのステータスセクションには、プロバイダーの使用ウィンドウとクォータスナップショットが含まれます。
現在の使用ウィンドウ対応プロバイダー: Anthropic、GitHub Copilot、Gemini CLI、OpenAI Codex、MiniMax、Xiaomi、z.ai。使用状況認証は、利用可能な場合はプロバイダー固有のフックから取得されます。それ以外の場合、OpenClaw は認証プロファイル、env、または構成から一致する OAuth/APIキー認証情報にフォールバックします。
`--json` 出力では、`auth.providers` は env/構成/ストアを考慮したプロバイダー概要であり、`auth.oauth` は認証ストアのプロファイル健全性のみです。
各構成済みプロバイダープロファイルに対してライブ認証プローブを実行するには、`--probe` を追加します。
プローブは実際のリクエストです（トークンを消費し、レート制限を引き起こす可能性があります）。
構成済みエージェントのモデル/認証状態を調べるには、`--agent <id>` を使用します。省略した場合、コマンドは `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` が設定されていればそれを使用し、それ以外の場合は構成済みのデフォルトエージェントを使用します。
プローブ行は、認証プロファイル、env 認証情報、または `models.json` から取得されることがあります。
Codex OAuth のトラブルシューティングでは、`openclaw models status`、`openclaw models auth list --provider openai-codex`、および `openclaw config get agents.defaults.model --json` が、エージェントが PI 経由で `openai-codex/*` を使用しているのか、ネイティブ Codex ランタイム経由で `openai/*` を使用しているのかを確認する最短の方法です。[OpenAI プロバイダー設定](/ja-JP/providers/openai#check-and-recover-codex-oauth-routing)を参照してください。

注:

- `models set <model-or-alias>` は `provider/model` またはエイリアスを受け付けます。
- `models list` は読み取り専用です。構成、認証プロファイル、既存のカタログ状態、プロバイダー所有のカタログ行を読み取りますが、`models.json` は書き換えません。
- `Auth` 列はプロバイダーレベルで読み取り専用です。ローカル認証プロファイルメタデータ、env マーカー、構成済みプロバイダーキー、ローカルプロバイダーマーカー、AWS Bedrock env/プロファイルマーカー、Plugin の合成認証メタデータから計算されます。プロバイダーランタイムの読み込み、キーチェーンシークレットの読み取り、プロバイダー API の呼び出し、またはモデルごとの正確な実行準備状況の証明は行いません。
- `models list --all --provider <id>` は、そのプロバイダーでまだ認証していない場合でも、Plugin マニフェストまたはバンドルされたプロバイダーカタログメタデータからプロバイダー所有の静的カタログ行を含めることがあります。これらの行は、一致する認証が構成されるまで引き続き利用不可として表示されます。
- `models list` は、プロバイダーのカタログ検出が遅い間もコントロールプレーンの応答性を維持します。デフォルトビューと構成済みビューは、短い待機後に構成済みまたは合成モデル行へフォールバックし、検出はバックグラウンドで完了させます。正確な完全検出済みカタログが必要で、プロバイダー検出を待つ意思がある場合は `--all` を使用します。
- 広範な `models list --all` は、プロバイダーランタイム補足フックを読み込まずに、マニフェストのカタログ行をレジストリ行より優先してマージします。プロバイダーで絞り込んだマニフェスト高速パスは、`static` とマークされたプロバイダーのみを使用します。`refreshable` とマークされたプロバイダーはレジストリ/キャッシュベースのままで、マニフェスト行を補足として追加します。一方、`runtime` とマークされたプロバイダーはレジストリ/ランタイム検出のままです。
- `models list` は、ネイティブモデルメタデータとランタイム上限を区別して保持します。テーブル出力では、有効なランタイム上限がネイティブのコンテキストウィンドウと異なる場合、`Ctx` は `contextTokens/contextWindow` を表示します。JSON 行には、プロバイダーがその上限を公開している場合に `contextTokens` が含まれます。
- `models list --provider <id>` は、`moonshot` や `openai-codex` などのプロバイダー id で絞り込みます。`Moonshot AI` など、インタラクティブなプロバイダー選択で使われる表示ラベルは受け付けません。
- モデル参照は **最初の** `/` で分割して解析されます。モデル ID に `/` が含まれる場合（OpenRouter 形式）、プロバイダープレフィックスを含めてください（例: `openrouter/moonshotai/kimi-k2`）。
- プロバイダーを省略した場合、OpenClaw は入力をまずエイリアスとして解決し、次にその正確なモデル id に対する一意の構成済みプロバイダー一致として解決し、その後で非推奨警告とともに構成済みのデフォルトプロバイダーへフォールバックします。そのプロバイダーが構成済みのデフォルトモデルをもう公開していない場合、OpenClaw は古い削除済みプロバイダーのデフォルトを表示する代わりに、最初の構成済みプロバイダー/モデルへフォールバックします。
- `models status` は、認証出力で非シークレットのプレースホルダー（例: `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`）をシークレットとしてマスクする代わりに、`marker(<value>)` を表示することがあります。

### モデルスキャン

`models scan` は OpenRouter の公開 `:free` カタログを読み取り、フォールバック用途の候補をランク付けします。カタログ自体は公開されているため、メタデータのみのスキャンには OpenRouter キーは不要です。

デフォルトでは、OpenClaw はライブモデル呼び出しでツールと画像のサポートをプローブしようとします。
OpenRouter キーが構成されていない場合、コマンドはメタデータのみの出力にフォールバックし、`:free` モデルでもプローブと推論には `OPENROUTER_API_KEY` が必要であることを説明します。

オプション:

- `--no-probe`（メタデータのみ。構成/シークレット検索なし）
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

`--set-default` と `--set-image` にはライブプローブが必要です。メタデータのみのスキャン結果は情報提供用であり、構成には適用されません。

### モデルステータス

オプション:

- `--json`
- `--plain`
- `--check`（終了 1=期限切れ/欠落、2=期限間近）
- `--probe`（構成済み認証プロファイルのライブプローブ）
- `--probe-provider <name>`（1つのプロバイダーをプローブ）
- `--probe-profile <id>`（プロファイル id を繰り返し指定、またはカンマ区切りで指定）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`（構成済みエージェント id。`OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` を上書きします）

`--json` は stdout を JSON ペイロード専用に保ちます。認証プロファイル、プロバイダー、起動診断は stderr に送られるため、スクリプトは stdout を `jq` などのツールへ直接パイプできます。

プローブステータスの分類:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

想定されるプローブ詳細/理由コードのケース:

- `excluded_by_auth_order`: 保存済みプロファイルは存在しますが、明示的な `auth.order.<provider>` がそれを省略しているため、プローブは試行せずに除外を報告します。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`: プロファイルは存在しますが、利用対象外または解決不能です。
- `no_model`: プロバイダー認証は存在しますが、OpenClaw はそのプロバイダーに対してプローブ可能なモデル候補を解決できませんでした。

## エイリアス + フォールバック

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## 認証プロファイル

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` はインタラクティブな認証ヘルパーです。選択したプロバイダーに応じて、プロバイダー認証フロー（OAuth/APIキー）を起動するか、手動トークン貼り付けへ案内します。

`models auth list` は、選択したエージェントに保存済みの認証プロファイルを、トークン、APIキー、OAuth シークレット情報を出力せずに一覧表示します。`--provider <id>` を使用すると、`openai-codex` などの1つのプロバイダーに絞り込めます。スクリプト用途には `--json` を使用します。

`models auth login` は、プロバイダー Plugin の認証フロー（OAuth/APIキー）を実行します。インストール済みのプロバイダーを確認するには `openclaw plugins list` を使用します。
認証結果を特定の構成済みエージェントストアに書き込むには、`openclaw models auth --agent <id> <subcommand>` を使用します。親の `--agent` フラグは、`add`、`list`、`login`、`setup-token`、`paste-token`、および `login-github-copilot` で尊重されます。

例:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

注:

- `setup-token` と `paste-token` は、トークン認証メソッドを公開するプロバイダー向けの汎用トークンコマンドとして残ります。
- `setup-token` にはインタラクティブな TTY が必要で、プロバイダーのトークン認証メソッド（公開されている場合はデフォルトでそのプロバイダーの `setup-token` メソッド）を実行します。
- `paste-token` は、別の場所または自動化から生成されたトークン文字列を受け付けます。
- `paste-token` には `--provider` が必要です。トークン値の入力を促し、`--profile-id` を渡さない限り、デフォルトのプロファイル id `<provider>:manual` に書き込みます。
- `paste-token --expires-in <duration>` は、`365d` や `12h` などの相対期間から絶対的なトークン有効期限を保存します。
- Anthropic 注: Anthropic スタッフは、OpenClaw 形式の Claude CLI 使用が再び許可されていると私たちに伝えました。そのため OpenClaw は、Anthropic が新しいポリシーを公開しない限り、この連携において Claude CLI の再利用と `claude -p` の使用を認可済みとして扱います。
- Anthropic の `setup-token` / `paste-token` は、サポートされる OpenClaw トークンパスとして引き続き利用可能ですが、OpenClaw は現在、利用可能な場合は Claude CLI の再利用と `claude -p` を優先します。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [モデル選択](/ja-JP/concepts/model-providers)
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)

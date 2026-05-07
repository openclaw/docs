---
read_when:
    - デフォルトモデルを変更するか、プロバイダーの認証ステータスを確認したい場合
    - 利用可能なモデル/プロバイダーをスキャンし、認証プロファイルをデバッグしたい場合
summary: '`openclaw models` の CLI リファレンス（status/list/set/scan、エイリアス、フォールバック、auth）'
title: モデル
x-i18n:
    generated_at: "2026-05-07T13:14:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e1a7a9304f9d03d11e38262487eae4f0cf8d7e0be7ca71bcc208030784728bf
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

モデルの検出、スキャン、設定 (デフォルトモデル、フォールバック、認証プロファイル)。

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
プロバイダー使用状況スナップショットが利用できる場合、OAuth/API キーのステータスセクションには
プロバイダーの使用期間とクォータスナップショットが含まれます。
現在の使用期間プロバイダー: Anthropic、GitHub Copilot、Gemini CLI、OpenAI
Codex、MiniMax、Xiaomi、z.ai。使用状況の認証は、利用可能な場合はプロバイダー固有のフックから取得されます。それ以外の場合、OpenClaw は認証プロファイル、env、または config から一致する OAuth/API キー
認証情報にフォールバックします。
`--json` 出力では、`auth.providers` は env/config/store を考慮したプロバイダー
概要であり、`auth.oauth` は認証ストアのプロファイル健全性のみです。
`--probe` を追加すると、設定済みの各プロバイダープロファイルに対してライブ認証プローブを実行します。
プローブは実際のリクエストです (トークンを消費し、レート制限をトリガーする可能性があります)。
`--agent <id>` を使うと、設定済みエージェントのモデル/認証状態を調べられます。省略すると、
このコマンドは設定されていれば `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` を使用し、それ以外の場合は
設定済みのデフォルトエージェントを使用します。
プローブ行は、認証プロファイル、env 認証情報、または `models.json` から取得される場合があります。
Codex OAuth のトラブルシューティングでは、`openclaw models status`、
`openclaw models auth list --provider openai-codex`、および
`openclaw config get agents.defaults.model --json` が、エージェントにネイティブ Codex ランタイムを通じて
`openai/*` に使用できる `openai-codex` 認証プロファイルがあるかを確認する最速の方法です。[OpenAI プロバイダー設定](/ja-JP/providers/openai#check-and-recover-codex-oauth-routing)を参照してください。

注:

- `models set <model-or-alias>` は `provider/model` またはエイリアスを受け付けます。
- `models list` は読み取り専用です。config、認証プロファイル、既存のカタログ
  状態、プロバイダー所有のカタログ行を読み取りますが、
  `models.json` は書き換えません。
- `Auth` 列はプロバイダーレベルで読み取り専用です。これはローカル
  認証プロファイルメタデータ、env マーカー、設定済みプロバイダーキー、ローカルプロバイダー
  マーカー、AWS Bedrock env/プロファイルマーカー、Plugin の合成認証メタデータから計算されます。
  プロバイダーランタイムを読み込んだり、キーチェーンシークレットを読んだり、プロバイダー
  API を呼び出したり、モデルごとの正確な実行準備状態を証明したりはしません。
- `models list --all --provider <id>` は、そのプロバイダーでまだ認証していない場合でも、
  Plugin マニフェストまたはバンドルされたプロバイダーカタログメタデータから、プロバイダー所有の静的カタログ
  行を含めることがあります。それらの行は、一致する認証が設定されるまでは
  利用不可として表示されます。
- `models list` は、プロバイダーカタログ
  検出が遅い間もコントロールプレーンの応答性を保ちます。デフォルトビューと設定済みビューは短時間待った後に設定済みまたは
  合成モデル行へフォールバックし、検出は
  バックグラウンドで完了させます。正確な完全検出済みカタログが必要で、
  プロバイダー検出を待つ意思がある場合は `--all` を使用してください。
- 広範な `models list --all` は、プロバイダーランタイムの補足フックを読み込まずに、
  マニフェストカタログ行をレジストリ行より優先してマージします。プロバイダーでフィルターされたマニフェスト
  高速パスは、`static` とマークされたプロバイダーのみを使用します。`refreshable` とマークされたプロバイダーは
  レジストリ/キャッシュに基づいたまま、マニフェスト行を補足として追加し、
  `runtime` とマークされたプロバイダーはレジストリ/ランタイム検出に留まります。
- `models list` は、ネイティブモデルメタデータとランタイム上限を区別して保持します。表
  出力では、有効なランタイム
  上限がネイティブのコンテキストウィンドウと異なる場合、`Ctx` は `contextTokens/contextWindow` を表示します。JSON 行には、プロバイダーがその上限を公開している場合に `contextTokens`
  が含まれます。
- `models list --provider <id>` は、`moonshot` や
  `openai-codex` などのプロバイダー ID でフィルターします。`Moonshot AI` など、対話型プロバイダー
  ピッカーの表示ラベルは受け付けません。
- モデル参照は **最初の** `/` で分割して解析されます。モデル ID に `/` が含まれる場合 (OpenRouter 形式)、プロバイダープレフィックスを含めてください (例: `openrouter/moonshotai/kimi-k2`)。
- プロバイダーを省略した場合、OpenClaw はまず入力をエイリアスとして解決し、次に
  その正確なモデル ID に対する一意の設定済みプロバイダー一致として解決し、その後でのみ
  非推奨警告とともに設定済みのデフォルトプロバイダーへフォールバックします。
  そのプロバイダーが設定済みのデフォルトモデルを公開しなくなっている場合、OpenClaw は
  古い削除済みプロバイダーのデフォルトを表示する代わりに、最初の設定済みプロバイダー/モデルへフォールバックします。
- `models status` は、非シークレットのプレースホルダー (例: `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`) について、シークレットとしてマスクする代わりに認証出力で `marker(<value>)` を表示する場合があります。

### モデルスキャン

`models scan` は OpenRouter の公開 `:free` カタログを読み取り、フォールバック用途の
候補をランク付けします。カタログ自体は公開されているため、メタデータのみのスキャンには
OpenRouter キーは不要です。

デフォルトでは、OpenClaw はライブモデル呼び出しでツールと画像のサポートをプローブしようとします。
OpenRouter キーが設定されていない場合、このコマンドはメタデータのみの
出力へフォールバックし、`:free` モデルでもプローブと推論には `OPENROUTER_API_KEY` が必要であることを説明します。

オプション:

- `--no-probe` (メタデータのみ。config/シークレットの検索なし)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (カタログリクエストとプローブごとのタイムアウト)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` と `--set-image` にはライブプローブが必要です。メタデータのみのスキャン
結果は情報提供用であり、config には適用されません。

### モデルステータス

オプション:

- `--json`
- `--plain`
- `--check` (終了 1=期限切れ/欠落、2=期限間近)
- `--probe` (設定済み認証プロファイルのライブプローブ)
- `--probe-provider <name>` (1 つのプロバイダーをプローブ)
- `--probe-profile <id>` (繰り返し指定またはカンマ区切りのプロファイル ID)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (設定済みエージェント ID。`OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` を上書き)

`--json` は stdout を JSON ペイロード専用に保ちます。認証プロファイル、プロバイダー、
起動診断は stderr に送られるため、スクリプトは stdout を直接
`jq` などのツールへパイプできます。

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

- `excluded_by_auth_order`: 保存済みプロファイルは存在しますが、明示的な
  `auth.order.<provider>` がそれを省略しているため、プローブは
  試行する代わりに除外を報告します。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`:
  プロファイルは存在しますが、適格でないか解決できません。
- `no_model`: プロバイダー認証は存在しますが、OpenClaw はそのプロバイダーに対するプローブ可能な
  モデル候補を解決できませんでした。

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

`models auth add` は対話型認証ヘルパーです。選択した
プロバイダーに応じて、プロバイダー認証フロー (OAuth/API キー) を起動するか、手動トークン貼り付けへ案内します。

`models auth list` は、選択したエージェントに保存された認証プロファイルを、
トークン、API キー、OAuth シークレット素材を表示せずに一覧表示します。`--provider <id>` を使うと
`openai-codex` などの 1 つのプロバイダーに絞り込め、`--json` はスクリプト用です。

`models auth login` は、プロバイダー Plugin の認証フロー (OAuth/API キー) を実行します。
インストール済みのプロバイダーを確認するには `openclaw plugins list` を使用してください。
特定の設定済みエージェントストアに認証結果を書き込むには、
`openclaw models auth --agent <id> <subcommand>` を使用します。親の `--agent` フラグは、
`add`、`list`、`login`、`setup-token`、`paste-token`、および
`login-github-copilot` で尊重されます。

例:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

注:

- `setup-token` と `paste-token` は、トークン認証メソッドを公開するプロバイダー向けの
  汎用トークンコマンドとして残ります。
- `setup-token` には対話型 TTY が必要で、プロバイダーのトークン認証
  メソッド (そのプロバイダーが公開している場合はデフォルトで `setup-token` メソッド) を実行します。
- `paste-token` は、別の場所または自動化から生成されたトークン文字列を受け付けます。
- `paste-token` には `--provider` が必要で、トークン値を求め、
  `--profile-id` を渡さない限り、デフォルトのプロファイル ID `<provider>:manual` に書き込みます。
- `paste-token --expires-in <duration>` は、`365d` や `12h` などの
  相対期間から絶対トークン有効期限を保存します。
- Anthropic 注記: Anthropic スタッフは、OpenClaw 形式の Claude CLI 使用が再び許可されたと伝えたため、OpenClaw は Anthropic が新しいポリシーを公開しない限り、この統合における Claude CLI 再利用と `claude -p` 使用を認可済みとして扱います。
- Anthropic の `setup-token` / `paste-token` はサポートされる OpenClaw トークンパスとして引き続き利用できますが、OpenClaw は利用可能な場合、Claude CLI 再利用と `claude -p` を優先するようになりました。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [モデル選択](/ja-JP/concepts/model-providers)
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)

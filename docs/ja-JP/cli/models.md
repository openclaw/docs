---
read_when:
    - デフォルトモデルを変更する、またはプロバイダーの認証状態を表示する
    - 利用可能なモデル/プロバイダーをスキャンし、認証プロファイルをデバッグしたい
summary: '`openclaw models` の CLI リファレンス（status/list/set/scan、エイリアス、フォールバック、認証）'
title: モデル
x-i18n:
    generated_at: "2026-05-12T00:58:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 532bccd19b53517447ad784a1103fa65efe890bf35100bb88161a88aeb3c67b1
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

モデルの検出、スキャン、設定（デフォルトモデル、フォールバック、認証プロファイル）。

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
プロバイダー使用状況のスナップショットが利用できる場合、OAuth/API キーのステータスセクションには
プロバイダーの使用期間とクォータのスナップショットが含まれます。
現在の使用期間プロバイダー: Anthropic、GitHub Copilot、Gemini CLI、OpenAI
Codex、MiniMax、Xiaomi、z.ai。使用状況認証は、利用可能な場合はプロバイダー固有のフックから取得されます。それ以外の場合、OpenClaw は認証プロファイル、env、または config から一致する OAuth/API キー
認証情報にフォールバックします。
`--json` 出力では、`auth.providers` は env/config/store を考慮したプロバイダー
概要であり、`auth.oauth` は認証ストアのプロファイル健全性のみです。
設定済みの各プロバイダープロファイルに対してライブ認証プローブを実行するには、`--probe` を追加します。
プローブは実際のリクエストです（トークンを消費し、レート制限を引き起こす可能性があります）。
設定済みエージェントのモデル/認証状態を調べるには、`--agent <id>` を使用します。省略した場合、
このコマンドは、設定されていれば `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` を使用し、それ以外の場合は
設定済みのデフォルトエージェントを使用します。
プローブ行は、認証プロファイル、env 認証情報、または `models.json` から取得される場合があります。
Codex OAuth のトラブルシューティングでは、`openclaw models status`、
`openclaw models auth list --provider openai-codex`、および
`openclaw config get agents.defaults.model --json` が、エージェントに
ネイティブ Codex ランタイム経由の `openai/*` 用に使用可能な `openai-codex` 認証プロファイルがあるかどうかを
確認する最短手段です。[OpenAI プロバイダー設定](/ja-JP/providers/openai#check-and-recover-codex-oauth-routing)を参照してください。

注意:

- `models set <model-or-alias>` は `provider/model` またはエイリアスを受け付けます。
- `models list` は読み取り専用です。config、認証プロファイル、既存のカタログ
  状態、プロバイダー所有のカタログ行を読み取りますが、`models.json` は書き換えません。
- `Auth` 列はプロバイダーレベルで読み取り専用です。ローカルの
  認証プロファイルメタデータ、env マーカー、設定済みプロバイダーキー、ローカルプロバイダー
  マーカー、AWS Bedrock env/profile マーカー、Plugin の合成認証メタデータから計算されます。
  プロバイダーランタイムをロードしたり、keychain シークレットを読み取ったり、プロバイダー
  API を呼び出したり、モデルごとの正確な実行準備状況を証明したりするものではありません。
- `models list --all --provider <id>` は、そのプロバイダーでまだ認証していない場合でも、
  Plugin マニフェストまたはバンドルされたプロバイダーカタログメタデータから、プロバイダー所有の静的カタログ
  行を含めることがあります。これらの行は、一致する認証が設定されるまで引き続き
  使用不可として表示されます。
- `models list` は、プロバイダーカタログ
  検出が遅い間もコントロールプレーンの応答性を保ちます。デフォルトビューと設定済みビューは、短い待機後に設定済みまたは
  合成モデル行へフォールバックし、検出は
  バックグラウンドで完了させます。正確な完全検出済みカタログが必要で、
  プロバイダー検出を待つ意思がある場合は `--all` を使用してください。
- 広範な `models list --all` は、プロバイダーランタイムの補足フックをロードせずに、
  マニフェストカタログ行をレジストリ行の上にマージします。プロバイダーでフィルタリングされたマニフェスト
  高速パスは、`static` とマークされたプロバイダーのみを使用します。`refreshable` とマークされたプロバイダーは
  レジストリ/キャッシュベースのままで、マニフェスト行を補足として追加します。一方、
  `runtime` とマークされたプロバイダーはレジストリ/ランタイム検出のままです。
- `models list` は、ネイティブモデルメタデータとランタイム上限を区別したままにします。テーブル
  出力では、有効なランタイム上限がネイティブのコンテキストウィンドウと異なる場合、`Ctx` は `contextTokens/contextWindow` を表示します。JSON 行には、プロバイダーがその上限を公開している場合に `contextTokens`
  が含まれます。
- `models list --provider <id>` は、`moonshot` や
  `openai-codex` などのプロバイダー ID でフィルタリングします。`Moonshot AI` のような、対話型プロバイダー
  ピッカーの表示ラベルは受け付けません。
- モデル参照は、**最初の** `/` で分割して解析されます。モデル ID に `/` が含まれる場合（OpenRouter 形式）、プロバイダープレフィックスを含めてください（例: `openrouter/moonshotai/kimi-k2`）。
- プロバイダーを省略した場合、OpenClaw は入力をまずエイリアスとして解決し、次に
  その正確なモデル ID に対する一意の設定済みプロバイダー一致として解決し、その後でのみ
  非推奨警告付きで設定済みデフォルトプロバイダーへフォールバックします。
  そのプロバイダーが設定済みデフォルトモデルを公開しなくなっている場合、OpenClaw は
  古い削除済みプロバイダーのデフォルトを表示する代わりに、最初の設定済みプロバイダー/モデルへフォールバックします。
- `models status` は、非シークレットのプレースホルダー（例: `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`）について、シークレットとしてマスクする代わりに、認証出力で `marker(<value>)` を表示することがあります。

### モデルスキャン

`models scan` は OpenRouter の公開 `:free` カタログを読み取り、フォールバック用途の
候補をランク付けします。カタログ自体は公開されているため、メタデータのみのスキャンには
OpenRouter キーは不要です。

デフォルトでは、OpenClaw はライブモデル呼び出しでツールと画像サポートをプローブしようとします。
OpenRouter キーが設定されていない場合、このコマンドはメタデータのみの
出力へフォールバックし、`:free` モデルでもプローブと推論には `OPENROUTER_API_KEY` が必要であることを
説明します。

オプション:

- `--no-probe`（メタデータのみ。config/シークレットの検索なし）
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

`--set-default` と `--set-image` にはライブプローブが必要です。メタデータのみのスキャン
結果は情報提供のみで、config には適用されません。

### モデルステータス

オプション:

- `--json`
- `--plain`
- `--check`（終了コード 1=期限切れ/欠落、2=期限間近）
- `--probe`（設定済み認証プロファイルのライブプローブ）
- `--probe-provider <name>`（1 つのプロバイダーをプローブ）
- `--probe-profile <id>`（繰り返し指定またはカンマ区切りのプロファイル ID）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`（設定済みエージェント ID。`OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` を上書き）

`--json` は stdout を JSON ペイロード専用に保ちます。認証プロファイル、プロバイダー、
起動時診断は stderr に送られるため、スクリプトは stdout を `jq` などのツールへ直接
パイプできます。

プローブステータスの区分:

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
  `auth.order.<provider>` に含まれていないため、プローブは試行する代わりに
  除外を報告します。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`:
  プロファイルは存在しますが、対象外または解決不能です。
- `no_model`: プロバイダー認証は存在しますが、OpenClaw はそのプロバイダー用の
  プローブ可能なモデル候補を解決できませんでした。

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

`models auth add` は対話型の認証ヘルパーです。選択した
プロバイダーに応じて、プロバイダー認証フロー（OAuth/API キー）を開始したり、
手動トークン貼り付けへ案内したりできます。

`models auth list` は、選択したエージェントに保存された認証プロファイルを一覧表示しますが、
トークン、API キー、OAuth シークレット素材は出力しません。`openai-codex` など 1 つのプロバイダーに
絞り込むには `--provider <id>` を使用し、スクリプト用途には `--json` を使用します。

`models auth login` は、プロバイダー Plugin の認証フロー（OAuth/API キー）を実行します。インストール済みのプロバイダーを確認するには
`openclaw plugins list` を使用します。
認証結果を特定の設定済みエージェントストアへ書き込むには、`openclaw models auth --agent <id> <subcommand>` を使用します。
親の `--agent` フラグは、
`add`、`list`、`login`、`setup-token`、`paste-token`、および
`login-github-copilot` で尊重されます。

OpenAI モデルでは、`--provider openai` はデフォルトで ChatGPT/Codex アカウントログインになります。
OpenAI API キープロファイルを追加したい場合にのみ `--method api-key` を使用してください。
通常は Codex サブスクリプション制限のバックアップとして使います。従来の
`--provider openai-codex` という表記も既存スクリプト向けに引き続き機能します。

例:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth list --provider openai
```

注意:

- `setup-token` と `paste-token` は、トークン認証メソッドを公開するプロバイダー向けの
  汎用トークンコマンドとして残ります。
- `setup-token` には対話型 TTY が必要で、プロバイダーのトークン認証
  メソッド（公開している場合は、そのプロバイダーの `setup-token` メソッドがデフォルト）を実行します。
- `paste-token` は、別の場所または自動化から生成されたトークン文字列を受け付けます。
- `paste-token` には `--provider` が必須で、トークン値の入力を促し、
  `--profile-id` を渡さない限り、デフォルトのプロファイル ID `<provider>:manual` に書き込みます。
- `paste-token --expires-in <duration>` は、`365d` や `12h` などの
  相対期間から絶対的なトークン有効期限を保存します。
- Anthropic の注記: Anthropic スタッフは、OpenClaw 形式の Claude CLI 使用が再び許可されたと私たちに伝えたため、Anthropic が新しいポリシーを公開しない限り、OpenClaw はこの統合における Claude CLI 再利用と `claude -p` の使用を認可済みとして扱います。
- Anthropic の `setup-token` / `paste-token` は、サポートされる OpenClaw トークン経路として引き続き利用できますが、OpenClaw は現在、利用可能な場合は Claude CLI 再利用と `claude -p` を優先します。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [モデル選択](/ja-JP/concepts/model-providers)
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)

---
read_when:
    - デフォルトモデルを変更する、またはプロバイダーの認証ステータスを表示する場合
    - 利用可能なモデル/プロバイダーをスキャンし、認証プロファイルをデバッグしたい
summary: '`openclaw models` のCLIリファレンス（status/list/set/scan、エイリアス、フォールバック、認証）'
title: モデル
x-i18n:
    generated_at: "2026-05-04T18:23:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc7842f02e29aa0ac2ae88f3d42bba71f1890a58ab22d818dbee0585bc562fea
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

モデルの検出、スキャン、設定（デフォルトモデル、フォールバック、認証プロファイル）。

関連:

- プロバイダー + モデル: [モデル](/ja-JP/providers/models)
- モデル選択の概念 + `/models` スラッシュコマンド: [モデルの概念](/ja-JP/concepts/models)
- プロバイダー認証設定: [はじめに](/ja-JP/start/getting-started)

## 一般的なコマンド

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` は、解決済みのデフォルト/フォールバックと認証概要を表示します。
プロバイダー使用量のスナップショットが利用可能な場合、OAuth/APIキーのステータスセクションには
プロバイダーの使用量ウィンドウとクォータのスナップショットが含まれます。
現在の使用量ウィンドウ対応プロバイダー: Anthropic、GitHub Copilot、Gemini CLI、OpenAI
Codex、MiniMax、Xiaomi、z.ai。使用量認証は、利用可能な場合はプロバイダー固有のフックから取得されます。
それ以外の場合、OpenClaw は認証プロファイル、環境変数、または設定から一致する OAuth/APIキー
認証情報へフォールバックします。
`--json` 出力では、`auth.providers` は環境変数/設定/ストアを考慮したプロバイダー
概要であり、`auth.oauth` は認証ストアのプロファイル健全性のみです。
設定済みの各プロバイダープロファイルに対してライブ認証プローブを実行するには、`--probe` を追加します。
プローブは実際のリクエストです（トークンを消費し、レート制限を発生させる可能性があります）。
設定済みエージェントのモデル/認証状態を調べるには、`--agent <id>` を使用します。省略すると、
コマンドは設定されていれば `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` を使用し、そうでなければ
設定済みのデフォルトエージェントを使用します。
プローブ行は、認証プロファイル、環境変数の認証情報、または `models.json` から取得される場合があります。

注:

- `models set <model-or-alias>` は `provider/model` またはエイリアスを受け付けます。
- `models list` は読み取り専用です。設定、認証プロファイル、既存のカタログ
  状態、プロバイダー所有のカタログ行を読み取りますが、
  `models.json` は書き換えません。
- `Auth` 列はプロバイダーレベルで、読み取り専用です。これはローカルの
  認証プロファイルメタデータ、環境変数マーカー、設定済みプロバイダーキー、ローカルプロバイダー
  マーカー、AWS Bedrock の環境変数/プロファイルマーカー、Plugin の合成認証メタデータから計算されます。
  プロバイダーランタイムの読み込み、キーチェーンシークレットの読み取り、プロバイダー
  API の呼び出し、またはモデルごとの正確な実行準備状況の証明は行いません。
- `models list --all --provider <id>` は、そのプロバイダーでまだ認証していない場合でも、Plugin マニフェストまたはバンドルされたプロバイダーカタログメタデータから
  プロバイダー所有の静的カタログ行を含めることができます。それらの行は、一致する認証が設定されるまで
  利用不可として表示されます。
- `models list` は、プロバイダーカタログの検出が遅い間もコントロールプレーンの応答性を保ちます。
  デフォルト表示と設定済み表示は、短い待機後に設定済みまたは
  合成モデル行へフォールバックし、検出をバックグラウンドで完了させます。
  正確な完全検出カタログが必要で、プロバイダー検出を待つ意思がある場合は `--all` を使用します。
- 広範な `models list --all` は、プロバイダーランタイムの補足フックを読み込まずに、マニフェストカタログ行をレジストリ行の上にマージします。プロバイダーでフィルターされたマニフェストの高速パスは、`static` とマークされたプロバイダーのみを使用します。`refreshable`
  とマークされたプロバイダーはレジストリ/キャッシュベースのままで、マニフェスト行を補足として追加します。一方、
  `runtime` とマークされたプロバイダーはレジストリ/ランタイム検出のままです。
- `models list` は、ネイティブモデルメタデータとランタイム上限を区別して保持します。テーブル
  出力では、有効なランタイム
  上限がネイティブのコンテキストウィンドウと異なる場合、`Ctx` は `contextTokens/contextWindow` を表示します。JSON 行には、プロバイダーがその上限を公開する場合に `contextTokens`
  が含まれます。
- `models list --provider <id>` は、`moonshot` や
  `openai-codex` などのプロバイダー ID でフィルターします。`Moonshot AI` など、対話型プロバイダー
  ピッカーの表示ラベルは受け付けません。
- モデル参照は、**最初の** `/` で分割して解析されます。モデル ID に `/` が含まれる場合（OpenRouter 形式）、プロバイダープレフィックスを含めます（例: `openrouter/moonshotai/kimi-k2`）。
- プロバイダーを省略すると、OpenClaw は入力をまずエイリアスとして解決し、次に
  その正確なモデル ID に対する一意の設定済みプロバイダー一致として解決し、それから初めて
  非推奨警告付きで設定済みのデフォルトプロバイダーへフォールバックします。
  そのプロバイダーが設定済みのデフォルトモデルを公開しなくなっている場合、OpenClaw は
  古い削除済みプロバイダーのデフォルトを表示する代わりに、最初の設定済みプロバイダー/モデルへ
  フォールバックします。
- `models status` は、認証出力でシークレットとしてマスクする代わりに、非シークレットのプレースホルダー（例: `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`）について `marker(<value>)` を表示する場合があります。

### モデルスキャン

`models scan` は OpenRouter の公開 `:free` カタログを読み取り、フォールバック用途の
候補をランク付けします。カタログ自体は公開されているため、メタデータのみのスキャンには
OpenRouter キーは不要です。

デフォルトでは、OpenClaw はライブモデル呼び出しでツールと画像のサポートをプローブしようとします。
OpenRouter キーが設定されていない場合、コマンドはメタデータのみの
出力へフォールバックし、`:free` モデルでもプローブと推論には `OPENROUTER_API_KEY` が必要であることを説明します。

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

`--set-default` と `--set-image` にはライブプローブが必要です。メタデータのみのスキャン
結果は情報提供用であり、設定には適用されません。

### モデルステータス

オプション:

- `--json`
- `--plain`
- `--check`（終了コード 1=期限切れ/欠落、2=期限切れ間近）
- `--probe`（設定済み認証プロファイルのライブプローブ）
- `--probe-provider <name>`（1 つのプロバイダーをプローブ）
- `--probe-profile <id>`（繰り返し指定またはカンマ区切りのプロファイル ID）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`（設定済みエージェント ID。`OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` を上書き）

`--json` は stdout を JSON ペイロード専用に保ちます。認証プロファイル、プロバイダー、
起動診断は stderr に送られるため、スクリプトは stdout を `jq` などのツールへ直接
パイプできます。

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
  `auth.order.<provider>` がそれを省略したため、プローブは試行する代わりに
  除外を報告します。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`:
  プロファイルは存在しますが、適格でないか解決できません。
- `no_model`: プロバイダー認証は存在しますが、OpenClaw はそのプロバイダーに対してプローブ可能な
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

`models auth add` は対話型の認証ヘルパーです。選択した
プロバイダーに応じて、プロバイダー認証
フロー（OAuth/APIキー）を起動するか、手動でのトークン貼り付けへ案内します。

`models auth list` は、選択したエージェントに保存された認証プロファイルを、トークン、APIキー、OAuth シークレット素材を
出力せずに一覧表示します。`openai-codex` など、1 つのプロバイダーに
絞り込むには `--provider <id>` を使用し、スクリプト用には `--json` を使用します。

`models auth login` は、プロバイダー Plugin の認証フロー（OAuth/APIキー）を実行します。インストール済みのプロバイダーを確認するには
`openclaw plugins list` を使用します。
認証結果を特定の設定済みエージェントストアへ書き込むには、`openclaw models auth --agent <id> <subcommand>` を使用します。
親の `--agent` フラグは、
`add`、`list`、`login`、`setup-token`、`paste-token`、および
`login-github-copilot` で尊重されます。

例:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

注:

- `setup-token` と `paste-token` は、トークン認証メソッドを公開するプロバイダー向けの
  汎用トークンコマンドのままです。
- `setup-token` には対話型 TTY が必要で、プロバイダーのトークン認証
  メソッド（そのプロバイダーが公開している場合は、そのプロバイダーの `setup-token` メソッドがデフォルト）を実行します。
- `paste-token` は、別の場所または自動化から生成されたトークン文字列を受け付けます。
- `paste-token` には `--provider` が必要で、トークン値の入力を求め、
  `--profile-id` を渡さない限り、デフォルトのプロファイル ID `<provider>:manual` に書き込みます。
- `paste-token --expires-in <duration>` は、`365d` や `12h` などの
  相対期間から絶対トークン有効期限を保存します。
- Anthropic 注: Anthropic スタッフは、OpenClaw 形式の Claude CLI 使用が再び許可されたと伝えているため、Anthropic が新しいポリシーを公開しない限り、OpenClaw はこの統合における Claude CLI の再利用と `claude -p` の使用を認可済みとして扱います。
- Anthropic の `setup-token` / `paste-token` は、サポートされる OpenClaw トークンパスとして引き続き利用できますが、OpenClaw は現在、利用可能な場合は Claude CLI の再利用と `claude -p` を優先します。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [モデル選択](/ja-JP/concepts/model-providers)
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)

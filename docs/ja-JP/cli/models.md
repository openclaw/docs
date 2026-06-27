---
read_when:
    - デフォルトモデルを変更するか、プロバイダーの認証状態を表示したい
    - 利用可能なモデル/プロバイダーをスキャンし、認証プロファイルをデバッグしたい場合
summary: '`openclaw models` の CLI リファレンス（status/list/set/scan、エイリアス、フォールバック、認証）'
title: モデル
x-i18n:
    generated_at: "2026-06-27T10:58:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15d0a01e0f8f971996359413306a1c694e5a787eaef69b13eb8ac63c2a7c8990
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

モデルの検出、スキャン、構成（既定モデル、フォールバック、認証プロファイル）。

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

`openclaw models status` は、解決済みの既定値/フォールバックに加えて認証の概要を表示します。
プロバイダー使用状況のスナップショットが利用可能な場合、OAuth/APIキーのステータスセクションには
プロバイダーの使用ウィンドウとクォータのスナップショットが含まれます。
現在の使用ウィンドウ対応プロバイダー: Anthropic、GitHub Copilot、Gemini CLI、OpenAI、
MiniMax、Xiaomi、z.ai。使用状況の認証は、利用可能な場合はプロバイダー固有のフックから取得されます。
それ以外の場合、OpenClaw は認証プロファイル、env、または config から一致する OAuth/APIキー
認証情報へフォールバックします。
`--json` 出力では、`auth.providers` は env/config/store を考慮したプロバイダー
概要であり、`auth.oauth` は認証ストアのプロファイル健全性のみです。
`--probe` を追加すると、構成済みの各プロバイダープロファイルに対してライブ認証プローブを実行します。
プローブは実際のリクエストです（トークンを消費し、レート制限を発生させる場合があります）。
`--agent <id>` を使うと、構成済みエージェントのモデル/認証状態を調べられます。省略した場合、
このコマンドは `OPENCLAW_AGENT_DIR` が設定されていればそれを使い、そうでなければ
構成済みの既定エージェントを使います。
プローブ行は、認証プロファイル、env 認証情報、または `models.json` から取得される場合があります。
OpenAI ChatGPT/Codex OAuth のトラブルシューティングでは、`openclaw models status`、
`openclaw models auth list --provider openai`、および
`openclaw config get agents.defaults.model --json` が、エージェントがネイティブ Codex ランタイムを通じて
`openai/*` に使える `openai` OAuth プロファイルを持っているか確認する最短の方法です。[OpenAI プロバイダー設定](/ja-JP/providers/openai#check-and-recover-codex-oauth-routing)を参照してください。

注記:

- `models set <model-or-alias>` は `provider/model` またはエイリアスを受け付けます。
- `models list` は読み取り専用です。config、認証プロファイル、既存のカタログ
  状態、プロバイダー所有のカタログ行を読み取りますが、
  `models.json` は書き換えません。
- `Auth` 列はプロバイダーレベルで読み取り専用です。これはローカル
  認証プロファイルのメタデータ、env マーカー、構成済みプロバイダーキー、ローカルプロバイダー
  マーカー、AWS Bedrock env/profile マーカー、Plugin の合成認証メタデータから計算されます。
  プロバイダーランタイムの読み込み、キーチェーンシークレットの読み取り、プロバイダー
  API の呼び出し、またはモデル単位の正確な実行準備完了の証明は行いません。
- `models list --all --provider <id>` は、まだそのプロバイダーで認証していない場合でも、
  Plugin マニフェストまたはバンドルされたプロバイダーカタログメタデータから、
  プロバイダー所有の静的カタログ行を含めることがあります。それらの行は、一致する認証が
  構成されるまでは引き続き利用不可として表示されます。
- `models list` は、プロバイダーカタログの検出が遅い間もコントロールプレーンの応答性を保ちます。
  既定ビューと構成済みビューは、短い待機後に構成済みまたは
  合成モデル行へフォールバックし、検出はバックグラウンドで完了させます。
  正確な完全検出済みカタログが必要で、プロバイダー検出を待てる場合は `--all` を使います。
- 広範な `models list --all` は、プロバイダーランタイムの補助フックを読み込まずに、
  マニフェストのカタログ行をレジストリ行の上にマージします。プロバイダーで絞り込まれたマニフェスト
  高速パスは、`static` とマークされたプロバイダーのみを使います。`refreshable` とマークされた
  プロバイダーはレジストリ/キャッシュベースのままで、マニフェスト行を補助として追加します。一方、
  `runtime` とマークされたプロバイダーはレジストリ/ランタイム検出のままです。
- `models list` は、ネイティブモデルメタデータとランタイム上限を区別して保持します。表形式の
  出力では、有効なランタイム上限がネイティブのコンテキストウィンドウと異なる場合、
  `Ctx` は `contextTokens/contextWindow` を表示します。JSON 行には、プロバイダーがその上限を公開している場合に
  `contextTokens` が含まれます。
- `models list --provider <id>` は、`moonshot` や `openai` などのプロバイダー ID で絞り込みます。
  `Moonshot AI` など、インタラクティブなプロバイダーピッカーの表示ラベルは受け付けません。
- モデル参照は **最初の** `/` で分割して解析されます。モデル ID に `/` が含まれる場合（OpenRouter 形式）は、プロバイダープレフィックスを含めてください（例: `openrouter/moonshotai/kimi-k2`）。
- プロバイダーを省略した場合、OpenClaw はまず入力をエイリアスとして解決し、次に
  その正確なモデル ID に対する一意の構成済みプロバイダー一致として解決し、その後で初めて
  非推奨警告付きで構成済みの既定プロバイダーへフォールバックします。
  そのプロバイダーが構成済みの既定モデルをもう公開していない場合、OpenClaw は
  古い削除済みプロバイダーの既定値を表示する代わりに、最初の構成済みプロバイダー/モデルへ
  フォールバックします。
- `models status` は、シークレットではないプレースホルダー（例: `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`）について、シークレットとしてマスクする代わりに認証出力で `marker(<value>)` を表示する場合があります。

### モデルスキャン

`models scan` は OpenRouter の公開 `:free` カタログを読み取り、フォールバック用途の
候補をランク付けします。カタログ自体は公開されているため、メタデータのみのスキャンには
OpenRouter キーは不要です。

既定では、OpenClaw はライブモデル呼び出しでツールと画像のサポートをプローブしようとします。
OpenRouter キーが構成されていない場合、このコマンドはメタデータのみの
出力へフォールバックし、`:free` モデルでもプローブと推論には `OPENROUTER_API_KEY` が必要であることを説明します。

オプション:

- `--no-probe`（メタデータのみ。config/シークレット検索なし）
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
結果は情報提供用であり、config には適用されません。

### モデルステータス

オプション:

- `--json`
- `--plain`
- `--check`（終了コード 1=期限切れ/欠落、2=期限間近）
- `--probe`（構成済み認証プロファイルのライブプローブ）
- `--probe-provider <name>`（1 つのプロバイダーをプローブ）
- `--probe-profile <id>`（繰り返し指定またはカンマ区切りのプロファイル ID）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`（構成済みエージェント ID。`OPENCLAW_AGENT_DIR` を上書き）

`--json` は stdout を JSON ペイロード専用に保ちます。認証プロファイル、プロバイダー、
および起動診断は stderr に送られるため、スクリプトは stdout を `jq` などのツールへ直接
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
  `auth.order.<provider>` がそれを省略しているため、プローブは試行する代わりに
  除外を報告します。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`:
  プロファイルは存在しますが、利用資格がないか解決できません。
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
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` はインタラクティブな認証ヘルパーです。選択した
プロバイダーに応じて、プロバイダー認証フロー（OAuth/APIキー）を起動するか、手動のトークン貼り付けへ案内します。

`models auth list` は、選択したエージェントの保存済み認証プロファイルを一覧表示しますが、
トークン、APIキー、または OAuth シークレット素材は出力しません。`openai` など 1 つのプロバイダーに
絞り込むには `--provider <id>` を使い、スクリプト用途には `--json` を使います。

`models auth login` は、プロバイダー Plugin の認証フロー（OAuth/APIキー）を実行します。
インストール済みのプロバイダーを確認するには `openclaw plugins list` を使います。
認証結果を特定の構成済みエージェントストアへ書き込むには、
`openclaw models auth --agent <id> <subcommand>` を使います。親の `--agent` フラグは
`add`、`list`、`login`、`paste-api-key`、`setup-token`、`paste-token`、および
`login-github-copilot` で尊重されます。

OpenAI モデルでは、`--provider openai` は既定で ChatGPT/Codex アカウントログインになります。
OpenAI APIキーのプロファイルを追加したい場合にのみ `--method api-key` を使います。
通常は Codex サブスクリプション制限のバックアップとして使います。古いレガシー OpenAI Codex プレフィックスの認証/プロファイル状態を `openai` へ移行するには、
`openclaw doctor --fix` を実行してください。

例:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

注記:

- `login` は、ログイン中に名前付きプロファイルをサポートするプロバイダー向けに
  `--profile-id <id>` を受け付けます。同じプロバイダーの複数のログインを
  分離して保持するために使います。
- `paste-api-key` は別の場所で生成された APIキーを受け付け、キー
  値の入力を促し、`--profile-id` を渡さない限り既定のプロファイル ID `<provider>:manual` に
  書き込みます。自動化では、例えば
  `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai` のようにキーを stdin にパイプします。
- `setup-token` と `paste-token` は、トークン認証方式を公開するプロバイダー向けの
  汎用トークンコマンドとして残ります。
- `setup-token` にはインタラクティブな TTY が必要で、プロバイダーのトークン認証
  方式を実行します（プロバイダーが公開している場合は、そのプロバイダーの `setup-token` 方式が既定）。
- `paste-token` は、別の場所または自動化から生成されたトークン文字列を受け付けます。
- `paste-token` には `--provider` が必要で、既定ではトークン値の入力を促し、
  `--profile-id` を渡さない限り既定のプロファイル ID `<provider>:manual` に書き込みます。
- 自動化では、プロバイダー認証情報がシェル履歴やプロセス一覧に表示されないように、
  引数として渡す代わりにトークンを stdin にパイプします。
- `paste-token --expires-in <duration>` は、`365d` や `12h` などの
  相対期間から絶対トークン有効期限を保存します。
- `openai` では、OpenAI APIキーと ChatGPT/OAuth トークン素材は
  異なる認証形状です。`sk-...` OpenAI APIキーには `paste-api-key` を使い、
  `paste-token` はトークン認証素材にのみ使います。
- Anthropic 注記: Anthropic のスタッフから、OpenClaw 形式の Claude CLI 使用は再び許可されたと伝えられたため、Anthropic が新しいポリシーを公開しない限り、OpenClaw はこの統合における Claude CLI の再利用と `claude -p` の使用を認可済みとして扱います。
- Anthropic の `setup-token` / `paste-token` は、サポートされる OpenClaw トークンパスとして引き続き利用できますが、OpenClaw は現在、利用可能な場合は Claude CLI の再利用と `claude -p` を優先します。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [モデル選択](/ja-JP/concepts/model-providers)
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)

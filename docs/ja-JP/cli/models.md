---
read_when:
    - デフォルトモデルを変更したい場合や、プロバイダー認証ステータスを確認したい場合
    - 利用可能なモデル/プロバイダーをスキャンしたい場合や、認証プロファイルをデバッグしたい場合
summary: '`openclaw models` の CLI リファレンス（status/list/set/scan、エイリアス、フォールバック、認証）'
title: モデル
x-i18n:
    generated_at: "2026-04-24T04:51:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08e04342ef240bf7a1f60c4d4e2667d17c9a97e985c1b170db8538c890dc8119
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

モデルの検出、スキャン、設定（デフォルトモデル、フォールバック、認証プロファイル）。

関連:

- プロバイダー + モデル: [モデル](/ja-JP/providers/models)
- モデル選択の概念 + `/models` スラッシュコマンド: [モデルの概念](/ja-JP/concepts/models)
- プロバイダー認証のセットアップ: [はじめに](/ja-JP/start/getting-started)

## 共通コマンド

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` は、解決されたデフォルト/フォールバックに加えて認証の概要を表示します。
プロバイダー使用状況のスナップショットが利用可能な場合、OAuth/API キー状態セクションには
プロバイダーの使用期間ウィンドウとクォータのスナップショットが含まれます。
現在、使用期間ウィンドウに対応しているプロバイダーは、Anthropic、GitHub Copilot、Gemini CLI、OpenAI
Codex、MiniMax、Xiaomi、z.ai です。使用状況認証は、利用可能な場合はプロバイダー固有のフックから取得されます。
それ以外の場合、OpenClaw は auth profiles、env、または config にある対応する OAuth/API キー
認証情報へのフォールバックを行います。
`--json` 出力では、`auth.providers` は env/config/store を認識するプロバイダー
概要であり、`auth.oauth` は auth-store のプロファイル健全性のみです。
各設定済みプロバイダープロファイルに対してライブ認証プローブを実行するには `--probe` を追加します。
プローブは実際のリクエストです（トークンを消費し、レート制限を引き起こす可能性があります）。
設定済みエージェントのモデル/認証状態を確認するには `--agent <id>` を使用します。省略した場合、
設定されていれば `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` を使用し、そうでなければ
設定済みのデフォルトエージェントを使用します。
プローブ行は、auth profiles、env 認証情報、または `models.json` から取得されることがあります。

注意:

- `models set <model-or-alias>` は `provider/model` またはエイリアスを受け付けます。
- `models list` は読み取り専用です。config、auth profiles、既存のカタログ
  状態、およびプロバイダー所有のカタログ行を読み取りますが、`models.json` を
  書き換えません。
- `models list --all` は、そのプロバイダーでまだ認証していない場合でも、
  バンドル済みのプロバイダー所有静的カタログ行を含めます。それらの行は、
  対応する認証が設定されるまで、引き続き利用不可として表示されます。
- `models list --provider <id>` は、`moonshot` や
  `openai-codex` などのプロバイダー ID でフィルタします。対話型プロバイダー
  ピッカーの表示ラベル（`Moonshot AI` など）は受け付けません。
- モデル ref は、**最初の** `/` で分割して解析されます。モデル ID に `/` が含まれる場合（OpenRouter 形式）、プロバイダープレフィックスを含めてください（例: `openrouter/moonshotai/kimi-k2`）。
- プロバイダーを省略した場合、OpenClaw はまず入力をエイリアスとして解決し、次に
  その正確なモデル ID に対する一意の設定済みプロバイダーマッチとして解決し、それでも
  解決できない場合にのみ、非推奨警告付きで設定済みのデフォルトプロバイダーにフォールバックします。
  そのプロバイダーが設定済みのデフォルトモデルをもう提供していない場合、OpenClaw
  は古い削除済みプロバイダーのデフォルトを表示する代わりに、最初の設定済みプロバイダー/モデルにフォールバックします。
- `models status` の auth 出力では、非シークレットのプレースホルダー（例: `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`）が、シークレットとしてマスクされる代わりに `marker(<value>)` として表示されることがあります。

### `models status`

オプション:

- `--json`
- `--plain`
- `--check`（終了コード 1=期限切れ/欠落、2=期限切れ間近）
- `--probe`（設定済み auth profiles のライブプローブ）
- `--probe-provider <name>`（1 つのプロバイダーをプローブ）
- `--probe-profile <id>`（繰り返し指定またはカンマ区切りのプロファイル ID）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`（設定済みエージェント ID。`OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` を上書き）

プローブステータス区分:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

想定されるプローブ詳細/理由コードのケース:

- `excluded_by_auth_order`: 保存済みプロファイルは存在するが、明示的な
  `auth.order.<provider>` がそれを含めていないため、プローブは
  試行する代わりに除外を報告します。
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  プロファイルは存在するが、使用可能/解決可能ではありません。
- `no_model`: プロバイダー認証は存在するが、そのプロバイダーに対して
  プローブ可能なモデル候補を OpenClaw が解決できませんでした。

## エイリアス + フォールバック

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## auth profiles

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` は対話型の認証ヘルパーです。選択したプロバイダーに応じて、
プロバイダー認証フロー（OAuth/API キー）を起動することも、
手動トークン貼り付けへ案内することもできます。

`models auth login` はプロバイダー Plugin の認証フロー（OAuth/API キー）を実行します。どの
プロバイダーがインストールされているかは `openclaw plugins list` で確認してください。

例:

```bash
openclaw models auth login --provider openai-codex --set-default
```

注意:

- `setup-token` と `paste-token` は、トークン認証方式を提供するプロバイダー向けの
  汎用トークンコマンドとして引き続き利用できます。
- `setup-token` は対話型 TTY が必要で、そのプロバイダーのトークン認証
  メソッドを実行します（そのプロバイダーが `setup-token` メソッドを公開している場合は、
  デフォルトでそれを使用します）。
- `paste-token` は、別の場所または自動化から生成されたトークン文字列を受け付けます。
- `paste-token` では `--provider` が必要で、トークン値の入力を求め、
  `--profile-id` を渡さない限り、デフォルトのプロファイル ID `<provider>:manual` に書き込みます。
- `paste-token --expires-in <duration>` は、`365d` や `12h` などの
  相対時間から絶対的なトークン有効期限を保存します。
- Anthropic に関する注記: Anthropic のスタッフから、OpenClaw 形式の Claude CLI 使用は再び許可されていると伝えられたため、Anthropic が新しいポリシーを公開しない限り、OpenClaw はこの統合において Claude CLI の再利用と `claude -p` の使用を許可されたものとして扱います。
- Anthropic の `setup-token` / `paste-token` は、サポートされる OpenClaw のトークンパスとして引き続き利用できますが、現在 OpenClaw は利用可能な場合に Claude CLI の再利用と `claude -p` を優先します。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [モデル選択](/ja-JP/concepts/model-providers)
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)

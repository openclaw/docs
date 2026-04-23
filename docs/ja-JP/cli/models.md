---
read_when:
    - デフォルトモデルを変更したい、またはプロバイダー認証ステータスを確認したい場合
    - 利用可能なモデル/プロバイダーをスキャンしたい、または認証プロファイルをデバッグしたい場合
summary: '`openclaw models` のCLIリファレンス（status/list/set/scan、エイリアス、フォールバック、認証）'
title: モデル
x-i18n:
    generated_at: "2026-04-23T14:02:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4ba72ca8acb7cc31796c119fce3816e6a919eb28a4ed4b03664d3b222498f5a
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

モデルの検出、スキャン、設定（デフォルトモデル、フォールバック、認証プロファイル）。

関連:

- プロバイダー + モデル: [Models](/ja-JP/providers/models)
- モデル選択の概念 + `/models` スラッシュコマンド: [Models concept](/ja-JP/concepts/models)
- プロバイダー認証の設定: [はじめに](/ja-JP/start/getting-started)

## 一般的なコマンド

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` は、解決済みのデフォルト/フォールバックに加えて、認証の概要を表示します。
プロバイダー使用状況スナップショットが利用可能な場合、OAuth/APIキーのステータスセクションには
プロバイダーの使用ウィンドウとクォータスナップショットが含まれます。
現在、使用ウィンドウに対応しているプロバイダー: Anthropic、GitHub Copilot、Gemini CLI、OpenAI
Codex、MiniMax、Xiaomi、z.ai。使用状況認証は、利用可能な場合はプロバイダー固有のフックから取得されます。
それ以外の場合、OpenClawはauthプロファイル、env、またはconfigのOAuth/APIキー認証情報との
一致にフォールバックします。
`--json` 出力では、`auth.providers` はenv/config/store対応のプロバイダー概要であり、
`auth.oauth` はauth-store内のプロファイル健全性のみです。
各設定済みプロバイダープロファイルに対してライブ認証プローブを実行するには `--probe` を追加してください。
プローブは実際のリクエストです（トークンを消費し、レート制限を引き起こす可能性があります）。
設定済みエージェントのモデル/認証状態を確認するには `--agent <id>` を使用します。省略時は、
設定されていれば `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` を使用し、そうでなければ
設定済みのデフォルトエージェントを使用します。
プローブ行は、authプロファイル、env認証情報、または `models.json` から取得されることがあります。

注意:

- `models set <model-or-alias>` は `provider/model` またはエイリアスを受け付けます。
- `models list --all` は、そのプロバイダーでまだ認証していない場合でも、バンドル済みのプロバイダー所有静的カタログ行を含みます。これらの行は、一致する認証が設定されるまでは引き続き未利用として表示されます。
- `models list --provider <id>` は、`moonshot` や `openai-codex` のようなプロバイダーidでフィルタします。`Moonshot AI` のような対話型プロバイダーピッカーの表示ラベルは受け付けません。
- モデル参照は**最初の** `/` で分割して解析されます。モデルID自体に `/` が含まれる場合（OpenRouter形式）、プロバイダー接頭辞を含めてください（例: `openrouter/moonshotai/kimi-k2`）。
- プロバイダーを省略した場合、OpenClawはまず入力をエイリアスとして解決し、次にその正確なモデルidに対する一意な設定済みプロバイダー一致として解決し、それでも解決できない場合にのみ非推奨警告付きで設定済みデフォルトプロバイダーへフォールバックします。そのプロバイダーが設定済みデフォルトモデルをもう公開していない場合、OpenClawは古くなった削除済みプロバイダーのデフォルトを表示する代わりに、最初の設定済みプロバイダー/モデルへフォールバックします。
- `models status` は、シークレット以外のプレースホルダーについて、シークレットとしてマスクする代わりに認証出力で `marker(<value>)` を表示することがあります（例: `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`）。

### `models status`

オプション:

- `--json`
- `--plain`
- `--check`（終了コード 1=期限切れ/不足、2=期限切れ間近）
- `--probe`（設定済みauthプロファイルのライブプローブ）
- `--probe-provider <name>`（1つのプロバイダーをプローブ）
- `--probe-profile <id>`（繰り返し指定またはカンマ区切りのプロファイルid）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`（設定済みエージェントid。`OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` を上書き）

プローブステータス区分:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

想定されるプローブ詳細/理由コード:

- `excluded_by_auth_order`: 保存済みプロファイルは存在するが、明示的な `auth.order.<provider>` がそれを省略しているため、プローブは試行せずに除外として報告します。
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`: プロファイルは存在するが、適格でないか解決不能です。
- `no_model`: プロバイダー認証は存在するが、そのプロバイダー向けにプローブ可能なモデル候補をOpenClawが解決できませんでした。

## エイリアス + フォールバック

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## 認証プロファイル

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` は対話型認証ヘルパーです。選択したプロバイダーに応じて、
プロバイダー認証フロー（OAuth/APIキー）を起動することも、手動トークン貼り付けへ案内することもできます。

`models auth login` は、プロバイダーPluginの認証フロー（OAuth/APIキー）を実行します。どのプロバイダーがインストールされているか確認するには
`openclaw plugins list` を使用してください。

例:

```bash
openclaw models auth login --provider openai-codex --set-default
```

注意:

- `setup-token` と `paste-token` は、トークン認証方式を公開しているプロバイダー向けの汎用トークンコマンドとして引き続き利用できます。
- `setup-token` は対話型TTYを必要とし、プロバイダーのトークン認証メソッドを実行します（そのプロバイダーが `setup-token` メソッドを公開している場合は、デフォルトでそれを使用します）。
- `paste-token` は、他の場所や自動化で生成されたトークン文字列を受け付けます。
- `paste-token` には `--provider` が必要で、トークン値の入力を促し、`--profile-id` を渡さない限り、デフォルトのプロファイルid `<provider>:manual` に書き込みます。
- `paste-token --expires-in <duration>` は、`365d` や `12h` のような相対期間から絶対的なトークン有効期限を保存します。
- Anthropicに関する注意: Anthropicのスタッフから、OpenClaw形式のClaude CLI利用は再び許可されていると伝えられたため、Anthropicが新しいポリシーを公開しない限り、OpenClawはこの統合においてClaude CLIの再利用と `claude -p` の使用を認可済みとして扱います。
- Anthropicの `setup-token` / `paste-token` もサポートされたOpenClawのトークン経路として引き続き利用できますが、利用可能な場合、OpenClawは現在Claude CLIの再利用と `claude -p` を優先します。

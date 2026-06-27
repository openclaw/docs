---
read_when:
    - Hermes または別のエージェントシステムから OpenClaw へ移行したい
    - Plugin 所有の移行プロバイダーを追加している
summary: '`openclaw migrate` の CLI リファレンス（別のエージェントシステムから状態をインポート）'
title: 移行
x-i18n:
    generated_at: "2026-06-27T10:57:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90798fd24af0984e485753e251c87a5dd8fd0246e7c135a50e3532de93ba075e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

プラグイン所有の移行プロバイダーを通じて、別のエージェントシステムから状態をインポートします。バンドル済みプロバイダーは Codex CLI の状態、[Claude](/ja-JP/install/migrating-claude)、[Hermes](/ja-JP/install/migrating-hermes) に対応しています。サードパーティ製プラグインは追加のプロバイダーを登録できます。

<Tip>
ユーザー向けの手順は、[Claude からの移行](/ja-JP/install/migrating-claude) と [Hermes からの移行](/ja-JP/install/migrating-hermes) を参照してください。[移行ハブ](/ja-JP/install/migrating) にはすべての移行パスが一覧表示されています。
</Tip>

## コマンド

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate codex --plugin google-calendar --verify-plugin-apps --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --plugin google-calendar
openclaw migrate apply codex --yes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  登録済み移行プロバイダーの名前です。例: `hermes`。インストール済みプロバイダーを確認するには `openclaw migrate list` を実行します。
</ParamField>
<ParamField path="--dry-run" type="boolean">
  計画を作成し、状態を変更せずに終了します。
</ParamField>
<ParamField path="--from <path>" type="string">
  ソース状態ディレクトリを上書きします。Hermes のデフォルトは `~/.hermes` です。
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  対応する認証情報を確認なしでインポートします。対話型の適用では、検出された認証資格情報をインポートする前に確認し、デフォルトでは「はい」が選択されます。非対話型の `--yes` でそれらをインポートするには `--include-secrets` が必要です。
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  対話型プロンプトを含め、認証資格情報のインポートをスキップします。
</ParamField>
<ParamField path="--overwrite" type="boolean">
  計画で競合が報告された場合に、適用処理が既存のターゲットを置き換えることを許可します。
</ParamField>
<ParamField path="--yes" type="boolean">
  確認プロンプトをスキップします。非対話モードでは必須です。
</ParamField>
<ParamField path="--skill <name>" type="string">
  スキル名または項目 ID で、コピーするスキル項目を 1 つ選択します。複数のスキルを移行するには、このフラグを繰り返します。省略した場合、対話型 Codex 移行ではチェックボックスセレクターが表示され、非対話型移行では計画されたすべてのスキルが保持されます。
</ParamField>
<ParamField path="--plugin <name>" type="string">
  プラグイン名または項目 ID で、インストールする Codex プラグイン項目を 1 つ選択します。複数の Codex プラグインを移行するには、このフラグを繰り返します。省略した場合、対話型 Codex 移行ではネイティブ Codex プラグインのチェックボックスセレクターが表示され、非対話型移行では計画されたすべてのプラグインが保持されます。これは、Codex アプリサーバーのインベントリによって検出された、ソース側にインストール済みの `openai-curated` Codex プラグインにのみ適用されます。
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Codex のみ。ネイティブプラグイン有効化を計画する前に、ソース Codex アプリサーバーの `app/list` トラバーサルを強制的に新しく実行します。移行計画を高速に保つため、デフォルトではオフです。
</ParamField>
<ParamField path="--no-backup" type="boolean">
  適用前のバックアップをスキップします。ローカルの OpenClaw 状態が存在する場合は `--force` が必要です。
</ParamField>
<ParamField path="--force" type="boolean">
  適用処理が通常ならバックアップのスキップを拒否する場合に、`--no-backup` と併用する必要があります。
</ParamField>
<ParamField path="--json" type="boolean">
  計画または適用結果を JSON として出力します。`--json` を指定し、`--yes` を指定しない場合、適用処理は計画を出力し、状態を変更しません。
</ParamField>

## 安全性モデル

`openclaw migrate` はプレビュー優先です。

<AccordionGroup>
  <Accordion title="適用前のプレビュー">
    プロバイダーは、何かを変更する前に、競合、スキップされた項目、機密項目を含む項目別の計画を返します。JSON 計画、適用出力、移行レポートでは、API キー、トークン、認可ヘッダー、Cookie、パスワードなど、シークレットらしいネストされたキーが秘匿されます。

    `openclaw migrate apply <provider>` は、`--yes` が設定されていない限り、状態を変更する前に計画をプレビューして確認を求めます。非対話モードでは、適用処理に `--yes` が必要です。

  </Accordion>
  <Accordion title="バックアップ">
    適用処理は、移行を適用する前に OpenClaw バックアップを作成して検証します。ローカルの OpenClaw 状態がまだ存在しない場合、バックアップ手順はスキップされ、移行は続行できます。状態が存在する場合にバックアップをスキップするには、`--no-backup` と `--force` の両方を渡します。
  </Accordion>
  <Accordion title="競合">
    計画に競合がある場合、適用処理は続行を拒否します。計画を確認し、既存のターゲットを置き換える意図がある場合は `--overwrite` を指定して再実行します。プロバイダーは、上書きされたファイルについて、移行レポートディレクトリ内に項目単位のバックアップを書き込む場合があります。
  </Accordion>
  <Accordion title="シークレット">
    対話型の適用では、検出された認証資格情報をインポートするかどうかを確認し、デフォルトでは「はい」が選択されます。スキップするには `--no-auth-credentials` を使用し、`--yes` と併用して無人で資格情報をインポートするには `--include-secrets` を使用します。
  </Accordion>
</AccordionGroup>

## Claude プロバイダー

バンドル済みの Claude プロバイダーは、デフォルトで `~/.claude` にある Claude Code の状態を検出します。特定の Claude Code ホームまたはプロジェクトルートをインポートするには `--from <path>` を使用します。

<Tip>
ユーザー向けの手順は、[Claude からの移行](/ja-JP/install/migrating-claude) を参照してください。
</Tip>

### Claude がインポートする内容

- プロジェクトの `CLAUDE.md` と `.claude/CLAUDE.md` を OpenClaw エージェントワークスペースにインポートします。
- ユーザーの `~/.claude/CLAUDE.md` をワークスペースの `USER.md` に追記します。
- プロジェクトの `.mcp.json`、Claude Code の `~/.claude.json`、Claude Desktop の `claude_desktop_config.json` から MCP サーバー定義をインポートします。
- `SKILL.md` を含む Claude スキルディレクトリ。
- Claude コマンドの Markdown ファイルを、手動呼び出し専用の OpenClaw スキルに変換します。

### アーカイブおよび手動レビュー状態

Claude のフック、権限、環境デフォルト、ローカルメモリ、パススコープのルール、サブエージェント、キャッシュ、計画、プロジェクト履歴は、移行レポートに保存されるか、手動レビュー項目として報告されます。OpenClaw は、フックを実行したり、広範な許可リストをコピーしたり、OAuth/Desktop 資格情報の状態を自動的にインポートしたりしません。

## Codex プロバイダー

バンドル済みの Codex プロバイダーは、デフォルトでは `~/.codex` にある Codex CLI の状態を検出し、その環境変数が設定されている場合は
`CODEX_HOME` にある状態を検出します。特定の Codex ホームをインベントリするには `--from <path>` を使用します。

OpenClaw Codex ハーネスへ移行し、有用な個人用 Codex CLI アセットを意図的に昇格させたい場合に、このプロバイダーを使用します。ローカルの Codex アプリサーバー起動では、エージェントごとの `CODEX_HOME` を使用するため、デフォルトでは個人用の `~/.codex` を読みません。通常のプロセスの `HOME` は引き続き継承されるため、Codex は共有の `$HOME/.agents/*` スキル/プラグインマーケットプレイスエントリを参照でき、サブプロセスはユーザーホームの設定とトークンを見つけられます。

対話型ターミナルで `openclaw migrate codex` を実行すると、完全な計画がプレビューされ、最終的な適用確認の前にチェックボックスセレクターが開きます。スキルコピー項目が最初に確認されます。一括選択には `Toggle all on` または `Toggle all off` を使用します。行を切り替えるには Space を押し、ハイライトされた行を有効化して続行するには Enter を押します。計画されたスキルはチェック済みで始まり、競合するスキルは未チェックで始まります。また、`Skip for now` はこの実行でのスキルコピーをスキップしつつ、プラグイン選択へ進みます。ソース側にインストール済みの curated Codex プラグインが移行可能で、`--plugin` が指定されていない場合、移行は次にプラグイン名でネイティブ Codex プラグインの有効化を確認します。プラグイン項目は、ターゲットの OpenClaw Codex プラグイン設定にそのプラグインがすでに存在しない限り、チェック済みで始まります。既存のターゲットプラグインは未チェックで始まり、`conflict: plugin exists` のような競合ヒントを表示します。その実行でネイティブ Codex プラグインを移行しない場合は `Toggle all off` を選択し、適用前に停止する場合は `Skip for now` を選択します。スクリプト化された実行や厳密な実行では、スキルごとに `--skill <name>` を 1 回渡します。例:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

ネイティブ Codex プラグイン移行を、ソース側にインストール済みの 1 つ以上の curated プラグインに非対話で制限するには、`--plugin <name>` を使用します。

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex がインポートする内容

- `$CODEX_HOME/skills` 配下の Codex CLI スキルディレクトリ。ただし Codex の
  `.system` キャッシュは除きます。
- `$HOME/.agents/skills` 配下の個人用 AgentSkills。エージェントごとの所有にしたい場合、現在の
  OpenClaw エージェントワークスペースにコピーされます。
- Codex アプリサーバーの `plugin/list` を通じて検出された、ソース側にインストール済みの `openai-curated` Codex プラグイン。計画作成では、有効なインストール済みプラグインごとに `plugin/read` を読み取ります。アプリに基づくプラグインでは、ソース Codex アプリサーバーのアカウント応答が ChatGPT サブスクリプションアカウントである必要があります。ChatGPT 以外のアカウント応答または欠落したアカウント応答は、`codex_subscription_required` としてスキップされます。デフォルトでは、移行はソース `app/list` を呼び出さないため、アカウントゲートを通過したアプリに基づくプラグインは、ソースアプリのアクセシビリティ検証なしで計画されます。また、アカウント検索のトランスポート失敗は `codex_account_unavailable` としてスキップされます。移行で新しいソース `app/list` スナップショットを強制し、ネイティブ有効化を計画する前に、所有するすべてのアプリが存在し、有効で、アクセス可能であることを要求したい場合は、`--verify-plugin-apps` を渡します。そのモードでは、アカウント検索のトランスポート失敗はソースアプリインベントリ検証へフォールスルーします。ソースアプリインベントリのスナップショットは、現在のプロセスのメモリ内に保持されます。移行出力やターゲット設定には書き込まれません。無効なプラグイン、読み取り不能なプラグイン詳細、サブスクリプションで制限されたソースアカウント、および検証が要求された場合の欠落アプリ、無効アプリ、アクセス不能アプリ、ソースアプリインベントリの失敗は、ターゲット設定エントリではなく、型付き理由を持つ手動スキップ項目になります。
  適用処理は、選択された対象プラグインごとにアプリサーバーの `plugin/install` を呼び出します。これは、ターゲットアプリサーバーがそのプラグインをインストール済みかつ有効と報告している場合でも同じです。移行された Codex プラグインは、ネイティブ Codex ハーネスを選択したセッションでのみ使用できます。OpenClaw プロバイダー実行、ACP 会話バインディング、その他のハーネスには公開されません。

### 手動レビューが必要な Codex 状態

Codex の `config.toml`、ネイティブの `hooks/hooks.json`、curated 以外のマーケットプレイス、ソース側にインストール済みの curated プラグインではないキャッシュ済みプラグインバンドル、ソースのサブスクリプションゲートに失敗したソース側インストール済みプラグインは、自動的には有効化されません。`--verify-plugin-apps` が設定されている場合、ソースアプリインベントリゲートに失敗したプラグインもスキップされます。それらは手動レビューのために、移行レポートにコピーされるか報告されます。

移行された、ソース側にインストール済みの curated プラグインについて、適用処理は次を書き込みます。

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- 選択した各プラグインについて、`marketplaceName: "openai-curated"` と
  `pluginName` を持つ明示的なプラグインエントリを 1 つ

移行は `plugins["*"]` を書き込まず、ローカルマーケットプレイスのキャッシュパスも保存しません。ソース側のサブスクリプション失敗は、`codex_subscription_required`、`codex_account_unavailable`、`plugin_disabled`、`plugin_read_unavailable` などの型付き理由とともに手動項目で報告されます。`--verify-plugin-apps` を指定すると、ソースのアプリインベントリ失敗も `app_inaccessible`、`app_disabled`、`app_missing`、`app_inventory_unavailable` として表示されることがあります。スキップされた Plugin はターゲット設定に書き込まれません。
ターゲット側で認証が必要なインストールは、影響を受ける Plugin 項目に `status: "skipped"`、`reason: "auth_required"`、およびサニタイズ済みアプリ識別子として報告されます。
それらの明示的な設定エントリは、再認可して有効化するまで無効として書き込まれます。その他のインストール失敗は、項目単位の `error` 結果です。

計画中に Codex アプリサーバー Plugin インベントリを利用できない場合、移行全体を失敗させる代わりに、キャッシュ済みバンドル助言項目へフォールバックします。

## Hermes プロバイダー

バンドルされた Hermes プロバイダーは、デフォルトで `~/.hermes` の状態を検出します。Hermes が別の場所にある場合は `--from <path>` を使用します。

### Hermes がインポートするもの

- `config.yaml` からのデフォルトモデル設定。
- `providers` と `custom_providers` からの設定済みモデルプロバイダーおよびカスタム OpenAI 互換エンドポイント。
- `mcp_servers` または `mcp.servers` からの MCP サーバー定義。
- `SOUL.md` と `AGENTS.md` を OpenClaw エージェントワークスペースへ。
- `memories/MEMORY.md` と `memories/USER.md` をワークスペースメモリファイルへ追記。
- OpenClaw ファイルメモリ用のメモリ設定デフォルト、および Honcho などの外部メモリプロバイダー向けのアーカイブまたは手動レビュー項目。
- `skills/<name>/` 配下に `SKILL.md` ファイルを含む Skills。
- `skills.config` からの Skill ごとの設定値。
- 対話型の認証情報移行が承認された場合、または `--include-secrets` が設定されている場合の、OpenCode `auth.json` からの OpenCode OpenAI OAuth 認証情報。Hermes `auth.json` の OAuth エントリは、手動の OpenAI 再認証または doctor 修復用に報告されるレガシー状態です。
- 対話型の認証情報移行が承認された場合、または `--include-secrets` が設定されている場合の、Hermes `.env` と OpenCode `auth.json` からのサポート対象 API キーおよびトークン。

### サポート対象の `.env` キー

- `AI_GATEWAY_API_KEY`
- `ALIBABA_API_KEY`
- `ANTHROPIC_API_KEY`
- `ARCEEAI_API_KEY`
- `CEREBRAS_API_KEY`
- `CHUTES_API_KEY`
- `CLOUDFLARE_AI_GATEWAY_API_KEY`
- `COPILOT_GITHUB_TOKEN`
- `DASHSCOPE_API_KEY`
- `DEEPINFRA_API_KEY`
- `DEEPSEEK_API_KEY`
- `FIREWORKS_API_KEY`
- `GEMINI_API_KEY`
- `GH_TOKEN`
- `GITHUB_TOKEN`
- `GLM_API_KEY`
- `GOOGLE_API_KEY`
- `GROQ_API_KEY`
- `HF_TOKEN`
- `HUGGINGFACE_HUB_TOKEN`
- `KILOCODE_API_KEY`
- `KIMICODE_API_KEY`
- `KIMI_API_KEY`
- `MINIMAX_API_KEY`
- `MINIMAX_CODING_API_KEY`
- `MISTRAL_API_KEY`
- `MODELSTUDIO_API_KEY`
- `MOONSHOT_API_KEY`
- `NVIDIA_API_KEY`
- `OPENAI_API_KEY`
- `OPENCODE_API_KEY`
- `OPENCODE_GO_API_KEY`
- `OPENCODE_ZEN_API_KEY`
- `OPENROUTER_API_KEY`
- `QIANFAN_API_KEY`
- `QWEN_API_KEY`
- `TOGETHER_API_KEY`
- `VENICE_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`
- `ZAI_API_KEY`
- `Z_AI_API_KEY`

### アーカイブ専用状態

OpenClaw が安全に解釈できない Hermes の状態は、手動レビュー用に移行レポートへコピーされますが、実行中の OpenClaw 設定や認証情報には読み込まれません。これにより、OpenClaw が自動的に実行または信頼できるかのように扱うことなく、不透明または安全でない状態を保持します。

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

### 適用後

```bash
openclaw doctor
```

## Plugin 契約

移行ソースは Plugin です。Plugin は `openclaw.plugin.json` でプロバイダー ID を宣言します。

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

実行時に Plugin は `api.registerMigrationProvider(...)` を呼び出します。プロバイダーは `detect`、`plan`、`apply` を実装します。Core は CLI オーケストレーション、バックアップポリシー、プロンプト、JSON 出力、競合の事前確認を所有します。Core はレビュー済みの計画を `apply(ctx, plan)` に渡し、互換性のため、その引数が存在しない場合にのみプロバイダーは計画を再構築できます。

プロバイダー Plugin は、項目構築と概要カウントに `openclaw/plugin-sdk/migration` を使用でき、競合を考慮したファイルコピー、アーカイブ専用レポートコピー、キャッシュ済み設定ランタイムラッパー、移行レポートに `openclaw/plugin-sdk/migration-runtime` を使用できます。

## オンボーディング統合

既知のソースをプロバイダーが検出した場合、オンボーディングで移行を提示できます。`openclaw onboard --flow import` と `openclaw setup --wizard --import-from hermes` はどちらも同じ Plugin 移行プロバイダーを使用し、適用前に引き続きプレビューを表示します。

<Note>
オンボーディングのインポートには、新しい OpenClaw セットアップが必要です。すでにローカル状態がある場合は、先に設定、認証情報、セッション、ワークスペースをリセットしてください。既存セットアップ向けのバックアップ付き上書きまたはマージインポートは、機能ゲートされています。
</Note>

## 関連

- [Hermes からの移行](/ja-JP/install/migrating-hermes): ユーザー向けウォークスルー。
- [Claude からの移行](/ja-JP/install/migrating-claude): ユーザー向けウォークスルー。
- [移行](/ja-JP/install/migrating): OpenClaw を新しいマシンへ移動する。
- [Doctor](/ja-JP/gateway/doctor): 移行の適用後のヘルスチェック。
- [Plugins](/ja-JP/tools/plugin): Plugin のインストールと登録。

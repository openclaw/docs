---
read_when:
    - Hermes または別のエージェントシステムから OpenClaw へ移行したい場合
    - Plugin が所有する移行プロバイダーを追加する場合
summary: '`openclaw migrate` のCLIリファレンス（別のエージェントシステムから状態をインポート）'
title: 移行する
x-i18n:
    generated_at: "2026-07-11T22:08:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1160373bfec09de8ec1bac6fbe8a218e8af7ec6a5896bc1fdfe6a0db158d50a1
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Plugin が所有する移行プロバイダーを通じて、別のエージェントシステムから状態をインポートします。組み込みプロバイダーは Claude、Codex CLI、[Hermes](/ja-JP/install/migrating-hermes) に対応しています。Plugin は追加のプロバイダーを登録できます。

<Tip>
ユーザー向けの手順については、[Claude からの移行](/ja-JP/install/migrating-claude)および[Hermes からの移行](/ja-JP/install/migrating-hermes)を参照してください。[移行ハブ](/ja-JP/install/migrating)にはすべての移行パスが掲載されています。
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

ほかのフラグを指定せずに `openclaw migrate <provider>` を実行すると、計画を作成してプレビューし、（TTY では）適用前に確認を求めます。`openclaw migrate plan <provider>` と `openclaw migrate apply <provider>` を使用すると、同じフラグのままプレビューと適用を別々のサブコマンドに分けられます。

<ParamField path="<provider>" type="string">
  登録済み移行プロバイダーの名前（例: `hermes`）。インストール済みのプロバイダーを確認するには、`openclaw migrate list` を実行します。
</ParamField>
<ParamField path="--dry-run" type="boolean">
  計画を作成し、状態を変更せずに終了します。
</ParamField>
<ParamField path="--from <path>" type="string">
  移行元の状態ディレクトリを上書きします。Hermes のデフォルトは `~/.hermes`、Codex のデフォルトは `~/.codex`（または `$CODEX_HOME`）、Claude のデフォルトは `~/.claude` です。
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  対応している認証情報を確認なしでインポートします。対話形式の適用では、検出された認証用の認証情報をインポートする前に確認を求め、デフォルトでは「はい」が選択されています。非対話形式で `--yes` を使用してインポートするには、`--include-secrets` が必要です。
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  対話形式の確認を含め、認証用の認証情報のインポートをスキップします。
</ParamField>
<ParamField path="--overwrite" type="boolean">
  計画で競合が報告された場合に、適用時に既存の移行先を置き換えることを許可します。
</ParamField>
<ParamField path="--yes" type="boolean">
  確認プロンプトをスキップします。非対話モードでは必須です。
</ParamField>
<ParamField path="--skill <name>" type="string">
  スキル名または項目 ID で、コピーするスキル項目を 1 つ選択します。複数のスキルを移行するには、このフラグを繰り返し指定します。省略した場合、対話形式の Codex 移行ではチェックボックス式の選択画面が表示され、非対話形式の移行では計画されたすべてのスキルが維持されます。
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Plugin 名または項目 ID で、インストールする Codex Plugin 項目を 1 つ選択します。複数の Codex Plugin を移行するには、このフラグを繰り返し指定します。省略した場合、対話形式の Codex 移行では Codex ネイティブの Plugin チェックボックス式選択画面が表示され、非対話形式の移行では計画されたすべての Plugin が維持されます。Codex app-server のインベントリによって検出された、移行元にインストール済みの `openai-curated` Codex Plugin にのみ適用されます。
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Codex 専用です。ネイティブ Plugin の有効化を計画する前に、移行元 Codex app-server の `app/list` を新たに走査するよう強制します。移行計画を高速に保つため、デフォルトでは無効です。
</ParamField>
<ParamField path="--backup-output <path>" type="string">
  移行前バックアップのアーカイブパスまたはディレクトリです。`openclaw backup create` にそのまま渡されます。
</ParamField>
<ParamField path="--no-backup" type="boolean">
  適用前のバックアップをスキップします。ローカルの OpenClaw 状態が存在する場合は `--force` が必要です。
</ParamField>
<ParamField path="--force" type="boolean">
  バックアップのスキップを適用時に拒否される状況で `--no-backup` を使用する場合、併せて指定する必要があります。
</ParamField>
<ParamField path="--json" type="boolean">
  計画または適用結果を JSON として出力します。`--json` を指定し、`--yes` を指定しない場合、適用コマンドは計画を出力し、状態を変更しません。
</ParamField>

## 安全性モデル

`openclaw migrate` はプレビューを優先します。

<AccordionGroup>
  <Accordion title="適用前にプレビュー">
    プロバイダーは何かを変更する前に、競合、スキップされた項目、機密項目を含む項目別の計画を返します。JSON 計画、適用出力、移行レポートでは、API キー、トークン、認可ヘッダー、Cookie、パスワードなど、シークレットに見えるネストされたキーが秘匿化されます。

    `openclaw migrate apply <provider>` は、`--yes` が設定されていない限り、状態を変更する前に計画をプレビューして確認を求めます。非対話モードで適用するには `--yes` が必要です。

  </Accordion>
  <Accordion title="バックアップ">
    適用時には、移行を適用する前に OpenClaw のバックアップを作成して検証します。ローカルの OpenClaw 状態がまだ存在しない場合、バックアップ手順はスキップされ、移行が続行されます。状態が存在する場合にバックアップをスキップするには、`--no-backup` と `--force` の両方を指定します。
  </Accordion>
  <Accordion title="競合">
    計画に競合がある場合、適用は続行を拒否します。計画を確認し、既存の移行先を意図的に置き換える場合は `--overwrite` を指定して再実行してください。プロバイダーは、上書きされるファイルについて、移行レポートディレクトリに項目単位のバックアップを作成する場合があります。
  </Accordion>
  <Accordion title="シークレット">
    対話形式の適用では、検出された認証用の認証情報をインポートするか確認を求め、デフォルトでは「はい」が選択されています。スキップするには `--no-auth-credentials` を使用し、無人で `--yes` とともに認証情報をインポートするには `--include-secrets` を使用します。
  </Accordion>
</AccordionGroup>

## Claude プロバイダー

組み込みの Claude プロバイダーは、デフォルトで `~/.claude` にある Claude Code の状態を検出します。特定の Claude Code ホームまたはプロジェクトルートからインポートするには、`--from <path>` を使用します。

<Tip>
ユーザー向けの手順については、[Claude からの移行](/ja-JP/install/migrating-claude)を参照してください。
</Tip>

### Claude がインポートする内容

- プロジェクトの `CLAUDE.md` と `.claude/CLAUDE.md` を OpenClaw エージェントワークスペース（`AGENTS.md`）にインポートします。
- ユーザーの `~/.claude/CLAUDE.md` をワークスペースの `USER.md` に追記します。
- プロジェクトの `.mcp.json`、Claude Code の `~/.claude.json`（プロジェクトごとのエントリを含む）、Claude Desktop の `claude_desktop_config.json` から MCP サーバー定義をインポートします。
- `SKILL.md` を含む Claude スキルディレクトリ（ユーザーの `~/.claude/skills` とプロジェクトの `.claude/skills`）をインポートします。
- Claude コマンドの Markdown ファイル（ユーザーの `~/.claude/commands` とプロジェクトの `.claude/commands`）を、手動呼び出し専用の OpenClaw スキルに変換します。

### アーカイブと手動確認の状態

Claude のフック、権限、環境のデフォルト、プロジェクトの `CLAUDE.local.md`、`.claude/rules`、ユーザーおよびプロジェクトの `agents/` ディレクトリ、プロジェクト履歴（`~/.claude` 配下の `projects`、`cache`、`plans`）は、移行レポートに保存されるか、手動確認項目として報告されます。OpenClaw は、フックの実行、広範な許可リストのコピー、OAuth/Desktop の認証情報状態の自動インポートを行いません。

## Codex プロバイダー

組み込みの Codex プロバイダーは、デフォルトで `~/.codex` にある Codex CLI の状態を検出し、環境変数 `CODEX_HOME` が設定されている場合はその場所を検出します。特定の Codex ホームをインベントリ化するには、`--from <path>` を使用します。

OpenClaw Codex ハーネスへ移行し、有用な個人用 Codex CLI アセットを意図的に昇格させたい場合に、このプロバイダーを使用します。ローカルの Codex app-server はエージェントごとの `CODEX_HOME` を使用して起動するため、デフォルトでは個人用の `~/.codex` を読み取りません。通常のプロセスの `HOME` は引き続き継承されるため、Codex は共有の `$HOME/.agents/*` スキルおよび Plugin マーケットプレイスのエントリを参照でき、サブプロセスはユーザーホームの設定とトークンを見つけられます。

対話形式のターミナルで `openclaw migrate codex` を実行すると、完全な計画がプレビューされ、最終的な適用確認の前にチェックボックス式の選択画面が開きます。最初にスキルのコピー項目について確認されます。一括選択には `Toggle all on` または `Toggle all off` を使用します。Space キーで行の選択を切り替えるか、Enter キーで強調表示された行を有効にして続行します。計画されたスキルは選択済み、競合するスキルは未選択で始まり、`Skip for now` を選択すると、この実行でのスキルのコピーをスキップしつつ、Plugin の選択へ進みます。移行元にインストール済みのキュレーションされた Codex Plugin が移行可能で、`--plugin` が指定されていない場合、続いて Plugin 名による Codex ネイティブ Plugin の有効化を確認します。移行先の OpenClaw Codex Plugin 設定にその Plugin がすでに存在しない限り、Plugin 項目は選択済みで始まります。移行先に既存の Plugin がある場合は未選択で始まり、`conflict: plugin exists` のような競合のヒントが表示されます。この実行で Codex ネイティブ Plugin を移行しない場合は `Toggle all off` を選択し、適用前に停止する場合は `Skip for now` を選択します。

スクリプト化された実行や厳密な実行では、1 つ以上のスキルまたは Plugin を明示的に選択します。

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex がインポートする内容

- `$CODEX_HOME/skills` 配下の Codex CLI スキルディレクトリ。ただし、Codex の `.system` キャッシュは除外されます。
- `$HOME/.agents/skills` 配下の個人用 AgentSkills。エージェント単位で所有するため、現在の OpenClaw エージェントワークスペースにコピーされます。
- Codex app-server の `plugin/list` を通じて検出された、移行元にインストール済みの `openai-curated` Codex Plugin。計画時には、有効なインストール済み Plugin ごとに `plugin/read` を読み取ります。

アプリに対応する Plugin の移行には、追加の条件があります。

- アプリに対応する Plugin を移行するには、移行元 Codex app-server のアカウントが ChatGPT サブスクリプションアカウントである必要があります。ChatGPT 以外のアカウント、またはアカウント応答がない場合は、`codex_subscription_required` としてスキップされます。
- デフォルトでは、移行時に移行元の `app/list` を呼び出しません。そのため、アカウント条件を満たしたアプリ対応 Plugin は、移行元アプリへのアクセス可否を検証せずに計画されます。また、アカウント検索時の通信エラーは `codex_account_unavailable` としてスキップされます。
- `--verify-plugin-apps` を指定すると、移行元の `app/list` の新しいスナップショットを強制的に取得し、所有するすべてのアプリが存在し、有効で、アクセス可能であることを、ネイティブ有効化の計画前に要求します。このモードでは、アカウント検索時の通信エラーが発生すると、移行元アプリのインベントリ検証へフォールスルーします。スナップショットは現在のプロセスのメモリ内にのみ保持され、移行出力や移行先設定には書き込まれません。

無効な Plugin、読み取れない Plugin の詳細、サブスクリプション条件を満たさない移行元アカウント、および（`--verify-plugin-apps` が設定されている場合）存在しない、無効、またはアクセス不能なアプリは、移行先設定のエントリにはならず、型付きの理由を伴う手動対応が必要なスキップ項目になります。適用時には、選択された対象 Plugin ごとに app-server の `plugin/install` が呼び出されます。移行先 app-server がその Plugin をインストール済みかつ有効であるとすでに報告している場合も同様です。移行された Codex Plugin は、Codex ネイティブハーネスを選択したセッションでのみ使用できます。OpenClaw プロバイダーの実行、ACP 会話バインディング、その他のハーネスには公開されません。

### 手動確認が必要な Codex の状態

Codex の `config.toml`、ネイティブの `hooks/hooks.json`、キュレーション対象外のマーケットプレイス、移行元にインストールされたキュレーション対象 Plugin ではないキャッシュ済み Plugin バンドル、および移行元のサブスクリプション条件を満たさないインストール済み Plugin は、自動的には有効化されません。`--verify-plugin-apps` が設定されている場合、移行元アプリのインベントリ条件を満たさない Plugin もスキップされます。これらはすべて、手動確認のために移行レポートへコピーされるか、レポート内で報告されます。

移行元にインストール済みのキュレーション対象 Plugin を移行する場合、適用時に次の内容が書き込まれます。

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- 選択した Plugin ごとに、`marketplaceName: "openai-curated"` と `pluginName` を持つ明示的な Plugin エントリを 1 つ

移行時に `plugins["*"]` が書き込まれることはなく、ローカルのマーケットプレイスキャッシュパスが保存されることもありません。

スキップされたプラグインはターゲット設定に書き込まれません。ソース側のサブスクリプションエラーは、手動対応項目に型付きの理由として報告されます。理由は `codex_subscription_required`、`codex_account_unavailable`、`plugin_disabled`、または `plugin_read_unavailable` です。`--verify-plugin-apps` を指定すると、ソースのアプリインベントリ取得エラーも `app_inaccessible`、`app_disabled`、`app_missing`、または `app_inventory_unavailable` として表示される場合があります。ターゲット側で認証が必要なインストールは、該当するプラグイン項目に `status: "skipped"`、`reason: "auth_required"`、およびサニタイズ済みのアプリ識別子とともに報告されます。対応する明示的な設定エントリは、再認証して有効化するまで無効な状態で書き込まれます。その他のインストールエラーは、項目単位の `error` 結果として報告されます。

計画時に Codex app-server のプラグインインベントリを利用できない場合、移行全体を失敗させる代わりに、キャッシュされたバンドルの参考項目へフォールバックします。

## Hermes プロバイダー

バンドルされた Hermes プロバイダーは、デフォルトで `~/.hermes` の状態を検出します。Hermes が別の場所にある場合は `--from <path>` を使用します。

### Hermes がインポートするもの

- `config.yaml` のデフォルトモデル設定。
- `providers` および `custom_providers` の設定済みモデルプロバイダーとカスタム OpenAI 互換エンドポイント。
- `mcp_servers` または `mcp.servers` の MCP サーバー定義。
- `SOUL.md` および `AGENTS.md` を OpenClaw エージェントワークスペースへインポート。
- `memories/MEMORY.md` および `memories/USER.md` をワークスペースのメモリファイルへ追記。
- OpenClaw ファイルメモリ向けのメモリ設定のデフォルト値、および Honcho などの外部メモリプロバイダー向けのアーカイブ項目または手動レビュー項目。
- `skills/<name>/` 配下に `SKILL.md` ファイルを含む Skills。
- `skills.config` の Skills ごとの設定値。
- 対話形式の認証情報移行を承認した場合、または `--include-secrets` を設定した場合の、OpenCode `auth.json` にある OpenCode OpenAI OAuth 認証情報。Hermes `auth.json` の OAuth エントリは、OpenAI の手動再認証または Doctor による修復の対象として報告されるレガシー状態です。
- 対話形式の認証情報移行を承認した場合、または `--include-secrets` を設定した場合の、Hermes `.env` および OpenCode `auth.json` にあるサポート対象の API キーとトークン。

### サポート対象の `.env` キー

`AI_GATEWAY_API_KEY`, `ALIBABA_API_KEY`, `ANTHROPIC_API_KEY`, `ARCEEAI_API_KEY`, `CEREBRAS_API_KEY`, `CHUTES_API_KEY`, `CLOUDFLARE_AI_GATEWAY_API_KEY`, `COPILOT_GITHUB_TOKEN`, `DASHSCOPE_API_KEY`, `DEEPINFRA_API_KEY`, `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY`, `GEMINI_API_KEY`, `GH_TOKEN`, `GITHUB_TOKEN`, `GLM_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `HF_TOKEN`, `HUGGINGFACE_HUB_TOKEN`, `KILOCODE_API_KEY`, `KIMICODE_API_KEY`, `KIMI_API_KEY`, `MINIMAX_API_KEY`, `MINIMAX_CODING_API_KEY`, `MISTRAL_API_KEY`, `MODELSTUDIO_API_KEY`, `MOONSHOT_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `OPENCODE_API_KEY`, `OPENCODE_GO_API_KEY`, `OPENCODE_ZEN_API_KEY`, `OPENROUTER_API_KEY`, `QIANFAN_API_KEY`, `QWEN_API_KEY`, `TOGETHER_API_KEY`, `VENICE_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`, `ZAI_API_KEY`, `Z_AI_API_KEY`。

### アーカイブ専用の状態

OpenClaw が安全に解釈できない Hermes の状態は、手動レビュー用として移行レポートにコピーされますが、稼働中の OpenClaw の設定や認証情報には読み込まれません。これにより、OpenClaw が自動的に実行または信頼できるかのように扱うことなく、不透明または安全でない状態を保持します：`plugins/`、`sessions/`、`logs/`、`cron/`、`mcp-tokens/`、`state.db`。

### 適用後

```bash
openclaw doctor
```

## Plugin コントラクト

移行ソースはプラグインです。プラグインは `openclaw.plugin.json` でプロバイダー ID を宣言します。

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

実行時にプラグインは `api.registerMigrationProvider(...)` を呼び出します。プロバイダーは `detect`、`plan`、`apply` を実装します。コアは CLI のオーケストレーション、バックアップポリシー、プロンプト、JSON 出力、競合の事前チェックを担います。コアはレビュー済みの計画を `apply(ctx, plan)` に渡します。互換性のため、その引数がない場合に限り、プロバイダーは計画を再構築できます。

プロバイダープラグインは、項目の構築とサマリー件数のために `openclaw/plugin-sdk/migration` を使用できます。また、競合を考慮したファイルコピー、アーカイブ専用レポートへのコピー、キャッシュ済み設定ランタイムのラッパー、および移行レポートのために `openclaw/plugin-sdk/migration-runtime` を使用できます。

## オンボーディングとの統合

プロバイダーが既知のソースを検出した場合、オンボーディングで移行を提案できます。`openclaw onboard --flow import` と `openclaw setup --wizard --import-from hermes` はどちらも同じプラグイン移行プロバイダーを使用し、適用前に引き続きプレビューを表示します。

<Note>
オンボーディングによるインポートには、新規の OpenClaw セットアップが必要です。ローカルに既存の状態がある場合は、先に設定、認証情報、セッション、およびワークスペースをリセットしてください。既存のセットアップに対するバックアップ後の上書きインポートまたはマージインポートは、機能ゲートによって制限されています。
</Note>

## 関連項目

- [Hermes からの移行](/ja-JP/install/migrating-hermes)：ユーザー向けの手順。
- [Claude からの移行](/ja-JP/install/migrating-claude)：ユーザー向けの手順。
- [移行](/ja-JP/install/migrating)：OpenClaw を新しいマシンへ移動します。
- [Doctor](/ja-JP/gateway/doctor)：移行適用後の健全性チェック。
- [プラグイン](/ja-JP/tools/plugin)：プラグインのインストールと登録。

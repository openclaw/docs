---
read_when:
    - Hermes または別のエージェントシステムから OpenClaw に移行したい場合
    - Plugin 所有の移行プロバイダーを追加しています
summary: '`openclaw migrate` の CLI リファレンス（別のエージェントシステムから状態をインポート）'
title: 移行
x-i18n:
    generated_at: "2026-07-05T11:09:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1160373bfec09de8ec1bac6fbe8a218e8af7ec6a5896bc1fdfe6a0db158d50a1
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Plugin が所有する移行プロバイダーを通じて、別のエージェントシステムから状態をインポートします。バンドルされたプロバイダーは Claude、Codex CLI、[Hermes](/ja-JP/install/migrating-hermes) に対応し、Plugin は追加のプロバイダーを登録できます。

<Tip>
ユーザー向けの手順は、[Claude からの移行](/ja-JP/install/migrating-claude) と [Hermes からの移行](/ja-JP/install/migrating-hermes) を参照してください。[移行ハブ](/ja-JP/install/migrating) にはすべての経路が一覧されています。
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

ほかのフラグなしで `openclaw migrate <provider>` を実行すると、計画、プレビューを行い、(TTY では) 適用前に確認を求めます。`openclaw migrate plan <provider>` と `openclaw migrate apply <provider>` は、同じフラグでプレビューと適用を別々のサブコマンドに分けます。

<ParamField path="<provider>" type="string">
  登録済みの移行プロバイダー名。例: `hermes`。インストール済みのプロバイダーを確認するには `openclaw migrate list` を実行します。
</ParamField>
<ParamField path="--dry-run" type="boolean">
  計画を作成し、状態を変更せずに終了します。
</ParamField>
<ParamField path="--from <path>" type="string">
  ソース状態ディレクトリを上書きします。Hermes のデフォルトは `~/.hermes`、Codex のデフォルトは `~/.codex` (または `$CODEX_HOME`)、Claude のデフォルトは `~/.claude` です。
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  対応している認証情報を確認なしでインポートします。対話的な適用では、検出された認証情報をインポートする前に確認し、デフォルトでは yes が選択されます。非対話の `--yes` でこれらをインポートするには `--include-secrets` が必要です。
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  対話プロンプトを含め、認証情報のインポートをスキップします。
</ParamField>
<ParamField path="--overwrite" type="boolean">
  計画で競合が報告された場合に、適用で既存のターゲットを置き換えられるようにします。
</ParamField>
<ParamField path="--yes" type="boolean">
  確認プロンプトをスキップします。非対話モードでは必須です。
</ParamField>
<ParamField path="--skill <name>" type="string">
  Skills 名または項目 ID で、コピーする Skills 項目を 1 つ選択します。複数の Skills を移行するには、このフラグを繰り返します。省略した場合、対話的な Codex 移行ではチェックボックスセレクターが表示され、非対話の移行では計画されたすべての Skills が保持されます。
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Plugin 名または項目 ID で、インストールする Codex Plugin 項目を 1 つ選択します。複数の Codex Plugin を移行するには、このフラグを繰り返します。省略した場合、対話的な Codex 移行ではネイティブ Codex Plugin のチェックボックスセレクターが表示され、非対話の移行では計画されたすべての Plugin が保持されます。Codex アプリサーバーインベントリで検出された、ソースにインストール済みの `openai-curated` Codex Plugin にのみ適用されます。
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Codex のみ。ネイティブ Plugin の有効化を計画する前に、ソース Codex アプリサーバーの `app/list` トラバーサルを新たに強制します。移行計画を高速に保つため、デフォルトではオフです。
</ParamField>
<ParamField path="--backup-output <path>" type="string">
  移行前バックアップアーカイブのパスまたはディレクトリ。`openclaw backup create` にそのまま渡されます。
</ParamField>
<ParamField path="--no-backup" type="boolean">
  適用前バックアップをスキップします。ローカルの OpenClaw 状態が存在する場合は `--force` が必要です。
</ParamField>
<ParamField path="--force" type="boolean">
  適用がバックアップのスキップを拒否する状況で、`--no-backup` と併用する必要があります。
</ParamField>
<ParamField path="--json" type="boolean">
  計画または適用結果を JSON として出力します。`--json` があり `--yes` がない場合、apply は計画を出力し、状態を変更しません。
</ParamField>

## 安全性モデル

`openclaw migrate` はプレビュー優先です。

<AccordionGroup>
  <Accordion title="適用前にプレビュー">
    プロバイダーは、何かが変更される前に、競合、スキップされた項目、機密項目を含む項目別の計画を返します。JSON 計画、適用出力、移行レポートでは、API キー、トークン、認可ヘッダー、Cookie、パスワードなど、シークレットらしいネストされたキーが編集されます。

    `openclaw migrate apply <provider>` は、`--yes` が設定されていない限り、状態を変更する前に計画をプレビューして確認を求めます。非対話モードでは、apply に `--yes` が必要です。

  </Accordion>
  <Accordion title="バックアップ">
    Apply は移行を適用する前に OpenClaw バックアップを作成して検証します。ローカルの OpenClaw 状態がまだ存在しない場合、バックアップ手順はスキップされ、移行は続行されます。状態が存在する場合にバックアップをスキップするには、`--no-backup` と `--force` の両方を渡します。
  </Accordion>
  <Accordion title="競合">
    計画に競合がある場合、apply は続行を拒否します。計画を確認し、既存のターゲットを置き換える意図がある場合は `--overwrite` を付けて再実行します。プロバイダーは、移行レポートディレクトリに上書きされたファイルの項目レベルのバックアップを引き続き書き込むことがあります。
  </Accordion>
  <Accordion title="シークレット">
    対話的な apply は、検出された認証情報をインポートするかどうかを確認し、デフォルトでは yes が選択されます。スキップするには `--no-auth-credentials` を使用し、`--yes` とともに無人で認証情報をインポートするには `--include-secrets` を使用します。
  </Accordion>
</AccordionGroup>

## Claude プロバイダー

バンドルされた Claude プロバイダーは、デフォルトで `~/.claude` にある Claude Code 状態を検出します。特定の Claude Code ホームまたはプロジェクトルートをインポートするには `--from <path>` を使用します。

<Tip>
ユーザー向けの手順は、[Claude からの移行](/ja-JP/install/migrating-claude) を参照してください。
</Tip>

### Claude がインポートするもの

- プロジェクトの `CLAUDE.md` と `.claude/CLAUDE.md` を OpenClaw エージェントワークスペース (`AGENTS.md`) にインポートします。
- ユーザーの `~/.claude/CLAUDE.md` をワークスペースの `USER.md` に追記します。
- プロジェクトの `.mcp.json`、Claude Code の `~/.claude.json` (プロジェクトごとのエントリを含む)、Claude Desktop の `claude_desktop_config.json` から MCP サーバー定義をインポートします。
- `SKILL.md` を含む Claude Skills ディレクトリ (ユーザーの `~/.claude/skills` とプロジェクトの `.claude/skills`)。
- Claude コマンド Markdown ファイル (ユーザーの `~/.claude/commands` とプロジェクトの `.claude/commands`) を、手動呼び出し専用の OpenClaw Skills に変換します。

### アーカイブと手動レビュー状態

Claude hooks、権限、環境デフォルト、プロジェクトの `CLAUDE.local.md`、`.claude/rules`、ユーザーおよびプロジェクトの `agents/` ディレクトリ、プロジェクト履歴 (`~/.claude` 配下の `projects`、`cache`、`plans`) は、移行レポートに保存されるか、手動レビュー項目として報告されます。OpenClaw は hook の実行、広範な許可リストのコピー、OAuth/Desktop 認証情報状態の自動インポートは行いません。

## Codex プロバイダー

バンドルされた Codex プロバイダーは、デフォルトで `~/.codex` にある Codex CLI 状態を検出します。環境変数 `CODEX_HOME` が設定されている場合は、その場所を使用します。特定の Codex ホームをインベントリするには `--from <path>` を使用します。

OpenClaw Codex ハーネスへ移行し、有用な個人用 Codex CLI アセットを意図的に昇格したい場合に、このプロバイダーを使用します。ローカルの Codex アプリサーバー起動では、エージェントごとの `CODEX_HOME` が使用されるため、デフォルトでは個人用の `~/.codex` を読み取りません。通常のプロセス `HOME` は引き続き継承されるため、Codex は共有の `$HOME/.agents/*` Skills/Plugin マーケットプレイスエントリを参照でき、サブプロセスはユーザーホームの設定とトークンを見つけられます。

対話型ターミナルで `openclaw migrate codex` を実行すると、完全な計画をプレビューした後、最終的な適用確認の前にチェックボックスセレクターが開きます。Skills コピー項目が最初に確認されます。一括選択には `Toggle all on` または `Toggle all off` を使用します。行を切り替えるには Space を押し、強調表示された行を有効化して続行するには Enter を押します。計画された Skills はチェック済みで開始し、競合する Skills は未チェックで開始します。`Skip for now` は、この実行での Skills コピーをスキップしつつ、Plugin 選択へ進みます。ソースにインストール済みのキュレート済み Codex Plugin が移行可能で、`--plugin` が指定されていない場合、移行は次に Plugin 名でネイティブ Codex Plugin の有効化を確認します。ターゲットの OpenClaw Codex Plugin 設定にその Plugin がすでにある場合を除き、Plugin 項目はチェック済みで開始します。既存のターゲット Plugin は未チェックで開始し、`conflict: plugin exists` のような競合ヒントを表示します。その実行でネイティブ Codex Plugin を移行しない場合は `Toggle all off` を選び、適用前に停止するには `Skip for now` を選びます。

スクリプト化された実行または厳密な実行では、1 つ以上の Skills または Plugin を明示的に選択します。

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex がインポートするもの

- Codex の `.system` キャッシュを除く、`$CODEX_HOME/skills` 配下の Codex CLI Skills ディレクトリ。
- `$HOME/.agents/skills` 配下の個人用 AgentSkills。エージェントごとの所有権のため、現在の OpenClaw エージェントワークスペースにコピーされます。
- Codex アプリサーバーの `plugin/list` を通じて検出された、ソースにインストール済みの `openai-curated` Codex Plugin。計画では、有効化されインストール済みの各 Plugin に対して `plugin/read` を読み取ります。

アプリ連携 Plugin の移行には追加のゲートがあります。

- アプリ連携 Plugin では、ソース Codex アプリサーバーアカウントが ChatGPT サブスクリプションアカウントである必要があります。ChatGPT 以外、またはアカウント応答がない場合は、`codex_subscription_required` でスキップされます。
- デフォルトでは、移行はソース `app/list` を呼び出さないため、アカウントゲートを通過したアプリ連携 Plugin は、ソースアプリのアクセシビリティ検証なしで計画されます。また、アカウント検索のトランスポート失敗は `codex_account_unavailable` でスキップされます。
- `--verify-plugin-apps` を渡すと、新しいソース `app/list` スナップショットを強制し、ネイティブ有効化を計画する前に、所有するすべてのアプリが存在し、有効で、アクセス可能であることを要求します。このモードでは、アカウント検索のトランスポート失敗はソースアプリインベントリ検証にフォールスルーします。スナップショットは現在のプロセスのメモリにのみ保持され、移行出力やターゲット設定に書き込まれることはありません。

無効化された Plugin、読み取れない Plugin 詳細、サブスクリプションゲート付きのソースアカウント、そして (`--verify-plugin-apps` が設定されている場合) 存在しない、有効でない、またはアクセスできないアプリは、ターゲット設定エントリではなく、型付き理由を持つ手動スキップ項目になります。Apply は、ターゲットアプリサーバーがその Plugin をインストール済みかつ有効としてすでに報告している場合でも、選択された対象 Plugin ごとにアプリサーバー `plugin/install` を呼び出します。移行された Codex Plugin は、ネイティブ Codex ハーネスを選択するセッションでのみ使用できます。OpenClaw プロバイダー実行、ACP 会話バインディング、その他のハーネスには公開されません。

### 手動レビューの Codex 状態

Codex の `config.toml`、ネイティブ `hooks/hooks.json`、キュレートされていないマーケットプレイス、ソースにインストール済みのキュレート済み Plugin ではないキャッシュ済み Plugin バンドル、ソースサブスクリプションゲートに失敗したソースインストール済み Plugin は、自動的に有効化されません。`--verify-plugin-apps` が設定されている場合、ソースアプリインベントリゲートに失敗した Plugin もスキップされます。これらはすべて、手動レビューのために移行レポートにコピーまたは報告されます。

移行された、ソースにインストール済みのキュレート済み Plugin について、apply は次を書き込みます。

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- 選択された Plugin ごとに、`marketplaceName: "openai-curated"` と `pluginName` を持つ明示的な Plugin エントリ 1 つ

移行では `plugins["*"]` は決して書き込まず、ローカルマーケットプレイスキャッシュパスも保存しません。

スキップされたPluginはターゲット設定に書き込まれません。ソース側のサブスクリプション失敗は、手動項目で型付き理由として報告されます: `codex_subscription_required`、`codex_account_unavailable`、`plugin_disabled`、または `plugin_read_unavailable`。`--verify-plugin-apps` を指定すると、ソースのアプリインベントリ失敗も `app_inaccessible`、`app_disabled`、`app_missing`、または `app_inventory_unavailable` として表示される場合があります。ターゲット側で認証が必要なインストールは、影響を受けるPlugin項目に `status: "skipped"`、`reason: "auth_required"`、およびサニタイズされたアプリ識別子付きで報告されます。それらの明示的な設定エントリは、再認証して有効化するまで無効として書き込まれます。その他のインストール失敗は、項目スコープの `error` 結果です。

計画中に Codex アプリサーバーのPluginインベントリを利用できない場合、移行全体を失敗させるのではなく、キャッシュ済みバンドルの助言項目にフォールバックします。

## Hermes プロバイダー

バンドルされた Hermes プロバイダーは、デフォルトで `~/.hermes` の状態を検出します。Hermes が別の場所にある場合は `--from <path>` を使用します。

### Hermes がインポートするもの

- `config.yaml` からのデフォルトモデル設定。
- `providers` と `custom_providers` からの設定済みモデルプロバイダーとカスタム OpenAI 互換エンドポイント。
- `mcp_servers` または `mcp.servers` からの MCP サーバー定義。
- `SOUL.md` と `AGENTS.md` を OpenClaw エージェントワークスペースへ。
- `memories/MEMORY.md` と `memories/USER.md` をワークスペースメモリファイルに追記。
- OpenClaw ファイルメモリ用のメモリ設定デフォルト、および Honcho などの外部メモリプロバイダー向けのアーカイブ項目または手動レビュー項目。
- `skills/<name>/` 配下に `SKILL.md` ファイルを含む Skills。
- `skills.config` からのSkillsごとの設定値。
- 対話型の認証情報移行が承認された場合、または `--include-secrets` が設定されている場合は、OpenCode `auth.json` からの OpenCode OpenAI OAuth 認証情報。Hermes `auth.json` の OAuth エントリは、手動の OpenAI 再認証または doctor 修復のために報告されるレガシー状態です。
- 対話型の認証情報移行が承認された場合、または `--include-secrets` が設定されている場合は、Hermes `.env` と OpenCode `auth.json` からのサポート対象 API キーとトークン。

### サポート対象の `.env` キー

`AI_GATEWAY_API_KEY`, `ALIBABA_API_KEY`, `ANTHROPIC_API_KEY`, `ARCEEAI_API_KEY`, `CEREBRAS_API_KEY`, `CHUTES_API_KEY`, `CLOUDFLARE_AI_GATEWAY_API_KEY`, `COPILOT_GITHUB_TOKEN`, `DASHSCOPE_API_KEY`, `DEEPINFRA_API_KEY`, `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY`, `GEMINI_API_KEY`, `GH_TOKEN`, `GITHUB_TOKEN`, `GLM_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `HF_TOKEN`, `HUGGINGFACE_HUB_TOKEN`, `KILOCODE_API_KEY`, `KIMICODE_API_KEY`, `KIMI_API_KEY`, `MINIMAX_API_KEY`, `MINIMAX_CODING_API_KEY`, `MISTRAL_API_KEY`, `MODELSTUDIO_API_KEY`, `MOONSHOT_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `OPENCODE_API_KEY`, `OPENCODE_GO_API_KEY`, `OPENCODE_ZEN_API_KEY`, `OPENROUTER_API_KEY`, `QIANFAN_API_KEY`, `QWEN_API_KEY`, `TOGETHER_API_KEY`, `VENICE_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`, `ZAI_API_KEY`, `Z_AI_API_KEY`.

### アーカイブ専用状態

OpenClaw が安全に解釈できない Hermes の状態は、手動レビュー用に移行レポートへコピーされますが、ライブの OpenClaw 設定や認証情報には読み込まれません。これにより、不透明または安全でない状態を保持しつつ、OpenClaw がそれを自動的に実行または信頼できるかのように扱うことを避けます: `plugins/`、`sessions/`、`logs/`、`cron/`、`mcp-tokens/`、`state.db`。

### 適用後

```bash
openclaw doctor
```

## Plugin コントラクト

移行ソースはPluginです。Pluginは `openclaw.plugin.json` で自身のプロバイダー ID を宣言します:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

実行時にPluginは `api.registerMigrationProvider(...)` を呼び出します。プロバイダーは `detect`、`plan`、`apply` を実装します。コアは CLI オーケストレーション、バックアップポリシー、プロンプト、JSON 出力、競合の事前確認を所有します。コアはレビュー済みの計画を `apply(ctx, plan)` に渡し、プロバイダーは互換性のためにその引数がない場合に限り計画を再構築できます。

プロバイダーPluginは、項目構築とサマリー件数に `openclaw/plugin-sdk/migration` を使用でき、競合を考慮したファイルコピー、アーカイブ専用レポートコピー、キャッシュ済み設定ランタイムラッパー、移行レポートには `openclaw/plugin-sdk/migration-runtime` を使用できます。

## オンボーディング統合

プロバイダーが既知のソースを検出した場合、オンボーディングは移行を提示できます。`openclaw onboard --flow import` と `openclaw setup --wizard --import-from hermes` はどちらも同じPlugin移行プロバイダーを使用し、適用前に引き続きプレビューを表示します。

<Note>
オンボーディングインポートには、新規の OpenClaw セットアップが必要です。すでにローカル状態がある場合は、先に設定、認証情報、セッション、ワークスペースをリセットしてください。既存セットアップ向けのバックアップ付き上書きまたはマージインポートは、機能ゲートされています。
</Note>

## 関連

- [Hermes からの移行](/ja-JP/install/migrating-hermes): ユーザー向けウォークスルー。
- [Claude からの移行](/ja-JP/install/migrating-claude): ユーザー向けウォークスルー。
- [移行](/ja-JP/install/migrating): OpenClaw を新しいマシンへ移動する。
- [Doctor](/ja-JP/gateway/doctor): 移行適用後のヘルスチェック。
- [Plugins](/ja-JP/tools/plugin): Pluginのインストールと登録。

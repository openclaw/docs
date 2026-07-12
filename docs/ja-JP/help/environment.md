---
read_when:
    - どの環境変数がどの順序で読み込まれるかを把握する必要があります
    - Gateway で見つからない API キーをデバッグしています
    - プロバイダー認証またはデプロイ環境について文書化している場合
summary: OpenClaw が環境変数を読み込む場所と優先順位
title: 環境変数
x-i18n:
    generated_at: "2026-07-11T22:17:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e0010465008969ea1ebf7bb79d01ee86b7be20f7b6d0d90da72d8b0a3b1ed273
    source_path: help/environment.md
    workflow: 16
---

OpenClaw は複数のソースから環境変数を読み込みます。ルールは、**既存の値を上書きしない**ことです。
ワークスペースの `.env` ファイルは信頼度の低いソースです。OpenClaw は優先順位を適用する前に、ワークスペースの `.env` にあるプロバイダー認証情報と保護対象のランタイム制御を無視します。

## 優先順位（高い順）

1. **プロセス環境**（Gateway プロセスが親シェルまたはデーモンからすでに受け取っているもの）。
2. **現在の作業ディレクトリにある `.env`**（dotenv のデフォルト。上書きしません。プロバイダー認証情報と保護対象のランタイム制御は無視されます）。
3. **グローバル `.env`**（`~/.openclaw/.env`。別名 `$OPENCLAW_STATE_DIR/.env`。プロバイダー API キーに推奨。上書きしません）。
4. `~/.openclaw/openclaw.json` の**設定 `env` ブロック**（値がない場合にのみ適用）。
5. **任意のログインシェルインポート**（`env.shellEnv.enabled` または `OPENCLAW_LOAD_SHELL_ENV=1`）。想定されるキーがない場合にのみ適用。

デフォルトの状態ディレクトリを使用する Ubuntu の新規インストールでは、OpenClaw はグローバル `.env` の後に `~/.config/openclaw/gateway.env` も互換性フォールバックとして扱います。両方のファイルが存在し、値が一致しない場合、OpenClaw は `~/.openclaw/.env` の値を維持し、警告を表示します。

設定ファイル自体が存在しない場合、手順 4 はスキップされます。シェルインポートは有効であれば引き続き実行されます。

## プロバイダー認証情報とワークスペースの `.env`

プロバイダー API キーをワークスペースの `.env` だけに保存しないでください。OpenClaw は、ワークスペースの `.env` ファイルから多数のプロバイダー認証情報キーおよびエンドポイントリダイレクトキーをブロックします。これには、既知のすべてのプロバイダー認証環境変数（例: `GEMINI_API_KEY`、`GOOGLE_API_KEY`、`XAI_API_KEY`、`MISTRAL_API_KEY`、`GROQ_API_KEY`、`DEEPSEEK_API_KEY`、`PERPLEXITY_API_KEY`、`BRAVE_API_KEY`、`TAVILY_API_KEY`、`EXA_API_KEY`、`FIRECRAWL_API_KEY`）、末尾が `_API_HOST`、`_BASE_URL`、または `_HOMESERVER` のキー、および `OPENCLAW_*`、`CLAWHUB_*`、`ANTHROPIC_API_KEY_*`、`OPENAI_API_KEY_*` の各名前空間全体が含まれます。

代わりに、プロバイダー認証情報には次のいずれかの信頼できるソースを使用してください。

- シェル、launchd/systemd ユニット、コンテナシークレット、CI シークレットなどの Gateway プロセス環境。
- `~/.openclaw/.env` または `$OPENCLAW_STATE_DIR/.env` にあるグローバルランタイム dotenv ファイル。
- `~/.openclaw/openclaw.json` の設定 `env` ブロック。
- `env.shellEnv.enabled` または `OPENCLAW_LOAD_SHELL_ENV=1` が有効な場合の任意のログインシェルインポート。

以前、プロバイダーキーをワークスペースの `.env` だけに保存していた場合は、上記の信頼できるソースのいずれかに移動してください。ワークスペースの `.env` は、認証情報、エンドポイントリダイレクト、ホスト上書き、または `OPENCLAW_*` ランタイム制御ではない通常のプロジェクト変数には引き続き使用できます。

セキュリティ上の理由については、[ワークスペースの `.env` ファイル](/ja-JP/gateway/security#workspace-env-files)を参照してください。

## 設定 `env` ブロック

インライン環境変数を設定する同等の方法が 2 つあります（どちらも上書きしません）。

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

設定 `env` ブロックは、リテラル文字列値のみを受け付けます。
`file:...` 値は展開しません。たとえば、`XAI_API_KEY: "file:secrets/xai-api-key.txt"`
は、その文字列のままプロバイダーに渡されます。

ファイルに保存されたプロバイダーキーには、それをサポートする認証情報フィールドで SecretRef を使用してください。

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

サポートされるフィールドについては、[シークレット管理](/ja-JP/gateway/secrets)および
[SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)を参照してください。

## シェル環境のインポート

`env.shellEnv` はログインシェルを実行し、想定されるキーのうち**存在しない**ものだけをインポートします。

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

同等の環境変数:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`（デフォルト `15000`）

## exec シェルスナップショット

Windows 以外の Gateway ホストでは、bash および zsh の `exec` コマンドはデフォルトで起動時のスナップショットを使用します。
この経路を無効にするには、Gateway プロセス環境で `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` を設定します。
`false`、`no`、`off` でも無効になります。呼び出しごとの `exec.env` 値では、
スナップショットを切り替えたり、スナップショットキャッシュの保存先を変更したりできません。

## ランタイムによって注入される環境変数

OpenClaw は、生成した子プロセスにコンテキストマーカーも注入します。

- `OPENCLAW_SHELL=exec`: `exec` ツールを通じて実行されるコマンドに設定されます。
- `OPENCLAW_SHELL=acp-client`: `openclaw acp client` が ACP ブリッジプロセスを生成するときに設定されます。
- `OPENCLAW_SHELL=tui-local`: ローカル TUI の `!` シェルコマンドに設定されます。
- `OPENCLAW_CLI=1`: CLI エントリーポイントによって生成される子プロセスに設定されます。

これらはランタイムマーカーです（ユーザー設定には不要です）。シェルまたはプロファイルのロジックで使用し、
コンテキスト固有のルールを適用できます。

## UI 環境変数

- `OPENCLAW_THEME=light`: 端末の背景が明るい場合に、明るい TUI パレットを強制します。
- `OPENCLAW_THEME=dark`: 暗い TUI パレットを強制します。
- `COLORFGBG`: 端末がこれをエクスポートしている場合、OpenClaw は背景色のヒントを使用して TUI パレットを自動選択します。

## 設定内での環境変数置換

`${VAR_NAME}` 構文を使用して、設定の文字列値から環境変数を直接参照できます。

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

詳細については、[設定: 環境変数置換](/ja-JP/gateway/configuration-reference#env-var-substitution)を参照してください。

## シークレット参照と `${ENV}` 文字列

OpenClaw は、環境変数を利用する 2 つのパターンをサポートします。

- 設定値内での `${VAR}` 文字列置換。
- シークレット参照をサポートするフィールド向けの SecretRef オブジェクト（`{ source: "env", provider: "default", id: "VAR" }`）。

どちらも有効化時にプロセス環境から解決されます。SecretRef の詳細は[シークレット管理](/ja-JP/gateway/secrets)に記載されています。
設定 `env` ブロック自体は、SecretRef または `file:...`
省略記法の値を解決しません。

## パス関連の環境変数

| 変数                     | 用途                                                                                                                                                                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_HOME`          | OpenClaw 内部のパスデフォルト（`~/.openclaw/`、エージェントディレクトリ、セッション、認証情報、インストーラーのオンボーディング、デフォルトの開発チェックアウト）に使用するホームディレクトリを上書きします。OpenClaw を専用サービスユーザーとして実行する場合に便利です。 |
| `OPENCLAW_STATE_DIR`     | 状態ディレクトリを上書きします（デフォルトは `~/.openclaw`）。                                                                                                                                                                                                          |
| `OPENCLAW_CONFIG_PATH`   | 設定ファイルのパスを上書きします（デフォルトは `~/.openclaw/openclaw.json`）。                                                                                                                                                                                           |
| `OPENCLAW_INCLUDE_ROOTS` | `$include` ディレクティブが設定ディレクトリ外のファイルを解決できるディレクトリのパスリストです（デフォルト: なし - `$include` は設定ディレクトリ内に制限されます）。チルダは展開されます。                                                                                 |

## ログ

| 変数                             | 用途                                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_LOG_LEVEL`             | ファイルとコンソールの両方のログレベルを上書きします（例: `debug`、`trace`）。設定の `logging.level` および `logging.consoleLevel` より優先されます。無効な値は警告とともに無視されます。 |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | グローバルデバッグログを有効にせず、対象を絞ったモデルのリクエスト／レスポンスのタイミング診断を `info` レベルで出力します。                                                                                              |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | モデルペイロード診断: `summary`、`tools`、または `full-redacted`。`full-redacted` はサイズ制限と秘匿化が適用されますが、プロンプト／メッセージテキストを含む場合があります。                                                 |
| `OPENCLAW_DEBUG_SSE`             | ストリーミング診断: 最初と完了のタイミングには `events`、秘匿化された最初の 5 件の SSE イベントを含めるには `peek` を使用します。                                                                                          |
| `OPENCLAW_DEBUG_CODE_MODE`       | プロバイダーツールの非表示や、コンパクト制御／直接強制を含む、コードモードのモデルサーフェス診断です。                                                                                                                   |

### `OPENCLAW_HOME`

設定すると、`OPENCLAW_HOME` は OpenClaw 内部のパスデフォルトで、システムのホームディレクトリ（`$HOME` / `os.homedir()`）を置き換えます。これには、デフォルトの状態ディレクトリ、設定パス、エージェントディレクトリ、認証情報、インストーラーのオンボーディング用ワークスペース、および `openclaw update --channel dev` が使用するデフォルトの開発チェックアウトが含まれます。

**優先順位:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > Android 上の Termux `PREFIX` ホームフォールバック > `os.homedir()`

**例**（macOS LaunchDaemon）:

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` にはチルダパス（例: `~/svc`）も設定でき、使用前に同じ OS ホームフォールバックチェーンを使って展開されます。

`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_GIT_DIR` などの明示的なパス変数は引き続き優先されます。シェル起動ファイルの検出、パッケージマネージャーのセットアップ、ホストでの `~` 展開など、OS アカウントに関する処理では、引き続き実際のシステムホームが使用される場合があります。

## nvm ユーザー: web_fetch の TLS エラー

Node.js がシステムのパッケージマネージャーではなく **nvm** 経由でインストールされている場合、組み込みの `fetch()` は
nvm に同梱された CA ストアを使用します。このストアには、最新のルート CA（Let's Encrypt の ISRG Root X1/X2、
DigiCert Global Root G2 など）が含まれていない場合があります。その結果、ほとんどの HTTPS サイトで `web_fetch` が `"fetch failed"` エラーになります。

Linux では、OpenClaw が nvm を自動的に検出し、実際の起動環境に修正を適用します。

- `openclaw gateway install` は systemd サービス環境に `NODE_EXTRA_CA_CERTS` を書き込みます
- `openclaw` CLI エントリーポイントは、Node の起動前に `NODE_EXTRA_CA_CERTS` を設定して自身を再実行します

**手動修正（古いバージョンまたは `node ...` を直接起動する場合）:**

OpenClaw を起動する前に変数をエクスポートします。

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

この変数については、`~/.openclaw/.env` だけに書き込む方法に依存しないでください。Node は
プロセス起動時に `NODE_EXTRA_CA_CERTS` を読み取ります。

## レガシー環境変数

OpenClaw は `OPENCLAW_*` 環境変数のみを読み取ります。以前のリリースで使用されていた
`CLAWDBOT_*` および `MOLTBOT_*` プレフィックスは通知なく
無視されます。

Gateway プロセスの起動時にこれらのいずれかがまだ設定されている場合、OpenClaw は
検出されたプレフィックスと合計数を一覧にした単一の Node 非推奨警告（`OPENCLAW_LEGACY_ENV_VARS`）を
出力します。各値のレガシープレフィックスを `OPENCLAW_` に置き換えて名前を変更してください（例: `CLAWDBOT_GATEWAY_TOKEN` から
`OPENCLAW_GATEWAY_TOKEN`）。古い名前は効果を持ちません。

## 関連項目

- [Gateway の設定](/ja-JP/gateway/configuration)
- [FAQ: 環境変数と .env の読み込み](/ja-JP/help/faq#env-vars-and-env-loading)
- [モデルの概要](/ja-JP/concepts/models)

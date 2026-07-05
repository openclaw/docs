---
read_when:
    - どの環境変数がどの順序で読み込まれるかを把握する必要があります
    - Gateway で見つからない API キーをデバッグしています
    - OpenClaw Docs I18n Input をドキュメント化しています
summary: OpenClaw が環境変数を読み込む場所と優先順位
title: 環境変数
x-i18n:
    generated_at: "2026-07-05T11:26:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5b5b3b94d314018fe31c21b5de4e9c1e09df3787287a0609afb1ae32ae3f010
    source_path: help/environment.md
    workflow: 16
---

OpenClaw は複数のソースから環境変数を読み込みます。ルールは**既存の値を上書きしない**ことです。
ワークスペースの `.env` ファイルは信頼度の低いソースです。OpenClaw は優先順位を適用する前に、ワークスペースの `.env` に含まれるプロバイダー認証情報と保護されたランタイム制御を無視します。

## 優先順位（高い順）

1. **プロセス環境**（Gateway プロセスが親シェル/デーモンからすでに持っているもの）。
2. **現在の作業ディレクトリの `.env`**（dotenv のデフォルト。上書きしません。プロバイダー認証情報と保護されたランタイム制御は無視されます）。
3. **グローバル `.env`**（`~/.openclaw/.env`、別名 `$OPENCLAW_STATE_DIR/.env`。プロバイダー API キーに推奨。上書きしません）。
4. **`~/.openclaw/openclaw.json` の設定 `env` ブロック**（存在しない場合のみ適用）。
5. **任意のログインシェルインポート**（`env.shellEnv.enabled` または `OPENCLAW_LOAD_SHELL_ENV=1`）。存在しない想定キーにのみ適用されます。

デフォルトの状態ディレクトリを使う新規 Ubuntu インストールでは、OpenClaw はグローバル `.env` の後の互換性フォールバックとして `~/.config/openclaw/gateway.env` も扱います。両方のファイルが存在し内容が異なる場合、OpenClaw は `~/.openclaw/.env` を保持し、警告を出力します。

設定ファイルが完全に存在しない場合、ステップ 4 はスキップされます。シェルインポートは有効であれば引き続き実行されます。

## プロバイダー認証情報とワークスペース `.env`

プロバイダー API キーをワークスペースの `.env` だけに保存しないでください。OpenClaw は、既知のすべてのプロバイダー認証環境変数（例: `GEMINI_API_KEY`、`GOOGLE_API_KEY`、`XAI_API_KEY`、`MISTRAL_API_KEY`、`GROQ_API_KEY`、`DEEPSEEK_API_KEY`、`PERPLEXITY_API_KEY`、`BRAVE_API_KEY`、`TAVILY_API_KEY`、`EXA_API_KEY`、`FIRECRAWL_API_KEY`）を含む、プロバイダー認証情報とエンドポイントリダイレクトキーの大きな集合をワークスペース `.env` ファイルからブロックします。さらに、`_API_HOST`、`_BASE_URL`、または `_HOMESERVER` で終わるキー、および `OPENCLAW_*`、`CLAWHUB_*`、`ANTHROPIC_API_KEY_*`、`OPENAI_API_KEY_*` 名前空間全体も対象です。

代わりに、プロバイダー認証情報には次のいずれかの信頼済みソースを使用してください。

- シェル、launchd/systemd ユニット、コンテナーシークレット、CI シークレットなどの Gateway プロセス環境。
- `~/.openclaw/.env` または `$OPENCLAW_STATE_DIR/.env` にあるグローバルランタイム dotenv ファイル。
- `~/.openclaw/openclaw.json` の設定 `env` ブロック。
- `env.shellEnv.enabled` または `OPENCLAW_LOAD_SHELL_ENV=1` が有効な場合の任意のログインシェルインポート。

以前にプロバイダーキーをワークスペース `.env` だけに保存していた場合は、上記の信頼済みソースのいずれかに移動してください。ワークスペース `.env` は、認証情報、エンドポイントリダイレクト、ホスト上書き、または `OPENCLAW_*` ランタイム制御ではない通常のプロジェクト変数を引き続き提供できます。

セキュリティ上の理由については、[ワークスペース `.env` ファイル](/ja-JP/gateway/security#workspace-env-files)を参照してください。

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

設定 `env` ブロックはリテラル文字列値のみを受け付けます。
`file:...` 値は展開しません。たとえば、`XAI_API_KEY: "file:secrets/xai-api-key.txt"` は、その正確な文字列としてプロバイダーに渡されます。

ファイルに基づくプロバイダーキーには、それをサポートする認証情報フィールドで SecretRef を使用してください。

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

サポートされるフィールドについては、[シークレット管理](/ja-JP/gateway/secrets)と
[SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)を参照してください。

## シェル環境インポート

`env.shellEnv` はログインシェルを実行し、**存在しない**想定キーのみをインポートします。

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

## Exec シェルスナップショット

Windows 以外の Gateway ホストでは、bash と zsh の `exec` コマンドはデフォルトで起動時スナップショットを使用します。
この経路を無効にするには、Gateway プロセス環境で `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` を設定してください。
値 `false`、`no`、`off` でも無効になります。呼び出しごとの `exec.env` 値では、スナップショットを切り替えたり、スナップショットキャッシュをリダイレクトしたりできません。

## ランタイムが注入する環境変数

OpenClaw は生成される子プロセスにもコンテキストマーカーを注入します。

- `OPENCLAW_SHELL=exec`: `exec` ツールを通じて実行されるコマンドに設定されます。
- `OPENCLAW_SHELL=acp-client`: `openclaw acp client` が ACP ブリッジプロセスを生成するときに設定されます。
- `OPENCLAW_SHELL=tui-local`: ローカル TUI の `!` シェルコマンドに設定されます。
- `OPENCLAW_CLI=1`: CLI エントリーポイントによって生成される子プロセスに設定されます。

これらはランタイムマーカーです（必須のユーザー設定ではありません）。シェル/プロファイルのロジックで、コンテキスト固有のルールを適用するために使用できます。

## UI 環境変数

- `OPENCLAW_THEME=light`: ターミナルの背景が明るい場合に、明るい TUI パレットを強制します。
- `OPENCLAW_THEME=dark`: 暗い TUI パレットを強制します。
- `COLORFGBG`: ターミナルがこれをエクスポートしている場合、OpenClaw は背景色のヒントを使用して TUI パレットを自動選択します。

## 設定内の環境変数置換

`${VAR_NAME}` 構文を使用して、設定文字列値内で環境変数を直接参照できます。

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

詳細は、[設定: 環境変数置換](/ja-JP/gateway/configuration-reference#env-var-substitution)を参照してください。

## シークレット参照と `${ENV}` 文字列

OpenClaw は環境変数駆動のパターンを 2 つサポートしています。

- 設定値内の `${VAR}` 文字列置換。
- シークレット参照をサポートするフィールド向けの SecretRef オブジェクト（`{ source: "env", provider: "default", id: "VAR" }`）。

どちらも有効化時にプロセス環境から解決されます。SecretRef の詳細は[シークレット管理](/ja-JP/gateway/secrets)に記載されています。
設定 `env` ブロック自体は SecretRefs や `file:...` 省略値を解決しません。

## パス関連の環境変数

| 変数                     | 目的                                                                                                                                                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | OpenClaw 内部のパス既定値（`~/.openclaw/`、エージェントディレクトリ、セッション、認証情報、インストーラーのオンボーディング、デフォルトの開発チェックアウト）に使うホームディレクトリを上書きします。専用サービスユーザーとして OpenClaw を実行する場合に便利です。 |
| `OPENCLAW_STATE_DIR`     | 状態ディレクトリを上書きします（デフォルト `~/.openclaw`）。                                                                                                                                                                                   |
| `OPENCLAW_CONFIG_PATH`   | 設定ファイルのパスを上書きします（デフォルト `~/.openclaw/openclaw.json`）。                                                                                                                                                                    |
| `OPENCLAW_INCLUDE_ROOTS` | `$include` ディレクティブが設定ディレクトリ外のファイルを解決できるディレクトリのパスリストです（デフォルト: なし - `$include` は設定ディレクトリに限定されます）。チルダ展開されます。                                                         |

## ログ

| 変数                             | 目的                                                                                                                                                                                                        |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | ファイルとコンソールの両方のログレベルを上書きします（例: `debug`、`trace`）。設定内の `logging.level` と `logging.consoleLevel` より優先されます。無効な値は警告付きで無視されます。                       |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | グローバルなデバッグログを有効にせずに、対象を絞ったモデルリクエスト/レスポンスのタイミング診断を `info` レベルで出力します。                                                                              |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | モデルペイロード診断: `summary`、`tools`、または `full-redacted`。`full-redacted` は上限付きで秘匿化されますが、プロンプト/メッセージテキストを含む場合があります。                                       |
| `OPENCLAW_DEBUG_SSE`             | ストリーミング診断: 開始/完了タイミングには `events`、秘匿化された最初の 5 件の SSE イベントを含めるには `peek`。                                                                                           |
| `OPENCLAW_DEBUG_CODE_MODE`       | プロバイダーツールの非表示や exec/wait のみの強制を含む、コードモードのモデルサーフェス診断。                                                                                                               |

### `OPENCLAW_HOME`

設定すると、`OPENCLAW_HOME` は OpenClaw 内部のパス既定値に対してシステムのホームディレクトリ（`$HOME` / `os.homedir()`）を置き換えます。これには、デフォルトの状態ディレクトリ、設定パス、エージェントディレクトリ、認証情報、インストーラーのオンボーディングワークスペース、および `openclaw update --channel dev` で使用されるデフォルトの開発チェックアウトが含まれます。

**優先順位:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > Android 上の Termux `PREFIX` ホームフォールバック > `os.homedir()`

**例**（macOS LaunchDaemon）:

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` はチルダパス（例: `~/svc`）にも設定でき、使用前に同じ OS ホームフォールバックチェーンを使って展開されます。

`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_GIT_DIR` などの明示的なパス変数は引き続き優先されます。シェル起動ファイルの検出、パッケージマネージャーのセットアップ、ホストの `~` 展開などの OS アカウントタスクは、引き続き実際のシステムホームを使用する場合があります。

## nvm ユーザー: web_fetch の TLS 失敗

Node.js が**nvm**（システムパッケージマネージャーではない）経由でインストールされている場合、組み込みの `fetch()` は nvm にバンドルされた CA ストアを使用します。このストアには最新のルート CA（Let's Encrypt 用の ISRG Root X1/X2、DigiCert Global Root G2 など）が含まれていない場合があります。これにより、ほとんどの HTTPS サイトで `web_fetch` が `"fetch failed"` で失敗します。

Linux では、OpenClaw は nvm を自動検出し、実際の起動環境で修正を適用します。

- `openclaw gateway install` は systemd サービス環境に `NODE_EXTRA_CA_CERTS` を書き込みます
- `openclaw` CLI エントリーポイントは、Node 起動前に `NODE_EXTRA_CA_CERTS` を設定して自分自身を再実行します

**手動修正（古いバージョンまたは直接 `node ...` を起動する場合）:**

OpenClaw を起動する前に変数をエクスポートします。

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

この変数については、`~/.openclaw/.env` だけに書き込むことに依存しないでください。Node はプロセス起動時に `NODE_EXTRA_CA_CERTS` を読み取ります。

## レガシー環境変数

OpenClaw は `OPENCLAW_*` 環境変数のみを読み取ります。以前のリリースからのレガシーな
`CLAWDBOT_*` および `MOLTBOT_*` プレフィックスは暗黙的に無視されます。

起動時に Gateway プロセスにまだ設定されているものがある場合、OpenClaw は検出されたプレフィックスと合計数を一覧する単一の Node 非推奨警告（`OPENCLAW_LEGACY_ENV_VARS`）を出力します。各値は、レガシープレフィックスを `OPENCLAW_` に置き換えて名前を変更してください（例: `CLAWDBOT_GATEWAY_TOKEN` から `OPENCLAW_GATEWAY_TOKEN`）。古い名前は効果を持ちません。

## 関連

- [Gateway 設定](/ja-JP/gateway/configuration)
- [FAQ: 環境変数と .env 読み込み](/ja-JP/help/faq#env-vars-and-env-loading)
- [モデル概要](/ja-JP/concepts/models)

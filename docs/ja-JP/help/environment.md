---
read_when:
    - どの環境変数がどの順序で読み込まれるかを把握する必要があります
    - GatewayでAPIキーが見つからない問題をデバッグしています
    - プロバイダー認証またはデプロイ環境を文書化する場合
summary: OpenClaw が環境変数を読み込む場所と優先順位
title: 環境変数
x-i18n:
    generated_at: "2026-04-30T05:17:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: d19b9053207a088b3eb39d03e36fc2d415295feb80da51bd71339884466b101b
    source_path: help/environment.md
    workflow: 16
---

OpenClaw は複数のソースから環境変数を取得します。ルールは**既存の値を絶対に上書きしない**ことです。

## 優先順位（高 → 低）

1. **プロセス環境**（Gateway プロセスが親シェル/デーモンからすでに持っているもの）。
2. **現在の作業ディレクトリの `.env`**（dotenv のデフォルト。上書きしません）。
3. **グローバル `.env`**（`~/.openclaw/.env`、別名 `$OPENCLAW_STATE_DIR/.env`。上書きしません）。
4. **`~/.openclaw/openclaw.json` の設定 `env` ブロック**（欠けている場合のみ適用）。
5. **任意のログインシェルインポート**（`env.shellEnv.enabled` または `OPENCLAW_LOAD_SHELL_ENV=1`）。欠けている想定キーにのみ適用されます。

デフォルトの状態ディレクトリを使う Ubuntu の新規インストールでは、OpenClaw はグローバル `.env` の後に互換性フォールバックとして `~/.config/openclaw/gateway.env` も扱います。両方のファイルが存在して内容が一致しない場合、OpenClaw は `~/.openclaw/.env` を保持し、警告を出力します。

設定ファイルが完全に存在しない場合、手順 4 はスキップされます。シェルインポートは、有効化されていれば引き続き実行されます。

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

## シェル環境のインポート

`env.shellEnv` はログインシェルを実行し、**欠けている**想定キーのみをインポートします。

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

環境変数での同等指定:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## ランタイムで注入される環境変数

OpenClaw は生成した子プロセスにもコンテキストマーカーを注入します。

- `OPENCLAW_SHELL=exec`: `exec` ツール経由で実行されるコマンドに設定されます。
- `OPENCLAW_SHELL=acp`: ACP ランタイムバックエンドプロセスの生成時に設定されます（例: `acpx`）。
- `OPENCLAW_SHELL=acp-client`: `openclaw acp client` が ACP ブリッジプロセスを生成するときに設定されます。
- `OPENCLAW_SHELL=tui-local`: ローカル TUI の `!` シェルコマンドに設定されます。

これらはランタイムマーカーです（ユーザー設定として必須ではありません）。シェル/プロファイルのロジックで使用して、コンテキスト固有のルールを適用できます。

## UI 環境変数

- `OPENCLAW_THEME=light`: 端末の背景が明るい場合に、明るい TUI パレットを強制します。
- `OPENCLAW_THEME=dark`: 暗い TUI パレットを強制します。
- `COLORFGBG`: 端末がこれをエクスポートしている場合、OpenClaw は背景色のヒントを使って TUI パレットを自動選択します。

## 設定内の環境変数置換

`${VAR_NAME}` 構文を使って、設定の文字列値内で環境変数を直接参照できます。

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

詳細は [設定: 環境変数置換](/ja-JP/gateway/configuration-reference#env-var-substitution) を参照してください。

## シークレット参照と `${ENV}` 文字列

OpenClaw は環境変数駆動のパターンを 2 つサポートします。

- 設定値内の `${VAR}` 文字列置換。
- シークレット参照をサポートするフィールド向けの SecretRef オブジェクト（`{ source: "env", provider: "default", id: "VAR" }`）。

どちらも有効化時にプロセス環境から解決されます。SecretRef の詳細は [シークレット管理](/ja-JP/gateway/secrets) に記載されています。

## パス関連の環境変数

| 変数                   | 目的                                                                                                                                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`        | すべての内部パス解決（`~/.openclaw/`、エージェントディレクトリ、セッション、認証情報）に使うホームディレクトリを上書きします。OpenClaw を専用サービスユーザーとして実行する場合に便利です。 |
| `OPENCLAW_STATE_DIR`   | 状態ディレクトリを上書きします（デフォルトは `~/.openclaw`）。                                                                                                                                    |
| `OPENCLAW_CONFIG_PATH` | 設定ファイルのパスを上書きします（デフォルトは `~/.openclaw/openclaw.json`）。                                                                                                                     |

## ログ

| 変数                 | 目的                                                                                                                                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | ファイルとコンソールの両方のログレベルを上書きします（例: `debug`、`trace`）。設定内の `logging.level` と `logging.consoleLevel` より優先されます。無効な値は警告付きで無視されます。 |

### `OPENCLAW_HOME`

設定されている場合、`OPENCLAW_HOME` はすべての内部パス解決でシステムのホームディレクトリ（`$HOME` / `os.homedir()`）を置き換えます。これにより、ヘッドレスサービスアカウントで完全なファイルシステム分離が可能になります。

**優先順位:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**例**（macOS LaunchDaemon）:

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` にはチルダパス（例: `~/svc`）も設定できます。この場合、使用前に `$HOME` を使って展開されます。

## nvm ユーザー: web_fetch TLS 失敗

Node.js が（システムのパッケージマネージャーではなく）**nvm** 経由でインストールされている場合、組み込みの `fetch()` は nvm に同梱された CA ストアを使用します。このストアには、モダンなルート CA（Let's Encrypt の ISRG Root X1/X2、DigiCert Global Root G2 など）が欠けている場合があります。これにより、ほとんどの HTTPS サイトで `web_fetch` が `"fetch failed"` により失敗します。

Linux では、OpenClaw は nvm を自動検出し、実際の起動環境に修正を適用します。

- `openclaw gateway install` は systemd サービス環境に `NODE_EXTRA_CA_CERTS` を書き込みます
- `openclaw` CLI エントリポイントは、Node 起動前に `NODE_EXTRA_CA_CERTS` を設定した状態で自身を再実行します

**手動修正（古いバージョンまたは直接の `node ...` 起動向け）:**

OpenClaw を起動する前に変数をエクスポートします。

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

この変数については、`~/.openclaw/.env` だけに書き込むことに依存しないでください。Node はプロセス起動時に `NODE_EXTRA_CA_CERTS` を読み取ります。

## レガシー環境変数

OpenClaw は `OPENCLAW_*` 環境変数のみを読み取ります。以前のリリースで使われていたレガシーな `CLAWDBOT_*` と `MOLTBOT_*` プレフィックスは、黙って無視されます。

Gateway プロセスの起動時にそれらがまだ設定されている場合、OpenClaw は検出したプレフィックスと合計数を示す単一の Node 非推奨警告（`OPENCLAW_LEGACY_ENV_VARS`）を出力します。各値は、レガシープレフィックスを `OPENCLAW_` に置き換えて名前変更してください（例: `CLAWDBOT_GATEWAY_TOKEN` → `OPENCLAW_GATEWAY_TOKEN`）。古い名前は効果を持ちません。

## 関連

- [Gateway 設定](/ja-JP/gateway/configuration)
- [FAQ: 環境変数と .env の読み込み](/ja-JP/help/faq#env-vars-and-env-loading)
- [モデル概要](/ja-JP/concepts/models)

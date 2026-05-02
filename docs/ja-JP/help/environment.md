---
read_when:
    - どの環境変数がどの順序で読み込まれるかを把握しておく必要があります
    - Gatewayで見つからない API キーをデバッグしています
    - プロバイダー認証またはデプロイ環境について文書化している
summary: OpenClaw が環境変数を読み込む場所と優先順位
title: 環境変数
x-i18n:
    generated_at: "2026-05-02T04:57:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 66787dd6f87dcaf81f721465e88dda519421b1a598179f71bce0239bb4791c46
    source_path: help/environment.md
    workflow: 16
---

OpenClaw は複数のソースから環境変数を取得します。ルールは **既存の値を決して上書きしない** ことです。

## 優先順位（最高 → 最低）

1. **プロセス環境**（Gateway プロセスが親シェル/デーモンからすでに受け取っているもの）。
2. **現在の作業ディレクトリの `.env`**（dotenv のデフォルト。上書きしません）。
3. **グローバル `.env`**（`~/.openclaw/.env`、別名 `$OPENCLAW_STATE_DIR/.env`。上書きしません）。
4. **`~/.openclaw/openclaw.json` の設定 `env` ブロック**（不足している場合のみ適用）。
5. **任意のログインシェルインポート**（`env.shellEnv.enabled` または `OPENCLAW_LOAD_SHELL_ENV=1`）。不足している想定キーにのみ適用されます。

デフォルトの状態ディレクトリを使う Ubuntu の新規インストールでは、OpenClaw はグローバル `.env` の後の互換性フォールバックとして `~/.config/openclaw/gateway.env` も扱います。両方のファイルが存在し内容が食い違う場合、OpenClaw は `~/.openclaw/.env` を保持し、警告を出力します。

設定ファイルが完全に存在しない場合、ステップ 4 はスキップされます。シェルインポートは有効なら引き続き実行されます。

## 設定 `env` ブロック

インライン環境変数を設定する同等の方法は 2 つあります（どちらも上書きしません）。

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

`env.shellEnv` はログインシェルを実行し、**不足している**想定キーのみをインポートします。

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

## 実行時に注入される環境変数

OpenClaw は生成された子プロセスにもコンテキストマーカーを注入します。

- `OPENCLAW_SHELL=exec`: `exec` ツール経由で実行されるコマンドに設定されます。
- `OPENCLAW_SHELL=acp`: ACP ランタイムバックエンドプロセスの生成時（例: `acpx`）に設定されます。
- `OPENCLAW_SHELL=acp-client`: `openclaw acp client` が ACP ブリッジプロセスを生成するときに設定されます。
- `OPENCLAW_SHELL=tui-local`: ローカル TUI の `!` シェルコマンドに設定されます。

これらは実行時マーカーです（ユーザー設定としては不要です）。シェル/プロファイルのロジックで、コンテキスト固有のルールを適用するために使用できます。

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

OpenClaw は、環境変数を使う 2 つのパターンをサポートします。

- 設定値内の `${VAR}` 文字列置換。
- シークレット参照をサポートするフィールド向けの SecretRef オブジェクト（`{ source: "env", provider: "default", id: "VAR" }`）。

どちらもアクティベーション時にプロセス環境から解決されます。SecretRef の詳細は [シークレット管理](/ja-JP/gateway/secrets) に記載されています。

## パス関連の環境変数

| 変数                     | 目的                                                                                                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_HOME`          | すべての内部パス解決（`~/.openclaw/`、エージェントディレクトリ、セッション、認証情報）で使うホームディレクトリを上書きします。OpenClaw を専用サービスユーザーとして実行する場合に便利です。 |
| `OPENCLAW_STATE_DIR`     | 状態ディレクトリを上書きします（デフォルトは `~/.openclaw`）。                                                                                                                                              |
| `OPENCLAW_CONFIG_PATH`   | 設定ファイルパスを上書きします（デフォルトは `~/.openclaw/openclaw.json`）。                                                                                                                                 |
| `OPENCLAW_INCLUDE_ROOTS` | `$include` ディレクティブが設定ディレクトリの外にあるファイルを解決できるディレクトリのパスリストです（デフォルト: なし — `$include` は設定ディレクトリ内に限定されます）。チルダ展開されます。 |

## ログ

| 変数                 | 目的                                                                                                                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | ファイルとコンソールの両方のログレベルを上書きします（例: `debug`、`trace`）。設定内の `logging.level` と `logging.consoleLevel` より優先されます。無効な値は警告付きで無視されます。 |

### `OPENCLAW_HOME`

設定すると、`OPENCLAW_HOME` はすべての内部パス解決でシステムのホームディレクトリ（`$HOME` / `os.homedir()`）を置き換えます。これにより、ヘッドレスサービスアカウント向けにファイルシステムを完全に分離できます。

**優先順位:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**例**（macOS LaunchDaemon）:

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` にはチルダパス（例: `~/svc`）も設定でき、使用前に `$HOME` を使って展開されます。

## nvm ユーザー: web_fetch の TLS 失敗

Node.js が（システムのパッケージマネージャーではなく）**nvm** 経由でインストールされている場合、組み込みの `fetch()` は nvm に同梱された CA ストアを使います。このストアには、最新のルート CA（Let's Encrypt の ISRG Root X1/X2、DigiCert Global Root G2 など）が欠けている場合があります。その結果、多くの HTTPS サイトで `web_fetch` が `"fetch failed"` により失敗します。

Linux では、OpenClaw が nvm を自動検出し、実際の起動環境に修正を適用します。

- `openclaw gateway install` は systemd サービス環境に `NODE_EXTRA_CA_CERTS` を書き込みます
- `openclaw` CLI エントリポイントは、Node 起動前に `NODE_EXTRA_CA_CERTS` を設定した状態で自分自身を再実行します

**手動修正（古いバージョンまたは直接の `node ...` 起動向け）:**

OpenClaw を起動する前に変数をエクスポートします。

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

この変数については、`~/.openclaw/.env` への書き込みだけに依存しないでください。Node はプロセス起動時に `NODE_EXTRA_CA_CERTS` を読み取ります。

## レガシー環境変数

OpenClaw は `OPENCLAW_*` 環境変数のみを読み取ります。以前のリリースで使われていたレガシーな `CLAWDBOT_*` と `MOLTBOT_*` のプレフィックスは、黙って無視されます。

起動時に Gateway プロセス上でまだ設定されているものがある場合、OpenClaw は検出されたプレフィックスと合計数を列挙する単一の Node 非推奨警告（`OPENCLAW_LEGACY_ENV_VARS`）を出します。各値は、レガシープレフィックスを `OPENCLAW_` に置き換えて名前を変更してください（例: `CLAWDBOT_GATEWAY_TOKEN` → `OPENCLAW_GATEWAY_TOKEN`）。古い名前は効果を持ちません。

## 関連

- [Gateway 設定](/ja-JP/gateway/configuration)
- [FAQ: 環境変数と .env の読み込み](/ja-JP/help/faq#env-vars-and-env-loading)
- [モデル概要](/ja-JP/concepts/models)

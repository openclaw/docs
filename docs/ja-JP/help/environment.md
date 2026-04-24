---
read_when:
    - どのenv varが読み込まれ、どの順序で適用されるかを知る必要がある場合
    - Gatewayで不足しているAPI keyをデバッグしている場合
    - プロバイダーauthやデプロイ環境を文書化している場合
summary: OpenClawが環境変数を読み込む場所と優先順位
title: 環境変数
x-i18n:
    generated_at: "2026-04-24T05:00:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: b0538e07cc2f785224b5f061bdaee982c4c849838e9d637defcc86a5121710df
    source_path: help/environment.md
    workflow: 15
---

OpenClawは複数のソースから環境変数を取り込みます。ルールは**既存の値を決して上書きしない**ことです。

## 優先順位（高 → 低）

1. **プロセス環境**（Gateway processが親shell/daemonからすでに持っているもの）。
2. **現在の作業ディレクトリの `.env`**（dotenvデフォルト。上書きしない）。
3. **グローバル `.env`** の `~/.openclaw/.env`（別名 `$OPENCLAW_STATE_DIR/.env`; 上書きしない）。
4. **configの `env` ブロック**（`~/.openclaw/openclaw.json` 内。欠けている場合にのみ適用）。
5. **任意のlogin-shell import**（`env.shellEnv.enabled` または `OPENCLAW_LOAD_SHELL_ENV=1`）。期待されるキーが欠けている場合にのみ適用。

Ubuntuの新規インストールでデフォルトstate dirを使う場合、OpenClawはグローバル `.env` の後に `~/.config/openclaw/gateway.env` も互換フォールバックとして扱います。両方のファイルが存在して内容が異なる場合、OpenClawは `~/.openclaw/.env` を保持し、警告を表示します。

config file自体が完全に存在しない場合、手順4はスキップされます。shell importは有効なら引き続き実行されます。

## configの `env` ブロック

インラインenv varを設定する等価な方法が2つあります（どちらも上書きしません）:

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

## Shell env import

`env.shellEnv` はlogin shellを実行し、期待されるキーのうち**不足しているものだけ**をimportします:

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

対応するenv var:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## ランタイム注入されるenv var

OpenClawは、起動する子processにコンテキストマーカーも注入します:

- `OPENCLAW_SHELL=exec`: `exec` ツール経由で実行されるコマンドに設定されます。
- `OPENCLAW_SHELL=acp`: ACPランタイムバックエンドprocess spawn（例: `acpx`）に設定されます。
- `OPENCLAW_SHELL=acp-client`: `openclaw acp client` がACPブリッジprocessを起動するときに設定されます。
- `OPENCLAW_SHELL=tui-local`: ローカルTUIの `!` shellコマンドに設定されます。

これらはランタイムマーカーです（ユーザー設定必須ではありません）。shell/profileロジック内で、
コンテキスト固有ルールを適用するために使えます。

## UI env var

- `OPENCLAW_THEME=light`: terminal背景が明るい場合に、light TUI paletteを強制します。
- `OPENCLAW_THEME=dark`: dark TUI paletteを強制します。
- `COLORFGBG`: terminalがこれをexportしていれば、OpenClawは背景色ヒントを使ってTUI paletteを自動選択します。

## config内のenv var置換

`${VAR_NAME}` 構文を使うと、configの文字列値でenv varを直接参照できます:

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

詳細は [Configuration: Env var substitution](/ja-JP/gateway/configuration-reference#env-var-substitution) を参照してください。

## Secret ref と `${ENV}` 文字列

OpenClawは2つのenv駆動パターンをサポートします:

- config値内の `${VAR}` 文字列置換
- secrets参照をサポートするfield向けのSecretRefオブジェクト（`{ source: "env", provider: "default", id: "VAR" }`）

どちらもactivation時にprocess envから解決されます。SecretRefの詳細は [Secrets Management](/ja-JP/gateway/secrets) にあります。

## パス関連env var

| 変数                   | 目的                                                                                                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`        | すべての内部パス解決に使うホームディレクトリを上書きします（`~/.openclaw/`, agent dir, session, credential）。OpenClawを専用service userとして実行する場合に有用です。                  |
| `OPENCLAW_STATE_DIR`   | state directoryを上書きします（デフォルト `~/.openclaw`）。                                                                                                                               |
| `OPENCLAW_CONFIG_PATH` | config file pathを上書きします（デフォルト `~/.openclaw/openclaw.json`）。                                                                                                                |

## ログ

| 変数                 | 目的                                                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | ファイルとコンソール両方のログレベルを上書きします（例: `debug`, `trace`）。config内の `logging.level` および `logging.consoleLevel` より優先されます。無効な値は警告付きで無視されます。 |

### `OPENCLAW_HOME`

設定されている場合、`OPENCLAW_HOME` はすべての内部パス解決において、システムのホームディレクトリ（`$HOME` / `os.homedir()`）を置き換えます。これにより、ヘッドレスservice account向けの完全なfilesystem分離が可能になります。

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

## nvmユーザー: `web_fetch` TLS failure

Node.jsを**nvm** 経由でインストールした場合（システムパッケージマネージャー経由ではない場合）、組み込みの `fetch()` は
nvmに同梱されたCA storeを使います。そこには現代的なルートCA（Let's EncryptのISRG Root X1/X2、
DigiCert Global Root G2など）が欠けている場合があります。このため、
ほとんどのHTTPSサイトで `web_fetch` が `"fetch failed"` で失敗します。

Linuxでは、OpenClawはnvmを自動検出し、実際の起動環境に修正を適用します:

- `openclaw gateway install` はsystemd service環境に `NODE_EXTRA_CA_CERTS` を書き込みます
- `openclaw` CLI entrypointは、Node起動前に `NODE_EXTRA_CA_CERTS` を設定して自分自身をre-execします

**手動修正（古いバージョンまたは直接 `node ...` 起動向け）:**

OpenClaw起動前にこの変数をexportしてください:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

この変数については `~/.openclaw/.env` への書き込みだけに頼らないでください。Nodeは
`NODE_EXTRA_CA_CERTS` をprocess起動時に読み込みます。

## 関連

- [Gateway configuration](/ja-JP/gateway/configuration)
- [FAQ: env vars and .env loading](/ja-JP/help/faq#env-vars-and-env-loading)
- [Models overview](/ja-JP/concepts/models)

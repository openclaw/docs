---
read_when:
    - プロバイダー認証情報と `auth-profiles.json` ref 向けに SecretRef を設定する
    - 本番環境で secrets のリロード、監査、設定、適用を安全に運用する
    - 起動時 fail-fast、非アクティブサーフェスのフィルタリング、last-known-good 動作を理解する
summary: 'シークレット管理: SecretRef 契約、ランタイムスナップショット動作、安全な一方向スクラビング'
title: シークレット管理
x-i18n:
    generated_at: "2026-04-24T04:59:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18e21f63bbf1815b7166dfe123900575754270de94113b446311d73dfd4f2343
    source_path: gateway/secrets.md
    workflow: 15
---

OpenClaw は additive SecretRef をサポートしているため、サポート対象の認証情報を設定にプレーンテキストで保存する必要はありません。

プレーンテキストも引き続き使えます。SecretRef は認証情報ごとのオプトインです。

## 目的とランタイムモデル

シークレットはインメモリのランタイムスナップショットに解決されます。

- 解決はリクエスト経路での遅延実行ではなく、アクティベーション中に eager に行われます。
- 実効的にアクティブな SecretRef が解決できない場合、起動は fail-fast します。
- リロードは atomic swap を使います。全面成功するか、last-known-good スナップショットを維持するかのどちらかです。
- SecretRef ポリシー違反（たとえば OAuth モードの auth profile と SecretRef 入力の組み合わせ）は、ランタイム swap 前にアクティベーションを失敗させます。
- ランタイムリクエストは、アクティブなインメモリスナップショットからのみ読み取ります。
- 最初の config アクティベーション/読み込み成功後、ランタイムコードパスは、成功したリロードで swap されるまでそのアクティブなインメモリスナップショットを読み続けます。
- 送信系の配信パスもそのアクティブなスナップショットから読み取ります（たとえば Discord の reply/thread 配信や Telegram action の送信）。送信ごとに SecretRef を再解決しません。

これにより、シークレットプロバイダー障害がホットリクエストパスに乗らないようにしています。

## アクティブサーフェスフィルタリング

SecretRef は実効的にアクティブなサーフェスに対してのみ検証されます。

- 有効なサーフェス: 未解決 ref は起動/リロードをブロックします。
- 非アクティブなサーフェス: 未解決 ref は起動/リロードをブロックしません。
- 非アクティブな ref は、コード `SECRETS_REF_IGNORED_INACTIVE_SURFACE` の非致命的診断を出します。

非アクティブサーフェスの例:

- 無効化されたチャンネル/アカウントエントリー。
- 有効なアカウントに継承されないトップレベルチャンネル認証情報。
- 無効化された tool/機能サーフェス。
- `tools.web.search.provider` で選択されていない Web 検索プロバイダー固有キー。
  auto モード（provider 未設定）では、1 つ解決されるまでプロバイダー自動検出の優先順位に従ってキーが参照されます。
  選択後は、未選択のプロバイダーキーは選択されるまで非アクティブとして扱われます。
- sandbox SSH 認証素材（`agents.defaults.sandbox.ssh.identityData`,
  `certificateData`, `knownHostsData` とそのエージェント単位の上書き）は、
  実効 sandbox backend が default agent または有効化された agent に対して `ssh` のときのみアクティブです。
- `gateway.remote.token` / `gateway.remote.password` SecretRef は、次のいずれかが真ならアクティブです:
  - `gateway.mode=remote`
  - `gateway.remote.url` が設定されている
  - `gateway.tailscale.mode` が `serve` または `funnel`
  - これらの remote サーフェスがない local mode では:
    - `gateway.remote.token` は、token auth が勝ちうる状態で env/auth token が設定されていないときアクティブです。
    - `gateway.remote.password` は、password auth が勝ちうる状態で env/auth password が設定されていないときのみアクティブです。
- `gateway.auth.token` SecretRef は、`OPENCLAW_GATEWAY_TOKEN` が設定されている場合、起動時 auth 解決では非アクティブです。これはそのランタイムでは env token 入力が優先されるためです。

## Gateway auth サーフェス診断

`gateway.auth.token`, `gateway.auth.password`,
`gateway.remote.token`, `gateway.remote.password` のいずれかに SecretRef が設定されている場合、
gateway の起動/リロードではサーフェス状態を明示的にログ出力します。

- `active`: SecretRef は実効 auth サーフェスの一部であり、解決されなければなりません。
- `inactive`: SecretRef は、このランタイムでは別の auth サーフェスが勝つか、
  remote auth が無効/非アクティブであるため無視されます。

これらのエントリーは `SECRETS_GATEWAY_AUTH_SURFACE` で記録され、アクティブサーフェスポリシーが使った理由を含むため、その認証情報がなぜアクティブまたは非アクティブとして扱われたのかを確認できます。

## オンボーディング参照事前検証

オンボーディングが対話モードで実行され、SecretRef ストレージを選択した場合、OpenClaw は保存前に事前検証を行います。

- Env ref: env var 名を検証し、セットアップ中に空でない値が見えていることを確認します。
- Provider ref（`file` または `exec`）: provider 選択を検証し、`id` を解決し、解決された値の型を確認します。
- クイックスタート再利用パス: `gateway.auth.token` がすでに SecretRef の場合、オンボーディングは probe/dashboard ブートストラップ前にそれを解決します（`env`, `file`, `exec` ref に対応）。同じ fail-fast ゲートを使います。

検証に失敗した場合、オンボーディングはエラーを表示し、再試行できます。

## SecretRef 契約

どこでも 1 つのオブジェクト形状を使います。

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

### `source: "env"`

```json5
{ source: "env", provider: "default", id: "OPENAI_API_KEY" }
```

検証:

- `provider` は `^[a-z][a-z0-9_-]{0,63}$` に一致する必要があります
- `id` は `^[A-Z][A-Z0-9_]{0,127}$` に一致する必要があります

### `source: "file"`

```json5
{ source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
```

検証:

- `provider` は `^[a-z][a-z0-9_-]{0,63}$` に一致する必要があります
- `id` は絶対 JSON pointer（`/...`）である必要があります
- セグメント内の RFC6901 エスケープ: `~` => `~0`, `/` => `~1`

### `source: "exec"`

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

検証:

- `provider` は `^[a-z][a-z0-9_-]{0,63}$` に一致する必要があります
- `id` は `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$` に一致する必要があります
- `id` は `/` 区切りパスセグメントとして `.` または `..` を含んではいけません（たとえば `a/../b` は拒否されます）

## Provider 設定

provider は `secrets.providers` 配下で定義します。

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // または "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

### Env provider

- 任意の allowlist を `allowlist` で設定できます。
- 欠落または空の env 値は解決失敗になります。

### File provider

- `path` からローカルファイルを読み取ります。
- `mode: "json"` は JSON オブジェクト payload を期待し、`id` を pointer として解決します。
- `mode: "singleValue"` は ref id `"value"` を期待し、ファイル内容を返します。
- パスは所有者/権限チェックを通過する必要があります。
- Windows の fail-closed 注記: パスに対する ACL 検証が利用できない場合、解決は失敗します。信頼できるパスに限り、その provider に `allowInsecurePath: true` を設定するとパスセキュリティチェックを回避できます。

### Exec provider

- 設定された絶対バイナリパスを shell なしで実行します。
- デフォルトでは、`command` は通常ファイルを指している必要があります（symlink は不可）。
- Homebrew shim のような symlink コマンドパスを許可するには `allowSymlinkCommand: true` を設定します。OpenClaw は解決後のターゲットパスを検証します。
- package manager パスでは `allowSymlinkCommand` を `trustedDirs`（たとえば `["/opt/homebrew"]`）と組み合わせてください。
- timeout、no-output timeout、出力バイト制限、env allowlist、trusted dirs をサポートします。
- Windows の fail-closed 注記: コマンドパスに対する ACL 検証が利用できない場合、解決は失敗します。信頼できるパスに限り、その provider に `allowInsecurePath: true` を設定するとパスセキュリティチェックを回避できます。

リクエスト payload（stdin）:

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

レスポンス payload（stdout）:

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

任意の ID ごとのエラー:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "message": "not found" } }
}
```

## Exec 統合例

### 1Password CLI

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // Homebrew の symlink バイナリには必須
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

### HashiCorp Vault CLI

```json5
{
  secrets: {
    providers: {
      vault_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/vault",
        allowSymlinkCommand: true, // Homebrew の symlink バイナリには必須
        trustedDirs: ["/opt/homebrew"],
        args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
        passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "vault_openai", id: "value" },
      },
    },
  },
}
```

### `sops`

```json5
{
  secrets: {
    providers: {
      sops_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/sops",
        allowSymlinkCommand: true, // Homebrew の symlink バイナリには必須
        trustedDirs: ["/opt/homebrew"],
        args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
        passEnv: ["SOPS_AGE_KEY_FILE"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "sops_openai", id: "value" },
      },
    },
  },
}
```

## MCP サーバー環境変数

`plugins.entries.acpx.config.mcpServers` 経由で設定される MCP サーバー env var は SecretInput をサポートします。これにより、API key や token をプレーンテキスト config から除外できます。

```json5
{
  plugins: {
    entries: {
      acpx: {
        enabled: true,
        config: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  source: "env",
                  provider: "default",
                  id: "MCP_GITHUB_PAT",
                },
              },
            },
          },
        },
      },
    },
  },
}
```

プレーンテキスト文字列値も引き続き使えます。`${MCP_SERVER_API_KEY}` のような env-template ref と SecretRef オブジェクトは、MCP サーバープロセス起動前に gateway アクティベーション中に解決されます。他の SecretRef サーフェスと同様に、未解決 ref がアクティベーションをブロックするのは、`acpx` Plugin が実効的にアクティブな場合だけです。

## Sandbox SSH 認証素材

コアの `ssh` sandbox backend も SSH 認証素材に対する SecretRef をサポートします。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

ランタイム動作:

- OpenClaw はこれらの ref を、各 SSH 呼び出し時に遅延解決するのではなく、sandbox アクティベーション中に解決します。
- 解決済み値は厳格な権限を持つ一時ファイルに書き込まれ、生成される SSH config で使用されます。
- 実効 sandbox backend が `ssh` でない場合、これらの ref は非アクティブのままで、起動をブロックしません。

## サポートされる認証情報サーフェス

正規のサポート対象/非対象の認証情報は次に一覧があります。

- [SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface)

ランタイム生成またはローテーションされる認証情報、および OAuth リフレッシュ素材は、読み取り専用 SecretRef 解決から意図的に除外されています。

## 必須動作と優先順位

- ref のないフィールド: 変更なし。
- ref のあるフィールド: アクティブサーフェスではアクティベーション中に必須です。
- プレーンテキストと ref の両方がある場合、サポートされる優先順位パスでは ref が優先されます。
- マスキング用 sentinel `__OPENCLAW_REDACTED__` は内部の config redaction/restore 用に予約されており、リテラルの送信 config データとしては拒否されます。

警告と監査シグナル:

- `SECRETS_REF_OVERRIDES_PLAINTEXT`（ランタイム警告）
- `REF_SHADOWED`（`auth-profiles.json` の認証情報が `openclaw.json` の ref より優先される場合の監査結果）

Google Chat の互換動作:

- `serviceAccountRef` はプレーンテキストの `serviceAccount` より優先されます。
- sibling ref が設定されている場合、プレーンテキスト値は無視されます。

## アクティベーショントリガー

シークレットのアクティベーションは次のタイミングで実行されます。

- 起動時（preflight と最終アクティベーション）
- Config リロードのホット適用パス
- Config リロードの再起動チェックパス
- `secrets.reload` による手動リロード
- Gateway config 書き込み RPC preflight（`config.set` / `config.apply` / `config.patch`）で、編集を永続化する前に、送信された config payload 内にあるアクティブサーフェス SecretRef の解決可能性を検証

アクティベーション契約:

- 成功するとスナップショットが atomic に swap されます。
- 起動失敗は gateway 起動を中断します。
- ランタイムリロード失敗時は last-known-good スナップショットを維持します。
- Write-RPC preflight 失敗時は送信された config を拒否し、ディスク上の config もアクティブなランタイムスナップショットも変更しません。
- 送信 helper/tool 呼び出しに対して明示的な per-call チャンネルトークンを渡しても SecretRef アクティベーションはトリガーされません。アクティベーションポイントは起動、リロード、明示的な `secrets.reload` のままです。

## 劣化と回復のシグナル

健全な状態の後で、リロード時アクティベーションが失敗すると、OpenClaw はシークレット劣化状態に入ります。

単発の system event とログコード:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

動作:

- 劣化時: ランタイムは last-known-good スナップショットを維持します。
- 回復時: 次に成功したアクティベーションの後に一度だけ発行されます。
- すでに劣化状態のときに失敗が繰り返されても、警告ログは出ますが event はスパムしません。
- 起動時 fail-fast は、ランタイムが一度もアクティブになっていないため、劣化 event を発行しません。

## コマンドパス解決

コマンドパスは、gateway スナップショット RPC 経由で、サポートされる SecretRef 解決にオプトインできます。

大きく 2 つの動作があります。

- 厳格なコマンドパス（たとえば `openclaw memory` の remote-memory パスや、remote shared-secret ref を必要とする `openclaw qr --remote`）はアクティブスナップショットから読み取り、必要な SecretRef が利用できない場合は fail-fast します。
- 読み取り専用コマンドパス（たとえば `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit`、および読み取り専用の doctor/config repair フロー）もアクティブスナップショットを優先しますが、そのコマンドパスで対象 SecretRef が利用できない場合は中断せず、劣化します。

読み取り専用の動作:

- gateway が動作中の場合、これらのコマンドはまずアクティブスナップショットから読み取ります。
- gateway 解決が不完全、または gateway が利用できない場合、対象コマンドサーフェスに対してローカルフォールバックを試みます。
- 対象 SecretRef がまだ利用できない場合、そのコマンドは「configured but unavailable in this command path」のような明示的診断付きの劣化した読み取り専用出力で続行します。
- この劣化動作はコマンドローカルに限られます。ランタイムの起動、リロード、送信/auth パスを弱めるものではありません。

その他の注記:

- backend secret のローテーション後のスナップショット更新は `openclaw secrets reload` で処理されます。
- これらのコマンドパスが使用する Gateway RPC メソッド: `secrets.resolve`

## 監査と設定ワークフロー

デフォルトの operator フロー:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

### `secrets audit`

結果には次が含まれます。

- 保存時プレーンテキスト値（`openclaw.json`, `auth-profiles.json`, `.env`, および生成された `agents/*/agent/models.json`）
- 生成された `models.json` エントリー内の、プレーンテキストの機密プロバイダーヘッダー残留
- 未解決 ref
- 優先順位によるシャドーイング（`auth-profiles.json` が `openclaw.json` の ref より優先される）
- 旧式残留（`auth.json`, OAuth リマインダー）

exec 注記:

- デフォルトでは、audit はコマンド副作用を避けるため exec SecretRef の解決可能性チェックをスキップします。
- 監査中に exec provider を実行するには `openclaw secrets audit --allow-exec` を使ってください。

ヘッダー残留の注記:

- 機密プロバイダーヘッダー検出は名前ヒューリスティックベースです（一般的な auth/credential ヘッダー名や `authorization`, `x-api-key`, `token`, `secret`, `password`, `credential` などの断片）。

### `secrets configure`

対話型 helper で、次を行います。

- 最初に `secrets.providers` を設定する（`env`/`file`/`exec`、追加/編集/削除）
- `openclaw.json` と、1 つの agent スコープに対する `auth-profiles.json` 内のサポートされた secret 保持フィールドを選択できる
- target picker 内で新しい `auth-profiles.json` マッピングを直接作成できる
- SecretRef の詳細（`source`, `provider`, `id`）を収集する
- preflight 解決を実行する
- すぐに適用することもできる

exec 注記:

- `--allow-exec` が設定されていない限り、preflight は exec SecretRef チェックをスキップします。
- `configure --apply` から直接適用し、計画に exec ref/provider が含まれる場合は、適用ステップでも `--allow-exec` を有効にしたままにしてください。

便利なモード:

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`
- `openclaw secrets configure --agent <id>`

`configure` の apply デフォルト:

- 対象プロバイダーについて、`auth-profiles.json` から一致する静的認証情報をスクラブする
- `auth.json` から旧式の静的 `api_key` エントリーをスクラブする
- `<config-dir>/.env` から一致する既知の secret 行をスクラブする

### `secrets apply`

保存済み計画を適用します。

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
```

exec 注記:

- `--allow-exec` がない限り、dry-run は exec チェックをスキップします。
- 書き込みモードでは、`--allow-exec` が設定されていないと exec SecretRef/provider を含む計画は拒否されます。

厳密な target/path 契約の詳細と正確な拒否ルールについては、次を参照してください。

- [Secrets Apply Plan Contract](/ja-JP/gateway/secrets-plan-contract)

## 一方向安全ポリシー

OpenClaw は、過去のプレーンテキストシークレット値を含む rollback バックアップを意図的に書き込みません。

安全モデル:

- 書き込みモードの前に preflight が成功していなければならない
- ランタイムアクティベーションは commit 前に検証される
- apply は atomic file replacement を使ってファイルを更新し、失敗時には best-effort で復元する

## 旧式 auth 互換性注記

静的認証情報については、ランタイムはもはやプレーンテキストの旧式 auth ストレージに依存しません。

- ランタイム認証情報ソースは解決済みインメモリスナップショットです。
- 旧式の静的 `api_key` エントリーは見つかり次第スクラブされます。
- OAuth 関連の互換動作は別扱いのままです。

## Web UI 注記

一部の SecretInput union は、フォームモードより raw editor モードの方が設定しやすい場合があります。

## 関連ドキュメント

- CLI コマンド: [secrets](/ja-JP/cli/secrets)
- 計画契約の詳細: [Secrets Apply Plan Contract](/ja-JP/gateway/secrets-plan-contract)
- 認証情報サーフェス: [SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface)
- Auth セットアップ: [Authentication](/ja-JP/gateway/authentication)
- セキュリティ姿勢: [Security](/ja-JP/gateway/security)
- 環境変数の優先順位: [Environment Variables](/ja-JP/help/environment)

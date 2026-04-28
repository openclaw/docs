---
read_when:
    - provider 認証情報と `auth-profiles.json` ref 用に SecretRef を設定すること
    - 本番環境で secrets の reload、audit、configure、apply を安全に運用すること
    - 起動時の fail-fast、非アクティブサーフェスのフィルタリング、last-known-good 動作を理解すること
sidebarTitle: Secrets management
summary: 'シークレット管理: SecretRef の契約、ランタイムスナップショット動作、安全な一方向スクラビング'
title: シークレット管理
x-i18n:
    generated_at: "2026-04-26T11:31:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8697a8eb15cf6ef9b105e3f12cfdad6205284d4c45f1314cd7aec2e2c81fed1
    source_path: gateway/secrets.md
    workflow: 15
---

OpenClaw は加算的な SecretRef をサポートしているため、対応する認証情報を config に平文で保存する必要はありません。

<Note>
平文も引き続き利用できます。SecretRef は認証情報ごとのオプトインです。
</Note>

## 目標とランタイムモデル

シークレットはインメモリのランタイムスナップショットに解決されます。

- 解決はリクエスト経路での遅延実行ではなく、有効化中に eager に行われます。
- 実効的に active な SecretRef を解決できない場合、起動は fail-fast します。
- reload はアトミックスワップを使います。完全に成功するか、last-known-good スナップショットを維持します。
- SecretRef ポリシー違反（たとえば OAuth モードの auth profile と SecretRef 入力の組み合わせ）は、ランタイムスワップ前の有効化段階で失敗します。
- ランタイムリクエストは active なインメモリスナップショットからのみ読み取ります。
- 最初の config 有効化/読み込みに成功した後、ランタイムコードパスは成功した reload がそれを入れ替えるまで、その active なインメモリスナップショットを読み続けます。
- 送信配信経路もその active スナップショットから読み取ります（たとえば Discord の返信/スレッド配信や Telegram のアクション送信）。送信ごとに SecretRef を再解決しません。

これにより、シークレットプロバイダー障害がホットなリクエスト経路に入り込まないようにします。

## アクティブサーフェスのフィルタリング

SecretRef は実効的に active なサーフェス上でのみ検証されます。

- 有効なサーフェス: 未解決の ref は起動/reload をブロックします。
- 非アクティブなサーフェス: 未解決の ref は起動/reload をブロックしません。
- 非アクティブな ref は、コード `SECRETS_REF_IGNORED_INACTIVE_SURFACE` の非致命的診断を出します。

<AccordionGroup>
  <Accordion title="非アクティブなサーフェスの例">
    - 無効化されたチャネル/アカウントエントリ。
    - 有効なアカウントが継承しないトップレベルチャネル認証情報。
    - 無効化されたツール/機能サーフェス。
    - `tools.web.search.provider` で選択されていない Web 検索 provider 固有キー。auto モード（provider 未設定）では、1 つが解決されるまで provider 自動検出の優先順でキーが参照されます。選択後は、未選択の provider キーは選択されるまで非アクティブとして扱われます。
    - sandbox SSH 認証マテリアル（`agents.defaults.sandbox.ssh.identityData`、`certificateData`、`knownHostsData`、および agent ごとのオーバーライド）は、実効的な sandbox backend が default agent または有効な agent に対して `ssh` のときのみ active です。
    - `gateway.remote.token` / `gateway.remote.password` SecretRef は、次のいずれかが true の場合に active です:
      - `gateway.mode=remote`
      - `gateway.remote.url` が設定されている
      - `gateway.tailscale.mode` が `serve` または `funnel`
      - それらの remote サーフェスがない local モードでは:
        - `gateway.remote.token` は token auth が勝てて、かつ env/auth token が設定されていない場合に active
        - `gateway.remote.password` は password auth が勝てて、かつ env/auth password が設定されていない場合にのみ active
    - `gateway.auth.token` SecretRef は、`OPENCLAW_GATEWAY_TOKEN` が設定されている場合、起動時認証解決では非アクティブです。これは、そのランタイムでは env token 入力が優先されるためです。

  </Accordion>
</AccordionGroup>

## Gateway 認証サーフェス診断

`gateway.auth.token`、`gateway.auth.password`、`gateway.remote.token`、または `gateway.remote.password` に SecretRef が設定されている場合、Gateway の起動/reload はそのサーフェス状態を明示的にログ出力します。

- `active`: SecretRef は実効的な認証サーフェスの一部であり、解決されなければなりません。
- `inactive`: 別の認証サーフェスが優先されるか、remote 認証が無効/非アクティブであるため、このランタイムでは SecretRef は無視されます。

これらのエントリは `SECRETS_GATEWAY_AUTH_SURFACE` としてログに記録され、active-surface ポリシーが使用した理由も含まれるため、なぜその認証情報が active または inactive と扱われたのかが分かります。

## オンボーディング参照の事前検証

オンボーディングが対話モードで実行され、SecretRef 保存を選択した場合、OpenClaw は保存前に事前検証を実行します。

- Env ref: env var 名を検証し、セットアップ中に空でない値が見えていることを確認します。
- Provider ref（`file` または `exec`）: provider 選択を検証し、`id` を解決し、解決された値の型を確認します。
- クイックスタート再利用経路: `gateway.auth.token` がすでに SecretRef の場合、オンボーディングは probe/dashboard ブートストラップ前にそれを解決します（`env`、`file`、`exec` ref について）。“fail-fast” ゲートも同じです。

検証に失敗した場合、オンボーディングはエラーを表示し、再試行できます。

## SecretRef 契約

どこでも同じオブジェクト形状を使います。

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    検証:

    - `provider` は `^[a-z][a-z0-9_-]{0,63}$` に一致する必要があります
    - `id` は `^[A-Z][A-Z0-9_]{0,127}$` に一致する必要があります

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    検証:

    - `provider` は `^[a-z][a-z0-9_-]{0,63}$` に一致する必要があります
    - `id` は絶対 JSON pointer（`/...`）である必要があります
    - セグメントでの RFC6901 エスケープ: `~` => `~0`、`/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey" }
    ```

    検証:

    - `provider` は `^[a-z][a-z0-9_-]{0,63}$` に一致する必要があります
    - `id` は `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$` に一致する必要があります
    - `id` は `/` 区切りパスセグメントとして `.` または `..` を含んではいけません（たとえば `a/../b` は拒否されます）

  </Tab>
</Tabs>

## Provider config

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

<AccordionGroup>
  <Accordion title="Env provider">
    - `allowlist` による任意の allowlist。
    - env 値が欠落または空の場合、解決は失敗します。

  </Accordion>
  <Accordion title="File provider">
    - `path` からローカルファイルを読み取ります。
    - `mode: "json"` は JSON オブジェクトのペイロードを期待し、`id` を pointer として解決します。
    - `mode: "singleValue"` は ref id として `"value"` を期待し、ファイル内容を返します。
    - パスは所有権/権限チェックを通過する必要があります。
    - Windows の fail-closed に関する注記: パスの ACL 検証が利用できない場合、解決は失敗します。信頼できるパスに限り、その provider に `allowInsecurePath: true` を設定するとパスセキュリティチェックを回避できます。

  </Accordion>
  <Accordion title="Exec provider">
    - 設定された絶対バイナリパスを実行します。shell は使いません。
    - デフォルトでは、`command` は通常ファイルを指している必要があります（symlink では不可）。
    - symlink の command パス（たとえば Homebrew shim）を許可するには `allowSymlinkCommand: true` を設定します。OpenClaw は解決先ターゲットパスを検証します。
    - パッケージマネージャのパス（たとえば `["/opt/homebrew"]`）には、`allowSymlinkCommand` を `trustedDirs` と組み合わせて使ってください。
    - timeout、出力なし timeout、出力バイト上限、env allowlist、trusted dirs をサポートします。
    - Windows の fail-closed に関する注記: command パスの ACL 検証が利用できない場合、解決は失敗します。信頼できるパスに限り、その provider に `allowInsecurePath: true` を設定するとパスセキュリティチェックを回避できます。

    リクエストペイロード（stdin）:

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    レスポンスペイロード（stdout）:

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    任意の id ごとのエラー:

    ```json
    {
      "protocolVersion": 1,
      "values": {},
      "errors": { "providers/openai/apiKey": { "message": "not found" } }
    }
    ```

  </Accordion>
</AccordionGroup>

## Exec 統合例

<AccordionGroup>
  <Accordion title="1Password CLI">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // Homebrew の symlink バイナリに必要
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
  </Accordion>
  <Accordion title="HashiCorp Vault CLI">
    ```json5
    {
      secrets: {
        providers: {
          vault_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/vault",
            allowSymlinkCommand: true, // Homebrew の symlink バイナリに必要
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
  </Accordion>
  <Accordion title="sops">
    ```json5
    {
      secrets: {
        providers: {
          sops_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/sops",
            allowSymlinkCommand: true, // Homebrew の symlink バイナリに必要
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
  </Accordion>
</AccordionGroup>

## MCP サーバー環境変数

`plugins.entries.acpx.config.mcpServers` で設定される MCP サーバー env var は SecretInput をサポートします。これにより API キーやトークンを平文 config に置かずに済みます。

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

平文文字列値も引き続き利用できます。`${MCP_SERVER_API_KEY}` のような env-template ref と SecretRef オブジェクトは、MCP サーバープロセスの起動前に、Gateway の有効化中に解決されます。他の SecretRef サーフェスと同様に、未解決の ref が有効化をブロックするのは `acpx` Plugin が実効的に active な場合だけです。

## Sandbox SSH 認証マテリアル

コアの `ssh` sandbox backend も、SSH 認証マテリアルに対する SecretRef をサポートします。

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

- OpenClaw はこれらの ref を各 SSH 呼び出し時に遅延解決するのではなく、sandbox 有効化中に解決します。
- 解決された値は厳格な権限を持つ一時ファイルに書き込まれ、生成される SSH config で使われます。
- 実効的な sandbox backend が `ssh` でない場合、これらの ref は非アクティブのままとなり、起動をブロックしません。

## 対応する認証情報サーフェス

正式に対応/非対応の認証情報は次に一覧があります。

- [SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface)

<Note>
ランタイムで発行される認証情報、ローテーションされる認証情報、および OAuth リフレッシュマテリアルは、読み取り専用 SecretRef 解決の対象から意図的に除外されています。
</Note>

## 必須動作と優先順位

- ref のないフィールド: 変更なし。
- ref のあるフィールド: active サーフェスでは有効化中に必須。
- 平文と ref の両方がある場合、対応する優先パスでは ref が優先されます。
- redaction センチネル `__OPENCLAW_REDACTED__` は内部の config redaction/restore 用に予約されており、文字どおりの送信 config データとしては拒否されます。

警告および監査シグナル:

- `SECRETS_REF_OVERRIDES_PLAINTEXT`（ランタイム警告）
- `REF_SHADOWED`（`auth-profiles.json` の認証情報が `openclaw.json` の ref より優先される場合の監査結果）

Google Chat の互換動作:

- `serviceAccountRef` は平文の `serviceAccount` より優先されます。
- 兄弟 ref が設定されている場合、平文値は無視されます。

## 有効化トリガー

シークレット有効化は次で実行されます。

- 起動時（事前検証 + 最終有効化）
- Config reload の hot-apply 経路
- Config reload の restart-check 経路
- `secrets.reload` による手動 reload
- 永続化前に、送信された config ペイロード内の active-surface SecretRef 解決可能性を検証する Gateway config write RPC 事前検証（`config.set` / `config.apply` / `config.patch`）

有効化契約:

- 成功するとスナップショットをアトミックに入れ替えます。
- 起動失敗は Gateway 起動を中止します。
- ランタイム reload 失敗時は last-known-good スナップショットを維持します。
- Write-RPC の事前検証失敗時は送信された config を拒否し、ディスク上の config と active ランタイムスナップショットの両方を変更しません。
- 送信ヘルパー/ツール呼び出しに明示的な per-call チャネルトークンを渡しても SecretRef 有効化は発生しません。有効化ポイントは引き続き起動時、reload 時、明示的な `secrets.reload` のみです。

## 劣化および回復シグナル

健全な状態の後に reload 時有効化が失敗すると、OpenClaw は劣化した secrets 状態に入ります。

単発の system event およびログコード:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

動作:

- 劣化時: ランタイムは last-known-good スナップショットを維持します。
- 回復時: 次回の有効化成功後に一度だけ出力されます。
- すでに劣化している間の繰り返し失敗は警告ログのみで、イベントを連発しません。
- 起動時 fail-fast は劣化イベントを出しません。ランタイムが一度も active になっていないためです。

## コマンドパス解決

コマンドパスは、Gateway スナップショット RPC を通じて対応する SecretRef 解決にオプトインできます。

大きく 2 つの動作があります。

<Tabs>
  <Tab title="厳格なコマンドパス">
    たとえば `openclaw memory` の remote-memory 経路や、リモート共有シークレット ref が必要な場合の `openclaw qr --remote` です。これらは active スナップショットから読み取り、必要な SecretRef がそのコマンドパスで利用できない場合は fail-fast します。
  </Tab>
  <Tab title="読み取り専用コマンドパス">
    たとえば `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve`、`openclaw security audit`、および読み取り専用の doctor/config 修復フローです。これらも active スナップショットを優先しますが、対象 SecretRef がそのコマンドパスで利用できない場合、abort ではなく劣化動作になります。

    読み取り専用動作:

    - Gateway 実行中は、これらのコマンドはまず active スナップショットから読み取ります。
    - Gateway 解決が不完全、または Gateway が利用できない場合は、そのコマンドサーフェス向けの限定的なローカルフォールバックを試みます。
    - 対象 SecretRef が依然として利用できない場合でも、コマンドは「configured but unavailable in this command path」のような明示的な診断付きの劣化した読み取り専用出力で継続します。
    - この劣化動作はコマンドローカルに限られます。ランタイムの起動、reload、send/auth 経路は弱めません。

  </Tab>
</Tabs>

その他の注記:

- バックエンドシークレットのローテーション後のスナップショット更新は `openclaw secrets reload` で処理されます。
- これらのコマンドパスが使う Gateway RPC メソッド: `secrets.resolve`。

## 監査と設定のワークフロー

デフォルトのオペレーターフロー:

<Steps>
  <Step title="現在の状態を監査する">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="SecretRef を設定する">
    ```bash
    openclaw secrets configure
    ```
  </Step>
  <Step title="再監査する">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="secrets audit">
    結果には次が含まれます。

    - 保存時の平文値（`openclaw.json`、`auth-profiles.json`、`.env`、生成された `agents/*/agent/models.json`）
    - 生成された `models.json` エントリ内の、平文の機微な provider header の残留
    - 未解決 ref
    - 優先順位によるシャドーイング（`auth-profiles.json` が `openclaw.json` の ref より優先される）
    - レガシーな残留物（`auth.json`、OAuth リマインダー）

    Exec に関する注記:

    - デフォルトでは、audit はコマンド副作用を避けるため exec SecretRef の解決可能性チェックをスキップします。
    - 監査中に exec provider を実行するには `openclaw secrets audit --allow-exec` を使ってください。

    Header 残留に関する注記:

    - 機微な provider header の検出は、名前ヒューリスティックベースです（一般的な auth/credential header 名と、`authorization`、`x-api-key`、`token`、`secret`、`password`、`credential` などの断片）。

  </Accordion>
  <Accordion title="secrets configure">
    対話型ヘルパーで、次を行います。

    - まず `secrets.providers`（`env`/`file`/`exec`、追加/編集/削除）を設定
    - 1 つの agent スコープについて、`openclaw.json` と `auth-profiles.json` 内の対応するシークレット保持フィールドを選択可能
    - 対象ピッカー内で新しい `auth-profiles.json` マッピングを直接作成可能
    - SecretRef の詳細（`source`、`provider`、`id`）を取得
    - 事前解決を実行
    - 即時適用可能

    Exec に関する注記:

    - `--allow-exec` が設定されていない限り、事前検証では exec SecretRef チェックをスキップします。
    - `configure --apply` から直接適用し、プランに exec ref/provider が含まれる場合は、適用ステップでも `--allow-exec` を付けたままにしてください。

    便利なモード:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    `configure` の apply デフォルト:

    - 対象 provider について、`auth-profiles.json` から一致する静的認証情報をスクラブ
    - `auth.json` からレガシーな静的 `api_key` エントリをスクラブ
    - `<config-dir>/.env` から一致する既知のシークレット行をスクラブ

  </Accordion>
  <Accordion title="secrets apply">
    保存済みプランを適用します。

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Exec に関する注記:

    - dry-run では、`--allow-exec` が設定されていない限り exec チェックをスキップします。
    - 書き込みモードでは、`--allow-exec` が設定されていない限り、exec SecretRef/provider を含むプランは拒否されます。

    厳格な対象/パス契約の詳細と正確な拒否ルールについては [Secrets Apply Plan Contract](/ja-JP/gateway/secrets-plan-contract) を参照してください。

  </Accordion>
</AccordionGroup>

## 一方向の安全ポリシー

<Warning>
OpenClaw は、過去の平文シークレット値を含むロールバックバックアップを意図的に書き込みません。
</Warning>

安全モデル:

- 書き込みモードの前に事前検証が成功している必要があります
- コミット前にランタイム有効化が検証されます
- apply はアトミックなファイル置換と、失敗時のベストエフォート復元でファイルを更新します

## レガシー認証互換に関する注記

静的認証情報について、ランタイムはもはや平文のレガシー認証保存に依存しません。

- ランタイム認証情報ソースは解決済みインメモリスナップショットです。
- レガシーな静的 `api_key` エントリは、見つかったときにスクラブされます。
- OAuth 関連の互換動作は別扱いのままです。

## Web UI に関する注記

一部の SecretInput union は、フォームモードより raw editor モードの方が設定しやすいことがあります。

## 関連

- [認証](/ja-JP/gateway/authentication) — 認証セットアップ
- [CLI: secrets](/ja-JP/cli/secrets) — CLI コマンド
- [環境変数](/ja-JP/help/environment) — 環境変数の優先順位
- [SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface) — 認証情報サーフェス
- [Secrets Apply Plan Contract](/ja-JP/gateway/secrets-plan-contract) — プラン契約の詳細
- [セキュリティ](/ja-JP/gateway/security) — セキュリティ方針

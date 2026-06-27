---
read_when:
    - プロバイダー認証情報と `auth-profiles.json` 参照用の SecretRefs の設定
    - 本番環境でシークレットのリロード、監査、設定、適用を安全に運用する
    - 起動時のフェイルファスト、非アクティブなサーフェスのフィルタリング、最後に正常と確認された状態の動作を理解する
sidebarTitle: Secrets management
summary: 'シークレット管理: SecretRef コントラクト、ランタイムスナップショットの動作、安全な一方向スクラビング'
title: シークレット管理
x-i18n:
    generated_at: "2026-06-27T11:35:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d90346b1e4abc39cf1ab314c242f0b976aa83ee06f6dfeb787aafb19fa90de9
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw は加算的な SecretRefs をサポートしているため、対応する認証情報を設定内に平文で保存する必要はありません。

<Note>
平文は引き続き機能します。SecretRefs は認証情報ごとにオプトインです。
</Note>

<Warning>
平文の認証情報が、エージェントが検査できるファイルに保存されている場合、引き続きエージェントから読み取り可能です。これには `openclaw.json`、`auth-profiles.json`、`.env`、生成された `agents/*/agent/models.json` ファイルが含まれます。SecretRefs がそのローカルの影響範囲を縮小するのは、対応するすべての認証情報が移行され、`openclaw secrets audit --check` が平文シークレットの残存なしを報告した後だけです。
</Warning>

## 目標とランタイムモデル

シークレットはメモリ内のランタイムスナップショットに解決されます。

- 解決はリクエストパス上で遅延実行されるのではなく、アクティベーション中に先行して実行されます。
- 実質的にアクティブな SecretRef を解決できない場合、起動は即座に失敗します。
- リロードはアトミックスワップを使用します。完全に成功するか、最後に正常だったスナップショットを保持します。
- SecretRef ポリシー違反（たとえば OAuth モードの認証プロファイルと SecretRef 入力の組み合わせ）は、ランタイムスワップ前のアクティベーションに失敗します。
- ランタイムリクエストは、アクティブなメモリ内スナップショットからのみ読み取ります。
- 最初の設定アクティベーション/読み込みが成功した後、ランタイムコードパスは、成功したリロードでスワップされるまで、そのアクティブなメモリ内スナップショットを読み続けます。
- 送信配信パスもそのアクティブなスナップショットから読み取ります（たとえば Discord の返信/スレッド配信や Telegram アクション送信）。送信ごとに SecretRefs を再解決しません。

これにより、シークレットプロバイダーの停止がホットリクエストパスに乗らないようになります。

## エージェントアクセス境界

SecretRefs は、対応する設定と生成されたモデルサーフェスに認証情報が永続化されることを防ぎますが、プロセス分離の境界ではありません。平文の認証情報が、エージェントが読み取れるパスのディスク上に残っている場合、エージェントはファイルツールやシェルツールを使ってそのファイルを検査することで、API レベルの墨消しを迂回できます。

エージェントがアクセス可能なファイルが対象となる本番デプロイでは、次のすべてが true の場合にのみ SecretRef 移行が完了したものとして扱ってください。

- 対応する認証情報が平文値ではなく SecretRefs を使用している
- 旧来の平文残存が `openclaw.json`、`auth-profiles.json`、`.env`、生成された `models.json` ファイルから消去されている
- 移行後に `openclaw secrets audit --check` がクリーンである
- 残っている未対応またはローテーション中の認証情報が、オペレーティングシステム分離、コンテナ分離、または外部認証情報プロキシで保護されている

このため、audit/configure/apply ワークフローは単なる便利ヘルパーではなく、セキュリティ移行ゲートです。

<Warning>
SecretRefs は、任意の読み取り可能なファイルを安全にするものではありません。バックアップ、コピーされた設定、古い生成済みモデルカタログ、未対応の認証情報クラスは、削除されるか、エージェント信頼境界の外へ移動されるか、別の分離レイヤーで保護されるまで、本番シークレットとして扱う必要があります。
</Warning>

## アクティブサーフェスのフィルタリング

SecretRefs は、実質的にアクティブなサーフェスでのみ検証されます。

- 有効なサーフェス: 未解決の参照は起動/リロードをブロックします。
- 非アクティブなサーフェス: 未解決の参照は起動/リロードをブロックしません。
- 非アクティブな参照は、コード `SECRETS_REF_IGNORED_INACTIVE_SURFACE` で非致命的な診断を出力します。

<AccordionGroup>
  <Accordion title="非アクティブなサーフェスの例">
    - 無効化されたチャンネル/アカウントエントリ。
    - 有効なアカウントが継承していないトップレベルのチャンネル認証情報。
    - 無効化されたツール/機能サーフェス。
    - `tools.web.search.provider` で選択されていない Web 検索プロバイダー固有のキー。自動モード（provider 未設定）では、プロバイダーの自動検出のため、いずれかが解決されるまで優先順位に従ってキーが参照されます。選択後、選択されていないプロバイダーキーは、選択されるまで非アクティブとして扱われます。
    - サンドボックス SSH 認証素材（`agents.defaults.sandbox.ssh.identityData`、`certificateData`、`knownHostsData`、およびエージェントごとのオーバーライド）は、既定エージェントまたは有効なエージェントの実効サンドボックスバックエンドが `ssh` の場合にのみアクティブです。
    - `gateway.remote.token` / `gateway.remote.password` SecretRefs は、次のいずれかが true の場合にアクティブです。
      - `gateway.mode=remote`
      - `gateway.remote.url` が設定されている
      - `gateway.tailscale.mode` が `serve` または `funnel`
      - これらのリモートサーフェスがないローカルモード:
        - トークン認証が勝てて、env/auth トークンが設定されていない場合、`gateway.remote.token` はアクティブです。
        - パスワード認証が勝てて、env/auth パスワードが設定されていない場合にのみ、`gateway.remote.password` はアクティブです。
    - `OPENCLAW_GATEWAY_TOKEN` が設定されている場合、`gateway.auth.token` SecretRef は起動時の認証解決では非アクティブです。そのランタイムでは env トークン入力が優先されるためです。

  </Accordion>
</AccordionGroup>

## Gateway 認証サーフェス診断

SecretRef が `gateway.auth.token`、`gateway.auth.password`、`gateway.remote.token`、または `gateway.remote.password` に設定されている場合、Gateway の起動/リロードはサーフェス状態を明示的にログ出力します。

- `active`: SecretRef は実効認証サーフェスの一部であり、解決される必要があります。
- `inactive`: 別の認証サーフェスが優先される、またはリモート認証が無効/非アクティブであるため、このランタイムでは SecretRef は無視されます。

これらのエントリは `SECRETS_GATEWAY_AUTH_SURFACE` とともにログ出力され、アクティブサーフェスポリシーで使用された理由を含むため、認証情報がなぜアクティブまたは非アクティブとして扱われたかを確認できます。

## オンボーディング参照のプリフライト

オンボーディングが対話モードで実行され、SecretRef ストレージを選択した場合、OpenClaw は保存前にプリフライト検証を実行します。

- Env 参照: env var 名を検証し、セットアップ中に空でない値が見えていることを確認します。
- プロバイダー参照（`file` または `exec`）: プロバイダー選択を検証し、`id` を解決し、解決された値の型をチェックします。
- クイックスタート再利用パス: `gateway.auth.token` がすでに SecretRef の場合、オンボーディングはプローブ/ダッシュボードのブートストラップ前に、同じ fail-fast ゲートを使ってそれを解決します（`env`、`file`、`exec` 参照）。

検証に失敗すると、オンボーディングはエラーを表示し、再試行できるようにします。

## SecretRef 契約

どこでも 1 つのオブジェクト形状を使用します。

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    対応する SecretInput フィールドは、正確な文字列省略形も受け付けます。

    ```json5
    "${OPENAI_API_KEY}"
    "$OPENAI_API_KEY"
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
    - `id` は絶対 JSON ポインター（`/...`）である必要があります
    - セグメント内の RFC6901 エスケープ: `~` => `~0`、`/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    検証:

    - `provider` は `^[a-z][a-z0-9_-]{0,63}$` に一致する必要があります
    - `id` は `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` に一致する必要があります（`secret#json_key` などのセレクターをサポート）
    - `id` はスラッシュ区切りのパスセグメントとして `.` または `..` を含んではなりません（たとえば `a/../b` は拒否されます）

  </Tab>
</Tabs>

## プロバイダー設定

`secrets.providers` の下にプロバイダーを定義します。

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // or "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
      "team-secrets": {
        source: "exec",
        pluginIntegration: {
          pluginId: "acme-secrets",
          integrationId: "secret-store",
        },
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
  <Accordion title="Env プロバイダー">
    - `allowlist` による任意の許可リスト。
    - 欠落または空の env 値は解決に失敗します。

  </Accordion>
  <Accordion title="File プロバイダー">
    - `path` からローカルファイルを読み取ります。
    - `mode: "json"` は JSON オブジェクトペイロードを想定し、`id` をポインターとして解決します。
    - `mode: "singleValue"` は参照 id `"value"` を想定し、ファイル内容を返します。
    - パスは所有権/権限チェックに合格する必要があります。
    - Windows の fail-closed 注記: パスの ACL 検証が利用できない場合、解決は失敗します。信頼済みパスの場合のみ、そのプロバイダーで `allowInsecurePath: true` を設定してパスセキュリティチェックを迂回できます。

  </Accordion>
  <Accordion title="Exec プロバイダー">
    - 設定された絶対バイナリパスを、シェルなしで実行します。
    - 既定では、`command` は通常ファイル（シンボリックリンクではない）を指す必要があります。
    - シンボリックリンクのコマンドパス（たとえば Homebrew shim）を許可するには、`allowSymlinkCommand: true` を設定します。OpenClaw は解決後のターゲットパスを検証します。
    - パッケージマネージャーパス（たとえば `["/opt/homebrew"]`）では、`allowSymlinkCommand` を `trustedDirs` と組み合わせます。
    - タイムアウト、無出力タイムアウト、出力バイト制限、env 許可リスト、信頼済みディレクトリをサポートします。
    - Windows の fail-closed 注記: コマンドパスの ACL 検証が利用できない場合、解決は失敗します。信頼済みパスの場合のみ、そのプロバイダーで `allowInsecurePath: true` を設定してパスセキュリティチェックを迂回できます。
    - Plugin 管理の exec プロバイダーは、コピーされた `command`/`args` の代わりに `pluginIntegration` を使用できます。OpenClaw は起動/リロード中に、インストール済み Plugin マニフェストから現在のコマンド詳細を解決します。Plugin が無効化、削除、未信頼、またはその統合を宣言しなくなった場合、そのプロバイダーを使用するアクティブな SecretRefs は fail closed します。

    リクエストペイロード（stdin）:

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    レスポンスペイロード（stdout）:

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    id ごとの任意エラー:

    ```json
    {
      "protocolVersion": 1,
      "values": {},
      "errors": { "providers/openai/apiKey": { "message": "not found" } }
    }
    ```

  </Accordion>
</AccordionGroup>

## ファイルベースの API キー

設定の `env` ブロックに `file:...` 文字列を入れないでください。`env` ブロックはリテラルで、上書きしないため、`file:...` は解決されません。

代わりに、対応する認証情報フィールドで file SecretRef を使用してください。

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

`mode: "singleValue"` の場合、SecretRef `id` は `"value"` です。`mode: "json"` の場合は、`"/providers/xai/apiKey"` などの絶対 JSON ポインターを使用します。

SecretRefs を受け付ける設定フィールドについては、[SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface) を参照してください。

## Exec 統合の例

<AccordionGroup>
  <Accordion title="1Password CLI">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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
  <Accordion title="Bitwarden Secrets Manager (`bws`)">
    SecretRef ID を Bitwarden Secrets Manager の項目キーにマッピングしたい場合は、リゾルバーラッパーを使用します。リポジトリには
    `scripts/secrets/openclaw-bws-resolver.mjs` が含まれています。Gateway を実行するホスト上の絶対パスの信頼済みパスにインストールまたはコピーしてください。

    要件:

    - Bitwarden Secrets Manager CLI (`bws`) が Gateway ホストにインストールされていること。
    - `BWS_ACCESS_TOKEN` が Gateway サービスで利用可能であること。
    - `PATH` をリゾルバーに渡すか、`BWS_BIN` を絶対 `bws`
      バイナリパスに設定すること。
    - セルフホストの Bitwarden インスタンスを使用する場合は、環境で `BWS_SERVER_URL` を設定する必要があります。

    ```json5
    {
      secrets: {
        providers: {
          bws: {
            source: "exec",
            command: "/usr/local/bin/openclaw-bws-resolver.mjs",
            passEnv: ["BWS_ACCESS_TOKEN", "BWS_SERVER_URL", "PATH", "BWS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "bws",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    リゾルバーは要求された ID をバッチ化し、`bws secret list` を実行して、一致するシークレットの `key` フィールドの値を返します。`openclaw/providers/openai/apiKey` のように exec SecretRef ID 契約を満たすキーを使用してください。アンダースコアを含む環境変数形式のキーは、リゾルバーの実行前に拒否されます。表示可能な Bitwarden シークレットのうち、要求されたキーと同じものが複数ある場合、リゾルバーは 1 つを選択せず、その ID を曖昧として失敗させます。設定を更新した後、リゾルバーパスを検証します。

    ```bash
    openclaw secrets audit --allow-exec
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
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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
  <Accordion title="password-store (`pass`)">
    SecretRef ID を `pass` エントリに直接マッピングしたい場合は、小さなリゾルバーラッパーを使用します。これは exec-provider パスチェックを通過する絶対パスに実行可能ファイルとして保存してください。例:
    `/usr/local/bin/openclaw-pass-resolver`。`#!/usr/bin/env node` シバンはリゾルバープロセスの `PATH` から `node` を解決するため、`passEnv` に `PATH` を含めてください。`pass` がその `PATH` 上にない場合は、親環境で `PASS_BIN` を設定し、それも `passEnv` に含めます。

    ```js
    #!/usr/bin/env node
    const { spawnSync } = require("node:child_process");

    let stdin = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      stdin += chunk;
    });
    process.stdin.on("error", (err) => {
      process.stderr.write(`${err.message}\n`);
      process.exit(1);
    });
    process.stdin.on("end", () => {
      let request;
      try {
        request = JSON.parse(stdin || "{}");
      } catch (err) {
        process.stderr.write(`Failed to parse request: ${err.message}\n`);
        process.exit(1);
      }

      const passBin = process.env.PASS_BIN || "pass";
      const values = {};
      const errors = {};

      for (const id of request.ids ?? []) {
        const result = spawnSync(passBin, ["show", id], { encoding: "utf8" });
        if (result.status === 0) {
          values[id] = result.stdout.split(/\r?\n/, 1)[0] ?? "";
        } else {
          errors[id] = { message: (result.stderr || `pass exited ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    次に exec provider を設定し、`apiKey` が `pass` エントリパスを指すようにします。

    ```json5
    {
      secrets: {
        providers: {
          pass_store: {
            source: "exec",
            command: "/usr/local/bin/openclaw-pass-resolver",
            passEnv: ["PATH", "HOME", "GNUPGHOME", "GPG_TTY", "PASSWORD_STORE_DIR", "PASS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "pass_store",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    シークレットは `pass` エントリの 1 行目に保持してください。代わりに完全な `pass show` 出力を返したい場合は、ラッパーをカスタマイズします。設定を更新した後、静的監査と exec リゾルバーパスの両方を検証します。

    ```bash
    openclaw secrets audit --check
    openclaw secrets audit --allow-exec
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
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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

`plugins.entries.acpx.config.mcpServers` 経由で設定される MCP サーバー環境変数は SecretInput をサポートします。これにより、API キーとトークンを平文設定から除外できます。

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

平文文字列値も引き続き機能します。`${MCP_SERVER_API_KEY}` のような環境テンプレート参照と SecretRef オブジェクトは、MCP サーバープロセスが起動される前の gateway 有効化中に解決されます。他の SecretRef サーフェスと同様に、未解決の参照が有効化をブロックするのは、`acpx` Plugin が実質的にアクティブな場合のみです。

## サンドボックス SSH 認証素材

コアの `ssh` サンドボックスバックエンドも、SSH 認証素材向けの SecretRef をサポートします。

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

- OpenClaw は、各 SSH 呼び出し中に遅延解決するのではなく、サンドボックス有効化中にこれらの参照を解決します。
- 解決済みの値は制限付き権限の一時ファイルに書き込まれ、生成された SSH 設定で使用されます。
- 有効なサンドボックスバックエンドが `ssh` でない場合、これらの参照は非アクティブのままで、起動をブロックしません。

## サポートされる認証情報サーフェス

正規のサポート対象およびサポート対象外の認証情報は、次に一覧化されています。

- [SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)

<Note>
ランタイムで発行される認証情報、ローテーションされる認証情報、OAuth 更新素材は、読み取り専用の SecretRef 解決から意図的に除外されています。
</Note>

## 必須動作と優先順位

- ref のないフィールド: 変更なし。
- ref のあるフィールド: 有効化中のアクティブサーフェスでは必須。
- 平文と ref の両方が存在する場合、サポートされる優先順位パスでは ref が優先されます。
- リダクションセンチネル `__OPENCLAW_REDACTED__` は内部設定のリダクション/復元用に予約されており、送信された設定データのリテラルとしては拒否されます。

警告と監査シグナル:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (ランタイム警告)
- `REF_SHADOWED` (`auth-profiles.json` 認証情報が `openclaw.json` 参照より優先される場合の監査検出)

Google Chat 互換性動作:

- `serviceAccountRef` は平文の `serviceAccount` より優先されます。
- 兄弟 ref が設定されている場合、平文値は無視されます。

## 有効化トリガー

シークレットの有効化は次で実行されます。

- 起動時 (プリフライトと最終有効化)
- 設定リロードのホット適用パス
- 設定リロードの再起動チェックパス
- `secrets.reload` 経由の手動リロード
- 編集を永続化する前に、送信された設定ペイロード内のアクティブサーフェス SecretRef 解決可能性を確認する Gateway 設定書き込み RPC プリフライト (`config.set` / `config.apply` / `config.patch`)

有効化契約:

- 成功時はスナップショットをアトミックに入れ替えます。
- 起動失敗時は gateway 起動を中止します。
- ランタイムリロード失敗時は、最後に正常だったスナップショットを保持します。
- 書き込み RPC プリフライト失敗時は、送信された設定を拒否し、ディスク上の設定とアクティブなランタイムスナップショットの両方を変更しません。
- 送信ヘルパー/ツール呼び出しに明示的な呼び出しごとのチャネルトークンを提供しても、SecretRef 有効化はトリガーされません。有効化ポイントは起動、リロード、明示的な `secrets.reload` のままです。

## 低下状態と復旧シグナル

健全な状態の後にリロード時の有効化が失敗すると、OpenClaw は低下したシークレット状態に入ります。

ワンショットシステムイベントとログコード:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

動作:

- 低下状態: ランタイムは最後に正常だったスナップショットを保持します。
- 復旧: 次に有効化が成功した後に 1 回だけ発行されます。
- すでに低下状態の間に失敗が繰り返される場合、警告をログに記録しますが、イベントを大量発行しません。
- 起動時のフェイルファストでは、ランタイムが一度もアクティブになっていないため、低下イベントは発行されません。

## コマンドパス解決

コマンドパスは、gateway スナップショット RPC 経由でサポートされる SecretRef 解決にオプトインできます。

大きく分けて 2 つの動作があります。

<Tabs>
  <Tab title="厳密なコマンドパス">
    例として、リモートメモリパスの `openclaw memory` や、リモート共有シークレット参照が必要な場合の `openclaw qr --remote` があります。これらはアクティブなスナップショットから読み取り、必要な SecretRef が利用できない場合は即座に失敗します。
  </Tab>
  <Tab title="読み取り専用コマンドパス">
    例として、`openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve`、`openclaw security audit`、読み取り専用の doctor/config 修復フローがあります。これらもアクティブなスナップショットを優先しますが、そのコマンドパスで対象の SecretRef が利用できない場合は、中止せずに縮退します。

    読み取り専用の動作:

    - Gateway が実行中の場合、これらのコマンドはまずアクティブなスナップショットから読み取ります。
    - Gateway 解決が不完全な場合、または Gateway が利用できない場合は、特定のコマンドサーフェスに対して対象を絞ったローカルフォールバックを試みます。
    - 対象の SecretRef がまだ利用できない場合、コマンドは縮退した読み取り専用出力と、「このコマンドパスでは設定済みだが利用不可」のような明示的な診断を出して続行します。
    - この縮退動作はコマンドローカルに限られます。ランタイムの起動、リロード、送信/auth パスを弱めるものではありません。

  </Tab>
</Tabs>

その他の注意:

- バックエンドのシークレットローテーション後のスナップショット更新は、`openclaw secrets reload` によって処理されます。
- これらのコマンドパスで使用される Gateway RPC メソッド: `secrets.resolve`。

## 監査と設定のワークフロー

デフォルトのオペレーターフロー:

<Steps>
  <Step title="現在の状態を監査">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="SecretRef を設定して適用">
    ```bash
    openclaw secrets configure --apply
    ```
  </Step>
  <Step title="再監査">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

再監査がクリーンになるまで、移行が完了したと扱わないでください。監査で
保存時のプレーンテキスト値がまだ報告される場合、ランタイム API が編集済みの値を返していても、
エージェントアクセスリスクはまだ存在します。

`configure` 中に適用せずにプランを保存した場合は、再監査の前に
`openclaw secrets apply --from <plan-path>` でその保存済みプランを適用してください。

<AccordionGroup>
  <Accordion title="secrets audit">
    検出内容には次が含まれます:

    - 保存時のプレーンテキスト値（`openclaw.json`、`auth-profiles.json`、`.env`、生成された `agents/*/agent/models.json`）
    - 生成された `models.json` エントリ内のプレーンテキストの機密プロバイダーヘッダー残存
    - 未解決の参照
    - 優先順位による覆い隠し（`auth-profiles.json` が `openclaw.json` の参照より優先される）
    - レガシー残存（`auth.json`、OAuth リマインダー）

    exec に関する注意:

    - デフォルトでは、コマンドの副作用を避けるため、監査は exec SecretRef の解決可能性チェックをスキップします。
    - 監査中に exec プロバイダーを実行するには、`openclaw secrets audit --allow-exec` を使用します。

    ヘッダー残存に関する注意:

    - 機密プロバイダーヘッダーの検出は、名前ヒューリスティックに基づきます（一般的な auth/credential ヘッダー名、および `authorization`、`x-api-key`、`token`、`secret`、`password`、`credential` などの断片）。

  </Accordion>
  <Accordion title="secrets configure">
    次を行う対話型ヘルパーです:

    - まず `secrets.providers` を設定します（`env`/`file`/`exec`、追加/編集/削除）
    - 1 つのエージェントスコープについて、`openclaw.json` と `auth-profiles.json` 内の、サポートされているシークレット保持フィールドを選択できます
    - ターゲットピッカー内で新しい `auth-profiles.json` マッピングを直接作成できます
    - SecretRef の詳細（`source`、`provider`、`id`）を取得します
    - プリフライト解決を実行します
    - すぐに適用できます

    exec に関する注意:

    - `--allow-exec` が設定されていない限り、プリフライトは exec SecretRef チェックをスキップします。
    - `configure --apply` から直接適用し、プランに exec 参照/プロバイダーが含まれる場合は、適用ステップでも `--allow-exec` を設定したままにしてください。

    便利なモード:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    `configure` の適用デフォルト:

    - 対象プロバイダーについて、`auth-profiles.json` から一致する静的認証情報を消去します
    - `auth.json` からレガシーの静的 `api_key` エントリを消去します
    - `<config-dir>/.env` から一致する既知のシークレット行を消去します

  </Accordion>
  <Accordion title="secrets apply">
    保存済みプランを適用します:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    exec に関する注意:

    - `--allow-exec` が設定されていない限り、dry-run は exec チェックをスキップします。
    - 書き込みモードでは、`--allow-exec` が設定されていない限り、exec SecretRefs/プロバイダーを含むプランは拒否されます。

    厳密なターゲット/パス契約の詳細と正確な拒否ルールについては、[Secrets Apply Plan Contract](/ja-JP/gateway/secrets-plan-contract) を参照してください。

  </Accordion>
</AccordionGroup>

## 一方向の安全ポリシー

<Warning>
OpenClaw は、過去のプレーンテキストシークレット値を含むロールバックバックアップを意図的に書き込みません。
</Warning>

安全モデル:

- 書き込みモードの前にプリフライトが成功している必要があります
- コミット前にランタイムの有効化が検証されます
- apply はアトミックなファイル置換と、失敗時のベストエフォート復元を使ってファイルを更新します

## レガシー auth 互換性に関する注意

静的認証情報について、ランタイムはプレーンテキストのレガシー auth ストレージに依存しなくなりました。

- ランタイム認証情報のソースは、解決済みのインメモリスナップショットです。
- レガシーの静的 `api_key` エントリは、検出時に消去されます。
- OAuth 関連の互換性動作は別個のままです。

## Web UI に関する注意

一部の SecretInput union は、フォームモードより raw editor モードの方が設定しやすい場合があります。

## 関連

- [認証](/ja-JP/gateway/authentication) — auth セットアップ
- [CLI: secrets](/ja-JP/cli/secrets) — CLI コマンド
- [環境変数](/ja-JP/help/environment) — 環境の優先順位
- [SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface) — 認証情報サーフェス
- [Secrets Apply Plan Contract](/ja-JP/gateway/secrets-plan-contract) — プラン契約の詳細
- [セキュリティ](/ja-JP/gateway/security) — セキュリティ態勢

---
read_when:
    - プロバイダー認証情報と `auth-profiles.json` 参照のための SecretRefs の設定
    - 本番環境でシークレットのリロード、監査、設定、適用を安全に運用する
    - 起動時のフェイルファスト、非アクティブなサーフェスのフィルタリング、last-known-good 動作を理解する
sidebarTitle: Secrets management
summary: 'シークレット管理: SecretRef コントラクト、ランタイムスナップショットの動作、安全な一方向スクラブ'
title: シークレット管理
x-i18n:
    generated_at: "2026-07-05T11:27:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe9349dd27755288ca7fd389c17e640fd55ff98587cbed783683be35b43eba7d
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw は加算的な SecretRef をサポートしているため、対応している認証情報を設定内に平文で置く必要はありません。

<Note>
平文も引き続き機能します。SecretRef は認証情報ごとにオプトインです。
</Note>

<Warning>
平文の認証情報は、`openclaw.json`、`auth-profiles.json`、`.env`、生成された `agents/*/agent/models.json` ファイルなど、エージェントが検査できるファイル内にある場合、引き続きエージェントから読み取り可能です。SecretRef がローカルの影響範囲を縮小するのは、対応しているすべての認証情報が移行され、`openclaw secrets audit --check` が平文の残存なしを報告した後だけです。
</Warning>

## ランタイムモデル

- シークレットは、リクエストパス上で遅延解決されるのではなく、アクティベーション中に即時に、メモリ内ランタイムスナップショットへ解決されます。
- 実質的にアクティブな SecretRef を解決できない場合、起動は早期に失敗します。
- リロードはアトミックな差し替えです。完全に成功するか、最後に正常だったスナップショットを維持します。
- ポリシー違反（たとえば OAuth モードの認証プロファイルと SecretRef 入力の組み合わせ）は、ランタイム差し替えの前にアクティベーションを失敗させます。
- ランタイムリクエストは、アクティブなメモリ内スナップショットだけを読み取ります。送信配信パス（Discord の返信/スレッド配信、Telegram アクション送信）もそのスナップショットを読み取り、送信ごとに ref を再解決しません。

これにより、シークレットプロバイダーの停止がホットなリクエストパスに影響しません。

## エージェントアクセス境界

SecretRef は、認証情報が設定や生成されたモデルファイルに永続化されることを防ぎますが、プロセス分離境界ではありません。エージェントが読み取れるパスのディスク上に平文の認証情報が残っている場合、API レベルの秘匿化を迂回して、ファイルまたはシェルツール経由で引き続き読み取り可能です。

エージェントがアクセス可能なファイルが対象範囲に含まれる本番デプロイでは、次のすべてが満たされている場合にのみ移行完了とみなしてください。

- 対応している認証情報は、平文値の代わりに SecretRef を使用している。
- レガシーな平文の残存が、`openclaw.json`、`auth-profiles.json`、`.env`、生成された `models.json` ファイルから削除されている。
- 移行後に `openclaw secrets audit --check` がクリーンである。
- 残っている未対応またはローテーション対象の認証情報は、OS 分離、コンテナ分離、または外部認証情報プロキシで保護されている。

このため、audit/configure/apply ワークフローは単なる便利なヘルパーではなく、セキュリティ移行ゲートです。

<Warning>
SecretRef は、任意の読み取り可能ファイルを安全にするものではありません。バックアップ、コピーされた設定、古い生成済みモデルカタログ、未対応の認証情報クラスは、削除されるか、エージェントの信頼境界の外へ移動されるか、個別に分離されるまで、本番シークレットのままです。
</Warning>

## アクティブサーフェスのフィルタリング

SecretRef は、実質的にアクティブなサーフェスでのみ検証されます。

- **有効なサーフェス**: 未解決の ref は起動/リロードをブロックします。
- **非アクティブなサーフェス**: 未解決の ref は起動/リロードをブロックせず、非致命的な `SECRETS_REF_IGNORED_INACTIVE_SURFACE` 診断を出力します。

<Accordion title="非アクティブなサーフェスの例">
- 無効化されたチャンネル/アカウント項目。
- 有効なアカウントが継承しないトップレベルのチャンネル認証情報。
- 無効化されたツール/機能サーフェス。
- `tools.web.search.provider` で選択されていない Web 検索プロバイダー固有のキー。自動モード（プロバイダー未設定）では、いずれかが解決されるまで自動検出のために優先順位に従ってキーが参照されます。選択後、選択されなかったプロバイダーキーは非アクティブになります。
- サンドボックス SSH 認証素材（`agents.defaults.sandbox.ssh.identityData`、`certificateData`、`knownHostsData`、およびエージェントごとの上書き）は、有効なサンドボックスバックエンドが `ssh` で、サンドボックスモードが `off` ではなく、デフォルトエージェントまたは有効なエージェントに対する場合にのみアクティブです。
- `gateway.remote.token` / `gateway.remote.password` SecretRef は、次のいずれかが成り立つ場合にアクティブです。
  - `gateway.mode=remote`
  - `gateway.remote.url` が設定されている
  - `gateway.tailscale.mode` が `serve` または `funnel` である
  - これらのリモートサーフェスがないローカルモード: トークン認証が勝ち得て、env/認証トークンが設定されていない場合、`gateway.remote.token` はアクティブです。パスワード認証が勝ち得て、env/認証パスワードが設定されていない場合にのみ、`gateway.remote.password` はアクティブです。
- `OPENCLAW_GATEWAY_TOKEN` が設定されている場合、`gateway.auth.token` SecretRef は起動時の認証解決では非アクティブです。そのランタイムでは env トークン入力が優先されるためです。

</Accordion>

## Gateway 認証サーフェス診断

SecretRef が `gateway.auth.token`、`gateway.auth.password`、`gateway.remote.token`、または `gateway.remote.password` に設定されている場合、Gateway の起動/リロードはコード `SECRETS_GATEWAY_AUTH_SURFACE` でサーフェス状態をログに記録します。

- `active`: SecretRef は有効な認証サーフェスの一部であり、解決される必要があります。
- `inactive`: 別の認証サーフェスが優先されている、またはリモート認証が無効/非アクティブです。

ログエントリには、アクティブサーフェスポリシーが使用した理由が含まれます。

## オンボーディング参照の事前検証

対話型オンボーディングで SecretRef ストレージを選択すると、保存前に事前検証が実行されます。

- Env ref: env var 名を検証し、セットアップ中に空でない値が見えていることを確認します。
- Provider ref（`file` または `exec`）: プロバイダー選択を検証し、`id` を解決して、解決された値の型を確認します。
- クイックスタートフロー: `gateway.auth.token` がすでに SecretRef の場合、オンボーディングは probe/dashboard bootstrap の前に、同じ fail-fast ゲートを使用してそれを解決します（`env`、`file`、`exec` ref）。

検証に失敗するとエラーが表示され、再試行できます。

## SecretRef 契約

どこでも 1 つのオブジェクト形状です。

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    SecretInput フィールドでは短縮文字列も受け付けます。

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
    - `id` は絶対 JSON pointer（`/...`）であるか、`singleValue` プロバイダーではリテラル `value` である必要があります
    - セグメント内の RFC 6901 エスケープ: `~` は `~0` に、`/` は `~1` になります

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    検証:

    - `provider` は `^[a-z][a-z0-9_-]{0,63}$` に一致する必要があります
    - `id` は `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` に一致する必要があります（`secret#json_key` などのセレクターをサポートします）
    - `id` には、スラッシュ区切りのパスセグメントとして `.` または `..` を含めてはいけません（たとえば `a/../b` は拒否されます）

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

<Accordion title="Env プロバイダー">
- `allowlist` による任意の完全一致名 allowlist。
- env 値がない、または空の場合、解決は失敗します。

</Accordion>

<Accordion title="File プロバイダー">
- `path` のローカルファイルを読み取ります。
- `mode: "json"`（デフォルト）は JSON オブジェクトペイロードを想定し、`id` を JSON pointer として解決します。
- `mode: "singleValue"` は ref id `"value"` を想定し、生のファイル内容（末尾の改行は除去）を返します。
- パスは所有権/権限チェックに合格する必要があります。`timeoutMs`（デフォルト 5000）と `maxBytes`（デフォルト 1 MiB）が読み取りを制限します。
- Windows は fail-closed です。パスの ACL 検証が利用できない場合、解決は失敗します。信頼済みパスに限り、そのプロバイダーで `allowInsecurePath: true` を設定してチェックを迂回できます。

</Accordion>

<Accordion title="Exec プロバイダー">
- 設定された絶対バイナリパスを直接実行します。シェルは使用しません。
- デフォルトでは、`command` はシンボリックリンクではなく通常ファイルである必要があります。シンボリックリンクのコマンドパス（たとえば Homebrew shim）を許可するには `allowSymlinkCommand: true` を設定し、`trustedDirs`（たとえば `["/opt/homebrew"]`）と組み合わせて、パッケージマネージャーパスだけが対象になるようにします。
- `timeoutMs`（デフォルト 5000）、`noOutputTimeoutMs`（デフォルトは `timeoutMs` と同じ）、`maxOutputBytes`（デフォルト 1 MiB）、`env`/`passEnv` allowlist、`trustedDirs` をサポートします。
- `jsonOnly` のデフォルトは `true` です。`jsonOnly: false` でリクエストされた id が 1 つだけの場合、プレーンな非 JSON stdout がその id の値として受け付けられます。
- Windows は fail-closed です。コマンドパスの ACL 検証が利用できない場合、解決は失敗します。信頼済みパスに限り、そのプロバイダーで `allowInsecurePath: true` を設定してチェックを迂回できます。
- Plugin 管理の exec プロバイダーは、コピーされた `command`/`args` の代わりに `pluginIntegration` を使用できます。OpenClaw は起動/リロード中に、インストール済み Plugin マニフェストから現在のコマンド詳細を解決します。Plugin が無効化、削除、未信頼になっている、またはその統合を宣言しなくなっている場合、そのプロバイダー上のアクティブな SecretRef は fail closed します。

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

## ファイル backed API キー

設定の `env` ブロックに `file:...` 文字列を入れないでください。そのブロックはリテラルであり、上書きもしないため、そこで `file:...` が解決されることはありません。

代わりに、対応している認証情報フィールドでファイル SecretRef を使用してください。

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

`mode: "singleValue"` では、SecretRef `id` は `"value"` です。`mode: "json"` では、`"/providers/xai/apiKey"` のような絶対 JSON pointer を使用します。

SecretRef を受け付けるフィールドについては、[SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface) を参照してください。

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
    SecretRef id を Bitwarden Secrets Manager 項目キーへマップするには、resolver ラッパーを使用します。リポジトリには `scripts/secrets/openclaw-bws-resolver.mjs` が含まれています。Gateway を実行するホスト上の絶対信頼済みパスにインストールまたはコピーしてください。

    要件:

    - Gateway ホストに Bitwarden Secrets Manager CLI (`bws`) がインストールされている。
    - `BWS_ACCESS_TOKEN` が Gateway サービスで利用可能。
    - `PATH` がリゾルバーに渡されている、または `BWS_BIN` が絶対 `bws` バイナリパスに設定されている。
    - セルフホストの Bitwarden インスタンスを使用する場合は、環境で `BWS_SERVER_URL` が設定されている。

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

    リゾルバーは要求された id をバッチ化し、`bws secret list` を実行し、一致するシークレットの `key` フィールドの値を返します。`openclaw/providers/openai/apiKey` のように、exec SecretRef id コントラクトを満たすキーを使用してください。アンダースコアを含む env-var 形式のキーは、リゾルバーの実行前に拒否されます。複数の表示可能な Bitwarden シークレットが要求されたキーを共有している場合、リゾルバーは推測せず、その id を曖昧として失敗させます。config を更新したら、リゾルバーパスを検証します。

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
    SecretRef id を `pass` エントリに直接マッピングする小さなリゾルラーラッパーを使用します。たとえば `/usr/local/bin/openclaw-pass-resolver` のように、exec-provider パスチェックに通る絶対パスに実行可能ファイルとして保存してください。`#!/usr/bin/env node` shebang は、リゾルバープロセスの `PATH` から `node` を解決するため、`passEnv` に `PATH` を含めてください。`pass` がその `PATH` 上にない場合は、親環境で `PASS_BIN` を設定し、それも `passEnv` に含めます。

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

    シークレットは `pass` エントリの最初の行に置くか、代わりに完全な `pass show` 出力を返すようラッパーをカスタマイズしてください。config を更新したら、静的監査と exec リゾルバーパスの両方を検証します。

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

`plugins.entries.acpx.config.mcpServers` 経由で設定される MCP サーバー env var は SecretInput を受け入れ、API キーとトークンを平文 config から除外します。

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

平文の文字列値も引き続き機能します。`${MCP_SERVER_API_KEY}` のような env-template ref と SecretRef オブジェクトは、MCP サーバープロセスが起動する前の gateway activation 中に解決されます。他の SecretRef surface と同様に、未解決の ref は `acpx` Plugin が実質的にアクティブな場合にのみ activation をブロックします。

## Sandbox SSH 認証マテリアル

コアの `ssh` sandbox バックエンドも、SSH 認証マテリアル用の SecretRef をサポートします。

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

ランタイムの動作:

- OpenClaw は、SSH 呼び出しごとに遅延解決するのではなく、sandbox activation 中にこれらの ref を解決します。
- 解決済みの値は制限付きファイル権限 (`0o600`) で一時ディレクトリに書き込まれ、生成された SSH config で使用されます。
- 実効 sandbox バックエンドが `ssh` でない場合、または sandbox mode が `off` の場合、これらの ref は非アクティブのままで、起動をブロックしません。

## サポートされる認証情報 surface

標準のサポート対象および非サポート対象の認証情報は、[SecretRef 認証情報 surface](/ja-JP/reference/secretref-credential-surface) に記載されています。

<Note>
ランタイムで発行される認証情報やローテーションされる認証情報、および OAuth refresh マテリアルは、読み取り専用 SecretRef 解決から意図的に除外されています。
</Note>

## 必須の動作と優先順位

- ref のないフィールド: 変更なし。
- ref のあるフィールド: active surface では activation 中に必須。
- 平文と ref の両方が存在する場合、サポートされる優先パスでは ref が優先されます。
- redaction sentinel `__OPENCLAW_REDACTED__` は内部 config の redaction/restore 用に予約されており、literal submitted config data としては拒否されます。

警告および監査シグナル:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (ランタイム警告)
- `REF_SHADOWED` (`auth-profiles.json` 認証情報が `openclaw.json` ref より優先される場合の監査 finding)

Google Chat 互換性: `serviceAccountRef` は平文の `serviceAccount` より優先されます。兄弟 ref が設定されると、平文値は無視されます。

## Activation トリガー

Secret activation は次で実行されます。

- Startup (preflight と最終 activation)
- Config reload hot-apply path
- Config reload restart-check path
- `secrets.reload` による手動 reload
- Gateway config write RPC preflight (`config.set` / `config.apply` / `config.patch`)。編集を永続化する前に、送信された config payload 内で active-surface SecretRef が解決可能かをチェックします

Activation コントラクト:

- 成功すると snapshot がアトミックに入れ替わります。
- Startup failure は gateway startup を中止します。
- Runtime reload failure は last-known-good snapshot を保持します。
- Write-RPC preflight failure は送信された config を拒否します。disk config と active runtime snapshot はどちらも変更されません。
- outbound helper/tool call に明示的な per-call channel token を渡しても SecretRef activation はトリガーされません。activation point は startup、reload、明示的な `secrets.reload` のままです。

## Degraded と recovered のシグナル

正常状態の後に reload-time activation が失敗すると、OpenClaw は degraded secrets state に入り、ワンショットの system event と log code を発行します。

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

動作:

- Degraded: ランタイムは last-known-good snapshot を保持します。
- Recovered: 次の activation 成功後に一度だけ発行されます。
- すでに degraded の間に失敗が繰り返される場合は警告をログに出しますが、イベントは再発行しません。
- Startup fail-fast は degraded event を発行しません。ランタイムが一度も active になっていないためです。

## コマンドパス解決

Command path は、Gateway snapshot RPC を介して、サポートされる SecretRef 解決にオプトインできます。大きく 2 つの動作があります。

<Tabs>
  <Tab title="厳格なコマンドパス">
    たとえば、`openclaw memory` remote-memory path や、remote shared-secret ref が必要な場合の `openclaw qr --remote` です。これらは active snapshot から読み取り、必要な SecretRef が利用できない場合は即座に失敗します。
  </Tab>
  <Tab title="読み取り専用コマンドパス">
    たとえば、`openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve`、`openclaw security audit`、および読み取り専用の doctor/config repair flow です。これらも active snapshot を優先しますが、対象の SecretRef が利用できない場合は中止せず degraded になります。

    読み取り専用の動作:

    - Gateway が実行中の場合、これらのコマンドはまず active snapshot から読み取ります。
    - Gateway 解決が不完全、または Gateway が利用できない場合、その command surface に対して対象を絞ったローカル fallback を試みます。
    - 対象の SecretRef がまだ利用できない場合、コマンドは degraded read-only output と、その ref が設定されているがこの command path では利用できないことを示す明示的な diagnostic とともに続行します。
    - この degraded behavior は command-local のみです。runtime startup、reload、send/auth path を弱めるものではありません。

  </Tab>
</Tabs>

その他の注意:

- backend secret rotation 後の snapshot refresh は `openclaw secrets reload` によって処理されます。
- これらの command path が使用する Gateway RPC method: `secrets.resolve`。

## 監査と configure ワークフロー

デフォルトの operator flow:

<Steps>
  <Step title="現在の状態を監査する">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="SecretRefs を設定して適用する">
    ```bash
    openclaw secrets configure --apply
    ```
  </Step>
  <Step title="再監査する">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

再監査がクリーンになるまで、移行が完了したものとして扱わないでください。監査で保存時の平文値がまだ報告される場合、runtime API が墨消し済みの値を返していても、エージェントアクセスのリスクは残ります。

`configure` 中に適用せずにプランを保存した場合は、再監査の前に `openclaw secrets apply --from <plan-path>` でその保存済みプランを適用してください。

<AccordionGroup>
  <Accordion title="secrets audit">
    検出項目には以下が含まれます。

    - 保存時の平文値（`openclaw.json`、`auth-profiles.json`、`.env`、生成された `agents/*/agent/models.json`）。
    - 生成された `models.json` エントリ内に残った、機密性の高いプロバイダー header の平文。
    - 未解決の ref。
    - 優先順位によるシャドーイング（`auth-profiles.json` が `openclaw.json` の ref より優先される）。
    - レガシー残留物（`auth.json`、OAuth リマインダー）。

    exec 注記: デフォルトでは、audit はコマンドの副作用を避けるため、exec SecretRef の解決可能性チェックをスキップします。監査中に exec プロバイダーを実行するには `openclaw secrets audit --allow-exec` を使用してください。

    header 残留物の注記: 機密性の高いプロバイダー header の検出は、名前ヒューリスティックに基づきます（一般的な認証/認可情報 header 名、および `authorization`、`x-api-key`、`token`、`secret`、`password`、`credential` などの断片）。

  </Accordion>
  <Accordion title="secrets configure">
    対話型ヘルパーは以下を行います。

    - まず `secrets.providers` を設定する（`env`/`file`/`exec`、追加/編集/削除）。
    - 1 つのエージェントスコープについて、`openclaw.json` と `auth-profiles.json` 内のサポート対象の secret 保持フィールドを選択できるようにする。
    - ターゲットピッカー内で新しい `auth-profiles.json` マッピングを直接作成できる。
    - SecretRef の詳細（`source`、`provider`、`id`）を取得する。
    - preflight 解決を実行し、すぐに適用できる。

    exec 注記: `--allow-exec` が設定されていない限り、preflight は exec SecretRef チェックをスキップします。`configure --apply` から直接適用し、プランに exec ref/プロバイダーが含まれる場合は、適用ステップでも `--allow-exec` を設定したままにしてください。

    便利なモード:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    `configure` の適用時デフォルト:

    - 対象プロバイダーについて、`auth-profiles.json` から一致する静的認証情報をスクラブする。
    - `auth.json` からレガシー静的 `api_key` エントリをスクラブする。
    - `<config-dir>/.env` から一致する既知の secret 行をスクラブする。

  </Accordion>
  <Accordion title="secrets apply">
    保存済みプランを適用します。

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    exec 注記: dry-run は `--allow-exec` が設定されていない限り exec チェックをスキップします。書き込みモードは、`--allow-exec` が設定されていない限り、exec SecretRef/プロバイダーを含むプランを拒否します。

    厳密なターゲット/パス契約の詳細と正確な拒否ルールについては、[Secrets Apply Plan Contract](/ja-JP/gateway/secrets-plan-contract) を参照してください。

  </Accordion>
</AccordionGroup>

## 一方向の安全ポリシー

<Warning>
OpenClaw は、過去の平文 secret 値を含むロールバックバックアップを意図的に書き込みません。
</Warning>

安全モデル:

- 書き込みモードの前に preflight が成功している必要があります。
- commit 前に runtime activation が検証されます。
- apply は、atomic なファイル置換と失敗時のベストエフォート復元を使用してファイルを更新します。

## レガシー認証互換性の注記

静的認証情報については、runtime は平文のレガシー認証ストレージに依存しなくなりました。

- runtime の認証情報ソースは、解決済みのインメモリスナップショットです。
- レガシー静的 `api_key` エントリは、検出時にスクラブされます。
- OAuth 関連の互換性動作は別扱いのままです。

## Web UI の注記

一部の SecretInput union は、フォームモードより raw editor mode の方が設定しやすい場合があります。

## 関連

- [認証](/ja-JP/gateway/authentication) - 認証セットアップ
- [CLI: secrets](/ja-JP/cli/secrets) - CLI コマンド
- [環境変数](/ja-JP/help/environment) - 環境の優先順位
- [SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface) - 認証情報サーフェス
- [Secrets Apply Plan Contract](/ja-JP/gateway/secrets-plan-contract) - プラン契約の詳細
- [セキュリティ](/ja-JP/gateway/security) - セキュリティ態勢

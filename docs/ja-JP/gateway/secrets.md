---
read_when:
    - プロバイダー認証情報と `auth-profiles.json` 参照用の SecretRefs の設定
    - 本番環境でシークレットの再読み込み、監査、設定、適用を安全に運用する
    - 起動時のフェイルファスト、非アクティブサーフェスのフィルタリング、最終正常状態の動作を理解する
sidebarTitle: Secrets management
summary: 'シークレット管理: SecretRef 契約、ランタイムスナップショットの動作、安全な一方向スクラブ処理'
title: シークレット管理
x-i18n:
    generated_at: "2026-04-30T05:15:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96fddc346e21cab17d978843dc2a482c6faf8f810b3698a97aa88463133eaca5
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw は、対応する認証情報を設定内に平文で保存しなくて済むように、追加型の SecretRefs をサポートします。

<Note>
平文も引き続き使用できます。SecretRefs は認証情報ごとにオプトインです。
</Note>

## 目標とランタイムモデル

シークレットはメモリ内のランタイムスナップショットに解決されます。

- 解決はリクエストパス上で遅延実行されるのではなく、アクティベーション中に先行して実行されます。
- 実質的にアクティブな SecretRef を解決できない場合、起動は早期に失敗します。
- リロードはアトミックスワップを使用します。完全に成功するか、直近の既知の正常なスナップショットを保持します。
- SecretRef ポリシー違反（たとえば OAuth モードの認証プロファイルと SecretRef 入力の組み合わせ）は、ランタイムスワップ前にアクティベーションを失敗させます。
- ランタイムリクエストは、アクティブなメモリ内スナップショットのみから読み取ります。
- 最初の設定アクティベーション/ロードが成功した後、ランタイムコードパスは、成功したリロードによって差し替えられるまで、そのアクティブなメモリ内スナップショットを読み取り続けます。
- アウトバウンド配信パスも、そのアクティブなスナップショットから読み取ります（たとえば Discord の返信/スレッド配信や Telegram のアクション送信）。送信ごとに SecretRefs を再解決しません。

これにより、シークレットプロバイダーの停止がホットなリクエストパスに影響しないようにします。

## アクティブサーフェスのフィルタリング

SecretRefs は、実質的にアクティブなサーフェスでのみ検証されます。

- 有効なサーフェス: 未解決の参照は起動/リロードをブロックします。
- 非アクティブなサーフェス: 未解決の参照は起動/リロードをブロックしません。
- 非アクティブな参照は、コード `SECRETS_REF_IGNORED_INACTIVE_SURFACE` で致命的ではない診断を出力します。

<AccordionGroup>
  <Accordion title="非アクティブなサーフェスの例">
    - 無効なチャンネル/アカウントエントリ。
    - 有効なアカウントに継承されないトップレベルのチャンネル認証情報。
    - 無効なツール/機能サーフェス。
    - `tools.web.search.provider` で選択されていない Web 検索プロバイダー固有のキー。自動モード（プロバイダー未設定）では、いずれかが解決されるまで、プロバイダー自動検出の優先順位に従ってキーが参照されます。選択後、未選択のプロバイダーキーは、選択されるまで非アクティブとして扱われます。
    - Sandbox SSH 認証材料（`agents.defaults.sandbox.ssh.identityData`、`certificateData`、`knownHostsData`、およびエージェントごとのオーバーライド）は、デフォルトエージェントまたは有効なエージェントの有効な sandbox バックエンドが `ssh` の場合にのみアクティブです。
    - `gateway.remote.token` / `gateway.remote.password` SecretRefs は、次のいずれかが true の場合にアクティブです。
      - `gateway.mode=remote`
      - `gateway.remote.url` が設定されている
      - `gateway.tailscale.mode` が `serve` または `funnel`
      - これらのリモートサーフェスがないローカルモード:
        - `gateway.remote.token` は、トークン認証が勝つ可能性があり、env/auth トークンが設定されていない場合にアクティブです。
        - `gateway.remote.password` は、パスワード認証が勝つ可能性があり、env/auth パスワードが設定されていない場合にのみアクティブです。
    - `OPENCLAW_GATEWAY_TOKEN` が設定されている場合、`gateway.auth.token` SecretRef は起動時の認証解決では非アクティブです。そのランタイムでは環境変数のトークン入力が優先されるためです。

  </Accordion>
</AccordionGroup>

## Gateway 認証サーフェス診断

`gateway.auth.token`、`gateway.auth.password`、`gateway.remote.token`、または `gateway.remote.password` に SecretRef が設定されている場合、Gateway の起動/リロードはサーフェス状態を明示的にログに記録します。

- `active`: SecretRef は有効な認証サーフェスの一部であり、解決される必要があります。
- `inactive`: 別の認証サーフェスが優先されるか、リモート認証が無効/非アクティブであるため、このランタイムでは SecretRef が無視されます。

これらのエントリは `SECRETS_GATEWAY_AUTH_SURFACE` とともにログに記録され、アクティブサーフェスポリシーで使用された理由を含みます。そのため、認証情報がアクティブまたは非アクティブとして扱われた理由を確認できます。

## オンボーディング参照プリフライト

オンボーディングがインタラクティブモードで実行され、SecretRef ストレージを選択した場合、OpenClaw は保存前にプリフライト検証を実行します。

- Env 参照: env var 名を検証し、セットアップ中に空でない値が見えることを確認します。
- プロバイダー参照（`file` または `exec`）: プロバイダー選択を検証し、`id` を解決し、解決された値の型を確認します。
- クイックスタート再利用パス: `gateway.auth.token` がすでに SecretRef の場合、オンボーディングは同じ fail-fast ゲートを使用して、プローブ/ダッシュボードのブートストラップ前にそれを解決します（`env`、`file`、`exec` 参照）。

検証が失敗した場合、オンボーディングはエラーを表示し、再試行できるようにします。

## SecretRef コントラクト

どこでも同じオブジェクト形状を使用します。

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
    - `id` は絶対 JSON ポインター（`/...`）である必要があります
    - セグメント内の RFC6901 エスケープ: `~` => `~0`、`/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey" }
    ```

    検証:

    - `provider` は `^[a-z][a-z0-9_-]{0,63}$` に一致する必要があります
    - `id` は `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$` に一致する必要があります
    - `id` には、スラッシュで区切られたパスセグメントとして `.` または `..` を含めてはいけません（たとえば `a/../b` は拒否されます）

  </Tab>
</Tabs>

## プロバイダー設定

`secrets.providers` の下でプロバイダーを定義します。

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
    - env 値が存在しない、または空の場合、解決は失敗します。

  </Accordion>
  <Accordion title="File プロバイダー">
    - `path` からローカルファイルを読み取ります。
    - `mode: "json"` は JSON オブジェクトペイロードを想定し、`id` をポインターとして解決します。
    - `mode: "singleValue"` は参照 ID `"value"` を想定し、ファイル内容を返します。
    - パスは所有者/権限チェックに合格する必要があります。
    - Windows の fail-closed に関する注意: パスの ACL 検証を利用できない場合、解決は失敗します。信頼できるパスに限り、そのプロバイダーで `allowInsecurePath: true` を設定してパスセキュリティチェックをバイパスできます。

  </Accordion>
  <Accordion title="Exec プロバイダー">
    - 設定された絶対バイナリパスを、シェルなしで実行します。
    - デフォルトでは、`command` は通常ファイル（シンボリックリンクではないもの）を指す必要があります。
    - シンボリックリンクのコマンドパス（たとえば Homebrew shims）を許可するには、`allowSymlinkCommand: true` を設定します。OpenClaw は解決後のターゲットパスを検証します。
    - パッケージマネージャーのパス（たとえば `["/opt/homebrew"]`）では、`allowSymlinkCommand` を `trustedDirs` と組み合わせます。
    - タイムアウト、出力なしタイムアウト、出力バイト制限、env 許可リスト、信頼済みディレクトリをサポートします。
    - Windows の fail-closed に関する注意: コマンドパスの ACL 検証を利用できない場合、解決は失敗します。信頼できるパスに限り、そのプロバイダーで `allowInsecurePath: true` を設定してパスセキュリティチェックをバイパスできます。

    リクエストペイロード（stdin）:

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    レスポンスペイロード（stdout）:

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

`plugins.entries.acpx.config.mcpServers` 経由で設定された MCP サーバー env vars は SecretInput をサポートします。これにより、API キーとトークンを平文設定から外せます。

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

平文文字列値も引き続き使用できます。`${MCP_SERVER_API_KEY}` のような env テンプレート参照と SecretRef オブジェクトは、MCP サーバープロセスが生成される前の Gateway アクティベーション中に解決されます。他の SecretRef サーフェスと同様に、未解決の参照がアクティベーションをブロックするのは、`acpx` plugin が実質的にアクティブな場合のみです。

## Sandbox SSH 認証材料

コアの `ssh` sandbox バックエンドも、SSH 認証材料の SecretRefs をサポートします。

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

- OpenClaw は、各 SSH 呼び出しのたびに遅延してではなく、サンドボックスのアクティベーション中にこれらの ref を解決します。
- 解決された値は、制限付き権限の一時ファイルに書き込まれ、生成された SSH 設定で使用されます。
- 有効なサンドボックスバックエンドが `ssh` でない場合、これらの ref は非アクティブのままで、起動をブロックしません。

## サポートされる認証情報サーフェス

正規のサポート対象および非サポート対象の認証情報は、次に一覧されています。

- [SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)

<Note>
ランタイムで発行される認証情報、ローテーションされる認証情報、OAuth 更新用の情報は、読み取り専用の SecretRef 解決から意図的に除外されています。
</Note>

## 必須の動作と優先順位

- ref のないフィールド: 変更なし。
- ref のあるフィールド: アクティベーション中、アクティブなサーフェスでは必須。
- 平文と ref の両方が存在する場合、サポートされる優先順位パスでは ref が優先されます。
- リダクションセンチネル `__OPENCLAW_REDACTED__` は、内部設定のリダクション/復元用に予約されており、送信された設定データのリテラル値としては拒否されます。

警告および監査シグナル:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (ランタイム警告)
- `REF_SHADOWED` (`auth-profiles.json` の認証情報が `openclaw.json` の ref より優先される場合の監査検出)

Google Chat 互換性動作:

- `serviceAccountRef` は平文の `serviceAccount` より優先されます。
- 兄弟 ref が設定されている場合、平文値は無視されます。

## アクティベーショントリガー

シークレットのアクティベーションは次で実行されます。

- 起動時 (プリフライトと最終アクティベーション)
- 設定リロードのホット適用パス
- 設定リロードの再起動チェックパス
- `secrets.reload` による手動リロード
- 編集を永続化する前に、送信された設定ペイロード内でアクティブサーフェスの SecretRef が解決可能か確認する Gateway 設定書き込み RPC プリフライト (`config.set` / `config.apply` / `config.patch`)

アクティベーション契約:

- 成功するとスナップショットをアトミックに差し替えます。
- 起動失敗は Gateway の起動を中止します。
- ランタイムリロードの失敗時は、最後に正常だったスナップショットを維持します。
- 書き込み RPC プリフライトの失敗時は、送信された設定を拒否し、ディスク上の設定とアクティブなランタイムスナップショットの両方を変更しません。
- アウトバウンドのヘルパー/ツール呼び出しに明示的な呼び出し単位のチャネル token を指定しても、SecretRef アクティベーションはトリガーされません。アクティベーションポイントは、起動、リロード、明示的な `secrets.reload` のままです。

## 低下状態と回復シグナル

正常状態の後にリロード時アクティベーションが失敗すると、OpenClaw はシークレット低下状態に入ります。

ワンショットのシステムイベントおよびログコード:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

動作:

- 低下状態: ランタイムは最後に正常だったスナップショットを維持します。
- 回復: 次回のアクティベーション成功後に一度だけ発行されます。
- すでに低下状態の間に失敗が繰り返されても警告はログに記録されますが、イベントは大量発行されません。
- 起動時のフェイルファストでは、ランタイムが一度もアクティブになっていないため、低下イベントは発行されません。

## コマンドパスの解決

コマンドパスは、Gateway スナップショット RPC 経由で、サポートされる SecretRef 解決をオプトインできます。

大きく分けて 2 種類の動作があります。

<Tabs>
  <Tab title="Strict command paths">
    たとえば、`openclaw memory` のリモートメモリーパス、およびリモート共有シークレット ref が必要な場合の `openclaw qr --remote` です。これらはアクティブなスナップショットから読み取り、必須の SecretRef が利用できない場合はフェイルファストします。
  </Tab>
  <Tab title="Read-only command paths">
    たとえば、`openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve`、`openclaw security audit`、および読み取り専用の doctor/設定修復フローです。これらもアクティブなスナップショットを優先しますが、そのコマンドパスで対象の SecretRef が利用できない場合は、中止せずに低下動作になります。

    読み取り専用の動作:

    - Gateway が実行中の場合、これらのコマンドはまずアクティブなスナップショットから読み取ります。
    - Gateway の解決が不完全な場合、または Gateway が利用できない場合は、特定のコマンドサーフェスに対して対象を絞ったローカルフォールバックを試みます。
    - 対象の SecretRef がそれでも利用できない場合、コマンドは低下した読み取り専用出力と、「このコマンドパスでは設定済みだが利用不可」のような明示的な診断を出して続行します。
    - この低下動作はコマンドローカルのみです。ランタイムの起動、リロード、送信/認証パスを弱めるものではありません。

  </Tab>
</Tabs>

その他の注記:

- バックエンドシークレットのローテーション後のスナップショット更新は、`openclaw secrets reload` によって処理されます。
- これらのコマンドパスで使用される Gateway RPC メソッド: `secrets.resolve`。

## 監査と設定ワークフロー

デフォルトのオペレーターフロー:

<Steps>
  <Step title="現在の状態を監査">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="SecretRef を設定">
    ```bash
    openclaw secrets configure
    ```
  </Step>
  <Step title="再監査">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="secrets audit">
    検出項目には次が含まれます。

    - 保存時の平文値 (`openclaw.json`、`auth-profiles.json`、`.env`、生成された `agents/*/agent/models.json`)
    - 生成された `models.json` エントリ内の平文の機密プロバイダーヘッダー残留物
    - 未解決の ref
    - 優先順位によるシャドーイング (`auth-profiles.json` が `openclaw.json` の ref より優先される)
    - レガシー残留物 (`auth.json`、OAuth リマインダー)

    exec の注記:

    - デフォルトでは、監査はコマンドの副作用を避けるために exec SecretRef の解決可能性チェックをスキップします。
    - 監査中に exec プロバイダーを実行するには、`openclaw secrets audit --allow-exec` を使用します。

    ヘッダー残留物の注記:

    - 機密プロバイダーヘッダーの検出は、名前に基づくヒューリスティックです (一般的な認証/認証情報ヘッダー名、および `authorization`、`x-api-key`、`token`、`secret`、`password`、`credential` などの断片)。

  </Accordion>
  <Accordion title="secrets configure">
    次を行う対話型ヘルパーです。

    - まず `secrets.providers` を設定します (`env`/`file`/`exec`、追加/編集/削除)
    - 1 つのエージェントスコープについて、`openclaw.json` に加えて `auth-profiles.json` 内のサポートされるシークレット保持フィールドを選択できます
    - ターゲットピッカーで新しい `auth-profiles.json` マッピングを直接作成できます
    - SecretRef の詳細 (`source`、`provider`、`id`) を取得します
    - プリフライト解決を実行します
    - すぐに適用できます

    exec の注記:

    - `--allow-exec` が設定されていない限り、プリフライトは exec SecretRef チェックをスキップします。
    - `configure --apply` から直接適用し、計画に exec ref/プロバイダーが含まれる場合は、適用ステップでも `--allow-exec` を設定したままにしてください。

    便利なモード:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    `configure` 適用のデフォルト:

    - 対象プロバイダーについて、`auth-profiles.json` から一致する静的認証情報をスクラブします
    - `auth.json` からレガシーの静的 `api_key` エントリをスクラブします
    - `<config-dir>/.env` から一致する既知のシークレット行をスクラブします

  </Accordion>
  <Accordion title="secrets apply">
    保存済み計画を適用します。

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    exec の注記:

    - dry-run は、`--allow-exec` が設定されていない限り exec チェックをスキップします。
    - 書き込みモードは、`--allow-exec` が設定されていない限り、exec SecretRefs/プロバイダーを含む計画を拒否します。

    厳密なターゲット/パス契約の詳細と正確な拒否ルールについては、[Secrets Apply Plan Contract](/ja-JP/gateway/secrets-plan-contract) を参照してください。

  </Accordion>
</AccordionGroup>

## 一方向の安全ポリシー

<Warning>
OpenClaw は、過去の平文シークレット値を含むロールバックバックアップを意図的に書き込みません。
</Warning>

安全モデル:

- 書き込みモードの前にプリフライトが成功する必要があります
- コミット前にランタイムアクティベーションが検証されます
- 適用は、アトミックなファイル置換と、失敗時のベストエフォート復元を使用してファイルを更新します

## レガシー認証互換性の注記

静的認証情報について、ランタイムは平文のレガシー認証ストレージに依存しなくなりました。

- ランタイム認証情報ソースは、解決済みのインメモリスナップショットです。
- レガシーの静的 `api_key` エントリは、検出時にスクラブされます。
- OAuth 関連の互換性動作は別扱いのままです。

## Web UI の注記

一部の SecretInput union は、フォームモードよりも raw editor モードの方が設定しやすい場合があります。

## 関連

- [認証](/ja-JP/gateway/authentication) — 認証設定
- [CLI: secrets](/ja-JP/cli/secrets) — CLI コマンド
- [環境変数](/ja-JP/help/environment) — 環境の優先順位
- [SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface) — 認証情報サーフェス
- [Secrets Apply Plan Contract](/ja-JP/gateway/secrets-plan-contract) — 計画契約の詳細
- [セキュリティ](/ja-JP/gateway/security) — セキュリティ態勢

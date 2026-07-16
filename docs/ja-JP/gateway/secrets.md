---
read_when:
    - プロバイダーの認証情報と `auth-profiles.json` 参照用の SecretRefs の設定
    - 本番環境でシークレットの再読み込み、監査、設定、適用を安全に運用する
    - 起動時のフェイルファスト、非アクティブなサーフェスのフィルタリング、最終正常状態の動作を理解する
sidebarTitle: Secrets management
summary: シークレット管理：SecretRef コントラクト、ランタイムスナップショットの動作、安全な一方向スクラビング
title: シークレット管理
x-i18n:
    generated_at: "2026-07-16T11:39:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9fbcac081a7b9bd8bc298b9fb2b7437f3bea4dad85338eed7db4cb4db051cfc7
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw は、対応する認証情報を設定内に平文で保存する必要がない、追加型の SecretRef をサポートしています。

<Note>
平文も引き続き使用できます。SecretRef は認証情報ごとにオプトイン方式です。
</Note>

<Warning>
平文の認証情報が、エージェントが調査できるファイル（`openclaw.json`、`auth-profiles.json`、`.env`、または生成された `agents/*/agent/models.json` ファイルを含む）に置かれている場合、エージェントから引き続き読み取れます。SecretRef によってこのローカルでの影響範囲が縮小されるのは、対応するすべての認証情報を移行し、`openclaw secrets audit --check` で平文の残存が報告されなくなった後に限られます。
</Warning>

## ランタイムモデル

- シークレットは、リクエストパスで遅延解決されるのではなく、アクティベーション時に即時解決され、メモリ内のランタイムスナップショットに格納されます。
- 実質的にアクティブな SecretRef を解決できない場合、起動は即座に失敗します。
- 再読み込みはアトミックな入れ替えです。すべて成功するか、最後に正常だったスナップショットを維持します。
- ポリシー違反（たとえば、OAuth モードの認証プロファイルと SecretRef 入力の併用）があると、ランタイムを入れ替える前にアクティベーションが失敗します。
- ランタイムリクエストは、アクティブなメモリ内スナップショットのみを読み取ります。モデルプロバイダーの SecretRef 認証情報は、外部送信されるまで、プロセスローカルなセンチネルとして認証ストレージとストリームオプションを通過します。外部配信パス（Discord の返信／スレッド配信、Telegram のアクション送信）もこのスナップショットを読み取り、送信ごとに参照を再解決しません。

これにより、シークレットプロバイダーの停止が負荷の高いリクエストパスに影響しなくなります。

## 外部送信時の注入（センチネル）

SecretRef によって提供されるモデルプロバイダーの認証情報について、OpenClaw はモデル認証の解決時に、不透明なプロセスローカルのセンチネルを発行します。そのため、認証ストレージ、ストリームオプション、SDK 設定、ログ、エラーオブジェクト、および大部分のランタイム内部調査では、プロバイダーの認証情報ではなく `oc-sent-v1-...` のような値が見えます。保護されたモデルフェッチと、管理対象ローカルプロバイダーのヘルスプローブは、各リクエストがプロセス外へ送信される直前に、URL とヘッダーの値に含まれる既知のセンチネルを置き換えます。

未知のセンチネル形式の値がある場合、ネットワーク処理の前に安全側で失敗します。OpenClaw は、未解決のセンチネルをプロバイダーに転送せず、リクエストの送信を拒否します。多層防御として、解決されたシークレット値は完全一致によるログ秘匿化にも登録されます。

プロバイダーアダプターは、その SDK がサポートする最も遅い注入ポイントを使用します。

- カスタム fetch オプションを持つ SDK には OpenClaw の保護された fetch が渡されるため、SDK 内ではセンチネルが維持されます。
- カスタム fetch オプションを持たない SDK では、クライアントの構築直前にセンチネルを展開します。Plugin が所有するプロバイダーストリームとエージェントハーネスは、これらのトランスポートが OpenClaw の保護された fetch を共有しないため、コアが所有する最終引き渡し地点で展開します。

センチネルはモデル呼び出しチェーン全体における平文の露出を減らしますが、プロセス分離を実現するものではありません。実際の値は同一プロセスのメモリ内に引き続き存在し、最終的なアダプター境界に現れます。SecretRef を通じて設定されていない平文の環境認証情報は、引き続き平文のままであり、この仕組みの対象外です。

インシデント対応または互換性のトラブルシューティング中にセンチネルの発行を無効化するには、`OPENCLAW_SECRET_SENTINELS=off`（大文字と小文字を区別せず、`0` または `false` も使用可能）を設定します。この緊急停止スイッチは、完全一致値による秘匿化への登録を無効化しません。

## エージェントアクセス境界

SecretRef は認証情報が設定や生成されたモデルファイルに永続化されるのを防ぎますが、プロセス分離境界ではありません。エージェントが読み取れるパスのディスク上に平文の認証情報が残っている場合、API レベルの秘匿化を回避して、ファイルツールまたはシェルツールから引き続き読み取れます。

エージェントがアクセス可能なファイルが対象範囲に含まれる本番環境では、次のすべてを満たした場合にのみ移行完了とみなしてください。

- 対応する認証情報で、平文値の代わりに SecretRef を使用している。
- `openclaw.json`、`auth-profiles.json`、`.env`、および生成された `models.json` ファイルから、従来の平文の残存データが消去されている。
- 移行後、`openclaw secrets audit --check` で問題が検出されない。
- 残っている未対応またはローテーション対象の認証情報が、OS 分離、コンテナ分離、または外部認証情報プロキシによって保護されている。

これが、監査／設定／適用ワークフローが単なる便利なヘルパーではなく、セキュリティ移行のゲートである理由です。

<Warning>
SecretRef によって、任意の読み取り可能なファイルが安全になるわけではありません。バックアップ、コピーされた設定、古い生成済みモデルカタログ、および未対応の認証情報クラスは、削除するか、エージェントの信頼境界外へ移動するか、個別に分離するまで、本番環境のシークレットとして扱う必要があります。
</Warning>

## アクティブサーフェスのフィルタリング

SecretRef は、実質的にアクティブなサーフェスでのみ検証されます。

- **有効なサーフェス**：未解決の参照があると、起動／再読み込みがブロックされます。
- **非アクティブなサーフェス**：未解決の参照があっても、起動／再読み込みはブロックされません。致命的でない `SECRETS_REF_IGNORED_INACTIVE_SURFACE` 診断が出力されます。

<Accordion title="非アクティブなサーフェスの例">
- 無効化されたチャンネル／アカウントのエントリ。
- 有効なアカウントが継承していない、トップレベルのチャンネル認証情報。
- 無効化されたツール／機能のサーフェス。
- `tools.web.search.provider` で選択されていない Web 検索プロバイダー固有のキー。自動モード（プロバイダー未設定）では、いずれかを解決できるまで、自動検出の優先順位に従ってキーが参照されます。選択後は、選択されなかったプロバイダーのキーが非アクティブになります。
- サンドボックスの SSH 認証情報（`agents.defaults.sandbox.ssh.identityData`、`certificateData`、`knownHostsData`、およびエージェントごとのオーバーライド）は、デフォルトエージェントまたは有効なエージェントについて、実効サンドボックスバックエンドが `ssh` であり、サンドボックスモードが `off` でない場合にのみアクティブです。
- `gateway.remote.token`／`gateway.remote.password` の SecretRef は、次のいずれかを満たす場合にアクティブです。
  - `gateway.mode=remote`
  - `gateway.remote.url` が設定されている
  - `gateway.tailscale.mode` が `serve` または `funnel`
  - これらのリモートサーフェスがないローカルモードの場合：トークン認証が優先される可能性があり、環境変数／認証トークンが設定されていない場合、`gateway.remote.token` はアクティブです。パスワード認証が優先される可能性があり、環境変数／認証パスワードが設定されていない場合にのみ、`gateway.remote.password` はアクティブです。
- `OPENCLAW_GATEWAY_TOKEN` が設定されている場合、そのランタイムでは環境変数のトークン入力が優先されるため、起動時の認証解決において `gateway.auth.token` の SecretRef は非アクティブです。

</Accordion>

## Gateway 認証サーフェスの診断

`gateway.auth.token`、`gateway.auth.password`、`gateway.remote.token`、または `gateway.remote.password` に SecretRef が設定されている場合、Gateway の起動／再読み込み時に、コード `SECRETS_GATEWAY_AUTH_SURFACE` でサーフェスの状態がログに記録されます。

- `active`：SecretRef は実効認証サーフェスの一部であり、解決する必要があります。
- `inactive`：別の認証サーフェスが優先されるか、リモート認証が無効または非アクティブです。

ログエントリには、アクティブサーフェスポリシーが使用した理由が含まれます。

## オンボーディング時の参照事前検証

対話式オンボーディングで SecretRef ストレージを選択すると、保存前に事前検証が実行されます。

- 環境変数の参照：環境変数名を検証し、セットアップ中に空でない値を参照できることを確認します。
- プロバイダーの参照（`file` または `exec`）：プロバイダーの選択を検証し、`id` を解決して、解決された値の型を確認します。
- クイックスタートフロー：`gateway.auth.token` がすでに SecretRef の場合、オンボーディングは同じ即時失敗ゲートを使用して、プローブ／ダッシュボードのブートストラップ前にそれを解決します（`env`、`file`、および `exec` の参照が対象）。

検証に失敗するとエラーが表示され、再試行できます。

## SecretRef のコントラクト

すべての箇所で共通するオブジェクト形式：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    SecretInput フィールドでは、省略表記の文字列も使用できます。

    ```json5
    "${OPENAI_API_KEY}"
    "$OPENAI_API_KEY"
    ```

    検証：

    - `provider` は `^[a-z][a-z0-9_-]{0,63}$` に一致する必要があります
    - `id` は `^[A-Z][A-Z0-9_]{0,127}$` に一致する必要があります

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    検証：

    - `provider` は `^[a-z][a-z0-9_-]{0,63}$` に一致する必要があります
    - `id` は絶対 JSON ポインター（`/...`）であるか、`singleValue` プロバイダーの場合はリテラル `value` である必要があります
    - セグメント内の RFC 6901 エスケープ：`~` は `~0` に、`/` は `~1` になります

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    検証：

    - `provider` は `^[a-z][a-z0-9_-]{0,63}$` に一致する必要があります
    - `id` は `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` に一致する必要があります（`secret#json_key` などのセレクターをサポート）
    - `id` には、スラッシュで区切られたパスセグメントとして `.` または `..` を含めてはなりません（たとえば `a/../b` は拒否されます）

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
        mode: "json", // または "singleValue"
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

<Accordion title="環境変数プロバイダー">
- `allowlist` により、完全一致名の許可リストを任意で指定できます。
- 環境変数の値が存在しないか空の場合、解決は失敗します。

</Accordion>

<Accordion title="ファイルプロバイダー">
- `path` にあるローカルファイルを読み取ります。
- `mode: "json"`（デフォルト）は JSON オブジェクトのペイロードを想定し、`id` を JSON ポインターとして解決します。
- `mode: "singleValue"` は参照 ID `"value"` を想定し、ファイルの生の内容を返します（末尾の改行は削除されます）。
- パスは所有権／権限チェックに合格する必要があります。読み取りは `timeoutMs`（デフォルト 5000）と `maxBytes`（デフォルト 1 MiB）によって制限されます。
- Windows では安全側で失敗します。パスの ACL を検証できない場合、解決は失敗します。信頼できるパスに限り、そのプロバイダーで `allowInsecurePath: true` を設定するとチェックを回避できます。

</Accordion>

<Accordion title="Exec プロバイダー">
- 設定された絶対バイナリパスをシェルを介さずに直接実行します。
- デフォルトでは、`command` はシンボリックリンクではなく通常ファイルである必要があります。シンボリックリンクのコマンドパス（Homebrew の shim など）を許可するには `allowSymlinkCommand: true` を設定し、パッケージマネージャーのパスのみが条件を満たすように `trustedDirs`（例: `["/opt/homebrew"]`）と組み合わせてください。
- `timeoutMs`（デフォルト 5000）、`noOutputTimeoutMs`（デフォルトは `timeoutMs` と同じ）、`maxOutputBytes`（デフォルト 1 MiB）、`env`/`passEnv` の許可リスト、および `trustedDirs` をサポートします。
- `jsonOnly` のデフォルトは `true` です。`jsonOnly: false` が設定され、要求された ID が 1 つだけの場合、JSON ではないプレーンな標準出力をその ID の値として受け入れます。
- Windows ではフェイルクローズします。コマンドパスの ACL 検証を利用できない場合、解決は失敗します。信頼済みのパスに限り、そのプロバイダーで `allowInsecurePath: true` を設定すると、このチェックを回避できます。
- Plugin が管理する Exec プロバイダーでは、コピーした `command`/`args` の代わりに `pluginIntegration` を使用できます。OpenClaw は起動時または再読み込み時に、インストール済み Plugin のマニフェストから現在のコマンド詳細を解決します。Plugin が無効化、削除、信頼解除された場合、またはその統合を宣言しなくなった場合、そのプロバイダー上のアクティブな SecretRef はフェイルクローズします。

リクエストペイロード（標準入力）:

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

レスポンスペイロード（標準出力）:

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

ID ごとの任意のエラー:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "code": "NOT_FOUND" } }
}
```

`code` は、任意で使用できる機械可読な診断情報です。OpenClaw は、認識された
コード `NOT_FOUND` および `AMBIGUOUS_DUPLICATE_KEY` をプロバイダーと参照 ID とともに表示します。その他の
コードや `message` のような自由形式フィールドは、protocol-v1 との互換性のために受け入れられますが、
リゾルバーの出力には認証情報が含まれる可能性があるため表示されません。

</Accordion>

## ファイルを基盤とする API キー

設定の `env` ブロックに `file:...` 文字列を配置しないでください。このブロックはリテラルであり上書きされないため、`file:...` がそこで解決されることはありません。

代わりに、サポートされている認証情報フィールドでファイル SecretRef を使用してください。

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

`mode: "singleValue"` の場合、SecretRef `id` は `"value"` です。`mode: "json"` の場合は、`"/providers/xai/apiKey"` のような絶対 JSON ポインターを使用してください。

SecretRef を受け入れるフィールドについては、[SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)を参照してください。

## Exec 統合の例

サービスアカウント、同梱のエージェント Skills、トラブルシューティングを扱う 1Password 専用ガイドについては、[1Password](/ja-JP/gateway/1password)を参照してください。

<AccordionGroup>
  <Accordion title="1Password CLI">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // Homebrew のシンボリックリンクされたバイナリに必要
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
    リゾルバーラッパーを使用して、SecretRef ID を Bitwarden Secrets Manager の項目キーにマッピングします。リポジトリには `scripts/secrets/openclaw-bws-resolver.mjs` が含まれています。これを、Gateway を実行するホスト上の信頼済み絶対パスにインストールまたはコピーしてください。

    要件:

    - Gateway ホストに Bitwarden Secrets Manager CLI（`bws`）がインストールされていること。
    - Gateway サービスから `BWS_ACCESS_TOKEN` を利用できること。
    - `PATH` をリゾルバーに渡すか、`BWS_BIN` に `bws` バイナリの絶対パスを設定すること。
    - セルフホスト型の Bitwarden インスタンスを使用する場合、環境に `BWS_SERVER_URL` を設定すること。

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

    リゾルバーは要求された ID をまとめて処理し、`bws secret list` を実行して、一致するシークレットの `key` フィールドの値を返します。`openclaw/providers/openai/apiKey` のように、Exec SecretRef の ID 規約を満たすキーを使用してください。アンダースコアを含む環境変数形式のキーは、リゾルバーが実行される前に拒否されます。表示可能な複数の Bitwarden シークレットが要求されたキーを共有している場合、リゾルバーは推測せず、その ID を曖昧として失敗させます。設定を更新した後、リゾルバーのパスを検証してください。

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
            allowSymlinkCommand: true, // Homebrew のシンボリックリンクされたバイナリに必要
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
    小さなリゾルバーラッパーを使用して、SecretRef ID を `pass` エントリに直接マッピングします。Exec プロバイダーのパスチェックを通過する絶対パス（例: `/usr/local/bin/openclaw-pass-resolver`）に、これを実行可能ファイルとして保存してください。`#!/usr/bin/env node` シバンはリゾルバープロセスの `PATH` から `node` を解決するため、`passEnv` に `PATH` を含めてください。`pass` がその `PATH` に存在しない場合、親環境で `PASS_BIN` を設定し、`passEnv` にも含めてください。

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
        process.stderr.write(`リクエストの解析に失敗しました: ${err.message}\n`);
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
          errors[id] = { message: (result.stderr || `pass が終了しました ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    次に、Exec プロバイダーを設定し、`apiKey` が `pass` エントリのパスを指すようにします。

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

    シークレットを `pass` エントリの先頭行に保持するか、代わりに `pass show` の出力全体を返すようにラッパーをカスタマイズしてください。設定を更新した後、静的監査と Exec リゾルバーのパスの両方を検証してください。

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
            allowSymlinkCommand: true, // Homebrew のシンボリックリンクされたバイナリに必要
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

## MCP サーバーの環境変数

`plugins.entries.acpx.config.mcpServers` で設定された MCP サーバーの環境変数は SecretInput を受け入れるため、API キーやトークンをプレーンテキストの設定に含めずに済みます。

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

プレーンテキストの文字列値も引き続き機能します。`${MCP_SERVER_API_KEY}` のような環境テンプレート参照と SecretRef オブジェクトは、MCP サーバープロセスが生成される前の Gateway 有効化時に解決されます。他の SecretRef サーフェスと同様に、未解決の参照が有効化を妨げるのは、`acpx` Plugin が実質的にアクティブな場合に限られます。

## サンドボックスの SSH 認証素材

コアの `ssh` サンドボックスバックエンドは、SSH 認証素材の SecretRef もサポートします。

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

- OpenClaw は、SSH 呼び出しごとに遅延解決するのではなく、サンドボックスの有効化時にこれらの参照を解決します。
- 解決された値は、制限の厳しいファイル権限 (`0o600`) で一時ディレクトリに書き込まれ、生成された SSH 設定で使用されます。
- 有効なサンドボックスバックエンドが `ssh` でない場合（またはサンドボックスモードが `off` の場合）、これらの参照は非アクティブなままとなり、起動を妨げません。

## サポートされる認証情報の対象範囲

正式にサポートされる認証情報とサポートされない認証情報は、[SecretRef 認証情報の対象範囲](/ja-JP/reference/secretref-credential-surface)に記載されています。

<Note>
ランタイムで生成される認証情報、ローテーションされる認証情報、および OAuth 更新用マテリアルは、読み取り専用の SecretRef 解決から意図的に除外されています。
</Note>

## 必須の動作と優先順位

- 参照のないフィールド: 変更されません。
- 参照のあるフィールド: 有効化中、アクティブな対象範囲では必須です。
- 平文と参照の両方が存在する場合、サポートされる優先順位パスでは参照が優先されます。
- 秘匿化センチネル `__OPENCLAW_REDACTED__` は、内部設定の秘匿化と復元のために予約されており、送信された設定データ内のリテラル値としては拒否されます。

警告および監査シグナル:

- `SECRETS_REF_OVERRIDES_PLAINTEXT`（ランタイム警告）
- `REF_SHADOWED`（`auth-profiles.json` 認証情報が `openclaw.json` 参照より優先される場合の監査検出事項）

Google Chat の互換性: `serviceAccountRef` は平文の `serviceAccount` より優先されます。対応する参照が設定されると、平文値は無視されます。

## 有効化のトリガー

シークレットの有効化は、次の場合に実行されます:

- 起動時（事前検証と最終有効化）
- 設定再読み込みのホット適用パス
- 設定再読み込みの再起動確認パス
- `secrets.reload` による手動再読み込み
- Gateway 設定書き込み RPC の事前検証（`config.set` / `config.apply` / `config.patch`）。編集内容を永続化する前に、送信された設定ペイロード内でアクティブな対象範囲の SecretRef が解決可能かを確認します

有効化の契約:

- 成功すると、スナップショットがアトミックに置き換えられます。
- 起動時の失敗は Gateway の起動を中止します。
- ランタイム再読み込みの失敗時は、最後に正常動作したスナップショットが維持されます。
- 書き込み RPC の事前検証が失敗すると、送信された設定は拒否されます。ディスク上の設定とアクティブなランタイムスナップショットは、どちらも変更されません。
- 送信用ヘルパーまたはツール呼び出しに対して、呼び出しごとに明示的なチャンネルトークンを指定しても、SecretRef の有効化はトリガーされません。有効化ポイントは、起動、再読み込み、および明示的な `secrets.reload` のままです。

## 機能低下および復旧のシグナル

正常な状態の後に再読み込み時の有効化が失敗すると、OpenClaw はシークレットの機能低下状態に入り、1 回限りのシステムイベントとログコードを出力します:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

動作:

- 機能低下時: ランタイムは最後に正常動作したスナップショットを維持します。
- 復旧時: 次回の有効化が成功した後に 1 回だけ出力されます。
- すでに機能低下状態にある間に失敗が繰り返された場合、警告はログに記録されますが、イベントは再出力されません。
- 起動時の即時失敗では、ランタイムがアクティブになっていないため、機能低下イベントは出力されません。

## コマンドパスの解決

コマンドパスでは、Gateway スナップショット RPC を介して、サポートされる SecretRef 解決を有効にできます。大きく分けて 2 つの動作があります:

<Tabs>
  <Tab title="厳格なコマンドパス">
    たとえば、`openclaw memory` のリモートメモリパスや、リモート共有シークレット参照が必要な場合の `openclaw qr --remote` です。これらはアクティブなスナップショットから読み取り、必須の SecretRef が利用できない場合は即座に失敗します。
  </Tab>
  <Tab title="読み取り専用コマンドパス">
    たとえば、`openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve`、`openclaw security audit`、および読み取り専用の doctor/設定修復フローです。これらもアクティブなスナップショットを優先しますが、対象の SecretRef が利用できない場合は中止せず、機能を低下させて続行します。

    読み取り専用の動作:

    - Gateway が実行中の場合、これらのコマンドは最初にアクティブなスナップショットから読み取ります。
    - Gateway による解決が不完全であるか、Gateway が利用できない場合、そのコマンドの対象範囲に限定したローカルフォールバックを試行します。
    - 対象の SecretRef が引き続き利用できない場合、コマンドは機能を低下させた読み取り専用出力で続行し、参照は設定されているものの、このコマンドパスでは利用できないことを示す明示的な診断を出力します。
    - この機能低下動作は、そのコマンド内にのみ適用されます。ランタイムの起動、再読み込み、送信、認証の各パスが緩和されることはありません。

  </Tab>
</Tabs>

その他の注意事項:

- バックエンドのシークレットがローテーションされた後のスナップショット更新は、`openclaw secrets reload` によって処理されます。
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

再監査で問題がなくなるまで、移行が完了したものとして扱わないでください。監査で保存データ内の平文値が引き続き報告される場合、ランタイム API が秘匿化された値を返していても、エージェントによるアクセスのリスクは残ります。

`configure` の実行中に適用せずプランを保存した場合は、再監査の前に `openclaw secrets apply --from <plan-path>` を使用してその保存済みプランを適用してください。

<AccordionGroup>
  <Accordion title="secrets audit">
    検出事項には次のものがあります:

    - 保存データ内の平文値（`openclaw.json`、`auth-profiles.json`、`.env`、および生成された `agents/*/agent/models.json`）。
    - 生成された `models.json` エントリ内に残っている、機密性の高いプロバイダーヘッダーの平文。
    - 未解決の参照。
    - 優先順位による隠蔽（`auth-profiles.json` が `openclaw.json` 参照より優先される状態）。
    - レガシーな残留データ（`auth.json`、OAuth に関する注意事項）。

    Exec に関する注意: コマンドの副作用を避けるため、監査ではデフォルトで exec SecretRef の解決可能性チェックをスキップします。監査中に exec プロバイダーを実行するには、`openclaw secrets audit --allow-exec` を使用してください。

    ヘッダーの残留データに関する注意: 機密性の高いプロバイダーヘッダーの検出は、名前に基づくヒューリスティックを使用します（一般的な認証/認証情報ヘッダー名と、`authorization`、`x-api-key`、`token`、`secret`、`password`、`credential` などの断片）。

  </Accordion>
  <Accordion title="secrets configure">
    次の処理を行う対話型ヘルパーです:

    - 最初に `secrets.providers` を設定します（`env`/`file`/`exec`、追加/編集/削除）。
    - 1 つのエージェントスコープについて、`openclaw.json` 内のサポート対象のシークレット保持フィールドと `auth-profiles.json` を選択できます。
    - 対象選択画面で、新しい `auth-profiles.json` マッピングを直接作成できます。
    - SecretRef の詳細（`source`、`provider`、`id`）を取得します。
    - 事前解決を実行し、直ちに適用することもできます。

    Exec に関する注意: `--allow-exec` が設定されていない限り、事前検証では exec SecretRef のチェックをスキップします。`configure --apply` から直接適用し、プランに exec 参照またはプロバイダーが含まれる場合は、適用手順でも `--allow-exec` を設定したままにしてください。

    便利なモード:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    `configure` 適用時のデフォルト:

    - 対象プロバイダーについて、`auth-profiles.json` から一致する静的認証情報を消去します。
    - `auth.json` からレガシーな静的 `api_key` エントリを消去します。
    - `<config-dir>/.env` から一致する既知のシークレット行を消去します。

  </Accordion>
  <Accordion title="secrets apply">
    保存済みプランを適用します:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Exec に関する注意: `--allow-exec` が設定されていない限り、ドライランでは exec チェックをスキップします。書き込みモードでは、`--allow-exec` が設定されていない場合、exec SecretRef またはプロバイダーを含むプランを拒否します。

    厳格な対象/パス契約の詳細と正確な拒否ルールについては、[シークレット適用プランの契約](/ja-JP/gateway/secrets-plan-contract)を参照してください。

  </Accordion>
</AccordionGroup>

## 一方向の安全ポリシー

<Warning>
OpenClaw は、過去の平文シークレット値を含むロールバック用バックアップを意図的に書き込みません。
</Warning>

安全モデル:

- 書き込みモードの前に、事前検証が成功する必要があります。
- コミット前に、ランタイムの有効化が検証されます。
- 適用時は、アトミックなファイル置換を使用してファイルを更新し、失敗時にはベストエフォートで復元します。

## レガシー認証の互換性に関する注意事項

静的認証情報について、ランタイムは平文のレガシー認証ストレージに依存しなくなりました。

- ランタイムの認証情報ソースは、解決済みのメモリ内スナップショットです。
- レガシーな静的 `api_key` エントリは、検出時に消去されます。
- OAuth 関連の互換動作は、引き続き別個に扱われます。

## Web UI に関する注意事項

一部の SecretInput 共用体型は、フォームモードよりも生エディターモードの方が簡単に設定できます。

## 関連項目

- [認証](/ja-JP/gateway/authentication) - 認証の設定
- [CLI: secrets](/ja-JP/cli/secrets) - CLI コマンド
- [Vault SecretRef](/ja-JP/plugins/vault) - HashiCorp Vault プロバイダーの設定
- [環境変数](/ja-JP/help/environment) - 環境変数の優先順位
- [SecretRef 認証情報の対象範囲](/ja-JP/reference/secretref-credential-surface) - 認証情報の対象範囲
- [シークレット適用プランの契約](/ja-JP/gateway/secrets-plan-contract) - プラン契約の詳細
- [セキュリティ](/ja-JP/gateway/security) - セキュリティ方針

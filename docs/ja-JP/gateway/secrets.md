---
read_when:
    - プロバイダー認証情報と `auth-profiles.json` 参照用の SecretRefs の設定
    - 本番環境でシークレットの再読み込み、監査、設定、適用を安全に行う
    - 起動時のフェイルファスト、非アクティブなサーフェスのフィルタリング、最終正常状態の動作を理解する
sidebarTitle: Secrets management
summary: シークレット管理：SecretRef コントラクト、ランタイムスナップショットの動作、安全な一方向スクラビング
title: シークレット管理
x-i18n:
    generated_at: "2026-07-12T14:30:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 63cc331bc015d29e2b2cee170e09a1db9212338e97e21c07a9bfc73477cbd64a
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw は追加型の SecretRef をサポートしているため、サポート対象の認証情報を設定内に平文で保存する必要はありません。

<Note>
平文も引き続き使用できます。SecretRef は認証情報ごとにオプトインです。
</Note>

<Warning>
平文の認証情報が、エージェントが検査できるファイル（`openclaw.json`、`auth-profiles.json`、`.env`、生成された `agents/*/agent/models.json` ファイルなど）に存在する場合、エージェントは引き続きそれを読み取れます。SecretRef によってローカルでの影響範囲が縮小されるのは、サポート対象のすべての認証情報を移行し、`openclaw secrets audit --check` で平文の残留が報告されなくなった後だけです。
</Warning>

## ランタイムモデル

- シークレットは、リクエスト経路で遅延解決されるのではなく、アクティベーション中に先行してメモリ内ランタイムスナップショットへ解決されます。
- 実質的にアクティブな SecretRef を解決できない場合、起動は即座に失敗します。
- 再読み込みはアトミックな交換です。すべて成功するか、最後に正常だったスナップショットを維持します。
- ポリシー違反（たとえば OAuth モードの認証プロファイルと SecretRef 入力の組み合わせ）がある場合、ランタイムを交換する前にアクティベーションが失敗します。
- ランタイムリクエストは、アクティブなメモリ内スナップショットのみを読み取ります。モデルプロバイダーの SecretRef 認証情報は、外部送信されるまで、プロセスローカルなセンチネルとして認証ストレージとストリームオプションを通過します。外向きの配信経路（Discord の返信／スレッド配信、Telegram のアクション送信）もそのスナップショットを読み取り、送信ごとに参照を再解決しません。

これにより、シークレットプロバイダーの障害が高頻度のリクエスト経路に影響しなくなります。

## 外部送信時の注入（センチネル）

SecretRef によって提供されるモデルプロバイダーの認証情報について、OpenClaw はモデル認証の解決中に、不透明なプロセスローカルのセンチネルを生成します。そのため、認証ストレージ、ストリームオプション、SDK 設定、ログ、エラーオブジェクト、およびランタイムのほとんどの内部調査では、プロバイダーの認証情報ではなく `oc-sent-v1-...` のような値が見えます。保護されたモデル fetch と、管理対象のローカルプロバイダーのヘルスプローブは、各リクエストがプロセス外へ出る直前に、URL とヘッダーの値に含まれる既知のセンチネルを置換します。

未知のセンチネル形式の値がある場合、ネットワーク通信を行う前に安全側に倒して失敗します。OpenClaw は、未解決のセンチネルをプロバイダーへ転送せず、リクエストの送信を拒否します。多層防御として、解決済みのシークレット値も、完全一致によるログ秘匿化の対象として登録されます。

プロバイダーアダプターは、SDK がサポートする最も遅い注入ポイントを使用します。

- カスタム fetch オプションを持つ SDK には OpenClaw の保護された fetch が渡されるため、SDK 内ではセンチネルが維持されます。
- カスタム fetch オプションを持たない SDK では、クライアントを構築する直前にセンチネルを展開します。Plugin が所有するプロバイダーストリームとエージェントハーネスは OpenClaw の保護された fetch を共有しないため、コアが所有する最後の受け渡し地点で展開します。

センチネルはモデル呼び出しチェーン全体での平文露出を減らしますが、プロセス分離ではありません。実際の値は同一プロセスのメモリ内に引き続き存在し、最終的なアダプター境界に現れます。SecretRef を介して設定されていない通常の環境変数の認証情報は平文のままであり、この仕組みの対象外です。

インシデント対応または互換性のトラブルシューティング中にセンチネルの生成を無効化するには、`OPENCLAW_SECRET_SENTINELS=off`（大文字と小文字を区別せず、`0` または `false` も使用可能）を設定します。この緊急停止スイッチは、完全一致による秘匿化の登録を無効化しません。

## エージェントアクセス境界

SecretRef は認証情報が設定や生成されたモデルファイルに永続化されることを防ぎますが、プロセス分離の境界ではありません。エージェントが読み取れるパスに平文の認証情報がディスク上に残っている場合、API レベルの秘匿化を回避して、ファイルツールやシェルツールから引き続き読み取れます。

エージェントがアクセス可能なファイルが対象範囲に含まれる本番環境では、次のすべてを満たす場合にのみ移行が完了したものとして扱ってください。

- サポート対象の認証情報で、平文値の代わりに SecretRef を使用している。
- `openclaw.json`、`auth-profiles.json`、`.env`、および生成された `models.json` ファイルから、従来の平文の残留を除去している。
- 移行後の `openclaw secrets audit --check` で問題が検出されない。
- 残っているサポート対象外またはローテーション対象の認証情報が、OS 分離、コンテナ分離、または外部の認証情報プロキシによって保護されている。

このため、audit／configure／apply のワークフローは単なる利便性のためのヘルパーではなく、セキュリティ移行のゲートです。

<Warning>
SecretRef によって、任意の読み取り可能なファイルが安全になるわけではありません。バックアップ、コピーされた設定、古い生成済みモデルカタログ、およびサポート対象外の認証情報クラスは、削除するか、エージェントの信頼境界外へ移動するか、個別に分離するまで、本番環境のシークレットであり続けます。
</Warning>

## アクティブサーフェスのフィルタリング

SecretRef は、実質的にアクティブなサーフェスでのみ検証されます。

- **有効なサーフェス**：未解決の参照は起動／再読み込みを阻止します。
- **非アクティブなサーフェス**：未解決の参照は起動／再読み込みを阻止せず、致命的ではない `SECRETS_REF_IGNORED_INACTIVE_SURFACE` 診断を出力します。

<Accordion title="非アクティブなサーフェスの例">
- 無効化されたチャンネル／アカウントのエントリ。
- 有効なアカウントが継承していないトップレベルのチャンネル認証情報。
- 無効化されたツール／機能のサーフェス。
- `tools.web.search.provider` で選択されていない Web 検索プロバイダー固有のキー。自動モード（プロバイダー未設定）では、いずれかが解決されるまで優先順位に従って自動検出用のキーを参照します。選択後は、選択されなかったプロバイダーのキーは非アクティブになります。
- サンドボックスの SSH 認証情報（`agents.defaults.sandbox.ssh.identityData`、`certificateData`、`knownHostsData`、およびエージェントごとのオーバーライド）は、デフォルトエージェントまたは有効なエージェントについて、実効サンドボックスバックエンドが `ssh` で、かつサンドボックスモードが `off` でない場合にのみアクティブになります。
- `gateway.remote.token`／`gateway.remote.password` の SecretRef は、次のいずれかを満たす場合にアクティブです。
  - `gateway.mode=remote`
  - `gateway.remote.url` が設定されている
  - `gateway.tailscale.mode` が `serve` または `funnel`
  - これらのリモートサーフェスがないローカルモードでは、トークン認証が優先される可能性があり、かつ環境変数／認証トークンが設定されていない場合に `gateway.remote.token` がアクティブになります。パスワード認証が優先される可能性があり、かつ環境変数／認証パスワードが設定されていない場合にのみ `gateway.remote.password` がアクティブになります。
- `OPENCLAW_GATEWAY_TOKEN` が設定されている場合、そのランタイムでは環境変数のトークン入力が優先されるため、`gateway.auth.token` の SecretRef は起動時の認証解決では非アクティブです。

</Accordion>

## Gateway 認証サーフェスの診断

`gateway.auth.token`、`gateway.auth.password`、`gateway.remote.token`、または `gateway.remote.password` に SecretRef が設定されている場合、Gateway の起動／再読み込みでは、コード `SECRETS_GATEWAY_AUTH_SURFACE` の下にサーフェスの状態が記録されます。

- `active`：SecretRef は実効認証サーフェスの一部であり、解決する必要があります。
- `inactive`：別の認証サーフェスが優先されるか、リモート認証が無効または非アクティブです。

ログエントリには、アクティブサーフェスポリシーが使用した理由が含まれます。

## オンボーディングの参照事前検証

対話型オンボーディングで SecretRef ストレージを選択すると、保存前に事前検証が実行されます。

- Env 参照：環境変数名を検証し、セットアップ中に空でない値が参照可能であることを確認します。
- プロバイダー参照（`file` または `exec`）：プロバイダーの選択を検証し、`id` を解決して、解決された値の型を確認します。
- クイックスタートフロー：`gateway.auth.token` がすでに SecretRef の場合、オンボーディングでは同じ即時失敗ゲートを使用して、プローブ／ダッシュボードのブートストラップ前にそれを解決します（`env`、`file`、`exec` 参照に対応）。

検証に失敗するとエラーが表示され、再試行できます。

## SecretRef の契約

すべての場所で使用するオブジェクト形式は1つです。

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    SecretInput フィールドでは短縮文字列も使用できます。

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
    - `id` は絶対 JSON ポインター（`/...`）であるか、`singleValue` プロバイダーではリテラル `value` である必要があります
    - セグメント内の RFC 6901 エスケープ：`~` は `~0`、`/` は `~1` になります

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    検証：

    - `provider` は `^[a-z][a-z0-9_-]{0,63}$` に一致する必要があります
    - `id` は `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` に一致する必要があります（`secret#json_key` のようなセレクターをサポートします）
    - `id` に、スラッシュで区切られたパスセグメントとして `.` または `..` を含めてはなりません（たとえば `a/../b` は拒否されます）

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

<Accordion title="Env プロバイダー">
- `allowlist` による、完全一致名の任意の許可リスト。
- 環境変数の値が存在しないか空の場合、解決は失敗します。

</Accordion>

<Accordion title="ファイルプロバイダー">
- `path` にあるローカルファイルを読み取ります。
- `mode: "json"`（デフォルト）は JSON オブジェクトのペイロードを想定し、`id` を JSON ポインターとして解決します。
- `mode: "singleValue"` は参照 ID `"value"` を想定し、ファイルの生の内容を返します（末尾の改行は削除されます）。
- パスは所有権／権限チェックに合格する必要があります。読み取りは `timeoutMs`（デフォルト 5000）と `maxBytes`（デフォルト 1 MiB）によって制限されます。
- Windows では安全側に倒して失敗します。パスに対する ACL 検証を利用できない場合、解決は失敗します。信頼できるパスに限り、そのプロバイダーで `allowInsecurePath: true` を設定すると、このチェックを回避できます。

</Accordion>

<Accordion title="Exec プロバイダー">
- 設定された絶対パスのバイナリを、シェルを介さず直接実行します。
- デフォルトでは、`command` はシンボリックリンクではなく通常ファイルである必要があります。シンボリックリンクのコマンドパス（たとえば Homebrew の shim）を許可するには `allowSymlinkCommand: true` を設定し、パッケージマネージャーのパスだけが対象になるように `trustedDirs`（たとえば `["/opt/homebrew"]`）と組み合わせてください。
- `timeoutMs`（デフォルト 5000）、`noOutputTimeoutMs`（デフォルトは `timeoutMs` と同じ）、`maxOutputBytes`（デフォルト 1 MiB）、`env`／`passEnv` 許可リスト、および `trustedDirs` をサポートします。
- `jsonOnly` のデフォルトは `true` です。`jsonOnly: false` で要求された ID が1つの場合、JSON ではない通常の標準出力をその ID の値として受け入れます。
- Windows では安全側に倒して失敗します。コマンドパスに対する ACL 検証を利用できない場合、解決は失敗します。信頼できるパスに限り、そのプロバイダーで `allowInsecurePath: true` を設定すると、このチェックを回避できます。
- Plugin が管理する exec プロバイダーでは、コピーした `command`／`args` の代わりに `pluginIntegration` を使用できます。OpenClaw は起動／再読み込み時に、インストール済み Plugin のマニフェストから現在のコマンド詳細を解決します。Plugin が無効化、削除、信頼解除されているか、統合を宣言しなくなった場合、そのプロバイダー上のアクティブな SecretRef は安全側に倒して失敗します。

リクエストペイロード（標準入力）：

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

レスポンスペイロード（標準出力）：

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

ID ごとの任意のエラー：

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "code": "NOT_FOUND" } }
}
```

`code` は任意の機械可読な診断情報です。OpenClaw は、認識される
コード `NOT_FOUND` および `AMBIGUOUS_DUPLICATE_KEY` を、プロバイダーおよび参照 ID とともに表示します。その他の
コードや `message` などの自由形式フィールドは、プロトコル v1 との互換性のために受け入れられますが、
リゾルバーの出力には認証情報が含まれる可能性があるため表示されません。

</Accordion>

## ファイルに保存された API キー

設定の `env` ブロックに `file:...` 文字列を配置しないでください。このブロックはリテラルであり、上書きも行わないため、ここでは `file:...` が解決されることはありません。

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

`mode: "singleValue"` の場合、SecretRef の `id` は `"value"` です。`mode: "json"` の場合は、`"/providers/xai/apiKey"` のような絶対 JSON ポインターを使用してください。

SecretRef を受け付けるフィールドについては、[SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)を参照してください。

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
    リゾルバーラッパーを使用して、SecretRef の ID を Bitwarden Secrets Manager の項目キーにマッピングします。リポジトリには `scripts/secrets/openclaw-bws-resolver.mjs` が含まれています。これを、Gateway を実行するホスト上の信頼できる絶対パスにインストールまたはコピーしてください。

    要件:

    - Gateway ホストに Bitwarden Secrets Manager CLI（`bws`）がインストールされていること。
    - Gateway サービスで `BWS_ACCESS_TOKEN` を使用できること。
    - `PATH` をリゾルバーに渡すか、`BWS_BIN` に `bws` バイナリの絶対パスを設定すること。
    - セルフホスト型 Bitwarden インスタンスを使用する場合は、環境に `BWS_SERVER_URL` を設定すること。

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

    リゾルバーは要求された ID をバッチ処理し、`bws secret list` を実行して、一致するシークレットの `key` フィールドの値を返します。`openclaw/providers/openai/apiKey` のように、exec SecretRef の ID コントラクトを満たすキーを使用してください。アンダースコアを含む環境変数形式のキーは、リゾルバーが実行される前に拒否されます。要求されたキーを複数の可視 Bitwarden シークレットが共有している場合、リゾルバーは推測せず、曖昧であるとしてその ID を失敗させます。設定の更新後、リゾルバーのパスを検証してください。

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
    小さなリゾルバーラッパーを使用して、SecretRef の ID を `pass` エントリに直接マッピングします。exec プロバイダーのパスチェックを通過する絶対パス（例: `/usr/local/bin/openclaw-pass-resolver`）に、これを実行可能ファイルとして保存してください。`#!/usr/bin/env node` シバンはリゾルバープロセスの `PATH` から `node` を解決するため、`passEnv` に `PATH` を含めてください。その `PATH` に `pass` がない場合は、親環境で `PASS_BIN` を設定し、これも `passEnv` に含めてください。

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
          errors[id] = { message: (result.stderr || `pass が ${result.status} で終了しました`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    次に exec プロバイダーを設定し、`apiKey` が `pass` エントリのパスを指すようにします。

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

    シークレットを `pass` エントリの先頭行に保持するか、代わりに `pass show` の出力全体を返すようラッパーをカスタマイズしてください。設定の更新後、静的監査と exec リゾルバーのパスの両方を検証してください。

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

`plugins.entries.acpx.config.mcpServers` で設定された MCP サーバーの環境変数は SecretInput を受け付けるため、API キーとトークンを平文の設定から除外できます。

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

平文の文字列値も引き続き使用できます。`${MCP_SERVER_API_KEY}` のような環境テンプレート参照と SecretRef オブジェクトは、MCP サーバープロセスが生成される前の Gateway アクティベーション時に解決されます。他の SecretRef サーフェスと同様に、未解決の参照がアクティベーションをブロックするのは、`acpx` Plugin が実質的にアクティブな場合のみです。

## サンドボックスの SSH 認証素材

コアの `ssh` サンドボックスバックエンドも、SSH 認証素材の SecretRef をサポートします。

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

- OpenClaw は、SSH 呼び出しごとに遅延解決するのではなく、サンドボックスのアクティベーション時にこれらの参照を解決します。
- 解決された値は制限の厳しいファイル権限（`0o600`）で一時ディレクトリに書き込まれ、生成される SSH 設定で使用されます。
- 有効なサンドボックスバックエンドが `ssh` でない場合（またはサンドボックスモードが `off` の場合）、これらの参照は非アクティブのままであり、起動をブロックしません。

## サポートされている認証情報サーフェス

サポート対象および対象外の正式な認証情報一覧は、[SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)に記載されています。

<Note>
ランタイムで発行される認証情報、ローテーションされる認証情報、および OAuth 更新素材は、読み取り専用の SecretRef 解決から意図的に除外されています。
</Note>

## 必須の動作と優先順位

- 参照のないフィールド: 変更なし。
- 参照のあるフィールド: アクティベーション中、アクティブなサーフェスでは必須。
- 平文と参照の両方が存在する場合、サポートされている優先順位パスでは参照が優先されます。
- 秘匿化センチネル `__OPENCLAW_REDACTED__` は、内部の設定秘匿化/復元用に予約されており、送信された設定データ内のリテラル値としては拒否されます。

警告および監査シグナル:

- `SECRETS_REF_OVERRIDES_PLAINTEXT`（ランタイム警告）
- `REF_SHADOWED`（`auth-profiles.json` の認証情報が `openclaw.json` の参照より優先される場合の監査検出事項）

Google Chat の互換性: `serviceAccountRef` は平文の `serviceAccount` より優先されます。兄弟フィールドの参照が設定されると、平文値は無視されます。

## アクティベーションのトリガー

Secret のアクティベーションは、以下の場合に実行されます。

- 起動時（事前チェックと最終アクティベーション）
- 設定リロードのホット適用パス
- 設定リロードの再起動チェックパス
- `secrets.reload` による手動リロード
- Gateway の設定書き込み RPC 事前チェック（`config.set` / `config.apply` / `config.patch`）。編集内容を永続化する前に、送信された設定ペイロード内でアクティブなサーフェスの SecretRef が解決可能かどうかを確認します

アクティベーションのコントラクト:

- 成功すると、スナップショットがアトミックに交換されます。
- 起動時の失敗は Gateway の起動を中止します。
- ランタイムのリロードに失敗した場合、最後に正常だったスナップショットが維持されます。
- 書き込み RPC の事前チェックに失敗した場合、送信された設定は拒否されます。ディスク上の設定とアクティブなランタイムスナップショットは、どちらも変更されません。
- 送信ヘルパー/ツール呼び出しに呼び出し単位の明示的なチャンネルトークンを指定しても、SecretRef のアクティベーションはトリガーされません。アクティベーションポイントは引き続き、起動、リロード、および明示的な `secrets.reload` です。

## 機能低下および復旧シグナル

正常な状態の後にリロード時のアクティベーションが失敗すると、OpenClaw は Secret の機能低下状態に入り、一度限りのシステムイベントとログコードを発行します。

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

動作:

- 機能低下: ランタイムは最後に正常だったスナップショットを維持します。
- 復旧: 次回のアクティベーション成功後に一度だけ発行されます。
- すでに機能低下状態にある間に障害が繰り返された場合、警告はログに記録されますが、イベントは再発行されません。
- 起動時のフェイルファストでは機能低下イベントは発行されません。ランタイムが一度もアクティブになっていないためです。

## コマンドパスの解決

コマンドパスは、Gateway スナップショット RPC を介した、サポート対象の SecretRef 解決を選択できます。大きく分けて次の 2 つの動作があります。

<Tabs>
  <Tab title="厳格なコマンドパス">
    たとえば、`openclaw memory` のリモートメモリパスや、リモートの共有シークレット参照が必要な場合の `openclaw qr --remote` です。これらはアクティブなスナップショットから読み取り、必要な SecretRef が利用できない場合は即座に失敗します。
  </Tab>
  <Tab title="読み取り専用コマンドパス">
    たとえば、`openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve`、`openclaw security audit`、および読み取り専用の doctor/config 修復フローです。これらもアクティブなスナップショットを優先しますが、対象の SecretRef が利用できない場合は中止せずに機能低下します。

    読み取り専用の動作:

    - Gateway が実行中の場合、これらのコマンドは最初にアクティブなスナップショットから読み取ります。
    - Gateway による解決が不完全な場合、または Gateway が利用できない場合、そのコマンドサーフェスを対象とするローカルフォールバックを試行します。
    - 対象の SecretRef が引き続き利用できない場合、コマンドは機能低下した読み取り専用出力で続行し、その参照は構成されているものの、このコマンドパスでは利用できないことを明示的に診断します。
    - この機能低下動作はコマンドローカルに限定されます。ランタイムの起動、再読み込み、送信、認証の各パスを弱めることはありません。

  </Tab>
</Tabs>

その他の注意事項:

- バックエンドのシークレットローテーション後のスナップショット更新は、`openclaw secrets reload` で処理されます。
- これらのコマンドパスで使用される Gateway RPC メソッド: `secrets.resolve`。

## 監査と構成のワークフロー

オペレーターのデフォルトフロー:

<Steps>
  <Step title="現在の状態を監査">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="SecretRef を構成して適用">
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

再監査で問題がなくなるまで、移行が完了したとは見なさないでください。保存時の平文値が監査で引き続き報告される場合、ランタイム API が墨消しされた値を返していても、エージェントによるアクセスのリスクは残ります。

`configure` 中に適用せずプランを保存した場合は、再監査の前に `openclaw secrets apply --from <plan-path>` を使用して保存済みプランを適用してください。

<AccordionGroup>
  <Accordion title="シークレットの監査">
    検出項目には以下が含まれます。

    - 保存時の平文値（`openclaw.json`、`auth-profiles.json`、`.env`、および生成された `agents/*/agent/models.json`）。
    - 生成された `models.json` エントリ内に残存する、機密性の高いプロバイダーヘッダーの平文。
    - 未解決の参照。
    - 優先順位によるシャドーイング（`auth-profiles.json` が `openclaw.json` の参照より優先される）。
    - レガシーな残存物（`auth.json`、OAuth リマインダー）。

    Exec に関する注意: コマンドの副作用を避けるため、デフォルトでは監査時に exec SecretRef の解決可能性チェックをスキップします。監査中に exec プロバイダーを実行するには、`openclaw secrets audit --allow-exec` を使用してください。

    ヘッダー残存物に関する注意: 機密性の高いプロバイダーヘッダーの検出は、名前に基づくヒューリスティックを使用します（一般的な認証情報／資格情報ヘッダー名と、`authorization`、`x-api-key`、`token`、`secret`、`password`、`credential` などの断片）。

  </Accordion>
  <Accordion title="シークレットの構成">
    次の処理を行う対話型ヘルパーです。

    - 最初に `secrets.providers` を構成します（`env`/`file`/`exec`、追加／編集／削除）。
    - `openclaw.json` 内のサポート対象のシークレット保持フィールドと、1 つのエージェントスコープの `auth-profiles.json` を選択できます。
    - ターゲット選択画面で、新しい `auth-profiles.json` マッピングを直接作成できます。
    - SecretRef の詳細（`source`、`provider`、`id`）を取得します。
    - 事前解決チェックを実行し、すぐに適用できます。

    Exec に関する注意: `--allow-exec` が設定されていない限り、事前チェックでは exec SecretRef のチェックをスキップします。`configure --apply` から直接適用し、プランに exec の参照またはプロバイダーが含まれている場合は、適用ステップでも `--allow-exec` を設定したままにしてください。

    便利なモード:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    `configure` の適用時のデフォルト:

    - 対象プロバイダーについて、一致する静的な認証情報を `auth-profiles.json` から消去します。
    - レガシーな静的 `api_key` エントリを `auth.json` から消去します。
    - 一致する既知のシークレット行を `<config-dir>/.env` から消去します。

  </Accordion>
  <Accordion title="シークレットの適用">
    保存済みプランを適用します。

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Exec に関する注意: `--allow-exec` が設定されていない限り、ドライランでは exec チェックをスキップします。書き込みモードでは、`--allow-exec` が設定されていない場合、exec SecretRef またはプロバイダーを含むプランを拒否します。

    厳格なターゲット／パスの契約の詳細と正確な拒否ルールについては、[シークレット適用プランの契約](/ja-JP/gateway/secrets-plan-contract)を参照してください。

  </Accordion>
</AccordionGroup>

## 一方向の安全性ポリシー

<Warning>
OpenClaw は、過去の平文シークレット値を含むロールバック用バックアップを意図的に書き込みません。
</Warning>

安全性モデル:

- 書き込みモードの前に、事前チェックが成功する必要があります。
- コミット前に、ランタイムのアクティベーションが検証されます。
- 適用処理では、アトミックなファイル置換を使用してファイルを更新し、失敗時にはベストエフォートで復元します。

## レガシー認証の互換性に関する注意事項

静的な認証情報については、ランタイムは平文のレガシー認証ストレージに依存しなくなりました。

- ランタイムの認証情報ソースは、解決済みのインメモリスナップショットです。
- レガシーな静的 `api_key` エントリは、検出時に消去されます。
- OAuth 関連の互換動作は分離されたままです。

## Web UI に関する注意

一部の SecretInput ユニオンは、フォームモードよりも raw editor モードのほうが構成しやすくなっています。

## 関連項目

- [認証](/ja-JP/gateway/authentication) - 認証のセットアップ
- [CLI: シークレット](/ja-JP/cli/secrets) - CLI コマンド
- [Vault SecretRef](/plugins/vault) - HashiCorp Vault プロバイダーのセットアップ
- [環境変数](/ja-JP/help/environment) - 環境変数の優先順位
- [SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface) - 認証情報サーフェス
- [シークレット適用プランの契約](/ja-JP/gateway/secrets-plan-contract) - プラン契約の詳細
- [セキュリティ](/ja-JP/gateway/security) - セキュリティ態勢

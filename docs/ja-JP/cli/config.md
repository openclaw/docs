---
read_when:
    - 設定を非対話的に読み取りまたは編集したい
sidebarTitle: Config
summary: '`openclaw config` の CLI リファレンス (get/set/patch/unset/file/schema/validate)'
title: 設定
x-i18n:
    generated_at: "2026-05-03T21:28:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7be6a2ff8474fe78deb1d32dd822a4cf8a2b420dfb45306be5d7c5a1d54f0b4d
    source_path: cli/config.md
    workflow: 16
---

`openclaw.json` の非対話型編集向けの設定ヘルパーです。パスで値を get/set/patch/unset/file/schema/validate し、有効な設定ファイルを出力します。サブコマンドなしで実行すると、設定ウィザードが開きます（`openclaw configure` と同じ）。

## ルートオプション

<ParamField path="--section <section>" type="string">
  サブコマンドなしで `openclaw config` を実行したときの、繰り返し指定できるガイド付きセットアップのセクションフィルターです。
</ParamField>

サポートされるガイド付きセクション: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`。

## 例

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

`openclaw.json` 用に生成された JSON スキーマを JSON として stdout に出力します。

<AccordionGroup>
  <Accordion title="含まれる内容">
    - 現在のルート設定スキーマと、エディターツール向けのルート `$schema` 文字列フィールド。
    - Control UI で使用されるフィールドの `title` と `description` のドキュメントメタデータ。
    - ネストしたオブジェクト、ワイルドカード（`*`）、配列項目（`[]`）ノードは、一致するフィールドドキュメントが存在する場合、同じ `title` / `description` メタデータを継承します。
    - `anyOf` / `oneOf` / `allOf` ブランチも、一致するフィールドドキュメントが存在する場合、同じドキュメントメタデータを継承します。
    - ランタイムマニフェストを読み込める場合、ベストエフォートのライブ Plugin + チャンネルスキーマメタデータ。
    - 現在の設定が無効な場合でも、クリーンなフォールバックスキーマ。

  </Accordion>
  <Accordion title="関連するランタイム RPC">
    `config.schema.lookup` は、浅いスキーマノード（`title`, `description`, `type`, `enum`, `const`, 共通の境界）、一致した UI ヒントメタデータ、直下の子要素サマリーを含む、正規化された設定パスを 1 つ返します。Control UI またはカスタムクライアントで、パス範囲の掘り下げに使用します。
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

他のツールで検査または検証したい場合は、ファイルにパイプします。

```bash
openclaw config schema > openclaw.schema.json
```

### パス

パスはドット記法またはブラケット記法を使います。

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

特定のエージェントを対象にするには、エージェントリストのインデックスを使います。

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## 値

値は可能な場合 JSON5 として解析されます。それ以外の場合は文字列として扱われます。JSON5 解析を必須にするには `--strict-json` を使います。`--json` は従来のエイリアスとして引き続きサポートされています。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` は、ターミナル用に整形されたテキストではなく、生の値を JSON として出力します。

<Note>
オブジェクト代入は、デフォルトで対象パスを置き換えます。`agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries`, `auth.profiles` など、ユーザー追加エントリーを保持することが多い保護対象のマップ/リストパスでは、`--replace` を渡さない限り、既存エントリーを削除する置き換えは拒否されます。
</Note>

それらのマップにエントリーを追加するときは `--merge` を使います。

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

指定した値を完全な対象値にしたいことが明確な場合にのみ、`--replace` を使います。

## `config set` モード

`openclaw config set` は 4 つの代入スタイルをサポートしています。

<Tabs>
  <Tab title="値モード">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="SecretRef ビルダーモード">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Provider ビルダーモード">
    Provider ビルダーモードは `secrets.providers.<alias>` パスのみを対象にします。

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="バッチモード">
    ```bash
    openclaw config set --batch-json '[
      {
        "path": "secrets.providers.default",
        "provider": { "source": "env" }
      },
      {
        "path": "channels.discord.token",
        "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
      }
    ]'
    ```

    ```bash
    openclaw config set --batch-file ./config-set.batch.json --dry-run
    ```

  </Tab>
</Tabs>

<Warning>
SecretRef 代入は、サポートされていないランタイム変更可能サーフェス（たとえば `hooks.token`, `commands.ownerDisplaySecret`, Discord スレッドバインディング Webhook トークン、WhatsApp 認証情報 JSON）では拒否されます。[SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface) を参照してください。
</Warning>

バッチ解析では、常にバッチペイロード（`--batch-json`/`--batch-file`）を信頼できるソースとして使います。`--strict-json` / `--json` はバッチ解析の動作を変更しません。

## `config patch`

パスベースの `config set` コマンドを多数実行する代わりに、設定形式のパッチを貼り付ける、またはパイプしたい場合は `config patch` を使います。入力は JSON5 オブジェクトです。オブジェクトは再帰的にマージされ、配列とスカラー値は対象値を置き換え、`null` は対象パスを削除します。

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

stdin 経由でパッチをパイプすることもできます。これはリモートセットアップスクリプトに便利です。

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

パッチ例:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
      },
    },
  },
}
```

1 つのオブジェクトまたは配列を、再帰的にパッチするのではなく、指定した値そのものにしたい場合は `--replace-path <path>` を使います。

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` は書き込みなしで、スキーマと SecretRef の解決可能性チェックを実行します。exec backed の SecretRefs は、ドライラン中はデフォルトでスキップされます。ドライランで provider コマンドを実行したいことが明確な場合は `--allow-exec` を追加します。

JSON パス/値モードは、SecretRefs と providers の両方で引き続きサポートされています。

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Provider ビルダーフラグ

Provider ビルダーの対象は、パスとして `secrets.providers.<alias>` を使う必要があります。

<AccordionGroup>
  <Accordion title="共通フラグ">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Env provider (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>`（繰り返し指定可）

  </Accordion>
  <Accordion title="File provider (--provider-source file)">
    - `--provider-path <path>`（必須）
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec provider (--provider-source exec)">
    - `--provider-command <path>`（必須）
    - `--provider-arg <arg>`（繰り返し指定可）
    - `--provider-no-output-timeout-ms <ms>`
    - `--provider-max-output-bytes <bytes>`
    - `--provider-json-only`
    - `--provider-env <KEY=VALUE>`（繰り返し指定可）
    - `--provider-pass-env <ENV_VAR>`（繰り返し指定可）
    - `--provider-trusted-dir <path>`（繰り返し指定可）
    - `--provider-allow-insecure-path`
    - `--provider-allow-symlink-command`

  </Accordion>
</AccordionGroup>

強化された exec provider の例:

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## ドライラン

`openclaw.json` に書き込まずに変更を検証するには、`--dry-run` を使います。

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

<AccordionGroup>
  <Accordion title="ドライランの動作">
    - ビルダーモード: 変更された refs/providers について SecretRef 解決可能性チェックを実行します。
    - JSON モード（`--strict-json`, `--json`, またはバッチモード）: スキーマ検証と SecretRef 解決可能性チェックを実行します。
    - 既知のサポート対象外 SecretRef 対象サーフェスについて、ポリシー検証も実行されます。
    - ポリシーチェックは変更後の設定全体を評価するため、親オブジェクト書き込み（たとえば `hooks` をオブジェクトとして設定すること）でサポート対象外サーフェス検証を回避することはできません。
    - exec SecretRef チェックは、コマンドの副作用を避けるため、ドライラン中はデフォルトでスキップされます。
    - exec SecretRef チェックにオプトインするには、`--dry-run` とともに `--allow-exec` を使います（これにより provider コマンドが実行される場合があります）。
    - `--allow-exec` はドライラン専用で、`--dry-run` なしで使うとエラーになります。

  </Accordion>
  <Accordion title="--dry-run --json フィールド">
    `--dry-run --json` は機械可読レポートを出力します。

    - `ok`: ドライランが成功したかどうか
    - `operations`: 評価された代入の数
    - `checks`: スキーマ/解決可能性チェックが実行されたかどうか
    - `checks.resolvabilityComplete`: 解決可能性チェックが完了まで実行されたかどうか（exec refs がスキップされた場合は false）
    - `refsChecked`: ドライラン中に実際に解決された refs の数
    - `skippedExecRefs`: `--allow-exec` が設定されていないためスキップされた exec refs の数
    - `errors`: `ok=false` の場合の構造化されたスキーマ/解決可能性エラー

  </Accordion>
</AccordionGroup>

### JSON 出力の形状

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "schema" | "resolvability",
      message: string,
      ref?: string, // present for resolvability errors
    },
  ],
}
```

<Tabs>
  <Tab title="成功例">
    ```json
    {
      "ok": true,
      "operations": 1,
      "configPath": "~/.openclaw/openclaw.json",
      "inputModes": ["builder"],
      "checks": {
        "schema": false,
        "resolvability": true,
        "resolvabilityComplete": true
      },
      "refsChecked": 1,
      "skippedExecRefs": 0
    }
    ```
  </Tab>
  <Tab title="失敗例">
    ```json
    {
      "ok": false,
      "operations": 1,
      "configPath": "~/.openclaw/openclaw.json",
      "inputModes": ["builder"],
      "checks": {
        "schema": false,
        "resolvability": true,
        "resolvabilityComplete": true
      },
      "refsChecked": 1,
      "skippedExecRefs": 0,
      "errors": [
        {
          "kind": "resolvability",
          "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="dry-run が失敗する場合">
    - `config schema validation failed`: 変更後の設定形状が無効です。path/value または provider/ref オブジェクトの形状を修正してください。
    - `Config policy validation failed: unsupported SecretRef usage`: その認証情報を plaintext/string 入力へ戻し、SecretRefs はサポート対象のサーフェスでのみ使用してください。
    - `SecretRef assignment(s) could not be resolved`: 参照された provider/ref は現在解決できません。env var の欠落、無効なファイルポインター、exec provider の失敗、または provider/source の不一致が考えられます。
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run は exec refs をスキップしました。exec の解決可能性検証が必要な場合は `--allow-exec` を付けて再実行してください。
    - バッチモードでは、失敗したエントリを修正し、書き込む前に `--dry-run` を再実行してください。

  </Accordion>
</AccordionGroup>

## 書き込みの安全性

`openclaw config set` とその他の OpenClaw 管理の設定書き込み機能は、ディスクへコミットする前に変更後の設定全体を検証します。新しいペイロードがスキーマ検証に失敗するか、破壊的な上書きに見える場合、アクティブな設定はそのまま維持され、拒否されたペイロードは `openclaw.json.rejected.*` として同じ場所に保存されます。

<Warning>
アクティブな設定パスは通常ファイルである必要があります。シンボリックリンクされた `openclaw.json` 配置は書き込みではサポートされません。代わりに `OPENCLAW_CONFIG_PATH` を使用して実ファイルを直接指してください。
</Warning>

小さな編集では CLI による書き込みを優先してください:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

書き込みが拒否された場合は、保存されたペイロードを確認し、設定全体の形状を修正してください:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

エディターによる直接書き込みも引き続き可能ですが、実行中の Gateway は検証されるまでそれらを信頼されていないものとして扱います。無効な直接編集は起動に失敗するか、ホットリロードでスキップされます。Gateway は `openclaw.json` を書き換えません。プレフィックス付きまたは破壊的に上書きされた設定を修復するか、最後に正常と判定されたコピーを復元するには、`openclaw doctor --fix` を実行してください。[Gateway のトラブルシューティング](/ja-JP/gateway/troubleshooting#gateway-rejected-invalid-config)を参照してください。

ファイル全体の復旧は doctor 修復専用です。Plugin スキーマ変更や `minHostVersion` のずれは、モデル、プロバイダー、認証プロファイル、チャンネル、Gateway の公開設定、ツール、メモリ、ブラウザー、Cron 設定などの無関係なユーザー設定をロールバックするのではなく、明示的に通知される状態のままになります。

## サブコマンド

- `config file`: アクティブな設定ファイルパスを出力します（`OPENCLAW_CONFIG_PATH` またはデフォルトの場所から解決）。パスはシンボリックリンクではなく通常ファイルを指す必要があります。

編集後に Gateway を再起動してください。

## 検証

Gateway を起動せずに、現在の設定をアクティブなスキーマに対して検証します。

```bash
openclaw config validate
openclaw config validate --json
```

`openclaw config validate` が合格したら、local TUI を使用して、同じターミナルから各変更を検証しながら、埋め込みエージェントにアクティブな設定をドキュメントと比較させることができます:

<Note>
検証がすでに失敗している場合は、`openclaw configure` または `openclaw doctor --fix` から始めてください。`openclaw chat` は無効設定ガードをバイパスしません。
</Note>

```bash
openclaw chat
```

次に TUI 内で:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

典型的な修復ループ:

<Steps>
  <Step title="ドキュメントと比較">
    エージェントに、現在の設定を関連するドキュメントページと比較し、最小の修正を提案するよう依頼します。
  </Step>
  <Step title="対象を絞った編集を適用">
    `openclaw config set` または `openclaw configure` で対象を絞った編集を適用します。
  </Step>
  <Step title="再検証">
    各変更後に `openclaw config validate` を再実行します。
  </Step>
  <Step title="ランタイム問題には doctor">
    検証は通るもののランタイムがまだ正常でない場合は、移行と修復の支援として `openclaw doctor` または `openclaw doctor --fix` を実行します。
  </Step>
</Steps>

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [設定](/ja-JP/gateway/configuration)

---
read_when:
    - 設定を非対話的に読み取りまたは編集したい場合
sidebarTitle: Config
summary: '`openclaw config` の CLI リファレンス (get/set/patch/unset/file/schema/validate)'
title: 設定
x-i18n:
    generated_at: "2026-05-06T17:52:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: e4e0d580347e162278277ddb33eed0e42105c5e85bac4325c07fa2cd700b831d
    source_path: cli/config.md
    workflow: 16
---

`openclaw.json` の非対話的な編集用の構成ヘルパー: パスで値を get/set/patch/unset/file/schema/validate し、アクティブな構成ファイルを出力します。サブコマンドなしで実行すると、構成ウィザードを開きます (`openclaw configure` と同じ)。

<Note>
`OPENCLAW_NIX_MODE=1` の場合、OpenClaw は `openclaw.json` を不変として扱います。`config get`、`config file`、`config schema`、`config validate` などの読み取り専用コマンドは引き続き動作しますが、構成を書き込むコマンドは拒否されます。代わりに、エージェントはインストール用の Nix ソースを編集してください。ファーストパーティの nix-openclaw ディストリビューションでは、[nix-openclaw クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start) を使用し、`programs.openclaw.config` または `instances.<name>.config` 配下に値を設定します。
</Note>

## ルートオプション

<ParamField path="--section <section>" type="string">
  `openclaw config` をサブコマンドなしで実行するときに使う、繰り返し指定可能なガイド付きセットアップのセクションフィルター。
</ParamField>

対応するガイド付きセクション: `workspace`、`model`、`web`、`gateway`、`daemon`、`channels`、`plugins`、`skills`、`health`。

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

生成された `openclaw.json` 用の JSON スキーマを JSON として stdout に出力します。

<AccordionGroup>
  <Accordion title="含まれる内容">
    - 現在のルート構成スキーマに加えて、エディターツール向けのルート `$schema` 文字列フィールド。
    - Control UI で使用されるフィールド `title` と `description` のドキュメントメタデータ。
    - ネストしたオブジェクト、ワイルドカード (`*`)、配列項目 (`[]`) ノードは、一致するフィールドドキュメントが存在する場合、同じ `title` / `description` メタデータを継承します。
    - `anyOf` / `oneOf` / `allOf` ブランチも、一致するフィールドドキュメントが存在する場合、同じドキュメントメタデータを継承します。
    - ランタイムマニフェストを読み込める場合は、ベストエフォートのライブ Plugin + チャネルスキーマメタデータ。
    - 現在の構成が無効な場合でも、クリーンなフォールバックスキーマ。

  </Accordion>
  <Accordion title="関連するランタイム RPC">
    `config.schema.lookup` は、浅いスキーマノード (`title`、`description`、`type`、`enum`、`const`、共通の境界)、一致した UI ヒントメタデータ、直下の子要素の概要を含む、正規化された構成パスを 1 つ返します。Control UI またはカスタムクライアントで、パス単位のドリルダウンに使用します。
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

パスにはドット表記またはブラケット表記を使用します。

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

特定のエージェントを対象にするには、エージェントリストのインデックスを使用します。

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## 値

値は可能な場合 JSON5 として解析されます。それ以外の場合は文字列として扱われます。JSON5 解析を必須にするには `--strict-json` を使用します。`--json` はレガシーエイリアスとして引き続きサポートされます。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` は、ターミナル用に整形されたテキストではなく、生の値を JSON として出力します。

<Note>
オブジェクト代入はデフォルトで対象パスを置き換えます。`agents.defaults.models`、`models.providers`、`models.providers.<id>.models`、`plugins.entries`、`auth.profiles` など、ユーザーが追加したエントリーを保持することが多い保護されたマップ/リストパスでは、`--replace` を渡さない限り、既存エントリーを削除する置換は拒否されます。
</Note>

これらのマップにエントリーを追加するときは `--merge` を使用します。

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

指定した値を完全な対象値にする意図がある場合にのみ、`--replace` を使用します。

## `config set` モード

`openclaw config set` は 4 つの代入スタイルに対応しています。

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
SecretRef 代入は、対応していないランタイム可変サーフェス (例: `hooks.token`、`commands.ownerDisplaySecret`、Discord のスレッドバインディング Webhook トークン、WhatsApp の認証情報 JSON) では拒否されます。[SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface) を参照してください。
</Warning>

バッチ解析では、常にバッチペイロード (`--batch-json`/`--batch-file`) を信頼できる情報源として使用します。`--strict-json` / `--json` はバッチ解析の挙動を変更しません。

## `config patch`

多数のパスベースの `config set` コマンドを実行する代わりに、構成形式のパッチを貼り付けたりパイプしたりしたい場合は `config patch` を使用します。入力は JSON5 オブジェクトです。オブジェクトは再帰的にマージされ、配列とスカラー値は対象値を置き換え、`null` は対象パスを削除します。

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

stdin 経由でパッチをパイプすることもできます。これはリモートセットアップスクリプトで便利です。

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

1 つのオブジェクトまたは配列を、再帰的にパッチするのではなく、指定した値そのものにしたい場合は `--replace-path <path>` を使用します。

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` は書き込みを行わずに、スキーマと SecretRef の解決可能性チェックを実行します。exec ベースの SecretRefs は、dry-run 中はデフォルトでスキップされます。dry-run で provider コマンドを意図的に実行したい場合は `--allow-exec` を追加します。

JSON パス/値モードは、SecretRefs と providers の両方で引き続きサポートされます。

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Provider ビルダーフラグ

Provider ビルダーの対象は、パスとして `secrets.providers.<alias>` を使用する必要があります。

<AccordionGroup>
  <Accordion title="共通フラグ">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Env provider (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (繰り返し指定可能)

  </Accordion>
  <Accordion title="File provider (--provider-source file)">
    - `--provider-path <path>` (必須)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec provider (--provider-source exec)">
    - `--provider-command <path>` (必須)
    - `--provider-arg <arg>` (繰り返し指定可能)
    - `--provider-no-output-timeout-ms <ms>`
    - `--provider-max-output-bytes <bytes>`
    - `--provider-json-only`
    - `--provider-env <KEY=VALUE>` (繰り返し指定可能)
    - `--provider-pass-env <ENV_VAR>` (繰り返し指定可能)
    - `--provider-trusted-dir <path>` (繰り返し指定可能)
    - `--provider-allow-insecure-path`
    - `--provider-allow-symlink-command`

  </Accordion>
</AccordionGroup>

堅牢化した exec provider の例:

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

## Dry run

`openclaw.json` に書き込まずに変更を検証するには、`--dry-run` を使用します。

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
  <Accordion title="Dry-run の挙動">
    - ビルダーモード: 変更された refs/providers に対して SecretRef の解決可能性チェックを実行します。
    - JSON モード (`--strict-json`、`--json`、またはバッチモード): スキーマ検証に加えて SecretRef の解決可能性チェックを実行します。
    - 既知の非対応 SecretRef 対象サーフェスに対しても、ポリシー検証が実行されます。
    - ポリシーチェックは変更後の構成全体を評価するため、親オブジェクトの書き込み (たとえば `hooks` をオブジェクトとして設定すること) で非対応サーフェス検証を回避することはできません。
    - Exec SecretRef チェックは、コマンドの副作用を避けるため、dry-run 中はデフォルトでスキップされます。
    - Exec SecretRef チェックにオプトインするには、`--dry-run` とともに `--allow-exec` を使用します (これにより provider コマンドが実行される場合があります)。
    - `--allow-exec` は dry-run 専用であり、`--dry-run` なしで使用するとエラーになります。

  </Accordion>
  <Accordion title="--dry-run --json フィールド">
    `--dry-run --json` は機械可読なレポートを出力します:

    - `ok`: dry-run が成功したかどうか
    - `operations`: 評価された割り当ての数
    - `checks`: schema/解決可能性チェックが実行されたかどうか
    - `checks.resolvabilityComplete`: 解決可能性チェックが完了まで実行されたかどうか (exec refs がスキップされた場合は false)
    - `refsChecked`: dry-run 中に実際に解決された refs の数
    - `skippedExecRefs`: `--allow-exec` が設定されていなかったためスキップされた exec refs の数
    - `errors`: `ok=false` の場合の構造化された schema/解決可能性の失敗

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
  <Accordion title="dry-run が失敗した場合">
    - `config schema validation failed`: 変更後の config 形状が無効です。path/value または provider/ref オブジェクトの形状を修正してください。
    - `Config policy validation failed: unsupported SecretRef usage`: その credential を plaintext/string 入力に戻し、SecretRefs はサポート対象の surface でのみ使用してください。
    - `SecretRef assignment(s) could not be resolved`: 参照された provider/ref は現在解決できません (env var の欠落、無効な file pointer、exec provider の失敗、または provider/source の不一致)。
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run は exec refs をスキップしました。exec の解決可能性検証が必要な場合は `--allow-exec` を付けて再実行してください。
    - batch mode の場合は、失敗したエントリを修正し、書き込む前に `--dry-run` を再実行してください。

  </Accordion>
</AccordionGroup>

## 書き込みの安全性

`openclaw config set` およびその他の OpenClaw 所有の config writer は、disk にコミットする前に変更後の config 全体を検証します。新しい payload が schema validation に失敗した場合、または破壊的な上書きに見える場合、active config はそのまま残され、拒否された payload は隣に `openclaw.json.rejected.*` として保存されます。

<Warning>
active config path は通常ファイルでなければなりません。symlink された `openclaw.json` レイアウトは書き込みではサポートされません。代わりに `OPENCLAW_CONFIG_PATH` を使用して実ファイルを直接指してください。
</Warning>

小さな編集には CLI 書き込みを推奨します。

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

書き込みが拒否された場合は、保存された payload を調べ、config 全体の形状を修正してください。

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

エディタでの直接書き込みも引き続き許可されますが、実行中の Gateway は検証が通るまでそれらを信頼されないものとして扱います。無効な直接編集は起動に失敗するか、hot reload によってスキップされます。Gateway は `openclaw.json` を書き換えません。prefixed/clobbered config を修復するか、last-known-good copy を復元するには `openclaw doctor --fix` を実行してください。[Gateway troubleshooting](/ja-JP/gateway/troubleshooting#gateway-rejected-invalid-config) を参照してください。

whole-file recovery は doctor repair 専用です。Plugin schema の変更や `minHostVersion` のずれは、models、providers、auth profiles、channels、gateway exposure、tools、memory、browser、cron config などの無関係なユーザー設定をロールバックするのではなく、明示的に表面化されます。

## サブコマンド

- `config file`: active config file path (`OPENCLAW_CONFIG_PATH` または既定の場所から解決) を出力します。この path は symlink ではなく通常ファイルを指している必要があります。

編集後に gateway を再起動してください。

## 検証

gateway を起動せずに、現在の config を active schema に対して検証します。

```bash
openclaw config validate
openclaw config validate --json
```

`openclaw config validate` が成功するようになったら、同じ terminal で各変更を検証しながら、local TUI を使って埋め込み agent に active config と docs を比較させることができます。

<Note>
検証がすでに失敗している場合は、`openclaw configure` または `openclaw doctor --fix` から始めてください。`openclaw chat` は invalid-config guard を迂回しません。
</Note>

```bash
openclaw chat
```

その後、TUI 内で次を実行します。

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

典型的な修復ループ:

<Steps>
  <Step title="docs と比較する">
    agent に現在の config を関連する docs page と比較させ、最小の修正を提案させます。
  </Step>
  <Step title="対象を絞った編集を適用する">
    `openclaw config set` または `openclaw configure` で対象を絞った編集を適用します。
  </Step>
  <Step title="再検証する">
    各変更後に `openclaw config validate` を再実行します。
  </Step>
  <Step title="runtime の問題には doctor を使う">
    検証は通るのに runtime がまだ正常でない場合は、migration と repair の支援のために `openclaw doctor` または `openclaw doctor --fix` を実行します。
  </Step>
</Steps>

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Configuration](/ja-JP/gateway/configuration)

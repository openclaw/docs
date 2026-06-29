---
read_when:
    - config を非対話的に読み取りまたは編集したい
sidebarTitle: Config
summary: '`openclaw config` の CLI リファレンス (get/set/patch/unset/file/schema/validate)'
title: 設定
x-i18n:
    generated_at: "2026-06-28T22:33:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 92878977e8fb6670f12c0a77937a7c41f9230da82e20ec7690731bbda1e910ca
    source_path: cli/config.md
    workflow: 16
---

`openclaw.json` の非対話型編集用 Config ヘルパー: パスによる値の get/set/patch/unset/file/schema/validate と、アクティブな config ファイルの出力。サブコマンドなしで実行すると、configure ウィザードを開きます（`openclaw configure` と同じ）。

<Note>
`OPENCLAW_NIX_MODE=1` の場合、OpenClaw は `openclaw.json` を不変として扱います。`config get`、`config file`、`config schema`、`config validate` などの読み取り専用コマンドは引き続き動作しますが、config の書き込みは拒否されます。Agents は代わりにインストール用の Nix ソースを編集してください。ファーストパーティの nix-openclaw ディストリビューションでは、[nix-openclaw クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start) を使用し、`programs.openclaw.config` または `instances.<name>.config` 配下に値を設定します。
</Note>

## ルートオプション

<ParamField path="--section <section>" type="string">
  サブコマンドなしで `openclaw config` を実行するときの、繰り返し指定可能なガイド付きセットアップのセクションフィルター。
</ParamField>

サポートされるガイド付きセクション: `workspace`、`model`、`web`、`gateway`、`daemon`、`channels`、`plugins`、`skills`、`health`。

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
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
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

`openclaw.json` 用に生成された JSON schema を JSON として stdout に出力します。

<AccordionGroup>
  <Accordion title="含まれる内容">
    - 現在のルート config schema と、エディター向けツール用のルート `$schema` 文字列フィールド。
    - Control UI が使用するフィールド `title` と `description` の docs メタデータ。
    - ネストされた object、ワイルドカード（`*`）、array-item（`[]`）ノードは、一致するフィールドドキュメントが存在する場合、同じ `title` / `description` メタデータを継承します。
    - `anyOf` / `oneOf` / `allOf` ブランチも、一致するフィールドドキュメントが存在する場合、同じ docs メタデータを継承します。
    - runtime manifest を読み込める場合、ベストエフォートのライブ plugin + channel schema メタデータ。
    - 現在の config が無効な場合でも、クリーンなフォールバック schema。

  </Accordion>
  <Accordion title="関連する runtime RPC">
    `config.schema.lookup` は、浅い schema ノード（`title`、`description`、`type`、`enum`、`const`、一般的な境界）、一致した UI hint メタデータ、および直下の子要素の要約を含む、正規化された config パスを 1 つ返します。Control UI またはカスタムクライアントで、パス範囲のドリルダウンに使用します。
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

パスにはドット記法またはブラケット記法を使用します。zsh などの shell が OpenClaw にパスが渡る前に `[0]` を glob として展開しないように、shell の例ではブラケット記法のパスを引用符で囲みます。

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
```

特定の agent を対象にするには、agent list index を使用します。

```bash
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

## 値

値は可能な場合 JSON5 として解析されます。それ以外の場合は文字列として扱われます。文字列へのフォールバックなしで標準 JSON 解析を必須にするには、`--strict-json` を使用します。`--json` は `--strict-json` の legacy alias として引き続きサポートされます。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`--strict-json` が有効な場合、コメント、末尾のカンマ、引用符なしの object key などの JSON5 専用構文は拒否されます。raw-string フォールバック付きの JSON5 value parsing を行うには、`--strict-json` を省略します。

`config get <path> --json` は、terminal-formatted text ではなく raw value を JSON として出力します。

<Note>
object の代入は、デフォルトで対象パスを置き換えます。`agents.defaults.models`、`models.providers`、`models.providers.<id>.models`、`plugins.entries`、`auth.profiles` など、ユーザーが追加したエントリを保持することが多い保護された map/list パスでは、`--replace` を渡さない限り、既存エントリを削除する置き換えは拒否されます。
</Note>

これらの map にエントリを追加するときは、`--merge` を使用します。

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

指定した値を完全な対象値にする意図がある場合にのみ、`--replace` を使用します。

## `config set` モード

`openclaw config set` は 4 つの代入スタイルをサポートします。

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
    Provider ビルダーモードは、`secrets.providers.<alias>` パスのみを対象にします。

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
SecretRef の代入は、サポートされていない runtime-mutable surface（例: `hooks.token`、`commands.ownerDisplaySecret`、Discord thread-binding webhook tokens、WhatsApp creds JSON）では拒否されます。[SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface) を参照してください。
</Warning>

バッチ解析では常に batch payload（`--batch-json`/`--batch-file`）を信頼できる情報源として使用します。`--strict-json` / `--json` は batch parsing behavior を変更しません。

## `config patch`

多数のパスベースの `config set` コマンドを実行する代わりに、config 形状の patch を貼り付けたりパイプしたりしたい場合は、`config patch` を使用します。入力は JSON5 object です。object は再帰的にマージされ、array と scalar value は対象値を置き換え、`null` は対象パスを削除します。

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

stdin 経由で patch をパイプすることもできます。これは remote setup scripts に便利です。

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

patch の例:

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

1 つの object または array を、再帰的に patch するのではなく、指定された値そのものにしたい場合は、`--replace-path <path>` を使用します。

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` は、書き込みを行わずに schema と SecretRef の解決可能性チェックを実行します。exec-backed SecretRefs は dry-run 中はデフォルトでスキップされます。dry-run で provider commands を実行する意図がある場合は、`--allow-exec` を追加します。

SecretRefs と providers の両方で、JSON path/value mode は引き続きサポートされます。

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Provider builder flags

Provider builder targets は、パスとして `secrets.providers.<alias>` を使用する必要があります。

<AccordionGroup>
  <Accordion title="共通フラグ">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>`（`file`、`exec`）

  </Accordion>
  <Accordion title="Env provider (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>`（繰り返し指定可能）

  </Accordion>
  <Accordion title="File provider (--provider-source file)">
    - `--provider-path <path>`（必須）
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec provider (--provider-source exec)">
    - `--provider-command <path>`（必須）
    - `--provider-arg <arg>`（繰り返し指定可能）
    - `--provider-no-output-timeout-ms <ms>`
    - `--provider-max-output-bytes <bytes>`
    - `--provider-json-only`
    - `--provider-env <KEY=VALUE>`（繰り返し指定可能）
    - `--provider-pass-env <ENV_VAR>`（繰り返し指定可能）
    - `--provider-trusted-dir <path>`（繰り返し指定可能）
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
  <Accordion title="ドライランの動作">
    - ビルダーモード: 変更された refs/providers に対して SecretRef の解決可能性チェックを実行します。
    - JSON モード（`--strict-json`、`--json`、またはバッチモード）: スキーマ検証に加えて SecretRef の解決可能性チェックを実行します。
    - 既知の未対応 SecretRef ターゲットサーフェスに対してもポリシー検証が実行されます。
    - ポリシーチェックは変更後の config 全体を評価するため、親オブジェクトの書き込み（たとえば `hooks` をオブジェクトとして設定すること）で未対応サーフェス検証を回避することはできません。
    - コマンドの副作用を避けるため、ドライラン中は Exec SecretRef チェックがデフォルトでスキップされます。
    - Exec SecretRef チェックを有効にするには、`--dry-run` と一緒に `--allow-exec` を使用します（これにより provider コマンドが実行される場合があります）。
    - `--allow-exec` はドライラン専用であり、`--dry-run` なしで使用するとエラーになります。

  </Accordion>
  <Accordion title="--dry-run --json フィールド">
    `--dry-run --json` は機械判読可能なレポートを出力します。

    - `ok`: ドライランが成功したかどうか
    - `operations`: 評価された代入の数
    - `checks`: スキーマ/解決可能性チェックが実行されたかどうか
    - `checks.resolvabilityComplete`: 解決可能性チェックが最後まで実行されたかどうか（exec refs がスキップされた場合は false）
    - `refsChecked`: ドライラン中に実際に解決された refs の数
    - `skippedExecRefs`: `--allow-exec` が設定されていなかったためスキップされた exec refs の数
    - `errors`: `ok=false` の場合の、構造化された missing-path、schema、または resolvability の失敗

  </Accordion>
</AccordionGroup>

### JSON 出力の形

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder" | "unset", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "missing-path" | "schema" | "resolvability",
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
  <Accordion title="ドライランが失敗した場合">
    - `config schema validation failed`: 変更後の config の形が無効です。path/value または provider/ref オブジェクトの形を修正してください。
    - `Config policy validation failed: unsupported SecretRef usage`: その認証情報をプレーンテキスト/文字列入力に戻し、SecretRefs は対応済みサーフェスでのみ使用してください。
    - `SecretRef assignment(s) could not be resolved`: 参照された provider/ref は現在解決できません（env var の欠落、無効なファイルポインター、exec provider の失敗、または provider/source の不一致）。
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: ドライランが exec refs をスキップしました。exec の解決可能性検証が必要な場合は `--allow-exec` を付けて再実行してください。
    - バッチモードでは、失敗したエントリを修正し、書き込む前に `--dry-run` を再実行してください。

  </Accordion>
</AccordionGroup>

## 書き込みの安全性

`openclaw config set` とその他の OpenClaw 所有の config ライターは、ディスクへコミットする前に変更後の config 全体を検証します。新しいペイロードがスキーマ検証に失敗した場合、または破壊的な上書きのように見える場合、アクティブな config はそのまま残され、拒否されたペイロードは `openclaw.json.rejected.*` として隣に保存されます。

<Warning>
アクティブな config パスは通常ファイルである必要があります。シンボリックリンクされた `openclaw.json` レイアウトは書き込みでは未対応です。代わりに `OPENCLAW_CONFIG_PATH` を使用して実ファイルを直接指してください。
</Warning>

小さな編集には CLI 書き込みを推奨します。

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

書き込みが拒否された場合は、保存されたペイロードを確認し、config 全体の形を修正してください。

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

エディターでの直接書き込みも引き続き許可されていますが、実行中の Gateway は検証が通るまでそれらを信頼されていないものとして扱います。無効な直接編集は起動に失敗するか、ホットリロードでスキップされます。Gateway は `openclaw.json` を書き換えません。接頭辞付き/上書きされた config を修復するか、最後に確認済みの正常なコピーを復元するには、`openclaw doctor --fix` を実行してください。[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#gateway-rejected-invalid-config)を参照してください。

ファイル全体の復旧は doctor 修復専用です。Plugin スキーマ変更や `minHostVersion` のずれは、models、providers、auth profiles、channels、gateway exposure、tools、memory、browser、cron config などの無関係なユーザー設定をロールバックするのではなく、明示的なエラーのままにします。

## サブコマンド

- `config file`: アクティブな config ファイルパス（`OPENCLAW_CONFIG_PATH` またはデフォルトの場所から解決）を出力します。このパスはシンボリックリンクではなく通常ファイルを指す必要があります。

編集後は gateway を再起動してください。

## 検証

gateway を起動せずに、現在の config をアクティブなスキーマに対して検証します。

```bash
openclaw config validate
openclaw config validate --json
```

`openclaw config validate` が成功したら、同じターミナルで各変更を検証しながら、ローカル TUI を使用して埋め込み agent にアクティブな config と docs を比較させることができます。

<Note>
検証がすでに失敗している場合は、`openclaw configure` または `openclaw doctor --fix` から開始してください。`openclaw chat` は無効な config のガードを回避しません。
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
  <Step title="docs と比較">
    現在の config を関連する docs ページと比較し、最小の修正を提案するよう agent に依頼します。
  </Step>
  <Step title="対象を絞った編集を適用">
    `openclaw config set` または `openclaw configure` で対象を絞った編集を適用します。
  </Step>
  <Step title="再検証">
    各変更後に `openclaw config validate` を再実行します。
  </Step>
  <Step title="ランタイム問題には doctor">
    検証は通るがランタイムがまだ正常でない場合は、移行と修復の支援として `openclaw doctor` または `openclaw doctor --fix` を実行します。
  </Step>
</Steps>

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [構成](/ja-JP/gateway/configuration)

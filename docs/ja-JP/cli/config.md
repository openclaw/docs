---
read_when:
    - Config を非対話的に読み取りまたは編集したい場合
sidebarTitle: Config
summary: '`openclaw config` の CLI リファレンス（get/set/unset/file/schema/validate）'
title: Config
x-i18n:
    generated_at: "2026-04-26T11:25:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7871ee03a1da6ab5d0881ace7579ce101a89e9f9d05d1a720ff34fd31fa12a9d
    source_path: cli/config.md
    workflow: 15
---

`openclaw.json` を非対話的に編集するための Config ヘルパーです。パス指定で値の get/set/unset/file/schema/validate を行い、現在アクティブな config ファイルを表示します。サブコマンドなしで実行すると、configure ウィザードを開きます（`openclaw configure` と同じ）。

## ルートオプション

<ParamField path="--section <section>" type="string">
  `openclaw config` をサブコマンドなしで実行したときに使う、繰り返し指定可能なガイド付きセットアップのセクションフィルタです。
</ParamField>

対応するガイド付きセクション: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`。

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
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

`openclaw.json` 用に生成された JSON schema を JSON として stdout に出力します。

<AccordionGroup>
  <Accordion title="含まれるもの">
    - 現在のルート config schema と、エディターツール向けのルート `$schema` 文字列フィールド。
    - Control UI が使用するフィールド `title` および `description` のドキュメントメタデータ。
    - ネストされたオブジェクト、ワイルドカード（`*`）、配列項目（`[]`）ノードには、一致するフィールドドキュメントが存在する場合、同じ `title` / `description` メタデータが継承されます。
    - `anyOf` / `oneOf` / `allOf` の分岐にも、一致するフィールドドキュメントが存在する場合、同じドキュメントメタデータが継承されます。
    - ランタイムマニフェストを読み込める場合、ベストエフォートのライブ Plugin + チャネル schema メタデータ。
    - 現在の config が無効な場合でも、問題なく使えるフォールバック schema。

  </Accordion>
  <Accordion title="関連するランタイム RPC">
    `config.schema.lookup` は、正規化された 1 つの config パスに対して、浅い schema ノード（`title`、`description`、`type`、`enum`、`const`、一般的な境界）、一致した UI ヒントメタデータ、および直下の子要約を返します。Control UI やカスタムクライアントで、パススコープのドリルダウンに使用してください。
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

他のツールで確認または検証したい場合は、ファイルにパイプしてください。

```bash
openclaw config schema > openclaw.schema.json
```

### パス

パスにはドット記法またはブラケット記法を使用します。

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

特定のエージェントを指定するには、エージェントリストのインデックスを使います。

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## 値

値は、可能であれば JSON5 として解析され、それ以外は文字列として扱われます。JSON5 解析を必須にするには `--strict-json` を使用します。`--json` も従来のエイリアスとして引き続きサポートされます。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` は、端末向けに整形されたテキストではなく、生の値を JSON として出力します。

<Note>
オブジェクト代入は、デフォルトでは対象パスを置き換えます。`agents.defaults.models`、`models.providers`、`models.providers.<id>.models`、`plugins.entries`、`auth.profiles` など、ユーザー追加エントリを保持することが多い保護された map/list パスでは、`--replace` を指定しない限り、既存エントリを削除する置き換えは拒否されます。
</Note>

これらの map にエントリを追加するには `--merge` を使用します。

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

指定した値を対象全体の値にしたい場合のみ、`--replace` を使用してください。

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
  <Tab title="プロバイダービルダーモード">
    プロバイダービルダーモードは `secrets.providers.<alias>` パスのみを対象にします。

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
SecretRef の代入は、対応していないランタイム可変サーフェスでは拒否されます（例: `hooks.token`、`commands.ownerDisplaySecret`、Discord のスレッドバインディング Webhook token、WhatsApp creds JSON）。[SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface) を参照してください。
</Warning>

バッチ解析は常にバッチペイロード（`--batch-json`/`--batch-file`）を信頼できる情報源として使用します。`--strict-json` / `--json` はバッチ解析の挙動を変更しません。

SecretRef と provider の両方で、JSON パス/値モードも引き続きサポートされます。

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## プロバイダービルダーフラグ

プロバイダービルダーの対象パスには `secrets.providers.<alias>` を使用する必要があります。

<AccordionGroup>
  <Accordion title="共通フラグ">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

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

## ドライラン

`openclaw.json` に書き込まずに変更を検証するには `--dry-run` を使用します。

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
  <Accordion title="ドライランの挙動">
    - ビルダーモード: 変更された ref/provider に対して SecretRef 解決可能性チェックを実行します。
    - JSON モード（`--strict-json`、`--json`、またはバッチモード）: schema 検証と SecretRef 解決可能性チェックを実行します。
    - ポリシー検証は、既知の非対応 SecretRef 対象サーフェスに対しても実行されます。
    - ポリシーチェックは変更後の完全な config を評価するため、親オブジェクトの書き込み（たとえば `hooks` をオブジェクトとして設定すること）によって、非対応サーフェス検証を回避することはできません。
    - コマンド副作用を避けるため、ドライラン中は exec SecretRef チェックはデフォルトでスキップされます。
    - exec SecretRef チェックを有効にするには、`--dry-run` とともに `--allow-exec` を使用してください（これにより provider コマンドが実行される可能性があります）。
    - `--allow-exec` はドライラン専用であり、`--dry-run` なしで使用するとエラーになります。

  </Accordion>
  <Accordion title="--dry-run --json のフィールド">
    `--dry-run --json` は機械可読なレポートを出力します。

    - `ok`: ドライランが成功したかどうか
    - `operations`: 評価された代入の数
    - `checks`: schema/解決可能性チェックが実行されたかどうか
    - `checks.resolvabilityComplete`: 解決可能性チェックが最後まで実行されたかどうか（exec ref がスキップされた場合は false）
    - `refsChecked`: ドライラン中に実際に解決された ref の数
    - `skippedExecRefs`: `--allow-exec` が設定されていないためにスキップされた exec ref の数
    - `errors`: `ok=false` のときの構造化された schema/解決可能性失敗

  </Accordion>
</AccordionGroup>

### JSON 出力形式

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
      ref?: string, // 解決可能性エラーの場合に存在
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
    - `config schema validation failed`: 変更後の config 形式が無効です。パス/値、または provider/ref オブジェクト形式を修正してください。
    - `Config policy validation failed: unsupported SecretRef usage`: その認証情報はプレーンテキスト/文字列入力に戻し、SecretRef は対応サーフェスでのみ使用してください。
    - `SecretRef assignment(s) could not be resolved`: 参照された provider/ref を現在解決できません（env var の不足、無効なファイルポインタ、exec provider の失敗、または provider/source の不一致）。
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: ドライランで exec ref がスキップされました。exec の解決可能性検証が必要な場合は `--allow-exec` を付けて再実行してください。
    - バッチモードでは、失敗したエントリを修正してから、書き込む前に `--dry-run` を再実行してください。

  </Accordion>
</AccordionGroup>

## 書き込みの安全性

`openclaw config set` およびその他の OpenClaw 管理の config 書き込み機能は、ディスクへ反映する前に変更後の config 全体を検証します。新しいペイロードが schema 検証に失敗した場合、または破壊的な上書きに見える場合、アクティブな config はそのまま維持され、拒否されたペイロードは隣に `openclaw.json.rejected.*` として保存されます。

<Warning>
アクティブな config パスは通常ファイルである必要があります。シンボリックリンクされた `openclaw.json` レイアウトは書き込みではサポートされません。代わりに `OPENCLAW_CONFIG_PATH` を使用して実ファイルを直接指定してください。
</Warning>

小さな編集には CLI での書き込みを推奨します。

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

書き込みが拒否された場合は、保存されたペイロードを確認し、config 全体の形式を修正してください。

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

エディターによる直接書き込みも引き続き可能ですが、実行中の Gateway はそれらが検証されるまで信頼しません。無効な直接編集は、起動時またはホットリロード時に、最後に正常だったバックアップから復元されることがあります。[Gateway troubleshooting](/ja-JP/gateway/troubleshooting#gateway-restored-last-known-good-config) を参照してください。

ファイル全体の復旧は、parse エラー、ルートレベルの schema 失敗、旧形式のマイグレーション失敗、Plugin とルートの混在失敗など、config 全体が壊れている場合に限られます。検証失敗が `plugins.entries.<id>...` の配下だけで発生している場合、OpenClaw はアクティブな `openclaw.json` をそのまま維持し、`.last-good` を復元する代わりに Plugin ローカルの問題として報告します。これにより、Plugin schema の変更や `minHostVersion` のずれによって、models、providers、auth profiles、channels、Gateway 公開設定、tools、memory、browser、Cron config など、無関係なユーザー設定が巻き戻されるのを防ぎます。

## サブコマンド

- `config file`: アクティブな config ファイルパスを表示します（`OPENCLAW_CONFIG_PATH` またはデフォルト位置から解決）。このパスはシンボリックリンクではなく通常ファイルを指している必要があります。

編集後は Gateway を再起動してください。

## Validate

Gateway を起動せずに、現在の config をアクティブ schema に対して検証します。

```bash
openclaw config validate
openclaw config validate --json
```

`openclaw config validate` が通るようになったら、ローカル TUI を使って埋め込みエージェントに現在の config とドキュメントを比較させ、同じ端末内で各変更を検証できます。

<Note>
すでに検証が失敗している場合は、`openclaw configure` または `openclaw doctor --fix` から始めてください。`openclaw chat` は無効な config ガードを回避しません。
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

一般的な修復ループ:

<Steps>
  <Step title="ドキュメントと比較">
    現在の config を該当するドキュメントページと比較し、最小の修正案を提案するようエージェントに依頼します。
  </Step>
  <Step title="対象を絞った編集を適用">
    `openclaw config set` または `openclaw configure` で対象を絞った編集を適用します。
  </Step>
  <Step title="再検証">
    変更ごとに `openclaw config validate` を再実行します。
  </Step>
  <Step title="ランタイム問題には doctor">
    検証は通るがランタイムがまだ不健全な場合は、`openclaw doctor` または `openclaw doctor --fix` を実行して、マイグレーションと修復の支援を受けてください。
  </Step>
</Steps>

## 関連

- [CLI reference](/ja-JP/cli)
- [Configuration](/ja-JP/gateway/configuration)

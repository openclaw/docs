---
read_when:
    - configを非対話的に読み取る、または編集したい場合
summary: '`openclaw config` のCLIリファレンス（get/set/unset/file/schema/validate）'
title: config
x-i18n:
    generated_at: "2026-04-23T14:01:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b496b6c02eeb144bfe800b801ea48a178b02bc7a87197dbf189b27d6fcf41c9
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

`openclaw.json` を非対話的に編集するためのconfigヘルパーです: パスごとの値の get/set/unset/file/schema/validate と、アクティブなconfigファイルの表示に対応しています。サブコマンドなしで実行すると、設定ウィザードを開きます（`openclaw configure` と同じ）。

ルートオプション:

- `--section <section>`: サブコマンドなしで `openclaw config` を実行したときに使う、繰り返し指定可能なガイド付きセットアップのセクションフィルター

サポートされるガイド付きセクション:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

## 例

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

生成された `openclaw.json` 用JSON schemaを、JSONとしてstdoutに出力します。

含まれる内容:

- 現在のルートconfig schemaに加え、エディターツール向けのルート `$schema` 文字列フィールド
- Control UIで使用されるフィールド `title` および `description` のドキュメントメタデータ
- 一致するフィールドドキュメントが存在する場合、ネストされたオブジェクト、ワイルドカード（`*`）、配列項目（`[]`）ノードにも同じ `title` / `description` メタデータが継承されます
- 一致するフィールドドキュメントが存在する場合、`anyOf` / `oneOf` / `allOf` ブランチにも同じドキュメントメタデータが継承されます
- ランタイムmanifestを読み込める場合、ベストエフォートのライブPlugin + チャネルschemaメタデータ
- 現在のconfigが無効な場合でもクリーンなフォールバックschema

関連ランタイムRPC:

- `config.schema.lookup` は、正規化された1つのconfig pathと、浅い
  schemaノード（`title`、`description`、`type`、`enum`、`const`、共通の境界値）、
  一致したUIヒントメタデータ、および直下の子要約を返します。これは
  Control UIやカスタムクライアントでのパス単位のドリルダウンに使用します。

```bash
openclaw config schema
```

他のツールで確認または検証したい場合は、ファイルにパイプできます。

```bash
openclaw config schema > openclaw.schema.json
```

### パス

パスはドット記法またはブラケット記法を使用します。

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

特定のagentを対象にするには、agent listのインデックスを使います。

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## 値

値は、可能であればJSON5として解析され、そうでなければ文字列として扱われます。JSON5解析を必須にするには `--strict-json` を使用します。`--json` も旧式エイリアスとして引き続きサポートされています。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` は、ターミナル整形済みテキストの代わりに生の値をJSONとして出力します。

オブジェクト代入は、デフォルトでは対象パスを置き換えます。`agents.defaults.models`、
`models.providers`、`models.providers.<id>.models`、`plugins.entries`、`auth.profiles` のように、
ユーザー追加エントリをよく保持する保護対象のmap/listパスでは、
既存エントリを削除する置換は、`--replace` を渡さない限り拒否されます。

これらのmapにエントリを追加する場合は `--merge` を使用してください。

```bash
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

指定した値を完全な対象値にしたい場合にのみ、`--replace` を使用してください。

## `config set` モード

`openclaw config set` は4つの代入スタイルをサポートします。

1. 値モード: `openclaw config set <path> <value>`
2. SecretRefビルダーモード:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. プロバイダービルダーモード（`secrets.providers.<alias>` パスのみ）:

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. バッチモード（`--batch-json` または `--batch-file`）:

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

ポリシー注記:

- SecretRef代入は、サポートされていないランタイム可変サーフェス（例: `hooks.token`、`commands.ownerDisplaySecret`、DiscordスレッドバインディングWebhook token、WhatsApp creds JSON）では拒否されます。[SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface) を参照してください。

バッチ解析では常に、バッチペイロード（`--batch-json`/`--batch-file`）を信頼できる唯一の情報源として使用します。
`--strict-json` / `--json` はバッチ解析の動作を変えません。

JSON path/valueモードは、SecretRefとプロバイダーの両方で引き続きサポートされます。

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## プロバイダービルダーフラグ

プロバイダービルダーの対象は、パスとして `secrets.providers.<alias>` を使用する必要があります。

共通フラグ:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>`（`file`, `exec`）

Envプロバイダー（`--provider-source env`）:

- `--provider-allowlist <ENV_VAR>`（繰り返し指定可）

Fileプロバイダー（`--provider-source file`）:

- `--provider-path <path>`（必須）
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`

Execプロバイダー（`--provider-source exec`）:

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

強化されたexecプロバイダーの例:

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

ドライランの動作:

- ビルダーモード: 変更されたref/providerに対してSecretRef解決可能性チェックを実行します。
- JSONモード（`--strict-json`、`--json`、またはバッチモード）: schema検証とSecretRef解決可能性チェックを実行します。
- ポリシー検証も、既知の非対応SecretRef対象サーフェスに対して実行されます。
- ポリシーチェックは変更後の完全なconfig全体を評価するため、親オブジェクト書き込み（例: `hooks` をオブジェクトとして設定）では、非対応サーフェス検証を回避できません。
- ドライラン中は、コマンド副作用を避けるため、exec SecretRefチェックはデフォルトでスキップされます。
- exec SecretRefチェックに参加するには、`--dry-run` と一緒に `--allow-exec` を使用してください（これによりプロバイダーコマンドが実行される場合があります）。
- `--allow-exec` はドライラン専用で、`--dry-run` なしで使用するとエラーになります。

`--dry-run --json` は機械可読レポートを出力します。

- `ok`: ドライランが成功したかどうか
- `operations`: 評価された代入数
- `checks`: schema/解決可能性チェックが実行されたかどうか
- `checks.resolvabilityComplete`: 解決可能性チェックが最後まで実行されたかどうか（exec refがスキップされた場合はfalse）
- `refsChecked`: ドライラン中に実際に解決されたref数
- `skippedExecRefs`: `--allow-exec` が未設定のためにスキップされたexec ref数
- `errors`: `ok=false` のときの構造化されたschema/解決可能性失敗

### JSON出力形式

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
      ref?: string, // 解決可能性エラー時に存在
    },
  ],
}
```

成功例:

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

失敗例:

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

ドライランが失敗した場合:

- `config schema validation failed`: 変更後のconfig形状が無効です。パス/値またはprovider/refオブジェクト形状を修正してください。
- `Config policy validation failed: unsupported SecretRef usage`: その認証情報をプレーンテキスト/文字列入力に戻し、SecretRefはサポート対象サーフェスでのみ使用してください。
- `SecretRef assignment(s) could not be resolved`: 参照されたprovider/refが現在解決できません（環境変数不足、無効なファイルポインター、exec provider失敗、またはprovider/source不一致）。
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: ドライランでexec refがスキップされました。exec解決可能性検証が必要な場合は `--allow-exec` を付けて再実行してください。
- バッチモードでは、失敗したエントリを修正し、書き込む前に `--dry-run` を再実行してください。

## 書き込み安全性

`openclaw config set` とその他のOpenClaw管理下のconfig writerは、ディスクへ確定する前に
変更後の完全なconfigを検証します。新しいペイロードがschema
検証に失敗するか、破壊的な上書きのように見える場合、アクティブconfigはそのまま保持され、
拒否されたペイロードはその横に `openclaw.json.rejected.*` として保存されます。
アクティブconfig pathは通常ファイルである必要があります。シンボリックリンク化された `openclaw.json`
レイアウトは書き込みではサポートされません。代わりに `OPENCLAW_CONFIG_PATH` を使って直接
実ファイルを指定してください。

小さな編集にはCLI書き込みを推奨します。

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

書き込みが拒否された場合は、保存されたペイロードを確認し、完全なconfig形状を修正してください。

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

直接エディターでの書き込みも引き続き可能ですが、実行中のGatewayは、それらが検証に合格するまで信頼しないものとして扱います。無効な直接編集は、起動時またはホットリロード時に、最後に正常だったバックアップから復元されることがあります。詳しくは
[Gateway troubleshooting](/ja-JP/gateway/troubleshooting#gateway-restored-last-known-good-config) を参照してください。

## サブコマンド

- `config file`: アクティブなconfigファイルパスを表示します（`OPENCLAW_CONFIG_PATH` またはデフォルトの場所から解決）。パスはシンボリックリンクではなく、通常ファイルを指している必要があります。

編集後はGatewayを再起動してください。

## Validate

Gatewayを起動せずに、現在のconfigをアクティブなschemaに対して検証します。

```bash
openclaw config validate
openclaw config validate --json
```

`openclaw config validate` が通るようになったら、ローカルTUIを使って、同じターミナルから各変更を検証しながら、埋め込みagentにアクティブconfigとドキュメントを比較させることができます。

すでに検証が失敗している場合は、`openclaw configure` または
`openclaw doctor --fix` から始めてください。`openclaw chat` は無効config
ガードを回避しません。

```bash
openclaw chat
```

その後、TUI内で:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

一般的な修復ループ:

- agentに現在のconfigを関連ドキュメントページと比較させ、最小の修正案を出すよう依頼します。
- `openclaw config set` または `openclaw configure` で対象を絞った編集を適用します。
- 各変更後に `openclaw config validate` を再実行します。
- 検証に通ってもランタイムがまだ不健全な場合は、移行と修復の支援のために `openclaw doctor` または `openclaw doctor --fix` を実行します。

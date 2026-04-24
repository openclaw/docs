---
read_when:
    - 設定を非対話的に読み取ったり編集したりしたい場合
summary: '`openclaw config` のCLIリファレンス（get/set/unset/file/schema/validate）'
title: 設定
x-i18n:
    generated_at: "2026-04-24T04:49:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15e2eb75cc415df52ddcd104d8e5295d8d7b84baca65b4368deb3f06259f6bcd
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

`openclaw.json` を非対話的に編集するための設定ヘルパーです: パス指定で値を get/set/unset/file/schema/validate し、アクティブな設定ファイルを表示します。サブコマンドなしで実行すると、設定ウィザードを開きます（`openclaw configure` と同じ）。

ルートオプション:

- `--section <section>`: サブコマンドなしで `openclaw config` を実行したときの、繰り返し指定可能なガイド付きセットアップのセクションフィルター

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
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

`openclaw.json` 用に生成されたJSON schemaを、JSONとしてstdoutに出力します。

含まれるもの:

- 現在のルート設定schemaと、エディター向けツール用のルート `$schema` 文字列フィールド
- Control UIで使われるフィールドの `title` と `description` のドキュメントメタデータ
- 対応するフィールドドキュメントが存在する場合、ネストされたオブジェクト、ワイルドカード（`*`）、配列項目（`[]`）ノードも同じ `title` / `description` メタデータを継承
- 対応するフィールドドキュメントが存在する場合、`anyOf` / `oneOf` / `allOf` ブランチも同じドキュメントメタデータを継承
- ランタイムmanifestを読み込める場合の、ベストエフォートなライブPlugin + チャンネルschemaメタデータ
- 現在の設定が不正でもクリーンなフォールバックschema

関連するランタイムRPC:

- `config.schema.lookup` は、1つの正規化された設定パスと、浅い
  schemaノード（`title`、`description`、`type`、`enum`、`const`、一般的な境界）、
  一致したUIヒントメタデータ、および直下の子要約を返します。Control UIや
  カスタムクライアントで、パススコープのドリルダウンに使ってください。

```bash
openclaw config schema
```

他のツールで調べたり検証したりしたい場合は、ファイルにパイプしてください:

```bash
openclaw config schema > openclaw.schema.json
```

### パス

パスにはドット記法またはブラケット記法を使います:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

特定のagentを対象にするには、agent listのインデックスを使います:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## 値

値は、可能な場合はJSON5として解析され、それ以外は文字列として扱われます。
JSON5解析を必須にするには `--strict-json` を使ってください。`--json` もレガシーエイリアスとして引き続きサポートされます。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` は、ターミナル向けに整形したテキストではなく、生の値をJSONとして出力します。

オブジェクト代入は、デフォルトでは対象パスを置き換えます。
`agents.defaults.models`、
`models.providers`、`models.providers.<id>.models`、`plugins.entries`、`auth.profiles`
など、ユーザー追加エントリを保持しやすい保護対象のmap/listパスでは、
`--replace` を渡さない限り、既存エントリを削除する置き換えは拒否されます。

これらのmapにエントリを追加するときは `--merge` を使ってください:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

指定した値を完全な対象値にしたいと意図している場合にのみ、`--replace` を使ってください。

## `config set` モード

`openclaw config set` は4つの代入スタイルをサポートします:

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

ポリシーに関する注記:

- SecretRef代入は、未サポートのランタイム可変サーフェス（例: `hooks.token`、`commands.ownerDisplaySecret`、DiscordのスレッドバインディングWebhook token、WhatsApp creds JSON）では拒否されます。[SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface) を参照してください。

バッチ解析では、常にバッチペイロード（`--batch-json`/`--batch-file`）を信頼できる情報源として使います。
`--strict-json` / `--json` はバッチ解析の動作を変更しません。

SecretRefとプロバイダーの両方で、JSON path/valueモードも引き続きサポートされます:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## プロバイダービルダーフラグ

プロバイダービルダーの対象には、パスとして `secrets.providers.<alias>` を使う必要があります。

共通フラグ:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>`（`file`、`exec`）

Envプロバイダー（`--provider-source env`）:

- `--provider-allowlist <ENV_VAR>`（繰り返し可）

Fileプロバイダー（`--provider-source file`）:

- `--provider-path <path>`（必須）
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`
- `--provider-allow-insecure-path`

Execプロバイダー（`--provider-source exec`）:

- `--provider-command <path>`（必須）
- `--provider-arg <arg>`（繰り返し可）
- `--provider-no-output-timeout-ms <ms>`
- `--provider-max-output-bytes <bytes>`
- `--provider-json-only`
- `--provider-env <KEY=VALUE>`（繰り返し可）
- `--provider-pass-env <ENV_VAR>`（繰り返し可）
- `--provider-trusted-dir <path>`（繰り返し可）
- `--provider-allow-insecure-path`
- `--provider-allow-symlink-command`

ハードニングしたexecプロバイダーの例:

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

`openclaw.json` に書き込まずに変更を検証するには `--dry-run` を使ってください。

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
- 既知の未サポートSecretRef対象サーフェスに対しては、ポリシー検証も実行されます。
- ポリシーチェックは変更後の完全な設定全体を評価するため、親オブジェクト書き込み（例: `hooks` をオブジェクトとして設定）では未サポートサーフェスの検証を回避できません。
- exec SecretRefチェックは、コマンド副作用を避けるため、デフォルトではドライラン中にスキップされます。
- exec SecretRefチェックにオプトインするには、`--dry-run` と一緒に `--allow-exec` を使ってください（これによりプロバイダーコマンドが実行される場合があります）。
- `--allow-exec` はドライラン専用で、`--dry-run` なしで使うとエラーになります。

`--dry-run --json` は機械可読なレポートを出力します:

- `ok`: ドライランに成功したかどうか
- `operations`: 評価された代入の数
- `checks`: schema/解決可能性チェックが実行されたかどうか
- `checks.resolvabilityComplete`: 解決可能性チェックが最後まで実行されたかどうか（exec refがスキップされた場合はfalse）
- `refsChecked`: ドライラン中に実際に解決されたrefの数
- `skippedExecRefs`: `--allow-exec` が設定されていないためにスキップされたexec refの数
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
      ref?: string, // 解決可能性エラーで存在
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

- `config schema validation failed`: 変更後の設定の形が不正です。パス/値、またはprovider/refオブジェクトの形を修正してください。
- `Config policy validation failed: unsupported SecretRef usage`: その認証情報を平文/文字列入力に戻し、SecretRefはサポートされているサーフェスでのみ使用してください。
- `SecretRef assignment(s) could not be resolved`: 参照先のprovider/refが現在解決できません（環境変数不足、無効なファイルポインター、exec provider失敗、またはprovider/source不一致）。
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: ドライランがexec refをスキップしました。exec解決可能性の検証が必要なら `--allow-exec` を付けて再実行してください。
- バッチモードでは、失敗したエントリを修正してから、書き込む前に `--dry-run` を再実行してください。

## 書き込み安全性

`openclaw config set` と他のOpenClaw所有の設定ライターは、変更後の完全な
設定を、ディスクへコミットする前に検証します。新しいペイロードがschema
検証に失敗するか、破壊的な上書きのように見える場合、アクティブな設定はそのまま保持され、
拒否されたペイロードはその隣に `openclaw.json.rejected.*` として保存されます。
アクティブな設定パスは通常ファイルでなければなりません。symlinkされた `openclaw.json`
構成では書き込みはサポートされません。代わりに `OPENCLAW_CONFIG_PATH` を使って、
実ファイルを直接指してください。

小さな編集にはCLI書き込みを推奨します:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

書き込みが拒否された場合は、保存されたペイロードを確認し、完全な設定の形を修正してください:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

直接エディターでの書き込みも引き続き可能ですが、実行中のGatewayは、
それらが検証に通るまで信頼されていないものとして扱います。不正な直接編集は、起動時または
ホットリロード時に、最後に正常だったバックアップから復元される場合があります。詳細は
[Gateway troubleshooting](/ja-JP/gateway/troubleshooting#gateway-restored-last-known-good-config)
を参照してください。

## サブコマンド

- `config file`: アクティブな設定ファイルパスを表示します（`OPENCLAW_CONFIG_PATH` またはデフォルト位置から解決）。このパスはsymlinkではなく通常ファイルを指している必要があります。

編集後はGatewayを再起動してください。

## 検証

Gatewayを起動せずに、現在の設定をアクティブなschemaに対して検証します。

```bash
openclaw config validate
openclaw config validate --json
```

`openclaw config validate` が通るようになったら、ローカルTUIを使って
埋め込みagentに、アクティブな設定とドキュメントを比較させつつ、同じterminalから
各変更を検証できます。

すでに検証が失敗している場合は、`openclaw configure` または
`openclaw doctor --fix` から始めてください。`openclaw chat` は不正な設定ガードを
回避しません。

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

典型的な修復ループ:

- agentに、現在の設定を関連するドキュメントページと比較し、最小限の修正を提案するよう依頼します。
- `openclaw config set` または `openclaw configure` で対象を絞った編集を適用します。
- 各変更後に `openclaw config validate` を再実行します。
- 検証に通ってもランタイムがまだ不健全な場合は、移行や修復の支援として `openclaw doctor` または `openclaw doctor --fix` を実行してください。

## 関連

- [CLI reference](/ja-JP/cli)
- [Configuration](/ja-JP/gateway/configuration)

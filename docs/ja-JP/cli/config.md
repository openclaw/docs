---
read_when:
    - 非対話的に設定を読み取りまたは編集したい
sidebarTitle: Config
summary: '`openclaw config` のCLIリファレンス（get/set/patch/unset/file/schema/validate）'
title: 設定
x-i18n:
    generated_at: "2026-07-05T11:07:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e338747649c0780d422ddcea3b86bed78fddd1d73d0dff73e5c2e8d60982ed0
    source_path: cli/config.md
    workflow: 16
---

`openclaw.json` 用の非対話ヘルパー: パスで値を get/set/patch/unset する、スキーマを出力する、検証する、またはアクティブなファイルパスを出力する。サブコマンドなしで `openclaw config` を実行すると、`openclaw configure` と同じガイド付きウィザードが開く。

<Note>
`OPENCLAW_NIX_MODE=1` の場合、OpenClaw は `openclaw.json` を不変として扱う。読み取り専用コマンド（`config get`、`config file`、`config schema`、`config validate`）は引き続き動作するが、設定を書き込むコマンドは拒否される。代わりにインストール元の Nix ソースを編集する。ファーストパーティの nix-openclaw ディストリビューションでは、[nix-openclaw クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)を使用し、`programs.openclaw.config` または `instances.<name>.config` の下に値を設定する。
</Note>

## ルートオプション

<ParamField path="--section <section>" type="string">
  サブコマンドなしで `openclaw config` を実行するときに繰り返し指定できる、ガイド付きセットアップのセクションフィルター。
</ParamField>

ガイド付きセクション: `workspace`、`model`、`web`、`gateway`、`daemon`、`channels`、`plugins`、`skills`、`health`。

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

### パス

ドット記法またはブラケット記法。シェルの例では、zsh が `[0]` を glob 展開しないように、ブラケットパスを引用符で囲む:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

墨消し済みの設定スナップショットから値を読み取る（シークレットは出力されない）。`--json` は生の値を JSON として出力する。それ以外の場合、文字列/数値/真偽値はそのまま出力され、オブジェクト/配列は整形済み JSON として出力される。

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

`OPENCLAW_CONFIG_PATH` またはデフォルトの場所から解決された、アクティブな設定ファイルのパスを出力する。このパスはシンボリックリンクではなく通常ファイルを指す。[書き込み安全性](#write-safety)を参照。

### `config schema`

`openclaw.json` 用に生成された JSON スキーマを stdout に出力する。

<AccordionGroup>
  <Accordion title="What it includes">
    - 現在のルート設定スキーマに加え、エディターツール用のルート `$schema` 文字列フィールド。
    - Control UI で使用されるフィールド `title` / `description` のドキュメントメタデータ。
    - ネストされたオブジェクト、ワイルドカード（`*`）、配列項目（`[]`）ノードは、一致するフィールドドキュメントが存在する場合、同じ `title` / `description` メタデータを継承する。
    - `anyOf` / `oneOf` / `allOf` ブランチも同じドキュメントメタデータを継承する。
    - ランタイムマニフェストを読み込める場合は、ベストエフォートのライブ Plugin + チャンネルスキーマメタデータ。
    - 現在の設定が無効な場合でも、クリーンなフォールバックスキーマ。

  </Accordion>
  <Accordion title="Related runtime RPC">
    `config.schema.lookup` は、浅いスキーマノード（`title`、`description`、`type`、`enum`、`const`、共通の境界）、一致した UI ヒントメタデータ、直下の子の要約を含む、正規化済みの設定パスを 1 つ返す。Control UI またはカスタムクライアントで、パス単位のドリルダウンに使用する。
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
openclaw config schema > openclaw.schema.json
```

### `config validate`

Gateway を起動せずに、現在の設定をアクティブなスキーマに対して検証する。

```bash
openclaw config validate
openclaw config validate --json
```

<Note>
検証がすでに失敗している場合は、`openclaw configure` または `openclaw doctor --fix` から始める。`openclaw chat` は無効な設定のガードを回避しない。
</Note>

## 値

値は可能な場合 JSON5 として解析され、それ以外の場合は生の文字列として扱われる。文字列フォールバックなしで標準 JSON を要求するには `--strict-json` を使用する（その場合、コメント、末尾カンマ、引用符なしキーなどの JSON5 専用構文は拒否される）。`--json` は `config set` における `--strict-json` のレガシーエイリアス。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` は、端末用に整形されたテキストではなく、生の値を JSON として出力する。

<Note>
オブジェクト代入はデフォルトで対象パスを置き換える。ユーザーが追加したエントリを保持することが多い保護対象パスでは、既存エントリを削除する置き換えは `--replace` を渡さない限り拒否される: `agents.defaults.models`、`agents.list`、`models.providers`、`models.providers.<id>`、`models.providers.<id>.models`、`plugins.entries`、`auth.profiles`。
</Note>

これらのマップにエントリを追加するときは `--merge` を使用する:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

指定した値を意図的に対象値全体にする場合にのみ、`--replace` を使用する。

## `config set` モード

<Tabs>
  <Tab title="Value mode">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="SecretRef builder mode">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Provider builder mode">
    `secrets.providers.<alias>` パスのみを対象にする:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="Batch mode">
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
SecretRef の代入は、サポートされていないランタイム可変サーフェス（たとえば `hooks.token`、`commands.ownerDisplaySecret`、Discord スレッド紐付け Webhook トークン、WhatsApp 認証情報 JSON）では拒否される。[SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)を参照。
</Warning>

バッチ解析では常にバッチペイロード（`--batch-json`/`--batch-file`）が信頼できる情報源として使われる。`--strict-json` / `--json` はバッチ解析の動作を変更しない。

JSON パス/値モードは SecretRef とプロバイダーにも直接使用できる:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### プロバイダービルダーフラグ

プロバイダービルダーの対象には、パスとして `secrets.providers.<alias>` を使用する必要がある。

<AccordionGroup>
  <Accordion title="Common flags">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>`（`file`、`exec`）

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

強化された exec プロバイダーの例:

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

## `config patch`

パスベースの `config set` コマンドを多数実行する代わりに、設定の形をした JSON5 パッチを貼り付けるかパイプする。オブジェクトは再帰的にマージされ、配列とスカラー値は対象を置き換え、`null` は対象パスを削除する。

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

リモートセットアップスクリプトでは、stdin 経由でパッチをパイプする:

```bash
ssh user@gateway-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh user@gateway-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

パッチの例:

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

1 つのオブジェクトまたは配列を再帰的にパッチするのではなく、指定した値そのものにする必要がある場合は `--replace-path <path>` を使用する:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` は、書き込まずにスキーマと SecretRef の解決可能性チェックを実行する。exec ベースの SecretRef は dry-run 中はデフォルトでスキップされる。dry-run でプロバイダーコマンドを意図的に実行したい場合は `--allow-exec` を追加する。

## Dry run

`--dry-run` は `openclaw.json` に書き込まずに変更を検証する。`config set`、`config patch`、`config unset` で使用できる。

```bash
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
    - ビルダーモード: 変更された ref/provider に対して SecretRef の解決可能性チェックを実行します。
    - JSON モード (`--strict-json`、`--json`、またはバッチモード): スキーマ検証に加えて SecretRef の解決可能性チェックを実行します。
    - ポリシー検証は変更後の完全な config に対して実行されるため、親オブジェクトの書き込み (たとえば `hooks` をオブジェクトとして設定する場合) で未対応サーフェスの検証を迂回することはできません。
    - Exec SecretRef チェックは、コマンドの副作用を避けるためデフォルトでスキップされます。オプトインするには `--allow-exec` を渡します (これにより provider コマンドが実行される場合があります)。`--allow-exec` はドライラン専用で、`--dry-run` なしではエラーになります。

  </Accordion>
  <Accordion title="--dry-run --json のフィールド">
    - `ok`: ドライランが成功したかどうか
    - `operations`: 評価された代入の数
    - `checks`: スキーマ/解決可能性チェックが実行されたかどうか
    - `checks.resolvabilityComplete`: 解決可能性チェックが完了まで実行されたかどうか (exec ref がスキップされた場合は false)
    - `refsChecked`: ドライラン中に実際に解決された ref の数
    - `skippedExecRefs`: `--allow-exec` が設定されていなかったためスキップされた exec ref の数
    - `errors`: `ok=false` の場合の、構造化された missing-path、schema、または resolvability の失敗

  </Accordion>
</AccordionGroup>

### JSON 出力の形状

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
      ref?: string, // resolvability エラーの場合に存在
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
    - `config schema validation failed`: 変更後の config 形状が無効です。path/value または provider/ref オブジェクトの形状を修正してください。
    - `Config policy validation failed: unsupported SecretRef usage`: その認証情報をプレーンテキスト/文字列入力に戻してください。SecretRef は対応サーフェスのみに保持します。
    - `SecretRef assignment(s) could not be resolved`: 参照された provider/ref は現在解決できません (env var の不足、無効なファイルポインター、exec provider の失敗、または provider/source の不一致)。
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: exec の解決可能性検証が必要な場合は、`--allow-exec` を付けて再実行してください。
    - バッチモードでは、失敗したエントリを修正し、書き込む前に `--dry-run` を再実行してください。

  </Accordion>
</AccordionGroup>

## 変更の適用

`config set` / `config patch` / `config unset` が成功するたびに、CLI は Gateway の再起動が必要かどうかを示す 3 種類のヒントのいずれかを出力します。

| ヒント                                              | 意味                                   |
| --------------------------------------------------- | -------------------------------------- |
| `Restart the gateway to apply.`                     | 変更されたパスには完全な再起動が必要です。 |
| `Change will apply without restarting the gateway.` | ホットリロードが自動的に反映します。   |
| `No gateway restart needed.`                        | ランタイムに関連する変更はありません。 |

`plugins.entries` (またはその任意のサブパス) への書き込みは常に再起動が必要です。CLI はすべての Plugin のリロードメタデータが読み込まれていることを証明できないためです。

## 書き込みの安全性

`openclaw config set` とその他の OpenClaw 所有の config ライターは、ディスクにコミットする前に変更後の完全な config を検証します。新しいペイロードがスキーマ検証に失敗した場合や破壊的な上書きに見える場合、アクティブな config はそのまま残され、拒否されたペイロードは隣に `openclaw.json.rejected.*` として保存されます。

<Warning>
アクティブな config パスは通常ファイルである必要があります。シンボリックリンクされた `openclaw.json` レイアウトは書き込みではサポートされません。代わりに `OPENCLAW_CONFIG_PATH` を使って実ファイルを直接指してください。
</Warning>

小さな編集には CLI 書き込みを推奨します。

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

書き込みが拒否された場合は、保存されたペイロードを確認し、完全な config 形状を修正してください。

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

エディターでの直接書き込みも引き続き可能ですが、実行中の Gateway は検証されるまでそれらを信頼されていないものとして扱います。無効な直接編集は起動に失敗するか、ホットリロードでスキップされます。Gateway は `openclaw.json` を書き換えません。接頭辞付き/上書きされた config を修復するか、最後に正常だったコピーを復元するには、`openclaw doctor --fix` を実行してください。[Gateway のトラブルシューティング](/ja-JP/gateway/troubleshooting#gateway-rejected-invalid-config)を参照してください。

ファイル全体のリカバリーは doctor 修復専用です。Plugin スキーマ変更や `minHostVersion` のずれは、models、providers、auth profiles、channels、Gateway 公開、tools、memory、browser、cron config などの無関係なユーザー設定をロールバックするのではなく、明確なエラーとして扱われます。

## 修復ループ

`openclaw config validate` が通った後は、local TUI を使って、同じターミナルから各変更を検証しながら、埋め込みエージェントにアクティブな config と docs の比較をさせます。

```bash
openclaw chat
```

TUI 内では、先頭の `!` によりリテラルなローカルシェルコマンドが実行されます (セッションごとに 1 回の確認プロンプト後)。

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

<Steps>
  <Step title="docs と比較">
    エージェントに、現在の config を関連する docs ページと比較し、最小の修正を提案するよう依頼します。
  </Step>
  <Step title="対象を絞った編集を適用">
    `openclaw config set` または `openclaw configure` で対象を絞った編集を適用します。
  </Step>
  <Step title="再検証">
    各変更後に `openclaw config validate` を再実行します。
  </Step>
  <Step title="ランタイム問題に対する doctor">
    検証に通ってもランタイムがまだ正常でない場合は、移行と修復の支援のために `openclaw doctor` または `openclaw doctor --fix` を実行します。
  </Step>
</Steps>

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Configuration](/ja-JP/gateway/configuration)

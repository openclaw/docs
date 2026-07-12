---
read_when:
    - 設定を非対話形式で読み取りまたは編集したい場合
sidebarTitle: Config
summary: '`openclaw config` の CLI リファレンス（get/set/patch/unset/file/schema/validate）'
title: 設定
x-i18n:
    generated_at: "2026-07-11T22:02:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a9531407b2314d1a6bc05a87eb7efb6c37a847378b150125693f4d59733a2e9
    source_path: cli/config.md
    workflow: 16
---

`openclaw.json` 用の非対話型ヘルパーです。パスによる値の取得、設定、パッチ、設定解除、スキーマの出力、検証、または有効なファイルパスの出力を行います。サブコマンドなしで `openclaw config` を実行すると、`openclaw configure` と同じガイド付きウィザードが開きます。

<Note>
`OPENCLAW_NIX_MODE=1` の場合、OpenClaw は `openclaw.json` を不変として扱います。読み取り専用コマンド（`config get`、`config file`、`config schema`、`config validate`）は引き続き動作しますが、設定を書き込むコマンドは拒否されます。代わりに、インストールに使用した Nix ソースを編集してください。公式の nix-openclaw ディストリビューションでは、[nix-openclaw クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)を参照し、`programs.openclaw.config` または `instances.<name>.config` 配下に値を設定します。
</Note>

## ルートオプション

<ParamField path="--section <section>" type="string">
  サブコマンドなしで `openclaw config` を実行するときに使用する、繰り返し指定可能なガイド付きセットアップのセクションフィルターです。
</ParamField>

ガイド付きセクション：`workspace`、`model`、`web`、`gateway`、`daemon`、`channels`、`plugins`、`skills`、`health`。

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

ドット記法またはブラケット記法を使用します。zsh が `[0]` をグロブ展開しないように、シェルの例ではブラケット記法のパスを引用符で囲みます。

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

秘匿化された設定スナップショットから値を読み取ります（シークレットは決して出力されません）。`--json` は未加工の値を JSON として出力します。それ以外の場合、文字列、数値、真偽値はそのまま出力され、オブジェクトと配列は整形済み JSON として出力されます。

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

`OPENCLAW_CONFIG_PATH` またはデフォルトの場所から解決した、有効な設定ファイルのパスを出力します。このパスが指すのはシンボリックリンクではなく通常のファイルです。[書き込みの安全性](#write-safety)を参照してください。

### `config schema`

生成された `openclaw.json` 用 JSON スキーマを標準出力へ出力します。

<AccordionGroup>
  <Accordion title="含まれる内容">
    - 現在のルート設定スキーマと、エディターツール用のルート `$schema` 文字列フィールド。
    - Control UI が使用するフィールドの `title` / `description` ドキュメントメタデータ。
    - 対応するフィールドドキュメントが存在する場合、ネストされたオブジェクト、ワイルドカード（`*`）、配列項目（`[]`）のノードにも同じ `title` / `description` メタデータが継承されます。
    - `anyOf` / `oneOf` / `allOf` の分岐にも同じドキュメントメタデータが継承されます。
    - ランタイムマニフェストを読み込める場合、可能な範囲で取得した現在の Plugin とチャンネルのスキーマメタデータ。
    - 現在の設定が無効な場合でも使用できる、簡潔なフォールバックスキーマ。

  </Accordion>
  <Accordion title="関連するランタイム RPC">
    `config.schema.lookup` は、正規化された設定パス 1 件について、浅いスキーマノード（`title`、`description`、`type`、`enum`、`const`、一般的な境界値）、一致する UI ヒントメタデータ、直下の子要素の概要を返します。Control UI またはカスタムクライアントで、パスを対象とした詳細表示に使用します。
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
openclaw config schema > openclaw.schema.json
```

### `config validate`

Gateway を起動せずに、現在の設定を有効なスキーマに対して検証します。

```bash
openclaw config validate
openclaw config validate --json
```

<Note>
検証がすでに失敗している場合は、`openclaw configure` または `openclaw doctor --fix` から始めてください。`openclaw chat` では無効な設定に対するガードを回避できません。
</Note>

## 値

値は可能な場合 JSON5 として解析されます。それ以外の場合は未加工の文字列として扱われます。文字列へのフォールバックなしで標準 JSON を必須にするには、`--strict-json` を使用します。この場合、コメント、末尾のカンマ、引用符なしのキーなど、JSON5 固有の構文は拒否されます。`config set` では、`--json` は `--strict-json` のレガシーエイリアスです。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` は、端末向けに整形されたテキストではなく、未加工の値を JSON として出力します。

<Note>
デフォルトでは、オブジェクトの代入によって対象パスが置き換えられます。ユーザーが追加したエントリを保持することが多い保護対象パスでは、`--replace` を渡さない限り、既存のエントリを削除する置き換えが拒否されます。対象は `agents.defaults.models`、`agents.list`、`models.providers`、`models.providers.<id>`、`models.providers.<id>.models`、`plugins.entries`、`auth.profiles` です。
</Note>

これらのマップにエントリを追加するときは `--merge` を使用します。

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

指定した値を意図的に対象全体の値とする場合にのみ、`--replace` を使用します。

## `config set` のモード

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
    対象にできるのは `secrets.providers.<alias>` パスのみです。

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
SecretRef の代入は、ランタイムでの変更に対応していない対象（たとえば `hooks.token`、`commands.ownerDisplaySecret`、Discord スレッドバインディングの Webhook トークン、WhatsApp の認証情報 JSON）では拒否されます。[SecretRef 認証情報の対象範囲](/ja-JP/reference/secretref-credential-surface)を参照してください。
</Warning>

バッチ解析では、常にバッチペイロード（`--batch-json`/`--batch-file`）が信頼できる情報源として使用されます。`--strict-json` / `--json` はバッチ解析の動作を変更しません。

JSON のパス／値モードを使って、SecretRef とプロバイダーを直接設定することもできます。

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### プロバイダービルダーのフラグ

プロバイダービルダーの対象パスには `secrets.providers.<alias>` を使用する必要があります。

<AccordionGroup>
  <Accordion title="共通フラグ">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>`（`file`、`exec`）

  </Accordion>
  <Accordion title="環境変数プロバイダー（--provider-source env）">
    - `--provider-allowlist <ENV_VAR>`（繰り返し指定可能）

  </Accordion>
  <Accordion title="ファイルプロバイダー（--provider-source file）">
    - `--provider-path <path>`（必須）
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="実行プロバイダー（--provider-source exec）">
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

強化された実行プロバイダーの例：

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

パスベースの `config set` コマンドを多数実行する代わりに、設定と同じ形状の JSON5 パッチを貼り付けるか、パイプで渡します。オブジェクトは再帰的にマージされ、配列とスカラー値は対象を置き換え、`null` は対象パスを削除します。

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

リモートセットアップスクリプトでは、標準入力からパッチをパイプで渡します。

```bash
ssh user@gateway-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh user@gateway-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

パッチの例：

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
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

オブジェクトまたは配列を再帰的にパッチするのではなく、指定した値で完全に置き換える必要がある場合は、`--replace-path <path>` を使用します。

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` は書き込みを行わず、スキーマと SecretRef の解決可能性を確認します。実行コマンドを使用する SecretRef は、デフォルトではドライラン中にスキップされます。ドライランで意図的にプロバイダーコマンドを実行する場合は、`--allow-exec` を追加します。

## ドライラン

`--dry-run` は `openclaw.json` に書き込まずに変更を検証します。`config set`、`config patch`、`config unset` で使用できます。

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
    - ビルダーモード: 変更された参照/プロバイダーに対して SecretRef の解決可否チェックを実行します。
    - JSON モード（`--strict-json`、`--json`、またはバッチモード）: スキーマ検証と SecretRef の解決可否チェックを実行します。
    - ポリシー検証は変更後の設定全体に対して実行されるため、親オブジェクトへの書き込み（たとえば `hooks` をオブジェクトとして設定する場合）によって、未対応の対象領域に対する検証を回避することはできません。
    - コマンドの副作用を避けるため、Exec SecretRef のチェックはデフォルトでスキップされます。明示的に有効化するには `--allow-exec` を渡します（プロバイダーのコマンドが実行される場合があります）。`--allow-exec` はドライラン専用であり、`--dry-run` なしで使用するとエラーになります。

  </Accordion>
  <Accordion title="--dry-run --json のフィールド">
    - `ok`: ドライランに成功したかどうか
    - `operations`: 評価された代入の数
    - `checks`: スキーマ/解決可否チェックが実行されたかどうか
    - `checks.resolvabilityComplete`: 解決可否チェックが完了まで実行されたかどうか（Exec 参照がスキップされた場合は false）
    - `refsChecked`: ドライラン中に実際に解決された参照の数
    - `skippedExecRefs`: `--allow-exec` が設定されていないためスキップされた Exec 参照の数
    - `errors`: `ok=false` の場合に発生した、構造化されたパス欠落、スキーマ、または解決可否のエラー

  </Accordion>
</AccordionGroup>

### JSON 出力の形式

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
      ref?: string, // 解決可否エラーの場合に存在
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
          "message": "エラー: 環境変数 \"MISSING_TEST_SECRET\" が設定されていません。",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="ドライランが失敗した場合">
    - `config schema validation failed`: 変更後の設定形式が無効です。パス/値またはプロバイダー/参照オブジェクトの形式を修正してください。
    - `Config policy validation failed: unsupported SecretRef usage`: その認証情報をプレーンテキスト/文字列入力に戻してください。SecretRef は対応している対象領域でのみ使用してください。
    - `SecretRef assignment(s) could not be resolved`: 参照先のプロバイダー/参照を現在解決できません（環境変数の欠落、無効なファイルポインター、Exec プロバイダーの失敗、またはプロバイダーとソースの不一致）。
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: Exec の解決可否を検証する必要がある場合は、`--allow-exec` を指定して再実行してください。
    - バッチモードでは、失敗したエントリを修正し、書き込む前に `--dry-run` を再実行してください。

  </Accordion>
</AccordionGroup>

## 変更の適用

`config set` / `config patch` / `config unset` が正常に完了するたびに、Gateway の再起動が必要かどうかを判断できるよう、CLI は次の 3 つのヒントのいずれかを表示します。

| ヒント                                              | 意味                                       |
| --------------------------------------------------- | ------------------------------------------ |
| `Restart the gateway to apply.`                     | 変更されたパスには完全な再起動が必要です。 |
| `Change will apply without restarting the gateway.` | ホットリロードによって自動的に反映されます。 |
| `No gateway restart needed.`                        | ランタイムに関係する変更はありません。     |

CLI はすべての Plugin のリロードメタデータが読み込まれていることを確認できないため、`plugins.entries`（またはそのサブパス）への書き込みには常に再起動が必要です。

## 書き込みの安全性

`openclaw config set` および OpenClaw が管理するその他の設定書き込み機能は、ディスクに確定する前に変更後の設定全体を検証します。新しいペイロードがスキーマ検証に失敗するか、破壊的な上書きと判断された場合、アクティブな設定は変更されず、拒否されたペイロードがその隣に `openclaw.json.rejected.*` として保存されます。

<Warning>
アクティブな設定パスは通常ファイルである必要があります。シンボリックリンクを使用した `openclaw.json` の構成への書き込みはサポートされていません。代わりに `OPENCLAW_CONFIG_PATH` で実ファイルを直接指定してください。
</Warning>

小規模な編集には CLI による書き込みを推奨します。

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

書き込みが拒否された場合は、保存されたペイロードを確認し、設定全体の形式を修正してください。

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

エディターでの直接書き込みも引き続き可能ですが、実行中の Gateway は検証が完了するまでその内容を信頼できないものとして扱います。無効な直接編集は起動に失敗するか、ホットリロードでスキップされます。Gateway は `openclaw.json` を書き換えません。プレフィックスが付加された、または上書きで破損した設定を修復するか、最後に正常だったコピーを復元するには、`openclaw doctor --fix` を実行してください。[Gateway のトラブルシューティング](/ja-JP/gateway/troubleshooting#gateway-rejected-invalid-config)を参照してください。

ファイル全体の復旧は doctor による修復専用です。Plugin のスキーマ変更や `minHostVersion` のずれは、モデル、プロバイダー、認証プロファイル、チャネル、Gateway の公開範囲、ツール、メモリ、ブラウザー、Cron 設定など、無関係なユーザー設定をロールバックせず、明示的なエラーとして扱われます。

## 修復ループ

`openclaw config validate` に成功したら、同じターミナルから各変更を検証しながら、ローカル TUI を使用して組み込みエージェントにアクティブな設定とドキュメントを比較させます。

```bash
openclaw chat
```

TUI 内では、先頭に `!` を付けると、ローカルシェルコマンドがそのまま実行されます（セッションごとに初回のみ確認プロンプトが表示されます）。

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

<Steps>
  <Step title="ドキュメントとの比較">
    現在の設定を関連するドキュメントページと比較し、最小限の修正を提案するようエージェントに依頼します。
  </Step>
  <Step title="対象を絞った編集の適用">
    `openclaw config set` または `openclaw configure` を使用して、対象を絞った編集を適用します。
  </Step>
  <Step title="再検証">
    変更するたびに `openclaw config validate` を再実行します。
  </Step>
  <Step title="ランタイムの問題に対する doctor の使用">
    検証に成功してもランタイムが正常でない場合は、移行と修復の支援のために `openclaw doctor` または `openclaw doctor --fix` を実行します。
  </Step>
</Steps>

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [設定](/ja-JP/gateway/configuration)

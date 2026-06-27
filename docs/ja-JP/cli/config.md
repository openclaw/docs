---
read_when:
    - 非対話的に設定を読み取りまたは編集したい
sidebarTitle: Config
summary: '`openclaw config` の CLI リファレンス (get/set/patch/unset/file/schema/validate)'
title: 設定
x-i18n:
    generated_at: "2026-06-27T10:53:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d658c0edbf900565c4645c1d24a9f3e092a3d8a4fec85f7fc7e3989550d13197
    source_path: cli/config.md
    workflow: 16
---

`openclaw.json` の非対話型編集用の設定ヘルパー: パスによる値の取得/設定/パッチ適用/設定解除/ファイル/スキーマ/検証を行い、アクティブな設定ファイルを出力します。サブコマンドなしで実行すると、設定ウィザードを開きます (`openclaw configure` と同じ)。

<Note>
`OPENCLAW_NIX_MODE=1` の場合、OpenClaw は `openclaw.json` を不変として扱います。`config get`、`config file`、`config schema`、`config validate` などの読み取り専用コマンドは引き続き動作しますが、設定を書き込むコマンドは拒否されます。Agents は代わりにインストール用の Nix ソースを編集してください。ファーストパーティの nix-openclaw ディストリビューションでは、[nix-openclaw クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)を使い、`programs.openclaw.config` または `instances.<name>.config` 配下に値を設定します。
</Note>

## ルートオプション

<ParamField path="--section <section>" type="string">
  サブコマンドなしで `openclaw config` を実行したときに使う、繰り返し指定可能なガイド付きセットアップのセクションフィルター。
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

`openclaw.json` 用に生成された JSON スキーマを JSON として stdout に出力します。

<AccordionGroup>
  <Accordion title="含まれるもの">
    - 現在のルート設定スキーマと、エディター用ツールのためのルート `$schema` 文字列フィールド。
    - Control UI が使うフィールド `title` と `description` のドキュメントメタデータ。
    - ネストされたオブジェクト、ワイルドカード (`*`)、配列項目 (`[]`) ノードは、一致するフィールドドキュメントが存在する場合、同じ `title` / `description` メタデータを継承します。
    - `anyOf` / `oneOf` / `allOf` ブランチも、一致するフィールドドキュメントが存在する場合、同じドキュメントメタデータを継承します。
    - ランタイムマニフェストを読み込める場合は、ベストエフォートのライブ plugin + チャンネルスキーマメタデータ。
    - 現在の設定が無効な場合でも、クリーンなフォールバックスキーマ。

  </Accordion>
  <Accordion title="関連するランタイム RPC">
    `config.schema.lookup` は、浅いスキーマノード (`title`、`description`、`type`、`enum`、`const`、共通の境界値)、一致した UI ヒントメタデータ、直下の子要素サマリーを含む、正規化済みの設定パスを 1 つ返します。Control UI やカスタムクライアントで、パス単位のドリルダウンに使用します。
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

他のツールで確認または検証したい場合は、ファイルにパイプします。

```bash
openclaw config schema > openclaw.schema.json
```

### パス

パスはドット記法またはブラケット記法を使用します。シェル例ではブラケット記法のパスを引用符で囲み、zsh などのシェルが OpenClaw にパスが渡る前に `[0]` を glob として展開しないようにします。

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
```

特定の agent を対象にするには、agent リストのインデックスを使用します。

```bash
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

## 値

値は可能な場合 JSON5 として解析されます。それ以外の場合は文字列として扱われます。JSON5 解析を必須にするには `--strict-json` を使います。`--json` はレガシーエイリアスとして引き続きサポートされます。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` は、端末向けに整形されたテキストではなく、生の値を JSON として出力します。

<Note>
オブジェクト代入はデフォルトで対象パスを置き換えます。`agents.defaults.models`、`models.providers`、`models.providers.<id>.models`、`plugins.entries`、`auth.profiles` など、ユーザー追加エントリを保持することが多い保護されたマップ/リストのパスでは、`--replace` を渡さない限り、既存エントリを削除する置き換えは拒否されます。
</Note>

これらのマップにエントリを追加する場合は `--merge` を使います。

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

指定した値を完全な対象値にしたいことが明確な場合にのみ、`--replace` を使用します。

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
SecretRef 代入は、サポートされていないランタイム可変サーフェスでは拒否されます (例: `hooks.token`、`commands.ownerDisplaySecret`、Discord スレッドバインディング Webhook トークン、WhatsApp creds JSON)。[SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)を参照してください。
</Warning>

バッチ解析では常にバッチペイロード (`--batch-json`/`--batch-file`) が信頼できる情報源として使われます。`--strict-json` / `--json` はバッチ解析の動作を変更しません。

## `config patch`

多数のパスベースの `config set` コマンドを実行する代わりに、設定形状のパッチを貼り付けたりパイプしたりしたい場合は、`config patch` を使います。入力は JSON5 オブジェクトです。オブジェクトは再帰的にマージされ、配列とスカラー値は対象値を置き換え、`null` は対象パスを削除します。

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

1 つのオブジェクトまたは配列を再帰的にパッチせず、指定値そのものにしたい場合は `--replace-path <path>` を使います。

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` は書き込みを行わずに、スキーマと SecretRef の解決可能性チェックを実行します。exec ベースの SecretRef は dry-run 中はデフォルトでスキップされます。dry-run でプロバイダーコマンドを意図的に実行したい場合は、`--allow-exec` を追加します。

JSON のパス/値モードは、SecretRef とプロバイダーの両方で引き続きサポートされます。

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

<AccordionGroup>
  <Accordion title="共通フラグ">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Env プロバイダー (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (繰り返し指定可能)

  </Accordion>
  <Accordion title="File プロバイダー (--provider-source file)">
    - `--provider-path <path>` (必須)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec プロバイダー (--provider-source exec)">
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

## Dry run

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
  <Accordion title="Dry-run の動作">
    - ビルダーモード: 変更された refs/providers に対して SecretRef の解決可能性チェックを実行します。
    - JSON モード (`--strict-json`、`--json`、またはバッチモード): スキーマ検証と SecretRef の解決可能性チェックを実行します。
    - 既知のサポートされていない SecretRef 対象サーフェスについては、ポリシー検証も実行されます。
    - ポリシーチェックは変更後の設定全体を評価するため、親オブジェクトの書き込み (たとえば `hooks` をオブジェクトとして設定する場合) でサポート外サーフェス検証を回避することはできません。
    - Exec SecretRef チェックは、コマンドの副作用を避けるため、dry-run 中はデフォルトでスキップされます。
    - exec SecretRef チェックを明示的に有効化するには、`--dry-run` とともに `--allow-exec` を使います (これによりプロバイダーコマンドが実行される場合があります)。
    - `--allow-exec` は dry-run 専用で、`--dry-run` なしで使用するとエラーになります。

  </Accordion>
  <Accordion title="--dry-run --json フィールド">
    `--dry-run --json` は、機械可読なレポートを出力します:

    - `ok`: ドライランが成功したか
    - `operations`: 評価された割り当ての数
    - `checks`: スキーマ/解決可能性チェックが実行されたか
    - `checks.resolvabilityComplete`: 解決可能性チェックが完了まで実行されたか（exec refs がスキップされた場合は false）
    - `refsChecked`: ドライラン中に実際に解決された refs の数
    - `skippedExecRefs`: `--allow-exec` が設定されていなかったためスキップされた exec refs の数
    - `errors`: `ok=false` の場合の、構造化されたパス不足、スキーマ、または解決可能性の失敗

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
  <Accordion title="ドライランが失敗する場合">
    - `config schema validation failed`: 変更後の設定の形が無効です。パス/値、または provider/ref オブジェクトの形を修正してください。
    - `Config policy validation failed: unsupported SecretRef usage`: その認証情報をプレーンテキスト/文字列入力に戻し、SecretRefs は対応しているサーフェスでのみ使用してください。
    - `SecretRef assignment(s) could not be resolved`: 参照された provider/ref は現在解決できません（環境変数の不足、無効なファイルポインター、exec プロバイダーの失敗、またはプロバイダー/ソースの不一致）。
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: ドライランで exec refs がスキップされました。exec の解決可能性検証が必要な場合は `--allow-exec` を付けて再実行してください。
    - バッチモードでは、失敗しているエントリを修正し、書き込む前に `--dry-run` を再実行してください。

  </Accordion>
</AccordionGroup>

## 書き込みの安全性

`openclaw config set` とその他の OpenClaw 所有の設定ライターは、ディスクへコミットする前に変更後の設定全体を検証します。新しいペイロードがスキーマ検証に失敗した場合、または破壊的な上書きに見える場合、アクティブな設定はそのまま残され、拒否されたペイロードは横に `openclaw.json.rejected.*` として保存されます。

<Warning>
アクティブな設定パスは通常ファイルである必要があります。シンボリックリンクされた `openclaw.json` レイアウトは書き込みではサポートされていません。代わりに `OPENCLAW_CONFIG_PATH` を使って実ファイルを直接指してください。
</Warning>

小さな編集には CLI 書き込みを推奨します。

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

書き込みが拒否された場合は、保存されたペイロードを確認し、設定全体の形を修正してください。

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

エディターでの直接書き込みも引き続き許可されていますが、実行中の Gateway は検証されるまでそれらを信頼されていないものとして扱います。無効な直接編集は起動に失敗するか、ホットリロードでスキップされます。Gateway は `openclaw.json` を書き換えません。接頭辞付き/上書きされた設定を修復する、または最後に正常だったコピーを復元するには、`openclaw doctor --fix` を実行してください。[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#gateway-rejected-invalid-config)を参照してください。

ファイル全体の復旧は doctor 修復用に予約されています。Plugin スキーマ変更または `minHostVersion` のずれは、モデル、プロバイダー、認証プロファイル、チャンネル、gateway 公開、ツール、メモリ、ブラウザー、cron 設定など、無関係なユーザー設定をロールバックするのではなく、明示的に失敗します。

## サブコマンド

- `config file`: アクティブな設定ファイルのパス（`OPENCLAW_CONFIG_PATH` またはデフォルトの場所から解決）を表示します。このパスはシンボリックリンクではなく、通常ファイルを指している必要があります。

編集後は Gateway を再起動してください。

## 検証

Gateway を起動せずに、現在の設定をアクティブなスキーマに照らして検証します。

```bash
openclaw config validate
openclaw config validate --json
```

`openclaw config validate` が成功するようになったら、ローカル TUI を使用して、同じターミナルから各変更を検証しながら、埋め込みエージェントにアクティブな設定とドキュメントを比較させることができます。

<Note>
検証がすでに失敗している場合は、`openclaw configure` または `openclaw doctor --fix` から始めてください。`openclaw chat` は無効な設定のガードを迂回しません。
</Note>

```bash
openclaw chat
```

次に TUI 内で次を実行します。

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

典型的な修復ループ:

<Steps>
  <Step title="ドキュメントと比較する">
    エージェントに、現在の設定を関連するドキュメントページと比較し、最小の修正を提案するよう依頼します。
  </Step>
  <Step title="対象を絞った編集を適用する">
    `openclaw config set` または `openclaw configure` で対象を絞った編集を適用します。
  </Step>
  <Step title="再検証する">
    各変更後に `openclaw config validate` を再実行します。
  </Step>
  <Step title="ランタイム問題には doctor を使う">
    検証に通ってもランタイムがまだ正常でない場合は、移行と修復の支援のために `openclaw doctor` または `openclaw doctor --fix` を実行します。
  </Step>
</Steps>

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [設定](/ja-JP/gateway/configuration)

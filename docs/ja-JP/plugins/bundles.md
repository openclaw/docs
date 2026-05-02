---
read_when:
    - Codex、Claude、または Cursor と互換性のあるバンドルをインストールしたい場合
    - OpenClaw がバンドルの内容をネイティブ機能にどのように対応付けるかを理解する必要があります
    - バンドル検出または不足している機能をデバッグしている
summary: Codex、Claude、Cursor のバンドルを OpenClaw Plugin としてインストールして使用する
title: Plugin バンドル
x-i18n:
    generated_at: "2026-05-02T05:00:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b949ad70881714a30ab136261441687b439e39b516638ffa052efeab6b75bd4
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw は、**Codex**、**Claude**、**Cursor** の 3 つの外部エコシステムから Plugin をインストールできます。これらは **バンドル** と呼ばれます。OpenClaw が Skills、hooks、MCP ツールなどのネイティブ機能にマッピングする、コンテンツとメタデータのパックです。

<Info>
  バンドルはネイティブ OpenClaw Plugin と**同じではありません**。ネイティブ Plugin は
  プロセス内で実行され、任意の capability を登録できます。バンドルは、選択的な機能マッピングと
  より狭い信頼境界を持つコンテンツパックです。
</Info>

## バンドルが存在する理由

有用な Plugin の多くは Codex、Claude、Cursor 形式で公開されています。
作者にネイティブ OpenClaw Plugin として書き直すことを求める代わりに、OpenClaw は
これらの形式を検出し、対応しているコンテンツをネイティブ機能セットにマッピングします。
つまり、Claude コマンドパックや Codex skill バンドルをインストールして、すぐに使えます。

## バンドルをインストールする

<Steps>
  <Step title="ディレクトリ、アーカイブ、マーケットプレイスからインストールする">
    ```bash
    # Local directory
    openclaw plugins install ./my-bundle

    # Archive
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="検出を確認する">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    バンドルは `Format: bundle` と表示され、subtype は `codex`、`claude`、または `cursor` です。

  </Step>

  <Step title="再起動して使用する">
    ```bash
    openclaw gateway restart
    ```

    マッピングされた機能（Skills、hooks、MCP ツール、LSP デフォルト）は次のセッションで利用できます。

  </Step>
</Steps>

## OpenClaw がバンドルからマッピングするもの

現在、すべてのバンドル機能が OpenClaw で実行されるわけではありません。以下は動作するものと、
検出はされるもののまだ接続されていないものです。

### 現在対応済み

| 機能       | マッピング方法                                                                                 | 対象     |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Skill コンテンツ | バンドルの skill ルートは通常の OpenClaw Skills として読み込まれます                                           | すべての形式    |
| コマンド      | `commands/` と `.cursor/commands/` は skill ルートとして扱われます                                  | Claude、Cursor |
| Hook パック    | OpenClaw 形式の `HOOK.md` + `handler.ts` レイアウト                                             | Codex          |
| MCP ツール     | バンドル MCP 設定は組み込み Pi 設定にマージされ、対応している stdio と HTTP サーバーが読み込まれます | すべての形式    |
| LSP サーバー   | Claude `.lsp.json` と manifest で宣言された `lspServers` は組み込み Pi LSP デフォルトにマージされます  | Claude         |
| 設定      | Claude `settings.json` は組み込み Pi デフォルトとしてインポートされます                                     | Claude         |

#### Skill コンテンツ

- バンドルの skill ルートは通常の OpenClaw skill ルートとして読み込まれます
- Claude `commands` ルートは追加の skill ルートとして扱われます
- Cursor `.cursor/commands` ルートは追加の skill ルートとして扱われます

つまり、Claude markdown コマンドファイルは通常の OpenClaw skill
ローダーを通じて動作します。Cursor コマンド markdown も同じ経路で動作します。

#### Hook パック

- バンドル hook ルートは、通常の OpenClaw hook-pack
  レイアウトを使用している場合に**のみ**動作します。現在これは主に Codex 互換ケースです。
  - `HOOK.md`
  - `handler.ts` または `handler.js`

#### Pi 向け MCP

- 有効化されたバンドルは MCP サーバー設定を提供できます
- OpenClaw はバンドル MCP 設定を、有効な組み込み Pi 設定の
  `mcpServers` にマージします
- OpenClaw は、組み込み Pi agent ターン中に対応しているバンドル MCP ツールを公開します。
  その際、stdio サーバーを起動するか、HTTP サーバーに接続します
- `coding` と `messaging` のツールプロファイルには、デフォルトでバンドル MCP ツールが含まれます。
  agent または Gateway で除外するには `tools.deny: ["bundle-mcp"]` を使用します
- project-local の Pi 設定はバンドルのデフォルト後にも適用されるため、必要に応じて workspace
  設定でバンドル MCP エントリを上書きできます
- バンドル MCP ツールカタログは登録前に決定論的にソートされるため、
  upstream の `listTools()` 順序が変わっても prompt-cache のツールブロックが乱れません

##### トランスポート

MCP サーバーは stdio または HTTP トランスポートを使用できます。

**Stdio** は子プロセスを起動します。

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP** は、デフォルトでは `sse`、要求された場合は `streamable-http` で実行中の MCP サーバーに接続します。

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- `transport` は `"streamable-http"` または `"sse"` に設定できます。省略した場合、OpenClaw は `sse` を使用します
- `type: "http"` は CLI ネイティブの downstream 形状です。OpenClaw config では `transport: "streamable-http"` を使用してください。`openclaw mcp set` と `openclaw doctor --fix` は一般的な alias を正規化します。
- 許可される URL scheme は `http:` と `https:` のみです
- `headers` 値は `${ENV_VAR}` 補間に対応しています
- `command` と `url` の両方を含むサーバーエントリは拒否されます
- URL 認証情報（userinfo と query params）は、ツールの
  説明とログから秘匿されます
- `connectionTimeoutMs` は、stdio と HTTP の両トランスポートについて、
  デフォルトの 30 秒接続タイムアウトを上書きします

##### ツール命名

OpenClaw は、バンドル MCP ツールを `serverName__toolName` 形式の
provider-safe な名前で登録します。たとえば、`"vigil-harbor"` というキーのサーバーが
`memory_search` ツールを公開している場合、`vigil-harbor__memory_search` として登録されます。

- `A-Za-z0-9_-` 以外の文字は `-` に置き換えられます
- サーバープレフィックスは 30 文字に制限されます
- 完全なツール名は 64 文字に制限されます
- 空のサーバー名は `mcp` にフォールバックします
- sanitized 後に衝突した名前は数値 suffix で曖昧さが解消されます
- 最終的に公開されるツール順序は safe name によって決定論的になり、繰り返しの Pi
  ターンでキャッシュが安定します
- プロファイル filtering は、1 つのバンドル MCP サーバー由来のすべてのツールを
  `bundle-mcp` による plugin-owned として扱うため、profile allowlists と deny lists には、
  個別の公開ツール名または `bundle-mcp` Plugin key のどちらも含められます

#### 組み込み Pi 設定

- Claude `settings.json` は、バンドルが有効化されたときにデフォルトの組み込み Pi 設定としてインポートされます
- OpenClaw は shell override keys を適用前に sanitize します

Sanitized keys:

- `shellPath`
- `shellCommandPrefix`

#### 組み込み Pi LSP

- 有効化された Claude バンドルは LSP サーバー設定を提供できます
- OpenClaw は `.lsp.json` と、manifest で宣言された任意の `lspServers` パスを読み込みます
- バンドル LSP 設定は、有効な組み込み Pi LSP デフォルトにマージされます
- 現在実行可能なのは、対応している stdio backed LSP サーバーのみです。未対応の
  トランスポートも `openclaw plugins inspect <id>` には表示されます

### 検出されるが実行されないもの

これらは認識され診断に表示されますが、OpenClaw は実行しません。

- Claude `agents`、`hooks.json` automation、`outputStyles`
- Cursor `.cursor/agents`、`.cursor/hooks.json`、`.cursor/rules`
- capability reporting を超える Codex inline/app metadata

## バンドル形式

<AccordionGroup>
  <Accordion title="Codex バンドル">
    マーカー: `.codex-plugin/plugin.json`

    オプションのコンテンツ: `skills/`、`hooks/`、`.mcp.json`、`.app.json`

    Codex バンドルは、skill ルートと OpenClaw 形式の
    hook-pack ディレクトリ（`HOOK.md` + `handler.ts`）を使用すると、OpenClaw に最もよく適合します。

  </Accordion>

  <Accordion title="Claude バンドル">
    2 つの検出モード:

    - **Manifest ベース:** `.claude-plugin/plugin.json`
    - **Manifest なし:** デフォルトの Claude レイアウト（`skills/`、`commands/`、`agents/`、`hooks/`、`.mcp.json`、`.lsp.json`、`settings.json`）

    Claude 固有の挙動:

    - `commands/` は skill コンテンツとして扱われます
    - `settings.json` は組み込み Pi 設定にインポートされます（shell override keys は sanitized されます）
    - `.mcp.json` は対応している stdio ツールを組み込み Pi に公開します
    - `.lsp.json` と manifest で宣言された `lspServers` パスは、組み込み Pi LSP デフォルトに読み込まれます
    - `hooks/hooks.json` は検出されますが実行されません
    - manifest 内のカスタム component paths は追加的です（デフォルトを置き換えるのではなく拡張します）

  </Accordion>

  <Accordion title="Cursor バンドル">
    マーカー: `.cursor-plugin/plugin.json`

    オプションのコンテンツ: `skills/`、`.cursor/commands/`、`.cursor/agents/`、`.cursor/rules/`、`.cursor/hooks.json`、`.mcp.json`

    - `.cursor/commands/` は skill コンテンツとして扱われます
    - `.cursor/rules/`、`.cursor/agents/`、`.cursor/hooks.json` は detect-only です

  </Accordion>
</AccordionGroup>

## 検出の優先順位

OpenClaw はまずネイティブ Plugin 形式を確認します。

1. `openclaw.plugin.json`、または `openclaw.extensions` を含む有効な `package.json` — **ネイティブ Plugin** として扱われます
2. バンドルマーカー（`.codex-plugin/`、`.claude-plugin/`、またはデフォルトの Claude/Cursor レイアウト）— **バンドル** として扱われます

ディレクトリに両方が含まれる場合、OpenClaw はネイティブの経路を使用します。これにより、
dual-format パッケージがバンドルとして部分的にインストールされることを防ぎます。

## Runtime 依存関係とクリーンアップ

- サードパーティ互換バンドルには、起動時の `npm install` 修復は適用されません。
  これらは `openclaw plugins install` を通じてインストールし、必要なものをすべて
  インストール済み Plugin ディレクトリ内に同梱する必要があります。
- OpenClaw 所有の bundled Plugin は、core に軽量に同梱されるか、
  Plugin インストーラーを通じてダウンロード可能です。Gateway 起動時にそれらのために
  package manager が実行されることはありません。
- `openclaw doctor --fix` は legacy staged dependency directories を削除し、
  local Plugin index に存在しない、設定済みのダウンロード可能な Plugin をインストールできます。

## セキュリティ

バンドルはネイティブ Plugin よりも狭い信頼境界を持ちます。

- OpenClaw は任意のバンドル runtime module をプロセス内に読み込みません
- Skills と hook-pack パスは Plugin root の内側に留まる必要があります（boundary-checked）
- 設定ファイルは同じ境界チェックで読み込まれます
- 対応している stdio MCP サーバーは subprocess として起動される場合があります

これにより、バンドルはデフォルトでより安全になります。ただし、サードパーティバンドルについては、
それらが公開する機能に対する trusted content として扱う必要があります。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="バンドルは検出されるが capability が実行されない">
    `openclaw plugins inspect <id>` を実行してください。capability が listed されているものの
    not wired と表示される場合、それは product limit であり、壊れたインストールではありません。
  </Accordion>

  <Accordion title="Claude コマンドファイルが表示されない">
    バンドルが有効化されており、markdown ファイルが検出済みの
    `commands/` または `skills/` ルート内にあることを確認してください。
  </Accordion>

  <Accordion title="Claude 設定が適用されない">
    `settings.json` からの組み込み Pi 設定のみが対応しています。OpenClaw は
    バンドル設定を raw config patches として扱いません。
  </Accordion>

  <Accordion title="Claude hooks が実行されない">
    `hooks/hooks.json` は detect-only です。実行可能な hooks が必要な場合は、
    OpenClaw hook-pack レイアウトを使用するか、ネイティブ Plugin を同梱してください。
  </Accordion>
</AccordionGroup>

## 関連

- [Plugin をインストールして設定する](/ja-JP/tools/plugin)
- [Plugin を構築する](/ja-JP/plugins/building-plugins) — ネイティブ Plugin を作成する
- [Plugin Manifest](/ja-JP/plugins/manifest) — ネイティブ manifest schema

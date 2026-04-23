---
read_when:
    - Codex、Claude、または Cursor 互換 bundle をインストールしたい場合
    - OpenClaw が bundle の内容をネイティブ機能へどのようにマッピングするかを理解したい場合
    - bundle 検出や不足している capabilities をデバッグしている場合
summary: Codex、Claude、Cursor の bundle を OpenClaw plugins としてインストールして使う
title: Plugin Bundles
x-i18n:
    generated_at: "2026-04-23T14:05:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd5ac067546429412f8f4fd2c0da22005686c2d4377944ecd078f56054223f9b
    source_path: plugins/bundles.md
    workflow: 15
---

# Plugin Bundles

OpenClaw は、3 つの外部エコシステムの plugins をインストールできます: **Codex**、**Claude**、
**Cursor**。これらは **bundles** と呼ばれます。OpenClaw は、それらのコンテンツとメタデータ pack を、
Skills、hooks、MCP tools のようなネイティブ機能へマッピングします。

<Info>
  bundles はネイティブ OpenClaw plugins と**同じではありません**。ネイティブ plugins は
  プロセス内で動作し、任意の capability を登録できます。bundles は、選択的な機能マッピングと
  より狭い trust boundary を持つコンテンツ pack です。
</Info>

## bundle が存在する理由

有用な plugins の多くは Codex、Claude、または Cursor 形式で公開されています。
OpenClaw は、それらをネイティブ OpenClaw plugins として書き直すことを作者に要求する代わりに、
それらの形式を検出し、サポートされているコンテンツをネイティブ機能セットへマッピングします。
これにより、Claude command pack や Codex skill bundle をインストールして、
すぐに使えるようになります。

## bundle をインストールする

<Steps>
  <Step title="ディレクトリ、archive、または marketplace からインストールする">
    ```bash
    # ローカルディレクトリ
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

    bundle は `Format: bundle` として表示され、サブタイプは `codex`、`claude`、または `cursor` です。

  </Step>

  <Step title="再起動して使う">
    ```bash
    openclaw gateway restart
    ```

    マッピングされた機能（Skills、hooks、MCP tools、LSP defaults）は次のセッションで利用可能になります。

  </Step>
</Steps>

## OpenClaw が bundle からマッピングするもの

現在、すべての bundle 機能が OpenClaw で動作するわけではありません。ここでは、
動作するものと、検出はされるがまだ接続されていないものを示します。

### 現在サポートされているもの

| 機能 | マッピング方法 | 適用対象 |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Skill コンテンツ | bundle の skill root は通常の OpenClaw Skills として読み込まれる | すべての形式 |
| コマンド | `commands/` と `.cursor/commands/` は skill root として扱われる | Claude、Cursor |
| Hook pack | OpenClaw スタイルの `HOOK.md` + `handler.ts` レイアウト | Codex |
| MCP tools | bundle の MCP 設定は埋め込み Pi 設定にマージされ、サポートされる stdio と HTTP server が読み込まれる | すべての形式 |
| LSP server | Claude の `.lsp.json` と manifest で宣言された `lspServers` は埋め込み Pi の LSP defaults にマージされる | Claude |
| 設定 | Claude の `settings.json` は埋め込み Pi defaults として取り込まれる | Claude |

#### Skill コンテンツ

- bundle の skill root は通常の OpenClaw skill root として読み込まれます
- Claude の `commands` root は追加の skill root として扱われます
- Cursor の `.cursor/commands` root は追加の skill root として扱われます

つまり、Claude の markdown command file は通常の OpenClaw Skill
loader を通じて動作します。Cursor の command markdown も同じ経路で動作します。

#### Hook pack

- bundle の hook root は、通常の OpenClaw hook-pack
  レイアウトを使用している場合にのみ動作します。現時点では主に Codex 互換ケースです:
  - `HOOK.md`
  - `handler.ts` または `handler.js`

#### Pi 向け MCP

- 有効な bundles は MCP server 設定を提供できます
- OpenClaw は bundle の MCP 設定を、有効な埋め込み Pi 設定の
  `mcpServers` にマージします
- OpenClaw は、stdio server を起動するか HTTP server に接続することで、
  埋め込み Pi agent turn 中にサポートされる bundle MCP tools を公開します
- `coding` と `messaging` の tool profile には、デフォルトで bundle MCP tools が含まれます。agent または Gateway で無効にするには `tools.deny: ["bundle-mcp"]` を使用してください
- project ローカルの Pi 設定は bundle defaults の後にも適用されるため、必要に応じて workspace
  設定で bundle MCP エントリを上書きできます
- bundle MCP tool カタログは登録前に決定的にソートされるため、
  上流の `listTools()` の順序変化で prompt-cache の tool block が不安定になることはありません

##### トランスポート

MCP server は stdio または HTTP トランスポートを使用できます:

**Stdio** は子プロセスを起動します:

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

**HTTP** は、デフォルトでは `sse`、要求された場合は `streamable-http` で、
実行中の MCP server に接続します:

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

- `transport` には `"streamable-http"` または `"sse"` を設定できます。省略時は OpenClaw が `sse` を使用します
- 許可される URL scheme は `http:` と `https:` のみです
- `headers` の値は `${ENV_VAR}` 補間をサポートします
- `command` と `url` の両方を持つ server エントリは拒否されます
- URL の認証情報（userinfo と query params）は、tool
  description とログから秘匿化されます
- `connectionTimeoutMs` は、stdio と HTTP トランスポートの両方に対して
  デフォルトの 30 秒接続タイムアウトを上書きします

##### tool 名

OpenClaw は bundle MCP tools を、provider-safe な名前
`serverName__toolName` 形式で登録します。たとえば、キーが `"vigil-harbor"` の server が
`memory_search` tool を公開している場合、`vigil-harbor__memory_search` として登録されます。

- `A-Za-z0-9_-` 以外の文字は `-` に置き換えられます
- server 接頭辞は 30 文字に制限されます
- 完全な tool 名は 64 文字に制限されます
- 空の server 名は `mcp` にフォールバックします
- 秘匿化後の名前が衝突した場合は、数値接尾辞で区別されます
- 最終的に公開される tool の順序は、安全な名前で決定的に並ぶため、Pi
  の繰り返し turn でも cache が安定します
- profile フィルタリングでは、1 つの bundle MCP server 由来のすべての tools を、
  `bundle-mcp` によって所有される plugin として扱います。そのため、profile の許可リストと拒否リストには、
  個々の公開 tool 名または `bundle-mcp` plugin key のいずれかを含められます

#### 埋め込み Pi 設定

- Claude の `settings.json` は、bundle が
  有効なときデフォルトの埋め込み Pi 設定として取り込まれます
- OpenClaw は適用前に shell override key をサニタイズします

サニタイズされるキー:

- `shellPath`
- `shellCommandPrefix`

#### 埋め込み Pi LSP

- 有効な Claude bundle は LSP server 設定を提供できます
- OpenClaw は `.lsp.json` と、manifest で宣言された `lspServers` path を読み込みます
- bundle の LSP 設定は、有効な埋め込み Pi LSP defaults にマージされます
- 現在実行可能なのは、サポートされる stdio ベースの LSP server のみです。未対応の
  トランスポートも `openclaw plugins inspect <id>` には表示されます

### 検出されるが実行されないもの

これらは認識され diagnostics に表示されますが、OpenClaw は実行しません:

- Claude の `agents`、`hooks.json` automation、`outputStyles`
- Cursor の `.cursor/agents`、`.cursor/hooks.json`、`.cursor/rules`
- capability 報告を超える Codex の inline/app metadata

## bundle 形式

<AccordionGroup>
  <Accordion title="Codex bundles">
    マーカー: `.codex-plugin/plugin.json`

    任意のコンテンツ: `skills/`、`hooks/`、`.mcp.json`、`.app.json`

    Codex bundle は、skill root と OpenClaw スタイルの
    hook-pack ディレクトリ（`HOOK.md` + `handler.ts`）を使うと、OpenClaw に最も適合します。

  </Accordion>

  <Accordion title="Claude bundles">
    検出モードは 2 つあります:

    - **Manifest ベース:** `.claude-plugin/plugin.json`
    - **Manifest なし:** デフォルトの Claude レイアウト（`skills/`、`commands/`、`agents/`、`hooks/`、`.mcp.json`、`.lsp.json`、`settings.json`）

    Claude 固有の動作:

    - `commands/` は Skill コンテンツとして扱われます
    - `settings.json` は埋め込み Pi 設定に取り込まれます（shell override key はサニタイズされます）
    - `.mcp.json` は、埋め込み Pi にサポートされる stdio tools を公開します
    - `.lsp.json` と manifest で宣言された `lspServers` path は、埋め込み Pi の LSP defaults に読み込まれます
    - `hooks/hooks.json` は検出されますが実行されません
    - manifest 内のカスタム component path は追加扱いです（デフォルトを置き換えるのではなく拡張します）

  </Accordion>

  <Accordion title="Cursor bundles">
    マーカー: `.cursor-plugin/plugin.json`

    任意のコンテンツ: `skills/`、`.cursor/commands/`、`.cursor/agents/`、`.cursor/rules/`、`.cursor/hooks.json`、`.mcp.json`

    - `.cursor/commands/` は Skill コンテンツとして扱われます
    - `.cursor/rules/`、`.cursor/agents/`、`.cursor/hooks.json` は検出のみです

  </Accordion>
</AccordionGroup>

## 検出の優先順位

OpenClaw はまずネイティブ plugin 形式を確認します:

1. `openclaw.plugin.json` または `openclaw.extensions` を持つ有効な `package.json` — **ネイティブ plugin** として扱う
2. bundle マーカー（`.codex-plugin/`、`.claude-plugin/`、またはデフォルトの Claude/Cursor レイアウト）— **bundle** として扱う

ディレクトリに両方が含まれている場合、OpenClaw はネイティブ経路を使います。これにより、
二重形式 package が bundle として部分的にインストールされるのを防ぎます。

## ランタイム依存関係とクリーンアップ

- バンドルされた plugin のランタイム依存関係は、OpenClaw package 内の
  `dist/*` に同梱されます。OpenClaw はバンドルされた
  plugins に対して起動時に `npm install` を実行**しません**。完全な bundled
  dependency payload の同梱はリリースパイプラインの責務です（
  [Releasing](/ja-JP/reference/RELEASING) の postpublish 検証ルールを参照）。

## セキュリティ

bundles はネイティブ plugins よりも狭い trust boundary を持ちます:

- OpenClaw は任意の bundle ランタイム module をプロセス内に読み込み**ません**
- Skills と hook-pack の path は plugin root 内にとどまる必要があります（boundary check あり）
- 設定ファイルも同じ boundary check 付きで読み込まれます
- サポートされる stdio MCP server は subprocess として起動される場合があります

これにより、bundles はデフォルトでより安全になりますが、それでもサードパーティ
bundle は、公開される機能に関しては信頼されたコンテンツとして扱うべきです。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="bundle は検出されるが capability が動作しない">
    `openclaw plugins inspect <id>` を実行してください。capability が表示されていても
    未接続としてマークされている場合、それは壊れたインストールではなく製品上の制限です。
  </Accordion>

  <Accordion title="Claude command file が表示されない">
    bundle が有効であり、markdown file が検出される
    `commands/` または `skills/` root の中にあることを確認してください。
  </Accordion>

  <Accordion title="Claude 設定が適用されない">
    `settings.json` 由来の埋め込み Pi 設定のみがサポートされています。OpenClaw は
    bundle 設定を生の設定 patch としては扱いません。
  </Accordion>

  <Accordion title="Claude hooks が実行されない">
    `hooks/hooks.json` は検出のみです。実行可能な hooks が必要な場合は、
    OpenClaw hook-pack レイアウトを使うか、ネイティブ plugin を提供してください。
  </Accordion>
</AccordionGroup>

## 関連

- [Install and Configure Plugins](/ja-JP/tools/plugin)
- [Building Plugins](/ja-JP/plugins/building-plugins) — ネイティブ plugin を作成する
- [Plugin Manifest](/ja-JP/plugins/manifest) — ネイティブ manifest schema

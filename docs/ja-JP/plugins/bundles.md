---
read_when:
    - Codex、Claude、またはCursor互換のバンドルをインストールする場合
    - OpenClaw がバンドルの内容をネイティブ機能にどのようにマッピングするかを理解する必要があります
    - バンドル検出または不足している機能をデバッグしている場合
summary: Codex、Claude、CursorのバンドルをOpenClawのPluginとしてインストールして使用する
title: Plugin バンドル
x-i18n:
    generated_at: "2026-07-11T22:26:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d44006866238f53ee2e3e8126cc4f7ed6f7413534257775f7904c9b877778c59
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw は、**Codex**、**Claude**、**Cursor** という 3 つの外部エコシステムから Plugin をインストールできます。これらは **バンドル** と呼ばれ、OpenClaw が Skills、フック、MCP ツールなどのネイティブ機能にマッピングするコンテンツとメタデータのパックです。

<Info>
  バンドルは、ネイティブ OpenClaw Plugin と**同じではありません**。ネイティブ Plugin はプロセス内で実行され、任意の機能を登録できます。バンドルは、機能が選択的にマッピングされ、信頼境界がより狭いコンテンツパックです。
</Info>

## バンドルが存在する理由

多くの有用な Plugin が Codex、Claude、Cursor 形式で公開されています。作成者にネイティブ OpenClaw Plugin として書き直すことを求める代わりに、OpenClaw はこれらの形式を検出し、サポート対象のコンテンツをネイティブ機能セットにマッピングします。Claude コマンドパックや Codex Skills バンドルをインストールして、すぐに使用できます。

## バンドルをインストールする

<Steps>
  <Step title="ディレクトリ、アーカイブ、またはマーケットプレイスからインストールする">
    ```bash
    # ローカルディレクトリ
    openclaw plugins install ./my-bundle

    # アーカイブ
    openclaw plugins install ./my-bundle.tgz

    # Claude マーケットプレイス
    openclaw plugins marketplace list <source>
    openclaw plugins install <plugin> --marketplace <source>
    ```

    `<source>` はローカルのマーケットプレイスパス/リポジトリ、または git/GitHub ソースです。

  </Step>

  <Step title="検出を確認する">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    バンドルには `Format: bundle` と、`codex`、`claude`、`cursor` のいずれかを値とする `Bundle format:` が表示されます。

  </Step>

  <Step title="再起動して使用する">
    ```bash
    openclaw gateway restart
    ```

    マッピングされた機能（Skills、フック、MCP ツール、LSP のデフォルト設定）は、次のセッションで使用できます。

  </Step>
</Steps>

## OpenClaw がバンドルからマッピングするもの

現在、すべてのバンドル機能が OpenClaw で実行されるわけではありません。以下に、動作するものと、検出はされるもののまだ接続されていないものを示します。

### 現在サポートされている機能

| 機能          | マッピング方法                                                                                         | 対象形式       |
| ------------- | ------------------------------------------------------------------------------------------------------ | -------------- |
| Skills コンテンツ | バンドルの Skills ルートを通常の OpenClaw Skills として読み込む                                       | すべての形式   |
| コマンド      | `commands/` と `.cursor/commands/` を Skills ルートとして扱う                                         | Claude、Cursor |
| フックパック  | OpenClaw 形式の `HOOK.md` + `handler.ts` レイアウト                                                    | Codex          |
| MCP ツール    | バンドルの MCP 設定を組み込み OpenClaw 設定にマージし、対応する stdio および HTTP サーバーを読み込む   | すべての形式   |
| LSP サーバー  | Claude の `.lsp.json` とマニフェストで宣言された `lspServers` を組み込み OpenClaw の LSP デフォルト設定にマージする | Claude         |
| 設定          | Claude の `settings.json` を組み込み OpenClaw のデフォルト設定としてインポートする                      | Claude         |

#### Skills コンテンツ

- バンドルの Skills ルートは、通常の OpenClaw Skills ルートとして読み込まれます。
- Claude の `commands/` ルートは、追加の Skills ルートとして扱われます。
- Cursor の `.cursor/commands/` ルートは、追加の Skills ルートとして扱われます。

Claude の Markdown コマンドファイルと Cursor のコマンド Markdown は、どちらも通常の OpenClaw Skills ローダーを通じて動作します。

#### フックパック

バンドルのフックルートが動作するのは、通常の OpenClaw フックパックレイアウト（`HOOK.md` と `handler.ts` または `handler.js`）を使用している場合**のみ**です。現在、これは主に Codex 互換の場合に該当します。

#### 組み込み OpenClaw 向け MCP

- 有効化されたバンドルは、MCP サーバー設定を提供できます。
- OpenClaw はバンドルの MCP 設定を、有効な組み込み OpenClaw 設定に `mcpServers` としてマージします。
- OpenClaw は、stdio サーバーを起動するか HTTP サーバーに接続することで、組み込み OpenClaw エージェントのターン中に対応するバンドル MCP ツールを公開します。
- `coding` および `messaging` ツールプロファイルには、デフォルトでバンドル MCP ツールが含まれます。エージェントまたは Gateway で無効にするには、`tools.deny: ["bundle-mcp"]` を使用します。
- プロジェクトローカルの組み込みエージェント設定は、バンドルのデフォルト設定の後に引き続き適用されるため、必要に応じてワークスペース設定でバンドルの MCP エントリを上書きできます。
- バンドル MCP ツールカタログは登録前に決定的にソートされるため、上流の `listTools()` の順序が変わっても、プロンプトキャッシュのツールブロックが不必要に変動しません。

##### トランスポート

MCP サーバーでは、stdio または HTTP トランスポートを使用できます。

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

**HTTP** は実行中の MCP サーバーに接続します。`streamable-http` が要求されていない場合、デフォルトは `sse` です。

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

- `transport` には `"streamable-http"` または `"sse"` を指定できます。省略時のデフォルトは `sse` です。
- `type: "http"` は CLI ネイティブの下流形式です。OpenClaw の設定では `transport: "streamable-http"` を使用してください。`openclaw mcp set` と `openclaw doctor --fix` は、一般的な別名を正規化します。
- 使用できる URL スキームは `http:` と `https:` のみです。
- `headers` の値では `${ENV_VAR}` 補間がサポートされます。
- `command` と `url` の両方を持つサーバーエントリは拒否されます。
- URL の認証情報（ユーザー情報およびクエリパラメーター）は、ツールの説明とログから秘匿化されます。
- `connectionTimeoutMs` は、stdio と HTTP の両方のトランスポートに対するデフォルトの 30 秒の接続タイムアウトを上書きします。リクエストタイムアウトのデフォルトは 60 秒で、`requestTimeoutMs` で上書きできます。

##### ツール名

OpenClaw は、バンドル MCP ツールを `serverName__toolName` 形式のプロバイダーで安全に使用できる名前で登録します。たとえば、`memory_search` ツールを公開する、キーが `"vigil-harbor"` のサーバーは、`vigil-harbor__memory_search` として登録されます。

- `A-Za-z0-9_-` 以外の文字は `-` に置き換えられます。
- 先頭が英字以外になる断片には英字の接頭辞が付けられるため、`12306` のような数字のサーバーキーもプロバイダーで安全に使用できるツール接頭辞になります。
- サーバー接頭辞は最大 30 文字です。
- ツール名全体は最大 64 文字です。
- 空のサーバー名には `mcp` が使用されます。
- サニタイズ後の名前が衝突する場合は、数字の接尾辞で区別されます。
- 最終的に公開されるツールの順序は安全な名前によって決定的に定まり、組み込みエージェントの反復ターンでもキャッシュが安定します。
- プロファイルフィルタリングでは、1 つのバンドル MCP サーバーのすべてのツールが `bundle-mcp` によって所有される Plugin として扱われるため、プロファイルの許可/拒否リストでは、公開された個々のツール名または `bundle-mcp` Plugin キーのいずれかを参照できます。

#### 組み込み OpenClaw 設定

バンドルが有効な場合、Claude の `settings.json` は組み込み OpenClaw のデフォルト設定としてインポートされます。OpenClaw は適用前に、次のシェル上書きキーをサニタイズします。

- `shellPath`
- `shellCommandPrefix`

#### 組み込み OpenClaw LSP

- 有効化された Claude バンドルは、LSP サーバー設定を提供できます。
- OpenClaw は `.lsp.json` と、マニフェストで宣言されたすべての `lspServers` パスを読み込みます。
- バンドルの LSP 設定は、有効な組み込み OpenClaw の LSP デフォルト設定にマージされます。
- 現在実行できるのは、対応する stdio ベースの LSP サーバーのみです。非対応のトランスポートも `openclaw plugins inspect <id>` には表示されます。

### 検出されるが実行されない機能

以下は認識されて診断情報に表示されますが、OpenClaw は実行しません。

- Claude の `agents`、`hooks/hooks.json` オートメーション、`outputStyles`
- Cursor の `.cursor/agents`、`.cursor/hooks.json`、`.cursor/rules`
- 機能レポート以外の Codex `.app.json` メタデータ

## バンドル形式

<AccordionGroup>
  <Accordion title="Codex バンドル">
    マーカー：`.codex-plugin/plugin.json`

    オプションのコンテンツ：`skills/`、`hooks/`、`.mcp.json`、`.app.json`

    Codex バンドルは、Skills ルートと OpenClaw 形式のフックパックディレクトリ（`HOOK.md` + `handler.ts`）を使用すると、OpenClaw に最も適合します。

  </Accordion>

  <Accordion title="Claude バンドル">
    2 つの検出モードがあります。

    - **マニフェストベース：** `.claude-plugin/plugin.json`
    - **マニフェストなし：** Claude のデフォルトレイアウト（`skills/`、`commands/`、`agents/`、`hooks/`、`.mcp.json`、`.lsp.json`、`settings.json`）

    Claude 固有の動作：

    - `commands/` は Skills コンテンツとして扱われます
    - `settings.json` は組み込み OpenClaw 設定にインポートされます（シェル上書きキーはサニタイズされます）
    - `.mcp.json` は、対応する stdio ツールを組み込み OpenClaw に公開します
    - `.lsp.json` とマニフェストで宣言された `lspServers` パスは、組み込み OpenClaw の LSP デフォルト設定に読み込まれます
    - `hooks/hooks.json` は検出されますが実行されません
    - マニフェスト内のカスタムコンポーネントパスは追加的に扱われます。デフォルトを置き換えるのではなく拡張します

  </Accordion>

  <Accordion title="Cursor バンドル">
    マーカー：`.cursor-plugin/plugin.json`

    オプションのコンテンツ：`skills/`、`.cursor/commands/`、`.cursor/agents/`、`.cursor/rules/`、`.cursor/hooks.json`、`.mcp.json`

    - `.cursor/commands/` は Skills コンテンツとして扱われます
    - `.cursor/rules/`、`.cursor/agents/`、`.cursor/hooks.json` は検出のみ行われます

  </Accordion>
</AccordionGroup>

## 検出の優先順位

OpenClaw は最初にネイティブ Plugin 形式を確認します。

1. `openclaw.plugin.json`、または `openclaw.extensions` を持つ有効な `package.json` — **ネイティブ Plugin** として扱われます
2. バンドルマーカー（`.codex-plugin/`、`.claude-plugin/`、または Claude/Cursor のデフォルトレイアウト）— **バンドル**として扱われます

ディレクトリに両方が含まれている場合、OpenClaw はネイティブのパスを使用します。これにより、デュアル形式のパッケージがバンドルとして部分的にインストールされるのを防ぎます。

## ランタイム依存関係とクリーンアップ

- サードパーティーの互換バンドルには、起動時の `npm install` 修復は適用されません。これらは `openclaw plugins install` を通じてインストールし、必要なものをすべてインストール済み Plugin ディレクトリに含める必要があります。
- OpenClaw が所有するバンドル済み Plugin は、コアに軽量な形で同梱されるか、Plugin インストーラーを通じてダウンロードできます。Gateway の起動時に、それらのためにパッケージマネージャーが実行されることはありません。
- `openclaw doctor --fix` は、古いローカルのバンドル済み Plugin インストール記録を削除します。また、設定から引き続き参照されているものの、ローカル Plugin インデックスに存在しないダウンロード可能な Plugin を復旧できます。

## セキュリティ

バンドルは、ネイティブ Plugin よりも信頼境界が狭くなっています。

- OpenClaw は、任意のバンドルランタイムモジュールをプロセス内に読み込み**ません**。
- Skills とフックパックのパスは Plugin ルート内に収まる必要があります（境界チェックあり）。
- 設定ファイルは同じ境界チェックを使用して読み込まれます。
- 対応する stdio MCP サーバーは、サブプロセスとして起動される場合があります。

これにより、バンドルはデフォルトでより安全になりますが、サードパーティー製バンドルについては、公開される機能に関して信頼済みコンテンツとして扱う必要があります。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="バンドルは検出されるが機能が実行されない">
    `openclaw plugins inspect <id>` を実行します。機能が一覧に表示されていても未接続と示されている場合、それはインストールの不具合ではなく製品上の制限です。
  </Accordion>

  <Accordion title="Claude コマンドファイルが表示されない">
    バンドルが有効であり、Markdown ファイルが検出対象の `commands/` または `skills/` ルート内にあることを確認してください。
  </Accordion>

  <Accordion title="Claude 設定が適用されない">
    `settings.json` からの組み込み OpenClaw 設定のみがサポートされます。OpenClaw はバンドル設定を未加工の設定パッチとして扱いません。
  </Accordion>

  <Accordion title="Claude フックが実行されない">
    `hooks/hooks.json` は検出のみ行われます。実行可能なフックが必要な場合は、OpenClaw フックパックレイアウトを使用するか、ネイティブ Plugin として配布してください。
  </Accordion>
</AccordionGroup>

## 関連項目

- [Plugin のインストールと設定](/ja-JP/tools/plugin)
- [Plugin の構築](/ja-JP/plugins/building-plugins) - ネイティブ Plugin を作成する
- [Plugin マニフェスト](/ja-JP/plugins/manifest) - ネイティブマニフェストのスキーマ

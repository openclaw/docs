---
read_when:
    - Codex、Claude、または Cursor 互換バンドルをインストールしたい場合
    - OpenClaw がバンドル内容をネイティブ機能にどのようにマッピングするかを理解する必要があります
    - バンドル検出または不足している機能をデバッグしている
summary: Codex、Claude、Cursor バンドルを OpenClaw Plugin としてインストールして使用する
title: Plugin バンドル
x-i18n:
    generated_at: "2026-07-05T11:36:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d44006866238f53ee2e3e8126cc4f7ed6f7413534257775f7904c9b877778c59
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw は、**Codex**、**Claude**、
**Cursor** の3つの外部エコシステムからプラグインをインストールできます。これらは **バンドル** と呼ばれます。OpenClaw が Skills、フック、MCP ツールなどのネイティブ機能へマッピングする、コンテンツとメタデータのパックです。

<Info>
  バンドルはネイティブ OpenClaw プラグインと**同じではありません**。ネイティブプラグインは
  インプロセスで実行され、任意の機能を登録できます。バンドルは、選択的な機能マッピングと
  より狭い信頼境界を持つコンテンツパックです。
</Info>

## バンドルが存在する理由

有用なプラグインの多くは Codex、Claude、Cursor 形式で公開されています。作者にネイティブ OpenClaw プラグインとして書き直すことを求める代わりに、OpenClaw はこれらの形式を検出し、対応しているコンテンツをネイティブ機能セットへマッピングします。Claude コマンドパックや Codex スキルバンドルをインストールして、すぐに使えます。

## バンドルをインストールする

<Steps>
  <Step title="Install from a directory, archive, or marketplace">
    ```bash
    # Local directory
    openclaw plugins install ./my-bundle

    # Archive
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
    openclaw plugins marketplace list <source>
    openclaw plugins install <plugin> --marketplace <source>
    ```

    `<source>` はローカルマーケットプレイスのパス/リポジトリ、または git/GitHub ソースです。

  </Step>

  <Step title="Verify detection">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    バンドルには `Format: bundle` に加えて、`Bundle format:` の値として `codex`、
    `claude`、または `cursor` が表示されます。

  </Step>

  <Step title="Restart and use">
    ```bash
    openclaw gateway restart
    ```

    マッピングされた機能（Skills、フック、MCP ツール、LSP デフォルト）は次のセッションで利用できます。

  </Step>
</Steps>

## OpenClaw がバンドルからマッピングするもの

現在、すべてのバンドル機能が OpenClaw で実行されるわけではありません。以下に、動作するものと、検出されるもののまだ接続されていないものを示します。

### 現在サポートされているもの

| 機能       | マッピング方法                                                                                       | 適用対象     |
| ------------- | ------------------------------------------------------------------------------------------------- | -------------- |
| スキルコンテンツ | バンドルのスキルルートを通常の OpenClaw Skills として読み込む                                                 | すべての形式    |
| コマンド      | `commands/` と `.cursor/commands/` をスキルルートとして扱う                                        | Claude、Cursor |
| フックパック    | OpenClaw スタイルの `HOOK.md` + `handler.ts` レイアウト                                                   | Codex          |
| MCP ツール     | バンドル MCP 設定を埋め込み OpenClaw 設定にマージし、対応する stdio および HTTP サーバーを読み込む | すべての形式    |
| LSP サーバー   | Claude の `.lsp.json` とマニフェストで宣言された `lspServers` を埋め込み OpenClaw LSP デフォルトにマージする  | Claude         |
| 設定      | Claude の `settings.json` を埋め込み OpenClaw デフォルトとしてインポートする                                     | Claude         |

#### スキルコンテンツ

- バンドルのスキルルートは通常の OpenClaw スキルルートとして読み込まれます。
- Claude の `commands/` ルートは追加のスキルルートとして扱われます。
- Cursor の `.cursor/commands/` ルートは追加のスキルルートとして扱われます。

Claude の Markdown コマンドファイルと Cursor のコマンド Markdown は、どちらも通常の OpenClaw スキルローダーを通じて動作します。

#### フックパック

バンドルのフックルートは、通常の OpenClaw フックパックレイアウト（`HOOK.md` に加えて `handler.ts` または `handler.js`）を使う場合に**のみ**動作します。現在、これは主に Codex 互換のケースです。

#### 埋め込み OpenClaw 向け MCP

- 有効なバンドルは MCP サーバー設定を提供できます。
- OpenClaw はバンドル MCP 設定を、有効な埋め込み OpenClaw
  設定の `mcpServers` としてマージします。
- OpenClaw は、stdio サーバーを起動するか HTTP サーバーへ接続することで、埋め込み OpenClaw エージェントのターン中に、対応するバンドル MCP ツールを公開します。
- `coding` と `messaging` のツールプロファイルには、デフォルトでバンドル MCP ツールが含まれます。エージェントまたは Gateway でオプトアウトするには、`tools.deny: ["bundle-mcp"]` を使用します。
- プロジェクトローカルの埋め込みエージェント設定はバンドルデフォルトの後にも適用されるため、必要に応じてワークスペース設定でバンドル MCP エントリを上書きできます。
- バンドル MCP ツールカタログは登録前に決定論的にソートされるため、上流の `listTools()` の順序変更によってプロンプトキャッシュのツールブロックが頻繁に変動することはありません。

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

**HTTP** は実行中の MCP サーバーへ接続し、`streamable-http` が要求されない限りデフォルトで `sse` を使用します。

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

- `transport` は `"streamable-http"` または `"sse"` を受け付けます。省略した場合のデフォルトは `sse` です。
- `type: "http"` は CLI ネイティブの下流形式です。OpenClaw 設定では `transport: "streamable-http"` を使用してください。`openclaw mcp set` と `openclaw doctor --fix` は一般的なエイリアスを正規化します。
- 許可される URL スキームは `http:` と `https:` のみです。
- `headers` の値は `${ENV_VAR}` 補間をサポートします。
- `command` と `url` の両方を持つサーバーエントリは拒否されます。
- URL 認証情報（ユーザー情報とクエリパラメータ）は、ツール説明とログから墨消しされます。
- `connectionTimeoutMs` は、stdio と HTTP の両方のトランスポートでデフォルトの30秒接続タイムアウトを上書きします。リクエストタイムアウトのデフォルトは60秒で、`requestTimeoutMs` で上書きできます。

##### ツール命名

OpenClaw は、バンドル MCP ツールを `serverName__toolName` 形式のプロバイダー安全な名前で登録します。たとえば、`memory_search` ツールを公開する `"vigil-harbor"` というキーのサーバーは、`vigil-harbor__memory_search` として登録されます。

- `A-Za-z0-9_-` 以外の文字は `-` に置き換えられます。
- 文字以外で始まるフラグメントには文字プレフィックスが付くため、`12306` のような数値サーバーキーもプロバイダー安全なツールプレフィックスになります。
- サーバープレフィックスは30文字に制限されます。
- 完全なツール名は64文字に制限されます。
- 空のサーバー名は `mcp` にフォールバックします。
- サニタイズ後の名前が衝突する場合は、数値サフィックスで曖昧さを解消します。
- 最終的に公開されるツール順序は安全な名前によって決定論的になり、埋め込みエージェントの反復ターンでキャッシュが安定します。
- プロファイルフィルタリングでは、1つのバンドル MCP サーバーからのすべてのツールを `bundle-mcp` によるプラグイン所有として扱うため、プロファイルの許可/拒否リストは個別の公開ツール名または `bundle-mcp` プラグインキーのどちらも参照できます。

#### 埋め込み OpenClaw 設定

Claude の `settings.json` は、バンドルが有効な場合にデフォルトの埋め込み OpenClaw 設定としてインポートされます。OpenClaw は適用前にシェル上書きキーをサニタイズします。

- `shellPath`
- `shellCommandPrefix`

#### 埋め込み OpenClaw LSP

- 有効な Claude バンドルは LSP サーバー設定を提供できます。
- OpenClaw は `.lsp.json` と、マニフェストで宣言された任意の `lspServers` パスを読み込みます。
- バンドル LSP 設定は、有効な埋め込み OpenClaw LSP デフォルトにマージされます。
- 現在実行可能なのは、対応済みの stdio ベース LSP サーバーのみです。未対応のトランスポートも `openclaw plugins inspect <id>` には表示されます。

### 検出されるが実行されないもの

これらは認識され診断に表示されますが、OpenClaw は実行しません。

- Claude `agents`、`hooks/hooks.json` 自動化、`outputStyles`
- Cursor `.cursor/agents`、`.cursor/hooks.json`、`.cursor/rules`
- Codex `.app.json` の機能レポート以外のメタデータ

## バンドル形式

<AccordionGroup>
  <Accordion title="Codex bundles">
    マーカー: `.codex-plugin/plugin.json`

    任意のコンテンツ: `skills/`、`hooks/`、`.mcp.json`、`.app.json`

    Codex バンドルは、スキルルートと OpenClaw スタイルのフックパックディレクトリ（`HOOK.md` + `handler.ts`）を使用すると、OpenClaw に最も適合します。

  </Accordion>

  <Accordion title="Claude bundles">
    2つの検出モード:

    - **マニフェストベース:** `.claude-plugin/plugin.json`
    - **マニフェストなし:** デフォルトの Claude レイアウト（`skills/`、`commands/`、`agents/`、`hooks/`、`.mcp.json`、`.lsp.json`、`settings.json`）

    Claude 固有の動作:

    - `commands/` はスキルコンテンツとして扱われます
    - `settings.json` は埋め込み OpenClaw 設定にインポートされます（シェル上書きキーはサニタイズされます）
    - `.mcp.json` は対応する stdio ツールを埋め込み OpenClaw に公開します
    - `.lsp.json` とマニフェストで宣言された `lspServers` パスは、埋め込み OpenClaw LSP デフォルトに読み込まれます
    - `hooks/hooks.json` は検出されますが実行されません
    - マニフェスト内のカスタムコンポーネントパスは追加的です。デフォルトを置き換えるのではなく拡張します

  </Accordion>

  <Accordion title="Cursor bundles">
    マーカー: `.cursor-plugin/plugin.json`

    任意のコンテンツ: `skills/`、`.cursor/commands/`、`.cursor/agents/`、`.cursor/rules/`、`.cursor/hooks.json`、`.mcp.json`

    - `.cursor/commands/` はスキルコンテンツとして扱われます
    - `.cursor/rules/`、`.cursor/agents/`、`.cursor/hooks.json` は検出のみです

  </Accordion>
</AccordionGroup>

## 検出の優先順位

OpenClaw はまずネイティブプラグイン形式を確認します。

1. `openclaw.plugin.json` または `openclaw.extensions` を持つ有効な `package.json` - **ネイティブプラグイン**として扱われます
2. バンドルマーカー（`.codex-plugin/`、`.claude-plugin/`、またはデフォルトの Claude/Cursor レイアウト） - **バンドル**として扱われます

ディレクトリに両方が含まれる場合、OpenClaw はネイティブパスを使用します。これにより、デュアル形式のパッケージがバンドルとして部分的にインストールされるのを防ぎます。

## ランタイム依存関係とクリーンアップ

- サードパーティ互換バンドルには、起動時の `npm install` 修復は行われません。これらは `openclaw plugins install` を通じてインストールされ、必要なものをすべてインストール済みプラグインディレクトリ内に同梱する必要があります。
- OpenClaw 所有のバンドルプラグインは、core に軽量に同梱されるか、プラグインインストーラーを通じてダウンロード可能です。Gateway 起動時にそれらのためにパッケージマネージャーを実行することはありません。
- `openclaw doctor --fix` は古いローカルのバンドルプラグインインストール記録を削除し、設定がまだ参照しているのにローカルプラグインインデックスに存在しないダウンロード可能プラグインを復旧できます。

## セキュリティ

バンドルはネイティブプラグインより狭い信頼境界を持ちます。

- OpenClaw は任意のバンドルランタイムモジュールをインプロセスで読み込みません。
- Skills とフックパックのパスは、プラグインルート内に留まる必要があります（境界チェック済み）。
- 設定ファイルは同じ境界チェックで読み込まれます。
- 対応する stdio MCP サーバーはサブプロセスとして起動される場合があります。

これにより、バンドルはデフォルトでより安全になりますが、それでもサードパーティバンドルは、公開する機能に関して信頼済みコンテンツとして扱う必要があります。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="Bundle is detected but capabilities do not run">
    `openclaw plugins inspect <id>` を実行してください。機能が一覧表示されているものの未接続としてマークされている場合、それは製品上の制限であり、インストールの破損ではありません。
  </Accordion>

  <Accordion title="Claude command files do not appear">
    バンドルが有効であり、Markdown ファイルが検出された `commands/` または `skills/` ルート内にあることを確認してください。
  </Accordion>

  <Accordion title="Claude settings do not apply">
    `settings.json` からの埋め込み OpenClaw 設定のみがサポートされます。OpenClaw はバンドル設定を生の設定パッチとして扱いません。
  </Accordion>

  <Accordion title="Claude hooks do not execute">
    `hooks/hooks.json` は検出のみです。実行可能なフックが必要な場合は、OpenClaw フックパックレイアウトを使用するか、ネイティブプラグインとして提供してください。
  </Accordion>
</AccordionGroup>

## 関連

- [プラグインをインストールして設定する](/ja-JP/tools/plugin)
- [プラグインの構築](/ja-JP/plugins/building-plugins) - ネイティブプラグインを作成する
- [プラグインマニフェスト](/ja-JP/plugins/manifest) - ネイティブマニフェストスキーマ

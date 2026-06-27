---
read_when:
    - Codex、Claude、または Cursor 互換バンドルをインストールしたい
    - OpenClaw がバンドルコンテンツをネイティブ機能にどのようにマッピングするかを理解する必要があります
    - バンドル検出または不足している機能をデバッグしている
summary: Codex、Claude、Cursor バンドルを OpenClaw plugins としてインストールして使用する
title: Plugin バンドル
x-i18n:
    generated_at: "2026-06-27T12:10:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b26915603db9d4d4422f4d1542f033be02eb83c5ffefcf93cac7968f624f4969
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw は、**Codex**、**Claude**、
**Cursor** という 3 つの外部エコシステムから Plugin をインストールできます。これらは **バンドル** と呼ばれ、OpenClaw が Skills、フック、MCP ツールなどのネイティブ機能にマッピングするコンテンツとメタデータのパックです。

<Info>
  バンドルはネイティブ OpenClaw Plugin と**同じではありません**。ネイティブ Plugin は
  インプロセスで実行され、任意の機能を登録できます。バンドルは、選択的な機能マッピングと
  より狭い信頼境界を持つコンテンツパックです。
</Info>

## バンドルが存在する理由

有用な Plugin の多くは Codex、Claude、または Cursor 形式で公開されています。
作者にネイティブ OpenClaw Plugin として書き直すことを求める代わりに、OpenClaw は
これらの形式を検出し、サポート対象のコンテンツをネイティブ機能セットにマッピングします。
つまり、Claude コマンドパックや Codex Skills バンドルをインストールして、
すぐに使用できます。

## バンドルをインストールする

<Steps>
  <Step title="ディレクトリ、アーカイブ、またはマーケットプレイスからインストールする">
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

    バンドルは `Format: bundle` として表示され、サブタイプは `codex`、`claude`、または `cursor` です。

  </Step>

  <Step title="再起動して使用する">
    ```bash
    openclaw gateway restart
    ```

    マッピングされた機能（Skills、フック、MCP ツール、LSP デフォルト）は次のセッションで利用できます。

  </Step>
</Steps>

## OpenClaw がバンドルからマッピングするもの

現時点では、すべてのバンドル機能が OpenClaw で実行されるわけではありません。
動作するものと、検出はされるがまだ接続されていないものは次のとおりです。

### 現在サポート対象

| 機能       | マッピング方法                                                                                       | 適用対象     |
| ------------- | ------------------------------------------------------------------------------------------------- | -------------- |
| Skills コンテンツ | バンドルの Skills ルートは通常の OpenClaw Skills として読み込まれる                                                 | すべての形式    |
| コマンド      | `commands/` と `.cursor/commands/` は Skills ルートとして扱われる                                        | Claude、Cursor |
| フックパック    | OpenClaw スタイルの `HOOK.md` + `handler.ts` レイアウト                                                   | Codex          |
| MCP ツール     | バンドル MCP 設定は埋め込み OpenClaw 設定にマージされる。サポート対象の stdio および HTTP サーバーが読み込まれる | すべての形式    |
| LSP サーバー   | Claude `.lsp.json` とマニフェストで宣言された `lspServers` は埋め込み OpenClaw LSP デフォルトにマージされる  | Claude         |
| 設定      | Claude `settings.json` は埋め込み OpenClaw デフォルトとしてインポートされる                                     | Claude         |

#### Skills コンテンツ

- バンドルの Skills ルートは通常の OpenClaw Skills ルートとして読み込まれる
- Claude `commands` ルートは追加の Skills ルートとして扱われる
- Cursor `.cursor/commands` ルートは追加の Skills ルートとして扱われる

つまり、Claude の Markdown コマンドファイルは通常の OpenClaw Skills
ローダーを通じて動作します。Cursor のコマンド Markdown も同じ経路で動作します。

#### フックパック

- バンドルのフックルートが動作するのは、通常の OpenClaw フックパック
  レイアウトを使用している場合**のみ**です。現時点では、これは主に Codex 互換のケースです。
  - `HOOK.md`
  - `handler.ts` または `handler.js`

#### 埋め込み OpenClaw 用 MCP

- 有効なバンドルは MCP サーバー設定を提供できる
- OpenClaw はバンドル MCP 設定を有効な埋め込み OpenClaw 設定に
  `mcpServers` としてマージする
- OpenClaw は、stdio サーバーを起動するか HTTP サーバーに接続することで、
  埋め込み OpenClaw エージェントターン中にサポート対象のバンドル MCP ツールを公開する
- `coding` と `messaging` ツールプロファイルには、デフォルトでバンドル MCP ツールが含まれる。
  エージェントまたは Gateway でオプトアウトするには `tools.deny: ["bundle-mcp"]` を使用する
- プロジェクトローカルの埋め込みエージェント設定は、バンドルデフォルトの後にも引き続き適用されるため、
  必要に応じてワークスペース設定でバンドル MCP エントリを上書きできる
- バンドル MCP ツールカタログは登録前に決定論的にソートされるため、
  上流の `listTools()` の順序変更によってプロンプトキャッシュのツールブロックが不安定にならない

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

**HTTP** は、デフォルトでは `sse`、要求された場合は `streamable-http` を使って実行中の MCP サーバーに接続します。

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

- `transport` は `"streamable-http"` または `"sse"` に設定できる。省略時、OpenClaw は `sse` を使用する
- `type: "http"` は CLI ネイティブの下流形状である。OpenClaw 設定では `transport: "streamable-http"` を使用する。`openclaw mcp set` と `openclaw doctor --fix` は一般的なエイリアスを正規化する。
- 許可される URL スキームは `http:` と `https:` のみ
- `headers` の値は `${ENV_VAR}` 補間をサポートする
- `command` と `url` の両方を含むサーバーエントリは拒否される
- URL 認証情報（userinfo とクエリパラメータ）は、ツールの説明とログから
  マスクされる
- `connectionTimeoutMs` は、stdio と HTTP の両方のトランスポートについて、
  デフォルトの 30 秒接続タイムアウトを上書きする

##### ツール命名

OpenClaw は、バンドル MCP ツールを `serverName__toolName` 形式の
プロバイダー安全な名前で登録します。たとえば、`memory_search` ツールを公開する
`"vigil-harbor"` というキーのサーバーは、`vigil-harbor__memory_search` として登録されます。

- `A-Za-z0-9_-` 以外の文字は `-` に置換される
- 英字以外で始まるフラグメントには英字プレフィックスが付くため、
  `12306` のような数値サーバーキーはプロバイダー安全なツールプレフィックスになる
- サーバープレフィックスは最大 30 文字に制限される
- 完全なツール名は最大 64 文字に制限される
- 空のサーバー名は `mcp` にフォールバックする
- サニタイズ後の名前が衝突した場合は、数値サフィックスで曖昧さが解消される
- 最終的に公開されるツールの順序は、安全な名前に基づいて決定論的になるため、
  繰り返しの埋め込みエージェントターンでキャッシュが安定する
- プロファイルフィルタリングでは、1 つのバンドル MCP サーバーからのすべてのツールを
  `bundle-mcp` が所有する Plugin として扱うため、プロファイルの許可リストと拒否リストには、
  個別に公開されたツール名または `bundle-mcp` Plugin キーのどちらも含められる

#### 埋め込み OpenClaw 設定

- Claude `settings.json` は、バンドルが有効な場合にデフォルトの埋め込み OpenClaw 設定としてインポートされる
- OpenClaw は、適用前にシェル上書きキーをサニタイズする

サニタイズされるキー:

- `shellPath`
- `shellCommandPrefix`

#### 埋め込み OpenClaw LSP

- 有効な Claude バンドルは LSP サーバー設定を提供できる
- OpenClaw は `.lsp.json` と、マニフェストで宣言された任意の `lspServers` パスを読み込む
- バンドル LSP 設定は、有効な埋め込み OpenClaw LSP デフォルトにマージされる
- 現時点で実行可能なのは、サポート対象の stdio ベース LSP サーバーのみ。サポート対象外の
  トランスポートも `openclaw plugins inspect <id>` には表示される

### 検出されるが実行されないもの

これらは認識され診断に表示されますが、OpenClaw は実行しません。

- Claude `agents`、`hooks.json` 自動化、`outputStyles`
- Cursor `.cursor/agents`、`.cursor/hooks.json`、`.cursor/rules`
- 機能レポートを超える Codex インライン/アプリメタデータ

## バンドル形式

<AccordionGroup>
  <Accordion title="Codex バンドル">
    マーカー: `.codex-plugin/plugin.json`

    任意のコンテンツ: `skills/`、`hooks/`、`.mcp.json`、`.app.json`

    Codex バンドルは、Skills ルートと OpenClaw スタイルのフックパック
    ディレクトリ（`HOOK.md` + `handler.ts`）を使用すると OpenClaw に最もよく適合します。

  </Accordion>

  <Accordion title="Claude バンドル">
    2 つの検出モード:

    - **マニフェストベース:** `.claude-plugin/plugin.json`
    - **マニフェストなし:** デフォルトの Claude レイアウト（`skills/`、`commands/`、`agents/`、`hooks/`、`.mcp.json`、`.lsp.json`、`settings.json`）

    Claude 固有の動作:

    - `commands/` は Skills コンテンツとして扱われる
    - `settings.json` は埋め込み OpenClaw 設定にインポートされる（シェル上書きキーはサニタイズされる）
    - `.mcp.json` はサポート対象の stdio ツールを埋め込み OpenClaw に公開する
    - `.lsp.json` とマニフェストで宣言された `lspServers` パスは、埋め込み OpenClaw LSP デフォルトに読み込まれる
    - `hooks/hooks.json` は検出されるが実行されない
    - マニフェスト内のカスタムコンポーネントパスは加算的である（デフォルトを置き換えるのではなく拡張する）

  </Accordion>

  <Accordion title="Cursor バンドル">
    マーカー: `.cursor-plugin/plugin.json`

    任意のコンテンツ: `skills/`、`.cursor/commands/`、`.cursor/agents/`、`.cursor/rules/`、`.cursor/hooks.json`、`.mcp.json`

    - `.cursor/commands/` は Skills コンテンツとして扱われる
    - `.cursor/rules/`、`.cursor/agents/`、`.cursor/hooks.json` は検出のみ

  </Accordion>
</AccordionGroup>

## 検出の優先順位

OpenClaw は最初にネイティブ Plugin 形式を確認します。

1. `openclaw.plugin.json`、または `openclaw.extensions` を含む有効な `package.json` — **ネイティブ Plugin** として扱われる
2. バンドルマーカー（`.codex-plugin/`、`.claude-plugin/`、またはデフォルトの Claude/Cursor レイアウト）— **バンドル** として扱われる

ディレクトリに両方が含まれる場合、OpenClaw はネイティブ経路を使用します。これにより、
デュアル形式のパッケージがバンドルとして部分的にインストールされることを防ぎます。

## ランタイム依存関係とクリーンアップ

- サードパーティ互換バンドルには、起動時の `npm install` 修復は行われない。
  これらは `openclaw plugins install` を通じてインストールし、必要なものをすべて
  インストール済み Plugin ディレクトリに含めて出荷する必要がある。
- OpenClaw 所有のバンドル Plugin は、軽量な形でコアに同梱されるか、
  Plugin インストーラーを通じてダウンロード可能である。Gateway 起動時に、
  それらのためにパッケージマネージャーが実行されることはない。
- `openclaw doctor --fix` はレガシーのステージ済み依存関係ディレクトリを削除し、
  設定が参照しているにもかかわらずローカル Plugin インデックスに存在しない
  ダウンロード可能 Plugin を復旧できる。

## セキュリティ

バンドルは、ネイティブ Plugin よりも狭い信頼境界を持ちます。

- OpenClaw は任意のバンドルランタイムモジュールをインプロセスで読み込まない
- Skills とフックパックのパスは Plugin ルート内に留まる必要がある（境界チェック済み）
- 設定ファイルは同じ境界チェックで読み取られる
- サポート対象の stdio MCP サーバーはサブプロセスとして起動される場合がある

これにより、バンドルはデフォルトでより安全になりますが、サードパーティの
バンドルは、それらが公開する機能については信頼済みコンテンツとして扱う必要があります。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="バンドルは検出されるが機能が実行されない">
    `openclaw plugins inspect <id>` を実行してください。機能が一覧にあるが
    接続されていないと表示される場合、それは製品上の制限であり、壊れたインストールではありません。
  </Accordion>

  <Accordion title="Claude コマンドファイルが表示されない">
    バンドルが有効であり、Markdown ファイルが検出対象の
    `commands/` または `skills/` ルート内にあることを確認してください。
  </Accordion>

  <Accordion title="Claude 設定が適用されない">
    `settings.json` からの埋め込み OpenClaw 設定のみがサポートされています。OpenClaw は
    バンドル設定を生の設定パッチとして扱いません。
  </Accordion>

  <Accordion title="Claude フックが実行されない">
    `hooks/hooks.json` は検出のみです。実行可能なフックが必要な場合は、
    OpenClaw フックパックレイアウトを使用するか、ネイティブ Plugin として出荷してください。
  </Accordion>
</AccordionGroup>

## 関連

- [Plugin のインストールと設定](/ja-JP/tools/plugin)
- [Plugin の構築](/ja-JP/plugins/building-plugins) — ネイティブ Plugin を作成する
- [Plugin マニフェスト](/ja-JP/plugins/manifest) — ネイティブマニフェストスキーマ

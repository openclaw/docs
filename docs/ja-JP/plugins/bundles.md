---
read_when:
    - Codex、Claude、または Cursor 互換バンドルをインストールしたい
    - OpenClaw がバンドルコンテンツをネイティブ機能にどのようにマッピングするかを理解する必要があります
    - バンドル検出や不足している機能をデバッグする場合
summary: Codex、Claude、Cursor のバンドルを OpenClaw の Plugin としてインストールして使用する
title: Plugin バンドル
x-i18n:
    generated_at: "2026-04-30T05:24:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6d03643c3029f5c6c81fab3aa1c00accba94da64a834e381b29db8f405d6bdee
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw は、**Codex**、**Claude**、**Cursor** の 3 つの外部エコシステムから Plugin をインストールできます。これらは **バンドル** と呼ばれます。OpenClaw が Skills、フック、MCP ツールなどのネイティブ機能にマッピングするコンテンツとメタデータのパックです。

<Info>
  バンドルは、ネイティブ OpenClaw Plugin と**同じではありません**。ネイティブ Plugin は
  インプロセスで実行され、任意の機能を登録できます。バンドルは、選択的な機能マッピングと
  より狭い信頼境界を持つコンテンツパックです。
</Info>

## バンドルが存在する理由

多くの有用な Plugin は、Codex、Claude、または Cursor 形式で公開されています。作者にネイティブ OpenClaw Plugin として書き直すことを求める代わりに、OpenClaw はこれらの形式を検出し、サポートされるコンテンツをネイティブ機能セットにマッピングします。つまり、Claude コマンドパックや Codex Skill バンドルをインストールして、すぐに使えます。

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

  <Step title="再起動して使う">
    ```bash
    openclaw gateway restart
    ```

    マッピングされた機能（Skills、フック、MCP ツール、LSP デフォルト）は、次のセッションで利用できます。

  </Step>
</Steps>

## OpenClaw がバンドルからマッピングするもの

現在、すべてのバンドル機能が OpenClaw で実行されるわけではありません。動作するものと、検出はされるもののまだ接続されていないものを以下に示します。

### 現在サポート済み

| 機能          | マッピング方法                                                                                | 適用対象       |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Skill コンテンツ | バンドルの Skill ルートは通常の OpenClaw Skills として読み込まれる                           | すべての形式   |
| コマンド      | `commands/` と `.cursor/commands/` は Skill ルートとして扱われる                              | Claude、Cursor |
| フックパック  | OpenClaw 形式の `HOOK.md` + `handler.ts` レイアウト                                           | Codex          |
| MCP ツール    | バンドル MCP 設定は埋め込み Pi 設定にマージされ、サポートされる stdio および HTTP サーバーが読み込まれる | すべての形式   |
| LSP サーバー  | Claude `.lsp.json` とマニフェストで宣言された `lspServers` は、埋め込み Pi LSP デフォルトにマージされる | Claude         |
| 設定          | Claude `settings.json` は埋め込み Pi デフォルトとしてインポートされる                         | Claude         |

#### Skill コンテンツ

- バンドルの Skill ルートは通常の OpenClaw Skill ルートとして読み込まれる
- Claude `commands` ルートは追加の Skill ルートとして扱われる
- Cursor `.cursor/commands` ルートは追加の Skill ルートとして扱われる

つまり、Claude の Markdown コマンドファイルは通常の OpenClaw Skill ローダーを通じて動作します。Cursor のコマンド Markdown も同じ経路で動作します。

#### フックパック

- バンドルのフックルートは、通常の OpenClaw フックパックレイアウトを使う場合に**のみ**動作します。現在、これは主に Codex 互換のケースです。
  - `HOOK.md`
  - `handler.ts` または `handler.js`

#### Pi 向け MCP

- 有効化されたバンドルは MCP サーバー設定を提供できる
- OpenClaw はバンドル MCP 設定を有効な埋め込み Pi 設定に `mcpServers` としてマージする
- OpenClaw は、stdio サーバーを起動するか HTTP サーバーへ接続することで、埋め込み Pi エージェントターン中にサポートされるバンドル MCP ツールを公開する
- `coding` と `messaging` ツールプロファイルには、デフォルトでバンドル MCP ツールが含まれる。エージェントまたは Gateway で無効化するには `tools.deny: ["bundle-mcp"]` を使う
- プロジェクトローカルの Pi 設定はバンドルデフォルトの後にも適用されるため、必要に応じてワークスペース設定でバンドル MCP エントリを上書きできる
- バンドル MCP ツールカタログは登録前に決定論的にソートされるため、上流の `listTools()` の順序変更でプロンプトキャッシュのツールブロックが頻繁に変動することはない

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

- `transport` は `"streamable-http"` または `"sse"` に設定できる。省略された場合、OpenClaw は `sse` を使用する
- `type: "http"` は CLI ネイティブの下流形状です。OpenClaw 設定では `transport: "streamable-http"` を使用してください。`openclaw mcp set` と `openclaw doctor --fix` は一般的なエイリアスを正規化します。
- 許可される URL スキームは `http:` と `https:` のみ
- `headers` 値は `${ENV_VAR}` 補間をサポートする
- `command` と `url` の両方を持つサーバーエントリは拒否される
- URL 認証情報（userinfo とクエリパラメーター）は、ツール説明とログから秘匿される
- `connectionTimeoutMs` は、stdio と HTTP の両方のトランスポートについて、デフォルトの 30 秒接続タイムアウトを上書きする

##### ツール名

OpenClaw は、バンドル MCP ツールを `serverName__toolName` 形式のプロバイダー安全な名前で登録します。たとえば、`memory_search` ツールを公開する `"vigil-harbor"` というキーのサーバーは、`vigil-harbor__memory_search` として登録されます。

- `A-Za-z0-9_-` 以外の文字は `-` に置き換えられる
- サーバープレフィックスは 30 文字に制限される
- 完全なツール名は 64 文字に制限される
- 空のサーバー名は `mcp` にフォールバックする
- サニタイズ後に衝突する名前は、数値サフィックスで曖昧さを解消する
- 最終的に公開されるツール順序は安全な名前で決定論的になり、繰り返しの Pi ターンでキャッシュが安定する
- プロファイルフィルタリングは、1 つのバンドル MCP サーバーからのすべてのツールを `bundle-mcp` が所有する Plugin として扱うため、プロファイルの許可リストと拒否リストには、個別に公開されたツール名または `bundle-mcp` Plugin キーのどちらも含められる

#### 埋め込み Pi 設定

- Claude `settings.json` は、バンドルが有効な場合にデフォルトの埋め込み Pi 設定としてインポートされる
- OpenClaw は、シェル上書きキーを適用前にサニタイズする

サニタイズされるキー:

- `shellPath`
- `shellCommandPrefix`

#### 埋め込み Pi LSP

- 有効化された Claude バンドルは LSP サーバー設定を提供できる
- OpenClaw は `.lsp.json` と、マニフェストで宣言された任意の `lspServers` パスを読み込む
- バンドル LSP 設定は、有効な埋め込み Pi LSP デフォルトにマージされる
- 現在実行可能なのは、サポートされる stdio ベースの LSP サーバーのみです。サポートされないトランスポートも `openclaw plugins inspect <id>` には表示される

### 検出されるが実行されないもの

これらは認識され診断に表示されますが、OpenClaw は実行しません。

- Claude `agents`、`hooks.json` 自動化、`outputStyles`
- Cursor `.cursor/agents`、`.cursor/hooks.json`、`.cursor/rules`
- 機能レポート以外の Codex インライン/アプリメタデータ

## バンドル形式

<AccordionGroup>
  <Accordion title="Codex バンドル">
    マーカー: `.codex-plugin/plugin.json`

    任意コンテンツ: `skills/`、`hooks/`、`.mcp.json`、`.app.json`

    Codex バンドルは、Skill ルートと OpenClaw 形式のフックパックディレクトリ（`HOOK.md` + `handler.ts`）を使う場合に OpenClaw と最もよく適合します。

  </Accordion>

  <Accordion title="Claude バンドル">
    2 つの検出モード:

    - **マニフェストベース:** `.claude-plugin/plugin.json`
    - **マニフェストなし:** デフォルトの Claude レイアウト（`skills/`、`commands/`、`agents/`、`hooks/`、`.mcp.json`、`.lsp.json`、`settings.json`）

    Claude 固有の動作:

    - `commands/` は Skill コンテンツとして扱われる
    - `settings.json` は埋め込み Pi 設定にインポートされる（シェル上書きキーはサニタイズされる）
    - `.mcp.json` はサポートされる stdio ツールを埋め込み Pi に公開する
    - `.lsp.json` と、マニフェストで宣言された `lspServers` パスは、埋め込み Pi LSP デフォルトに読み込まれる
    - `hooks/hooks.json` は検出されるが実行されない
    - マニフェスト内のカスタムコンポーネントパスは追加的です（デフォルトを置き換えるのではなく拡張する）

  </Accordion>

  <Accordion title="Cursor バンドル">
    マーカー: `.cursor-plugin/plugin.json`

    任意コンテンツ: `skills/`、`.cursor/commands/`、`.cursor/agents/`、`.cursor/rules/`、`.cursor/hooks.json`、`.mcp.json`

    - `.cursor/commands/` は Skill コンテンツとして扱われる
    - `.cursor/rules/`、`.cursor/agents/`、`.cursor/hooks.json` は検出のみ

  </Accordion>
</AccordionGroup>

## 検出の優先順位

OpenClaw は、まずネイティブ Plugin 形式を確認します。

1. `openclaw.plugin.json`、または `openclaw.extensions` を持つ有効な `package.json` — **ネイティブ Plugin** として扱われる
2. バンドルマーカー（`.codex-plugin/`、`.claude-plugin/`、またはデフォルトの Claude/Cursor レイアウト）— **バンドル** として扱われる

ディレクトリに両方が含まれる場合、OpenClaw はネイティブ経路を使用します。これにより、デュアル形式のパッケージがバンドルとして部分的にインストールされるのを防ぎます。

## ランタイム依存関係とクリーンアップ

- サードパーティ互換バンドルには、起動時の `npm install` 修復は提供されません。これらは `openclaw plugins install` でインストールし、必要なものをすべてインストール済み Plugin ディレクトリに同梱する必要があります。
- OpenClaw 所有のパッケージ済みバンドル Plugin には、狭い例外があります。これが有効化されている場合、Gateway 起動時に、インポート前に不足している宣言済みランタイム依存関係を修復できます。運用者は `openclaw plugins deps` でその段階を検査または修復できます。
- リリースパイプラインは、可能な場合に完全なバンドル済み依存関係ペイロードを出荷する責任を引き続き持ちます（[リリース](/ja-JP/reference/RELEASING) の postpublish 検証ルールを参照）。

## セキュリティ

バンドルの信頼境界はネイティブ Plugin より狭くなります。

- OpenClaw は任意のバンドルランタイムモジュールをインプロセスで読み込まない
- Skills とフックパックのパスは Plugin ルート内に留まる必要がある（境界チェック済み）
- 設定ファイルは同じ境界チェックで読み取られる
- サポートされる stdio MCP サーバーはサブプロセスとして起動される場合がある

これにより、バンドルはデフォルトでより安全になりますが、サードパーティバンドルは、それらが公開する機能について信頼済みコンテンツとして扱う必要があります。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="バンドルは検出されるが機能が実行されない">
    `openclaw plugins inspect <id>` を実行してください。機能が一覧にあるものの、接続されていないと表示される場合、それは製品上の制限であり、インストールの失敗ではありません。
  </Accordion>

  <Accordion title="Claude コマンドファイルが表示されない">
    バンドルが有効化されていて、Markdown ファイルが検出済みの `commands/` または `skills/` ルート内にあることを確認してください。
  </Accordion>

  <Accordion title="Claude 設定が適用されない">
    `settings.json` からの埋め込み Pi 設定のみがサポートされます。OpenClaw はバンドル設定を生の設定パッチとして扱いません。
  </Accordion>

  <Accordion title="Claude フックが実行されない">
    `hooks/hooks.json` は検出のみです。実行可能なフックが必要な場合は、OpenClaw フックパックレイアウトを使うか、ネイティブ Plugin を出荷してください。
  </Accordion>
</AccordionGroup>

## 関連項目

- [Plugin のインストールと設定](/ja-JP/tools/plugin)
- [Plugin の構築](/ja-JP/plugins/building-plugins) — ネイティブ Plugin を作成する
- [Plugin マニフェスト](/ja-JP/plugins/manifest) — ネイティブマニフェストスキーマ

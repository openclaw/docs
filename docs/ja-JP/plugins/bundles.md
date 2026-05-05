---
read_when:
    - Codex、Claude、またはCursor互換のバンドルをインストールしたい場合
    - OpenClaw がバンドルコンテンツをネイティブ機能にどのようにマッピングするかを理解する必要があります
    - バンドル検出または不足している機能をデバッグしている
summary: Codex、Claude、Cursor のバンドルを OpenClaw Plugin としてインストールして使用する
title: Plugin バンドル
x-i18n:
    generated_at: "2026-05-05T01:47:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bc06300e765e2faaf51800462003e242d29d4102ac9feaa47f86d4ad35bf157
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClawは、3つの外部エコシステム（**Codex**、**Claude**、
**Cursor**）からPluginをインストールできます。これらは**バンドル**と呼ばれます。つまり、
OpenClawがSkills、フック、MCPツールのようなネイティブ機能へマッピングするコンテンツとメタデータのパックです。

<Info>
  バンドルは、ネイティブOpenClaw Pluginと**同じではありません**。ネイティブPluginは
  インプロセスで実行され、任意の機能を登録できます。バンドルはコンテンツパックであり、
  選択的な機能マッピングと、より狭い信頼境界を持ちます。
</Info>

## バンドルが存在する理由

多くの有用なPluginは、Codex、Claude、またはCursor形式で公開されています。作者に
ネイティブOpenClaw Pluginとして書き直すことを求める代わりに、OpenClawは
これらの形式を検出し、対応するコンテンツをネイティブ機能セットへマッピングします。
つまり、ClaudeコマンドパックやCodex skillバンドルをインストールして、
すぐに使えます。

## バンドルをインストールする

<Steps>
  <Step title="ディレクトリ、アーカイブ、またはマーケットプレイスからインストールする">
    ```bash
    # ローカルディレクトリ
    openclaw plugins install ./my-bundle

    # アーカイブ
    openclaw plugins install ./my-bundle.tgz

    # Claudeマーケットプレイス
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="検出を確認する">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    バンドルは、`codex`、`claude`、または`cursor`のサブタイプを持つ`Format: bundle`として表示されます。

  </Step>

  <Step title="再起動して使用する">
    ```bash
    openclaw gateway restart
    ```

    マッピングされた機能（Skills、フック、MCPツール、LSPデフォルト）は次のセッションで利用できます。

  </Step>
</Steps>

## OpenClawがバンドルからマッピングするもの

現在のOpenClawでは、すべてのバンドル機能が実行されるわけではありません。以下は、
動作するものと、検出されるもののまだ接続されていないものです。

### 現在対応済み

| 機能          | マッピング方法                                                                                | 対象           |
| ------------- | --------------------------------------------------------------------------------------------- | -------------- |
| Skillコンテンツ | バンドルのskillルートは通常のOpenClaw Skillsとして読み込まれます                              | すべての形式   |
| コマンド      | `commands/`と`.cursor/commands/`はskillルートとして扱われます                                  | Claude、Cursor |
| フックパック  | OpenClawスタイルの`HOOK.md` + `handler.ts`レイアウト                                           | Codex          |
| MCPツール     | バンドルMCP設定は埋め込みPi設定へマージされ、対応するstdioおよびHTTPサーバーが読み込まれます | すべての形式   |
| LSPサーバー   | Claudeの`.lsp.json`とマニフェスト宣言の`lspServers`は埋め込みPi LSPデフォルトへマージされます | Claude         |
| 設定          | Claudeの`settings.json`は埋め込みPiデフォルトとしてインポートされます                         | Claude         |

#### Skillコンテンツ

- バンドルのskillルートは通常のOpenClaw skillルートとして読み込まれます
- Claudeの`commands`ルートは追加のskillルートとして扱われます
- Cursorの`.cursor/commands`ルートは追加のskillルートとして扱われます

つまり、ClaudeのMarkdownコマンドファイルは通常のOpenClaw skill
ローダーを通じて動作します。CursorコマンドMarkdownも同じ経路で動作します。

#### フックパック

- バンドルのフックルートは、通常のOpenClawフックパック
  レイアウトを使用する場合に**のみ**動作します。現在、これは主にCodex互換のケースです。
  - `HOOK.md`
  - `handler.ts`または`handler.js`

#### Pi向けMCP

- 有効なバンドルはMCPサーバー設定を提供できます
- OpenClawは、バンドルMCP設定を有効な埋め込みPi設定に
  `mcpServers`としてマージします
- OpenClawは、stdioサーバーを起動するかHTTPサーバーへ接続することで、
  埋め込みPiエージェントターン中に対応するバンドルMCPツールを公開します
- `coding`および`messaging`ツールプロファイルには、デフォルトでバンドルMCPツールが含まれます。
  エージェントまたはGatewayでオプトアウトするには`tools.deny: ["bundle-mcp"]`を使用します
- プロジェクトローカルのPi設定はバンドルデフォルトの後にも適用されるため、
  必要に応じてワークスペース設定でバンドルMCPエントリを上書きできます
- バンドルMCPツールカタログは登録前に決定的にソートされるため、
  上流の`listTools()`の順序変更によってプロンプトキャッシュのツールブロックが頻繁に変化することはありません

##### トランスポート

MCPサーバーはstdioまたはHTTPトランスポートを使用できます。

**Stdio**は子プロセスを起動します。

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

**HTTP**は、デフォルトでは`sse`で、要求された場合は`streamable-http`で実行中のMCPサーバーへ接続します。

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

- `transport`は`"streamable-http"`または`"sse"`に設定できます。省略した場合、OpenClawは`sse`を使用します
- `type: "http"`はCLIネイティブの下流形状です。OpenClaw設定では`transport: "streamable-http"`を使用します。`openclaw mcp set`と`openclaw doctor --fix`は一般的な別名を正規化します。
- 許可されるURLスキームは`http:`と`https:`のみです
- `headers`の値は`${ENV_VAR}`補間に対応します
- `command`と`url`の両方を持つサーバーエントリは拒否されます
- URL認証情報（userinfoとクエリパラメーター）は、ツール
  説明とログから秘匿されます
- `connectionTimeoutMs`は、stdioとHTTPの両方のトランスポートについて、
  デフォルトの30秒接続タイムアウトを上書きします

##### ツール命名

OpenClawは、`serverName__toolName`形式のプロバイダー安全な名前でバンドルMCPツールを登録します。
たとえば、`memory_search`ツールを公開する`"vigil-harbor"`キーのサーバーは、
`vigil-harbor__memory_search`として登録されます。

- `A-Za-z0-9_-`以外の文字は`-`に置き換えられます
- サーバープレフィックスは30文字に制限されます
- 完全なツール名は64文字に制限されます
- 空のサーバー名は`mcp`にフォールバックします
- サニタイズ後に衝突する名前は、数値サフィックスで曖昧さを解消します
- 最終的に公開されるツール順序は安全な名前によって決定的になり、繰り返しのPi
  ターンでキャッシュが安定します
- プロファイルフィルタリングは、1つのバンドルMCPサーバーからのすべてのツールを
  `bundle-mcp`が所有するPluginとして扱うため、プロファイルの許可リストと拒否リストには、
  個別の公開ツール名または`bundle-mcp`Pluginキーのいずれかを含められます

#### 埋め込みPi設定

- Claudeの`settings.json`は、バンドルが有効な場合にデフォルトの埋め込みPi設定としてインポートされます
- OpenClawは、シェル上書きキーを適用前にサニタイズします

サニタイズされるキー:

- `shellPath`
- `shellCommandPrefix`

#### 埋め込みPi LSP

- 有効なClaudeバンドルはLSPサーバー設定を提供できます
- OpenClawは`.lsp.json`に加え、マニフェスト宣言の`lspServers`パスを読み込みます
- バンドルLSP設定は、有効な埋め込みPi LSPデフォルトへマージされます
- 現在実行可能なのは、対応済みのstdioバックエンドLSPサーバーのみです。非対応の
  トランスポートも`openclaw plugins inspect <id>`には表示されます

### 検出されるが実行されないもの

これらは認識され診断に表示されますが、OpenClawは実行しません。

- Claudeの`agents`、`hooks.json`自動化、`outputStyles`
- Cursorの`.cursor/agents`、`.cursor/hooks.json`、`.cursor/rules`
- 機能レポートを超えるCodexインライン/アプリメタデータ

## バンドル形式

<AccordionGroup>
  <Accordion title="Codexバンドル">
    マーカー: `.codex-plugin/plugin.json`

    任意のコンテンツ: `skills/`、`hooks/`、`.mcp.json`、`.app.json`

    Codexバンドルは、skillルートとOpenClawスタイルの
    フックパックディレクトリ（`HOOK.md` + `handler.ts`）を使用すると、OpenClawに最もよく適合します。

  </Accordion>

  <Accordion title="Claudeバンドル">
    2つの検出モード:

    - **マニフェストベース:** `.claude-plugin/plugin.json`
    - **マニフェストなし:** デフォルトのClaudeレイアウト（`skills/`、`commands/`、`agents/`、`hooks/`、`.mcp.json`、`.lsp.json`、`settings.json`）

    Claude固有の動作:

    - `commands/`はskillコンテンツとして扱われます
    - `settings.json`は埋め込みPi設定へインポートされます（シェル上書きキーはサニタイズされます）
    - `.mcp.json`は、対応するstdioツールを埋め込みPiに公開します
    - `.lsp.json`とマニフェスト宣言の`lspServers`パスは、埋め込みPi LSPデフォルトへ読み込まれます
    - `hooks/hooks.json`は検出されますが実行されません
    - マニフェスト内のカスタムコンポーネントパスは加算的です（デフォルトを置き換えるのではなく拡張します）

  </Accordion>

  <Accordion title="Cursorバンドル">
    マーカー: `.cursor-plugin/plugin.json`

    任意のコンテンツ: `skills/`、`.cursor/commands/`、`.cursor/agents/`、`.cursor/rules/`、`.cursor/hooks.json`、`.mcp.json`

    - `.cursor/commands/`はskillコンテンツとして扱われます
    - `.cursor/rules/`、`.cursor/agents/`、`.cursor/hooks.json`は検出のみです

  </Accordion>
</AccordionGroup>

## 検出の優先順位

OpenClawは最初にネイティブPlugin形式を確認します。

1. `openclaw.plugin.json`、または`openclaw.extensions`を持つ有効な`package.json` — **ネイティブPlugin**として扱われます
2. バンドルマーカー（`.codex-plugin/`、`.claude-plugin/`、またはデフォルトのClaude/Cursorレイアウト） — **バンドル**として扱われます

ディレクトリに両方が含まれる場合、OpenClawはネイティブ経路を使用します。これにより、
デュアル形式パッケージがバンドルとして部分的にインストールされることを防ぎます。

## ランタイム依存関係とクリーンアップ

- サードパーティ互換バンドルでは、起動時の`npm install`修復は行われません。それらは
  `openclaw plugins install`を通じてインストールされ、必要なものをすべて
  インストール済みPluginディレクトリ内に同梱している必要があります。
- OpenClaw所有の同梱Pluginは、core内で軽量に同梱されるか、
  Pluginインストーラーを通じてダウンロード可能です。Gateway起動時に、それらのために
  パッケージマネージャーが実行されることはありません。
- `openclaw doctor --fix`は、レガシーのステージング済み依存関係ディレクトリを削除し、
  設定が参照しているにもかかわらずローカルPluginインデックスに存在しないダウンロード可能Pluginを
  復旧できます。

## セキュリティ

バンドルは、ネイティブPluginよりも狭い信頼境界を持ちます。

- OpenClawは任意のバンドルランタイムモジュールをインプロセスで読み込みません
- SkillsとフックパックのパスはPluginルート内に留まる必要があります（境界チェック済み）
- 設定ファイルは同じ境界チェックで読み込まれます
- 対応するstdio MCPサーバーはサブプロセスとして起動される場合があります

これにより、バンドルはデフォルトでより安全になりますが、それでもサードパーティ
バンドルは、公開する機能について信頼済みコンテンツとして扱う必要があります。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="バンドルは検出されるが機能が実行されない">
    `openclaw plugins inspect <id>`を実行します。機能が一覧表示されているものの
    未接続としてマークされている場合、それは製品上の制限であり、インストールの破損ではありません。
  </Accordion>

  <Accordion title="Claudeコマンドファイルが表示されない">
    バンドルが有効であり、Markdownファイルが検出済みの
    `commands/`または`skills/`ルート内にあることを確認してください。
  </Accordion>

  <Accordion title="Claude設定が適用されない">
    `settings.json`からの埋め込みPi設定のみが対応対象です。OpenClawは
    バンドル設定を生の設定パッチとして扱いません。
  </Accordion>

  <Accordion title="Claudeフックが実行されない">
    `hooks/hooks.json`は検出のみです。実行可能なフックが必要な場合は、
    OpenClawフックパックレイアウトを使用するか、ネイティブPluginを提供してください。
  </Accordion>
</AccordionGroup>

## 関連

- [Pluginのインストールと設定](/ja-JP/tools/plugin)
- [Pluginの構築](/ja-JP/plugins/building-plugins) — ネイティブPluginを作成する
- [Pluginマニフェスト](/ja-JP/plugins/manifest) — ネイティブマニフェストスキーマ

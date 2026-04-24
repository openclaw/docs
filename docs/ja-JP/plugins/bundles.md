---
read_when:
    - Codex、Claude、または Cursor 互換バンドルをインストールしたい場合
    - OpenClaw がバンドル内容をどのようにネイティブ機能へマッピングするかを理解したい場合
    - バンドル検出や不足している機能をデバッグしている場合
summary: Codex、Claude、Cursor バンドルを OpenClaw Plugin としてインストールして使う
title: Plugin バンドル
x-i18n:
    generated_at: "2026-04-24T05:09:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: a455eaa64b227204ca4e2a6283644edb72d7a4cfad0f2fcf4439d061dcb374bc
    source_path: plugins/bundles.md
    workflow: 15
---

OpenClaw は、3 つの外部エコシステム **Codex**、**Claude**、
**Cursor** から Plugin をインストールできます。これらは **bundle** と呼ばれます。bundle は、
OpenClaw が skills、hooks、MCP ツールのようなネイティブ機能へマッピングする
コンテンツとメタデータのパックです。

<Info>
  bundle はネイティブ OpenClaw Plugin と同じではありません。ネイティブ Plugin は
  in-process で動作し、任意の機能を登録できます。bundle はコンテンツパックであり、
  機能マッピングは選択的で、信頼境界もより狭くなります。
</Info>

## なぜ bundle が存在するのか

有用な Plugin の多くは Codex、Claude、または Cursor 形式で公開されています。著者に
ネイティブ OpenClaw Plugin への書き換えを求める代わりに、OpenClaw は
これらの形式を検出し、サポートされるコンテンツをネイティブ機能セットへマッピングします。これにより、
Claude コマンドパックや Codex skill bundle をインストールして、すぐに使えるようになります。

## bundle をインストールする

<Steps>
  <Step title="ディレクトリ、アーカイブ、または marketplace からインストール">
    ```bash
    # ローカルディレクトリ
    openclaw plugins install ./my-bundle

    # アーカイブ
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="検出を確認">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    bundle は `Format: bundle` として表示され、サブタイプは `codex`、`claude`、または `cursor` になります。

  </Step>

  <Step title="再起動して使用">
    ```bash
    openclaw gateway restart
    ```

    マッピングされた機能（skills、hooks、MCP tools、LSP defaults）は、次のセッションで利用可能になります。

  </Step>
</Steps>

## OpenClaw が bundle からマッピングするもの

現在 OpenClaw で実行される bundle 機能はすべてではありません。ここでは、
何が動作し、何が検出されるが未配線かを示します。

### 現在サポートされるもの

| 機能            | マッピング方法                                                                               | 適用対象       |
| --------------- | -------------------------------------------------------------------------------------------- | -------------- |
| Skill content   | bundle の skill ルートが通常の OpenClaw Skills として読み込まれる                             | すべての形式   |
| Commands        | `commands/` と `.cursor/commands/` を skill ルートとして扱う                                  | Claude, Cursor |
| Hook packs      | OpenClaw 形式の `HOOK.md` + `handler.ts` レイアウト                                          | Codex          |
| MCP tools       | bundle MCP 設定を埋め込み Pi 設定へマージし、サポートされる stdio / HTTP サーバーを読み込む | すべての形式   |
| LSP servers     | Claude の `.lsp.json` と manifest 宣言 `lspServers` を埋め込み Pi の LSP defaults にマージ  | Claude         |
| Settings        | Claude の `settings.json` を埋め込み Pi defaults としてインポート                            | Claude         |

#### Skill content

- bundle の skill ルートは通常の OpenClaw skill ルートとして読み込まれます
- Claude の `commands` ルートは追加の skill ルートとして扱われます
- Cursor の `.cursor/commands` ルートは追加の skill ルートとして扱われます

つまり、Claude の markdown コマンドファイルは通常の OpenClaw skill
loader 経由で動作します。Cursor の command markdown も同じ経路で動作します。

#### Hook packs

- bundle の hook ルートが動作するのは、通常の OpenClaw hook-pack
  レイアウトを使っている場合のみです。現在これは主に Codex 互換ケースです:
  - `HOOK.md`
  - `handler.ts` または `handler.js`

#### Pi 向け MCP

- 有効化された bundle は MCP サーバー設定を提供できます
- OpenClaw は bundle の MCP 設定を有効な埋め込み Pi 設定へ
  `mcpServers` としてマージします
- OpenClaw は、埋め込み Pi エージェントターン中に、サポートされる bundle MCP tools を
  stdio サーバーの起動または HTTP サーバーへの接続によって公開します
- `coding` と `messaging` のツールプロファイルには、デフォルトで bundle MCP tools が含まれます。エージェントまたは gateway で無効にするには `tools.deny: ["bundle-mcp"]` を使ってください
- プロジェクトローカル Pi 設定は bundle defaults の後にも引き続き適用されるため、
  必要に応じて workspace 設定で bundle MCP エントリを上書きできます
- bundle MCP ツールカタログは登録前に決定論的にソートされるため、
  上流 `listTools()` 順序の変化で prompt-cache ツールブロックが揺れません

##### トランスポート

MCP サーバーは stdio または HTTP トランスポートを使えます:

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

**HTTP** は、デフォルトでは `sse`、要求された場合は `streamable-http` で、実行中の MCP サーバーへ接続します:

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

- `transport` は `"streamable-http"` または `"sse"` に設定できます。省略時は OpenClaw は `sse` を使います
- 許可される URL スキームは `http:` と `https:` のみです
- `headers` 値は `${ENV_VAR}` 展開をサポートします
- `command` と `url` の両方を持つサーバーエントリは拒否されます
- URL 認証情報（userinfo と query params）はツール
  説明およびログから秘匿化されます
- `connectionTimeoutMs` は、
  stdio と HTTP の両トランスポートに対して、デフォルト 30 秒の接続タイムアウトを上書きします

##### ツール命名

OpenClaw は bundle MCP tools を、プロバイダ安全な名前
`serverName__toolName` 形式で登録します。たとえば、`"vigil-harbor"` というキーのサーバーが
`memory_search` ツールを公開している場合、`vigil-harbor__memory_search` として登録されます。

- `A-Za-z0-9_-` 以外の文字は `-` に置き換えられます
- サーバー接頭辞は 30 文字までに制限されます
- ツール名全体は 64 文字までに制限されます
- 空のサーバー名は `mcp` にフォールバックします
- 衝突する sanitize 後の名前は数値サフィックスで区別されます
- 最終的に公開されるツール順序は safe name によって決定論的に決まり、Pi の繰り返し
  ターンでキャッシュ安定性を維持します
- プロファイルフィルタでは、1 つの bundle MCP サーバー由来のすべてのツールを
  `bundle-mcp` 所有として扱います。そのため、プロファイルの allowlist / deny list には、
  個別の公開ツール名または `bundle-mcp` Plugin キーのどちらも含められます

#### 埋め込み Pi settings

- Claude の `settings.json` は、その
  bundle が有効な場合にデフォルトの埋め込み Pi settings としてインポートされます
- OpenClaw は適用前に shell override キーを sanitize します

sanitize されるキー:

- `shellPath`
- `shellCommandPrefix`

#### 埋め込み Pi LSP

- 有効な Claude bundle は LSP サーバー設定を提供できます
- OpenClaw は `.lsp.json` と manifest で宣言された `lspServers` パスを読み込みます
- bundle LSP 設定は、有効な埋め込み Pi LSP defaults にマージされます
- 現在実行可能なのは、サポートされる stdio バックエンドの LSP サーバーのみです。未サポートの
  トランスポートも `openclaw plugins inspect <id>` には表示されます

### 検出されるが実行されないもの

次のものは認識されて診断に表示されますが、OpenClaw は実行しません:

- Claude の `agents`, `hooks.json` 自動化, `outputStyles`
- Cursor の `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- 機能報告を超える Codex の inline / app メタデータ

## bundle 形式

<AccordionGroup>
  <Accordion title="Codex bundle">
    マーカー: `.codex-plugin/plugin.json`

    任意コンテンツ: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Codex bundle は、skill ルートと OpenClaw 形式の
    hook-pack ディレクトリ（`HOOK.md` + `handler.ts`）を使うと、OpenClaw に最も適合します。

  </Accordion>

  <Accordion title="Claude bundle">
    検出モードは 2 つあります:

    - **Manifest ベース:** `.claude-plugin/plugin.json`
    - **Manifest なし:** デフォルト Claude レイアウト（`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`）

    Claude 固有の動作:

    - `commands/` は skill content として扱われます
    - `settings.json` は埋め込み Pi settings にインポートされます（shell override キーは sanitize されます）
    - `.mcp.json` はサポートされる stdio tools を埋め込み Pi に公開します
    - `.lsp.json` と manifest 宣言の `lspServers` パスは埋め込み Pi LSP defaults に読み込まれます
    - `hooks/hooks.json` は検出されますが実行されません
    - manifest 内のカスタム component パスは加算的です（デフォルトを置き換えるのではなく拡張します）

  </Accordion>

  <Accordion title="Cursor bundle">
    マーカー: `.cursor-plugin/plugin.json`

    任意コンテンツ: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` は skill content として扱われます
    - `.cursor/rules/`, `.cursor/agents/`, `.cursor/hooks.json` は検出のみです

  </Accordion>
</AccordionGroup>

## 検出の優先順位

OpenClaw はまずネイティブ Plugin 形式を確認します:

1. `openclaw.plugin.json` または `openclaw.extensions` を持つ有効な `package.json` — **ネイティブ Plugin** として扱う
2. bundle マーカー（`.codex-plugin/`, `.claude-plugin/`, またはデフォルト Claude / Cursor レイアウト）— **bundle** として扱う

ディレクトリが両方を含む場合、OpenClaw はネイティブ経路を使います。これにより、
二重形式パッケージが部分的に bundle としてインストールされることを防ぎます。

## ランタイム依存関係とクリーンアップ

- 同梱 Plugin のランタイム依存関係は OpenClaw パッケージ内の
  `dist/*` に含まれます。OpenClaw は同梱
  Plugin に対して起動時に `npm install` を実行しません。完全な同梱依存関係ペイロードを
  リリースパイプラインが含める責任を持ちます（
  [Releasing](/ja-JP/reference/RELEASING) の postpublish 検証ルールを参照）。

## セキュリティ

bundle はネイティブ Plugin よりも狭い信頼境界を持ちます:

- OpenClaw は任意の bundle ランタイムモジュールを in-process で読み込みません
- Skills と hook-pack のパスは Plugin ルート内に留まる必要があります（境界チェックあり）
- Settings ファイルも同じ境界チェックで読み取られます
- サポートされる stdio MCP サーバーは子プロセスとして起動されることがあります

これにより、bundle はデフォルトでより安全になりますが、それでも第三者 bundle は、
公開される機能に関しては信頼済みコンテンツとして扱うべきです。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="bundle は検出されるが機能が動かない">
    `openclaw plugins inspect <id>` を実行してください。機能が一覧にありながら
    未配線とマークされている場合、それはプロダクト上の制限であって、インストール不良ではありません。
  </Accordion>

  <Accordion title="Claude command ファイルが表示されない">
    bundle が有効であり、markdown ファイルが検出される
    `commands/` または `skills/` ルート内にあることを確認してください。
  </Accordion>

  <Accordion title="Claude settings が適用されない">
    サポートされるのは `settings.json` からの埋め込み Pi settings のみです。OpenClaw は
    bundle settings を生の config patch としては扱いません。
  </Accordion>

  <Accordion title="Claude hooks が実行されない">
    `hooks/hooks.json` は検出専用です。実行可能な hooks が必要なら、
    OpenClaw hook-pack レイアウトを使うか、ネイティブ Plugin として提供してください。
  </Accordion>
</AccordionGroup>

## 関連

- [Install and Configure Plugins](/ja-JP/tools/plugin)
- [Building Plugins](/ja-JP/plugins/building-plugins) — ネイティブ Plugin を作成する
- [Plugin Manifest](/ja-JP/plugins/manifest) — ネイティブ manifest schema

---
read_when:
    - エージェントにコードやMarkdownの編集をdiffとして表示させたい
    - キャンバス対応のビューアーURLまたはレンダリング済みdiffファイルが必要です
    - 制御された一時的な差分アーティファクトを、安全なデフォルトで用意する必要があります
sidebarTitle: Diffs
summary: エージェント向けの読み取り専用diffビューアーおよびファイルレンダラー（任意のPluginツール）
title: 差分
x-i18n:
    generated_at: "2026-07-05T11:53:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a141f52de686717e7e67a50c2ce7cc83a16a17a9ff9faf7aaedaca1c433987a9
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` は、before/afterテキストまたは統一パッチを読み取り専用のdiffアーティファクトに変換する、任意のバンドル済みPluginツールです。また、短いエージェント向けガイダンスをシステムプロンプトに前置し、より詳しい手順のための付属Skillも同梱します。

入力: `before` + `after` テキスト、または統一 `patch`（相互排他）。

出力: キャンバス表示用のGatewayビューアURL、メッセージ配信用のレンダリング済みPNG/PDFファイルパス、またはその両方。

## クイックスタート

<Steps>
  <Step title="Pluginをインストールする">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="Pluginを有効にする">
    ```json5
    {
      plugins: {
        entries: {
          diffs: {
            enabled: true,
          },
        },
      },
    }
    ```
  </Step>
  <Step title="モードを選ぶ">
    <Tabs>
      <Tab title="view">
        キャンバス優先のフロー: エージェントは `mode: "view"` で `diffs` を呼び出し、`canvas present` で `details.viewerUrl` を開きます。
      </Tab>
      <Tab title="file">
        チャットでのファイル配信: エージェントは `mode: "file"` で `diffs` を呼び出し、`path` または `filePath` を使って `message` で `details.filePath` を送信します。
      </Tab>
      <Tab title="both">
        組み合わせ（デフォルト）: エージェントは `mode: "both"` で `diffs` を呼び出し、1回の呼び出しで両方のアーティファクトを取得します。
      </Tab>
    </Tabs>
  </Step>
</Steps>

## 組み込みのシステムガイダンスを無効にする

ツールは保持しつつ、前置されるシステムプロンプトのガイダンスを削除するには、`plugins.entries.diffs.hooks.allowPromptInjection` を `false` に設定します。

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
      },
    },
  },
}
```

これにより、ツールとSkillを利用可能なまま、Pluginの `before_prompt_build` フックがブロックされます。ガイダンスとツールの両方を無効にするには、代わりにPluginを無効にします。

## ツール入力リファレンス

明記されていない限り、すべてのフィールドは任意です。

<ParamField path="before" type="string">
  元のテキスト。`patch` が省略されている場合、`after` と一緒に必須です。
</ParamField>
<ParamField path="after" type="string">
  更新後のテキスト。`patch` が省略されている場合、`before` と一緒に必須です。
</ParamField>
<ParamField path="patch" type="string">
  統一diffテキスト。`before` および `after` と相互排他です。
</ParamField>
<ParamField path="path" type="string">
  before/afterモードで表示するファイル名。
</ParamField>
<ParamField path="lang" type="string">
  before/afterモード用の言語上書きヒント。不明な値やデフォルトのビューアセット外の言語は、
  Diff Viewer Language Pack Pluginがインストールされていない限り、プレーンテキストにフォールバックします。
</ParamField>
<ParamField path="title" type="string">
  ビューアタイトルの上書き。
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  出力モード。Pluginデフォルト `defaults.mode`（`both`）がデフォルトです。非推奨のエイリアス: `"image"` は `"file"` と同じように動作します。
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  ビューアテーマ。Pluginデフォルト `defaults.theme` がデフォルトです。
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  diffレイアウト。Pluginデフォルト `defaults.layout` がデフォルトです。
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  完全なコンテキストが利用可能な場合、変更されていないセクションを展開します。呼び出しごとのオプションのみです（Pluginデフォルトキーではありません）。
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  レンダリング済みファイル形式。Pluginデフォルト `defaults.fileFormat` がデフォルトです。
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  PNG/PDFレンダリング用の品質プリセット。
</ParamField>
<ParamField path="fileScale" type="number">
  デバイススケールの上書き（`1`-`4`）。
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  CSSピクセルでの最大レンダリング幅（`640`-`2400`）。
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  ビューアおよびスタンドアロンファイル出力のアーティファクトTTL（秒）。最大 `21600`。
</ParamField>
<ParamField path="baseUrl" type="string">
  ビューアURLオリジンの上書き。Pluginの `viewerBaseUrl` を上書きします。`http` または `https` である必要があり、クエリ/ハッシュは使用できません。
</ParamField>

<AccordionGroup>
  <Accordion title="レガシー入力エイリアス">
    後方互換性のため、引き続き受け付けられます。

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="検証と制限">
    - `before`/`after`: それぞれ最大512 KiB。
    - `patch`: 最大2 MiB。
    - `path`: 最大2048バイト。
    - `lang`: 最大128バイト。
    - `title`: 最大1024バイト。
    - パッチ複雑度の上限: 最大128ファイル、合計120000行。
    - `patch` と `before`/`after` の併用は拒否されます。
    - レンダリング済みファイルの安全制限（PNGおよびPDF）:
      - `fileQuality: "standard"`: 最大8 MP（8,000,000レンダリングピクセル）。
      - `fileQuality: "hq"`: 最大14 MP。
      - `fileQuality: "print"`: 最大24 MP。
      - PDFはさらに50ページに制限されます。

  </Accordion>
</AccordionGroup>

## 構文ハイライト

組み込み言語:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml`, and `toml`.

一般的なエイリアス（`js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt`, `ps1` など）は、これらの言語に正規化されます。

より多くの言語（Astro、Vue、Svelte、MDX、GraphQL、Terraform/HCL、Nix、Clojure、Elixir、Haskell、OCaml、Scala、Zig、Solidity、Verilog/VHDL、Fortran、MATLAB、LaTeX、Mermaid、Sass/Less/SCSS、Nginx、Apache、CSV、dotenv、INI、diff など）を利用するには、Diff Viewer Language Pack Pluginをインストールします。

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

パックがなくても、未対応の言語は読みやすいプレーンテキストとしてレンダリングされます。アップストリームのカタログについては、[Diffs Language Pack Plugin](/ja-JP/plugins/reference/diffs-language-pack) と [Shiki languages](https://shiki.style/languages) を参照してください。

## 出力詳細コントラクト

<AccordionGroup>
  <Accordion title="ビューアフィールド（viewおよびbothモード）">
    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context`（利用可能な場合は `agentId`, `sessionId`, `messageChannel`, `agentAccountId`）

  </Accordion>
  <Accordion title="ファイルフィールド（fileおよびbothモード）">
    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path`（メッセージツール互換性のため、`filePath` と同じ値）
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="互換性エイリアス（常に返されます）">
    - `format`（= `fileFormat`）
    - `imagePath`（= `filePath`）
    - `imageBytes`（= `fileBytes`）
    - `imageQuality`（= `fileQuality`）
    - `imageScale`（= `fileScale`）
    - `imageMaxWidth`（= `fileMaxWidth`）

  </Accordion>
</AccordionGroup>

| モード     | 戻り値                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| `"view"` | ビューアーフィールドのみ。                                                                                          |
| `"file"` | ファイルフィールドのみ。ビューアーアーティファクトはなし。                                                                        |
| `"both"` | ビューアーフィールドに加えてファイルフィールド。ファイルレンダリングに失敗した場合でも、ビューアーは `fileError`/`imageError` 付きで返ります。 |

### 変更されていないセクションの折りたたみ

ビューアーは `N unmodified lines` のような行を表示します。展開コントロールは、レンダリングされた diff に展開可能なコンテキストデータがある場合（before/after 入力で一般的）にのみ表示されます。多くの unified patch は hunk 内のコンテキスト本文を省略するため、展開コントロールなしで行が表示されることがあります。これは想定どおりであり、バグではありません。`expandUnchanged` は展開可能なコンテキストが存在する場合にのみ適用されます。

## Plugin のデフォルト

Plugin 全体のデフォルトを `~/.openclaw/openclaw.json` に設定します。

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          defaults: {
            fontFamily: "Fira Code",
            fontSize: 15,
            lineSpacing: 1.6,
            layout: "unified",
            showLineNumbers: true,
            diffIndicators: "bars",
            wordWrap: true,
            background: true,
            theme: "dark",
            fileFormat: "png",
            fileQuality: "standard",
            fileScale: 2,
            fileMaxWidth: 960,
            mode: "both",
            ttlSeconds: 21600,
          },
        },
      },
    },
  },
}
```

サポートされる `defaults` キー: `fontFamily`, `fontSize`, `lineSpacing`, `layout`, `showLineNumbers`, `diffIndicators`, `wordWrap`, `background`, `theme`, `fileFormat`, `fileQuality`, `fileScale`, `fileMaxWidth`, `mode`, `ttlSeconds`。明示的なツール呼び出しパラメーターはこれらを上書きします。

### 永続的なビューアー URL 設定

<ParamField path="viewerBaseUrl" type="string">
  ツール呼び出しで `baseUrl` が渡されない場合に返されるビューアーリンク用の、Plugin 所有のフォールバック。`http` または `https` である必要があり、query/hash は不可です。
</ParamField>

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          viewerBaseUrl: "https://gateway.example.com/openclaw",
        },
      },
    },
  },
}
```

## セキュリティ設定

<ParamField path="security.allowRemoteViewer" type="boolean" default="false">
  `false`: ビューアールートへの非 loopback リクエストは拒否されます。`true`: トークン化されたパスが有効な場合、リモートビューアーが許可されます。
</ParamField>

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          security: {
            allowRemoteViewer: false,
          },
        },
      },
    },
  },
}
```

## アーティファクトのライフサイクルとストレージ

- アーティファクトは `$TMPDIR/openclaw-diffs` 配下に保存されます。
- ビューアーメタデータには、ランダムな 20 桁の 16 進文字アーティファクト ID、ランダムな 48 桁の 16 進文字トークン、`createdAt`/`expiresAt`、保存された `viewer.html` パスが保存されます。
- デフォルトのアーティファクト TTL: 30 分。受け入れられる最大 TTL: 6 時間。
- クリーンアップは各アーティファクト作成呼び出しの後に機会的に実行されます。期限切れのアーティファクトは削除されます。
- メタデータがない場合、フォールバック sweep により 24 時間より古い stale フォルダーが削除されます。

## ビューアー URL とネットワーク動作

ビューアールート: `/plugins/diffs/view/{artifactId}/{token}`

ビューアーアセット:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js`（diff が言語パックの言語を使用する場合のみ）

ビューアードキュメントはこれらのアセットをビューアー URL からの相対パスとして解決するため、任意の `baseUrl` パスプレフィックスもアセットリクエストに引き継がれます。

URL 解決順序: ツール呼び出しの `baseUrl`（厳密な検証後） -> Plugin の `viewerBaseUrl` -> loopback `127.0.0.1` デフォルト。Gateway のバインドモードが `custom` で、`gateway.customBindHost` が設定されている場合は、loopback の代わりにそのホストが使用されます。

`baseUrl` ルール: `http://` または `https://` である必要があります。query と hash は拒否されます。origin に任意のベースパスを加えたものが許可されます。

## セキュリティモデル

<AccordionGroup>
  <Accordion title="ビューアーの強化">
    - デフォルトでは loopback のみ。
    - 厳密な ID とトークンのパターン検証を伴う、トークン化されたビューアーパス。
    - ビューアーレスポンス CSP: `default-src 'none'`; スクリプト/アセットは self からのみ。外向きの `connect-src` はなし。
    - リモートアクセスが有効な場合のリモートミスのスロットリング: 60 秒あたり 40 回の失敗で 60 秒のロックアウトが発生します（`429 Too Many Requests`）。

  </Accordion>
  <Accordion title="ファイルレンダリングの強化">
    - スクリーンショットブラウザーのリクエストルーティングはデフォルト拒否です。
    - `http://127.0.0.1/plugins/diffs/assets/*` からのローカルビューアーアセットのみが許可されます。
    - 外部ネットワークリクエストはブロックされます。

  </Accordion>
</AccordionGroup>

## ファイルモードのブラウザー要件

`mode: "file"` と `mode: "both"` には Chromium 互換ブラウザーが必要です。

解決順序:

<Steps>
  <Step title="設定">
    OpenClaw 設定の `browser.executablePath`。
  </Step>
  <Step title="環境変数">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="プラットフォームのフォールバック">
    Chrome、Chromium、Edge、Brave の一般的なインストールパスと `PATH` 参照。
  </Step>
</Steps>

一般的な失敗テキスト: `Diff PNG/PDF rendering requires a Chromium-compatible browser...`。Chrome、Chromium、Edge、Brave をインストールするか、上記の実行可能ファイルパスオプションのいずれかを設定して修正します。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="入力検証エラー">
    - `Provide patch or both before and after text.` -- `before` と `after` の両方を含めるか、`patch` を指定します。
    - `Provide either patch or before/after input, not both.` -- 入力モードを混在させないでください。
    - `Invalid baseUrl: ...` -- 任意のパスを含められる `http(s)` オリジンを使用し、クエリ/ハッシュは含めないでください。
    - `{field} exceeds maximum size (...)` -- ペイロードサイズを減らしてください。
    - 大きなパッチの拒否 -- パッチファイル数または合計行数を減らしてください。

  </Accordion>
  <Accordion title="ビューアーのアクセシビリティ">
    - ビューアー URL はデフォルトで `127.0.0.1` に解決されます。
    - リモートアクセスには、Plugin の `viewerBaseUrl` を設定するか、呼び出しごとに `baseUrl` を渡すか、`gateway.customBindHost` とともに `gateway.bind=custom` を使用します。
    - `gateway.trustedProxies` に同一ホストプロキシ（たとえば Tailscale Serve）用のループバックが含まれる場合、転送されたクライアント IP ヘッダーのない生のループバックビューアーリクエストは設計上フェイルクローズします。
    - そのプロキシトポロジーでは、添付用に `mode: "file"`/`"both"` を優先するか、共有可能なビューアーリンク用に `security.allowRemoteViewer` と Plugin の `viewerBaseUrl`/プロキシの `baseUrl` を意図的に有効にします。
    - 外部ビューアーアクセスを意図している場合にのみ、`security.allowRemoteViewer` を有効にしてください。

  </Accordion>
  <Accordion title="未変更行の行に展開ボタンがない">
    展開可能なコンテキストがないパッチ入力では想定どおりであり、ビューアーの失敗ではありません。
  </Accordion>
  <Accordion title="アーティファクトが見つからない">
    - TTL によりアーティファクトの有効期限が切れました。
    - トークンまたはパスが変更されました。
    - クリーンアップにより古いデータが削除されました。

  </Accordion>
</AccordionGroup>

## 運用ガイダンス

- キャンバスでのローカル対話型レビューには `mode: "view"` を優先してください。
- 添付が必要な送信先チャットチャネルには `mode: "file"` を優先してください。
- デプロイでリモートビューアー URL が必要な場合を除き、`allowRemoteViewer` は無効のままにしてください。
- 機密性の高い差分には、明示的に短い `ttlSeconds` を設定してください。
- 必須でない場合は、差分入力でシークレットを送信しないでください。
- チャネルが画像を強く圧縮する場合（たとえば Telegram や WhatsApp）、PDF 出力（`fileFormat: "pdf"`）を優先してください。

<Note>
差分レンダリングエンジンは [Diffs](https://diffs.com) により提供されています。
</Note>

## 関連

- [ブラウザー](/ja-JP/tools/browser)
- [Plugin](/ja-JP/tools/plugin)
- [ツール概要](/ja-JP/tools)

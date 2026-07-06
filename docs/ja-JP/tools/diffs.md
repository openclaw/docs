---
read_when:
    - エージェントにコードやMarkdownの編集をdiffとして表示させたい
    - キャンバス対応のビューアー URL またはレンダリング済みの差分ファイルが必要です
    - 制御された一時的な差分アーティファクトを安全なデフォルトで用意する必要があります
sidebarTitle: Diffs
summary: エージェント向けの読み取り専用差分ビューアーとファイルレンダラー（任意の Plugin ツール）
title: 差分
x-i18n:
    generated_at: "2026-07-06T10:56:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d1f6c02d1b6c0d34f65c9ec195692b992dee69fcce932ee67e408331f275317
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` は、before/after テキストまたは unified patch を読み取り専用の diff アーティファクトに変換する、任意の同梱Pluginツールです。また、短いエージェント向けガイダンスをシステムプロンプトの先頭に追加し、より詳しい手順用の付属Skillsも同梱します。

入力: `before` + `after` テキスト、または unified `patch`（相互に排他的）。

出力: canvas プレゼンテーション用の Gateway ビューアーURL、メッセージ配信用のレンダリング済み PNG/PDF ファイルパス、またはその両方。

## クイックスタート

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="Enable the plugin">
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
  <Step title="Pick a mode">
    <Tabs>
      <Tab title="view">
        Canvas優先のフロー: エージェントは `mode: "view"` で `diffs` を呼び出し、`canvas present` で `details.viewerUrl` を開きます。
      </Tab>
      <Tab title="file">
        チャットファイル配信: エージェントは `mode: "file"` で `diffs` を呼び出し、`message` で `path` または `filePath` を使って `details.filePath` を送信します。
      </Tab>
      <Tab title="both">
        組み合わせ（デフォルト）: エージェントは `mode: "both"` で `diffs` を呼び出し、1回の呼び出しで両方のアーティファクトを取得します。
      </Tab>
    </Tabs>
  </Step>
</Steps>

## 組み込みシステムガイダンスを無効にする

ツールは維持しつつ、先頭に追加されるシステムプロンプトガイダンスを削除するには、`plugins.entries.diffs.hooks.allowPromptInjection` を `false` に設定します。

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

これにより、ツールとSkillsは利用可能なまま、Pluginの `before_prompt_build` フックがブロックされます。ガイダンスとツールの両方を無効にするには、代わりにPluginを無効にします。

## ツール入力リファレンス

特記がない限り、すべてのフィールドは任意です。

<ParamField path="before" type="string">
  元のテキスト。`patch` が省略された場合、`after` とともに必須です。
</ParamField>
<ParamField path="after" type="string">
  更新後のテキスト。`patch` が省略された場合、`before` とともに必須です。
</ParamField>
<ParamField path="patch" type="string">
  Unified diff テキスト。`before` および `after` と相互に排他的です。
</ParamField>
<ParamField path="path" type="string">
  before/after モードで表示するファイル名。
</ParamField>
<ParamField path="lang" type="string">
  before/after モード用の言語上書きヒント。不明な値、およびデフォルトのビューアーセット外の言語は、
  Diff Viewer Language Pack Pluginがインストールされていない限り、プレーンテキストにフォールバックします。
</ParamField>
<ParamField path="title" type="string">
  ビューアータイトルの上書き。
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  出力モード。Pluginデフォルト `defaults.mode`（`both`）が既定です。非推奨の別名: `"image"` は `"file"` と同じように動作します。
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  ビューアーテーマ。Pluginデフォルト `defaults.theme` が既定です。
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Diff レイアウト。Pluginデフォルト `defaults.layout` が既定です。
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  完全なコンテキストが利用可能な場合、変更されていないセクションを展開します。呼び出しごとのオプションのみです（Pluginデフォルトキーではありません）。
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  レンダリング済みファイル形式。Pluginデフォルト `defaults.fileFormat` が既定です。
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  PNG/PDF レンダリング用の品質プリセット。
</ParamField>
<ParamField path="fileScale" type="number">
  デバイススケールの上書き（`1`-`4`）。
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  CSS ピクセル単位の最大レンダー幅（`640`-`2400`）。
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  ビューアーおよびスタンドアロンファイル出力のアーティファクトTTL（秒）。最大 `21600`。
</ParamField>
<ParamField path="baseUrl" type="string">
  ビューアーURLのオリジン上書き。Pluginの `viewerBaseUrl` を上書きします。`http` または `https` である必要があり、クエリ/ハッシュは不可です。
</ParamField>

<AccordionGroup>
  <Accordion title="Legacy input aliases">
    後方互換性のため、引き続き受け付けられます。

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validation and limits">
    - `before`/`after`: それぞれ最大 512 KiB。
    - `patch`: 最大 2 MiB。
    - `path`: 最大 2048 バイト。
    - `lang`: 最大 128 バイト。
    - `title`: 最大 1024 バイト。
    - patch 複雑度の上限: 最大 128 ファイル、合計 120000 行。
    - `patch` を `before`/`after` と一緒に指定すると拒否されます。
    - レンダリング済みファイルの安全上限（PNG および PDF）:
      - `fileQuality: "standard"`: 最大 8 MP（8,000,000 レンダリングピクセル）。
      - `fileQuality: "hq"`: 最大 14 MP。
      - `fileQuality: "print"`: 最大 24 MP。
      - PDF はさらに 50 ページに制限されます。

  </Accordion>
</AccordionGroup>

## 構文ハイライト

組み込み言語:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml`, および `toml`。

一般的な別名（`js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt`, `ps1` など）は、これらの言語に正規化されます。

さらに多くの言語（Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI, diff など）を利用するには、Diff Viewer Language Pack Pluginをインストールします。

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

パックがない場合でも、未対応の言語は読みやすいプレーンテキストとしてレンダリングされます。上流カタログについては、[Diffs Language Pack Plugin](/ja-JP/plugins/reference/diffs-language-pack) と [Shiki languages](https://shiki.style/languages) を参照してください。

## 出力詳細の契約

成功したすべての結果には `changed` が含まれます。同一の before/after 入力は、アーティファクトを作成せずに `false` を返します。レンダリングされた結果は `true` を返します。

<AccordionGroup>
  <Accordion title="Viewer fields (view and both modes)">
    - `changed`
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
  <Accordion title="File fields (file and both modes)">
    - `changed`
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
  <Accordion title="互換性エイリアス（常に返される）">
    - `format` (= `fileFormat`)
    - `imagePath` (= `filePath`)
    - `imageBytes` (= `fileBytes`)
    - `imageQuality` (= `fileQuality`)
    - `imageScale` (= `fileScale`)
    - `imageMaxWidth` (= `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

| モード   | 返り値                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| `"view"` | ビューアフィールドのみ。                                                                                     |
| `"file"` | ファイルフィールドのみ。ビューアアーティファクトはありません。                                               |
| `"both"` | ビューアフィールドに加えてファイルフィールド。ファイルレンダリングに失敗しても、ビューアは `fileError`/`imageError` 付きで返ります。 |

### 変更されていないセクションの折りたたみ

ビューアは `N unmodified lines` のような行を表示します。展開コントロールは、レンダリングされた diff に展開可能なコンテキストデータがある場合にのみ表示されます（before/after 入力で典型的です）。多くの unified patch は hunk 内のコンテキスト本文を省略するため、展開コントロールなしで行が表示されることがあります -- 想定どおりであり、バグではありません。`expandUnchanged` は展開可能なコンテキストが存在する場合にのみ適用されます。

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

サポートされる `defaults` キー: `fontFamily`, `fontSize`, `lineSpacing`, `layout`, `showLineNumbers`, `diffIndicators`, `wordWrap`, `background`, `theme`, `fileFormat`, `fileQuality`, `fileScale`, `fileMaxWidth`, `mode`, `ttlSeconds`。明示的なツール呼び出しパラメータはこれらを上書きします。

### 永続的なビューア URL 設定

<ParamField path="viewerBaseUrl" type="string">
  ツール呼び出しが `baseUrl` を渡さない場合に返されるビューアリンク向けの、Plugin 所有のフォールバック。`http` または `https` である必要があり、クエリ/ハッシュは使用できません。
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
  `false`: ビューアルートへの非ループバックリクエストは拒否されます。`true`: トークン化されたパスが有効な場合、リモートビューアが許可されます。
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

- アーティファクトは `$TMPDIR/openclaw-diffs` 配下に置かれます。
- ビューアメタデータには、ランダムな 20 桁の 16 進アーティファクト ID、ランダムな 48 桁の 16 進トークン、`createdAt`/`expiresAt`、保存された `viewer.html` パスが格納されます。
- デフォルトのアーティファクト TTL: 30 分。受け付けられる最大 TTL: 6 時間。
- 各アーティファクト作成呼び出しの後に、機会的にクリーンアップが実行されます。期限切れのアーティファクトは削除されます。
- メタデータがない場合、フォールバックスイープは 24 時間より古い古いフォルダーを削除します。

## ビューア URL とネットワーク動作

ビューアルート: `/plugins/diffs/view/{artifactId}/{token}`

ビューアアセット:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js`（diff が言語パックの言語を使用する場合のみ）

ビューアドキュメントはこれらのアセットをビューア URL からの相対パスとして解決するため、任意の `baseUrl` パスプレフィックスはアセットリクエストにも引き継がれます。

URL 解決順序: ツール呼び出しの `baseUrl`（厳密な検証後） -> Plugin の `viewerBaseUrl` -> ループバック `127.0.0.1` のデフォルト。Gateway のバインドモードが `custom` で、`gateway.customBindHost` が設定されている場合は、ループバックの代わりにそのホストが使用されます。

`baseUrl` ルール: `http://` または `https://` である必要があります。クエリとハッシュは拒否されます。オリジンに加えて任意のベースパスを使用できます。

## セキュリティモデル

<AccordionGroup>
  <Accordion title="ビューアの強化">
    - デフォルトではループバックのみ。
    - 厳密な ID とトークンパターン検証を備えた、トークン化されたビューアパス。
    - ビューアレスポンス CSP: `default-src 'none'`; スクリプト/アセットは self からのみ。外向きの `connect-src` はありません。
    - リモートアクセスが有効な場合のリモートミスのスロットリング: 60 秒あたり 40 回の失敗で 60 秒のロックアウトが発生します（`429 Too Many Requests`）。

  </Accordion>
  <Accordion title="ファイルレンダリングの強化">
    - スクリーンショットブラウザーのリクエストルーティングはデフォルト拒否です。
    - `http://127.0.0.1/plugins/diffs/assets/*` からのローカルビューアアセットのみ許可されます。
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
    Chrome、Chromium、Edge、Brave の一般的なインストールパスと `PATH` ルックアップ。
  </Step>
</Steps>

一般的な失敗テキスト: `Diff PNG/PDF rendering requires a Chromium-compatible browser...`。Chrome、Chromium、Edge、Brave をインストールするか、上記の実行可能ファイルパスオプションのいずれかを設定して修正します。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="入力検証エラー">
    - `Provide patch or both before and after text.` -- `before` と `after` の両方を含めるか、`patch` を指定します。
    - `Provide either patch or before/after input, not both.` -- 入力モードを混在させないでください。
    - `Invalid baseUrl: ...` -- 任意のパスを含む `http(s)` オリジンを使用し、クエリ/ハッシュは含めません。
    - `{field} exceeds maximum size (...)` -- ペイロードサイズを減らします。
    - 大きなパッチの拒否 -- パッチファイル数または総行数を減らします。

  </Accordion>
  <Accordion title="ビューアーのアクセシビリティ">
    - ビューアー URL はデフォルトで `127.0.0.1` に解決されます。
    - リモートアクセスには、Plugin の `viewerBaseUrl` を設定するか、呼び出しごとに `baseUrl` を渡すか、`gateway.customBindHost` とともに `gateway.bind=custom` を使用します。
    - `gateway.trustedProxies` に同一ホストプロキシ用のループバック（例: Tailscale Serve）が含まれる場合、転送されたクライアント IP ヘッダーがない生のループバックビューアーリクエストは設計上 fail closed になります。
    - そのプロキシトポロジーでは、添付ファイルには `mode: "file"`/`"both"` を優先するか、共有可能なビューアーリンクのために `security.allowRemoteViewer` と Plugin の `viewerBaseUrl`/プロキシの `baseUrl` を意図的に有効にします。
    - 外部ビューアーアクセスを意図している場合にのみ `security.allowRemoteViewer` を有効にしてください。

  </Accordion>
  <Accordion title="変更されていない行に展開ボタンがない">
    展開可能なコンテキストを持たないパッチ入力では想定どおりです。ビューアーの失敗ではありません。
  </Accordion>
  <Accordion title="アーティファクトが見つからない">
    - TTL によりアーティファクトが期限切れになりました。
    - トークンまたはパスが変更されました。
    - クリーンアップにより古いデータが削除されました。

  </Accordion>
</AccordionGroup>

## 運用ガイダンス

- キャンバスでのローカル対話型レビューには `mode: "view"` を優先します。
- 添付ファイルが必要な外向きのチャットチャネルには `mode: "file"` を優先します。
- デプロイでリモートビューアー URL が必要な場合を除き、`allowRemoteViewer` は無効のままにします。
- 機密性の高い diff には明示的に短い `ttlSeconds` を設定します。
- 必須でない場合は、diff 入力でシークレットを送信しないでください。
- チャネルが画像を強く圧縮する場合（例: Telegram や WhatsApp）、PDF 出力（`fileFormat: "pdf"`）を優先します。

<Note>
diff レンダリングエンジンは [Diffs](https://diffs.com) により提供されています。
</Note>

## 関連

- [ブラウザー](/ja-JP/tools/browser)
- [Plugin](/ja-JP/tools/plugin)
- [ツール概要](/ja-JP/tools)

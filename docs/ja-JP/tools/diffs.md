---
read_when:
    - エージェントにコードやMarkdownの編集を差分として表示させたい
    - キャンバス対応のビューアーURLまたはレンダリング済みの差分ファイルが必要です
    - 制御された一時的な差分アーティファクトを、安全なデフォルトで用意する必要があります
sidebarTitle: Diffs
summary: エージェント向けの読み取り専用 diff ビューアーおよびファイルレンダラー（任意の Plugin ツール）
title: 差分
x-i18n:
    generated_at: "2026-07-06T21:53:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9c70e665bdc13e0534060700c4fb7cfcf2d57fba69b884c4e782201236f13cb
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` は、before/after テキストまたは unified patch を読み取り専用の diff artifact に変換する、任意のバンドル済みプラグインツールです。また、短いエージェント向けガイダンスをシステムプロンプトの先頭に追加し、より詳しい手順のための付属 skill も同梱します。

入力: `before` + `after` テキスト、または unified `patch`（相互排他）。

出力: canvas 表示用の Gateway viewer URL、メッセージ配信用のレンダリング済み PNG/PDF ファイルパス、またはその両方。

## クイックスタート

<Steps>
  <Step title="プラグインをインストール">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="プラグインを有効化">
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
  <Step title="モードを選択">
    <Tabs>
      <Tab title="view">
        Canvas 優先のフロー: エージェントは `mode: "view"` で `diffs` を呼び出し、`canvas present` で `details.viewerUrl` を開きます。
      </Tab>
      <Tab title="file">
        チャットのファイル配信: エージェントは `mode: "file"` で `diffs` を呼び出し、`path` または `filePath` を使って `message` で `details.filePath` を送信します。
      </Tab>
      <Tab title="both">
        組み合わせ（デフォルト）: エージェントは `mode: "both"` で `diffs` を呼び出し、1 回の呼び出しで両方の artifact を取得します。
      </Tab>
    </Tabs>
  </Step>
</Steps>

## 組み込みのシステムガイダンスを無効化

ツールは維持しつつ、先頭に追加されるシステムプロンプトのガイダンスを削除するには、`plugins.entries.diffs.hooks.allowPromptInjection` を `false` に設定します。

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

これにより、ツールと skill は利用可能なまま、プラグインの `before_prompt_build` hook がブロックされます。ガイダンスとツールの両方を無効にするには、代わりにプラグインを無効化します。

## ツール入力リファレンス

明記されていない限り、すべてのフィールドは任意です。

<ParamField path="before" type="string">
  元のテキスト。`patch` を省略する場合は `after` とともに必須です。
</ParamField>
<ParamField path="after" type="string">
  更新後のテキスト。`patch` を省略する場合は `before` とともに必須です。
</ParamField>
<ParamField path="patch" type="string">
  Unified diff テキスト。`before` および `after` と相互排他です。
</ParamField>
<ParamField path="path" type="string">
  before/after モードで表示するファイル名。
</ParamField>
<ParamField path="lang" type="string">
  before/after モード用の言語上書きヒント。不明な値やデフォルトの viewer セット外の言語は、
  Diff Viewer Language Pack プラグインがインストールされていない限り plain text にフォールバックします。
</ParamField>
<ParamField path="title" type="string">
  Viewer タイトルの上書き。
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  出力モード。プラグインのデフォルト `defaults.mode`（`both`）が既定です。非推奨のエイリアス: `"image"` は `"file"` と同じ動作をします。
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Viewer テーマ。プラグインのデフォルト `defaults.theme` が既定です。
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Diff レイアウト。プラグインのデフォルト `defaults.layout` が既定です。
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  完全なコンテキストが利用できる場合、変更のないセクションを展開します。呼び出しごとのオプションのみです（プラグインのデフォルトキーではありません）。
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  レンダリング済みファイル形式。プラグインのデフォルト `defaults.fileFormat` が既定です。
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  PNG/PDF レンダリングの品質プリセット。
</ParamField>
<ParamField path="fileScale" type="number">
  デバイススケールの上書き（`1`-`4`）。
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  CSS ピクセルでの最大レンダリング幅（`640`-`2400`）。
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  Viewer とスタンドアロンファイル出力の artifact TTL（秒）。最大 `21600`。
</ParamField>
<ParamField path="baseUrl" type="string">
  Viewer URL origin の上書き。プラグインの `viewerBaseUrl` を上書きします。`http` または `https` である必要があり、query/hash は使えません。
</ParamField>

<AccordionGroup>
  <Accordion title="レガシー入力エイリアス">
    後方互換性のため引き続き受け付けられます。

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="検証と制限">
    - `before`/`after`: それぞれ最大 512 KiB。
    - `patch`: 最大 2 MiB。
    - `path`: 最大 2048 バイト。
    - `lang`: 最大 128 バイト。
    - `title`: 最大 1024 バイト。
    - Patch 複雑度の上限: 最大 128 ファイル、合計 120000 行。
    - `patch` を `before`/`after` と一緒に指定すると拒否されます。
    - レンダリング済みファイルの安全上の制限（PNG および PDF）:
      - `fileQuality: "standard"`: 最大 8 MP（8,000,000 レンダリングピクセル）。
      - `fileQuality: "hq"`: 最大 14 MP。
      - `fileQuality: "print"`: 最大 24 MP。
      - PDF はさらに 50 ページで上限が設定されます。

  </Accordion>
</AccordionGroup>

## 構文ハイライト

組み込み言語:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml`, and `toml`.

一般的なエイリアス（`js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt`, `ps1` など）は、これらの言語に正規化されます。

さらに多くの言語（Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI, diff など）に対応するには、Diff Viewer Language Pack プラグインをインストールします。

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

パックがない場合でも、サポートされていない言語は読みやすい plain text としてレンダリングされます。上流カタログについては、[Diffs Language Pack プラグイン](/ja-JP/plugins/reference/diffs-language-pack) と [Shiki languages](https://shiki.style/languages) を参照してください。

## 出力詳細コントラクト

成功した結果にはすべて `changed` が含まれます。同一の before/after 入力は artifact を作成せずに `false` を返し、レンダリングされた結果は `true` を返します。

<AccordionGroup>
  <Accordion title="Viewer フィールド（view および both モード）">
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
  <Accordion title="File フィールド（file および both モード）">
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
| `"file"` | ファイルフィールドのみ。ビューアアーティファクトはなし。                                                     |
| `"both"` | ビューアフィールドに加えてファイルフィールド。ファイルレンダリングが失敗した場合も、ビューアは `fileError`/`imageError` 付きで返される。 |

### 折りたたまれた未変更セクション

ビューアは `N unmodified lines` のような行を表示します。展開コントロールは、レンダリングされた diff に展開可能なコンテキストデータがある場合にのみ表示されます（before/after 入力で一般的）。多くの unified patch はハンク内のコンテキスト本文を省略するため、展開コントロールなしで行が表示されることがあります。これは想定どおりであり、バグではありません。`expandUnchanged` は展開可能なコンテキストが存在する場合にのみ適用されます。

### 複数ファイルのナビゲーション

複数のファイルに触れるパッチは、変更ファイルの概要カードから始まります。合計 `+N` / `-N` カウント、ファイルごとのカウント、追加/削除/名前変更バッジ、各ファイルへジャンプするアンカーリンクが含まれます。レンダリングされた PNG/PDF ファイルでは、ファイルごとのヘッダーカウントは維持されますが、静的ファイル内では機能しないコントロールであるため、インタラクティブなビュー切り替えは削除されます。

## Plugin のデフォルト

Plugin 全体のデフォルトを `~/.openclaw/openclaw.json` で設定します。

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

サポートされる `defaults` キー: `fontFamily`、`fontSize`、`lineSpacing`、`layout`、`showLineNumbers`、`diffIndicators`、`wordWrap`、`background`、`theme`、`fileFormat`、`fileQuality`、`fileScale`、`fileMaxWidth`、`mode`、`ttlSeconds`。明示的なツール呼び出しパラメータはこれらを上書きします。

### 永続ビューア URL 設定

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
- ビューアメタデータには、ランダムな 20 桁の 16 進文字アーティファクト ID、ランダムな 48 桁の 16 進文字トークン、`createdAt`/`expiresAt`、保存された `viewer.html` パスが格納されます。
- デフォルトのアーティファクト TTL: 30 分。受け付ける最大 TTL: 6 時間。
- クリーンアップは各アーティファクト作成呼び出しの後に機会的に実行され、期限切れのアーティファクトは削除されます。
- フォールバックスイープは、メタデータがない場合に 24 時間より古い古いフォルダーを削除します。

## ビューア URL とネットワーク動作

ビューアルート: `/plugins/diffs/view/{artifactId}/{token}`

ビューアアセット:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js`（diff が言語パックの言語を使用する場合のみ）

ビューアドキュメントはこれらのアセットをビューア URL からの相対パスとして解決するため、任意の `baseUrl` パスプレフィックスはアセットリクエストにも引き継がれます。

URL 解決順序: ツール呼び出しの `baseUrl`（厳密な検証後） -> Plugin の `viewerBaseUrl` -> loopback `127.0.0.1` デフォルト。Gateway のバインドモードが `custom` で、`gateway.customBindHost` が設定されている場合は、loopback の代わりにそのホストが使用されます。

`baseUrl` ルール: `http://` または `https://` である必要があります。クエリとハッシュは拒否されます。オリジンに加えて任意のベースパスが許可されます。

## セキュリティモデル

<AccordionGroup>
  <Accordion title="ビューアーの強化">
    - デフォルトではループバック専用。
    - 厳密な ID とトークンパターン検証を備えた、トークン化されたビューアーパス。
    - ビューアーレスポンスの CSP: `default-src 'none'`; スクリプト/アセットは self からのみ; 外向きの `connect-src` なし。
    - リモートアクセスが有効な場合のリモートミスのスロットリング: 60 秒あたり 40 回の失敗で 60 秒間のロックアウトが発生します（`429 Too Many Requests`）。

  </Accordion>
  <Accordion title="ファイルレンダリングの強化">
    - スクリーンショットブラウザーリクエストのルーティングはデフォルト拒否です。
    - `http://127.0.0.1/plugins/diffs/assets/*` からのローカルビューアーアセットのみ許可されます。
    - 外部ネットワークリクエストはブロックされます。

  </Accordion>
</AccordionGroup>

## ファイルモードのブラウザー要件

`mode: "file"` と `mode: "both"` には Chromium 互換ブラウザーが必要です。

解決順序:

<Steps>
  <Step title="設定">
    OpenClaw 設定内の `browser.executablePath`。
  </Step>
  <Step title="環境変数">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="プラットフォームフォールバック">
    Chrome、Chromium、Edge、Brave の一般的なインストールパスと `PATH` ルックアップ。
  </Step>
</Steps>

一般的な失敗テキスト: `Diff PNG/PDF rendering requires a Chromium-compatible browser...`。Chrome、Chromium、Edge、Brave をインストールするか、上記の実行可能パスオプションのいずれかを設定して修正してください。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="入力検証エラー">
    - `Provide patch or both before and after text.` -- `before` と `after` の両方を含めるか、`patch` を指定します。
    - `Provide either patch or before/after input, not both.` -- 入力モードを混在させないでください。
    - `Invalid baseUrl: ...` -- 任意のパスを含められる `http(s)` オリジンを使用し、クエリ/ハッシュは含めないでください。
    - `{field} exceeds maximum size (...)` -- ペイロードサイズを減らしてください。
    - 大きなパッチの拒否 -- パッチファイル数または総行数を減らしてください。

  </Accordion>
  <Accordion title="ビューアーのアクセシビリティ">
    - ビューアー URL はデフォルトで `127.0.0.1` に解決されます。
    - リモートアクセスでは、Plugin の `viewerBaseUrl` を設定するか、呼び出しごとに `baseUrl` を渡すか、`gateway.customBindHost` とともに `gateway.bind=custom` を使用します。
    - `gateway.trustedProxies` に同一ホストプロキシ（たとえば Tailscale Serve）用のループバックが含まれる場合、転送されたクライアント IP ヘッダーのない生のループバックビューアーリクエストは設計上フェイルクローズします。
    - そのプロキシトポロジーでは、添付ファイルには `mode: "file"`/`"both"` を優先するか、共有可能なビューアーリンク用に `security.allowRemoteViewer` と Plugin の `viewerBaseUrl`/プロキシの `baseUrl` を意図的に有効にしてください。
    - 外部ビューアーアクセスを意図している場合のみ、`security.allowRemoteViewer` を有効にしてください。

  </Accordion>
  <Accordion title="変更なし行の行に展開ボタンがない">
    展開可能なコンテキストを含まないパッチ入力では想定どおりです。ビューアーの失敗ではありません。
  </Accordion>
  <Accordion title="アーティファクトが見つからない">
    - TTL によりアーティファクトの有効期限が切れました。
    - トークンまたはパスが変更されました。
    - クリーンアップにより古いデータが削除されました。

  </Accordion>
</AccordionGroup>

## 運用ガイダンス

- canvas でのローカルのインタラクティブレビューには `mode: "view"` を優先してください。
- 添付ファイルが必要な外向きチャットチャンネルには `mode: "file"` を優先してください。
- デプロイでリモートビューアー URL が必要でない限り、`allowRemoteViewer` は無効のままにしてください。
- 機密性の高い diff には明示的に短い `ttlSeconds` を設定してください。
- 必要でない場合は、diff 入力でシークレットを送信しないでください。
- チャンネルが画像を強く圧縮する場合（たとえば Telegram や WhatsApp）、PDF 出力（`fileFormat: "pdf"`）を優先してください。

<Note>
Diff レンダリングエンジンは [Diffs](https://diffs.com) によって提供されています。
</Note>

## 関連

- [ブラウザー](/ja-JP/tools/browser)
- [Plugins](/ja-JP/tools/plugin)
- [ツール概要](/ja-JP/tools)

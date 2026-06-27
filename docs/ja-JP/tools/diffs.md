---
read_when:
    - エージェントにコードや Markdown の編集を差分として表示させたい
    - キャンバス対応のビューアー URL またはレンダリング済みの差分ファイルが必要です
    - 制御された一時的な diff アーティファクトを、安全なデフォルトで利用する必要があります
sidebarTitle: Diffs
summary: エージェント向けの読み取り専用差分ビューアーおよびファイルレンダラー（任意のPluginツール）
title: 差分
x-i18n:
    generated_at: "2026-06-27T13:10:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea3d8e9e026e10b2f3658b795c07ea21062896ab0d45a8cb2dc7e0e9ed9aa658
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` は、短い組み込みシステムガイダンスとコンパニオン Skill を備えた任意の Plugin ツールで、変更内容をエージェント向けの読み取り専用 diff アーティファクトに変換します。

次のいずれかを受け付けます。

- `before` と `after` のテキスト
- 統一形式の `patch`

次を返せます。

- canvas 表示用の Gateway viewer URL
- メッセージ配信用のレンダリング済みファイルパス（PNG または PDF）
- 1 回の呼び出しで両方の出力

有効にすると、この Plugin はシステムプロンプト領域に簡潔な使用ガイダンスを追加し、エージェントがより詳しい手順を必要とする場合のために詳細な Skill も公開します。

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
        canvas 優先のフロー: エージェントは `mode: "view"` で `diffs` を呼び出し、`canvas present` で `details.viewerUrl` を開きます。
      </Tab>
      <Tab title="file">
        チャットでのファイル配信: エージェントは `mode: "file"` で `diffs` を呼び出し、`path` または `filePath` を使って `message` で `details.filePath` を送信します。
      </Tab>
      <Tab title="both">
        組み合わせ: エージェントは `mode: "both"` で `diffs` を呼び出し、1 回の呼び出しで両方のアーティファクトを取得します。
      </Tab>
    </Tabs>
  </Step>
</Steps>

## 組み込みシステムガイダンスを無効にする

`diffs` ツールを有効にしたまま、その組み込みシステムプロンプトガイダンスを無効にしたい場合は、`plugins.entries.diffs.hooks.allowPromptInjection` を `false` に設定します。

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

これにより、Plugin、ツール、コンパニオン Skill は利用可能なまま、diffs Plugin の `before_prompt_build` フックがブロックされます。

ガイダンスとツールの両方を無効にしたい場合は、代わりに Plugin を無効にします。

## 一般的なエージェントワークフロー

<Steps>
  <Step title="Call diffs">
    エージェントが入力を指定して `diffs` ツールを呼び出します。
  </Step>
  <Step title="Read details">
    エージェントがレスポンスから `details` フィールドを読み取ります。
  </Step>
  <Step title="Present">
    エージェントは `canvas present` で `details.viewerUrl` を開くか、`path` または `filePath` を使って `message` で `details.filePath` を送信するか、その両方を行います。
  </Step>
</Steps>

## 入力例

<Tabs>
  <Tab title="Before and after">
    ```json
    {
      "before": "# Hello\n\nOne",
      "after": "# Hello\n\nTwo",
      "path": "docs/example.md",
      "mode": "view"
    }
    ```
  </Tab>
  <Tab title="Patch">
    ```json
    {
      "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
      "mode": "both"
    }
    ```
  </Tab>
</Tabs>

## ツール入力リファレンス

特記がない限り、すべてのフィールドは任意です。

<ParamField path="before" type="string">
  元のテキスト。`patch` を省略する場合は `after` と一緒に必須です。
</ParamField>
<ParamField path="after" type="string">
  更新後のテキスト。`patch` を省略する場合は `before` と一緒に必須です。
</ParamField>
<ParamField path="patch" type="string">
  統一 diff テキスト。`before` および `after` とは同時に指定できません。
</ParamField>
<ParamField path="path" type="string">
  before and after モードで表示するファイル名。
</ParamField>
<ParamField path="lang" type="string">
  before and after モードの言語上書きヒント。不明な値やデフォルト viewer セット外の言語は、
  Diff Viewer Language Pack Plugin がインストールされていない限り、プレーンテキストにフォールバックします。
</ParamField>

<ParamField path="title" type="string">
  viewer タイトルの上書き。
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  出力モード。Plugin のデフォルト `defaults.mode` が既定です。非推奨のエイリアス: `"image"` は `"file"` と同様に動作し、後方互換性のため引き続き受け付けられます。
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  viewer テーマ。Plugin のデフォルト `defaults.theme` が既定です。
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  diff レイアウト。Plugin のデフォルト `defaults.layout` が既定です。
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  完全なコンテキストが利用可能な場合に、変更のないセクションを展開します。呼び出しごとのオプションのみです（Plugin のデフォルトキーではありません）。
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  レンダリング済みファイル形式。Plugin のデフォルト `defaults.fileFormat` が既定です。
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  PNG または PDF レンダリングの品質プリセット。
</ParamField>
<ParamField path="fileScale" type="number">
  デバイススケールの上書き（`1`-`4`）。
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  CSS ピクセル単位の最大レンダリング幅（`640`-`2400`）。
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  viewer およびスタンドアロンファイル出力のアーティファクト TTL（秒）。最大 21600。
</ParamField>
<ParamField path="baseUrl" type="string">
  viewer URL オリジンの上書き。Plugin の `viewerBaseUrl` を上書きします。`http` または `https` である必要があり、query/hash は指定できません。
</ParamField>

<AccordionGroup>
  <Accordion title="Legacy input aliases">
    後方互換性のため引き続き受け付けられます。

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validation and limits">
    - `before` と `after` はそれぞれ最大 512 KiB。
    - `patch` は最大 2 MiB。
    - `path` は最大 2048 バイト。
    - `lang` は最大 128 バイト。
    - `title` は最大 1024 バイト。
    - パッチ複雑度の上限: 最大 128 ファイル、合計 120000 行。
    - `patch` と `before` または `after` の同時指定は拒否されます。
    - レンダリング済みファイルの安全上限（PNG と PDF に適用）:
      - `fileQuality: "standard"`: 最大 8 MP（8,000,000 レンダリングピクセル）。
      - `fileQuality: "hq"`: 最大 14 MP（14,000,000 レンダリングピクセル）。
      - `fileQuality: "print"`: 最大 24 MP（24,000,000 レンダリングピクセル）。
      - PDF には最大 50 ページの上限もあります。

  </Accordion>
</AccordionGroup>

## 構文ハイライト

OpenClaw には、一般的なソース、設定、ドキュメント言語の構文ハイライトが含まれています。

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml`, `toml`。

`js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt`, `ps1` などの一般的なエイリアスは、これらのデフォルト言語に正規化されます。

Diff Viewer Language Pack Plugin をインストールして、他の言語をハイライトします。

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

言語パックが利用可能になると、OpenClaw はさらに多くの言語をハイライトできます。パックがインストールされていない場合でも、デフォルトリスト外のファイルは読みやすいプレーンテキストとしてレンダリングされます。例には Astro、Vue、Svelte、MDX、GraphQL、Terraform/HCL、Nix、Clojure、Elixir、Haskell、OCaml、Scala、Zig、Solidity、Verilog/VHDL、Fortran、MATLAB、LaTeX、Mermaid、Sass/Less/SCSS、Nginx、Apache、CSV、dotenv、INI、diff ファイルが含まれます。

詳細は [Diffs Language Pack Plugin](/ja-JP/plugins/reference/diffs-language-pack) を、Shiki の上流言語とエイリアスカタログは [Shiki languages](https://shiki.style/languages) を参照してください。

## 出力詳細の契約

このツールは `details` の下に構造化メタデータを返します。

<AccordionGroup>
  <Accordion title="Viewer fields">
    ビューアーを作成するモードの共有フィールド:

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (利用可能な場合は `agentId`、`sessionId`、`messageChannel`、`agentAccountId`)

  </Accordion>
  <Accordion title="File fields">
    PNG または PDF がレンダリングされた場合のファイルフィールド:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (メッセージツール互換性のため、`filePath` と同じ値)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="Compatibility aliases">
    既存の呼び出し元向けにも返されます:

    - `format` (`fileFormat` と同じ値)
    - `imagePath` (`filePath` と同じ値)
    - `imageBytes` (`fileBytes` と同じ値)
    - `imageQuality` (`fileQuality` と同じ値)
    - `imageScale` (`fileScale` と同じ値)
    - `imageMaxWidth` (`fileMaxWidth` と同じ値)

  </Accordion>
</AccordionGroup>

モード動作の概要:

| モード     | 返される内容                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | ビューアーフィールドのみ。                                                                                                    |
| `"file"` | ファイルフィールドのみ。ビューアーアーティファクトはありません。                                                                                  |
| `"both"` | ビューアーフィールドとファイルフィールド。ファイルのレンダリングに失敗した場合でも、ビューアーは `fileError` と `imageError` エイリアス付きで返されます。 |

## 折りたたまれた未変更セクション

- ビューアーは `N unmodified lines` のような行を表示できます。
- それらの行の展開コントロールは条件付きであり、すべての入力種別で保証されるわけではありません。
- 展開コントロールは、レンダリングされた diff に展開可能なコンテキストデータがある場合に表示されます。これは before と after の入力で一般的です。
- 多くの unified patch 入力では、省略されたコンテキスト本文は解析済みパッチハンクで利用できないため、行が展開コントロールなしで表示されることがあります。これは想定される動作です。
- `expandUnchanged` は、展開可能なコンテキストが存在する場合にのみ適用されます。

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

サポートされるデフォルト:

- `fontFamily`
- `fontSize`
- `lineSpacing`
- `layout`
- `showLineNumbers`
- `diffIndicators`
- `wordWrap`
- `background`
- `theme`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`
- `mode`
- `ttlSeconds`

明示的なツールパラメーターはこれらのデフォルトを上書きします。

### 永続的なビューアー URL 設定

<ParamField path="viewerBaseUrl" type="string">
  ツール呼び出しが `baseUrl` を渡さない場合に返されるビューアーリンク向けの、Plugin 所有のフォールバック。`http` または `https` である必要があり、クエリ/ハッシュは指定できません。
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
  `false`: ビューアールートへの非 local loopback リクエストは拒否されます。`true`: トークン化されたパスが有効な場合、リモートビューアーが許可されます。
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

- アーティファクトは temp サブフォルダー `$TMPDIR/openclaw-diffs` の下に保存されます。
- ビューアアーティファクトのメタデータには次が含まれます:
  - ランダムなアーティファクト ID (20 桁の 16 進文字)
  - ランダムなトークン (48 桁の 16 進文字)
  - `createdAt` と `expiresAt`
  - 保存された `viewer.html` パス
- 指定されていない場合、デフォルトのアーティファクト TTL は 30 分です。
- 受け入れられるビューア TTL の最大値は 6 時間です。
- クリーンアップはアーティファクト作成後に適宜実行されます。
- 期限切れのアーティファクトは削除されます。
- フォールバッククリーンアップは、メタデータがない場合に 24 時間を超えて古いフォルダーを削除します。

## ビューア URL とネットワーク動作

ビューアルート:

- `/plugins/diffs/view/{artifactId}/{token}`

ビューアアセット:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- diff が Diff Viewer Language Pack の言語を使用する場合は `/plugins/diffs-language-pack/assets/viewer.js`

ビューアドキュメントはそれらのアセットをビューア URL からの相対パスとして解決するため、任意の `baseUrl` パスプレフィックスも両方のアセットリクエストで保持されます。

URL 構築の動作:

- ツール呼び出しの `baseUrl` が指定されている場合、厳密な検証後に使用されます。
- それ以外で Plugin の `viewerBaseUrl` が設定されている場合、それが使用されます。
- どちらの上書きもない場合、ビューア URL はデフォルトで loopback `127.0.0.1` になります。
- Gateway バインドモードが `custom` で、`gateway.customBindHost` が設定されている場合、そのホストが使用されます。

`baseUrl` のルール:

- `http://` または `https://` である必要があります。
- クエリとハッシュは拒否されます。
- オリジンと任意のベースパスが許可されます。

## セキュリティモデル

<AccordionGroup>
  <Accordion title="ビューアの堅牢化">
    - デフォルトでは loopback のみに制限されます。
    - 厳密な ID とトークン検証を伴う、トークン化されたビューアパス。
    - ビューアレスポンス CSP:
      - `default-src 'none'`
      - スクリプトとアセットは self からのみ
      - アウトバウンドの `connect-src` なし
    - リモートアクセスが有効な場合のリモートミスのスロットリング:
      - 60 秒あたり 40 回の失敗
      - 60 秒のロックアウト (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="ファイルレンダリングの堅牢化">
    - スクリーンショットブラウザーのリクエストルーティングはデフォルト拒否です。
    - `http://127.0.0.1/plugins/diffs/assets/*` からのローカルビューアアセットのみが許可されます。
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
    プラットフォームのコマンド/パス検出フォールバック。
  </Step>
</Steps>

一般的な失敗テキスト:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Chrome、Chromium、Edge、Brave をインストールするか、上記の実行可能ファイルパスオプションのいずれかを設定して修正します。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="入力検証エラー">
    - `Provide patch or both before and after text.` — `before` と `after` の両方を含めるか、`patch` を指定します。
    - `Provide either patch or before/after input, not both.` — 入力モードを混在させないでください。
    - `Invalid baseUrl: ...` — 任意のパスを含む `http(s)` オリジンを使用し、クエリ/ハッシュは使用しません。
    - `{field} exceeds maximum size (...)` — ペイロードサイズを減らします。
    - 大きなパッチの拒否 — パッチファイル数または合計行数を減らします。

  </Accordion>
  <Accordion title="ビューアのアクセシビリティ">
    - ビューア URL はデフォルトで `127.0.0.1` に解決されます。
    - リモートアクセスシナリオでは、次のいずれかを行います:
      - Plugin の `viewerBaseUrl` を設定する、または
      - ツール呼び出しごとに `baseUrl` を渡す、または
      - `gateway.bind=custom` と `gateway.customBindHost` を使用する
    - `gateway.trustedProxies` に同一ホストのプロキシ (たとえば Tailscale Serve) 用の loopback が含まれる場合、転送されたクライアント IP ヘッダーのない生の loopback ビューアリクエストは設計上 fail closed になります。
    - そのプロキシトポロジでは:
      - 添付ファイルだけが必要な場合は `mode: "file"` または `mode: "both"` を優先する、または
      - 共有可能なビューア URL が必要な場合は、意図的に `security.allowRemoteViewer` を有効にし、Plugin の `viewerBaseUrl` を設定するか、プロキシ/公開 `baseUrl` を渡します
    - 外部ビューアアクセスを意図する場合にのみ `security.allowRemoteViewer` を有効にします。

  </Accordion>
  <Accordion title="未変更行の行に展開ボタンがない">
    これは、パッチに展開可能なコンテキストが含まれない場合にパッチ入力で発生することがあります。これは想定どおりであり、ビューアの失敗を示すものではありません。
  </Accordion>
  <Accordion title="アーティファクトが見つからない">
    - TTL によりアーティファクトが期限切れになりました。
    - トークンまたはパスが変更されました。
    - クリーンアップにより古いデータが削除されました。

  </Accordion>
</AccordionGroup>

## 運用ガイダンス

- キャンバスでのローカル対話型レビューには `mode: "view"` を優先します。
- 添付ファイルが必要なアウトバウンドチャットチャネルには `mode: "file"` を優先します。
- デプロイでリモートビューア URL が必要な場合を除き、`allowRemoteViewer` は無効のままにします。
- 機密性の高い diff には明示的に短い `ttlSeconds` を設定します。
- 必要でない場合は、diff 入力にシークレットを送信しないでください。
- チャネルが画像を強く圧縮する場合 (たとえば Telegram や WhatsApp)、PDF 出力 (`fileFormat: "pdf"`) を優先します。

<Note>
diff レンダリングエンジンは [Diffs](https://diffs.com) により提供されています。
</Note>

## 関連

- [ブラウザー](/ja-JP/tools/browser)
- [Plugin](/ja-JP/tools/plugin)
- [ツール概要](/ja-JP/tools)

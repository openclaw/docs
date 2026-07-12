---
read_when:
    - エージェントにコードやMarkdownの編集内容を差分として表示させたい場合
    - キャンバスですぐに使えるビューアー URL またはレンダリング済みの差分ファイルが必要です
    - 安全なデフォルト設定を備えた、制御可能な一時的な差分アーティファクトが必要です
sidebarTitle: Diffs
summary: エージェント向けの読み取り専用差分ビューアーおよびファイルレンダラー（オプションのPluginツール）
title: 差分
x-i18n:
    generated_at: "2026-07-12T14:52:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f28a8ac4191f72376ba5c8823337bd337e3fac236ea4ecc2204e6dcf2930e607
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` は、変更前/変更後のテキストまたは unified patch を読み取り専用の diff アーティファクトに変換する、オプションのバンドル Plugin ツールです。また、短いエージェント向けガイダンスをシステムプロンプトの先頭に追加し、より詳細な手順を示す付属 Skills を提供します。

入力: `before` + `after` テキスト、または unified `patch`（相互排他）。

出力: キャンバス表示用の Gateway ビューアー URL、メッセージ配信用にレンダリングされた PNG/PDF ファイルパス、またはその両方。

## クイックスタート

<Steps>
  <Step title="Plugin をインストールする">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="Plugin を有効にする">
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
  <Step title="モードを選択する">
    <Tabs>
      <Tab title="view">
        キャンバス優先のフロー: エージェントは `mode: "view"` を指定して `diffs` を呼び出し、`canvas present` で `details.viewerUrl` を開きます。
      </Tab>
      <Tab title="file">
        チャットでのファイル配信: エージェントは `mode: "file"` を指定して `diffs` を呼び出し、`path` または `filePath` を使用して `message` で `details.filePath` を送信します。
      </Tab>
      <Tab title="both">
        組み合わせ（デフォルト）: エージェントは `mode: "both"` を指定して `diffs` を呼び出し、1 回の呼び出しで両方のアーティファクトを取得します。
      </Tab>
    </Tabs>
  </Step>
</Steps>

## 組み込みのシステムガイダンスを無効にする

ツールを維持したまま、先頭に追加されるシステムプロンプトのガイダンスを削除するには、`plugins.entries.diffs.hooks.allowPromptInjection` を `false` に設定します。

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

これにより、ツールと Skills は引き続き利用可能なまま、Plugin の `before_prompt_build` フックがブロックされます。ガイダンスとツールの両方を無効にするには、代わりに Plugin を無効にします。

## ツール入力リファレンス

特記がない限り、すべてのフィールドは省略可能です。

<ParamField path="before" type="string">
  元のテキスト。`patch` を省略する場合は、`after` とともに必須です。
</ParamField>
<ParamField path="after" type="string">
  更新後のテキスト。`patch` を省略する場合は、`before` とともに必須です。
</ParamField>
<ParamField path="patch" type="string">
  unified diff テキスト。`before` および `after` とは相互排他です。
</ParamField>
<ParamField path="path" type="string">
  変更前/変更後モードで表示するファイル名。
</ParamField>
<ParamField path="lang" type="string">
  変更前/変更後モードの言語上書きヒント。Diff Viewer Language Pack Plugin がインストールされていない限り、不明な値およびデフォルトのビューアーセットに含まれない言語はプレーンテキストにフォールバックします。
</ParamField>
<ParamField path="title" type="string">
  ビューアータイトルの上書き。
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  出力モード。Plugin のデフォルト `defaults.mode`（`both`）が使用されます。非推奨のエイリアス: `"image"` は `"file"` と同じように動作します。
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  ビューアーのテーマ。Plugin のデフォルト `defaults.theme` が使用されます。
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  diff のレイアウト。Plugin のデフォルト `defaults.layout` が使用されます。
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  完全なコンテキストを利用できる場合に、未変更セクションを展開します。呼び出しごとのオプションのみです（Plugin のデフォルトキーではありません）。
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  レンダリングされるファイル形式。Plugin のデフォルト `defaults.fileFormat` が使用されます。
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  PNG/PDF レンダリング用の品質プリセット。
</ParamField>
<ParamField path="fileScale" type="number">
  デバイススケールの上書き（`1`〜`4`）。
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  CSS ピクセル単位の最大レンダリング幅（`640`〜`2400`）。
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  ビューアーおよびスタンドアロンファイル出力のアーティファクト TTL（秒単位）。最大 `21600`。
</ParamField>
<ParamField path="baseUrl" type="string">
  ビューアー URL のオリジン上書き。Plugin の `viewerBaseUrl` を上書きします。`http` または `https` である必要があり、クエリやハッシュは指定できません。
</ParamField>

<AccordionGroup>
  <Accordion title="検証と制限">
    - `before`/`after`: それぞれ最大 512 KiB。
    - `patch`: 最大 2 MiB。
    - `path`: 最大 2048 バイト。
    - `lang`: 最大 128 バイト。
    - `title`: 最大 1024 バイト。
    - パッチの複雑性上限: 最大 128 ファイル、合計 120000 行。
    - `patch` と `before`/`after` を同時に指定すると拒否されます。
    - レンダリングファイルの安全上限（PNG および PDF）:
      - `fileQuality: "standard"`: 最大 8 MP（レンダリングピクセル数 8,000,000）。
      - `fileQuality: "hq"`: 最大 14 MP。
      - `fileQuality: "print"`: 最大 24 MP。
      - PDF はさらに 50 ページが上限です。

  </Accordion>
</AccordionGroup>

## 構文ハイライト

組み込み言語:

`javascript`、`typescript`、`tsx`、`jsx`、`json`、`markdown`、`yaml`、`css`、`html`、`sh`、`python`、`go`、`rust`、`java`、`c`、`cpp`、`csharp`、`php`、`sql`、`docker`、`ruby`、`swift`、`kotlin`、`r`、`dart`、`lua`、`powershell`、`xml`、および `toml`。

一般的なエイリアス（`js`、`ts`、`bash`、`md`、`yml`、`c++`、`dockerfile`、`rb`、`kt`、`ps1` など）は、これらの言語に正規化されます。

より多くの言語（Astro、Vue、Svelte、MDX、GraphQL、Terraform/HCL、Nix、Clojure、Elixir、Haskell、OCaml、Scala、Zig、Solidity、Verilog/VHDL、Fortran、MATLAB、LaTeX、Mermaid、Sass/Less/SCSS、Nginx、Apache、CSV、dotenv、INI、diff など）を利用するには、Diff Viewer Language Pack Plugin をインストールします。

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

Language Pack がなくても、未対応の言語は読みやすいプレーンテキストとしてレンダリングされます。アップストリームのカタログについては、[Diffs Language Pack Plugin](/ja-JP/plugins/reference/diffs-language-pack)および[Shiki の言語](https://shiki.style/languages)を参照してください。

## 出力詳細の契約

成功したすべての結果には `changed` が含まれます。同一の変更前/変更後入力の場合は、アーティファクトを作成せずに `false` を返します。レンダリングされた結果は `true` を返します。

<AccordionGroup>
  <Accordion title="ビューアーフィールド（view モードおよび both モード）">
    - `changed`
    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context`（利用可能な場合は `agentId`、`sessionId`、`messageChannel`、`agentAccountId`）

  </Accordion>
  <Accordion title="ファイルフィールド（file モードおよび both モード）">
    - `changed`
    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path`（メッセージツールとの互換性のため、`filePath` と同じ値）
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
</AccordionGroup>

| モード     | 戻り値                                                                                         |
| -------- | ----------------------------------------------------------------------------------------------- |
| `"view"` | ビューアーフィールドのみ。                                                                             |
| `"file"` | ファイルフィールドのみ。ビューアーアーティファクトは作成されません。                                                           |
| `"both"` | ビューアーフィールドとファイルフィールド。ファイルのレンダリングに失敗した場合でも、ビューアーは `fileError` とともに返されます。 |

### 折りたたまれた未変更セクション

ビューアーには `N unmodified lines` のような行が表示されます。展開コントロールは、レンダリングされた diff に展開可能なコンテキストデータがある場合（通常は変更前/変更後の入力）にのみ表示されます。多くの unified patch では、ハンク内のコンテキスト本文が省略されるため、展開コントロールなしでこの行が表示されることがあります。これは想定どおりの動作であり、バグではありません。`expandUnchanged` は、展開可能なコンテキストが存在する場合にのみ適用されます。

### 複数ファイルのナビゲーション

複数のファイルを変更するパッチでは、先頭に変更ファイルの概要カードが表示されます。これには、合計 `+N` / `-N` 件数、ファイルごとの件数、追加/削除/名前変更のバッジ、および各ファイルへ移動するアンカーリンクが含まれます。レンダリングされた PNG/PDF ファイルでは、ファイルごとのヘッダー件数は維持されますが、静的ファイルでは機能しないため、インタラクティブな表示切り替えコントロールは省略されます。

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

サポートされる `defaults` キー: `fontFamily`、`fontSize`、`lineSpacing`、`layout`、`showLineNumbers`、`diffIndicators`、`wordWrap`、`background`、`theme`、`fileFormat`、`fileQuality`、`fileScale`、`fileMaxWidth`、`mode`、`ttlSeconds`。明示的なツール呼び出しパラメーターは、これらを上書きします。

### 永続的なビューアー URL 設定

<ParamField path="viewerBaseUrl" type="string">
  ツール呼び出しで `baseUrl` が渡されなかった場合に、返されるビューアーリンクに使用される Plugin 所有のフォールバックです。クエリやハッシュを含まない `http` または `https` である必要があります。
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
  `false`: ビューアールートへの非ループバックリクエストは拒否されます。`true`: トークン化されたパスが有効な場合、リモートビューアーが許可されます。
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
- ビューアーのメタデータには、ランダムな 20 桁の 16 進文字からなるアーティファクト ID、ランダムな 48 桁の 16 進文字からなるトークン、`createdAt`/`expiresAt`、および保存された `viewer.html` のパスが格納されます。
- デフォルトのアーティファクト TTL: 30 分。受け入れ可能な最大 TTL: 6 時間。
- 各アーティファクト作成呼び出し後にクリーンアップが随時実行され、期限切れのアーティファクトが削除されます。
- メタデータがない場合、フォールバックのスイープによって 24 時間より古いフォルダーが削除されます。

## ビューアー URL とネットワーク動作

ビューアールート: `/plugins/diffs/view/{artifactId}/{token}`

ビューアーアセット:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js`（diff が言語パックの言語を使用する場合のみ）

ビューアードキュメントは、これらのアセットをビューアー URL からの相対パスで解決するため、オプションの `baseUrl` パスプレフィックスはアセットリクエストにも引き継がれます。

URL の解決順序: ツール呼び出しの `baseUrl`（厳格な検証後）-> Plugin の `viewerBaseUrl` -> デフォルトの local loopback `127.0.0.1`。Gateway のバインドモードが `custom` で、`gateway.customBindHost` が設定されている場合、local loopback の代わりにそのホストが使用されます。

`baseUrl` のルール: `http://` または `https://` である必要があります。クエリとハッシュは拒否されます。オリジンとオプションのベースパスの組み合わせが許可されます。

## セキュリティモデル

<AccordionGroup>
  <Accordion title="ビューアーの堅牢化">
    - デフォルトではループバックのみに制限されます。
    - 厳格な ID およびトークンパターン検証を伴う、トークン化されたビューアーパス。
    - ビューアーレスポンスの CSP: `default-src 'none'`。スクリプト/アセットは同一オリジンからのみ許可され、外部への `connect-src` は許可されません。
    - リモートアクセスが有効な場合のリモートミスのスロットリング: 60 秒間に 40 回失敗すると、60 秒間ロックアウトされます（`429 Too Many Requests`）。

  </Accordion>
  <Accordion title="ファイルレンダリングの堅牢化">
    - スクリーンショットブラウザーのリクエストルーティングはデフォルト拒否です。
    - `http://127.0.0.1/plugins/diffs/assets/*` のローカルビューアーアセットのみが許可されます。
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
    Chrome、Chromium、Edge、Brave の一般的なインストールパスと `PATH` 検索。
  </Step>
</Steps>

一般的なエラーテキスト：`Diff PNG/PDF rendering requires a Chromium-compatible browser...`。Chrome、Chromium、Edge、Brave のいずれかをインストールするか、上記の実行可能ファイルパスオプションのいずれかを設定して修正します。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="入力検証エラー">
    - `Provide patch or both before and after text.` -- `before` と `after` の両方を含めるか、`patch` を指定します。
    - `Provide either patch or before/after input, not both.` -- 入力モードを混在させないでください。
    - `Invalid baseUrl: ...` -- 任意のパスを含む `http(s)` オリジンを使用し、クエリやハッシュは含めないでください。
    - `{field} exceeds maximum size (...)` -- ペイロードサイズを削減します。
    - 大きなパッチの拒否 -- パッチのファイル数または合計行数を削減します。

  </Accordion>
  <Accordion title="ビューアーへのアクセス">
    - ビューアー URL はデフォルトで `127.0.0.1` に解決されます。
    - リモートアクセスでは、Plugin の `viewerBaseUrl` を設定するか、呼び出しごとに `baseUrl` を渡すか、`gateway.customBindHost` とともに `gateway.bind=custom` を使用します。
    - `gateway.trustedProxies` に同一ホストのプロキシ（たとえば Tailscale Serve）用のループバックが含まれている場合、転送されたクライアント IP ヘッダーのない生のループバックビューアーリクエストは、設計どおりフェイルクローズします。
    - このプロキシトポロジでは、添付ファイル用に `mode: "file"`/`"both"` を使用することを推奨します。または、共有可能なビューアーリンク用に `security.allowRemoteViewer` を意図的に有効化し、Plugin の `viewerBaseUrl` またはプロキシの `baseUrl` を設定します。
    - 外部からのビューアーアクセスを意図している場合にのみ、`security.allowRemoteViewer` を有効化してください。

  </Accordion>
  <Accordion title="未変更行の行に展開ボタンがない">
    展開可能なコンテキストを含まないパッチ入力では想定どおりの動作であり、ビューアーの障害ではありません。
  </Accordion>
  <Accordion title="成果物が見つからない">
    - TTL により成果物の有効期限が切れました。
    - トークンまたはパスが変更されました。
    - クリーンアップによって古いデータが削除されました。

  </Accordion>
</AccordionGroup>

## 運用ガイダンス

- canvas でのローカルな対話型レビューには、`mode: "view"` を推奨します。
- 添付ファイルが必要な外部チャットチャンネルには、`mode: "file"` を推奨します。
- デプロイでリモートビューアー URL が必要な場合を除き、`allowRemoteViewer` は無効のままにしてください。
- 機密性の高い差分には、明示的に短い `ttlSeconds` を設定してください。
- 必要でない場合は、差分入力にシークレットを含めないでください。
- チャンネルが画像を強く圧縮する場合（たとえば Telegram や WhatsApp）、PDF 出力（`fileFormat: "pdf"`）を推奨します。

<Note>
差分レンダリングエンジンは [Diffs](https://diffs.com) を利用しています。
</Note>

## 関連項目

- [ブラウザー](/ja-JP/tools/browser)
- [Plugin](/ja-JP/tools/plugin)
- [ツールの概要](/ja-JP/tools)

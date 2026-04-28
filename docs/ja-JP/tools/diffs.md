---
read_when:
    - エージェントにコードや Markdown の編集内容を差分として表示させたい場合
    - canvas 対応の viewer URL またはレンダリング済み diff ファイルが必要な場合
    - 安全なデフォルトを備えた、制御可能な一時 diff アーティファクトが必要な場合
sidebarTitle: Diffs
summary: エージェント向けの読み取り専用 diff ビューアおよびファイルレンダラー（任意の Plugin ツール）
title: 差分
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:41:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8af098a294a4ba56e1a8df3b4f9650802fc53392634fee97b330f03b69e10781
    source_path: tools/diffs.md
    workflow: 15
---

`diffs` は任意の Plugin ツールで、変更内容をエージェント向けの読み取り専用 diff アーティファクトに変換する、短い組み込みシステムガイダンスと補助 Skill を備えています。

受け付ける入力は次のいずれかです。

- `before` と `after` のテキスト
- unified `patch`

返せる出力は次のとおりです。

- canvas 表示用の gateway viewer URL
- メッセージ配信用のレンダリング済みファイルパス（PNG または PDF）
- 1 回の呼び出しで両方の出力

有効にすると、この Plugin は簡潔な使用ガイダンスを system-prompt 空間に先頭追加し、エージェントがより詳しい指示を必要とする場合に備えて詳細な Skill も公開します。

## クイックスタート

<Steps>
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
  <Step title="モードを選ぶ">
    <Tabs>
      <Tab title="view">
        canvas 優先フロー: エージェントは `mode: "view"` で `diffs` を呼び出し、`canvas present` で `details.viewerUrl` を開きます。
      </Tab>
      <Tab title="file">
        チャットファイル配信: エージェントは `mode: "file"` で `diffs` を呼び出し、`message` で `path` または `filePath` を使って `details.filePath` を送信します。
      </Tab>
      <Tab title="both">
        組み合わせ: エージェントは `mode: "both"` で `diffs` を呼び出し、1 回の呼び出しで両方のアーティファクトを取得します。
      </Tab>
    </Tabs>
  </Step>
</Steps>

## 組み込みシステムガイダンスを無効にする

`diffs` ツールは有効のまま、その組み込み system-prompt ガイダンスだけを無効にしたい場合は、`plugins.entries.diffs.hooks.allowPromptInjection` を `false` に設定します。

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

これにより、Plugin、ツール、補助 Skill は利用可能なまま、diffs Plugin の `before_prompt_build` フックだけがブロックされます。

ガイダンスとツールの両方を無効にしたい場合は、代わりに Plugin 自体を無効にしてください。

## 典型的なエージェントワークフロー

<Steps>
  <Step title="diffs を呼び出す">
    エージェントが入力付きで `diffs` ツールを呼び出します。
  </Step>
  <Step title="details を読む">
    エージェントがレスポンスから `details` フィールドを読み取ります。
  </Step>
  <Step title="表示する">
    エージェントは `canvas present` で `details.viewerUrl` を開くか、`message` で `path` または `filePath` を使って `details.filePath` を送信するか、またはその両方を行います。
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
  元のテキスト。`patch` を省略する場合は `after` と組で必須です。
</ParamField>
<ParamField path="after" type="string">
  更新後のテキスト。`patch` を省略する場合は `before` と組で必須です。
</ParamField>
<ParamField path="patch" type="string">
  Unified diff テキスト。`before` および `after` とは排他的です。
</ParamField>
<ParamField path="path" type="string">
  before and after モードで表示するファイル名。
</ParamField>
<ParamField path="lang" type="string">
  before and after モード用の言語上書きヒント。未知の値はプレーンテキストにフォールバックします。
</ParamField>
<ParamField path="title" type="string">
  Viewer タイトルの上書き。
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  出力モード。デフォルトは Plugin デフォルトの `defaults.mode` です。非推奨の別名: `"image"` は `"file"` と同様に動作し、後方互換性のため現在も受け付けます。
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Viewer テーマ。デフォルトは Plugin デフォルトの `defaults.theme` です。
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Diff レイアウト。デフォルトは Plugin デフォルトの `defaults.layout` です。
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  完全なコンテキストが利用できる場合に未変更セクションを展開します。呼び出し単位のオプションのみであり、Plugin デフォルトキーではありません。
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  レンダリング済みファイル形式。デフォルトは Plugin デフォルトの `defaults.fileFormat` です。
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  PNG または PDF レンダリングの品質プリセット。
</ParamField>
<ParamField path="fileScale" type="number">
  デバイススケール上書き（`1`-`4`）。
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  最大レンダリング幅（CSS ピクセル、`640`-`2400`）。
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  viewer およびスタンドアロンファイル出力向けのアーティファクト TTL（秒）。最大 21600。
</ParamField>
<ParamField path="baseUrl" type="string">
  Viewer URL origin の上書き。Plugin の `viewerBaseUrl` を上書きします。`http` または `https` である必要があり、query/hash は不可です。
</ParamField>

<AccordionGroup>
  <Accordion title="レガシー入力別名">
    後方互換性のため現在も受け付けられます。

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="検証と制限">
    - `before` と `after` はそれぞれ最大 512 KiB。
    - `patch` は最大 2 MiB。
    - `path` は最大 2048 バイト。
    - `lang` は最大 128 バイト。
    - `title` は最大 1024 バイト。
    - Patch 複雑度上限: 最大 128 ファイル、合計 120000 行。
    - `patch` と `before` または `after` の同時指定は拒否されます。
    - レンダリング済みファイルの安全制限（PNG と PDF の両方に適用）:
      - `fileQuality: "standard"`: 最大 8 MP（8,000,000 レンダリングピクセル）。
      - `fileQuality: "hq"`: 最大 14 MP（14,000,000 レンダリングピクセル）。
      - `fileQuality: "print"`: 最大 24 MP（24,000,000 レンダリングピクセル）。
      - PDF にはさらに最大 50 ページの制限があります。
  </Accordion>
</AccordionGroup>

## 出力 details コントラクト

このツールは、構造化メタデータを `details` 配下に返します。

<AccordionGroup>
  <Accordion title="Viewer フィールド">
    viewer を作成するモードで共有されるフィールド:

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
  <Accordion title="ファイルフィールド">
    PNG または PDF がレンダリングされた場合のファイルフィールド:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path`（`filePath` と同じ値。message ツール互換用）
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="互換性別名">
    既存の呼び出し元向けに、次も返されます。

    - `format`（`fileFormat` と同じ値）
    - `imagePath`（`filePath` と同じ値）
    - `imageBytes`（`fileBytes` と同じ値）
    - `imageQuality`（`fileQuality` と同じ値）
    - `imageScale`（`fileScale` と同じ値）
    - `imageMaxWidth`（`fileMaxWidth` と同じ値）

  </Accordion>
</AccordionGroup>

モード動作の概要:

| モード     | 返される内容                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Viewer フィールドのみ。                                                                                                    |
| `"file"` | ファイルフィールドのみ。viewer アーティファクトは作成されません。                                                                                  |
| `"both"` | Viewer フィールドに加えてファイルフィールドも返します。ファイルレンダリングに失敗した場合でも、viewer は `fileError` と `imageError` 別名付きで返されます。 |

## 折りたたまれた未変更セクション

- Viewer は `N unmodified lines` のような行を表示できます。
- それらの行に対する展開コントロールは条件付きであり、すべての入力種別で保証されるわけではありません。
- 展開コントロールは、レンダリングされた diff に展開可能なコンテキストデータがある場合に表示されます。これは before and after 入力で一般的です。
- 多くの unified patch 入力では、省略されたコンテキスト本文は解析済み patch hunk に含まれていないため、展開コントロールなしでその行だけが表示されることがあります。これは想定された動作です。
- `expandUnchanged` は、展開可能なコンテキストが存在する場合にのみ適用されます。

## Plugin デフォルト

Plugin 全体のデフォルトは `~/.openclaw/openclaw.json` で設定します。

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

明示的なツールパラメータは、これらのデフォルトを上書きします。

### 永続的な viewer URL 設定

<ParamField path="viewerBaseUrl" type="string">
  ツール呼び出しで `baseUrl` が渡されなかった場合に返される viewer リンク用の、Plugin 所有のフォールバックです。`http` または `https` である必要があり、query/hash は不可です。
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
  `false`: viewer ルートへの非 loopback リクエストは拒否されます。`true`: token 化されたパスが有効であれば、リモート viewer が許可されます。
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

## アーティファクトのライフサイクルと保存先

- アーティファクトは一時サブフォルダー `$TMPDIR/openclaw-diffs` 配下に保存されます。
- Viewer アーティファクトのメタデータには次が含まれます:
  - ランダムなアーティファクト ID（20 桁の 16 進文字）
  - ランダムなトークン（48 桁の 16 進文字）
  - `createdAt` と `expiresAt`
  - 保存された `viewer.html` パス
- 指定がない場合、デフォルトのアーティファクト TTL は 30 分です。
- 受け付けられる viewer TTL の最大値は 6 時間です。
- クリーンアップはアーティファクト作成後に機会があれば実行されます。
- 期限切れアーティファクトは削除されます。
- フォールバッククリーンアップでは、メタデータが欠けている場合に 24 時間以上前の古いフォルダーを削除します。

## Viewer URL とネットワーク動作

Viewer ルート:

- `/plugins/diffs/view/{artifactId}/{token}`

Viewer アセット:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Viewer ドキュメントはそれらのアセットを viewer URL からの相対パスで解決するため、任意の `baseUrl` パス prefix は、それらのアセットリクエストにも保持されます。

URL 構築動作:

- ツール呼び出しで `baseUrl` が指定されていれば、厳格な検証後にそれを使用します。
- それ以外で Plugin の `viewerBaseUrl` が設定されていれば、それを使用します。
- どちらの上書きもない場合、viewer URL は loopback の `127.0.0.1` がデフォルトになります。
- gateway bind mode が `custom` で `gateway.customBindHost` が設定されている場合は、そのホストが使用されます。

`baseUrl` のルール:

- `http://` または `https://` で始まっていなければなりません。
- Query と hash は拒否されます。
- Origin と任意の base path の組み合わせは許可されます。

## セキュリティモデル

<AccordionGroup>
  <Accordion title="Viewer のハードニング">
    - デフォルトでは loopback のみ。
    - 厳格な ID およびトークン検証付きの token 化 viewer パス。
    - Viewer レスポンス CSP:
      - `default-src 'none'`
      - script と asset は self からのみ
      - アウトバウンド `connect-src` なし
    - リモートアクセス有効時のリモート miss スロットリング:
      - 60 秒あたり 40 回の失敗
      - 60 秒のロックアウト（`429 Too Many Requests`）
  </Accordion>
  <Accordion title="ファイルレンダリングのハードニング">
    - スクリーンショットブラウザーのリクエストルーティングは deny-by-default です。
    - `http://127.0.0.1/plugins/diffs/assets/*` のローカル viewer asset のみ許可されます。
    - 外部ネットワークリクエストはブロックされます。
  </Accordion>
</AccordionGroup>

## file モードのブラウザー要件

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
  <Step title="プラットフォームフォールバック">
    プラットフォームのコマンド/パス検出フォールバック。
  </Step>
</Steps>

よくある失敗メッセージ:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Chrome、Chromium、Edge、Brave のいずれかをインストールするか、上記の実行ファイルパスオプションのいずれかを設定して修正してください。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="入力検証エラー">
    - `Provide patch or both before and after text.` — `before` と `after` の両方を含めるか、`patch` を指定してください。
    - `Provide either patch or before/after input, not both.` — 入力モードを混在させないでください。
    - `Invalid baseUrl: ...` — query/hash なしの、任意の path 付き `http(s)` origin を使用してください。
    - `{field} exceeds maximum size (...)` — ペイロードサイズを減らしてください。
    - 大きな patch による拒否 — patch のファイル数または合計行数を減らしてください。
  </Accordion>
  <Accordion title="Viewer の到達性">
    - Viewer URL はデフォルトで `127.0.0.1` に解決されます。
    - リモートアクセスのシナリオでは、次のいずれかを行ってください:
      - Plugin の `viewerBaseUrl` を設定する、または
      - ツール呼び出しごとに `baseUrl` を渡す、または
      - `gateway.bind=custom` と `gateway.customBindHost` を使用する
    - `gateway.trustedProxies` に、同一ホスト上のプロキシ（たとえば Tailscale Serve）向け loopback が含まれている場合、転送された client-IP ヘッダーのない生の loopback viewer リクエストは設計どおり fail closed します。
    - そのプロキシ構成では:
      - 添付ファイルだけが必要なら `mode: "file"` または `mode: "both"` を優先する、または
      - 共有可能な viewer URL が必要なら、意図的に `security.allowRemoteViewer` を有効にし、Plugin の `viewerBaseUrl` を設定するか、プロキシ/公開用の `baseUrl` を渡す
    - `security.allowRemoteViewer` は、外部 viewer アクセスを意図している場合にのみ有効にしてください。
  </Accordion>
  <Accordion title="未変更行の行に展開ボタンがない">
    これは、patch 入力で patch に展開可能なコンテキストが含まれていない場合に発生することがあります。これは想定された動作であり、viewer の障害を示すものではありません。
  </Accordion>
  <Accordion title="アーティファクトが見つからない">
    - TTL によりアーティファクトの有効期限が切れた。
    - トークンまたはパスが変更された。
    - クリーンアップによって古いデータが削除された。
  </Accordion>
</AccordionGroup>

## 運用ガイダンス

- canvas でのローカル対話レビューには `mode: "view"` を優先してください。
- 添付ファイルが必要なアウトバウンドチャットチャネルには `mode: "file"` を優先してください。
- デプロイメントでリモート viewer URL が必要でない限り、`allowRemoteViewer` は無効のままにしてください。
- 機密性の高い diff には、明示的に短い `ttlSeconds` を設定してください。
- 必要がない限り、diff 入力に secret を含めないでください。
- チャネルが画像を強く圧縮する場合（たとえば Telegram や WhatsApp）は、PDF 出力（`fileFormat: "pdf"`）を優先してください。

<Note>
Diff レンダリングエンジンは [Diffs](https://diffs.com) により提供されています。
</Note>

## 関連

- [Browser](/ja-JP/tools/browser)
- [Plugins](/ja-JP/tools/plugin)
- [Tools overview](/ja-JP/tools)

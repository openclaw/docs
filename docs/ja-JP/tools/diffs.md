---
read_when:
    - エージェントにコードやMarkdownの編集内容を差分として表示させたい
    - キャンバス対応のビューアー URL またはレンダリング済みの差分ファイルが必要です
    - 安全なデフォルト設定を備えた、制御された一時的な差分アーティファクトが必要です
sidebarTitle: Diffs
summary: エージェント向けの読み取り専用 diff ビューアーとファイルレンダラー（任意の Plugin ツール）
title: 差分
x-i18n:
    generated_at: "2026-04-30T05:37:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d8938b11f6bc612168057b7f4f5ceaafb22c2445e015fb746795b2e93f033e5
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` は、短い組み込みシステムガイダンスと付属 Skills を備えた任意の Plugin ツールで、変更内容をエージェント向けの読み取り専用 diff アーティファクトに変換します。

次のいずれかを受け付けます。

- `before` と `after` のテキスト
- 統合 `patch`

返せるものは次のとおりです。

- canvas 表示用の Gateway ビューア URL
- メッセージ配信用のレンダリング済みファイルパス（PNG または PDF）
- 1 回の呼び出しで両方の出力

有効にすると、この Plugin はシステムプロンプト領域に簡潔な使用ガイダンスを先頭追加し、エージェントがより詳しい手順を必要とする場合に備えて詳細な Skills も公開します。

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
        canvas 優先のフロー: エージェントは `mode: "view"` で `diffs` を呼び出し、`canvas present` で `details.viewerUrl` を開きます。
      </Tab>
      <Tab title="file">
        チャットファイル配信: エージェントは `mode: "file"` で `diffs` を呼び出し、`path` または `filePath` を使用して `message` で `details.filePath` を送信します。
      </Tab>
      <Tab title="both">
        組み合わせ: エージェントは `mode: "both"` で `diffs` を呼び出し、1 回の呼び出しで両方のアーティファクトを取得します。
      </Tab>
    </Tabs>
  </Step>
</Steps>

## 組み込みシステムガイダンスを無効にする

`diffs` ツールを有効なままにしつつ、組み込みのシステムプロンプトガイダンスを無効にしたい場合は、`plugins.entries.diffs.hooks.allowPromptInjection` を `false` に設定します。

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

これにより、diffs Plugin の `before_prompt_build` フックをブロックしつつ、Plugin、ツール、付属 Skills は利用可能なままになります。

ガイダンスとツールの両方を無効にしたい場合は、代わりに Plugin を無効にしてください。

## 典型的なエージェントワークフロー

<Steps>
  <Step title="diffs を呼び出す">
    エージェントが入力を指定して `diffs` ツールを呼び出します。
  </Step>
  <Step title="details を読む">
    エージェントがレスポンスから `details` フィールドを読み取ります。
  </Step>
  <Step title="提示する">
    エージェントは `canvas present` で `details.viewerUrl` を開くか、`path` または `filePath` を使用して `message` で `details.filePath` を送信するか、その両方を行います。
  </Step>
</Steps>

## 入力例

<Tabs>
  <Tab title="Before と after">
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

明記されていない限り、すべてのフィールドは任意です。

<ParamField path="before" type="string">
  元のテキスト。`patch` が省略されている場合、`after` とともに必須です。
</ParamField>
<ParamField path="after" type="string">
  更新後のテキスト。`patch` が省略されている場合、`before` とともに必須です。
</ParamField>
<ParamField path="patch" type="string">
  統合 diff テキスト。`before` および `after` とは相互排他的です。
</ParamField>
<ParamField path="path" type="string">
  before と after モードで表示するファイル名。
</ParamField>
<ParamField path="lang" type="string">
  before と after モードの言語上書きヒント。不明な値はプレーンテキストにフォールバックします。
</ParamField>
<ParamField path="title" type="string">
  ビューアタイトルの上書き。
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  出力モード。Plugin のデフォルト `defaults.mode` が既定値です。非推奨のエイリアス: `"image"` は `"file"` と同様に動作し、後方互換性のため引き続き受け付けられます。
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  ビューアテーマ。Plugin のデフォルト `defaults.theme` が既定値です。
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Diff レイアウト。Plugin のデフォルト `defaults.layout` が既定値です。
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  完全なコンテキストが利用可能な場合に、変更されていないセクションを展開します。呼び出しごとのオプションのみです（Plugin のデフォルトキーではありません）。
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  レンダリング済みファイル形式。Plugin のデフォルト `defaults.fileFormat` が既定値です。
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  PNG または PDF レンダリング用の品質プリセット。
</ParamField>
<ParamField path="fileScale" type="number">
  デバイススケールの上書き（`1`-`4`）。
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  CSS ピクセルでの最大レンダリング幅（`640`-`2400`）。
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  ビューアおよびスタンドアロンファイル出力のアーティファクト TTL（秒）。最大 21600。
</ParamField>
<ParamField path="baseUrl" type="string">
  ビューア URL オリジンの上書き。Plugin の `viewerBaseUrl` を上書きします。`http` または `https` である必要があり、クエリやハッシュは使用できません。
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
    - `before` と `after` はそれぞれ最大 512 KiB。
    - `patch` は最大 2 MiB。
    - `path` は最大 2048 バイト。
    - `lang` は最大 128 バイト。
    - `title` は最大 1024 バイト。
    - パッチ複雑度の上限: 最大 128 ファイル、合計 120000 行。
    - `patch` と `before` または `after` を一緒に指定すると拒否されます。
    - レンダリング済みファイルの安全制限（PNG と PDF に適用）:
      - `fileQuality: "standard"`: 最大 8 MP（8,000,000 レンダリングピクセル）。
      - `fileQuality: "hq"`: 最大 14 MP（14,000,000 レンダリングピクセル）。
      - `fileQuality: "print"`: 最大 24 MP（24,000,000 レンダリングピクセル）。
      - PDF には最大 50 ページの制限もあります。

  </Accordion>
</AccordionGroup>

## 出力 details 契約

このツールは `details` の下に構造化メタデータを返します。

<AccordionGroup>
  <Accordion title="ビューアフィールド">
    ビューアを作成するモードで共有されるフィールド:

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
    PNG または PDF がレンダリングされる場合のファイルフィールド:

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
  <Accordion title="互換性エイリアス">
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

| モード   | 返される内容                                                                                                           |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | ビューアーフィールドのみ。                                                                                             |
| `"file"` | ファイルフィールドのみ。ビューアーアーティファクトは含まれません。                                                       |
| `"both"` | ビューアーフィールドとファイルフィールド。ファイルのレンダリングに失敗した場合でも、ビューアーは `fileError` と `imageError` エイリアス付きで返されます。 |

## 折りたたまれた未変更セクション

- ビューアーは `N unmodified lines` のような行を表示できます。
- それらの行の展開コントロールは条件付きであり、すべての入力種別で保証されるわけではありません。
- レンダリングされた diff に展開可能なコンテキストデータがある場合に展開コントロールが表示されます。これは変更前と変更後の入力では一般的です。
- 多くの unified patch 入力では、省略されたコンテキスト本文は解析済み patch hunk 内で利用できないため、展開コントロールなしで行が表示されることがあります。これは想定された動作です。
- `expandUnchanged` は展開可能なコンテキストが存在する場合にのみ適用されます。

## Plugin デフォルト

Plugin 全体のデフォルトを `~/.openclaw/openclaw.json` に設定します:

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

明示的なツールパラメーターはこれらのデフォルトを上書きします。

### 永続的なビューアー URL 設定

<ParamField path="viewerBaseUrl" type="string">
  ツール呼び出しが `baseUrl` を渡さない場合に返されるビューアーリンク用の、Plugin 所有のフォールバック。`http` または `https` である必要があり、クエリ/ハッシュは使用できません。
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

- アーティファクトは一時サブフォルダー `$TMPDIR/openclaw-diffs` の下に保存されます。
- ビューアーアーティファクトのメタデータには次が含まれます:
  - ランダムなアーティファクト ID (20 桁の 16 進文字)
  - ランダムなトークン (48 桁の 16 進文字)
  - `createdAt` と `expiresAt`
  - 保存された `viewer.html` パス
- 指定されていない場合、デフォルトのアーティファクト TTL は 30 分です。
- 受け入れ可能な最大ビューアー TTL は 6 時間です。
- クリーンアップはアーティファクト作成後に機会的に実行されます。
- 期限切れのアーティファクトは削除されます。
- メタデータがない場合、フォールバッククリーンアップは 24 時間より古い古いフォルダーを削除します。

## ビューアー URL とネットワーク動作

ビューアールート:

- `/plugins/diffs/view/{artifactId}/{token}`

ビューアーアセット:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

ビューアードキュメントはそれらのアセットをビューアー URL からの相対パスとして解決するため、任意の `baseUrl` パスプレフィックスは両方のアセットリクエストでも保持されます。

URL 構築動作:

- ツール呼び出しの `baseUrl` が指定されている場合、厳密な検証後に使用されます。
- そうでなく Plugin の `viewerBaseUrl` が設定されている場合、それが使用されます。
- どちらの上書きもない場合、ビューアー URL はデフォルトでループバック `127.0.0.1` になります。
- Gateway のバインドモードが `custom` で `gateway.customBindHost` が設定されている場合、そのホストが使用されます。

`baseUrl` ルール:

- `http://` または `https://` である必要があります。
- クエリとハッシュは拒否されます。
- オリジンに任意のベースパスを加えたものが許可されます。

## セキュリティモデル

<AccordionGroup>
  <Accordion title="ビューアー強化">
    - デフォルトではループバックのみ。
    - 厳密な ID とトークン検証を備えたトークン化ビューアーパス。
    - ビューアーレスポンス CSP:
      - `default-src 'none'`
      - スクリプトとアセットは self のみ
      - 外向きの `connect-src` なし
    - リモートアクセスが有効な場合のリモートミスのスロットリング:
      - 60 秒あたり 40 回の失敗
      - 60 秒のロックアウト (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="ファイルレンダリングの強化">
    - スクリーンショット用ブラウザーのリクエストルーティングはデフォルト拒否です。
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
    プラットフォームのコマンド/パス検出フォールバック。
  </Step>
</Steps>

一般的な失敗メッセージ:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Chrome、Chromium、Edge、または Brave をインストールするか、上記の実行ファイルパスオプションのいずれかを設定して修正します。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="入力検証エラー">
    - `Provide patch or both before and after text.` — `before` と `after` の両方を含めるか、`patch` を指定します。
    - `Provide either patch or before/after input, not both.` — 入力モードを混在させないでください。
    - `Invalid baseUrl: ...` — 任意のパスを含めた `http(s)` オリジンを使用し、クエリ/ハッシュは含めません。
    - `{field} exceeds maximum size (...)` — ペイロードサイズを減らします。
    - 大きなパッチの拒否 — パッチファイル数または総行数を減らします。

  </Accordion>
  <Accordion title="ビューアーのアクセシビリティ">
    - ビューアー URL はデフォルトで `127.0.0.1` に解決されます。
    - リモートアクセスのシナリオでは、次のいずれかを行います:
      - Plugin `viewerBaseUrl` を設定する、または
      - ツール呼び出しごとに `baseUrl` を渡す、または
      - `gateway.bind=custom` と `gateway.customBindHost` を使用する
    - `gateway.trustedProxies` に同一ホストプロキシ（たとえば Tailscale Serve）の loopback が含まれている場合、転送されたクライアント IP ヘッダーのない raw loopback ビューアーリクエストは設計上 fail closed します。
    - そのプロキシトポロジーでは:
      - 添付ファイルだけが必要な場合は `mode: "file"` または `mode: "both"` を優先する、または
      - 共有可能なビューアー URL が必要な場合は、意図的に `security.allowRemoteViewer` を有効にし、Plugin `viewerBaseUrl` を設定するか、プロキシ/公開 `baseUrl` を渡す
    - 外部ビューアーアクセスを意図している場合にのみ `security.allowRemoteViewer` を有効にしてください。

  </Accordion>
  <Accordion title="変更されていない行の行に展開ボタンがない">
    これは、パッチに展開可能なコンテキストが含まれていない場合に、パッチ入力で発生することがあります。これは想定どおりであり、ビューアーの失敗を示すものではありません。
  </Accordion>
  <Accordion title="アーティファクトが見つかりません">
    - TTL によりアーティファクトの期限が切れました。
    - トークンまたはパスが変更されました。
    - クリーンアップにより古いデータが削除されました。

  </Accordion>
</AccordionGroup>

## 運用ガイダンス

- canvas でのローカル対話型レビューには `mode: "view"` を優先します。
- 添付ファイルが必要な送信用チャットチャネルには `mode: "file"` を優先します。
- デプロイでリモートビューアー URL が必要でない限り、`allowRemoteViewer` は無効のままにします。
- 機密性の高い diff には、明示的に短い `ttlSeconds` を設定します。
- 必要でない場合は、diff 入力にシークレットを送信しないでください。
- チャネルが画像を強く圧縮する場合（たとえば Telegram や WhatsApp）、PDF 出力（`fileFormat: "pdf"`）を優先します。

<Note>
diff レンダリングエンジンは [Diffs](https://diffs.com) により提供されています。
</Note>

## 関連

- [ブラウザー](/ja-JP/tools/browser)
- [Plugins](/ja-JP/tools/plugin)
- [ツール概要](/ja-JP/tools)

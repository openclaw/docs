---
read_when:
    - エージェントにコードや Markdown の編集を差分として表示させたい場合
    - canvas 対応の viewer URL またはレンダリング済み diff ファイルが必要な場合
    - 安全なデフォルトを備えた、制御可能で一時的な差分 artifact が必要な場合
summary: エージェント向けの読み取り専用 diff ビューアーおよびファイルレンダラー（任意の plugin tool）
title: 差分
x-i18n:
    generated_at: "2026-04-24T05:24:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe32441699b06dd27580b7e80afcfa3d1e466d7e2b74e52e60b327e73325eeca
    source_path: tools/diffs.md
    workflow: 15
---

`diffs` は任意の plugin tool で、短い組み込み system ガイダンスと、変更内容をエージェント向けの読み取り専用 diff artifact に変換する companion skill を備えています。

受け付ける入力は次のいずれかです。

- `before` と `after` のテキスト
- unified `patch`

返せる出力は次のとおりです。

- canvas 表示用の gateway viewer URL
- メッセージ配信用のレンダリング済みファイルパス（PNG または PDF）
- 1 回の呼び出しで両方の出力

有効化すると、この plugin は簡潔な使用ガイダンスを system-prompt 空間に先頭追加し、さらにエージェントがより詳しい手順を必要とするケース向けに詳細な skill も公開します。

## クイックスタート

1. plugin を有効化します。
2. canvas 優先フローには `mode: "view"` で `diffs` を呼び出します。
3. チャットのファイル配信フローには `mode: "file"` で `diffs` を呼び出します。
4. 両方の artifact が必要な場合は `mode: "both"` で呼び出します。

## plugin を有効にする

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

## 組み込み system ガイダンスを無効にする

`diffs` tool は有効のまま、その組み込み system-prompt ガイダンスだけを無効にしたい場合は、`plugins.entries.diffs.hooks.allowPromptInjection` を `false` に設定します。

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

これにより、plugin、tool、companion skill は利用可能なまま、diffs plugin の `before_prompt_build` hook がブロックされます。

ガイダンスと tool の両方を無効にしたい場合は、代わりに plugin 自体を無効にしてください。

## 典型的なエージェントワークフロー

1. エージェントが `diffs` を呼び出します。
2. エージェントが `details` フィールドを読み取ります。
3. その後、エージェントは次のいずれかを行います。
   - `canvas present` で `details.viewerUrl` を開く
   - `message` で `path` または `filePath` を使って `details.filePath` を送信する
   - 両方行う

## 入力例

Before と after:

```json
{
  "before": "# Hello\n\nOne",
  "after": "# Hello\n\nTwo",
  "path": "docs/example.md",
  "mode": "view"
}
```

Patch:

```json
{
  "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
  "mode": "both"
}
```

## tool 入力リファレンス

特記がない限り、すべてのフィールドは任意です。

- `before` (`string`): 元のテキスト。`patch` を省略する場合は `after` と組で必須です。
- `after` (`string`): 更新後のテキスト。`patch` を省略する場合は `before` と組で必須です。
- `patch` (`string`): unified diff テキスト。`before` および `after` とは排他的です。
- `path` (`string`): before/after モード用の表示ファイル名。
- `lang` (`string`): before/after モード用の言語上書きヒント。不明な値は plain text にフォールバックします。
- `title` (`string`): viewer タイトルの上書き。
- `mode` (`"view" | "file" | "both"`): 出力モード。デフォルトは plugin のデフォルト `defaults.mode` です。
  非推奨エイリアス: `"image"` は `"file"` と同様に動作し、後方互換性のため引き続き受け付けられます。
- `theme` (`"light" | "dark"`): viewer テーマ。デフォルトは plugin のデフォルト `defaults.theme` です。
- `layout` (`"unified" | "split"`): diff レイアウト。デフォルトは plugin のデフォルト `defaults.layout` です。
- `expandUnchanged` (`boolean`): 完全なコンテキストが利用可能な場合に変更なしセクションを展開します。呼び出し単位のオプションのみで、plugin デフォルト key ではありません。
- `fileFormat` (`"png" | "pdf"`): レンダリング済みファイル形式。デフォルトは plugin のデフォルト `defaults.fileFormat` です。
- `fileQuality` (`"standard" | "hq" | "print"`): PNG または PDF レンダリングの品質プリセット。
- `fileScale` (`number`): デバイススケール上書き（`1`-`4`）。
- `fileMaxWidth` (`number`): CSS ピクセル単位の最大レンダリング幅（`640`-`2400`）。
- `ttlSeconds` (`number`): viewer およびスタンドアロンファイル出力の artifact TTL（秒）。デフォルトは 1800、最大は 21600 です。
- `baseUrl` (`string`): viewer URL origin の上書き。plugin の `viewerBaseUrl` を上書きします。`http` または `https` でなければならず、query/hash は不可です。

後方互換性のため、従来の入力エイリアスも引き続き受け付けます。

- `format` -> `fileFormat`
- `imageFormat` -> `fileFormat`
- `imageQuality` -> `fileQuality`
- `imageScale` -> `fileScale`
- `imageMaxWidth` -> `fileMaxWidth`

検証と制限:

- `before` と `after` はそれぞれ最大 512 KiB。
- `patch` は最大 2 MiB。
- `path` は最大 2048 byte。
- `lang` は最大 128 byte。
- `title` は最大 1024 byte。
- Patch 複雑度上限: 最大 128 ファイル、合計 120000 行。
- `patch` と `before` または `after` を同時に指定すると拒否されます。
- レンダリング済みファイルの安全制限（PNG と PDF の両方に適用）:
  - `fileQuality: "standard"`: 最大 8 MP（8,000,000 レンダリングピクセル）。
  - `fileQuality: "hq"`: 最大 14 MP（14,000,000 レンダリングピクセル）。
  - `fileQuality: "print"`: 最大 24 MP（24,000,000 レンダリングピクセル）。
  - PDF にはさらに最大 50 ページの制限があります。

## 出力 details 契約

tool は `details` 配下に構造化メタデータを返します。

viewer を作成するモードで共通のフィールド:

- `artifactId`
- `viewerUrl`
- `viewerPath`
- `title`
- `expiresAt`
- `inputKind`
- `fileCount`
- `mode`
- `context`（利用可能な場合は `agentId`, `sessionId`, `messageChannel`, `agentAccountId`）

PNG または PDF がレンダリングされたときのファイルフィールド:

- `artifactId`
- `expiresAt`
- `filePath`
- `path`（`filePath` と同じ値。message tool 互換性のため）
- `fileBytes`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`

既存 caller 向けに、互換エイリアスも返されます。

- `format`（`fileFormat` と同じ値）
- `imagePath`（`filePath` と同じ値）
- `imageBytes`（`fileBytes` と同じ値）
- `imageQuality`（`fileQuality` と同じ値）
- `imageScale`（`fileScale` と同じ値）
- `imageMaxWidth`（`fileMaxWidth` と同じ値）

モード動作の要約:

- `mode: "view"`: viewer フィールドのみ。
- `mode: "file"`: ファイルフィールドのみで、viewer artifact はなし。
- `mode: "both"`: viewer フィールドとファイルフィールドの両方。ファイルレンダリングに失敗しても、viewer は `fileError` と互換エイリアス `imageError` を付けて返されます。

## 折りたたまれた変更なしセクション

- viewer は `N unmodified lines` のような行を表示できます。
- それらの行の展開コントロールは条件付きであり、すべての入力種別で保証されるものではありません。
- 展開コントロールは、レンダリングされた diff に展開可能なコンテキストデータがある場合に表示されます。これは通常、before/after 入力で発生します。
- 多くの unified patch 入力では、省略されたコンテキスト本文は解析済み patch hunk 内で利用できないため、その行は展開コントロールなしで表示されることがあります。これは想定された動作です。
- `expandUnchanged` は、展開可能なコンテキストが存在する場合にのみ適用されます。

## plugin デフォルト

plugin 全体のデフォルトは `~/.openclaw/openclaw.json` で設定します。

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

明示的な tool パラメーターは、これらのデフォルトを上書きします。

永続 viewer URL 設定:

- `viewerBaseUrl` (`string`, 任意)
  - tool 呼び出しで `baseUrl` が渡されない場合に、返される viewer link に対して使われる plugin 所有のフォールバックです。
  - `http` または `https` でなければならず、query/hash は不可です。

例:

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

- `security.allowRemoteViewer` (`boolean`, デフォルト `false`)
  - `false`: viewer route への non-loopback リクエストは拒否されます。
  - `true`: token 化された path が有効であれば、リモート viewer が許可されます。

例:

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

## artifact ライフサイクルと保存

- artifact は temp サブフォルダー `$TMPDIR/openclaw-diffs` に保存されます。
- viewer artifact メタデータには次が含まれます。
  - ランダム artifact ID（20 hex 文字）
  - ランダム token（48 hex 文字）
  - `createdAt` と `expiresAt`
  - 保存された `viewer.html` パス
- artifact TTL が指定されない場合、デフォルトは 30 分です。
- 受け付ける viewer TTL の最大値は 6 時間です。
- クリーンアップは artifact 作成後に opportunistic に実行されます。
- 期限切れ artifact は削除されます。
- metadata がない場合、フォールバッククリーンアップは 24 時間より古い stale フォルダーを削除します。

## viewer URL とネットワーク動作

Viewer route:

- `/plugins/diffs/view/{artifactId}/{token}`

Viewer assets:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

viewer ドキュメントは、それらの asset を viewer URL からの相対パスで解決するため、任意の `baseUrl` パス prefix は asset リクエストにも保持されます。

URL 構築動作:

- tool 呼び出しの `baseUrl` が指定されていれば、厳格な検証後にそれが使われます。
- それ以外で plugin の `viewerBaseUrl` が設定されていれば、それが使われます。
- どちらの上書きもない場合、viewer URL は loopback `127.0.0.1` がデフォルトになります。
- gateway bind mode が `custom` で、`gateway.customBindHost` が設定されている場合は、その host が使われます。

`baseUrl` ルール:

- `http://` または `https://` で始まる必要があります。
- Query と hash は拒否されます。
- Origin と任意の base path が許可されます。

## セキュリティモデル

Viewer hardening:

- デフォルトで loopback のみ。
- 厳格な ID と token 検証を行う token 化 viewer path。
- Viewer レスポンス CSP:
  - `default-src 'none'`
  - script と asset は self からのみ
  - outbound `connect-src` なし
- リモートアクセス有効時の remote miss throttling:
  - 60 秒あたり 40 回の失敗
  - 60 秒のロックアウト（`429 Too Many Requests`）

ファイルレンダリング hardening:

- スクリーンショットブラウザーの request ルーティングは deny-by-default です。
- `http://127.0.0.1/plugins/diffs/assets/*` からのローカル viewer asset のみ許可されます。
- 外部ネットワークリクエストはブロックされます。

## file モードのブラウザー要件

`mode: "file"` と `mode: "both"` には Chromium-compatible browser が必要です。

解決順序:

1. OpenClaw config 内の `browser.executablePath`。
2. 環境変数:
   - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
   - `BROWSER_EXECUTABLE_PATH`
   - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. プラットフォームごとのコマンド/パス探索フォールバック。

よくある失敗メッセージ:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Chrome、Chromium、Edge、Brave をインストールするか、上記いずれかの executable path オプションを設定して修正してください。

## トラブルシューティング

入力検証エラー:

- `Provide patch or both before and after text.`
  - `before` と `after` の両方を含めるか、`patch` を指定してください。
- `Provide either patch or before/after input, not both.`
  - 入力モードを混在させないでください。
- `Invalid baseUrl: ...`
  - query/hash のない、任意 path 付き `http(s)` origin を使ってください。
- `{field} exceeds maximum size (...)`
  - ペイロードサイズを減らしてください。
- 大きすぎる patch の拒否
  - patch のファイル数または総行数を減らしてください。

viewer アクセス性の問題:

- viewer URL はデフォルトで `127.0.0.1` に解決されます。
- リモートアクセスのシナリオでは、次のいずれかを使ってください。
  - plugin の `viewerBaseUrl` を設定する
  - tool 呼び出しごとに `baseUrl` を渡す
  - `gateway.bind=custom` と `gateway.customBindHost` を使う
- `gateway.trustedProxies` に、同一ホスト proxy（たとえば Tailscale Serve）向けの loopback が含まれている場合、forwarded client-IP header のない生の loopback viewer リクエストは設計上 fail closed します。
- その proxy トポロジーでは:
  - 添付ファイルだけが必要なら `mode: "file"` または `mode: "both"` を優先する
  - 共有可能な viewer URL が必要なら、意図的に `security.allowRemoteViewer` を有効化し、plugin の `viewerBaseUrl` を設定するか、proxy/public な `baseUrl` を渡してください
- `security.allowRemoteViewer` は、外部 viewer アクセスを意図している場合にのみ有効化してください。

変更なし行の行に展開ボタンがない:

- patch 入力で、patch が展開可能なコンテキストを持たない場合に起こりえます。
- これは想定された動作であり、viewer の失敗を示すものではありません。

artifact が見つからない:

- TTL により artifact の期限が切れました。
- token または path が変更されました。
- クリーンアップにより stale データが削除されました。

## 運用ガイダンス

- canvas でのローカル対話レビューには `mode: "view"` を優先してください。
- 添付ファイルが必要な外向きチャットチャンネルには `mode: "file"` を優先してください。
- デプロイでリモート viewer URL が必要な場合を除き、`allowRemoteViewer` は無効のままにしてください。
- 機密性の高い diff には、明示的に短い `ttlSeconds` を設定してください。
- 必要でない場合は、diff 入力に secret を含めないでください。
- チャンネルが画像を強く圧縮する場合（たとえば Telegram や WhatsApp）は、PDF 出力（`fileFormat: "pdf"`）を優先してください。

Diff レンダリングエンジン:

- [Diffs](https://diffs.com) を利用しています。

## 関連 docs

- [Tools overview](/ja-JP/tools)
- [Plugins](/ja-JP/tools/plugin)
- [Browser](/ja-JP/tools/browser)

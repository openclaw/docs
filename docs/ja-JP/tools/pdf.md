---
read_when:
    - エージェントから PDF を分析したい
    - 正確な pdf ツールのパラメータと制限が必要です
    - ネイティブ PDF モードと抽出フォールバックをデバッグしています
summary: ネイティブプロバイダー対応と抽出フォールバックで1つ以上のPDFドキュメントを分析する
title: PDFツール
x-i18n:
    generated_at: "2026-06-27T13:15:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6cce4328a7457f30b8c64abdcfa94b6a5d5649c2bcdfde3187288b11a0e154b1
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` は 1 つ以上の PDF ドキュメントを分析し、テキストを返します。

クイック動作:

- Anthropic と Google モデルプロバイダー向けのネイティブプロバイダーモード。
- その他のプロバイダー向けの抽出フォールバックモード (まずテキストを抽出し、必要に応じてページ画像を抽出)。
- 単一 (`pdf`) または複数 (`pdfs`) の入力に対応し、1 回の呼び出しにつき最大 10 個の PDF。

## 利用可否

このツールは、OpenClaw がエージェント用に PDF 対応モデル設定を解決できる場合にのみ登録されます。

1. `agents.defaults.pdfModel`
2. `agents.defaults.imageModel` へのフォールバック
3. エージェントの解決済みセッション/デフォルトモデルへのフォールバック
4. ネイティブ PDF プロバイダーが認証に基づく場合、汎用画像フォールバック候補より優先

使用可能なモデルを解決できない場合、`pdf` ツールは公開されません。

利用可否に関する注記:

- フォールバックチェーンは認証を考慮します。設定済みの `provider/model` は、
  OpenClaw がそのエージェントに対して実際にそのプロバイダーを認証できる場合のみ有効です。
- ネイティブ PDF プロバイダーは現在 **Anthropic** と **Google** です。
- 解決済みのセッション/デフォルトプロバイダーに、設定済みの vision/PDF
  モデルがすでにある場合、PDF ツールは他の認証済みプロバイダーにフォールバックする前にそれを再利用します。

## 入力リファレンス

<ParamField path="pdf" type="string">
1 つの PDF パスまたは URL。
</ParamField>

<ParamField path="pdfs" type="string[]">
複数の PDF パスまたは URL。合計 10 個まで。
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
分析プロンプト。
</ParamField>

<ParamField path="pages" type="string">
`1-5` や `1,3,7-9` のようなページフィルター。
</ParamField>

<ParamField path="password" type="string">
抽出フォールバックモードで暗号化 PDF に使うパスワード。
</ParamField>

<ParamField path="model" type="string">
`provider/model` 形式の任意のモデル上書き。
</ParamField>

<ParamField path="maxBytesMb" type="number">
PDF ごとのサイズ上限 (MB)。デフォルトは `agents.defaults.pdfMaxBytesMb` または `10`。
</ParamField>

入力に関する注記:

- `pdf` と `pdfs` は読み込み前にマージされ、重複排除されます。
- PDF 入力が指定されていない場合、ツールはエラーになります。
- `pages` は 1 始まりのページ番号として解析され、重複排除、ソートされ、設定済みの最大ページ数に制限されます。
- `password` はリクエスト内のすべての PDF に適用され、抽出フォールバックモードでのみ使用されます。
- `maxBytesMb` のデフォルトは `agents.defaults.pdfMaxBytesMb` または `10` です。

## 対応 PDF 参照

- ローカルファイルパス (`~` 展開を含む)
- `file://` URL
- `http://` および `https://` URL
- `media://inbound/<id>` などの OpenClaw 管理のインバウンド参照

参照に関する注記:

- その他の URI スキーム (例: `ftp://`) は `unsupported_pdf_reference` で拒否されます。
- サンドボックスモードでは、リモートの `http(s)` URL は拒否されます。
- ワークスペース限定ファイルポリシーが有効な場合、許可されたルート外のローカルファイルパスは拒否されます。
- 管理対象のインバウンド参照と、OpenClaw のインバウンドメディアストア配下の再生パスは、ワークスペース限定ファイルポリシーでも許可されます。

## 実行モード

### ネイティブプロバイダーモード

ネイティブモードは、プロバイダー `anthropic` と `google` に対して使用されます。
このツールは生の PDF バイトをプロバイダー API に直接送信します。

ネイティブモードの制限:

- `pages` はサポートされません。設定されている場合、ツールはエラーを返します。
- `password` はサポートされません。暗号化 PDF を分析するには非ネイティブモデルを使用してください。
- 複数 PDF 入力に対応しています。各 PDF は、プロンプトの前にネイティブドキュメントブロック /
  インライン PDF パートとして送信されます。

### 抽出フォールバックモード

フォールバックモードは非ネイティブプロバイダーに対して使用されます。

フロー:

1. 選択されたページからテキストを抽出します (最大 `agents.defaults.pdfMaxPages`、デフォルト `20`)。
2. 抽出されたテキストの長さが `200` 文字未満の場合、選択されたページを PNG 画像としてレンダリングして含めます。
3. 抽出されたコンテンツとプロンプトを選択されたモデルに送信します。

フォールバックの詳細:

- ページ画像抽出では `4,000,000` のピクセル予算を使用します。
- 暗号化 PDF はトップレベルの `password` パラメーターで開けます。
- 対象モデルが画像入力に対応しておらず、抽出可能なテキストもない場合、ツールはエラーになります。
- テキスト抽出には成功したものの、画像抽出によりテキスト専用モデルで vision が必要になる場合、
  OpenClaw はレンダリング画像を破棄し、抽出済みテキストで続行します。
- 抽出フォールバックは同梱の `document-extract` Plugin を使用します。この Plugin は
  PDFium WebAssembly を通じてテキスト抽出と画像レンダリングを提供する
  `clawpdf` を所有します。

## 設定

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

すべてのフィールド詳細については、[設定リファレンス](/ja-JP/gateway/configuration-reference) を参照してください。

## 出力の詳細

このツールは `content[0].text` にテキストを返し、`details` に構造化メタデータを返します。

共通の `details` フィールド:

- `model`: 解決済みモデル参照 (`provider/model`)
- `native`: ネイティブプロバイダーモードでは `true`、フォールバックでは `false`
- `attempts`: 成功前に失敗したフォールバック試行

パスフィールド:

- 単一 PDF 入力: `details.pdf`
- 複数 PDF 入力: `details.pdfs[]` と `pdf` エントリ
- サンドボックスパス書き換えメタデータ (該当する場合): `rewrittenFrom`

## エラー動作

- PDF 入力なし: `pdf required: provide a path or URL to a PDF document` をスローします
- PDF が多すぎる: `details.error = "too_many_pdfs"` に構造化エラーを返します
- 未対応の参照スキーム: `details.error = "unsupported_pdf_reference"` を返します
- `pages` 付きのネイティブモード: 明確な `pages is not supported with native PDF providers` エラーをスローします

## 例

単一 PDF:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

複数 PDF:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

ページフィルター付きフォールバックモデル:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

抽出フォールバックを使う暗号化 PDF:

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Summarize this contract"
}
```

## 関連

- [ツール概要](/ja-JP/tools) - 利用可能なすべてのエージェントツール
- [設定リファレンス](/ja-JP/gateway/config-agents#agent-defaults) - pdfMaxBytesMb と pdfMaxPages の設定

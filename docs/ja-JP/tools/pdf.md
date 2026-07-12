---
read_when:
    - エージェントからの PDF を分析したい場合
    - pdf ツールの正確なパラメーターと制限が必要です
    - ネイティブ PDF モードと抽出フォールバックの違いをデバッグしています
summary: ネイティブプロバイダー対応と抽出フォールバックを使用して、1つ以上の PDF ドキュメントを分析する
title: PDFツール
x-i18n:
    generated_at: "2026-07-11T22:47:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54bde94a2b70fd209c70c13a1e75dc81c6cbebca7f6d56776bf37fa62cd78254
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` は1つ以上の PDF 文書を解析し、テキストを返します。Anthropic および Google のモデルではネイティブ文書入力を使用し、その他すべてのプロバイダーではテキスト／画像抽出にフォールバックします。

## 利用可否

このツールは、OpenClaw がエージェント用の PDF 対応モデルを解決できる場合にのみ登録されます。解決順序は次のとおりです。

1. `agents.defaults.pdfModel`（明示的なプライマリ／フォールバック）
2. `agents.defaults.imageModel`（明示的なプライマリ／フォールバック）
3. エージェントで解決されたセッション／デフォルトモデル（そのプロバイダーがネイティブ PDF 入力（Anthropic、Google）をサポートする場合、または設定済みのビジョンモデルがある場合）
4. 使用可能な認証を持つ、自動検出された画像／ビジョン対応プロバイダー（ネイティブ PDF プロバイダーを優先）

すべてのフォールバック候補は使用前に認証が確認されるため、設定された `provider/model` は、OpenClaw がエージェント用にそのプロバイダーを認証できる場合にのみ候補として扱われます。使用可能なモデルを解決できない場合、`pdf` ツールは公開されません。

## 入力リファレンス

<ParamField path="pdf" type="string">
PDF のパスまたは URL を1つ指定します。
</ParamField>

<ParamField path="pdfs" type="string[]">
複数の PDF パスまたは URL を、合計10件まで指定します。
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
解析プロンプト。
</ParamField>

<ParamField path="pages" type="string">
`1-5` や `1,3,7-9` のようなページフィルター。ネイティブプロバイダーモードではサポートされません。
</ParamField>

<ParamField path="password" type="string">
暗号化された PDF のパスワード。リクエスト内のすべての PDF に適用され、抽出フォールバックモードでのみ使用されます。
</ParamField>

<ParamField path="model" type="string">
`provider/model` 形式の任意のモデルオーバーライド。
</ParamField>

<ParamField path="maxBytesMb" type="number">
PDF ごとのサイズ上限（MB）。デフォルトは `agents.defaults.pdfMaxBytesMb`、未設定の場合は `10` です。
</ParamField>

注記：

- `pdf` と `pdfs` は読み込み前に統合され、重複が排除されます。少なくとも一方が必要です。
- `pages` は1始まりのページ番号として解析され、重複排除、並べ替えの後、`agents.defaults.pdfMaxPages`（デフォルト `20`）を上限として制限されます。範囲内のページに1つも一致しない場合、モデル呼び出し前にエラーになります。

## サポートされる PDF リファレンス

- ローカルファイルパス（`~` の展開を含む）
- `file://` URL
- `http://` および `https://` URL
- `media://inbound/<id>` などの OpenClaw 管理の受信リファレンス

その他の URI スキーム（例：`ftp://`）では `details.error = "unsupported_pdf_reference"` が返されます。ツールがサンドボックス内で実行されている場合、リモートの `http(s)` URL は拒否されます。ワークスペース限定のファイルポリシーが有効な場合、許可されたルート外のローカルパスは拒否されますが、OpenClaw の受信メディアストア配下にある管理対象の受信リファレンスと再生されたパスは引き続き許可されます。

## 実行モード

### ネイティブプロバイダーモード

プロバイダー `anthropic` および `google`（現在ネイティブ PDF 文書サポートを宣言している唯一のプロバイダー）で使用されます。PDF の生バイトは、ファイルごとにネイティブ文書／インライン PDF パートとしてプロバイダー API に直接送信されます。

制限：

- `pages` はサポートされません。設定すると、ツールは `pages is not supported with native PDF providers` をスローします。
- `password` はサポートされません。設定すると、ツールは `password is not supported with native PDF providers` をスローします。暗号化された PDF には非ネイティブモデルを使用してください。

### 抽出フォールバックモード

その他すべてのプロバイダーで使用されます。

1. バンドルされた `document-extract` Plugin を介して、選択されたページ（`agents.defaults.pdfMaxPages`、デフォルト `20` まで）からテキストを抽出します。この Plugin はテキストと画像の抽出に `clawpdf` パッケージ（PDFium WebAssembly）を使用します。
2. 抽出されたテキストが `200` 文字未満の場合、同じページを PNG 画像としてレンダリングします。レンダリング予算は合計 `4,000,000` ピクセルで、画像が必要なすべてのページ間で共有されます（ページごとではなく、残りのページに比例配分）。そのため、すでに十分なテキストがあるページではレンダリングを完全に省略します。
3. 抽出されたテキスト（およびレンダリングされた画像がある場合はその画像）とプロンプトを、選択されたモデルに送信します。

詳細：

- 暗号化された PDF は、トップレベルの `password` パラメーターで開きます。
- モデルが画像入力に対応しておらず、抽出可能なテキストもない場合、ツールはエラーになります。
- 画像のレンダリングに失敗した場合、OpenClaw は画像を破棄し、抽出されたテキストのみで処理を続行します。
- 対象モデルがテキスト専用で、抽出によって画像が生成された場合、OpenClaw は画像を破棄し、テキストのみを送信します。

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

| キー                            | デフォルト | 意味                                                                                                         |
| ------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `agents.defaults.pdfModel`      | 未設定     | 明示的なプライマリ／フォールバック PDF モデル。`imageModel`、続いてセッションモデルへフォールバックします。 |
| `agents.defaults.pdfMaxBytesMb` | `10`       | PDF ごとのサイズ上限（MB）。                                                                                 |
| `agents.defaults.pdfMaxPages`   | `20`       | PDF ごとに処理する最大ページ数。                                                                             |

フィールドの完全な詳細については、[設定リファレンス](/ja-JP/gateway/config-agents#agent-defaults)を参照してください。

## 出力の詳細

ツールは `content[0].text` にテキストを、`details` に構造化メタデータを返します。

一般的な `details` フィールド：

- `model`：解決されたモデルリファレンス（`provider/model`）
- `native`：ネイティブプロバイダーモードの場合は `true`、フォールバックの場合は `false`
- `attempts`：成功前に失敗したフォールバック試行

パスフィールド：

- 単一 PDF 入力：`details.pdf`
- 複数 PDF 入力：`pdf` エントリを含む `details.pdfs[]`
- サンドボックスのパス書き換えメタデータ（該当する場合）：`rewrittenFrom`

## エラー動作

| 条件                                  | 結果                                                           |
| ------------------------------------- | -------------------------------------------------------------- |
| PDF 入力なし                          | `pdf required: provide a path or URL to a PDF document` をスロー |
| PDF が10件を超える                    | `details.error = "too_many_pdfs"`                              |
| サポートされていないリファレンス方式  | `details.error = "unsupported_pdf_reference"`                  |
| ネイティブプロバイダーでの `pages`    | `pages is not supported with native PDF providers` をスロー      |
| ネイティブプロバイダーでの `password` | `password is not supported with native PDF providers` をスロー   |

## 例

単一の PDF：

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

複数の PDF：

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

ページフィルターを使用するフォールバックモデル：

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

抽出フォールバックを使用する暗号化 PDF：

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Summarize this contract"
}
```

## 関連項目

- [ツール概要](/ja-JP/tools) - 利用可能なすべてのエージェントツール
- [設定リファレンス](/ja-JP/gateway/config-agents#agent-defaults) - `pdfMaxBytesMb` および `pdfMaxPages` の設定

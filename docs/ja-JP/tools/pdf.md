---
read_when:
    - エージェントからPDFを分析したい
    - 正確な pdf ツールのパラメーターと制限が必要です
    - ネイティブ PDF モードと抽出フォールバックをデバッグしている
summary: ネイティブプロバイダーサポートと抽出フォールバックを使用して、1つ以上のPDFドキュメントを分析する
title: PDF ツール
x-i18n:
    generated_at: "2026-07-05T11:51:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54bde94a2b70fd209c70c13a1e75dc81c6cbebca7f6d56776bf37fa62cd78254
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` は 1 つ以上の PDF ドキュメントを解析し、テキストを返します。Anthropic と Google モデルではネイティブのドキュメント入力を使用し、それ以外のすべてのプロバイダーではテキスト/画像抽出にフォールバックします。

## 利用可否

このツールは、OpenClaw がエージェント用に PDF 対応モデルを解決できる場合にのみ登録されます。解決順序:

1. `agents.defaults.pdfModel` (明示的なプライマリ/フォールバック)
2. `agents.defaults.imageModel` (明示的なプライマリ/フォールバック)
3. そのプロバイダーがネイティブ PDF 入力 (Anthropic、Google) をサポートしているか、すでに構成済みのビジョンモデルがある場合、エージェントの解決済みセッション/デフォルトモデル
4. 利用可能な認証を持つ、自動検出された画像/ビジョン対応プロバイダー。ネイティブ PDF プロバイダーを優先

各フォールバック候補は使用前に認証チェックされるため、構成済みの `provider/model` は、OpenClaw がそのエージェントに対してそのプロバイダーを認証できる場合にのみ有効です。利用可能なモデルを解決できない場合、`pdf` ツールは公開されません。

## 入力リファレンス

<ParamField path="pdf" type="string">
1 つの PDF パスまたは URL。
</ParamField>

<ParamField path="pdfs" type="string[]">
複数の PDF パスまたは URL。合計 10 件まで。
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
解析プロンプト。
</ParamField>

<ParamField path="pages" type="string">
`1-5` または `1,3,7-9` のようなページフィルター。ネイティブプロバイダーモードではサポートされません。
</ParamField>

<ParamField path="password" type="string">
暗号化 PDF のパスワード。リクエスト内のすべての PDF に適用されます。抽出フォールバックモードでのみ使用されます。
</ParamField>

<ParamField path="model" type="string">
`provider/model` 形式の任意のモデルオーバーライド。
</ParamField>

<ParamField path="maxBytesMb" type="number">
PDF ごとのサイズ上限 (MB)。デフォルトは `agents.defaults.pdfMaxBytesMb`、未設定の場合は `10` です。
</ParamField>

注:

- `pdf` と `pdfs` は読み込み前にマージされ、重複排除されます。少なくとも 1 つは必須です。
- `pages` は 1 始まりのページ番号として解析され、重複排除、ソートされたうえで `agents.defaults.pdfMaxPages` (デフォルト `20`) に丸められます。範囲内のページに一致しない範囲は、モデル呼び出し前にエラーになります。

## サポートされる PDF 参照

- ローカルファイルパス (`~` 展開を含む)
- `file://` URL
- `http://` と `https://` URL
- `media://inbound/<id>` などの OpenClaw 管理の受信参照

その他の URI スキーム (例: `ftp://`) は `details.error = "unsupported_pdf_reference"` を返します。リモートの `http(s)` URL は、ツールがサンドボックス内で実行される場合に拒否されます。ワークスペース限定ファイルポリシーが有効な場合、許可されたルート外のローカルパスは拒否されます。管理対象の受信参照と、OpenClaw の受信メディアストア配下で再生されたパスは引き続き許可されます。

## 実行モード

### ネイティブプロバイダーモード

プロバイダー `anthropic` と `google` に使用されます (現在ネイティブ PDF ドキュメントサポートを宣言している唯一のプロバイダー)。生の PDF バイトは、ファイルごとにネイティブドキュメント/インライン PDF パートとしてプロバイダー API に直接送られます。

制限:

- `pages` はサポートされません。設定されている場合、ツールは `pages is not supported with native PDF providers` をスローします。
- `password` はサポートされません。設定されている場合、ツールは `password is not supported with native PDF providers` をスローします。暗号化 PDF には非ネイティブモデルを使用してください。

### 抽出フォールバックモード

それ以外のすべてのプロバイダーに使用されます。

1. バンドルされた `document-extract` Plugin を介して、選択されたページ (`agents.defaults.pdfMaxPages` まで、デフォルト `20`) からテキストを抽出します。この Plugin はテキストと画像の抽出に `clawpdf` パッケージ (PDFium WebAssembly) を使用します。
2. 抽出されたテキストが `200` 文字未満の場合、同じページを PNG 画像にレンダリングします。レンダリング予算は合計 `4,000,000` ピクセルで、画像が必要なすべてのページ間で共有されます (ページごとではなく、残りのページごとに比例配分)。そのため、すでに十分なテキストがあるテキストページはレンダリングを完全にスキップします。
3. 抽出されたテキスト (およびレンダリングされた画像があればそれら) とプロンプトを、選択されたモデルに送信します。

詳細:

- 暗号化 PDF はトップレベルの `password` パラメーターで開きます。
- モデルに画像入力がなく、抽出可能なテキストもない場合、ツールはエラーになります。
- 画像レンダリングに失敗した場合、OpenClaw は画像を破棄し、抽出されたテキストで続行します。
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

| キー                            | デフォルト | 意味                                                                                             |
| ------------------------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `agents.defaults.pdfModel`      | 未設定     | 明示的なプライマリ/フォールバック PDF モデル。`imageModel`、続いてセッションモデルにフォールバックします。 |
| `agents.defaults.pdfMaxBytesMb` | `10`       | PDF ごとのサイズ上限 (MB)。                                                                       |
| `agents.defaults.pdfMaxPages`   | `20`       | PDF ごとに処理される最大ページ数。                                                                |

すべてのフィールド詳細については、[設定リファレンス](/ja-JP/gateway/config-agents#agent-defaults) を参照してください。

## 出力の詳細

ツールは `content[0].text` にテキストを返し、`details` に構造化メタデータを返します。

一般的な `details` フィールド:

- `model`: 解決済みモデル参照 (`provider/model`)
- `native`: ネイティブプロバイダーモードの場合は `true`、フォールバックの場合は `false`
- `attempts`: 成功前に失敗したフォールバック試行

パスフィールド:

- 単一 PDF 入力: `details.pdf`
- 複数 PDF 入力: `pdf` エントリを持つ `details.pdfs[]`
- サンドボックスパス書き換えメタデータ (該当する場合): `rewrittenFrom`

## エラー動作

| 条件                              | 結果                                                           |
| --------------------------------- | -------------------------------------------------------------- |
| PDF 入力なし                      | `pdf required: provide a path or URL to a PDF document` をスロー |
| 10 件を超える PDF                 | `details.error = "too_many_pdfs"`                              |
| サポートされない参照スキーム      | `details.error = "unsupported_pdf_reference"`                  |
| ネイティブプロバイダーでの `pages` | `pages is not supported with native PDF providers` をスロー     |
| ネイティブプロバイダーでの `password` | `password is not supported with native PDF providers` をスロー  |

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

抽出フォールバックを使用した暗号化 PDF:

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
- [設定リファレンス](/ja-JP/gateway/config-agents#agent-defaults) - pdfMaxBytesMb と pdfMaxPages 設定

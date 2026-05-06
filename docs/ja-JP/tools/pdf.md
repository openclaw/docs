---
read_when:
    - エージェントからPDFを分析したい
    - 正確な PDF ツールのパラメーターと制限が必要です
    - ネイティブ PDF モードと抽出フォールバックをデバッグしています
summary: ネイティブプロバイダー対応と抽出フォールバックを使って、1つ以上のPDFドキュメントを分析する
title: PDF ツール
x-i18n:
    generated_at: "2026-05-06T05:22:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: ac1cbbc363975d5571fe5b46b39e2d897e1b80b5859a1f44ef81050f55554444
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` は、1つ以上の PDF ドキュメントを解析し、テキストを返します。

動作の概要:

- Anthropic と Google モデルプロバイダー向けのネイティブプロバイダーモード。
- その他のプロバイダー向けの抽出フォールバックモード (必要に応じて、まずテキストを抽出し、その後ページ画像を抽出)。
- 単一 (`pdf`) または複数 (`pdfs`) の入力に対応し、1回の呼び出しで最大 10 個の PDF を扱えます。

## 利用可否

このツールは、OpenClaw がエージェント用に PDF 対応モデル設定を解決できる場合にのみ登録されます:

1. `agents.defaults.pdfModel`
2. `agents.defaults.imageModel` へのフォールバック
3. エージェントの解決済みセッション/デフォルトモデルへのフォールバック
4. ネイティブ PDF プロバイダーが認証に裏付けられている場合、汎用的な画像フォールバック候補よりも優先

利用可能なモデルを解決できない場合、`pdf` ツールは公開されません。

利用可否に関する注記:

- フォールバックチェーンは認証を考慮します。設定済みの `provider/model` は、
  OpenClaw がそのエージェントについてそのプロバイダーを実際に認証できる場合にのみ対象になります。
- 現在のネイティブ PDF プロバイダーは **Anthropic** と **Google** です。
- 解決済みのセッション/デフォルトプロバイダーに設定済みの vision/PDF
  モデルがすでにある場合、PDF ツールは認証済みの他の
  プロバイダーへフォールバックする前にそれを再利用します。

## 入力リファレンス

<ParamField path="pdf" type="string">
1つの PDF パスまたは URL。
</ParamField>

<ParamField path="pdfs" type="string[]">
複数の PDF パスまたは URL。合計で最大 10 個。
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
解析プロンプト。
</ParamField>

<ParamField path="pages" type="string">
`1-5` または `1,3,7-9` のようなページフィルター。
</ParamField>

<ParamField path="model" type="string">
`provider/model` 形式の任意のモデルオーバーライド。
</ParamField>

<ParamField path="maxBytesMb" type="number">
PDF ごとのサイズ上限 (MB)。デフォルトは `agents.defaults.pdfMaxBytesMb` または `10` です。
</ParamField>

入力に関する注記:

- `pdf` と `pdfs` は読み込み前にマージされ、重複排除されます。
- PDF 入力が指定されていない場合、ツールはエラーになります。
- `pages` は 1 始まりのページ番号として解析され、重複排除、ソート、設定済み最大ページ数へのクランプが行われます。
- `maxBytesMb` のデフォルトは `agents.defaults.pdfMaxBytesMb` または `10` です。

## サポートされる PDF 参照

- ローカルファイルパス (`~` 展開を含む)
- `file://` URL
- `http://` および `https://` URL
- `media://inbound/<id>` などの OpenClaw 管理のインバウンド参照

参照に関する注記:

- その他の URI スキーム (例: `ftp://`) は `unsupported_pdf_reference` として拒否されます。
- サンドボックスモードでは、リモートの `http(s)` URL は拒否されます。
- workspace-only ファイルポリシーが有効な場合、許可されたルート外のローカルファイルパスは拒否されます。
- OpenClaw のインバウンドメディアストア配下の管理対象インバウンド参照と再生されたパスは、workspace-only ファイルポリシーでも許可されます。

## 実行モード

### ネイティブプロバイダーモード

ネイティブモードは、プロバイダー `anthropic` と `google` に使用されます。
このツールは生の PDF バイト列をプロバイダー API に直接送信します。

ネイティブモードの制限:

- `pages` はサポートされていません。設定されている場合、ツールはエラーを返します。
- 複数 PDF 入力がサポートされています。各 PDF は、プロンプトの前にネイティブドキュメントブロック /
  インライン PDF パートとして送信されます。

### 抽出フォールバックモード

フォールバックモードは、非ネイティブプロバイダーに使用されます。

フロー:

1. 選択されたページからテキストを抽出します (最大 `agents.defaults.pdfMaxPages`、デフォルトは `20`)。
2. 抽出されたテキスト長が `200` 文字未満の場合、選択されたページを PNG 画像としてレンダリングして含めます。
3. 抽出されたコンテンツとプロンプトを、選択されたモデルに送信します。

フォールバックの詳細:

- ページ画像の抽出では、`4,000,000` のピクセル予算を使用します。
- 対象モデルが画像入力をサポートしておらず、抽出可能なテキストもない場合、ツールはエラーになります。
- テキスト抽出に成功しているものの、画像抽出に text-only モデルで
  vision が必要になる場合、OpenClaw はレンダリングされた画像を破棄し、
  抽出されたテキストで続行します。
- 抽出フォールバックは、同梱の `document-extract` Plugin を使用します。この Plugin が
  `pdfjs-dist` を所有します。`@napi-rs/canvas` は、画像レンダリングフォールバックが
  利用可能な場合にのみ使用されます。

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

すべてのフィールドの詳細については、[設定リファレンス](/ja-JP/gateway/configuration-reference) を参照してください。

## 出力の詳細

このツールは、`content[0].text` にテキストを返し、`details` に構造化メタデータを返します。

一般的な `details` フィールド:

- `model`: 解決済みモデル参照 (`provider/model`)
- `native`: ネイティブプロバイダーモードの場合は `true`、フォールバックの場合は `false`
- `attempts`: 成功前に失敗したフォールバック試行

パスフィールド:

- 単一 PDF 入力: `details.pdf`
- 複数 PDF 入力: `details.pdfs[]` に `pdf` エントリ
- サンドボックスパス書き換えメタデータ (該当する場合): `rewrittenFrom`

## エラー動作

- PDF 入力なし: `pdf required: provide a path or URL to a PDF document` をスローします
- PDF が多すぎる場合: `details.error = "too_many_pdfs"` に構造化エラーを返します
- サポートされていない参照スキーム: `details.error = "unsupported_pdf_reference"` を返します
- `pages` を指定したネイティブモード: 明確な `pages is not supported with native PDF providers` エラーをスローします

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

## 関連

- [ツール概要](/ja-JP/tools) - 利用可能なすべてのエージェントツール
- [設定リファレンス](/ja-JP/gateway/config-agents#agent-defaults) - pdfMaxBytesMb と pdfMaxPages の設定

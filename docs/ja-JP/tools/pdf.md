---
read_when:
    - エージェントから PDF を解析したいです
    - '`pdf` ツールの正確なパラメーターと制限が必要です'
    - ネイティブ PDF モードと抽出フォールバックをデバッグしています
summary: ネイティブ provider サポートと抽出フォールバックで 1 つ以上の PDF ドキュメントを解析する
title: PDF ツール
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-25T14:01:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89bbc675f2b87729e283659f9604724be7a827b50b11edc853a42c448bbaaf6e
    source_path: tools/pdf.md
    workflow: 15
---

`pdf` は 1 つ以上の PDF ドキュメントを解析してテキストを返します。

主な動作:

- Anthropic および Google モデル provider 向けのネイティブ provider モード。
- その他の provider 向けの抽出フォールバックモード（まずテキストを抽出し、必要に応じてページ画像を使用）。
- 単一入力（`pdf`）または複数入力（`pdfs`）をサポートし、1 回の呼び出しあたり最大 10 件の PDF に対応。

## 利用可能性

このツールは、OpenClaw がエージェント用の PDF 対応モデル config を解決できる場合にのみ登録されます。

1. `agents.defaults.pdfModel`
2. `agents.defaults.imageModel` にフォールバック
3. エージェントの解決済みセッション/デフォルトモデルにフォールバック
4. ネイティブ PDF provider が auth ベースの場合、汎用画像フォールバック候補より先に優先する

利用可能なモデルを解決できない場合、`pdf` ツールは公開されません。

利用可能性に関する注意:

- フォールバックチェーンは auth を認識します。設定された `provider/model` は、OpenClaw がその provider をそのエージェント向けに実際に認証できる場合にのみ有効と見なされます。
- 現在のネイティブ PDF provider は **Anthropic** と **Google** です。
- 解決済みセッション/デフォルト provider が、すでに設定済みの vision/PDF モデルを持っている場合、PDF ツールは他の auth ベース provider にフォールバックする前にそれを再利用します。

## 入力リファレンス

<ParamField path="pdf" type="string">
1 つの PDF パスまたは URL。
</ParamField>

<ParamField path="pdfs" type="string[]">
複数の PDF パスまたは URL。合計最大 10 件。
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
解析プロンプト。
</ParamField>

<ParamField path="pages" type="string">
`1-5` や `1,3,7-9` のようなページフィルター。
</ParamField>

<ParamField path="model" type="string">
`provider/model` 形式の任意のモデルオーバーライド。
</ParamField>

<ParamField path="maxBytesMb" type="number">
PDF 1 件あたりのサイズ上限（MB）。デフォルトは `agents.defaults.pdfMaxBytesMb` または `10`。
</ParamField>

入力に関する注意:

- `pdf` と `pdfs` は読み込み前にマージおよび重複排除されます。
- PDF 入力が指定されていない場合、ツールはエラーになります。
- `pages` は 1 ベースのページ番号として解析され、重複排除、ソート、および設定済み最大ページ数にクランプされます。
- `maxBytesMb` のデフォルトは `agents.defaults.pdfMaxBytesMb` または `10` です。

## サポートされる PDF 参照

- ローカルファイルパス（`~` 展開を含む）
- `file://` URL
- `http://` および `https://` URL
- `media://inbound/<id>` のような OpenClaw 管理の受信 ref

参照に関する注意:

- その他の URI スキーム（たとえば `ftp://`）は `unsupported_pdf_reference` として拒否されます。
- サンドボックスモードでは、リモート `http(s)` URL は拒否されます。
- workspace-only ファイルポリシーが有効な場合、許可されたルート外のローカルファイルパスは拒否されます。
- OpenClaw の受信メディアストア配下の管理済み受信 ref と再生パスは、workspace-only ファイルポリシーでも許可されます。

## 実行モード

### ネイティブ provider モード

ネイティブモードは provider `anthropic` と `google` に使用されます。
このツールは、生の PDF バイトを provider API に直接送信します。

ネイティブモードの制限:

- `pages` はサポートされません。設定されている場合、ツールはエラーを返します。
- 複数 PDF 入力はサポートされます。各 PDF は、プロンプトの前にネイティブ document block / inline PDF part として送信されます。

### 抽出フォールバックモード

フォールバックモードは非ネイティブ provider に使用されます。

フロー:

1. 選択したページからテキストを抽出する（最大 `agents.defaults.pdfMaxPages`、デフォルト `20`）。
2. 抽出テキスト長が `200` 文字未満の場合、選択したページを PNG 画像としてレンダリングして含める。
3. 抽出コンテンツとプロンプトを選択したモデルへ送信する。

フォールバックの詳細:

- ページ画像抽出は `4,000,000` のピクセル予算を使用します。
- 対象モデルが画像入力をサポートしておらず、抽出可能なテキストもない場合、ツールはエラーになります。
- テキスト抽出が成功していて、画像抽出がテキスト専用モデル上で vision を必要とする場合、OpenClaw はレンダリング画像を落として抽出テキストのみで続行します。
- 抽出フォールバックはバンドル済みの `document-extract` Plugin を使用します。この Plugin が `pdfjs-dist` を所有し、`@napi-rs/canvas` は画像レンダリングフォールバックが利用可能な場合にのみ使われます。

## config

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

完全なフィールド詳細については [Configuration Reference](/ja-JP/gateway/configuration-reference) を参照してください。

## 出力の詳細

このツールは `content[0].text` にテキストを返し、`details` に構造化メタデータを返します。

一般的な `details` フィールド:

- `model`: 解決されたモデル ref（`provider/model`）
- `native`: ネイティブ provider モードでは `true`、フォールバックでは `false`
- `attempts`: 成功前に失敗したフォールバック試行

パスフィールド:

- 単一 PDF 入力: `details.pdf`
- 複数 PDF 入力: `details.pdfs[]` に `pdf` エントリ
- サンドボックスパス書き換えメタデータ（該当する場合）: `rewrittenFrom`

## エラー動作

- PDF 入力なし: `pdf required: provide a path or URL to a PDF document` をスロー
- PDF が多すぎる: `details.error = "too_many_pdfs"` に構造化エラーを返す
- 未対応の参照スキーム: `details.error = "unsupported_pdf_reference"` を返す
- `pages` を指定したネイティブモード: 明確な `pages is not supported with native PDF providers` エラーをスロー

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

- [Tools Overview](/ja-JP/tools) — 利用可能なすべてのエージェントツール
- [Configuration Reference](/ja-JP/gateway/config-agents#agent-defaults) — `pdfMaxBytesMb` と `pdfMaxPages` の config

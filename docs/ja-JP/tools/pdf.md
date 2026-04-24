---
read_when:
    - エージェントからPDFを解析したい場合
    - '`pdf`ツールの正確なパラメーターと制限が必要な場合'
    - ネイティブPDFモードと抽出フォールバックをデバッグしている場合
summary: ネイティブプロバイダーサポートと抽出フォールバックを使って1つ以上のPDFドキュメントを解析する
title: PDFツール
x-i18n:
    generated_at: "2026-04-24T05:26:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 945838d1e1164a15720ca76eb156f9f299bf7f603f4591c8fa557b43e4cc93a8
    source_path: tools/pdf.md
    workflow: 15
---

`pdf`は、1つ以上のPDFドキュメントを解析してテキストを返します。

クイック動作:

- AnthropicおよびGoogleモデルプロバイダー向けのネイティブプロバイダーモード。
- その他のプロバイダー向けの抽出フォールバックモード（まずテキストを抽出し、必要に応じてページ画像を使用）。
- 単一入力（`pdf`）または複数入力（`pdfs`）をサポートし、1回の呼び出しあたり最大10個のPDFに対応。

## 利用可能条件

このツールは、OpenClawがそのエージェント向けにPDF対応モデル設定を解決できる場合にのみ登録されます。

1. `agents.defaults.pdfModel`
2. `agents.defaults.imageModel`へのフォールバック
3. エージェントの解決済みsession/default modelへのフォールバック
4. ネイティブPDFプロバイダーがauth-backedである場合、汎用画像フォールバック候補より前に優先する

使用可能なモデルを解決できない場合、`pdf`ツールは公開されません。

利用可能条件に関する注意:

- フォールバックチェーンは認証を考慮します。設定済みの`provider/model`は、
  OpenClawがそのエージェント向けにそのプロバイダーで実際に認証できる場合にのみ有効です。
- 現在のネイティブPDFプロバイダーは**Anthropic**と**Google**です。
- 解決済みsession/default providerが、すでに設定済みのvision/PDF
  modelを持っている場合、PDFツールは他のauth-backed
  providerへフォールバックする前にそれを再利用します。

## 入力リファレンス

<ParamField path="pdf" type="string">
1つのPDFパスまたはURL。
</ParamField>

<ParamField path="pdfs" type="string[]">
複数のPDFパスまたはURL。合計最大10件まで。
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
解析プロンプト。
</ParamField>

<ParamField path="pages" type="string">
`1-5`または`1,3,7-9`のようなページフィルター。
</ParamField>

<ParamField path="model" type="string">
`provider/model`形式の任意のモデル上書き。
</ParamField>

<ParamField path="maxBytesMb" type="number">
PDFごとのサイズ上限（MB）。デフォルトは`agents.defaults.pdfMaxBytesMb`または`10`。
</ParamField>

入力に関する注意:

- `pdf`と`pdfs`は、読み込み前にマージおよび重複排除されます。
- PDF入力が指定されていない場合、ツールはエラーになります。
- `pages`は1始まりのページ番号として解析され、重複排除・ソートされ、設定済み最大ページ数にクランプされます。
- `maxBytesMb`のデフォルトは`agents.defaults.pdfMaxBytesMb`または`10`です。

## サポートされるPDF参照

- ローカルファイルパス（`~`展開を含む）
- `file://` URL
- `http://`および`https://` URL

参照に関する注意:

- その他のURIスキーム（例: `ftp://`）は`unsupported_pdf_reference`で拒否されます。
- sandboxモードでは、リモート`http(s)` URLは拒否されます。
- workspace-only file policyが有効な場合、許可されたroot外のローカルファイルパスは拒否されます。

## 実行モード

### ネイティブプロバイダーモード

ネイティブモードは、`anthropic`および`google`プロバイダーで使われます。
このツールは生のPDFバイトを直接プロバイダーAPIへ送信します。

ネイティブモードの制限:

- `pages`はサポートされません。設定されている場合、ツールはエラーを返します。
- 複数PDF入力はサポートされます。各PDFは、プロンプトの前にネイティブdocument block /
  inline PDF partとして送信されます。

### 抽出フォールバックモード

フォールバックモードは、ネイティブでないプロバイダーで使われます。

フロー:

1. 選択されたページからテキストを抽出する（最大`agents.defaults.pdfMaxPages`、デフォルト`20`）。
2. 抽出テキスト長が`200`文字未満の場合、選択ページをPNG画像へレンダリングして含める。
3. 抽出した内容とプロンプトを選択されたモデルへ送信する。

フォールバック詳細:

- ページ画像抽出では`4,000,000`のピクセル予算を使用します。
- 対象モデルが画像入力をサポートせず、かつ抽出可能なテキストがない場合、ツールはエラーになります。
- テキスト抽出に成功していても、画像抽出に
  text-only model上でvisionが必要な場合、OpenClawはレンダリング画像を破棄し、抽出テキストのみで続行します。
- 抽出フォールバックには`pdfjs-dist`（および画像レンダリング用の`@napi-rs/canvas`）が必要です。

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

完全なフィールド詳細は[Configuration Reference](/ja-JP/gateway/configuration-reference)を参照してください。

## 出力詳細

このツールは`content[0].text`にテキストを返し、`details`に構造化メタデータを返します。

共通の`details`フィールド:

- `model`: 解決済みモデル参照（`provider/model`）
- `native`: ネイティブプロバイダーモードなら`true`、フォールバックなら`false`
- `attempts`: 成功前に失敗したフォールバック試行

パスフィールド:

- 単一PDF入力: `details.pdf`
- 複数PDF入力: `details.pdfs[]`内の`pdf`エントリ
- sandbox path rewriteメタデータ（該当する場合）: `rewrittenFrom`

## エラー動作

- PDF入力不足: `pdf required: provide a path or URL to a PDF document`をスロー
- PDFが多すぎる: `details.error = "too_many_pdfs"`で構造化エラーを返す
- 非対応参照スキーム: `details.error = "unsupported_pdf_reference"`を返す
- `pages`付きのネイティブモード: 明確な`pages is not supported with native PDF providers`エラーをスロー

## 例

単一PDF:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

複数PDF:

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
- [Configuration Reference](/ja-JP/gateway/config-agents#agent-defaults) — pdfMaxBytesMbおよびpdfMaxPages設定

---
x-i18n:
    generated_at: "2026-07-11T21:58:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8712b1aeb2e605055c22cf308049e5e74fdf33061870026be20bd55cb0c3d1d
    source_path: AGENTS.md
    workflow: 16
---

# ドキュメントガイド

このディレクトリは、ドキュメントの執筆、Mintlify のリンク規則、ドキュメントの国際化ポリシーを管理します。

## Mintlify の規則

- ドキュメントは Mintlify（`https://docs.openclaw.ai`）でホストされています。
- `docs/**/*.md` 内のドキュメント内部リンクは、`.md` または `.mdx` の接尾辞を付けず、ルート相対のままにする必要があります（例：`[設定](/gateway/configuration)`）。
- セクション間の相互参照には、ルート相対パス上のアンカーを使用してください（例：`[フック](/gateway/configuration-reference#hooks)`）。
- Mintlify のアンカー生成はこれらの文字を適切に処理できないため、ドキュメントの見出しでは em ダッシュとアポストロフィを避けてください。
- README および GitHub でレンダリングされるその他のドキュメントでは、Mintlify 外でもリンクが機能するように、ドキュメントの絶対 URL を維持してください。
- ドキュメントの内容は汎用的なものにする必要があります。個人のデバイス名、ホスト名、ローカルパスは使用せず、`user@gateway-host` のようなプレースホルダーを使用してください。

## ドキュメント内容の規則

- ドキュメント、UI 文言、選択リストでは、セクションがランタイム順序または自動検出順序を明示的に説明している場合を除き、サービスやプロバイダーをアルファベット順に並べてください。
- バンドルされた Plugin の命名は、ルートの `AGENTS.md` にあるリポジトリ全体の Plugin 用語規則と一貫させてください。
- 生成されたドキュメントは手動で編集しないでください。`docs/plugins/reference/**`、`docs/plugins/reference.md`、`docs/plugins/plugin-inventory.md` は `pnpm plugins:inventory:gen` から、`docs/docs_map.md` は `pnpm docs:map:gen` から、`docs/maturity/**` は `pnpm maturity:render` から生成されます。

## 内部ドキュメント

- 長期的に使用する非公開の運用者向けドキュメントは `~/Projects/manager/docs/` に配置します。
- リポジトリ内の内部作業用ドキュメントやミラードキュメントは、無視対象の `docs/internal/` 配下に配置できます。
- `docs/internal/**` のページを `docs/docs.json` のナビゲーションに追加したり、公開ドキュメントからリンクしたりしないでください。
- 後からページが強制的に追加された場合でも、`scripts/docs-sync-publish.mjs` は公開用の `openclaw/docs` 公開リポジトリから `docs/internal/**` を除外して削除します。
- 内部ドキュメントには、リポジトリパス、非公開アプリ名、1Password の項目名、運用手順を記載できますが、シークレットの値は決して含めないでください。

## 成熟度スコアカードの編集

`taxonomy.yaml` と `qa/maturity-scores.yaml` がソース入力です。`docs/maturity/` 配下に生成される成熟度ドキュメントは投影結果であり、スコア、LTS、分類体系、QA プロファイル、エビデンステーブルを手動で編集しないでください。
生成は `scripts/qa/render-maturity-docs.ts` が管理します。コミット済みドキュメントを更新するには `pnpm maturity:render`、検証するには `pnpm maturity:check` を使用してください。
`.github/workflows/maturity-scorecard.yml` はアーティファクトのプレビューをレンダリングし、生成済みドキュメントの PR を作成できます。`.github/workflows/openclaw-release-checks.yml` はリリース QA のためにこれをディスパッチします。
メンテナーがサニタイズ済みのコミット対象投影結果を明示的に要求しない限り、決定論的な `qa-evidence.json.scorecard` データは GitHub Actions のアーティファクトに保持してください。
人による上書きでは、PR でソースの状態を変更し、その理由と公開済みまたは墨消し済みのエビデンスを説明する必要があります。

## ドキュメントの国際化

- 外国語のドキュメントはこのリポジトリでは保守されません。生成された公開出力は別の `openclaw/docs` リポジトリに配置されます（多くの場合、ローカルでは `../openclaw-docs` としてクローンされます）。
- ここでは `docs/<locale>/**` 配下のローカライズ済みドキュメントを追加または編集しないでください。
- このリポジトリの英語ドキュメントと用語集ファイルを信頼できる唯一の情報源として扱ってください。
- パイプライン：ここで英語ドキュメントを更新し、必要に応じて `docs/.i18n/glossary.<locale>.json` を更新した後、公開リポジトリの同期と `openclaw/docs` 内の `scripts/docs-i18n` の実行に任せます。
- `scripts/docs-i18n` を再実行する前に、英語のまま維持する必要がある、または固定訳を使用する必要がある新しい技術用語、ページタイトル、短いナビゲーションラベルを用語集に追加してください。
- `pnpm docs:check-i18n-glossary` は、変更された英語ドキュメントのタイトルと短い内部ドキュメントラベルを検査するガードです。
- 翻訳メモリは、公開リポジトリ内で生成される `docs/.i18n/*.tm.jsonl` ファイルに保存されます。
- `docs/.i18n/README.md` を参照してください。

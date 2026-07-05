---
x-i18n:
    generated_at: "2026-07-05T11:00:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8712b1aeb2e605055c22cf308049e5e74fdf33061870026be20bd55cb0c3d1d
    source_path: AGENTS.md
    workflow: 16
---

# ドキュメントガイド

このディレクトリは、ドキュメント作成、Mintlify リンクルール、ドキュメント i18n ポリシーを管理します。

## Mintlify ルール

- ドキュメントは Mintlify (`https://docs.openclaw.ai`) でホストされます。
- `docs/**/*.md` 内の内部ドキュメントリンクは、`.md` または `.mdx` サフィックスなしのルート相対のままにする必要があります（例: `[Config](/gateway/configuration)`）。
- セクションの相互参照には、ルート相対パス上のアンカーを使用してください（例: `[Hooks](/gateway/configuration-reference#hooks)`）。
- Mintlify のアンカー生成はこれらに弱いため、ドキュメント見出しでは em ダッシュとアポストロフィを避けてください。
- README やその他の GitHub でレンダリングされるドキュメントでは、Mintlify 外でもリンクが機能するように、絶対ドキュメント URL を維持してください。
- ドキュメント内容は汎用的なままにする必要があります。個人のデバイス名、ホスト名、ローカルパスは使わず、`user@gateway-host` のようなプレースホルダーを使用してください。

## ドキュメント内容ルール

- ドキュメント、UI 文言、ピッカーリストでは、セクションがランタイム順序または自動検出順序を明示的に説明している場合を除き、サービス/プロバイダーをアルファベット順に並べてください。
- バンドル済み Plugin の命名は、ルート `AGENTS.md` のリポジトリ全体の Plugin 用語ルールと一貫させてください。
- 生成されたドキュメントは手動編集しないでください: `docs/plugins/reference/**`、`docs/plugins/reference.md`、`docs/plugins/plugin-inventory.md` は `pnpm plugins:inventory:gen` から生成されます。`docs/docs_map.md` は `pnpm docs:map:gen` から生成されます。`docs/maturity/**` は `pnpm maturity:render` から生成されます。

## 内部ドキュメント

- 長期運用される非公開の運用者向けドキュメントは `~/Projects/manager/docs/` に配置します。
- リポジトリローカルの内部スクラッチ/ミラードキュメントは、無視対象の `docs/internal/` 配下に配置できます。
- `docs/internal/**` ページを `docs/docs.json` ナビゲーションに追加したり、公開ドキュメントからリンクしたりしないでください。
- `scripts/docs-sync-publish.mjs` は、ページが後から強制追加された場合でも、公開 `openclaw/docs` 公開リポジトリから `docs/internal/**` を除外し、削除します。
- 内部ドキュメントではリポジトリパス、非公開アプリ名、1Password 項目名、ランブックに言及できますが、シークレット値は絶対に含めないでください。

## 成熟度スコアカードの編集

`taxonomy.yaml` と `qa/maturity-scores.yaml` がソース入力です。`docs/maturity/` 配下の生成済み成熟度ドキュメントは投影であり、スコア、LTS、タクソノミー、QA プロファイル、またはエビデンステーブルのために手動編集すべきではありません。
`scripts/qa/render-maturity-docs.ts` が生成を管理します。コミット済みドキュメントを更新するには `pnpm maturity:render` を使用し、検証するには `pnpm maturity:check` を使用してください。
`.github/workflows/maturity-scorecard.yml` は成果物プレビューをレンダリングし、生成ドキュメント PR を作成できます。`.github/workflows/openclaw-release-checks.yml` はリリース QA のためにこれをディスパッチします。
メンテナーがサニタイズ済みのコミット投影を明示的に求めない限り、決定的な `qa-evidence.json.scorecard` データは GitHub Actions 成果物に保持してください。
人間による上書きは、PR でソース状態を変更し、理由と公開または編集済みのエビデンスを説明する必要があります。

## ドキュメント i18n

- 外国語ドキュメントはこのリポジトリでは保守されていません。生成された公開出力は、別の `openclaw/docs` リポジトリ（多くの場合ローカルでは `../openclaw-docs` としてクローン）にあります。
- ここでは `docs/<locale>/**` 配下のローカライズ済みドキュメントを追加または編集しないでください。
- このリポジトリ内の英語ドキュメントと用語集ファイルを信頼できる唯一の情報源として扱ってください。
- パイプライン: ここで英語ドキュメントを更新し、必要に応じて `docs/.i18n/glossary.<locale>.json` を更新し、その後公開リポジトリの同期と `scripts/docs-i18n` を `openclaw/docs` で実行させます。
- `scripts/docs-i18n` を再実行する前に、英語のままにする必要がある、または固定訳を使う必要がある新しい技術用語、ページタイトル、短いナビゲーションラベルについて、用語集エントリを追加してください。
- `pnpm docs:check-i18n-glossary` は、変更された英語ドキュメントタイトルと短い内部ドキュメントラベルのガードです。
- 翻訳メモリは、公開リポジトリ内の生成済み `docs/.i18n/*.tm.jsonl` ファイルにあります。
- `docs/.i18n/README.md` を参照してください。

---
x-i18n:
    generated_at: "2026-06-27T10:29:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0c67d049eb1d0f1d4e675a71e69b2d34d3ce5c733ca9582bf08ac717c233644
    source_path: AGENTS.md
    workflow: 16
---

# ドキュメントガイド

このディレクトリは、ドキュメント執筆、Mintlify のリンク規則、ドキュメント i18n ポリシーを管理します。

## Mintlify の規則

- ドキュメントは Mintlify (`https://docs.openclaw.ai`) でホストされています。
- `docs/**/*.md` 内の内部ドキュメントリンクは、`.md` または `.mdx` サフィックスなしのルート相対のままにする必要があります（例: `[Config](/gateway/configuration)`）。
- セクション相互参照では、ルート相対パス上のアンカーを使用してください（例: `[Hooks](/gateway/configuration-reference#hooks)`）。
- Mintlify のアンカー生成はそこで壊れやすいため、ドキュメント見出しでは em dash とアポストロフィーを避けてください。
- README およびその他の GitHub でレンダリングされるドキュメントでは、Mintlify 外でもリンクが機能するように、絶対ドキュメント URL を維持してください。
- ドキュメント内容は汎用的に保つ必要があります。個人のデバイス名、ホスト名、ローカルパスは使わず、`user@gateway-host` のようなプレースホルダーを使用してください。

## ドキュメント内容の規則

- ドキュメント、UI コピー、ピッカーリストでは、セクションがランタイム順序または自動検出順序を明示的に説明している場合を除き、サービス/プロバイダーをアルファベット順に並べてください。
- バンドルされたプラグインの命名は、ルート `AGENTS.md` にあるリポジトリ全体のプラグイン用語規則と一貫させてください。

## 内部ドキュメント

- 長期的に維持する非公開の運用者向けドキュメントは `~/Projects/manager/docs/` に置きます。
- リポジトリローカルの内部スクラッチ/ミラードキュメントは、無視対象の `docs/internal/` 配下に置くことができます。
- `docs/internal/**` ページを `docs/docs.json` ナビゲーションに追加したり、公開ドキュメントからリンクしたりしてはいけません。
- `scripts/docs-sync-publish.mjs` は、後でページが強制追加された場合でも、公開 `openclaw/docs` 公開リポジトリから `docs/internal/**` を除外して削除します。
- 内部ドキュメントでは、リポジトリパス、非公開アプリ名、1Password アイテム名、ランブックに言及できますが、シークレット値を含めてはいけません。

## 成熟度スコアカードの編集

`taxonomy.yaml` と `qa/maturity-scores.yaml` がソース入力です。`docs/maturity/` 配下の生成済み成熟度ドキュメントは投影であり、スコア、LTS、分類体系、QA プロファイル、またはエビデンステーブルを手動編集してはいけません。
`scripts/qa/render-maturity-docs.ts` が生成を管理します。コミット済みドキュメントを更新するには `pnpm maturity:render` を使用し、検証するには `pnpm maturity:check` を使用してください。
`.github/workflows/maturity-scorecard.yml` はアーティファクトプレビューをレンダリングし、生成ドキュメント PR を開くことができます。`.github/workflows/openclaw-release-checks.yml` はリリース QA 用にそれをディスパッチします。
メンテナーがサニタイズ済みのコミット投影を明示的に求めない限り、決定論的な `qa-evidence.json.scorecard` データは GitHub Actions アーティファクトに保持してください。
人間による上書きは、PR でソース状態を変更し、理由と公開エビデンスまたは編集済みエビデンスを説明する必要があります。

## ドキュメント i18n

- 外国語ドキュメントはこのリポジトリではメンテナンスされません。生成された公開出力は、別の `openclaw/docs` リポジトリ（ローカルでは多くの場合 `../openclaw-docs` としてクローンされます）にあります。
- ここでは `docs/<locale>/**` 配下にローカライズ済みドキュメントを追加または編集しないでください。
- このリポジトリ内の英語ドキュメントと用語集ファイルを信頼できるソースとして扱ってください。
- パイプライン: ここで英語ドキュメントを更新し、必要に応じて `docs/.i18n/glossary.<locale>.json` を更新してから、公開リポジトリの同期と `scripts/docs-i18n` を `openclaw/docs` で実行させます。
- `scripts/docs-i18n` を再実行する前に、英語のままにする必要がある、または固定訳を使う必要がある新しい技術用語、ページタイトル、短いナビゲーションラベルについて、用語集エントリを追加してください。
- `pnpm docs:check-i18n-glossary` は、変更された英語ドキュメントタイトルと短い内部ドキュメントラベルのガードです。
- 翻訳メモリは、公開リポジトリ内の生成済み `docs/.i18n/*.tm.jsonl` ファイルにあります。
- `docs/.i18n/README.md` を参照してください。

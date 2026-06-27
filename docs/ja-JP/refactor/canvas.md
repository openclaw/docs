---
read_when:
    - Canvas のホスト、ツール、コマンド、ドキュメント、またはプロトコル所有権の移動
    - Canvas がまだコア所有かどうかの監査
    - 実験的な Canvas Plugin PR の準備またはレビュー
summary: Canvasをコアから切り出し、バンドルされた実験的Pluginへ移行するための計画と監査チェックリスト。
title: Canvas Plugin のリファクタリング
x-i18n:
    generated_at: "2026-05-07T13:25:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Canvas Plugin リファクター

Canvas は利用が少なく実験的です。コア機能ではなく、バンドル済みPluginとして扱ってください。コアは汎用の Gateway、Node、HTTP、認証、設定、ネイティブクライアントの配管を保持してもよいですが、Canvas 固有の挙動は `extensions/canvas` 配下に置くべきです。

## 目標

現在のペアリング済みNodeの挙動を維持しながら、Canvas の所有権を `extensions/canvas` に移します。

- エージェント向けの `canvas` ツールは Canvas Plugin によって登録される
- Canvas Node コマンドは、Canvas Plugin が登録した場合にのみ許可される
- A2UI ホスト/ソースファイルは Canvas Plugin 配下に置く
- Canvas ドキュメントの具現化は Canvas Plugin 配下に置く
- CLI コマンド実装は Canvas Plugin 配下に置くか、Plugin 所有のランタイムバレル経由で委譲する
- ドキュメントと Plugin インベントリは Canvas を実験的で Plugin に支えられたものとして説明する

## 非目標

- このリファクターでネイティブアプリの Canvas UI を再設計しない。
- Canvas を削除すべきという別のプロダクト判断がない限り、iOS、Android、macOS から Canvas プロトコル/クライアントサポートを削除しない。
- 少なくとも他のバンドル済みPlugin 1つが同じ継ぎ目を必要としない限り、Canvas のためだけに広範な Plugin サービスフレームワークを構築しない。

## 現在のブランチ状態

完了:

- `extensions/canvas` にバンドル済みPlugin パッケージを追加。
- `extensions/canvas/openclaw.plugin.json` を追加。
- エージェントの `canvas` ツールを `src/agents/tools/canvas-tool.ts` から `extensions/canvas/src/tool.ts` に移動。
- `src/agents/openclaw-tools.ts` から `createCanvasTool` のコア登録を削除。
- Canvas ホスト実装を `src/canvas-host` から `extensions/canvas/src/host` に移動。
- テスト、パッケージング、外部公開 Canvas ヘルパー向けの Plugin 所有互換バレルとして `extensions/canvas/runtime-api.ts` を保持。
- Canvas ドキュメントの具現化を `src/gateway/canvas-documents.ts` から `extensions/canvas/src/documents.ts` に移動。
- Canvas CLI 実装と A2UI JSONL ヘルパーを `extensions/canvas/src/cli.ts` に移動。
- Canvas ホスト URL とスコープ付き capability ヘルパーを `extensions/canvas/src` に移動。
- Canvas Node コマンドのデフォルトをハードコードされたコアリストから Plugin の `nodeInvokePolicies` に移動。
- Plugin 所有の Canvas ホスト設定を `plugins.entries.canvas.config.host` に追加。
- Canvas と A2UI の HTTP 配信を Canvas Plugin の HTTP ルート登録の背後へ移動。
- Plugin 所有 HTTP ルート向けの汎用 Plugin WebSocket アップグレードディスパッチを追加。
- Canvas 固有の Gateway ホスト URL と Node capability 認証を、汎用のホスト済みPlugin surface と Node capability ヘルパーに置き換え。
- Canvas ドキュメント URL が、コアが Canvas ドキュメント内部をインポートする代わりに Canvas Plugin 経由で解決されるよう、Plugin 所有のホスト済みメディアリゾルバーを追加。
- Canvas が親コマンドパスを手動で明記せずに `openclaw nodes canvas` を Plugin 所有の Node 機能として宣言できるよう、`api.registerNodeCliFeature(...)` を追加。
- `extensions/canvas/runtime-api.js` の本番 `src/**` インポートを削除。
- A2UI バンドルソースを `apps/shared/OpenClawKit/Tools/CanvasA2UI` から `extensions/canvas/src/host/a2ui-app` に移動。
- A2UI のビルド/コピー実装を `extensions/canvas/scripts` 配下に移し、ルートのビルド配線を汎用のバンドル済みPlugin アセットフックに置き換え。
- ランタイムのレガシートップレベル `canvasHost` 設定エイリアスを削除。
- `openclaw doctor --fix` が古い `canvasHost` 設定を `plugins.entries.canvas.config.host` に書き換えるよう、Canvas doctor マイグレーションを保持。
- Gateway プロトコル v4 の背後にあった古いエージェント向け Canvas プロトコル互換性を削除。ネイティブクライアントと Gateway は現在、`pluginSurfaceUrls.canvas` と `node.pluginSurface.refresh` のみを使用します。非推奨の `canvasHostUrl`、`canvasCapability`、`node.canvas.capability.refresh` パスは、この実験的リファクターでは意図的にサポートされません。
- 生成済みPlugin インベントリを更新して Canvas を含めた。
- `docs/plugins/reference/canvas.md` に Plugin リファレンスドキュメントを追加。

既知の残存するコア所有 Canvas surface:

- `apps/` 配下のネイティブアプリ Canvas ハンドラーは、引き続き意図的に Canvas Plugin surface を利用する
- `apps/` 配下のネイティブアプリ Canvas プロトコル/クライアントハンドラー
- 公開アーティファクト出力は後方互換のランタイム検索のために引き続き `dist/canvas-host/a2ui` を使用するが、コピー手順は現在 Plugin 所有

## 目標形

`extensions/canvas` が所有すべきもの:

- Plugin マニフェストとパッケージメタデータ
- エージェントツール登録
- Node invoke コマンドポリシー
- Canvas ホストと A2UI ランタイム
- Canvas A2UI バンドルソースとアセットのビルド/コピー scripts
- Canvas ドキュメント作成とアセット解決
- Canvas CLI 実装
- Canvas ドキュメントページと Plugin インベントリエントリ

コアが所有すべきなのは汎用の継ぎ目のみです。

- Plugin の発見と登録
- 汎用エージェントツールレジストリ
- 汎用 Node invoke ポリシーレジストリ
- 汎用 Gateway HTTP/認証と WebSocket アップグレードディスパッチ
- 汎用ホスト済みPlugin surface URL 解決
- 汎用ホスト済みメディアリゾルバー登録
- 汎用 Node capability トランスポート
- 汎用設定の配管
- 汎用バンドル済みPlugin アセットフック検出

ネイティブアプリはプロトコルのクライアントとして Canvas コマンドハンドラーを保持してもかまいません。Plugin ランタイムの所有者ではありません。

## 移行手順

1. `plugins.entries.canvas.config.host` を Plugin 所有の設定 surface として扱う。
2. Canvas が実験的なバンドル済みPlugin と説明されるようにドキュメントを更新する。
3. 集中的な Canvas テスト、Plugin インベントリチェック、Plugin SDK API チェック、ランタイム境界の影響を受けるビルド/型ゲートを実行する。

## 監査チェックリスト

リファクター完了と呼ぶ前に:

- `rg "src/canvas-host|../canvas-host"` がライブなソースインポートを返さない。
- `rg "canvas-tool|createCanvasTool" src` がコア所有の Canvas ツール実装を見つけない。
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` が、汎用 Plugin ポリシーテスト以外にハードコードされた許可リストのデフォルトを見つけない。
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` が空。
- `rg "canvas-documents" src` が空。
- `rg "registerNodesCanvasCommands|nodes-canvas" src` が空。Canvas Plugin はネストされた Plugin CLI メタデータを通じて `openclaw nodes canvas` を登録する。
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` が Gateway ランタイム所有権を返さない。
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` が互換ラッパーまたは Plugin 所有パスのみを見つける。
- `pnpm plugins:inventory:check` が通る。
- `pnpm plugin-sdk:api:check` が通る、または生成済み API ベースラインが意図的に更新されレビューされている。
- 対象を絞った Canvas テストが通る。
- Canvas ホスト/A2UI パスに対する changed-lanes テストが通る。
- PR 本文が Canvas は実験的で Plugin に支えられていると明示している。

## 検証コマンド

反復中は対象を絞ったローカルチェックを使用します。

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

ランタイムバレル、遅延インポート、パッケージング、または公開 Plugin surface が変わる場合は、push 前に `pnpm build` を実行してください。

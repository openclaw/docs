---
read_when:
    - Canvas のホスト、ツール、コマンド、ドキュメント、またはプロトコルの所有権の移管
    - Canvas が引き続きコア所有かどうかの監査
    - 実験的な Canvas Plugin の PR の準備またはレビュー
summary: Canvas をコアから分離し、バンドルされた実験的 Plugin に移行するための計画および監査チェックリスト。
title: Canvas Plugin のリファクタリング
x-i18n:
    generated_at: "2026-07-11T22:39:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
---

# Canvas plugin のリファクタリング

Canvas は利用頻度が低く、実験的です。コア機能ではなく、同梱 Plugin として扱います。コアには汎用的な Gateway、Node、HTTP、認証、設定、ネイティブクライアントの基盤を残せますが、Canvas 固有の動作は `extensions/canvas` 配下に置く必要があります。

## 目標

現在のペアリング済み Node の動作を維持しながら、Canvas の所有権を `extensions/canvas` に移します。

- エージェント向けの `canvas` ツールは Canvas Plugin が登録する
- Canvas Node コマンドは、Canvas Plugin が登録した場合にのみ許可される
- A2UI のホストおよびソースファイルは Canvas Plugin 配下に置く
- Canvas ドキュメントの実体化は Canvas Plugin 配下に置く
- CLI コマンドの実装は Canvas Plugin 配下に置くか、Plugin が所有するランタイムバレルを介して委譲する
- ドキュメントと Plugin インベントリでは、Canvas を実験的かつ Plugin ベースとして説明する

## 対象外

- このリファクタリングでは、ネイティブアプリの Canvas UI を再設計しない。
- Canvas を削除するという別途の製品判断がない限り、iOS、Android、macOS から Canvas のプロトコル／クライアント対応を削除しない。
- 同じ接続面を必要とする同梱 Plugin がほかに少なくとも 1 つない限り、Canvas のためだけに広範な Plugin サービスフレームワークを構築しない。

## 現在のブランチの状態

完了済み：

- `extensions/canvas` に同梱 Plugin パッケージを追加。
- `extensions/canvas/openclaw.plugin.json` を追加。
- エージェントの `canvas` ツールを `src/agents/tools/canvas-tool.ts` から `extensions/canvas/src/tool.ts` に移動。
- `src/agents/openclaw-tools.ts` から `createCanvasTool` のコア登録を削除。
- Canvas ホスト実装を `src/canvas-host` から `extensions/canvas/src/host` に移動。
- テスト、パッケージング、外部公開される Canvas ヘルパー向けに、Plugin が所有する互換性バレルとして `extensions/canvas/runtime-api.ts` を維持。
- Canvas ドキュメントの実体化を `src/gateway/canvas-documents.ts` から `extensions/canvas/src/documents.ts` に移動。
- Canvas CLI 実装と A2UI JSONL ヘルパーを `extensions/canvas/src/cli.ts` に移動。
- Canvas ホスト URL とスコープ付きケイパビリティのヘルパーを `extensions/canvas/src` に移動。
- Canvas Node コマンドのデフォルトを、ハードコードされたコアのリストから Plugin の `nodeInvokePolicies` に移動。
- `plugins.entries.canvas.config.host` に Plugin 所有の Canvas ホスト設定を追加。
- Canvas および A2UI の HTTP 配信を、Canvas Plugin の HTTP ルート登録の背後に移動。
- Plugin 所有の HTTP ルート向けに、汎用的な Plugin WebSocket アップグレードディスパッチを追加。
- Canvas 固有の Gateway ホスト URL と Node ケイパビリティ認証を、汎用的なホスト型 Plugin サーフェスおよび Node ケイパビリティヘルパーに置き換え。
- Plugin 所有のホスト型メディアリゾルバーを追加し、コアが Canvas ドキュメント内部をインポートする代わりに、Canvas ドキュメント URL が Canvas Plugin を介して解決されるように変更。
- `api.registerNodeCliFeature(...)` を追加し、親コマンドのパスを手動で記述せずに、Canvas が `openclaw nodes canvas` を Plugin 所有の Node 機能として宣言できるように変更。
- 本番用 `src/**` からの `extensions/canvas/runtime-api.js` のインポートを削除。
- A2UI バンドルのソースを `apps/shared/OpenClawKit/Tools/CanvasA2UI` から `extensions/canvas/src/host/a2ui-app` に移動。
- A2UI のビルド／コピー実装を `extensions/canvas/scripts` 配下に移動し、ルートのビルド接続を汎用的な同梱 Plugin アセットフックに置き換え。
- ランタイムのレガシーなトップレベル `canvasHost` 設定エイリアスを削除。
- `openclaw doctor --fix` が古い `canvasHost` 設定を `plugins.entries.canvas.config.host` に書き換えるよう、Canvas の doctor マイグレーションを維持。
- Gateway プロトコル v4 より前の旧エージェント向け Canvas プロトコル互換性を削除。ネイティブクライアントと Gateway は、`pluginSurfaceUrls.canvas` と `node.pluginSurface.refresh` のみを使用するようになりました。非推奨の `canvasHostUrl`、`canvasCapability`、`node.canvas.capability.refresh` の経路は、この実験的なリファクタリングでは意図的にサポートされません。
- 生成された Plugin インベントリを更新し、Canvas を追加。
- `docs/plugins/reference/canvas.md` に Plugin リファレンスドキュメントを追加。

コア所有のまま残っている既知の Canvas サーフェス：

- `apps/` 配下のネイティブアプリの Canvas ハンドラーは、引き続き意図的に Canvas Plugin サーフェスを利用する
- `apps/` 配下のネイティブアプリの Canvas プロトコル／クライアントハンドラー
- 公開アーティファクトの出力は、後方互換性のあるランタイム検索のために引き続き `dist/canvas-host/a2ui` を使用するが、コピー手順は現在 Plugin が所有する

## 目標構成

`extensions/canvas` が所有するもの：

- Plugin マニフェストとパッケージメタデータ
- エージェントツールの登録
- Node invoke コマンドポリシー
- Canvas ホストと A2UI ランタイム
- Canvas A2UI バンドルのソースとアセットのビルド／コピースクリプト
- Canvas ドキュメントの作成とアセット解決
- Canvas CLI の実装
- Canvas ドキュメントページと Plugin インベントリエントリ

コアが所有するのは汎用的な接続面のみ：

- Plugin の検出と登録
- 汎用エージェントツールレジストリ
- 汎用 Node invoke ポリシーレジストリ
- 汎用 Gateway HTTP／認証と WebSocket アップグレードディスパッチ
- 汎用ホスト型 Plugin サーフェス URL の解決
- 汎用ホスト型メディアリゾルバーの登録
- 汎用 Node ケイパビリティトランスポート
- 汎用設定基盤
- 汎用同梱 Plugin アセットフックの検出

ネイティブアプリは、プロトコルのクライアントとして Canvas コマンドハンドラーを保持できます。ネイティブアプリは Plugin ランタイムの所有者ではありません。

## 移行手順

1. `plugins.entries.canvas.config.host` を Plugin 所有の設定サーフェスとして扱う。
2. Canvas を実験的な同梱 Plugin として説明するようにドキュメントを更新する。
3. Canvas に焦点を当てたテスト、Plugin インベントリチェック、Plugin SDK API チェック、およびランタイム境界の影響を受けるビルド／型ゲートを実行する。

## 監査チェックリスト

リファクタリングの完了を宣言する前に：

- `rg "src/canvas-host|../canvas-host"` で使用中のソースインポートが検出されない。
- `rg "canvas-tool|createCanvasTool" src` でコア所有の Canvas ツール実装が検出されない。
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` で、汎用 Plugin ポリシーテスト以外にハードコードされた許可リストのデフォルトが検出されない。
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` の結果が空である。
- `rg "canvas-documents" src` の結果が空である。
- `rg "registerNodesCanvasCommands|nodes-canvas" src` の結果が空である。Canvas Plugin は、ネストされた Plugin CLI メタデータを通じて `openclaw nodes canvas` を登録する。
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` で Gateway ランタイムの所有が検出されない。
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` で、互換性ラッパーまたは Plugin 所有のパスのみが検出される。
- `pnpm plugins:inventory:check` が成功する。
- `pnpm plugin-sdk:api:check` が成功するか、生成された API ベースラインが意図的に更新され、レビューされている。
- Canvas を対象としたテストが成功する。
- Canvas ホスト／A2UI パスの変更レーンテストが成功する。
- PR 本文に、Canvas が実験的かつ Plugin ベースであることが明記されている。

## 検証コマンド

反復作業中は、対象を絞ったローカルチェックを使用します：

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

ランタイムバレル、遅延インポート、パッケージング、または公開される Plugin サーフェスを変更した場合は、プッシュ前に `pnpm build` を実行します。

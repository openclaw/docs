---
read_when:
    - Node専用の開発スクリプトまたはwatch modeの失敗をデバッグする
    - OpenClawにおけるtsx/esbuildローダークラッシュを調査する
summary: Node + tsx の「__name is not a function」クラッシュに関する注意点と回避策
title: Node + tsx クラッシュ
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T04:55:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d043466f71eae223fa568a3db82e424580ce3269ca11d0e84368beefc25bd25
    source_path: debug/node-issue.md
    workflow: 15
---

# Node + tsx の「\_\_name is not a function」クラッシュ

## 概要

`tsx` を使ってNode経由でOpenClawを実行すると、起動時に次のエラーで失敗します:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

これは、開発スクリプトをBunから `tsx` に切り替えた後（コミット `2871657e`、2026-01-06）に始まりました。同じランタイムパスはBunでは動作していました。

## 環境

- Node: v25.x（v25.3.0 で確認）
- tsx: 4.21.0
- OS: macOS（Node 25 を実行する他のプラットフォームでも再現する可能性あり）

## 再現手順（Nodeのみ）

```bash
# repo root で実行
node --version
pnpm install
node --import tsx src/entry.ts status
```

## リポジトリ内の最小再現

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Nodeバージョン確認

- Node 25.3.0: 失敗
- Node 22.22.0（Homebrew `node@22`）: 失敗
- Node 24: ここではまだ未インストール。確認が必要

## 注記 / 仮説

- `tsx` はTS/ESMの変換にesbuildを使います。esbuildの `keepNames` は `__name` ヘルパーを出力し、関数定義を `__name(...)` でラップします。
- このクラッシュは、実行時に `__name` は存在するが関数ではないことを示しています。つまり、Node 25 のローダーパスでこのモジュールに対してヘルパーが欠落しているか、上書きされていることを意味します。
- 同様の `__name` ヘルパーの問題は、ヘルパーが欠落している、または書き換えられている場合に、他のesbuild利用側でも報告されています。

## リグレッション履歴

- `2871657e`（2026-01-06）: Bunを任意にするため、スクリプトがBunからtsxに変更された
- それ以前（Bunパス）では、`openclaw status` と `gateway:watch` は動作していた

## 回避策

- 開発スクリプトにはBunを使う（現在の一時的な差し戻し）
- リポジトリの型チェックには `tsgo` を使い、その後ビルド出力を実行する:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- 履歴上の注記: このNode/tsx問題のデバッグ中にはここで `tsc` も使われていましたが、現在リポジトリの型チェックレーンでは `tsgo` を使います。
- 可能であればTSローダーでesbuildのkeepNamesを無効にする（`__name` ヘルパーの挿入を防ぐ）。現時点ではtsxはこれを公開していません。
- Node LTS（22/24）で `tsx` をテストし、この問題がNode 25固有かどうかを確認する

## 参考

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## 次のステップ

- Node 22/24 で再現し、Node 25 のリグレッションかどうかを確認する
- `tsx` nightly を試す、または既知のリグレッションがあればより古いバージョンに固定する
- Node LTSでも再現する場合は、`__name` スタックトレース付きの最小再現をupstreamに報告する

## 関連

- [Node.js install](/ja-JP/install/node)
- [Gatewayトラブルシューティング](/ja-JP/gateway/troubleshooting)

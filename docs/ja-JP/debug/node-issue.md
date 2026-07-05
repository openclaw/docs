---
read_when:
    - tsx/esbuild ローダーのクラッシュで、欠落している __name ヘルパーが言及される問題を調査する
summary: 過去の Node + tsx の「__name is not a function」クラッシュとその原因
title: Node + tsx のクラッシュ
x-i18n:
    generated_at: "2026-07-05T11:22:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97d2f62d24860cee65753027ba84c14c8d4ffb910ee17bb0032cf0409c427589
    source_path: debug/node-issue.md
    workflow: 16
---

# Node + tsx「\_\_name is not a function」クラッシュ

## ステータス

解決済みです。このクラッシュは、`package.json` で現在固定されている
`tsx` バージョン（`4.22.3`）でも、現在の Node リリースでも再現しません。将来の
`tsx`/esbuild アップグレードで再発した場合に備えて、ここに残しています。

## 元の症状

`tsx` 経由で OpenClaw の開発スクリプトを実行すると、起動時に次のエラーで失敗しました。

```text
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (src/logging/subsystem.ts)
    at <caller> (src/agents/auth-profiles/constants.ts)
```

行番号は省略しています。元のクラッシュ以降に両方のファイルが変更されており、
該当する具体的な行は現在一致しません。

これは、Bun を任意にするために開発スクリプトが Bun から `tsx` に切り替わった
（`2871657e`、2026-01-06）後に発生しました。同等の Bun ベースのパスではクラッシュしませんでした。
当初は macOS 上の Node v25.3.0 で確認されました。Node 25 を実行する他のプラットフォームも
影響を受ける可能性が高いと考えられていました。

## 原因

`tsx` は、変換オプションで `keepNames: true` をハードコードして、esbuild 経由で TS/ESM を変換します。
この設定により、esbuild は名前付き関数/クラス宣言を `__name` ヘルパーへの呼び出しでラップし、
minification や bundling 後も `fn.name` が維持されるようにします。このクラッシュは、影響を受ける
`tsx`/Node の組み合わせで、そのモジュールの呼び出し地点にヘルパーが存在しないか shadow されていたため、
`__name(...)` がラップ済みの値を返す代わりに例外を投げたことを意味します。

## 現在の再現確認

```bash
node --version
pnpm install
node --import tsx src/entry.ts status
```

最小の分離再現（元のスタックトレースにあるモジュールだけを読み込みます）。

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

現在はどちらのコマンドも正常終了します。どちらかが再び `__name is not a
function` を投げる場合は、upstream に報告する前に、正確な Node バージョン、`tsx` バージョン
（`node_modules/tsx/package.json`）、完全なスタックトレースを記録してください。

## 回避策（クラッシュが戻った場合）

- `node --import tsx` の代わりに Bun で開発スクリプトを実行します。
- 型チェックには `pnpm tsgo` を実行し、その後 `tsx` 経由でソースを実行する代わりに
  ビルド済み出力を実行します。

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- 別の `tsx` バージョンを試します（`pnpm add -D tsx@<version>` は依存関係の変更であり、
  repo policy に従って承認が必要です）。これにより、bundled されている esbuild バージョンが
  バグを再発させたかどうかを bisect できます。
- 別の Node major/minor でテストし、失敗がバージョン固有かどうかを確認します。

## 参考資料

- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## 関連

- [Node.js インストール](/ja-JP/install/node)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)

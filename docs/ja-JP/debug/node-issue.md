---
read_when:
    - 不足している __name ヘルパーについて言及する tsx/esbuild ローダーのクラッシュを調査する
summary: 過去に発生した Node + tsx の「__name is not a function」クラッシュとその原因
title: Node + tsx のクラッシュ
x-i18n:
    generated_at: "2026-07-11T22:13:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97d2f62d24860cee65753027ba84c14c8d4ffb910ee17bb0032cf0409c427589
    source_path: debug/node-issue.md
    workflow: 16
---

# Node + tsx の「\_\_name is not a function」クラッシュ

## 状態

解決済みです。このクラッシュは、`package.json` で固定されている現在の `tsx` バージョン（`4.22.3`）でも、現在の Node リリースでも再現しません。今後の `tsx`/esbuild のアップグレードで再発した場合に備えて、ここに記録を残しています。

## 元の症状

`tsx` を介して OpenClaw の開発スクリプトを実行すると、起動時に次のエラーで失敗しました。

```text
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (src/logging/subsystem.ts)
    at <caller> (src/agents/auth-profiles/constants.ts)
```

元のクラッシュ以降、両方のファイルが変更されており、該当する行が一致しなくなったため、行番号は省略しています。

これは、Bun を任意にするために開発スクリプトを Bun から `tsx` に切り替えた後（`2871657e`、2026-01-06）に発生しました。同等の Bun ベースの経路ではクラッシュしませんでした。当初は macOS 上の Node v25.3.0 で確認されましたが、Node 25 を実行する他のプラットフォームも影響を受ける可能性が高いと考えられていました。

## 原因

`tsx` は、変換オプションに `keepNames: true` をハードコードし、esbuild を介して TS/ESM を変換します。この設定により、esbuild は名前付き関数やクラスの宣言を `__name` ヘルパーの呼び出しでラップし、最小化やバンドル後も `fn.name` が維持されるようにします。このクラッシュは、影響を受ける `tsx`/Node の組み合わせで、そのモジュールの呼び出し箇所においてヘルパーが欠落していたか、別の定義によって隠されていたことを意味します。そのため、`__name(...)` はラップされた値を返さず、例外をスローしました。

## 現在の再現確認

```bash
node --version
pnpm install
node --import tsx src/entry.ts status
```

最小限の独立した再現手順（元のスタックトレースにあるモジュールのみを読み込みます）。

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

現在、どちらのコマンドも正常終了します。いずれかが再び `__name is not a function` をスローした場合は、上流に報告する前に、正確な Node バージョン、`tsx` バージョン（`node_modules/tsx/package.json`）、および完全なスタックトレースを記録してください。

## 回避策（クラッシュが再発した場合）

- 開発スクリプトを `node --import tsx` ではなく Bun で実行します。
- 型チェックには `pnpm tsgo` を実行し、その後、`tsx` を介してソースを実行する代わりに、ビルド済みの出力を実行します。

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- 別の `tsx` バージョンを試し（`pnpm add -D tsx@<version>` は依存関係の変更であり、リポジトリのポリシーに従って承認が必要です）、同梱されている esbuild のバージョンでバグが再発したかどうかを二分探索します。
- 別の Node メジャー／マイナーバージョンでテストし、障害が特定のバージョンに固有かどうかを確認します。

## 参考資料

- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## 関連項目

- [Node.js のインストール](/ja-JP/install/node)
- [Gateway のトラブルシューティング](/ja-JP/gateway/troubleshooting)

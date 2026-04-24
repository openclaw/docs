---
read_when:
    - 新しいコア capability と Plugin 登録 surface を追加する場合
    - コードを core、vendor Plugin、または feature Plugin のどこに置くべきか判断する場合
    - チャネルまたはツール向けの新しい runtime helper を配線する場合
sidebarTitle: Adding Capabilities
summary: OpenClaw Plugin システムに新しい共有 capability を追加するためのコントリビューターガイド
title: capability の追加（コントリビューターガイド）
x-i18n:
    generated_at: "2026-04-24T05:24:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: f1e3251b9150c9744d967e91f531dfce01435b13aea3a17088ccd54f2145d14f
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  これは OpenClaw コア開発者向けの**コントリビューターガイド**です。外部 Plugin を構築している場合は、代わりに [Building Plugins](/ja-JP/plugins/building-plugins)
  を参照してください。
</Info>

image generation、video generation、あるいは将来の vendor 提供機能領域のような新しいドメインが OpenClaw に必要なときにこれを使います。

ルールは次のとおりです:

- plugin = ownership boundary
- capability = shared core contract

つまり、vendor をチャネルやツールに直接配線するところから始めてはいけません。まず capability を定義してください。

## capability を作成するタイミング

次のすべてに当てはまる場合は、新しい capability を作成します:

1. 複数の vendor が実装できる可能性がある
2. チャネル、ツール、または feature Plugin が vendor を意識せずにそれを利用すべきである
3. fallback、policy、config、または配信動作を core が所有する必要がある

作業が vendor 専用で、まだ共有 contract が存在しないなら、いったん止まって先に contract を定義してください。

## 標準的な手順

1. 型付き core contract を定義する。
2. その contract 用の Plugin 登録を追加する。
3. 共有 runtime helper を追加する。
4. 実証として実在の vendor Plugin を 1 つ配線する。
5. feature / channel consumer を runtime helper に移行する。
6. contract テストを追加する。
7. operator 向け config と ownership model を文書化する。

## 何をどこに置くか

Core:

- request / response 型
- provider registry + resolution
- fallback 動作
- config schema と、ネストした object、wildcard、array-item、composition node に伝播される `title` / `description` ドキュメント metadata
- runtime helper surface

Vendor plugin:

- vendor API 呼び出し
- vendor 認証処理
- vendor 固有のリクエスト正規化
- capability 実装の登録

Feature / channel plugin:

- `api.runtime.*` または対応する `plugin-sdk/*-runtime` helper を呼ぶ
- vendor 実装を直接呼んではならない

## ファイルチェックリスト

新しい capability では、次の領域に触れることを想定してください:

- `src/<capability>/types.ts`
- `src/<capability>/...registry/runtime.ts`
- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/captured-registration.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/runtime/types-core.ts`
- `src/plugins/runtime/index.ts`
- `src/plugin-sdk/<capability>.ts`
- `src/plugin-sdk/<capability>-runtime.ts`
- 1 つ以上のバンドル済み Plugin パッケージ
- config / docs / tests

## 例: image generation

image generation は標準的な形に従います:

1. core が `ImageGenerationProvider` を定義する
2. core が `registerImageGenerationProvider(...)` を公開する
3. core が `runtime.imageGeneration.generate(...)` を公開する
4. `openai`、`google`、`fal`、`minimax` Plugin が vendor 提供の実装を登録する
5. 将来の vendor も、チャネル / ツールを変更せずに同じ contract を登録できる

config key は vision-analysis routing とは分かれています:

- `agents.defaults.imageModel` = 画像を解析する
- `agents.defaults.imageGenerationModel` = 画像を生成する

fallback と policy が明示的に保たれるよう、これらは分けたままにしてください。

## レビューチェックリスト

新しい capability を出荷する前に、次を確認してください:

- チャネル / ツールが vendor コードを直接 import していない
- runtime helper が共有パスになっている
- 少なくとも 1 つの contract テストが bundled ownership を検証している
- config docs に新しい model / config key が記載されている
- Plugin docs が ownership boundary を説明している

PR が capability レイヤーを飛ばして vendor の動作をチャネル / ツールにハードコードしている場合は、差し戻して先に contract を定義してください。

## 関連

- [Plugin](/ja-JP/tools/plugin)
- [Creating skills](/ja-JP/tools/creating-skills)
- [Tools and plugins](/ja-JP/tools)

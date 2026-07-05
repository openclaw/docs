---
read_when:
    - local GGUF モデルからメモリ検索埋め込みを使いたい
    - '`memorySearch.provider = "local"` を設定しています'
    - node-llama-cpp ランタイムを所有する OpenClaw Plugin が必要です
sidebarTitle: llama.cpp Provider
summary: ローカル GGUF メモリエンベディング用の公式 llama.cpp プロバイダーをインストールする
title: llama.cpp プロバイダー
x-i18n:
    generated_at: "2026-07-05T11:34:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bc8243a07b647f2f9a4b2da855997d39fb37704dfe584fc4f14076ab276b07a8
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` は、ローカル GGUF
埋め込み用の公式外部プロバイダー Plugin です。埋め込みプロバイダー ID `local` を登録し、`memorySearch.provider: "local"` で使用される
`node-llama-cpp` ランタイム依存関係を所有します。

ローカルメモリ埋め込みを使う前にインストールしてください。

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

メインの `openclaw` npm パッケージには `node-llama-cpp` は含まれません。ネイティブ依存関係をこの Plugin に保持することで、通常の OpenClaw npm 更新によって OpenClaw パッケージディレクトリ内に手動インストールされたランタイムが削除されるのを防ぎます。

## 設定

`memorySearch.provider` を `local` に設定します。

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        local: {
          modelPath: "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

`local.modelPath` のデフォルトは、上に示した `hf:` URI (`embeddinggemma-300m-qat-Q8_0.gguf`) です。
別のモデルを使うには、別の `hf:` URI またはローカルの `.gguf` ファイルを指定します。`local.modelCacheDir` は、ダウンロードしたモデルをキャッシュする場所
(デフォルト: `~/.node-llama-cpp/models`) を上書きし、`local.contextSize` は整数または `"auto"` を受け付けます。

## ネイティブランタイム

ネイティブインストール手順を最もスムーズに進めるには Node 24 を使用してください。pnpm を使用するソースチェックアウトでは、ネイティブ依存関係の承認と再ビルドが必要になる場合があります。

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## トラブルシューティング

`node-llama-cpp` が見つからない、または読み込みに失敗する場合、OpenClaw は次の内容で失敗を報告します。

1. Plugin をインストールします: `openclaw plugins install @openclaw/llama-cpp-provider`。
2. ネイティブインストール/更新には Node 24 を使用します。
3. pnpm ソースチェックアウトから: `pnpm approve-builds` を実行し、その後 `pnpm rebuild node-llama-cpp` を実行します。

ネイティブビルド手順なしでより手軽にローカル埋め込みを使うには、代わりに `memorySearch.provider` を `lmstudio`、`ollama`、`openai`、または `voyage` などのリモート埋め込みプロバイダーに設定します。

---
read_when:
    - ローカルの GGUF モデルによるメモリ検索用埋め込みが必要な場合
    - memorySearch.provider = "local" を設定しています
    - node-llama-cpp ランタイムを所有する OpenClaw Plugin が必要です
sidebarTitle: llama.cpp Provider
summary: ローカル GGUF メモリ埋め込み用の公式 llama.cpp プロバイダーをインストールする
title: llama.cpp プロバイダー
x-i18n:
    generated_at: "2026-07-11T22:28:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 369ec199e8493356912337b849a84f829672e8872d17083c9a597f4e5294ebd5
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` は、ローカル GGUF 埋め込み用の公式外部プロバイダー Plugin です。埋め込みプロバイダー ID `local` を登録し、`memorySearch.provider: "local"` が使用する `node-llama-cpp` ランタイム依存関係を管理します。

ローカルメモリ埋め込みを使用する前にインストールしてください。

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

メインの `openclaw` npm パッケージには `node-llama-cpp` は含まれていません。ネイティブ依存関係をこの Plugin に保持することで、通常の OpenClaw npm 更新時に、OpenClaw パッケージディレクトリ内へ手動でインストールしたランタイムが削除されるのを防ぎます。

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

`local.modelPath` のデフォルトは、上記の `hf:` URI（`embeddinggemma-300m-qat-Q8_0.gguf`）です。別のモデルを使用するには、異なる `hf:` URI またはローカルの `.gguf` ファイルを指定します。`local.modelCacheDir` では、ダウンロードしたモデルのキャッシュ先を上書きできます（デフォルト: `~/.node-llama-cpp/models`）。`local.contextSize` には整数または `"auto"` を指定できます。

`local.contextSize` が数値の場合、プロバイダーはその要件も node-llama-cpp の自動 GPU レイヤー配置に渡します。これにより、node-llama-cpp はメモリ安全性チェックを維持しながら、モデルと埋め込みコンテキストをまとめて収容できます。`"auto"` の場合、node-llama-cpp は通常の自動配置を維持します。

## ネイティブランタイム

ネイティブインストールを最も円滑に行うには Node 24 を使用してください。pnpm を使用するソースチェックアウトでは、ネイティブ依存関係の承認と再ビルドが必要になる場合があります。

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## ランタイム診断

プロバイダーの読み込み後に `openclaw memory status --deep` を実行すると、選択されたバックエンドとビルド、デバイス名、GPU にオフロードされたレイヤー、要求されたコンテキストサイズ、および最後に観測された VRAM またはユニファイドメモリのスナップショットを確認できます。受動的なステータス読み取りではモデルの再読み込みやデバイスのポーリングを行わないため、VRAM の値には観測タイムスタンプが含まれます。

実行中の Gateway がすでにローカルプロバイダーを使用している場合は、同じ最終確認済みの情報が `openclaw doctor` に表示されることがあります。通常のステータスコマンドや doctor コマンドは、診断情報を収集するためだけにモデルを読み込むことはありません。

## トラブルシューティング

`node-llama-cpp` が見つからないか読み込みに失敗した場合、OpenClaw はエラーとともに次の対処方法を表示します。

1. Plugin をインストールします: `openclaw plugins install @openclaw/llama-cpp-provider`。
2. ネイティブインストールや更新には Node 24 を使用します。
3. pnpm のソースチェックアウトでは、`pnpm approve-builds` を実行してから `pnpm rebuild node-llama-cpp` を実行します。

ネイティブビルド手順を省いて、より手軽にローカル埋め込みを利用するには、代わりに `memorySearch.provider` を `lmstudio`、`ollama`、`openai`、`voyage` などのリモート埋め込みプロバイダーに設定してください。

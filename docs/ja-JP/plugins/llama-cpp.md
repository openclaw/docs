---
read_when:
    - ローカルの GGUF モデルからメモリ検索埋め込みを使いたい
    - memorySearch.provider = "local" を設定しています
    - node-llama-cpp ランタイムを所有する OpenClaw Plugin が必要です
sidebarTitle: llama.cpp Provider
summary: ローカル GGUF メモリエンベディング用の公式 llama.cpp プロバイダーをインストールする
title: llama.cpp プロバイダー
x-i18n:
    generated_at: "2026-06-27T12:16:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b0988c36c5ed5c61a7e97980df291fb43a0071e57c7460bf5a653f516114963
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` は、ローカル GGUF 埋め込み用の公式外部プロバイダー Plugin です。
これは `memorySearch.provider: "local"` で使用される `node-llama-cpp` ランタイム依存関係を所有します。

ローカルメモリ埋め込みを使用する前にインストールしてください。

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

メインの `openclaw` npm パッケージには `node-llama-cpp` は含まれていません。ネイティブ依存関係をこの Plugin に置くことで、通常の OpenClaw npm 更新が、OpenClaw パッケージディレクトリ内に手動でインストールされたランタイムを削除してしまうことを防げます。

## 設定

メモリ検索プロバイダーを `local` に設定します。

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

デフォルトモデルは `embeddinggemma-300m-qat-Q8_0.gguf` です。`local.modelPath` にローカルの `.gguf` ファイルを指定することもできます。

## ネイティブランタイム

ネイティブインストール手順を最もスムーズに進めるには Node 24 を使用してください。pnpm を使用するソースチェックアウトでは、ネイティブ依存関係の承認と再ビルドが必要になる場合があります。

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

より手間の少ないローカル埋め込みには、代わりに Ollama や LM Studio などのローカルサービスプロバイダーを使用してください。

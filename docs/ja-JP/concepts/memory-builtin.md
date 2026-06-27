---
read_when:
    - デフォルトのメモリバックエンドを理解したい
    - 埋め込みプロバイダーまたはハイブリッド検索を設定したい場合
summary: キーワード検索、ベクトル検索、ハイブリッド検索に対応した、デフォルトの SQLite ベースのメモリバックエンド
title: 組み込みメモリエンジン
x-i18n:
    generated_at: "2026-06-27T11:10:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a867bd295778f81109b258a63a35a1683d652d4564e44335053af4d86f90584e
    source_path: concepts/memory-builtin.md
    workflow: 16
---

ビルトインエンジンはデフォルトのメモリバックエンドです。メモリインデックスを
エージェントごとの SQLite データベースに保存し、開始するための追加依存関係は不要です。

## 提供するもの

- FTS5 全文インデックス（BM25 スコアリング）による**キーワード検索**。
- 対応プロバイダーの埋め込みによる**ベクトル検索**。
- 最良の結果を得るために両方を組み合わせる**ハイブリッド検索**。
- 中国語、日本語、韓国語向けのトライグラムトークン化による **CJK 対応**。
- データベース内ベクトルクエリ用の **sqlite-vec 高速化**（任意）。

## はじめに

デフォルトでは、ビルトインエンジンは OpenAI 埋め込みを使用します。すでに
`OPENAI_API_KEY` または `models.providers.openai.apiKey` を設定している場合、追加のメモリ設定なしで
ベクトル検索が動作します。

プロバイダーを明示的に設定するには:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
      },
    },
  },
}
```

埋め込みプロバイダーがない場合、キーワード検索のみが利用できます。

ローカル GGUF 埋め込みを強制するには、公式の llama.cpp プロバイダー Plugin をインストールし、
`local.modelPath` に GGUF ファイルを指定します:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        fallback: "none",
        local: {
          modelPath: "~/.node-llama-cpp/models/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

## 対応する埋め込みプロバイダー

| プロバイダー      | ID                  | 注記                                |
| ----------------- | ------------------- | ----------------------------------- |
| Bedrock           | `bedrock`           | AWS 認証情報チェーンを使用          |
| DeepInfra         | `deepinfra`         | デフォルト: `BAAI/bge-m3`           |
| Gemini            | `gemini`            | マルチモーダル（画像 + 音声）に対応 |
| GitHub Copilot    | `github-copilot`    | Copilot サブスクリプションを使用    |
| Local             | `local`             | `@openclaw/llama-cpp-provider`      |
| Mistral           | `mistral`           |                                     |
| Ollama            | `ollama`            | ローカル/セルフホスト               |
| OpenAI            | `openai`            | デフォルト: `text-embedding-3-small` |
| OpenAI-compatible | `openai-compatible` | 汎用 `/v1/embeddings` エンドポイント |
| Voyage            | `voyage`            |                                     |

OpenAI 以外に切り替えるには、`memorySearch.provider` を設定します。

## インデックス作成の仕組み

OpenClaw は `MEMORY.md` と `memory/*.md` をチャンク（約400トークン、
80トークンのオーバーラップ）に分割してインデックス化し、エージェントごとの SQLite データベースに保存します。

- **インデックスの場所:** 所有エージェントのデータベース:
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **ストレージメンテナンス:** SQLite WAL サイドカーは、定期的なチェックポイントと
  シャットダウン時のチェックポイントで制限されます。
- **ファイル監視:** メモリファイルへの変更はデバウンスされた再インデックス（1.5秒）をトリガーします。
- **自動再インデックス:** 埋め込みプロバイダー、モデル、またはチャンク設定が
  変更されると、インデックス全体が自動的に再構築されます。
- **オンデマンド再インデックス:** `openclaw memory index --force`

<Info>
`memorySearch.extraPaths` を使って、ワークスペース外の Markdown ファイルも
インデックス化できます。詳しくは
[設定リファレンス](/ja-JP/reference/memory-config#additional-memory-paths)を参照してください。
</Info>

## 使用すべき場合

ビルトインエンジンはほとんどのユーザーに適した選択肢です:

- 追加依存関係なしでそのまま動作します。
- キーワード検索とベクトル検索を適切に処理します。
- すべての埋め込みプロバイダーに対応します。
- ハイブリッド検索は、両方の検索アプローチの長所を組み合わせます。

再ランキング、クエリ拡張が必要な場合、またはワークスペース外のディレクトリを
インデックス化したい場合は、[QMD](/ja-JP/concepts/memory-qmd) への切り替えを検討してください。

自動ユーザーモデリングを備えたセッション横断メモリが必要な場合は、
[Honcho](/ja-JP/concepts/memory-honcho) を検討してください。

## トラブルシューティング

**メモリ検索が無効ですか？** `openclaw memory status` を確認してください。プロバイダーが
検出されない場合は、明示的に設定するか API キーを追加してください。

**ローカルプロバイダーが検出されませんか？** ローカルパスが存在することを確認し、次を実行してください:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

スタンドアロン CLI コマンドと Gateway はどちらも同じ `local` プロバイダー ID を使用します。
ローカル埋め込みを使いたい場合は、`memorySearch.provider: "local"` を設定してください。

**結果が古いですか？** 再構築するには `openclaw memory index --force` を実行してください。まれなエッジケースでは、ウォッチャーが
変更を見逃すことがあります。

**sqlite-vec が読み込まれませんか？** OpenClaw は自動的にプロセス内コサイン類似度にフォールバックします。
`openclaw memory status --deep` はローカルベクトルストアを埋め込みプロバイダーとは別に報告するため、
`Vector store: unavailable` は sqlite-vec の読み込みを示し、`Embeddings: unavailable` はプロバイダー/認証
またはモデルの準備状態を示します。具体的な読み込みエラーについてはログを確認してください。

## 設定

埋め込みプロバイダーのセットアップ、ハイブリッド検索のチューニング（重み、MMR、時間的
減衰）、バッチインデックス作成、マルチモーダルメモリ、sqlite-vec、追加パス、その他すべての
設定ノブについては、
[メモリ設定リファレンス](/ja-JP/reference/memory-config)を参照してください。

## 関連

- [メモリ概要](/ja-JP/concepts/memory)
- [メモリ検索](/ja-JP/concepts/memory-search)
- [Active Memory](/ja-JP/concepts/active-memory)

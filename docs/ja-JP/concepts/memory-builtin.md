---
read_when:
    - デフォルトのメモリバックエンドについて理解したい場合
    - 埋め込みプロバイダーまたはハイブリッド検索を設定する場合
summary: キーワード検索、ベクトル検索、ハイブリッド検索に対応するデフォルトのSQLiteベースのメモリバックエンド
title: 組み込みメモリエンジン
x-i18n:
    generated_at: "2026-07-11T22:10:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8cbe2bae73b1d393ac158edb67fc442e76d1e5ff93e5201dbb7e7216801aa85
    source_path: concepts/memory-builtin.md
    workflow: 16
---

組み込みエンジンはデフォルトのメモリバックエンドです。メモリインデックスをエージェントごとの SQLite データベースに保存し、利用開始に追加の依存関係は必要ありません。

## 提供する機能

- FTS5 全文インデックス（BM25 スコアリング）による**キーワード検索**。
- サポートされている任意のプロバイダーの埋め込みによる**ベクトル検索**。
- 最良の結果を得るために両方を組み合わせる**ハイブリッド検索**。
- 中国語、日本語、韓国語向けのトライグラムトークン化による**CJK サポート**。
- データベース内ベクトルクエリ向けの **sqlite-vec 高速化**（任意）。

## はじめに

デフォルトでは、組み込みエンジンは OpenAI の埋め込みを使用します。`OPENAI_API_KEY` または
`models.providers.openai.apiKey` がすでに設定されている場合、メモリに関する追加設定なしでベクトル検索が機能します。

プロバイダーを明示的に設定するには、次のようにします。

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

埋め込みプロバイダーがない場合は、キーワード検索のみ利用できます。

ローカルの GGUF 埋め込みを強制的に使用するには、公式の llama.cpp プロバイダー
Plugin をインストールし、`local.modelPath` で GGUF ファイルを指定します。

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

## サポートされている埋め込みプロバイダー

| プロバイダー      | ID                  | 備考                                       |
| ----------------- | ------------------- | ------------------------------------------ |
| Bedrock           | `bedrock`           | AWS 認証情報チェーンを使用                 |
| DeepInfra         | `deepinfra`         | デフォルト: `BAAI/bge-m3`                  |
| Gemini            | `gemini`            | マルチモーダル（画像 + 音声）をサポート    |
| GitHub Copilot    | `github-copilot`    | Copilot サブスクリプションを使用           |
| LM Studio         | `lmstudio`          | ローカル／セルフホスト                     |
| ローカル          | `local`             | `@openclaw/llama-cpp-provider`              |
| Mistral           | `mistral`           |                                            |
| Ollama            | `ollama`            | ローカル／セルフホスト                     |
| OpenAI            | `openai`            | デフォルト: `text-embedding-3-small`        |
| OpenAI 互換       | `openai-compatible` | 汎用 `/v1/embeddings` エンドポイント       |
| Voyage            | `voyage`            |                                            |

OpenAI 以外に切り替えるには、`memorySearch.provider` を設定します。

## インデックス作成の仕組み

OpenClaw は `MEMORY.md` と `memory/*.md` をチャンク（デフォルトでは 400 トークン、80 トークンのオーバーラップ）に分割してインデックスを作成し、エージェントごとの SQLite データベースに保存します。

- **インデックスの場所:** 所有するエージェントのデータベース
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **ストレージのメンテナンス:** SQLite WAL サイドカーは、定期チェックポイントおよび
  シャットダウン時のチェックポイントによってサイズが制限されます。
- **ファイル監視:** メモリファイルの変更により、デバウンスされた再インデックスが実行されます
  （デフォルトは 1.5 秒）。
- **自動再インデックス:** 埋め込みプロバイダー、モデル、チャンク設定、設定済みソース、またはスコープが変更されると、インデックスが自動的に再構築されます。
- **オンデマンド再インデックス:** `openclaw memory index --force`

<Info>
`memorySearch.extraPaths` を使用して、ワークスペース外の Markdown ファイルもインデックスに追加できます。詳しくは、
[設定リファレンス](/ja-JP/reference/memory-config#additional-memory-paths)を参照してください。
</Info>

## 使用する場面

組み込みエンジンは、ほとんどのユーザーに適しています。

- 追加の依存関係なしで、すぐに利用できます。
- キーワード検索とベクトル検索の両方を適切に処理します。
- すべての埋め込みプロバイダーをサポートします。
- ハイブリッド検索により、両方の検索手法の長所を組み合わせます。

再ランキングやクエリ拡張が必要な場合、またはワークスペース外のディレクトリをインデックスに追加したい場合は、[QMD](/ja-JP/concepts/memory-qmd)への切り替えを検討してください。

自動的なユーザーモデリングを伴うセッション横断メモリが必要な場合は、[Honcho](/ja-JP/concepts/memory-honcho)を検討してください。

## トラブルシューティング

**メモリ検索が無効ですか？** `openclaw memory status` を確認してください。プロバイダーが検出されない場合は、明示的に設定するか API キーを追加してください。

**ローカルプロバイダーが検出されませんか？** ローカルパスが存在することを確認し、次を実行してください。

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

スタンドアロンの CLI コマンドと Gateway は、どちらも同じ `local` プロバイダー ID を使用します。
ローカル埋め込みを使用する場合は、`memorySearch.provider: "local"` を設定してください。

**結果が古いですか？** `openclaw memory index --force` を実行して再構築してください。まれなエッジケースでは、ウォッチャーが変更を検出できないことがあります。

**sqlite-vec が読み込まれませんか？** OpenClaw は自動的にプロセス内のコサイン類似度計算へフォールバックします。`openclaw memory status --deep` はローカルベクトルストアを埋め込みプロバイダーとは別に報告するため、`Vector store:
unavailable` は sqlite-vec の読み込みを示し、`Embeddings: unavailable`
はプロバイダー／認証またはモデルの準備状態を示します。具体的な読み込みエラーについてはログを確認してください。

## 設定

埋め込みプロバイダーのセットアップ、ハイブリッド検索の調整（重み、MMR、時間減衰）、バッチインデックス作成、マルチモーダルメモリ、sqlite-vec、追加パス、およびその他すべての設定項目については、
[メモリ設定リファレンス](/ja-JP/reference/memory-config)を参照してください。

## 関連項目

- [メモリの概要](/ja-JP/concepts/memory)
- [メモリ検索](/ja-JP/concepts/memory-search)
- [Active Memory](/ja-JP/concepts/active-memory)

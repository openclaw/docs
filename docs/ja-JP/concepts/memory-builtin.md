---
read_when:
    - デフォルトのメモリバックエンドを理解したい
    - 埋め込みプロバイダーまたはハイブリッド検索を構成したい
summary: キーワード検索、ベクトル検索、ハイブリッド検索に対応したデフォルトのSQLiteベースのメモリバックエンド
title: 組み込みメモリエンジン
x-i18n:
    generated_at: "2026-07-05T11:16:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8cbe2bae73b1d393ac158edb67fc442e76d1e5ff93e5201dbb7e7216801aa85
    source_path: concepts/memory-builtin.md
    workflow: 16
---

組み込みエンジンはデフォルトのメモリバックエンドです。メモリインデックスを
エージェントごとの SQLite データベースに保存し、はじめるための追加依存関係は
不要です。

## 提供されるもの

- FTS5 全文インデックス（BM25 スコアリング）による **キーワード検索**。
- サポートされている任意のプロバイダーの埋め込みによる **ベクトル検索**。
- 最良の結果を得るために両方を組み合わせる **ハイブリッド検索**。
- 中国語、日本語、韓国語向けのトライグラムトークン化による **CJK サポート**。
- データベース内ベクトルクエリ向けの **sqlite-vec 高速化**（任意）。

## はじめに

デフォルトでは、組み込みエンジンは OpenAI 埋め込みを使用します。`OPENAI_API_KEY` または
`models.providers.openai.apiKey` がすでに設定されている場合、追加のメモリ設定なしで
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

埋め込みプロバイダーがない場合、キーワード検索のみ利用できます。

ローカルの GGUF 埋め込みを強制するには、公式の llama.cpp プロバイダー
plugin をインストールしてから、`local.modelPath` を GGUF ファイルに向けます。

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

| プロバイダー      | ID                  | 注記                                |
| ----------------- | ------------------- | ----------------------------------- |
| Bedrock           | `bedrock`           | AWS 認証情報チェーンを使用          |
| DeepInfra         | `deepinfra`         | デフォルト: `BAAI/bge-m3`           |
| Gemini            | `gemini`            | マルチモーダル（画像 + 音声）に対応 |
| GitHub Copilot    | `github-copilot`    | Copilot サブスクリプションを使用    |
| LM Studio         | `lmstudio`          | ローカル/セルフホスト               |
| Local             | `local`             | `@openclaw/llama-cpp-provider`      |
| Mistral           | `mistral`           |                                     |
| Ollama            | `ollama`            | ローカル/セルフホスト               |
| OpenAI            | `openai`            | デフォルト: `text-embedding-3-small` |
| OpenAI-compatible | `openai-compatible` | 汎用 `/v1/embeddings` エンドポイント |
| Voyage            | `voyage`            |                                     |

OpenAI 以外に切り替えるには、`memorySearch.provider` を設定します。

## インデックス作成の仕組み

OpenClaw は `MEMORY.md` と `memory/*.md` をチャンク（デフォルトでは 400 トークン、
80 トークンの重複）にインデックス化し、エージェントごとの SQLite データベースに保存します。

- **インデックスの場所:** 所有するエージェントデータベース:
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **ストレージメンテナンス:** SQLite WAL サイドカーは定期チェックポイントと
  シャットダウン時チェックポイントで範囲内に保たれます。
- **ファイル監視:** メモリファイルの変更により、デバウンスされた再インデックスが
  トリガーされます（デフォルト 1.5 秒）。
- **自動再インデックス:** 埋め込みプロバイダー、モデル、チャンク化設定、設定済みソース、
  またはスコープが変更されると、インデックスは自動的に再構築されます。
- **オンデマンド再インデックス:** `openclaw memory index --force`

<Info>
`memorySearch.extraPaths` を使って、ワークスペース外の Markdown ファイルも
インデックス化できます。
[設定リファレンス](/ja-JP/reference/memory-config#additional-memory-paths)を参照してください。
</Info>

## 使用する場面

組み込みエンジンはほとんどのユーザーに適した選択です。

- 追加依存関係なしでそのまま動作します。
- キーワード検索とベクトル検索を適切に処理します。
- すべての埋め込みプロバイダーをサポートします。
- ハイブリッド検索は、両方の取得アプローチの最良部分を組み合わせます。

再ランキング、クエリ拡張、またはワークスペース外のディレクトリをインデックス化する必要がある場合は、
[QMD](/ja-JP/concepts/memory-qmd) への切り替えを検討してください。

自動ユーザーモデリングを伴うセッション横断メモリが必要な場合は、
[Honcho](/ja-JP/concepts/memory-honcho) を検討してください。

## トラブルシューティング

**メモリ検索が無効ですか？** `openclaw memory status` を確認してください。プロバイダーが
検出されない場合は、明示的に設定するか API キーを追加してください。

**ローカルプロバイダーが検出されませんか？** ローカルパスが存在することを確認し、次を実行します。

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

スタンドアロン CLI コマンドと Gateway はどちらも同じ `local` プロバイダー ID を使用します。
ローカル埋め込みを使用したい場合は、`memorySearch.provider: "local"` を設定してください。

**古い結果ですか？** 再構築するには `openclaw memory index --force` を実行してください。まれなエッジケースでは、
ウォッチャーが変更を見逃す場合があります。

**sqlite-vec が読み込まれませんか？** OpenClaw は自動的にプロセス内のコサイン類似度に
フォールバックします。`openclaw memory status --deep` はローカルのベクトルストアを
埋め込みプロバイダーとは別に報告するため、`Vector store:
unavailable` は sqlite-vec の読み込みを指し、`Embeddings: unavailable` は
プロバイダー/認証またはモデル準備状況を指します。具体的な読み込みエラーはログを確認してください。

## 設定

埋め込みプロバイダーのセットアップ、ハイブリッド検索の調整（重み、MMR、時間減衰）、
バッチインデックス作成、マルチモーダルメモリ、sqlite-vec、追加パス、その他すべての
設定項目については、
[メモリ設定リファレンス](/ja-JP/reference/memory-config)を参照してください。

## 関連

- [メモリ概要](/ja-JP/concepts/memory)
- [メモリ検索](/ja-JP/concepts/memory-search)
- [Active Memory](/ja-JP/concepts/active-memory)

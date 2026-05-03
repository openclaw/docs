---
read_when:
    - デフォルトのメモリバックエンドを理解したい
    - 埋め込みプロバイダーまたはハイブリッド検索を設定したい場合
summary: キーワード検索、ベクトル検索、ハイブリッド検索に対応した、既定の SQLite ベースのメモリバックエンド
title: 組み込みメモリエンジン
x-i18n:
    generated_at: "2026-05-03T21:30:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72f5d1fee02bff0962bd012575b62846c1f11c030fd1174fdb2af1e81909f52a
    source_path: concepts/memory-builtin.md
    workflow: 16
---

組み込みエンジンはデフォルトのメモリバックエンドです。メモリインデックスを
エージェントごとの SQLite データベースに保存し、はじめるための追加依存関係は不要です。

## 提供するもの

- FTS5 全文インデックス（BM25 スコアリング）による**キーワード検索**。
- 対応プロバイダーの埋め込みによる**ベクトル検索**。
- 最良の結果を得るために両方を組み合わせる**ハイブリッド検索**。
- 中国語、日本語、韓国語向けの trigram トークン化による**CJK 対応**。
- データベース内ベクトルクエリ向けの **sqlite-vec アクセラレーション**（任意）。

## はじめに

OpenAI、Gemini、Voyage、Mistral、DeepInfra の API キーがある場合、組み込み
エンジンが自動検出してベクトル検索を有効にします。設定は不要です。

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

埋め込みプロバイダーがない場合、利用できるのはキーワード検索のみです。

組み込みのローカル埋め込みプロバイダーを強制するには、任意の
`node-llama-cpp` ランタイムパッケージを OpenClaw の隣にインストールし、`local.modelPath` が
GGUF ファイルを指すようにします:

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

| プロバイダー | ID          | 自動検出 | 注記                                |
| ------------ | ----------- | -------- | ----------------------------------- |
| OpenAI       | `openai`    | はい     | デフォルト: `text-embedding-3-small` |
| Gemini       | `gemini`    | はい     | マルチモーダル（画像 + 音声）対応   |
| Voyage       | `voyage`    | はい     |                                     |
| Mistral      | `mistral`   | はい     |                                     |
| DeepInfra    | `deepinfra` | はい     | デフォルト: `BAAI/bge-m3`           |
| Ollama       | `ollama`    | いいえ   | ローカル。明示的に設定              |
| Local        | `local`     | はい（最初） | 任意の `node-llama-cpp` ランタイム |

自動検出は、API キーを解決できる最初のプロバイダーを、表示された
順序で選びます。上書きするには `memorySearch.provider` を設定します。

## インデックス作成の仕組み

OpenClaw は `MEMORY.md` と `memory/*.md` をチャンク（約 400 トークン、
80 トークンのオーバーラップ）に分割してインデックス化し、エージェントごとの SQLite データベースに保存します。

- **インデックスの場所:** `~/.openclaw/memory/<agentId>.sqlite`
- **ストレージメンテナンス:** SQLite WAL サイドカーは、定期チェックポイントと
  シャットダウン時チェックポイントで制限されます。
- **ファイル監視:** メモリファイルの変更により、デバウンスされた再インデックス（1.5 秒）がトリガーされます。
- **自動再インデックス:** 埋め込みプロバイダー、モデル、またはチャンク設定が
  変更されると、インデックス全体が自動的に再構築されます。
- **オンデマンド再インデックス:** `openclaw memory index --force`

<Info>
`memorySearch.extraPaths` を使って、ワークスペース外の Markdown ファイルも
インデックス化できます。[設定リファレンス](/ja-JP/reference/memory-config#additional-memory-paths)を参照してください。
</Info>

## 使用する場面

組み込みエンジンはほとんどのユーザーに適した選択肢です:

- 追加依存関係なしで、そのまま動作します。
- キーワード検索とベクトル検索を適切に処理します。
- すべての埋め込みプロバイダーに対応しています。
- ハイブリッド検索は、両方の検索アプローチの長所を組み合わせます。

再ランキング、クエリ拡張、またはワークスペース外のディレクトリをインデックス化する必要がある場合は、
[QMD](/ja-JP/concepts/memory-qmd) への切り替えを検討してください。

自動ユーザーモデリングを備えたセッション横断メモリが必要な場合は、
[Honcho](/ja-JP/concepts/memory-honcho) を検討してください。

## トラブルシューティング

**メモリ検索が無効ですか？** `openclaw memory status` を確認してください。プロバイダーが
検出されない場合は、明示的に設定するか API キーを追加してください。

**ローカルプロバイダーが検出されませんか？** ローカルパスが存在することを確認し、次を実行します:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

スタンドアロンの CLI コマンドと Gateway は、どちらも同じ `local` プロバイダー ID を使用します。
プロバイダーが `auto` に設定されている場合、`memorySearch.local.modelPath` が既存のローカルファイルを指しているときにのみ、
ローカル埋め込みが最初に考慮されます。

**古い結果が表示されますか？** 再構築するには `openclaw memory index --force` を実行してください。まれなエッジケースでは、ウォッチャーが変更を見逃すことがあります。

**sqlite-vec が読み込まれませんか？** OpenClaw は自動的にプロセス内のコサイン類似度にフォールバックします。
`openclaw memory status --deep` はローカルベクトルストアを埋め込みプロバイダーとは別に報告するため、
`Vector store: unavailable` は sqlite-vec の読み込みを示し、`Embeddings: unavailable` はプロバイダー/認証
またはモデルの準備状態を示します。具体的な読み込みエラーはログで確認してください。

## 設定

埋め込みプロバイダーのセットアップ、ハイブリッド検索のチューニング（重み、MMR、時間的
減衰）、バッチインデックス作成、マルチモーダルメモリ、sqlite-vec、追加パス、その他すべての
設定項目については、[メモリ設定リファレンス](/ja-JP/reference/memory-config)を参照してください。

## 関連

- [メモリの概要](/ja-JP/concepts/memory)
- [メモリ検索](/ja-JP/concepts/memory-search)
- [Active Memory](/ja-JP/concepts/active-memory)

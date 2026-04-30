---
read_when:
    - デフォルトのメモリバックエンドを理解したい
    - 埋め込みプロバイダーまたはハイブリッド検索を設定したい場合
summary: キーワード検索、ベクトル検索、ハイブリッド検索を備えた、デフォルトの SQLite ベースのメモリバックエンド
title: 組み込みメモリエンジン
x-i18n:
    generated_at: "2026-04-30T05:07:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: aa1597a9a49a6f1124cedf49f6f5a4c336f76dd5998ced246affb9c2e8171f05
    source_path: concepts/memory-builtin.md
    workflow: 16
---

組み込みエンジンはデフォルトのメモリバックエンドです。エージェントごとの SQLite データベースにメモリインデックスを保存し、使い始めるための追加依存関係は必要ありません。

## 提供するもの

- FTS5 全文インデックス（BM25 スコアリング）による**キーワード検索**。
- サポートされている任意のプロバイダーからの埋め込みによる**ベクトル検索**。
- 最良の結果を得るために両方を組み合わせる**ハイブリッド検索**。
- 中国語、日本語、韓国語向けの trigram トークン化による**CJK サポート**。
- データベース内ベクトルクエリのための **sqlite-vec 高速化**（オプション）。

## はじめに

OpenAI、Gemini、Voyage、Mistral、DeepInfra の API キーがある場合、組み込みエンジンはそれを自動検出してベクトル検索を有効にします。設定は不要です。

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

埋め込みプロバイダーがない場合は、キーワード検索のみ利用できます。

組み込みのローカル埋め込みプロバイダーを強制するには、オプションの `node-llama-cpp` ランタイムパッケージを OpenClaw の隣にインストールし、`local.modelPath` が GGUF ファイルを指すようにします:

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

| プロバイダー | ID          | 自動検出 | 注記                                |
| ------------ | ----------- | -------- | ----------------------------------- |
| OpenAI       | `openai`    | はい     | デフォルト: `text-embedding-3-small` |
| Gemini       | `gemini`    | はい     | マルチモーダル（画像 + 音声）をサポート |
| Voyage       | `voyage`    | はい     |                                     |
| Mistral      | `mistral`   | はい     |                                     |
| DeepInfra    | `deepinfra` | はい     | デフォルト: `BAAI/bge-m3`            |
| Ollama       | `ollama`    | いいえ   | ローカル、明示的に設定              |
| Local        | `local`     | はい（最初） | オプションの `node-llama-cpp` ランタイム |

自動検出では、API キーを解決できる最初のプロバイダーが、表示されている順序で選択されます。上書きするには `memorySearch.provider` を設定します。

## インデックス作成の仕組み

OpenClaw は `MEMORY.md` と `memory/*.md` をチャンク（約 400 トークン、80 トークンのオーバーラップ）に分割してインデックス化し、エージェントごとの SQLite データベースに保存します。

- **インデックスの場所:** `~/.openclaw/memory/<agentId>.sqlite`
- **ストレージ保守:** SQLite WAL サイドカーは、定期チェックポイントとシャットダウン時チェックポイントで上限管理されます。
- **ファイル監視:** メモリファイルの変更により、デバウンスされた再インデックス（1.5 秒）がトリガーされます。
- **自動再インデックス:** 埋め込みプロバイダー、モデル、またはチャンク化設定が変更されると、インデックス全体が自動的に再構築されます。
- **オンデマンド再インデックス:** `openclaw memory index --force`

<Info>
`memorySearch.extraPaths` を使って、ワークスペース外の Markdown ファイルもインデックス化できます。詳しくは[設定リファレンス](/ja-JP/reference/memory-config#additional-memory-paths)を参照してください。
</Info>

## 使用するタイミング

組み込みエンジンはほとんどのユーザーに適した選択肢です:

- 追加依存関係なしですぐに動作します。
- キーワード検索とベクトル検索を適切に処理します。
- すべての埋め込みプロバイダーをサポートします。
- ハイブリッド検索は、両方の検索アプローチの長所を組み合わせます。

再ランキング、クエリ拡張が必要な場合、またはワークスペース外のディレクトリをインデックス化したい場合は、[QMD](/ja-JP/concepts/memory-qmd) への切り替えを検討してください。

自動ユーザーモデリングを伴うセッション横断メモリが必要な場合は、[Honcho](/ja-JP/concepts/memory-honcho) を検討してください。

## トラブルシューティング

**メモリ検索が無効ですか？** `openclaw memory status` を確認してください。プロバイダーが検出されない場合は、明示的に設定するか API キーを追加してください。

**ローカルプロバイダーが検出されませんか？** ローカルパスが存在することを確認し、次を実行してください:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

スタンドアロン CLI コマンドと Gateway は、どちらも同じ `local` プロバイダー ID を使用します。プロバイダーが `auto` に設定されている場合、`memorySearch.local.modelPath` が既存のローカルファイルを指しているときにのみ、ローカル埋め込みが最初に考慮されます。

**結果が古いですか？** 再構築するには `openclaw memory index --force` を実行してください。まれなエッジケースでは、ウォッチャーが変更を見逃すことがあります。

**sqlite-vec が読み込まれませんか？** OpenClaw は自動的にプロセス内コサイン類似度にフォールバックします。具体的な読み込みエラーはログを確認してください。

## 設定

埋め込みプロバイダーのセットアップ、ハイブリッド検索の調整（重み、MMR、時間減衰）、バッチインデックス作成、マルチモーダルメモリ、sqlite-vec、追加パス、その他すべての設定項目については、[メモリ設定リファレンス](/ja-JP/reference/memory-config)を参照してください。

## 関連

- [メモリ概要](/ja-JP/concepts/memory)
- [メモリ検索](/ja-JP/concepts/memory-search)
- [Active Memory](/ja-JP/concepts/active-memory)

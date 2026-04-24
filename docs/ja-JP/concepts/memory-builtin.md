---
read_when:
    - デフォルトのメモリバックエンドを理解したい
    - 埋め込みプロバイダまたはハイブリッド検索を設定したい
summary: キーワード検索、ベクトル検索、ハイブリッド検索を備えた、デフォルトのSQLiteベースのメモリバックエンド
title: 組み込みメモリエンジン
x-i18n:
    generated_at: "2026-04-24T04:53:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: f82c1f4dc37b4fc6c075a7fcd2ec78bfcbfbebbcba7e48d366a1da3afcaff508
    source_path: concepts/memory-builtin.md
    workflow: 15
---

組み込みエンジンは、デフォルトのメモリバックエンドです。メモリインデックスをエージェントごとのSQLiteデータベースに保存し、開始時に追加の依存関係は必要ありません。

## 提供するもの

- **キーワード検索**: FTS5全文インデックス（BM25スコアリング）経由。
- **ベクトル検索**: サポートされている任意のプロバイダからの埋め込み経由。
- **ハイブリッド検索**: 両方を組み合わせて最良の結果を得ます。
- **CJKサポート**: 中国語、日本語、韓国語向けのtrigramトークナイゼーション経由。
- **sqlite-vec高速化**: データベース内ベクトルクエリ向け（任意）。

## はじめに

OpenAI、Gemini、Voyage、またはMistralのAPIキーがある場合、組み込みエンジンはそれを自動検出してベクトル検索を有効にします。設定は不要です。

プロバイダを明示的に設定するには:

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

埋め込みプロバイダがない場合、利用できるのはキーワード検索のみです。

組み込みのローカル埋め込みプロバイダを強制するには、`local.modelPath` をGGUFファイルに向けてください:

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

## サポートされている埋め込みプロバイダ

| プロバイダ | ID | 自動検出 | 注記 |
| -------- | --------- | ------------- | ----------------------------------- |
| OpenAI   | `openai`  | はい           | デフォルト: `text-embedding-3-small` |
| Gemini   | `gemini`  | はい           | マルチモーダル（画像 + 音声）をサポート |
| Voyage   | `voyage`  | はい           | |
| Mistral  | `mistral` | はい           | |
| Ollama   | `ollama`  | いいえ           | ローカル、明示的に設定 |
| Local    | `local`   | はい（最初）   | GGUFモデル、約0.6 GBのダウンロード |

自動検出では、表示順に、APIキーを解決できる最初のプロバイダが選ばれます。上書きするには `memorySearch.provider` を設定してください。

## インデックス作成の仕組み

OpenClawは `MEMORY.md` と `memory/*.md` をチャンク（約400トークン、80トークンのオーバーラップ付き）に分割してインデックス化し、エージェントごとのSQLiteデータベースに保存します。

- **インデックス場所:** `~/.openclaw/memory/<agentId>.sqlite`
- **ファイル監視:** メモリファイルへの変更は、デバウンスされた再インデックス化をトリガーします（1.5秒）。
- **自動再インデックス化:** 埋め込みプロバイダ、モデル、またはチャンク化設定が変わると、インデックス全体が自動的に再構築されます。
- **オンデマンド再インデックス化:** `openclaw memory index --force`

<Info>
`memorySearch.extraPaths` を使えば、ワークスペース外のMarkdownファイルもインデックス化できます。[設定リファレンス](/ja-JP/reference/memory-config#additional-memory-paths)を参照してください。
</Info>

## いつ使うべきか

組み込みエンジンは、ほとんどのユーザーにとって適切な選択です:

- 追加の依存関係なしで、そのまま動作します。
- キーワード検索とベクトル検索の両方を適切に処理します。
- すべての埋め込みプロバイダをサポートします。
- ハイブリッド検索は、両方の検索アプローチの長所を組み合わせます。

再ランキング、クエリ拡張、またはワークスペース外のディレクトリをインデックス化したい場合は、[QMD](/ja-JP/concepts/memory-qmd) への切り替えを検討してください。

自動ユーザーモデリング付きのセッション横断メモリが必要な場合は、[Honcho](/ja-JP/concepts/memory-honcho) を検討してください。

## トラブルシューティング

**メモリ検索が無効ですか？** `openclaw memory status` を確認してください。プロバイダが検出されない場合は、明示的に設定するか、APIキーを追加してください。

**ローカルプロバイダが検出されませんか？** ローカルパスが存在することを確認し、次を実行してください:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

スタンドアロンCLIコマンドとGatewayは、どちらも同じ `local` プロバイダIDを使います。プロバイダが `auto` に設定されている場合、ローカル埋め込みは `memorySearch.local.modelPath` が既存のローカルファイルを指しているときにのみ最優先で考慮されます。

**結果が古いですか？** `openclaw memory index --force` を実行して再構築してください。まれなエッジケースでは、監視が変更を見逃すことがあります。

**sqlite-vecが読み込まれませんか？** OpenClawは自動的にインプロセスのコサイン類似度にフォールバックします。具体的な読み込みエラーはログを確認してください。

## 設定

埋め込みプロバイダのセットアップ、ハイブリッド検索の調整（重み、MMR、時間減衰）、バッチインデックス作成、マルチモーダルメモリ、sqlite-vec、追加パス、その他すべての設定ノブについては、[メモリ設定リファレンス](/ja-JP/reference/memory-config)を参照してください。

## 関連

- [メモリ概要](/ja-JP/concepts/memory)
- [メモリ検索](/ja-JP/concepts/memory-search)
- [Active Memory](/ja-JP/concepts/active-memory)

---
read_when:
    - ツール出力によるコンテキスト増加を抑えたい場合
    - Anthropic のプロンプトキャッシュ最適化を理解したい場合
summary: コンテキストを軽く保ち、キャッシュ効率を高めるために古いツール結果を削除する
title: セッション pruning
x-i18n:
    generated_at: "2026-04-24T04:54:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: af47997b83cd478dac0e2ebb6d277a948713f28651751bec6cff4ef4b70a16c6
    source_path: concepts/session-pruning.md
    workflow: 15
---

セッション pruning は、各 LLM 呼び出しの前にコンテキストから **古いツール結果** を削ります。これにより、通常の会話テキストは書き換えずに、蓄積したツール出力（exec の結果、ファイル読み取り、検索結果）によるコンテキスト膨張を抑えます。

<Info>
pruning はインメモリのみです -- ディスク上のセッショントランスクリプトは変更しません。
完全な履歴は常に保持されます。
</Info>

## なぜ重要か

長いセッションでは、コンテキストウィンドウを膨らませるツール出力が蓄積されます。これにより
コストが増え、必要以上に早く [Compaction](/ja-JP/concepts/compaction) が必要になることがあります。

pruning は特に **Anthropic のプロンプトキャッシュ** に有効です。キャッシュ TTL が
切れると、次のリクエストでプロンプト全体が再キャッシュされます。pruning は
キャッシュ書き込みサイズを減らすため、コストを直接下げます。

## 仕組み

1. キャッシュ TTL が切れるのを待ちます（デフォルト 5 分）。
2. 通常の pruning 用に古いツール結果を見つけます（会話テキストはそのまま）。
3. 大きすぎる結果を **soft-trim** します -- 先頭と末尾を残し、`...` を挿入します。
4. 残りを **hard-clear** します -- プレースホルダーに置き換えます。
5. TTL をリセットし、後続リクエストが新しいキャッシュを再利用できるようにします。

## 旧来画像のクリーンアップ

OpenClaw は、履歴に raw 画像ブロックを保存していた古い旧来セッション向けに、
別の冪等クリーンアップも実行します。

- 直近の **完了済み 3 ターン** はバイト単位でそのまま保持されるため、最近の
  フォローアップに対するプロンプトキャッシュ接頭辞は安定したままです。
- `user` または `toolResult` 履歴内の、すでに処理済みの古い画像ブロックは
  `[image data removed - already processed by model]` に置き換えられることがあります。
- これは通常のキャッシュ TTL pruning とは別です。後続ターンで繰り返し画像ペイロードが
  プロンプトキャッシュを壊すのを防ぐために存在します。

## スマートデフォルト

OpenClaw は Anthropic プロファイルに対して pruning を自動有効化します:

| プロファイル種別                                        | pruning 有効 | Heartbeat |
| ------------------------------------------------------- | ------------ | --------- |
| Anthropic OAuth/token 認証（Claude CLI 再利用を含む）   | Yes          | 1 時間    |
| API キー                                                | Yes          | 30 分     |

明示的な値を設定している場合、OpenClaw はそれを上書きしません。

## 有効化または無効化

Anthropic 以外のプロバイダでは、pruning はデフォルトで無効です。有効にするには:

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

無効にするには `mode: "off"` を設定してください。

## pruning と Compaction の違い

|            | pruning           | Compaction            |
| ---------- | ----------------- | --------------------- |
| **対象**   | ツール結果を削る  | 会話を要約する        |
| **保存**   | されない（リクエストごと） | される（トランスクリプト内） |
| **範囲**   | ツール結果のみ    | 会話全体              |

両者は補完関係にあります -- pruning は Compaction サイクルの間、ツール出力を軽く保ちます。

## 参考情報

- [Compaction](/ja-JP/concepts/compaction) -- 要約ベースのコンテキスト削減
- [Gateway Configuration](/ja-JP/gateway/configuration) -- すべての pruning 設定項目
  (`contextPruning.*`)

## 関連

- [Session management](/ja-JP/concepts/session)
- [Session tools](/ja-JP/concepts/session-tool)
- [Context engine](/ja-JP/concepts/context-engine)

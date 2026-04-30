---
read_when:
    - 主要なオープンソース LLM に単一の API キーを使いたい場合
    - DeepInfra の API 経由で OpenClaw のモデルを実行したい場合
summary: DeepInfra の統合 API を使用して、OpenClaw で最も人気のあるオープンソースモデルとフロンティアモデルにアクセスします
x-i18n:
    generated_at: "2026-04-30T05:29:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22a178e7ac582e094f82f5779a9a963e0bf77b1b19820f74725255b6be0b0593
    source_path: providers/deepinfra.md
    workflow: 16
---

# DeepInfra

DeepInfra は、単一のエンドポイントと API キーの背後で、最も人気のあるオープンソースモデルやフロンティアモデルへリクエストをルーティングする **統合 API** を提供します。OpenAI 互換のため、ほとんどの OpenAI SDK はベース URL を切り替えるだけで動作します。

## API キーの取得

1. [https://deepinfra.com/](https://deepinfra.com/) に移動します
2. サインインするか、アカウントを作成します
3. Dashboard / Keys に移動し、新しい API キーを生成するか、自動作成されたものを使用します

## CLI セットアップ

```bash
openclaw onboard --deepinfra-api-key <key>
```

または、環境変数を設定します。

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## 設定スニペット

```json5
{
  env: { DEEPINFRA_API_KEY: "<your-deepinfra-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V3.2" },
    },
  },
}
```

## サポートされる OpenClaw サーフェス

バンドルされた Plugin は、現在の OpenClaw プロバイダー契約に一致するすべての DeepInfra サーフェスを登録します。

| サーフェス               | デフォルトモデル                   | OpenClaw 設定/ツール                                    |
| ------------------------ | ---------------------------------- | -------------------------------------------------------- |
| チャット / モデルプロバイダー | `deepseek-ai/DeepSeek-V3.2`        | `agents.defaults.model`                                  |
| 画像生成/編集            | `black-forest-labs/FLUX-1-schnell` | `image_generate`, `agents.defaults.imageGenerationModel` |
| メディア理解             | 画像用 `moonshotai/Kimi-K2.5`      | 受信画像理解                                             |
| 音声テキスト変換         | `openai/whisper-large-v3-turbo`    | 受信音声文字起こし                                       |
| テキスト音声変換         | `hexgrad/Kokoro-82M`               | `messages.tts.provider: "deepinfra"`                     |
| 動画生成                 | `Pixverse/Pixverse-T2V`            | `video_generate`, `agents.defaults.videoGenerationModel` |
| メモリ埋め込み           | `BAAI/bge-m3`                      | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra は、リランキング、分類、物体検出、その他のネイティブモデルタイプも公開しています。OpenClaw には現在、これらのカテゴリ向けのファーストクラスのプロバイダー契約がないため、この Plugin はまだそれらを登録していません。

## 利用可能なモデル

OpenClaw は起動時に利用可能な DeepInfra モデルを動的に検出します。利用可能なモデルの完全な一覧を確認するには、`/models deepinfra` を使用します。

[DeepInfra.com](https://deepinfra.com/) で利用可能な任意のモデルは、`deepinfra/` プレフィックス付きで使用できます。

```
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/moonshotai/Kimi-K2.5
deepinfra/zai-org/GLM-5.1
...and many more
```

## 注記

- モデル参照は `deepinfra/<provider>/<model>` です（例: `deepinfra/Qwen/Qwen3-Max`）。
- デフォルトモデル: `deepinfra/deepseek-ai/DeepSeek-V3.2`
- ベース URL: `https://api.deepinfra.com/v1/openai`
- ネイティブ動画生成は `https://api.deepinfra.com/v1/inference/<model>` を使用します。

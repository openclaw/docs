---
read_when:
    - 主要なオープンソース LLM に単一の API キーを使いたい場合
    - OpenClaw で DeepInfra の API 経由でモデルを実行したい
summary: DeepInfra の統合 API を使用して、OpenClaw で最も人気のあるオープンソースモデルとフロンティアモデルにアクセスする
title: DeepInfra
x-i18n:
    generated_at: "2026-06-27T12:41:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 059a556c24d2de2c8c5290b54c78fbc7451dc534238bfc4c725dcfbbd9a2d17f
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra は、単一のエンドポイントと API キーの背後で、最も人気のあるオープンソースモデルとフロンティアモデルにリクエストをルーティングする**統合 API**を提供します。OpenAI 互換のため、ほとんどの OpenAI SDK はベース URL を切り替えるだけで動作します。

## Plugin をインストール

公式 Plugin をインストールしてから、Gateway を再起動します。

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## API キーの取得

1. [https://deepinfra.com/](https://deepinfra.com/) に移動する
2. サインインするか、アカウントを作成する
3. Dashboard / Keys に移動し、新しい API キーを生成するか、自動作成されたものを使用する

## CLI セットアップ

```bash
openclaw onboard --deepinfra-api-key <key>
```

または環境変数を設定します。

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## 設定スニペット

```json5
{
  env: { DEEPINFRA_API_KEY: "<your-deepinfra-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V4-Flash" },
    },
  },
}
```

## サポートされる OpenClaw サーフェス

この Plugin は、現在の OpenClaw プロバイダー契約に一致するすべての DeepInfra サーフェスを登録します。チャット、画像生成、動画生成は、`DEEPINFRA_API_KEY` が設定されている場合、`/v1/openai/models?sort_by=openclaw&filter=with_meta` からモデルカタログをライブで更新します。その他のサーフェスは、以下のキュレーションされた静的デフォルトを使用します。

| サーフェス               | デフォルトモデル                                                                                      | OpenClaw 設定/ツール                                    |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| チャット / モデルプロバイダー | ライブカタログ内の最初のチャットタグ付きエントリ（マニフェストフォールバック `deepseek-ai/DeepSeek-V4-Flash`） | `agents.defaults.model`                                  |
| 画像生成/編集            | ライブカタログ内の最初の `image-gen` タグ付きエントリ（静的フォールバック `black-forest-labs/FLUX-1-schnell`） | `image_generate`, `agents.defaults.imageGenerationModel` |
| メディア理解             | 画像には `moonshotai/Kimi-K2.5`                                                                        | インバウンド画像理解                                     |
| 音声文字起こし           | `openai/whisper-large-v3-turbo`                                                                        | インバウンド音声文字起こし                               |
| テキスト読み上げ         | `hexgrad/Kokoro-82M`                                                                                   | `messages.tts.provider: "deepinfra"`                     |
| 動画生成                 | ライブカタログ内の最初の `video-gen` タグ付きエントリ（静的フォールバック `Pixverse/Pixverse-T2V`）    | `video_generate`, `agents.defaults.videoGenerationModel` |
| メモリ埋め込み           | `BAAI/bge-m3`                                                                                          | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra は、リランキング、分類、物体検出、その他のネイティブモデルタイプも公開しています。OpenClaw には現在、これらのカテゴリ向けのファーストクラスのプロバイダー契約がないため、この Plugin はまだそれらを登録していません。

## 利用可能なモデル

OpenClaw は起動時に利用可能な DeepInfra モデルを動的に検出します。利用可能なモデルの完全な一覧を確認するには、`/models deepinfra` を使用します。

[DeepInfra.com](https://deepinfra.com/) で利用可能な任意のモデルは、`deepinfra/` プレフィックス付きで使用できます。

```
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...ほか多数
```

## メモ

- モデル参照は `deepinfra/<provider>/<model>` です（例: `deepinfra/Qwen/Qwen3-Max`）。
- デフォルトモデル: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- ベース URL: `https://api.deepinfra.com/v1/openai`
- ネイティブ動画生成は `https://api.deepinfra.com/v1/inference/<model>` を使用します。

## 関連

- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [すべてのプロバイダー](/ja-JP/providers/index)

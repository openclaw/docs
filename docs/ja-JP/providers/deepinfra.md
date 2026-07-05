---
read_when:
    - 主要なオープンソース LLM 用に単一の API キーが必要な場合
    - OpenClaw で DeepInfra の API 経由でモデルを実行したい
summary: OpenClaw で DeepInfra の統合 API を使用して、最も人気のあるオープンソースモデルとフロンティアモデルにアクセスする
title: DeepInfra
x-i18n:
    generated_at: "2026-07-05T11:39:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f68bac84311d20348007c715803a34451ba8ab0c09beba63366ba5b1b29de05
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra は、単一の OpenAI 互換エンドポイントと API キーの背後で、人気のオープンソースモデルやフロンティアモデルへリクエストをルーティングします。ほとんどの OpenAI SDK は、ベース URL を切り替えることで利用できます。

## Plugin をインストール

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## API キーを取得

1. [deepinfra.com](https://deepinfra.com/) にサインインする
2. Dashboard / Keys に移動してキーを生成するか、自動作成されたキーを使用する

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
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V4-Flash" },
    },
  },
}
```

## サポートされるサーフェス

チャット、画像生成、動画生成は、`DEEPINFRA_API_KEY` が設定されると、`https://api.deepinfra.com/v1/openai/models?sort_by=openclaw&filter=with_meta` からモデルカタログをライブで更新します。その他のサーフェスは、同じライブカタログへ移行するまで、以下の静的なデフォルトを使用します。

| サーフェス                  | デフォルトモデル                                                                                         | OpenClaw 設定/ツール                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| チャット / モデルプロバイダー    | ライブカタログ内の最初のチャットタグ付きエントリ（静的フォールバック `deepseek-ai/DeepSeek-V4-Flash`）           | `agents.defaults.model`                                  |
| 画像生成/編集 | ライブカタログ内の最初の `image-gen` タグ付きエントリ（静的フォールバック `black-forest-labs/FLUX-1-schnell`） | `image_generate`, `agents.defaults.imageGenerationModel` |
| メディア理解      | 画像用の `moonshotai/Kimi-K2.5`                                                                     | 受信画像の理解                              |
| 音声テキスト変換           | `openai/whisper-large-v3-turbo`                                                                       | 受信音声の文字起こし                              |
| テキスト音声変換           | `hexgrad/Kokoro-82M`                                                                                  | `messages.tts.provider: "deepinfra"`                     |
| 動画生成         | 静的フォールバック `Pixverse/Pixverse-T2V`（現在 DeepInfra にはライブの video-gen 行はありません）                 | `video_generate`, `agents.defaults.videoGenerationModel` |
| メモリ埋め込み        | `BAAI/bge-m3`                                                                                         | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra は、リランキング、分類、オブジェクト検出、その他のネイティブモデル種別も公開しています。OpenClaw にはまだそれらのカテゴリ向けのプロバイダー契約がないため、この Plugin は登録しません。

## 利用可能なモデル

キーが設定されると、OpenClaw は DeepInfra モデルを動的に検出します。現在の一覧を確認するには、`/models deepinfra` または `openclaw models list --provider deepinfra` を使用します。

[deepinfra.com](https://deepinfra.com/) 上の任意のモデルは、`deepinfra/` プレフィックスで利用できます。

```text
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...and many more
```

## メモ

- モデル参照は `deepinfra/<provider>/<model>` です（例: `deepinfra/Qwen/Qwen3-Max`）。
- デフォルトのチャットモデル: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- ベース URL: `https://api.deepinfra.com/v1/openai`
- ネイティブ動画生成は `https://api.deepinfra.com/v1/inference/<model>` を使用します。

## 関連

- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [すべてのプロバイダー](/ja-JP/providers/index)

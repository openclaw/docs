---
read_when:
    - 主要なオープンソースLLMに単一のAPIキーを使用したい場合
    - OpenClaw で DeepInfra の API を介してモデルを実行したい場合
summary: DeepInfra の統合 API を使用して、OpenClaw から最も人気のあるオープンソースモデルと最先端モデルにアクセスする
title: DeepInfra
x-i18n:
    generated_at: "2026-07-11T22:36:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f68bac84311d20348007c715803a34451ba8ab0c09beba63366ba5b1b29de05
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra は、一般的なオープンソースモデルやフロンティアモデルへのリクエストを、単一の OpenAI 互換エンドポイントと API キーを通じてルーティングします。ほとんどの OpenAI SDK は、ベース URL を切り替えるだけで利用できます。

## Plugin のインストール

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## API キーの取得

1. [deepinfra.com](https://deepinfra.com/) にサインインする
2. Dashboard / Keys に移動してキーを生成するか、自動作成されたキーを使用する

## CLI のセットアップ

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

## サポートされる機能

チャット、画像生成、動画生成では、`DEEPINFRA_API_KEY` が設定されると、`https://api.deepinfra.com/v1/openai/models?sort_by=openclaw&filter=with_meta` からモデルカタログをリアルタイムで更新します。その他の機能では、同じライブカタログへ移行するまで、以下の静的なデフォルトを使用します。

| 機能                     | デフォルトモデル                                                                                              | OpenClaw の設定/ツール                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| チャット / モデルプロバイダー | ライブカタログで最初のチャットタグ付きエントリ（静的フォールバックは `deepseek-ai/DeepSeek-V4-Flash`）             | `agents.defaults.model`                                  |
| 画像生成/編集            | ライブカタログで最初の `image-gen` タグ付きエントリ（静的フォールバックは `black-forest-labs/FLUX-1-schnell`） | `image_generate`, `agents.defaults.imageGenerationModel` |
| メディア理解             | 画像には `moonshotai/Kimi-K2.5`                                                                                | 受信画像の理解                                           |
| 音声テキスト変換         | `openai/whisper-large-v3-turbo`                                                                                | 受信音声の文字起こし                                     |
| テキスト音声変換         | `hexgrad/Kokoro-82M`                                                                                           | `messages.tts.provider: "deepinfra"`                     |
| 動画生成                 | 静的フォールバックは `Pixverse/Pixverse-T2V`（現在、DeepInfra にライブの video-gen 行はありません）            | `video_generate`, `agents.defaults.videoGenerationModel` |
| メモリ埋め込み           | `BAAI/bge-m3`                                                                                                  | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra は、再ランキング、分類、物体検出などのネイティブモデルタイプも公開しています。OpenClaw にはこれらのカテゴリに対応するプロバイダー契約がまだないため、この Plugin では登録されません。

## 利用可能なモデル

キーが設定されると、OpenClaw は DeepInfra のモデルを動的に検出します。現在の一覧を確認するには、`/models deepinfra` または `openclaw models list --provider deepinfra` を使用します。

[deepinfra.com](https://deepinfra.com/) 上のすべてのモデルを、`deepinfra/` プレフィックス付きで使用できます。

```text
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...その他多数
```

## 注意事項

- モデル参照は `deepinfra/<provider>/<model>` 形式です（例: `deepinfra/Qwen/Qwen3-Max`）。
- デフォルトのチャットモデル: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- ベース URL: `https://api.deepinfra.com/v1/openai`
- ネイティブ動画生成では `https://api.deepinfra.com/v1/inference/<model>` を使用します。

## 関連項目

- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [すべてのプロバイダー](/ja-JP/providers/index)

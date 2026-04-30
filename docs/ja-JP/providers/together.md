---
read_when:
    - OpenClaw で Together AI を使用したい
    - API キーの環境変数または CLI 認証の選択が必要です
summary: Together AI セットアップ（認証 + モデル選択）
title: Together AI
x-i18n:
    generated_at: "2026-04-30T05:32:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7713c0b1e64014bbdd87a120de0a950b583afd1481338f2c6cccfb2b7da76e7
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) は、統一 API を通じて Llama、DeepSeek、Kimi などの主要なオープンソース
モデルへのアクセスを提供します。

| プロパティ | 値                            |
| ---------- | ----------------------------- |
| プロバイダー | `together`                    |
| 認証       | `TOGETHER_API_KEY`            |
| API        | OpenAI 互換                   |
| ベース URL | `https://api.together.xyz/v1` |

## はじめに

<Steps>
  <Step title="API キーを取得する">
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys)
    で API キーを作成します。
  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="デフォルトモデルを設定する">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "together/moonshotai/Kimi-K2.5" },
        },
      },
    }
    ```
  </Step>
</Steps>

### 非対話型の例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
オンボーディングのプリセットは `together/moonshotai/Kimi-K2.5` をデフォルト
モデルとして設定します。
</Note>

## 組み込みカタログ

OpenClaw には、このバンドル済み Together カタログが含まれています。

| モデル参照                                                   | 名前                                   | 入力         | コンテキスト | 注記                             |
| ------------------------------------------------------------ | -------------------------------------- | ------------ | ------------ | -------------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                              | テキスト, 画像 | 262,144      | デフォルトモデル; 推論有効       |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                            | テキスト     | 202,752      | 汎用テキストモデル               |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo           | テキスト     | 131,072      | 高速な指示モデル                 |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct         | テキスト, 画像 | 10,000,000   | マルチモーダル                   |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | テキスト, 画像 | 20,000,000   | マルチモーダル                   |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                          | テキスト     | 131,072      | 汎用テキストモデル               |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                            | テキスト     | 131,072      | 推論モデル                       |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                  | テキスト     | 262,144      | セカンダリ Kimi テキストモデル   |

## 動画生成

バンドル済みの `together` plugin は、共有 `video_generate` ツールを通じた
動画生成も登録します。

| プロパティ           | 値                                    |
| -------------------- | ------------------------------------- |
| デフォルト動画モデル | `together/Wan-AI/Wan2.2-T2V-A14B`     |
| モード               | テキストから動画, 単一画像リファレンス |
| サポートされるパラメーター | `aspectRatio`, `resolution`           |

Together をデフォルトの動画プロバイダーとして使用するには:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "together/Wan-AI/Wan2.2-T2V-A14B",
      },
    },
  },
}
```

<Tip>
共有ツールのパラメーター、プロバイダー選択、フェイルオーバー動作については
[動画生成](/ja-JP/tools/video-generation) を参照してください。
</Tip>

<AccordionGroup>
  <Accordion title="環境に関する注記">
    Gateway がデーモン (launchd/systemd) として実行される場合は、
    `TOGETHER_API_KEY` がそのプロセスで利用可能であることを確認してください
    (たとえば、`~/.openclaw/.env` または `env.shellEnv` 経由)。

    <Warning>
    対話型シェルにのみ設定されたキーは、デーモン管理の Gateway プロセスには
    表示されません。永続的に利用できるようにするには、`~/.openclaw/.env`
    または `env.shellEnv` 設定を使用してください。
    </Warning>

  </Accordion>

  <Accordion title="トラブルシューティング">
    - キーが機能することを確認します: `openclaw models list --provider together`
    - モデルが表示されない場合は、Gateway プロセスの正しい環境に API キーが設定されていることを確認してください。
    - モデル参照は `together/<model-id>` 形式を使用します。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダールール、モデル参照、フェイルオーバー動作。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画生成ツールのパラメーターとプロバイダー選択。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダー設定を含む完全な設定スキーマ。
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Together AI ダッシュボード、API ドキュメント、料金。
  </Card>
</CardGroup>

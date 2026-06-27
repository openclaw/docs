---
read_when:
    - OpenClaw で Together AI を使いたい場合
    - API キーの環境変数または CLI 認証の選択が必要です
summary: Together AI セットアップ（認証 + モデル選択）
title: Together AI
x-i18n:
    generated_at: "2026-06-27T12:51:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f803ae88828a775d93dcf8b0b62e70b1dbd0cf963639121e2995fabfcd280b
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) は、統一 API を通じて Llama、DeepSeek、Kimi などの主要なオープンソースモデルへのアクセスを提供します。

| プロパティ | 値                            |
| -------- | ----------------------------- |
| プロバイダー | `together`                    |
| 認証     | `TOGETHER_API_KEY`            |
| API      | OpenAI 互換                   |
| ベース URL | `https://api.together.xyz/v1` |

## はじめに

<Steps>
  <Step title="API キーを取得する">
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys) で
    API キーを作成します。
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
          model: {
            primary: "together/meta-llama/Llama-3.3-70B-Instruct-Turbo",
          },
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
オンボーディングプリセットは
`together/meta-llama/Llama-3.3-70B-Instruct-Turbo` をデフォルトモデルとして設定します。
</Note>

## 組み込みカタログ

OpenClaw には、このバンドル済み Together カタログが含まれています。

| モデル参照                                          | 名前                         | 入力       | コンテキスト | メモ                 |
| -------------------------------------------------- | ---------------------------- | ----------- | ------- | -------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | テキスト        | 131,072 | デフォルトモデル        |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | テキスト、画像 | 262,144 | Kimi 推論モデル |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | テキスト        | 512,000 | 推論テキストモデル |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | テキスト        | 32,768  | 高速テキストモデル      |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | テキスト        | 202,752 | 推論テキストモデル |

## 動画生成

バンドル済みの `together` Plugin は、共有 `video_generate` ツールを通じた動画生成も登録します。

| プロパティ             | 値                                                                    |
| -------------------- | ------------------------------------------------------------------------ |
| デフォルト動画モデル  | `together/Wan-AI/Wan2.2-T2V-A14B`                                        |
| モード                | テキストから動画へ。`Wan-AI/Wan2.2-I2V-A14B` では単一画像参照のみ |
| サポートされるパラメーター | `aspectRatio`, `resolution`                                              |

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
共有ツールのパラメーター、プロバイダー選択、フェイルオーバー動作については、[動画生成](/ja-JP/tools/video-generation)を参照してください。
</Tip>

<AccordionGroup>
  <Accordion title="環境に関するメモ">
    Gateway がデーモン (launchd/systemd) として実行される場合は、
    `TOGETHER_API_KEY` がそのプロセスで利用可能であることを確認してください (たとえば、
    `~/.openclaw/.env` または `env.shellEnv` 経由)。

    <Warning>
    対話型シェルでのみ設定されたキーは、デーモン管理の
    Gateway プロセスからは見えません。永続的に利用できるようにするには、
    `~/.openclaw/.env` または `env.shellEnv` 設定を使用してください。
    </Warning>

  </Accordion>

  <Accordion title="トラブルシューティング">
    - キーが動作することを確認する: `openclaw models list --provider together`
    - モデルが表示されない場合は、Gateway プロセスの正しい環境に API キーが設定されていることを確認してください。
    - モデル参照は `together/<model-id>` の形式を使用します。

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

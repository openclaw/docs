---
read_when:
    - OpenClaw で Together AI を使用したい場合
    - API キーの環境変数または CLI 認証オプションが必要です
summary: Together AI のセットアップ（認証 + モデル選択）
title: Together AI
x-i18n:
    generated_at: "2026-07-11T22:37:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0860ac6e8092bb4eb48d3c0d348d5c42f538e0316d2fa22a99cbb3a9851b1185
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) は、統一された API を通じて、Llama、DeepSeek、Kimi などの主要なオープンソースモデルへのアクセスを提供します。
OpenClaw には `together` プロバイダーとして同梱されています。

| プロパティ | 値                            |
| ---------- | ----------------------------- |
| プロバイダー | `together`                    |
| 認証       | `TOGETHER_API_KEY`            |
| API        | OpenAI 互換                   |
| ベース URL | `https://api.together.xyz/v1` |

## はじめに

<Steps>
  <Step title="API キーを取得する">
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys) で API キーを作成します。
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
オンボーディングでは、`together/meta-llama/Llama-3.3-70B-Instruct-Turbo` がデフォルトモデルとして設定されます。
</Note>

## 組み込みカタログ

料金は 100 万トークンあたりの米ドル額です。

| モデル参照                                         | 名前                         | 入力           | コンテキスト | 最大出力 | 料金（入力／出力） | 備考                     |
| -------------------------------------------------- | ---------------------------- | -------------- | ------------ | -------- | ------------------ | ------------------------ |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | テキスト       | 131,072      | 8,192    | 0.88 / 0.88        | デフォルトモデル         |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | テキスト、画像 | 262,144      | 32,768   | 1.20 / 4.50        | 推論モデル               |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | テキスト       | 512,000      | 8,192    | 2.10 / 4.40        | 推論モデル               |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | テキスト       | 32,768       | 8,192    | 0.30 / 0.30        | 高速、非推論モデル       |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | テキスト       | 202,752      | 8,192    | 1.40 / 4.40        | 推論モデル               |

## 動画生成

同梱の `together` Plugin は、共有の `video_generate` ツールを通じた動画生成も登録します。

| プロパティ             | 値                                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| デフォルト動画モデル   | `Wan-AI/Wan2.2-T2V-A14B`                                                                  |
| その他のモデル         | `Wan-AI/Wan2.2-I2V-A14B`、`minimax/Hailuo-02`、`Kwai/Kling-2.1-Master`                    |
| モード                 | テキストから動画。画像から動画は `Wan-AI/Wan2.2-I2V-A14B` のみ（参照画像 1 枚）          |
| 長さ                   | 1～10 秒                                                                                  |
| 対応パラメーター       | `size`（`<width>x<height>` として解析）。`aspectRatio`/`resolution` は読み取られません    |

Together をデフォルトの動画プロバイダーとして使用するには、次のように設定します。

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
共有ツールのパラメーター、プロバイダーの選択、フェイルオーバー動作については、[動画生成](/ja-JP/tools/video-generation)を参照してください。
</Tip>

<AccordionGroup>
  <Accordion title="環境に関する注意事項">
    Gateway をデーモン（launchd/systemd）として実行する場合は、そのプロセスから `TOGETHER_API_KEY` を利用できることを確認してください（たとえば `~/.openclaw/.env` または `env.shellEnv` を使用します）。

    <Warning>
    対話型シェルでのみ設定されたキーは、デーモン管理の Gateway プロセスからは参照できません。永続的に利用できるようにするには、`~/.openclaw/.env` または `env.shellEnv` 設定を使用してください。
    </Warning>

  </Accordion>

  <Accordion title="トラブルシューティング">
    - キーが機能することを確認します：`openclaw models list --provider together`
    - モデルが表示されない場合は、Gateway プロセスの正しい環境に API キーが設定されていることを確認してください。
    - モデル参照には `together/<model-id>` 形式を使用します。

  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダーのルール、モデル参照、フェイルオーバー動作。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画生成ツールのパラメーターとプロバイダーの選択。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダー設定を含む完全な設定スキーマ。
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Together AI のダッシュボード、API ドキュメント、料金。
  </Card>
</CardGroup>

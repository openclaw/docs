---
read_when:
    - OpenClaw で Together AI を使用する
    - APIキー環境変数またはCLI認証の選択が必要です
summary: Together AI のセットアップ（認証 + モデル選択）
title: Together AI
x-i18n:
    generated_at: "2026-07-05T11:46:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0860ac6e8092bb4eb48d3c0d348d5c42f538e0316d2fa22a99cbb3a9851b1185
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) は、統一 API を通じて Llama、DeepSeek、Kimi などの主要なオープンソースモデルへのアクセスを提供します。
OpenClaw はこれを `together` プロバイダーとしてバンドルしています。

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
オンボーディングでは `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` がデフォルトモデルとして設定されます。
</Note>

## 組み込みカタログ

コストは 100 万トークンあたりの USD です。

| モデル参照                                         | 名前                         | 入力           | コンテキスト | 最大出力 | コスト (入力/出力) | 注記               |
| -------------------------------------------------- | ---------------------------- | -------------- | ------------ | -------- | ------------------ | ------------------ |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | テキスト       | 131,072      | 8,192    | 0.88 / 0.88        | デフォルトモデル   |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | テキスト、画像 | 262,144      | 32,768   | 1.20 / 4.50        | 推論モデル         |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | テキスト       | 512,000      | 8,192    | 2.10 / 4.40        | 推論モデル         |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | テキスト       | 32,768       | 8,192    | 0.30 / 0.30        | 高速、非推論       |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | テキスト       | 202,752      | 8,192    | 1.40 / 4.40        | 推論モデル         |

## 動画生成

バンドルされた `together` Plugin は、共有の `video_generate` ツールを通じて動画生成も登録します。

| プロパティ           | 値                                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| デフォルト動画モデル | `Wan-AI/Wan2.2-T2V-A14B`                                                                           |
| その他のモデル       | `Wan-AI/Wan2.2-I2V-A14B`, `minimax/Hailuo-02`, `Kwai/Kling-2.1-Master`                             |
| モード               | テキストから動画へ。`Wan-AI/Wan2.2-I2V-A14B` でのみ画像から動画へ対応 (単一の参照画像)             |
| 長さ                 | 1-10 秒                                                                                            |
| 対応パラメーター     | `size` (`<width>x<height>` として解析)。`aspectRatio`/`resolution` は読み取られません              |

Together をデフォルトの動画プロバイダーとして使うには:

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
共有ツールのパラメーター、プロバイダー選択、フェイルオーバー動作については、[動画生成](/ja-JP/tools/video-generation) を参照してください。
</Tip>

<AccordionGroup>
  <Accordion title="環境に関するメモ">
    Gateway がデーモン (launchd/systemd) として実行される場合は、
    `TOGETHER_API_KEY` がそのプロセスで利用可能であることを確認してください (たとえば、
    `~/.openclaw/.env` 内、または `env.shellEnv` 経由)。

    <Warning>
    対話型シェルでのみ設定されたキーは、デーモン管理の Gateway プロセスからは見えません。
    永続的に利用できるようにするには、`~/.openclaw/.env` または `env.shellEnv` 設定を使用してください。
    </Warning>

  </Accordion>

  <Accordion title="トラブルシューティング">
    - キーが機能することを確認します: `openclaw models list --provider together`
    - モデルが表示されない場合は、Gateway プロセスに対して正しい環境で API キーが設定されていることを確認してください。
    - モデル参照は `together/<model-id>` 形式を使用します。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダールール、モデル参照、フェイルオーバー動作。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画生成ツールのパラメーターとプロバイダー選択。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダー設定を含む完全な設定スキーマ。
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Together AI ダッシュボード、API ドキュメント、価格。
  </Card>
</CardGroup>

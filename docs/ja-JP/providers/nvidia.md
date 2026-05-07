---
read_when:
    - OpenClawでオープンモデルを無料で使いたい
    - NVIDIA_API_KEY の設定が必要です
summary: OpenClaw で NVIDIA の OpenAI 互換 API を使用する
title: NVIDIA
x-i18n:
    generated_at: "2026-05-07T13:25:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8846c51b056e05f8552b3804d4dac73ff34aa874ec3d5d6fb13fad5a4112bc7f
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA は、オープンモデルを無料で利用できる OpenAI 互換 API を `https://integrate.api.nvidia.com/v1` で提供しています。[build.nvidia.com](https://build.nvidia.com/settings/api-keys) の API キーで認証します。

## はじめに

<Steps>
  <Step title="API キーを取得する">
    [build.nvidia.com](https://build.nvidia.com/settings/api-keys) で API キーを作成します。
  </Step>
  <Step title="キーをエクスポートしてオンボーディングを実行する">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="NVIDIA モデルを設定する">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
env var の代わりに `--nvidia-api-key` を渡すと、値がシェル履歴や `ps` の出力に残ります。可能な場合は `NVIDIA_API_KEY` 環境変数を優先してください。
</Warning>

非対話型セットアップでは、キーを直接渡すこともできます。

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

## 設定例

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## 組み込みカタログ

| モデル参照                                 | 名前                         | コンテキスト | 最大出力   |
| ------------------------------------------ | ---------------------------- | ------- | ---------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192      |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192      |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192      |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192      |

## 高度な設定

<AccordionGroup>
  <Accordion title="自動有効化の動作">
    `NVIDIA_API_KEY` 環境変数が設定されている場合、プロバイダーは自動的に有効になります。
    キー以外に明示的なプロバイダー設定は不要です。
  </Accordion>

  <Accordion title="カタログと料金">
    同梱カタログは静的です。NVIDIA は現在、掲載モデルの API アクセスを無料で提供しているため、ソース内のコストはデフォルトで `0` です。
  </Accordion>

  <Accordion title="OpenAI 互換エンドポイント">
    NVIDIA は標準の `/v1` completions エンドポイントを使用します。OpenAI 互換のツールは、NVIDIA のベース URL でそのまま動作するはずです。
  </Accordion>

  <Accordion title="カスタムプロバイダーの応答が遅い場合">
    NVIDIA がホストする一部のカスタムモデルは、最初の応答チャンクを送出するまでに、デフォルトのモデルアイドル監視時間より長くかかる場合があります。カスタム NVIDIA プロバイダーエントリでは、エージェント全体のランタイムタイムアウトを引き上げるのではなく、プロバイダーのタイムアウトを引き上げてください。

    ```json5
    {
      models: {
        providers: {
          "custom-integrate-api-nvidia-com": {
            baseUrl: "https://integrate.api.nvidia.com/v1",
            api: "openai-completions",
            apiKey: "NVIDIA_API_KEY",
            timeoutSeconds: 300,
          },
        },
      },
      agents: {
        defaults: {
          models: {
            "custom-integrate-api-nvidia-com/meta/llama-3.1-70b-instruct": {
              params: { thinking: "off" },
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

<Tip>
NVIDIA モデルは現在無料で利用できます。最新の提供状況とレート制限の詳細は [build.nvidia.com](https://build.nvidia.com/) を確認してください。
</Tip>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    エージェント、モデル、プロバイダーの完全な設定リファレンス。
  </Card>
</CardGroup>

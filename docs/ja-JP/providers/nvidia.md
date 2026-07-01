---
read_when:
    - OpenClaw でオープンモデルを無料で使いたい
    - NVIDIA_API_KEY の設定が必要です
    - NVIDIA 経由で Nemotron 3 Ultra を使いたい
summary: OpenClaw で NVIDIA の OpenAI 互換 API を使用する
title: NVIDIA
x-i18n:
    generated_at: "2026-07-01T20:12:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b738746acead8dcaa74a39b13b4413171c5bf60efa5166dbc9b259d883a4e22
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA は、無料のオープンモデル向けに `https://integrate.api.nvidia.com/v1` で OpenAI 互換 API を提供しています。
[build.nvidia.com](https://build.nvidia.com/settings/api-keys) から取得した API キーで認証します。OpenClaw は NVIDIA プロバイダーのデフォルトを Nemotron 3 Ultra に設定します。これは、長いコンテキストのエージェント的な作業向けの、NVIDIA の総計 550B / アクティブ 55B の推論モデルです。

## はじめに

<Steps>
  <Step title="Get your API key">
    [build.nvidia.com](https://build.nvidia.com/settings/api-keys) で API キーを作成します。
  </Step>
  <Step title="Export the key and run onboarding">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Set an NVIDIA model">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

<Warning>
env var の代わりに `--nvidia-api-key` を渡すと、その値はシェル履歴と `ps` 出力に残ります。可能な場合は `NVIDIA_API_KEY` 環境変数を優先してください。
</Warning>

非対話セットアップでは、キーを直接渡すこともできます。

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
      model: { primary: "nvidia/nvidia/nemotron-3-ultra-550b-a55b" },
    },
  },
}
```

## 注目カタログ

NVIDIA API キーが設定されている場合、OpenClaw のセットアップとモデル選択パスは `https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` から NVIDIA の公開注目モデルカタログを試し、順位付けされた結果を 24 時間キャッシュします。そのため、build.nvidia.com の新しい注目モデルは OpenClaw リリースを待たずに、セットアップとモデル選択画面に表示されます。ライブフィードを利用できる場合、最初に返されたモデルが NVIDIA セットアップ中に表示されるデフォルトオプションになります。

この取得には、`assets.ngc.nvidia.com` に対する固定 HTTPS ホストポリシーを使用します。NVIDIA API キーが設定されていない場合、またはその公開カタログが利用できないか不正な形式の場合、OpenClaw は以下のバンドル済みカタログとバンドル済みデフォルトにフォールバックします。

## Nemotron 3 Ultra

Nemotron 3 Ultra は OpenClaw のデフォルト NVIDIA モデルです。
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b) の NVIDIA build ページでは、1M トークンのコンテキスト仕様を持つ利用可能な無料エンドポイントとして記載されています。
バンドル済みカタログは、ホストされたエンドポイント向けの NVIDIA の現在の OpenAI 互換サンプルリクエストに合わせて、最大出力を 16,384 トークンとして記録しています。

最高性能の NVIDIA デフォルトには Ultra を使用します。より小さい Nemotron 3 オプションが必要な場合は Super を選択したままにするか、コンテキスト、レイテンシ、または動作がより適している場合は NVIDIA のカタログでホストされているサードパーティモデルのいずれかを選択してください。バンドル済みの Ultra 行は、通常のチャット出力が推論テキストを公開せずに表示される回答内に残るよう、デフォルトで `chat_template_kwargs.enable_thinking: false` と `force_nonempty_content: true` を送信します。

## バンドル済みフォールバックカタログ

| モデル参照                                  | 名前                         | コンテキスト   | 最大出力 | 注記                             |
| ------------------------------------------ | ---------------------------- | --------- | ---------- | --------------------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384     | デフォルト                           |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 1,048,576 | 8,192      | 注目フォールバック                 |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192      | 注目フォールバック                 |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192      | 注目フォールバック                 |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192      | 注目フォールバック                 |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192      | 非推奨、アップグレード互換性 |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192      | 非推奨、アップグレード互換性 |

## 高度な設定

<AccordionGroup>
  <Accordion title="Auto-enable behavior">
    `NVIDIA_API_KEY` 環境変数が設定されている場合、プロバイダーは自動的に有効になります。
    キー以外に明示的なプロバイダー設定は不要です。
  </Accordion>

  <Accordion title="Catalog and pricing">
    NVIDIA 認証が設定されている場合、OpenClaw は NVIDIA の公開注目モデルカタログを優先し、24 時間キャッシュします。バンドル済みフォールバックカタログは静的で、アップグレード互換性のために非推奨の出荷済み参照を保持します。NVIDIA は現在、記載されたモデルに無料の API アクセスを提供しているため、ソース内のコストはデフォルトで `0` です。
  </Accordion>

  <Accordion title="OpenAI-compatible endpoint">
    NVIDIA は標準の `/v1` completions エンドポイントを使用します。OpenAI 互換のツールは、NVIDIA base URL でそのまま動作するはずです。
  </Accordion>

  <Accordion title="Nemotron 3 Ultra reasoning params">
    NVIDIA の Ultra サンプルリクエストは、推論出力に `chat_template_kwargs.enable_thinking` と `reasoning_budget` を使用します。OpenClaw のバンドル済み Ultra 行は、通常のチャット用途ではデフォルトでテンプレート思考を無効にします。NVIDIA の推論出力を有効にする必要がある場合、または他の NVIDIA 固有のリクエストフィールドを強制する必要がある場合は、モデルごとの params を設定し、プロバイダー固有のオーバーライドを NVIDIA モデルに限定してください。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "nvidia/nvidia/nemotron-3-ultra-550b-a55b": {
              params: {
                chat_template_kwargs: { enable_thinking: true },
                extra_body: { reasoning_budget: 16384 },
              },
            },
          },
        },
      },
    }
    ```

    `params.extra_body` は最終的な OpenAI 互換リクエスト本文のオーバーライドであるため、選択したエンドポイントについて NVIDIA が文書化しているフィールドにのみ使用してください。

  </Accordion>

  <Accordion title="Slow custom provider responses">
    NVIDIA でホストされる一部のカスタムモデルは、最初のレスポンスチャンクを出力するまでに、デフォルトのモデルアイドル監視時間より長くかかる場合があります。カスタム NVIDIA プロバイダーエントリでは、エージェントランタイム全体のタイムアウトを上げるのではなく、プロバイダーのタイムアウトを上げてください。

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
NVIDIA モデルは現在無料で使用できます。最新の提供状況とレート制限の詳細については、[build.nvidia.com](https://build.nvidia.com/) を確認してください。
</Tip>

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/configuration-reference" icon="gear">
    エージェント、モデル、プロバイダーの完全な設定リファレンス。
  </Card>
</CardGroup>

---
read_when:
    - OpenClawでオープンモデルを無料で使いたい
    - NVIDIA_API_KEY の設定が必要です
    - NVIDIA 経由で Nemotron 3 Ultra を使いたい
summary: OpenClaw で NVIDIA の OpenAI 互換 API を使用する
title: NVIDIA
x-i18n:
    generated_at: "2026-06-27T12:46:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e94b1d1ab19c6ddb6b26678d5342d55a2b9e9499f4058adbd462b15b9d9e7dd
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA は、オープンモデルを無料で利用できる OpenAI 互換 API を `https://integrate.api.nvidia.com/v1` で提供しています。[build.nvidia.com](https://build.nvidia.com/settings/api-keys) の API キーで認証します。OpenClaw は、NVIDIA プロバイダーの既定を Nemotron 3 Ultra にしています。これは、長いコンテキストのエージェント型作業向けの NVIDIA の 550B 総パラメーター / 55B アクティブ推論モデルです。

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
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

<Warning>
環境変数の代わりに `--nvidia-api-key` を渡すと、その値はシェル履歴と
`ps` 出力に残ります。可能な場合は `NVIDIA_API_KEY` 環境変数を使用してください。
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
      model: { primary: "nvidia/nvidia/nemotron-3-ultra-550b-a55b" },
    },
  },
}
```

## 注目カタログ

NVIDIA API キーが設定されている場合、OpenClaw のセットアップとモデル選択パスは
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` から
NVIDIA の公開注目モデルカタログを試行し、ランク付けされた結果を 24 時間キャッシュします。そのため、build.nvidia.com の新しい注目モデルは、OpenClaw のリリースを待たずにセットアップとモデル選択の画面に表示されます。ライブフィードが利用可能な場合、最初に返されたモデルが NVIDIA セットアップ中に表示される既定のオプションになります。

この取得では、`assets.ngc.nvidia.com` に対して固定の HTTPS ホストポリシーを使用します。NVIDIA API キーが設定されていない場合、またはその公開カタログが利用できないか不正な形式の場合、OpenClaw は以下の同梱カタログと同梱の既定値にフォールバックします。

## Nemotron 3 Ultra

Nemotron 3 Ultra は OpenClaw の既定の NVIDIA モデルです。
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b) の NVIDIA ビルドページでは、1M トークンのコンテキスト仕様を持つ利用可能な無料エンドポイントとして掲載されています。同梱カタログでは、ホストされたエンドポイント向けの NVIDIA の現在の OpenAI 互換サンプルリクエストに合わせて、最大出力を 16,384 トークンとして記録しています。

最高性能の NVIDIA 既定値が必要な場合は Ultra を使用します。より小さい Nemotron 3 オプションが必要な場合は Super を選択したままにするか、コンテキスト、レイテンシ、または挙動がより適している場合は NVIDIA のカタログでホストされているサードパーティーモデルのいずれかを選択します。同梱の Ultra 行は、通常のチャット出力が推論テキストを露出する代わりに表示される回答に残るよう、既定で `chat_template_kwargs.enable_thinking: false` と `force_nonempty_content: true` を送信します。

## 同梱フォールバックカタログ

| モデル参照                                  | 名前                         | コンテキスト   | 最大出力 | 注記                             |
| ------------------------------------------ | ---------------------------- | --------- | ---------- | --------------------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384     | 既定                           |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144   | 8,192      | 注目モデルのフォールバック                 |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192      | 注目モデルのフォールバック                 |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192      | 注目モデルのフォールバック                 |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192      | 注目モデルのフォールバック                 |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192      | 非推奨、アップグレード互換性 |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192      | 非推奨、アップグレード互換性 |

## 高度な設定

<AccordionGroup>
  <Accordion title="自動有効化の挙動">
    `NVIDIA_API_KEY` 環境変数が設定されている場合、プロバイダーは自動的に有効になります。
    キー以外に明示的なプロバイダー設定は必要ありません。
  </Accordion>

  <Accordion title="カタログと料金">
    NVIDIA 認証が設定されている場合、OpenClaw は NVIDIA の公開注目モデルカタログを優先し、
    24 時間キャッシュします。同梱フォールバックカタログは静的で、
    アップグレード互換性のために非推奨の出荷済み参照を保持します。NVIDIA は現在、掲載モデルに対して無料の API アクセスを提供しているため、ソース内のコストは既定で `0` になります。
  </Accordion>

  <Accordion title="OpenAI 互換エンドポイント">
    NVIDIA は標準の `/v1` completions エンドポイントを使用します。OpenAI 互換のツールは、NVIDIA のベース URL でそのまま動作するはずです。
  </Accordion>

  <Accordion title="Nemotron 3 Ultra の推論パラメーター">
    NVIDIA の Ultra サンプルリクエストは、推論出力に `chat_template_kwargs.enable_thinking` と
    `reasoning_budget` を使用します。OpenClaw の同梱 Ultra 行は、通常のチャット利用向けにテンプレート思考を既定で無効にします。NVIDIA の推論出力を有効にする必要がある場合、または他の NVIDIA 固有のリクエストフィールドを強制する必要がある場合は、モデルごとのパラメーターを設定し、プロバイダー固有のオーバーライドを NVIDIA モデルに限定してください。

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

    `params.extra_body` は最終的な OpenAI 互換リクエスト本文のオーバーライドであるため、
    選択したエンドポイントについて NVIDIA が文書化しているフィールドにのみ使用してください。

  </Accordion>

  <Accordion title="遅いカスタムプロバイダー応答">
    一部の NVIDIA ホスト型カスタムモデルでは、最初の応答チャンクを出力するまでに、既定のモデルアイドルウォッチドッグより長くかかることがあります。カスタム NVIDIA プロバイダーエントリでは、エージェントランタイム全体のタイムアウトを増やすのではなく、プロバイダーのタイムアウトを増やしてください。

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
NVIDIA モデルは現在無料で使用できます。最新の提供状況とレート制限の詳細は
[build.nvidia.com](https://build.nvidia.com/) を確認してください。
</Tip>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバーの挙動を選択します。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    エージェント、モデル、プロバイダーの完全な設定リファレンスです。
  </Card>
</CardGroup>

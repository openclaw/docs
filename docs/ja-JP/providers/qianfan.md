---
read_when:
    - 多くの LLM に対して単一の API キーを使いたい場合
    - Baidu Qianfan のセットアップガイダンスが必要な場合
summary: Qianfan の統一 API を使って OpenClaw で多くのモデルにアクセスする
title: Qianfan
x-i18n:
    generated_at: "2026-04-24T05:16:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 727236394f6581f5bdb2f557092c31ff7904e4a80b06f8adc07a1c51dcfb2ff1
    source_path: providers/qianfan.md
    workflow: 15
---

Qianfan は Baidu の MaaS プラットフォームで、単一の
endpoint と API キーの背後で多くのモデルへリクエストをルーティングする **統一 API** を提供します。OpenAI 互換なので、ほとんどの OpenAI SDK は base URL を切り替えるだけで動作します。

| Property | Value                             |
| -------- | --------------------------------- |
| Provider | `qianfan`                         |
| Auth     | `QIANFAN_API_KEY`                 |
| API      | OpenAI 互換                 |
| Base URL | `https://qianfan.baidubce.com/v2` |

## はじめに

<Steps>
  <Step title="Baidu Cloud アカウントを作成する">
    [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) でサインアップまたはログインし、Qianfan API アクセスが有効になっていることを確認してください。
  </Step>
  <Step title="API キーを生成する">
    新しいアプリケーションを作成するか既存のものを選択し、API キーを生成します。キー形式は `bce-v3/ALTAK-...` です。
  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="モデルが利用可能であることを確認する">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## 組み込みカタログ

| Model ref                            | Input       | Context | Max output | Reasoning | Notes         |
| ------------------------------------ | ----------- | ------- | ---------- | --------- | ------------- |
| `qianfan/deepseek-v3.2`              | text        | 98,304  | 32,768     | はい       | デフォルトモデル |
| `qianfan/ernie-5.0-thinking-preview` | text, image | 119,000 | 64,000     | はい       | マルチモーダル    |

<Tip>
デフォルトのバンドル済みモデル参照は `qianfan/deepseek-v3.2` です。`models.providers.qianfan` を上書きする必要があるのは、カスタム base URL またはモデルメタデータが必要な場合だけです。
</Tip>

## Config 例

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Transport と互換性">
    Qianfan は、ネイティブ OpenAI リクエスト整形ではなく、OpenAI 互換 transport 経路を通って動作します。つまり標準 OpenAI SDK 機能は動作しますが、プロバイダー固有パラメータは転送されない場合があります。
  </Accordion>

  <Accordion title="カタログと上書き">
    バンドル済みカタログには現在 `deepseek-v3.2` と `ernie-5.0-thinking-preview` が含まれます。カスタム base URL またはモデルメタデータが必要な場合にのみ `models.providers.qianfan` を追加または上書きしてください。

    <Note>
    モデル参照には `qianfan/` プレフィックスを使います（例 `qianfan/deepseek-v3.2`）。
    </Note>

  </Accordion>

  <Accordion title="トラブルシューティング">
    - API キーが `bce-v3/ALTAK-` で始まり、Baidu Cloud console で Qianfan API アクセスが有効になっていることを確認してください。
    - モデルが一覧に出ない場合は、アカウントで Qianfan サービスが有効化されていることを確認してください。
    - デフォルト base URL は `https://qianfan.baidubce.com/v2` です。カスタム endpoint または proxy を使う場合にのみ変更してください。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作を選ぶ。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    完全な OpenClaw 設定リファレンス。
  </Card>
  <Card title="エージェント設定" href="/ja-JP/concepts/agent" icon="robot">
    エージェントのデフォルト設定とモデル割り当てを構成する。
  </Card>
  <Card title="Qianfan API docs" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    公式 Qianfan API ドキュメント。
  </Card>
</CardGroup>

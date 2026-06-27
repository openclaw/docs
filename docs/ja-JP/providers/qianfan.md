---
read_when:
    - 多くの LLM に単一の API キーを使いたい
    - Baidu Qianfan のセットアップガイダンスが必要です
summary: OpenClaw で Qianfan の統合 API を使用して多くのモデルにアクセスする
title: Qianfan
x-i18n:
    generated_at: "2026-06-27T12:48:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8bc31970dc7fbc43819ec6d51f4bd0047b1acc5a03b23b656e617e3abd97475
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan は Baidu の MaaS プラットフォームで、単一のエンドポイントと API キーの背後で多くのモデルへリクエストをルーティングする **統一 API** を提供します。OpenAI 互換のため、ほとんどの OpenAI SDK はベース URL を切り替えるだけで動作します。

| プロパティ | 値                                |
| ---------- | --------------------------------- |
| プロバイダー | `qianfan`                         |
| 認証       | `QIANFAN_API_KEY`                 |
| API        | OpenAI 互換                       |
| ベース URL | `https://qianfan.baidubce.com/v2` |

## プラグインをインストール

公式プラグインをインストールし、Gateway を再起動します。

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## はじめに

<Steps>
  <Step title="Create a Baidu Cloud account">
    [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) でサインアップまたはログインし、Qianfan API アクセスが有効になっていることを確認します。
  </Step>
  <Step title="Generate an API key">
    新しいアプリケーションを作成するか既存のアプリケーションを選択し、API キーを生成します。キー形式は `bce-v3/ALTAK-...` です。
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## 組み込みカタログ

| モデル参照                           | 入力        | コンテキスト | 最大出力 | 推論 | 注記             |
| ------------------------------------ | ----------- | ------------ | -------- | ---- | ---------------- |
| `qianfan/deepseek-v3.2`              | テキスト    | 98,304       | 32,768   | はい | デフォルトモデル |
| `qianfan/ernie-5.0-thinking-preview` | テキスト、画像 | 119,000      | 64,000   | はい | マルチモーダル   |

<Tip>
デフォルトのモデル参照は `qianfan/deepseek-v3.2` です。カスタムベース URL またはモデルメタデータが必要な場合にのみ、`models.providers.qianfan` を上書きする必要があります。
</Tip>

## 設定例

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
  <Accordion title="Transport and compatibility">
    Qianfan は、ネイティブの OpenAI リクエスト形成ではなく、OpenAI 互換のトランスポートパスを通じて実行されます。つまり、標準的な OpenAI SDK の機能は動作しますが、プロバイダー固有のパラメーターは転送されない場合があります。
  </Accordion>

  <Accordion title="Catalog and overrides">
    静的カタログには現在、`deepseek-v3.2` と `ernie-5.0-thinking-preview` が含まれています。カスタムベース URL またはモデルメタデータが必要な場合にのみ、`models.providers.qianfan` を追加または上書きしてください。

    <Note>
    モデル参照は `qianfan/` プレフィックスを使用します（例: `qianfan/deepseek-v3.2`）。
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - API キーが `bce-v3/ALTAK-` で始まり、Baidu Cloud コンソールで Qianfan API アクセスが有効になっていることを確認します。
    - モデルが一覧表示されない場合は、アカウントで Qianfan サービスが有効化されていることを確認します。
    - デフォルトのベース URL は `https://qianfan.baidubce.com/v2` です。カスタムエンドポイントまたはプロキシを使用する場合にのみ変更してください。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作を選択します。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/configuration-reference" icon="gear">
    OpenClaw 設定の完全なリファレンスです。
  </Card>
  <Card title="Agent setup" href="/ja-JP/concepts/agent" icon="robot">
    エージェントのデフォルトとモデル割り当てを設定します。
  </Card>
  <Card title="Qianfan API docs" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Qianfan API 公式ドキュメントです。
  </Card>
</CardGroup>

---
read_when:
    - 多数の大規模言語モデルに対して単一の API キーを使いたい場合
    - Baidu Qianfan のセットアップガイダンスが必要です
summary: Qianfan の統合 API を使用して OpenClaw で多くのモデルにアクセスする
title: Qianfan
x-i18n:
    generated_at: "2026-04-30T05:31:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6adfbad6c18bf2bcf93d9c56c51591c862ebb751ffd8183015fa2fc9566ce0af
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan は Baidu の MaaS プラットフォームで、単一のエンドポイントと API キーの背後にある多数のモデルへリクエストをルーティングする **統一 API** を提供します。OpenAI 互換のため、ほとんどの OpenAI SDK はベース URL を切り替えるだけで動作します。

| プロパティ | 値                                |
| -------- | --------------------------------- |
| プロバイダー | `qianfan`                         |
| 認証     | `QIANFAN_API_KEY`                 |
| API      | OpenAI 互換                       |
| ベース URL | `https://qianfan.baidubce.com/v2` |

## はじめに

<Steps>
  <Step title="Baidu Cloud アカウントを作成する">
    [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) でサインアップまたはログインし、Qianfan API アクセスが有効になっていることを確認します。
  </Step>
  <Step title="API キーを生成する">
    新しいアプリケーションを作成するか既存のものを選択し、API キーを生成します。キーの形式は `bce-v3/ALTAK-...` です。
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

| モデル参照                           | 入力        | コンテキスト | 最大出力 | 推論 | 注記             |
| ------------------------------------ | ----------- | ------- | ---------- | --------- | ------------- |
| `qianfan/deepseek-v3.2`              | テキスト    | 98,304  | 32,768     | はい | デフォルトモデル |
| `qianfan/ernie-5.0-thinking-preview` | テキスト、画像 | 119,000 | 64,000     | はい | マルチモーダル |

<Tip>
デフォルトのバンドル済みモデル参照は `qianfan/deepseek-v3.2` です。カスタムのベース URL またはモデルメタデータが必要な場合にのみ、`models.providers.qianfan` を上書きする必要があります。
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
  <Accordion title="トランスポートと互換性">
    Qianfan は、ネイティブの OpenAI リクエスト整形ではなく、OpenAI 互換のトランスポート経路を通じて実行されます。つまり、標準の OpenAI SDK 機能は動作しますが、プロバイダー固有のパラメーターは転送されない場合があります。
  </Accordion>

  <Accordion title="カタログと上書き">
    バンドル済みカタログには現在、`deepseek-v3.2` と `ernie-5.0-thinking-preview` が含まれています。カスタムのベース URL またはモデルメタデータが必要な場合にのみ、`models.providers.qianfan` を追加または上書きしてください。

    <Note>
    モデル参照は `qianfan/` プレフィックスを使用します（例: `qianfan/deepseek-v3.2`）。
    </Note>

  </Accordion>

  <Accordion title="トラブルシューティング">
    - API キーが `bce-v3/ALTAK-` で始まり、Baidu Cloud コンソールで Qianfan API アクセスが有効になっていることを確認します。
    - モデルが一覧表示されない場合は、アカウントで Qianfan サービスが有効化されていることを確認してください。
    - デフォルトのベース URL は `https://qianfan.baidubce.com/v2` です。カスタムエンドポイントまたはプロキシを使用する場合にのみ変更してください。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    OpenClaw 設定の完全なリファレンス。
  </Card>
  <Card title="エージェントのセットアップ" href="/ja-JP/concepts/agent" icon="robot">
    エージェントのデフォルトとモデル割り当ての設定。
  </Card>
  <Card title="Qianfan API ドキュメント" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    公式 Qianfan API ドキュメント。
  </Card>
</CardGroup>

---
read_when:
    - 多くのLLMに使える単一のAPIキーが必要な場合
    - Baidu Qianfan のセットアップガイダンスが必要です
summary: OpenClaw で多くのモデルにアクセスするために Qianfan の統合 API を使用する
title: Qianfan
x-i18n:
    generated_at: "2026-07-05T11:45:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31387a53ee4472e2d20ae939ea75cea0d6f6367501becd56a8654fd97fdf0804
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan は Baidu の MaaS プラットフォームです。単一のエンドポイントと API キーの背後で多数のモデルへリクエストをルーティングする、統合された OpenAI 互換 API です。OpenClaw は公式外部 Plugin `@openclaw/qianfan-provider` としてこれを同梱しています。

| プロパティ | 値 |
| ------------- | ---------------------------------------- |
| プロバイダー | `qianfan`                                |
| 認証 | `QIANFAN_API_KEY`                        |
| API           | OpenAI 互換 (`openai-completions`) |
| ベース URL      | `https://qianfan.baidubce.com/v2`        |
| デフォルトモデル | `qianfan/deepseek-v3.2`                  |

## Plugin をインストールする

公式 Plugin をインストールしてから、Gateway を再起動します。

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## はじめに

<Steps>
  <Step title="Baidu Cloud アカウントを作成する">
    [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) でサインアップまたはログインし、Qianfan API アクセスが有効になっていることを確認します。
  </Step>
  <Step title="API キーを生成する">
    新しいアプリケーションを作成するか既存のものを選択し、API キーを生成します。Baidu Cloud のキーは `bce-v3/ALTAK-...` 形式を使用します。
  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```

    非対話型の実行では、`--qianfan-api-key <key>` または
    `QIANFAN_API_KEY` からキーを読み取ります。オンボーディングはプロバイダー設定を書き込み、デフォルトモデルの
    `QIANFAN` エイリアスを追加し、モデルが設定されていない場合は `qianfan/deepseek-v3.2`
    をデフォルトモデルとして設定します。

  </Step>
  <Step title="モデルが利用可能であることを確認する">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## 組み込みカタログ

| モデル ref                            | 入力       | コンテキスト | 最大出力 | 推論 | 注記         |
| ------------------------------------ | ----------- | ------- | ---------- | --------- | ------------- |
| `qianfan/deepseek-v3.2`              | text        | 98,304  | 32,768     | はい       | デフォルトモデル |
| `qianfan/ernie-5.0-thinking-preview` | text, image | 119,000 | 64,000     | はい       | マルチモーダル    |

カタログは静的です。ライブのモデル検出はありません。

<Tip>
カスタムのベース URL またはモデルメタデータが必要な場合にのみ、`models.providers.qianfan` を上書きする必要があります。
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

<Note>
モデル ref は `qianfan/` プレフィックスを使用します（例: `qianfan/deepseek-v3.2`）。
</Note>

<AccordionGroup>
  <Accordion title="トランスポートと互換性">
    Qianfan はネイティブの OpenAI リクエスト整形ではなく、OpenAI 互換のトランスポート経路を通じて実行されます。標準の OpenAI SDK 機能は動作しますが、プロバイダー固有のパラメーターは転送されない場合があります。
  </Accordion>

  <Accordion title="トラブルシューティング">
    - API キーが `bce-v3/ALTAK-` で始まり、Baidu Cloud コンソールで Qianfan API アクセスが有効になっていることを確認します。
    - モデルが一覧表示されない場合は、アカウントで Qianfan サービスが有効化されていることを確認します。
    - カスタムエンドポイントまたはプロキシを使用する場合にのみ、ベース URL を変更してください。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル ref、フェイルオーバー動作の選択。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    OpenClaw 設定の完全なリファレンス。
  </Card>
  <Card title="エージェント設定" href="/ja-JP/concepts/agent" icon="robot">
    エージェントのデフォルトとモデル割り当ての設定。
  </Card>
  <Card title="Qianfan API ドキュメント" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    公式 Qianfan API ドキュメント。
  </Card>
</CardGroup>

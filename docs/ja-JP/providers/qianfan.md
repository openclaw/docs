---
read_when:
    - 多数のLLMで単一のAPIキーを使用したい場合
    - Baidu Qianfan のセットアップガイドが必要です
summary: Qianfan の統合 API を使用して OpenClaw で多くのモデルにアクセスする
title: Qianfan
x-i18n:
    generated_at: "2026-07-11T22:36:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31387a53ee4472e2d20ae939ea75cea0d6f6367501becd56a8654fd97fdf0804
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan は Baidu の MaaS プラットフォームです。単一のエンドポイントと API キーを使用して、多数のモデルにリクエストを振り分ける、統合された OpenAI 互換 API です。OpenClaw では、公式の外部 Plugin `@openclaw/qianfan-provider` として提供されています。

| プロパティ      | 値                                       |
| --------------- | ---------------------------------------- |
| プロバイダー    | `qianfan`                                |
| 認証            | `QIANFAN_API_KEY`                        |
| API             | OpenAI 互換（`openai-completions`）      |
| ベース URL      | `https://qianfan.baidubce.com/v2`        |
| デフォルトモデル | `qianfan/deepseek-v3.2`                  |

## Plugin のインストール

公式 Plugin をインストールしてから、Gateway を再起動します。

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## はじめに

<Steps>
  <Step title="Baidu Cloud アカウントを作成する">
    [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) で新規登録またはログインし、Qianfan API へのアクセスが有効になっていることを確認します。
  </Step>
  <Step title="API キーを生成する">
    新しいアプリケーションを作成するか既存のアプリケーションを選択し、API キーを生成します。Baidu Cloud のキーでは `bce-v3/ALTAK-...` 形式を使用します。
  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```

    非対話型の実行では、`--qianfan-api-key <key>` または
    `QIANFAN_API_KEY` からキーを読み取ります。オンボーディングはプロバイダー設定を書き込み、
    デフォルトモデルに `QIANFAN` エイリアスを追加し、モデルが設定されていない場合は
    `qianfan/deepseek-v3.2` をデフォルトモデルに設定します。

  </Step>
  <Step title="モデルが利用可能であることを確認する">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## 組み込みカタログ

| モデル参照                           | 入力             | コンテキスト | 最大出力 | 推論 | 備考               |
| ------------------------------------ | ---------------- | ------------ | -------- | ---- | ------------------ |
| `qianfan/deepseek-v3.2`              | テキスト         | 98,304       | 32,768   | あり | デフォルトモデル   |
| `qianfan/ernie-5.0-thinking-preview` | テキスト、画像   | 119,000      | 64,000   | あり | マルチモーダル     |

カタログは静的です。モデルのライブ検出はありません。

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
モデル参照には `qianfan/` プレフィックスを使用します（例：`qianfan/deepseek-v3.2`）。
</Note>

<AccordionGroup>
  <Accordion title="転送方式と互換性">
    Qianfan は、OpenAI ネイティブのリクエスト形式ではなく、OpenAI 互換の転送経路を通じて動作します。標準の OpenAI SDK 機能は動作しますが、プロバイダー固有のパラメーターは転送されない場合があります。
  </Accordion>

  <Accordion title="トラブルシューティング">
    - API キーが `bce-v3/ALTAK-` で始まり、Baidu Cloud コンソールで Qianfan API へのアクセスが有効になっていることを確認します。
    - モデルが一覧に表示されない場合は、アカウントで Qianfan サービスが有効化されていることを確認します。
    - カスタムエンドポイントまたはプロキシを使用する場合にのみ、ベース URL を変更してください。

  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルの選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択方法。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    OpenClaw の完全な設定リファレンス。
  </Card>
  <Card title="エージェントのセットアップ" href="/ja-JP/concepts/agent" icon="robot">
    エージェントのデフォルト設定とモデル割り当ての構成方法。
  </Card>
  <Card title="Qianfan API ドキュメント" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Qianfan API の公式ドキュメント。
  </Card>
</CardGroup>

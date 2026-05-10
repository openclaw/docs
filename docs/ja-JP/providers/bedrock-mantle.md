---
read_when:
    - OpenClawでBedrock Mantleがホストするオープンソースモデルを使用したい
    - GPT-OSS、Qwen、Kimi、または GLM には、Mantle の OpenAI 互換エンドポイントが必要です
summary: Amazon Bedrock Mantle (OpenAI 互換) モデルを OpenClaw で使用する
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-05-10T19:48:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 721eef5b7ff606b8c5e02234dae1b8d846b43ff9f3d7bf871f701bb3136fec0e
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw には、Mantle の OpenAI 互換エンドポイントに接続する同梱の **Amazon Bedrock Mantle** プロバイダーが含まれています。Mantle は、Bedrock インフラストラクチャを基盤とした標準の `/v1/chat/completions` サーフェスを通じて、オープンソースおよびサードパーティモデル (GPT-OSS、Qwen、Kimi、GLM など) をホストします。

| プロパティ       | 値                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- |
| プロバイダー ID    | `amazon-bedrock-mantle`                                                                     |
| API            | `openai-completions` (OpenAI 互換) または `anthropic-messages` (Anthropic Messages ルート) |
| 認証           | 明示的な `AWS_BEARER_TOKEN_BEDROCK`、または IAM 認証情報チェーンによる bearer token 生成         |
| デフォルトリージョン | `us-east-1` (`AWS_REGION` または `AWS_DEFAULT_REGION` で上書き)                            |

## はじめに

希望する認証方法を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="明示的な bearer token">
    **最適な用途:** Mantle bearer token をすでに持っている環境。

    <Steps>
      <Step title="Gateway ホストで bearer token を設定する">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        必要に応じてリージョンを設定します (デフォルトは `us-east-1`)。

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="モデルが検出されることを確認する">
        ```bash
        openclaw models list
        ```

        検出されたモデルは `amazon-bedrock-mantle` プロバイダーの下に表示されます。デフォルトを上書きしたい場合を除き、追加の設定は不要です。
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM 認証情報">
    **最適な用途:** AWS SDK 互換の認証情報 (共有設定、SSO、Web アイデンティティ、インスタンスロールまたはタスクロール) を使用する場合。

    <Steps>
      <Step title="Gateway ホストで AWS 認証情報を設定する">
        任意の AWS SDK 互換の認証ソースを使用できます。

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="モデルが検出されることを確認する">
        ```bash
        openclaw models list
        ```

        OpenClaw は認証情報チェーンから Mantle bearer token を自動的に生成します。
      </Step>
    </Steps>

    <Tip>
    `AWS_BEARER_TOKEN_BEDROCK` が設定されていない場合、OpenClaw は共有認証情報/設定プロファイル、SSO、Web アイデンティティ、インスタンスロールまたはタスクロールを含む AWS デフォルト認証情報チェーンから bearer token を発行します。
    </Tip>

  </Tab>
</Tabs>

## 自動モデル検出

`AWS_BEARER_TOKEN_BEDROCK` が設定されている場合、OpenClaw はそれを直接使用します。それ以外の場合、OpenClaw は AWS デフォルト認証情報チェーンから Mantle bearer token の生成を試みます。その後、リージョンの `/v1/models` エンドポイントに問い合わせて、利用可能な Mantle モデルを検出します。

| 挙動          | 詳細                    |
| ----------------- | ------------------------- |
| 検出キャッシュ   | 結果は 1 時間キャッシュされます |
| IAM トークン更新 | 1 時間ごと                    |

Mantle Plugin を有効にしたまま、自動検出と IAM bearer-token 生成を抑制するには、Plugin 所有の検出トグルを無効にします。

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
bearer token は、標準の [Amazon Bedrock](/ja-JP/providers/bedrock) プロバイダーで使用されるものと同じ `AWS_BEARER_TOKEN_BEDROCK` です。
</Note>

### サポートされるリージョン

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## 手動設定

自動検出ではなく明示的な設定を使用したい場合:

```json5
{
  models: {
    providers: {
      "amazon-bedrock-mantle": {
        baseUrl: "https://bedrock-mantle.us-east-1.api.aws/v1",
        api: "openai-completions",
        auth: "api-key",
        apiKey: "env:AWS_BEARER_TOKEN_BEDROCK",
        models: [
          {
            id: "gpt-oss-120b",
            name: "GPT-OSS 120B",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32000,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

## 高度な設定

<AccordionGroup>
  <Accordion title="推論サポート">
    推論サポートは、`thinking`、`reasoner`、`gpt-oss-120b` のようなパターンを含むモデル ID から推定されます。OpenClaw は、検出時に一致するモデルに対して `reasoning: true` を自動的に設定します。
  </Accordion>

  <Accordion title="エンドポイントの利用不可">
    Mantle エンドポイントが利用できない、またはモデルを返さない場合、そのプロバイダーは通知なしでスキップされます。OpenClaw はエラーを出さず、他の設定済みプロバイダーは通常どおり動作し続けます。
  </Accordion>

  <Accordion title="Anthropic Messages ルート経由の Claude Opus 4.7">
    Mantle は、同じ bearer 認証済みストリーミング経路を通じて Claude モデルを扱う Anthropic Messages ルートも公開しています。Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) は、プロバイダー所有のストリーミングでこのルートから呼び出せるため、AWS bearer token は Anthropic API キーのようには扱われません。

    Mantle プロバイダーで Anthropic Messages モデルを固定すると、OpenClaw はそのモデルに対して `openai-completions` ではなく `anthropic-messages` API サーフェスを使用します。認証情報は引き続き `AWS_BEARER_TOKEN_BEDROCK` (または発行された IAM bearer token) から取得されます。

    ```json5
    {
      models: {
        providers: {
          "amazon-bedrock-mantle": {
            models: [
              {
                id: "claude-opus-4.7",
                name: "Claude Opus 4.7",
                api: "anthropic-messages",
                reasoning: true,
                input: ["text", "image"],
                contextWindow: 1000000,
                maxTokens: 32000,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Amazon Bedrock プロバイダーとの関係">
    Bedrock Mantle は、標準の [Amazon Bedrock](/ja-JP/providers/bedrock) プロバイダーとは別のプロバイダーです。Mantle は OpenAI 互換の `/v1` サーフェスを使用し、標準の Bedrock プロバイダーはネイティブの Bedrock API を使用します。

    どちらのプロバイダーも、存在する場合は同じ `AWS_BEARER_TOKEN_BEDROCK` 認証情報を共有します。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/ja-JP/providers/bedrock" icon="cloud">
    Anthropic Claude、Titan、その他のモデル向けのネイティブ Bedrock プロバイダー。
  </Card>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="OAuth と認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と認証情報の再利用ルール。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的な問題とその解決方法。
  </Card>
</CardGroup>

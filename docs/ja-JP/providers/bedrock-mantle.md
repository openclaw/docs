---
read_when:
    - OpenClaw で Bedrock Mantle がホストする OSS model を使いたい場合
    - GPT-OSS、Qwen、Kimi、または GLM 向けの Mantle OpenAI 互換 endpoint が必要な場合
summary: Amazon Bedrock Mantle（OpenAI 互換）models を OpenClaw で使う
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-23T14:07:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: a20e0abcd140b3c7115a9b0bbdf924e15962e0452ded676df252c753610e03ed
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

OpenClaw には、Mantle の OpenAI 互換 endpoint に接続するバンドル済みの **Amazon Bedrock Mantle** provider が含まれています。Mantle は、Bedrock インフラストラクチャを基盤にした標準的な `/v1/chat/completions` サーフェスを通じて、オープンソースおよびサードパーティの models（GPT-OSS、Qwen、Kimi、GLM など）をホストします。

| プロパティ | 値 |
| -------------- | ------------------------------------------------------------------------------------------- |
| Provider ID | `amazon-bedrock-mantle` |
| API | `openai-completions`（OpenAI 互換）または `anthropic-messages`（Anthropic Messages 経路） |
| 認証 | 明示的な `AWS_BEARER_TOKEN_BEDROCK` または IAM credential-chain による bearer-token 生成 |
| デフォルトリージョン | `us-east-1`（`AWS_REGION` または `AWS_DEFAULT_REGION` で上書き） |

## はじめに

好みの認証方法を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="明示的 bearer token">
    **最適な用途:** すでに Mantle bearer token を持っている環境。

    <Steps>
      <Step title="Gateway host に bearer token を設定する">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        必要に応じてリージョンも設定します（デフォルトは `us-east-1`）:

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="models が検出されることを確認する">
        ```bash
        openclaw models list
        ```

        検出された models は `amazon-bedrock-mantle` provider 配下に表示されます。デフォルトを上書きしたい場合を除き、追加設定は不要です。
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM 認証情報">
    **最適な用途:** AWS SDK 互換の認証情報（shared config、SSO、web identity、instance または task role）を使う場合。

    <Steps>
      <Step title="Gateway host に AWS 認証情報を設定する">
        AWS SDK 互換の認証ソースならどれでも使えます:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="models が検出されることを確認する">
        ```bash
        openclaw models list
        ```

        OpenClaw は credential chain から Mantle bearer token を自動生成します。
      </Step>
    </Steps>

    <Tip>
    `AWS_BEARER_TOKEN_BEDROCK` が設定されていない場合、OpenClaw は AWS のデフォルト credential chain から bearer token を生成します。これには shared credentials/config profile、SSO、web identity、instance または task role が含まれます。
    </Tip>

  </Tab>
</Tabs>

## 自動 model 検出

`AWS_BEARER_TOKEN_BEDROCK` が設定されている場合、OpenClaw はそれを直接使用します。そうでない場合、
OpenClaw は AWS のデフォルト credential chain から Mantle bearer token の生成を試みます。
その後、リージョンの `/v1/models` endpoint を問い合わせて、利用可能な Mantle models を検出します。

| 動作 | 詳細 |
| ----------------- | ------------------------- |
| 検出キャッシュ | 結果は 1 時間キャッシュされる |
| IAM token 更新 | 毎時 |

<Note>
この bearer token は、標準の [Amazon Bedrock](/ja-JP/providers/bedrock) provider でも使われる同じ `AWS_BEARER_TOKEN_BEDROCK` です。
</Note>

### 対応リージョン

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## 手動設定

自動検出ではなく明示的な設定を使いたい場合:

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

## 高度な注意点

<AccordionGroup>
  <Accordion title="reasoning サポート">
    reasoning サポートは、`thinking`、`reasoner`、`gpt-oss-120b` のようなパターンを含む model ID から推定されます。検出時に、一致する models には OpenClaw が自動的に `reasoning: true` を設定します。
  </Accordion>

  <Accordion title="endpoint が利用できない場合">
    Mantle endpoint が利用できない、または model を返さない場合、その provider は
    静かにスキップされます。OpenClaw はエラーにせず、他の設定済み provider は通常どおり動作し続けます。
  </Accordion>

  <Accordion title="Anthropic Messages 経路による Claude Opus 4.7">
    Mantle は、同じ bearer 認証ストリーミング経路を通じて Claude models を運ぶ Anthropic Messages 経路も公開しています。Claude Opus 4.7（`amazon-bedrock-mantle/claude-opus-4.7`）はこの経路を通じて provider 所有のストリーミングで呼び出せるため、AWS bearer token は Anthropic API key のようには扱われません。

    Mantle provider 上で Anthropic Messages model を固定した場合、その model に対して OpenClaw は `openai-completions` ではなく `anthropic-messages` API サーフェスを使います。認証は引き続き `AWS_BEARER_TOKEN_BEDROCK`（または IAM から生成された bearer token）から行われます。

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

  <Accordion title="Amazon Bedrock provider との関係">
    Bedrock Mantle は、標準の
    [Amazon Bedrock](/ja-JP/providers/bedrock) provider とは別の provider です。Mantle は
    OpenAI 互換の `/v1` サーフェスを使用し、標準 Bedrock provider は
    ネイティブ Bedrock API を使用します。

    両 provider は、存在する場合、同じ `AWS_BEARER_TOKEN_BEDROCK` 認証情報を共有します。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/ja-JP/providers/bedrock" icon="cloud">
    Anthropic Claude、Titan、その他の models 向けネイティブ Bedrock provider。
  </Card>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、model ref、フェイルオーバー動作の選び方。
  </Card>
  <Card title="OAuth と認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と認証情報再利用ルール。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    よくある問題とその解決方法。
  </Card>
</CardGroup>

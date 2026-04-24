---
read_when:
    - OpenClawでBedrock MantleホストのOSSモデルを使いたい場合
    - GPT-OSS、Qwen、Kimi、またはGLM向けのMantle OpenAI互換エンドポイントが必要な場合
summary: OpenClawでAmazon Bedrock Mantle（OpenAI互換）モデルを使う
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-24T05:13:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5e9fb65cd5f5151470f0d8eeb9edceb9b035863dcd863d2bcabe233c1cfce41
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

OpenClawには、MantleのOpenAI互換エンドポイントへ接続する同梱の**Amazon Bedrock Mantle**プロバイダーが含まれています。Mantleは、open-sourceおよび
サードパーティモデル（GPT-OSS, Qwen, Kimi, GLM など）を、Bedrock基盤上の標準
`/v1/chat/completions` サーフェス経由でホストします。

| Property       | Value                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------- |
| Provider ID    | `amazon-bedrock-mantle`                                                                       |
| API            | `openai-completions`（OpenAI互換）または `anthropic-messages`（Anthropic Messagesルート）     |
| Auth           | 明示的な `AWS_BEARER_TOKEN_BEDROCK` またはIAM credential-chainによるbearer-token生成          |
| Default region | `us-east-1`（`AWS_REGION` または `AWS_DEFAULT_REGION` で上書き可能）                          |

## はじめに

好みのauth methodを選んで、セットアップ手順に従ってください。

<Tabs>
  <Tab title="明示的なbearer token">
    **最適なケース:** すでにMantle bearer tokenを持っている環境。

    <Steps>
      <Step title="Gatewayホストにbearer tokenを設定する">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        任意でregionも設定できます（デフォルトは `us-east-1`）:

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="モデルが検出されることを確認する">
        ```bash
        openclaw models list
        ```

        検出されたモデルは `amazon-bedrock-mantle` providerの下に表示されます。デフォルトを上書きしたい場合を除き、
        追加configは不要です。
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM credential">
    **最適なケース:** AWS SDK互換credential（shared config, SSO, web identity, instanceまたはtask role）を使う場合。

    <Steps>
      <Step title="GatewayホストにAWS credentialを設定する">
        任意のAWS SDK互換auth sourceが使えます:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="モデルが検出されることを確認する">
        ```bash
        openclaw models list
        ```

        OpenClawはcredential chainからMantle bearer tokenを自動生成します。
      </Step>
    </Steps>

    <Tip>
    `AWS_BEARER_TOKEN_BEDROCK` が設定されていない場合、OpenClawはAWS default credential chainからbearer tokenを自動生成します。これにはshared credentials/config profile, SSO, web identity, instanceまたはtask roleが含まれます。
    </Tip>

  </Tab>
</Tabs>

## 自動モデル検出

`AWS_BEARER_TOKEN_BEDROCK` が設定されている場合、OpenClawはそれを直接使います。そうでなければ、
OpenClawはAWS default
credential chainからMantle bearer tokenを生成しようとします。その後、その
regionの `/v1/models` endpointを問い合わせて、利用可能なMantle modelを検出します。

| Behavior          | Detail                      |
| ----------------- | --------------------------- |
| Discovery cache   | 結果は1時間キャッシュされる |
| IAM token refresh | 毎時                        |

<Note>
bearer tokenは、標準の [Amazon Bedrock](/ja-JP/providers/bedrock) providerでも使われる `AWS_BEARER_TOKEN_BEDROCK` と同じものです。
</Note>

### サポートされるregion

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## 手動設定

自動検出ではなく明示的なconfigを使いたい場合:

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
  <Accordion title="Reasoning support">
    Reasoning supportは、`thinking`, `reasoner`, `gpt-oss-120b` のような
    patternを含むmodel IDから推定されます。OpenClawは検出時に、該当するmodelへ
    `reasoning: true` を自動設定します。
  </Accordion>

  <Accordion title="Endpoint unavailable">
    Mantle endpointが利用不可、またはmodelを返さない場合、そのproviderは
    静かにスキップされます。OpenClawはエラーにせず、他の設定済みproviderは
    通常どおり動作し続けます。
  </Accordion>

  <Accordion title="Anthropic Messagesルート経由のClaude Opus 4.7">
    Mantleは、同じbearer-authenticatedなstreaming pathを通してClaude modelを運ぶAnthropic Messagesルートも公開しています。Claude Opus 4.7（`amazon-bedrock-mantle/claude-opus-4.7`）はこのルート経由で呼び出せ、provider所有のstreamingを使うため、AWS bearer tokenはAnthropic API keyとして扱われません。

    Mantle provider上でAnthropic Messages modelを固定すると、そのmodelではOpenClawは `openai-completions` ではなく `anthropic-messages` APIサーフェスを使います。authは引き続き `AWS_BEARER_TOKEN_BEDROCK`（または生成されたIAM bearer token）から取得されます。

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

  <Accordion title="Amazon Bedrock providerとの関係">
    Bedrock Mantleは標準の
    [Amazon Bedrock](/ja-JP/providers/bedrock) providerとは別のproviderです。Mantleは
    OpenAI互換の `/v1` サーフェスを使い、一方で標準Bedrock providerは
    ネイティブBedrock APIを使います。

    両providerは、存在する場合、同じ `AWS_BEARER_TOKEN_BEDROCK` credentialを共有します。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/ja-JP/providers/bedrock" icon="cloud">
    Anthropic Claude, Titan, その他モデル向けのネイティブBedrock provider。
  </Card>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、model ref、failover動作の選び方。
  </Card>
  <Card title="OAuthとauth" href="/ja-JP/gateway/authentication" icon="key">
    Authの詳細とcredential再利用ルール。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    よくある問題とその解決方法。
  </Card>
</CardGroup>

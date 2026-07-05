---
read_when:
    - OpenClaw で Bedrock Mantle がホストする OSS モデルを使用したい
    - GPT-OSS、Qwen、Kimi、またはGLMには、Mantle OpenAI互換エンドポイントが必要です
summary: OpenClaw で Amazon Bedrock Mantle（OpenAI 互換）モデルを使用する
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-07-05T11:42:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c1c930ee91661df184de159cc9d0430b5e4f31a0b6b2f0664894901e0d018a3
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw には、Mantle の OpenAI 互換エンドポイントに接続するバンドル済みの **Amazon Bedrock Mantle** プロバイダーが含まれています。Mantle は、Bedrock インフラストラクチャに支えられた標準の `/v1/chat/completions` サーフェスを通じて、オープンソースおよびサードパーティモデル（GPT-OSS、Qwen、Kimi、GLM など）をホストします。Mantle はまた、Anthropic Messages ルートを通じて 2 つの Anthropic Claude モデルも公開します。

| プロパティ     | 値                                                                                             |
| -------------- | ---------------------------------------------------------------------------------------------- |
| プロバイダー ID | `amazon-bedrock-mantle`                                                                        |
| API            | 検出された OSS モデルには `openai-completions`、2 つの Claude モデルには `anthropic-messages` |
| 認証           | 明示的な `AWS_BEARER_TOKEN_BEDROCK` または IAM 認証情報チェーンによるベアラートークン生成      |
| デフォルトリージョン | `us-east-1`（`AWS_REGION` または `AWS_DEFAULT_REGION` で上書き）                               |

## はじめに

好みの認証方法を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="明示的なベアラートークン">
    **最適な用途:** Mantle ベアラートークンをすでに持っている環境。

    <Steps>
      <Step title="Gateway ホストでベアラートークンを設定する">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        必要に応じてリージョンを設定します（デフォルトは `us-east-1`）。

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
    **最適な用途:** AWS SDK 互換の認証情報（共有設定、SSO、ウェブアイデンティティ、インスタンスロールまたはタスクロール）を使用する場合。

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

        OpenClaw は認証情報チェーンから Mantle ベアラートークンを自動的に生成します。
      </Step>
    </Steps>

    <Tip>
    `AWS_BEARER_TOKEN_BEDROCK` が設定されていない場合、OpenClaw は共有認証情報/設定プロファイル、SSO、ウェブアイデンティティ、インスタンスロールまたはタスクロールを含む AWS デフォルト認証情報チェーンから、ベアラートークンを自動発行します。
    </Tip>

  </Tab>
</Tabs>

## 自動モデル検出

`AWS_BEARER_TOKEN_BEDROCK` が設定されている場合、OpenClaw はそれを直接使用します。それ以外の場合、OpenClaw は AWS デフォルト認証情報チェーンから Mantle ベアラートークンの生成を試みます。その後、リージョンの `/v1/models` エンドポイントに問い合わせて、利用可能な Mantle モデルを検出します。

| 動作              | 詳細                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------- |
| 検出キャッシュ    | 結果はリージョンごとに 1 時間キャッシュされます。取得に失敗すると最後のキャッシュ結果を返します |
| IAM トークン更新  | 2 時間ごと。リージョンごとにキャッシュされます                                         |

Mantle Plugin を有効にしたまま自動検出と IAM ベアラートークン生成を抑制するには、Plugin 所有の検出トグルを無効にします。

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
ベアラートークンは、標準の [Amazon Bedrock](/ja-JP/providers/bedrock) プロバイダーで使用されるものと同じ `AWS_BEARER_TOKEN_BEDROCK` です。
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

## 高度な設定

<AccordionGroup>
  <Accordion title="推論サポート">
    推論サポートは、`thinking`、`reasoner`、`reasoning`、`deepseek.r`、`gpt-oss-120b`、または `gpt-oss-safeguard-120b` のようなパターンを含むモデル ID から推定されます。OpenClaw は検出時に、一致するモデルへ `reasoning: true` を自動的に設定します。
  </Accordion>

  <Accordion title="エンドポイントが利用できない場合">
    Mantle エンドポイントが利用できない、モデルを返さない、またはベアラートークン解決に失敗した場合、検出は空の結果を返し、暗黙のプロバイダーはスキップされます。OpenClaw はエラーにしません。他の設定済みプロバイダーは通常どおり動作し続けます。
  </Accordion>

  <Accordion title="Anthropic Messages ルート経由の Claude Opus 4.7 と Claude Mythos Preview">
    OpenClaw は、`/v1/models` が何を返すかに関係なく、検出が成功した後に常に 2 つの Claude モデルを Mantle カタログへ追加します:
    `amazon-bedrock-mantle/anthropic.claude-opus-4-7`（Claude Opus 4.7）と
    `amazon-bedrock-mantle/anthropic.claude-mythos-preview`（Claude Mythos
    Preview）です。どちらも `anthropic-messages` API サーフェスを使用し、同じベアラー認証済みの Anthropic 互換エンドポイント（`<mantle-base>/anthropic`）を通じてストリーミングするため、AWS ベアラートークンは Anthropic API キーのようには扱われません。

    Claude Mythos Preview は常に推論を要求し、`/think` レベルが設定されていない場合はデフォルトで `high` エフォートを使用します（`xhigh`/`max` は `high` に下げられ、`minimal` は `low` に上げられます）。Mantle 上の Opus 4.7 はモデル提供の推論なしでストリーミングし、Opus 4.7 はこのルートでサンプリング上書きを受け付けないため、OpenClaw はその `temperature` パラメーターを省略します。Mythos Preview は通常どおり `temperature` 上書きを受け付けます。

    これら 2 つのモデルは `models.providers["amazon-bedrock-mantle"].models` エントリでは設定できません。検出が成功した場合に常に追加され、完全に削除するには検出そのものを無効にする必要があります。

  </Accordion>

  <Accordion title="Amazon Bedrock プロバイダーとの関係">
    Bedrock Mantle は、標準の [Amazon Bedrock](/ja-JP/providers/bedrock) プロバイダーとは別のプロバイダーです。Mantle は OSS カタログに OpenAI 互換の `/v1` サーフェスを使用する一方、標準の Bedrock プロバイダーはネイティブの Bedrock Converse API を使用します。

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
    よくある問題とその解決方法。
  </Card>
</CardGroup>

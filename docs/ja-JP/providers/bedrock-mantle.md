---
read_when:
    - OpenClaw で Bedrock Mantle がホストする OSS モデルを使用する場合
    - GPT-OSS、Qwen、Kimi、または GLM 用の Mantle OpenAI 互換エンドポイントが必要です
    - Amazon Bedrock Mantle 経由で Claude Sonnet 5 または Mythos 5 を使用する場合
summary: OpenClaw で Amazon Bedrock Mantle の OpenAI 互換モデルと Claude Messages モデルを使用する
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-07-11T22:34:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 107ffdc76e3971a085f7d64d8d766f6cd8706ce882d8bab80d27c72ab545eec1
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw には、Mantle の OpenAI 互換エンドポイントに接続する **Amazon Bedrock Mantle** プロバイダーが同梱されています。Mantle は、Bedrock インフラストラクチャを基盤とする標準の `/v1/chat/completions` インターフェースを通じて、オープンソースおよびサードパーティのモデル（GPT-OSS、Qwen、Kimi、GLM など）をホストします。また、Mantle は Anthropic Messages ルートを通じて Anthropic Claude モデルも公開します。

| プロパティ     | 値                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| プロバイダー ID | `amazon-bedrock-mantle`                                                                               |
| API            | 検出された OSS モデルには `openai-completions`、Claude モデルには `anthropic-messages`                |
| 認証           | 明示的な `AWS_BEARER_TOKEN_BEDROCK`、または IAM 認証情報チェーンによるベアラートークン生成             |
| デフォルトリージョン | `us-east-1`（`AWS_REGION` または `AWS_DEFAULT_REGION` で上書き可能）                             |

## はじめに

使用する認証方式を選択し、セットアップ手順に従ってください。

<Tabs>
  <Tab title="明示的なベアラートークン">
    **最適な用途:** Mantle ベアラートークンをすでに所持している環境。

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

        検出されたモデルは `amazon-bedrock-mantle` プロバイダーの下に表示されます。デフォルトを上書きする場合を除き、追加の設定は必要ありません。
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM 認証情報">
    **最適な用途:** AWS SDK 互換の認証情報（共有設定、SSO、ウェブアイデンティティ、インスタンスロールまたはタスクロール）を使用する場合。

    <Steps>
      <Step title="Gateway ホストで AWS 認証情報を設定する">
        AWS SDK 互換の任意の認証ソースを使用できます。

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="モデルが検出されることを確認する">
        ```bash
        openclaw models list
        ```

        OpenClaw は、認証情報チェーンから Mantle ベアラートークンを自動的に生成します。
      </Step>
    </Steps>

    <Tip>
    `AWS_BEARER_TOKEN_BEDROCK` が設定されていない場合、OpenClaw は共有認証情報および設定プロファイル、SSO、ウェブアイデンティティ、インスタンスロールまたはタスクロールを含む AWS のデフォルト認証情報チェーンからベアラートークンを生成します。
    </Tip>

  </Tab>
</Tabs>

## モデルの自動検出

`AWS_BEARER_TOKEN_BEDROCK` が設定されている場合、OpenClaw はそれを直接使用します。それ以外の場合、OpenClaw は AWS のデフォルト認証情報チェーンから Mantle ベアラートークンの生成を試みます。その後、リージョンの `/v1/models` エンドポイントに問い合わせて、利用可能な Mantle モデルを検出します。

| 動作                | 詳細                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| 検出キャッシュ      | 結果はリージョンごとに 1 時間キャッシュされます。取得に失敗した場合は最後にキャッシュされた結果を返します |
| IAM トークン更新    | 2 時間ごと。リージョン単位でキャッシュされます                                                   |

Mantle Plugin を有効なまま維持しつつ、自動検出と IAM ベアラートークン生成を抑制するには、Plugin が所有する検出トグルを無効にします。

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
ベアラートークンは、標準の [Amazon Bedrock](/ja-JP/providers/bedrock) プロバイダーで使用される `AWS_BEARER_TOKEN_BEDROCK` と同じものです。
</Note>

### 対応リージョン

`us-east-1`、`us-east-2`、`us-west-2`、`ap-northeast-1`、
`ap-south-1`、`ap-southeast-3`、`eu-central-1`、`eu-west-1`、`eu-west-2`、
`eu-south-1`、`eu-north-1`、`sa-east-1`。

## 手動設定

自動検出ではなく明示的な設定を使用する場合は、次のようにします。

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

明示的な空でない `models` リストが優先され、以下の Claude の行を含む検出済みのすべての行を置き換えます。Mantle の自動カタログを維持するには `models` を省略するか、使用する Claude モデルのエントリをすべて含めてください。

## 高度な設定

<AccordionGroup>
  <Accordion title="推論のサポート">
    推論のサポートは、`thinking`、`reasoner`、`reasoning`、`deepseek.r`、`gpt-oss-120b`、`gpt-oss-safeguard-120b` などのパターンを含むモデル ID から推測されます。OpenClaw は、検出時に一致するモデルへ `reasoning: true` を自動的に設定します。
  </Accordion>

  <Accordion title="エンドポイントを利用できない場合">
    Mantle エンドポイントを利用できない場合、モデルが返されない場合、またはベアラートークンの解決に失敗した場合、検出は空の結果を返し、暗黙的なプロバイダーはスキップされます。OpenClaw はエラーを発生させず、設定済みの他のプロバイダーは通常どおり動作し続けます。
  </Accordion>

  <Accordion title="Anthropic Messages ルート経由の Claude">
    自動検出がモデルリストを管理している場合、OpenClaw は `/v1/models` の戻り値にかかわらず、検索の成功後に 4 つの Claude モデルを追加します。`amazon-bedrock-mantle/anthropic.claude-sonnet-5`（Claude Sonnet 5）、`amazon-bedrock-mantle/anthropic.claude-opus-4-7`（Claude Opus 4.7）、`amazon-bedrock-mantle/anthropic.claude-mythos-5`（Claude Mythos 5）、および `amazon-bedrock-mantle/anthropic.claude-mythos-preview`（Claude Mythos Preview）です。これらは `anthropic-messages` API インターフェースを使用し、同じベアラー認証済みの Anthropic 互換エンドポイント（`<mantle-base>/anthropic`）を通じてストリーミングするため、AWS ベアラートークンは Anthropic API キーとして扱われません。

    Claude Sonnet 5 は常に適応型思考を使用し、デフォルトのエフォートは `high` です。Mantle ルートでは思考を無効化できないため、`/think off` と `/think minimal` は `low` にマッピングされます。また、OpenClaw は Sonnet 5 のリクエストでカスタム温度を省略します。

    Claude Mythos 5 はアクセスが制限されています。1,000,000 トークンのコンテキストウィンドウと 128,000 トークンの出力上限を公開し、常に適応型思考を使用します。`/think off` と `/think minimal` は `low` にマッピングされ、呼び出し元が選択したサンプリングパラメーターは省略されます。

    Claude Mythos Preview は常に推論を要求し、`/think` レベルが設定されていない場合のデフォルトのエフォートは `high` です（`xhigh`/`max` は `high` に下げられ、`minimal` は `low` に上げられます）。Mantle 上の Opus 4.7 はモデル提供の推論なしでストリーミングされます。また、Opus 4.7 はこのルートでサンプリングの上書きを受け付けないため、OpenClaw はその `temperature` パラメーターを省略します。一方、Mythos Preview は通常どおり `temperature` の上書きを受け付けます。

    空でない明示的な `models.providers["amazon-bedrock-mantle"].models` リストは、検出されたカタログ全体を置き換えます。これらの組み込み Claude 行を使用する場合は、そのリストを省略してください。

  </Accordion>

  <Accordion title="Amazon Bedrock プロバイダーとの関係">
    Bedrock Mantle は、標準の [Amazon Bedrock](/ja-JP/providers/bedrock) プロバイダーとは別のプロバイダーです。Mantle は OSS カタログに OpenAI 互換の `/v1` インターフェースを使用しますが、標準の Bedrock プロバイダーはネイティブの Bedrock Converse API を使用します。

    `AWS_BEARER_TOKEN_BEDROCK` が存在する場合、両方のプロバイダーが同じ認証情報を共有します。

  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/ja-JP/providers/bedrock" icon="cloud">
    Anthropic Claude、Titan、およびその他のモデル向けのネイティブ Bedrock プロバイダー。
  </Card>
  <Card title="モデルの選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="OAuth と認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と認証情報の再利用ルール。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的な問題とその解決方法。
  </Card>
</CardGroup>

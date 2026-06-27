---
read_when:
    - OpenClaw で Amazon Bedrock モデルを使用したい
    - モデル呼び出しには AWS 認証情報/リージョンの設定が必要です
summary: OpenClaw で Amazon Bedrock (Converse API) モデルを使用する
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-06-27T12:40:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3947ad565f3a0adcd62d4ce47c6ed760f73c77ba3f4bd43b0754a412511063f2
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw は **Bedrock Converse** ストリーミングプロバイダー経由で **Amazon Bedrock** モデルを使用できます。Bedrock 認証は API キーではなく、**AWS SDK のデフォルト認証情報チェーン**を使用します。

| プロパティ | 値                                                       |
| -------- | ----------------------------------------------------------- |
| プロバイダー | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| 認証     | AWS 認証情報 (環境変数、共有設定、またはインスタンスロール) |
| リージョン   | `AWS_REGION` または `AWS_DEFAULT_REGION` (デフォルト: `us-east-1`) |

## はじめに

希望する認証方法を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="Access keys / env vars">
    **最適な用途:** 開発者マシン、CI、または AWS 認証情報を直接管理するホスト。

    <Steps>
      <Step title="Set AWS credentials on the gateway host">
        ```bash
        export AWS_ACCESS_KEY_ID="EXAMPLE_AWS_ACCESS_KEY_ID"
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Optional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Optional (Bedrock API key/bearer token):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Add a Bedrock provider and model to your config">
        `apiKey` は不要です。プロバイダーを `auth: "aws-sdk"` で設定します。

        ```json5
        {
          models: {
            providers: {
              "amazon-bedrock": {
                baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
                api: "bedrock-converse-stream",
                auth: "aws-sdk",
                models: [
                  {
                    id: "us.anthropic.claude-opus-4-6-v1:0",
                    name: "Claude Opus 4.6 (Bedrock)",
                    reasoning: true,
                    input: ["text", "image"],
                    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                    contextWindow: 200000,
                    maxTokens: 8192,
                  },
                ],
              },
            },
          },
          agents: {
            defaults: {
              model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1:0" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    環境マーカー認証 (`AWS_ACCESS_KEY_ID`、`AWS_PROFILE`、または `AWS_BEARER_TOKEN_BEDROCK`) では、OpenClaw は追加設定なしで、モデル検出用の暗黙的な Bedrock プロバイダーを自動的に有効化します。
    </Tip>

  </Tab>

  <Tab title="EC2 instance roles (IMDS)">
    **最適な用途:** IAM ロールがアタッチされた EC2 インスタンスで、認証にインスタンスメタデータサービスを使用する場合。

    <Steps>
      <Step title="Enable discovery explicitly">
        IMDS を使用する場合、OpenClaw は環境マーカーだけでは AWS 認証を検出できないため、明示的にオプトインする必要があります。

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Optionally add an env marker for auto mode">
        環境マーカーによる自動検出パスも動作させたい場合 (たとえば `openclaw status` サーフェス用):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        偽の API キーは**不要**です。
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    EC2 インスタンスにアタッチされた IAM ロールには、次の権限が必要です。

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (自動検出用)
    - `bedrock:ListInferenceProfiles` (推論プロファイル検出用)

    または、管理ポリシー `AmazonBedrockFullAccess` をアタッチします。
    </Warning>

    <Note>
    `AWS_PROFILE=default` が必要なのは、自動モードまたはステータスサーフェス用に環境マーカーを明示的に使いたい場合だけです。実際の Bedrock ランタイム認証パスは AWS SDK のデフォルトチェーンを使用するため、環境マーカーがなくても IMDS インスタンスロール認証は動作します。
    </Note>

  </Tab>
</Tabs>

## 自動モデル検出

OpenClaw は、**ストリーミング**と**テキスト出力**をサポートする Bedrock モデルを自動的に検出できます。検出には `bedrock:ListFoundationModels` と `bedrock:ListInferenceProfiles` を使用し、結果はキャッシュされます (デフォルト: 1 時間)。

暗黙的なプロバイダーが有効化される仕組み:

- `plugins.entries.amazon-bedrock.config.discovery.enabled` が `true` の場合、AWS 環境マーカーが存在しなくても OpenClaw は検出を試みます。
- `plugins.entries.amazon-bedrock.config.discovery.enabled` が未設定の場合、OpenClaw は次の AWS 認証マーカーのいずれかを検出したときにのみ、暗黙的な Bedrock プロバイダーを自動追加します: `AWS_BEARER_TOKEN_BEDROCK`、`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`、または `AWS_PROFILE`。
- 実際の Bedrock ランタイム認証パスは引き続き AWS SDK のデフォルトチェーンを使用するため、共有設定、SSO、IMDS インスタンスロール認証は、検出のオプトインに `enabled: true` が必要だった場合でも動作できます。

<Note>
明示的な `models.providers["amazon-bedrock"]` エントリでは、OpenClaw は完全なランタイム認証の読み込みを強制せずに、`AWS_BEARER_TOKEN_BEDROCK` などの AWS 環境マーカーから Bedrock 環境マーカー認証を早期に解決できます。実際のモデル呼び出し認証パスは引き続き AWS SDK のデフォルトチェーンを使用します。
</Note>

<AccordionGroup>
  <Accordion title="Discovery config options">
    設定オプションは `plugins.entries.amazon-bedrock.config.discovery` 配下にあります。

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              discovery: {
                enabled: true,
                region: "us-east-1",
                providerFilter: ["anthropic", "amazon"],
                refreshInterval: 3600,
                defaultContextWindow: 32000,
                defaultMaxTokens: 4096,
              },
            },
          },
        },
      },
    }
    ```

    | オプション | デフォルト | 説明 |
    | ------ | ------- | ----------- |
    | `enabled` | auto | 自動モードでは、OpenClaw はサポート対象の AWS 環境マーカーを検出した場合にのみ、暗黙的な Bedrock プロバイダーを有効化します。検出を強制するには `true` に設定します。 |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | 検出 API 呼び出しに使用する AWS リージョン。 |
    | `providerFilter` | (すべて) | Bedrock プロバイダー名に一致します (例: `anthropic`、`amazon`)。 |
    | `refreshInterval` | `3600` | キャッシュ期間 (秒)。キャッシュを無効化するには `0` に設定します。 |
    | `defaultContextWindow` | `32000` | 検出されたモデルに使用するコンテキストウィンドウ (モデルの制限を把握している場合は上書きしてください)。 |
    | `defaultMaxTokens` | `4096` | 検出されたモデルに使用する最大出力トークン数 (モデルの制限を把握している場合は上書きしてください)。 |

  </Accordion>
</AccordionGroup>

## クイックセットアップ (AWS パス)

この手順では、IAM ロールを作成し、Bedrock 権限をアタッチし、インスタンスプロファイルを関連付け、EC2 ホストで OpenClaw 検出を有効化します。

```bash
# 1. Create IAM role and instance profile
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam create-instance-profile --instance-profile-name EC2-Bedrock-Access
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-Bedrock-Access \
  --role-name EC2-Bedrock-Access

# 2. Attach to your EC2 instance
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. On the EC2 instance, enable discovery explicitly
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Optional: add an env marker if you want auto mode without explicit enable
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Verify models are discovered
openclaw models list
```

## 高度な設定

<AccordionGroup>
  <Accordion title="Inference profiles">
    OpenClaw は、基盤モデルとあわせて**リージョナルおよびグローバル推論プロファイル**を検出します。プロファイルが既知の基盤モデルにマップされる場合、そのプロファイルはモデルの機能 (コンテキストウィンドウ、最大トークン数、推論、ビジョン) を継承し、正しい Bedrock リクエストリージョンが自動的に注入されます。つまり、クロスリージョンの Claude プロファイルは手動のプロバイダー上書きなしで動作します。

    推論プロファイル ID は、`us.anthropic.claude-opus-4-6-v1:0` (リージョナル) または `anthropic.claude-opus-4-6-v1:0` (グローバル) のような形式です。基盤となるモデルがすでに検出結果に含まれている場合、プロファイルはその完全な機能セットを継承します。それ以外の場合は安全なデフォルトが適用されます。

    追加設定は不要です。検出が有効で、IAM プリンシパルに `bedrock:ListInferenceProfiles` があれば、プロファイルは `openclaw models list` で基盤モデルと並んで表示されます。

  </Accordion>

  <Accordion title="Service tier">
    一部の Bedrock モデルは、コストまたはレイテンシーの最適化のために `service_tier` パラメーターをサポートしています。次のティアを利用できます。

    | ティア | 説明 |
    |------|-------------|
    | `default` | 標準の Bedrock ティア |
    | `flex` | 長いレイテンシーを許容できるワークロード向けの割引処理 |
    | `priority` | レイテンシーに敏感なワークロード向けの優先処理 |
    | `reserved` | 定常ワークロード向けの予約容量 |

    Bedrock モデルリクエストでは、`agents.defaults.params` 経由で、または `agents.defaults.models["<model-key>"].params` のモデル単位で `serviceTier` (または `service_tier`) を設定します。

    ```json5
    {
      agents: {
        defaults: {
          params: {
            serviceTier: "flex", // applies to all models
          },
          models: {
            "amazon-bedrock/mistral.mistral-large-3-675b-instruct": {
              params: {
                serviceTier: "priority", // per-model override
              },
            },
          },
        },
      },
    }
    ```

    有効な値は `default`、`flex`、`priority`、`reserved` です。すべてのモデルがすべてのティアをサポートしているわけではありません。サポートされていないティアを要求すると、Bedrock は検証エラーを返します。注: エラーメッセージはやや誤解を招く場合があり、サポートされていないサービスティアを示すのではなく、「The provided model identifier is invalid」と表示されることがあります。このエラーが表示された場合は、モデルが要求したティアをサポートしているか確認してください。

  </Accordion>

  <Accordion title="Claude Opus 4.7 temperature">
    Bedrock は Claude Opus 4.7 に対して `temperature` パラメーターを拒否します。OpenClaw は、基盤モデル ID、名前付き推論プロファイル、基盤モデルが `bedrock:GetInferenceProfile` 経由で Opus 4.7 に解決されるアプリケーション推論プロファイル、任意のリージョンプレフィックス (`us.`、`eu.`、`ap.`、`apac.`、`au.`、`jp.`、`global.`) を持つドット区切りの `opus-4.7` バリアントを含む、すべての Opus 4.7 Bedrock 参照に対して `temperature` を自動的に省略します。設定ノブは不要で、この省略はリクエストオプションオブジェクトと `inferenceConfig` ペイロードフィールドの両方に適用されます。
  </Accordion>

  <Accordion title="Claude Fable 5">
    `us-east-1` では `amazon-bedrock/anthropic.claude-fable-5` を使用するか、
    `us.anthropic.claude-fable-5` などのリージョン別推論 ID を使用します。
    OpenClaw は Fable の 1M コンテキストウィンドウ、128K 出力上限、常時有効の
    adaptive thinking、サポートされる effort マッピングを適用します。`/think off` と
    `/think minimal` は `low` にマップされます。サポートされていない temperature と強制ツール
    選択コントロールは省略されます。Bedrock が終端ステータスを返すまでストリーミング出力は保持されるため、
    ストリーム途中の拒否で部分テキストが露出することはありません。
    Fable は標準サービスティアのみをサポートします。このモデルでは、OpenClaw は設定済みの
    `flex`、`priority`、`reserved` ティアを無視します。

    AWS では、Fable を利用可能にする前に、データ保持に関する明示的な
    `provider_data_share` オプトインが必要です。プロンプトと補完は Anthropic と共有され、
    信頼性と安全性のために最大 30 日間保持されます。モデルを有効にする前に
    [Bedrock のデータ保持](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    を確認して設定してください。

  </Accordion>

  <Accordion title="ガードレール">
    `amazon-bedrock` Plugin 設定に `guardrail` オブジェクトを追加することで、
    すべての Bedrock モデル呼び出しに [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    を適用できます。Guardrails により、コンテンツフィルタリング、トピック拒否、単語フィルター、
    機密情報フィルター、コンテキストに基づくグラウンディングチェックを適用できます。

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // guardrail ID or full ARN
                guardrailVersion: "1", // version number or "DRAFT"
                streamProcessingMode: "sync", // optional: "sync" or "async"
                trace: "enabled", // optional: "enabled", "disabled", or "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    | オプション | 必須 | 説明 |
    | ------ | -------- | ----------- |
    | `guardrailIdentifier` | はい | ガードレール ID（例: `abc123`）または完全な ARN（例: `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`）。 |
    | `guardrailVersion` | はい | 公開済みバージョン番号、または作業中ドラフトの場合は `"DRAFT"`。 |
    | `streamProcessingMode` | いいえ | ストリーミング中のガードレール評価に使う `"sync"` または `"async"`。省略した場合、Bedrock はデフォルトを使用します。 |
    | `trace` | いいえ | デバッグには `"enabled"` または `"enabled_full"`。本番環境では省略するか `"disabled"` を設定します。 |

    <Warning>
    Gateway で使用される IAM プリンシパルには、標準の呼び出し権限に加えて `bedrock:ApplyGuardrail` 権限が必要です。
    </Warning>

  </Accordion>

  <Accordion title="メモリ検索用の埋め込み">
    Bedrock は
    [メモリ検索](/ja-JP/concepts/memory-search) 用の埋め込みプロバイダーとしても機能できます。これは推論プロバイダーとは別に設定します。
    `agents.defaults.memorySearch.provider` を `"bedrock"` に設定してください。

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // default
          },
        },
      },
    }
    ```

    Bedrock の埋め込みは、推論と同じ AWS SDK 認証情報チェーン（インスタンスロール、
    SSO、アクセスキー、共有設定、Web ID）を使用します。API キーは不要です。
    Bedrock 埋め込みを使用するには、`memorySearch.provider: "bedrock"` を明示的に設定します。

    サポートされる埋め込みモデルには、Amazon Titan Embed（v1、v2）、Amazon Nova
    Embed、Cohere Embed（v3、v4）、TwelveLabs Marengo が含まれます。完全なモデル一覧と
    次元オプションについては
    [メモリ設定リファレンス -- Bedrock](/ja-JP/reference/memory-config#bedrock-embedding-config)
    を参照してください。

  </Accordion>

  <Accordion title="メモと注意点">
    - Bedrock では、AWS アカウント/リージョンで **モデルアクセス** を有効にする必要があります。
    - 自動検出には `bedrock:ListFoundationModels` と
      `bedrock:ListInferenceProfiles` 権限が必要です。
    - 自動モードに依存する場合は、Gateway ホストでサポートされている AWS 認証環境マーカーのいずれかを設定します。環境マーカーなしで IMDS/共有設定認証を使いたい場合は、
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true` を設定します。
    - OpenClaw は認証情報ソースを次の順序で表示します: `AWS_BEARER_TOKEN_BEDROCK`、
      次に `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`、次に `AWS_PROFILE`、次に
      デフォルトの AWS SDK チェーン。
    - 推論サポートはモデルによって異なります。現在の機能については Bedrock モデルカードを確認してください。
    - マネージドキーのフローを希望する場合は、Bedrock の前段に OpenAI 互換プロキシを配置し、
      代わりに OpenAI プロバイダーとして設定することもできます。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="メモリ検索" href="/ja-JP/concepts/memory-search" icon="magnifying-glass">
    メモリ検索設定用の Bedrock 埋め込み。
  </Card>
  <Card title="メモリ設定リファレンス" href="/ja-JP/reference/memory-config#bedrock-embedding-config" icon="database">
    Bedrock 埋め込みモデルの完全な一覧と次元オプション。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的なトラブルシューティングと FAQ。
  </Card>
</CardGroup>

---
read_when:
    - OpenClaw で Amazon Bedrock モデルを使用する場合
    - モデル呼び出しには、AWS の認証情報とリージョンの設定が必要です
summary: OpenClaw で Amazon Bedrock（Converse API）モデルを使用する
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-07-11T22:36:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fda4f5ab8ffcd68012cf78fbedb9fabec36d9742f16518ea4dd38418b2220b7b
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw は、**Bedrock Converse** ストリーミングプロバイダーを介して **Amazon Bedrock** モデルを使用できます。Bedrock の認証では API キーではなく、**AWS SDK のデフォルト認証情報チェーン**を使用します。

| プロパティ | 値                                                          |
| ---------- | ----------------------------------------------------------- |
| プロバイダー | `amazon-bedrock`                                            |
| API        | `bedrock-converse-stream`                                   |
| 認証       | AWS 認証情報（環境変数、共有設定、またはインスタンスロール） |
| リージョン | `AWS_REGION` または `AWS_DEFAULT_REGION`（デフォルト: `us-east-1`） |

## はじめに

希望する認証方法を選択し、セットアップ手順に従ってください。

<Tabs>
  <Tab title="アクセスキー / 環境変数">
    **最適な用途:** AWS 認証情報を直接管理する開発者マシン、CI、またはホスト。

    <Steps>
      <Step title="Gateway ホストに AWS 認証情報を設定する">
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
      <Step title="設定に Bedrock プロバイダーとモデルを追加する">
        `apiKey` は必要ありません。`auth: "aws-sdk"` を使用してプロバイダーを設定します。

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
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    環境変数マーカー認証（`AWS_ACCESS_KEY_ID`、`AWS_PROFILE`、または `AWS_BEARER_TOKEN_BEDROCK`）を使用すると、OpenClaw は追加設定なしでモデル検出用の暗黙的な Bedrock プロバイダーを自動的に有効化します。
    </Tip>

  </Tab>

  <Tab title="EC2 インスタンスロール（IMDS）">
    **最適な用途:** IAM ロールがアタッチされ、認証にインスタンスメタデータサービスを使用する EC2 インスタンス。

    <Steps>
      <Step title="検出を明示的に有効化する">
        IMDS を使用する場合、OpenClaw は環境変数マーカーだけでは AWS 認証を検出できないため、明示的に有効化する必要があります。

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="必要に応じて自動モード用の環境変数マーカーを追加する">
        環境変数マーカーによる自動検出パスも機能させる場合（たとえば、`openclaw status` の表示面で使用する場合）は、次のように設定します。

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        偽の API キーは**必要ありません**。
      </Step>
      <Step title="モデルが検出されることを確認する">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    EC2 インスタンスにアタッチされた IAM ロールには、次の権限が必要です。

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels`（自動検出用）
    - `bedrock:ListInferenceProfiles`（推論プロファイル検出用）

    または、マネージドポリシー `AmazonBedrockFullAccess` をアタッチしてください。
    </Warning>

    <Note>
    `AWS_PROFILE=default` が必要なのは、自動モードまたはステータス表示面で使用する環境変数マーカーが特に必要な場合だけです。実際の Bedrock ランタイム認証パスでは AWS SDK のデフォルトチェーンを使用するため、環境変数マーカーがなくても IMDS インスタンスロール認証は機能します。
    </Note>

  </Tab>
</Tabs>

## モデルの自動検出

OpenClaw は、**ストリーミング**と**テキスト出力**をサポートする Bedrock モデルを自動的に検出できます。検出には `bedrock:ListFoundationModels` と `bedrock:ListInferenceProfiles` を使用し、結果はキャッシュされます（デフォルト: 1 時間）。

暗黙的なプロバイダーが有効化される仕組みは次のとおりです。

- `plugins.entries.amazon-bedrock.config.discovery.enabled` が `true` の場合、
  AWS 環境変数マーカーがなくても OpenClaw は検出を試みます。
- `plugins.entries.amazon-bedrock.config.discovery.enabled` が未設定の場合、
  OpenClaw は次のいずれかの AWS 認証マーカーを検出したときにのみ、
  暗黙的な Bedrock プロバイダーを自動追加します。
  `AWS_BEARER_TOKEN_BEDROCK`、`AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY`、または `AWS_PROFILE`。
- 実際の Bedrock ランタイム認証パスでは引き続き AWS SDK のデフォルトチェーンを使用するため、
  検出を明示的に有効化するために `enabled: true` が必要だった場合でも、
  共有設定、SSO、IMDS インスタンスロール認証は機能します。

<Note>
明示的な `models.providers["amazon-bedrock"]` エントリでは、OpenClaw はランタイム認証全体の読み込みを強制することなく、`AWS_BEARER_TOKEN_BEDROCK` などの AWS 環境変数マーカーから Bedrock の環境変数マーカー認証を早期に解決できます。実際のモデル呼び出しの認証パスでは、引き続き AWS SDK のデフォルトチェーンを使用します。
</Note>

<AccordionGroup>
  <Accordion title="検出設定オプション">
    設定オプションは `plugins.entries.amazon-bedrock.config.discovery` 以下にあります。

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
    | ---------- | ---------- | ---- |
    | `enabled` | 自動 | 自動モードでは、OpenClaw はサポート対象の AWS 環境変数マーカーを検出した場合にのみ暗黙的な Bedrock プロバイダーを有効化します。検出を強制するには `true` に設定します。 |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | 検出 API 呼び出しに使用する AWS リージョン。 |
    | `providerFilter` | （すべて） | Bedrock プロバイダー名（例: `anthropic`、`amazon`）に一致させます。 |
    | `refreshInterval` | `3600` | キャッシュ期間（秒）。キャッシュを無効化するには `0` に設定します。 |
    | `defaultContextWindow` | `32000` | 既知のトークン制限がない検出済みモデルに使用するコンテキストウィンドウ（モデルの制限が分かっている場合は上書きしてください）。 |
    | `defaultMaxTokens` | `4096` | 既知のトークン制限がない検出済みモデルに使用する最大出力トークン数（モデルの制限が分かっている場合は上書きしてください）。 |

  </Accordion>

  <Accordion title="コンテキストウィンドウと最大トークン数の制限">
    Bedrock の `ListFoundationModels` API と `GetFoundationModel` API は、
    トークン制限のメタデータを返さず、モデル ID、名前、モダリティ、ライフサイクル状態だけを返します。
    OpenClaw には、一般的な Bedrock モデル（Claude、Nova、Llama、Mistral、DeepSeek など）の
    既知のコンテキストウィンドウと出力制限のルックアップテーブルが同梱されているため、
    これらのモデルではセッション管理、Compaction のしきい値、
    コンテキストオーバーフローの検出が正しく機能します。

    テーブルにない検出済みモデルでは、`defaultContextWindow`
    と `defaultMaxTokens` がフォールバックとして使用されます。使用するモデルに正確な制限値がない場合は、
    明示的な `models.providers["amazon-bedrock"].models` エントリで上書きしてください。

  </Accordion>
</AccordionGroup>

## クイックセットアップ（AWS の手順）

この手順では、IAM ロールを作成し、Bedrock 権限をアタッチし、
インスタンスプロファイルを関連付け、EC2 ホスト上で OpenClaw の検出を有効化します。

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
  <Accordion title="推論プロファイル">
    OpenClaw は基盤モデルとともに、**リージョン推論プロファイルとグローバル推論プロファイル**を検出します。
    プロファイルが既知の基盤モデルにマッピングされている場合、
    そのプロファイルはモデルの機能（コンテキストウィンドウ、最大トークン数、
    推論、ビジョン）を継承し、正しい Bedrock リクエストリージョンが
    自動的に注入されます。これにより、リージョンをまたぐ Claude プロファイルを、
    プロバイダーを手動で上書きせずに使用できます。グローバルなクロスリージョンプロファイル（`global.*`）は、
    一般に優れた処理容量と自動フェイルオーバーを提供するため、
    `openclaw models list` では最初に表示されます。

    推論プロファイル ID は、リージョンの場合は `us.anthropic.claude-opus-4-6-v1:0`、
    グローバルの場合は `anthropic.claude-opus-4-6-v1:0` のような形式です。
    基になるモデルがすでに検出結果に含まれている場合、プロファイルはそのモデルのすべての機能を継承します。
    それ以外の場合は、安全なデフォルト値が適用されます。

    追加の設定は必要ありません。検出が有効で、IAM プリンシパルに
    `bedrock:ListInferenceProfiles` 権限があれば、プロファイルは
    `openclaw models list` で基盤モデルとともに表示されます。

  </Accordion>

  <Accordion title="サービス階層">
    一部の Bedrock モデルは、コストまたはレイテンシーを最適化するための
    `service_tier` パラメーターをサポートしています。次の階層を使用できます。

    | 階層 | 説明 |
    |------|------|
    | `default` | 標準の Bedrock 階層 |
    | `flex` | 長いレイテンシーを許容できるワークロード向けの割引処理 |
    | `priority` | レイテンシーを重視するワークロード向けの優先処理 |
    | `reserved` | 定常的なワークロード向けの予約済み処理容量 |

    Bedrock モデルリクエストに対して、`agents.defaults.params` で
    `serviceTier`（または `service_tier`）を設定するか、
    `agents.defaults.models["<model-key>"].params` でモデルごとに設定します。

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

    有効な値は `default`、`flex`、`priority`、`reserved` です。Claude
    Fable 5 と Sonnet 5 は `default` ティアのみをサポートします。これらのモデルに
    `flex`、`priority`、`reserved` が要求された場合、OpenClaw は警告を表示して
    無視します。その他のモデルでも、すべてのモデルがすべてのティアをサポートする
    わけではありません。サポートされていないティアを指定すると Bedrock の検証エラーが
    返されますが、エラーメッセージは問題の原因がティアであることを示さず、
    たとえば「指定されたモデル識別子は無効です」と表示されるなど、誤解を招く場合が
    あります。このエラーが表示された場合は、モデルが要求したティアをサポートしているか
    確認してください。

  </Accordion>

  <Accordion title="Claude Opus 4.7 and 4.8 temperature">
    Bedrock は Claude Opus 4.7 と Opus 4.8 の `temperature` パラメーターを
    拒否します。OpenClaw は、一致するすべての Bedrock 参照について
    `temperature` を自動的に省略します。これには、基盤モデル ID、名前付き推論
    プロファイル、`bedrock:GetInferenceProfile` によって基盤モデルが Opus
    4.7/4.8 と解決されるアプリケーション推論プロファイル、オプションのリージョン
    プレフィックス（`us.`、`eu.`、`ap.`、`apac.`、`au.`、`jp.`、
    `global.`）が付いたドット区切りの `opus-4.7`/`opus-4.8` バリアントが
    含まれます。設定項目は不要で、この省略はリクエストオプションオブジェクトと
    `inferenceConfig` ペイロードフィールドの両方に適用されます。
  </Accordion>

  <Accordion title="Claude Fable 5">
    `us-east-1` では `amazon-bedrock/anthropic.claude-fable-5` を使用するか、
    `us.anthropic.claude-fable-5` などのリージョン推論 ID を使用します。
    OpenClaw は、Fable の 100 万トークンのコンテキストウィンドウ、128K の出力上限、
    常時有効な適応的思考、およびサポートされているエフォートマッピングを適用します。
    `/think off` と `/think minimal` は `low` にマッピングされます。temperature
    とツール選択の強制制御は、Opus 4.7/4.8 のルートと同様に省略されます。
    ストリーミング出力は、ストリーム途中での拒否によって部分的なテキストが露出しないよう、
    Bedrock が終了ステータスを返すまで保持されます。

    Fable を利用するには、AWS でデータ保持に関する `provider_data_share` への
    明示的なオプトインが必要です。プロンプトと補完結果は Anthropic と共有され、
    信頼性と安全性のために最長 30 日間保持されます。モデルを有効にする前に、
    [Bedrock のデータ保持](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    を確認して設定してください。

  </Accordion>

  <Accordion title="Claude Mythos 5">
    Claude Mythos 5 は、必要な限定アクセス承認を受けたアカウントに限り、
    Bedrock 経由で利用できます。OpenClaw は基盤モデル
    `anthropic.claude-mythos-5` と、`us.anthropic.claude-mythos-5`
    などのリージョンまたはグローバル推論プロファイルを認識します。

    OpenClaw は、1,000,000 トークンのコンテキストウィンドウ、128,000 トークンの
    出力上限、画像入力、プロンプトキャッシュ、拒否時にも安全なストリーミング、
    およびネイティブのエフォートレベルを適用します。適応的思考は常に有効です。
    `/think off` と `/think minimal` は `low` にマッピングされ、
    `xhigh` と `max` も引き続き利用できます。カスタムサンプリング値と
    ツール選択の強制値は省略されます。

  </Accordion>

  <Accordion title="Claude Sonnet 5">
    AWS は Sonnet 5 について、
    [`bedrock-runtime` と `bedrock-mantle` の両エンドポイント](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-5.html)
    を文書化しています。OpenClaw は Bedrock 基盤モデル
    `anthropic.claude-sonnet-5` と、`us.anthropic.claude-sonnet-5`
    などのリージョンまたはグローバル推論プロファイルを認識します。
    1,000,000 トークンのコンテキストウィンドウ、128,000 トークンの出力上限、
    画像入力、ネイティブのエフォートレベル、プロンプトキャッシュ、
    および拒否時にも安全なストリーミングを適用します。

    Bedrock では Sonnet 5 の適応的思考が有効なままになります。OpenClaw の
    デフォルトは `high` です。このルートでは思考を無効にできないため、
    `/think off` と `/think minimal` は `low` にマッピングされます。
    適応的思考が有効な間は、カスタム temperature 値とツール選択の強制値が
    省略されます。

  </Accordion>

  <Accordion title="Guardrails">
    `amazon-bedrock` Plugin の設定に `guardrail` オブジェクトを追加すると、
    すべての Bedrock モデル呼び出しに
    [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    を適用できます。Guardrails を使用すると、コンテンツフィルタリング、
    トピックの拒否、単語フィルター、機密情報フィルター、およびコンテキストに
    基づく根拠確認を実施できます。

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

    `guardrailIdentifier` と `guardrailVersion` は必須です。

    | オプション | 説明 |
    | ------ | ----------- |
    | `guardrailIdentifier` | Guardrail ID（例: `abc123`）または完全な ARN（例: `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`）。 |
    | `guardrailVersion` | 公開済みのバージョン番号、または作業中のドラフトを示す `"DRAFT"`。 |
    | `streamProcessingMode` | ストリーミング中の Guardrail 評価に使用する `"sync"` または `"async"`。省略した場合、Bedrock のデフォルトが使用されます。 |
    | `trace` | デバッグ用の `"enabled"` または `"enabled_full"`。本番環境では省略するか `"disabled"` に設定します。 |

    <Warning>
    Gateway が使用する IAM プリンシパルには、標準の呼び出し権限に加えて `bedrock:ApplyGuardrail` 権限が必要です。
    </Warning>

  </Accordion>

  <Accordion title="Embeddings for memory search">
    Bedrock は、[メモリ検索](/ja-JP/concepts/memory-search)の埋め込みプロバイダーとしても
    使用できます。これは推論プロバイダーとは別に設定します。
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

    Bedrock の埋め込みは、推論と同じ AWS SDK 認証情報チェーン
    （インスタンスロール、SSO、アクセスキー、共有設定、ウェブアイデンティティ）を
    使用します。API キーは不要です。

    サポートされている埋め込みモデルには、Amazon Titan Embed（v1、v2）、
    Amazon Nova Embed、Cohere Embed（v3、v4）、TwelveLabs Marengo が
    含まれます。モデルの完全な一覧と次元オプションについては、
    [メモリ設定リファレンス -- Bedrock](/ja-JP/reference/memory-config#bedrock-embedding-config)
    を参照してください。

  </Accordion>

  <Accordion title="Notes and caveats">
    - Bedrock を使用するには、AWS アカウントおよびリージョンで**モデルアクセス**を有効にする必要があります。
    - 自動検出には `bedrock:ListFoundationModels` 権限と
      `bedrock:ListInferenceProfiles` 権限が必要です。
    - 自動モードを利用する場合は、Gateway ホストでサポートされている AWS 認証環境変数マーカーの
      いずれかを設定してください。環境変数マーカーを使わずに IMDS または共有設定による認証を
      使用する場合は、`plugins.entries.amazon-bedrock.config.discovery.enabled: true`
      を設定してください。
    - OpenClaw は認証情報のソースを次の順序で表示します: `AWS_BEARER_TOKEN_BEDROCK`、
      次に `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`、次に `AWS_PROFILE`、
      最後にデフォルトの AWS SDK チェーン。
    - 推論サポートはモデルによって異なります。現在の機能については Bedrock のモデルカードを
      確認してください。
    - マネージドキーのフローを使用する場合は、Bedrock の前段に OpenAI 互換プロキシを配置し、
      代わりに OpenAI プロバイダーとして設定することもできます。
  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="Memory search" href="/ja-JP/concepts/memory-search" icon="magnifying-glass">
    メモリ検索向け Bedrock 埋め込みの設定。
  </Card>
  <Card title="Memory config reference" href="/ja-JP/reference/memory-config#bedrock-embedding-config" icon="database">
    Bedrock 埋め込みモデルの完全な一覧と次元オプション。
  </Card>
  <Card title="Troubleshooting" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的なトラブルシューティングとよくある質問。
  </Card>
</CardGroup>

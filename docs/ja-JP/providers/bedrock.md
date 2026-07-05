---
read_when:
    - OpenClaw で Amazon Bedrock モデルを使いたい
    - モデル呼び出しには AWS 認証情報/リージョンの設定が必要です
summary: OpenClawでAmazon Bedrock (Converse API)モデルを使用する
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-07-05T11:38:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83b0be40d8c0fd6283c8cd8ce271b9fb2fd0e7402c12f783ead69e1c3779eb8c
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw は、その **Bedrock Converse** ストリーミングプロバイダーを介して **Amazon Bedrock** モデルを使用できます。Bedrock 認証は API キーではなく、**AWS SDK のデフォルト認証情報チェーン**を使用します。

| プロパティ | 値                                                          |
| ---------- | ----------------------------------------------------------- |
| プロバイダー | `amazon-bedrock`                                            |
| API        | `bedrock-converse-stream`                                   |
| 認証       | AWS 認証情報（環境変数、共有設定、またはインスタンスロール） |
| リージョン | `AWS_REGION` または `AWS_DEFAULT_REGION`（デフォルト: `us-east-1`） |

## はじめに

好みの認証方法を選び、セットアップ手順に従います。

<Tabs>
  <Tab title="アクセスキー / 環境変数">
    **最適な用途:** 開発者マシン、CI、または AWS 認証情報を直接管理するホスト。

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
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    環境マーカー認証（`AWS_ACCESS_KEY_ID`、`AWS_PROFILE`、または `AWS_BEARER_TOKEN_BEDROCK`）では、OpenClaw は追加設定なしで、モデル検出用の暗黙的な Bedrock プロバイダーを自動的に有効化します。
    </Tip>

  </Tab>

  <Tab title="EC2 インスタンスロール（IMDS）">
    **最適な用途:** IAM ロールがアタッチされた EC2 インスタンスで、認証にインスタンスメタデータサービスを使用する場合。

    <Steps>
      <Step title="検出を明示的に有効化する">
        IMDS を使用する場合、OpenClaw は環境マーカーだけでは AWS 認証を検出できないため、オプトインする必要があります。

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="必要に応じて自動モード用の環境マーカーを追加する">
        環境マーカーの自動検出パスも動作させたい場合（たとえば `openclaw status` の表示面向け）:

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        偽の API キーは**不要**です。
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

    または、管理ポリシー `AmazonBedrockFullAccess` をアタッチします。
    </Warning>

    <Note>
    `AWS_PROFILE=default` が必要なのは、自動モードまたはステータス表示面向けの環境マーカーが特に必要な場合だけです。実際の Bedrock ランタイム認証パスは AWS SDK のデフォルトチェーンを使用するため、環境マーカーがなくても IMDS インスタンスロール認証は動作します。
    </Note>

  </Tab>
</Tabs>

## モデルの自動検出

OpenClaw は、**ストリーミング**と**テキスト出力**をサポートする Bedrock モデルを自動的に検出できます。検出には `bedrock:ListFoundationModels` と `bedrock:ListInferenceProfiles` が使用され、結果はキャッシュされます（デフォルト: 1 時間）。

暗黙的なプロバイダーが有効化される仕組み:

- `plugins.entries.amazon-bedrock.config.discovery.enabled` が `true` の場合、AWS 環境マーカーが存在しなくても OpenClaw は検出を試みます。
- `plugins.entries.amazon-bedrock.config.discovery.enabled` が未設定の場合、OpenClaw は次の AWS 認証マーカーのいずれかを確認したときにのみ、暗黙的な Bedrock プロバイダーを自動追加します: `AWS_BEARER_TOKEN_BEDROCK`、`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`、または `AWS_PROFILE`。
- 実際の Bedrock ランタイム認証パスは引き続き AWS SDK のデフォルトチェーンを使用するため、検出にオプトインするため `enabled: true` が必要だった場合でも、共有設定、SSO、IMDS インスタンスロール認証は動作できます。

<Note>
明示的な `models.providers["amazon-bedrock"]` エントリでは、OpenClaw は完全なランタイム認証読み込みを強制せずに、`AWS_BEARER_TOKEN_BEDROCK` などの AWS 環境マーカーから Bedrock 環境マーカー認証を早期に解決できます。実際のモデル呼び出し認証パスは引き続き AWS SDK のデフォルトチェーンを使用します。
</Note>

<AccordionGroup>
  <Accordion title="検出設定オプション">
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
    | ---------- | ---------- | ---- |
    | `enabled` | auto | 自動モードでは、OpenClaw はサポートされる AWS 環境マーカーを確認したときにのみ、暗黙的な Bedrock プロバイダーを有効化します。検出を強制するには `true` を設定します。 |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | 検出 API 呼び出しに使用される AWS リージョン。 |
    | `providerFilter` | （すべて） | Bedrock プロバイダー名に一致します（例: `anthropic`、`amazon`）。 |
    | `refreshInterval` | `3600` | キャッシュ期間（秒）。キャッシュを無効にするには `0` を設定します。 |
    | `defaultContextWindow` | `32000` | 既知のトークン制限がない検出済みモデルに使用されるコンテキストウィンドウ（モデルの制限を把握している場合は上書きしてください）。 |
    | `defaultMaxTokens` | `4096` | 既知のトークン制限がない検出済みモデルに使用される最大出力トークン数（モデルの制限を把握している場合は上書きしてください）。 |

  </Accordion>

  <Accordion title="コンテキストウィンドウと最大トークン制限">
    Bedrock の `ListFoundationModels` および `GetFoundationModel` API は、トークン制限のメタデータを返さず、モデル ID、名前、モダリティ、ライフサイクルステータスのみを返します。OpenClaw は、人気の Bedrock モデル（Claude、Nova、Llama、Mistral、DeepSeek など）の既知のコンテキストウィンドウと出力制限のルックアップテーブルを同梱しているため、それらのモデルではセッション管理、Compaction しきい値、コンテキストオーバーフロー検出が正しく動作します。

    テーブルにない検出済みモデルは、`defaultContextWindow` と `defaultMaxTokens` にフォールバックします。使用しているモデルに正確な制限がない場合は、明示的な `models.providers["amazon-bedrock"].models` エントリで上書きしてください。

  </Accordion>
</AccordionGroup>

## クイックセットアップ（AWS パス）

この手順では、IAM ロールを作成し、Bedrock 権限をアタッチし、インスタンスプロファイルを関連付け、EC2 ホスト上で OpenClaw の検出を有効化します。

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
    OpenClaw は、基盤モデルと並行して**リージョン推論プロファイルとグローバル推論プロファイル**を検出します。プロファイルが既知の基盤モデルにマッピングされる場合、プロファイルはそのモデルの機能（コンテキストウィンドウ、最大トークン数、推論、ビジョン）を継承し、正しい Bedrock リクエストリージョンが自動的に注入されます。つまり、クロスリージョン Claude プロファイルは、手動のプロバイダー上書きなしで動作します。グローバルなクロスリージョンプロファイル（`global.*`）は、一般的により優れた容量と自動フェイルオーバーを提供するため、`openclaw models list` では先頭に表示されます。

    推論プロファイル ID は、`us.anthropic.claude-opus-4-6-v1:0`（リージョン）または `anthropic.claude-opus-4-6-v1:0`（グローバル）のような形式です。基盤となるモデルがすでに検出結果に含まれている場合、プロファイルはその完全な機能セットを継承します。それ以外の場合は安全なデフォルトが適用されます。

    追加の設定は不要です。検出が有効で、IAM プリンシパルに `bedrock:ListInferenceProfiles` がある限り、プロファイルは `openclaw models list` で基盤モデルと並んで表示されます。

  </Accordion>

  <Accordion title="サービス階層">
    一部の Bedrock モデルは、コストまたはレイテンシーを最適化するための `service_tier` パラメーターをサポートしています。次の階層を利用できます。

    | 階層 | 説明 |
    |------|------|
    | `default` | 標準の Bedrock 階層 |
    | `flex` | より長いレイテンシーを許容できるワークロード向けの割引処理 |
    | `priority` | レイテンシーに敏感なワークロード向けの優先処理 |
    | `reserved` | 定常的なワークロード向けの予約容量 |

    Bedrock モデルリクエスト向けに、`agents.defaults.params` 経由で `serviceTier`（または `service_tier`）を設定するか、`agents.defaults.models["<model-key>"].params` でモデルごとに設定します。

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
    Fable 5 は `default` ティアのみをサポートします。OpenClaw は、そのモデルに対して要求された
    `flex`、`priority`、`reserved` を警告して無視します。他の
    モデルでは、すべてのモデルがすべてのティアをサポートするわけではありません。サポートされていないティアは
    Bedrock の検証エラーを返し、エラーメッセージが
    誤解を招く場合があります（たとえば、問題としてティア名を示すのではなく "The provided model identifier is invalid"
    と表示されるなど）。このエラーが表示された場合は、
    そのモデルが要求されたティアをサポートしているか確認してください。

  </Accordion>

  <Accordion title="Claude Opus 4.7 と 4.8 の temperature">
    Bedrock は Claude Opus 4.7 と Opus
    4.8 の `temperature` パラメーターを拒否します。OpenClaw は、一致する任意の Bedrock
    ref について `temperature` を自動的に省略します。これには、基盤モデル ID、名前付き推論プロファイル、基盤モデルが
    `bedrock:GetInferenceProfile` によって Opus 4.7/4.8 に解決されるアプリケーション
    推論プロファイル、および任意のリージョンプレフィックス（`us.`、`eu.`、`ap.`、`apac.`、`au.`、`jp.`、
    `global.`）付きのドット区切り `opus-4.7`/`opus-4.8` バリアントが含まれます。
    設定ノブは不要であり、この省略はリクエストオプションオブジェクトと
    `inferenceConfig` ペイロードフィールドの両方に適用されます。
  </Accordion>

  <Accordion title="Claude Fable 5">
    `us-east-1` では `amazon-bedrock/anthropic.claude-fable-5` を使用するか、
    `us.anthropic.claude-fable-5` などの
    リージョン推論 ID を使用します。
    OpenClaw は Fable の 1M コンテキストウィンドウ、128K 出力制限、常時有効の
    アダプティブシンキング、およびサポートされる effort マッピングを適用します。`/think off` と
    `/think minimal` は `low` にマップされます。temperature と強制ツール選択コントロールは
    Opus 4.7/4.8 ルートと同様に省略されます。ストリーミング出力は、Bedrock が終端ステータスを返すまで
    保留されるため、ストリーム途中の拒否によって部分的なテキストが
    公開されることはありません。

    AWS は、Fable を利用可能にする前に明示的な `provider_data_share` データ保持のオプトインを
    要求します。プロンプトと補完は Anthropic と共有され、
    信頼と安全のため最大 30 日間保持されます。モデルを有効にする前に、
    [Bedrock データ保持](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    を確認して設定してください。

  </Accordion>

  <Accordion title="Guardrails">
    `amazon-bedrock` Plugin 設定に `guardrail` オブジェクトを追加することで、
    すべての Bedrock モデル呼び出しに [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    を適用できます。Guardrails により、コンテンツフィルタリング、
    トピック拒否、単語フィルター、機密情報フィルター、コンテキストに基づく
    グラウンディングチェックを適用できます。

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // guardrail ID または完全な ARN
                guardrailVersion: "1", // バージョン番号または "DRAFT"
                streamProcessingMode: "sync", // 任意: "sync" または "async"
                trace: "enabled", // 任意: "enabled"、"disabled"、または "enabled_full"
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
    | `guardrailVersion` | 公開済みバージョン番号、または作業中のドラフトを表す `"DRAFT"`。 |
    | `streamProcessingMode` | ストリーミング中の guardrail 評価に使用する `"sync"` または `"async"`。省略した場合、Bedrock はデフォルトを使用します。 |
    | `trace` | デバッグ用の `"enabled"` または `"enabled_full"`。本番環境では省略するか `"disabled"` に設定します。 |

    <Warning>
    Gateway で使用される IAM プリンシパルには、標準の呼び出し権限に加えて `bedrock:ApplyGuardrail` 権限が必要です。
    </Warning>

  </Accordion>

  <Accordion title="メモリ検索の Embeddings">
    Bedrock は [メモリ検索](/ja-JP/concepts/memory-search) の embedding プロバイダーとしても
    利用できます。これは推論プロバイダーとは別に設定します。
    `agents.defaults.memorySearch.provider` を `"bedrock"` に設定してください。

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // デフォルト
          },
        },
      },
    }
    ```

    Bedrock embeddings は、推論と同じ AWS SDK 認証情報チェーン（インスタンス
    ロール、SSO、アクセスキー、共有設定、Web ID）を使用します。API キーは
    不要です。

    サポートされる embedding モデルには、Amazon Titan Embed（v1、v2）、Amazon Nova
    Embed、Cohere Embed（v3、v4）、TwelveLabs Marengo が含まれます。完全なモデル一覧と次元オプションについては、
    [メモリ設定リファレンス -- Bedrock](/ja-JP/reference/memory-config#bedrock-embedding-config)
    を参照してください。

  </Accordion>

  <Accordion title="注記と注意点">
    - Bedrock では、AWS アカウント/リージョンで **モデルアクセス** が有効になっている必要があります。
    - 自動検出には `bedrock:ListFoundationModels` と
      `bedrock:ListInferenceProfiles` 権限が必要です。
    - 自動モードに依存する場合は、サポートされている AWS 認証環境マーカーのいずれかを
      Gateway ホストに設定してください。環境マーカーなしで IMDS/共有設定認証を使用したい場合は、
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true` を設定します。
    - OpenClaw は、認証情報ソースを次の順序で公開します: `AWS_BEARER_TOKEN_BEDROCK`、
      次に `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`、次に `AWS_PROFILE`、次に
      デフォルトの AWS SDK チェーン。
    - 推論サポートはモデルによって異なります。現在の機能については Bedrock モデルカードを
      確認してください。
    - マネージドキーのフローを使用したい場合は、OpenAI 互換の
      プロキシを Bedrock の前段に配置し、代わりに OpenAI プロバイダーとして設定することもできます。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル ref、フェイルオーバー動作の選択。
  </Card>
  <Card title="メモリ検索" href="/ja-JP/concepts/memory-search" icon="magnifying-glass">
    メモリ検索設定用の Bedrock embeddings。
  </Card>
  <Card title="メモリ設定リファレンス" href="/ja-JP/reference/memory-config#bedrock-embedding-config" icon="database">
    Bedrock embedding モデルの完全な一覧と次元オプション。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的なトラブルシューティングと FAQ。
  </Card>
</CardGroup>

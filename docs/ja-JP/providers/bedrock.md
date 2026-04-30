---
read_when:
    - OpenClaw で Amazon Bedrock モデルを使用したい
    - モデル呼び出しには AWS 認証情報/リージョンの設定が必要です
summary: OpenClaw で Amazon Bedrock (Converse API) モデルを使用する
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-30T05:29:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6c08ab141423a70e5283ddaf72bf6396bcef411dfa36e1c4b5632377f8ea2d8
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw は pi-ai の **Bedrock Converse** ストリーミングプロバイダー経由で **Amazon Bedrock** モデルを使用できます。Bedrock 認証では API キーではなく、**AWS SDK デフォルト認証情報チェーン**を使用します。

| プロパティ | 値                                                       |
| -------- | ----------------------------------------------------------- |
| プロバイダー | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| 認証     | AWS 認証情報 (環境変数、共有設定、またはインスタンスロール) |
| リージョン   | `AWS_REGION` または `AWS_DEFAULT_REGION` (デフォルト: `us-east-1`) |

## はじめに

希望する認証方法を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="アクセスキー / 環境変数">
    **最適な用途:** 開発者マシン、CI、または AWS 認証情報を直接管理するホスト。

    <Steps>
      <Step title="Gateway ホストに AWS 認証情報を設定する">
        ```bash
        export AWS_ACCESS_KEY_ID="AKIA..."
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Optional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Optional (Bedrock API key/bearer token):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Bedrock プロバイダーとモデルを設定に追加する">
        `apiKey` は不要です。`auth: "aws-sdk"` でプロバイダーを設定します。

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
    環境マーカー認証 (`AWS_ACCESS_KEY_ID`、`AWS_PROFILE`、または `AWS_BEARER_TOKEN_BEDROCK`) を使用すると、OpenClaw は追加設定なしでモデル検出用の暗黙的な Bedrock プロバイダーを自動的に有効化します。
    </Tip>

  </Tab>

  <Tab title="EC2 インスタンスロール (IMDS)">
    **最適な用途:** IAM ロールがアタッチされ、認証にインスタンスメタデータサービスを使用する EC2 インスタンス。

    <Steps>
      <Step title="検出を明示的に有効化する">
        IMDS を使用する場合、OpenClaw は環境マーカーだけでは AWS 認証を検出できないため、明示的にオプトインする必要があります。

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="任意で自動モード用の環境マーカーを追加する">
        環境マーカーによる自動検出パスも機能させたい場合 (たとえば `openclaw status` 画面向け):

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
    - `bedrock:ListFoundationModels` (自動検出用)
    - `bedrock:ListInferenceProfiles` (推論プロファイル検出用)

    または、管理ポリシー `AmazonBedrockFullAccess` をアタッチします。
    </Warning>

    <Note>
    `AWS_PROFILE=default` が必要なのは、自動モードまたはステータス画面向けの環境マーカーが特に必要な場合だけです。実際の Bedrock ランタイム認証パスは AWS SDK デフォルトチェーンを使用するため、環境マーカーがなくても IMDS インスタンスロール認証は機能します。
    </Note>

  </Tab>
</Tabs>

## モデルの自動検出

OpenClaw は、**ストリーミング**と**テキスト出力**をサポートする Bedrock モデルを自動的に検出できます。検出では `bedrock:ListFoundationModels` と `bedrock:ListInferenceProfiles` を使用し、結果はキャッシュされます (デフォルト: 1 時間)。

暗黙的なプロバイダーが有効化される仕組み:

- `plugins.entries.amazon-bedrock.config.discovery.enabled` が `true` の場合、
  AWS 環境マーカーが存在しなくても、OpenClaw は検出を試行します。
- `plugins.entries.amazon-bedrock.config.discovery.enabled` が未設定の場合、
  OpenClaw は次のいずれかの AWS 認証マーカーを検出したときにのみ、
  暗黙的な Bedrock プロバイダーを自動追加します:
  `AWS_BEARER_TOKEN_BEDROCK`、`AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY`、または `AWS_PROFILE`。
- 実際の Bedrock ランタイム認証パスは引き続き AWS SDK デフォルトチェーンを使用するため、
  共有設定、SSO、IMDS インスタンスロール認証は、検出でオプトインのために
  `enabled: true` が必要だった場合でも機能します。

<Note>
明示的な `models.providers["amazon-bedrock"]` エントリの場合、OpenClaw は `AWS_BEARER_TOKEN_BEDROCK` などの AWS 環境マーカーから、完全なランタイム認証の読み込みを強制せずに Bedrock 環境マーカー認証を早期解決できます。実際のモデル呼び出し認証パスは引き続き AWS SDK デフォルトチェーンを使用します。
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
    | ------ | ------- | ----------- |
    | `enabled` | auto | 自動モードでは、OpenClaw はサポート対象の AWS 環境マーカーを検出した場合にのみ、暗黙的な Bedrock プロバイダーを有効化します。検出を強制するには `true` を設定します。 |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | 検出 API 呼び出しに使用する AWS リージョン。 |
    | `providerFilter` | (すべて) | Bedrock プロバイダー名に一致します (例: `anthropic`、`amazon`)。 |
    | `refreshInterval` | `3600` | キャッシュ期間 (秒)。キャッシュを無効化するには `0` を設定します。 |
    | `defaultContextWindow` | `32000` | 検出されたモデルに使用するコンテキストウィンドウ (モデルの制限値がわかっている場合は上書きしてください)。 |
    | `defaultMaxTokens` | `4096` | 検出されたモデルに使用する最大出力トークン数 (モデルの制限値がわかっている場合は上書きしてください)。 |

  </Accordion>
</AccordionGroup>

## クイックセットアップ (AWS パス)

このウォークスルーでは、IAM ロールを作成し、Bedrock 権限をアタッチし、インスタンスプロファイルを関連付け、EC2 ホストで OpenClaw 検出を有効化します。

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
    OpenClaw は、基盤モデルと合わせて**リージョナルおよびグローバル推論プロファイル**を検出します。プロファイルが既知の基盤モデルにマッピングされている場合、プロファイルはそのモデルの機能 (コンテキストウィンドウ、最大トークン数、推論、ビジョン) を継承し、正しい Bedrock リクエストリージョンが自動的に注入されます。つまり、クロスリージョンの Claude プロファイルは手動のプロバイダー上書きなしで機能します。

    推論プロファイル ID は `us.anthropic.claude-opus-4-6-v1:0` (リージョナル) または `anthropic.claude-opus-4-6-v1:0` (グローバル) のような形式です。基盤となるモデルがすでに検出結果に含まれている場合、プロファイルは完全な機能セットを継承します。そうでない場合は安全なデフォルトが適用されます。

    追加設定は不要です。検出が有効で、IAM プリンシパルに `bedrock:ListInferenceProfiles` がある限り、プロファイルは `openclaw models list` で基盤モデルと並んで表示されます。

  </Accordion>

  <Accordion title="Claude Opus 4.7 temperature">
    Bedrock は Claude Opus 4.7 の `temperature` パラメーターを拒否します。OpenClaw は、基盤モデル ID、名前付き推論プロファイル、基盤となるモデルが `bedrock:GetInferenceProfile` によって Opus 4.7 に解決されるアプリケーション推論プロファイル、任意のリージョンプレフィックス (`us.`、`eu.`、`ap.`、`apac.`、`au.`、`jp.`、`global.`) を持つドット区切りの `opus-4.7` バリアントを含め、すべての Opus 4.7 Bedrock 参照に対して `temperature` を自動的に省略します。設定ノブは不要で、この省略はリクエストオプションオブジェクトと `inferenceConfig` ペイロードフィールドの両方に適用されます。
  </Accordion>

  <Accordion title="ガードレール">
    `amazon-bedrock` Plugin 設定に `guardrail` オブジェクトを追加することで、すべての Bedrock モデル呼び出しに [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html) を適用できます。ガードレールにより、コンテンツフィルタリング、トピック拒否、単語フィルター、機密情報フィルター、コンテキストグラウンディングチェックを適用できます。

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
    | `guardrailIdentifier` | はい | ガードレール ID (例: `abc123`) または完全な ARN (例: `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`)。 |
    | `guardrailVersion` | はい | 公開済みバージョン番号、または作業中ドラフトを表す `"DRAFT"`。 |
    | `streamProcessingMode` | いいえ | ストリーミング中のガードレール評価に使用する `"sync"` または `"async"`。省略した場合、Bedrock はデフォルトを使用します。 |
    | `trace` | いいえ | デバッグ用の `"enabled"` または `"enabled_full"`。本番環境では省略するか `"disabled"` を設定します。 |

    <Warning>
    Gateway が使用する IAM プリンシパルには、標準の呼び出し権限に加えて `bedrock:ApplyGuardrail` 権限が必要です。
    </Warning>

  </Accordion>

  <Accordion title="メモリ検索用の埋め込み">
    Bedrock は
    [メモリ検索](/ja-JP/concepts/memory-search)の埋め込みプロバイダーとしても使用できます。これは
    推論プロバイダーとは別に設定します。`agents.defaults.memorySearch.provider` を `"bedrock"` に設定します。

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

    Bedrock 埋め込みは、推論と同じ AWS SDK 認証情報チェーン（インスタンス
    ロール、SSO、アクセスキー、共有設定、Web アイデンティティ）を使用します。API キーは
    不要です。`provider` が `"auto"` の場合、その
    認証情報チェーンが正常に解決されると Bedrock が自動検出されます。

    サポートされる埋め込みモデルには、Amazon Titan Embed（v1、v2）、Amazon Nova
    Embed、Cohere Embed（v3、v4）、TwelveLabs Marengo が含まれます。完全なモデル一覧と次元オプションについては、
    [メモリ設定リファレンス -- Bedrock](/ja-JP/reference/memory-config#bedrock-embedding-config)
    を参照してください。

  </Accordion>

  <Accordion title="注記と注意点">
    - Bedrock では、AWS アカウント/リージョンで **モデルアクセス** を有効にする必要があります。
    - 自動検出には `bedrock:ListFoundationModels` と
      `bedrock:ListInferenceProfiles` の権限が必要です。
    - auto モードを利用する場合は、Gateway ホストでサポート対象の AWS 認証環境マーカーのいずれかを設定してください。環境マーカーなしで IMDS/共有設定認証を使いたい場合は、
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true` を設定してください。
    - OpenClaw は認証情報ソースを次の順序で公開します: `AWS_BEARER_TOKEN_BEDROCK`、
      次に `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`、次に `AWS_PROFILE`、次に
      デフォルトの AWS SDK チェーン。
    - 推論サポートはモデルによって異なります。現在の機能については Bedrock のモデルカードを確認してください。
    - マネージドキーのフローを好む場合は、Bedrock の前段に OpenAI 互換
      プロキシを配置し、代わりに OpenAI プロバイダーとして設定することもできます。
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

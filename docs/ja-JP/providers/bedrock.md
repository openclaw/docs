---
read_when:
    - OpenClaw で Amazon Bedrock モデルを使いたい場合
    - モデル呼び出しのための AWS 認証情報/リージョン設定が必要な場合
summary: OpenClaw で Amazon Bedrock（Converse API）モデルを使う
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-24T05:13:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e37aaead5c9bd730b4dd1f2878ff63bebf5537d75ff9df786813c58b1ac2fc0
    source_path: providers/bedrock.md
    workflow: 15
---

OpenClaw は、pi-ai の **Bedrock Converse**
ストリーミングプロバイダー経由で **Amazon Bedrock** モデルを使えます。Bedrock の認証は **AWS SDK のデフォルト認証情報チェーン** を使い、
API キーは使いません。

| プロパティ | 値                                                            |
| ---------- | ------------------------------------------------------------- |
| Provider   | `amazon-bedrock`                                              |
| API        | `bedrock-converse-stream`                                     |
| Auth       | AWS 認証情報（env var、共有 config、またはインスタンスロール） |
| Region     | `AWS_REGION` または `AWS_DEFAULT_REGION`（デフォルト: `us-east-1`） |

## はじめに

希望する認証方法を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="アクセスキー / env var">
    **最適な用途:** 開発マシン、CI、または AWS 認証情報を直接管理するホスト。

    <Steps>
      <Step title="Gateway ホストに AWS 認証情報を設定する">
        ```bash
        export AWS_ACCESS_KEY_ID="AKIA..."
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # 任意:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # 任意（Bedrock API キー/bearer token）:
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Config に Bedrock provider とモデルを追加する">
        `apiKey` は不要です。`auth: "aws-sdk"` で provider を設定してください。

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
      <Step title="モデルが利用可能か確認する">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    env-marker 認証（`AWS_ACCESS_KEY_ID`、`AWS_PROFILE`、または `AWS_BEARER_TOKEN_BEDROCK`）を使うと、OpenClaw は追加 config なしで model discovery 用の暗黙 Bedrock provider を自動有効化します。
    </Tip>

  </Tab>

  <Tab title="EC2 インスタンスロール（IMDS）">
    **最適な用途:** IAM ロールがアタッチされた EC2 インスタンス。認証にはインスタンスメタデータサービスを使用。

    <Steps>
      <Step title="discovery を明示的に有効化する">
        IMDS を使う場合、OpenClaw は env marker だけでは AWS auth を検出できないため、明示的にオプトインする必要があります。

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="任意: auto モード用に env marker を追加する">
        env-marker 自動検出パスも機能させたい場合（たとえば `openclaw status` サーフェスのためなど）:

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
    EC2 インスタンスにアタッチする IAM ロールには、次の権限が必要です。

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels`（自動 discovery 用）
    - `bedrock:ListInferenceProfiles`（inference profile discovery 用）

    または、管理ポリシー `AmazonBedrockFullAccess` をアタッチしてください。
    </Warning>

    <Note>
    `AWS_PROFILE=default` が必要なのは、auto モードや status サーフェス用の env marker を特に欲しい場合だけです。実際の Bedrock ランタイム auth パスは AWS SDK のデフォルトチェーンを使うため、env marker がなくても IMDS のインスタンスロール認証は動作します。
    </Note>

  </Tab>
</Tabs>

## 自動モデル discovery

OpenClaw は、**ストリーミング**と**テキスト出力**をサポートする Bedrock モデルを自動 discovery できます。discovery は `bedrock:ListFoundationModels` と
`bedrock:ListInferenceProfiles` を使い、結果はキャッシュされます（デフォルト: 1 時間）。

暗黙 provider が有効になる方法:

- `plugins.entries.amazon-bedrock.config.discovery.enabled` が `true` の場合、
  AWS env marker が存在しなくても OpenClaw は discovery を試みます。
- `plugins.entries.amazon-bedrock.config.discovery.enabled` が未設定の場合、
  OpenClaw は、次の AWS auth marker のいずれかを見たときだけ
  暗黙 Bedrock provider を自動追加します:
  `AWS_BEARER_TOKEN_BEDROCK`、`AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY`、または `AWS_PROFILE`。
- 実際の Bedrock ランタイム auth パスは依然として AWS SDK のデフォルトチェーンを使うため、
  共有 config、SSO、IMDS インスタンスロール認証は、discovery に
  `enabled: true` の明示的オプトインが必要だった場合でも動作しえます。

<Note>
明示的な `models.providers["amazon-bedrock"]` エントリーに対しても、OpenClaw は `AWS_BEARER_TOKEN_BEDROCK` のような AWS env marker から、フルランタイム auth 読み込みを強制せずに Bedrock env-marker auth を早期に解決できます。実際のモデル呼び出し auth パスは依然として AWS SDK のデフォルトチェーンを使います。
</Note>

<AccordionGroup>
  <Accordion title="Discovery config オプション">
    Config オプションは `plugins.entries.amazon-bedrock.config.discovery` 配下にあります。

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
    | `enabled` | auto | auto モードでは、OpenClaw はサポートされた AWS env marker を見たときだけ暗黙 Bedrock provider を有効化します。discovery を強制するには `true` を設定してください。 |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | discovery API 呼び出しに使う AWS region。 |
    | `providerFilter` | （全件） | Bedrock provider 名に一致します（たとえば `anthropic`, `amazon`）。 |
    | `refreshInterval` | `3600` | キャッシュ期間（秒）。キャッシュを無効にするには `0` を設定してください。 |
    | `defaultContextWindow` | `32000` | discovery されたモデルに使うコンテキストウィンドウ（モデルの制限が分かっているなら上書きしてください）。 |
    | `defaultMaxTokens` | `4096` | discovery されたモデルに使う最大出力 token（モデルの制限が分かっているなら上書きしてください）。 |

  </Accordion>
</AccordionGroup>

## クイックセットアップ（AWS パス）

この手順では、IAM ロールを作成し、Bedrock 権限をアタッチし、
インスタンス profile を関連付け、EC2 ホスト上で OpenClaw discovery を有効化します。

```bash
# 1. IAM ロールとインスタンスプロファイルを作成
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

# 2. あなたの EC2 インスタンスにアタッチ
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. EC2 インスタンス上で、discovery を明示的に有効化
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. 任意: 明示的有効化なしで auto モードを使いたいなら env marker を追加
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. モデルが検出されることを確認
openclaw models list
```

## 高度な設定

<AccordionGroup>
  <Accordion title="Inference profile">
    OpenClaw は foundation model と並んで **regional および global inference profile** を discovery します。profile が既知の foundation model にマップされる場合、その profile はそのモデルの capability（context window、max tokens、reasoning、vision）を継承し、正しい Bedrock リクエスト region が自動的に注入されます。つまり、cross-region Claude profile は手動の provider 上書きなしで動作します。

    inference profile ID は、`us.anthropic.claude-opus-4-6-v1:0`（regional）
    または `anthropic.claude-opus-4-6-v1:0`（global）のようになります。基底モデルがすでに
    discovery 結果にある場合、その profile は完全な capability 集合を継承します。そうでない場合は、安全なデフォルトが適用されます。

    追加設定は不要です。discovery が有効で、IAM
    principal に `bedrock:ListInferenceProfiles` がある限り、profile は
    `openclaw models list` に foundation model と並んで表示されます。

  </Accordion>

  <Accordion title="Guardrails">
    `amazon-bedrock` Plugin config に `guardrail` オブジェクトを追加することで、すべての Bedrock モデル呼び出しに [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    を適用できます。Guardrails により、コンテンツフィルタリング、
    トピック拒否、単語フィルター、機微情報フィルター、コンテキスト基盤チェックを強制できます。

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // guardrail ID または完全 ARN
                guardrailVersion: "1", // バージョン番号または "DRAFT"
                streamProcessingMode: "sync", // 任意: "sync" または "async"
                trace: "enabled", // 任意: "enabled", "disabled", または "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    | オプション | 必須 | 説明 |
    | ---------- | ---- | ---- |
    | `guardrailIdentifier` | はい | Guardrail ID（例 `abc123`）または完全 ARN（例 `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`）。 |
    | `guardrailVersion` | はい | 公開済みバージョン番号、または作業ドラフトを表す `"DRAFT"`。 |
    | `streamProcessingMode` | いいえ | ストリーミング中の guardrail 評価用の `"sync"` または `"async"`。省略時は Bedrock のデフォルトを使います。 |
    | `trace` | いいえ | デバッグ用の `"enabled"` または `"enabled_full"`。本番では省略するか `"disabled"` にしてください。 |

    <Warning>
    Gateway が使う IAM principal には、標準の invoke 権限に加えて `bedrock:ApplyGuardrail` 権限が必要です。
    </Warning>

  </Accordion>

  <Accordion title="Memory search 用 embeddings">
    Bedrock は [memory search](/ja-JP/concepts/memory-search)
    の embedding provider としても使えます。これは推論 provider とは別に設定します。`agents.defaults.memorySearch.provider` を `"bedrock"` に設定してください:

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
    ロール、SSO、アクセスキー、共有 config、web identity）を使います。API キーは
    不要です。`provider` が `"auto"` の場合、その認証情報チェーンが正常に解決されれば Bedrock は自動検出されます。

    サポートされる embedding モデルには、Amazon Titan Embed（v1、v2）、Amazon Nova
    Embed、Cohere Embed（v3、v4）、TwelveLabs Marengo が含まれます。完全なモデル一覧と次元オプションについては
    [Memory 設定リファレンス -- Bedrock](/ja-JP/reference/memory-config#bedrock-embedding-config)
    を参照してください。

  </Accordion>

  <Accordion title="注意と留意点">
    - Bedrock では、AWS アカウント/region で **model access** が有効になっている必要があります。
    - 自動 discovery には `bedrock:ListFoundationModels` と
      `bedrock:ListInferenceProfiles` 権限が必要です。
    - auto モードに依存する場合は、サポートされる AWS auth env marker のいずれかを
      Gateway ホストに設定してください。env marker なしで IMDS/共有 config auth を使いたい場合は、
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true` を設定してください。
    - OpenClaw は、認証情報ソースを次の順で表面化します: `AWS_BEARER_TOKEN_BEDROCK`、
      次に `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`、次に `AWS_PROFILE`、最後に
      デフォルト AWS SDK チェーン。
    - reasoning サポートはモデルに依存します。現在の capability は Bedrock モデルカードを確認してください。
    - 管理されたキー運用を好む場合は、Bedrock の前段に OpenAI 互換
      proxy を置き、それを OpenAI provider として設定することもできます。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、model ref、failover 動作の選び方。
  </Card>
  <Card title="Memory search" href="/ja-JP/concepts/memory-search" icon="magnifying-glass">
    Memory search 用 Bedrock embeddings の設定。
  </Card>
  <Card title="Memory config reference" href="/ja-JP/reference/memory-config#bedrock-embedding-config" icon="database">
    Bedrock embedding モデルの完全な一覧と次元オプション。
  </Card>
  <Card title="Troubleshooting" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的なトラブルシューティングと FAQ。
  </Card>
</CardGroup>

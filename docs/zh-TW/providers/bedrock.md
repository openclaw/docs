---
read_when:
    - 您想要搭配 OpenClaw 使用 Amazon Bedrock 模型
    - 你需要設定 AWS 認證與區域，才能進行模型呼叫
summary: 透過 OpenClaw 使用 Amazon Bedrock (Converse API) 模型
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-30T03:29:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6c08ab141423a70e5283ddaf72bf6396bcef411dfa36e1c4b5632377f8ea2d8
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw 可以透過 pi-ai 的 **Bedrock Converse** 串流提供者使用 **Amazon Bedrock** 模型。Bedrock 驗證使用 **AWS SDK 預設憑證鏈**，不是 API 金鑰。

| 屬性 | 值                                                       |
| -------- | ----------------------------------------------------------- |
| 提供者 | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| 驗證     | AWS 憑證（環境變數、共用設定或執行個體角色） |
| 區域   | `AWS_REGION` 或 `AWS_DEFAULT_REGION`（預設：`us-east-1`） |

## 開始使用

選擇偏好的驗證方法，並依照設定步驟操作。

<Tabs>
  <Tab title="存取金鑰 / 環境變數">
    **最適合：** 開發者機器、CI，或你直接管理 AWS 憑證的主機。

    <Steps>
      <Step title="在 gateway 主機上設定 AWS 憑證">
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
      <Step title="將 Bedrock 提供者和模型新增到你的設定">
        不需要 `apiKey`。使用 `auth: "aws-sdk"` 設定提供者：

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
      <Step title="確認模型可用">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    使用環境標記驗證（`AWS_ACCESS_KEY_ID`、`AWS_PROFILE` 或 `AWS_BEARER_TOKEN_BEDROCK`）時，OpenClaw 會自動啟用隱含的 Bedrock 提供者，以便在沒有額外設定的情況下進行模型探索。
    </Tip>

  </Tab>

  <Tab title="EC2 執行個體角色（IMDS）">
    **最適合：** 已附加 IAM 角色，並使用執行個體中繼資料服務進行驗證的 EC2 執行個體。

    <Steps>
      <Step title="明確啟用探索">
        使用 IMDS 時，OpenClaw 無法只從環境標記偵測 AWS 驗證，因此你必須選擇啟用：

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="選擇性新增自動模式的環境標記">
        如果你也想讓環境標記自動偵測路徑運作（例如用於 `openclaw status` 介面）：

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        你**不**需要假的 API 金鑰。
      </Step>
      <Step title="確認已探索到模型">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    附加到 EC2 執行個體的 IAM 角色必須具備下列權限：

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels`（用於自動探索）
    - `bedrock:ListInferenceProfiles`（用於推論設定檔探索）

    或附加受管理政策 `AmazonBedrockFullAccess`。
    </Warning>

    <Note>
    只有在你特別想要自動模式或狀態介面的環境標記時，才需要 `AWS_PROFILE=default`。實際的 Bedrock 執行階段驗證路徑使用 AWS SDK 預設鏈，因此即使沒有環境標記，IMDS 執行個體角色驗證也可以運作。
    </Note>

  </Tab>
</Tabs>

## 自動模型探索

OpenClaw 可以自動探索支援**串流**和**文字輸出**的 Bedrock 模型。探索使用 `bedrock:ListFoundationModels` 和 `bedrock:ListInferenceProfiles`，且結果會快取（預設：1 小時）。

隱含提供者的啟用方式：

- 如果 `plugins.entries.amazon-bedrock.config.discovery.enabled` 是 `true`，即使沒有 AWS 環境標記，OpenClaw 也會嘗試探索。
- 如果未設定 `plugins.entries.amazon-bedrock.config.discovery.enabled`，OpenClaw 只有在看到下列其中一個 AWS 驗證標記時，才會自動新增隱含的 Bedrock 提供者：`AWS_BEARER_TOKEN_BEDROCK`、`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`，或 `AWS_PROFILE`。
- 實際的 Bedrock 執行階段驗證路徑仍然使用 AWS SDK 預設鏈，因此即使探索需要 `enabled: true` 才能選擇啟用，共用設定、SSO 和 IMDS 執行個體角色驗證仍可運作。

<Note>
對於明確的 `models.providers["amazon-bedrock"]` 項目，OpenClaw 仍可從 AWS 環境標記（例如 `AWS_BEARER_TOKEN_BEDROCK`）提早解析 Bedrock 環境標記驗證，而不強制載入完整執行階段驗證。實際的模型呼叫驗證路徑仍使用 AWS SDK 預設鏈。
</Note>

<AccordionGroup>
  <Accordion title="探索設定選項">
    設定選項位於 `plugins.entries.amazon-bedrock.config.discovery` 下：

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

    | 選項 | 預設值 | 說明 |
    | ------ | ------- | ----------- |
    | `enabled` | auto | 在自動模式中，OpenClaw 只有在看到支援的 AWS 環境標記時，才會啟用隱含的 Bedrock 提供者。設為 `true` 可強制探索。 |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | 用於探索 API 呼叫的 AWS 區域。 |
    | `providerFilter` |（全部）| 符合 Bedrock 提供者名稱（例如 `anthropic`、`amazon`）。 |
    | `refreshInterval` | `3600` | 快取持續時間，以秒為單位。設為 `0` 可停用快取。 |
    | `defaultContextWindow` | `32000` | 已探索模型使用的上下文視窗（如果你知道模型限制，可覆寫）。 |
    | `defaultMaxTokens` | `4096` | 已探索模型使用的最大輸出 Token 數（如果你知道模型限制，可覆寫）。 |

  </Accordion>
</AccordionGroup>

## 快速設定（AWS 路徑）

此逐步說明會建立 IAM 角色、附加 Bedrock 權限、關聯執行個體設定檔，並在 EC2 主機上啟用 OpenClaw 探索。

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

## 進階設定

<AccordionGroup>
  <Accordion title="推論設定檔">
    OpenClaw 會在基礎模型旁一併探索**區域和全域推論設定檔**。當設定檔對應到已知的基礎模型時，該設定檔會繼承該模型的能力（上下文視窗、最大 Token 數、推理、視覺），並自動注入正確的 Bedrock 請求區域。這表示跨區域 Claude 設定檔無需手動覆寫提供者即可運作。

    推論設定檔 ID 看起來像 `us.anthropic.claude-opus-4-6-v1:0`（區域）或 `anthropic.claude-opus-4-6-v1:0`（全域）。如果後端模型已在探索結果中，設定檔會繼承其完整能力集合；否則會套用安全預設值。

    不需要額外設定。只要已啟用探索，且 IAM 主體具備 `bedrock:ListInferenceProfiles`，設定檔就會與基礎模型一起出現在 `openclaw models list` 中。

  </Accordion>

  <Accordion title="Claude Opus 4.7 temperature">
    Bedrock 會拒絕 Claude Opus 4.7 的 `temperature` 參數。OpenClaw 會自動略過任何 Opus 4.7 Bedrock 參照的 `temperature`，包括基礎模型 ID、命名推論設定檔、其底層模型透過 `bedrock:GetInferenceProfile` 解析為 Opus 4.7 的應用程式推論設定檔，以及具有選用區域前綴（`us.`、`eu.`、`ap.`、`apac.`、`au.`、`jp.`、`global.`）的點分 `opus-4.7` 變體。不需要設定旋鈕，且此略過會套用到請求選項物件與 `inferenceConfig` 承載欄位。
  </Accordion>

  <Accordion title="防護欄">
    你可以透過將 `guardrail` 物件新增到 `amazon-bedrock` Plugin 設定，將 [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html) 套用到所有 Bedrock 模型叫用。防護欄可讓你強制執行內容篩選、主題拒絕、字詞篩選、敏感資訊篩選，以及情境接地檢查。

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

    | 選項 | 必填 | 說明 |
    | ------ | -------- | ----------- |
    | `guardrailIdentifier` | 是 | 防護欄 ID（例如 `abc123`）或完整 ARN（例如 `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`）。 |
    | `guardrailVersion` | 是 | 已發布版本號，或工作草稿的 `"DRAFT"`。 |
    | `streamProcessingMode` | 否 | 串流期間防護欄評估使用的 `"sync"` 或 `"async"`。如果省略，Bedrock 會使用其預設值。 |
    | `trace` | 否 | 用於偵錯的 `"enabled"` 或 `"enabled_full"`；生產環境請省略或設為 `"disabled"`。 |

    <Warning>
    Gateway 使用的 IAM 主體除了標準叫用權限外，還必須具備 `bedrock:ApplyGuardrail` 權限。
    </Warning>

  </Accordion>

  <Accordion title="用於記憶搜尋的嵌入">
    Bedrock 也可以作為
    [記憶搜尋](/zh-TW/concepts/memory-search)的嵌入提供者。這會與推論提供者分開設定，請將 `agents.defaults.memorySearch.provider` 設為 `"bedrock"`：

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

    Bedrock 嵌入使用與推論相同的 AWS SDK 憑證鏈（執行個體角色、SSO、存取金鑰、共用設定，以及 Web 身分）。不需要 API 金鑰。當 `provider` 為 `"auto"` 時，如果該憑證鏈成功解析，就會自動偵測到 Bedrock。

    支援的嵌入模型包括 Amazon Titan Embed（v1、v2）、Amazon Nova Embed、Cohere Embed（v3、v4）以及 TwelveLabs Marengo。完整模型清單和維度選項請參閱
    [記憶設定參考 -- Bedrock](/zh-TW/reference/memory-config#bedrock-embedding-config)。

  </Accordion>

  <Accordion title="注意事項與限制">
    - Bedrock 需要在你的 AWS 帳戶/區域中啟用**模型存取權**。
    - 自動探索需要 `bedrock:ListFoundationModels` 和
      `bedrock:ListInferenceProfiles` 權限。
    - 如果你仰賴自動模式，請在 Gateway 主機上設定其中一個受支援的 AWS 驗證環境標記。如果你偏好不使用環境標記的 IMDS/共用設定驗證，請設定
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`。
    - OpenClaw 會依此順序呈現憑證來源：`AWS_BEARER_TOKEN_BEDROCK`，
      接著是 `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`，再來是 `AWS_PROFILE`，最後是預設 AWS SDK 鏈。
    - 推理支援取決於模型；請查看 Bedrock 模型卡以了解目前功能。
    - 如果你偏好受管理的金鑰流程，也可以在 Bedrock 前方放置 OpenAI 相容的代理，並將其改為設定成 OpenAI 提供者。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照和容錯移轉行為。
  </Card>
  <Card title="記憶搜尋" href="/zh-TW/concepts/memory-search" icon="magnifying-glass">
    Bedrock 嵌入的記憶搜尋設定。
  </Card>
  <Card title="記憶設定參考" href="/zh-TW/reference/memory-config#bedrock-embedding-config" icon="database">
    完整的 Bedrock 嵌入模型清單和維度選項。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    一般疑難排解與常見問題。
  </Card>
</CardGroup>

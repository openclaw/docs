---
read_when:
    - 您想要將 Amazon Bedrock 模型搭配 OpenClaw 使用
    - 你需要設定 AWS 憑證/區域，才能進行模型呼叫
summary: 搭配 OpenClaw 使用 Amazon Bedrock（Converse API）模型
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-07-05T11:35:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83b0be40d8c0fd6283c8cd8ce271b9fb2fd0e7402c12f783ead69e1c3779eb8c
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw 可以透過其 **Bedrock Converse** 串流提供者使用 **Amazon Bedrock** 模型。Bedrock 驗證使用 **AWS SDK 預設憑證鏈**，而不是 API 金鑰。

| 屬性 | 值 |
| -------- | ----------------------------------------------------------- |
| 提供者 | `amazon-bedrock` |
| API | `bedrock-converse-stream` |
| 驗證 | AWS 憑證（環境變數、共用設定或執行個體角色） |
| 區域 | `AWS_REGION` 或 `AWS_DEFAULT_REGION`（預設：`us-east-1`） |

## 開始使用

選擇偏好的驗證方法，並依照設定步驟操作。

<Tabs>
  <Tab title="存取金鑰 / 環境變數">
    **最適合：**開發者機器、CI，或您直接管理 AWS 憑證的主機。

    <Steps>
      <Step title="在閘道主機上設定 AWS 憑證">
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
      <Step title="將 Bedrock 提供者和模型加入設定">
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
    使用環境標記驗證（`AWS_ACCESS_KEY_ID`、`AWS_PROFILE` 或 `AWS_BEARER_TOKEN_BEDROCK`）時，OpenClaw 會自動啟用隱含 Bedrock 提供者，以進行模型探索，不需要額外設定。
    </Tip>

  </Tab>

  <Tab title="EC2 執行個體角色（IMDS）">
    **最適合：**已附加 IAM 角色，並使用執行個體中繼資料服務進行驗證的 EC2 執行個體。

    <Steps>
      <Step title="明確啟用探索">
        使用 IMDS 時，OpenClaw 無法只透過環境標記偵測 AWS 驗證，因此您必須選擇加入：

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="可選：為自動模式加入環境標記">
        如果您也想讓環境標記自動偵測路徑運作（例如用於 `openclaw status` 介面）：

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        您**不**需要假的 API 金鑰。
      </Step>
      <Step title="確認已探索到模型">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    附加到 EC2 執行個體的 IAM 角色必須具備以下權限：

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels`（用於自動探索）
    - `bedrock:ListInferenceProfiles`（用於推論設定檔探索）

    或附加受管政策 `AmazonBedrockFullAccess`。
    </Warning>

    <Note>
    只有在您特別想要自動模式或狀態介面的環境標記時，才需要 `AWS_PROFILE=default`。實際的 Bedrock 執行階段驗證路徑使用 AWS SDK 預設鏈，因此即使沒有環境標記，IMDS 執行個體角色驗證也能運作。
    </Note>

  </Tab>
</Tabs>

## 自動模型探索

OpenClaw 可以自動探索支援**串流**和**文字輸出**的 Bedrock 模型。探索使用 `bedrock:ListFoundationModels` 和 `bedrock:ListInferenceProfiles`，且結果會快取（預設：1 小時）。

隱含提供者的啟用方式：

- 如果 `plugins.entries.amazon-bedrock.config.discovery.enabled` 是 `true`，即使沒有 AWS 環境標記，OpenClaw 也會嘗試探索。
- 如果未設定 `plugins.entries.amazon-bedrock.config.discovery.enabled`，OpenClaw 只有在看到以下任一 AWS 驗證標記時，才會自動加入隱含 Bedrock 提供者：`AWS_BEARER_TOKEN_BEDROCK`、`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` 或 `AWS_PROFILE`。
- 實際的 Bedrock 執行階段驗證路徑仍使用 AWS SDK 預設鏈，因此即使探索需要 `enabled: true` 才能選擇加入，共用設定、SSO 和 IMDS 執行個體角色驗證仍可運作。

<Note>
對於明確的 `models.providers["amazon-bedrock"]` 項目，OpenClaw 仍可從 `AWS_BEARER_TOKEN_BEDROCK` 等 AWS 環境標記提前解析 Bedrock 環境標記驗證，而不強制載入完整執行階段驗證。實際的模型呼叫驗證路徑仍使用 AWS SDK 預設鏈。
</Note>

<AccordionGroup>
  <Accordion title="探索設定選項">
    設定選項位於 `plugins.entries.amazon-bedrock.config.discovery` 底下：

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
    | `enabled` | auto | 在自動模式中，OpenClaw 只有在看到受支援的 AWS 環境標記時，才會啟用隱含 Bedrock 提供者。設為 `true` 可強制探索。 |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | 用於探索 API 呼叫的 AWS 區域。 |
    | `providerFilter` | （全部） | 比對 Bedrock 提供者名稱（例如 `anthropic`、`amazon`）。 |
    | `refreshInterval` | `3600` | 快取持續時間（秒）。設為 `0` 可停用快取。 |
    | `defaultContextWindow` | `32000` | 用於沒有已知 token 限制的已探索模型的上下文視窗（如果您知道模型限制，請覆寫）。 |
    | `defaultMaxTokens` | `4096` | 用於沒有已知 token 限制的已探索模型的最大輸出 token 數（如果您知道模型限制，請覆寫）。 |

  </Accordion>

  <Accordion title="上下文視窗與最大 token 限制">
    Bedrock `ListFoundationModels` 和 `GetFoundationModel` API 不會傳回 token 限制中繼資料，只會傳回模型 ID、名稱、模態和生命週期狀態。OpenClaw 內建熱門 Bedrock 模型（Claude、Nova、Llama、Mistral、DeepSeek 等）的已知上下文視窗和輸出限制查找表，因此工作階段管理、壓縮閾值和上下文溢位偵測能為這些模型正確運作。

    不在表格中的已探索模型會回退到 `defaultContextWindow` 和 `defaultMaxTokens`。如果您使用的模型缺少準確限制，請使用明確的 `models.providers["amazon-bedrock"].models` 項目覆寫。

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
    OpenClaw 會在基礎模型旁一併探索**區域和全域推論設定檔**。當設定檔對應到已知基礎模型時，該設定檔會繼承該模型的功能（上下文視窗、最大 token、推理、視覺），並自動注入正確的 Bedrock 請求區域。這表示跨區域 Claude 設定檔無需手動覆寫提供者即可運作。全域跨區域設定檔（`global.*`）會在 `openclaw models list` 中優先列出，因為它們通常提供更好的容量和自動容錯移轉。

    推論設定檔 ID 看起來像 `us.anthropic.claude-opus-4-6-v1:0`（區域）或 `anthropic.claude-opus-4-6-v1:0`（全域）。如果支援模型已在探索結果中，設定檔會繼承其完整功能集；否則會套用安全預設值。

    不需要額外設定。只要已啟用探索，且 IAM 主體具備 `bedrock:ListInferenceProfiles`，設定檔就會與基礎模型一起出現在 `openclaw models list` 中。

  </Accordion>

  <Accordion title="服務層級">
    某些 Bedrock 模型支援 `service_tier` 參數，以針對成本或延遲最佳化。可用層級如下：

    | 層級 | 說明 |
    |------|-------------|
    | `default` | 標準 Bedrock 層級 |
    | `flex` | 適合可容忍較長延遲工作負載的折扣處理 |
    | `priority` | 適合延遲敏感工作負載的優先處理 |
    | `reserved` | 適合穩定狀態工作負載的保留容量 |

    透過 `agents.defaults.params` 為 Bedrock 模型請求設定 `serviceTier`（或 `service_tier`），或在 `agents.defaults.models["<model-key>"].params` 中逐模型設定：

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

    有效值為 `default`、`flex`、`priority` 和 `reserved`。Claude
    Fable 5 僅支援 `default` 層級；如果該模型要求使用
    `flex`、`priority` 或 `reserved`，OpenClaw 會發出警告並忽略。
    對於其他模型，並非每個模型都支援每個層級 -- 不支援的層級
    會回傳 Bedrock 驗證錯誤，且錯誤訊息可能具有誤導性
    （例如「The provided model identifier is invalid」，
    而不是指出層級才是問題）。如果你看到此錯誤，請檢查
    該模型是否支援要求的層級。

  </Accordion>

  <Accordion title="Claude Opus 4.7 和 4.8 temperature">
    Bedrock 會拒絕 Claude Opus 4.7 和 Opus
    4.8 的 `temperature` 參數。OpenClaw 會自動為任何相符的 Bedrock
    ref 省略 `temperature`，包括基礎模型 ID、具名推論設定檔、
    其底層模型透過 `bedrock:GetInferenceProfile` 解析為 Opus 4.7/4.8 的應用程式
    推論設定檔，以及帶有可選區域前綴（`us.`、`eu.`、`ap.`、`apac.`、`au.`、`jp.`、
    `global.`）的點分式 `opus-4.7`/`opus-4.8` 變體。
    不需要任何設定旋鈕，且此省略會同時套用於
    請求選項物件與 `inferenceConfig` 酬載欄位。
  </Accordion>

  <Accordion title="Claude Fable 5">
    請在 `us-east-1` 使用 `amazon-bedrock/anthropic.claude-fable-5`，或使用
    `us.anthropic.claude-fable-5` 等區域推論 ID。
    OpenClaw 會套用 Fable 的 1M 上下文視窗、128K 輸出限制、永遠啟用的
    自適應思考，以及支援的 effort 對應。`/think off` 和
    `/think minimal` 會對應到 `low`；temperature 和強制工具選擇控制項
    會被省略，與 Opus 4.7/4.8 路由一致。串流輸出會被保留，
    直到 Bedrock 回傳終端狀態，避免串流中途拒絕時
    暴露部分文字。

    AWS 要求在 Fable 可用前，必須明確選擇加入 `provider_data_share`
    資料保留。提示和完成內容會與 Anthropic 共享，並最多保留
    30 天以用於信任與安全。在啟用此模型前，請先檢閱並設定
    [Bedrock 資料保留](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)。

  </Accordion>

  <Accordion title="防護機制">
    你可以在 `amazon-bedrock` 外掛設定中加入 `guardrail` 物件，將
    [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    套用到所有 Bedrock 模型呼叫。防護機制可讓你強制執行內容篩選、
    主題拒絕、詞彙篩選、敏感資訊篩選，以及情境 grounding 檢查。

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

    `guardrailIdentifier` 和 `guardrailVersion` 為必填。

    | 選項 | 說明 |
    | ------ | ----------- |
    | `guardrailIdentifier` | Guardrail ID（例如 `abc123`）或完整 ARN（例如 `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`）。 |
    | `guardrailVersion` | 已發布的版本號碼，或工作草稿使用的 `"DRAFT"`。 |
    | `streamProcessingMode` | 串流期間進行 guardrail 評估時使用的 `"sync"` 或 `"async"`。若省略，Bedrock 會使用其預設值。 |
    | `trace` | 用於除錯的 `"enabled"` 或 `"enabled_full"`；生產環境請省略或設定為 `"disabled"`。 |

    <Warning>
    閘道使用的 IAM 主體除了標準呼叫權限外，還必須具備 `bedrock:ApplyGuardrail` 權限。
    </Warning>

  </Accordion>

  <Accordion title="記憶搜尋的嵌入">
    Bedrock 也可以作為
    [記憶搜尋](/zh-TW/concepts/memory-search)的嵌入提供者。這會與推論提供者分開設定 --
    將 `agents.defaults.memorySearch.provider` 設為 `"bedrock"`：

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

    Bedrock 嵌入會使用與推論相同的 AWS SDK 認證鏈（執行個體
    角色、SSO、存取金鑰、共用設定，以及 Web Identity）。不需要
    API 金鑰。

    支援的嵌入模型包括 Amazon Titan Embed（v1、v2）、Amazon Nova
    Embed、Cohere Embed（v3、v4）和 TwelveLabs Marengo。完整模型清單
    與維度選項，請參閱
    [記憶設定參考 -- Bedrock](/zh-TW/reference/memory-config#bedrock-embedding-config)。

  </Accordion>

  <Accordion title="注意事項與限制">
    - Bedrock 要求你的 AWS 帳戶/區域已啟用**模型存取權**。
    - 自動探索需要 `bedrock:ListFoundationModels` 和
      `bedrock:ListInferenceProfiles` 權限。
    - 如果你依賴自動模式，請在閘道主機上設定其中一個支援的 AWS 驗證環境標記。
      如果你偏好不使用環境標記的 IMDS/共用設定驗證，請設定
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`。
    - OpenClaw 會依下列順序呈現認證來源：`AWS_BEARER_TOKEN_BEDROCK`、
      接著是 `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`，再來是 `AWS_PROFILE`，最後是
      預設 AWS SDK 鏈。
    - 推理支援取決於模型；請查看 Bedrock 模型卡以取得
      目前功能。
    - 如果你偏好受管理的金鑰流程，也可以在 Bedrock 前方放置 OpenAI 相容
      代理，並改將其設定為 OpenAI 提供者。
  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型 ref 和容錯移轉行為。
  </Card>
  <Card title="記憶搜尋" href="/zh-TW/concepts/memory-search" icon="magnifying-glass">
    記憶搜尋設定的 Bedrock 嵌入。
  </Card>
  <Card title="記憶設定參考" href="/zh-TW/reference/memory-config#bedrock-embedding-config" icon="database">
    完整的 Bedrock 嵌入模型清單與維度選項。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    一般疑難排解與常見問題。
  </Card>
</CardGroup>

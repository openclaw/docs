---
read_when:
    - 您想要搭配 OpenClaw 使用由 Bedrock Mantle 託管的開源模型
    - 你需要適用於 GPT-OSS、Qwen、Kimi 或 GLM 的 Mantle OpenAI 相容端點
summary: 將 Amazon Bedrock Mantle（OpenAI 相容）模型與 OpenClaw 搭配使用
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-05-10T19:47:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 721eef5b7ff606b8c5e02234dae1b8d846b43ff9f3d7bf871f701bb3136fec0e
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw 包含一個內建的 **Amazon Bedrock Mantle** 提供者，可連線到
Mantle OpenAI 相容端點。Mantle 透過由 Bedrock 基礎架構支援的標準
`/v1/chat/completions` 介面，託管開源與第三方模型（GPT-OSS、Qwen、Kimi、GLM
及類似模型）。

| 屬性       | 值                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- |
| 提供者 ID    | `amazon-bedrock-mantle`                                                                     |
| API            | `openai-completions`（OpenAI 相容）或 `anthropic-messages`（Anthropic Messages 路由） |
| 驗證           | 明確的 `AWS_BEARER_TOKEN_BEDROCK`，或透過 IAM 憑證鏈產生的持有者權杖         |
| 預設區域 | `us-east-1`（可用 `AWS_REGION` 或 `AWS_DEFAULT_REGION` 覆寫）                            |

## 開始使用

選擇偏好的驗證方式，並依照設定步驟操作。

<Tabs>
  <Tab title="Explicit bearer token">
    **最適合：** 已經擁有 Mantle 持有者權杖的環境。

    <Steps>
      <Step title="Set the bearer token on the gateway host">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        也可以設定區域（預設為 `us-east-1`）：

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        已探索到的模型會顯示在 `amazon-bedrock-mantle` 提供者下方。除非你想覆寫預設值，否則不需要額外設定。
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM credentials">
    **最適合：** 使用 AWS SDK 相容憑證（共用設定、SSO、Web 身分、執行個體或任務角色）。

    <Steps>
      <Step title="Configure AWS credentials on the gateway host">
        任何 AWS SDK 相容的驗證來源都可使用：

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        OpenClaw 會自動從憑證鏈產生 Mantle 持有者權杖。
      </Step>
    </Steps>

    <Tip>
    當未設定 `AWS_BEARER_TOKEN_BEDROCK` 時，OpenClaw 會從 AWS 預設憑證鏈為你鑄造持有者權杖，包括共用憑證/設定設定檔、SSO、Web 身分，以及執行個體或任務角色。
    </Tip>

  </Tab>
</Tabs>

## 自動模型探索

設定 `AWS_BEARER_TOKEN_BEDROCK` 時，OpenClaw 會直接使用它。否則，
OpenClaw 會嘗試從 AWS 預設憑證鏈產生 Mantle 持有者權杖。接著會查詢該區域的
`/v1/models` 端點，以探索可用的 Mantle 模型。

| 行為          | 詳細資料                    |
| ----------------- | ------------------------- |
| 探索快取   | 結果會快取 1 小時 |
| IAM 權杖重新整理 | 每小時                    |

若要保持 Mantle Plugin 啟用，但停用自動探索與 IAM 持有者權杖產生，請停用 Plugin 擁有的探索切換：

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
持有者權杖與標準 [Amazon Bedrock](/zh-TW/providers/bedrock) 提供者使用的 `AWS_BEARER_TOKEN_BEDROCK` 相同。
</Note>

### 支援的區域

`us-east-1`、`us-east-2`、`us-west-2`、`ap-northeast-1`、
`ap-south-1`、`ap-southeast-3`、`eu-central-1`、`eu-west-1`、`eu-west-2`、
`eu-south-1`、`eu-north-1`、`sa-east-1`。

## 手動設定

如果你偏好使用明確設定，而非自動探索：

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

## 進階設定

<AccordionGroup>
  <Accordion title="Reasoning support">
    推理支援會從模型 ID 推斷，例如包含
    `thinking`、`reasoner` 或 `gpt-oss-120b` 等模式。OpenClaw 會在探索期間，自動為相符模型設定 `reasoning: true`。
  </Accordion>

  <Accordion title="Endpoint unavailability">
    如果 Mantle 端點無法使用或未傳回任何模型，該提供者會被靜默略過。OpenClaw 不會報錯；其他已設定的提供者會繼續正常運作。
  </Accordion>

  <Accordion title="Claude Opus 4.7 via the Anthropic Messages route">
    Mantle 也公開 Anthropic Messages 路由，透過相同的持有者驗證串流路徑承載 Claude 模型。Claude Opus 4.7（`amazon-bedrock-mantle/claude-opus-4.7`）可透過此路由呼叫，並使用提供者擁有的串流，因此 AWS 持有者權杖不會被視為 Anthropic API 金鑰。

    當你在 Mantle 提供者上固定 Anthropic Messages 模型時，OpenClaw 會針對該模型使用 `anthropic-messages` API 介面，而不是 `openai-completions`。驗證仍來自 `AWS_BEARER_TOKEN_BEDROCK`（或鑄造的 IAM 持有者權杖）。

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

  <Accordion title="Relationship to Amazon Bedrock provider">
    Bedrock Mantle 是不同於標準
    [Amazon Bedrock](/zh-TW/providers/bedrock) 提供者的獨立提供者。Mantle 使用 OpenAI 相容的 `/v1` 介面，而標準 Bedrock 提供者使用原生 Bedrock API。

    兩個提供者在存在時會共用相同的 `AWS_BEARER_TOKEN_BEDROCK` 憑證。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/zh-TW/providers/bedrock" icon="cloud">
    Anthropic Claude、Titan 及其他模型的原生 Bedrock 提供者。
  </Card>
  <Card title="Model selection" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照與容錯移轉行為。
  </Card>
  <Card title="OAuth and auth" href="/zh-TW/gateway/authentication" icon="key">
    驗證詳細資料與憑證重用規則。
  </Card>
  <Card title="Troubleshooting" href="/zh-TW/help/troubleshooting" icon="wrench">
    常見問題及其解決方式。
  </Card>
</CardGroup>

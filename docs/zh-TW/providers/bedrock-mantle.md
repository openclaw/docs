---
read_when:
    - 您想搭配 OpenClaw 使用 Bedrock Mantle 託管的 OSS 模型
    - 你需要 Mantle OpenAI 相容端點來使用 GPT-OSS、Qwen、Kimi 或 GLM
summary: 搭配 OpenClaw 使用 Amazon Bedrock Mantle（OpenAI 相容）模型
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-07-05T11:35:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c1c930ee91661df184de159cc9d0430b5e4f31a0b6b2f0664894901e0d018a3
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw 內建一個 **Amazon Bedrock Mantle** 供應器，可連線至
Mantle 的 OpenAI 相容端點。Mantle 透過由 Bedrock 基礎架構支援的標準
`/v1/chat/completions` 介面，託管開放原始碼和第三方模型（GPT-OSS、Qwen、Kimi、GLM 及類似模型）。Mantle 也透過 Anthropic Messages 路由
公開兩個 Anthropic Claude 模型。

| 屬性       | 值                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| 供應器 ID    | `amazon-bedrock-mantle`                                                                        |
| API            | 探索到的 OSS 模型使用 `openai-completions`，兩個 Claude 模型使用 `anthropic-messages` |
| 驗證           | 明確的 `AWS_BEARER_TOKEN_BEDROCK`，或透過 IAM 憑證鏈產生 bearer token            |
| 預設區域 | `us-east-1`（可用 `AWS_REGION` 或 `AWS_DEFAULT_REGION` 覆寫）                               |

## 開始使用

選擇偏好的驗證方式並依照設定步驟操作。

<Tabs>
  <Tab title="Explicit bearer token">
    **最適合：** 已經擁有 Mantle bearer token 的環境。

    <Steps>
      <Step title="Set the bearer token on the gateway host">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        可選擇設定區域（預設為 `us-east-1`）：

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        探索到的模型會顯示在 `amazon-bedrock-mantle` 供應器底下。除非你想覆寫預設值，否則不需要額外設定。
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM credentials">
    **最適合：** 使用 AWS SDK 相容憑證（共享設定、SSO、網路身分、執行個體或任務角色）。

    <Steps>
      <Step title="Configure AWS credentials on the gateway host">
        任何 AWS SDK 相容的驗證來源都可以使用：

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        OpenClaw 會自動從憑證鏈產生 Mantle bearer token。
      </Step>
    </Steps>

    <Tip>
    未設定 `AWS_BEARER_TOKEN_BEDROCK` 時，OpenClaw 會為你從 AWS 預設憑證鏈簽發 bearer token，包括共享憑證/設定檔、SSO、網路身分，以及執行個體或任務角色。
    </Tip>

  </Tab>
</Tabs>

## 自動模型探索

設定 `AWS_BEARER_TOKEN_BEDROCK` 時，OpenClaw 會直接使用它。否則，
OpenClaw 會嘗試從 AWS 預設憑證鏈產生 Mantle bearer token。接著它會查詢該區域的 `/v1/models` 端點，以探索可用的 Mantle 模型。

| 行為          | 詳細資訊                                                                               |
| ----------------- | ------------------------------------------------------------------------------------ |
| 探索快取   | 每個區域的結果快取 1 小時；擷取失敗會傳回最後一次快取的結果 |
| IAM token 重新整理 | 每 2 小時一次，依區域快取                                                     |

若要保持 Mantle 外掛啟用，但抑制自動探索和 IAM bearer token 產生，請停用外掛擁有的探索切換：

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
bearer token 與標準 [Amazon Bedrock](/zh-TW/providers/bedrock) 供應器使用的 `AWS_BEARER_TOKEN_BEDROCK` 相同。
</Note>

### 支援的區域

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## 手動設定

如果你偏好使用明確設定，而不是自動探索：

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
    推理支援會從包含特定模式的模型 ID 推斷，例如
    `thinking`、`reasoner`、`reasoning`、`deepseek.r`、`gpt-oss-120b` 或
    `gpt-oss-safeguard-120b`。OpenClaw 會在探索期間自動為相符的模型設定
    `reasoning: true`。
  </Accordion>

  <Accordion title="Endpoint unavailability">
    如果 Mantle 端點無法使用、未傳回任何模型，或 bearer token
    解析失敗，探索會傳回空結果，並略過隱含供應器。OpenClaw 不會報錯；其他已設定的供應器會繼續正常運作。
  </Accordion>

  <Accordion title="Claude Opus 4.7 and Claude Mythos Preview via the Anthropic Messages route">
    成功探索後，無論 `/v1/models` 傳回什麼，OpenClaw 一律會將兩個 Claude 模型附加到 Mantle 型錄：
    `amazon-bedrock-mantle/anthropic.claude-opus-4-7`（Claude Opus 4.7）和
    `amazon-bedrock-mantle/anthropic.claude-mythos-preview`（Claude Mythos
    Preview）。兩者都使用 `anthropic-messages` API 介面，並透過相同的 bearer 驗證 Anthropic 相容端點
    （`<mantle-base>/anthropic`）串流，因此 AWS bearer token 不會被當作
    Anthropic API 金鑰處理。

    Claude Mythos Preview 一律要求推理；未設定 `/think` 層級時，預設使用 `high`
    effort（從 `xhigh`/`max` 向下對應到
    `high`，並將 `minimal` 向上對應到 `low`）。Mantle 上的 Opus 4.7 會在沒有模型提供推理的情況下串流，而 OpenClaw 會省略其 `temperature` 參數，
    因為 Opus 4.7 在此路由上不接受取樣覆寫；Mythos
    Preview 則正常接受 `temperature` 覆寫。

    這兩個模型無法透過 `models.providers["amazon-bedrock-mantle"].models`
    項目設定；只要探索成功，它們一律會被加入，且只能透過完全停用探索來移除。

  </Accordion>

  <Accordion title="Relationship to Amazon Bedrock provider">
    Bedrock Mantle 是不同於標準
    [Amazon Bedrock](/zh-TW/providers/bedrock) 供應器的獨立供應器。Mantle 針對其 OSS 型錄使用
    OpenAI 相容的 `/v1` 介面，而標準
    Bedrock 供應器使用原生 Bedrock Converse API。

    兩個供應器在存在時會共用相同的 `AWS_BEARER_TOKEN_BEDROCK` 憑證。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/zh-TW/providers/bedrock" icon="cloud">
    用於 Anthropic Claude、Titan 和其他模型的原生 Bedrock 供應器。
  </Card>
  <Card title="Model selection" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應器、模型參照和容錯移轉行為。
  </Card>
  <Card title="OAuth and auth" href="/zh-TW/gateway/authentication" icon="key">
    驗證詳細資訊和憑證重用規則。
  </Card>
  <Card title="Troubleshooting" href="/zh-TW/help/troubleshooting" icon="wrench">
    常見問題及其解決方式。
  </Card>
</CardGroup>

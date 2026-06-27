---
read_when:
    - 你想要將 Bedrock Mantle 託管的 OSS 模型與 OpenClaw 搭配使用
    - 你需要 Mantle OpenAI 相容端點來使用 GPT-OSS、Qwen、Kimi 或 GLM
summary: 搭配 OpenClaw 使用 Amazon Bedrock Mantle（相容 OpenAI）模型
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-06-27T19:52:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e14026e4fb25b13994061f2aaa5294df44ce8fe1ba99e031b8c92a41a4a9b49
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw 包含一個內建的 **Amazon Bedrock Mantle** 提供者，可連線至
Mantle OpenAI 相容端點。Mantle 透過由 Bedrock 基礎架構支援的標準
`/v1/chat/completions` 介面，託管開放原始碼與
第三方模型（GPT-OSS、Qwen、Kimi、GLM 及類似模型）。

| 屬性           | 值                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------- |
| 提供者 ID      | `amazon-bedrock-mantle`                                                                     |
| API            | `openai-completions`（OpenAI 相容）或 `anthropic-messages`（Anthropic Messages 路由）       |
| 驗證           | 明確的 `AWS_BEARER_TOKEN_BEDROCK` 或 IAM 憑證鏈承載權杖產生                                  |
| 預設區域       | `us-east-1`（使用 `AWS_REGION` 或 `AWS_DEFAULT_REGION` 覆寫）                               |

## 開始使用

選擇偏好的驗證方法並依照設定步驟操作。

<Tabs>
  <Tab title="明確的承載權杖">
    **最適合：** 已經有 Mantle 承載權杖的環境。

    <Steps>
      <Step title="在閘道主機上設定承載權杖">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        也可以選擇性設定區域（預設為 `us-east-1`）：

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="選擇加入 Claude Fable 5 的提供者資料分享">
        Claude Fable 5 和 Claude Mythos 類 Bedrock 模型在叫用前需要 Mantle Data Retention API 模式 `provider_data_share`。此選擇加入允許 Bedrock 與 Anthropic 分享提示和完成內容，並保留最多 30 天以供信任與安全審查。

        ```bash
        AWS_REGION="${AWS_REGION:-us-east-1}"
        curl -X PUT "https://bedrock-mantle.${AWS_REGION}.api.aws/v1/data_retention" \
          -H "Authorization: Bearer $AWS_BEARER_TOKEN_BEDROCK" \
          -H "Content-Type: application/json" \
          -d '{ "mode": "provider_data_share" }'
        ```

        如果你無法接受該保留模式，請在設定中使用另一個 Bedrock 模型。
      </Step>
      <Step title="確認已探索到模型">
        ```bash
        openclaw models list
        ```

        探索到的模型會顯示在 `amazon-bedrock-mantle` 提供者底下。除非你想覆寫預設值，否則不需要額外設定。
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM 憑證">
    **最適合：** 使用 AWS SDK 相容憑證（共用設定、SSO、Web 身分、執行個體或任務角色）。

    <Steps>
      <Step title="在閘道主機上設定 AWS 憑證">
        任何 AWS SDK 相容的驗證來源都可使用：

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="確認已探索到模型">
        ```bash
        openclaw models list
        ```

        OpenClaw 會自動從憑證鏈產生 Mantle 承載權杖。
      </Step>
    </Steps>

    <Tip>
    當未設定 `AWS_BEARER_TOKEN_BEDROCK` 時，OpenClaw 會從 AWS 預設憑證鏈為你鑄造承載權杖，包括共用憑證/設定設定檔、SSO、Web 身分，以及執行個體或任務角色。
    </Tip>

  </Tab>
</Tabs>

## 自動模型探索

設定 `AWS_BEARER_TOKEN_BEDROCK` 時，OpenClaw 會直接使用它。否則，
OpenClaw 會嘗試從 AWS 預設憑證鏈產生 Mantle 承載權杖。接著它會透過查詢該區域的
`/v1/models` 端點來探索可用的 Mantle 模型。

| 行為             | 詳細資訊               |
| ---------------- | ---------------------- |
| 探索快取         | 結果快取 1 小時       |
| IAM 權杖重新整理 | 每小時                 |

若要保持 Mantle 外掛啟用，但抑制自動探索與 IAM
承載權杖產生，請停用外掛擁有的探索切換：

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
承載權杖與標準 [Amazon Bedrock](/zh-TW/providers/bedrock) 提供者使用的 `AWS_BEARER_TOKEN_BEDROCK` 相同。
</Note>

### 支援區域

`us-east-1`、`us-east-2`、`us-west-2`、`ap-northeast-1`、
`ap-south-1`、`ap-southeast-3`、`eu-central-1`、`eu-west-1`、`eu-west-2`、
`eu-south-1`、`eu-north-1`、`sa-east-1`。

## 手動設定

如果你偏好明確設定而非自動探索：

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
  <Accordion title="推理支援">
    推理支援會從包含 `thinking`、`reasoner` 或 `gpt-oss-120b` 等模式的模型 ID 推斷。OpenClaw 會在探索期間自動為相符模型設定 `reasoning: true`。
  </Accordion>

  <Accordion title="端點無法使用">
    如果 Mantle 端點無法使用或未傳回任何模型，提供者會被靜默略過。OpenClaw 不會報錯；其他已設定的提供者會繼續正常運作。
  </Accordion>

  <Accordion title="透過 Anthropic Messages 路由使用 Claude Opus 4.7">
    Mantle 也公開一個 Anthropic Messages 路由，透過同一個承載驗證的串流路徑承載 Claude 模型。Claude Opus 4.7（`amazon-bedrock-mantle/claude-opus-4.7`）可透過此路由以提供者擁有的串流呼叫，因此 AWS 承載權杖不會被視為 Anthropic API 金鑰。

    當你在 Mantle 提供者上釘選 Anthropic Messages 模型時，OpenClaw 會對該模型使用 `anthropic-messages` API 介面，而不是 `openai-completions`。驗證仍來自 `AWS_BEARER_TOKEN_BEDROCK`（或鑄造的 IAM 承載權杖）。

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

  <Accordion title="與 Amazon Bedrock 提供者的關係">
    Bedrock Mantle 是與標準
    [Amazon Bedrock](/zh-TW/providers/bedrock) 提供者分開的提供者。Mantle 使用
    OpenAI 相容的 `/v1` 介面，而標準 Bedrock 提供者使用
    原生 Bedrock API。

    兩個提供者在存在時會共用相同的 `AWS_BEARER_TOKEN_BEDROCK` 憑證。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/zh-TW/providers/bedrock" icon="cloud">
    用於 Anthropic Claude、Titan 和其他模型的原生 Bedrock 提供者。
  </Card>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照和容錯移轉行為。
  </Card>
  <Card title="OAuth 與驗證" href="/zh-TW/gateway/authentication" icon="key">
    驗證詳細資訊與憑證重用規則。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    常見問題與解決方式。
  </Card>
</CardGroup>

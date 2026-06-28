---
read_when:
    - Bedrock Mantle tarafından barındırılan OSS modellerini OpenClaw ile kullanmak istiyorsunuz
    - GPT-OSS, Qwen, Kimi veya GLM için Mantle OpenAI uyumlu uç noktasına ihtiyacınız var
summary: Amazon Bedrock Mantle (OpenAI uyumlu) modellerini OpenClaw ile kullanın
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-06-28T01:08:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e14026e4fb25b13994061f2aaa5294df44ce8fe1ba99e031b8c92a41a4a9b49
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw, Mantle OpenAI uyumlu uç noktasına bağlanan yerleşik bir **Amazon Bedrock Mantle** sağlayıcısı içerir. Mantle, açık kaynaklı ve üçüncü taraf modelleri (GPT-OSS, Qwen, Kimi, GLM ve benzerleri) Bedrock altyapısıyla desteklenen standart bir `/v1/chat/completions` yüzeyi üzerinden barındırır.

| Özellik          | Değer                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Sağlayıcı kimliği | `amazon-bedrock-mantle`                                                                       |
| API              | `openai-completions` (OpenAI uyumlu) veya `anthropic-messages` (Anthropic Messages rotası)    |
| Kimlik doğrulama | Açık `AWS_BEARER_TOKEN_BEDROCK` veya IAM kimlik bilgisi zinciriyle bearer-token oluşturma     |
| Varsayılan bölge | `us-east-1` (`AWS_REGION` veya `AWS_DEFAULT_REGION` ile geçersiz kılın)                       |

## Başlarken

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="Explicit bearer token">
    **En uygun olduğu durum:** Zaten bir Mantle bearer token'ınızın bulunduğu ortamlar.

    <Steps>
      <Step title="Set the bearer token on the gateway host">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        İsteğe bağlı olarak bir bölge ayarlayın (varsayılan `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Opt in to provider data sharing for Claude Fable 5">
        Claude Fable 5 ve Claude Mythos sınıfı Bedrock modelleri, çağrıdan önce Mantle Data Retention API modu `provider_data_share` gerektirir. Bu katılım, Bedrock'un istemleri ve tamamlamaları Anthropic ile paylaşmasına ve güvenlik ile emniyet incelemesi için bunları 30 güne kadar saklamasına izin verir.

        ```bash
        AWS_REGION="${AWS_REGION:-us-east-1}"
        curl -X PUT "https://bedrock-mantle.${AWS_REGION}.api.aws/v1/data_retention" \
          -H "Authorization: Bearer $AWS_BEARER_TOKEN_BEDROCK" \
          -H "Content-Type: application/json" \
          -d '{ "mode": "provider_data_share" }'
        ```

        Bu saklama modunu kabul edemiyorsanız yapılandırmada başka bir Bedrock modeli kullanın.
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        Keşfedilen modeller `amazon-bedrock-mantle` sağlayıcısı altında görünür. Varsayılanları geçersiz kılmak istemediğiniz sürece ek yapılandırma gerekmez.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM credentials">
    **En uygun olduğu durum:** AWS SDK uyumlu kimlik bilgilerini kullanmak (paylaşılan yapılandırma, SSO, web kimliği, örnek veya görev rolleri).

    <Steps>
      <Step title="Configure AWS credentials on the gateway host">
        Herhangi bir AWS SDK uyumlu kimlik doğrulama kaynağı çalışır:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        OpenClaw, kimlik bilgisi zincirinden otomatik olarak bir Mantle bearer token oluşturur.
      </Step>
    </Steps>

    <Tip>
    `AWS_BEARER_TOKEN_BEDROCK` ayarlanmadığında OpenClaw, paylaşılan kimlik bilgileri/yapılandırma profilleri, SSO, web kimliği ve örnek veya görev rolleri dahil olmak üzere AWS varsayılan kimlik bilgisi zincirinden sizin için bearer token üretir.
    </Tip>

  </Tab>
</Tabs>

## Otomatik model keşfi

`AWS_BEARER_TOKEN_BEDROCK` ayarlandığında OpenClaw bunu doğrudan kullanır. Aksi halde OpenClaw, AWS varsayılan kimlik bilgisi zincirinden bir Mantle bearer token oluşturmaya çalışır. Ardından bölgenin `/v1/models` uç noktasını sorgulayarak kullanılabilir Mantle modellerini keşfeder.

| Davranış         | Ayrıntı                         |
| ---------------- | -------------------------------- |
| Keşif önbelleği  | Sonuçlar 1 saat önbelleğe alınır |
| IAM token yenileme | Saatlik                        |

Mantle Plugin'i etkin tutup otomatik keşfi ve IAM bearer-token oluşturmayı bastırmak için Plugin'e ait keşif anahtarını devre dışı bırakın:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
Bearer token, standart [Amazon Bedrock](/tr/providers/bedrock) sağlayıcısı tarafından kullanılan aynı `AWS_BEARER_TOKEN_BEDROCK` değeridir.
</Note>

### Desteklenen bölgeler

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Manuel yapılandırma

Otomatik keşif yerine açık yapılandırmayı tercih ediyorsanız:

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

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Reasoning support">
    Reasoning desteği, model kimliklerinde `thinking`, `reasoner` veya `gpt-oss-120b` gibi kalıpların bulunmasından çıkarılır. OpenClaw, keşif sırasında eşleşen modeller için `reasoning: true` değerini otomatik olarak ayarlar.
  </Accordion>

  <Accordion title="Endpoint unavailability">
    Mantle uç noktası kullanılamıyorsa veya hiç model döndürmüyorsa sağlayıcı sessizce atlanır. OpenClaw hata vermez; yapılandırılmış diğer sağlayıcılar normal şekilde çalışmaya devam eder.
  </Accordion>

  <Accordion title="Claude Opus 4.7 via the Anthropic Messages route">
    Mantle ayrıca Claude modellerini aynı bearer ile kimliği doğrulanmış akış yolu üzerinden taşıyan bir Anthropic Messages rotası sunar. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`), sağlayıcıya ait akışla bu rota üzerinden çağrılabilir; bu nedenle AWS bearer token'ları Anthropic API anahtarları gibi ele alınmaz.

    Mantle sağlayıcısında bir Anthropic Messages modelini sabitlediğinizde OpenClaw, o model için `openai-completions` yerine `anthropic-messages` API yüzeyini kullanır. Kimlik doğrulama yine `AWS_BEARER_TOKEN_BEDROCK` üzerinden (veya üretilen IAM bearer token ile) gelir.

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
    Bedrock Mantle, standart [Amazon Bedrock](/tr/providers/bedrock) sağlayıcısından ayrı bir sağlayıcıdır. Mantle OpenAI uyumlu bir `/v1` yüzeyi kullanırken, standart Bedrock sağlayıcısı yerel Bedrock API'sini kullanır.

    Her iki sağlayıcı da mevcut olduğunda aynı `AWS_BEARER_TOKEN_BEDROCK` kimlik bilgisini paylaşır.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/tr/providers/bedrock" icon="cloud">
    Anthropic Claude, Titan ve diğer modeller için yerel Bedrock sağlayıcısı.
  </Card>
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve yük devretme davranışını seçme.
  </Card>
  <Card title="OAuth and auth" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
  <Card title="Troubleshooting" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve bunların nasıl çözüleceği.
  </Card>
</CardGroup>

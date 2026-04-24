---
read_when:
    - OpenClaw ile Bedrock Mantle üzerinde barındırılan OSS modellerini kullanmak istiyorsunuz
    - GPT-OSS, Qwen, Kimi veya GLM için Mantle OpenAI uyumlu uç noktasına ihtiyacınız var
summary: OpenClaw ile Amazon Bedrock Mantle (OpenAI uyumlu) modellerini kullanın
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-24T09:25:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5e9fb65cd5f5151470f0d8eeb9edceb9b035863dcd863d2bcabe233c1cfce41
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

OpenClaw, Mantle OpenAI uyumlu uç noktaya bağlanan paketle gelen bir **Amazon Bedrock Mantle** sağlayıcısı içerir. Mantle, açık kaynak ve üçüncü taraf modelleri (GPT-OSS, Qwen, Kimi, GLM ve benzerleri) Bedrock altyapısı tarafından desteklenen standart bir `/v1/chat/completions` yüzeyi üzerinden barındırır.

| Özellik        | Değer                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------ |
| Sağlayıcı ID   | `amazon-bedrock-mantle`                                                                    |
| API            | `openai-completions` (OpenAI uyumlu) veya `anthropic-messages` (Anthropic Messages yolu) |
| Kimlik doğrulama | Açık `AWS_BEARER_TOKEN_BEDROCK` veya IAM kimlik bilgisi zinciriyle bearer token üretimi |
| Varsayılan bölge | `us-east-1` (`AWS_REGION` veya `AWS_DEFAULT_REGION` ile geçersiz kılınabilir)          |

## Başlarken

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="Açık bearer token">
    **Şunun için en uygunu:** elinizde zaten bir Mantle bearer token bulunan ortamlar.

    <Steps>
      <Step title="Gateway ana bilgisayarında bearer token ayarlayın">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        İsteğe bağlı olarak bir bölge ayarlayın (varsayılan `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Modellerin keşfedildiğini doğrulayın">
        ```bash
        openclaw models list
        ```

        Keşfedilen modeller `amazon-bedrock-mantle` sağlayıcısı altında görünür. Varsayılanları geçersiz kılmak istemediğiniz sürece ek yapılandırma gerekmez.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM kimlik bilgileri">
    **Şunun için en uygunu:** AWS SDK uyumlu kimlik bilgileri kullanmak (paylaşılan yapılandırma, SSO, web identity, instance veya task rolleri).

    <Steps>
      <Step title="Gateway ana bilgisayarında AWS kimlik bilgilerini yapılandırın">
        AWS SDK uyumlu herhangi bir kimlik doğrulama kaynağı çalışır:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Modellerin keşfedildiğini doğrulayın">
        ```bash
        openclaw models list
        ```

        OpenClaw, kimlik bilgisi zincirinden otomatik olarak bir Mantle bearer token üretir.
      </Step>
    </Steps>

    <Tip>
    `AWS_BEARER_TOKEN_BEDROCK` ayarlı değilse OpenClaw, paylaşılan kimlik bilgileri/yapılandırma profilleri, SSO, web identity ve instance veya task rolleri dahil olmak üzere AWS varsayılan kimlik bilgisi zincirinden bearer token'ı sizin için üretir.
    </Tip>

  </Tab>
</Tabs>

## Otomatik model keşfi

`AWS_BEARER_TOKEN_BEDROCK` ayarlandığında OpenClaw bunu doğrudan kullanır. Aksi durumda
OpenClaw, AWS varsayılan kimlik bilgisi zincirinden bir Mantle bearer token üretmeye çalışır. Ardından
bölgenin `/v1/models` uç noktasını sorgulayarak kullanılabilir Mantle modellerini keşfeder.

| Davranış          | Ayrıntı                     |
| ----------------- | --------------------------- |
| Keşif önbelleği   | Sonuçlar 1 saat önbelleklenir |
| IAM token yenileme | Saatlik                    |

<Note>
Bearer token, standart [Amazon Bedrock](/tr/providers/bedrock) sağlayıcısının kullandığı aynı `AWS_BEARER_TOKEN_BEDROCK` değeridir.
</Note>

### Desteklenen bölgeler

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Elle yapılandırma

Otomatik keşif yerine açık yapılandırma tercih ediyorsanız:

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
  <Accordion title="Akıl yürütme desteği">
    Akıl yürütme desteği, `thinking`, `reasoner` veya `gpt-oss-120b` gibi kalıpları içeren model kimliklerinden çıkarılır. OpenClaw, keşif sırasında eşleşen modeller için otomatik olarak `reasoning: true` ayarlar.
  </Accordion>

  <Accordion title="Uç nokta kullanılamıyor">
    Mantle uç noktası kullanılamıyorsa veya hiç model döndürmüyorsa sağlayıcı sessizce atlanır. OpenClaw hata vermez; yapılandırılmış diğer sağlayıcılar normal şekilde çalışmaya devam eder.
  </Accordion>

  <Accordion title="Anthropic Messages yolu üzerinden Claude Opus 4.7">
    Mantle, Claude modellerini aynı bearer kimlik doğrulamalı akış yolu üzerinden taşıyan bir Anthropic Messages yolu da sunar. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) bu yol üzerinden sağlayıcıya ait akış ile çağrılabilir; böylece AWS bearer token'ları Anthropic API anahtarları gibi değerlendirilmez.

    Mantle sağlayıcısında bir Anthropic Messages modelini sabitlediğinizde OpenClaw, o model için `openai-completions` yerine `anthropic-messages` API yüzeyini kullanır. Kimlik doğrulama yine `AWS_BEARER_TOKEN_BEDROCK` değerinden (veya üretilen IAM bearer token'ından) gelir.

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

  <Accordion title="Amazon Bedrock sağlayıcısıyla ilişkisi">
    Bedrock Mantle, standart [Amazon Bedrock](/tr/providers/bedrock) sağlayıcısından ayrı bir sağlayıcıdır. Mantle bir OpenAI uyumlu `/v1` yüzeyi kullanırken standart Bedrock sağlayıcısı yerel Bedrock API'sini kullanır.

    Her iki sağlayıcı da, mevcut olduğunda aynı `AWS_BEARER_TOKEN_BEDROCK` kimlik bilgisini paylaşır.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/tr/providers/bedrock" icon="cloud">
    Anthropic Claude, Titan ve diğer modeller için yerel Bedrock sağlayıcısı.
  </Card>
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve devretme davranışını seçme.
  </Card>
  <Card title="OAuth and auth" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
  <Card title="Troubleshooting" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve çözüm yolları.
  </Card>
</CardGroup>

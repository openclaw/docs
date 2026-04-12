---
read_when:
    - OpenClaw ile Bedrock Mantle tarafından barındırılan OSS modellerini kullanmak istiyorsunuz
    - GPT-OSS, Qwen, Kimi veya GLM için Mantle OpenAI uyumlu uç noktasına ihtiyacınız var
summary: OpenClaw ile Amazon Bedrock Mantle (OpenAI uyumlu) modellerini kullanın
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-12T23:29:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 27e602b6f6a3ae92427de135cb9df6356e0daaea6b6fe54723a7542dd0d5d21e
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

OpenClaw, Mantle OpenAI uyumlu uç noktasına bağlanan paketlenmiş bir **Amazon Bedrock Mantle** sağlayıcısı içerir. Mantle, Bedrock altyapısıyla desteklenen standart bir `/v1/chat/completions` yüzeyi üzerinden açık kaynaklı ve üçüncü taraf modelleri (GPT-OSS, Qwen, Kimi, GLM ve benzerleri) barındırır.

| Property       | Value                                                                               |
| -------------- | ----------------------------------------------------------------------------------- |
| Sağlayıcı kimliği | `amazon-bedrock-mantle`                                                          |
| API            | `openai-completions` (OpenAI uyumlu)                                                |
| Kimlik doğrulama | Açık `AWS_BEARER_TOKEN_BEDROCK` veya IAM kimlik bilgisi zinciriyle bearer token üretimi |
| Varsayılan bölge | `us-east-1` (`AWS_REGION` veya `AWS_DEFAULT_REGION` ile geçersiz kılınabilir)    |

## Başlangıç

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="Açık bearer token">
    **Şunun için en iyisi:** zaten bir Mantle bearer token'ınız olan ortamlar.

    <Steps>
      <Step title="Gateway ana bilgisayarında bearer token'ı ayarlayın">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        İsteğe bağlı olarak bir bölge ayarlayın (varsayılan `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Modellerin bulunduğunu doğrulayın">
        ```bash
        openclaw models list
        ```

        Bulunan modeller `amazon-bedrock-mantle` sağlayıcısı altında görünür. Varsayılanları geçersiz kılmak istemiyorsanız ek yapılandırma gerekmez.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM kimlik bilgileri">
    **Şunun için en iyisi:** AWS SDK uyumlu kimlik bilgilerini kullanmak (paylaşılan yapılandırma, SSO, web identity, instance veya task rolleri).

    <Steps>
      <Step title="Gateway ana bilgisayarında AWS kimlik bilgilerini yapılandırın">
        Herhangi bir AWS SDK uyumlu kimlik doğrulama kaynağı çalışır:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Modellerin bulunduğunu doğrulayın">
        ```bash
        openclaw models list
        ```

        OpenClaw, kimlik bilgisi zincirinden otomatik olarak bir Mantle bearer token üretir.
      </Step>
    </Steps>

    <Tip>
    `AWS_BEARER_TOKEN_BEDROCK` ayarlanmamışsa OpenClaw, paylaşılan kimlik bilgileri/yapılandırma profilleri, SSO, web identity ve instance veya task rolleri dahil olmak üzere AWS varsayılan kimlik bilgisi zincirinden sizin için bearer token üretir.
    </Tip>

  </Tab>
</Tabs>

## Otomatik model bulma

`AWS_BEARER_TOKEN_BEDROCK` ayarlandığında OpenClaw bunu doğrudan kullanır. Aksi halde OpenClaw, AWS varsayılan kimlik bilgisi zincirinden bir Mantle bearer token üretmeye çalışır. Ardından bölgenin `/v1/models` uç noktasını sorgulayarak kullanılabilir Mantle modellerini bulur.

| Davranış         | Ayrıntı                  |
| ---------------- | ------------------------ |
| Bulma önbelleği  | Sonuçlar 1 saat önbelleğe alınır |
| IAM token yenileme | Saatlik                |

<Note>
Bearer token, standart [Amazon Bedrock](/tr/providers/bedrock) sağlayıcısı tarafından kullanılan aynı `AWS_BEARER_TOKEN_BEDROCK` değeridir.
</Note>

### Desteklenen bölgeler

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## El ile yapılandırma

Otomatik bulma yerine açık yapılandırmayı tercih ediyorsanız:

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

## Gelişmiş notlar

<AccordionGroup>
  <Accordion title="Akıl yürütme desteği">
    Akıl yürütme desteği, `thinking`, `reasoner` veya `gpt-oss-120b` gibi desenler içeren model kimliklerinden çıkarılır. OpenClaw, bulma sırasında eşleşen modeller için otomatik olarak `reasoning: true` ayarlar.
  </Accordion>

  <Accordion title="Uç nokta kullanılamıyor">
    Mantle uç noktası kullanılamıyorsa veya hiç model döndürmüyorsa sağlayıcı sessizce atlanır. OpenClaw hata vermez; yapılandırılmış diğer sağlayıcılar normal şekilde çalışmaya devam eder.
  </Accordion>

  <Accordion title="Amazon Bedrock sağlayıcısıyla ilişkisi">
    Bedrock Mantle, standart [Amazon Bedrock](/tr/providers/bedrock) sağlayıcısından ayrı bir sağlayıcıdır. Mantle, OpenAI uyumlu bir `/v1` yüzeyi kullanırken standart Bedrock sağlayıcısı yerel Bedrock API'sini kullanır.

    Her iki sağlayıcı da mevcut olduğunda aynı `AWS_BEARER_TOKEN_BEDROCK` kimlik bilgisini paylaşır.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/tr/providers/bedrock" icon="cloud">
    Anthropic Claude, Titan ve diğer modeller için yerel Bedrock sağlayıcısı.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve devralma davranışını seçme.
  </Card>
  <Card title="OAuth ve kimlik doğrulama" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgisi yeniden kullanma kuralları.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve bunların nasıl çözüleceği.
  </Card>
</CardGroup>

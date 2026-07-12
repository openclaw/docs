---
read_when:
    - Bedrock Mantle üzerinde barındırılan açık kaynak modellerini OpenClaw ile kullanmak istiyorsunuz
    - GPT-OSS, Qwen, Kimi veya GLM için Mantle'ın OpenAI uyumlu uç noktasına ihtiyacınız var
    - Amazon Bedrock Mantle üzerinden Claude Sonnet 5 veya Mythos 5 kullanmak istiyorsunuz
summary: Amazon Bedrock Mantle'ın OpenAI uyumlu ve Claude Messages modellerini OpenClaw ile kullanın
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-07-12T12:07:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 107ffdc76e3971a085f7d64d8d766f6cd8706ce882d8bab80d27c72ab545eec1
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw, Mantle OpenAI uyumlu uç noktasına bağlanan, paketle birlikte sunulan bir **Amazon Bedrock Mantle** sağlayıcısı içerir. Mantle, Bedrock altyapısıyla desteklenen standart bir `/v1/chat/completions` yüzeyi üzerinden açık kaynaklı ve üçüncü taraf modelleri (GPT-OSS, Qwen, Kimi, GLM ve benzerleri) barındırır. Mantle ayrıca Anthropic Claude modellerini bir Anthropic Messages rotası üzerinden sunar.

| Özellik        | Değer                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| Sağlayıcı kimliği | `amazon-bedrock-mantle`                                                                                 |
| API            | Keşfedilen OSS modelleri için `openai-completions`, Claude modelleri için `anthropic-messages`              |
| Kimlik doğrulama | Açıkça belirtilen `AWS_BEARER_TOKEN_BEDROCK` veya IAM kimlik bilgisi zinciriyle bearer token oluşturma    |
| Varsayılan bölge | `us-east-1` (`AWS_REGION` veya `AWS_DEFAULT_REGION` ile geçersiz kılınabilir)                             |

## Başlarken

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="Açıkça belirtilen bearer token">
    **En uygun kullanım:** Zaten bir Mantle bearer token'ına sahip olduğunuz ortamlar.

    <Steps>
      <Step title="Bearer token'ı Gateway ana makinesinde ayarlayın">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        İsteğe bağlı olarak bir bölge ayarlayın (varsayılan: `us-east-1`):

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
    **En uygun kullanım:** AWS SDK uyumlu kimlik bilgilerinin kullanılması (paylaşılan yapılandırma, SSO, web kimliği, bulut sunucusu veya görev rolleri).

    <Steps>
      <Step title="AWS kimlik bilgilerini Gateway ana makinesinde yapılandırın">
        AWS SDK ile uyumlu herhangi bir kimlik doğrulama kaynağı kullanılabilir:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Modellerin keşfedildiğini doğrulayın">
        ```bash
        openclaw models list
        ```

        OpenClaw, kimlik bilgisi zincirinden otomatik olarak bir Mantle bearer token'ı oluşturur.
      </Step>
    </Steps>

    <Tip>
    `AWS_BEARER_TOKEN_BEDROCK` ayarlanmadığında OpenClaw; paylaşılan kimlik bilgileri/yapılandırma profilleri, SSO, web kimliği ve bulut sunucusu veya görev rolleri dâhil olmak üzere AWS varsayılan kimlik bilgisi zincirinden sizin için bearer token oluşturur.
    </Tip>

  </Tab>
</Tabs>

## Otomatik model keşfi

`AWS_BEARER_TOKEN_BEDROCK` ayarlandığında OpenClaw bunu doğrudan kullanır. Aksi hâlde OpenClaw, AWS varsayılan kimlik bilgisi zincirinden bir Mantle bearer token'ı oluşturmaya çalışır. Ardından bölgenin `/v1/models` uç noktasını sorgulayarak kullanılabilir Mantle modellerini keşfeder.

| Davranış          | Ayrıntı                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| Keşif önbelleği   | Sonuçlar bölge başına 1 saat önbelleğe alınır; getirme hatasında son önbelleğe alınmış sonuç döndürülür |
| IAM token yenileme | Bölge başına önbelleğe alınarak 2 saatte bir                                                     |

Mantle Plugin'ini etkin tutarken otomatik keşfi ve IAM bearer token oluşturmayı devre dışı bırakmak için Plugin'e ait keşif anahtarını kapatın:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
Bearer token, standart [Amazon Bedrock](/tr/providers/bedrock) sağlayıcısının kullandığı `AWS_BEARER_TOKEN_BEDROCK` ile aynıdır.
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

Açıkça belirtilen ve boş olmayan bir `models` listesi belirleyicidir ve aşağıdaki Claude satırları dâhil olmak üzere keşfedilen tüm satırların yerini alır. Otomatik Mantle kataloğunu korumak için `models` alanını atlayın veya kullanmak istediğiniz Claude modellerinin tüm girdilerini ekleyin.

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Akıl yürütme desteği">
    Akıl yürütme desteği; `thinking`, `reasoner`, `reasoning`, `deepseek.r`, `gpt-oss-120b` veya `gpt-oss-safeguard-120b` gibi kalıpları içeren model kimliklerinden çıkarılır. OpenClaw, keşif sırasında eşleşen modeller için otomatik olarak `reasoning: true` ayarlar.
  </Accordion>

  <Accordion title="Uç noktanın kullanılamaması">
    Mantle uç noktası kullanılamıyorsa, model döndürmüyorsa veya bearer token çözümlemesi başarısız oluyorsa keşif boş bir sonuç döndürür ve örtük sağlayıcı atlanır. OpenClaw hata vermez; yapılandırılmış diğer sağlayıcılar normal şekilde çalışmaya devam eder.
  </Accordion>

  <Accordion title="Anthropic Messages rotası üzerinden Claude">
    Model listesi otomatik keşif tarafından yönetildiğinde OpenClaw, `/v1/models` yanıtından bağımsız olarak başarılı bir sorgulamadan sonra dört Claude modeli ekler: `amazon-bedrock-mantle/anthropic.claude-sonnet-5` (Claude Sonnet 5), `amazon-bedrock-mantle/anthropic.claude-opus-4-7` (Claude Opus 4.7), `amazon-bedrock-mantle/anthropic.claude-mythos-5` (Claude Mythos 5) ve `amazon-bedrock-mantle/anthropic.claude-mythos-preview` (Claude Mythos Preview). Bunlar `anthropic-messages` API yüzeyini kullanır ve bearer kimlik doğrulamalı, Anthropic uyumlu aynı uç nokta (`<mantle-base>/anthropic`) üzerinden akış gerçekleştirir; dolayısıyla AWS bearer token'ı bir Anthropic API anahtarı olarak değerlendirilmez.

    Claude Sonnet 5 her zaman uyarlamalı düşünmeyi kullanır ve varsayılan çaba düzeyi `high` olur. Mantle rotası düşünmeyi devre dışı bırakamadığından `/think off` ve `/think minimal`, `low` olarak eşlenir. OpenClaw ayrıca Sonnet 5 isteklerinde özel sıcaklık değerini kullanmaz.

    Claude Mythos 5 sınırlı erişime sahiptir. 1.000.000 token'lık bağlam penceresi ve 128.000 token'lık çıktı sınırı sunar; her zaman uyarlamalı düşünmeyi kullanır, `/think off` ve `/think minimal` değerlerini `low` olarak eşler ve çağıran tarafından seçilen örnekleme parametrelerini kullanmaz.

    Claude Mythos Preview her zaman akıl yürütme talep eder ve `/think` düzeyi ayarlanmadığında varsayılan çaba düzeyi `high` olur (`xhigh`/`max`, `high` düzeyine; `minimal` ise `low` düzeyine eşlenir). Mantle üzerindeki Opus 4.7, model tarafından sağlanan akıl yürütme olmadan akış gerçekleştirir. Opus 4.7 bu rotada örnekleme geçersiz kılmalarını kabul etmediğinden OpenClaw, `temperature` parametresini kullanmaz; Mythos Preview ise `temperature` geçersiz kılmasını normal şekilde kabul eder.

    Boş olmayan açık bir `models.providers["amazon-bedrock-mantle"].models` listesi, keşfedilen kataloğun tamamının yerini alır. Yerleşik Claude satırlarını kullanmak istediğinizde bu listeyi atlayın.

  </Accordion>

  <Accordion title="Amazon Bedrock sağlayıcısıyla ilişkisi">
    Bedrock Mantle, standart [Amazon Bedrock](/tr/providers/bedrock) sağlayıcısından ayrı bir sağlayıcıdır. Mantle, OSS kataloğu için OpenAI uyumlu bir `/v1` yüzeyi kullanırken standart Bedrock sağlayıcısı yerel Bedrock Converse API'sini kullanır.

    Mevcut olduğunda her iki sağlayıcı da aynı `AWS_BEARER_TOKEN_BEDROCK` kimlik bilgisini paylaşır.

  </Accordion>
</AccordionGroup>

## İlgili konular

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/tr/providers/bedrock" icon="cloud">
    Anthropic Claude, Titan ve diğer modeller için yerel Bedrock sağlayıcısı.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıların, model referanslarının ve yük devretme davranışının seçilmesi.
  </Card>
  <Card title="OAuth ve kimlik doğrulama" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgilerini yeniden kullanma kuralları.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve bunların nasıl çözüleceği.
  </Card>
</CardGroup>

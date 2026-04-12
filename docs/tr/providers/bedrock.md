---
read_when:
    - Amazon Bedrock modellerini OpenClaw ile kullanmak istiyorsunuz
    - Model çağrıları için AWS kimlik bilgileri/bölge kurulumuna ihtiyacınız var
summary: Amazon Bedrock (Converse API) modellerini OpenClaw ile kullanın
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-12T23:29:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88e7e24907ec26af098b648e2eeca32add090a9e381c818693169ab80aeccc47
    source_path: providers/bedrock.md
    workflow: 15
---

# Amazon Bedrock

OpenClaw, pi-ai'nin **Bedrock Converse**
akış sağlayıcısı üzerinden **Amazon Bedrock** modellerini kullanabilir. Bedrock kimlik doğrulaması,
API anahtarı değil, **AWS SDK varsayılan kimlik bilgisi zinciri** kullanır.

| Özellik | Değer                                                      |
| ------- | ---------------------------------------------------------- |
| Sağlayıcı | `amazon-bedrock`                                         |
| API     | `bedrock-converse-stream`                                  |
| Kimlik doğrulama | AWS kimlik bilgileri (ortam değişkenleri, paylaşılan yapılandırma veya instance rolü) |
| Bölge   | `AWS_REGION` veya `AWS_DEFAULT_REGION` (varsayılan: `us-east-1`) |

## Başlangıç

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="Erişim anahtarları / ortam değişkenleri">
    **En iyi kullanım alanı:** geliştirici makineleri, CI veya AWS kimlik bilgilerini doğrudan yönettiğiniz ana makineler.

    <Steps>
      <Step title="Gateway ana makinesinde AWS kimlik bilgilerini ayarlayın">
        ```bash
        export AWS_ACCESS_KEY_ID="AKIA..."
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # İsteğe bağlı:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # İsteğe bağlı (Bedrock API anahtarı/bearer token):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Yapılandırmanıza bir Bedrock sağlayıcısı ve model ekleyin">
        `apiKey` gerekli değildir. Sağlayıcıyı `auth: "aws-sdk"` ile yapılandırın:

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
      <Step title="Modellerin kullanılabildiğini doğrulayın">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    Ortam işaretleyici kimlik doğrulamasıyla (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` veya `AWS_BEARER_TOKEN_BEDROCK`), OpenClaw ek yapılandırma olmadan model keşfi için örtük Bedrock sağlayıcısını otomatik olarak etkinleştirir.
    </Tip>

  </Tab>

  <Tab title="EC2 instance rolleri (IMDS)">
    **En iyi kullanım alanı:** Kimlik doğrulama için instance metadata service kullanan, iliştirilmiş IAM rolüne sahip EC2 instance'ları.

    <Steps>
      <Step title="Keşfi açıkça etkinleştirin">
        IMDS kullanırken OpenClaw AWS kimlik doğrulamasını yalnızca ortam işaretleyicilerinden algılayamaz, bu nedenle açıkça etkinleştirmeniz gerekir:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Otomatik mod için isteğe bağlı bir ortam işaretleyicisi ekleyin">
        Ortam işaretleyici otomatik algılama yolunun da çalışmasını istiyorsanız (örneğin `openclaw status` yüzeyleri için):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        Sahte bir API anahtarına **ihtiyacınız yoktur**.
      </Step>
      <Step title="Modellerin keşfedildiğini doğrulayın">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    EC2 instance'ınıza iliştirilen IAM rolü şu izinlere sahip olmalıdır:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (otomatik keşif için)
    - `bedrock:ListInferenceProfiles` (inference profile keşfi için)

    Veya yönetilen `AmazonBedrockFullAccess` politikasını iliştirin.
    </Warning>

    <Note>
    Yalnızca otomatik mod veya durum yüzeyleri için özellikle bir ortam işaretleyicisi istiyorsanız `AWS_PROFILE=default` gerekir. Gerçek Bedrock çalışma zamanı kimlik doğrulama yolu AWS SDK varsayılan zincirini kullandığından, IMDS instance-rolü kimlik doğrulaması ortam işaretleyicileri olmadan da çalışır.
    </Note>

  </Tab>
</Tabs>

## Otomatik model keşfi

OpenClaw, **akış** ve **metin çıktısı** destekleyen Bedrock modellerini otomatik olarak keşfedebilir.
Keşif `bedrock:ListFoundationModels` ve
`bedrock:ListInferenceProfiles` kullanır ve sonuçlar önbelleğe alınır (varsayılan: 1 saat).

Örtük sağlayıcının nasıl etkinleştirildiği:

- `plugins.entries.amazon-bedrock.config.discovery.enabled` değeri `true` ise,
  AWS ortam işaretleyicisi olmasa bile OpenClaw keşif denemesi yapar.
- `plugins.entries.amazon-bedrock.config.discovery.enabled` ayarlanmamışsa,
  OpenClaw örtük Bedrock sağlayıcısını yalnızca şu AWS kimlik doğrulama işaretleyicilerinden
  birini gördüğünde otomatik olarak ekler:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` veya `AWS_PROFILE`.
- Gerçek Bedrock çalışma zamanı kimlik doğrulama yolu yine de AWS SDK varsayılan zincirini kullandığından,
  paylaşılan yapılandırma, SSO ve IMDS instance-rolü kimlik doğrulaması,
  katılmak için `enabled: true` gerektiren keşif durumunda bile çalışabilir.

<Note>
Açık `models.providers["amazon-bedrock"]` girdileri için OpenClaw, tam çalışma zamanı kimlik doğrulama yüklemesini zorlamadan `AWS_BEARER_TOKEN_BEDROCK` gibi AWS ortam işaretleyicilerinden Bedrock ortam işaretleyici kimlik doğrulamasını erken çözümleyebilir. Gerçek model çağrısı kimlik doğrulama yolu yine de AWS SDK varsayılan zincirini kullanır.
</Note>

<AccordionGroup>
  <Accordion title="Keşif yapılandırma seçenekleri">
    Yapılandırma seçenekleri `plugins.entries.amazon-bedrock.config.discovery` altında bulunur:

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

    | Seçenek | Varsayılan | Açıklama |
    | ------ | ------- | ----------- |
    | `enabled` | auto | Otomatik modda OpenClaw, örtük Bedrock sağlayıcısını yalnızca desteklenen bir AWS ortam işaretleyicisi gördüğünde etkinleştirir. Keşfi zorlamak için `true` ayarlayın. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Keşif API çağrıları için kullanılan AWS bölgesi. |
    | `providerFilter` | (tümü) | Bedrock sağlayıcı adlarıyla eşleşir (örneğin `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Saniye cinsinden önbellek süresi. Önbelleği devre dışı bırakmak için `0` ayarlayın. |
    | `defaultContextWindow` | `32000` | Keşfedilen modeller için kullanılan bağlam penceresi (model sınırlarınızı biliyorsanız geçersiz kılın). |
    | `defaultMaxTokens` | `4096` | Keşfedilen modeller için kullanılan azami çıktı token'ı (model sınırlarınızı biliyorsanız geçersiz kılın). |

  </Accordion>
</AccordionGroup>

## Hızlı kurulum (AWS yolu)

Bu adım dizisi bir IAM rolü oluşturur, Bedrock izinlerini iliştirir,
instance profile'ı ilişkilendirir ve EC2 ana makinesinde OpenClaw keşfini etkinleştirir.

```bash
# 1. IAM rolü ve instance profile oluşturun
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

# 2. EC2 instance'ınıza iliştirin
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. EC2 instance'ında keşfi açıkça etkinleştirin
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. İsteğe bağlı: Açık etkinleştirme olmadan otomatik modu istiyorsanız bir ortam işaretleyicisi ekleyin
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Modellerin keşfedildiğini doğrulayın
openclaw models list
```

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Inference profile'ları">
    OpenClaw, foundation model'lerin yanında **bölgesel ve küresel inference profile'larını** da keşfeder.
    Bir profile bilinen bir foundation model'e eşlendiğinde,
    profile o modelin yeteneklerini (bağlam penceresi, azami token, akıl yürütme, görsel) devralır
    ve doğru Bedrock istek bölgesi otomatik olarak eklenir.
    Bu, bölgeler arası Claude profile'larının el ile
    sağlayıcı geçersiz kılmaları olmadan çalıştığı anlamına gelir.

    Inference profile kimlikleri `us.anthropic.claude-opus-4-6-v1:0` (bölgesel)
    veya `anthropic.claude-opus-4-6-v1:0` (küresel) gibi görünür. Destekleyen model zaten
    keşif sonuçlarında varsa, profile onun tam yetenek kümesini devralır;
    aksi takdirde güvenli varsayılanlar uygulanır.

    Ek yapılandırma gerekmez. Keşif etkin olduğu ve IAM
    ilkesi `bedrock:ListInferenceProfiles` iznine sahip olduğu sürece, profile'lar
    `openclaw models list` içinde foundation model'lerin yanında görünür.

  </Accordion>

  <Accordion title="Guardrail'ler">
    `amazon-bedrock` Plugin yapılandırmasına bir `guardrail` nesnesi ekleyerek
    tüm Bedrock model çağrılarına [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    uygulayabilirsiniz. Guardrail'ler; içerik filtreleme,
    konu reddi, kelime filtreleri, hassas bilgi filtreleri ve bağlamsal
    temellendirme kontrolleri uygulamanıza olanak tanır.

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // guardrail kimliği veya tam ARN
                guardrailVersion: "1", // sürüm numarası veya "DRAFT"
                streamProcessingMode: "sync", // isteğe bağlı: "sync" veya "async"
                trace: "enabled", // isteğe bağlı: "enabled", "disabled" veya "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    | Seçenek | Gerekli | Açıklama |
    | ------ | -------- | ----------- |
    | `guardrailIdentifier` | Evet | Guardrail kimliği (ör. `abc123`) veya tam ARN (ör. `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Evet | Yayımlanmış sürüm numarası veya çalışma taslağı için `"DRAFT"`. |
    | `streamProcessingMode` | Hayır | Akış sırasında guardrail değerlendirmesi için `"sync"` veya `"async"`. Atlanırsa Bedrock varsayılanını kullanır. |
    | `trace` | Hayır | Hata ayıklama için `"enabled"` veya `"enabled_full"`; üretim için atlayın veya `"disabled"` ayarlayın. |

    <Warning>
    Gateway tarafından kullanılan IAM ilkesinin, standart çağırma izinlerine ek olarak `bedrock:ApplyGuardrail` iznine de sahip olması gerekir.
    </Warning>

  </Accordion>

  <Accordion title="Bellek araması için embedding'ler">
    Bedrock ayrıca
    [bellek araması](/tr/concepts/memory-search) için embedding sağlayıcısı olarak da hizmet verebilir. Bu,
    inference sağlayıcısından ayrı yapılandırılır -- `agents.defaults.memorySearch.provider`
    değerini `"bedrock"` olarak ayarlayın:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // varsayılan
          },
        },
      },
    }
    ```

    Bedrock embedding'leri inference ile aynı AWS SDK kimlik bilgisi zincirini kullanır (instance
    rolleri, SSO, erişim anahtarları, paylaşılan yapılandırma ve web identity). API anahtarı
    gerekmez. `provider` değeri `"auto"` olduğunda, bu
    kimlik bilgisi zinciri başarıyla çözümlenirse Bedrock otomatik olarak algılanır.

    Desteklenen embedding modelleri arasında Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) ve TwelveLabs Marengo bulunur. Tam model listesi
    ve boyut seçenekleri için
    [Bellek yapılandırma başvurusu -- Bedrock](/tr/reference/memory-config#bedrock-embedding-config)
    bölümüne bakın.

  </Accordion>

  <Accordion title="Notlar ve dikkat edilmesi gerekenler">
    - Bedrock, AWS hesabınızda/bölgenizde **model erişiminin** etkinleştirilmesini gerektirir.
    - Otomatik keşif için `bedrock:ListFoundationModels` ve
      `bedrock:ListInferenceProfiles` izinleri gerekir.
    - Otomatik moda güveniyorsanız, gateway ana makinesinde desteklenen AWS kimlik doğrulama ortam işaretleyicilerinden birini ayarlayın.
      Ortam işaretleyicileri olmadan IMDS/paylaşılan yapılandırma kimlik doğrulamasını tercih ediyorsanız,
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true` ayarlayın.
    - OpenClaw kimlik bilgisi kaynağını şu sırayla gösterir: `AWS_BEARER_TOKEN_BEDROCK`,
      ardından `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, ardından `AWS_PROFILE`, sonra da
      varsayılan AWS SDK zinciri.
    - Akıl yürütme desteği modele bağlıdır; güncel yetenekler için Bedrock model kartını
      kontrol edin.
    - Yönetilen bir anahtar akışını tercih ediyorsanız, Bedrock'ın önüne OpenAI uyumlu bir
      proxy de koyabilir ve bunu bunun yerine bir OpenAI sağlayıcısı olarak yapılandırabilirsiniz.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Bellek araması" href="/tr/concepts/memory-search" icon="magnifying-glass">
    Bellek araması yapılandırması için Bedrock embedding'leri.
  </Card>
  <Card title="Bellek yapılandırma başvurusu" href="/tr/reference/memory-config#bedrock-embedding-config" icon="database">
    Tam Bedrock embedding model listesi ve boyut seçenekleri.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve SSS.
  </Card>
</CardGroup>

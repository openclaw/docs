---
read_when:
    - Amazon Bedrock modellerini OpenClaw ile kullanmak istiyorsunuz
    - Model çağrıları için AWS kimlik bilgileri/bölge kurulumuna ihtiyacınız var
summary: Amazon Bedrock (Converse API) modellerini OpenClaw ile kullanın
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-24T09:24:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e37aaead5c9bd730b4dd1f2878ff63bebf5537d75ff9df786813c58b1ac2fc0
    source_path: providers/bedrock.md
    workflow: 15
---

OpenClaw, pi-ai’nin **Bedrock Converse** akış sağlayıcısı aracılığıyla **Amazon Bedrock** modellerini kullanabilir. Bedrock kimlik doğrulaması bir API anahtarı değil, **AWS SDK varsayılan kimlik bilgisi zincirini** kullanır.

| Özellik | Değer                                                       |
| -------- | ----------------------------------------------------------- |
| Sağlayıcı | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| Kimlik doğrulama | AWS kimlik bilgileri (ortam değişkenleri, paylaşılan yapılandırma veya örnek rolü) |
| Bölge   | `AWS_REGION` veya `AWS_DEFAULT_REGION` (varsayılan: `us-east-1`) |

## Başlarken

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="Erişim anahtarları / ortam değişkenleri">
    **En iyi kullanım alanı:** AWS kimlik bilgilerini doğrudan yönettiğiniz geliştirici makineleri, CI veya ana makineler.

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
      <Step title="Yapılandırmanıza bir Bedrock sağlayıcısı ve modeli ekleyin">
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
      <Step title="Modellerin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    Ortam işaretleyici kimlik doğrulamasıyla (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` veya `AWS_BEARER_TOKEN_BEDROCK`), OpenClaw model keşfi için ek yapılandırma olmadan örtük Bedrock sağlayıcısını otomatik olarak etkinleştirir.
    </Tip>

  </Tab>

  <Tab title="EC2 örnek rolleri (IMDS)">
    **En iyi kullanım alanı:** Kimlik doğrulama için örnek meta veri hizmetini kullanan, ekli bir IAM rolüne sahip EC2 örnekleri.

    <Steps>
      <Step title="Keşfi açıkça etkinleştirin">
        IMDS kullanırken OpenClaw AWS kimlik doğrulamasını yalnızca ortam işaretleyicilerinden algılayamaz, bu nedenle açıkça etkinleştirmeniz gerekir:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="İsteğe bağlı olarak otomatik mod için bir ortam işaretleyicisi ekleyin">
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
    EC2 örneğinize ekli IAM rolü şu izinlere sahip olmalıdır:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (otomatik keşif için)
    - `bedrock:ListInferenceProfiles` (çıkarım profili keşfi için)

    Veya yönetilen `AmazonBedrockFullAccess` ilkesini ekleyin.
    </Warning>

    <Note>
    `AWS_PROFILE=default` yalnızca otomatik mod veya durum yüzeyleri için özellikle bir ortam işaretleyicisi istiyorsanız gereklidir. Gerçek Bedrock çalışma zamanı kimlik doğrulama yolu AWS SDK varsayılan zincirini kullandığından, IMDS örnek-rolü kimlik doğrulaması ortam işaretleyicileri olmadan da çalışır.
    </Note>

  </Tab>
</Tabs>

## Otomatik model keşfi

OpenClaw, **akışı** ve **metin çıktısını** destekleyen Bedrock modellerini otomatik olarak keşfedebilir. Keşif `bedrock:ListFoundationModels` ve `bedrock:ListInferenceProfiles` kullanır ve sonuçlar önbelleğe alınır (varsayılan: 1 saat).

Örtük sağlayıcının nasıl etkinleştirildiği:

- `plugins.entries.amazon-bedrock.config.discovery.enabled` değeri `true` ise,
  OpenClaw hiçbir AWS ortam işaretleyicisi mevcut olmasa bile keşfi dener.
- `plugins.entries.amazon-bedrock.config.discovery.enabled` ayarlanmamışsa,
  OpenClaw yalnızca şu AWS kimlik doğrulama işaretleyicilerinden birini gördüğünde
  örtük Bedrock sağlayıcısını otomatik olarak ekler:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` veya `AWS_PROFILE`.
- Gerçek Bedrock çalışma zamanı kimlik doğrulama yolu yine de AWS SDK varsayılan zincirini kullanır; dolayısıyla
  keşfin katılım için `enabled: true` gerektirdiği durumlarda bile
  paylaşılan yapılandırma, SSO ve IMDS örnek-rolü kimlik doğrulaması çalışabilir.

<Note>
Açık `models.providers["amazon-bedrock"]` girdileri için OpenClaw, tam çalışma zamanı kimlik doğrulama yüklemesini zorlamadan `AWS_BEARER_TOKEN_BEDROCK` gibi AWS ortam işaretleyicilerinden Bedrock ortam işaretleyici kimlik doğrulamasını yine erken çözümleyebilir. Gerçek model çağrısı kimlik doğrulama yolu yine de AWS SDK varsayılan zincirini kullanır.
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
    | `enabled` | auto | Otomatik modda OpenClaw, yalnızca desteklenen bir AWS ortam işaretleyicisi gördüğünde örtük Bedrock sağlayıcısını etkinleştirir. Keşfi zorlamak için `true` ayarlayın. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Keşif API çağrıları için kullanılan AWS bölgesi. |
    | `providerFilter` | (tümü) | Bedrock sağlayıcı adlarıyla eşleşir (örneğin `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Saniye cinsinden önbellek süresi. Önbelleği devre dışı bırakmak için `0` ayarlayın. |
    | `defaultContextWindow` | `32000` | Keşfedilen modeller için kullanılan bağlam penceresi (model sınırlarınızı biliyorsanız geçersiz kılın). |
    | `defaultMaxTokens` | `4096` | Keşfedilen modeller için kullanılan en yüksek çıktı token sayısı (model sınırlarınızı biliyorsanız geçersiz kılın). |

  </Accordion>
</AccordionGroup>

## Hızlı kurulum (AWS yolu)

Bu anlatım bir IAM rolü oluşturur, Bedrock izinlerini ekler, örnek profilini ilişkilendirir ve EC2 ana makinesinde OpenClaw keşfini etkinleştirir.

```bash
# 1. IAM rolü ve örnek profili oluştur
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

# 2. EC2 örneğinize ekleyin
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. EC2 örneğinde keşfi açıkça etkinleştirin
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. İsteğe bağlı: açık etkinleştirme olmadan otomatik modu istiyorsanız bir ortam işaretleyicisi ekleyin
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Modellerin keşfedildiğini doğrulayın
openclaw models list
```

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Çıkarım profilleri">
    OpenClaw, temel modellerin yanında **bölgesel ve küresel çıkarım profillerini** de keşfeder. Bir profil bilinen bir temel modele eşlendiğinde, profil o modelin yeteneklerini (bağlam penceresi, en yüksek token sayısı, akıl yürütme, görsel anlama) devralır ve doğru Bedrock istek bölgesi otomatik olarak enjekte edilir. Bu, bölgeler arası Claude profillerinin elle sağlayıcı geçersiz kılmaları olmadan çalıştığı anlamına gelir.

    Çıkarım profili kimlikleri `us.anthropic.claude-opus-4-6-v1:0` (bölgesel)
    veya `anthropic.claude-opus-4-6-v1:0` (küresel) gibi görünür. Destekleyen model zaten
    keşif sonuçlarındaysa, profil onun tam yetenek kümesini devralır;
    aksi halde güvenli varsayılanlar uygulanır.

    Ek yapılandırma gerekmez. Keşif etkin olduğu ve IAM
    asıl kimliğinin `bedrock:ListInferenceProfiles` izni bulunduğu sürece, profiller
    `openclaw models list` içinde temel modellerin yanında görünür.

  </Accordion>

  <Accordion title="Guardrail’ler">
    `amazon-bedrock` Plugin yapılandırmasına bir `guardrail` nesnesi ekleyerek
    tüm Bedrock model çağrılarına [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    uygulayabilirsiniz. Guardrail’ler, içerik filtreleme,
    konu reddi, sözcük filtreleri, hassas bilgi filtreleri ve bağlamsal
    temellendirme denetimlerini zorlamanızı sağlar.

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
    | `guardrailVersion` | Evet | Yayımlanmış sürüm numarası veya çalışan taslak için `"DRAFT"`. |
    | `streamProcessingMode` | Hayır | Akış sırasında guardrail değerlendirmesi için `"sync"` veya `"async"`. Atlanırsa Bedrock kendi varsayılanını kullanır. |
    | `trace` | Hayır | Hata ayıklama için `"enabled"` veya `"enabled_full"`; üretimde atlayın veya `"disabled"` ayarlayın. |

    <Warning>
    Gateway tarafından kullanılan IAM asıl kimliği, standart çağırma izinlerine ek olarak `bedrock:ApplyGuardrail` iznine sahip olmalıdır.
    </Warning>

  </Accordion>

  <Accordion title="Bellek araması için gömüler">
    Bedrock ayrıca
    [bellek araması](/tr/concepts/memory-search) için gömü sağlayıcısı olarak da hizmet verebilir. Bu,
    çıkarım sağlayıcısından ayrı yapılandırılır -- `agents.defaults.memorySearch.provider` değerini `"bedrock"` olarak ayarlayın:

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

    Bedrock gömüleri, çıkarımla aynı AWS SDK kimlik bilgisi zincirini kullanır (örnek
    rolleri, SSO, erişim anahtarları, paylaşılan yapılandırma ve web kimliği). API anahtarı
    gerekmez. `provider` değeri `"auto"` olduğunda, bu
    kimlik bilgisi zinciri başarıyla çözülürse Bedrock otomatik olarak algılanır.

    Desteklenen gömü modelleri arasında Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) ve TwelveLabs Marengo bulunur. Tam model listesi ve boyut seçenekleri için
    [Bellek yapılandırması başvurusu -- Bedrock](/tr/reference/memory-config#bedrock-embedding-config)
    sayfasına bakın.

  </Accordion>

  <Accordion title="Notlar ve dikkat edilmesi gerekenler">
    - Bedrock, AWS hesabınızda/bölgenizde **model erişiminin** etkinleştirilmesini gerektirir.
    - Otomatik keşif için `bedrock:ListFoundationModels` ve
      `bedrock:ListInferenceProfiles` izinleri gerekir.
    - Otomatik moda güveniyorsanız, Gateway ana makinesinde desteklenen AWS kimlik doğrulama ortam işaretleyicilerinden birini ayarlayın.
      Ortam işaretleyicileri olmadan IMDS/paylaşılan yapılandırma kimlik doğrulamasını tercih ediyorsanız,
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true` ayarlayın.
    - OpenClaw kimlik bilgisi kaynağını şu sırayla gösterir: `AWS_BEARER_TOKEN_BEDROCK`,
      ardından `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, ardından `AWS_PROFILE`, sonra da
      varsayılan AWS SDK zinciri.
    - Akıl yürütme desteği modele bağlıdır; geçerli yetenekler için
      Bedrock model kartını kontrol edin.
    - Yönetilen bir anahtar akışını tercih ediyorsanız, Bedrock’un önüne OpenAI uyumlu bir
      proxy de yerleştirip bunu bunun yerine bir OpenAI sağlayıcısı olarak yapılandırabilirsiniz.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Bellek araması" href="/tr/concepts/memory-search" icon="magnifying-glass">
    Bellek araması yapılandırması için Bedrock gömüleri.
  </Card>
  <Card title="Bellek yapılandırması başvurusu" href="/tr/reference/memory-config#bedrock-embedding-config" icon="database">
    Tam Bedrock gömü modeli listesi ve boyut seçenekleri.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve SSS.
  </Card>
</CardGroup>

---
read_when:
    - OpenClaw ile Amazon Bedrock modellerini kullanmak istiyorsunuz
    - Model çağrıları için AWS kimlik bilgileri ve bölge yapılandırması gerekir
summary: OpenClaw ile Amazon Bedrock (Converse API) modellerini kullanın
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-05-10T19:51:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb5a131a11b98dca68746cd6dfef8f36f1fdcbfbb985730176b334083574dc89
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw, pi-ai'nin **Bedrock Converse** akış sağlayıcısı üzerinden **Amazon Bedrock** modellerini kullanabilir. Bedrock kimlik doğrulaması API anahtarı değil, **AWS SDK varsayılan kimlik bilgileri zincirini** kullanır.

| Özellik | Değer                                                       |
| -------- | ----------------------------------------------------------- |
| Sağlayıcı | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| Kimlik doğrulama | AWS kimlik bilgileri (env vars, paylaşılan yapılandırma veya instance rolü) |
| Bölge   | `AWS_REGION` veya `AWS_DEFAULT_REGION` (varsayılan: `us-east-1`) |

## Başlarken

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="Erişim anahtarları / env vars">
    **En uygun olduğu yerler:** geliştirici makineleri, CI veya AWS kimlik bilgilerini doğrudan yönettiğiniz hostlar.

    <Steps>
      <Step title="Gateway hostunda AWS kimlik bilgilerini ayarlayın">
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
      <Step title="Modellerin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    Env-marker kimlik doğrulamasıyla (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` veya `AWS_BEARER_TOKEN_BEDROCK`), OpenClaw ek yapılandırma olmadan model keşfi için örtük Bedrock sağlayıcısını otomatik olarak etkinleştirir.
    </Tip>

  </Tab>

  <Tab title="EC2 instance rolleri (IMDS)">
    **En uygun olduğu yerler:** IAM rolü eklenmiş EC2 instanceları, kimlik doğrulama için instance metadata servisini kullanarak.

    <Steps>
      <Step title="Keşfi açıkça etkinleştirin">
        IMDS kullanırken OpenClaw, AWS kimlik doğrulamasını yalnızca env markerlardan algılayamaz; bu nedenle açıkça dahil olmanız gerekir:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="İsteğe bağlı olarak otomatik mod için bir env marker ekleyin">
        Env-marker otomatik algılama yolunun da çalışmasını istiyorsanız (örneğin, `openclaw status` yüzeyleri için):

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
    EC2 instanceınıza eklenmiş IAM rolünde aşağıdaki izinler bulunmalıdır:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (otomatik keşif için)
    - `bedrock:ListInferenceProfiles` (inference profile keşfi için)

    Veya yönetilen `AmazonBedrockFullAccess` politikasını ekleyin.
    </Warning>

    <Note>
    `AWS_PROFILE=default` değerine yalnızca otomatik mod veya durum yüzeyleri için özellikle bir env marker istiyorsanız ihtiyacınız vardır. Gerçek Bedrock runtime kimlik doğrulama yolu AWS SDK varsayılan zincirini kullanır, bu yüzden IMDS instance-role kimlik doğrulaması env markerlar olmadan da çalışır.
    </Note>

  </Tab>
</Tabs>

## Otomatik model keşfi

OpenClaw, **akışı** ve **metin çıktısını** destekleyen Bedrock modellerini otomatik olarak keşfedebilir. Keşif `bedrock:ListFoundationModels` ve `bedrock:ListInferenceProfiles` kullanır ve sonuçlar önbelleğe alınır (varsayılan: 1 saat).

Örtük sağlayıcının nasıl etkinleştirildiği:

- `plugins.entries.amazon-bedrock.config.discovery.enabled` değeri `true` ise
  OpenClaw, AWS ortam işaretçisi bulunmasa bile keşfi deneyecektir.
- `plugins.entries.amazon-bedrock.config.discovery.enabled` ayarlanmamışsa,
  OpenClaw örtük Bedrock sağlayıcısını yalnızca şu AWS kimlik doğrulama
  işaretçilerinden birini gördüğünde otomatik ekler:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` veya `AWS_PROFILE`.
- Gerçek Bedrock çalışma zamanı kimlik doğrulama yolu yine AWS SDK varsayılan
  zincirini kullanır; bu nedenle paylaşılan yapılandırma, SSO ve IMDS örnek rolü
  kimlik doğrulaması, keşif katılım için `enabled: true` gerektirse bile çalışabilir.

<Note>
Açık `models.providers["amazon-bedrock"]` girdileri için OpenClaw, tam çalışma zamanı kimlik doğrulama yüklemesini zorlamadan `AWS_BEARER_TOKEN_BEDROCK` gibi AWS ortam işaretçilerinden Bedrock ortam işaretçisi kimlik doğrulamasını yine de erken çözümleyebilir. Gerçek model çağrısı kimlik doğrulama yolu yine AWS SDK varsayılan zincirini kullanır.
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
    | `enabled` | auto | Otomatik modda OpenClaw, örtük Bedrock sağlayıcısını yalnızca desteklenen bir AWS ortam işaretçisi gördüğünde etkinleştirir. Keşfi zorlamak için `true` olarak ayarlayın. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Keşif API çağrıları için kullanılan AWS bölgesi. |
    | `providerFilter` | (tümü) | Bedrock sağlayıcı adlarıyla eşleşir (örneğin `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Saniye cinsinden önbellek süresi. Önbelleğe almayı devre dışı bırakmak için `0` olarak ayarlayın. |
    | `defaultContextWindow` | `32000` | Keşfedilen modeller için kullanılan bağlam penceresi (model sınırlarınızı biliyorsanız geçersiz kılın). |
    | `defaultMaxTokens` | `4096` | Keşfedilen modeller için kullanılan maksimum çıktı token'ları (model sınırlarınızı biliyorsanız geçersiz kılın). |

  </Accordion>
</AccordionGroup>

## Hızlı kurulum (AWS yolu)

Bu kılavuz bir IAM rolü oluşturur, Bedrock izinlerini ekler, örnek profilini
ilişkilendirir ve EC2 ana makinesinde OpenClaw keşfini etkinleştirir.

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

## Gelişmiş yapılandırma

  <AccordionGroup>
  <Accordion title="Çıkarım profilleri">
    OpenClaw, temel modellerin yanında **bölgesel ve genel çıkarım profillerini**
    keşfeder. Bir profil bilinen bir temel modele eşlendiğinde, profil
    o modelin yeteneklerini (bağlam penceresi, en fazla token, akıl yürütme,
    görme) devralır ve doğru Bedrock istek bölgesi otomatik olarak eklenir.
    Bu, bölgeler arası Claude profillerinin manuel sağlayıcı geçersiz kılmaları
    olmadan çalıştığı anlamına gelir.

    Çıkarım profili kimlikleri `us.anthropic.claude-opus-4-6-v1:0` (bölgesel)
    veya `anthropic.claude-opus-4-6-v1:0` (genel) gibi görünür. Dayanak model
    zaten keşif sonuçlarındaysa, profil onun tam yetenek kümesini devralır;
    değilse güvenli varsayılanlar uygulanır.

    Ek yapılandırma gerekmez. Keşif etkin olduğu ve IAM principal
    `bedrock:ListInferenceProfiles` iznine sahip olduğu sürece, profiller
    `openclaw models list` içinde temel modellerin yanında görünür.

  </Accordion>

  <Accordion title="Hizmet katmanı">
    Bazı Bedrock modelleri, maliyet veya gecikme için optimizasyon yapmak üzere
    bir `service_tier` parametresini destekler. Aşağıdaki katmanlar kullanılabilir:

    | Katman | Açıklama |
    |------|-------------|
    | `default` | Standart Bedrock katmanı |
    | `flex` | Daha uzun gecikmeyi tolere edebilen iş yükleri için indirimli işleme |
    | `priority` | Gecikmeye duyarlı iş yükleri için öncelikli işleme |
    | `reserved` | Kararlı durum iş yükleri için ayrılmış kapasite |

    Bedrock model istekleri için `agents.defaults.params` üzerinden
    `serviceTier` (veya `service_tier`) ayarlayın ya da model bazında
    `agents.defaults.models["<model-key>"].params` içinde ayarlayın:

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

    Geçerli değerler `default`, `flex`, `priority` ve `reserved` değerleridir.
    Tüm modeller tüm katmanları desteklemez — desteklenmeyen bir katman istenirse
    Bedrock bir doğrulama hatası döndürür. Not: hata iletisi biraz yanıltıcıdır;
    desteklenmeyen bir hizmet katmanını belirtmek yerine "The provided model
    identifier is invalid" diyebilir. Bu hatayı görürseniz, modelin istenen
    katmanı destekleyip desteklemediğini kontrol edin.

  </Accordion>

  <Accordion title="Claude Opus 4.7 sıcaklığı">
    Bedrock, Claude Opus 4.7 için `temperature` parametresini reddeder. OpenClaw,
    temel model kimlikleri, adlandırılmış çıkarım profilleri, altında yatan modeli
    `bedrock:GetInferenceProfile` aracılığıyla Opus 4.7 olarak çözümlenen
    uygulama çıkarım profilleri ve isteğe bağlı bölge öneklerine (`us.`, `eu.`,
    `ap.`, `apac.`, `au.`, `jp.`, `global.`) sahip noktalı `opus-4.7`
    varyantları dahil olmak üzere herhangi bir Opus 4.7 Bedrock ref için
    `temperature` değerini otomatik olarak atlar. Yapılandırma düğmesi gerekmez
    ve bu atlama hem istek seçenekleri nesnesine hem de `inferenceConfig` yük
    alanına uygulanır.
  </Accordion>

  <Accordion title="Koruma önlemleri">
    Tüm Bedrock model çağrılarına, `amazon-bedrock` Plugin yapılandırmasına bir
    `guardrail` nesnesi ekleyerek [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    uygulayabilirsiniz. Koruma önlemleri; içerik filtrelemeyi, konu reddini,
    sözcük filtrelerini, hassas bilgi filtrelerini ve bağlamsal temellendirme
    denetimlerini zorunlu kılmanızı sağlar.

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

    | Seçenek | Gerekli | Açıklama |
    | ------ | -------- | ----------- |
    | `guardrailIdentifier` | Evet | Guardrail kimliği (örn. `abc123`) veya tam ARN (örn. `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Evet | Yayımlanmış sürüm numarası veya çalışma taslağı için `"DRAFT"`. |
    | `streamProcessingMode` | Hayır | Akış sırasında guardrail değerlendirmesi için `"sync"` veya `"async"`. Atlanırsa Bedrock kendi varsayılanını kullanır. |
    | `trace` | Hayır | Hata ayıklama için `"enabled"` veya `"enabled_full"`; üretim için atlayın ya da `"disabled"` olarak ayarlayın. |

    <Warning>
    Gateway tarafından kullanılan IAM sorumlusunda, standart çağırma izinlerine ek olarak `bedrock:ApplyGuardrail` izni bulunmalıdır.
    </Warning>

  </Accordion>

  <Accordion title="Bellek araması için embedding'ler">
    Bedrock, [bellek araması](/tr/concepts/memory-search) için embedding sağlayıcısı
    olarak da kullanılabilir. Bu, çıkarım sağlayıcısından ayrı olarak yapılandırılır;
    `agents.defaults.memorySearch.provider` değerini `"bedrock"` olarak ayarlayın:

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

    Bedrock embedding'leri, çıkarım ile aynı AWS SDK kimlik bilgisi zincirini
    kullanır (örnek rolleri, SSO, erişim anahtarları, paylaşılan yapılandırma ve web
    kimliği). API anahtarı gerekmez. `provider` değeri `"auto"` olduğunda, bu kimlik
    bilgisi zinciri başarıyla çözümlenirse Bedrock otomatik olarak algılanır.

    Desteklenen embedding modelleri arasında Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) ve TwelveLabs Marengo bulunur. Tam model listesi ve
    boyut seçenekleri için [Bellek yapılandırması başvurusu -- Bedrock](/tr/reference/memory-config#bedrock-embedding-config)
    bölümüne bakın.

  </Accordion>

  <Accordion title="Notlar ve uyarılar">
    - Bedrock, AWS hesabınızda/bölgenizde **model erişiminin** etkinleştirilmesini gerektirir.
    - Otomatik keşif için `bedrock:ListFoundationModels` ve
      `bedrock:ListInferenceProfiles` izinleri gerekir.
    - Otomatik moda güveniyorsanız, desteklenen AWS kimlik doğrulama ortam işaretleyicilerinden
      birini Gateway ana makinesinde ayarlayın. Ortam işaretleyicileri olmadan IMDS/paylaşılan
      yapılandırma kimlik doğrulamasını tercih ediyorsanız
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true` değerini ayarlayın.
    - OpenClaw kimlik bilgisi kaynağını şu sırayla gösterir: `AWS_BEARER_TOKEN_BEDROCK`,
      ardından `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, ardından `AWS_PROFILE`, ardından
      varsayılan AWS SDK zinciri.
    - Akıl yürütme desteği modele bağlıdır; geçerli yetenekler için Bedrock model kartını
      kontrol edin.
    - Yönetilen bir anahtar akışını tercih ediyorsanız, Bedrock'un önüne OpenAI uyumlu
      bir proxy de yerleştirebilir ve bunun yerine bir OpenAI sağlayıcısı olarak yapılandırabilirsiniz.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Bellek araması" href="/tr/concepts/memory-search" icon="magnifying-glass">
    Bellek araması yapılandırması için Bedrock embedding'leri.
  </Card>
  <Card title="Bellek yapılandırması başvurusu" href="/tr/reference/memory-config#bedrock-embedding-config" icon="database">
    Tam Bedrock embedding model listesi ve boyut seçenekleri.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve SSS.
  </Card>
</CardGroup>

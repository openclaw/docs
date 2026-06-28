---
read_when:
    - Amazon Bedrock modellerini OpenClaw ile kullanmak istiyorsunuz
    - Model çağrıları için AWS kimlik bilgisi/bölge kurulumu gerekir
summary: Amazon Bedrock (Converse API) modellerini OpenClaw ile kullanın
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-06-28T01:08:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3947ad565f3a0adcd62d4ce47c6ed760f73c77ba3f4bd43b0754a412511063f2
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw, **Bedrock Converse** akış sağlayıcısı üzerinden **Amazon Bedrock** modellerini kullanabilir. Bedrock kimlik doğrulaması, API anahtarı değil **AWS SDK varsayılan kimlik bilgisi zincirini** kullanır.

| Özellik | Değer                                                       |
| -------- | ----------------------------------------------------------- |
| Sağlayıcı | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| Kimlik doğrulama     | AWS kimlik bilgileri (env vars, paylaşılan config veya instance role) |
| Bölge   | `AWS_REGION` veya `AWS_DEFAULT_REGION` (varsayılan: `us-east-1`) |

## Başlarken

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="Erişim anahtarları / env vars">
    **En uygun olduğu yerler:** geliştirici makineleri, CI veya AWS kimlik bilgilerini doğrudan yönettiğiniz host’lar.

    <Steps>
      <Step title="Gateway host’unda AWS kimlik bilgilerini ayarlayın">
        ```bash
        export AWS_ACCESS_KEY_ID="EXAMPLE_AWS_ACCESS_KEY_ID"
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Optional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Optional (Bedrock API key/bearer token):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Config’inize bir Bedrock sağlayıcısı ve modeli ekleyin">
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
    env-marker kimlik doğrulamasıyla (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` veya `AWS_BEARER_TOKEN_BEDROCK`), OpenClaw ek config olmadan model keşfi için örtük Bedrock sağlayıcısını otomatik etkinleştirir.
    </Tip>

  </Tab>

  <Tab title="EC2 instance rolleri (IMDS)">
    **En uygun olduğu yerler:** kimlik doğrulaması için instance metadata service kullanan, IAM role eklenmiş EC2 instance’ları.

    <Steps>
      <Step title="Keşfi açıkça etkinleştirin">
        IMDS kullanırken OpenClaw, AWS kimlik doğrulamasını yalnızca env marker’larından algılayamaz; bu yüzden katılımı açıkça etkinleştirmeniz gerekir:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="İsteğe bağlı olarak otomatik mod için bir env marker ekleyin">
        Env-marker otomatik algılama yolunun da çalışmasını istiyorsanız (örneğin `openclaw status` yüzeyleri için):

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
    EC2 instance’ınıza ekli IAM role şu izinlere sahip olmalıdır:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (otomatik keşif için)
    - `bedrock:ListInferenceProfiles` (inference profile keşfi için)

    Alternatif olarak yönetilen `AmazonBedrockFullAccess` politikasını ekleyin.
    </Warning>

    <Note>
    Yalnızca otomatik mod veya durum yüzeyleri için özellikle bir env marker istiyorsanız `AWS_PROFILE=default` gerekir. Asıl Bedrock runtime kimlik doğrulama yolu AWS SDK varsayılan zincirini kullanır; bu yüzden IMDS instance-role kimlik doğrulaması env marker’ları olmadan da çalışır.
    </Note>

  </Tab>
</Tabs>

## Otomatik model keşfi

OpenClaw, **akış** ve **metin çıktısı** destekleyen Bedrock modellerini otomatik olarak keşfedebilir. Keşif `bedrock:ListFoundationModels` ve `bedrock:ListInferenceProfiles` kullanır ve sonuçlar önbelleğe alınır (varsayılan: 1 saat).

Örtük sağlayıcı şu şekilde etkinleştirilir:

- `plugins.entries.amazon-bedrock.config.discovery.enabled` `true` ise,
  OpenClaw AWS env marker olmasa bile keşfi deneyecektir.
- `plugins.entries.amazon-bedrock.config.discovery.enabled` ayarlanmamışsa,
  OpenClaw örtük Bedrock sağlayıcısını yalnızca şu AWS kimlik doğrulama marker’larından birini gördüğünde otomatik ekler:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` veya `AWS_PROFILE`.
- Asıl Bedrock runtime kimlik doğrulama yolu yine AWS SDK varsayılan zincirini kullanır; bu yüzden
  paylaşılan config, SSO ve IMDS instance-role kimlik doğrulaması, keşif katılım için
  `enabled: true` gerektirse bile çalışabilir.

<Note>
Açık `models.providers["amazon-bedrock"]` girdileri için OpenClaw, tam runtime kimlik doğrulama yüklemesini zorlamadan `AWS_BEARER_TOKEN_BEDROCK` gibi AWS env marker’larından Bedrock env-marker kimlik doğrulamasını erken çözebilir. Asıl model çağrısı kimlik doğrulama yolu yine AWS SDK varsayılan zincirini kullanır.
</Note>

<AccordionGroup>
  <Accordion title="Keşif config seçenekleri">
    Config seçenekleri `plugins.entries.amazon-bedrock.config.discovery` altında bulunur:

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
    | `enabled` | auto | Otomatik modda OpenClaw, örtük Bedrock sağlayıcısını yalnızca desteklenen bir AWS env marker gördüğünde etkinleştirir. Keşfi zorlamak için `true` olarak ayarlayın. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Keşif API çağrıları için kullanılan AWS bölgesi. |
    | `providerFilter` | (tümü) | Bedrock sağlayıcı adlarıyla eşleşir (örneğin `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Saniye cinsinden önbellek süresi. Önbelleğe almayı devre dışı bırakmak için `0` olarak ayarlayın. |
    | `defaultContextWindow` | `32000` | Keşfedilen modeller için kullanılan context window (model sınırlarınızı biliyorsanız geçersiz kılın). |
    | `defaultMaxTokens` | `4096` | Keşfedilen modeller için kullanılan maksimum çıktı token’ları (model sınırlarınızı biliyorsanız geçersiz kılın). |

  </Accordion>
</AccordionGroup>

## Hızlı kurulum (AWS yolu)

Bu adım adım kılavuz bir IAM role oluşturur, Bedrock izinlerini ekler, instance profile’ı ilişkilendirir ve EC2 host’unda OpenClaw keşfini etkinleştirir.

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
  <Accordion title="Inference profile’lar">
    OpenClaw, foundation model’ların yanında **bölgesel ve global inference profile’ları** keşfeder. Bir profile bilinen bir foundation model’a eşlendiğinde, profile o modelin yeteneklerini (context window, maksimum token’lar, reasoning, vision) devralır ve doğru Bedrock istek bölgesi otomatik olarak eklenir. Bu, bölgeler arası Claude profile’larının manuel sağlayıcı geçersiz kılmaları olmadan çalıştığı anlamına gelir.

    Inference profile ID’leri `us.anthropic.claude-opus-4-6-v1:0` (bölgesel)
    veya `anthropic.claude-opus-4-6-v1:0` (global) gibi görünür. Altta yatan model zaten
    keşif sonuçlarındaysa profile onun tam yetenek kümesini devralır;
    aksi halde güvenli varsayılanlar uygulanır.

    Ek config gerekmez. Keşif etkin olduğu ve IAM principal `bedrock:ListInferenceProfiles` iznine sahip olduğu sürece, profile’lar `openclaw models list` içinde foundation model’ların yanında görünür.

  </Accordion>

  <Accordion title="Hizmet katmanı">
    Bazı Bedrock modelleri, maliyet veya gecikme için optimizasyon yapmak üzere `service_tier` parametresini destekler. Aşağıdaki katmanlar kullanılabilir:

    | Katman | Açıklama |
    |------|-------------|
    | `default` | Standart Bedrock katmanı |
    | `flex` | Daha uzun gecikmeyi tolere edebilen workload’lar için indirimli işleme |
    | `priority` | Gecikmeye duyarlı workload’lar için öncelikli işleme |
    | `reserved` | Kararlı workload’lar için ayrılmış kapasite |

    Bedrock model istekleri için `agents.defaults.params` üzerinden
    veya `agents.defaults.models["<model-key>"].params` içinde model başına
    `serviceTier` (veya `service_tier`) ayarlayın:

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

    Geçerli değerler `default`, `flex`, `priority` ve `reserved` değerleridir. Tüm
    modeller tüm katmanları desteklemez; desteklenmeyen bir katman istenirse Bedrock
    bir doğrulama hatası döndürür. Not: hata mesajı bir miktar yanıltıcıdır;
    desteklenmeyen bir hizmet katmanını belirtmek yerine "The provided model identifier is invalid" diyebilir.
    Bu hatayı görürseniz, modelin istenen katmanı destekleyip desteklemediğini kontrol edin.

  </Accordion>

  <Accordion title="Claude Opus 4.7 temperature">
    Bedrock, Claude Opus 4.7 için `temperature` parametresini reddeder. OpenClaw,
    foundation model id’leri, adlandırılmış inference profile’lar, altta yatan modeli
    `bedrock:GetInferenceProfile` üzerinden Opus 4.7 olarak çözümlenen application inference
    profile’ları ve isteğe bağlı bölge ön eklerine (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`,
    `global.`) sahip noktalı `opus-4.7` varyantları dahil olmak üzere tüm Opus 4.7 Bedrock ref’leri için
    `temperature` değerini otomatik olarak çıkarır. Herhangi bir config düğmesi gerekmez ve bu çıkarma hem
    request options object’e hem de `inferenceConfig` payload alanına uygulanır.
  </Accordion>

  <Accordion title="Claude Fable 5">
    `us-east-1` içinde `amazon-bedrock/anthropic.claude-fable-5` veya
    `us.anthropic.claude-fable-5` gibi bölgesel çıkarım kimliklerini kullanın.
    OpenClaw, Fable'ın 1M bağlam penceresini, 128K çıktı sınırını, her zaman açık
    uyarlamalı düşünmeyi ve desteklenen çaba eşlemesini uygular. `/think off` ve
    `/think minimal`, `low` değerine eşlenir; desteklenmeyen sıcaklık ve zorunlu araç
    seçimi denetimleri atlanır. Akış çıktısı, Bedrock terminal durum döndürene kadar
    tutulur; böylece akış ortasındaki retler kısmi metni açığa çıkarmaz.
    Fable yalnızca standart hizmet katmanını destekler; OpenClaw bu model için yapılandırılmış
    `flex`, `priority` ve `reserved` katmanlarını yok sayar.

    AWS, Fable kullanılabilir olmadan önce açık bir `provider_data_share` veri saklama onayı
    gerektirir. İstemler ve tamamlamalar Anthropic ile paylaşılır ve güven ile emniyet için
    30 güne kadar saklanır. Modeli etkinleştirmeden önce
    [Bedrock veri saklama](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    ayarlarını inceleyin ve yapılandırın.

  </Accordion>

  <Accordion title="Guardrails">
    `amazon-bedrock` plugin yapılandırmasına bir `guardrail` nesnesi ekleyerek
    [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    tüm Bedrock model çağrılarına uygulayabilirsiniz. Guardrails; içerik filtreleme,
    konu reddi, sözcük filtreleri, hassas bilgi filtreleri ve bağlamsal
    dayanaklandırma denetimleri uygulamanızı sağlar.

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
    | `trace` | Hayır | Hata ayıklama için `"enabled"` veya `"enabled_full"`; üretimde atlayın ya da `"disabled"` olarak ayarlayın. |

    <Warning>
    Gateway tarafından kullanılan IAM sorumlusunda, standart çağırma izinlerine ek olarak `bedrock:ApplyGuardrail` izni bulunmalıdır.
    </Warning>

  </Accordion>

  <Accordion title="Bellek araması için embedding'ler">
    Bedrock, [bellek araması](/tr/concepts/memory-search) için embedding sağlayıcısı olarak da
    hizmet verebilir. Bu, çıkarım sağlayıcısından ayrı olarak yapılandırılır -- `agents.defaults.memorySearch.provider`
    değerini `"bedrock"` olarak ayarlayın:

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

    Bedrock embedding'leri, çıkarımla aynı AWS SDK kimlik bilgisi zincirini kullanır (örnek
    rolleri, SSO, erişim anahtarları, paylaşılan yapılandırma ve web kimliği). API anahtarı
    gerekmez. Bedrock embedding'lerini kullanmak için `memorySearch.provider: "bedrock"`
    değerini açıkça ayarlayın.

    Desteklenen embedding modelleri arasında Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) ve TwelveLabs Marengo bulunur. Tam model listesi ve
    boyut seçenekleri için
    [Bellek yapılandırma başvurusu -- Bedrock](/tr/reference/memory-config#bedrock-embedding-config)
    bölümüne bakın.

  </Accordion>

  <Accordion title="Notlar ve dikkat edilmesi gerekenler">
    - Bedrock, AWS hesabınızda/bölgenizde **model erişiminin** etkin olmasını gerektirir.
    - Otomatik keşif için `bedrock:ListFoundationModels` ve
      `bedrock:ListInferenceProfiles` izinleri gerekir.
    - Otomatik moda güveniyorsanız gateway ana makinesinde desteklenen AWS kimlik doğrulama env işaretçilerinden birini ayarlayın. Env işaretçileri olmadan IMDS/paylaşılan yapılandırma kimlik doğrulamasını tercih ediyorsanız
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true` ayarlayın.
    - OpenClaw kimlik bilgisi kaynağını şu sırayla gösterir: `AWS_BEARER_TOKEN_BEDROCK`,
      ardından `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, ardından `AWS_PROFILE`, ardından
      varsayılan AWS SDK zinciri.
    - Akıl yürütme desteği modele bağlıdır; güncel yetenekler için Bedrock model kartını
      kontrol edin.
    - Yönetilen bir anahtar akışını tercih ediyorsanız Bedrock'un önüne OpenAI uyumlu
      bir proxy de yerleştirebilir ve bunun yerine OpenAI sağlayıcısı olarak yapılandırabilirsiniz.
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
  <Card title="Bellek yapılandırma başvurusu" href="/tr/reference/memory-config#bedrock-embedding-config" icon="database">
    Tam Bedrock embedding model listesi ve boyut seçenekleri.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve SSS.
  </Card>
</CardGroup>

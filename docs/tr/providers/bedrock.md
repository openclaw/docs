---
read_when:
    - Amazon Bedrock modellerini OpenClaw ile kullanmak istiyorsunuz
    - Model çağrıları için AWS kimlik bilgileri/bölge yapılandırması gerekir
summary: Amazon Bedrock (Converse API) modellerini OpenClaw ile kullanın
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-07-12T12:41:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fda4f5ab8ffcd68012cf78fbedb9fabec36d9742f16518ea4dd38418b2220b7b
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw, **Amazon Bedrock** modellerini **Bedrock Converse** akış sağlayıcısı üzerinden kullanabilir. Bedrock kimlik doğrulaması bir API anahtarı değil, **AWS SDK varsayılan kimlik bilgisi zincirini** kullanır.

| Özellik | Değer                                                        |
| ------- | ------------------------------------------------------------ |
| Sağlayıcı | `amazon-bedrock`                                           |
| API     | `bedrock-converse-stream`                                    |
| Kimlik doğrulama | AWS kimlik bilgileri (ortam değişkenleri, paylaşılan yapılandırma veya örnek rolü) |
| Bölge   | `AWS_REGION` veya `AWS_DEFAULT_REGION` (varsayılan: `us-east-1`) |

## Başlarken

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="Erişim anahtarları / ortam değişkenleri">
    **En uygun kullanım:** AWS kimlik bilgilerini doğrudan yönettiğiniz geliştirici makineleri, CI veya sunucular.

    <Steps>
      <Step title="Gateway sunucusunda AWS kimlik bilgilerini ayarlayın">
        ```bash
        export AWS_ACCESS_KEY_ID="EXAMPLE_AWS_ACCESS_KEY_ID"
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # İsteğe bağlı:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # İsteğe bağlı (Bedrock API anahtarı/bearer belirteci):
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
    Ortam işaretçisiyle kimlik doğrulamada (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` veya `AWS_BEARER_TOKEN_BEDROCK`) OpenClaw, ek yapılandırma olmadan model keşfi için örtük Bedrock sağlayıcısını otomatik olarak etkinleştirir.
    </Tip>

  </Tab>

  <Tab title="EC2 örnek rolleri (IMDS)">
    **En uygun kullanım:** Kimlik doğrulama için örnek meta veri hizmetini kullanan, IAM rolü eklenmiş EC2 örnekleri.

    <Steps>
      <Step title="Keşfi açıkça etkinleştirin">
        IMDS kullanılırken OpenClaw, AWS kimlik doğrulamasını yalnızca ortam işaretçilerinden algılayamaz; bu nedenle özelliği açıkça etkinleştirmeniz gerekir:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Otomatik mod için isteğe bağlı olarak bir ortam işaretçisi ekleyin">
        Ortam işaretçisiyle otomatik algılama yolunun da çalışmasını istiyorsanız (örneğin `openclaw status` yüzeyleri için):

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
    EC2 örneğinize eklenen IAM rolü aşağıdaki izinlere sahip olmalıdır:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (otomatik keşif için)
    - `bedrock:ListInferenceProfiles` (çıkarım profili keşfi için)

    Alternatif olarak, yönetilen `AmazonBedrockFullAccess` politikasını ekleyin.
    </Warning>

    <Note>
    Yalnızca otomatik mod veya durum yüzeyleri için özellikle bir ortam işaretçisi istiyorsanız `AWS_PROFILE=default` gerekir. Gerçek Bedrock çalışma zamanı kimlik doğrulama yolu AWS SDK varsayılan zincirini kullandığından, IMDS örnek rolüyle kimlik doğrulama ortam işaretçileri olmadan da çalışır.
    </Note>

  </Tab>
</Tabs>

## Otomatik model keşfi

OpenClaw, **akışı** ve **metin çıktısını** destekleyen Bedrock modellerini otomatik olarak keşfedebilir. Keşif, `bedrock:ListFoundationModels` ve `bedrock:ListInferenceProfiles` kullanır; sonuçlar önbelleğe alınır (varsayılan: 1 saat).

Örtük sağlayıcının etkinleştirilme biçimi:

- `plugins.entries.amazon-bedrock.config.discovery.enabled` değeri `true` ise
  OpenClaw, AWS ortam işaretçisi bulunmadığında bile keşfi dener.
- `plugins.entries.amazon-bedrock.config.discovery.enabled` ayarlanmamışsa
  OpenClaw örtük Bedrock sağlayıcısını yalnızca şu AWS kimlik doğrulama
  işaretçilerinden birini gördüğünde otomatik olarak ekler:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` veya `AWS_PROFILE`.
- Gerçek Bedrock çalışma zamanı kimlik doğrulama yolu yine AWS SDK varsayılan
  zincirini kullanır; bu nedenle keşfin açıkça etkinleştirilmesi için
  `enabled: true` gerekse bile paylaşılan yapılandırma, SSO ve IMDS örnek
  rolüyle kimlik doğrulama çalışabilir.

<Note>
Açık `models.providers["amazon-bedrock"]` girdileri için OpenClaw, tam çalışma zamanı kimlik doğrulamasını yüklemeye zorlamadan `AWS_BEARER_TOKEN_BEDROCK` gibi AWS ortam işaretçilerinden Bedrock ortam işaretçisi kimlik doğrulamasını erkenden çözümleyebilir. Gerçek model çağrısı kimlik doğrulama yolu yine AWS SDK varsayılan zincirini kullanır.
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
    | ------- | ---------- | -------- |
    | `enabled` | otomatik | Otomatik modda OpenClaw, örtük Bedrock sağlayıcısını yalnızca desteklenen bir AWS ortam işaretçisi gördüğünde etkinleştirir. Keşfi zorlamak için `true` olarak ayarlayın. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Keşif API çağrıları için kullanılan AWS bölgesi. |
    | `providerFilter` | (tümü) | Bedrock sağlayıcı adlarıyla eşleşir (örneğin `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Saniye cinsinden önbellek süresi. Önbelleğe almayı devre dışı bırakmak için `0` olarak ayarlayın. |
    | `defaultContextWindow` | `32000` | Bilinen belirteç sınırları olmayan keşfedilmiş modeller için kullanılan bağlam penceresi (modelinizin sınırlarını biliyorsanız geçersiz kılın). |
    | `defaultMaxTokens` | `4096` | Bilinen belirteç sınırları olmayan keşfedilmiş modeller için kullanılan azami çıktı belirteci sayısı (modelinizin sınırlarını biliyorsanız geçersiz kılın). |

  </Accordion>

  <Accordion title="Bağlam penceresi ve azami belirteç sınırları">
    Bedrock `ListFoundationModels` ve `GetFoundationModel` API'leri belirteç
    sınırı meta verilerini döndürmez; yalnızca model kimliği, adı, kipleri ve
    yaşam döngüsü durumunu döndürür. OpenClaw, bu modeller için oturum yönetimi,
    Compaction eşikleri ve bağlam taşması algılamasının doğru çalışması amacıyla
    popüler Bedrock modellerinin (Claude, Nova, Llama, Mistral, DeepSeek ve
    diğerleri) bilinen bağlam pencereleri ile çıktı sınırlarını içeren bir arama
    tablosuyla birlikte gelir.

    Tabloda bulunmayan keşfedilmiş modeller `defaultContextWindow` ve
    `defaultMaxTokens` değerlerine geri döner. Kullandığınız bir modelin doğru
    sınırları eksikse açık bir
    `models.providers["amazon-bedrock"].models` girdisiyle bunları geçersiz kılın.

  </Accordion>
</AccordionGroup>

## Hızlı kurulum (AWS yolu)

Bu adım adım kılavuz bir IAM rolü oluşturur, Bedrock izinlerini ekler, örnek profilini ilişkilendirir ve EC2 sunucusunda OpenClaw keşfini etkinleştirir.

```bash
# 1. IAM rolünü ve örnek profilini oluşturun
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

# 4. İsteğe bağlı: açıkça etkinleştirmeden otomatik modu istiyorsanız bir ortam işaretçisi ekleyin
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Modellerin keşfedildiğini doğrulayın
openclaw models list
```

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Çıkarım profilleri">
    OpenClaw, temel modellerin yanı sıra **bölgesel ve küresel çıkarım
    profillerini** keşfeder. Bir profil bilinen bir temel modelle eşleştiğinde
    profil, o modelin yeteneklerini (bağlam penceresi, azami belirteç sayısı,
    akıl yürütme, görsel algılama) devralır ve doğru Bedrock istek bölgesi
    otomatik olarak eklenir. Bu sayede bölgeler arası Claude profilleri elle
    sağlayıcı geçersiz kılmaları olmadan çalışır. Küresel bölgeler arası
    profiller (`global.*`), genellikle daha iyi kapasite ve otomatik yük devri
    sundukları için `openclaw models list` çıktısında ilk sırada listelenir.

    Çıkarım profili kimlikleri bölgesel olarak
    `us.anthropic.claude-opus-4-6-v1:0` veya küresel olarak
    `anthropic.claude-opus-4-6-v1:0` biçimindedir. Destekleyen model keşif
    sonuçlarında zaten bulunuyorsa profil, modelin tüm yetenek kümesini
    devralır; aksi takdirde güvenli varsayılanlar uygulanır.

    Ek yapılandırma gerekmez. Keşif etkin olduğu ve IAM sorumlusu
    `bedrock:ListInferenceProfiles` iznine sahip olduğu sürece profiller,
    `openclaw models list` çıktısında temel modellerin yanında görünür.

  </Accordion>

  <Accordion title="Hizmet katmanı">
    Bazı Bedrock modelleri, maliyeti veya gecikmeyi optimize etmek için
    `service_tier` parametresini destekler. Aşağıdaki katmanlar kullanılabilir:

    | Katman | Açıklama |
    |--------|----------|
    | `default` | Standart Bedrock katmanı |
    | `flex` | Daha uzun gecikmeyi tolere edebilen iş yükleri için indirimli işleme |
    | `priority` | Gecikmeye duyarlı iş yükleri için öncelikli işleme |
    | `reserved` | Kararlı durumdaki iş yükleri için ayrılmış kapasite |

    Bedrock model istekleri için `serviceTier` (veya `service_tier`) değerini
    `agents.defaults.params` üzerinden ya da model başına
    `agents.defaults.models["<model-key>"].params` içinde ayarlayın:

    ```json5
    {
      agents: {
        defaults: {
          params: {
            serviceTier: "flex", // tüm modellere uygulanır
          },
          models: {
            "amazon-bedrock/mistral.mistral-large-3-675b-instruct": {
              params: {
                serviceTier: "priority", // model başına geçersiz kılma
              },
            },
          },
        },
      },
    }
    ```

    Geçerli değerler `default`, `flex`, `priority` ve `reserved` değerleridir. Claude
    Fable 5 ve Sonnet 5 yalnızca `default` katmanını destekler; OpenClaw, bu
    modeller için istenen `flex`, `priority` veya `reserved` değerleri hakkında
    uyarı verir ve bunları yok sayar. Diğer modellerde her model her katmanı
    desteklemez; desteklenmeyen bir katman Bedrock doğrulama hatası döndürür ve
    hata mesajı yanıltıcı olabilir (örneğin, sorunun katman olduğunu belirtmek
    yerine "The provided model identifier is invalid" denebilir). Bu hatayı
    görürseniz modelin istenen katmanı destekleyip desteklemediğini denetleyin.

  </Accordion>

  <Accordion title="Claude Opus 4.7 and 4.8 temperature">
    Bedrock, Claude Opus 4.7 ve Opus 4.8 için `temperature` parametresini
    reddeder. OpenClaw; temel model kimlikleri, adlandırılmış çıkarım profilleri,
    temel modeli `bedrock:GetInferenceProfile` aracılığıyla Opus 4.7/4.8 olarak
    çözümlenen uygulama çıkarım profilleri ve isteğe bağlı bölge öneklerine
    (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`, `global.`) sahip noktalı
    `opus-4.7`/`opus-4.8` varyantları dahil olmak üzere eşleşen tüm Bedrock
    başvurularında `temperature` değerini otomatik olarak çıkarır. Herhangi bir
    yapılandırma seçeneği gerekmez ve bu çıkarma hem istek seçenekleri nesnesine
    hem de `inferenceConfig` yük alanına uygulanır.
  </Accordion>

  <Accordion title="Claude Fable 5">
    `us-east-1` bölgesinde `amazon-bedrock/anthropic.claude-fable-5` veya
    `us.anthropic.claude-fable-5` gibi bölgesel çıkarım kimliklerini kullanın.
    OpenClaw; Fable'ın 1M bağlam penceresini, 128K çıktı sınırını, her zaman açık
    uyarlanabilir düşünmeyi ve desteklenen efor eşlemesini uygular. `/think off`
    ve `/think minimal`, `low` değerine eşlenir; sıcaklık ve zorunlu araç seçimi
    denetimleri, Opus 4.7/4.8 rotasıyla uyumlu olarak çıkarılır. Akış çıktısı,
    akış ortasındaki retlerin kısmi metni açığa çıkarmaması için Bedrock bir son
    durum döndürene kadar bekletilir.

    AWS, Fable kullanılabilir olmadan önce veri saklama için açık bir
    `provider_data_share` katılım onayı gerektirir. İstemler ve tamamlamalar
    Anthropic ile paylaşılır ve güven ile emniyet amacıyla 30 güne kadar
    saklanır. Modeli etkinleştirmeden önce
    [Bedrock veri saklama](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    ayarlarını inceleyip yapılandırın.

  </Accordion>

  <Accordion title="Claude Mythos 5">
    Claude Mythos 5, Bedrock üzerinden yalnızca gerekli sınırlı erişim onayına
    sahip hesaplar tarafından kullanılabilir. OpenClaw,
    `anthropic.claude-mythos-5` temel modelini ve
    `us.anthropic.claude-mythos-5` gibi bölgesel veya küresel çıkarım
    profillerini tanır.

    OpenClaw; 1.000.000 tokenlık bağlam penceresini, 128.000 tokenlık çıktı
    sınırını, görüntü girdisini, istem önbelleğe almayı, ret durumunda güvenli
    akışı ve yerel efor düzeylerini uygular. Uyarlanabilir düşünme her zaman
    etkindir: `/think off` ve `/think minimal`, `low` değerine eşlenirken
    `xhigh` ve `max` kullanılabilir kalır. Özel örnekleme ve zorunlu araç seçimi
    değerleri çıkarılır.

  </Accordion>

  <Accordion title="Claude Sonnet 5">
    AWS, Sonnet 5'i hem
    [`bedrock-runtime` hem de `bedrock-mantle` uç noktaları](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-5.html)
    için belgeler. OpenClaw, `anthropic.claude-sonnet-5` Bedrock temel modelini
    ve `us.anthropic.claude-sonnet-5` gibi bölgesel veya küresel çıkarım
    profillerini tanır. 1.000.000 tokenlık bağlam penceresini, 128.000 tokenlık
    çıktı sınırını, görüntü girdisini, yerel efor düzeylerini, istem önbelleğe
    almayı ve ret durumunda güvenli akışı uygular.

    Bedrock, Sonnet 5 için uyarlanabilir düşünmeyi etkin tutar. OpenClaw'ın
    varsayılanı `high` değeridir; bu rota düşünmeyi devre dışı bırakamadığı için
    `/think off` ve `/think minimal`, `low` değerine eşlenir. Uyarlanabilir
    düşünme etkinken özel sıcaklık ve zorunlu araç seçimi değerleri çıkarılır.

  </Accordion>

  <Accordion title="Guardrails">
    `amazon-bedrock` Plugin yapılandırmasına bir `guardrail` nesnesi ekleyerek
    [Amazon Bedrock Koruma Önlemlerini](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    tüm Bedrock model çağrılarına uygulayabilirsiniz. Koruma önlemleri; içerik
    filtrelemeyi, konu reddini, sözcük filtrelerini, hassas bilgi filtrelerini
    ve bağlamsal temellendirme denetimlerini zorunlu kılmanıza olanak tanır.

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // koruma önlemi kimliği veya tam ARN
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

    `guardrailIdentifier` ve `guardrailVersion` zorunludur.

    | Seçenek | Açıklama |
    | ------ | ----------- |
    | `guardrailIdentifier` | Koruma önlemi kimliği (ör. `abc123`) veya tam ARN (ör. `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Yayımlanmış sürüm numarası veya çalışma taslağı için `"DRAFT"`. |
    | `streamProcessingMode` | Akış sırasında koruma önlemi değerlendirmesi için `"sync"` veya `"async"`. Belirtilmezse Bedrock varsayılanını kullanır. |
    | `trace` | Hata ayıklama için `"enabled"` veya `"enabled_full"`; üretimde belirtmeyin ya da `"disabled"` olarak ayarlayın. |

    <Warning>
    Gateway tarafından kullanılan IAM sorumlusu, standart çağrı izinlerine ek olarak `bedrock:ApplyGuardrail` iznine sahip olmalıdır.
    </Warning>

  </Accordion>

  <Accordion title="Embeddings for memory search">
    Bedrock ayrıca
    [bellek araması](/tr/concepts/memory-search) için gömme sağlayıcısı olarak
    kullanılabilir. Bu, çıkarım sağlayıcısından ayrı olarak yapılandırılır;
    `agents.defaults.memorySearch.provider` değerini `"bedrock"` olarak ayarlayın:

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

    Bedrock gömmeleri, çıkarımla aynı AWS SDK kimlik bilgisi zincirini kullanır
    (örnek rolleri, SSO, erişim anahtarları, paylaşılan yapılandırma ve web
    kimliği). API anahtarı gerekmez.

    Desteklenen gömme modelleri arasında Amazon Titan Embed (v1, v2), Amazon
    Nova Embed, Cohere Embed (v3, v4) ve TwelveLabs Marengo bulunur. Tam model
    listesi ve boyut seçenekleri için
    [Bellek yapılandırması başvurusu -- Bedrock](/tr/reference/memory-config#bedrock-embedding-config)
    bölümüne bakın.

  </Accordion>

  <Accordion title="Notes and caveats">
    - Bedrock, AWS hesabınızda/bölgenizde **model erişiminin** etkinleştirilmesini gerektirir.
    - Otomatik keşif, `bedrock:ListFoundationModels` ve
      `bedrock:ListInferenceProfiles` izinlerini gerektirir.
    - Otomatik moda güveniyorsanız Gateway ana makinesinde desteklenen AWS kimlik
      doğrulama ortam işaretlerinden birini ayarlayın. Ortam işaretleri olmadan
      IMDS/paylaşılan yapılandırma kimlik doğrulamasını tercih ediyorsanız
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true` ayarını yapın.
    - OpenClaw, kimlik bilgisi kaynağını şu sırayla gösterir: `AWS_BEARER_TOKEN_BEDROCK`,
      ardından `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, ardından `AWS_PROFILE`,
      ardından varsayılan AWS SDK zinciri.
    - Akıl yürütme desteği modele bağlıdır; güncel yetenekler için Bedrock model
      kartını denetleyin.
    - Yönetilen bir anahtar akışını tercih ediyorsanız Bedrock'ın önüne
      OpenAI uyumlu bir proxy yerleştirip bunu bunun yerine bir OpenAI sağlayıcısı
      olarak da yapılandırabilirsiniz.
  </Accordion>
</AccordionGroup>

## İlgili içerik

<CardGroup cols={2}>
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Memory search" href="/tr/concepts/memory-search" icon="magnifying-glass">
    Bellek araması yapılandırması için Bedrock gömmeleri.
  </Card>
  <Card title="Memory config reference" href="/tr/reference/memory-config#bedrock-embedding-config" icon="database">
    Tam Bedrock gömme modeli listesi ve boyut seçenekleri.
  </Card>
  <Card title="Troubleshooting" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve sık sorulan sorular.
  </Card>
</CardGroup>

---
read_when:
    - OpenClaw ile Amazon Bedrock modellerini kullanmak istiyorsunuz
    - Model çağrıları için AWS kimlik bilgisi/bölge yapılandırması gerekir
summary: Amazon Bedrock (Converse API) modellerini OpenClaw ile kullanın
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-30T09:39:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6c08ab141423a70e5283ddaf72bf6396bcef411dfa36e1c4b5632377f8ea2d8
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw, pi-ai'nin **Bedrock Converse** akış sağlayıcısı üzerinden **Amazon Bedrock** modellerini kullanabilir. Bedrock kimlik doğrulaması API anahtarı değil, **AWS SDK varsayılan kimlik bilgisi zincirini** kullanır.

| Özellik | Değer                                                       |
| -------- | ----------------------------------------------------------- |
| Sağlayıcı | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| Kimlik doğrulama     | AWS kimlik bilgileri (ortam değişkenleri, paylaşılan yapılandırma veya instance rolü) |
| Bölge   | `AWS_REGION` veya `AWS_DEFAULT_REGION` (varsayılan: `us-east-1`) |

## Başlarken

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="Access keys / env vars">
    **En uygun olduğu yerler:** geliştirici makineleri, CI veya AWS kimlik bilgilerini doğrudan yönettiğiniz ana makineler.

    <Steps>
      <Step title="Set AWS credentials on the gateway host">
        ```bash
        export AWS_ACCESS_KEY_ID="AKIA..."
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Optional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Optional (Bedrock API key/bearer token):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Add a Bedrock provider and model to your config">
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
      <Step title="Verify models are available">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    Env-marker kimlik doğrulamasıyla (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` veya `AWS_BEARER_TOKEN_BEDROCK`), OpenClaw ek yapılandırma olmadan model keşfi için örtük Bedrock sağlayıcısını otomatik olarak etkinleştirir.
    </Tip>

  </Tab>

  <Tab title="EC2 instance roles (IMDS)">
    **En uygun olduğu yerler:** kimlik doğrulaması için instance metadata service kullanan, IAM rolü eklenmiş EC2 instance'ları.

    <Steps>
      <Step title="Enable discovery explicitly">
        IMDS kullanırken OpenClaw, AWS kimlik doğrulamasını yalnızca ortam işaretlerinden algılayamaz, bu yüzden açıkça katılmanız gerekir:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Optionally add an env marker for auto mode">
        Env-marker otomatik algılama yolunun da çalışmasını istiyorsanız (örneğin `openclaw status` yüzeyleri için):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        Sahte bir API anahtarına **ihtiyacınız yoktur**.
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    EC2 instance'ınıza eklenen IAM rolünün şu izinlere sahip olması gerekir:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (otomatik keşif için)
    - `bedrock:ListInferenceProfiles` (çıkarım profili keşfi için)

    Veya yönetilen `AmazonBedrockFullAccess` ilkesini ekleyin.
    </Warning>

    <Note>
    `AWS_PROFILE=default` yalnızca otomatik mod veya durum yüzeyleri için özellikle bir ortam işareti istiyorsanız gerekir. Gerçek Bedrock runtime kimlik doğrulama yolu AWS SDK varsayılan zincirini kullanır, bu yüzden IMDS instance rolü kimlik doğrulaması ortam işaretleri olmadan da çalışır.
    </Note>

  </Tab>
</Tabs>

## Otomatik model keşfi

OpenClaw, **akışı** ve **metin çıktısını** destekleyen Bedrock modellerini otomatik olarak keşfedebilir. Keşif `bedrock:ListFoundationModels` ve `bedrock:ListInferenceProfiles` kullanır ve sonuçlar önbelleğe alınır (varsayılan: 1 saat).

Örtük sağlayıcı nasıl etkinleştirilir:

- `plugins.entries.amazon-bedrock.config.discovery.enabled` `true` ise OpenClaw, AWS ortam işareti olmasa bile keşfi dener.
- `plugins.entries.amazon-bedrock.config.discovery.enabled` ayarlanmamışsa OpenClaw, örtük Bedrock sağlayıcısını yalnızca şu AWS kimlik doğrulama işaretlerinden birini gördüğünde otomatik olarak ekler: `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` veya `AWS_PROFILE`.
- Gerçek Bedrock runtime kimlik doğrulama yolu yine AWS SDK varsayılan zincirini kullanır; bu yüzden paylaşılan yapılandırma, SSO ve IMDS instance rolü kimlik doğrulaması, keşif için katılım amacıyla `enabled: true` gerekmiş olsa bile çalışabilir.

<Note>
Açık `models.providers["amazon-bedrock"]` girdileri için OpenClaw, tam runtime kimlik doğrulama yüklemesini zorlamadan `AWS_BEARER_TOKEN_BEDROCK` gibi AWS ortam işaretlerinden Bedrock env-marker kimlik doğrulamasını yine erken çözümleyebilir. Gerçek model çağrısı kimlik doğrulama yolu yine AWS SDK varsayılan zincirini kullanır.
</Note>

<AccordionGroup>
  <Accordion title="Discovery config options">
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
    | `enabled` | otomatik | Otomatik modda OpenClaw, örtük Bedrock sağlayıcısını yalnızca desteklenen bir AWS ortam işareti gördüğünde etkinleştirir. Keşfi zorlamak için `true` olarak ayarlayın. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Keşif API çağrıları için kullanılan AWS bölgesi. |
    | `providerFilter` | (tümü) | Bedrock sağlayıcı adlarıyla eşleşir (örneğin `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Saniye cinsinden önbellek süresi. Önbelleği devre dışı bırakmak için `0` olarak ayarlayın. |
    | `defaultContextWindow` | `32000` | Keşfedilen modeller için kullanılan bağlam penceresi (model sınırlarınızı biliyorsanız geçersiz kılın). |
    | `defaultMaxTokens` | `4096` | Keşfedilen modeller için kullanılan en fazla çıktı token'ı (model sınırlarınızı biliyorsanız geçersiz kılın). |

  </Accordion>
</AccordionGroup>

## Hızlı kurulum (AWS yolu)

Bu kılavuz bir IAM rolü oluşturur, Bedrock izinlerini ekler, instance profilini ilişkilendirir ve EC2 ana makinesinde OpenClaw keşfini etkinleştirir.

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
  <Accordion title="Inference profiles">
    OpenClaw, foundation modellerinin yanında **bölgesel ve genel çıkarım profillerini** keşfeder. Bir profil bilinen bir foundation modeline eşlendiğinde profil, o modelin yeteneklerini (bağlam penceresi, en fazla token, akıl yürütme, görme) devralır ve doğru Bedrock istek bölgesi otomatik olarak enjekte edilir. Bu, bölgeler arası Claude profillerinin manuel sağlayıcı geçersiz kılmaları olmadan çalıştığı anlamına gelir.

    Çıkarım profili kimlikleri `us.anthropic.claude-opus-4-6-v1:0` (bölgesel) veya `anthropic.claude-opus-4-6-v1:0` (genel) gibi görünür. Arka plandaki model zaten keşif sonuçlarındaysa profil tüm yetenek kümesini devralır; aksi takdirde güvenli varsayılanlar uygulanır.

    Ek yapılandırma gerekmez. Keşif etkin olduğu ve IAM principal'ı `bedrock:ListInferenceProfiles` iznine sahip olduğu sürece profiller, `openclaw models list` içinde foundation modellerinin yanında görünür.

  </Accordion>

  <Accordion title="Claude Opus 4.7 temperature">
    Bedrock, Claude Opus 4.7 için `temperature` parametresini reddeder. OpenClaw, foundation model kimlikleri, adlandırılmış çıkarım profilleri, temel modeli `bedrock:GetInferenceProfile` aracılığıyla Opus 4.7 olarak çözümlenen uygulama çıkarım profilleri ve isteğe bağlı bölge öneklerine (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`, `global.`) sahip noktalı `opus-4.7` varyantları dahil olmak üzere tüm Opus 4.7 Bedrock referansları için `temperature` değerini otomatik olarak atlar. Yapılandırma düğmesi gerekmez ve bu atlama hem istek seçenekleri nesnesine hem de `inferenceConfig` payload alanına uygulanır.
  </Accordion>

  <Accordion title="Guardrails">
    `amazon-bedrock` plugin yapılandırmasına bir `guardrail` nesnesi ekleyerek [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html) özelliğini tüm Bedrock model çağrılarına uygulayabilirsiniz. Guardrails; içerik filtreleme, konu reddi, kelime filtreleri, hassas bilgi filtreleri ve bağlamsal dayanak kontrollerini zorunlu kılmanızı sağlar.

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
    | `trace` | Hayır | Hata ayıklama için `"enabled"` veya `"enabled_full"`; üretim için atlayın veya `"disabled"` olarak ayarlayın. |

    <Warning>
    Gateway tarafından kullanılan IAM principal'ı, standart invoke izinlerine ek olarak `bedrock:ApplyGuardrail` iznine sahip olmalıdır.
    </Warning>

  </Accordion>

  <Accordion title="Bellek araması için embedding'ler">
    Bedrock ayrıca
    [bellek araması](/tr/concepts/memory-search) için embedding sağlayıcısı olarak da kullanılabilir. Bu, çıkarım sağlayıcısından ayrı yapılandırılır -- `agents.defaults.memorySearch.provider` değerini `"bedrock"` olarak ayarlayın:

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

    Bedrock embedding'leri, çıkarımla aynı AWS SDK kimlik bilgisi zincirini kullanır (instance
    rolleri, SSO, erişim anahtarları, paylaşılan yapılandırma ve web kimliği). API anahtarı
    gerekmez. `provider` `"auto"` olduğunda, bu kimlik bilgisi zinciri başarıyla çözümlenirse Bedrock otomatik olarak algılanır.

    Desteklenen embedding modelleri arasında Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) ve TwelveLabs Marengo bulunur. Tam model listesi ve boyut seçenekleri için
    [Bellek yapılandırma başvurusu -- Bedrock](/tr/reference/memory-config#bedrock-embedding-config)
    bölümüne bakın.

  </Accordion>

  <Accordion title="Notlar ve dikkat edilmesi gerekenler">
    - Bedrock, AWS hesabınızda/bölgenizde **model erişiminin** etkinleştirilmesini gerektirir.
    - Otomatik keşif için `bedrock:ListFoundationModels` ve
      `bedrock:ListInferenceProfiles` izinleri gerekir.
    - Otomatik moda güveniyorsanız, gateway ana makinesinde desteklenen AWS kimlik doğrulama ortam işaretçilerinden birini ayarlayın. Ortam işaretçileri olmadan IMDS/paylaşılan yapılandırma kimlik doğrulamasını tercih ediyorsanız,
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true` ayarını yapın.
    - OpenClaw kimlik bilgisi kaynağını şu sırayla gösterir: `AWS_BEARER_TOKEN_BEDROCK`,
      ardından `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, ardından `AWS_PROFILE`, ardından varsayılan AWS SDK zinciri.
    - Akıl yürütme desteği modele bağlıdır; güncel yetenekler için Bedrock model kartını kontrol edin.
    - Yönetilen bir anahtar akışını tercih ediyorsanız, Bedrock önüne OpenAI uyumlu bir
      proxy de yerleştirip bunu bunun yerine bir OpenAI sağlayıcısı olarak yapılandırabilirsiniz.
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

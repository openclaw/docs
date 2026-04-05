---
read_when:
    - Amazon Bedrock modellerini OpenClaw ile kullanmak istiyorsunuz
    - Model çağrıları için AWS kimlik bilgileri/bölge kurulumuna ihtiyacınız var
summary: Amazon Bedrock (Converse API) modellerini OpenClaw ile kullanın
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-05T14:03:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: a751824b679a9340db714ee5227e8d153f38f6c199ca900458a4ec092b4efe54
    source_path: providers/bedrock.md
    workflow: 15
---

# Amazon Bedrock

OpenClaw, pi‑ai'nin **Bedrock Converse**
akış sağlayıcısı aracılığıyla **Amazon Bedrock** modellerini kullanabilir. Bedrock kimlik doğrulaması, bir API anahtarı değil, **AWS SDK varsayılan kimlik bilgisi zincirini** kullanır.

## pi-ai neleri destekler

- Sağlayıcı: `amazon-bedrock`
- API: `bedrock-converse-stream`
- Kimlik doğrulama: AWS kimlik bilgileri (ortam değişkenleri, paylaşılan yapılandırma veya örnek rolü)
- Bölge: `AWS_REGION` veya `AWS_DEFAULT_REGION` (varsayılan: `us-east-1`)

## Otomatik model keşfi

OpenClaw, **akışı** ve **metin çıktısını** destekleyen Bedrock modellerini otomatik olarak keşfedebilir.
Keşif için `bedrock:ListFoundationModels` ve
`bedrock:ListInferenceProfiles` kullanılır ve sonuçlar önbelleğe alınır (varsayılan: 1 saat).

Örtük sağlayıcının nasıl etkinleştirildiği:

- `plugins.entries.amazon-bedrock.config.discovery.enabled` değeri `true` ise,
  OpenClaw hiçbir AWS env marker mevcut olmasa bile keşfi deneyecektir.
- `plugins.entries.amazon-bedrock.config.discovery.enabled` ayarlanmamışsa,
  OpenClaw yalnızca şu AWS kimlik doğrulama işaretçilerinden birini gördüğünde
  örtük Bedrock sağlayıcısını otomatik olarak ekler:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` veya `AWS_PROFILE`.
- Gerçek Bedrock çalışma zamanı kimlik doğrulama yolu yine de AWS SDK varsayılan zincirini kullanır; bu nedenle
  keşif için katılım sağlamak amacıyla `enabled: true` gerekmiş olsa bile
  paylaşılan yapılandırma, SSO ve IMDS örnek rolü kimlik doğrulaması çalışabilir.

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

Notlar:

- `enabled` varsayılan olarak otomatik moddadır. Otomatik modda OpenClaw,
  örtük Bedrock sağlayıcısını yalnızca desteklenen bir AWS env marker gördüğünde etkinleştirir.
- `region` varsayılan olarak `AWS_REGION` veya `AWS_DEFAULT_REGION`, ardından `us-east-1` kullanır.
- `providerFilter`, Bedrock sağlayıcı adlarıyla eşleşir (örneğin `anthropic`).
- `refreshInterval` saniye cinsindendir; önbelleği devre dışı bırakmak için `0` olarak ayarlayın.
- `defaultContextWindow` (varsayılan: `32000`) ve `defaultMaxTokens` (varsayılan: `4096`)
  keşfedilen modeller için kullanılır (model sınırlarınızı biliyorsanız geçersiz kılın).
- Açık `models.providers["amazon-bedrock"]` girdileri için OpenClaw, tam çalışma zamanı kimlik doğrulama yüklemesini zorlamadan
  `AWS_BEARER_TOKEN_BEDROCK` gibi AWS env marker'lardan Bedrock env-marker kimlik doğrulamasını yine de
  erken çözümleyebilir. Gerçek model çağrısı kimlik doğrulama yolu hâlâ AWS SDK varsayılan zincirini kullanır.

## Onboarding

1. AWS kimlik bilgilerinin **gateway ana makinesinde** kullanılabilir olduğundan emin olun:

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

2. Yapılandırmanıza bir Bedrock sağlayıcısı ve model ekleyin (`apiKey` gerekmez):

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

## EC2 Örnek Rolleri

OpenClaw, bağlı bir IAM rolü olan bir EC2 örneğinde çalıştırıldığında AWS SDK,
kimlik doğrulaması için örnek meta veri hizmetini (IMDS) kullanabilir. Bedrock
model keşfi için OpenClaw, yalnızca AWS env marker'lardan örtük sağlayıcıyı otomatik etkinleştirir; siz açıkça
`plugins.entries.amazon-bedrock.config.discovery.enabled: true`
ayarını yapmadıkça.

IMDS destekli ana makineler için önerilen kurulum:

- `plugins.entries.amazon-bedrock.config.discovery.enabled` değerini `true` olarak ayarlayın.
- `plugins.entries.amazon-bedrock.config.discovery.region` değerini ayarlayın (veya `AWS_REGION` dışa aktarın).
- Sahte bir API anahtarına **ihtiyacınız yoktur**.
- Yalnızca otomatik mod veya durum yüzeyleri için özellikle bir env marker istiyorsanız `AWS_PROFILE=default` gerekir.

```bash
# Recommended: explicit discovery enable + region
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# Optional: add an env marker if you want auto mode without explicit enable
export AWS_PROFILE=default
export AWS_REGION=us-east-1
```

EC2 örnek rolü için **gerekli IAM izinleri**:

- `bedrock:InvokeModel`
- `bedrock:InvokeModelWithResponseStream`
- `bedrock:ListFoundationModels` (otomatik keşif için)
- `bedrock:ListInferenceProfiles` (çıkarım profili keşfi için)

Veya yönetilen `AmazonBedrockFullAccess` ilkesini ekleyin.

## Hızlı kurulum (AWS yolu)

```bash
# 1. IAM rolü ve örnek profili oluşturun
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

# 4. İsteğe bağlı: açık etkinleştirme olmadan otomatik mod istiyorsanız bir env marker ekleyin
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Modellerin keşfedildiğini doğrulayın
openclaw models list
```

## Çıkarım profilleri

OpenClaw, foundation modellerinin yanında **bölgesel ve global çıkarım profillerini**
de keşfeder. Bir profil bilinen bir foundation model ile eşleştiğinde,
profil o modelin yeteneklerini (bağlam penceresi, maksimum token,
reasoning, vision) devralır ve doğru Bedrock istek bölgesi
otomatik olarak eklenir. Bu, bölgeler arası Claude profillerinin manuel
sağlayıcı geçersiz kılmaları olmadan çalıştığı anlamına gelir.

Çıkarım profili kimlikleri `us.anthropic.claude-opus-4-6-v1:0` (bölgesel)
veya `anthropic.claude-opus-4-6-v1:0` (global) gibi görünür. Destekleyen model zaten
keşif sonuçlarındaysa profil tam yetenek kümesini devralır;
aksi takdirde güvenli varsayılanlar uygulanır.

Ek yapılandırma gerekmez. Keşif etkin olduğu ve IAM
principal `bedrock:ListInferenceProfiles` iznine sahip olduğu sürece profiller,
`openclaw models list` içinde foundation modellerinin yanında görünür.

## Notlar

- Bedrock, AWS hesabınızda/bölgenizde **model erişiminin** etkinleştirilmiş olmasını gerektirir.
- Otomatik keşif için `bedrock:ListFoundationModels` ve
  `bedrock:ListInferenceProfiles` izinleri gerekir.
- Otomatik moda güveniyorsanız, gateway ana makinesinde desteklenen AWS kimlik doğrulama env marker'larından birini ayarlayın.
  Env marker olmadan IMDS/paylaşılan yapılandırma kimlik doğrulamasını tercih ediyorsanız,
  `plugins.entries.amazon-bedrock.config.discovery.enabled: true` ayarını yapın.
- OpenClaw kimlik bilgisi kaynağını şu sırayla gösterir: `AWS_BEARER_TOKEN_BEDROCK`,
  ardından `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, sonra `AWS_PROFILE`, ardından
  varsayılan AWS SDK zinciri.
- Reasoning desteği modele bağlıdır; güncel yetenekler için Bedrock model kartını
  kontrol edin.
- Yönetilen bir anahtar akışını tercih ederseniz, Bedrock önüne OpenAI uyumlu bir
  proxy de koyabilir ve bunu bunun yerine bir OpenAI sağlayıcısı olarak yapılandırabilirsiniz.

## Guardrails

`amazon-bedrock` plugin yapılandırmasına bir `guardrail` nesnesi
ekleyerek [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
özelliğini tüm Bedrock model çağrılarına uygulayabilirsiniz. Guardrails, içerik filtreleme,
konu reddetme, kelime filtreleri, hassas bilgi filtreleri ve bağlamsal
temellendirme kontrolleri uygulamanıza olanak tanır.

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

- `guardrailIdentifier` (gerekli), bir guardrail kimliğini (örn. `abc123`) veya
  tam bir ARN'yi (örn. `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`) kabul eder.
- `guardrailVersion` (gerekli), hangi yayımlanmış sürümün kullanılacağını veya
  çalışma taslağı için `"DRAFT"` değerini belirtir.
- `streamProcessingMode` (isteğe bağlı), guardrail değerlendirmesinin akış sırasında eşzamanlı (`"sync"`)
  mı yoksa eşzamansız (`"async"`) mı çalışacağını kontrol eder. Atlanırsa,
  Bedrock varsayılan davranışını kullanır.
- `trace` (isteğe bağlı), API yanıtında guardrail trace çıktısını etkinleştirir. Hata ayıklama için
  `"enabled"` veya `"enabled_full"` olarak ayarlayın; üretim için atlayın veya `"disabled"` olarak ayarlayın.

Gateway tarafından kullanılan IAM principal, standart çağrı izinlerine ek olarak
`bedrock:ApplyGuardrail` iznine de sahip olmalıdır.

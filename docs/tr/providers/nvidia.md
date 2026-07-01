---
read_when:
    - OpenClaw'da açık modelleri ücretsiz kullanmak istiyorsunuz
    - NVIDIA_API_KEY kurulumu gerekiyor
    - Nemotron 3 Ultra'yı NVIDIA üzerinden kullanmak istiyorsunuz
summary: OpenClaw’da NVIDIA’nın OpenAI uyumlu API’sini kullanın
title: NVIDIA
x-i18n:
    generated_at: "2026-07-01T20:34:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b738746acead8dcaa74a39b13b4413171c5bf60efa5166dbc9b259d883a4e22
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA, ücretsiz açık modeller için `https://integrate.api.nvidia.com/v1` adresinde
OpenAI uyumlu bir API sağlar. [build.nvidia.com](https://build.nvidia.com/settings/api-keys)
üzerinden alınan bir API anahtarıyla kimlik doğrulaması yapın. OpenClaw,
NVIDIA sağlayıcısının varsayılanını uzun bağlamlı ajan tabanlı işler için NVIDIA'nın 550B toplam / 55B
aktif akıl yürütme modeli olan Nemotron 3 Ultra olarak ayarlar.

## Başlarken

<Steps>
  <Step title="API anahtarınızı alın">
    [build.nvidia.com](https://build.nvidia.com/settings/api-keys) üzerinde bir API anahtarı oluşturun.
  </Step>
  <Step title="Anahtarı dışa aktarın ve onboarding'i çalıştırın">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Bir NVIDIA modeli ayarlayın">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

<Warning>
Env var yerine `--nvidia-api-key` geçirirseniz, değer kabuk geçmişine ve `ps`
çıktısına düşer. Mümkün olduğunda `NVIDIA_API_KEY` ortam değişkenini tercih edin.
</Warning>

Etkileşimsiz kurulum için anahtarı doğrudan da geçirebilirsiniz:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

## Yapılandırma örneği

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-ultra-550b-a55b" },
    },
  },
}
```

## Öne çıkan katalog

Bir NVIDIA API anahtarı yapılandırıldığında, OpenClaw kurulum ve model seçimi yolları
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` adresinden
NVIDIA'nın herkese açık öne çıkan model kataloğunu dener ve sıralı sonucu 24 saat boyunca
önbelleğe alır. Bu nedenle build.nvidia.com'daki yeni öne çıkan modeller,
OpenClaw sürümünü beklemeden kurulum ve model seçimi yüzeylerinde görünür.
Canlı akış kullanılabilir olduğunda, döndürülen ilk model NVIDIA kurulumu sırasında
gösterilen varsayılan seçenektir.

Getirme işlemi `assets.ngc.nvidia.com` için sabit bir HTTPS ana makine ilkesi kullanır. Hiçbir
NVIDIA API anahtarı yapılandırılmamışsa veya bu herkese açık katalog kullanılamıyor ya da
bozuksa, OpenClaw aşağıdaki paketli kataloğa ve paketli varsayılana geri döner.

## Nemotron 3 Ultra

Nemotron 3 Ultra, OpenClaw'daki varsayılan NVIDIA modelidir. NVIDIA'nın
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
için build sayfası, bunu 1M-token bağlam belirtimine sahip kullanılabilir ücretsiz bir endpoint
olarak listeler. Paketli katalog, barındırılan endpoint için NVIDIA'nın mevcut
OpenAI uyumlu örnek isteğiyle eşleşmesi için 16.384-token maksimum çıktıyı kaydeder.

En yüksek kapasiteli NVIDIA varsayılanı için Ultra'yı kullanın. Daha küçük Nemotron 3
seçeneğini istediğinizde Super'i seçili tutun veya bağlamı, gecikmesi ya da davranışı
daha uygunsa NVIDIA'nın kataloğunda barındırılan üçüncü taraf modellerden birini seçin.
Paketli Ultra satırı, normal sohbet çıktısının akıl yürütme metnini açığa çıkarmak yerine
görünür yanıtta kalması için varsayılan olarak `chat_template_kwargs.enable_thinking: false` ve
`force_nonempty_content: true` gönderir.

## Paketli geri dönüş kataloğu

| Model ref                                  | Ad                           | Bağlam    | Maks. çıktı | Notlar                            |
| ------------------------------------------ | ---------------------------- | --------- | ----------- | --------------------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1.000.000 | 16.384      | Varsayılan                        |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 1.048.576 | 8.192       | Öne çıkan geri dönüş              |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262.144   | 8.192       | Öne çıkan geri dönüş              |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196.608   | 8.192       | Öne çıkan geri dönüş              |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202.752   | 8.192       | Öne çıkan geri dönüş              |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196.608   | 8.192       | Kullanımdan kaldırıldı, yükseltme uyumluluğu |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202.752   | 8.192       | Kullanımdan kaldırıldı, yükseltme uyumluluğu |

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Otomatik etkinleştirme davranışı">
    `NVIDIA_API_KEY` ortam değişkeni ayarlandığında sağlayıcı otomatik olarak etkinleşir.
    Anahtar dışında açık bir sağlayıcı yapılandırması gerekmez.
  </Accordion>

  <Accordion title="Katalog ve fiyatlandırma">
    NVIDIA kimlik doğrulaması yapılandırıldığında OpenClaw, NVIDIA'nın herkese açık
    öne çıkan model kataloğunu tercih eder ve bunu 24 saat boyunca önbelleğe alır.
    Paketli geri dönüş kataloğu statiktir ve yükseltme uyumluluğu için kullanımdan
    kaldırılmış yayınlanmış ref'leri tutar. NVIDIA şu anda listelenen modeller için
    ücretsiz API erişimi sunduğundan maliyetler kaynakta varsayılan olarak `0` olur.
  </Accordion>

  <Accordion title="OpenAI uyumlu endpoint">
    NVIDIA, standart `/v1` completions endpoint'ini kullanır. OpenAI uyumlu tüm
    araçlar NVIDIA base URL'iyle kutudan çıktığı gibi çalışmalıdır.
  </Accordion>

  <Accordion title="Nemotron 3 Ultra akıl yürütme parametreleri">
    NVIDIA'nın Ultra örnek isteği, akıl yürütme çıktısı için `chat_template_kwargs.enable_thinking`
    ve `reasoning_budget` kullanır. OpenClaw'ın paketli Ultra satırı, normal sohbet
    kullanımı için şablon düşünmeyi varsayılan olarak devre dışı bırakır. NVIDIA akıl
    yürütme çıktısına dahil olmanız veya NVIDIA'ya özgü diğer istek alanlarını zorlamanız
    gerekiyorsa, model başına parametreler ayarlayın ve sağlayıcıya özgü geçersiz kılmaları
    NVIDIA modeliyle sınırlı tutun:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "nvidia/nvidia/nemotron-3-ultra-550b-a55b": {
              params: {
                chat_template_kwargs: { enable_thinking: true },
                extra_body: { reasoning_budget: 16384 },
              },
            },
          },
        },
      },
    }
    ```

    `params.extra_body`, son OpenAI uyumlu istek gövdesi geçersiz kılmasıdır; bu nedenle
    yalnızca NVIDIA'nın seçili endpoint için belgelediği alanlarda kullanın.

  </Accordion>

  <Accordion title="Yavaş özel sağlayıcı yanıtları">
    NVIDIA'da barındırılan bazı özel modeller, ilk yanıt parçasını yayınlamadan önce
    varsayılan model idle watchdog süresinden daha uzun sürebilir. Özel NVIDIA sağlayıcı
    girdileri için, tüm agent çalışma zamanı zaman aşımını yükseltmek yerine sağlayıcı
    zaman aşımını artırın:

    ```json5
    {
      models: {
        providers: {
          "custom-integrate-api-nvidia-com": {
            baseUrl: "https://integrate.api.nvidia.com/v1",
            api: "openai-completions",
            apiKey: "NVIDIA_API_KEY",
            timeoutSeconds: 300,
          },
        },
      },
      agents: {
        defaults: {
          models: {
            "custom-integrate-api-nvidia-com/meta/llama-3.1-70b-instruct": {
              params: { thinking: "off" },
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

<Tip>
NVIDIA modelleri şu anda ücretsiz olarak kullanılabilir. En güncel kullanılabilirlik ve
hız sınırı ayrıntıları için [build.nvidia.com](https://build.nvidia.com/) adresini kontrol edin.
</Tip>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve failover davranışını seçme.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/configuration-reference" icon="gear">
    Ajanlar, modeller ve sağlayıcılar için tam yapılandırma referansı.
  </Card>
</CardGroup>

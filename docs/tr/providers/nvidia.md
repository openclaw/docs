---
read_when:
    - OpenClaw'da açık modelleri ücretsiz kullanmak istiyorsunuz
    - NVIDIA_API_KEY yapılandırması gerekir
    - Nemotron 3 Ultra'yı NVIDIA üzerinden kullanmak istiyorsunuz
summary: OpenClaw’da NVIDIA’nın OpenAI uyumlu API’sini kullanın
title: NVIDIA
x-i18n:
    generated_at: "2026-06-28T01:11:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e94b1d1ab19c6ddb6b26678d5342d55a2b9e9499f4058adbd462b15b9d9e7dd
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA, açık modeller için ücretsiz olarak `https://integrate.api.nvidia.com/v1` adresinde OpenAI uyumlu bir API sağlar. [build.nvidia.com](https://build.nvidia.com/settings/api-keys) üzerinden alınan bir API anahtarıyla kimlik doğrulaması yapın. OpenClaw, NVIDIA sağlayıcısını varsayılan olarak uzun bağlamlı ajan temelli işler için NVIDIA'nın 550B toplam / 55B etkin akıl yürütme modeli olan Nemotron 3 Ultra'ya ayarlar.

## Başlarken

<Steps>
  <Step title="API anahtarınızı alın">
    [build.nvidia.com](https://build.nvidia.com/settings/api-keys) adresinde bir API anahtarı oluşturun.
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
Env var yerine `--nvidia-api-key` geçirirseniz değer shell geçmişine ve `ps` çıktısına düşer. Mümkün olduğunda `NVIDIA_API_KEY` ortam değişkenini tercih edin.
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

Bir NVIDIA API anahtarı yapılandırıldığında, OpenClaw kurulum ve model seçimi yolları NVIDIA'nın herkese açık öne çıkan model kataloğunu `https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` adresinden denemeye çalışır ve sıralanmış sonucu 24 saat boyunca önbelleğe alır. Bu nedenle build.nvidia.com üzerindeki yeni öne çıkan modeller, bir OpenClaw sürümünü beklemeden kurulum ve model seçimi yüzeylerinde görünür. Canlı feed kullanılabilir olduğunda, döndürülen ilk model NVIDIA kurulumu sırasında gösterilen varsayılan seçenektir.

Getirme işlemi `assets.ngc.nvidia.com` için sabit bir HTTPS host ilkesi kullanır. NVIDIA API anahtarı yapılandırılmamışsa ya da bu herkese açık katalog kullanılamıyorsa veya bozuk biçimliyse OpenClaw aşağıdaki paketlenmiş kataloğa ve paketlenmiş varsayılana geri döner.

## Nemotron 3 Ultra

Nemotron 3 Ultra, OpenClaw'daki varsayılan NVIDIA modelidir. NVIDIA'nın [`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b) için build sayfası, onu 1M-token bağlam belirtimiyle kullanılabilir ücretsiz bir endpoint olarak listeler. Paketlenmiş katalog, barındırılan endpoint için NVIDIA'nın güncel OpenAI uyumlu örnek isteğiyle eşleşmesi için 16.384-token maksimum çıktıyı kaydeder.

En yüksek yetenekli NVIDIA varsayılanı için Ultra'yı kullanın. Daha küçük Nemotron 3 seçeneğini istediğinizde Super seçili kalsın veya bağlamı, gecikmesi ya da davranışı daha uygunsa NVIDIA'nın kataloğunda barındırılan üçüncü taraf modellerden birini seçin. Paketlenmiş Ultra satırı, normal sohbet çıktısının akıl yürütme metnini açığa çıkarmak yerine görünür yanıtta kalması için varsayılan olarak `chat_template_kwargs.enable_thinking: false` ve `force_nonempty_content: true` gönderir.

## Paketlenmiş geri dönüş kataloğu

| Model ref                                  | Ad                           | Bağlam    | Maksimum çıktı | Notlar                                      |
| ------------------------------------------ | ---------------------------- | --------- | -------------- | ------------------------------------------ |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384         | Varsayılan                                 |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144   | 8,192          | Öne çıkan geri dönüş                       |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192          | Öne çıkan geri dönüş                       |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192          | Öne çıkan geri dönüş                       |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192          | Öne çıkan geri dönüş                       |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192          | Kullanımdan kaldırıldı, yükseltme uyumluluğu |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192          | Kullanımdan kaldırıldı, yükseltme uyumluluğu |

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Otomatik etkinleştirme davranışı">
    `NVIDIA_API_KEY` ortam değişkeni ayarlandığında sağlayıcı otomatik etkinleşir. Anahtar dışında açık bir sağlayıcı yapılandırması gerekmez.
  </Accordion>

  <Accordion title="Katalog ve fiyatlandırma">
    OpenClaw, NVIDIA kimlik doğrulaması yapılandırıldığında NVIDIA'nın herkese açık öne çıkan model kataloğunu tercih eder ve bunu 24 saat boyunca önbelleğe alır. Paketlenmiş geri dönüş kataloğu statiktir ve yükseltme uyumluluğu için kullanımdan kaldırılmış yayımlanmış ref'leri tutar. NVIDIA şu anda listelenen modeller için ücretsiz API erişimi sunduğundan maliyetler kaynakta varsayılan olarak `0` olur.
  </Accordion>

  <Accordion title="OpenAI uyumlu endpoint">
    NVIDIA standart `/v1` completions endpoint'ini kullanır. OpenAI uyumlu tüm araçlar NVIDIA temel URL'siyle kutudan çıktığı gibi çalışmalıdır.
  </Accordion>

  <Accordion title="Nemotron 3 Ultra akıl yürütme parametreleri">
    NVIDIA'nın Ultra örnek isteği, akıl yürütme çıktısı için `chat_template_kwargs.enable_thinking` ve `reasoning_budget` kullanır. OpenClaw'ın paketlenmiş Ultra satırı, normal sohbet kullanımı için template thinking'i varsayılan olarak devre dışı bırakır. NVIDIA akıl yürütme çıktısını etkinleştirmeniz veya NVIDIA'ya özgü başka istek alanlarını zorlamanız gerekiyorsa model bazında parametreler ayarlayın ve sağlayıcıya özgü geçersiz kılmaları NVIDIA modeliyle sınırlı tutun:

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

    `params.extra_body`, son OpenAI uyumlu request-body geçersiz kılmasıdır; bu yüzden bunu yalnızca NVIDIA'nın seçilen endpoint için belgelediği alanlarda kullanın.

  </Accordion>

  <Accordion title="Yavaş özel sağlayıcı yanıtları">
    NVIDIA'da barındırılan bazı özel modeller, ilk yanıt parçasını yaymadan önce varsayılan model boşta kalma watchdog'undan daha uzun sürebilir. Özel NVIDIA sağlayıcı girdilerinde, tüm ajan runtime zaman aşımını artırmak yerine sağlayıcı zaman aşımını artırın:

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
NVIDIA modelleri şu anda ücretsiz kullanılabilir. En güncel kullanılabilirlik ve hız sınırı ayrıntıları için [build.nvidia.com](https://build.nvidia.com/) adresini kontrol edin.
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

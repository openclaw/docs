---
read_when:
    - Chutes'u OpenClaw ile kullanmak istiyorsunuz
    - OAuth veya API anahtarı kurulum yoluna ihtiyacınız var
    - Varsayılan modeli, takma adları veya keşif davranışını istiyorsunuz
summary: Chutes kurulumu (OAuth veya API anahtarı, model keşfi, takma adlar)
title: Chutes
x-i18n:
    generated_at: "2026-07-12T12:07:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dafa96c4a56b9d38d033b87cc077d359cb71adaf1ca41a0ab6b6cc77b66484a7
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai), açık kaynaklı model kataloglarını OpenAI uyumlu bir
API üzerinden sunar. OpenClaw hem tarayıcı OAuth'unu hem de API anahtarıyla kimlik doğrulamayı destekler.

| Özellik                 | Değer                                                   |
| ----------------------- | ------------------------------------------------------- |
| Sağlayıcı               | `chutes`                                                |
| Plugin                  | resmi harici paket (`@openclaw/chutes-provider`)        |
| API                     | OpenAI uyumlu                                           |
| Temel URL               | `https://llm.chutes.ai/v1`                              |
| Kimlik doğrulama        | OAuth veya API anahtarı (aşağıya bakın)                 |
| Çalışma zamanı ortam değişkenleri | `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`          |

`CHUTES_OAUTH_TOKEN`, önceden alınmış bir OAuth erişim belirtecini doğrudan sağlar
(örneğin CI ortamında) ve aşağıdaki etkileşimli tarayıcı akışını atlar.

## Plugin'i yükleme

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## Başlangıç

Her iki yol da varsayılan modeli `chutes/zai-org/GLM-4.7-TEE` olarak ayarlar ve
Chutes kataloğunu kaydeder.

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="OAuth ilk kurulum akışını çalıştırın">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw tarayıcı akışını yerel olarak başlatır veya uzak/başsız
        ana makinelerde bir URL ve yönlendirme adresini yapıştırma akışı gösterir. OAuth belirteçleri,
        OpenClaw kimlik doğrulama profilleri aracılığıyla otomatik olarak yenilenir.
      </Step>
    </Steps>
  </Tab>
  <Tab title="API anahtarı">
    <Steps>
      <Step title="Bir API anahtarı edinin">
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys)
        adresinde bir anahtar oluşturun.
      </Step>
      <Step title="API anahtarı ilk kurulum akışını çalıştırın">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Keşif davranışı

Chutes kimlik doğrulaması kullanılabilir olduğunda OpenClaw, ilgili kimlik
bilgisiyle `GET /v1/models` sorgusu yapar ve keşfedilen modelleri kullanır;
sonuçlar kimlik bilgisi başına 5 dakika önbelleğe alınır. Süresi dolmuş/yetkisiz
bir anahtarda (HTTP 401), OpenClaw kimlik bilgileri olmadan bir kez daha dener.
Keşif yine de hiçbir satır döndürmezse, başarısız olursa veya 2xx dışındaki
başka bir durum kodu döndürürse paketle birlikte gelen statik kataloğa geri döner
(hem API anahtarı hem de OAuth keşfi aynı yolu kullanır). Keşif başlangıçta
başarısız olursa statik katalog otomatik olarak kullanılır.

## Varsayılan takma adlar

OpenClaw, Chutes kataloğu için üç kullanışlı takma ad kaydeder:

| Takma ad        | Hedef model                                           |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Yerleşik başlangıç kataloğu

Paketle birlikte gelen yedek katalog 47 model içerir. Güncel başvurulardan temsili bir örnek:

| Model başvurusu                                       |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

Tam liste için `openclaw models list --all --provider chutes` komutunu çalıştırın.

## Yapılandırma örneği

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="OAuth geçersiz kılmaları">
    OAuth akışını isteğe bağlı ortam değişkenleriyle özelleştirin:

    | Değişken | Amaç |
    | -------- | ---- |
    | `CHUTES_CLIENT_ID` | OAuth istemci kimliği (ayarlanmamışsa sorulur) |
    | `CHUTES_CLIENT_SECRET` | OAuth istemci gizli anahtarı |
    | `CHUTES_OAUTH_REDIRECT_URI` | Yönlendirme URI'si (varsayılan `http://127.0.0.1:1456/oauth-callback`) |
    | `CHUTES_OAUTH_SCOPES` | Boşlukla ayrılmış kapsamlar (varsayılan `openid profile chutes:invoke`) |

    Yönlendirme uygulaması gereksinimleri ve yardım için
    [Chutes OAuth belgelerine](https://chutes.ai/docs/sign-in-with-chutes/overview) bakın.

  </Accordion>

  <Accordion title="Notlar">
    - Chutes modelleri `chutes/<model-id>` biçiminde kaydedilir.
    - Chutes, akış sırasında belirteç kullanımını bildirmez (`supportsUsageInStreaming: false`); kullanım toplamları akış tamamlandığında yine de gösterilir.

  </Accordion>
</AccordionGroup>

## İlgili içerikler

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcı kuralları, model başvuruları ve yük devretme davranışı.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcı ayarlarını da içeren eksiksiz yapılandırma şeması.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Chutes kontrol paneli ve API belgeleri.
  </Card>
  <Card title="Chutes API anahtarları" href="https://chutes.ai/settings/api-keys" icon="key">
    Chutes API anahtarlarını oluşturun ve yönetin.
  </Card>
</CardGroup>

---
read_when:
    - OpenClaw ile Volcano Engine veya Doubao modellerini kullanmak istiyorsunuz
    - Volcengine API anahtarı kurulumuna ihtiyacınız var
    - Volcengine Speech text-to-speech kullanmak istiyorsunuz
summary: Volcano Engine kurulumu (Doubao modelleri, kodlama uç noktaları ve Seed Speech TTS)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-26T11:39:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7948a26cc898e125d445e9ae091704f5cf442266d29e712c0dcedbe0dc0cce7
    source_path: providers/volcengine.md
    workflow: 15
---

Volcengine sağlayıcısı, Volcano Engine üzerinde barındırılan Doubao modellerine ve üçüncü taraf modellere erişim sağlar; genel ve kodlama iş yükleri için ayrı uç noktalar sunar. Aynı paketlenmiş Plugin, Volcengine Speech'i TTS sağlayıcısı olarak da kaydedebilir.

| Ayrıntı    | Değer                                                        |
| ---------- | ------------------------------------------------------------ |
| Sağlayıcılar | `volcengine` (genel + TTS) + `volcengine-plan` (kodlama)    |
| Model auth | `VOLCANO_ENGINE_API_KEY`                                     |
| TTS auth   | `VOLCENGINE_TTS_API_KEY` veya `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API        | OpenAI uyumlu modeller, BytePlus Seed Speech TTS             |

## Başlarken

<Steps>
  <Step title="API anahtarını ayarlayın">
    Etkileşimli onboarding çalıştırın:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Bu, tek bir API anahtarından hem genel (`volcengine`) hem de kodlama (`volcengine-plan`) sağlayıcılarını kaydeder.

  </Step>
  <Step title="Varsayılan model ayarlayın">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="Modelin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Etkileşimsiz kurulum için (CI, betikleme), anahtarı doğrudan geçin:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Sağlayıcılar ve uç noktalar

| Sağlayıcı         | Uç nokta                                  | Kullanım durumu |
| ----------------- | ----------------------------------------- | --------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Genel modeller  |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Kodlama modelleri |

<Note>
Her iki sağlayıcı da tek bir API anahtarından yapılandırılır. Kurulum her ikisini de otomatik olarak kaydeder.
</Note>

## Yerleşik katalog

<Tabs>
  <Tab title="Genel (volcengine)">
    | Model ref                                    | Ad                              | Girdi       | Bağlam  |
    | -------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | text, image | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | text, image | 256,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | text, image | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | text, image | 200,000 |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | text, image | 128,000 |
  </Tab>
  <Tab title="Kodlama (volcengine-plan)">
    | Model ref                                         | Ad                       | Girdi | Bağlam  |
    | ------------------------------------------------- | ------------------------ | ----- | ------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | text  | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | text  | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | text  | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | text  | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | text  | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | text  | 256,000 |
  </Tab>
</Tabs>

## Text-to-speech

Volcengine TTS, BytePlus Seed Speech HTTP API'sini kullanır ve OpenAI uyumlu Doubao model API anahtarından ayrı yapılandırılır. BytePlus konsolunda Seed Speech > Settings > API Keys bölümünü açın, API anahtarını kopyalayın ve sonra şunları ayarlayın:

```bash
export VOLCENGINE_TTS_API_KEY="byteplus_seed_speech_api_key"
export VOLCENGINE_TTS_RESOURCE_ID="seed-tts-1.0"
```

Ardından bunu `openclaw.json` içinde etkinleştirin:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "byteplus_seed_speech_api_key",
          voice: "en_female_anna_mars_bigtts",
          speedRatio: 1.0,
        },
      },
    },
  },
}
```

Sesli not hedefleri için OpenClaw, Volcengine'den sağlayıcıya özgü
`ogg_opus` ister. Normal ses ekleri için `mp3` ister. Sağlayıcı takma adları
`bytedance` ve `doubao` da aynı konuşma sağlayıcısına çözülür.

Varsayılan kaynak kimliği `seed-tts-1.0` değeridir; çünkü BytePlus bunu varsayılan projede yeni oluşturulmuş Seed Speech API anahtarlarına verir. Projenizde
TTS 2.0 yetkisi varsa `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0` ayarlayın.

<Warning>
`VOLCANO_ENGINE_API_KEY`, ModelArk/Doubao model uç noktaları içindir ve bir
Seed Speech API anahtarı değildir. TTS için BytePlus Speech
Console'dan bir Seed Speech API anahtarı veya eski bir Speech Console AppID/token çifti gerekir.
</Warning>

Eski AppID/token auth, daha eski Speech Console uygulamaları için desteklenmeye devam eder:

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Onboarding sonrası varsayılan model">
    `openclaw onboard --auth-choice volcengine-api-key` şu anda
    genel `volcengine` kataloğunu da kaydederken varsayılan model olarak
    `volcengine-plan/ark-code-latest` ayarlar.
  </Accordion>

  <Accordion title="Model seçici fallback davranışı">
    Onboarding/configure model seçimi sırasında Volcengine auth seçeneği,
    hem `volcengine/*` hem de `volcengine-plan/*` satırlarını tercih eder. Bu modeller henüz
    yüklenmemişse OpenClaw, boş bir sağlayıcı kapsamlı seçici göstermek yerine
    filtresiz kataloğa fallback yapar.
  </Accordion>

  <Accordion title="Daemon süreçleri için ortam değişkenleri">
    Gateway bir daemon olarak çalışıyorsa (launchd/systemd), `VOLCANO_ENGINE_API_KEY`, `VOLCENGINE_TTS_API_KEY`,
    `BYTEPLUS_SEED_SPEECH_API_KEY`, `VOLCENGINE_TTS_APPID` ve
    `VOLCENGINE_TTS_TOKEN` gibi model ve TTS
    ortam değişkenlerinin o süreç için erişilebilir olduğundan emin olun (örneğin
    `~/.openclaw/.env` içinde veya `env.shellEnv` üzerinden).
  </Accordion>
</AccordionGroup>

<Warning>
OpenClaw arka plan hizmeti olarak çalışırken etkileşimli kabuğunuzda ayarlanan
ortam değişkenleri otomatik olarak devralınmaz. Yukarıdaki daemon notuna bakın.
</Warning>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcı, model başvurusu ve failover davranışlarını seçme.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    Agent'lar, modeller ve sağlayıcılar için tam config referansı.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve hata ayıklama adımları.
  </Card>
  <Card title="SSS" href="/tr/help/faq" icon="circle-question">
    OpenClaw kurulumu hakkında sık sorulan sorular.
  </Card>
</CardGroup>

---
read_when:
    - OpenClaw'da Mistral modellerini kullanmak istiyorsunuz
    - Sesli Arama için Voxtral gerçek zamanlı transkripsiyonunu kullanmak istiyorsunuz
    - Mistral API anahtarı ilk katılımına ve model referanslarına ihtiyacınız var
summary: OpenClaw ile Mistral modellerini ve Voxtral transkripsiyonunu kullanın
title: Mistral
x-i18n:
    generated_at: "2026-07-12T12:40:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58f27b9917d2e7144a64cad559de4fe26a5a1101703bbe21c04252717df801cd
    source_path: providers/mistral.md
    workflow: 16
---

Paketle birlikte gelen `mistral` Plugin'i dört sözleşme kaydeder: sohbet tamamlama, medya anlama (Voxtral toplu transkripsiyon), Voice Call için gerçek zamanlı STT (Voxtral Realtime) ve bellek gömmeleri (`mistral-embed`).

| Özellik          | Değer                                        |
| ---------------- | -------------------------------------------- |
| Sağlayıcı kimliği | `mistral`                                   |
| Plugin           | paketle birlikte gelir, varsayılan olarak etkin |
| Kimlik doğrulama ortam değişkeni | `MISTRAL_API_KEY`               |
| İlk kurulum bayrağı | `--auth-choice mistral-api-key`           |
| Doğrudan CLI bayrağı | `--mistral-api-key <key>`                 |
| API              | OpenAI uyumlu (`openai-completions`)         |
| Temel URL        | `https://api.mistral.ai/v1`                  |
| Varsayılan model | `mistral/mistral-large-latest`               |
| Gömme modeli     | `mistral-embed`                              |
| Voxtral toplu    | `voxtral-mini-latest` (ses transkripsiyonu)  |
| Voxtral gerçek zamanlı | `voxtral-mini-transcribe-realtime-2602` |

## Başlarken

<Steps>
  <Step title="API anahtarınızı alın">
    [Mistral Console](https://console.mistral.ai/) içinde bir API anahtarı oluşturun.
  </Step>
  <Step title="İlk kurulumu çalıştırın">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Alternatif olarak anahtarı doğrudan iletin:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Varsayılan model ayarlayın">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Modelin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Yerleşik LLM kataloğu

| Model referansı                   | Girdi       | Bağlam  | Azami çıktı | Notlar                                                |
| --------------------------------- | ----------- | ------- | ---------- | ----------------------------------------------------- |
| `mistral/mistral-large-latest`    | metin, görsel | 262,144 | 16,384   | Varsayılan model                                      |
| `mistral/mistral-medium-2508`     | metin, görsel | 262,144 | 8,192    | Mistral Medium 3.1                                    |
| `mistral/mistral-medium-3-5`      | metin, görsel | 262,144 | 8,192    | Mistral Medium 3.5; ayarlanabilir akıl yürütme        |
| `mistral/mistral-small-latest`    | metin, görsel | 262,144 | 16,384   | En yeni Mistral Small 4; ayarlanabilir `reasoning_effort` |
| `mistral/mistral-small-2603`      | metin, görsel | 262,144 | 16,384   | Sabitlenmiş Mistral Small 4; ayarlanabilir `reasoning_effort` |
| `mistral/pixtral-large-latest`    | metin, görsel | 128,000 | 32,768   | Pixtral                                               |
| `mistral/codestral-latest`        | metin       | 256,000 | 4,096      | Kodlama                                               |
| `mistral/devstral-medium-latest`  | metin       | 262,144 | 32,768     | Devstral 2                                            |
| `mistral/magistral-small`         | metin       | 128,000 | 40,000     | Akıl yürütme etkin                                    |

Yapılandırmayı değiştirmeden önce paketle birlikte gelen katalog satırını görüntüleyin:

```bash
openclaw models list --all --provider mistral --plain
```

Gateway'i başlatmadan bir modelin hızlı testini yapın:

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

## Ses transkripsiyonu (Voxtral)

Medya anlama işlem hattı üzerinden toplu ses transkripsiyonu için Voxtral'ı kullanın:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
Medya transkripsiyonu yolu `/v1/audio/transcriptions` uç noktasını kullanır. Mistral için varsayılan ses modeli `voxtral-mini-latest` modelidir.
</Tip>

## Voice Call akış STT'si

Paketle birlikte gelen `mistral` Plugin'i, Voxtral Realtime'ı bir Voice Call akış STT sağlayıcısı olarak kaydeder.

| Ayar          | Yapılandırma yolu                                                      | Varsayılan                              |
| ------------- | ---------------------------------------------------------------------- | --------------------------------------- |
| API anahtarı  | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | `MISTRAL_API_KEY` değerine geri döner   |
| Model         | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| Kodlama       | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| Örnekleme hızı | `...mistral.sampleRate`                                               | `8000`                                  |
| Hedef gecikme | `...mistral.targetStreamingDelayMs`                                    | `800`                                   |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "mistral",
            providers: {
              mistral: {
                apiKey: "${MISTRAL_API_KEY}",
                targetStreamingDelayMs: 800,
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
OpenClaw, Voice Call'un Twilio medya karelerini doğrudan iletebilmesi için Mistral gerçek zamanlı STT'yi varsayılan olarak 8 kHz'de `pcm_mulaw` kullanacak şekilde ayarlar. Yalnızca yukarı akışınız zaten ham PCM ise `encoding: "pcm_s16le"` ve buna uygun bir `sampleRate` kullanın.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Ayarlanabilir akıl yürütme">
    `mistral/mistral-small-latest`, `mistral/mistral-small-2603` ve `mistral/mistral-medium-3-5`, Chat Completions API'sinde `reasoning_effort` aracılığıyla [ayarlanabilir akıl yürütmeyi](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable) destekler (`none`, çıktıda ek düşünmeyi en aza indirir; `high`, nihai yanıttan önce tüm düşünme izlerini gösterir).

    OpenClaw, oturum **düşünme** düzeyini Mistral API'sine şu şekilde eşler:

    | OpenClaw düşünme düzeyi                                             | Mistral `reasoning_effort` |
    | ------------------------------------------------------------------- | -------------------------- |
    | **off** / **minimal**                                               | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`                    |

    <Warning>
    Medium 3.5 akıl yürütme modunu `temperature: 0` ile birlikte kullanmaktan kaçının; Mistral HTTP API'sinin `reasoning_effort="high"` ile `temperature: 0` birleşimini 400 yanıtıyla reddettiği bildirilmiştir. Sıcaklık değerini ayarlamadan bırakın veya düşük bir sıcaklık ayarlamadan önce düşünmeyi kapatın/en aza indirin; böylece OpenClaw `reasoning_effort: "none"` gönderir.
    </Warning>

    Medium 3.5 akıl yürütmesi için model kapsamlı örnek yapılandırma:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "mistral/mistral-medium-3-5" },
          models: {
            "mistral/mistral-medium-3-5": {
              params: { thinking: "high" },
            },
          },
        },
      },
    }
    ```

    <Note>
    Paketle birlikte gelen Mistral kataloğundaki diğer modeller bu parametreyi kullanmaz. Mistral'ın yerel, akıl yürütme öncelikli davranışını istediğinizde `magistral-*` modellerini kullanmaya devam edin.
    </Note>

  </Accordion>

  <Accordion title="Bellek gömmeleri">
    Mistral, `/v1/embeddings` aracılığıyla bellek gömmeleri sunabilir (varsayılan model: `mistral-embed`):

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "mistral" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Kimlik doğrulama ve temel URL">
    - Mistral kimlik doğrulaması `MISTRAL_API_KEY` kullanır (Bearer üstbilgisi).
    - Sağlayıcının temel URL'si varsayılan olarak `https://api.mistral.ai/v1` değeridir ve standart OpenAI uyumlu sohbet tamamlama istek biçimini kabul eder.
    - İlk kurulumun varsayılan modeli `mistral/mistral-large-latest` modelidir.
    - `models.providers.mistral.baseUrl` altındaki temel URL'yi yalnızca Mistral ihtiyaç duyduğunuz bölgesel bir uç noktayı açıkça yayımladığında geçersiz kılın.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Medya anlama" href="/tr/nodes/media-understanding" icon="microphone">
    Ses transkripsiyonu kurulumu ve sağlayıcı seçimi.
  </Card>
</CardGroup>

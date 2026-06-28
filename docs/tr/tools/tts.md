---
read_when:
    - Yanıtlar için metinden sese özelliğini etkinleştirme
    - Bir TTS sağlayıcısını, yedek zinciri veya personayı yapılandırma
    - /tts komutlarını veya yönergelerini kullanma
sidebarTitle: Text to speech (TTS)
summary: Giden yanıtlar için metinden sese — sağlayıcılar, personalar, eğik çizgi komutları ve kanal bazlı çıktı
title: Metinden konuşmaya
x-i18n:
    generated_at: "2026-06-28T01:27:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 94835daf766286e937c57828818a4ee0a20e6d5894b7d51d6f98fc7ebdaffe35
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw, giden yanıtları **14 konuşma sağlayıcısı** genelinde sese dönüştürebilir
ve Feishu, Matrix, Telegram ve WhatsApp üzerinde yerel sesli mesajlar,
diğer her yerde ses ekleri, telephony ve Talk için PCM/Ulaw akışları teslim edebilir.

TTS, Talk'ın `stt-tts` modunun konuşma çıktısı yarısıdır. Sağlayıcıya özgü
`realtime` Talk oturumları, bu TTS yolunu çağırmak yerine konuşmayı realtime
sağlayıcısının içinde sentezler; `transcription` oturumları ise bir
asistan sesli yanıtı sentezlemez.

## Hızlı başlangıç

<Steps>
  <Step title="Pick a provider">
    OpenAI ve ElevenLabs en güvenilir barındırılan seçeneklerdir. Microsoft ve
    Local CLI bir API anahtarı olmadan çalışır. Tam liste için
    [sağlayıcı matrisine](#supported-providers) bakın.
  </Step>
  <Step title="Set the API key">
    Sağlayıcınız için env var'ı dışa aktarın (örneğin `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft ve Local CLI anahtar gerektirmez.
  </Step>
  <Step title="Enable in config">
    `messages.tts.auto: "always"` ve `messages.tts.provider` değerlerini ayarlayın:

    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "elevenlabs",
        },
      },
    }
    ```

  </Step>
  <Step title="Try it in chat">
    `/tts status` mevcut durumu gösterir. `/tts audio Hello from OpenClaw`
    tek seferlik bir sesli yanıt gönderir.
  </Step>
</Steps>

<Note>
Auto-TTS varsayılan olarak **kapalıdır**. `messages.tts.provider` ayarlanmamışsa,
OpenClaw kayıt defterinin otomatik seçim sırasındaki ilk yapılandırılmış
sağlayıcıyı seçer. Yerleşik `tts` agent aracı yalnızca açık niyet içindir:
kullanıcı ses istemedikçe, `/tts` kullanmadıkça veya Auto-TTS/directive
konuşmayı etkinleştirmedikçe normal sohbet metin olarak kalır.
</Note>

## Desteklenen sağlayıcılar

| Sağlayıcı         | Kimlik doğrulama                                                                                                 | Notlar                                                                                      |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (ayrıca `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)        | Yerel Ogg/Opus sesli not çıktısı ve telephony.                                              |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | OpenAI uyumlu TTS. Varsayılan olarak `hexgrad/Kokoro-82M`.                                  |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` veya `XI_API_KEY`                                                                           | Ses klonlama, çok dilli, `seed` ile deterministik; Discord ses oynatma için akışlıdır.      |
| **Google Gemini** | `GEMINI_API_KEY` veya `GOOGLE_API_KEY`                                                                           | Gemini API toplu TTS; `promptTemplate: "audio-profile-v1"` ile persona farkındalığı.        |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | Sesli not ve telephony çıktısı.                                                             |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | Akışlı TTS API. Yerel Opus sesli not ve PCM telephony.                                      |
| **Local CLI**     | yok                                                                                                              | Yapılandırılmış yerel bir TTS komutunu çalıştırır.                                          |
| **Microsoft**     | yok                                                                                                              | `node-edge-tts` üzerinden genel Edge neural TTS. En iyi çaba, SLA yok.                      |
| **MiniMax**       | `MINIMAX_API_KEY` (veya Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)    | T2A v2 API. Varsayılan olarak `speech-2.8-hd`.                                              |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | Otomatik özet için de kullanılır; persona `instructions` desteği vardır.                    |
| **OpenRouter**    | `OPENROUTER_API_KEY` (`models.providers.openrouter.apiKey` yeniden kullanılabilir)                               | Varsayılan model `hexgrad/kokoro-82m`.                                                      |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` veya `BYTEPLUS_SEED_SPEECH_API_KEY` (eski AppID/token: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | BytePlus Seed Speech HTTP API.                                                              |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | Paylaşılan görüntü, video ve konuşma sağlayıcısı.                                           |
| **xAI**           | `XAI_API_KEY`                                                                                                    | xAI toplu TTS. Yerel Opus sesli not **desteklenmez**.                                       |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | Xiaomi sohbet tamamlama üzerinden MiMo TTS.                                                 |

Birden fazla sağlayıcı yapılandırılmışsa, önce seçilen sağlayıcı kullanılır ve
diğerleri fallback seçenekleri olur. Otomatik özet `summaryModel` (veya
`agents.defaults.model.primary`) kullanır; bu nedenle özetleri etkin tutarsanız
o sağlayıcının da kimliği doğrulanmış olmalıdır.

<Warning>
Paketlenen **Microsoft** sağlayıcısı, `node-edge-tts` üzerinden Microsoft Edge'in
çevrimiçi neural TTS hizmetini kullanır. Bu, yayımlanmış SLA veya kotası olmayan
genel bir web hizmetidir; en iyi çaba olarak değerlendirin. Eski sağlayıcı id'si
`edge`, `microsoft` olarak normalize edilir ve `openclaw doctor --fix` kalıcı
config'i yeniden yazar; yeni config'ler her zaman `microsoft` kullanmalıdır.
</Warning>

## Yapılandırma

TTS config'i `~/.openclaw/openclaw.json` içinde `messages.tts` altında bulunur.
Bir preset seçin ve sağlayıcı bloğunu uyarlayın:

<Tabs>
  <Tab title="Azure Speech">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "azure-speech",
      providers: {
        "azure-speech": {
          apiKey: "${AZURE_SPEECH_KEY}",
          region: "eastus",
          speakerVoice: "en-US-JennyNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          voiceNoteOutputFormat: "ogg-24khz-16bit-mono-opus",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Google Gemini">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "${GEMINI_API_KEY}",
          model: "gemini-3.1-flash-tts-preview",
          speakerVoice: "Kore",
          // Optional natural-language style prompts:
          // audioProfile: "Speak in a calm, podcast-host tone.",
          // speakerName: "Alex",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Gradium">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "${GRADIUM_API_KEY}",
          speakerVoiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Inworld">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "inworld",
      providers: {
        inworld: {
          apiKey: "${INWORLD_API_KEY}",
          modelId: "inworld-tts-1.5-max",
          speakerVoiceId: "Sarah",
          temperature: 0.7,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Local CLI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "tts-local-cli",
      providers: {
        "tts-local-cli": {
          command: "say",
          args: ["-o", "{{OutputPath}}", "{{Text}}"],
          outputFormat: "wav",
          timeoutMs: 120000,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Microsoft (no key)">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          speakerVoice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          rate: "+0%",
          pitch: "+0%",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="MiniMax">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "${MINIMAX_API_KEY}",
          model: "speech-2.8-hd",
          speakerVoiceId: "English_expressive_narrator",
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenAI + ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      providers: {
        openai: {
          apiKey: "${OPENAI_API_KEY}",
          model: "gpt-4o-mini-tts",
          speakerVoice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
          voiceSettings: { stability: 0.5, similarityBoost: 0.75, style: 0.0, useSpeakerBoost: true, speed: 1.0 },
          applyTextNormalization: "auto",
          languageCode: "en",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenRouter">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "${OPENROUTER_API_KEY}",
          model: "hexgrad/kokoro-82m",
          speakerVoice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Volcengine">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "${VOLCENGINE_TTS_API_KEY}",
          resourceId: "seed-tts-1.0",
          speakerVoice: "en_female_anna_mars_bigtts",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="xAI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "${XAI_API_KEY}",
          speakerVoiceId: "eve",
          language: "en",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Xiaomi MiMo">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "${XIAOMI_API_KEY}",
          model: "mimo-v2.5-tts",
          speakerVoice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

Xiaomi `mimo-v2.5-tts-voicedesign` için `speakerVoice` değerini atlayın ve
`style` değerini ses tasarımı prompt'u olarak ayarlayın. OpenClaw bu prompt'u
TTS `user` mesajı olarak gönderir ve voicedesign modeli için `audio.voice`
göndermez.

### Agent başına ses geçersiz kılmaları

`agents.list[].tts` değerini, bir ajanın farklı bir sağlayıcı, ses, model, persona veya otomatik TTS moduyla konuşması gerektiğinde kullanın. Ajan bloğu `messages.tts` üzerine derin birleştirme uygular, böylece sağlayıcı kimlik bilgileri global sağlayıcı yapılandırmasında kalabilir:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: { apiKey: "${ELEVENLABS_API_KEY}", model: "eleven_multilingual_v2" },
      },
    },
  },
  agents: {
    list: [
      {
        id: "reader",
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

Ajan başına bir persona sabitlemek için sağlayıcı yapılandırmasının yanında `agents.list[].tts.persona` ayarlayın; bu, yalnızca o ajan için global `messages.tts.persona` değerini geçersiz kılar.

Otomatik yanıtlar, `/tts audio`, `/tts status` ve `tts` ajan aracı için öncelik sırası:

1. `messages.tts`
2. etkin `agents.list[].tts`
3. kanal `channels.<channel>.tts` desteklediğinde kanal geçersiz kılması
4. kanal `channels.<channel>.accounts.<id>.tts` geçirdiğinde hesap geçersiz kılması
5. bu ana makine için yerel `/tts` tercihleri
6. [model geçersiz kılmaları](#model-driven-directives) etkinleştirildiğinde satır içi `[[tts:...]]` yönergeleri

Kanal ve hesap geçersiz kılmaları `messages.tts` ile aynı şekli kullanır ve önceki katmanların üzerine derin birleştirilir; böylece paylaşılan sağlayıcı kimlik bilgileri `messages.tts` içinde kalabilirken bir kanal veya bot hesabı yalnızca konuşmacı sesini, modeli, persona değerini veya otomatik modu değiştirebilir:

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { apiKey: "${OPENAI_API_KEY}", model: "gpt-4o-mini-tts" },
      },
    },
  },
  channels: {
    feishu: {
      accounts: {
        english: {
          tts: {
            providers: {
              openai: { speakerVoice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

## Personalar

Bir **persona**, sağlayıcılar arasında deterministik olarak uygulanabilen kararlı bir sözlü kimliktir. Bir sağlayıcıyı tercih edebilir, sağlayıcıdan bağımsız istem amacını tanımlayabilir ve sesler, modeller, istem şablonları, tohumlar ve ses ayarları için sağlayıcıya özel bağlamalar taşıyabilir.

### Minimal persona

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "Narrator",
          provider: "elevenlabs",
          providers: {
            elevenlabs: {
              speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
              modelId: "eleven_multilingual_v2",
            },
          },
        },
      },
    },
  },
}
```

### Tam persona (sağlayıcıdan bağımsız istem)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "Dry, warm British butler narrator.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "A brilliant British butler. Dry, witty, warm, charming, emotionally expressive, never generic.",
            scene: "A quiet late-night study. Close-mic narration for a trusted operator.",
            sampleContext: "The speaker is answering a private technical request with concise confidence and dry warmth.",
            style: "Refined, understated, lightly amused.",
            accent: "British English.",
            pacing: "Measured, with short dramatic pauses.",
            constraints: ["Do not read configuration values aloud.", "Do not explain the persona."],
          },
          providers: {
            google: {
              model: "gemini-3.1-flash-tts-preview",
              speakerVoice: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "cedar" },
            elevenlabs: {
              speakerVoiceId: "voice_id",
              modelId: "eleven_multilingual_v2",
              seed: 42,
              voiceSettings: {
                stability: 0.65,
                similarityBoost: 0.8,
                style: 0.25,
                useSpeakerBoost: true,
                speed: 0.95,
              },
            },
          },
        },
      },
    },
  },
}
```

### Persona çözümleme

Etkin persona deterministik olarak seçilir:

1. ayarlanmışsa `/tts persona <id>` yerel tercihi.
2. ayarlanmışsa `messages.tts.persona`.
3. Persona yok.

Sağlayıcı seçimi açık olan öncelikli çalışır:

1. Doğrudan geçersiz kılmalar (CLI, gateway, Talk, izin verilen TTS yönergeleri).
2. `/tts provider <id>` yerel tercihi.
3. Etkin personanın `provider` değeri.
4. `messages.tts.provider`.
5. Kayıt defteri otomatik seçimi.

Her sağlayıcı denemesi için OpenClaw yapılandırmaları şu sırayla birleştirir:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Güvenilir istek geçersiz kılmaları
4. İzin verilen model tarafından yayımlanan TTS yönergesi geçersiz kılmaları

### Sağlayıcılar persona istemlerini nasıl kullanır

Persona istem alanları (`profile`, `scene`, `sampleContext`, `style`, `accent`, `pacing`, `constraints`) **sağlayıcıdan bağımsızdır**. Her sağlayıcı bunları nasıl kullanacağına kendisi karar verir:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Persona istem alanlarını yalnızca etkili Google sağlayıcı yapılandırması `promptTemplate: "audio-profile-v1"` veya `personaPrompt` ayarladığında bir Gemini TTS istem yapısına sarar. Eski `audioProfile` ve `speakerName` alanları hâlâ Google'a özel istem metni olarak başa eklenir. Bir `[[tts:text]]` bloğunun içindeki `[whispers]` veya `[laughs]` gibi satır içi ses etiketleri Gemini transkriptinin içinde korunur; OpenClaw bu etiketleri üretmez.
  </Accordion>
  <Accordion title="OpenAI">
    Persona istem alanlarını yalnızca açık bir OpenAI `instructions` yapılandırılmadığında isteğin `instructions` alanına eşler. Açık `instructions` her zaman önceliklidir.
  </Accordion>
  <Accordion title="Diğer sağlayıcılar">
    Yalnızca `personas.<id>.providers.<provider>` altındaki sağlayıcıya özel persona bağlamalarını kullanır. Sağlayıcı kendi persona istemi eşlemesini uygulamadıkça persona istem alanları yok sayılır.
  </Accordion>
</AccordionGroup>

### Geri dönüş ilkesi

`fallbackPolicy`, bir personanın denenen sağlayıcı için **bağlaması olmadığında** davranışı denetler:

| İlke                | Davranış                                                                                                                                      |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `preserve-persona`  | **Varsayılan.** Sağlayıcıdan bağımsız istem alanları kullanılabilir kalır; sağlayıcı bunları kullanabilir veya yok sayabilir.                 |
| `provider-defaults` | Bu deneme için persona istem hazırlığından çıkarılır; diğer sağlayıcılara geri dönüş sürerken sağlayıcı kendi nötr varsayılanlarını kullanır. |
| `fail`              | Bu sağlayıcı denemesini `reasonCode: "not_configured"` ve `personaBinding: "missing"` ile atlar. Geri dönüş sağlayıcıları yine denenir.       |

Tüm TTS isteği yalnızca denenen **her** sağlayıcı atlandığında veya başarısız olduğunda başarısız olur.

Talk oturumu sağlayıcı seçimi oturum kapsamındadır. Bir Talk istemcisi sağlayıcı kimliklerini, model kimliklerini, ses kimliklerini ve yerel ayarları `talk.catalog` içinden seçmeli ve bunları Talk oturumu veya devir isteği üzerinden geçirmelidir. Bir ses oturumu açmak `messages.tts` veya global Talk sağlayıcı varsayılanlarını değiştirmemelidir.

## Model odaklı yönergeler

Varsayılan olarak asistan, tek bir yanıt için sesi, modeli veya hızı geçersiz kılmak üzere `[[tts:...]]` yönergeleri ve yalnızca seste görünmesi gereken ifade ipuçları için isteğe bağlı bir `[[tts:text]]...[[/tts:text]]` bloğu yayabilir:

```text
Here you go.

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

`messages.tts.auto` `"tagged"` olduğunda, sesi tetiklemek için **yönergeler zorunludur**. Akışlı blok teslimi, bitişik bloklara bölünmüş olsa bile kanal görmeden önce yönergeleri görünür metinden çıkarır.

`modelOverrides.allowProvider: true` olmadıkça `provider=...` yok sayılır. Bir yanıt `provider=...` bildirdiğinde, o yönergedeki diğer anahtarlar yalnızca o sağlayıcı tarafından ayrıştırılır; desteklenmeyen anahtarlar çıkarılır ve TTS yönergesi uyarıları olarak bildirilir.

**Kullanılabilir yönerge anahtarları:**

- `provider` (kayıtlı sağlayıcı kimliği; `allowProvider: true` gerektirir)
- `speakerVoice` / `speakerVoiceId` (eski takma adlar: `voice`, `voiceName`, `voice_name`, `google_voice`, `voiceId`)
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (MiniMax ses düzeyi, 0-10)
- `pitch` (MiniMax tam sayı perde, −12 ile 12; kesirli değerler kırpılır)
- `emotion` (Volcengine duygu etiketi)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Model geçersiz kılmalarını tamamen devre dışı bırakın:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Diğer düğmeleri yapılandırılabilir tutarken sağlayıcı değiştirmeye izin verin:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Eğik çizgi komutları

Tek komut `/tts`. Discord üzerinde OpenClaw ayrıca `/voice` kaydeder çünkü `/tts` yerleşik bir Discord komutudur; metin `/tts ...` yine çalışır.

```text
/tts off | on | status
/tts chat on | off | default
/tts latest
/tts provider <id>
/tts persona <id> | off
/tts limit <chars>
/tts summary off
/tts audio <text>
```

<Note>
Komutlar yetkili bir gönderici gerektirir (izin listesi/sahip kuralları geçerlidir) ve `commands.text` ya da yerel komut kaydı etkin olmalıdır.
</Note>

Davranış notları:

- `/tts on`, yerel TTS tercihini `always` olarak yazar; `/tts off` bunu `off` olarak yazar.
- `/tts chat on|off|default`, geçerli sohbet için oturum kapsamlı bir otomatik TTS geçersiz kılması yazar.
- `/tts persona <id>`, yerel persona tercihini yazar; `/tts persona off` bunu temizler.
- `/tts latest`, geçerli oturum transkriptinden en son asistan yanıtını okur ve bunu bir kez ses olarak gönderir. Yinelenen ses gönderimlerini bastırmak için oturum girdisinde yalnızca o yanıtın karmasını saklar.
- `/tts audio`, tek seferlik bir sesli yanıt üretir (TTS'yi **açmaz**).
- `limit` ve `summary`, ana yapılandırmada değil **yerel tercihlerde** saklanır.
- `/tts status`, en son deneme için geri dönüş tanılamalarını içerir: `Fallback: <primary> -> <used>`, `Attempts: ...` ve deneme başına ayrıntı (`provider:outcome(reasonCode) latency`).
- `/status`, TTS etkinleştirildiğinde etkin TTS modunu ve yapılandırılmış sağlayıcı, model, ses ve temizlenmiş özel uç nokta meta verilerini gösterir.

## Kullanıcı başına tercihler

Eğik çizgi komutları yerel geçersiz kılmaları `prefsPath` konumuna yazar. Varsayılan değer `~/.openclaw/settings/tts.json` olur; `OPENCLAW_TTS_PREFS` ortam değişkeni veya `messages.tts.prefsPath` ile geçersiz kılın.

| Saklanan alan | Etki                                           |
| ------------- | ---------------------------------------------- |
| `auto`        | Yerel otomatik TTS geçersiz kılması (`always`, `off`, …) |
| `provider`    | Yerel birincil sağlayıcı geçersiz kılması      |
| `persona`     | Yerel persona geçersiz kılması                 |
| `maxLength`   | Özet eşiği (varsayılan `1500` karakter)        |
| `summarize`   | Özet anahtarı (varsayılan `true`)              |

Bunlar, bu ana makine için `messages.tts` ve etkin `agents.list[].tts` bloğundan gelen etkili yapılandırmayı geçersiz kılar.

## Çıktı biçimleri (sabit)

TTS ses teslimi kanal yeteneklerine göre yönlendirilir. Kanal Plugin'leri, ses tarzı TTS'nin sağlayıcılardan yerel bir `voice-note` hedefi istemesi mi yoksa normal `audio-file` sentezini koruyup yalnızca uyumlu çıktıyı ses teslimi için işaretlemesi mi gerektiğini bildirir.

- **Sesli not destekli kanallar**: sesli not yanıtları Opus'u tercih eder (ElevenLabs'ten `opus_48000_64`, OpenAI'den `opus`).
  - 48kHz / 64kbps, sesli mesaj için iyi bir denge sağlar.
- **Feishu / WhatsApp**: bir sesli not yanıtı MP3/WebM/WAV/M4A
  veya başka bir olası ses dosyası olarak üretildiğinde, kanal plugin'i yerel sesli mesajı göndermeden önce bunu `ffmpeg` ile 48kHz
  Ogg/Opus biçimine dönüştürür. WhatsApp, sonucu Baileys `audio` yükü üzerinden `ptt: true` ve
  `audio/ogg; codecs=opus` ile gönderir. Dönüştürme başarısız olursa Feishu özgün
  dosyayı ek olarak alır; WhatsApp ise uyumsuz bir PTT yükü yayımlamak yerine gönderimi
  başarısız yapar.
- **Diğer kanallar**: MP3 (ElevenLabs'ten `mp3_44100_128`, OpenAI'den `mp3`).
  - 44.1kHz / 128kbps, konuşma netliği için varsayılan dengedir.
- **MiniMax**: normal ses ekleri için MP3 (`speech-2.8-hd` modeli, 32kHz örnekleme hızı). Kanalın duyurduğu sesli not hedefleri için, kanal dönüştürmeyi duyuruyorsa OpenClaw teslimden önce MiniMax MP3'ünü `ffmpeg` ile 48kHz Opus'a dönüştürür.
- **Xiaomi MiMo**: varsayılan olarak MP3 veya yapılandırıldığında WAV. Kanalın duyurduğu sesli not hedefleri için, kanal dönüştürmeyi duyuruyorsa OpenClaw teslimden önce Xiaomi çıktısını `ffmpeg` ile 48kHz Opus'a dönüştürür.
- **Yerel CLI**: yapılandırılmış `outputFormat` değerini kullanır. Sesli not hedefleri
  Ogg/Opus'a dönüştürülür ve telefon çıktısı `ffmpeg` ile ham 16 kHz mono PCM'ye
  dönüştürülür.
- **Google Gemini**: Gemini API TTS ham 24kHz PCM döndürür. OpenClaw bunu ses ekleri için WAV olarak sarar, sesli not hedefleri için 48kHz Opus'a dönüştürür ve Talk/telefon için PCM'yi doğrudan döndürür.
- **Gradium**: ses ekleri için WAV, sesli not hedefleri için Opus ve telefon için 8 kHz'de `ulaw_8000`.
- **Inworld**: normal ses ekleri için MP3, sesli not hedefleri için yerel `OGG_OPUS` ve Talk/telefon için 22050 Hz'de ham `PCM`.
- **xAI**: varsayılan olarak MP3; `responseFormat` `mp3`, `wav`, `pcm`, `mulaw` veya `alaw` olabilir. OpenClaw xAI'nin toplu REST TTS uç noktasını kullanır ve eksiksiz bir ses eki döndürür; xAI'nin akışlı TTS WebSocket'i bu sağlayıcı yolunda kullanılmaz. Yerel Opus sesli not biçimi bu yol tarafından desteklenmez.
- **Microsoft**: `microsoft.outputFormat` değerini kullanır (varsayılan `audio-24khz-48kbitrate-mono-mp3`).
  - Paketlenmiş aktarım bir `outputFormat` kabul eder, ancak tüm biçimler hizmetten kullanılabilir değildir.
  - Çıktı biçimi değerleri Microsoft Speech çıktı biçimlerini izler (Ogg/WebM Opus dahil).
  - Telegram `sendVoice` OGG/MP3/M4A kabul eder; garantili Opus sesli mesajlara ihtiyacınız varsa OpenAI/ElevenLabs kullanın.
  - Yapılandırılmış Microsoft çıktı biçimi başarısız olursa OpenClaw MP3 ile yeniden dener.

OpenAI/ElevenLabs çıktı biçimleri kanal başına sabittir (yukarıya bakın).

## Otomatik TTS davranışı

`messages.tts.auto` etkinleştirildiğinde OpenClaw:

- Yanıt zaten yapılandırılmış medya içeriyorsa TTS'yi atlar.
- Çok kısa yanıtları atlar (10 karakterin altında).
- Özetler etkinse uzun yanıtları `summaryModel` (veya `agents.defaults.model.primary`)
  kullanarak özetler.
- Üretilen sesi yanıta ekler.
- `mode: "final"` içinde, metin akışı tamamlandıktan sonra akışlı final yanıtları için
  yine yalnızca sesli TTS gönderir; üretilen medya, normal yanıt ekleriyle aynı
  kanal medya normalleştirmesinden geçer.

Yanıt `maxLength` değerini aşarsa ve özet kapalıysa (veya özet modeli için API anahtarı yoksa),
ses atlanır ve normal metin yanıtı gönderilir.

```text
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize -> TTS -> attach audio
```

## Kanala göre çıktı biçimleri

| Hedef                                 | Biçim                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Feishu / Matrix / Telegram / WhatsApp | Sesli not yanıtları **Opus**'u tercih eder (ElevenLabs'ten `opus_48000_64`, OpenAI'den `opus`). 48 kHz / 64 kbps netlik ve boyutu dengeler. |
| Diğer kanallar                        | **MP3** (ElevenLabs'ten `mp3_44100_128`, OpenAI'den `mp3`). Konuşma için varsayılan 44.1 kHz / 128 kbps.                             |
| Talk / telefon                        | Sağlayıcıya özgü **PCM** (Inworld 22050 Hz, Google 24 kHz) veya telefon için Gradium'dan `ulaw_8000`.                                |

Sağlayıcı başına notlar:

- **Feishu / WhatsApp dönüştürme:** Bir sesli not yanıtı MP3/WebM/WAV/M4A olarak geldiğinde, kanal plugin'i `ffmpeg` ile 48 kHz Ogg/Opus'a dönüştürür. WhatsApp, Baileys üzerinden `ptt: true` ve `audio/ogg; codecs=opus` ile gönderir. Dönüştürme başarısız olursa: Feishu özgün dosyayı eklemeye geri döner; WhatsApp ise uyumsuz bir PTT yükü yayımlamak yerine gönderimi başarısız yapar.
- **MiniMax / Xiaomi MiMo:** Varsayılan MP3 (MiniMax `speech-2.8-hd` için 32 kHz); `ffmpeg` aracılığıyla sesli not hedefleri için 48 kHz Opus'a dönüştürülür.
- **Yerel CLI:** Yapılandırılmış `outputFormat` değerini kullanır. Sesli not hedefleri Ogg/Opus'a, telefon çıktısı ham 16 kHz mono PCM'ye dönüştürülür.
- **Google Gemini:** Ham 24 kHz PCM döndürür. OpenClaw ekler için WAV olarak sarar, sesli not hedefleri için 48 kHz Opus'a dönüştürür, Talk/telefon için PCM'yi doğrudan döndürür.
- **Inworld:** MP3 ekleri, yerel `OGG_OPUS` sesli not, Talk/telefon için ham `PCM` 22050 Hz.
- **xAI:** Varsayılan olarak MP3; `responseFormat` `mp3|wav|pcm|mulaw|alaw` olabilir. xAI'nin toplu REST uç noktasını kullanır — akışlı WebSocket TTS **kullanılmaz**. Yerel Opus sesli not biçimi **desteklenmez**.
- **Microsoft:** `microsoft.outputFormat` değerini kullanır (varsayılan `audio-24khz-48kbitrate-mono-mp3`). Telegram `sendVoice` OGG/MP3/M4A kabul eder; garantili Opus sesli mesajlara ihtiyacınız varsa OpenAI/ElevenLabs kullanın. Yapılandırılmış Microsoft biçimi başarısız olursa OpenClaw MP3 ile yeniden dener.

OpenAI ve ElevenLabs çıktı biçimleri yukarıda listelendiği gibi kanal başına sabittir.

## Alan başvurusu

<AccordionGroup>
  <Accordion title="Top-level messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Otomatik TTS modu. `inbound` yalnızca gelen bir sesli mesajdan sonra ses gönderir; `tagged` yalnızca yanıt `[[tts:...]]` yönergeleri veya bir `[[tts:text]]` bloğu içerdiğinde ses gönderir.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Eski geçiş anahtarı. `openclaw doctor --fix` bunu `auto` değerine taşır.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` final yanıtlara ek olarak araç/blok yanıtlarını da içerir.
    </ParamField>
    <ParamField path="provider" type="string">
      Konuşma sağlayıcısı kimliği. Ayarlanmadığında OpenClaw, kayıt otomatik seçim sırasındaki ilk yapılandırılmış sağlayıcıyı kullanır. Eski `provider: "edge"`, `openclaw doctor --fix` tarafından `"microsoft"` olarak yeniden yazılır.
    </ParamField>
    <ParamField path="persona" type="string">
      `personas` içinden etkin persona kimliği. Küçük harfe normalleştirilir.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Kararlı konuşulan kimlik. Alanlar: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Bkz. [Personalar](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Otomatik özet için ucuz model; varsayılan `agents.defaults.model.primary`. `provider/model` veya yapılandırılmış bir model takma adını kabul eder.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Modelin TTS yönergeleri yaymasına izin verin. `enabled` varsayılan olarak `true`; `allowProvider` varsayılan olarak `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Konuşma sağlayıcısı kimliğine göre anahtarlanmış sağlayıcıya ait ayarlar. Eski doğrudan bloklar (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) `openclaw doctor --fix` tarafından yeniden yazılır; yalnızca `messages.tts.providers.<id>` kaydedin.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      TTS giriş karakterleri için kesin üst sınır. Aşılırsa `/tts audio` başarısız olur.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      Milisaniye cinsinden istek zaman aşımı.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Yerel tercih JSON yolunu geçersiz kılın (sağlayıcı/sınır/özet). Varsayılan `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Ortam: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` veya `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Azure Speech bölgesi (ör. `eastus`). Ortam: `AZURE_SPEECH_REGION` veya `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">İsteğe bağlı Azure Speech uç noktası geçersiz kılması (`baseUrl` takma adı).</ParamField>
    <ParamField path="speakerVoice" type="string">Azure ses ShortName. Varsayılan `en-US-JennyNeural`. Eski takma ad: `voice`.</ParamField>
    <ParamField path="lang" type="string">SSML dil kodu. Varsayılan `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">Standart ses için Azure `X-Microsoft-OutputFormat`. Varsayılan `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Sesli not çıktısı için Azure `X-Microsoft-OutputFormat`. Varsayılan `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">`ELEVENLABS_API_KEY` veya `XI_API_KEY` değerine geri döner.</ParamField>
    <ParamField path="model" type="string">Model kimliği (ör. `eleven_multilingual_v2`, `eleven_v3`).</ParamField>
    <ParamField path="speakerVoiceId" type="string">ElevenLabs ses kimliği. Eski takma ad: `voiceId`.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (her biri `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = normal).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Metin normalleştirme modu.</ParamField>
    <ParamField path="languageCode" type="string">2 harfli ISO 639-1 (ör. `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">En iyi çaba düzeyinde determinizm için `0..4294967295` tam sayısı.</ParamField>
    <ParamField path="baseUrl" type="string">ElevenLabs API temel URL'sini geçersiz kılın.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">`GEMINI_API_KEY` / `GOOGLE_API_KEY` değerine geri döner. Atlanırsa TTS, ortam geri dönüşünden önce `models.providers.google.apiKey` değerini yeniden kullanabilir.</ParamField>
    <ParamField path="model" type="string">Gemini TTS modeli. Varsayılan `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="speakerVoice" type="string">Gemini önceden oluşturulmuş ses adı. Varsayılan `Kore`. Eski takma adlar: `voiceName`, `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Konuşulan metinden önce eklenen doğal dil tarzı istem.</ParamField>
    <ParamField path="speakerName" type="string">İsteminiz adlandırılmış bir konuşmacı kullandığında konuşulan metinden önce eklenen isteğe bağlı konuşmacı etiketi.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Etkin persona istem alanlarını deterministik bir Gemini TTS istem yapısına sarmak için `audio-profile-v1` olarak ayarlayın.</ParamField>
    <ParamField path="personaPrompt" type="string">Şablonun Director's Notes bölümüne eklenen Google'a özel ek persona istem metni.</ParamField>
    <ParamField path="baseUrl" type="string">Yalnızca `https://generativelanguage.googleapis.com` kabul edilir.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Ortam: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Varsayılan `https://api.gradium.ai`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Varsayılan Emma (`YTpq7expH9539ERJ`). Eski takma ad: `voiceId`.</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Birincil Inworld

    <ParamField path="apiKey" type="string">Ortam: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Varsayılan `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Varsayılan `inworld-tts-1.5-max`. Ayrıca: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Varsayılan `Sarah`. Eski takma ad: `voiceId`.</ParamField>
    <ParamField path="temperature" type="number">Örnekleme sıcaklığı `0..2`.</ParamField>

  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">CLI TTS için yerel çalıştırılabilir dosya veya komut dizesi.</ParamField>
    <ParamField path="args" type="string[]">Komut bağımsız değişkenleri. `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}` yer tutucularını destekler.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Beklenen CLI çıktı biçimi. Ses ekleri için varsayılan `mp3`.</ParamField>
    <ParamField path="timeoutMs" type="number">Milisaniye cinsinden komut zaman aşımı. Varsayılan `120000`.</ParamField>
    <ParamField path="cwd" type="string">İsteğe bağlı komut çalışma dizini.</ParamField>
    <ParamField path="env" type="Record<string, string>">Komut için isteğe bağlı ortam geçersiz kılmaları.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (no API key)">
    <ParamField path="enabled" type="boolean" default="true">Microsoft konuşma kullanımına izin ver.</ParamField>
    <ParamField path="speakerVoice" type="string">Microsoft neural voice adı (örn. `en-US-MichelleNeural`). Eski takma ad: `voice`.</ParamField>
    <ParamField path="lang" type="string">Dil kodu (örn. `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Microsoft çıktı biçimi. Varsayılan `audio-24khz-48kbitrate-mono-mp3`. Tüm biçimler paketlenmiş Edge destekli aktarım tarafından desteklenmez.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Yüzde dizeleri (örn. `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Ses dosyasının yanına JSON altyazıları yaz.</ParamField>
    <ParamField path="proxy" type="string">Microsoft konuşma istekleri için proxy URL'si.</ParamField>
    <ParamField path="timeoutMs" type="number">İstek zaman aşımı geçersiz kılması (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Eski takma ad. Kalıcı yapılandırmayı `providers.microsoft` olarak yeniden yazmak için `openclaw doctor --fix` çalıştırın.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">`MINIMAX_API_KEY` değerine geri döner. `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` veya `MINIMAX_CODING_API_KEY` üzerinden Token Plan kimlik doğrulaması.</ParamField>
    <ParamField path="baseUrl" type="string">Varsayılan `https://api.minimax.io`. Ortam: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Varsayılan `speech-2.8-hd`. Ortam: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Varsayılan `English_expressive_narrator`. Ortam: `MINIMAX_TTS_VOICE_ID`. Eski takma ad: `voiceId`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Varsayılan `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Varsayılan `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Tam sayı `-12..12`. Varsayılan `0`. Kesirli değerler istekten önce kırpılır.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">`OPENAI_API_KEY` değerine geri döner.</ParamField>
    <ParamField path="model" type="string">OpenAI TTS model kimliği (örn. `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="speakerVoice" type="string">Ses adı (örn. `alloy`, `cedar`). Eski takma ad: `voice`.</ParamField>
    <ParamField path="instructions" type="string">Açık OpenAI `instructions` alanı. Ayarlandığında persona prompt alanları otomatik olarak eşlenmez.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">Oluşturulan OpenAI TTS alanlarından sonra `/audio/speech` istek gövdelerine birleştirilen ek JSON alanları. Bunu, `lang` gibi sağlayıcıya özgü anahtarlar gerektiren Kokoro gibi OpenAI uyumlu uç noktalar için kullanın; güvenli olmayan prototype anahtarları yok sayılır.</ParamField>
    <ParamField path="baseUrl" type="string">
      OpenAI TTS uç noktasını geçersiz kılın. Çözüm sırası: yapılandırma → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Varsayılan olmayan değerler OpenAI uyumlu TTS uç noktaları olarak ele alınır; bu nedenle özel model ve ses adları kabul edilir.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Ortam: `OPENROUTER_API_KEY`. `models.providers.openrouter.apiKey` yeniden kullanılabilir.</ParamField>
    <ParamField path="baseUrl" type="string">Varsayılan `https://openrouter.ai/api/v1`. Eski `https://openrouter.ai/v1` normalleştirilir.</ParamField>
    <ParamField path="model" type="string">Varsayılan `hexgrad/kokoro-82m`. Takma ad: `modelId`.</ParamField>
    <ParamField path="speakerVoice" type="string">Varsayılan `af_alloy`. Eski takma adlar: `voice`, `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Varsayılan `mp3`.</ParamField>
    <ParamField path="speed" type="number">Sağlayıcıya özgü hız geçersiz kılması.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Ortam: `VOLCENGINE_TTS_API_KEY` veya `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Varsayılan `seed-tts-1.0`. Ortam: `VOLCENGINE_TTS_RESOURCE_ID`. Projenizin TTS 2.0 yetkisi olduğunda `seed-tts-2.0` kullanın.</ParamField>
    <ParamField path="appKey" type="string">Uygulama anahtarı üst bilgisi. Varsayılan `aGjiRDfUWi`. Ortam: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Seed Speech TTS HTTP uç noktasını geçersiz kılın. Ortam: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="speakerVoice" type="string">Ses türü. Varsayılan `en_female_anna_mars_bigtts`. Ortam: `VOLCENGINE_TTS_VOICE`. Eski takma ad: `voice`.</ParamField>
    <ParamField path="speedRatio" type="number">Sağlayıcıya özgü hız oranı.</ParamField>
    <ParamField path="emotion" type="string">Sağlayıcıya özgü duygu etiketi.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Eski Volcengine Speech Console alanları. Ortam: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (varsayılan `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Ortam: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Varsayılan `https://api.x.ai/v1`. Ortam: `XAI_BASE_URL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Varsayılan `eve`. Canlı sesler: `ara`, `eve`, `leo`, `rex`, `sal`, `una`. Eski takma ad: `voiceId`.</ParamField>
    <ParamField path="language" type="string">BCP-47 dil kodu veya `auto`. Varsayılan `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Varsayılan `mp3`.</ParamField>
    <ParamField path="speed" type="number">Sağlayıcıya özgü hız geçersiz kılması.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Ortam: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Varsayılan `https://api.xiaomimimo.com/v1`. Ortam: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Varsayılan `mimo-v2.5-tts`. Ortam: `XIAOMI_TTS_MODEL`. `mimo-v2-tts` ve `mimo-v2.5-tts-voicedesign` seçeneklerini de destekler.</ParamField>
    <ParamField path="speakerVoice" type="string">Hazır ses modelleri için varsayılan `mimo_default`. Ortam: `XIAOMI_TTS_VOICE`. Eski takma ad: `voice`. `mimo-v2.5-tts-voicedesign` için gönderilmez.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Varsayılan `mp3`. Ortam: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Kullanıcı mesajı olarak gönderilen isteğe bağlı doğal dil stil talimatı; seslendirilmez. `mimo-v2.5-tts-voicedesign` için bu, ses tasarımı promptudur; atlanırsa OpenClaw bir varsayılan sağlar.</ParamField>
  </Accordion>
</AccordionGroup>

## Agent aracı

`tts` aracı metni konuşmaya dönüştürür ve yanıt teslimi için bir ses eki
döndürür. Feishu, Matrix, Telegram ve WhatsApp üzerinde ses, dosya eki yerine
sesli mesaj olarak teslim edilir. Feishu ve WhatsApp, `ffmpeg` kullanılabilir
olduğunda bu yolda Opus olmayan TTS çıktısını dönüştürebilir.

WhatsApp, sesi Baileys üzerinden PTT ses notu olarak (`audio` ile
`ptt: true`) gönderir ve istemciler ses notlarında altyazıları tutarlı şekilde
işlemediği için görünür metni PTT sesinden **ayrı olarak** gönderir.

Araç isteğe bağlı `channel` ve `timeoutMs` alanlarını kabul eder; `timeoutMs`,
milisaniye cinsinden çağrı başına sağlayıcı istek zaman aşımıdır. Çağrı başına
değerler `messages.tts.timeoutMs` değerini geçersiz kılar; yapılandırılmış TTS
zaman aşımları, Plugin tarafından yazılmış sağlayıcı varsayılanlarını geçersiz kılar.

## Gateway RPC

| Yöntem            | Amaç                                     |
| ----------------- | ---------------------------------------- |
| `tts.status`      | Geçerli TTS durumunu ve son denemeyi oku. |
| `tts.enable`      | Yerel otomatik tercihi `always` olarak ayarla. |
| `tts.disable`     | Yerel otomatik tercihi `off` olarak ayarla. |
| `tts.convert`     | Tek seferlik metin → ses.                |
| `tts.setProvider` | Yerel sağlayıcı tercihini ayarla.        |
| `tts.setPersona`  | Yerel persona tercihini ayarla.          |
| `tts.providers`   | Yapılandırılmış sağlayıcıları ve durumu listele. |

## Hizmet bağlantıları

- [OpenAI metinden konuşmaya kılavuzu](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API başvurusu](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST metinden konuşmaya](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Azure Speech sağlayıcısı](/tr/providers/azure-speech)
- [ElevenLabs Metinden Konuşmaya](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Kimlik Doğrulama](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/tr/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/tr/providers/volcengine#text-to-speech)
- [Xiaomi MiMo konuşma sentezi](/tr/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech çıktı biçimleri](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI metinden konuşmaya](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## İlgili

- [Medya genel bakışı](/tr/tools/media-overview)
- [Müzik oluşturma](/tr/tools/music-generation)
- [Video oluşturma](/tr/tools/video-generation)
- [Eğik çizgi komutları](/tr/tools/slash-commands)
- [Sesli arama Plugin'i](/tr/plugins/voice-call)

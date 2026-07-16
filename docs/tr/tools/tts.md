---
read_when:
    - Yanıtlar için metinden konuşmaya özelliğini etkinleştirme
    - Bir TTS sağlayıcısını, yedek zincirini veya kişiliği yapılandırma
    - /tts komutlarını veya yönergelerini kullanma
sidebarTitle: Text to speech (TTS)
summary: Giden yanıtlar için metinden konuşmaya — sağlayıcılar, kişilikler, eğik çizgi komutları ve kanal başına çıktı
title: Metinden konuşmaya
x-i18n:
    generated_at: "2026-07-16T17:42:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4ba17f56927507a73b5b116f5f13bb7b612b4ba7669f5ad240d5c96a6620c611
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw, giden yanıtları **14 konuşma sağlayıcısı** üzerinden sese dönüştürür:
Feishu, Matrix, Telegram ve WhatsApp'ta yerel sesli mesajlar; diğer her yerde ses
ekleri; telefon ve Talk için ise PCM/Ulaw akışları.

TTS, Talk'ın `stt-tts` modunun konuşma çıkışı yarısıdır (`talk.speak` çağrıları da
aynı sentez yolunu kullanır). Sağlayıcıya özgü `realtime` Talk oturumları konuşmayı
gerçek zamanlı sağlayıcı içinde sentezler; `transcription` oturumları ise hiçbir zaman
asistanın sesli yanıtını sentezlemez.

## Hızlı başlangıç

<Steps>
  <Step title="Bir sağlayıcı seçin">
    OpenAI ve ElevenLabs en güvenilir barındırılan seçeneklerdir. Microsoft ve
    Yerel CLI, API anahtarı olmadan çalışır. Tam liste için [sağlayıcı matrisine](#supported-providers)
    bakın.
  </Step>
  <Step title="API anahtarını ayarlayın">
    Sağlayıcınızın ortam değişkenini dışa aktarın (örneğin `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft ve Yerel CLI için anahtar gerekmez.
  </Step>
  <Step title="Yapılandırmada etkinleştirin">
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
  <Step title="Sohbette deneyin">
    `/tts status` geçerli durumu gösterir. `/tts audio Hello from OpenClaw`
    tek seferlik bir sesli yanıt gönderir.
  </Step>
</Steps>

<Note>
Otomatik TTS varsayılan olarak **kapalıdır**. `messages.tts.provider` ayarlanmamışsa
OpenClaw, kayıt defterindeki otomatik seçim sırasına göre yapılandırılmış ilk sağlayıcıyı seçer.
Yerleşik `tts` ajan aracı yalnızca açık niyetle çalışır: kullanıcı ses istemedikçe,
`/tts` kullanmadıkça veya Otomatik TTS/yönerge
konuşmasını etkinleştirmedikçe normal sohbet metin olarak kalır.
</Note>

## Desteklenen sağlayıcılar

| Sağlayıcı          | Kimlik doğrulama                                                                                                             | Notlar                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (ayrıca `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)          | Yerel Ogg/Opus sesli not çıkışı ve telefon desteği.                                            |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | OpenAI uyumlu TTS. Varsayılan değer `hexgrad/Kokoro-82M`.                                    |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` veya `XI_API_KEY`                                                                             | Ses klonlama, çok dillilik, `seed` aracılığıyla belirlenebilirlik; Discord ses oynatımı için akış halinde sunulur. |
| **Google Gemini** | `GEMINI_API_KEY` veya `GOOGLE_API_KEY`                                                                             | Gemini API toplu TTS; `promptTemplate: "audio-profile-v1"` aracılığıyla persona duyarlı.               |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | Sesli not ve telefon çıkışı.                                                            |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | Akışlı TTS API'si. Yerel Opus sesli not ve PCM telefon desteği.                                |
| **Yerel CLI**     | yok                                                                                                             | Yapılandırılmış yerel bir TTS komutu çalıştırır.                                                        |
| **Microsoft**     | yok                                                                                                             | `node-edge-tts` üzerinden herkese açık Edge sinirsel TTS. En iyi çaba esasına dayalıdır, SLA yoktur.                            |
| **MiniMax**       | `MINIMAX_API_KEY` (veya Token Planı: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)      | T2A v2 API'si. Varsayılan değer `speech-2.8-hd`.                                                    |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | Otomatik özet için de kullanılır; `instructions` personasını destekler.                                |
| **OpenRouter**    | `OPENROUTER_API_KEY` (`models.providers.openrouter.apiKey` yeniden kullanılabilir)                                            | Varsayılan model `hexgrad/kokoro-82m`.                                                         |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` veya `BYTEPLUS_SEED_SPEECH_API_KEY` (eski AppID/token: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | BytePlus Seed Speech HTTP API'si.                                                              |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | Paylaşılan görüntü, video ve konuşma sağlayıcısı.                                                   |
| **xAI**           | `XAI_API_KEY`                                                                                                    | xAI toplu TTS. Yerel Opus sesli not **desteklenmez**.                                 |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | Xiaomi sohbet tamamlamaları üzerinden MiMo TTS.                                                   |

Birden fazla sağlayıcı yapılandırılmışsa önce seçilen sağlayıcı kullanılır ve
diğerleri yedek seçenekler olarak değerlendirilir. Otomatik özet, `summaryModel` (veya
`agents.defaults.model.primary`) kullanır; bu nedenle özetleri etkin
tutarsanız ilgili sağlayıcıda da kimlik doğrulaması yapılmalıdır.

<Warning>
Paketle birlikte gelen **Microsoft** sağlayıcısı, `node-edge-tts` üzerinden Microsoft Edge'in çevrimiçi sinirsel TTS
hizmetini kullanır. Yayımlanmış bir SLA'sı veya kotası olmayan herkese açık bir web hizmetidir;
en iyi çaba esasına dayalı olarak değerlendirin. Eski sağlayıcı kimliği `edge`,
`microsoft` olarak normalleştirilir ve `openclaw doctor --fix` kalıcı
yapılandırmayı yeniden yazar; yeni yapılandırmalar her zaman `microsoft` kullanmalıdır.
</Warning>

## Yapılandırma

TTS yapılandırması, `~/.openclaw/openclaw.json` içindeki `messages.tts` altında bulunur. Bir
ön ayar seçin ve sağlayıcı bloğunu uyarlayın. Aşağıda gösterilen `speakerVoice`/`speakerVoiceId`
alanları standarttır; her sağlayıcının kendi `voice`/`voiceId`/
`voiceName` alan adları eski diğer adlar olarak çalışmaya devam eder.

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
          // İsteğe bağlı doğal dil stil istemleri:
          // audioProfile: "Sakin, podcast sunucusu tonuyla konuş.",
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
  <Tab title="Yerel CLI">
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
  <Tab title="Microsoft (anahtar gerekmez)">
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

Xiaomi `mimo-v2.5-tts-voicedesign` için `speakerVoice` alanını atlayın ve `style` değerini
ses tasarımı istemi olarak ayarlayın. OpenClaw bu istemi TTS `user` mesajı olarak gönderir
ve voicedesign modeli için `audio.voice` göndermez.

### Aracı başına ses geçersiz kılmaları

Bir aracının farklı bir sağlayıcı, ses, model, persona veya otomatik TTS moduyla konuşması gerektiğinde `agents.list[].tts` kullanın. Aracı bloğu
`messages.tts` üzerine derin birleştirme uygular; böylece sağlayıcı kimlik bilgileri genel sağlayıcı yapılandırmasında kalabilir:

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

Aracı başına bir personayı sabitlemek için sağlayıcı yapılandırmasının yanında
`agents.list[].tts.persona` ayarlayın; bu, yalnızca o aracı için genel `messages.tts.persona` değerini geçersiz kılar.

Otomatik yanıtlar, `/tts audio`, `/tts status` ve
`tts` aracı aracı için öncelik sırası:

1. `messages.tts`
2. etkin `agents.list[].tts`
3. kanal `channels.<channel>.tts` desteklediğinde kanal geçersiz kılması
4. kanal `channels.<channel>.accounts.<id>.tts` ilettiğinde hesap geçersiz kılması
5. bu ana makine için yerel `/tts` tercihleri
6. [model geçersiz kılmaları](#model-driven-directives) etkinleştirildiğinde satır içi `[[tts:...]]` yönergeleri

Kanal ve hesap geçersiz kılmaları, `messages.tts` ile aynı şekli kullanır ve
önceki katmanların üzerine derin birleştirme uygular; böylece paylaşılan sağlayıcı kimlik bilgileri
`messages.tts` içinde kalırken bir kanal veya bot hesabı yalnızca konuşmacı sesini, modeli, personayı
veya otomatik modu değiştirebilir:

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

Bir **persona**, sağlayıcılar genelinde belirlenimsel olarak uygulanabilen kararlı bir konuşma kimliğidir. Bir sağlayıcıyı tercih edebilir, sağlayıcıdan bağımsız istem
amacını tanımlayabilir ve sesler, modeller, istem şablonları, çekirdek değerleri ve ses ayarları için sağlayıcıya özgü bağlamalar taşıyabilir.

### Asgari persona

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "Anlatıcı",
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
          description: "Kuru mizahlı, sıcak bir İngiliz uşak anlatıcı.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "Zeki bir İngiliz uşak. Kuru mizahlı, nüktedan, sıcak, çekici, duygularını ifade eden ve asla sıradan olmayan.",
            scene: "Gece geç saatlerde sessiz bir çalışma odası. Güvenilir bir operatör için yakın mikrofonlu anlatım.",
            sampleContext: "Konuşmacı, özel bir teknik isteği özlü bir özgüven ve kuru bir sıcaklıkla yanıtlıyor.",
            style: "Zarif, ölçülü ve hafifçe eğlenmiş.",
            accent: "Britanya İngilizcesi.",
            pacing: "Ölçülü, kısa dramatik duraklamalarla.",
            constraints: ["Yapılandırma değerlerini sesli okumayın.", "Personayı açıklamayın."],
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

Etkin persona belirlenimsel olarak seçilir:

1. ayarlanmışsa yerel `/tts persona <id>` tercihi.
2. ayarlanmışsa `messages.tts.persona`.
3. Persona yok.

Sağlayıcı seçimi, açık seçimlere öncelik vererek çalışır:

1. Doğrudan geçersiz kılmalar (CLI, gateway, Talk, izin verilen TTS yönergeleri).
2. Yerel `/tts provider <id>` tercihi.
3. Etkin personanın `provider` değeri.
4. `messages.tts.provider`.
5. Kayıt defterinden otomatik seçim.

OpenClaw, her sağlayıcı denemesinde yapılandırmaları şu sırayla birleştirir:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Güvenilir istek geçersiz kılmaları
4. İzin verilen, model tarafından yayımlanan TTS yönergesi geçersiz kılmaları

### Sağlayıcılar persona istemlerini nasıl kullanır?

Persona istem alanları (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) **sağlayıcıdan bağımsızdır**. Bunların nasıl kullanılacağına
her sağlayıcı kendisi karar verir:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Persona istem alanlarını **yalnızca** etkin Google sağlayıcı yapılandırması
    `promptTemplate: "audio-profile-v1"` veya `personaPrompt` ayarladığında bir Gemini TTS istem yapısına
    sarar. Eski `audioProfile` ve `speakerName` alanları hâlâ Google'a özgü istem metni olarak
    başa eklenir. Bir `[[tts:text]]` bloğundaki `[whispers]` veya
    `[laughs]` gibi satır içi ses etiketleri Gemini transkriptinde korunur;
    OpenClaw bu etiketleri oluşturmaz.
  </Accordion>
  <Accordion title="OpenAI">
    Persona istem alanlarını, **yalnızca** açık bir OpenAI `instructions`
    yapılandırılmamışsa isteğin `instructions` alanına eşler. Açık `instructions`
    her zaman önceliklidir.
  </Accordion>
  <Accordion title="Diğer sağlayıcılar">
    Yalnızca `personas.<id>.providers.<provider>` altındaki sağlayıcıya özgü persona bağlamalarını
    kullanır. Sağlayıcı kendi persona istemi eşlemesini uygulamadığı sürece
    persona istem alanları yok sayılır.
  </Accordion>
</AccordionGroup>

### Geri dönüş ilkesi

`fallbackPolicy`, bir personanın denenen sağlayıcı için **hiçbir bağlaması olmadığında**
davranışı denetler:

| İlke               | Davranış                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **Varsayılan.** Sağlayıcıdan bağımsız istem alanları kullanılabilir kalır; sağlayıcı bunları kullanabilir veya yok sayabilir.                     |
| `provider-defaults` | Persona, bu deneme için istem hazırlığına dahil edilmez; diğer sağlayıcılara geri dönüş sürerken sağlayıcı kendi bağımsız varsayılanlarını kullanır. |
| `fail`              | Bu sağlayıcı denemesini `reasonCode: "not_configured"` ve `personaBinding: "missing"` ile atla. Geri dönüş sağlayıcıları yine denenir.              |

TTS isteğinin tamamı yalnızca denenen **tüm** sağlayıcılar atlandığında
veya başarısız olduğunda başarısız olur.

Talk oturumu sağlayıcı seçimi oturum kapsamındadır. Bir Talk istemcisi
sağlayıcı kimliklerini, model kimliklerini, ses kimliklerini ve yerel ayarları `talk.catalog` içinden seçmeli ve
bunları Talk oturumu veya devir isteği aracılığıyla iletmelidir. Bir ses oturumu açmak,
`messages.tts` değerini veya genel Talk sağlayıcı varsayılanlarını değiştirmemelidir.

## Model odaklı yönergeler

Varsayılan olarak asistan, tek bir yanıt için sesi, modeli veya hızı geçersiz kılmak üzere
`[[tts:...]]` yönergeleri ve yalnızca seste görünmesi gereken ifade ipuçları için isteğe bağlı bir
`[[tts:text]]...[[/tts:text]]` bloğu **yayımlayabilir**:

```text
Buyurun.

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](güler) Şarkıyı bir kez daha oku.[[/tts:text]]
```

`messages.tts.auto`, `"tagged"` olduğunda sesi tetiklemek için **yönergeler gereklidir**.
Akışlı blok teslimi, bitişik bloklara bölünmüş olsalar bile kanal görmeden önce yönergeleri
görünür metinden çıkarır.

`provider=...`, `modelOverrides.allowProvider: true` olmadığı sürece yok sayılır. Bir
yanıt `provider=...` bildirdiğinde, bu yönergedeki diğer anahtarlar yalnızca
o sağlayıcı tarafından ayrıştırılır; desteklenmeyen anahtarlar çıkarılır ve TTS
yönergesi uyarıları olarak bildirilir.

**Kullanılabilir yönerge anahtarları:**

- `provider` (kayıtlı sağlayıcı kimliği; `allowProvider: true` gerektirir)
- `speakerVoice` / `speakerVoiceId` (eski takma adlar: `voice`, `voiceName`, `voice_name`, `google_voice`, `voiceId`)
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (MiniMax ses düzeyi, `(0, 10]`)
- `pitch` (MiniMax tam sayı perde değeri, −12 ile 12; kesirli değerler kesilir)
- `emotion` (Volcengine duygu etiketi)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Model geçersiz kılmalarını tamamen devre dışı bırakma:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Diğer ayarları yapılandırılabilir tutarken sağlayıcı değiştirmeye izin verme:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Eğik çizgi komutları

Tek komut: `/tts`. Discord'da `/tts` yerleşik bir Discord komutu olduğundan,
OpenClaw ayrıca `/voice` kaydeder; metin biçimindeki `/tts ...` yine çalışır.

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
Komutlar yetkili bir gönderici gerektirir (izin listesi/sahip kuralları uygulanır) ve
`commands.text` veya yerel komut kaydı etkinleştirilmiş olmalıdır.
</Note>

Davranış notları:

- `/tts on`, yerel TTS tercihini `always` konumuna yazar; `/tts off` ise `off` konumuna yazar.
- `/tts chat on|off|default`, geçerli sohbet için oturum kapsamlı bir otomatik TTS geçersiz kılması yazar.
- `/tts persona <id>`, yerel persona tercihini yazar; `/tts persona off` bunu temizler.
- `/tts latest`, geçerli oturum transkriptinden en son asistan yanıtını okur ve bir kez ses olarak gönderir. Yinelenen ses gönderimlerini önlemek için oturum girdisinde yalnızca bu yanıtın karmasını saklar.
- `/tts audio`, tek seferlik bir sesli yanıt oluşturur (TTS'yi **etkinleştirmez**).
- `/tts limit <chars>`, **100–4096** aralığını kabul eder (4096, Telegram altyazı/mesaj üst sınırıdır); bu aralığın dışındaki değerler reddedilir.
- `limit` ve `summary`, ana yapılandırmada değil **yerel tercihlerde** saklanır.
- `/tts status`, en son deneme için geri dönüş tanılamalarını içerir: `Fallback: <primary> -> <used>`, `Attempts: ...` ve deneme başına ayrıntı (`provider:outcome(reasonCode) latency`).
- `/status`, TTS etkinleştirildiğinde etkin TTS modunun yanı sıra yapılandırılmış sağlayıcıyı, modeli, sesi ve hassas bilgilerden arındırılmış özel uç nokta meta verilerini gösterir.

## Kullanıcı başına tercihler

Eğik çizgi komutları yerel geçersiz kılmaları `prefsPath` konumuna yazar. Varsayılan değer
`~/.openclaw/settings/tts.json`; bunu `OPENCLAW_TTS_PREFS` ortam değişkeni
veya `messages.tts.prefsPath` ile geçersiz kılın.

| Saklanan alan | Etki                                                                             |
| ------------ | -------------------------------------------------------------------------------- |
| `auto`       | Yerel otomatik TTS geçersiz kılma ayarı (`always`, `off`, …)                                     |
| `provider`   | Yerel birincil sağlayıcı geçersiz kılma ayarı                                    |
| `persona`    | Yerel persona geçersiz kılma ayarı                                               |
| `maxLength`  | Özetleme/kırpma eşiği (varsayılan `1500` karakter, `/tts limit` aralığı 100–4096) |
| `summarize`  | Özetleme açma/kapama ayarı (varsayılan `true`)                                  |

Bunlar, söz konusu ana makine için `messages.tts` ile etkin
`agents.list[].tts` bloğundan gelen geçerli yapılandırmayı geçersiz kılar.

## Çıkış biçimleri

TTS ses iletimi, kanal yeteneklerine göre belirlenir. Kanal Pluginleri,
ses tarzı TTS'nin sağlayıcılardan yerel bir `voice-note` hedefi istemesi mi,
yoksa normal `audio-file` sentezini sürdürmesi mi gerektiğini ve kanalın
yerel olmayan çıkışı göndermeden önce dönüştürüp dönüştürmediğini bildirir.

| Hedef                                 | Biçim                                                                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | Sesli not yanıtlarında **Opus** tercih edilir (ElevenLabs'den `opus_48000_64`, OpenAI'dan `opus`). 48 kHz / 64 kbps, netlik ile boyutu dengeler. |
| Diğer kanallar                        | **MP3** (ElevenLabs'den `mp3_44100_128`, OpenAI'dan `mp3`). 44.1 kHz / 128 kbps, konuşma için varsayılan dengedir.                  |
| Talk / telefon                        | Sağlayıcıya özgü **PCM** (Inworld 22050 Hz, Google 24 kHz) veya telefon için Gradium'dan `ulaw_8000`.                                 |

Sağlayıcıya özgü notlar:

- **Feishu / WhatsApp kod dönüştürmesi:** Bir sesli not yanıtı MP3/WebM/WAV/M4A veya ses dosyası olması muhtemel başka bir biçimde geldiğinde kanal Plugini, yerel sesli mesajı göndermeden önce bunu `ffmpeg` (`libopus`, 64 kbps) ile 48 kHz Ogg/Opus biçimine dönüştürür. WhatsApp, sonucu `ptt: true` ve `audio/ogg; codecs=opus` ile Baileys `audio` yükü üzerinden gönderir. Kod dönüştürme başarısız olursa: Feishu hatayı yakalar ve özgün dosyayı normal bir ek olarak göndermeye geri döner; WhatsApp'ta geri dönüş yoktur, bu nedenle uyumsuz bir PTT yükü göndermek yerine gönderim işleminin kendisi başarısız olur.
- **MiniMax:** Normal ses ekleri için MP3 (`speech-2.8-hd` modeli, 32 kHz örnekleme hızı); kanalın bildirdiği sesli not hedefleri için `ffmpeg` ile 48 kHz Opus biçimine dönüştürülür.
- **Xiaomi MiMo:** Varsayılan olarak MP3 veya yapılandırıldığında WAV; kanalın bildirdiği sesli not hedefleri için `ffmpeg` ile 48 kHz Opus biçimine dönüştürülür.
- **Yerel CLI:** Yapılandırılmış `outputFormat` değerini kullanır. Sesli not hedefleri Ogg/Opus biçimine, telefon çıkışı ise `ffmpeg` ile ham 16 kHz mono PCM biçimine dönüştürülür.
- **Google Gemini:** Ham 24 kHz PCM döndürür. OpenClaw bunu ses ekleri için WAV olarak paketler, sesli not hedefleri için 48 kHz Opus biçimine dönüştürür ve Talk/telefon için doğrudan PCM döndürür.
- **Gradium:** Ses ekleri için WAV, sesli not hedefleri için Opus ve telefon için 8 kHz'de `ulaw_8000`.
- **Inworld:** Normal ses ekleri için MP3, sesli not hedefleri için yerel `OGG_OPUS` ve Talk/telefon için 22050 Hz'de ham `PCM`.
- **xAI:** Varsayılan olarak MP3; ses dosyası sentezinde hem arabelleğe alınmış hem de akışlı çıkış için `mp3`, `wav`, `pcm`, `mulaw` veya `alaw` kullanılabilir. xAI'ın `pcm`, `mulaw` ve `alaw` çıkışları başlıksız ham ses olduğundan, sesli not hedefleri akış için MP3'ü ve arabelleğe alınmış geri dönüş için MP3'ü kullanır. Arabelleğe alınmış sentez, xAI'ın toplu REST `/v1/tts` uç noktasını kullanır; `textToSpeechStream` yerel `wss://api.x.ai/v1/tts` kullanır. Bu, gerçek zamanlı ses sözleşmesi değildir. Yerel Opus sesli not biçimi desteklenmez.
- **Microsoft:** `microsoft.outputFormat` kullanır (varsayılan `audio-24khz-48kbitrate-mono-mp3`).
  - Paketle birlikte gelen taşıma, bir `outputFormat` kabul eder ancak hizmet tüm biçimleri sunmaz.
  - Çıkış biçimi değerleri, Microsoft Speech çıkış biçimlerini izler (Ogg/WebM Opus dâhil).
  - Telegram `sendVoice`, OGG/MP3/M4A kabul eder; Opus sesli mesajlarının garanti edilmesi gerekiyorsa OpenAI/ElevenLabs kullanın.
  - Yapılandırılmış Microsoft çıkış biçimi başarısız olursa OpenClaw işlemi MP3 ile yeniden dener.
  - Açık bir ses geçersiz kılma ayarı belirlenmemişse ve varsayılan İngilizce ses kullanılıyorsa yanıt metni ağırlıklı olarak CJK karakterlerinden oluştuğunda OpenClaw otomatik olarak Çince bir sinir ağı sesine (`zh-CN-XiaoxiaoNeural`, `zh-CN` yerel ayarı) geçer.

OpenAI ve ElevenLabs çıkış biçimleri, yukarıda listelendiği şekilde kanal başına sabittir.

## Otomatik TTS davranışı

`messages.tts.auto` etkinleştirildiğinde OpenClaw:

- Yanıt zaten yapılandırılmış medya içeriyorsa TTS'yi atlar.
- Çok kısa yanıtları (10 karakterden kısa) atlar.
- Özetler etkinleştirildiğinde uzun yanıtları
  `summaryModel` (veya `agents.defaults.model.primary`) kullanarak özetler.
- Oluşturulan sesi yanıta ekler.
- `mode: "final"` modunda, metin akışı tamamlandıktan sonra akışla iletilen nihai yanıtlar için
  yine yalnızca ses içeren TTS gönderir; oluşturulan medya, normal yanıt ekleriyle aynı
  kanal medya normalleştirmesinden geçer.

Yanıt `maxLength` değerini aşarsa OpenClaw sesi hiçbir zaman tamamen atlamaz:

- **Özet açık** (varsayılan) ve bir özet modeli kullanılabilir: metni
  yaklaşık `maxLength` karaktere özetler, ardından özeti sentezler.
- **Özet kapalıysa**, özetleme başarısız olursa veya özet modeli için API anahtarı
  yoksa: metni `maxLength` karakterle sınırlar ve kısaltılmış metni
  sentezler.

```text
Yanıt -> TTS etkin mi?
  hayır -> metni gönder
  evet  -> medya içeriyor mu / kısa mı?
           evet  -> metni gönder
           hayır -> uzunluk > sınır mı?
                     hayır -> TTS -> sesi ekle
                     evet  -> özet etkin ve kullanılabilir mi?
                               hayır -> kısalt -> TTS -> sesi ekle
                               evet  -> özetle -> TTS -> sesi ekle
```

## Alan referansı

<AccordionGroup>
  <Accordion title="Üst düzey messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Otomatik TTS modu. `inbound` yalnızca gelen bir sesli mesajdan sonra ses gönderir; `tagged` yalnızca yanıt `[[tts:...]]` yönergelerini veya bir `[[tts:text]]` bloğunu içerdiğinde ses gönderir.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Eski geçiş anahtarı. `openclaw doctor --fix` bunu `auto` biçimine geçirir.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"`, nihai yanıtlara ek olarak araç/blok yanıtlarını da içerir.
    </ParamField>
    <ParamField path="provider" type="string">
      Konuşma sağlayıcısı kimliği. Ayarlanmadığında OpenClaw, kayıt defterinin otomatik seçim sırasındaki ilk yapılandırılmış sağlayıcıyı kullanır. Eski `provider: "edge"`, `openclaw doctor --fix` tarafından `"microsoft"` olarak yeniden yazılır.
    </ParamField>
    <ParamField path="persona" type="string">
      `personas` içindeki etkin persona kimliği. Küçük harfe dönüştürülür.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Kararlı konuşma kimliği. Alanlar: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Bkz. [Personalar](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Otomatik özet için düşük maliyetli model; varsayılanı `agents.defaults.model.primary`. `provider/model` veya yapılandırılmış bir model diğer adını kabul eder.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Modelin TTS yönergeleri oluşturmasına izin verir. `enabled` varsayılan olarak `true`; `allowProvider` ise varsayılan olarak `false` değerini alır.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Konuşma sağlayıcısı kimliğine göre anahtarlanan, sağlayıcının sahip olduğu ayarlar. Eski doğrudan bloklar (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) `openclaw doctor --fix` tarafından yeniden yazılır; yalnızca `messages.tts.providers.<id>` kaydedilmelidir.
    </ParamField>
    <ParamField path="maxTextLength" type="number" default="4096">
      TTS giriş karakterleri için kesin üst sınır. Aşıldığında `/tts audio`, `tts.convert` ve `tts.speak` başarısız olur.
    </ParamField>
    <ParamField path="timeoutMs" type="number" default="30000">
      Milisaniye cinsinden istek zaman aşımı. Ayarlanmışsa çağrı başına `timeoutMs` (ajan aracı, gateway) önceliklidir; aksi takdirde açıkça yapılandırılmış `messages.tts.timeoutMs`, plugin tarafından tanımlanan tüm sağlayıcı varsayılanlarına göre önceliklidir.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Yerel tercihler JSON yolunu geçersiz kılar (sağlayıcı/sınır/özet). Varsayılan `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Ortam değişkeni: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` veya `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Azure Speech bölgesi (ör. `eastus`). Ortam değişkeni: `AZURE_SPEECH_REGION` veya `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">İsteğe bağlı Azure Speech uç noktası geçersiz kılma değeri (diğer adı `baseUrl`).</ParamField>
    <ParamField path="speakerVoice" type="string">Azure sesinin ShortName değeri. Varsayılan `en-US-JennyNeural`. Eski diğer ad: `voice`.</ParamField>
    <ParamField path="lang" type="string">SSML dil kodu. Varsayılan `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">Standart ses için Azure `X-Microsoft-OutputFormat`. Varsayılan `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Sesli not çıktısı için Azure `X-Microsoft-OutputFormat`. Varsayılan `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">`ELEVENLABS_API_KEY` veya `XI_API_KEY` değerine geri döner.</ParamField>
    <ParamField path="model" type="string">Model kimliği. Varsayılan `eleven_multilingual_v2`. Eski `eleven_turbo_v2_5`/`eleven_turbo_v2` kimlikleri, eşleşen `flash` modeline normalleştirilir.</ParamField>
    <ParamField path="speakerVoiceId" type="string">ElevenLabs ses kimliği. Varsayılan `pMsXgVXv3BLzUgSXRplE`. Eski diğer ad: `voiceId`.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (her biri `0..1`, varsayılanları `0.5`/`0.75`/`0`), `useSpeakerBoost` (`true|false`, varsayılan `true`), `speed` (`0.5..2.0`, varsayılan `1.0`).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Metin normalleştirme modu.</ParamField>
    <ParamField path="languageCode" type="string">2 harfli ISO 639-1 (ör. `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Olanaklar ölçüsünde belirlenimlilik için tam sayı `0..4294967295`.</ParamField>
    <ParamField path="baseUrl" type="string">ElevenLabs API temel URL'sini geçersiz kılar.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">`GEMINI_API_KEY` / `GOOGLE_API_KEY` değerlerine geri döner. Belirtilmezse TTS, ortam değişkenine geri dönmeden önce `models.providers.google.apiKey` değerini yeniden kullanabilir.</ParamField>
    <ParamField path="model" type="string">Gemini TTS modeli. Varsayılan: `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="speakerVoice" type="string">Gemini hazır ses adı. Varsayılan: `Kore`. Eski takma adlar: `voiceName`, `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Seslendirilecek metnin başına eklenen doğal dilde stil istemi.</ParamField>
    <ParamField path="speakerName" type="string">İsteminizde adlandırılmış bir konuşmacı kullanıldığında seslendirilecek metnin başına eklenen isteğe bağlı konuşmacı etiketi.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Etkin persona istemi alanlarını belirlenimci bir Gemini TTS istem yapısıyla sarmalamak için `audio-profile-v1` olarak ayarlayın.</ParamField>
    <ParamField path="personaPrompt" type="string">Şablonun Yönetmen Notları'na eklenen, Google'a özgü ilave persona istemi metni.</ParamField>
    <ParamField path="baseUrl" type="string">Yalnızca `https://generativelanguage.googleapis.com` kabul edilir.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Ortam değişkeni: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">`api.gradium.ai` üzerindeki HTTPS Gradium API URL'si. Varsayılan: `https://api.gradium.ai`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Varsayılan: Emma (`YTpq7expH9539ERJ`). Eski takma ad: `voiceId`.</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Birincil Inworld

    <ParamField path="apiKey" type="string">Ortam değişkeni: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Varsayılan: `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Varsayılan: `inworld-tts-1.5-max`. Ayrıca: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Varsayılan: `Sarah`. Eski takma ad: `voiceId`.</ParamField>
    <ParamField path="temperature" type="number">Örnekleme sıcaklığı `0..2` (0 hariç).</ParamField>

  </Accordion>

  <Accordion title="Yerel CLI (tts-local-cli)">
    <ParamField path="command" type="string">CLI TTS için yerel yürütülebilir dosya veya komut dizesi.</ParamField>
    <ParamField path="args" type="string[]">Komut bağımsız değişkenleri. `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}` yer tutucularını destekler.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Beklenen CLI çıktı biçimi. Ses ekleri için varsayılan: `mp3`.</ParamField>
    <ParamField path="timeoutMs" type="number">Milisaniye cinsinden komut zaman aşımı. Varsayılan: `120000`.</ParamField>
    <ParamField path="cwd" type="string">İsteğe bağlı komut çalışma dizini.</ParamField>
    <ParamField path="env" type="Record<string, string>">Komut için isteğe bağlı ortam değişkeni geçersiz kılmaları.</ParamField>

    Komutun standart çıktısı ile oluşturulan veya dönüştürülen ses 50 MiB ile sınırlıdır. Tanılama amaçlı standart hata çıktısı 1 MiB ile sınırlıdır. Sınırlardan biri aşıldığında OpenClaw komutu sonlandırır ve sentezi başarısız kılar.

  </Accordion>

  <Accordion title="Microsoft (API anahtarı yok)">
    <ParamField path="enabled" type="boolean" default="true">Microsoft konuşma kullanımına izin verin.</ParamField>
    <ParamField path="speakerVoice" type="string">Microsoft sinir ağı ses adı (ör. `en-US-MichelleNeural`). Eski takma ad: `voice`. Varsayılan İngilizce ses etkinse ve yanıt metninde CJK karakterleri baskınsa OpenClaw otomatik olarak `zh-CN-XiaoxiaoNeural` değerine geçer.</ParamField>
    <ParamField path="lang" type="string">Dil kodu (ör. `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Microsoft çıktı biçimi. Varsayılan: `audio-24khz-48kbitrate-mono-mp3`. Tüm biçimler paketle birlikte gelen Edge tabanlı aktarım tarafından desteklenmez.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Yüzde dizeleri (ör. `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Ses dosyasının yanına JSON altyazıları yazın.</ParamField>
    <ParamField path="proxy" type="string">Microsoft konuşma istekleri için proxy URL'si.</ParamField>
    <ParamField path="timeoutMs" type="number">İstek zaman aşımı geçersiz kılması (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Eski takma ad. Kalıcı yapılandırmayı `providers.microsoft` olarak yeniden yazmak için `openclaw doctor --fix` komutunu çalıştırın.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">`MINIMAX_API_KEY` değerine geri döner. `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` veya `MINIMAX_CODING_API_KEY` aracılığıyla Token Plan kimlik doğrulaması.</ParamField>
    <ParamField path="baseUrl" type="string">Varsayılan: `https://api.minimax.io`. Ortam değişkeni: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Varsayılan: `speech-2.8-hd`. Ortam değişkeni: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Varsayılan: `English_expressive_narrator`. Ortam değişkeni: `MINIMAX_TTS_VOICE_ID`. Eski takma ad: `voiceId`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Varsayılan: `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Varsayılan: `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Tam sayı `-12..12`. Varsayılan: `0`. Kesirli değerler istekten önce kesilir.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">`OPENAI_API_KEY` değerine geri döner.</ParamField>
    <ParamField path="model" type="string">OpenAI TTS model kimliği. Varsayılan: `gpt-4o-mini-tts`.</ParamField>
    <ParamField path="speakerVoice" type="string">Ses adı (ör. `alloy`, `cedar`). Varsayılan: `coral`. Eski takma ad: `voice`.</ParamField>
    <ParamField path="instructions" type="string">Açık OpenAI `instructions` alanı. Ayarlandığında persona istemi alanları otomatik olarak **eşlenmez**.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">Oluşturulan OpenAI TTS alanlarından sonra `/audio/speech` istek gövdeleriyle birleştirilen ek JSON alanları. Bunu, `lang` gibi sağlayıcıya özgü anahtarlar gerektiren Kokoro benzeri OpenAI uyumlu uç noktalar için kullanın; güvenli olmayan prototip anahtarları yok sayılır.</ParamField>
    <ParamField path="baseUrl" type="string">
      OpenAI TTS uç noktasını geçersiz kılın. Çözümleme sırası: yapılandırma → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Varsayılan olmayan değerler OpenAI uyumlu TTS uç noktaları olarak değerlendirilir; bu nedenle özel model ve ses adları kabul edilir ve `speed`, `0.25..4.0` aralık denetimini kaybeder.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Ortam değişkeni: `OPENROUTER_API_KEY`. `models.providers.openrouter.apiKey` yeniden kullanılabilir.</ParamField>
    <ParamField path="baseUrl" type="string">Varsayılan: `https://openrouter.ai/api/v1`. Eski `https://openrouter.ai/v1` normalleştirilir.</ParamField>
    <ParamField path="model" type="string">Varsayılan: `hexgrad/kokoro-82m`. Takma ad: `modelId`.</ParamField>
    <ParamField path="speakerVoice" type="string">Varsayılan: `af_alloy`. Eski takma adlar: `voice`, `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Varsayılan: `mp3`.</ParamField>
    <ParamField path="speed" type="number">Sağlayıcının yerel hız geçersiz kılması.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Ortam değişkeni: `VOLCENGINE_TTS_API_KEY` veya `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Varsayılan: `seed-tts-1.0`. Ortam değişkeni: `VOLCENGINE_TTS_RESOURCE_ID`. Projenizde TTS 2.0 yetkisi varsa `seed-tts-2.0` kullanın.</ParamField>
    <ParamField path="appKey" type="string">Uygulama anahtarı üstbilgisi. Varsayılan: `aGjiRDfUWi`. Ortam değişkeni: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Seed Speech TTS HTTP uç noktasını geçersiz kılın. Ortam değişkeni: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="speakerVoice" type="string">Ses türü. Varsayılan: `en_female_anna_mars_bigtts`. Ortam değişkeni: `VOLCENGINE_TTS_VOICE`. Eski takma ad: `voice`.</ParamField>
    <ParamField path="speedRatio" type="number">Sağlayıcının yerel hız oranı, `0.2..3`.</ParamField>
    <ParamField path="emotion" type="string">Sağlayıcının yerel duygu etiketi.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Eski Volcengine Speech Console alanları. Ortam değişkenleri: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (varsayılan: `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Ortam değişkeni: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Varsayılan: `https://api.x.ai/v1`. Ortam değişkeni: `XAI_BASE_URL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Varsayılan: `eve`. Kimlik doğrulamasıyla `openclaw infer tts voices --provider xai` güncel yerleşik kataloğu getirir; kimlik doğrulaması olmadan çevrimdışı geri dönüş seçenekleri `ara`, `eve`, `leo`, `rex` ve `sal` listelenir. Hesaba özel ses kimlikleri, yerleşik listede bulunmadıklarında bile iletilir. Eski takma ad: `voiceId`.</ParamField>
    <ParamField path="language" type="string">BCP-47 dil kodu veya `auto`. Varsayılan: `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Varsayılan: `mp3`.</ParamField>
    <ParamField path="speed" type="number">Sağlayıcının yerel hız geçersiz kılması, `0.7..1.5`.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Ortam değişkeni: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Varsayılan: `https://api.xiaomimimo.com/v1`. Ortam değişkeni: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Varsayılan: `mimo-v2.5-tts`. Ortam değişkeni: `XIAOMI_TTS_MODEL`. `mimo-v2-tts` ve `mimo-v2.5-tts-voicedesign` değerlerini de destekler.</ParamField>
    <ParamField path="speakerVoice" type="string">Önceden ayarlanmış ses modelleri için varsayılan: `mimo_default`. Ortam değişkeni: `XIAOMI_TTS_VOICE`. Eski takma ad: `voice`. `mimo-v2.5-tts-voicedesign` için gönderilmez.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Varsayılan: `mp3`. Ortam değişkeni: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Kullanıcı mesajı olarak gönderilen isteğe bağlı doğal dilde stil talimatı; seslendirilmez. `mimo-v2.5-tts-voicedesign` için bu, ses tasarımı istemidir; belirtilmezse OpenClaw varsayılan bir değer sağlar.</ParamField>
  </Accordion>
</AccordionGroup>

## Ajan aracı

`tts` aracı, metni konuşmaya dönüştürür ve yanıtın teslimi için bir ses eki döndürür. Feishu, Matrix, Telegram ve WhatsApp'ta ses, dosya eki yerine sesli mesaj olarak teslim edilir. `ffmpeg` kullanılabildiğinde Feishu ve WhatsApp, Opus olmayan TTS çıktısını bu yolda dönüştürebilir.

WhatsApp, sesi Baileys üzerinden PTT sesli notu olarak (`ptt: true` ile `audio`) gönderir ve istemciler sesli notlardaki altyazıları tutarlı biçimde görüntülemediğinden görünür metni PTT sesinden **ayrı** gönderir.

Araç, isteğe bağlı `channel` ve `timeoutMs` alanlarını kabul eder; `timeoutMs`, çağrı başına milisaniye cinsinden sağlayıcı isteği zaman aşımıdır. Çağrı başına değerler `messages.tts.timeoutMs` değerini geçersiz kılar; yapılandırılmış TTS zaman aşımları, Plugin tarafından tanımlanan tüm sağlayıcı varsayılanlarını geçersiz kılar.

## Gateway RPC

| Yöntem            | Amaç                                         |
| ----------------- | -------------------------------------------- |
| `tts.status`      | Geçerli TTS durumunu ve son denemeyi oku.    |
| `tts.enable`      | Yerel otomatik tercihi `always` olarak ayarla. |
| `tts.disable`     | Yerel otomatik tercihi `off` olarak ayarla. |
| `tts.convert`     | Tek seferlik metin → ses.                    |
| `tts.setProvider` | Yerel sağlayıcı tercihini ayarla.            |
| `tts.personas`    | Yapılandırılmış personaları ve etkin olanı listele. |
| `tts.setPersona`  | Yerel persona tercihini ayarla.              |
| `tts.providers`   | Yapılandırılmış sağlayıcıları ve durumlarını listele. |

## Hizmet bağlantıları

- [OpenAI metinden konuşmaya kılavuzu](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API referansı](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST metinden konuşmaya](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Azure Speech sağlayıcısı](/tr/providers/azure-speech)
- [ElevenLabs Metinden Konuşmaya](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Kimlik Doğrulaması](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/tr/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/tr/providers/volcengine#text-to-speech)
- [Xiaomi MiMo konuşma sentezi](/tr/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech çıktı biçimleri](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI metinden konuşmaya](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## İlgili

- [Medyaya genel bakış](/tr/tools/media-overview)
- [Müzik oluşturma](/tr/tools/music-generation)
- [Video oluşturma](/tr/tools/video-generation)
- [Eğik çizgi komutları](/tr/tools/slash-commands)
- [Sesli arama plugini](/tr/plugins/voice-call)

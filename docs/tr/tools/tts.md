---
read_when:
    - Yanıtlar için metinden konuşmayı etkinleştirme
    - TTS sağlayıcılarını veya sınırlarını yapılandırma
    - '`/tts` komutlarını kullanma'
summary: Giden yanıtlar için metinden konuşmaya (TTS)
title: Metinden Konuşmaya
x-i18n:
    generated_at: "2026-04-05T14:14:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8487c8acef7585bd4eb5e3b39e2a063ebc6b5f0103524abdcbadd3a7781ffc46
    source_path: tools/tts.md
    workflow: 15
---

# Metinden konuşmaya (TTS)

OpenClaw, ElevenLabs, Microsoft, MiniMax veya OpenAI kullanarak giden yanıtları sese dönüştürebilir.
OpenClaw'ın ses gönderebildiği her yerde çalışır.

## Desteklenen hizmetler

- **ElevenLabs** (birincil veya yedek sağlayıcı)
- **Microsoft** (birincil veya yedek sağlayıcı; mevcut paketlenmiş uygulama `node-edge-tts` kullanır)
- **MiniMax** (birincil veya yedek sağlayıcı; T2A v2 API'sini kullanır)
- **OpenAI** (birincil veya yedek sağlayıcı; ayrıca özetler için kullanılır)

### Microsoft konuşma notları

Paketlenmiş Microsoft konuşma sağlayıcısı şu anda Microsoft Edge'in çevrimiçi
nöral TTS hizmetini `node-edge-tts` kitaplığı üzerinden kullanır. Barındırılan bir hizmettir (yerel
değil), Microsoft uç noktalarını kullanır ve API anahtarı gerektirmez.
`node-edge-tts`, konuşma yapılandırma seçeneklerini ve çıktı biçimlerini sunar, ancak
tüm seçenekler hizmet tarafından desteklenmez. Eski yapılandırma ve yönerge girdisi
olarak `edge` hâlâ çalışır ve `microsoft` olarak normalize edilir.

Bu yol, yayımlanmış bir SLA veya kota olmadan herkese açık bir web hizmeti olduğu için,
onu en iyi çaba düzeyinde değerlendirin. Garantili sınırlar ve destek gerekiyorsa OpenAI
veya ElevenLabs kullanın.

## İsteğe bağlı anahtarlar

OpenAI, ElevenLabs veya MiniMax istiyorsanız:

- `ELEVENLABS_API_KEY` (veya `XI_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`

Microsoft konuşma için API anahtarı **gerekmez**.

Birden fazla sağlayıcı yapılandırılmışsa önce seçilen sağlayıcı kullanılır, diğerleri yedek seçenekler olur.
Otomatik özetleme, yapılandırılmış `summaryModel` değerini (veya `agents.defaults.model.primary`) kullanır,
bu nedenle özetlemeyi etkinleştirirseniz o sağlayıcının da kimliği doğrulanmış olması gerekir.

## Hizmet bağlantıları

- [OpenAI Text-to-Speech guide](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API reference](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech output formats](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)

## Varsayılan olarak etkin mi?

Hayır. Otomatik TTS varsayılan olarak **kapalıdır**. Yapılandırmada
`messages.tts.auto` ile veya oturum başına `/tts always` (takma ad: `/tts on`) ile etkinleştirin.

`messages.tts.provider` ayarlanmamışsa OpenClaw, kayıt defteri otomatik seçim sırasındaki
ilk yapılandırılmış konuşma sağlayıcısını seçer.

## Yapılandırma

TTS yapılandırması `openclaw.json` içinde `messages.tts` altında bulunur.
Tam şema [Gateway configuration](/tr/gateway/configuration) sayfasındadır.

### En düşük yapılandırma (etkinleştirme + sağlayıcı)

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

### Birincil OpenAI, yedek ElevenLabs

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      providers: {
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
      },
    },
  },
}
```

### Birincil Microsoft (API anahtarı yok)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          voice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          rate: "+10%",
          pitch: "-5%",
        },
      },
    },
  },
}
```

### Birincil MiniMax

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "minimax_api_key",
          baseUrl: "https://api.minimax.io",
          model: "speech-2.8-hd",
          voiceId: "English_expressive_narrator",
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
      },
    },
  },
}
```

### Microsoft konuşmayı devre dışı bırakma

```json5
{
  messages: {
    tts: {
      providers: {
        microsoft: {
          enabled: false,
        },
      },
    },
  },
}
```

### Özel sınırlar + prefs yolu

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
    },
  },
}
```

### Yalnızca gelen bir sesli mesajdan sonra sesle yanıt ver

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### Uzun yanıtlar için otomatik özeti devre dışı bırakma

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

Ardından şunu çalıştırın:

```
/tts summary off
```

### Alanlarla ilgili notlar

- `auto`: otomatik TTS modu (`off`, `always`, `inbound`, `tagged`).
  - `inbound`, yalnızca gelen bir sesli mesajdan sonra ses gönderir.
  - `tagged`, yalnızca yanıt `[[tts]]` etiketleri içerdiğinde ses gönderir.
- `enabled`: eski açma/kapama seçeneği (doctor bunu `auto` değerine taşır).
- `mode`: `"final"` (varsayılan) veya `"all"` (araç/blok yanıtlarını da içerir).
- `provider`: `"elevenlabs"`, `"microsoft"`, `"minimax"` veya `"openai"` gibi konuşma sağlayıcı kimliği (yedek otomatik olarak yapılır).
- `provider` **ayarlanmamışsa**, OpenClaw kayıt defteri otomatik seçim sırasındaki ilk yapılandırılmış konuşma sağlayıcısını kullanır.
- Eski `provider: "edge"` hâlâ çalışır ve `microsoft` olarak normalize edilir.
- `summaryModel`: otomatik özet için isteğe bağlı düşük maliyetli model; varsayılan olarak `agents.defaults.model.primary` kullanılır.
  - `provider/model` veya yapılandırılmış model takma adını kabul eder.
- `modelOverrides`: modelin TTS yönergeleri üretmesine izin verir (varsayılan olarak açık).
  - `allowProvider` varsayılan olarak `false` değerindedir (sağlayıcı değiştirme isteğe bağlıdır).
- `providers.<id>`: konuşma sağlayıcı kimliğine göre anahtarlanan, sağlayıcının sahip olduğu ayarlar.
- Eski doğrudan sağlayıcı blokları (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) yükleme sırasında otomatik olarak `messages.tts.providers.<id>` yapısına taşınır.
- `maxTextLength`: TTS girdisi için katı üst sınır (karakter). Aşılırsa `/tts audio` başarısız olur.
- `timeoutMs`: istek zaman aşımı (ms).
- `prefsPath`: yerel tercihler JSON yolu için geçersiz kılma (sağlayıcı/sınır/özet).
- `apiKey` değerleri ortam değişkenlerine geri döner (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl`: ElevenLabs API temel URL'sini geçersiz kılar.
- `providers.openai.baseUrl`: OpenAI TTS uç noktasını geçersiz kılar.
  - Çözümleme sırası: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Varsayılan dışındaki değerler OpenAI uyumlu TTS uç noktaları olarak değerlendirilir, bu nedenle özel model ve ses adları kabul edilir.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (`1.0 = normal`)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2 harfli ISO 639-1 (ör. `en`, `de`)
- `providers.elevenlabs.seed`: `0..4294967295` tamsayısı (en iyi çaba ile belirlenim)
- `providers.minimax.baseUrl`: MiniMax API temel URL'sini geçersiz kılar (varsayılan `https://api.minimax.io`, ortam: `MINIMAX_API_HOST`).
- `providers.minimax.model`: TTS modeli (varsayılan `speech-2.8-hd`, ortam: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: ses tanımlayıcısı (varsayılan `English_expressive_narrator`, ortam: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: oynatma hızı `0.5..2.0` (varsayılan 1.0).
- `providers.minimax.vol`: ses seviyesi `(0, 10]` (varsayılan 1.0; 0'dan büyük olmalıdır).
- `providers.minimax.pitch`: perde kaydırma `-12..12` (varsayılan 0).
- `providers.microsoft.enabled`: Microsoft konuşma kullanımına izin verir (varsayılan `true`; API anahtarı yok).
- `providers.microsoft.voice`: Microsoft nöral ses adı (ör. `en-US-MichelleNeural`).
- `providers.microsoft.lang`: dil kodu (ör. `en-US`).
- `providers.microsoft.outputFormat`: Microsoft çıktı biçimi (ör. `audio-24khz-48kbitrate-mono-mp3`).
  - Geçerli değerler için Microsoft Speech çıktı biçimlerine bakın; tüm biçimler paketlenmiş Edge tabanlı taşıma tarafından desteklenmez.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: yüzde dizeleri (ör. `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: ses dosyasının yanına JSON altyazıları yazar.
- `providers.microsoft.proxy`: Microsoft konuşma istekleri için proxy URL'si.
- `providers.microsoft.timeoutMs`: istek zaman aşımı geçersiz kılması (ms).
- `edge.*`: aynı Microsoft ayarları için eski takma ad.

## Model odaklı geçersiz kılmalar (varsayılan olarak açık)

Varsayılan olarak model, tek bir yanıt için TTS yönergeleri üretebilir.
`messages.tts.auto`, `tagged` olduğunda sesi tetiklemek için bu yönergeler gereklidir.

Etkin olduğunda model, tek bir yanıt için sesi geçersiz kılmak üzere `[[tts:...]]` yönergeleri ve ayrıca
yalnızca seste görünmesi gereken ifadesel etiketler (kahkaha, şarkı söyleme işaretleri vb.)
sağlamak için isteğe bağlı bir `[[tts:text]]...[[/tts:text]]` bloğu üretebilir.

`provider=...` yönergeleri, `modelOverrides.allowProvider: true` olmadığı sürece yok sayılır.

Örnek yanıt yükü:

```
İşte burada.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](güler) Şarkıyı bir kez daha oku.[[/tts:text]]
```

Kullanılabilir yönerge anahtarları (etkin olduğunda):

- `provider` (kayıtlı konuşma sağlayıcısı kimliği, örneğin `openai`, `elevenlabs`, `minimax` veya `microsoft`; `allowProvider: true` gerektirir)
- `voice` (OpenAI sesi) veya `voiceId` (ElevenLabs / MiniMax)
- `model` (OpenAI TTS modeli, ElevenLabs model kimliği veya MiniMax modeli)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (MiniMax ses seviyesi, 0-10)
- `pitch` (MiniMax perde, -12 ile 12 arası)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Tüm model geçersiz kılmalarını devre dışı bırakın:

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false,
      },
    },
  },
}
```

İsteğe bağlı izin listesi (diğer ayarlar yapılandırılabilir kalırken sağlayıcı değiştirmeyi etkinleştirme):

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: true,
        allowSeed: false,
      },
    },
  },
}
```

## Kullanıcı başına tercihler

Slash komutları yerel geçersiz kılmaları `prefsPath` içine yazar (varsayılan:
`~/.openclaw/settings/tts.json`, `OPENCLAW_TTS_PREFS` veya
`messages.tts.prefsPath` ile geçersiz kılınabilir).

Saklanan alanlar:

- `enabled`
- `provider`
- `maxLength` (özet eşiği; varsayılan 1500 karakter)
- `summarize` (varsayılan `true`)

Bunlar, bu ana bilgisayar için `messages.tts.*` değerlerini geçersiz kılar.

## Çıktı biçimleri (sabit)

- **Feishu / Matrix / Telegram / WhatsApp**: Opus sesli mesajı (ElevenLabs'ten `opus_48000_64`, OpenAI'dan `opus`).
  - 48kHz / 64kbps, sesli mesaj için iyi bir dengedir.
- **Diğer kanallar**: MP3 (ElevenLabs'ten `mp3_44100_128`, OpenAI'dan `mp3`).
  - 44.1kHz / 128kbps, konuşma netliği için varsayılan dengedir.
- **MiniMax**: MP3 (`speech-2.8-hd` modeli, 32kHz örnekleme hızı). Sesli not biçimi doğal olarak desteklenmez; garantili Opus sesli mesajları için OpenAI veya ElevenLabs kullanın.
- **Microsoft**: `microsoft.outputFormat` kullanır (varsayılan `audio-24khz-48kbitrate-mono-mp3`).
  - Paketlenmiş taşıma bir `outputFormat` kabul eder, ancak tüm biçimler hizmetten alınamaz.
  - Çıktı biçimi değerleri Microsoft Speech çıktı biçimlerini izler (Ogg/WebM Opus dahil).
  - Telegram `sendVoice`, OGG/MP3/M4A kabul eder; garantili Opus sesli mesajları gerekiyorsa OpenAI/ElevenLabs kullanın.
  - Yapılandırılmış Microsoft çıktı biçimi başarısız olursa OpenClaw MP3 ile yeniden dener.

OpenAI/ElevenLabs çıktı biçimleri kanal başına sabittir (yukarıya bakın).

## Otomatik TTS davranışı

Etkin olduğunda OpenClaw:

- yanıt zaten medya veya `MEDIA:` yönergesi içeriyorsa TTS'yi atlar.
- çok kısa yanıtları (< 10 karakter) atlar.
- etkinse uzun yanıtları `agents.defaults.model.primary` (veya `summaryModel`) kullanarak özetler.
- oluşturulan sesi yanıta ekler.

Yanıt `maxLength` değerini aşarsa ve özet kapalıysa (veya özet modeli için API anahtarı yoksa),
ses atlanır ve normal metin yanıtı gönderilir.

## Akış diyagramı

```
Yanıt -> TTS etkin mi?
  hayır -> metni gönder
  evet -> medya / MEDIA: / kısa var mı?
            evet -> metni gönder
            hayır -> uzunluk > sınır?
                     hayır -> TTS -> sesi ekle
                     evet -> özet etkin mi?
                              hayır -> metni gönder
                              evet -> özetle (`summaryModel` veya `agents.defaults.model.primary`)
                                        -> TTS -> sesi ekle
```

## Slash komutu kullanımı

Tek bir komut vardır: `/tts`.
Etkinleştirme ayrıntıları için [Slash commands](/tools/slash-commands) sayfasına bakın.

Discord notu: `/tts`, yerleşik bir Discord komutudur, bu yüzden OpenClaw
orada yerel komut olarak `/voice` kaydeder. Metin olarak `/tts ...` yine de çalışır.

```
/tts off
/tts always
/tts inbound
/tts tagged
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

Notlar:

- Komutlar yetkili bir gönderici gerektirir (izin listesi/sahip kuralları yine geçerlidir).
- `commands.text` veya yerel komut kaydı etkin olmalıdır.
- `off|always|inbound|tagged`, oturum başına açma/kapama seçenekleridir (`/tts on`, `/tts always` için bir takma addır).
- `limit` ve `summary`, ana yapılandırmada değil, yerel tercihlerde saklanır.
- `/tts audio`, tek seferlik bir sesli yanıt üretir (TTS'yi açmaz).
- `/tts status`, son deneme için yedek görünürlüğünü içerir:
  - başarılı yedek: `Fallback: <primary> -> <used>` artı `Attempts: ...`
  - başarısızlık: `Error: ...` artı `Attempts: ...`
  - ayrıntılı tanılama: `Attempt details: provider:outcome(reasonCode) latency`
- OpenAI ve ElevenLabs API hataları artık ayrıştırılmış sağlayıcı hata ayrıntısını ve istek kimliğini (sağlayıcı tarafından döndürülürse) içerir; bu da TTS hata/günlüklerine yansıtılır.

## Ajan aracı

`tts` aracı, metni konuşmaya dönüştürür ve
yanıt teslimi için bir ses eki döndürür. Kanal Feishu, Matrix, Telegram veya WhatsApp olduğunda,
ses bir dosya eki yerine sesli mesaj olarak teslim edilir.

## Gateway RPC

Gateway yöntemleri:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

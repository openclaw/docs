---
read_when:
    - Yanıtlar için metinden konuşmayı etkinleştirme
    - TTS sağlayıcılarını veya sınırlarını yapılandırma
    - '`/tts` komutlarını kullanma'
summary: Giden yanıtlar için metinden konuşmaya (TTS)
title: Metinden Konuşmaya
x-i18n:
    generated_at: "2026-04-12T23:34:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad79a6be34879347dc73fdab1bd219823cd7c6aa8504e3e4c73e1a0554c837c5
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
- **OpenAI** (birincil veya yedek sağlayıcı; özetler için de kullanılır)

### Microsoft konuşma notları

Paketlenmiş Microsoft konuşma sağlayıcısı şu anda Microsoft Edge'in çevrimiçi
nöral TTS hizmetini `node-edge-tts` kitaplığı aracılığıyla kullanır. Bu, barındırılan bir hizmettir (yerel değildir),
Microsoft uç noktalarını kullanır ve API anahtarı gerektirmez.
`node-edge-tts`, konuşma yapılandırma seçeneklerini ve çıktı biçimlerini sunar, ancak
hizmet tüm seçenekleri desteklemez. `edge` kullanan eski yapılandırma ve yönerge girdileri hâlâ çalışır ve `microsoft` olarak normalleştirilir.

Bu yol, yayımlanmış bir SLA veya kota bulunmayan herkese açık bir web hizmeti olduğundan,
bunu en iyi çaba esaslı olarak değerlendirin. Garantili sınırlar ve destek gerekiyorsa OpenAI
veya ElevenLabs kullanın.

## İsteğe bağlı anahtarlar

OpenAI, ElevenLabs veya MiniMax kullanmak istiyorsanız:

- `ELEVENLABS_API_KEY` (veya `XI_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`

Microsoft konuşması bir API anahtarı gerektirmez.

Birden fazla sağlayıcı yapılandırılmışsa, önce seçilen sağlayıcı kullanılır ve diğerleri yedek seçenekler olur.
Otomatik özetleme, yapılandırılmış `summaryModel` değerini (veya `agents.defaults.model.primary`) kullanır,
bu nedenle özetleri etkinleştirirseniz o sağlayıcının da kimliği doğrulanmış olması gerekir.

## Hizmet bağlantıları

- [OpenAI Text-to-Speech guide](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API reference](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech output formats](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)

## Varsayılan olarak etkin mi?

Hayır. Otomatik TTS varsayılan olarak **kapalıdır**. Bunu yapılandırmada
`messages.tts.auto` ile veya yerel olarak `/tts on` ile etkinleştirin.

`messages.tts.provider` ayarlanmadığında, OpenClaw kayıt defteri otomatik seçim sırasındaki
ilk yapılandırılmış konuşma sağlayıcısını seçer.

## Yapılandırma

TTS yapılandırması `openclaw.json` içinde `messages.tts` altında bulunur.
Tam şema [Gateway configuration](/tr/gateway/configuration) bölümündedir.

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

### ElevenLabs yedekli birincil OpenAI

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

### Microsoft konuşmasını devre dışı bırakma

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

### Yalnızca gelen bir sesli mesajdan sonra sesle yanıt verme

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

### Alanlar hakkında notlar

- `auto`: otomatik TTS kipi (`off`, `always`, `inbound`, `tagged`).
  - `inbound`, yalnızca gelen bir sesli mesajdan sonra ses gönderir.
  - `tagged`, yalnızca yanıt `[[tts:key=value]]` yönergeleri veya bir `[[tts:text]]...[[/tts:text]]` bloğu içerdiğinde ses gönderir.
- `enabled`: eski geçiş anahtarıdır (`doctor` bunu `auto` değerine geçirir).
- `mode`: `"final"` (varsayılan) veya `"all"` (araç/blok yanıtlarını da içerir).
- `provider`: `"elevenlabs"`, `"microsoft"`, `"minimax"` veya `"openai"` gibi konuşma sağlayıcısı kimliği (yedek otomatik olarak yapılır).
- `provider` **ayarlanmamışsa**, OpenClaw kayıt defteri otomatik seçim sırasındaki ilk yapılandırılmış konuşma sağlayıcısını kullanır.
- Eski `provider: "edge"` hâlâ çalışır ve `microsoft` olarak normalleştirilir.
- `summaryModel`: otomatik özet için isteğe bağlı düşük maliyetli modeldir; varsayılanı `agents.defaults.model.primary` değeridir.
  - `provider/model` veya yapılandırılmış bir model takma adını kabul eder.
- `modelOverrides`: modelin TTS yönergeleri üretmesine izin verir (varsayılan olarak açık).
  - `allowProvider` varsayılan olarak `false` değerindedir (sağlayıcı değiştirme isteğe bağlı olarak açılır).
- `providers.<id>`: konuşma sağlayıcısı kimliğine göre anahtarlanmış, sağlayıcıya ait ayarlar.
- Eski doğrudan sağlayıcı blokları (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) yükleme sırasında otomatik olarak `messages.tts.providers.<id>` yapısına geçirilir.
- `maxTextLength`: TTS girdisi için kesin üst sınır (karakter). Aşılırsa `/tts audio` başarısız olur.
- `timeoutMs`: istek zaman aşımı (ms).
- `prefsPath`: yerel tercih JSON yolunu geçersiz kılar (sağlayıcı/sınır/özet).
- `apiKey` değerleri ortam değişkenlerine geri düşer (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl`: ElevenLabs API taban URL'sini geçersiz kılar.
- `providers.openai.baseUrl`: OpenAI TTS uç noktasını geçersiz kılar.
  - Çözümleme sırası: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Varsayılan olmayan değerler OpenAI uyumlu TTS uç noktaları olarak değerlendirilir, bu nedenle özel model ve ses adları kabul edilir.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = normal)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2 harfli ISO 639-1 (ör. `en`, `de`)
- `providers.elevenlabs.seed`: `0..4294967295` aralığında tamsayı (en iyi çaba düzeyinde determinizm)
- `providers.minimax.baseUrl`: MiniMax API taban URL'sini geçersiz kılar (varsayılan `https://api.minimax.io`, ortam: `MINIMAX_API_HOST`).
- `providers.minimax.model`: TTS modeli (varsayılan `speech-2.8-hd`, ortam: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: ses tanımlayıcısı (varsayılan `English_expressive_narrator`, ortam: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: oynatma hızı `0.5..2.0` (varsayılan 1.0).
- `providers.minimax.vol`: ses seviyesi `(0, 10]` (varsayılan 1.0; 0'dan büyük olmalıdır).
- `providers.minimax.pitch`: perde kaydırması `-12..12` (varsayılan 0).
- `providers.microsoft.enabled`: Microsoft konuşmasının kullanılmasına izin verir (varsayılan `true`; API anahtarı yoktur).
- `providers.microsoft.voice`: Microsoft nöral ses adı (ör. `en-US-MichelleNeural`).
- `providers.microsoft.lang`: dil kodu (ör. `en-US`).
- `providers.microsoft.outputFormat`: Microsoft çıktı biçimi (ör. `audio-24khz-48kbitrate-mono-mp3`).
  - Geçerli değerler için Microsoft Speech çıktı biçimlerine bakın; paketlenmiş Edge destekli taşıma tüm biçimleri desteklemez.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: yüzde dizeleri (ör. `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: ses dosyasının yanına JSON altyazıları yazar.
- `providers.microsoft.proxy`: Microsoft konuşma istekleri için proxy URL'si.
- `providers.microsoft.timeoutMs`: istek zaman aşımı geçersiz kılması (ms).
- `edge.*`: aynı Microsoft ayarları için eski takma addır.

## Model güdümlü geçersiz kılmalar (varsayılan olarak açık)

Varsayılan olarak model, tek bir yanıt için TTS yönergeleri üretebilir.
`messages.tts.auto` değeri `tagged` olduğunda, sesi tetiklemek için bu yönergeler gereklidir.

Etkinleştirildiğinde model, tek bir yanıt için sesi geçersiz kılmak üzere `[[tts:...]]` yönergeleri ve ayrıca
yalnızca seste görünmesi gereken ifade etiketlerini (kahkaha, şarkı söyleme ipuçları vb.)
sağlamak için isteğe bağlı bir `[[tts:text]]...[[/tts:text]]` bloğu üretebilir.

`provider=...` yönergeleri, `modelOverrides.allowProvider: true` olmadıkça yok sayılır.

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

Tüm model geçersiz kılmalarını devre dışı bırakma:

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

İsteğe bağlı allowlist (diğer ayarlar yapılandırılabilir kalırken sağlayıcı değiştirmeyi etkinleştirme):

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

Depolanan alanlar:

- `enabled`
- `provider`
- `maxLength` (özet eşiği; varsayılan 1500 karakter)
- `summarize` (varsayılan `true`)

Bunlar, bu ana makine için `messages.tts.*` değerlerini geçersiz kılar.

## Çıktı biçimleri (sabit)

- **Feishu / Matrix / Telegram / WhatsApp**: Opus sesli mesajı (`opus_48000_64`, ElevenLabs'tan; `opus`, OpenAI'den).
  - 48kHz / 64kbps, sesli mesaj için iyi bir denge sağlar.
- **Diğer kanallar**: MP3 (`mp3_44100_128`, ElevenLabs'tan; `mp3`, OpenAI'den).
  - 44.1kHz / 128kbps, konuşma netliği için varsayılan dengedir.
- **MiniMax**: MP3 (`speech-2.8-hd` modeli, 32kHz örnekleme hızı). Sesli not biçimi yerel olarak desteklenmez; garantili Opus sesli mesajları için OpenAI veya ElevenLabs kullanın.
- **Microsoft**: `microsoft.outputFormat` kullanır (varsayılan `audio-24khz-48kbitrate-mono-mp3`).
  - Paketlenmiş taşıma bir `outputFormat` kabul eder, ancak hizmet tüm biçimleri sunmaz.
  - Çıktı biçimi değerleri Microsoft Speech çıktı biçimlerini izler (Ogg/WebM Opus dahil).
  - Telegram `sendVoice`, OGG/MP3/M4A kabul eder; garantili Opus sesli mesajlara ihtiyacınız varsa OpenAI/ElevenLabs kullanın.
  - Yapılandırılmış Microsoft çıktı biçimi başarısız olursa, OpenClaw MP3 ile yeniden dener.

OpenAI/ElevenLabs çıktı biçimleri kanal başına sabittir (yukarıya bakın).

## Otomatik TTS davranışı

Etkinleştirildiğinde OpenClaw:

- yanıt zaten medya veya `MEDIA:` yönergesi içeriyorsa TTS'yi atlar.
- çok kısa yanıtları atlar (< 10 karakter).
- etkinse uzun yanıtları `agents.defaults.model.primary` (veya `summaryModel`) kullanarak özetler.
- üretilen sesi yanıta ekler.

Yanıt `maxLength` değerini aşıyorsa ve özet kapalıysa (veya özet modeli için API anahtarı yoksa),
ses atlanır ve normal metin yanıtı gönderilir.

## Akış diyagramı

```
Yanıt -> TTS etkin mi?
  hayır -> metni gönder
  evet  -> medya / MEDIA: / kısa mı?
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
Etkinleştirme ayrıntıları için [Slash commands](/tr/tools/slash-commands) bölümüne bakın.

Discord notu: `/tts`, yerleşik bir Discord komutudur; bu yüzden OpenClaw orada
yerel komut olarak `/voice` kaydeder. Metin biçimindeki `/tts ...` yine de çalışır.

```
/tts off
/tts on
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

Notlar:

- Komutlar yetkili bir gönderen gerektirir (allowlist/sahip kuralları hâlâ geçerlidir).
- `commands.text` veya yerel komut kaydı etkin olmalıdır.
- Yapılandırma `messages.tts.auto`, `off|always|inbound|tagged` değerlerini kabul eder.
- `/tts on`, yerel TTS tercihini `always` olarak yazar; `/tts off` bunu `off` olarak yazar.
- Varsayılan olarak `inbound` veya `tagged` istiyorsanız yapılandırmayı kullanın.
- `limit` ve `summary`, ana yapılandırmada değil yerel tercihlerde depolanır.
- `/tts audio`, tek seferlik bir sesli yanıt üretir (TTS'yi açmaz).
- `/tts status`, son deneme için yedek görünürlüğü içerir:
  - başarılı yedek: `Fallback: <primary> -> <used>` artı `Attempts: ...`
  - başarısızlık: `Error: ...` artı `Attempts: ...`
  - ayrıntılı tanılama: `Attempt details: provider:outcome(reasonCode) latency`
- OpenAI ve ElevenLabs API hataları artık ayrıştırılmış sağlayıcı hata ayrıntısını ve istek kimliğini (sağlayıcı döndürdüğünde) içerir; bu bilgiler TTS hatalarında/günlüklerinde gösterilir.

## Aracı

`tts` aracı, metni konuşmaya dönüştürür ve
yanıt teslimi için bir ses eki döndürür. Kanal Feishu, Matrix, Telegram veya WhatsApp olduğunda
ses, dosya eki yerine sesli mesaj olarak teslim edilir.

## Gateway RPC

Gateway yöntemleri:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

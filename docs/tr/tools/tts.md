---
read_when:
    - Yanıtlar için metin okumayı etkinleştirme
    - TTS sağlayıcılarını veya sınırlarını yapılandırma
    - '`/tts` komutlarını kullanma'
summary: Giden yanıtlar için metin okuma (TTS)
title: Metin okuma (TTS)
x-i18n:
    generated_at: "2026-04-16T08:53:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: de7c1dc8831c1ba307596afd48cb4d36f844724887a13b17e35f41ef5174a86f
    source_path: tools/tts.md
    workflow: 15
---

# Metin okuma (TTS)

OpenClaw, ElevenLabs, Google Gemini, Microsoft, MiniMax veya OpenAI kullanarak giden yanıtları sese dönüştürebilir.
OpenClaw'ın ses gönderebildiği her yerde çalışır.

## Desteklenen hizmetler

- **ElevenLabs** (birincil veya yedek sağlayıcı)
- **Google Gemini** (birincil veya yedek sağlayıcı; Gemini API TTS kullanır)
- **Microsoft** (birincil veya yedek sağlayıcı; mevcut paketli uygulama `node-edge-tts` kullanır)
- **MiniMax** (birincil veya yedek sağlayıcı; T2A v2 API kullanır)
- **OpenAI** (birincil veya yedek sağlayıcı; ayrıca özetler için de kullanılır)

### Microsoft konuşma notları

Paketli Microsoft konuşma sağlayıcısı şu anda Microsoft Edge'in çevrimiçi
nöral TTS hizmetini `node-edge-tts` kütüphanesi üzerinden kullanır. Bu, barındırılan
(yani yerel olmayan) bir hizmettir, Microsoft uç noktalarını kullanır ve bir API anahtarı
gerektirmez.
`node-edge-tts`, konuşma yapılandırma seçeneklerini ve çıktı biçimlerini sunar, ancak
tüm seçenekler hizmet tarafından desteklenmez. `edge` kullanan eski yapılandırma ve yönerge girdileri
çalışmaya devam eder ve `microsoft` olarak normalize edilir.

Bu yol, yayımlanmış bir SLA veya kota olmayan herkese açık bir web hizmeti olduğu için,
bunu en iyi çaba esaslı olarak değerlendirin. Garantili sınırlar ve destek gerekiyorsa, OpenAI
veya ElevenLabs kullanın.

## İsteğe bağlı anahtarlar

OpenAI, ElevenLabs, Google Gemini veya MiniMax istiyorsanız:

- `ELEVENLABS_API_KEY` (veya `XI_API_KEY`)
- `GEMINI_API_KEY` (veya `GOOGLE_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`

Microsoft konuşma için **API anahtarı gerekmez**.

Birden fazla sağlayıcı yapılandırılmışsa, önce seçili sağlayıcı kullanılır ve diğerleri yedek seçenekler olur.
Otomatik özetleme yapılandırılmış `summaryModel` değerini (veya `agents.defaults.model.primary`) kullanır,
bu nedenle özetleri etkinleştirirseniz ilgili sağlayıcının kimliği doğrulanmış olması da gerekir.

## Hizmet bağlantıları

- [OpenAI Metin okuma kılavuzu](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API başvurusu](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Metinden Konuşmaya](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Kimlik Doğrulama](https://elevenlabs.io/docs/api-reference/authentication)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech çıktı biçimleri](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)

## Varsayılan olarak etkin mi?

Hayır. Otomatik TTS varsayılan olarak **kapalıdır**. Yapılandırmada
`messages.tts.auto` ile veya yerel olarak `/tts on` ile etkinleştirin.

`messages.tts.provider` ayarlanmadığında, OpenClaw kayıt defteri otomatik seçim sırasındaki
ilk yapılandırılmış konuşma sağlayıcısını seçer.

## Yapılandırma

TTS yapılandırması `openclaw.json` içinde `messages.tts` altında bulunur.
Tam şema [Gateway yapılandırması](/tr/gateway/configuration) bölümündedir.

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

### ElevenLabs yedekli OpenAI birincil

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

### Microsoft birincil (API anahtarı yok)

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

### MiniMax birincil

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

### Google Gemini birincil

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "gemini_api_key",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

Google Gemini TTS, Gemini API anahtarı yolunu kullanır. Gemini API ile
sınırlandırılmış bir Google Cloud Console API anahtarı burada geçerlidir ve
paketli Google görsel oluşturma sağlayıcısının kullandığı anahtar türüyle aynıdır.
Çözümleme sırası
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY` şeklindedir.

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

### Yalnızca gelen bir sesli mesajdan sonra sesli yanıt verme

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
  - `inbound` yalnızca gelen bir sesli mesajdan sonra ses gönderir.
  - `tagged` yalnızca yanıtta `[[tts:key=value]]` yönergeleri veya bir `[[tts:text]]...[[/tts:text]]` bloğu varsa ses gönderir.
- `enabled`: eski açma/kapatma anahtarıdır (`doctor` bunu `auto` değerine taşır).
- `mode`: `"final"` (varsayılan) veya `"all"` (araç/blok yanıtlarını da içerir).
- `provider`: `"elevenlabs"`, `"google"`, `"microsoft"`, `"minimax"` veya `"openai"` gibi konuşma sağlayıcısı kimliği (yedek kullanım otomatiktir).
- `provider` **ayarlanmamışsa**, OpenClaw kayıt defteri otomatik seçim sırasındaki ilk yapılandırılmış konuşma sağlayıcısını kullanır.
- Eski `provider: "edge"` hâlâ çalışır ve `microsoft` olarak normalize edilir.
- `summaryModel`: otomatik özet için isteğe bağlı düşük maliyetli modeldir; varsayılan değer `agents.defaults.model.primary` olur.
  - `provider/model` veya yapılandırılmış bir model takma adını kabul eder.
- `modelOverrides`: modelin TTS yönergeleri üretmesine izin verir (varsayılan olarak açıktır).
  - `allowProvider` varsayılan olarak `false` değerindedir (sağlayıcı değiştirme isteğe bağlıdır).
- `providers.<id>`: konuşma sağlayıcısı kimliğine göre anahtarlanan, sağlayıcıya ait ayarlardır.
- Eski doğrudan sağlayıcı blokları (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) yükleme sırasında otomatik olarak `messages.tts.providers.<id>` konumuna taşınır.
- `maxTextLength`: TTS girdisi için sabit üst sınırdır (karakter). Aşılırsa `/tts audio` başarısız olur.
- `timeoutMs`: istek zaman aşımı (ms).
- `prefsPath`: yerel prefs JSON yolunu geçersiz kılar (sağlayıcı/sınır/özet).
- `apiKey` değerleri ortam değişkenlerine geri döner (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl`: ElevenLabs API temel URL'sini geçersiz kılar.
- `providers.openai.baseUrl`: OpenAI TTS uç noktasını geçersiz kılar.
  - Çözümleme sırası: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Varsayılan olmayan değerler OpenAI uyumlu TTS uç noktaları olarak değerlendirilir, bu nedenle özel model ve ses adları kabul edilir.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = normal)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2 harfli ISO 639-1 (ör. `en`, `de`)
- `providers.elevenlabs.seed`: `0..4294967295` tam sayısı (en iyi çaba düzeyinde belirlenimlilik)
- `providers.minimax.baseUrl`: MiniMax API temel URL'sini geçersiz kılar (varsayılan `https://api.minimax.io`, ortam: `MINIMAX_API_HOST`).
- `providers.minimax.model`: TTS modeli (varsayılan `speech-2.8-hd`, ortam: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: ses tanımlayıcısıdır (varsayılan `English_expressive_narrator`, ortam: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: oynatma hızı `0.5..2.0` (varsayılan 1.0).
- `providers.minimax.vol`: ses düzeyi `(0, 10]` (varsayılan 1.0; 0'dan büyük olmalıdır).
- `providers.minimax.pitch`: perde kaydırma `-12..12` (varsayılan 0).
- `providers.google.model`: Gemini TTS modeli (varsayılan `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: Gemini hazır ses adı (varsayılan `Kore`; `voice` da kabul edilir).
- `providers.google.baseUrl`: Gemini API temel URL'sini geçersiz kılar. Yalnızca `https://generativelanguage.googleapis.com` kabul edilir.
  - `messages.tts.providers.google.apiKey` atlanırsa, TTS ortam değişkenine geri dönmeden önce `models.providers.google.apiKey` değerini yeniden kullanabilir.
- `providers.microsoft.enabled`: Microsoft konuşma kullanımına izin verir (varsayılan `true`; API anahtarı yoktur).
- `providers.microsoft.voice`: Microsoft nöral ses adı (ör. `en-US-MichelleNeural`).
- `providers.microsoft.lang`: dil kodu (ör. `en-US`).
- `providers.microsoft.outputFormat`: Microsoft çıktı biçimi (ör. `audio-24khz-48kbitrate-mono-mp3`).
  - Geçerli değerler için Microsoft Speech çıktı biçimlerine bakın; tüm biçimler paketli Edge tabanlı taşıma tarafından desteklenmez.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: yüzde dizgeleri (ör. `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: ses dosyasının yanına JSON altyazılar yazar.
- `providers.microsoft.proxy`: Microsoft konuşma istekleri için proxy URL'si.
- `providers.microsoft.timeoutMs`: istek zaman aşımı geçersiz kılma değeri (ms).
- `edge.*`: aynı Microsoft ayarları için eski takma addır.

## Model odaklı geçersiz kılmalar (varsayılan olarak açık)

Varsayılan olarak model, tek bir yanıt için TTS yönergeleri üretebilir.
`messages.tts.auto` değeri `tagged` olduğunda, sesi tetiklemek için bu yönergeler gereklidir.

Etkin olduğunda model, tek bir yanıt için sesi geçersiz kılmak amacıyla
`[[tts:...]]` yönergeleri yayımlayabilir; ayrıca yalnızca seste görünmesi gereken
ifade etiketlerini (kahkaha, şarkı söyleme ipuçları vb.) sağlamak için isteğe bağlı bir
`[[tts:text]]...[[/tts:text]]` bloğu da ekleyebilir.

`provider=...` yönergeleri, `modelOverrides.allowProvider: true` olmadıkça yok sayılır.

Örnek yanıt yükü:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Kullanılabilir yönerge anahtarları (etkin olduğunda):

- `provider` (kayıtlı konuşma sağlayıcısı kimliği; örneğin `openai`, `elevenlabs`, `google`, `minimax` veya `microsoft`; `allowProvider: true` gerektirir)
- `voice` (OpenAI sesi), `voiceName` / `voice_name` / `google_voice` (Google sesi) veya `voiceId` (ElevenLabs / MiniMax)
- `model` (OpenAI TTS modeli, ElevenLabs model kimliği veya MiniMax modeli) ya da `google_model` (Google TTS modeli)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (MiniMax ses düzeyi, 0-10)
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

İsteğe bağlı izin listesi (sağlayıcı değiştirmeyi etkinleştirirken diğer ayarların yapılandırılabilir kalmasını sağlar):

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

Eğik çizgi komutları yerel geçersiz kılmaları `prefsPath` konumuna yazar (varsayılan:
`~/.openclaw/settings/tts.json`, `OPENCLAW_TTS_PREFS` veya
`messages.tts.prefsPath` ile geçersiz kılınabilir).

Depolanan alanlar:

- `enabled`
- `provider`
- `maxLength` (özet eşiği; varsayılan 1500 karakter)
- `summarize` (varsayılan `true`)

Bunlar o ana makine için `messages.tts.*` değerlerini geçersiz kılar.

## Çıktı biçimleri (sabit)

- **Feishu / Matrix / Telegram / WhatsApp**: Opus sesli mesajı (`opus_48000_64` ElevenLabs'ten, `opus` OpenAI'den).
  - 48kHz / 64kbps, sesli mesaj için iyi bir denge sunar.
- **Diğer kanallar**: MP3 (`mp3_44100_128` ElevenLabs'ten, `mp3` OpenAI'den).
  - 44.1kHz / 128kbps, konuşma netliği için varsayılan dengedir.
- **MiniMax**: MP3 (`speech-2.8-hd` modeli, 32kHz örnekleme hızı). Sesli not biçimi yerel olarak desteklenmez; garantili Opus sesli mesajları için OpenAI veya ElevenLabs kullanın.
- **Google Gemini**: Gemini API TTS ham 24kHz PCM döndürür. OpenClaw bunu ses ekleri için WAV olarak sarar ve Talk/telefon için PCM'i doğrudan döndürür. Yerel Opus sesli not biçimi bu yolda desteklenmez.
- **Microsoft**: `microsoft.outputFormat` kullanır (varsayılan `audio-24khz-48kbitrate-mono-mp3`).
  - Paketli taşıma bir `outputFormat` kabul eder, ancak tüm biçimler hizmet tarafından sunulmaz.
  - Çıktı biçimi değerleri Microsoft Speech çıktı biçimlerini izler (Ogg/WebM Opus dahil).
  - Telegram `sendVoice`, OGG/MP3/M4A kabul eder; garantili Opus sesli mesajları gerekiyorsa OpenAI/ElevenLabs kullanın.
  - Yapılandırılmış Microsoft çıktı biçimi başarısız olursa, OpenClaw MP3 ile yeniden dener.

OpenAI/ElevenLabs çıktı biçimleri kanal başına sabittir (yukarıya bakın).

## Otomatik TTS davranışı

Etkin olduğunda OpenClaw:

- Yanıt zaten medya veya bir `MEDIA:` yönergesi içeriyorsa TTS'yi atlar.
- Çok kısa yanıtları atlar (< 10 karakter).
- Etkinse uzun yanıtları `agents.defaults.model.primary` (veya `summaryModel`) kullanarak özetler.
- Oluşturulan sesi yanıta ekler.

Yanıt `maxLength` değerini aşarsa ve özet kapalıysa (veya
özet modeli için API anahtarı yoksa), ses
atlanır ve normal metin yanıtı gönderilir.

## Akış diyagramı

```
Yanıt -> TTS etkin mi?
  hayır -> metni gönder
  evet  -> medya / MEDIA: / kısa var mı?
            evet  -> metni gönder
            hayır -> uzunluk > sınır?
                     hayır -> TTS -> sesi ekle
                     evet  -> özet etkin mi?
                               hayır -> metni gönder
                               evet  -> özetle (`summaryModel` veya `agents.defaults.model.primary`)
                                         -> TTS -> sesi ekle
```

## Eğik çizgi komutu kullanımı

Tek bir komut vardır: `/tts`.
Etkinleştirme ayrıntıları için [Eğik çizgi komutları](/tr/tools/slash-commands) bölümüne bakın.

Discord notu: `/tts`, Discord'un yerleşik bir komutudur, bu nedenle OpenClaw
orada yerel komut olarak `/voice` kaydeder. Metin olarak `/tts ...` yine de çalışır.

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

- Komutlar yetkili bir gönderici gerektirir (izin listesi/sahip kuralları yine geçerlidir).
- `commands.text` veya yerel komut kaydı etkinleştirilmiş olmalıdır.
- Yapılandırma `messages.tts.auto`, `off|always|inbound|tagged` değerlerini kabul eder.
- `/tts on`, yerel TTS tercihini `always` olarak yazar; `/tts off` bunu `off` olarak yazar.
- `inbound` veya `tagged` varsayılanları istiyorsanız yapılandırmayı kullanın.
- `limit` ve `summary`, ana yapılandırmada değil yerel tercihlerde depolanır.
- `/tts audio`, tek seferlik bir sesli yanıt üretir (TTS'yi açmaz).
- `/tts status`, son deneme için yedek kullanım görünürlüğünü içerir:
  - başarılı yedek kullanım: `Fallback: <primary> -> <used>` artı `Attempts: ...`
  - başarısızlık: `Error: ...` artı `Attempts: ...`
  - ayrıntılı tanılama: `Attempt details: provider:outcome(reasonCode) latency`
- OpenAI ve ElevenLabs API hataları artık ayrıştırılmış sağlayıcı hata ayrıntısını ve istek kimliğini (sağlayıcı döndürdüğünde) içerir; bunlar TTS hatalarında/günlüklerinde gösterilir.

## Ajan aracı

`tts` aracı metni konuşmaya dönüştürür ve
yanıt teslimi için bir ses eki döndürür. Kanal Feishu, Matrix, Telegram veya WhatsApp olduğunda,
ses dosya eki yerine sesli mesaj olarak teslim edilir.

## Gateway RPC

Gateway yöntemleri:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

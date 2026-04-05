---
read_when:
    - Yanıtlar için metinden konuşmayı etkinleştirme
    - TTS sağlayıcılarını veya sınırlarını yapılandırma
    - '`/tts` komutlarını kullanma'
summary: Giden yanıtlar için metinden konuşmaya (TTS)
title: Metinden Konuşmaya (eski yol)
x-i18n:
    generated_at: "2026-04-05T14:14:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: acca61773996299a582ab88e5a5db12d8f22ce8a28292ce97cc5dd5fdc2d3b83
    source_path: tts.md
    workflow: 15
---

# Metinden konuşmaya (TTS)

OpenClaw, ElevenLabs, Microsoft, MiniMax veya OpenAI kullanarak giden yanıtları sese dönüştürebilir.
OpenClaw'ın ses gönderebildiği her yerde çalışır.

## Desteklenen hizmetler

- **ElevenLabs** (birincil veya geri dönüş sağlayıcısı)
- **Microsoft** (birincil veya geri dönüş sağlayıcısı; mevcut paketlenmiş uygulama `node-edge-tts` kullanır)
- **MiniMax** (birincil veya geri dönüş sağlayıcısı; T2A v2 API'sini kullanır)
- **OpenAI** (birincil veya geri dönüş sağlayıcısı; özetler için de kullanılır)

### Microsoft konuşma notları

Paketlenmiş Microsoft konuşma sağlayıcısı şu anda Microsoft Edge'in çevrimiçi
sinirsel TTS hizmetini `node-edge-tts` kütüphanesi üzerinden kullanır. Barındırılan bir hizmettir (yerel değil),
Microsoft uç noktalarını kullanır ve API anahtarı gerektirmez.
`node-edge-tts`, konuşma yapılandırma seçeneklerini ve çıktı biçimlerini sunar, ancak
tüm seçenekler hizmet tarafından desteklenmez. `edge` kullanan eski yapılandırma ve yönerge girdileri
hala çalışır ve `microsoft` olarak normalleştirilir.

Bu yol, yayımlanmış bir SLA veya kota olmadan herkese açık bir web hizmeti olduğundan,
bunu en iyi çaba olarak değerlendirin. Garantili sınırlar ve destek gerekiyorsa OpenAI
veya ElevenLabs kullanın.

## İsteğe bağlı anahtarlar

OpenAI, ElevenLabs veya MiniMax istiyorsanız:

- `ELEVENLABS_API_KEY` (veya `XI_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`

Microsoft konuşma **API anahtarı gerektirmez**.

Birden fazla sağlayıcı yapılandırıldıysa önce seçilen sağlayıcı kullanılır, diğerleri geri dönüş seçenekleri olur.
Otomatik özet, yapılandırılmış `summaryModel` değerini (veya `agents.defaults.model.primary`) kullanır,
bu yüzden özetleri etkinleştirirseniz bu sağlayıcının da kimlik doğrulamasının yapılmış olması gerekir.

## Hizmet bağlantıları

- [OpenAI Metinden Konuşmaya kılavuzu](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API başvurusu](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Metinden Konuşmaya](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Kimlik Doğrulama](https://elevenlabs.io/docs/api-reference/authentication)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech çıktı biçimleri](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)

## Varsayılan olarak etkin mi?

Hayır. Otomatik TTS varsayılan olarak **kapalıdır**. Bunu yapılandırmada
`messages.tts.auto` ile veya oturum başına `/tts always` (takma ad: `/tts on`) ile etkinleştirin.

`messages.tts.provider` ayarlanmamışsa OpenClaw, kayıt defteri otomatik seçim sırasındaki ilk yapılandırılmış
konuşma sağlayıcısını seçer.

## Yapılandırma

TTS yapılandırması `openclaw.json` içinde `messages.tts` altında bulunur.
Tam şema [Gateway yapılandırması](/tr/gateway/configuration) bölümündedir.

### En az yapılandırma (etkinleştirme + sağlayıcı)

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

### ElevenLabs geri dönüşlü OpenAI birincil

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

### Yalnızca gelen sesli mesajdan sonra sesle yanıt ver

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
  - `inbound` yalnızca gelen sesli mesajdan sonra ses gönderir.
  - `tagged` yalnızca yanıtta `[[tts]]` etiketleri bulunduğunda ses gönderir.
- `enabled`: eski açma/kapama anahtarıdır (doctor bunu `auto` olarak taşır).
- `mode`: `"final"` (varsayılan) veya `"all"` (araç/blok yanıtlarını da içerir).
- `provider`: `"elevenlabs"`, `"microsoft"`, `"minimax"` veya `"openai"` gibi konuşma sağlayıcısı kimliği (geri dönüş otomatiktir).
- `provider` **ayarlanmamışsa**, OpenClaw kayıt defteri otomatik seçim sırasındaki ilk yapılandırılmış konuşma sağlayıcısını kullanır.
- Eski `provider: "edge"` hâlâ çalışır ve `microsoft` olarak normalleştirilir.
- `summaryModel`: otomatik özet için isteğe bağlı ucuz modeldir; varsayılanı `agents.defaults.model.primary` değeridir.
  - `provider/model` veya yapılandırılmış model takma adı kabul eder.
- `modelOverrides`: modelin TTS yönergeleri üretmesine izin verir (varsayılan olarak açık).
  - `allowProvider` varsayılan olarak `false` değerindedir (sağlayıcı değiştirme isteğe bağlıdır).
- `providers.<id>`: konuşma sağlayıcısı kimliğine göre anahtarlanan, sağlayıcıya ait ayarlar.
- Eski doğrudan sağlayıcı blokları (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) yükleme sırasında otomatik olarak `messages.tts.providers.<id>` içine taşınır.
- `maxTextLength`: TTS girdisi için katı üst sınırdır (karakter). Bu sınır aşılırsa `/tts audio` başarısız olur.
- `timeoutMs`: istek zaman aşımı (ms).
- `prefsPath`: yerel tercihler JSON yolu için geçersiz kılma (sağlayıcı/sınır/özet).
- `apiKey` değerleri ortam değişkenlerine geri döner (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl`: ElevenLabs API temel URL'sini geçersiz kılar.
- `providers.openai.baseUrl`: OpenAI TTS uç noktasını geçersiz kılar.
  - Çözümleme sırası: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Varsayılan olmayan değerler OpenAI uyumlu TTS uç noktaları olarak değerlendirilir, bu nedenle özel model ve ses adları kabul edilir.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (`1.0 = normal`)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2 harfli ISO 639-1 (ör. `en`, `de`)
- `providers.elevenlabs.seed`: `0..4294967295` tamsayısı (en iyi çaba determinizmi)
- `providers.minimax.baseUrl`: MiniMax API temel URL'sini geçersiz kılar (varsayılan `https://api.minimax.io`, ortam: `MINIMAX_API_HOST`).
- `providers.minimax.model`: TTS modeli (varsayılan `speech-2.8-hd`, ortam: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: ses tanımlayıcısı (varsayılan `English_expressive_narrator`, ortam: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: oynatma hızı `0.5..2.0` (varsayılan 1.0).
- `providers.minimax.vol`: ses düzeyi `(0, 10]` (varsayılan 1.0; 0'dan büyük olmalıdır).
- `providers.minimax.pitch`: perde kaydırma `-12..12` (varsayılan 0).
- `providers.microsoft.enabled`: Microsoft konuşma kullanımına izin verir (varsayılan `true`; API anahtarı yok).
- `providers.microsoft.voice`: Microsoft sinirsel ses adı (ör. `en-US-MichelleNeural`).
- `providers.microsoft.lang`: dil kodu (ör. `en-US`).
- `providers.microsoft.outputFormat`: Microsoft çıktı biçimi (ör. `audio-24khz-48kbitrate-mono-mp3`).
  - Geçerli değerler için Microsoft Speech çıktı biçimlerine bakın; tüm biçimler paketlenmiş Edge destekli aktarımda desteklenmez.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: yüzde dizeleri (ör. `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: ses dosyasının yanına JSON altyazıları yazar.
- `providers.microsoft.proxy`: Microsoft konuşma istekleri için proxy URL'si.
- `providers.microsoft.timeoutMs`: istek zaman aşımı geçersiz kılması (ms).
- `edge.*`: aynı Microsoft ayarları için eski takma addır.

## Model tarafından yönlendirilen geçersiz kılmalar (varsayılan olarak açık)

Varsayılan olarak model, tek bir yanıt için TTS yönergeleri üretebilir.
`messages.tts.auto` değeri `tagged` olduğunda, sesi tetiklemek için bu yönergeler gereklidir.

Etkin olduğunda model, tek bir yanıt için sesi geçersiz kılmak üzere `[[tts:...]]` yönergeleri ve ayrıca
yalnızca seste görünmesi gereken ifade etiketlerini (kahkaha, şarkı söyleme ipuçları vb.)
sağlamak için isteğe bağlı bir `[[tts:text]]...[[/tts:text]]` bloğu üretebilir.

`provider=...` yönergeleri, `modelOverrides.allowProvider: true` olmadıkça yok sayılır.

Örnek yanıt yükü:

```
İşte burada.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](gülerek) Şarkıyı bir kez daha oku.[[/tts:text]]
```

Kullanılabilir yönerge anahtarları (etkin olduğunda):

- `provider` (kayıtlı konuşma sağlayıcısı kimliği, örneğin `openai`, `elevenlabs`, `minimax` veya `microsoft`; `allowProvider: true` gerektirir)
- `voice` (OpenAI sesi) veya `voiceId` (ElevenLabs / MiniMax)
- `model` (OpenAI TTS modeli, ElevenLabs model kimliği veya MiniMax modeli)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (MiniMax ses düzeyi, 0-10)
- `pitch` (MiniMax perde, -12 ila 12)
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

İsteğe bağlı izin listesi (diğer düğmeler yapılandırılabilir kalırken sağlayıcı değiştirmeyi etkinleştirin):

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

Bunlar, ilgili host için `messages.tts.*` değerlerini geçersiz kılar.

## Çıktı biçimleri (sabit)

- **Feishu / Matrix / Telegram / WhatsApp**: Opus sesli mesajı (`opus_48000_64` ElevenLabs'ten, `opus` OpenAI'dan).
  - 48kHz / 64kbps, sesli mesaj için iyi bir denge sunar.
- **Diğer kanallar**: MP3 (`mp3_44100_128` ElevenLabs'ten, `mp3` OpenAI'dan).
  - 44.1kHz / 128kbps, konuşma netliği için varsayılan dengedir.
- **MiniMax**: MP3 (`speech-2.8-hd` modeli, 32kHz örnekleme hızı). Sesli not biçimi yerel olarak desteklenmez; garantili Opus sesli mesajları için OpenAI veya ElevenLabs kullanın.
- **Microsoft**: `microsoft.outputFormat` kullanır (varsayılan `audio-24khz-48kbitrate-mono-mp3`).
  - Paketlenmiş aktarım bir `outputFormat` kabul eder, ancak tüm biçimler hizmette mevcut değildir.
  - Çıktı biçimi değerleri Microsoft Speech çıktı biçimlerini izler (Ogg/WebM Opus dahil).
  - Telegram `sendVoice`, OGG/MP3/M4A kabul eder; garantili Opus sesli mesajlar gerekiyorsa OpenAI/ElevenLabs kullanın.
  - Yapılandırılmış Microsoft çıktı biçimi başarısız olursa OpenClaw MP3 ile yeniden dener.

OpenAI/ElevenLabs çıktı biçimleri kanal başına sabittir (yukarıya bakın).

## Otomatik TTS davranışı

Etkin olduğunda OpenClaw şunları yapar:

- yanıt zaten medya veya `MEDIA:` yönergesi içeriyorsa TTS'yi atlar.
- çok kısa yanıtları atlar (< 10 karakter).
- etkinse uzun yanıtları `agents.defaults.model.primary` (veya `summaryModel`) kullanarak özetler.
- üretilen sesi yanıta ekler.

Yanıt `maxLength` değerini aşarsa ve özet kapalıysa (veya
özet modeli için API anahtarı yoksa), ses
atlanır ve normal metin yanıtı gönderilir.

## Akış diyagramı

```
Yanıt -> TTS etkin mi?
  hayır -> metni gönder
  evet -> medya / MEDIA: / kısa mı?
          evet -> metni gönder
          hayır -> uzunluk > sınır mı?
                   hayır -> TTS -> sesi ekle
                   evet -> özet etkin mi?
                            hayır -> metni gönder
                            evet -> özetle (`summaryModel` veya `agents.defaults.model.primary`)
                                      -> TTS -> sesi ekle
```

## Slash komutu kullanımı

Tek bir komut vardır: `/tts`.
Etkinleştirme ayrıntıları için [Slash commands](/tools/slash-commands) bölümüne bakın.

Discord notu: `/tts`, Discord'un yerleşik bir komutudur, bu nedenle OpenClaw
orada yerel komut olarak `/voice` kaydeder. Metin biçimindeki `/tts ...` yine de çalışır.

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

- Komutlar yetkili bir gönderici gerektirir (izin listesi/sahip kuralları yine de geçerlidir).
- `commands.text` veya yerel komut kaydı etkin olmalıdır.
- `off|always|inbound|tagged`, oturum başına açma/kapama ayarlarıdır (`/tts on`, `/tts always` için bir takma addır).
- `limit` ve `summary`, ana yapılandırmada değil yerel tercihlerde saklanır.
- `/tts audio`, tek seferlik bir sesli yanıt üretir (TTS'yi açmaz).
- `/tts status`, son deneme için geri dönüş görünürlüğünü içerir:
  - başarılı geri dönüş: `Fallback: <primary> -> <used>` artı `Attempts: ...`
  - başarısızlık: `Error: ...` artı `Attempts: ...`
  - ayrıntılı tanılama: `Attempt details: provider:outcome(reasonCode) latency`
- OpenAI ve ElevenLabs API hataları artık ayrıştırılmış sağlayıcı hata ayrıntısını ve istek kimliğini (sağlayıcı döndürdüyse) içerir; bu bilgiler TTS hata/günlüklerinde gösterilir.

## Ajan aracı

`tts` aracı, metni konuşmaya dönüştürür ve yanıt teslimi için bir ses eki döndürür. Kanal Feishu, Matrix, Telegram veya WhatsApp olduğunda,
ses dosya eki yerine sesli mesaj olarak teslim edilir.

## Gateway RPC

Gateway yöntemleri:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

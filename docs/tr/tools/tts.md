---
read_when:
    - Yanıtlar için metinden konuşmayı etkinleştirme
    - TTS sağlayıcılarını veya sınırlarını yapılandırma
    - '`/tts` komutlarını kullanma'
summary: Giden yanıtlar için metinden konuşmaya (TTS)
title: Metinden konuşmaya
x-i18n:
    generated_at: "2026-04-24T09:38:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 935fec2325a08da6f4ecd8ba5a9b889cd265025c5c7ee43bc4e0da36c1003d8f
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw, ElevenLabs, Google Gemini, Microsoft, MiniMax, OpenAI veya xAI kullanarak giden yanıtları sese dönüştürebilir.
OpenClaw'ın ses gönderebildiği her yerde çalışır.

## Desteklenen hizmetler

- **ElevenLabs** (birincil veya geri dönüş sağlayıcısı)
- **Google Gemini** (birincil veya geri dönüş sağlayıcısı; Gemini API TTS kullanır)
- **Microsoft** (birincil veya geri dönüş sağlayıcısı; geçerli paketlenmiş uygulama `node-edge-tts` kullanır)
- **MiniMax** (birincil veya geri dönüş sağlayıcısı; T2A v2 API kullanır)
- **OpenAI** (birincil veya geri dönüş sağlayıcısı; özetler için de kullanılır)
- **xAI** (birincil veya geri dönüş sağlayıcısı; xAI TTS API kullanır)

### Microsoft speech notları

Paketlenmiş Microsoft speech sağlayıcısı şu anda Microsoft Edge'in çevrimiçi
nöral TTS hizmetini `node-edge-tts` kütüphanesi üzerinden kullanır. Barındırılan bir hizmettir (yerel
değildir), Microsoft uç noktalarını kullanır ve API anahtarı gerektirmez.
`node-edge-tts`, speech yapılandırma seçeneklerini ve çıktı biçimlerini açığa çıkarır, ancak
tüm seçenekler hizmet tarafından desteklenmez. `edge` kullanan eski yapılandırma ve directive girdileri
çalışmaya devam eder ve `microsoft` olarak normalize edilir.

Bu yol, yayınlanmış bir SLA veya kota olmadan herkese açık bir web hizmeti olduğu için
bunu en iyi çaba olarak değerlendirin. Garantili sınırlar ve destek istiyorsanız
OpenAI veya ElevenLabs kullanın.

## İsteğe bağlı anahtarlar

OpenAI, ElevenLabs, Google Gemini, MiniMax veya xAI istiyorsanız:

- `ELEVENLABS_API_KEY` (veya `XI_API_KEY`)
- `GEMINI_API_KEY` (veya `GOOGLE_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`
- `XAI_API_KEY`

Microsoft speech **API anahtarı gerektirmez**.

Birden çok sağlayıcı yapılandırılmışsa, seçilen sağlayıcı önce kullanılır ve diğerleri geri dönüş seçenekleri olur.
Otomatik özetleme yapılandırılmış `summaryModel`'ı (veya `agents.defaults.model.primary`) kullanır,
bu nedenle özetleri etkinleştirirseniz o sağlayıcının da kimlik doğrulaması yapılmış olmalıdır.

## Hizmet bağlantıları

- [OpenAI Text-to-Speech guide](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API reference](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech output formats](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Varsayılan olarak etkin mi?

Hayır. Otomatik TTS varsayılan olarak **kapalıdır**. Bunu yapılandırmada
`messages.tts.auto` ile veya yerel olarak `/tts on` ile etkinleştirin.

`messages.tts.provider` ayarlı değilse OpenClaw, kayıt defteri otomatik seçim sırasındaki
ilk yapılandırılmış speech sağlayıcısını seçer.

## Yapılandırma

TTS yapılandırması, `openclaw.json` içinde `messages.tts` altında yaşar.
Tam şema [Gateway configuration](/tr/gateway/configuration) içinde bulunur.

### Minimal yapılandırma (etkinleştirme + sağlayıcı)

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

### Birincil OpenAI, geri dönüş olarak ElevenLabs

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

### Birincil Google Gemini

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

Google Gemini TTS, Gemini API anahtarı yolunu kullanır. Yalnızca Gemini API ile sınırlandırılmış bir Google Cloud Console API anahtarı burada geçerlidir ve paketlenmiş Google görüntü üretimi sağlayıcısının kullandığı anahtar stiliyle aynıdır. Çözümleme sırası
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY` şeklindedir.

### Birincil xAI

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "xai_api_key",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
          speed: 1.0,
        },
      },
    },
  },
}
```

xAI TTS, paketlenmiş Grok model sağlayıcısıyla aynı `XAI_API_KEY` yolunu kullanır.
Çözümleme sırası `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY` şeklindedir.
Geçerli canlı sesler `ara`, `eve`, `leo`, `rex`, `sal` ve `una`'dır; varsayılan `eve`'dir.
`language`, BCP-47 etiketi veya `auto` kabul eder.

### Microsoft speech'i devre dışı bırakın

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

### Uzun yanıtlar için otomatik özeti devre dışı bırakın

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

Sonra şunu çalıştırın:

```
/tts summary off
```

### Alanlar hakkında notlar

- `auto`: otomatik TTS modu (`off`, `always`, `inbound`, `tagged`).
  - `inbound`, yalnızca gelen bir sesli mesajdan sonra ses gönderir.
  - `tagged`, yalnızca yanıt `[[tts:key=value]]` yönergeleri veya `[[tts:text]]...[[/tts:text]]` bloğu içerdiğinde ses gönderir.
- `enabled`: eski geçiş anahtarıdır (doctor bunu `auto`'ya taşır).
- `mode`: `"final"` (varsayılan) veya `"all"` (araç/blok yanıtlarını da içerir).
- `provider`: `"elevenlabs"`, `"google"`, `"microsoft"`, `"minimax"` veya `"openai"` gibi speech sağlayıcı kimliği (geri dönüş otomatiktir).
- `provider` **ayarlı değilse**, OpenClaw kayıt defteri otomatik seçim sırasındaki ilk yapılandırılmış speech sağlayıcısını kullanır.
- Eski `provider: "edge"` hâlâ çalışır ve `microsoft` olarak normalize edilir.
- `summaryModel`: otomatik özet için isteğe bağlı ucuz model; varsayılan `agents.defaults.model.primary`.
  - `provider/model` veya yapılandırılmış model takma adı kabul eder.
- `modelOverrides`: modelin TTS yönergeleri üretmesine izin verir (varsayılan olarak açık).
  - `allowProvider` varsayılan olarak `false` olur (sağlayıcı değiştirme isteğe bağlı dahil olunur).
- `providers.<id>`: speech sağlayıcı kimliğine göre anahtarlanmış sağlayıcıya ait ayarlar.
- Eski doğrudan sağlayıcı blokları (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) yükleme sırasında otomatik olarak `messages.tts.providers.<id>` altına taşınır.
- `maxTextLength`: TTS girdisi için katı üst sınır (karakter). Aşılırsa `/tts audio` başarısız olur.
- `timeoutMs`: istek zaman aşımı (ms).
- `prefsPath`: yerel prefs JSON yolunu geçersiz kılar (sağlayıcı/sınır/özet).
- `apiKey` değerleri ortam değişkenlerine geri döner (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl`: ElevenLabs API base URL'sini geçersiz kılar.
- `providers.openai.baseUrl`: OpenAI TTS uç noktasını geçersiz kılar.
  - Çözümleme sırası: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Varsayılan olmayan değerler OpenAI uyumlu TTS uç noktaları olarak değerlendirilir; bu yüzden özel model ve ses adları kabul edilir.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = normal)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2 harfli ISO 639-1 (ör. `en`, `de`)
- `providers.elevenlabs.seed`: tam sayı `0..4294967295` (en iyi çabayla determinizm)
- `providers.minimax.baseUrl`: MiniMax API base URL'sini geçersiz kılar (varsayılan `https://api.minimax.io`, ortam: `MINIMAX_API_HOST`).
- `providers.minimax.model`: TTS modeli (varsayılan `speech-2.8-hd`, ortam: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: ses tanımlayıcısı (varsayılan `English_expressive_narrator`, ortam: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: oynatma hızı `0.5..2.0` (varsayılan 1.0).
- `providers.minimax.vol`: ses seviyesi `(0, 10]` (varsayılan 1.0; 0'dan büyük olmalıdır).
- `providers.minimax.pitch`: perde kaydırması `-12..12` (varsayılan 0).
- `providers.google.model`: Gemini TTS modeli (varsayılan `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: Gemini hazır ses adı (varsayılan `Kore`; `voice` da kabul edilir).
- `providers.google.baseUrl`: Gemini API base URL'sini geçersiz kılar. Yalnızca `https://generativelanguage.googleapis.com` kabul edilir.
  - `messages.tts.providers.google.apiKey` atlanırsa, TTS ortam geri dönüşünden önce `models.providers.google.apiKey` değerini yeniden kullanabilir.
- `providers.xai.apiKey`: xAI TTS API anahtarı (ortam: `XAI_API_KEY`).
- `providers.xai.baseUrl`: xAI TTS base URL'sini geçersiz kılar (varsayılan `https://api.x.ai/v1`, ortam: `XAI_BASE_URL`).
- `providers.xai.voiceId`: xAI ses kimliği (varsayılan `eve`; geçerli canlı sesler: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: BCP-47 dil kodu veya `auto` (varsayılan `en`).
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw` veya `alaw` (varsayılan `mp3`).
- `providers.xai.speed`: sağlayıcıya özgü hız geçersiz kılması.
- `providers.microsoft.enabled`: Microsoft speech kullanımına izin verir (varsayılan `true`; API anahtarı yok).
- `providers.microsoft.voice`: Microsoft nöral ses adı (ör. `en-US-MichelleNeural`).
- `providers.microsoft.lang`: dil kodu (ör. `en-US`).
- `providers.microsoft.outputFormat`: Microsoft çıktı biçimi (ör. `audio-24khz-48kbitrate-mono-mp3`).
  - Geçerli değerler için Microsoft Speech çıktı biçimlerine bakın; tüm biçimler paketlenmiş Edge destekli taşıma tarafından desteklenmez.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: yüzde dizeleri (ör. `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: ses dosyasının yanında JSON altyazı yazar.
- `providers.microsoft.proxy`: Microsoft speech istekleri için proxy URL'si.
- `providers.microsoft.timeoutMs`: istek zaman aşımı geçersiz kılması (ms).
- `edge.*`: aynı Microsoft ayarları için eski takma addır.

## Model güdümlü geçersiz kılmalar (varsayılan olarak açık)

Varsayılan olarak model, tek bir yanıt için TTS yönergeleri üretebilir.
`messages.tts.auto` değeri `tagged` olduğunda, sesi tetiklemek için bu yönergeler gereklidir.

Etkinleştirildiğinde model, tek bir yanıt için sesi
geçersiz kılmak üzere `[[tts:...]]` yönergeleri ve ayrıca yalnızca
seste görünmesi gereken ifade etiketlerini (kahkaha, şarkı ipuçları vb.) sağlamak için isteğe bağlı bir `[[tts:text]]...[[/tts:text]]` bloğu üretebilir.

`provider=...` yönergeleri, `modelOverrides.allowProvider: true` olmadıkça yok sayılır.

Örnek yanıt yükü:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Kullanılabilir yönerge anahtarları (etkin olduğunda):

- `provider` (kayıtlı speech sağlayıcı kimliği; örneğin `openai`, `elevenlabs`, `google`, `minimax` veya `microsoft`; `allowProvider: true` gerektirir)
- `voice` (OpenAI sesi), `voiceName` / `voice_name` / `google_voice` (Google sesi) veya `voiceId` (ElevenLabs / MiniMax / xAI)
- `model` (OpenAI TTS modeli, ElevenLabs model kimliği veya MiniMax modeli) veya `google_model` (Google TTS modeli)
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

Slash komutları yerel geçersiz kılmaları `prefsPath` içine yazar (varsayılan:
`~/.openclaw/settings/tts.json`, `OPENCLAW_TTS_PREFS` veya
`messages.tts.prefsPath` ile geçersiz kılınabilir).

Saklanan alanlar:

- `enabled`
- `provider`
- `maxLength` (özet eşiği; varsayılan 1500 karakter)
- `summarize` (varsayılan `true`)

Bunlar, o host için `messages.tts.*` değerlerini geçersiz kılar.

## Çıktı biçimleri (sabit)

- **Feishu / Matrix / Telegram / WhatsApp**: Opus sesli mesajı (`opus_48000_64` ElevenLabs'ten, `opus` OpenAI'dan).
  - 48kHz / 64kbps, sesli mesaj için iyi bir denge noktasıdır.
- **Diğer kanallar**: MP3 (`mp3_44100_128` ElevenLabs'ten, `mp3` OpenAI'dan).
  - 44.1kHz / 128kbps, konuşma netliği için varsayılan dengedir.
- **MiniMax**: MP3 (`speech-2.8-hd` modeli, 32kHz örnekleme oranı). Ses notu biçimi doğal olarak desteklenmez; garantili Opus sesli mesajları için OpenAI veya ElevenLabs kullanın.
- **Google Gemini**: Gemini API TTS ham 24kHz PCM döndürür. OpenClaw bunu ses ekleri için WAV olarak sarar ve Talk/telefoni için PCM'i doğrudan döndürür. Doğal Opus ses notu biçimi bu yol tarafından desteklenmez.
- **xAI**: Varsayılan olarak MP3; `responseFormat` `mp3`, `wav`, `pcm`, `mulaw` veya `alaw` olabilir. OpenClaw, xAI'nin toplu REST TTS uç noktasını kullanır ve tam bir ses eki döndürür; xAI'nin akışlı TTS WebSocket'i bu sağlayıcı yolunda kullanılmaz. Doğal Opus ses notu biçimi bu yol tarafından desteklenmez.
- **Microsoft**: `microsoft.outputFormat` kullanır (varsayılan `audio-24khz-48kbitrate-mono-mp3`).
  - Paketlenmiş taşıma bir `outputFormat` kabul eder, ancak tüm biçimler hizmette mevcut değildir.
  - Çıktı biçimi değerleri Microsoft Speech çıktı biçimlerini izler (Ogg/WebM Opus dahil).
  - Telegram `sendVoice`, OGG/MP3/M4A kabul eder; garantili Opus sesli mesajları gerekiyorsa OpenAI/ElevenLabs kullanın.
  - Yapılandırılmış Microsoft çıktı biçimi başarısız olursa OpenClaw MP3 ile yeniden dener.

OpenAI/ElevenLabs çıktı biçimleri kanal başına sabittir (yukarıya bakın).

## Otomatik TTS davranışı

Etkinleştirildiğinde OpenClaw:

- Yanıt zaten medya veya bir `MEDIA:` yönergesi içeriyorsa TTS'yi atlar.
- Çok kısa yanıtları atlar (< 10 karakter).
- Etkin olduğunda uzun yanıtları `agents.defaults.model.primary` (veya `summaryModel`) kullanarak özetler.
- Üretilen sesi yanıta ekler.

Yanıt `maxLength` değerini aşarsa ve özet kapalıysa (veya
özet modeli için API anahtarı yoksa), ses
atlanır ve normal metin yanıtı gönderilir.

## Akış diyagramı

```
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize (summaryModel or agents.defaults.model.primary)
                                      -> TTS -> attach audio
```

## Slash komut kullanımı

Tek bir komut vardır: `/tts`.
Etkinleştirme ayrıntıları için bkz. [Slash commands](/tr/tools/slash-commands).

Discord notu: `/tts`, Discord'un yerleşik bir komutudur; bu yüzden OpenClaw
orada yerel komut olarak `/voice` kaydeder. Metin `/tts ...` yine de çalışır.

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

- Komutlar yetkili bir gönderen gerektirir (izin listesi/sahip kuralları yine de geçerlidir).
- `commands.text` veya yerel komut kaydı etkin olmalıdır.
- Yapılandırma `messages.tts.auto`, `off|always|inbound|tagged` kabul eder.
- `/tts on`, yerel TTS tercihini `always` olarak yazar; `/tts off` bunu `off` olarak yazar.
- `inbound` veya `tagged` varsayılanları istediğinizde yapılandırmayı kullanın.
- `limit` ve `summary`, ana yapılandırmada değil yerel prefs içinde saklanır.
- `/tts audio`, tek seferlik bir sesli yanıt üretir (TTS'yi açmaz).
- `/tts status`, en son deneme için geri dönüş görünürlüğünü içerir:
  - başarılı geri dönüş: `Fallback: <primary> -> <used>` artı `Attempts: ...`
  - başarısızlık: `Error: ...` artı `Attempts: ...`
  - ayrıntılı tanılar: `Attempt details: provider:outcome(reasonCode) latency`
- OpenAI ve ElevenLabs API hataları artık ayrıştırılmış sağlayıcı hata ayrıntısını ve istek kimliğini (sağlayıcı döndürdüğünde) içerir; bu bilgi TTS hataları/kayıtlarında gösterilir.

## Aracı aracı

`tts` aracı, metni konuşmaya dönüştürür ve
yanıt teslimi için bir ses eki döndürür. Kanal Feishu, Matrix, Telegram veya WhatsApp olduğunda,
ses bir dosya eki yerine sesli mesaj olarak teslim edilir.
İsteğe bağlı `channel` ve `timeoutMs` alanlarını kabul eder; `timeoutMs`,
çağrı başına sağlayıcı istek zaman aşımıdır ve milisaniye cinsindendir.

## Gateway RPC

Gateway yöntemleri:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

## İlgili

- [Medya genel bakışı](/tr/tools/media-overview)
- [Müzik üretimi](/tr/tools/music-generation)
- [Video üretimi](/tr/tools/video-generation)

---
read_when:
    - OpenClaw'da Grok modellerini kullanmak istiyorsunuz
    - xAI kimlik doğrulamasını veya model kimliklerini yapılandırıyorsunuz
summary: OpenClaw'da xAI Grok modellerini kullanın
title: xAI
x-i18n:
    generated_at: "2026-05-02T09:04:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f36b597fd5c47b61724080deb0d545bca024aca17744fc8aa6a0eb4872d12d2
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw, Grok modelleri için birlikte gelen bir `xai` sağlayıcı Plugin'iyle sunulur.

## Başlarken

<Steps>
  <Step title="API anahtarı oluşturun">
    [xAI konsolunda](https://console.x.ai/) bir API anahtarı oluşturun.
  </Step>
  <Step title="API anahtarınızı ayarlayın">
    `XAI_API_KEY` değerini ayarlayın veya şunu çalıştırın:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="Bir model seçin">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw, birlikte gelen xAI aktarımı olarak xAI Responses API'yi kullanır. Aynı
`XAI_API_KEY`, Grok destekli `web_search`, birinci sınıf `x_search`
ve uzaktan `code_execution` özelliklerini de çalıştırabilir.
Bir xAI anahtarını `plugins.entries.xai.config.webSearch.apiKey` altında saklarsanız,
birlikte gelen xAI model sağlayıcısı bu anahtarı yedek olarak da yeniden kullanır.
Grok `web_search` ve varsayılan olarak `x_search` özelliklerini bir operatör xAI Responses proxy'si
üzerinden yönlendirmek için `plugins.entries.xai.config.webSearch.baseUrl` değerini ayarlayın.
`code_execution` ayarları `plugins.entries.xai.config.codeExecution` altında bulunur.
</Note>

## Yerleşik katalog

OpenClaw, bu xAI model ailelerini hazır olarak içerir:

| Aile           | Model kimlikleri                                                         |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

Plugin, aynı API şeklini izlediklerinde daha yeni `grok-4*` ve
`grok-code-fast*` kimliklerini de ileriye dönük olarak çözümler.

<Tip>
`grok-4.3`, `grok-4-fast`, `grok-4-1-fast` ve `grok-4.20-beta-*`
varyantları, birlikte gelen katalogdaki güncel görüntü destekli Grok referanslarıdır.
</Tip>

## OpenClaw özellik kapsamı

Birlikte gelen Plugin, xAI'nin güncel herkese açık API yüzeyini OpenClaw'ın ortak
sağlayıcı ve araç sözleşmeleriyle eşler. Ortak sözleşmeye uymayan özellikler
(örneğin akışlı TTS ve gerçek zamanlı ses) sunulmaz — aşağıdaki tabloya bakın.

| xAI yeteneği               | OpenClaw yüzeyi                          | Durum                                                               |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Sohbet / Responses         | `xai/<model>` model sağlayıcısı           | Evet                                                                |
| Sunucu tarafı web araması  | `web_search` sağlayıcısı `grok`           | Evet                                                                |
| Sunucu tarafı X araması    | `x_search` aracı                          | Evet                                                                |
| Sunucu tarafı kod yürütme  | `code_execution` aracı                    | Evet                                                                |
| Görüntüler                 | `image_generate`                          | Evet                                                                |
| Videolar                   | `video_generate`                          | Evet                                                                |
| Toplu metinden sese        | `messages.tts.provider: "xai"` / `tts`    | Evet                                                                |
| Akışlı TTS                 | —                                         | Sunulmaz; OpenClaw'ın TTS sözleşmesi eksiksiz ses arabellekleri döndürür |
| Toplu konuşmadan metne     | `tools.media.audio` / medya anlama        | Evet                                                                |
| Akışlı konuşmadan metne    | Voice Call `streaming.provider: "xai"`    | Evet                                                                |
| Gerçek zamanlı ses         | —                                         | Henüz sunulmaz; farklı oturum/WebSocket sözleşmesi                  |
| Dosyalar / toplu işler     | Yalnızca genel model API uyumluluğu       | Birinci sınıf bir OpenClaw aracı değil                              |

<Note>
OpenClaw; medya üretimi, konuşma ve toplu transkripsiyon için xAI'nin REST
görüntü/video/TTS/STT API'lerini, canlı sesli arama transkripsiyonu için xAI'nin
akışlı STT WebSocket'ini, model, arama ve kod yürütme araçları için de Responses
API'yi kullanır. Gerçek zamanlı ses oturumları gibi farklı OpenClaw sözleşmeleri
gerektiren özellikler burada gizli Plugin davranışı yerine upstream yetenekler
olarak belgelenir.
</Note>

### Hızlı mod eşlemeleri

`/fast on` veya `agents.defaults.models["xai/<model>"].params.fastMode: true`
yerel xAI isteklerini şu şekilde yeniden yazar:

| Kaynak model  | Hızlı mod hedefi |
| ------------- | ---------------- |
| `grok-3`      | `grok-3-fast`    |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`    |
| `grok-4-0709` | `grok-4-fast`    |

### Eski uyumluluk takma adları

Eski takma adlar hâlâ kurallı birlikte gelen kimliklere normalleştirilir:

| Eski takma ad             | Kurallı kimlik                       |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Özellikler

<AccordionGroup>
  <Accordion title="Web araması">
    Birlikte gelen `grok` web arama sağlayıcısı da `XAI_API_KEY` kullanır:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Video üretimi">
    Birlikte gelen `xai` Plugin'i, paylaşılan `video_generate` aracı üzerinden
    video üretimini kaydeder.

    - Varsayılan video modeli: `xai/grok-imagine-video`
    - Modlar: metinden videoya, görüntüden videoya, referans görüntü üretimi, uzaktan
      video düzenleme ve uzaktan video uzatma
    - En boy oranları: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Çözünürlükler: `480P`, `720P`
    - Süre: üretim/görüntüden videoya için 1-15 saniye, `reference_image` rolleri
      kullanıldığında 1-10 saniye, uzatma için 2-10 saniye
    - Referans görüntü üretimi: sağlanan her görüntü için `imageRoles` değerini
      `reference_image` olarak ayarlayın; xAI bu tür en fazla 7 görüntü kabul eder

    <Warning>
    Yerel video arabellekleri kabul edilmez. Video düzenleme/uzatma girdileri için
    uzaktan `http(s)` URL'leri kullanın. Görüntüden videoya yerel görüntü arabelleklerini kabul eder çünkü
    OpenClaw bunları xAI için veri URL'leri olarak kodlayabilir.
    </Warning>

    xAI'yi varsayılan video sağlayıcısı olarak kullanmak için:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için
    [Video Generation](/tr/tools/video-generation) bölümüne bakın.
    </Note>

  </Accordion>

  <Accordion title="Görüntü üretimi">
    Birlikte gelen `xai` Plugin'i, paylaşılan `image_generate` aracı üzerinden
    görüntü üretimini kaydeder.

    - Varsayılan görüntü modeli: `xai/grok-imagine-image`
    - Ek model: `xai/grok-imagine-image-pro`
    - Modlar: metinden görüntüye ve referans görüntü düzenleme
    - Referans girdileri: bir `image` veya en fazla beş `images`
    - En boy oranları: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Çözünürlükler: `1K`, `2K`
    - Sayı: en fazla 4 görüntü

    OpenClaw, üretilen medyanın normal kanal eki yolu üzerinden saklanıp
    teslim edilebilmesi için xAI'den `b64_json` görüntü yanıtları ister. Yerel
    referans görüntüleri veri URL'lerine dönüştürülür; uzaktan `http(s)` referansları
    olduğu gibi geçirilir.

    xAI'yi varsayılan görüntü sağlayıcısı olarak kullanmak için:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    xAI ayrıca `quality`, `mask`, `user` ve `1:2`, `2:1`, `9:20`, `20:9`
    gibi ek yerel oranları belgeler. OpenClaw bugün yalnızca paylaşılan
    sağlayıcılar arası görüntü kontrollerini iletir; desteklenmeyen yalnızca yerel ayarlar
    bilinçli olarak `image_generate` üzerinden sunulmaz.
    </Note>

  </Accordion>

  <Accordion title="Metinden sese">
    Birlikte gelen `xai` Plugin'i, paylaşılan `tts` sağlayıcı yüzeyi üzerinden
    metinden sese özelliğini kaydeder.

    - Sesler: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Varsayılan ses: `eve`
    - Biçimler: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Dil: BCP-47 kodu veya `auto`
    - Hız: sağlayıcıya özgü hız geçersiz kılması
    - Yerel Opus sesli not biçimi desteklenmez

    xAI'yi varsayılan TTS sağlayıcısı olarak kullanmak için:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw, xAI'nin toplu `/v1/tts` uç noktasını kullanır. xAI, WebSocket
    üzerinden akışlı TTS de sunar, ancak OpenClaw konuşma sağlayıcısı sözleşmesi
    şu anda yanıt tesliminden önce eksiksiz bir ses arabelleği bekler.
    </Note>

  </Accordion>

  <Accordion title="Konuşmadan metne">
    Birlikte gelen `xai` Plugin'i, OpenClaw'ın medya anlama transkripsiyon yüzeyi
    üzerinden toplu konuşmadan metne özelliğini kaydeder.

    - Varsayılan model: `grok-stt`
    - Uç nokta: xAI REST `/v1/stt`
    - Girdi yolu: çok parçalı ses dosyası yükleme
    - OpenClaw tarafından, Discord ses kanalı segmentleri ve kanal ses ekleri dahil
      gelen ses transkripsiyonunun `tools.media.audio` kullandığı her yerde desteklenir

    Gelen ses transkripsiyonu için xAI'yi zorlamak üzere:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    Dil, paylaşılan ses medyası yapılandırması veya çağrı başına transkripsiyon isteği
    üzerinden sağlanabilir. Prompt ipuçları paylaşılan OpenClaw yüzeyi tarafından
    kabul edilir, ancak xAI REST STT entegrasyonu yalnızca dosya, model ve dili
    iletir çünkü bunlar mevcut herkese açık xAI uç noktasıyla temiz biçimde eşleşir.

  </Accordion>

  <Accordion title="Akışlı konuşmadan metne">
    Birlikte gelen `xai` Plugin'i, canlı sesli arama sesi için gerçek zamanlı
    bir transkripsiyon sağlayıcısını da kaydeder.

    - Uç nokta: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Varsayılan kodlama: `mulaw`
    - Varsayılan örnekleme hızı: `8000`
    - Varsayılan uç belirleme: `800ms`
    - Ara transkriptler: varsayılan olarak etkin

    Voice Call'un Twilio medya akışı G.711 µ-law ses kareleri gönderir, bu nedenle
    xAI sağlayıcısı bu kareleri yeniden kodlama yapmadan doğrudan iletebilir:

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    Sağlayıcıya ait yapılandırma
    `plugins.entries.voice-call.config.streaming.providers.xai` altında bulunur. Desteklenen
    anahtarlar `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` veya
    `alaw`), `interimResults`, `endpointingMs` ve `language` değerleridir.

    <Note>
    Bu akış sağlayıcısı, Voice Call'ın gerçek zamanlı transkripsiyon yolu içindir.
    Discord voice şu anda kısa segmentler kaydeder ve bunun yerine toplu
    `tools.media.audio` transkripsiyon yolunu kullanır.
    </Note>

  </Accordion>

  <Accordion title="x_search yapılandırması">
    Birlikte gelen xAI Plugin, X (eski adıyla Twitter) içeriğini Grok
    üzerinden aramak için `x_search` öğesini bir OpenClaw aracı olarak sunar.

    Yapılandırma yolu: `plugins.entries.xai.config.xSearch`

    | Anahtar            | Tür     | Varsayılan         | Açıklama                              |
    | ------------------ | ------- | ------------------ | ------------------------------------- |
    | `enabled`          | boolean | —                  | x_search öğesini etkinleştir veya devre dışı bırak |
    | `model`            | string  | `grok-4-1-fast`    | x_search istekleri için kullanılan model |
    | `baseUrl`          | string  | —                  | xAI Responses temel URL geçersiz kılması |
    | `inlineCitations`  | boolean | —                  | Sonuçlara satır içi alıntıları dahil et |
    | `maxTurns`         | number  | —                  | Maksimum konuşma turu                 |
    | `timeoutSeconds`   | number  | —                  | Saniye cinsinden istek zaman aşımı    |
    | `cacheTtlMinutes`  | number  | —                  | Dakika cinsinden önbellek yaşam süresi |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                baseUrl: "https://api.x.ai/v1",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Kod yürütme yapılandırması">
    Birlikte gelen xAI Plugin, xAI'in sandbox ortamında uzaktan kod yürütme
    için `code_execution` öğesini bir OpenClaw aracı olarak sunar.

    Yapılandırma yolu: `plugins.entries.xai.config.codeExecution`

    | Anahtar           | Tür     | Varsayılan         | Açıklama                              |
    | ----------------- | ------- | ------------------ | ------------------------------------- |
    | `enabled`         | boolean | `true` (anahtar varsa) | Kod yürütmeyi etkinleştir veya devre dışı bırak |
    | `model`           | string  | `grok-4-1-fast`    | Kod yürütme istekleri için kullanılan model |
    | `maxTurns`        | number  | —                  | Maksimum konuşma turu                 |
    | `timeoutSeconds`  | number  | —                  | Saniye cinsinden istek zaman aşımı    |

    <Note>
    Bu, yerel [`exec`](/tr/tools/exec) değil, uzaktan xAI sandbox yürütmesidir.
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Bilinen sınırlar">
    - Kimlik doğrulama bugün yalnızca API anahtarıyladır. OpenClaw'da henüz
      xAI OAuth veya cihaz kodu akışı yoktur.
    - `grok-4.20-multi-agent-experimental-beta-0304`, standart OpenClaw xAI
      aktarımından farklı bir üst API yüzeyi gerektirdiği için normal xAI
      sağlayıcı yolunda desteklenmez.
    - xAI Realtime voice henüz bir OpenClaw sağlayıcısı olarak kaydedilmemiştir.
      Toplu STT veya akış transkripsiyonundan farklı bir çift yönlü voice oturumu
      sözleşmesine ihtiyaç duyar.
    - xAI görüntü `quality`, görüntü `mask` ve yalnızca yerel olan ek en boy
      oranları, paylaşılan `image_generate` aracı karşılık gelen sağlayıcılar
      arası denetimlere sahip olana kadar sunulmaz.
  </Accordion>

  <Accordion title="Gelişmiş notlar">
    - OpenClaw, paylaşılan çalıştırıcı yolunda xAI'e özgü araç şeması ve araç
      çağrısı uyumluluk düzeltmelerini otomatik olarak uygular.
    - Yerel xAI istekleri varsayılan olarak `tool_stream: true` kullanır. Bunu
      devre dışı bırakmak için `agents.defaults.models["xai/<model>"].params.tool_stream`
      değerini `false` olarak ayarlayın.
    - Birlikte gelen xAI sarmalayıcısı, yerel xAI isteklerini göndermeden önce
      desteklenmeyen katı araç şeması bayraklarını ve reasoning payload
      anahtarlarını kaldırır.
    - `web_search`, `x_search` ve `code_execution`, OpenClaw araçları olarak
      sunulur. OpenClaw, her sohbet turuna tüm yerel araçları eklemek yerine her
      araç isteği içinde ihtiyaç duyduğu belirli xAI yerleşik özelliğini
      etkinleştirir.
    - Grok `web_search`, `plugins.entries.xai.config.webSearch.baseUrl` değerini
      okur. `x_search`, `plugins.entries.xai.config.xSearch.baseUrl` değerini
      okur, ardından Grok web araması temel URL'sine geri döner.
    - `x_search` ve `code_execution`, çekirdek model çalışma zamanına sabit
      kodlanmak yerine birlikte gelen xAI Plugin tarafından sahiplenilir.
    - `code_execution`, yerel [`exec`](/tr/tools/exec) değil, uzaktan xAI sandbox
      yürütmesidir.
  </Accordion>
</AccordionGroup>

## Canlı test

xAI medya yolları birim testleri ve isteğe bağlı canlı paketler tarafından
kapsanır. Canlı komutlar, `XAI_API_KEY` yoklamadan önce `~/.profile` dahil
oturum açma kabuğunuzdan gizli değerleri yükler.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Sağlayıcıya özgü canlı dosya normal TTS, telefon dostu PCM TTS sentezler, xAI
toplu STT üzerinden sesi yazıya döker, aynı PCM'yi xAI gerçek zamanlı STT
üzerinden akıtır, metinden görüntü çıktısı oluşturur ve bir referans görüntüyü
düzenler. Paylaşılan görüntü canlı dosyası aynı xAI sağlayıcısını OpenClaw'ın
çalışma zamanı seçimi, geri dönüş, normalleştirme ve medya eki yolu üzerinden
doğrular.

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Video üretimi" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Tüm sağlayıcılar" href="/tr/providers/index" icon="grid-2">
    Daha geniş sağlayıcı genel bakışı.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve düzeltmeler.
  </Card>
</CardGroup>

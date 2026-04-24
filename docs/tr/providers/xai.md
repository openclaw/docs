---
read_when:
    - OpenClaw'da Grok modellerini kullanmak istiyorsunuz
    - xAI auth'unu veya model kimliklerini yapılandırıyorsunuz
summary: OpenClaw'da xAI Grok modellerini kullanın
title: xAI
x-i18n:
    generated_at: "2026-04-24T09:28:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf125767e3123d6fbf000825323dc736712feea65582c1db9f7ffccc2bc20bb4
    source_path: providers/xai.md
    workflow: 15
---

OpenClaw, Grok modelleri için paketlenmiş bir `xai` sağlayıcı Plugin'i ile gelir.

## Başlangıç

<Steps>
  <Step title="Bir API anahtarı oluşturun">
    [xAI konsolunda](https://console.x.ai/) bir API anahtarı oluşturun.
  </Step>
  <Step title="API anahtarınızı ayarlayın">
    `XAI_API_KEY` ayarlayın veya şunu çalıştırın:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="Bir model seçin">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw, paketlenmiş xAI taşıması olarak xAI Responses API'yi kullanır. Aynı
`XAI_API_KEY`, Grok destekli `web_search`, birinci sınıf `x_search`
ve uzak `code_execution` için de kullanılabilir.
Bir xAI anahtarını `plugins.entries.xai.config.webSearch.apiKey` altında saklarsanız,
paketlenmiş xAI model sağlayıcısı bu anahtarı fallback olarak da yeniden kullanır.
`code_execution` ayarları `plugins.entries.xai.config.codeExecution` altında bulunur.
</Note>

## Yerleşik katalog

OpenClaw, kutudan çıktığı gibi şu xAI model ailelerini içerir:

| Aile             | Model kimlikleri                                                          |
| ---------------- | ------------------------------------------------------------------------- |
| Grok 3           | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`                |
| Grok 4           | `grok-4`, `grok-4-0709`                                                   |
| Grok 4 Fast      | `grok-4-fast`, `grok-4-fast-non-reasoning`                                |
| Grok 4.1 Fast    | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                            |
| Grok 4.20 Beta   | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning`  |
| Grok Code        | `grok-code-fast-1`                                                        |

Plugin ayrıca aynı API biçimini izleyen daha yeni `grok-4*` ve `grok-code-fast*` kimliklerini de ileri çözümleme ile destekler.

<Tip>
`grok-4-fast`, `grok-4-1-fast` ve `grok-4.20-beta-*` varyantları,
paketlenmiş katalogdaki güncel görsel destekli Grok ref'leridir.
</Tip>

## OpenClaw özellik kapsamı

Paketlenmiş Plugin, xAI'ın geçerli genel API yüzeyini OpenClaw'ın paylaşılan
sağlayıcı ve araç sözleşmelerine eşler. Paylaşılan sözleşmeye uymayan
yetenekler (örneğin akış TTS ve gerçek zamanlı ses) açığa çıkarılmaz — aşağıdaki
tabloya bakın.

| xAI yeteneği               | OpenClaw yüzeyi                           | Durum                                                               |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Sohbet / Responses         | `xai/<model>` model sağlayıcısı           | Evet                                                                |
| Sunucu tarafı web araması  | `web_search` sağlayıcısı `grok`           | Evet                                                                |
| Sunucu tarafı X araması    | `x_search` aracı                          | Evet                                                                |
| Sunucu tarafı kod yürütme  | `code_execution` aracı                    | Evet                                                                |
| Görseller                  | `image_generate`                          | Evet                                                                |
| Videolar                   | `video_generate`                          | Evet                                                                |
| Toplu metinden sese        | `messages.tts.provider: "xai"` / `tts`    | Evet                                                                |
| Akış TTS                   | —                                         | Açığa çıkarılmıyor; OpenClaw'ın TTS sözleşmesi tam ses tamponları döndürür |
| Toplu konuşmadan metne     | `tools.media.audio` / medya anlama        | Evet                                                                |
| Akış konuşmadan metne      | Voice Call `streaming.provider: "xai"`    | Evet                                                                |
| Gerçek zamanlı ses         | —                                         | Henüz açığa çıkarılmadı; farklı oturum/WebSocket sözleşmesi         |
| Dosyalar / toplu işler     | Yalnızca genel model API uyumluluğu       | Birinci sınıf bir OpenClaw aracı değil                              |

<Note>
OpenClaw; medya üretimi, konuşma ve toplu transkripsiyon için xAI'ın REST görsel/video/TTS/STT API'lerini, canlı
voice-call transkripsiyonu için xAI'ın akış STT WebSocket'ini ve model, arama ve
kod yürütme araçları için Responses API'yi kullanır. Gerçek zamanlı ses oturumları gibi
farklı OpenClaw sözleşmeleri gerektiren özellikler, gizli Plugin davranışı yerine burada yukarı akış yetenekleri olarak belgelenir.
</Note>

### Hızlı mod eşlemeleri

`/fast on` veya `agents.defaults.models["xai/<model>"].params.fastMode: true`
yerel xAI isteklerini şu şekilde yeniden yazar:

| Kaynak model   | Hızlı mod hedefi   |
| -------------- | ------------------ |
| `grok-3`       | `grok-3-fast`      |
| `grok-3-mini`  | `grok-3-mini-fast` |
| `grok-4`       | `grok-4-fast`      |
| `grok-4-0709`  | `grok-4-fast`      |

### Legacy uyumluluk takma adları

Legacy takma adlar hâlâ kanonik paketlenmiş kimliklere normalize edilir:

| Legacy takma ad           | Kanonik kimlik                        |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Özellikler

<AccordionGroup>
  <Accordion title="Web araması">
    Paketlenmiş `grok` web arama sağlayıcısı da `XAI_API_KEY` kullanır:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Video üretimi">
    Paketlenmiş `xai` Plugin'i, paylaşılan
    `video_generate` aracı üzerinden video üretimini kaydeder.

    - Varsayılan video modeli: `xai/grok-imagine-video`
    - Modlar: metinden videoya, görselden videoya, uzak video düzenleme ve uzak video
      uzatma
    - En-boy oranları: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Çözünürlükler: `480P`, `720P`
    - Süre: üretim/görselden videoya için 1-15 saniye, uzatma için 2-10 saniye

    <Warning>
    Yerel video tamponları kabul edilmez. Video
    düzenleme/uzatma girdileri için uzak `http(s)` URL'leri kullanın. Görselden videoya akışı yerel görsel tamponlarını kabul eder; çünkü
    OpenClaw bunları xAI için data URL olarak kodlayabilir.
    </Warning>

    xAI'ı varsayılan video sağlayıcısı olarak kullanmak için:

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
    Paylaşılan araç parametreleri,
    sağlayıcı seçimi ve failover davranışı için [Video Üretimi](/tr/tools/video-generation) bölümüne bakın.
    </Note>

  </Accordion>

  <Accordion title="Görsel üretimi">
    Paketlenmiş `xai` Plugin'i, paylaşılan
    `image_generate` aracı üzerinden görsel üretimini kaydeder.

    - Varsayılan görsel modeli: `xai/grok-imagine-image`
    - Ek model: `xai/grok-imagine-image-pro`
    - Modlar: metinden görsele ve referans görsel düzenleme
    - Referans girdileri: bir `image` veya en fazla beş `images`
    - En-boy oranları: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Çözünürlükler: `1K`, `2K`
    - Adet: en fazla 4 görsel

    OpenClaw, üretilen medyanın
    normal kanal ek yolu üzerinden saklanıp teslim edilebilmesi için xAI'dan `b64_json` görsel yanıtları ister. Yerel
    referans görseller data URL'lere dönüştürülür; uzak `http(s)` referansları
    aynen geçirilir.

    xAI'ı varsayılan görsel sağlayıcısı olarak kullanmak için:

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
    xAI ayrıca `quality`, `mask`, `user` ve
    `1:2`, `2:1`, `9:20`, `20:9` gibi ek yerel oranlar da belgeliyor. OpenClaw bugün yalnızca
    sağlayıcılar arası paylaşılan görsel denetimlerini iletir; desteklenmeyen yalnızca yerel düğmeler
    kasıtlı olarak `image_generate` üzerinden açığa çıkarılmaz.
    </Note>

  </Accordion>

  <Accordion title="Metinden sese">
    Paketlenmiş `xai` Plugin'i, paylaşılan `tts`
    sağlayıcı yüzeyi üzerinden metinden sese kaydeder.

    - Sesler: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Varsayılan ses: `eve`
    - Biçimler: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Dil: BCP-47 kodu veya `auto`
    - Hız: sağlayıcıya özgü hız geçersiz kılması
    - Yerel Opus sesli not biçimi desteklenmez

    xAI'ı varsayılan TTS sağlayıcısı olarak kullanmak için:

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
    OpenClaw, xAI'ın toplu `/v1/tts` uç noktasını kullanır. xAI ayrıca WebSocket
    üzerinden akış TTS de sunar, ancak OpenClaw konuşma sağlayıcısı sözleşmesi şu anda
    yanıt tesliminden önce tam bir ses tamponu bekler.
    </Note>

  </Accordion>

  <Accordion title="Konuşmadan metne">
    Paketlenmiş `xai` Plugin'i, OpenClaw'ın
    medya-anlama transkripsiyon yüzeyi üzerinden toplu konuşmadan metne kaydeder.

    - Varsayılan model: `grok-stt`
    - Uç nokta: xAI REST `/v1/stt`
    - Girdi yolu: multipart ses dosyası yükleme
    - OpenClaw içinde gelen ses transkripsiyonunun
      `tools.media.audio` kullandığı her yerde desteklenir; buna Discord ses kanalı parçaları ve
      kanal ses ekleri dahildir

    Gelen ses transkripsiyonu için xAI'ı zorlamak amacıyla:

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

    Dil, paylaşılan ses medya yapılandırması veya çağrı başına
    transkripsiyon isteği üzerinden sağlanabilir. İstem ipuçları paylaşılan OpenClaw
    yüzeyi tarafından kabul edilir, ancak xAI REST STT entegrasyonu yalnızca dosyayı, modeli ve
    dili iletir; çünkü bunlar geçerli genel xAI uç noktasına temiz şekilde eşlenir.

  </Accordion>

  <Accordion title="Akış konuşmadan metne">
    Paketlenmiş `xai` Plugin'i ayrıca
    canlı voice-call sesi için gerçek zamanlı transkripsiyon sağlayıcısı da kaydeder.

    - Uç nokta: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Varsayılan kodlama: `mulaw`
    - Varsayılan örnekleme hızı: `8000`
    - Varsayılan endpointing: `800ms`
    - Ara transkriptler: varsayılan olarak etkin

    Voice Call'ın Twilio medya akışı G.711 µ-law ses kareleri gönderir; bu yüzden
    xAI sağlayıcısı bu kareleri kod dönüştürmeden doğrudan iletebilir:

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
    `plugins.entries.voice-call.config.streaming.providers.xai` altında yaşar. Desteklenen
    anahtarlar `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` veya
    `alaw`), `interimResults`, `endpointingMs` ve `language`'dır.

    <Note>
    Bu akış sağlayıcısı, Voice Call'ın gerçek zamanlı transkripsiyon yolu içindir.
    Discord sesi şu anda kısa segmentler kaydeder ve bunun yerine toplu
    `tools.media.audio` transkripsiyon yolunu kullanır.
    </Note>

  </Accordion>

  <Accordion title="x_search yapılandırması">
    Paketlenmiş xAI Plugin'i, Grok aracılığıyla
    X (eski adıyla Twitter) içeriğinde arama yapmak için `x_search` aracını bir OpenClaw aracı olarak açığa çıkarır.

    Yapılandırma yolu: `plugins.entries.xai.config.xSearch`

    | Anahtar           | Tür     | Varsayılan         | Açıklama                            |
    | ----------------- | ------- | ------------------ | ----------------------------------- |
    | `enabled`         | boolean | —                  | x_search'ü etkinleştirir veya devre dışı bırakır |
    | `model`           | string  | `grok-4-1-fast`    | x_search istekleri için kullanılan model |
    | `inlineCitations` | boolean | —                  | Sonuçlara satır içi atıflar ekler   |
    | `maxTurns`        | number  | —                  | Azami konuşma turu sayısı           |
    | `timeoutSeconds`  | number  | —                  | İstek zaman aşımı süresi (saniye)   |
    | `cacheTtlMinutes` | number  | —                  | Önbellek yaşam süresi (dakika)      |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
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
    Paketlenmiş xAI Plugin'i, xAI'ın sandbox ortamında
    uzak kod yürütme için `code_execution` aracını bir OpenClaw aracı olarak açığa çıkarır.

    Yapılandırma yolu: `plugins.entries.xai.config.codeExecution`

    | Anahtar          | Tür     | Varsayılan                 | Açıklama                              |
    | ---------------- | ------- | -------------------------- | ------------------------------------- |
    | `enabled`        | boolean | `true` (anahtar varsa)     | Kod yürütmeyi etkinleştirir veya devre dışı bırakır |
    | `model`          | string  | `grok-4-1-fast`            | Kod yürütme isteklerinde kullanılan model |
    | `maxTurns`       | number  | —                          | Azami konuşma turu sayısı             |
    | `timeoutSeconds` | number  | —                          | İstek zaman aşımı süresi (saniye)     |

    <Note>
    Bu, yerel [`exec`](/tr/tools/exec) değil, uzak xAI sandbox yürütmesidir.
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
    - Auth bugün yalnızca API anahtarıyladır. OpenClaw'da henüz xAI OAuth veya cihaz kodu akışı yoktur.
    - `grok-4.20-multi-agent-experimental-beta-0304`, standart OpenClaw xAI taşımasından farklı bir yukarı akış API
      yüzeyi gerektirdiği için normal xAI sağlayıcı yolunda desteklenmez.
    - xAI Realtime voice henüz bir OpenClaw sağlayıcısı olarak kaydedilmemiştir. Bu özellik
      toplu STT veya akış transkripsiyonundan farklı, çift yönlü bir ses oturumu sözleşmesi gerektirir.
    - xAI görsel `quality`, görsel `mask` ve ek yalnızca yerel en-boy oranları,
      paylaşılan `image_generate` aracı karşılık gelen sağlayıcılar arası denetimlere sahip olana kadar
      açığa çıkarılmaz.
  </Accordion>

  <Accordion title="Gelişmiş notlar">
    - OpenClaw, paylaşılan çalıştırıcı yolunda xAI'ya özgü araç şeması ve araç çağrısı uyumluluk düzeltmelerini
      otomatik olarak uygular.
    - Yerel xAI istekleri varsayılan olarak `tool_stream: true` kullanır.
      Bunu devre dışı bırakmak için
      `agents.defaults.models["xai/<model>"].params.tool_stream` değerini `false` yapın.
    - Paketlenmiş xAI sarmalayıcısı, yerel xAI isteklerini göndermeden önce desteklenmeyen katı araç şeması bayraklarını ve
      reasoning payload anahtarlarını temizler.
    - `web_search`, `x_search` ve `code_execution`, OpenClaw
      araçları olarak açığa çıkarılır. OpenClaw, her sohbet turuna tüm yerel araçları eklemek yerine
      her araç isteği içinde ihtiyaç duyduğu belirli xAI yerleşik özelliğini etkinleştirir.
    - `x_search` ve `code_execution`, çekirdek model çalışma zamanına hardcode edilmek yerine
      paketlenmiş xAI Plugin'ine aittir.
    - `code_execution`, yerel
      [`exec`](/tr/tools/exec) değil, uzak xAI sandbox yürütmesidir.
  </Accordion>
</AccordionGroup>

## Canlı test

xAI medya yolları birim testleri ve isteğe bağlı canlı paketlerle kapsanır. Canlı
komutlar, `XAI_API_KEY` yoklamasından önce
`~/.profile` dahil olmak üzere giriş shell'inizden gizli bilgileri yükler.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Sağlayıcıya özgü canlı dosya normal TTS, telefon dostu PCM
TTS sentezler, sesi xAI toplu STT üzerinden transkribe eder, aynı PCM'i xAI
gerçek zamanlı STT üzerinden akıtır, metinden görsel çıktısı üretir ve bir
referans görseli düzenler. Paylaşılan görsel canlı dosyası aynı xAI sağlayıcısını OpenClaw'ın
çalışma zamanı seçimi, fallback, normalizasyon ve medya ek yolu üzerinden doğrular.

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve failover davranışını seçme.
  </Card>
  <Card title="Video üretimi" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Tüm sağlayıcılar" href="/tr/providers/index" icon="grid-2">
    Daha geniş sağlayıcı genel bakışı.
  </Card>
  <Card title="Sorun Giderme" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve çözümler.
  </Card>
</CardGroup>

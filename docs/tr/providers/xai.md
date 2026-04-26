---
read_when:
    - OpenClaw içinde Grok modellerini kullanmak istiyorsunuz
    - xAI kimlik doğrulamasını veya model kimliklerini yapılandırıyorsunuz
summary: OpenClaw içinde xAI Grok modellerini kullanın
title: xAI
x-i18n:
    generated_at: "2026-04-26T11:39:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 420f60d5e80964b926e50cf74cf414d11de1c30d3a4aa8917f1861e0d56ef5b9
    source_path: providers/xai.md
    workflow: 15
---

OpenClaw, Grok modelleri için paketlenmiş bir `xai` sağlayıcı Plugin'iyle birlikte gelir.

## Başlangıç

<Steps>
  <Step title="Bir API anahtarı oluşturun">
    [xAI console](https://console.x.ai/) içinde bir API anahtarı oluşturun.
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
Bir xAI anahtarını `plugins.entries.xai.config.webSearch.apiKey` altında depolarsanız,
paketlenmiş xAI model sağlayıcısı da bu anahtarı yedek olarak yeniden kullanır.
`code_execution` ayarları `plugins.entries.xai.config.codeExecution` altında bulunur.
</Note>

## Yerleşik katalog

OpenClaw, kutudan çıktığı haliyle şu xAI model ailelerini içerir:

| Aile          | Model kimlikleri                                                         |
| ------------- | ------------------------------------------------------------------------ |
| Grok 3        | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4        | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast   | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta| `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code     | `grok-code-fast-1`                                                       |

Plugin ayrıca aynı API biçimini izlediklerinde daha yeni `grok-4*` ve `grok-code-fast*` kimliklerini de
ileri çözümleme ile destekler.

<Tip>
`grok-4-fast`, `grok-4-1-fast` ve `grok-4.20-beta-*` varyantları,
paketlenmiş katalogdaki mevcut görüntü yetenekli Grok başvurularıdır.
</Tip>

## OpenClaw özellik kapsamı

Paketlenmiş Plugin, xAI'nin mevcut herkese açık API yüzeyini OpenClaw'ın paylaşılan
sağlayıcı ve araç sözleşmelerine eşler. Paylaşılan sözleşmeye uymayan yetenekler
(örneğin akış TTS ve gerçek zamanlı ses) açığa çıkarılmaz — aşağıdaki tabloya bakın.

| xAI yeteneği                | OpenClaw yüzeyi                          | Durum                                                               |
| --------------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| Sohbet / Responses          | `xai/<model>` model sağlayıcısı          | Evet                                                                |
| Sunucu tarafı web arama     | `web_search` sağlayıcısı `grok`          | Evet                                                                |
| Sunucu tarafı X arama       | `x_search` aracı                         | Evet                                                                |
| Sunucu tarafı kod yürütme   | `code_execution` aracı                   | Evet                                                                |
| Görseller                   | `image_generate`                         | Evet                                                                |
| Videolar                    | `video_generate`                         | Evet                                                                |
| Toplu metinden konuşmaya    | `messages.tts.provider: "xai"` / `tts`   | Evet                                                                |
| Akış TTS                    | —                                        | Açığa çıkarılmaz; OpenClaw'ın TTS sözleşmesi tam ses tamponları döndürür |
| Toplu konuşmadan metne      | `tools.media.audio` / medya anlama       | Evet                                                                |
| Akış konuşmadan metne       | Voice Call `streaming.provider: "xai"`   | Evet                                                                |
| Gerçek zamanlı ses          | —                                        | Henüz açığa çıkarılmadı; farklı oturum/WebSocket sözleşmesi         |
| Dosyalar / toplu işlemler   | Yalnızca genel model API uyumluluğu      | Birinci sınıf OpenClaw aracı değil                                  |

<Note>
OpenClaw; medya üretimi,
konuşma ve toplu yazıya döküm için xAI'nin REST görüntü/video/TTS/STT API'lerini,
canlı sesli arama yazıya dökümü için xAI'nin akış STT WebSocket'ini,
ve model, arama ve kod yürütme araçları için Responses API'yi kullanır. Gerçek zamanlı ses oturumları gibi
farklı OpenClaw sözleşmeleri gerektiren özellikler,
gizli Plugin davranışı olarak değil, burada üst akış yetenekleri olarak belgelenir.
</Note>

### Hızlı mod eşlemeleri

`/fast on` veya `agents.defaults.models["xai/<model>"].params.fastMode: true`
yerel xAI isteklerini şu şekilde yeniden yazar:

| Kaynak model  | Hızlı mod hedefi  |
| ------------- | ----------------- |
| `grok-3`      | `grok-3-fast`     |
| `grok-3-mini` | `grok-3-mini-fast`|
| `grok-4`      | `grok-4-fast`     |
| `grok-4-0709` | `grok-4-fast`     |

### Eski uyumluluk takma adları

Eski takma adlar hâlâ kanonik paketlenmiş kimliklere normalize edilir:

| Eski takma ad             | Kanonik kimlik                        |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Özellikler

<AccordionGroup>
  <Accordion title="Web arama">
    Paketlenmiş `grok` web arama sağlayıcısı da `XAI_API_KEY` kullanır:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Video üretimi">
    Paketlenmiş `xai` Plugin'i, paylaşılan
    `video_generate` aracı üzerinden video üretimini kaydeder.

    - Varsayılan video modeli: `xai/grok-imagine-video`
    - Modlar: metinden videoya, görüntüden videoya, referans görüntü üretimi, uzak
      video düzenleme ve uzak video uzatma
    - En-boy oranları: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Çözünürlükler: `480P`, `720P`
    - Süre: üretim/görüntüden videoya için 1-15 saniye, `reference_image` rolleri
      kullanıldığında 1-10 saniye, uzatma için 2-10 saniye
    - Referans görüntü üretimi: sağlanan her görüntü için `imageRoles` değerini
      `reference_image` olarak ayarlayın; xAI bu tür en fazla 7 görüntü kabul eder

    <Warning>
    Yerel video tamponları kabul edilmez. Video düzenleme/uzatma girdileri için
    uzak `http(s)` URL'leri kullanın. Görüntüden videoya, yerel görüntü tamponlarını kabul eder çünkü
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
    Paylaşılan araç parametreleri,
    sağlayıcı seçimi ve failover davranışı için [Video Generation](/tr/tools/video-generation) sayfasına bakın.
    </Note>

  </Accordion>

  <Accordion title="Görüntü üretimi">
    Paketlenmiş `xai` Plugin'i, paylaşılan
    `image_generate` aracı üzerinden görüntü üretimini kaydeder.

    - Varsayılan görüntü modeli: `xai/grok-imagine-image`
    - Ek model: `xai/grok-imagine-image-pro`
    - Modlar: metinden görüntüye ve referans görüntü düzenleme
    - Referans girdileri: bir `image` veya en fazla beş `images`
    - En-boy oranları: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Çözünürlükler: `1K`, `2K`
    - Adet: en fazla 4 görüntü

    OpenClaw, üretilen medyanın
    normal kanal ek yolu üzerinden depolanabilmesi ve teslim edilebilmesi için xAI'den `b64_json` görüntü yanıtları ister. Yerel
    referans görüntüler veri URL'lerine dönüştürülür; uzak `http(s)` başvuruları
    doğrudan geçirilir.

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
    xAI ayrıca `quality`, `mask`, `user` ve `1:2`, `2:1`, `9:20` ile `20:9`
    gibi ek yerel oranları da belgeler. OpenClaw bugün yalnızca
    sağlayıcılar arası paylaşılan görüntü denetimlerini iletir; desteklenmeyen yalnızca-yerel düğmeler
    kasıtlı olarak `image_generate` üzerinden açığa çıkarılmaz.
    </Note>

  </Accordion>

  <Accordion title="Metinden konuşmaya">
    Paketlenmiş `xai` Plugin'i, paylaşılan `tts`
    sağlayıcı yüzeyi üzerinden metinden konuşmaya özelliğini kaydeder.

    - Sesler: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Varsayılan ses: `eve`
    - Biçimler: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Dil: BCP-47 kodu veya `auto`
    - Hız: sağlayıcıya özgü hız geçersiz kılması
    - Yerel Opus ses notu biçimi desteklenmez

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
    OpenClaw, xAI'nin toplu `/v1/tts` uç noktasını kullanır. xAI ayrıca WebSocket
    üzerinden akış TTS de sunar, ancak OpenClaw konuşma sağlayıcısı sözleşmesi şu anda
    yanıt tesliminden önce tam bir ses tamponu beklemektedir.
    </Note>

  </Accordion>

  <Accordion title="Konuşmadan metne">
    Paketlenmiş `xai` Plugin'i, toplu konuşmadan metne özelliğini OpenClaw'ın
    medya anlama yazıya döküm yüzeyi üzerinden kaydeder.

    - Varsayılan model: `grok-stt`
    - Uç nokta: xAI REST `/v1/stt`
    - Girdi yolu: multipart ses dosyası yükleme
    - OpenClaw'da, gelen ses yazıya dökümü
      `tools.media.audio` kullanan her yerde desteklenir; buna Discord sesli kanal parçaları ve
      kanal ses ekleri dahildir

    Gelen ses yazıya dökümünde xAI'yi zorlamak için:

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

    Dil, paylaşılan ses medya yapılandırması üzerinden veya çağrı başına
    yazıya döküm isteğiyle sağlanabilir. İstem ipuçları, paylaşılan OpenClaw
    yüzeyi tarafından kabul edilir, ancak xAI REST STT entegrasyonu yalnızca dosya, model ve
    dili iletir çünkü bunlar mevcut herkese açık xAI uç noktasına temiz biçimde eşlenir.

  </Accordion>

  <Accordion title="Akış konuşmadan metne">
    Paketlenmiş `xai` Plugin'i ayrıca canlı sesli arama sesi için bir gerçek zamanlı yazıya döküm sağlayıcısı
    kaydeder.

    - Uç nokta: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Varsayılan kodlama: `mulaw`
    - Varsayılan örnekleme hızı: `8000`
    - Varsayılan uç noktalama: `800ms`
    - Ara dökümler: varsayılan olarak etkin

    Voice Call'ın Twilio medya akışı G.711 µ-law ses kareleri gönderir, bu yüzden
    xAI sağlayıcısı bu kareleri yeniden kodlamaya gerek kalmadan doğrudan iletebilir:

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
    `alaw`), `interimResults`, `endpointingMs` ve `language` anahtarlarıdır.

    <Note>
    Bu akış sağlayıcısı, Voice Call'ın gerçek zamanlı yazıya döküm yolu içindir.
    Discord voice şu anda kısa parçalar kaydeder ve bunun yerine toplu
    `tools.media.audio` yazıya döküm yolunu kullanır.
    </Note>

  </Accordion>

  <Accordion title="x_search yapılandırması">
    Paketlenmiş xAI Plugin'i, Grok aracılığıyla
    X (eski adıyla Twitter) içeriğinde arama yapmak için `x_search` öğesini bir OpenClaw aracı olarak açığa çıkarır.

    Yapılandırma yolu: `plugins.entries.xai.config.xSearch`

    | Anahtar           | Tür     | Varsayılan         | Açıklama                            |
    | ----------------- | ------- | ------------------ | ----------------------------------- |
    | `enabled`         | boolean | —                  | x_search özelliğini etkinleştirir veya devre dışı bırakır |
    | `model`           | string  | `grok-4-1-fast`    | x_search istekleri için kullanılan model |
    | `inlineCitations` | boolean | —                  | Sonuçlara satır içi alıntılar ekler |
    | `maxTurns`        | number  | —                  | En fazla sohbet dönüşü sayısı       |
    | `timeoutSeconds`  | number  | —                  | Saniye cinsinden istek zaman aşımı  |
    | `cacheTtlMinutes` | number  | —                  | Dakika cinsinden önbellek yaşam süresi |

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
    Paketlenmiş xAI Plugin'i, xAI'nin sandbox ortamında
    uzak kod yürütme için `code_execution` öğesini bir OpenClaw aracı olarak açığa çıkarır.

    Yapılandırma yolu: `plugins.entries.xai.config.codeExecution`

    | Anahtar          | Tür     | Varsayılan                | Açıklama                                  |
    | ---------------- | ------- | ------------------------- | ----------------------------------------- |
    | `enabled`        | boolean | `true` (anahtar varsa)    | Kod yürütmeyi etkinleştirir veya devre dışı bırakır |
    | `model`          | string  | `grok-4-1-fast`           | Kod yürütme istekleri için kullanılan model |
    | `maxTurns`       | number  | —                         | En fazla sohbet dönüşü sayısı             |
    | `timeoutSeconds` | number  | —                         | Saniye cinsinden istek zaman aşımı        |

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

  <Accordion title="Bilinen sınırlamalar">
    - Kimlik doğrulama bugün yalnızca API anahtarıyladır. OpenClaw içinde henüz xAI OAuth veya cihaz kodu akışı yoktur.
    - `grok-4.20-multi-agent-experimental-beta-0304`, normal xAI sağlayıcı yolunda desteklenmez
      çünkü standart OpenClaw xAI taşımasından farklı bir üst akış API
      yüzeyi gerektirir.
    - xAI Realtime voice henüz bir OpenClaw sağlayıcısı olarak kaydedilmemiştir. Toplu STT veya
      akış yazıya dökümden farklı, çift yönlü bir ses oturumu sözleşmesine ihtiyaç duyar.
    - xAI görüntü `quality`, görüntü `mask` ve ek yalnızca-yerel en-boy oranları,
      paylaşılan `image_generate` aracında karşılık gelen
      sağlayıcılar arası denetimler bulunana kadar açığa çıkarılmaz.
  </Accordion>

  <Accordion title="Gelişmiş notlar">
    - OpenClaw, paylaşılan çalıştırıcı yolunda xAI'ye özgü araç şeması ve araç çağrısı uyumluluk düzeltmelerini
      otomatik olarak uygular.
    - Yerel xAI isteklerinde varsayılan olarak `tool_stream: true` kullanılır. Bunu
      devre dışı bırakmak için `agents.defaults.models["xai/<model>"].params.tool_stream` değerini `false` olarak ayarlayın.
    - Paketlenmiş xAI sarmalayıcısı, yerel xAI isteklerini göndermeden önce
      desteklenmeyen katı araç şeması bayraklarını ve reasoning yük anahtarlarını çıkarır.
    - `web_search`, `x_search` ve `code_execution`, OpenClaw
      araçları olarak açığa çıkarılır. OpenClaw, her sohbet turuna tüm yerel araçları eklemek yerine,
      her araç isteği içinde ihtiyaç duyduğu belirli xAI yerleşik özelliğini etkinleştirir.
    - `x_search` ve `code_execution`, çekirdek model çalışma zamanına sabit kodlanmak yerine
      paketlenmiş xAI Plugin'ine aittir.
    - `code_execution`, yerel
      [`exec`](/tr/tools/exec) değil, uzak xAI sandbox yürütmesidir.
  </Accordion>
</AccordionGroup>

## Canlı test

xAI medya yolları, birim testleri ve isteğe bağlı canlı paketlerle kapsanır. Canlı
komutlar, `XAI_API_KEY` değerini yoklamadan önce `~/.profile` dahil olmak üzere
oturum açma kabuğunuzdan gizli bilgileri yükler.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Sağlayıcıya özgü canlı dosya, normal TTS, telefon dostu PCM
TTS sentezler, xAI toplu STT aracılığıyla sesi yazıya döker, aynı PCM'yi xAI
gerçek zamanlı STT üzerinden akıtır, metinden görüntü çıktısı üretir ve bir
referans görüntüyü düzenler. Paylaşılan görüntü canlı dosyası, aynı xAI sağlayıcısını OpenClaw'ın
çalışma zamanı seçimi, yedek, normalleştirme ve medya ek yolu üzerinden doğrular.

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve failover davranışını seçme.
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

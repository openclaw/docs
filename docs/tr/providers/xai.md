---
read_when:
    - OpenClaw'da Grok modellerini kullanmak istiyorsunuz
    - xAI kimlik doğrulamasını veya model kimliklerini yapılandırıyorsunuz
summary: OpenClaw'da xAI Grok modellerini kullanın
title: xAI
x-i18n:
    generated_at: "2026-06-28T01:13:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b89c1037f9800366c03bdd1313a8c4ff05e8675effa60ed1e2985d38f045aad4
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw, Grok modelleri için paketle gelen bir `xai` sağlayıcı Plugin ile gelir. Çoğu
kullanıcı için önerilen yol, uygun bir SuperGrok veya X Premium aboneliğiyle
Grok OAuth kullanmaktır. OpenClaw yerel öncelikli kalır: Gateway, yapılandırma,
yönlendirme ve araçlar makinenizde çalışırken, Grok model istekleri xAI üzerinden
kimlik doğrulaması yapar ve xAI API'sine gönderilir.

OAuth bir xAI API anahtarı gerektirmez ve Grok Build uygulamasını da gerektirmez.
OpenClaw, xAI'nin paylaşılan OAuth istemcisini kullandığı için xAI, izin ekranında
yine de Grok Build gösterebilir.

## Kurulum yolunuzu seçin

OpenClaw kurulum durumunuza uyan yolu kullanın:

<Steps>
  <Step title="Yeni OpenClaw kurulumu">
    Yeni bir yerel Gateway kurarken daemon kurulumu ile ilk kurulumu çalıştırın,
    ardından model/kimlik doğrulama adımında xAI/Grok OAuth seçeneğini seçin:

    ```bash
    openclaw onboard --install-daemon
    ```

    Bir VPS üzerinde veya SSH üzerinden xAI OAuth'u doğrudan seçin; OpenClaw
    cihaz kodu doğrulaması kullanır ve localhost geri çağrısı gerektirmez:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    OAuth bir xAI API anahtarı gerektirmez. OpenClaw, Grok Build uygulamasını
    gerektirmez. OpenClaw, xAI'nin paylaşılan OAuth istemcisini kullandığı için
    xAI izin uygulamasını yine de Grok Build olarak etiketleyebilir.

  </Step>
  <Step title="Mevcut OpenClaw kurulumu">
    OpenClaw zaten yapılandırılmışsa yalnızca xAI'de oturum açın. Sırf Grok'u
    bağlamak için tam ilk kurulumu yeniden çalıştırmayın veya daemon'ı yeniden
    kurmayın:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Oturum açtıktan sonra Grok'u varsayılan model yapmak için bunu ayrıca
    uygulayın:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Tam ilk kurulumu yalnızca Gateway, daemon, kanal, çalışma alanı veya başka
    kurulum tercihlerini bilerek değiştirmek istiyorsanız yeniden çalıştırın.

  </Step>
  <Step title="API anahtarı yolu">
    API anahtarı kurulumu, xAI Console anahtarları ve anahtar destekli sağlayıcı
    yapılandırması gerektiren medya yüzeyleri için çalışmaya devam eder:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
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
OpenClaw, paketle gelen xAI taşıması olarak xAI Responses API'yi kullanır.
`openclaw models auth login --provider xai --method oauth` veya
`openclaw models auth login --provider xai --method api-key` ile alınan aynı
kimlik bilgisi, birinci sınıf `web_search`, `x_search`, uzak `code_execution`
ve xAI görüntü/video üretimini de çalıştırabilir. Konuşma ve transkripsiyon şu
anda `XAI_API_KEY` veya sağlayıcı yapılandırması gerektirir. Grok destekli
`web_search`, xAI OAuth'u tercih eder ve `XAI_API_KEY` veya plugin web araması
yapılandırmasına geri döner. Bir xAI anahtarını
`plugins.entries.xai.config.webSearch.apiKey` altında saklarsanız, paketle gelen
xAI model sağlayıcısı bu anahtarı da yedek olarak yeniden kullanır.
Grok `web_search` ve varsayılan olarak `x_search` isteklerini bir operatör xAI
Responses proxy'si üzerinden yönlendirmek için
`plugins.entries.xai.config.webSearch.baseUrl` değerini ayarlayın.
`code_execution` ayarları `plugins.entries.xai.config.codeExecution` altında yer
alır.
</Note>

## OAuth sorun giderme

- SSH, Docker, VPS veya diğer uzak kurulumlar için
  `openclaw models auth login --provider xai --method oauth` kullanın; xAI OAuth,
  localhost geri çağrısı yerine cihaz kodu doğrulaması kullanır.
- Oturum açma başarılı olur ancak Grok varsayılan model olmazsa
  `openclaw models set xai/grok-4.3` komutunu çalıştırın.
- Kaydedilmiş xAI kimlik doğrulama profillerini incelemek için şunu çalıştırın:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- Hangi hesapların OAuth API tokenları alabileceğine xAI karar verir. Bir hesap
  uygun değilse API anahtarı yolunu deneyin veya aboneliği xAI tarafında kontrol
  edin.

<Tip>
SSH, Docker veya bir VPS üzerinden oturum açarken `xai-oauth` kullanın. OpenClaw
bir xAI URL'si ve kısa kod yazdırır; uzak süreç tamamlanan token değişimi için
xAI'yi yoklarken oturum açmayı herhangi bir yerel tarayıcıda tamamlayın.
</Tip>

## Yerleşik katalog

OpenClaw, model seçicilerde en yeniler önce sıralanacak şekilde güncel xAI sohbet
modellerini hazır olarak içerir:

| Aile           | Model kimlikleri                                                        |
| -------------- | ------------------------------------------------------------------------ |
| Grok Build 0.1 | `grok-build-0.1`                                                         |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |

Plugin, mevcut yapılandırmalar için eski Grok 3, Grok 4, Grok 4 Fast, Grok 4.1
Fast ve Grok Code slug'larını hâlâ ileriye dönük çözer. Resmi Grok Code Fast
takma adları `grok-build-0.1` olarak normalleştirilir; OpenClaw artık seçilebilir
katalogda kullanımdan kaldırılmış diğer upstream slug'ları göstermez.

<Tip>
Açıkça bir Grok 4.20 beta takma adına ihtiyaç duymadığınız sürece genel sohbet
için `grok-4.3`, derleme/kodlama odaklı iş yükleri için `grok-build-0.1`
kullanın.
</Tip>

## OpenClaw özellik kapsamı

Paketle gelen Plugin, xAI'nin mevcut genel API yüzeyini OpenClaw'ın paylaşılan
sağlayıcı ve araç sözleşmelerine eşler. Paylaşılan sözleşmeye uymayan
yetenekler (örneğin akışlı TTS ve gerçek zamanlı ses) açığa çıkarılmaz - aşağıdaki
tabloya bakın.

| xAI yeteneği               | OpenClaw yüzeyi                          | Durum                                                                  |
| -------------------------- | ----------------------------------------- | ---------------------------------------------------------------------- |
| Sohbet / Responses         | `xai/<model>` model sağlayıcı             | Evet                                                                   |
| Sunucu tarafı web araması  | `web_search` sağlayıcı `grok`             | Evet                                                                   |
| Sunucu tarafı X araması    | `x_search` aracı                          | Evet                                                                   |
| Sunucu tarafı kod yürütme  | `code_execution` aracı                    | Evet                                                                   |
| Görüntüler                 | `image_generate`                          | Evet                                                                   |
| Videolar                   | `video_generate`                          | Evet                                                                   |
| Toplu metinden sese        | `messages.tts.provider: "xai"` / `tts`    | Evet                                                                   |
| Akışlı TTS                 | -                                         | Açığa çıkarılmaz; OpenClaw'ın TTS sözleşmesi eksiksiz ses arabellekleri döndürür |
| Toplu konuşmadan metne     | `tools.media.audio` / medya anlama        | Evet                                                                   |
| Akışlı konuşmadan metne    | Voice Call `streaming.provider: "xai"`    | Evet                                                                   |
| Gerçek zamanlı ses         | -                                         | Henüz açığa çıkarılmadı; farklı oturum/WebSocket sözleşmesi            |
| Dosyalar / toplu işler     | Yalnızca genel model API uyumluluğu       | Birinci sınıf bir OpenClaw aracı değil                                 |

<Note>
OpenClaw; medya üretimi, konuşma ve toplu transkripsiyon için xAI'nin REST
görüntü/video/TTS/STT API'lerini, canlı sesli arama transkripsiyonu için xAI'nin
akışlı STT WebSocket'ini ve model, arama ve kod yürütme araçları için Responses
API'yi kullanır. Gerçek zamanlı ses oturumları gibi farklı OpenClaw sözleşmeleri
gerektiren özellikler, burada gizli Plugin davranışı yerine upstream yetenekler
olarak belgelenir.
</Note>

### Hızlı mod eşlemeleri

`/fast on` veya `agents.defaults.models["xai/<model>"].params.fastMode: true`,
yerel xAI isteklerini şöyle yeniden yazar:

| Kaynak model  | Hızlı mod hedefi   |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### Eski uyumluluk takma adları

Eski takma adlar hâlâ kanonik paketli kimliklere normalleştirilir:

| Eski takma ad             | Kanonik kimlik                       |
| ------------------------- | ------------------------------------- |
| `grok-code-fast-1`        | `grok-build-0.1`                      |
| `grok-code-fast`          | `grok-build-0.1`                      |
| `grok-code-fast-1-0825`   | `grok-build-0.1`                      |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Özellikler

<AccordionGroup>
  <Accordion title="Web araması">
    Paketle gelen `grok` web araması sağlayıcısı xAI OAuth'u tercih eder, ardından
    `XAI_API_KEY` veya bir plugin web araması anahtarına geri döner:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Video üretimi">
    Paketle gelen `xai` Plugin, paylaşılan `video_generate` aracı üzerinden video
    üretimini kaydeder.

    - Varsayılan video modeli: `xai/grok-imagine-video`
    - Modlar: metinden videoya, görüntüden videoya, referans görüntü üretimi,
      uzak video düzenleme ve uzak video uzatma
    - En boy oranları: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Çözünürlükler: `480P`, `720P`
    - Süre: üretim/görüntüden videoya için 1-15 saniye, `reference_image`
      rolleri kullanıldığında 1-10 saniye, uzatma için 2-10 saniye
    - Referans görüntü üretimi: sağlanan her görüntü için `imageRoles` değerini
      `reference_image` olarak ayarlayın; xAI bu tür en fazla 7 görüntü kabul eder
    - Varsayılan işlem zaman aşımı: `video_generate.timeoutMs` veya
      `agents.defaults.videoGenerationModel.timeoutMs` ayarlanmadıysa 600 saniye

    <Warning>
    Yerel video arabellekleri kabul edilmez. Video düzenleme/uzatma girdileri
    için uzak `http(s)` URL'leri kullanın. Görüntüden videoya, yerel görüntü
    arabelleklerini kabul eder çünkü OpenClaw bunları xAI için veri URL'leri
    olarak kodlayabilir.
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
    Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için
    [Video Üretimi](/tr/tools/video-generation) bölümüne bakın.
    </Note>

  </Accordion>

  <Accordion title="Görüntü üretimi">
    Paketle gelen `xai` Plugin, paylaşılan `image_generate` aracı üzerinden görüntü
    üretimini kaydeder.

    - Varsayılan görüntü modeli: `xai/grok-imagine-image`
    - Ek model: `xai/grok-imagine-image-quality`
    - Modlar: metinden görüntüye ve referans görüntü düzenleme
    - Referans girdileri: bir `image` veya en fazla beş `images`
    - En boy oranları: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Çözünürlükler: `1K`, `2K`
    - Sayı: en fazla 4 görüntü
    - Varsayılan işlem zaman aşımı: `image_generate.timeoutMs` veya
      `agents.defaults.imageGenerationModel.timeoutMs` ayarlanmadıysa 600 saniye

    OpenClaw, üretilen medyanın normal kanal eki yolu üzerinden saklanıp
    iletilebilmesi için xAI'den `b64_json` görüntü yanıtları ister. Yerel
    referans görüntüler veri URL'lerine dönüştürülür; uzak `http(s)` referansları
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
    xAI ayrıca `quality`, `mask`, `user` ve `1:2`, `2:1`, `9:20` ve `20:9`
    gibi ek yerel oranları belgeler. OpenClaw bugün yalnızca sağlayıcılar arası
    ortak görüntü denetimlerini iletir; desteklenmeyen yalnızca yerel düğmeler
    bilinçli olarak `image_generate` üzerinden sunulmaz.
    </Note>

  </Accordion>

  <Accordion title="Metinden konuşmaya">
    Paketle gelen `xai` Plugin, paylaşılan `tts` sağlayıcı yüzeyi üzerinden metinden konuşmayı kaydeder.

    - Sesler: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Varsayılan ses: `eve`
    - Biçimler: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Dil: BCP-47 kodu veya `auto`
    - Hız: sağlayıcıya özgü hız geçersiz kılma
    - Yerel Opus sesli not biçimi desteklenmez

    xAI'yi varsayılan TTS sağlayıcısı olarak kullanmak için:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              speakerVoiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw, xAI'nin toplu `/v1/tts` uç noktasını kullanır. xAI ayrıca WebSocket
    üzerinden akışlı TTS sunar, ancak OpenClaw konuşma sağlayıcısı sözleşmesi
    şu anda yanıt tesliminden önce eksiksiz bir ses arabelleği bekler.
    </Note>

  </Accordion>

  <Accordion title="Konuşmadan metne">
    Paketle gelen `xai` Plugin, OpenClaw'ın medya anlama transkripsiyon yüzeyi
    üzerinden toplu konuşmadan metne işlevini kaydeder.

    - Varsayılan model: `grok-stt`
    - Uç nokta: xAI REST `/v1/stt`
    - Girdi yolu: multipart ses dosyası yükleme
    - Gelen ses transkripsiyonunun `tools.media.audio` kullandığı her yerde,
      Discord ses kanalı segmentleri ve kanal ses ekleri dahil, OpenClaw tarafından desteklenir

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

    Dil, paylaşılan ses medyası yapılandırması veya çağrı başına transkripsiyon
    isteği üzerinden sağlanabilir. İstem ipuçları paylaşılan OpenClaw yüzeyi
    tarafından kabul edilir, ancak xAI REST STT entegrasyonu yalnızca dosya,
    model ve dili iletir; çünkü bunlar mevcut genel xAI uç noktasıyla temiz biçimde eşleşir.

  </Accordion>

  <Accordion title="Akışlı konuşmadan metne">
    Paketle gelen `xai` Plugin, canlı sesli arama sesi için gerçek zamanlı bir
    transkripsiyon sağlayıcısı da kaydeder.

    - Uç nokta: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Varsayılan kodlama: `mulaw`
    - Varsayılan örnekleme hızı: `8000`
    - Varsayılan uç noktalama: `800ms`
    - Ara transkriptler: varsayılan olarak etkin

    Voice Call'ın Twilio medya akışı G.711 µ-law ses kareleri gönderir; bu nedenle
    xAI sağlayıcısı bu kareleri kod dönüştürme yapmadan doğrudan iletebilir:

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
    `plugins.entries.voice-call.config.streaming.providers.xai` altında bulunur.
    Desteklenen anahtarlar `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`,
    `mulaw` veya `alaw`), `interimResults`, `endpointingMs` ve `language` değerleridir.

    <Note>
    Bu akış sağlayıcısı, Voice Call'ın gerçek zamanlı transkripsiyon yolu içindir.
    Discord sesi şu anda kısa segmentler kaydeder ve bunun yerine toplu
    `tools.media.audio` transkripsiyon yolunu kullanır.
    </Note>

  </Accordion>

  <Accordion title="x_search yapılandırması">
    Paketle gelen xAI Plugin, Grok aracılığıyla X (eski adıyla Twitter) içeriğini
    aramak için `x_search` değerini bir OpenClaw aracı olarak sunar.

    Yapılandırma yolu: `plugins.entries.xai.config.xSearch`

    | Anahtar            | Tür     | Varsayılan         | Açıklama                             |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | x_search özelliğini etkinleştirir veya devre dışı bırakır |
    | `model`            | string  | `grok-4-1-fast`    | x_search istekleri için kullanılan model |
    | `baseUrl`          | string  | -                  | xAI Responses temel URL geçersiz kılması |
    | `inlineCitations`  | boolean | -                  | Sonuçlara satır içi alıntılar ekler  |
    | `maxTurns`         | number  | -                  | Maksimum konuşma turu                |
    | `timeoutSeconds`   | number  | -                  | Saniye cinsinden istek zaman aşımı   |
    | `cacheTtlMinutes`  | number  | -                  | Dakika cinsinden önbellek yaşam süresi |

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
    Paketle gelen xAI Plugin, xAI'nin sandbox ortamında uzaktan kod yürütme için
    `code_execution` değerini bir OpenClaw aracı olarak sunar.

    Yapılandırma yolu: `plugins.entries.xai.config.codeExecution`

    | Anahtar           | Tür     | Varsayılan         | Açıklama                             |
    | ----------------- | ------- | ------------------ | ------------------------------------ |
    | `enabled`         | boolean | `true` (anahtar varsa) | Kod yürütmeyi etkinleştirir veya devre dışı bırakır |
    | `model`           | string  | `grok-4-1-fast`    | Kod yürütme istekleri için kullanılan model |
    | `maxTurns`        | number  | -                  | Maksimum konuşma turu                |
    | `timeoutSeconds`  | number  | -                  | Saniye cinsinden istek zaman aşımı   |

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
    - xAI kimlik doğrulaması bir API anahtarı, ortam değişkeni, Plugin yapılandırması
      yedeği veya uygun bir xAI hesabıyla OAuth kullanabilir. OAuth, localhost geri
      çağrısı olmadan cihaz kodu doğrulaması kullanır. Hangi hesapların OAuth API
      tokenları alabileceğine xAI karar verir ve onay sayfası, OpenClaw Grok Build
      uygulamasını gerektirmese bile Grok Build gösterebilir.
    - OpenClaw şu anda xAI çok aracılı model ailesini sunmaz. xAI bu modelleri
      Responses API üzerinden sunar, ancak bunlar OpenClaw'ın paylaşılan agent
      döngüsünün kullandığı istemci tarafı veya özel araçları kabul etmez. Bkz.
      [xAI çok aracılı sınırlamaları](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - xAI Realtime voice henüz bir OpenClaw sağlayıcısı olarak kaydedilmedi. Toplu STT
      veya akışlı transkripsiyondan farklı bir çift yönlü ses oturumu sözleşmesi gerekir.
    - xAI görüntü `quality`, görüntü `mask` ve ek yalnızca yerel en boy oranları,
      paylaşılan `image_generate` aracında karşılık gelen sağlayıcılar arası denetimler
      olana kadar sunulmaz.
  </Accordion>

  <Accordion title="Gelişmiş notlar">
    - OpenClaw, xAI'ye özgü araç şeması ve araç çağrısı uyumluluk düzeltmelerini
      paylaşılan çalıştırıcı yolunda otomatik olarak uygular.
    - Yerel xAI istekleri varsayılan olarak `tool_stream: true` kullanır. Devre dışı
      bırakmak için `agents.defaults.models["xai/<model>"].params.tool_stream` değerini
      `false` olarak ayarlayın.
    - Paketle gelen xAI sarmalayıcısı, yerel xAI istekleri göndermeden önce
      desteklenmeyen katı araç şeması bayraklarını ve reasoning *effort* yük anahtarlarını
      kaldırır. Yalnızca `grok-4.3` / `grok-4.3-*` yapılandırılabilir reasoning effort
      duyurur; reasoning yeteneği olan diğer tüm xAI modelleri yine de
      `include: ["reasoning.encrypted_content"]` ister, böylece önceki şifrelenmiş
      reasoning sonraki turlarda yeniden oynatılabilir.
    - `web_search`, `x_search` ve `code_execution` OpenClaw araçları olarak sunulur.
      OpenClaw, tüm yerel araçları her sohbet turuna eklemek yerine her araç isteğinin
      içinde ihtiyaç duyduğu belirli xAI yerleşik aracını etkinleştirir.
    - Grok `web_search`, `plugins.entries.xai.config.webSearch.baseUrl` değerini okur.
      `x_search`, `plugins.entries.xai.config.xSearch.baseUrl` değerini okur, ardından
      Grok web arama temel URL'sine geri döner.
    - `x_search` ve `code_execution`, çekirdek model çalışma zamanına sabit kodlanmak
      yerine paketle gelen xAI Plugin tarafından sahiplenilir.
    - `code_execution`, yerel [`exec`](/tr/tools/exec) değil, uzaktan xAI sandbox yürütmesidir.

  </Accordion>
</AccordionGroup>

## Canlı test

xAI medya yolları birim testleri ve isteğe bağlı canlı paketlerle kapsanır.
Canlı probları çalıştırmadan önce işlem ortamında `XAI_API_KEY` dışa aktarın.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Sağlayıcıya özgü canlı dosya normal TTS, telefon uyumlu PCM TTS sentezler,
xAI toplu STT üzerinden sesi transkribe eder, aynı PCM'yi xAI gerçek zamanlı STT
üzerinden akıtır, metinden görüntü çıktısı üretir ve bir referans görüntüyü
düzenler. Paylaşılan görüntü canlı dosyası, aynı xAI sağlayıcısını OpenClaw'ın
çalışma zamanı seçimi, fallback, normalleştirme ve medya eki yolu üzerinden doğrular.

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve failover davranışını seçme.
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

---
read_when:
    - OpenClaw'da Grok modellerini kullanmak istiyorsunuz
    - xAI kimlik doğrulamasını veya model kimliklerini yapılandırıyorsunuz
summary: OpenClaw'da xAI Grok modellerini kullanın
title: xAI
x-i18n:
    generated_at: "2026-07-12T12:11:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eba797fbb2f4f2a47c8e07daabe93ef4f6e5a8077d3c739b0f6b9c99283995e1
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw, Grok modelleri için paketle birlikte gelen bir `xai` sağlayıcı plugini sunar. Önerilen yöntem, uygun bir SuperGrok veya X Premium aboneliğiyle Grok OAuth kullanmaktır. Gateway, yapılandırma, yönlendirme ve araçlar yerel kalır; yalnızca Grok istekleri xAI'ın API'sine gider.

OAuth, bir xAI API anahtarı veya Grok Build uygulaması gerektirmez. OpenClaw, xAI'ın paylaşılan OAuth istemcisini kullandığından xAI yine de onay ekranında Grok Build'i gösterebilir.

## Kurulum

<Steps>
  <Step title="Yeni kurulum">
    Arka plan hizmeti kurulumuyla ilk yapılandırmayı çalıştırın, ardından model/kimlik doğrulama adımında xAI/Grok OAuth'u seçin:

    ```bash
    openclaw onboard --install-daemon
    ```

    Bir VPS'de veya SSH üzerinden xAI OAuth'u doğrudan seçin; cihaz koduyla doğrulama kullanır ve localhost geri çağrısı gerektirmez:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="Mevcut kurulum">
    Yalnızca xAI'da oturum açın; sadece Grok'u bağlamak için ilk yapılandırmanın tamamını yeniden çalıştırmayın:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Grok'u ayrıca varsayılan model olarak ayarlayın:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    İlk yapılandırmanın tamamını yalnızca Gateway, arka plan hizmeti, kanal, çalışma alanı veya diğer kurulum seçimlerini bilerek değiştirmek istiyorsanız yeniden çalıştırın.

  </Step>
  <Step title="API anahtarı yöntemi">
    API anahtarıyla kurulum, xAI Console anahtarları ve anahtar destekli sağlayıcı yapılandırması gerektiren medya yüzeyleri için çalışmaya devam eder:

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
OpenClaw, paketle birlikte gelen xAI aktarım mekanizması olarak xAI Responses API'yi kullanır. `openclaw models auth login --provider xai --method oauth` veya `--method api-key` komutundan alınan aynı kimlik bilgisi; `web_search` (`grok` sağlayıcı kimliği), `x_search`, `code_execution`, konuşma/transkripsiyon ve xAI görsel/video üretimini de çalıştırır. `plugins.entries.xai.config.webSearch.apiKey` altında bir xAI anahtarı saklarsanız paketle birlikte gelen xAI model sağlayıcısı bunu yedek seçenek olarak da yeniden kullanır.
</Note>

## OAuth sorun giderme

- SSH, Docker, VPS veya diğer uzak kurulumlar için `openclaw models auth login --provider xai --method oauth` komutunu kullanın; localhost geri çağrısı yerine cihaz koduyla doğrulama kullanır.
- Oturum açma başarılı olduğu hâlde Grok varsayılan model değilse `openclaw models set xai/grok-4.3` komutunu çalıştırın.
- Kaydedilmiş xAI kimlik doğrulama profillerini inceleyin:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- Hangi hesapların OAuth API belirteçlerini alabileceğine xAI karar verir. Bir hesap uygun değilse API anahtarı yöntemini kullanın veya xAI tarafındaki aboneliği denetleyin.

<Tip>
SSH, Docker veya bir VPS üzerinden oturum açarken `xai-oauth` kullanın. OpenClaw bir URL ve kısa kod yazdırır; uzak işlem tamamlanan belirteç değişimi için xAI'ı yoklarken herhangi bir yerel tarayıcıda oturum açmayı tamamlayın.
</Tip>

## Yerleşik katalog

Model seçicilerde seçilebilen kimlikler. Plugin, mevcut yapılandırmalar için eski Grok 3, Grok 4, Grok 4 Fast, Grok 4.1 Fast ve Grok Code kimliklerini çözümlemeye devam eder; bkz. [eski sürüm uyumluluğu ve değişken takma adlar](#legacy-compatibility-and-moving-aliases).

| Aile           | Model kimlikleri                                             |
| -------------- | ------------------------------------------------------------ |
| Grok 4.5       | `grok-4.5` (takma adlar: `grok-4.5-latest`, `grok-build-latest`) |
| Grok Build 0.1 | `grok-build-0.1`                                             |
| Grok 4.3       | `grok-4.3` (takma adlar: `grok-4.3-latest`, `grok-latest`)   |
| Grok 4.20      | `grok-4.20-0309-reasoning`, `grok-4.20-0309-non-reasoning`   |

<Tip>
Kullanılabildiği yerlerde genel sohbet, kodlama ve aracılı çalışmalar için `grok-4.5` kullanın. Grok 4.3, bölgesel olarak güvenli kurulum varsayılanı olmayı sürdürür; `grok-build-0.1` ve tarihli iki Grok 4.20 çeşidi de seçilebilir durumda kalır.
</Tip>

## Özellik kapsamı

Paketle birlikte gelen plugin, desteklenen xAI API'lerini OpenClaw'ın paylaşılan sağlayıcı ve araç sözleşmeleriyle eşler. Paylaşılan sözleşmeye uymayan yetenekler aşağıda veya bilinen sınırlamalar bölümünde listelenmiştir.

| xAI yeteneği                 | OpenClaw yüzeyi                          | Durum                                                        |
| ---------------------------- | ---------------------------------------- | ------------------------------------------------------------ |
| Sohbet / Yanıtlar            | `xai/<model>` model sağlayıcısı          | Evet                                                         |
| Sunucu taraflı web araması   | `web_search` sağlayıcısı `grok`          | Evet                                                         |
| Sunucu taraflı X araması     | `x_search` aracı                         | Evet                                                         |
| Sunucu taraflı kod yürütme   | `code_execution` aracı                   | Evet                                                         |
| Görseller                    | `image_generate`                         | Evet                                                         |
| Videolar                     | `video_generate`                         | Klasik tam iş akışı; Video 1.5 görselden videoya             |
| Toplu metinden konuşmaya     | `messages.tts.provider: "xai"` / `tts`   | Evet                                                         |
| Akışlı TTS                   | -                                        | Henüz xAI sağlayıcısı tarafından uygulanmadı                 |
| Toplu konuşmadan metne       | `tools.media.audio` medya anlama         | Evet                                                         |
| Akışlı konuşmadan metne      | Voice Call `streaming.provider: "xai"`   | Evet                                                         |
| Gerçek zamanlı ses           | -                                        | Henüz kullanıma sunulmadı; farklı bir oturum/WebSocket sözleşmesi gerekir |
| Dosyalar / toplu işlemler    | Yalnızca genel model API uyumluluğu      | Birinci sınıf bir OpenClaw aracı değildir                    |

<Note>
OpenClaw; medya üretimi ve toplu transkripsiyon için xAI'ın REST görsel/video/TTS/STT API'lerini, canlı sesli arama transkripsiyonu için xAI'ın akışlı STT WebSocket'ini ve sohbet, arama ve kod yürütme araçları için Responses API'yi kullanır.
</Note>

### Eski hızlı mod uyumluluğu

`/fast on` veya `agents.defaults.models["xai/<model>"].params.fastMode: true`, eski xAI yapılandırmalarını aşağıdaki şekilde yeniden yazmaya devam eder. Bu hedef kimlikler yalnızca uyumluluk için korunur; yeni yapılandırmalarda güncel seçilebilir modelleri kullanın.

| Kaynak model  | Hızlı mod hedefi   |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### Eski sürüm uyumluluğu ve değişken takma adlar

Eski takma adlar aşağıdaki şekilde normalleştirilir:

| Eski takma ad                                                 | Normalleştirilmiş kimlik |
| ------------------------------------------------------------- | ------------------------ |
| `grok-code-fast-1`, `grok-code-fast`, `grok-code-fast-1-0825` | `grok-build-0.1`         |

Tarihli 0309 kimlikleri, seçilebilir katalog girdileridir. OpenClaw, xAI'ın kararlı, en son, beta, deneysel ve tarihli takma adların anlamlarını denetlemeyi sürdürmesi için diğer tüm güncel Grok 4.20 takma adlarını değiştirmeden gönderir. Genel `grok-latest` takma adı da değiştirilmeden korunur.

xAI, aşağıdaki tam kimlikleri kullanımdan kaldırdı. OpenClaw, yayımlanmış yapılandırmalarla uyumluluk için bunları mevcut yönlendirme hedeflerinin sınırları ve fiyatlandırmasıyla birlikte gizli satırlar olarak korur:

| Kullanımdan kaldırılan kimlikler                                    | Güncel davranış                            |
| ------------------------------------------------------------------- | ------------------------------------------ |
| `grok-4-1-fast-reasoning`, `grok-4-fast-reasoning`, `grok-4-0709`   | `low` akıl yürütmeli Grok 4.3              |
| `grok-4-1-fast-non-reasoning`, `grok-4-fast-non-reasoning`, `grok-3` | Akıl yürütmesi devre dışı bırakılmış Grok 4.3 |
| `grok-code-fast-1`                                                  | Grok Build 0.1                             |
| `grok-imagine-image-pro`                                            | Grok Imagine Görsel Kalitesi               |

`openclaw doctor --fix`, kalıcı xAI sunucu aracı varsayılanlarını ve kullanımdan kaldırılan kaliteli görsel kısa adını günceller, eski üretilmiş katalog satırlarını kaldırır ve etkin 4.20 satırlarındaki eski bağlam meta verilerini onarır. Etkin 4.20 `beta-latest` takma adlarını tarihli bir anlık görüntüye sabitlemez.

## Özellikler

<Warning>
  `x_search` ve `code_execution`, xAI'ın sunucularında çalışır. xAI, modelin giriş ve çıkış belirteçlerine ek olarak 1.000 araç çağrısı başına 5 ABD doları ücretlendirir. Her aracın `enabled` ayarı belirtilmediğinde OpenClaw aracı yalnızca etkin bir xAI modeli için sunar. xAI dışındaki bilinen bir model sağlayıcısı, araç başına açıkça `enabled: true` ayarı gerektirir; eksik veya çözümlenemeyen bir sağlayıcı erişimi güvenli biçimde kapatır. xAI kimlik doğrulaması her zaman gereklidir ve `enabled: false`, aracı tüm sağlayıcılar için devre dışı bırakır.
</Warning>

<AccordionGroup>
  <Accordion title="Web araması">
    Paketle birlikte gelen `grok` web araması sağlayıcısı öncelikle xAI OAuth'u tercih eder, ardından `XAI_API_KEY` veya bir plugin web araması anahtarını yedek olarak kullanır:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Video üretimi">
    Paketle birlikte gelen `xai` plugini, paylaşılan `video_generate` aracı üzerinden video üretimini kaydeder.

    - Varsayılan model: `xai/grok-imagine-video`
    - Ek model: `xai/grok-imagine-video-1.5`
    - Klasik modlar: metinden videoya, görselden videoya, referans görselle üretim, uzak video düzenleme ve uzak video uzatma
    - Video 1.5 modu: yalnızca görselden videoya; tam olarak bir ilk kare görseliyle
    - En-boy oranları: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`; klasik ve Video 1.5 görselden videoya işlemleri, belirtilmediğinde kaynak görselin oranını devralır
    - Çözünürlükler: klasik `480P`/`720P`; Video 1.5 ayrıca `1080P` destekler; tüm üretim modları varsayılan olarak `480P` kullanır
    - Süre: üretim/görselden videoya için 1-15 saniye, klasik `reference_image` rolleri kullanılırken 1-10 saniye, klasik uzatma için 2-10 saniye
    - Referans görselle üretim: sağlanan her görsel için `imageRoles` değerini `reference_image` olarak ayarlayın; xAI bu tür en fazla 7 görseli kabul eder
    - Video düzenleme/uzatma, giriş videosunun en-boy oranını ve çözünürlüğünü devralır; bu işlemler geometri geçersiz kılmalarını kabul etmez
    - Varsayılan işlem zaman aşımı: `video_generate.timeoutMs` veya `agents.defaults.videoGenerationModel.timeoutMs` ayarlanmadıkça 600 saniye

    <Warning>
    Yerel video tamponları kabul edilmez. Video düzenleme/uzatma girdileri için uzak `http(s)` URL'leri kullanın. OpenClaw bunları xAI için veri URL'leri olarak kodladığından görselden videoya işlemi yerel görsel tamponlarını kabul eder.
    </Warning>

    Video 1.5, xAI'ın `grok-imagine-video-1.5-preview` ve `grok-imagine-video-1.5-2026-05-30` tanımlayıcılarını da tanır. OpenClaw, seçilen tanımlayıcıyı değiştirmeden iletir ancak aynı yalnızca görsel doğrulamasını uygular.

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
    Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Video Üretimi](/tr/tools/video-generation) bölümüne bakın.
    </Note>

  </Accordion>

  <Accordion title="Görsel üretimi">
    Paketle birlikte gelen `xai` plugini, paylaşılan `image_generate` aracı üzerinden görsel üretimini kaydeder.

    - Varsayılan görüntü modeli: `xai/grok-imagine-image`
    - Ek model: `xai/grok-imagine-image-quality`
    - Modlar: metinden görüntü oluşturma ve referans görüntü düzenleme
    - Referans girdileri: bir `image` veya en fazla üç `images`
    - En-boy oranları: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Çözünürlükler: `1K`, `2K`
    - Sayı: en fazla 4 görüntü
    - Varsayılan işlem zaman aşımı: `image_generate.timeoutMs`
      veya `agents.defaults.imageGenerationModel.timeoutMs` ayarlanmadığı sürece 600 saniye

    OpenClaw, oluşturulan medyanın normal kanal eki yolu üzerinden
    depolanıp teslim edilebilmesi için xAI'dan `b64_json` görüntü yanıtları ister. Yerel
    referans görüntüler veri URL'lerine dönüştürülür; uzak `http(s)` referansları
    değiştirilmeden aktarılır.

    xAI'ı varsayılan görüntü sağlayıcısı olarak kullanmak için:

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
    xAI ayrıca `quality`, `mask`, `user` ve `auto` en-boy oranını da belgeler.
    OpenClaw şu anda yalnızca sağlayıcılar arasında ortak olan görüntü denetimlerini iletir;
    yalnızca yerel olarak kullanılabilen bu ayarlar `image_generate` üzerinden sunulmaz.
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    Paketle gelen `xai` Plugin'i, paylaşılan `tts`
    sağlayıcı yüzeyi üzerinden metinden konuşma özelliğini kaydeder.

    - Sesler: xAI'dan kimlik doğrulamalı canlı katalog; şu komutla listeleyin:
      `openclaw infer tts voices --provider xai`
    - Çevrimdışı yedek sesler: `ara`, `eve`, `leo`, `rex`, `sal`
    - Varsayılan ses: `eve`
    - Hesaba özel ses kimlikleri, yerleşik katalog yanıtında bulunmasalar bile iletilir
    - Biçimler: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Dil: BCP-47 kodu veya `auto`
    - Hız: sağlayıcıya özgü hız geçersiz kılma ayarı
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
    OpenClaw, xAI'ın toplu `/v1/tts` uç noktasını ve kimlik doğrulamalı
    `/v1/tts/voices` kataloğunu kullanır. xAI, WebSocket üzerinden akışlı TTS de sunar ancak
    paketle gelen xAI sağlayıcısı bu akış kancasını henüz uygulamaz.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Paketle gelen `xai` Plugin'i, OpenClaw'ın
    medya anlama transkripsiyon yüzeyi üzerinden toplu konuşmadan metne dönüştürme özelliğini kaydeder.

    - Uç nokta: xAI REST `/v1/stt`
    - Girdi yolu: çok parçalı ses dosyası yüklemesi
    - Model seçimi: xAI transkripsiyon modelini dahili olarak seçer;
      uç noktada model seçici yoktur
    - Discord ses kanalı bölümleri ve kanal ses ekleri dâhil olmak üzere,
      gelen ses transkripsiyonunun `tools.media.audio` okuduğu her yerde kullanılır

    Gelen ses transkripsiyonu için xAI kullanımını zorunlu kılmak üzere:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
              },
            ],
          },
        },
      },
    }
    ```

    Dil, paylaşılan ses medyası yapılandırması veya çağrı başına
    transkripsiyon isteği üzerinden sağlanabilir. İstem ipuçları paylaşılan OpenClaw
    yüzeyi tarafından kabul edilir ancak xAI REST STT entegrasyonu, mevcut genel xAI
    uç noktasıyla yalnızca bunlar eşleştiği için sadece dosyayı ve dili iletir.

  </Accordion>

  <Accordion title="Streaming speech-to-text">
    Paketle gelen `xai` Plugin'i ayrıca canlı sesli arama sesi için
    gerçek zamanlı bir transkripsiyon sağlayıcısı kaydeder.

    - Uç nokta: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Varsayılan kodlama: `mulaw`
    - Varsayılan örnekleme hızı: `8000`
    - Varsayılan uç nokta algılama süresi: `800ms`
    - Ara transkriptler: varsayılan olarak etkin

    Voice Call'un Twilio medya akışı G.711 mu-law ses kareleri gönderdiğinden,
    xAI sağlayıcısı bu kareleri kod dönüştürme yapmadan doğrudan iletir:

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
    Bu akış sağlayıcısı, Voice Call'un gerçek zamanlı transkripsiyon yolu içindir.
    Discord kısa bölümler kaydeder ve bunun yerine toplu
    `tools.media.audio` transkripsiyon yolunu kullanır.
    </Note>

  </Accordion>

  <Accordion title="x_search configuration">
    Paketle gelen xAI Plugin'i, Grok aracılığıyla X (eski adıyla Twitter)
    içeriğinde arama yapmak için `x_search` aracını bir OpenClaw aracı olarak sunar.

    Yapılandırma yolu: `plugins.entries.xai.config.xSearch`

    | Anahtar           | Tür     | Varsayılan                | Açıklama                                         |
    | ----------------- | ------- | ------------------------- | ------------------------------------------------ |
    | `enabled`         | boolean | xAI modelleri için otomatik | Devre dışı bırakın veya bilinen bir xAI dışı sağlayıcı için etkinleştirin |
    | `model`           | string  | `grok-4.3`                | x_search isteklerinde kullanılan model           |
    | `baseUrl`         | string  | -                         | xAI Responses temel URL'sini geçersiz kılma      |
    | `inlineCitations` | boolean | -                         | Sonuçlara satır içi atıfları dâhil et            |
    | `maxTurns`        | number  | -                         | En fazla konuşma turu                            |
    | `timeoutSeconds`  | number  | `30`                      | Saniye cinsinden istek zaman aşımı               |
    | `cacheTtlMinutes` | number  | `15`                      | Dakika cinsinden önbellek yaşam süresi           |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4.3",
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

  <Accordion title="Code execution configuration">
    Paketle gelen xAI Plugin'i, xAI'ın korumalı alan ortamında
    uzaktan kod yürütmek için `code_execution` aracını bir OpenClaw aracı olarak sunar.

    Yapılandırma yolu: `plugins.entries.xai.config.codeExecution`

    | Anahtar          | Tür     | Varsayılan                | Açıklama                                         |
    | ---------------- | ------- | ------------------------- | ------------------------------------------------ |
    | `enabled`        | boolean | xAI modelleri için otomatik | Devre dışı bırakın veya bilinen bir xAI dışı sağlayıcı için etkinleştirin |
    | `model`          | string  | `grok-4.3`                | Kod yürütme isteklerinde kullanılan model        |
    | `maxTurns`       | number  | -                         | En fazla konuşma turu                            |
    | `timeoutSeconds` | number  | `30`                      | Saniye cinsinden istek zaman aşımı               |

    <Note>
    Bu, yerel [`exec`](/tr/tools/exec) değil, uzaktaki xAI korumalı alanında yürütmedir.
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4.3",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Known limits">
    - xAI kimlik doğrulaması; API anahtarı, ortam değişkeni, Plugin yapılandırması
      yedeği veya uygun bir xAI hesabıyla OAuth kullanabilir. OAuth, localhost geri çağrısı
      olmadan cihaz kodu doğrulamasını kullanır. Hangi hesapların OAuth API
      belirteçlerini alabileceğine xAI karar verir ve OpenClaw Grok Build uygulamasını
      gerektirmediği hâlde onay sayfasında Grok Build gösterilebilir.
    - OpenClaw şu anda xAI çok aracılı model ailesini sunmaz. xAI
      bu modelleri Responses API üzerinden sağlar ancak modeller,
      OpenClaw'ın paylaşılan aracı döngüsünde kullanılan istemci tarafı veya özel araçları kabul etmez.
      Bkz.
      [xAI çok aracılı sistem sınırlamaları](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - xAI Realtime voice henüz bir OpenClaw sağlayıcısı olarak kaydedilmemiştir.
      Toplu STT veya akışlı transkripsiyondan farklı bir çift yönlü ses oturumu
      sözleşmesi gerektirir.
    - xAI görüntü `quality`, görüntü `mask` ve yerel `auto` en-boy oranı,
      paylaşılan `image_generate` aracında bunlara karşılık gelen sağlayıcılar arası
      denetimler bulunana kadar sunulmaz.
  </Accordion>

  <Accordion title="Advanced notes">
    - OpenClaw, paylaşılan çalıştırıcı yolunda xAI'a özgü araç şeması ve araç çağrısı
      uyumluluk düzeltmelerini otomatik olarak uygular.
    - Yerel xAI isteklerinde varsayılan değer `tool_stream: true` şeklindedir. Devre dışı
      bırakmak için `agents.defaults.models["xai/<model>"].params.tool_stream` değerini `false`
      olarak ayarlayın.
    - Paketle gelen xAI sarmalayıcısı, yerel xAI isteklerini göndermeden önce
      desteklenmeyen içerme sayısı şema sınırlarını ve desteklenmeyen akıl yürütme
      *çabası* yük anahtarlarını kaldırır. Grok 4.5 düşük, orta ve
      yüksek çabayı destekler (varsayılan yüksek). Grok 4.3; yok, düşük, orta ve yüksek
      çabayı destekler (varsayılan düşük). Akıl yürütme yeteneğine sahip diğer xAI modelleri
      yapılandırılabilir bir çaba denetimi sunmaz ancak sonraki turlarda önceki şifrelenmiş
      akıl yürütmenin yeniden oynatılabilmesi için yine de
      `include: ["reasoning.encrypted_content"]` isteğinde bulunur.
    - `web_search`, `x_search` ve `code_execution`, OpenClaw
      araçları olarak sunulur. OpenClaw, her yerel aracı her sohbet turuna eklemek yerine
      yalnızca her aracın ihtiyaç duyduğu belirli xAI yerleşik aracını o aracın isteğine ekler.
    - Grok `web_search`, `plugins.entries.xai.config.webSearch.baseUrl` değerini okur.
      `x_search`, `plugins.entries.xai.config.xSearch.baseUrl` değerini okur, ardından
      Grok web araması temel URL'sini yedek olarak kullanır.
    - `x_search` ve `code_execution`, çekirdek model çalışma zamanında sabit kodlanmak
      yerine paketle gelen xAI Plugin'ine aittir.
    - `code_execution`, yerel [`exec`](/tr/tools/exec) değil,
      uzaktaki xAI korumalı alanında yürütmedir.
  </Accordion>
</AccordionGroup>

## Canlı test

xAI medya yolları, birim testleri ve isteğe bağlı canlı test paketleriyle kapsanır. Canlı
yoklamaları çalıştırmadan önce işlem ortamında `XAI_API_KEY` değerini dışa aktarın.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/x-search.live.test.ts
OPENCLAW_LIVE_GATEWAY_MODELS="xai/grok-4.5,xai/grok-build-0.1,xai/grok-4.3,xai/grok-4.20-0309-reasoning,xai/grok-4.20-0309-non-reasoning" OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0 OPENCLAW_LIVE_GATEWAY_SMOKE=0 pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Sağlayıcıya özgü canlı dosya; normal TTS, telefon sistemlerine uygun PCM
TTS sentezler, xAI toplu STT aracılığıyla sesin yazıya dökümünü yapar, aynı PCM'i xAI
gerçek zamanlı STT üzerinden akışa alır, metinden görüntü çıktısı oluşturur ve bir referans görüntüyü düzenler.
Paylaşılan görüntü canlı dosyası, aynı xAI sağlayıcısını OpenClaw'ın
çalışma zamanı seçimi, geri dönüş, normalleştirme ve medya eki yolu üzerinden doğrular. İsteğe bağlı
Video 1.5 durumu, 1080P çözünürlükte oluşturulmuş tek bir ilk kare görüntüsü gönderir ve
tamamlanan videonun indirilmesini doğrular.

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Video oluşturma" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Tüm sağlayıcılar" href="/tr/providers/index" icon="grid-2">
    Daha kapsamlı sağlayıcı genel bakışı.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve düzeltmeler.
  </Card>
</CardGroup>

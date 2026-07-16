---
read_when:
    - OpenClaw'da Grok modellerini kullanmak istiyorsunuz
    - xAI kimlik doğrulamasını veya model kimliklerini yapılandırıyorsunuz
summary: OpenClaw'da xAI Grok modellerini kullanın
title: xAI
x-i18n:
    generated_at: "2026-07-16T17:53:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c78617876f18fbb51bd3c8485f764a5b456b6d746476142bb0c5ecdb3decfb3a
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw, Grok modelleri için paketle birlikte gelen bir `xai` sağlayıcı plugini sunar. Önerilen
yol, uygun bir SuperGrok veya X Premium aboneliğiyle Grok OAuth kullanmaktır.
Gateway, yapılandırma, yönlendirme ve araçlar yerel kalır; yalnızca Grok
istekleri xAI'ın API'sine gider.

OAuth, bir xAI API anahtarı veya Grok Build uygulaması gerektirmez. OpenClaw,
xAI'ın paylaşılan OAuth istemcisini kullandığından xAI, izin ekranında yine de
Grok Build'i gösterebilir.

## Kurulum

<Steps>
  <Step title="Yeni kurulum">
    Arka plan hizmeti kurulumu ile ilk yapılandırmayı çalıştırın, ardından
    model/kimlik doğrulama adımında xAI/Grok OAuth'u seçin:

    ```bash
    openclaw onboard --install-daemon
    ```

    Bir VPS'de veya SSH üzerinden xAI OAuth'u doğrudan seçin; cihaz koduyla
    doğrulama kullanır ve localhost geri çağrısı gerektirmez:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="Mevcut kurulum">
    Yalnızca xAI'da oturum açın; sadece Grok'u bağlamak için ilk yapılandırmanın tamamını yeniden çalıştırmayın:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Grok'u varsayılan model olarak ayrıca uygulayın:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    İlk yapılandırmanın tamamını yalnızca Gateway, arka plan hizmeti, kanal,
    çalışma alanı veya diğer kurulum seçimlerini bilinçli olarak değiştirmek istiyorsanız yeniden çalıştırın.

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
OpenClaw, paketle gelen xAI aktarımı olarak xAI Responses API'yi kullanır.
`openclaw models auth login --provider xai --method oauth` veya
`--method api-key` kaynağındaki aynı kimlik bilgisi; `web_search` (sağlayıcı kimliği `grok`), `x_search`,
`code_execution`, konuşma/transkripsiyon ve xAI görüntü/video üretimine de güç sağlar. Bir
xAI anahtarını `plugins.entries.xai.config.webSearch.apiKey` altında saklarsanız
paketle gelen xAI model sağlayıcısı bunu yedek seçenek olarak da yeniden kullanır.
</Note>

## OAuth sorunlarını giderme

- SSH, Docker, VPS veya diğer uzak kurulumlar için
  `openclaw models auth login --provider xai --method oauth` kullanın; localhost geri çağrısı yerine
  cihaz koduyla doğrulama kullanır.
- Oturum açma başarılı olduğu hâlde Grok varsayılan model değilse
  `openclaw models set xai/grok-4.3` komutunu çalıştırın.
- Kaydedilmiş xAI kimlik doğrulama profillerini inceleyin:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- Hangi hesapların OAuth API belirteçleri alabileceğine xAI karar verir. Bir hesap
  uygun değilse API anahtarı yolunu kullanın veya aboneliği xAI tarafında kontrol edin.

<Tip>
SSH, Docker veya bir VPS üzerinden oturum açarken `xai-oauth` kullanın. OpenClaw bir
URL ve kısa kod yazdırır; uzak işlem tamamlanan belirteç alışverişi için
xAI'ı yoklarken herhangi bir yerel tarayıcıda oturum açmayı tamamlayın.
</Tip>

## Yerleşik katalog

Model seçicilerde seçilebilir kimlikler. Plugin, mevcut yapılandırmalar için eski Grok 3,
Grok 4, Grok 4 Fast, Grok 4.1 Fast ve Grok Code kimliklerini çözümlemeye devam eder;
[eski uyumluluk ve değişken takma adlara](#legacy-compatibility-and-moving-aliases) bakın.

| Aile           | Model kimlikleri                                              |
| -------------- | ------------------------------------------------------------ |
| Grok 4.5       | `grok-4.5` (takma adlar: `grok-4.5-latest`, `grok-build-latest`) |
| Grok Build 0.1 | `grok-build-0.1`                                             |
| Grok 4.3       | `grok-4.3` (takma adlar: `grok-4.3-latest`, `grok-latest`)       |
| Grok 4.20      | `grok-4.20-0309-reasoning`, `grok-4.20-0309-non-reasoning`   |

<Tip>
Kullanılabildiği yerlerde genel sohbet, kodlama ve aracı tabanlı çalışmalar için `grok-4.5` kullanın.
Grok 4.3, bölgesel açıdan güvenli kurulum varsayılanı olmaya devam eder; `grok-build-0.1` ve
tarihli Grok 4.20 varyantlarının ikisi de seçilebilir durumda kalır.
</Tip>

## Özellik kapsamı

Paketle gelen plugin, desteklenen xAI API'lerini OpenClaw'ın paylaşılan sağlayıcı ve
araç sözleşmeleriyle eşler. Paylaşılan sözleşmeye uymayan yetenekler
aşağıda veya bilinen sınırlamalar altında listelenmiştir.

| xAI yeteneği                | OpenClaw yüzeyi                         | Durum                                                |
| -------------------------- | --------------------------------------- | ---------------------------------------------------- |
| Sohbet / Responses         | `xai/<model>` model sağlayıcısı         | Evet                                                 |
| Sunucu tarafı web araması  | `web_search` sağlayıcısı `grok`         | Evet                                                 |
| Sunucu tarafı X araması    | `x_search` aracı                       | Evet                                                 |
| Sunucu tarafı kod yürütme  | `code_execution` aracı                 | Evet                                                 |
| Görüntüler                 | `image_generate`                        | Evet                                                 |
| Videolar                   | `video_generate`                        | Evet                                                 |
| Toplu metinden konuşmaya   | `messages.tts.provider: "xai"` / `tts`  | Evet                                                 |
| Akışlı TTS                 | `textToSpeechStream`                    | `wss://api.x.ai/v1/tts` aracılığıyla evet (gerçek zamanlı ses değil) |
| Toplu konuşmadan metne     | `tools.media.audio` medya anlama | Evet                                                 |
| Akışlı konuşmadan metne    | Sesli Arama `streaming.provider: "xai"`  | Evet                                                 |
| Gerçek zamanlı ses         | Konuşma `talk.realtime.provider: "xai"` | Evet; yerel Konuşma Node'ları için gateway aktarımı |
| Dosyalar / toplu işlemler  | Yalnızca genel model API uyumluluğu      | Birinci sınıf bir OpenClaw aracı değil               |

<Note>
OpenClaw; medya üretimi ve toplu transkripsiyon için xAI'ın REST görüntü/video/TTS/STT API'lerini,
canlı sesli arama transkripsiyonu için xAI'ın akışlı STT WebSocket'ini,
Konuşma gerçek zamanlı oturumları için xAI'ın Grok Voice Agent WebSocket'ini,
sohbet, arama ve kod yürütme araçları içinse Responses API'yi kullanır.
</Note>

### Eski hızlı mod uyumluluğu

`/fast on` veya `agents.defaults.models["xai/<model>"].params.fastMode: true`,
eski xAI yapılandırmalarını hâlâ aşağıdaki şekilde yeniden yazar. Bu hedef kimlikler
yalnızca uyumluluk için korunur; yeni yapılandırmalar için mevcut seçilebilir
modelleri kullanın.

| Kaynak model  | Hızlı mod hedefi   |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### Eski uyumluluk ve değişken takma adlar

Eski takma adlar aşağıdaki şekilde normalleştirilir:

| Eski takma ad                                                 | Normalleştirilmiş kimlik |
| ------------------------------------------------------------- | ------------------------ |
| `grok-code-fast-1`, `grok-code-fast`, `grok-code-fast-1-0825` | `grok-build-0.1` |

Tarihli 0309 kimlikleri seçilebilir katalog girdileridir. OpenClaw, xAI'ın kararlı, en yeni,
beta, deneysel ve tarihli takma adların anlamları üzerindeki denetimini koruması için diğer tüm
güncel Grok 4.20 takma adlarını olduğu gibi gönderir. Genel `grok-latest` takma adı da
olduğu gibi korunur.

xAI aşağıdaki tam kimlikleri kullanımdan kaldırmıştır. OpenClaw bunları yayımlanmış yapılandırmalar için,
güncel yönlendirme hedeflerinin sınırlamaları ve fiyatlandırmasıyla birlikte gizli uyumluluk
satırları olarak korur:

| Kullanımdan kaldırılan kimlikler                                      | Güncel davranış                         |
| -------------------------------------------------------------------- | --------------------------------------- |
| `grok-4-1-fast-reasoning`, `grok-4-fast-reasoning`, `grok-4-0709`    | `low` akıl yürütmeli Grok 4.3    |
| `grok-4-1-fast-non-reasoning`, `grok-4-fast-non-reasoning`, `grok-3` | Akıl yürütmesi devre dışı Grok 4.3 |
| `grok-code-fast-1`                                                   | Grok Build 0.1                          |
| `grok-imagine-image-pro`                                             | Grok Imagine Görüntü Kalitesi           |

`openclaw doctor --fix`, kalıcı xAI sunucu aracı varsayılanlarını ve
kullanımdan kaldırılan kaliteli görüntü kısa adını günceller, eski oluşturulmuş katalog satırlarını kaldırır ve
etkin 4.20 satırlarındaki eski bağlam meta verilerini onarır. Etkin 4.20
`beta-latest` takma adlarını tarihli bir anlık görüntüye sabitlemez.

## Özellikler

<Warning>
  `x_search` ve `code_execution`, xAI'ın sunucularında çalışır. xAI, her 1.000
  araç çağrısı için $5 ve buna ek olarak modelin giriş ve çıkış belirteçlerini ücretlendirir. Her aracın
  `enabled` ayarı atlandığında OpenClaw bunu yalnızca etkin bir xAI modeli için sunar.
  Bilinen bir xAI dışı model sağlayıcısı, araç başına açık bir `enabled: true` gerektirir;
  eksik veya çözümlenemeyen sağlayıcı güvenli biçimde başarısız olur. xAI kimlik doğrulaması her zaman gereklidir
  ve `enabled: false`, aracı tüm sağlayıcılar için devre dışı bırakır.
</Warning>

<AccordionGroup>
  <Accordion title="Web araması">
    Paketle gelen `grok` web araması sağlayıcısı önce xAI OAuth'u tercih eder, ardından
    `XAI_API_KEY` veya bir plugin web araması anahtarına geri döner:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Video üretimi">
    Paketle gelen `xai` plugini, paylaşılan
    `video_generate` aracı üzerinden video üretimini kaydeder.

    - Varsayılan model: `xai/grok-imagine-video`
    - Ek model: `xai/grok-imagine-video-1.5`
    - Klasik modlar: metinden videoya, görüntüden videoya, referans görüntü üretimi,
      uzak video düzenleme ve uzak video uzatma
    - Video 1.5 modu: tam olarak bir ilk kare görüntüsüyle yalnızca görüntüden videoya
    - En-boy oranları: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`;
      belirtilmediğinde klasik ve Video 1.5 görüntüden videoya modları kaynak görüntünün oranını devralır
    - Çözünürlükler: klasik `480P`/`720P`; Video 1.5 ayrıca `1080P` desteği sunar; tüm
      üretim modları varsayılan olarak `480P` kullanır
    - Süre: üretim/görüntüden videoya için 1-15 saniye, klasik
      `reference_image` rolleri kullanılırken 1-10 saniye, klasik uzatma için 2-10 saniye
    - Referans görüntü üretimi: sağlanan her görüntü için `imageRoles` değerini `reference_image` olarak ayarlayın;
      xAI bu tür en fazla 7 görüntü kabul eder
    - Video düzenleme/uzatma, giriş videosunun en-boy oranını ve çözünürlüğünü devralır;
      bu işlemler geometri geçersiz kılmalarını kabul etmez
    - Varsayılan işlem zaman aşımı: `video_generate.timeoutMs`
      veya `agents.defaults.videoGenerationModel.timeoutMs` ayarlanmadığı sürece 600 saniye

    <Warning>
    Yerel video arabellekleri kabul edilmez. Video düzenleme/uzatma girdileri için uzak `http(s)` URL'lerini kullanın.
    OpenClaw bunları xAI için veri URL'leri olarak kodladığından görüntüden videoya, yerel görüntü
    arabelleklerini kabul eder.
    </Warning>

    Video 1.5 ayrıca xAI'ın `grok-imagine-video-1.5-preview` ve
    `grok-imagine-video-1.5-2026-05-30` tanımlayıcılarını da tanır. OpenClaw seçilen
    tanımlayıcıyı değiştirmeden iletir, ancak yalnızca görüntü doğrulamasını aynı şekilde uygular.

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
    Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için
    [Video Üretimi](/tr/tools/video-generation) bölümüne bakın.
    </Note>

  </Accordion>

  <Accordion title="Görüntü üretimi">
    Paketle gelen `xai` plugini, paylaşılan
    `image_generate` aracı üzerinden görüntü üretimini kaydeder.

    - Varsayılan görüntü modeli: `xai/grok-imagine-image`
    - Ek model: `xai/grok-imagine-image-quality`
    - Modlar: metinden görüntüye ve referans görüntü düzenleme
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
    değiştirilmeden iletilir.

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
    xAI ayrıca `quality`, `mask`, `user` ve bir `auto` en-boy oranını belgeler.
    OpenClaw şu anda yalnızca sağlayıcılar arasında ortak olan görüntü denetimlerini iletir;
    yalnızca yerel olarak sunulan bu ayarlar `image_generate` üzerinden kullanıma açılmaz.
    </Note>

  </Accordion>

  <Accordion title="Metinden sese">
    Paketle gelen `xai` Plugin'i, paylaşılan `tts`
    sağlayıcı yüzeyi üzerinden metinden sese işlevini kaydeder.

    - Sesler: xAI'dan kimliği doğrulanmış canlı katalog; şu komutla listeleyin:
      `openclaw infer tts voices --provider xai`
    - Çevrimdışı yedek sesler: `ara`, `eve`, `leo`, `rex`, `sal`
    - Varsayılan ses: `eve`
    - Hesaba özel ses kimlikleri, yerleşik katalog yanıtında bulunmasalar bile
      iletilir
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
    OpenClaw, arabelleğe alınmış sentez için xAI'ın toplu `/v1/tts` uç noktasını,
    kimliği doğrulanmış `/v1/tts/voices` katalog keşfini ve akış sentezi için yerel
    `wss://api.x.ai/v1/tts` öğesini kullanır. Akış yalnızca yerel `api.x.ai`
    ana makinesiyle sınırlıdır; bu nedenle özel `baseUrl` değerleri bu
    yolda reddedilir. Mevcut dil, ses, kodek ve hız denetimlerini kullanır; örnekleme
    hızı ve bit hızı için xAI varsayılanları geçerlidir. Ses dosyası sentezi, yapılandırılan
    tüm kodeklere uyar. Sesli not hedefleri, xAI'ın ham kodekleri kodek/hız meta verilerini
    taşımadığı için akışta ve arabelleğe alınmış yedek işlemede MP3 kullanır.
    Akış önce `text.delta`, ardından
    `text.done` gönderir; `audio.delta`, `audio.done` veya `error` alır ve her
    ses parçasında yenilenen bir boşta kalma `timeoutMs` uygular. Bu, gerçek
    zamanlı ses oturumlarından ayrıdır. xAI'ın [Akış TTS API'si](https://docs.x.ai/developers/rest-api-reference/inference/voice) sözleşmesine bakın.
    </Note>

  </Accordion>

  <Accordion title="Konuşmadan metne">
    Paketle gelen `xai` Plugin'i, OpenClaw'ın medya anlama
    transkripsiyon yüzeyi üzerinden toplu konuşmadan metne işlevini kaydeder.

    - Uç nokta: xAI REST `/v1/stt`
    - Girdi yolu: çok parçalı ses dosyası yükleme
    - Model seçimi: xAI, transkripsiyon modelini dahili olarak seçer;
      uç noktada model seçici yoktur
    - Discord ses kanalı bölümleri ve kanal ses ekleri dâhil olmak üzere,
      gelen ses transkripsiyonunun `tools.media.audio` öğesini okuduğu her yerde kullanılır

    Gelen ses transkripsiyonunda xAI kullanımını zorunlu kılmak için:

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
    yüzeyi tarafından kabul edilir ancak xAI REST STT entegrasyonu, geçerli genel xAI
    uç noktasıyla yalnızca bunlar eşleştiği için sadece dosyayı ve dili iletir.

  </Accordion>

  <Accordion title="Akışlı konuşmadan metne">
    Paketle gelen `xai` Plugin'i, canlı sesli arama sesi için
    gerçek zamanlı bir transkripsiyon sağlayıcısı da kaydeder.

    - Uç nokta: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Varsayılan kodlama: `mulaw`
    - Varsayılan örnekleme hızı: `8000`
    - Varsayılan uç nokta belirleme: `800ms`
    - Ara transkripsiyonlar: varsayılan olarak etkin

    Voice Call'un Twilio medya akışı G.711 mu-law ses kareleri gönderir; bu nedenle
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
    `alaw`), `interimResults`, `endpointingMs` ve `language` şeklindedir.

    <Note>
    Bu akış sağlayıcısı, Voice Call'un gerçek zamanlı transkripsiyon yolu içindir.
    Discord kısa bölümler kaydeder ve bunun yerine toplu
    `tools.media.audio` transkripsiyon yolunu kullanır.
    </Note>

  </Accordion>

  <Accordion title="Gerçek zamanlı ses (Talk)">
    Paketle gelen `xai` Plugin'i, paylaşılan `registerRealtimeVoiceProvider` sözleşmesi
    üzerinden Talk modu için Grok Voice Agent gerçek zamanlı oturumlarını kaydeder.

    - Uç nokta: `wss://api.x.ai/v1/realtime?model=<voice-model>`
    - Varsayılan model: `grok-voice-latest`
    - Varsayılan ses: `eve`
    - Aktarım: `gateway-relay` (iOS, Android ve Control UI aktarma yolları)
    - Ses: PCM16 24 kHz veya G.711 µ-law 8 kHz
    - Araya girme: xAI sunucu VAD'si yanıtı keser; OpenClaw sıraya alınmış oynatmayı
      temizler ve oynatılmamış sağlayıcı geçmişini kısaltır

    Talk'u Gateway üzerinde yapılandırın:

    ```json5
    {
      talk: {
        realtime: {
          provider: "xai",
          mode: "realtime",
          transport: "gateway-relay",
          brain: "agent-consult",
          providers: {
            xai: {
              model: "grok-voice-latest",
              voice: "eve",
              // Yalnızca sağlayıcı tarafında oturumun yeniden oynatılması kabul edilebilirse etkinleştirin.
              sessionResumption: false,
            },
          },
        },
      },
      env: { XAI_API_KEY: "xai-..." },
    }
    ```

    Voice Call veya paylaşılan gerçek zamanlı seçiciler aynı sağlayıcı eşlemesini yeniden
    kullandığında, sağlayıcıya ait yapılandırma
    `plugins.entries.voice-call.config.realtime.providers.xai` üzerinden de çözümlenir.
    Desteklenen anahtarlar `apiKey`, `baseUrl`, `model`, `voice`, `vadThreshold`, `silenceDurationMs`,
    `prefixPaddingMs`, `reasoningEffort` ve `sessionResumption` şeklindedir.
    `reasoningEffort`, xAI Voice Agent API'siyle uyumlu olarak yalnızca `high` veya `none` kabul eder.

    xAI'ın sunucu VAD'si her zaman yanıt oluşturur ve ses kesintisini işler.
    `consultRouting: "provider-direct"` kullanın; zorunlu transkripsiyon yönlendirmesi ve
    ses girdisi kesintisinin devre dışı bırakılması xAI Voice Agent protokolü tarafından desteklenmez.

    <Note>
    xAI OAuth veya `XAI_API_KEY`, gerçek zamanlı ses için kimlik doğrulaması yapabilir. Tarayıcıya ait
    WebRTC henüz bu sağlayıcı yüzeyinin parçası değildir; yerel Node'larda gateway-relay Talk'u
    veya Control UI aktarma yolunu kullanın.
    </Note>

    <Note>
    `sessionResumption` varsayılan olarak `false` değerini alır. `true` olarak ayarlandığında OpenClaw,
    yeniden bağlantıdan sonra aynı konuşmayı sürdürmeye yetecek oturum durumunu tutmasını
    xAI'dan ister ve ardından döndürülen konuşma kimliğiyle yeniden bağlanır. Sağlayıcı
    tarafında yeniden oynatma/saklama kabul edilebilir değilse bunu devre dışı bırakın; kesintiye
    uğrayan soketler bu durumda sessizce yeni bir konuşma başlatmak yerine güvenli biçimde başarısız olur.
    </Note>

  </Accordion>

  <Accordion title="x_search yapılandırması">
    Paketle gelen xAI Plugin'i, Grok aracılığıyla X (eski adıyla Twitter) içeriğinde
    arama yapmak için `x_search` öğesini bir OpenClaw aracı olarak sunar.

    Yapılandırma yolu: `plugins.entries.xai.config.xSearch`

    | Anahtar           | Tür     | Varsayılan                | Açıklama                                         |
    | ----------------- | ------- | ------------------------- | ------------------------------------------------ |
    | `enabled`         | boolean | xAI modelleri için otomatik | Devre dışı bırakın veya bilinen bir xAI dışı sağlayıcı için etkinleştirin |
    | `model`           | string  | `grok-4.3`                | x_search isteklerinde kullanılan model           |
    | `baseUrl`         | string  | -                         | xAI Responses temel URL'sini geçersiz kılma      |
    | `inlineCitations` | boolean | -                         | Sonuçlara satır içi atıfları dâhil et             |
    | `maxTurns`        | number  | -                         | En fazla konuşma turu                             |
    | `timeoutSeconds`  | number  | `30`                      | Saniye cinsinden istek zaman aşımı                |
    | `cacheTtlMinutes` | number  | `15`                      | Dakika cinsinden önbellek yaşam süresi            |

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

  <Accordion title="Kod yürütme yapılandırması">
    Paketle gelen xAI Plugin'i, xAI'ın korumalı alan ortamında uzaktan kod yürütmek için
    `code_execution` öğesini bir OpenClaw aracı olarak sunar.

    Yapılandırma yolu: `plugins.entries.xai.config.codeExecution`

    | Anahtar          | Tür     | Varsayılan               | Açıklama                                         |
    | ---------------- | ------- | ------------------------ | ------------------------------------------------ |
    | `enabled`        | boolean | xAI modelleri için otomatik | Devre dışı bırakın veya bilinen bir xAI dışı sağlayıcı için etkinleştirin |
    | `model`          | string  | `grok-4.3`               | Kod yürütme isteklerinde kullanılan model        |
    | `maxTurns`       | number  | -                        | En fazla konuşma turu                             |
    | `timeoutSeconds` | number  | `30`                     | Saniye cinsinden istek zaman aşımı                |

    <Note>
    Bu, yerel [`exec`](/tr/tools/exec) değil, uzak xAI korumalı alan yürütmesidir.
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

  <Accordion title="Bilinen sınırlamalar">
    - xAI kimlik doğrulaması bir API anahtarı, ortam değişkeni, plugin yapılandırması
      yedeği veya uygun bir xAI hesabıyla OAuth kullanabilir. OAuth, localhost
      geri çağrısı olmadan cihaz kodu doğrulamasını kullanır. Hangi hesapların
      OAuth API token'ları alabileceğine xAI karar verir ve OpenClaw, Grok Build
      uygulamasını gerektirmese de onay sayfasında Grok Build gösterilebilir.
    - OpenClaw şu anda xAI çok aracılı model ailesini kullanıma sunmaz. xAI
      bu modelleri Responses API üzerinden sunar ancak bu modeller OpenClaw'ın
      paylaşılan aracı döngüsünün kullandığı istemci taraflı veya özel araçları
      kabul etmez. Bkz.
      [xAI çok aracılı sistem sınırlamaları](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - xAI Realtime ses özelliği şu anda yalnızca gateway aktarımına dayalı Talk taşımasını
      kullanıma sunar. Tarayıcı tarafından yönetilen sağlayıcı WebSocket oturumları
      henüz Control UI'a bağlanmamıştır.
    - xAI görüntü `quality`, görüntü `mask` ve yalnızca yerel kullanıma özgü ek en-boy oranları,
      paylaşılan `image_generate` aracında bunlara karşılık gelen
      sağlayıcılar arası denetimler bulunana kadar kullanıma sunulmaz.
  </Accordion>

  <Accordion title="Gelişmiş notlar">
    - OpenClaw, paylaşılan çalıştırıcı yolunda xAI'a özgü araç şeması ve araç çağrısı uyumluluk
      düzeltmelerini otomatik olarak uygular.
    - Yerel xAI istekleri varsayılan olarak `tool_stream: true`. Bunu
      devre dışı bırakmak için `agents.defaults.models["xai/<model>"].params.tool_stream` değerini `false`
      olarak ayarlayın.
    - Paketle gelen xAI sarmalayıcısı, yerel xAI isteklerini göndermeden önce desteklenmeyen contains-count şema sınırlarını
      ve desteklenmeyen akıl yürütme *çabası* yük anahtarlarını kaldırır.
      Grok 4.5 düşük, orta ve yüksek çabayı destekler (varsayılan yüksek).
      Grok 4.3 sıfır, düşük, orta ve yüksek çabayı destekler (varsayılan düşük).
      Akıl yürütme yeteneğine sahip diğer xAI modelleri yapılandırılabilir bir
      çaba denetimi sunmaz ancak önceki şifrelenmiş akıl yürütmenin sonraki
      turlarda yeniden oynatılabilmesi için yine de `include: ["reasoning.encrypted_content"]`
      isteğinde bulunur.
    - `web_search`, `x_search` ve `code_execution`, OpenClaw
      araçları olarak kullanıma sunulur. OpenClaw, her sohbet turuna tüm yerel
      araçları eklemek yerine yalnızca her aracın gerektirdiği belirli yerleşik
      xAI aracını o aracın isteğine ekler.
    - Grok `web_search`, `plugins.entries.xai.config.webSearch.baseUrl` değerini okur.
      `x_search`, `plugins.entries.xai.config.xSearch.baseUrl` değerini okur, ardından
      Grok web araması temel URL'sine geri döner.
    - `x_search` ve `code_execution`, çekirdek model çalışma zamanında sabit kodlanmak yerine
      paketle gelen xAI plugin'i tarafından yönetilir.
    - `code_execution`, yerel
      [`exec`](/tr/tools/exec) değil, uzak xAI korumalı alan yürütmesidir.
  </Accordion>
</AccordionGroup>

## Canlı test

xAI medya yolları birim testleri ve isteğe bağlı canlı test paketleriyle kapsanır. Canlı
yoklamaları çalıştırmadan önce işlem ortamında `XAI_API_KEY` dışa aktarın.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/x-search.live.test.ts
OPENCLAW_LIVE_GATEWAY_MODELS="xai/grok-4.5,xai/grok-build-0.1,xai/grok-4.3,xai/grok-4.20-0309-reasoning,xai/grok-4.20-0309-non-reasoning" OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0 OPENCLAW_LIVE_GATEWAY_SMOKE=0 pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Sağlayıcıya özgü canlı dosya; normal TTS, telefon kullanımına uygun PCM
TTS sentezler, xAI toplu STT üzerinden sesin dökümünü çıkarır, aynı PCM'i xAI
gerçek zamanlı STT üzerinden akıtır, metinden görüntü çıktısı üretir ve bir referans
görüntüyü düzenler. Paylaşılan görüntü canlı dosyası; aynı xAI sağlayıcısını OpenClaw'ın
çalışma zamanı seçimi, yedek mekanizması, normalleştirme ve medya eki yolu üzerinden doğrular.
İsteğe bağlı Video 1.5 senaryosu, 1080P çözünürlükte üretilmiş bir ilk kare görüntüsü gönderir ve
tamamlanan video indirmesini doğrular.

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Video oluşturma" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Tüm sağlayıcılar" href="/tr/providers/index" icon="grid-2">
    Daha kapsamlı sağlayıcı genel görünümü.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve düzeltmeler.
  </Card>
</CardGroup>

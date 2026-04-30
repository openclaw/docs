---
read_when:
    - OpenClaw'da MiniMax modellerini istiyorsunuz
    - MiniMax kurulum rehberliğine ihtiyacınız var
summary: OpenClaw'da MiniMax modellerini kullanın
title: MiniMax
x-i18n:
    generated_at: "2026-04-30T09:40:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ef833258692c78f40a160131c2a0d36f84889e5d5196ddadb648485ba8cb04a
    source_path: providers/minimax.md
    workflow: 16
---

OpenClaw'ın MiniMax sağlayıcısı varsayılan olarak **MiniMax M2.7** kullanır.

MiniMax ayrıca şunları sağlar:

- T2A v2 üzerinden paketli konuşma sentezi
- `MiniMax-VL-01` üzerinden paketli görüntü anlama
- `music-2.6` üzerinden paketli müzik üretimi
- MiniMax Coding Plan arama API'si üzerinden paketli `web_search`

Sağlayıcı ayrımı:

| Sağlayıcı kimliği | Kimlik doğrulama | Yetenekler                                                                                          |
| ----------------- | ---------------- | --------------------------------------------------------------------------------------------------- |
| `minimax`         | API anahtarı     | Metin, görüntü üretimi, müzik üretimi, video üretimi, görüntü anlama, konuşma, web araması          |
| `minimax-portal`  | OAuth            | Metin, görüntü üretimi, müzik üretimi, video üretimi, görüntü anlama, konuşma                       |

## Yerleşik katalog

| Model                    | Tür              | Açıklama                                  |
| ------------------------ | ---------------- | ----------------------------------------- |
| `MiniMax-M2.7`           | Sohbet (akıl yürütme) | Varsayılan barındırılan akıl yürütme modeli |
| `MiniMax-M2.7-highspeed` | Sohbet (akıl yürütme) | Daha hızlı M2.7 akıl yürütme katmanı      |
| `MiniMax-VL-01`          | Görme            | Görüntü anlama modeli                     |
| `image-01`               | Görüntü üretimi  | Metinden görüntüye ve görüntüden görüntüye düzenleme |
| `music-2.6`              | Müzik üretimi    | Varsayılan müzik modeli                   |
| `music-2.5`              | Müzik üretimi    | Önceki müzik üretimi katmanı              |
| `music-2.0`              | Müzik üretimi    | Eski müzik üretimi katmanı                |
| `MiniMax-Hailuo-2.3`     | Video üretimi    | Metinden videoya ve görüntü referansı akışları |

## Başlarken

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **En uygunu:** API anahtarı gerektirmeden OAuth üzerinden MiniMax Coding Plan ile hızlı kurulum.

    <Tabs>
      <Tab title="Uluslararası">
        <Steps>
          <Step title="Onboarding'i çalıştırın">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Bu, `api.minimax.io` üzerinden kimlik doğrulaması yapar.
          </Step>
          <Step title="Modelin kullanılabilir olduğunu doğrulayın">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Çin">
        <Steps>
          <Step title="Onboarding'i çalıştırın">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Bu, `api.minimaxi.com` üzerinden kimlik doğrulaması yapar.
          </Step>
          <Step title="Modelin kullanılabilir olduğunu doğrulayın">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    OAuth kurulumları `minimax-portal` sağlayıcı kimliğini kullanır. Model referansları `minimax-portal/MiniMax-M2.7` biçimini izler.
    </Note>

    <Tip>
    MiniMax Coding Plan için yönlendirme bağlantısı (%10 indirim): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API anahtarı">
    **En uygunu:** Anthropic uyumlu API ile barındırılan MiniMax.

    <Tabs>
      <Tab title="Uluslararası">
        <Steps>
          <Step title="Onboarding'i çalıştırın">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Bu, temel URL olarak `api.minimax.io` yapılandırır.
          </Step>
          <Step title="Modelin kullanılabilir olduğunu doğrulayın">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Çin">
        <Steps>
          <Step title="Onboarding'i çalıştırın">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Bu, temel URL olarak `api.minimaxi.com` yapılandırır.
          </Step>
          <Step title="Modelin kullanılabilir olduğunu doğrulayın">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Yapılandırma örneği

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    Anthropic uyumlu akış yolunda, `thinking` değerini açıkça kendiniz ayarlamadığınız sürece OpenClaw MiniMax düşünmesini varsayılan olarak devre dışı bırakır. MiniMax'in akış uç noktası, yerel Anthropic düşünme blokları yerine OpenAI tarzı delta parçalarında `reasoning_content` yayar; bu da örtük olarak etkin bırakılırsa dahili akıl yürütmenin görünür çıktıya sızmasına neden olabilir.
    </Warning>

    <Note>
    API anahtarı kurulumları `minimax` sağlayıcı kimliğini kullanır. Model referansları `minimax/MiniMax-M2.7` biçimini izler.
    </Note>

  </Tab>
</Tabs>

## `openclaw configure` ile yapılandırma

JSON düzenlemeden MiniMax'i ayarlamak için etkileşimli yapılandırma sihirbazını kullanın:

<Steps>
  <Step title="Sihirbazı başlat">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Model/kimlik doğrulamayı seç">
    Menüden **Model/auth** seçeneğini seçin.
  </Step>
  <Step title="Bir MiniMax kimlik doğrulama seçeneği belirleyin">
    Kullanılabilir MiniMax seçeneklerinden birini seçin:

    | Kimlik doğrulama seçeneği | Açıklama |
    | --- | --- |
    | `minimax-global-oauth` | Uluslararası OAuth (Kodlama Planı) |
    | `minimax-cn-oauth` | Çin OAuth (Kodlama Planı) |
    | `minimax-global-api` | Uluslararası API anahtarı |
    | `minimax-cn-api` | Çin API anahtarı |

  </Step>
  <Step title="Varsayılan modelinizi seçin">
    İstendiğinde varsayılan modelinizi seçin.
  </Step>
</Steps>

## Yetenekler

### Görüntü oluşturma

MiniMax plugin, `image_generate` aracı için `image-01` modelini kaydeder. Şunları destekler:

- En boy oranı denetimiyle **metinden görüntü oluşturma**
- En boy oranı denetimiyle **görüntüden görüntü düzenleme** (konu referansı)
- İstek başına en fazla **9 çıktı görüntüsü**
- Düzenleme isteği başına en fazla **1 referans görüntü**
- Desteklenen en boy oranları: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Görüntü oluşturma için MiniMax kullanmak üzere, onu görüntü oluşturma sağlayıcısı olarak ayarlayın:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Plugin, metin modelleriyle aynı `MINIMAX_API_KEY` veya OAuth kimlik doğrulamasını kullanır. MiniMax zaten ayarlanmışsa ek yapılandırma gerekmez.

Hem `minimax` hem de `minimax-portal`, aynı `image-01` modeliyle `image_generate` kaydeder. API anahtarı kurulumları `MINIMAX_API_KEY` kullanır; OAuth kurulumları bunun yerine paketlenmiş `minimax-portal` kimlik doğrulama yolunu kullanabilir.

Görüntü oluşturma her zaman MiniMax'in özel görüntü uç noktasını
(`/v1/image_generation`) kullanır ve `models.providers.minimax.baseUrl` değerini yok sayar,
çünkü bu alan sohbet/Anthropic uyumlu temel URL'yi yapılandırır. Görüntü oluşturmayı
CN uç noktası üzerinden yönlendirmek için `MINIMAX_API_HOST=https://api.minimaxi.com` ayarlayın; varsayılan küresel uç nokta
`https://api.minimax.io` şeklindedir.

Onboarding veya API anahtarı kurulumu açık `models.providers.minimax`
girdileri yazdığında, OpenClaw `MiniMax-M2.7` ve
`MiniMax-M2.7-highspeed` modellerini yalnızca metin sohbet modelleri olarak somutlaştırır. Görüntü anlama,
plugin sahipliğindeki `MiniMax-VL-01` medya sağlayıcısı üzerinden ayrı olarak sunulur.

<Note>
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için [Görüntü Oluşturma](/tr/tools/image-generation) bölümüne bakın.
</Note>

### Metinden konuşmaya

Paketlenmiş `minimax` plugin, MiniMax T2A v2'yi `messages.tts` için bir konuşma sağlayıcısı olarak kaydeder.

- Varsayılan TTS modeli: `speech-2.8-hd`
- Varsayılan ses: `English_expressive_narrator`
- Desteklenen paketlenmiş model kimlikleri arasında `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` ve `speech-01-turbo` bulunur.
- Kimlik doğrulama çözümleme sırası: `messages.tts.providers.minimax.apiKey`, ardından
  `minimax-portal` OAuth/token kimlik doğrulama profilleri, ardından Token Plan ortam
  anahtarları (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), ardından `MINIMAX_API_KEY`.
- Hiçbir TTS ana makinesi yapılandırılmamışsa OpenClaw yapılandırılmış
  `minimax-portal` OAuth ana makinesini yeniden kullanır ve `/anthropic` gibi
  Anthropic uyumlu yol soneklerini kaldırır.
- Normal ses ekleri MP3 olarak kalır.
- Feishu ve Telegram gibi sesli not hedefleri, MiniMax MP3'ten `ffmpeg` ile 48kHz Opus'a dönüştürülür, çünkü Feishu/Lark dosya API'si yerel ses mesajları için yalnızca `file_type: "opus"` kabul eder.
- MiniMax T2A kesirli `speed` ve `vol` değerlerini kabul eder, ancak `pitch` bir
  tam sayı olarak gönderilir; OpenClaw API isteğinden önce kesirli `pitch` değerlerini keser.

| Ayar                                     | Ortam değişkeni        | Varsayılan                    | Açıklama                         |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | MiniMax T2A API ana makinesi.    |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | TTS model kimliği.               |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Konuşma çıktısı için kullanılan ses kimliği. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Oynatma hızı, `0.5..2.0`.        |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Ses düzeyi, `(0, 10]`.           |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Tam sayı perde kaydırma, `-12..12`. |

### Müzik oluşturma

Paketlenmiş MiniMax plugin, hem `minimax` hem de `minimax-portal` için paylaşılan `music_generate` aracı üzerinden müzik oluşturmayı kaydeder.

- Varsayılan müzik modeli: `minimax/music-2.6`
- OAuth müzik modeli: `minimax-portal/music-2.6`
- Ayrıca `minimax/music-2.5` ve `minimax/music-2.0` desteklenir
- Prompt denetimleri: `lyrics`, `instrumental`, `durationSeconds`
- Çıktı biçimi: `mp3`
- Oturum destekli çalıştırmalar, `action: "status"` dahil olmak üzere paylaşılan görev/durum akışı üzerinden ayrılır

MiniMax'i varsayılan müzik sağlayıcısı olarak kullanmak için:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.6",
      },
    },
  },
}
```

<Note>
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için [Müzik Oluşturma](/tr/tools/music-generation) bölümüne bakın.
</Note>

### Video oluşturma

Paketlenmiş MiniMax plugin, hem `minimax` hem de `minimax-portal` için paylaşılan `video_generate` aracı üzerinden video oluşturmayı kaydeder.

- Varsayılan video modeli: `minimax/MiniMax-Hailuo-2.3`
- OAuth video modeli: `minimax-portal/MiniMax-Hailuo-2.3`
- Modlar: metinden videoya ve tek görüntü referans akışları
- `aspectRatio` ve `resolution` destekler

MiniMax'i varsayılan video sağlayıcısı olarak kullanmak için:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
Paylaşılan araç parametreleri, sağlayıcı seçimi ve devretme davranışı için [Video Generation](/tr/tools/video-generation) bölümüne bakın.
</Note>

### Görsel anlama

MiniMax Plugin, görsel anlamayı metin kataloğundan ayrı olarak kaydeder:

| Sağlayıcı ID'si | Varsayılan görsel modeli |
| --------------- | ------------------------ |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

Bu nedenle otomatik medya yönlendirme, paketle gelen metin sağlayıcısı kataloğu hâlâ yalnızca metin M2.7 sohbet başvurularını gösterse bile MiniMax görsel anlamayı kullanabilir.

### Web araması

MiniMax Plugin ayrıca MiniMax Coding Plan arama API'si üzerinden `web_search` kaydeder.

- Sağlayıcı ID'si: `minimax`
- Yapılandırılmış sonuçlar: başlıklar, URL'ler, parçacıklar, ilgili sorgular
- Tercih edilen env var: `MINIMAX_CODE_PLAN_KEY`
- Kabul edilen env takma adı: `MINIMAX_CODING_API_KEY`
- Uyumluluk yedeği: zaten bir coding-plan token'ına işaret ettiğinde `MINIMAX_API_KEY`
- Bölge yeniden kullanımı: `plugins.entries.minimax.config.webSearch.region`, ardından `MINIMAX_API_HOST`, ardından MiniMax sağlayıcı temel URL'leri
- Arama, sağlayıcı ID'si `minimax` üzerinde kalır; OAuth CN/küresel kurulumu bölgeyi dolaylı olarak `models.providers.minimax-portal.baseUrl` üzerinden yönlendirebilir

Yapılandırma `plugins.entries.minimax.config.webSearch.*` altında bulunur.

<Note>
Tam web araması yapılandırması ve kullanımı için [MiniMax Search](/tr/tools/minimax-search) bölümüne bakın.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Yapılandırma seçenekleri">
    | Seçenek | Açıklama |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | `https://api.minimax.io/anthropic` tercih edin (Anthropic uyumlu); `https://api.minimax.io/v1`, OpenAI uyumlu yükler için isteğe bağlıdır |
    | `models.providers.minimax.api` | `anthropic-messages` tercih edin; `openai-completions`, OpenAI uyumlu yükler için isteğe bağlıdır |
    | `models.providers.minimax.apiKey` | MiniMax API anahtarı (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` tanımlayın |
    | `agents.defaults.models` | İzin listesinde istediğiniz modellere takma ad verin |
    | `models.mode` | MiniMax'i yerleşiklerin yanına eklemek istiyorsanız `merge` değerini koruyun |
  </Accordion>

  <Accordion title="Düşünme varsayılanları">
    `api: "anthropic-messages"` üzerinde, params/config içinde thinking zaten açıkça ayarlanmamışsa OpenClaw `thinking: { type: "disabled" }` ekler.

    Bu, MiniMax'in akış uç noktasının OpenAI tarzı delta parçalarında `reasoning_content` yaymasını önler; aksi halde iç akıl yürütme görünür çıktıya sızardı.

  </Accordion>

  <Accordion title="Hızlı mod">
    `/fast on` veya `params.fastMode: true`, Anthropic uyumlu akış yolunda `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
  </Accordion>

  <Accordion title="Yedek örneği">
    **Şunun için en iyi:** en güçlü en yeni nesil modelinizi birincil olarak tutup MiniMax M2.7'ye devretmek. Aşağıdaki örnek Opus'u somut bir birincil olarak kullanır; kendi tercih ettiğiniz en yeni nesil birincil modelle değiştirin.

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Coding Plan kullanım ayrıntıları">
    - Coding Plan kullanım API'si: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (coding plan anahtarı gerektirir).
    - OpenClaw, MiniMax coding-plan kullanımını diğer sağlayıcıların kullandığı aynı `% kaldı` gösterimine normalleştirir. MiniMax'in ham `usage_percent` / `usagePercent` alanları tüketilen kota değil, kalan kotadır; bu nedenle OpenClaw bunları tersine çevirir. Sayı tabanlı alanlar mevcut olduğunda önceliklidir.
    - API `model_remains` döndürdüğünde, OpenClaw sohbet modeli girdisini tercih eder, gerektiğinde pencere etiketini `start_time` / `end_time` üzerinden türetir ve coding-plan pencerelerinin ayırt edilmesini kolaylaştırmak için seçilen model adını plan etiketine dahil eder.
    - Kullanım anlık görüntüleri `minimax`, `minimax-cn` ve `minimax-portal` değerlerini aynı MiniMax kota yüzeyi olarak ele alır ve Coding Plan anahtarı env var'larına geri dönmeden önce depolanan MiniMax OAuth'u tercih eder.

  </Accordion>
</AccordionGroup>

## Notlar

- Model başvuruları kimlik doğrulama yolunu izler:
  - API anahtarı kurulumu: `minimax/<model>`
  - OAuth kurulumu: `minimax-portal/<model>`
- Varsayılan sohbet modeli: `MiniMax-M2.7`
- Alternatif sohbet modeli: `MiniMax-M2.7-highspeed`
- İlk kurulum ve doğrudan API anahtarı kurulumu, her iki M2.7 varyantı için yalnızca metin model tanımları yazar
- Görsel anlama, Plugin tarafından sahiplenilen `MiniMax-VL-01` medya sağlayıcısını kullanır
- Kesin maliyet takibine ihtiyacınız varsa `models.json` içindeki fiyatlandırma değerlerini güncelleyin
- Geçerli sağlayıcı ID'sini doğrulamak için `openclaw models list` kullanın, ardından `openclaw models set minimax/MiniMax-M2.7` veya `openclaw models set minimax-portal/MiniMax-M2.7` ile geçiş yapın

<Tip>
MiniMax Coding Plan için yönlendirme bağlantısı (%10 indirim): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Sağlayıcı kuralları için [Model providers](/tr/concepts/model-providers) bölümüne bakın.
</Note>

## Sorun giderme

<AccordionGroup>
  <Accordion title='"Bilinmeyen model: minimax/MiniMax-M2.7"'>
    Bu genellikle **MiniMax sağlayıcısının yapılandırılmadığı** anlamına gelir (eşleşen sağlayıcı girdisi yoktur ve MiniMax auth profili/env anahtarı bulunmamıştır). Bu algılama için düzeltme **2026.1.12** sürümündedir. Şöyle düzeltin:

    - **2026.1.12** sürümüne yükseltin (veya kaynaktan `main` çalıştırın), ardından Gateway'i yeniden başlatın.
    - `openclaw configure` çalıştırıp bir **MiniMax** auth seçeneği belirleyin veya
    - Eşleşen `models.providers.minimax` ya da `models.providers.minimax-portal` bloğunu elle ekleyin veya
    - Eşleşen sağlayıcının eklenebilmesi için `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` ya da bir MiniMax auth profili ayarlayın.

    Model ID'sinin **büyük/küçük harfe duyarlı** olduğundan emin olun:

    - API anahtarı yolu: `minimax/MiniMax-M2.7` veya `minimax/MiniMax-M2.7-highspeed`
    - OAuth yolu: `minimax-portal/MiniMax-M2.7` veya `minimax-portal/MiniMax-M2.7-highspeed`

    Ardından şununla yeniden kontrol edin:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Daha fazla yardım: [Troubleshooting](/tr/help/troubleshooting) ve [FAQ](/tr/help/faq).
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve devretme davranışını seçme.
  </Card>
  <Card title="Görsel oluşturma" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görsel aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Müzik oluşturma" href="/tr/tools/music-generation" icon="music">
    Paylaşılan müzik aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video oluşturma" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="MiniMax Search" href="/tr/tools/minimax-search" icon="magnifying-glass">
    MiniMax Coding Plan üzerinden web araması yapılandırması.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve SSS.
  </Card>
</CardGroup>

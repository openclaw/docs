---
read_when:
    - OpenClaw'da MiniMax modellerini istiyorsunuz.
    - MiniMax kurulum rehberine ihtiyacınız var.
summary: OpenClaw'da MiniMax modellerini kullanma
title: MiniMax
x-i18n:
    generated_at: "2026-04-26T11:39:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b91f8c4c12c993457fb1535bbb2f3401474a3ec432b24189792a20041e756dc
    source_path: providers/minimax.md
    workflow: 15
---

OpenClaw'ın MiniMax sağlayıcısı varsayılan olarak **MiniMax M2.7** kullanır.

MiniMax ayrıca şunları da sağlar:

- T2A v2 ile paketlenmiş konuşma sentezi
- `MiniMax-VL-01` ile paketlenmiş görsel anlama
- `music-2.6` ile paketlenmiş müzik üretimi
- MiniMax Coding Plan arama API'si üzerinden paketlenmiş `web_search`

Sağlayıcı ayrımı:

| Sağlayıcı kimliği | Auth    | Yetenekler                                                                                      |
| ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `minimax`         | API key | Metin, görsel üretimi, müzik üretimi, video üretimi, görsel anlama, konuşma, web arama         |
| `minimax-portal`  | OAuth   | Metin, görsel üretimi, müzik üretimi, video üretimi, görsel anlama, konuşma                    |

## Yerleşik katalog

| Model                    | Tür                | Açıklama                                      |
| ------------------------ | ------------------ | --------------------------------------------- |
| `MiniMax-M2.7`           | Sohbet (reasoning) | Varsayılan barındırılan reasoning modeli      |
| `MiniMax-M2.7-highspeed` | Sohbet (reasoning) | Daha hızlı M2.7 reasoning katmanı             |
| `MiniMax-VL-01`          | Görme              | Görsel anlama modeli                          |
| `image-01`               | Görsel üretimi     | Metinden görsele ve görselden görsele düzenleme |
| `music-2.6`              | Müzik üretimi      | Varsayılan müzik modeli                       |
| `music-2.5`              | Müzik üretimi      | Önceki müzik üretim katmanı                   |
| `music-2.0`              | Müzik üretimi      | Eski müzik üretim katmanı                     |
| `MiniMax-Hailuo-2.3`     | Video üretimi      | Metinden videoya ve görsel referans akışları  |

## Başlarken

Tercih ettiğiniz auth yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Şunun için en iyisi:** OAuth ile MiniMax Coding Plan üzerinden hızlı kurulum, API anahtarı gerekmez.

    <Tabs>
      <Tab title="Uluslararası">
        <Steps>
          <Step title="İlk kurulumu çalıştırın">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Bu, `api.minimax.io` üzerinde kimlik doğrular.
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
          <Step title="İlk kurulumu çalıştırın">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Bu, `api.minimaxi.com` üzerinde kimlik doğrular.
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
    OAuth kurulumları `minimax-portal` sağlayıcı kimliğini kullanır. Model başvuruları `minimax-portal/MiniMax-M2.7` biçimini izler.
    </Note>

    <Tip>
    MiniMax Coding Plan yönlendirme bağlantısı (%10 indirim): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Şunun için en iyisi:** Anthropic uyumlu API ile barındırılan MiniMax.

    <Tabs>
      <Tab title="Uluslararası">
        <Steps>
          <Step title="İlk kurulumu çalıştırın">
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
          <Step title="İlk kurulumu çalıştırın">
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
    Anthropic uyumlu akış yolunda OpenClaw, siz açıkça `thinking` ayarlamadıkça MiniMax düşünmesini varsayılan olarak devre dışı bırakır. MiniMax'in akış uç noktası yerel Anthropic thinking blokları yerine OpenAI tarzı delta parçalarında `reasoning_content` yayar; bu da örtük olarak etkin bırakılırsa iç akıl yürütmenin görünür çıktıya sızmasına yol açabilir.
    </Warning>

    <Note>
    API-key kurulumları `minimax` sağlayıcı kimliğini kullanır. Model başvuruları `minimax/MiniMax-M2.7` biçimini izler.
    </Note>

  </Tab>
</Tabs>

## `openclaw configure` ile yapılandırma

JSON düzenlemeden MiniMax ayarlamak için etkileşimli yapılandırma sihirbazını kullanın:

<Steps>
  <Step title="Sihirbazı başlatın">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Model/auth seçin">
    Menüden **Model/auth** seçin.
  </Step>
  <Step title="Bir MiniMax auth seçeneği seçin">
    Mevcut MiniMax seçeneklerinden birini seçin:

    | Auth seçimi | Açıklama |
    | --- | --- |
    | `minimax-global-oauth` | Uluslararası OAuth (Coding Plan) |
    | `minimax-cn-oauth` | Çin OAuth (Coding Plan) |
    | `minimax-global-api` | Uluslararası API key |
    | `minimax-cn-api` | Çin API key |

  </Step>
  <Step title="Varsayılan modelinizi seçin">
    İstendiğinde varsayılan modelinizi seçin.
  </Step>
</Steps>

## Yetenekler

### Görsel üretimi

MiniMax Plugin'i, `image_generate` aracı için `image-01` modelini kaydeder. Şunları destekler:

- En-boy oranı denetimi ile **metinden görsele üretim**
- En-boy oranı denetimi ile **görselden görsele düzenleme** (konu referansı)
- İstek başına en fazla **9 çıktı görseli**
- Düzenleme isteği başına en fazla **1 referans görsel**
- Desteklenen en-boy oranları: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Görsel üretimi için MiniMax kullanmak istiyorsanız, bunu görsel üretimi sağlayıcısı olarak ayarlayın:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Plugin, metin modelleriyle aynı `MINIMAX_API_KEY` veya OAuth auth'u kullanır. MiniMax zaten kuruluysa ek yapılandırma gerekmez.

Hem `minimax` hem `minimax-portal`, aynı
`image-01` modeliyle `image_generate` kaydeder. API-key kurulumları `MINIMAX_API_KEY` kullanır; OAuth kurulumları
bunun yerine paketlenmiş `minimax-portal` auth yolunu kullanabilir.

Görsel üretimi her zaman MiniMax'in özel görsel uç noktasını
(`/v1/image_generation`) kullanır ve `models.providers.minimax.baseUrl` değerini yok sayar,
çünkü bu alan sohbet/Anthropic uyumlu temel URL'yi yapılandırır. Görsel üretimini
CN uç noktası üzerinden yönlendirmek için `MINIMAX_API_HOST=https://api.minimaxi.com` ayarlayın; varsayılan küresel uç nokta
`https://api.minimax.io` değeridir.

İlk kurulum veya API-key kurulumu açık `models.providers.minimax`
girdileri yazdığında, OpenClaw `MiniMax-M2.7` ve
`MiniMax-M2.7-highspeed` modellerini yalnızca metin sohbet modelleri olarak somutlaştırır. Görsel anlama ise
Plugin sahipli `MiniMax-VL-01` medya sağlayıcısı üzerinden ayrı olarak açığa çıkarılır.

<Note>
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için bkz. [Görsel üretimi](/tr/tools/image-generation).
</Note>

### Metinden konuşmaya

Paketlenmiş `minimax` Plugin'i, `messages.tts` için
MiniMax T2A v2'yi bir konuşma sağlayıcısı olarak kaydeder.

- Varsayılan TTS modeli: `speech-2.8-hd`
- Varsayılan ses: `English_expressive_narrator`
- Desteklenen paketlenmiş model kimlikleri arasında `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` ve `speech-01-turbo` bulunur.
- Auth çözümleme sırası: önce `messages.tts.providers.minimax.apiKey`, sonra
  `minimax-portal` OAuth/token auth profilleri, sonra Token Plan ortam
  anahtarları (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), sonra `MINIMAX_API_KEY`.
- Hiçbir TTS host yapılandırılmamışsa OpenClaw yapılandırılmış
  `minimax-portal` OAuth host'unu yeniden kullanır ve
  `/anthropic` gibi Anthropic uyumlu yol son eklerini kaldırır.
- Normal ses ekleri MP3 olarak kalır.
- Feishu ve Telegram gibi sesli not hedefleri, Feishu/Lark dosya API'si yerel ses iletileri için yalnızca
  `file_type: "opus"` kabul ettiğinden, `ffmpeg` ile MiniMax
  MP3'ten 48kHz Opus'a dönüştürülür.
- MiniMax T2A kesirli `speed` ve `vol` kabul eder, ancak `pitch`
  tamsayı olarak gönderilir; OpenClaw API isteğinden önce kesirli `pitch` değerlerini kırpar.

| Ayar                                     | Ortam değişkeni        | Varsayılan                    | Açıklama                         |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | MiniMax T2A API host'u.          |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | TTS model kimliği.               |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Konuşma çıktısı için kullanılan ses kimliği. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Oynatma hızı, `0.5..2.0`.        |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Ses seviyesi, `(0, 10]`.         |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Tamsayı perde kaydırması, `-12..12`. |

### Müzik üretimi

Paketlenmiş MiniMax Plugin'i, hem `minimax` hem de `minimax-portal` için
paylaşılan `music_generate` aracı üzerinden müzik üretimini kaydeder.

- Varsayılan müzik modeli: `minimax/music-2.6`
- OAuth müzik modeli: `minimax-portal/music-2.6`
- `minimax/music-2.5` ve `minimax/music-2.0` da desteklenir
- İstem denetimleri: `lyrics`, `instrumental`, `durationSeconds`
- Çıktı biçimi: `mp3`
- Oturum destekli çalıştırmalar, `action: "status"` dahil paylaşılan görev/durum akışı üzerinden ayrılır

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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için bkz. [Müzik üretimi](/tr/tools/music-generation).
</Note>

### Video üretimi

Paketlenmiş MiniMax Plugin'i, hem `minimax` hem de `minimax-portal` için
paylaşılan `video_generate` aracı üzerinden video üretimini kaydeder.

- Varsayılan video modeli: `minimax/MiniMax-Hailuo-2.3`
- OAuth video modeli: `minimax-portal/MiniMax-Hailuo-2.3`
- Modlar: metinden videoya ve tek görsel referans akışları
- `aspectRatio` ve `resolution` desteklenir

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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için bkz. [Video üretimi](/tr/tools/video-generation).
</Note>

### Görsel anlama

MiniMax Plugin'i, görsel anlamayı metin
kataloğundan ayrı kaydeder:

| Sağlayıcı kimliği | Varsayılan görsel modeli |
| ----------------- | ------------------------ |
| `minimax`         | `MiniMax-VL-01`          |
| `minimax-portal`  | `MiniMax-VL-01`          |

Bu nedenle otomatik medya yönlendirmesi, paketlenmiş metin-sağlayıcı kataloğu hâlâ yalnızca metin M2.7 sohbet başvurularını gösteriyor olsa bile MiniMax görsel anlamayı kullanabilir.

### Web arama

MiniMax Plugin'i ayrıca `web_search` özelliğini MiniMax Coding Plan
arama API'si üzerinden kaydeder.

- Sağlayıcı kimliği: `minimax`
- Yapılandırılmış sonuçlar: başlıklar, URL'ler, parçacıklar, ilgili sorgular
- Tercih edilen ortam değişkeni: `MINIMAX_CODE_PLAN_KEY`
- Kabul edilen ortam takma adı: `MINIMAX_CODING_API_KEY`
- Uyumluluk geri dönüşü: zaten coding-plan token'ını işaret ediyorsa `MINIMAX_API_KEY`
- Bölge yeniden kullanımı: `plugins.entries.minimax.config.webSearch.region`, sonra `MINIMAX_API_HOST`, sonra MiniMax sağlayıcı temel URL'leri
- Arama sağlayıcı kimliği `minimax` üzerinde kalır; OAuth CN/global kurulumu yine de bölgeyi dolaylı olarak `models.providers.minimax-portal.baseUrl` üzerinden yönlendirebilir

Yapılandırma `plugins.entries.minimax.config.webSearch.*` altında bulunur.

<Note>
Tam web arama yapılandırması ve kullanımı için bkz. [MiniMax Search](/tr/tools/minimax-search).
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
    | `agents.defaults.models` | İzin listesinde istediğiniz takma model adları |
    | `models.mode` | MiniMax'i yerleşiklerle birlikte eklemek istiyorsanız `merge` değerini koruyun |
  </Accordion>

  <Accordion title="Thinking varsayılanları">
    `api: "anthropic-messages"` üzerinde OpenClaw, parametrelerde/yapılandırmada thinking zaten açıkça ayarlanmadıysa `thinking: { type: "disabled" }` enjekte eder.

    Bu, MiniMax'in akış uç noktasının OpenAI tarzı delta parçalarında `reasoning_content` yaymasını engeller; aksi halde bu iç akıl yürütmeyi görünür çıktıya sızdırır.

  </Accordion>

  <Accordion title="Hızlı mod">
    `/fast on` veya `params.fastMode: true`, Anthropic uyumlu akış yolunda `MiniMax-M2.7` modelini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
  </Accordion>

  <Accordion title="Geri dönüş örneği">
    **Şunun için en iyisi:** en güçlü en yeni nesil modelinizi birincil olarak koruyup MiniMax M2.7'ye fail over yapmak. Aşağıdaki örnekte somut bir birincil olarak Opus kullanılır; bunu tercih ettiğiniz en yeni nesil birincil modelle değiştirin.

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
    - Coding Plan kullanım API'si: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (bir coding plan anahtarı gerektirir).
    - OpenClaw, MiniMax coding-plan kullanımını diğer sağlayıcılarda kullanılan aynı `% kaldı` gösterimine normalleştirir. MiniMax'in ham `usage_percent` / `usagePercent` alanları tüketilen kotayı değil, kalan kotayı temsil eder; bu yüzden OpenClaw bunları tersine çevirir. Sayaç tabanlı alanlar mevcutsa önceliklidir.
    - API `model_remains` döndürdüğünde OpenClaw sohbet-modeli girdisini tercih eder, gerektiğinde pencere etiketini `start_time` / `end_time` üzerinden türetir ve coding-plan pencerelerinin ayırt edilmesini kolaylaştırmak için seçilen model adını plan etiketine dahil eder.
    - Kullanım anlık görüntüleri `minimax`, `minimax-cn` ve `minimax-portal` değerlerini aynı MiniMax kota yüzeyi olarak değerlendirir ve Coding Plan anahtar ortam değişkenlerine geri dönmeden önce saklanan MiniMax OAuth'u tercih eder.
  </Accordion>
</AccordionGroup>

## Notlar

- Model başvuruları auth yolunu izler:
  - API-key kurulumu: `minimax/<model>`
  - OAuth kurulumu: `minimax-portal/<model>`
- Varsayılan sohbet modeli: `MiniMax-M2.7`
- Alternatif sohbet modeli: `MiniMax-M2.7-highspeed`
- İlk kurulum ve doğrudan API-key kurulumu, her iki M2.7 varyantı için yalnızca metin model tanımlarını yazar
- Görsel anlama, Plugin sahipli `MiniMax-VL-01` medya sağlayıcısını kullanır
- Tam maliyet takibi gerekiyorsa `models.json` içindeki fiyatlandırma değerlerini güncelleyin
- Geçerli sağlayıcı kimliğini doğrulamak için `openclaw models list` kullanın, sonra `openclaw models set minimax/MiniMax-M2.7` veya `openclaw models set minimax-portal/MiniMax-M2.7` ile değiştirin

<Tip>
MiniMax Coding Plan yönlendirme bağlantısı (%10 indirim): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Sağlayıcı kuralları için bkz. [Model sağlayıcıları](/tr/concepts/model-providers).
</Note>

## Sorun giderme

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    Bu genellikle **MiniMax sağlayıcısının yapılandırılmadığı** anlamına gelir (eşleşen sağlayıcı girdisi yoktur ve MiniMax auth profili/ortam anahtarı bulunmamıştır). Bu algılama için bir düzeltme **2026.1.12** sürümündedir. Şöyle düzeltin:

    - **2026.1.12** sürümüne yükseltin (veya kaynaktan `main` dalını çalıştırın), sonra gateway'i yeniden başlatın.
    - `openclaw configure` çalıştırıp bir **MiniMax** auth seçeneği seçin veya
    - Eşleşen `models.providers.minimax` veya `models.providers.minimax-portal` bloğunu elle ekleyin veya
    - Eşleşen sağlayıcının enjekte edilebilmesi için `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` veya bir MiniMax auth profili ayarlayın.

    Model kimliğinin **büyük/küçük harfe duyarlı** olduğundan emin olun:

    - API-key yolu: `minimax/MiniMax-M2.7` veya `minimax/MiniMax-M2.7-highspeed`
    - OAuth yolu: `minimax-portal/MiniMax-M2.7` veya `minimax-portal/MiniMax-M2.7-highspeed`

    Sonra şununla yeniden denetleyin:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Daha fazla yardım: [Sorun giderme](/tr/help/troubleshooting) ve [SSS](/tr/help/faq).
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcı seçme, model başvuruları ve failover davranışı.
  </Card>
  <Card title="Görsel üretimi" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görsel araç parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Müzik üretimi" href="/tr/tools/music-generation" icon="music">
    Paylaşılan müzik araç parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video üretimi" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video araç parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="MiniMax Search" href="/tr/tools/minimax-search" icon="magnifying-glass">
    MiniMax Coding Plan üzerinden web arama yapılandırması.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve SSS.
  </Card>
</CardGroup>

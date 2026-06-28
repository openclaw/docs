---
read_when:
    - OpenClaw'da MiniMax modellerini istiyorsunuz
    - MiniMax kurulum rehberliğine ihtiyacınız var
summary: OpenClaw'da MiniMax modellerini kullanın
title: MiniMax
x-i18n:
    generated_at: "2026-06-28T01:11:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fe606178d7d15383e56c026b02ba7be751ead706adc097c776c0a6a92aa2a2
    source_path: providers/minimax.md
    workflow: 16
---

OpenClaw'ın MiniMax sağlayıcısı varsayılan olarak **MiniMax M3** kullanır.

MiniMax ayrıca şunları sağlar:

- T2A v2 ile paketlenmiş konuşma sentezi
- `MiniMax-VL-01` ile paketlenmiş görüntü anlama
- `music-2.6` ile paketlenmiş müzik üretimi
- MiniMax Token Plan arama API'si üzerinden paketlenmiş `web_search`

Sağlayıcı ayrımı:

| Sağlayıcı ID'si  | Kimlik doğrulama | Yetenekler                                                                                         |
| ---------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `minimax`        | API anahtarı     | Metin, görüntü üretimi, müzik üretimi, video üretimi, görüntü anlama, konuşma, web araması         |
| `minimax-portal` | OAuth            | Metin, görüntü üretimi, müzik üretimi, video üretimi, görüntü anlama, konuşma                      |

## Yerleşik katalog

| Model                    | Tür              | Açıklama                                      |
| ------------------------ | ---------------- | --------------------------------------------- |
| `MiniMax-M3`             | Sohbet (akıl yürütme) | Varsayılan barındırılan akıl yürütme modeli   |
| `MiniMax-M2.7`           | Sohbet (akıl yürütme) | Önceki barındırılan akıl yürütme modeli       |
| `MiniMax-M2.7-highspeed` | Sohbet (akıl yürütme) | Daha hızlı M2.7 akıl yürütme katmanı          |
| `MiniMax-VL-01`          | Görü             | Görüntü anlama modeli                         |
| `image-01`               | Görüntü üretimi  | Metinden görüntü ve görüntüden görüntü düzenleme |
| `music-2.6`              | Müzik üretimi    | Varsayılan müzik modeli                       |
| `music-2.5`              | Müzik üretimi    | Önceki müzik üretimi katmanı                  |
| `music-2.0`              | Müzik üretimi    | Eski müzik üretimi katmanı                    |
| `MiniMax-Hailuo-2.3`     | Video üretimi    | Metinden videoya ve görüntü referansı akışları |

## Başlarken

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **En uygun olduğu durum:** API anahtarı gerektirmeden OAuth üzerinden MiniMax Coding Plan ile hızlı kurulum.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Bu, `api.minimax.io` ile kimlik doğrular.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Bu, `api.minimaxi.com` ile kimlik doğrular.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    OAuth kurulumları `minimax-portal` sağlayıcı id'sini kullanır. Model referansları `minimax-portal/MiniMax-M3` biçimini izler.
    </Note>

    <Tip>
    MiniMax Coding Plan için referans bağlantısı (%10 indirim): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **En uygun olduğu durum:** Anthropic uyumlu API ile barındırılan MiniMax.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Bu, `api.minimax.io` adresini temel URL olarak yapılandırır.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Bu, `api.minimaxi.com` adresini temel URL olarak yapılandırır.
          </Step>
          <Step title="Verify the model is available">
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
      agents: { defaults: { model: { primary: "minimax/MiniMax-M3" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
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
    Anthropic uyumlu akış yolunda OpenClaw, siz açıkça `thinking` ayarlamadığınız sürece MiniMax M2.x düşünmesini varsayılan olarak devre dışı bırakır. M2.x'in akış uç noktası, yerel Anthropic düşünme blokları yerine OpenAI tarzı delta parçalarında `reasoning_content` yayar; bu da örtük olarak etkin bırakılırsa iç akıl yürütmenin görünür çıktıya sızmasına neden olabilir. MiniMax-M3 (ve ileriye dönük uyumlu M3.x) bu varsayılandan muaftır: M3 düzgün Anthropic düşünme blokları yayar ve görünür içerik üretmek için düşünmenin etkin olmasını gerektirir; bu nedenle OpenClaw, M3'ü sağlayıcının atlanmış/uyarlanabilir düşünme yolunda tutar.
    </Warning>

    <Note>
    API anahtarı kurulumları `minimax` sağlayıcı id'sini kullanır. Model referansları `minimax/MiniMax-M3` biçimini izler.
    </Note>

  </Tab>
</Tabs>

## `openclaw configure` ile yapılandırma

JSON düzenlemeden MiniMax'i ayarlamak için etkileşimli yapılandırma sihirbazını kullanın:

<Steps>
  <Step title="Launch the wizard">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Select Model/auth">
    Menüden **Model/auth** öğesini seçin.
  </Step>
  <Step title="Choose a MiniMax auth option">
    Kullanılabilir MiniMax seçeneklerinden birini seçin:

    | Kimlik doğrulama seçimi | Açıklama |
    | --- | --- |
    | `minimax-global-oauth` | Uluslararası OAuth (Coding Plan) |
    | `minimax-cn-oauth` | Çin OAuth (Coding Plan) |
    | `minimax-global-api` | Uluslararası API anahtarı |
    | `minimax-cn-api` | Çin API anahtarı |

  </Step>
  <Step title="Pick your default model">
    İstendiğinde varsayılan modelinizi seçin.
  </Step>
</Steps>

## Yetenekler

### Görüntü üretimi

MiniMax Plugin'i, `image_generate` aracı için `image-01` modelini kaydeder. Şunları destekler:

- En boy oranı denetimiyle **metinden görüntü üretimi**
- En boy oranı denetimiyle **görüntüden görüntü düzenleme** (konu referansı)
- İstek başına en fazla **9 çıktı görüntüsü**
- Düzenleme isteği başına en fazla **1 referans görüntüsü**
- Desteklenen en boy oranları: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Görüntü üretimi için MiniMax'i kullanmak üzere, onu görüntü üretimi sağlayıcısı olarak ayarlayın:

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

Görüntü üretimi her zaman MiniMax'in özel görüntü uç noktasını (`/v1/image_generation`) kullanır ve `models.providers.minimax.baseUrl` değerini yok sayar; çünkü bu alan sohbet/Anthropic uyumlu temel URL'yi yapılandırır. Görüntü üretimini CN uç noktası üzerinden yönlendirmek için `MINIMAX_API_HOST=https://api.minimaxi.com` ayarlayın; varsayılan küresel uç nokta `https://api.minimax.io` adresidir.

Onboarding veya API anahtarı kurulumu açık `models.providers.minimax` girdileri yazdığında OpenClaw, `MiniMax-M3`, `MiniMax-M2.7` ve `MiniMax-M2.7-highspeed` modellerini sohbet modelleri olarak somutlaştırır. M3, metin ve görüntü girdisi sunduğunu bildirir; görüntü anlama, Plugin'e ait `MiniMax-VL-01` medya sağlayıcısı üzerinden ayrı olarak sunulmaya devam eder.

<Note>
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için bkz. [Görüntü Üretimi](/tr/tools/image-generation).
</Note>

### Metinden konuşmaya

Paketlenmiş `minimax` Plugin'i, MiniMax T2A v2'yi `messages.tts` için bir konuşma sağlayıcısı olarak kaydeder.

- Varsayılan TTS modeli: `speech-2.8-hd`
- Varsayılan ses: `English_expressive_narrator`
- Desteklenen paketlenmiş model id'leri arasında `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` ve `speech-01-turbo` bulunur.
- Kimlik doğrulama çözümleme sırası: `messages.tts.providers.minimax.apiKey`, ardından
  `minimax-portal` OAuth/belirteç kimlik doğrulama profilleri, ardından Token Plan ortam
  anahtarları (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), ardından `MINIMAX_API_KEY`.
- TTS ana makinesi yapılandırılmamışsa OpenClaw, yapılandırılmış
  `minimax-portal` OAuth ana makinesini yeniden kullanır ve `/anthropic` gibi
  Anthropic uyumlu yol soneklerini çıkarır.
- Normal ses ekleri MP3 olarak kalır.
- Feishu ve Telegram gibi sesli not hedefleri, MiniMax MP3'ten `ffmpeg` ile
  48 kHz Opus'a dönüştürülür; çünkü Feishu/Lark dosya API'si yerel ses
  iletileri için yalnızca `file_type: "opus"` kabul eder.
- MiniMax T2A kesirli `speed` ve `vol` değerlerini kabul eder, ancak `pitch`
  tam sayı olarak gönderilir; OpenClaw, API isteğinden önce kesirli `pitch`
  değerlerini keser.

| Ayar                                            | Ortam değişkeni        | Varsayılan                    | Açıklama                         |
| ----------------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl`        | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | MiniMax T2A API ana makinesi.    |
| `messages.tts.providers.minimax.model`          | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | TTS model id'si.                 |
| `messages.tts.providers.minimax.speakerVoiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Konuşma çıktısı için kullanılan ses id'si. |
| `messages.tts.providers.minimax.speed`          |                        | `1.0`                         | Oynatma hızı, `0.5..2.0`.        |
| `messages.tts.providers.minimax.vol`            |                        | `1.0`                         | Ses düzeyi, `(0, 10]`.           |
| `messages.tts.providers.minimax.pitch`          |                        | `0`                           | Tam sayı perde kaydırması, `-12..12`. |

### Müzik üretimi

Paketlenmiş MiniMax Plugin'i, hem `minimax` hem de `minimax-portal` için paylaşılan `music_generate` aracı üzerinden müzik üretimini kaydeder.

- Varsayılan müzik modeli: `minimax/music-2.6`
- OAuth müzik modeli: `minimax-portal/music-2.6`
- `minimax/music-2.5` ve `minimax/music-2.0` da desteklenir
- İstem denetimleri: `lyrics`, `instrumental`
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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devri davranışı için bkz. [Müzik Üretimi](/tr/tools/music-generation).
</Note>

### Video üretimi

Paketle birlikte gelen MiniMax Plugin, hem `minimax` hem de `minimax-portal` için paylaşılan
`video_generate` aracı üzerinden video üretimini kaydeder.

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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devri davranışı için bkz. [Video Üretimi](/tr/tools/video-generation).
</Note>

### Görsel anlama

MiniMax Plugin, görsel anlamayı metin kataloğundan ayrı olarak kaydeder:

| Sağlayıcı Kimliği | Varsayılan görsel modeli |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

Bu yüzden otomatik medya yönlendirmesi, paketle gelen metin sağlayıcısı kataloğu M3 görsel yetenekli sohbet referanslarını da içerse bile MiniMax görsel anlamayı kullanabilir.

### Web arama

MiniMax Plugin ayrıca MiniMax Token Plan arama API'si üzerinden `web_search` kaydeder.

- Sağlayıcı kimliği: `minimax`
- Yapılandırılmış sonuçlar: başlıklar, URL'ler, parçacıklar, ilgili sorgular
- Tercih edilen ortam değişkeni: `MINIMAX_CODE_PLAN_KEY`
- Kabul edilen ortam takma adları: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Uyumluluk geri dönüşü: zaten bir token-plan kimlik bilgisine işaret ettiğinde `MINIMAX_API_KEY`
- Bölge yeniden kullanımı: `plugins.entries.minimax.config.webSearch.region`, ardından `MINIMAX_API_HOST`, ardından MiniMax sağlayıcı temel URL'leri
- Arama `minimax` sağlayıcı kimliğinde kalır; OAuth CN/global kurulumu bölgeyi dolaylı olarak `models.providers.minimax-portal.baseUrl` üzerinden yönlendirebilir ve `MINIMAX_OAUTH_TOKEN` üzerinden bearer auth sağlayabilir

Yapılandırma `plugins.entries.minimax.config.webSearch.*` altında bulunur.

<Note>
Tam web arama yapılandırması ve kullanımı için bkz. [MiniMax Arama](/tr/tools/minimax-search).
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Yapılandırma seçenekleri">
    | Seçenek | Açıklama |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | `https://api.minimax.io/anthropic` tercih edin (Anthropic uyumlu); `https://api.minimax.io/v1` OpenAI uyumlu payload'lar için isteğe bağlıdır |
    | `models.providers.minimax.api` | `anthropic-messages` tercih edin; `openai-completions` OpenAI uyumlu payload'lar için isteğe bağlıdır |
    | `models.providers.minimax.apiKey` | MiniMax API anahtarı (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` tanımlayın |
    | `agents.defaults.models` | İzin listesinde istediğiniz modeller için takma ad tanımlayın |
    | `models.mode` | MiniMax'i yerleşiklerle birlikte eklemek istiyorsanız `merge` olarak tutun |
  </Accordion>

  <Accordion title="Thinking varsayılanları">
    `api: "anthropic-messages"` üzerinde, düşünme params/config içinde zaten açıkça ayarlanmadıkça OpenClaw MiniMax M2.x modelleri için `thinking: { type: "disabled" }` enjekte eder.

    Bu, M2.x'in akış endpoint'inin OpenAI tarzı delta parçalarında `reasoning_content` yaymasını önler; aksi takdirde iç akıl yürütme görünür çıktıya sızardı.

    MiniMax-M3 (ve M3.x) muaftır: M3 uygun Anthropic thinking blokları yayar ve thinking devre dışıyken `stop_reason: "end_turn"` ile boş bir `content` dizisi döndürür; bu nedenle wrapper M3'ü sağlayıcının atlanmış/uyarlanabilir thinking yolunda tutar.

  </Accordion>

  <Accordion title="Hızlı mod">
    `/fast on` veya `params.fastMode: true`, Anthropic uyumlu stream yolunda `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
  </Accordion>

  <Accordion title="Geri dönüş örneği">
    **En uygun olduğu durum:** en güçlü son nesil modelinizi birincil olarak tutup MiniMax M2.7'ye yük devri yapın. Aşağıdaki örnek Opus'u somut bir birincil olarak kullanır; tercih ettiğiniz son nesil birincil modelle değiştirin.

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
    - Coding Plan kullanım API'si: `https://api.minimaxi.com/v1/token_plan/remains` veya `https://api.minimax.io/v1/token_plan/remains` (bir coding plan anahtarı gerektirir).
    - Kullanım yoklaması, yapılandırılmışsa host'u `models.providers.minimax-portal.baseUrl` veya `models.providers.minimax.baseUrl` üzerinden türetir; bu nedenle `https://api.minimax.io/anthropic` kullanan global kurulumlar `api.minimax.io` için yoklama yapar. Eksik veya hatalı biçimlendirilmiş temel URL'ler uyumluluk için CN geri dönüşünü korur.
    - OpenClaw, MiniMax coding-plan kullanımını diğer sağlayıcılar tarafından kullanılan aynı `% kalan` gösterimine normalleştirir. MiniMax'in ham `usage_percent` / `usagePercent` alanları tüketilen kota değil, kalan kotadır; bu nedenle OpenClaw bunları tersine çevirir. Sayı tabanlı alanlar mevcut olduğunda önceliklidir.
    - API `model_remains` döndürdüğünde OpenClaw sohbet modeli girdisini tercih eder, gerektiğinde pencere etiketini `start_time` / `end_time` üzerinden türetir ve coding-plan pencerelerinin daha kolay ayırt edilebilmesi için seçilen model adını plan etiketine dahil eder.
    - Kullanım anlık görüntüleri `minimax`, `minimax-cn` ve `minimax-portal` değerlerini aynı MiniMax kota yüzeyi olarak ele alır ve Coding Plan anahtarı ortam değişkenlerine geri dönmeden önce depolanan MiniMax OAuth'u tercih eder.

  </Accordion>
</AccordionGroup>

## Notlar

- Model referansları auth yolunu izler:
  - API anahtarı kurulumu: `minimax/<model>`
  - OAuth kurulumu: `minimax-portal/<model>`
- Varsayılan sohbet modeli: `MiniMax-M3`
- Alternatif sohbet modelleri: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- İlk katılım ve doğrudan API anahtarı kurulumu M3 ve her iki M2.7 varyantı için model tanımları yazar
- Görsel anlama, Plugin'e ait `MiniMax-VL-01` medya sağlayıcısını kullanır
- Kesin maliyet takibine ihtiyacınız varsa `models.json` içindeki fiyatlandırma değerlerini güncelleyin
- Geçerli sağlayıcı kimliğini doğrulamak için `openclaw models list` kullanın, ardından `openclaw models set minimax/MiniMax-M3` veya `openclaw models set minimax-portal/MiniMax-M3` ile geçiş yapın

<Tip>
MiniMax Coding Plan için yönlendirme bağlantısı (%10 indirim): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Sağlayıcı kuralları için bkz. [Model sağlayıcıları](/tr/concepts/model-providers).
</Note>

## Sorun giderme

<AccordionGroup>
  <Accordion title='"Bilinmeyen model: minimax/MiniMax-M3"'>
    Bu genellikle **MiniMax sağlayıcısının yapılandırılmadığı** anlamına gelir (eşleşen sağlayıcı girdisi yoktur ve MiniMax auth profili/ortam anahtarı bulunmamıştır). Bu algılama için bir düzeltme **2026.1.12** sürümündedir. Düzeltmek için:

    - **2026.1.12** sürümüne yükseltin (veya kaynak `main` üzerinden çalıştırın), ardından Gateway'i yeniden başlatın.
    - `openclaw configure` çalıştırıp bir **MiniMax** auth seçeneği belirleyin veya
    - Eşleşen `models.providers.minimax` ya da `models.providers.minimax-portal` bloğunu elle ekleyin veya
    - Eşleşen sağlayıcının enjekte edilebilmesi için `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` ya da bir MiniMax auth profili ayarlayın.

    Model kimliğinin **büyük/küçük harfe duyarlı** olduğundan emin olun:

    - API anahtarı yolu: `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` veya `minimax/MiniMax-M2.7-highspeed`
    - OAuth yolu: `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` veya `minimax-portal/MiniMax-M2.7-highspeed`

    Ardından şununla yeniden kontrol edin:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Daha fazla yardım: [Sorun Giderme](/tr/help/troubleshooting) ve [SSS](/tr/help/faq).
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devri davranışını seçme.
  </Card>
  <Card title="Görsel üretimi" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görsel aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Müzik üretimi" href="/tr/tools/music-generation" icon="music">
    Paylaşılan müzik aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video üretimi" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="MiniMax Arama" href="/tr/tools/minimax-search" icon="magnifying-glass">
    MiniMax Token Plan üzerinden web arama yapılandırması.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve SSS.
  </Card>
</CardGroup>

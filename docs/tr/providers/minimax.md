---
read_when:
    - OpenClaw'da MiniMax modellerini istiyorsunuz
    - MiniMax kurulum rehberine ihtiyacınız var
summary: MiniMax modellerini OpenClaw ile kullanın
title: MiniMax
x-i18n:
    generated_at: "2026-04-12T23:31:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee9c89faf57384feb66cda30934000e5746996f24b59122db309318f42c22389
    source_path: providers/minimax.md
    workflow: 15
---

# MiniMax

OpenClaw'ın MiniMax sağlayıcısı varsayılan olarak **MiniMax M2.7** kullanır.

MiniMax ayrıca şunları da sağlar:

- T2A v2 aracılığıyla paketlenmiş konuşma sentezi
- `MiniMax-VL-01` aracılığıyla paketlenmiş görüntü anlama
- `music-2.5+` aracılığıyla paketlenmiş müzik üretimi
- MiniMax Coding Plan arama API'si üzerinden paketlenmiş `web_search`

Sağlayıcı ayrımı:

| Sağlayıcı kimliği | Kimlik doğrulama | Yetenekler                                                     |
| ----------------- | ---------------- | -------------------------------------------------------------- |
| `minimax`         | API anahtarı     | Metin, görüntü üretimi, görüntü anlama, konuşma, web araması   |
| `minimax-portal`  | OAuth            | Metin, görüntü üretimi, görüntü anlama                         |

## Model ailesi

| Model                    | Tür              | Açıklama                                  |
| ------------------------ | ---------------- | ----------------------------------------- |
| `MiniMax-M2.7`           | Sohbet (akıl yürütme) | Varsayılan barındırılan akıl yürütme modeli |
| `MiniMax-M2.7-highspeed` | Sohbet (akıl yürütme) | Daha hızlı M2.7 akıl yürütme katmanı      |
| `MiniMax-VL-01`          | Görsel           | Görüntü anlama modeli                     |
| `image-01`               | Görüntü üretimi  | Metinden görüntü ve görüntüden görüntü düzenleme |
| `music-2.5+`             | Müzik üretimi    | Varsayılan müzik modeli                   |
| `music-2.5`              | Müzik üretimi    | Önceki müzik üretimi katmanı              |
| `music-2.0`              | Müzik üretimi    | Eski müzik üretimi katmanı                |
| `MiniMax-Hailuo-2.3`     | Video üretimi    | Metinden videoya ve görüntü referans akışları |

## Başlangıç

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **En iyi kullanım alanı:** OAuth ile MiniMax Coding Plan üzerinden hızlı kurulum, API anahtarı gerekmez.

    <Tabs>
      <Tab title="Uluslararası">
        <Steps>
          <Step title="Onboarding çalıştırın">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Bu, `api.minimax.io` üzerinde kimlik doğrulaması yapar.
          </Step>
          <Step title="Modelin kullanılabildiğini doğrulayın">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Çin">
        <Steps>
          <Step title="Onboarding çalıştırın">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Bu, `api.minimaxi.com` üzerinde kimlik doğrulaması yapar.
          </Step>
          <Step title="Modelin kullanılabildiğini doğrulayın">
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
    **En iyi kullanım alanı:** Anthropic uyumlu API ile barındırılan MiniMax.

    <Tabs>
      <Tab title="Uluslararası">
        <Steps>
          <Step title="Onboarding çalıştırın">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Bu, temel URL olarak `api.minimax.io` yapılandırır.
          </Step>
          <Step title="Modelin kullanılabildiğini doğrulayın">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Çin">
        <Steps>
          <Step title="Onboarding çalıştırın">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Bu, temel URL olarak `api.minimaxi.com` yapılandırır.
          </Step>
          <Step title="Modelin kullanılabildiğini doğrulayın">
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
                input: ["text", "image"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text", "image"],
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
    Anthropic uyumlu akış yolunda, siz açıkça `thinking` ayarlamadıkça OpenClaw MiniMax düşünmesini varsayılan olarak devre dışı bırakır. MiniMax'ın akış uç noktası, yerel Anthropic düşünme blokları yerine OpenAI tarzı delta parçaları içinde `reasoning_content` yayar; bu da örtük olarak etkin bırakılırsa iç akıl yürütmenin görünür çıktıya sızmasına neden olabilir.
    </Warning>

    <Note>
    API anahtarı kurulumları `minimax` sağlayıcı kimliğini kullanır. Model referansları `minimax/MiniMax-M2.7` biçimini izler.
    </Note>

  </Tab>
</Tabs>

## `openclaw configure` ile yapılandırma

JSON düzenlemeden MiniMax'ı ayarlamak için etkileşimli yapılandırma sihirbazını kullanın:

<Steps>
  <Step title="Sihirbazı başlatın">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Model/auth seçin">
    Menüden **Model/auth** seçeneğini seçin.
  </Step>
  <Step title="Bir MiniMax kimlik doğrulama seçeneği seçin">
    Kullanılabilir MiniMax seçeneklerinden birini seçin:

    | Kimlik doğrulama seçeneği | Açıklama |
    | --- | --- |
    | `minimax-global-oauth` | Uluslararası OAuth (Coding Plan) |
    | `minimax-cn-oauth` | Çin OAuth (Coding Plan) |
    | `minimax-global-api` | Uluslararası API anahtarı |
    | `minimax-cn-api` | Çin API anahtarı |

  </Step>
  <Step title="Varsayılan modelinizi seçin">
    İstendiğinde varsayılan modelinizi seçin.
  </Step>
</Steps>

## Yetenekler

### Görüntü üretimi

MiniMax Plugin'i, `image_generate` aracı için `image-01` modelini kaydeder. Şunları destekler:

- En-boy oranı kontrolü ile **metinden görüntü üretimi**
- En-boy oranı kontrolü ile **görüntüden görüntü düzenleme** (özne referansı)
- İstek başına en fazla **9 çıktı görüntüsü**
- Düzenleme isteği başına en fazla **1 referans görüntü**
- Desteklenen en-boy oranları: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Görüntü üretimi için MiniMax kullanmak üzere, onu görüntü üretimi sağlayıcısı olarak ayarlayın:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Plugin, metin modelleriyle aynı `MINIMAX_API_KEY` veya OAuth kimlik doğrulamasını kullanır. MiniMax zaten kurulmuşsa ek yapılandırma gerekmez.

Hem `minimax` hem de `minimax-portal`, aynı
`image-01` modeliyle `image_generate` kaydeder. API anahtarı kurulumları `MINIMAX_API_KEY` kullanır; OAuth kurulumları bunun yerine
paketlenmiş `minimax-portal` kimlik doğrulama yolunu kullanabilir.

Onboarding veya API anahtarı kurulumu açık `models.providers.minimax`
girdileri yazdığında, OpenClaw `MiniMax-M2.7` ve
`MiniMax-M2.7-highspeed` modellerini `input: ["text", "image"]` ile somutlaştırır.

Yerleşik paketlenmiş MiniMax metin kataloğunun kendisi, bu açık sağlayıcı yapılandırması oluşana kadar
yalnızca metin meta verisi olarak kalır. Görüntü anlama ise
Plugin'e ait `MiniMax-VL-01` medya sağlayıcısı üzerinden ayrı olarak sunulur.

<Note>
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Image Generation](/tr/tools/image-generation) bölümüne bakın.
</Note>

### Müzik üretimi

Paketlenmiş `minimax` Plugin'i ayrıca paylaşılan
`music_generate` aracı üzerinden müzik üretimini de kaydeder.

- Varsayılan müzik modeli: `minimax/music-2.5+`
- Ayrıca `minimax/music-2.5` ve `minimax/music-2.0` desteklenir
- İstem denetimleri: `lyrics`, `instrumental`, `durationSeconds`
- Çıkış biçimi: `mp3`
- Oturum destekli çalıştırmalar, `action: "status"` dahil olmak üzere paylaşılan görev/durum akışı üzerinden ayrılır

Varsayılan müzik sağlayıcısı olarak MiniMax kullanmak için:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.5+",
      },
    },
  },
}
```

<Note>
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Music Generation](/tr/tools/music-generation) bölümüne bakın.
</Note>

### Video üretimi

Paketlenmiş `minimax` Plugin'i ayrıca paylaşılan
`video_generate` aracı üzerinden video üretimini de kaydeder.

- Varsayılan video modeli: `minimax/MiniMax-Hailuo-2.3`
- Modlar: metinden videoya ve tek görüntü referanslı akışlar
- `aspectRatio` ve `resolution` desteklenir

Varsayılan video sağlayıcısı olarak MiniMax kullanmak için:

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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Video Generation](/tr/tools/video-generation) bölümüne bakın.
</Note>

### Görüntü anlama

MiniMax Plugin'i görüntü anlamayı metin
kataloğundan ayrı kaydeder:

| Sağlayıcı kimliği | Varsayılan görüntü modeli |
| ----------------- | ------------------------- |
| `minimax`         | `MiniMax-VL-01`           |
| `minimax-portal`  | `MiniMax-VL-01`           |

Bu nedenle otomatik medya yönlendirme, paketlenmiş metin sağlayıcı kataloğu hâlâ yalnızca metin odaklı M2.7 sohbet referanslarını gösterirken bile
MiniMax görüntü anlamayı kullanabilir.

### Web araması

MiniMax Plugin'i ayrıca MiniMax Coding Plan
arama API'si üzerinden `web_search` de kaydeder.

- Sağlayıcı kimliği: `minimax`
- Yapılandırılmış sonuçlar: başlıklar, URL'ler, özet parçaları, ilgili sorgular
- Tercih edilen ortam değişkeni: `MINIMAX_CODE_PLAN_KEY`
- Kabul edilen ortam takma adı: `MINIMAX_CODING_API_KEY`
- Uyumluluk yedeği: zaten coding-plan token'ına işaret ediyorsa `MINIMAX_API_KEY`
- Bölge yeniden kullanımı: `plugins.entries.minimax.config.webSearch.region`, ardından `MINIMAX_API_HOST`, ardından MiniMax sağlayıcı temel URL'leri
- Arama, `minimax` sağlayıcı kimliğinde kalır; OAuth CN/global kurulumu yine de bölgeyi dolaylı olarak `models.providers.minimax-portal.baseUrl` üzerinden yönlendirebilir

Yapılandırma `plugins.entries.minimax.config.webSearch.*` altında bulunur.

<Note>
Tam web araması yapılandırması ve kullanımı için [MiniMax Search](/tr/tools/minimax-search) bölümüne bakın.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Yapılandırma seçenekleri">
    | Seçenek | Açıklama |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Tercihen `https://api.minimax.io/anthropic` (Anthropic uyumlu); `https://api.minimax.io/v1` OpenAI uyumlu yükler için isteğe bağlıdır |
    | `models.providers.minimax.api` | Tercihen `anthropic-messages`; `openai-completions` OpenAI uyumlu yükler için isteğe bağlıdır |
    | `models.providers.minimax.apiKey` | MiniMax API anahtarı (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` tanımlayın |
    | `agents.defaults.models` | İzin listesinde istediğiniz modellere takma ad verin |
    | `models.mode` | MiniMax'ı yerleşiklerle birlikte eklemek istiyorsanız `merge` olarak tutun |
  </Accordion>

  <Accordion title="Thinking varsayılanları">
    `api: "anthropic-messages"` üzerinde, OpenClaw düşünme zaten parametrelerde/yapılandırmada açıkça ayarlanmadıysa `thinking: { type: "disabled" }` enjekte eder.

    Bu, MiniMax'ın akış uç noktasının OpenAI tarzı delta parçaları içinde `reasoning_content` yaymasını önler; aksi halde bu durum iç akıl yürütmenin görünür çıktıya sızmasına neden olur.

  </Accordion>

  <Accordion title="Hızlı mod">
    `/fast on` veya `params.fastMode: true`, Anthropic uyumlu akış yolunda `MiniMax-M2.7` modelini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
  </Accordion>

  <Accordion title="Yük devretme örneği">
    **En iyi kullanım alanı:** en güçlü yeni nesil modelinizi birincil olarak tutup MiniMax M2.7'ye yük devretmek. Aşağıdaki örnek, somut bir birincil model olarak Opus kullanır; bunu tercih ettiğiniz yeni nesil birincil modelle değiştirin.

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
    - OpenClaw, MiniMax coding-plan kullanımını diğer sağlayıcılarda kullanılan aynı `% kaldı` görünümüne normalize eder. MiniMax'ın ham `usage_percent` / `usagePercent` alanları tüketilen kotayı değil, kalan kotayı gösterir; bu yüzden OpenClaw bunları ters çevirir. Varsa sayım tabanlı alanlar önceliklidir.
    - API `model_remains` döndürdüğünde OpenClaw sohbet modeli girdisini tercih eder, gerektiğinde pencere etiketini `start_time` / `end_time` üzerinden türetir ve seçilen model adını plan etiketine ekler; böylece coding-plan pencerelerini ayırt etmek kolaylaşır.
    - Kullanım anlık görüntüleri `minimax`, `minimax-cn` ve `minimax-portal` değerlerini aynı MiniMax kota yüzeyi olarak ele alır ve Coding Plan anahtarı ortam değişkenlerine geri düşmeden önce kayıtlı MiniMax OAuth'u tercih eder.
  </Accordion>
</AccordionGroup>

## Notlar

- Model referansları kimlik doğrulama yolunu izler:
  - API anahtarı kurulumu: `minimax/<model>`
  - OAuth kurulumu: `minimax-portal/<model>`
- Varsayılan sohbet modeli: `MiniMax-M2.7`
- Alternatif sohbet modeli: `MiniMax-M2.7-highspeed`
- Onboarding ve doğrudan API anahtarı kurulumu, her iki M2.7 varyantı için de `input: ["text", "image"]` içeren açık model tanımları yazar
- Paketlenmiş sağlayıcı kataloğu şu anda, açık MiniMax sağlayıcı yapılandırması oluşana kadar sohbet referanslarını yalnızca metin meta verisi olarak sunar
- Tam maliyet takibi gerekiyorsa `models.json` içindeki fiyatlandırma değerlerini güncelleyin
- Geçerli sağlayıcı kimliğini doğrulamak için `openclaw models list` kullanın, ardından `openclaw models set minimax/MiniMax-M2.7` veya `openclaw models set minimax-portal/MiniMax-M2.7` ile değiştirin

<Tip>
MiniMax Coding Plan için yönlendirme bağlantısı (%10 indirim): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Sağlayıcı kuralları için [Model providers](/tr/concepts/model-providers) bölümüne bakın.
</Note>

## Sorun giderme

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    Bu genellikle **MiniMax sağlayıcısının yapılandırılmadığı** anlamına gelir (eşleşen sağlayıcı girdisi yoktur ve MiniMax kimlik doğrulama profili/ortam anahtarı bulunamaz). Bu algılama için bir düzeltme **2026.1.12** sürümündedir. Düzeltmek için:

    - **2026.1.12** sürümüne yükseltin (veya kaynak koddan `main` çalıştırın), ardından gateway'i yeniden başlatın.
    - `openclaw configure` çalıştırıp bir **MiniMax** kimlik doğrulama seçeneği seçin, veya
    - Eşleşen `models.providers.minimax` ya da `models.providers.minimax-portal` bloğunu elle ekleyin, veya
    - Eşleşen sağlayıcının eklenebilmesi için `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` ya da bir MiniMax kimlik doğrulama profili ayarlayın.

    Model kimliğinin **büyük/küçük harfe duyarlı** olduğundan emin olun:

    - API anahtarı yolu: `minimax/MiniMax-M2.7` veya `minimax/MiniMax-M2.7-highspeed`
    - OAuth yolu: `minimax-portal/MiniMax-M2.7` veya `minimax-portal/MiniMax-M2.7-highspeed`

    Ardından şununla tekrar kontrol edin:

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
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Görüntü üretimi" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görüntü aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Müzik üretimi" href="/tr/tools/music-generation" icon="music">
    Paylaşılan müzik aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video üretimi" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="MiniMax Search" href="/tr/tools/minimax-search" icon="magnifying-glass">
    MiniMax Coding Plan üzerinden web araması yapılandırması.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve SSS.
  </Card>
</CardGroup>

---
read_when:
    - OpenClaw'da MiniMax modellerini istiyorsunuz
    - MiniMax kurulum rehberine ihtiyacınız var
summary: OpenClaw'da MiniMax modellerini kullanın
title: MiniMax
x-i18n:
    generated_at: "2026-04-24T09:26:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: f2729e9e9f866e66a6587d6c58f6116abae2fc09a1f50e5038e1c25bed0a82f2
    source_path: providers/minimax.md
    workflow: 15
---

OpenClaw'ın MiniMax sağlayıcısı varsayılan olarak **MiniMax M2.7** kullanır.

MiniMax ayrıca şunları sağlar:

- T2A v2 üzerinden paketli speech synthesis
- `MiniMax-VL-01` üzerinden paketli image understanding
- `music-2.5+` üzerinden paketli music generation
- MiniMax Coding Plan arama API'si üzerinden paketli `web_search`

Sağlayıcı ayrımı:

| Sağlayıcı Kimliği | Auth    | Yetenekler                                                       |
| ----------------- | ------- | ---------------------------------------------------------------- |
| `minimax`         | API key | Metin, görüntü üretimi, image understanding, speech, web search  |
| `minimax-portal`  | OAuth   | Metin, görüntü üretimi, image understanding                      |

## Yerleşik katalog

| Model                    | Tür              | Açıklama                                 |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | Sohbet (reasoning) | Varsayılan barındırılan reasoning modeli |
| `MiniMax-M2.7-highspeed` | Sohbet (reasoning) | Daha hızlı M2.7 reasoning katmanı       |
| `MiniMax-VL-01`          | Vision           | Image understanding modeli               |
| `image-01`               | Image generation | Metinden görüntü ve görüntüden görüntü düzenleme |
| `music-2.5+`             | Music generation | Varsayılan müzik modeli                  |
| `music-2.5`              | Music generation | Önceki müzik üretimi katmanı             |
| `music-2.0`              | Music generation | Eski müzik üretimi katmanı               |
| `MiniMax-Hailuo-2.3`     | Video generation | Metinden videoya ve görüntü referans akışları |

## Başlarken

Tercih ettiğiniz auth yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Şunlar için en iyisi:** MiniMax Coding Plan ile OAuth üzerinden hızlı kurulum, API anahtarı gerekmez.

    <Tabs>
      <Tab title="Uluslararası">
        <Steps>
          <Step title="Onboarding çalıştırın">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Bu, `api.minimax.io` üzerinden kimlik doğrular.
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
          <Step title="Onboarding çalıştırın">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Bu, `api.minimaxi.com` üzerinden kimlik doğrular.
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
    OAuth kurulumları `minimax-portal` sağlayıcı kimliğini kullanır. Model ref'leri `minimax-portal/MiniMax-M2.7` biçimini izler.
    </Note>

    <Tip>
    MiniMax Coding Plan yönlendirme bağlantısı (%10 indirim): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Şunlar için en iyisi:** Anthropic uyumlu API ile barındırılan MiniMax.

    <Tabs>
      <Tab title="Uluslararası">
        <Steps>
          <Step title="Onboarding çalıştırın">
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
          <Step title="Onboarding çalıştırın">
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
    Anthropic uyumlu akış yolunda OpenClaw, siz açıkça `thinking` ayarlamadığınız sürece MiniMax düşünmesini varsayılan olarak devre dışı bırakır. MiniMax'ın akış uç noktası, yerel Anthropic thinking blokları yerine reasoning_content'i OpenAI tarzı delta parçalarında yayar; bu da örtük biçimde etkin bırakılırsa dahili düşüncenin görünür çıktıya sızmasına neden olabilir.
    </Warning>

    <Note>
    API anahtarı kurulumları `minimax` sağlayıcı kimliğini kullanır. Model ref'leri `minimax/MiniMax-M2.7` biçimini izler.
    </Note>

  </Tab>
</Tabs>

## `openclaw configure` ile yapılandırma

MiniMax'ı JSON düzenlemeden ayarlamak için etkileşimli yapılandırma sihirbazını kullanın:

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
    Kullanılabilir MiniMax seçeneklerinden birini seçin:

    | Auth seçeneği | Açıklama |
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

MiniMax plugin'i, `image_generate` aracı için `image-01` modelini kaydeder. Şunları destekler:

- **Metinden görüntü üretimi**, en-boy oranı denetimiyle
- **Görüntüden görüntüye düzenleme** (özne referansı), en-boy oranı denetimiyle
- İstek başına en fazla **9 çıktı görüntüsü**
- Düzenleme isteği başına en fazla **1 referans görüntü**
- Desteklenen en-boy oranları: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

MiniMax'ı görüntü üretimi için kullanmak üzere onu görüntü üretimi sağlayıcısı olarak ayarlayın:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Plugin, metin modelleriyle aynı `MINIMAX_API_KEY` veya OAuth auth yolunu kullanır. MiniMax zaten kuruluysa ek yapılandırma gerekmez.

Hem `minimax` hem de `minimax-portal`, aynı
`image-01` modeliyle `image_generate` kaydeder. API anahtarı kurulumları `MINIMAX_API_KEY` kullanır; OAuth kurulumları
bunun yerine paketli `minimax-portal` auth yolunu kullanabilir.

Onboarding veya API anahtarı kurulumu açık `models.providers.minimax`
girdileri yazdığında OpenClaw `MiniMax-M2.7` ve
`MiniMax-M2.7-highspeed` değerlerini `input: ["text", "image"]` ile somutlaştırır.

Yerleşik paketli MiniMax metin kataloğu ise bu açık sağlayıcı yapılandırması
var olana kadar yalnızca metin odaklı meta veri olarak kalır. Image understanding, plugin'e ait `MiniMax-VL-01` medya sağlayıcısı üzerinden ayrı olarak açığa çıkarılır.

<Note>
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için bkz. [Image Generation](/tr/tools/image-generation).
</Note>

### Müzik üretimi

Paketli `minimax` plugin'i ayrıca paylaşılan
`music_generate` aracı üzerinden müzik üretimi de kaydeder.

- Varsayılan müzik modeli: `minimax/music-2.5+`
- Ayrıca `minimax/music-2.5` ve `minimax/music-2.0` destekler
- Prompt denetimleri: `lyrics`, `instrumental`, `durationSeconds`
- Çıktı biçimi: `mp3`
- Oturum destekli çalıştırmalar, `action: "status"` dahil olmak üzere paylaşılan görev/durum akışı üzerinden ayrılır

MiniMax'ı varsayılan müzik sağlayıcısı olarak kullanmak için:

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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için bkz. [Music Generation](/tr/tools/music-generation).
</Note>

### Video üretimi

Paketli `minimax` plugin'i ayrıca paylaşılan
`video_generate` aracı üzerinden video üretimi de kaydeder.

- Varsayılan video modeli: `minimax/MiniMax-Hailuo-2.3`
- Modlar: metinden videoya ve tek görüntü referanslı akışlar
- `aspectRatio` ve `resolution` destekler

MiniMax'ı varsayılan video sağlayıcısı olarak kullanmak için:

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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için bkz. [Video Generation](/tr/tools/video-generation).
</Note>

### Image understanding

MiniMax plugin'i, image understanding'i metin
kataloğundan ayrı olarak kaydeder:

| Sağlayıcı Kimliği | Varsayılan görüntü modeli |
| ----------------- | ------------------------- |
| `minimax`         | `MiniMax-VL-01`           |
| `minimax-portal`  | `MiniMax-VL-01`           |

Bu nedenle otomatik medya yönlendirmesi, paketli metin sağlayıcı kataloğu hâlâ yalnızca metin odaklı M2.7 sohbet ref'lerini gösterse bile
MiniMax image understanding kullanabilir.

### Web araması

MiniMax plugin'i ayrıca MiniMax Coding Plan
arama API'si üzerinden `web_search` da kaydeder.

- Sağlayıcı kimliği: `minimax`
- Yapılandırılmış sonuçlar: başlıklar, URL'ler, özetler, ilgili sorgular
- Tercih edilen env değişkeni: `MINIMAX_CODE_PLAN_KEY`
- Kabul edilen env takma adı: `MINIMAX_CODING_API_KEY`
- Uyumluluk fallback'i: zaten coding-plan token'ına işaret ediyorsa `MINIMAX_API_KEY`
- Bölge yeniden kullanımı: `plugins.entries.minimax.config.webSearch.region`, sonra `MINIMAX_API_HOST`, sonra MiniMax sağlayıcı base URL'leri
- Arama sağlayıcı kimliği olarak `minimax` üzerinde kalır; OAuth CN/global kurulumu yine de bölgeyi dolaylı olarak `models.providers.minimax-portal.baseUrl` üzerinden yönlendirebilir

Yapılandırma `plugins.entries.minimax.config.webSearch.*` altında yaşar.

<Note>
Tam web araması yapılandırması ve kullanımı için bkz. [MiniMax Search](/tr/tools/minimax-search).
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Yapılandırma seçenekleri">
    | Seçenek | Açıklama |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Tercih edilen: `https://api.minimax.io/anthropic` (Anthropic-compatible); `https://api.minimax.io/v1`, OpenAI uyumlu payload'lar için isteğe bağlıdır |
    | `models.providers.minimax.api` | Tercih edilen: `anthropic-messages`; `openai-completions`, OpenAI uyumlu payload'lar için isteğe bağlıdır |
    | `models.providers.minimax.apiKey` | MiniMax API anahtarı (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` tanımlayın |
    | `agents.defaults.models` | Allowlist içinde istediğiniz modellere takma ad verin |
    | `models.mode` | MiniMax'ı yerleşiklerle birlikte eklemek istiyorsanız `merge` kullanın |
  </Accordion>

  <Accordion title="Thinking varsayılanları">
    `api: "anthropic-messages"` üzerinde OpenClaw, thinking zaten params/config içinde açıkça ayarlanmamışsa `thinking: { type: "disabled" }` enjekte eder.

    Bu, MiniMax'ın akış uç noktasının OpenAI tarzı delta parçalarında `reasoning_content` yaymasını önler; aksi halde dahili reasoning görünür çıktıya sızabilir.

  </Accordion>

  <Accordion title="Fast mode">
    `/fast on` veya `params.fastMode: true`, Anthropic uyumlu akış yolunda `MiniMax-M2.7` modelini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
  </Accordion>

  <Accordion title="Fallback örneği">
    **Şunlar için en iyisi:** en güçlü yeni nesil modelinizi birincil tutup MiniMax M2.7'ye failover yapmak. Aşağıdaki örnek somut bir birincil model olarak Opus kullanır; bunu tercih ettiğiniz yeni nesil birincil modelle değiştirin.

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
    - OpenClaw, MiniMax coding-plan kullanımını diğer sağlayıcıların kullandığı aynı `% left` görünümüne normalize eder. MiniMax'ın ham `usage_percent` / `usagePercent` alanları tüketilmiş kotayı değil, kalan kotayı gösterir; bu yüzden OpenClaw bunları tersine çevirir. Varsa sayı tabanlı alanlar önceliklidir.
    - API `model_remains` döndürdüğünde OpenClaw sohbet modeli girdisini tercih eder, gerekirse pencere etiketini `start_time` / `end_time` üzerinden türetir ve coding-plan pencerelerinin daha kolay ayırt edilebilmesi için seçilen model adını plan etiketine dahil eder.
    - Kullanım anlık görüntüleri `minimax`, `minimax-cn` ve `minimax-portal` değerlerini aynı MiniMax kota yüzeyi olarak ele alır ve Coding Plan anahtar env değişkenlerine geri düşmeden önce saklanan MiniMax OAuth'u tercih eder.
  </Accordion>
</AccordionGroup>

## Notlar

- Model ref'leri auth yolunu izler:
  - API anahtarı kurulumu: `minimax/<model>`
  - OAuth kurulumu: `minimax-portal/<model>`
- Varsayılan sohbet modeli: `MiniMax-M2.7`
- Alternatif sohbet modeli: `MiniMax-M2.7-highspeed`
- Onboarding ve doğrudan API anahtarı kurulumu, her iki M2.7 varyantı için `input: ["text", "image"]` içeren açık model tanımları yazar
- Paketli sağlayıcı kataloğu, açık MiniMax sağlayıcı yapılandırması oluşana kadar sohbet ref'lerini şu anda yalnızca metin meta verisi olarak açığa çıkarır
- Tam maliyet takibi gerekiyorsa `models.json` içindeki fiyatlandırma değerlerini güncelleyin
- Geçerli sağlayıcı kimliğini doğrulamak için `openclaw models list` kullanın, ardından `openclaw models set minimax/MiniMax-M2.7` veya `openclaw models set minimax-portal/MiniMax-M2.7` ile geçiş yapın

<Tip>
MiniMax Coding Plan yönlendirme bağlantısı (%10 indirim): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Sağlayıcı kuralları için bkz. [Model providers](/tr/concepts/model-providers).
</Note>

## Sorun giderme

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    Bu genellikle **MiniMax sağlayıcısının yapılandırılmadığı** anlamına gelir (eşleşen sağlayıcı girdisi yoktur ve MiniMax auth profile/env anahtarı bulunmamıştır). Bu algılama için düzeltme **2026.1.12** sürümündedir. Şunlarla düzeltin:

    - **2026.1.12** sürümüne yükseltin (veya source `main` üzerinden çalıştırın), sonra Gateway'i yeniden başlatın.
    - `openclaw configure` çalıştırıp bir **MiniMax** auth seçeneği seçin, veya
    - Eşleşen `models.providers.minimax` veya `models.providers.minimax-portal` bloğunu elle ekleyin, veya
    - Eşleşen sağlayıcının enjekte edilebilmesi için `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` veya bir MiniMax auth profile ayarlayın.

    Model kimliğinin **büyük/küçük harfe duyarlı** olduğundan emin olun:

    - API anahtarı yolu: `minimax/MiniMax-M2.7` veya `minimax/MiniMax-M2.7-highspeed`
    - OAuth yolu: `minimax-portal/MiniMax-M2.7` veya `minimax-portal/MiniMax-M2.7-highspeed`

    Sonra şununla yeniden kontrol edin:

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
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve failover davranışını seçme.
  </Card>
  <Card title="Image generation" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görüntü aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Music generation" href="/tr/tools/music-generation" icon="music">
    Paylaşılan müzik aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video generation" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="MiniMax Search" href="/tr/tools/minimax-search" icon="magnifying-glass">
    MiniMax Coding Plan üzerinden web araması yapılandırması.
  </Card>
  <Card title="Troubleshooting" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve SSS.
  </Card>
</CardGroup>

---
read_when:
    - OpenClaw içinde MiniMax modellerini kullanmak istediğinizde
    - MiniMax kurulum rehberine ihtiyaç duyduğunuzda
summary: OpenClaw içinde MiniMax modellerini kullanın
title: MiniMax
x-i18n:
    generated_at: "2026-04-05T14:04:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 353e1d9ce1b48c90ccaba6cc0109e839c473ca3e65d0c5d8ba744e9011c2bf45
    source_path: providers/minimax.md
    workflow: 15
---

# MiniMax

OpenClaw'un MiniMax sağlayıcısı varsayılan olarak **MiniMax M2.7** kullanır.

MiniMax ayrıca şunları da sağlar:

- T2A v2 aracılığıyla paketlenmiş konuşma sentezi
- `MiniMax-VL-01` aracılığıyla paketlenmiş görüntü anlama
- MiniMax Coding Plan arama API'si üzerinden paketlenmiş `web_search`

Sağlayıcı ayrımı:

- `minimax`: API anahtarlı metin sağlayıcısı, ayrıca paketlenmiş görüntü oluşturma, görüntü anlama, konuşma ve web arama
- `minimax-portal`: OAuth metin sağlayıcısı, ayrıca paketlenmiş görüntü oluşturma ve görüntü anlama

## Model serisi

- `MiniMax-M2.7`: varsayılan barındırılan muhakeme modeli.
- `MiniMax-M2.7-highspeed`: daha hızlı M2.7 muhakeme katmanı.
- `image-01`: görüntü oluşturma modeli (oluşturma ve görüntüden görüntüye düzenleme).

## Görüntü oluşturma

MiniMax plugin'i, `image_generate` aracı için `image-01` modelini kaydeder. Şunları destekler:

- En-boy oranı denetimiyle **metinden görüntü oluşturma**.
- En-boy oranı denetimiyle **görüntüden görüntüye düzenleme** (özne referansı).
- İstek başına en fazla **9 çıktı görüntüsü**.
- Düzenleme isteği başına en fazla **1 referans görüntü**.
- Desteklenen en-boy oranları: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`.

Görüntü oluşturma için MiniMax kullanmak üzere bunu görüntü oluşturma sağlayıcısı olarak ayarlayın:

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
`image-01` modeliyle `image_generate` kaydeder. API anahtarlı kurulumlar `MINIMAX_API_KEY` kullanır; OAuth kurulumları bunun yerine paketlenmiş `minimax-portal` kimlik doğrulama yolunu kullanabilir.

Onboarding veya API anahtarlı kurulum açık `models.providers.minimax`
girdileri yazdığında OpenClaw, `MiniMax-M2.7` ve
`MiniMax-M2.7-highspeed` modellerini `input: ["text", "image"]` ile somutlaştırır.

Paketlenmiş yerleşik MiniMax metin kataloğu ise, bu açık sağlayıcı yapılandırması var olana kadar yalnızca metin meta verisi olarak kalır. Görüntü anlama, plugin'e ait `MiniMax-VL-01` medya sağlayıcısı aracılığıyla ayrı olarak sunulur.

## Görüntü anlama

MiniMax plugin'i, görüntü anlamayı metin
kataloğundan ayrı kaydeder:

- `minimax`: varsayılan görüntü modeli `MiniMax-VL-01`
- `minimax-portal`: varsayılan görüntü modeli `MiniMax-VL-01`

Bu nedenle, paketlenmiş metin sağlayıcısı kataloğu hâlâ yalnızca metin içeren M2.7 sohbet başvurularını gösterse bile otomatik medya yönlendirmesi MiniMax görüntü anlamayı kullanabilir.

## Web arama

MiniMax plugin'i ayrıca MiniMax Coding Plan
arama API'si üzerinden `web_search` kaydeder.

- Sağlayıcı kimliği: `minimax`
- Yapılandırılmış sonuçlar: başlıklar, URL'ler, özetler, ilgili sorgular
- Tercih edilen ortam değişkeni: `MINIMAX_CODE_PLAN_KEY`
- Kabul edilen ortam takma adı: `MINIMAX_CODING_API_KEY`
- Uyumluluk geri dönüşü: zaten coding-plan token'ına işaret ediyorsa `MINIMAX_API_KEY`
- Bölge yeniden kullanımı: `plugins.entries.minimax.config.webSearch.region`, sonra `MINIMAX_API_HOST`, sonra MiniMax sağlayıcı temel URL'leri
- Arama, `minimax` sağlayıcı kimliği üzerinde kalır; OAuth CN/global kurulumu yine de bölgeyi dolaylı olarak `models.providers.minimax-portal.baseUrl` üzerinden yönlendirebilir

Yapılandırma `plugins.entries.minimax.config.webSearch.*` altında bulunur.
Bkz. [MiniMax Search](/tools/minimax-search).

## Bir kurulum seçin

### MiniMax OAuth (Coding Plan) - önerilen

**Şunun için en iyisi:** OAuth aracılığıyla MiniMax Coding Plan ile hızlı kurulum, API anahtarı gerekmez.

Açık bölgesel OAuth seçimiyle kimlik doğrulaması yapın:

```bash
openclaw onboard --auth-choice minimax-global-oauth
# veya
openclaw onboard --auth-choice minimax-cn-oauth
```

Seçim eşlemesi:

- `minimax-global-oauth`: Uluslararası kullanıcılar (`api.minimax.io`)
- `minimax-cn-oauth`: Çin'deki kullanıcılar (`api.minimaxi.com`)

Ayrıntılar için OpenClaw reposundaki MiniMax plugin paket README dosyasına bakın.

### MiniMax M2.7 (API anahtarı)

**Şunun için en iyisi:** Anthropic uyumlu API ile barındırılan MiniMax.

CLI aracılığıyla yapılandırın:

- Etkileşimli onboarding:

```bash
openclaw onboard --auth-choice minimax-global-api
# veya
openclaw onboard --auth-choice minimax-cn-api
```

- `minimax-global-api`: Uluslararası kullanıcılar (`api.minimax.io`)
- `minimax-cn-api`: Çin'deki kullanıcılar (`api.minimaxi.com`)

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

Anthropic uyumlu akış yolunda OpenClaw artık, siz açıkça `thinking` ayarlamadığınız sürece MiniMax
thinking özelliğini varsayılan olarak devre dışı bırakır. MiniMax'in
akış uç noktası, yerel Anthropic thinking blokları yerine OpenAI tarzı delta parçalarında `reasoning_content`
yayınlar; bu da örtük olarak etkin bırakılırsa iç muhakemenin görünür çıktıya sızmasına neden olabilir.

### Geri dönüş olarak MiniMax M2.7 (örnek)

**Şunun için en iyisi:** en güçlü yeni nesil modelinizi birincil olarak tutup hata durumunda MiniMax M2.7'ye geçmek.
Aşağıdaki örnek somut bir birincil model olarak Opus kullanır; bunu tercih ettiğiniz en yeni nesil birincil modelle değiştirin.

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

## `openclaw configure` ile yapılandırın

JSON düzenlemeden MiniMax ayarlamak için etkileşimli yapılandırma sihirbazını kullanın:

1. `openclaw configure` çalıştırın.
2. **Model/auth** seçeneğini seçin.
3. Bir **MiniMax** kimlik doğrulama seçeneği seçin.
4. İstendiğinde varsayılan modelinizi seçin.

Sihirbaz/CLI içindeki geçerli MiniMax kimlik doğrulama seçenekleri:

- `minimax-global-oauth`
- `minimax-cn-oauth`
- `minimax-global-api`
- `minimax-cn-api`

## Yapılandırma seçenekleri

- `models.providers.minimax.baseUrl`: tercihen `https://api.minimax.io/anthropic` (Anthropic uyumlu); `https://api.minimax.io/v1`, OpenAI uyumlu yükler için isteğe bağlıdır.
- `models.providers.minimax.api`: tercihen `anthropic-messages`; `openai-completions`, OpenAI uyumlu yükler için isteğe bağlıdır.
- `models.providers.minimax.apiKey`: MiniMax API anahtarı (`MINIMAX_API_KEY`).
- `models.providers.minimax.models`: `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` tanımlayın.
- `agents.defaults.models`: izin listesinde olmasını istediğiniz modellere takma ad verin.
- `models.mode`: MiniMax'i yerleşiklerle birlikte eklemek istiyorsanız `merge` olarak bırakın.

## Notlar

- Model başvuruları kimlik doğrulama yolunu izler:
  - API anahtarlı kurulum: `minimax/<model>`
  - OAuth kurulumu: `minimax-portal/<model>`
- Varsayılan sohbet modeli: `MiniMax-M2.7`
- Alternatif sohbet modeli: `MiniMax-M2.7-highspeed`
- `api: "anthropic-messages"` üzerinde OpenClaw,
  thinking parametresi/ayarlarında zaten açıkça ayarlanmadıysa
  `thinking: { type: "disabled" }` enjekte eder.
- `/fast on` veya `params.fastMode: true`, Anthropic uyumlu akış yolunda
  `MiniMax-M2.7` modelini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
- Onboarding ve doğrudan API anahtarlı kurulum, her iki M2.7 varyantı için de
  `input: ["text", "image"]` içeren açık model tanımları yazar
- Paketlenmiş sağlayıcı kataloğu şu anda, açık MiniMax sağlayıcı yapılandırması oluşana kadar sohbet başvurularını yalnızca metin meta verisi olarak sunar
- Coding Plan kullanım API'si: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (bir coding plan anahtarı gerektirir).
- OpenClaw, MiniMax coding-plan kullanımını diğer sağlayıcılarda kullanılan aynı `% kaldı` görünümüne normalize eder. MiniMax'in ham `usage_percent` / `usagePercent`
  alanları tüketilen kota değil, kalan kotadır; bu yüzden OpenClaw bunları ters çevirir.
  Sayıya dayalı alanlar mevcut olduğunda önceliklidir. API `model_remains` döndürdüğünde
  OpenClaw sohbet modeli girdisini tercih eder, gerektiğinde pencere etiketini
  `start_time` / `end_time` üzerinden türetir ve coding-plan pencerelerini ayırt etmeyi kolaylaştırmak için seçilen model adını plan etiketine dahil eder.
- Kullanım anlık görüntüleri `minimax`, `minimax-cn` ve `minimax-portal` değerlerini
  aynı MiniMax kota yüzeyi olarak ele alır ve Coding Plan anahtar ortam değişkenlerine geri dönmeden önce depolanmış MiniMax OAuth'u tercih eder.
- Tam maliyet takibi gerekiyorsa `models.json` içindeki fiyat değerlerini güncelleyin.
- MiniMax Coding Plan için yönlendirme bağlantısı (%10 indirim): [https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
- Sağlayıcı kuralları için bkz. [/concepts/model-providers](/tr/concepts/model-providers).
- Geçerli sağlayıcı kimliğini doğrulamak için `openclaw models list` kullanın, ardından
  `openclaw models set minimax/MiniMax-M2.7` veya
  `openclaw models set minimax-portal/MiniMax-M2.7` ile değiştirin.

## Sorun giderme

### "Unknown model: minimax/MiniMax-M2.7"

Bu genellikle **MiniMax sağlayıcısının yapılandırılmadığı** anlamına gelir (eşleşen
bir sağlayıcı girdisi yoktur ve MiniMax auth profile/env key de bulunamamıştır). Bu
algılama için bir düzeltme **2026.1.12** sürümündedir. Şunları yaparak düzeltin:

- **2026.1.12** sürümüne yükseltin (veya kaynaktan `main` çalıştırın), ardından gateway'i yeniden başlatın.
- `openclaw configure` çalıştırıp bir **MiniMax** kimlik doğrulama seçeneği seçin, veya
- Eşleşen `models.providers.minimax` veya
  `models.providers.minimax-portal` bloğunu elle ekleyin, veya
- Eşleşen sağlayıcının enjekte edilebilmesi için `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` veya bir MiniMax auth profile ayarlayın

Model kimliğinin **büyük/küçük harfe duyarlı** olduğundan emin olun:

- API anahtarlı yol: `minimax/MiniMax-M2.7` veya `minimax/MiniMax-M2.7-highspeed`
- OAuth yolu: `minimax-portal/MiniMax-M2.7` veya
  `minimax-portal/MiniMax-M2.7-highspeed`

Ardından şununla yeniden denetleyin:

```bash
openclaw models list
```

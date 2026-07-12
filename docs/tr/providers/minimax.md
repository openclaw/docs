---
read_when:
    - OpenClaw'da MiniMax modellerini kullanmak istiyorsunuz
    - MiniMax kurulum rehberine ihtiyacınız var
summary: OpenClaw'da MiniMax modellerini kullanın
title: MiniMax
x-i18n:
    generated_at: "2026-07-12T12:43:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1172d2d2c92dc92858f15564eee9ffeb8eb9599ee70157116fd2e302556dd75a
    source_path: providers/minimax.md
    workflow: 16
---

  Paketle birlikte gelen `minimax` Plugin'i, iki sağlayıcının yanı sıra yedi yetenek kaydeder: sohbet, görsel oluşturma, müzik oluşturma, video oluşturma, görsel anlama, konuşma (T2A v2) ve web araması.

  | Sağlayıcı kimliği | Kimlik doğrulama | Yetenekler                                                                                       |
  | ----------------- | ----------------- | ------------------------------------------------------------------------------------------------ |
  | `minimax`         | API anahtarı      | Metin, görsel oluşturma, müzik oluşturma, video oluşturma, görsel anlama, konuşma, web araması    |
  | `minimax-portal`  | OAuth             | Metin, görsel oluşturma, müzik oluşturma, video oluşturma, görsel anlama, konuşma                 |

  <Tip>
  MiniMax Coding Plan için yönlendirme bağlantısı (%10 indirim): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
  </Tip>

  ## Yerleşik katalog

  | Model                    | Tür                  | Açıklama                                       |
  | ------------------------ | -------------------- | ---------------------------------------------- |
  | `MiniMax-M3`             | Sohbet (akıl yürütme) | Varsayılan barındırılan akıl yürütme modeli    |
  | `MiniMax-M2.7`           | Sohbet (akıl yürütme) | Önceki barındırılan akıl yürütme modeli        |
  | `MiniMax-M2.7-highspeed` | Sohbet (akıl yürütme) | Daha hızlı M2.7 akıl yürütme katmanı           |
  | `MiniMax-VL-01`          | Görü                 | Görsel anlama modeli                           |
  | `image-01`               | Görsel oluşturma     | Metinden görsele ve görselden görsele düzenleme |
  | `music-2.6`              | Müzik oluşturma      | Varsayılan müzik modeli                        |
  | `MiniMax-Hailuo-2.3`     | Video oluşturma      | Metinden videoya ve görselden videoya akışlar  |

  Model başvuruları kimlik doğrulama yolunu izler: API anahtarı kurulumları için `minimax/<model>`, OAuth kurulumları için `minimax-portal/<model>`.

  ## Başlarken

  <Tabs>
  <Tab title="OAuth (Coding Plan)">
    **En uygun olduğu durum:** API anahtarı gerektirmeden OAuth aracılığıyla MiniMax Coding Plan ile hızlı kurulum.

    <Tabs>
      <Tab title="Uluslararası">
        <Steps>
          <Step title="İlk kurulumu çalıştırın">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Ortaya çıkan sağlayıcı temel URL'si: `api.minimax.io`.
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

            Ortaya çıkan sağlayıcı temel URL'si: `api.minimaxi.com`.
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
    OAuth kurulumları `minimax-portal` sağlayıcı kimliğini kullanır. Model başvuruları `minimax-portal/MiniMax-M3` biçimindedir.
    </Note>

  </Tab>

  <Tab title="API anahtarı">
    **En uygun olduğu durum:** Anthropic uyumlu API'ye sahip barındırılan MiniMax.

    <Tabs>
      <Tab title="Uluslararası">
        <Steps>
          <Step title="İlk kurulumu çalıştırın">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Bu işlem, temel URL'yi `api.minimax.io` olarak yapılandırır.
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

            Bu işlem, temel URL'yi `api.minimaxi.com` olarak yapılandırır.
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
    MiniMax-M2.x'in Anthropic uyumlu akış uç noktası, `reasoning_content` içeriğini yerel Anthropic düşünme blokları yerine OpenAI tarzı delta parçaları hâlinde gönderir; bu da düşünme örtük olarak etkin bırakılırsa dahili akıl yürütmenin görünür çıktıya sızmasına neden olur. `thinking` ayarını açıkça kendiniz belirlemediğiniz sürece OpenClaw, M2.x düşünmesini varsayılan olarak devre dışı bırakır. MiniMax-M3 (ve ileriye dönük uyumlu M3.x) bundan muaftır: M3, uygun Anthropic düşünme blokları gönderir ve görünür içerik üretebilmek için düşünmenin etkin olmasını gerektirir; bu nedenle OpenClaw, M3'ü sağlayıcının uyarlanabilir düşünme yolunda tutar. Aşağıdaki Gelişmiş yapılandırma bölümünde yer alan Düşünme varsayılanları kısmına bakın.
    </Warning>

    <Note>
    API anahtarı kurulumları `minimax` sağlayıcı kimliğini kullanır. Model başvuruları `minimax/MiniMax-M3` biçimindedir.
    </Note>

  </Tab>
</Tabs>

## `openclaw configure` ile yapılandırma

<Steps>
  <Step title="Sihirbazı başlatın">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Model/kimlik doğrulama seçeneğini belirleyin">
    Menüden **Model/kimlik doğrulama** seçeneğini belirleyin.
  </Step>
  <Step title="Bir MiniMax kimlik doğrulama seçeneği belirleyin">
    | Kimlik doğrulama seçeneği | Açıklama                              |
    | -------------------------- | ------------------------------------- |
    | `minimax-global-oauth`     | Uluslararası OAuth (Kodlama Planı)    |
    | `minimax-cn-oauth`         | Çin OAuth'ı (Kodlama Planı)           |
    | `minimax-global-api`       | Uluslararası API anahtarı             |
    | `minimax-cn-api`           | Çin API anahtarı                      |
  </Step>
  <Step title="Varsayılan modelinizi seçin">
    İstendiğinde varsayılan modelinizi seçin.
  </Step>
</Steps>

## Yetenekler

### Görsel oluşturma

MiniMax Plugin'i, metin modelleriyle aynı `MINIMAX_API_KEY` veya OAuth kimlik doğrulamasını yeniden kullanarak hem `minimax` hem de `minimax-portal` üzerinde `image_generate` aracı için `image-01` modelini kaydeder.

- Her ikisinde de en-boy oranı denetimi bulunan metinden görsel oluşturma ve görselden görsele düzenleme (özne referansı)
- İstek başına en fazla 9 çıktı görseli, düzenleme isteği başına 1 referans görseli
- Desteklenen en-boy oranları: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Görsel oluşturma her zaman MiniMax'ın özel görsel uç noktasını (`/v1/image_generation`) kullanır ve bu alan sohbet/Anthropic uyumlu temel URL'yi yapılandırdığı için `models.providers.minimax.baseUrl` değerini yok sayar. Görsel oluşturmayı Çin uç noktası üzerinden yönlendirmek için `MINIMAX_API_HOST=https://api.minimaxi.com` değerini ayarlayın; varsayılan küresel uç nokta `https://api.minimax.io` adresidir.

<Note>
Ortak araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Görsel Oluşturma](/tr/tools/image-generation) bölümüne bakın.
</Note>

### Metinden konuşmaya

Paketle gelen `minimax` Plugin'i, MiniMax T2A v2'yi `messages.tts` için bir konuşma sağlayıcısı olarak kaydeder.

- Varsayılan TTS modeli: `speech-2.8-hd`
- Varsayılan ses: `English_expressive_narrator`
- Paketle gelen model kimlikleri: `speech-2.8-hd`, `speech-2.8-turbo`, `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`, `speech-02-turbo`, `speech-01-hd`, `speech-01-turbo`, `speech-01-240228`
- Kimlik doğrulama çözümleme sırası: `messages.tts.providers.minimax.apiKey`, ardından `minimax-portal` OAuth/belirteç kimlik doğrulama profilleri, ardından Token Plan ortam anahtarları (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`) ve son olarak `MINIMAX_API_KEY`
- Hiçbir TTS ana makinesi yapılandırılmamışsa OpenClaw, yapılandırılmış `minimax-portal` OAuth ana makinesini yeniden kullanır ve `/anthropic` gibi Anthropic uyumlu yol son eklerini kaldırır
- Normal ses ekleri MP3 olarak kalır. Sesli not hedefleri (Feishu, Telegram ve sesli not uyumlu ek isteyen diğer kanallar), örneğin Feishu/Lark dosya API'si yerel sesli mesajlar için yalnızca `file_type: "opus"` değerini kabul ettiğinden MiniMax MP3'ten `ffmpeg` ile 48 kHz Opus'a dönüştürülür
- MiniMax T2A, kesirli `speed` ve `vol` değerlerini kabul eder ancak `pitch` tam sayı olarak gönderilir; OpenClaw, API isteğinden önce kesirli `pitch` değerlerinin ondalık kısmını atar

| Ayar                                     | Ortam değişkeni         | Varsayılan                    | Açıklama                                  |
| ---------------------------------------- | ----------------------- | ----------------------------- | ----------------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`      | `https://api.minimax.io`      | MiniMax T2A API ana makinesi.             |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`     | `speech-2.8-hd`               | TTS model kimliği.                        |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID`  | `English_expressive_narrator` | Konuşma çıktısında kullanılan ses kimliği. |
| `messages.tts.providers.minimax.speed`   |                         | `1.0`                         | Oynatma hızı, `0.5..2.0`.                 |
| `messages.tts.providers.minimax.vol`     |                         | `1.0`                         | Ses düzeyi, `(0, 10]`.                    |
| `messages.tts.providers.minimax.pitch`   |                         | `0`                           | Tam sayı perde kaydırması, `-12..12`.     |

### Müzik oluşturma

Paketle gelen MiniMax Plugin'i, hem `minimax` hem de `minimax-portal` için ortak `music_generate` aracı üzerinden müzik oluşturmayı kaydeder.

- Varsayılan müzik modeli: `minimax/music-2.6` (OAuth: `minimax-portal/music-2.6`)
- `music-2.6-free`, `music-cover` ve `music-cover-free` modellerini de destekler
- İstem denetimleri: `lyrics`, `instrumental`
- Çıktı biçimi: `mp3`
- Oturum destekli çalıştırmalar, `action: "status"` dâhil olmak üzere ortak görev/durum akışı üzerinden ayrılır

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: { primary: "minimax/music-2.6" },
    },
  },
}
```

<Note>
Ortak araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Müzik Oluşturma](/tr/tools/music-generation) bölümüne bakın.
</Note>

### Video oluşturma

Paketle gelen MiniMax Plugin'i, hem `minimax` hem de `minimax-portal` için ortak `video_generate` aracı üzerinden video oluşturmayı kaydeder.

- Varsayılan video modeli: `minimax/MiniMax-Hailuo-2.3` (OAuth: `minimax-portal/MiniMax-Hailuo-2.3`)
- `MiniMax-Hailuo-2.3-Fast`, `MiniMax-Hailuo-02`, `I2V-01-Director`, `I2V-01-live` ve `I2V-01` modellerini de destekler
- Modlar: metinden videoya ve tek görsel referanslı akışlar
- `resolution` değerini destekler (Hailuo 2.3/02 modellerinde `768P` veya `1080P`); `aspectRatio` desteklenmez ve yok sayılır

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "minimax/MiniMax-Hailuo-2.3" },
    },
  },
}
```

<Note>
Ortak araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Video Üretimi](/tr/tools/video-generation) bölümüne bakın.
</Note>

### Görüntü anlama

MiniMax plugin'i, görüntü anlamayı metin kataloğundan ayrı olarak kaydeder:

| Sağlayıcı kimliği | Varsayılan görüntü modeli | PDF metin çıkarma |
| ---------------- | ------------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     | `MiniMax-M2.7`      |
| `minimax-portal` | `MiniMax-VL-01`     | `MiniMax-M2.7`      |

Bu nedenle otomatik medya yönlendirmesi, paketle gelen metin sağlayıcısı kataloğu görüntü destekli M3 sohbet referanslarını da içerdiğinde bile MiniMax görüntü anlamayı kullanabilir. PDF anlama, yalnızca metin çıkarma için `MiniMax-M2.7` kullanır; MiniMax, PDF'den görüntüye dönüştürme yolu kaydetmez.

### Web araması

MiniMax plugin'i ayrıca MiniMax Token Plan arama API'si (`/v1/coding_plan/search`) üzerinden `web_search` kaydeder.

- Sağlayıcı kimliği: `minimax`
- Yapılandırılmış sonuçlar: başlıklar, URL'ler, metin parçacıkları, ilgili sorgular
- Tercih edilen ortam değişkeni: `MINIMAX_CODE_PLAN_KEY`
- Kabul edilen ortam değişkeni diğer adları: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Uyumluluk geri dönüşü: Zaten bir token planı kimlik bilgisine işaret ediyorsa `MINIMAX_API_KEY`
- Bölgeyi yeniden kullanma sırası: `plugins.entries.minimax.config.webSearch.region`, ardından `MINIMAX_API_HOST`, ardından MiniMax sağlayıcı temel URL'leri
- Arama, `minimax` sağlayıcı kimliğinde kalır; OAuth CN/küresel kurulumu, `models.providers.minimax-portal.baseUrl` aracılığıyla bölgeyi dolaylı olarak yönlendirebilir ve `MINIMAX_OAUTH_TOKEN` aracılığıyla taşıyıcı kimlik doğrulaması sağlayabilir

Yapılandırma `plugins.entries.minimax.config.webSearch.*` altında bulunur.

<Note>
Eksiksiz web araması yapılandırması ve kullanımı için [MiniMax Arama](/tr/tools/minimax-search) bölümüne bakın.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Yapılandırma seçenekleri">
    | Seçenek | Açıklama |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | `https://api.minimax.io/anthropic` adresini (Anthropic uyumlu) tercih edin; OpenAI uyumlu yükler için `https://api.minimax.io/v1` isteğe bağlıdır |
    | `models.providers.minimax.api` | `anthropic-messages` değerini tercih edin; OpenAI uyumlu yükler için `openai-completions` isteğe bağlıdır |
    | `models.providers.minimax.apiKey` | MiniMax API anahtarı (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` değerlerini tanımlayın |
    | `agents.defaults.models` | İzin verilenler listesinde olmasını istediğiniz modellere diğer ad verin |
    | `models.mode` | MiniMax'i yerleşik modellerin yanına eklemek istiyorsanız `merge` olarak tutun |
  </Accordion>

  <Accordion title="Düşünme varsayılanları">
    `api: "anthropic-messages"` kullanıldığında, daha önceki bir sarmalayıcı yükte `thinking` alanını zaten ayarlamamışsa OpenClaw, MiniMax M2.x modelleri için `thinking: { type: "disabled" }` ekler. Bu, M2.x'in akış uç noktasının OpenAI tarzı değişiklik parçalarında `reasoning_content` yaymasını önler; aksi takdirde dahili akıl yürütme görünür çıktıya sızardı.

    MiniMax-M3 (ve M3.x) bundan muaftır: Düşünme devre dışı bırakıldığında M3, `stop_reason: "end_turn"` ile boş bir `content` dizisi döndürür. Bu nedenle OpenClaw, M3 için örtük devre dışı varsayılanını kaldırır ve bir düşünme düzeyi ayarlandığında bunun yerine `thinking: { type: "adaptive" }` değerini zorunlu kılar.

    Model ailesine göre kullanılabilir düşünme düzeyleri:

    | Model ailesi   | Düzeyler                                   | Varsayılan    |
    | -------------- | ----------------------------------------- | ---------- |
    | `MiniMax-M3`   | `off`, `adaptive`                        | `adaptive` |
    | `MiniMax-M2.x` | `off`, `minimal`, `low`, `medium`, `high` | `off`      |

  </Accordion>

  <Accordion title="Hızlı mod">
    `/fast on` veya `params.fastMode: true`, Anthropic uyumlu akış yolunda (`api: "anthropic-messages"`, sağlayıcı `minimax` veya `minimax-portal`) `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
  </Accordion>

  <Accordion title="Geri dönüş örneği">
    **En uygun kullanım:** En güçlü en yeni nesil modelinizi birincil olarak tutun, başarısızlık durumunda MiniMax M2.7'ye geçin. Aşağıdaki örnekte somut bir birincil model olarak Opus kullanılır; bunu tercih ettiğiniz en yeni nesil birincil modelle değiştirin.

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
    - Kullanım yoklaması, yapılandırıldığında ana bilgisayarı `models.providers.minimax-portal.baseUrl` veya `models.providers.minimax.baseUrl` üzerinden türetir; böylece `https://api.minimax.io/anthropic` kullanan küresel kurulumlar `api.minimax.io` adresini yoklar. Eksik veya hatalı biçimlendirilmiş temel URL'ler, uyumluluk için CN geri dönüşünü korur.
    - OpenClaw, MiniMax coding planı kullanımını diğer sağlayıcıların kullandığı aynı `% kaldı` gösterimine normalleştirir. MiniMax'in ham `usage_percent` / `usagePercent` alanları tüketilen kotayı değil, kalan kotayı belirtir; bu nedenle OpenClaw bunları tersine çevirir. Mevcut olduğunda sayım tabanlı alanlara öncelik verilir.
    - API `model_remains` döndürdüğünde OpenClaw, sohbet modeli girdisini tercih eder, gerektiğinde pencere etiketini `start_time` / `end_time` değerlerinden türetir ve coding planı pencerelerinin daha kolay ayırt edilebilmesi için seçilen model adını plan etiketine ekler.
    - Kullanım anlık görüntüleri `minimax`, `minimax-cn`, `minimax-portal` ve `minimax-portal-cn` değerlerini aynı MiniMax kota yüzeyi olarak değerlendirir ve Coding Plan anahtarı ortam değişkenlerine geri dönmeden önce kayıtlı MiniMax OAuth'u tercih eder.

  </Accordion>
</AccordionGroup>

## Notlar

- Varsayılan sohbet modeli: `MiniMax-M3`. Alternatif sohbet modelleri: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- İlk katılım ve doğrudan API anahtarı kurulumu, M3 ve her iki M2.7 çeşidi için model tanımları yazar
- Görüntü anlama, plugin'e ait `MiniMax-VL-01` medya sağlayıcısını kullanır
- Kesin maliyet takibine ihtiyacınız varsa `models.json` içindeki fiyatlandırma değerlerini güncelleyin
- Geçerli sağlayıcı kimliğini doğrulamak için `openclaw models list` komutunu kullanın, ardından `openclaw models set minimax/MiniMax-M3` veya `openclaw models set minimax-portal/MiniMax-M3` ile geçiş yapın

<Note>
Sağlayıcı kuralları için [Model sağlayıcıları](/tr/concepts/model-providers) bölümüne bakın.
</Note>

## Sorun giderme

<AccordionGroup>
  <Accordion title='"Bilinmeyen model: minimax/MiniMax-M3"'>
    Bu genellikle **MiniMax sağlayıcısının yapılandırılmadığı** anlamına gelir (eşleşen sağlayıcı girdisi ve MiniMax kimlik doğrulama profili/ortam anahtarı bulunamadı). Düzeltmek için:

    - `openclaw configure` komutunu çalıştırıp bir **MiniMax** kimlik doğrulama seçeneği belirleyin veya
    - Eşleşen `models.providers.minimax` ya da `models.providers.minimax-portal` bloğunu elle ekleyin veya
    - Eşleşen sağlayıcının eklenebilmesi için `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` veya bir MiniMax kimlik doğrulama profili ayarlayın.

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
Daha fazla yardım: [Sorun giderme](/tr/help/troubleshooting) ve [SSS](/tr/help/faq).
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Görüntü üretimi" href="/tr/tools/image-generation" icon="image">
    Ortak görüntü aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Müzik üretimi" href="/tr/tools/music-generation" icon="music">
    Ortak müzik aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video üretimi" href="/tr/tools/video-generation" icon="video">
    Ortak video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="MiniMax Arama" href="/tr/tools/minimax-search" icon="magnifying-glass">
    MiniMax Token Plan aracılığıyla web araması yapılandırması.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve SSS.
  </Card>
</CardGroup>

---
read_when:
    - OpenClaw'da MiniMax modelleri istiyorsunuz
    - MiniMax kurulumu için rehberliğe ihtiyacınız var
summary: OpenClaw'da MiniMax modellerini kullanma
title: MiniMax
x-i18n:
    generated_at: "2026-05-02T09:04:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c7aea4d9656d6ffddab7c43b06940e58bdd119a03b62000e689a3348f7df5a2
    source_path: providers/minimax.md
    workflow: 16
---

OpenClaw'ın MiniMax sağlayıcısı varsayılan olarak **MiniMax M2.7** kullanır.

MiniMax ayrıca şunları sağlar:

- T2A v2 ile birlikte gelen konuşma sentezi
- `MiniMax-VL-01` ile birlikte gelen görsel anlama
- `music-2.6` ile birlikte gelen müzik oluşturma
- MiniMax Token Plan arama API'si üzerinden birlikte gelen `web_search`

Sağlayıcı ayrımı:

| Sağlayıcı ID'si | Kimlik doğrulama | Yetenekler                                                                                         |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | API anahtarı | Metin, görsel oluşturma, müzik oluşturma, video oluşturma, görsel anlama, konuşma, web araması |
| `minimax-portal` | OAuth   | Metin, görsel oluşturma, müzik oluşturma, video oluşturma, görsel anlama, konuşma             |

## Yerleşik katalog

| Model                    | Tür              | Açıklama                                 |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | Sohbet (akıl yürütme) | Varsayılan barındırılan akıl yürütme modeli |
| `MiniMax-M2.7-highspeed` | Sohbet (akıl yürütme) | Daha hızlı M2.7 akıl yürütme katmanı     |
| `MiniMax-VL-01`          | Görü             | Görsel anlama modeli                     |
| `image-01`               | Görsel oluşturma | Metinden görsele ve görselden görsele düzenleme |
| `music-2.6`              | Müzik oluşturma  | Varsayılan müzik modeli                  |
| `music-2.5`              | Müzik oluşturma  | Önceki müzik oluşturma katmanı           |
| `music-2.0`              | Müzik oluşturma  | Eski müzik oluşturma katmanı             |
| `MiniMax-Hailuo-2.3`     | Video oluşturma  | Metinden videoya ve görsel referans akışları |

## Başlarken

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **En uygun kullanım:** OAuth üzerinden MiniMax Coding Plan ile hızlı kurulum, API anahtarı gerekmez.

    <Tabs>
      <Tab title="Uluslararası">
        <Steps>
          <Step title="İlk kurulumu çalıştırın">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Bu, `api.minimax.io` ile kimlik doğrulaması yapar.
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

            Bu, `api.minimaxi.com` ile kimlik doğrulaması yapar.
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
    OAuth kurulumları `minimax-portal` sağlayıcı id'sini kullanır. Model başvuruları `minimax-portal/MiniMax-M2.7` biçimini izler.
    </Note>

    <Tip>
    MiniMax Coding Plan için yönlendirme bağlantısı (%10 indirim): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API anahtarı">
    **En uygun kullanım:** Anthropic uyumlu API ile barındırılan MiniMax.

    <Tabs>
      <Tab title="Uluslararası">
        <Steps>
          <Step title="İlk kurulumu çalıştırın">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Bu, temel URL olarak `api.minimax.io` adresini yapılandırır.
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

            Bu, temel URL olarak `api.minimaxi.com` adresini yapılandırır.
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
    Anthropic uyumlu akış yolunda, `thinking` değerini açıkça kendiniz ayarlamadığınız sürece OpenClaw varsayılan olarak MiniMax düşünmeyi devre dışı bırakır. MiniMax'ın akış uç noktası, yerel Anthropic düşünme blokları yerine OpenAI tarzı delta parçalarında `reasoning_content` yayar; bu, örtük olarak etkin bırakılırsa dahili akıl yürütmenin görünür çıktıya sızmasına neden olabilir.
    </Warning>

    <Note>
    API anahtarı kurulumları `minimax` sağlayıcı id'sini kullanır. Model başvuruları `minimax/MiniMax-M2.7` biçimini izler.
    </Note>

  </Tab>
</Tabs>

## `openclaw configure` ile yapılandırma

JSON düzenlemeden MiniMax'i ayarlamak için etkileşimli yapılandırma sihirbazını kullanın:

<Steps>
  <Step title="Sihirbazı başlatın">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Model/kimlik doğrulamayı seçin">
    Menüden **Model/kimlik doğrulama** seçeneğini belirleyin.
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

## Özellikler

### Görsel oluşturma

MiniMax Plugin, `image_generate` aracı için `image-01` modelini kaydeder. Şunları destekler:

- En boy oranı denetimiyle **metinden görsel oluşturma**
- En boy oranı denetimiyle **görselden görsele düzenleme** (konu referansı)
- İstek başına en fazla **9 çıktı görseli**
- Düzenleme isteği başına en fazla **1 referans görsel**
- Desteklenen en boy oranları: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Görsel oluşturma için MiniMax'i kullanmak üzere görsel oluşturma sağlayıcısı olarak ayarlayın:

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

Hem `minimax` hem de `minimax-portal`, aynı `image-01` modeliyle `image_generate` kaydı yapar. API anahtarı kurulumları `MINIMAX_API_KEY` kullanır; OAuth kurulumları bunun yerine paketle gelen `minimax-portal` kimlik doğrulama yolunu kullanabilir.

Görsel oluşturma her zaman MiniMax'in özel görsel uç noktasını (`/v1/image_generation`) kullanır ve `models.providers.minimax.baseUrl` değerini yok sayar; çünkü bu alan sohbet/Anthropic uyumlu temel URL'yi yapılandırır. Görsel oluşturmayı CN uç noktası üzerinden yönlendirmek için `MINIMAX_API_HOST=https://api.minimaxi.com` ayarlayın; varsayılan global uç nokta `https://api.minimax.io` değeridir.

İlk kurulum veya API anahtarı kurulumu açık `models.providers.minimax` girdileri yazdığında, OpenClaw `MiniMax-M2.7` ve `MiniMax-M2.7-highspeed` modellerini yalnızca metin sohbet modelleri olarak somutlaştırır. Görsel anlama, Plugin tarafından sahip olunan `MiniMax-VL-01` medya sağlayıcısı üzerinden ayrı olarak sunulur.

<Note>
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Görsel Oluşturma](/tr/tools/image-generation) bölümüne bakın.
</Note>

### Metinden konuşmaya

Paketle gelen `minimax` Plugin, MiniMax T2A v2'yi `messages.tts` için bir konuşma sağlayıcısı olarak kaydeder.

- Varsayılan TTS modeli: `speech-2.8-hd`
- Varsayılan ses: `English_expressive_narrator`
- Desteklenen paket model kimlikleri arasında `speech-2.8-hd`, `speech-2.8-turbo`, `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`, `speech-02-turbo`, `speech-01-hd` ve `speech-01-turbo` bulunur.
- Kimlik doğrulama çözümleme sırası `messages.tts.providers.minimax.apiKey`, ardından `minimax-portal` OAuth/token kimlik doğrulama profilleri, ardından Token Plan ortam anahtarları (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`), ardından `MINIMAX_API_KEY` şeklindedir.
- TTS ana makinesi yapılandırılmamışsa OpenClaw, yapılandırılmış `minimax-portal` OAuth ana makinesini yeniden kullanır ve `/anthropic` gibi Anthropic uyumlu yol soneklerini kaldırır.
- Normal ses ekleri MP3 olarak kalır.
- Feishu ve Telegram gibi sesli not hedefleri, MiniMax MP3'ten `ffmpeg` ile 48 kHz Opus biçimine dönüştürülür; çünkü Feishu/Lark dosya API'si yerel ses mesajları için yalnızca `file_type: "opus"` değerini kabul eder.
- MiniMax T2A kesirli `speed` ve `vol` değerlerini kabul eder, ancak `pitch` tam sayı olarak gönderilir; OpenClaw, API isteğinden önce kesirli `pitch` değerlerini keser.

| Ayar                                     | Ortam değişkeni        | Varsayılan                    | Açıklama                         |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | MiniMax T2A API ana makinesi.    |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | TTS model kimliği.               |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Konuşma çıktısı için kullanılan ses kimliği. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Oynatma hızı, `0.5..2.0`.        |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Ses düzeyi, `(0, 10]`.           |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Tam sayı perde kaydırması, `-12..12`. |

### Müzik oluşturma

Paketle gelen MiniMax Plugin, hem `minimax` hem de `minimax-portal` için paylaşılan `music_generate` aracı üzerinden müzik oluşturmayı kaydeder.

- Varsayılan müzik modeli: `minimax/music-2.6`
- OAuth müzik modeli: `minimax-portal/music-2.6`
- `minimax/music-2.5` ve `minimax/music-2.0` modellerini de destekler
- İstem denetimleri: `lyrics`, `instrumental`, `durationSeconds`
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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Müzik Oluşturma](/tr/tools/music-generation) bölümüne bakın.
</Note>

### Video oluşturma

Paketle gelen MiniMax Plugin, hem `minimax` hem de `minimax-portal` için paylaşılan `video_generate` aracı üzerinden video oluşturmayı kaydeder.

- Varsayılan video modeli: `minimax/MiniMax-Hailuo-2.3`
- OAuth video modeli: `minimax-portal/MiniMax-Hailuo-2.3`
- Modlar: metinden videoya ve tek görsel referans akışları
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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Video Generation](/tr/tools/video-generation) bölümüne bakın.
</Note>

### Görsel anlama

MiniMax Plugin, görsel anlamayı metin kataloğundan ayrı olarak kaydeder:

| Sağlayıcı ID'si  | Varsayılan görsel modeli |
| ---------------- | ------------------------ |
| `minimax`        | `MiniMax-VL-01`          |
| `minimax-portal` | `MiniMax-VL-01`          |

Bu nedenle otomatik medya yönlendirme, paketlenmiş metin sağlayıcı kataloğu
hala yalnızca metin M2.7 sohbet başvurularını gösterse bile MiniMax görsel
anlamayı kullanabilir.

### Web araması

MiniMax Plugin ayrıca MiniMax Token Plan arama API'si üzerinden `web_search`
kaydeder.

- Sağlayıcı id'si: `minimax`
- Yapılandırılmış sonuçlar: başlıklar, URL'ler, parçacıklar, ilgili sorgular
- Tercih edilen env var: `MINIMAX_CODE_PLAN_KEY`
- Kabul edilen env alias'ları: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Uyumluluk yedeği: zaten token-plan kimlik bilgisine işaret ettiğinde `MINIMAX_API_KEY`
- Bölgeyi yeniden kullanma: `plugins.entries.minimax.config.webSearch.region`, ardından `MINIMAX_API_HOST`, ardından MiniMax sağlayıcı taban URL'leri
- Arama, sağlayıcı id'si `minimax` üzerinde kalır; OAuth CN/küresel kurulumu, bölgeyi `models.providers.minimax-portal.baseUrl` üzerinden dolaylı olarak yönlendirebilir ve `MINIMAX_OAUTH_TOKEN` üzerinden bearer auth sağlayabilir

Yapılandırma `plugins.entries.minimax.config.webSearch.*` altında bulunur.

<Note>
Tam web araması yapılandırması ve kullanımı için [MiniMax Search](/tr/tools/minimax-search) bölümüne bakın.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Configuration options">
    | Seçenek | Açıklama |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | `https://api.minimax.io/anthropic` tercih edilir (Anthropic uyumlu); `https://api.minimax.io/v1` OpenAI uyumlu payload'lar için isteğe bağlıdır |
    | `models.providers.minimax.api` | `anthropic-messages` tercih edilir; `openai-completions` OpenAI uyumlu payload'lar için isteğe bağlıdır |
    | `models.providers.minimax.apiKey` | MiniMax API anahtarı (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` tanımlayın |
    | `agents.defaults.models` | İzin listesinde olmasını istediğiniz modeller için alias tanımlayın |
    | `models.mode` | MiniMax'i yerleşiklerle birlikte eklemek istiyorsanız `merge` olarak tutun |
  </Accordion>

  <Accordion title="Thinking defaults">
    `api: "anthropic-messages"` üzerinde, düşünme params/config içinde zaten açıkça ayarlanmadıysa OpenClaw `thinking: { type: "disabled" }` enjekte eder.

    Bu, MiniMax'in streaming endpoint'inin OpenAI tarzı delta parçalarında `reasoning_content` yaymasını engeller; aksi halde dahili akıl yürütme görünür çıktıya sızardı.

  </Accordion>

  <Accordion title="Fast mode">
    `/fast on` veya `params.fastMode: true`, Anthropic uyumlu stream yolunda `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
  </Accordion>

  <Accordion title="Fallback example">
    **En iyi kullanım:** en güçlü son nesil modelinizi birincil olarak tutun, MiniMax M2.7'ye yük devredin. Aşağıdaki örnek, somut bir birincil olarak Opus kullanır; kendi tercih ettiğiniz son nesil birincil modelle değiştirin.

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
    - Coding Plan kullanım API'si: `https://api.minimaxi.com/v1/token_plan/remains` veya `https://api.minimax.io/v1/token_plan/remains` (coding plan anahtarı gerektirir).
    - Kullanım yoklaması, yapılandırıldığında ana makineyi `models.providers.minimax-portal.baseUrl` veya `models.providers.minimax.baseUrl` üzerinden türetir; bu nedenle `https://api.minimax.io/anthropic` kullanan küresel kurulumlar `api.minimax.io` adresini yoklar. Eksik veya hatalı biçimlendirilmiş temel URL'ler uyumluluk için CN yedeğini korur.
    - OpenClaw, MiniMax coding-plan kullanımını diğer sağlayıcıların kullandığı aynı `% kaldı` gösterimine normalleştirir. MiniMax'in ham `usage_percent` / `usagePercent` alanları tüketilen kota değil, kalan kotadır; bu yüzden OpenClaw bunları tersine çevirir. Sayıma dayalı alanlar mevcut olduğunda önceliklidir.
    - API `model_remains` döndürdüğünde OpenClaw sohbet modeli girdisini tercih eder, gerektiğinde pencere etiketini `start_time` / `end_time` üzerinden türetir ve coding-plan pencerelerinin daha kolay ayırt edilebilmesi için seçilen model adını plan etiketine ekler.
    - Kullanım anlık görüntüleri `minimax`, `minimax-cn` ve `minimax-portal` değerlerini aynı MiniMax kota yüzeyi olarak ele alır ve Coding Plan anahtarı ortam değişkenlerine geri dönmeden önce saklanan MiniMax OAuth'u tercih eder.

  </Accordion>
</AccordionGroup>

## Notlar

- Model referansları kimlik doğrulama yolunu izler:
  - API anahtarı kurulumu: `minimax/<model>`
  - OAuth kurulumu: `minimax-portal/<model>`
- Varsayılan sohbet modeli: `MiniMax-M2.7`
- Alternatif sohbet modeli: `MiniMax-M2.7-highspeed`
- İlk kurulum ve doğrudan API anahtarı kurulumu, her iki M2.7 varyantı için yalnızca metin model tanımları yazar
- Görsel anlama, Plugin tarafından sahiplenilen `MiniMax-VL-01` medya sağlayıcısını kullanır
- Tam maliyet takibine ihtiyacınız varsa fiyatlandırma değerlerini `models.json` içinde güncelleyin
- Geçerli sağlayıcı kimliğini doğrulamak için `openclaw models list` komutunu kullanın, ardından `openclaw models set minimax/MiniMax-M2.7` veya `openclaw models set minimax-portal/MiniMax-M2.7` ile geçiş yapın

<Tip>
MiniMax Coding Plan için referans bağlantısı (%10 indirim): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Sağlayıcı kuralları için [Model sağlayıcıları](/tr/concepts/model-providers) bölümüne bakın.
</Note>

## Sorun giderme

<AccordionGroup>
  <Accordion title='"Bilinmeyen model: minimax/MiniMax-M2.7"'>
    Bu genellikle **MiniMax sağlayıcısının yapılandırılmadığı** anlamına gelir (eşleşen sağlayıcı girdisi yoktur ve MiniMax kimlik doğrulama profili/ortam anahtarı bulunmamıştır). Bu algılama için düzeltme **2026.1.12** sürümündedir. Şu şekilde düzeltin:

    - **2026.1.12** sürümüne yükseltin (veya kaynak koddan `main` üzerinde çalıştırın), ardından gateway'i yeniden başlatın.
    - `openclaw configure` komutunu çalıştırıp bir **MiniMax** kimlik doğrulama seçeneği belirleyin veya
    - Eşleşen `models.providers.minimax` veya `models.providers.minimax-portal` bloğunu elle ekleyin veya
    - Eşleşen sağlayıcının enjekte edilebilmesi için `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` ya da bir MiniMax kimlik doğrulama profili ayarlayın.

    Model kimliğinin **büyük/küçük harfe duyarlı** olduğundan emin olun:

    - API anahtarı yolu: `minimax/MiniMax-M2.7` veya `minimax/MiniMax-M2.7-highspeed`
    - OAuth yolu: `minimax-portal/MiniMax-M2.7` veya `minimax-portal/MiniMax-M2.7-highspeed`

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
    MiniMax Token Plan aracılığıyla web araması yapılandırması.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve SSS.
  </Card>
</CardGroup>

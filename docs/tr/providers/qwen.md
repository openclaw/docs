---
read_when:
    - OpenClaw ile Qwen kullanmak istiyorsunuz
    - Daha önce Qwen OAuth kullandınız
summary: Qwen Cloud'u OpenClaw Plugin'i aracılığıyla kullanın
title: Qwen
x-i18n:
    generated_at: "2026-06-28T01:12:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e42a38f3e7f2db54092886f2ef8c3ab27163c3c3d0f9b4d95affd58555f58d3
    source_path: providers/qwen.md
    workflow: 16
---

OpenClaw artık Qwen'i kanonik kimliği `qwen` olan birinci sınıf sağlayıcı Plugin'i olarak ele alır. Sağlayıcı Plugin'i Qwen Cloud / Alibaba DashScope ve Coding Plan uç noktalarını hedefler, eski `modelstudio` kimliklerini uyumluluk takma adı olarak çalışır durumda tutar ve Qwen Portal belirteci akışını da `qwen-oauth` sağlayıcısı olarak sunar.

- Sağlayıcı: `qwen`
- Portal sağlayıcısı: [`qwen-oauth`](/tr/providers/qwen-oauth)
- Tercih edilen ortam değişkeni: `QWEN_API_KEY`
- Uyumluluk için de kabul edilir: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API stili: OpenAI uyumlu

<Tip>
`qwen3.6-plus` istiyorsanız **Standard (kullandıkça öde)** uç noktasını tercih edin.
Coding Plan desteği genel kataloğun gerisinde kalabilir.
</Tip>

## Plugin'i yükle

Resmi Plugin'i yükleyin, ardından Gateway'i yeniden başlatın:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## Başlarken

Plan türünüzü seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="Coding Plan (abonelik)">
    **En uygun kullanım:** Qwen Coding Plan üzerinden abonelik tabanlı erişim.

    <Steps>
      <Step title="API anahtarınızı alın">
        [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) adresinden bir API anahtarı oluşturun veya kopyalayın.
      </Step>
      <Step title="İlk kurulumu çalıştırın">
        **Global** uç nokta için:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        **China** uç noktası için:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Varsayılan model ayarlayın">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Eski `modelstudio-*` auth-choice kimlikleri ve `modelstudio/...` model referansları
    uyumluluk takma adları olarak çalışmaya devam eder, ancak yeni kurulum akışları kanonik
    `qwen-*` auth-choice kimliklerini ve `qwen/...` model referanslarını tercih etmelidir. Başka bir `api` değerine sahip tam eşleşen
    özel bir `models.providers.modelstudio` girdisi tanımlarsanız, bu özel sağlayıcı Qwen uyumluluk
    takma adı yerine `modelstudio/...` referanslarının sahibi olur.
    </Note>

  </Tab>

  <Tab title="Standard (kullandıkça öde)">
    **En uygun kullanım:** Coding Plan'da bulunmayabilecek `qwen3.6-plus` gibi modeller dahil olmak üzere Standard Model Studio uç noktası üzerinden kullandıkça öde erişimi.

    <Steps>
      <Step title="API anahtarınızı alın">
        [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) adresinden bir API anahtarı oluşturun veya kopyalayın.
      </Step>
      <Step title="İlk kurulumu çalıştırın">
        **Global** uç nokta için:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        **China** uç noktası için:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Varsayılan model ayarlayın">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Eski `modelstudio-*` auth-choice kimlikleri ve `modelstudio/...` model referansları
    uyumluluk takma adları olarak çalışmaya devam eder, ancak yeni kurulum akışları kanonik
    `qwen-*` auth-choice kimliklerini ve `qwen/...` model referanslarını tercih etmelidir. Başka bir `api` değerine sahip tam eşleşen
    özel bir `models.providers.modelstudio` girdisi tanımlarsanız, bu özel sağlayıcı Qwen uyumluluk
    takma adı yerine `modelstudio/...` referanslarının sahibi olur.
    </Note>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **En uygun kullanım:** `https://portal.qwen.ai/v1` için bir Qwen Portal belirteci.

    Özel sağlayıcı sayfası ve geçiş notları için [Qwen OAuth / Portal](/tr/providers/qwen-oauth) sayfasına bakın.

    <Steps>
      <Step title="Portal belirtecinizi sağlayın">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="Varsayılan model ayarlayın">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen-oauth/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth`, DashScope sağlayıcısıyla aynı `QWEN_API_KEY` ortam değişkeni adını kullanır,
    ancak OpenClaw ilk kurulumu üzerinden yapılandırıldığında kimlik doğrulamayı `qwen-oauth`
    sağlayıcı kimliği altında saklar.
    </Note>

  </Tab>
</Tabs>

## Plan türleri ve uç noktalar

| Plan                       | Bölge  | Kimlik doğrulama seçimi    | Uç nokta                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (kullandıkça öde) | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (kullandıkça öde) | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (abonelik)     | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (abonelik)     | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |
| Qwen Portal                | Global | `qwen-oauth`               | `portal.qwen.ai/v1`                              |

Sağlayıcı, kimlik doğrulama seçiminize göre uç noktayı otomatik seçer. Kanonik
seçimler `qwen-*` ailesini kullanır; `modelstudio-*` yalnızca uyumluluk için kalır.
Yapılandırmada özel bir `baseUrl` ile bunu geçersiz kılabilirsiniz.

<Tip>
**Anahtarları yönetin:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Belgeler:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Yerleşik katalog

OpenClaw şu anda bu Qwen statik kataloğunu gönderir. Yapılandırılan katalog
uç nokta duyarlıdır: Coding Plan yapılandırmaları yalnızca Standard uç noktada
çalıştığı bilinen modelleri dışarıda bırakır.

| Model referansı             | Girdi       | Bağlam    | Notlar                                             |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | metin, görüntü | 1,000,000 | Varsayılan model                                   |
| `qwen/qwen3.6-plus`         | metin, görüntü | 1,000,000 | Bu modele ihtiyacınız olduğunda Standard uç noktaları tercih edin |
| `qwen/qwen3-max-2026-01-23` | metin       | 262,144   | Qwen Max serisi                                    |
| `qwen/qwen3-coder-next`     | metin       | 262,144   | Kodlama                                            |
| `qwen/qwen3-coder-plus`     | metin       | 1,000,000 | Kodlama                                            |
| `qwen/MiniMax-M2.5`         | metin       | 1,000,000 | Akıl yürütme etkin                                  |
| `qwen/glm-5`                | metin       | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | metin       | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | metin, görüntü | 262,144   | Alibaba üzerinden Moonshot AI                      |
| `qwen-oauth/qwen3.5-plus`   | metin, görüntü | 1,000,000 | Qwen Portal varsayılanı                            |

<Note>
Bir model statik katalogda mevcut olsa bile kullanılabilirlik uç noktaya ve faturalandırma planına göre değişebilir.
</Note>

## Düşünme denetimleri

Akıl yürütme etkin Qwen Cloud modelleri için sağlayıcı, OpenClaw düşünme
düzeylerini DashScope'un üst düzey `enable_thinking` istek bayrağına eşler. Devre dışı
düşünme `enable_thinking: false` gönderir; diğer düşünme düzeyleri
`enable_thinking: true` gönderir.

## Çok modlu eklentiler

`qwen` Plugin'i ayrıca **Standard** DashScope uç noktalarında (Coding Plan uç noktalarında değil)
çok modlu yetenekler sunar:

- `qwen-vl-max-latest` üzerinden **video anlama**
- `wan2.6-t2v` (varsayılan), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v` üzerinden **Wan video üretimi**

Qwen'i varsayılan video sağlayıcısı olarak kullanmak için:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Video Üretimi](/tr/tools/video-generation) sayfasına bakın.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Görüntü ve video anlama">
    Qwen Plugin'i, **Standard** DashScope uç noktalarında (Coding Plan uç noktalarında değil)
    görüntüler ve video için medya anlama kaydı yapar.

    | Özellik      | Değer                 |
    | ------------- | --------------------- |
    | Model         | `qwen-vl-max-latest`  |
    | Desteklenen girdi | Görüntüler, video |

    Medya anlama, yapılandırılmış Qwen kimlik doğrulamasından otomatik olarak çözümlenir; ek
    yapılandırma gerekmez. Medya anlama desteği için Standard (kullandıkça öde)
    uç nokta kullandığınızdan emin olun.

  </Accordion>

  <Accordion title="Qwen 3.6 Plus kullanılabilirliği">
    `qwen3.6-plus`, Standard (kullandıkça öde) Model Studio
    uç noktalarında kullanılabilir:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Coding Plan uç noktaları `qwen3.6-plus` için "desteklenmeyen model" hatası döndürürse,
    Coding Plan uç noktası/anahtar çifti yerine Standard (kullandıkça öde) seçeneğine geçin.

    OpenClaw'ın Qwen statik kataloğu, Coding Plan uç noktalarında `qwen3.6-plus` reklamı yapmaz,
    ancak `models.providers.qwen.models` altında açıkça yapılandırılmış `qwen/qwen3.6-plus`
    girdileri Coding Plan baseUrl'lerinde dikkate alınır; böylece Aliyun aboneliğinizde
    etkinleştirirse bu modeli kullanıma alabilirsiniz. Çağrının başarılı olup olmayacağına
    yine üst API karar verir.

  </Accordion>

  <Accordion title="Yetenek planı">
    `qwen` Plugin'i, yalnızca kodlama/metin modelleri için değil, tam Qwen
    Cloud yüzeyi için sağlayıcı merkezi olarak konumlandırılıyor.

    - **Metin/sohbet modelleri:** Plugin üzerinden kullanılabilir
    - **Araç çağırma, yapılandırılmış çıktı, düşünme:** OpenAI uyumlu aktarımdan devralınır
    - **Görüntü üretimi:** sağlayıcı-Plugin katmanında planlanıyor
    - **Görüntü/video anlama:** Plugin üzerinden Standard uç noktada kullanılabilir
    - **Konuşma/ses:** sağlayıcı-Plugin katmanında planlanıyor
    - **Bellek embedding'leri/yeniden sıralama:** embedding bağdaştırıcısı yüzeyi üzerinden planlanıyor
    - **Video üretimi:** paylaşılan video üretimi yeteneği üzerinden Plugin aracılığıyla kullanılabilir

  </Accordion>

  <Accordion title="Video üretimi ayrıntıları">
    Video üretimi için OpenClaw, işi göndermeden önce yapılandırılmış Qwen bölgesini eşleşen
    DashScope AIGC ana makinesine eşler:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Bu, Coding Plan veya Standard Qwen ana makinelerinden birini işaret eden normal bir
    `models.providers.qwen.baseUrl` değerinin video üretimini yine doğru
    bölgesel DashScope video uç noktasında tuttuğu anlamına gelir.

    Geçerli Qwen video üretimi sınırları:

    - İstek başına en fazla **1** çıktı videosu
    - En fazla **1** girdi görüntüsü
    - En fazla **4** girdi videosu
    - En fazla **10 saniye** süre
    - `size`, `aspectRatio`, `resolution`, `audio` ve `watermark` destekler
    - Referans görüntü/video modu şu anda **uzak http(s) URL'leri** gerektirir. Yerel
      dosya yolları en baştan reddedilir çünkü DashScope video uç noktası bu referanslar için
      yüklenen yerel tamponları kabul etmez.

  </Accordion>

  <Accordion title="Akış kullanımı uyumluluğu">
    Yerel Model Studio uç noktaları, paylaşılan `openai-completions` taşıması üzerinde
    akış kullanımı uyumluluğunu duyurur. OpenClaw artık bunu uç nokta
    yeteneklerine göre belirler; bu nedenle aynı yerel ana bilgisayarları hedefleyen
    DashScope uyumlu özel sağlayıcı kimlikleri, özellikle yerleşik `qwen`
    sağlayıcı kimliğini gerektirmek yerine aynı akış-kullanımı davranışını devralır.

    Yerel akış kullanımı uyumluluğu, hem Coding Plan ana bilgisayarları hem de
    Standart DashScope uyumlu ana bilgisayarlar için geçerlidir:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Çok modlu uç nokta bölgeleri">
    Çok modlu yüzeyler (video anlama ve Wan video üretimi), Coding Plan uç noktalarını değil,
    **Standart** DashScope uç noktalarını kullanır:

    - Global/Intl Standart temel URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - Çin Standart temel URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Ortam ve daemon kurulumu">
    Gateway bir daemon olarak çalışıyorsa (launchd/systemd), `QWEN_API_KEY` değerinin
    bu süreç tarafından kullanılabilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde
    veya `env.shellEnv` aracılığıyla).
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Video üretimi" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/tr/providers/alibaba" icon="cloud">
    Eski ModelStudio sağlayıcısı ve geçiş notları.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve SSS.
  </Card>
</CardGroup>

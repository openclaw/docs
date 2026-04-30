---
read_when:
    - OpenClaw ile Qwen kullanmak istiyorsunuz
    - Daha önce Qwen OAuth kullandınız
summary: OpenClaw'ın birlikte gelen qwen sağlayıcısı aracılığıyla Qwen Cloud'u kullanın
title: Qwen
x-i18n:
    generated_at: "2026-04-30T09:41:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 898a7ef1f071c838f3bd877632dd06cf0e6112adfa2833895280f99642df56e6
    source_path: providers/qwen.md
    workflow: 16
---

<Warning>

**Qwen OAuth kaldırıldı.** `portal.qwen.ai` uç noktalarını kullanan ücretsiz katman OAuth entegrasyonu
(`qwen-portal`) artık kullanılamıyor.
Arka plan için [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) bölümüne bakın.

</Warning>

OpenClaw artık Qwen'i standart kimliği `qwen` olan birinci sınıf paketlenmiş sağlayıcı olarak ele alır. Paketlenmiş sağlayıcı, Qwen Cloud / Alibaba DashScope ve Coding Plan uç noktalarını hedefler ve eski `modelstudio` kimliklerinin uyumluluk takma adı olarak çalışmasını sürdürür.

- Sağlayıcı: `qwen`
- Tercih edilen ortam değişkeni: `QWEN_API_KEY`
- Uyumluluk için ayrıca kabul edilir: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API stili: OpenAI uyumlu

<Tip>
`qwen3.6-plus` istiyorsanız **Standard (pay-as-you-go)** uç noktasını tercih edin.
Coding Plan desteği, herkese açık kataloğun gerisinde kalabilir.
</Tip>

## Başlarken

Plan türünüzü seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="Coding Plan (subscription)">
    **En uygun olduğu durum:** Qwen Coding Plan üzerinden abonelik tabanlı erişim.

    <Steps>
      <Step title="Get your API key">
        [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) üzerinden bir API anahtarı oluşturun veya kopyalayın.
      </Step>
      <Step title="Run onboarding">
        **Global** uç nokta için:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        **China** uç noktası için:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Eski `modelstudio-*` auth-choice kimlikleri ve `modelstudio/...` model başvuruları hâlâ
    uyumluluk takma adları olarak çalışır, ancak yeni kurulum akışları standart
    `qwen-*` auth-choice kimliklerini ve `qwen/...` model başvurularını tercih etmelidir. Başka bir `api` değerine sahip tam eşleşen
    özel bir `models.providers.modelstudio` girdisi tanımlarsanız, bu özel sağlayıcı
    Qwen uyumluluk takma adı yerine `modelstudio/...` başvurularına sahip olur.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **En uygun olduğu durum:** Coding Plan'da kullanılamayabilecek `qwen3.6-plus` gibi modeller dahil olmak üzere Standard Model Studio uç noktası üzerinden kullandıkça öde erişimi.

    <Steps>
      <Step title="Get your API key">
        [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) üzerinden bir API anahtarı oluşturun veya kopyalayın.
      </Step>
      <Step title="Run onboarding">
        **Global** uç nokta için:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        **China** uç noktası için:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Eski `modelstudio-*` auth-choice kimlikleri ve `modelstudio/...` model başvuruları hâlâ
    uyumluluk takma adları olarak çalışır, ancak yeni kurulum akışları standart
    `qwen-*` auth-choice kimliklerini ve `qwen/...` model başvurularını tercih etmelidir. Başka bir `api` değerine sahip tam eşleşen
    özel bir `models.providers.modelstudio` girdisi tanımlarsanız, bu özel sağlayıcı
    Qwen uyumluluk takma adı yerine `modelstudio/...` başvurularına sahip olur.
    </Note>

  </Tab>
</Tabs>

## Plan türleri ve uç noktalar

| Plan                       | Bölge | Kimlik doğrulama seçimi    | Uç nokta                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (subscription) | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (subscription) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Sağlayıcı, auth choice seçiminize göre uç noktayı otomatik olarak seçer. Standart
seçimler `qwen-*` ailesini kullanır; `modelstudio-*` yalnızca uyumluluk için kalır.
Yapılandırmada özel bir `baseUrl` ile geçersiz kılabilirsiniz.

<Tip>
**Anahtarları yönetin:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Belgeler:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Yerleşik katalog

OpenClaw şu anda bu paketlenmiş Qwen kataloğuyla gelir. Yapılandırılan katalog uç nokta
farkındadır: Coding Plan yapılandırmaları, yalnızca Standard uç noktasında çalıştığı bilinen
modelleri hariç tutar.

| Model başvurusu            | Girdi       | Bağlam    | Notlar                                             |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | metin, görüntü | 1,000,000 | Varsayılan model                                   |
| `qwen/qwen3.6-plus`         | metin, görüntü | 1,000,000 | Bu modele ihtiyacınız olduğunda Standard uç noktalarını tercih edin |
| `qwen/qwen3-max-2026-01-23` | metin       | 262,144   | Qwen Max serisi                                    |
| `qwen/qwen3-coder-next`     | metin       | 262,144   | Kodlama                                            |
| `qwen/qwen3-coder-plus`     | metin       | 1,000,000 | Kodlama                                            |
| `qwen/MiniMax-M2.5`         | metin       | 1,000,000 | Akıl yürütme etkin                                  |
| `qwen/glm-5`                | metin       | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | metin       | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | metin, görüntü | 262,144   | Alibaba üzerinden Moonshot AI                      |

<Note>
Bir model paketlenmiş katalogda bulunsa bile kullanılabilirlik uç noktaya ve faturalandırma planına göre değişebilir.
</Note>

## Düşünme Kontrolleri

Akıl yürütme etkin Qwen Cloud modelleri için paketlenmiş sağlayıcı, OpenClaw
düşünme düzeylerini DashScope'un üst düzey `enable_thinking` istek bayrağına eşler. Devre dışı
düşünme `enable_thinking: false` gönderir; diğer düşünme düzeyleri
`enable_thinking: true` gönderir.

## Çok modlu eklentiler

`qwen` Plugin, **Standard** DashScope uç noktalarında da çok modlu yetenekler sunar (Coding Plan uç noktalarında değil):

- `qwen-vl-max-latest` üzerinden **video anlama**
- `wan2.6-t2v` (varsayılan), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v` üzerinden **Wan video oluşturma**

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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve devretme davranışı için [Video Oluşturma](/tr/tools/video-generation) bölümüne bakın.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Image and video understanding">
    Paketlenmiş Qwen Plugin, **Standard** DashScope uç noktalarında görüntüler ve video için
    medya anlamayı kaydeder (Coding Plan uç noktalarında değil).

    | Özellik      | Değer                 |
    | ------------- | --------------------- |
    | Model         | `qwen-vl-max-latest`  |
    | Desteklenen girdi | Görüntüler, video       |

    Medya anlama, yapılandırılmış Qwen kimlik doğrulamasından otomatik olarak çözümlenir; ek
    yapılandırma gerekmez. Medya anlama desteği için Standard (pay-as-you-go)
    uç noktası kullandığınızdan emin olun.

  </Accordion>

  <Accordion title="Qwen 3.6 Plus availability">
    `qwen3.6-plus`, Standard (pay-as-you-go) Model Studio
    uç noktalarında kullanılabilir:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Coding Plan uç noktaları `qwen3.6-plus` için "unsupported model" hatası döndürürse,
    Coding Plan uç noktası/anahtar çifti yerine Standard (pay-as-you-go) kullanın.

    OpenClaw'ın paketlenmiş Qwen kataloğu, Coding Plan uç noktalarında `qwen3.6-plus` ilan etmez,
    ancak `models.providers.qwen.models` altında açıkça yapılandırılmış `qwen/qwen3.6-plus` girdileri
    Coding Plan baseUrl'lerinde dikkate alınır; böylece Aliyun aboneliğinizde bunu etkinleştirirse
    bu modeli dahil etmeyi seçebilirsiniz. Çağrının başarılı olup olmayacağına yine
    yukarı akış API karar verir.

  </Accordion>

  <Accordion title="Capability plan">
    `qwen` Plugin, yalnızca kodlama/metin modelleri için değil, tam Qwen
    Cloud yüzeyi için sağlayıcı evi olarak konumlandırılıyor.

    - **Metin/sohbet modelleri:** şimdi paketlenmiş
    - **Araç çağırma, yapılandırılmış çıktı, düşünme:** OpenAI uyumlu aktarımdan devralınır
    - **Görüntü oluşturma:** sağlayıcı-Plugin katmanında planlanıyor
    - **Görüntü/video anlama:** şimdi Standard uç noktasında paketlenmiş
    - **Konuşma/ses:** sağlayıcı-Plugin katmanında planlanıyor
    - **Bellek gömmeleri/yeniden sıralama:** gömme bağdaştırıcısı yüzeyi üzerinden planlanıyor
    - **Video oluşturma:** paylaşılan video oluşturma yeteneği üzerinden şimdi paketlenmiş

  </Accordion>

  <Accordion title="Video generation details">
    Video oluşturma için OpenClaw, işi göndermeden önce yapılandırılmış Qwen bölgesini eşleşen
    DashScope AIGC ana makinesine eşler:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Bu, Coding Plan veya Standard Qwen ana makinelerinden birini işaret eden normal bir
    `models.providers.qwen.baseUrl` değerinin bile video oluşturmayı doğru
    bölgesel DashScope video uç noktasında tuttuğu anlamına gelir.

    Mevcut paketlenmiş Qwen video oluşturma sınırları:

    - İstek başına en fazla **1** çıktı videosu
    - En fazla **1** girdi görüntüsü
    - En fazla **4** girdi videosu
    - En fazla **10 saniye** süre
    - `size`, `aspectRatio`, `resolution`, `audio` ve `watermark` desteklenir
    - Referans görüntü/video modu şu anda **uzak http(s) URL'leri** gerektirir. DashScope video uç noktası bu referanslar için yüklenmiş yerel arabellekleri kabul etmediğinden yerel
      dosya yolları baştan reddedilir.

  </Accordion>

  <Accordion title="Streaming usage compatibility">
    Yerel Model Studio uç noktaları, paylaşılan `openai-completions` aktarımında akış kullanım uyumluluğunu duyurur. OpenClaw artık bunu uç nokta yeteneklerine göre anahtarlar; bu nedenle aynı yerel ana makineleri hedefleyen DashScope uyumlu özel sağlayıcı kimlikleri, özellikle yerleşik `qwen` sağlayıcı kimliğini gerektirmek yerine aynı akış kullanım davranışını devralır.

    Yerel akış kullanım uyumluluğu hem Coding Plan ana makineleri hem de
    Standard DashScope uyumlu ana makineler için geçerlidir:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Multimodal endpoint regions">
    Çok modlu yüzeyler (video anlama ve Wan video oluşturma), Coding Plan uç noktalarını değil
    **Standard** DashScope uç noktalarını kullanır:

    - Global/Intl Standard temel URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - China Standard temel URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Ortam ve daemon kurulumu">
    Gateway bir daemon olarak çalışıyorsa (launchd/systemd), `QWEN_API_KEY` değerinin
    bu işlem için kullanılabilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya
    `env.shellEnv` aracılığıyla).
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Video oluşturma" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/tr/providers/alibaba" icon="cloud">
    Eski ModelStudio sağlayıcısı ve geçiş notları.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve SSS.
  </Card>
</CardGroup>

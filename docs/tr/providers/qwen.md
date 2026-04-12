---
read_when:
    - Qwen'i OpenClaw ile kullanmak istiyorsunuz
    - Daha önce Qwen OAuth kullandınız
summary: OpenClaw'ın paketlenmiş qwen sağlayıcısı üzerinden Qwen Cloud'u kullanın
title: Qwen
x-i18n:
    generated_at: "2026-04-12T23:32:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5247f851ef891645df6572d748ea15deeea47cd1d75858bc0d044a2930065106
    source_path: providers/qwen.md
    workflow: 15
---

# Qwen

<Warning>

**Qwen OAuth kaldırıldı.** `portal.qwen.ai` uç noktalarını kullanan
ücretsiz katman OAuth entegrasyonu
(`qwen-portal`) artık kullanılamıyor.
Arka plan için [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) bölümüne bakın.

</Warning>

OpenClaw artık Qwen'i, kanonik kimliği
`qwen` olan birinci sınıf paketlenmiş bir sağlayıcı olarak ele alır. Paketlenmiş sağlayıcı, Qwen Cloud / Alibaba DashScope ve
Coding Plan uç noktalarını hedefler ve eski `modelstudio` kimliklerini
uyumluluk takma adı olarak çalışır durumda tutar.

- Sağlayıcı: `qwen`
- Tercih edilen ortam değişkeni: `QWEN_API_KEY`
- Uyumluluk için ayrıca kabul edilir: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API stili: OpenAI uyumlu

<Tip>
`qwen3.6-plus` kullanmak istiyorsanız, **Standard (kullandıkça öde)** uç noktasını tercih edin.
Coding Plan desteği, genel kataloğun gerisinde kalabilir.
</Tip>

## Başlangıç

Plan türünüzü seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="Coding Plan (abonelik)">
    **En iyi kullanım alanı:** Qwen Coding Plan üzerinden abonelik tabanlı erişim.

    <Steps>
      <Step title="API anahtarınızı alın">
        [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) adresinden bir API anahtarı oluşturun veya kopyalayın.
      </Step>
      <Step title="Onboarding çalıştırın">
        **Global** uç nokta için:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        **Çin** uç nokta için:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Varsayılan bir model ayarlayın">
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
      <Step title="Modelin kullanılabildiğini doğrulayın">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Eski `modelstudio-*` auth-choice kimlikleri ve `modelstudio/...` model referansları
    uyumluluk takma adları olarak hâlâ çalışır, ancak yeni kurulum akışları kanonik
    `qwen-*` auth-choice kimliklerini ve `qwen/...` model referanslarını tercih etmelidir.
    </Note>

  </Tab>

  <Tab title="Standard (kullandıkça öde)">
    **En iyi kullanım alanı:** `qwen3.6-plus` gibi Coding Plan üzerinde bulunmayabilecek modeller dahil, Standard Model Studio uç noktası üzerinden kullandıkça öde erişimi.

    <Steps>
      <Step title="API anahtarınızı alın">
        [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) adresinden bir API anahtarı oluşturun veya kopyalayın.
      </Step>
      <Step title="Onboarding çalıştırın">
        **Global** uç nokta için:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        **Çin** uç nokta için:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Varsayılan bir model ayarlayın">
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
      <Step title="Modelin kullanılabildiğini doğrulayın">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Eski `modelstudio-*` auth-choice kimlikleri ve `modelstudio/...` model referansları
    uyumluluk takma adları olarak hâlâ çalışır, ancak yeni kurulum akışları kanonik
    `qwen-*` auth-choice kimliklerini ve `qwen/...` model referanslarını tercih etmelidir.
    </Note>

  </Tab>
</Tabs>

## Plan türleri ve uç noktalar

| Plan                       | Bölge | Auth choice                | Uç nokta                                         |
| -------------------------- | ----- | -------------------------- | ------------------------------------------------ |
| Standard (kullandıkça öde) | Çin   | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (kullandıkça öde) | Global | `qwen-standard-api-key`   | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (abonelik)     | Çin   | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (abonelik)     | Global | `qwen-api-key`            | `coding-intl.dashscope.aliyuncs.com/v1`          |

Sağlayıcı, auth choice'a göre uç noktayı otomatik seçer. Kanonik
seçimler `qwen-*` ailesini kullanır; `modelstudio-*` yalnızca uyumluluk içindir.
Yapılandırmada özel bir `baseUrl` ile geçersiz kılabilirsiniz.

<Tip>
**Anahtarları yönetin:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Belgeler:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Yerleşik katalog

OpenClaw şu anda bu paketlenmiş Qwen kataloğuyla gelir. Yapılandırılan katalog
uç nokta farkındalığına sahiptir: Coding Plan yapılandırmaları, yalnızca
Standard uç noktada çalıştığı bilinen modelleri dışarıda bırakır.

| Model ref                   | Girdi       | Bağlam    | Notlar                                             |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | metin, görüntü | 1,000,000 | Varsayılan model                                   |
| `qwen/qwen3.6-plus`         | metin, görüntü | 1,000,000 | Bu modele ihtiyaç duyduğunuzda Standard uç noktaları tercih edin |
| `qwen/qwen3-max-2026-01-23` | metin       | 262,144   | Qwen Max serisi                                    |
| `qwen/qwen3-coder-next`     | metin       | 262,144   | Kodlama                                            |
| `qwen/qwen3-coder-plus`     | metin       | 1,000,000 | Kodlama                                            |
| `qwen/MiniMax-M2.5`         | metin       | 1,000,000 | Akıl yürütme etkin                                 |
| `qwen/glm-5`                | metin       | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | metin       | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | metin, görüntü | 262,144 | Alibaba üzerinden Moonshot AI                      |

<Note>
Bir model paketlenmiş katalogda bulunsa bile kullanılabilirlik, uç noktaya ve faturalandırma planına göre yine de değişebilir.
</Note>

## Çok modlu eklentiler

`qwen` uzantısı ayrıca **Standard**
DashScope uç noktalarında (Coding Plan uç noktalarında değil) çok modlu yetenekler de sunar:

- `qwen-vl-max-latest` üzerinden **video anlama**
- `wan2.6-t2v` (varsayılan), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v` üzerinden **Wan video üretimi**

Varsayılan video sağlayıcısı olarak Qwen kullanmak için:

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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Video Generation](/tr/tools/video-generation) bölümüne bakın.
</Note>

## Gelişmiş

<AccordionGroup>
  <Accordion title="Görüntü ve video anlama">
    Paketlenmiş Qwen Plugin'i, görüntüler ve video için medya anlamayı
    **Standard** DashScope uç noktalarında kaydeder (Coding Plan uç noktalarında değil).

    | Özellik      | Değer                |
    | ------------- | -------------------- |
    | Model         | `qwen-vl-max-latest` |
    | Desteklenen girdi | Görüntüler, video |

    Medya anlama, yapılandırılmış Qwen kimlik doğrulamasından otomatik olarak çözülür — ek
    yapılandırma gerekmez. Medya anlama desteği için bir Standard (kullandıkça öde)
    uç noktası kullandığınızdan emin olun.

  </Accordion>

  <Accordion title="Qwen 3.6 Plus kullanılabilirliği">
    `qwen3.6-plus`, Standard (kullandıkça öde) Model Studio
    uç noktalarında kullanılabilir:

    - Çin: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Coding Plan uç noktaları
    `qwen3.6-plus` için "unsupported model" hatası döndürüyorsa, Coding Plan
    uç noktası/anahtar ikilisi yerine Standard (kullandıkça öde) kullanın.

  </Accordion>

  <Accordion title="Yetenek planı">
    `qwen` uzantısı, yalnızca kodlama/metin modelleri için değil,
    tam Qwen Cloud yüzeyinin satıcı ana evi olarak konumlandırılıyor.

    - **Metin/sohbet modelleri:** şimdi paketlenmiş durumda
    - **Araç çağırma, yapılandırılmış çıktı, thinking:** OpenAI uyumlu taşıma üzerinden devralınır
    - **Görüntü üretimi:** sağlayıcı Plugin katmanında planlanıyor
    - **Görüntü/video anlama:** şimdi Standard uç noktada paketlenmiş durumda
    - **Konuşma/ses:** sağlayıcı Plugin katmanında planlanıyor
    - **Bellek embedding/reranking:** embedding bağdaştırıcı yüzeyi üzerinden planlanıyor
    - **Video üretimi:** paylaşılan video üretimi yeteneği üzerinden şimdi paketlenmiş durumda

  </Accordion>

  <Accordion title="Video üretim ayrıntıları">
    Video üretimi için OpenClaw, işi göndermeden önce yapılandırılmış Qwen bölgesini eşleşen
    DashScope AIGC ana makinesine eşler:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - Çin: `https://dashscope.aliyuncs.com`

    Bu, Coding Plan ya da Standard Qwen ana makinelerinden birini işaret eden normal bir
    `models.providers.qwen.baseUrl` değerinin bile video üretimini doğru
    bölgesel DashScope video uç noktasında tuttuğu anlamına gelir.

    Mevcut paketlenmiş Qwen video üretimi sınırları:

    - İstek başına en fazla **1** çıktı videosu
    - En fazla **1** giriş görüntüsü
    - En fazla **4** giriş videosu
    - En fazla **10 saniye** süre
    - `size`, `aspectRatio`, `resolution`, `audio` ve `watermark` destekler
    - Referans görüntü/video modu şu anda **uzak http(s) URL'leri** gerektirir. Yerel
      dosya yolları en baştan reddedilir çünkü DashScope video uç noktası bu referanslar için
      yüklenmiş yerel tamponları kabul etmez.

  </Accordion>

  <Accordion title="Akış kullanım uyumluluğu">
    Yerel Model Studio uç noktaları, paylaşılan
    `openai-completions` taşımasında akış kullanım uyumluluğu sunduğunu bildirir. OpenClaw bunu artık uç nokta
    yeteneklerine göre belirler; böylece aynı yerel ana makineleri hedefleyen DashScope uyumlu özel sağlayıcı kimlikleri,
    özellikle yerleşik `qwen` sağlayıcı kimliğini gerektirmek yerine aynı akış kullanımı davranışını devralır.

    Yerel akış kullanımı uyumluluğu hem Coding Plan ana makinelerine hem de
    Standard DashScope uyumlu ana makinelere uygulanır:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Çok modlu uç nokta bölgeleri">
    Çok modlu yüzeyler (video anlama ve Wan video üretimi), Coding Plan uç noktalarını değil,
    **Standard** DashScope uç noktalarını kullanır:

    - Global/Intl Standard temel URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - Çin Standard temel URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Ortam ve daemon kurulumu">
    Gateway bir daemon olarak çalışıyorsa (launchd/systemd), `QWEN_API_KEY` değerinin
    bu süreç tarafından erişilebilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya
    `env.shellEnv` aracılığıyla).
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

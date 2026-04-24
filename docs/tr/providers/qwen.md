---
read_when:
    - OpenClaw ile Qwen kullanmak istiyorsunuz
    - Daha önce Qwen OAuth kullandınız
summary: OpenClaw'ın paketlenmiş qwen sağlayıcısı aracılığıyla Qwen Cloud kullanın
title: Qwen
x-i18n:
    generated_at: "2026-04-24T09:27:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3601722ed12e7e0441ec01e6a9e6b205a39a7ecfb599e16dad3bbfbdbf34ee83
    source_path: providers/qwen.md
    workflow: 15
---

<Warning>

**Qwen OAuth kaldırıldı.** `portal.qwen.ai` uç noktalarını kullanan
ücretsiz katman OAuth entegrasyonu (`qwen-portal`) artık mevcut değil.
Arka plan için bkz. [Issue #49557](https://github.com/openclaw/openclaw/issues/49557).

</Warning>

OpenClaw artık Qwen'i, kanonik kimliği
`qwen` olan birinci sınıf paketlenmiş sağlayıcı olarak ele alır. Paketlenmiş sağlayıcı Qwen Cloud / Alibaba DashScope ve
Coding Plan uç noktalarını hedefler ve eski `modelstudio` kimliklerini
uyumluluk takma adı olarak çalışır durumda tutar.

- Sağlayıcı: `qwen`
- Tercih edilen env değişkeni: `QWEN_API_KEY`
- Uyumluluk için kabul edilenler: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API stili: OpenAI uyumlu

<Tip>
`qwen3.6-plus` istiyorsanız **Standard (kullandıkça öde)** uç noktasını tercih edin.
Coding Plan desteği genel katalogun gerisinde kalabilir.
</Tip>

## Başlarken

Plan türünüzü seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="Coding Plan (abonelik)">
    **Şunun için en iyisi:** Qwen Coding Plan üzerinden abonelik tabanlı erişim.

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
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Eski `modelstudio-*` auth-choice kimlikleri ve `modelstudio/...` model ref'leri
    uyumluluk takma adları olarak hâlâ çalışır, ancak yeni kurulum akışları kanonik
    `qwen-*` auth-choice kimliklerini ve `qwen/...` model ref'lerini tercih etmelidir.
    </Note>

  </Tab>

  <Tab title="Standard (kullandıkça öde)">
    **Şunun için en iyisi:** Coding Plan üzerinde bulunmayabilecek `qwen3.6-plus` gibi modeller dahil, Standard Model Studio uç noktası üzerinden kullandıkça öde erişimi.

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
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Eski `modelstudio-*` auth-choice kimlikleri ve `modelstudio/...` model ref'leri
    uyumluluk takma adları olarak hâlâ çalışır, ancak yeni kurulum akışları kanonik
    `qwen-*` auth-choice kimliklerini ve `qwen/...` model ref'lerini tercih etmelidir.
    </Note>

  </Tab>
</Tabs>

## Plan türleri ve uç noktalar

| Plan                       | Bölge  | Auth choice                | Uç nokta                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (kullandıkça öde) | Çin    | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (kullandıkça öde) | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (abonelik)     | Çin    | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (abonelik)     | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Sağlayıcı, auth choice değerine göre uç noktayı otomatik seçer. Kanonik
seçimler `qwen-*` ailesini kullanır; `modelstudio-*` yalnızca uyumluluk içindir.
Config içinde özel `baseUrl` ile geçersiz kılabilirsiniz.

<Tip>
**Anahtarları yönetin:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Belgeler:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Yerleşik katalog

OpenClaw şu anda bu paketlenmiş Qwen kataloğunu gönderir. Yapılandırılmış katalog
uç nokta farkındalıklıdır: Coding Plan config'leri yalnızca
Standard uç noktada çalıştığı bilinen modelleri dışarıda bırakır.

| Model ref                   | Girdi       | Bağlam    | Notlar                                             |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | metin, görsel | 1,000,000 | Varsayılan model                                   |
| `qwen/qwen3.6-plus`         | metin, görsel | 1,000,000 | Bu modele ihtiyacınız varsa Standard uç noktaları tercih edin |
| `qwen/qwen3-max-2026-01-23` | metin       | 262,144   | Qwen Max hattı                                     |
| `qwen/qwen3-coder-next`     | metin       | 262,144   | Kodlama                                            |
| `qwen/qwen3-coder-plus`     | metin       | 1,000,000 | Kodlama                                            |
| `qwen/MiniMax-M2.5`         | metin       | 1,000,000 | Reasoning etkin                                    |
| `qwen/glm-5`                | metin       | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | metin       | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | metin, görsel | 262,144 | Moonshot AI, Alibaba üzerinden                     |

<Note>
Bir model paketlenmiş katalogda mevcut olsa bile kullanılabilirlik, uç noktaya ve faturalandırma planına göre yine değişebilir.
</Note>

## Çok modlu eklentiler

`qwen` Plugin'i ayrıca **Standard**
DashScope uç noktalarında (Coding Plan uç noktalarında değil) çok modlu yetenekler sunar:

- `qwen-vl-max-latest` üzerinden **Video understanding**
- `wan2.6-t2v` (varsayılan), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v` üzerinden **Wan video generation**

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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için bkz. [Video Generation](/tr/tools/video-generation).
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Görsel ve video anlama">
    Paketlenmiş Qwen Plugin'i, **Standard** DashScope uç noktalarında (Coding Plan uç noktalarında değil)
    görseller ve video için medya anlayışı kaydeder.

    | Özellik       | Değer                |
    | ------------- | -------------------- |
    | Model         | `qwen-vl-max-latest` |
    | Desteklenen girdi | Görseller, video |

    Medya anlayışı, yapılandırılmış Qwen auth'tan otomatik çözülür — ek
    config gerekmez. Medya anlayışı desteği için
    Standard (kullandıkça öde) uç nokta kullandığınızdan emin olun.

  </Accordion>

  <Accordion title="Qwen 3.6 Plus kullanılabilirliği">
    `qwen3.6-plus`, Standard (kullandıkça öde) Model Studio
    uç noktalarında kullanılabilir:

    - Çin: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Coding Plan uç noktaları
    `qwen3.6-plus` için "unsupported model" hatası döndürüyorsa, Coding Plan
    uç nokta/anahtar çifti yerine Standard (kullandıkça öde) kullanın.

  </Accordion>

  <Accordion title="Yetenek planı">
    `qwen` Plugin'i, yalnızca kodlama/metin modellerinin değil, tam Qwen
    Cloud yüzeyinin üretici ana evi olarak konumlandırılmaktadır.

    - **Metin/sohbet modelleri:** şu anda paketlenmiş
    - **Araç çağırma, yapılandırılmış çıktı, thinking:** OpenAI uyumlu taşıma üzerinden devralınır
    - **Görsel üretimi:** sağlayıcı-Plugin katmanında planlanıyor
    - **Görsel/video anlayışı:** şu anda Standard uç noktada paketlenmiş
    - **Konuşma/ses:** sağlayıcı-Plugin katmanında planlanıyor
    - **Bellek gömmeleri/reranking:** gömme adaptörü yüzeyi üzerinden planlanıyor
    - **Video üretimi:** paylaşılan video-generation yeteneği üzerinden şu anda paketlenmiş

  </Accordion>

  <Accordion title="Video üretimi ayrıntıları">
    Video üretimi için OpenClaw, işi göndermeden önce yapılandırılmış Qwen bölgesini
    eşleşen DashScope AIGC sunucusuna eşler:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - Çin: `https://dashscope.aliyuncs.com`

    Bu, Coding Plan veya Standard Qwen sunucularından birini işaret eden normal bir `models.providers.qwen.baseUrl` değerinin
    video üretimini yine doğru
    bölgesel DashScope video uç noktasında tuttuğu anlamına gelir.

    Mevcut paketlenmiş Qwen video üretimi sınırları:

    - İstek başına en fazla **1** çıktı videosu
    - En fazla **1** giriş görseli
    - En fazla **4** giriş videosu
    - En fazla **10 saniye** süre
    - `size`, `aspectRatio`, `resolution`, `audio` ve `watermark` destekler
    - Referans görsel/video modu şu anda **uzak http(s) URL'leri** gerektirir. Yerel
      dosya yolları baştan reddedilir çünkü DashScope video uç noktası bu referanslar için
      yüklenmiş yerel tamponları kabul etmez.

  </Accordion>

  <Accordion title="Akışlı kullanım uyumluluğu">
    Yerel Model Studio uç noktaları, paylaşılan
    `openai-completions` taşıması üzerinde akışlı kullanım uyumluluğu bildirir. OpenClaw artık bunu uç nokta
    yeteneklerine göre anahtarlıyor; böylece aynı yerel sunucuları hedefleyen DashScope uyumlu özel sağlayıcı kimlikleri,
    özellikle yerleşik `qwen` sağlayıcı kimliğini gerektirmek yerine
    aynı akışlı kullanım davranışını devralır.

    Yerel akışlı kullanım uyumluluğu hem Coding Plan sunucularına hem de
    Standard DashScope uyumlu sunuculara uygulanır:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Çok modlu uç nokta bölgeleri">
    Çok modlu yüzeyler (video understanding ve Wan video generation)
    **Standard** DashScope uç noktalarını kullanır, Coding Plan uç noktalarını değil:

    - Global/Intl Standard base URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - Çin Standard base URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Ortam ve daemon kurulumu">
    Gateway bir daemon (launchd/systemd) olarak çalışıyorsa, `QWEN_API_KEY`
    değişkeninin o süreç için kullanılabilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya
    `env.shellEnv` ile).
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve failover davranışını seçme.
  </Card>
  <Card title="Video generation" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/tr/providers/alibaba" icon="cloud">
    Eski ModelStudio sağlayıcısı ve taşıma notları.
  </Card>
  <Card title="Troubleshooting" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve SSS.
  </Card>
</CardGroup>

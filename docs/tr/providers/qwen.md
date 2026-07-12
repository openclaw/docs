---
read_when:
    - Qwen'i OpenClaw ile kullanmak istiyorsunuz
    - Alibaba Cloud Token Plan aboneliğiniz var
    - Daha önce Qwen OAuth kullandınız
summary: Qwen Cloud'u OpenClaw Plugin'i aracılığıyla kullanın
title: Qwen
x-i18n:
    generated_at: "2026-07-12T12:41:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 18030a70c024cd5c0713262874f5353bac50576e850f68a61bef4fa73ccf9b9c
    source_path: providers/qwen.md
    workflow: 16
---

Qwen Cloud, kurallı kimliği `qwen` olan resmî bir harici OpenClaw sağlayıcı Plugin'idir. Qwen Cloud / Alibaba DashScope Standard ve Coding Plan uç noktalarını hedefler, Token Plan'ı `qwen-token-plan` olarak sunar, `modelstudio`yu uyumluluk takma adı olarak korur, Alibaba'nın belgelenmiş `bailian-token-plan` özel sağlayıcı kimliğinin sahipliğini bağımsız olarak üstlenir ve Qwen Portal belirteç akışını [`qwen-oauth`](/tr/providers/qwen-oauth) olarak sunar.

| Özellik                         | Değer                                      |
| ------------------------------- | ------------------------------------------ |
| Sağlayıcı                       | `qwen`                                     |
| Token Plan sağlayıcısı          | `qwen-token-plan`                          |
| Portal sağlayıcısı              | [`qwen-oauth`](/tr/providers/qwen-oauth)      |
| Tercih edilen ortam değişkeni   | `QWEN_API_KEY`                             |
| Token Plan ortam değişkeni      | `QWEN_TOKEN_PLAN_API_KEY`                  |
| Ayrıca kabul edilen (uyumluluk) | `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY` |
| API biçimi                      | OpenAI uyumlu                              |

<Tip>
`qwen3.7-plus` ve `qwen3.6-plus`, Coding Plan ve Standard uç noktalarıyla çalışır.
`qwen3.7-max` veya `qwen3.6-flash` için bir **Standard (kullandıkça öde)** uç noktası kullanın.
</Tip>

## Plugin'i yükleme

`qwen`, çekirdekle birlikte paketlenmeyen resmî bir harici Plugin olarak sunulur. Plugin'i yükleyin ve Gateway'i yeniden başlatın:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## Başlarken

Plan türünüzü seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="Coding Plan (abonelik)">
    **En uygun olduğu durum:** Qwen Coding Plan üzerinden abonelik tabanlı erişim.

    <Steps>
      <Step title="API anahtarınızı alın">
        [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) adresinden bir API anahtarı oluşturun veya kopyalayın.
      </Step>
      <Step title="İlk kurulumu çalıştırın">
        **Global** uç nokta için:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        **Çin** uç noktası için:

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
    Eski `modelstudio-*` kimlik doğrulama seçeneği kimlikleri ve `modelstudio/...` model başvuruları
    uyumluluk takma adları olarak çalışmaya devam eder, ancak yeni kurulum akışlarında kurallı
    `qwen-*` kimlik doğrulama seçeneği kimlikleri ve `qwen/...` model başvuruları tercih edilmelidir. Başka bir `api`
    değerine sahip, tam eşleşen özel bir `models.providers.modelstudio` girdisi tanımlarsanız
    `modelstudio/...` başvurularının sahipliğini Qwen uyumluluk
    takma adı yerine bu özel sağlayıcı üstlenir.
    </Note>

  </Tab>

  <Tab title="Standard (kullandıkça öde)">
    **En uygun olduğu durum:** Coding Plan'da bulunmayan `qwen3.7-max` ve `qwen3.6-flash` dâhil olmak üzere Standard Model Studio uç noktası üzerinden kullandıkça öde erişimi.

    <Steps>
      <Step title="API anahtarınızı alın">
        [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) adresinden bir API anahtarı oluşturun veya kopyalayın.
      </Step>
      <Step title="İlk kurulumu çalıştırın">
        **Global** uç nokta için:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        **Çin** uç noktası için:

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
    Eski `modelstudio-*` kimlik doğrulama seçeneği kimlikleri ve `modelstudio/...` model başvuruları
    uyumluluk takma adları olarak çalışmaya devam eder, ancak yeni kurulum akışlarında kurallı
    `qwen-*` kimlik doğrulama seçeneği kimlikleri ve `qwen/...` model başvuruları tercih edilmelidir. Başka bir `api`
    değerine sahip, tam eşleşen özel bir `models.providers.modelstudio` girdisi tanımlarsanız
    `modelstudio/...` başvurularının sahipliğini Qwen uyumluluk
    takma adı yerine bu özel sağlayıcı üstlenir.
    </Note>

  </Tab>

  <Tab title="Token Plan (Ekip Sürümü)">
    **En uygun olduğu durum:** Alibaba Cloud Model Studio üzerinden Qwen'e ve desteklenen üçüncü taraf modellere kredi tabanlı ekip aboneliği erişimi.

    <Steps>
      <Step title="Size özel anahtarı alın">
        Bir Token Plan lisansı atayın ve buna özel `sk-sp-...` anahtarını oluşturun. Token Plan, Coding Plan ve kullandıkça öde anahtarları birbirinin yerine kullanılamaz. [Global Token Plan genel bakışına](https://www.alibabacloud.com/help/en/model-studio/token-plan-overview) veya [Çin Token Plan genel bakışına](https://help.aliyun.com/zh/model-studio/token-plan-overview) bakın.
      </Step>
      <Step title="İlk kurulumu çalıştırın">
        Singapur'daki **Global / Uluslararası** uç nokta için:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan
        ```

        Pekin'deki **Çin** uç noktası için:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan-cn
        ```
      </Step>
      <Step title="Sağlayıcıyı doğrulayın">
        ```bash
        openclaw models list --provider qwen-token-plan
        openclaw agent --model qwen-token-plan/qwen3.7-plus --message "Şununla yanıt ver: token plan hazır"
        ```
      </Step>
    </Steps>

    <Note>
    Alibaba'nın OpenClaw kılavuzu, elle yapılandırılan özel bir
    sağlayıcı için `bailian-token-plan` kullanır. Plugin bu kimliği uyumluluk sahibi olarak kaydeder, ancak yeni
    yapılandırmalarda `qwen-token-plan` kullanılmalıdır. Tam eşleşen özel bir
    `models.providers.bailian-token-plan` girdisi, yapılandırılmış
    aktarımının ve kataloğunun sahipliğini korur; hiçbir zaman kurallı OpenAI kataloğuyla birleştirilmez.
    </Note>

    <Warning>
    Token Plan'ı yalnızca etkileşimli OpenClaw oturumlarında kullanın. Cron
    işleri, gözetimsiz betikler veya uygulama arka uçları için seçmeyin. Alibaba,
    etkileşimsiz kullanımın aboneliği askıya alabileceğini veya API anahtarını iptal edebileceğini belirtir.
    </Warning>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **En uygun olduğu durum:** `https://portal.qwen.ai/v1` uç noktasına yönelik bir Qwen Portal belirteci.

    Özel sağlayıcı sayfası ve geçiş notları için
    [Qwen OAuth / Portal](/tr/providers/qwen-oauth) sayfasına bakın.

    <Steps>
      <Step title="Portal belirtecinizi sağlayın">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="Varsayılan bir model ayarlayın">
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
    `qwen-oauth`, Qwen Cloud sağlayıcısıyla aynı `QWEN_API_KEY` ortam değişkeni
    adını kullanır, ancak OpenClaw ilk kurulumu üzerinden yapılandırıldığında kimlik doğrulama bilgilerini
    `qwen-oauth` sağlayıcı kimliği altında saklar.
    </Note>

  </Tab>
</Tabs>

## Plan türleri ve uç noktalar

| Plan                       | Bölge  | Kimlik doğrulama seçeneği  | Uç nokta                                                         |
| -------------------------- | ------ | -------------------------- | ---------------------------------------------------------------- |
| Coding Plan (abonelik)     | Çin    | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`                               |
| Coding Plan (abonelik)     | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`                          |
| Qwen Portal                | Global | `qwen-oauth`               | `portal.qwen.ai/v1`                                              |
| Standard (kullandıkça öde) | Çin    | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`                      |
| Standard (kullandıkça öde) | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1`                 |
| Token Plan (Ekip Sürümü)   | Çin    | `qwen-token-plan-cn`       | `token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`     |
| Token Plan (Ekip Sürümü)   | Global | `qwen-token-plan`          | `token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1` |

Sağlayıcı, kimlik doğrulama seçiminize göre uç noktayı otomatik olarak seçer. Kurallı
seçimler `qwen-*` ailesini kullanır; `modelstudio-*` yalnızca uyumluluk amacıyla korunur.
Yapılandırmada özel bir `baseUrl` ile geçersiz kılabilirsiniz.

<Tip>
**Anahtarları yönetin:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Belgeler:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Yerleşik katalog

OpenClaw bu statik Qwen kataloğuyla birlikte sunulur. Katalog uç noktanın farkındadır: Coding
Plan yapılandırmaları, yalnızca Standard uç noktasında çalışan modelleri içermez.

| Model başvurusu             | Girdi       | Bağlam    | Notlar                          |
| --------------------------- | ----------- | --------- | ------------------------------ |
| `qwen/qwen3.5-plus`         | metin, görsel | 1,000,000 | Varsayılan model               |
| `qwen/qwen3.6-flash`        | metin, görsel | 1,000,000 | Yalnızca Standard uç noktaları |
| `qwen/qwen3.6-plus`         | metin, görsel | 1,000,000 | Coding Plan + Standard         |
| `qwen/qwen3.7-max`          | metin       | 1,000,000 | Yalnızca Standard uç noktaları |
| `qwen/qwen3.7-plus`         | metin, görsel | 1,000,000 | Coding Plan + Standard         |
| `qwen/qwen3-max-2026-01-23` | metin       | 262,144   | Qwen Max serisi                |
| `qwen/qwen3-coder-next`     | metin       | 262,144   | Kodlama                        |
| `qwen/qwen3-coder-plus`     | metin       | 1,000,000 | Kodlama                        |
| `qwen/MiniMax-M2.5`         | metin       | 1,000,000 | Akıl yürütme etkin             |
| `qwen/glm-5`                | metin       | 202,752   | GLM                            |
| `qwen/glm-4.7`              | metin       | 202,752   | GLM                            |
| `qwen/kimi-k2.5`            | metin, görsel | 262,144   | Alibaba üzerinden Moonshot AI  |
| `qwen-oauth/qwen3.5-plus`   | metin, görsel | 1,000,000 | Qwen Portal varsayılanı        |

<Note>
Bir model statik katalogda bulunsa bile kullanılabilirlik uç noktaya ve faturalandırma
planına göre değişebilir.
</Note>

### Token Plan kataloğu

Token Plan, tam dize eşleşmesine dayalı ayrı bir izin listesi kullanır. Yalnızca görsel oluşturmaya yönelik plan
modelleri farklı API'ler kullandıkları için burada yer almaz.

| Model başvurusu                     | Girdi         | Bağlam    |
| ----------------------------------- | ------------- | --------- |
| `qwen-token-plan/qwen3.7-max`       | metin         | 1,000,000 |
| `qwen-token-plan/qwen3.7-plus`      | metin, görsel | 1,000,000 |
| `qwen-token-plan/qwen3.6-plus`      | metin, görsel | 1,000,000 |
| `qwen-token-plan/qwen3.6-flash`     | metin, görsel | 1,000,000 |
| `qwen-token-plan/deepseek-v4-pro`   | metin         | 1,000,000 |
| `qwen-token-plan/deepseek-v4-flash` | metin         | 1,000,000 |
| `qwen-token-plan/deepseek-v3.2`     | metin         | 131,072   |
| `qwen-token-plan/kimi-k2.7-code`    | metin, görsel | 262,144   |
| `qwen-token-plan/kimi-k2.6`         | metin, görsel | 262,144   |
| `qwen-token-plan/kimi-k2.5`         | metin, görsel | 262,144   |
| `qwen-token-plan/glm-5.2`           | metin         | 1,000,000 |
| `qwen-token-plan/glm-5.1`           | metin         | 202,752   |
| `qwen-token-plan/glm-5`             | metin         | 202,752   |
| `qwen-token-plan/MiniMax-M2.5`      | metin         | 196,608   |

## Düşünme denetimleri

`qwen3.7-max`, `qwen3.7-plus`, `qwen3.6-flash` ve `qwen3.6-plus`, yerleşik katalogda
akıl yürütme özelliği etkin olarak bulunur. `qwen` ailesindeki akıl yürütme modelleri
için sağlayıcı, OpenClaw düşünme düzeylerini DashScope'un üst düzey
`enable_thinking` istek bayrağıyla eşler: düşünme devre dışıysa `enable_thinking: false`,
diğer tüm düzeylerde `enable_thinking: true` gönderilir. Özel modeller, model
girdisinde `compat.thinkingFormat: "qwen-chat-template"` ayarlayarak alternatif
bir sohbet şablonu düşünme yükünü etkinleştirebilir.

Token Plan modelleri de akıl yürütme yeteneğine sahip olarak işaretlenir.
`kimi-k2.7-code` ve `MiniMax-M2.5` yalnızca düşünme modunda çalıştığından, oturum
`/think off` istese bile OpenClaw düşünmeyi etkin tutar. DeepSeek V4, `minimal`
ile `high` arasındaki düzeyleri hizmetin `high` çaba düzeyiyle; `xhigh` veya
`max` düzeyini ise `max` ile eşler. GLM 5.2, `minimal` ile `max` arasındaki
tüm aralığı kabul eder; GLM 5.1 ve GLM 5, `xhigh` düzeyine kadar kabul eder
ve üçü de varsayılan olarak `high` kullanır. Diğer hibrit modeller, istenen
açık/kapalı durumunu izler.

## Çok modlu eklentiler

`qwen` Plugin'i, çok modlu yetenekleri yalnızca **Standard** DashScope
uç noktalarında sunar; Coding Plan uç noktalarında sunmaz:

- `qwen-vl-max-latest` aracılığıyla **görüntü ve video anlama**
- `wan2.6-t2v` (varsayılan), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v` aracılığıyla **Wan video üretimi**

Medya anlama, yapılandırılmış Qwen kimlik doğrulamasından otomatik olarak
çözümlenir; ek yapılandırma gerekmez. Medya anlamanın çalışması için Standard
(kullandıkça öde) uç noktasını kullandığınızdan emin olun.

Qwen'i varsayılan video sağlayıcısı yapmak için:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

Video üretimi sınırları: istek başına 1 çıktı videosu, en fazla 1 giriş görüntüsü
(görüntüden videoya), en fazla 4 giriş videosu (videodan videoya) ve en fazla
10 saniye süre. `size`, `aspectRatio`, `resolution`, `audio` ve `watermark`
desteklenir. Referans görüntü/video girdileri uzak http(s) URL'leri gerektirir;
DashScope video uç noktası bu referanslar için yüklenen yerel tamponları kabul
etmediğinden yerel dosya yolları en başta reddedilir.

<Note>
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Video üretimi](/tr/tools/video-generation) sayfasına bakın.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Qwen 3.6 and 3.7 availability">
    `qwen3.7-plus` ve `qwen3.6-plus`, Coding Plan ve Standard uç noktalarında kullanılabilir. `qwen3.7-max` ve `qwen3.6-flash` yalnızca Standard uç noktalarında kullanılabilir. Standard (kullandıkça öde) uç noktaları şunlardır:

    - Çin: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Küresel: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    OpenClaw, `qwen3.7-max` ve `qwen3.6-flash` modellerini Coding Plan kataloglarına dahil etmez.
    Bir Coding Plan uç noktası bunlardan biri için "desteklenmeyen model" hatası
    döndürürse eşleşen Standard uç noktasına ve anahtara geçin.

  </Accordion>

  <Accordion title="Video generation region routing">
    OpenClaw, video işini göndermeden önce yapılandırılmış Qwen bölgesini
    eşleşen DashScope AIGC ana makinesiyle eşler:

    - Küresel/Uluslararası: `https://dashscope-intl.aliyuncs.com`
    - Çin: `https://dashscope.aliyuncs.com`

    Coding Plan veya Standard Qwen ana makinelerinden birini gösteren normal bir
    `models.providers.qwen.baseUrl`, video üretimini yine eşleşen bölgesel
    DashScope video uç noktasına yönlendirir.

  </Accordion>

  <Accordion title="Streaming usage compatibility">
    Yerel Qwen uç noktaları, paylaşılan `openai-completions` aktarımında akışlı
    kullanım uyumluluğu bildirdiğinden, aynı yerel ana makineleri hedefleyen
    DashScope uyumlu özel sağlayıcı kimlikleri, özellikle yerleşik `qwen`
    sağlayıcı kimliğini gerektirmeden aynı davranışı devralır. Bu, Coding Plan,
    Standard ve Token Plan uç noktaları için geçerlidir:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Capability plan">
    `qwen` Plugin'i, yalnızca kodlama/metin modellerinin değil, Qwen Cloud'un
    tüm kapsamının sağlayıcı merkezi olarak konumlandırılmaktadır.

    - **Metin/sohbet modelleri:** Plugin aracılığıyla kullanılabilir
    - **Araç çağırma, yapılandırılmış çıktı, düşünme:** OpenAI uyumlu aktarımdan devralınır
    - **Görüntü üretimi:** sağlayıcı-Plugin katmanında planlanmaktadır
    - **Görüntü/video anlama:** Standard uç noktasında Plugin aracılığıyla kullanılabilir
    - **Konuşma/ses:** sağlayıcı-Plugin katmanında planlanmaktadır
    - **Bellek gömmeleri/yeniden sıralama:** gömme bağdaştırıcısı yüzeyi üzerinden planlanmaktadır
    - **Video üretimi:** paylaşılan video üretimi yeteneği üzerinden Plugin aracılığıyla kullanılabilir

  </Accordion>

  <Accordion title="Environment and daemon setup">
    Gateway bir artalan hizmeti (launchd/systemd) olarak çalışıyorsa
    `QWEN_API_KEY` veya `QWEN_TOKEN_PLAN_API_KEY` değişkeninin bu süreç
    tarafından erişilebilir olduğundan emin olun (örneğin `~/.openclaw/.env`
    içinde veya `env.shellEnv` aracılığıyla).
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Video generation" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Alibaba Model Studio" href="/tr/providers/alibaba" icon="cloud">
    Aynı DashScope platformundaki paketlenmiş Wan video üretimi sağlayıcısı.
  </Card>
  <Card title="Troubleshooting" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve sık sorulan sorular.
  </Card>
</CardGroup>

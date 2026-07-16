---
read_when:
    - OpenClaw'da OpenAI modellerini kullanmak istiyorsunuz
    - API anahtarları yerine Codex abonelik kimlik doğrulamasını kullanmak istiyorsunuz
    - Daha katı GPT-5 ajan yürütme davranışına ihtiyacınız var
summary: OpenClaw'da OpenAI'ı API anahtarları veya Codex aboneliği aracılığıyla kullanma
title: OpenAI
x-i18n:
    generated_at: "2026-07-16T17:37:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 18efddc44f2b06ae9592cdbc01c0aadc4621ddf99e818793a4d835c741a2464e
    source_path: providers/openai.md
    workflow: 16
---

OpenClaw, hem doğrudan API anahtarıyla kimlik doğrulama hem de
ChatGPT/Codex aboneliğiyle kimlik doğrulama için tek bir sağlayıcı kimliği olan `openai` kullanır. `openai/*` standart model rotasıdır.
Çalışma zamanı politikası ayarlanmamış veya `auto` olarak ayarlanmış yerleşik ajan turlarında, OpenAI'ın rota
bilgileri OpenClaw'ın paketle birlikte gelen Codex uygulama sunucusu çalışma zamanını örtük olarak
seçip seçemeyeceğini belirler. `openai/*` ön eki tek başına bir çalışma zamanı seçmez.

- **Ajan modelleri** - açık
  `agentRuntime` yapılandırması veya OpenAI'ın örtük rota politikası tarafından seçilen çalışma zamanı üzerinden `openai/*`. ChatGPT/Codex aboneliği kullanımı için Codex
  kimlik doğrulamasıyla oturum açın veya anahtar tabanlı faturalandırma istediğinizde bir API anahtarı kimlik doğrulama
  profili yapılandırın.
- **Ajan dışı OpenAI API'leri** - kullanım başına faturalandırılan doğrudan OpenAI Platform erişimi;
  `OPENAI_API_KEY` veya bir `openai` API anahtarı kimlik doğrulama profili üzerinden.
- **Eski yapılandırma** - `codex/*` ve `openai-codex/*` referansları,
  `openclaw doctor --fix` tarafından `openai/*` ile model kapsamlı
  `agentRuntime.id: "codex"` biçimine onarılır.

OpenAI, OpenClaw gibi harici araçlarda ve iş akışlarında abonelik OAuth kullanımını
açıkça destekler.

## Kullanım ve maliyet takibi

OpenClaw, abonelik kotasını ve Platform API faturalandırmasını ayrı tutar:

- ChatGPT/Codex OAuth; abonelik planını, kota aralıklarını ve kredi bakiyesini gösterir.
- `OPENAI_ADMIN_KEY`, Control UI **Kullanım** bölümünde günlük harcamalar, istek/token toplamları, en çok kullanılan modeller ve maliyet kategorileri dâhil olmak üzere sağlayıcının bildirdiği 30 günlük kuruluş maliyetini ve tamamlama kullanımını gösterir.
- `OPENAI_PROJECT_ID`, isteğe bağlı olarak Admin API geçmişini tek bir projeyle sınırlar.
- OpenClaw, kuruluş API'lerine hiçbir zaman `OPENAI_API_KEY` veya bir `openai` çıkarım profili göndermez; bu kimlik bilgileri özel, Azure veya ajana yerel uç noktalara ait olabilir.

Açıkça belirtilen bir Admin anahtarı OAuth'a göre önceliklidir. Sağlayıcının bildirdiği geçmiş, OpenClaw'ın oturumdan türetilen tahmini maliyetiyle birleştirilmez; diğer istemcilerden gelen API etkinliklerini ve sağlayıcı tarafındaki faturalandırma düzeltmelerini içerebilir.

OpenAI'ın [API Kullanım Panosu](https://help.openai.com/en/articles/10478918) belgelerinde, kullanım verileri için kuruluş sahibi ve açık Kullanım Panosu izni gereksinimleri açıklanmaktadır.

Sağlayıcı, model, çalışma zamanı ve kanal ayrı katmanlardır. Bu etiketler
birbirine karıştırılıyorsa yapılandırmayı değiştirmeden önce [Ajan çalışma zamanları](/tr/concepts/agent-runtimes) sayfasını
okuyun.

## Hızlı seçim

| Hedef                                             | Kullanım                                                            | Notlar                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| ChatGPT/Codex aboneliği, yerel Codex çalışma zamanı | `openai/gpt-5.6-sol`                                               | Yeni abonelik kurulumu; Codex kimlik doğrulamasıyla oturum açın.    |
| Ajan turları için doğrudan API anahtarıyla faturalandırma | `openai/gpt-5.6` ile sıralı bir API anahtarı kimlik doğrulama profili | Yeni API anahtarı kurulumu; çıplak doğrudan API kimliği Sol'a çözümlenir. |
| Tam bir GPT-5.6 katmanı seçme                     | `openai/gpt-5.6-sol`, `-terra` veya `-luna`                         | Bu hesapta kullanılabilen katmanlar için `models list` öğesini kontrol edin. |
| GPT-5.6 erişimi olmayan hesap                    | `openai/gpt-5.5`                                                   | Açık kurtarma seçimi; OpenClaw sürümü sessizce düşürmez.             |
| Doğrudan API anahtarıyla faturalandırma, açık OpenClaw çalışma zamanı | `openai/gpt-5.6` ile sağlayıcı/model `agentRuntime.id: "openclaw"` | Normal bir `openai` API anahtarı profili seçin.           |
| En son ChatGPT Instant model takma adı            | `openai/chat-latest`                                               | Yalnızca doğrudan API anahtarı; kararlı varsayılan değil, değişken bir takma addır. |
| Görüntü oluşturma veya düzenleme                  | `openai/gpt-image-2`                                               | `OPENAI_API_KEY` veya Codex OAuth ile çalışır.                     |
| Şeffaf arka planlı görüntüler                     | `openai/gpt-image-1.5`                                             | `outputFormat` değerini `png` veya `webp` ve `background=transparent` olarak ayarlayın. |

## Adlandırma eşlemesi

| Gördüğünüz ad                           | Katman            | Anlamı                                                                                  |
| --------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `openai`                                | Sağlayıcı ön eki  | Standart OpenAI model rotası; örtük çalışma zamanını rota bilgileri belirler.             |
| `codex` Plugin'i                         | Plugin            | Yerel Codex uygulama sunucusu çalışma zamanını ve `/codex` sohbet denetimlerini sağlayan paketle birlikte gelen Plugin. |
| sağlayıcı/model `agentRuntime.id: codex` | Ajan çalışma zamanı | Eşleşen yerleşik turlar için yerel Codex uygulama sunucusu yürütücüsünü zorunlu kılar.    |
| `/codex ...`                            | Sohbet komut kümesi | Bir konuşmadan Codex uygulama sunucusu iş parçacıklarını bağlar/denetler.                 |
| `runtime: "acp", agentId: "codex"`      | ACP oturum rotası | Codex'i ACP/acpx üzerinden çalıştıran açık geri dönüş yolu.                              |

## Örtük ajan çalışma zamanı

Sağlayıcı/model `agentRuntime` politikası ayarlanmamış veya `auto` olduğunda, OpenAI'ın
sağlayıcıya ait rota politikası, etkin uç nokta ve bağdaştırıcıdan örtük
çalışma zamanını seçer:

| Etkin rota bilgileri                                                                                                                                                    | Örtük çalışma zamanı  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `openai-responses` içeren tam resmî Platform HTTPS uç noktası veya `openai-chatgpt-responses` içeren tam resmî ChatGPT HTTPS uç noktası; yazılmış istek geçersiz kılması yok | Codex seçilebilir     |
| Yazılmış `openai-completions` bağdaştırıcısı                                                                                                                             | OpenClaw              |
| Özel uç nokta                                                                                                                                                           | OpenClaw              |
| HTTP kullanan açık ve tam resmî uç nokta                                                                                                                               | Reddedilir            |
| Yazılmış sağlayıcı/model istek geçersiz kılması bulunan rota                                                                                                           | OpenClaw              |

Açıkça belirtilen, varsayılan olmayan bir sağlayıcı/model `agentRuntime.id` değeri belirleyici olmaya devam eder.
Örneğin `agentRuntime.id: "openclaw"`, normalde Codex'e uygun bir
rotayı OpenClaw'da tutarken `agentRuntime.id: "codex"`, Codex'i zorunlu kılar ve
etkin rota Codex ile uyumlu olarak bildirilmemişse kapalı biçimde başarısız olur.
Çalışma zamanı seçimi, kimlik bilgisi türünü veya faturalandırmayı değiştirmez: Platform API anahtarıyla
kimlik doğrulama ile ChatGPT/Codex aboneliğiyle kimlik doğrulama ayrı kalır.

`openclaw doctor --fix`; eski `codex/*` ve `openai-codex/*` model
referanslarını, eski Codex kimlik doğrulama profili kimliklerini ve eski Codex kimlik doğrulama sırası girdilerini
standart `openai` rotasına taşır. Taşınan model referansları model kapsamlı
`agentRuntime.id: "codex"` alır; yeni kimlik doğrulama sırası yapılandırması için `auth.order.openai` kullanın.

<Note>
Yeni OpenAI kurulumu, yalnızca birincil model
yapılandırılmamışsa bir GPT-5.6 birincil modeli uygular. OpenAI kimlik doğrulamasını eklemek veya yenilemek,
`models auth login --set-default` ya da `models set` açıkça kullanılmadığı sürece `openai/gpt-5.5` dâhil
mevcut açık seçimi korur. Yalnızca bir ajan modeli için API anahtarıyla kimlik doğrulama
istendiğinde API anahtarı kimlik doğrulama profili kullanın.
</Note>

## GPT-5.6 sınırlı önizlemesi

OpenClaw; tam `openai/gpt-5.6-sol`,
`openai/gpt-5.6-terra` ve `openai/gpt-5.6-luna` model kimliklerini tanır. Üçü de
geçerli katalogda `xhigh` ve `max` akıl yürütmesini sunar. OpenAI, Sol'u
amiral gemisi katmanı, Terra'yı dengeli katman ve Luna'yı hızlı,
daha düşük maliyetli katman olarak tanımlar. Bkz.
[GPT-5.6 lansman duyurusu](https://openai.com/index/previewing-gpt-5-6-sol/)
ve [erişim kılavuzu](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna).

Doğrudan OpenAI API anahtarıyla kimlik doğrulamada, çıplak `openai/gpt-5.6` kimliği
Sol için bir takma addır ve yeni kurulumun varsayılanıdır. Yerel Codex kataloğu,
bu doğrudan API takma adını istemci tarafında uygulamaz; çalışma alanı erişimine bağlı olarak
tam Sol, Terra ve Luna kimliklerini gösterebilir. Bu nedenle yeni ChatGPT/Codex OAuth kurulumu
`openai/gpt-5.6-sol` kullanır. Geçerli hesabı şu komutla kontrol edin:

```bash
openclaw models list --provider openai
```

API kuruluşu erişimi ile Codex çalışma alanı erişimi farklı olabilir. GPT-5.6
kullanılamıyorsa GPT-5.5'i açıkça seçin:

```bash
openclaw models set openai/gpt-5.5
```

OpenClaw, yukarı akış erişim hatasını gösterir ve bir
GPT-5.6 seçimini sessizce GPT-5.5 ile değiştirmez.

<Note>
Uygun tam resmî HTTPS rotaları, çalışma zamanı politikası ayarlanmamış veya `auto` olduğunda paketle birlikte gelen Codex uygulama sunucusu
Plugin'ini seçebilir; yazılmış Completions rotaları,
özel uç noktalar ve istek aktarımı geçersiz kılmaları OpenClaw'da kalır. Düz metin
resmî HTTP uç noktaları reddedilir. Açık sağlayıcı/model çalışma zamanı yapılandırması
belirleyici olmaya devam eder. Açık çalışma zamanı yapılandırmasıyla ayarlanmamış eski Codex model
referanslarını, `codex-cli/*` referanslarını veya eski çalışma zamanı oturum sabitlemelerini onarmak için `openclaw doctor --fix` komutunu çalıştırın.
</Note>

## OpenClaw özellik kapsamı

| OpenAI özelliği           | OpenClaw yüzeyi                                                                               | Durum                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Sohbet / Yanıtlar         | `openai/<model>` model sağlayıcısı                                                           | Evet                                                            |
| Codex abonelik modelleri  | OpenAI OAuth ile `openai/<model>`                                                            | Evet                                                            |
| Eski Codex model referansları | eski Codex model referansları, `codex-cli/<model>`                                          | doctor tarafından `openai/<model>` olarak düzeltilir           |
| Codex app-server çalıştırma düzeneği | Çalışma zamanı ayarlanmamış/`auto` olan Codex uyumlu HTTPS rotası veya açıkça belirtilen `agentRuntime.id: codex` | Evet |
| Sunucu taraflı web araması | Yerel OpenAI Responses aracı                                                                 | Evet, web araması etkinse ve başka bir sağlayıcı sabitlenmemişse |
| Görseller                 | `image_generate`                                                                            | Evet                                                            |
| Videolar                  | `video_generate`                                                                            | Evet                                                            |
| Metinden konuşmaya        | `messages.tts.provider: "openai"` / `tts`                                                       | Evet                                                            |
| Toplu konuşmadan metne    | `tools.media.audio` / medya anlama                                                             | Evet                                                            |
| Akışlı konuşmadan metne   | Voice Call `streaming.provider: "openai"`                                                                 | Evet                                                            |
| Gerçek zamanlı ses        | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"`                            | Evet (OpenAI Platform API anahtarı)                              |
| Gömme vektörleri          | bellek gömme vektörü sağlayıcısı                                                              | Evet                                                            |

<Note>
OpenAI Realtime ses, herkese açık **OpenAI Platform Realtime
API** üzerinden geçer ve bir Platform API anahtarı gerektirir. Codex OAuth belirteçleri
bunun yerine ChatGPT Codex arka ucunda kimlik doğrulaması yapar; herkese açık Realtime
uç noktalarında Platform API anahtarlarıyla birbirlerinin yerine kullanılamazlar.

API anahtarıyla kimlik doğrulama faturalandırmanın eksik olduğunu bildirirse API anahtarıyla
kimlik doğrulama kullanılırken gerçek zamanlı kimlik bilgilerinizin bağlı olduğu kuruluş için
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
adresinden Platform kredisi yükleyin. Gerçek zamanlı ses; `openclaw onboard --auth-choice openai-api-key` tarafından
oluşturulan `openai` API anahtarı kimlik doğrulama profilini, Control UI Talk için
`talk.realtime.providers.openai.apiKey` aracılığıyla ayarlanan bir Platform API anahtarını,
Voice Call için `plugins.entries.voice-call.config.realtime.providers.openai.apiKey` değerini
veya `OPENAI_API_KEY` ortam değişkenini kabul eder.
</Note>

## Bellek gömme vektörleri

OpenClaw, `memory_search` indeksleme ve sorgu gömme vektörleri için OpenAI'ı
veya OpenAI uyumlu bir gömme vektörü uç noktasını kullanabilir:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

Asimetrik gömme vektörü etiketleri gerektiren OpenAI uyumlu uç noktalar için
`memorySearch` altında `queryInputType` ve `documentInputType` değerlerini ayarlayın. OpenClaw
bunları sağlayıcıya özgü `input_type` istek alanları olarak iletir: sorgu
gömme vektörleri `queryInputType`; indekslenen bellek parçaları ve toplu indeksleme ise
`documentInputType` kullanır. Tam örnek için
[Bellek yapılandırma referansına](/tr/reference/memory-config#provider-specific-config)
bakın.

## Başlarken

<Tabs>
  <Tab title="API anahtarı (OpenAI Platform)">
    **En uygun olduğu durum:** doğrudan API erişimi ve kullanıma dayalı faturalandırma.

    <Steps>
      <Step title="API anahtarınızı alın">
        [OpenAI Platform panosundan](https://platform.openai.com/api-keys) bir API anahtarı oluşturun veya kopyalayın.
      </Step>
      <Step title="İlk kurulumu çalıştırın">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Alternatif olarak anahtarı doğrudan geçirin:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Rota özeti

    | Model referansı    | Çalışma zamanı ilkesi veya rota bilgileri                     | Rota                      | Kimlik doğrulama                  |
    | ----------------- | ------------------------------------------------------------- | ------------------------- | --------------------------------- |
    | `openai/gpt-5.6` | ayarlanmamış/`auto`, tam resmî yerel HTTPS rotası, istek geçersiz kılması yok | Codex seçilebilir         | Sıralı API anahtarı kimlik doğrulama profili |
    | `openai/gpt-5.6` | sağlayıcı/model `agentRuntime.id: "openclaw"`                           | OpenClaw gömülü çalışma zamanı | Seçilen `openai` API anahtarı profili |
    | `openai/gpt-5.5` | açıkça belirtilen sağlayıcı/model `agentRuntime.id`         | Seçilen ajan çalışma zamanı | Seçilen OpenAI API anahtarı profili |
    | `openai/*` | yazılmış Completions, özel veya istek geçersiz kılması       | OpenClaw gömülü çalışma zamanı | Kimlik bilgisi türü değişmeden kalır |
    | `openai/*` | düz metin resmî HTTP uç noktası                              | Reddedilir                | Kimlik bilgisi gönderilmez        |

    <Note>
    Çalışma zamanı ayarlanmamışken veya `auto` olduğunda yalnızca uygun, tam
    resmî bir yerel HTTPS rotası Codex app-server çalıştırma düzeneğini örtük olarak seçebilir.
    Bir ajan modelinde API anahtarıyla kimlik doğrulama için bir `openai` API anahtarı
    kimlik doğrulama profili oluşturun ve bunu `auth.order.openai` ile sıralayın;
    `OPENAI_API_KEY`, ajan dışı OpenAI API yüzeyleri için doğrudan yedek seçenek olarak kalır.
    Eski Codex kimlik doğrulama sırası girdilerini taşımak için `openclaw doctor --fix` komutunu çalıştırın.
    </Note>

    ### Yapılandırma örneği

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
    }
    ```

    Yalın doğrudan API `gpt-5.6` kimliği Sol katmanına çözümlenir. Bu API
    kuruluşu GPT-5.6'yı kullanıma sunmuyorsa birincil modeli açıkça
    `openai/gpt-5.5` olarak ayarlayın.

    OpenAI API üzerinden ChatGPT'nin mevcut Instant modelini denemek için modeli
    `openai/chat-latest` olarak ayarlayın:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` değişken bir takma addır. Yeni OpenAI API anahtarı kurulumu bunun yerine
    yalın doğrudan API kimliği Sol'a çözümlenen `openai/gpt-5.6` değerini kullanır.
    `openai/gpt-5.5` dâhil mevcut açıkça belirtilmiş birincil modeller değişmeden kalır.
    `chat-latest` takma adı yalnızca `medium` metin ayrıntı düzeyini kabul eder;
    OpenClaw bu model için istenen diğer tüm ayrıntı düzeylerini `medium` değerine zorlar.

    <Warning>
    OpenClaw, doğrudan OpenAI API anahtarı rotasında `gpt-5.3-codex-spark` değerini
    **sunmaz**. Bu değer yalnızca oturum açtığınız hesap tarafından kullanıma sunulduğunda
    Codex abonelik kataloğu girdileri üzerinden kullanılabilir.
    </Warning>

  </Tab>

  <Tab title="Codex aboneliği">
    **En uygun olduğu durum:** ayrı bir API anahtarı yerine yerel Codex
    app-server yürütmesiyle ChatGPT/Codex aboneliğinizi kullanmak. Codex bulutu,
    ChatGPT oturumu açılmasını gerektirir.

    <Steps>
      <Step title="Codex OAuth'u çalıştırın">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        Alternatif olarak OAuth'u doğrudan çalıştırın:

        ```bash
        openclaw models auth login --provider openai
        ```

        Ekransız veya geri çağrıya elverişsiz kurulumlarda yerel ana makine tarayıcısı geri
        çağrısı yerine ChatGPT cihaz kodu akışıyla oturum açmak için `--device-code` ekleyin:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Standart OpenAI model rotasını kullanın">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.6-sol
        ```

        Bu tam resmî yerel HTTPS rotası için çalışma zamanı yapılandırması gerekmez.
        Codex app-server çalışma zamanını otomatik olarak seçebilir ve bu çalışma zamanı
        seçildiğinde OpenClaw, paketle gelen Codex pluginini kurar veya onarır.
      </Step>
      <Step title="Codex kimlik doğrulamasının kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider openai
        ```

        Gateway çalışmaya başladıktan sonra yerel app-server çalışma zamanını doğrulamak için
        sohbette `/codex status` veya `/codex models` gönderin.
      </Step>
    </Steps>

    ### Rota özeti

    | Model referansı          | Çalışma zamanı ilkesi veya rota bilgileri                     | Rota                                                     | Kimlik doğrulama                                  |
    | ----------------------- | ------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------- |
    | `openai/gpt-5.6-sol`      | ayarlanmamış/`auto`, tam resmî yerel HTTPS rotası, istek geçersiz kılması yok | Codex seçilebilir                                       | Codex oturumu veya sıralı bir `openai` kimlik doğrulama profili |
    | `openai/gpt-5.6-terra`      | ayarlanmamış/`auto`, tam resmî yerel HTTPS rotası, istek geçersiz kılması yok | Codex seçilebilir                                       | Katalog Terra'yı kullanıma sunduğunda Codex oturumu |
    | `openai/gpt-5.6-luna`      | ayarlanmamış/`auto`, tam resmî yerel HTTPS rotası, istek geçersiz kılması yok | Codex seçilebilir                                       | Katalog Luna'yı kullanıma sunduğunda Codex oturumu |
    | `openai/gpt-5.6-sol`      | sağlayıcı/model `agentRuntime.id: "openclaw"`                           | OpenClaw gömülü çalışma zamanı, dâhilî Codex kimlik doğrulama aktarımı | Seçilen `openai` OAuth profili |
    | `openai/gpt-5.5`      | açıkça belirtilen sağlayıcı/model `agentRuntime.id`         | Seçilen ajan çalışma zamanı                              | Seçilen OpenAI kimlik doğrulama profili           |
    | `openai/*`      | yazılmış Completions, özel veya istek geçersiz kılması       | OpenClaw gömülü çalışma zamanı                           | Kimlik bilgisi gereksinimi rotaya özgü kalır      |
    | `openai/*`      | düz metin resmî HTTP uç noktası                              | Reddedilir                                               | Kimlik bilgisi gönderilmez                        |
    | Eski Codex GPT-5.5 referansı | doctor tarafından düzeltilir                           | `openai/gpt-5.5` olarak yeniden yazılır                | Taşınmış OpenAI OAuth profili                     |
    | `codex-cli/gpt-5.5`      | doctor tarafından düzeltilir                                 | `openai/gpt-5.5` olarak yeniden yazılır                | Codex app-server kimlik doğrulaması               |

    <Warning>
    Abonelik destekli yeni kurulum tam olarak `openai/gpt-5.6-sol` kullanır;
    yerel Codex kataloğu tam Terra veya Luna referanslarını da sunabilir. Hesap
    GPT-5.6'yı sunmuyorsa açıkça `openai/gpt-5.5` seçin. Eski Codex GPT
    referansları, yerel Codex çalışma zamanı yolu değil, eski OpenClaw
    rotalarıdır; mevcut açık GPT-5.5 seçimini yükseltmeden bunları taşımak için
    `openclaw doctor --fix` çalıştırın. `gpt-5.3-codex-spark` yalnızca Codex abonelik
    kataloğunda bu modelin sunulduğu hesaplarla sınırlı kalır; buna yönelik
    doğrudan OpenAI API anahtarı ve Azure referansları gizli kalır.
    </Warning>

    <Note>
    Yeni yapılandırma, OpenAI ajan kimlik doğrulama sırasını `auth.order.openai`
    altında tutmalıdır; doctor, eski Codex kimlik doğrulama sırası girdilerini taşır.
    </Note>

    ### Yapılandırma örneği

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
        },
      },
    }
    ```

    API anahtarı yedeğiyle, seçilen modeli `openai/*` altında tutun ve
    kimlik doğrulama sırasını `openai` altında belirtin. OpenClaw,
    Codex düzeneğinde kalırken önce aboneliği, ardından API anahtarını dener:

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
        },
      },
      auth: {
        order: {
          openai: [
            "openai:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    İlk katılım artık OAuth malzemesini `~/.codex` konumundan içe
    aktarmaz. Tarayıcı OAuth'u (varsayılan) veya yukarıdaki cihaz kodu akışıyla
    oturum açın; OpenClaw, elde edilen kimlik bilgilerini kendi ajan kimlik
    doğrulama deposunda yönetir.
    </Note>

    ### Codex OAuth yönlendirmesini denetleme ve kurtarma

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Belirli bir ajan için `--agent <id>` ekleyin:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    Eski bir yapılandırmada hâlâ eski Codex GPT referansları veya açık çalışma
    zamanı yapılandırması olmadan eski bir OpenAI çalışma zamanı oturum
    sabitlemesi varsa bunu onarın:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    `models auth list --provider openai` kullanılabilir profil göstermiyorsa yeniden oturum açın:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    Aynı ajanda birden fazla Codex OAuth oturumu açmak için
    `--profile-id` kullanın, ardından bunları kimlik doğrulama sıralaması
    veya `/model ...@<profileId>` üzerinden denetleyin:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    Profil sıralamasına güvenmeden önce eski OpenAI Codex ön ekli profil
    kimliklerini ve sıra girdilerini taşımak için `openclaw doctor --fix` çalıştırın.

    ### Durum göstergesi

    Sohbette `/status`, geçerli oturumda hangi model çalışma zamanının
    etkin olduğunu gösterir. Uygun bir örtük rota veya açık sağlayıcı/model
    çalışma zamanı ilkesi bunu seçtiğinde, paketle gelen Codex uygulama sunucusu
    düzeneği `Runtime: OpenAI Codex` olarak görünür.

    ### Doctor uyarısı

    Yapılandırmada veya oturum durumunda eski Codex model referansları ya da
    eski OpenAI çalışma zamanı sabitlemeleri kalırsa, OpenClaw açıkça
    yapılandırılmadığı sürece `openclaw doctor --fix` bunları Codex çalışma zamanıyla
    `openai/*` olarak yeniden yazar.

    ### Bağlam penceresi sınırı

    OpenClaw, model meta verilerini ve çalışma zamanı bağlam sınırını ayrı
    değerler olarak ele alır. Codex OAuth kataloğu üzerinden
    `openai/gpt-5.5` için:

    - Yerel `contextWindow`: `400000`
    - Varsayılan çalışma zamanı `contextTokens` sınırı: `272000`

    Daha küçük varsayılan sınır, uygulamada daha iyi gecikme ve kalite
    özelliklerine sahiptir. Bunu `contextTokens` ile geçersiz kılın:

    ```json5
    {
      models: {
        providers: {
          openai: {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Yerel model meta verilerini bildirmek için `contextWindow` kullanın.
    Çalışma zamanı bağlam bütçesini sınırlamak için `contextTokens` kullanın.
    Doğrudan OpenAI API anahtarı rotası, `gpt-5.5` için daha büyük bir
    yerel `contextWindow` (`1000000`) bildirir; üst kaynak
    katalogları farklı olduğundan iki rota ayrı ayrı izlenir.
    </Note>

    ### Katalog kurtarma

    OpenClaw, mevcut olduğunda `gpt-5.5` için üst kaynak Codex katalog
    meta verilerini kullanır. Hesabın kimliği doğrulanmışken canlı Codex keşfi
    `gpt-5.5` satırını içermiyorsa OpenClaw, cron, alt ajan ve
    yapılandırılmış varsayılan model çalıştırmalarının `Unknown model`
    hatasıyla başarısız olmaması için bu OAuth model satırını sentezler.

  </Tab>
</Tabs>

## Yerel Codex uygulama sunucusu kimlik doğrulaması

Yerel Codex uygulama sunucusu düzeneği, uygun bir tam resmî HTTPS rotası bunu
örtük olarak seçtiğinde veya sağlayıcı/model `agentRuntime.id: "codex"` bunu açıkça
seçtiğinde `openai/*` model referanslarını kullanır. Kimlik doğrulaması
yine hesap tabanlıdır. OpenClaw kimlik doğrulamasını şu sırayla seçer:

1. Ajan için tercihen `auth.order.openai` altında bulunan sıralı
   OpenAI kimlik doğrulama profilleri. Eski Codex kimlik doğrulama profil
   kimliklerini ve kimlik doğrulama sırasını taşımak için `openclaw doctor --fix`
   çalıştırın.
2. Uygulama sunucusunun yerel bir Codex CLI ChatGPT oturumu gibi
   mevcut hesabı. Varsayılan yalıtılmış ajan ana dizini için OpenClaw, bu yerel
   CLI hesabını oturum açma RPC'si aracılığıyla uygulama sunucusuna bağlar;
   CLI'ın yapılandırmasını, pluginlerini veya iş parçacığı deposunu paylaşmaz.
3. Yalnızca yerel stdio uygulama sunucusu başlatmaları için ve
   yalnızca uygulama sunucusu hesap olmadığını bildirdiğinde:
   `CODEX_API_KEY`, ardından `OPENAI_API_KEY`.

Gateway işlemi doğrudan OpenAI modelleri veya gömmeleri için ayrıca
`OPENAI_API_KEY` değerine sahip olsa bile yerel ChatGPT/Codex abonelik
oturumunun yerini almaz. Ortam API anahtarı yedeği yalnızca yerel stdio hesapsız
yoluna uygulanır; WebSocket uygulama sunucusu bağlantıları üzerinden asla
gönderilmez. Abonelik türü bir Codex profili seçildiğinde OpenClaw ayrıca
`CODEX_API_KEY` ve `OPENAI_API_KEY` değerlerini oluşturulan stdio uygulama
sunucusu alt işleminden uzak tutar ve bunun yerine seçilen kimlik bilgilerini
uygulama sunucusu oturum açma RPC'si üzerinden gönderir.

Bu abonelik profili bir Codex kullanım sınırı nedeniyle engellendiğinde OpenClaw,
profili Codex'in bildirdiği sıfırlama zamanına kadar engellenmiş olarak işaretler
ve seçilen modeli değiştirmeden veya Codex düzeneğinden çıkmadan kimlik doğrulama
sıralamasının sonraki `openai:*` profiline geçmesine izin verir.
Sıfırlama zamanı geçtikten sonra abonelik profili yeniden kullanılabilir olur.

## Görsel oluşturma

Paketle gelen `openai` plugini, `image_generate` aracı üzerinden
görsel oluşturmayı kaydeder. Aynı `openai/gpt-image-2` model referansı üzerinden
hem OpenAI API anahtarıyla hem de Codex OAuth ile görsel oluşturmayı destekler.

| Yetenek                   | OpenAI API anahtarı                | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Model referansı           | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Kimlik doğrulama          | `OPENAI_API_KEY`                   | OpenAI Codex OAuth oturumu            |
| Aktarım                   | OpenAI Images API                  | Codex Responses arka ucu              |
| İstek başına azami görsel | 4                                  | 4                                    |
| Düzenleme modu            | Etkin (en fazla 5 referans görseli) | Etkin (en fazla 5 referans görseli)   |
| Boyut geçersiz kılmaları  | 2K/4K boyutları dâhil desteklenir  | 2K/4K boyutları dâhil desteklenir     |
| En-boy oranı / çözünürlük | OpenAI Images API'ye iletilmez     | Güvenli olduğunda desteklenen bir boyutla eşlenir |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Ortak araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için
[Görsel Oluşturma](/tr/tools/image-generation) bölümüne bakın.
</Note>

`gpt-image-2`, OpenAI metinden görsele oluşturma ve görsel düzenleme için
varsayılandır. `gpt-image-1.5`, `gpt-image-1` ve `gpt-image-1-mini`,
açık model geçersiz kılmaları olarak kullanılabilir kalır. Şeffaf arka planlı
PNG/WebP çıktısı için `openai/gpt-image-1.5` kullanın; mevcut
`gpt-image-2` API'si `background: "transparent"` değerini reddeder.

Şeffaf arka plan isteği için `image_generate` öğesini
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` veya `"webp"` ve
`background: "transparent"` ile çağırın; eski `openai.background` sağlayıcı seçeneği
hâlâ kabul edilir. OpenClaw ayrıca varsayılan `openai/gpt-image-2` şeffaflık
isteklerini `gpt-image-1.5` olarak yeniden yazarak herkese açık OpenAI ve
OpenAI Codex OAuth rotalarını korur; Azure ve özel OpenAI uyumlu uç noktalar,
yapılandırılmış dağıtım/model adlarını korur.

Aynı ayar, başsız CLI çalıştırmaları için de sunulur:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "Şeffaf bir arka plan üzerinde basit bir kırmızı daire çıkartması" \
  --json
```

Bir girdi dosyasından başlarken `openclaw infer image edit` ile aynı
`--output-format` ve `--background` bayraklarını kullanın.
`--openai-background`, OpenAI'a özgü bir diğer ad olarak kullanılabilir kalır.
OpenAI Images kalite ve maliyetini denetlemek için `--quality low|medium|high|auto`
kullanın. OpenAI'ın moderasyon ipucunu `image generate` veya
`image edit` üzerinden geçirmek için `--openai-moderation low|auto` kullanın.

ChatGPT/Codex OAuth kurulumları için aynı `openai/gpt-image-2` referansını
koruyun. Bir `openai` OAuth profili yapılandırıldığında OpenClaw,
depolanan OAuth erişim belirtecini çözümler ve görsel isteklerini Codex
Responses arka ucu üzerinden gönderir; önce `OPENAI_API_KEY` denemez veya
sessizce bir API anahtarına geri dönmez. Bunun yerine doğrudan OpenAI Images
API rotasını istediğinizde `models.providers.openai` öğesini bir API anahtarı, özel
temel URL veya Azure uç noktasıyla açıkça yapılandırın. Bu özel görsel uç
noktası güvenilir bir LAN/özel adresteyse `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` değerini de
ayarlayın; OpenClaw, bu açık izin olmadıkça özel/dahili OpenAI uyumlu görsel uç
noktalarını engellenmiş tutar.

Oluştur:

```
/tool image_generate model=openai/gpt-image-2 prompt="macOS'te OpenClaw için şık bir lansman posteri" size=3840x2160 count=1
```

Şeffaf bir PNG oluştur:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="Şeffaf bir arka plan üzerinde basit bir kırmızı daire çıkartması" outputFormat=png background=transparent
```

Düzenle:

```
/tool image_generate model=openai/gpt-image-2 prompt="Nesnenin şeklini koru, malzemeyi yarı saydam cama dönüştür" image=/path/to/reference.png size=1024x1536
```

## Video oluşturma

Paketle gelen `openai` plugini, `video_generate` aracı üzerinden
video oluşturmayı kaydeder.

| Yetenek            | Değer                                                                              |
| ------------------ | ---------------------------------------------------------------------------------- |
| Varsayılan model   | `openai/sora-2`                                                                    |
| Modlar             | Metinden videoya, görselden videoya, tek video düzenleme                           |
| Referans girdileri | 1 görsel veya 1 video                                                              |
| Boyut geçersiz kılmaları | Metinden videoya ve görselden videoya için desteklenir                        |
| En-boy oranı       | Ham olarak iletilmez, desteklenen en yakın boyuta dönüştürülür                      |
| Diğer geçersiz kılmalar | `resolution`, `audio`, `watermark` desteklenmez ve araç uyarısıyla kaldırılır |

OpenAI görüntüden videoya istekleri, bir görüntü
`input_reference` ile `POST /v1/videos` kullanır. Tek videolu düzenlemeler, yüklenen video
`video` alanında olacak şekilde `POST /v1/videos/edits` kullanır.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Ortak araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için
[Video Oluşturma](/tr/tools/video-generation) bölümüne bakın.

OpenAI sağlayıcısı `supportsSize` bildirir ancak `supportsAspectRatio` veya
`supportsResolution` bildirmez. OpenClaw'ın ortak normalleştirme katmanı, istek
sağlayıcıya ulaşmadan önce talep edilen `aspectRatio` değerini en yakın eşleşen OpenAI
`size` değerine dönüştürür; bu nedenle en-boy oranı istekleri genellikle çalışmaya devam eder.
`resolution` için boyut yedeği yoktur ve bu değer kaldırılarak çağırana
`Ignored unsupported overrides for openai/<model>: resolution=<value>` olarak bildirilir.
</Note>

## GPT-5 istem katkısı

OpenClaw, `openai` sağlayıcısındaki GPT-5 ailesi modelleri için
(paylaşılan `openai/*` değerine normalleştirilen onarım öncesi eski Codex referansları dâhil)
ortak bir GPT-5 istem katkısı ekler. OpenRouter veya opencode rotaları gibi
GPT-5 ailesi model kimliklerini de sunan diğer sağlayıcılar bu katmanı almaz;
katman yalnızca model kimliğine değil, `openai` sağlayıcı kimliğine göre etkinleştirilir.
Eski GPT-4.x modelleri bu katkıyı hiçbir zaman almaz.

Yerel Codex uygulama sunucusu altyapısı, geliştirici talimatları aracılığıyla
persona/araç disiplini davranış sözleşmesini veya dostça etkileşim tarzı katmanını
almaz; yerel Codex, Codex'e ait temel, model ve proje belgesi davranışını korur
ve OpenClaw, ajan çalışma alanı kişilik dosyalarının belirleyici kalması için
yerel ileti dizilerinde Codex'in yerleşik kişiliğini devre dışı bırakır.
OpenClaw, yerel Codex ileti dizilerine yalnızca çalışma zamanı bağlamı sağlar:
kanal teslimatı, OpenClaw dinamik araçları, ACP yetkilendirmesi, çalışma alanı bağlamı ve
OpenClaw Skills. Aynı katkıdaki Heartbeat yönlendirme metni tek istisnadır:
yerel Codex Heartbeat dönüşleri bunu alır; metin, ortak istem katkısı
kancası yerine özel iş birliği talimatları olarak eklenir.

GPT-5 katkısı, eşleşen OpenClaw tarafından oluşturulmuş istemlere persona
kalıcılığı, yürütme güvenliği, araç disiplini, çıktı biçimi, tamamlama
kontrolleri ve doğrulama için etiketli bir davranış sözleşmesi ekler. Kanala
özgü yanıt ve sessiz mesaj davranışı, ortak OpenClaw sistem isteminde
ve giden teslimat politikasında kalır. Dostça etkileşim tarzı katmanı
ayrıdır ve yapılandırılabilir.

| Değer                  | Etki                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (varsayılan) | Dostça etkileşim tarzı katmanını etkinleştirir |
| `"on"`                 | `"friendly"` için diğer ad                      |
| `"off"`                | Yalnızca dostça tarz katmanını devre dışı bırakır       |

<Tabs>
  <Tab title="Yapılandırma">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Değerler çalışma zamanında büyük/küçük harfe duyarlı değildir; dolayısıyla `"Off"` ve `"off"`
değerlerinin ikisi de dostça tarz katmanını devre dışı bırakır.
</Tip>

<Note>
Ortak `agents.defaults.promptOverlays.gpt5.personality` ayarı belirlenmediğinde eski
`plugins.entries.openai.config.personality` hâlâ uyumluluk yedeği olarak
okunur.
</Note>

## Ses ve konuşma

<AccordionGroup>
  <Accordion title="Konuşma sentezi (TTS)">
    Paketle gelen `openai` Plugin'i, `messages.tts`
    yüzeyi için konuşma sentezini kaydeder.

    | Ayar      | Yapılandırma yolu                                            | Varsayılan                          |
    | ------------- | --------------------------------------------------------- | ----------------------------------- |
    | Model        | `messages.tts.providers.openai.model`                  | `gpt-4o-mini-tts`                |
    | Ses        | `messages.tts.providers.openai.speakerVoice`           | `coral`                          |
    | Hız        | `messages.tts.providers.openai.speed`                  | (ayarlanmamış)                          |
    | Talimatlar | `messages.tts.providers.openai.instructions`           | (ayarlanmamış, yalnızca `gpt-4o-mini-tts`)  |
    | Biçim       | `messages.tts.providers.openai.responseFormat`         | sesli notlar için `opus`, dosyalar için `mp3` |
    | API anahtarı      | `messages.tts.providers.openai.apiKey`                 | `OPENAI_API_KEY` değerine geri döner   |
    | Temel URL     | `messages.tts.providers.openai.baseUrl`                | `https://api.openai.com/v1`      |
    | Ek gövde   | `messages.tts.providers.openai.extraBody` / `extra_body` | (ayarlanmamış)                        |

    Kullanılabilir modeller: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Kullanılabilir sesler:
    `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`,
    `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody`, OpenClaw'ın oluşturduğu alanlardan sonra `/audio/speech` istek JSON'uyla
    birleştirilir; bu nedenle `lang` gibi ek anahtarlar gerektiren
    OpenAI uyumlu uç noktalar için bunu kullanın. Prototip anahtarları yok sayılır.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Sohbet API uç noktasını etkilemeden TTS temel URL'sini geçersiz kılmak için
    `OPENAI_TTS_BASE_URL` değerini ayarlayın. OpenAI TTS ve Realtime sesin ikisi de
    bir OpenAI Platform API anahtarı üzerinden yapılandırılır; yalnızca OAuth
    kullanan kurulumlar Codex destekli sohbet modellerini kullanmaya devam edebilir,
    ancak OpenAI canlı sesli yanıtını kullanamaz.
    </Note>

  </Accordion>

  <Accordion title="Konuşmadan metne">
    Paketle gelen `openai` Plugin'i, OpenClaw'ın medya anlama
    transkripsiyon yüzeyi üzerinden toplu konuşmadan metne işlevini kaydeder.

    - Varsayılan model: `gpt-4o-transcribe`
    - Uç nokta: OpenAI REST `/v1/audio/transcriptions`
    - Giriş yolu: çok parçalı ses dosyası yüklemesi
    - Discord ses kanalı bölümleri ve kanal ses ekleri dâhil olmak üzere,
      gelen ses transkripsiyonunun `tools.media.audio` okuduğu her yerde kullanılır

    Gelen ses transkripsiyonu için OpenAI kullanımını zorunlu kılmak üzere:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Dil ve istem ipuçları, ortak ses medyası yapılandırması veya çağrı başına
    transkripsiyon isteği tarafından sağlandığında OpenAI'a iletilir.

  </Accordion>

  <Accordion title="Gerçek zamanlı transkripsiyon">
    Paketle gelen `openai` Plugin'i, Voice Call Plugin'i için
    gerçek zamanlı transkripsiyonu kaydeder.

    | Ayar          | Yapılandırma yolu                                                          | Varsayılan |
    | ----------------- | ----------------------------------------------------------------------- | --------- |
    | Model            | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Dil         | `...openai.language`                                                 | (ayarlanmamış) |
    | İstem           | `...openai.prompt`                                                   | (ayarlanmamış) |
    | Sessizlik süresi | `...openai.silenceDurationMs`                                        | `800`   |
    | VAD eşiği    | `...openai.vadThreshold`                                             | `0.5`   |
    | Kimlik doğrulama             | `...openai.apiKey`, `OPENAI_API_KEY` veya `openai` API anahtarı profili    | Platform API anahtarı gereklidir |

    <Note>
    G.711 u-law (`g711_ulaw` / `audio/pcmu`) sesiyle
    `wss://api.openai.com/v1/realtime` adresine WebSocket bağlantısı kullanır. Bir `openai` API anahtarı
    profili için Gateway, WebSocket'i açmadan önce geçici bir Realtime
    transkripsiyon istemci gizli anahtarı oluşturur. Bu akış sağlayıcısı Voice
    Call'un gerçek zamanlı transkripsiyon yolu içindir; Discord sesi şu anda kısa
    bölümleri kaydeder ve bunun yerine toplu `tools.media.audio` transkripsiyon
    yolunu kullanır.
    </Note>

  </Accordion>

  <Accordion title="Gerçek zamanlı ses">
    Paketle gelen `openai` Plugin'i, Voice Call Plugin'i için gerçek zamanlı
    sesi kaydeder.

    | Ayar                               | Yapılandırma yolu                                                              | Varsayılan             |
    | --------------------------------------- | ---------------------------------------------------------------------------- | ---------------------- |
    | Model                                  | `plugins.entries.voice-call.config.realtime.providers.openai.model`     | `gpt-realtime-2.1`  |
    | Ses                                  | `...openai.voice`                                                       | `alloy`             |
    | Sıcaklık (Azure dağıtım köprüsü)  | `...openai.temperature`                                                 | `0.8`               |
    | VAD eşiği                          | `...openai.vadThreshold`                                                | `0.5`                |
    | Sessizlik süresi                       | `...openai.silenceDurationMs`                                           | `500`                |
    | Önek dolgusu                         | `...openai.prefixPaddingMs`                                             | `300`                |
    | Akıl yürütme çabası                       | `...openai.reasoningEffort`                                             | (ayarlanmamış)              |
    | Kimlik doğrulama                                   | `openai` API anahtarı profili, `...openai.apiKey` veya `OPENAI_API_KEY` | OpenAI Platform API anahtarı gereklidir |

    `gpt-realtime-2.1` için kullanılabilir yerleşik Realtime sesleri: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI, en iyi Realtime kalitesi için `marin` ve `cedar` değerlerini önerir. Bu,
    yukarıdaki Metinden konuşmaya seslerinden ayrı bir kümedir; `fable`,
    `nova` veya `onyx` gibi yalnızca TTS'ye özgü bir ses, Realtime oturumları için geçerli değildir.
    Daha küçük ve daha düşük maliyetli Realtime 2.1 varyantını tercih ettiğinizde
    modeli açıkça `gpt-realtime-2.1-mini` olarak ayarlayın.

    <Note>
    **GPT-Live (yakında).** OpenAI'ın tam çift yönlü `gpt-live-1` ve
    `gpt-live-1-mini` modelleri Temmuz 2026'da ChatGPT ses modunun yerini aldı;
    geliştirici API'si erken erişim kuruluşlarına kademeli olarak sunulmaktadır.
    OpenClaw model ailesini tanır ancak henüz çalıştırmaz: GPT-Live oturumları
    yalnızca WebRTC kullanır, konuşma sırasını kendileri yönetir (VAD yoktur)
    ve ajan işlerini OpenClaw'ın gerçek zamanlı aktarımlarının henüz
    uygulamadığı bir devir olayı protokolü üzerinden yetkilendirir. Bir
    `gpt-live-*` modeli yapılandırıldığında, ajan erişimi olmadan sessizce
    ses bağlantısı kurmak yerine hem WebSocket köprüsü hem de Talk tarayıcı
    oturumları hakkında yönlendirme sunularak güvenli biçimde başarısız olunur.
    API erişimi de erken erişim sırasında OpenAI kuruluşu başına kısıtlanır.
    GPT-Live desteği kullanıma sunulana kadar `gpt-realtime-2.1` (varsayılan)
    değerini koruyun.
    </Note>

    <Note>
    Arka uç OpenAI gerçek zamanlı köprüleri, `session.temperature` kabul etmeyen
    genel kullanıma açık Realtime WebSocket oturumu biçimini kullanır. Azure OpenAI
    dağıtımları `azureEndpoint` ve `azureDeployment` üzerinden kullanılabilir
    olmaya devam eder ve dağıtımla uyumlu oturum biçimini (`temperature` dâhil)
    korur. Çift yönlü araç çağrısını ve G.711 u-law sesini destekler.
    </Note>

    <Note>
    Gerçek zamanlı ses, oturum oluşturulurken seçilir. OpenAI, çoğu
    oturum alanının daha sonra değiştirilmesine izin verir ancak model o oturumda
    ses çıkışı ürettikten sonra ses değiştirilemez. OpenClaw şu anda
    yerleşik Realtime ses kimliklerini dize olarak sunar.
    </Note>

    <Note>
    Control UI Talk, Gateway tarafından
    oluşturulan kısa ömürlü istemci gizli anahtarıyla OpenAI tarayıcı gerçek zamanlı oturumlarını ve
    OpenAI Realtime API ile doğrudan tarayıcı WebRTC SDP alışverişini kullanır.
    Gateway, bu istemci gizli anahtarını seçilen `openai` kimlik bilgisiyle
    oluşturur. Yapılandırılmış anahtarlar, API anahtarı profilleri ve
    `OPENAI_API_KEY` önceliklidir; bir `openai` OAuth profili veya harici
    Codex oturum açma bilgisi yedek seçenektir. Gateway geçişi ve Voice Call arka uç gerçek zamanlı
    WebSocket köprüleri, yerel OpenAI uç noktaları için aynı kimlik bilgisi sırasını kullanır.
    Bakım sorumluları için canlı doğrulama
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` ile kullanılabilir;
    OpenAI aşamaları, gizli bilgileri günlüğe kaydetmeden hem arka uç WebSocket köprüsünü hem de tarayıcı
    WebRTC SDP alışverişini doğrular.
    Bu iki aşamayı Google kimlik bilgileri olmadan çalıştırmak için `--openai-only` iletin.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI uç noktaları

Paketle gelen `openai` sağlayıcısı, temel URL geçersiz kılınarak görüntü
üretimi için bir Azure OpenAI kaynağını hedefleyebilir. Görüntü üretimi yolunda OpenClaw,
`models.providers.openai.baseUrl` üzerindeki Azure ana bilgisayar adlarını algılar ve otomatik olarak
Azure'un istek biçimine geçer.

<Note>
Gerçek zamanlı ses ayrı bir yapılandırma yolu
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
kullanır ve `models.providers.openai.baseUrl` tarafından etkilenmez. Azure
ayarları için [Ses ve konuşma](#voice-and-speech) altındaki **Gerçek zamanlı
ses** akordeonuna bakın.
</Note>

Şu durumlarda Azure OpenAI kullanın:

- Zaten bir Azure OpenAI aboneliğiniz, kotanız veya kurumsal
  sözleşmeniz varsa
- Azure'un sunduğu bölgesel veri yerleşimi veya uyumluluk denetimlerine ihtiyacınız varsa
- Trafiği mevcut bir Azure kiracısı içinde tutmak istiyorsanız

### Yapılandırma

Paketle gelen `openai` sağlayıcısı üzerinden Azure görüntü üretimi için
`models.providers.openai.baseUrl` değerini Azure kaynağınıza yönlendirin ve `apiKey` değerini
Azure OpenAI anahtarına (OpenAI Platform anahtarına değil) ayarlayın:

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw, Azure görüntü üretimi rotası için şu Azure ana bilgisayar
son eklerini tanır:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Tanınan bir Azure ana bilgisayarındaki görüntü üretimi istekleri için OpenClaw:

- `Authorization: Bearer` yerine `api-key` üstbilgisini gönderir
- Dağıtım kapsamlı yolları kullanır (`/openai/deployments/{deployment}/...`)
- Her isteğe `?api-version=...` ekler
- Azure görüntü üretimi çağrıları için varsayılan 600 sn istek zaman aşımı kullanır.
  Çağrı başına `timeoutMs` değerleri bu varsayılanı geçersiz kılmaya devam eder.

Diğer temel URL'ler (genel OpenAI, OpenAI uyumlu proxy'ler) standart
OpenAI görüntü isteği biçimini korur.

<Note>
`openai` sağlayıcısının görüntü üretimi yolunda Azure yönlendirmesi için
OpenClaw 2026.4.22 veya üzeri gerekir. Önceki sürümler herhangi bir özel
`openai.baseUrl` değerini genel OpenAI uç noktası gibi ele alır ve Azure görüntü
dağıtımlarında başarısız olur.
</Note>

### API sürümü

Azure görüntü üretimi yolu için belirli bir Azure önizleme veya GA sürümünü
sabitlemek üzere `AZURE_OPENAI_API_VERSION` değerini ayarlayın:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Değişken ayarlanmamışsa varsayılan değer `2024-12-01-preview` olur.

### Model adları dağıtım adlarıdır

Azure OpenAI, modelleri dağıtımlara bağlar. Paketle gelen `openai` sağlayıcısı
üzerinden yönlendirilen Azure görüntü üretimi isteklerinde OpenClaw'daki `model`
alanı, genel OpenAI model kimliği değil, Azure portalında yapılandırdığınız
**Azure dağıtım adı** olmalıdır.

`gpt-image-2` sunan `gpt-image-2-prod` adlı bir dağıtım oluşturursanız:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Temiz bir poster" size=1024x1024 count=1
```

Aynı dağıtım adı kuralı, paketle gelen `openai` sağlayıcısı üzerinden
yönlendirilen tüm görüntü üretimi çağrıları için geçerlidir.

### Bölgesel kullanılabilirlik

Azure görüntü üretimi şu anda yalnızca belirli bölgelerin bir alt kümesinde
kullanılabilir (örneğin `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Bir dağıtım oluşturmadan önce Microsoft'un güncel bölge listesini
kontrol edin ve ilgili modelin bölgenizde sunulduğunu doğrulayın.

### Parametre farklılıkları

Azure OpenAI ve genel OpenAI her zaman aynı görüntü parametrelerini kabul etmez.
Azure, genel OpenAI'ın izin verdiği seçenekleri (örneğin `gpt-image-2` üzerindeki belirli
`background` değerlerini) reddedebilir veya bunları yalnızca belirli model
sürümlerinde sunabilir. Bu farklılıklar OpenClaw'dan değil, Azure'dan ve temel
modelden kaynaklanır. Bir Azure isteği doğrulama hatasıyla başarısız olursa
Azure portalında belirli dağıtımınızın ve API sürümünüzün desteklediği
parametre kümesini kontrol edin.

<Note>
Azure OpenAI, yerel aktarımı ve uyumluluk davranışını kullanır ancak
OpenClaw'ın gizli ilişkilendirme üstbilgilerini almaz — [Gelişmiş yapılandırma](#advanced-configuration)
altındaki **Yerel ve OpenAI uyumlu
rotalar** akordeonuna bakın.

Azure üzerindeki sohbet veya Responses trafiği için (görüntü üretiminin ötesinde)
başlangıç akışını veya özel bir Azure sağlayıcı yapılandırmasını kullanın; yalnızca
`openai.baseUrl` Azure API/kimlik doğrulama biçimini kullanmaz. Ayrı bir
`azure-openai-responses/*` sağlayıcısı bulunur; aşağıdaki Sunucu taraflı Compaction
akordeonuna bakın.
</Note>

## Gelişmiş yapılandırma

Aşağıdaki model başına `params` örnekleri, OpenClaw'ın gömülü sağlayıcı
isteğini biçimlendirir. Bunların yapılandırılması, açıkça tanımlanmış istek davranışıdır; bu nedenle normalde uygun
bir `auto` rotası, Codex'i örtük olarak seçmek yerine OpenClaw üzerinde kalır. Yerel
Codex app-server düzeneği kendi aktarımına ve istek ayarlarına sahiptir; geçerli
rota Codex uyumlu olarak bildirilmemişse açık `agentRuntime.id: "codex"` kapalı kalarak başarısız olur.

<AccordionGroup>
  <Accordion title="Aktarım (WebSocket ve SSE)">
    OpenClaw, `openai/*` için SSE yedekli WebSocket önceliğini (`"auto"`) kullanır.

    `"auto"` modunda OpenClaw:
    - SSE'ye geçmeden önce erken bir WebSocket hatasını bir kez yeniden dener
    - Bir hatadan sonra WebSocket'i 60 saniye boyunca bozulmuş olarak işaretler ve
      bekleme süresince SSE kullanır
    - Yeniden denemeler ve yeniden bağlantılar için kararlı oturum ve tur kimliği
      üstbilgileri ekler
    - Aktarım çeşitleri arasında kullanım sayaçlarını (`input_tokens` / `prompt_tokens`)
      normalleştirir

    | Değer                | Davranış                          |
    | ---------------------- | ------------------------------------ |
    | `"auto"` (varsayılan)   | Önce WebSocket, SSE yedeği     |
    | `"sse"`              | Yalnızca SSE'yi zorla                    |
    | `"websocket"`        | Yalnızca WebSocket'i zorla              |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    İlgili OpenAI belgeleri:
    - [WebSocket ile Realtime API](https://platform.openai.com/docs/guides/realtime-websocket)
    - [API yanıtlarını akışla aktarma (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Hızlı mod">
    OpenClaw, `openai/*` için ortak bir hızlı mod anahtarı sunar:

    - **Sohbet/UI:** `/fast status|auto|on|off`
    - **Yapılandırma:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Etkinleştirildiğinde OpenClaw, hızlı modu OpenAI öncelikli işlemeye
    (`service_tier = "priority"`) eşler. Mevcut `service_tier` değerleri
    korunur ve hızlı mod `reasoning` veya
    `text.verbosity` değerini yeniden yazmaz. `fastMode: "auto"`, otomatik kesme noktasına kadar yeni model
    çağrılarını hızlı başlatır; ardından sonraki yeniden deneme, yedek, araç sonucu veya
    devam çağrılarını hızlı mod olmadan başlatır. Kesme noktası varsayılan olarak 60 saniyedir;
    değiştirmek için etkin modelde `params.fastAutoOnSeconds` değerini ayarlayın.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: "auto", fastAutoOnSeconds: 30 } },
          },
        },
      },
    }
    ```

    <Note>
    Oturum geçersiz kılmaları yapılandırmaya göre önceliklidir. Sessions UI içinde oturum
    geçersiz kılmasını temizlemek, oturumu yapılandırılmış varsayılana döndürür.
    </Note>

  </Accordion>

  <Accordion title="Öncelikli işleme (service_tier)">
    OpenAI API'si, `service_tier` üzerinden öncelikli işleme sunar. Bunu OpenClaw'da
    model başına ayarlayın:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Desteklenen değerler: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` yalnızca yerel OpenAI uç noktalarına
    (`api.openai.com`) ve yerel Codex uç noktalarına (`chatgpt.com/backend-api`)
    iletilir. Herhangi bir sağlayıcıyı bir proxy üzerinden yönlendirirseniz OpenClaw,
    `service_tier` değerini değiştirmeden bırakır.
    </Warning>

  </Accordion>

  <Accordion title="Sunucu taraflı Compaction (Responses API)">
    Doğrudan OpenAI Responses modelleri (`api.openai.com` üzerindeki `openai/*`) için
    OpenAI Plugin'inin OpenClaw akış sarmalayıcısı, sunucu taraflı
    Compaction'ı otomatik olarak etkinleştirir:

    - `store: true` değerini zorlar (model uyumluluğu `supportsStore: false` ayarlamadıkça)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` ekler
    - Varsayılan `compact_threshold`: `contextWindow` değerinin %70'i (veya kullanılamadığında
      `80000`)

    Bu, yerleşik OpenClaw çalışma zamanı yoluna ve gömülü çalıştırmaların kullandığı OpenAI sağlayıcı
    kancalarına uygulanır. Yerel Codex app-server düzeneği kendi bağlamını
    Codex üzerinden yönetir ve bu ayardan etkilenmez.

    <Tabs>
      <Tab title="Açıkça etkinleştir">
        Azure OpenAI Responses gibi uyumlu uç noktalar için kullanışlıdır:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Özel eşik">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Devre dışı bırak">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` yalnızca `context_management` eklenmesini denetler.
    Doğrudan OpenAI Responses modelleri, uyumluluk `supportsStore: false` ayarlamadıkça
    `store: true` değerini zorlamaya devam eder.
    </Note>

  </Accordion>

  <Accordion title="Katı ajan tabanlı GPT modu">
    OpenClaw'ın gömülü çalışma zamanı üzerinden çalıştırılan `openai` sağlayıcısının
    GPT-5 ailesi modelleri için OpenClaw zaten `strict-agentic` adlı daha katı bir yürütme
    sözleşmesini varsayılan olarak kullanır. Yapılandırma açıkça devre dışı bırakmadığı sürece,
    çözümlenen sağlayıcı `openai` olduğunda ve model kimliği GPT-5 ailesiyle eşleştiğinde
    otomatik olarak etkinleşir:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "default" },
        },
      },
    }
    ```

    `"strict-agentic"` değerini açıkça ayarlamak, desteklenen bir hatta hiçbir
    işlem yapmaz (zaten varsayılan değerdir) ve desteklenmeyen sağlayıcı/model çiftlerinde etkisizdir.

    `strict-agentic` etkinken OpenClaw:
    - Kapsamlı çalışmalar için `update_plan` özelliğini otomatik olarak etkinleştirir
    - Yapısal olarak boş veya yalnızca akıl yürütme içeren dönüşleri, görünür yanıt
      devamıyla yeniden dener
    - Seçilen düzenek bunları sağladığında açık düzenek planı olaylarını
      kullanır

    OpenClaw, bir dönüşün plan, ilerleme güncellemesi veya nihai yanıt olup
    olmadığına karar vermek için asistan metnini sınıflandırmaz.

    <Note>
    Bu sözleşme tamamen OpenClaw'ın gömülü aracı çalıştırıcısında bulunur.
    Kendi dönüş ve plan davranışını yöneten yerel Codex uygulama sunucusu
    düzeneği için geçerli değildir; yerel Codex çalıştırmalarında düzenek seçimi,
    yürütme sözleşmesi ayarından daha önemlidir.
    </Note>

  </Accordion>

  <Accordion title="Yerel ve OpenAI uyumlu rotalar">
    OpenClaw; doğrudan OpenAI, Codex ve Azure OpenAI uç noktalarını genel
    OpenAI uyumlu `/v1` proxy'lerinden farklı şekilde ele alır:

    **Yerel rotalar** (`openai/*`, Azure OpenAI):
    - `reasoning: { effort: "none" }` değerini yalnızca OpenAI `none`
      çabasını destekleyen modeller için korur
    - `reasoning.effort: "none"` değerini reddeden modeller veya proxy'ler için
      devre dışı bırakılmış akıl yürütmeyi çıkarır
    - Araç şemalarını varsayılan olarak katı moda ayarlar
    - Gizli atıf üstbilgilerini yalnızca doğrulanmış yerel ana makinelere ekler (Azure
      OpenAI, yerel bir rota olmasına rağmen bu üstbilgileri almaz)
    - Yalnızca OpenAI'a özgü istek şekillendirmesini korur (`service_tier`, `store`,
      akıl yürütme uyumluluğu, istem önbelleği ipuçları)

    **Proxy/uyumlu rotalar:**
    - Daha esnek uyumluluk davranışı kullanır
    - Yerel olmayan `openai-completions` yüklerinden Completions `store` değerini çıkarır
    - OpenAI uyumlu Completions proxy'leri için gelişmiş `params.extra_body`/`params.extraBody`
      doğrudan geçişli JSON'u kabul eder
    - vLLM gibi OpenAI uyumlu Completions proxy'leri için
      `params.chat_template_kwargs` değerini kabul eder
    - Katı araç şemalarını veya yalnızca yerel rotalara özgü üstbilgileri zorunlu kılmaz

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Görsel oluşturma" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görsel aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video oluşturma" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="OAuth ve kimlik doğrulama" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgilerini yeniden kullanma kuralları.
  </Card>
</CardGroup>

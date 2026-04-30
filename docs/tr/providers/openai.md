---
read_when:
    - OpenAI modellerini OpenClaw'da kullanmak istiyorsunuz
    - API anahtarları yerine Codex abonelik kimlik doğrulamasını istiyorsunuz
    - Daha sıkı GPT-5 ajan yürütme davranışına ihtiyacınız var
summary: OpenClaw'da OpenAI'yi API anahtarları veya Codex aboneliği aracılığıyla kullanın
title: OpenAI
x-i18n:
    generated_at: "2026-04-30T16:29:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e113f2418f82a8859f208f85efb55114bda7bc17beeb28f012b19e861609dad
    source_path: providers/openai.md
    workflow: 16
---

OpenAI, GPT modelleri için geliştirici API'leri sağlar ve Codex, OpenAI'nin Codex istemcileri üzerinden ChatGPT planı kapsamında bir kodlama ajanı olarak da kullanılabilir. OpenClaw, yapılandırmanın öngörülebilir kalması için bu yüzeyleri ayrı tutar.

OpenClaw, OpenAI ailesinden üç rotayı destekler. Model öneki sağlayıcı/kimlik doğrulama rotasını seçer; ayrı bir çalışma zamanı ayarı ise gömülü ajan döngüsünü kimin çalıştıracağını seçer:

- **API anahtarı** — kullanıma dayalı faturalandırmayla doğrudan OpenAI Platform erişimi (`openai/*` modelleri)
- **PI üzerinden Codex aboneliği** — abonelik erişimiyle ChatGPT/Codex oturum açma (`openai-codex/*` modelleri)
- **Codex uygulama sunucusu yürütme ortamı** — yerel Codex uygulama sunucusu yürütmesi (`openai/*` modelleri artı `agents.defaults.agentRuntime.id: "codex"`)

OpenAI, OpenClaw gibi dış araçlarda ve iş akışlarında abonelik OAuth kullanımını açıkça destekler.

Sağlayıcı, model, çalışma zamanı ve kanal ayrı katmanlardır. Bu etiketler birbirine karışıyorsa, yapılandırmayı değiştirmeden önce [Ajan çalışma zamanları](/tr/concepts/agent-runtimes) bölümünü okuyun.

## Hızlı seçim

| Hedef                                          | Kullanım                                              | Notlar                                                                        |
| --------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| Doğrudan API anahtarı faturalandırması                        | `openai/gpt-5.5`                                 | `OPENAI_API_KEY` ayarını yapın veya OpenAI API anahtarı ilk kurulumunu çalıştırın.                       |
| ChatGPT/Codex abonelik kimlik doğrulamasıyla GPT-5.5  | `openai-codex/gpt-5.5`                           | Codex OAuth için varsayılan PI rotası. Abonelik kurulumları için en iyi ilk seçim. |
| Yerel Codex uygulama sunucusu davranışıyla GPT-5.5 | `openai/gpt-5.5` artı `agentRuntime.id: "codex"` | Bu model ref'i için Codex uygulama sunucusu yürütme ortamını zorunlu kılar.                      |
| Görsel oluşturma veya düzenleme                   | `openai/gpt-image-2`                             | `OPENAI_API_KEY` veya OpenAI Codex OAuth ile çalışır.                    |
| Şeffaf arka planlı görseller                 | `openai/gpt-image-1.5`                           | `outputFormat=png` veya `webp` ve `openai.background=transparent` kullanın.        |

## Adlandırma haritası

Adlar benzerdir ancak birbirinin yerine kullanılamaz:

| Gördüğünüz ad                       | Katman             | Anlamı                                                                                           |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Sağlayıcı öneki   | Doğrudan OpenAI Platform API rotası.                                                                 |
| `openai-codex`                     | Sağlayıcı öneki   | Normal OpenClaw PI çalıştırıcısı üzerinden OpenAI Codex OAuth/abonelik rotası.                      |
| `codex` Plugin                     | Plugin            | Yerel Codex uygulama sunucusu çalışma zamanı ve `/codex` sohbet denetimleri sağlayan paketlenmiş OpenClaw Plugin'i. |
| `agentRuntime.id: codex`           | Ajan çalışma zamanı     | Gömülü turlar için yerel Codex uygulama sunucusu yürütme ortamını zorunlu kılar.                                     |
| `/codex ...`                       | Sohbet komut seti  | Bir konuşmadan Codex uygulama sunucusu iş parçacıklarını bağlayın/denetleyin.                                        |
| `runtime: "acp", agentId: "codex"` | ACP oturum rotası | Codex'i ACP/acpx üzerinden çalıştıran açık geri dönüş yolu.                                          |

Bu, bir yapılandırmanın bilinçli olarak hem `openai-codex/*` hem de `codex` Plugin'ini içerebileceği anlamına gelir. PI üzerinden Codex OAuth istediğinizde ve ayrıca yerel `/codex` sohbet denetimlerinin kullanılabilir olmasını istediğinizde bu geçerlidir. `openclaw doctor` bu kombinasyon hakkında uyarı verir, böylece bunun bilinçli olduğunu doğrulayabilirsiniz; onu yeniden yazmaz.

<Note>
GPT-5.5, hem doğrudan OpenAI Platform API anahtarı erişimi hem de abonelik/OAuth rotaları üzerinden kullanılabilir. Doğrudan `OPENAI_API_KEY` trafiği için `openai/gpt-5.5`, PI üzerinden Codex OAuth için `openai-codex/gpt-5.5` veya yerel Codex uygulama sunucusu yürütme ortamı için `agentRuntime.id: "codex"` ile `openai/gpt-5.5` kullanın.
</Note>

<Note>
OpenAI Plugin'ini etkinleştirmek veya bir `openai-codex/*` modeli seçmek, paketlenmiş Codex uygulama sunucusu Plugin'ini etkinleştirmez. OpenClaw bu Plugin'i yalnızca `agentRuntime.id: "codex"` ile yerel Codex yürütme ortamını açıkça seçtiğinizde veya eski bir `codex/*` model ref'i kullandığınızda etkinleştirir.
Paketlenmiş `codex` Plugin'i etkinse ancak `openai-codex/*` hâlâ PI üzerinden çözümleniyorsa, `openclaw doctor` uyarır ve rotayı değiştirmeden bırakır.
</Note>

## OpenClaw özellik kapsamı

| OpenAI yeteneği         | OpenClaw yüzeyi                                           | Durum                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Sohbet / Yanıtlar          | `openai/<model>` model sağlayıcısı                            | Evet                                                    |
| Codex abonelik modelleri | `openai-codex/<model>` ile `openai-codex` OAuth           | Evet                                                    |
| Codex uygulama sunucusu yürütme ortamı  | `openai/<model>` ile `agentRuntime.id: codex`             | Evet                                                    |
| Sunucu tarafı web araması    | Yerel OpenAI Responses aracı                               | Evet, web araması etkin olduğunda ve hiçbir sağlayıcı sabitlenmediğinde |
| Görseller                    | `image_generate`                                           | Evet                                                    |
| Videolar                    | `video_generate`                                           | Evet                                                    |
| Metinden konuşmaya            | `messages.tts.provider: "openai"` / `tts`                  | Evet                                                    |
| Toplu konuşmadan metne      | `tools.media.audio` / medya anlama                  | Evet                                                    |
| Akışlı konuşmadan metne  | Sesli Arama `streaming.provider: "openai"`                  | Evet                                                    |
| Gerçek zamanlı ses            | Sesli Arama `realtime.provider: "openai"` / Control UI Konuşma | Evet                                                    |
| Embedding'ler                | bellek embedding sağlayıcısı                                  | Evet                                                    |

## Bellek embedding'leri

OpenClaw, `memory_search` dizinleme ve sorgu embedding'leri için OpenAI'yi veya OpenAI uyumlu bir embedding uç noktasını kullanabilir:

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

Asimetrik embedding etiketleri gerektiren OpenAI uyumlu uç noktalar için `memorySearch` altında `queryInputType` ve `documentInputType` ayarlarını yapın. OpenClaw bunları sağlayıcıya özgü `input_type` istek alanları olarak iletir: sorgu embedding'leri `queryInputType` kullanır; dizinlenen bellek parçaları ve toplu dizinleme `documentInputType` kullanır. Tam örnek için [Bellek yapılandırması referansı](/tr/reference/memory-config#provider-specific-config) bölümüne bakın.

## Başlarken

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="API anahtarı (OpenAI Platform)">
    **En uygun olduğu kullanım:** doğrudan API erişimi ve kullanıma dayalı faturalandırma.

    <Steps>
      <Step title="API anahtarınızı alın">
        [OpenAI Platform dashboard](https://platform.openai.com/api-keys) üzerinden bir API anahtarı oluşturun veya kopyalayın.
      </Step>
      <Step title="İlk kurulumu çalıştırın">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Veya anahtarı doğrudan iletin:

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

    | Model ref              | Çalışma zamanı yapılandırması             | Rota                       | Kimlik doğrulama             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | atlanmış / `agentRuntime.id: "pi"`    | Doğrudan OpenAI Platform API  | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | atlanmış / `agentRuntime.id: "pi"`    | Doğrudan OpenAI Platform API  | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Codex uygulama sunucusu yürütme ortamı    | Codex uygulama sunucusu |

    <Note>
    `openai/*`, Codex uygulama sunucusu yürütme ortamını açıkça zorunlu kılmadığınız sürece doğrudan OpenAI API anahtarı rotasıdır. Varsayılan PI çalıştırıcısı üzerinden Codex OAuth için `openai-codex/*` kullanın veya yerel Codex uygulama sunucusu yürütmesi için `agentRuntime.id: "codex"` ile `openai/gpt-5.5` kullanın.
    </Note>

    ### Yapılandırma örneği

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw, `openai/gpt-5.3-codex-spark` modelini **sunmaz**. Canlı OpenAI API istekleri bu modeli reddeder ve mevcut Codex kataloğu da bunu sunmaz.
    </Warning>

  </Tab>

  <Tab title="Codex aboneliği">
    **En uygun olduğu kullanım:** ayrı bir API anahtarı yerine ChatGPT/Codex aboneliğinizi kullanmak. Codex bulutu ChatGPT oturumu gerektirir.

    <Steps>
      <Step title="Codex OAuth'u çalıştırın">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Veya OAuth'u doğrudan çalıştırın:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Headless veya callback açısından elverişsiz kurulumlar için, localhost tarayıcı callback'i yerine ChatGPT cihaz kodu akışıyla oturum açmak üzere `--device-code` ekleyin:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Varsayılan modeli ayarlayın">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Rota özeti

    | Model ref | Çalışma zamanı yapılandırması | Rota | Kimlik doğrulama |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | atlanmış / `runtime: "pi"` | PI üzerinden ChatGPT/Codex OAuth | Codex oturumu |
    | `openai-codex/gpt-5.4-mini` | atlanmış / `runtime: "pi"` | PI üzerinden ChatGPT/Codex OAuth | Codex oturumu |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Bir Plugin açıkça `openai-codex` üzerinde hak iddia etmedikçe hâlâ PI | Codex oturumu |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Codex uygulama sunucusu yürütme ortamı | Codex uygulama sunucusu kimlik doğrulaması |

    <Note>
    Kimlik doğrulama/profil komutları için `openai-codex` sağlayıcı kimliğini kullanmaya devam edin. `openai-codex/*` model öneki ayrıca Codex OAuth için açık PI rotasıdır. Paketlenmiş Codex uygulama sunucusu yürütme ortamını seçmez veya otomatik etkinleştirmez.
    </Note>

    ### Yapılandırma örneği

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    İlk kurulum artık `~/.codex` konumundan OAuth materyali içe aktarmaz. Tarayıcı OAuth'u (varsayılan) veya yukarıdaki cihaz kodu akışıyla oturum açın — OpenClaw ortaya çıkan kimlik bilgilerini kendi ajan kimlik doğrulama deposunda yönetir.
    </Note>

    ### Durum göstergesi

    Chat `/status`, geçerli oturum için hangi model çalışma zamanının etkin olduğunu gösterir.
    Varsayılan PI harness’ı `Runtime: OpenClaw Pi Default` olarak görünür. Paketle gelen Codex app-server harness’ı seçildiğinde, `/status`
    `Runtime: OpenAI Codex` gösterir. Mevcut oturumlar kaydedilmiş harness kimliklerini korur; bu yüzden `agentRuntime` değiştirildikten sonra `/status` çıktısının yeni bir PI/Codex seçimini yansıtmasını istiyorsanız
    `/new` veya `/reset` kullanın.

    ### Doctor uyarısı

    Paketle gelen `codex` Plugin etkinleştirilmişken bu sekmenin
    `openai-codex/*` rotası seçiliyse, `openclaw doctor` modelin hâlâ PI üzerinden çözümlendiğine dair uyarı verir. Amaçlanan abonelik kimlik doğrulaması rotası buysa yapılandırmayı değiştirmeyin. Yerel Codex
    app-server yürütmesi istediğinizde yalnızca `openai/<model>` ile birlikte
    `agentRuntime.id: "codex"` ayarına geçin.

    ### Bağlam penceresi sınırı

    OpenClaw, model meta verilerini ve çalışma zamanı bağlam sınırını ayrı değerler olarak ele alır.

    Codex OAuth üzerinden `openai-codex/gpt-5.5` için:

    - Yerel `contextWindow`: `1000000`
    - Varsayılan çalışma zamanı `contextTokens` sınırı: `272000`

    Daha küçük varsayılan sınır, pratikte daha iyi gecikme ve kalite özelliklerine sahiptir. Bunu `contextTokens` ile geçersiz kılın:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Yerel model meta verilerini bildirmek için `contextWindow` kullanın. Çalışma zamanı bağlam bütçesini sınırlamak için `contextTokens` kullanın.
    </Note>

    ### Catalog kurtarma

    OpenClaw, mevcut olduğunda `gpt-5.5` için üst kaynak Codex catalog meta verilerini kullanır. Canlı Codex keşfi, hesap kimliği doğrulanmışken
    `openai-codex/gpt-5.5` satırını atlıyorsa, OpenClaw bu OAuth model satırını sentezler; böylece cron, alt aracı ve yapılandırılmış varsayılan model çalıştırmaları
    `Unknown model` hatasıyla başarısız olmaz.

  </Tab>
</Tabs>

## Yerel Codex app-server kimlik doğrulaması

Yerel Codex app-server harness’ı `openai/*` model başvurularını ve
`agentRuntime.id: "codex"` kullanır, ancak kimlik doğrulaması yine hesap tabanlıdır. OpenClaw kimlik doğrulamayı şu sırayla seçer:

1. Aracıya bağlanmış açık bir OpenClaw `openai-codex` kimlik doğrulama profili.
2. app-server’ın mevcut hesabı; örneğin yerel bir Codex CLI ChatGPT oturumu.
3. Yalnızca yerel stdio app-server başlatmaları için, app-server hesap olmadığını bildirip yine de OpenAI kimlik doğrulaması gerektirdiğinde
   `CODEX_API_KEY`, ardından `OPENAI_API_KEY`.

Bu, ağ geçidi işleminde doğrudan OpenAI modelleri veya embeddings için
`OPENAI_API_KEY` bulunmasının yerel bir ChatGPT/Codex abonelik oturumunun yerini alacağı anlamına gelmez. Ortam API anahtarı geri dönüşü yalnızca yerel stdio hesapsız yoldur; WebSocket app-server bağlantılarına gönderilmez. Abonelik tarzı bir Codex profili seçildiğinde, OpenClaw ayrıca `CODEX_API_KEY` ve `OPENAI_API_KEY` değerlerini oluşturulan stdio app-server alt işleminden uzak tutar ve seçilen kimlik bilgilerini app-server login RPC üzerinden gönderir.

## Görsel üretimi

Paketle gelen `openai` Plugin, görsel üretimini `image_generate` aracı üzerinden kaydeder.
Aynı `openai/gpt-image-2` model başvurusu üzerinden hem OpenAI API anahtarıyla görsel üretimini hem de Codex OAuth görsel üretimini destekler.

| Yetenek                   | OpenAI API anahtarı                | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Model başvurusu           | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Kimlik doğrulaması        | `OPENAI_API_KEY`                   | OpenAI Codex OAuth oturumu           |
| Taşıma                    | OpenAI Images API                  | Codex Responses arka ucu             |
| İstek başına en fazla görsel | 4                               | 4                                    |
| Düzenleme modu            | Etkin (5 referans görsele kadar)   | Etkin (5 referans görsele kadar)     |
| Boyut geçersiz kılmaları  | 2K/4K boyutları dahil desteklenir  | 2K/4K boyutları dahil desteklenir    |
| En-boy oranı / çözünürlük | OpenAI Images API’ye iletilmez     | Güvenli olduğunda desteklenen bir boyuta eşlenir |

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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Görsel Üretimi](/tr/tools/image-generation) sayfasına bakın.
</Note>

`gpt-image-2`, hem OpenAI metinden görsel üretimi hem de görsel düzenleme için varsayılandır. `gpt-image-1.5`, `gpt-image-1` ve `gpt-image-1-mini` açık model geçersiz kılmaları olarak kullanılabilir olmaya devam eder. Şeffaf arka planlı PNG/WebP çıktısı için `openai/gpt-image-1.5` kullanın; mevcut `gpt-image-2` API’si
`background: "transparent"` değerini reddeder.

Şeffaf arka plan isteği için aracılar `image_generate` aracını
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` veya `"webp"` ve
`background: "transparent"` ile çağırmalıdır; eski `openai.background` sağlayıcı seçeneği hâlâ kabul edilir. OpenClaw ayrıca varsayılan `openai/gpt-image-2` şeffaf isteklerini `gpt-image-1.5` olarak yeniden yazarak genel OpenAI ve
OpenAI Codex OAuth rotalarını korur; Azure ve özel OpenAI uyumlu uç noktalar yapılandırılmış deployment/model adlarını korur.

Aynı ayar headless CLI çalıştırmaları için de sunulur:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Bir giriş dosyasından başlarken aynı `--output-format` ve `--background` bayraklarını
`openclaw infer image edit` ile kullanın.
`--openai-background`, OpenAI’ye özel bir takma ad olarak kullanılabilir kalır.

Codex OAuth kurulumları için aynı `openai/gpt-image-2` başvurusunu koruyun. Bir
`openai-codex` OAuth profili yapılandırıldığında, OpenClaw depolanan OAuth erişim token’ını çözümler ve görsel isteklerini Codex Responses arka ucu üzerinden gönderir. Bu istek için önce `OPENAI_API_KEY` denemez veya sessizce bir API anahtarına geri dönülmez. Bunun yerine doğrudan OpenAI Images API
rotasını istediğinizde `models.providers.openai` öğesini bir API anahtarı, özel temel URL veya Azure uç noktasıyla açıkça yapılandırın.
Bu özel görsel uç noktası güvenilir bir LAN/özel adresteyse, ayrıca
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ayarını yapın; OpenClaw bu tercih mevcut olmadığı sürece özel/dahili OpenAI uyumlu görsel uç noktalarını engelli tutar.

Üret:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Şeffaf bir PNG üret:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Düzenle:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Video üretimi

Paketle gelen `openai` Plugin, video üretimini `video_generate` aracı üzerinden kaydeder.

| Yetenek             | Değer                                                                             |
| ------------------- | --------------------------------------------------------------------------------- |
| Varsayılan model    | `openai/sora-2`                                                                   |
| Modlar              | Metinden videoya, görselden videoya, tek video düzenleme                          |
| Referans girdileri  | 1 görsel veya 1 video                                                             |
| Boyut geçersiz kılmaları | Desteklenir                                                                  |
| Diğer geçersiz kılmalar | `aspectRatio`, `resolution`, `audio`, `watermark` bir araç uyarısıyla yok sayılır |

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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Video Üretimi](/tr/tools/video-generation) sayfasına bakın.
</Note>

## GPT-5 prompt katkısı

OpenClaw, sağlayıcılar genelinde GPT-5 ailesi çalıştırmaları için paylaşılan bir GPT-5 prompt katkısı ekler. Model kimliğine göre uygulanır; bu nedenle `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` ve diğer uyumlu GPT-5 başvuruları aynı katmanı alır. Daha eski GPT-4.x modelleri almaz.

Paketle gelen yerel Codex harness’ı, Codex app-server geliştirici talimatları üzerinden aynı GPT-5 davranışını ve Heartbeat katmanını kullanır; bu yüzden `agentRuntime.id: "codex"` üzerinden zorlanan `openai/gpt-5.x` oturumları, harness prompt’unun geri kalanına Codex sahip olsa bile aynı takip ve proaktif Heartbeat rehberliğini korur.

GPT-5 katkısı; persona kalıcılığı, yürütme güvenliği, araç disiplini, çıktı biçimi, tamamlama kontrolleri ve doğrulama için etiketli bir davranış sözleşmesi ekler. Kanala özel yanıt ve sessiz mesaj davranışı, paylaşılan OpenClaw sistem prompt’unda ve giden teslim politikasında kalır. GPT-5 rehberliği, eşleşen modeller için her zaman etkindir. Dostane etkileşim stili katmanı ayrıdır ve yapılandırılabilir.

| Değer                  | Etki                                      |
| ---------------------- | ----------------------------------------- |
| `"friendly"` (varsayılan) | Dostane etkileşim stili katmanını etkinleştir |
| `"on"`                 | `"friendly"` için takma ad                |
| `"off"`                | Yalnızca dostane stil katmanını devre dışı bırak |

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
Değerler çalışma zamanında büyük/küçük harfe duyarsızdır; bu nedenle `"Off"` ve `"off"` değerlerinin ikisi de dostane stil katmanını devre dışı bırakır.
</Tip>

<Note>
Eski `plugins.entries.openai.config.personality`, paylaşılan `agents.defaults.promptOverlays.gpt5.personality` ayarı belirlenmediğinde uyumluluk geri dönüşü olarak hâlâ okunur.
</Note>

## Ses ve konuşma

<AccordionGroup>
  <Accordion title="Konuşma sentezi (TTS)">
    Paketle gelen `openai` Plugin, `messages.tts` yüzeyi için konuşma sentezini kaydeder.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Ses | `messages.tts.providers.openai.voice` | `coral` |
    | Hız | `messages.tts.providers.openai.speed` | (ayarlanmamış) |
    | Talimatlar | `messages.tts.providers.openai.instructions` | (ayarlanmamış, yalnızca `gpt-4o-mini-tts`) |
    | Biçim | `messages.tts.providers.openai.responseFormat` | sesli notlar için `opus`, dosyalar için `mp3` |
    | API anahtarı | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY` değerine geri döner |
    | Temel URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Kullanılabilir modeller: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Kullanılabilir sesler: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Sohbet API uç noktasını etkilemeden TTS temel URL’sini geçersiz kılmak için `OPENAI_TTS_BASE_URL` ayarını yapın.
    </Note>

  </Accordion>

  <Accordion title="Konuşmadan metne">
    Paketle gelen `openai` Plugin, OpenClaw’ın medya anlama transkripsiyon yüzeyi üzerinden toplu konuşmadan metne dönüştürmeyi kaydeder.

    - Varsayılan model: `gpt-4o-transcribe`
    - Uç nokta: OpenAI REST `/v1/audio/transcriptions`
    - Giriş yolu: multipart ses dosyası yükleme
    - Discord ses kanalı segmentleri ve kanal ses ekleri dahil olmak üzere gelen ses transkripsiyonunun
      `tools.media.audio` kullandığı her yerde OpenClaw tarafından desteklenir

    Gelen ses transkripsiyonu için OpenAI'ı zorunlu kılmak üzere:

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

    Dil ve istem ipuçları, paylaşılan ses medya yapılandırması veya çağrı başına transkripsiyon isteği tarafından sağlandığında OpenAI'a iletilir.

  </Accordion>

  <Accordion title="Gerçek zamanlı transkripsiyon">
    Birlikte gelen `openai` Plugin'i, Voice Call Plugin'i için gerçek zamanlı transkripsiyonu kaydeder.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Dil | `...openai.language` | (ayarlanmamış) |
    | İstem | `...openai.prompt` | (ayarlanmamış) |
    | Sessizlik süresi | `...openai.silenceDurationMs` | `800` |
    | VAD eşiği | `...openai.vadThreshold` | `0.5` |
    | API anahtarı | `...openai.apiKey` | `OPENAI_API_KEY` değerine geri döner |

    <Note>
    G.711 u-law (`g711_ulaw` / `audio/pcmu`) ses ile `wss://api.openai.com/v1/realtime` adresine WebSocket bağlantısı kullanır. Bu akış sağlayıcısı, Voice Call'ın gerçek zamanlı transkripsiyon yolu içindir; Discord ses özelliği şu anda kısa segmentler kaydeder ve bunun yerine toplu `tools.media.audio` transkripsiyon yolunu kullanır.
    </Note>

  </Accordion>

  <Accordion title="Gerçek zamanlı ses">
    Birlikte gelen `openai` Plugin'i, Voice Call Plugin'i için gerçek zamanlı sesi kaydeder.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Ses | `...openai.voice` | `alloy` |
    | Sıcaklık | `...openai.temperature` | `0.8` |
    | VAD eşiği | `...openai.vadThreshold` | `0.5` |
    | Sessizlik süresi | `...openai.silenceDurationMs` | `500` |
    | API anahtarı | `...openai.apiKey` | `OPENAI_API_KEY` değerine geri döner |

    <Note>
    Arka uç gerçek zamanlı köprüleri için `azureEndpoint` ve `azureDeployment` yapılandırma anahtarları üzerinden Azure OpenAI'ı destekler. Çift yönlü araç çağrısını destekler. G.711 u-law ses biçimini kullanır.
    </Note>

    <Note>
    Control UI Talk, Gateway tarafından oluşturulmuş geçici bir istemci sırrı ve OpenAI Realtime API'ye doğrudan tarayıcı WebRTC SDP değişimi ile OpenAI tarayıcı gerçek zamanlı oturumlarını kullanır. Maintainer canlı doğrulaması `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` ile kullanılabilir; OpenAI bacağı Node içinde bir istemci sırrı oluşturur, sahte mikrofon medyasıyla bir tarayıcı SDP teklifi üretir, bunu OpenAI'a gönderir ve sırları günlüğe yazmadan SDP yanıtını uygular.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI uç noktaları

Birlikte gelen `openai` sağlayıcısı, temel URL geçersiz kılınarak görüntü üretimi için bir Azure OpenAI kaynağını hedefleyebilir. Görüntü üretimi yolunda OpenClaw, `models.providers.openai.baseUrl` üzerindeki Azure ana makine adlarını algılar ve otomatik olarak Azure'un istek biçimine geçer.

<Note>
Gerçek zamanlı ses ayrı bir yapılandırma yolu kullanır
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
ve `models.providers.openai.baseUrl` ayarından etkilenmez. Azure ayarları için [Ses ve konuşma](#voice-and-speech) altındaki **Gerçek zamanlı ses** akordiyonuna bakın.
</Note>

Azure OpenAI'ı şu durumlarda kullanın:

- Zaten bir Azure OpenAI aboneliğiniz, kotanız veya kurumsal anlaşmanız varsa
- Azure'un sunduğu bölgesel veri yerleşimi veya uyumluluk kontrollerine ihtiyacınız varsa
- Trafiği mevcut bir Azure kiracılığı içinde tutmak istiyorsanız

### Yapılandırma

Birlikte gelen `openai` sağlayıcısı üzerinden Azure görüntü üretimi için `models.providers.openai.baseUrl` değerini Azure kaynağınıza yönlendirin ve `apiKey` değerini Azure OpenAI anahtarı olarak ayarlayın (OpenAI Platform anahtarı değil):

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

OpenClaw, Azure görüntü üretimi rotası için şu Azure ana makine son eklerini tanır:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Tanınan bir Azure ana makinesindeki görüntü üretimi istekleri için OpenClaw:

- `Authorization: Bearer` yerine `api-key` üst bilgisini gönderir
- Dağıtım kapsamlı yolları kullanır (`/openai/deployments/{deployment}/...`)
- Her isteğe `?api-version=...` ekler
- Azure görüntü üretimi çağrıları için 600 sn varsayılan istek zaman aşımı kullanır.
  Çağrı başına `timeoutMs` değerleri bu varsayılanı yine de geçersiz kılar.

Diğer temel URL'ler (genel OpenAI, OpenAI uyumlu proxy'ler) standart OpenAI görüntü isteği biçimini korur.

<Note>
`openai` sağlayıcısının görüntü üretimi yolu için Azure yönlendirmesi OpenClaw 2026.4.22 veya daha yenisini gerektirir. Önceki sürümler, özel herhangi bir `openai.baseUrl` değerini genel OpenAI uç noktası gibi ele alır ve Azure görüntü dağıtımlarında başarısız olur.
</Note>

### API sürümü

Azure görüntü üretimi yolu için belirli bir Azure önizleme veya GA sürümünü sabitlemek üzere `AZURE_OPENAI_API_VERSION` değerini ayarlayın:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Değişken ayarlanmamışsa varsayılan `2024-12-01-preview` olur.

### Model adları dağıtım adlarıdır

Azure OpenAI, modelleri dağıtımlara bağlar. Birlikte gelen `openai` sağlayıcısı üzerinden yönlendirilen Azure görüntü üretimi istekleri için OpenClaw'daki `model` alanı, genel OpenAI model kimliği değil, Azure portalında yapılandırdığınız **Azure dağıtım adı** olmalıdır.

`gpt-image-2` sunan `gpt-image-2-prod` adlı bir dağıtım oluşturursanız:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Aynı dağıtım adı kuralı, birlikte gelen `openai` sağlayıcısı üzerinden yönlendirilen görüntü üretimi çağrıları için de geçerlidir.

### Bölgesel kullanılabilirlik

Azure görüntü üretimi şu anda yalnızca belirli bölgelerin bir alt kümesinde kullanılabilir (örneğin `eastus2`, `swedencentral`, `polandcentral`, `westus3`, `uaenorth`). Bir dağıtım oluşturmadan önce Microsoft'un güncel bölge listesini kontrol edin ve ilgili modelin bölgenizde sunulduğunu doğrulayın.

### Parametre farklılıkları

Azure OpenAI ve genel OpenAI her zaman aynı görüntü parametrelerini kabul etmez. Azure, genel OpenAI'ın izin verdiği seçenekleri reddedebilir (örneğin `gpt-image-2` üzerindeki belirli `background` değerleri) veya bunları yalnızca belirli model sürümlerinde sunabilir. Bu farklılıklar OpenClaw'dan değil, Azure'dan ve alttaki modelden kaynaklanır. Bir Azure isteği doğrulama hatasıyla başarısız olursa, Azure portalında ilgili dağıtımınız ve API sürümünüz tarafından desteklenen parametre kümesini kontrol edin.

<Note>
Azure OpenAI yerel taşıma ve uyumluluk davranışını kullanır, ancak OpenClaw'ın gizli atıf üst bilgilerini almaz — bkz. [Gelişmiş yapılandırma](#advanced-configuration) altındaki **Yerel ve OpenAI uyumlu rotalar** akordiyonu.

Azure üzerindeki sohbet veya Responses trafiği için (görüntü üretiminin ötesinde) onboarding akışını veya özel bir Azure sağlayıcı yapılandırmasını kullanın — tek başına `openai.baseUrl`, Azure API/kimlik doğrulama biçimini devreye almaz. Ayrı bir `azure-openai-responses/*` sağlayıcısı vardır; aşağıdaki Sunucu tarafı compaction akordiyonuna bakın.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Taşıma (WebSocket ve SSE)">
    OpenClaw, hem `openai/*` hem de `openai-codex/*` için SSE yedeğiyle (`"auto"`) WebSocket öncelikli kullanır.

    `"auto"` modunda OpenClaw:
    - SSE'ye geri dönmeden önce erken bir WebSocket hatasını bir kez yeniden dener
    - Bir hatadan sonra WebSocket'i ~60 saniye boyunca bozulmuş olarak işaretler ve soğuma sırasında SSE kullanır
    - Yeniden denemeler ve yeniden bağlantılar için kararlı oturum ve tur kimliği üst bilgileri ekler
    - Taşıma varyantları arasında kullanım sayaçlarını (`input_tokens` / `prompt_tokens`) normalleştirir

    | Değer | Davranış |
    |-------|----------|
    | `"auto"` (varsayılan) | Önce WebSocket, SSE yedeği |
    | `"sse"` | Yalnızca SSE'yi zorunlu kıl |
    | `"websocket"` | Yalnızca WebSocket'i zorunlu kıl |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    İlgili OpenAI belgeleri:
    - [WebSocket ile Realtime API](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API yanıtları (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket ısınması">
    OpenClaw, ilk tur gecikmesini azaltmak için `openai/*` ve `openai-codex/*` için WebSocket ısınmasını varsayılan olarak etkinleştirir.

    ```json5
    // Disable warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Hızlı mod">
    OpenClaw, `openai/*` ve `openai-codex/*` için paylaşılan bir hızlı mod anahtarı sunar:

    - **Sohbet/UI:** `/fast status|on|off`
    - **Yapılandırma:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Etkinleştirildiğinde OpenClaw, hızlı modu OpenAI öncelikli işlemeye (`service_tier = "priority"`) eşler. Mevcut `service_tier` değerleri korunur ve hızlı mod `reasoning` veya `text.verbosity` değerlerini yeniden yazmaz.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Oturum geçersiz kılmaları yapılandırmaya üstün gelir. Sessions UI içinde oturum geçersiz kılmasını temizlemek, oturumu yapılandırılmış varsayılana döndürür.
    </Note>

  </Accordion>

  <Accordion title="Öncelikli işleme (service_tier)">
    OpenAI API'si, `service_tier` üzerinden öncelikli işlemeyi sunar. OpenClaw'da model başına ayarlayın:

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
    `serviceTier` yalnızca yerel OpenAI uç noktalarına (`api.openai.com`) ve yerel Codex uç noktalarına (`chatgpt.com/backend-api`) iletilir. Herhangi bir sağlayıcıyı proxy üzerinden yönlendirirseniz OpenClaw, `service_tier` değerini değiştirmeden bırakır.
    </Warning>

  </Accordion>

  <Accordion title="Sunucu tarafı compaction (Responses API)">
    Doğrudan OpenAI Responses modelleri (`api.openai.com` üzerinde `openai/*`) için OpenAI Plugin'inin Pi-harness akış sarmalayıcısı, sunucu tarafı compaction özelliğini otomatik olarak etkinleştirir:

    - `store: true` değerini zorunlu kılar (model uyumluluğu `supportsStore: false` ayarlamadıkça)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` enjekte eder
    - Varsayılan `compact_threshold`: `contextWindow` değerinin %70'i (veya kullanılamadığında `80000`)

    Bu, yerleşik Pi harness yolu ve gömülü çalıştırmalar tarafından kullanılan OpenAI sağlayıcı hook'ları için geçerlidir. Yerel Codex uygulama sunucusu harness'i kendi bağlamını Codex üzerinden yönetir ve `agents.defaults.agentRuntime.id` ile ayrı olarak yapılandırılır.

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
    `responsesServerCompaction` yalnızca `context_management` eklemesini denetler. Doğrudan OpenAI Responses modelleri, compat `supportsStore: false` ayarlamadığı sürece yine de `store: true` değerini zorunlu kılar.
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT modu">
    `openai/*` üzerindeki GPT-5 ailesi çalıştırmalarında OpenClaw daha katı bir gömülü yürütme sözleşmesi kullanabilir:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    `strict-agentic` ile OpenClaw:
    - Bir araç eylemi kullanılabilir olduğunda, yalnızca plan içeren bir turu artık başarılı ilerleme olarak değerlendirmez
    - Turu hemen eyleme geç yönlendirmesiyle yeniden dener
    - Kapsamlı işler için `update_plan` özelliğini otomatik olarak etkinleştirir
    - Model eyleme geçmeden planlamaya devam ederse açık bir engellenmiş durum gösterir

    <Note>
    Yalnızca OpenAI ve Codex GPT-5 ailesi çalıştırmalarıyla sınırlıdır. Diğer sağlayıcılar ve eski model aileleri varsayılan davranışı korur.
    </Note>

  </Accordion>

  <Accordion title="Yerel ve OpenAI uyumlu rotalar">
    OpenClaw, doğrudan OpenAI, Codex ve Azure OpenAI uç noktalarını genel OpenAI uyumlu `/v1` proxy'lerinden farklı ele alır:

    **Yerel rotalar** (`openai/*`, Azure OpenAI):
    - Yalnızca OpenAI `none` çabasını destekleyen modeller için `reasoning: { effort: "none" }` değerini korur
    - `reasoning.effort: "none"` değerini reddeden modeller veya proxy'ler için devre dışı bırakılmış reasoning'i atlar
    - Araç şemalarını varsayılan olarak katı moda ayarlar
    - Yalnızca doğrulanmış yerel ana makinelerde gizli atıf üst bilgileri ekler
    - Yalnızca OpenAI'ye özgü istek şekillendirmesini korur (`service_tier`, `store`, reasoning uyumluluğu, prompt önbelleği ipuçları)

    **Proxy/uyumlu rotalar:**
    - Daha gevşek uyumluluk davranışı kullanır
    - Yerel olmayan `openai-completions` yüklerinden Completions `store` değerini çıkarır
    - OpenAI uyumlu Completions proxy'leri için gelişmiş `params.extra_body`/`params.extraBody` doğrudan geçiş JSON'unu kabul eder
    - vLLM gibi OpenAI uyumlu Completions proxy'leri için `params.chat_template_kwargs` değerini kabul eder
    - Katı araç şemalarını veya yalnızca yerel üst bilgileri zorunlu kılmaz

    Azure OpenAI yerel taşıma ve uyumluluk davranışı kullanır, ancak gizli atıf üst bilgilerini almaz.

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
    Kimlik doğrulama ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
</CardGroup>

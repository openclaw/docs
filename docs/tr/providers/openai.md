---
read_when:
    - OpenClaw'da OpenAI modellerini kullanmak istiyorsunuz
    - API anahtarları yerine Codex abonelik kimlik doğrulaması istiyorsunuz
    - Daha sıkı GPT-5 ajan yürütme davranışına ihtiyacınız var
summary: OpenClaw içinde API anahtarları veya Codex aboneliği aracılığıyla OpenAI kullanın
title: OpenAI
x-i18n:
    generated_at: "2026-05-03T09:01:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdffcdf53d9b17a19450c2ce47103db116e54a71a8dd432d981f5ece81cc38b3
    source_path: providers/openai.md
    workflow: 16
---

OpenAI, GPT modelleri için geliştirici API’leri sağlar ve Codex de OpenAI’ın Codex istemcileri üzerinden ChatGPT planına bağlı bir kodlama ajanı olarak kullanılabilir. OpenClaw, yapılandırmanın öngörülebilir kalması için bu yüzeyleri ayrı tutar.

OpenClaw üç OpenAI ailesi rotasını destekler. Codex davranışı isteyen çoğu ChatGPT/Codex abonesi yerel Codex uygulama sunucusu çalışma zamanını kullanmalıdır. Model öneki sağlayıcı/model adını seçer; ayrı bir çalışma zamanı ayarı ise gömülü ajan döngüsünü kimin yürüteceğini seçer:

- **API anahtarı** - kullanım tabanlı faturalandırmayla doğrudan OpenAI Platform erişimi (`openai/*` modelleri)
- **Yerel Codex çalışma zamanı ile Codex aboneliği** - ChatGPT/Codex oturumu açma ve Codex uygulama sunucusu yürütmesi (`openai/*` modelleri artı `agents.defaults.agentRuntime.id: "codex"`)
- **PI üzerinden Codex aboneliği** - normal OpenClaw PI çalıştırıcısı ile ChatGPT/Codex oturumu açma (`openai-codex/*` modelleri)

OpenAI, OpenClaw gibi harici araçlarda ve iş akışlarında abonelik OAuth kullanımını açıkça destekler.

Sağlayıcı, model, çalışma zamanı ve kanal ayrı katmanlardır. Bu etiketler birbirine karışıyorsa yapılandırmayı değiştirmeden önce [Ajan çalışma zamanları](/tr/concepts/agent-runtimes) sayfasını okuyun.

## Hızlı seçim

| Hedef                                                 | Kullanım                                          | Notlar                                                                    |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| Yerel Codex çalışma zamanı ile ChatGPT/Codex aboneliği | `openai/gpt-5.5` artı `agentRuntime.id: "codex"` | Çoğu kullanıcı için önerilen Codex kurulumu. `openai-codex` kimlik doğrulamasıyla oturum açın. |
| Doğrudan API anahtarı faturalandırması               | `openai/gpt-5.5`                                 | `OPENAI_API_KEY` ayarlayın veya OpenAI API anahtarı ilk kurulumunu çalıştırın. |
| PI üzerinden ChatGPT/Codex abonelik kimlik doğrulaması | `openai-codex/gpt-5.5`                           | Yalnızca özellikle normal PI çalıştırıcısını istediğinizde kullanın.      |
| Görüntü oluşturma veya düzenleme                     | `openai/gpt-image-2`                             | `OPENAI_API_KEY` veya OpenAI Codex OAuth ile çalışır.                    |
| Saydam arka planlı görüntüler                        | `openai/gpt-image-1.5`                           | `outputFormat=png` veya `webp` ve `openai.background=transparent` kullanın. |

## Adlandırma haritası

Adlar benzerdir ancak birbirinin yerine kullanılamaz:

| Gördüğünüz ad                      | Katman            | Anlamı                                                                                            |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Sağlayıcı öneki   | Doğrudan OpenAI Platform API rotası.                                                              |
| `openai-codex`                     | Sağlayıcı öneki   | Normal OpenClaw PI çalıştırıcısı üzerinden OpenAI Codex OAuth/abonelik rotası.                    |
| `codex` plugin                     | Plugin            | Yerel Codex uygulama sunucusu çalışma zamanı ve `/codex` sohbet denetimleri sağlayan paketlenmiş OpenClaw plugin’i. |
| `agentRuntime.id: codex`           | Ajan çalışma zamanı | Gömülü dönüşler için yerel Codex uygulama sunucusu koşumunu zorunlu kılar.                       |
| `/codex ...`                       | Sohbet komut kümesi | Bir konuşmadan Codex uygulama sunucusu iş parçacıklarını bağlar/denetler.                        |
| `runtime: "acp", agentId: "codex"` | ACP oturum rotası | Codex’i ACP/acpx üzerinden çalıştıran açık yedek yol.                                             |

Bu, bir yapılandırmanın bilinçli olarak hem `openai-codex/*` hem de `codex` plugin’ini içerebileceği anlamına gelir. PI üzerinden Codex OAuth istediğinizde ve yerel `/codex` sohbet denetimlerinin de kullanılabilir olmasını istediğinizde bu geçerlidir. `openclaw doctor` bu birleşim hakkında uyarır, böylece bunun kasıtlı olduğunu onaylayabilirsiniz; bunu yeniden yazmaz.

<Note>
GPT-5.5 hem doğrudan OpenAI Platform API anahtarı erişimi hem de abonelik/OAuth rotaları üzerinden kullanılabilir. ChatGPT/Codex aboneliği artı yerel Codex yürütmesi için `agentRuntime.id: "codex"` ile `openai/gpt-5.5` kullanın. `openai-codex/gpt-5.5` yalnızca PI üzerinden Codex OAuth için ya da Codex çalışma zamanı geçersiz kılması olmadan doğrudan `OPENAI_API_KEY` trafiği için `openai/gpt-5.5` kullanın.
</Note>

<Note>
OpenAI plugin’ini etkinleştirmek veya bir `openai-codex/*` modeli seçmek, paketlenmiş Codex uygulama sunucusu plugin’ini etkinleştirmez. OpenClaw bu plugin’i yalnızca `agentRuntime.id: "codex"` ile yerel Codex koşumunu açıkça seçtiğinizde veya eski bir `codex/*` model başvurusu kullandığınızda etkinleştirir.
Paketlenmiş `codex` plugin’i etkinse ancak `openai-codex/*` hâlâ PI üzerinden çözümleniyorsa `openclaw doctor` uyarır ve rotayı değiştirmeden bırakır.
</Note>

## OpenClaw özellik kapsamı

| OpenAI yeteneği          | OpenClaw yüzeyi                                            | Durum                                                  |
| ------------------------ | ---------------------------------------------------------- | ------------------------------------------------------ |
| Sohbet / Responses       | `openai/<model>` model sağlayıcısı                         | Evet                                                   |
| Codex abonelik modelleri | `openai-codex/<model>` ile `openai-codex` OAuth            | Evet                                                   |
| Codex uygulama sunucusu koşumu | `agentRuntime.id: codex` ile `openai/<model>`         | Evet                                                   |
| Sunucu tarafı web araması | Yerel OpenAI Responses aracı                               | Evet, web araması etkinleştirildiğinde ve sağlayıcı sabitlenmediğinde |
| Görüntüler               | `image_generate`                                           | Evet                                                   |
| Videolar                 | `video_generate`                                           | Evet                                                   |
| Metinden konuşmaya       | `messages.tts.provider: "openai"` / `tts`                  | Evet                                                   |
| Toplu konuşmadan metne   | `tools.media.audio` / medya anlama                         | Evet                                                   |
| Akışlı konuşmadan metne  | Voice Call `streaming.provider: "openai"`                  | Evet                                                   |
| Gerçek zamanlı ses       | Voice Call `realtime.provider: "openai"` / Control UI Talk | Evet                                                   |
| Embeddings               | bellek embedding sağlayıcısı                               | Evet                                                   |

## Bellek embeddings

OpenClaw, `memory_search` dizinleme ve sorgu embeddings için OpenAI’ı veya OpenAI uyumlu bir embedding uç noktasını kullanabilir:

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

Asimetrik embedding etiketleri gerektiren OpenAI uyumlu uç noktalar için `memorySearch` altında `queryInputType` ve `documentInputType` ayarlayın. OpenClaw bunları sağlayıcıya özgü `input_type` istek alanları olarak iletir: sorgu embeddings `queryInputType` kullanır; dizinlenmiş bellek parçaları ve toplu dizinleme `documentInputType` kullanır. Tam örnek için [Bellek yapılandırma başvurusu](/tr/reference/memory-config#provider-specific-config) sayfasına bakın.

## Başlarken

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="API anahtarı (OpenAI Platform)">
    **En uygun kullanım:** doğrudan API erişimi ve kullanım tabanlı faturalandırma.

    <Steps>
      <Step title="API anahtarınızı alın">
        [OpenAI Platform panosu](https://platform.openai.com/api-keys) üzerinden bir API anahtarı oluşturun veya kopyalayın.
      </Step>
      <Step title="İlk kurulumu çalıştırın">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Veya anahtarı doğrudan geçirin:

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

    | Model başvurusu       | Çalışma zamanı yapılandırması | Rota                        | Kimlik doğrulama |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | atlanmış / `agentRuntime.id: "pi"`    | Doğrudan OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | atlanmış / `agentRuntime.id: "pi"`    | Doğrudan OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Codex uygulama sunucusu koşumu | Codex uygulama sunucusu |

    <Note>
    `openai/*`, Codex uygulama sunucusu koşumunu açıkça zorlamadığınız sürece doğrudan OpenAI API anahtarı rotasıdır. Varsayılan PI çalıştırıcısı üzerinden Codex OAuth için `openai-codex/*` kullanın veya yerel Codex uygulama sunucusu yürütmesi için `agentRuntime.id: "codex"` ile `openai/gpt-5.5` kullanın.
    </Note>

    ### Yapılandırma örneği

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw, `openai/gpt-5.3-codex-spark` sunmaz. Canlı OpenAI API istekleri bu modeli reddeder ve mevcut Codex kataloğu da bunu sunmaz.
    </Warning>

  </Tab>

  <Tab title="Codex aboneliği">
    **En uygun kullanım:** ayrı bir API anahtarı yerine ChatGPT/Codex aboneliğinizi yerel Codex uygulama sunucusu yürütmesiyle kullanmak. Codex bulutu ChatGPT oturumu açmayı gerektirir.

    <Steps>
      <Step title="Codex OAuth çalıştırın">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Veya OAuth’u doğrudan çalıştırın:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Ekransız veya geri çağırma açısından elverişsiz kurulumlarda localhost tarayıcı geri çağırması yerine ChatGPT cihaz kodu akışıyla oturum açmak için `--device-code` ekleyin:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Yerel Codex çalışma zamanını kullanın">
        ```bash
        openclaw config set plugins.entries.codex '{"enabled":true}' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{"id":"codex"}' --strict-json
        ```
      </Step>
      <Step title="Codex kimlik doğrulamasının kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Gateway çalıştıktan sonra yerel uygulama sunucusu çalışma zamanını doğrulamak için sohbette `/codex status` veya `/codex models` gönderin.
      </Step>
    </Steps>

    ### Rota özeti

    | Model başvurusu | Çalışma zamanı yapılandırması | Rota | Kimlik doğrulama |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Yerel Codex uygulama sunucusu koşumu | Codex oturumu açma veya seçili `openai-codex` profili |
    | `openai-codex/gpt-5.5` | atlanmış / `runtime: "pi"` | PI üzerinden ChatGPT/Codex OAuth | Codex oturumu açma |
    | `openai-codex/gpt-5.4-mini` | atlanmış / `runtime: "pi"` | PI üzerinden ChatGPT/Codex OAuth | Codex oturumu açma |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Bir plugin açıkça `openai-codex` üstlenmedikçe hâlâ PI | Codex oturumu açma |

    <Note>
    Kimlik doğrulama/profil komutları için `openai-codex` sağlayıcı kimliğini kullanmaya devam edin. `openai-codex/*` model öneki de Codex OAuth için açık PI rotasıdır. Paketlenmiş Codex app-server bağlayıcısını seçmez veya otomatik etkinleştirmez. Yaygın abonelik artı yerel çalışma zamanı kurulumu için `openai-codex` ile oturum açın, ancak model başvurusunu `openai/gpt-5.5` olarak tutun ve `agentRuntime.id: "codex"` ayarlayın.
    </Note>

    ### Yapılandırma örneği

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex" },
        },
      },
    }
    ```

    Codex OAuth'u bunun yerine normal PI çalıştırıcısında tutmak için `openai-codex/gpt-5.5` kullanın ve Codex çalışma zamanı geçersiz kılmasını atlayın.

    <Note>
    İlk kurulum artık `~/.codex` konumundan OAuth materyali içe aktarmaz. Tarayıcı OAuth'u (varsayılan) veya yukarıdaki cihaz kodu akışıyla oturum açın — OpenClaw oluşan kimlik bilgilerini kendi agent kimlik doğrulama deposunda yönetir.
    </Note>

    ### Durum göstergesi

    Chat `/status`, geçerli oturum için hangi model çalışma zamanının etkin olduğunu gösterir. Varsayılan PI bağlayıcısı `Runtime: OpenClaw Pi Default` olarak görünür. Paketlenmiş Codex app-server bağlayıcısı seçildiğinde, `/status` `Runtime: OpenAI Codex` gösterir. Mevcut oturumlar kaydedilmiş bağlayıcı kimliğini korur; bu nedenle `/status` çıktısının yeni bir PI/Codex seçimini yansıtmasını istiyorsanız `agentRuntime` değiştirdikten sonra `/new` veya `/reset` kullanın.

    ### Doctor uyarısı

    Paketlenmiş `codex` plugin etkinleştirilmişken bir `openai-codex/*` rotası seçilirse, `openclaw doctor` modelin hâlâ PI üzerinden çözümlendiği konusunda uyarır. Bu PI abonelik kimlik doğrulama rotası kasıtlı olduğunda yapılandırmayı değiştirmeden bırakın. Yerel Codex app-server yürütmesi istediğinizde `openai/<model>` artı `agentRuntime.id: "codex"` biçimine geçin.

    ### Bağlam penceresi sınırı

    OpenClaw model meta verilerini ve çalışma zamanı bağlam sınırını ayrı değerler olarak ele alır.

    Codex OAuth üzerinden `openai-codex/gpt-5.5` için:

    - Yerel `contextWindow`: `1000000`
    - Varsayılan çalışma zamanı `contextTokens` sınırı: `272000`

    Daha küçük varsayılan sınır, pratikte daha iyi gecikme ve kalite özellikleri sağlar. `contextTokens` ile geçersiz kılın:

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

    ### Katalog kurtarma

    OpenClaw, mevcut olduğunda `gpt-5.5` için upstream Codex katalog meta verilerini kullanır. Hesap kimliği doğrulanmışken canlı Codex keşfi `openai-codex/gpt-5.5` satırını atlıyorsa OpenClaw bu OAuth model satırını sentezler; böylece cron, sub-agent ve yapılandırılmış varsayılan model çalıştırmaları `Unknown model` ile başarısız olmaz.

  </Tab>
</Tabs>

## Yerel Codex app-server kimlik doğrulaması

Yerel Codex app-server bağlayıcısı `openai/*` model başvuruları artı `agentRuntime.id: "codex"` kullanır, ancak kimlik doğrulaması yine de hesap tabanlıdır. OpenClaw kimlik doğrulamayı şu sırayla seçer:

1. Agent'a bağlı açık bir OpenClaw `openai-codex` kimlik doğrulama profili.
2. app-server'ın mevcut hesabı, örneğin yerel bir Codex CLI ChatGPT oturumu.
3. Yalnızca yerel stdio app-server başlatmaları için, app-server hesap bildirmediğinde ve hâlâ OpenAI kimlik doğrulaması gerektirdiğinde `CODEX_API_KEY`, ardından `OPENAI_API_KEY`.

Bu, gateway sürecinde doğrudan OpenAI modelleri veya embeddings için `OPENAI_API_KEY` bulunduğu için yerel ChatGPT/Codex abonelik oturumunun değiştirilmeyeceği anlamına gelir. Env API anahtarı geri dönüşü yalnızca yerel stdio hesapsız yoludur; WebSocket app-server bağlantılarına gönderilmez. Abonelik tarzı bir Codex profili seçildiğinde, OpenClaw ayrıca `CODEX_API_KEY` ve `OPENAI_API_KEY` değerlerini oluşturulan stdio app-server alt sürecinin dışında tutar ve seçilen kimlik bilgilerini app-server login RPC üzerinden gönderir.

## Görüntü oluşturma

Paketlenmiş `openai` Plugin, `image_generate` aracı üzerinden görüntü oluşturmayı kaydeder. Hem OpenAI API anahtarlı görüntü oluşturmayı hem de Codex OAuth görüntü oluşturmayı aynı `openai/gpt-image-2` model başvurusu üzerinden destekler.

| Yetenek                  | OpenAI API anahtarı                        | Codex OAuth                           |
| ------------------------ | ------------------------------------------ | ------------------------------------- |
| Model başvurusu          | `openai/gpt-image-2`                       | `openai/gpt-image-2`                  |
| Kimlik doğrulama         | `OPENAI_API_KEY`                           | OpenAI Codex OAuth oturumu            |
| Aktarım                  | OpenAI Images API                          | Codex Responses arka ucu              |
| İstek başına azami görüntü | 4                                        | 4                                     |
| Düzenleme modu           | Etkin (en fazla 5 referans görüntü)        | Etkin (en fazla 5 referans görüntü)   |
| Boyut geçersiz kılmaları | 2K/4K boyutları dahil desteklenir          | 2K/4K boyutları dahil desteklenir     |
| En-boy oranı / çözünürlük | OpenAI Images API'ye iletilmez            | Güvenli olduğunda desteklenen bir boyuta eşlenir |

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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için [Görüntü Oluşturma](/tr/tools/image-generation) sayfasına bakın.
</Note>

`gpt-image-2`, hem OpenAI metinden görüntü oluşturmada hem de görüntü düzenlemede varsayılandır. `gpt-image-1.5`, `gpt-image-1` ve `gpt-image-1-mini` açık model geçersiz kılmaları olarak kullanılabilir kalır. Şeffaf arka planlı PNG/WebP çıktısı için `openai/gpt-image-1.5` kullanın; geçerli `gpt-image-2` API'si `background: "transparent"` değerini reddeder.

Şeffaf arka planlı bir istek için agent'lar `image_generate` aracını `model: "openai/gpt-image-1.5"`, `outputFormat: "png"` veya `"webp"` ve `background: "transparent"` ile çağırmalıdır; eski `openai.background` sağlayıcı seçeneği hâlâ kabul edilir. OpenClaw ayrıca varsayılan `openai/gpt-image-2` şeffaf isteklerini `gpt-image-1.5` olarak yeniden yazarak genel OpenAI ve OpenAI Codex OAuth rotalarını korur; Azure ve özel OpenAI uyumlu uç noktalar yapılandırılmış deployment/model adlarını korur.

Aynı ayar headless CLI çalıştırmaları için de sunulur:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Bir girdi dosyasından başlarken `openclaw infer image edit` ile aynı `--output-format` ve `--background` bayraklarını kullanın. `--openai-background`, OpenAI'ye özgü bir takma ad olarak kullanılabilir kalır.

Codex OAuth kurulumları için aynı `openai/gpt-image-2` başvurusunu koruyun. Bir `openai-codex` OAuth profili yapılandırıldığında, OpenClaw depolanan OAuth erişim token'ını çözümler ve görüntü isteklerini Codex Responses arka ucu üzerinden gönderir. Bu istek için önce `OPENAI_API_KEY` denemez veya sessizce bir API anahtarına geri dönülmez. Bunun yerine doğrudan OpenAI Images API rotasını istediğinizde `models.providers.openai` değerini bir API anahtarı, özel temel URL veya Azure uç noktasıyla açıkça yapılandırın.
Bu özel görüntü uç noktası güvenilir bir LAN/özel adresteyse `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` değerini de ayarlayın; OpenClaw, bu tercih mevcut değilse özel/dahili OpenAI uyumlu görüntü uç noktalarını engelli tutar.

Oluştur:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Şeffaf bir PNG oluştur:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Düzenle:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Video oluşturma

Paketlenmiş `openai` Plugin, `video_generate` aracı üzerinden video oluşturmayı kaydeder.

| Yetenek            | Değer                                                                             |
| ------------------ | --------------------------------------------------------------------------------- |
| Varsayılan model   | `openai/sora-2`                                                                   |
| Modlar             | Metinden videoya, görüntüden videoya, tek video düzenleme                         |
| Referans girdileri | 1 görüntü veya 1 video                                                            |
| Boyut geçersiz kılmaları | Desteklenir                                                                 |
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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için [Video Oluşturma](/tr/tools/video-generation) sayfasına bakın.
</Note>

## GPT-5 prompt katkısı

OpenClaw, sağlayıcılar genelinde GPT-5 ailesi çalıştırmaları için paylaşılan bir GPT-5 prompt katkısı ekler. Model kimliğine göre uygulanır; bu nedenle `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` ve diğer uyumlu GPT-5 başvuruları aynı katmanı alır. Eski GPT-4.x modelleri almaz.

Paketlenmiş yerel Codex bağlayıcısı, Codex app-server geliştirici yönergeleri üzerinden aynı GPT-5 davranışını ve Heartbeat katmanını kullanır; bu nedenle `agentRuntime.id: "codex"` üzerinden zorlanan `openai/gpt-5.x` oturumları, bağlayıcı prompt'unun geri kalanı Codex tarafından sahiplenilse bile aynı takip ve proaktif Heartbeat rehberliğini korur.

GPT-5 katkısı persona kalıcılığı, yürütme güvenliği, araç disiplini, çıktı biçimi, tamamlama kontrolleri ve doğrulama için etiketli bir davranış sözleşmesi ekler. Kanala özgü yanıt ve sessiz mesaj davranışı, paylaşılan OpenClaw sistem prompt'unda ve giden teslim politikalarında kalır. GPT-5 rehberliği eşleşen modeller için her zaman etkindir. Dostane etkileşim stili katmanı ayrıdır ve yapılandırılabilir.

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
Değerler çalışma zamanında büyük/küçük harfe duyarlı değildir; bu nedenle `"Off"` ve `"off"` ikisi de dostane stil katmanını devre dışı bırakır.
</Tip>

<Note>
Paylaşılan `agents.defaults.promptOverlays.gpt5.personality` ayarı ayarlanmamışsa eski `plugins.entries.openai.config.personality` uyumluluk geri dönüşü olarak hâlâ okunur.
</Note>

## Ses ve konuşma

<AccordionGroup>
  <Accordion title="Konuşma sentezi (TTS)">
    Paketlenmiş `openai` Plugin, `messages.tts` yüzeyi için konuşma sentezini kaydeder.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Ses | `messages.tts.providers.openai.voice` | `coral` |
    | Hız | `messages.tts.providers.openai.speed` | (ayarlanmamış) |
    | Talimatlar | `messages.tts.providers.openai.instructions` | (ayarlanmamış, yalnızca `gpt-4o-mini-tts`) |
    | Biçim | `messages.tts.providers.openai.responseFormat` | sesli notlar için `opus`, dosyalar için `mp3` |
    | API anahtarı | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY` değerine geri döner |
    | Temel URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Ek gövde | `messages.tts.providers.openai.extraBody` / `extra_body` | (ayarlanmamış) |

    Kullanılabilir modeller: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Kullanılabilir sesler: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody`, OpenClaw tarafından oluşturulan alanlardan sonra `/audio/speech` istek JSON'una birleştirilir; bu nedenle `lang` gibi ek anahtarlar gerektiren OpenAI uyumlu uç noktalar için kullanın. Prototip anahtarları yok sayılır.

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
    Sohbet API uç noktasını etkilemeden TTS temel URL'sini geçersiz kılmak için `OPENAI_TTS_BASE_URL` değerini ayarlayın.
    </Note>

  </Accordion>

  <Accordion title="Konuşmadan metne">
    Paketle gelen `openai` Plugin'i, OpenClaw'ın medya anlama transkripsiyon yüzeyi üzerinden toplu konuşmadan metne dönüştürmeyi kaydeder.

    - Varsayılan model: `gpt-4o-transcribe`
    - Uç nokta: OpenAI REST `/v1/audio/transcriptions`
    - Girdi yolu: çok parçalı ses dosyası yükleme
    - Discord ses kanalı segmentleri ve kanal ses ekleri dahil olmak üzere gelen ses transkripsiyonunun `tools.media.audio` kullandığı her yerde OpenClaw tarafından desteklenir

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

    Dil ve istem ipuçları, paylaşılan ses medyası yapılandırması veya çağrı başına transkripsiyon isteği tarafından sağlandığında OpenAI'a iletilir.

  </Accordion>

  <Accordion title="Gerçek zamanlı transkripsiyon">
    Paketle gelen `openai` Plugin'i, Voice Call Plugin'i için gerçek zamanlı transkripsiyonu kaydeder.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Dil | `...openai.language` | (ayarlanmamış) |
    | İstem | `...openai.prompt` | (ayarlanmamış) |
    | Sessizlik süresi | `...openai.silenceDurationMs` | `800` |
    | VAD eşiği | `...openai.vadThreshold` | `0.5` |
    | API anahtarı | `...openai.apiKey` | `OPENAI_API_KEY` değerine geri döner |

    <Note>
    G.711 u-law (`g711_ulaw` / `audio/pcmu`) ses ile `wss://api.openai.com/v1/realtime` adresine bir WebSocket bağlantısı kullanır. Bu akış sağlayıcısı, Voice Call'ın gerçek zamanlı transkripsiyon yolu içindir; Discord sesi şu anda kısa segmentler kaydeder ve bunun yerine toplu `tools.media.audio` transkripsiyon yolunu kullanır.
    </Note>

  </Accordion>

  <Accordion title="Gerçek zamanlı ses">
    Paketle gelen `openai` Plugin'i, Voice Call Plugin'i için gerçek zamanlı sesi kaydeder.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Ses | `...openai.voice` | `alloy` |
    | Sıcaklık | `...openai.temperature` | `0.8` |
    | VAD eşiği | `...openai.vadThreshold` | `0.5` |
    | Sessizlik süresi | `...openai.silenceDurationMs` | `500` |
    | API anahtarı | `...openai.apiKey` | `OPENAI_API_KEY` değerine geri döner |

    <Note>
    Arka uç gerçek zamanlı köprüleri için `azureEndpoint` ve `azureDeployment` yapılandırma anahtarları aracılığıyla Azure OpenAI'ı destekler. Çift yönlü araç çağırmayı destekler. G.711 u-law ses biçimini kullanır.
    </Note>

    <Note>
    Control UI Talk, Gateway tarafından basılan geçici bir istemci sırrı ve OpenAI Realtime API'ye karşı doğrudan tarayıcı WebRTC SDP değişimi ile OpenAI tarayıcı gerçek zamanlı oturumlarını kullanır. Bakımcı canlı doğrulaması `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` ile kullanılabilir; OpenAI ayağı Node'da bir istemci sırrı basar, sahte mikrofon medyasıyla bir tarayıcı SDP teklifi oluşturur, bunu OpenAI'a gönderir ve sırları günlüğe kaydetmeden SDP yanıtını uygular.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI uç noktaları

Paketle gelen `openai` sağlayıcısı, temel URL'yi geçersiz kılarak görüntü üretimi için bir Azure OpenAI kaynağını hedefleyebilir. Görüntü üretimi yolunda OpenClaw, `models.providers.openai.baseUrl` üzerindeki Azure ana makine adlarını algılar ve otomatik olarak Azure'ın istek biçimine geçer.

<Note>
Gerçek zamanlı ses ayrı bir yapılandırma yolu kullanır (`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`) ve `models.providers.openai.baseUrl` tarafından etkilenmez. Azure ayarları için [Ses ve konuşma](#voice-and-speech) altındaki **Gerçek zamanlı ses** akordeonuna bakın.
</Note>

Azure OpenAI'ı şu durumlarda kullanın:

- Zaten bir Azure OpenAI aboneliğiniz, kotanız veya kurumsal anlaşmanız varsa
- Azure'ın sağladığı bölgesel veri ikameti veya uyumluluk denetimlerine ihtiyacınız varsa
- Trafiği mevcut bir Azure kiracısı içinde tutmak istiyorsanız

### Yapılandırma

Paketle gelen `openai` sağlayıcısı üzerinden Azure görüntü üretimi için `models.providers.openai.baseUrl` değerini Azure kaynağınıza yönlendirin ve `apiKey` değerini Azure OpenAI anahtarına ayarlayın (OpenAI Platform anahtarı değil):

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

OpenClaw, Azure görüntü üretimi rotası için şu Azure ana makine soneklerini tanır:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Tanınan bir Azure ana makinesindeki görüntü üretimi istekleri için OpenClaw:

- `Authorization: Bearer` yerine `api-key` başlığını gönderir
- Dağıtım kapsamlı yolları kullanır (`/openai/deployments/{deployment}/...`)
- Her isteğe `?api-version=...` ekler
- Azure görüntü üretimi çağrıları için 600 sn varsayılan istek zaman aşımı kullanır. Çağrı başına `timeoutMs` değerleri yine de bu varsayılanı geçersiz kılar.

Diğer temel URL'ler (genel OpenAI, OpenAI uyumlu proxy'ler) standart OpenAI görüntü isteği biçimini korur.

<Note>
`openai` sağlayıcısının görüntü üretimi yolu için Azure yönlendirmesi OpenClaw 2026.4.22 veya sonrasını gerektirir. Daha eski sürümler, özel `openai.baseUrl` değerlerini genel OpenAI uç noktası gibi ele alır ve Azure görüntü dağıtımlarına karşı başarısız olur.
</Note>

### API sürümü

Azure görüntü üretimi yolu için belirli bir Azure önizleme veya GA sürümünü sabitlemek üzere `AZURE_OPENAI_API_VERSION` değerini ayarlayın:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Değişken ayarlanmamışsa varsayılan `2024-12-01-preview` değeridir.

### Model adları dağıtım adlarıdır

Azure OpenAI modelleri dağıtımlara bağlar. Paketle gelen `openai` sağlayıcısı üzerinden yönlendirilen Azure görüntü üretimi istekleri için OpenClaw'daki `model` alanı, genel OpenAI model kimliği değil, Azure portalında yapılandırdığınız **Azure dağıtım adı** olmalıdır.

`gpt-image-2` sunan `gpt-image-2-prod` adlı bir dağıtım oluşturursanız:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Aynı dağıtım adı kuralı, paketle gelen `openai` sağlayıcısı üzerinden yönlendirilen görüntü üretimi çağrıları için de geçerlidir.

### Bölgesel kullanılabilirlik

Azure görüntü üretimi şu anda yalnızca bölgelerin bir alt kümesinde kullanılabilir (örneğin `eastus2`, `swedencentral`, `polandcentral`, `westus3`, `uaenorth`). Bir dağıtım oluşturmadan önce Microsoft'un güncel bölge listesini kontrol edin ve belirli modelin bölgenizde sunulduğunu doğrulayın.

### Parametre farkları

Azure OpenAI ve genel OpenAI her zaman aynı görüntü parametrelerini kabul etmez. Azure, genel OpenAI'ın izin verdiği seçenekleri reddedebilir (örneğin `gpt-image-2` üzerindeki belirli `background` değerleri) veya bunları yalnızca belirli model sürümlerinde sunabilir. Bu farklar OpenClaw'dan değil Azure'dan ve alttaki modelden kaynaklanır. Bir Azure isteği doğrulama hatasıyla başarısız olursa, Azure portalında belirli dağıtımınız ve API sürümünüz tarafından desteklenen parametre kümesini kontrol edin.

<Note>
Azure OpenAI yerel taşıma ve uyumluluk davranışı kullanır, ancak OpenClaw'ın gizli atıf başlıklarını almaz — bkz. [Gelişmiş yapılandırma](#advanced-configuration) altındaki **Yerel ve OpenAI uyumlu rotalar** akordeonu.

Azure üzerinde sohbet veya Responses trafiği için (görüntü üretiminin ötesinde), onboarding akışını veya özel bir Azure sağlayıcı yapılandırmasını kullanın — tek başına `openai.baseUrl`, Azure API/kimlik doğrulama biçimini almaz. Ayrı bir `azure-openai-responses/*` sağlayıcısı vardır; aşağıdaki Sunucu tarafı Compaction akordeonuna bakın.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Taşıma (WebSocket ve SSE)">
    OpenClaw, hem `openai/*` hem de `openai-codex/*` için SSE geri dönüşlü WebSocket öncelikli (`"auto"`) kullanır.

    `"auto"` modunda OpenClaw:
    - SSE'ye geri dönmeden önce bir erken WebSocket hatasını yeniden dener
    - Bir hatadan sonra WebSocket'i yaklaşık 60 saniye boyunca bozulmuş olarak işaretler ve soğuma sırasında SSE kullanır
    - Yeniden denemeler ve yeniden bağlanmalar için kararlı oturum ve tur kimliği başlıkları ekler
    - Taşıma varyantları genelinde kullanım sayaçlarını (`input_tokens` / `prompt_tokens`) normalleştirir

    | Değer | Davranış |
    |-------|----------|
    | `"auto"` (varsayılan) | Önce WebSocket, SSE geri dönüşü |
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
    - [Akış API yanıtları (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket ısınması">
    OpenClaw, ilk tur gecikmesini azaltmak için `openai/*` ve `openai-codex/*` için WebSocket ısınmasını varsayılan olarak etkinleştirir.

    ```json5
    // Isınmayı devre dışı bırak
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
    Oturum geçersiz kılmaları yapılandırmaya göre önceliklidir. Sessions UI'da oturum geçersiz kılmasını temizlemek, oturumu yapılandırılmış varsayılana döndürür.
    </Note>

  </Accordion>

  <Accordion title="Öncelikli işleme (service_tier)">
    OpenAI API'si `service_tier` aracılığıyla öncelikli işlemeyi sunar. Bunu OpenClaw'da model başına ayarlayın:

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
    `serviceTier` yalnızca yerel OpenAI uç noktalarına (`api.openai.com`) ve yerel Codex uç noktalarına (`chatgpt.com/backend-api`) iletilir. İki sağlayıcıdan birini bir proxy üzerinden yönlendirirseniz OpenClaw `service_tier` değerine dokunmaz.
    </Warning>

  </Accordion>

  <Accordion title="Sunucu tarafı Compaction (Responses API)">
    Doğrudan OpenAI Responses modelleri için (`api.openai.com` üzerinde `openai/*`), OpenAI Plugin'inin Pi-harness akış sarmalayıcısı sunucu tarafı Compaction'ı otomatik olarak etkinleştirir:

    - `store: true` değerini zorunlu kılar (model uyumluluğu `supportsStore: false` ayarlamadıkça)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` enjekte eder
    - Varsayılan `compact_threshold`: `contextWindow` değerinin %70'i (veya mevcut olmadığında `80000`)

    Bu, yerleşik Pi harness yoluna ve gömülü çalıştırmalar tarafından kullanılan OpenAI sağlayıcı hook'larına uygulanır. Yerel Codex uygulama sunucusu harness'i kendi bağlamını Codex üzerinden yönetir ve `agents.defaults.agentRuntime.id` ile ayrı olarak yapılandırılır.

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
    `responsesServerCompaction` yalnızca `context_management` enjeksiyonunu kontrol eder. Doğrudan OpenAI Responses modelleri, uyumluluk `supportsStore: false` ayarlamadıkça yine de `store: true` değerini zorunlu kılar.
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT modu">
    `openai/*` üzerinde GPT-5 ailesi çalıştırmalar için OpenClaw daha katı bir gömülü yürütme sözleşmesi kullanabilir:

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
    - Bir araç eylemi kullanılabilir olduğunda yalnızca plan içeren bir turu artık başarılı ilerleme olarak değerlendirmez
    - Turu hemen eyleme geç yönlendirmesiyle yeniden dener
    - Kapsamlı işler için `update_plan` değerini otomatik olarak etkinleştirir
    - Model eyleme geçmeden planlamaya devam ederse açık bir engellenmiş durum gösterir

    <Note>
    Yalnızca OpenAI ve Codex GPT-5 ailesi çalıştırmalarıyla sınırlıdır. Diğer sağlayıcılar ve daha eski model aileleri varsayılan davranışı korur.
    </Note>

  </Accordion>

  <Accordion title="Yerel ve OpenAI uyumlu rotalar">
    OpenClaw doğrudan OpenAI, Codex ve Azure OpenAI uç noktalarını genel OpenAI uyumlu `/v1` proxy'lerinden farklı ele alır:

    **Yerel rotalar** (`openai/*`, Azure OpenAI):
    - OpenAI `none` çabasını destekleyen modeller için yalnızca `reasoning: { effort: "none" }` değerini korur
    - `reasoning.effort: "none"` değerini reddeden modeller veya proxy'ler için devre dışı bırakılmış akıl yürütmeyi çıkarır
    - Araç şemalarını varsayılan olarak katı moda ayarlar
    - Yalnızca doğrulanmış yerel host'larda gizli atıf başlıkları ekler
    - Yalnızca OpenAI'ye özgü istek şekillendirmeyi korur (`service_tier`, `store`, akıl yürütme uyumluluğu, prompt önbelleği ipuçları)

    **Proxy/uyumlu rotalar:**
    - Daha gevşek uyumluluk davranışı kullanır
    - Yerel olmayan `openai-completions` yüklerinden Completions `store` alanını kaldırır
    - OpenAI uyumlu Completions proxy'leri için gelişmiş `params.extra_body`/`params.extraBody` JSON geçişini kabul eder
    - vLLM gibi OpenAI uyumlu Completions proxy'leri için `params.chat_template_kwargs` kabul eder
    - Katı araç şemalarını veya yalnızca yerele özgü başlıkları zorunlu kılmaz

    Azure OpenAI yerel taşıma ve uyumluluk davranışı kullanır ancak gizli atıf başlıklarını almaz.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Görüntü oluşturma" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görüntü aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video oluşturma" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="OAuth ve kimlik doğrulama" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
</CardGroup>

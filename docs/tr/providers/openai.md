---
read_when:
    - OpenClaw içinde OpenAI modellerini kullanmak istiyorsunuz
    - API anahtarları yerine Codex abonelik kimlik doğrulamasını istiyorsunuz
    - Daha sıkı GPT-5 aracı yürütme davranışına ihtiyacınız var
summary: OpenClaw içinde OpenAI’yi API anahtarları veya Codex aboneliği aracılığıyla kullanın
title: OpenAI
x-i18n:
    generated_at: "2026-04-26T11:39:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4c3e734217ca82e1a5965c41686341a8bd87b4d2194c6d9e286e1087fa53320
    source_path: providers/openai.md
    workflow: 15
---

  OpenAI, GPT modelleri için geliştirici API’leri sunar ve Codex de
  OpenAI’nin Codex istemcileri aracılığıyla bir ChatGPT planı kodlama aracısı olarak kullanılabilir. OpenClaw bu
  yüzeyleri ayrı tutar, böylece yapılandırma öngörülebilir kalır.

  OpenClaw, OpenAI ailesi için üç yol destekler. Model öneki
  sağlayıcı/kimlik doğrulama yolunu seçer; ayrı bir çalışma zamanı ayarı ise
  gömülü aracı döngüsünü kimin yürüttüğünü seçer:

  - **API anahtarı** — kullanım bazlı faturalandırma ile doğrudan OpenAI Platform erişimi (`openai/*` modelleri)
  - **PI üzerinden Codex aboneliği** — abonelik erişimiyle ChatGPT/Codex oturum açma (`openai-codex/*` modelleri)
  - **Codex app-server harness** — yerel Codex app-server yürütmesi (`openai/*` modelleri artı `agents.defaults.agentRuntime.id: "codex"`)

  OpenAI, OpenClaw gibi harici araçlar ve iş akışlarında abonelik OAuth kullanımını açıkça destekler.

  Sağlayıcı, model, çalışma zamanı ve kanal ayrı katmanlardır. Bu etiketler
  birbirine karışıyorsa, yapılandırmayı değiştirmeden önce [Aracı çalışma zamanları](/tr/concepts/agent-runtimes) sayfasını okuyun.

  ## Hızlı seçim

  | Hedef                                          | Kullanım                                         | Notlar                                                                       |
  | --------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
  | Doğrudan API anahtarıyla faturalandırma       | `openai/gpt-5.5`                                 | `OPENAI_API_KEY` ayarlayın veya OpenAI API anahtarı onboarding’ini çalıştırın. |
  | ChatGPT/Codex abonelik kimlik doğrulamasıyla GPT-5.5  | `openai-codex/gpt-5.5`                           | Codex OAuth için varsayılan PI yolu. Abonelik kurulumları için en iyi ilk seçim. |
  | Yerel Codex app-server davranışıyla GPT-5.5   | `openai/gpt-5.5` artı `agentRuntime.id: "codex"` | Bu model referansı için Codex app-server harness’i zorlar.                   |
  | Görüntü oluşturma veya düzenleme              | `openai/gpt-image-2`                             | `OPENAI_API_KEY` veya OpenAI Codex OAuth ile çalışır.                        |
  | Saydam arka planlı görüntüler                 | `openai/gpt-image-1.5`                           | `outputFormat=png` veya `webp` ve `openai.background=transparent` kullanın.  |

  ## Adlandırma eşlemesi

  Adlar benzerdir ama birbirinin yerine kullanılamaz:

  | Gördüğünüz ad                      | Katman            | Anlamı                                                                                           |
  | ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
  | `openai`                           | Sağlayıcı öneki   | Doğrudan OpenAI Platform API yolu.                                                                |
  | `openai-codex`                     | Sağlayıcı öneki   | Normal OpenClaw Pi çalıştırıcısı üzerinden OpenAI Codex OAuth/abonelik yolu.                     |
  | `codex` plugin’i                   | Plugin            | Yerel Codex app-server çalışma zamanını ve `/codex` sohbet denetimlerini sağlayan paketlenmiş OpenClaw plugin’i. |
  | `agentRuntime.id: codex`           | Aracı çalışma zamanı | Gömülü dönüşler için yerel Codex app-server harness’ini zorla kullanır.                        |
  | `/codex ...`                       | Sohbet komut kümesi | Bir konuşmadan Codex app-server iş parçacıklarını bağlar/denetler.                             |
  | `runtime: "acp", agentId: "codex"` | ACP oturum yolu   | Codex’i ACP/acpx üzerinden çalıştıran açık geri dönüş yolu.                                       |

  Bu, bir yapılandırmanın bilinçli olarak hem `openai-codex/*` hem de
  `codex` plugin’ini içerebileceği anlamına gelir. Codex OAuth’u PI üzerinden kullanmak ve aynı zamanda
  yerel `/codex` sohbet denetimlerinin de kullanılabilir olmasını istediğinizde bu geçerlidir. `openclaw doctor` bu
  kombinasyon hakkında sizi bunun kasıtlı olduğunu doğrulayabilmeniz için uyarır; bunu yeniden yazmaz.

  <Note>
  GPT-5.5 hem doğrudan OpenAI Platform API anahtarı erişimiyle hem de
  abonelik/OAuth yollarıyla kullanılabilir. Doğrudan `OPENAI_API_KEY`
  trafiği için `openai/gpt-5.5`, PI üzerinden Codex OAuth için `openai-codex/gpt-5.5` veya
  yerel Codex app-server harness’i için `agentRuntime.id: "codex"` ile birlikte
  `openai/gpt-5.5` kullanın.
  </Note>

  <Note>
  OpenAI plugin’ini etkinleştirmek veya bir `openai-codex/*` modeli seçmek,
  paketlenmiş Codex app-server plugin’ini etkinleştirmez. OpenClaw bu plugin’i yalnızca
  yerel Codex harness’ini açıkça
  `agentRuntime.id: "codex"` ile seçtiğinizde veya eski bir `codex/*` model referansı kullandığınızda etkinleştirir.
  Paketlenmiş `codex` plugin’i etkin olduğu hâlde `openai-codex/*` hâlâ
  PI üzerinden çözümleniyorsa, `openclaw doctor` uyarır ve yolu değiştirmeden bırakır.
  </Note>

  ## OpenClaw özellik kapsamı

  | OpenAI yeteneği          | OpenClaw yüzeyi                                           | Durum                                                  |
  | ------------------------ | --------------------------------------------------------- | ------------------------------------------------------ |
  | Sohbet / Responses       | `openai/<model>` model sağlayıcısı                        | Evet                                                   |
  | Codex abonelik modelleri | `openai-codex/<model>` ile `openai-codex` OAuth          | Evet                                                   |
  | Codex app-server harness | `agentRuntime.id: codex` ile `openai/<model>`            | Evet                                                   |
  | Sunucu taraflı web araması | Yerel OpenAI Responses aracı                            | Evet, web araması etkinse ve sağlayıcı sabitlenmemişse |
  | Görüntüler               | `image_generate`                                          | Evet                                                   |
  | Videolar                 | `video_generate`                                          | Evet                                                   |
  | Metinden konuşma         | `messages.tts.provider: "openai"` / `tts`                 | Evet                                                   |
  | Toplu konuşmadan metne   | `tools.media.audio` / medya anlama                        | Evet                                                   |
  | Akışlı konuşmadan metne  | Voice Call `streaming.provider: "openai"`                 | Evet                                                   |
  | Gerçek zamanlı ses       | Voice Call `realtime.provider: "openai"` / Control UI Talk | Evet                                                 |
  | Embeddings               | bellek embedding sağlayıcısı                              | Evet                                                   |

  ## Başlangıç

  Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

  <Tabs>
  <Tab title="API key (OpenAI Platform)">
    **En iyisi:** doğrudan API erişimi ve kullanım bazlı faturalandırma.

    <Steps>
      <Step title="API anahtarınızı alın">
        [OpenAI Platform panosundan](https://platform.openai.com/api-keys) bir API anahtarı oluşturun veya kopyalayın.
      </Step>
      <Step title="Onboarding’i çalıştırın">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Veya anahtarı doğrudan verin:

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

    ### Yol özeti

    | Model ref              | Çalışma zamanı yapılandırması   | Yol                         | Kimlik doğrulama |
    | ---------------------- | ------------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | belirtilmemiş / `agentRuntime.id: "pi"`    | Doğrudan OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | belirtilmemiş / `agentRuntime.id: "pi"`    | Doğrudan OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`                 | Codex app-server harness     | Codex app-server |

    <Note>
    `openai/*`, Codex app-server harness’ini açıkça zorlamadığınız sürece
    doğrudan OpenAI API anahtarı yoludur. Varsayılan PI çalıştırıcısı üzerinden Codex OAuth için
    `openai-codex/*` kullanın veya yerel Codex app-server yürütmesi için
    `agentRuntime.id: "codex"` ile birlikte `openai/gpt-5.5` kullanın.
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

  <Tab title="Codex subscription">
    **En iyisi:** ayrı bir API anahtarı yerine ChatGPT/Codex aboneliğinizi kullanmak. Codex bulutu ChatGPT oturum açması gerektirir.

    <Steps>
      <Step title="Codex OAuth’u çalıştırın">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Veya OAuth’u doğrudan çalıştırın:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Başsız veya geri çağrı ana makinesine elverişsiz kurulumlar için, localhost tarayıcı geri çağrısı yerine ChatGPT cihaz kodu akışıyla oturum açmak üzere `--device-code` ekleyin:

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

    ### Yol özeti

    | Model ref | Çalışma zamanı yapılandırması | Yol | Kimlik doğrulama |
    |-----------|-------------------------------|-----|------------------|
    | `openai-codex/gpt-5.5` | belirtilmemiş / `runtime: "pi"` | PI üzerinden ChatGPT/Codex OAuth | Codex oturum açması |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Bir plugin açıkça `openai-codex` talep etmediği sürece yine PI | Codex oturum açması |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Codex app-server harness | Codex app-server kimlik doğrulaması |

    <Note>
    Kimlik doğrulama/profil komutları için `openai-codex` sağlayıcı kimliğini kullanmaya devam edin.
    `openai-codex/*` model öneki aynı zamanda Codex OAuth için açık PI yoludur.
    Paketlenmiş Codex app-server harness’ini seçmez veya otomatik etkinleştirmez.
    </Note>

    ### Yapılandırma örneği

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Onboarding artık OAuth materyalini `~/.codex` içinden içe aktarmıyor. Tarayıcı OAuth’u (varsayılan) veya yukarıdaki cihaz kodu akışını kullanarak oturum açın — OpenClaw ortaya çıkan kimlik bilgilerini kendi aracı kimlik doğrulama deposunda yönetir.
    </Note>

    ### Durum göstergesi

    Sohbet `/status`, geçerli oturum için hangi model çalışma zamanının etkin olduğunu gösterir.
    Varsayılan PI harness’i `Runtime: OpenClaw Pi Default` olarak görünür. Paketlenmiş
    Codex app-server harness’i seçildiğinde `/status`,
    `Runtime: OpenAI Codex` gösterir. Mevcut oturumlar kaydedilmiş harness kimliklerini korur; bu yüzden
    `/status` çıktısının yeni bir PI/Codex seçimini yansıtmasını istiyorsanız
    `agentRuntime` değiştirdikten sonra `/new` veya `/reset` kullanın.

    ### Doctor uyarısı

    Bu sekmedeki `openai-codex/*` yolu seçiliyken paketlenmiş `codex`
    plugin’i etkinse, `openclaw doctor` modelin
    yine de PI üzerinden çözümlendiği konusunda uyarır. Bu amaçlanan
    abonelik kimlik doğrulama yoluysa yapılandırmayı değiştirmeyin. Yalnızca yerel Codex
    app-server yürütmesi istediğinizde `openai/<model>` artı
    `agentRuntime.id: "codex"` kullanımına geçin.

    ### Bağlam penceresi sınırı

    OpenClaw model meta verisini ve çalışma zamanı bağlam sınırını ayrı değerler olarak ele alır.

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

    ### Katalog kurtarma

    OpenClaw, mevcut olduğunda `gpt-5.5` için yukarı akış Codex katalog meta verilerini kullanır. Canlı Codex keşfi, hesap kimliği doğrulanmış durumdayken `openai-codex/gpt-5.5` satırını atlıyorsa, OpenClaw bu OAuth model satırını sentezler; böylece Cron, alt aracı ve yapılandırılmış varsayılan model çalıştırmaları `Unknown model` hatasıyla başarısız olmaz.

  </Tab>
</Tabs>

## Görsel oluşturma

Paketle gelen `openai` Plugin, `image_generate` aracı üzerinden görsel oluşturmayı kaydeder.
Aynı `openai/gpt-image-2` model başvurusu üzerinden hem OpenAI API anahtarıyla görsel oluşturmayı hem de Codex OAuth ile görsel oluşturmayı destekler.

| Yetenek                  | OpenAI API anahtarı                 | Codex OAuth                          |
| ------------------------ | ----------------------------------- | ------------------------------------ |
| Model başvurusu          | `openai/gpt-image-2`                | `openai/gpt-image-2`                 |
| Kimlik doğrulama         | `OPENAI_API_KEY`                    | OpenAI Codex OAuth oturum açma       |
| Aktarım                  | OpenAI Images API                   | Codex Responses arka ucu             |
| İstek başına en fazla görsel | 4                               | 4                                    |
| Düzenleme modu           | Etkin (en fazla 5 referans görsel)  | Etkin (en fazla 5 referans görsel)   |
| Boyut geçersiz kılmaları | Desteklenir, 2K/4K boyutlar dahil   | Desteklenir, 2K/4K boyutlar dahil    |
| En boy oranı / çözünürlük | OpenAI Images API'ye iletilmez     | Güvenli olduğunda desteklenen bir boyuta eşlenir |

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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Görsel Oluşturma](/tr/tools/image-generation) bölümüne bakın.
</Note>

`gpt-image-2`, hem OpenAI metinden görsele oluşturma hem de görsel düzenleme için varsayılandır. `gpt-image-1.5`, `gpt-image-1` ve `gpt-image-1-mini` açık model geçersiz kılmaları olarak kullanılmaya devam eder. Şeffaf arka planlı PNG/WebP çıktısı için `openai/gpt-image-1.5` kullanın; mevcut `gpt-image-2` API'si `background: "transparent"` değerini reddeder.

Şeffaf arka plan isteği için aracıların `image_generate` çağrısını `model: "openai/gpt-image-1.5"`, `outputFormat: "png"` veya `"webp"` ve `background: "transparent"` ile yapması gerekir; eski `openai.background` sağlayıcı seçeneği hâlâ kabul edilir. OpenClaw ayrıca varsayılan `openai/gpt-image-2` şeffaf isteklerini `gpt-image-1.5` olarak yeniden yazarak herkese açık OpenAI ve OpenAI Codex OAuth yollarını korur; Azure ve özel OpenAI uyumlu uç noktalar ise yapılandırılmış dağıtım/model adlarını korur.

Aynı ayar başsız CLI çalıştırmaları için de sunulur:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Bir giriş dosyasından başlarken `openclaw infer image edit` ile de aynı `--output-format` ve `--background` bayraklarını kullanın.
`--openai-background`, OpenAI'ye özgü bir takma ad olarak kullanılmaya devam eder.

Codex OAuth kurulumlarında aynı `openai/gpt-image-2` başvurusunu koruyun. Bir `openai-codex` OAuth profili yapılandırıldığında OpenClaw, depolanan OAuth erişim belirtecini çözümler ve görsel isteklerini Codex Responses arka ucu üzerinden gönderir. Bu istek için önce `OPENAI_API_KEY` denemez veya sessizce bir API anahtarına geri dönmez. Bunun yerine doğrudan OpenAI Images API yolunu istediğinizde, API anahtarı, özel temel URL veya Azure uç noktasıyla `models.providers.openai` yapılandırmasını açıkça yapın.
Bu özel görsel uç noktası güvenilir bir LAN/özel adresteyse ayrıca `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` da ayarlayın; bu açık katılım mevcut değilse OpenClaw özel/iç OpenAI uyumlu görsel uç noktalarını engellenmiş tutar.

Oluşturun:

```
/tool image_generate model=openai/gpt-image-2 prompt="OpenClaw on macOS için cilalı bir lansman posteri" size=3840x2160 count=1
```

Şeffaf bir PNG oluşturun:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="Şeffaf arka plan üzerinde basit bir kırmızı daire çıkartması" outputFormat=png background=transparent
```

Düzenleyin:

```
/tool image_generate model=openai/gpt-image-2 prompt="Nesnenin şeklini koru, malzemeyi yarı saydam cama dönüştür" image=/path/to/reference.png size=1024x1536
```

## Video oluşturma

Paketle gelen `openai` Plugin, `video_generate` aracı üzerinden video oluşturmayı kaydeder.

| Yetenek           | Değer                                                                             |
| ----------------- | --------------------------------------------------------------------------------- |
| Varsayılan model  | `openai/sora-2`                                                                   |
| Modlar            | Metinden videoya, görselden videoya, tek videolu düzenleme                       |
| Referans girdileri | 1 görsel veya 1 video                                                            |
| Boyut geçersiz kılmaları | Desteklenir                                                               |
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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Video Oluşturma](/tr/tools/video-generation) bölümüne bakın.
</Note>

## GPT-5 istem katkısı

OpenClaw, sağlayıcılar arasında GPT-5 ailesi çalıştırmaları için paylaşılan bir GPT-5 istem katkısı ekler. Model kimliğine göre uygulanır; bu nedenle `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` ve diğer uyumlu GPT-5 başvuruları aynı katmanı alır. Eski GPT-4.x modelleri bunu almaz.

Paketle gelen yerel Codex koşum takımı, Codex uygulama sunucusu geliştirici talimatları aracılığıyla aynı GPT-5 davranışını ve Heartbeat katmanını kullanır; bu nedenle `agentRuntime.id: "codex"` üzerinden zorlanan `openai/gpt-5.x` oturumları, koşum isteminin geri kalanına Codex sahip olsa bile aynı takip etme ve proaktif Heartbeat yönlendirmesini korur.

GPT-5 katkısı; persona sürekliliği, yürütme güvenliği, araç disiplini, çıktı şekli, tamamlanma kontrolleri ve doğrulama için etiketli bir davranış sözleşmesi ekler. Kanala özgü yanıt ve sessiz mesaj davranışı, paylaşılan OpenClaw sistem isteminde ve giden teslimat politikasında kalır. GPT-5 yönlendirmesi, eşleşen modeller için her zaman etkindir. Dostça etkileşim tarzı katmanı ayrıdır ve yapılandırılabilir.

| Değer                  | Etki                                        |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (varsayılan) | Dostça etkileşim tarzı katmanını etkinleştir |
| `"on"`                 | `"friendly"` için takma ad                  |
| `"off"`                | Yalnızca dostça tarz katmanını devre dışı bırak |

<Tabs>
  <Tab title="Config">
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
Değerler çalışma zamanında büyük/küçük harfe duyarlı değildir; bu nedenle `"Off"` ve `"off"` ikisi de dostça tarz katmanını devre dışı bırakır.
</Tip>

<Note>
Paylaşılan `agents.defaults.promptOverlays.gpt5.personality` ayarı yapılmamışsa, eski `plugins.entries.openai.config.personality` hâlâ uyumluluk amaçlı geri dönüş olarak okunur.
</Note>

## Ses ve konuşma

<AccordionGroup>
  <Accordion title="Konuşma sentezi (TTS)">
    Paketle gelen `openai` Plugin, `messages.tts` yüzeyi için konuşma sentezini kaydeder.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Ses | `messages.tts.providers.openai.voice` | `coral` |
    | Hız | `messages.tts.providers.openai.speed` | (ayarlanmadı) |
    | Talimatlar | `messages.tts.providers.openai.instructions` | (ayarlanmadı, yalnızca `gpt-4o-mini-tts`) |
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
    Sohbet API uç noktasını etkilemeden TTS temel URL'sini geçersiz kılmak için `OPENAI_TTS_BASE_URL` ayarlayın.
    </Note>

  </Accordion>

  <Accordion title="Konuşmadan metne">
    Paketle gelen `openai` Plugin, OpenClaw'ın medya anlama transkripsiyon yüzeyi üzerinden toplu konuşmadan metne dönüştürmeyi kaydeder.

    - Varsayılan model: `gpt-4o-transcribe`
    - Uç nokta: OpenAI REST `/v1/audio/transcriptions`
    - Giriş yolu: çok parçalı ses dosyası yükleme
    - OpenClaw'da, gelen ses transkripsiyonunun `tools.media.audio` kullandığı her yerde desteklenir; buna Discord ses kanalı segmentleri ve kanal ses ekleri dahildir

    Gelen ses transkripsiyonu için OpenAI'yi zorlamak üzere:

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

    Dil ve istem ipuçları, paylaşılan ses medya yapılandırması veya çağrı başına transkripsiyon isteği tarafından sağlandığında OpenAI'ye iletilir.

  </Accordion>

  <Accordion title="Gerçek zamanlı transkripsiyon">
    Paketle gelen `openai` Plugin, Voice Call Plugin için gerçek zamanlı transkripsiyonu kaydeder.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Dil | `...openai.language` | (ayarlanmadı) |
    | İstem | `...openai.prompt` | (ayarlanmadı) |
    | Sessizlik süresi | `...openai.silenceDurationMs` | `800` |
    | VAD eşiği | `...openai.vadThreshold` | `0.5` |
    | API anahtarı | `...openai.apiKey` | `OPENAI_API_KEY` değerine geri döner |

    <Note>
    G.711 u-law (`g711_ulaw` / `audio/pcmu`) ses ile `wss://api.openai.com/v1/realtime` adresine bir WebSocket bağlantısı kullanır. Bu akış sağlayıcısı, Voice Call'un gerçek zamanlı transkripsiyon yolu içindir; Discord voice ise şu anda kısa segmentler kaydeder ve bunun yerine toplu `tools.media.audio` transkripsiyon yolunu kullanır.
    </Note>

  </Accordion>

  <Accordion title="Gerçek zamanlı ses">
    Paketle gelen `openai` Plugin, Voice Call Plugin için gerçek zamanlı sesi kaydeder.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Ses | `...openai.voice` | `alloy` |
    | Sıcaklık | `...openai.temperature` | `0.8` |
    | VAD eşiği | `...openai.vadThreshold` | `0.5` |
    | Sessizlik süresi | `...openai.silenceDurationMs` | `500` |
    | API anahtarı | `...openai.apiKey` | `OPENAI_API_KEY` değerine geri döner |

    <Note>
    `azureEndpoint` ve `azureDeployment` yapılandırma anahtarları üzerinden Azure OpenAI desteklenir. Çift yönlü araç çağrısını destekler. G.711 u-law ses biçimini kullanır.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI uç noktaları

Paketle gelen `openai` sağlayıcısı, temel URL'yi geçersiz kılarak görsel oluşturma için bir Azure OpenAI kaynağını hedefleyebilir. Görsel oluşturma yolunda OpenClaw, `models.providers.openai.baseUrl` üzerindeki Azure ana bilgisayar adlarını algılar ve otomatik olarak Azure'un istek biçimine geçer.

<Note>
Gerçek zamanlı ses ayrı bir yapılandırma yolu kullanır (`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`) ve `models.providers.openai.baseUrl` değerinden etkilenmez. Azure ayarları için [Ses ve konuşma](#voice-and-speech) altındaki **Gerçek zamanlı ses** akordeonuna bakın.
</Note>

Aşağıdaki durumlarda Azure OpenAI kullanın:

- Zaten bir Azure OpenAI aboneliğiniz, kotanız veya kurumsal anlaşmanız varsa
- Azure'un sağladığı bölgesel veri yerleşimi veya uyumluluk denetimlerine ihtiyacınız varsa
- Trafiği mevcut bir Azure kiracılığı içinde tutmak istiyorsanız

### Yapılandırma

Paketle gelen `openai` sağlayıcısı üzerinden Azure görsel oluşturma için `models.providers.openai.baseUrl` değerini Azure kaynağınıza yönlendirin ve `apiKey` değerini Azure OpenAI anahtarı olarak ayarlayın (OpenAI Platform anahtarı değil):

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

OpenClaw, Azure görsel oluşturma yolu için şu Azure ana bilgisayar son eklerini tanır:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Tanınan bir Azure ana bilgisayarındaki görsel oluşturma istekleri için OpenClaw:

- `Authorization: Bearer` yerine `api-key` üst bilgisini gönderir
- Dağıtım kapsamlı yollar kullanır (`/openai/deployments/{deployment}/...`)
- Her isteğe `?api-version=...` ekler
- Azure görsel oluşturma çağrıları için varsayılan olarak 600 saniyelik istek zaman aşımı kullanır. Çağrı başına `timeoutMs` değerleri yine de bu varsayılanı geçersiz kılar.

Diğer temel URL'ler (genel OpenAI, OpenAI uyumlu proxy'ler) standart OpenAI görsel istek biçimini korur.

<Note>
`openai` sağlayıcısının görsel oluşturma yolu için Azure yönlendirmesi OpenClaw 2026.4.22 veya sonrasını gerektirir. Daha eski sürümler herhangi bir özel `openai.baseUrl` değerini genel OpenAI uç noktası gibi ele alır ve Azure görsel dağıtımlarına karşı başarısız olur.
</Note>

### API sürümü

Azure görsel oluşturma yolu için belirli bir Azure önizleme veya GA sürümünü sabitlemek üzere `AZURE_OPENAI_API_VERSION` ayarlayın:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Değişken ayarlanmamışsa varsayılan `2024-12-01-preview` olur.

### Model adları dağıtım adlarıdır

Azure OpenAI, modelleri dağıtımlara bağlar. Paketle gelen `openai` sağlayıcısı üzerinden yönlendirilen Azure görsel oluşturma isteklerinde, OpenClaw'daki `model` alanı genel OpenAI model kimliği değil, Azure portalında yapılandırdığınız **Azure dağıtım adı** olmalıdır.

`gpt-image-2` sunan `gpt-image-2-prod` adlı bir dağıtım oluşturursanız:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Temiz bir poster" size=1024x1024 count=1
```

Aynı dağıtım adı kuralı, paketle gelen `openai` sağlayıcısı üzerinden yönlendirilen görsel oluşturma çağrıları için de geçerlidir.

### Bölgesel kullanılabilirlik

Azure görsel oluşturma şu anda yalnızca bölgelerin bir alt kümesinde kullanılabilir (`eastus2`, `swedencentral`, `polandcentral`, `westus3`, `uaenorth` gibi). Bir dağıtım oluşturmadan önce Microsoft'un güncel bölge listesini kontrol edin ve belirli modelin bölgenizde sunulduğunu doğrulayın.

### Parametre farkları

Azure OpenAI ile genel OpenAI her zaman aynı görsel parametrelerini kabul etmez. Azure, genel OpenAI'nin izin verdiği seçenekleri reddedebilir (örneğin `gpt-image-2` üzerinde belirli `background` değerleri) veya bunları yalnızca belirli model sürümlerinde sunabilir. Bu farklar OpenClaw'dan değil, Azure'dan ve temel modelden kaynaklanır. Bir Azure isteği doğrulama hatasıyla başarısız olursa, Azure portalında belirli dağıtımınız ve API sürümünüz tarafından desteklenen parametre kümesini kontrol edin.

<Note>
Azure OpenAI yerel aktarım ve uyumluluk davranışı kullanır ancak OpenClaw'ın gizli ilişkilendirme üst bilgilerini almaz — bkz. [Gelişmiş yapılandırma](#advanced-configuration) altındaki **Yerel ve OpenAI uyumlu yollar** akordeonu.

Azure üzerindeki sohbet veya Responses trafiği için (görsel oluşturmanın ötesinde), ilk katılım akışını veya özel bir Azure sağlayıcı yapılandırmasını kullanın — yalnızca `openai.baseUrl`, Azure API/kimlik doğrulama biçimini almaz. Ayrı bir `azure-openai-responses/*` sağlayıcısı vardır; aşağıdaki Sunucu tarafı Compaction akordeonuna bakın.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Aktarım (WebSocket ve SSE)">
    OpenClaw, hem `openai/*` hem de `openai-codex/*` için SSE geri dönüşü (`"auto"`) ile önce WebSocket kullanır.

    `"auto"` modunda OpenClaw:
    - SSE'ye geri dönmeden önce bir erken WebSocket hatasını yeniden dener
    - Bir hatadan sonra WebSocket'i yaklaşık 60 saniye boyunca bozulmuş olarak işaretler ve soğuma süresi boyunca SSE kullanır
    - Yeniden denemeler ve yeniden bağlantılar için kararlı oturum ve sıra kimliği üst bilgileri ekler
    - Aktarım varyantları arasında kullanım sayaçlarını (`input_tokens` / `prompt_tokens`) normalize eder

    | Değer | Davranış |
    |-------|----------|
    | `"auto"` (varsayılan) | Önce WebSocket, SSE geri dönüşü |
    | `"sse"` | Yalnızca SSE'yi zorla |
    | `"websocket"` | Yalnızca WebSocket'i zorla |

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

  <Accordion title="WebSocket ön ısınması">
    OpenClaw, ilk sıra gecikmesini azaltmak için `openai/*` ve `openai-codex/*` için varsayılan olarak WebSocket ön ısınmasını etkinleştirir.

    ```json5
    // Ön ısınmayı devre dışı bırak
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

    Etkinleştirildiğinde OpenClaw, hızlı modu OpenAI öncelikli işlemeye eşler (`service_tier = "priority"`). Mevcut `service_tier` değerleri korunur ve hızlı mod `reasoning` veya `text.verbosity` değerlerini yeniden yazmaz.

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
    OpenAI API'si, `service_tier` aracılığıyla öncelikli işlemeyi sunar. OpenClaw'da bunu model başına ayarlayın:

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
    `serviceTier` yalnızca yerel OpenAI uç noktalarına (`api.openai.com`) ve yerel Codex uç noktalarına (`chatgpt.com/backend-api`) iletilir. Her iki sağlayıcıyı da bir proxy üzerinden yönlendirirseniz OpenClaw, `service_tier` değerini olduğu gibi bırakır.
    </Warning>

  </Accordion>

  <Accordion title="Sunucu tarafı Compaction (Responses API)">
    Doğrudan OpenAI Responses modelleri için (`api.openai.com` üzerindeki `openai/*`), OpenAI Plugin'in Pi koşum takımı akış sarmalayıcısı sunucu tarafı Compaction özelliğini otomatik olarak etkinleştirir:

    - `store: true` zorlanır (`supportsStore: false` ayarlayan model uyumluluğu yoksa)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` eklenir
    - Varsayılan `compact_threshold`: `contextWindow` değerinin %70'i (veya kullanılamıyorsa `80000`)

    Bu, yerleşik Pi koşum takımı yoluna ve gömülü çalıştırmalar tarafından kullanılan OpenAI sağlayıcı kancalarına uygulanır. Yerel Codex uygulama sunucusu koşum takımı kendi bağlamını Codex üzerinden yönetir ve ayrı olarak `agents.defaults.agentRuntime.id` ile yapılandırılır.

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
    `responsesServerCompaction` yalnızca `context_management` eklemeyi denetler. Doğrudan OpenAI Responses modelleri, uyumluluk `supportsStore: false` ayarlamadığı sürece yine de `store: true` zorlar.
    </Note>

  </Accordion>

  <Accordion title="Katı aracısal GPT modu">
    `openai/*` üzerindeki GPT-5 ailesi çalıştırmaları için OpenClaw daha katı bir gömülü yürütme sözleşmesi kullanabilir:

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
    - Araç eylemi mevcut olduğunda yalnızca plan içeren bir sırayı artık başarılı ilerleme olarak değerlendirmez
    - Sırayı şimdi-eylem et yönlendirmesiyle yeniden dener
    - Önemli işler için `update_plan` özelliğini otomatik olarak etkinleştirir
    - Model hareket etmeden plan yapmaya devam ederse açık bir engellendi durumu gösterir

    <Note>
    Yalnızca OpenAI ve Codex GPT-5 ailesi çalıştırmalarıyla sınırlıdır. Diğer sağlayıcılar ve eski model aileleri varsayılan davranışı korur.
    </Note>

  </Accordion>

  <Accordion title="Yerel ve OpenAI uyumlu yollar">
    OpenClaw, doğrudan OpenAI, Codex ve Azure OpenAI uç noktalarını genel OpenAI uyumlu `/v1` proxy'lerinden farklı ele alır:

    **Yerel yollar** (`openai/*`, Azure OpenAI):
    - `reasoning: { effort: "none" }` değerini yalnızca OpenAI `none` effort seçeneğini destekleyen modeller için korur
    - `reasoning.effort: "none"` değerini reddeden modeller veya proxy'ler için devre dışı bırakılmış reasoning alanını çıkarır
    - Araç şemalarını varsayılan olarak katı moda ayarlar
    - Gizli ilişkilendirme üst bilgilerini yalnızca doğrulanmış yerel ana bilgisayarlara ekler
    - OpenAI'ye özgü istek şekillendirmesini korur (`service_tier`, `store`, reasoning uyumluluğu, prompt önbelleği ipuçları)

    **Proxy/uyumlu yollar:**
    - Daha gevşek uyumluluk davranışı kullanır
    - Yerel olmayan `openai-completions` yüklerinden Completions `store` alanını çıkarır
    - OpenAI uyumlu Completions proxy'leri için gelişmiş `params.extra_body`/`params.extraBody` geçişli JSON'u kabul eder
    - vLLM gibi OpenAI uyumlu Completions proxy'leri için `params.chat_template_kwargs` kabul eder
    - Katı araç şemalarını veya yalnızca yerel üst bilgileri zorlamaz

    Azure OpenAI yerel aktarım ve uyumluluk davranışı kullanır ancak gizli ilişkilendirme üst bilgilerini almaz.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve yük devretme davranışını seçme.
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

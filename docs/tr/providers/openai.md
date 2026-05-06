---
read_when:
    - OpenClaw’da OpenAI modellerini kullanmak istiyorsunuz
    - API anahtarları yerine Codex abonelik kimlik doğrulaması istiyorsunuz
    - Daha sıkı GPT-5 ajan yürütme davranışına ihtiyacınız var
summary: OpenClaw'da OpenAI'ı API anahtarları veya Codex aboneliği aracılığıyla kullanın
title: OpenAI
x-i18n:
    generated_at: "2026-05-06T19:35:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fda2acdb0e249f0481ab1aa20bb5ff317709bc9536f60c45be9e2d63c44702e
    source_path: providers/openai.md
    workflow: 16
---

OpenAI, GPT modelleri için geliştirici API'leri sağlar ve Codex, OpenAI'ın Codex istemcileri üzerinden ChatGPT planı kapsamındaki bir kodlama ajanı olarak da kullanılabilir. OpenClaw, yapılandırmanın öngörülebilir kalması için bu yüzeyleri ayrı tutar.

OpenClaw üç OpenAI ailesi rotasını destekler. Codex davranışı isteyen çoğu ChatGPT/Codex abonesi, yerel Codex uygulama sunucusu çalışma zamanını kullanmalıdır. Model öneki sağlayıcı/model adını seçer; ayrı bir çalışma zamanı ayarı ise gömülü ajan döngüsünü kimin yürüteceğini seçer:

- **API anahtarı** - kullanıma dayalı faturalandırma ile doğrudan OpenAI Platform erişimi (`openai/*` modelleri)
- **Yerel Codex çalışma zamanı ile Codex aboneliği** - ChatGPT/Codex oturum açma ve Codex uygulama sunucusu yürütmesi (`openai/*` modelleri artı `agents.defaults.agentRuntime.id: "codex"`)
- **PI üzerinden Codex aboneliği** - normal OpenClaw PI çalıştırıcısı ile ChatGPT/Codex oturum açma (`openai-codex/*` modelleri)

OpenAI, OpenClaw gibi harici araçlarda ve iş akışlarında abonelik OAuth kullanımını açıkça destekler.

Sağlayıcı, model, çalışma zamanı ve kanal ayrı katmanlardır. Bu etiketler birbirine karışıyorsa, yapılandırmayı değiştirmeden önce [Ajan çalışma zamanları](/tr/concepts/agent-runtimes) bölümünü okuyun.

## Hızlı seçim

| Amaç                                                 | Kullanım                                         | Notlar                                                                    |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| Yerel Codex çalışma zamanı ile ChatGPT/Codex aboneliği | `openai/gpt-5.5` artı `agentRuntime.id: "codex"` | Çoğu kullanıcı için önerilen Codex kurulumu. `openai-codex` kimlik doğrulamasıyla oturum açın. |
| Doğrudan API anahtarı faturalandırması               | `openai/gpt-5.5`                                 | `OPENAI_API_KEY` ayarlayın veya OpenAI API anahtarı başlangıç kurulumunu çalıştırın. |
| PI üzerinden ChatGPT/Codex aboneliği kimlik doğrulaması | `openai-codex/gpt-5.5`                           | Yalnızca normal PI çalıştırıcısını özellikle istediğinizde kullanın.      |
| Görsel üretme veya düzenleme                         | `openai/gpt-image-2`                             | `OPENAI_API_KEY` veya OpenAI Codex OAuth ile çalışır.                     |
| Saydam arka planlı görseller                         | `openai/gpt-image-1.5`                           | `outputFormat=png` veya `webp` ve `openai.background=transparent` kullanın. |

## Adlandırma haritası

Adlar benzerdir ancak birbirinin yerine kullanılamaz:

| Gördüğünüz ad                     | Katman            | Anlam                                                                                             |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Sağlayıcı öneki   | Doğrudan OpenAI Platform API rotası.                                                              |
| `openai-codex`                     | Sağlayıcı öneki   | Normal OpenClaw PI çalıştırıcısı üzerinden OpenAI Codex OAuth/abonelik rotası.                    |
| `codex` Plugin                     | Plugin            | Yerel Codex uygulama sunucusu çalışma zamanı ve `/codex` sohbet denetimleri sağlayan paketli OpenClaw Plugin'i. |
| `agentRuntime.id: codex`           | Ajan çalışma zamanı | Gömülü dönüşler için yerel Codex uygulama sunucusu altyapısını zorunlu kılar.                     |
| `/codex ...`                       | Sohbet komut kümesi | Bir konuşmadan Codex uygulama sunucusu iş parçacıklarını bağlar/denetler.                         |
| `runtime: "acp", agentId: "codex"` | ACP oturum rotası | Codex'i ACP/acpx üzerinden çalıştıran açık yedek yol.                                             |

Bu, bir yapılandırmanın bilinçli olarak hem `openai-codex/*` hem de `codex` Plugin'ini içerebileceği anlamına gelir. PI üzerinden Codex OAuth kullanmak ve aynı zamanda yerel `/codex` sohbet denetimlerinin kullanılabilir olmasını istediğinizde bu geçerlidir. `openclaw doctor` bu birleşim hakkında uyarır; böylece bunun bilinçli olduğunu doğrulayabilirsiniz, ancak onu yeniden yazmaz.

<Note>
GPT-5.5 hem doğrudan OpenAI Platform API anahtarı erişimi hem de abonelik/OAuth rotaları üzerinden kullanılabilir. ChatGPT/Codex aboneliği artı yerel Codex yürütmesi için `agentRuntime.id: "codex"` ile `openai/gpt-5.5` kullanın. PI üzerinden Codex OAuth için yalnızca `openai-codex/gpt-5.5` kullanın; doğrudan `OPENAI_API_KEY` trafiği için Codex çalışma zamanı geçersiz kılması olmadan `openai/gpt-5.5` kullanın.
</Note>

<Note>
OpenAI Plugin'ini etkinleştirmek veya bir `openai-codex/*` modeli seçmek, paketli Codex uygulama sunucusu Plugin'ini etkinleştirmez. OpenClaw bu Plugin'i yalnızca yerel Codex altyapısını `agentRuntime.id: "codex"` ile açıkça seçtiğinizde veya eski bir `codex/*` model başvurusu kullandığınızda etkinleştirir.
Paketli `codex` Plugin'i etkin olsa ancak `openai-codex/*` hâlâ PI üzerinden çözümleniyorsa, `openclaw doctor` uyarır ve rotayı değiştirmeden bırakır.
</Note>

## OpenClaw özellik kapsamı

| OpenAI yeteneği          | OpenClaw yüzeyi                                            | Durum                                                  |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Sohbet / Responses        | `openai/<model>` model sağlayıcısı                         | Evet                                                   |
| Codex abonelik modelleri  | `openai-codex/<model>` ile `openai-codex` OAuth            | Evet                                                   |
| Codex uygulama sunucusu altyapısı | `openai/<model>` ile `agentRuntime.id: codex`       | Evet                                                   |
| Sunucu tarafı web araması | Yerel OpenAI Responses aracı                               | Evet, web araması etkinse ve sağlayıcı sabitlenmemişse |
| Görseller                 | `image_generate`                                           | Evet                                                   |
| Videolar                  | `video_generate`                                           | Evet                                                   |
| Metinden sese             | `messages.tts.provider: "openai"` / `tts`                  | Evet                                                   |
| Toplu konuşmadan metne    | `tools.media.audio` / medya anlama                         | Evet                                                   |
| Akışlı konuşmadan metne   | Voice Call `streaming.provider: "openai"`                  | Evet                                                   |
| Gerçek zamanlı ses        | Voice Call `realtime.provider: "openai"` / Control UI Talk | Evet                                                   |
| Embedding'ler             | bellek embedding sağlayıcısı                               | Evet                                                   |

## Bellek embedding'leri

OpenClaw, `memory_search` dizinleme ve sorgu embedding'leri için OpenAI veya OpenAI uyumlu bir embedding uç noktası kullanabilir:

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

Asimetrik embedding etiketleri gerektiren OpenAI uyumlu uç noktalar için `memorySearch` altında `queryInputType` ve `documentInputType` ayarlayın. OpenClaw bunları sağlayıcıya özgü `input_type` istek alanları olarak iletir: sorgu embedding'leri `queryInputType` kullanır; dizinlenmiş bellek parçaları ve toplu dizinleme `documentInputType` kullanır. Tam örnek için [Bellek yapılandırma başvurusu](/tr/reference/memory-config#provider-specific-config) bölümüne bakın.

## Başlarken

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="API anahtarı (OpenAI Platform)">
    **En uygunu:** doğrudan API erişimi ve kullanıma dayalı faturalandırma.

    <Steps>
      <Step title="API anahtarınızı alın">
        [OpenAI Platform panosundan](https://platform.openai.com/api-keys) bir API anahtarı oluşturun veya kopyalayın.
      </Step>
      <Step title="Başlangıç kurulumunu çalıştırın">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Ya da anahtarı doğrudan geçirin:

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
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Codex uygulama sunucusu altyapısı | Codex uygulama sunucusu |

    <Note>
    `openai/*`, Codex uygulama sunucusu altyapısını açıkça zorunlu kılmadığınız sürece doğrudan OpenAI API anahtarı rotasıdır. Varsayılan PI çalıştırıcısı üzerinden Codex OAuth için `openai-codex/*` kullanın veya yerel Codex uygulama sunucusu yürütmesi için `agentRuntime.id: "codex"` ile `openai/gpt-5.5` kullanın.
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
    **En uygunu:** ayrı bir API anahtarı yerine ChatGPT/Codex aboneliğinizi yerel Codex uygulama sunucusu yürütmesiyle kullanmak. Codex bulutu ChatGPT oturumu gerektirir.

    <Steps>
      <Step title="Codex OAuth çalıştırın">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Ya da OAuth'u doğrudan çalıştırın:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Headless veya geri çağrıya elverişsiz kurulumlar için localhost tarayıcı geri çağrısı yerine ChatGPT cihaz kodu akışıyla oturum açmak üzere `--device-code` ekleyin:

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
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Yerel Codex uygulama sunucusu altyapısı | Codex oturumu veya seçili `openai-codex` profili |
    | `openai-codex/gpt-5.5` | atlanmış / `runtime: "pi"` | PI üzerinden ChatGPT/Codex OAuth | Codex oturumu |
    | `openai-codex/gpt-5.4-mini` | atlanmış / `runtime: "pi"` | PI üzerinden ChatGPT/Codex OAuth | Codex oturumu |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Bir Plugin açıkça `openai-codex` üstlenmedikçe hâlâ PI | Codex oturumu |

    <Warning>
    Eski `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` veya `openai-codex/gpt-5.3*` model başvurularını yapılandırmayın. ChatGPT/Codex OAuth hesapları artık bu modelleri reddediyor. PI OAuth rotası için `openai-codex/gpt-5.5` kullanın veya yerel Codex çalışma zamanı yürütmesi için `agentRuntime.id: "codex"` ile `openai/gpt-5.5` kullanın.
    </Warning>

    <Note>
    Kimlik doğrulama/profil komutları için `openai-codex` sağlayıcı kimliğini kullanmaya devam edin.
    `openai-codex/*` model öneki de Codex OAuth için açık PI rotasıdır.
    Paketlenmiş Codex uygulama-sunucusu düzeneğini seçmez veya otomatik etkinleştirmez. Yaygın abonelik artı yerel çalışma zamanı kurulumu için
    `openai-codex` ile oturum açın ancak model başvurusunu `openai/gpt-5.5` olarak tutun ve
    `agentRuntime.id: "codex"` ayarlayın.
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

    Bunun yerine Codex OAuth'u normal PI çalıştırıcısında tutmak için
    `openai-codex/gpt-5.5` kullanın ve Codex çalışma zamanı geçersiz kılmasını atlayın.

    <Note>
    İlk kurulum artık `~/.codex` konumundan OAuth materyali içe aktarmaz. Tarayıcı OAuth'u (varsayılan) veya yukarıdaki cihaz kodu akışıyla oturum açın; OpenClaw oluşan kimlik bilgilerini kendi agent kimlik doğrulama deposunda yönetir.
    </Note>

    ### Codex OAuth yönlendirmesini denetleme ve kurtarma

    Varsayılan agent'ınızın hangi modeli, çalışma zamanını ve kimlik doğrulama rotasını
    kullandığını görmek için şu komutları kullanın:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get agents.defaults.agentRuntime --json
    ```

    Belirli bir agent için `--agent <id>` ekleyin:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    Bir 2026.5.5 `doctor --fix` çalıştırması bir GPT-5.5 abonelik kurulumunu
    `openai-codex/gpt-5.5` değerinden `openai/gpt-5.5` değerine değiştirdiyse, varsayılan agent'ı yeniden
    Codex OAuth PI rotasına geçirin:

    ```bash
    openclaw models set openai-codex/gpt-5.5
    openclaw config validate
    ```

    `models auth list --provider openai-codex` kullanılabilir profil göstermiyorsa, yeniden
    oturum açın:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex/*`, PI üzerinden ChatGPT/Codex OAuth anlamına gelir. `agentRuntime.id: "codex"` ile
    `openai/*`, yerel Codex uygulama-sunucusu yürütmesi anlamına gelir.

    ### Durum göstergesi

    Chat `/status`, geçerli oturum için hangi model çalışma zamanının etkin olduğunu gösterir.
    Varsayılan PI düzeneği `Runtime: OpenClaw Pi Default` olarak görünür. Paketlenmiş
    Codex uygulama-sunucusu düzeneği seçildiğinde, `/status`
    `Runtime: OpenAI Codex` gösterir. Mevcut oturumlar kaydedilmiş düzenek kimliklerini korur; bu nedenle
    `agentRuntime` değiştirildikten sonra `/status` değerinin yeni bir PI/Codex seçimini
    yansıtmasını istiyorsanız `/new` veya `/reset` kullanın.

    ### Doctor uyarısı

    Paketlenmiş `codex` Plugin etkinleştirilmişken bir `openai-codex/*` rotası
    seçiliyse, `openclaw doctor` modelin hâlâ PI üzerinden çözümlendiğine dair uyarır.
    Yapılandırmayı yalnızca bu PI abonelik-kimlik doğrulama rotası
    bilinçli ise değiştirmeden bırakın. Yerel Codex uygulama-sunucusu yürütmesi istediğinizde
    `openai/<model>` artı `agentRuntime.id: "codex"` değerine geçin.

    ### Bağlam penceresi sınırı

    OpenClaw model meta verilerini ve çalışma zamanı bağlam sınırını ayrı değerler olarak ele alır.

    Codex OAuth üzerinden `openai-codex/gpt-5.5` için:

    - Yerel `contextWindow`: `1000000`
    - Varsayılan çalışma zamanı `contextTokens` sınırı: `272000`

    Daha küçük varsayılan sınır pratikte daha iyi gecikme ve kalite özellikleri sağlar. Bunu `contextTokens` ile geçersiz kılın:

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

    OpenClaw, mevcut olduğunda `gpt-5.5` için yukarı akış Codex katalog meta verilerini
    kullanır. Hesap kimliği doğrulanmışken canlı Codex keşfi `openai-codex/gpt-5.5` satırını
    atlıyorsa, OpenClaw bu OAuth model satırını sentezler; böylece
    cron, alt agent ve yapılandırılmış varsayılan model çalıştırmaları
    `Unknown model` ile başarısız olmaz.

  </Tab>
</Tabs>

## Yerel Codex uygulama-sunucusu kimlik doğrulaması

Yerel Codex uygulama-sunucusu düzeneği `openai/*` model başvuruları artı
`agentRuntime.id: "codex"` kullanır, ancak kimlik doğrulaması hâlâ hesap tabanlıdır. OpenClaw
kimlik doğrulamayı şu sırayla seçer:

1. Agent'a bağlı açık bir OpenClaw `openai-codex` kimlik doğrulama profili.
2. Uygulama sunucusunun mevcut hesabı, örneğin yerel bir Codex CLI ChatGPT oturumu.
3. Yalnızca yerel stdio uygulama-sunucusu başlatmaları için, uygulama sunucusu hesap bildirmediğinde ve hâlâ
   OpenAI kimlik doğrulaması gerektirdiğinde `CODEX_API_KEY`, ardından
   `OPENAI_API_KEY`.

Bu, Gateway işlemi doğrudan OpenAI modelleri veya embeddings için `OPENAI_API_KEY` değerine de sahip diye yerel ChatGPT/Codex abonelik oturumunun değiştirilmediği anlamına gelir.
Env API anahtarı geri dönüşü yalnızca yerel stdio hesapsız yoludur; WebSocket uygulama-sunucusu bağlantılarına gönderilmez. Abonelik tarzı bir Codex profili seçildiğinde, OpenClaw ayrıca `CODEX_API_KEY` ve `OPENAI_API_KEY` değerlerini oluşturulan stdio uygulama-sunucusu alt işleminden uzak tutar ve seçilen kimlik bilgilerini uygulama-sunucusu oturum açma RPC'si üzerinden gönderir.

## Görüntü oluşturma

Paketlenmiş `openai` Plugin, `image_generate` aracı üzerinden görüntü oluşturmayı kaydeder.
Aynı `openai/gpt-image-2` model başvurusu üzerinden hem OpenAI API anahtarlı görüntü oluşturmayı hem de Codex OAuth görüntü oluşturmayı destekler.

| Yetenek                  | OpenAI API anahtarı                | Codex OAuth                          |
| ------------------------ | ---------------------------------- | ------------------------------------ |
| Model başvurusu          | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Kimlik doğrulama         | `OPENAI_API_KEY`                   | OpenAI Codex OAuth oturumu           |
| Aktarım                  | OpenAI Images API                  | Codex Responses arka ucu             |
| İstek başına en çok görüntü | 4                               | 4                                    |
| Düzenleme modu           | Etkin (en fazla 5 referans görüntü) | Etkin (en fazla 5 referans görüntü)  |
| Boyut geçersiz kılmaları | Desteklenir, 2K/4K boyutları dahil | Desteklenir, 2K/4K boyutları dahil   |
| En-boy oranı / çözünürlük | OpenAI Images API'ye iletilmez    | Güvenli olduğunda desteklenen bir boyuta eşlenir |

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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Görüntü Oluşturma](/tr/tools/image-generation) bölümüne bakın.
</Note>

`gpt-image-2`, hem OpenAI metinden görüntü oluşturma hem de görüntü
düzenleme için varsayılandır. `gpt-image-1.5`, `gpt-image-1` ve `gpt-image-1-mini` açık model geçersiz kılmaları olarak
kullanılabilir kalır. Saydam arka planlı
PNG/WebP çıktısı için `openai/gpt-image-1.5` kullanın; geçerli `gpt-image-2` API'si
`background: "transparent"` değerini reddeder.

Saydam arka plan isteği için, agent'lar `image_generate` aracını
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` veya `"webp"` ve
`background: "transparent"` ile çağırmalıdır; eski `openai.background` sağlayıcı seçeneği
hâlâ kabul edilir. OpenClaw ayrıca varsayılan `openai/gpt-image-2` saydam
isteklerini `gpt-image-1.5` değerine yeniden yazarak genel OpenAI ve
OpenAI Codex OAuth rotalarını korur; Azure ve özel OpenAI uyumlu uç noktalar
yapılandırılmış dağıtım/model adlarını korur.

Aynı ayar başsız CLI çalıştırmaları için de sunulur:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Bir girdi dosyasından başlarken
`openclaw infer image edit` ile aynı `--output-format` ve `--background` bayraklarını kullanın.
`--openai-background`, OpenAI'ye özgü bir takma ad olarak kullanılabilir kalır.

Codex OAuth kurulumları için aynı `openai/gpt-image-2` başvurusunu koruyun. Bir
`openai-codex` OAuth profili yapılandırıldığında, OpenClaw depolanan OAuth
erişim jetonunu çözer ve görüntü isteklerini Codex Responses arka ucu üzerinden gönderir. O
istek için önce `OPENAI_API_KEY` denemez veya sessizce bir API anahtarına geri dönülmez. Bunun yerine doğrudan OpenAI Images API
rotasını istediğinizde `models.providers.openai` değerini bir API anahtarı,
özel temel URL veya Azure uç noktasıyla açıkça yapılandırın.
Bu özel görüntü uç noktası güvenilir bir LAN/özel adresteyse, ayrıca
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ayarlayın; OpenClaw
özel/dahili OpenAI uyumlu görüntü uç noktalarını bu tercih mevcut değilse
engellenmiş tutar.

Oluştur:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Saydam bir PNG oluştur:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Düzenle:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Video oluşturma

Paketlenmiş `openai` Plugin, `video_generate` aracı üzerinden video oluşturmayı kaydeder.

| Yetenek           | Değer                                                                             |
| ----------------- | --------------------------------------------------------------------------------- |
| Varsayılan model  | `openai/sora-2`                                                                   |
| Modlar            | Metinden videoya, görüntüden videoya, tek video düzenleme                         |
| Referans girdileri | 1 görüntü veya 1 video                                                           |
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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Video Oluşturma](/tr/tools/video-generation) bölümüne bakın.
</Note>

## GPT-5 prompt katkısı

OpenClaw, sağlayıcılar genelinde GPT-5 ailesi çalıştırmaları için paylaşılan bir GPT-5 prompt katkısı ekler. Model kimliğine göre uygulanır; bu nedenle `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` ve diğer uyumlu GPT-5 başvuruları aynı katmanı alır. Eski GPT-4.x modeller almaz.

Paketlenmiş yerel Codex düzeneği, Codex uygulama-sunucusu geliştirici talimatları üzerinden aynı GPT-5 davranışını ve heartbeat katmanını kullanır; böylece `agentRuntime.id: "codex"` üzerinden zorlanan `openai/gpt-5.x` oturumları, düzeneğin geri kalan prompt'una Codex sahip olsa bile aynı takip ve proaktif heartbeat rehberliğini korur.

GPT-5 katkısı persona kalıcılığı, yürütme güvenliği, araç disiplini, çıktı biçimi, tamamlama denetimleri ve doğrulama için etiketlenmiş bir davranış sözleşmesi ekler. Kanala özgü yanıt ve sessiz ileti davranışı paylaşılan OpenClaw sistem prompt'unda ve giden teslim ilkesinde kalır. GPT-5 rehberliği eşleşen modeller için her zaman etkindir. Dostane etkileşim tarzı katmanı ayrıdır ve yapılandırılabilir.

| Değer                  | Etki                                      |
| ---------------------- | ----------------------------------------- |
| `"friendly"` (varsayılan) | Dostane etkileşim tarzı katmanını etkinleştir |
| `"on"`                 | `"friendly"` için takma ad                |
| `"off"`                | Yalnızca dostane tarz katmanını devre dışı bırak |

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
Değerler çalışma zamanında büyük/küçük harfe duyarlı değildir; bu nedenle `"Off"` ve `"off"` değerlerinin ikisi de dostça stil katmanını devre dışı bırakır.
</Tip>

<Note>
Eski `plugins.entries.openai.config.personality`, paylaşılan `agents.defaults.promptOverlays.gpt5.personality` ayarı belirlenmediğinde uyumluluk geri dönüşü olarak hâlâ okunur.
</Note>

## Ses ve konuşma

<AccordionGroup>
  <Accordion title="Konuşma sentezi (TTS)">
    Birlikte gelen `openai` Plugin'i, `messages.tts` yüzeyi için konuşma sentezini kaydeder.

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
    Sohbet API uç noktasını etkilemeden TTS temel URL'sini geçersiz kılmak için `OPENAI_TTS_BASE_URL` ayarını yapın.
    </Note>

  </Accordion>

  <Accordion title="Konuşmadan metne">
    Birlikte gelen `openai` Plugin'i, OpenClaw'ın medya anlama transkripsiyon yüzeyi üzerinden toplu konuşmadan metne özelliğini kaydeder.

    - Varsayılan model: `gpt-4o-transcribe`
    - Uç nokta: OpenAI REST `/v1/audio/transcriptions`
    - Giriş yolu: çok parçalı ses dosyası yükleme
    - Gelen ses transkripsiyonunun `tools.media.audio` kullandığı her yerde OpenClaw tarafından desteklenir; buna Discord ses kanalı segmentleri ve kanal ses ekleri dahildir

    Gelen ses transkripsiyonu için OpenAI'ı zorlamak üzere:

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
    Birlikte gelen `openai` Plugin'i, Voice Call Plugin için gerçek zamanlı transkripsiyonu kaydeder.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Dil | `...openai.language` | (ayarlanmamış) |
    | İstem | `...openai.prompt` | (ayarlanmamış) |
    | Sessizlik süresi | `...openai.silenceDurationMs` | `800` |
    | VAD eşiği | `...openai.vadThreshold` | `0.5` |
    | API anahtarı | `...openai.apiKey` | `OPENAI_API_KEY` değerine geri döner |

    <Note>
    G.711 u-law (`g711_ulaw` / `audio/pcmu`) sesiyle `wss://api.openai.com/v1/realtime` adresine bir WebSocket bağlantısı kullanır. Bu akış sağlayıcısı, Voice Call'ın gerçek zamanlı transkripsiyon yolu içindir; Discord sesi şu anda kısa segmentler kaydeder ve bunun yerine toplu `tools.media.audio` transkripsiyon yolunu kullanır.
    </Note>

  </Accordion>

  <Accordion title="Gerçek zamanlı ses">
    Birlikte gelen `openai` Plugin'i, Voice Call Plugin için gerçek zamanlı sesi kaydeder.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Ses | `...openai.voice` | `alloy` |
    | Sıcaklık | `...openai.temperature` | `0.8` |
    | VAD eşiği | `...openai.vadThreshold` | `0.5` |
    | Sessizlik süresi | `...openai.silenceDurationMs` | `500` |
    | API anahtarı | `...openai.apiKey` | `OPENAI_API_KEY` değerine geri döner |

    <Note>
    Arka uç gerçek zamanlı köprüleri için `azureEndpoint` ve `azureDeployment` yapılandırma anahtarları üzerinden Azure OpenAI'ı destekler. Çift yönlü araç çağırmayı destekler. G.711 u-law ses biçimini kullanır.
    </Note>

    <Note>
    Control UI Talk, Gateway tarafından basılmış geçici bir istemci sırrı ve OpenAI Realtime API'ye karşı doğrudan tarayıcı WebRTC SDP alışverişiyle OpenAI tarayıcı gerçek zamanlı oturumlarını kullanır. Bakımcı canlı doğrulaması `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` ile kullanılabilir; OpenAI ayağı Node içinde bir istemci sırrı basar, sahte mikrofon medyasıyla bir tarayıcı SDP teklifi oluşturur, bunu OpenAI'a gönderir ve sırları günlüğe kaydetmeden SDP yanıtını uygular.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI uç noktaları

Birlikte gelen `openai` sağlayıcısı, temel URL'yi geçersiz kılarak görüntü oluşturma için bir Azure OpenAI kaynağını hedefleyebilir. Görüntü oluşturma yolunda OpenClaw, `models.providers.openai.baseUrl` üzerindeki Azure ana makine adlarını algılar ve otomatik olarak Azure'ın istek şekline geçer.

<Note>
Gerçek zamanlı ses ayrı bir yapılandırma yolu kullanır (`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`) ve `models.providers.openai.baseUrl` tarafından etkilenmez. Azure ayarları için [Ses ve konuşma](#voice-and-speech) altındaki **Gerçek zamanlı ses** akordeonuna bakın.
</Note>

Şu durumlarda Azure OpenAI kullanın:

- Zaten bir Azure OpenAI aboneliğiniz, kotanız veya kurumsal anlaşmanız varsa
- Azure'ın sağladığı bölgesel veri yerleşimi veya uyumluluk denetimlerine ihtiyacınız varsa
- Trafiği mevcut bir Azure kiracısı içinde tutmak istiyorsanız

### Yapılandırma

Birlikte gelen `openai` sağlayıcısı üzerinden Azure görüntü oluşturma için `models.providers.openai.baseUrl` değerini Azure kaynağınıza yönlendirin ve `apiKey` değerini Azure OpenAI anahtarına ayarlayın (OpenAI Platform anahtarı değil):

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

OpenClaw, Azure görüntü oluşturma rotası için şu Azure ana makine soneklerini tanır:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Tanınan bir Azure ana makinesindeki görüntü oluşturma isteklerinde OpenClaw:

- `Authorization: Bearer` yerine `api-key` başlığını gönderir
- Dağıtım kapsamlı yolları (`/openai/deployments/{deployment}/...`) kullanır
- Her isteğe `?api-version=...` ekler
- Azure görüntü oluşturma çağrıları için 600 sn varsayılan istek zaman aşımı kullanır.
  Çağrı başına `timeoutMs` değerleri bu varsayılanı yine de geçersiz kılar.

Diğer temel URL'ler (genel OpenAI, OpenAI uyumlu proxy'ler) standart OpenAI görüntü isteği şeklini korur.

<Note>
`openai` sağlayıcısının görüntü oluşturma yolu için Azure yönlendirmesi OpenClaw 2026.4.22 veya daha yeni bir sürüm gerektirir. Daha eski sürümler, özel `openai.baseUrl` değerlerini genel OpenAI uç noktası gibi ele alır ve Azure görüntü dağıtımlarında başarısız olur.
</Note>

### API sürümü

Azure görüntü oluşturma yolu için belirli bir Azure önizleme veya GA sürümünü sabitlemek üzere `AZURE_OPENAI_API_VERSION` ayarını yapın:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Değişken ayarlanmamışsa varsayılan `2024-12-01-preview` olur.

### Model adları dağıtım adlarıdır

Azure OpenAI, modelleri dağıtımlara bağlar. Birlikte gelen `openai` sağlayıcısı üzerinden yönlendirilen Azure görüntü oluşturma isteklerinde OpenClaw'daki `model` alanı, genel OpenAI model kimliği değil, Azure portalında yapılandırdığınız **Azure dağıtım adı** olmalıdır.

`gpt-image-2` sunan `gpt-image-2-prod` adlı bir dağıtım oluşturursanız:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Aynı dağıtım adı kuralı, birlikte gelen `openai` sağlayıcısı üzerinden yönlendirilen görüntü oluşturma çağrıları için de geçerlidir.

### Bölgesel kullanılabilirlik

Azure görüntü oluşturma şu anda yalnızca bölgelerin bir alt kümesinde kullanılabilir (örneğin `eastus2`, `swedencentral`, `polandcentral`, `westus3`, `uaenorth`). Bir dağıtım oluşturmadan önce Microsoft'un güncel bölge listesini kontrol edin ve ilgili modelin bölgenizde sunulduğunu doğrulayın.

### Parametre farklılıkları

Azure OpenAI ve genel OpenAI her zaman aynı görüntü parametrelerini kabul etmez. Azure, genel OpenAI'ın izin verdiği seçenekleri reddedebilir (örneğin `gpt-image-2` üzerindeki belirli `background` değerleri) veya bunları yalnızca belirli model sürümlerinde sunabilir. Bu farklılıklar OpenClaw'dan değil, Azure'dan ve alttaki modelden kaynaklanır. Bir Azure isteği doğrulama hatasıyla başarısız olursa Azure portalında belirli dağıtımınız ve API sürümünüz tarafından desteklenen parametre kümesini kontrol edin.

<Note>
Azure OpenAI, yerel aktarımı ve uyumluluk davranışını kullanır ancak OpenClaw'ın gizli ilişkilendirme başlıklarını almaz — [Gelişmiş yapılandırma](#advanced-configuration) altındaki **Yerel ve OpenAI uyumlu rotalar** akordeonuna bakın.

Azure üzerindeki sohbet veya Responses trafiği için (görüntü oluşturmanın ötesinde), onboarding akışını veya özel bir Azure sağlayıcı yapılandırmasını kullanın — yalnızca `openai.baseUrl` Azure API/kimlik doğrulama şeklini devralmaz. Ayrı bir `azure-openai-responses/*` sağlayıcısı vardır; aşağıdaki Sunucu tarafı compaction akordeonuna bakın.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Aktarım (WebSocket ve SSE)">
    OpenClaw, hem `openai/*` hem de `openai-codex/*` için SSE geri dönüşüyle (`"auto"`) WebSocket öncelikli kullanır.

    `"auto"` modunda OpenClaw:
    - SSE'ye geri dönmeden önce erken bir WebSocket hatasını bir kez yeniden dener
    - Bir hatadan sonra WebSocket'i yaklaşık 60 saniye bozulmuş olarak işaretler ve soğuma sırasında SSE kullanır
    - Yeniden denemeler ve yeniden bağlantılar için kararlı oturum ve turn kimliği başlıkları ekler
    - Aktarım varyantları genelinde kullanım sayaçlarını (`input_tokens` / `prompt_tokens`) normalleştirir

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

  <Accordion title="WebSocket ısıtma">
    OpenClaw, ilk turn gecikmesini azaltmak için `openai/*` ve `openai-codex/*` için WebSocket ısıtmayı varsayılan olarak etkinleştirir.

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

    Etkinleştirildiğinde OpenClaw, hızlı modu OpenAI öncelikli işlemeye eşler (`service_tier = "priority"`). Mevcut `service_tier` değerleri korunur ve hızlı mod `reasoning` ya da `text.verbosity` değerlerini yeniden yazmaz.

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
    OpenAI API'si, `service_tier` aracılığıyla öncelikli işlemeyi sunar. OpenClaw içinde bunu model başına ayarlayın:

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
    `serviceTier` yalnızca yerel OpenAI uç noktalarına (`api.openai.com`) ve yerel Codex uç noktalarına (`chatgpt.com/backend-api`) iletilir. Her iki sağlayıcıdan birini bir proxy üzerinden yönlendirirseniz OpenClaw, `service_tier` değerini olduğu gibi bırakır.
    </Warning>

  </Accordion>

  <Accordion title="Sunucu tarafı Compaction (Responses API)">
    Doğrudan OpenAI Responses modelleri (`api.openai.com` üzerinde `openai/*`) için OpenAI Plugin'in Pi-harness akış sarmalayıcısı, sunucu tarafı Compaction'ı otomatik olarak etkinleştirir:

    - `store: true` değerini zorunlu kılar (model uyumluluğu `supportsStore: false` ayarlamadığı sürece)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` ekler
    - Varsayılan `compact_threshold`: `contextWindow` değerinin %70'i (veya kullanılamadığında `80000`)

    Bu, yerleşik Pi harness yoluna ve gömülü çalıştırmalar tarafından kullanılan OpenAI sağlayıcı hook'larına uygulanır. Yerel Codex uygulama sunucusu harness'ı, kendi bağlamını Codex üzerinden yönetir ve `agents.defaults.agentRuntime.id` ile ayrı olarak yapılandırılır.

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
    `responsesServerCompaction` yalnızca `context_management` eklemeyi denetler. Doğrudan OpenAI Responses modelleri, uyumluluk `supportsStore: false` ayarlamadığı sürece yine de `store: true` değerini zorunlu kılar.
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT modu">
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
    - Bir araç eylemi kullanılabilir olduğunda, yalnızca plan içeren bir turu artık başarılı ilerleme olarak değerlendirmez
    - Turu hemen eyleme geç yönlendirmesiyle yeniden dener
    - Kapsamlı işler için `update_plan` değerini otomatik olarak etkinleştirir
    - Model eyleme geçmeden planlamayı sürdürürse açık bir engellenmiş durum gösterir

    <Note>
    Yalnızca OpenAI ve Codex GPT-5 ailesi çalıştırmalarıyla sınırlıdır. Diğer sağlayıcılar ve daha eski model aileleri varsayılan davranışı korur.
    </Note>

  </Accordion>

  <Accordion title="Yerel ve OpenAI uyumlu rotalar">
    OpenClaw, doğrudan OpenAI, Codex ve Azure OpenAI uç noktalarını genel OpenAI uyumlu `/v1` proxy'lerinden farklı ele alır:

    **Yerel rotalar** (`openai/*`, Azure OpenAI):
    - `reasoning: { effort: "none" }` değerini yalnızca OpenAI `none` çabasını destekleyen modeller için korur
    - `reasoning.effort: "none"` değerini reddeden modeller veya proxy'ler için devre dışı bırakılmış reasoning'i atlar
    - Araç şemalarını varsayılan olarak katı moda ayarlar
    - Gizli atıf başlıklarını yalnızca doğrulanmış yerel ana makinelerde ekler
    - Yalnızca OpenAI'ye özgü istek biçimlendirmesini korur (`service_tier`, `store`, reasoning uyumluluğu, prompt-cache ipuçları)

    **Proxy/uyumlu rotalar:**
    - Daha gevşek uyumluluk davranışı kullanır
    - Yerel olmayan `openai-completions` yüklerinden Completions `store` değerini kaldırır
    - OpenAI uyumlu Completions proxy'leri için gelişmiş `params.extra_body`/`params.extraBody` geçişli JSON'u kabul eder
    - vLLM gibi OpenAI uyumlu Completions proxy'leri için `params.chat_template_kwargs` değerini kabul eder
    - Katı araç şemalarını veya yalnızca yerel başlıkları zorunlu kılmaz

    Azure OpenAI yerel taşıma ve uyumluluk davranışı kullanır, ancak gizli atıf başlıklarını almaz.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Görüntü oluşturma" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görüntü aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video oluşturma" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="OAuth ve kimlik doğrulama" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgilerini yeniden kullanma kuralları.
  </Card>
</CardGroup>

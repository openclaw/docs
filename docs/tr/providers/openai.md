---
read_when:
    - OpenClaw'da OpenAI modellerini kullanmak istiyorsunuz
    - API anahtarları yerine Codex abonelik kimlik doğrulaması istiyorsunuz
    - Daha katı GPT-5 ajan yürütme davranışına ihtiyacınız var
summary: OpenClaw'da OpenAI'ı API anahtarları veya Codex aboneliğiyle kullanın
title: OpenAI
x-i18n:
    generated_at: "2026-05-07T13:25:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a37c0b2c227674b6762aea70ce6d640d49044117c9244377058032ade561d6b
    source_path: providers/openai.md
    workflow: 16
---

OpenAI, GPT modelleri için geliştirici API'leri sağlar ve Codex, OpenAI'ın Codex istemcileri üzerinden ChatGPT planı kapsamında bir kodlama ajanı olarak da kullanılabilir. OpenClaw, yapılandırmanın öngörülebilir kalması için bu yüzeyleri ayrı tutar.

OpenClaw, standart OpenAI model rotası olarak `openai/*` kullanır. OpenAI modellerindeki gömülü ajan turları varsayılan olarak yerel Codex app-server çalışma zamanı üzerinden çalışır; doğrudan OpenAI API anahtarı kimlik doğrulaması ise görüntüler, embeddings, konuşma ve realtime gibi ajan olmayan OpenAI yüzeyleri için kullanılabilir olmaya devam eder.

- **Ajan modelleri** - Codex çalışma zamanı üzerinden `openai/*` modelleri; ChatGPT/Codex aboneliği kullanımı için `openai-codex` kimlik doğrulamasıyla oturum açın veya özellikle API anahtarı kimlik doğrulaması istediğinizde bir `openai-codex` API anahtarı profili yapılandırın.
- **Ajan olmayan OpenAI API'leri** - `OPENAI_API_KEY` veya OpenAI API anahtarı başlangıç kurulumu üzerinden kullanıma dayalı faturalandırmayla doğrudan OpenAI Platform erişimi.
- **Eski yapılandırma** - `openai-codex/*` model referansları `openclaw doctor --fix` tarafından `openai/*` ve Codex çalışma zamanına onarılır.

OpenAI, OpenClaw gibi harici araçlarda ve iş akışlarında abonelik OAuth kullanımını açıkça destekler.

Sağlayıcı, model, çalışma zamanı ve kanal ayrı katmanlardır. Bu etiketler birbirine karışıyorsa yapılandırmayı değiştirmeden önce [Ajan çalışma zamanları](/tr/concepts/agent-runtimes) bölümünü okuyun.

## Hızlı seçim

| Amaç                                                 | Kullanım                                                | Notlar                                                                |
| ---------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| Yerel Codex çalışma zamanı ile ChatGPT/Codex aboneliği | `openai/gpt-5.5`                                        | Varsayılan OpenAI ajan kurulumu. `openai-codex` kimlik doğrulamasıyla oturum açın. |
| Ajan modelleri için doğrudan API anahtarı faturalandırması | `openai/gpt-5.5` ve bir `openai-codex` API anahtarı profili | Bu profili tercih etmek için `auth.order.openai-codex` kullanın.      |
| Açık PI üzerinden doğrudan API anahtarı faturalandırması | `openai/gpt-5.5` ve `agentRuntime.id: "pi"`             | Normal bir `openai` API anahtarı profili seçin.                       |
| En son ChatGPT Instant API takma adı                 | `openai/chat-latest`                                    | Yalnızca doğrudan API anahtarı. Varsayılan değil, deneyler için hareketli takma ad. |
| Açık PI üzerinden ChatGPT/Codex abonelik kimlik doğrulaması | `openai/gpt-5.5` ve `agentRuntime.id: "pi"`             | Uyumluluk rotası için bir `openai-codex` kimlik doğrulama profili seçin. |
| Görüntü oluşturma veya düzenleme                     | `openai/gpt-image-2`                                    | `OPENAI_API_KEY` veya OpenAI Codex OAuth ile çalışır.                 |
| Şeffaf arka planlı görüntüler                        | `openai/gpt-image-1.5`                                  | `outputFormat=png` veya `webp` ve `openai.background=transparent` kullanın. |

## Adlandırma haritası

Adlar benzerdir ancak birbirinin yerine kullanılamaz:

| Gördüğünüz ad                      | Katman              | Anlam                                                                                             |
| ---------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Sağlayıcı öneki     | Standart OpenAI model rotası; ajan turları Codex çalışma zamanını kullanır.                       |
| `openai-codex`                     | Kimlik doğrulama/profil öneki | OpenAI Codex OAuth/abonelik kimlik doğrulama profili sağlayıcısı.                                 |
| `codex` plugin                     | Plugin              | Yerel Codex app-server çalışma zamanı ve `/codex` sohbet denetimleri sağlayan paketlenmiş OpenClaw plugin'i. |
| `agentRuntime.id: codex`           | Ajan çalışma zamanı | Gömülü turlar için yerel Codex app-server koşumunu zorunlu kılar.                                 |
| `/codex ...`                       | Sohbet komut kümesi | Codex app-server iş parçacıklarını bir konuşmadan bağlayın/denetleyin.                            |
| `runtime: "acp", agentId: "codex"` | ACP oturum rotası   | Codex'i ACP/acpx üzerinden çalıştıran açık yedek yol.                                             |

Bu, bir yapılandırmanın bilerek hem `openai/*` model referansları hem de `openai-codex` kimlik doğrulama profilleri içerebileceği anlamına gelir. `openclaw doctor --fix`, eski `openai-codex/*` model referanslarını standart OpenAI model rotasına yeniden yazar.

<Note>
GPT-5.5 hem doğrudan OpenAI Platform API anahtarı erişimi hem de abonelik/OAuth rotaları üzerinden kullanılabilir. ChatGPT/Codex aboneliği ve yerel Codex yürütmesi için `openai/gpt-5.5` kullanın; çalışma zamanı yapılandırmasını ayarlamamak artık OpenAI ajan turları için Codex koşumunu seçer. OpenAI API anahtarı profillerini yalnızca bir OpenAI ajan modeli için doğrudan API anahtarı kimlik doğrulaması istediğinizde kullanın.
</Note>

<Note>
OpenAI ajan modeli turları paketlenmiş Codex app-server Plugin'ini gerektirir. Açık PI çalışma zamanı yapılandırması, isteğe bağlı uyumluluk rotası olarak kullanılabilir olmaya devam eder. PI, bir `openai-codex` kimlik doğrulama profiliyle açıkça seçildiğinde OpenClaw, herkese açık model referansını `openai/*` olarak tutar ve PI'yi dahili olarak eski Codex kimlik doğrulama aktarımı üzerinden yönlendirir. Eski `openai-codex/*` model referanslarını veya açık çalışma zamanı yapılandırmasından gelmeyen eski PI oturum sabitlemelerini onarmak için `openclaw doctor --fix` çalıştırın.
</Note>

## OpenClaw özellik kapsamı

| OpenAI yeteneği          | OpenClaw yüzeyi                                                   | Durum                                                  |
| ------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| Sohbet / Responses        | `openai/<model>` model sağlayıcısı                                | Evet                                                   |
| Codex abonelik modelleri  | `openai/<model>` ile `openai-codex` OAuth                         | Evet                                                   |
| Eski Codex model referansları | `openai-codex/<model>`                                        | doctor tarafından `openai/<model>` olarak onarılır     |
| Codex app-server koşumu   | çalışma zamanı atlanmış veya `agentRuntime.id: codex` ile `openai/<model>` | Evet                                                   |
| Sunucu tarafı web araması | Yerel OpenAI Responses aracı                                      | Evet, web araması etkin olduğunda ve sağlayıcı sabitlenmediğinde |
| Görüntüler                | `image_generate`                                                  | Evet                                                   |
| Videolar                  | `video_generate`                                                  | Evet                                                   |
| Metinden konuşmaya        | `messages.tts.provider: "openai"` / `tts`                         | Evet                                                   |
| Toplu konuşmadan metne    | `tools.media.audio` / medya anlama                                | Evet                                                   |
| Streaming konuşmadan metne | Voice Call `streaming.provider: "openai"`                        | Evet                                                   |
| Realtime ses              | Voice Call `realtime.provider: "openai"` / Control UI Talk        | Evet                                                   |
| Embeddings                | bellek embedding sağlayıcısı                                      | Evet                                                   |

## Bellek embeddings

OpenClaw, `memory_search` dizinleme ve sorgu embeddings için OpenAI veya OpenAI uyumlu bir embedding uç noktası kullanabilir:

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

Asimetrik embedding etiketleri gerektiren OpenAI uyumlu uç noktalar için `memorySearch` altında `queryInputType` ve `documentInputType` ayarlayın. OpenClaw bunları sağlayıcıya özgü `input_type` istek alanları olarak iletir: sorgu embeddings `queryInputType` kullanır; dizinlenmiş bellek parçaları ve toplu dizinleme `documentInputType` kullanır. Tam örnek için [Bellek yapılandırma referansına](/tr/reference/memory-config#provider-specific-config) bakın.

## Başlarken

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **En uygun olduğu durum:** doğrudan API erişimi ve kullanıma dayalı faturalandırma.

    <Steps>
      <Step title="Get your API key">
        [OpenAI Platform panosundan](https://platform.openai.com/api-keys) bir API anahtarı oluşturun veya kopyalayın.
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Ya da anahtarı doğrudan iletin:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Rota özeti

    | Model referansı        | Çalışma zamanı yapılandırması | Rota                        | Kimlik doğrulama |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | atlanmış / `agentRuntime.id: "codex"` | Codex app-server koşumu | `openai-codex` profili |
    | `openai/gpt-5.4-mini` | atlanmış / `agentRuntime.id: "codex"` | Codex app-server koşumu | `openai-codex` profili |
    | `openai/gpt-5.5`      | `agentRuntime.id: "pi"`              | PI gömülü çalışma zamanı | `openai` profili veya seçili `openai-codex` profili |

    <Note>
    `openai/*` ajan modelleri Codex app-server koşumunu kullanır. Bir ajan modeli için API anahtarı kimlik doğrulaması kullanmak üzere bir `openai-codex` API anahtarı profili oluşturun ve onu `auth.order.openai-codex` ile sıralayın; `OPENAI_API_KEY`, ajan olmayan OpenAI API yüzeyleri için doğrudan yedek olarak kalır.
    </Note>

    ### Yapılandırma örneği

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    OpenAI API'den ChatGPT'nin güncel Instant modelini denemek için modeli `openai/chat-latest` olarak ayarlayın:

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` hareketli bir takma addır. OpenAI bunu ChatGPT'de kullanılan en son Instant model olarak belgeler ve üretim API kullanımı için `gpt-5.5` önerir; bu nedenle özellikle bu takma ad davranışını istemediğiniz sürece kararlı varsayılan olarak `openai/gpt-5.5` tutun. Bu takma ad şu anda yalnızca `medium` metin ayrıntı düzeyini kabul eder, bu yüzden OpenClaw bu model için uyumsuz OpenAI metin ayrıntı düzeyi geçersiz kılmalarını normalleştirir.

    <Warning>
    OpenClaw `openai/gpt-5.3-codex-spark` sunmaz. Canlı OpenAI API istekleri bu modeli reddeder ve güncel Codex kataloğu da bunu sunmaz.
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **En uygun olduğu durum:** ayrı bir API anahtarı yerine ChatGPT/Codex aboneliğinizi yerel Codex app-server yürütmesiyle kullanmak. Codex bulutu ChatGPT oturumu açılmasını gerektirir.

    <Steps>
      <Step title="Run Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Ya da OAuth'u doğrudan çalıştırın:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Başsız veya geri çağrıya elverişsiz kurulumlar için localhost tarayıcı geri çağrısı yerine ChatGPT cihaz kodu akışıyla oturum açmak üzere `--device-code` ekleyin:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Use the canonical OpenAI model route">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Varsayılan yol için çalışma zamanı yapılandırması gerekmez. OpenAI ajan dönüşleri
        yerel Codex app-server çalışma zamanını otomatik olarak seçer ve bu rota
        seçildiğinde OpenClaw pakete dahil Codex Plugin'ini kurar veya onarır.
      </Step>
      <Step title="Codex kimlik doğrulamasının kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Gateway çalıştıktan sonra, yerel app-server çalışma zamanını doğrulamak için
        sohbette `/codex status` veya `/codex models` gönderin.
      </Step>
    </Steps>

    ### Rota özeti

    | Model ref | Çalışma zamanı yapılandırması | Rota | Kimlik doğrulama |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | atlanmış / `agentRuntime.id: "codex"` | Yerel Codex app-server koşum takımı | Codex oturum açma veya seçili `openai-codex` profili |
    | `openai/gpt-5.5` | `agentRuntime.id: "pi"` | Dahili Codex-auth taşımasıyla PI gömülü çalışma zamanı | Seçili `openai-codex` profili |
    | `openai-codex/gpt-5.5` | doctor tarafından onarıldı | Eski rota `openai/gpt-5.5` olarak yeniden yazıldı | Mevcut `openai-codex` profili |

    <Warning>
    Eski `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` veya
    `openai-codex/gpt-5.3*` model ref'lerini yapılandırmayın. ChatGPT/Codex OAuth hesapları artık
    bu modelleri reddediyor. `openai/gpt-5.5` kullanın; OpenAI ajan dönüşleri artık varsayılan olarak Codex
    çalışma zamanını seçer.
    </Warning>

    <Note>
    Kimlik doğrulama/profil komutları için `openai-codex` sağlayıcı kimliğini kullanmaya devam edin.
    `openai-codex/*` model öneki, doctor tarafından onarılan eski yapılandırmadır. Yaygın
    abonelik artı yerel çalışma zamanı kurulumu için `openai-codex` ile oturum açın,
    ancak model ref'ini `openai/gpt-5.5` olarak tutun.
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

    <Note>
    İlk kurulum artık `~/.codex` konumundan OAuth materyali içe aktarmaz. Tarayıcı OAuth'u (varsayılan) veya yukarıdaki cihaz kodu akışıyla oturum açın; OpenClaw ortaya çıkan kimlik bilgilerini kendi ajan kimlik doğrulama deposunda yönetir.
    </Note>

    ### Codex OAuth yönlendirmesini denetleyin ve kurtarın

    Varsayılan ajanınızın hangi modeli, çalışma zamanını ve kimlik doğrulama rotasını
    kullandığını görmek için şu komutları kullanın:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get agents.defaults.agentRuntime --json
    ```

    Belirli bir ajan için `--agent <id>` ekleyin:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    Eski bir yapılandırmada hâlâ `openai-codex/gpt-*` veya açık çalışma zamanı yapılandırması olmadan
    güncelliğini yitirmiş bir OpenAI PI oturum sabitlemesi varsa, onu onarın:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    `models auth list --provider openai-codex` kullanılabilir profil göstermiyorsa, yeniden
    oturum açın:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex` kimlik doğrulama/profil sağlayıcı kimliği olarak kalır. `openai/*`, Codex üzerinden
    OpenAI ajan dönüşleri için model rotasıdır.

    ### Durum göstergesi

    Sohbet `/status`, geçerli oturum için hangi model çalışma zamanının etkin olduğunu gösterir.
    Pakete dahil Codex app-server koşum takımı, OpenAI ajan model dönüşleri için
    `Runtime: OpenAI Codex` olarak görünür. Güncelliğini yitirmiş PI oturum sabitlemeleri,
    yapılandırma PI'ı açıkça sabitlemedikçe Codex'e onarılır.

    ### Doctor uyarısı

    Yapılandırmada veya oturum durumunda `openai-codex/*` rotaları ya da güncelliğini yitirmiş OpenAI PI
    sabitlemeleri kalırsa, `openclaw doctor --fix` bunları, PI açıkça yapılandırılmadığı sürece,
    Codex çalışma zamanı ile `openai/*` olarak yeniden yazar.

    ### Bağlam penceresi sınırı

    OpenClaw model metadata'sını ve çalışma zamanı bağlam sınırını ayrı değerler olarak ele alır.

    Codex OAuth kataloğu üzerinden `openai/gpt-5.5` için:

    - Yerel `contextWindow`: `1000000`
    - Varsayılan çalışma zamanı `contextTokens` sınırı: `272000`

    Daha küçük varsayılan sınır, pratikte daha iyi gecikme ve kalite özellikleri sunar. Bunu `contextTokens` ile geçersiz kılın:

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
    Yerel model metadata'sını bildirmek için `contextWindow` kullanın. Çalışma zamanı bağlam bütçesini sınırlamak için `contextTokens` kullanın.
    </Note>

    ### Katalog kurtarma

    OpenClaw, mevcut olduğunda `gpt-5.5` için upstream Codex katalog metadata'sını kullanır.
    Hesap kimliği doğrulanmışken canlı Codex keşfi `gpt-5.5` satırını atlarsa,
    OpenClaw bu OAuth model satırını oluşturur; böylece cron, alt ajan ve yapılandırılmış
    varsayılan model çalıştırmaları `Unknown model` ile başarısız olmaz.

  </Tab>
</Tabs>

## Yerel Codex app-server kimlik doğrulaması

Yerel Codex app-server koşum takımı `openai/*` model ref'lerini ve atlanmış
çalışma zamanı yapılandırmasını veya `agentRuntime.id: "codex"` kullanır, ancak kimlik doğrulaması hâlâ
hesap tabanlıdır. OpenClaw
kimlik doğrulamayı şu sırayla seçer:

1. Ajana bağlı açık bir OpenClaw `openai-codex` kimlik doğrulama profili.
2. App-server'ın mevcut hesabı, örneğin yerel bir Codex CLI ChatGPT oturum açması.
3. Yalnızca yerel stdio app-server başlatmaları için, app-server hesap bildirmediğinde ve hâlâ
   OpenAI kimlik doğrulaması gerektirdiğinde önce `CODEX_API_KEY`, sonra
   `OPENAI_API_KEY`.

Bu, gateway işleminin doğrudan OpenAI modelleri veya embeddings için ayrıca
`OPENAI_API_KEY` değerine sahip olması nedeniyle yerel bir ChatGPT/Codex abonelik oturumunun
değiştirilmediği anlamına gelir. Env API anahtarı yedeği yalnızca yerel stdio hesapsız yoludur;
WebSocket app-server bağlantılarına gönderilmez. Abonelik tarzı bir Codex profili seçildiğinde,
OpenClaw ayrıca `CODEX_API_KEY` ve `OPENAI_API_KEY` değerlerini oluşturulan stdio app-server
alt sürecinin dışında tutar ve seçili kimlik bilgilerini app-server login RPC üzerinden gönderir.

## Görsel oluşturma

Pakete dahil `openai` Plugin'i, `image_generate` aracı üzerinden görsel oluşturmayı kaydeder.
Aynı `openai/gpt-image-2` model ref'i üzerinden hem OpenAI API anahtarlı görsel oluşturmayı hem de
Codex OAuth görsel oluşturmayı destekler.

| Yetenek                   | OpenAI API anahtarı                 | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Model ref                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Kimlik doğrulama          | `OPENAI_API_KEY`                   | OpenAI Codex OAuth oturum açma       |
| Taşıma                    | OpenAI Images API                  | Codex Responses backend              |
| İstek başına en fazla görsel | 4                                  | 4                                    |
| Düzenleme modu            | Etkin (en fazla 5 referans görsel) | Etkin (en fazla 5 referans görsel)   |
| Boyut geçersiz kılmaları  | 2K/4K boyutlar dahil desteklenir   | 2K/4K boyutlar dahil desteklenir     |
| En-boy oranı / çözünürlük | OpenAI Images API'ye iletilmez     | Güvenli olduğunda desteklenen bir boyuta eşlenir |

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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için [Görsel Oluşturma](/tr/tools/image-generation) bölümüne bakın.
</Note>

`gpt-image-2`, hem OpenAI metinden görsele oluşturma hem de görsel düzenleme için varsayılandır.
`gpt-image-1.5`, `gpt-image-1` ve `gpt-image-1-mini` açık model geçersiz kılmaları olarak
kullanılabilir kalır. Şeffaf arka planlı PNG/WebP çıktısı için `openai/gpt-image-1.5` kullanın;
geçerli `gpt-image-2` API'si `background: "transparent"` değerini reddeder.

Şeffaf arka plan isteği için ajanlar `image_generate` aracını
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` veya `"webp"` ve
`background: "transparent"` ile çağırmalıdır; eski `openai.background` sağlayıcı seçeneği
hâlâ kabul edilir. OpenClaw ayrıca varsayılan `openai/gpt-image-2` şeffaf isteklerini
`gpt-image-1.5` olarak yeniden yazarak genel OpenAI ve
OpenAI Codex OAuth rotalarını korur; Azure ve özel OpenAI uyumlu uç noktalar
yapılandırılmış dağıtım/model adlarını korur.

Aynı ayar headless CLI çalıştırmaları için de sunulur:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Bir girdi dosyasından başlarken `openclaw infer image edit` ile aynı
`--output-format` ve `--background` bayraklarını kullanın.
`--openai-background`, OpenAI'ye özgü alias olarak kullanılabilir kalır.

Codex OAuth kurulumları için aynı `openai/gpt-image-2` ref'ini koruyun. Bir
`openai-codex` OAuth profili yapılandırıldığında, OpenClaw depolanan OAuth
erişim token'ını çözer ve görsel isteklerini Codex Responses backend üzerinden gönderir. Bu
istek için önce `OPENAI_API_KEY` denemez veya sessizce bir API anahtarına geri dönmez.
Bunun yerine doğrudan OpenAI Images API rotasını istediğinizde
`models.providers.openai` değerini bir API anahtarı, özel base URL veya Azure endpoint ile açıkça yapılandırın.
Bu özel görsel endpoint güvenilir bir LAN/özel adresteyse, ayrıca
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ayarlayın; bu opt-in
mevcut olmadıkça OpenClaw özel/dahili OpenAI uyumlu görsel endpoint'leri engelli tutar.

Oluştur:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Şeffaf PNG oluştur:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Düzenle:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Video oluşturma

Pakete dahil `openai` Plugin'i, `video_generate` aracı üzerinden video oluşturmayı kaydeder.

| Yetenek          | Değer                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Varsayılan model | `openai/sora-2`                                                                   |
| Modlar           | Metinden videoya, görselden videoya, tek video düzenleme                          |
| Referans girdileri | 1 görsel veya 1 video                                                            |
| Boyut geçersiz kılmaları | Desteklenir                                                                         |
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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için [Video Oluşturma](/tr/tools/video-generation) bölümüne bakın.
</Note>

## GPT-5 prompt katkısı

OpenClaw, sağlayıcılar genelindeki GPT-5-family çalıştırmaları için paylaşılan bir GPT-5 prompt katkısı ekler. Model kimliğine göre uygulanır; bu nedenle `openai/gpt-5.5`, `openai-codex/gpt-5.5` gibi eski onarım öncesi ref'ler, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` ve diğer uyumlu GPT-5 ref'leri aynı katmanı alır. Eski GPT-4.x modelleri almaz.

Pakete dahil yerel Codex koşum takımı, Codex app-server geliştirici talimatları üzerinden aynı GPT-5 davranışını ve Heartbeat katmanını kullanır; bu nedenle `agentRuntime.id: "codex"` üzerinden zorlanan `openai/gpt-5.x` oturumları, koşum takımı prompt'unun geri kalanına Codex sahip olsa bile aynı takip ve proaktif Heartbeat rehberliğini korur.

GPT-5 katkısı; persona kalıcılığı, yürütme güvenliği, araç disiplini, çıktı biçimi, tamamlama kontrolleri ve doğrulama için etiketli bir davranış sözleşmesi ekler. Kanala özgü yanıt ve sessiz mesaj davranışı, paylaşılan OpenClaw sistem isteminde ve giden teslim politikalarında kalır. GPT-5 rehberliği, eşleşen modeller için her zaman etkindir. Dostça etkileşim stili katmanı ayrı ve yapılandırılabilirdir.

| Değer                  | Etki                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (varsayılan) | Dostça etkileşim stili katmanını etkinleştir |
| `"on"`                 | `"friendly"` için takma ad                      |
| `"off"`                | Yalnızca dostça stil katmanını devre dışı bırak       |

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
Değerler çalışma zamanında büyük/küçük harfe duyarlı değildir; bu nedenle `"Off"` ve `"off"` ikisi de dostça stil katmanını devre dışı bırakır.
</Tip>

<Note>
Eski `plugins.entries.openai.config.personality`, paylaşılan `agents.defaults.promptOverlays.gpt5.personality` ayarı belirlenmediğinde uyumluluk yedek çözümü olarak hâlâ okunur.
</Note>

## Ses ve konuşma

<AccordionGroup>
  <Accordion title="Konuşma sentezi (TTS)">
    Paketlenen `openai` plugin'i, `messages.tts` yüzeyi için konuşma sentezini kaydeder.

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

    `extraBody`, OpenClaw tarafından oluşturulan alanlardan sonra `/audio/speech` istek JSON'una birleştirilir; bu nedenle `lang` gibi ek anahtarlar gerektiren OpenAI uyumlu uç noktalar için kullanın. Prototip anahtarlar yok sayılır.

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
    Paketlenen `openai` plugin'i, OpenClaw'ın medya anlama transkripsiyon yüzeyi üzerinden toplu konuşmadan metne dönüştürmeyi kaydeder.

    - Varsayılan model: `gpt-4o-transcribe`
    - Uç nokta: OpenAI REST `/v1/audio/transcriptions`
    - Girdi yolu: multipart ses dosyası yükleme
    - Discord ses kanalı segmentleri ve kanal ses ekleri dahil olmak üzere, gelen ses transkripsiyonunun `tools.media.audio` kullandığı her yerde OpenClaw tarafından desteklenir

    Gelen ses transkripsiyonu için OpenAI kullanımını zorlamak üzere:

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
    Paketlenen `openai` plugin'i, Voice Call plugin'i için gerçek zamanlı transkripsiyonu kaydeder.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Dil | `...openai.language` | (ayarlanmamış) |
    | İstem | `...openai.prompt` | (ayarlanmamış) |
    | Sessizlik süresi | `...openai.silenceDurationMs` | `800` |
    | VAD eşiği | `...openai.vadThreshold` | `0.5` |
    | API anahtarı | `...openai.apiKey` | `OPENAI_API_KEY` değerine geri döner |

    <Note>
    G.711 u-law (`g711_ulaw` / `audio/pcmu`) ses ile `wss://api.openai.com/v1/realtime` adresine bir WebSocket bağlantısı kullanır. Bu akış sağlayıcısı Voice Call'ın gerçek zamanlı transkripsiyon yolu içindir; Discord sesi şu anda kısa segmentleri kaydeder ve bunun yerine toplu `tools.media.audio` transkripsiyon yolunu kullanır.
    </Note>

  </Accordion>

  <Accordion title="Gerçek zamanlı ses">
    Paketlenen `openai` plugin'i, Voice Call plugin'i için gerçek zamanlı sesi kaydeder.

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
    Control UI Talk, Gateway tarafından basılan geçici bir istemci gizli anahtarı ve OpenAI Realtime API'ye karşı doğrudan tarayıcı WebRTC SDP alışverişi ile OpenAI tarayıcı gerçek zamanlı oturumlarını kullanır. Bakımcı canlı doğrulaması `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` ile kullanılabilir; OpenAI ayağı Node içinde bir istemci gizli anahtarı basar, sahte mikrofon medyasıyla bir tarayıcı SDP teklifi oluşturur, bunu OpenAI'a gönderir ve gizli bilgileri günlüğe yazmadan SDP yanıtını uygular.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI uç noktaları

Paketlenen `openai` sağlayıcısı, temel URL'yi geçersiz kılarak görüntü oluşturma için bir Azure OpenAI kaynağını hedefleyebilir. Görüntü oluşturma yolunda OpenClaw, `models.providers.openai.baseUrl` üzerindeki Azure ana makine adlarını algılar ve otomatik olarak Azure'un istek biçimine geçer.

<Note>
Gerçek zamanlı ses ayrı bir yapılandırma yolu kullanır (`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`) ve `models.providers.openai.baseUrl` tarafından etkilenmez. Azure ayarları için [Ses ve konuşma](#voice-and-speech) altındaki **Gerçek zamanlı ses** akordeonuna bakın.
</Note>

Azure OpenAI'ı şu durumlarda kullanın:

- Zaten bir Azure OpenAI aboneliğiniz, kotanız veya kurumsal anlaşmanız varsa
- Azure'un sağladığı bölgesel veri yerleşimi veya uyumluluk denetimlerine ihtiyacınız varsa
- Trafiği mevcut bir Azure kiracılığı içinde tutmak istiyorsanız

### Yapılandırma

Paketlenen `openai` sağlayıcısı üzerinden Azure görüntü oluşturma için `models.providers.openai.baseUrl` değerini Azure kaynağınıza yönlendirin ve `apiKey` değerini Azure OpenAI anahtarına ayarlayın (OpenAI Platform anahtarı değil):

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

OpenClaw, Azure görüntü oluşturma rotası için şu Azure ana makine son eklerini tanır:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Tanınan bir Azure ana makinesindeki görüntü oluşturma istekleri için OpenClaw:

- `Authorization: Bearer` yerine `api-key` üst bilgisini gönderir
- Dağıtım kapsamlı yolları kullanır (`/openai/deployments/{deployment}/...`)
- Her isteğe `?api-version=...` ekler
- Azure görüntü oluşturma çağrıları için 600 sn varsayılan istek zaman aşımı kullanır.
  Çağrı başına `timeoutMs` değerleri yine de bu varsayılanı geçersiz kılar.

Diğer temel URL'ler (genel OpenAI, OpenAI uyumlu proxy'ler) standart OpenAI görüntü isteği biçimini korur.

<Note>
`openai` sağlayıcısının görüntü oluşturma yolu için Azure yönlendirmesi OpenClaw 2026.4.22 veya daha yenisini gerektirir. Önceki sürümler, tüm özel `openai.baseUrl` değerlerini genel OpenAI uç noktası gibi ele alır ve Azure görüntü dağıtımlarında başarısız olur.
</Note>

### API sürümü

Azure görüntü oluşturma yolu için belirli bir Azure önizleme veya GA sürümünü sabitlemek üzere `AZURE_OPENAI_API_VERSION` ayarlayın:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Değişken ayarlanmamışsa varsayılan `2024-12-01-preview` olur.

### Model adları dağıtım adlarıdır

Azure OpenAI, modelleri dağıtımlara bağlar. Paketlenen `openai` sağlayıcısı üzerinden yönlendirilen Azure görüntü oluşturma istekleri için OpenClaw'daki `model` alanı, genel OpenAI model kimliği değil, Azure portalında yapılandırdığınız **Azure dağıtım adı** olmalıdır.

`gpt-image-2` sunan `gpt-image-2-prod` adlı bir dağıtım oluşturursanız:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Aynı dağıtım adı kuralı, paketlenen `openai` sağlayıcısı üzerinden yönlendirilen görüntü oluşturma çağrıları için geçerlidir.

### Bölgesel kullanılabilirlik

Azure görüntü oluşturma şu anda yalnızca belirli bölgelerin bir alt kümesinde kullanılabilir (örneğin `eastus2`, `swedencentral`, `polandcentral`, `westus3`, `uaenorth`). Dağıtım oluşturmadan önce Microsoft'un güncel bölge listesini kontrol edin ve belirli modelin bölgenizde sunulduğunu doğrulayın.

### Parametre farkları

Azure OpenAI ve genel OpenAI her zaman aynı görüntü parametrelerini kabul etmez. Azure, genel OpenAI'ın izin verdiği seçenekleri reddedebilir (örneğin `gpt-image-2` üzerinde belirli `background` değerleri) veya bunları yalnızca belirli model sürümlerinde sunabilir. Bu farklar Azure'dan ve temel modelden kaynaklanır, OpenClaw'dan değil. Bir Azure isteği doğrulama hatasıyla başarısız olursa, belirli dağıtımınız ve API sürümünüz tarafından desteklenen parametre kümesini Azure portalında kontrol edin.

<Note>
Azure OpenAI, yerel aktarım ve uyumluluk davranışı kullanır ancak OpenClaw'ın gizli atıf üst bilgilerini almaz — [Gelişmiş yapılandırma](#advanced-configuration) altındaki **Yerel ve OpenAI uyumlu rotalar** akordeonuna bakın.

Azure üzerindeki sohbet veya Responses trafiği için (görüntü oluşturmanın ötesinde) onboarding akışını ya da özel bir Azure sağlayıcı yapılandırmasını kullanın — `openai.baseUrl` tek başına Azure API/kimlik doğrulama biçimini almaz. Ayrı bir `azure-openai-responses/*` sağlayıcısı vardır; aşağıdaki Sunucu tarafı Compaction akordeonuna bakın.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Aktarım (WebSocket ve SSE)">
    OpenClaw, `openai/*` için SSE yedek çözümüyle (`"auto"`) WebSocket öncelikli kullanır.

    `"auto"` modunda OpenClaw:
    - SSE'ye geri dönmeden önce bir erken WebSocket hatasını yeniden dener
    - Bir hatadan sonra WebSocket'i ~60 saniye boyunca düşürülmüş olarak işaretler ve soğuma süresinde SSE kullanır
    - Yeniden denemeler ve yeniden bağlanmalar için kararlı oturum ve tur kimliği üst bilgileri ekler
    - Kullanım sayaçlarını (`input_tokens` / `prompt_tokens`) aktarım varyantları arasında normalleştirir

    | Değer | Davranış |
    |-------|----------|
    | `"auto"` (varsayılan) | Önce WebSocket, SSE yedek çözümü |
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
    OpenClaw, ilk tur gecikmesini azaltmak için `openai/*` için WebSocket ısıtmayı varsayılan olarak etkinleştirir.

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
    OpenClaw, `openai/*` için paylaşılan bir hızlı mod anahtarı sunar:

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
    Oturum geçersiz kılmaları yapılandırmaya göre önceliklidir. Sessions UI içinde oturum geçersiz kılmasını temizlemek, oturumu yapılandırılmış varsayılana döndürür.
    </Note>

  </Accordion>

  <Accordion title="Öncelikli işleme (service_tier)">
    OpenAI'nin API'si, `service_tier` üzerinden öncelikli işleme sunar. OpenClaw içinde bunu model başına ayarlayın:

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
    `serviceTier` yalnızca yerel OpenAI uç noktalarına (`api.openai.com`) ve yerel Codex uç noktalarına (`chatgpt.com/backend-api`) iletilir. Her iki sağlayıcıyı da bir proxy üzerinden yönlendirirseniz OpenClaw `service_tier` değerine dokunmaz.
    </Warning>

  </Accordion>

  <Accordion title="Sunucu tarafı compaction (Responses API)">
    Doğrudan OpenAI Responses modelleri için (`api.openai.com` üzerindeki `openai/*`), OpenAI Plugin'inin Pi-harness akış sarmalayıcısı sunucu tarafı compaction özelliğini otomatik olarak etkinleştirir:

    - `store: true` değerini zorlar (model uyumluluğu `supportsStore: false` ayarlamadığı sürece)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` ekler
    - Varsayılan `compact_threshold`: `contextWindow` değerinin %70'i (veya mevcut olmadığında `80000`)

    Bu, yerleşik Pi harness yoluna ve gömülü çalıştırmalar tarafından kullanılan OpenAI sağlayıcı kancalarına uygulanır. Yerel Codex uygulama sunucusu harness'i kendi bağlamını Codex üzerinden yönetir ve `agents.defaults.agentRuntime.id` ile ayrı olarak yapılandırılır.

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
    `responsesServerCompaction` yalnızca `context_management` eklemeyi kontrol eder. Doğrudan OpenAI Responses modelleri, uyumluluk `supportsStore: false` ayarlamadığı sürece yine de `store: true` değerini zorlar.
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT modu">
    `openai/*` üzerindeki GPT-5 ailesi çalıştırmalar için OpenClaw daha katı bir gömülü yürütme sözleşmesi kullanabilir:

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
    - Bir araç eylemi mevcutken yalnızca plan içeren bir turu artık başarılı ilerleme olarak değerlendirmez
    - Turu hemen eyleme geçirme yönlendirmesiyle yeniden dener
    - Kapsamlı işler için `update_plan` özelliğini otomatik olarak etkinleştirir
    - Model eyleme geçmeden planlamaya devam ederse açık bir engellenmiş durum gösterir

    <Note>
    Yalnızca OpenAI ve Codex GPT-5 ailesi çalıştırmalarına kapsamlanmıştır. Diğer sağlayıcılar ve eski model aileleri varsayılan davranışı korur.
    </Note>

  </Accordion>

  <Accordion title="Yerel ve OpenAI uyumlu rotalar">
    OpenClaw, doğrudan OpenAI, Codex ve Azure OpenAI uç noktalarını genel OpenAI uyumlu `/v1` proxy'lerinden farklı şekilde ele alır:

    **Yerel rotalar** (`openai/*`, Azure OpenAI):
    - `reasoning: { effort: "none" }` değerini yalnızca OpenAI `none` çabasını destekleyen modeller için korur
    - `reasoning.effort: "none"` değerini reddeden modeller veya proxy'ler için devre dışı bırakılmış reasoning değerini çıkarır
    - Araç şemalarını varsayılan olarak katı moda ayarlar
    - Gizli atıf başlıklarını yalnızca doğrulanmış yerel ana makinelere ekler
    - Yalnızca OpenAI'ye özgü istek biçimlendirmesini korur (`service_tier`, `store`, reasoning uyumluluğu, prompt-cache ipuçları)

    **Proxy/uyumlu rotalar:**
    - Daha gevşek uyumluluk davranışı kullanır
    - Yerel olmayan `openai-completions` yüklerinden Completions `store` değerini kaldırır
    - OpenAI uyumlu Completions proxy'leri için gelişmiş `params.extra_body`/`params.extraBody` geçişli JSON kabul eder
    - vLLM gibi OpenAI uyumlu Completions proxy'leri için `params.chat_template_kwargs` kabul eder
    - Katı araç şemalarını veya yalnızca yerel başlıkları zorlamaz

    Azure OpenAI yerel aktarım ve uyumluluk davranışı kullanır, ancak gizli atıf başlıklarını almaz.

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

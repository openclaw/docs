---
read_when:
    - OpenClaw'da OpenAI modellerini kullanmak istiyorsunuz
    - API anahtarları yerine Codex aboneliğiyle kimlik doğrulaması istiyorsunuz
    - Daha katı GPT-5 ajan yürütme davranışına ihtiyacınız var
summary: OpenClaw'da OpenAI'yi API anahtarları veya Codex aboneliği aracılığıyla kullanın
title: OpenAI
x-i18n:
    generated_at: "2026-05-11T20:36:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: d63b8eff93ecffd85c2110f42044c26621ff50eb62c35b7cc99a07f0e6be1ffb
    source_path: providers/openai.md
    workflow: 16
---

OpenAI, GPT modelleri için geliştirici API'leri sağlar ve Codex de OpenAI'nin Codex istemcileri üzerinden ChatGPT planına dahil bir kodlama ajanı olarak kullanılabilir. OpenClaw, yapılandırmanın öngörülebilir kalması için bu yüzeyleri ayrı tutar.

OpenClaw, standart OpenAI model rotası olarak `openai/*` kullanır. OpenAI modellerindeki gömülü ajan turları, varsayılan olarak yerel Codex app-server çalışma zamanı üzerinden çalışır; doğrudan OpenAI API anahtarı kimlik doğrulaması ise görüntüler, embeddings, konuşma ve realtime gibi ajan dışı OpenAI yüzeyleri için kullanılabilir kalır.

- **Ajan modelleri** - Codex çalışma zamanı üzerinden `openai/*` modelleri; ChatGPT/Codex abonelik kullanımı için Codex kimlik doğrulamasıyla oturum açın veya bilinçli olarak API anahtarı kimlik doğrulaması istediğinizde Codex uyumlu bir OpenAI API anahtarı yedeği yapılandırın.
- **Ajan dışı OpenAI API'leri** - `OPENAI_API_KEY` veya OpenAI API anahtarı onboarding üzerinden kullanıma dayalı faturalandırmayla doğrudan OpenAI Platform erişimi.
- **Eski yapılandırma** - `openai-codex/*` model referansları, `openclaw doctor --fix` tarafından `openai/*` artı Codex çalışma zamanı olacak şekilde onarılır.

OpenAI, OpenClaw gibi harici araç ve iş akışlarında abonelik OAuth kullanımını açıkça destekler.

Sağlayıcı, model, çalışma zamanı ve kanal ayrı katmanlardır. Bu etiketler birbirine karışıyorsa yapılandırmayı değiştirmeden önce [Ajan çalışma zamanları](/tr/concepts/agent-runtimes) bölümünü okuyun.

## Hızlı seçim

| Hedef                                                | Kullanım                                                 | Notlar                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| Yerel Codex çalışma zamanıyla ChatGPT/Codex aboneliği | `openai/gpt-5.5`                                         | Varsayılan OpenAI ajan kurulumu. Codex kimlik doğrulamasıyla oturum açın. |
| Ajan modelleri için doğrudan API anahtarı faturalandırması | `openai/gpt-5.5` artı Codex uyumlu API anahtarı profili | Yedeği abonelik kimlik doğrulamasından sonra yerleştirmek için `auth.order.openai` kullanın. |
| Açık PI üzerinden doğrudan API anahtarı faturalandırması | `openai/gpt-5.5` artı sağlayıcı/model çalışma zamanı `pi` | Normal bir `openai` API anahtarı profili seçin. |
| En son ChatGPT Instant API takma adı                 | `openai/chat-latest`                                     | Yalnızca doğrudan API anahtarı. Varsayılan değil, deneyler için hareketli takma ad. |
| Açık PI üzerinden ChatGPT/Codex abonelik kimlik doğrulaması | `openai/gpt-5.5` artı sağlayıcı/model çalışma zamanı `pi` | Uyumluluk rotası için bir `openai-codex` kimlik doğrulama profili seçin. |
| Görüntü oluşturma veya düzenleme                     | `openai/gpt-image-2`                                     | `OPENAI_API_KEY` veya OpenAI Codex OAuth ile çalışır. |
| Şeffaf arka planlı görüntüler                        | `openai/gpt-image-1.5`                                   | `outputFormat=png` veya `webp` ve `openai.background=transparent` kullanın. |

## Adlandırma haritası

Adlar benzerdir ancak birbirinin yerine kullanılamaz:

| Gördüğünüz ad                           | Katman                    | Anlamı                                                                                                               |
| --------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `openai`                                | Sağlayıcı öneki           | Standart OpenAI model rotası; ajan turları Codex çalışma zamanını kullanır.                                          |
| `openai-codex`                          | Eski kimlik/profil öneki  | Daha eski OpenAI Codex OAuth/abonelik profil ad alanı. Mevcut profiller ve `auth.order.openai-codex` çalışmaya devam eder. |
| `codex` plugin                          | Plugin                    | Yerel Codex app-server çalışma zamanı ve `/codex` sohbet denetimleri sağlayan paketli OpenClaw Plugin'i.            |
| sağlayıcı/model `agentRuntime.id: codex` | Ajan çalışma zamanı       | Eşleşen gömülü turlar için yerel Codex app-server harness'ını zorla kullanır.                                        |
| `/codex ...`                            | Sohbet komut kümesi       | Codex app-server thread'lerini bir konuşmadan bağlayın/denetleyin.                                                   |
| `runtime: "acp", agentId: "codex"`      | ACP oturum rotası         | Codex'i ACP/acpx üzerinden çalıştıran açık fallback yolu.                                                            |

Bu, bir yapılandırmanın bilinçli olarak `openai/*` model referansları içerebileceği, kimlik doğrulama profillerinin ise hâlâ Codex uyumlu kimlik bilgilerini gösterebileceği anlamına gelir. Yeni yapılandırmalar için `auth.order.openai` tercih edin; mevcut `openai-codex:*` profilleri ve `auth.order.openai-codex` desteklenmeye devam eder. `openclaw doctor --fix`, eski `openai-codex/*` model referanslarını standart OpenAI model rotasına yeniden yazar.

<Note>
GPT-5.5 hem doğrudan OpenAI Platform API anahtarı erişimi hem de abonelik/OAuth rotaları üzerinden kullanılabilir. ChatGPT/Codex aboneliği artı yerel Codex yürütmesi için `openai/gpt-5.5` kullanın; çalışma zamanı yapılandırmasının ayarlanmamış olması artık OpenAI ajan turları için Codex harness'ını seçer. OpenAI API anahtarı profillerini yalnızca bir OpenAI ajan modeli için doğrudan API anahtarı kimlik doğrulaması istediğinizde kullanın.
</Note>

<Note>
OpenAI ajan modeli turları, paketli Codex app-server Plugin'ini gerektirir. Açık PI çalışma zamanı yapılandırması, isteğe bağlı uyumluluk rotası olarak kullanılabilir kalır. PI, bir `openai-codex` kimlik doğrulama profiliyle açıkça seçildiğinde, OpenClaw genel model referansını `openai/*` olarak tutar ve PI'ı dahili olarak eski Codex kimlik doğrulama taşıması üzerinden yönlendirir. Bayat `openai-codex/*` model referanslarını veya açık çalışma zamanı yapılandırmasından gelmeyen eski PI oturum pin'lerini onarmak için `openclaw doctor --fix` çalıştırın.
</Note>

## OpenClaw özellik kapsamı

| OpenAI yeteneği          | OpenClaw yüzeyi                                                                  | Durum                                                  |
| ------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Sohbet / Responses        | `openai/<model>` model sağlayıcısı                                               | Evet                                                   |
| Codex abonelik modelleri  | `openai/<model>` ve `openai-codex` OAuth                                         | Evet                                                   |
| Eski Codex model referansları | `openai-codex/<model>`                                                       | doctor tarafından `openai/<model>` olarak onarılır     |
| Codex app-server harness'ı | `openai/<model>` ve atlanmış çalışma zamanı veya sağlayıcı/model `agentRuntime.id: codex` | Evet                                                   |
| Sunucu tarafı web araması | Yerel OpenAI Responses aracı                                                     | Evet, web araması etkinse ve sağlayıcı sabitlenmemişse |
| Görüntüler                | `image_generate`                                                                 | Evet                                                   |
| Videolar                  | `video_generate`                                                                 | Evet                                                   |
| Metinden sese             | `messages.tts.provider: "openai"` / `tts`                                        | Evet                                                   |
| Toplu konuşmadan metne    | `tools.media.audio` / medya anlama                                               | Evet                                                   |
| Akışlı konuşmadan metne   | Sesli Arama `streaming.provider: "openai"`                                       | Evet                                                   |
| Realtime ses              | Sesli Arama `realtime.provider: "openai"` / Control UI Talk                      | Evet                                                   |
| Embeddings                | bellek embedding sağlayıcısı                                                     | Evet                                                   |

## Bellek embeddings

OpenClaw, `memory_search` indeksleme ve sorgu embeddings için OpenAI'yi veya OpenAI uyumlu bir embedding endpoint'ini kullanabilir:

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

Asimetrik embedding etiketleri gerektiren OpenAI uyumlu endpoint'ler için `memorySearch` altında `queryInputType` ve `documentInputType` ayarlayın. OpenClaw bunları sağlayıcıya özgü `input_type` istek alanları olarak iletir: sorgu embeddings `queryInputType` kullanır; indekslenen bellek parçaları ve toplu indeksleme `documentInputType` kullanır. Tam örnek için [Bellek yapılandırma referansına](/tr/reference/memory-config#provider-specific-config) bakın.

## Başlarken

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="API anahtarı (OpenAI Platform)">
    **En uygun kullanım:** doğrudan API erişimi ve kullanıma dayalı faturalandırma.

    <Steps>
      <Step title="API anahtarınızı alın">
        [OpenAI Platform panosundan](https://platform.openai.com/api-keys) bir API anahtarı oluşturun veya kopyalayın.
      </Step>
      <Step title="Onboarding çalıştırın">
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

    | Model referansı       | Çalışma zamanı yapılandırması | Rota                        | Kimlik doğrulama |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | atlanmış / sağlayıcı/model `agentRuntime.id: "codex"` | Codex app-server harness'ı | Codex uyumlu OpenAI profili |
    | `openai/gpt-5.4-mini` | atlanmış / sağlayıcı/model `agentRuntime.id: "codex"` | Codex app-server harness'ı | Codex uyumlu OpenAI profili |
    | `openai/gpt-5.5`      | sağlayıcı/model `agentRuntime.id: "pi"`              | PI gömülü çalışma zamanı   | `openai` profili veya seçilen `openai-codex` profili |

    <Note>
    `openai/*` ajan modelleri Codex app-server harness'ını kullanır. Bir ajan modeli için API anahtarı kimlik doğrulaması kullanmak üzere Codex uyumlu bir API anahtarı profili oluşturun ve bunu `auth.order.openai` ile sıralayın; `OPENAI_API_KEY`, ajan dışı OpenAI API yüzeyleri için doğrudan fallback olarak kalır. Daha eski `auth.order.openai-codex` girdileri çalışmaya devam eder.
    </Note>

    ### Yapılandırma örneği

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    ChatGPT'nin mevcut Instant modelini OpenAI API üzerinden denemek için modeli `openai/chat-latest` olarak ayarlayın:

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` hareketli bir takma addır. OpenAI bunu ChatGPT'de kullanılan en son Instant model olarak belgeler ve üretim API kullanımı için `gpt-5.5` önerir; bu nedenle, bu takma ad davranışını açıkça istemediğiniz sürece kararlı varsayılan olarak `openai/gpt-5.5` kullanın. Takma ad şu anda yalnızca `medium` metin ayrıntı düzeyini kabul eder, bu nedenle OpenClaw bu model için uyumsuz OpenAI metin ayrıntı düzeyi geçersiz kılmalarını normalleştirir.

    <Warning>
    OpenClaw, `openai/gpt-5.3-codex-spark` modelini sunmaz. Canlı OpenAI API istekleri bu modeli reddeder ve mevcut Codex kataloğu da bunu sunmaz.
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **En uygun kullanım:** ayrı bir API anahtarı yerine yerel Codex app-server yürütmesiyle ChatGPT/Codex aboneliğinizi kullanmak. Codex bulutu ChatGPT oturumu açmayı gerektirir.

    <Steps>
      <Step title="Run Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Veya OAuth'u doğrudan çalıştırın:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Başsız veya callback açısından elverişsiz kurulumlar için localhost tarayıcı callback'i yerine ChatGPT aygıt kodu akışıyla oturum açmak üzere `--device-code` ekleyin:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Use the canonical OpenAI model route">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Varsayılan yol için çalışma zamanı yapılandırması gerekmez. OpenAI ajan dönüşleri
        yerel Codex app-server çalışma zamanını otomatik olarak seçer ve OpenClaw
        bu rota seçildiğinde paketle gelen Codex Plugin'ini kurar veya onarır.
      </Step>
      <Step title="Verify Codex auth is available">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Gateway çalıştıktan sonra, yerel app-server çalışma zamanını doğrulamak için
        sohbette `/codex status` veya `/codex models` gönderin.
      </Step>
    </Steps>

    ### Rota özeti

    | Model başvurusu | Çalışma zamanı yapılandırması | Rota | Kimlik doğrulama |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | atlanmış / sağlayıcı/model `agentRuntime.id: "codex"` | Yerel Codex app-server düzeneği | Codex oturumu açma veya sıralı `openai` kimlik doğrulama profili |
    | `openai/gpt-5.5` | sağlayıcı/model `agentRuntime.id: "pi"` | Dahili Codex kimlik doğrulamalı taşıma ile PI gömülü çalışma zamanı | Seçili `openai-codex` profili |
    | `openai-codex/gpt-5.5` | doctor tarafından onarılır | Eski rota `openai/gpt-5.5` olarak yeniden yazılır | Mevcut `openai-codex` profili |

    <Warning>
    Daha eski `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` veya
    `openai-codex/gpt-5.3*` model başvurularını yapılandırmayın. ChatGPT/Codex OAuth hesapları artık
    bu modelleri reddeder. `openai/gpt-5.5` kullanın; OpenAI ajan dönüşleri artık varsayılan olarak Codex
    çalışma zamanını seçer.
    </Warning>

    <Note>
    `openai-codex/*` model öneki, doctor tarafından onarılan eski yapılandırmadır. Yaygın
    abonelik artı yerel çalışma zamanı kurulumu için Codex kimlik doğrulamasıyla oturum açın
    ancak model başvurusunu `openai/gpt-5.5` olarak tutun. Yeni yapılandırma OpenAI
    ajan kimlik doğrulama sırasını `auth.order.openai` altında tutmalıdır; eski `auth.order.openai-codex`
    girdileri geçerli kalır.
    </Note>

    ### Yapılandırma örneği

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
    }
    ```

    API anahtarı yedeğiyle, modeli `openai/gpt-5.5` üzerinde tutun ve
    kimlik doğrulama sırasını `openai` altına koyun. OpenClaw önce aboneliği, ardından
    API anahtarını dener ve Codex düzeneğinde kalır:

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
      auth: {
        order: {
          openai: [
            "openai-codex:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    İlk kurulum artık `~/.codex` içinden OAuth malzemesi içe aktarmaz. Tarayıcı OAuth'u (varsayılan) veya yukarıdaki aygıt kodu akışıyla oturum açın — OpenClaw ortaya çıkan kimlik bilgilerini kendi ajan kimlik doğrulama deposunda yönetir.
    </Note>

    ### Codex OAuth yönlendirmesini denetleme ve kurtarma

    Varsayılan ajanınızın hangi modeli, çalışma zamanını ve kimlik doğrulama rotasını
    kullandığını görmek için bu komutları kullanın:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Belirli bir ajan için `--agent <id>` ekleyin:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    Daha eski bir yapılandırmada hâlâ `openai-codex/gpt-*` veya açık çalışma zamanı yapılandırması olmadan
    eski bir OpenAI PI oturum sabitlemesi varsa, onarın:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    `models auth list --provider openai-codex` kullanılabilir profil göstermiyorsa yeniden
    oturum açın:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai/*`, Codex üzerinden OpenAI ajan dönüşleri için model rotasıdır. Mevcut
    profiller ve CLI listeleme için `openai-codex` kimlik doğrulama/profil sağlayıcı kimliği
    kabul edilmeye devam eder.

    ### Durum göstergesi

    Sohbet `/status`, geçerli oturum için hangi model çalışma zamanının etkin olduğunu gösterir.
    Paketle gelen Codex app-server düzeneği, OpenAI ajan model dönüşleri için
    `Runtime: OpenAI Codex` olarak görünür. Eski PI oturum sabitlemeleri, yapılandırma
    PI'ı açıkça sabitlemediği sürece Codex'e onarılır.

    ### Doctor uyarısı

    `openai-codex/*` rotaları veya eski OpenAI PI sabitlemeleri yapılandırmada ya da
    oturum durumunda kalırsa, `openclaw doctor --fix` PI açıkça yapılandırılmadığı sürece
    bunları Codex çalışma zamanıyla `openai/*` olarak yeniden yazar.

    ### Bağlam penceresi üst sınırı

    OpenClaw model metadata'sını ve çalışma zamanı bağlam üst sınırını ayrı değerler olarak ele alır.

    Codex OAuth kataloğu üzerinden `openai/gpt-5.5` için:

    - Yerel `contextWindow`: `1000000`
    - Varsayılan çalışma zamanı `contextTokens` üst sınırı: `272000`

    Daha küçük varsayılan üst sınır pratikte daha iyi gecikme ve kalite özelliklerine sahiptir. Bunu `contextTokens` ile geçersiz kılın:

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
    OpenClaw bu OAuth model satırını üretir; böylece cron, alt ajan ve yapılandırılmış
    varsayılan model çalıştırmaları `Unknown model` ile başarısız olmaz.

  </Tab>
</Tabs>

## Yerel Codex app-server kimlik doğrulaması

Yerel Codex app-server düzeneği `openai/*` model başvurularını ve atlanmış
çalışma zamanı yapılandırmasını veya sağlayıcı/model `agentRuntime.id: "codex"` kullanır,
ancak kimlik doğrulaması hâlâ hesap tabanlıdır. OpenClaw kimlik doğrulamayı şu sırayla seçer:

1. Ajan için sıralı OpenAI kimlik doğrulama profilleri, tercihen
   `auth.order.openai` altında. Mevcut `openai-codex:*` profilleri ve
   `auth.order.openai-codex` eski kurulumlar için geçerli kalır.
2. App-server'ın mevcut hesabı, örneğin yerel Codex CLI ChatGPT oturumu.
3. Yalnızca yerel stdio app-server başlatmaları için, app-server hesap olmadığını bildirip
   hâlâ OpenAI kimlik doğrulaması gerektirdiğinde `CODEX_API_KEY`, ardından
   `OPENAI_API_KEY`.

Bu, Gateway sürecinde doğrudan OpenAI modelleri veya embedding'ler için
`OPENAI_API_KEY` de var diye yerel ChatGPT/Codex abonelik oturumunun
değiştirilmediği anlamına gelir. Env API anahtarı fallback'i yalnızca yerel stdio
hesapsız yoludur; WebSocket app-server bağlantılarına gönderilmez. Abonelik tarzı bir Codex
profili seçildiğinde OpenClaw ayrıca `CODEX_API_KEY` ve `OPENAI_API_KEY`
değerlerini oluşturulan stdio app-server alt sürecinin dışında tutar ve seçili kimlik bilgilerini
app-server login RPC üzerinden gönderir. Bu abonelik profili bir Codex kullanım sınırı tarafından engellendiğinde,
OpenClaw seçili modeli değiştirmeden veya Codex düzeneğinden çıkmadan sıradaki
`openai:*` API anahtarı profiline dönebilir. Abonelik sıfırlama zamanı geçtiğinde,
abonelik profili yeniden uygun olur.

## Görsel üretimi

Paketle gelen `openai` Plugin'i, `image_generate` aracı üzerinden görsel üretimini kaydeder.
Hem OpenAI API anahtarlı görsel üretimini hem de aynı `openai/gpt-image-2` model başvurusu
üzerinden Codex OAuth görsel üretimini destekler.

| Yetenek                  | OpenAI API anahtarı                | Codex OAuth                         |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Model başvurusu           | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Kimlik doğrulama          | `OPENAI_API_KEY`                   | OpenAI Codex OAuth oturumu           |
| Taşıma                    | OpenAI Images API                  | Codex Responses backend              |
| İstek başına maksimum görsel | 4                                  | 4                                    |
| Düzenleme modu            | Etkin (en fazla 5 referans görsel) | Etkin (en fazla 5 referans görsel)   |
| Boyut geçersiz kılmaları  | Desteklenir, 2K/4K boyutları dahil | Desteklenir, 2K/4K boyutları dahil   |
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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için [Görsel Üretimi](/tr/tools/image-generation) bölümüne bakın.
</Note>

`gpt-image-2`, hem OpenAI metinden görsel üretimi hem de görsel
düzenleme için varsayılandır. `gpt-image-1.5`, `gpt-image-1` ve `gpt-image-1-mini`
açık model geçersiz kılmaları olarak kullanılabilir kalır. Şeffaf arka planlı
PNG/WebP çıktısı için `openai/gpt-image-1.5` kullanın; mevcut `gpt-image-2` API'si
`background: "transparent"` değerini reddeder.

Şeffaf arka plan isteği için ajanlar `image_generate` aracını
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` veya `"webp"` ve
`background: "transparent"` ile çağırmalıdır; eski `openai.background` sağlayıcı seçeneği
hâlâ kabul edilir. OpenClaw ayrıca varsayılan `openai/gpt-image-2` şeffaf
isteklerini `gpt-image-1.5` olarak yeniden yazarak herkese açık OpenAI ve
OpenAI Codex OAuth rotalarını korur; Azure ve özel OpenAI uyumlu uç noktalar
yapılandırılmış deployment/model adlarını korur.

Aynı ayar başsız CLI çalıştırmaları için de sunulur:

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
`--openai-background`, OpenAI'a özgü alias olarak kullanılabilir kalır.

Codex OAuth kurulumları için aynı `openai/gpt-image-2` başvurusunu koruyun. Bir
`openai-codex` OAuth profili yapılandırıldığında OpenClaw depolanan OAuth
erişim token'ını çözer ve görsel isteklerini Codex Responses backend'i üzerinden gönderir. Bu
istek için önce `OPENAI_API_KEY` denemez veya sessizce bir API anahtarına fallback yapılmaz.
Bunun yerine doğrudan OpenAI Images API rotasını istediğinizde
`models.providers.openai` değerini bir API anahtarı, özel base URL veya Azure uç noktasıyla açıkça yapılandırın.
Bu özel görsel uç noktası güvenilir bir LAN/özel adresteyse ayrıca
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ayarlayın; OpenClaw bu opt-in
mevcut olmadıkça özel/dahili OpenAI uyumlu görsel uç noktalarını engellenmiş tutar.

Üret:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Şeffaf PNG üret:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Düzenle:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Video üretimi

Birlikte gelen `openai` Plugin'i, video oluşturmayı `video_generate` aracı üzerinden kaydeder.

| Yetenek                 | Değer                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------- |
| Varsayılan model        | `openai/sora-2`                                                                       |
| Modlar                  | Metinden videoya, görüntüden videoya, tek video düzenleme                             |
| Referans girdileri      | 1 görüntü veya 1 video                                                                |
| Boyut geçersiz kılmaları | Desteklenir                                                                          |
| Diğer geçersiz kılmalar | `aspectRatio`, `resolution`, `audio`, `watermark` bir araç uyarısıyla yok sayılır     |

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

OpenClaw, sağlayıcılar genelinde GPT-5 ailesi çalıştırmaları için paylaşılan bir GPT-5 istem katkısı ekler. Model kimliğine göre uygulanır; bu nedenle `openai/gpt-5.5`, `openai-codex/gpt-5.5` gibi eski onarım öncesi referanslar, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` ve diğer uyumlu GPT-5 referansları aynı katmanı alır. Daha eski GPT-4.x modelleri almaz.

Birlikte gelen yerel Codex harness, Codex app-server geliştirici yönergeleri üzerinden aynı GPT-5 davranışını ve heartbeat katmanını kullanır; bu nedenle Codex üzerinden yönlendirilen `openai/gpt-5.x` oturumları, harness isteminin geri kalanını Codex yönetse de aynı takip ve proaktif heartbeat rehberliğini korur.

GPT-5 katkısı; persona sürekliliği, yürütme güvenliği, araç disiplini, çıktı biçimi, tamamlama kontrolleri ve doğrulama için etiketli bir davranış sözleşmesi ekler. Kanala özgü yanıt ve sessiz mesaj davranışı, paylaşılan OpenClaw sistem isteminde ve giden teslim politikasında kalır. GPT-5 rehberliği, eşleşen modeller için her zaman etkindir. Dostane etkileşim stili katmanı ayrıdır ve yapılandırılabilir.

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
Değerler çalışma zamanında büyük/küçük harfe duyarlı değildir; bu yüzden `"Off"` ve `"off"` dostane stil katmanını devre dışı bırakır.
</Tip>

<Note>
Eski `plugins.entries.openai.config.personality`, paylaşılan `agents.defaults.promptOverlays.gpt5.personality` ayarı belirlenmediğinde hâlâ uyumluluk yedeği olarak okunur.
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
    | Yönergeler | `messages.tts.providers.openai.instructions` | (ayarlanmamış, yalnızca `gpt-4o-mini-tts`) |
    | Biçim | `messages.tts.providers.openai.responseFormat` | sesli notlar için `opus`, dosyalar için `mp3` |
    | API anahtarı | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY` değerine geri döner |
    | Temel URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Ek gövde | `messages.tts.providers.openai.extraBody` / `extra_body` | (ayarlanmamış) |

    Kullanılabilir modeller: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Kullanılabilir sesler: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody`, OpenClaw tarafından oluşturulan alanlardan sonra `/audio/speech` istek JSON'una birleştirilir; bu yüzden `lang` gibi ek anahtarlar gerektiren OpenAI uyumlu uç noktalar için kullanın. Prototip anahtarları yok sayılır.

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
    Sohbet API uç noktasını etkilemeden TTS temel URL'sini geçersiz kılmak için `OPENAI_TTS_BASE_URL` ayarını belirleyin. OpenAI TTS hâlâ bir API anahtarı üzerinden yapılandırılır; yalnızca OAuth kullanan canlı konuşma yanıtı için agent modu STT -> TTS konuşması yerine Realtime ses yolunu kullanın.
    </Note>

  </Accordion>

  <Accordion title="Konuşmadan metne">
    Birlikte gelen `openai` Plugin'i, toplu konuşmadan metne dönüştürmeyi
    OpenClaw'ın medya anlama transkripsiyon yüzeyi üzerinden kaydeder.

    - Varsayılan model: `gpt-4o-transcribe`
    - Uç nokta: OpenAI REST `/v1/audio/transcriptions`
    - Girdi yolu: multipart ses dosyası yükleme
    - Gelen ses transkripsiyonunun `tools.media.audio` kullandığı her yerde,
      Discord ses kanalı segmentleri ve kanal ses ekleri dahil olmak üzere
      OpenClaw tarafından desteklenir

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

    Dil ve istem ipuçları, paylaşılan ses medya yapılandırması veya çağrı başına
    transkripsiyon isteği tarafından sağlandığında OpenAI'a iletilir.

  </Accordion>

  <Accordion title="Gerçek zamanlı transkripsiyon">
    Birlikte gelen `openai` Plugin, Voice Call Plugin için gerçek zamanlı transkripsiyonu kaydeder.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Dil | `...openai.language` | (ayarlanmamış) |
    | İstem | `...openai.prompt` | (ayarlanmamış) |
    | Sessizlik süresi | `...openai.silenceDurationMs` | `800` |
    | VAD eşiği | `...openai.vadThreshold` | `0.5` |
    | Kimlik doğrulama | `...openai.apiKey`, `OPENAI_API_KEY` veya `openai-codex` OAuth | API anahtarları doğrudan bağlanır; OAuth bir Realtime transkripsiyon istemci sırrı üretir |

    <Note>
    G.711 u-law (`g711_ulaw` / `audio/pcmu`) ses ile `wss://api.openai.com/v1/realtime` adresine bir WebSocket bağlantısı kullanır. Yalnızca `openai-codex` OAuth yapılandırıldığında, Gateway WebSocket'i açmadan önce geçici bir Realtime transkripsiyon istemci sırrı üretir. Bu akış sağlayıcısı, Voice Call'un gerçek zamanlı transkripsiyon yolu içindir; Discord ses özelliği şu anda kısa segmentler kaydeder ve bunun yerine toplu `tools.media.audio` transkripsiyon yolunu kullanır.
    </Note>

  </Accordion>

  <Accordion title="Gerçek zamanlı ses">
    Birlikte gelen `openai` Plugin, Voice Call Plugin için gerçek zamanlı sesi kaydeder.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Ses | `...openai.voice` | `alloy` |
    | Sıcaklık (Azure dağıtım köprüsü) | `...openai.temperature` | `0.8` |
    | VAD eşiği | `...openai.vadThreshold` | `0.5` |
    | Sessizlik süresi | `...openai.silenceDurationMs` | `500` |
    | Ön ek dolgusu | `...openai.prefixPaddingMs` | `300` |
    | Akıl yürütme çabası | `...openai.reasoningEffort` | (ayarlanmamış) |
    | Kimlik doğrulama | `...openai.apiKey`, `OPENAI_API_KEY` veya `openai-codex` OAuth | Browser Talk ve Azure olmayan arka uç köprüleri Codex OAuth kullanabilir |

    `gpt-realtime-2` için kullanılabilir yerleşik Realtime sesleri: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI en iyi Realtime kalitesi için `marin` ve `cedar` kullanılmasını önerir. Bu,
    yukarıdaki metinden sese seslerinden ayrı bir kümedir; `fable`, `nova` veya
    `onyx` gibi bir TTS sesinin Realtime oturumları için geçerli olduğunu varsaymayın.

    <Note>
    Arka uç OpenAI gerçek zamanlı köprüleri, `session.temperature` kabul etmeyen GA Realtime WebSocket oturum biçimini kullanır. Azure OpenAI dağıtımları `azureEndpoint` ve `azureDeployment` üzerinden kullanılabilir kalır ve dağıtımla uyumlu oturum biçimini korur. Çift yönlü araç çağırmayı ve G.711 u-law sesi destekler.
    </Note>

    <Note>
    Gerçek zamanlı ses, oturum oluşturulduğunda seçilir. OpenAI çoğu
    oturum alanının daha sonra değiştirilmesine izin verir, ancak model o
    oturumda ses ürettikten sonra ses değiştirilemez. OpenClaw şu anda
    yerleşik Realtime ses kimliklerini dizeler olarak sunar.
    </Note>

    <Note>
    Control UI Talk, Gateway tarafından üretilen geçici bir istemci sırrı ve
    OpenAI Realtime API'ye karşı doğrudan tarayıcı WebRTC SDP değişimi ile
    OpenAI tarayıcı gerçek zamanlı oturumlarını kullanır. Doğrudan OpenAI API
    anahtarı yapılandırılmadığında, Gateway bu istemci sırrını seçili
    `openai-codex` OAuth profiliyle üretebilir. Gateway aktarımı ve Voice Call
    arka uç gerçek zamanlı WebSocket köprüleri, yerel OpenAI uç noktaları için
    aynı OAuth yedeğini kullanır. Sorumlu canlı doğrulaması
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
    ile kullanılabilir; OpenAI ayakları, sırları günlüğe yazmadan hem arka uç
    WebSocket köprüsünü hem de tarayıcı WebRTC SDP değişimini doğrular.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI uç noktaları

Birlikte gelen `openai` sağlayıcısı, temel URL'yi geçersiz kılarak görüntü
üretimi için bir Azure OpenAI kaynağını hedefleyebilir. Görüntü üretimi yolunda,
OpenClaw `models.providers.openai.baseUrl` üzerindeki Azure ana makine adlarını
algılar ve otomatik olarak Azure'un istek biçimine geçer.

<Note>
Gerçek zamanlı ses ayrı bir yapılandırma yolu kullanır
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
ve `models.providers.openai.baseUrl` tarafından etkilenmez. Azure ayarları için
[Ses ve konuşma](#voice-and-speech) altındaki **Gerçek zamanlı ses** akordeonuna
bakın.
</Note>

Azure OpenAI'ı şu durumlarda kullanın:

- Zaten bir Azure OpenAI aboneliğiniz, kotanız veya kurumsal anlaşmanız varsa
- Azure'un sağladığı bölgesel veri yerleşimi veya uyumluluk kontrollerine ihtiyacınız varsa
- Trafiği mevcut bir Azure kiracılığı içinde tutmak istiyorsanız

### Yapılandırma

Birlikte gelen `openai` sağlayıcısı üzerinden Azure görüntü üretimi için
`models.providers.openai.baseUrl` değerini Azure kaynağınıza yönlendirin ve
`apiKey` değerini Azure OpenAI anahtarı olarak ayarlayın (OpenAI Platform anahtarı değil):

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

Tanınan bir Azure ana makinesindeki görüntü üretimi isteklerinde OpenClaw:

- `Authorization: Bearer` yerine `api-key` üst bilgisini gönderir
- Dağıtım kapsamlı yolları (`/openai/deployments/{deployment}/...`) kullanır
- Her isteğe `?api-version=...` ekler
- Azure görüntü üretimi çağrıları için varsayılan 600 sn istek zaman aşımı kullanır.
  Çağrı başına `timeoutMs` değerleri yine de bu varsayılanı geçersiz kılar.

Diğer temel URL'ler (genel OpenAI, OpenAI uyumlu proxy'ler) standart
OpenAI görüntü isteği biçimini korur.

<Note>
`openai` sağlayıcısının görüntü üretimi yolu için Azure yönlendirmesi,
OpenClaw 2026.4.22 veya sonrasını gerektirir. Önceki sürümler herhangi bir özel
`openai.baseUrl` değerini genel OpenAI uç noktası gibi ele alır ve Azure
görüntü dağıtımlarında başarısız olur.
</Note>

### API sürümü

Azure görüntü oluşturma yolu için belirli bir Azure önizleme veya GA sürümünü
sabitlemek üzere `AZURE_OPENAI_API_VERSION` değerini ayarlayın:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Değişken ayarlanmamışsa varsayılan değer `2024-12-01-preview` olur.

### Model adları dağıtım adlarıdır

Azure OpenAI, modelleri dağıtımlara bağlar. Paketle gelen `openai` sağlayıcısı
üzerinden yönlendirilen Azure görüntü oluşturma istekleri için OpenClaw içindeki
`model` alanı, genel OpenAI model kimliği değil, Azure portalında yapılandırdığınız
**Azure dağıtım adı** olmalıdır.

`gpt-image-2` sunan `gpt-image-2-prod` adlı bir dağıtım oluşturursanız:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Aynı dağıtım adı kuralı, paketle gelen `openai` sağlayıcısı üzerinden yönlendirilen
görüntü oluşturma çağrıları için de geçerlidir.

### Bölgesel kullanılabilirlik

Azure görüntü oluşturma şu anda yalnızca belirli bölgelerin bir alt kümesinde
kullanılabilir (örneğin `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Bir dağıtım oluşturmadan önce Microsoft'un güncel bölge listesini
kontrol edin ve belirli modelin bölgenizde sunulduğunu doğrulayın.

### Parametre farklılıkları

Azure OpenAI ve genel OpenAI her zaman aynı görüntü parametrelerini kabul etmez.
Azure, genel OpenAI'ın izin verdiği seçenekleri reddedebilir (örneğin
`gpt-image-2` üzerinde belirli `background` değerleri) veya bunları yalnızca
belirli model sürümlerinde sunabilir. Bu farklar OpenClaw'dan değil, Azure'dan ve
altta yatan modelden kaynaklanır. Bir Azure isteği doğrulama hatasıyla başarısız
olursa, belirli dağıtımınız ve API sürümünüz tarafından desteklenen parametre
kümesini Azure portalında kontrol edin.

<Note>
Azure OpenAI yerel aktarım ve uyumluluk davranışı kullanır ancak OpenClaw'ın
gizli atıf üstbilgilerini almaz; bkz. [Gelişmiş yapılandırma](#advanced-configuration)
altındaki **Yerel ve OpenAI uyumlu rotalar** akordeonu.

Azure üzerinde sohbet veya Responses trafiği için (görüntü oluşturmanın ötesinde),
başlatma akışını veya özel bir Azure sağlayıcı yapılandırmasını kullanın;
yalnızca `openai.baseUrl`, Azure API/kimlik doğrulama biçimini devralmaz. Ayrı bir
`azure-openai-responses/*` sağlayıcısı vardır; aşağıdaki Sunucu tarafı Compaction
akordeonuna bakın.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Aktarım (WebSocket ve SSE)">
    OpenClaw, `openai/*` için önce WebSocket kullanır ve SSE geri dönüşü (`"auto"`) sağlar.

    `"auto"` modunda OpenClaw:
    - SSE'ye geri dönmeden önce erken bir WebSocket hatasını bir kez yeniden dener
    - Bir hatadan sonra WebSocket'i yaklaşık 60 saniye bozulmuş olarak işaretler ve soğuma sırasında SSE kullanır
    - Yeniden denemeler ve yeniden bağlantılar için kararlı oturum ve tur kimliği üstbilgileri ekler
    - Aktarım varyantları arasında kullanım sayaçlarını (`input_tokens` / `prompt_tokens`) normalleştirir

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
          },
        },
      },
    }
    ```

    İlgili OpenAI dokümanları:
    - [WebSocket ile Realtime API](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API yanıtları (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Hızlı mod">
    OpenClaw, `openai/*` için paylaşılan bir hızlı mod açma/kapatma seçeneği sunar:

    - **Sohbet/UI:** `/fast status|on|off`
    - **Yapılandırma:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Etkinleştirildiğinde OpenClaw hızlı modu OpenAI öncelikli işlemeye (`service_tier = "priority"`) eşler. Mevcut `service_tier` değerleri korunur ve hızlı mod `reasoning` veya `text.verbosity` değerlerini yeniden yazmaz.

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
    Oturum geçersiz kılmaları yapılandırmaya üstün gelir. Sessions UI içinde oturum geçersiz kılmasını temizlemek, oturumu yapılandırılmış varsayılan değere döndürür.
    </Note>

  </Accordion>

  <Accordion title="Öncelikli işleme (service_tier)">
    OpenAI API'si, `service_tier` üzerinden öncelikli işlemeyi sunar. OpenClaw içinde bunu model başına ayarlayın:

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
    `serviceTier` yalnızca yerel OpenAI uç noktalarına (`api.openai.com`) ve yerel Codex uç noktalarına (`chatgpt.com/backend-api`) iletilir. İki sağlayıcıdan birini proxy üzerinden yönlendirirseniz OpenClaw `service_tier` değerine dokunmaz.
    </Warning>

  </Accordion>

  <Accordion title="Sunucu tarafı Compaction (Responses API)">
    Doğrudan OpenAI Responses modelleri için (`api.openai.com` üzerinde `openai/*`), OpenAI Plugin'inin Pi harness akış sarmalayıcısı sunucu tarafı Compaction'ı otomatik etkinleştirir:

    - `store: true` değerini zorlar (model uyumluluğu `supportsStore: false` ayarlamadıkça)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` ekler
    - Varsayılan `compact_threshold`: `contextWindow` değerinin %70'i (veya kullanılamadığında `80000`)

    Bu, yerleşik Pi harness yolu ve gömülü çalıştırmalar tarafından kullanılan OpenAI sağlayıcı hook'ları için geçerlidir. Yerel Codex uygulama sunucusu harness'ı, kendi bağlamını Codex üzerinden yönetir ve OpenAI'ın varsayılan aracı rotası veya sağlayıcı/model çalışma zamanı politikası tarafından yapılandırılır.

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
    `responsesServerCompaction` yalnızca `context_management` eklemeyi denetler. Doğrudan OpenAI Responses modelleri, uyumluluk `supportsStore: false` ayarlamadıkça yine de `store: true` değerini zorlar.
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
    - Bir araç eylemi mevcut olduğunda yalnızca plandan oluşan bir turu artık başarılı ilerleme olarak değerlendirmez
    - Turu hemen eyleme geç yönlendirmesiyle yeniden dener
    - Önemli işler için `update_plan` değerini otomatik etkinleştirir
    - Model eyleme geçmeden planlamaya devam ederse açık bir engellenmiş durum gösterir

    <Note>
    Yalnızca OpenAI ve Codex GPT-5 ailesi çalıştırmalarıyla sınırlıdır. Diğer sağlayıcılar ve eski model aileleri varsayılan davranışı korur.
    </Note>

  </Accordion>

  <Accordion title="Yerel ve OpenAI uyumlu rotalar">
    OpenClaw, doğrudan OpenAI, Codex ve Azure OpenAI uç noktalarını genel OpenAI uyumlu `/v1` proxy'lerinden farklı ele alır:

    **Yerel rotalar** (`openai/*`, Azure OpenAI):
    - `reasoning: { effort: "none" }` değerini yalnızca OpenAI `none` eforunu destekleyen modeller için tutar
    - `reasoning.effort: "none"` değerini reddeden modeller veya proxy'ler için devre dışı reasoning'i atlar
    - Araç şemalarını varsayılan olarak katı moda ayarlar
    - Gizli atıf üstbilgilerini yalnızca doğrulanmış yerel host'lara ekler
    - Yalnızca OpenAI'a özgü istek biçimlendirmesini (`service_tier`, `store`, reasoning uyumluluğu, prompt cache ipuçları) korur

    **Proxy/uyumlu rotalar:**
    - Daha gevşek uyumluluk davranışı kullanır
    - Yerel olmayan `openai-completions` yüklerinden Completions `store` değerini çıkarır
    - OpenAI uyumlu Completions proxy'leri için gelişmiş `params.extra_body`/`params.extraBody` doğrudan geçişli JSON kabul eder
    - vLLM gibi OpenAI uyumlu Completions proxy'leri için `params.chat_template_kwargs` kabul eder
    - Katı araç şemalarını veya yalnızca yerel üstbilgileri zorlamaz

    Azure OpenAI yerel aktarım ve uyumluluk davranışı kullanır ancak gizli atıf üstbilgilerini almaz.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve failover davranışını seçme.
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

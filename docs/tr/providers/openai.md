---
read_when:
    - OpenClaw'da OpenAI modellerini kullanmak istiyorsunuz
    - Codex abonelik kimlik doğrulamasını API anahtarları yerine istiyorsunuz
    - Daha katı GPT-5 ajan yürütme davranışına ihtiyacınız var
summary: OpenClaw’da OpenAI’yi API anahtarları veya Codex aboneliğiyle kullanın
title: OpenAI
x-i18n:
    generated_at: "2026-07-01T08:27:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7078798b1d73bd1efca4820eae6d3fb6510e802b2c9193d0c135d8ab28c58fca
    source_path: providers/openai.md
    workflow: 16
---

OpenAI, GPT modelleri için geliştirici API'leri sağlar ve Codex ayrıca OpenAI'ın Codex istemcileri üzerinden
ChatGPT planına dahil bir kodlama ajanı olarak da kullanılabilir. OpenClaw, her iki kimlik doğrulama biçimi için
tek bir sağlayıcı kimliği, `openai`, kullanır.

OpenClaw, kanonik OpenAI model rotası olarak `openai/*` kullanır. OpenAI modellerindeki gömülü ajan
turları varsayılan olarak yerel Codex app-server çalışma zamanı üzerinden çalışır; doğrudan OpenAI API anahtarı kimlik doğrulaması,
görüntüler, embeddings, konuşma ve realtime gibi ajan dışı OpenAI
yüzeyleri için kullanılabilir kalır.

- **Ajan modelleri** - Codex çalışma zamanı üzerinden `openai/*` modelleri; ChatGPT/Codex abonelik kullanımı için
  Codex kimlik doğrulamasıyla oturum açın veya özellikle API anahtarı kimlik doğrulaması istediğinizde Codex uyumlu
  bir OpenAI API anahtarı yedeği yapılandırın.
- **Ajan dışı OpenAI API'leri** - `OPENAI_API_KEY` veya OpenAI API anahtarı onboarding üzerinden kullanıma dayalı
  faturalandırmayla doğrudan OpenAI Platform erişimi.
- **Eski yapılandırma** - eski Codex model başvuruları
  `openclaw doctor --fix` tarafından `openai/*` artı Codex çalışma zamanına onarılır.

OpenAI, OpenClaw gibi dış araçlarda ve iş akışlarında abonelik OAuth kullanımını açıkça destekler.

Sağlayıcı, model, çalışma zamanı ve kanal ayrı katmanlardır. Bu etiketler
birbirine karışıyorsa, yapılandırmayı değiştirmeden önce [Ajan çalışma zamanları](/tr/concepts/agent-runtimes) sayfasını okuyun.

## Hızlı seçim

| Hedef                                                 | Kullanım                                                 | Notlar                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| Yerel Codex çalışma zamanıyla ChatGPT/Codex aboneliği | `openai/gpt-5.5`                                         | Varsayılan OpenAI ajan kurulumu. Codex kimlik doğrulamasıyla oturum açın. |
| GPT-5.6 sınırlı önizleme                              | `openai/gpt-5.6-sol`, `-terra` veya `-luna`              | OpenAI onaylı bir API kuruluşu veya Codex çalışma alanı gerektirir.   |
| Ajan modelleri için doğrudan API anahtarı faturalandırması | `openai/gpt-5.5` artı Codex uyumlu API anahtarı profili | Yedeği abonelik kimlik doğrulamasından sonra konumlandırmak için `auth.order.openai` kullanın. |
| Açık OpenClaw üzerinden doğrudan API anahtarı faturalandırması | `openai/gpt-5.5` artı sağlayıcı/model çalışma zamanı `openclaw` | Normal bir `openai` API anahtarı profili seçin.                       |
| En son ChatGPT Instant API alias'ı                    | `openai/chat-latest`                                     | Yalnızca doğrudan API anahtarı. Varsayılan değil, deneyler için hareketli alias. |
| OpenClaw üzerinden ChatGPT/Codex abonelik kimlik doğrulaması | `openai/gpt-5.5` artı sağlayıcı/model çalışma zamanı `openclaw` | Uyumluluk rotası için bir `openai` OAuth profili seçin.               |
| Görüntü oluşturma veya düzenleme                      | `openai/gpt-image-2`                                     | `OPENAI_API_KEY` veya OpenAI Codex OAuth ile çalışır.                 |
| Şeffaf arka planlı görüntüler                         | `openai/gpt-image-1.5`                                   | `outputFormat=png` veya `webp` ve `openai.background=transparent` kullanın. |

## Adlandırma haritası

Adlar benzerdir ancak birbirinin yerine kullanılamaz:

| Gördüğünüz ad                           | Katman            | Anlamı                                                                                            |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | Sağlayıcı öneki   | Kanonik OpenAI model rotası; ajan turları Codex çalışma zamanını kullanır.                        |
| eski OpenAI Codex öneki                 | Eski önek         | Eski model/profil ad alanı. `openclaw doctor --fix` bunu `openai` değerine taşır.                 |
| `codex` Plugin                          | Plugin            | Yerel Codex app-server çalışma zamanı ve `/codex` sohbet kontrolleri sağlayan paketli OpenClaw Plugin'i. |
| sağlayıcı/model `agentRuntime.id: codex` | Ajan çalışma zamanı | Eşleşen gömülü turlar için yerel Codex app-server harness'ını zorlar.                             |
| `/codex ...`                            | Sohbet komut kümesi | Bir konuşmadan Codex app-server thread'lerini bağlayın/kontrol edin.                              |
| `runtime: "acp", agentId: "codex"`      | ACP oturum rotası | Codex'i ACP/acpx üzerinden çalıştıran açık fallback yolu.                                         |

Bu, bir yapılandırmanın bilerek `openai/*` model başvuruları içerebileceği, kimlik doğrulama
profillerinin ise API anahtarı veya ChatGPT/Codex OAuth kimlik bilgilerine işaret edebileceği anlamına gelir. Yapılandırma için
`auth.order.openai` kullanın; `openclaw doctor --fix`, eski
eski Codex model başvurularını, eski Codex kimlik doğrulama profil kimliklerini ve
eski Codex kimlik doğrulama sırasını kanonik OpenAI rotasına yeniden yazar.

<Note>
GPT-5.5 hem doğrudan OpenAI Platform API anahtarı erişimi hem de
abonelik/OAuth rotaları üzerinden kullanılabilir. ChatGPT/Codex aboneliği artı yerel Codex
yürütmesi için `openai/gpt-5.5` kullanın; çalışma zamanı yapılandırmasının ayarlanmaması artık OpenAI
ajan turları için Codex harness'ını seçer. OpenAI API anahtarı profillerini yalnızca
bir OpenAI ajan modeli için doğrudan API anahtarı kimlik doğrulaması istediğinizde kullanın.
</Note>

## GPT-5.6 sınırlı önizleme

OpenClaw üç genel GPT-5.6 model kimliğini tanır:

- `openai/gpt-5.6-sol`
- `openai/gpt-5.6-terra`
- `openai/gpt-5.6-luna`

Üçü de geçerli Codex app-server kataloğunda `max` reasoning sunar. OpenAI
lansman duyurusu Sol'u flagship tier, Terra'yı balanced tier ve Luna'yı hızlı, daha düşük maliyetli tier
olarak tanımlar. [GPT-5.6 lansman duyurusu](https://openai.com/index/previewing-gpt-5-6-sol/)
ve [önizleme erişim kılavuzu](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna) sayfalarına bakın.

Erişim önizleme sırasında allowlist ile verilir ve API ile Codex için ayrı ayrı verilebilir.
Yalnızca ücretli bir ChatGPT planı erişim sağlamaz. OpenClaw,
`openai/gpt-5.5` değerini varsayılan olarak tutar; erişim olmadan bir GPT-5.6 başvurusu seçmek,
sessizce fallback yapmak yerine upstream erişim hatasını döndürür.

<Note>
OpenAI ajan modeli turları paketli Codex app-server Plugin'ini gerektirir. Açık
OpenClaw çalışma zamanı yapılandırması opt-in uyumluluk rotası olarak kullanılabilir kalır. OpenClaw
bir `openai` OAuth profiliyle açıkça seçildiğinde, OpenClaw genel model başvurusunu
`openai/*` olarak tutar ve dahili olarak Codex kimlik doğrulamalı transport üzerinden yönlendirir.
Açık çalışma zamanı yapılandırmasından gelmeyen bayat eski Codex model başvurularını,
`codex-cli/*` veya eski çalışma zamanı oturum pin'lerini onarmak için `openclaw doctor --fix` çalıştırın.
</Note>

## OpenClaw özellik kapsamı

| OpenAI yeteneği          | OpenClaw yüzeyi                                                                                | Durum                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Chat / Responses          | `openai/<model>` model sağlayıcısı                                                            | Evet                                                                   |
| Codex abonelik modelleri  | OpenAI OAuth ile `openai/<model>`                                                             | Evet                                                                   |
| Eski Codex model başvuruları | eski Codex model başvuruları veya `codex-cli/<model>`                                      | doctor tarafından `openai/<model>` değerine onarılır                  |
| Codex app-server harness'ı | çalışma zamanı atlanmış `openai/<model>` veya sağlayıcı/model `agentRuntime.id: codex`       | Evet                                                                   |
| Sunucu tarafı web araması | Yerel OpenAI Responses aracı                                                                  | Evet, web araması etkinleştirildiğinde ve sağlayıcı pin'lenmediğinde  |
| Görüntüler                | `image_generate`                                                                              | Evet                                                                   |
| Videolar                  | `video_generate`                                                                              | Evet                                                                   |
| Metinden konuşmaya        | `messages.tts.provider: "openai"` / `tts`                                                     | Evet                                                                   |
| Toplu konuşmadan metne    | `tools.media.audio` / medya anlama                                                            | Evet                                                                   |
| Streaming konuşmadan metne | Voice Call `streaming.provider: "openai"`                                                    | Evet                                                                   |
| Realtime ses              | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | Evet (Codex/ChatGPT aboneliği değil, OpenAI Platform kredileri gerektirir) |
| Embeddings                | bellek embedding sağlayıcısı                                                                  | Evet                                                                   |

<Note>
  OpenAI Realtime ses (Voice Call'un `realtime.provider: "openai"` değeri ve
  Control UI Talk'un `talk.realtime.provider: "openai"` değeri tarafından kullanılır), Codex/ChatGPT
  abonelik kotası yerine OpenAI Platform kredilerine göre faturalandırılan genel
  **OpenAI Platform Realtime API** üzerinden gider. Codex destekli sohbet modellerini sorunsuz çalıştıran
  sağlıklı OpenAI OAuth'a sahip bir hesabın bile Realtime ses için finanse edilmiş Platform faturalandırması olan
  bir OpenAI API anahtarı kimlik doğrulama profiline veya Platform API anahtarına ihtiyacı vardır.

Düzeltme: realtime kimlik bilgilerinizin arkasındaki kuruluş için
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
üzerinden Platform kredilerini doldurun. Realtime ses, `openclaw onboard --auth-choice openai-api-key`
tarafından oluşturulan `openai` API anahtarı kimlik doğrulama profilini,
Control UI Talk için `talk.realtime.providers.openai.apiKey` üzerinden yapılandırılmış bir Platform `OPENAI_API_KEY` değerini,
Voice Call için `plugins.entries.voice-call.config.realtime.providers.openai.apiKey` değerini
veya `OPENAI_API_KEY` ortam değişkenini kabul eder. OpenAI OAuth profilleri aynı
OpenClaw kurulumunda Codex destekli `openai/*` sohbet modellerini çalıştırabilir, ancak Realtime sesi yapılandırmaz.
</Note>

## Bellek embeddings

OpenClaw, `memory_search` indeksleme ve sorgu embeddings için OpenAI'ı veya OpenAI uyumlu bir embedding endpoint'ini
kullanabilir:

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

Asimetrik embedding etiketleri gerektiren OpenAI uyumlu endpoint'ler için
`memorySearch` altında `queryInputType` ve `documentInputType` ayarlayın. OpenClaw bunları
sağlayıcıya özgü `input_type` istek alanları olarak iletir: sorgu embeddings
`queryInputType` kullanır; indekslenen bellek parçaları ve toplu indeksleme
`documentInputType` kullanır. Tam örnek için [Bellek yapılandırma başvurusu](/tr/reference/memory-config#provider-specific-config) sayfasına bakın.

## Başlarken

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="API anahtarı (OpenAI Platform)">
    **En uygun kullanım:** doğrudan API erişimi ve kullanıma dayalı faturalandırma.

    <Steps>
      <Step title="API anahtarınızı alın">
        [OpenAI Platform dashboard](https://platform.openai.com/api-keys) üzerinden bir API anahtarı oluşturun veya kopyalayın.
      </Step>
      <Step title="Onboarding'i çalıştırın">
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

    | Model ref              | Çalışma zamanı yapılandırması             | Rota                       | Kimlik doğrulama             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | atlanmış / provider/model `agentRuntime.id: "codex"` | Codex app-server donanımı | Codex uyumlu OpenAI profili |
    | `openai/gpt-5.4-mini` | atlanmış / provider/model `agentRuntime.id: "codex"` | Codex app-server donanımı | Codex uyumlu OpenAI profili |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "openclaw"`              | OpenClaw gömülü çalışma zamanı      | Seçili `openai` profili |

    <Note>
    `openai/*` ajan modelleri Codex app-server donanımını kullanır. Bir ajan
    modeli için API anahtarı kimlik doğrulaması kullanmak üzere Codex uyumlu bir
    API anahtarı profili oluşturun ve bunu `auth.order.openai` ile sıralayın;
    `OPENAI_API_KEY`, ajan dışı OpenAI API yüzeyleri için doğrudan yedek olarak
    kalır. Eski legacy Codex kimlik doğrulama sırası girdilerini taşımak için
    `openclaw doctor --fix` çalıştırın.
    </Note>

    ### Yapılandırma örneği

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    ChatGPT'nin OpenAI API'deki geçerli Instant modelini denemek için modeli
    `openai/chat-latest` olarak ayarlayın:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` hareketli bir takma addır. OpenAI bunu ChatGPT'de kullanılan
    en yeni Instant modeli olarak belgeler ve üretim API kullanımı için
    `gpt-5.5` önerir; bu nedenle, bu takma ad davranışını açıkça istemediğiniz
    sürece kararlı varsayılan olarak `openai/gpt-5.5` kullanın. Takma ad şu anda
    yalnızca `medium` metin ayrıntı düzeyini kabul eder, bu nedenle OpenClaw bu
    model için uyumsuz OpenAI metin ayrıntı düzeyi geçersiz kılmalarını
    normalleştirir.

    <Warning>
    OpenClaw, doğrudan OpenAI API anahtarı rotasında `gpt-5.3-codex-spark` sunmaz. Bu model yalnızca oturum açmış hesabınız bunu sunduğunda Codex abonelik katalog girdileri üzerinden kullanılabilir.
    </Warning>

  </Tab>

  <Tab title="Codex aboneliği">
    **Şunlar için en iyi:** ayrı bir API anahtarı yerine doğal Codex app-server yürütmesiyle ChatGPT/Codex aboneliğinizi kullanmak. Codex bulutu ChatGPT oturumu gerektirir.

    <Steps>
      <Step title="Codex OAuth çalıştırın">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        Ya da OAuth'u doğrudan çalıştırın:

        ```bash
        openclaw models auth login --provider openai
        ```

        Başsız veya callback açısından sorunlu kurulumlar için localhost tarayıcı callback'i yerine ChatGPT cihaz kodu akışıyla oturum açmak üzere `--device-code` ekleyin:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Kanonik OpenAI model rotasını kullanın">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Varsayılan yol için çalışma zamanı yapılandırması gerekmez. OpenAI ajan
        turları doğal Codex app-server çalışma zamanını otomatik olarak seçer ve
        bu rota seçildiğinde OpenClaw paketli Codex plugin'ini kurar veya onarır.
      </Step>
      <Step title="Codex kimlik doğrulamasının kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider openai
        ```

        Gateway çalıştıktan sonra doğal app-server çalışma zamanını doğrulamak
        için sohbette `/codex status` veya `/codex models` gönderin.
      </Step>
    </Steps>

    ### Rota özeti

    | Model ref | Çalışma zamanı yapılandırması | Rota | Kimlik doğrulama |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | atlanmış / provider/model `agentRuntime.id: "codex"` | Doğal Codex app-server donanımı | Codex oturumu veya sıralı `openai` kimlik doğrulama profili |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "openclaw"` | Dahili Codex kimlik doğrulama taşımasıyla OpenClaw gömülü çalışma zamanı | Seçili `openai` OAuth profili |
    | legacy Codex GPT-5.5 ref | doctor tarafından onarıldı | Legacy rota `openai/gpt-5.5` olarak yeniden yazıldı | Taşınmış OpenAI OAuth profili |
    | `codex-cli/gpt-5.5` | doctor tarafından onarıldı | Legacy CLI rotası `openai/gpt-5.5` olarak yeniden yazıldı | Codex app-server kimlik doğrulaması |

    <Warning>
    Yeni abonelik destekli ajan yapılandırması için `openai/gpt-5.5` tercih edin.
    Eski legacy Codex GPT ref'leri doğal Codex çalışma zamanı yolu değil, legacy
    OpenClaw rotalarıdır; bunları kanonik `openai/*` ref'lerine taşımak
    istediğinizde `openclaw doctor --fix` çalıştırın. `gpt-5.3-codex-spark`,
    Codex abonelik kataloğu bu modeli duyuran hesaplarla sınırlı kalır; bu model
    için doğrudan OpenAI API anahtarı ve Azure ref'leri bastırılmış kalır.
    </Warning>

    <Note>
    Legacy Codex model öneki, doctor tarafından onarılan legacy yapılandırmadır.
    Yaygın abonelik artı doğal çalışma zamanı kurulumu için Codex kimlik
    doğrulamasıyla oturum açın, ancak model ref'ini `openai/gpt-5.5` olarak
    tutun. Yeni yapılandırma OpenAI ajan kimlik doğrulama sırasını
    `auth.order.openai` altında koymalıdır; doctor eski legacy Codex kimlik
    doğrulama sırası girdilerini taşır.
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

    API anahtarı yedeğiyle modeli `openai/gpt-5.5` üzerinde tutun ve kimlik
    doğrulama sırasını `openai` altına koyun. OpenClaw, Codex donanımında kalırken
    önce aboneliği, ardından API anahtarını dener:

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
            "openai:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    İlk kurulum artık OAuth materyalini `~/.codex` konumundan içe aktarmaz. Tarayıcı OAuth'u (varsayılan) veya yukarıdaki cihaz kodu akışıyla oturum açın — OpenClaw ortaya çıkan kimlik bilgilerini kendi ajan kimlik doğrulama deposunda yönetir.
    </Note>

    ### Codex OAuth yönlendirmesini denetleyin ve kurtarın

    Varsayılan ajanınızın hangi modeli, çalışma zamanını ve kimlik doğrulama
    rotasını kullandığını görmek için şu komutları kullanın:

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

    Daha eski bir yapılandırmada hâlâ legacy Codex GPT ref'leri veya açık çalışma
    zamanı yapılandırması olmadan bayat bir OpenAI çalışma zamanı oturum pini
    varsa bunu onarın:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    `models auth list --provider openai` kullanılabilir profil göstermiyorsa
    yeniden oturum açın:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    Aynı ajanda birden çok Codex OAuth oturumu açmak ve daha sonra bunları kimlik
    doğrulama sıralaması veya `/model ...@<profileId>` üzerinden denetlemek
    istediğinizde `--profile-id` kullanın:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*`, Codex üzerinden OpenAI ajan turları için model rotasıdır. Profil
    sıralamasına güvenmeden önce eski legacy OpenAI Codex önekli profil id'lerini
    ve sıra girdilerini taşımak için `openclaw doctor --fix` çalıştırın.

    ### Durum göstergesi

    Sohbet `/status`, geçerli oturum için hangi model çalışma zamanının etkin
    olduğunu gösterir. Paketli Codex app-server donanımı, OpenAI ajan model
    turları için `Runtime: OpenAI Codex` olarak görünür. Bayat OpenAI çalışma
    zamanı oturum pinleri, yapılandırma OpenClaw'ı açıkça pin'lemedikçe Codex'e
    onarılır.

    ### Doctor uyarısı

    Legacy Codex model ref'leri veya bayat OpenAI çalışma zamanı pinleri
    yapılandırmada ya da oturum durumunda kalırsa `openclaw doctor --fix`,
    OpenClaw açıkça yapılandırılmadığı sürece bunları Codex çalışma zamanı ile
    `openai/*` olarak yeniden yazar.

    ### Bağlam penceresi sınırı

    OpenClaw, model meta verilerini ve çalışma zamanı bağlam sınırını ayrı
    değerler olarak ele alır.

    Codex OAuth kataloğu üzerinden `openai/gpt-5.5` için:

    - Doğal `contextWindow`: `1000000`
    - Varsayılan çalışma zamanı `contextTokens` sınırı: `272000`

    Daha küçük varsayılan sınır, pratikte daha iyi gecikme ve kalite özellikleri sağlar. Bunu `contextTokens` ile geçersiz kılın:

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
    Doğal model meta verilerini bildirmek için `contextWindow` kullanın. Çalışma zamanı bağlam bütçesini sınırlamak için `contextTokens` kullanın.
    </Note>

    ### Katalog kurtarma

    OpenClaw, mevcut olduğunda `gpt-5.5` için upstream Codex katalog meta
    verilerini kullanır. Hesap doğrulanmışken canlı Codex keşfi `gpt-5.5`
    satırını atlıyorsa OpenClaw, cron, alt ajan ve yapılandırılmış varsayılan
    model çalıştırmaları `Unknown model` ile başarısız olmasın diye bu OAuth
    model satırını üretir.

  </Tab>
</Tabs>

## Doğal Codex app-server kimlik doğrulaması

Doğal Codex app-server donanımı, `openai/*` model ref'lerini ve atlanmış çalışma
zamanı yapılandırmasını veya provider/model `agentRuntime.id: "codex"` kullanır,
ancak kimlik doğrulaması hâlâ hesap tabanlıdır. OpenClaw kimlik doğrulamayı şu
sırayla seçer:

1. Ajan için sıralı OpenAI kimlik doğrulama profilleri, tercihen
   `auth.order.openai` altında. Eski legacy Codex kimlik doğrulama profil
   id'lerini ve legacy Codex kimlik doğrulama sırasını taşımak için
   `openclaw doctor --fix` çalıştırın.
2. App-server'ın mevcut hesabı, örneğin yerel Codex CLI ChatGPT oturumu.
3. Yalnızca yerel stdio app-server başlatmaları için, app-server hesap
   bildirmediğinde ve hâlâ OpenAI kimlik doğrulaması gerektirdiğinde
   `CODEX_API_KEY`, ardından `OPENAI_API_KEY`.

Bu, gateway işleminin doğrudan OpenAI modelleri veya embeddings için
`OPENAI_API_KEY` içermesi nedeniyle yerel ChatGPT/Codex abonelik oturumunun
değiştirilmediği anlamına gelir. Env API anahtarı yedeği yalnızca yerel stdio
hesapsız yoludur; WebSocket app-server bağlantılarına gönderilmez. Abonelik
tarzı bir Codex profili seçildiğinde OpenClaw ayrıca `CODEX_API_KEY` ve
`OPENAI_API_KEY` değerlerini başlatılan stdio app-server alt işleminden uzak
tutar ve seçili kimlik bilgilerini app-server login RPC üzerinden gönderir. Bu
abonelik profili Codex kullanım sınırı tarafından engellendiğinde OpenClaw,
seçili modeli değiştirmeden veya Codex donanımından çıkmadan sıradaki
`openai:*` API anahtarı profiline dönebilir. Abonelik sıfırlama zamanı geçtikten
sonra abonelik profili yeniden uygun olur.

## Görüntü üretimi

Paketli `openai` plugin'i, `image_generate` aracı üzerinden görüntü üretimini kaydeder.
Aynı `openai/gpt-image-2` model ref'i üzerinden hem OpenAI API anahtarı görüntü
üretimini hem de Codex OAuth görüntü üretimini destekler.

| Yetenek                  | OpenAI API anahtarı                 | Codex OAuth                          |
| ------------------------ | ----------------------------------- | ------------------------------------ |
| Model ref                | `openai/gpt-image-2`                | `openai/gpt-image-2`                 |
| Kimlik doğrulama         | `OPENAI_API_KEY`                    | OpenAI Codex OAuth oturum açma       |
| Aktarım                  | OpenAI Images API                   | Codex Responses arka ucu             |
| İstek başına en çok görsel | 4                                 | 4                                    |
| Düzenleme modu           | Etkin (en çok 5 referans görsel)    | Etkin (en çok 5 referans görsel)     |
| Boyut geçersiz kılmaları | 2K/4K boyutları dahil desteklenir   | 2K/4K boyutları dahil desteklenir    |
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

`gpt-image-2`, hem OpenAI metinden görsel oluşturmada hem de görsel
düzenlemede varsayılandır. `gpt-image-1.5`, `gpt-image-1` ve `gpt-image-1-mini`
açık model geçersiz kılmaları olarak kullanılabilir kalır. Saydam arka planlı
PNG/WebP çıktısı için `openai/gpt-image-1.5` kullanın; mevcut `gpt-image-2` API'si
`background: "transparent"` değerini reddeder.

Saydam arka plan isteği için aracıların `image_generate` aracını
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` veya `"webp"` ve
`background: "transparent"` ile çağırması gerekir; eski `openai.background`
sağlayıcı seçeneği hâlâ kabul edilir. OpenClaw ayrıca varsayılan
`openai/gpt-image-2` saydam isteklerini `gpt-image-1.5` olarak yeniden yazarak
genel OpenAI ve OpenAI Codex OAuth rotalarını korur; Azure ve özel
OpenAI uyumlu uç noktalar yapılandırılmış dağıtım/model adlarını korur.

Aynı ayar headless CLI çalıştırmaları için de sunulur:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Bir girdi dosyasından başlarken aynı `--output-format` ve `--background`
bayraklarını `openclaw infer image edit` ile kullanın.
`--openai-background`, OpenAI'ye özgü bir alias olarak kullanılabilir kalır.
OpenAI Images kalitesini ve maliyetini denetlemeniz gerektiğinde
`--quality low|medium|high|auto` kullanın. OpenAI'nin sağlayıcıya özgü moderasyon
ipucunu `image generate` veya `image edit` üzerinden geçirmek için
`--openai-moderation low|auto` kullanın.

ChatGPT/Codex OAuth kurulumları için aynı `openai/gpt-image-2` ref değerini
koruyun. Bir `openai` OAuth profili yapılandırıldığında OpenClaw, saklanan OAuth
erişim belirtecini çözer ve görsel isteklerini Codex Responses arka ucu üzerinden
gönderir. Bu istek için önce `OPENAI_API_KEY` denemez veya sessizce bir API
anahtarına geri dönülmez. Bunun yerine doğrudan OpenAI Images API rotasını
istediğinizde `models.providers.openai` değerini bir API anahtarı, özel temel URL
veya Azure uç noktasıyla açıkça yapılandırın.
Bu özel görsel uç noktası güvenilir bir LAN/özel adresteyse
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` değerini de ayarlayın;
OpenClaw, bu opt-in mevcut olmadığı sürece özel/dahili OpenAI uyumlu görsel uç
noktalarını engelli tutar.

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

Paketlenmiş `openai` Plugin'i, `video_generate` aracı üzerinden video oluşturmayı kaydeder.

| Yetenek            | Değer                                                                             |
| ------------------ | --------------------------------------------------------------------------------- |
| Varsayılan model   | `openai/sora-2`                                                                   |
| Modlar             | Metinden videoya, görselden videoya, tek video düzenleme                          |
| Referans girdileri | 1 görsel veya 1 video                                                             |
| Boyut geçersiz kılmaları | Metinden videoya ve görselden videoya için desteklenir                     |
| Diğer geçersiz kılmalar | `aspectRatio`, `resolution`, `audio`, `watermark` araç uyarısıyla yok sayılır |

OpenAI görselden videoya istekleri, görsel `input_reference` ile
`POST /v1/videos` kullanır. Tek video düzenlemeleri, yüklenen video `video`
alanında olacak şekilde `POST /v1/videos/edits` kullanır.

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

## GPT-5 istem katkısı

OpenClaw, OpenClaw tarafından birleştirilmiş istem yüzeylerindeki GPT-5 ailesi çalıştırmaları için paylaşılan bir GPT-5 istem katkısı ekler. Model kimliğine göre uygulanır; bu nedenle eski onarım öncesi ref değerleri (eski Codex GPT-5.5 ref), `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` ve diğer uyumlu GPT-5 ref değerleri gibi OpenClaw/sağlayıcı rotaları aynı overlay'i alır. Daha eski GPT-4.x modelleri almaz.

Paketlenmiş yerel Codex harness, bu OpenClaw GPT-5 overlay'ini Codex app-server geliştirici yönergeleri üzerinden almaz. Yerel Codex, Codex'e ait temel, model ve proje belgesi davranışını korurken OpenClaw, aracı çalışma alanı kişilik dosyalarının yetkili kalması için yerel thread'lerde Codex'in yerleşik kişiliğini devre dışı bırakır. OpenClaw yalnızca kanal teslimi, OpenClaw dinamik araçları, ACP delegasyonu, çalışma alanı bağlamı ve OpenClaw Skills gibi çalışma zamanı bağlamını katkı olarak ekler.

GPT-5 katkısı, eşleşen OpenClaw tarafından birleştirilmiş istemlerde persona kalıcılığı, yürütme güvenliği, araç disiplini, çıktı şekli, tamamlama kontrolleri ve doğrulama için etiketli bir davranış sözleşmesi ekler. Kanala özgü yanıt ve sessiz mesaj davranışı, paylaşılan OpenClaw sistem isteminde ve giden teslim politikası içinde kalır. Dostça etkileşim stili katmanı ayrıdır ve yapılandırılabilir.

| Değer                  | Etki                                      |
| ---------------------- | ----------------------------------------- |
| `"friendly"` (varsayılan) | Dostça etkileşim stili katmanını etkinleştir |
| `"on"`                 | `"friendly"` için alias                   |
| `"off"`                | Yalnızca dostça stil katmanını devre dışı bırak |

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
Paylaşılan `agents.defaults.promptOverlays.gpt5.personality` ayarı belirlenmediğinde eski `plugins.entries.openai.config.personality`, uyumluluk fallback'i olarak hâlâ okunur.
</Note>

## Ses ve konuşma

<AccordionGroup>
  <Accordion title="Konuşma sentezi (TTS)">
    Paketlenmiş `openai` Plugin'i, `messages.tts` yüzeyi için konuşma sentezini kaydeder.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Ses | `messages.tts.providers.openai.speakerVoice` | `coral` |
    | Hız | `messages.tts.providers.openai.speed` | (ayarlanmamış) |
    | Yönergeler | `messages.tts.providers.openai.instructions` | (ayarlanmamış, yalnızca `gpt-4o-mini-tts`) |
    | Biçim | `messages.tts.providers.openai.responseFormat` | sesli notlar için `opus`, dosyalar için `mp3` |
    | API anahtarı | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY` değerine geri döner |
    | Temel URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Ek gövde | `messages.tts.providers.openai.extraBody` / `extra_body` | (ayarlanmamış) |

    Kullanılabilir modeller: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Kullanılabilir sesler: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody`, OpenClaw'ın oluşturduğu alanlardan sonra `/audio/speech` istek JSON'una birleştirilir; bu nedenle `lang` gibi ek anahtarlar gerektiren OpenAI uyumlu uç noktalar için kullanın. Prototip anahtarları yok sayılır.

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
    Sohbet API uç noktasını etkilemeden TTS temel URL'sini geçersiz kılmak için `OPENAI_TTS_BASE_URL` ayarlayın. OpenAI TTS ve Realtime sesin ikisi de bir OpenAI Platform API anahtarı üzerinden yapılandırılır; yalnızca OAuth kurulumları Codex destekli sohbet modellerini hâlâ kullanabilir, ancak OpenAI canlı konuşma yanıtını kullanamaz.
    </Note>

  </Accordion>

  <Accordion title="Konuşmadan metne">
    Paketlenmiş `openai` Plugin'i, OpenClaw'ın medya anlama transkripsiyon yüzeyi üzerinden toplu konuşmadan metne dönüştürmeyi kaydeder.

    - Varsayılan model: `gpt-4o-transcribe`
    - Uç nokta: OpenAI REST `/v1/audio/transcriptions`
    - Girdi yolu: multipart ses dosyası yükleme
    - Gelen ses transkripsiyonunun `tools.media.audio` kullandığı her yerde OpenClaw tarafından desteklenir; Discord ses kanalı segmentleri ve kanal ses ekleri dahil

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

  <Accordion title="Realtime transkripsiyon">
    Paketlenmiş `openai` Plugin'i, Voice Call Plugin'i için Realtime transkripsiyonu kaydeder.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Dil | `...openai.language` | (ayarlanmamış) |
    | İstem | `...openai.prompt` | (ayarlanmamış) |
    | Sessizlik süresi | `...openai.silenceDurationMs` | `800` |
    | VAD eşiği | `...openai.vadThreshold` | `0.5` |
    | Kimlik doğrulama | `...openai.apiKey`, `OPENAI_API_KEY` veya `openai` OAuth | API anahtarları doğrudan bağlanır; OAuth, bir Realtime transkripsiyon istemci sırrı oluşturur |

    <Note>
    G.711 u-law (`g711_ulaw` / `audio/pcmu`) ses ile `wss://api.openai.com/v1/realtime` adresine WebSocket bağlantısı kullanır. Yalnızca `openai` OAuth yapılandırıldığında Gateway, WebSocket'i açmadan önce geçici bir Realtime transkripsiyon istemci sırrı oluşturur. Bu akış sağlayıcısı, Voice Call'ın Realtime transkripsiyon yolu içindir; Discord sesi şu anda kısa segmentler kaydeder ve bunun yerine toplu `tools.media.audio` transkripsiyon yolunu kullanır.
    </Note>

  </Accordion>

  <Accordion title="Realtime ses">
    Paketlenmiş `openai` Plugin'i, Voice Call Plugin'i için Realtime sesi kaydeder.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Ses | `...openai.voice` | `alloy` |
    | Sıcaklık (Azure dağıtım köprüsü) | `...openai.temperature` | `0.8` |
    | VAD eşiği | `...openai.vadThreshold` | `0.5` |
    | Sessizlik süresi | `...openai.silenceDurationMs` | `500` |
    | Önek dolgusu | `...openai.prefixPaddingMs` | `300` |
    | Akıl yürütme eforu | `...openai.reasoningEffort` | (ayarlanmamış) |
    | Kimlik doğrulama | `openai` API anahtarı kimlik doğrulama profili, `...openai.apiKey` veya `OPENAI_API_KEY` | OpenAI Platform API anahtarı gerekir; OpenAI OAuth, Realtime sesi yapılandırmaz |

    `gpt-realtime-2` için kullanılabilir yerleşik Realtime sesleri: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI, en iyi Realtime kalitesi için `marin` ve `cedar` önerir. Bu,
    yukarıdaki metinden sese seslerinden ayrı bir kümedir; `fable`, `nova` veya
    `onyx` gibi bir TTS sesinin Realtime oturumları için geçerli olduğunu varsaymayın.

    <Note>
    Arka uç OpenAI realtime köprüleri, `session.temperature` kabul etmeyen GA Realtime WebSocket oturum şeklini kullanır. Azure OpenAI dağıtımları `azureEndpoint` ve `azureDeployment` üzerinden kullanılabilir kalır ve dağıtımla uyumlu oturum şeklini korur. Çift yönlü araç çağırmayı ve G.711 u-law sesi destekler.
    </Note>

    <Note>
    Realtime sesi, oturum oluşturulduğunda seçilir. OpenAI çoğu oturum alanının
    daha sonra değiştirilmesine izin verir, ancak model o oturumda ses ürettikten
    sonra ses değiştirilemez. OpenClaw şu anda yerleşik Realtime ses kimliklerini
    dizeler olarak sunar.
    </Note>

    <Note>
    Control UI Talk, Gateway tarafından basılan geçici bir istemci sırrı ve
    OpenAI Realtime API'ye karşı doğrudan tarayıcı WebRTC SDP alışverişi ile
    OpenAI tarayıcı realtime oturumlarını kullanır. Gateway, bu istemci sırrını
    seçili `openai` API anahtarı kimlik doğrulama profili veya yapılandırılmış
    OpenAI Platform API anahtarı ile basar. Gateway aktarma ve Voice Call arka
    uç realtime WebSocket köprüleri, yerel OpenAI uç noktaları için aynı
    yalnızca API anahtarlı kimlik doğrulama yolunu kullanır. Bakımcı canlı
    doğrulaması
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
    ile kullanılabilir; OpenAI ayakları, sırları günlüğe yazmadan hem arka uç
    WebSocket köprüsünü hem de tarayıcı WebRTC SDP alışverişini doğrular.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI uç noktaları

Paketle gelen `openai` sağlayıcısı, temel URL'yi geçersiz kılarak görüntü
üretimi için bir Azure OpenAI kaynağını hedefleyebilir. Görüntü üretimi yolunda
OpenClaw, `models.providers.openai.baseUrl` üzerindeki Azure ana makine adlarını
algılar ve otomatik olarak Azure'un istek şekline geçer.

<Note>
Realtime sesi ayrı bir yapılandırma yolu kullanır
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
ve `models.providers.openai.baseUrl` değerinden etkilenmez. Azure ayarları için
[Ses ve konuşma](#voice-and-speech) altındaki **Realtime sesi** akordiyonuna
bakın.
</Note>

Azure OpenAI'yi şu durumlarda kullanın:

- Zaten bir Azure OpenAI aboneliğiniz, kotanız veya kurumsal anlaşmanız varsa
- Azure'un sağladığı bölgesel veri yerleşimi veya uyumluluk denetimlerine ihtiyacınız varsa
- Trafiği mevcut bir Azure kiracısı içinde tutmak istiyorsanız

### Yapılandırma

Paketle gelen `openai` sağlayıcısı üzerinden Azure görüntü üretimi için
`models.providers.openai.baseUrl` değerini Azure kaynağınıza yönlendirin ve
`apiKey` değerini Azure OpenAI anahtarına ayarlayın (OpenAI Platform anahtarı
değil):

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

OpenClaw, Azure görüntü üretimi rotası için şu Azure ana makine son eklerini
tanır:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Tanınan bir Azure ana makinesindeki görüntü üretimi isteklerinde OpenClaw:

- `Authorization: Bearer` yerine `api-key` üst bilgisini gönderir
- Dağıtım kapsamlı yolları kullanır (`/openai/deployments/{deployment}/...`)
- Her isteğe `?api-version=...` ekler
- Azure görüntü üretimi çağrıları için 600 sn varsayılan istek zaman aşımı kullanır.
  Çağrı başına `timeoutMs` değerleri yine de bu varsayılanı geçersiz kılar.

Diğer temel URL'ler (genel OpenAI, OpenAI uyumlu proxy'ler) standart OpenAI
görüntü isteği şeklini korur.

<Note>
`openai` sağlayıcısının görüntü üretimi yolu için Azure yönlendirmesi
OpenClaw 2026.4.22 veya sonrasını gerektirir. Daha eski sürümler herhangi bir
özel `openai.baseUrl` değerini genel OpenAI uç noktası gibi ele alır ve Azure
görüntü dağıtımlarında başarısız olur.
</Note>

### API sürümü

Azure görüntü üretimi yolu için belirli bir Azure preview veya GA sürümünü
sabitlemek üzere `AZURE_OPENAI_API_VERSION` değerini ayarlayın:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Değişken ayarlanmamışsa varsayılan `2024-12-01-preview` olur.

### Model adları dağıtım adlarıdır

Azure OpenAI modelleri dağıtımlara bağlar. Paketle gelen `openai` sağlayıcısı
üzerinden yönlendirilen Azure görüntü üretimi isteklerinde OpenClaw'daki `model`
alanı, genel OpenAI model kimliği değil, Azure portalında yapılandırdığınız
**Azure dağıtım adı** olmalıdır.

`gpt-image-2` sunan `gpt-image-2-prod` adlı bir dağıtım oluşturursanız:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Aynı dağıtım adı kuralı, paketle gelen `openai` sağlayıcısı üzerinden
yönlendirilen görüntü üretimi çağrıları için de geçerlidir.

### Bölgesel kullanılabilirlik

Azure görüntü üretimi şu anda yalnızca bir bölge alt kümesinde kullanılabilir
(örneğin `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Bir dağıtım oluşturmadan önce Microsoft'un güncel bölge listesini
kontrol edin ve belirli modelin bölgenizde sunulduğunu doğrulayın.

### Parametre farkları

Azure OpenAI ve genel OpenAI her zaman aynı görüntü parametrelerini kabul etmez.
Azure, genel OpenAI'nin izin verdiği seçenekleri reddedebilir (örneğin
`gpt-image-2` üzerindeki bazı `background` değerleri) veya bunları yalnızca
belirli model sürümlerinde sunabilir. Bu farklar OpenClaw'dan değil, Azure'dan
ve alttaki modelden kaynaklanır. Bir Azure isteği doğrulama hatasıyla
başarısız olursa, Azure portalında belirli dağıtımınız ve API sürümünüz
tarafından desteklenen parametre kümesini kontrol edin.

<Note>
Azure OpenAI yerel taşıma ve uyumluluk davranışı kullanır ancak OpenClaw'ın
gizli atıf üst bilgilerini almaz; [Gelişmiş yapılandırma](#advanced-configuration)
altındaki **Yerel ve OpenAI uyumlu rotalar** akordiyonuna bakın.

Azure üzerinde sohbet veya Responses trafiği için (görüntü üretiminin ötesinde),
başlangıç akışını veya ayrılmış bir Azure sağlayıcı yapılandırmasını kullanın;
tek başına `openai.baseUrl`, Azure API/kimlik doğrulama şeklini seçmez. Ayrı
bir `azure-openai-responses/*` sağlayıcısı vardır; aşağıdaki Sunucu tarafı
Compaction akordiyonuna bakın.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Taşıma (WebSocket ve SSE)">
    OpenClaw, `openai/*` için SSE yedeğiyle (`"auto"`) WebSocket öncelikli kullanır.

    `"auto"` modunda OpenClaw:
    - SSE'ye geri dönmeden önce bir erken WebSocket hatasını yeniden dener
    - Bir hatadan sonra WebSocket'i yaklaşık 60 saniye boyunca bozulmuş olarak işaretler ve soğuma sırasında SSE kullanır
    - Yeniden denemeler ve yeniden bağlanmalar için kararlı oturum ve tur kimliği üst bilgileri ekler
    - Kullanım sayaçlarını (`input_tokens` / `prompt_tokens`) taşıma varyantları arasında normalleştirir

    | Değer | Davranış |
    |-------|----------|
    | `"auto"` (varsayılan) | Önce WebSocket, SSE yedeği |
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
    - [Streaming API yanıtları (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Hızlı mod">
    OpenClaw, `openai/*` için paylaşılan bir hızlı mod anahtarı sunar:

    - **Sohbet/UI:** `/fast status|auto|on|off`
    - **Yapılandırma:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Etkinleştirildiğinde OpenClaw, hızlı modu OpenAI öncelikli işlemeye eşler (`service_tier = "priority"`). Mevcut `service_tier` değerleri korunur ve hızlı mod `reasoning` veya `text.verbosity` değerlerini yeniden yazmaz. `fastMode: "auto"` yeni model çağrılarını otomatik kesme noktasına kadar hızlı başlatır, ardından daha sonraki yeniden deneme, yedek, araç sonucu veya devam çağrılarını hızlı mod olmadan başlatır. Kesme noktası varsayılan olarak 60 saniyedir; değiştirmek için etkin modelde `params.fastAutoOnSeconds` değerini ayarlayın.

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
    Oturum geçersiz kılmaları yapılandırmaya üstün gelir. Sessions UI içinde oturum geçersiz kılmasını temizlemek, oturumu yapılandırılmış varsayılana döndürür.
    </Note>

  </Accordion>

  <Accordion title="Öncelikli işleme (service_tier)">
    OpenAI API'si, `service_tier` üzerinden öncelikli işlemeyi sunar. OpenClaw'da bunu model başına ayarlayın:

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
    `serviceTier` yalnızca yerel OpenAI uç noktalarına (`api.openai.com`) ve yerel Codex uç noktalarına (`chatgpt.com/backend-api`) iletilir. Her iki sağlayıcıyı da bir proxy üzerinden yönlendirirseniz OpenClaw, `service_tier` değerine dokunmaz.
    </Warning>

  </Accordion>

  <Accordion title="Sunucu tarafı Compaction (Responses API)">
    Doğrudan OpenAI Responses modelleri için (`api.openai.com` üzerinde `openai/*`), OpenAI Plugin'inin OpenClaw akış sarmalayıcısı sunucu tarafı Compaction'ı otomatik etkinleştirir:

    - `store: true` değerini zorlar (model uyumluluğu `supportsStore: false` ayarlamadıkça)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` enjekte eder
    - Varsayılan `compact_threshold`: `contextWindow` değerinin %70'i (veya kullanılamadığında `80000`)

    Bu, yerleşik OpenClaw çalışma zamanı yoluna ve gömülü çalıştırmalar tarafından kullanılan OpenAI sağlayıcı hook'larına uygulanır. Yerel Codex uygulama sunucusu harness'i kendi bağlamını Codex üzerinden yönetir ve OpenAI'nin varsayılan agent rotası veya sağlayıcı/model çalışma zamanı politikası tarafından yapılandırılır.

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
    `responsesServerCompaction` yalnızca `context_management` enjeksiyonunu kontrol eder. Doğrudan OpenAI Responses modelleri, uyumluluk `supportsStore: false` ayarlamadıkça yine de `store: true` değerini zorlar.
    </Note>

  </Accordion>

  <Accordion title="Katı ajan GPT modu">
    `openai/*` üzerindeki GPT-5 ailesi çalıştırmaları için OpenClaw daha katı bir gömülü yürütme sözleşmesi kullanabilir:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    `strict-agentic` ile OpenClaw:
    - Kapsamlı işler için `update_plan` özelliğini otomatik etkinleştirir
    - Yapısal olarak boş veya yalnızca akıl yürütme içeren turları görünür yanıt devamıyla yeniden dener
    - Seçilen harness bunları sağladığında açık harness plan olaylarını kullanır

    OpenClaw, bir turun plan, ilerleme güncellemesi veya nihai yanıt olup olmadığına karar vermek için asistan düzyazısını sınıflandırmaz.

    <Note>
    Yalnızca OpenAI ve Codex GPT-5 ailesi çalıştırmalarıyla sınırlıdır. Diğer sağlayıcılar ve eski model aileleri varsayılan davranışı korur.
    </Note>

  </Accordion>

  <Accordion title="Yerel ve OpenAI uyumlu yollar">
    OpenClaw, doğrudan OpenAI, Codex ve Azure OpenAI uç noktalarını genel OpenAI uyumlu `/v1` proxy’lerinden farklı ele alır:

    **Yerel yollar** (`openai/*`, Azure OpenAI):
    - OpenAI `none` effort değerini destekleyen modeller için yalnızca `reasoning: { effort: "none" }` değerini korur
    - `reasoning.effort: "none"` değerini reddeden modeller veya proxy’ler için devre dışı bırakılmış akıl yürütmeyi atlar
    - Araç şemalarını varsayılan olarak katı moda ayarlar
    - Gizli atıf başlıklarını yalnızca doğrulanmış yerel host’lara ekler
    - Yalnızca OpenAI’ye özgü istek şekillendirmesini korur (`service_tier`, `store`, reasoning-compat, prompt-cache ipuçları)

    **Proxy/uyumlu yollar:**
    - Daha gevşek uyumluluk davranışı kullanır
    - Yerel olmayan `openai-completions` payload’larından Completions `store` alanını çıkarır
    - OpenAI uyumlu Completions proxy’leri için gelişmiş `params.extra_body`/`params.extraBody` doğrudan geçiş JSON’unu kabul eder
    - vLLM gibi OpenAI uyumlu Completions proxy’leri için `params.chat_template_kwargs` değerini kabul eder
    - Katı araç şemalarını veya yalnızca yerel başlıkları zorunlu kılmaz

    Azure OpenAI yerel aktarımı ve uyumluluk davranışını kullanır ancak gizli atıf başlıklarını almaz.

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
    Kimlik doğrulama ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
</CardGroup>

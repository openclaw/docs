---
read_when:
    - Birden fazla model sağlayıcısı için yönetilen tek bir anahtar istiyorsunuz
    - OpenClaw'da ClawRouter model keşfine veya kota raporlamasına ihtiyacınız var
summary: Kimlik bilgisi kapsamındaki modelleri ClawRouter üzerinden yönlendirin ve yönetilen kotaları gösterin
title: ClawRouter
x-i18n:
    generated_at: "2026-07-16T17:36:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 684405818b701448b37431302b0c2cc66e106c2c6d482545569d9dfc7f7fe8e5
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter, OpenClaw'a birden fazla yukarı akış model
sağlayıcısı için politika kapsamlı tek bir anahtar sunar. Birlikte gelen `clawrouter` Plugin'i yalnızca
bu anahtar için izin verilen modelleri keşfeder, her modeli beyan edilen protokolü üzerinden yönlendirir ve
OpenClaw kullanım yüzeylerinde anahtarın bütçesini ve toplam kullanımını bildirir.

Yukarı akış kimlik bilgileri ve sağlayıcıya özgü iletme ClawRouter'da kalır; böylece
OpenClaw ana makinesinde her yukarı akış sağlayıcı Plugin'ini kurmanız veya kimlik doğrulaması yapmanız
gerekmez. Plugin, OpenClaw ile birlikte gelir (`enabledByDefault: true`);
yalnızca verilmiş bir ClawRouter kimlik bilgisine ihtiyacınız vardır.

| Özellik      | Değer                                    |
| ------------- | ---------------------------------------- |
| Sağlayıcı      | `clawrouter`                             |
| Plugin        | birlikte gelir (OpenClaw'a dahildir)           |
| Kimlik doğrulama          | `CLAWROUTER_API_KEY`                     |
| Varsayılan URL   | `https://clawrouter.openclaw.ai`         |
| Model kataloğu | `/v1/catalog` aracılığıyla kimlik bilgisi kapsamlı      |
| Kotalar        | `/v1/usage` aracılığıyla aylık bütçe ve kullanım |

## Başlarken

<Steps>
  <Step title="Kapsamlı bir kimlik bilgisi edinin">
    ClawRouter yöneticinizden, politikası kullanmanız gereken sağlayıcıları,
    modelleri ve aylık bütçeyi içeren bir kimlik bilgisi isteyin. Kimlik bilgileri
    verildiğinde yalnızca bir kez gösterilir.
  </Step>
  <Step title="OpenClaw'ı yapılandırın">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` birlikte gelir ve varsayılan olarak etkindir. Yapılandırmanız
    `plugins.allow` değerini ayarlıyorsa etkinleştirmeden önce bu listeye `clawrouter` ekleyin. Özel bir
    dağıtım için `models.providers.clawrouter.baseUrl` değerini
    ClawRouter kaynağına ayarlayın; varsayılan değer `https://clawrouter.openclaw.ai` şeklindedir.

  </Step>
  <Step title="İzin verilen modelleri listeleyin">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    Döndürülen model referanslarını tam olarak gösterildiği biçimde kullanın. Bunlar
    `clawrouter/openai/gpt-5.5`,
    `clawrouter/anthropic/claude-sonnet-4-6` veya
    `clawrouter/google/gemini-3.5-flash` gibi yukarı akış ad alanını korur. Yapılandırmanızda `agents.defaults.models`
    bir izin listesiyse seçilen her ClawRouter referansını buna ekleyin.

  </Step>
  <Step title="Bir model seçin">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    Döndürülen bir modeli tek bir çalıştırma için
    `openclaw agent --model clawrouter/<provider>/<model> --message "..."` ile de seçebilirsiniz.

  </Step>
</Steps>

## Yönetilen etkileşimsiz dağıtım

Proxy anahtarını iş yükünün gizli bilgi enjeksiyonunda tutun ve `openclaw.json` içinde yalnızca bir
SecretRef depolayın. Standart yönetilen alanlar şunlardır:

| Amaç       | Yapılandırma veya ortam alanı                                              |
| ------------- | ------------------------------------------------------------------------ |
| Yönlendirici kaynağı | `models.providers.clawrouter.baseUrl`                                    |
| Kimlik bilgisi    | `models.providers.clawrouter.apiKey` -> ortam SecretRef'i                    |
| Gizli bilgi değeri  | Gateway işlemi ortamında `CLAWROUTER_API_KEY`                  |
| Varsayılan model | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`       |
| İş yükü etiketi  | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id` (isteğe bağlı) |

Örneğin bir dağıtım denetleyicisi şu JSON5 yamasını yönetebilir:

```json5
{
  plugins: {
    entries: { clawrouter: { enabled: true } },
  },
  models: {
    providers: {
      clawrouter: {
        baseUrl: "https://clawrouter.internal.example",
        apiKey: {
          source: "env",
          provider: "default",
          id: "CLAWROUTER_API_KEY",
        },
        headers: {
          "X-ClawRouter-Project-Id": "fakeco",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "clawrouter/openai/gpt-5.5" },
    },
  },
}
```

Dağıtım `plugins.allow` değerini ayarlıyorsa mevcut girdilerini koruyup
`clawrouter` ekleyin. Etkileşimli bir sihirbaz olmadan doğrulayın ve uygulayın:

```bash
openclaw config patch --file ./clawrouter.patch.json5 --dry-run --json
openclaw config patch --file ./clawrouter.patch.json5
```

Deneme çalıştırması SecretRef'i çözümler ancak değerini asla yazdırmaz. Kimlik bilgisini
döndürmek için `CLAWROUTER_API_KEY` sağlayan harici Secret'ı güncelleyin ve
yeni işlem ortamının yüklenmesi için Gateway iş yükünü yeniden başlatın.
Yapılandırma dosyası ve model referansı değişmez.

Kaynaktan oluşturulmuş bağımsız bir Docker Gateway'i için ClawRouter zaten
kök çalışma zamanına dahildir. Yalnızca `OPENCLAW_EXTENSIONS=clickclack`, `slack` veya `msteams` gibi
ayrı paketleme gerektiren kanal Plugin'ini seçin; bkz.
[seçili Plugin'lerle kaynaktan oluşturulmuş görüntüler](/tr/install/docker#source-built-images-with-selected-plugins).
Arşiv/cihaz dağıtımları, OCI görüntüsünü kullanmak yerine aynı birleştirilmiş kaynağı
kendi yapıt işlem hatları üzerinden paketlemelidir.

## Hazırlık ve canlı kanıt

Bu denetimler farklı sınırları kanıtlar; birini diğerinin yerine kullanmayın:

```bash
# Yalnızca ClawRouter işlem sağlığı; hiçbir kimlik bilgisi veya yukarı akış modeli kullanılmaz.
curl -fsS https://clawrouter.internal.example/v1/health

# Yalnızca OpenClaw Gateway başlangıç hazırlığı; model çağrısı yapılmaz.
curl -fsS http://127.0.0.1:18789/readyz

# Kimlik bilgisi kapsamlı katalog keşfi.
openclaw models list --all --provider clawrouter --json

# Yapılandırılmış ClawRouter sağlayıcısı üzerinden asgari gerçek çıkarım yoklaması.
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# Tam bir izin verilmiş model referansı kullanan iş yükü kanaryası.
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "Tam olarak şu yanıtı verin: CLAWROUTER_CANARY_OK" \
  --json
```

Örnek modeli doğrudan kopyalamak yerine kapsamlı katalog tarafından döndürülen bir modeli
kullanın. Başarılı bir `/readyz` yanıtı, Gateway'in isteklere hizmet verebildiği
anlamına gelir; ClawRouter'ın, kimlik bilgisinin veya bir yukarı akış sağlayıcısının
hazır olduğunu göstermez. Model yoklaması ve aracı kanaryası çıkarım kanıtlarıdır.

Canlı tanılama için kanaryayı çalıştırın ve Gateway'in standart günlüklerini inceleyin.
Mevcut yalnızca meta veri içeren model aktarımı tanılamaları şu biçimde satırlar üretir:

```text
[model-fetch] başlangıç sağlayıcı=clawrouter api=openai-responses model=openai/gpt-5.5 yöntem=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] yanıt sağlayıcı=clawrouter api=openai-responses model=openai/gpt-5.5 durum=200
```

Plugin, bu tanımlayıcılar kullanılabilir olduğunda sınırlandırılmış `X-ClawRouter-Client`, `X-ClawRouter-Agent-Id` ve
`X-ClawRouter-Session-Id` üstbilgilerini gönderir. Ayrıca model çağrısının tanılama
`callId` değerini (`<run-id>:model:<n>`) `X-Request-ID` ile eşler; böylece bir OpenClaw model çağrısı olayı
ClawRouter'ın yalnızca meta veri içeren denetim iziyle ilişkilendirilebilir. 128 karakterlik istek kimliği bütçesi
içindeki değerler aynıdır. Daha uzun değerler `:model:<n>` son ekini ve belirlenimsel bir
karmayı korur; böylece farklı çağrılar sınırlandırılmış ve ilişkilendirilebilir kalır. `X-ClawRouter-Project-Id` gibi
statik dağıtım meta verileri, sağlayıcının `headers` eşlemesinde ayarlanabilir.
Aracı ve oturum ilişkilendirme üstbilgileri ayrı 256 karakterlik
sınırlarını korur. ClawRouter'ın ASCII tanımlayıcı kümesi dışındaki karakterleri içeren
otomatik istek kimlikleri aynı belirlenimsel sınırlandırılmış biçimi kullanır.
`X-Request-ID` değerinin herhangi bir büyük/küçük harf çeşidi dahil olmak üzere açıkça yapılandırılmış üstbilgiler
otomatik değerlere üstün gelir. Aktarım tanılaması, yönlendirme ve yanıt
meta verilerini kaydeder; kimlik bilgilerini, istek kimliklerini, istemleri veya tamamlamaları günlüğe kaydetmez.
ClawRouter'ın kendi denetim olayı seçilen yukarı akış sağlayıcısını ve
içerik saklama durumunu sağlar.

## Model keşfi

`GET /v1/catalog`, `{ providers: [...] }` döndürür; burada her sağlayıcı girdisi
kendi `models[]` listesini (yukarı akış kimliği, yetenekler ve fiyatlandırmayla birlikte) ve
desteklenen istek rotalarını listeler. OpenClaw, ClawRouter modellerinin ikinci, sabit bir
listesini sunmaz. Bir katalog modeli şu durumlarda OpenClaw modeli olarak yayımlanır:

- kimlik bilgisinin politikası sağlayıcısına izin veriyorsa;
- katalog modeli, desteklenen bir LLM yeteneği (`llm.responses`,
  `llm.chat`, `llm.messages` veya eşleşen bir akış
  rotasına sahip `llm.stream`) sunuyorsa; ve
- sağlayıcı, aşağıdaki aktarımlardan biri için eşleşen bir rota sunuyorsa.

Desteklenen bir ClawRouter sağlayıcısına model eklemek OpenClaw sürümü gerektirmez:
sonraki katalog yenilemesi (kimlik bilgisi kapsamı başına 60 saniye önbelleğe alınır)
modeli keşfeder. Yeni bir kablo protokolü gerektiren bir model için önce Plugin desteği gerekir.

## Protokol ve sağlayıcı Plugin'leri

ClawRouter yukarı akış kimlik bilgilerini yönetir; kataloğu OpenClaw'a hangi
aktarımı kullanacağını bildirir, bu nedenle her yukarı akış şirketinin kimlik doğrulama Plugin'ini kurmanız gerekmez.

| Katalog yeteneği / rotası                               | OpenClaw aktarımı     |
| -------------------------------------------------------- | ---------------------- |
| `llm.responses` (OpenAI uyumlu sağlayıcı)             | `openai-responses`     |
| `llm.chat` (OpenAI uyumlu sağlayıcı)                  | `openai-completions`   |
| `llm.messages` + `anthropic.messages` rotası              | `anthropic-messages`   |
| `llm.stream` + akışlı `google.generate_content` rotası | `google-generative-ai` |

Plugin ayrıca bu aileler için eşleşen yeniden oynatma ve araç şeması politikalarını
uygular (OpenAI/DeepSeek/Gemini/Perplexity araç şeması uyumluluğu; yerel
Anthropic ve Google Gemini yeniden oynatma politikaları). Perplexity modellerine katı bir
şema yeniden yazımı uygulanır: `patternProperties` ve `additionalProperties` kaldırılır ve
her nesne şeması `properties` değerini bildirir; çünkü Perplexity bunlar olmadan araç
şemalarını reddeder. Yalnızca desteklenmeyen bir istek biçimi sunan bir katalog sağlayıcısı,
kasıtlı olarak OpenClaw metin modeli şeklinde yayımlanmaz. Uyumsuz bir yük göndermek yerine
bu sağlayıcıları ClawRouter'da desteklenen sözleşmelerden birine normalleştirin.

## Kotalar ve kullanım

ClawRouter'ın `/v1/usage` yanıtı normal OpenClaw sağlayıcı kullanım
yüzeylerini besler: istek, token ve harcama toplamları ile anahtarın bir sınırı olduğunda
aylık bütçe aralığı. Ölçümlenmeyen anahtarlar da yüzdelik bir aralık olmadan toplam
kullanımı gösterir.

Kota araması model keşfiyle aynı kapsamlı anahtarı kullanır. Başarısız bir kota
araması model yürütmesini engellemez.

Canlı anlık görüntüyü şunlarla denetleyin:

```bash
openclaw status --usage
openclaw models status
```

Aynı sağlayıcı anlık görüntüsü sohbette `/status` ve OpenClaw'ın
kullanım kullanıcı arabirimi tarafından kullanılabilir. Bütçe politika genelindedir; dolayısıyla
aynı ClawRouter politikasını kullanan başka bir istemcinin istekleri kalan yüzdeyi değiştirebilir.

## Sorun giderme

| Belirti                                  | Denetim                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| ClawRouter modeli yok                     | Plugin'in etkin olduğunu ve `plugins.allow` tarafından izin verildiğini doğrulayın, ardından kimlik bilgisinin etkin olduğunu ve en az bir hazır sağlayıcıya izin verdiğini denetleyin. |
| Yapılandırılmış bir ClawRouter modeli eksik | `/v1/catalog` yeteneğini ve rota desteğini inceleyin. Desteklenmeyen aktarım sözleşmeleri kasıtlı olarak filtrelenir.                            |
| `Unknown model: clawrouter/...`          | Bu yapılandırma eşlemesi bir izin listesi olarak kullanılıyorsa tam katalog referansını `agents.defaults.models` içine ekleyin.                               |
| Katalogdan veya kullanımdan `401` ya da `403`     | ClawRouter kimlik bilgisini yeniden verin veya yeniden kapsamlandırın; OpenClaw yukarı akış sağlayıcı anahtarlarına geri dönmez.                                          |
| Keşiften sonra model çağrısı başarısız oluyor         | ClawRouter'daki sağlayıcı bağlantısını ve yukarı akış sağlığını denetleyin, ardından hazırlık durumu düzeldikten sonra yeniden deneyin.                                |
| Kullanımda toplamlar var ancak yüzde yok       | Politika ölçümlenmemektedir; yüzdelik bir aralık göstermek için ClawRouter'da aylık bütçe ekleyin.                                                     |

## Güvenlik davranışı

- Katalog keşfi, yapılandırılmış proxy anahtarıyla sınırlandırılır ve kimlik bilgisi kapsamına göre (aracı dizini, çalışma alanı dizini, kimlik doğrulama profili kimliği ve temel URL) önbelleğe alınır.
- Proxy anahtarı yalnızca istek gönderimi sırasında eklenir; model meta verilerinde depolanmaz.
- Otomatik ilişkilendirme ve istek korelasyonu değerleri, gönderimden önce kırpılır ve kontrol karakterleri içeriyorsa reddedilir. İlişkilendirme değerleri 256 karakterle, istek kimlikleri ise 128 karakterle sınırlandırılır.
- Model aktarım tanılamaları yalnızca meta verileri içerir ve proxy anahtarını veya model içeriğini hiçbir zaman içermez.
- Yerel Anthropic ve Gemini model kimlikleri, yalnızca gönderim sırasında üst sistemdeki kimlikleriyle yeniden yazılır.
- Desteklenmeyen veya izin verilmemiş katalog satırları güvenli biçimde başarısız olur ve seçilemez.

## İlgili

<CardGroup cols={2}>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcı yapılandırması ve model seçimi.
  </Card>
  <Card title="Kullanım takibi" href="/tr/concepts/usage-tracking" icon="chart-line">
    OpenClaw kullanım ve durum yüzeyleri.
  </Card>
</CardGroup>

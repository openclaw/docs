---
read_when:
    - Birden fazla model sağlayıcısı için tek bir yönetilen anahtar istiyorsunuz
    - OpenClaw'da ClawRouter model keşfine veya kota raporlamasına ihtiyacınız var
summary: Kimlik bilgisi kapsamındaki modelleri ClawRouter üzerinden yönlendirin ve yönetilen kotaları gösterin
title: ClawRouter
x-i18n:
    generated_at: "2026-07-12T12:39:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9a83253b5de3022bb3d3113427e5183f4ac537161ed75723fec0dafc33ebb00
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter, OpenClaw'a birden fazla üst kaynak model sağlayıcısı için politika kapsamlı tek bir anahtar sağlar. Birlikte gelen `clawrouter` Plugin'i yalnızca bu anahtar için izin verilen modelleri keşfeder, her modeli bildirdiği protokol üzerinden yönlendirir ve anahtarın bütçesiyle toplam kullanımını OpenClaw kullanım yüzeylerinde raporlar.

Üst kaynak kimlik bilgileri ve sağlayıcıya özgü iletme işlemleri ClawRouter'da kalır; dolayısıyla OpenClaw ana makinesine her üst kaynak sağlayıcı Plugin'ini kurmanız veya her biri için kimlik doğrulaması yapmanız gerekmez. Plugin, OpenClaw ile birlikte gelir (`enabledByDefault: true`); yalnızca verilmiş bir ClawRouter kimlik bilgisine ihtiyacınız vardır.

| Özellik       | Değer                                    |
| ------------- | ---------------------------------------- |
| Sağlayıcı     | `clawrouter`                             |
| Plugin        | birlikte gelir (OpenClaw'a dahildir)     |
| Kimlik doğrulama | `CLAWROUTER_API_KEY`                  |
| Varsayılan URL | `https://clawrouter.openclaw.ai`        |
| Model kataloğu | `/v1/catalog` üzerinden kimlik bilgisi kapsamlı |
| Kotalar       | `/v1/usage` üzerinden aylık bütçe ve kullanım |

## Başlarken

<Steps>
  <Step title="Kapsamlı bir kimlik bilgisi edinin">
    ClawRouter yöneticinizden, kullanmanız gereken sağlayıcıları, modelleri ve aylık bütçeyi içeren bir politikaya sahip kimlik bilgisi isteyin. Kimlik bilgileri verildiğinde yalnızca bir kez gösterilir.
  </Step>
  <Step title="OpenClaw'ı yapılandırın">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` birlikte gelir ve varsayılan olarak etkindir. Yapılandırmanız `plugins.allow` değerini ayarlıyorsa etkinleştirmeden önce bu listeye `clawrouter` ekleyin. Özel bir dağıtım için `models.providers.clawrouter.baseUrl` değerini ClawRouter kaynağına ayarlayın; varsayılan değer `https://clawrouter.openclaw.ai` adresidir.

  </Step>
  <Step title="İzin verilen modelleri listeleyin">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    Döndürülen model referanslarını tam olarak gösterildikleri biçimde kullanın. Bunlar `clawrouter/openai/gpt-5.5`, `clawrouter/anthropic/claude-sonnet-4-6` veya `clawrouter/google/gemini-3.5-flash` gibi üst kaynak ad alanını korur. Yapılandırmanızda `agents.defaults.models` bir izin listesiyse seçilen her ClawRouter referansını bu listeye ekleyin.

  </Step>
  <Step title="Bir model seçin">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    Döndürülen bir modeli tek bir çalıştırma için `openclaw agent --model clawrouter/<provider>/<model> --message "..."` komutuyla da seçebilirsiniz.

  </Step>
</Steps>

## Yönetilen etkileşimsiz dağıtım

Proxy anahtarını iş yükünün gizli değer ekleme mekanizmasında tutun ve `openclaw.json` içinde yalnızca bir SecretRef depolayın. Standart yönetilen alanlar şunlardır:

| Amaç          | Yapılandırma veya ortam alanı                                             |
| ------------- | ------------------------------------------------------------------------ |
| Yönlendirici kaynağı | `models.providers.clawrouter.baseUrl`                              |
| Kimlik bilgisi | `models.providers.clawrouter.apiKey` -> ortam SecretRef'i                |
| Gizli değer   | Gateway işleminin ortamında `CLAWROUTER_API_KEY`                         |
| Varsayılan model | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`     |
| İş yükü etiketi | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id` (isteğe bağlı) |

Örneğin bir dağıtım denetleyicisi şu JSON5 yamasının sahibi olabilir:

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

Dağıtım `plugins.allow` değerini ayarlıyorsa mevcut girdileri koruyun ve `clawrouter` ekleyin. Etkileşimli bir sihirbaz kullanmadan doğrulayıp uygulayın:

```bash
openclaw config patch --file ./clawrouter.patch.json5 --dry-run --json
openclaw config patch --file ./clawrouter.patch.json5
```

Deneme çalıştırması SecretRef'i çözümler ancak değerini hiçbir zaman yazdırmaz. Kimlik bilgisini döndürmek için `CLAWROUTER_API_KEY` sağlayan harici gizli değeri güncelleyin ve yeni işlem ortamının yüklenmesi için Gateway iş yükünü yeniden başlatın. Yapılandırma dosyası ve model referansı değişmez.

Kaynak koddan oluşturulmuş bağımsız bir Docker Gateway'i için ClawRouter zaten kök çalışma zamanına dahildir. Yalnızca `OPENCLAW_EXTENSIONS=clickclack`, `slack` veya `msteams` gibi ayrı paketleme gerektiren kanal Plugin'ini seçin; bkz. [seçili Plugin'lerle kaynak koddan oluşturulan imajlar](/tr/install/docker#source-built-images-with-selected-plugins). Arşiv/cihaz dağıtımları, OCI imajını kullanmak yerine birleştirilmiş aynı kaynak kodunu kendi yapıt işlem hatları üzerinden paketlemelidir.

## Hazır olma durumu ve canlı kanıt

Bu denetimler farklı sınırları kanıtlar; birini diğerinin yerine kullanmayın:

```bash
# Yalnızca ClawRouter işlem sağlığı; hiçbir kimlik bilgisi veya üst kaynak model kullanılmaz.
curl -fsS https://clawrouter.internal.example/v1/health

# Yalnızca OpenClaw Gateway başlatma hazır olma durumu; model çağrısı yapılmaz.
curl -fsS http://127.0.0.1:18789/readyz

# Kimlik bilgisi kapsamlı katalog keşfi.
openclaw models list --all --provider clawrouter --json

# Yapılandırılmış ClawRouter sağlayıcısı üzerinden asgari gerçek çıkarım sondası.
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# Tam bir izin verilmiş model referansı kullanan iş yükü kanaryası.
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "Reply exactly: CLAWROUTER_CANARY_OK" \
  --json
```

Örnek modeli düşünmeden kopyalamak yerine kapsamlı katalog tarafından döndürülen bir modeli kullanın. Başarılı bir `/readyz` yanıtı, Gateway'in isteklere hizmet verebildiği anlamına gelir; ClawRouter'ın, kimlik bilgisinin veya bir üst kaynak sağlayıcının hazır olduğunu göstermez. Model sondası ve aracı kanaryası, çıkarım kanıtlarıdır.

Canlı tanılama için kanaryayı çalıştırın ve Gateway'in standart günlüklerini inceleyin. Yalnızca meta veri içeren mevcut model taşıma tanılamaları şu biçimde satırlar üretir:

```text
[model-fetch] start provider=clawrouter api=openai-responses model=openai/gpt-5.5 method=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] response provider=clawrouter api=openai-responses model=openai/gpt-5.5 status=200
```

Plugin, bu tanımlayıcılar kullanılabilir olduğunda sınırlandırılmış `X-ClawRouter-Client`, `X-ClawRouter-Agent-Id` ve `X-ClawRouter-Session-Id` üst bilgilerini gönderir. Ayrıca model çağrısının tanılama `callId` değerini (`<run-id>:model:<n>`) `X-Request-ID` ile eşleyerek bir OpenClaw model çağrısı olayının ClawRouter'ın yalnızca meta veri içeren denetim iziyle ilişkilendirilebilmesini sağlar. 128 karakterlik istek kimliği bütçesi içindeki değerler aynıdır. Daha uzun değerler, farklı çağrıların sınırlar içinde ve ilişkilendirilebilir kalması için `:model:<n>` son ekini ve belirlenimci bir özeti korur. `X-ClawRouter-Project-Id` gibi statik dağıtım meta verileri sağlayıcının `headers` eşlemesinde ayarlanabilir. Aracı ve oturum ilişkilendirme üst bilgileri ayrı 256 karakterlik sınırlarını korur. ClawRouter'ın ASCII tanımlayıcı kümesinin dışındaki karakterleri içeren otomatik istek kimlikleri de aynı belirlenimci ve sınırlandırılmış biçimi kullanır.
`X-Request-ID` değerinin büyük/küçük harf farklı herhangi bir biçimi de dahil olmak üzere açıkça yapılandırılmış üst bilgiler, otomatik değerlerden önceliklidir. Taşıma tanılaması yönlendirme ve yanıt meta verilerini kaydeder; kimlik bilgilerini, istek kimliklerini, istemleri veya tamamlamaları günlüğe kaydetmez. ClawRouter'ın kendi denetim olayı, seçilen üst kaynak sağlayıcıyı ve içerik saklama durumunu sağlar.

## Model keşfi

`GET /v1/catalog`, her sağlayıcı girdisinin kendi `models[]` listesini (üst kaynak kimliği, yetenekler ve fiyatlandırmayla birlikte) ve desteklenen istek rotalarını içerdiği `{ providers: [...] }` değerini döndürür. OpenClaw, ClawRouter modellerinin ikinci ve sabit bir listesini sunmaz. Bir katalog modeli şu durumlarda OpenClaw modeli olarak duyurulur:

- kimlik bilgisinin politikası ilgili sağlayıcıya izin veriyorsa;
- katalog modeli desteklenen bir LLM yeteneğini (`llm.responses`, `llm.chat`, `llm.messages` veya eşleşen bir akış rotasıyla `llm.stream`) duyuruyorsa ve
- sağlayıcı aşağıdaki taşımalardan biri için eşleşen bir rota sunuyorsa.

Desteklenen bir ClawRouter sağlayıcısına model eklemek için OpenClaw sürümü gerekmez: kimlik bilgisi kapsamı başına 60 saniye önbelleğe alınan bir sonraki katalog yenilemesi modeli keşfeder. Yeni bir kablo protokolü gerektiren model için önce Plugin desteği gerekir.

## Protokol ve sağlayıcı Plugin'leri

ClawRouter üst kaynak kimlik bilgilerinin sahibidir; kataloğu OpenClaw'a hangi taşımanın kullanılacağını bildirir, dolayısıyla her üst kaynak şirketinin kimlik doğrulama Plugin'ini kurmanız gerekmez.

| Katalog yeteneği / rotası                                | OpenClaw taşıması       |
| -------------------------------------------------------- | ---------------------- |
| `llm.responses` (OpenAI uyumlu sağlayıcı)                | `openai-responses`     |
| `llm.chat` (OpenAI uyumlu sağlayıcı)                     | `openai-completions`   |
| `llm.messages` + `anthropic.messages` rotası             | `anthropic-messages`   |
| `llm.stream` + akışlı `google.generate_content` rotası   | `google-generative-ai` |

Plugin ayrıca bu ailelere uygun yeniden oynatma ve araç şeması politikalarını uygular (OpenAI/DeepSeek/Gemini araç şeması uyumluluğu; yerel Anthropic ve Google Gemini yeniden oynatma politikaları). Yalnızca desteklenmeyen bir istek biçimi sunan katalog sağlayıcısı, kasıtlı olarak OpenClaw metin modeli şeklinde duyurulmaz. Uyumsuz bir yük göndermek yerine bu sağlayıcıları ClawRouter içinde desteklenen sözleşmelerden birine normalleştirin.

## Kotalar ve kullanım

ClawRouter'ın `/v1/usage` yanıtı normal OpenClaw sağlayıcı kullanım yüzeylerini besler: istek, token ve harcama toplamlarının yanı sıra anahtarın bir sınırı olduğunda aylık bütçe dönemi. Ölçülmeyen anahtarlar da yüzde dönemi olmadan toplam kullanımı gösterir.

Kota araması, model keşfiyle aynı kapsamlı anahtarı kullanır. Başarısız bir kota araması model yürütmesini engellemez.

Canlı anlık görüntüyü şu komutlarla denetleyin:

```bash
openclaw status --usage
openclaw models status
```

Aynı sağlayıcı anlık görüntüsü, sohbette `/status` ve OpenClaw'ın kullanım kullanıcı arayüzünde kullanılabilir. Bütçe politika genelindedir; bu nedenle aynı ClawRouter politikasını kullanan başka bir istemcinin istekleri kalan yüzdeyi değiştirebilir.

## Sorun giderme

| Belirti                                  | Denetim                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| ClawRouter modeli yok                    | Plugin'in etkin olduğunu ve `plugins.allow` tarafından izin verildiğini doğrulayın, ardından kimlik bilgisinin etkin olduğunu ve en az bir hazır sağlayıcıya izin verdiğini denetleyin. |
| Yapılandırılmış bir ClawRouter modeli eksik | `/v1/catalog` yeteneğini ve rota desteğini inceleyin. Desteklenmeyen taşıma sözleşmeleri kasıtlı olarak filtrelenir.                            |
| `Unknown model: clawrouter/...`          | Bu yapılandırma eşlemesi izin listesi olarak kullanılıyorsa tam katalog referansını `agents.defaults.models` listesine ekleyin.                               |
| Katalogdan veya kullanımdan `401` ya da `403` | ClawRouter kimlik bilgisini yeniden verin veya kapsamını değiştirin; OpenClaw üst kaynak sağlayıcı anahtarlarına geri dönmez.                                          |
| Model çağrısı keşiften sonra başarısız oluyor | ClawRouter'daki sağlayıcı bağlantısını ve üst kaynak sağlığını denetleyin, ardından hazır olma durumu düzeldikten sonra yeniden deneyin.                                |
| Kullanımda toplamlar var ancak yüzde yok | Politika ölçülmüyordur; yüzde dönemi göstermek için ClawRouter'da aylık bütçe ekleyin.                                                     |

## Güvenlik davranışı

- Katalog keşfi, yapılandırılmış proxy anahtarıyla sınırlandırılır ve kimlik bilgisi kapsamına göre önbelleğe alınır (ajan dizini, çalışma alanı dizini, kimlik doğrulama profili kimliği ve temel URL).
- Proxy anahtarı yalnızca istek gönderimi sırasında eklenir; model meta verilerinde depolanmaz.
- Otomatik ilişkilendirme ve istek korelasyonu değerleri gönderimden önce kırpılır ve kontrol karakterleri içeriyorsa reddedilir. İlişkilendirme değerleri 256 karakterle, istek kimlikleri ise 128 karakterle sınırlandırılır.
- Model aktarımı tanılama verileri yalnızca meta veri içerir ve proxy anahtarını ya da model içeriğini hiçbir zaman içermez.
- Yerel Anthropic ve Gemini model kimlikleri, yalnızca gönderim sırasında üst kaynak kimliklerine dönüştürülür.
- Desteklenmeyen veya izin verilmemiş katalog satırları güvenli biçimde reddedilir ve seçilemez.

## İlgili

<CardGroup cols={2}>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcı yapılandırması ve model seçimi.
  </Card>
  <Card title="Kullanım takibi" href="/tr/concepts/usage-tracking" icon="chart-line">
    OpenClaw kullanım ve durum yüzeyleri.
  </Card>
</CardGroup>

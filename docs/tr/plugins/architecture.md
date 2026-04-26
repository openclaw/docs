---
read_when:
    - Yerel OpenClaw Plugin'leri oluşturma veya hata ayıklama
    - Plugin yetenek modelini veya sahiplik sınırlarını anlama
    - Plugin yükleme hattı veya kayıt defteri üzerinde çalışma
    - Sağlayıcı çalışma zamanı hook'ları veya kanal Plugin'leri uygulama
sidebarTitle: Internals
summary: 'Plugin iç yapısı: yetenek modeli, sahiplik, sözleşmeler, yükleme hattı ve çalışma zamanı yardımcıları'
title: Plugin iç yapısı
x-i18n:
    generated_at: "2026-04-26T11:35:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16664d284a8bfbfcb9914bb012d1f36dfdd60406636d6bf4b011f76e886cb518
    source_path: plugins/architecture.md
    workflow: 15
---

Bu, OpenClaw Plugin sistemi için **derin mimari referansıdır**. Uygulamalı kılavuzlar için aşağıdaki odaklı sayfalardan biriyle başlayın.

<CardGroup cols={2}>
  <Card title="Plugin'leri kurun ve kullanın" icon="plug" href="/tr/tools/plugin">
    Plugin ekleme, etkinleştirme ve sorun giderme için son kullanıcı kılavuzu.
  </Card>
  <Card title="Plugin oluşturma" icon="rocket" href="/tr/plugins/building-plugins">
    En küçük çalışan manifest ile ilk Plugin öğreticisi.
  </Card>
  <Card title="Kanal Plugin'leri" icon="comments" href="/tr/plugins/sdk-channel-plugins">
    Bir mesajlaşma kanalı Plugin'i oluşturun.
  </Card>
  <Card title="Sağlayıcı Plugin'leri" icon="microchip" href="/tr/plugins/sdk-provider-plugins">
    Bir model sağlayıcı Plugin'i oluşturun.
  </Card>
  <Card title="SDK genel bakışı" icon="book" href="/tr/plugins/sdk-overview">
    İçe aktarma eşlemi ve kayıt API referansı.
  </Card>
</CardGroup>

## Genel yetenek modeli

Yetenekler, OpenClaw içindeki genel **yerel Plugin** modelidir. Her yerel OpenClaw Plugin'i bir veya daha fazla yetenek türüne karşı kayıt olur:

| Yetenek               | Kayıt yöntemi                                   | Örnek Plugin'ler                    |
| --------------------- | ----------------------------------------------- | ----------------------------------- |
| Metin çıkarımı        | `api.registerProvider(...)`                     | `openai`, `anthropic`               |
| CLI çıkarım backend'i | `api.registerCliBackend(...)`                   | `openai`, `anthropic`               |
| Konuşma               | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`           |
| Gerçek zamanlı transkripsiyon | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                    |
| Gerçek zamanlı ses    | `api.registerRealtimeVoiceProvider(...)`        | `openai`                            |
| Medya anlama          | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                  |
| Görsel oluşturma      | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Müzik oluşturma       | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                 |
| Video oluşturma       | `api.registerVideoGenerationProvider(...)`      | `qwen`                              |
| Web getirme           | `api.registerWebFetchProvider(...)`             | `firecrawl`                         |
| Web arama             | `api.registerWebSearchProvider(...)`            | `google`                            |
| Kanal / mesajlaşma    | `api.registerChannel(...)`                      | `msteams`, `matrix`                 |
| Gateway keşfi         | `api.registerGatewayDiscoveryService(...)`      | `bonjour`                           |

<Note>
Hiç yetenek kaydetmeyen ancak hook'lar, tools, keşif hizmetleri veya arka plan hizmetleri sağlayan bir Plugin, **eski hook-only** Plugin'dir. Bu kalıp hâlâ tam olarak desteklenir.
</Note>

### Dış uyumluluk duruşu

Yetenek modeli core içinde yerleşmiştir ve bugün paketlenmiş/yerel Plugin'ler tarafından kullanılmaktadır, ancak dış Plugin uyumluluğu hâlâ "dışa aktarılmışsa donmuştur" yaklaşımından daha sıkı bir çıta gerektirir.

| Plugin durumu                                    | Rehberlik                                                                                       |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Mevcut dış Plugin'ler                            | Hook tabanlı entegrasyonları çalışır tutun; bu uyumluluk temel çizgisidir.                     |
| Yeni paketlenmiş/yerel Plugin'ler                | Sağlayıcıya özgü iç erişimler veya yeni hook-only tasarımlar yerine açık yetenek kaydını tercih edin. |
| Yetenek kaydını benimseyen dış Plugin'ler        | İzin verilir, ancak dokümanlar bunları kararlı olarak işaretlemedikçe yeteneğe özgü yardımcı yüzeyleri gelişen yüzeyler olarak değerlendirin. |

Yetenek kaydı amaçlanan yöndür. Eski hook'lar, geçiş sırasında dış Plugin'ler için en güvenli kırılmasız yol olmaya devam eder. Dışa aktarılan yardımcı alt yolların hepsi eşit değildir — tesadüfi yardımcı dışa aktarımlar yerine dar kapsamlı, belgelenmiş sözleşmeleri tercih edin.

### Plugin biçimleri

OpenClaw, yüklenen her Plugin'i statik metadata'ya değil, gerçek kayıt davranışına göre bir biçime sınıflandırır:

<AccordionGroup>
  <Accordion title="plain-capability">
    Tam olarak bir yetenek türü kaydeder (örneğin `mistral` gibi yalnızca sağlayıcı olan bir Plugin).
  </Accordion>
  <Accordion title="hybrid-capability">
    Birden çok yetenek türü kaydeder (örneğin `openai`, metin çıkarımı, konuşma, medya anlama ve görsel oluşturmanın sahibidir).
  </Accordion>
  <Accordion title="hook-only">
    Yalnızca hook'lar kaydeder (türlenmiş veya özel), yetenek, tool, komut veya hizmet kaydetmez.
  </Accordion>
  <Accordion title="non-capability">
    Tool, komut, hizmet veya route kaydeder ancak yetenek kaydetmez.
  </Accordion>
</AccordionGroup>

Bir Plugin'in biçimini ve yetenek dağılımını görmek için `openclaw plugins inspect <id>` kullanın. Ayrıntılar için bkz. [CLI referansı](/tr/cli/plugins#inspect).

### Eski hook'lar

`before_agent_start` hook'u, hook-only Plugin'ler için bir uyumluluk yolu olarak desteklenmeye devam eder. Eski gerçek dünya Plugin'leri hâlâ buna bağlıdır.

Yön:

- çalışır durumda tutun
- bunu eski olarak belgelendirin
- model/sağlayıcı geçersiz kılma işleri için `before_model_resolve` tercih edin
- istem mutasyonu işleri için `before_prompt_build` tercih edin
- yalnızca gerçek kullanım düştükten ve fixture kapsamı geçiş güvenliğini kanıtladıktan sonra kaldırın

### Uyumluluk sinyalleri

`openclaw doctor` veya `openclaw plugins inspect <id>` çalıştırdığınızda şu etiketlerden birini görebilirsiniz:

| Sinyal                     | Anlamı                                                      |
| -------------------------- | ----------------------------------------------------------- |
| **config valid**           | Config düzgün ayrıştırılıyor ve Plugin'ler çözümleniyor     |
| **compatibility advisory** | Plugin desteklenen ama daha eski bir kalıp kullanıyor (örn. `hook-only`) |
| **legacy warning**         | Plugin, kullanımdan kaldırılmış olan `before_agent_start` kullanıyor |
| **hard error**             | Config geçersiz veya Plugin yüklenemedi                     |

Ne `hook-only` ne de `before_agent_start` bugün Plugin'inizi bozmaz: `hook-only` bir tavsiyedir ve `before_agent_start` yalnızca bir uyarı tetikler. Bu sinyaller ayrıca `openclaw status --all` ve `openclaw plugins doctor` içinde de görünür.

## Mimariye genel bakış

OpenClaw'ın Plugin sistemi dört katmandan oluşur:

<Steps>
  <Step title="Manifest + keşif">
    OpenClaw, yapılandırılmış yollardan, workspace köklerinden, genel Plugin köklerinden ve paketlenmiş Plugin'lerden aday Plugin'leri bulur. Keşif, önce yerel `openclaw.plugin.json` manifest'lerini ve desteklenen bundle manifest'lerini okur.
  </Step>
  <Step title="Etkinleştirme + doğrulama">
    Core, keşfedilmiş bir Plugin'in etkin mi, devre dışı mı, engellenmiş mi yoksa bellek gibi özel bir slot için seçilmiş mi olduğuna karar verir.
  </Step>
  <Step title="Çalışma zamanı yükleme">
    Yerel OpenClaw Plugin'leri jiti aracılığıyla süreç içinde yüklenir ve yetenekleri merkezi bir kayıt defterine kaydeder. Uyumlu bundle'lar, çalışma zamanı kodu içe aktarılmadan kayıt defteri kayıtlarına normalize edilir.
  </Step>
  <Step title="Yüzey tüketimi">
    OpenClaw'ın geri kalanı; tools, kanallar, sağlayıcı kurulumu, hook'lar, HTTP route'ları, CLI komutları ve hizmetleri açığa çıkarmak için kayıt defterini okur.
  </Step>
</Steps>

Özellikle Plugin CLI için kök komut keşfi iki aşamada bölünür:

- ayrıştırma zamanı metadata'sı `registerCli(..., { descriptors: [...] })` içinden gelir
- gerçek Plugin CLI modülü tembel kalabilir ve ilk çağrıda kaydolabilir

Bu, kök komut adlarının ayrıştırmadan önce OpenClaw tarafından ayrılmasını sağlarken Plugin sahipli CLI kodunu Plugin'in içinde tutar.

Önemli tasarım sınırı:

- manifest/config doğrulaması, Plugin kodu yürütülmeden **manifest/schema metadata'sından** çalışabilmelidir
- yerel yetenek keşfi, etkinleştirmeyen bir kayıt defteri anlık görüntüsü oluşturmak için güvenilen Plugin giriş kodunu yükleyebilir
- yerel çalışma zamanı davranışı, `api.registrationMode === "full"` ile Plugin modülünün `register(api)` yolundan gelir

Bu ayrım, OpenClaw'ın tam çalışma zamanı etkin olmadan önce config'i doğrulamasına, eksik/devre dışı Plugin'leri açıklamasına ve UI/schema ipuçları oluşturmasına izin verir.

### Etkinleştirme planlaması

Etkinleştirme planlaması denetim düzleminin bir parçasıdır. Çağıranlar, daha geniş çalışma zamanı kayıt defterlerini yüklemeden önce belirli bir komut, sağlayıcı, kanal, route, agent harness veya yetenek için hangi Plugin'lerin ilgili olduğunu sorabilir.

Planlayıcı, mevcut manifest davranışını uyumlu tutar:

- `activation.*` alanları açık planlayıcı ipuçlarıdır
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` ve hook'lar manifest sahipliği fallback'i olmaya devam eder
- yalnızca kimlik döndüren planlayıcı API'si mevcut çağıranlar için erişilebilir olmaya devam eder
- plan API'si neden etiketlerini bildirir; böylece tanılamalar açık ipuçlarını sahiplik fallback'inden ayırabilir

<Warning>
`activation` alanını bir yaşam döngüsü hook'u veya `register(...)` yerine geçen bir yapı olarak değerlendirmeyin. Bu, yüklemeyi daraltmak için kullanılan metadata'dır. İlişkiyi zaten sahiplik alanları tanımlıyorsa onları tercih edin; `activation` değerini yalnızca ek planlayıcı ipuçları için kullanın.
</Warning>

### Kanal Plugin'leri ve paylaşılan message tool'u

Kanal Plugin'lerinin normal sohbet eylemleri için ayrı bir gönder/düzenle/tepki tool'u kaydetmesi gerekmez. OpenClaw tek bir paylaşılan `message` tool'unu core içinde tutar ve kanal Plugin'leri bunun arkasındaki kanala özgü keşif ve yürütmenin sahibidir.

Geçerli sınır şudur:

- core, paylaşılan `message` tool host'unun, istem bağlantısının, oturum/thread muhasebesinin ve yürütme dağıtımının sahibidir
- kanal Plugin'leri kapsamlı eylem keşfinin, yetenek keşfinin ve kanala özgü tüm şema parçalarının sahibidir
- kanal Plugin'leri, konuşma kimliklerinin thread kimliklerini nasıl kodladığı veya üst konuşmalardan nasıl devraldığı gibi sağlayıcıya özgü oturum konuşma dil bilgisinin sahibidir
- kanal Plugin'leri nihai eylemi kendi eylem bağdaştırıcısı üzerinden yürütür

Kanal Plugin'leri için SDK yüzeyi `ChannelMessageActionAdapter.describeMessageTool(...)` şeklindedir. Bu birleşik keşif çağrısı, bir Plugin'in görünür eylemlerini, yeteneklerini ve şema katkılarını birlikte döndürmesine izin verir; böylece bu parçalar birbirinden kopmaz.

Kanala özgü bir message-tool parametresi yerel yol veya uzak medya URL'si gibi bir medya kaynağı taşıdığında, Plugin ayrıca `describeMessageTool(...)` içinden `mediaSourceParams` döndürmelidir. Core, Plugin sahipli parametre adlarını sabit kodlamak yerine sandbox yol normalleştirmesi ve giden medya erişim ipuçlarını uygulamak için bu açık listeyi kullanır. Burada kanal genelinde tek düz liste yerine eylem kapsamlı eşlemeleri tercih edin; böylece profile-only bir medya parametresi `send` gibi ilgisiz eylemlerde normalize edilmez.

Core, bu keşif adımına çalışma zamanı kapsamını geçirir. Önemli alanlar şunlardır:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- güvenilen gelen `requesterSenderId`

Bu, bağlama duyarlı Plugin'ler için önemlidir. Bir kanal; etkin hesaba, geçerli oda/thread/mesaja veya güvenilen isteyen kimliğine göre message eylemlerini gizleyebilir ya da açığa çıkarabilir; core `message` tool'unda kanala özgü dalları sabit kodlamadan.

Bu nedenle gömülü çalıştırıcı yönlendirme değişiklikleri hâlâ Plugin işidir: çalıştırıcı, paylaşılan `message` tool'unun geçerli tur için doğru kanal sahipli yüzeyi açığa çıkarması amacıyla geçerli sohbet/oturum kimliğini Plugin keşif sınırına iletmekten sorumludur.

Kanal sahipli yürütme yardımcıları için paketlenmiş Plugin'ler yürütme çalışma zamanını kendi extension modülleri içinde tutmalıdır. Core artık `src/agents/tools` altında Discord, Slack, Telegram veya WhatsApp mesaj eylemi çalışma zamanlarının sahibi değildir. Ayrı `plugin-sdk/*-action-runtime` alt yolları yayımlamıyoruz ve paketlenmiş Plugin'ler kendi yerel çalışma zamanı kodlarını doğrudan extension sahipli modüllerinden içe aktarmalıdır.

Aynı sınır genel olarak sağlayıcı adlı SDK yüzeyleri için de geçerlidir: core, Slack, Discord, Signal, WhatsApp veya benzeri extension'lar için kanala özgü kolaylık barrel'larını içe aktarmamalıdır. Core bir davranışa ihtiyaç duyuyorsa ya paketlenmiş Plugin'in kendi `api.ts` / `runtime-api.ts` barrel'ını tüketmeli ya da ihtiyacı paylaşılan SDK içinde dar kapsamlı genel bir yeteneğe yükseltmelidir.

Özellikle anketler için iki yürütme yolu vardır:

- `outbound.sendPoll`, ortak anket modeline uyan kanallar için paylaşılan temel çizgidir
- `actions.handleAction("poll")`, kanala özgü anket semantiği veya ek anket parametreleri için tercih edilen yoldur

Core artık paylaşılan anket ayrıştırmasını, Plugin anket dağıtımı eylemi reddettikten sonraya erteler; böylece Plugin sahipli anket işleyicileri, önce genel anket ayrıştırıcısı tarafından engellenmeden kanala özgü anket alanlarını kabul edebilir.

Tam başlangıç sırası için bkz. [Plugin architecture internals](/tr/plugins/architecture-internals).

## Yetenek sahiplik modeli

OpenClaw, yerel bir Plugin'i ilgisiz entegrasyonlardan oluşan bir torba olarak değil, bir **şirketin** veya bir **özelliğin** sahiplik sınırı olarak ele alır.

Bu şu anlama gelir:

- bir şirket Plugin'i genellikle o şirketin OpenClaw'a dönük tüm yüzeylerinin sahibi olmalıdır
- bir özellik Plugin'i genellikle tanıttığı özelliğin tam yüzeyinin sahibi olmalıdır
- kanallar, sağlayıcı davranışını doğaçlama yeniden uygulamak yerine paylaşılan core yeteneklerini tüketmelidir

<AccordionGroup>
  <Accordion title="Sağlayıcı çoklu yetenek">
    `openai`; metin çıkarımı, konuşma, gerçek zamanlı ses, medya anlama ve görsel oluşturmanın sahibidir. `google`; metin çıkarımının yanı sıra medya anlama, görsel oluşturma ve web aramanın sahibidir. `qwen`; metin çıkarımı ile birlikte medya anlama ve video oluşturmanın sahibidir.
  </Accordion>
  <Accordion title="Sağlayıcı tek yetenek">
    `elevenlabs` ve `microsoft` konuşmanın sahibidir; `firecrawl` web-getirmenin sahibidir; `minimax` / `mistral` / `moonshot` / `zai` medya-anlama backend'lerinin sahibidir.
  </Accordion>
  <Accordion title="Özellik Plugin'i">
    `voice-call`; çağrı taşıması, tools, CLI, route'lar ve Twilio medya akışı köprülemesinin sahibidir, ancak sağlayıcı Plugin'leri doğrudan içe aktarmak yerine paylaşılan konuşma, gerçek zamanlı transkripsiyon ve gerçek zamanlı ses yeteneklerini tüketir.
  </Accordion>
</AccordionGroup>

Amaçlanan son durum şudur:

- OpenAI, metin modelleri, konuşma, görseller ve gelecekteki videoları kapsasa bile tek bir Plugin'de yaşar
- başka bir sağlayıcı da kendi yüzey alanı için aynısını yapabilir
- kanallar, hangi sağlayıcı Plugin'inin sağlayıcının sahibi olduğunu umursamaz; core tarafından açığa çıkarılan paylaşılan yetenek sözleşmesini tüketirler

Ana ayrım budur:

- **Plugin** = sahiplik sınırı
- **yetenek** = birden çok Plugin'in uygulayabildiği veya tüketebildiği core sözleşmesi

Bu nedenle OpenClaw video gibi yeni bir alan eklediğinde ilk soru "hangi sağlayıcı video işlemeyi sabit kodlayacak?" değildir. İlk soru "core video yetenek sözleşmesi nedir?" olmalıdır. Bu sözleşme var olduktan sonra sağlayıcı Plugin'leri ona karşı kayıt olabilir ve kanal/özellik Plugin'leri onu tüketebilir.

Yetenek henüz mevcut değilse doğru adım genellikle şudur:

<Steps>
  <Step title="Yeteneği tanımla">
    Eksik yeteneği core içinde tanımlayın.
  </Step>
  <Step title="SDK üzerinden açığa çıkar">
    Bunu Plugin API/çalışma zamanı üzerinden türlenmiş biçimde açığa çıkarın.
  </Step>
  <Step title="Tüketicileri bağla">
    Kanalları/özellikleri bu yeteneğe karşı bağlayın.
  </Step>
  <Step title="Sağlayıcı uygulamaları">
    Sağlayıcı Plugin'lerinin uygulamalar kaydetmesine izin verin.
  </Step>
</Steps>

Bu, sahipliği açık tutarken tek bir sağlayıcıya veya bir defalık Plugin'e özgü kod yoluna bağlı core davranışını önler.

### Yetenek katmanlaması

Kodun nereye ait olduğuna karar verirken şu zihinsel modeli kullanın:

<Tabs>
  <Tab title="Core yetenek katmanı">
    Paylaşılan orkestrasyon, ilke, fallback, config birleştirme kuralları, teslim semantiği ve türlenmiş sözleşmeler.
  </Tab>
  <Tab title="Sağlayıcı Plugin katmanı">
    Sağlayıcıya özgü API'ler, kimlik doğrulama, model katalogları, konuşma sentezi, görsel oluşturma, gelecekteki video backend'leri, kullanım uç noktaları.
  </Tab>
  <Tab title="Kanal/özellik Plugin katmanı">
    Core yeteneklerini tüketen ve bunları bir yüzeyde sunan Slack/Discord/voice-call/vb. entegrasyonu.
  </Tab>
</Tabs>

Örneğin TTS şu biçimi izler:

- core, yanıt zamanı TTS ilkesi, fallback sırası, tercihler ve kanal tesliminin sahibidir
- `openai`, `elevenlabs` ve `microsoft` sentez uygulamalarının sahibidir
- `voice-call`, telefon TTS çalışma zamanı yardımcısını tüketir

Aynı kalıp gelecekteki yetenekler için de tercih edilmelidir.

### Çoklu yetenekli şirket Plugin örneği

Bir şirket Plugin'i dışarıdan bakıldığında tutarlı hissettirmelidir. OpenClaw; modeller, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya anlama, görsel oluşturma, video oluşturma, web getirme ve web arama için paylaşılan sözleşmelere sahipse, bir sağlayıcı tüm yüzeylerinin sahibi tek bir yerde olabilir:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

Önemli olan tam yardımcı adları değildir. Biçim önemlidir:

- tek bir Plugin, sağlayıcı yüzeyinin sahibidir
- core yine yetenek sözleşmelerinin sahibidir
- kanallar ve özellik Plugin'leri sağlayıcı kodunu değil, `api.runtime.*` yardımcılarını tüketir
- sözleşme testleri, Plugin'in sahip olduğunu iddia ettiği yetenekleri kaydettiğini doğrulayabilir

### Yetenek örneği: video anlama

OpenClaw, görsel/ses/video anlamayı zaten tek bir paylaşılan yetenek olarak ele alır. Aynı sahiplik modeli burada da geçerlidir:

<Steps>
  <Step title="Core sözleşmeyi tanımlar">
    Core, medya-anlama sözleşmesini tanımlar.
  </Step>
  <Step title="Sağlayıcı Plugin'leri kayıt olur">
    Sağlayıcı Plugin'leri, uygun olduğu şekilde `describeImage`, `transcribeAudio` ve `describeVideo` kaydeder.
  </Step>
  <Step title="Tüketiciler paylaşılan davranışı kullanır">
    Kanallar ve özellik Plugin'leri doğrudan sağlayıcı koduna bağlanmak yerine paylaşılan core davranışını tüketir.
  </Step>
</Steps>

Bu, bir sağlayıcının video varsayımlarını core içine gömmekten kaçınır. Plugin sağlayıcı yüzeyinin sahibidir; core ise yetenek sözleşmesi ve fallback davranışının sahibidir.

Video oluşturma zaten aynı diziyi kullanır: core türlenmiş yetenek sözleşmesi ve çalışma zamanı yardımcısının sahibidir ve sağlayıcı Plugin'leri buna karşı `api.registerVideoGenerationProvider(...)` uygulamaları kaydeder.

Somut bir yaygınlaştırma denetim listesine mi ihtiyacınız var? Bkz. [Capability Cookbook](/tr/plugins/architecture).

## Sözleşmeler ve zorunlu uygulama

Plugin API yüzeyi, kasıtlı olarak `OpenClawPluginApi` içinde türlenmiş ve merkezileştirilmiştir. Bu sözleşme, desteklenen kayıt noktalarını ve bir Plugin'in güvenebileceği çalışma zamanı yardımcılarını tanımlar.

Bunun önemi:

- Plugin yazarları tek bir kararlı iç standart elde eder
- core, iki Plugin'in aynı sağlayıcı kimliğini kaydetmesi gibi yinelenen sahipliği reddedebilir
- başlangıç, bozuk kayıt için uygulanabilir tanılamalar gösterebilir
- sözleşme testleri, paketlenmiş Plugin sahipliğini zorunlu kılabilir ve sessiz kaymayı önleyebilir

Zorunlu uygulamanın iki katmanı vardır:

<AccordionGroup>
  <Accordion title="Çalışma zamanı kayıt zorlaması">
    Plugin kayıt defteri, Plugin'ler yüklenirken kayıtları doğrular. Örnekler: yinelenen sağlayıcı kimlikleri, yinelenen konuşma sağlayıcısı kimlikleri ve bozuk kayıtlar tanımsız davranış yerine Plugin tanılamaları üretir.
  </Accordion>
  <Accordion title="Sözleşme testleri">
    Paketlenmiş Plugin'ler test çalıştırmaları sırasında sözleşme kayıt defterlerinde yakalanır; böylece OpenClaw sahipliği açıkça doğrulayabilir. Bugün bu; model sağlayıcıları, konuşma sağlayıcıları, web arama sağlayıcıları ve paketlenmiş kayıt sahipliği için kullanılır.
  </Accordion>
</AccordionGroup>

Pratik etkisi şudur: OpenClaw, hangi yüzeyin hangi Plugin'e ait olduğunu en baştan bilir. Bu, sahiplik zımni değil, beyan edilmiş, türlenmiş ve test edilebilir olduğu için core ile kanalların sorunsuz birleşmesini sağlar.

### Bir sözleşmede ne bulunmalı

<Tabs>
  <Tab title="İyi sözleşmeler">
    - türlenmiş
    - küçük
    - yeteneğe özgü
    - core sahibi
    - birden çok Plugin tarafından yeniden kullanılabilir
    - sağlayıcı bilgisi olmadan kanallar/özellikler tarafından tüketilebilir
  </Tab>
  <Tab title="Kötü sözleşmeler">
    - core içinde gizlenmiş sağlayıcıya özgü ilke
    - kayıt defterini atlayan bir defalık Plugin kaçış kapıları
    - kanal kodunun doğrudan bir sağlayıcı uygulamasına uzanması
    - `OpenClawPluginApi` veya `api.runtime` parçası olmayan doğaçlama çalışma zamanı nesneleri
  </Tab>
</Tabs>

Emin olmadığınızda soyutlama düzeyini yükseltin: önce yeteneği tanımlayın, sonra Plugin'lerin ona takılmasına izin verin.

## Yürütme modeli

Yerel OpenClaw Plugin'leri Gateway ile **aynı süreç içinde** çalışır. Sandbox içinde değildirler. Yüklenmiş bir yerel Plugin, core koduyla aynı süreç düzeyinde güven sınırına sahiptir.

<Warning>
Sonuçlar:

- yerel bir Plugin; tools, ağ işleyicileri, hook'lar ve hizmetler kaydedebilir
- yerel bir Plugin hatası gateway'i çökertebilir veya kararsızlaştırabilir
- kötü niyetli bir yerel Plugin, OpenClaw süreci içinde keyfi kod yürütmeye denktir
  </Warning>

Uyumlu bundle'lar varsayılan olarak daha güvenlidir; çünkü OpenClaw şu anda onları metadata/içerik paketleri olarak ele alır. Mevcut sürümlerde bu çoğunlukla paketlenmiş Skills anlamına gelir.

Paketlenmemiş Plugin'ler için allowlist'ler ve açık kurulum/yükleme yolları kullanın. Workspace Plugin'lerini üretim varsayılanları değil, geliştirme zamanı kodu olarak değerlendirin.

Paketlenmiş workspace paket adları için Plugin kimliğini npm adına bağlı tutun: varsayılan olarak `@openclaw/<id>` veya paket bilinçli olarak daha dar bir Plugin rolü açığa çıkarıyorsa `-provider`, `-plugin`, `-speech`, `-sandbox` veya `-media-understanding` gibi onaylı türlenmiş bir son ek kullanın.

<Note>
**Güven notu:**

- `plugins.allow`, **Plugin kimliklerine** güvenir; kaynak kökenine değil.
- Paketlenmiş bir Plugin ile aynı kimliğe sahip bir workspace Plugin'i, etkinse/allowlist'e alınmışsa paketlenmiş kopyayı bilinçli olarak gölgeler.
- Bu, yerel geliştirme, yama testi ve hotfix'ler için normal ve kullanışlıdır.
- Paketlenmiş Plugin güveni, kurulum metadata'sından değil, kaynak anlık görüntüsünden — yükleme anındaki disk üzerindeki manifest ve koddan — çözülür. Bozulmuş veya ikame edilmiş bir kurulum kaydı, paketlenmiş bir Plugin'in güven yüzeyini gerçek kaynağın iddia ettiğinin ötesinde sessizce genişletemez.
  </Note>

## Dışa aktarma sınırı

OpenClaw, uygulama kolaylıklarını değil, yetenekleri dışa aktarır.

Yetenek kaydını genel tutun. Sözleşme dışı yardımcı dışa aktarımları kırpın:

- paketlenmiş Plugin'e özgü yardımcı alt yollar
- genel API olması amaçlanmayan çalışma zamanı altyapı alt yolları
- sağlayıcıya özgü kolaylık yardımcıları
- uygulama ayrıntısı olan kurulum/onboarding yardımcıları

Bazı paketlenmiş Plugin yardımcı alt yolları, uyumluluk ve paketlenmiş Plugin bakımı için üretilmiş SDK dışa aktarma eşleminde hâlâ kalmaktadır. Mevcut örnekler arasında `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` ve çeşitli `plugin-sdk/matrix*` yüzeyleri bulunur. Bunları yeni üçüncü taraf Plugin'ler için önerilen SDK kalıbı olarak değil, ayrılmış uygulama ayrıntısı dışa aktarımları olarak değerlendirin.

## İç yapılar ve referans

Yükleme hattı, kayıt defteri modeli, sağlayıcı çalışma zamanı hook'ları, Gateway HTTP route'ları, message tool şemaları, kanal hedef çözümleme, sağlayıcı katalogları, bağlam motoru Plugin'leri ve yeni bir yetenek ekleme kılavuzu için bkz. [Plugin architecture internals](/tr/plugins/architecture-internals).

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Plugin manifest](/tr/plugins/manifest)
- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)

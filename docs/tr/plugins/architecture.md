---
read_when:
    - Yerel OpenClaw plugin'leri oluşturuluyor veya ayıklanıyor
    - Plugin yetenek modeli veya sahiplik sınırları anlaşılıyor
    - Plugin yükleme hattı veya kayıt defteri üzerinde çalışılıyor
    - Sağlayıcı çalışma zamanı kancaları veya kanal plugin'leri uygulanıyor
sidebarTitle: Internals
summary: 'Plugin iç yapıları: yetenek modeli, sahiplik, sözleşmeler, yükleme hattı ve çalışma zamanı yardımcıları'
title: Plugin İç Yapıları
x-i18n:
    generated_at: "2026-04-22T04:24:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69080a1d0e496b321a6fd5a3e925108c3a03c41710073f8f23af13933a091e28
    source_path: plugins/architecture.md
    workflow: 15
---

# Plugin İç Yapıları

<Info>
  Bu, **derin mimari referansıdır**. Uygulamalı kılavuzlar için bkz.:
  - [Plugin'leri kurun ve kullanın](/tr/tools/plugin) — kullanıcı kılavuzu
  - [Başlangıç](/tr/plugins/building-plugins) — ilk Plugin öğreticisi
  - [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) — bir mesajlaşma kanalı oluşturun
  - [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) — bir model sağlayıcısı oluşturun
  - [SDK Genel Bakış](/tr/plugins/sdk-overview) — import map ve kayıt API'si
</Info>

Bu sayfa OpenClaw Plugin sisteminin iç mimarisini kapsar.

## Genel yetenek modeli

Yetenekler, OpenClaw içindeki genel **yerel Plugin** modelidir. Her
yerel OpenClaw Plugin'i bir veya daha fazla yetenek türüne kayıt olur:

| Capability             | Registration method                              | Example plugins                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Metin çıkarımı         | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI çıkarım backend'i  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Konuşma                | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Gerçek zamanlı transkripsiyon | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                       |
| Gerçek zamanlı ses     | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Medya anlama           | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Görsel oluşturma       | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Müzik oluşturma        | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Video oluşturma        | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Web getirme            | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Web arama              | `api.registerWebSearchProvider(...)`             | `google`                             |
| Kanal / mesajlaşma     | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

Sıfır yetenek kaydeden ancak hook, araç veya
hizmet sağlayan bir Plugin **eski yalnızca hook** Plugin'idir. Bu desen hâlâ tamamen desteklenmektedir.

### Harici uyumluluk yaklaşımı

Yetenek modeli çekirdeğe alınmıştır ve bugün paketlenmiş/yerel Plugin'ler
tarafından kullanılmaktadır, ancak harici Plugin uyumluluğu için hâlâ
"export edildi, dolayısıyla donduruldu" yaklaşımından daha sıkı bir çıta gerekir.

Geçerli rehberlik:

- **mevcut harici Plugin'ler:** hook tabanlı entegrasyonları çalışır tutun;
  bunu uyumluluk temel çizgisi olarak değerlendirin
- **yeni paketlenmiş/yerel Plugin'ler:** satıcıya özel iç erişimler veya yeni
  yalnızca hook tasarımları yerine açık yetenek kaydını tercih edin
- **yetenek kaydını benimseyen harici Plugin'ler:** buna izin verilir, ancak
  belgeler bir sözleşmeyi açıkça kararlı olarak işaretlemedikçe yeteneğe özgü
  yardımcı yüzeyleri gelişmekte olan yüzeyler olarak değerlendirin

Pratik kural:

- yetenek kayıt API'leri amaçlanan yöndür
- eski hook'lar, geçiş sürecinde harici Plugin'ler için bozulmama açısından en güvenli yoldur
- export edilen yardımcı alt yolların hepsi eşit değildir; tesadüfi yardımcı export'ları değil,
  belgelenmiş dar sözleşmeyi tercih edin

### Plugin biçimleri

OpenClaw, yüklenen her Plugin'i salt statik meta veriye göre değil, gerçek
kayıt davranışına göre bir biçime sınıflandırır:

- **plain-capability** -- tam olarak bir yetenek türüne kayıt olur (örneğin
  `mistral` gibi yalnızca sağlayıcı olan bir Plugin)
- **hybrid-capability** -- birden fazla yetenek türüne kayıt olur (örneğin
  `openai`; metin çıkarımı, konuşma, medya anlama ve görsel
  oluşturmaya sahiptir)
- **hook-only** -- yalnızca hook kaydeder (tipli veya özel), yetenek,
  araç, komut veya hizmet kaydetmez
- **non-capability** -- araç, komut, hizmet veya rota kaydeder ama
  yetenek kaydetmez

Bir Plugin'in biçimini ve yetenek dökümünü görmek için `openclaw plugins inspect <id>` kullanın.
Ayrıntılar için bkz. [CLI referansı](/cli/plugins#inspect).

### Eski hook'lar

`before_agent_start` hook'u, yalnızca hook kullanan Plugin'ler için
bir uyumluluk yolu olarak desteklenmeye devam eder. Gerçek eski Plugin'ler hâlâ buna bağlıdır.

Yön:

- çalışır durumda tutun
- belge içinde eski olarak işaretleyin
- model/sağlayıcı geçersiz kılma işleri için `before_model_resolve` tercih edin
- istem değiştirme işleri için `before_prompt_build` tercih edin
- yalnızca gerçek kullanım düştükten ve fixture kapsamı geçiş güvenliğini kanıtladıktan sonra kaldırın

### Uyumluluk sinyalleri

`openclaw doctor` veya `openclaw plugins inspect <id>` çalıştırdığınızda aşağıdaki etiketlerden
birini görebilirsiniz:

| Signal                     | Meaning                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **yapılandırma geçerli**   | Yapılandırma sorunsuz ayrıştırılıyor ve Plugin'ler çözümleniyor |
| **uyumluluk danışması**    | Plugin desteklenen ancak daha eski bir desen kullanıyor (ör. `hook-only`) |
| **eski uyarısı**           | Plugin kullanımdan kaldırılmış olan `before_agent_start` kullanıyor |
| **kesin hata**             | Yapılandırma geçersiz veya Plugin yüklenemedi                |

Ne `hook-only` ne de `before_agent_start` bugün Plugin'inizi bozmaz --
`hook-only` yalnızca danışma niteliğindedir ve `before_agent_start` yalnızca uyarı üretir. Bu
sinyaller `openclaw status --all` ve `openclaw plugins doctor` içinde de görünür.

## Mimariye genel bakış

OpenClaw'ın Plugin sistemi dört katmandan oluşur:

1. **Manifest + keşif**
   OpenClaw, yapılandırılmış yollardan, çalışma alanı köklerinden,
   genel extension köklerinden ve paketlenmiş extension'lardan aday Plugin'leri bulur. Keşif önce yerel
   `openclaw.plugin.json` manifestlerini ve desteklenen bundle manifestlerini okur.
2. **Etkinleştirme + doğrulama**
   Çekirdek, keşfedilen bir Plugin'in etkin, devre dışı, engellenmiş veya
   memory gibi özel bir yuva için seçilmiş olup olmadığına karar verir.
3. **Çalışma zamanı yükleme**
   Yerel OpenClaw Plugin'leri jiti aracılığıyla süreç içinde yüklenir ve
   yetenekleri merkezi bir kayıt defterine kaydeder. Uyumlu bundle'lar
   çalışma zamanı kodu import edilmeden kayıt defteri kayıtlarına normalize edilir.
4. **Yüzey tüketimi**
   OpenClaw'ın geri kalanı araçları, kanalları, sağlayıcı
   kurulumunu, hook'ları, HTTP rotalarını, CLI komutlarını ve hizmetleri açığa çıkarmak için kayıt defterini okur.

Özellikle Plugin CLI için, kök komut keşfi iki aşamaya ayrılır:

- ayrıştırma zamanı meta verisi `registerCli(..., { descriptors: [...] })` içinden gelir
- gerçek Plugin CLI modülü lazy kalabilir ve ilk çağrıda kaydolabilir

Bu, Plugin'e ait CLI kodunu Plugin içinde tutarken OpenClaw'ın
ayrıştırmadan önce kök komut adlarını ayırmasına olanak tanır.

Önemli tasarım sınırı:

- keşif + yapılandırma doğrulaması, Plugin kodunu çalıştırmadan
  **manifest/şema meta verisi** üzerinden çalışmalıdır
- yerel çalışma zamanı davranışı, Plugin modülünün `register(api)` yolundan gelir

Bu ayrım, tam çalışma zamanı etkin olmadan önce OpenClaw'ın yapılandırmayı doğrulamasına,
eksik/devre dışı Plugin'leri açıklamasına ve UI/şema ipuçları oluşturmasına olanak tanır.

### Kanal Plugin'leri ve paylaşılan mesaj aracı

Kanal Plugin'lerinin normal sohbet eylemleri için ayrı bir gönder/düzenle/tepki aracı
kaydetmesi gerekmez. OpenClaw çekirdekte tek bir paylaşılan `message` aracı tutar ve
kanala özgü keşif ile yürütme bunun arkasında kanal Plugin'lerine aittir.

Geçerli sınır şöyledir:

- çekirdek, paylaşılan `message` araç host'unu, istem bağlamasını, oturum/thread
  muhasebesini ve yürütme dispatch'ini sahiplenir
- kanal Plugin'leri kapsamlı eylem keşfini, yetenek keşfini ve kanala özgü
  şema parçalarını sahiplenir
- kanal Plugin'leri; konuşma kimliklerinin thread kimliklerini nasıl kodladığı veya üst konuşmalardan
  nasıl devraldığı gibi sağlayıcıya özgü oturum konuşma dil bilgisini sahiplenir
- kanal Plugin'leri son eylemi eylem adaptörleri üzerinden yürütür

Kanal Plugin'leri için SDK yüzeyi
`ChannelMessageActionAdapter.describeMessageTool(...)` şeklindedir. Bu birleşik keşif
çağrısı, bir Plugin'in görünür eylemlerini, yeteneklerini ve şema
katkılarını birlikte döndürmesine olanak tanır; böylece bu parçalar birbirinden kopmaz.

Kanala özgü bir mesaj-aracı parametresi yerel yol veya uzak medya URL'si gibi
bir medya kaynağı taşıdığında, Plugin ayrıca
`describeMessageTool(...)` içinden `mediaSourceParams` döndürmelidir. Çekirdek, Plugin'e ait
parametre adlarını sabit kodlamadan sandbox yol normalizasyonu ve giden
medya erişim ipuçlarını uygulamak için bu açık listeyi kullanır.
Burada kanal genelinde düz bir liste yerine eylem kapsamlı eşlemeleri
tercih edin; böylece yalnızca profile ait bir medya parametresi
`send` gibi ilgisiz eylemlerde normalize edilmez.

Çekirdek çalışma zamanı kapsamını bu keşif adımına geçirir. Önemli alanlar şunlardır:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- güvenilir gelen `requesterSenderId`

Bu, bağlama duyarlı Plugin'ler için önemlidir. Bir kanal; etkin hesap,
geçerli oda/thread/mesaj veya güvenilir istek sahibinin kimliğine göre
çekirdekte `message` aracına kanala özgü dallar sabit kodlamadan mesaj eylemlerini gizleyebilir veya açığa çıkarabilir.

Bu nedenle gömülü runner yönlendirme değişiklikleri hâlâ Plugin işidir: runner,
paylaşılan `message` aracının geçerli dönüş için doğru kanala ait yüzeyi açığa çıkarması amacıyla
geçerli sohbet/oturum kimliğini Plugin keşif sınırına iletmekten sorumludur.

Kanala ait yürütme yardımcıları için, paketlenmiş Plugin'ler yürütme
çalışma zamanını kendi extension modüllerinde tutmalıdır. Çekirdek artık
`src/agents/tools` altında Discord, Slack, Telegram veya WhatsApp mesaj-eylem çalışma zamanlarını sahiplenmez.
Ayrı `plugin-sdk/*-action-runtime` alt yolları yayınlamıyoruz ve paketlenmiş
Plugin'ler kendi yerel çalışma zamanı kodlarını doğrudan kendi
extension modüllerinden import etmelidir.

Aynı sınır genel olarak sağlayıcı adlandırmalı SDK sınırları için de geçerlidir: çekirdek,
Slack, Discord, Signal, WhatsApp veya benzeri extension'lara özgü kolaylık barrel'larını import etmemelidir.
Çekirdeğin bir davranışa ihtiyacı varsa, ya paketlenmiş Plugin'in kendi `api.ts` / `runtime-api.ts`
barrel'ını tüketin ya da ihtiyacı paylaşılan SDK içinde dar bir genel yetenek haline getirin.

Özellikle anketler için iki yürütme yolu vardır:

- `outbound.sendPoll`, ortak anket modeline uyan kanallar için paylaşılan temel yoldur
- `actions.handleAction("poll")`, kanala özgü anket semantiği veya ek anket parametreleri için tercih edilen yoldur

Çekirdek artık paylaşılan anket ayrıştırmasını, Plugin anket dispatch'i
eylemi reddettikten sonraya erteler; böylece Plugin'e ait anket işleyicileri
genel anket ayrıştırıcısı tarafından önce engellenmeden kanala özgü anket
alanlarını kabul edebilir.

Tam başlangıç sırası için bkz. [Yükleme hattı](#load-pipeline).

## Yetenek sahipliği modeli

OpenClaw, yerel bir Plugin'i alakasız entegrasyonların
rastgele bir derlemesi olarak değil, bir **şirketin** veya bir
**özelliğin** sahiplik sınırı olarak ele alır.

Bu şu anlama gelir:

- bir şirket Plugin'i genellikle o şirketin OpenClaw'a dönük
  tüm yüzeylerine sahip olmalıdır
- bir özellik Plugin'i genellikle getirdiği tam özellik yüzeyine sahip olmalıdır
- kanallar, sağlayıcı davranışını geçici olarak yeniden uygulamak yerine
  paylaşılan çekirdek yetenekleri tüketmelidir

Örnekler:

- paketlenmiş `openai` Plugin'i, OpenAI model-sağlayıcı davranışına ve OpenAI
  konuşma + gerçek zamanlı ses + medya anlama + görsel oluşturma davranışına sahiptir
- paketlenmiş `elevenlabs` Plugin'i, ElevenLabs konuşma davranışına sahiptir
- paketlenmiş `microsoft` Plugin'i, Microsoft konuşma davranışına sahiptir
- paketlenmiş `google` Plugin'i, Google model-sağlayıcı davranışına ve ayrıca Google
  medya anlama + görsel oluşturma + web arama davranışına sahiptir
- paketlenmiş `firecrawl` Plugin'i, Firecrawl web-getirme davranışına sahiptir
- paketlenmiş `minimax`, `mistral`, `moonshot` ve `zai` Plugin'leri kendi
  medya anlama backend'lerine sahiptir
- paketlenmiş `qwen` Plugin'i, Qwen metin-sağlayıcı davranışına ve ayrıca
  medya anlama ile video oluşturma davranışına sahiptir
- `voice-call` Plugin'i bir özellik Plugin'idir: çağrı taşımasını, araçları,
  CLI'yi, rotaları ve Twilio medya akışı köprülemesini sahiplenir, ancak
  satıcı Plugin'lerini doğrudan import etmek yerine paylaşılan konuşma
  ile gerçek zamanlı transkripsiyon ve gerçek zamanlı ses yeteneklerini tüketir

Hedeflenen son durum şudur:

- OpenAI, metin modellerini, konuşmayı, görselleri ve
  gelecekteki videoyu kapsasa bile tek bir Plugin içinde yaşar
- başka bir satıcı da kendi yüzey alanı için aynısını yapabilir
- kanallar, sağlayıcının hangi satıcı Plugin'ine ait olduğunu umursamaz; çekirdek tarafından açığa çıkarılan
  paylaşılan yetenek sözleşmesini tüketirler

Temel ayrım şudur:

- **Plugin** = sahiplik sınırı
- **yetenek** = birden fazla Plugin'in uygulayabileceği veya tüketebileceği çekirdek sözleşme

Dolayısıyla OpenClaw video gibi yeni bir alan eklediğinde, ilk soru
"hangi sağlayıcı video işlemeyi sabit kodlayacak?" değildir. İlk soru "çekirdek video
yetenek sözleşmesi nedir?" olmalıdır. Bu sözleşme mevcut olduğunda, satıcı Plugin'leri
ona kayıt olabilir ve kanal/özellik Plugin'leri bunu tüketebilir.

Yetenek henüz mevcut değilse, doğru hareket genellikle şudur:

1. çekirdekte eksik yeteneği tanımlayın
2. bunu tipli şekilde Plugin API'si/çalışma zamanı üzerinden açığa çıkarın
3. kanal/özellikleri o yeteneğe karşı bağlayın
4. satıcı Plugin'lerinin uygulamaları kaydetmesine izin verin

Bu, tek bir satıcıya veya tek seferlik Plugin'e özgü bir kod yoluna bağlı
çekirdek davranıştan kaçınırken sahipliği açık tutar.

### Yetenek katmanlaması

Kodun nereye ait olduğuna karar verirken şu zihinsel modeli kullanın:

- **çekirdek yetenek katmanı**: paylaşılan orkestrasyon, ilke, geri dönüş, yapılandırma
  birleştirme kuralları, teslim semantiği ve tipli sözleşmeler
- **satıcı Plugin katmanı**: satıcıya özgü API'ler, auth, model katalogları, konuşma
  sentezi, görsel oluşturma, gelecekteki video backend'leri, kullanım uç noktaları
- **kanal/özellik Plugin katmanı**: Slack/Discord/voice-call/vb. entegrasyonları;
  bunlar çekirdek yetenekleri tüketir ve bir yüzeyde sunar

Örneğin TTS şu yapıyı izler:

- çekirdek, yanıt zamanı TTS ilkesini, geri dönüş sırasını, tercihleri ve kanal teslimini sahiplenir
- `openai`, `elevenlabs` ve `microsoft`, sentez uygulamalarına sahiptir
- `voice-call`, telefon TTS çalışma zamanı yardımcısını tüketir

Gelecekteki yetenekler için de aynı desen tercih edilmelidir.

### Çok yetenekli şirket Plugin örneği

Bir şirket Plugin'i dışarıdan bakıldığında bütüncül hissettirmelidir. OpenClaw'da
modeller, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya
anlama, görsel oluşturma, video oluşturma, web getirme ve web arama için paylaşılan
sözleşmeler varsa, bir satıcı tüm yüzeylerine tek bir yerde sahip olabilir:

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

Önemli olan yardımcı adların tam olarak ne olduğu değildir. Önemli olan biçimdir:

- tek bir Plugin satıcı yüzeyine sahiptir
- çekirdek yine de yetenek sözleşmelerine sahiptir
- kanal ve özellik Plugin'leri satıcı kodunu değil, `api.runtime.*` yardımcılarını tüketir
- sözleşme testleri, Plugin'in sahip olduğunu iddia ettiği yetenekleri kaydettiğini doğrulayabilir

### Yetenek örneği: video anlama

OpenClaw, görsel/ses/video anlamayı zaten tek bir paylaşılan
yetenek olarak ele alır. Aynı sahiplik modeli burada da geçerlidir:

1. çekirdek medya anlama sözleşmesini tanımlar
2. satıcı Plugin'leri, uygulanabildiğinde `describeImage`, `transcribeAudio` ve
   `describeVideo` kaydeder
3. kanal ve özellik Plugin'leri, satıcı koduna doğrudan bağlanmak yerine paylaşılan çekirdek davranışı tüketir

Bu, bir sağlayıcının video varsayımlarının çekirdeğe yerleşmesini önler. Plugin
satıcı yüzeyine sahiptir; çekirdek ise yetenek sözleşmesine ve geri dönüş davranışına sahiptir.

Video oluşturma da zaten aynı diziyi kullanır: çekirdek tipli
yetenek sözleşmesini ve çalışma zamanı yardımcısını sahiplenir, satıcı Plugin'leri ise
`api.registerVideoGenerationProvider(...)` uygulamalarını buna karşı kaydeder.

Somut bir yaygınlaştırma kontrol listesine mi ihtiyacınız var? Bkz.
[Capability Cookbook](/tr/plugins/architecture).

## Sözleşmeler ve zorlama

Plugin API yüzeyi, `OpenClawPluginApi` içinde kasıtlı olarak tipli ve merkezidir.
Bu sözleşme, desteklenen kayıt noktalarını ve
bir Plugin'in güvenebileceği çalışma zamanı yardımcılarını tanımlar.

Bunun önemi:

- Plugin yazarları tek bir kararlı iç standart elde eder
- çekirdek, aynı sağlayıcı kimliğini kaydeden iki Plugin gibi yinelenen sahipliği reddedebilir
- başlangıç, hatalı biçimlenmiş kayıtlar için eyleme dönük tanılar sunabilir
- sözleşme testleri, paketlenmiş Plugin sahipliğini zorlayabilir ve sessiz kaymayı önleyebilir

İki zorlama katmanı vardır:

1. **çalışma zamanı kayıt zorlaması**
   Plugin kayıt defteri, Plugin'ler yüklenirken kayıtları doğrular. Örnekler:
   yinelenen sağlayıcı kimlikleri, yinelenen konuşma sağlayıcı kimlikleri ve hatalı
   kayıtlar; tanımsız davranış yerine Plugin tanıları üretir.
2. **sözleşme testleri**
   Paketlenmiş Plugin'ler test çalıştırmaları sırasında sözleşme kayıtlarında tutulur; böylece
   OpenClaw sahipliği açıkça doğrulayabilir. Bugün bu; model
   sağlayıcıları, konuşma sağlayıcıları, web arama sağlayıcıları ve paketlenmiş kayıt
   sahipliği için kullanılmaktadır.

Pratik etkisi şudur: OpenClaw, hangi Plugin'in hangi
yüzeye sahip olduğunu baştan bilir. Bu, çekirdek ile kanalların kusursuz biçimde birleşmesine olanak tanır
çünkü sahiplik örtük değil, bildirilmiş, tipli ve test edilebilirdir.

### Sözleşmeye ne aittir

İyi Plugin sözleşmeleri şunlardır:

- tipli
- küçük
- yeteneğe özgü
- çekirdeğe ait
- birden fazla Plugin tarafından yeniden kullanılabilir
- satıcı bilgisi olmadan kanal/özellikler tarafından tüketilebilir

Kötü Plugin sözleşmeleri şunlardır:

- çekirdek içinde gizlenmiş satıcıya özgü ilke
- kayıt defterini baypas eden tek seferlik Plugin kaçış kapıları
- doğrudan bir satıcı uygulamasına ulaşan kanal kodu
- `OpenClawPluginApi` veya
  `api.runtime` parçası olmayan geçici çalışma zamanı nesneleri

Şüphede kaldığınızda soyutlama düzeyini yükseltin: önce yeteneği tanımlayın, sonra
Plugin'lerin ona bağlanmasına izin verin.

## Yürütme modeli

Yerel OpenClaw Plugin'leri Gateway ile **aynı süreç içinde** çalışır. Sandbox'lanmazlar.
Yüklenmiş bir yerel Plugin, çekirdek kodla aynı süreç düzeyinde güven sınırına sahiptir.

Sonuçlar:

- yerel bir Plugin araçlar, ağ işleyicileri, hook'lar ve hizmetler kaydedebilir
- yerel bir Plugin hatası gateway'i çökertip kararsızlaştırabilir
- kötü amaçlı bir yerel Plugin, OpenClaw süreci içinde keyfi kod yürütmeye eşdeğerdir

Uyumlu bundle'lar varsayılan olarak daha güvenlidir çünkü OpenClaw şu anda onları
meta veri/içerik paketi olarak ele alır. Geçerli sürümlerde bu çoğunlukla
paketlenmiş Skills anlamına gelir.

Paketlenmemiş Plugin'ler için izin listeleri ve açık kurulum/yükleme yolları kullanın. Çalışma alanı
Plugin'lerini üretim varsayılanı değil, geliştirme zamanı kodu olarak ele alın.

Paketlenmiş çalışma alanı paket adlarında, Plugin kimliğini npm
adına bağlı tutun: varsayılan olarak `@openclaw/<id>` ya da
paket kasıtlı olarak daha dar bir Plugin rolü açığa çıkarıyorsa `-provider`, `-plugin`, `-speech`, `-sandbox` veya `-media-understanding`
gibi onaylı tipli soneklerden biri.

Önemli güven notu:

- `plugins.allow`, kaynak kökenine değil **Plugin kimliklerine** güvenir.
- Paketlenmiş bir Plugin ile aynı kimliğe sahip bir çalışma alanı Plugin'i,
  o çalışma alanı Plugin'i etkin/izin listesinde olduğunda paketlenmiş kopyayı kasıtlı olarak gölgeler.
- Bu normaldir ve yerel geliştirme, yama testi ve hotfix'ler için kullanışlıdır.

## Export sınırı

OpenClaw uygulama kolaylığı değil, yetenek export eder.

Yetenek kaydını genel tutun. Sözleşme dışı yardımcı export'ları budayın:

- paketlenmiş Plugin'e özgü yardımcı alt yollar
- genel API olması amaçlanmayan çalışma zamanı tesisatı alt yolları
- satıcıya özgü kolaylık yardımcıları
- uygulama ayrıntısı olan kurulum/onboarding yardımcıları

Bazı paketlenmiş Plugin yardımcı alt yolları, uyumluluk ve paketlenmiş Plugin bakımı için
oluşturulmuş SDK export haritasında hâlâ kalmaktadır. Güncel örnekler arasında
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` ve birkaç `plugin-sdk/matrix*` sınırı bulunur. Bunları
yeni üçüncü taraf Plugin'ler için önerilen SDK deseni olarak değil,
ayrılmış uygulama ayrıntısı export'ları olarak değerlendirin.

## Yükleme hattı

Başlangıçta OpenClaw kabaca şunları yapar:

1. aday Plugin köklerini keşfeder
2. yerel veya uyumlu bundle manifestlerini ve paket meta verilerini okur
3. güvensiz adayları reddeder
4. Plugin yapılandırmasını normalize eder (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. her aday için etkinleştirme kararını verir
6. etkin yerel modülleri jiti aracılığıyla yükler
7. yerel `register(api)` (veya eski bir takma ad olan `activate(api)`) hook'larını çağırır ve kayıtları Plugin kayıt defterinde toplar
8. kayıt defterini komut/çalışma zamanı yüzeylerine açar

<Note>
`activate`, `register` için eski bir takma addır — yükleyici mevcut olanı (`def.register ?? def.activate`) çözümler ve aynı noktada çağırır. Tüm paketlenmiş Plugin'ler `register` kullanır; yeni Plugin'ler için `register` tercih edin.
</Note>

Güvenlik geçitleri çalışma zamanı yürütmesinden **önce** gerçekleşir. Adaylar,
giriş Plugin kökünden kaçıyorsa, yol herkes tarafından yazılabilirse veya
paketlenmemiş Plugin'ler için yol sahipliği şüpheli görünüyorsa engellenir.

### Manifest-öncelikli davranış

Manifest, kontrol düzlemi için gerçek kaynak kaydıdır. OpenClaw bunu şunlar için kullanır:

- Plugin'i tanımlamak
- bildirilmiş kanalları/Skills'i/yapılandırma şemasını veya bundle yeteneklerini keşfetmek
- `plugins.entries.<id>.config` değerini doğrulamak
- Control UI etiketlerini/yer tutucularını zenginleştirmek
- kurulum/katalog meta verilerini göstermek
- Plugin çalışma zamanını yüklemeden ucuz etkinleştirme ve kurulum tanımlayıcılarını korumak

Yerel Plugin'ler için çalışma zamanı modülü veri düzlemi parçasıdır. Hook, araç, komut veya sağlayıcı akışları gibi
gerçek davranışları kaydeder.

İsteğe bağlı manifest `activation` ve `setup` blokları kontrol düzleminde kalır.
Bunlar etkinleştirme planlaması ve kurulum keşfi için yalnızca meta veri tanımlayıcılarıdır;
çalışma zamanı kaydının, `register(...)` işlevinin veya `setupEntry` işlevinin yerini almaz.
İlk canlı etkinleştirme tüketicileri artık daha geniş kayıt defteri somutlaştırmasından önce Plugin yüklemeyi daraltmak için
manifest komut, kanal ve sağlayıcı ipuçlarını kullanır:

- CLI yükleme, istenen birincil komuta sahip olan Plugin'lere daraltılır
- kanal kurulumu/Plugin çözümleme, istenen
  kanal kimliğine sahip olan Plugin'lere daraltılır
- açık sağlayıcı kurulumu/çalışma zamanı çözümleme, istenen
  sağlayıcı kimliğine sahip olan Plugin'lere daraltılır

Kurulum keşfi artık kurulum zamanı çalışma zamanı kancalarına hâlâ ihtiyaç duyan Plugin'ler için
`setup-api`'ye geri dönmeden önce aday Plugin'leri daraltmak amacıyla
`setup.providers` ve `setup.cliBackends` gibi descriptor sahipli kimlikleri tercih ediyor.
Keşfedilen birden fazla Plugin aynı normalize edilmiş kurulum sağlayıcısı veya CLI backend
kimliğini talep ederse, kurulum araması keşif sırasına güvenmek yerine
belirsiz sahibi reddeder.

### Yükleyicinin önbelleğe aldığı şeyler

OpenClaw, şunlar için süreç içi kısa önbellekler tutar:

- keşif sonuçları
- manifest kayıt defteri verileri
- yüklenmiş Plugin kayıt defterleri

Bu önbellekler ani başlangıçları ve yinelenen komut ek yükünü azaltır. Bunları
kalıcılık olarak değil, kısa ömürlü performans önbellekleri olarak düşünmek güvenlidir.

Performans notu:

- Bu önbellekleri devre dışı bırakmak için `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` veya
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` ayarlayın.
- Önbellek pencerelerini `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` ve
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` ile ayarlayın.

## Kayıt defteri modeli

Yüklenmiş Plugin'ler rastgele çekirdek global değişkenleri doğrudan değiştirmez. Merkezi bir
Plugin kayıt defterine kaydolurlar.

Kayıt defteri şunları izler:

- Plugin kayıtları (kimlik, kaynak, köken, durum, tanılar)
- araçlar
- eski hook'lar ve tipli hook'lar
- kanallar
- sağlayıcılar
- gateway RPC işleyicileri
- HTTP rotaları
- CLI registrar'ları
- arka plan hizmetleri
- Plugin'e ait komutlar

Çekirdek özellikler daha sonra Plugin modülleriyle doğrudan konuşmak yerine bu kayıt defterinden okur.
Bu, yüklemeyi tek yönlü tutar:

- Plugin modülü -> kayıt defterine kayıt
- çekirdek çalışma zamanı -> kayıt defteri tüketimi

Bu ayrım bakım kolaylığı açısından önemlidir. Çoğu çekirdek yüzeyin yalnızca
tek bir entegrasyon noktasına ihtiyaç duyması anlamına gelir: "kayıt defterini oku",
"her Plugin modülü için özel durum yaz" değil.

## Konuşma bağlama geri çağrıları

Bir konuşmayı bağlayan Plugin'ler, bir onay çözümlendiğinde tepki verebilir.

Bir bağlama isteği onaylandıktan veya reddedildikten sonra geri çağrı almak için
`api.onConversationBindingResolved(...)` kullanın:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Artık bu plugin + konuşma için bir bağ mevcut.
        console.log(event.binding?.conversationId);
        return;
      }

      // İstek reddedildi; yerel bekleyen durumu temizleyin.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Geri çağrı yük alanları:

- `status`: `"approved"` veya `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` veya `"deny"`
- `binding`: onaylanmış istekler için çözümlenen bağ
- `request`: özgün istek özeti, ayırma ipucu, gönderici kimliği ve
  konuşma meta verileri

Bu geri çağrı yalnızca bildirim amaçlıdır. Bir konuşmayı kimin bağlayabileceğini değiştirmez
ve çekirdek onay işleme bittikten sonra çalışır.

## Sağlayıcı çalışma zamanı kancaları

Sağlayıcı Plugin'lerinin artık iki katmanı vardır:

- manifest meta verisi: çalışma zamanı yüklemeden önce düşük maliyetli sağlayıcı env-auth araması için `providerAuthEnvVars`,
  auth paylaşan sağlayıcı varyantları için `providerAuthAliases`,
  çalışma zamanı yüklemeden önce düşük maliyetli kanal env/kurulum araması için `channelEnvVars`,
  ayrıca çalışma zamanı yüklemeden önce düşük maliyetli onboarding/auth-choice etiketleri ve
  CLI bayrak meta verisi için `providerAuthChoices`
- yapılandırma zamanı kancaları: `catalog` / eski `discovery` ile `applyConfigDefaults`
- çalışma zamanı kancaları: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `resolveExternalAuthProfiles`,
  `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `contributeResolvedModelCompat`, `capabilities`,
  `normalizeToolSchemas`, `inspectToolSchemas`,
  `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`,
  `wrapStreamFn`, `resolveTransportTurnState`,
  `resolveWebSocketSessionPolicy`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `isCacheTtlEligible`,
  `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`,
  `resolveThinkingProfile`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw yine de genel ajan döngüsüne, failover'a, transcript işlemeye ve
araç ilkesine sahiptir. Bu kancalar, tamamen özel bir çıkarım taşımasına
ihtiyaç duymadan sağlayıcıya özgü davranışlar için extension yüzeyidir.

Sağlayıcının, genel auth/status/model-picker yollarının Plugin çalışma zamanını
yüklemeden görebilmesi gereken env tabanlı kimlik bilgileri varsa manifest `providerAuthEnvVars` kullanın.
Bir sağlayıcı kimliği başka bir sağlayıcı kimliğinin env değişkenlerini,
auth profillerini, config destekli auth'unu ve API key onboarding seçimini yeniden kullanacaksa
manifest `providerAuthAliases` kullanın. Onboarding/auth-choice
CLI yüzeylerinin çalışma zamanı yüklemeden sağlayıcının choice kimliğini, grup etiketlerini ve
basit tek bayraklı auth bağlantısını bilmesi gerekiyorsa manifest `providerAuthChoices` kullanın.
Sağlayıcı çalışma zamanı `envVars` değerlerini onboarding etiketleri veya OAuth
client-id/client-secret kurulum değişkenleri gibi operator'e dönük ipuçları için saklayın.

Bir kanalın, genel kabuk-env geri dönüşü, config/status kontrolleri veya kurulum istemlerinin
kanal çalışma zamanını yüklemeden görmesi gereken env odaklı auth'u veya kurulumu varsa
manifest `channelEnvVars` kullanın.

### Kanca sırası ve kullanım

Model/sağlayıcı Plugin'leri için OpenClaw kancaları kabaca bu sırada çağırır.
"When to use" sütunu hızlı karar rehberidir.

| #   | Hook                              | Ne yapar                                                                                                       | Ne zaman kullanılmalı                                                                                                                       |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` üretimi sırasında sağlayıcı yapılandırmasını `models.providers` içine yayınlar                  | Sağlayıcı bir kataloğa veya temel URL varsayılanlarına sahipse                                                                              |
| 2   | `applyConfigDefaults`             | Yapılandırma somutlaştırması sırasında sağlayıcıya ait genel yapılandırma varsayılanlarını uygular            | Varsayılanlar auth moduna, env'e veya sağlayıcının model ailesi semantiğine bağlıysa                                                       |
| --  | _(yerleşik model araması)_        | OpenClaw önce normal kayıt defteri/katalog yolunu dener                                                       | _(bir Plugin kancası değildir)_                                                                                                             |
| 3   | `normalizeModelId`                | Aramadan önce eski veya önizleme model kimliği takma adlarını normalize eder                                  | Sağlayıcı, kanonik model çözümlemesinden önce takma ad temizliğini sahipleniyorsa                                                           |
| 4   | `normalizeTransport`              | Genel model derlemesinden önce sağlayıcı ailesi `api` / `baseUrl` değerlerini normalize eder                 | Sağlayıcı, aynı taşıma ailesindeki özel sağlayıcı kimlikleri için taşıma temizliğine sahipse                                                |
| 5   | `normalizeConfig`                 | Çalışma zamanı/sağlayıcı çözümlemesinden önce `models.providers.<id>` değerini normalize eder                | Sağlayıcının, Plugin ile birlikte yaşaması gereken yapılandırma temizliğine ihtiyacı varsa; paketlenmiş Google ailesi yardımcıları da desteklenen Google yapılandırma girdileri için geri destek sağlar |
| 6   | `applyNativeStreamingUsageCompat` | Yapılandırma sağlayıcılarına yerel akış-kullanım uyumluluk yeniden yazımlarını uygular                        | Sağlayıcının uç nokta odaklı yerel akış kullanım meta veri düzeltmelerine ihtiyacı varsa                                                    |
| 7   | `resolveConfigApiKey`             | Çalışma zamanı auth yüklemesinden önce yapılandırma sağlayıcıları için env-marker auth'u çözümler            | Sağlayıcının sağlayıcıya ait env-marker API key çözümlemesi varsa; `amazon-bedrock` da burada yerleşik bir AWS env-marker çözücüsüne sahiptir |
| 8   | `resolveSyntheticAuth`            | Düz metni kalıcılaştırmadan yerel/self-hosted veya yapılandırma destekli auth'u yüzeye çıkarır               | Sağlayıcı sentetik/yerel bir kimlik bilgisi işaretçisiyle çalışabiliyorsa                                                                   |
| 9   | `resolveExternalAuthProfiles`     | Sağlayıcıya ait harici auth profillerini bindirir; varsayılan `persistence`, CLI/uygulamaya ait kimlik bilgileri için `runtime-only` olur | Sağlayıcı, kopyalanmış refresh token'ları kalıcılaştırmadan harici auth kimlik bilgilerini yeniden kullanıyorsa                            |
| 10  | `shouldDeferSyntheticProfileAuth` | Saklanan sentetik profil yer tutucularını env/yapılandırma destekli auth'un arkasına düşürür                | Sağlayıcı, önceliği kazanmaması gereken sentetik yer tutucu profilleri saklıyorsa                                                           |
| 11  | `resolveDynamicModel`             | Yerel kayıt defterinde henüz olmayan sağlayıcıya ait model kimlikleri için eşzamanlı geri dönüş sağlar      | Sağlayıcı, üst akıştan gelen keyfi model kimliklerini kabul ediyorsa                                                                         |
| 12  | `prepareDynamicModel`             | Eşzamansız ısındırma yapar, ardından `resolveDynamicModel` yeniden çalışır                                   | Sağlayıcının bilinmeyen kimlikleri çözümlemeden önce ağ meta verisine ihtiyacı varsa                                                        |
| 13  | `normalizeResolvedModel`          | Gömülü runner çözümlenmiş modeli kullanmadan önce son yeniden yazımı yapar                                   | Sağlayıcının taşıma yeniden yazımlarına ihtiyacı varsa ama yine de çekirdek taşıma kullanıyorsa                                             |
| 14  | `contributeResolvedModelCompat`   | Başka bir uyumlu taşımanın arkasındaki satıcı modelleri için uyumluluk bayrakları katkısı sağlar            | Sağlayıcı, sağlayıcıyı devralmadan proxy taşımalarında kendi modellerini tanıyorsa                                                          |
| 15  | `capabilities`                    | Paylaşılan çekirdek mantık tarafından kullanılan sağlayıcıya ait transcript/araç meta verileri               | Sağlayıcının transcript/sağlayıcı ailesi tuhaflıklarına ihtiyacı varsa                                                                       |
| 16  | `normalizeToolSchemas`            | Gömülü runner görmeden önce araç şemalarını normalize eder                                                   | Sağlayıcının taşıma ailesi şema temizliğine ihtiyacı varsa                                                                                  |
| 17  | `inspectToolSchemas`              | Normalizasyondan sonra sağlayıcıya ait şema tanılarını yüzeye çıkarır                                        | Sağlayıcı, çekirdeğe sağlayıcıya özgü kuralları öğretmeden anahtar sözcük uyarıları istiyorsa                                               |
| 18  | `resolveReasoningOutputMode`      | Yerel ve etiketli reasoning-output sözleşmesi arasında seçim yapar                                           | Sağlayıcının yerel alanlar yerine etiketli reasoning/final output'a ihtiyacı varsa                                                          |
| 19  | `prepareExtraParams`              | Genel akış seçeneği sarmalayıcılarından önce istek parametresi normalizasyonu yapar                          | Sağlayıcının varsayılan istek parametrelerine veya sağlayıcı başına parametre temizliğine ihtiyacı varsa                                    |
| 20  | `createStreamFn`                  | Normal akış yolunu tamamen özel bir taşıma ile değiştirir                                                    | Sağlayıcının yalnızca bir sarmalayıcı değil, özel bir wire protocol'e ihtiyacı varsa                                                        |
| 21  | `wrapStreamFn`                    | Genel sarmalayıcılar uygulandıktan sonra akışı sarar                                                         | Sağlayıcının özel taşıma olmadan istek üst bilgisi/gövdesi/model uyumluluk sarmalayıcılarına ihtiyacı varsa                                |
| 22  | `resolveTransportTurnState`       | Yerel dönüş başına taşıma üst bilgileri veya meta veriler ekler                                              | Sağlayıcı, genel taşımaların sağlayıcıya ait yerel dönüş kimliğini göndermesini istiyorsa                                                   |
| 23  | `resolveWebSocketSessionPolicy`   | Yerel WebSocket üst bilgileri veya oturum soğuma ilkesi ekler                                                | Sağlayıcı, genel WS taşımalarının oturum üst bilgilerini veya geri dönüş ilkesini ayarlamasını istiyorsa                                    |
| 24  | `formatApiKey`                    | Auth profili biçimlendiricisi: saklanan profil çalışma zamanındaki `apiKey` dizgesine dönüşür               | Sağlayıcı ek auth meta verisi saklıyor ve özel bir çalışma zamanı token biçimine ihtiyaç duyuyorsa                                          |
| 25  | `refreshOAuth`                    | Özel refresh uç noktaları veya refresh başarısızlık ilkesi için OAuth refresh geçersiz kılması              | Sağlayıcı paylaşılan `pi-ai` yenileyicilerine uymuyorsa                                                                                      |
| 26  | `buildAuthDoctorHint`             | OAuth refresh başarısız olduğunda eklenen onarım ipucunu oluşturur                                           | Sağlayıcının refresh başarısızlığından sonra sağlayıcıya ait auth onarım rehberliğine ihtiyacı varsa                                        |
| 27  | `matchesContextOverflowError`     | Sağlayıcıya ait bağlam penceresi taşması eşleştiricisi                                                       | Sağlayıcının, genel sezgisel yöntemlerin kaçıracağı ham taşma hataları varsa                                                                |
| 28  | `classifyFailoverReason`          | Sağlayıcıya ait failover nedeni sınıflandırması yapar                                                        | Sağlayıcı, ham API/taşıma hatalarını rate-limit/aşırı yük/vb. olarak eşleyebiliyorsa                                                        |
| 29  | `isCacheTtlEligible`              | Proxy/backhaul sağlayıcıları için istem önbelleği TTL ilkesi                                                 | Sağlayıcının proxy'ye özgü önbellek TTL geçitlemesine ihtiyacı varsa                                                                         |
| 30  | `buildMissingAuthMessage`         | Genel eksik-auth kurtarma mesajının yerine geçer                                                             | Sağlayıcının sağlayıcıya özgü eksik-auth kurtarma ipucuna ihtiyacı varsa                                                                     |
| 31  | `suppressBuiltInModel`            | Eski üst akış model bastırması ve isteğe bağlı kullanıcıya dönük hata ipucu                                  | Sağlayıcının eski üst akış satırlarını gizlemesi veya bunları bir satıcı ipucuyla değiştirmesi gerekiyorsa                                  |
| 32  | `augmentModelCatalog`             | Keşiften sonra sentetik/nihai katalog satırları ekler                                                        | Sağlayıcının `models list` ve seçicilerde sentetik ileri uyumluluk satırlarına ihtiyacı varsa                                               |
| 33  | `resolveThinkingProfile`          | Modele özgü `/think` düzey kümesini, görünen etiketleri ve varsayılanı çözümler                             | Sağlayıcı, seçili modeller için özel bir düşünme merdiveni veya ikili etiket sunuyorsa                                                      |
| 34  | `isBinaryThinking`                | Açık/kapalı reasoning anahtarı uyumluluk kancası                                                             | Sağlayıcı yalnızca ikili düşünme açık/kapalı sunuyorsa                                                                                       |
| 35  | `supportsXHighThinking`           | `xhigh` reasoning desteği uyumluluk kancası                                                                  | Sağlayıcı `xhigh` özelliğini yalnızca bir model alt kümesinde istiyorsa                                                                      |
| 36  | `resolveDefaultThinkingLevel`     | Varsayılan `/think` düzeyi uyumluluk kancası                                                                 | Sağlayıcı bir model ailesi için varsayılan `/think` ilkesine sahipse                                                                         |
| 37  | `isModernModelRef`                | Canlı profil filtreleri ve smoke seçimi için modern model eşleştiricisi                                      | Sağlayıcı canlı/smoke tercihli model eşleştirmesine sahipse                                                                                 |
| 38  | `prepareRuntimeAuth`              | Çıkarımdan hemen önce yapılandırılmış bir kimlik bilgisini gerçek çalışma zamanı token'ına/anahtarına dönüştürür | Sağlayıcının bir token değişimine veya kısa ömürlü istek kimlik bilgisine ihtiyacı varsa                                                   |
| 39  | `resolveUsageAuth`                | `/usage` ve ilgili durum yüzeyleri için kullanım/faturalama kimlik bilgilerini çözümler                       | Sağlayıcının özel kullanım/kota token ayrıştırmasına veya farklı bir kullanım kimlik bilgisine ihtiyacı varsa                              |
| 40  | `fetchUsageSnapshot`              | Auth çözümlendikten sonra sağlayıcıya özgü kullanım/kota anlık görüntülerini getirir ve normalize eder       | Sağlayıcının sağlayıcıya özgü bir kullanım uç noktasına veya yük ayrıştırıcısına ihtiyacı varsa                                            |
| 41  | `createEmbeddingProvider`         | bellek/arama için sağlayıcıya ait bir embedding adaptörü oluşturur                                            | Bellek embedding davranışı sağlayıcı Plugin'i ile birlikte yaşamalıdır                                                                      |
| 42  | `buildReplayPolicy`               | Sağlayıcı için transcript işlemeyi kontrol eden bir replay ilkesi döndürür                                    | Sağlayıcının özel transcript ilkesine ihtiyacı varsa (örneğin, düşünme bloklarını ayıklama)                                               |
| 43  | `sanitizeReplayHistory`           | Genel transcript temizliğinden sonra replay geçmişini yeniden yazar                                           | Sağlayıcının paylaşılan Compaction yardımcılarının ötesinde sağlayıcıya özgü replay yeniden yazımlarına ihtiyacı varsa                    |
| 44  | `validateReplayTurns`             | Gömülü runner öncesi son replay dönüşü doğrulamasını veya yeniden şekillendirmesini yapar                    | Sağlayıcı taşımasının genel temizlemeden sonra daha sıkı dönüş doğrulamasına ihtiyacı varsa                                                |
| 45  | `onModelSelected`                 | Model etkin olduğunda sağlayıcıya ait seçim sonrası yan etkileri çalıştırır                                   | Sağlayıcının bir model etkinleştiğinde telemetriye veya sağlayıcıya ait duruma ihtiyacı varsa                                             |

`normalizeModelId`, `normalizeTransport` ve `normalizeConfig` önce eşleşen
sağlayıcı Plugin'ini denetler, ardından model kimliğini veya taşıma/yapılandırmayı gerçekten değiştirene kadar
kanca destekli diğer sağlayıcı Plugin'lerine düşer. Bu, çağıranın
hangi paketlenmiş Plugin'in yeniden yazmaya sahip olduğunu bilmesini gerektirmeden
takma ad/uyumluluk sağlayıcı shim'lerini çalışır durumda tutar. Hiçbir sağlayıcı kancası desteklenen bir
Google ailesi yapılandırma girdisini yeniden yazmazsa, paketlenmiş Google yapılandırma normalleştiricisi yine de
bu uyumluluk temizliğini uygular.

Sağlayıcının tamamen özel bir wire protocol'e veya özel bir istek yürütücüsüne ihtiyacı varsa,
bu farklı bir extension sınıfıdır. Bu kancalar, hâlâ OpenClaw'ın
normal çıkarım döngüsünde çalışan sağlayıcı davranışı içindir.

### Sağlayıcı örneği

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Yerleşik örnekler

- Anthropic; `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveThinkingProfile`, `applyConfigDefaults`, `isModernModelRef`
  ve `wrapStreamFn` kullanır çünkü Claude 4.6 ileri uyumluluğuna,
  sağlayıcı ailesi ipuçlarına, auth onarım rehberliğine, kullanım uç noktası entegrasyonuna,
  istem önbelleği uygunluğuna, auth farkındalıklı yapılandırma varsayılanlarına, Claude
  varsayılan/uyarlanabilir düşünme ilkesine ve beta üst bilgileri,
  `/fast` / `serviceTier` ve `context1m` için Anthropic'e özgü akış şekillendirmeye sahiptir.
- Anthropic'in Claude'a özgü akış yardımcıları şimdilik paketlenmiş Plugin'in kendi
  genel `api.ts` / `contract-api.ts` sınırında kalır. Bu paket yüzeyi,
  genel SDK'yi tek bir
  sağlayıcının beta-header kuralları etrafında genişletmek yerine `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` ve daha düşük düzeyli
  Anthropic sarmalayıcı oluşturucuları export eder.
- OpenAI; `resolveDynamicModel`, `normalizeResolvedModel` ve
  `capabilities` ile birlikte `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `resolveThinkingProfile` ve `isModernModelRef`
  kullanır çünkü GPT-5.4 ileri uyumluluğuna, doğrudan OpenAI
  `openai-completions` -> `openai-responses` normalizasyonuna, Codex farkındalıklı auth
  ipuçlarına, Spark bastırmasına, sentetik OpenAI liste satırlarına ve GPT-5 düşünme /
  canlı model ilkesine sahiptir; `openai-responses-defaults` akış ailesi ise
  attribution header'ları, `/fast`/`serviceTier`, metin ayrıntı düzeyi, yerel Codex web araması,
  reasoning uyumluluk yük şekillendirmesi ve Responses bağlam yönetimi için
  paylaşılan yerel OpenAI Responses sarmalayıcılarına sahiptir.
- OpenRouter; `catalog` ile birlikte `resolveDynamicModel` ve
  `prepareDynamicModel` kullanır çünkü sağlayıcı pass-through'dur ve OpenClaw'ın statik kataloğu güncellenmeden önce
  yeni model kimliklerini açığa çıkarabilir; ayrıca sağlayıcıya özgü istek üst bilgilerini, yönlendirme meta verilerini, reasoning yamalarını ve
  istem önbelleği ilkesini çekirdeğin dışında tutmak için
  `capabilities`, `wrapStreamFn` ve `isCacheTtlEligible` kullanır. Replay ilkesi
  `passthrough-gemini` ailesinden gelirken, `openrouter-thinking` akış ailesi
  proxy reasoning eklemeyi ve desteklenmeyen model / `auto` atlamalarını sahiplenir.
- GitHub Copilot; `catalog`, `auth`, `resolveDynamicModel` ve
  `capabilities` ile birlikte `prepareRuntimeAuth` ve `fetchUsageSnapshot` kullanır çünkü
  sağlayıcıya ait cihaz oturum açmaya, model geri dönüş davranışına, Claude transcript
  tuhaflıklarına, GitHub token -> Copilot token değişimine ve sağlayıcıya ait bir kullanım
  uç noktasına ihtiyaç duyar.
- OpenAI Codex; `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` ve `augmentModelCatalog` ile birlikte
  `prepareExtraParams`, `resolveUsageAuth` ve `fetchUsageSnapshot` kullanır çünkü
  hâlâ çekirdek OpenAI taşımalarında çalışır ama taşıma/base URL
  normalizasyonuna, OAuth refresh geri dönüş ilkesine, varsayılan taşıma seçimine,
  sentetik Codex katalog satırlarına ve ChatGPT kullanım uç noktası entegrasyonuna sahiptir; doğrudan OpenAI ile
  aynı `openai-responses-defaults` akış ailesini paylaşır.
- Google AI Studio ve Gemini CLI OAuth; `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` ve `isModernModelRef` kullanır çünkü
  `google-gemini` replay ailesi Gemini 3.1 ileri uyumluluk geri dönüşüne,
  yerel Gemini replay doğrulamasına, bootstrap replay temizliğine, etiketli
  reasoning-output moduna ve modern model eşleştirmeye sahiptir; `google-thinking`
  akış ailesi ise Gemini düşünme yükü normalizasyonuna sahiptir.
  Gemini CLI OAuth ayrıca token biçimlendirme, token ayrıştırma ve kota uç noktası
  bağlantısı için `formatApiKey`, `resolveUsageAuth` ve
  `fetchUsageSnapshot` kullanır.
- Anthropic Vertex, `buildReplayPolicy` işlevini
  `anthropic-by-model` replay ailesi üzerinden kullanır; böylece Claude'a özgü replay temizliği
  her `anthropic-messages` taşımasına değil, Claude kimliklerine kapsamlı kalır.
- Amazon Bedrock; `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` ve `resolveThinkingProfile` kullanır çünkü
  Anthropic-on-Bedrock trafiği için Bedrock'a özgü throttle/not-ready/context-overflow hata sınıflandırmasına
  sahiptir; replay ilkesi yine de aynı
  yalnızca Claude `anthropic-by-model` korumasını paylaşır.
- OpenRouter, Kilocode, Opencode ve Opencode Go; `buildReplayPolicy`
  işlevini `passthrough-gemini` replay ailesi üzerinden kullanır çünkü Gemini
  modellerini OpenAI uyumlu taşımalar üzerinden proxy'lerler ve yerel Gemini replay doğrulaması veya
  bootstrap yeniden yazımları olmadan Gemini
  düşünce imzası temizliğine ihtiyaç duyarlar.
- MiniMax; `buildReplayPolicy` işlevini
  `hybrid-anthropic-openai` replay ailesi üzerinden kullanır çünkü bir sağlayıcı hem
  Anthropic-message hem de OpenAI uyumlu semantiğe sahiptir; Anthropic tarafında yalnızca Claude'a ait
  düşünme bloğu bırakmayı korurken reasoning
  çıktı modunu yeniden yerel moda geçirir ve `minimax-fast-mode` akış ailesi paylaşılan akış yolunda
  fast-mode model yeniden yazımlarına sahiptir.
- Moonshot; `catalog`, `resolveThinkingProfile` ve `wrapStreamFn` kullanır çünkü hâlâ paylaşılan
  OpenAI taşımasını kullanır ama sağlayıcıya ait düşünme yükü normalizasyonuna ihtiyaç duyar; `moonshot-thinking`
  akış ailesi yapılandırma ile `/think` durumunu
  yerel ikili düşünme yüküne eşler.
- Kilocode; `catalog`, `capabilities`, `wrapStreamFn` ve
  `isCacheTtlEligible` kullanır çünkü sağlayıcıya ait istek üst bilgilerine,
  reasoning yükü normalizasyonuna, Gemini transcript ipuçlarına ve Anthropic
  önbellek TTL geçitlemesine ihtiyaç duyar; `kilocode-thinking` akış ailesi ise `kilo/auto` ve
  açık reasoning yüklerini desteklemeyen diğer proxy model kimliklerini atlayarak paylaşılan proxy akış yolunda
  Kilo düşünme eklemesini tutar.
- Z.AI; `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `resolveThinkingProfile`, `isModernModelRef`,
  `resolveUsageAuth` ve `fetchUsageSnapshot` kullanır çünkü GLM-5 geri dönüşüne,
  `tool_stream` varsayılanlarına, ikili düşünme UX'ine, modern model eşleştirmeye ve hem
  kullanım auth'u hem kota getirmeye sahiptir; `tool-stream-default-on` akış ailesi ise
  varsayılan açık `tool_stream` sarmalayıcısını sağlayıcı başına elle yazılmış yapıştırma kodunun dışında tutar.
- xAI; `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` ve `isModernModelRef`
  kullanır çünkü yerel xAI Responses taşıma normalizasyonuna, Grok fast-mode
  takma ad yeniden yazımlarına, varsayılan `tool_stream` değerine, strict-tool / reasoning yükü
  temizliğine, Plugin'e ait araçlar için geri dönüş auth yeniden kullanımına, ileri uyumlu Grok
  model çözümlemesine ve xAI araç-şema
  profili, desteklenmeyen şema anahtar sözcükleri, yerel `web_search` ve HTML entity
  araç çağrısı bağımsız değişken çözümleme gibi sağlayıcıya ait uyumluluk yamalarına sahiptir.
- Mistral, OpenCode Zen ve OpenCode Go; transcript/araç
  tuhaflıklarını çekirdeğin dışında tutmak için yalnızca `capabilities` kullanır.
- `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` ve `volcengine` gibi yalnızca katalog kullanan
  paketlenmiş sağlayıcılar yalnızca `catalog` kullanır.
- Qwen, metin sağlayıcısı için `catalog` ile birlikte
  çok modlu yüzeyleri için paylaşılan medya anlama ve
  video oluşturma kayıtlarını kullanır.
- MiniMax ve Xiaomi, çıkarım hâlâ paylaşılan
  taşımalar üzerinden çalışsa bile `/usage`
  davranışları Plugin'e ait olduğu için `catalog` ile birlikte kullanım kancalarını kullanır.

## Çalışma zamanı yardımcıları

Plugin'ler seçilmiş çekirdek yardımcılarına `api.runtime` üzerinden erişebilir. TTS için:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Notlar:

- `textToSpeech`, dosya/sesli not yüzeyleri için normal çekirdek TTS çıktı yükünü döndürür.
- Çekirdek `messages.tts` yapılandırmasını ve sağlayıcı seçimini kullanır.
- PCM ses arabelleği + örnekleme hızı döndürür. Plugin'ler sağlayıcılar için yeniden örneklemeli/kodlamalıdır.
- `listVoices`, sağlayıcı başına isteğe bağlıdır. Bunu satıcıya ait ses seçiciler veya kurulum akışları için kullanın.
- Ses listeleri, sağlayıcı farkındalıklı seçiciler için locale, cinsiyet ve kişilik etiketleri gibi daha zengin meta veriler içerebilir.
- OpenAI ve ElevenLabs bugün telefon desteği sunar. Microsoft sunmaz.

Plugin'ler ayrıca `api.registerSpeechProvider(...)` ile konuşma sağlayıcıları kaydedebilir.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Notlar:

- TTS ilkesini, geri dönüşü ve yanıt teslimini çekirdekte tutun.
- Satıcıya ait sentez davranışı için konuşma sağlayıcılarını kullanın.
- Eski Microsoft `edge` girdisi `microsoft` sağlayıcı kimliğine normalize edilir.
- Tercih edilen sahiplik modeli şirket odaklıdır: tek bir satıcı Plugin'i
  OpenClaw bu yetenek sözleşmelerini ekledikçe
  metin, konuşma, görsel ve gelecekteki medya sağlayıcılarına sahip olabilir.

Görsel/ses/video anlama için Plugin'ler genel bir anahtar/değer çantası yerine
tek bir tipli medya anlama sağlayıcısı kaydeder:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Notlar:

- Orkestrasyonu, geri dönüşü, yapılandırmayı ve kanal bağlantılarını çekirdekte tutun.
- Satıcı davranışını sağlayıcı Plugin'inde tutun.
- Eklemeli genişleme tipli kalmalıdır: yeni isteğe bağlı yöntemler, yeni isteğe bağlı
  sonuç alanları, yeni isteğe bağlı yetenekler.
- Video oluşturma zaten aynı deseni izler:
  - çekirdek yetenek sözleşmesine ve çalışma zamanı yardımcısına sahiptir
  - satıcı Plugin'leri `api.registerVideoGenerationProvider(...)` kaydeder
  - özellik/kanal Plugin'leri `api.runtime.videoGeneration.*` tüketir

Medya anlama çalışma zamanı yardımcıları için Plugin'ler şunu çağırabilir:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

Ses transkripsiyonu için Plugin'ler ya medya anlama çalışma zamanını
ya da eski STT takma adını kullanabilir:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // MIME güvenilir şekilde çıkarılamadığında isteğe bağlı:
  mime: "audio/ogg",
});
```

Notlar:

- `api.runtime.mediaUnderstanding.*`, görsel/ses/video anlama için
  tercih edilen paylaşılan yüzeydir.
- Çekirdek medya anlama ses yapılandırmasını (`tools.media.audio`) ve sağlayıcı geri dönüş sırasını kullanır.
- Transkripsiyon çıktısı üretilmediğinde `{ text: undefined }` döndürür (örneğin atlanan/desteklenmeyen girdi).
- `api.runtime.stt.transcribeAudioFile(...)`, uyumluluk takma adı olarak kalır.

Plugin'ler ayrıca `api.runtime.subagent` üzerinden arka plan alt ajan çalıştırmaları başlatabilir:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Bu sorguyu odaklı takip aramalarına genişlet.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Notlar:

- `provider` ve `model`, kalıcı oturum değişiklikleri değil, çalıştırma başına isteğe bağlı geçersiz kılmalardır.
- OpenClaw bu geçersiz kılma alanlarını yalnızca güvenilir çağıranlar için dikkate alır.
- Plugin'e ait geri dönüş çalıştırmaları için operator'lerin `plugins.entries.<id>.subagent.allowModelOverride: true` ile açık katılım yapması gerekir.
- Güvenilir Plugin'leri belirli kanonik `provider/model` hedefleriyle sınırlamak için `plugins.entries.<id>.subagent.allowedModels` kullanın ya da herhangi bir hedefe açıkça izin vermek için `"*"` kullanın.
- Güvenilmeyen Plugin alt ajan çalıştırmaları yine de çalışır, ancak geçersiz kılma istekleri sessizce geri düşmek yerine reddedilir.

Web arama için Plugin'ler, ajan araç bağlantısına
doğrudan ulaşmak yerine paylaşılan çalışma zamanı yardımcısını tüketebilir:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Plugin'ler ayrıca
`api.registerWebSearchProvider(...)` ile web arama sağlayıcıları da kaydedebilir.

Notlar:

- Sağlayıcı seçimini, kimlik bilgisi çözümlemesini ve paylaşılan istek semantiğini çekirdekte tutun.
- Satıcıya özgü arama taşımaları için web arama sağlayıcılarını kullanın.
- `api.runtime.webSearch.*`, ajan araç sarmalayıcısına bağlı olmadan arama davranışına ihtiyaç duyan özellik/kanal Plugin'leri için tercih edilen paylaşılan yüzeydir.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "Dost canlısı bir ıstakoz maskot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: yapılandırılmış görsel oluşturma sağlayıcı zincirini kullanarak bir görsel oluşturur.
- `listProviders(...)`: kullanılabilir görsel oluşturma sağlayıcılarını ve yeteneklerini listeler.

## Gateway HTTP rotaları

Plugin'ler `api.registerHttpRoute(...)` ile HTTP uç noktaları açığa çıkarabilir.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Rota alanları:

- `path`: gateway HTTP sunucusu altındaki rota yolu.
- `auth`: zorunlu. Normal gateway kimlik doğrulaması istemek için `"gateway"` ya da Plugin tarafından yönetilen auth/Webhook doğrulaması için `"plugin"` kullanın.
- `match`: isteğe bağlı. `"exact"` (varsayılan) veya `"prefix"`.
- `replaceExisting`: isteğe bağlı. Aynı Plugin'in kendi mevcut rota kaydını değiştirmesine izin verir.
- `handler`: rota isteği işlediğinde `true` döndürmelidir.

Notlar:

- `api.registerHttpHandler(...)` kaldırıldı ve Plugin yükleme hatasına neden olur. Bunun yerine `api.registerHttpRoute(...)` kullanın.
- Plugin rotaları `auth` değerini açıkça bildirmelidir.
- Tam `path + match` çakışmaları `replaceExisting: true` olmadıkça reddedilir ve bir Plugin başka bir Plugin'in rotasını değiştiremez.
- Farklı `auth` düzeylerine sahip çakışan rotalar reddedilir. `exact`/`prefix` fallthrough zincirlerini yalnızca aynı auth düzeyinde tutun.
- `auth: "plugin"` rotaları **otomatik olarak** operator çalışma zamanı kapsamlarını almaz. Bunlar ayrıcalıklı Gateway yardımcı çağrıları için değil, Plugin tarafından yönetilen Webhook/signature doğrulaması içindir.
- `auth: "gateway"` rotaları bir Gateway istek çalışma zamanı kapsamı içinde çalışır, ancak bu kapsam kasıtlı olarak muhafazakârdır:
  - paylaşılan gizli bearer auth (`gateway.auth.mode = "token"` / `"password"`), çağıran `x-openclaw-scopes` gönderse bile Plugin rota çalışma zamanı kapsamlarını `operator.write` değerine sabitler
  - güvenilir kimlik taşıyan HTTP modları (örneğin `trusted-proxy` veya özel girişte `gateway.auth.mode = "none"`), `x-openclaw-scopes` değerini yalnızca üst bilgi açıkça mevcut olduğunda dikkate alır
  - bu kimlik taşıyan Plugin rota isteklerinde `x-openclaw-scopes` yoksa çalışma zamanı kapsamı `operator.write` değerine geri düşer
- Pratik kural: gateway-auth kullanan bir Plugin rotasının örtük admin yüzeyi olduğunu varsaymayın. Rotanız admin-only davranış gerektiriyorsa, kimlik taşıyan bir auth modu zorunlu kılın ve açık `x-openclaw-scopes` üst bilgi sözleşmesini belgeleyin.

## Plugin SDK import yolları

Plugin yazarken tek parça `openclaw/plugin-sdk` import'u yerine
SDK alt yollarını kullanın:

- Plugin kayıt ilkelleri için `openclaw/plugin-sdk/plugin-entry`.
- Genel paylaşılan Plugin'e dönük sözleşme için `openclaw/plugin-sdk/core`.
- Kök `openclaw.json` Zod şema
  export'u (`OpenClawSchema`) için `openclaw/plugin-sdk/config-schema`.
- `openclaw/plugin-sdk/channel-setup`,
  `openclaw/plugin-sdk/setup-runtime`,
  `openclaw/plugin-sdk/setup-adapter-runtime`,
  `openclaw/plugin-sdk/setup-tools`,
  `openclaw/plugin-sdk/channel-pairing`,
  `openclaw/plugin-sdk/channel-contract`,
  `openclaw/plugin-sdk/channel-feedback`,
  `openclaw/plugin-sdk/channel-inbound`,
  `openclaw/plugin-sdk/channel-lifecycle`,
  `openclaw/plugin-sdk/channel-reply-pipeline`,
  `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/secret-input` ve
  `openclaw/plugin-sdk/webhook-ingress` gibi kararlı kanal ilkellerini; paylaşılan kurulum/auth/yanıt/Webhook
  bağlantısı için kullanın. `channel-inbound`; debounce, mention eşleme,
  gelen mention ilkesi yardımcıları, zarf biçimlendirme ve gelen zarf
  bağlam yardımcıları için paylaşılan ana yerdir.
  `channel-setup`, dar isteğe bağlı kurulum sınırıdır.
  `setup-runtime`, `setupEntry` /
  ertelenmiş başlangıç tarafından kullanılan, import açısından güvenli kurulum yama adaptörlerini içeren çalışma zamanı güvenli kurulum yüzeyidir.
  `setup-adapter-runtime`, env farkındalıklı hesap kurulum adaptörü sınırıdır.
  `setup-tools`, küçük CLI/archive/docs yardımcı sınırıdır (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
  `openclaw/plugin-sdk/approval-gateway-runtime`,
  `openclaw/plugin-sdk/approval-handler-adapter-runtime`,
  `openclaw/plugin-sdk/approval-handler-runtime`,
  `openclaw/plugin-sdk/approval-runtime`,
  `openclaw/plugin-sdk/config-runtime`,
  `openclaw/plugin-sdk/infra-runtime`,
  `openclaw/plugin-sdk/agent-runtime`,
  `openclaw/plugin-sdk/lazy-runtime`,
  `openclaw/plugin-sdk/reply-history`,
  `openclaw/plugin-sdk/routing`,
  `openclaw/plugin-sdk/status-helpers`,
  `openclaw/plugin-sdk/text-runtime`,
  `openclaw/plugin-sdk/runtime-store` ve
  `openclaw/plugin-sdk/directory-runtime` gibi alan alt yollarını; paylaşılan çalışma zamanı/yapılandırma yardımcıları için kullanın.
  `telegram-command-config`, Telegram özel
  komut normalizasyonu/doğrulaması için dar genel sınırdır ve paketlenmiş
  Telegram sözleşme yüzeyi geçici olarak kullanılamasa bile erişilebilir kalır.
  `text-runtime`, asistan görünür metin ayıklama, markdown render/parçalama yardımcıları, redaksiyon
  yardımcıları, yönerge etiketi yardımcıları ve güvenli metin yardımcıları dahil olmak üzere
  paylaşılan metin/markdown/günlükleme sınırıdır.
- Onaya özgü kanal sınırları, Plugin üzerinde tek bir `approvalCapability`
  sözleşmesini tercih etmelidir. Çekirdek daha sonra onay auth'unu, teslimini, render'ını,
  yerel yönlendirmeyi ve lazy yerel işleyici davranışını onay davranışını alakasız Plugin alanlarına karıştırmak yerine
  bu tek yetenek üzerinden okur.
- `openclaw/plugin-sdk/channel-runtime` kullanımdan kaldırılmıştır ve yalnızca eski Plugin'ler için
  uyumluluk shim'i olarak kalır. Yeni kod bunun yerine daha dar
  genel ilkelleri import etmelidir ve depo kodu shim'e yeni import'lar eklememelidir.
- Paketlenmiş extension iç yapıları özel kalır. Harici Plugin'ler yalnızca
  `openclaw/plugin-sdk/*` alt yollarını kullanmalıdır. OpenClaw çekirdek/test kodu,
  `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` ve `login-qr-api.js`
  gibi dar kapsamlı dosyalar gibi bir Plugin paket kökü altındaki depo genel giriş noktalarını kullanabilir.
  Çekirdekten veya başka bir extension'dan asla bir Plugin paketinin `src/*` yolunu import etmeyin.
- Depo giriş noktası ayrımı:
  `<plugin-package-root>/api.js` yardımcı/türler barrel'ıdır,
  `<plugin-package-root>/runtime-api.js` yalnızca çalışma zamanı barrel'ıdır,
  `<plugin-package-root>/index.js` paketlenmiş Plugin girişidir,
  ve `<plugin-package-root>/setup-entry.js` kurulum Plugin girişidir.
- Geçerli paketlenmiş sağlayıcı örnekleri:
  - Anthropic, `wrapAnthropicProviderStream`, beta-header yardımcıları ve `service_tier`
    ayrıştırması gibi Claude akış yardımcıları için `api.js` / `contract-api.js` kullanır.
  - OpenAI, sağlayıcı oluşturucular, varsayılan model yardımcıları ve
    gerçek zamanlı sağlayıcı oluşturucular için `api.js` kullanır.
  - OpenRouter, sağlayıcı oluşturucusu ile onboarding/config
    yardımcıları için `api.js` kullanırken, `register.runtime.js` depo içi kullanım için genel
    `plugin-sdk/provider-stream` yardımcılarını yine de yeniden export edebilir.
- Facade ile yüklenen genel giriş noktaları, mevcut olduğunda etkin çalışma zamanı yapılandırma anlık görüntüsünü tercih eder;
  ardından OpenClaw henüz çalışma zamanı anlık görüntüsü sunmuyorsa disk üzerindeki çözümlenmiş yapılandırma dosyasına geri düşer.
- Genel paylaşılan ilkeller, tercih edilen genel SDK sözleşmesi olmaya devam eder. Paketlenmiş kanal markalı küçük
  ayrılmış bir uyumluluk yardımcı sınırları kümesi hâlâ mevcuttur. Bunları
  yeni üçüncü taraf import hedefleri olarak değil, paketlenmiş bakım/uyumluluk sınırları olarak değerlendirin;
  yeni kanallar arası sözleşmeler yine de genel `plugin-sdk/*` alt yollarına veya Plugin yerel `api.js` /
  `runtime-api.js` barrel'larına inmelidir.

Uyumluluk notu:

- Yeni kod için kök `openclaw/plugin-sdk` barrel'ından kaçının.
- Önce dar ve kararlı ilkelleri tercih edin. Daha yeni setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool alt yolları; yeni paketlenmiş ve harici Plugin çalışmaları için
  amaçlanan sözleşmedir.
  Hedef ayrıştırma/eşleme `openclaw/plugin-sdk/channel-targets` üzerinde olmalıdır.
  Mesaj eylemi geçitleri ve tepki message-id yardımcıları ise
  `openclaw/plugin-sdk/channel-actions` üzerinde olmalıdır.
- Paketlenmiş extension'a özgü yardımcı barrel'lar varsayılan olarak kararlı değildir. Bir
  yardımcı yalnızca paketlenmiş bir extension tarafından gerekiyorsa, onu
  `openclaw/plugin-sdk/<extension>` içine yükseltmek yerine extension'ın
  yerel `api.js` veya `runtime-api.js` sınırının arkasında tutun.
- Yeni paylaşılan yardımcı sınırları kanal markalı değil, genel olmalıdır. Paylaşılan hedef
  ayrıştırma `openclaw/plugin-sdk/channel-targets` üzerinde olmalıdır; kanala özgü
  iç yapılar ise sahibi olan Plugin'in yerel `api.js` veya `runtime-api.js`
  sınırının arkasında kalmalıdır.
- `image-generation`,
  `media-understanding` ve `speech` gibi yeteneğe özgü alt yollar vardır çünkü paketlenmiş/yerel Plugin'ler
  bunları bugün kullanır. Bunların varlığı tek başına export edilen her yardımcının
  uzun vadeli dondurulmuş bir harici sözleşme olduğu anlamına gelmez.

## Mesaj aracı şemaları

Plugin'ler tepkiler, okumalar ve anketler gibi mesaj olmayan ilkeller için
kanala özgü `describeMessageTool(...)` şema
katkılarına sahip olmalıdır. Paylaşılan gönderim sunumu, sağlayıcıya özgü düğme, bileşen, blok veya kart alanları yerine
genel `MessagePresentation` sözleşmesini kullanmalıdır.
Sözleşme, geri dönüş kuralları, sağlayıcı eşlemesi ve Plugin yazarı kontrol listesi için
bkz. [Message Presentation](/tr/plugins/message-presentation).

Gönderim yapabilen Plugin'ler, mesaj yetenekleri üzerinden neyi render edebileceklerini bildirir:

- semantik sunum blokları için `presentation` (`text`, `context`, `divider`, `buttons`, `select`)
- sabitlenmiş teslim istekleri için `delivery-pin`

Çekirdek, sunumu yerel olarak render edip etmeyeceğine veya metne indirgemeye karar verir.
Genel mesaj aracından sağlayıcıya özgü yerel UI kaçış kapılarını açığa çıkarmayın.
Eski yerel şemalar için kullanımdan kaldırılmış SDK yardımcıları mevcut
üçüncü taraf Plugin'ler için export edilmeye devam eder, ancak yeni Plugin'ler bunları kullanmamalıdır.

## Kanal hedef çözümlemesi

Kanal Plugin'leri kanala özgü hedef semantiğine sahip olmalıdır. Paylaşılan
giden host'u genel tutun ve sağlayıcı kuralları için mesajlaşma adaptörü yüzeyini kullanın:

- `messaging.inferTargetChatType({ to })`, normalize edilmiş bir hedefin
  dizin aramasından önce `direct`, `group` veya `channel` olarak ele alınıp alınmayacağına karar verir.
- `messaging.targetResolver.looksLikeId(raw, normalized)`, çekirdeğe
  bir girdinin dizin araması yerine doğrudan kimlik benzeri çözümlemeye atlaması gerekip gerekmediğini bildirir.
- `messaging.targetResolver.resolveTarget(...)`, çekirdek normalizasyondan sonra veya
  dizin kaçırmasından sonra son bir sağlayıcıya ait çözümlemeye ihtiyaç duyduğunda kullanılan Plugin geri dönüşüdür.
- `messaging.resolveOutboundSessionRoute(...)`, bir hedef çözümlendikten sonra sağlayıcıya özgü oturum
  rota inşasına sahiptir.

Önerilen ayrım:

- peer/group aramasından önce gerçekleşmesi gereken kategori kararları için `inferTargetChatType` kullanın.
- "bunu açık/yerel hedef kimliği olarak ele al" denetimleri için `looksLikeId` kullanın.
- Geniş dizin araması için değil, sağlayıcıya özgü normalizasyon geri dönüşü için `resolveTarget` kullanın.
- chat id, thread id, JID, handle ve room id gibi sağlayıcıya özgü yerel kimlikleri
  genel SDK alanlarında değil, `target` değerleri veya sağlayıcıya özgü parametreler içinde tutun.

## Yapılandırma destekli dizinler

Yapılandırmadan dizin girdileri türeten Plugin'ler bu mantığı
Plugin içinde tutmalı ve
`openclaw/plugin-sdk/directory-runtime` içindeki paylaşılan yardımcıları yeniden kullanmalıdır.

Bunu, bir kanal yapılandırma destekli peer/group'lara ihtiyaç duyduğunda kullanın; örneğin:

- izin listesi güdümlü DM peer'leri
- yapılandırılmış kanal/group eşlemeleri
- hesap kapsamlı statik dizin geri dönüşleri

`directory-runtime` içindeki paylaşılan yardımcılar yalnızca genel işlemleri ele alır:

- sorgu filtreleme
- sınır uygulama
- tekilleştirme/normalizasyon yardımcıları
- `ChannelDirectoryEntry[]` oluşturma

Kanala özgü hesap incelemesi ve kimlik normalizasyonu
Plugin uygulamasında kalmalıdır.

## Sağlayıcı katalogları

Sağlayıcı Plugin'leri çıkarım için
`registerProvider({ catalog: { run(...) { ... } } })` ile model katalogları tanımlayabilir.

`catalog.run(...)`, OpenClaw'ın
`models.providers` içine yazdığıyla aynı biçimi döndürür:

- bir sağlayıcı girdisi için `{ provider }`
- birden çok sağlayıcı girdisi için `{ providers }`

Plugin sağlayıcıya özgü model kimliklerine, base URL varsayılanlarına veya auth geçitli model meta verilerine sahipse
`catalog` kullanın.

`catalog.order`, bir Plugin'in kataloğunun OpenClaw'ın
yerleşik örtük sağlayıcılarına göre ne zaman birleştirileceğini kontrol eder:

- `simple`: düz API key veya env odaklı sağlayıcılar
- `profile`: auth profilleri mevcut olduğunda görünen sağlayıcılar
- `paired`: birden çok ilişkili sağlayıcı girdisi sentezleyen sağlayıcılar
- `late`: diğer örtük sağlayıcılardan sonra son geçiş

Daha sonraki sağlayıcılar anahtar çakışmasında kazanır; böylece Plugin'ler aynı sağlayıcı kimliğine sahip
yerleşik bir sağlayıcı girdisini kasıtlı olarak geçersiz kılabilir.

Uyumluluk:

- `discovery` eski bir takma ad olarak hâlâ çalışır
- hem `catalog` hem `discovery` kaydedilirse OpenClaw `catalog` kullanır

## Salt okunur kanal inceleme

Plugin'iniz bir kanal kaydediyorsa, `resolveAccount(...)` ile birlikte
`plugin.config.inspectAccount(cfg, accountId)` uygulamayı tercih edin.

Neden:

- `resolveAccount(...)` çalışma zamanı yoludur. Kimlik bilgilerinin
  tamamen somutlaştırıldığını varsayabilir ve gerekli gizliler eksik olduğunda hızlıca başarısız olabilir.
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` ve doctor/config
  onarım akışları gibi salt okunur komut yolları, yapılandırmayı betimlemek için çalışma zamanı kimlik bilgilerini
  somutlaştırmak zorunda kalmamalıdır.

Önerilen `inspectAccount(...)` davranışı:

- Yalnızca açıklayıcı hesap durumu döndürün.
- `enabled` ve `configured` alanlarını koruyun.
- Uygun olduğunda aşağıdaki gibi kimlik bilgisi kaynağı/durum alanlarını dahil edin:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Salt okunur kullanılabilirliği bildirmek için ham token değerleri döndürmeniz gerekmez.
  `tokenStatus: "available"` döndürmek (ve eşleşen kaynak
  alanı) durum tarzı komutlar için yeterlidir.
- Bir kimlik bilgisi SecretRef aracılığıyla yapılandırılmış ancak
  geçerli komut yolunda kullanılamıyorsa `configured_unavailable` kullanın.

Bu, salt okunur komutların hesabı yapılandırılmamış olarak
çökmeden veya yanlış bildirmeden "yapılandırılmış ama bu komut yolunda kullanılamıyor" şeklinde raporlamasını sağlar.

## Paket paketleri

Bir Plugin dizini, `openclaw.extensions` içeren bir `package.json` dosyası içerebilir:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Her girdi bir Plugin olur. Paket birden çok extension listeliyorsa, Plugin kimliği
`name/<fileBase>` olur.

Plugin'iniz npm bağımlılıkları import ediyorsa,
`node_modules` kullanılabilir olsun diye bunları o dizinde kurun (`npm install` / `pnpm install`).

Güvenlik korkuluğu: her `openclaw.extensions` girdisi symlink çözümlemesinden sonra
Plugin dizini içinde kalmalıdır. Paket dizininden kaçan girdiler
reddedilir.

Güvenlik notu: `openclaw plugins install`, Plugin bağımlılıklarını
`npm install --omit=dev --ignore-scripts` ile kurar (yaşam döngüsü betiği yok, çalışma zamanında dev bağımlılığı yok). Plugin bağımlılık
ağaçlarını "saf JS/TS" tutun ve `postinstall` derlemeleri gerektiren paketlerden kaçının.

İsteğe bağlı: `openclaw.setupEntry`, hafif bir yalnızca kurulum modülüne işaret edebilir.
OpenClaw devre dışı bir kanal Plugin'i için kurulum yüzeylerine ihtiyaç duyduğunda veya
bir kanal Plugin'i etkin ama hâlâ yapılandırılmamış olduğunda, tam Plugin girdisi yerine
`setupEntry` yükler. Bu, ana Plugin girdiniz araçları, hook'ları veya diğer yalnızca çalışma zamanı
kodlarını da bağladığında başlangıç ve kurulumu daha hafif tutar.

İsteğe bağlı:
`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`, bir kanal Plugin'ini gateway'in
dinleme öncesi başlangıç aşamasında aynı `setupEntry` yoluna dahil edebilir; kanal zaten yapılandırılmış olsa bile.

Bunu yalnızca `setupEntry`, gateway dinlemeye başlamadan
önce var olması gereken başlangıç yüzeyini tamamen kapsıyorsa kullanın. Pratikte bu, kurulum girdisinin
başlangıcın bağlı olduğu her kanala ait yeteneği kaydetmesi gerektiği anlamına gelir; örneğin:

- kanal kaydının kendisi
- gateway dinlemeye başlamadan önce kullanılabilir olması gereken tüm HTTP rotaları
- aynı pencere içinde var olması gereken tüm gateway yöntemleri, araçları veya hizmetleri

Tam girdiniz hâlâ gerekli herhangi bir başlangıç yeteneğine sahipse bu bayrağı etkinleştirmeyin.
Plugin'i varsayılan davranışta bırakın ve OpenClaw'ın
başlangıç sırasında tam girdiyi yüklemesine izin verin.

Paketlenmiş kanallar ayrıca çekirdeğin tam kanal çalışma zamanı yüklenmeden önce
danışabileceği yalnızca kurulum sözleşme yüzeyi yardımcıları da yayınlayabilir. Geçerli kurulum
yükseltme yüzeyi şöyledir:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Çekirdek bu yüzeyi, tam Plugin girdisini yüklemeden eski bir tek hesaplı kanal
yapılandırmasını `channels.<id>.accounts.*` içine yükseltmesi gerektiğinde kullanır.
Matrix güncel paketlenmiş örnektir: adlandırılmış hesaplar zaten varsa yalnızca auth/bootstrap anahtarlarını
adlandırılmış yükseltilmiş bir hesaba taşır ve her zaman
`accounts.default` oluşturmak yerine yapılandırılmış standart olmayan bir varsayılan hesap anahtarını koruyabilir.

Bu kurulum yama adaptörleri paketlenmiş sözleşme yüzeyi keşfini lazy tutar. Import
zamanı hafif kalır; yükseltme yüzeyi modül import'unda paketlenmiş kanal başlangıcına
yeniden girmek yerine yalnızca ilk kullanımda yüklenir.

Bu başlangıç yüzeyleri gateway RPC yöntemlerini içerdiğinde, bunları
Plugin'e özgü bir önek üzerinde tutun. Çekirdek admin ad alanları (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış kalır ve
bir Plugin daha dar bir kapsam istese bile her zaman `operator.admin` olarak çözülür.

Örnek:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Kanal katalog meta verileri

Kanal Plugin'leri `openclaw.channel` üzerinden kurulum/keşif meta verisi ve
`openclaw.install` üzerinden kurulum ipuçları duyurabilir. Bu, çekirdek kataloğunu veriden bağımsız tutar.

Örnek:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

En küçük örneğin ötesinde kullanışlı `openclaw.channel` alanları:

- `detailLabel`: daha zengin katalog/durum yüzeyleri için ikincil etiket
- `docsLabel`: belge bağlantısı için bağlantı metnini geçersiz kılar
- `preferOver`: bu katalog girdisinin önüne geçmesi gereken daha düşük öncelikli Plugin/kanal kimlikleri
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: seçim yüzeyi kopya denetimleri
- `markdownCapable`: giden biçimlendirme kararları için kanalı markdown yetenekli olarak işaretler
- `exposure.configured`: `false` olarak ayarlandığında kanalı yapılandırılmış kanal listeleme yüzeylerinden gizler
- `exposure.setup`: `false` olarak ayarlandığında kanalı etkileşimli kurulum/yapılandırma seçicilerinden gizler
- `exposure.docs`: kanalı belge gezinti yüzeyleri için dahili/özel olarak işaretler
- `showConfigured` / `showInSetup`: eski takma adlar uyumluluk için hâlâ kabul edilir; `exposure` tercih edin
- `quickstartAllowFrom`: kanalı standart hızlı başlangıç `allowFrom` akışına dahil eder
- `forceAccountBinding`: yalnızca tek bir hesap olsa bile açık hesap bağlamasını zorunlu kılar
- `preferSessionLookupForAnnounceTarget`: duyuru hedeflerini çözümlerken oturum aramasını tercih eder

OpenClaw ayrıca **harici kanal kataloglarını** da birleştirebilir (örneğin bir MPM
kayıt dışa aktarımı). Aşağıdakilerden birine bir JSON dosyası bırakın:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Veya `OPENCLAW_PLUGIN_CATALOG_PATHS` (ya da `OPENCLAW_MPM_CATALOG_PATHS`) değişkenini
bir veya daha fazla JSON dosyasına işaret edecek şekilde ayarlayın (virgül/noktalı virgül/`PATH` ile ayrılmış). Her dosya
şunu içermelidir: `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Ayrıştırıcı ayrıca `"entries"` anahtarı için eski takma adlar olarak `"packages"` veya `"plugins"` anahtarlarını da kabul eder.

## Bağlam motoru Plugin'leri

Bağlam motoru Plugin'leri; alma, birleştirme
ve Compaction için oturum bağlamı orkestrasyonuna sahiptir. Bunları Plugin'inizden
`api.registerContextEngine(id, factory)` ile kaydedin, ardından etkin motoru
`plugins.slots.contextEngine` ile seçin.

Plugin'inizin varsayılan bağlam
pipeline'ını yalnızca memory araması veya hook eklemek yerine değiştirmesi ya da genişletmesi gerekiyorsa bunu kullanın.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Motorunuz Compaction algoritmasına **sahip değilse**, `compact()`
uygulamasını koruyun ve bunu açıkça delege edin:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Yeni bir yetenek ekleme

Bir Plugin mevcut API'ye uymayan davranışa ihtiyaç duyduğunda, özel bir iç erişimle
Plugin sistemini baypas etmeyin. Eksik yeteneği ekleyin.

Önerilen sıra:

1. çekirdek sözleşmeyi tanımlayın
   Çekirdeğin hangi paylaşılan davranışa sahip olması gerektiğine karar verin: ilke, geri dönüş, yapılandırma birleştirme,
   yaşam döngüsü, kanala dönük semantik ve çalışma zamanı yardımcısı biçimi.
2. tipli Plugin kayıt/çalışma zamanı yüzeyleri ekleyin
   `OpenClawPluginApi` ve/veya `api.runtime` yüzeyini kullanılabilir en küçük
   tipli yetenek yüzeyiyle genişletin.
3. çekirdek + kanal/özellik tüketicilerini bağlayın
   Kanal ve özellik Plugin'leri yeni yeteneği çekirdek üzerinden tüketmeli,
   satıcı uygulamasını doğrudan import etmemelidir.
4. satıcı uygulamalarını kaydedin
   Satıcı Plugin'leri daha sonra backend'lerini bu yeteneğe karşı kaydeder.
5. sözleşme kapsamı ekleyin
   Sahiplik ve kayıt biçimi zaman içinde açık kalsın diye testler ekleyin.

OpenClaw bir sağlayıcının dünya görüşüne sabitlenmeden böylece
görüş sahibi kalır. Somut bir dosya kontrol listesi ve çalışılmış örnek için
bkz. [Capability Cookbook](/tr/plugins/architecture).

### Yetenek kontrol listesi

Yeni bir yetenek eklediğinizde uygulama genellikle şu
yüzeylere birlikte dokunmalıdır:

- `src/<capability>/types.ts` içindeki çekirdek sözleşme türleri
- `src/<capability>/runtime.ts` içindeki çekirdek runner/çalışma zamanı yardımcısı
- `src/plugins/types.ts` içindeki Plugin API kayıt yüzeyi
- `src/plugins/registry.ts` içindeki Plugin kayıt defteri bağlantısı
- özellik/kanal Plugin'lerinin bunu tüketmesi gerekiyorsa `src/plugins/runtime/*` içindeki
  Plugin çalışma zamanı açığa çıkarımı
- `src/test-utils/plugin-registration.ts` içindeki capture/test yardımcıları
- `src/plugins/contracts/registry.ts` içindeki sahiplik/sözleşme doğrulamaları
- `docs/` içindeki operator/Plugin belgeleri

Bu yüzeylerden biri eksikse, bu genellikle yeteneğin
henüz tam olarak entegre edilmediğinin işaretidir.

### Yetenek şablonu

En küçük desen:

```ts
// çekirdek sözleşme
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// Plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// özellik/kanal Plugin'leri için paylaşılan çalışma zamanı yardımcısı
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Robotun laboratuvarda yürüdüğünü göster.",
  cfg,
});
```

Sözleşme testi deseni:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Bu, kuralı basit tutar:

- çekirdek yetenek sözleşmesine + orkestrasyona sahiptir
- satıcı Plugin'leri satıcı uygulamalarına sahiptir
- özellik/kanal Plugin'leri çalışma zamanı yardımcılarını tüketir
- sözleşme testleri sahipliği açık tutar

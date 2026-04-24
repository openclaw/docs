---
read_when:
    - Yerel OpenClaw Plugins'leri oluşturma veya hata ayıklama
    - Plugin yetenek modelini veya sahiplik sınırlarını anlama
    - Plugin yükleme işlem hattı veya kayıt defteri üzerinde çalışma
    - Sağlayıcı çalışma zamanı hook'ları veya kanal Plugins'leri uygulama
sidebarTitle: Internals
summary: 'Plugin iç yapıları: yetenek modeli, sahiplik, sözleşmeler, yükleme işlem hattı ve çalışma zamanı yardımcıları'
title: Plugin iç yapıları
x-i18n:
    generated_at: "2026-04-24T09:20:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: d05891966669e599b1aa0165f20f913bfa82c22436356177436fba5d1be31e7b
    source_path: plugins/architecture.md
    workflow: 15
---

Bu, OpenClaw Plugin sistemi için **derin mimari başvurusudur**. Pratik kılavuzlar için
aşağıdaki odaklı sayfalardan biriyle başlayın.

<CardGroup cols={2}>
  <Card title="Plugins kurun ve kullanın" icon="plug" href="/tr/tools/plugin">
    Plugin ekleme, etkinleştirme ve sorun giderme için son kullanıcı kılavuzu.
  </Card>
  <Card title="Plugins oluşturma" icon="rocket" href="/tr/plugins/building-plugins">
    En küçük çalışan manifest ile ilk Plugin öğreticisi.
  </Card>
  <Card title="Kanal Plugins'leri" icon="comments" href="/tr/plugins/sdk-channel-plugins">
    Bir mesajlaşma kanalı Plugin'i oluşturun.
  </Card>
  <Card title="Sağlayıcı Plugins'leri" icon="microchip" href="/tr/plugins/sdk-provider-plugins">
    Bir model sağlayıcısı Plugin'i oluşturun.
  </Card>
  <Card title="SDK genel bakışı" icon="book" href="/tr/plugins/sdk-overview">
    İçe aktarma eşlemesi ve kayıt API başvurusu.
  </Card>
</CardGroup>

## Genel yetenek modeli

Yetenekler, OpenClaw içindeki genel **yerel Plugin** modelidir. Her
yerel OpenClaw Plugin'i bir veya daha fazla yetenek türüne karşı kayıt olur:

| Yetenek               | Kayıt yöntemi                                   | Örnek Plugins                     |
| --------------------- | ----------------------------------------------- | --------------------------------- |
| Metin çıkarımı        | `api.registerProvider(...)`                     | `openai`, `anthropic`             |
| CLI çıkarım backend'i | `api.registerCliBackend(...)`                   | `openai`, `anthropic`             |
| Konuşma               | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`         |
| Gerçek zamanlı transkripsiyon | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                    |
| Gerçek zamanlı ses    | `api.registerRealtimeVoiceProvider(...)`        | `openai`                          |
| Medya anlama          | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                |
| Görsel üretimi        | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Müzik üretimi         | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`               |
| Video üretimi         | `api.registerVideoGenerationProvider(...)`      | `qwen`                            |
| Web fetch             | `api.registerWebFetchProvider(...)`             | `firecrawl`                       |
| Web araması           | `api.registerWebSearchProvider(...)`            | `google`                          |
| Kanal / mesajlaşma    | `api.registerChannel(...)`                      | `msteams`, `matrix`               |
| Gateway keşfi         | `api.registerGatewayDiscoveryService(...)`      | `bonjour`                         |

Sıfır yetenek kaydedip hook'lar, araçlar, keşif
servisleri veya arka plan servisleri sağlayan bir Plugin, **legacy yalnızca hook** Plugin'idir. Bu desen
hâlâ tamamen desteklenir.

### Harici uyumluluk duruşu

Yetenek modeli çekirdeğe yerleşti ve bugün paketlenmiş/yerel Plugins'ler
tarafından kullanılıyor, ancak harici Plugin uyumluluğu için “dışa aktarılmışsa donmuştur”
yaklaşımından daha sıkı bir çıta gerekir.

| Plugin durumu                                    | Kılavuz                                                                                          |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Mevcut harici Plugins                            | Hook tabanlı entegrasyonları çalışır durumda tutun; uyumluluk tabanı budur.                     |
| Yeni paketlenmiş/yerel Plugins                   | Satıcıya özgü içe uzanmalar veya yeni yalnızca hook tasarımları yerine açık yetenek kaydını tercih edin. |
| Yetenek kaydını benimseyen harici Plugins        | İzinlidir, ancak belgeler bunları kararlı olarak işaretlemedikçe yeteneğe özgü yardımcı yüzeyleri gelişen yüzeyler olarak değerlendirin. |

Yetenek kaydı hedeflenen yöndür. Geçiş sırasında legacy hook'lar,
harici Plugins için en güvenli, kırılmayan yol olmaya devam eder. Dışa aktarılan
yardımcı alt yolların hepsi eşit değildir — tesadüfi yardımcı dışa aktarımları yerine dar
ve belgelenmiş sözleşmeleri tercih edin.

### Plugin şekilleri

OpenClaw, yüklenen her Plugin'i yalnızca statik meta veriye göre değil,
gerçek kayıt davranışına göre bir şekle sınıflandırır:

- **plain-capability**: tam olarak bir yetenek türü kaydeder (örneğin
  `mistral` gibi yalnızca sağlayıcı olan bir Plugin).
- **hybrid-capability**: birden çok yetenek türü kaydeder (örneğin
  `openai`, metin çıkarımı, konuşma, medya anlama ve görsel
  üretimini sahiplenir).
- **hook-only**: yalnızca hook'lar kaydeder (typed veya custom), yetenek,
  araç, komut veya servis kaydetmez.
- **non-capability**: araçlar, komutlar, servisler veya rotalar kaydeder ama
  yetenek kaydetmez.

Bir Plugin'in şeklini ve yetenek kırılımını görmek için `openclaw plugins inspect <id>` kullanın. Ayrıntılar için [CLI başvurusu](/tr/cli/plugins#inspect) bölümüne bakın.

### Legacy hook'lar

`before_agent_start` hook'u, yalnızca hook kullanan Plugins için
bir uyumluluk yolu olarak desteklenmeye devam eder. Legacy gerçek dünya Plugins'leri hâlâ buna bağlıdır.

Yön:

- çalışır durumda tutun
- legacy olarak belgeleyin
- model/sağlayıcı geçersiz kılması işleri için `before_model_resolve` tercih edin
- istem mutasyonu işleri için `before_prompt_build` tercih edin
- gerçek kullanım düşmeden ve fixture kapsamı geçiş güvenliğini kanıtlamadan kaldırmayın

### Uyumluluk sinyalleri

`openclaw doctor` veya `openclaw plugins inspect <id>` çalıştırdığınızda
şu etiketlerden birini görebilirsiniz:

| Sinyal                     | Anlamı                                                       |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Yapılandırma doğru ayrıştırılıyor ve Plugins çözülüyor       |
| **compatibility advisory** | Plugin desteklenen ama daha eski bir desen kullanıyor (örn. `hook-only`) |
| **legacy warning**         | Plugin artık önerilmeyen `before_agent_start` kullanıyor     |
| **hard error**             | Yapılandırma geçersiz veya Plugin yüklenemedi                |

Ne `hook-only` ne de `before_agent_start` bugün Plugin'inizi bozmaz:
`hook-only` tavsiye niteliğindedir ve `before_agent_start` yalnızca uyarı verir. Bu
sinyaller ayrıca `openclaw status --all` ve `openclaw plugins doctor` içinde de görünür.

## Mimariye genel bakış

OpenClaw'ın Plugin sistemi dört katmana sahiptir:

1. **Manifest + keşif**
   OpenClaw, yapılandırılmış yollardan, çalışma alanı köklerinden,
   genel Plugin köklerinden ve paketlenmiş Plugins'lerden aday Plugins'leri bulur. Keşif önce yerel
   `openclaw.plugin.json` manifest'lerini ve desteklenen bundle manifest'lerini okur.
2. **Etkinleştirme + doğrulama**
   Çekirdek, keşfedilen bir Plugin'in etkin, devre dışı, engellenmiş veya
   bellek gibi özel bir yuva için seçilmiş olup olmadığına karar verir.
3. **Çalışma zamanı yükleme**
   Yerel OpenClaw Plugins'leri jiti aracılığıyla süreç içinde yüklenir ve
   yetenekleri merkezi bir kayıt defterine kaydeder. Uyumlu bundle'lar çalışma zamanı kodu içe aktarılmadan
   kayıt defteri kayıtlarına normalize edilir.
4. **Yüzey tüketimi**
   OpenClaw'ın geri kalanı, araçları, kanalları, sağlayıcı
   kurulumunu, hook'ları, HTTP rotalarını, CLI komutlarını ve servisleri açığa çıkarmak için
   kayıt defterini okur.

Özellikle Plugin CLI için, kök komut keşfi iki aşamaya ayrılır:

- ayrıştırma zamanı meta verisi `registerCli(..., { descriptors: [...] })` üzerinden gelir
- gerçek Plugin CLI modülü tembel kalabilir ve ilk çağrıda kaydolabilir

Bu, Plugin'e ait CLI kodunu Plugin içinde tutarken OpenClaw'ın
ayrıştırmadan önce kök komut adlarını ayırmasını sağlar.

Önemli tasarım sınırı:

- keşif + yapılandırma doğrulaması, **Plugin kodu yürütülmeden**
  **manifest/şema meta verilerinden** çalışabilmelidir
- yerel çalışma zamanı davranışı, Plugin modülünün `register(api)` yolundan gelir

Bu ayrım, tam çalışma zamanı etkin olmadan önce OpenClaw'ın yapılandırmayı doğrulamasına,
eksik/devre dışı Plugins'leri açıklamasına ve UI/şema ipuçları oluşturmasına olanak tanır.

### Etkinleştirme planlaması

Etkinleştirme planlaması denetim düzleminin parçasıdır. Çağıranlar,
daha geniş çalışma zamanı kayıt defterlerini yüklemeden önce belirli bir komut, sağlayıcı, kanal, rota, ajan harness'i veya
yetenek için hangi Plugins'lerin ilgili olduğunu sorabilir.

Planlayıcı, geçerli manifest davranışını uyumlu tutar:

- `activation.*` alanları açık planlayıcı ipuçlarıdır
- `providers`, `channels`, `commandAliases`, `setup.providers`,
  `contracts.tools` ve hook'lar, manifest sahiplik fallback'i olmaya devam eder
- yalnızca kimliklerden oluşan planlayıcı API'si mevcut çağıranlar için kullanılabilir kalır
- plan API'si neden etiketleri raporlar; böylece tanılamalar açık
  ipuçlarını sahiplik fallback'inden ayırabilir

`activation` alanını bir yaşam döngüsü hook'u veya
`register(...)` yerine geçecek bir alan olarak değerlendirmeyin. Bu, yüklemeyi daraltmak için kullanılan meta veridir. İlişkiyi zaten
sahiplik alanları tarif ediyorsa onları tercih edin; `activation` alanını yalnızca ek
planlayıcı ipuçları için kullanın.

### Kanal Plugins'leri ve paylaşılan message tool

Kanal Plugins'lerinin normal sohbet eylemleri için ayrı bir gönder/düzenle/tepki aracı kaydetmesine gerek yoktur. OpenClaw, çekirdekte tek bir paylaşılan `message` aracı tutar ve kanal Plugins'leri bunun arkasındaki kanala özgü keşif ve yürütmeyi sahiplenir.

Geçerli sınır şudur:

- çekirdek, paylaşılan `message` araç host'unu, istem bağlantısını, oturum/konu
  muhasebesini ve yürütme dağıtımını sahiplenir
- kanal Plugins'leri kapsamlı eylem keşfini, yetenek keşfini ve kanala özgü şema parçalarını sahiplenir
- kanal Plugins'leri, konuşma kimliklerinin konu kimliklerini nasıl kodladığı veya üst konuşmalardan nasıl devraldığı gibi
  sağlayıcıya özgü oturum konuşma dil bilgisini sahiplenir
- kanal Plugins'leri son eylemi kendi eylem bağdaştırıcıları üzerinden yürütür

Kanal Plugins'leri için SDK yüzeyi
`ChannelMessageActionAdapter.describeMessageTool(...)` yapısıdır. Bu birleşik keşif
çağrısı, bir Plugin'in görünür eylemlerini, yeteneklerini ve şema
katkılarını birlikte döndürmesini sağlar; böylece bu parçalar birbirinden kopmaz.

Kanala özgü bir message-tool parametresi yerel yol veya uzak medya URL'si gibi
bir medya kaynağı taşıdığında, Plugin ayrıca
`describeMessageTool(...)` içinden `mediaSourceParams` döndürmelidir. Çekirdek,
Plugin'e ait parametre adlarını hardcode etmeden sandbox yol normalizasyonu ve giden medya erişim ipuçlarını uygulamak için bu açık
listeyi kullanır.
Orada kanal genelinde düz bir liste değil, eylem kapsamlı eşlemeleri tercih edin; böylece
yalnızca profile özel bir medya parametresi, `send` gibi ilgisiz eylemlerde normalize edilmez.

Çekirdek, çalışma zamanı kapsamını bu keşif adımına geçirir. Önemli alanlar şunları içerir:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- güvenilen gelen `requesterSenderId`

Bu, bağlama duyarlı Plugins için önemlidir. Bir kanal, çekirdekte kanala özgü dallar
hardcode etmeden etkin hesap, geçerli oda/konu/mesaj veya
güvenilen istekçi kimliğine göre mesaj eylemlerini gizleyebilir veya açığa çıkarabilir.

İşte bu yüzden gömülü çalıştırıcı yönlendirme değişiklikleri hâlâ Plugin işidir: çalıştırıcı,
paylaşılan `message` aracının geçerli tur için doğru kanala ait
yüzeyi açığa çıkarması için geçerli sohbet/oturum kimliğini Plugin keşif sınırına iletmekten sorumludur.

Kanala ait yürütme yardımcıları için, paketlenmiş Plugins'ler yürütme
çalışma zamanını kendi uzantı modülleri içinde tutmalıdır. Çekirdek artık
`src/agents/tools` altında Discord, Slack, Telegram veya WhatsApp mesaj eylemi çalışma zamanlarını sahiplenmiyor.
Ayrı `plugin-sdk/*-action-runtime` alt yolları yayımlamıyoruz ve paketlenmiş
Plugins'ler kendi yerel çalışma zamanı kodlarını doğrudan kendi
uzantı modüllerinden içe aktarmalıdır.

Aynı sınır genel olarak sağlayıcı adlı SDK uçları için de geçerlidir: çekirdek,
Slack, Discord, Signal, WhatsApp veya benzeri uzantılar için kanala özgü kolaylık barrel'larını içe aktarmamalıdır. Çekirdeğin bir davranışa ihtiyacı varsa ya
paketlenmiş Plugin'in kendi `api.ts` / `runtime-api.ts` barrel'ını tüketsin ya da ihtiyacı
paylaşılan SDK içinde dar bir genel yeteneğe yükseltsin.

Özellikle anketler için iki yürütme yolu vardır:

- `outbound.sendPoll`, ortak
  anket modeline uyan kanallar için paylaşılan temel yoldur
- `actions.handleAction("poll")`, kanala özgü
  anket semantiği veya ek anket parametreleri için tercih edilen yoldur

Çekirdek artık paylaşılan anket ayrıştırmasını, Plugin anket dağıtımı
eylemi reddettikten sonraya erteler; böylece Plugin'e ait anket işleyicileri,
genel anket ayrıştırıcısı tarafından önce engellenmeden kanala özgü anket
alanlarını kabul edebilir.

Tam başlangıç dizisi için bkz. [Plugin mimarisi iç yapıları](/tr/plugins/architecture-internals).

## Yetenek sahiplik modeli

OpenClaw, yerel bir Plugin'i ilişkisiz entegrasyonlardan oluşan bir torba olarak değil,
bir **şirketin** veya bir **özelliğin**
sahiplik sınırı olarak ele alır.

Bu şu anlama gelir:

- bir şirket Plugin'i genellikle o şirketin OpenClaw'a bakan
  tüm yüzeylerini sahiplenmelidir
- bir özellik Plugin'i genellikle sunduğu tam özellik yüzeyini sahiplenmelidir
- kanallar, sağlayıcı davranışını ad hoc yeniden uygulamak yerine paylaşılan çekirdek yetenekleri tüketmelidir

<Accordion title="Paketlenmiş Plugins'ler arasında örnek sahiplik desenleri">
  - **Satıcı çoklu yeteneği**: `openai`; metin çıkarımı, konuşma, gerçek zamanlı
    ses, medya anlama ve görsel üretimini sahiplenir. `google`; metin
    çıkarımı ile birlikte medya anlama, görsel üretimi ve web aramasını sahiplenir.
    `qwen`; metin çıkarımı ile birlikte medya anlama ve video üretimini sahiplenir.
  - **Satıcı tek yeteneği**: `elevenlabs` ve `microsoft` konuşmayı sahiplenir;
    `firecrawl` web-fetch'i sahiplenir; `minimax` / `mistral` / `moonshot` / `zai`
    medya anlama backend'lerini sahiplenir.
  - **Özellik Plugin'i**: `voice-call`; çağrı taşımasını, araçları, CLI'yi, rotaları
    ve Twilio medya-akışı köprülemesini sahiplenir, ancak satıcı
    Plugins'lerini doğrudan içe aktarmak yerine paylaşılan konuşma, gerçek zamanlı
    transkripsiyon ve gerçek zamanlı ses yeteneklerini tüketir.
</Accordion>

Hedeflenen son durum şudur:

- OpenAI, metin modelleri, konuşma, görseller ve
  gelecekteki videoyu kapsasa bile tek bir Plugin içinde yaşar
- başka bir satıcı da kendi yüzey alanı için aynısını yapabilir
- kanallar sağlayıcıyı hangi satıcı Plugin'inin sahiplendiğini umursamaz; çekirdek tarafından açığa çıkarılan
  paylaşılan yetenek sözleşmesini tüketirler

Temel ayrım budur:

- **Plugin** = sahiplik sınırı
- **yetenek** = birden çok Plugin'in uygulayabileceği veya tüketebileceği çekirdek sözleşme

Dolayısıyla OpenClaw video gibi yeni bir alan eklerse ilk soru
"hangi sağlayıcı video işlemeyi hardcode etmeli?" değildir. İlk soru
"çekirdekteki video yetenek sözleşmesi nedir?" olmalıdır. Bu sözleşme var olduktan sonra satıcı Plugins'leri
buna karşı kayıt olabilir ve kanal/özellik Plugins'leri bunu tüketebilir.

Yetenek henüz yoksa doğru adım genellikle şudur:

1. eksik yeteneği çekirdekte tanımlayın
2. bunu Plugin API'si/çalışma zamanı üzerinden typed şekilde dışa açın
3. kanalları/özellikleri bu yetenek üzerinden bağlayın
4. satıcı Plugins'lerinin uygulamalar kaydetmesine izin verin

Bu, sahipliği açık tutarken tek bir satıcıya veya
tek seferlik Plugin'e özgü bir kod yoluna bağımlı çekirdek davranıştan kaçınır.

### Yetenek katmanlama

Kodun nereye ait olduğuna karar verirken şu zihinsel modeli kullanın:

- **çekirdek yetenek katmanı**: paylaşılan orkestrasyon, politika, fallback, yapılandırma
  birleştirme kuralları, teslim semantiği ve typed sözleşmeler
- **satıcı Plugin katmanı**: satıcıya özgü API'ler, auth, model katalogları, konuşma
  sentezi, görsel üretimi, gelecekteki video backend'leri, kullanım uç noktaları
- **kanal/özellik Plugin katmanı**: Slack/Discord/voice-call/vb. entegrasyonu;
  çekirdek yetenekleri tüketir ve bunları bir yüzeyde sunar

Örneğin TTS şu şekli izler:

- çekirdek; yanıt zamanı TTS politikasını, fallback sırasını, tercihleri ve kanal teslimini sahiplenir
- `openai`, `elevenlabs` ve `microsoft`, sentez uygulamalarını sahiplenir
- `voice-call`, telefon TTS çalışma zamanı yardımcısını tüketir

Aynı desen gelecekteki yetenekler için de tercih edilmelidir.

### Çoklu yetenekli şirket Plugin'i örneği

Bir şirket Plugin'i dışarıdan bakıldığında tutarlı hissettirmelidir. OpenClaw; modeller, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya anlama, görsel üretimi, video üretimi, web fetch ve web araması için paylaşılan
sözleşmelere sahipse, bir satıcı tüm yüzeylerini tek yerde sahiplenebilir:

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
      // auth/model katalogu/çalışma zamanı hook'ları
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // satıcı konuşma yapılandırması — SpeechProviderPlugin arayüzünü doğrudan uygula
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
        // kimlik bilgisi + fetch mantığı
      }),
    );
  },
};

export default plugin;
```

Önemli olan tam yardımcı adları değildir. Şekil önemlidir:

- tek bir Plugin satıcı yüzeyini sahiplenir
- çekirdek yine de yetenek sözleşmelerini sahiplenir
- kanallar ve özellik Plugins'leri satıcı kodunu değil, `api.runtime.*` yardımcılarını tüketir
- sözleşme testleri, Plugin'in sahip olduğunu iddia ettiği yetenekleri kaydettiğini doğrulayabilir

### Yetenek örneği: video anlama

OpenClaw, görsel/ses/video anlamayı zaten tek bir paylaşılan
yetenek olarak ele alır. Aynı sahiplik modeli burada da geçerlidir:

1. çekirdek medya-anlama sözleşmesini tanımlar
2. satıcı Plugins'leri uygun olduğunda `describeImage`, `transcribeAudio` ve
   `describeVideo` kaydeder
3. kanal ve özellik Plugins'leri, doğrudan satıcı koduna bağlanmak yerine
   paylaşılan çekirdek davranışı tüketir

Bu, tek bir sağlayıcının video varsayımlarının çekirdeğe gömülmesini önler. Plugin,
satıcı yüzeyini sahiplenir; çekirdek ise yetenek sözleşmesini ve fallback davranışını sahiplenir.

Video üretimi zaten aynı diziyi kullanır: çekirdek typed
yetenek sözleşmesini ve çalışma zamanı yardımcısını sahiplenir ve satıcı Plugins'leri
buna karşı `api.registerVideoGenerationProvider(...)` uygulamaları kaydeder.

Somut bir devreye alma kontrol listesine mi ihtiyacınız var? Bkz.
[Capability Cookbook](/tr/plugins/architecture).

## Sözleşmeler ve uygulama

Plugin API yüzeyi kasıtlı olarak typed ve
`OpenClawPluginApi` içinde merkezileştirilmiştir. Bu sözleşme, desteklenen kayıt noktalarını ve
bir Plugin'in güvenebileceği çalışma zamanı yardımcılarını tanımlar.

Bunun önemi:

- Plugin yazarları tek bir kararlı iç standart elde eder
- çekirdek, aynı
  sağlayıcı kimliğini kaydeden iki Plugin gibi yinelenen sahipliği reddedebilir
- başlangıç, bozuk kayıtlar için uygulanabilir tanılamalar gösterebilir
- sözleşme testleri, paketlenmiş Plugin sahipliğini zorlayabilir ve sessiz sapmayı önleyebilir

İki uygulama katmanı vardır:

1. **çalışma zamanı kayıt uygulaması**
   Plugin kayıt defteri, Plugins yüklenirken kayıtları doğrular. Örnekler:
   yinelenen sağlayıcı kimlikleri, yinelenen konuşma sağlayıcısı kimlikleri ve bozuk
   kayıtlar tanımsız davranış yerine Plugin tanılamaları üretir.
2. **sözleşme testleri**
   Paketlenmiş Plugins, test çalıştırmaları sırasında sözleşme kayıt defterlerinde yakalanır; böylece
   OpenClaw sahipliği açıkça doğrulayabilir. Bugün bu; model
   sağlayıcıları, konuşma sağlayıcıları, web arama sağlayıcıları ve paketlenmiş kayıt
   sahipliği için kullanılır.

Pratik etkisi şudur: OpenClaw hangi yüzeyin hangi
Plugin'e ait olduğunu önceden bilir. Bu, sahiplik örtük değil,
bildirilmiş, typed ve test edilebilir olduğu için çekirdeğin ve kanalların sorunsuz birleşmesine olanak tanır.

### Bir sözleşmede ne olmalı

İyi Plugin sözleşmeleri şunlardır:

- typed
- küçük
- yeteneğe özgü
- çekirdek tarafından sahiplenilen
- birden çok Plugin tarafından yeniden kullanılabilir
- satıcı bilgisi olmadan kanal/özellikler tarafından tüketilebilir

Kötü Plugin sözleşmeleri şunlardır:

- çekirdekte gizlenmiş satıcıya özgü politika
- kayıt defterini by-pass eden tek seferlik Plugin kaçış kapıları
- doğrudan bir satıcı uygulamasına uzanan kanal kodu
- `OpenClawPluginApi` veya
  `api.runtime` parçası olmayan ad hoc çalışma zamanı nesneleri

Emin değilseniz soyutlama düzeyini yükseltin: önce yeteneği tanımlayın, sonra
Plugins'in buna takılmasına izin verin.

## Yürütme modeli

Yerel OpenClaw Plugins'leri Gateway ile **aynı süreç içinde** çalışır. Sandbox'lanmazlar.
Yüklenmiş bir yerel Plugin, çekirdek kodla aynı süreç düzeyi güven sınırına sahiptir.

Sonuçlar:

- bir yerel Plugin araçlar, ağ işleyicileri, hook'lar ve servisler kaydedebilir
- yerel bir Plugin hatası gateway'i çökertebilir veya kararsızlaştırabilir
- kötü niyetli bir yerel Plugin, OpenClaw süreci içinde keyfi kod yürütmeyle eşdeğerdir

Uyumlu bundle'lar varsayılan olarak daha güvenlidir; çünkü OpenClaw şu anda bunları
meta veri/içerik paketleri olarak ele alır. Güncel sürümlerde bu çoğunlukla paketlenmiş
Skills anlamına gelir.

Paketlenmemiş Plugins'ler için izin listeleri ve açık kurulum/yükleme yolları kullanın. Çalışma alanı Plugins'lerini
üretim varsayılanları değil, geliştirme zamanı kodu olarak değerlendirin.

Paketlenmiş çalışma alanı paket adları için Plugin kimliğini npm
adına bağlı tutun: varsayılan olarak `@openclaw/<id>` veya
paket bilinçli olarak daha dar bir Plugin rolü açığa çıkarıyorsa `-provider`, `-plugin`, `-speech`, `-sandbox` veya `-media-understanding` gibi onaylı bir typed sonek kullanın.

Önemli güven notu:

- `plugins.allow`, **Plugin kimliklerine** güvenir; kaynak kökenine değil.
- Paketlenmiş bir Plugin ile aynı kimliğe sahip bir çalışma alanı Plugin'i,
  bu çalışma alanı Plugin'i etkin/izin listesinde olduğunda paketlenmiş kopyayı kasıtlı olarak gölgeler.
- Bu normaldir ve yerel geliştirme, yama testi ve hotfix'ler için yararlıdır.
- Paketlenmiş Plugin güveni, yükleme zamanındaki kurulum meta verisinden değil,
  kaynak anlık görüntüsünden — manifest ve diskteki koddan — çözülür. Bozulmuş
  veya değiştirilmiş bir kurulum kaydı, paketlenmiş bir Plugin'in güven yüzeyini
  gerçek kaynağın iddia ettiğinin ötesine sessizce genişletemez.

## Dışa aktarma sınırı

OpenClaw uygulama kolaylıklarını değil, yetenekleri dışa aktarır.

Yetenek kaydını genel tutun. Sözleşme dışı yardımcı dışa aktarımlarını kırpın:

- paketlenmiş Plugin'e özgü yardımcı alt yolları
- genel API olarak amaçlanmayan çalışma zamanı altyapısı alt yolları
- satıcıya özgü kolaylık yardımcıları
- uygulama ayrıntısı olan kurulum/onboarding yardımcıları

Bazı paketlenmiş Plugin yardımcı alt yolları, uyumluluk ve paketlenmiş Plugin bakımı için oluşturulan SDK dışa aktarma
eşlemesinde hâlâ kalır. Güncel örnekler arasında
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` ve birkaç `plugin-sdk/matrix*` seam bulunur. Bunları,
yeni üçüncü taraf Plugins'ler için önerilen SDK deseni olarak değil,
ayrılmış uygulama ayrıntısı dışa aktarımları olarak değerlendirin.

## İç yapılar ve başvuru

Yükleme işlem hattı, kayıt defteri modeli, sağlayıcı çalışma zamanı hook'ları, Gateway HTTP
rotaları, message tool şemaları, kanal hedef çözümlemesi, sağlayıcı katalogları,
bağlam motoru Plugins'leri ve yeni bir yetenek ekleme kılavuzu için bkz.
[Plugin mimarisi iç yapıları](/tr/plugins/architecture-internals).

## İlgili

- [Plugins oluşturma](/tr/plugins/building-plugins)
- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin manifest'i](/tr/plugins/manifest)

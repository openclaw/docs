---
read_when:
    - Yerel OpenClaw plugin’leri oluştururken veya hata ayıklarken
    - Plugin yetenek modelini veya sahiplik sınırlarını anlamak için
    - Plugin yükleme hattı veya kayıt sistemi üzerinde çalışırken
    - Sağlayıcı çalışma zamanı hook’larını veya kanal plugin’lerini uygularken
sidebarTitle: Internals
summary: 'Plugin iç yapıları: yetenek modeli, sahiplik, sözleşmeler, yükleme hattı ve çalışma zamanı yardımcıları'
title: Plugin İç Yapıları
x-i18n:
    generated_at: "2026-04-05T14:11:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1bc9d7261c3c7878d37140be77f210dd262d6c3edee2491ea534aa599e2800c0
    source_path: plugins/architecture.md
    workflow: 15
---

# Plugin İç Yapıları

<Info>
  Bu, **derin mimari başvurusudur**. Pratik kılavuzlar için şunlara bakın:
  - [Plugin’leri yükleyin ve kullanın](/tools/plugin) — kullanıcı kılavuzu
  - [Başlarken](/tr/plugins/building-plugins) — ilk plugin öğreticisi
  - [Kanal Plugin’leri](/tr/plugins/sdk-channel-plugins) — bir mesajlaşma kanalı oluşturun
  - [Sağlayıcı Plugin’leri](/tr/plugins/sdk-provider-plugins) — bir model sağlayıcısı oluşturun
  - [SDK Genel Bakış](/tr/plugins/sdk-overview) — içe aktarma haritası ve kayıt API’si
</Info>

Bu sayfa, OpenClaw plugin sisteminin iç mimarisini kapsar.

## Açık yetenek modeli

Yetenekler, OpenClaw içindeki açık **yerel plugin** modelidir. Her
yerel OpenClaw plugin’i bir veya daha fazla yetenek türüne kayıt olur:

| Yetenek              | Kayıt yöntemi                                    | Örnek plugin’ler                     |
| -------------------- | ------------------------------------------------ | ------------------------------------ |
| Metin çıkarımı       | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI çıkarım arka ucu | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Konuşma              | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Gerçek zamanlı yazıya dökme | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Gerçek zamanlı ses   | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Medya anlama         | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Görsel üretimi       | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Video üretimi        | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Web getirme          | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Web arama            | `api.registerWebSearchProvider(...)`             | `google`                             |
| Kanal / mesajlaşma   | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

Sıfır yetenek kaydeden ancak hook’lar, araçlar veya
hizmetler sağlayan bir plugin, **eski yalnızca-hook** plugin’idir. Bu desen hâlâ tamamen desteklenmektedir.

### Dış uyumluluk duruşu

Yetenek modeli çekirdeğe yerleşmiştir ve bugün paketlenmiş/yerel plugin’ler
tarafından kullanılmaktadır, ancak dış plugin uyumluluğu için hâlâ
“dışa aktarılıyorsa donmuştur” yaklaşımından daha sıkı bir çıta gerekir.

Geçerli rehberlik:

- **mevcut dış plugin’ler:** hook tabanlı entegrasyonları çalışır durumda tutun; bunu
  uyumluluk tabanı olarak kabul edin
- **yeni paketlenmiş/yerel plugin’ler:** satıcıya özgü doğrudan erişimler veya
  yeni yalnızca-hook tasarımları yerine açık yetenek kaydını tercih edin
- **yetenek kaydını benimseyen dış plugin’ler:** buna izin verilir, ancak belgeler bir
  sözleşmeyi açıkça kararlı olarak işaretlemedikçe yeteneğe özgü yardımcı yüzeyleri
  gelişen yapılar olarak değerlendirin

Pratik kural:

- yetenek kayıt API’leri amaçlanan yöndür
- geçiş süresince dış plugin’ler için eski hook’lar en güvenli
  bozulmasız yol olmaya devam eder
- dışa aktarılan yardımcı alt yolların hepsi eşit değildir; tesadüfi yardımcı dışa aktarımları yerine
  belgelenmiş dar sözleşmeyi tercih edin

### Plugin şekilleri

OpenClaw, her yüklenen plugin’i gerçek
kayıt davranışına göre bir şekle sınıflandırır (yalnızca statik meta veriye göre değil):

- **plain-capability** -- tam olarak bir yetenek türü kaydeder (örneğin,
  `mistral` gibi yalnızca sağlayıcı plugin’i)
- **hybrid-capability** -- birden çok yetenek türü kaydeder (örneğin,
  `openai` metin çıkarımı, konuşma, medya anlama ve görsel
  üretimine sahiptir)
- **hook-only** -- yalnızca hook’lar (türlü veya özel) kaydeder; yetenek,
  araç, komut veya hizmet kaydetmez
- **non-capability** -- araçlar, komutlar, hizmetler veya rotalar kaydeder ama
  yetenek kaydetmez

Bir plugin’in şeklini ve yetenek
dökümünü görmek için `openclaw plugins inspect <id>` kullanın. Ayrıntılar için
[CLI başvurusuna](/cli/plugins#inspect) bakın.

### Eski hook’lar

`before_agent_start` hook’u, yalnızca-hook plugin’ler için bir uyumluluk yolu olarak desteklenmeye devam eder. Gerçek dünyadaki eski plugin’ler hâlâ buna bağımlıdır.

Yön:

- çalışır durumda tutun
- eski olarak belgelendirin
- model/sağlayıcı geçersiz kılma işleri için `before_model_resolve` tercih edin
- istem değişikliği işleri için `before_prompt_build` tercih edin
- yalnızca gerçek kullanım azaldığında ve fixture kapsamı geçiş güvenliğini kanıtladığında kaldırın

### Uyumluluk sinyalleri

`openclaw doctor` veya `openclaw plugins inspect <id>` çalıştırdığınızda,
şu etiketlerden birini görebilirsiniz:

| Sinyal                   | Anlamı                                                      |
| ------------------------ | ----------------------------------------------------------- |
| **config valid**         | Yapılandırma sorunsuz ayrıştırılır ve plugin’ler çözülür    |
| **compatibility advisory** | Plugin desteklenen ama daha eski bir desen kullanıyor (ör. `hook-only`) |
| **legacy warning**       | Plugin artık önerilmeyen `before_agent_start` kullanıyor    |
| **hard error**           | Yapılandırma geçersiz veya plugin yüklenemedi               |

Ne `hook-only` ne de `before_agent_start` bugün plugin’inizi bozmaz --
`hook-only` bir öneridir ve `before_agent_start` yalnızca bir uyarı tetikler. Bu
sinyaller ayrıca `openclaw status --all` ve `openclaw plugins doctor` içinde de görünür.

## Mimariye genel bakış

OpenClaw’un plugin sistemi dört katmana sahiptir:

1. **Manifest + keşif**
   OpenClaw, aday plugin’leri yapılandırılmış yollardan, çalışma alanı köklerinden,
   genel uzantı köklerinden ve paketlenmiş uzantılardan bulur. Keşif, önce yerel
   `openclaw.plugin.json` manifest dosyalarını ve desteklenen paket manifestlerini okur.
2. **Etkinleştirme + doğrulama**
   Çekirdek, keşfedilen bir plugin’in etkin, devre dışı, engellenmiş veya bellek gibi
   münhasır bir yuva için seçilmiş olup olmadığına karar verir.
3. **Çalışma zamanı yükleme**
   Yerel OpenClaw plugin’leri jiti aracılığıyla aynı süreç içinde yüklenir ve
   yetenekleri merkezi bir kayıt sistemine kaydeder. Uyumlu paketler ise
   çalışma zamanı kodu içe aktarılmadan kayıt kayıtlarına normalize edilir.
4. **Yüzey tüketimi**
   OpenClaw’un geri kalanı araçları, kanalları, sağlayıcı kurulumunu,
   hook’ları, HTTP rotalarını, CLI komutlarını ve hizmetleri açığa çıkarmak için kayıt sistemini okur.

Özellikle plugin CLI için, kök komut keşfi iki aşamaya ayrılır:

- ayrıştırma zamanı meta verisi `registerCli(..., { descriptors: [...] })` içinden gelir
- gerçek plugin CLI modülü tembel kalabilir ve ilk çağrıda kayıt olabilir

Bu, plugin’e ait CLI kodunu plugin içinde tutarken OpenClaw’un ayrıştırmadan önce
kök komut adlarını ayırmasını sağlar.

Önemli tasarım sınırı:

- keşif + yapılandırma doğrulaması, plugin kodu çalıştırılmadan
  **manifest/şema meta verisinden** çalışabilmelidir
- yerel çalışma zamanı davranışı, plugin modülünün `register(api)` yolundan gelir

Bu ayrım, OpenClaw’un yapılandırmayı doğrulamasını, eksik/devre dışı plugin’leri açıklamasını ve
tam çalışma zamanı etkinleşmeden önce UI/şema ipuçları oluşturmasını sağlar.

### Kanal plugin’leri ve paylaşılan mesaj aracı

Kanal plugin’lerinin normal sohbet işlemleri için ayrı bir gönder/düzenle/tepki aracı
kaydetmesi gerekmez. OpenClaw çekirdekte tek bir paylaşılan `message` aracı tutar ve
kanal plugin’leri bunun arkasındaki kanala özgü keşif ve yürütmeye sahip olur.

Geçerli sınır şudur:

- çekirdek, paylaşılan `message` araç ana bilgisayarına, istem kablolamasına, oturum/iş parçacığı
  muhasebesine ve yürütme dağıtımına sahiptir
- kanal plugin’leri kapsamlı eylem keşfi, yetenek keşfi ve
  kanala özgü tüm şema parçalarına sahiptir
- kanal plugin’leri, konuşma kimliklerinin iş parçacığı kimliklerini nasıl kodladığı veya
  üst konuşmalardan nasıl devraldığı gibi sağlayıcıya özgü oturum konuşma dil bilgisine sahiptir
- kanal plugin’leri son eylemi eylem bağdaştırıcıları üzerinden yürütür

Kanal plugin’leri için SDK yüzeyi
`ChannelMessageActionAdapter.describeMessageTool(...)` şeklindedir. Bu birleşik keşif
çağrısı, bir plugin’in görünen eylemlerini, yeteneklerini ve şema
katkılarını birlikte döndürmesini sağlar; böylece bu parçalar birbirinden kopmaz.

Çekirdek, çalışma zamanı kapsamını bu keşif adımına geçirir. Önemli alanlar şunlardır:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- güvenilir gelen `requesterSenderId`

Bu, bağlama duyarlı plugin’ler için önemlidir. Bir kanal, çekirdekte
`message` aracı içinde kanala özgü dallanmaları sabit kodlamadan, etkin hesap,
mevcut oda/iş parçacığı/mesaj veya güvenilir istek sahibinin kimliğine göre
mesaj eylemlerini gizleyebilir ya da gösterebilir.

Bu nedenle gömülü çalıştırıcı yönlendirme değişiklikleri hâlâ plugin işidir: çalıştırıcı,
paylaşılan `message` aracının mevcut dönüş için doğru kanal sahipli yüzeyi açığa çıkarması için
mevcut sohbet/oturum kimliğini plugin keşif sınırına iletmekten sorumludur.

Kanalın sahip olduğu yürütme yardımcıları için, paketlenmiş plugin’ler yürütme
çalışma zamanını kendi uzantı modüllerinin içinde tutmalıdır. Çekirdek artık
`src/agents/tools` altında Discord, Slack, Telegram veya WhatsApp mesaj-eylem çalışma zamanlarına
sahip değildir. Ayrı `plugin-sdk/*-action-runtime` alt yolları yayımlamıyoruz ve paketlenmiş
plugin’ler kendi yerel çalışma zamanı kodlarını doğrudan
uzantı sahipli modüllerinden içe aktarmalıdır.

Aynı sınır genel olarak sağlayıcı adlı SDK yüzeyleri için de geçerlidir: çekirdek,
Slack, Discord, Signal,
WhatsApp veya benzeri uzantılar için kanala özgü kolaylık barrel’larını içe aktarmamalıdır. Çekirdek bir davranışa ihtiyaç duyuyorsa,
ya paketlenmiş plugin’in kendi `api.ts` / `runtime-api.ts` barrel’ını tüketmeli
ya da bu ihtiyacı paylaşılan SDK içindeki dar ve genel bir yeteneğe yükseltmelidir.

Özellikle anketler için iki yürütme yolu vardır:

- `outbound.sendPoll`, ortak anket modeline uyan kanallar için paylaşılan temel yoldur
- `actions.handleAction("poll")`, kanala özgü
  anket anlamları veya ek anket parametreleri için tercih edilen yoldur

Çekirdek artık paylaşılan anket ayrıştırmayı, plugin anket dağıtımı eylemi reddettikten sonra erteler;
böylece plugin’in sahip olduğu anket işleyicileri, önce genel anket ayrıştırıcısı
tarafından engellenmeden kanala özgü anket alanlarını kabul edebilir.

Tam başlangıç dizisi için [Yükleme hattı](#load-pipeline) bölümüne bakın.

## Yetenek sahipliği modeli

OpenClaw, yerel bir plugin’i ilişkisiz entegrasyonların
toplandığı bir torba olarak değil, bir **şirket** veya bir **özellik** için sahiplik sınırı olarak ele alır.

Bu şu anlama gelir:

- bir şirket plugin’i genellikle o şirkete ait tüm OpenClaw yüzeylerine sahip olmalıdır
- bir özellik plugin’i, genellikle tanıttığı tam özellik yüzeyine sahip olmalıdır
- kanallar, sağlayıcı davranışını geçici biçimde yeniden uygulamak yerine
  ortak çekirdek yeteneklerini tüketmelidir

Örnekler:

- paketlenmiş `openai` plugin’i OpenAI model-sağlayıcı davranışına ve OpenAI
  konuşma + gerçek zamanlı ses + medya-anlama + görsel-üretim davranışına sahiptir
- paketlenmiş `elevenlabs` plugin’i ElevenLabs konuşma davranışına sahiptir
- paketlenmiş `microsoft` plugin’i Microsoft konuşma davranışına sahiptir
- paketlenmiş `google` plugin’i Google model-sağlayıcı davranışına ve ayrıca Google
  medya-anlama + görsel-üretim + web-arama davranışına sahiptir
- paketlenmiş `firecrawl` plugin’i Firecrawl web-getirme davranışına sahiptir
- paketlenmiş `minimax`, `mistral`, `moonshot` ve `zai` plugin’leri
  medya-anlama arka uçlarına sahiptir
- paketlenmiş `qwen` plugin’i Qwen metin-sağlayıcı davranışına ve ayrıca
  medya-anlama ile video-üretim davranışına sahiptir
- `voice-call` plugin’i bir özellik plugin’idir: çağrı taşımasını, araçları,
  CLI’yi, rotaları ve Twilio medya-akışı köprülemesini sahiplenir, ancak satıcı plugin’lerini
  doğrudan içe aktarmak yerine paylaşılan konuşma ile gerçek zamanlı yazıya dökme ve
  gerçek zamanlı ses yeteneklerini tüketir

Amaçlanan son durum şudur:

- OpenAI, metin modelleri, konuşma, görseller ve
  gelecekte video kapsasa bile tek bir plugin’de yaşar
- başka bir satıcı da kendi yüzey alanı için aynı şeyi yapabilir
- kanallar hangi satıcı plugin’inin sağlayıcıya sahip olduğunu önemsemez; çekirdek tarafından açığa çıkarılan
  paylaşılan yetenek sözleşmesini tüketirler

Bu temel ayrımdır:

- **plugin** = sahiplik sınırı
- **capability** = birden fazla plugin’in uygulayabildiği veya tüketebildiği çekirdek sözleşmesi

Dolayısıyla OpenClaw video gibi yeni bir alan eklerse ilk soru
“hangi sağlayıcı video işlemeyi sabit kodlamalı?” değildir. İlk soru
“çekirdek video yetenek sözleşmesi nedir?” olmalıdır. Bu sözleşme var olduktan sonra,
satıcı plugin’leri buna kaydolabilir ve kanal/özellik plugin’leri bunu tüketebilir.

Yetenek henüz yoksa doğru adım genellikle şudur:

1. eksik yeteneği çekirdekte tanımlayın
2. bunu plugin API’si/çalışma zamanı üzerinden türlü şekilde açığa çıkarın
3. kanalları/özellikleri bu yeteneğe bağlayın
4. satıcı plugin’lerinin uygulamaları kaydetmesine izin verin

Bu, tek bir satıcıya veya tek seferlik plugin’e özgü bir kod yoluna bağlı
çekirdek davranıştan kaçınırken sahipliği açık tutar.

### Yetenek katmanlaması

Kodun nereye ait olduğuna karar verirken şu zihinsel modeli kullanın:

- **çekirdek yetenek katmanı**: paylaşılan orkestrasyon, politika, geri dönüş,
  yapılandırma birleştirme kuralları, teslim semantiği ve türlü sözleşmeler
- **satıcı plugin katmanı**: satıcıya özgü API’ler, kimlik doğrulama, model katalogları, konuşma
  sentezi, görsel üretimi, gelecekte video arka uçları, kullanım uç noktaları
- **kanal/özellik plugin katmanı**: çekirdek yetenekleri tüketen ve bunları bir yüzeyde sunan
  Slack/Discord/voice-call/vb. entegrasyonları

Örneğin TTS şu yapıyı izler:

- çekirdek, yanıt zamanı TTS politikasına, geri dönüş sırasına, tercihlere ve kanal teslimatına sahiptir
- `openai`, `elevenlabs` ve `microsoft` sentez uygulamalarına sahiptir
- `voice-call`, telefon TTS çalışma zamanı yardımcısını tüketir

Aynı desen gelecekteki yetenekler için de tercih edilmelidir.

### Çok yetenekli şirket plugin’i örneği

Bir şirket plugin’i dışarıdan bakıldığında bütünlüklü hissettirmelidir. OpenClaw’da modeller, konuşma, gerçek zamanlı yazıya dökme, gerçek zamanlı ses, medya
anlama, görsel üretimi, video üretimi, web getirme ve web arama için paylaşılan
sözleşmeler varsa, bir satıcı tüm yüzeylerine tek yerde sahip olabilir:

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

Önemli olan tam yardımcı adları değildir. Şekil önemlidir:

- tek bir plugin satıcı yüzeyine sahiptir
- çekirdek yine de yetenek sözleşmelerine sahiptir
- kanallar ve özellik plugin’leri satıcı kodunu değil `api.runtime.*` yardımcılarını tüketir
- sözleşme testleri, plugin’in sahip olduğunu iddia ettiği yetenekleri kaydettiğini doğrulayabilir

### Yetenek örneği: video anlama

OpenClaw zaten görsel/ses/video anlamayı tek bir ortak
yetenek olarak ele alır. Aynı sahiplik modeli burada da geçerlidir:

1. çekirdek medya-anlama sözleşmesini tanımlar
2. satıcı plugin’leri duruma göre `describeImage`, `transcribeAudio` ve
   `describeVideo` kaydeder
3. kanallar ve özellik plugin’leri, doğrudan satıcı koduna bağlanmak yerine
   paylaşılan çekirdek davranışı tüketir

Bu, tek bir sağlayıcının video varsayımlarının çekirdeğe gömülmesini önler. Plugin
satıcı yüzeyine sahiptir; çekirdek ise yetenek sözleşmesine ve geri dönüş davranışına sahiptir.

Video üretimi de zaten aynı diziyi kullanır: çekirdek türlü
yetenek sözleşmesine ve çalışma zamanı yardımcısına sahiptir, satıcı plugin’leri ise
bunlara karşı `api.registerVideoGenerationProvider(...)` uygulamalarını kaydeder.

Somut bir yaygınlaştırma kontrol listesine mi ihtiyacınız var? Bkz.
[Yetenek Yemek Kitabı](/tools/capability-cookbook).

## Sözleşmeler ve zorunlu kılma

Plugin API yüzeyi, kasıtlı olarak türlüdür ve
`OpenClawPluginApi` içinde merkezileştirilmiştir. Bu sözleşme, desteklenen kayıt noktalarını ve
bir plugin’in güvenebileceği çalışma zamanı yardımcılarını tanımlar.

Bunun neden önemli olduğu:

- plugin yazarları tek ve kararlı bir iç standarda sahip olur
- çekirdek, aynı sağlayıcı kimliğini iki plugin’in kaydetmesi gibi
  yinelenen sahipliği reddedebilir
- başlangıç, bozuk kayıtlar için uygulanabilir tanılar gösterebilir
- sözleşme testleri, paketlenmiş plugin sahipliğini zorunlu kılabilir ve sessiz kaymayı önleyebilir

İki zorunlu kılma katmanı vardır:

1. **çalışma zamanı kayıt zorunluluğu**
   Plugin kayıt sistemi, plugin’ler yüklenirken kayıtları doğrular. Örnekler:
   yinelenen sağlayıcı kimlikleri, yinelenen konuşma sağlayıcı kimlikleri ve bozuk
   kayıtlar, tanımsız davranış yerine plugin tanıları üretir.
2. **sözleşme testleri**
   Paketlenmiş plugin’ler, test çalışmaları sırasında sözleşme kayıtlarına yakalanır; böylece
   OpenClaw sahipliği açıkça doğrulayabilir. Bugün bu, model
   sağlayıcıları, konuşma sağlayıcıları, web arama sağlayıcıları ve paketlenmiş kayıt
   sahipliği için kullanılmaktadır.

Pratik etkisi şudur: OpenClaw, hangi yüzeye hangi plugin’in sahip olduğunu
başlangıçtan itibaren bilir. Bu, çekirdek ve kanalların sorunsuz
bir şekilde birleşmesini sağlar; çünkü sahiplik örtük değil, beyan edilmiş, türlü ve test edilebilir durumdadır.

### Bir sözleşmeye neler aittir

İyi plugin sözleşmeleri:

- türlüdür
- küçüktür
- yeteneğe özeldir
- çekirdeğe aittir
- birden çok plugin tarafından yeniden kullanılabilir
- satıcı bilgisi olmadan kanallar/özellikler tarafından tüketilebilir

Kötü plugin sözleşmeleri:

- çekirdekte gizlenmiş satıcıya özgü politika
- kayıt sistemini atlayan tek seferlik plugin kaçış delikleri
- kanal kodunun doğrudan bir satıcı uygulamasına ulaşması
- `OpenClawPluginApi` veya
  `api.runtime` parçası olmayan geçici çalışma zamanı nesneleri

Emin değilseniz soyutlama düzeyini yükseltin: önce yeteneği tanımlayın, sonra
plugin’lerin buna bağlanmasına izin verin.

## Yürütme modeli

Yerel OpenClaw plugin’leri Gateway ile **aynı süreç içinde** çalışır. Yalıtılmış
değildirler. Yüklenen bir yerel plugin, çekirdek kod ile aynı süreç düzeyinde
güven sınırına sahiptir.

Sonuçlar:

- yerel bir plugin araçlar, ağ işleyicileri, hook’lar ve hizmetler kaydedebilir
- yerel bir plugin hatası ağ geçidini çökertebilir veya kararsızlaştırabilir
- kötü niyetli bir yerel plugin,
  OpenClaw süreci içinde keyfi kod yürütmeye eşdeğerdir

Uyumlu paketler varsayılan olarak daha güvenlidir çünkü OpenClaw şu anda bunları
meta veri/içerik paketleri olarak ele alır. Geçerli sürümlerde bu çoğunlukla paketlenmiş
Skills anlamına gelir.

Paketlenmemiş plugin’ler için izin listeleri ve açık yükleme/yükleme yolları kullanın. Çalışma alanı plugin’lerini üretim varsayılanları olarak değil, geliştirme zamanı kodu olarak değerlendirin.

Paketlenmiş çalışma alanı paket adları için, plugin kimliğini npm
adına sabitleyin: varsayılan olarak `@openclaw/<id>` veya kasıtlı olarak daha dar bir plugin rolü
açığa çıkaran paketler için `-provider`, `-plugin`, `-speech`, `-sandbox` ya da `-media-understanding`
gibi onaylanmış türlü son ekler kullanın.

Önemli güven notu:

- `plugins.allow`, kaynak kökenine değil **plugin kimliklerine** güvenir.
- Paketlenmiş bir plugin ile aynı kimliğe sahip bir çalışma alanı plugin’i,
  etkinleştirildiğinde/izin listesine eklendiğinde paketlenmiş kopyayı kasıtlı olarak gölgeler.
- Bu normaldir ve yerel geliştirme, yama testi ve düzeltmeler için faydalıdır.

## Dışa aktarma sınırı

OpenClaw, uygulama kolaylıklarını değil yetenekleri dışa aktarır.

Yetenek kaydını açık tutun. Sözleşme olmayan yardımcı dışa aktarımlarını budayın:

- paketlenmiş plugin’e özgü yardımcı alt yollar
- açık API olması amaçlanmayan çalışma zamanı tesisat alt yolları
- satıcıya özgü kolaylık yardımcıları
- uygulama ayrıntısı olan kurulum/başlangıç yardımcıları

Bazı paketlenmiş plugin yardımcı alt yolları uyumluluk ve paketlenmiş
plugin bakımı için hâlâ oluşturulmuş SDK dışa aktarma haritasında durmaktadır. Geçerli örnekler arasında
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` ve çeşitli `plugin-sdk/matrix*` yüzeyleri bulunur. Bunları
yeni üçüncü taraf plugin’ler için önerilen SDK deseni olarak değil,
uygulama ayrıntısına ait ayrılmış dışa aktarımlar olarak değerlendirin.

## Yükleme hattı

Başlangıçta OpenClaw kabaca şunu yapar:

1. aday plugin köklerini keşfeder
2. yerel veya uyumlu paket manifestlerini ve paket meta verilerini okur
3. güvenli olmayan adayları reddeder
4. plugin yapılandırmasını normalize eder (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. her aday için etkinleştirmeye karar verir
6. etkin yerel modülleri jiti aracılığıyla yükler
7. yerel `register(api)` (veya eski bir takma ad olan `activate(api)`) hook’larını çağırır ve kayıtları plugin kayıt sisteminde toplar
8. kayıt sistemini komut/çalışma zamanı yüzeylerine açar

<Note>
`activate`, `register` için eski bir takma addır — yükleyici mevcut olanı (`def.register ?? def.activate`) çözer ve aynı noktada çağırır. Tüm paketlenmiş plugin’ler `register` kullanır; yeni plugin’ler için `register` tercih edin.
</Note>

Güvenlik kapıları çalışma zamanı yürütmesinden **önce** gerçekleşir. Adaylar,
giriş plugin kökünün dışına çıkıyorsa, yol herkes tarafından yazılabiliyorsa veya
paketlenmemiş plugin’lerde yol sahipliği şüpheli görünüyorsa engellenir.

### Önce manifest davranışı

Manifest, denetim düzlemi için gerçeğin kaynağıdır. OpenClaw bunu şunlar için kullanır:

- plugin’i tanımlamak
- beyan edilen kanalları/Skills/yapılandırma şemasını veya paket yeteneklerini keşfetmek
- `plugins.entries.<id>.config` doğrulamak
- Control UI etiketlerini/yer tutucularını zenginleştirmek
- yükleme/katalog meta verilerini göstermek

Yerel plugin’ler için çalışma zamanı modülü veri düzlemi parçasıdır. Hook’lar, araçlar, komutlar veya sağlayıcı akışları gibi gerçek davranışları kaydeder.

### Yükleyicinin önbelleğe aldığı şeyler

OpenClaw, şunlar için kısa süreli süreç içi önbellekler tutar:

- keşif sonuçları
- manifest kayıt verileri
- yüklenmiş plugin kayıtları

Bu önbellekler ani başlangıç yükünü ve tekrarlanan komut ek yükünü azaltır. Bunları
kalıcılık değil, kısa ömürlü performans önbellekleri olarak düşünmek güvenlidir.

Performans notu:

- Bu önbellekleri devre dışı bırakmak için `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` veya
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` ayarlayın.
- Önbellek pencerelerini `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` ve
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` ile ayarlayın.

## Kayıt modeli

Yüklenen plugin’ler rastgele çekirdek global değişkenleri doğrudan değiştirmez. Bunun yerine
merkezi bir plugin kayıt sistemine kaydolurlar.

Kayıt sistemi şunları izler:

- plugin kayıtları (kimlik, kaynak, köken, durum, tanılar)
- araçlar
- eski hook’lar ve türlü hook’lar
- kanallar
- sağlayıcılar
- gateway RPC işleyicileri
- HTTP rotaları
- CLI kaydedicileri
- arka plan hizmetleri
- plugin’in sahip olduğu komutlar

Çekirdek özellikler daha sonra doğrudan plugin modülleriyle konuşmak yerine bu kayıt sisteminden okur.
Bu, yüklemeyi tek yönlü tutar:

- plugin modülü -> kayıt sistemi kaydı
- çekirdek çalışma zamanı -> kayıt sistemi tüketimi

Bu ayrım bakım kolaylığı için önemlidir. Çekirdek yüzeylerin çoğunun yalnızca bir entegrasyon
noktasına ihtiyaç duyması anlamına gelir: “kayıt sistemini oku”, “her plugin modülünü özel duruma çevir”
değil.

## Konuşma bağlama geri çağrıları

Bir konuşmayı bağlayan plugin’ler, bir onay çözüldüğünde tepki verebilir.

Bir bağlama isteği onaylandıktan veya reddedildikten sonra geri çağrı almak için
`api.onConversationBindingResolved(...)` kullanın:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Geri çağrı yük alanları:

- `status`: `"approved"` veya `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` veya `"deny"`
- `binding`: onaylanan istekler için çözülmüş bağlama
- `request`: özgün istek özeti, ayırma ipucu, gönderici kimliği ve
  konuşma meta verisi

Bu geri çağrı yalnızca bildirim içindir. Bir konuşmayı kimin bağlayabileceğini değiştirmez ve
çekirdek onay işleme tamamlandıktan sonra çalışır.

## Sağlayıcı çalışma zamanı hook’ları

Sağlayıcı plugin’leri artık iki katmana sahiptir:

- manifest meta verisi: çalışma zamanı yüklemeden önce düşük maliyetli ortam tabanlı kimlik doğrulama araması için `providerAuthEnvVars`; ayrıca çalışma zamanı yüklemeden önce düşük maliyetli onboarding/auth-choice
  etiketleri ve CLI bayrağı meta verisi için `providerAuthChoices`
- yapılandırma zamanı hook’ları: `catalog` / eski `discovery` ve `applyConfigDefaults`
- çalışma zamanı hook’ları: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `contributeResolvedModelCompat`, `capabilities`,
  `normalizeToolSchemas`, `inspectToolSchemas`,
  `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`,
  `wrapStreamFn`, `resolveTransportTurnState`,
  `resolveWebSocketSessionPolicy`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `isCacheTtlEligible`,
  `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`,
  `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw hâlâ genel ajan döngüsüne, yük devrine, döküm işleme ve
araç politikasına sahiptir. Bu hook’lar, tümüyle özel bir çıkarım taşımasına gerek kalmadan
sağlayıcıya özgü davranış için uzantı yüzeyidir.

Sağlayıcının, genel auth/status/model-picker yollarının sağlayıcı çalışma zamanını yüklemeden
görebileceği ortam tabanlı kimlik bilgileri varsa manifest `providerAuthEnvVars` kullanın.
Onboarding/auth-choice CLI yüzeylerinin sağlayıcının seçim kimliğini, grup etiketlerini ve
basit tek bayraklı auth kablolamasını sağlayıcı çalışma zamanını yüklemeden bilmesi gerekiyorsa
manifest `providerAuthChoices` kullanın. Sağlayıcı çalışma zamanındaki
`envVars` alanını ise operatör odaklı ipuçları; örneğin onboarding etiketleri veya OAuth
client-id/client-secret kurulum değişkenleri için tutun.

### Hook sırası ve kullanım

Model/sağlayıcı plugin’leri için OpenClaw, hook’ları kabaca şu sırayla çağırır.
“Ne zaman kullanılır” sütunu hızlı karar rehberidir.

| #   | Hook                              | Ne yapar                                                                                | Ne zaman kullanılır                                                                                                                         |
| --- | --------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` oluşturulurken sağlayıcı yapılandırmasını `models.providers` içine yayımlar | Sağlayıcı bir kataloğa veya temel URL varsayılanlarına sahipse                                                                              |
| 2   | `applyConfigDefaults`             | Yapılandırma somutlaştırma sırasında sağlayıcı sahipli genel yapılandırma varsayılanlarını uygular | Varsayılanlar auth modu, ortam veya sağlayıcı model-ailesi semantiğine bağlıysa                                                             |
| --  | _(yerleşik model araması)_        | OpenClaw önce normal kayıt/katalog yolunu dener                                         | _(bir plugin hook’u değildir)_                                                                                                              |
| 3   | `normalizeModelId`                | Aramadan önce eski veya önizleme model-kimliği takma adlarını normalize eder            | Sağlayıcı, kanonik model çözümlemesinden önce takma ad temizliğine sahipse                                                                  |
| 4   | `normalizeTransport`              | Genel model derlemesinden önce sağlayıcı-ailesi `api` / `baseUrl` normalize eder         | Sağlayıcı, aynı taşıma ailesindeki özel sağlayıcı kimlikleri için taşıma temizliğine sahipse                                                |
| 5   | `normalizeConfig`                 | Çalışma zamanı/sağlayıcı çözümlemesinden önce `models.providers.<id>` normalize eder    | Sağlayıcı, plugin ile birlikte yaşaması gereken yapılandırma temizliğine ihtiyaç duyuyorsa; paketlenmiş Google-ailesi yardımcıları da desteklenen Google yapılandırma girdilerini son çare olarak temizler |
| 6   | `applyNativeStreamingUsageCompat` | Yapılandırma sağlayıcılarına yerel akış-kullanım uyumluluk yeniden yazımlarını uygular | Sağlayıcı, uç nokta odaklı yerel akış kullanım meta veri düzeltmelerine ihtiyaç duyuyorsa                                                   |
| 7   | `resolveConfigApiKey`             | Çalışma zamanı auth yüklemesinden önce yapılandırma sağlayıcıları için env-marker auth’ı çözer | Sağlayıcının, sağlayıcı sahipli env-marker API anahtarı çözümlemesi varsa; `amazon-bedrock` burada yerleşik bir AWS env-marker çözücüsüne de sahiptir |
| 8   | `resolveSyntheticAuth`            | Açık metni kalıcılaştırmadan yerel/kendi kendine barındırılan veya yapılandırma destekli auth’ı yüzeye çıkarır | Sağlayıcı sentetik/yerel kimlik bilgisi işaretleyicisiyle çalışabiliyorsa                                                                   |
| 9   | `shouldDeferSyntheticProfileAuth` | Kaydedilmiş sentetik profil yer tutucularını ortam/yapılandırma destekli auth’ın arkasına düşürür | Sağlayıcı, öncelik kazanmaması gereken sentetik yer tutucu profiller saklıyorsa                                                             |
| 10  | `resolveDynamicModel`             | Henüz yerel kayıtta olmayan sağlayıcı sahipli model kimlikleri için eşzamanlı geri dönüş | Sağlayıcı keyfi yukarı akış model kimliklerini kabul ediyorsa                                                                               |
| 11  | `prepareDynamicModel`             | Eşzamansız ısındırma yapar, ardından `resolveDynamicModel` yeniden çalışır               | Sağlayıcının bilinmeyen kimlikleri çözmeden önce ağ meta verisine ihtiyacı varsa                                                            |
| 12  | `normalizeResolvedModel`          | Gömülü çalıştırıcı çözülmüş modeli kullanmadan önce son yeniden yazımı yapar            | Sağlayıcı taşıma yeniden yazımlarına ihtiyaç duyuyor ama yine de çekirdek taşıma kullanıyorsa                                               |
| 13  | `contributeResolvedModelCompat`   | Başka bir uyumlu taşıma arkasındaki satıcı modelleri için uyumluluk bayrakları katkılar | Sağlayıcı sağlayıcıyı devralmadan proxy taşımalar üzerindeki kendi modellerini tanıyorsa                                                    |
| 14  | `capabilities`                    | Paylaşılan çekirdek mantık tarafından kullanılan sağlayıcı sahipli döküm/araç meta verisi | Sağlayıcının döküm/sağlayıcı-ailesi farklılıklarına ihtiyacı varsa                                                                          |
| 15  | `normalizeToolSchemas`            | Gömülü çalıştırıcı görmeden önce araç şemalarını normalize eder                         | Sağlayıcı taşıma-ailesi şema temizliğine ihtiyaç duyuyorsa                                                                                  |
| 16  | `inspectToolSchemas`              | Normalizasyondan sonra sağlayıcı sahipli şema tanılarını yüzeye çıkarır                 | Sağlayıcı, çekirdeğe sağlayıcıya özgü kurallar öğretmeden anahtar kelime uyarıları istiyorsa                                                |
| 17  | `resolveReasoningOutputMode`      | Yerel ile etiketli akıl yürütme çıktısı sözleşmesi arasında seçim yapar                  | Sağlayıcı yerel alanlar yerine etiketli akıl yürütme/nihai çıktı istiyorsa                                                                  |
| 18  | `prepareExtraParams`              | Genel akış seçenek sarmalayıcılarından önce istek parametresi normalizasyonu yapar      | Sağlayıcı varsayılan istek parametrelerine veya sağlayıcı başına parametre temizliğine ihtiyaç duyuyorsa                                    |
| 19  | `createStreamFn`                  | Normal akış yolunu tümüyle özel bir taşıma ile değiştirir                               | Sağlayıcı yalnızca bir sarmalayıcı değil, özel bir tel protokolüne ihtiyaç duyuyorsa                                                        |
| 20  | `wrapStreamFn`                    | Genel sarmalayıcılar uygulandıktan sonra akışı sarar                                    | Sağlayıcının özel bir taşıma olmadan istek üstbilgisi/gövdesi/model uyumluluk sarmalayıcılarına ihtiyacı varsa                             |
| 21  | `resolveTransportTurnState`       | Yerel dönüş başına taşıma üstbilgilerini veya meta verisini ekler                       | Sağlayıcı genel taşımaların sağlayıcıya özgü yerel dönüş kimliğini göndermesini istiyorsa                                                  |
| 22  | `resolveWebSocketSessionPolicy`   | Yerel WebSocket üstbilgilerini veya oturum soğuma politikasını ekler                    | Sağlayıcı genel WS taşımalarının oturum üstbilgilerini veya geri dönüş politikasını ayarlamasını istiyorsa                                 |
| 23  | `formatApiKey`                    | Auth-profil biçimlendiricisi: saklanan profil, çalışma zamanındaki `apiKey` dizesine dönüşür | Sağlayıcı ek auth meta verisi saklıyorsa ve özel bir çalışma zamanı belirteç şekline ihtiyaç duyuyorsa                                     |
| 24  | `refreshOAuth`                    | Özel yenileme uç noktaları veya yenileme-başarısızlık politikası için OAuth yenilemesini geçersiz kılar | Sağlayıcı paylaşılan `pi-ai` yenileyicilerine uymuyorsa                                                                                     |
| 25  | `buildAuthDoctorHint`             | OAuth yenilemesi başarısız olduğunda eklenen onarım ipucu                               | Sağlayıcı yenileme başarısızlığından sonra sağlayıcı sahipli auth onarım rehberliğine ihtiyaç duyuyorsa                                    |
| 26  | `matchesContextOverflowError`     | Sağlayıcı sahipli bağlam penceresi taşma eşleştiricisi                                  | Sağlayıcının genel sezgisellerin kaçıracağı ham taşma hataları varsa                                                                        |
| 27  | `classifyFailoverReason`          | Sağlayıcı sahipli yük devri neden sınıflandırması                                       | Sağlayıcı ham API/taşıma hatalarını rate-limit/overload/vb. türlerine eşleyebiliyorsa                                                      |
| 28  | `isCacheTtlEligible`              | Proxy/arka taşıma sağlayıcıları için istem önbelleği politikası                         | Sağlayıcının proxy’ye özgü önbellek TTL kapılamasına ihtiyacı varsa                                                                         |
| 29  | `buildMissingAuthMessage`         | Genel eksik-auth kurtarma mesajının yerine geçer                                        | Sağlayıcının sağlayıcıya özgü eksik-auth kurtarma ipucuna ihtiyacı varsa                                                                    |
| 30  | `suppressBuiltInModel`            | Eski yukarı akış model bastırması ve isteğe bağlı kullanıcıya dönük hata ipucu          | Sağlayıcı eski yukarı akış satırlarını gizlemeye veya bunları bir satıcı ipucuyla değiştirmeye ihtiyaç duyuyorsa                           |
| 31  | `augmentModelCatalog`             | Keşiften sonra eklenen sentetik/nihai katalog satırları                                 | Sağlayıcı `models list` ve seçicilere sentetik ileri uyum satırları eklemeye ihtiyaç duyuyorsa                                             |
| 32  | `isBinaryThinking`                | İkili-düşünme sağlayıcıları için açık/kapalı akıl yürütme geçişi                        | Sağlayıcı yalnızca ikili açık/kapalı düşünme sunuyorsa                                                                                      |
| 33  | `supportsXHighThinking`           | Seçili modeller için `xhigh` akıl yürütme desteği                                       | Sağlayıcı `xhigh` desteğini yalnızca modellerin bir alt kümesinde istiyorsa                                                                 |
| 34  | `resolveDefaultThinkingLevel`     | Belirli bir model ailesi için varsayılan `/think` seviyesi                              | Sağlayıcı bir model ailesi için varsayılan `/think` politikasına sahipse                                                                    |
| 35  | `isModernModelRef`                | Canlı profil filtreleri ve smoke seçimi için modern-model eşleştiricisi                 | Sağlayıcı canlı/smoke tercihli model eşleştirmesine sahipse                                                                                 |
| 36  | `prepareRuntimeAuth`              | Çıkarımdan hemen önce yapılandırılmış bir kimlik bilgisini gerçek çalışma zamanı belirtecine/anahtarına dönüştürür | Sağlayıcı belirteç değişimine veya kısa ömürlü istek kimlik bilgisine ihtiyaç duyuyorsa                                                    |
| 37  | `resolveUsageAuth`                | `/usage` ve ilgili durum yüzeyleri için kullanım/faturalama kimlik bilgilerini çözer    | Sağlayıcının özel kullanım/kota belirteç ayrıştırmasına veya farklı bir kullanım kimlik bilgisine ihtiyacı varsa                           |
| 38  | `fetchUsageSnapshot`              | Auth çözüldükten sonra sağlayıcıya özgü kullanım/kota anlık görüntülerini getirir ve normalize eder | Sağlayıcının sağlayıcıya özgü kullanım uç noktasına veya yük ayrıştırıcısına ihtiyacı varsa                                                |
| 39  | `createEmbeddingProvider`         | Bellek/arama için sağlayıcı sahipli bir embedding bağdaştırıcısı oluşturur              | Bellek embedding davranışı sağlayıcı plugin’iyle birlikte yaşamalıdır                                                                       |
| 40  | `buildReplayPolicy`               | Sağlayıcı için döküm işleme kontrol eden bir replay politikası döndürür                 | Sağlayıcı özel döküm politikası istiyorsa (ör. düşünme bloklarının çıkarılması)                                                             |
| 41  | `sanitizeReplayHistory`           | Genel döküm temizliğinden sonra replay geçmişini yeniden yazar                          | Sağlayıcının paylaşılan sıkıştırma yardımcılarının ötesinde sağlayıcıya özgü replay yeniden yazımlarına ihtiyacı varsa                     |
| 42  | `validateReplayTurns`             | Gömülü çalıştırıcıdan önce son replay dönüş doğrulamasını veya yeniden şekillendirmesini yapar | Sağlayıcı taşımasının genel temizlemeden sonra daha sıkı dönüş doğrulamasına ihtiyacı varsa                                                |
| 43  | `onModelSelected`                 | Sağlayıcı sahipli seçim sonrası yan etkileri çalıştırır                                 | Sağlayıcının bir model etkin olduğunda telemetriye veya sağlayıcı sahipli duruma ihtiyacı varsa                                            |

`normalizeModelId`, `normalizeTransport` ve `normalizeConfig` önce
eşleşen sağlayıcı plugin’ini kontrol eder, sonra model kimliğini veya
taşımayı/yapılandırmayı gerçekten değiştiren biri çıkana kadar diğer hook yetenekli sağlayıcı plugin’lerine düşer.
Bu, çağıranın hangi paketlenmiş plugin’in yeniden yazıma sahip olduğunu bilmesini gerektirmeden
takma ad/uyumluluk sağlayıcı şimlerinin çalışmasını sağlar. Bir sağlayıcı hook’u desteklenen
Google-ailesi yapılandırma girdisini yeniden yazmazsa, paketlenmiş Google yapılandırma normalleştiricisi
yine de bu uyumluluk temizliğini uygular.

Sağlayıcının tümüyle özel bir tel protokolüne veya özel istek yürütücüsüne ihtiyacı varsa,
bu farklı bir uzantı sınıfıdır. Bu hook’lar, yine de OpenClaw’un normal çıkarım
döngüsünde çalışan sağlayıcı davranışları içindir.

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

- Anthropic, `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`
  ve `wrapStreamFn` kullanır; çünkü Claude 4.6 ileri uyumluluğuna,
  sağlayıcı-ailesi ipuçlarına, auth onarım rehberliğine, kullanım uç noktası entegrasyonuna,
  istem önbelleği uygunluğuna, auth farkında yapılandırma varsayılanlarına, Claude
  varsayılan/uyarlamalı düşünme politikasına ve beta üstbilgileri,
  `/fast` / `serviceTier` ve `context1m` için Anthropic’e özgü akış şekillendirmesine sahiptir.
- Anthropic’in Claude’a özgü akış yardımcıları şimdilik paketlenmiş plugin’in
  kendi açık `api.ts` / `contract-api.ts` yüzeyinde kalır. Bu paket yüzeyi,
  genel SDK’yı tek bir sağlayıcının beta-header kuralları etrafında genişletmek yerine
  `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` ve daha düşük seviyeli
  Anthropic sarmalayıcı kurucularını dışa aktarır.
- OpenAI, `resolveDynamicModel`, `normalizeResolvedModel` ve
  `capabilities` ile birlikte `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` ve `isModernModelRef`
  kullanır; çünkü GPT-5.4 ileri uyumluluğuna, doğrudan OpenAI
  `openai-completions` -> `openai-responses` normalizasyonuna, Codex farkında auth
  ipuçlarına, Spark bastırmasına, sentetik OpenAI liste satırlarına ve GPT-5 düşünme /
  canlı-model politikasına sahiptir; `openai-responses-defaults` akış ailesi ise
  atıf üstbilgileri, `/fast`/`serviceTier`, metin ayrıntı seviyesi, yerel Codex web arama,
  reasoning-compat yük şekillendirme ve Responses bağlam yönetimi için
  paylaşılan yerel OpenAI Responses sarmalayıcılarına sahiptir.
- OpenRouter, geçişli olduğu ve yeni
  model kimliklerini OpenClaw’un statik kataloğu güncellenmeden önce açığa çıkarabildiği için `catalog` ile birlikte
  `resolveDynamicModel` ve `prepareDynamicModel` kullanır; ayrıca
  sağlayıcıya özgü istek üstbilgileri, yönlendirme meta verisi, akıl yürütme yamaları ve
  istem önbelleği politikasını çekirdek dışında tutmak için `capabilities`, `wrapStreamFn` ve `isCacheTtlEligible` de kullanır. Replay politikası
  `passthrough-gemini` ailesinden gelirken, `openrouter-thinking` akış ailesi
  proxy akıl yürütme enjeksiyonuna ve desteklenmeyen model / `auto` atlamalarına sahiptir.
- GitHub Copilot, `catalog`, `auth`, `resolveDynamicModel` ve
  `capabilities` ile birlikte `prepareRuntimeAuth` ve `fetchUsageSnapshot` kullanır; çünkü
  sağlayıcı sahipli cihaz oturum açma, model geri dönüş davranışı, Claude döküm
  farklılıkları, GitHub token -> Copilot token değişimi ve sağlayıcı sahipli kullanım
  uç noktası gerekir.
- OpenAI Codex, `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` ve `augmentModelCatalog` ile birlikte
  `prepareExtraParams`, `resolveUsageAuth` ve `fetchUsageSnapshot` kullanır; çünkü
  hâlâ çekirdek OpenAI taşımaları üzerinde çalışsa da taşıma/base URL
  normalizasyonuna, OAuth yenileme geri dönüş politikasına, varsayılan taşıma seçimine,
  sentetik Codex katalog satırlarına ve ChatGPT kullanım uç noktası entegrasyonuna sahiptir;
  doğrudan OpenAI ile aynı `openai-responses-defaults` akış ailesini paylaşır.
- Google AI Studio ve Gemini CLI OAuth, `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` ve `isModernModelRef` kullanır; çünkü
  `google-gemini` replay ailesi Gemini 3.1 ileri uyumluluk geri dönüşüne,
  yerel Gemini replay doğrulamasına, bootstrap replay temizliğine, etiketli
  akıl yürütme çıktısı moduna ve modern-model eşleştirmesine sahiptir; `google-thinking`
  akış ailesi ise Gemini thinking yük normalizasyonuna sahiptir;
  Gemini CLI OAuth ayrıca `formatApiKey`, `resolveUsageAuth` ve
  `fetchUsageSnapshot` kullanarak token biçimlendirme, token ayrıştırma ve kota uç noktası
  kablolamasını yapar.
- Anthropic Vertex, `buildReplayPolicy`’yi
  `anthropic-by-model` replay ailesi üzerinden kullanır; böylece Claude’a özgü replay temizliği,
  her `anthropic-messages` taşıması yerine Claude kimlikleriyle sınırlı kalır.
- Amazon Bedrock, `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` ve `resolveDefaultThinkingLevel` kullanır; çünkü
  Anthropic-on-Bedrock trafiği için Bedrock’a özgü throttle/not-ready/context-overflow hata sınıflandırmasına sahiptir;
  replay politikası ise aynı yalnızca-Claude `anthropic-by-model`
  korumasını paylaşır.
- OpenRouter, Kilocode, Opencode ve Opencode Go, `buildReplayPolicy` kullanır
  `passthrough-gemini` replay ailesi üzerinden; çünkü Gemini
  modellerini OpenAI uyumlu taşımalar üzerinden proxy eder ve yerel Gemini replay doğrulaması veya
  bootstrap yeniden yazımları olmadan Gemini düşünce-imzası temizliğine ihtiyaç duyarlar.
- MiniMax, `buildReplayPolicy` kullanır
  `hybrid-anthropic-openai` replay ailesi üzerinden; çünkü tek bir sağlayıcı hem
  Anthropic-message hem de OpenAI uyumlu anlambilime sahiptir; Anthropic tarafında Claude’a özgü
  düşünme bloğu düşürmeyi korurken akıl yürütme çıktı modunu tekrar yerel moda çevirir ve
  `minimax-fast-mode` akış ailesi ortak akış yolunda
  fast-mode model yeniden yazımlarına sahiptir.
- Moonshot, `catalog` ile birlikte `wrapStreamFn` kullanır; çünkü hâlâ ortak
  OpenAI taşımasını kullanır ama sağlayıcı sahipli düşünme yükü normalizasyonuna ihtiyaç duyar;
  `moonshot-thinking` akış ailesi yapılandırma ile `/think` durumunu kendi
  yerel ikili düşünme yüküne eşler.
- Kilocode, `catalog`, `capabilities`, `wrapStreamFn` ve
  `isCacheTtlEligible` kullanır; çünkü sağlayıcı sahipli istek üstbilgilerine,
  akıl yürütme yükü normalizasyonuna, Gemini döküm ipuçlarına ve Anthropic
  önbellek-TTL kapılamasına ihtiyaç duyar; `kilocode-thinking` akış ailesi ise
  `kilo/auto` ve açık akıl yürütme yüklerini desteklemeyen
  diğer proxy model kimliklerini atlayarak ortak proxy akış yolunda Kilo thinking enjeksiyonunu tutar.
- Z.AI, `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` ve `fetchUsageSnapshot` kullanır; çünkü GLM-5 geri dönüşüne,
  `tool_stream` varsayılanlarına, ikili düşünme UX’ine, modern-model eşleştirmesine
  ve hem kullanım auth’ına hem kota getirmeye sahiptir; `tool-stream-default-on` akış ailesi
  varsayılan açık `tool_stream` sarmalayıcısını sağlayıcı başına el yazımı yapıştırıcı dışında tutar.
- xAI, `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` ve `isModernModelRef`
  kullanır; çünkü yerel xAI Responses taşıma normalizasyonuna, Grok fast-mode
  takma ad yeniden yazımlarına, varsayılan `tool_stream`, strict-tool / reasoning-payload
  temizliğine, plugin sahipli araçlar için geri dönüş auth tekrar kullanımına, ileri uyumlu Grok
  model çözümlemesine ve xAI araç-şema
  profili, desteklenmeyen şema anahtar kelimeleri, yerel `web_search` ve HTML-entity
  araç çağrısı bağımsız değişken çözümleme gibi sağlayıcı sahipli uyumluluk yamalarına sahiptir.
- Mistral, OpenCode Zen ve OpenCode Go, döküm/araç
  farklılıklarını çekirdek dışında tutmak için yalnızca `capabilities` kullanır.
- `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` ve `volcengine` gibi
  yalnızca katalog sağlayan paketlenmiş sağlayıcılar yalnızca `catalog` kullanır.
- Qwen, metin sağlayıcısı için `catalog`, ayrıca çok modlu
  yüzeyleri için ortak medya-anlama ve video-üretim kayıtlarını kullanır.
- MiniMax ve Xiaomi, çıkarım hâlâ ortak taşımalar üzerinden çalışsa da
  `/usage` davranışları plugin sahipli olduğu için `catalog` ile birlikte kullanım hook’larını kullanır.

## Çalışma zamanı yardımcıları

Plugin’ler, `api.runtime` aracılığıyla seçili çekirdek yardımcılarına erişebilir. TTS için:

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
- PCM ses arabelleği + örnekleme hızı döndürür. Plugin’ler sağlayıcılar için yeniden örnekleme/kodlama yapmalıdır.
- `listVoices`, sağlayıcı başına isteğe bağlıdır. Bunu satıcı sahipli ses seçicileri veya kurulum akışları için kullanın.
- Ses listeleri, sağlayıcı farkındalıklı seçiciler için yerel ayar, cinsiyet ve kişilik etiketleri gibi daha zengin meta veriler içerebilir.
- Bugün telefon desteği OpenAI ve ElevenLabs tarafında vardır. Microsoft’ta yoktur.

Plugin’ler ayrıca `api.registerSpeechProvider(...)` üzerinden konuşma sağlayıcıları kaydedebilir.

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

- TTS politikasını, geri dönüşü ve yanıt teslimini çekirdekte tutun.
- Satıcı sahipli sentez davranışı için konuşma sağlayıcıları kullanın.
- Eski Microsoft `edge` girdisi `microsoft` sağlayıcı kimliğine normalize edilir.
- Tercih edilen sahiplik modeli şirket odaklıdır: OpenClaw bu
  yetenek sözleşmelerini ekledikçe tek bir satıcı plugin’i
  metin, konuşma, görsel ve gelecekte medya sağlayıcılarına sahip olabilir.

Görsel/ses/video anlama için plugin’ler genel bir anahtar/değer torbası yerine
tek türlü medya-anlama sağlayıcısı kaydeder:

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

- Orkestrasyonu, geri dönüşü, yapılandırmayı ve kanal kablolamasını çekirdekte tutun.
- Satıcı davranışını sağlayıcı plugin’inde tutun.
- Toplamsal genişleme türlü kalmalıdır: yeni isteğe bağlı yöntemler, yeni isteğe bağlı
  sonuç alanları, yeni isteğe bağlı yetenekler.
- Video üretimi zaten aynı deseni izler:
  - çekirdek yetenek sözleşmesine ve çalışma zamanı yardımcısına sahiptir
  - satıcı plugin’leri `api.registerVideoGenerationProvider(...)` kaydeder
  - özellik/kanal plugin’leri `api.runtime.videoGeneration.*` tüketir

Medya-anlama çalışma zamanı yardımcıları için plugin’ler şunları çağırabilir:

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

Ses yazıya dökme için plugin’ler medya-anlama çalışma zamanını veya
eski STT takma adını kullanabilir:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Notlar:

- `api.runtime.mediaUnderstanding.*`, görsel/ses/video anlama için
  tercih edilen paylaşılan yüzeydir.
- Çekirdek medya-anlama ses yapılandırmasını (`tools.media.audio`) ve sağlayıcı geri dönüş sırasını kullanır.
- Yazıya dökme çıktısı üretilmediğinde `{ text: undefined }` döndürür (örneğin atlanan/desteklenmeyen giriş).
- `api.runtime.stt.transcribeAudioFile(...)` bir uyumluluk takma adı olarak kalır.

Plugin’ler ayrıca `api.runtime.subagent` aracılığıyla arka plan alt ajan çalıştırmaları başlatabilir:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Notlar:

- `provider` ve `model`, kalıcı oturum değişiklikleri değil, çalıştırma başına geçersiz kılmalardır.
- OpenClaw bu geçersiz kılma alanlarını yalnızca güvenilir çağıranlar için dikkate alır.
- Plugin’in sahip olduğu geri dönüş çalıştırmaları için operatörlerin
  `plugins.entries.<id>.subagent.allowModelOverride: true` ile açıkça izin vermesi gerekir.
- Güvenilir plugin’leri belirli kanonik `provider/model` hedefleriyle sınırlamak için
  `plugins.entries.<id>.subagent.allowedModels` kullanın veya açıkça herhangi bir hedefe izin vermek için `"*"` kullanın.
- Güvenilmeyen plugin alt ajan çalıştırmaları yine çalışır, ancak geçersiz kılma istekleri
  sessizce geri düşmek yerine reddedilir.

Web arama için plugin’ler, ajan araç kablolamasına
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

Plugin’ler ayrıca
`api.registerWebSearchProvider(...)` aracılığıyla web arama sağlayıcıları kaydedebilir.

Notlar:

- Sağlayıcı seçimini, kimlik bilgisi çözümlemesini ve paylaşılan istek anlambilimini çekirdekte tutun.
- Satıcıya özgü arama taşımaları için web arama sağlayıcılarını kullanın.
- `api.runtime.webSearch.*`, ajan araç sarmalayıcısına bağımlı olmadan arama davranışı gereken
  özellik/kanal plugin’leri için tercih edilen paylaşılan yüzeydir.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: yapılandırılmış görsel üretimi sağlayıcı zincirini kullanarak bir görsel üretir.
- `listProviders(...)`: kullanılabilir görsel üretimi sağlayıcılarını ve yeteneklerini listeler.

## Gateway HTTP rotaları

Plugin’ler `api.registerHttpRoute(...)` ile HTTP uç noktaları açığa çıkarabilir.

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
- `auth`: zorunlu. Normal gateway auth gerektirmek için `"gateway"`, plugin tarafından yönetilen auth/webhook doğrulaması için `"plugin"` kullanın.
- `match`: isteğe bağlı. `"exact"` (varsayılan) veya `"prefix"`.
- `replaceExisting`: isteğe bağlı. Aynı plugin’in kendi mevcut rota kaydını değiştirmesine izin verir.
- `handler`: rota isteği işlediyse `true` döndürün.

Notlar:

- `api.registerHttpHandler(...)` kaldırıldı ve plugin yükleme hatasına neden olur. Bunun yerine `api.registerHttpRoute(...)` kullanın.
- Plugin rotaları `auth` alanını açıkça beyan etmelidir.
- Tam `path + match` çakışmaları, `replaceExisting: true` olmadıkça reddedilir ve bir plugin başka bir plugin’in rotasını değiştiremez.
- Farklı `auth` düzeylerine sahip örtüşen rotalar reddedilir. `exact`/`prefix` geçiş zincirlerini yalnızca aynı auth düzeyinde tutun.
- `auth: "plugin"` rotaları otomatik olarak operatör çalışma zamanı kapsamları almaz. Bunlar ayrıcalıklı Gateway yardımcı çağrıları için değil, plugin tarafından yönetilen webhook/imza doğrulaması içindir.
- `auth: "gateway"` rotaları bir Gateway istek çalışma zamanı kapsamı içinde çalışır, ancak bu kapsam kasıtlı olarak muhafazakârdır:
  - paylaşılan gizli bearer auth (`gateway.auth.mode = "token"` / `"password"`) plugin-rotası çalışma zamanı kapsamlarını, çağıran `x-openclaw-scopes` gönderse bile `operator.write` düzeyinde tutar
  - güvenilir kimlik taşıyan HTTP modları (örneğin `trusted-proxy` veya özel bir girişte `gateway.auth.mode = "none"`) `x-openclaw-scopes` üstbilgisini yalnızca üstbilgi açıkça mevcutsa dikkate alır
  - bu kimlik taşıyan plugin-rotası isteklerinde `x-openclaw-scopes` yoksa, çalışma zamanı kapsamı `operator.write` değerine geri döner
- Pratik kural: gateway auth’lı bir plugin rotasının örtük yönetici yüzeyi olduğunu varsaymayın. Rotanızın yalnızca yöneticiye açık davranışa ihtiyacı varsa, kimlik taşıyan bir auth modu gerektirin ve açık `x-openclaw-scopes` üstbilgisi sözleşmesini belgelendirin.

## Plugin SDK içe aktarma yolları

Plugin yazarken tek parça `openclaw/plugin-sdk` içe aktarımı yerine
SDK alt yollarını kullanın:

- Plugin kayıt ilkelleri için `openclaw/plugin-sdk/plugin-entry`.
- Genel paylaşılan plugin odaklı sözleşme için `openclaw/plugin-sdk/core`.
- Kök `openclaw.json` Zod şema dışa aktarımı
  (`OpenClawSchema`) için `openclaw/plugin-sdk/config-schema`.
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
  `openclaw/plugin-sdk/webhook-ingress` gibi kararlı kanal ilkelleri; paylaşılan kurulum/auth/yanıt/webhook
  kablolaması içindir. `channel-inbound`; debounce, bahsetme eşleştirme,
  zarf biçimlendirme ve gelen zarf bağlam yardımcılarının ortak evidir.
  `channel-setup`, dar isteğe bağlı kurulum yüzeyidir.
  `setup-runtime`, `setupEntry` /
  ertelenmiş başlangıç tarafından kullanılan, içe aktarma açısından güvenli kurulum yama bağdaştırıcılarını da içeren
  çalışma zamanı güvenli kurulum yüzeyidir.
  `setup-adapter-runtime`, ortama duyarlı hesap-kurulum bağdaştırıcı yüzeyidir.
  `setup-tools`, küçük CLI/arşiv/belge yardımcı yüzeyidir (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
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
  `openclaw/plugin-sdk/directory-runtime` gibi alan alt yolları; paylaşılan çalışma zamanı/yapılandırma yardımcıları içindir.
  `telegram-command-config`, Telegram özel
  komut normalizasyonu/doğrulaması için dar açık yüzeydir ve paketlenmiş
  Telegram sözleşme yüzeyi geçici olarak kullanılamaz olduğunda da erişilebilir kalır.
  `text-runtime`, asistan görünür metin temizleme,
  markdown işleme/parçalama yardımcıları, redaksiyon
  yardımcıları, directive-tag yardımcıları ve güvenli metin araçları dâhil
  paylaşılan metin/markdown/günlük yüzeyidir.
- Onaya özgü kanal yüzeyleri, plugin üzerindeki tek bir `approvalCapability`
  sözleşmesini tercih etmelidir. Çekirdek daha sonra onay auth, teslim, render ve
  yerel yönlendirme davranışını bu tek yetenek üzerinden okur; ilgisiz
  plugin alanlarına onay davranışı karıştırmaz.
- `openclaw/plugin-sdk/channel-runtime` artık önerilmez ve yalnızca
  eski plugin’ler için uyumluluk şimi olarak kalır. Yeni kod, bunun yerine daha dar
  genel ilkelleri içe aktarmalıdır ve depo kodu şim için yeni içe aktarımlar eklememelidir.
- Paketlenmiş uzantı iç yapıları özel kalır. Dış plugin’ler yalnızca
  `openclaw/plugin-sdk/*` alt yollarını kullanmalıdır. OpenClaw çekirdek/test kodu,
  `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` ve `login-qr-api.js` gibi dar kapsamlı
  dosyalar dâhil olmak üzere bir plugin paket kökü altındaki depo açık giriş noktalarını kullanabilir.
  Çekirdekten veya başka bir uzantıdan hiçbir zaman bir plugin paketinin `src/*` yolunu içe aktarmayın.
- Depo giriş noktası ayrımı:
  `<plugin-package-root>/api.js` yardımcı/tür barrel’ıdır,
  `<plugin-package-root>/runtime-api.js` yalnızca çalışma zamanı barrel’ıdır,
  `<plugin-package-root>/index.js` paketlenmiş plugin girişidir,
  ve `<plugin-package-root>/setup-entry.js` kurulum plugin girişidir.
- Geçerli paketlenmiş sağlayıcı örnekleri:
  - Anthropic, `wrapAnthropicProviderStream`, beta-header yardımcıları ve `service_tier`
    ayrıştırması gibi Claude akış yardımcıları için `api.js` / `contract-api.js` kullanır.
  - OpenAI, sağlayıcı kurucuları, varsayılan model yardımcıları ve
    gerçek zamanlı sağlayıcı kurucuları için `api.js` kullanır.
  - OpenRouter, sağlayıcı kurucusu ve onboarding/config
    yardımcıları için `api.js` kullanırken, `register.runtime.js` depo içi kullanım için
    genel `plugin-sdk/provider-stream` yardımcılarını yeniden dışa aktarabilir.
- Facade ile yüklenen açık giriş noktaları, varsa etkin çalışma zamanı yapılandırma anlık görüntüsünü
  tercih eder; OpenClaw henüz çalışma zamanı anlık görüntüsü sunmuyorsa
  disk üzerindeki çözülmüş yapılandırma dosyasına geri düşer.
- Genel paylaşılan ilkeller, tercih edilen açık SDK sözleşmesi olmaya devam eder. Paketlenmiş kanal markalı küçük bir ayrılmış
  yardımcı yüzey uyumluluk için hâlâ vardır. Bunları yeni
  üçüncü taraf içe aktarma hedefleri olarak değil, paketlenmiş bakım/uyumluluk yüzeyleri olarak değerlendirin;
  yeni kanal arası sözleşmeler yine genel `plugin-sdk/*` alt yollarına veya
  plugin yerel `api.js` / `runtime-api.js` barrel’larına yerleşmelidir.

Uyumluluk notu:

- Yeni kod için kök `openclaw/plugin-sdk` barrel’ından kaçının.
- Önce dar kararlı ilkelleri tercih edin. Daha yeni kurulum/eşleme/yanıt/
  geri bildirim/sözleşme/gelen/iş parçacığı/komut/secret-input/webhook/infra/
  allowlist/status/message-tool alt yolları, yeni
  paketlenmiş ve dış plugin çalışmaları için amaçlanan sözleşmedir.
  Hedef ayrıştırma/eşleştirme `openclaw/plugin-sdk/channel-targets` üzerinde olmalıdır.
  Mesaj eylem kapıları ve tepki message-id yardımcıları ise
  `openclaw/plugin-sdk/channel-actions` üzerinde yer almalıdır.
- Paketlenmiş uzantıya özgü yardımcı barrel’lar varsayılan olarak kararlı değildir. Bir
  yardımcı yalnızca paketlenmiş bir uzantı tarafından gerekiyorsa, bunu
  `openclaw/plugin-sdk/<extension>` içine yükseltmek yerine uzantının yerel `api.js` veya `runtime-api.js`
  yüzeyinin arkasında tutun.
- Yeni paylaşılan yardımcı yüzeyler kanal markalı değil, genel olmalıdır. Paylaşılan hedef
  ayrıştırma `openclaw/plugin-sdk/channel-targets` üzerinde yer almalıdır; kanala özgü
  iç yapılar ise sahip plugin’in yerel `api.js` veya `runtime-api.js`
  yüzeyinin arkasında kalmalıdır.
- `image-generation`,
  `media-understanding` ve `speech` gibi yeteneğe özgü alt yollar bugün paketlenmiş/yerel plugin’ler
  bunları kullandığı için vardır. Bunların varlığı tek başına dışa aktarılan her yardımcının
  uzun vadeli donmuş bir dış sözleşme olduğu anlamına gelmez.

## Mesaj araç şemaları

Plugin’ler kanala özgü `describeMessageTool(...)` şema
katkılarına sahip olmalıdır. Sağlayıcıya özgü alanları paylaşılan çekirdekte değil plugin’de tutun.

Paylaşılan taşınabilir şema parçaları için,
`openclaw/plugin-sdk/channel-actions` aracılığıyla dışa aktarılan genel yardımcıları yeniden kullanın:

- düğme ızgarası tarzı yükler için `createMessageToolButtonsSchema()`
- yapılandırılmış kart yükleri için `createMessageToolCardSchema()`

Bir şema biçimi yalnızca tek bir sağlayıcı için anlamlıysa, bunu
paylaşılan SDK’ya yükseltmek yerine o plugin’in kendi kaynağında tanımlayın.

## Kanal hedef çözümleme

Kanal plugin’leri kanala özgü hedef anlambilimine sahip olmalıdır. Paylaşılan
giden ana bilgisayarı genel tutun ve mesajlaşma bağdaştırıcı yüzeyini sağlayıcı kuralları için kullanın:

- `messaging.inferTargetChatType({ to })`, normalize edilmiş bir hedefin
  dizin aramasından önce `direct`, `group` veya `channel` olarak değerlendirilip değerlendirilmemesine karar verir.
- `messaging.targetResolver.looksLikeId(raw, normalized)`, bir
  girdinin dizin araması yerine doğrudan kimlik benzeri çözümlemeye atlaması gerekip gerekmediğini çekirdeğe söyler.
- `messaging.targetResolver.resolveTarget(...)`, çekirdeğin normalizasyondan veya
  dizin kaçırmasından sonra son sağlayıcı sahipli çözümlemeye ihtiyaç duyduğunda kullandığı plugin geri dönüşüdür.
- `messaging.resolveOutboundSessionRoute(...)`, bir hedef çözüldükten sonra
  sağlayıcıya özgü oturum rota kurulumuna sahiptir.

Önerilen ayrım:

- Eşler/gruplar aranmasından önce gerçekleşmesi gereken kategori kararları için `inferTargetChatType` kullanın.
- “Buna açık/yerel hedef kimliği gibi davran” denetimleri için `looksLikeId` kullanın.
- Geniş dizin araması için değil, sağlayıcıya özgü normalizasyon geri dönüşü için `resolveTarget` kullanın.
- Sohbet kimlikleri, iş parçacığı kimlikleri, JID’ler, handle’lar ve oda kimlikleri gibi
  sağlayıcıya özgü yerel kimlikleri genel SDK alanlarında değil `target` değerleri veya
  sağlayıcıya özgü parametreler içinde tutun.

## Yapılandırma destekli dizinler

Yapılandırmadan dizin girdileri türeten plugin’ler bu mantığı plugin içinde tutmalı
ve `openclaw/plugin-sdk/directory-runtime`
içindeki paylaşılan yardımcıları yeniden kullanmalıdır.

Bir kanalın şu tür yapılandırma destekli eşler/gruplara ihtiyaç duyduğu durumlarda bunu kullanın:

- izin listesi tabanlı DM eşleri
- yapılandırılmış kanal/grup eşlemeleri
- hesap kapsamlı statik dizin geri dönüşleri

`directory-runtime` içindeki paylaşılan yardımcılar yalnızca genel işlemleri ele alır:

- sorgu filtreleme
- sınır uygulama
- tekilleştirme/normalizasyon yardımcıları
- `ChannelDirectoryEntry[]` oluşturma

Kanala özgü hesap inceleme ve kimlik normalizasyonu plugin uygulaması içinde kalmalıdır.

## Sağlayıcı katalogları

Sağlayıcı plugin’leri, çıkarım için model kataloglarını
`registerProvider({ catalog: { run(...) { ... } } })` ile tanımlayabilir.

`catalog.run(...)`, OpenClaw’un `models.providers` içine yazdığı şeklin aynısını döndürür:

- tek sağlayıcı girişi için `{ provider }`
- birden çok sağlayıcı girişi için `{ providers }`

Plugin sağlayıcıya özgü model kimliklerine, temel URL varsayılanlarına veya auth kapılı model meta verisine sahipse
`catalog` kullanın.

`catalog.order`, bir plugin’in kataloğunun OpenClaw’un yerleşik örtük sağlayıcılarına göre
ne zaman birleşeceğini kontrol eder:

- `simple`: düz API anahtarı veya ortam odaklı sağlayıcılar
- `profile`: auth profilleri olduğunda görünen sağlayıcılar
- `paired`: ilişkili birden çok sağlayıcı girdisi sentezleyen sağlayıcılar
- `late`: diğer örtük sağlayıcılardan sonra son geçiş

Daha sonra gelen sağlayıcılar anahtar çakışmasında kazanır; böylece plugin’ler aynı
sağlayıcı kimliğine sahip yerleşik sağlayıcı girdisini bilinçli olarak geçersiz kılabilir.

Uyumluluk:

- `discovery` eski bir takma ad olarak hâlâ çalışır
- hem `catalog` hem `discovery` kaydedilmişse, OpenClaw `catalog` kullanır

## Salt okunur kanal incelemesi

Plugin’iniz bir kanal kaydediyorsa,
`resolveAccount(...)` ile birlikte `plugin.config.inspectAccount(cfg, accountId)` uygulamayı tercih edin.

Neden:

- `resolveAccount(...)` çalışma zamanı yoludur. Kimlik bilgilerinin tamamen somutlaştırıldığını varsayabilir
  ve gerekli gizli bilgiler eksik olduğunda hızlıca başarısız olabilir.
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` ve doctor/config
  onarım akışları gibi salt okunur komut yolları; yapılandırmayı açıklamak için
  çalışma zamanı kimlik bilgilerini somutlaştırmak zorunda kalmamalıdır.

Önerilen `inspectAccount(...)` davranışı:

- Yalnızca açıklayıcı hesap durumunu döndürün.
- `enabled` ve `configured` değerlerini koruyun.
- İlgili olduğunda kimlik bilgisi kaynağı/durum alanlarını ekleyin; örneğin:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Salt okunur kullanılabilirliği raporlamak için ham belirteç değerlerini döndürmeniz gerekmez.
  `tokenStatus: "available"` döndürmek (ve eşleşen kaynak alanıyla birlikte)
  durum tarzı komutlar için yeterlidir.
- SecretRef ile yapılandırılmış ama geçerli komut yolunda kullanılamayan
  bir kimlik bilgisi için `configured_unavailable` kullanın.

Bu, salt okunur komutların “bu komut yolunda kullanılamıyor ama yapılandırılmış”
durumunu raporlamasını sağlar; çökme ya da hesabı yanlışlıkla yapılandırılmamış olarak göstermelerini değil.

## Paket paketleri

Bir plugin dizini, `openclaw.extensions` içeren bir `package.json` dosyasına sahip olabilir:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Her giriş bir plugin olur. Paket birden çok uzantı listeliyorsa, plugin kimliği
`name/<fileBase>` olur.

Plugin’iniz npm bağımlılıkları içe aktarıyorsa, `node_modules`
erişilebilir olsun diye bunları o dizinde kurun (`npm install` / `pnpm install`).

Güvenlik koruması: her `openclaw.extensions` girişi,
symlink çözümlemesinden sonra plugin dizininin içinde kalmalıdır. Paket dizininin dışına kaçan girişler
reddedilir.

Güvenlik notu: `openclaw plugins install`, plugin bağımlılıklarını
`npm install --omit=dev --ignore-scripts` ile kurar (yaşam döngüsü betikleri yok, çalışma zamanında geliştirme bağımlılıkları yok). Plugin bağımlılık
ağaçlarını “saf JS/TS” tutun ve `postinstall` derlemeleri gerektiren paketlerden kaçının.

İsteğe bağlı: `openclaw.setupEntry`, hafif bir yalnızca-kurulum modülünü gösterebilir.
OpenClaw, devre dışı bir kanal plugin’i için kurulum yüzeylerine ihtiyaç duyduğunda veya
bir kanal plugin’i etkin ama henüz yapılandırılmamış olduğunda, tam plugin girişi yerine
`setupEntry` yükler. Bu, özellikle ana plugin girişiniz araçlar, hook’lar veya
diğer yalnızca çalışma zamanı kodlarını da bağlıyorsa başlangıcı ve kurulumu daha hafif tutar.

İsteğe bağlı: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`,
bir kanal plugin’ini gateway’in
dinleme öncesi başlangıç aşamasında, kanal zaten yapılandırılmış olsa bile aynı `setupEntry` yoluna alabilir.

Bunu yalnızca `setupEntry`, ağ geçidi dinlemeye başlamadan önce
var olması gereken başlangıç yüzeyini tamamen kapsıyorsa kullanın. Pratikte bu şu anlama gelir:
kurulum girişi, başlangıcın bağlı olduğu kanal sahipli tüm yetenekleri kaydetmelidir; örneğin:

- kanal kaydının kendisi
- gateway dinlemeye başlamadan önce kullanılabilir olması gereken tüm HTTP rotaları
- aynı pencerede var olması gereken tüm gateway yöntemleri, araçlar veya hizmetler

Tam girişiniz hâlâ gerekli başlangıç yeteneklerinden herhangi birine sahipse,
bu bayrağı etkinleştirmeyin. Plugin’i varsayılan davranışta bırakın ve OpenClaw’un
başlangıç sırasında tam girişi yüklemesine izin verin.

Paketlenmiş kanallar ayrıca çekirdeğin tam kanal çalışma zamanı yüklenmeden önce danışabileceği
yalnızca-kurulum sözleşme yüzeyi yardımcıları yayımlayabilir. Geçerli kurulum yükseltme yüzeyi şudur:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Çekirdek bu yüzeyi, tam plugin girişini yüklemeden eski bir tek hesaplı kanal
yapılandırmasını `channels.<id>.accounts.*` içine yükseltmesi gerektiğinde kullanır.
Matrix şu anki paketlenmiş örnektir: adlandırılmış hesaplar zaten varsa yalnızca auth/bootstrap anahtarlarını
adlandırılmış yükseltilmiş bir hesaba taşır ve her zaman
`accounts.default` oluşturmak yerine yapılandırılmış standart dışı bir varsayılan hesap anahtarını koruyabilir.

Bu kurulum yama bağdaştırıcıları paketlenmiş sözleşme yüzeyi keşfini tembel tutar.
İçe aktarma zamanı hafif kalır; yükseltme yüzeyi, modül içe aktarımında yeniden
paketlenmiş kanal başlangıcına girmek yerine yalnızca ilk kullanımda yüklenir.

Bu başlangıç yüzeyleri gateway RPC yöntemleri içerdiğinde, bunları
plugin’e özgü bir önek üzerinde tutun. Çekirdek yönetici ad alanları (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış kalır ve
bir plugin daha dar kapsam istese bile her zaman `operator.admin` olarak çözülür.

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

### Kanal katalog meta verisi

Kanal plugin’leri kurulum/keşif meta verisini `openclaw.channel` ile, yükleme ipuçlarını da `openclaw.install` ile
ilan edebilir. Bu, çekirdek kataloğu verisiz tutar.

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

Asgari örneğin ötesinde yararlı `openclaw.channel` alanları:

- `detailLabel`: daha zengin katalog/durum yüzeyleri için ikincil etiket
- `docsLabel`: belge bağlantısı için bağlantı metnini geçersiz kılar
- `preferOver`: bu katalog girdisinin geride bırakması gereken daha düşük öncelikli plugin/kanal kimlikleri
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: seçim yüzeyi kopya denetimleri
- `markdownCapable`: giden biçimlendirme kararları için kanalı markdown uyumlu olarak işaretler
- `showConfigured`: `false` olduğunda kanalı yapılandırılmış kanal listeleme yüzeylerinden gizler
- `quickstartAllowFrom`: kanalı standart hızlı başlangıç `allowFrom` akışına dahil eder
- `forceAccountBinding`: yalnızca bir hesap olsa bile açık hesap bağlamasını zorunlu kılar
- `preferSessionLookupForAnnounceTarget`: duyuru hedefi çözümlemede oturum aramasını tercih eder

OpenClaw ayrıca **dış kanal kataloglarını** (örneğin bir MPM
kayıt dışa aktarımı) da birleştirebilir. Bir JSON dosyasını şu yollardan birine bırakın:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Veya `OPENCLAW_PLUGIN_CATALOG_PATHS` (ya da `OPENCLAW_MPM_CATALOG_PATHS`) değişkenini
bir veya daha fazla JSON dosyasına yönlendirin (virgül/noktalı virgül/`PATH` ayrımlı). Her dosya
şunu içermelidir: `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Ayrıştırıcı, `"entries"` anahtarı için eski takma adlar olarak `"packages"` veya `"plugins"` değerlerini de kabul eder.

## Bağlam motoru plugin’leri

Bağlam motoru plugin’leri, alım, derleme
ve sıkıştırma için oturum bağlamı orkestrasyonuna sahiptir. Bunları plugin’inizden
`api.registerContextEngine(id, factory)` ile kaydedin, ardından etkin motoru
`plugins.slots.contextEngine` ile seçin.

Bunu, plugin’inizin varsayılan bağlam
hattını yalnızca bellek arama veya hook eklemek yerine değiştirmesi ya da genişletmesi gerektiğinde kullanın.

```ts
export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Motorunuz sıkıştırma algoritmasına **sahip değilse**, `compact()`
uygulamasını koruyun ve bunu açıkça delege edin:

```ts
import { delegateCompactionToRuntime } from "openclaw/plugin-sdk/core";

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
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Yeni bir yetenek ekleme

Bir plugin mevcut API’ye uymayan bir davranışa ihtiyaç duyduğunda,
plugin sistemini özel doğrudan erişimle atlamayın. Eksik yeteneği ekleyin.

Önerilen sıra:

1. çekirdek sözleşmesini tanımlayın
   Çekirdeğin hangi ortak davranışa sahip olması gerektiğine karar verin: politika, geri dönüş, yapılandırma birleştirme,
   yaşam döngüsü, kanala dönük anlambilim ve çalışma zamanı yardımcı şekli.
2. türlü plugin kayıt/çalışma zamanı yüzeyleri ekleyin
   `OpenClawPluginApi` ve/veya `api.runtime` yüzeyini en küçük faydalı
   türlü yetenek yüzeyiyle genişletin.
3. çekirdek + kanal/özellik tüketicilerini bağlayın
   Kanal ve özellik plugin’leri yeni yeteneği doğrudan bir satıcı uygulamasını içe aktararak değil,
   çekirdek üzerinden tüketmelidir.
4. satıcı uygulamalarını kaydedin
   Ardından satıcı plugin’leri arka uçlarını bu yeteneğe karşı kaydeder.
5. sözleşme kapsamı ekleyin
   Sahipliğin ve kayıt şeklinin zaman içinde açık kalması için testler ekleyin.

OpenClaw bu şekilde bir satıcının dünya görüşüne sabit kodlanmadan
görüş sahibi kalır. Somut dosya kontrol listesi ve işlenmiş örnek için
[Yetenek Yemek Kitabı](/tools/capability-cookbook)’na bakın.

### Yetenek kontrol listesi

Yeni bir yetenek eklediğinizde, uygulama genellikle bu
yüzeylere birlikte dokunmalıdır:

- `src/<capability>/types.ts` içindeki çekirdek sözleşme türleri
- `src/<capability>/runtime.ts` içindeki çekirdek çalıştırıcı/çalışma zamanı yardımcısı
- `src/plugins/types.ts` içindeki plugin API kayıt yüzeyi
- `src/plugins/registry.ts` içindeki plugin kayıt sistemi kablolaması
- özellik/kanal plugin’lerinin tüketmesi gerektiğinde `src/plugins/runtime/*` altındaki
  plugin çalışma zamanı açığa çıkarımı
- `src/test-utils/plugin-registration.ts` içindeki yakalama/test yardımcıları
- `src/plugins/contracts/registry.ts` içindeki sahiplik/sözleşme doğrulamaları
- `docs/` içindeki operatör/plugin belgeleri

Bu yüzeylerden biri eksikse, bu genellikle yeteneğin
henüz tam olarak entegre edilmediğinin işaretidir.

### Yetenek şablonu

Asgari desen:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Sözleşme testi deseni:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Bu, kuralı basit tutar:

- çekirdek yetenek sözleşmesine + orkestrasyona sahiptir
- satıcı plugin’leri satıcı uygulamalarına sahiptir
- özellik/kanal plugin’leri çalışma zamanı yardımcılarını tüketir
- sözleşme testleri sahipliği açık tutar

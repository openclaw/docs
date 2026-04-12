---
read_when:
    - Yerel OpenClaw Pluginleri oluşturuyor veya hata ayıklıyorsunuz
    - Plugin yetenek modelini veya sahiplik sınırlarını anlamak
    - Plugin yükleme hattı veya kayıt sistemi üzerinde çalışmak
    - Sağlayıcı çalışma zamanı kancaları veya kanal Pluginleri uygulamak
sidebarTitle: Internals
summary: 'Plugin iç yapıları: yetenek modeli, sahiplik, sözleşmeler, yükleme hattı ve çalışma zamanı yardımcıları'
title: Plugin iç yapıları
x-i18n:
    generated_at: "2026-04-12T23:28:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37361c1e9d2da57c77358396f19dfc7f749708b66ff68f1bf737d051b5d7675d
    source_path: plugins/architecture.md
    workflow: 15
---

# Plugin iç yapıları

<Info>
  Bu, **derin mimari başvuru kaynağıdır**. Pratik kılavuzlar için şunlara bakın:
  - [Pluginleri kurun ve kullanın](/tr/tools/plugin) — kullanıcı kılavuzu
  - [Başlangıç](/tr/plugins/building-plugins) — ilk Plugin eğitimi
  - [Kanal Pluginleri](/tr/plugins/sdk-channel-plugins) — bir mesajlaşma kanalı oluşturun
  - [Sağlayıcı Pluginleri](/tr/plugins/sdk-provider-plugins) — bir model sağlayıcısı oluşturun
  - [SDK Genel Bakış](/tr/plugins/sdk-overview) — içe aktarma haritası ve kayıt API’si
</Info>

Bu sayfa, OpenClaw Plugin sisteminin iç mimarisini kapsar.

## Genel yetenek modeli

Yetenekler, OpenClaw içindeki genel **yerel Plugin** modelidir. Her
yerel OpenClaw Plugin’i bir veya daha fazla yetenek türüne karşı kayıt olur:

| Yetenek               | Kayıt yöntemi                                    | Örnek Pluginler                      |
| --------------------- | ------------------------------------------------ | ------------------------------------ |
| Metin çıkarımı        | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI çıkarım arka ucu  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Konuşma               | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Gerçek zamanlı yazıya döküm | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Gerçek zamanlı ses    | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Medya anlama          | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Görüntü oluşturma     | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Müzik oluşturma       | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Video oluşturma       | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Web getirme           | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Web arama             | `api.registerWebSearchProvider(...)`             | `google`                             |
| Kanal / mesajlaşma    | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

Sıfır yetenek kaydeden ancak kancalar, araçlar veya
hizmetler sağlayan bir Plugin, **yalnızca eski kanca kullanan** bir Plugin’dir. Bu kalıp hâlâ tamamen desteklenmektedir.

### Harici uyumluluk duruşu

Yetenek modeli çekirdeğe yerleşmiştir ve bugün paketlenmiş/yerel Pluginler
tarafından kullanılmaktadır, ancak harici Plugin uyumluluğu için hâlâ
“dışa aktarılmışsa sabittir” yaklaşımından daha sıkı bir çıta gerekir.

Geçerli yönlendirme:

- **mevcut harici Pluginler:** kanca tabanlı entegrasyonları çalışır durumda tutun;
  bunu uyumluluk temel çizgisi olarak değerlendirin
- **yeni paketlenmiş/yerel Pluginler:** satıcıya özgü içe sızmalar veya
  yeni yalnızca kanca tasarımları yerine açık yetenek kaydını tercih edin
- **yetenek kaydını benimseyen harici Pluginler:** izin verilir, ancak belgeler
  bir sözleşmeyi açıkça kararlı olarak işaretlemedikçe, yeteneğe özgü yardımcı yüzeyleri gelişen yapılar olarak değerlendirin

Pratik kural:

- yetenek kayıt API’leri amaçlanan yöndür
- geçiş sürecinde eski kancalar, harici Pluginler için en güvenli
  kırılmasız yol olmaya devam eder
- dışa aktarılan yardımcı alt yolların hepsi eşdeğer değildir; tesadüfi yardımcı dışa aktarımlarını değil,
  dar ve belgelenmiş sözleşmeyi tercih edin

### Plugin şekilleri

OpenClaw, yüklenen her Plugin’i, gerçek
kayıt davranışına göre bir şekle sınıflandırır (yalnızca statik meta verilere göre değil):

- **plain-capability** -- tam olarak bir yetenek türü kaydeder (örneğin
  `mistral` gibi yalnızca sağlayıcı olan bir Plugin)
- **hybrid-capability** -- birden fazla yetenek türü kaydeder (örneğin
  `openai`, metin çıkarımı, konuşma, medya anlama ve görüntü
  oluşturmanın sahibidir)
- **hook-only** -- yalnızca kancalar kaydeder (tipli veya özel), yetenek,
  araç, komut veya hizmet kaydetmez
- **non-capability** -- araçlar, komutlar, hizmetler veya yollar kaydeder ancak
  yetenek kaydetmez

Bir Plugin’in şeklini ve yetenek dökümünü görmek için `openclaw plugins inspect <id>` kullanın.
Ayrıntılar için [CLI başvurusu](/cli/plugins#inspect) sayfasına bakın.

### Eski kancalar

`before_agent_start` kancası, yalnızca kanca kullanan Pluginler için bir
uyumluluk yolu olarak desteklenmeye devam etmektedir. Eski gerçek dünya Pluginleri hâlâ buna bağlıdır.

Yön:

- çalışır durumda tutun
- bunu eski olarak belgeleyin
- model/sağlayıcı geçersiz kılma işleri için `before_model_resolve` tercih edin
- istem değişikliği işleri için `before_prompt_build` tercih edin
- ancak gerçek kullanım düştükten ve fikstür kapsamı geçiş güvenliğini kanıtladıktan sonra kaldırın

### Uyumluluk sinyalleri

`openclaw doctor` veya `openclaw plugins inspect <id>` çalıştırdığınızda,
şu etiketlerden birini görebilirsiniz:

| Sinyal                     | Anlamı                                                      |
| -------------------------- | ----------------------------------------------------------- |
| **config valid**           | Yapılandırma sorunsuz ayrıştırılır ve Pluginler çözümlenir  |
| **compatibility advisory** | Plugin desteklenen ama daha eski bir kalıp kullanıyor (örn. `hook-only`) |
| **legacy warning**         | Plugin, kullanımdan kaldırılmış olan `before_agent_start` kullanıyor |
| **hard error**             | Yapılandırma geçersiz veya Plugin yüklenemedi               |

Bugün ne `hook-only` ne de `before_agent_start` Plugin’inizi bozacaktır --
`hook-only` tavsiye niteliğindedir ve `before_agent_start` yalnızca bir uyarı tetikler. Bu
sinyaller `openclaw status --all` ve `openclaw plugins doctor` içinde de görünür.

## Mimariye genel bakış

OpenClaw’ın Plugin sistemi dört katmandan oluşur:

1. **Manifest + keşif**
   OpenClaw, yapılandırılmış yollardan, çalışma alanı köklerinden,
   genel uzantı köklerinden ve paketlenmiş uzantılardan aday Pluginleri bulur.
   Keşif önce yerel `openclaw.plugin.json` manifestlerini ve desteklenen paket manifestlerini okur.
2. **Etkinleştirme + doğrulama**
   Çekirdek, keşfedilen bir Plugin’in etkin mi, devre dışı mı, engellenmiş mi
   yoksa bellek gibi ayrıcalıklı bir yuva için seçilmiş mi olduğuna karar verir.
3. **Çalışma zamanı yükleme**
   Yerel OpenClaw Pluginleri jiti aracılığıyla süreç içinde yüklenir ve
   yetenekleri merkezi bir kayıt sistemine kaydeder. Uyumlu paketler,
   çalışma zamanı kodu içe aktarılmadan kayıt sistemindeki kayıtlara normalize edilir.
4. **Yüzey tüketimi**
   OpenClaw’ın geri kalanı kayıt sistemini okuyarak araçları, kanalları, sağlayıcı
   kurulumunu, kancaları, HTTP yollarını, CLI komutlarını ve hizmetleri sunar.

Özellikle Plugin CLI için, kök komut keşfi iki aşamaya bölünür:

- ayrıştırma zamanı meta verileri `registerCli(..., { descriptors: [...] })` içinden gelir
- gerçek Plugin CLI modülü tembel kalabilir ve ilk çağrıda kaydolabilir

Bu, Plugin’e ait CLI kodunu Plugin içinde tutarken OpenClaw’ın
ayrıştırmadan önce kök komut adlarını ayırmasına olanak tanır.

Önemli tasarım sınırı:

- keşif + yapılandırma doğrulaması, Plugin kodunu çalıştırmadan
  **manifest/şema meta verilerinden** çalışabilmelidir
- yerel çalışma zamanı davranışı, Plugin modülünün `register(api)` yolundan gelir

Bu ayrım, OpenClaw’ın yapılandırmayı doğrulamasına, eksik/devre dışı Pluginleri açıklamasına ve
tam çalışma zamanı etkin olmadan önce UI/şema ipuçları oluşturmasına olanak tanır.

### Kanal Pluginleri ve paylaşılan mesaj aracı

Kanal Pluginlerinin, normal sohbet eylemleri için ayrı bir gönder/düzenle/tepki aracı
kaydetmesi gerekmez. OpenClaw çekirdekte tek bir paylaşılan `message` aracını korur ve
kanala özgü keşif ile yürütme bunun arkasında kanal Pluginlerine aittir.

Geçerli sınır şudur:

- çekirdek, paylaşılan `message` araç hostunun, istem bağlamasının, oturum/iş parçacığı
  kayıtlarının ve yürütme sevkinin sahibidir
- kanal Pluginleri kapsamlı eylem keşfinin, yetenek keşfinin ve
  kanala özgü şema parçalarının sahibidir
- kanal Pluginleri, konuşma kimliklerinin iş parçacığı kimliklerini nasıl kodladığı veya
  üst konuşmalardan nasıl miras aldığı gibi, sağlayıcıya özgü oturum konuşma dil bilgisinin sahibidir
- kanal Pluginleri son eylemi kendi eylem bağdaştırıcıları üzerinden yürütür

Kanal Pluginleri için SDK yüzeyi
`ChannelMessageActionAdapter.describeMessageTool(...)` şeklindedir. Bu birleşik keşif
çağrısı, Plugin’in görünür eylemlerini, yeteneklerini ve şema
katkılarını birlikte döndürmesine olanak tanır; böylece bu parçalar birbirinden kopmaz.

Çekirdek, çalışma zamanı kapsamını bu keşif adımına geçirir. Önemli alanlar şunlardır:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- güvenilir gelen `requesterSenderId`

Bu, bağlama duyarlı Pluginler için önemlidir. Bir kanal,
çekirdek `message` aracı içinde kanala özgü dalları sabit kodlamadan, etkin hesaba,
mevcut odaya/iş parçacığına/mesaja veya güvenilir istek sahibinin kimliğine bağlı olarak
mesaj eylemlerini gizleyebilir ya da gösterebilir.

Bu nedenle gömülü çalıştırıcı yönlendirme değişiklikleri hâlâ Plugin işidir: çalıştırıcı,
paylaşılan `message` aracının mevcut tur için doğru, kanala ait
yüzeyi göstermesi amacıyla geçerli sohbet/oturum kimliğini Plugin
keşif sınırına iletmekten sorumludur.

Kanala ait yürütme yardımcıları için, paketlenmiş Pluginler yürütme
çalışma zamanını kendi uzantı modülleri içinde tutmalıdır. Çekirdek artık
`src/agents/tools` altında Discord,
Slack, Telegram veya WhatsApp mesaj-eylem çalışma zamanlarının sahibi değildir.
Ayrı `plugin-sdk/*-action-runtime` alt yolları yayımlamıyoruz ve paketlenmiş
Pluginler kendi yerel çalışma zamanı kodlarını doğrudan
kendi uzantılarına ait modüllerden içe aktarmalıdır.

Aynı sınır genel olarak sağlayıcı adlı SDK hatları için de geçerlidir: çekirdek,
Slack, Discord, Signal, WhatsApp veya benzeri uzantılar için kanala özgü
kolaylık varillerini içe aktarmamalıdır. Çekirdek bir davranışa ihtiyaç duyuyorsa,
ya paketlenmiş Plugin’in kendi `api.ts` / `runtime-api.ts` varilini tüketmeli
ya da ihtiyacı paylaşılan SDK içinde dar ve genel bir yetenek haline getirmelidir.

Özellikle anketler için iki yürütme yolu vardır:

- `outbound.sendPoll`, ortak anket modeline uyan kanallar için paylaşılan temel yoldur
- `actions.handleAction("poll")`, kanala özgü anket anlamları veya
  ek anket parametreleri için tercih edilen yoldur

Çekirdek artık paylaşılan anket ayrıştırmasını, Plugin anket sevki eylemi
reddettikten sonrasına erteler; böylece Plugin’e ait anket işleyicileri,
önce genel anket ayrıştırıcısı tarafından engellenmeden kanala özgü anket
alanlarını kabul edebilir.

Tam başlatma sırası için [Yükleme hattı](#load-pipeline) bölümüne bakın.

## Yetenek sahipliği modeli

OpenClaw, yerel bir Plugin’i ilgisiz entegrasyonların bir torbası olarak değil,
bir **şirketin** veya bir **özelliğin** sahiplik sınırı olarak ele alır.

Bu şu anlama gelir:

- bir şirket Plugin’i genellikle o şirketin OpenClaw’a dönük
  tüm yüzeylerinin sahibi olmalıdır
- bir özellik Plugin’i genellikle sunduğu tam özellik yüzeyinin sahibi olmalıdır
- kanallar, sağlayıcı davranışını geçici ve özel olarak yeniden uygulamak yerine
  paylaşılan çekirdek yetenekleri tüketmelidir

Örnekler:

- paketlenmiş `openai` Plugin’i, OpenAI model-sağlayıcı davranışının ve OpenAI
  konuşma + gerçek zamanlı ses + medya anlama + görüntü oluşturma davranışının sahibidir
- paketlenmiş `elevenlabs` Plugin’i, ElevenLabs konuşma davranışının sahibidir
- paketlenmiş `microsoft` Plugin’i, Microsoft konuşma davranışının sahibidir
- paketlenmiş `google` Plugin’i, Google model-sağlayıcı davranışının yanı sıra Google
  medya anlama + görüntü oluşturma + web arama davranışının sahibidir
- paketlenmiş `firecrawl` Plugin’i, Firecrawl web getirme davranışının sahibidir
- paketlenmiş `minimax`, `mistral`, `moonshot` ve `zai` Pluginleri,
  medya anlama arka uçlarının sahibidir
- paketlenmiş `qwen` Plugin’i, Qwen metin sağlayıcı davranışının yanı sıra
  medya anlama ve video oluşturma davranışının sahibidir
- `voice-call` Plugin’i bir özellik Plugin’idir: çağrı aktarımının, araçların,
  CLI’nin, yolların ve Twilio medya akışı köprülemesinin sahibidir, ancak satıcı Pluginlerini doğrudan
  içe aktarmak yerine paylaşılan konuşma ile gerçek zamanlı yazıya döküm ve gerçek zamanlı ses
  yeteneklerini tüketir

Amaçlanan son durum şudur:

- OpenAI, metin modelleri, konuşma, görüntüler ve
  gelecekte video alanlarını kapsasa bile tek bir Plugin içinde yer alır
- başka bir satıcı da kendi yüzey alanı için aynısını yapabilir
- kanallar, sağlayıcının hangi satıcı Plugin’ine ait olduğunu umursamaz; çekirdek tarafından sunulan
  paylaşılan yetenek sözleşmesini tüketir

Temel ayrım şudur:

- **Plugin** = sahiplik sınırı
- **yetenek** = birden çok Plugin’in uygulayabileceği veya tüketebileceği çekirdek sözleşme

Dolayısıyla OpenClaw video gibi yeni bir alan eklerse, ilk soru
“hangi sağlayıcı video işlemeyi sabit kodlamalı?” değildir. İlk soru “çekirdek video
yetenek sözleşmesi nedir?” olmalıdır. Bu sözleşme var olduğunda, satıcı Pluginleri
ona karşı kayıt olabilir ve kanal/özellik Pluginleri onu tüketebilir.

Yetenek henüz yoksa, genellikle doğru hareket şudur:

1. eksik yeteneği çekirdekte tanımlayın
2. bunu Plugin API’si/çalışma zamanı üzerinden tipli bir şekilde açığa çıkarın
3. kanalları/özellikleri bu yeteneğe bağlayın
4. satıcı Pluginlerinin uygulamaları kaydetmesine izin verin

Bu, sahipliği açık tutarken tek bir satıcıya veya
bir defalık Plugin’e özgü bir kod yoluna bağlı çekirdek davranıştan kaçınır.

### Yetenek katmanlaması

Kodun nereye ait olduğuna karar verirken şu zihinsel modeli kullanın:

- **çekirdek yetenek katmanı**: paylaşılan orkestrasyon, ilke, geri dönüş, yapılandırma
  birleştirme kuralları, teslim semantiği ve tipli sözleşmeler
- **satıcı Plugin katmanı**: satıcıya özgü API’ler, kimlik doğrulama, model katalogları, konuşma
  sentezi, görüntü oluşturma, gelecekteki video arka uçları, kullanım uç noktaları
- **kanal/özellik Plugin katmanı**: Slack/Discord/voice-call/vb. entegrasyonu,
  çekirdek yetenekleri tüketir ve bunları bir yüzeyde sunar

Örneğin TTS şu yapıyı izler:

- çekirdek, yanıt zamanı TTS ilkesinin, geri dönüş sırasının, tercihlerin ve kanal tesliminin sahibidir
- `openai`, `elevenlabs` ve `microsoft`, sentez uygulamalarının sahibidir
- `voice-call`, telefon TTS çalışma zamanı yardımcısını tüketir

Aynı kalıp gelecekteki yetenekler için de tercih edilmelidir.

### Çok yetenekli şirket Plugin’i örneği

Bir şirket Plugin’i dışarıdan bakıldığında tutarlı hissettirmelidir. OpenClaw’ın modeller, konuşma, gerçek zamanlı yazıya döküm, gerçek zamanlı ses, medya
anlama, görüntü oluşturma, video oluşturma, web getirme ve web arama için paylaşılan
sözleşmeleri varsa, bir satıcı tüm yüzeylerinin sahibi tek bir yerde olabilir:

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

Önemli olan tam yardımcı adları değildir. Yapı önemlidir:

- tek bir Plugin satıcı yüzeyinin sahibidir
- çekirdek yine de yetenek sözleşmelerinin sahibidir
- kanallar ve özellik Pluginleri satıcı kodunu değil, `api.runtime.*` yardımcılarını tüketir
- sözleşme testleri, Plugin’in sahibi olduğunu iddia ettiği yetenekleri kaydettiğini
  doğrulayabilir

### Yetenek örneği: video anlama

OpenClaw zaten görüntü/ses/video anlamayı tek bir paylaşılan
yetenek olarak ele alır. Aynı sahiplik modeli burada da geçerlidir:

1. çekirdek medya anlama sözleşmesini tanımlar
2. satıcı Pluginleri, uygun olduğunda `describeImage`, `transcribeAudio` ve
   `describeVideo` kaydeder
3. kanallar ve özellik Pluginleri, doğrudan satıcı koduna bağlanmak yerine
   paylaşılan çekirdek davranışı tüketir

Bu, tek bir sağlayıcının video varsayımlarının çekirdeğe işlenmesini önler. Plugin,
satıcı yüzeyinin sahibidir; çekirdek ise yetenek sözleşmesinin ve geri dönüş davranışının sahibidir.

Video oluşturma zaten aynı sıralamayı kullanır: çekirdek tipli
yetenek sözleşmesinin ve çalışma zamanı yardımcısının sahibidir ve satıcı Pluginleri
buna karşı `api.registerVideoGenerationProvider(...)` uygulamalarını kaydeder.

Somut bir devreye alma kontrol listesine mi ihtiyacınız var? Bkz.
[Capability Cookbook](/tr/plugins/architecture).

## Sözleşmeler ve yaptırım

Plugin API yüzeyi bilinçli olarak `OpenClawPluginApi` içinde tipli ve merkezileştirilmiştir.
Bu sözleşme, desteklenen kayıt noktalarını ve
bir Plugin’in güvenebileceği çalışma zamanı yardımcılarını tanımlar.

Bunun önemi:

- Plugin yazarları tek bir kararlı iç standart elde eder
- çekirdek, iki Plugin’in aynı sağlayıcı kimliğini kaydetmesi gibi
  mükerrer sahipliği reddedebilir
- başlatma, hatalı biçimlendirilmiş kayıtlar için eyleme dönük tanılar sunabilir
- sözleşme testleri, paketlenmiş Plugin sahipliğini zorlayabilir ve sessiz kaymayı önleyebilir

İki katmanlı yaptırım vardır:

1. **çalışma zamanı kayıt yaptırımı**
   Plugin kayıt sistemi, Pluginler yüklenirken kayıtları doğrular. Örnekler:
   mükerrer sağlayıcı kimlikleri, mükerrer konuşma sağlayıcısı kimlikleri ve hatalı
   kayıtlar tanımsız davranış yerine Plugin tanıları üretir.
2. **sözleşme testleri**
   Paketlenmiş Pluginler test çalıştırmaları sırasında sözleşme kayıt sistemlerinde yakalanır; böylece
   OpenClaw sahipliği açıkça doğrulayabilir. Bugün bu, model
   sağlayıcıları, konuşma sağlayıcıları, web arama sağlayıcıları ve paketlenmiş kayıt
   sahipliği için kullanılır.

Pratik etkisi şudur: OpenClaw, hangi Plugin’in hangi
yüzeyin sahibi olduğunu baştan bilir. Bu, çekirdek ve kanalların sorunsuz şekilde birleşmesini sağlar çünkü
sahiplik örtük değil, beyan edilmiş, tipli ve test edilebilirdir.

### Sözleşmede ne yer almalı

İyi Plugin sözleşmeleri şunlardır:

- tipli
- küçük
- yeteneğe özgü
- çekirdeğe ait
- birden çok Plugin tarafından yeniden kullanılabilir
- satıcı bilgisi olmadan kanallar/özellikler tarafından tüketilebilir

Kötü Plugin sözleşmeleri şunlardır:

- çekirdekte gizlenmiş satıcıya özgü ilke
- kayıt sistemini atlayan bir defalık Plugin kaçış delikleri
- doğrudan satıcı uygulamasına uzanan kanal kodu
- `OpenClawPluginApi` veya
  `api.runtime` parçası olmayan geçici çalışma zamanı nesneleri

Kararsız kaldığınızda soyutlama düzeyini yükseltin: önce yeteneği tanımlayın, sonra
Pluginlerin ona bağlanmasına izin verin.

## Yürütme modeli

Yerel OpenClaw Pluginleri Gateway ile **aynı süreç içinde** çalışır. İzole
değildirler. Yüklenmiş yerel bir Plugin, çekirdek kodla aynı süreç düzeyi güven sınırına sahiptir.

Sonuçlar:

- yerel bir Plugin araçlar, ağ işleyicileri, kancalar ve hizmetler kaydedebilir
- yerel bir Plugin hatası gateway’i çökertip kararsızlaştırabilir
- kötü amaçlı bir yerel Plugin, OpenClaw süreci içinde rastgele kod yürütmeye eşdeğerdir

Uyumlu paketler varsayılan olarak daha güvenlidir çünkü OpenClaw şu anda onları
meta veri/içerik paketleri olarak ele alır. Güncel sürümlerde bu çoğunlukla paketlenmiş
Skills anlamına gelir.

Paketlenmemiş Pluginler için allowlist’ler ve açık kurulum/yükleme yolları kullanın. Çalışma alanı Pluginlerini
üretim varsayılanları değil, geliştirme zamanı kodu olarak değerlendirin.

Paketlenmiş çalışma alanı paket adları için, Plugin kimliğini npm
adında sabit tutun: varsayılan olarak `@openclaw/<id>`, ya da
paket kasıtlı olarak daha dar bir Plugin rolü açığa çıkarıyorsa
`-provider`, `-plugin`, `-speech`, `-sandbox` veya `-media-understanding` gibi onaylı tipli bir ek.

Önemli güven notu:

- `plugins.allow`, **Plugin kimliklerine** güvenir; kaynak kökenine değil.
- Paketlenmiş bir Plugin ile aynı kimliğe sahip bir çalışma alanı Plugin’i,
  bu çalışma alanı Plugin’i etkinleştirildiğinde/allowlist’e alındığında paketlenmiş kopyayı kasıtlı olarak gölgeler.
- Bu normaldir ve yerel geliştirme, yama testi ve hotfix’ler için kullanışlıdır.

## Dışa aktarma sınırı

OpenClaw, uygulama kolaylıklarını değil, yetenekleri dışa aktarır.

Yetenek kaydını genel tutun. Sözleşme dışı yardımcı dışa aktarımları azaltın:

- paketlenmiş Plugin’e özgü yardımcı alt yollar
- genel API olarak amaçlanmayan çalışma zamanı tesisat alt yolları
- satıcıya özgü kolaylık yardımcıları
- uygulama ayrıntısı olan kurulum/onboarding yardımcıları

Bazı paketlenmiş Plugin yardımcı alt yolları, uyumluluk ve paketlenmiş Plugin bakımı için
oluşturulan SDK dışa aktarma haritasında hâlâ kalmaktadır. Güncel örnekler arasında
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` ve çeşitli `plugin-sdk/matrix*` hatları bulunur. Bunları
uygulama ayrıntısına ait, ayrılmış dışa aktarımlar olarak değerlendirin; yeni üçüncü taraf Pluginler için
önerilen SDK kalıbı olarak değil.

## Yükleme hattı

Başlatma sırasında OpenClaw kabaca şunları yapar:

1. aday Plugin köklerini keşfeder
2. yerel veya uyumlu paket manifestlerini ve paket meta verilerini okur
3. güvenli olmayan adayları reddeder
4. Plugin yapılandırmasını normalize eder (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. her aday için etkinleştirmeye karar verir
6. etkin yerel modülleri jiti aracılığıyla yükler
7. yerel `register(api)` (veya eski takma ad olan `activate(api)`) kancalarını çağırır ve kayıtları Plugin kayıt sistemine toplar
8. kayıt sistemini komutlara/çalışma zamanı yüzeylerine açar

<Note>
`activate`, `register` için eski bir takma addır — yükleyici mevcut olanı çözer (`def.register ?? def.activate`) ve aynı noktada çağırır. Tüm paketlenmiş Pluginler `register` kullanır; yeni Pluginler için `register` tercih edin.
</Note>

Güvenlik kapıları çalışma zamanı yürütmesinden **önce** gerçekleşir. Adaylar,
girdi Plugin kökünden taşıyorsa, yol dünya tarafından yazılabiliyorsa veya
paketlenmemiş Pluginler için yol sahipliği şüpheli görünüyorsa engellenir.

### Manifest öncelikli davranış

Manifest, kontrol düzlemi için doğruluk kaynağıdır. OpenClaw bunu şunlar için kullanır:

- Plugin’i tanımlamak
- beyan edilen kanalları/Skills/yapılandırma şemasını veya paket yeteneklerini keşfetmek
- `plugins.entries.<id>.config` değerini doğrulamak
- Control UI etiketlerini/yer tutucularını zenginleştirmek
- kurulum/katalog meta verilerini göstermek
- Plugin çalışma zamanını yüklemeden düşük maliyetli etkinleştirme ve kurulum tanımlayıcılarını korumak

Yerel Pluginler için çalışma zamanı modülü veri düzlemi parçasıdır. Kancalar, araçlar, komutlar veya sağlayıcı akışları gibi
gerçek davranışları kaydeder.

İsteğe bağlı manifest `activation` ve `setup` blokları kontrol düzleminde kalır.
Bunlar etkinleştirme planlaması ve kurulum keşfi için yalnızca meta veri tanımlayıcılarıdır;
çalışma zamanı kaydının, `register(...)` işlevinin veya `setupEntry`’nin yerine geçmez.
İlk canlı etkinleştirme tüketicileri artık, daha geniş kayıt sistemi somutlaştırmasından önce
Plugin yüklemeyi daraltmak için manifest komut, kanal ve sağlayıcı ipuçlarını kullanır:

- CLI yükleme, istenen birincil komutun sahibi olan Pluginlerle daraltılır
- kanal kurulumu/Plugin çözümü, istenen
  kanal kimliğinin sahibi olan Pluginlerle daraltılır
- açık sağlayıcı kurulumu/çalışma zamanı çözümü, istenen
  sağlayıcı kimliğinin sahibi olan Pluginlerle daraltılır

Kurulum keşfi artık, kurulum zamanında çalışma zamanı kancalarına hâlâ ihtiyaç duyan Pluginler için
`setup-api`’ye geri dönmeden önce, aday Pluginleri daraltmak amacıyla `setup.providers` ve
`setup.cliBackends` gibi tanımlayıcıya ait kimlikleri tercih eder. Keşfedilen birden fazla Plugin aynı normalize edilmiş kurulum sağlayıcısı veya CLI arka uç
kimliğini talep ederse, kurulum araması keşif sırasına güvenmek yerine
belirsiz sahipliği reddeder.

### Yükleyicinin önbelleğe aldığı şeyler

OpenClaw şu bileşenler için kısa süreli süreç içi önbellekler tutar:

- keşif sonuçları
- manifest kayıt sistemi verileri
- yüklenmiş Plugin kayıt sistemleri

Bu önbellekler ani başlatma yükünü ve tekrarlanan komut ek yükünü azaltır. Bunları,
kalıcılık değil kısa ömürlü performans önbellekleri olarak düşünmek güvenlidir.

Performans notu:

- Bu önbellekleri devre dışı bırakmak için `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` veya
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` ayarlayın.
- Önbellek aralıklarını `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` ve
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` ile ayarlayın.

## Kayıt sistemi modeli

Yüklenen Pluginler rastgele çekirdek küresellerini doğrudan değiştirmez. Merkezi bir
Plugin kayıt sistemine kaydolurlar.

Kayıt sistemi şunları izler:

- Plugin kayıtları (kimlik, kaynak, köken, durum, tanılar)
- araçlar
- eski kancalar ve tipli kancalar
- kanallar
- sağlayıcılar
- Gateway RPC işleyicileri
- HTTP yolları
- CLI kaydedicileri
- arka plan hizmetleri
- Plugin’e ait komutlar

Çekirdek özellikler daha sonra Plugin modülleriyle doğrudan konuşmak yerine bu
kayıt sisteminden okur. Bu, yüklemeyi tek yönlü tutar:

- Plugin modülü -> kayıt sistemine kayıt
- çekirdek çalışma zamanı -> kayıt sisteminden tüketim

Bu ayrım sürdürülebilirlik açısından önemlidir. Çekirdekteki yüzeylerin çoğunun
tek bir entegrasyon noktasına ihtiyaç duyması anlamına gelir: “kayıt sistemini oku”,
“her Plugin modülü için özel durum yaz” değil.

## Konuşma bağlama geri çağrıları

Bir konuşmayı bağlayan Pluginler, bir onay çözüldüğünde tepki verebilir.

Bağlama isteği onaylandıktan veya reddedildikten sonra geri çağrı almak için
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

Geri çağrı yükü alanları:

- `status`: `"approved"` veya `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` veya `"deny"`
- `binding`: onaylanan istekler için çözümlenen bağlama
- `request`: özgün istek özeti, ayırma ipucu, gönderici kimliği ve
  konuşma meta verileri

Bu geri çağrı yalnızca bildirim amaçlıdır. Bir konuşmayı kimin bağlayabileceğini
değiştirmez ve çekirdeğin onay işleme süreci bittikten sonra çalışır.

## Sağlayıcı çalışma zamanı kancaları

Sağlayıcı Pluginleri artık iki katmana sahiptir:

- manifest meta verileri: çalışma zamanı yüklenmeden önce düşük maliyetli sağlayıcı ortam kimlik doğrulama araması için `providerAuthEnvVars`,
  kimlik doğrulamayı paylaşan sağlayıcı varyantları için `providerAuthAliases`,
  çalışma zamanı yüklenmeden önce düşük maliyetli kanal ortamı/kurulum araması için `channelEnvVars`,
  ayrıca çalışma zamanı yüklenmeden önce düşük maliyetli onboarding/kimlik doğrulama seçimi etiketleri ve
  CLI bayrak meta verileri için `providerAuthChoices`
- yapılandırma zamanı kancaları: `catalog` / eski `discovery` artı `applyConfigDefaults`
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
  `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw hâlâ genel aracı döngüsünün, failover’ın, döküm işleme sürecinin ve
araç ilkesinin sahibidir. Bu kancalar, bütünüyle özel bir çıkarım aktarımına ihtiyaç duymadan
sağlayıcıya özgü davranış için uzantı yüzeyidir.

Sağlayıcının, genel kimlik doğrulama/durum/model seçici yollarının
Plugin çalışma zamanını yüklemeden görmesi gereken ortam tabanlı kimlik bilgileri varsa manifest `providerAuthEnvVars` kullanın. Bir sağlayıcı kimliği, başka bir sağlayıcı kimliğinin ortam değişkenlerini, kimlik doğrulama profillerini, yapılandırma destekli kimlik doğrulamayı ve API anahtarı onboarding seçimini yeniden kullanacaksa manifest `providerAuthAliases` kullanın. Onboarding/kimlik doğrulama seçimi
CLI yüzeyleri, sağlayıcının seçim kimliğini, grup etiketlerini ve basit
tek bayraklı kimlik doğrulama kablolamasını sağlayıcı çalışma zamanını yüklemeden bilmeliyse manifest `providerAuthChoices` kullanın. Sağlayıcı çalışma zamanı
`envVars` alanını, onboarding etiketleri veya OAuth
istemci kimliği/istemci gizli anahtarı kurulum değişkenleri gibi operatöre dönük ipuçları için saklayın.

Bir kanalın, genel kabuk ortamı geri dönüşünün, config/durum kontrollerinin veya kurulum istemlerinin
çalışma zamanı kanalını yüklemeden görmesi gereken ortam güdümlü kimlik doğrulaması ya da kurulumu varsa manifest `channelEnvVars` kullanın.

### Kanca sırası ve kullanım

Model/sağlayıcı Pluginleri için OpenClaw kancaları kabaca şu sırayla çağırır.
“Ne zaman kullanılır” sütunu hızlı karar rehberidir.

| #   | Kanca                             | Ne yapar                                                                                                       | Ne zaman kullanılır                                                                                                                         |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` üretimi sırasında sağlayıcı yapılandırmasını `models.providers` içine yayımlar                  | Sağlayıcının bir kataloğu veya temel URL varsayılanları vardır                                                                              |
| 2   | `applyConfigDefaults`             | Yapılandırma somutlaştırması sırasında sağlayıcıya ait genel yapılandırma varsayılanlarını uygular            | Varsayılanlar kimlik doğrulama moduna, ortama veya sağlayıcının model ailesi semantiğine bağlıdır                                          |
| --  | _(yerleşik model araması)_        | OpenClaw önce normal kayıt sistemi/katalog yolunu dener                                                       | _(bir Plugin kancası değildir)_                                                                                                             |
| 3   | `normalizeModelId`                | Aramadan önce eski veya önizleme model kimliği takma adlarını normalize eder                                  | Sağlayıcı, kanonik model çözümlemesinden önce takma ad temizliğinin sahibidir                                                              |
| 4   | `normalizeTransport`              | Genel model derlemesinden önce sağlayıcı ailesine ait `api` / `baseUrl` değerlerini normalize eder           | Sağlayıcı, aynı aktarım ailesindeki özel sağlayıcı kimlikleri için aktarım temizliğinin sahibidir                                          |
| 5   | `normalizeConfig`                 | Çalışma zamanı/sağlayıcı çözümlemesinden önce `models.providers.<id>` değerini normalize eder                 | Sağlayıcı, Plugin ile birlikte yaşaması gereken yapılandırma temizliğine ihtiyaç duyar; paketlenmiş Google ailesi yardımcıları da desteklenen Google config girdilerine geri destek sağlar |
| 6   | `applyNativeStreamingUsageCompat` | Yapılandırma sağlayıcılarına yerel akış kullanımı uyumluluk yeniden yazımlarını uygular                       | Sağlayıcının, uç nokta güdümlü yerel akış kullanımı meta verisi düzeltmelerine ihtiyacı vardır                                             |
| 7   | `resolveConfigApiKey`             | Çalışma zamanı kimlik doğrulaması yüklenmeden önce yapılandırma sağlayıcıları için ortam işaretleyici kimlik doğrulamayı çözümler | Sağlayıcının, sağlayıcıya ait ortam işaretleyici API anahtarı çözümlemesi vardır; `amazon-bedrock` için burada ayrıca yerleşik bir AWS ortam işaretleyici çözümleyici bulunur |
| 8   | `resolveSyntheticAuth`            | Düz metni kalıcılaştırmadan yerel/self-hosted veya yapılandırma destekli kimlik doğrulamayı yüzeye çıkarır    | Sağlayıcı, sentetik/yerel bir kimlik bilgisi işaretleyicisi ile çalışabilir                                                                |
| 9   | `resolveExternalAuthProfiles`     | Sağlayıcıya ait harici kimlik doğrulama profillerini bindirir; varsayılan `persistence` değeri CLI/uygulamaya ait kimlik bilgileri için `runtime-only` olur | Sağlayıcı, kopyalanmış yenileme belirteçlerini kalıcılaştırmadan harici kimlik doğrulama kimlik bilgilerini yeniden kullanır              |
| 10  | `shouldDeferSyntheticProfileAuth` | Saklanan sentetik profil yer tutucularını ortam/yapılandırma destekli kimlik doğrulamanın arkasına iter       | Sağlayıcı, öncelik kazanmaması gereken sentetik yer tutucu profiller saklar                                                                |
| 11  | `resolveDynamicModel`             | Yerel kayıt sisteminde henüz bulunmayan sağlayıcıya ait model kimlikleri için eşzamanlı geri dönüş sağlar     | Sağlayıcı, yukarı akıştan gelen rastgele model kimliklerini kabul eder                                                                     |
| 12  | `prepareDynamicModel`             | Asenkron ısınma yapar, ardından `resolveDynamicModel` yeniden çalışır                                          | Sağlayıcının bilinmeyen kimlikleri çözümlemeden önce ağ meta verisine ihtiyacı vardır                                                     |
| 13  | `normalizeResolvedModel`          | Gömülü çalıştırıcı çözümlemiş modeli kullanmadan önce son yeniden yazımı yapar                                 | Sağlayıcının aktarım yeniden yazımlarına ihtiyacı vardır ama yine de çekirdek bir aktarım kullanır                                         |
| 14  | `contributeResolvedModelCompat`   | Başka bir uyumlu aktarımın arkasındaki satıcı modelleri için uyumluluk bayrakları ekler                       | Sağlayıcı, sağlayıcıyı devralmadan kendi modellerini vekil aktarımlarda tanır                                                             |
| 15  | `capabilities`                    | Paylaşılan çekirdek mantık tarafından kullanılan, sağlayıcıya ait döküm/araç meta verileri                    | Sağlayıcının döküm/sağlayıcı ailesine özgü davranış farklarına ihtiyacı vardır                                                             |
| 16  | `normalizeToolSchemas`            | Gömülü çalıştırıcı görmeden önce araç şemalarını normalize eder                                                | Sağlayıcının aktarım ailesi şema temizliğine ihtiyacı vardır                                                                               |
| 17  | `inspectToolSchemas`              | Normalize etmeden sonra sağlayıcıya ait şema tanılarını yüzeye çıkarır                                         | Sağlayıcı, çekirdeğe sağlayıcıya özgü kurallar öğretmeden anahtar sözcük uyarıları vermek ister                                            |
| 18  | `resolveReasoningOutputMode`      | Yerel veya etiketli akıl yürütme çıktısı sözleşmesini seçer                                                    | Sağlayıcı, yerel alanlar yerine etiketli akıl yürütme/nihai çıktı ister                                                                    |
| 19  | `prepareExtraParams`              | Genel akış seçeneği sarmalayıcılarından önce istek parametresi normalizasyonu yapar                            | Sağlayıcının varsayılan istek parametrelerine veya sağlayıcı başına parametre temizliğine ihtiyacı vardır                                  |
| 20  | `createStreamFn`                  | Normal akış yolunu özel bir aktarımla tamamen değiştirir                                                       | Sağlayıcının yalnızca bir sarmalayıcıya değil, özel bir tel protokolüne ihtiyacı vardır                                                    |
| 21  | `wrapStreamFn`                    | Genel sarmalayıcılar uygulandıktan sonra akışı sarar                                                           | Sağlayıcının özel bir aktarım olmadan istek üstbilgileri/gövdesi/model uyumluluğu sarmalayıcılarına ihtiyacı vardır                       |
| 22  | `resolveTransportTurnState`       | Tur başına yerel aktarım üstbilgileri veya meta verileri ekler                                                 | Sağlayıcı, genel aktarımların sağlayıcıya özgü yerel tur kimliğini göndermesini ister                                                      |
| 23  | `resolveWebSocketSessionPolicy`   | Yerel WebSocket üstbilgileri veya oturum soğuma ilkesi ekler                                                   | Sağlayıcı, genel WS aktarımlarının oturum üstbilgilerini veya geri dönüş ilkesini ayarlamasını ister                                       |
| 24  | `formatApiKey`                    | Kimlik doğrulama profili biçimlendiricisi: saklanan profil çalışma zamanı `apiKey` dizesine dönüşür           | Sağlayıcı, ek kimlik doğrulama meta verisi saklar ve özel bir çalışma zamanı belirteci biçimine ihtiyaç duyar                              |
| 25  | `refreshOAuth`                    | Özel yenileme uç noktaları veya yenileme başarısızlığı ilkesi için OAuth yenilemesini geçersiz kılar          | Sağlayıcı, paylaşılan `pi-ai` yenileyicilerine uymaz                                                                                       |
| 26  | `buildAuthDoctorHint`             | OAuth yenilemesi başarısız olduğunda eklenecek onarım ipucunu oluşturur                                        | Sağlayıcı, yenileme hatasından sonra sağlayıcıya ait kimlik doğrulama onarım rehberliğine ihtiyaç duyar                                    |
| 27  | `matchesContextOverflowError`     | Sağlayıcıya ait bağlam penceresi taşması eşleyicisi                                                            | Sağlayıcının, genel sezgisel yöntemlerin kaçıracağı ham taşma hataları vardır                                                              |
| 28  | `classifyFailoverReason`          | Sağlayıcıya ait failover neden sınıflandırması                                                                 | Sağlayıcı, ham API/aktarım hatalarını hız sınırı/aşırı yük/vb. olarak eşleyebilir                                                          |
| 29  | `isCacheTtlEligible`              | Vekil/arka taşıma sağlayıcıları için istem önbelleği ilkesi                                                    | Sağlayıcının vekile özgü önbellek TTL geçitlemesine ihtiyacı vardır                                                                        |
| 30  | `buildMissingAuthMessage`         | Genel eksik kimlik doğrulama kurtarma mesajının yerine geçer                                                   | Sağlayıcının sağlayıcıya özgü eksik kimlik doğrulama kurtarma ipucuna ihtiyacı vardır                                                      |
| 31  | `suppressBuiltInModel`            | Eski yukarı akış modellerini bastırma ve isteğe bağlı kullanıcıya dönük hata ipucu                            | Sağlayıcının eski yukarı akış satırlarını gizlemesi veya bunları bir satıcı ipucuyla değiştirmesi gerekir                                  |
| 32  | `augmentModelCatalog`             | Keşiften sonra sentetik/nihai katalog satırları ekler                                                          | Sağlayıcının `models list` ve seçicilerde sentetik ileri uyumluluk satırlarına ihtiyacı vardır                                             |
| 33  | `isBinaryThinking`                | İkili düşünme sağlayıcıları için açık/kapalı akıl yürütme anahtarı                                             | Sağlayıcı yalnızca ikili düşünme açık/kapalı seçeneği sunar                                                                                 |
| 34  | `supportsXHighThinking`           | Seçili modeller için `xhigh` akıl yürütme desteği                                                              | Sağlayıcı, `xhigh` seçeneğini yalnızca modellerin bir alt kümesinde ister                                                                  |
| 35  | `resolveDefaultThinkingLevel`     | Belirli bir model ailesi için varsayılan `/think` düzeyi                                                       | Sağlayıcı, bir model ailesi için varsayılan `/think` ilkesinin sahibidir                                                                   |
| 36  | `isModernModelRef`                | Canlı profil filtreleri ve smoke seçimi için modern model eşleyicisi                                           | Sağlayıcı, canlı/smoke tercih edilen model eşlemesinin sahibidir                                                                            |
| 37  | `prepareRuntimeAuth`              | Yapılandırılmış bir kimlik bilgisini, çıkarımdan hemen önce gerçek çalışma zamanı belirtecine/anahtarına dönüştürür | Sağlayıcının bir belirteç değişimine veya kısa ömürlü istek kimlik bilgisine ihtiyacı vardır                                               |
| 38  | `resolveUsageAuth`                | `/usage` ve ilgili durum yüzeyleri için kullanım/faturalama kimlik bilgilerini çözümler                       | Sağlayıcının özel kullanım/kota belirteci ayrıştırmasına veya farklı bir kullanım kimlik bilgisine ihtiyacı vardır                         |
| 39  | `fetchUsageSnapshot`              | Kimlik doğrulama çözüldükten sonra sağlayıcıya özgü kullanım/kota anlık görüntülerini getirip normalize eder  | Sağlayıcının sağlayıcıya özgü bir kullanım uç noktasına veya yük ayrıştırıcısına ihtiyacı vardır                                          |
| 40  | `createEmbeddingProvider`         | Bellek/arama için sağlayıcıya ait bir embedding bağdaştırıcısı oluşturur                                      | Bellek embedding davranışı sağlayıcı Plugin’ine ait olmalıdır                                                                              |
| 41  | `buildReplayPolicy`               | Sağlayıcı için döküm işleme sürecini kontrol eden bir replay ilkesi döndürür                                  | Sağlayıcının özel döküm ilkesi gereksinimi vardır (örneğin, düşünme bloğu ayıklama)                                                       |
| 42  | `sanitizeReplayHistory`           | Genel döküm temizliğinden sonra replay geçmişini yeniden yazar                                                | Sağlayıcının, paylaşılan Compaction yardımcılarının ötesinde sağlayıcıya özgü replay yeniden yazımlarına ihtiyacı vardır                  |
| 43  | `validateReplayTurns`             | Gömülü çalıştırıcıdan önce replay turları için son doğrulamayı veya yeniden şekillendirmeyi yapar             | Sağlayıcı aktarımının, genel temizlemeden sonra daha sıkı tur doğrulamasına ihtiyacı vardır                                               |
| 44  | `onModelSelected`                 | Sağlayıcıya ait seçim sonrası yan etkileri çalıştırır                                                         | Bir model etkin olduğunda sağlayıcının telemetriye veya sağlayıcıya ait duruma ihtiyacı vardır                                            |

`normalizeModelId`, `normalizeTransport` ve `normalizeConfig` önce eşleşen
sağlayıcı Plugin’ini kontrol eder, ardından model kimliğini veya aktarımı/config’i gerçekten değiştiren bir Plugin bulana kadar
kanca destekli diğer sağlayıcı Pluginlerine düşer. Bu, çağıranın hangi
paketlenmiş Plugin’in yeniden yazımın sahibi olduğunu bilmesini gerektirmeden
takma ad/uyumluluk sağlayıcı şimlerinin çalışmasını sağlar. Hiçbir sağlayıcı kancası desteklenen bir
Google ailesi config girdisini yeniden yazmazsa, paketlenmiş Google config
normalleştiricisi yine de bu uyumluluk temizliğini uygular.

Sağlayıcının bütünüyle özel bir tel protokolüne veya özel bir istek yürütücüsüne ihtiyacı varsa,
bu farklı bir uzantı sınıfıdır. Bu kancalar, hâlâ OpenClaw’ın normal
çıkarım döngüsü üzerinde çalışan sağlayıcı davranışları içindir.

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
  ve `wrapStreamFn` kullanır; çünkü Claude 4.6 ileri uyumluluğunun,
  sağlayıcı ailesi ipuçlarının, kimlik doğrulama onarım rehberliğinin, kullanım uç noktası entegrasyonunun,
  istem önbelleği uygunluğunun, kimlik doğrulamaya duyarlı config varsayılanlarının, Claude
  varsayılan/uyarlamalı düşünme ilkesinin ve beta üstbilgileri,
  `/fast` / `serviceTier` ve `context1m` için Anthropic’e özgü akış şekillendirmenin sahibidir.
- Anthropic’in Claude’a özgü akış yardımcıları şimdilik paketlenmiş Plugin’in kendi
  genel `api.ts` / `contract-api.ts` hattında kalır. Bu paket yüzeyi,
  genel SDK’yı tek bir sağlayıcının beta üstbilgisi kuralları etrafında genişletmek yerine
  `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` ve daha düşük seviyeli
  Anthropic sarmalayıcı oluşturucularını dışa aktarır.
- OpenAI, `resolveDynamicModel`, `normalizeResolvedModel` ve
  `capabilities` ile birlikte `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` ve `isModernModelRef`
  kullanır; çünkü GPT-5.4 ileri uyumluluğunun, doğrudan OpenAI
  `openai-completions` -> `openai-responses` normalizasyonunun, Codex farkındalığı olan kimlik doğrulama
  ipuçlarının, Spark bastırmanın, sentetik OpenAI liste satırlarının ve GPT-5 düşünme /
  canlı model ilkesinin sahibidir; `openai-responses-defaults` akış ailesi ise atıf üstbilgileri,
  `/fast`/`serviceTier`, metin ayrıntı düzeyi, yerel Codex web araması,
  akıl yürütme uyumluluğu yük şekillendirmesi ve Responses bağlam yönetimi için
  paylaşılan yerel OpenAI Responses sarmalayıcılarının sahibidir.
- OpenRouter, sağlayıcı geçişli olduğu ve OpenClaw’ın statik kataloğu güncellenmeden önce yeni
  model kimlikleri açığa çıkarabileceği için `catalog` ile birlikte `resolveDynamicModel` ve
  `prepareDynamicModel` kullanır; ayrıca sağlayıcıya özgü istek üstbilgilerini, yönlendirme meta verilerini, akıl yürütme yamalarını ve
  istem önbelleği ilkesini çekirdeğin dışında tutmak için
  `capabilities`, `wrapStreamFn` ve `isCacheTtlEligible` de kullanır. Replay ilkesi
  `passthrough-gemini` ailesinden gelirken, `openrouter-thinking` akış ailesi
  vekil akıl yürütme enjeksiyonunun ve desteklenmeyen model / `auto` atlamalarının sahibidir.
- GitHub Copilot, sağlayıcıya ait cihaz oturumu açma, model geri dönüş davranışı, Claude döküm farkları,
  GitHub belirteci -> Copilot belirteci değişimi ve sağlayıcıya ait kullanım uç noktası gerektiği için
  `catalog`, `auth`, `resolveDynamicModel` ve `capabilities` ile birlikte
  `prepareRuntimeAuth` ve `fetchUsageSnapshot` kullanır.
- OpenAI Codex, hâlâ çekirdek OpenAI aktarımları üzerinde çalışmasına rağmen kendi aktarım/temel URL
  normalizasyonunun, OAuth yenileme geri dönüş ilkesinin, varsayılan aktarım seçiminin,
  sentetik Codex katalog satırlarının ve ChatGPT kullanım uç noktası entegrasyonunun sahibi olduğu için
  `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` ve `augmentModelCatalog` ile birlikte
  `prepareExtraParams`, `resolveUsageAuth` ve `fetchUsageSnapshot` kullanır;
  doğrudan OpenAI ile aynı `openai-responses-defaults` akış ailesini paylaşır.
- Google AI Studio ve Gemini CLI OAuth, `google-gemini` replay ailesi Gemini 3.1 ileri uyumluluk geri dönüşünün,
  yerel Gemini replay doğrulamasının, önyükleme replay temizliğinin,
  etiketli akıl yürütme çıktısı modunun ve modern model eşlemesinin sahibi olduğu için
  `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` ve `isModernModelRef` kullanır;
  `google-thinking` akış ailesi ise Gemini düşünme yükü normalizasyonunun sahibidir;
  Gemini CLI OAuth ayrıca belirteç biçimlendirme, belirteç ayrıştırma ve kota uç noktası
  kablolaması için `formatApiKey`, `resolveUsageAuth` ve
  `fetchUsageSnapshot` kullanır.
- Anthropic Vertex, Claude’a özgü replay temizliği her `anthropic-messages` aktarımı yerine
  Claude kimlikleriyle sınırlı kalsın diye
  `anthropic-by-model` replay ailesi aracılığıyla `buildReplayPolicy` kullanır.
- Amazon Bedrock, Anthropic-on-Bedrock trafiği için Bedrock’a özgü
  boğma/hazır değil/bağlam taşması hata sınıflandırmasının sahibi olduğu için
  `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` ve `resolveDefaultThinkingLevel` kullanır;
  replay ilkesi yine aynı yalnızca Claude’a özgü `anthropic-by-model` korumasını paylaşır.
- OpenRouter, Kilocode, Opencode ve Opencode Go,
  Gemini modellerini OpenAI uyumlu aktarımlar üzerinden vekilleyip yerel Gemini replay doğrulaması veya
  önyükleme yeniden yazımları olmadan Gemini düşünce imzası temizliğine ihtiyaç duydukları için
  `passthrough-gemini` replay ailesi aracılığıyla `buildReplayPolicy`
  kullanır.
- MiniMax, tek bir sağlayıcı hem Anthropic-message hem de OpenAI uyumlu anlamların sahibi olduğu için
  `hybrid-anthropic-openai` replay ailesi aracılığıyla `buildReplayPolicy`
  kullanır; Anthropic tarafında yalnızca Claude’a özgü düşünme bloğu düşürmeyi sürdürürken akıl yürütme
  çıktısı modunu tekrar yerel olana geçersiz kılar ve `minimax-fast-mode` akış ailesi
  paylaşılan akış yolunda hızlı mod model yeniden yazımlarının sahibidir.
- Moonshot, hâlâ paylaşılan OpenAI aktarımını kullanmasına rağmen sağlayıcıya ait düşünme yükü normalizasyonuna ihtiyaç duyduğu için
  `catalog` ile birlikte `wrapStreamFn` kullanır; `moonshot-thinking` akış ailesi
  config artı `/think` durumunu kendi yerel ikili düşünme yüküne eşler.
- Kilocode, sağlayıcıya ait istek üstbilgilerine,
  akıl yürütme yükü normalizasyonuna, Gemini döküm ipuçlarına ve Anthropic
  önbellek TTL geçitlemesine ihtiyaç duyduğu için `catalog`, `capabilities`, `wrapStreamFn` ve
  `isCacheTtlEligible` kullanır; `kilocode-thinking` akış ailesi Kilo düşünme
  enjeksiyonunu paylaşılan vekil akış yolunda tutarken `kilo/auto` ve
  açık akıl yürütme yüklerini desteklemeyen diğer vekil model kimliklerini atlar.
- Z.AI, GLM-5 geri dönüşünün,
  `tool_stream` varsayılanlarının, ikili düşünme UX’inin, modern model eşlemesinin ve hem
  kullanım kimlik doğrulamasının hem de kota getirmesinin sahibi olduğu için
  `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` ve `fetchUsageSnapshot` kullanır; `tool-stream-default-on` akış ailesi
  varsayılan açık `tool_stream` sarmalayıcısını sağlayıcı başına elle yazılmış yapıştırma kodunun dışında tutar.
- xAI, yerel xAI Responses aktarım normalizasyonunun, Grok hızlı mod
  takma ad yeniden yazımlarının, varsayılan `tool_stream` değerinin, strict-tool / akıl yürütme yükü
  temizliğinin, Plugin’e ait araçlar için geri dönüş kimlik doğrulama yeniden kullanımının, ileri uyumluluklu Grok
  model çözümlemesinin ve xAI araç şeması
  profili, desteklenmeyen şema anahtar sözcükleri, yerel `web_search` ve HTML varlık
  araç çağrısı argüman kod çözümü gibi sağlayıcıya ait uyumluluk yamalarının sahibi olduğu için
  `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` ve `isModernModelRef`
  kullanır.
- Mistral, OpenCode Zen ve OpenCode Go, döküm/araç farklarını çekirdeğin dışında tutmak için yalnızca
  `capabilities` kullanır.
- `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` ve `volcengine` gibi
  yalnızca katalog kullanan paketlenmiş sağlayıcılar
  yalnızca `catalog` kullanır.
- Qwen, metin sağlayıcısı için `catalog`, çok modlu yüzeyleri için ise paylaşılan medya anlama ve
  video oluşturma kayıtlarını kullanır.
- MiniMax ve Xiaomi, `/usage`
  davranışları Plugin’e ait olsa da çıkarım hâlâ paylaşılan aktarımlar üzerinden çalıştığı için
  `catalog` ile birlikte kullanım kancalarını kullanır.

## Çalışma zamanı yardımcıları

Pluginler `api.runtime` aracılığıyla seçili çekirdek yardımcılarına erişebilir. TTS için:

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
- PCM ses arabelleği + örnekleme oranı döndürür. Pluginler sağlayıcılar için yeniden örnekleme/kodlama yapmalıdır.
- `listVoices`, sağlayıcı başına isteğe bağlıdır. Bunu satıcıya ait ses seçiciler veya kurulum akışları için kullanın.
- Ses listeleri, sağlayıcı farkındalığı olan seçiciler için yerel ayar, cinsiyet ve kişilik etiketleri gibi daha zengin meta veriler içerebilir.
- OpenAI ve ElevenLabs bugün telefon desteğine sahiptir. Microsoft sahip değildir.

Pluginler ayrıca `api.registerSpeechProvider(...)` aracılığıyla konuşma sağlayıcıları kaydedebilir.

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
- Satıcıya ait sentez davranışı için konuşma sağlayıcıları kullanın.
- Eski Microsoft `edge` girdisi `microsoft` sağlayıcı kimliğine normalize edilir.
- Tercih edilen sahiplik modeli şirket odaklıdır: tek bir satıcı Plugin’i,
  OpenClaw bu yetenek sözleşmelerini ekledikçe metin, konuşma, görüntü ve gelecekte medya sağlayıcılarının sahibi olabilir.

Görüntü/ses/video anlama için, Pluginler genel bir anahtar/değer torbası yerine
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

- Orkestrasyonu, geri dönüşü, yapılandırmayı ve kanal bağlamasını çekirdekte tutun.
- Satıcı davranışını sağlayıcı Plugin’inde tutun.
- Eklemeli genişleme tipli kalmalıdır: yeni isteğe bağlı yöntemler, yeni isteğe bağlı
  sonuç alanları, yeni isteğe bağlı yetenekler.
- Video oluşturma zaten aynı kalıbı izler:
  - çekirdek yetenek sözleşmesinin ve çalışma zamanı yardımcısının sahibidir
  - satıcı Pluginleri `api.registerVideoGenerationProvider(...)` kaydeder
  - özellik/kanal Pluginleri `api.runtime.videoGeneration.*` kullanır

Medya anlama çalışma zamanı yardımcıları için Pluginler şunları çağırabilir:

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

Ses yazıya dökümü için Pluginler medya anlama çalışma zamanını
veya eski STT takma adını kullanabilir:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Notlar:

- `api.runtime.mediaUnderstanding.*`,
  görüntü/ses/video anlama için tercih edilen paylaşılan yüzeydir.
- Çekirdek medya anlama ses yapılandırmasını (`tools.media.audio`) ve sağlayıcı geri dönüş sırasını kullanır.
- Yazıya döküm çıktısı üretilmediğinde `{ text: undefined }` döndürür (örneğin giriş atlandığında/desteklenmediğinde).
- `api.runtime.stt.transcribeAudioFile(...)` bir uyumluluk takma adı olarak kalır.

Pluginler ayrıca `api.runtime.subagent` aracılığıyla arka planda alt aracı çalıştırmaları başlatabilir:

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

- `provider` ve `model`, kalıcı oturum değişiklikleri değil, çalıştırma başına isteğe bağlı geçersiz kılmalardır.
- OpenClaw bu geçersiz kılma alanlarını yalnızca güvenilir çağıranlar için dikkate alır.
- Plugin’e ait geri dönüş çalıştırmaları için operatörlerin `plugins.entries.<id>.subagent.allowModelOverride: true` ile açıkça izin vermesi gerekir.
- Güvenilir Pluginleri belirli kanonik `provider/model` hedefleriyle sınırlamak için `plugins.entries.<id>.subagent.allowedModels` kullanın veya herhangi bir hedefe açıkça izin vermek için `"*"` kullanın.
- Güvenilmeyen Plugin alt aracı çalıştırmaları yine çalışır, ancak geçersiz kılma istekleri sessizce geri düşmek yerine reddedilir.

Web araması için Pluginler, aracı araç bağlamasına
uzanmak yerine paylaşılan çalışma zamanı yardımcısını kullanabilir:

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

Pluginler ayrıca şu yolla web arama sağlayıcıları kaydedebilir:
`api.registerWebSearchProvider(...)`.

Notlar:

- Sağlayıcı seçimini, kimlik bilgisi çözümlemesini ve paylaşılan istek semantiğini çekirdekte tutun.
- Satıcıya özgü arama aktarımları için web arama sağlayıcılarını kullanın.
- `api.runtime.webSearch.*`, arama davranışına aracı araç sarmalayıcısına bağlı olmadan ihtiyaç duyan özellik/kanal Pluginleri için tercih edilen paylaşılan yüzeydir.

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

- `generate(...)`: yapılandırılmış görüntü oluşturma sağlayıcı zincirini kullanarak bir görüntü oluşturur.
- `listProviders(...)`: kullanılabilir görüntü oluşturma sağlayıcılarını ve yeteneklerini listeler.

## Gateway HTTP yolları

Pluginler `api.registerHttpRoute(...)` ile HTTP uç noktaları açığa çıkarabilir.

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

Yol alanları:

- `path`: Gateway HTTP sunucusu altındaki yol.
- `auth`: zorunlu. Normal Gateway kimlik doğrulamasını istemek için `"gateway"` veya Plugin tarafından yönetilen kimlik doğrulama/Webhook doğrulaması için `"plugin"` kullanın.
- `match`: isteğe bağlı. `"exact"` (varsayılan) veya `"prefix"`.
- `replaceExisting`: isteğe bağlı. Aynı Plugin’in kendi mevcut yol kaydını değiştirmesine izin verir.
- `handler`: yol isteği işlediyse `true` döndürmelidir.

Notlar:

- `api.registerHttpHandler(...)` kaldırılmıştır ve Plugin yükleme hatasına neden olur. Bunun yerine `api.registerHttpRoute(...)` kullanın.
- Plugin yolları `auth` değerini açıkça belirtmelidir.
- Aynı `path + match` çakışmaları, `replaceExisting: true` olmadıkça reddedilir ve bir Plugin başka bir Plugin’in yolunu değiştiremez.
- Farklı `auth` düzeylerine sahip çakışan yollar reddedilir. `exact`/`prefix` ardışık geçiş zincirlerini yalnızca aynı auth düzeyinde tutun.
- `auth: "plugin"` yolları otomatik olarak operatör çalışma zamanı kapsamları almaz. Bunlar ayrıcalıklı Gateway yardımcı çağrıları için değil, Plugin tarafından yönetilen Webhook’lar/imza doğrulaması içindir.
- `auth: "gateway"` yolları bir Gateway istek çalışma zamanı kapsamı içinde çalışır, ancak bu kapsam bilerek tutucudur:
  - paylaşılan gizli taşıyıcı kimlik doğrulaması (`gateway.auth.mode = "token"` / `"password"`), çağıran `x-openclaw-scopes` gönderse bile Plugin-yolu çalışma zamanı kapsamlarını `operator.write` değerine sabitler
  - güvenilir kimlik taşıyan HTTP modları (örneğin `trusted-proxy` veya özel bir girişte `gateway.auth.mode = "none"`), `x-openclaw-scopes` üstbilgisini yalnızca üstbilgi açıkça mevcutsa dikkate alır
  - bu kimlik taşıyan Plugin-yolu isteklerinde `x-openclaw-scopes` yoksa çalışma zamanı kapsamı `operator.write` değerine geri döner
- Pratik kural: Gateway kimlik doğrulamalı bir Plugin yolunun örtük bir yönetici yüzeyi olduğunu varsaymayın. Yolunuz yalnızca yöneticiye ait davranış gerektiriyorsa, kimlik taşıyan bir kimlik doğrulama modu isteyin ve açık `x-openclaw-scopes` üstbilgisi sözleşmesini belgeleyin.

## Plugin SDK içe aktarma yolları

Plugin yazarken tek parça `openclaw/plugin-sdk` içe aktarımı yerine
SDK alt yollarını kullanın:

- Plugin kayıt ilkel öğeleri için `openclaw/plugin-sdk/plugin-entry`.
- Genel paylaşılan Plugin’e dönük sözleşme için `openclaw/plugin-sdk/core`.
- Kök `openclaw.json` Zod şeması
  dışa aktarımı (`OpenClawSchema`) için `openclaw/plugin-sdk/config-schema`.
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
  `openclaw/plugin-sdk/webhook-ingress` gibi kararlı kanal ilkel öğeleri, paylaşılan kurulum/kimlik doğrulama/yanıt/Webhook
  bağlaması içindir. `channel-inbound`, debounce, bahsetme eşleme,
  gelen mention-policy yardımcıları, zarf biçimlendirme ve gelen zarf
  bağlam yardımcıları için paylaşılan yuvadır.
  `channel-setup`, dar isteğe bağlı kurulum hattıdır.
  `setup-runtime`, `setupEntry` /
  ertelenmiş başlatma tarafından kullanılan ve güvenli içe aktarmalı kurulum yama bağdaştırıcılarını da içeren çalışma zamanı güvenli kurulum yüzeyidir.
  `setup-adapter-runtime`, ortama duyarlı hesap kurulumu bağdaştırıcı hattıdır.
  `setup-tools`, küçük CLI/arşiv/belgeler yardımcı hattıdır (`formatCliCommand`,
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
  `openclaw/plugin-sdk/directory-runtime` gibi alan alt yolları paylaşılan çalışma zamanı/config yardımcıları içindir.
  `telegram-command-config`, Telegram özel
  komut normalizasyonu/doğrulaması için dar genel hattır ve paketlenmiş
  Telegram sözleşme yüzeyi geçici olarak kullanılamadığında bile erişilebilir kalır.
  `text-runtime`, asistan tarafından görülebilen metin ayıklama,
  markdown işleme/parçalama yardımcıları, redaksiyon
  yardımcıları, yönerge etiketi yardımcıları ve güvenli metin yardımcıları dahil olmak üzere
  paylaşılan metin/markdown/loglama hattıdır.
- Onaya özgü kanal hatları, Plugin üzerindeki tek bir `approvalCapability`
  sözleşmesini tercih etmelidir. Çekirdek daha sonra onay kimlik doğrulamasını, teslimi, işlemeyi,
  yerel yönlendirmeyi ve tembel yerel işleyici davranışını, onay davranışını
  ilgisiz Plugin alanlarına karıştırmak yerine bu tek yetenek üzerinden okur.
- `openclaw/plugin-sdk/channel-runtime` kullanımdan kaldırılmıştır ve yalnızca
  eski Pluginler için bir uyumluluk şimi olarak kalır. Yeni kod bunun yerine daha dar
  genel ilkel öğeleri içe aktarmalıdır ve depo kodu şim için yeni içe aktarımlar eklememelidir.
- Paketlenmiş uzantı iç yapıları gizli kalır. Harici Pluginler yalnızca
  `openclaw/plugin-sdk/*` alt yollarını kullanmalıdır. OpenClaw çekirdek/test kodu,
  `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` ve
  `login-qr-api.js` gibi dar kapsamlı dosyalar gibi bir Plugin paket kökü altındaki depo genel giriş noktalarını kullanabilir.
  Çekirdekten veya başka bir uzantıdan asla bir Plugin paketinin `src/*` yolunu içe aktarmayın.
- Depo giriş noktası ayrımı:
  `<plugin-package-root>/api.js` yardımcı/tipler varilidir,
  `<plugin-package-root>/runtime-api.js` yalnızca çalışma zamanı varilidir,
  `<plugin-package-root>/index.js` paketlenmiş Plugin girişidir
  ve `<plugin-package-root>/setup-entry.js` kurulum Plugin girişidir.
- Güncel paketlenmiş sağlayıcı örnekleri:
  - Anthropic, `wrapAnthropicProviderStream`, beta üstbilgi yardımcıları ve `service_tier`
    ayrıştırması gibi Claude akış yardımcıları için `api.js` / `contract-api.js` kullanır.
  - OpenAI, sağlayıcı oluşturucular, varsayılan model yardımcıları ve
    gerçek zamanlı sağlayıcı oluşturucular için `api.js` kullanır.
  - OpenRouter, sağlayıcı oluşturucusu ile onboarding/config
    yardımcıları için `api.js` kullanır; `register.runtime.js` ise depo içi kullanım için genel
    `plugin-sdk/provider-stream` yardımcılarını yeniden dışa aktarabilir.
- Cephe üzerinden yüklenen genel giriş noktaları, varsa etkin çalışma zamanı config anlık görüntüsünü tercih eder;
  OpenClaw henüz bir çalışma zamanı anlık görüntüsü sunmuyorsa diskte çözülmüş config dosyasına geri döner.
- Genel paylaşılan ilkel öğeler tercih edilen genel SDK sözleşmesi olmaya devam eder. Paketlenmiş kanal markalı yardımcı hatlarının
  küçük ve ayrılmış bir uyumluluk kümesi hâlâ mevcuttur. Bunları yeni
  üçüncü taraf içe aktarma hedefleri olarak değil, paketlenmiş bakım/uyumluluk hatları olarak değerlendirin; yeni kanallar arası sözleşmeler yine de
  genel `plugin-sdk/*` alt yollarında veya Plugin’e yerel `api.js` /
  `runtime-api.js` varillerinde yer almalıdır.

Uyumluluk notu:

- Yeni kod için kök `openclaw/plugin-sdk` varilinden kaçının.
- Önce dar ve kararlı ilkel öğeleri tercih edin. Daha yeni setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool alt yolları, yeni
  paketlenmiş ve harici Plugin çalışmaları için amaçlanan sözleşmedir.
  Hedef ayrıştırma/eşleme `openclaw/plugin-sdk/channel-targets` üzerinde yer almalıdır.
  Mesaj eylemi geçitleri ve tepki message-id yardımcıları
  `openclaw/plugin-sdk/channel-actions` üzerinde yer almalıdır.
- Paketlenmiş uzantıya özgü yardımcı variller varsayılan olarak kararlı değildir. Bir
  yardımcı yalnızca paketlenmiş bir uzantı için gerekiyorsa, onu
  `openclaw/plugin-sdk/<extension>` içine yükseltmek yerine uzantının yerel
  `api.js` veya `runtime-api.js` hattının arkasında tutun.
- Yeni paylaşılan yardımcı hatları kanal markalı değil, genel olmalıdır. Paylaşılan hedef
  ayrıştırma `openclaw/plugin-sdk/channel-targets` üzerinde yer almalıdır; kanala özgü
  iç yapılar ise sahibi olan Plugin’in yerel `api.js` veya `runtime-api.js`
  hattının arkasında kalmalıdır.
- `image-generation`,
  `media-understanding` ve `speech` gibi yeteneğe özgü alt yollar, paketlenmiş/yerel Pluginler bugün
  bunları kullandığı için vardır. Bunların varlığı, dışa aktarılan her yardımcının
  uzun vadede donmuş bir harici sözleşme olduğu anlamına tek başına gelmez.

## Mesaj aracı şemaları

Pluginler kanala özgü `describeMessageTool(...)` şema
katkılarının sahibi olmalıdır. Sağlayıcıya özgü alanları paylaşılan çekirdekte değil, Plugin içinde tutun.

Paylaşılan taşınabilir şema parçaları için
`openclaw/plugin-sdk/channel-actions` üzerinden dışa aktarılan genel yardımcıları yeniden kullanın:

- düğme ızgarası tarzı yükler için `createMessageToolButtonsSchema()`
- yapılandırılmış kart yükleri için `createMessageToolCardSchema()`

Bir şema şekli yalnızca tek bir sağlayıcı için anlamlıysa, bunu paylaşılan SDK’ya yükseltmek yerine
o Plugin’in kendi kaynağında tanımlayın.

## Kanal hedef çözümleme

Kanal Pluginleri kanala özgü hedef semantiğinin sahibi olmalıdır. Paylaşılan
giden hostu genel tutun ve sağlayıcı kuralları için mesajlaşma bağdaştırıcı yüzeyini kullanın:

- `messaging.inferTargetChatType({ to })`, normalize edilmiş bir hedefin
  dizin aramasından önce `direct`, `group` veya `channel` olarak ele alınıp alınmayacağına karar verir.
- `messaging.targetResolver.looksLikeId(raw, normalized)`, bir girdinin
  dizin araması yerine doğrudan kimlik benzeri çözümlemeye atlayıp atlamaması gerektiğini çekirdeğe söyler.
- `messaging.targetResolver.resolveTarget(...)`, çekirdeğin
  normalizasyondan sonra veya bir dizin ıskasından sonra son bir sağlayıcıya ait çözümlemeye ihtiyaç duyduğunda kullandığı Plugin geri dönüşüdür.
- `messaging.resolveOutboundSessionRoute(...)`, bir hedef çözümlendikten sonra sağlayıcıya özgü oturum
  yol oluşturmanın sahibidir.

Önerilen ayrım:

- Eşleri/grupları aramadan önce gerçekleşmesi gereken kategori kararları için `inferTargetChatType` kullanın.
- “Bunu açık/yerel bir hedef kimliği olarak ele al” kontrolleri için `looksLikeId` kullanın.
- Geniş dizin araması için değil, sağlayıcıya özgü normalizasyon geri dönüşü için `resolveTarget` kullanın.
- Sohbet kimlikleri, iş parçacığı kimlikleri, JID’ler, handle’lar ve oda
  kimlikleri gibi sağlayıcıya özgü yerel kimlikleri, genel SDK alanlarında değil `target` değerleri veya sağlayıcıya özgü parametreler içinde tutun.

## Config destekli dizinler

Config’ten dizin girdileri türeten Pluginler bu mantığı Plugin içinde tutmalı ve
`openclaw/plugin-sdk/directory-runtime`
içindeki paylaşılan yardımcıları yeniden kullanmalıdır.

Bir kanal aşağıdakiler gibi config destekli eşlere/gruplara ihtiyaç duyduğunda bunu kullanın:

- allowlist güdümlü DM eşleri
- yapılandırılmış kanal/grup eşlemeleri
- hesap kapsamlı statik dizin geri dönüşleri

`directory-runtime` içindeki paylaşılan yardımcılar yalnızca genel işlemleri işler:

- sorgu filtreleme
- sınır uygulama
- tekilleştirme/normalizasyon yardımcıları
- `ChannelDirectoryEntry[]` oluşturma

Kanala özgü hesap incelemesi ve kimlik normalizasyonu
Plugin uygulamasında kalmalıdır.

## Sağlayıcı katalogları

Sağlayıcı Pluginleri, çıkarım için
`registerProvider({ catalog: { run(...) { ... } } })` ile model katalogları tanımlayabilir.

`catalog.run(...)`, OpenClaw’ın
`models.providers` içine yazdığıyla aynı şekli döndürür:

- tek bir sağlayıcı girdisi için `{ provider }`
- birden çok sağlayıcı girdisi için `{ providers }`

Plugin sağlayıcıya özgü model kimliklerinin, temel URL varsayılanlarının veya kimlik doğrulama korumalı model meta verilerinin sahibi olduğunda
`catalog` kullanın.

`catalog.order`, bir Plugin’in kataloğunun OpenClaw’ın
yerleşik örtük sağlayıcılarına göre ne zaman birleştirileceğini kontrol eder:

- `simple`: düz API anahtarı veya ortam güdümlü sağlayıcılar
- `profile`: kimlik doğrulama profilleri olduğunda görünen sağlayıcılar
- `paired`: birden fazla ilişkili sağlayıcı girdisi sentezleyen sağlayıcılar
- `late`: diğer örtük sağlayıcılardan sonra son geçiş

Daha sonraki sağlayıcılar anahtar çakışmasında kazanır; böylece Pluginler aynı sağlayıcı kimliğiyle bir
yerleşik sağlayıcı girdisini kasıtlı olarak geçersiz kılabilir.

Uyumluluk:

- `discovery` eski bir takma ad olarak hâlâ çalışır
- hem `catalog` hem `discovery` kayıtlıysa, OpenClaw `catalog` kullanır

## Salt okunur kanal incelemesi

Plugin’iniz bir kanal kaydediyorsa, `resolveAccount(...)` ile birlikte
`plugin.config.inspectAccount(cfg, accountId)` uygulamayı tercih edin.

Neden:

- `resolveAccount(...)` çalışma zamanı yoludur. Kimlik bilgilerinin
  tamamen somutlaştırıldığını varsayabilir ve gerekli gizli bilgiler eksikse hızlıca başarısız olabilir.
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` ve doctor/config
  onarım akışları gibi salt okunur komut yollarının, yalnızca yapılandırmayı
  açıklamak için çalışma zamanı kimlik bilgilerini somutlaştırması gerekmemelidir.

Önerilen `inspectAccount(...)` davranışı:

- Yalnızca açıklayıcı hesap durumunu döndürün.
- `enabled` ve `configured` değerlerini koruyun.
- İlgili olduğunda kimlik bilgisi kaynağı/durum alanlarını ekleyin, örneğin:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Salt okunur kullanılabilirliği bildirmek için ham token değerlerini döndürmeniz gerekmez.
  Durum tarzı komutlar için `tokenStatus: "available"` döndürmek (ve eşleşen kaynak
  alanını vermek) yeterlidir.
- Bir kimlik bilgisi SecretRef ile yapılandırılmış ancak
  mevcut komut yolunda kullanılamıyorsa `configured_unavailable` kullanın.

Bu, salt okunur komutların çökmek veya hesabı yapılandırılmamış olarak yanlış bildirmek yerine
“yapılandırılmış ama bu komut yolunda kullanılamıyor” raporlamasını sağlar.

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

Her girdi bir Plugin olur. Paket birden fazla uzantı listeliyorsa, Plugin kimliği
`name/<fileBase>` olur.

Plugin’iniz npm bağımlılıkları içe aktarıyorsa, `node_modules`
mevcut olsun diye bunları o dizine kurun (`npm install` / `pnpm install`).

Güvenlik koruması: her `openclaw.extensions` girdisi, symlink çözümlemesinden sonra
Plugin dizini içinde kalmalıdır. Paket dizininden taşan girdiler
reddedilir.

Güvenlik notu: `openclaw plugins install`, Plugin bağımlılıklarını
`npm install --omit=dev --ignore-scripts` ile kurar (yaşam döngüsü betikleri yok, çalışma zamanında geliştirme bağımlılıkları yok). Plugin bağımlılık
ağaçlarını “salt JS/TS” tutun ve `postinstall` derlemeleri gerektiren paketlerden kaçının.

İsteğe bağlı: `openclaw.setupEntry` hafif, yalnızca kurulum amaçlı bir modüle işaret edebilir.
OpenClaw, devre dışı bir kanal Plugin’i için kurulum yüzeylerine ihtiyaç duyduğunda veya
bir kanal Plugin’i etkin olup hâlâ yapılandırılmamış olduğunda, tam Plugin girdisi yerine
`setupEntry` yüklenir. Bu, ana Plugin girdiniz araçlar, kancalar veya çalışma zamanına özgü başka
kodlar da bağlıyorsa başlatma ve kurulumu daha hafif tutar.

İsteğe bağlı: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`,
kanal zaten yapılandırılmış olsa bile, bir kanal Plugin’ini gateway’in
listen öncesi başlatma aşamasında aynı `setupEntry` yoluna alabilir.

Bunu yalnızca `setupEntry`, gateway dinlemeye başlamadan önce
var olması gereken başlatma yüzeyini tamamen kapsıyorsa kullanın. Pratikte bu, kurulum girdisinin başlatmanın bağlı olduğu
kanala ait her yeteneği kaydetmesi gerektiği anlamına gelir; örneğin:

- kanal kaydının kendisi
- gateway dinlemeye başlamadan önce kullanılabilir olması gereken tüm HTTP yolları
- aynı pencere sırasında var olması gereken tüm Gateway yöntemleri, araçlar veya hizmetleri

Tam girdiniz hâlâ gerekli herhangi bir başlatma yeteneğinin sahibiyse, bu bayrağı
etkinleştirmeyin. Plugin’i varsayılan davranışta bırakın ve OpenClaw’ın
başlatma sırasında tam girdiyi yüklemesine izin verin.

Paketlenmiş kanallar ayrıca, tam kanal çalışma zamanı yüklenmeden önce çekirdeğin
danışabileceği yalnızca kurulum amaçlı sözleşme yüzeyi yardımcıları yayımlayabilir. Güncel kurulum
terfi yüzeyi şudur:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Çekirdek bu yüzeyi, eski tek hesaplı kanal
config’ini tam Plugin girdisini yüklemeden `channels.<id>.accounts.*` içine taşımak gerektiğinde kullanır.
Matrix, mevcut paketlenmiş örnektir: adlandırılmış hesaplar zaten varsa yalnızca auth/bootstrap anahtarlarını
adlandırılmış bir terfi edilmiş hesaba taşır ve her zaman
`accounts.default` oluşturmaktansa yapılandırılmış, kanonik olmayan bir varsayılan hesap anahtarını koruyabilir.

Bu kurulum yama bağdaştırıcıları, paketlenmiş sözleşme yüzeyi keşfini tembel tutar.
İçe aktarma zamanı hafif kalır; terfi yüzeyi modül içe aktarımında paketlenmiş kanal başlatmasına yeniden girmek yerine
yalnızca ilk kullanımda yüklenir.

Bu başlatma yüzeyleri Gateway RPC yöntemleri içerdiğinde, bunları
Plugin’e özgü bir önek üzerinde tutun. Çekirdek yönetici ad alanları (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış kalır ve bir Plugin daha dar bir kapsam istese bile
her zaman `operator.admin` olarak çözümlenir.

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

Kanal Pluginleri `openclaw.channel` üzerinden kurulum/keşif meta verileri ve
`openclaw.install` üzerinden kurulum ipuçları duyurabilir. Bu, çekirdek kataloğu verisiz tutar.

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
- `docsLabel`: belgeler bağlantısı için bağlantı metnini geçersiz kılar
- `preferOver`: bu katalog girdisinin önüne geçmesi gereken daha düşük öncelikli Plugin/kanal kimlikleri
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: seçim yüzeyi metni denetimleri
- `markdownCapable`: giden biçimlendirme kararları için kanalı markdown destekli olarak işaretler
- `exposure.configured`: `false` olduğunda kanalı yapılandırılmış kanal listeleme yüzeylerinden gizler
- `exposure.setup`: `false` olduğunda kanalı etkileşimli kurulum/yapılandırma seçicilerinden gizler
- `exposure.docs`: kanalı belgeler gezinme yüzeyleri için dahili/özel olarak işaretler
- `showConfigured` / `showInSetup`: uyumluluk için eski takma adlar hâlâ kabul edilir; `exposure` tercih edilir
- `quickstartAllowFrom`: kanalı standart hızlı başlangıç `allowFrom` akışına dahil eder
- `forceAccountBinding`: yalnızca bir hesap olsa bile açık hesap bağlaması gerektirir
- `preferSessionLookupForAnnounceTarget`: duyuru hedeflerini çözümlerken oturum aramasını tercih eder

OpenClaw ayrıca **harici kanal kataloglarını** da birleştirebilir (örneğin bir MPM
kayıt sistemi dışa aktarımı). Şu konumlardan birine bir JSON dosyası bırakın:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Veya `OPENCLAW_PLUGIN_CATALOG_PATHS` (ya da `OPENCLAW_MPM_CATALOG_PATHS`) değerini
bir veya daha fazla JSON dosyasına yönlendirin (virgül/noktalı virgül/`PATH` ayrımlı). Her dosya `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` içermelidir. Ayrıştırıcı, `"entries"` anahtarı için eski takma adlar olarak `"packages"` veya `"plugins"` anahtarlarını da kabul eder.

## Bağlam motoru Pluginleri

Bağlam motoru Pluginleri, alma, derleme
ve Compaction için oturum bağlamı orkestrasyonunun sahibidir. Bunları Plugin’inizden
`api.registerContextEngine(id, factory)` ile kaydedin, ardından etkin motoru
`plugins.slots.contextEngine` ile seçin.

Bunu, Plugin’inizin yalnızca bellek araması veya kancalar eklemek yerine varsayılan bağlam
hattını değiştirmesi ya da genişletmesi gerektiğinde kullanın.

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

Motorunuz Compaction algoritmasının sahibi **değilse**, `compact()`
uygulamasını koruyun ve bunu açıkça devredin:

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

Bir Plugin mevcut API’ye uymayan bir davranışa ihtiyaç duyduğunda,
Plugin sistemini özel bir içe sızmayla aşmayın. Eksik yeteneği ekleyin.

Önerilen sıra:

1. çekirdek sözleşmeyi tanımlayın
   Çekirdeğin hangi paylaşılan davranışın sahibi olması gerektiğine karar verin: ilke, geri dönüş, config birleştirme,
   yaşam döngüsü, kanala dönük semantik ve çalışma zamanı yardımcı şekli.
2. tipli Plugin kayıt/çalışma zamanı yüzeyleri ekleyin
   `OpenClawPluginApi` ve/veya `api.runtime` yapısını, en küçük kullanışlı
   tipli yetenek yüzeyiyle genişletin.
3. çekirdek + kanal/özellik tüketicilerini bağlayın
   Kanallar ve özellik Pluginleri yeni yeteneği doğrudan bir satıcı uygulamasını içe aktararak değil,
   çekirdek üzerinden tüketmelidir.
4. satıcı uygulamalarını kaydedin
   Satıcı Pluginleri daha sonra arka uçlarını yeteneğe karşı kaydeder.
5. sözleşme kapsamı ekleyin
   Sahipliğin ve kayıt şeklinin zaman içinde açık kalması için testler ekleyin.

OpenClaw bu şekilde tek bir
sağlayıcının dünya görüşüne sabit kodlanmadan görüş sahibi kalır. Somut bir dosya kontrol listesi ve uygulanmış örnek için
[Capability Cookbook](/tr/plugins/architecture)
sayfasına bakın.

### Yetenek kontrol listesi

Yeni bir yetenek eklediğinizde, uygulama genellikle şu
yüzeylere birlikte dokunmalıdır:

- `src/<capability>/types.ts` içindeki çekirdek sözleşme tipleri
- `src/<capability>/runtime.ts` içindeki çekirdek çalıştırıcı/çalışma zamanı yardımcısı
- `src/plugins/types.ts` içindeki Plugin API kayıt yüzeyi
- `src/plugins/registry.ts` içindeki Plugin kayıt sistemi bağlaması
- özellik/kanal Pluginlerinin tüketmesi gerektiğinde `src/plugins/runtime/*` içindeki
  Plugin çalışma zamanı açığa çıkarımı
- `src/test-utils/plugin-registration.ts` içindeki yakalama/test yardımcıları
- `src/plugins/contracts/registry.ts` içindeki sahiplik/sözleşme doğrulamaları
- `docs/` içindeki operatör/Plugin belgeleri

Bu yüzeylerden biri eksikse, bu genellikle yeteneğin
henüz tam olarak entegre edilmediğinin işaretidir.

### Yetenek şablonu

En küçük kalıp:

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

Sözleşme testi kalıbı:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Bu, kuralı basit tutar:

- çekirdek yetenek sözleşmesinin + orkestrasyonun sahibidir
- satıcı Pluginleri satıcı uygulamalarının sahibidir
- özellik/kanal Pluginleri çalışma zamanı yardımcılarını tüketir
- sözleşme testleri sahipliği açık tutar

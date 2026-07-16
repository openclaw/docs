---
read_when:
    - Yeni bir mesajlaşma kanalı plugini oluşturuyorsunuz
    - OpenClaw'ı bir mesajlaşma platformuna bağlamak istiyorsunuz
    - ChannelPlugin bağdaştırıcı yüzeyini anlamanız gerekir
sidebarTitle: Channel Plugins
summary: OpenClaw için mesajlaşma kanalı plugini oluşturmaya yönelik adım adım kılavuz
title: Kanal pluginleri oluşturma
x-i18n:
    generated_at: "2026-07-16T17:33:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c6398dd0b4789b9f4aaf7ad2d1786a7e6388cb8fbb74e8ecaecae7ac0a5eb90
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Bu kılavuz, OpenClaw'u bir mesajlaşma platformuna bağlayan bir kanal
plugini oluşturur: DM güvenliği, eşleştirme, yanıtları iş parçacıklarına ayırma ve giden mesajlaşma.

<Info>
  OpenClaw pluginlerini ilk kez mi kullanıyorsunuz? Paket yapısı ve manifest kurulumu için
  önce [Başlarken](/tr/plugins/building-plugins) bölümünü okuyun.
</Info>

## Plugininizin sorumlulukları

Kanal pluginleri gönderme/düzenleme/tepki araçlarını uygulamaz; çekirdek tek bir
paylaşılan `message` aracı sağlar. Plugininizin sorumlulukları:

- **Yapılandırma** - hesap çözümleme ve kurulum sihirbazı
- **Güvenlik** - DM politikası ve izin verilenler listeleri
- **Eşleştirme** - DM onay akışı
- **Oturum dil bilgisi** - sağlayıcıya özgü konuşma kimliklerinin temel
  sohbetlere, iş parçacığı kimliklerine ve üst öğe geri dönüşlerine nasıl eşlendiği
- **Giden** - platforma metin, medya ve anket gönderme
- **İş parçacıkları** - yanıtların iş parçacıklarına nasıl ayrıldığı
- **Heartbeat yazma durumu** - Heartbeat teslim
  hedefleri için isteğe bağlı yazıyor/meşgul sinyalleri

Çekirdek; paylaşılan mesaj aracından, istem bağlantılarından, dış oturum anahtarı biçiminden,
genel `:thread:` kayıt yönetiminden ve dağıtımdan sorumludur.

## Mesaj bağdaştırıcısı

`openclaw/plugin-sdk/channel-outbound` içinden `defineChannelMessageAdapter` ile bir
`message` bağdaştırıcısı sunun. Yalnızca yerel aktarımınızın gerçekten
desteklediği kalıcı nihai gönderim yeteneklerini bildirin ve bunları yerel yan
etkiyi ve döndürülen alındı belgesini kanıtlayan bir sözleşme testiyle destekleyin.
Metin/medya gönderimlerini, eski `outbound` bağdaştırıcısının kullandığı
aynı aktarım işlevlerine yönlendirin. Tam API sözleşmesi, yetenek matrisi, alındı
belgesi kuralları, canlı önizleme sonlandırma, alma onayı politikası, testler ve
geçiş tablosu için [Kanal giden API'si](/tr/plugins/sdk-channel-outbound) bölümüne bakın.

Mevcut `outbound` bağdaştırıcınız zaten doğru gönderim yöntemlerine ve
yetenek meta verilerine sahipse başka bir köprüyü elle yazmak yerine
`createChannelMessageAdapterFromOutbound(...)` ile `message` bağdaştırıcısını türetin.
Bağdaştırıcı gönderimleri `MessageReceipt` değerlerini döndürür. Eski kimlikler
için paralel `messageIds` alanlarını tutmak yerine bunları
`listMessageReceiptPlatformIds(...)` veya `resolveMessageReceiptPrimaryId(...)` ile türetin.

Canlı ve sonlandırıcı yetenekleri kesin olarak bildirin; çekirdek bir kanalın
neler yapabileceğine karar vermek için bunları kullanır ve bildirilen davranışla
gerçek davranış arasındaki sapma bir sözleşme testi hatasıdır:

| Yüzey                                | Değerler                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`                   | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities`                   | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure` |

Bir taslak önizlemesini yerinde sonlandıran kanallar, çalışma zamanı mantığını
`defineFinalizableLivePreviewAdapter(...)` ile `deliverWithFinalizableLivePreviewAdapter(...)` üzerinden yönlendirmeli ve bildirilen
yetenekleri `verifyChannelMessageLiveCapabilityAdapterProofs(...)` ve `verifyChannelMessageLiveFinalizerProofs(...)` testleriyle desteklemelidir;
böylece yerel önizleme, ilerleme, düzenleme, geri dönüş/saklama, temizleme ve
alındı belgesi davranışları fark edilmeden sapamaz.

Platform onaylarını erteleyen gelen ileti alıcıları, onay zamanlamasını izleyiciye
özgü durumda gizlemek yerine `message.receive.defaultAckPolicy` ve `supportedAckPolicies` bildirmelidir.
Bildirilen her politikayı `verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` ile kapsayın.

`dispatchInboundReplyWithBase` ve `recordInboundSessionAndDispatchReply` gibi eski yanıt yardımcıları uyumluluk
dağıtıcıları için kullanılabilir olmaya devam eder. Bunları yeni kanal kodunda
kullanmayın; bunun yerine `message` bağdaştırıcısı, alındı belgeleri ve
`openclaw/plugin-sdk/channel-outbound` üzerindeki alma/gönderme yaşam döngüsü yardımcılarıyla başlayın.

### Gelen giriş (deneysel)

Gelen yetkilendirmeyi taşıyan kanallar, çalışma zamanı alma yollarındaki deneysel
`openclaw/plugin-sdk/channel-ingress-runtime` alt yolunu kullanabilir. Bu yol platform olgularını, ham izin
verilenler listelerini, rota tanımlayıcılarını, komut olgularını ve erişim grubu
yapılandırmasını kabul eder; ardından gönderici/rota/komut/etkinleştirme
izdüşümlerini ve sıralı giriş grafiğini döndürür. Bu sırada platform araması ve
yan etkiler pluginde kalır. Plugin kimliği normalleştirmesini çözümleyiciye
ilettiğiniz tanımlayıcıda tutun; çözümlenen durumdan veya karardan ham eşleşme
değerlerini serileştirmeyin. API tasarımı, sorumluluk sınırı ve test beklentileri
için [Kanal giriş API'si](/tr/plugins/sdk-channel-ingress) bölümüne bakın.

### Yazma göstergeleri

Kanalınız gelen yanıtlardan bağımsız yazma göstergelerini destekliyorsa kanal
plugininde `heartbeat.sendTyping(...)` sunun. Çekirdek, Heartbeat model çalışması başlamadan
önce bunu çözümlenen Heartbeat teslim hedefiyle çağırır ve paylaşılan yazma durumu
canlı tutma/temizleme yaşam döngüsünü kullanır. Platform açık bir durdurma sinyali
gerektiriyorsa `heartbeat.clearTyping(...)` ekleyin.

### Medya kaynağı parametreleri

Kanalınız mesaj aracına medya kaynaklarını taşıyan parametreler ekliyorsa bu
parametre adlarını `plugin.actions.describeMessageTool(...).mediaSourceParams` üzerinden sunun. Çekirdek, korumalı alan
yolu normalleştirmesi ve giden medya erişim politikası için bu açık listeyi
kullanır; böylece pluginler sağlayıcıya özgü avatar, ek veya kapak görseli
parametreleri için paylaşılan çekirdekte özel durumlara ihtiyaç duymaz.

İlgisiz eylemlerin başka bir eylemin medya bağımsız değişkenlerini devralmaması
için `{ "set-profile": ["avatarUrl", "avatarPath"] }` gibi eylem anahtarlı bir eşlemeyi tercih edin. Düz bir
dizi, sunulan her eylem arasında bilerek paylaşılan parametreler için çalışmaya
devam eder.

Platform tarafında medya getirme işlemi için geçici bir genel URL sunması gereken
kanallar, plugin durum depolarıyla birlikte `openclaw/plugin-sdk/outbound-media` içindeki
`createHostedOutboundMediaStore(...)` öğesini kullanabilir. Platform rota ayrıştırmasını ve belirteç
uygulamasını kanal plugininde tutun; paylaşılan yardımcı yalnızca medya yükleme,
süre sonu meta verileri, parça satırları ve temizlemeden sorumludur.

### Yerel yük biçimlendirme

Kanalınız `message(action="send")` için sağlayıcıya özgü biçimlendirmeye ihtiyaç duyuyorsa
`actions.prepareSendPayload(...)` tercih edin. Yerel kartları, blokları, gömmeleri veya diğer
kalıcı verileri `payload.channelData.<channel>` altına koyun ve çekirdeğin giden/mesaj
bağdaştırıcısı üzerinden göndermesini sağlayın. Gönderim için
`actions.handleAction(...)` öğesini yalnızca serileştirilemeyen ve yeniden denenemeyen
yükler için uyumluluk geri dönüşü olarak kullanın.

### Oturum konuşması dil bilgisi

Platformunuz konuşma kimliklerinde ek kapsam saklıyorsa bu ayrıştırmayı
`messaging.resolveSessionConversation(...)` ile pluginde tutun. Bu, `rawId` öğesini temel konuşma
kimliğine, isteğe bağlı iş parçacığı kimliğine, açık `baseConversationId` öğesine ve
herhangi bir `parentConversationCandidates` öğesine eşlemek için kurallı kancadır.
`parentConversationCandidates` döndürdüğünüzde bunları en dar üst öğeden en geniş/temel
konuşmaya doğru sıralayın.

`messaging.resolveParentConversationCandidates(...)`, yalnızca genel/ham kimliğe üst öğe geri dönüşleri eklemesi
gereken pluginler için kullanımdan kaldırılmış bir uyumluluk geri dönüşüdür.
Her iki kanca da mevcutsa çekirdek önce `resolveSessionConversation(...).parentConversationCandidates` kullanır ve yalnızca
kurallı kanca bunları atladığında `resolveParentConversationCandidates(...)` öğesine geri döner.

Kanal kayıt defteri başlatılmadan önce aynı ayrıştırmaya ihtiyaç duyan paketlenmiş
pluginler, eşleşen bir `resolveSessionConversation(...)` dışa aktarımına sahip üst düzey bir
`session-key-api.ts` dosyası sunabilir (Feishu ve Telegram pluginlerine bakın).
Çekirdek, başlangıç için güvenli bu yüzeyi yalnızca çalışma zamanı plugin kayıt
defteri henüz kullanılamıyorsa kullanır.

Plugin kodunun rota benzeri alanları normalleştirmesi, bir alt iş parçacığını üst
rotasıyla karşılaştırması veya `{ channel, to, accountId, threadId }` öğesinden kararlı bir tekilleştirme
anahtarı oluşturması gerektiğinde `openclaw/plugin-sdk/channel-route` kullanın. Yardımcı, sayısal
iş parçacığı kimliklerini çekirdekle aynı şekilde normalleştirir; bu nedenle
geçici `String(threadId)` karşılaştırmaları yerine onu tercih edin.
Sağlayıcıya özgü hedef dil bilgisine sahip pluginler `messaging.resolveOutboundSessionRoute(...)` sunmalıdır;
böylece çekirdek, ayrıştırıcı uyumluluk katmanları olmadan sağlayıcıya özgü
oturum ve iş parçacığı kimliğini alır.

### Hesap kapsamlı konuşma bağlama desteği

Kanal genel geçerli konuşma bağlamalarını destekliyorsa `conversationBindings.supportsCurrentConversationBinding` ayarlayın.
`createChatChannelPlugin(...)` bu statik yeteneği varsayılan olarak `true` değerine
ayarlar.

Destek yapılandırılan hesaba göre değişiyorsa ayrıca `conversationBindings.isCurrentConversationBindingSupported({ accountId })` uygulayın.
Çekirdek bu eşzamanlı kancayı yalnızca statik yetenek etkinleştirildikten sonra
değerlendirir. `false` döndürmek, genel geçerli konuşma yeteneğini ve
bağlama, arama, listeleme, dokunma ve bağ kaldırma işlemlerini söz konusu hesap
için kullanılamaz hâle getirir. Kancanın atlanması statik yeteneği her hesaba
uygular.

Yanıtı önceden yüklenmiş hesap yapılandırmasından veya çalışma zamanı durumundan
çözümleyin. Bu kanca yalnızca genel geçerli konuşma bağlamalarını denetler;
yapılandırılmış bağlama kurallarının veya plugine ait oturum yönlendirmesinin
yerini almaz. Sözleşme testleri, `openclaw/plugin-sdk/channel-core` tarafından dışa aktarılan
`ChannelPlugin["conversationBindings"]` sözleşmesi üzerinden en az bir desteklenen ve bir desteklenmeyen
hesabı kapsamalıdır.

## Onaylar ve kanal yetenekleri

Çoğu kanal plugini onaya özgü koda ihtiyaç duymaz. Çekirdek aynı sohbet
`/approve`, paylaşılan onay düğmesi yükleri ve genel geri dönüş tesliminden
sorumludur. `ChannelPlugin.approvals` kaldırıldı; bunun yerine onay teslimi/yerel
işleme/görüntüleme/yetkilendirme olgularını tek bir `approvalCapability` nesnesine
yerleştirin. `plugin.auth` yalnızca oturum açma/kapatma içindir; çekirdek artık
onay yetkilendirme kancalarını bu nesneden okumaz.

`approvalCapability.delivery` öğesini yalnızca yerel onay yönlendirmesi veya geri dönüş
bastırma için, `approvalCapability.render` öğesini ise yalnızca bir kanalın paylaşılan
görüntüleyici yerine gerçekten özel onay yüklerine ihtiyacı olduğunda kullanın.

### Onay yetkilendirmesi

- `approvalCapability.authorizeActorAction` ve
  `approvalCapability.getActionAvailabilityState`, kurallı onay
  yetkilendirme sınırıdır.
- Aynı sohbet onay yetkilendirmesi kullanılabilirliği için
  `getActionAvailabilityState` kullanın. Yerel teslim devre dışı olsa bile yapılandırılmış
  onaylayanları `/approve` için kullanılabilir tutun; bunun yerine teslim/
  kurulum yönlendirmesi için yerel başlatma yüzeyi durumunu kullanın.
- Kanalınız yerel yürütme onayları sunuyorsa başlatma yüzeyi/yerel
  istemci durumu aynı sohbet onay yetkilendirmesinden farklı olduğunda
  `approvalCapability.getExecInitiatingSurfaceState` kullanın. Çekirdek bu yürütmeye özgü kancayı
  `enabled` ile `disabled` arasındaki farkı belirlemek, başlatan
  kanalın yerel yürütme onaylarını destekleyip desteklemediğine karar vermek ve
  kanalı yerel istemci geri dönüş yönlendirmesine dâhil etmek için kullanır.
  `createApproverRestrictedNativeApprovalCapability(...)` yaygın durumda bunu doldurur.
- Bir kanal mevcut yapılandırmadan kararlı, sahip benzeri DM
  kimlikleri çıkarabiliyorsa onaya özgü çekirdek mantığı eklemeden aynı sohbet
  `/approve` öğesini kısıtlamak için `openclaw/plugin-sdk/approval-runtime` içindeki
  `createResolvedApproverActionAuthAdapter` öğesini kullanın.
- Özel onay yetkilendirmesi bilerek yalnızca aynı sohbet geri
  dönüşüne izin veriyorsa `openclaw/plugin-sdk/approval-auth-runtime` içinden `markImplicitSameChatApprovalAuthorization({ authorized: true })` döndürün;
  aksi takdirde çekirdek sonucu açık onaylayan yetkilendirmesi olarak ele alır.
- Kanala ait yerel bir geri çağırma onayları doğrudan çözümlüyorsa,
  örtük geri dönüşün kanalın normal aktör yetkilendirmesinden geçmeye devam etmesi
  için çözümlemeden önce `isImplicitSameChatApprovalAuthorization(...)` kullanın.

### Yük yaşam döngüsü ve kurulum yönlendirmesi

- Yinelenen yerel onay istemlerini gizleme veya teslimden önce
  yazma göstergeleri gönderme gibi kanala özgü yük yaşam döngüsü davranışları
  için `outbound.shouldSuppressLocalPayloadPrompt` veya `outbound.beforeDeliverPayload` kullanın.
- Kanal, devre dışı yol yanıtında yerel yürütme onaylarını
  etkinleştirmek için gereken kesin yapılandırma ayarlarının açıklanmasını
  istiyorsa `approvalCapability.describeExecApprovalSetup` kullanın. Kanca `{ channel, channelLabel, accountId }` alır;
  adlandırılmış hesap kanalları üst düzey varsayılanlar yerine
  `channels.<channel>.accounts.<id>.execApprovals.*` gibi hesap kapsamlı yolları görüntülemelidir.
- Plugin onay hatası yönlendirmesinin, plugin onaylarında rota
  bulunamaması ve zaman aşımı hataları için gösterilmesi güvenliyse
  `approvalCapability.describePluginApprovalSetup` kullanın. `createApproverRestrictedNativeApprovalCapability(...)` bunu `describeExecApprovalSetup` öğesinden
  çıkarmaz; aynı yardımcıyı yalnızca plugin ve yürütme onayları gerçekten aynı
  yerel kurulumu kullanıyorsa açıkça iletin.

### Yerel onay teslimi

Bir kanal yerel onay teslimine ihtiyaç duyuyorsa kanal kodunu hedef
normalleştirmesi ile aktarım/sunum olgularına odaklı tutun.
`openclaw/plugin-sdk/approval-runtime` içindeki `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`,
`createChannelApproverDmTargetResolver` ve `createApproverRestrictedNativeApprovalCapability` öğelerini kullanın.
Kanala özgü olguları `approvalCapability.nativeRuntime` arkasına, tercihen
`createChannelApprovalNativeRuntimeAdapter(...)` veya `createLazyChannelApprovalNativeRuntimeAdapter(...)` üzerinden yerleştirin; böylece çekirdek
işleyiciyi oluşturabilir ve istek filtreleme, yönlendirme, tekilleştirme, süre
sonu, Gateway aboneliği ve başka yere yönlendirildi bildirimlerinden sorumlu
olabilir.

`nativeRuntime` birkaç küçük sınıra ayrılmıştır:

- `availability` - hesabın yapılandırılmış olup olmadığı ve bir isteğin
  işlenip işlenmeyeceği
- `presentation` - paylaşılan onay görünüm modelini
  bekleyen/çözümlenmiş/süresi dolmuş yerel yüklerle veya nihai eylemlerle eşleme
- `transport` - hedefleri hazırlamanın yanı sıra yerel onay
  mesajlarını gönderme/güncelleme/silme
- `interactions` - yerel düğmeler
  veya tepkiler için isteğe bağlı bağlama/bağlantıyı kaldırma/eylemi temizleme kancalarının yanı sıra isteğe bağlı bir `cancelDelivered` kancası. `deliverPending` işlem içi veya kalıcı
  durum (örneğin bir tepki hedefi deposu) kaydettiğinde `cancelDelivered`
  uygulayın; böylece bir işleyicinin durması, `bindPending` çalışmadan önce teslimatı iptal ederse veya
  `bindPending` hiçbir tanıtıcı döndürmezse bu durum serbest bırakılabilir
- `observe` - isteğe bağlı teslimat tanılama kancaları

Diğer onay yardımcıları:

- Bir kanal hem oturum kökenli yerel teslimatı
  hem de açık onay yönlendirme hedeflerini desteklediğinde
  `openclaw/plugin-sdk/approval-native-runtime` içinden `createNativeApprovalChannelRouteGates` kullanın. Çağıranlar kanal kimliği, varsayılan yönlendirme modu, hesap
  arama, aktarımın etkin olup olmadığını denetleme, hedef normalleştirme ve dönüş kaynağı
  hedef çözümlemesinin sahipliğini sürdürürken yardımcı; onay yapılandırması seçimini, `mode` işlemeyi, aracı/oturum
  filtrelerini, hesap bağlamayı, oturum-hedef eşleştirmeyi ve hedef listesi eşleştirmeyi
  merkezileştirir. Bunu çekirdeğin sahip olduğu kanal ilkesi
  varsayılanlarını oluşturmak için kullanmayın; kanalın belgelenmiş varsayılan modunu açıkça iletin.
- `createChannelNativeOriginTargetResolver`, `{ to, accountId, threadId }` hedefleri için varsayılan olarak paylaşılan kanal rotası
  eşleştiricisini kullanır. `targetsMatch` yalnızca bir kanalın
  Slack zaman damgası öneki eşleştirmesi gibi sağlayıcıya özgü eşdeğerlik kuralları olduğunda iletilmelidir. Kanalın, varsayılan rota
  eşleştiricisi veya özel bir `targetsMatch` geri çağrısı çalışmadan önce sağlayıcı kimliklerini standartlaştırması
  ve teslimat için özgün hedefi koruması gerektiğinde `normalizeTargetForMatch` iletin. `normalizeTarget` yalnızca çözümlenen
  teslimat hedefinin kendisinin standartlaştırılması gerektiğinde kullanılmalıdır.
- Kanal istemci, belirteç, Bolt
  uygulaması veya webhook alıcısı gibi çalışma zamanının sahip olduğu nesnelere ihtiyaç duyuyorsa bunları
  `openclaw/plugin-sdk/channel-runtime-context` üzerinden kaydedin. Genel çalışma zamanı bağlamı
  kayıt defteri, çekirdeğin onaya özgü sarmalayıcı bağlayıcı kod eklemeden kanal
  başlatma durumundan yetenek odaklı işleyicileri önyüklemesini sağlar.
- Yalnızca yetenek odaklı bağlantı noktası
  henüz yeterince ifade gücüne sahip olmadığında daha düşük düzeyli `createChannelApprovalHandler` veya
  `createChannelNativeApprovalRuntime` kullanın.
- Yerel onay kanalları hem `accountId` hem de `approvalKind`
  değerlerini bu yardımcılar üzerinden yönlendirmelidir. `accountId`, çok hesaplı onay ilkesini
  doğru bot hesabının kapsamında tutar; `approvalKind` ise çekirdekte sabit kodlanmış dallar
  olmadan yürütme ile plugin onayı davranışının kanalda kullanılabilmesini sağlar.
- Onay yeniden yönlendirme bildirimlerinin sahipliği de çekirdeğe aittir. Kanal pluginleri
  `createChannelNativeApprovalRuntime` içinden kendi "onay DM'lere / başka bir kanala gitti" takip mesajlarını
  göndermemelidir; bunun yerine paylaşılan onay yeteneği yardımcıları üzerinden doğru köken +
  onaylayan DM yönlendirmesini sunmalı ve başlatan sohbete herhangi bir bildirim göndermeden önce
  çekirdeğin gerçek teslimatları toplamasına izin vermelidir.
- Teslim edilen onay kimliği türünü uçtan uca koruyun. Yerel istemciler
  yürütme ile plugin onayı yönlendirmesini kanala özgü
  durumdan tahmin etmemeli veya yeniden yazmamalıdır.
- Bu açık `approvalKind` değerini `resolveApprovalOverGateway` öğesine iletin. Bu,
  standart `approval.resolve` hizmetini kullanır ve başka
  bir yüzey önce yanıt verdiğinde kaydedilen kazananı döndürür. Eski açık `resolveMethod` girdisi
  komut destekli denetimler için kalır; yeni yerel eylemler bunu kullanmamalı veya
  türü bir kimlikten çıkarsamamalıdır.
- Farklı onay türleri kasıtlı olarak farklı yerel
  yüzeyler sunabilir. Mevcut paketlenmiş örnekler: Matrix, yürütme ve plugin onayları için aynı yerel DM/kanal
  yönlendirmesini ve tepki kullanıcı deneyimini korurken kimlik doğrulamanın onay türüne göre
  farklılaşmasına yine de izin verir; Slack, hem yürütme hem de plugin kimlikleri için yerel onay yönlendirmesini
  kullanılabilir tutar.
- `createApproverRestrictedNativeApprovalAdapter` bir
  uyumluluk sarmalayıcısı olarak hâlâ mevcuttur; ancak yeni kod yetenek oluşturucuyu tercih etmeli
  ve pluginde `approvalCapability` sunmalıdır.

### Daha dar onay çalışma zamanı alt yolları

Sık kullanılan kanal giriş noktalarında, bu ailenin yalnızca bir bölümüne ihtiyacınız olduğunda daha geniş
`approval-runtime` varili yerine şu daha dar alt yolları tercih edin:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-reference-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Benzer şekilde, tümüne ihtiyacınız olmadığında daha geniş şemsiye yüzeyler yerine
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` ve
`openclaw/plugin-sdk/reply-chunking` tercih edin.

### Kurulum alt yolları

- `openclaw/plugin-sdk/setup-runtime`, çalışma zamanında güvenli kurulum yardımcılarını kapsar:
  `createSetupTranslator`, içe aktarmada güvenli kurulum yaması bağdaştırıcıları
  (`createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), arama notu çıktısı,
  `promptResolvedAllowFrom`, `splitSetupEntries` ve devredilen
  kurulum vekili oluşturucuları.
- `openclaw/plugin-sdk/channel-setup`, isteğe bağlı yükleme kurulum
  oluşturucularının yanı sıra kurulumda güvenli birkaç temel öğeyi kapsar: `createOptionalChannelSetupSurface`,
  `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`,
  `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`,
  `setSetupChannelEnabled` ve `splitSetupEntries`.
- Yalnızca `moveSingleAccountChannelSectionToDefaultAccount(...)` gibi
  daha ağır paylaşılan kurulum/yapılandırma yardımcılarına da ihtiyaç duyduğunuzda daha geniş `openclaw/plugin-sdk/setup` bağlantı noktasını kullanın.

Kanalınız kurulum yüzeylerinde yalnızca "önce bu plugini yükleyin" ifadesini göstermek istiyorsa
`createOptionalChannelSetupSurface(...)` tercih edin. Oluşturulan
bağdaştırıcı/sihirbaz, yapılandırma yazma ve sonlandırma işlemlerinde güvenli biçimde başarısız olur ve doğrulama, sonlandırma ve belge bağlantısı
metninde aynı yükleme gereklidir mesajını yeniden kullanır.

Kanalınız ortam odaklı kurulumu veya kimlik doğrulamayı destekliyorsa ve genel başlatma/yapılandırma
akışlarının çalışma zamanı yüklenmeden önce bu ortam adlarını bilmesi gerekiyorsa bunları
plugin manifestinde `channelEnvVars` ile bildirin. Kanal çalışma zamanı `envVars` veya yerel
sabitleri yalnızca operatöre yönelik metinler için tutun.

Kanalınız plugin çalışma zamanı başlamadan önce `status`, `channels list`, `channels status` veya
SecretRef taramalarında görünebiliyorsa
`package.json` içine `openclaw.setupEntry` ekleyin. Bu giriş noktası salt okunur komut
yollarında güvenle içe aktarılabilmeli ve bu
özetler için gereken kanal meta verilerini, kurulumda güvenli yapılandırma bağdaştırıcısını,
durum bağdaştırıcısını ve kanal gizli hedef meta verilerini döndürmelidir.
Kurulum girişinden istemcileri, dinleyicileri veya aktarım çalışma zamanlarını başlatmayın.

Ana kanal girişinin içe aktarma yolunu da dar tutun. Keşif,
kanalı etkinleştirmeden yetenekleri kaydetmek için girişi ve kanal plugin modülünü
değerlendirebilir. `channel-plugin-api.ts` gibi dosyalar
kurulum sihirbazlarını, aktarım istemcilerini, soket dinleyicilerini, alt süreç başlatıcılarını veya hizmet başlatma modüllerini içe aktarmadan
kanal plugin nesnesini dışa aktarmalıdır.
Bu çalışma zamanı parçalarını `registerFull(...)`, çalışma zamanı
ayarlayıcıları veya tembel yetenek bağdaştırıcılarından yüklenen modüllere yerleştirin.

### Diğer dar kanal alt yolları

Sık kullanılan diğer kanal yollarında, daha geniş eski
yüzeyler yerine dar yardımcıları tercih edin:

- Çok hesaplı yapılandırma ve
  varsayılan hesap geri dönüşü için `openclaw/plugin-sdk/account-core`, `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` ve
  `openclaw/plugin-sdk/account-helpers`
- Gelen rota/zarf ve
  kaydetme-dağıtma bağlantıları için `openclaw/plugin-sdk/inbound-envelope` ve
  `openclaw/plugin-sdk/channel-inbound`
- Hedef ayrıştırma yardımcıları için `openclaw/plugin-sdk/channel-targets`
- Medya yükleme için `openclaw/plugin-sdk/outbound-media` ve
  giden kimlik/gönderim temsilcileri
  ile yük planlaması için `openclaw/plugin-sdk/channel-outbound`
- Giden bir rota açık bir `replyToId`/`threadId` değerini korumalı veya temel oturum anahtarı hâlâ eşleşirken mevcut `:thread:`
  oturumunu kurtarmalı olduğunda
  `openclaw/plugin-sdk/channel-core` içinden `buildThreadAwareOutboundSessionRoute(...)`. Sağlayıcı pluginleri,
  platformları yerel iş parçacığı teslimatı semantiğine sahip olduğunda önceliği, sonek davranışını ve iş parçacığı kimliği normalleştirmesini
  geçersiz kılabilir.
- İş parçacığı bağlama yaşam döngüsü
  ve bağdaştırıcı kaydı için `openclaw/plugin-sdk/thread-bindings-runtime`
- Yalnızca eski bir aracı/medya
  yükü alan düzeni hâlâ gerektiğinde `openclaw/plugin-sdk/agent-media-payload`
- Telegram özel komut normalleştirmesi,
  yinelenen/çakışan öğe doğrulaması ve geri dönüşte kararlı bir komut yapılandırması
  sözleşmesi için `openclaw/plugin-sdk/telegram-command-config` (kullanımdan kaldırıldı: paketlenmiş hiçbir
  plugin bunu üretimde kullanmaz); yeni plugin kodunda plugine özgü komut yapılandırması işlemeyi tercih edin

Yalnızca kimlik doğrulama kullanan kanallar genellikle varsayılan yolda kalabilir: çekirdek
onayları işler ve plugin yalnızca giden/kimlik doğrulama yeteneklerini sunar. Matrix, Slack, Telegram gibi yerel
onay kanalları ve özel sohbet aktarımları, kendi onay
yaşam döngülerini oluşturmak yerine paylaşılan yerel yardımcıları kullanmalıdır.

## Gelen bahsetme ilkesi

Gelen bahsetme işlemeyi iki katmana ayırın:

- pluginin sahip olduğu kanıt toplama
- paylaşılan ilke değerlendirmesi

Bahsetme ilkesi kararları için `openclaw/plugin-sdk/channel-mention-gating` kullanın.
Yalnızca daha geniş gelen yardımcı variline ihtiyacınız olduğunda
`openclaw/plugin-sdk/channel-inbound` kullanın.

Plugine özgü mantığa uygun olanlar:

- bota verilen yanıtı algılama
- alıntılanan botu algılama
- iş parçacığına katılım denetimleri
- hizmet/sistem mesajı hariç tutmaları
- bot katılımını kanıtlamak için gereken platforma özgü önbellekler

Paylaşılan yardımcıya uygun olanlar:

- `requireMention`
- açık bahsetme sonucu
- örtük bahsetme izin listesi
- komut atlaması
- nihai atlama kararı

Tercih edilen akış:

1. Yerel bahsetme olgularını hesaplayın.
2. Bu olguları `resolveInboundMentionDecision({ facts, policy })` öğesine iletin.
3. Gelen kapınızda `decision.effectiveWasMentioned`, `decision.shouldBypassMention` ve
   `decision.shouldSkip` kullanın.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const wasMentioned = matchesMentionWithExplicit({
  text,
  mentionRegexes,
  explicit: {
    hasAnyMention,
    isExplicitlyMentioned,
    canResolveExplicit,
  },
});

const facts = {
  canDetectMention: true,
  wasMentioned,
  hasAnyMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`matchesMentionWithExplicit(...)` bir boole değeri döndürür. `hasAnyMention`,
`isExplicitlyMentioned` ve `canResolveExplicit` kanalın kendi
yerel bahsetme meta verilerinden (mesaj varlıkları, bota yanıt bayrakları ve benzerleri) gelir;
platformunuz bunları algılayamıyorsa `false`/`undefined` değerlerini sağlayın.

`api.runtime.channel.mentions`, çalışma zamanı eklemeye zaten bağımlı olan
paketlenmiş kanal pluginleri için aynı paylaşılan bahsetme yardımcılarını sunar:
`buildMentionRegexes`, `matchesMentionPatterns`, `matchesMentionWithExplicit`,
`implicitMentionKindWhen`, `resolveInboundMentionDecision`.

Yalnızca `implicitMentionKindWhen` ve `resolveInboundMentionDecision` gerekiyorsa,
ilgisiz gelen çalışma zamanı yardımcılarını yüklemekten kaçınmak için `openclaw/plugin-sdk/channel-mention-gating` içinden içe aktarın.

## Adım adım açıklama

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket ve manifest">
    Standart plugin dosyalarını oluşturun. Bir manifestin bir kanalın sahibi olduğunu
    belirten, `openclaw.plugin.json` içindeki `channels` alanıdır
    (`kind` alanı değildir). Paket meta verilerinin tüm kapsamı için
    [Plugin Kurulumu ve Yapılandırması](/tr/plugins/sdk-setup#openclaw-channel) bölümüne bakın:

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Acme Chat",
          "blurb": "OpenClaw'u Acme Chat'e bağlayın."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat kanal plugini",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {}
      },
      "channelConfigs": {
        "acme-chat": {
          "schema": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          },
          "uiHints": {
            "token": {
              "label": "Bot belirteci",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema`, `plugins.entries.acme-chat.config` değerini doğrular. Bunu,
    kanal hesabı yapılandırması olmayan, pluginin sahip olduğu ayarlar için kullanın.
    `channelConfigs.acme-chat.schema`, `channels.acme-chat` değerini doğrular ve plugin çalışma
    zamanı yüklenmeden önce yapılandırma şeması, kurulum ve kullanıcı arayüzü
    yüzeylerinin kullandığı seyrek yol kaynağıdır. Üst düzey alan başvurularının
    tamamı için [Plugin manifesti](/tr/plugins/manifest) bölümüne bakın.

  </Step>

  <Step title="Kanal plugin nesnesini oluşturun">
    `ChannelPlugin` arayüzünde çok sayıda isteğe bağlı adaptör yüzeyi bulunur.
    En az `id`, `config` ve `setup` ile başlayın
    ve gerektikçe adaptörler ekleyin.

    `src/channel.ts` dosyasını oluşturun:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // platform API istemciniz

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: belirteç gereklidir");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        // Hesap çözümleme/inceleme `setup` üzerinde değil, `config` üzerinde yer alır.
        // `setup`, ilk katılım yazma işlemlerini kapsar (applyAccountConfig, validateInput).
        config: {
          listAccountIds: () => ["default"],
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
        setup: {
          applyAccountConfig: ({ cfg, input }) => ({
            ...cfg,
            channels: {
              ...cfg.channels,
              "acme-chat": { ...(cfg.channels as any)?.["acme-chat"], ...input },
            },
          }),
        },
      }),

      // DM güvenliği: bota kimlerin mesaj gönderebileceği
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Eşleştirme: yeni DM kişileri için onay akışı
      pairing: {
        text: {
          idLabel: "Acme Chat kullanıcı adı",
          message: "Kimliğinizi doğrulamak için bu kodu gönderin:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Eşleştirme kodu: ${code}`);
          },
        },
      },

      // İş parçacığı yönetimi: yanıtların nasıl iletileceği
      threading: { topLevelReplyToMode: "reply" },

      // Giden: platforma mesaj gönderme
      outbound: {
        attachedResults: {
          channel: "acme-chat",
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    Hem kurallı üst düzey DM anahtarlarını hem de eski iç içe anahtarları kabul eden
    kanallar için `plugin-sdk/channel-config-helpers` içindeki yardımcıları kullanın:
    `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` ve
    `normalizeChannelDmPolicy`, hesaba özgü değerleri devralınan kök değerlerin önünde
    tutar. Çalışma zamanı ile geçişin aynı sözleşmeyi okuması için aynı çözümleyiciyi
    `normalizeLegacyDmAliases` aracılığıyla doctor onarımıyla eşleştirin.

    <Accordion title="createChatChannelPlugin sizin için ne yapar?">
      Düşük düzeyli adaptör arayüzlerini elle uygulamak yerine bildirimsel
      seçenekler iletirsiniz ve oluşturucu bunları bir araya getirir:

      | Seçenek | Bağladığı öğe |
      | --- | --- |
      | `security.dm` | Yapılandırma alanlarından kapsamlı DM güvenliği çözümleyicisi |
      | `pairing.text` | Kod alışverişiyle metin tabanlı DM eşleştirme akışı |
      | `threading` | Yanıt modu çözümleyicisi (sabit, hesap kapsamlı veya özel) |
      | `outbound.attachedResults` | Sonuç meta verileri (mesaj kimlikleri) döndüren gönderme işlevleri; çekirdeğin döndürülen teslimat sonucuna damga vurabilmesi için kardeş bir `channel` kimliği gerektirir |

      Tam denetime ihtiyacınız varsa bildirimsel seçenekler yerine ham adaptör
      nesneleri de iletebilirsiniz.

      Ham giden adaptörler bir `chunker(text, limit, ctx)` işlevi tanımlayabilir.
      İsteğe bağlı `ctx.formatting`, `maxLinesPerMessage` gibi teslimat
      zamanındaki biçimlendirme kararlarını taşır; yanıt iş parçacığı yönetimi ve
      parça sınırlarının paylaşılan giden teslimat tarafından bir kez çözümlenmesi
      için bunu göndermeden önce uygulayın. Yerel bir yanıt hedefi çözümlendiğinde
      gönderme bağlamları ayrıca `replyToIdSource` (`implicit` veya
      `explicit`) içerir; böylece yük yardımcıları, örtük tek kullanımlık
      yanıt yuvasını tüketmeden açık yanıt etiketlerini koruyabilir.
    </Accordion>

  </Step>

  <Step title="Giriş noktasını bağlayın">
    `index.ts` dosyasını oluşturun:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat kanal plugini",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat yönetimi");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat yönetimi",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    Kanalın sahip olduğu CLI tanımlayıcılarını `registerCliMetadata(...)` içine yerleştirin;
    böylece OpenClaw, kanal çalışma zamanının tamamını etkinleştirmeden bunları kök
    yardımında gösterebilir ve normal tam yüklemeler gerçek komut kaydı için aynı
    tanımlayıcıları almaya devam eder. `registerFull(...)` öğesini yalnızca çalışma
    zamanı işleri için tutun. `defineChannelPluginEntry`, kayıt modu ayrımını otomatik
    olarak işler. `registerFull(...)` Gateway RPC yöntemlerini kaydediyorsa plugine
    özgü bir önek kullanın. Çekirdek yönetici ad alanları (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış olarak
    kalır ve her zaman `operator.admin` değerine çözümlenir. Tüm seçenekler için
    [Giriş Noktaları](/tr/plugins/sdk-entrypoints#definechannelpluginentry) bölümüne bakın.

  </Step>

  <Step title="Bir kurulum girişi ekleyin">
    İlk katılım sırasında hafif yükleme için `setup-entry.ts` dosyasını oluşturun:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    Kanal devre dışı veya yapılandırılmamış olduğunda OpenClaw tam giriş yerine
    bunu yükler. Kurulum akışları sırasında ağır çalışma zamanı kodunun yüklenmesini
    önler. Ayrıntılar için [Kurulum ve Yapılandırma](/tr/plugins/sdk-setup#setup-entry)
    bölümüne bakın.

    Kurulum açısından güvenli dışa aktarımları yardımcı modüllere ayıran paketlenmiş
    çalışma alanı kanalları, açık bir kurulum zamanı çalışma ortamı ayarlayıcısına
    da ihtiyaç duyduklarında `openclaw/plugin-sdk/channel-entry-contract` içindeki `defineBundledChannelSetupEntry(...)`
    öğesini kullanabilir.

  </Step>

  <Step title="Gelen mesajları işleyin">
    Plugininizin platformdan mesajları alması ve OpenClaw'a iletmesi gerekir.
    Tipik kalıp, isteği doğrulayan ve kanalınızın gelen işleyicisi üzerinden
    dağıtan bir Webhook'tur:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin tarafından yönetilen kimlik doğrulama (imzaları kendiniz doğrulayın)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Gelen işleyiciniz mesajı OpenClaw'a dağıtır.
          // Tam bağlantı düzeni platform SDK'nıza bağlıdır -
          // paketlenmiş Microsoft Teams veya Google Chat plugin paketindeki gerçek bir örneğe bakın.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Gelen mesajların işlenmesi kanala özgüdür. Her kanal plugini kendi gelen
      mesaj işlem hattının sahibidir. Gerçek kalıplar için paketlenmiş kanal
      pluginlerine (örneğin Microsoft Teams veya Google Chat plugin paketine) bakın.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
`src/channel.test.ts` içinde aynı konuma yerleştirilmiş testler yazın:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.config.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test <bundled-plugin-root>/acme-chat/
    ```

    Paylaşılan test yardımcıları için bkz. [Test](/tr/plugins/sdk-testing).

</Step>
</Steps>

## Dosya yapısı

```text
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel meta verileri
├── openclaw.plugin.json      # Yapılandırma şemasını içeren manifest
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Genel dışa aktarımlar (isteğe bağlı)
├── runtime-api.ts            # Dahili çalışma zamanı dışa aktarımları (isteğe bağlı)
└── src/
    ├── channel.ts            # createChatChannelPlugin aracılığıyla ChannelPlugin
    ├── channel.test.ts       # Testler
    ├── client.ts             # Platform API istemcisi
    └── runtime.ts            # Çalışma zamanı deposu (gerekirse)
```

## İleri düzey konular

<CardGroup cols={2}>
  <Card title="İş parçacığı seçenekleri" icon="git-branch" href="/tr/plugins/sdk-entrypoints#registration-mode">
    Sabit, hesap kapsamlı veya özel yanıt modları
  </Card>
  <Card title="Mesaj aracı entegrasyonu" icon="puzzle" href="/tr/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool ve eylem keşfi
  </Card>
  <Card title="Hedef çözümleme" icon="crosshair" href="/tr/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Çalışma zamanı yardımcıları" icon="settings" href="/tr/plugins/sdk-runtime">
    api.runtime aracılığıyla TTS, STT, medya ve alt aracı
  </Card>
  <Card title="Kanal gelen API'si" icon="bolt" href="/tr/plugins/sdk-channel-inbound">
    Paylaşılan gelen olay yaşam döngüsü: alma, çözümleme, kaydetme, yönlendirme, sonlandırma
  </Card>
</CardGroup>

<Note>
Paketlenmiş Plugin bakımı ve uyumluluk için bazı paketlenmiş yardımcı
bağlantı noktaları hâlâ mevcuttur. Bunlar yeni kanal Plugin'leri için önerilen
kalıp değildir; söz konusu paketlenmiş Plugin ailesinin bakımını doğrudan
yapmıyorsanız ortak SDK yüzeyindeki genel kanal/kurulum/yanıt/çalışma zamanı
alt yollarını tercih edin.
</Note>

## Sonraki adımlar

- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) - Plugin'iniz modeller de sağlıyorsa
- [SDK'ya Genel Bakış](/tr/plugins/sdk-overview) - tam alt yol içe aktarma referansı
- [SDK Testi](/tr/plugins/sdk-testing) - test yardımcı programları ve sözleşme testleri
- [Plugin Manifesti](/tr/plugins/manifest) - tam manifest şeması

## İlgili

- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Aracı koşum takımı Plugin'leri](/tr/plugins/sdk-agent-harness)

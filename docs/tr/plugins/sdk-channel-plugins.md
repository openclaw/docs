---
read_when:
    - Yeni bir mesajlaşma kanalı Plugin'i oluşturuyorsunuz
    - OpenClaw'u bir mesajlaşma platformuna bağlamak istiyorsunuz
    - ChannelPlugin adaptör yüzeyini anlamanız gerekir
sidebarTitle: Channel Plugins
summary: OpenClaw için bir mesajlaşma kanalı Plugin’i oluşturmaya yönelik adım adım kılavuz
title: Kanal Plugin'leri oluşturma
x-i18n:
    generated_at: "2026-06-28T01:04:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2148141910d4a275ee800d084d60d7174146140f57ecc5c57cc12824115238be
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Bu kılavuz, OpenClaw'u bir mesajlaşma platformuna bağlayan bir kanal Plugin'i oluşturmayı açıklar. Sonunda DM güvenliği, eşleştirme, yanıt iş parçacığı oluşturma ve giden mesajlaşmaya sahip çalışan bir kanalınız olacak.

<Info>
  Daha önce hiç OpenClaw Plugin'i oluşturmadıysanız, temel paket
  yapısı ve manifest kurulumu için önce
  [Başlarken](/tr/plugins/building-plugins) sayfasını okuyun.
</Info>

## Kanal Plugin'leri nasıl çalışır

Kanal Plugin'lerinin kendi gönderme/düzenleme/tepki verme araçlarına ihtiyacı yoktur. OpenClaw çekirdekte tek bir
paylaşılan `message` aracını tutar. Plugin'iniz şunlardan sorumludur:

- **Yapılandırma** - hesap çözümleme ve kurulum sihirbazı
- **Güvenlik** - DM ilkesi ve izin listeleri
- **Eşleştirme** - DM onay akışı
- **Oturum grameri** - sağlayıcıya özgü konuşma kimliklerinin temel sohbetlere, iş parçacığı kimliklerine ve üst öğe yedeklerine nasıl eşlendiği
- **Giden** - platforma metin, medya ve anket gönderme
- **İş parçacığı oluşturma** - yanıtların nasıl iş parçacığına bağlandığı
- **Heartbeat yazma durumu** - Heartbeat teslim hedefleri için isteğe bağlı yazıyor/meşgul sinyalleri

Çekirdek, paylaşılan mesaj aracından, istem bağlantısından, dış oturum anahtarı şeklinden,
genel `:thread:` defter tutmadan ve dağıtımdan sorumludur.

Yeni kanal Plugin'leri ayrıca `openclaw/plugin-sdk/channel-outbound` içindeki
`defineChannelMessageAdapter` ile bir `message` adaptörü sunmalıdır. Adaptör,
yerel aktarımın gerçekten desteklediği kalıcı son gönderim yeteneklerini bildirir
ve metin/medya gönderimlerini eski `outbound` adaptörüyle aynı aktarım işlevlerine
yönlendirir. Bir yeteneği yalnızca bir sözleşme testi yerel yan etkiyi ve dönen alındı bilgisini
kanıtladığında bildirin.
Tam API sözleşmesi, örnekler, yetenek matrisi, alındı bilgisi kuralları, canlı
önizleme sonlandırma, alma onayı ilkesi, testler ve geçiş tablosu için
[Kanal giden API'si](/tr/plugins/sdk-channel-outbound) sayfasına bakın.
Mevcut `outbound` adaptörü zaten doğru gönderme yöntemlerine ve yetenek
metaverilerine sahipse, başka bir köprüyü elle yazmak yerine `message` adaptörünü
türetmek için `createChannelMessageAdapterFromOutbound(...)` kullanın.
Adaptör gönderimleri `MessageReceipt` değerleri döndürmelidir. Uyumluluk kodu
hala eski kimliklere ihtiyaç duyduğunda, yeni yaşam döngüsü kodunda paralel
`messageIds` alanları tutmak yerine bunları `listMessageReceiptPlatformIds(...)`
veya `resolveMessageReceiptPrimaryId(...)` ile türetin.
Önizleme destekli kanallar ayrıca sahip oldukları tam canlı yaşam döngüsüyle
`message.live.capabilities` bildirmelidir; örneğin `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` veya
`quietFinalization`. Taslak önizlemeyi yerinde sonlandıran kanallar ayrıca
`message.live.finalizer.capabilities` bildirmelidir; örneğin `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` ve
`retainOnAmbiguousFailure`; çalışma zamanı mantığını da
`defineFinalizableLivePreviewAdapter(...)` ve
`deliverWithFinalizableLivePreviewAdapter(...)` üzerinden yönlendirmelidir. Yerel önizleme,
ilerleme, düzenleme, yedek/tutma, temizlik ve alındı bilgisi davranışının sessizce
sapmaması için bu yetenekleri `verifyChannelMessageLiveCapabilityAdapterProofs(...)` ve
`verifyChannelMessageLiveFinalizerProofs(...)` testleriyle destekli tutun.
Platform onaylarını erteleyen gelen alıcılar, onay zamanlamasını monitöre yerel
durumda gizlemek yerine `message.receive.defaultAckPolicy` ve `supportedAckPolicies`
bildirmelidir. Bildirilen her ilkeyi
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` ile kapsayın.

`createChannelTurnReplyPipeline`, `dispatchInboundReplyWithBase` ve
`recordInboundSessionAndDispatchReply` gibi eski yanıt yardımcıları uyumluluk
dağıtıcıları için kullanılabilir kalır. Yeni kanal kodunda bu adları kullanmayın;
yeni Plugin'ler `openclaw/plugin-sdk/channel-outbound` üzerindeki `message` adaptörü,
alındı bilgileri ve alma/gönderme yaşam döngüsü yardımcılarıyla başlamalıdır.

Gelen yetkilendirmeyi taşıyan kanallar, çalışma zamanı alma yollarından deneysel
`openclaw/plugin-sdk/channel-ingress-runtime` alt yolunu kullanabilir. Alt yol,
platform aramasını ve yan etkileri Plugin içinde tutarken izin listesi durum
çözümlemesini, rota/gönderen/komut/olay/aktivasyon kararlarını, gizlenmiş tanılamayı
ve tur kabulü eşlemesini paylaşır. Plugin kimliği normalleştirmesini çözümleyiciye
geçirdiğiniz tanımlayıcıda tutun; çözümlenmiş durumdan veya karardan ham eşleşme
değerlerini serileştirmeyin. API tasarımı, sahiplik sınırı ve test beklentileri için
[Kanal giriş API'si](/tr/plugins/sdk-channel-ingress) sayfasına bakın.

Kanalınız gelen yanıtlar dışında yazıyor göstergelerini destekliyorsa, kanal
Plugin'inde `heartbeat.sendTyping(...)` sunun. Çekirdek, Heartbeat model çalışması
başlamadan önce bunu çözümlenmiş Heartbeat teslim hedefiyle çağırır ve paylaşılan
yazıyor keepalive/temizlik yaşam döngüsünü kullanır. Platform açık bir durdurma
sinyaline ihtiyaç duyuyorsa `heartbeat.clearTyping(...)` ekleyin.

Kanalınız medya kaynakları taşıyan mesaj aracı parametreleri ekliyorsa, bu parametre
adlarını `describeMessageTool(...).mediaSourceParams` üzerinden sunun. Çekirdek,
sandbox yol normalleştirmesi ve giden medya erişim ilkesi için bu açık listeyi
kullanır; böylece Plugin'lerin sağlayıcıya özgü avatar, ek veya kapak görseli
parametreleri için paylaşılan çekirdek özel durumlarına ihtiyacı olmaz.
İlgisiz eylemlerin başka bir eylemin medya argümanlarını devralmaması için
`{ "set-profile": ["avatarUrl", "avatarPath"] }` gibi eylem anahtarlı bir eşleme
döndürmeyi tercih edin. Düz bir dizi, açıkça sunulan her eylem arasında bilerek
paylaşılan parametreler için hâlâ çalışır.
Platform taraflı medya getirme işlemi için geçici bir herkese açık URL sunması
gereken kanallar, Plugin durum depolarıyla birlikte
`openclaw/plugin-sdk/outbound-media` içindeki `createHostedOutboundMediaStore(...)`
kullanabilir. Platform rota ayrıştırmasını ve belirteç zorlamasını kanal Plugin'inde
tutun; paylaşılan yardımcı yalnızca medya yükleme, süre sonu metaverileri, parça
satırları ve temizlikten sorumludur.

Kanalınız `message(action="send")` için sağlayıcıya özgü biçimlendirmeye ihtiyaç
duyuyorsa, `actions.prepareSendPayload(...)` tercih edin. Yerel kartları, blokları,
yerleştirmeleri veya diğer kalıcı verileri `payload.channelData.<channel>` altına
koyun ve asıl gönderimi çekirdeğin giden/mesaj adaptörü üzerinden yapmasına izin
verin. `actions.handleAction(...)` öğesini gönderme için yalnızca serileştirilip
yeniden denenemeyen yüklerde uyumluluk yedeği olarak kullanın.

Platformunuz konuşma kimlikleri içinde ek kapsam saklıyorsa, bu ayrıştırmayı
`messaging.resolveSessionConversation(...)` ile Plugin içinde tutun. Bu, `rawId`
değerini temel konuşma kimliğine, isteğe bağlı iş parçacığı kimliğine, açık
`baseConversationId` değerine ve varsa `parentConversationCandidates` değerlerine
eşlemek için kanonik kancadır.
`parentConversationCandidates` döndürdüğünüzde, bunları en dar üst öğeden en geniş/temel
konuşmaya doğru sıralı tutun.

Plugin kodunun rota benzeri alanları normalleştirmesi, bir alt iş parçacığını üst
rotasıyla karşılaştırması veya `{ channel, to, accountId, threadId }` üzerinden
kararlı bir tekilleştirme anahtarı oluşturması gerektiğinde
`openclaw/plugin-sdk/channel-route` kullanın. Yardımcı, sayısal iş parçacığı
kimliklerini çekirdekle aynı şekilde normalleştirir; bu nedenle Plugin'ler plansız
`String(threadId)` karşılaştırmaları yerine bunu tercih etmelidir.
Sağlayıcıya özgü hedef gramerine sahip Plugin'ler
`messaging.resolveOutboundSessionRoute(...)` sunmalıdır; böylece çekirdek, ayrıştırıcı
shim'leri kullanmadan sağlayıcıya özgü oturum ve iş parçacığı kimliğini alır.

Kanal kayıt defteri başlatılmadan önce aynı ayrıştırmaya ihtiyaç duyan paketli
Plugin'ler, eşleşen bir `resolveSessionConversation(...)` dışa aktarımıyla üst
düzey bir `session-key-api.ts` dosyası da sunabilir. Çekirdek, bu önyükleme için
güvenli yüzeyi yalnızca çalışma zamanı Plugin kayıt defteri henüz kullanılabilir
olmadığında kullanır.

`messaging.resolveParentConversationCandidates(...)`, bir Plugin'in yalnızca genel/ham
kimliğin üstünde üst öğe yedeklerine ihtiyaç duyması durumunda eski uyumluluk
yedeği olarak kullanılabilir kalır. Her iki kanca da varsa, çekirdek önce
`resolveSessionConversation(...).parentConversationCandidates` kullanır ve yalnızca
kanonik kanca bunları atladığında `resolveParentConversationCandidates(...)` öğesine
geri döner.

## Onaylar ve kanal yetenekleri

Çoğu kanal Plugin'inin onaya özgü koda ihtiyacı yoktur.

- Çekirdek, aynı sohbet `/approve`, paylaşılan onay düğmesi yükleri ve genel geri dönüş teslimini sahiplenir.
- Kanal onaya özel davranışa ihtiyaç duyduğunda kanal Plugin'i üzerinde tek bir `approvalCapability` nesnesi tercih edin.
- `ChannelPlugin.approvals` kaldırıldı. Onay teslimi/native/render/auth bilgilerini `approvalCapability` üzerine koyun.
- `plugin.auth` yalnızca oturum açma/oturum kapatma içindir; çekirdek artık onay auth hook'larını bu nesneden okumaz.
- `approvalCapability.authorizeActorAction` ve `approvalCapability.getActionAvailabilityState`, kanonik onay-auth arabirimidir.
- Aynı sohbet onay auth kullanılabilirliği için `approvalCapability.getActionAvailabilityState` kullanın.
- Kanalınız yerel exec onaylarını açığa çıkarıyorsa, başlatan yüzey/yerel istemci durumu aynı sohbet onay auth'undan farklı olduğunda `approvalCapability.getExecInitiatingSurfaceState` kullanın. Çekirdek, `enabled` ile `disabled` ayrımını yapmak, başlatan kanalın yerel exec onaylarını destekleyip desteklemediğine karar vermek ve kanalı yerel istemci geri dönüş yönlendirmesine dahil etmek için bu exec'e özel hook'u kullanır. `createApproverRestrictedNativeApprovalCapability(...)` yaygın durum için bunu doldurur.
- Yinelenen yerel onay istemlerini gizleme veya teslimden önce yazıyor göstergeleri gönderme gibi kanala özel yük yaşam döngüsü davranışları için `outbound.shouldSuppressLocalPayloadPrompt` veya `outbound.beforeDeliverPayload` kullanın.
- `approvalCapability.delivery` öğesini yalnızca yerel onay yönlendirmesi veya geri dönüş bastırma için kullanın.
- Kanalın sahip olduğu yerel onay bilgileri için `approvalCapability.nativeRuntime` kullanın. Çekirdeğin onay yaşam döngüsünü kurmasına hâlâ izin verirken çalışma zamanı modülünüzü gerektiğinde içe aktarabilen `createLazyChannelApprovalNativeRuntimeAdapter(...)` ile sıcak kanal giriş noktalarında tembel tutun.
- `approvalCapability.render` öğesini yalnızca kanal gerçekten paylaşılan işleyici yerine özel onay yüklerine ihtiyaç duyduğunda kullanın.
- Kanal, devre dışı yol yanıtının yerel exec onaylarını etkinleştirmek için gereken tam config düğmelerini açıklamasını istediğinde `approvalCapability.describeExecApprovalSetup` kullanın. Hook `{ channel, channelLabel, accountId }` alır; adlandırılmış hesap kanalları, üst düzey varsayılanlar yerine `channels.<channel>.accounts.<id>.execApprovals.*` gibi hesap kapsamlı yolları işlemelidir.
- Bir kanal mevcut config'ten kararlı sahip benzeri DM kimlikleri çıkarabiliyorsa, onaya özel çekirdek mantığı eklemeden aynı sohbet `/approve` öğesini kısıtlamak için `openclaw/plugin-sdk/approval-runtime` içindeki `createResolvedApproverActionAuthAdapter` kullanın.
- Özel onay auth bilerek yalnızca aynı sohbet geri dönüşüne izin veriyorsa, `openclaw/plugin-sdk/approval-auth-runtime` içinden `markImplicitSameChatApprovalAuthorization({ authorized: true })` döndürün; aksi takdirde çekirdek sonucu açık onaylayıcı yetkilendirmesi olarak ele alır.
- Kanalın sahip olduğu yerel bir callback onayları doğrudan çözümlüyorsa, çözümlemeden önce `isImplicitSameChatApprovalAuthorization(...)` kullanın; böylece örtük geri dönüş hâlâ kanalın normal aktör yetkilendirmesinden geçer.
- Bir kanal yerel onay teslimine ihtiyaç duyuyorsa, kanal kodunu hedef normalizasyonuna ve taşıma/sunum bilgilerine odaklı tutun. `openclaw/plugin-sdk/approval-runtime` içinden `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` ve `createApproverRestrictedNativeApprovalCapability` kullanın. Kanala özel bilgileri `approvalCapability.nativeRuntime` arkasına, ideal olarak `createChannelApprovalNativeRuntimeAdapter(...)` veya `createLazyChannelApprovalNativeRuntimeAdapter(...)` yoluyla koyun; böylece çekirdek handler'ı kurabilir ve istek filtreleme, yönlendirme, tekilleştirme, süre bitimi, gateway aboneliği ve başka yere yönlendirildi bildirimlerini sahiplenebilir. `nativeRuntime` birkaç daha küçük arabirime bölünür:
- Bir kanal hem oturum kökenli yerel teslimi hem de açık onay iletme hedeflerini desteklediğinde `openclaw/plugin-sdk/approval-native-runtime` içinden `createNativeApprovalChannelRouteGates` kullanın. Yardımcı; onay config seçimini, `mode` işlemeyi, agent/oturum filtrelerini, hesap bağlamayı, oturum-hedef eşleştirmeyi ve hedef-listesi eşleştirmeyi merkezileştirirken çağıranlar hâlâ kanal id'sine, varsayılan iletme moduna, hesap aramaya, taşıma etkinlik kontrolüne, hedef normalizasyonuna ve turn-source hedef çözümlemesine sahip olur. Bunu çekirdeğin sahip olduğu kanal politika varsayılanları oluşturmak için kullanmayın; kanalın belgelenmiş varsayılan modunu açıkça geçirin.
- `createChannelNativeOriginTargetResolver`, varsayılan olarak `{ to, accountId, threadId }` hedefleri için paylaşılan kanal-rota eşleştiricisini kullanır. `targetsMatch` öğesini yalnızca kanalın Slack zaman damgası önek eşleştirme gibi sağlayıcıya özel eşdeğerlik kuralları olduğunda geçirin.
- Kanalın varsayılan rota eşleştiricisi veya özel bir `targetsMatch` callback'i çalışmadan önce sağlayıcı id'lerini kanonikleştirmesi gerektiğinde, teslim için özgün hedefi koruyarak `createChannelNativeOriginTargetResolver` öğesine `normalizeTargetForMatch` geçirin. `normalizeTarget` öğesini yalnızca çözümlenen teslim hedefinin kendisi kanonikleştirilmeliyse kullanın.
- `availability` - hesabın yapılandırılıp yapılandırılmadığı ve bir isteğin işlenip işlenmemesi gerektiği
- `presentation` - paylaşılan onay görünüm modelini bekleyen/çözümlenmiş/süresi dolmuş yerel yüklere veya son eylemlere eşler
- `transport` - hedefleri hazırlar ve yerel onay mesajlarını gönderir/günceller/siler
- `interactions` - yerel düğmeler veya tepkiler için isteğe bağlı bind/unbind/clear-action hook'ları ve isteğe bağlı bir `cancelDelivered` hook'u. `deliverPending`, süreç içi veya kalıcı durum kaydettiğinde (örneğin bir tepki hedef deposu) `cancelDelivered` uygulayın; böylece bir handler durdurması `bindPending` çalışmadan önce teslimi iptal ederse veya `bindPending` handle döndürmezse bu durum serbest bırakılabilir
- `observe` - isteğe bağlı teslim tanılama hook'ları
- Kanalın istemci, token, Bolt app veya webhook alıcısı gibi çalışma zamanının sahip olduğu nesnelere ihtiyacı varsa bunları `openclaw/plugin-sdk/channel-runtime-context` üzerinden kaydedin. Genel runtime-context kayıt defteri, çekirdeğin onaya özel sarmalayıcı yapıştırıcı eklemeden kanal başlangıç durumundan capability odaklı handler'ları başlatmasını sağlar.
- Daha düşük seviyeli `createChannelApprovalHandler` veya `createChannelNativeApprovalRuntime` öğelerine yalnızca capability odaklı arabirim henüz yeterince ifade gücüne sahip değilse başvurun.
- Yerel onay kanalları hem `accountId` hem de `approvalKind` öğesini bu yardımcılar üzerinden yönlendirmelidir. `accountId`, çok hesaplı onay politikasını doğru bot hesabıyla kapsamlı tutar; `approvalKind` ise çekirdekte sabit kodlu dallar olmadan exec ile Plugin onayı davranışını kanal için kullanılabilir tutar.
- Çekirdek artık onay yeniden yönlendirme bildirimlerini de sahiplenir. Kanal Plugin'leri `createChannelNativeApprovalRuntime` içinden kendi "onay DM'lere / başka bir kanala gitti" takip mesajlarını göndermemelidir; bunun yerine paylaşılan onay capability yardımcıları üzerinden doğru kaynak + onaylayıcı-DM yönlendirmesini açığa çıkarmalı ve başlatan sohbete herhangi bir bildirim göndermeden önce çekirdeğin gerçek teslimleri toplamasına izin vermelidir.
- Teslim edilen onay id türünü uçtan uca koruyun. Yerel istemciler,
  exec ile Plugin onayı yönlendirmesini kanal-yerel durumdan tahmin etmemeli veya yeniden yazmamalıdır.
- Farklı onay türleri bilerek farklı yerel yüzeyler açığa çıkarabilir.
  Mevcut birlikte gelen örnekler:
  - Slack, yerel onay yönlendirmesini hem exec hem de Plugin id'leri için kullanılabilir tutar.
  - Matrix, exec ve Plugin onayları için aynı yerel DM/kanal yönlendirmesini ve tepki UX'ini korurken auth'un onay türüne göre farklılaşmasına hâlâ izin verir.
- `createApproverRestrictedNativeApprovalAdapter` bir uyumluluk sarmalayıcısı olarak hâlâ mevcuttur, ancak yeni kod capability oluşturucuyu tercih etmeli ve Plugin üzerinde `approvalCapability` açığa çıkarmalıdır.

Sıcak kanal giriş noktaları için, bu ailenin yalnızca bir parçasına
ihtiyacınız olduğunda daha dar çalışma zamanı alt yollarını tercih edin:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Benzer şekilde, daha geniş şemsiye yüzeye ihtiyacınız olmadığında
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` ve
`openclaw/plugin-sdk/reply-chunking` tercih edin.

Özellikle kurulum için:

- `openclaw/plugin-sdk/setup-runtime`, çalışma zamanında güvenli kurulum yardımcılarını kapsar:
  `createSetupTranslator`, içe aktarma açısından güvenli kurulum patch adapter'ları (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), lookup-note çıktısı,
  `promptResolvedAllowFrom`, `splitSetupEntries` ve devredilmiş
  setup-proxy oluşturucular
- `openclaw/plugin-sdk/setup-runtime`, `createEnvPatchedAccountSetupAdapter`
  için env farkında adapter arabirimini içerir
- `openclaw/plugin-sdk/channel-setup`, isteğe bağlı kurulum
  oluşturucularını ve birkaç kurulum açısından güvenli ilkel öğeyi kapsar:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Kanalınız env odaklı kurulumu veya auth'u destekliyorsa ve genel başlangıç/config
akışları çalışma zamanı yüklenmeden önce bu env adlarını bilmeliyse, bunları
Plugin manifestinde `channelEnvVars` ile bildirin. Kanal çalışma zamanı `envVars`
veya yerel sabitleri yalnızca operatöre dönük metin için tutun.

Kanalınız Plugin çalışma zamanı başlamadan önce `status`, `channels list`, `channels status` veya
SecretRef taramalarında görünebiliyorsa, `package.json` içine `openclaw.setupEntry` ekleyin.
Bu giriş noktası salt okunur komut yollarında içe aktarmaya güvenli olmalı ve bu özetler için
gereken kanal meta verilerini, kurulum açısından güvenli config adapter'ını, status
adapter'ını ve kanal secret hedef meta verilerini döndürmelidir. Kurulum girişinden
istemcileri, dinleyicileri veya taşıma çalışma zamanlarını başlatmayın.

Ana kanal giriş import yolunu da dar tutun. Keşif, kanalı etkinleştirmeden
capability'leri kaydetmek için girişi ve kanal Plugin modülünü değerlendirebilir.
`channel-plugin-api.ts` gibi dosyalar, kurulum sihirbazlarını, taşıma istemcilerini, soket
dinleyicilerini, alt süreç başlatıcılarını veya servis başlangıç modüllerini içe aktarmadan kanal
Plugin nesnesini dışa aktarmalıdır. Bu çalışma zamanı parçalarını `registerFull(...)`,
çalışma zamanı setter'ları veya tembel capability adapter'ları üzerinden yüklenen modüllere koyun.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` ve
`splitSetupEntries`

- daha geniş `openclaw/plugin-sdk/setup` arabirimini yalnızca
  `moveSingleAccountChannelSectionToDefaultAccount(...)` gibi daha ağır paylaşılan kurulum/config
  yardımcılarına da ihtiyacınız olduğunda kullanın

Kanalınız kurulum yüzeylerinde yalnızca "önce bu Plugin'i yükleyin" duyurusu yapmak istiyorsa,
`createOptionalChannelSetupSurface(...)` tercih edin. Üretilen adapter/sihirbaz,
config yazmalarında ve sonlandırmada kapalı başarısız olur ve aynı yükleme-gerekli mesajını
doğrulama, finalize ve docs-link metninde yeniden kullanır.

Diğer sıcak kanal yolları için, daha geniş eski yüzeyler yerine dar yardımcıları tercih edin:

- Çoklu hesap yapılandırması ve varsayılan hesap geri dönüşü için
  `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` ve
  `openclaw/plugin-sdk/account-helpers`
- Gelen rota/zarf ve kaydet-ve-dağıt bağlantısı için
  `openclaw/plugin-sdk/inbound-envelope` ve
  `openclaw/plugin-sdk/channel-inbound`
- Hedef ayrıştırma yardımcıları için `openclaw/plugin-sdk/channel-targets`
- Medya yükleme için `openclaw/plugin-sdk/outbound-media`; giden kimlik/gönderim
  delegeleri ve yük planlaması için
  `openclaw/plugin-sdk/channel-outbound`
- Bir giden rota açık bir `replyToId`/`threadId` değerini korumalıysa veya temel
  oturum anahtarı hâlâ eşleşirken geçerli `:thread:` oturumunu kurtarmalıysa
  `openclaw/plugin-sdk/channel-core` içinden `buildThreadAwareOutboundSessionRoute(...)`.
  Provider Plugin'leri, platformlarının yerel iş parçacığı teslim semantikleri
  olduğunda önceliği, sonek davranışını ve iş parçacığı kimliği normalleştirmesini
  geçersiz kılabilir.
- İş parçacığı bağlama yaşam döngüsü ve bağdaştırıcı kaydı için
  `openclaw/plugin-sdk/thread-bindings-runtime`
- Yalnızca eski bir ajan/medya yük alanı düzeni hâlâ gerekiyorsa
  `openclaw/plugin-sdk/agent-media-payload`
- Telegram özel komut normalleştirmesi, yinelenen/çakışan komut doğrulaması ve
  geri dönüşte kararlı bir komut yapılandırma sözleşmesi için
  `openclaw/plugin-sdk/telegram-command-config`

Yalnızca kimlik doğrulama kullanan kanallar genellikle varsayılan yolda kalabilir: çekirdek onayları yönetir ve Plugin yalnızca giden/kimlik doğrulama yeteneklerini sunar. Matrix, Slack, Telegram ve özel sohbet aktarımları gibi yerel onay kanalları, kendi onay yaşam döngülerini yazmak yerine paylaşılan yerel yardımcıları kullanmalıdır.

## Gelen bahsetme ilkesi

Gelen bahsetme işleme sürecini iki katmana ayrılmış tutun:

- Plugin sahipliğinde kanıt toplama
- paylaşılan ilke değerlendirmesi

Bahsetme ilkesi kararları için `openclaw/plugin-sdk/channel-mention-gating`
kullanın. Daha geniş gelen yardımcı variline ihtiyacınız olduğunda yalnızca
`openclaw/plugin-sdk/channel-inbound` kullanın.

Plugin yerel mantığı için uygun olanlar:

- bota yanıt algılama
- alıntılanmış bot algılama
- iş parçacığına katılım denetimleri
- hizmet/sistem mesajı hariç tutmaları
- bot katılımını kanıtlamak için gereken platforma özgü yerel önbellekler

Paylaşılan yardımcı için uygun olanlar:

- `requireMention`
- açık bahsetme sonucu
- örtük bahsetme izin listesi
- komut atlama
- nihai atlama kararı

Tercih edilen akış:

1. Yerel bahsetme olgularını hesaplayın.
2. Bu olguları `resolveInboundMentionDecision({ facts, policy })` içine geçirin.
3. Gelen kapınızda `decision.effectiveWasMentioned`, `decision.shouldBypassMention` ve `decision.shouldSkip` kullanın.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
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

`api.runtime.channel.mentions`, zaten çalışma zamanı enjeksiyonuna bağlı olan
paketli kanal Plugin'leri için aynı paylaşılan bahsetme yardımcılarını sunar:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Yalnızca `implicitMentionKindWhen` ve
`resolveInboundMentionDecision` gerekiyorsa, ilgisiz gelen çalışma zamanı
yardımcılarını yüklememek için
`openclaw/plugin-sdk/channel-mention-gating` içinden içe aktarın.

Bahsetme kapısı için `resolveInboundMentionDecision({ facts, policy })` kullanın.

## İzlenecek yol

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    Standart Plugin dosyalarını oluşturun. `package.json` içindeki `channel` alanı,
    bunu bir kanal Plugin'i yapan şeydir. Tam paket meta veri yüzeyi için
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
          "blurb": "Connect OpenClaw to Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat channel plugin",
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
              "label": "Bot token",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema`, `plugins.entries.acme-chat.config` değerini doğrular. Bunu
    kanal hesap yapılandırması olmayan, Plugin sahipliğindeki ayarlar için kullanın.
    `channelConfigs`, `channels.acme-chat` değerini doğrular ve Plugin çalışma zamanı
    yüklenmeden önce yapılandırma şeması, kurulum ve UI yüzeyleri tarafından kullanılan
    soğuk yol kaynağıdır.

  </Step>

  <Step title="Build the channel plugin object">
    `ChannelPlugin` arayüzünde birçok isteğe bağlı bağdaştırıcı yüzeyi bulunur.
    En düşük düzeyle, yani `id` ve `setup` ile başlayın; gerektikçe bağdaştırıcıları ekleyin.

    `src/channel.ts` oluşturun:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // your platform API client

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
      if (!token) throw new Error("acme-chat: token is required");
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
        setup: {
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
      }),

      // DM security: who can message the bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: approval flow for new DM contacts
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: how replies are delivered
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: send messages to the platform
      outbound: {
        attachedResults: {
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

    Hem kurallı üst düzey DM anahtarlarını hem de eski iç içe anahtarları kabul eden kanallar için `plugin-sdk/channel-config-helpers` içindeki yardımcıları kullanın: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` ve `normalizeChannelDmPolicy`, hesap yerelindeki değerleri devralınan kök değerlerin önünde tutar. Aynı çözümleyiciyi `normalizeLegacyDmAliases` üzerinden doctor onarımıyla eşleştirin; böylece çalışma zamanı ve geçiş aynı sözleşmeyi okur.

    <Accordion title="What createChatChannelPlugin does for you">
      Düşük düzeyli bağdaştırıcı arayüzlerini elle uygulamak yerine, bildirimsel
      seçenekleri geçirirsiniz ve oluşturucu bunları birleştirir:

      | Seçenek | Ne bağlar |
      | --- | --- |
      | `security.dm` | Yapılandırma alanlarından kapsamlı DM güvenlik çözümleyicisi |
      | `pairing.text` | Kod değişimiyle metin tabanlı DM eşleştirme akışı |
      | `threading` | Yanıt modu çözümleyicisi (sabit, hesap kapsamlı veya özel) |
      | `outbound.attachedResults` | Sonuç meta verisi (mesaj kimlikleri) döndüren gönderim işlevleri |

      Tam denetime ihtiyacınız varsa bildirimsel seçenekler yerine ham bağdaştırıcı
      nesneleri de geçirebilirsiniz.

      Ham giden bağdaştırıcılar bir `chunker(text, limit, ctx)` işlevi tanımlayabilir.
      İsteğe bağlı `ctx.formatting`, `maxLinesPerMessage` gibi teslim anı biçimlendirme
      kararlarını taşır; yanıt iş parçacığı ve parça sınırları paylaşılan giden teslimat
      tarafından bir kez çözümlensin diye bunu göndermeden önce uygulayın.
      Gönderim bağlamları, yerel yanıt hedefi çözüldüğünde `replyToIdSource`
      (`implicit` veya `explicit`) bilgisini de içerir; böylece yük yardımcıları,
      örtük tek kullanımlık yanıt yuvasını tüketmeden açık yanıt etiketlerini koruyabilir.
    </Accordion>

  </Step>

  <Step title="Wire the entry point">
    `index.ts` oluşturun:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
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

    Put channel-owned CLI descriptors in `registerCliMetadata(...)` so OpenClaw
    can show them in root help without activating the full channel runtime,
    while normal full loads still pick up the same descriptors for real command
    registration. Keep `registerFull(...)` for runtime-only work.
    If `registerFull(...)` registers gateway RPC methods, use a
    plugin-specific prefix. Core admin namespaces (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) stay reserved and always
    resolve to `operator.admin`.
    `defineChannelPluginEntry` handles the registration-mode split automatically. See
    [Entry Points](/tr/plugins/sdk-entrypoints#definechannelpluginentry) for all
    options.

  </Step>

  <Step title="Add a setup entry">
    Create `setup-entry.ts` for lightweight loading during onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw loads this instead of the full entry when the channel is disabled
    or unconfigured. It avoids pulling in heavy runtime code during setup flows.
    See [Setup and Config](/tr/plugins/sdk-setup#setup-entry) for details.

    Bundled workspace channels that split setup-safe exports into sidecar
    modules can use `defineBundledChannelSetupEntry(...)` from
    `openclaw/plugin-sdk/channel-entry-contract` when they also need an
    explicit setup-time runtime setter.

  </Step>

  <Step title="Handle inbound messages">
    Your plugin needs to receive messages from the platform and forward them to
    OpenClaw. The typical pattern is a webhook that verifies the request and
    dispatches it through your channel's inbound handler:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK -
          // see a real example in the bundled Microsoft Teams or Google Chat plugin package.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Inbound message handling is channel-specific. Each channel plugin owns
      its own inbound pipeline. Look at bundled channel plugins
      (for example the Microsoft Teams or Google Chat plugin package) for real patterns.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
Write colocated tests in `src/channel.test.ts`:

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
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    For shared test helpers, see [Testing](/tr/plugins/sdk-testing).

</Step>
</Steps>

## Dosya yapısı

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel metadata
├── openclaw.plugin.json      # Manifest with config schema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Public exports (optional)
├── runtime-api.ts            # Internal runtime exports (optional)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Platform API client
    └── runtime.ts            # Runtime store (if needed)
```

## Gelişmiş konular

<CardGroup cols={2}>
  <Card title="Threading options" icon="git-branch" href="/tr/plugins/sdk-entrypoints#registration-mode">
    Sabit, hesap kapsamlı veya özel yanıt modları
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/tr/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool ve eylem keşfi
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/tr/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/tr/plugins/sdk-runtime">
    api.runtime üzerinden TTS, STT, medya, alt ajan
  </Card>
  <Card title="Channel inbound API" icon="bolt" href="/tr/plugins/sdk-channel-inbound">
    Paylaşılan gelen olay yaşam döngüsü: ingest, resolve, record, dispatch, finalize
  </Card>
</CardGroup>

<Note>
Bazı paketlenmiş yardımcı dikişler, paketlenmiş Plugin bakımı ve
uyumluluk için hâlâ vardır. Bunlar yeni kanal Pluginleri için önerilen kalıp değildir;
doğrudan o paketlenmiş Plugin ailesinin bakımını yapmıyorsanız ortak SDK
yüzeyindeki genel channel/setup/reply/runtime alt yollarını tercih edin.
</Note>

## Sonraki adımlar

- [Sağlayıcı Pluginleri](/tr/plugins/sdk-provider-plugins) - Plugininiz aynı zamanda model sağlıyorsa
- [SDK Genel Bakış](/tr/plugins/sdk-overview) - tam alt yol import referansı
- [SDK Testleri](/tr/plugins/sdk-testing) - test yardımcı araçları ve sözleşme testleri
- [Plugin Manifesti](/tr/plugins/manifest) - tam manifest şeması

## İlgili

- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Ajan koşum Pluginleri](/tr/plugins/sdk-agent-harness)

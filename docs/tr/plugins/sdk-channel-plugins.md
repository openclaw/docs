---
read_when:
    - Yeni bir mesajlaşma kanalı Plugin'i oluşturuyorsunuz
    - OpenClaw'u bir mesajlaşma platformuna bağlamak istiyorsunuz
    - ChannelPlugin bağdaştırıcı yüzeyini anlamanız gerekir
sidebarTitle: Channel Plugins
summary: OpenClaw için mesajlaşma kanalı Plugin'i oluşturmaya yönelik adım adım kılavuz
title: Kanal pluginleri oluşturma
x-i18n:
    generated_at: "2026-07-02T22:45:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84490ebdd482d1f09827af38274d06beea6d7fd72071e66beb79fcc12c86656a
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Bu kılavuz, OpenClaw'u bir mesajlaşma platformuna bağlayan bir kanal Plugin'i
oluşturmayı adım adım anlatır. Sonunda DM güvenliği, eşleştirme, yanıt dizileri
ve dışa giden mesajlaşma özelliklerine sahip çalışan bir kanalınız olacak.

<Info>
  Daha önce hiç OpenClaw Plugin'i oluşturmadıysanız, temel paket yapısı ve
  manifest kurulumu için önce [Başlarken](/tr/plugins/building-plugins) bölümünü
  okuyun.
</Info>

## Kanal Plugin'leri nasıl çalışır

Kanal Plugin'lerinin kendi send/edit/react araçlarına ihtiyacı yoktur. OpenClaw,
çekirdekte tek bir paylaşılan `message` aracı tutar. Plugin'iniz şunlardan
sorumludur:

- **Yapılandırma** - hesap çözümleme ve kurulum sihirbazı
- **Güvenlik** - DM ilkesi ve izin listeleri
- **Eşleştirme** - DM onay akışı
- **Oturum grameri** - sağlayıcıya özgü konuşma kimliklerinin temel sohbetlere, dizi kimliklerine ve üst geri dönüşlerine nasıl eşlendiği
- **Dışa giden** - platforma metin, medya ve anket gönderme
- **Dizileme** - yanıtların nasıl dizilere bağlandığı
- **Heartbeat yazıyor göstergesi** - heartbeat teslim hedefleri için isteğe bağlı yazıyor/meşgul sinyalleri

Çekirdek; paylaşılan mesaj aracını, prompt bağlantılarını, dış oturum anahtarı
şeklini, genel `:thread:` kayıtlarını ve yönlendirmeyi sahiplenir.

Yeni kanal Plugin'leri ayrıca `openclaw/plugin-sdk/channel-outbound` içindeki
`defineChannelMessageAdapter` ile bir `message` bağdaştırıcısı sunmalıdır.
Bağdaştırıcı, yerel aktarımın gerçekten desteklediği kalıcı nihai gönderim
yeteneklerini bildirir ve metin/medya gönderimlerini eski `outbound`
bağdaştırıcısıyla aynı aktarım işlevlerine yönlendirir. Bir yeteneği yalnızca,
yerel yan etkiyi ve dönen alındıyı kanıtlayan bir sözleşme testi olduğunda
bildirin.
Tam API sözleşmesi, örnekler, yetenek matrisi, alındı kuralları, canlı önizleme
sonlandırma, alma onayı ilkesi, testler ve geçiş tablosu için bkz.
[Kanal dışa giden API'si](/tr/plugins/sdk-channel-outbound).
Mevcut `outbound` bağdaştırıcısı zaten doğru gönderim yöntemlerine ve yetenek
metadata'sına sahipse, başka bir köprüyü elle yazmak yerine `message`
bağdaştırıcısını türetmek için `createChannelMessageAdapterFromOutbound(...)`
kullanın.
Bağdaştırıcı gönderimleri `MessageReceipt` değerleri döndürmelidir. Uyumluluk
kodu hâlâ eski kimliklere ihtiyaç duyduğunda, yeni yaşam döngüsü kodunda paralel
`messageIds` alanları tutmak yerine bunları
`listMessageReceiptPlatformIds(...)` veya
`resolveMessageReceiptPrimaryId(...)` ile türetin.
Önizleme yetenekli kanallar ayrıca sahip oldukları tam canlı yaşam döngüsüyle
`message.live.capabilities` bildirmelidir; örneğin `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` veya
`quietFinalization`. Bir taslak önizlemeyi yerinde sonlandıran kanallar ayrıca
`message.live.finalizer.capabilities` bildirmelidir; örneğin `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` ve
`retainOnAmbiguousFailure`; çalışma zamanı mantığını da
`defineFinalizableLivePreviewAdapter(...)` ve
`deliverWithFinalizableLivePreviewAdapter(...)` üzerinden yönlendirmelidir. Bu
yetenekleri `verifyChannelMessageLiveCapabilityAdapterProofs(...)` ve
`verifyChannelMessageLiveFinalizerProofs(...)` testleriyle destekli tutun ki
yerel önizleme, ilerleme, düzenleme, geri dönüş/tutma, temizleme ve alındı
davranışı sessizce sapmasın.
Platform onaylarını erteleyen içe gelen alıcılar, onay zamanlamasını izleyiciye
yerel durumda gizlemek yerine `message.receive.defaultAckPolicy` ve
`supportedAckPolicies` bildirmelidir. Bildirilen her ilkeyi
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` ile kapsayın.

`createChannelTurnReplyPipeline`, `dispatchInboundReplyWithBase` ve
`recordInboundSessionAndDispatchReply` gibi eski yanıt yardımcıları uyumluluk
yönlendiricileri için kullanılabilir kalır. Yeni kanal kodu için bu adları
kullanmayın; yeni Plugin'ler `openclaw/plugin-sdk/channel-outbound` üzerindeki
`message` bağdaştırıcısı, alındılar ve alma/gönderme yaşam döngüsü yardımcılarıyla
başlamalıdır.

İçe gelen yetkilendirmeyi taşıyan kanallar, çalışma zamanı alma yollarından
deneysel `openclaw/plugin-sdk/channel-ingress-runtime` alt yolunu kullanabilir.
Alt yol, platform aramasını ve yan etkileri Plugin içinde tutarken izin listesi
durumu çözümlemesini, rota/gönderen/komut/olay/etkinleştirme kararlarını,
redakte edilmiş tanılamaları ve tur kabul eşlemesini paylaşır. Plugin kimliği
normalleştirmesini çözümleyiciye geçirdiğiniz tanımlayıcıda tutun; çözümlenen
durumdan veya karardan ham eşleşme değerlerini serileştirmeyin. API tasarımı,
sahiplik sınırı ve test beklentileri için bkz.
[Kanal ingress API'si](/tr/plugins/sdk-channel-ingress).

Kanalınız içe gelen yanıtlar dışında yazıyor göstergelerini destekliyorsa,
kanal Plugin'inde `heartbeat.sendTyping(...)` sunun. Çekirdek, heartbeat model
çalışması başlamadan önce bunu çözümlenmiş heartbeat teslim hedefiyle çağırır ve
paylaşılan yazıyor keepalive/temizleme yaşam döngüsünü kullanır. Platformun açık
bir durdurma sinyaline ihtiyacı olduğunda `heartbeat.clearTyping(...)` ekleyin.

Kanalınız medya kaynakları taşıyan mesaj aracı parametreleri ekliyorsa, bu
parametre adlarını `describeMessageTool(...).mediaSourceParams` üzerinden sunun.
Çekirdek bu açık listeyi sandbox yol normalleştirmesi ve dışa giden medya erişim
ilkesi için kullanır; böylece Plugin'lerin sağlayıcıya özgü avatar, ek veya
kapak görseli parametreleri için paylaşılan çekirdekte özel durumlara ihtiyacı
olmaz.
İlgisiz eylemlerin başka bir eylemin medya argümanlarını devralmaması için
`{ "set-profile": ["avatarUrl", "avatarPath"] }` gibi eylem anahtarlı bir harita
döndürmeyi tercih edin. Düz dizi, bilerek sunulan her eylemde paylaşılan
parametreler için hâlâ çalışır.
Platform tarafında medya getirme için geçici bir genel URL sunması gereken
kanallar, Plugin durum depolarıyla `openclaw/plugin-sdk/outbound-media` içinden
`createHostedOutboundMediaStore(...)` kullanabilir. Platform rota ayrıştırmasını
ve token zorlamasını kanal Plugin'inde tutun; paylaşılan yardımcı yalnızca medya
yüklemeyi, süre sonu metadata'sını, parça satırlarını ve temizlemeyi sahiplenir.

Kanalınızın `message(action="send")` için sağlayıcıya özgü şekillendirmeye
ihtiyacı varsa, `actions.prepareSendPayload(...)` tercih edin. Yerel kartları,
blokları, yerleştirmeleri veya diğer kalıcı verileri
`payload.channelData.<channel>` altına koyun ve gerçek gönderimi çekirdeğin
outbound/message bağdaştırıcısı üzerinden yapmasına izin verin.
`actions.handleAction(...)` öğesini gönderim için yalnızca serileştirilemeyen ve
yeniden denenemeyen payload'lar için uyumluluk geri dönüşü olarak kullanın.

Platformunuz konuşma kimlikleri içinde ek kapsam saklıyorsa, bu ayrıştırmayı
Plugin içinde `messaging.resolveSessionConversation(...)` ile tutun. Bu, `rawId`
değerini temel konuşma kimliğine, isteğe bağlı dizi kimliğine, açık
`baseConversationId` değerine ve herhangi bir `parentConversationCandidates`
listesine eşlemek için kanonik kancadır.
`parentConversationCandidates` döndürdüğünüzde, bunları en dar üstten en geniş/
temel konuşmaya doğru sıralı tutun.

Plugin kodunun rota benzeri alanları normalleştirmesi, bir alt diziyi üst
rotasıyla karşılaştırması veya `{ channel, to, accountId, threadId }` üzerinden
kararlı bir tekilleştirme anahtarı oluşturması gerektiğinde
`openclaw/plugin-sdk/channel-route` kullanın. Yardımcı, sayısal dizi
kimliklerini çekirdekle aynı şekilde normalleştirir; bu nedenle Plugin'ler
geçici `String(threadId)` karşılaştırmaları yerine bunu tercih etmelidir.
Sağlayıcıya özgü hedef gramerine sahip Plugin'ler,
`messaging.resolveOutboundSessionRoute(...)` sunmalıdır; böylece çekirdek,
ayrıştırıcı shim'leri kullanmadan sağlayıcıya yerel oturum ve dizi kimliğini
alır.

Kanal kayıt defteri başlatılmadan önce aynı ayrıştırmaya ihtiyaç duyan paketli
Plugin'ler, eşleşen `resolveSessionConversation(...)` dışa aktarımına sahip üst
düzey bir `session-key-api.ts` dosyası da sunabilir. Çekirdek, bu bootstrap için
güvenli yüzeyi yalnızca çalışma zamanı Plugin kayıt defteri henüz kullanılabilir
olmadığında kullanır.

`messaging.resolveParentConversationCandidates(...)`, bir Plugin'in yalnızca
genel/ham kimliğin üzerine üst geri dönüşlerine ihtiyaç duyduğu durumlarda eski
uyumluluk geri dönüşü olarak kullanılabilir kalır. Her iki kanca da varsa,
çekirdek önce `resolveSessionConversation(...).parentConversationCandidates`
kullanır ve yalnızca kanonik kanca bunları atladığında
`resolveParentConversationCandidates(...)` geri dönüşüne geçer.

## Onaylar ve kanal yetenekleri

Çoğu kanal Plugin'inin onaya özgü koda ihtiyacı yoktur.

- Çekirdek, aynı sohbet `/approve`, paylaşılan onay düğmesi yükleri ve genel geri dönüş teslimini sahiplenir.
- Kanal onaya özgü davranışa ihtiyaç duyduğunda kanal Plugin'inde tek bir `approvalCapability` nesnesini tercih edin.
- `ChannelPlugin.approvals` kaldırıldı. Onay teslimi/yerel/render/auth olgularını `approvalCapability` üzerine koyun.
- `plugin.auth` yalnızca login/logout içindir; çekirdek artık onay auth hook'larını bu nesneden okumaz.
- `approvalCapability.authorizeActorAction` ve `approvalCapability.getActionAvailabilityState` kanonik onay-auth yüzeyidir.
- Aynı sohbet onay auth kullanılabilirliği için `approvalCapability.getActionAvailabilityState` kullanın. Yerel teslim devre dışı olsa bile yapılandırılmış onaylayıcıları `/approve` için kullanılabilir tutun; bunun yerine teslim/kurulum yönlendirmesi için yerel başlatma-yüzeyi durumunu kullanın.
- Kanalınız yerel exec onaylarını açığa çıkarıyorsa, aynı sohbet onay auth durumundan farklı olduğunda başlatma-yüzeyi/yerel-istemci durumu için `approvalCapability.getExecInitiatingSurfaceState` kullanın. Çekirdek, bu exec'e özgü hook'u `enabled` ile `disabled` ayrımını yapmak, başlatan kanalın yerel exec onaylarını destekleyip desteklemediğine karar vermek ve kanalı yerel-istemci geri dönüş yönlendirmesine dahil etmek için kullanır. `createApproverRestrictedNativeApprovalCapability(...)` yaygın durum için bunu doldurur.
- Yinelenen yerel onay istemlerini gizlemek veya teslimden önce yazıyor göstergeleri göndermek gibi kanala özgü yük yaşam döngüsü davranışları için `outbound.shouldSuppressLocalPayloadPrompt` veya `outbound.beforeDeliverPayload` kullanın.
- `approvalCapability.delivery` yalnızca yerel onay yönlendirmesi veya geri dönüş bastırma için kullanın.
- Kanalın sahip olduğu yerel onay olguları için `approvalCapability.nativeRuntime` kullanın. Bunu sıcak kanal giriş noktalarında `createLazyChannelApprovalNativeRuntimeAdapter(...)` ile tembel tutun; bu, çekirdeğin onay yaşam döngüsünü bir araya getirmesine hâlâ izin verirken runtime modülünüzü isteğe bağlı içe aktarabilir.
- `approvalCapability.render` yalnızca bir kanal paylaşılan renderer yerine gerçekten özel onay yüklerine ihtiyaç duyduğunda kullanın.
- Kanal, devre dışı yol yanıtının yerel exec onaylarını etkinleştirmek için gereken kesin yapılandırma düğmelerini açıklamasını istediğinde `approvalCapability.describeExecApprovalSetup` kullanın. Hook `{ channel, channelLabel, accountId }` alır; adlandırılmış-hesap kanalları üst düzey varsayılanlar yerine `channels.<channel>.accounts.<id>.execApprovals.*` gibi hesap kapsamlı yollar render etmelidir.
- Plugin onay hatası yönlendirmesinin Plugin onayı rota-yok ve zaman aşımı hataları için gösterilmesi güvenli olduğunda `approvalCapability.describePluginApprovalSetup` kullanın. `createApproverRestrictedNativeApprovalCapability(...)` bunu `describeExecApprovalSetup` üzerinden çıkarımsamaz; aynı yardımcıyı yalnızca Plugin ve exec onayları gerçekten aynı yerel kurulumu kullanıyorsa açıkça geçirin.
- Bir kanal mevcut yapılandırmadan kararlı sahip-benzeri DM kimlikleri çıkarabiliyorsa, onaya özgü çekirdek mantığı eklemeden aynı sohbet `/approve` komutunu kısıtlamak için `openclaw/plugin-sdk/approval-runtime` içinden `createResolvedApproverActionAuthAdapter` kullanın.
- Özel onay auth bilerek yalnızca aynı sohbet geri dönüşüne izin veriyorsa, `openclaw/plugin-sdk/approval-auth-runtime` içinden `markImplicitSameChatApprovalAuthorization({ authorized: true })` döndürün; aksi takdirde çekirdek sonucu açık onaylayıcı yetkilendirmesi olarak ele alır.
- Kanalın sahip olduğu yerel bir callback onayları doğrudan çözümlüyorsa, örtük geri dönüşün hâlâ kanalın normal aktör yetkilendirmesinden geçmesi için çözümlemeden önce `isImplicitSameChatApprovalAuthorization(...)` kullanın.
- Bir kanal yerel onay teslimine ihtiyaç duyuyorsa, kanal kodunu hedef normalizasyonu artı taşıma/sunum olgularına odaklı tutun. `openclaw/plugin-sdk/approval-runtime` içinden `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` ve `createApproverRestrictedNativeApprovalCapability` kullanın. Kanala özgü olguları, ideal olarak `createChannelApprovalNativeRuntimeAdapter(...)` veya `createLazyChannelApprovalNativeRuntimeAdapter(...)` üzerinden `approvalCapability.nativeRuntime` arkasına koyun; böylece çekirdek handler'ı bir araya getirip istek filtreleme, yönlendirme, tekilleştirme, süre sonu, Gateway aboneliği ve başka-yere-yönlendirildi bildirimlerini sahiplenebilir. `nativeRuntime` birkaç daha küçük yüzeye ayrılır:
- Bir kanal hem oturum-kökenli yerel teslimi hem de açık onay iletme hedeflerini desteklediğinde `openclaw/plugin-sdk/approval-native-runtime` içinden `createNativeApprovalChannelRouteGates` kullanın. Yardımcı, onay yapılandırması seçimini, `mode` işlemeyi, ajan/oturum filtrelerini, hesap bağlamayı, oturum-hedef eşleştirmeyi ve hedef-listesi eşleştirmeyi merkezileştirirken çağıranlar hâlâ kanal kimliğini, varsayılan iletme modunu, hesap aramayı, taşıma-etkin kontrolünü, hedef normalizasyonunu ve dönüş-kaynağı hedef çözümlemesini sahiplenir. Bunu çekirdek-sahipli kanal ilke varsayılanları oluşturmak için kullanmayın; kanalın belgelenmiş varsayılan modunu açıkça geçirin.
- `createChannelNativeOriginTargetResolver`, varsayılan olarak `{ to, accountId, threadId }` hedefleri için paylaşılan kanal-rota eşleştiricisini kullanır. Yalnızca bir kanal Slack zaman damgası öneki eşleştirme gibi sağlayıcıya özgü eşdeğerlik kurallarına sahipse `targetsMatch` geçirin.
- Kanalın, özgün hedefi teslim için korurken varsayılan rota eşleştiricisi veya özel bir `targetsMatch` callback'i çalışmadan önce sağlayıcı kimliklerini kanonikleştirmesi gerektiğinde `createChannelNativeOriginTargetResolver` öğesine `normalizeTargetForMatch` geçirin. `normalizeTarget` yalnızca çözümlenen teslim hedefinin kendisinin kanonikleştirilmesi gerektiğinde kullanın.
- `availability` - hesabın yapılandırılıp yapılandırılmadığı ve bir isteğin işlenip işlenmeyeceği
- `presentation` - paylaşılan onay görünüm modelini bekleyen/çözümlenen/süresi dolan yerel yüklere veya son eylemlere eşleyin
- `transport` - hedefleri hazırlayın ve yerel onay mesajlarını gönderin/güncelleyin/silin
- `interactions` - yerel düğmeler veya tepkiler için isteğe bağlı bind/unbind/clear-action hook'ları ve isteğe bağlı bir `cancelDelivered` hook'u. `deliverPending` işlem içi veya kalıcı durum kaydettiğinde (örneğin bir tepki hedef deposu) `cancelDelivered` uygulayın; böylece bir handler durdurması `bindPending` çalışmadan önce teslimi iptal ederse veya `bindPending` hiçbir handle döndürmezse bu durum serbest bırakılabilir
- `observe` - isteğe bağlı teslim tanılama hook'ları
- Kanal istemci, token, Bolt uygulaması veya webhook alıcısı gibi runtime-sahipli nesnelere ihtiyaç duyuyorsa, bunları `openclaw/plugin-sdk/channel-runtime-context` üzerinden kaydedin. Genel runtime-context kayıt defteri, çekirdeğin onaya özgü wrapper yapıştırıcısı eklemeden kanal başlangıç durumundan yetenek odaklı handler'ları bootstrap etmesini sağlar.
- Daha düşük seviyeli `createChannelApprovalHandler` veya `createChannelNativeApprovalRuntime` öğesine yalnızca yetenek odaklı yüzey henüz yeterince ifade gücüne sahip olmadığında başvurun.
- Yerel onay kanalları hem `accountId` hem de `approvalKind` değerlerini bu yardımcılar üzerinden yönlendirmelidir. `accountId`, çok-hesaplı onay ilkesini doğru bot hesabı kapsamında tutar; `approvalKind` ise exec ve Plugin onayı davranışını çekirdekte sabit kodlu dallar olmadan kanal için kullanılabilir tutar.
- Çekirdek artık onay yeniden yönlendirme bildirimlerini de sahiplenir. Kanal Plugin'leri `createChannelNativeApprovalRuntime` içinden kendi "onay DM'lere / başka kanala gitti" takip mesajlarını göndermemelidir; bunun yerine paylaşılan onay yeteneği yardımcıları üzerinden doğru köken + onaylayıcı-DM yönlendirmesini açığa çıkarın ve çekirdeğin başlatan sohbete herhangi bir bildirim göndermeden önce gerçek teslimleri toplamasına izin verin.
- Teslim edilen onay kimliği türünü uçtan uca koruyun. Yerel istemciler exec ve Plugin onayı yönlendirmesini kanal-yerel durumdan tahmin etmemeli veya yeniden yazmamalıdır.
- Farklı onay türleri bilerek farklı yerel yüzeyler açığa çıkarabilir.
  Mevcut paketli örnekler:
  - Slack, yerel onay yönlendirmesini hem exec hem de Plugin kimlikleri için kullanılabilir tutar.
  - Matrix, auth'un onay türüne göre farklılaşmasına hâlâ izin verirken exec ve Plugin onayları için aynı yerel DM/kanal yönlendirmesini ve tepki UX'ini korur.
- `createApproverRestrictedNativeApprovalAdapter` bir uyumluluk wrapper'ı olarak hâlâ vardır, ancak yeni kod yetenek oluşturucuyu tercih etmeli ve Plugin üzerinde `approvalCapability` açığa çıkarmalıdır.

Sıcak kanal giriş noktaları için, o ailenin yalnızca bir parçasına ihtiyaç duyduğunuzda daha dar runtime alt yollarını tercih edin:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Benzer şekilde, daha geniş şemsiye yüzeye ihtiyaç duymadığınızda `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` ve
`openclaw/plugin-sdk/reply-chunking` tercih edin.

Özellikle kurulum için:

- `openclaw/plugin-sdk/setup-runtime` runtime-güvenli kurulum yardımcılarını kapsar:
  `createSetupTranslator`, içe-aktarma-güvenli kurulum yama adaptörleri (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), arama-notu çıktısı,
  `promptResolvedAllowFrom`, `splitSetupEntries` ve yetkilendirilmiş
  setup-proxy oluşturucular
- `openclaw/plugin-sdk/setup-runtime`, `createEnvPatchedAccountSetupAdapter` için env-duyarlı adaptör yüzeyini içerir
- `openclaw/plugin-sdk/channel-setup`, isteğe bağlı-kurulum kurulumu oluşturucularını ve birkaç kurulum-güvenli primitifi kapsar:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Kanalınız env odaklı kurulumu veya auth'u destekliyorsa ve genel başlangıç/yapılandırma akışları runtime yüklenmeden önce bu env adlarını bilmeliyse, bunları Plugin manifestinde `channelEnvVars` ile bildirin. Kanal runtime `envVars` veya yerel sabitlerini yalnızca operatör odaklı metinler için tutun.

Kanalınız Plugin runtime başlamadan önce `status`, `channels list`, `channels status` veya SecretRef taramalarında görünebiliyorsa, `package.json` içine `openclaw.setupEntry` ekleyin. Bu giriş noktası salt-okunur komut yollarında içe aktarılmak için güvenli olmalı ve bu özetler için gereken kanal meta verilerini, kurulum-güvenli yapılandırma adaptörünü, durum adaptörünü ve kanal secret hedef meta verilerini döndürmelidir. Kurulum girişinden istemciler, dinleyiciler veya taşıma runtime'ları başlatmayın.

Ana kanal giriş içe aktarma yolunu da dar tutun. Keşif, kanalı etkinleştirmeden yetenekleri kaydetmek için girişi ve kanal Plugin modülünü değerlendirebilir. `channel-plugin-api.ts` gibi dosyalar, kurulum sihirbazlarını, taşıma istemcilerini, socket dinleyicilerini, alt süreç başlatıcılarını veya servis başlangıç modüllerini içe aktarmadan kanal Plugin nesnesini dışa aktarmalıdır. Bu runtime parçalarını `registerFull(...)`, runtime setter'ları veya tembel yetenek adaptörlerinden yüklenen modüllere koyun.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` ve
`splitSetupEntries`

- daha geniş `openclaw/plugin-sdk/setup` yüzeyini yalnızca
  `moveSingleAccountChannelSectionToDefaultAccount(...)` gibi daha ağır paylaşılan kurulum/yapılandırma yardımcılarına da ihtiyaç duyduğunuzda kullanın

Kanalınız yalnızca kurulum yüzeylerinde "önce bu Plugin'i kur" mesajını duyurmak istiyorsa, `createOptionalChannelSetupSurface(...)` tercih edin. Üretilen adaptör/sihirbaz yapılandırma yazmaları ve sonlandırma için kapalı başarısız olur; doğrulama, finalize ve docs-link metninde aynı kurulum-gerekli mesajını yeniden kullanırlar.

Diğer sıcak kanal yolları için, daha geniş eski yüzeyler yerine dar yardımcıları tercih edin:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` ve
  çok hesaplı yapılandırma ve varsayılan hesap geri dönüşü için
  `openclaw/plugin-sdk/account-helpers`
- gelen rota/zarf ve kaydetme ve gönderme bağlantısı için
  `openclaw/plugin-sdk/inbound-envelope` ve
  `openclaw/plugin-sdk/channel-inbound`
- hedef ayrıştırma yardımcıları için `openclaw/plugin-sdk/channel-targets`
- medya yükleme için `openclaw/plugin-sdk/outbound-media` ve
  giden kimlik/gönderme temsilcileri ve yük planlaması için
  `openclaw/plugin-sdk/channel-outbound`
- Bir giden rota açık bir `replyToId`/`threadId` değerini korumalıysa veya
  temel oturum anahtarı hâlâ eşleştikten sonra geçerli `:thread:` oturumunu
  kurtarmalıysa `openclaw/plugin-sdk/channel-core` içinden
  `buildThreadAwareOutboundSessionRoute(...)`. Sağlayıcı Plugin’leri,
  platformlarında yerel iş parçacığı teslim semantiği olduğunda önceliği, sonek
  davranışını ve iş parçacığı kimliği normalleştirmesini geçersiz kılabilir.
- iş parçacığı bağlama yaşam döngüsü ve bağdaştırıcı kaydı için
  `openclaw/plugin-sdk/thread-bindings-runtime`
- yalnızca eski bir aracı/medya yük alanı düzeni hâlâ gerekli olduğunda
  `openclaw/plugin-sdk/agent-media-payload`
- Telegram özel komut normalleştirmesi, yinelenen/çakışan doğrulaması ve geri
  dönüşü kararlı bir komut yapılandırması sözleşmesi için
  `openclaw/plugin-sdk/telegram-command-config`

Yalnızca kimlik doğrulama kullanan kanallar genellikle varsayılan yolda kalabilir: çekirdek onayları yönetir ve Plugin yalnızca giden/kimlik doğrulama yeteneklerini sunar. Matrix, Slack, Telegram ve özel sohbet taşıyıcıları gibi yerel onay kanalları, kendi onay yaşam döngülerini kurmak yerine paylaşılan yerel yardımcıları kullanmalıdır.

## Gelen bahsetme ilkesi

Gelen bahsetme işlemeyi iki katmana bölünmüş tutun:

- Plugin’in sahip olduğu kanıt toplama
- paylaşılan ilke değerlendirmesi

Bahsetme ilkesi kararları için `openclaw/plugin-sdk/channel-mention-gating`
kullanın. `openclaw/plugin-sdk/channel-inbound` yalnızca daha geniş gelen
yardımcı barrel’ına ihtiyacınız olduğunda kullanın.

Plugin yerel mantığı için uygun olanlar:

- bota yanıt algılama
- alıntılanan bot algılama
- iş parçacığına katılım denetimleri
- hizmet/sistem iletisi hariç tutmaları
- bot katılımını kanıtlamak için gereken platform yerel önbellekleri

Paylaşılan yardımcı için uygun olanlar:

- `requireMention`
- açık bahsetme sonucu
- örtük bahsetme izin listesi
- komut atlatma
- son atlama kararı

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

`api.runtime.channel.mentions`, zaten çalışma zamanı enjeksiyonuna bağımlı olan
paketlenmiş kanal Plugin’leri için aynı paylaşılan bahsetme yardımcılarını sunar:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Yalnızca `implicitMentionKindWhen` ve
`resolveInboundMentionDecision` gerekiyorsa ilgisiz gelen çalışma zamanı
yardımcılarını yüklemekten kaçınmak için
`openclaw/plugin-sdk/channel-mention-gating` içinden içe aktarın.

Bahsetme kapılaması için `resolveInboundMentionDecision({ facts, policy })` kullanın.

## İzlenecek yol

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket ve manifest">
    Standart Plugin dosyalarını oluşturun. `package.json` içindeki `channel`
    alanı bunu bir kanal Plugin’i yapan şeydir. Tam paket meta veri yüzeyi için
    [Plugin Kurulumu ve Yapılandırma](/tr/plugins/sdk-setup#openclaw-channel)
    bölümüne bakın:

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
    kanal hesap yapılandırması olmayan, Plugin’e ait ayarlar için kullanın.
    `channelConfigs`, `channels.acme-chat` değerini doğrular ve Plugin çalışma
    zamanı yüklenmeden önce yapılandırma şeması, kurulum ve kullanıcı arayüzü
    yüzeyleri tarafından kullanılan soğuk yol kaynağıdır.

  </Step>

  <Step title="Kanal Plugin nesnesini oluşturun">
    `ChannelPlugin` arayüzünün birçok isteğe bağlı bağdaştırıcı yüzeyi vardır.
    En azıyla, yani `id` ve `setup` ile başlayın ve ihtiyaç duydukça
    bağdaştırıcılar ekleyin.

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

    Hem kanonik üst düzey DM anahtarlarını hem de eski iç içe anahtarları kabul eden kanallar için `plugin-sdk/channel-config-helpers` içindeki yardımcıları kullanın: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` ve `normalizeChannelDmPolicy`, hesap yerel değerlerini devralınan kök değerlerin önünde tutar. Çalışma zamanı ve migrasyonun aynı sözleşmeyi okuması için aynı çözümleyiciyi `normalizeLegacyDmAliases` üzerinden doctor onarımıyla eşleştirin.

    <Accordion title="createChatChannelPlugin sizin için ne yapar">
      Düşük seviyeli bağdaştırıcı arayüzlerini elle uygulamak yerine bildirimsel
      seçenekler geçirirsiniz ve oluşturucu bunları birleştirir:

      | Seçenek | Bağladığı şey |
      | --- | --- |
      | `security.dm` | Yapılandırma alanlarından kapsamlı DM güvenliği çözümleyicisi |
      | `pairing.text` | Kod alışverişiyle metin tabanlı DM eşleştirme akışı |
      | `threading` | Yanıt modu çözümleyicisi (sabit, hesap kapsamlı veya özel) |
      | `outbound.attachedResults` | Sonuç meta verisi (ileti kimlikleri) döndüren gönderme işlevleri |

      Tam denetime ihtiyacınız varsa bildirimsel seçenekler yerine ham
      bağdaştırıcı nesneleri de geçirebilirsiniz.

      Ham giden bağdaştırıcılar bir `chunker(text, limit, ctx)` işlevi
      tanımlayabilir. İsteğe bağlı `ctx.formatting`, `maxLinesPerMessage` gibi
      teslim zamanı biçimlendirme kararlarını taşır; yanıt iş parçacığı ve parça
      sınırları paylaşılan giden teslim tarafından bir kez çözümlensin diye bunu
      göndermeden önce uygulayın. Gönderme bağlamları, yerel bir yanıt hedefi
      çözüldüğünde `replyToIdSource` (`implicit` veya `explicit`) bilgisini de
      içerir; böylece yük yardımcıları, örtük tek kullanımlık yanıt yuvasını
      tüketmeden açık yanıt etiketlerini koruyabilir.
    </Accordion>

  </Step>

  <Step title="Giriş noktasını bağlayın">
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

    Kanalın sahip olduğu CLI tanımlayıcılarını `registerCliMetadata(...)` içine koyun; böylece OpenClaw,
    tam kanal runtime'ını etkinleştirmeden bunları kök yardımda gösterebilir,
    normal tam yüklemeler ise gerçek komut kaydı için aynı tanımlayıcıları
    almaya devam eder. Runtime'a özgü işler için `registerFull(...)` kullanın.
    `registerFull(...)` Gateway RPC yöntemleri kaydediyorsa,
    Plugin'e özgü bir önek kullanın. Çekirdek yönetici ad alanları (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış kalır ve her zaman
    `operator.admin` değerine çözümlenir.
    `defineChannelPluginEntry` kayıt modu ayrımını otomatik olarak işler. Tüm
    seçenekler için [Entry Points](/tr/plugins/sdk-entrypoints#definechannelpluginentry) bölümüne bakın.

  </Step>

  <Step title="Add a setup entry">
    Onboarding sırasında hafif yükleme için `setup-entry.ts` oluşturun:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    Kanal devre dışı olduğunda veya yapılandırılmadığında OpenClaw tam giriş yerine
    bunu yükler. Kurulum akışları sırasında ağır runtime kodunun yüklenmesini önler.
    Ayrıntılar için [Setup and Config](/tr/plugins/sdk-setup#setup-entry) bölümüne bakın.

    Kurulum açısından güvenli dışa aktarımları yan modüllere ayıran paketlenmiş
    çalışma alanı kanalları, açık bir kurulum zamanı runtime ayarlayıcısına da
    ihtiyaç duyduklarında `openclaw/plugin-sdk/channel-entry-contract` içinden
    `defineBundledChannelSetupEntry(...)` kullanabilir.

  </Step>

  <Step title="Handle inbound messages">
    Plugin'inizin platformdan mesajları alıp OpenClaw'a iletmesi gerekir. Tipik
    kalıp, isteği doğrulayan ve kanalınızın inbound işleyicisi üzerinden gönderen
    bir Webhook'tur:

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
      Inbound mesaj işleme kanala özgüdür. Her kanal Plugin'i kendi inbound
      hattına sahiptir. Gerçek kalıplar için paketlenmiş kanal Plugin'lerine
      (örneğin Microsoft Teams veya Google Chat Plugin paketi) bakın.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
`src/channel.test.ts` içinde birlikte konumlandırılmış testler yazın:

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

    Paylaşılan test yardımcıları için [Testing](/tr/plugins/sdk-testing) bölümüne bakın.

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
    TTS, STT, medya, api.runtime üzerinden alt ajan
  </Card>
  <Card title="Channel inbound API" icon="bolt" href="/tr/plugins/sdk-channel-inbound">
    Paylaşılan inbound olay yaşam döngüsü: ingest, resolve, record, dispatch, finalize
  </Card>
</CardGroup>

<Note>
Paketlenmiş Plugin bakımı ve uyumluluk için bazı paketlenmiş yardımcı dikişleri
hâlâ mevcuttur. Bunlar yeni kanal Plugin'leri için önerilen kalıp değildir;
doğrudan o paketlenmiş Plugin ailesinin bakımını yapmıyorsanız ortak SDK
yüzeyinden genel kanal/kurulum/yanıt/runtime alt yollarını tercih edin.
</Note>

## Sonraki adımlar

- [Provider Plugins](/tr/plugins/sdk-provider-plugins) - Plugin'iniz modeller de sağlıyorsa
- [SDK Overview](/tr/plugins/sdk-overview) - tam alt yol içe aktarma referansı
- [SDK Testing](/tr/plugins/sdk-testing) - test yardımcıları ve sözleşme testleri
- [Plugin Manifest](/tr/plugins/manifest) - tam manifest şeması

## İlgili

- [Plugin SDK setup](/tr/plugins/sdk-setup)
- [Building plugins](/tr/plugins/building-plugins)
- [Agent harness plugins](/tr/plugins/sdk-agent-harness)

---
read_when:
    - Yeni bir mesajlaşma kanalı Plugin'i oluşturuyorsunuz
    - OpenClaw'ı bir mesajlaşma platformuna bağlamak istiyorsunuz
    - ChannelPlugin bağdaştırıcı yüzeyini anlamanız gerekir
sidebarTitle: Channel Plugins
summary: OpenClaw için mesajlaşma kanalı Plugin’i oluşturmaya yönelik adım adım kılavuz
title: Kanal Plugin'leri oluşturma
x-i18n:
    generated_at: "2026-05-10T19:47:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 769ccd09eea0df78337822f41da58dc20ec2950409d39d4d19a5f92a35ec49ed
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Bu kılavuz, OpenClaw’u bir mesajlaşma platformuna bağlayan bir kanal Plugin’i oluşturmayı anlatır. Sonunda DM güvenliği, eşleştirme, yanıt dizilimi ve dışa giden mesajlaşma özelliklerine sahip çalışan bir kanalınız olacak.

<Info>
  Daha önce herhangi bir OpenClaw Plugin’i oluşturmadıysanız, temel paket
  yapısı ve manifest kurulumu için önce
  [Başlarken](/tr/plugins/building-plugins) bölümünü okuyun.
</Info>

## Kanal Plugin’leri nasıl çalışır

Kanal Plugin’lerinin kendi gönderme/düzenleme/tepki araçlarına ihtiyacı yoktur. OpenClaw çekirdekte tek bir paylaşılan `message` aracını tutar. Plugin’iniz şunlardan sorumludur:

- **Yapılandırma** - hesap çözümleme ve kurulum sihirbazı
- **Güvenlik** - DM ilkesi ve izin listeleri
- **Eşleştirme** - DM onay akışı
- **Oturum grameri** - sağlayıcıya özgü konuşma kimliklerinin temel sohbetlere, ileti dizisi kimliklerine ve üst öğe geri dönüşlerine nasıl eşlendiği
- **Dışa giden** - platforma metin, medya ve anket gönderme
- **Dizilim** - yanıtların nasıl dizilendiği
- **Heartbeat yazıyor göstergesi** - Heartbeat teslim hedefleri için isteğe bağlı yazıyor/meşgul sinyalleri

Çekirdek, paylaşılan mesaj aracından, istem bağlantılarından, dış oturum anahtarı şeklinden, genel `:thread:` defter tutmadan ve dağıtımdan sorumludur.

Yeni kanal Plugin’leri ayrıca `openclaw/plugin-sdk/channel-message` içinden
`defineChannelMessageAdapter` ile bir `message` bağdaştırıcısı sunmalıdır.
Bağdaştırıcı, yerel taşımanın gerçekten desteklediği kalıcı son gönderme
yeteneklerini bildirir ve metin/medya gönderimlerini eski `outbound`
bağdaştırıcısıyla aynı taşıma işlevlerine yönlendirir. Bir yeteneği yalnızca
yerel yan etkiyi ve dönen makbuzu kanıtlayan bir sözleşme testi olduğunda bildirin.
Tam API sözleşmesi, örnekler, yetenek matrisi, makbuz kuralları, canlı önizleme
sonlandırma, alma ack ilkesi, testler ve geçiş tablosu için
[Kanal mesaj API’si](/tr/plugins/sdk-channel-message) bölümüne bakın.
Mevcut `outbound` bağdaştırıcısı zaten doğru gönderme yöntemlerine ve yetenek
meta verilerine sahipse, başka bir köprüyü elle yazmak yerine `message`
bağdaştırıcısını türetmek için `createChannelMessageAdapterFromOutbound(...)`
kullanın.
Bağdaştırıcı gönderimleri `MessageReceipt` değerleri döndürmelidir. Uyumluluk
kodu hâlâ eski kimliklere ihtiyaç duyduğunda, yeni yaşam döngüsü kodunda paralel
`messageIds` alanları tutmak yerine bunları `listMessageReceiptPlatformIds(...)`
veya `resolveMessageReceiptPrimaryId(...)` ile türetin.
Önizleme destekleyen kanallar ayrıca `message.live.capabilities` içinde
sahip oldukları tam canlı yaşam döngüsünü, örneğin `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` veya
`quietFinalization` olarak bildirmelidir. Bir taslak önizlemeyi yerinde
sonlandıran kanallar ayrıca `message.live.finalizer.capabilities` içinde
`finalEdit`, `normalFallback`, `discardPending`, `previewReceipt` ve
`retainOnAmbiguousFailure` gibi yetenekleri bildirmeli ve çalışma zamanı
mantığını `defineFinalizableLivePreviewAdapter(...)` ile
`deliverWithFinalizableLivePreviewAdapter(...)` üzerinden yönlendirmelidir.
Bu yetenekleri `verifyChannelMessageLiveCapabilityAdapterProofs(...)` ve
`verifyChannelMessageLiveFinalizerProofs(...)` testleriyle destekleyin; böylece
yerel önizleme, ilerleme, düzenleme, geri dönüş/tutma, temizleme ve makbuz
davranışı sessizce sapamaz.
Platform onaylarını erteleyen gelen alıcılar, ack zamanlamasını izleyiciye yerel
durumda gizlemek yerine `message.receive.defaultAckPolicy` ve
`supportedAckPolicies` bildirmelidir. Bildirilen her ilkeyi
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` ile kapsayın.

`createChannelTurnReplyPipeline`, `dispatchInboundReplyWithBase` ve
`recordInboundSessionAndDispatchReply` gibi eski yanıt/tur yardımcıları
uyumluluk dağıtıcıları için kullanılabilir olmaya devam eder. Yeni kanal kodunda
bu adları kullanmayın; yeni Plugin’ler `openclaw/plugin-sdk/channel-message`
üzerindeki `message` bağdaştırıcısı, makbuzlar ve alma/gönderme yaşam döngüsü
yardımcılarıyla başlamalıdır.

Gelen yetkilendirmeyi taşıyan kanallar, çalışma zamanı alma yollarından deneysel
`openclaw/plugin-sdk/channel-ingress-runtime` alt yolunu kullanabilir. Alt yol,
platform aramasını ve yan etkileri Plugin içinde tutarken izin listesi durum
çözümlemesini, rota/gönderen/komut/olay/etkinleştirme kararlarını, redakte
edilmiş tanılamaları ve tur kabul eşlemesini paylaşır. Çözümleyiciye verdiğiniz
tanımlayıcıda Plugin kimliği normalleştirmesini tutun; çözümlenen durumdan veya
karardan ham eşleşme değerlerini serileştirmeyin. API tasarımı, sahiplik sınırı
ve test beklentileri için [Kanal giriş API’si](/tr/plugins/sdk-channel-ingress)
bölümüne bakın.

Kanalınız gelen yanıtlar dışında yazıyor göstergelerini destekliyorsa, kanal
Plugin’i üzerinde `heartbeat.sendTyping(...)` sunun. Çekirdek bunu Heartbeat
model çalışması başlamadan önce çözümlenen Heartbeat teslim hedefiyle çağırır ve
paylaşılan yazıyor keepalive/temizleme yaşam döngüsünü kullanır. Platform açık
bir durdurma sinyaline ihtiyaç duyduğunda `heartbeat.clearTyping(...)` ekleyin.

Kanalınız medya kaynakları taşıyan mesaj aracı parametreleri ekliyorsa, bu
parametre adlarını `describeMessageTool(...).mediaSourceParams` üzerinden sunun.
Çekirdek bu açık listeyi sandbox yolu normalleştirmesi ve dışa giden medya
erişim ilkesi için kullanır; böylece Plugin’lerin sağlayıcıya özgü avatar, ek
veya kapak görseli parametreleri için paylaşılan çekirdekte özel durumlara
ihtiyacı olmaz.
İlişkisiz eylemlerin başka bir eylemin medya bağımsız değişkenlerini
devralmaması için
`{ "set-profile": ["avatarUrl", "avatarPath"] }` gibi eylem anahtarlı bir harita
döndürmeyi tercih edin. Düz dizi, açığa çıkarılan her eylemde kasıtlı olarak
paylaşılan parametreler için hâlâ çalışır.

Kanalınız `message(action="send")` için sağlayıcıya özgü şekillendirmeye ihtiyaç
duyuyorsa, `actions.prepareSendPayload(...)` tercih edin. Yerel kartları,
blokları, embed’leri veya diğer kalıcı verileri `payload.channelData.<channel>`
altına koyun ve gerçek gönderimi çekirdeğin outbound/message bağdaştırıcısı
üzerinden yapmasına izin verin. `actions.handleAction(...)` öğesini gönderme için
yalnızca serileştirilemeyen ve yeniden denenemeyen payload’lar için uyumluluk
geri dönüşü olarak kullanın.

Platformunuz konuşma kimliklerinin içinde ek kapsam saklıyorsa, bu ayrıştırmayı
Plugin içinde `messaging.resolveSessionConversation(...)` ile tutun. Bu, `rawId`
değerini temel konuşma kimliğine, isteğe bağlı ileti dizisi kimliğine, açık
`baseConversationId` değerine ve herhangi bir `parentConversationCandidates`
listesine eşlemek için kanonik hook’tur.
`parentConversationCandidates` döndürdüğünüzde, bunları en dar üst öğeden en
geniş/temel konuşmaya doğru sıralı tutun.

Plugin kodunun rota benzeri alanları normalleştirmesi, bir alt ileti dizisini
üst rotasıyla karşılaştırması veya `{ channel, to, accountId, threadId }`
değerinden kararlı bir tekilleştirme anahtarı oluşturması gerektiğinde
`openclaw/plugin-sdk/channel-route` kullanın. Yardımcı, sayısal ileti dizisi
kimliklerini çekirdekle aynı şekilde normalleştirir; bu yüzden Plugin’ler geçici
`String(threadId)` karşılaştırmaları yerine bunu tercih etmelidir.
Sağlayıcıya özgü hedef grameri olan Plugin’ler ayrıştırıcılarını
`resolveChannelRouteTargetWithParser(...)` içine enjekte edebilir ve yine de
çekirdeğin kullandığı aynı rota hedefi şeklini ve ileti dizisi geri dönüş
anlamını elde edebilir.

Kanal kayıt defteri açılmadan önce aynı ayrıştırmaya ihtiyaç duyan paketli
Plugin’ler, eşleşen bir `resolveSessionConversation(...)` dışa aktarımı içeren
üst düzey bir `session-key-api.ts` dosyası da sunabilir. Çekirdek bu
bootstrap-güvenli yüzeyi yalnızca çalışma zamanı Plugin kayıt defteri henüz
kullanılabilir olmadığında kullanır.

`messaging.resolveParentConversationCandidates(...)`, bir Plugin’in yalnızca
genel/ham kimliğin üzerine üst öğe geri dönüşlerine ihtiyaç duyduğu durumlarda
eski uyumluluk geri dönüşü olarak kullanılabilir olmaya devam eder. Her iki hook
da varsa, çekirdek önce
`resolveSessionConversation(...).parentConversationCandidates` kullanır ve
yalnızca kanonik hook bunları atladığında
`resolveParentConversationCandidates(...)` öğesine geri döner.

## Onaylar ve kanal yetenekleri

Çoğu kanal Plugin’inin onaya özgü koda ihtiyacı yoktur.

- Çekirdek, aynı sohbet `/approve`, paylaşılan onay düğmesi payload'ları ve genel geri dönüş teslimatını sahiplenir.
- Kanal onaya özgü davranışa ihtiyaç duyduğunda, kanal Plugin'i üzerinde tek bir `approvalCapability` nesnesini tercih edin.
- `ChannelPlugin.approvals` kaldırıldı. Onay teslimatı/native/render/auth bilgilerini `approvalCapability` üzerine koyun.
- `plugin.auth` yalnızca oturum açma/oturum kapatmadır; çekirdek artık onay auth hook'larını bu nesneden okumaz.
- `approvalCapability.authorizeActorAction` ve `approvalCapability.getActionAvailabilityState`, kanonik onay-auth arayüzüdür.
- Aynı sohbet onay auth kullanılabilirliği için `approvalCapability.getActionAvailabilityState` kullanın.
- Kanalınız native exec onaylarını açığa çıkarıyorsa, başlatan yüzey/native istemci durumu aynı sohbet onay auth'tan farklı olduğunda `approvalCapability.getExecInitiatingSurfaceState` kullanın. Çekirdek bu exec'e özgü hook'u `enabled` ile `disabled` durumlarını ayırt etmek, başlatan kanalın native exec onaylarını destekleyip desteklemediğine karar vermek ve kanalı native istemci geri dönüş rehberliğine dahil etmek için kullanır. `createApproverRestrictedNativeApprovalCapability(...)` yaygın durum için bunu doldurur.
- Yinelenen yerel onay istemlerini gizleme veya teslimattan önce yazıyor göstergeleri gönderme gibi kanala özgü payload yaşam döngüsü davranışları için `outbound.shouldSuppressLocalPayloadPrompt` veya `outbound.beforeDeliverPayload` kullanın.
- `approvalCapability.delivery` yalnızca native onay yönlendirmesi veya geri dönüş bastırma için kullanın.
- Kanalın sahip olduğu native onay bilgileri için `approvalCapability.nativeRuntime` kullanın. Bunu sıcak kanal giriş noktalarında `createLazyChannelApprovalNativeRuntimeAdapter(...)` ile tembel tutun; bu, çekirdeğin onay yaşam döngüsünü bir araya getirmesine yine de izin verirken runtime modülünüzü gerektiğinde import edebilir.
- `approvalCapability.render` yalnızca bir kanal paylaşılan renderer yerine gerçekten özel onay payload'larına ihtiyaç duyduğunda kullanın.
- Kanal, devre dışı yol yanıtının native exec onaylarını etkinleştirmek için gereken tam config düğmelerini açıklamasını istediğinde `approvalCapability.describeExecApprovalSetup` kullanın. Hook `{ channel, channelLabel, accountId }` alır; adlandırılmış hesap kanalları üst düzey varsayılanlar yerine `channels.<channel>.accounts.<id>.execApprovals.*` gibi hesap kapsamlı yolları render etmelidir.
- Bir kanal mevcut config'ten kararlı sahip benzeri DM kimlikleri çıkarabiliyorsa, onaya özgü çekirdek mantığı eklemeden aynı sohbet `/approve` kısıtlaması için `openclaw/plugin-sdk/approval-runtime` içinden `createResolvedApproverActionAuthAdapter` kullanın.
- Bir kanal native onay teslimatına ihtiyaç duyuyorsa, kanal kodunu hedef normalizasyonu ile taşıma/sunum bilgilerine odaklı tutun. `openclaw/plugin-sdk/approval-runtime` içinden `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` ve `createApproverRestrictedNativeApprovalCapability` kullanın. Kanala özgü bilgileri, ideal olarak `createChannelApprovalNativeRuntimeAdapter(...)` veya `createLazyChannelApprovalNativeRuntimeAdapter(...)` aracılığıyla `approvalCapability.nativeRuntime` arkasına koyun; böylece çekirdek handler'ı bir araya getirip istek filtreleme, yönlendirme, dedupe, süre dolumu, Gateway aboneliği ve başka yere yönlendirildi bildirimlerini sahiplenebilir. `nativeRuntime` birkaç daha küçük arayüze bölünmüştür:
- `createChannelNativeOriginTargetResolver`, `{ to, accountId, threadId }` hedefleri için varsayılan olarak paylaşılan kanal-route eşleştiricisini kullanır. `targetsMatch` parametresini yalnızca kanalın Slack timestamp öneki eşleştirme gibi sağlayıcıya özgü eşdeğerlik kuralları olduğunda geçirin.
- Kanal, teslimat için özgün hedefi korurken varsayılan route eşleştiricisi veya özel bir `targetsMatch` callback'i çalışmadan önce sağlayıcı id'lerini kanonik hale getirmeye ihtiyaç duyduğunda `createChannelNativeOriginTargetResolver` öğesine `normalizeTargetForMatch` geçirin. `normalizeTarget` öğesini yalnızca çözümlenen teslimat hedefinin kendisi kanonik hale getirilmeliyse kullanın.
- `availability` - hesabın yapılandırılıp yapılandırılmadığı ve bir isteğin işlenip işlenmemesi gerektiği
- `presentation` - paylaşılan onay view model'ini bekleyen/çözümlenen/süresi dolan native payload'lara veya son eylemlere eşler
- `transport` - hedefleri hazırlar ve native onay mesajlarını gönderir/günceller/siler
- `interactions` - native düğmeler veya tepkiler için isteğe bağlı bind/unbind/clear-action hook'ları
- `observe` - isteğe bağlı teslimat tanılama hook'ları
- Kanal client, token, Bolt app veya Webhook alıcısı gibi runtime'ın sahip olduğu nesnelere ihtiyaç duyuyorsa, bunları `openclaw/plugin-sdk/channel-runtime-context` üzerinden kaydedin. Genel runtime-context registry, çekirdeğin onaya özgü wrapper glue eklemeden kanal başlatma durumundan capability odaklı handler'ları bootstrap etmesine olanak tanır.
- Daha düşük seviyeli `createChannelApprovalHandler` veya `createChannelNativeApprovalRuntime` öğelerine yalnızca capability odaklı arayüz henüz yeterince ifade gücüne sahip olmadığında başvurun.
- Native onay kanalları hem `accountId` hem de `approvalKind` değerlerini bu yardımcılar üzerinden yönlendirmelidir. `accountId`, çok hesaplı onay politikasını doğru bot hesabına kapsamlı tutar; `approvalKind` ise çekirdekte sabit kodlu dallar olmadan exec ve Plugin onay davranışını kanal için kullanılabilir tutar.
- Çekirdek artık onay yeniden yönlendirme bildirimlerini de sahiplenir. Kanal Plugin'leri `createChannelNativeApprovalRuntime` içinden kendi "onay DM'lere / başka bir kanala gitti" takip mesajlarını göndermemelidir; bunun yerine paylaşılan onay capability yardımcıları üzerinden doğru origin + approver-DM yönlendirmesini açığa çıkarın ve başlatan sohbete herhangi bir bildirim göndermeden önce çekirdeğin gerçek teslimatları toplamasına izin verin.
- Teslim edilen onay id türünü uçtan uca koruyun. Native istemciler kanal-yerel durumdan exec ile Plugin onay yönlendirmesini tahmin etmemeli veya yeniden yazmamalıdır.
- Farklı onay türleri kasıtlı olarak farklı native yüzeyler açığa çıkarabilir.
  Güncel paketlenmiş örnekler:
  - Slack, native onay yönlendirmesini hem exec hem de Plugin id'leri için kullanılabilir tutar.
  - Matrix, auth'un onay türüne göre farklılaşmasına yine de izin verirken exec ve Plugin onayları için aynı native DM/kanal yönlendirmesini ve tepki UX'ini tutar.
- `createApproverRestrictedNativeApprovalAdapter` hâlâ uyumluluk wrapper'ı olarak vardır, ancak yeni kod capability builder'ı tercih etmeli ve Plugin üzerinde `approvalCapability` açığa çıkarmalıdır.

Sıcak kanal giriş noktaları için, o ailenin yalnızca bir bölümüne ihtiyaç duyduğunuzda daha dar runtime alt yollarını tercih edin:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Benzer şekilde, daha geniş şemsiye yüzeye ihtiyaç duymadığınızda
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` ve
`openclaw/plugin-sdk/reply-chunking` tercih edin.

Özellikle setup için:

- `openclaw/plugin-sdk/setup-runtime`, runtime açısından güvenli setup yardımcılarını kapsar:
  import açısından güvenli setup patch adapter'ları (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), lookup-note çıktısı,
  `promptResolvedAllowFrom`, `splitSetupEntries` ve devredilmiş
  setup-proxy builder'ları
- `openclaw/plugin-sdk/setup-runtime`, `createEnvPatchedAccountSetupAdapter` için env-aware adapter arayüzünü içerir
- `openclaw/plugin-sdk/channel-setup`, optional-install setup
  builder'larını ve birkaç setup açısından güvenli primitive'i kapsar:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Kanalınız env odaklı setup veya auth destekliyorsa ve genel startup/config
akışlarının runtime yüklenmeden önce bu env adlarını bilmesi gerekiyorsa, bunları
Plugin manifest'inde `channelEnvVars` ile bildirin. Kanal runtime `envVars` veya yerel
sabitlerini yalnızca operatöre dönük metinler için tutun.

Kanalınız Plugin runtime başlamadan önce `status`, `channels list`, `channels status` veya
SecretRef taramalarında görünebiliyorsa, `package.json` içine `openclaw.setupEntry` ekleyin.
Bu giriş noktası salt okunur komut yollarında import edilmeye güvenli olmalı ve bu özetler
için gereken kanal metadata'sını, setup açısından güvenli config adapter'ını, status
adapter'ını ve kanal secret hedef metadata'sını döndürmelidir. Setup girişinden client,
listener veya transport runtime başlatmayın.

Ana kanal giriş import yolunu da dar tutun. Discovery, kanalı etkinleştirmeden
capability'leri kaydetmek için entry'yi ve kanal Plugin modülünü değerlendirebilir.
`channel-plugin-api.ts` gibi dosyalar setup wizard'larını, transport client'larını, socket
listener'larını, subprocess başlatıcılarını veya service startup modüllerini import etmeden
kanal Plugin nesnesini export etmelidir. Bu runtime parçalarını `registerFull(...)`,
runtime setter'ları veya tembel capability adapter'larından yüklenen modüllere koyun.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` ve
`splitSetupEntries`

- daha geniş `openclaw/plugin-sdk/setup` arayüzünü yalnızca
  `moveSingleAccountChannelSectionToDefaultAccount(...)` gibi daha ağır paylaşılan
  setup/config yardımcılarına da ihtiyaç duyduğunuzda kullanın

Kanalınız setup yüzeylerinde yalnızca "önce bu Plugin'i kur" duyurusu yapmak istiyorsa,
`createOptionalChannelSetupSurface(...)` tercih edin. Üretilen adapter/wizard, config
yazmaları ve sonlandırma konusunda kapalı şekilde başarısız olur ve validation,
finalize ve docs-link metinlerinde aynı kurulum-gerekli mesajını yeniden kullanır.

Diğer sıcak kanal yolları için, daha geniş eski yüzeyler yerine dar yardımcıları tercih edin:

- çok hesaplı config ve varsayılan hesap geri dönüşü için
  `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` ve
  `openclaw/plugin-sdk/account-helpers`
- inbound route/envelope ve record-and-dispatch bağlantıları için
  `openclaw/plugin-sdk/inbound-envelope` ve
  `openclaw/plugin-sdk/inbound-reply-dispatch`
- hedef ayrıştırma/eşleştirme için `openclaw/plugin-sdk/messaging-targets`
- medya yükleme ile outbound kimlik/send delegate'leri ve payload planlama için
  `openclaw/plugin-sdk/outbound-media` ve
  `openclaw/plugin-sdk/outbound-runtime`
- outbound route açık bir `replyToId`/`threadId` değerini korumalıysa veya temel session key
  hâlâ eşleştiğinde mevcut `:thread:` session'ını geri kazanmalıysa
  `openclaw/plugin-sdk/channel-core` içinden `buildThreadAwareOutboundSessionRoute(...)`.
  Sağlayıcı Plugin'leri, platformlarında native thread teslim semantikleri olduğunda
  önceliği, sonek davranışını ve thread id normalizasyonunu geçersiz kılabilir.
- thread-binding yaşam döngüsü ve adapter kaydı için `openclaw/plugin-sdk/thread-bindings-runtime`
- yalnızca eski agent/media payload alan yerleşimi hâlâ gerekliyse `openclaw/plugin-sdk/agent-media-payload`
- Telegram özel komut normalizasyonu, yinelenen/çakışan doğrulama ve geri dönüşte kararlı komut
  config sözleşmesi için `openclaw/plugin-sdk/telegram-command-config`

Yalnızca auth kanalları genellikle varsayılan yolda durabilir: çekirdek onayları işler ve Plugin yalnızca outbound/auth capability'lerini açığa çıkarır. Matrix, Slack, Telegram ve özel chat transport'ları gibi native onay kanalları kendi onay yaşam döngülerini yazmak yerine paylaşılan native yardımcıları kullanmalıdır.

## Inbound mention policy

Inbound mention işlemeyi iki katmana bölünmüş tutun:

- Plugin'in sahip olduğu kanıt toplama
- paylaşılan policy değerlendirmesi

Mention-policy kararları için `openclaw/plugin-sdk/channel-mention-gating` kullanın.
Daha geniş inbound yardımcı barrel'ına ihtiyaç duyduğunuzda yalnızca
`openclaw/plugin-sdk/channel-inbound` kullanın.

Plugin-yerel mantık için uygun olanlar:

- reply-to-bot algılama
- quoted-bot algılama
- thread-participation kontrolleri
- service/system-message hariç tutmaları
- bot katılımını kanıtlamak için gereken platform-native cache'ler

Paylaşılan yardımcı için uygun olan:

- `requireMention`
- açık mention sonucu
- örtük mention izin listesi
- komut baypası
- son atlama kararı

Tercih edilen akış:

1. Yerel mention bilgilerini hesaplayın.
2. Bu bilgileri `resolveInboundMentionDecision({ facts, policy })` içine geçirin.
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
paketli kanal Plugin'leri için aynı paylaşılan mention yardımcılarını sunar:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Yalnızca `implicitMentionKindWhen` ve
`resolveInboundMentionDecision` gerekiyorsa, ilgisiz gelen çalışma zamanı
yardımcılarını yüklemekten kaçınmak için
`openclaw/plugin-sdk/channel-mention-gating` üzerinden içe aktarın.

Eski `resolveMentionGating*` yardımcıları, yalnızca uyumluluk dışa aktarımları
olarak `openclaw/plugin-sdk/channel-inbound` üzerinde kalır. Yeni kod
`resolveInboundMentionDecision({ facts, policy })` kullanmalıdır.

## Adım Adım Açıklama

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    Standart Plugin dosyalarını oluşturun. `package.json` içindeki `channel` alanı,
    bunu bir kanal Plugin'i yapan şeydir. Tam paket meta verisi yüzeyi için
    [Plugin Kurulumu ve Yapılandırma](/tr/plugins/sdk-setup#openclaw-channel) bölümüne bakın:

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

    `configSchema`, `plugins.entries.acme-chat.config` değerini doğrular. Bunu,
    kanal hesabı yapılandırması olmayan Plugin'e ait ayarlar için kullanın. `channelConfigs`,
    `channels.acme-chat` değerini doğrular ve Plugin çalışma zamanı yüklenmeden önce
    yapılandırma şeması, kurulum ve kullanıcı arayüzü yüzeyleri tarafından kullanılan
    soğuk yol kaynağıdır.

  </Step>

  <Step title="Build the channel plugin object">
    `ChannelPlugin` arayüzünün birçok isteğe bağlı bağdaştırıcı yüzeyi vardır.
    En azıyla, yani `id` ve `setup` ile başlayın ve ihtiyaç duydukça bağdaştırıcı ekleyin.

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

    Hem standart üst düzey DM anahtarlarını hem de eski iç içe anahtarları kabul eden kanallar için `plugin-sdk/channel-config-helpers` yardımcılarını kullanın: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` ve `normalizeChannelDmPolicy`, hesaba yerel değerleri devralınan kök değerlerin önünde tutar. Aynı çözümleyiciyi `normalizeLegacyDmAliases` üzerinden doctor onarımıyla eşleyin; böylece çalışma zamanı ve geçiş aynı sözleşmeyi okur.

    <Accordion title="What createChatChannelPlugin does for you">
      Düşük düzeyli bağdaştırıcı arayüzlerini elle uygulamak yerine,
      bildirime dayalı seçenekler geçirirsiniz ve oluşturucu bunları birleştirir:

      | Seçenek | Bağladığı şey |
      | --- | --- |
      | `security.dm` | Yapılandırma alanlarından kapsamlı DM güvenlik çözümleyicisi |
      | `pairing.text` | Kod alışverişiyle metin tabanlı DM eşleştirme akışı |
      | `threading` | Yanıt modu çözümleyicisi (sabit, hesap kapsamlı veya özel) |
      | `outbound.attachedResults` | Sonuç meta verisi (ileti kimlikleri) döndüren gönderme işlevleri |

      Tam denetim gerekiyorsa bildirime dayalı seçenekler yerine ham bağdaştırıcı
      nesneleri de geçirebilirsiniz.

      Ham giden bağdaştırıcılar bir `chunker(text, limit, ctx)` işlevi tanımlayabilir.
      İsteğe bağlı `ctx.formatting`, `maxLinesPerMessage` gibi teslim zamanındaki
      biçimlendirme kararlarını taşır; bunu göndermeden önce uygulayın ki yanıt dizileme
      ve parça sınırları paylaşılan giden teslim tarafından bir kez çözümlensin.
      Gönderme bağlamları, yerel bir yanıt hedefi çözüldüğünde `replyToIdSource`
      (`implicit` veya `explicit`) değerini de içerir; böylece yük yardımcıları, örtük
      tek kullanımlık yanıt yuvasını tüketmeden açık yanıt etiketlerini koruyabilir.
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

    Kanalın sahip olduğu CLI tanımlayıcılarını `registerCliMetadata(...)` içine koyun;
    böylece OpenClaw, tam kanal çalışma zamanını etkinleştirmeden bunları kök yardımda
    gösterebilir; normal tam yüklemeler ise gerçek komut kaydı için aynı tanımlayıcıları
    almaya devam eder. `registerFull(...)` değerini yalnızca çalışma zamanı işlerine ayırın.
    `registerFull(...)` Gateway RPC yöntemleri kaydediyorsa Plugin'e özel bir önek kullanın.
    Çekirdek yönetici ad alanları (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`)
    ayrılmış kalır ve her zaman `operator.admin` değerine çözümlenir.
    `defineChannelPluginEntry`, kayıt modu ayrımını otomatik olarak işler. Tüm seçenekler için
    [Giriş Noktaları](/tr/plugins/sdk-entrypoints#definechannelpluginentry) bölümüne bakın.

  </Step>

  <Step title="Add a setup entry">
    İlk katılım sırasında hafif yükleme için `setup-entry.ts` oluşturun:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw, kanal devre dışıysa veya yapılandırılmamışsa tam giriş yerine bunu yükler.
    Bu, kurulum akışları sırasında ağır çalışma zamanı kodunu çekmekten kaçınır.
    Ayrıntılar için [Kurulum ve Yapılandırma](/tr/plugins/sdk-setup#setup-entry) bölümüne bakın.

    Kurulum açısından güvenli dışa aktarımları yardımcı modüllere ayıran paketli çalışma
    alanı kanalları, açık bir kurulum zamanı çalışma zamanı ayarlayıcısına da ihtiyaç
    duyduklarında `openclaw/plugin-sdk/channel-entry-contract` içindeki
    `defineBundledChannelSetupEntry(...)` değerini kullanabilir.

  </Step>

  <Step title="Handle inbound messages">
    Plugin'inizin platformdan iletileri alması ve bunları OpenClaw'a iletmesi gerekir.
    Tipik kalıp, isteği doğrulayan ve kanalınızın gelen işleyicisi üzerinden dağıtan
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
      Gelen ileti işleme kanala özgüdür. Her kanal Plugin'i kendi gelen
      işlem hattına sahiptir. Gerçek kalıplar için paketlenmiş kanal Plugin'lerine
      (örneğin Microsoft Teams veya Google Chat Plugin paketi) bakın.
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

    Paylaşılan test yardımcıları için bkz. [Test Etme](/tr/plugins/sdk-testing).

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
  <Card title="Threading seçenekleri" icon="git-branch" href="/tr/plugins/sdk-entrypoints#registration-mode">
    Sabit, hesap kapsamlı veya özel yanıt modları
  </Card>
  <Card title="İleti aracı entegrasyonu" icon="puzzle" href="/tr/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool ve eylem keşfi
  </Card>
  <Card title="Hedef çözümleme" icon="crosshair" href="/tr/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Çalışma zamanı yardımcıları" icon="settings" href="/tr/plugins/sdk-runtime">
    api.runtime üzerinden TTS, STT, medya, alt aracı
  </Card>
  <Card title="Kanal turu çekirdeği" icon="bolt" href="/tr/plugins/sdk-channel-turn">
    Paylaşılan gelen tur yaşam döngüsü: alma, çözümleme, kaydetme, gönderme, tamamlama
  </Card>
</CardGroup>

<Note>
Bazı paketlenmiş yardımcı sınırlar, paketlenmiş Plugin bakımı ve
uyumluluğu için hâlâ vardır. Bunlar yeni kanal Plugin'leri için önerilen kalıp değildir;
söz konusu paketlenmiş Plugin ailesini doğrudan sürdürmüyorsanız ortak SDK
yüzeyinden genel kanal/kurulum/yanıt/çalışma zamanı alt yollarını tercih edin.
</Note>

## Sonraki adımlar

- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) - Plugin'iniz modeller de sağlıyorsa
- [SDK Genel Bakış](/tr/plugins/sdk-overview) - tam alt yol içe aktarma referansı
- [SDK Test Etme](/tr/plugins/sdk-testing) - test yardımcı programları ve sözleşme testleri
- [Plugin Manifesti](/tr/plugins/manifest) - tam manifest şeması

## İlgili

- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Aracı harness Plugin'leri](/tr/plugins/sdk-agent-harness)

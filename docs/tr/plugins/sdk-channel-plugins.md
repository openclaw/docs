---
read_when:
    - Yeni bir mesajlaşma kanalı Plugin'i geliştiriyorsunuz
    - OpenClaw'u bir mesajlaşma platformuna bağlamak istiyorsunuz
    - ChannelPlugin bağdaştırıcı yüzeyini anlamanız gerekir
sidebarTitle: Channel Plugins
summary: OpenClaw için bir mesajlaşma kanalı Plugin'i oluşturmaya yönelik adım adım kılavuz
title: Kanal Plugin'leri oluşturma
x-i18n:
    generated_at: "2026-05-06T09:24:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69fae0587adfca0b704aea96a2a838cd175a09e4532ad3a9527fb3a21905e4f6
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Bu kılavuz, OpenClaw'u bir mesajlaşma platformuna bağlayan bir kanal Plugin'i oluşturmayı adım adım açıklar. Sonunda DM güvenliği, eşleştirme, yanıt iş parçacıkları ve giden mesajlaşma özelliklerine sahip çalışan bir kanalınız olur.

<Info>
  Daha önce hiç OpenClaw Plugin'i oluşturmadıysanız, temel paket
  yapısı ve manifest kurulumu için önce
  [Başlarken](/tr/plugins/building-plugins) bölümünü okuyun.
</Info>

## Kanal Plugin'leri nasıl çalışır?

Kanal Plugin'lerinin kendi send/edit/react araçlarına ihtiyacı yoktur. OpenClaw çekirdekte tek bir paylaşılan `message` aracı tutar. Plugin'iniz şunlardan sorumludur:

- **Yapılandırma** - hesap çözümleme ve kurulum sihirbazı
- **Güvenlik** - DM politikası ve izin listeleri
- **Eşleştirme** - DM onay akışı
- **Oturum dil bilgisi** - sağlayıcıya özgü konuşma kimliklerinin temel sohbetlere, iş parçacığı kimliklerine ve üst öğe yedeklerine nasıl eşlendiği
- **Giden** - platforma metin, medya ve anket gönderme
- **İş parçacıkları** - yanıtların nasıl iş parçacığına alındığı
- **Heartbeat yazıyor göstergesi** - Heartbeat teslim hedefleri için isteğe bağlı yazıyor/meşgul sinyalleri

Çekirdek; paylaşılan mesaj aracını, istem bağlantılarını, dış oturum anahtarı biçimini, genel `:thread:` kayıtlarını ve dağıtımı yönetir.

Yeni kanal Plugin'leri ayrıca `openclaw/plugin-sdk/channel-message` içinden `defineChannelMessageAdapter` ile bir `message` bağdaştırıcısı sunmalıdır. Bağdaştırıcı, yerel aktarımın gerçekten desteklediği kalıcı final gönderim yeteneklerini bildirir ve metin/medya gönderimlerini eski `outbound` bağdaştırıcısıyla aynı aktarım işlevlerine yönlendirir. Bir yeteneği yalnızca bir sözleşme testi yerel yan etkiyi ve dönen alındıyı kanıtladığında bildirin.
Tam API sözleşmesi, örnekler, yetenek matrisi, alındı kuralları, canlı önizleme sonlandırması, alma onayı politikası, testler ve geçiş tablosu için [Kanal mesaj API'si](/tr/plugins/sdk-channel-message) bölümüne bakın.
Mevcut `outbound` bağdaştırıcısı zaten doğru gönderim yöntemlerine ve yetenek meta verilerine sahipse, başka bir köprüyü elle yazmak yerine `message` bağdaştırıcısını türetmek için `createChannelMessageAdapterFromOutbound(...)` kullanın.
Bağdaştırıcı gönderimleri `MessageReceipt` değerleri döndürmelidir. Uyumluluk kodunun hâlâ eski kimliklere ihtiyacı olduğunda, yeni yaşam döngüsü kodunda paralel `messageIds` alanları tutmak yerine bunları `listMessageReceiptPlatformIds(...)` veya `resolveMessageReceiptPrimaryId(...)` ile türetin.
Önizleme destekleyen kanallar ayrıca `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming` veya `quietFinalization` gibi sahip oldukları tam canlı yaşam döngüsüyle `message.live.capabilities` bildirmelidir. Taslak önizlemeyi yerinde sonlandıran kanallar ayrıca `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt` ve `retainOnAmbiguousFailure` gibi `message.live.finalizer.capabilities` bildirmeli ve çalışma zamanı mantığını `defineFinalizableLivePreviewAdapter(...)` ile `deliverWithFinalizableLivePreviewAdapter(...)` üzerinden yönlendirmelidir. Bu yetenekleri `verifyChannelMessageLiveCapabilityAdapterProofs(...)` ve `verifyChannelMessageLiveFinalizerProofs(...)` testleriyle destekleyin; böylece yerel önizleme, ilerleme, düzenleme, yedek/tutma, temizleme ve alındı davranışı sessizce sapamaz.
Platform onaylarını erteleyen gelen alıcılar, onay zamanlamasını izleyiciye yerel durumda gizlemek yerine `message.receive.defaultAckPolicy` ve `supportedAckPolicies` bildirmelidir. Bildirilen her politikayı `verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` ile kapsayın.

`createChannelTurnReplyPipeline`, `dispatchInboundReplyWithBase` ve `recordInboundSessionAndDispatchReply` gibi eski yanıt/tur yardımcıları uyumluluk dağıtıcıları için kullanılabilir durumda kalır. Yeni kanal kodu için bu adları kullanmayın; yeni Plugin'ler `openclaw/plugin-sdk/channel-message` üzerindeki `message` bağdaştırıcısı, alındılar ve alma/gönderme yaşam döngüsü yardımcılarıyla başlamalıdır.

Kanalınız gelen yanıtların dışında yazıyor göstergelerini destekliyorsa, kanal Plugin'inde `heartbeat.sendTyping(...)` sunun. Çekirdek bunu Heartbeat model çalışması başlamadan önce çözümlenen Heartbeat teslim hedefiyle çağırır ve paylaşılan yazıyor göstergesi keepalive/temizleme yaşam döngüsünü kullanır. Platform açık bir durdurma sinyaline ihtiyaç duyuyorsa `heartbeat.clearTyping(...)` ekleyin.

Kanalınız medya kaynakları taşıyan mesaj aracı parametreleri ekliyorsa, bu parametre adlarını `describeMessageTool(...).mediaSourceParams` üzerinden sunun. Çekirdek bu açık listeyi sandbox yol normalleştirmesi ve giden medya erişim politikası için kullanır; böylece Plugin'ler sağlayıcıya özgü avatar, ek veya kapak görseli parametreleri için paylaşılan çekirdekte özel durumlara ihtiyaç duymaz.
İlgisiz eylemlerin başka bir eylemin medya argümanlarını devralmaması için `{ "set-profile": ["avatarUrl", "avatarPath"] }` gibi eylem anahtarlı bir harita döndürmeyi tercih edin. Düz dizi, kasıtlı olarak açığa çıkarılan her eylemde paylaşılan parametreler için hâlâ çalışır.

Kanalınız `message(action="send")` için sağlayıcıya özgü biçimlendirme gerektiriyorsa, `actions.prepareSendPayload(...)` kullanmayı tercih edin. Yerel kartları, blokları, embed'leri veya diğer kalıcı verileri `payload.channelData.<channel>` altına koyun ve gerçek gönderimi çekirdeğin outbound/message bağdaştırıcısı üzerinden yapmasına izin verin. `actions.handleAction(...)` işlevini gönderim için yalnızca serileştirilemeyen ve yeniden denenemeyen yüklerde uyumluluk yedeği olarak kullanın.

Platformunuz konuşma kimlikleri içinde ek kapsam depoluyorsa, bu ayrıştırmayı Plugin içinde `messaging.resolveSessionConversation(...)` ile tutun. Bu, `rawId` değerini temel konuşma kimliğine, isteğe bağlı iş parçacığı kimliğine, açık `baseConversationId` değerine ve tüm `parentConversationCandidates` değerlerine eşlemek için kanonik kancadır.
`parentConversationCandidates` döndürdüğünüzde, bunları en dar üst öğeden en geniş/temel konuşmaya doğru sıralı tutun.

Plugin kodunun rota benzeri alanları normalleştirmesi, alt iş parçacığını üst rotasıyla karşılaştırması veya `{ channel, to, accountId, threadId }` değerinden kararlı bir tekilleştirme anahtarı oluşturması gerektiğinde `openclaw/plugin-sdk/channel-route` kullanın. Yardımcı, sayısal iş parçacığı kimliklerini çekirdekle aynı şekilde normalleştirir; bu nedenle Plugin'ler geçici `String(threadId)` karşılaştırmaları yerine bunu tercih etmelidir.
Sağlayıcıya özgü hedef dil bilgisine sahip Plugin'ler ayrıştırıcılarını `resolveChannelRouteTargetWithParser(...)` içine enjekte edebilir ve yine çekirdeğin kullandığı aynı rota hedef biçimini ve iş parçacığı yedek semantiklerini elde edebilir.

Kanal kayıt defteri başlamadan önce aynı ayrıştırmaya ihtiyaç duyan birlikte gelen Plugin'ler, eşleşen bir `resolveSessionConversation(...)` dışa aktarımıyla üst düzey bir `session-key-api.ts` dosyası da sunabilir. Çekirdek bu önyükleme açısından güvenli yüzeyi yalnızca çalışma zamanı Plugin kayıt defteri henüz kullanılabilir olmadığında kullanır.

`messaging.resolveParentConversationCandidates(...)`, bir Plugin'in genel/ham kimliğin üstünde yalnızca üst öğe yedeklerine ihtiyaç duyduğu durumlarda eski uyumluluk yedeği olarak kullanılabilir durumda kalır. Her iki kanca da varsa çekirdek önce `resolveSessionConversation(...).parentConversationCandidates` değerini kullanır ve yalnızca kanonik kanca bunları atladığında `resolveParentConversationCandidates(...)` yedeğine döner.

## Onaylar ve kanal yetenekleri

Çoğu kanal Plugin'i onaya özgü koda ihtiyaç duymaz.

- Çekirdek, aynı sohbet `/approve` komutuna, paylaşılan onay düğmesi yüklerine ve genel yedek teslimata sahip olur.
- Kanal onaya özgü davranış gerektirdiğinde kanal Plugin'inde tek bir `approvalCapability` nesnesini tercih edin.
- `ChannelPlugin.approvals` kaldırıldı. Onay teslimatı/native/render/auth bilgilerini `approvalCapability` üzerine koyun.
- `plugin.auth` yalnızca oturum açma/oturumu kapatmadır; çekirdek artık onay auth kancalarını bu nesneden okumaz.
- `approvalCapability.authorizeActorAction` ve `approvalCapability.getActionAvailabilityState`, standart onay-auth sınırıdır.
- Aynı sohbet onay auth kullanılabilirliği için `approvalCapability.getActionAvailabilityState` kullanın.
- Kanalınız native exec onayları sunuyorsa, başlatan yüzey/native-client durumu aynı sohbet onay auth durumundan farklı olduğunda bunun için `approvalCapability.getExecInitiatingSurfaceState` kullanın. Çekirdek, `enabled` ile `disabled` arasında ayrım yapmak, başlatan kanalın native exec onaylarını destekleyip desteklemediğine karar vermek ve kanalı native-client yedek rehberliğine dahil etmek için exec'e özgü bu kancayı kullanır. `createApproverRestrictedNativeApprovalCapability(...)` yaygın durum için bunu doldurur.
- Yinelenen yerel onay istemlerini gizleme veya teslimattan önce yazıyor göstergeleri gönderme gibi kanala özgü yük yaşam döngüsü davranışları için `outbound.shouldSuppressLocalPayloadPrompt` veya `outbound.beforeDeliverPayload` kullanın.
- `approvalCapability.delivery` öğesini yalnızca native onay yönlendirmesi veya yedek bastırma için kullanın.
- Kanalın sahip olduğu native onay bilgileri için `approvalCapability.nativeRuntime` kullanın. Bunu, çekirdeğin onay yaşam döngüsünü birleştirmesine yine de izin verirken runtime modülünüzü gerektiğinde içe aktarabilen `createLazyChannelApprovalNativeRuntimeAdapter(...)` ile sıcak kanal giriş noktalarında lazy tutun.
- `approvalCapability.render` öğesini yalnızca bir kanal paylaşılan renderer yerine gerçekten özel onay yüklerine ihtiyaç duyduğunda kullanın.
- Kanal, devre dışı yol yanıtının native exec onaylarını etkinleştirmek için gereken tam yapılandırma düğmelerini açıklamasını istediğinde `approvalCapability.describeExecApprovalSetup` kullanın. Kanca `{ channel, channelLabel, accountId }` alır; adlandırılmış hesap kanalları, üst düzey varsayılanlar yerine `channels.<channel>.accounts.<id>.execApprovals.*` gibi hesap kapsamlı yollar render etmelidir.
- Bir kanal mevcut yapılandırmadan kararlı owner benzeri DM kimlikleri çıkarabiliyorsa, onaya özgü çekirdek mantığı eklemeden aynı sohbet `/approve` komutunu kısıtlamak için `openclaw/plugin-sdk/approval-runtime` içindeki `createResolvedApproverActionAuthAdapter` öğesini kullanın.
- Bir kanal native onay teslimatına ihtiyaç duyuyorsa, kanal kodunu hedef normalleştirme ve taşıma/sunum bilgilerine odaklı tutun. `openclaw/plugin-sdk/approval-runtime` içinden `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` ve `createApproverRestrictedNativeApprovalCapability` kullanın. Kanala özgü bilgileri, ideal olarak `createChannelApprovalNativeRuntimeAdapter(...)` veya `createLazyChannelApprovalNativeRuntimeAdapter(...)` aracılığıyla `approvalCapability.nativeRuntime` arkasına koyun; böylece çekirdek handler'ı birleştirip istek filtrelemeye, yönlendirmeye, tekilleştirmeye, süre dolumuna, gateway aboneliğine ve başka yere yönlendirildi bildirimlerine sahip olabilir. `nativeRuntime` birkaç daha küçük sınıra ayrılır:
- `createChannelNativeOriginTargetResolver`, `{ to, accountId, threadId }` hedefleri için varsayılan olarak paylaşılan kanal-route eşleştiricisini kullanır. Yalnızca bir kanalın Slack zaman damgası öneki eşleştirme gibi sağlayıcıya özgü eşdeğerlik kuralları olduğunda `targetsMatch` geçirin.
- Kanalın, varsayılan route eşleştiricisi veya özel bir `targetsMatch` callback'i çalışmadan önce sağlayıcı id'lerini standartlaştırması, ancak teslimat için özgün hedefi koruması gerektiğinde `createChannelNativeOriginTargetResolver` öğesine `normalizeTargetForMatch` geçirin. `normalizeTarget` öğesini yalnızca çözümlenmiş teslimat hedefinin kendisi standartlaştırılmalıysa kullanın.
- `availability` - hesabın yapılandırılıp yapılandırılmadığı ve bir isteğin işlenip işlenmeyeceği
- `presentation` - paylaşılan onay görünüm modelini bekleyen/çözümlenmiş/süresi dolmuş native yüklere veya son eylemlere eşleyin
- `transport` - hedefleri hazırlayın ve native onay mesajlarını gönderin/güncelleyin/silin
- `interactions` - native düğmeler veya tepkiler için isteğe bağlı bind/unbind/clear-action kancaları
- `observe` - isteğe bağlı teslimat tanılama kancaları
- Kanal, client, token, Bolt app veya webhook receiver gibi runtime'a ait nesnelere ihtiyaç duyuyorsa bunları `openclaw/plugin-sdk/channel-runtime-context` üzerinden kaydedin. Genel runtime-context registry, çekirdeğin onaya özgü wrapper glue eklemeden kanal başlangıç durumundan capability odaklı handler'ları başlatmasına izin verir.
- Daha düşük seviyeli `createChannelApprovalHandler` veya `createChannelNativeApprovalRuntime` öğelerine yalnızca capability odaklı sınır henüz yeterince ifade gücüne sahip olmadığında başvurun.
- Native onay kanalları hem `accountId` hem de `approvalKind` değerlerini bu yardımcılar üzerinden yönlendirmelidir. `accountId`, çok hesaplı onay ilkesini doğru bot hesabı kapsamında tutar ve `approvalKind`, çekirdekte sabit kodlanmış dallar olmadan exec ile Plugin onay davranışını kanal için kullanılabilir tutar.
- Çekirdek artık onay yeniden yönlendirme bildirimlerine de sahip olur. Kanal Plugin'leri `createChannelNativeApprovalRuntime` içinden kendi "onay DM'lere / başka bir kanala gitti" takip mesajlarını göndermemelidir; bunun yerine paylaşılan onay capability yardımcıları üzerinden doğru origin + approver-DM yönlendirmesini sunmalı ve başlatan sohbete herhangi bir bildirim göndermeden önce çekirdeğin gerçek teslimatları toplamasına izin vermelidir.
- Teslim edilen onay id türünü uçtan uca koruyun. Native client'lar, exec ile Plugin onay yönlendirmesini kanal yerel durumundan tahmin etmemeli veya yeniden yazmamalıdır.
- Farklı onay türleri bilinçli olarak farklı native yüzeyler sunabilir. Mevcut paketli örnekler:
  - Slack, native onay yönlendirmesini hem exec hem de Plugin id'leri için kullanılabilir tutar.
  - Matrix, auth'un onay türüne göre farklılaşmasına yine de izin verirken exec ve Plugin onayları için aynı native DM/kanal yönlendirmesini ve tepki UX'ini korur.
- `createApproverRestrictedNativeApprovalAdapter` hâlâ bir uyumluluk wrapper'ı olarak vardır, ancak yeni kod capability builder'ı tercih etmeli ve Plugin üzerinde `approvalCapability` sunmalıdır.

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
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` ve
`openclaw/plugin-sdk/reply-chunking` tercih edin.

Özellikle setup için:

- `openclaw/plugin-sdk/setup-runtime`, runtime açısından güvenli setup yardımcılarını kapsar:
  içe aktarma açısından güvenli setup patch adapter'ları (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), lookup-note çıktısı,
  `promptResolvedAllowFrom`, `splitSetupEntries` ve devredilmiş
  setup-proxy builder'ları
- `openclaw/plugin-sdk/setup-adapter-runtime`, `createEnvPatchedAccountSetupAdapter` için dar env-aware adapter sınırıdır
- `openclaw/plugin-sdk/channel-setup`, optional-install setup
  builder'larını ve birkaç setup açısından güvenli primitive'i kapsar:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Kanalınız env odaklı setup veya auth destekliyorsa ve genel başlangıç/yapılandırma akışlarının runtime yüklenmeden önce bu env adlarını bilmesi gerekiyorsa, bunları Plugin manifest'inde `channelEnvVars` ile bildirin. Kanal runtime `envVars` veya yerel sabitleri yalnızca operatöre yönelik metinler için tutun.

Kanalınız Plugin runtime başlamadan önce `status`, `channels list`, `channels status` veya SecretRef taramalarında görünebiliyorsa, `package.json` içine `openclaw.setupEntry` ekleyin. Bu giriş noktası salt okunur komut yollarında içe aktarılması güvenli olmalı ve bu özetler için gereken kanal metadata'sını, setup açısından güvenli config adapter'ını, status adapter'ını ve kanal secret hedef metadata'sını döndürmelidir. Setup entry'den client, listener veya transport runtime başlatmayın.

Ana kanal entry import yolunu da dar tutun. Discovery, kanalı etkinleştirmeden capability'leri kaydetmek için entry'yi ve kanal Plugin modülünü değerlendirebilir. `channel-plugin-api.ts` gibi dosyalar, setup wizard'larını, transport client'larını, socket listener'larını, subprocess launcher'larını veya service startup modüllerini içe aktarmadan kanal Plugin nesnesini dışa aktarmalıdır. Bu runtime parçalarını `registerFull(...)`, runtime setter'ları veya lazy capability adapter'larından yüklenen modüllere koyun.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` ve
`splitSetupEntries`

- daha geniş `openclaw/plugin-sdk/setup` sınırını yalnızca
  `moveSingleAccountChannelSectionToDefaultAccount(...)` gibi daha ağır paylaşılan setup/config yardımcılarına da ihtiyaç duyduğunuzda kullanın

Kanalınız setup yüzeylerinde yalnızca "önce bu Plugin'i yükleyin" mesajını duyurmak istiyorsa, `createOptionalChannelSetupSurface(...)` tercih edin. Üretilen adapter/wizard, config yazma ve finalization aşamalarında güvenli şekilde kapalı kalır ve validation, finalize ve docs-link metninde aynı kurulum gerekli mesajını yeniden kullanır.

Diğer sıcak kanal yolları için, daha geniş eski yüzeyler yerine dar yardımcıları tercih edin:

- Çok hesaplı config ve varsayılan hesap fallback'i için `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` ve
  `openclaw/plugin-sdk/account-helpers`
- inbound route/envelope ve record-and-dispatch bağlantıları için `openclaw/plugin-sdk/inbound-envelope` ve
  `openclaw/plugin-sdk/inbound-reply-dispatch`
- hedef ayrıştırma/eşleştirme için `openclaw/plugin-sdk/messaging-targets`
- medya yükleme ile outbound identity/send delegate'leri ve yük planlama için `openclaw/plugin-sdk/outbound-media` ve
  `openclaw/plugin-sdk/outbound-runtime`
- Bir outbound route, açık bir `replyToId`/`threadId` değerini korumalı veya temel session key hâlâ eşleştiğinde geçerli `:thread:` session'ını kurtarmalıysa
  `openclaw/plugin-sdk/channel-core` içindeki `buildThreadAwareOutboundSessionRoute(...)`. Provider Plugin'leri, platformlarının native thread teslimat semantiği olduğunda önceliği, suffix davranışını ve thread id normalleştirmesini geçersiz kılabilir.
- thread-binding yaşam döngüsü ve adapter kaydı için `openclaw/plugin-sdk/thread-bindings-runtime`
- yalnızca legacy agent/media yük alanı düzeni hâlâ gerekli olduğunda `openclaw/plugin-sdk/agent-media-payload`
- Telegram özel komut normalleştirme, yinelenen/çakışan doğrulama ve fallback açısından kararlı komut config sözleşmesi için `openclaw/plugin-sdk/telegram-command-config`

Yalnızca auth kullanan kanallar genellikle varsayılan yolda durabilir: çekirdek onayları işler ve Plugin yalnızca outbound/auth capability'leri sunar. Matrix, Slack, Telegram ve özel chat transport'ları gibi native onay kanalları, kendi onay yaşam döngülerini yazmak yerine paylaşılan native yardımcıları kullanmalıdır.

## Inbound mention ilkesi

Inbound mention işlemeyi iki katmana ayrılmış tutun:

- Plugin'e ait kanıt toplama
- paylaşılan ilke değerlendirmesi

Mention-policy kararları için `openclaw/plugin-sdk/channel-mention-gating` kullanın.
Daha geniş inbound helper barrel'a ihtiyaç duyduğunuzda yalnızca `openclaw/plugin-sdk/channel-inbound` kullanın.

Plugin yerel mantığı için iyi uyum:

- reply-to-bot algılama
- quoted-bot algılama
- thread katılımı kontrolleri
- service/system-message hariç tutmaları
- bot katılımını kanıtlamak için gereken platform-native cache'ler

Paylaşılan yardımcı için iyi uyum:

- `requireMention`
- açık bahsetme sonucu
- örtük bahsetme izin listesi
- komut baypası
- son atlama kararı

Tercih edilen akış:

1. Yerel bahsetme olgularını hesaplayın.
2. Bu olguları `resolveInboundMentionDecision({ facts, policy })` içine iletin.
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
paketli kanal Plugin’leri için aynı paylaşılan bahsetme yardımcılarını sunar:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Yalnızca `implicitMentionKindWhen` ve
`resolveInboundMentionDecision` gerekiyorsa, ilgisiz gelen çalışma zamanı
yardımcılarını yüklememek için
`openclaw/plugin-sdk/channel-mention-gating` içinden içe aktarın.

Eski `resolveMentionGating*` yardımcıları,
yalnızca uyumluluk dışa aktarımları olarak
`openclaw/plugin-sdk/channel-inbound` üzerinde kalır. Yeni kod
`resolveInboundMentionDecision({ facts, policy })` kullanmalıdır.

## İzlenecek Yol

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket ve manifest">
    Standart Plugin dosyalarını oluşturun. `package.json` içindeki `channel` alanı,
    bunu bir kanal Plugin’i yapan şeydir. Tam paket meta verisi yüzeyi için
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

    `configSchema`, `plugins.entries.acme-chat.config` değerini doğrular. Bunu,
    kanal hesap yapılandırması olmayan Plugin’e ait ayarlar için kullanın. `channelConfigs`,
    `channels.acme-chat` değerini doğrular ve Plugin çalışma zamanı yüklenmeden önce
    yapılandırma şeması, kurulum ve UI yüzeyleri tarafından kullanılan soğuk yol kaynağıdır.

  </Step>

  <Step title="Kanal Plugin nesnesini oluşturun">
    `ChannelPlugin` arayüzünde birçok isteğe bağlı adaptör yüzeyi vardır. En düşük
    gereksinimle, yani `id` ve `setup` ile başlayın ve gerektikçe adaptörler ekleyin.

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

    Hem kurallı üst düzey DM anahtarlarını hem de eski iç içe anahtarları kabul eden kanallar için `plugin-sdk/channel-config-helpers` içindeki yardımcıları kullanın: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` ve `normalizeChannelDmPolicy`, hesaba yerel değerleri devralınan kök değerlerin önünde tutar. Çalışma zamanı ve geçiş aynı sözleşmeyi okusun diye aynı çözümleyiciyi `normalizeLegacyDmAliases` üzerinden doctor onarımıyla eşleştirin.

    <Accordion title="createChatChannelPlugin sizin için ne yapar">
      Düşük düzeyli adaptör arayüzlerini elle uygulamak yerine, bildirime dayalı
      seçenekler iletirsiniz ve oluşturucu bunları birleştirir:

      | Seçenek | Ne bağlar |
      | --- | --- |
      | `security.dm` | Yapılandırma alanlarından kapsamlı DM güvenlik çözümleyicisi |
      | `pairing.text` | Kod değişimiyle metin tabanlı DM eşleştirme akışı |
      | `threading` | Yanıtlama modu çözümleyicisi (sabit, hesap kapsamlı veya özel) |
      | `outbound.attachedResults` | Sonuç meta verisi (ileti kimlikleri) döndüren gönderme işlevleri |

      Tam denetim gerekiyorsa bildirime dayalı seçenekler yerine ham adaptör
      nesneleri de iletebilirsiniz.

      Ham giden adaptörler bir `chunker(text, limit, ctx)` işlevi tanımlayabilir.
      İsteğe bağlı `ctx.formatting`, `maxLinesPerMessage` gibi teslim zamanlı
      biçimlendirme kararlarını taşır; bunu göndermeden önce uygulayın, böylece
      yanıt iş parçacığı ve parça sınırları paylaşılan giden teslim tarafından
      bir kez çözümlenir. Gönderme bağlamları, yerel bir yanıt hedefi çözümlendiğinde
      `replyToIdSource` (`implicit` veya `explicit`) bilgisini de içerir; böylece
      yük yardımcıları, örtük tek kullanımlık yanıt yuvasını tüketmeden açık yanıt
      etiketlerini koruyabilir.
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

    Kanalın sahip olduğu CLI tanımlayıcılarını `registerCliMetadata(...)` içine koyun;
    böylece OpenClaw, tam kanal çalışma zamanını etkinleştirmeden bunları kök yardımda
    gösterebilir, normal tam yüklemeler ise gerçek komut kaydı için aynı
    tanımlayıcıları almaya devam eder. `registerFull(...)` öğesini yalnızca çalışma
    zamanı işleri için tutun.
    `registerFull(...)` Gateway RPC yöntemleri kaydediyorsa, Plugin’e özgü bir
    önek kullanın. Çekirdek yönetici ad alanları (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış kalır ve her zaman
    `operator.admin` olarak çözümlenir.
    `defineChannelPluginEntry`, kayıt modu ayrımını otomatik olarak işler. Tüm
    seçenekler için [Giriş Noktaları](/tr/plugins/sdk-entrypoints#definechannelpluginentry) bölümüne bakın.

  </Step>

  <Step title="Kurulum girişi ekleyin">
    Onboarding sırasında hafif yükleme için `setup-entry.ts` oluşturun:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    Kanal devre dışı veya yapılandırılmamış olduğunda OpenClaw, tam giriş yerine bunu yükler.
    Kurulum akışları sırasında ağır çalışma zamanı kodunu içeri çekmekten kaçınır.
    Ayrıntılar için [Kurulum ve Yapılandırma](/tr/plugins/sdk-setup#setup-entry) bölümüne bakın.

    Kurulum açısından güvenli dışa aktarımları yan modüllere ayıran paketli çalışma alanı
    kanalları, açık bir kurulum zamanı çalışma zamanı ayarlayıcısına da ihtiyaç duyduklarında
    `openclaw/plugin-sdk/channel-entry-contract` içinden
    `defineBundledChannelSetupEntry(...)` kullanabilir.

  </Step>

  <Step title="Gelen iletileri işleyin">
    Plugin’inizin platformdan iletiler alıp bunları OpenClaw’a iletmesi gerekir.
    Tipik kalıp, isteği doğrulayan ve kanalınızın gelen işleyicisi üzerinden
    dağıtan bir Webhook’tur:

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
      Gelen ileti işleme kanala özeldir. Her kanal Plugin'i kendi
      gelen işlem hattına sahiptir. Gerçek örüntüler için paketlenmiş kanal Plugin'lerine
      (örneğin Microsoft Teams veya Google Chat Plugin paketi) bakın.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
`src/channel.test.ts` içinde aynı konumda testler yazın:

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
  <Card title="Threading options" icon="git-branch" href="/tr/plugins/sdk-entrypoints#registration-mode">
    Sabit, hesap kapsamlı veya özel yanıt modları
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/tr/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool ve eylem keşfi
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/tr/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/tr/plugins/sdk-runtime">
    TTS, STT, medya, api.runtime üzerinden alt aracı
  </Card>
  <Card title="Channel turn kernel" icon="bolt" href="/tr/plugins/sdk-channel-turn">
    Paylaşılan gelen tur yaşam döngüsü: alma, çözümleme, kaydetme, gönderme, sonlandırma
  </Card>
</CardGroup>

<Note>
Bazı paketlenmiş yardımcı geçiş noktaları, paketlenmiş Plugin bakımı ve
uyumluluk için hâlâ mevcuttur. Yeni kanal Plugin'leri için önerilen örüntü bunlar değildir;
ilgili paketlenmiş Plugin ailesini doğrudan sürdürmüyorsanız ortak SDK
yüzeyinden genel kanal/kurulum/yanıt/runtime alt yollarını tercih edin.
</Note>

## Sonraki adımlar

- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) - Plugin'iniz modeller de sağlıyorsa
- [SDK Genel Bakışı](/tr/plugins/sdk-overview) - tam alt yol içe aktarma başvurusu
- [SDK Test Etme](/tr/plugins/sdk-testing) - test yardımcı programları ve sözleşme testleri
- [Plugin Manifest](/tr/plugins/manifest) - tam manifest şeması

## İlgili

- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Aracı harness Plugin'leri](/tr/plugins/sdk-agent-harness)

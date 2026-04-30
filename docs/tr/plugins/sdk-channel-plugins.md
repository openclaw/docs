---
read_when:
    - Yeni bir mesajlaşma kanalı Plugin oluşturuyorsunuz
    - OpenClaw'ı bir mesajlaşma platformuna bağlamak istiyorsunuz
    - ChannelPlugin bağdaştırıcı yüzeyini anlamanız gerekir
sidebarTitle: Channel Plugins
summary: OpenClaw için bir mesajlaşma kanalı Plugin'i oluşturmaya yönelik adım adım kılavuz
title: Kanal Plugin'leri oluşturma
x-i18n:
    generated_at: "2026-04-30T09:36:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 068cd797f7761efa54f4fdeb7cb4aa784ceace959f1af12bc549c16ed2776b72
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Bu kılavuz, OpenClaw'ı bir mesajlaşma platformuna bağlayan bir kanal Plugin'i oluşturmayı adım adım açıklar. Sonunda DM güvenliği, eşleştirme, yanıt iş parçacıkları ve giden mesajlaşma özelliklerine sahip çalışan bir kanalınız olacak.

<Info>
  Daha önce hiç OpenClaw Plugin'i oluşturmadıysanız, temel paket
  yapısı ve manifest kurulumu için önce
  [Başlarken](/tr/plugins/building-plugins) bölümünü okuyun.
</Info>

## Kanal Plugin'leri nasıl çalışır

Kanal Plugin'lerinin kendi gönderme/düzenleme/tepki araçlarına ihtiyacı yoktur. OpenClaw, çekirdekte tek bir paylaşılan `message` aracı tutar. Plugin'inizin sorumlulukları:

- **Yapılandırma** — hesap çözümleme ve kurulum sihirbazı
- **Güvenlik** — DM ilkesi ve izin listeleri
- **Eşleştirme** — DM onay akışı
- **Oturum grameri** — sağlayıcıya özgü konuşma id'lerinin temel sohbetlere, iş parçacığı id'lerine ve üst yedeklere nasıl eşlendiği
- **Giden** — platforma metin, medya ve anket gönderme
- **İş parçacıkları** — yanıtların nasıl iş parçacıklarına bağlandığı
- **Heartbeat yazma durumu** — Heartbeat teslim hedefleri için isteğe bağlı yazıyor/meşgul sinyalleri

Çekirdek; paylaşılan mesaj aracını, istem kablolamasını, dış oturum anahtarı şeklini, genel `:thread:` kayıtlarını ve dağıtımı yönetir.

Kanalınız gelen yanıtlar dışında yazma göstergelerini destekliyorsa, kanal Plugin'inde `heartbeat.sendTyping(...)` öğesini açığa çıkarın. Çekirdek bunu, Heartbeat model çalışması başlamadan önce çözümlenen Heartbeat teslim hedefiyle çağırır ve paylaşılan yazma keepalive/temizleme yaşam döngüsünü kullanır. Platform açık bir durdurma sinyali gerektiriyorsa `heartbeat.clearTyping(...)` ekleyin.

Kanalınız medya kaynakları taşıyan message-tool parametreleri ekliyorsa, bu parametre adlarını `describeMessageTool(...).mediaSourceParams` üzerinden açığa çıkarın. Çekirdek bu açık listeyi sandbox yol normalizasyonu ve giden medya erişim ilkesi için kullanır; böylece Plugin'lerin sağlayıcıya özgü avatar, ek veya kapak görseli parametreleri için paylaşılan çekirdekte özel durumlara ihtiyacı olmaz.
İlgisiz eylemlerin başka bir eylemin medya argümanlarını devralmaması için
`{ "set-profile": ["avatarUrl", "avatarPath"] }` gibi eylem anahtarlı bir harita döndürmeyi tercih edin. Tüm açığa çıkarılan eylemler arasında kasıtlı olarak paylaşılan parametreler için düz bir dizi de çalışır.

Platformunuz konuşma id'leri içinde ek kapsam saklıyorsa, bu ayrıştırmayı Plugin içinde `messaging.resolveSessionConversation(...)` ile tutun. Bu, `rawId` değerini temel konuşma id'sine, isteğe bağlı iş parçacığı id'sine, açık `baseConversationId` değerine ve herhangi bir `parentConversationCandidates` listesine eşlemek için standart hook'tur.
`parentConversationCandidates` döndürdüğünüzde, bunları en dar üstten en geniş/temel konuşmaya doğru sıralı tutun.

Plugin kodunun rota benzeri alanları normalize etmesi, bir alt iş parçacığını üst rotasıyla karşılaştırması veya `{ channel, to, accountId, threadId }` değerinden kararlı bir tekilleştirme anahtarı oluşturması gerektiğinde `openclaw/plugin-sdk/channel-route` kullanın. Yardımcı, sayısal iş parçacığı id'lerini çekirdekle aynı şekilde normalize eder; bu yüzden Plugin'ler ad hoc `String(threadId)` karşılaştırmaları yerine bunu tercih etmelidir.
Sağlayıcıya özgü hedef grameri olan Plugin'ler, ayrıştırıcılarını `resolveChannelRouteTargetWithParser(...)` içine enjekte edebilir ve yine çekirdeğin kullandığı aynı rota hedefi şeklini ve iş parçacığı yedek semantiğini elde edebilir.

Kanal kaydı başlatılmadan önce aynı ayrıştırmaya ihtiyaç duyan yerleşik Plugin'ler, eşleşen bir `resolveSessionConversation(...)` dışa aktarımı içeren üst düzey bir `session-key-api.ts` dosyası da açığa çıkarabilir. Çekirdek, bu önyükleme açısından güvenli yüzeyi yalnızca çalışma zamanı Plugin kaydı henüz kullanılabilir olmadığında kullanır.

`messaging.resolveParentConversationCandidates(...)`, bir Plugin'in yalnızca genel/ham id üstüne üst yedeklere ihtiyacı olduğunda eski uyumluluk yedeği olarak kullanılabilir kalır. Her iki hook da varsa, çekirdek önce `resolveSessionConversation(...).parentConversationCandidates` değerini kullanır ve yalnızca standart hook bunları atladığında `resolveParentConversationCandidates(...)` öğesine geri döner.

## Onaylar ve kanal yetenekleri

Çoğu kanal Plugin'i onaya özgü koda ihtiyaç duymaz.

- Çekirdek aynı sohbet `/approve`, paylaşılan onay düğmesi yükleri ve genel yedek teslimi yönetir.
- Kanal onaya özgü davranışa ihtiyaç duyduğunda kanal Plugin'i üzerinde tek bir `approvalCapability` nesnesi tercih edin.
- `ChannelPlugin.approvals` kaldırıldı. Onay teslimi/yerel/render/auth bilgilerini `approvalCapability` içine koyun.
- `plugin.auth` yalnızca oturum açma/oturum kapatma içindir; çekirdek artık bu nesneden onay auth hook'larını okumaz.
- `approvalCapability.authorizeActorAction` ve `approvalCapability.getActionAvailabilityState` standart onay-auth bağlantı noktasıdır.
- Aynı sohbet onay auth kullanılabilirliği için `approvalCapability.getActionAvailabilityState` kullanın.
- Kanalınız yerel exec onayları açığa çıkarıyorsa, başlatma yüzeyi/yerel istemci durumu aynı sohbet onay auth durumundan farklı olduğunda `approvalCapability.getExecInitiatingSurfaceState` kullanın. Çekirdek bu exec'e özgü hook'u `enabled` ile `disabled` ayrımını yapmak, başlatan kanalın yerel exec onaylarını destekleyip desteklemediğine karar vermek ve kanalı yerel istemci yedek yönlendirmesine dahil etmek için kullanır. `createApproverRestrictedNativeApprovalCapability(...)` yaygın durum için bunu doldurur.
- Yinelenen yerel onay istemlerini gizleme veya teslimden önce yazma göstergeleri gönderme gibi kanala özgü yük yaşam döngüsü davranışları için `outbound.shouldSuppressLocalPayloadPrompt` veya `outbound.beforeDeliverPayload` kullanın.
- `approvalCapability.delivery` öğesini yalnızca yerel onay yönlendirmesi veya yedek bastırma için kullanın.
- Kanalın sahip olduğu yerel onay bilgileri için `approvalCapability.nativeRuntime` kullanın. Bunu, çalışma zamanı modülünüzü gerektiğinde içe aktarabilen ve çekirdeğin onay yaşam döngüsünü birleştirmesine yine de izin veren `createLazyChannelApprovalNativeRuntimeAdapter(...)` ile sıcak kanal giriş noktalarında lazy tutun.
- `approvalCapability.render` öğesini yalnızca bir kanal paylaşılan renderer yerine gerçekten özel onay yüklerine ihtiyaç duyduğunda kullanın.
- Kanal, devre dışı yol yanıtının yerel exec onaylarını etkinleştirmek için gereken tam yapılandırma düğmelerini açıklamasını istediğinde `approvalCapability.describeExecApprovalSetup` kullanın. Hook `{ channel, channelLabel, accountId }` alır; adlandırılmış hesap kanalları, üst düzey varsayılanlar yerine `channels.<channel>.accounts.<id>.execApprovals.*` gibi hesap kapsamlı yollar render etmelidir.
- Bir kanal mevcut yapılandırmadan kararlı sahip benzeri DM kimlikleri çıkarabiliyorsa, onaya özgü çekirdek mantığı eklemeden aynı sohbet `/approve` kullanımını kısıtlamak için `openclaw/plugin-sdk/approval-runtime` içinden `createResolvedApproverActionAuthAdapter` kullanın.
- Bir kanal yerel onay teslimine ihtiyaç duyuyorsa, kanal kodunu hedef normalizasyonu ile taşıma/sunum bilgilerine odaklı tutun. `openclaw/plugin-sdk/approval-runtime` içinden `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` ve `createApproverRestrictedNativeApprovalCapability` kullanın. Kanala özgü bilgileri, ideal olarak `createChannelApprovalNativeRuntimeAdapter(...)` veya `createLazyChannelApprovalNativeRuntimeAdapter(...)` aracılığıyla `approvalCapability.nativeRuntime` arkasına koyun; böylece çekirdek işleyiciyi birleştirebilir ve istek filtreleme, yönlendirme, tekilleştirme, süre sonu, Gateway aboneliği ve başka yere yönlendirildi bildirimlerini yönetebilir. `nativeRuntime` birkaç daha küçük bağlantı noktasına ayrılmıştır:
- `createChannelNativeOriginTargetResolver`, varsayılan olarak `{ to, accountId, threadId }` hedefleri için paylaşılan channel-route eşleştiricisini kullanır. `targetsMatch` değerini yalnızca bir kanalın Slack zaman damgası önek eşleştirmesi gibi sağlayıcıya özgü eşdeğerlik kuralları olduğunda geçirin.
- Kanalın varsayılan rota eşleştiricisi veya özel bir `targetsMatch` geri çağrısı çalışmadan önce sağlayıcı id'lerini standartlaştırması, ancak teslim için özgün hedefi koruması gerektiğinde `createChannelNativeOriginTargetResolver` öğesine `normalizeTargetForMatch` geçirin. `normalizeTarget` öğesini yalnızca çözümlenen teslim hedefinin kendisi standartlaştırılmalıdır durumunda kullanın.
- `availability` — hesabın yapılandırılıp yapılandırılmadığı ve bir isteğin ele alınıp alınmaması gerektiği
- `presentation` — paylaşılan onay görünüm modelini bekleyen/çözümlenmiş/süresi dolmuş yerel yüklere veya son eylemlere eşler
- `transport` — hedefleri hazırlar ve yerel onay mesajlarını gönderir/günceller/siler
- `interactions` — yerel düğmeler veya tepkiler için isteğe bağlı bağlama/bağlantıyı kaldırma/eylemi temizleme hook'ları
- `observe` — isteğe bağlı teslim tanılama hook'ları
- Kanalın istemci, token, Bolt uygulaması veya webhook alıcısı gibi çalışma zamanına ait nesnelere ihtiyacı varsa bunları `openclaw/plugin-sdk/channel-runtime-context` üzerinden kaydedin. Genel çalışma zamanı bağlam kaydı, çekirdeğin onaya özgü sarmalayıcı tutkal eklemeden kanal başlatma durumundan yetenek odaklı işleyicileri önyüklemesine izin verir.
- Daha düşük seviyeli `createChannelApprovalHandler` veya `createChannelNativeApprovalRuntime` öğelerine yalnızca yetenek odaklı bağlantı noktası henüz yeterince ifade gücü sunmadığında başvurun.
- Yerel onay kanalları hem `accountId` hem de `approvalKind` değerlerini bu yardımcılar üzerinden yönlendirmelidir. `accountId`, çok hesaplı onay ilkesini doğru bot hesabıyla kapsamlı tutar; `approvalKind` ise çekirdekte sabit kodlu dallar olmadan exec ile Plugin onay davranışını kanal için kullanılabilir tutar.
- Çekirdek artık onay yeniden yönlendirme bildirimlerini de yönetir. Kanal Plugin'leri `createChannelNativeApprovalRuntime` içinden kendi "onay DM'lere / başka bir kanala gitti" takip mesajlarını göndermemelidir; bunun yerine paylaşılan onay yeteneği yardımcıları üzerinden doğru kaynak + onaylayıcı-DM yönlendirmesini açığa çıkarın ve başlatan sohbete herhangi bir bildirim göndermeden önce çekirdeğin gerçek teslimleri toplamasına izin verin.
- Teslim edilen onay id türünü uçtan uca koruyun. Yerel istemciler, kanal-yerel durumdan exec ile Plugin onay yönlendirmesini tahmin etmemeli veya yeniden yazmamalıdır.
- Farklı onay türleri kasıtlı olarak farklı yerel yüzeyler açığa çıkarabilir.
  Güncel yerleşik örnekler:
  - Slack, hem exec hem de Plugin id'leri için yerel onay yönlendirmesini kullanılabilir tutar.
  - Matrix, auth'un onay türüne göre farklılaşmasına hâlâ izin verirken exec
    ve Plugin onayları için aynı yerel DM/kanal yönlendirmesini ve tepki kullanıcı deneyimini korur.
- `createApproverRestrictedNativeApprovalAdapter` hâlâ uyumluluk sarmalayıcısı olarak vardır, ancak yeni kod yetenek oluşturucuyu tercih etmeli ve Plugin üzerinde `approvalCapability` açığa çıkarmalıdır.

Sıcak kanal giriş noktalarında, bu ailenin yalnızca bir bölümüne ihtiyacınız olduğunda daha dar çalışma zamanı alt yollarını tercih edin:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Benzer şekilde, daha geniş şemsiye yüzeye ihtiyacınız olmadığında `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` ve
`openclaw/plugin-sdk/reply-chunking` tercih edin.

Özellikle kurulum için:

- `openclaw/plugin-sdk/setup-runtime`, çalışma zamanı açısından güvenli kurulum yardımcılarını kapsar:
  içe aktarma açısından güvenli kurulum yama adaptörleri (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), lookup-note çıktısı,
  `promptResolvedAllowFrom`, `splitSetupEntries` ve temsil edilen
  setup-proxy oluşturucuları
- `openclaw/plugin-sdk/setup-adapter-runtime`, `createEnvPatchedAccountSetupAdapter` için dar env farkındalığına sahip adaptör
  bağlantı noktasıdır
- `openclaw/plugin-sdk/channel-setup`, isteğe bağlı kurulum kurucularını ve birkaç kurulum açısından güvenli ilkel öğeyi kapsar:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Kanalınız env odaklı kurulumu veya auth'u destekliyorsa ve genel başlangıç/yapılandırma akışları çalışma zamanı yüklenmeden önce bu env adlarını bilmeliyse, bunları Plugin manifestinde `channelEnvVars` ile bildirin. Kanal çalışma zamanı `envVars` değerlerini veya yerel sabitleri yalnızca operatöre dönük metinler için tutun.

Kanalınız `status`, `channels list`, `channels status` veya SecretRef taramalarında Plugin çalışma zamanı başlamadan önce görünebiliyorsa, `package.json` içine `openclaw.setupEntry` ekleyin. Bu giriş noktası salt okunur komut yollarında içe aktarılmaya güvenli olmalı ve bu özetler için gereken kanal meta verilerini, kurulum açısından güvenli yapılandırma bağdaştırıcısını, durum bağdaştırıcısını ve kanal gizli hedef meta verilerini döndürmelidir. Kurulum girişinden istemciler, dinleyiciler veya aktarım çalışma zamanları başlatmayın.

Ana kanal giriş içe aktarma yolunu da dar tutun. Keşif, kanalı etkinleştirmeden yetenekleri kaydetmek için girişi ve kanal Plugin modülünü değerlendirebilir. `channel-plugin-api.ts` gibi dosyalar, kurulum sihirbazlarını, aktarım istemcilerini, soket dinleyicilerini, alt süreç başlatıcılarını veya hizmet başlatma modüllerini içe aktarmadan kanal Plugin nesnesini dışa aktarmalıdır. Bu çalışma zamanı parçalarını `registerFull(...)`, çalışma zamanı ayarlayıcıları veya tembel yetenek bağdaştırıcılarından yüklenen modüllere koyun.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` ve
`splitSetupEntries`

- daha ağır paylaşılan kurulum/yapılandırma yardımcılarına da ihtiyaç duyduğunuzda yalnızca daha geniş `openclaw/plugin-sdk/setup` yüzeyini kullanın; örneğin
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Kanalınız yalnızca kurulum yüzeylerinde "önce bu Plugin'i kur" mesajını göstermek istiyorsa, `createOptionalChannelSetupSurface(...)` tercih edin. Üretilen bağdaştırıcı/sihirbaz yapılandırma yazmalarında ve sonlandırmada kapalı başarısız olur ve doğrulama, sonlandırma ve doküman bağlantısı metninde aynı kurulum gerekli mesajını yeniden kullanır.

Diğer sıcak kanal yolları için daha geniş eski yüzeyler yerine dar yardımcıları tercih edin:

- çok hesaplı yapılandırma ve varsayılan hesap yedeği için `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` ve
  `openclaw/plugin-sdk/account-helpers`
- gelen rota/zarf ve kaydet-ve-yönlendir bağlantısı için
  `openclaw/plugin-sdk/inbound-envelope` ve
  `openclaw/plugin-sdk/inbound-reply-dispatch`
- hedef ayrıştırma/eşleştirme için `openclaw/plugin-sdk/messaging-targets`
- medya yükleme, giden kimlik/gönderme temsilcileri ve yük planlama için
  `openclaw/plugin-sdk/outbound-media` ve
  `openclaw/plugin-sdk/outbound-runtime`
- bir giden rota açık bir `replyToId`/`threadId` değerini korumalıysa veya temel oturum anahtarı hâlâ eşleştiğinde mevcut `:thread:` oturumunu kurtarmalıysa
  `openclaw/plugin-sdk/channel-core` içindeki `buildThreadAwareOutboundSessionRoute(...)`. Sağlayıcı Plugin'leri, platformlarında yerel iş parçacığı teslim semantiği olduğunda önceliği, sonek davranışını ve iş parçacığı kimliği normalleştirmesini geçersiz kılabilir.
- iş parçacığı bağlama yaşam döngüsü ve bağdaştırıcı kaydı için `openclaw/plugin-sdk/thread-bindings-runtime`
- yalnızca eski ajan/medya yük alanı düzeni hâlâ gerekiyorsa `openclaw/plugin-sdk/agent-media-payload`
- Telegram özel komut normalleştirmesi, yinelenen/çakışan doğrulama ve yedekte kararlı bir komut yapılandırma sözleşmesi için `openclaw/plugin-sdk/telegram-command-config`

Yalnızca kimlik doğrulama kanalları genellikle varsayılan yolda kalabilir: çekirdek onayları yönetir ve Plugin yalnızca giden/kimlik doğrulama yeteneklerini sunar. Matrix, Slack, Telegram ve özel sohbet aktarımları gibi yerel onay kanalları kendi onay yaşam döngülerini yazmak yerine paylaşılan yerel yardımcıları kullanmalıdır.

## Gelen bahsetme ilkesi

Gelen bahsetme işlemesini iki katmanda bölünmüş tutun:

- Plugin tarafından sahip olunan kanıt toplama
- paylaşılan ilke değerlendirmesi

Bahsetme ilkesi kararları için `openclaw/plugin-sdk/channel-mention-gating` kullanın.
Daha geniş gelen yardımcı barrel'ına ihtiyaç duyduğunuzda yalnızca `openclaw/plugin-sdk/channel-inbound` kullanın.

Plugin yerel mantığı için iyi uyum:

- bota yanıt algılama
- alıntılanan bot algılama
- iş parçacığı katılım denetimleri
- hizmet/sistem mesajı dışlamaları
- bot katılımını kanıtlamak için gereken platform yerel önbellekleri

Paylaşılan yardımcı için iyi uyum:

- `requireMention`
- açık bahsetme sonucu
- örtük bahsetme izin listesi
- komut atlatma
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

`api.runtime.channel.mentions`, zaten çalışma zamanı enjeksiyonuna bağlı olan paketli kanal Plugin'leri için aynı paylaşılan bahsetme yardımcılarını sunar:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Yalnızca `implicitMentionKindWhen` ve
`resolveInboundMentionDecision` gerekiyorsa, ilgisiz gelen çalışma zamanı yardımcılarını yüklemekten kaçınmak için
`openclaw/plugin-sdk/channel-mention-gating` içinden içe aktarın.

Eski `resolveMentionGating*` yardımcıları yalnızca uyumluluk dışa aktarımları olarak
`openclaw/plugin-sdk/channel-inbound` üzerinde kalır. Yeni kod
`resolveInboundMentionDecision({ facts, policy })` kullanmalıdır.

## İzlenecek yol

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket ve manifest">
    Standart Plugin dosyalarını oluşturun. `package.json` içindeki `channel` alanı
    bunu bir kanal Plugin'i yapan şeydir. Tam paket meta verisi yüzeyi için
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

    `configSchema`, `plugins.entries.acme-chat.config` değerini doğrular. Kanal hesabı yapılandırması olmayan, Plugin'e ait ayarlar için bunu kullanın. `channelConfigs`,
    `channels.acme-chat` değerini doğrular ve Plugin çalışma zamanı yüklenmeden önce yapılandırma şeması, kurulum ve UI yüzeyleri tarafından kullanılan soğuk yol kaynağıdır.

  </Step>

  <Step title="Kanal Plugin nesnesini oluşturun">
    `ChannelPlugin` arayüzünün birçok isteğe bağlı bağdaştırıcı yüzeyi vardır. En azıyla,
    yani `id` ve `setup` ile başlayın ve ihtiyaç duydukça bağdaştırıcılar ekleyin.

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

    Hem kurallı üst düzey DM anahtarlarını hem de eski iç içe anahtarları kabul eden kanallar için `plugin-sdk/channel-config-helpers` içindeki yardımcıları kullanın: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` ve `normalizeChannelDmPolicy`, hesap yerel değerlerini devralınan kök değerlerin önünde tutar. Aynı sözleşmeyi çalışma zamanı ve geçişin okuması için aynı çözümleyiciyi `normalizeLegacyDmAliases` üzerinden doctor onarımıyla eşleştirin.

    <Accordion title="createChatChannelPlugin sizin için ne yapar">
      Düşük düzeyli bağdaştırıcı arayüzlerini elle uygulamak yerine,
      bildirimsel seçenekler geçirirsiniz ve oluşturucu bunları birleştirir:

      | Seçenek | Bağladığı şey |
      | --- | --- |
      | `security.dm` | Yapılandırma alanlarından kapsamlı DM güvenlik çözümleyicisi |
      | `pairing.text` | Kod değişimli metin tabanlı DM eşleştirme akışı |
      | `threading` | Yanıt modu çözümleyicisi (sabit, hesap kapsamlı veya özel) |
      | `outbound.attachedResults` | Sonuç meta verisi (mesaj kimlikleri) döndüren gönderme işlevleri |

      Tam denetime ihtiyacınız varsa bildirimsel seçenekler yerine ham bağdaştırıcı nesneleri de geçirebilirsiniz.

      Ham giden bağdaştırıcılar bir `chunker(text, limit, ctx)` işlevi tanımlayabilir.
      İsteğe bağlı `ctx.formatting`, `maxLinesPerMessage` gibi teslimat zamanı
      biçimlendirme kararlarını taşır; yanıt iş parçacığı ve parça sınırları
      paylaşılan giden teslimat tarafından bir kez çözümlensin diye göndermeden
      önce bunu uygulayın. Gönderme bağlamları, yerel bir yanıt hedefi
      çözümlendiğinde `replyToIdSource` (`implicit` veya `explicit`) bilgisini de
      içerir; böylece yük yardımcıları, örtük tek kullanımlık yanıt slotunu
      tüketmeden açık yanıt etiketlerini koruyabilir.
    </Accordion>

  </Step>

  <Step title="Giriş noktasını bağla">
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

    Kanalın sahip olduğu CLI tanımlayıcılarını `registerCliMetadata(...)` içine
    koyun; böylece OpenClaw tam kanal çalışma zamanını etkinleştirmeden bunları
    kök yardımda gösterebilir, normal tam yüklemeler ise gerçek komut kaydı için
    aynı tanımlayıcıları yine alır. `registerFull(...)` öğesini yalnızca çalışma
    zamanı işleri için tutun. `registerFull(...)` Gateway RPC yöntemleri
    kaydediyorsa Plugin'e özgü bir önek kullanın. Çekirdek yönetim ad alanları
    (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış olarak
    kalır ve her zaman `operator.admin` olarak çözümlenir.
    `defineChannelPluginEntry`, kayıt modu ayrımını otomatik olarak işler. Tüm
    seçenekler için [Giriş Noktaları](/tr/plugins/sdk-entrypoints#definechannelpluginentry)
    bölümüne bakın.

  </Step>

  <Step title="Kurulum girdisi ekle">
    Onboarding sırasında hafif yükleme için `setup-entry.ts` oluşturun:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw, kanal devre dışı olduğunda veya yapılandırılmadığında tam giriş
    yerine bunu yükler. Kurulum akışları sırasında ağır çalışma zamanı kodunun
    çekilmesini önler. Ayrıntılar için [Kurulum ve Yapılandırma](/tr/plugins/sdk-setup#setup-entry)
    bölümüne bakın.

    Kuruluma güvenli dışa aktarımları yardımcı modüllere ayıran paketlenmiş
    çalışma alanı kanalları, açık bir kurulum zamanı çalışma zamanı ayarlayıcısına
    da ihtiyaç duyduklarında `openclaw/plugin-sdk/channel-entry-contract`
    içindeki `defineBundledChannelSetupEntry(...)` öğesini kullanabilir.

  </Step>

  <Step title="Gelen mesajları işle">
    Plugin'inizin platformdan mesajları alması ve bunları OpenClaw'a iletmesi
    gerekir. Tipik desen, isteği doğrulayan ve kanalınızın gelen işleyicisi
    üzerinden dağıtan bir Webhook'tur:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK —
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
      Gelen mesaj işleme kanala özeldir. Her kanal Plugin'i kendi gelen iş
      hattına sahiptir. Gerçek desenler için paketlenmiş kanal Plugin'lerine
      (örneğin Microsoft Teams veya Google Chat Plugin paketi) bakın.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
`src/channel.test.ts` içinde yan yana testler yazın:

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

    Paylaşılan test yardımcıları için [Test Etme](/tr/plugins/sdk-testing) bölümüne bakın.

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
  <Card title="İş parçacığı seçenekleri" icon="git-branch" href="/tr/plugins/sdk-entrypoints#registration-mode">
    Sabit, hesap kapsamlı veya özel yanıt modları
  </Card>
  <Card title="Mesaj aracı entegrasyonu" icon="puzzle" href="/tr/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool ve eylem keşfi
  </Card>
  <Card title="Hedef çözümleme" icon="crosshair" href="/tr/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Çalışma zamanı yardımcıları" icon="settings" href="/tr/plugins/sdk-runtime">
    api.runtime üzerinden TTS, STT, medya, alt ajan
  </Card>
  <Card title="Kanal tur çekirdeği" icon="bolt" href="/tr/plugins/sdk-channel-turn">
    Paylaşılan gelen tur yaşam döngüsü: al, çözümle, kaydet, dağıt, tamamla
  </Card>
</CardGroup>

<Note>
Bazı paketlenmiş yardımcı arayüzler, paketlenmiş Plugin bakımı ve uyumluluk
için hâlâ mevcuttur. Bunlar yeni kanal Plugin'leri için önerilen desen değildir;
doğrudan o paketlenmiş Plugin ailesinin bakımını yapmıyorsanız ortak SDK
yüzeyindeki genel kanal/kurulum/yanıt/çalışma zamanı alt yollarını tercih edin.
</Note>

## Sonraki adımlar

- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) — Plugin'iniz modeller de sağlıyorsa
- [SDK Genel Bakış](/tr/plugins/sdk-overview) — tam alt yol içe aktarma referansı
- [SDK Test Etme](/tr/plugins/sdk-testing) — test yardımcıları ve sözleşme testleri
- [Plugin Manifesti](/tr/plugins/manifest) — tam manifest şeması

## İlgili

- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Ajan bağlama Plugin'leri](/tr/plugins/sdk-agent-harness)

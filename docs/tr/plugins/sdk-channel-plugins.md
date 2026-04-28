---
read_when:
    - Yeni bir mesajlaşma kanalı Plugin'i oluşturuyorsunuz
    - OpenClaw'ı bir mesajlaşma platformuna bağlamak istiyorsunuz
    - ChannelPlugin adaptör yüzeyini anlamanız gerekiyor
sidebarTitle: Channel Plugins
summary: OpenClaw için bir mesajlaşma kanalı Plugin'i oluşturma adım adım kılavuzu
title: Kanal Plugin'leri oluşturma
x-i18n:
    generated_at: "2026-04-25T13:53:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a466decff828bdce1d9d3e85127867b88f43c6eca25aa97306f8bd0df39f3a9
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

Bu kılavuz, OpenClaw'ı bir mesajlaşma platformuna bağlayan bir kanal Plugin'ini adım adım oluşturmayı açıklar. Sonunda DM güvenliği,
eşleştirme, yanıt thread'leme ve giden mesajlaşma özelliklerine sahip çalışan bir kanala sahip olacaksınız.

<Info>
  Daha önce hiç OpenClaw Plugin'i oluşturmadıysanız, temel paket
  yapısı ve manifest kurulumu için önce
  [Başlangıç](/tr/plugins/building-plugins) bölümünü okuyun.
</Info>

## Kanal Plugin'leri nasıl çalışır

Kanal Plugin'lerinin kendi send/edit/react araçlarına ihtiyacı yoktur. OpenClaw,
çekirdekte tek bir paylaşılan `message` aracı tutar. Sizin Plugin'iniz şunlardan sorumludur:

- **Config** — hesap çözümleme ve kurulum sihirbazı
- **Güvenlik** — DM ilkesi ve izin listeleri
- **Eşleştirme** — DM onay akışı
- **Oturum grameri** — sağlayıcıya özgü konuşma kimliklerinin temel sohbetlere, thread kimliklerine ve üst fallback'lere nasıl eşlendiği
- **Giden** — platforma metin, medya ve anket gönderme
- **Thread'leme** — yanıtların nasıl thread'lendiği
- **Heartbeat typing** — Heartbeat teslim hedefleri için isteğe bağlı yazıyor/meşgul sinyalleri

Çekirdek; paylaşılan mesaj aracından, prompt bağlantısından, dış oturum anahtarı şeklinden,
genel `:thread:` kayıt tutmadan ve dispatch'ten sorumludur.

Kanalınız gelen yanıtlardan bağımsız yazma göstergelerini destekliyorsa,
kanal Plugin'inde `heartbeat.sendTyping(...)` açığa çıkarın. Çekirdek bunu,
Heartbeat model çalıştırması başlamadan önce çözümlenmiş Heartbeat teslim hedefiyle çağırır ve
paylaşılan yazma keepalive/temizleme yaşam döngüsünü kullanır. Platform açık bir durdurma sinyali gerektiriyorsa
`heartbeat.clearTyping(...)` de ekleyin.

Kanalınız medya kaynakları taşıyan message-tool parametreleri ekliyorsa, bu
parametre adlarını `describeMessageTool(...).mediaSourceParams` aracılığıyla açığa çıkarın. Çekirdek,
sandbox yol normalizasyonu ve giden medya erişim ilkesi için bu açık listeyi kullanır; böylece Plugin'lerin
sağlayıcıya özgü avatar, ek veya kapak görseli parametreleri için paylaşılan çekirdekte özel durumlara ihtiyacı olmaz.
Tercihen şu gibi eylem anahtarlı bir eşleme döndürün:
`{ "set-profile": ["avatarUrl", "avatarPath"] }`; böylece ilgisiz eylemler başka bir eylemin medya argümanlarını devralmaz.
Her açık eylemde kasıtlı olarak paylaşılan parametreler için düz bir dizi de çalışır.

Platformunuz ek kapsamı konuşma kimlikleri içinde saklıyorsa, bu ayrıştırmayı
Plugin içinde `messaging.resolveSessionConversation(...)` ile tutun. Bu, `rawId` değerini temel konuşma kimliğine,
isteğe bağlı thread kimliğine, açık `baseConversationId` değerine ve herhangi bir
`parentConversationCandidates` listesine eşlemek için kanonik hook'tur.
`parentConversationCandidates` döndürdüğünüzde, bunları en dar üst öğeden en geniş/temel konuşmaya doğru
sıralı tutun.

Kanal kaydı başlamadan önce aynı ayrıştırmaya ihtiyaç duyan paketli Plugin'ler,
eşleşen bir `resolveSessionConversation(...)` export'u ile üst düzey bir
`session-key-api.ts` dosyası da açığa çıkarabilir. Çekirdek bu bootstrap için güvenli yüzeyi
yalnızca çalışma zamanı Plugin kaydı henüz kullanılabilir değilken kullanır.

`messaging.resolveParentConversationCandidates(...)`, bir Plugin yalnızca
genel/ham kimliğin üstünde üst fallback'lere ihtiyaç duyduğunda eski uyumluluk fallback'i olarak kullanılabilir olmaya devam eder.
Her iki hook da varsa çekirdek önce
`resolveSessionConversation(...).parentConversationCandidates` kullanır ve yalnızca kanonik hook
bunları atladığında `resolveParentConversationCandidates(...)` değerine fallback yapar.

## Onaylar ve kanal yetenekleri

Çoğu kanal Plugin'i onaya özgü koda ihtiyaç duymaz.

- Çekirdek, aynı sohbette `/approve`, paylaşılan onay düğmesi yükleri ve genel fallback teslimattan sorumludur.
- Kanal onaya özgü davranış gerektiriyorsa, kanal Plugin'inde tek bir `approvalCapability` nesnesi tercih edin.
- `ChannelPlugin.approvals` kaldırılmıştır. Onay teslimatı/yerel işleme/gösterim/kimlik doğrulama bilgilerini `approvalCapability` içine koyun.
- `plugin.auth` yalnızca login/logout içindir; çekirdek artık o nesneden onay kimlik doğrulama hook'larını okumaz.
- `approvalCapability.authorizeActorAction` ve `approvalCapability.getActionAvailabilityState`, kanonik onay-kimlik doğrulama yüzeyidir.
- Aynı sohbette onay kimlik doğrulama kullanılabilirliği için `approvalCapability.getActionAvailabilityState` kullanın.
- Kanalınız yerel exec onayları açığa çıkarıyorsa, başlatan yüzey/yerel istemci durumu aynı sohbetteki onay kimlik doğrulamasından farklı olduğunda `approvalCapability.getExecInitiatingSurfaceState` kullanın. Çekirdek bu exec'e özgü hook'u `enabled` ve `disabled` ayrımı yapmak, başlatan kanalın yerel exec onaylarını destekleyip desteklemediğine karar vermek ve kanalı yerel istemci fallback rehberine dahil etmek için kullanır. `createApproverRestrictedNativeApprovalCapability(...)`, yaygın durum için bunu doldurur.
- Yinelenen yerel onay istemlerini gizleme veya teslimattan önce yazma göstergeleri gönderme gibi kanala özgü yük yaşam döngüsü davranışları için `outbound.shouldSuppressLocalPayloadPrompt` veya `outbound.beforeDeliverPayload` kullanın.
- `approvalCapability.delivery` yalnızca yerel onay yönlendirmesi veya fallback bastırması için kullanılmalıdır.
- `approvalCapability.nativeRuntime` kanal sahipliğindeki yerel onay bilgileri içindir. Çekirdek onay yaşam döngüsünü oluşturabilsin diye, bunu `createLazyChannelApprovalNativeRuntimeAdapter(...)` ile sıcak kanal giriş noktalarında lazy tutun; bu adaptör çalışma zamanı modülünüzü isteğe bağlı olarak import edebilir.
- `approvalCapability.render` yalnızca bir kanalın paylaşılan render yerine gerçekten özel onay yüklerine ihtiyaç duyması durumunda kullanılmalıdır.
- Yerel exec onaylarını etkinleştirmek için gereken tam config düğümlerini devre dışı yol yanıtında açıklamak istiyorsa `approvalCapability.describeExecApprovalSetup` kullanın. Hook `{ channel, channelLabel, accountId }` alır; adlandırılmış hesap kanalları üst düzey varsayılanlar yerine `channels.<channel>.accounts.<id>.execApprovals.*` gibi hesap kapsamlı yollar üretmelidir.
- Bir kanal mevcut config'ten kararlı sahip benzeri DM kimliklerini çıkarabiliyorsa, aynı sohbette `/approve` kullanımını onaya özgü çekirdek mantığı eklemeden kısıtlamak için `openclaw/plugin-sdk/approval-runtime` içinden `createResolvedApproverActionAuthAdapter` kullanın.
- Bir kanal yerel onay teslimatına ihtiyaç duyuyorsa, kanal kodunu hedef normalizasyonu ile taşıma/sunum bilgilerine odaklı tutun. `openclaw/plugin-sdk/approval-runtime` içinden `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` ve `createApproverRestrictedNativeApprovalCapability` kullanın. Kanala özgü bilgileri `approvalCapability.nativeRuntime` arkasına, ideal olarak `createChannelApprovalNativeRuntimeAdapter(...)` veya `createLazyChannelApprovalNativeRuntimeAdapter(...)` yoluyla koyun; böylece çekirdek işleyiciyi oluşturabilir ve istek filtreleme, yönlendirme, yineleme kaldırma, süre sonu, gateway aboneliği ve başka yere yönlendirildi bildirimlerini sahiplenebilir. `nativeRuntime` birkaç küçük yüzeye ayrılmıştır:
- `availability` — hesabın yapılandırılıp yapılandırılmadığı ve bir isteğin işlenip işlenmemesi gerektiği
- `presentation` — paylaşılan onay görünüm modelini bekleyen/çözümlenmiş/süresi dolmuş yerel yüklere veya son eylemlere eşleme
- `transport` — hedefleri hazırlama artı yerel onay mesajlarını gönderme/güncelleme/silme
- `interactions` — yerel düğmeler veya tepkiler için isteğe bağlı bind/unbind/clear-action hook'ları
- `observe` — isteğe bağlı teslim tanılama hook'ları
- Kanal, istemci, token, Bolt uygulaması veya Webhook alıcısı gibi çalışma zamanına ait nesnelere ihtiyaç duyuyorsa, bunları `openclaw/plugin-sdk/channel-runtime-context` üzerinden kaydedin. Genel runtime-context kaydı, çekirdeğin kanal başlangıç durumundan yetenek güdümlü işleyicileri, onaya özgü sarmalayıcı glue eklemeden bootstrap etmesine izin verir.
- Yalnızca yetenek güdümlü yüzey henüz yeterince ifade edici değilse daha düşük seviyeli `createChannelApprovalHandler` veya `createChannelNativeApprovalRuntime` kullanın.
- Yerel onay kanalları hem `accountId` hem de `approvalKind` değerini bu yardımcılar üzerinden yönlendirmelidir. `accountId`, çoklu hesap onay ilkesini doğru bot hesabına bağlı tutar; `approvalKind` ise çekirdekte sabit dallar olmadan exec ve Plugin onay davranışını kanal için kullanılabilir kılar.
- Çekirdek artık onay yeniden yönlendirme bildirimlerine de sahiptir. Kanal Plugin'leri kendi "onay DM'lere / başka bir kanala gitti" takip mesajlarını `createChannelNativeApprovalRuntime` içinden göndermemelidir; bunun yerine paylaşılan onay yeteneği yardımcıları üzerinden doğru kaynak + onaylayıcı-DM yönlendirmesini açığa çıkarın ve başlatan sohbete herhangi bir bildirim gönderilmeden önce gerçek teslimatları çekirdeğin toplamasına izin verin.
- Teslim edilen onay kimliği türünü uçtan uca koruyun. Yerel istemciler exec ile Plugin onay yönlendirmesini kanal-yerel durumdan tahmin etmemeli
  veya yeniden yazmamalıdır.
- Farklı onay türleri kasıtlı olarak farklı yerel yüzeyler açığa çıkarabilir.
  Geçerli paketli örnekler:
  - Slack, hem exec hem de Plugin kimlikleri için yerel onay yönlendirmesini kullanılabilir tutar.
  - Matrix, exec
    ve Plugin onayları için aynı yerel DM/kanal yönlendirmesini ve tepki UX'ini korurken, kimlik doğrulamanın onay türüne göre farklılaşmasına yine de izin verir.
- `createApproverRestrictedNativeApprovalAdapter` hâlâ bir uyumluluk sarmalayıcısı olarak vardır, ancak yeni kod yetenek oluşturucuyu tercih etmeli ve Plugin üzerinde `approvalCapability` açığa çıkarmalıdır.

Sıcak kanal giriş noktaları için, bu ailenin yalnızca bir kısmına ihtiyacınız varsa
daha dar çalışma zamanı alt yollarını tercih edin:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Aynı şekilde, daha geniş umbrella
yüzeyine ihtiyaç duymadığınızda `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` ve
`openclaw/plugin-sdk/reply-chunking` yollarını tercih edin.

Özellikle kurulum için:

- `openclaw/plugin-sdk/setup-runtime`, çalışma zamanı için güvenli kurulum yardımcılarını kapsar:
  import-safe kurulum yama adaptörleri (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), lookup-note çıktısı,
  `promptResolvedAllowFrom`, `splitSetupEntries` ve devredilmiş
  setup-proxy oluşturucuları
- `openclaw/plugin-sdk/setup-adapter-runtime`, `createEnvPatchedAccountSetupAdapter`
  için dar env-farkındalıklı adaptör yüzeyidir
- `openclaw/plugin-sdk/channel-setup`, isteğe bağlı kurulum oluşturucularını ve birkaç kurulum için güvenli ilkel öğeyi kapsar:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Kanalınız env güdümlü kurulum veya kimlik doğrulama destekliyorsa ve genel başlangıç/config
akışlarının çalışma zamanı yüklenmeden önce bu env adlarını bilmesi gerekiyorsa, bunları
Plugin manifest'inde `channelEnvVars` ile bildirin. Kanal çalışma zamanı `envVars` veya yerel sabitleri
yalnızca operatöre dönük metinler için tutun.

Kanalınız çalışma zamanı Plugin'i başlamadan önce `status`, `channels list`, `channels status` veya
SecretRef taramalarında görünebiliyorsa, `package.json` içine `openclaw.setupEntry` ekleyin.
Bu giriş noktası, salt okunur komut yollarında güvenle import edilebilir olmalı ve
özetler için gereken kanal meta verisini, kurulum için güvenli config adaptörünü, durum adaptörünü ve kanal secret hedef meta verisini döndürmelidir.
Kurulum girişinden istemci, dinleyici veya taşıma çalışma zamanı başlatmayın.

Ana kanal giriş import yolunu da dar tutun. Keşif, yetenekleri kaydetmek için
kanalı etkinleştirmeden giriş noktasını ve kanal Plugin modülünü değerlendirebilir.
`channel-plugin-api.ts` gibi dosyalar kurulum sihirbazlarını, taşıma istemcilerini, soket
dinleyicilerini, alt süreç başlatıcılarını veya hizmet başlangıç modüllerini import etmeden kanal
Plugin nesnesini export etmelidir. Bu çalışma zamanı parçalarını `registerFull(...)`, runtime setter'ları
veya lazy yetenek adaptörlerinden yüklenen modüllere koyun.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` ve
`splitSetupEntries`

- yalnızca daha ağır paylaşılan kurulum/config yardımcılarına da ihtiyacınız varsa
  daha geniş `openclaw/plugin-sdk/setup` yüzeyini kullanın; örneğin
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Kanalınız kurulum yüzeylerinde yalnızca “önce bu Plugin'i kurun” bilgisini duyurmak istiyorsa,
`createOptionalChannelSetupSurface(...)` tercih edin. Üretilen
adaptör/sihirbaz config yazımlarında ve sonlandırmada başarısız-kapalı davranır ve doğrulama, sonlandırma ve belge bağlantısı
metni boyunca aynı kurulum-gerekli mesajını yeniden kullanır.

Diğer sıcak kanal yolları için, daha geniş eski yüzeyler yerine dar yardımcıları tercih edin:

- çoklu hesap config'i ve
  varsayılan hesap fallback'i için `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` ve
  `openclaw/plugin-sdk/account-helpers`
- gelen rota/zarf ve
  kaydet-ve-dispatch bağlantısı için `openclaw/plugin-sdk/inbound-envelope` ve
  `openclaw/plugin-sdk/inbound-reply-dispatch`
- hedef ayrıştırma/eşleştirme için `openclaw/plugin-sdk/messaging-targets`
- medya yükleme artı giden
  kimlik/gönderim delegeleri ve yük planlaması için `openclaw/plugin-sdk/outbound-media` ve
  `openclaw/plugin-sdk/outbound-runtime`
- giden bir rota açık bir
  `replyToId`/`threadId` değerini korumalıysa veya temel oturum anahtarı yine eşleştiğinde geçerli `:thread:` oturumunu
  geri kazanmalıysa `openclaw/plugin-sdk/channel-core` içinden
  `buildThreadAwareOutboundSessionRoute(...)`.
  Sağlayıcı Plugin'leri, platformları yerel thread teslim semantiğine sahipse öncelik, sonek davranışı ve thread kimliği normalizasyonunu geçersiz kılabilir.
- thread-binding yaşam döngüsü
  ve adaptör kaydı için `openclaw/plugin-sdk/thread-bindings-runtime`
- yalnızca eski bir aracı/medya
  yük alan düzeni hâlâ gerekiyorsa `openclaw/plugin-sdk/agent-media-payload`
- Telegram özel komut
  normalizasyonu, yinelenen/çakışma doğrulaması ve fallback açısından kararlı komut
  config sözleşmesi için `openclaw/plugin-sdk/telegram-command-config`

Yalnızca kimlik doğrulama yapan kanallar genellikle varsayılan yolda durabilir: çekirdek onayları yönetir ve Plugin yalnızca giden/kimlik doğrulama yeteneklerini açığa çıkarır. Matrix, Slack, Telegram ve özel sohbet taşımaları gibi yerel onay kanalları, kendi onay yaşam döngülerini kurmak yerine paylaşılan yerel yardımcıları kullanmalıdır.

## Gelen bahsetme ilkesi

Gelen bahsetme işlemesini iki katmana ayrılmış halde tutun:

- Plugin'e ait kanıt toplama
- paylaşılan ilke değerlendirmesi

Bahsetme ilkesi kararları için `openclaw/plugin-sdk/channel-mention-gating` kullanın.
Daha geniş gelen
yardımcı barrel'ına yalnızca ihtiyacınız varsa `openclaw/plugin-sdk/channel-inbound` kullanın.

Plugin-yerel mantık için uygun örnekler:

- bota yanıt algılama
- bottan alıntı algılama
- thread katılım denetimleri
- hizmet/sistem mesajı hariç tutmaları
- bot katılımını kanıtlamak için gereken platform-yerel önbellekler

Paylaşılan yardımcı için uygun örnekler:

- `requireMention`
- açık bahsetme sonucu
- örtük bahsetme izin listesi
- komut baypası
- son atlama kararı

Tercih edilen akış:

1. Yerel bahsetme bilgilerini hesaplayın.
2. Bu bilgileri `resolveInboundMentionDecision({ facts, policy })` içine geçin.
3. Gelen geçidinizde `decision.effectiveWasMentioned`, `decision.shouldBypassMention` ve `decision.shouldSkip` alanlarını kullanın.

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

`api.runtime.channel.mentions`, çalışma zamanı enjeksiyonuna zaten bağımlı olan
paketlenmiş kanal Plugin'leri için aynı paylaşılan bahsetme yardımcılarını açığa çıkarır:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Yalnızca `implicitMentionKindWhen` ve
`resolveInboundMentionDecision` gerekiyorsa,
ilgisiz gelen çalışma zamanı yardımcılarını yüklememek için
`openclaw/plugin-sdk/channel-mention-gating` içinden import edin.

Eski `resolveMentionGating*` yardımcıları,
yalnızca uyumluluk export'ları olarak `openclaw/plugin-sdk/channel-inbound` üzerinde kalmaya devam eder. Yeni kod
`resolveInboundMentionDecision({ facts, policy })` kullanmalıdır.

## Adım adım anlatım

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket ve manifest">
    Standart Plugin dosyalarını oluşturun. `package.json` içindeki `channel` alanı,
    bunun bir kanal Plugin'i olmasını sağlar. Tam paket-meta veri yüzeyi için
    bkz. [Plugin Setup and Config](/tr/plugins/sdk-setup#openclaw-channel):

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
          "blurb": "OpenClaw'ı Acme Chat'e bağlayın."
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
      "description": "Acme Chat kanal Plugin'i",
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
              "label": "Bot token'ı",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema`, `plugins.entries.acme-chat.config` değerini doğrular. Bunu,
    kanal hesap config'i olmayan, Plugin'e ait ayarlar için kullanın. `channelConfigs`,
    `channels.acme-chat` değerini doğrular ve Plugin çalışma zamanı yüklenmeden önce
    config şeması, kurulum ve UI yüzeyleri tarafından kullanılan cold-path kaynağıdır.

  </Step>

  <Step title="Kanal Plugin nesnesini oluşturun">
    `ChannelPlugin` arayüzü çok sayıda isteğe bağlı adaptör yüzeyine sahiptir. En azından
    `id` ve `setup` ile başlayın, ihtiyacınız oldukça adaptörler ekleyin.

    `src/channel.ts` oluşturun:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // sizin platform API istemciniz

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
      if (!token) throw new Error("acme-chat: token gereklidir");
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

      // DM güvenliği: botla kimler mesajlaşabilir
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

      // Thread'leme: yanıtlar nasıl teslim edilir
      threading: { topLevelReplyToMode: "reply" },

      // Giden: platforma mesaj gönder
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

    <Accordion title="`createChatChannelPlugin` sizin için ne yapar">
      Düşük seviyeli adaptör arayüzlerini elle uygulamak yerine,
      bildirime dayalı seçenekler geçirirsiniz ve oluşturucu bunları birleştirir:

      | Seçenek | Bağladığı şey |
      | --- | --- |
      | `security.dm` | Config alanlarından kapsamlı DM güvenlik çözücüsü |
      | `pairing.text` | Kod alışverişli metin tabanlı DM eşleştirme akışı |
      | `threading` | Reply-to-mode çözücüsü (sabit, hesap kapsamlı veya özel) |
      | `outbound.attachedResults` | Sonuç meta verisi döndüren gönderim işlevleri (mesaj kimlikleri) |

      Tam denetime ihtiyacınız varsa bildirime dayalı seçenekler yerine ham adaptör nesneleri de geçebilirsiniz.

      Ham giden adaptörler `chunker(text, limit, ctx)` işlevi tanımlayabilir.
      İsteğe bağlı `ctx.formatting`, `maxLinesPerMessage` gibi teslimat anı biçimlendirme kararlarını taşır;
      yanıt thread'leme ve parça sınırları paylaşılan giden teslimat tarafından tek seferde çözülsün diye
      bunları göndermeden önce uygulayın.
      Gönderim bağlamları, yerel bir yanıt hedefi çözümlendiğinde `replyToIdSource` (`implicit` veya `explicit`) değerini de içerir; böylece yük yardımcıları, örtük tek kullanımlık yanıt yuvasını tüketmeden açık yanıt etiketlerini koruyabilir.
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
      description: "Acme Chat kanal Plugin'i",
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

    `registerCliMetadata(...)` içinde kanala ait CLI descriptor'larını koyun; böylece OpenClaw
    tam kanal çalışma zamanını etkinleştirmeden bunları kök yardımda gösterebilir,
    normal tam yüklemeler ise gerçek komut
    kaydı için yine aynı descriptor'ları alır. Çalışma zamanına özgü işler için `registerFull(...)` kullanmaya devam edin.
    `registerFull(...)` gateway RPC yöntemleri kaydediyorsa,
    Plugin'e özgü bir önek kullanın. Çekirdek admin ad alanları (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış kalır ve her zaman
    `operator.admin` olarak çözülür.
    `defineChannelPluginEntry`, kayıt modu ayrımını otomatik olarak yönetir. Tüm
    seçenekler için [Entry Points](/tr/plugins/sdk-entrypoints#definechannelpluginentry) bölümüne bakın.

  </Step>

  <Step title="Bir setup entry ekleyin">
    Onboarding sırasında hafif yükleme için `setup-entry.ts` oluşturun:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw, kanal devre dışıysa
    veya yapılandırılmamışsa tam giriş yerine bunu yükler. Kurulum akışları sırasında ağır çalışma zamanı kodunu çekmekten kaçınır.
    Ayrıntılar için [Setup and Config](/tr/plugins/sdk-setup#setup-entry) bölümüne bakın.

    Kurulum için güvenli export'ları yan modüllere ayıran paketlenmiş çalışma alanı kanalları,
    açık bir kurulum zamanı çalışma zamanı setter'ına da ihtiyaç duyduklarında
    `openclaw/plugin-sdk/channel-entry-contract` içinden
    `defineBundledChannelSetupEntry(...)` kullanabilir.

  </Step>

  <Step title="Gelen mesajları işleyin">
    Plugin'inizin platformdan mesaj alması ve bunları
    OpenClaw'a iletmesi gerekir. Tipik desen, isteği doğrulayan ve
    onu kanalınızın gelen işleyicisi üzerinden dispatch eden bir Webhook'tur:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // Plugin tarafından yönetilen kimlik doğrulama (imzaları kendiniz doğrulayın)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Gelen işleyiciniz mesajı OpenClaw'a dispatch eder.
          // Tam bağlantı platform SDK'nize bağlıdır —
          // paketlenmiş Microsoft Teams veya Google Chat Plugin paketlerindeki gerçek örneklere bakın.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Gelen mesaj işleme kanala özgüdür. Her kanal Plugin'i
      kendi gelen işlem hattına sahiptir. Gerçek kalıplar için paketlenmiş kanal Plugin'lerine
      (örneğin Microsoft Teams veya Google Chat Plugin paketi) bakın.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
Eş konumlu testleri `src/channel.test.ts` içinde yazın:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("config içinden hesabı çözümler", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("gizli değerleri somutlaştırmadan hesabı inceler", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("eksik config'i bildirir", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    Paylaşılan test yardımcıları için bkz. [Testing](/tr/plugins/sdk-testing).

</Step>
</Steps>

## Dosya yapısı

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel meta verisi
├── openclaw.plugin.json      # Config şemalı manifest
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Genel export'lar (isteğe bağlı)
├── runtime-api.ts            # İç çalışma zamanı export'ları (isteğe bağlı)
└── src/
    ├── channel.ts            # createChatChannelPlugin ile ChannelPlugin
    ├── channel.test.ts       # Testler
    ├── client.ts             # Platform API istemcisi
    └── runtime.ts            # Çalışma zamanı deposu (gerekiyorsa)
```

## Gelişmiş konular

<CardGroup cols={2}>
  <Card title="Thread'leme seçenekleri" icon="git-branch" href="/tr/plugins/sdk-entrypoints#registration-mode">
    Sabit, hesap kapsamlı veya özel yanıt modları
  </Card>
  <Card title="Mesaj aracı entegrasyonu" icon="puzzle" href="/tr/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool ve eylem keşfi
  </Card>
  <Card title="Hedef çözümleme" icon="crosshair" href="/tr/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Çalışma zamanı yardımcıları" icon="settings" href="/tr/plugins/sdk-runtime">
    api.runtime aracılığıyla TTS, STT, medya, alt aracı
  </Card>
</CardGroup>

<Note>
Bazı paketli yardımcı yüzeyler hâlâ paketli Plugin bakımı ve
uyumluluk için vardır. Bunlar yeni kanal Plugin'leri için önerilen desen değildir;
bu paketli Plugin ailesini doğrudan sürdürmüyorsanız ortak SDK
yüzeyindeki genel kanal/kurulum/yanıt/çalışma zamanı alt yollarını tercih edin.
</Note>

## Sonraki adımlar

- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) — Plugin'iniz model de sağlıyorsa
- [SDK Overview](/tr/plugins/sdk-overview) — tam alt yol import başvurusu
- [SDK Testing](/tr/plugins/sdk-testing) — test yardımcıları ve sözleşme testleri
- [Plugin Manifest](/tr/plugins/manifest) — tam manifest şeması

## İlgili

- [Plugin SDK setup](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Aracı harness Plugin'leri](/tr/plugins/sdk-agent-harness)

---
read_when:
    - Yeni bir mesajlaşma kanal Plugin'i oluşturuyorsunuz
    - OpenClaw'ı bir mesajlaşma platformuna bağlamak istiyorsunuz
    - ChannelPlugin bağdaştırıcı yüzeyini anlamanız gerekiyor
sidebarTitle: Channel Plugins
summary: OpenClaw için bir mesajlaşma kanal Plugin'i oluşturma adım adım rehberi
title: Kanal Plugin'leri oluşturma
x-i18n:
    generated_at: "2026-04-24T09:22:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: e08340e7984b4aa5307c4ba126b396a80fa8dcb3d6f72561f643806a8034fb88
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

Bu rehber, OpenClaw'ı bir mesajlaşma platformuna bağlayan bir kanal Plugin'i oluşturmayı adım adım açıklar. Sonunda DM güvenliği,
Pairing, yanıt iş parçacığı ve giden mesajlaşma desteği olan çalışan bir kanalınız olacak.

<Info>
  Daha önce hiç OpenClaw Plugin'i oluşturmadıysanız, temel paket
  yapısı ve manifest kurulumu için önce
  [Getting Started](/tr/plugins/building-plugins) sayfasını okuyun.
</Info>

## Kanal Plugin'leri nasıl çalışır

Kanal Plugin'lerinin kendi send/edit/react araçlarına ihtiyacı yoktur. OpenClaw,
çekirdekte tek bir ortak `message` aracı tutar. Sizin Plugin'iniz şunların sahibidir:

- **Config** — hesap çözümleme ve kurulum sihirbazı
- **Security** — DM ilkesi ve allowlist'ler
- **Pairing** — DM onay akışı
- **Session grammar** — sağlayıcıya özgü konuşma kimliklerinin temel sohbetlere, thread kimliklerine ve üst geri düşmelere nasıl eşlendiği
- **Outbound** — platforma metin, medya ve anket gönderme
- **Threading** — yanıtların nasıl thread'lendiği
- **Heartbeat typing** — Heartbeat teslim hedefleri için isteğe bağlı typing/busy sinyalleri

Çekirdek, ortak mesaj aracının, istem bağlamasının, dış oturum anahtarı biçiminin,
genel `:thread:` muhasebesinin ve dispatch'in sahibidir.

Kanalınız gelen yanıtların dışında typing göstergelerini destekliyorsa
kanal Plugin'i üzerinde `heartbeat.sendTyping(...)` açığa çıkarın. Çekirdek bunu,
Heartbeat model çalıştırması başlamadan önce çözümlenmiş Heartbeat teslim hedefine çağırır ve
ortak typing keepalive/cleanup yaşam döngüsünü kullanır. Platform açık bir durdurma sinyali gerektiriyorsa
`heartbeat.clearTyping(...)` de ekleyin.

Kanalınız medya kaynakları taşıyan message-tool parametreleri ekliyorsa, bu
parametre adlarını `describeMessageTool(...).mediaSourceParams` üzerinden açığa çıkarın. Çekirdek
bu açık listeyi sandbox yol normalizasyonu ve giden medya erişim ilkesi için kullanır;
böylece Plugin'lerin sağlayıcıya özgü avatar, ek veya kapak görseli parametreleri için
ortak çekirdekte özel durumlara ihtiyacı olmaz.
İlişkisiz eylemlerin başka bir eylemin medya argümanlarını devralmaması için
tercihen
`{ "set-profile": ["avatarUrl", "avatarPath"] }` gibi eylem anahtarlı bir harita döndürün.
Düz bir dizi de, kasıtlı olarak tüm açığa çıkarılan eylemler arasında paylaşılan parametreler için
çalışmaya devam eder.

Platformunuz konuşma kimlikleri içinde ek kapsam saklıyorsa, bu ayrıştırmayı
Plugin içinde `messaging.resolveSessionConversation(...)` ile tutun. Bu,
`rawId` değerini temel konuşma kimliğine, isteğe bağlı thread kimliğine,
açık `baseConversationId` değerine ve olası `parentConversationCandidates`
listesine eşlemek için kanonik hook'tur.
`parentConversationCandidates` döndürdüğünüzde bunları en dar üstten en geniş/temel konuşmaya doğru sıralı tutun.

Kanal kayıt defteri başlatılmadan önce aynı ayrıştırmaya ihtiyaç duyan paketlenmiş Plugin'ler
eşleşen bir `resolveSessionConversation(...)` dışa aktarımıyla üst düzey bir
`session-key-api.ts` dosyasını da açığa çıkarabilir.
Çekirdek, bu bootstrap-safe yüzeyi yalnızca çalışma zamanı Plugin kayıt defteri henüz mevcut değilse kullanır.

`messaging.resolveParentConversationCandidates(...)`,
bir Plugin yalnızca genel/ham kimliğin üstüne üst geri düşmelere ihtiyaç duyuyorsa
eski uyumluluk geri dönüşü olarak kullanılmaya devam eder.
Her iki hook da varsa çekirdek önce
`resolveSessionConversation(...).parentConversationCandidates` değerini kullanır ve yalnızca kanonik hook
bunları atladığında `resolveParentConversationCandidates(...)` değerine geri düşer.

## Onaylar ve kanal yetenekleri

Çoğu kanal Plugin'inin onaya özgü koda ihtiyacı yoktur.

- Aynı sohbette `/approve`, ortak onay düğmesi yükleri ve genel geri düşme teslimi çekirdeğe aittir.
- Kanal onaya özgü davranış gerektiriyorsa kanal Plugin'i üzerinde tek bir `approvalCapability` nesnesi tercih edin.
- `ChannelPlugin.approvals` kaldırılmıştır. Onay teslimi/yerel/oluşturma/kimlik doğrulama bilgilerini `approvalCapability` üzerine koyun.
- `plugin.auth` yalnızca login/logout içindir; çekirdek artık bu nesneden onay auth hook'larını okumaz.
- `approvalCapability.authorizeActorAction` ve `approvalCapability.getActionAvailabilityState`, kanonik onay-auth sınırıdır.
- Aynı sohbet içi onay auth kullanılabilirliği için `approvalCapability.getActionAvailabilityState` kullanın.
- Kanalınız yerel exec onayları açığa çıkarıyorsa, aynı sohbet onay auth'undan farklı olduğunda başlatan yüzey/yerel istemci durumu için `approvalCapability.getExecInitiatingSurfaceState` kullanın. Çekirdek bu exec'e özgü hook'u `enabled` ile `disabled` ayrımını yapmak, başlatan kanalın yerel exec onaylarını destekleyip desteklemediğine karar vermek ve kanalı yerel istemci geri düşme yönlendirmesine dahil etmek için kullanır. `createApproverRestrictedNativeApprovalCapability(...)` bunu yaygın durum için doldurur.
- Yinelenen yerel onay istemlerini gizleme veya teslimden önce typing göstergeleri gönderme gibi kanala özgü yük yaşam döngüsü davranışları için `outbound.shouldSuppressLocalPayloadPrompt` veya `outbound.beforeDeliverPayload` kullanın.
- `approvalCapability.delivery` alanını yalnızca yerel onay yönlendirme veya geri düşme bastırma için kullanın.
- Kanala ait yerel onay bilgileri için `approvalCapability.nativeRuntime` kullanın. İstek yaşam döngüsünü çekirdek yine de kurabilsin diye, bunu sıcak kanal giriş noktalarında `createLazyChannelApprovalNativeRuntimeAdapter(...)` ile tembel tutun; bu bağdaştırıcı çalışma zamanı modülünüzü gerektiğinde içe aktarabilir.
- Yalnızca kanal gerçekten ortak oluşturucu yerine özel onay yüklerine ihtiyaç duyuyorsa `approvalCapability.render` kullanın.
- Kanal, devre dışı yol yanıtının yerel exec onaylarını etkinleştirmek için gereken tam yapılandırma düğümlerini açıklamasını istiyorsa `approvalCapability.describeExecApprovalSetup` kullanın. Hook şu girdiyi alır: `{ channel, channelLabel, accountId }`; adlandırılmış hesaplı kanallar, üst düzey varsayılanlar yerine `channels.<channel>.accounts.<id>.execApprovals.*` gibi hesap kapsamlı yollar oluşturmalıdır.
- Kanal, mevcut yapılandırmadan kararlı sahip benzeri DM kimliklerini çıkarabiliyorsa, onaya özgü çekirdek mantığı eklemeden aynı sohbet içi `/approve` çağrılarını kısıtlamak için `openclaw/plugin-sdk/approval-runtime` içindeki `createResolvedApproverActionAuthAdapter` kullanın.
- Kanal yerel onay teslimine ihtiyaç duyuyorsa kanal kodunu hedef normalizasyonu artı taşıma/sunum bilgilerine odaklı tutun. `openclaw/plugin-sdk/approval-runtime` içinden `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` ve `createApproverRestrictedNativeApprovalCapability` kullanın. Kanala özgü bilgileri, tercihen `createChannelApprovalNativeRuntimeAdapter(...)` veya `createLazyChannelApprovalNativeRuntimeAdapter(...)` üzerinden `approvalCapability.nativeRuntime` arkasına koyun; böylece çekirdek işleyiciyi kurabilir ve istek filtreleme, yönlendirme, yinelenenleri giderme, sona erme, Gateway aboneliği ve başka yere yönlendirildi bildirimlerinin sahibi olabilir. `nativeRuntime` birkaç küçük sınıra ayrılmıştır:
- `availability` — hesabın yapılandırılmış olup olmadığı ve bir isteğin ele alınıp alınmaması gerektiği
- `presentation` — ortak onay görünüm modelini bekleyen/çözümlenmiş/süresi dolmuş yerel yüklere veya son eylemlere eşleme
- `transport` — hedefleri hazırlama artı yerel onay mesajlarını gönderme/güncelleme/silme
- `interactions` — yerel düğmeler veya tepkiler için isteğe bağlı bind/unbind/clear-action hook'ları
- `observe` — isteğe bağlı teslim tanılama hook'ları
- Kanal, istemci, token, Bolt uygulaması veya Webhook alıcısı gibi çalışma zamanına ait nesnelere ihtiyaç duyuyorsa bunları `openclaw/plugin-sdk/channel-runtime-context` üzerinden kaydedin. Genel runtime-context kayıt defteri, çekirdeğin kanal başlangıç durumundan yetenek güdümlü işleyicileri başlatmasına olanak verir; onaya özgü sarmalayıcı glue eklemeden.
- Düşük seviyeli `createChannelApprovalHandler` veya `createChannelNativeApprovalRuntime` araçlarına yalnızca yetenek güdümlü sınır henüz yeterince ifade gücü sunmuyorsa başvurun.
- Yerel onay kanalları, bu yardımcılar üzerinden hem `accountId` hem de `approvalKind` yönlendirmelidir. `accountId`, çok hesaplı onay ilkesini doğru bot hesabına kapsamlar; `approvalKind` ise çekirdekte sert kodlanmış dallar olmadan exec ile Plugin onay davranışını kanal için kullanılabilir tutar.
- Çekirdek artık onay yeniden yönlendirme bildirimlerinin de sahibidir. Kanal Plugin'leri `createChannelNativeApprovalRuntime` içinden kendi "onay DM'lere / başka bir kanala gitti" takip mesajlarını göndermemeli; bunun yerine ortak onay yetenek yardımcıları üzerinden doğru kaynak + approver-DM yönlendirmesini açığa çıkarmalı ve başlatan sohbete herhangi bir bildirim göndermeden önce çekirdeğin gerçek teslimleri toplamasına izin vermelidir.
- Teslim edilen onay kimliği türünü uçtan uca koruyun. Yerel istemciler,
  exec ile Plugin onay yönlendirmesini kanal yerel durumundan tahmin etmemeli veya yeniden yazmamalıdır.
- Farklı onay türleri kasıtlı olarak farklı yerel yüzeyler açığa çıkarabilir.
  Mevcut paketlenmiş örnekler:
  - Slack, hem exec hem de Plugin kimlikleri için yerel onay yönlendirmesini kullanılabilir tutar.
  - Matrix, exec ve Plugin onayları için aynı yerel DM/kanal yönlendirmesini ve reaction UX'ini korur; auth, onay türüne göre yine de farklılaşabilir.
- `createApproverRestrictedNativeApprovalAdapter` hâlâ bir uyumluluk sarmalayıcısı olarak vardır, ancak yeni kod `approvalCapability` oluşturucusunu tercih etmeli ve Plugin üzerinde `approvalCapability` açığa çıkarmalıdır.

Sıcak kanal giriş noktaları için, bu aileden yalnızca bir parçaya ihtiyacınız olduğunda
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

Benzer şekilde, daha geniş şemsiye
yüzeye ihtiyaç duymadığınızda `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` ve
`openclaw/plugin-sdk/reply-chunking` yüzeylerini tercih edin.

Özellikle kurulum için:

- `openclaw/plugin-sdk/setup-runtime`, çalışma zamanı açısından güvenli kurulum yardımcılarını kapsar:
  import-safe setup patch bağdaştırıcıları (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), lookup-note çıktısı,
  `promptResolvedAllowFrom`, `splitSetupEntries` ve devredilen
  setup-proxy oluşturucuları
- `openclaw/plugin-sdk/setup-adapter-runtime`, `createEnvPatchedAccountSetupAdapter` için dar env-farkındalıklı bağdaştırıcı
  sınırıdır
- `openclaw/plugin-sdk/channel-setup`, isteğe bağlı kurulum oluşturucularını ve birkaç setup-safe ilkel öğeyi kapsar:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Kanalınız env güdümlü kurulum veya auth destekliyorsa ve genel startup/config
akışlarının çalışma zamanı yüklenmeden önce bu env adlarını bilmesi gerekiyorsa,
bunları Plugin manifest'inde `channelEnvVars` ile bildirin. Kanal çalışma zamanı `envVars` veya yerel sabitlerini
yalnızca operatöre dönük kopya için tutun.

Kanalınız çalışma zamanı Plugin'i başlamadan önce `status`, `channels list`, `channels status` veya
SecretRef taramalarında görünebiliyorsa `package.json` içine `openclaw.setupEntry` ekleyin.
Bu giriş noktası salt okunur komut yollarında içe aktarılmaya güvenli olmalı ve
bu özetler için gereken kanal meta verisini, setup-safe config bağdaştırıcısını, status bağdaştırıcısını ve kanal secret hedef meta verisini döndürmelidir. Setup girişinden istemciler, dinleyiciler veya taşıma çalışma zamanları başlatmayın.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` ve
`splitSetupEntries`

- daha ağır ortak setup/config yardımcılarına da ihtiyacınız varsa
  daha geniş `openclaw/plugin-sdk/setup` sınırını kullanın; örneğin
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Kanalınız yalnızca kurulum yüzeylerinde "önce bu Plugin'i kurun" demek istiyorsa
`createOptionalChannelSetupSurface(...)` tercih edin. Oluşturulan
adapter/wizard, config yazımlarında ve finalization aşamasında fail closed davranır ve
aynı install-required mesajını doğrulama, finalize ve docs-link
kopyasında yeniden kullanır.

Diğer sıcak kanal yolları için de daha geniş eski yüzeyler yerine dar yardımcıları tercih edin:

- çok hesaplı yapılandırma ve
  varsayılan hesap geri düşmesi için `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` ve
  `openclaw/plugin-sdk/account-helpers`
- gelen yol/zarf ve
  kaydet-ve-dispatch bağlaması için `openclaw/plugin-sdk/inbound-envelope` ve
  `openclaw/plugin-sdk/inbound-reply-dispatch`
- hedef ayrıştırma/eşleştirme için `openclaw/plugin-sdk/messaging-targets`
- medya yükleme ile giden
  kimlik/gönderim vekilleri ve yük planlaması için `openclaw/plugin-sdk/outbound-media` ve
  `openclaw/plugin-sdk/outbound-runtime`
- bir giden yol açık bir
  `replyToId`/`threadId` korumalıysa veya temel oturum anahtarı hâlâ eşleştiğinde geçerli `:thread:` oturumunu
  geri getirmeliyse,
  `openclaw/plugin-sdk/channel-core` içinden `buildThreadAwareOutboundSessionRoute(...)`.
  Sağlayıcı Plugin'leri, platformlarının yerel thread teslim semantiği varsa
  önceliği, sonek davranışını ve thread kimliği normalizasyonunu geçersiz kılabilir.
- thread-binding yaşam döngüsü
  ve bağdaştırıcı kaydı için `openclaw/plugin-sdk/thread-bindings-runtime`
- yalnızca eski bir ajan/medya
  yük alanı düzeni hâlâ gerekiyorsa `openclaw/plugin-sdk/agent-media-payload`
- Telegram özel komut
  normalizasyonu, yinelenen/çakışma doğrulaması ve geri düşmeye dayanıklı komut
  yapılandırma sözleşmesi için `openclaw/plugin-sdk/telegram-command-config`

Yalnızca auth odaklı kanallar genellikle varsayılan yolda durabilir: çekirdek onayları yönetir ve Plugin yalnızca giden/auth yeteneklerini açığa çıkarır. Matrix, Slack, Telegram ve özel sohbet taşıyıcıları gibi yerel onay kanalları, kendi onay yaşam döngülerini yazmak yerine ortak yerel yardımcıları kullanmalıdır.

## Gelen mention ilkesi

Gelen mention işlemeyi iki katmana ayrılmış tutun:

- Plugin'e ait kanıt toplama
- paylaşılan ilke değerlendirmesi

Mention ilkesi kararları için `openclaw/plugin-sdk/channel-mention-gating` kullanın.
Daha geniş gelen
yardımcı barrel'ine ihtiyacınız olduğunda yalnızca `openclaw/plugin-sdk/channel-inbound` kullanın.

Plugin'e yerel mantık için uygun olanlar:

- bota yanıt algılama
- bot alıntısı algılama
- thread katılım kontrolleri
- hizmet/sistem mesajı hariç tutmaları
- bot katılımını kanıtlamak için gereken platforma özgü önbellekler

Paylaşılan yardımcı için uygun olanlar:

- `requireMention`
- açık mention sonucu
- örtük mention allowlist'i
- komut atlaması
- son atlama kararı

Tercih edilen akış:

1. Yerel mention olgularını hesaplayın.
2. Bu olguları `resolveInboundMentionDecision({ facts, policy })` içine geçin.
3. Gelen geçidinizde `decision.effectiveWasMentioned`, `decision.shouldBypassMention` ve `decision.shouldSkip` kullanın.

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
paketlenmiş kanal Plugin'leri için aynı paylaşılan mention yardımcılarını açığa çıkarır:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Yalnızca `implicitMentionKindWhen` ve
`resolveInboundMentionDecision` gerekiyorsa,
ilişkisiz gelen çalışma zamanı yardımcılarını yüklememek için
`openclaw/plugin-sdk/channel-mention-gating` içinden içe aktarın.

Eski `resolveMentionGating*` yardımcıları,
yalnızca uyumluluk dışa aktarımları olarak
`openclaw/plugin-sdk/channel-inbound` üzerinde kalır. Yeni kod
`resolveInboundMentionDecision({ facts, policy })` kullanmalıdır.

## Adım adım uygulama

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket ve manifest">
    Standart Plugin dosyalarını oluşturun. `package.json` içindeki `channel` alanı,
    bunu bir kanal Plugin'i yapan şeydir. Tam paket meta verisi yüzeyi için
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
        "properties": {
          "acme-chat": {
            "type": "object",
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

  </Step>

  <Step title="Kanal Plugin nesnesini oluşturun">
    `ChannelPlugin` arayüzünün çok sayıda isteğe bağlı bağdaştırıcı yüzeyi vardır. En küçük
    setle başlayın — `id` ve `setup` — ve ihtiyaç duydukça bağdaştırıcılar ekleyin.

    `src/channel.ts` oluşturun:

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

      // DM güvenliği: botla kim mesajlaşabilir
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: yeni DM kişiler için onay akışı
      pairing: {
        text: {
          idLabel: "Acme Chat kullanıcı adı",
          message: "Kimliğinizi doğrulamak için bu kodu gönderin:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: yanıtlar nasıl teslim edilir
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: platforma mesaj gönderme
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

    <Accordion title="createChatChannelPlugin sizin için ne yapar">
      Düşük seviyeli bağdaştırıcı arayüzlerini elle uygulamak yerine
      bildirime dayalı seçenekler geçersiniz ve oluşturucu bunları birleştirir:

      | Seçenek | Bağladığı şey |
      | --- | --- |
      | `security.dm` | Yapılandırma alanlarından kapsamlı DM güvenliği çözümleyicisi |
      | `pairing.text` | Kod değişimi ile metin tabanlı DM Pairing akışı |
      | `threading` | Reply-to kip çözümleyicisi (sabit, hesap kapsamlı veya özel) |
      | `outbound.attachedResults` | Sonuç meta verisi döndüren gönderim işlevleri (mesaj kimlikleri) |

      Tam denetime ihtiyacınız varsa bildirime dayalı seçenekler yerine ham bağdaştırıcı nesneleri de geçebilirsiniz.
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

    Kanalın sahip olduğu CLI descriptor'larını `registerCliMetadata(...)` içine koyun; böylece OpenClaw
    tam kanal çalışma zamanını etkinleştirmeden bunları kök yardımda gösterebilir,
    normal tam yüklemeler ise gerçek komut kaydı için aynı descriptor'ları almaya devam eder.
    `registerFull(...)` ise yalnızca çalışma zamanına ait işler için kalsın.
    `registerFull(...)` Gateway RPC yöntemleri kaydediyorsa
    Plugin'e özgü bir önek kullanın. Çekirdek yönetici ad alanları (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) ayrılmıştır ve her zaman
    `operator.admin` olarak çözülür.
    `defineChannelPluginEntry`, kayıt modu ayrımını otomatik olarak yönetir. Tüm
    seçenekler için bkz.
    [Entry Points](/tr/plugins/sdk-entrypoints#definechannelpluginentry).

  </Step>

  <Step title="Bir setup girişi ekleyin">
    Onboarding sırasında hafif yükleme için `setup-entry.ts` oluşturun:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw, kanal devre dışıysa veya yapılandırılmamışsa tam giriş yerine bunu yükler.
    Bu, kurulum akışları sırasında ağır çalışma zamanı kodunun çekilmesini önler.
    Ayrıntılar için bkz. [Setup and Config](/tr/plugins/sdk-setup#setup-entry).

    Setup-safe dışa aktarımları yan modüllere bölen paketlenmiş çalışma alanı kanalları,
    açık bir setup zamanı çalışma zamanı ayarlayıcısına da ihtiyaç duyduklarında
    `openclaw/plugin-sdk/channel-entry-contract` içinden
    `defineBundledChannelSetupEntry(...)` kullanabilir.

  </Step>

  <Step title="Gelen mesajları işleyin">
    Plugin'inizin platformdan mesaj alıp bunları
    OpenClaw'a iletmesi gerekir. Tipik desen, isteği doğrulayan ve onu
    kanalınızın gelen işleyicisi üzerinden dispatch eden bir Webhook'tur:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // Plugin tarafından yönetilen kimlik doğrulama (imzaları kendiniz doğrulayın)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Gelen işleyiciniz mesajı OpenClaw'a dispatch eder.
          // Tam bağlama, platform SDK'nize bağlıdır —
          // gerçek bir örnek için paketlenmiş Microsoft Teams veya Google Chat Plugin paketine bakın.
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
      kendi gelen ardışık düzeninin sahibidir. Gerçek desenler için
      paketlenmiş kanal Plugin'lerine
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
      it("yapılandırmadan hesabı çözümler", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("gizli bilgileri gerçekleştirmeden hesabı inceler", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("eksik yapılandırmayı bildirir", () => {
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
├── openclaw.plugin.json      # Yapılandırma şemalı manifest
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Herkese açık dışa aktarımlar (isteğe bağlı)
├── runtime-api.ts            # İç çalışma zamanı dışa aktarımları (isteğe bağlı)
└── src/
    ├── channel.ts            # createChatChannelPlugin ile ChannelPlugin
    ├── channel.test.ts       # Testler
    ├── client.ts             # Platform API istemcisi
    └── runtime.ts            # Çalışma zamanı deposu (gerekiyorsa)
```

## Gelişmiş konular

<CardGroup cols={2}>
  <Card title="Threading seçenekleri" icon="git-branch" href="/tr/plugins/sdk-entrypoints#registration-mode">
    Sabit, hesap kapsamlı veya özel yanıt kipleri
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
</CardGroup>

<Note>
Bazı paketlenmiş yardımcı sınırlar, paketlenmiş Plugin bakımı ve
uyumluluk için hâlâ mevcuttur. Bunlar yeni kanal Plugin'leri için önerilen desen değildir;
o paketlenmiş Plugin ailesini doğrudan sürdürmüyorsanız,
daha geniş ortak SDK yüzeyi içindeki genel channel/setup/reply/runtime alt yollarını tercih edin.
</Note>

## Sonraki adımlar

- [Provider Plugins](/tr/plugins/sdk-provider-plugins) — Plugin'iniz aynı zamanda model de sağlıyorsa
- [SDK Overview](/tr/plugins/sdk-overview) — tam alt yol içe aktarma başvurusu
- [SDK Testing](/tr/plugins/sdk-testing) — test yardımcıları ve sözleşme testleri
- [Plugin Manifest](/tr/plugins/manifest) — tam manifest şeması

## İlgili

- [Plugin SDK setup](/tr/plugins/sdk-setup)
- [Building plugins](/tr/plugins/building-plugins)
- [Agent harness plugins](/tr/plugins/sdk-agent-harness)

---
read_when:
    - Yeni bir mesajlaşma kanal plugin'i oluşturuyorsunuz
    - OpenClaw'ı bir mesajlaşma platformuna bağlamak istiyorsunuz
    - ChannelPlugin bağdaştırıcı yüzeyini anlamanız gerekiyor
sidebarTitle: Channel Plugins
summary: OpenClaw için bir mesajlaşma kanal plugin'i oluşturma adım adım kılavuzu
title: Kanal Plugin'leri Oluşturma
x-i18n:
    generated_at: "2026-04-22T04:24:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: f08bf785cd2e16ed6ce0317f4fd55c9eccecf7476d84148ad47e7be516dd71fb
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Kanal Plugin'leri Oluşturma

Bu kılavuz, OpenClaw'ı bir
mesajlaşma platformuna bağlayan bir kanal plugin'i oluşturmayı adım adım anlatır. Sonunda DM güvenliği,
eşleştirme, yanıt dizileme ve giden mesajlaşma ile çalışan bir kanalınız olacak.

<Info>
  Daha önce hiç OpenClaw plugin'i oluşturmadıysanız, önce temel paket
  yapısı ve manifest kurulumu için [Başlangıç](/tr/plugins/building-plugins) belgesini okuyun.
</Info>

## Kanal plugin'leri nasıl çalışır

Kanal plugin'lerinin kendi gönder/düzenle/tepki ver araçlarına ihtiyacı yoktur. OpenClaw,
core içinde tek bir paylaşılan `message` aracı tutar. Plugin'iniz şunlardan sorumludur:

- **Yapılandırma** — hesap çözümleme ve kurulum sihirbazı
- **Güvenlik** — DM ilkesi ve izin listeleri
- **Eşleştirme** — DM onay akışı
- **Oturum dil bilgisi** — sağlayıcıya özgü konuşma kimliklerinin temel sohbetlere, ileti dizisi kimliklerine ve üst geri dönüşlere nasıl eşlendiği
- **Giden işlemler** — platforma metin, medya ve anket gönderimi
- **Dizileme** — yanıtların nasıl dizilendiği

Core; paylaşılan message aracına, prompt bağlamasına, dış oturum-anahtarı biçimine,
genel `:thread:` muhasebesine ve dispatch'e sahiptir.

Kanalınız medya kaynakları taşıyan message-tool parametreleri ekliyorsa, bu
parametre adlarını `describeMessageTool(...).mediaSourceParams` üzerinden açığa çıkarın. Core,
korumalı alan yol normalizasyonu ve giden medya erişim
ilkesi için bu açık listeyi kullanır; böylece plugin'lerin sağlayıcıya özgü
avatar, ek veya kapak görseli parametreleri için paylaşılan core özel durumlarına ihtiyacı kalmaz.
Tercihen şu gibi eylem anahtarlı bir eşleme döndürün:
`{ "set-profile": ["avatarUrl", "avatarPath"] }`; böylece ilgisiz eylemler başka bir eylemin
medya parametrelerini miras almaz. Düz bir dizi ise kasıtlı olarak
açığa çıkarılan her eylem arasında paylaşılan parametreler için hâlâ çalışır.

Platformunuz konuşma kimlikleri içinde ek kapsam tutuyorsa, bu ayrıştırmayı
plugin içinde `messaging.resolveSessionConversation(...)` ile tutun. Bu, `rawId` değerini
temel konuşma kimliğine, isteğe bağlı ileti dizisi kimliğine, açık `baseConversationId`
değerine ve herhangi bir `parentConversationCandidates` değerine eşlemek için
kanonik kancadır.
`parentConversationCandidates` döndürdüğünüzde bunları en dar üst öğeden
en geniş/temel konuşmaya doğru sıralı tutun.

Kayıt defteri önyüklenmeden önce aynı ayrıştırmaya ihtiyaç duyan paketlenmiş plugin'ler
ayrıca eşleşen bir
`resolveSessionConversation(...)` dışa aktarımıyla üst düzey bir `session-key-api.ts` dosyası da sunabilir.
Core, çalışma zamanı plugin kayıt defteri henüz kullanılamadığında bu önyükleme güvenli yüzeyi
yalnızca o zaman kullanır.

`messaging.resolveParentConversationCandidates(...)`, bir plugin yalnızca
genel/ham kimliğin üstüne üst geri dönüşlere ihtiyaç duyduğunda eski uyumluluk amaçlı geri dönüş olarak kullanılabilir.
Her iki kanca da varsa core önce
`resolveSessionConversation(...).parentConversationCandidates` değerini kullanır ve kanonik kanca
bunları atladığında ancak o zaman `resolveParentConversationCandidates(...)` değerine geri döner.

## Onaylar ve kanal yetenekleri

Çoğu kanal plugin'inin onaya özgü koda ihtiyacı yoktur.

- Core; aynı sohbette `/approve`, paylaşılan onay düğmesi payload'ları ve genel geri dönüş tesliminden sorumludur.
- Kanal onaya özgü davranış gerektiriyorsa kanal plugin'i üzerinde tek bir `approvalCapability` nesnesini tercih edin.
- `ChannelPlugin.approvals` kaldırılmıştır. Onay teslimi/yerel oluşturma/kimlik doğrulama bilgilerini `approvalCapability` üzerine koyun.
- `plugin.auth` yalnızca login/logout içindir; core artık bu nesneden onay kimlik doğrulama kancalarını okumaz.
- `approvalCapability.authorizeActorAction` ve `approvalCapability.getActionAvailabilityState`, kanonik onay-kimlik doğrulama seam'idir.
- Aynı sohbet onay kimlik doğrulama kullanılabilirliği için `approvalCapability.getActionAvailabilityState` kullanın.
- Kanalınız yerel exec onaylarını açığa çıkarıyorsa, başlatan yüzey/yerel istemci durumu aynı sohbet onay kimlik doğrulamasından farklı olduğunda `approvalCapability.getExecInitiatingSurfaceState` kullanın. Core bu exec'e özgü kancayı `enabled` ile `disabled` ayrımını yapmak, başlatan kanalın yerel exec onaylarını destekleyip desteklemediğine karar vermek ve kanalı yerel istemci geri dönüş yönlendirmesine dahil etmek için kullanır. `createApproverRestrictedNativeApprovalCapability(...)`, yaygın durum için bunu doldurur.
- Yinelenen yerel onay istemlerini gizleme veya teslimden önce yazma göstergeleri gönderme gibi kanala özgü payload yaşam döngüsü davranışları için `outbound.shouldSuppressLocalPayloadPrompt` veya `outbound.beforeDeliverPayload` kullanın.
- `approvalCapability.delivery` yalnızca yerel onay yönlendirmesi veya geri dönüş bastırması için kullanın.
- Kanala ait yerel onay gerçekleri için `approvalCapability.nativeRuntime` kullanın. Core'un onay yaşam döngüsünü kurmasına izin verirken çalışma zamanı modülünüzü isteğe bağlı olarak içe aktarabilen `createLazyChannelApprovalNativeRuntimeAdapter(...)` ile bunu sıcak kanal giriş noktalarında tembel tutun.
- `approvalCapability.render` yalnızca bir kanalın gerçekten paylaşılan oluşturucu yerine özel onay payload'larına ihtiyacı olduğunda kullanın.
- Devre dışı yol yanıtının yerel exec onaylarını etkinleştirmek için gereken tam yapılandırma düğmelerini açıklamasını istiyorsa `approvalCapability.describeExecApprovalSetup` kullanın. Kanca `{ channel, channelLabel, accountId }` alır; adlandırılmış hesaplı kanallar üst düzey varsayılanlar yerine `channels.<channel>.accounts.<id>.execApprovals.*` gibi hesap kapsamlı yollar oluşturmalıdır.
- Bir kanal mevcut yapılandırmadan kararlı sahip benzeri DM kimliklerini çıkarabiliyorsa, onaya özgü core mantığı eklemeden aynı sohbette `/approve` kısıtlaması yapmak için `openclaw/plugin-sdk/approval-runtime` içinden `createResolvedApproverActionAuthAdapter` kullanın.
- Bir kanal yerel onay teslimine ihtiyaç duyuyorsa, kanal kodunu hedef normalizasyonu ile taşıma/sunum gerçeklerine odaklı tutun. `openclaw/plugin-sdk/approval-runtime` içinden `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` ve `createApproverRestrictedNativeApprovalCapability` kullanın. Kanala özgü gerçekleri `approvalCapability.nativeRuntime` arkasına, tercihen `createChannelApprovalNativeRuntimeAdapter(...)` veya `createLazyChannelApprovalNativeRuntimeAdapter(...)` üzerinden koyun; böylece core işleyiciyi kurabilir ve istek filtreleme, yönlendirme, tekrar engelleme, süre sonu, Gateway aboneliği ve başka yere yönlendirildi bildirimlerinden sorumlu olabilir. `nativeRuntime` birkaç küçük seam'e ayrılmıştır:
- `availability` — hesabın yapılandırılmış olup olmadığı ve bir isteğin işlenip işlenmemesi gerektiği
- `presentation` — paylaşılan onay görünüm modelini beklemede/çözüldü/süresi doldu yerel payload'larına veya son eylemlere eşleme
- `transport` — hedefleri hazırlama ile yerel onay mesajlarını gönderme/güncelleme/silme
- `interactions` — yerel düğmeler veya tepkiler için isteğe bağlı bağla/bağlantıyı kaldır/eylem temizle kancaları
- `observe` — isteğe bağlı teslim tanılama kancaları
- Kanalın istemci, token, Bolt uygulaması veya Webhook alıcısı gibi çalışma zamanına ait nesnelere ihtiyacı varsa bunları `openclaw/plugin-sdk/channel-runtime-context` üzerinden kaydedin. Genel runtime-context kayıt defteri, core'un onaya özgü sarmalayıcı glue eklemeden kanal başlangıç durumundan yetenek güdümlü işleyicileri önyüklemesine izin verir.
- Yalnızca yetenek güdümlü seam henüz yeterince ifade gücüne sahip değilse daha alt seviye `createChannelApprovalHandler` veya `createChannelNativeApprovalRuntime` kullanın.
- Yerel onay kanalları, `accountId` ve `approvalKind` değerlerinin ikisini de bu yardımcılar üzerinden yönlendirmelidir. `accountId`, çok hesaplı onay ilkesini doğru bot hesabına kapsamlar; `approvalKind` ise exec ile plugin onay davranışını core içindeki sabit dallanmalar olmadan kanal için kullanılabilir tutar.
- Core artık onay yeniden yönlendirme bildirimlerinin de sahibidir. Kanal plugin'leri `createChannelNativeApprovalRuntime` içinden kendi "onay DM'lere / başka bir kanala gitti" takip mesajlarını göndermemelidir; bunun yerine paylaşılan onay yeteneği yardımcıları üzerinden doğru origin + approver-DM yönlendirmesini açığa çıkarın ve core'un başlatan sohbete herhangi bir bildirim göndermeden önce gerçek teslimleri toplamasına izin verin.
- Teslim edilen onay kimliği türünü uçtan uca koruyun. Yerel istemciler exec ile plugin onay yönlendirmesini kanal yerel durumundan tahmin etmemeli veya yeniden yazmamalıdır.
- Farklı onay türleri kasıtlı olarak farklı yerel yüzeyler açığa çıkarabilir.
  Geçerli paketlenmiş örnekler:
  - Slack, hem exec hem de plugin kimlikleri için yerel onay yönlendirmesini kullanılabilir tutar.
  - Matrix, exec ve plugin onayları için aynı yerel DM/kanal yönlendirmesi ile tepki UX'ini korurken, kimlik doğrulamanın onay türüne göre farklılaşmasına yine de izin verir.
- `createApproverRestrictedNativeApprovalAdapter` hâlâ bir uyumluluk sarmalayıcısı olarak vardır, ancak yeni kodlar yetenek oluşturucuyu tercih etmeli ve plugin üzerinde `approvalCapability` açığa çıkarmalıdır.

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
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` ve
`openclaw/plugin-sdk/reply-chunking` yollarını tercih edin.

Özellikle kurulum için:

- `openclaw/plugin-sdk/setup-runtime`, çalışma zamanı güvenli kurulum yardımcılarını kapsar:
  içe aktarma güvenli kurulum yama bağdaştırıcıları (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), lookup-note çıktısı,
  `promptResolvedAllowFrom`, `splitSetupEntries` ve devredilmiş
  setup-proxy oluşturucuları
- `openclaw/plugin-sdk/setup-adapter-runtime`, `createEnvPatchedAccountSetupAdapter`
  için dar env-farkında bağdaştırıcı seam'idir
- `openclaw/plugin-sdk/channel-setup`, isteğe bağlı kurulum setup
  oluşturucularını ve birkaç setup-safe ilkel öğeyi kapsar:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Kanalınız env güdümlü kurulumu veya kimlik doğrulamayı destekliyorsa ve genel başlangıç/yapılandırma
akışlarının çalışma zamanı yüklenmeden önce bu env adlarını bilmesi gerekiyorsa,
bunları plugin manifest içinde `channelEnvVars` ile bildirin. Kanal çalışma zamanı `envVars` değerlerini veya
yerel sabitleri yalnızca operatör odaklı kopya için tutun.

Kanalınız plugin çalışma zamanı başlamadan önce `status`, `channels list`, `channels status` veya
SecretRef taramalarında görünebiliyorsa, `package.json` içine `openclaw.setupEntry` ekleyin.
Bu giriş noktası, salt okunur komut yollarında içe aktarılmaya güvenli olmalı
ve bu özetler için gereken kanal meta verisini, setup-safe yapılandırma bağdaştırıcısını,
durum bağdaştırıcısını ve kanal gizli hedef meta verisini döndürmelidir. Kurulum girişinden
istemci, dinleyici veya taşıma çalışma zamanlarını başlatmayın.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` ve
`splitSetupEntries`

- yalnızca daha ağır paylaşılan kurulum/yapılandırma yardımcılarına da
  ihtiyacınız olduğunda daha geniş `openclaw/plugin-sdk/setup` seam'ini kullanın; örneğin
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Kanalınız yalnızca kurulum yüzeylerinde "önce bu plugin'i kurun" mesajını
duyurmak istiyorsa, `createOptionalChannelSetupSurface(...)` tercih edin. Oluşturulan
bağdaştırıcı/sihirbaz, yapılandırma yazımlarında ve sonlandırmada fail-closed davranır; ayrıca
aynı kurulum-gerekli mesajını doğrulama, sonlandırma ve docs-link
kopyasında yeniden kullanır.

Diğer sıcak kanal yolları için, daha geniş eski yüzeyler yerine dar yardımcıları tercih edin:

- çok hesaplı yapılandırma ve
  varsayılan hesap geri dönüşü için `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` ve
  `openclaw/plugin-sdk/account-helpers`
- gelen rota/zarf ve
  kaydet-ve-dispatch bağlaması için `openclaw/plugin-sdk/inbound-envelope` ve
  `openclaw/plugin-sdk/inbound-reply-dispatch`
- hedef ayrıştırma/eşleştirme için `openclaw/plugin-sdk/messaging-targets`
- medya yükleme ile giden
  kimlik/gönderim temsilcileri ve payload planlaması için `openclaw/plugin-sdk/outbound-media` ve
  `openclaw/plugin-sdk/outbound-runtime`
- bir giden rota açık bir `replyToId`/`threadId` değerini korumalıysa veya
  temel oturum anahtarı hâlâ eşleşirken mevcut `:thread:` oturumunu geri kazanmalıysa
  `openclaw/plugin-sdk/channel-core` içinden `buildThreadAwareOutboundSessionRoute(...)`.
  Sağlayıcı plugin'leri, platformlarının yerel ileti dizisi teslim anlambilimi
  olduğunda önceliği, sonek davranışını ve ileti dizisi kimliği normalizasyonunu geçersiz kılabilir.
- ileti dizisi bağlama yaşam döngüsü
  ve bağdaştırıcı kaydı için `openclaw/plugin-sdk/thread-bindings-runtime`
- yalnızca eski bir agent/medya
  payload alan düzeni hâlâ gerekiyorsa `openclaw/plugin-sdk/agent-media-payload`
- Telegram özel komut
  normalizasyonu, yinelenen/çakışma doğrulaması ve geri dönüşte kararlı komut
  yapılandırma sözleşmesi için `openclaw/plugin-sdk/telegram-command-config`

Yalnızca kimlik doğrulama yapan kanallar genelde varsayılan yolda durabilir: onayları core yönetir ve plugin yalnızca giden/kimlik doğrulama yeteneklerini açığa çıkarır. Matrix, Slack, Telegram ve özel sohbet taşıma katmanları gibi yerel onay kanalları, kendi onay yaşam döngülerini yazmak yerine paylaşılan yerel yardımcıları kullanmalıdır.

## Gelen mention ilkesi

Gelen mention işleme mantığını iki katmana bölünmüş tutun:

- plugin'e ait kanıt toplama
- paylaşılan ilke değerlendirmesi

Mention ilkesi kararları için `openclaw/plugin-sdk/channel-mention-gating` kullanın.
Daha geniş gelen
yardımcı barrel'ına ihtiyaç duyduğunuzda yalnızca `openclaw/plugin-sdk/channel-inbound` kullanın.

Plugin yerel mantığı için uygun örnekler:

- bota yanıt tespiti
- bottan alıntı tespiti
- ileti dizisine katılım kontrolleri
- servis/sistem mesajı dışlamaları
- bot katılımını kanıtlamak için gereken platforma özgü yerel önbellekler

Paylaşılan yardımcı için uygun örnekler:

- `requireMention`
- açık mention sonucu
- örtük mention izin listesi
- komut baypası
- son atlama kararı

Tercih edilen akış:

1. Yerel mention olgularını hesaplayın.
2. Bu olguları `resolveInboundMentionDecision({ facts, policy })` içine geçin.
3. Gelen geçidinizde `decision.effectiveWasMentioned`, `decision.shouldBypassMention` ve `decision.shouldSkip` değerlerini kullanın.

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

`api.runtime.channel.mentions`, çalışma zamanı enjeksiyonuna zaten bağlı olan
paketlenmiş kanal plugin'leri için aynı paylaşılan mention yardımcılarını açığa çıkarır:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Yalnızca `implicitMentionKindWhen` ve
`resolveInboundMentionDecision` kullanmanız gerekiyorsa,
ilgili olmayan gelen çalışma zamanı yardımcılarını yüklemekten kaçınmak için
`openclaw/plugin-sdk/channel-mention-gating` içinden içe aktarın.

Eski `resolveMentionGating*` yardımcıları yalnızca uyumluluk dışa aktarımları olarak
`openclaw/plugin-sdk/channel-inbound` üzerinde kalmaktadır. Yeni kod
`resolveInboundMentionDecision({ facts, policy })` kullanmalıdır.

## Adım adım anlatım

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket ve manifest">
    Standart plugin dosyalarını oluşturun. `package.json` içindeki `channel` alanı,
    bunu bir kanal plugin'i yapan alandır. Tam paket meta veri yüzeyi için
    bkz. [Plugin Kurulumu ve Yapılandırma](/tr/plugins/sdk-setup#openclaw-channel):

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
      "description": "Acme Chat kanal plugin'i",
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

  <Step title="Kanal plugin nesnesini oluşturun">
    `ChannelPlugin` arayüzünde birçok isteğe bağlı bağdaştırıcı yüzeyi vardır. En az
    düzey olan `id` ve `setup` ile başlayın ve ihtiyaç duydukça bağdaştırıcılar ekleyin.

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

      // DM güvenliği: bot'a kim mesaj gönderebilir
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
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Dizileme: yanıtlar nasıl teslim edilir
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

    <Accordion title="createChatChannelPlugin sizin için ne yapar">
      Düşük seviyeli bağdaştırıcı arayüzlerini elle uygulamak yerine
      bildirimsel seçenekler verirsiniz ve oluşturucu bunları birleştirir:

      | Seçenek | Bağladığı şey |
      | --- | --- |
      | `security.dm` | Yapılandırma alanlarından kapsamlı DM güvenlik çözümleyicisi |
      | `pairing.text` | Kod değişimi ile metin tabanlı DM eşleştirme akışı |
      | `threading` | Reply-to-mode çözümleyicisi (sabit, hesap kapsamlı veya özel) |
      | `outbound.attachedResults` | Sonuç meta verisi döndüren gönderim işlevleri (mesaj kimlikleri) |

      Tam denetime ihtiyacınız varsa bildirimsel seçenekler yerine ham bağdaştırıcı nesneleri de geçebilirsiniz.
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
      description: "Acme Chat kanal plugin'i",
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

    Kanalın sahip olduğu CLI tanımlayıcılarını `registerCliMetadata(...)` içine koyun; böylece OpenClaw
    tam kanal çalışma zamanını etkinleştirmeden kök yardım ekranında bunları gösterebilir,
    normal tam yüklemeler de gerçek komut
    kaydı için aynı tanımlayıcıları alır. `registerFull(...)` alanını yalnızca çalışma zamanına özgü işler için tutun.
    Eğer `registerFull(...)` Gateway RPC yöntemleri kaydediyorsa,
    plugin'e özgü bir önek kullanın. Core yönetici ad alanları (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) ayrılmıştır ve her zaman
    `operator.admin` çözümüne gider.
    `defineChannelPluginEntry`, kayıt modu ayrımını otomatik olarak yönetir. Tüm
    seçenekler için bkz. [Giriş Noktaları](/tr/plugins/sdk-entrypoints#definechannelpluginentry).

  </Step>

  <Step title="Bir setup girişi ekleyin">
    Onboarding sırasında hafif yükleme için `setup-entry.ts` oluşturun:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw, kanal devre dışıyken
    veya yapılandırılmamışken tam giriş yerine bunu yükler.
    Bu, setup akışları sırasında ağır çalışma zamanı kodunun çekilmesini önler.
    Ayrıntılar için bkz. [Kurulum ve Yapılandırma](/tr/plugins/sdk-setup#setup-entry).

    Setup-safe dışa aktarımları yan modüllere ayıran paketlenmiş çalışma alanı kanalları,
    açık bir setup zamanı çalışma zamanı ayarlayıcısına da ihtiyaç duyduklarında
    `openclaw/plugin-sdk/channel-entry-contract` içinden
    `defineBundledChannelSetupEntry(...)` kullanabilir.

  </Step>

  <Step title="Gelen mesajları işleyin">
    Plugin'inizin platformdan mesaj alması ve bunları
    OpenClaw'a iletmesi gerekir. Tipik desen, isteği doğrulayan ve
    kendi kanalınızın gelen işleyicisi üzerinden dispatch eden bir Webhook'tir:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin tarafından yönetilen kimlik doğrulama (imzaları kendiniz doğrulayın)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Gelen işleyiciniz mesajı OpenClaw'a dispatch eder.
          // Kesin bağlama platform SDK'nıza bağlıdır —
          // gerçek bir örnek için paketlenmiş Microsoft Teams veya Google Chat plugin paketine bakın.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Gelen mesaj işleme kanala özgüdür. Her kanal plugin'i
      kendi gelen işlem hattına sahiptir. Gerçek desenler için paketlenmiş kanal plugin'lerine
      (örneğin Microsoft Teams veya Google Chat plugin paketi) bakın.
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

      it("gizli bilgileri somutlaştırmadan hesabı inceler", () => {
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
├── openclaw.plugin.json      # Yapılandırma şeması içeren manifest
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Herkese açık dışa aktarımlar (isteğe bağlı)
├── runtime-api.ts            # İç çalışma zamanı dışa aktarımları (isteğe bağlı)
└── src/
    ├── channel.ts            # createChatChannelPlugin aracılığıyla ChannelPlugin
    ├── channel.test.ts       # Testler
    ├── client.ts             # Platform API istemcisi
    └── runtime.ts            # Çalışma zamanı deposu (gerekirse)
```

## Gelişmiş konular

<CardGroup cols={2}>
  <Card title="Dizileme seçenekleri" icon="git-branch" href="/tr/plugins/sdk-entrypoints#registration-mode">
    Sabit, hesap kapsamlı veya özel yanıt kipleri
  </Card>
  <Card title="Mesaj aracı entegrasyonu" icon="puzzle" href="/tr/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool ve eylem keşfi
  </Card>
  <Card title="Hedef çözümleme" icon="crosshair" href="/tr/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Çalışma zamanı yardımcıları" icon="settings" href="/tr/plugins/sdk-runtime">
    api.runtime aracılığıyla TTS, STT, medya, alt agent
  </Card>
</CardGroup>

<Note>
Bazı paketlenmiş yardımcı seam'leri, paketlenmiş plugin bakımı ve
uyumluluk için hâlâ vardır. Bunlar yeni kanal plugin'leri için önerilen desen değildir;
o paketlenmiş plugin ailesini doğrudan korumuyorsanız ortak SDK
yüzeyinden genel channel/setup/reply/runtime alt yollarını tercih edin.
</Note>

## Sonraki adımlar

- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) — plugin'iniz ayrıca modeller de sağlıyorsa
- [SDK Genel Bakışı](/tr/plugins/sdk-overview) — tam alt yol içe aktarma başvurusu
- [SDK Testing](/tr/plugins/sdk-testing) — test yardımcıları ve sözleşme testleri
- [Plugin Manifest](/tr/plugins/manifest) — tam manifest şeması

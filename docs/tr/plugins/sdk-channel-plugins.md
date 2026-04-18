---
read_when:
    - Yeni bir mesajlaşma kanalı Plugin'i oluşturuyorsunuz
    - OpenClaw’u bir mesajlaşma platformuna bağlamak istiyorsunuz
    - ChannelPlugin bağdaştırıcı yüzeyini anlamanız gerekiyor
sidebarTitle: Channel Plugins
summary: OpenClaw için bir mesajlaşma kanalı Plugin'i oluşturma adım adım kılavuzu
title: Kanal Plugin'leri Oluşturma
x-i18n:
    generated_at: "2026-04-18T08:32:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3dda53c969bc7356a450c2a5bf49fb82bf1283c23e301dec832d8724b11e724b
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Kanal Plugin'leri Oluşturma

Bu kılavuz, OpenClaw’u bir mesajlaşma platformuna bağlayan bir kanal Plugin'i oluşturma sürecini adım adım açıklar. Sonunda DM güvenliği, eşleme, yanıt iş parçacığı oluşturma ve dışa giden mesajlaşma özelliklerine sahip çalışan bir kanalınız olacak.

<Info>
  Daha önce herhangi bir OpenClaw Plugin'i oluşturmadıysanız, temel paket
  yapısı ve manifest kurulumu için önce [Başlangıç](/tr/plugins/building-plugins)
  bölümünü okuyun.
</Info>

## Kanal Plugin'leri nasıl çalışır

Kanal Plugin'lerinin kendi send/edit/react araçlarına ihtiyacı yoktur. OpenClaw, çekirdekte tek bir ortak `message` aracı tutar. Plugin'iniz şu alanlardan sorumludur:

- **Yapılandırma** — hesap çözümleme ve kurulum sihirbazı
- **Güvenlik** — DM ilkesi ve izin listeleri
- **Eşleme** — DM onay akışı
- **Oturum dil bilgisi** — sağlayıcıya özgü konuşma kimliklerinin temel sohbetlere, iş parçacığı kimliklerine ve üst kapsayıcı geri dönüşlerine nasıl eşlendiği
- **Dışa giden** — platforma metin, medya ve anket gönderme
- **İş parçacığı oluşturma** — yanıtların nasıl iş parçacığına bağlandığı

Çekirdek; ortak mesaj aracından, istem kablolamasından, dış oturum anahtarı şeklinden, genel `:thread:` takibinden ve sevkten sorumludur.

Kanalınız medya kaynakları taşıyan message-tool parametreleri ekliyorsa, bu parametre adlarını `describeMessageTool(...).mediaSourceParams` üzerinden açığa çıkarın. Çekirdek, bu açık listeyi sandbox yol normalleştirmesi ve dışa giden medya erişim ilkesi için kullanır; böylece Plugin'lerin sağlayıcıya özgü avatar, ek veya kapak görseli parametreleri için paylaşılan çekirdekte özel durumlar kullanması gerekmez.
Tercihen şu gibi bir eylem anahtarlı eşleme döndürün:
`{ "set-profile": ["avatarUrl", "avatarPath"] }`; böylece ilişkisiz eylemler başka bir eylemin medya argümanlarını devralmaz. Her açığa çıkarılan eylem arasında bilinçli olarak paylaşılan parametreler için düz bir dizi de çalışır.

Platformunuz ek kapsamı konuşma kimliklerinin içinde saklıyorsa, bu ayrıştırmayı `messaging.resolveSessionConversation(...)` ile Plugin içinde tutun. Bu, `rawId` değerini temel konuşma kimliğine, isteğe bağlı iş parçacığı kimliğine, açık `baseConversationId` değerine ve varsa `parentConversationCandidates` değerlerine eşlemek için kanonik kancadır.
`parentConversationCandidates` döndürdüğünüzde, bunları en dar üst kapsayıcıdan en geniş/temel konuşmaya doğru sıralı tutun.

Kanal kayıt defteri başlatılmadan önce aynı ayrıştırmaya ihtiyaç duyan paketlenmiş Plugin'ler, eşleşen bir `resolveSessionConversation(...)` dışa aktarımıyla üst düzey bir `session-key-api.ts` dosyası da sunabilir. Çekirdek, çalışma zamanı Plugin kayıt defteri henüz mevcut olmadığında yalnızca bu önyükleme açısından güvenli yüzeyi kullanır.

`messaging.resolveParentConversationCandidates(...)`, bir Plugin yalnızca genel/raw kimliğin üstüne üst kapsayıcı geri dönüşlerine ihtiyaç duyduğunda eski uyumluluk amaçlı geri dönüş olarak kullanılmaya devam eder. Her iki kanca da varsa, çekirdek önce `resolveSessionConversation(...).parentConversationCandidates` değerini kullanır ve yalnızca kanonik kanca bunları atladığında `resolveParentConversationCandidates(...)` kullanımına geri döner.

## Onaylar ve kanal yetenekleri

Çoğu kanal Plugin'inin onaya özgü koda ihtiyacı yoktur.

- Çekirdek; aynı sohbette `/approve`, paylaşılan onay düğmesi yükleri ve genel geri dönüş teslimatından sorumludur.
- Kanalın onaya özgü davranışa ihtiyaç duyduğu durumlarda, kanal Plugin'inde tek bir `approvalCapability` nesnesi tercih edin.
- `ChannelPlugin.approvals` kaldırılmıştır. Onay teslimatı/yerel işleme/görüntüleme/yetkilendirme bilgilerini `approvalCapability` içine koyun.
- `plugin.auth` yalnızca giriş/çıkış içindir; çekirdek artık bu nesneden onay kimlik doğrulama kancalarını okumaz.
- `approvalCapability.authorizeActorAction` ve `approvalCapability.getActionAvailabilityState`, kanonik onay kimlik doğrulama bağlantı yüzeyidir.
- Aynı sohbet içi onay kimlik doğrulama kullanılabilirliği için `approvalCapability.getActionAvailabilityState` kullanın.
- Kanalınız yerel exec onaylarını açığa çıkarıyorsa ve başlatan yüzey/yerel istemci durumu aynı sohbet onay kimlik doğrulamasından farklıysa, `approvalCapability.getExecInitiatingSurfaceState` kullanın. Çekirdek, bu exec'e özgü kancayı `enabled` ile `disabled` arasını ayırt etmek, başlatan kanalın yerel exec onaylarını destekleyip desteklemediğine karar vermek ve kanalı yerel istemci geri dönüş yönlendirmesine dahil etmek için kullanır. `createApproverRestrictedNativeApprovalCapability(...)`, yaygın durum için bunu doldurur.
- Yinelenen yerel onay istemlerini gizleme veya teslimattan önce yazıyor göstergeleri gönderme gibi kanala özgü yük yaşam döngüsü davranışları için `outbound.shouldSuppressLocalPayloadPrompt` ya da `outbound.beforeDeliverPayload` kullanın.
- `approvalCapability.delivery` değerini yalnızca yerel onay yönlendirmesi veya geri dönüş bastırma için kullanın.
- Kanala ait yerel onay olguları için `approvalCapability.nativeRuntime` kullanın. Çekirdeğin onay yaşam döngüsünü yine de bir araya getirmesine izin verirken çalışma zamanı modülünüzü isteğe bağlı içe aktarabilen `createLazyChannelApprovalNativeRuntimeAdapter(...)` ile bunu sıcak kanal giriş noktalarında tembel tutun.
- Bir kanalın gerçekten paylaşılan görüntüleyici yerine özel onay yüklerine ihtiyacı olduğunda yalnızca `approvalCapability.render` kullanın.
- Kanal, devre dışı yol yanıtının yerel exec onaylarını etkinleştirmek için gereken tam yapılandırma ayarlarını açıklamasını istiyorsa `approvalCapability.describeExecApprovalSetup` kullanın. Kanca `{ channel, channelLabel, accountId }` alır; adlandırılmış hesaplı kanallar `channels.<channel>.accounts.<id>.execApprovals.*` gibi hesap kapsamlı yolları üst düzey varsayılanlar yerine görüntülemelidir.
- Bir kanal, mevcut yapılandırmadan kararlı sahip benzeri DM kimliklerini çıkarabiliyorsa, onaya özgü çekirdek mantığı eklemeden aynı sohbet `/approve` işlemini kısıtlamak için `openclaw/plugin-sdk/approval-runtime` içinden `createResolvedApproverActionAuthAdapter` kullanın.
- Kanalın yerel onay teslimatına ihtiyacı varsa, kanal kodunu hedef normalleştirme ile taşıma/sunum bilgilerine odaklı tutun. `openclaw/plugin-sdk/approval-runtime` içinden `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` ve `createApproverRestrictedNativeApprovalCapability` kullanın. Kanala özgü olguları, ideal olarak `createChannelApprovalNativeRuntimeAdapter(...)` ya da `createLazyChannelApprovalNativeRuntimeAdapter(...)` üzerinden `approvalCapability.nativeRuntime` arkasına koyun; böylece çekirdek işleyiciyi bir araya getirebilir ve istek filtreleme, yönlendirme, yineleme giderme, süre sonu, Gateway aboneliği ve başka yere yönlendirilmiş bildirimlerden sorumlu olabilir. `nativeRuntime` birkaç küçük bağlantı yüzeyine ayrılmıştır:
- `availability` — hesabın yapılandırılıp yapılandırılmadığı ve bir isteğin işlenip işlenmemesi gerektiği
- `presentation` — paylaşılan onay görünüm modelini beklemede/çözümlendi/süresi doldu yerel yüklerine ya da son eylemlere eşleme
- `transport` — hedefleri hazırlama ve yerel onay mesajlarını gönderme/güncelleme/silme
- `interactions` — yerel düğmeler veya tepkiler için isteğe bağlı bağlama/bağdan çıkarma/eylem temizleme kancaları
- `observe` — isteğe bağlı teslimat tanılama kancaları
- Kanalın istemci, belirteç, Bolt uygulaması veya Webhook alıcısı gibi çalışma zamanına ait nesnelere ihtiyacı varsa, bunları `openclaw/plugin-sdk/channel-runtime-context` üzerinden kaydedin. Genel runtime-context kayıt defteri, çekirdeğin onaya özgü sarmalayıcı yapıştırıcısı eklemeden kanal başlangıç durumundan yetenek odaklı işleyicileri önyüklemesine olanak tanır.
- Daha alt düzey `createChannelApprovalHandler` veya `createChannelNativeApprovalRuntime` araçlarına yalnızca yetenek odaklı bağlantı yüzeyi henüz yeterince ifade gücüne sahip olmadığında başvurun.
- Yerel onay kanalları, hem `accountId` hem de `approvalKind` değerini bu yardımcılar üzerinden yönlendirmelidir. `accountId`, çok hesaplı onay ilkesini doğru bot hesabı kapsamında tutar ve `approvalKind`, çekirdekte sabit dallanmalar olmadan exec ile Plugin onay davranışının kanala açık kalmasını sağlar.
- Çekirdek artık onay yeniden yönlendirme bildirimlerinden de sorumludur. Kanal Plugin'leri, `createChannelNativeApprovalRuntime` içinden kendi "onay DM'lere / başka bir kanala gitti" takip mesajlarını göndermemelidir; bunun yerine paylaşılan onay yetenek yardımcıları üzerinden doğru origin + approver-DM yönlendirmesini açığa çıkarmalı ve başlatan sohbete herhangi bir bildirim göndermeden önce gerçek teslimatları çekirdeğin toplamasına izin vermelidir.
- Teslim edilen onay kimliği türünü uçtan uca koruyun. Yerel istemciler exec ile Plugin onay yönlendirmesini kanala yerel durumdan tahmin etmemeli veya yeniden yazmamalıdır.
- Farklı onay türleri bilerek farklı yerel yüzeyler sunabilir.
  Güncel paketlenmiş örnekler:
  - Slack, hem exec hem de Plugin kimlikleri için yerel onay yönlendirmesini kullanılabilir tutar.
  - Matrix, exec ve Plugin onayları için aynı yerel DM/kanal yönlendirmesi ve tepki kullanıcı deneyimini korurken, kimlik doğrulamanın yine de onay türüne göre farklılaşmasına izin verir.
- `createApproverRestrictedNativeApprovalAdapter` hâlâ uyumluluk sarmalayıcısı olarak mevcuttur, ancak yeni kodlar yetenek oluşturucuyu tercih etmeli ve Plugin üzerinde `approvalCapability` açığa çıkarmalıdır.

Sıcak kanal giriş noktaları için, bu aileden yalnızca tek bir parçaya ihtiyacınız olduğunda daha dar çalışma zamanı alt yollarını tercih edin:

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
`openclaw/plugin-sdk/reply-chunking` yollarını tercih edin.

Özellikle kurulum için:

- `openclaw/plugin-sdk/setup-runtime`, çalışma zamanında güvenli kurulum yardımcılarını kapsar:
  içe aktarma açısından güvenli kurulum yama bağdaştırıcıları (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), lookup-note çıktısı,
  `promptResolvedAllowFrom`, `splitSetupEntries` ve delege edilen
  kurulum proxy oluşturucuları
- `openclaw/plugin-sdk/setup-adapter-runtime`, `createEnvPatchedAccountSetupAdapter`
  için dar çevre değişkeni farkındalıklı bağdaştırıcı
  bağlantı yüzeyidir
- `openclaw/plugin-sdk/channel-setup`, isteğe bağlı kurulum oluşturucularını ve birkaç kurulum açısından güvenli ilkel yapıyı kapsar:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Kanalınız çevre değişkeni odaklı kurulum veya kimlik doğrulamayı destekliyorsa ve genel başlangıç/yapılandırma akışlarının çalışma zamanı yüklenmeden önce bu çevre değişkeni adlarını bilmesi gerekiyorsa, bunları Plugin manifest içinde `channelEnvVars` ile bildirin. Kanal çalışma zamanı `envVars` veya yerel sabitlerini yalnızca operatör odaklı kopya için tutun.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` ve
`splitSetupEntries`

- daha ağır paylaşılan kurulum/yapılandırma yardımcılarına da ihtiyacınız olduğunda yalnızca daha geniş `openclaw/plugin-sdk/setup` bağlantı yüzeyini kullanın; örneğin
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Kanalınız kurulum yüzeylerinde yalnızca "önce bu Plugin'i kurun" bilgisini göstermek istiyorsa, `createOptionalChannelSetupSurface(...)` tercih edin. Üretilen bağdaştırıcı/sihirbaz yapılandırma yazımlarında ve sonlandırmada güvenli biçimde kapalı davranır ve doğrulama, sonlandırma ve dokümantasyon bağlantısı metni boyunca aynı kurulum gerekli mesajını yeniden kullanır.

Diğer sıcak kanal yolları için, daha geniş eski yüzeyler yerine dar yardımcıları tercih edin:

- çok hesaplı yapılandırma ve varsayılan hesap geri dönüşü için
  `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` ve
  `openclaw/plugin-sdk/account-helpers`
- gelen rota/zarf ile kayıt ve sevk kablolaması için
  `openclaw/plugin-sdk/inbound-envelope` ve
  `openclaw/plugin-sdk/inbound-reply-dispatch`
- hedef ayrıştırma/eşleştirme için `openclaw/plugin-sdk/messaging-targets`
- medya yükleme ile dışa giden
  kimlik/gönderim delegeleri için `openclaw/plugin-sdk/outbound-media` ve
  `openclaw/plugin-sdk/outbound-runtime`
- iş parçacığı bağlama yaşam döngüsü
  ve bağdaştırıcı kaydı için `openclaw/plugin-sdk/thread-bindings-runtime`
- yalnızca eski bir agent/medya
  yük alanı düzeni hâlâ gerekiyorsa `openclaw/plugin-sdk/agent-media-payload`
- Telegram özel komut
  normalleştirme, yinelenen/çakışma doğrulaması ve geri dönüşte kararlı komut
  yapılandırma sözleşmesi için `openclaw/plugin-sdk/telegram-command-config`

Yalnızca kimlik doğrulama kullanan kanallar genellikle varsayılan yolda kalabilir: çekirdek onayları yönetir ve Plugin yalnızca dışa giden/kimlik doğrulama yeteneklerini açığa çıkarır. Matrix, Slack, Telegram ve özel sohbet taşıma katmanları gibi yerel onay kanalları, kendi onay yaşam döngülerini yazmak yerine paylaşılan yerel yardımcıları kullanmalıdır.

## Gelen mention ilkesi

Gelen mention işlemeyi iki katmanda ayrı tutun:

- Plugin'e ait kanıt toplama
- paylaşılan ilke değerlendirmesi

Mention ilkesi kararları için `openclaw/plugin-sdk/channel-mention-gating` kullanın.
Daha geniş gelen yardımcı varil yapısına yalnızca ihtiyacınız varsa `openclaw/plugin-sdk/channel-inbound` kullanın.

Plugin'e yerel mantık için uygun örnekler:

- bota yanıt algılama
- bottan alıntı algılama
- iş parçacığı katılımı denetimleri
- servis/sistem mesajı hariç tutmaları
- bot katılımını kanıtlamak için gereken platforma özgü yerel önbellekler

Paylaşılan yardımcı için uygun örnekler:

- `requireMention`
- açık mention sonucu
- örtük mention izin listesi
- komut atlama
- son atlama kararı

Önerilen akış:

1. Yerel mention olgularını hesaplayın.
2. Bu olguları `resolveInboundMentionDecision({ facts, policy })` içine geçirin.
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

`api.runtime.channel.mentions`, çalışma zamanı enjeksiyonuna zaten bağımlı olan paketlenmiş kanal Plugin'leri için aynı paylaşılan mention yardımcılarını açığa çıkarır:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Yalnızca `implicitMentionKindWhen` ve
`resolveInboundMentionDecision` ihtiyacınız varsa, ilgisiz gelen
çalışma zamanı yardımcılarını yüklemekten kaçınmak için
`openclaw/plugin-sdk/channel-mention-gating` içinden içe aktarın.

Eski `resolveMentionGating*` yardımcıları, yalnızca uyumluluk amaçlı dışa aktarımlar olarak
`openclaw/plugin-sdk/channel-inbound` üzerinde kalmaya devam eder. Yeni kod,
`resolveInboundMentionDecision({ facts, policy })` kullanmalıdır.

## İzlenecek yol

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket ve manifest">
    Standart Plugin dosyalarını oluşturun. `package.json` içindeki `channel` alanı,
    bunun bir kanal Plugin'i olmasını sağlar. Tam paket meta veri yüzeyi için
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
          "blurb": "OpenClaw’u Acme Chat’e bağlayın."
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
    `ChannelPlugin` arayüzünün birçok isteğe bağlı bağdaştırıcı yüzeyi vardır. En düşük
    düzeyden başlayın — `id` ve `setup` — ve ihtiyaç duydukça bağdaştırıcılar ekleyin.

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

      // DM güvenliği: botla kim mesajlaşabilir
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Eşleme: yeni DM kişiler için onay akışı
      pairing: {
        text: {
          idLabel: "Acme Chat kullanıcı adı",
          message: "Kimliğinizi doğrulamak için bu kodu gönderin:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // İş parçacığı oluşturma: yanıtlar nasıl teslim edilir
      threading: { topLevelReplyToMode: "reply" },

      // Dışa giden: platforma mesaj gönder
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
      Düşük düzey bağdaştırıcı arayüzlerini elle uygulamak yerine,
      bildirime dayalı seçenekler geçirirsiniz ve oluşturucu bunları birleştirir:

      | Seçenek | Bağladığı şey |
      | --- | --- |
      | `security.dm` | Yapılandırma alanlarından kapsamlı DM güvenlik çözücüsü |
      | `pairing.text` | Kod değişimi ile metin tabanlı DM eşleme akışı |
      | `threading` | Reply-to-mode çözücüsü (sabit, hesap kapsamlı veya özel) |
      | `outbound.attachedResults` | Sonuç meta verisi döndüren gönderim işlevleri (mesaj kimlikleri) |

      Tam denetime ihtiyacınız varsa, bildirime dayalı seçenekler yerine ham bağdaştırıcı
      nesneleri de geçirebilirsiniz.
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

    OpenClaw’un tam kanal çalışma zamanını etkinleştirmeden kök yardımda
    bunları gösterebilmesi için kanala ait CLI tanımlayıcılarını `registerCliMetadata(...)`
    içine koyun; normal tam yüklemeler ise gerçek komut kaydı için aynı tanımlayıcıları
    yine alır. `registerFull(...)` işlevini yalnızca çalışma zamanına özgü işler için tutun.
    `registerFull(...)` Gateway RPC yöntemleri kaydediyorsa,
    Plugin'e özgü bir önek kullanın. Çekirdek yönetici ad alanları (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış durumda kalır ve her zaman
    `operator.admin` olarak çözülür.
    `defineChannelPluginEntry`, kayıt modu ayrımını otomatik olarak yönetir. Tüm
    seçenekler için [Giriş Noktaları](/tr/plugins/sdk-entrypoints#definechannelpluginentry)
    bölümüne bakın.

  </Step>

  <Step title="Bir kurulum girişi ekleyin">
    Onboarding sırasında hafif yükleme için `setup-entry.ts` oluşturun:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw, kanal devre dışıysa veya yapılandırılmamışsa tam giriş yerine bunu yükler.
    Bu, kurulum akışları sırasında ağır çalışma zamanı kodunun çekilmesini önler.
    Ayrıntılar için [Kurulum ve Yapılandırma](/tr/plugins/sdk-setup#setup-entry)
    bölümüne bakın.

    Kurulum açısından güvenli dışa aktarımları yan modüllere bölen paketlenmiş çalışma alanı
    kanalları, açık bir kurulum zamanı çalışma zamanı ayarlayıcısına da ihtiyaç
    duyduklarında `openclaw/plugin-sdk/channel-entry-contract` içinden
    `defineBundledChannelSetupEntry(...)` kullanabilir.

  </Step>

  <Step title="Gelen mesajları işleyin">
    Plugin'inizin platformdan mesaj alması ve bunları OpenClaw’a iletmesi gerekir.
    Tipik desen, isteği doğrulayan ve bunu kanalınızın gelen işleyicisi üzerinden
    sevk eden bir Webhook'tur:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // Plugin tarafından yönetilen kimlik doğrulama (imzaları kendiniz doğrulayın)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Gelen işleyiciniz mesajı OpenClaw’a sevk eder.
          // Kesin bağlama, platform SDK'nıza bağlıdır —
          // paketlenmiş Microsoft Teams veya Google Chat Plugin paketinde gerçek bir örneğe bakın.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Gelen mesaj işleme kanala özeldir. Her kanal Plugin'i kendi gelen
      işlem hattına sahiptir. Gerçek desenler için paketlenmiş kanal Plugin'lerine
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

    Paylaşılan test yardımcıları için bkz. [Testing](/tr/plugins/sdk-testing).

  </Step>
</Steps>

## Dosya yapısı

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel meta verisi
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

## Gelişmiş konular

<CardGroup cols={2}>
  <Card title="İş parçacığı oluşturma seçenekleri" icon="git-branch" href="/tr/plugins/sdk-entrypoints#registration-mode">
    Sabit, hesap kapsamlı veya özel yanıt modları
  </Card>
  <Card title="Message tool entegrasyonu" icon="puzzle" href="/tr/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool ve eylem keşfi
  </Card>
  <Card title="Hedef çözümleme" icon="crosshair" href="/tr/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Çalışma zamanı yardımcıları" icon="settings" href="/tr/plugins/sdk-runtime">
    api.runtime üzerinden TTS, STT, medya, subagent
  </Card>
</CardGroup>

<Note>
Bazı paketlenmiş yardımcı bağlantı yüzeyleri, paketlenmiş Plugin bakımı ve
uyumluluk için hâlâ mevcuttur. Bunlar yeni kanal Plugin'leri için önerilen
desen değildir; bu paketlenmiş Plugin ailesinin bakımını doğrudan yapmıyorsanız,
ortak SDK yüzeyindeki genel channel/setup/reply/runtime alt yollarını tercih edin.
</Note>

## Sonraki adımlar

- [Provider Plugin'leri](/tr/plugins/sdk-provider-plugins) — Plugin'iniz ayrıca modeller de sağlıyorsa
- [SDK Genel Bakış](/tr/plugins/sdk-overview) — tam alt yol içe aktarma başvurusu
- [SDK Testing](/tr/plugins/sdk-testing) — test yardımcı araçları ve sözleşme testleri
- [Plugin Manifest](/tr/plugins/manifest) — tam manifest şeması

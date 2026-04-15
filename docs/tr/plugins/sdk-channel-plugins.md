---
read_when:
    - Yeni bir mesajlaşma kanalı Plugin'i oluşturuyorsunuz
    - OpenClaw'u bir mesajlaşma platformuna bağlamak istiyorsunuz
    - ChannelPlugin bağdaştırıcı yüzeyini anlamanız gerekiyor
sidebarTitle: Channel Plugins
summary: OpenClaw için bir mesajlaşma kanalı Plugin'i oluşturma adım adım kılavuzu
title: Kanal Plugin'leri Oluşturma
x-i18n:
    generated_at: "2026-04-15T19:41:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80e47e61d1e47738361692522b79aff276544446c58a7b41afe5296635dfad4b
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Kanal Plugin'leri Oluşturma

Bu kılavuz, OpenClaw'u bir mesajlaşma platformuna bağlayan bir kanal plugin'i oluşturma sürecini anlatır. Sonunda DM güvenliği, eşleştirme, yanıt dizileme ve giden mesajlaşma özelliklerine sahip çalışan bir kanalınız olacak.

<Info>
  Daha önce hiç OpenClaw plugin'i oluşturmadıysanız, temel paket yapısı ve manifest kurulumu için önce [Başlangıç](/tr/plugins/building-plugins) bölümünü okuyun.
</Info>

## Kanal plugin'leri nasıl çalışır

Kanal plugin'lerinin kendi gönder/düzenle/tepki ver araçlarına ihtiyacı yoktur. OpenClaw, çekirdekte tek bir paylaşılan `message` aracını tutar. Plugin'iniz şunlardan sorumludur:

- **Yapılandırma** — hesap çözümleme ve kurulum sihirbazı
- **Güvenlik** — DM ilkesi ve izin listeleri
- **Eşleştirme** — DM onay akışı
- **Oturum dil bilgisi** — sağlayıcıya özgü konuşma kimliklerinin temel sohbetlere, iş parçacığı kimliklerine ve üst öğe geri dönüşlerine nasıl eşlendiği
- **Giden** — platforma metin, medya ve anket gönderme
- **Dizileme** — yanıtların nasıl dizilendiği

Çekirdek; paylaşılan mesaj aracından, istem kablolamasından, dış oturum anahtarı biçiminden, genel `:thread:` kayıtlarından ve dağıtımdan sorumludur.

Kanalınız medya kaynakları taşıyan mesaj aracı parametreleri ekliyorsa, bu parametre adlarını `describeMessageTool(...).mediaSourceParams` üzerinden sunun. Çekirdek, bu açık listeyi sandbox yol normalizasyonu ve giden medya erişim ilkesi için kullanır; böylece plugin'lerin sağlayıcıya özgü avatar, ek veya kapak görseli parametreleri için paylaşılan çekirdekte özel durumlara ihtiyacı olmaz.
İlgisiz eylemlerin başka bir eylemin medya argümanlarını devralmaması için tercihen
`{ "set-profile": ["avatarUrl", "avatarPath"] }`
gibi eylem anahtarlı bir eşleme döndürün. Düz bir dizi de, tüm sunulan eylemler arasında kasıtlı olarak paylaşılan parametreler için yine çalışır.

Platformunuz konuşma kimlikleri içinde ek kapsam saklıyorsa, bu ayrıştırmayı plugin içinde `messaging.resolveSessionConversation(...)` ile tutun. `rawId` değerini temel konuşma kimliğine, isteğe bağlı iş parçacığı kimliğine, açık `baseConversationId` değerine ve herhangi bir `parentConversationCandidates` değerine eşlemek için kanonik kanca budur.
`parentConversationCandidates` döndürdüğünüzde, bunları en dar üst öğeden en geniş/temel konuşmaya doğru sıralı tutun.

Kanal kayıt defteri başlatılmadan önce aynı ayrıştırmaya ihtiyaç duyan paketlenmiş plugin'ler, eşleşen bir `resolveSessionConversation(...)` dışa aktarımı ile üst düzey bir `session-key-api.ts` dosyası da sunabilir. Çekirdek, yalnızca çalışma zamanı plugin kayıt defteri henüz mevcut değilse bu bootstrap için güvenli yüzeyi kullanır.

`messaging.resolveParentConversationCandidates(...)`, bir plugin yalnızca genel/raw kimliğin üzerine üst öğe geri dönüşlerine ihtiyaç duyduğunda eski uyumluluk geri dönüşü olarak kullanılmaya devam eder. Her iki kanca da varsa çekirdek önce `resolveSessionConversation(...).parentConversationCandidates` kullanır ve yalnızca kanonik kanca bunları atladığında `resolveParentConversationCandidates(...)` kancasına geri döner.

## Onaylar ve kanal yetenekleri

Çoğu kanal plugin'inin onaya özgü koda ihtiyacı yoktur.

- Çekirdek; aynı sohbette `/approve`, paylaşılan onay düğmesi payload'ları ve genel geri dönüş teslimatından sorumludur.
- Kanal onaya özgü davranış gerektiriyorsa, kanal plugin'inde tek bir `approvalCapability` nesnesini tercih edin.
- `ChannelPlugin.approvals` kaldırıldı. Onay teslimatı/yerel işleme/görselleştirme/yetkilendirme bilgilerini `approvalCapability` içine koyun.
- `plugin.auth` yalnızca giriş/çıkış içindir; çekirdek artık bu nesneden onay yetkilendirme kancalarını okumaz.
- `approvalCapability.authorizeActorAction` ve `approvalCapability.getActionAvailabilityState`, onay yetkilendirmesi için kanonik bağlantı yüzeyidir.
- Aynı sohbette onay yetkilendirme kullanılabilirliği için `approvalCapability.getActionAvailabilityState` kullanın.
- Kanalınız yerel exec onaylarını sunuyorsa, başlatan yüzey/yerel istemci durumu aynı sohbetteki onay yetkilendirmesinden farklı olduğunda `approvalCapability.getExecInitiatingSurfaceState` kullanın. Çekirdek bu exec'e özgü kancayı `enabled` ile `disabled` ayrımını yapmak, başlatan kanalın yerel exec onaylarını destekleyip desteklemediğine karar vermek ve kanalı yerel istemci geri dönüş rehberliğine dahil etmek için kullanır. `createApproverRestrictedNativeApprovalCapability(...)`, yaygın durum için bunu doldurur.
- Yinelenen yerel onay istemlerini gizleme veya teslimattan önce yazıyor göstergeleri gönderme gibi kanala özgü payload yaşam döngüsü davranışları için `outbound.shouldSuppressLocalPayloadPrompt` veya `outbound.beforeDeliverPayload` kullanın.
- `approvalCapability.delivery` değerini yalnızca yerel onay yönlendirmesi veya geri dönüş bastırma için kullanın.
- Kanalın sahip olduğu yerel onay bilgileri için `approvalCapability.nativeRuntime` kullanın. Çekirdeğin onay yaşam döngüsünü bir araya getirmesine izin verirken çalışma zamanı modülünüzü isteğe bağlı olarak içe aktarabilen `createLazyChannelApprovalNativeRuntimeAdapter(...)` ile bunu sıcak kanal giriş noktalarında tembel tutun.
- `approvalCapability.render` değerini yalnızca bir kanal, paylaşılan işleyici yerine gerçekten özel onay payload'larına ihtiyaç duyduğunda kullanın.
- Kanal devre dışı yol yanıtının yerel exec onaylarını etkinleştirmek için gereken tam yapılandırma ayarlarını açıklamasını istiyorsa `approvalCapability.describeExecApprovalSetup` kullanın. Kanca `{ channel, channelLabel, accountId }` alır; adlandırılmış hesap kanalları, üst düzey varsayılanlar yerine `channels.<channel>.accounts.<id>.execApprovals.*` gibi hesap kapsamlı yollar üretmelidir.
- Bir kanal mevcut yapılandırmadan kararlı sahip benzeri DM kimliklerini çıkarabiliyorsa, onaya özgü çekirdek mantığı eklemeden aynı sohbette `/approve` kısıtlamak için `openclaw/plugin-sdk/approval-runtime` içinden `createResolvedApproverActionAuthAdapter` kullanın.
- Kanalınız yerel onay teslimatına ihtiyaç duyuyorsa, kanal kodunu hedef normalizasyonu ile aktarım/sunum bilgilerine odaklı tutun. `openclaw/plugin-sdk/approval-runtime` içinden `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` ve `createApproverRestrictedNativeApprovalCapability` kullanın. Kanala özgü bilgileri `approvalCapability.nativeRuntime` arkasına koyun; ideal olarak `createChannelApprovalNativeRuntimeAdapter(...)` veya `createLazyChannelApprovalNativeRuntimeAdapter(...)` aracılığıyla. Böylece çekirdek işleyiciyi bir araya getirebilir ve istek filtreleme, yönlendirme, tekilleştirme, süre sonu, Gateway aboneliği ve başka yere yönlendirildi bildirimlerinden sorumlu olabilir. `nativeRuntime` birkaç küçük yüzeye ayrılmıştır:
- `availability` — hesabın yapılandırılıp yapılandırılmadığı ve bir isteğin işlenip işlenmemesi gerektiği
- `presentation` — paylaşılan onay görünüm modelini bekleyen/çözümlenmiş/süresi dolmuş yerel payload'lara veya son eylemlere eşleme
- `transport` — hedefleri hazırlama ve yerel onay mesajlarını gönderme/güncelleme/silme
- `interactions` — yerel düğmeler veya tepkiler için isteğe bağlı bağla/çöz/eylem temizleme kancaları
- `observe` — isteğe bağlı teslimat tanılama kancaları
- Kanalın istemci, token, Bolt uygulaması veya Webhook alıcısı gibi çalışma zamanına ait nesnelere ihtiyacı varsa, bunları `openclaw/plugin-sdk/channel-runtime-context` üzerinden kaydedin. Genel runtime-context kayıt defteri, çekirdeğin onaya özgü sarmalayıcı yapıştırıcı eklemeden kanal başlatma durumundan yetenek odaklı işleyicileri bootstrap etmesine olanak tanır.
- Daha alt düzey `createChannelApprovalHandler` veya `createChannelNativeApprovalRuntime` seçeneklerine yalnızca yetenek odaklı yüzey henüz yeterince ifade edici değilse başvurun.
- Yerel onay kanalları bu yardımcılar üzerinden hem `accountId` hem de `approvalKind` yönlendirmelidir. `accountId`, çok hesaplı onay ilkesini doğru bot hesabı kapsamında tutar; `approvalKind` ise çekirdekte sabit kodlanmış dallanmalar olmadan exec ile plugin onay davranışını kanala kullanılabilir halde tutar.
- Çekirdek artık onay yeniden yönlendirme bildirimlerinden de sorumludur. Kanal plugin'leri, `createChannelNativeApprovalRuntime` içinden kendi "onay DM'lere / başka bir kanala gitti" takip mesajlarını göndermemelidir; bunun yerine paylaşılan onay yeteneği yardımcıları üzerinden doğru kaynak + onaylayıcı-DM yönlendirmesini sunmalı ve başlatan sohbete herhangi bir bildirim göndermeden önce çekirdeğin gerçek teslimatları toplamasına izin vermelidir.
- Teslim edilen onay kimliği türünü uçtan uca koruyun. Yerel istemciler, exec ile plugin onay yönlendirmesini kanal yerel durumundan tahmin etmemeli veya yeniden yazmamalıdır.
- Farklı onay türleri kasıtlı olarak farklı yerel yüzeyler sunabilir.
  Mevcut paketlenmiş örnekler:
  - Slack, hem exec hem de plugin kimlikleri için yerel onay yönlendirmesini kullanılabilir tutar.
  - Matrix, exec ve plugin onayları için aynı yerel DM/kanal yönlendirmesini ve tepki UX'ini korurken, yine de yetkilendirmenin onay türüne göre farklılaşmasına izin verir.
- `createApproverRestrictedNativeApprovalAdapter` hâlâ uyumluluk sarmalayıcısı olarak mevcuttur, ancak yeni kod `capability` oluşturucuyu tercih etmeli ve plugin üzerinde `approvalCapability` sunmalıdır.

Sıcak kanal giriş noktalarında, bu ailenin yalnızca bir parçasına ihtiyacınız olduğunda daha dar çalışma zamanı alt yollarını tercih edin:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Benzer şekilde, daha geniş şemsiye yüzeye ihtiyacınız yoksa `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` ve
`openclaw/plugin-sdk/reply-chunking`
yollarını tercih edin.

Özellikle kurulum için:

- `openclaw/plugin-sdk/setup-runtime`, çalışma zamanında güvenli kurulum yardımcılarını kapsar:
  içe aktarma için güvenli kurulum yama bağdaştırıcıları (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), arama notu çıktısı,
  `promptResolvedAllowFrom`, `splitSetupEntries` ve temsil edilen
  setup-proxy oluşturucuları
- `openclaw/plugin-sdk/setup-adapter-runtime`, `createEnvPatchedAccountSetupAdapter` için dar, ortam farkındalıklı bağdaştırıcı yüzeyidir
- `openclaw/plugin-sdk/channel-setup`, isteğe bağlı kurulum oluşturucularını ve birkaç kurulum açısından güvenli ilkel öğeyi kapsar:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Kanalınız ortam değişkeni güdümlü kurulum veya yetkilendirmeyi destekliyorsa ve genel başlatma/yapılandırma akışlarının çalışma zamanı yüklenmeden önce bu ortam adlarını bilmesi gerekiyorsa, bunları plugin manifest'inde `channelEnvVars` ile bildirin. Kanal çalışma zamanı `envVars` değerlerini veya yerel sabitleri yalnızca operatör odaklı kopya için tutun.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` ve
`splitSetupEntries`

- yalnızca daha ağır paylaşılan kurulum/yapılandırma yardımcılarına da ihtiyacınız varsa daha geniş `openclaw/plugin-sdk/setup` yüzeyine başvurun; örneğin
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Kanalınız yalnızca kurulum yüzeylerinde "önce bu plugin'i yükleyin" bilgisini göstermek istiyorsa, `createOptionalChannelSetupSurface(...)` tercih edin. Üretilen bağdaştırıcı/sihirbaz yapılandırma yazımlarında ve sonlandırmada kapalı varsayılanla başarısız olur ve aynı kurulum gerekli mesajını doğrulama, sonlandırma ve belge bağlantısı metni boyunca yeniden kullanır.

Diğer sıcak kanal yolları için, daha geniş eski yüzeyler yerine dar yardımcıları tercih edin:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` ve
  `openclaw/plugin-sdk/account-helpers` çok hesaplı yapılandırma ve
  varsayılan hesap geri dönüşü için
- `openclaw/plugin-sdk/inbound-envelope` ve
  `openclaw/plugin-sdk/inbound-reply-dispatch` gelen rota/zarf ile
  kaydet-ve-dağıt kablolaması için
- `openclaw/plugin-sdk/messaging-targets` hedef ayrıştırma/eşleştirme için
- `openclaw/plugin-sdk/outbound-media` ve
  `openclaw/plugin-sdk/outbound-runtime` medya yükleme ile giden
  kimlik/gönderme temsilcileri için
- `openclaw/plugin-sdk/thread-bindings-runtime` iş parçacığı bağlama yaşam döngüsü
  ve bağdaştırıcı kaydı için
- `openclaw/plugin-sdk/agent-media-payload` yalnızca eski bir agent/media
  payload alan düzeni hâlâ gerekiyorsa
- `openclaw/plugin-sdk/telegram-command-config` Telegram özel komut
  normalizasyonu, yinelenen/çakışan doğrulama ve geri dönüşte kararlı komut
  yapılandırması sözleşmesi için

Yalnızca yetkilendirme yapan kanallar genellikle varsayılan yolda kalabilir: çekirdek onayları yönetir ve plugin yalnızca giden/yetkilendirme yeteneklerini sunar. Matrix, Slack, Telegram ve özel sohbet taşıma katmanları gibi yerel onay kanalları, kendi onay yaşam döngülerini yazmak yerine paylaşılan yerel yardımcıları kullanmalıdır.

## Gelen bahsetme ilkesi

Gelen bahsetme işlemesini iki katmana ayrılmış halde tutun:

- plugin'in sahip olduğu kanıt toplama
- paylaşılan ilke değerlendirmesi

Paylaşılan katman için `openclaw/plugin-sdk/channel-inbound` kullanın.

Plugin'e yerel mantık için uygun örnekler:

- bota yanıt tespiti
- bottan alıntı tespiti
- iş parçacığı katılımı kontrolleri
- hizmet/sistem mesajı hariç tutmaları
- bot katılımını kanıtlamak için gereken platform yerel önbellekleri

Paylaşılan yardımcı için uygun örnekler:

- `requireMention`
- açık bahsetme sonucu
- örtük bahsetme izin listesi
- komut baypası
- son atlama kararı

Tercih edilen akış:

1. Yerel bahsetme bilgilerini hesaplayın.
2. Bu bilgileri `resolveInboundMentionDecision({ facts, policy })` içine geçirin.
3. Gelen kapısında `decision.effectiveWasMentioned`, `decision.shouldBypassMention` ve `decision.shouldSkip` kullanın.

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

`api.runtime.channel.mentions`, çalışma zamanı enjeksiyonuna zaten bağımlı olan paketlenmiş kanal plugin'leri için aynı paylaşılan bahsetme yardımcılarını sunar:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Eski `resolveMentionGating*` yardımcıları, yalnızca uyumluluk dışa aktarımları olarak
`openclaw/plugin-sdk/channel-inbound` üzerinde kalmaya devam eder. Yeni kod
`resolveInboundMentionDecision({ facts, policy })` kullanmalıdır.

## Adım adım

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket ve manifest">
    Standart plugin dosyalarını oluşturun. `package.json` içindeki `channel` alanı,
    bunun bir kanal plugin'i olmasını sağlar. Tam paket meta verisi yüzeyi için
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
          "blurb": "OpenClaw'u Acme Chat'e bağlayın."
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
    `ChannelPlugin` arayüzünün birçok isteğe bağlı bağdaştırıcı yüzeyi vardır. En az olanla başlayın — `id` ve `setup` — ve ihtiyaç duydukça bağdaştırıcılar ekleyin.

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
          idLabel: "Acme Chat kullanıcı adı",
          message: "Kimliğinizi doğrulamak için bu kodu gönderin:",
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

    <Accordion title="createChatChannelPlugin sizin için ne yapar">
      Alt düzey bağdaştırıcı arayüzlerini elle uygulamak yerine, bildirimsel seçenekler geçirirsiniz ve oluşturucu bunları birleştirir:

      | Seçenek | Bağladığı şey |
      | --- | --- |
      | `security.dm` | Yapılandırma alanlarından kapsamlı DM güvenlik çözümleyicisi |
      | `pairing.text` | Kod değiş tokuşu ile metin tabanlı DM eşleştirme akışı |
      | `threading` | Reply-to kip çözümleyicisi (sabit, hesap kapsamlı veya özel) |
      | `outbound.attachedResults` | Sonuç meta verisi döndüren gönderme işlevleri (mesaj kimlikleri) |

      Tam denetime ihtiyacınız varsa bildirimsel seçenekler yerine ham bağdaştırıcı nesneleri de geçirebilirsiniz.
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

    Kanalın sahip olduğu CLI tanımlayıcılarını `registerCliMetadata(...)` içine koyun; böylece OpenClaw, tam kanal çalışma zamanını etkinleştirmeden bunları kök yardımda gösterebilir. Normal tam yüklemeler de gerçek komut kaydı için aynı tanımlayıcıları almaya devam eder. `registerFull(...)` değerini yalnızca çalışma zamanına özgü işler için tutun.
    `registerFull(...)` Gateway RPC yöntemleri kaydediyorsa,
    plugin'e özgü bir önek kullanın. Çekirdek yönetici ad alanları (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış kalır ve her zaman
    `operator.admin` olarak çözülür.
    `defineChannelPluginEntry`, kayıt kipi ayrımını otomatik olarak işler. Tüm
    seçenekler için [Giriş Noktaları](/tr/plugins/sdk-entrypoints#definechannelpluginentry) bölümüne bakın.

  </Step>

  <Step title="Bir kurulum girişi ekleyin">
    Onboarding sırasında hafif yükleme için `setup-entry.ts` oluşturun:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw, kanal devre dışıyken veya yapılandırılmamışken tam giriş yerine bunu yükler.
    Bu, kurulum akışları sırasında ağır çalışma zamanı kodunun çekilmesini önler.
    Ayrıntılar için [Kurulum ve Yapılandırma](/tr/plugins/sdk-setup#setup-entry) bölümüne bakın.

    Kurulum açısından güvenli dışa aktarımları yan modüllere ayıran paketlenmiş çalışma alanı kanalları,
    açık bir kurulum zamanı runtime setter'a da ihtiyaç duyduklarında
    `openclaw/plugin-sdk/channel-entry-contract` içinden
    `defineBundledChannelSetupEntry(...)` kullanabilir.

  </Step>

  <Step title="Gelen mesajları işleyin">
    Plugin'inizin platformdan mesaj alması ve bunları OpenClaw'a iletmesi gerekir.
    Tipik kalıp, isteği doğrulayan ve kanalınızın gelen işleyicisi üzerinden
    dağıtan bir Webhook'tur:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin tarafından yönetilen yetkilendirme (imzaları kendiniz doğrulayın)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Gelen işleyiciniz mesajı OpenClaw'a dağıtır.
          // Kesin kablolama platform SDK'nıza bağlıdır —
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
      kendi gelen işlem hattına sahiptir. Gerçek kalıplar için paketlenmiş kanal plugin'lerine
      (örneğin Microsoft Teams veya Google Chat plugin paketi) bakın.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test edin">
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

    Paylaşılan test yardımcıları için [Test](/tr/plugins/sdk-testing) bölümüne bakın.

  </Step>
</Steps>

## Dosya yapısı

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel meta verileri
├── openclaw.plugin.json      # Yapılandırma şemalı Manifest
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Genel dışa aktarımlar (isteğe bağlı)
├── runtime-api.ts            # Dahili çalışma zamanı dışa aktarımları (isteğe bağlı)
└── src/
    ├── channel.ts            # createChatChannelPlugin üzerinden ChannelPlugin
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
    api.runtime üzerinden TTS, STT, medya, alt agent
  </Card>
</CardGroup>

<Note>
Bazı paketlenmiş yardımcı yüzeyleri, paketlenmiş plugin bakımı ve
uyumluluk için hâlâ mevcuttur. Bunlar yeni kanal plugin'leri için önerilen
kalıp değildir; bu paketlenmiş plugin ailesini doğrudan korumuyorsanız,
ortak SDK yüzeyindeki genel channel/setup/reply/runtime alt yollarını tercih edin.
</Note>

## Sonraki adımlar

- [Provider Plugin'leri](/tr/plugins/sdk-provider-plugins) — plugin'iniz ayrıca model de sağlıyorsa
- [SDK Genel Bakış](/tr/plugins/sdk-overview) — tam alt yol içe aktarma başvurusu
- [SDK Test](/tr/plugins/sdk-testing) — test yardımcı araçları ve sözleşme testleri
- [Plugin Manifest](/tr/plugins/manifest) — tam manifest şeması

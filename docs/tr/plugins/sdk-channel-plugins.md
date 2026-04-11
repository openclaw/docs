---
read_when:
    - Yeni bir mesajlaşma kanal plugin'i oluşturuyorsunuz
    - OpenClaw'ı bir mesajlaşma platformuna bağlamak istiyorsunuz
    - ChannelPlugin bağdaştırıcı yüzeyini anlamanız gerekiyor
sidebarTitle: Channel Plugins
summary: OpenClaw için bir mesajlaşma kanal plugin'i oluşturma adım adım kılavuzu
title: Kanal Plugin'leri Oluşturma
x-i18n:
    generated_at: "2026-04-11T02:46:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8a026e924f9ae8a3ddd46287674443bcfccb0247be504261522b078e1f440aef
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Kanal Plugin'leri Oluşturma

Bu kılavuz, OpenClaw'ı bir mesajlaşma platformuna bağlayan bir kanal plugin'i oluşturma sürecini adım adım açıklar. Sonunda DM güvenliği, eşleme, yanıt dizilimi ve giden mesajlaşma özelliklerine sahip çalışan bir kanalınız olacak.

<Info>
  Daha önce hiç OpenClaw plugin'i oluşturmadıysanız, temel paket
  yapısı ve manifest kurulumu için önce
  [Başlangıç](/tr/plugins/building-plugins) bölümünü okuyun.
</Info>

## Kanal plugin'leri nasıl çalışır

Kanal plugin'lerinin kendi send/edit/react araçlarına ihtiyacı yoktur. OpenClaw, çekirdekte tek bir paylaşılan `message` aracı tutar. Plugin'iniz şunlardan sorumludur:

- **Yapılandırma** — hesap çözümleme ve kurulum sihirbazı
- **Güvenlik** — DM politikası ve allowlist'ler
- **Eşleme** — DM onay akışı
- **Oturum dil bilgisi** — sağlayıcıya özgü konuşma kimliklerinin temel sohbetlere, iş parçacığı kimliklerine ve üst geri dönüşlere nasıl eşlendiği
- **Giden** — platforma metin, medya ve anket gönderme
- **İş parçacığı oluşturma** — yanıtların nasıl dizildiği

Çekirdek, paylaşılan mesaj aracından, istem bağlantılarından, dış oturum anahtarı biçiminden, genel `:thread:` kayıt takibinden ve sevkten sorumludur.

Platformunuz konuşma kimliklerinin içinde ek kapsam saklıyorsa, bu ayrıştırmayı plugin içinde `messaging.resolveSessionConversation(...)` ile tutun. Bu, `rawId` değerini temel konuşma kimliğine, isteğe bağlı iş parçacığı kimliğine, açık `baseConversationId` değerine ve herhangi bir `parentConversationCandidates` listesine eşlemek için kanonik kancadır. `parentConversationCandidates` döndürdüğünüzde, bunları en dar üstten en geniş/temel konuşmaya doğru sıralı tutun.

Kanal kayıt defteri başlatılmadan önce aynı ayrıştırmaya ihtiyaç duyan paketlenmiş plugin'ler, eşleşen bir `resolveSessionConversation(...)` dışa aktarımına sahip üst düzey bir `session-key-api.ts` dosyası da sunabilir. Çekirdek bu önyükleme için güvenli yüzeyi yalnızca çalışma zamanı plugin kayıt defteri henüz kullanılamadığında kullanır.

`messaging.resolveParentConversationCandidates(...)`, bir plugin'in yalnızca genel/ham kimliğin üzerine üst geri dönüşlere ihtiyaç duyması durumunda eski uyumluluk geri dönüşü olarak kullanılmaya devam eder. Her iki kanca da varsa, çekirdek önce `resolveSessionConversation(...).parentConversationCandidates` kullanır ve kanonik kanca bunları atladığında yalnızca `resolveParentConversationCandidates(...)` kancasına geri döner.

## Onaylar ve kanal yetenekleri

Çoğu kanal plugin'inin onaya özgü koda ihtiyacı yoktur.

- Çekirdek aynı sohbette `/approve`, paylaşılan onay düğmesi yükleri ve genel geri dönüş teslimatından sorumludur.
- Kanal onaya özgü davranış gerektiriyorsa, kanal plugin'inde tek bir `approvalCapability` nesnesi tercih edin.
- `ChannelPlugin.approvals` kaldırılmıştır. Onay teslimatı/yerel işleme/oluşturma/kimlik doğrulama bilgilerini `approvalCapability` içine koyun.
- `plugin.auth` yalnızca login/logout içindir; çekirdek artık bu nesneden onay kimlik doğrulama kancalarını okumaz.
- `approvalCapability.authorizeActorAction` ve `approvalCapability.getActionAvailabilityState`, onay kimlik doğrulaması için kanonik bağlantı yüzeyidir.
- Aynı sohbette onay kimlik doğrulama kullanılabilirliği için `approvalCapability.getActionAvailabilityState` kullanın.
- Kanalınız yerel exec onayları sunuyorsa, başlatan yüzey/yerel istemci durumu aynı sohbet onay kimlik doğrulamasından farklı olduğunda `approvalCapability.getExecInitiatingSurfaceState` kullanın. Çekirdek bu exec'e özgü kancayı `enabled` ile `disabled` ayrımını yapmak, başlatan kanalın yerel exec onaylarını destekleyip desteklemediğine karar vermek ve kanalı yerel istemci geri dönüş yönlendirmesine dahil etmek için kullanır. `createApproverRestrictedNativeApprovalCapability(...)`, yaygın durumda bunu doldurur.
- Yinelenen yerel onay istemlerini gizleme veya teslimattan önce yazıyor göstergeleri gönderme gibi kanala özgü yük yaşam döngüsü davranışları için `outbound.shouldSuppressLocalPayloadPrompt` veya `outbound.beforeDeliverPayload` kullanın.
- `approvalCapability.delivery` öğesini yalnızca yerel onay yönlendirmesi veya geri dönüş bastırma için kullanın.
- Kanala ait yerel onay bilgileri için `approvalCapability.nativeRuntime` kullanın. Çalışma anında modülünüzü isteğe göre içe aktarabilen ve yine de çekirdeğin onay yaşam döngüsünü kurmasına izin veren `createLazyChannelApprovalNativeRuntimeAdapter(...)` ile bunu sıcak kanal giriş noktalarında lazy tutun.
- Kanal gerçekten paylaşılan oluşturucu yerine özel onay yüklerine ihtiyaç duyuyorsa yalnızca `approvalCapability.render` kullanın.
- Kanal devre dışı yol yanıtının yerel exec onaylarını etkinleştirmek için gereken tam yapılandırma ayarlarını açıklamasını istiyorsa `approvalCapability.describeExecApprovalSetup` kullanın. Kanca `{ channel, channelLabel, accountId }` alır; adlandırılmış hesaplı kanallar üst düzey varsayılanlar yerine `channels.<channel>.accounts.<id>.execApprovals.*` gibi hesap kapsamlı yollar oluşturmalıdır.
- Bir kanal mevcut yapılandırmadan kararlı sahip benzeri DM kimliklerini çıkarabiliyorsa, onaya özgü çekirdek mantığı eklemeden aynı sohbette `/approve` kısıtlamak için `openclaw/plugin-sdk/approval-runtime` içindeki `createResolvedApproverActionAuthAdapter` kullanın.
- Kanalınız yerel onay teslimatına ihtiyaç duyuyorsa, kanal kodunu hedef normalleştirme ile taşıma/sunum bilgilerine odaklı tutun. `openclaw/plugin-sdk/approval-runtime` içinden `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` ve `createApproverRestrictedNativeApprovalCapability` kullanın. Kanala özgü bilgileri, ideal olarak `createChannelApprovalNativeRuntimeAdapter(...)` veya `createLazyChannelApprovalNativeRuntimeAdapter(...)` aracılığıyla, `approvalCapability.nativeRuntime` arkasına koyun; böylece çekirdek işleyiciyi kurabilir ve istek filtreleme, yönlendirme, tekilleştirme, süre dolumu, gateway aboneliği ve başka yere yönlendirildi bildirimlerinin sahipliğini alabilir. `nativeRuntime` birkaç küçük bağlantıya ayrılmıştır:
- `availability` — hesabın yapılandırılmış olup olmadığı ve bir isteğin işlenip işlenmemesi gerektiği
- `presentation` — paylaşılan onay görünüm modelini bekleyen/çözülen/süresi dolan yerel yüklere veya nihai eylemlere eşleme
- `transport` — hedefleri hazırlama ve yerel onay mesajlarını gönderme/güncelleme/silme
- `interactions` — yerel düğmeler veya tepkiler için isteğe bağlı bağlama/çözme/eylem temizleme kancaları
- `observe` — isteğe bağlı teslimat tanılama kancaları
- Kanal çalışma anına ait istemci, belirteç, Bolt uygulaması veya webhook alıcısı gibi nesnelere ihtiyaç duyuyorsa, bunları `openclaw/plugin-sdk/channel-runtime-context` üzerinden kaydedin. Genel runtime-context kayıt defteri, çekirdeğin kanal başlangıç durumundan yetenek odaklı işleyicileri başlatmasına onaya özgü sarmalayıcı bağlayıcı eklemeden izin verir.
- Yeteneğe dayalı bağlantı yüzeyi henüz yeterince ifade gücüne sahip değilse yalnızca daha alt düzey `createChannelApprovalHandler` veya `createChannelNativeApprovalRuntime` çözümlerine başvurun.
- Yerel onay kanalları hem `accountId` hem de `approvalKind` değerlerini bu yardımcılar üzerinden yönlendirmelidir. `accountId`, çok hesaplı onay politikasını doğru bot hesabı kapsamına oturtur; `approvalKind` ise çekirdekte sabit kodlu dallar olmadan exec ve plugin onay davranışını kanala açık tutar.
- Çekirdek artık onay yeniden yönlendirme bildirimlerinin de sahibidir. Kanal plugin'leri, `createChannelNativeApprovalRuntime` içinden kendi "onay DM'lere / başka bir kanala gitti" takip mesajlarını göndermemelidir; bunun yerine paylaşılan onay yeteneği yardımcıları üzerinden doğru kaynak + onaylayıcı-DM yönlendirmesini sunmalı ve çekirdeğin, başlatan sohbete herhangi bir bildirim göndermeden önce gerçek teslimatları toplamasına izin vermelidir.
- Teslim edilen onay kimliği türünü uçtan uca koruyun. Yerel istemciler, exec ve plugin onay yönlendirmesini kanala özgü durumdan tahmin etmemeli veya yeniden yazmamalıdır.
- Farklı onay türleri bilinçli olarak farklı yerel yüzeyler sunabilir.
  Mevcut paketlenmiş örnekler:
  - Slack, hem exec hem de plugin kimlikleri için yerel onay yönlendirmesini kullanılabilir tutar.
  - Matrix, exec ve plugin onayları için aynı yerel DM/kanal yönlendirmesini ve reaction UX'i korurken, kimlik doğrulamanın onay türüne göre farklılaşmasına da izin verir.
- `createApproverRestrictedNativeApprovalAdapter` hâlâ uyumluluk sarmalayıcısı olarak vardır, ancak yeni kod `capability` oluşturucusunu tercih etmeli ve plugin üzerinde `approvalCapability` sunmalıdır.

Sıcak kanal giriş noktalarında, bu ailenin yalnızca bir parçasına ihtiyaç duyuyorsanız daha dar çalışma zamanı alt yollarını tercih edin:

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

- `openclaw/plugin-sdk/setup-runtime`, çalışma zamanı için güvenli kurulum yardımcılarını kapsar:
  içe aktarma için güvenli kurulum yama bağdaştırıcıları (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), arama notu çıktısı,
  `promptResolvedAllowFrom`, `splitSetupEntries` ve devredilmiş
  kurulum proxy oluşturucuları
- `openclaw/plugin-sdk/setup-adapter-runtime`, `createEnvPatchedAccountSetupAdapter` için dar, ortam farkındalıklı bağdaştırıcı yüzeyidir
- `openclaw/plugin-sdk/channel-setup`, isteğe bağlı kurulum oluşturucularını ve birkaç kurulum açısından güvenli ilkel yapıyı kapsar:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Kanalınız ortam değişkeni odaklı kurulum veya kimlik doğrulamayı destekliyorsa ve genel başlangıç/yapılandırma akışlarının çalışma zamanı yüklenmeden önce bu ortam adlarını bilmesi gerekiyorsa, bunları plugin manifest'inde `channelEnvVars` ile bildirin. Kanal çalışma zamanı `envVars` veya yerel sabitlerini yalnızca operatöre yönelik metinler için kullanın.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` ve
`splitSetupEntries`

- yalnızca daha ağır paylaşılan kurulum/yapılandırma yardımcılarına da ihtiyaç duyuyorsanız daha geniş `openclaw/plugin-sdk/setup` yüzeyini kullanın; örneğin
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Kanalınız yalnızca kurulum yüzeylerinde "önce bu plugin'i yükleyin" bilgisini göstermek istiyorsa, `createOptionalChannelSetupSurface(...)` tercih edin. Oluşturulan bağdaştırıcı/kurulum sihirbazı yapılandırma yazımlarında ve sonlandırmada kapalı başarısız olur; ayrıca doğrulama, sonlandırma ve doküman bağlantısı metinlerinde aynı kurulum gerekli mesajını yeniden kullanır.

Diğer sıcak kanal yollarında da daha geniş eski yüzeyler yerine dar yardımcıları tercih edin:

- Çok hesaplı yapılandırma ve varsayılan hesap geri dönüşü için
  `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` ve
  `openclaw/plugin-sdk/account-helpers`
- Gelen yön/zarf ve kaydet-ve-sevk bağlantısı için
  `openclaw/plugin-sdk/inbound-envelope` ve
  `openclaw/plugin-sdk/inbound-reply-dispatch`
- Hedef ayrıştırma/eşleme için `openclaw/plugin-sdk/messaging-targets`
- Medya yükleme ve giden kimlik/gönderim delegeleri için
  `openclaw/plugin-sdk/outbound-media` ve
  `openclaw/plugin-sdk/outbound-runtime`
- İş parçacığı bağlama yaşam döngüsü ve bağdaştırıcı kaydı için
  `openclaw/plugin-sdk/thread-bindings-runtime`
- Yalnızca eski bir ajan/medya yük alan düzeni hâlâ gerekiyorsa
  `openclaw/plugin-sdk/agent-media-payload`
- Telegram özel komut normalleştirme, yinelenen/çakışma doğrulaması ve geri dönüş açısından kararlı komut yapılandırma sözleşmesi için
  `openclaw/plugin-sdk/telegram-command-config`

Yalnızca kimlik doğrulama kullanan kanallar genellikle varsayılan yolda kalabilir: çekirdek onayları yönetir ve plugin yalnızca giden/kimlik doğrulama yeteneklerini sunar. Matrix, Slack, Telegram ve özel sohbet taşıyıcıları gibi yerel onay kanalları, kendi onay yaşam döngülerini yazmak yerine paylaşılan yerel yardımcıları kullanmalıdır.

## Gelen mention politikası

Gelen mention işlemeyi iki katmana ayrılmış halde tutun:

- plugin'e ait kanıt toplama
- paylaşılan politika değerlendirmesi

Paylaşılan katman için `openclaw/plugin-sdk/channel-inbound` kullanın.

Plugin'e yerel mantık için uygun örnekler:

- bottan yanıt algılama
- bottan alıntı algılama
- iş parçacığı katılım kontrolleri
- hizmet/sistem mesajı hariç tutmaları
- bot katılımını kanıtlamak için gereken platforma özgü önbellekler

Paylaşılan yardımcı için uygun olanlar:

- `requireMention`
- açık mention sonucu
- örtük mention allowlist
- komut bypass
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

`api.runtime.channel.mentions`, çalışma zamanı eklemesine zaten bağımlı olan
paketlenmiş kanal plugin'leri için aynı paylaşılan mention yardımcılarını sunar:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Eski `resolveMentionGating*` yardımcıları yalnızca uyumluluk dışa aktarımları olarak
`openclaw/plugin-sdk/channel-inbound` üzerinde kalır. Yeni kod,
`resolveInboundMentionDecision({ facts, policy })` kullanmalıdır.

## İzlenecek yol

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket ve manifest">
    Standart plugin dosyalarını oluşturun. `package.json` içindeki `channel` alanı,
    bunun bir kanal plugin'i olmasını sağlar. Tam paket meta verisi yüzeyi için
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
    `ChannelPlugin` arayüzünde birçok isteğe bağlı bağdaştırıcı yüzeyi vardır. En
    az olanla başlayın — `id` ve `setup` — ve ihtiyaç duydukça bağdaştırıcılar ekleyin.

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

      // DM güvenliği: bota kim mesaj gönderebilir
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Eşleme: yeni DM kişileri için onay akışı
      pairing: {
        text: {
          idLabel: "Acme Chat kullanıcı adı",
          message: "Kimliğinizi doğrulamak için bu kodu gönderin:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // İş parçacığı oluşturma: yanıtlar nasıl iletilir
      threading: { topLevelReplyToMode: "reply" },

      // Giden: platforma mesaj gönderme
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
      Düşük düzeyli bağdaştırıcı arayüzlerini elle uygulamak yerine,
      bildirimsel seçenekler geçirirsiniz ve oluşturucu bunları birleştirir:

      | Seçenek | Bağladığı şey |
      | --- | --- |
      | `security.dm` | Yapılandırma alanlarından kapsamlı DM güvenlik çözücüsü |
      | `pairing.text` | Kod alışverişli metin tabanlı DM eşleme akışı |
      | `threading` | Reply-to modu çözücüsü (sabit, hesap kapsamlı veya özel) |
      | `outbound.attachedResults` | Sonuç meta verisi döndüren gönderim işlevleri (mesaj kimlikleri) |

      Tam denetime ihtiyaç duyuyorsanız bildirimsel seçenekler yerine ham bağdaştırıcı nesneleri de geçebilirsiniz.
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

    Kanala ait CLI tanımlayıcılarını `registerCliMetadata(...)` içine koyun; böylece OpenClaw
    tam kanal çalışma zamanını etkinleştirmeden kök yardım çıktısında bunları gösterebilir,
    normal tam yüklemeler ise gerçek komut kaydı için aynı tanımlayıcıları almaya devam eder.
    `registerFull(...)` yalnızca çalışma zamanına özgü işler için kullanılmalıdır.
    `registerFull(...)` gateway RPC yöntemleri kaydediyorsa,
    plugin'e özgü bir önek kullanın. Çekirdek yönetici ad alanları (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) ayrılmıştır ve her zaman
    `operator.admin` olarak çözülür.
    `defineChannelPluginEntry`, kayıt modu ayrımını otomatik olarak yönetir. Tüm
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

  </Step>

  <Step title="Gelen mesajları işleyin">
    Plugin'inizin platformdan mesaj alması ve bunları
    OpenClaw'a iletmesi gerekir. Tipik desen, isteği doğrulayan ve
    kendi kanalınızın gelen işleyicisi üzerinden sevk eden bir webhook'tur:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin tarafından yönetilen kimlik doğrulama (imzaları kendiniz doğrulayın)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Gelen işleyiciniz mesajı OpenClaw'a sevk eder.
          // Tam bağlantı, platform SDK'nıza bağlıdır —
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
      Gelen mesaj işleme, kanala özgüdür. Her kanal plugin'i
      kendi gelen işlem hattına sahiptir. Gerçek desenler için
      paketlenmiş kanal plugin'lerine
      (örneğin Microsoft Teams veya Google Chat plugin paketi) bakın.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
Aynı konumda `src/channel.test.ts` içinde testler yazın:

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

    Paylaşılan test yardımcıları için [Test](/tr/plugins/sdk-testing) bölümüne bakın.

  </Step>
</Steps>

## Dosya yapısı

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel meta verileri
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

## İleri konular

<CardGroup cols={2}>
  <Card title="İş parçacığı seçenekleri" icon="git-branch" href="/tr/plugins/sdk-entrypoints#registration-mode">
    Sabit, hesap kapsamlı veya özel yanıt modları
  </Card>
  <Card title="Mesaj aracı entegrasyonu" icon="puzzle" href="/tr/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool ve eylem keşfi
  </Card>
  <Card title="Hedef çözümleme" icon="crosshair" href="/tr/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Çalışma zamanı yardımcıları" icon="settings" href="/tr/plugins/sdk-runtime">
    api.runtime aracılığıyla TTS, STT, medya, alt ajan
  </Card>
</CardGroup>

<Note>
Bazı paketlenmiş yardımcı bağlantı yüzeyleri, paketlenmiş plugin bakımı ve
uyumluluk için hâlâ mevcuttur. Bunlar yeni kanal plugin'leri için önerilen desen değildir;
o paketlenmiş plugin ailesini doğrudan bakımını yapmıyorsanız, ortak SDK
yüzeyindeki genel channel/setup/reply/runtime alt yollarını tercih edin.
</Note>

## Sonraki adımlar

- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) — plugin'iniz aynı zamanda model de sağlıyorsa
- [SDK Genel Bakış](/tr/plugins/sdk-overview) — tam alt yol içe aktarma başvurusu
- [SDK Test](/tr/plugins/sdk-testing) — test yardımcıları ve sözleşme testleri
- [Plugin Manifesti](/tr/plugins/manifest) — tam manifest şeması

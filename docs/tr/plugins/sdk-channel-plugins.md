---
read_when:
    - Yeni bir mesajlaşma kanal eklentisi oluşturuyorsanız
    - OpenClaw'ı bir mesajlaşma platformuna bağlamak istiyorsanız
    - ChannelPlugin bağdaştırıcı yüzeyini anlamanız gerekiyorsa
sidebarTitle: Channel Plugins
summary: OpenClaw için bir mesajlaşma kanal eklentisi oluşturmaya yönelik adım adım kılavuz
title: Kanal Eklentileri Oluşturma
x-i18n:
    generated_at: "2026-04-05T14:02:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68a6ad2c75549db8ce54f7e22ca9850d7ed68c5cd651c9bb41c9f73769f48aba
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Kanal Eklentileri Oluşturma

Bu kılavuz, OpenClaw'ı bir mesajlaşma platformuna bağlayan bir kanal eklentisi oluşturma sürecini açıklar. Sonunda DM güvenliği,
eşleştirme, yanıt iş parçacığı oluşturma ve giden mesajlaşma içeren çalışan bir kanalınız olacak.

<Info>
  Daha önce hiç OpenClaw eklentisi oluşturmadıysanız, temel paket
  yapısı ve manifest kurulumu için önce
  [Başlangıç](/plugins/building-plugins) bölümünü okuyun.
</Info>

## Kanal eklentileri nasıl çalışır

Kanal eklentilerinin kendi gönder/düzenle/tepki araçlarına ihtiyacı yoktur. OpenClaw çekirdekte
paylaşılan tek bir `message` aracı tutar. Eklentiniz şu alanların sahibidir:

- **Yapılandırma** — hesap çözümleme ve kurulum sihirbazı
- **Güvenlik** — DM ilkesi ve izin listeleri
- **Eşleştirme** — DM onay akışı
- **Oturum grameri** — sağlayıcıya özgü konuşma kimliklerinin temel sohbetlere, iş parçacığı kimliklerine ve üst geri dönüşlere nasıl eşlendiği
- **Giden** — platforma metin, medya ve anket gönderme
- **İş parçacığı oluşturma** — yanıtların nasıl iş parçacığına bağlandığı

Çekirdek; paylaşılan message aracının, istem kablolamasının, dış oturum anahtarı biçiminin,
genel `:thread:` kayıtlarının ve dağıtımın sahibidir.

Platformunuz konuşma kimliklerinin içinde ek kapsam depoluyorsa, bu çözümlemeyi
eklenti içinde `messaging.resolveSessionConversation(...)` ile tutun. Bu,
`rawId` değerini temel konuşma kimliğine, isteğe bağlı iş parçacığı
kimliğine, açık `baseConversationId` değerine ve olası
`parentConversationCandidates` değerlerine eşlemek için kanonik kancadır.
`parentConversationCandidates` döndürdüğünüzde, bunları en dar üst öğeden
en geniş/temel konuşmaya doğru sıralı tutun.

Kanal kayıt defteri başlatılmadan önce aynı çözümlemeye ihtiyaç duyan paketlenmiş
eklentiler, eşleşen bir `resolveSessionConversation(...)`
dışa aktarımıyla üst düzey bir `session-key-api.ts` dosyasını da açığa çıkarabilir.
Çekirdek bu önyükleme açısından güvenli yüzeyi yalnızca çalışma zamanı eklenti kayıt defteri henüz kullanılamıyorken
kullanır.

`messaging.resolveParentConversationCandidates(...)`, bir eklentinin yalnızca
genel/ham kimliğin üzerine üst geri dönüşlere ihtiyaç duyduğu eski uyumluluk geri dönüşü olarak kullanılmaya devam eder.
Her iki kanca da varsa, çekirdek önce
`resolveSessionConversation(...).parentConversationCandidates` değerini kullanır ve yalnızca
kanonik kanca bunları atladığında `resolveParentConversationCandidates(...)` değerine geri döner.

## Onaylar ve kanal yetenekleri

Çoğu kanal eklentisinin onaya özgü koda ihtiyacı yoktur.

- Çekirdek aynı sohbetteki `/approve`, paylaşılan onay düğmesi yükleri ve genel geri dönüş teslimatının sahibidir.
- Kanalın onaya özgü davranışa ihtiyaç duyduğu durumlarda kanal eklentisinde tek bir `approvalCapability` nesnesini tercih edin.
- `approvalCapability.authorizeActorAction` ve `approvalCapability.getActionAvailabilityState`, kanonik onay-yetkilendirme yüzeyidir.
- Yinelenen yerel onay istemlerini gizleme veya teslimattan önce yazıyor göstergeleri gönderme gibi kanala özgü yük yaşam döngüsü davranışları için `outbound.shouldSuppressLocalPayloadPrompt` ya da `outbound.beforeDeliverPayload` kullanın.
- `approvalCapability.delivery` yalnızca yerel onay yönlendirmesi veya geri dönüş bastırma için kullanılmalıdır.
- `approvalCapability.render` yalnızca bir kanal gerçekten paylaşılan oluşturucu yerine özel onay yüklerine ihtiyaç duyduğunda kullanılmalıdır.
- Bir kanal mevcut yapılandırmadan kararlı, sahip benzeri DM kimliklerini çıkarabiliyorsa, onaya özgü çekirdek mantığı eklemeden aynı sohbetteki `/approve` işlemini kısıtlamak için `openclaw/plugin-sdk/approval-runtime` içindeki `createResolvedApproverActionAuthAdapter` kullanın.
- Bir kanalın yerel onay teslimatına ihtiyacı varsa, kanal kodunu hedef normalleştirme ve taşıma kancalarına odaklı tutun. İstek filtreleme, yönlendirme, tekilleştirme, süresi dolma ve gateway aboneliğinin sahibi çekirdek olsun diye `openclaw/plugin-sdk/approval-runtime` içindeki `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, `createApproverRestrictedNativeApprovalCapability` ve `createChannelNativeApprovalRuntime` yardımcılarını kullanın.
- Yerel onay kanalları hem `accountId` hem de `approvalKind` değerini bu yardımcılar üzerinden yönlendirmelidir. `accountId`, çok hesaplı onay ilkesinin doğru bot hesabı kapsamına bağlı kalmasını sağlar ve `approvalKind`, çekirdekte sabit kodlu dallanmalar olmadan yürütme ve eklenti onayı davranışını kanal için kullanılabilir tutar.
- Teslim edilen onay kimliği türünü uçtan uca koruyun. Yerel istemciler, yürütme ve eklenti onayı yönlendirmesini kanal yerel durumundan tahmin etmemeli
  veya yeniden yazmamalıdır.
- Farklı onay türleri bilinçli olarak farklı yerel yüzeyler açığa çıkarabilir.
  Mevcut paketlenmiş örnekler:
  - Slack, hem yürütme hem de eklenti kimlikleri için yerel onay yönlendirmesini kullanılabilir tutar.
  - Matrix, yalnızca yürütme onayları için yerel DM/kanal yönlendirmesini korur ve
    eklenti onaylarını paylaşılan aynı sohbet `/approve` yolunda bırakır.
- `createApproverRestrictedNativeApprovalAdapter` hâlâ bir uyumluluk sarmalayıcısı olarak vardır, ancak yeni kod `capability` oluşturucusunu tercih etmeli ve eklentide `approvalCapability` açığa çıkarmalıdır.

Sıcak kanal giriş noktaları için, bu aileden yalnızca tek bir parçaya
ihtiyacınız olduğunda daha dar çalışma zamanı alt yollarını tercih edin:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`

Benzer şekilde, daha geniş şemsiye
yüzeye ihtiyacınız olmadığında `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` ve
`openclaw/plugin-sdk/reply-chunking` tercih edin.

Özellikle kurulum için:

- `openclaw/plugin-sdk/setup-runtime`, çalışma zamanı açısından güvenli kurulum yardımcılarını kapsar:
  içe aktarma açısından güvenli kurulum yama bağdaştırıcıları (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), lookup-note çıktısı,
  `promptResolvedAllowFrom`, `splitSetupEntries` ve devredilen
  kurulum proxy oluşturucuları
- `openclaw/plugin-sdk/setup-adapter-runtime`, `createEnvPatchedAccountSetupAdapter`
  için dar, ortam farkındalıklı bağdaştırıcı
  yüzeyidir
- `openclaw/plugin-sdk/channel-setup`, isteğe bağlı kurulum yapılandırma
  oluşturucularını ve birkaç kurulum açısından güvenli ilkel öğeyi kapsar:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,
  `createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
  `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` ve
  `splitSetupEntries`
- daha geniş `openclaw/plugin-sdk/setup` yüzeyini yalnızca
  `moveSingleAccountChannelSectionToDefaultAccount(...)` gibi
  daha ağır paylaşılan kurulum/yapılandırma yardımcılarına da ihtiyaç duyduğunuzda kullanın

Kanalınız kurulum yüzeylerinde yalnızca "önce bu eklentiyi yükleyin" bilgisini
reklam etmek istiyorsa `createOptionalChannelSetupSurface(...)` tercih edin. Oluşturulan
bağdaştırıcı/sihirbaz yapılandırma yazımlarında ve sonlandırmada hata durumunda kapalı kalır ve
aynı yükleme-gerekli iletisini doğrulama, sonlandırma ve belgeler bağlantısı metni boyunca yeniden kullanır.

Diğer sıcak kanal yolları için de daha geniş eski yüzeyler yerine dar yardımcıları
tercih edin:

- çok hesaplı yapılandırma ve
  varsayılan hesap geri dönüşü için `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` ve
  `openclaw/plugin-sdk/account-helpers`
- gelen rota/zarf ve
  kaydet-ve-dağıt kablolaması için `openclaw/plugin-sdk/inbound-envelope` ve
  `openclaw/plugin-sdk/inbound-reply-dispatch`
- hedef çözümleme/eşleştirme için `openclaw/plugin-sdk/messaging-targets`
- medya yükleme ve giden
  kimlik/gönderme delege işlemleri için `openclaw/plugin-sdk/outbound-media` ve
  `openclaw/plugin-sdk/outbound-runtime`
- iş parçacığı bağlama yaşam döngüsü
  ve bağdaştırıcı kaydı için `openclaw/plugin-sdk/thread-bindings-runtime`
- yalnızca eski agent/media
  yük alan düzeni hâlâ gerekiyorsa `openclaw/plugin-sdk/agent-media-payload`
- Telegram özel komut
  normalleştirmesi, yinelenen/çakışma doğrulaması ve geri dönüş açısından kararlı komut
  yapılandırma sözleşmesi için `openclaw/plugin-sdk/telegram-command-config`

Yalnızca kimlik doğrulamalı kanallar genellikle varsayılan yolda kalabilir: çekirdek onayları yönetir ve eklenti yalnızca giden/kimlik doğrulama yeteneklerini açığa çıkarır. Matrix, Slack, Telegram ve özel sohbet taşıma sistemleri gibi yerel onay kanalları, kendi onay yaşam döngülerini yazmak yerine paylaşılan yerel yardımcıları kullanmalıdır.

## Adım adım anlatım

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket ve manifest">
    Standart eklenti dosyalarını oluşturun. `package.json` içindeki `channel` alanı,
    bunun bir kanal eklentisi olmasını sağlar. Tam paket meta veri yüzeyi için
    [Eklenti Kurulumu ve Yapılandırma](/plugins/sdk-setup#openclawchannel) bölümüne bakın:

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

  <Step title="Kanal eklentisi nesnesini oluşturun">
    `ChannelPlugin` arayüzü birçok isteğe bağlı bağdaştırıcı yüzeyi içerir. Asgari düzeyle başlayın —
    `id` ve `setup` — ve ihtiyaç duydukça bağdaştırıcılar ekleyin.

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

    <Accordion title="createChatChannelPlugin size sizin için ne yapar">
      Düşük seviyeli bağdaştırıcı arayüzlerini elle uygulamak yerine,
      bildirimsel seçenekler verirsiniz ve oluşturucu bunları birleştirir:

      | Seçenek | Bağladığı şey |
      | --- | --- |
      | `security.dm` | Yapılandırma alanlarından kapsamlı DM güvenlik çözümleyicisi |
      | `pairing.text` | Kod alışverişiyle metin tabanlı DM eşleştirme akışı |
      | `threading` | Yanıt-modu çözümleyicisi (sabit, hesap kapsamlı veya özel) |
      | `outbound.attachedResults` | Sonuç meta verisi döndüren gönderme işlevleri (mesaj kimlikleri) |

      Tam denetime ihtiyacınız varsa bildirimsel seçenekler yerine ham bağdaştırıcı nesnelerini de verebilirsiniz.
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

    Kanalın sahibi olduğu CLI tanımlayıcılarını `registerCliMetadata(...)` içine yerleştirin; böylece OpenClaw
    tam kanal çalışma zamanını etkinleştirmeden bunları kök yardımda gösterebilir.
    Aynı zamanda normal tam yüklemeler gerçek komut
    kaydı için aynı tanımlayıcıları almaya devam eder. `registerFull(...)` yalnızca çalışma zamanına özgü işler için kalsın.
    `registerFull(...)` gateway RPC yöntemleri kaydediyorsa,
    eklentiye özgü bir önek kullanın. Çekirdek yönetici ad alanları (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) ayrılmıştır ve her zaman
    `operator.admin` olarak çözülür.
    `defineChannelPluginEntry`, kayıt modu ayrımını otomatik olarak yönetir. Tüm
    seçenekler için [Giriş Noktaları](/plugins/sdk-entrypoints#definechannelpluginentry) bölümüne bakın.

  </Step>

  <Step title="Bir kurulum girişi ekleyin">
    Onboarding sırasında hafif yükleme için `setup-entry.ts` oluşturun:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw, kanal devre dışıyken
    veya yapılandırılmamışken tam giriş yerine bunu yükler.
    Bu, kurulum akışları sırasında ağır çalışma zamanı kodunun içe çekilmesini önler.
    Ayrıntılar için [Kurulum ve Yapılandırma](/plugins/sdk-setup#setup-entry) bölümüne bakın.

  </Step>

  <Step title="Gelen mesajları işleyin">
    Eklentinizin platformdan mesaj alması ve bunları
    OpenClaw'a iletmesi gerekir. Tipik örnek, isteği doğrulayan ve
    bunu kanalınızın gelen işleyicisi üzerinden dağıtan bir webhook'tur:

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
      Gelen mesaj işleme kanala özgüdür. Her kanal eklentisi
      kendi gelen işlem hattının sahibidir. Gerçek örnekler için paketlenmiş kanal eklentilerine
      (örneğin Microsoft Teams veya Google Chat eklenti paketi)
      bakın.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test edin">
Yan yana konumlandırılmış testleri `src/channel.test.ts` içinde yazın:

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

    Paylaşılan test yardımcıları için [Test](/plugins/sdk-testing) bölümüne bakın.

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
  <Card title="İş parçacığı oluşturma seçenekleri" icon="git-branch" href="/plugins/sdk-entrypoints#registration-mode">
    Sabit, hesap kapsamlı veya özel yanıt modları
  </Card>
  <Card title="Message aracı entegrasyonu" icon="puzzle" href="/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool ve eylem keşfi
  </Card>
  <Card title="Hedef çözümleme" icon="crosshair" href="/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Çalışma zamanı yardımcıları" icon="settings" href="/plugins/sdk-runtime">
    api.runtime aracılığıyla TTS, STT, medya, alt ajan
  </Card>
</CardGroup>

<Note>
Bazı paketlenmiş yardımcı yüzeyler hâlâ paketlenmiş eklenti bakımı ve
uyumluluk için vardır. Bunlar yeni kanal eklentileri için önerilen desen değildir;
o paketlenmiş eklenti ailesini doğrudan sürdürmüyorsanız ortak SDK
yüzeyinden genel kanal/kurulum/yanıt/çalışma zamanı alt yollarını tercih edin.
</Note>

## Sonraki adımlar

- [Sağlayıcı Eklentileri](/plugins/sdk-provider-plugins) — eklentiniz aynı zamanda modeller de sağlıyorsa
- [SDK Genel Bakış](/plugins/sdk-overview) — tam alt yol içe aktarma başvurusu
- [SDK Testing](/plugins/sdk-testing) — test yardımcıları ve sözleşme testleri
- [Eklenti Manifesti](/plugins/manifest) — tam manifest şeması

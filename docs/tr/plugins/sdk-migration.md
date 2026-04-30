---
read_when:
    - OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED uyarısını görüyorsunuz
    - OPENCLAW_EXTENSION_API_DEPRECATED uyarısını görüyorsunuz
    - OpenClaw 2026.4.25'ten önce api.registerEmbeddedExtensionFactory kullandınız
    - Bir Plugin'i modern Plugin mimarisine geçiriyorsunuz
    - Harici bir OpenClaw Plugin'in bakımını yapıyorsunuz
sidebarTitle: Migrate to SDK
summary: Eski geriye dönük uyumluluk katmanından modern Plugin SDK'ye geçiş yapın
title: Plugin SDK geçişi
x-i18n:
    generated_at: "2026-04-30T09:37:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00a1f95a33c50d5c69d7b4768858289365bf29ed069abb3f29218e03c597b4c6
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw geniş bir geriye dönük uyumluluk katmanından, odaklanmış ve belgelenmiş içe aktarmalara sahip modern bir Plugin
mimarisine geçti. Plugin'iniz yeni mimariden önce oluşturulduysa, bu kılavuz geçiş yapmanıza yardımcı olur.

## Neler değişiyor

Eski Plugin sistemi, Plugin'lerin ihtiyaç duydukları her şeyi tek bir giriş noktasından içe aktarmasına
izin veren iki tamamen açık yüzey sağlıyordu:

- **`openclaw/plugin-sdk/compat`** — onlarca yardımcıyı yeniden dışa aktaran tek bir içe aktarma.
  Yeni Plugin mimarisi oluşturulurken eski hook tabanlı Plugin'lerin çalışmaya devam etmesi için
  tanıtılmıştı.
- **`openclaw/plugin-sdk/infra-runtime`** — sistem olaylarını, Heartbeat durumunu, teslim kuyruklarını,
  fetch/proxy yardımcılarını, dosya yardımcılarını, onay türlerini ve ilgisiz yardımcı programları
  karıştıran geniş bir çalışma zamanı yardımcı barrel'ı.
- **`openclaw/plugin-sdk/config-runtime`** — geçiş penceresi sırasında kullanımdan kaldırılmış doğrudan
  yükleme/yazma yardımcılarını hâlâ taşıyan geniş bir yapılandırma uyumluluk barrel'ı.
- **`openclaw/extension-api`** — Plugin'lere gömülü aracı çalıştırıcısı gibi ana taraf yardımcılarına
  doğrudan erişim veren bir köprü.
- **`api.registerEmbeddedExtensionFactory(...)`** — `tool_result` gibi gömülü çalıştırıcı olaylarını
  gözlemleyebilen, kaldırılmış Pi'ye özgü paketli
  eklenti hook'u.

Geniş içe aktarma yüzeyleri artık **kullanımdan kaldırıldı**. Çalışma zamanında hâlâ çalışırlar,
ancak yeni Plugin'ler bunları kullanmamalıdır ve mevcut Plugin'ler, bir sonraki ana sürüm bunları kaldırmadan önce
geçiş yapmalıdır. Pi'ye özgü gömülü eklenti fabrikası
kayıt API'si kaldırıldı; bunun yerine araç sonucu middleware'i kullanın.

OpenClaw, bir yedek getiren aynı değişiklik içinde belgelenmiş Plugin davranışını kaldırmaz veya yeniden yorumlamaz.
Sözleşmeyi bozan değişiklikler önce
bir uyumluluk bağdaştırıcısından, tanılardan, dokümantasyondan ve bir kullanımdan kaldırma penceresinden geçmelidir.
Bu; SDK içe aktarmaları, manifest alanları, kurulum API'leri, hook'lar ve çalışma zamanı
kayıt davranışı için geçerlidir.

<Warning>
  Geriye dönük uyumluluk katmanı gelecekteki bir ana sürümde kaldırılacak.
  Bu yüzeylerden hâlâ içe aktarma yapan Plugin'ler, bu gerçekleştiğinde bozulacaktır.
  Pi'ye özgü gömülü eklenti fabrikası kayıtları artık zaten yüklenmiyor.
</Warning>

## Bu neden değişti

Eski yaklaşım sorunlara neden oldu:

- **Yavaş başlangıç** — tek bir yardımcıyı içe aktarmak onlarca ilgisiz modülü yüklüyordu
- **Döngüsel bağımlılıklar** — geniş yeniden dışa aktarmalar, içe aktarma döngüleri oluşturmayı kolaylaştırıyordu
- **Belirsiz API yüzeyi** — hangi dışa aktarmaların kararlı, hangilerinin dahili olduğunu anlamanın yolu yoktu

Modern Plugin SDK bunu düzeltir: her içe aktarma yolu (`openclaw/plugin-sdk/\<subpath\>`)
net bir amacı ve belgelenmiş sözleşmesi olan küçük, kendi kendine yeten bir modüldür.

Paketli kanallar için eski sağlayıcı kolaylık dikişleri de kaldırıldı.
Kanal markalı yardımcı dikişler, kararlı
Plugin sözleşmeleri değil, özel mono-repo kestirmeleriydi. Bunun yerine dar, genel SDK alt yollarını kullanın. Paketli
Plugin çalışma alanı içinde, sağlayıcıya ait yardımcıları o Plugin'in kendi `api.ts` veya
`runtime-api.ts` dosyasında tutun.

Güncel paketli sağlayıcı örnekleri:

- Anthropic, Claude'a özgü akış yardımcılarını kendi `api.ts` /
  `contract-api.ts` dikişinde tutar
- OpenAI, sağlayıcı oluşturucularını, varsayılan model yardımcılarını ve realtime sağlayıcı
  oluşturucularını kendi `api.ts` dosyasında tutar
- OpenRouter, sağlayıcı oluşturucusunu ve onboarding/yapılandırma yardımcılarını kendi
  `api.ts` dosyasında tutar

## Uyumluluk politikası

Harici Plugin'ler için uyumluluk çalışması şu sırayı izler:

1. yeni sözleşmeyi ekle
2. eski davranışı bir uyumluluk bağdaştırıcısı üzerinden bağlı tut
3. eski yolu ve yerine kullanılacak yolu adlandıran bir tanı veya uyarı yayınla
4. testlerde iki yolu da kapsa
5. kullanımdan kaldırmayı ve geçiş yolunu belgele
6. yalnızca duyurulan geçiş penceresinden sonra, genellikle bir ana sürümde kaldır

Bakımcılar mevcut geçiş kuyruğunu
`pnpm plugins:boundary-report` ile denetleyebilir. Kompakt sayımlar için
`pnpm plugins:boundary-report:summary`, tek bir Plugin veya uyumluluk sahibi için `--owner <id>` ve
bir CI kapısı süresi gelen uyumluluk kayıtları, sahipler arası ayrılmış SDK içe aktarmaları veya kullanılmayan ayrılmış SDK
alt yolları nedeniyle başarısız olmalıysa
`pnpm plugins:boundary-report:ci` kullanın. Rapor, kullanımdan kaldırılmış
uyumluluk kayıtlarını kaldırma tarihine göre gruplar, yerel kod/dokümantasyon referanslarını sayar,
sahipler arası ayrılmış SDK içe aktarmalarını yüzeye çıkarır ve özel
memory-host SDK köprüsünü özetler; böylece uyumluluk temizliği geçici aramalara
dayanmak yerine açık kalır. Ayrılmış SDK alt yollarının izlenen sahip kullanımı olmalıdır;
kullanılmayan ayrılmış yardımcı dışa aktarmaları public SDK'den kaldırılmalıdır.

Bir manifest alanı hâlâ kabul ediliyorsa, Plugin yazarları dokümantasyon ve tanılar aksini söyleyene kadar
onu kullanmaya devam edebilir. Yeni kod belgelenmiş
yerine kullanılacak yolu tercih etmelidir, ancak mevcut Plugin'ler olağan minor
sürümler sırasında bozulmamalıdır.

## Geçiş nasıl yapılır

<Steps>
  <Step title="Çalışma zamanı yapılandırma yükleme/yazma yardımcılarını taşıyın">
    Paketli Plugin'ler
    `api.runtime.config.loadConfig()` ve
    `api.runtime.config.writeConfigFile(...)` çağrılarını doğrudan yapmayı bırakmalıdır. Etkin çağrı yoluna
    zaten geçirilmiş yapılandırmayı tercih edin. Geçerli süreç anlık görüntüsüne ihtiyaç duyan
    uzun ömürlü işleyiciler `api.runtime.config.current()` kullanabilir. Uzun ömürlü
    agent araçları, bir yapılandırma yazımından önce oluşturulmuş bir araç hâlâ yenilenmiş
    çalışma zamanı yapılandırmasını görebilsin diye `execute` içinde araç bağlamının `ctx.getRuntimeConfig()` metodunu kullanmalıdır.

    Yapılandırma yazmaları transactional yardımcılar üzerinden geçmeli ve bir
    yazma sonrası politikası seçmelidir:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Çağıran taraf değişikliğin temiz bir gateway yeniden başlatması gerektirdiğini bildiğinde
    `afterWrite: { mode: "restart", reason: "..." }` kullanın ve
    yalnızca çağıran taraf devamını üstleniyor ve yeniden yükleme planlayıcısını bilinçli olarak bastırmak istiyorsa
    `afterWrite: { mode: "none", reason: "..." }` kullanın.
    Mutasyon sonuçları testler ve günlükleme için tipli bir `followUp` özeti içerir;
    gateway, yeniden başlatmayı uygulamak veya zamanlamakla sorumlu kalır.
    `loadConfig` ve `writeConfigFile`, geçiş penceresi sırasında harici Plugin'ler için kullanımdan kaldırılmış uyumluluk
    yardımcıları olarak kalır ve
    `runtime-config-load-write` uyumluluk koduyla bir kez uyarır. Paketli Plugin'ler ve repo
    çalışma zamanı kodu,
    `pnpm check:deprecated-internal-config-api` ve
    `pnpm check:no-runtime-action-load-config` içindeki tarayıcı korumalarıyla korunur: yeni production Plugin kullanımı
    doğrudan başarısız olur, doğrudan yapılandırma yazmaları başarısız olur, gateway sunucu metotları
    istek çalışma zamanı anlık görüntüsünü kullanmalıdır, çalışma zamanı kanal gönderme/action/client yardımcıları
    yapılandırmayı kendi sınırlarından almalıdır ve uzun ömürlü çalışma zamanı modüllerinde
    izin verilen ortam `loadConfig()` çağrısı sayısı sıfırdır.

    Yeni Plugin kodu ayrıca geniş
    `openclaw/plugin-sdk/config-runtime` uyumluluk barrel'ını içe aktarmaktan kaçınmalıdır. İşe uyan dar
    SDK alt yolunu kullanın:

    | İhtiyaç | İçe aktarma |
    | --- | --- |
    | `OpenClawConfig` gibi yapılandırma türleri | `openclaw/plugin-sdk/config-types` |
    | Zaten yüklenmiş yapılandırma doğrulamaları ve Plugin giriş yapılandırma araması | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Geçerli çalışma zamanı anlık görüntüsü okumaları | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Yapılandırma yazmaları | `openclaw/plugin-sdk/config-mutation` |
    | Oturum deposu yardımcıları | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown tablo yapılandırması | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Grup politikası çalışma zamanı yardımcıları | `openclaw/plugin-sdk/runtime-group-policy` |
    | Gizli girdi çözümleme | `openclaw/plugin-sdk/secret-input-runtime` |
    | Model/oturum geçersiz kılmaları | `openclaw/plugin-sdk/model-session-runtime` |

    Paketli Plugin'ler ve testleri, geniş
    barrel'a karşı tarayıcı korumalıdır; böylece içe aktarmalar ve mock'lar ihtiyaç duydukları davranışa yerel kalır. Geniş
    barrel harici uyumluluk için hâlâ vardır, ancak yeni kod ona
    bağımlı olmamalıdır.

  </Step>

  <Step title="Pi araç sonucu eklentilerini middleware'e taşıyın">
    Paketli Plugin'ler, Pi'ye özgü
    `api.registerEmbeddedExtensionFactory(...)` araç sonucu işleyicilerini
    çalışma zamanından bağımsız middleware ile değiştirmelidir.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Aynı anda Plugin manifestini güncelleyin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Harici Plugin'ler araç sonucu middleware'i kaydedemez, çünkü model görmeden önce
    yüksek güvenli araç çıktısını yeniden yazabilir.

  </Step>

  <Step title="Onaya özgü işleyicileri capability facts'e taşıyın">
    Onay destekli kanal Plugin'leri artık native onay davranışını
    `approvalCapability.nativeRuntime` ve paylaşılan çalışma zamanı bağlam kayıt defteri üzerinden açığa çıkarır.

    Temel değişiklikler:

    - `approvalCapability.handler.loadRuntime(...)` yerine
      `approvalCapability.nativeRuntime` kullanın
    - Onaya özgü kimlik doğrulama/teslimi eski `plugin.auth` /
      `plugin.approvals` bağlantılarından çıkarıp `approvalCapability` üzerine taşıyın
    - `ChannelPlugin.approvals` public kanal Plugin
      sözleşmesinden kaldırıldı; delivery/native/render alanlarını `approvalCapability` üzerine taşıyın
    - `plugin.auth` yalnızca kanal oturum açma/oturum kapatma akışları için kalır; buradaki onay kimlik doğrulama
      hook'ları artık core tarafından okunmaz
    - İstemciler, token'lar veya Bolt
      uygulamaları gibi kanala ait çalışma zamanı nesnelerini `openclaw/plugin-sdk/channel-runtime-context` üzerinden kaydedin
    - Native onay işleyicilerinden Plugin'e ait yeniden yönlendirme bildirimleri göndermeyin;
      core artık gerçek teslim sonuçlarından gelen başka yere yönlendirilmiş bildirimlerin sahibidir
    - `createChannelManager(...)` içine `channelRuntime` geçirirken,
      gerçek bir `createPluginRuntime().channel` yüzeyi sağlayın. Kısmi stub'lar reddedilir.

    Güncel onay capability
    düzeni için `/plugins/sdk-channel-plugins` bölümüne bakın.

  </Step>

  <Step title="Windows wrapper fallback davranışını denetleyin">
    Plugin'iniz `openclaw/plugin-sdk/windows-spawn` kullanıyorsa, çözümlenmemiş Windows
    `.cmd`/`.bat` wrapper'ları artık siz açıkça
    `allowShellFallback: true` geçmedikçe kapalı şekilde başarısız olur.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    Çağıran tarafınız shell fallback'e bilinçli olarak güvenmiyorsa,
    `allowShellFallback` ayarlamayın ve bunun yerine fırlatılan hatayı işleyin.

  </Step>

  <Step title="Kullanımdan kaldırılmış içe aktarmaları bulun">
    Plugin'inizde iki kullanımdan kaldırılmış yüzeyden herhangi birinden yapılan içe aktarmaları arayın:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Odaklanmış içe aktarmalarla değiştirin">
    Eski yüzeydeki her dışa aktarma belirli bir modern içe aktarma yoluna eşlenir:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Ana taraf yardımcıları için doğrudan içe aktarma yerine enjekte edilen Plugin çalışma zamanını kullanın:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Aynı desen, diğer eski bridge yardımcıları için de geçerlidir:

    | Eski import | Modern eşdeğer |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | oturum deposu yardımcıları | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Geniş infra-runtime import’larını değiştirin">
    `openclaw/plugin-sdk/infra-runtime` harici uyumluluk için hâlâ vardır,
    ancak yeni kod gerçekten ihtiyaç duyduğu odaklı yardımcı yüzeyi import
    etmelidir:

    | İhtiyaç | Import |
    | --- | --- |
    | Sistem olay kuyruğu yardımcıları | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat olayı ve görünürlük yardımcıları | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Bekleyen teslimat kuyruğu boşaltma | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Kanal etkinliği telemetrisi | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Bellek içi tekilleştirme önbellekleri | `openclaw/plugin-sdk/dedupe-runtime` |
    | Güvenli yerel dosya/medya yolu yardımcıları | `openclaw/plugin-sdk/file-access-runtime` |
    | Dispatcher uyumlu fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Proxy ve korumalı fetch yardımcıları | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF dispatcher ilke türleri | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Onay isteği/çözümleme türleri | `openclaw/plugin-sdk/approval-runtime` |
    | Onay yanıtı yükü ve komut yardımcıları | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Hata biçimlendirme yardımcıları | `openclaw/plugin-sdk/error-runtime` |
    | Aktarım hazır olma beklemeleri | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Güvenli token yardımcıları | `openclaw/plugin-sdk/secure-random-runtime` |
    | Sınırlı eşzamansız görev eşzamanlılığı | `openclaw/plugin-sdk/concurrency-runtime` |
    | Sayısal dönüştürme | `openclaw/plugin-sdk/number-runtime` |
    | İşlem yerelinde eşzamansız kilit | `openclaw/plugin-sdk/async-lock-runtime` |
    | Dosya kilitleri | `openclaw/plugin-sdk/file-lock` |

    Paketle gelen Plugin’ler `infra-runtime` kullanımına karşı tarayıcıyla
    korunur, bu yüzden repo kodu geniş barrel’a geri dönemez.

  </Step>

  <Step title="Kanal rota yardımcılarını taşıyın">
    Yeni kanal rota kodu `openclaw/plugin-sdk/channel-route` kullanmalıdır.
    Eski route-key ve comparable-target adları geçiş dönemi boyunca uyumluluk
    alias’ları olarak kalır, ancak yeni Plugin’ler davranışı doğrudan açıklayan
    rota adlarını kullanmalıdır:

    | Eski yardımcı | Modern yardımcı |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Modern rota yardımcıları `{ channel, to, accountId, threadId }` değerlerini
    yerel onaylar, yanıt bastırma, gelen tekilleştirme, cron teslimatı ve oturum
    yönlendirmesi genelinde tutarlı biçimde normalleştirir. Plugin’iniz özel
    hedef gramerine sahipse bu ayrıştırıcıyı aynı rota hedefi sözleşmesine
    uyarlamak için `resolveChannelRouteTargetWithParser(...)` kullanın.

  </Step>

  <Step title="Derleyin ve test edin">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Import yolu referansı

  <Accordion title="Common import path table">
  | İçe aktarma yolu | Amaç | Temel dışa aktarımlar |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kurallı Plugin giriş yardımcısı | `definePluginEntry` |
  | `plugin-sdk/core` | Kanal giriş tanımları/oluşturucuları için eski şemsiye yeniden dışa aktarım | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Kök yapılandırma şeması dışa aktarımı | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Tek sağlayıcılı giriş yardımcısı | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Odaklı kanal giriş tanımları ve oluşturucuları | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Paylaşılan kurulum sihirbazı yardımcıları | İzin listesi istemleri, kurulum durumu oluşturucuları |
  | `plugin-sdk/setup-runtime` | Kurulum zamanı runtime yardımcıları | İçe aktarma açısından güvenli kurulum yaması bağdaştırıcıları, arama-notu yardımcıları, `promptResolvedAllowFrom`, `splitSetupEntries`, devredilmiş kurulum proxy'leri |
  | `plugin-sdk/setup-adapter-runtime` | Kurulum bağdaştırıcısı yardımcıları | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Kurulum araç yardımcıları | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Çok hesaplı yardımcılar | Hesap listesi/yapılandırma/eylem kapısı yardımcıları |
  | `plugin-sdk/account-id` | Hesap kimliği yardımcıları | `DEFAULT_ACCOUNT_ID`, hesap kimliği normalizasyonu |
  | `plugin-sdk/account-resolution` | Hesap arama yardımcıları | Hesap arama + varsayılan yedeğe düşme yardımcıları |
  | `plugin-sdk/account-helpers` | Dar kapsamlı hesap yardımcıları | Hesap listesi/hesap eylemi yardımcıları |
  | `plugin-sdk/channel-setup` | Kurulum sihirbazı bağdaştırıcıları | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ayrıca `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM eşleştirme ilkel öğeleri | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Yanıt öneki, yazıyor durumu ve kaynak teslimatı kablolaması | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Yapılandırma bağdaştırıcısı fabrikaları ve DM erişim yardımcıları | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Yapılandırma şeması oluşturucuları | Yalnızca paylaşılan kanal yapılandırma şeması ilkel öğeleri ve genel oluşturucu |
  | `plugin-sdk/bundled-channel-config-schema` | Paketlenmiş yapılandırma şemaları | Yalnızca OpenClaw tarafından sürdürülen paketlenmiş Plugin'ler; yeni Plugin'ler Plugin'e yerel şemalar tanımlamalıdır |
  | `plugin-sdk/channel-config-schema-legacy` | Kullanımdan kaldırılmış paketlenmiş yapılandırma şemaları | Yalnızca uyumluluk takma adı; sürdürülen paketlenmiş Plugin'ler için `plugin-sdk/bundled-channel-config-schema` kullanın |
  | `plugin-sdk/telegram-command-config` | Telegram komut yapılandırması yardımcıları | Komut adı normalizasyonu, açıklama kırpma, yinelenen/çakışan doğrulaması |
  | `plugin-sdk/channel-policy` | Grup/DM ilkesi çözümleme | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Hesap durumu ve taslak akış yaşam döngüsü yardımcıları | `createAccountStatusSink`, taslak önizlemesi sonlandırma yardımcıları |
  | `plugin-sdk/inbound-envelope` | Gelen zarf yardımcıları | Paylaşılan rota + zarf oluşturucu yardımcıları |
  | `plugin-sdk/inbound-reply-dispatch` | Gelen yanıt yardımcıları | Paylaşılan kaydet-ve-dağıt yardımcıları |
  | `plugin-sdk/messaging-targets` | Mesajlaşma hedefi ayrıştırma | Hedef ayrıştırma/eşleştirme yardımcıları |
  | `plugin-sdk/outbound-media` | Giden medya yardımcıları | Paylaşılan giden medya yükleme |
  | `plugin-sdk/outbound-send-deps` | Giden gönderim bağımlılığı yardımcıları | Tam giden runtime'ı içe aktarmadan hafif `resolveOutboundSendDep` araması |
  | `plugin-sdk/outbound-runtime` | Giden runtime yardımcıları | Giden teslimat, kimlik/gönderim devretme, oturum, biçimlendirme ve yük planlama yardımcıları |
  | `plugin-sdk/thread-bindings-runtime` | Konu bağlama yardımcıları | Konu bağlama yaşam döngüsü ve bağdaştırıcı yardımcıları |
  | `plugin-sdk/agent-media-payload` | Eski medya yükü yardımcıları | Eski alan düzenleri için ajan medya yükü oluşturucu |
  | `plugin-sdk/channel-runtime` | Kullanımdan kaldırılmış uyumluluk katmanı | Yalnızca eski kanal runtime yardımcı programları |
  | `plugin-sdk/channel-send-result` | Gönderim sonucu türleri | Yanıt sonucu türleri |
  | `plugin-sdk/runtime-store` | Kalıcı Plugin depolaması | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Geniş runtime yardımcıları | Runtime/günlükleme/yedekleme/Plugin yükleme yardımcıları |
  | `plugin-sdk/runtime-env` | Dar kapsamlı runtime ortamı yardımcıları | Günlükleyici/runtime ortamı, zaman aşımı, yeniden deneme ve geri çekilme yardımcıları |
  | `plugin-sdk/plugin-runtime` | Paylaşılan Plugin runtime yardımcıları | Plugin komutları/kancaları/http/etkileşimli yardımcılar |
  | `plugin-sdk/hook-runtime` | Kanca işlem hattı yardımcıları | Paylaşılan Webhook/dahili kanca işlem hattı yardımcıları |
  | `plugin-sdk/lazy-runtime` | Tembel runtime yardımcıları | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Süreç yardımcıları | Paylaşılan exec yardımcıları |
  | `plugin-sdk/cli-runtime` | CLI runtime yardımcıları | Komut biçimlendirme, beklemeler, sürüm yardımcıları |
  | `plugin-sdk/gateway-runtime` | Gateway yardımcıları | Gateway istemcisi, olay döngüsü hazır başlatma yardımcısı ve kanal durumu yaması yardımcıları |
  | `plugin-sdk/config-runtime` | Kullanımdan kaldırılmış yapılandırma uyumluluk katmanı | `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` ve `config-mutation` tercih edin |
  | `plugin-sdk/telegram-command-config` | Telegram komut yardımcıları | Paketlenmiş Telegram sözleşme yüzeyi kullanılamadığında yedeğe düşmesi kararlı Telegram komut doğrulama yardımcıları |
  | `plugin-sdk/approval-runtime` | Onay istemi yardımcıları | Exec/Plugin onay yükü, onay yeteneği/profil yardımcıları, yerel onay yönlendirme/runtime yardımcıları ve yapılandırılmış onay görüntüleme yolu biçimlendirme |
  | `plugin-sdk/approval-auth-runtime` | Onay yetkilendirme yardımcıları | Onaylayıcı çözümleme, aynı sohbet eylem yetkilendirmesi |
  | `plugin-sdk/approval-client-runtime` | Onay istemcisi yardımcıları | Yerel exec onay profili/filtre yardımcıları |
  | `plugin-sdk/approval-delivery-runtime` | Onay teslimatı yardımcıları | Yerel onay yeteneği/teslimat bağdaştırıcıları |
  | `plugin-sdk/approval-gateway-runtime` | Onay Gateway yardımcıları | Paylaşılan onay Gateway çözümleme yardımcısı |
  | `plugin-sdk/approval-handler-adapter-runtime` | Onay bağdaştırıcısı yardımcıları | Sıcak kanal giriş noktaları için hafif yerel onay bağdaştırıcısı yükleme yardımcıları |
  | `plugin-sdk/approval-handler-runtime` | Onay işleyici yardımcıları | Daha geniş onay işleyici runtime yardımcıları; yeterli olduklarında daha dar bağdaştırıcı/Gateway sınırlarını tercih edin |
  | `plugin-sdk/approval-native-runtime` | Onay hedefi yardımcıları | Yerel onay hedefi/hesap bağlama yardımcıları |
  | `plugin-sdk/approval-reply-runtime` | Onay yanıtı yardımcıları | Exec/Plugin onay yanıtı yük yardımcıları |
  | `plugin-sdk/channel-runtime-context` | Kanal runtime bağlamı yardımcıları | Genel kanal runtime bağlamı kaydet/al/izle yardımcıları |
  | `plugin-sdk/security-runtime` | Güvenlik yardımcıları | Paylaşılan güven, DM geçitleme, harici içerik ve gizli bilgi toplama yardımcıları |
  | `plugin-sdk/ssrf-policy` | SSRF ilkesi yardımcıları | Host izin listesi ve özel ağ ilkesi yardımcıları |
  | `plugin-sdk/ssrf-runtime` | SSRF runtime yardımcıları | Sabitlenmiş dağıtıcı, korumalı fetch, SSRF ilkesi yardımcıları |
  | `plugin-sdk/system-event-runtime` | Sistem olayı yardımcıları | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat yardımcıları | Heartbeat olayı ve görünürlük yardımcıları |
  | `plugin-sdk/delivery-queue-runtime` | Teslimat kuyruğu yardımcıları | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Kanal etkinliği yardımcıları | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Tekilleştirme yardımcıları | Bellek içi tekilleştirme önbellekleri |
  | `plugin-sdk/file-access-runtime` | Dosya erişimi yardımcıları | Güvenli yerel dosya/medya yolu yardımcıları |
  | `plugin-sdk/transport-ready-runtime` | Aktarım hazır olma yardımcıları | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Sınırlı önbellek yardımcıları | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Tanılama geçitleme yardımcıları | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Hata biçimlendirme yardımcıları | `formatUncaughtError`, `isApprovalNotFoundError`, hata grafiği yardımcıları |
  | `plugin-sdk/fetch-runtime` | Sarmalanmış fetch/proxy yardımcıları | `resolveFetch`, proxy yardımcıları, EnvHttpProxyAgent seçenek yardımcıları |
  | `plugin-sdk/host-runtime` | Host normalizasyonu yardımcıları | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Yeniden deneme yardımcıları | `RetryConfig`, `retryAsync`, ilke çalıştırıcıları |
  | `plugin-sdk/allow-from` | İzin listesi biçimlendirme | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | İzin listesi giriş eşlemesi | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Komut geçitleme ve komut yüzeyi yardımcıları | `resolveControlCommandGate`, gönderen yetkilendirme yardımcıları, dinamik argüman menüsü biçimlendirmesi dahil komut kayıt defteri yardımcıları |
  | `plugin-sdk/command-status` | Komut durumu/yardım işleyicileri | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Gizli bilgi girişi ayrıştırma | Gizli bilgi girişi yardımcıları |
  | `plugin-sdk/webhook-ingress` | Webhook isteği yardımcıları | Webhook hedef yardımcı programları |
  | `plugin-sdk/webhook-request-guards` | Webhook gövde koruması yardımcıları | İstek gövdesi okuma/sınır yardımcıları |
  | `plugin-sdk/reply-runtime` | Paylaşılan yanıt runtime'ı | Gelen dağıtım, Heartbeat, yanıt planlayıcı, parçalama |
  | `plugin-sdk/reply-dispatch-runtime` | Dar kapsamlı yanıt dağıtım yardımcıları | Sonlandırma, sağlayıcı dağıtımı ve konuşma etiketi yardımcıları |
  | `plugin-sdk/reply-history` | Yanıt geçmişi yardımcıları | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Yanıt referansı planlama | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Yanıt parçası yardımcıları | Metin/markdown parçalama yardımcıları |
  | `plugin-sdk/session-store-runtime` | Oturum deposu yardımcıları | Depo yolu + güncellenme zamanı yardımcıları |
  | `plugin-sdk/state-paths` | Durum yolu yardımcıları | Durum ve OAuth dizini yardımcıları |
  | `plugin-sdk/routing` | Yönlendirme/oturum anahtarı yardımcıları | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, oturum anahtarı normalizasyon yardımcıları |
  | `plugin-sdk/status-helpers` | Kanal durumu yardımcıları | Kanal/hesap durumu özeti oluşturucuları, runtime durumu varsayılanları, sorun meta veri yardımcıları |
  | `plugin-sdk/target-resolver-runtime` | Hedef çözümleyici yardımcıları | Paylaşılan hedef çözümleyici yardımcıları |
  | `plugin-sdk/string-normalization-runtime` | Dize normalizasyonu yardımcıları | Slug/dize normalizasyonu yardımcıları |
  | `plugin-sdk/request-url` | İstek URL'si yardımcıları | İstek benzeri girişlerden dize URL'leri çıkarma |
  | `plugin-sdk/run-command` | Zamanlanmış komut yardımcıları | Normalleştirilmiş stdout/stderr ile zamanlanmış komut çalıştırıcı |
  | `plugin-sdk/param-readers` | Parametre okuyucuları | Yaygın araç/CLI parametre okuyucuları |
  | `plugin-sdk/tool-payload` | Araç yükü çıkarımı | Araç sonucu nesnelerinden normalleştirilmiş yükleri çıkarır |
  | `plugin-sdk/tool-send` | Araç gönderim çıkarımı | Araç argümanlarından kanonik gönderim hedefi alanlarını çıkarır |
  | `plugin-sdk/temp-path` | Geçici yol yardımcıları | Paylaşılan geçici indirme yolu yardımcıları |
  | `plugin-sdk/logging-core` | Günlükleme yardımcıları | Alt sistem günlükleyicisi ve redaksiyon yardımcıları |
  | `plugin-sdk/markdown-table-runtime` | Markdown tablo yardımcıları | Markdown tablo modu yardımcıları |
  | `plugin-sdk/reply-payload` | İleti yanıtı türleri | Yanıt yükü türleri |
  | `plugin-sdk/provider-setup` | Derlenmiş yerel/kendi barındırmalı sağlayıcı kurulum yardımcıları | Kendi barındırmalı sağlayıcı keşif/yapılandırma yardımcıları |
  | `plugin-sdk/self-hosted-provider-setup` | Odaklı OpenAI uyumlu kendi barındırmalı sağlayıcı kurulum yardımcıları | Aynı kendi barındırmalı sağlayıcı keşif/yapılandırma yardımcıları |
  | `plugin-sdk/provider-auth-runtime` | Sağlayıcı çalışma zamanı kimlik doğrulama yardımcıları | Çalışma zamanı API anahtarı çözümleme yardımcıları |
  | `plugin-sdk/provider-auth-api-key` | Sağlayıcı API anahtarı kurulum yardımcıları | API anahtarı ilk kurulum/profil yazma yardımcıları |
  | `plugin-sdk/provider-auth-result` | Sağlayıcı kimlik doğrulama sonucu yardımcıları | Standart OAuth kimlik doğrulama sonucu oluşturucu |
  | `plugin-sdk/provider-auth-login` | Sağlayıcı etkileşimli giriş yardımcıları | Paylaşılan etkileşimli giriş yardımcıları |
  | `plugin-sdk/provider-selection-runtime` | Sağlayıcı seçimi yardımcıları | Yapılandırılmış veya otomatik sağlayıcı seçimi ve ham sağlayıcı yapılandırması birleştirme |
  | `plugin-sdk/provider-env-vars` | Sağlayıcı ortam değişkeni yardımcıları | Sağlayıcı kimlik doğrulama ortam değişkeni arama yardımcıları |
  | `plugin-sdk/provider-model-shared` | Paylaşılan sağlayıcı model/yeniden oynatma yardımcıları | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan yeniden oynatma ilkesi oluşturucuları, sağlayıcı uç nokta yardımcıları ve model kimliği normalleştirme yardımcıları |
  | `plugin-sdk/provider-catalog-shared` | Paylaşılan sağlayıcı katalog yardımcıları | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Sağlayıcı ilk kurulum yamaları | İlk kurulum yapılandırma yardımcıları |
  | `plugin-sdk/provider-http` | Sağlayıcı HTTP yardımcıları | Ses transkripsiyonu çok parçalı form yardımcıları dahil genel sağlayıcı HTTP/uç nokta yetenek yardımcıları |
  | `plugin-sdk/provider-web-fetch` | Sağlayıcı web alma yardımcıları | Web alma sağlayıcı kayıt/önbellek yardımcıları |
  | `plugin-sdk/provider-web-search-config-contract` | Sağlayıcı web arama yapılandırma yardımcıları | Plugin etkinleştirme bağlantısına gerek duymayan sağlayıcılar için dar web arama yapılandırma/kimlik bilgisi yardımcıları |
  | `plugin-sdk/provider-web-search-contract` | Sağlayıcı web arama sözleşmesi yardımcıları | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` ve kapsamlı kimlik bilgisi ayarlayıcıları/alıcıları gibi dar web arama yapılandırma/kimlik bilgisi sözleşmesi yardımcıları |
  | `plugin-sdk/provider-web-search` | Sağlayıcı web arama yardımcıları | Web arama sağlayıcı kayıt/önbellek/çalışma zamanı yardımcıları |
  | `plugin-sdk/provider-tools` | Sağlayıcı araç/şema uyumluluk yardımcıları | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini şema temizleme + tanılamalar ve `resolveXaiModelCompatPatch` / `applyXaiModelCompat` gibi xAI uyumluluk yardımcıları |
  | `plugin-sdk/provider-usage` | Sağlayıcı kullanım yardımcıları | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` ve diğer sağlayıcı kullanım yardımcıları |
  | `plugin-sdk/provider-stream` | Sağlayıcı akış sarmalayıcı yardımcıları | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri ve paylaşılan Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot sarmalayıcı yardımcıları |
  | `plugin-sdk/provider-transport-runtime` | Sağlayıcı taşıma yardımcıları | Korumalı fetch, taşıma ileti dönüşümleri ve yazılabilir taşıma olay akışları gibi yerel sağlayıcı taşıma yardımcıları |
  | `plugin-sdk/keyed-async-queue` | Sıralı eşzamansız kuyruk | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Paylaşılan medya yardımcıları | Medya alma/dönüştürme/depolama yardımcıları, ffprobe destekli video boyutu yoklama ve medya yükü oluşturucuları |
  | `plugin-sdk/media-generation-runtime` | Paylaşılan medya oluşturma yardımcıları | Görüntü/video/müzik oluşturma için paylaşılan yük devretme yardımcıları, aday seçimi ve eksik model iletileri |
  | `plugin-sdk/media-understanding` | Medya anlama yardımcıları | Medya anlama sağlayıcı türleri ve sağlayıcıya dönük görüntü/ses yardımcı dışa aktarımları |
  | `plugin-sdk/text-runtime` | Paylaşılan metin yardımcıları | Asistana görünür metin temizleme, Markdown render/parçalama/tablo yardımcıları, redaksiyon yardımcıları, yönerge etiketi yardımcıları, güvenli metin yardımcı programları ve ilgili metin/günlükleme yardımcıları |
  | `plugin-sdk/text-chunking` | Metin parçalama yardımcıları | Giden metin parçalama yardımcısı |
  | `plugin-sdk/speech` | Konuşma yardımcıları | Konuşma sağlayıcı türleri ve sağlayıcıya dönük yönerge, kayıt defteri, doğrulama yardımcıları ve OpenAI uyumlu TTS oluşturucu |
  | `plugin-sdk/speech-core` | Paylaşılan konuşma çekirdeği | Konuşma sağlayıcı türleri, kayıt defteri, yönergeler, normalleştirme |
  | `plugin-sdk/realtime-transcription` | Gerçek zamanlı transkripsiyon yardımcıları | Sağlayıcı türleri, kayıt defteri yardımcıları ve paylaşılan WebSocket oturum yardımcısı |
  | `plugin-sdk/realtime-voice` | Gerçek zamanlı ses yardımcıları | Sağlayıcı türleri, kayıt defteri/çözümleme yardımcıları ve köprü oturumu yardımcıları |
  | `plugin-sdk/image-generation` | Görüntü oluşturma yardımcıları | Görüntü oluşturma sağlayıcı türleri ve görüntü varlığı/veri URL'si yardımcıları ile OpenAI uyumlu görüntü sağlayıcısı oluşturucu |
  | `plugin-sdk/image-generation-core` | Paylaşılan görüntü oluşturma çekirdeği | Görüntü oluşturma türleri, yük devretme, kimlik doğrulama ve kayıt defteri yardımcıları |
  | `plugin-sdk/music-generation` | Müzik oluşturma yardımcıları | Müzik oluşturma sağlayıcı/istek/sonuç türleri |
  | `plugin-sdk/music-generation-core` | Paylaşılan müzik oluşturma çekirdeği | Müzik oluşturma türleri, yük devretme yardımcıları, sağlayıcı arama ve model başvurusu ayrıştırma |
  | `plugin-sdk/video-generation` | Video oluşturma yardımcıları | Video oluşturma sağlayıcı/istek/sonuç türleri |
  | `plugin-sdk/video-generation-core` | Paylaşılan video oluşturma çekirdeği | Video oluşturma türleri, yük devretme yardımcıları, sağlayıcı arama ve model başvurusu ayrıştırma |
  | `plugin-sdk/interactive-runtime` | Etkileşimli yanıt yardımcıları | Etkileşimli yanıt yükü normalleştirme/indirgeme |
  | `plugin-sdk/channel-config-primitives` | Kanal yapılandırma ilkelleri | Dar kanal yapılandırma şeması ilkelleri |
  | `plugin-sdk/channel-config-writes` | Kanal yapılandırma yazma yardımcıları | Kanal yapılandırma yazma yetkilendirme yardımcıları |
  | `plugin-sdk/channel-plugin-common` | Paylaşılan kanal başlangıç bölümü | Paylaşılan kanal Plugin başlangıç dışa aktarımları |
  | `plugin-sdk/channel-status` | Kanal durumu yardımcıları | Paylaşılan kanal durumu anlık görüntü/özet yardımcıları |
  | `plugin-sdk/allowlist-config-edit` | İzin verilenler listesi yapılandırma yardımcıları | İzin verilenler listesi yapılandırma düzenleme/okuma yardımcıları |
  | `plugin-sdk/group-access` | Grup erişimi yardımcıları | Paylaşılan grup erişimi karar yardımcıları |
  | `plugin-sdk/direct-dm` | Doğrudan DM yardımcıları | Paylaşılan doğrudan DM kimlik doğrulama/koruma yardımcıları |
  | `plugin-sdk/extension-shared` | Paylaşılan uzantı yardımcıları | Pasif kanal/durum ve ortam proxy yardımcı ilkelleri |
  | `plugin-sdk/webhook-targets` | Webhook hedef yardımcıları | Webhook hedef kayıt defteri ve rota kurulum yardımcıları |
  | `plugin-sdk/webhook-path` | Webhook yolu yardımcıları | Webhook yolu normalleştirme yardımcıları |
  | `plugin-sdk/web-media` | Paylaşılan web medya yardımcıları | Uzak/yerel medya yükleme yardımcıları |
  | `plugin-sdk/zod` | Zod yeniden dışa aktarımı | Plugin SDK tüketicileri için yeniden dışa aktarılan `zod` |
  | `plugin-sdk/memory-core` | Paketlenmiş memory-core yardımcıları | Bellek yöneticisi/yapılandırma/dosya/CLI yardımcı yüzeyi |
  | `plugin-sdk/memory-core-engine-runtime` | Bellek motoru çalışma zamanı cephesi | Bellek dizin/arama çalışma zamanı cephesi |
  | `plugin-sdk/memory-core-host-engine-foundation` | Bellek host temel motoru | Bellek host temel motoru dışa aktarımları |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Bellek host gömme motoru | Bellek gömme sözleşmeleri, kayıt defteri erişimi, yerel sağlayıcı ve genel toplu/uzak yardımcılar; somut uzak sağlayıcılar sahip oldukları Plugin'lerde bulunur |
  | `plugin-sdk/memory-core-host-engine-qmd` | Bellek host QMD motoru | Bellek host QMD motoru dışa aktarımları |
  | `plugin-sdk/memory-core-host-engine-storage` | Bellek host depolama motoru | Bellek host depolama motoru dışa aktarımları |
  | `plugin-sdk/memory-core-host-multimodal` | Bellek host çok modlu yardımcıları | Bellek host çok modlu yardımcıları |
  | `plugin-sdk/memory-core-host-query` | Bellek host sorgu yardımcıları | Bellek host sorgu yardımcıları |
  | `plugin-sdk/memory-core-host-secret` | Bellek host secret yardımcıları | Bellek host secret yardımcıları |
  | `plugin-sdk/memory-core-host-events` | Bellek host olay günlüğü yardımcıları | Bellek host olay günlüğü yardımcıları |
  | `plugin-sdk/memory-core-host-status` | Bellek host durum yardımcıları | Bellek host durum yardımcıları |
  | `plugin-sdk/memory-core-host-runtime-cli` | Bellek host CLI çalışma zamanı | Bellek host CLI çalışma zamanı yardımcıları |
  | `plugin-sdk/memory-core-host-runtime-core` | Bellek host çekirdek çalışma zamanı | Bellek host çekirdek çalışma zamanı yardımcıları |
  | `plugin-sdk/memory-core-host-runtime-files` | Bellek host dosya/çalışma zamanı yardımcıları | Bellek host dosya/çalışma zamanı yardımcıları |
  | `plugin-sdk/memory-host-core` | Bellek host çekirdek çalışma zamanı diğer adı | Bellek host çekirdek çalışma zamanı yardımcıları için sağlayıcıdan bağımsız diğer ad |
  | `plugin-sdk/memory-host-events` | Bellek host olay günlüğü diğer adı | Bellek host olay günlüğü yardımcıları için sağlayıcıdan bağımsız diğer ad |
  | `plugin-sdk/memory-host-files` | Bellek host dosya/çalışma zamanı diğer adı | Bellek host dosya/çalışma zamanı yardımcıları için sağlayıcıdan bağımsız diğer ad |
  | `plugin-sdk/memory-host-markdown` | Yönetilen Markdown yardımcıları | Belleğe bitişik Plugin'ler için paylaşılan yönetilen Markdown yardımcıları |
  | `plugin-sdk/memory-host-search` | Etkin bellek arama cephesi | Tembel etkin bellek arama yöneticisi çalışma zamanı cephesi |
  | `plugin-sdk/memory-host-status` | Bellek host durum diğer adı | Bellek host durum yardımcıları için sağlayıcıdan bağımsız diğer ad |
  | `plugin-sdk/testing` | Test yardımcı programları | Eski geniş uyumluluk barrel'i; `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` ve `plugin-sdk/test-fixtures` gibi odaklı test alt yollarını tercih edin |
</Accordion>

Bu tablo özellikle tam SDK yüzeyi değil, ortak geçiş alt kümesidir. 200+ giriş noktasının tam listesi `scripts/lib/plugin-sdk-entrypoints.json` içinde yer alır.

Ayrılmış yerleşik-plugin yardımcı kesitleri, yayımlanmış `@openclaw/discord@2026.3.13` paketi için tutulan, kullanım dışı `plugin-sdk/discord` shim gibi açıkça belgelenmiş uyumluluk cepheleri dışında herkese açık SDK export map içinden kaldırılmıştır. Sahibe özgü yardımcılar sahip olan plugin paketi içinde yaşar; paylaşılan host davranışı `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` ve `plugin-sdk/plugin-config-runtime` gibi genel SDK sözleşmeleri üzerinden ilerlemelidir.

İşe uyan en dar import yolunu kullanın. Bir export bulamazsanız, `src/plugin-sdk/` içindeki kaynağı denetleyin veya hangi genel sözleşmenin onu sahiplenmesi gerektiğini bakımcılara sorun.

## Etkin kullanım dışı bırakmalar

Plugin SDK, provider sözleşmesi, çalışma zamanı yüzeyi ve manifest genelinde geçerli daha dar kullanım dışı bırakmalar. Her biri bugün hâlâ çalışır, ancak gelecekteki bir major sürümde kaldırılacaktır. Her öğenin altındaki giriş, eski API'yi kanonik yerine eşler.

<AccordionGroup>
  <Accordion title="command-auth yardım oluşturucuları → command-status">
    **Eski (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Yeni (`openclaw/plugin-sdk/command-status`)**: aynı imzalar, aynı
    export'lar — yalnızca daha dar alt yoldan import edilir. `command-auth`
    bunları uyumluluk stub'ları olarak yeniden export eder.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Bahsetme denetimi yardımcıları → resolveInboundMentionDecision">
    **Eski**: `openclaw/plugin-sdk/channel-inbound` veya
    `openclaw/plugin-sdk/channel-mention-gating` içinden
    `resolveInboundMentionRequirement({ facts, policy })` ve
    `shouldDropInboundForMention(...)`.

    **Yeni**: `resolveInboundMentionDecision({ facts, policy })` — iki ayrı
    çağrı yerine tek bir karar nesnesi döndürür.

    Downstream kanal plugin'leri (Slack, Discord, Matrix, MS Teams) zaten
    geçiş yaptı.

  </Accordion>

  <Accordion title="Kanal çalışma zamanı shim'i ve kanal actions yardımcıları">
    `openclaw/plugin-sdk/channel-runtime`, eski kanal plugin'leri için bir
    uyumluluk shim'idir. Yeni koddan import etmeyin; çalışma zamanı
    nesnelerini kaydetmek için `openclaw/plugin-sdk/channel-runtime-context`
    kullanın.

    `openclaw/plugin-sdk/channel-actions` içindeki `channelActions*`
    yardımcıları, ham "actions" kanal export'larıyla birlikte kullanım dışıdır.
    Yetenekleri bunun yerine anlamsal `presentation` yüzeyi üzerinden sunun —
    kanal plugin'leri hangi ham action adlarını kabul ettiklerinden ziyade ne
    render ettiklerini (kartlar, düğmeler, seçimler) bildirir.

  </Accordion>

  <Accordion title="Web arama provider tool() yardımcısı → plugin üzerinde createTool()">
    **Eski**: `openclaw/plugin-sdk/provider-web-search` içinden `tool()` fabrikası.

    **Yeni**: `createTool(...)` öğesini doğrudan provider plugin üzerinde
    uygulayın. OpenClaw, araç sarmalayıcısını kaydetmek için artık SDK
    yardımcısına ihtiyaç duymaz.

  </Accordion>

  <Accordion title="Düz metin kanal zarfları → BodyForAgent">
    **Eski**: gelen kanal iletilerinden düz bir düz metin istem zarfı
    oluşturmak için `formatInboundEnvelope(...)` (ve
    `ChannelMessageForAgent.channelEnvelope`).

    **Yeni**: `BodyForAgent` artı yapılandırılmış kullanıcı bağlamı blokları.
    Kanal plugin'leri yönlendirme meta verilerini (ileti dizisi, konu,
    yanıt-hedefi, tepkiler) bir istem dizesine birleştirmek yerine tipli
    alanlar olarak ekler. `formatAgentEnvelope(...)` yardımcısı, sentezlenmiş
    asistan odaklı zarflar için hâlâ desteklenir, ancak gelen düz metin
    zarfları kullanımdan çıkıyor.

    Etkilenen alanlar: `inbound_claim`, `message_received` ve
    `channelEnvelope` metnini sonradan işleyen tüm özel kanal plugin'leri.

  </Accordion>

  <Accordion title="Provider keşif tipleri → provider katalog tipleri">
    Dört keşif tip takma adı artık katalog dönemi tipleri üzerinde ince
    sarmalayıcılardır:

    | Eski takma ad            | Yeni tip                  |
    | ------------------------ | ------------------------- |
    | `ProviderDiscoveryOrder` | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext` |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`  |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`  |

    Ayrıca eski `ProviderCapabilities` statik torbası — provider plugin'leri
    statik bir nesne yerine `buildReplayPolicy`, `normalizeToolSchemas` ve
    `wrapStreamFn` gibi açık provider hook'ları kullanmalıdır.

  </Accordion>

  <Accordion title="Düşünme ilkesi hook'ları → resolveThinkingProfile">
    **Eski** (`ProviderThinkingPolicy` üzerinde üç ayrı hook):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` ve
    `resolveDefaultThinkingLevel(ctx)`.

    **Yeni**: kanonik `id`, isteğe bağlı `label` ve sıralı seviye listesini
    içeren bir `ProviderThinkingProfile` döndüren tek bir
    `resolveThinkingProfile(ctx)`. OpenClaw, bayat saklanan değerleri profil
    sırasına göre otomatik olarak düşürür.

    Üç yerine bir hook uygulayın. Eski hook'lar kullanım dışı bırakma penceresi
    boyunca çalışmayı sürdürür, ancak profil sonucuyla birleştirilmez.

  </Accordion>

  <Accordion title="Harici OAuth provider fallback'i → contracts.externalAuthProviders">
    **Eski**: provider'ı plugin manifest içinde bildirmeden
    `resolveExternalOAuthProfiles(...)` uygulamak.

    **Yeni**: plugin manifest içinde `contracts.externalAuthProviders`
    bildirin **ve** `resolveExternalAuthProfiles(...)` uygulayın. Eski "auth
    fallback" yolu çalışma zamanında uyarı verir ve kaldırılacaktır.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider env-var araması → setup.providers[].envVars">
    **Eski** manifest alanı: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Yeni**: aynı env-var aramasını manifest üzerindeki
    `setup.providers[].envVars` içine yansıtın. Bu, kurulum/durum env meta
    verilerini tek yerde birleştirir ve yalnızca env-var aramalarını yanıtlamak
    için plugin çalışma zamanını başlatmayı önler.

    `providerAuthEnvVars`, kullanım dışı bırakma penceresi kapanana kadar bir
    uyumluluk adaptörü üzerinden desteklenmeye devam eder.

  </Accordion>

  <Accordion title="Bellek plugin kaydı → registerMemoryCapability">
    **Eski**: üç ayrı çağrı —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Yeni**: bellek durumu API'sinde tek çağrı —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Aynı slot'lar, tek kayıt çağrısı. Eklemeli bellek yardımcıları
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) etkilenmez.

  </Accordion>

  <Accordion title="Subagent oturum iletileri tipleri yeniden adlandırıldı">
    `src/plugins/runtime/types.ts` içinden hâlâ export edilen iki eski tip
    takma adı:

    | Eski                          | Yeni                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Çalışma zamanı yöntemi `readSession`, `getSessionMessages` lehine kullanım
    dışıdır. Aynı imza; eski yöntem yenisine çağrı aktarır.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Eski**: `runtime.tasks.flow` (tekil) canlı bir task-flow erişimcisi
    döndürüyordu.

    **Yeni**: `runtime.tasks.managedFlows`, bir akıştan alt görevler oluşturan,
    güncelleyen, iptal eden veya çalıştıran plugin'ler için yönetilen TaskFlow
    mutasyon çalışma zamanını korur. Plugin yalnızca DTO tabanlı okumalara
    ihtiyaç duyduğunda `runtime.tasks.flows` kullanın.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Gömülü extension fabrikaları → agent tool-result middleware'i">
    Yukarıdaki "Nasıl geçilir → Pi tool-result extension'larını middleware'e
    geçirme" bölümünde ele alınmıştır. Tamlık için burada da yer alır:
    kaldırılan yalnızca Pi'ye özgü `api.registerEmbeddedExtensionFactory(...)`
    yolu, `contracts.agentToolResultMiddleware` içinde açık bir çalışma zamanı
    listesiyle `api.registerAgentToolResultMiddleware(...)` ile değiştirilir.
  </Accordion>

  <Accordion title="OpenClawSchemaType takma adı → OpenClawConfig">
    `openclaw/plugin-sdk` içinden yeniden export edilen `OpenClawSchemaType`
    artık `OpenClawConfig` için tek satırlık bir takma addır. Kanonik adı
    tercih edin.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Extension düzeyi kullanım dışı bırakmalar (`extensions/` altındaki yerleşik
kanal/provider plugin'lerinin içinde), kendi `api.ts` ve `runtime-api.ts`
barrel'ları içinde izlenir. Bunlar üçüncü taraf plugin sözleşmelerini
etkilemez ve burada listelenmez. Yerleşik bir plugin'in yerel barrel'ını
doğrudan tüketiyorsanız, yükseltmeden önce o barrel içindeki kullanım dışı
bırakma yorumlarını okuyun.
</Note>

## Kaldırma zaman çizelgesi

| Ne zaman              | Ne olur                                                                 |
| --------------------- | ----------------------------------------------------------------------- |
| **Şimdi**             | Kullanım dışı yüzeyler çalışma zamanı uyarıları yayar                   |
| **Sonraki major sürüm** | Kullanım dışı yüzeyler kaldırılacak; bunları hâlâ kullanan plugin'ler başarısız olacak |

Tüm core plugin'ler zaten geçirilmiştir. Harici plugin'ler sonraki major
sürümden önce geçiş yapmalıdır.

## Uyarıları geçici olarak bastırma

Geçiş üzerinde çalışırken şu ortam değişkenlerini ayarlayın:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Bu geçici bir kaçış kapağıdır, kalıcı bir çözüm değildir.

## İlgili

- [Başlarken](/tr/plugins/building-plugins) — ilk plugin'inizi oluşturun
- [SDK Genel Bakış](/tr/plugins/sdk-overview) — tam alt yol import başvurusu
- [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) — kanal plugin'leri oluşturma
- [Provider Plugin'leri](/tr/plugins/sdk-provider-plugins) — provider plugin'leri oluşturma
- [Plugin İç Yapısı](/tr/plugins/architecture) — mimariye derinlemesine bakış
- [Plugin Manifest](/tr/plugins/manifest) — manifest şema başvurusu

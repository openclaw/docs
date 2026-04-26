---
read_when:
    - '`OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED` uyarısını görüyorsunuz'
    - '`OPENCLAW_EXTENSION_API_DEPRECATED` uyarısını görüyorsunuz'
    - OpenClaw 2026.4.25 öncesinde `api.registerEmbeddedExtensionFactory` kullandınız
    - Bir Plugin'i modern Plugin mimarisine güncelliyorsunuz
    - Harici bir OpenClaw Plugin'ini sürdürüyorsunuz
sidebarTitle: Migrate to SDK
summary: Eski geriye dönük uyumluluk katmanından modern Plugin SDK'ye geçiş
title: Plugin SDK geçişi
x-i18n:
    generated_at: "2026-04-26T11:36:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: ecff17f6be8bcbc310eac24bf53348ec0f7dfc06cc94de5e3a38967031737ccb
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw, geniş bir geriye dönük uyumluluk katmanından odaklı, belgelenmiş içe aktarmalara sahip modern bir Plugin
mimarisine geçti. Plugin'iniz yeni mimariden önce oluşturulduysa,
bu kılavuz geçiş yapmanıza yardımcı olur.

## Neler değişiyor

Eski Plugin sistemi, Plugin'lerin
ihtiyaç duydukları her şeyi tek bir giriş noktasından içe aktarmasına izin veren iki geniş yüzey sunuyordu:

- **`openclaw/plugin-sdk/compat`** — onlarca
  yardımcının yeniden dışa aktarıldığı tek bir içe aktarma. Yeni Plugin mimarisi oluşturulurken
  eski kanca tabanlı Plugin'lerin çalışmaya devam etmesini sağlamak için tanıtılmıştı.
- **`openclaw/extension-api`** — Plugin'lere
  gömülü ajan çalıştırıcısı gibi host tarafı yardımcılarına doğrudan erişim veren bir köprü.
- **`api.registerEmbeddedExtensionFactory(...)`** — `tool_result`
  gibi embedded-runner olaylarını gözlemleyebilen, kaldırılmış Pi-only bundled
  extension kancası.

Bu geniş içe aktarma yüzeyleri artık **kullanımdan kaldırılmıştır**. Çalışma zamanında hâlâ çalışırlar,
ancak yeni Plugin'ler bunları kullanmamalıdır ve mevcut Plugin'ler bir sonraki büyük sürümde kaldırılmadan önce geçiş yapmalıdır. Pi-only embedded extension factory
kayıt API'si kaldırılmıştır; bunun yerine tool-result middleware kullanın.

OpenClaw, bir yedek sunan aynı değişiklikte belgelenmiş Plugin davranışını kaldırmaz veya yeniden yorumlamaz.
Bozucu sözleşme değişiklikleri önce bir uyumluluk bağdaştırıcısı, tanılama, belgeler ve
bir kullanımdan kaldırma penceresinden geçmelidir.
Bu; SDK içe aktarmaları, manifest alanları, kurulum API'leri, kancalar ve çalışma zamanı
kayıt davranışı için de geçerlidir.

<Warning>
  Geriye dönük uyumluluk katmanı gelecekteki bir büyük sürümde kaldırılacaktır.
  Bu yüzeylerden hâlâ içe aktarma yapan Plugin'ler bu olduğunda kırılacaktır.
  Pi-only embedded extension factory kayıtları artık zaten yüklenmiyor.
</Warning>

## Bu neden değişti

Eski yaklaşım sorunlara neden oluyordu:

- **Yavaş başlangıç** — tek bir yardımcıyı içe aktarmak onlarca ilgisiz modülü yüklüyordu
- **Döngüsel bağımlılıklar** — geniş yeniden dışa aktarmalar içe aktarma döngüleri oluşturmayı kolaylaştırıyordu
- **Belirsiz API yüzeyi** — hangi export'ların kararlı, hangilerinin dahili olduğunu söylemenin yolu yoktu

Modern Plugin SDK bunu düzeltir: her içe aktarma yolu (`openclaw/plugin-sdk/\<subpath\>`)
küçük, kendi içinde tamamlanmış, açık amaçlı ve belgelenmiş sözleşmeli bir modüldür.

Bundled kanallar için eski sağlayıcı kolaylık dikişleri de kaldırıldı. `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
kanal markalı yardımcı dikişleri ve
`openclaw/plugin-sdk/telegram-core` gibi içe aktarmalar, kararlı
Plugin sözleşmeleri değil, özel mono-repo kısayollarıydı. Bunun yerine dar genel SDK alt yollarını kullanın. Bundled Plugin çalışma alanı içinde sağlayıcıya ait yardımcıları o Plugin'in kendi
`api.ts` veya `runtime-api.ts` dosyasında tutun.

Mevcut bundled sağlayıcı örnekleri:

- Anthropic, Claude'a özgü akış yardımcılarını kendi `api.ts` /
  `contract-api.ts` dikişinde tutar
- OpenAI, sağlayıcı oluşturucularını, varsayılan model yardımcılarını ve realtime provider
  oluşturucularını kendi `api.ts` dosyasında tutar
- OpenRouter, sağlayıcı oluşturucusunu ve onboarding/config yardımcılarını kendi
  `api.ts` dosyasında tutar

## Uyumluluk politikası

Harici Plugin'ler için uyumluluk çalışması şu sırayı izler:

1. yeni sözleşmeyi ekle
2. eski davranışı bir uyumluluk bağdaştırıcısı üzerinden bağlı tut
3. eski yolu ve yerine geçeni adlandıran bir tanılama veya uyarı üret
4. testlerde her iki yolu da kapsa
5. kullanımdan kaldırmayı ve geçiş yolunu belgele
6. yalnızca duyurulan geçiş penceresinden sonra kaldır; bu genellikle büyük bir sürümdür

Bir manifest alanı hâlâ kabul ediliyorsa, Plugin yazarları
belgeler ve tanılama aksi söyleyene kadar onu kullanmaya devam edebilir. Yeni kod belgelenmiş
yerine geçeni tercih etmelidir, ancak mevcut Plugin'ler sıradan küçük sürümlerde
kırılmamalıdır.

## Nasıl geçiş yapılır

<Steps>
  <Step title="Pi tool-result extension'larını middleware'e taşıyın">
    Bundled Plugin'ler, Pi-only
    `api.registerEmbeddedExtensionFactory(...)` tool-result işleyicilerini
    çalışma zamanı nötr middleware ile değiştirmelidir.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Aynı anda Plugin manifest'ini de güncelleyin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Harici Plugin'ler tool-result middleware kaydedemez; çünkü bu,
    model görmeden önce yüksek güvenli araç çıktısını yeniden yazabilir.

  </Step>

  <Step title="Approval-native işleyicileri capability facts'a taşıyın">
    Approval yetenekli kanal Plugin'leri artık yerel approval davranışını
    `approvalCapability.nativeRuntime` ve paylaşılan çalışma zamanı bağlam kayıt defteri üzerinden sunar.

    Temel değişiklikler:

    - `approvalCapability.handler.loadRuntime(...)` yerine
      `approvalCapability.nativeRuntime` kullanın
    - Approval'a özgü auth/delivery mantığını eski `plugin.auth` /
      `plugin.approvals` bağlantısından çıkarıp `approvalCapability` üzerine taşıyın
    - `ChannelPlugin.approvals`, genel channel-plugin
      sözleşmesinden kaldırılmıştır; delivery/native/render alanlarını `approvalCapability` üzerine taşıyın
    - `plugin.auth`, yalnızca kanal login/logout akışları için kalır; approval auth
      kancaları artık core tarafından okunmaz
    - İstemciler, token'lar veya Bolt
      uygulamaları gibi kanala ait çalışma zamanı nesnelerini `openclaw/plugin-sdk/channel-runtime-context`
      aracılığıyla kaydedin
    - Yerel approval işleyicilerinden Plugin'e ait reroute bildirimleri göndermeyin;
      core artık yönlendirme sonucu başka yere giden bildirimlerin sahibidir
    - `createChannelManager(...)` içine `channelRuntime` geçirirken,
      gerçek bir `createPluginRuntime().channel` yüzeyi sağlayın. Kısmi stub'lar reddedilir.

    Geçerli approval capability
    düzeni için `/plugins/sdk-channel-plugins` sayfasına bakın.

  </Step>

  <Step title="Windows wrapper fallback davranışını denetleyin">
    Plugin'iniz `openclaw/plugin-sdk/windows-spawn` kullanıyorsa,
    çözümlenmemiş Windows `.cmd`/`.bat` wrapper'ları artık siz açıkça
    `allowShellFallback: true` geçmediğiniz sürece kapalı şekilde başarısız olur.

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

    Çağıranınız bilinçli olarak shell fallback'e dayanmıyorsa
    `allowShellFallback` ayarlamayın ve bunun yerine fırlatılan hatayı işleyin.

  </Step>

  <Step title="Kullanımdan kaldırılmış içe aktarmaları bulun">
    Plugin'inizde bu kullanımdan kaldırılmış yüzeylerden yapılan içe aktarmaları arayın:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Odaklı içe aktarmalarla değiştirin">
    Eski yüzeydeki her export, belirli bir modern içe aktarma yoluna eşlenir:

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

    Host tarafı yardımcıları için doğrudan içe aktarmak yerine
    enjekte edilen Plugin çalışma zamanını kullanın:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Aynı desen diğer eski köprü yardımcıları için de geçerlidir:

    | Eski içe aktarma | Modern karşılığı |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | session store helpers | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Derleyin ve test edin">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## İçe aktarma yolu başvurusu

  <Accordion title="Yaygın içe aktarma yolu tablosu">
  | İçe aktarma yolu | Amaç | Temel export'lar |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kurallı Plugin giriş yardımcısı | `definePluginEntry` |
  | `plugin-sdk/core` | Kanal giriş tanımları/oluşturucuları için eski şemsiye yeniden dışa aktarma | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Kök yapılandırma şeması dışa aktarması | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Tek sağlayıcılı giriş yardımcısı | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Odaklı kanal giriş tanımları ve oluşturucuları | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Paylaşılan kurulum sihirbazı yardımcıları | Allowlist istemleri, kurulum durumu oluşturucuları |
  | `plugin-sdk/setup-runtime` | Kurulum zamanı çalışma zamanı yardımcıları | Güvenli içe aktarmalı kurulum yama bağdaştırıcıları, lookup-note yardımcıları, `promptResolvedAllowFrom`, `splitSetupEntries`, devredilen kurulum proxy'leri |
  | `plugin-sdk/setup-adapter-runtime` | Kurulum bağdaştırıcı yardımcıları | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Kurulum araç yardımcıları | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Çoklu hesap yardımcıları | Hesap listesi/yapılandırma/eylem-kapısı yardımcıları |
  | `plugin-sdk/account-id` | Hesap kimliği yardımcıları | `DEFAULT_ACCOUNT_ID`, hesap kimliği normalleştirme |
  | `plugin-sdk/account-resolution` | Hesap arama yardımcıları | Hesap arama + varsayılan yedek yardımcıları |
  | `plugin-sdk/account-helpers` | Dar hesap yardımcıları | Hesap listesi/hesap eylemi yardımcıları |
  | `plugin-sdk/channel-setup` | Kurulum sihirbazı bağdaştırıcıları | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ayrıca `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM eşleştirme ilkel öğeleri | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Yanıt öneki + yazıyor bağlantısı | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Yapılandırma bağdaştırıcı fabrikaları | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Yapılandırma şeması oluşturucuları | Paylaşılan kanal yapılandırma şeması ilkel öğeleri; bundled-channel-named şema export'ları yalnızca eski uyumluluk içindir |
  | `plugin-sdk/telegram-command-config` | Telegram komut yapılandırma yardımcıları | Komut adı normalleştirme, açıklama kırpma, yinelenen/çakışma doğrulaması |
  | `plugin-sdk/channel-policy` | Grup/DM politikası çözümleme | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Hesap durumu ve taslak akış yaşam döngüsü yardımcıları | `createAccountStatusSink`, taslak önizleme sonlandırma yardımcıları |
  | `plugin-sdk/inbound-envelope` | Gelen zarf yardımcıları | Paylaşılan yönlendirme + zarf oluşturucu yardımcıları |
  | `plugin-sdk/inbound-reply-dispatch` | Gelen yanıt yardımcıları | Paylaşılan kaydet ve dağıt yardımcıları |
  | `plugin-sdk/messaging-targets` | Mesajlaşma hedefi ayrıştırma | Hedef ayrıştırma/eşleştirme yardımcıları |
  | `plugin-sdk/outbound-media` | Giden medya yardımcıları | Paylaşılan giden medya yükleme |
  | `plugin-sdk/outbound-send-deps` | Giden gönderim bağımlılığı yardımcıları | Tam giden çalışma zamanını içe aktarmadan hafif `resolveOutboundSendDep` araması |
  | `plugin-sdk/outbound-runtime` | Giden çalışma zamanı yardımcıları | Giden teslim, kimlik/gönderim temsilcisi, oturum, biçimlendirme ve yük planlama yardımcıları |
  | `plugin-sdk/thread-bindings-runtime` | Konu bağlama yardımcıları | Konu bağlama yaşam döngüsü ve bağdaştırıcı yardımcıları |
  | `plugin-sdk/agent-media-payload` | Eski medya yükü yardımcıları | Eski alan düzenleri için ajan medya yükü oluşturucusu |
  | `plugin-sdk/channel-runtime` | Kullanımdan kaldırılmış uyumluluk shim'i | Yalnızca eski kanal çalışma zamanı yardımcıları |
  | `plugin-sdk/channel-send-result` | Gönderim sonucu türleri | Yanıt sonucu türleri |
  | `plugin-sdk/runtime-store` | Kalıcı Plugin depolaması | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Geniş çalışma zamanı yardımcıları | Çalışma zamanı/günlükleme/yedekleme/Plugin-kurulum yardımcıları |
  | `plugin-sdk/runtime-env` | Dar çalışma zamanı ortam yardımcıları | Logger/çalışma zamanı ortamı, zaman aşımı, yeniden deneme ve backoff yardımcıları |
  | `plugin-sdk/plugin-runtime` | Paylaşılan Plugin çalışma zamanı yardımcıları | Plugin komutları/kancaları/http/etkileşimli yardımcıları |
  | `plugin-sdk/hook-runtime` | Kanca hattı yardımcıları | Paylaşılan Webhook/dahili kanca hattı yardımcıları |
  | `plugin-sdk/lazy-runtime` | Tembel çalışma zamanı yardımcıları | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Süreç yardımcıları | Paylaşılan exec yardımcıları |
  | `plugin-sdk/cli-runtime` | CLI çalışma zamanı yardımcıları | Komut biçimlendirme, beklemeler, sürüm yardımcıları |
  | `plugin-sdk/gateway-runtime` | Gateway yardımcıları | Gateway istemcisi ve kanal-durumu yama yardımcıları |
  | `plugin-sdk/config-runtime` | Yapılandırma yardımcıları | Yapılandırma yükleme/yazma yardımcıları |
  | `plugin-sdk/telegram-command-config` | Telegram komut yardımcıları | Bundled Telegram sözleşme yüzeyi mevcut olmadığında fallback-kararlı Telegram komut doğrulama yardımcıları |
  | `plugin-sdk/approval-runtime` | Approval istem yardımcıları | Exec/Plugin approval yükü, approval capability/profile yardımcıları, yerel approval yönlendirme/çalışma zamanı yardımcıları ve yapılandırılmış approval görünüm yolu biçimlendirme |
  | `plugin-sdk/approval-auth-runtime` | Approval auth yardımcıları | Onaylayan çözümleme, aynı sohbet eylem kimlik doğrulaması |
  | `plugin-sdk/approval-client-runtime` | Approval istemci yardımcıları | Yerel exec approval profil/filtre yardımcıları |
  | `plugin-sdk/approval-delivery-runtime` | Approval teslim yardımcıları | Yerel approval capability/delivery bağdaştırıcıları |
  | `plugin-sdk/approval-gateway-runtime` | Approval gateway yardımcıları | Paylaşılan approval gateway çözümleme yardımcısı |
  | `plugin-sdk/approval-handler-adapter-runtime` | Approval bağdaştırıcı yardımcıları | Sıcak kanal giriş noktaları için hafif yerel approval bağdaştırıcı yükleme yardımcıları |
  | `plugin-sdk/approval-handler-runtime` | Approval işleyici yardımcıları | Daha geniş approval işleyici çalışma zamanı yardımcıları; dar bağdaştırıcı/gateway dikişleri yeterliyse onları tercih edin |
  | `plugin-sdk/approval-native-runtime` | Approval hedef yardımcıları | Yerel approval hedef/hesap bağlama yardımcıları |
  | `plugin-sdk/approval-reply-runtime` | Approval yanıt yardımcıları | Exec/Plugin approval yanıt yükü yardımcıları |
  | `plugin-sdk/channel-runtime-context` | Kanal çalışma zamanı bağlamı yardımcıları | Genel kanal çalışma zamanı bağlamı register/get/watch yardımcıları |
  | `plugin-sdk/security-runtime` | Güvenlik yardımcıları | Paylaşılan güven, DM sınırlaması, harici içerik ve sır toplama yardımcıları |
  | `plugin-sdk/ssrf-policy` | SSRF politikası yardımcıları | Host izin listesi ve özel ağ politikası yardımcıları |
  | `plugin-sdk/ssrf-runtime` | SSRF çalışma zamanı yardımcıları | Sabitlenmiş dispatcher, korumalı fetch, SSRF politikası yardımcıları |
  | `plugin-sdk/collection-runtime` | Sınırlı önbellek yardımcıları | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Tanılama sınırlama yardımcıları | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Hata biçimlendirme yardımcıları | `formatUncaughtError`, `isApprovalNotFoundError`, hata grafiği yardımcıları |
  | `plugin-sdk/fetch-runtime` | Sarılmış fetch/proxy yardımcıları | `resolveFetch`, proxy yardımcıları |
  | `plugin-sdk/host-runtime` | Host normalleştirme yardımcıları | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Yeniden deneme yardımcıları | `RetryConfig`, `retryAsync`, politika çalıştırıcıları |
  | `plugin-sdk/allow-from` | Allowlist biçimlendirme | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Allowlist girdi eşleme | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Komut sınırlama ve komut yüzeyi yardımcıları | `resolveControlCommandGate`, gönderici-yetkilendirme yardımcıları, dinamik argüman menü biçimlendirme dahil komut kayıt defteri yardımcıları |
  | `plugin-sdk/command-status` | Komut durumu/yardım oluşturucuları | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Secret girdi ayrıştırma | Secret girdi yardımcıları |
  | `plugin-sdk/webhook-ingress` | Webhook istek yardımcıları | Webhook hedef yardımcıları |
  | `plugin-sdk/webhook-request-guards` | Webhook gövde koruma yardımcıları | İstek gövdesi okuma/sınır yardımcıları |
  | `plugin-sdk/reply-runtime` | Paylaşılan yanıt çalışma zamanı | Gelen dağıtım, Heartbeat, yanıt planlayıcı, parçalama |
  | `plugin-sdk/reply-dispatch-runtime` | Dar yanıt dağıtım yardımcıları | Sonlandırma, sağlayıcı dağıtımı ve konuşma etiketi yardımcıları |
  | `plugin-sdk/reply-history` | Yanıt geçmişi yardımcıları | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Yanıt referansı planlama | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Yanıt parça yardımcıları | Metin/markdown parçalama yardımcıları |
  | `plugin-sdk/session-store-runtime` | Oturum deposu yardımcıları | Depo yolu + updated-at yardımcıları |
  | `plugin-sdk/state-paths` | Durum yolu yardımcıları | Durum ve OAuth dizin yardımcıları |
  | `plugin-sdk/routing` | Yönlendirme/oturum anahtarı yardımcıları | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, oturum anahtarı normalleştirme yardımcıları |
  | `plugin-sdk/status-helpers` | Kanal durum yardımcıları | Kanal/hesap durum özeti oluşturucuları, çalışma zamanı durumu varsayılanları, issue meta veri yardımcıları |
  | `plugin-sdk/target-resolver-runtime` | Hedef çözümleyici yardımcıları | Paylaşılan hedef çözümleyici yardımcıları |
  | `plugin-sdk/string-normalization-runtime` | String normalleştirme yardımcıları | Slug/string normalleştirme yardımcıları |
  | `plugin-sdk/request-url` | İstek URL yardımcıları | İstek benzeri girdilerden string URL çıkarma |
  | `plugin-sdk/run-command` | Zamanlanmış komut yardımcıları | Normalize stdout/stderr ile zamanlanmış komut çalıştırıcısı |
  | `plugin-sdk/param-readers` | Param okuyucular | Yaygın araç/CLI param okuyucular |
  | `plugin-sdk/tool-payload` | Araç yükü çıkarma | Araç sonuç nesnelerinden normalize yük çıkarma |
  | `plugin-sdk/tool-send` | Araç gönderim çıkarma | Araç argümanlarından kurallı gönderim hedef alanlarını çıkarma |
  | `plugin-sdk/temp-path` | Geçici yol yardımcıları | Paylaşılan geçici indirme yolu yardımcıları |
  | `plugin-sdk/logging-core` | Günlükleme yardımcıları | Alt sistem logger ve redaksiyon yardımcıları |
  | `plugin-sdk/markdown-table-runtime` | Markdown tablo yardımcıları | Markdown tablo kipi yardımcıları |
  | `plugin-sdk/reply-payload` | Mesaj yanıt türleri | Yanıt yükü türleri |
  | `plugin-sdk/provider-setup` | Düzenlenmiş yerel/kendi host edilen sağlayıcı kurulum yardımcıları | Kendi host edilen sağlayıcı keşif/yapılandırma yardımcıları |
  | `plugin-sdk/self-hosted-provider-setup` | Odaklı OpenAI uyumlu kendi host edilen sağlayıcı kurulum yardımcıları | Aynı kendi host edilen sağlayıcı keşif/yapılandırma yardımcıları |
  | `plugin-sdk/provider-auth-runtime` | Sağlayıcı çalışma zamanı auth yardımcıları | Çalışma zamanı API anahtarı çözümleme yardımcıları |
  | `plugin-sdk/provider-auth-api-key` | Sağlayıcı API anahtarı kurulum yardımcıları | API anahtarı onboarding/profil-yazma yardımcıları |
  | `plugin-sdk/provider-auth-result` | Sağlayıcı auth-result yardımcıları | Standart OAuth auth-result oluşturucusu |
  | `plugin-sdk/provider-auth-login` | Sağlayıcı etkileşimli giriş yardımcıları | Paylaşılan etkileşimli giriş yardımcıları |
  | `plugin-sdk/provider-selection-runtime` | Sağlayıcı seçim yardımcıları | Yapılandırılmış-veya-otomatik sağlayıcı seçimi ve ham sağlayıcı yapılandırma birleştirme |
  | `plugin-sdk/provider-env-vars` | Sağlayıcı env-var yardımcıları | Sağlayıcı auth env-var arama yardımcıları |
  | `plugin-sdk/provider-model-shared` | Paylaşılan sağlayıcı model/replay yardımcıları | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan replay-policy oluşturucuları, provider-endpoint yardımcıları ve model-id normalleştirme yardımcıları |
  | `plugin-sdk/provider-catalog-shared` | Paylaşılan sağlayıcı katalog yardımcıları | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Sağlayıcı onboarding yamaları | Onboarding yapılandırma yardımcıları |
  | `plugin-sdk/provider-http` | Sağlayıcı HTTP yardımcıları | Ses dökümü multipart form yardımcıları dahil genel sağlayıcı HTTP/endpoint capability yardımcıları |
  | `plugin-sdk/provider-web-fetch` | Sağlayıcı web-fetch yardımcıları | Web-fetch sağlayıcı kayıt/önbellek yardımcıları |
  | `plugin-sdk/provider-web-search-config-contract` | Sağlayıcı web-search yapılandırma yardımcıları | Plugin-enable bağlantısına ihtiyaç duymayan sağlayıcılar için dar web-search yapılandırma/kimlik bilgisi yardımcıları |
  | `plugin-sdk/provider-web-search-contract` | Sağlayıcı web-search sözleşme yardımcıları | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` ve kapsamlı kimlik bilgisi ayarlayıcıları/alıcıları gibi dar web-search yapılandırma/kimlik bilgisi sözleşme yardımcıları |
  | `plugin-sdk/provider-web-search` | Sağlayıcı web-search yardımcıları | Web-search sağlayıcı kayıt/önbellek/çalışma zamanı yardımcıları |
  | `plugin-sdk/provider-tools` | Sağlayıcı araç/şema uyumluluk yardımcıları | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini şema temizleme + tanılama ve `resolveXaiModelCompatPatch` / `applyXaiModelCompat` gibi xAI uyumluluk yardımcıları |
  | `plugin-sdk/provider-usage` | Sağlayıcı kullanım yardımcıları | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` ve diğer sağlayıcı kullanım yardımcıları |
  | `plugin-sdk/provider-stream` | Sağlayıcı akış sarmalayıcı yardımcıları | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri ve paylaşılan Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot sarmalayıcı yardımcıları |
  | `plugin-sdk/provider-transport-runtime` | Sağlayıcı taşıma yardımcıları | Korumalı fetch, taşıma mesajı dönüşümleri ve yazılabilir taşıma olay akışları gibi yerel sağlayıcı taşıma yardımcıları |
  | `plugin-sdk/keyed-async-queue` | Sıralı async kuyruk | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Paylaşılan medya yardımcıları | Medya fetch/transform/store yardımcıları ile medya yükü oluşturucuları |
  | `plugin-sdk/media-generation-runtime` | Paylaşılan medya üretim yardımcıları | Görsel/video/müzik üretimi için paylaşılan yedek yardımcıları, aday seçimi ve eksik model mesajlaşması |
  | `plugin-sdk/media-understanding` | Medya anlama yardımcıları | Medya anlama sağlayıcı türleri ile sağlayıcıya dönük görsel/ses yardımcı export'ları |
  | `plugin-sdk/text-runtime` | Paylaşılan metin yardımcıları | Asistanın görebildiği metin temizleme, markdown render/parçalama/tablo yardımcıları, redaksiyon yardımcıları, directive-tag yardımcıları, güvenli metin yardımcıları ve ilgili metin/günlükleme yardımcıları |
  | `plugin-sdk/text-chunking` | Metin parçalama yardımcıları | Giden metin parçalama yardımcısı |
  | `plugin-sdk/speech` | Konuşma yardımcıları | Konuşma sağlayıcı türleri ile sağlayıcıya dönük directive, kayıt defteri ve doğrulama yardımcıları |
  | `plugin-sdk/speech-core` | Paylaşılan konuşma çekirdeği | Konuşma sağlayıcı türleri, kayıt defteri, directive'ler, normalleştirme |
  | `plugin-sdk/realtime-transcription` | Gerçek zamanlı döküm yardımcıları | Sağlayıcı türleri, kayıt defteri yardımcıları ve paylaşılan WebSocket oturum yardımcısı |
  | `plugin-sdk/realtime-voice` | Gerçek zamanlı ses yardımcıları | Sağlayıcı türleri, kayıt defteri/çözümleme yardımcıları ve köprü oturum yardımcıları |
  | `plugin-sdk/image-generation-core` | Paylaşılan görsel üretim çekirdeği | Görsel üretim türleri, yedekleme, auth ve kayıt defteri yardımcıları |
  | `plugin-sdk/music-generation` | Müzik üretim yardımcıları | Müzik üretimi sağlayıcı/istek/sonuç türleri |
  | `plugin-sdk/music-generation-core` | Paylaşılan müzik üretim çekirdeği | Müzik üretim türleri, yedek yardımcıları, sağlayıcı araması ve model-ref ayrıştırma |
  | `plugin-sdk/video-generation` | Video üretim yardımcıları | Video üretimi sağlayıcı/istek/sonuç türleri |
  | `plugin-sdk/video-generation-core` | Paylaşılan video üretim çekirdeği | Video üretim türleri, yedek yardımcıları, sağlayıcı araması ve model-ref ayrıştırma |
  | `plugin-sdk/interactive-runtime` | Etkileşimli yanıt yardımcıları | Etkileşimli yanıt yükü normalleştirme/indirgeme |
  | `plugin-sdk/channel-config-primitives` | Kanal yapılandırma ilkel öğeleri | Dar kanal config-schema ilkel öğeleri |
  | `plugin-sdk/channel-config-writes` | Kanal yapılandırma yazma yardımcıları | Kanal yapılandırma yazma yetkilendirme yardımcıları |
  | `plugin-sdk/channel-plugin-common` | Paylaşılan kanal önsözü | Paylaşılan kanal Plugin önsöz export'ları |
  | `plugin-sdk/channel-status` | Kanal durum yardımcıları | Paylaşılan kanal durum anlık görüntüsü/özeti yardımcıları |
  | `plugin-sdk/allowlist-config-edit` | Allowlist yapılandırma yardımcıları | Allowlist yapılandırma düzenleme/okuma yardımcıları |
  | `plugin-sdk/group-access` | Grup erişim yardımcıları | Paylaşılan grup erişim kararı yardımcıları |
  | `plugin-sdk/direct-dm` | Doğrudan DM yardımcıları | Paylaşılan doğrudan DM auth/koruma yardımcıları |
  | `plugin-sdk/extension-shared` | Paylaşılan extension yardımcıları | Pasif kanal/durum ve ortam proxy yardımcısı ilkel öğeleri |
  | `plugin-sdk/webhook-targets` | Webhook hedef yardımcıları | Webhook hedef kayıt defteri ve route-install yardımcıları |
  | `plugin-sdk/webhook-path` | Webhook yol yardımcıları | Webhook yol normalleştirme yardımcıları |
  | `plugin-sdk/web-media` | Paylaşılan web medya yardımcıları | Uzak/yerel medya yükleme yardımcıları |
  | `plugin-sdk/zod` | Zod yeniden dışa aktarması | Plugin SDK tüketicileri için yeniden dışa aktarılan `zod` |
  | `plugin-sdk/memory-core` | Bundled memory-core yardımcıları | Bellek yöneticisi/yapılandırma/dosya/CLI yardımcı yüzeyi |
  | `plugin-sdk/memory-core-engine-runtime` | Bellek motoru çalışma zamanı yüzeyi | Bellek dizini/arama çalışma zamanı yüzeyi |
  | `plugin-sdk/memory-core-host-engine-foundation` | Bellek host temel motoru | Bellek host temel motoru export'ları |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Bellek host gömme motoru | Bellek gömme sözleşmeleri, kayıt defteri erişimi, yerel sağlayıcı ve genel toplu/uzak yardımcıları; somut uzak sağlayıcılar kendilerine ait Plugin'lerde yaşar |
  | `plugin-sdk/memory-core-host-engine-qmd` | Bellek host QMD motoru | Bellek host QMD motoru export'ları |
  | `plugin-sdk/memory-core-host-engine-storage` | Bellek host depolama motoru | Bellek host depolama motoru export'ları |
  | `plugin-sdk/memory-core-host-multimodal` | Bellek host çok kipli yardımcıları | Bellek host çok kipli yardımcıları |
  | `plugin-sdk/memory-core-host-query` | Bellek host sorgu yardımcıları | Bellek host sorgu yardımcıları |
  | `plugin-sdk/memory-core-host-secret` | Bellek host secret yardımcıları | Bellek host secret yardımcıları |
  | `plugin-sdk/memory-core-host-events` | Bellek host olay günlüğü yardımcıları | Bellek host olay günlüğü yardımcıları |
  | `plugin-sdk/memory-core-host-status` | Bellek host durum yardımcıları | Bellek host durum yardımcıları |
  | `plugin-sdk/memory-core-host-runtime-cli` | Bellek host CLI çalışma zamanı | Bellek host CLI çalışma zamanı yardımcıları |
  | `plugin-sdk/memory-core-host-runtime-core` | Bellek host çekirdek çalışma zamanı | Bellek host çekirdek çalışma zamanı yardımcıları |
  | `plugin-sdk/memory-core-host-runtime-files` | Bellek host dosya/çalışma zamanı yardımcıları | Bellek host dosya/çalışma zamanı yardımcıları |
  | `plugin-sdk/memory-host-core` | Bellek host çekirdek çalışma zamanı takma adı | Bellek host çekirdek çalışma zamanı yardımcıları için sağlayıcıdan bağımsız takma ad |
  | `plugin-sdk/memory-host-events` | Bellek host olay günlüğü takma adı | Bellek host olay günlüğü yardımcıları için sağlayıcıdan bağımsız takma ad |
  | `plugin-sdk/memory-host-files` | Bellek host dosya/çalışma zamanı takma adı | Bellek host dosya/çalışma zamanı yardımcıları için sağlayıcıdan bağımsız takma ad |
  | `plugin-sdk/memory-host-markdown` | Yönetilen markdown yardımcıları | Belleğe komşu Plugin'ler için paylaşılan yönetilen-markdown yardımcıları |
  | `plugin-sdk/memory-host-search` | Active Memory arama yüzeyi | Tembel active-memory search-manager çalışma zamanı yüzeyi |
  | `plugin-sdk/memory-host-status` | Bellek host durum takma adı | Bellek host durum yardımcıları için sağlayıcıdan bağımsız takma ad |
  | `plugin-sdk/memory-lancedb` | Bundled memory-lancedb yardımcıları | Memory-lancedb yardımcı yüzeyi |
  | `plugin-sdk/testing` | Test yardımcıları | Test yardımcıları ve mock'lar |
</Accordion>

Bu tablo bilinçli olarak tam SDK
yüzeyi değil, yaygın geçiş alt kümesidir. 200'den fazla giriş noktasının tam listesi
`scripts/lib/plugin-sdk-entrypoints.json` içinde yer alır.

Bu liste hâlâ `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` ve `plugin-sdk/matrix*` gibi bazı bundled-Plugin yardımcı dikişlerini içerir. Bunlar bundled-Plugin bakımı ve uyumluluk için dışa aktarılmaya devam eder,
ancak bilinçli olarak yaygın geçiş tablosunda
yer almazlar ve yeni Plugin kodu için önerilen hedef değildir.

Aynı kural aşağıdaki diğer bundled-helper aileleri için de geçerlidir:

- tarayıcı destek yardımcıları: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- bundled helper/Plugin yüzeyleri gibi `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`,
  `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`
  ve `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` şu anda dar token-helper
yüzeyi `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` ve `resolveCopilotApiToken` öğelerini sunar.

İşle eşleşen en dar içe aktarmayı kullanın. Bir export bulamazsanız,
`src/plugin-sdk/` içindeki kaynağı kontrol edin veya Discord'da sorun.

## Etkin kullanımdan kaldırmalar

Plugin SDK, sağlayıcı sözleşmesi,
çalışma zamanı yüzeyi ve manifest genelinde uygulanan daha dar kullanımdan kaldırmalar. Bunların her biri bugün hâlâ çalışır ancak
gelecekteki bir büyük sürümde kaldırılacaktır. Her öğenin altındaki giriş, eski API'yi
kurallı yerine geçenle eşler.

<AccordionGroup>
  <Accordion title="command-auth yardım oluşturucuları → command-status">
    **Eski (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Yeni (`openclaw/plugin-sdk/command-status`)**: aynı imzalar, aynı
    export'lar — yalnızca daha dar alt yoldan içe aktarılır. `command-auth`
    bunları uyumluluk stub'ları olarak yeniden dışa aktarır.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Bahsetme sınırlama yardımcıları → resolveInboundMentionDecision">
    **Eski**: `resolveInboundMentionRequirement({ facts, policy })` ve
    `shouldDropInboundForMention(...)`,
    `openclaw/plugin-sdk/channel-inbound` veya
    `openclaw/plugin-sdk/channel-mention-gating` içinden.

    **Yeni**: `resolveInboundMentionDecision({ facts, policy })` — iki bölünmüş çağrı yerine
    tek bir karar nesnesi döndürür.

    Alt akış kanal Plugin'leri (Slack, Discord, Matrix, Microsoft Teams) zaten
    geçiş yaptı.

  </Accordion>

  <Accordion title="Kanal çalışma zamanı shim'i ve kanal eylemleri yardımcıları">
    `openclaw/plugin-sdk/channel-runtime`, eski
    kanal Plugin'leri için bir uyumluluk shim'idir. Yeni kodda bunu içe aktarmayın;
    çalışma zamanı nesnelerini kaydetmek için
    `openclaw/plugin-sdk/channel-runtime-context` kullanın.

    `openclaw/plugin-sdk/channel-actions` içindeki `channelActions*` yardımcıları,
    ham "actions" kanal export'ları ile birlikte kullanımdan kaldırılmıştır. Yetenekleri
    bunun yerine anlamsal `presentation` yüzeyi üzerinden sunun — kanal Plugin'leri
    hangi ham eylem adlarını kabul ettiklerini değil, neyi render ettiklerini
    (kartlar, düğmeler, seçimler) bildirir.

  </Accordion>

  <Accordion title="Web search provider tool() yardımcısı → Plugin üzerinde createTool()">
    **Eski**: `openclaw/plugin-sdk/provider-web-search` içindeki `tool()` fabrikası.

    **Yeni**: `createTool(...)` işlevini doğrudan sağlayıcı Plugin üzerinde uygulayın.
    OpenClaw artık araç sarmalayıcısını kaydetmek için SDK yardımcısına ihtiyaç duymuyor.

  </Accordion>

  <Accordion title="Düz metin kanal zarfları → BodyForAgent">
    **Eski**: gelen kanal mesajlarından düz bir düz metin istem
    zarfı oluşturmak için `formatInboundEnvelope(...)` (ve
    `ChannelMessageForAgent.channelEnvelope`).

    **Yeni**: `BodyForAgent` artı yapılandırılmış kullanıcı bağlamı blokları.
    Kanal Plugin'leri yönlendirme meta verilerini (konu, başlık, yanıt verilen mesaj, reaksiyonlar)
    istem string'ine eklemek yerine türlenmiş alanlar olarak ekler. `formatAgentEnvelope(...)`
    yardımcısı sentezlenmiş asistan yüzlü zarflar için hâlâ desteklenir,
    ancak gelen düz metin zarfları
    aşamalı olarak kaldırılıyor.

    Etkilenen alanlar: `inbound_claim`, `message_received` ve
    `channelEnvelope` metnini sonradan işleyen özel kanal Plugin'leri.

  </Accordion>

  <Accordion title="Sağlayıcı keşif türleri → sağlayıcı katalog türleri">
    Dört keşif türü takma adı artık
    katalog dönemi türleri üzerinde ince sarmalayıcılardır:

    | Eski takma ad            | Yeni tür                |
    | ------------------------ | ----------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Ayrıca eski `ProviderCapabilities` statik çantası — sağlayıcı Plugin'leri
    capability bilgilerini statik bir nesne yerine sağlayıcı çalışma zamanı sözleşmesi üzerinden
    eklemelidir.

  </Accordion>

  <Accordion title="Thinking policy kancaları → resolveThinkingProfile">
    **Eski** (`ProviderThinkingPolicy` üzerinde üç ayrı kanca):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` ve
    `resolveDefaultThinkingLevel(ctx)`.

    **Yeni**: kurallı `id`, isteğe bağlı `label` ve
    sıralı düzey listesi döndüren tek bir `resolveThinkingProfile(ctx)`,
    yani `ProviderThinkingProfile`.

    OpenClaw, saklanan bayat değerleri profil sırasına göre otomatik olarak düşürür.

    Üç kanca yerine tek kanca uygulayın. Eski kancalar kullanımdan kaldırma penceresi boyunca
    çalışmaya devam eder ancak profil sonucu ile bileştirilmez.

  </Accordion>

  <Accordion title="Harici OAuth sağlayıcı yedeği → contracts.externalAuthProviders">
    **Eski**: Plugin manifest'inde sağlayıcıyı bildirmeden
    `resolveExternalOAuthProfiles(...)` uygulamak.

    **Yeni**: Plugin manifest'inde `contracts.externalAuthProviders`
    bildirin **ve** `resolveExternalAuthProfiles(...)` uygulayın. Eski "auth
    fallback" yolu çalışma zamanında bir uyarı üretir ve kaldırılacaktır.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Sağlayıcı env-var araması → setup.providers[].envVars">
    **Eski** manifest alanı: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Yeni**: aynı env-var aramasını manifest üzerindeki `setup.providers[].envVars`
    alanına yansıtın. Bu, kurulum/durum env meta verilerini tek
    yerde birleştirir ve yalnızca env-var
    aramalarını yanıtlamak için Plugin çalışma zamanını başlatmayı önler.

    `providerAuthEnvVars`, kullanımdan kaldırma penceresi kapanana kadar
    uyumluluk bağdaştırıcısı üzerinden desteklenmeye devam eder.

  </Accordion>

  <Accordion title="Bellek Plugin kaydı → registerMemoryCapability">
    **Eski**: üç ayrı çağrı —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Yeni**: bellek-durumu API'si üzerinde tek bir çağrı —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Aynı yuvalar, tek kayıt çağrısı. Eklemeli bellek yardımcıları
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) etkilenmez.

  </Accordion>

  <Accordion title="Subagent session messages türleri yeniden adlandırıldı">
    `src/plugins/runtime/types.ts` içinden hâlâ dışa aktarılan iki eski tür takma adı:

    | Eski                        | Yeni                             |
    | --------------------------- | -------------------------------- |
    | `SubagentReadSessionParams` | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult` | `SubagentGetSessionMessagesResult` |

    Çalışma zamanı yöntemi `readSession`, artık
    `getSessionMessages` lehine kullanımdan kaldırılmıştır. Aynı imza; eski yöntem yenisine
    çağrı yapar.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Eski**: `runtime.tasks.flow` (tekil), canlı bir TaskFlow erişimcisi döndürüyordu.

    **Yeni**: `runtime.tasks.flows` (çoğul), DTO tabanlı TaskFlow erişimi döndürür;
    bu içe aktarma için güvenlidir ve tam görev çalışma zamanının
    yüklenmesini gerektirmez.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow(ctx);
    // After
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factory'leri → ajan tool-result middleware">
    Yukarıdaki "Nasıl geçiş yapılır → Pi tool-result extension'larını
    middleware'e taşıyın" bölümünde kapsanmıştır. Tamlık için burada da yer alır: kaldırılmış Pi-only
    `api.registerEmbeddedExtensionFactory(...)` yolu,
    `contracts.agentToolResultMiddleware` içinde açık çalışma zamanı
    listesi olan `api.registerAgentToolResultMiddleware(...)` ile değiştirilmiştir.
  </Accordion>

  <Accordion title="OpenClawSchemaType takma adı → OpenClawConfig">
    `openclaw/plugin-sdk` içinden yeniden dışa aktarılan `OpenClawSchemaType`,
    artık `OpenClawConfig` için tek satırlık bir takma addır. Kurallı adı tercih edin.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Extension düzeyindeki kullanımdan kaldırmalar (`extensions/` altındaki bundled kanal/sağlayıcı Plugin'leri içinde)
kendi `api.ts` ve `runtime-api.ts`
barrel dosyaları içinde izlenir. Bunlar üçüncü taraf Plugin sözleşmelerini etkilemez ve
burada listelenmez. Bir bundled Plugin'in yerel barrel dosyasını doğrudan tüketiyorsanız,
yükseltmeden önce o barrel içindeki kullanımdan kaldırma yorumlarını okuyun.
</Note>

## Kaldırma zaman çizelgesi

| Ne zaman               | Ne olur                                                                |
| ---------------------- | ---------------------------------------------------------------------- |
| **Şimdi**              | Kullanımdan kaldırılmış yüzeyler çalışma zamanında uyarı üretir        |
| **Bir sonraki büyük sürüm** | Kullanımdan kaldırılmış yüzeyler kaldırılır; bunları hâlâ kullanan Plugin'ler başarısız olur |

Tüm çekirdek Plugin'ler zaten geçirildi. Harici Plugin'ler
bir sonraki büyük sürümden önce geçiş yapmalıdır.

## Uyarıları geçici olarak bastırma

Geçiş üzerinde çalışırken şu ortam değişkenlerini ayarlayın:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Bu geçici bir kaçış kapağıdır, kalıcı bir çözüm değildir.

## İlgili

- [Başlarken](/tr/plugins/building-plugins) — ilk Plugin'inizi oluşturun
- [SDK Genel Bakış](/tr/plugins/sdk-overview) — tam alt yol içe aktarma başvurusu
- [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) — kanal Plugin'leri oluşturma
- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) — sağlayıcı Plugin'leri oluşturma
- [Plugin İç Yapısı](/tr/plugins/architecture) — mimari derinlemesine inceleme
- [Plugin Manifest](/tr/plugins/manifest) — manifest şeması başvurusu

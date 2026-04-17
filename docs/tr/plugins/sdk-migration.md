---
read_when:
    - OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED uyarısını görüyorsunuz
    - OPENCLAW_EXTENSION_API_DEPRECATED uyarısını görüyorsunuz
    - Bir Plugin'i modern plugin mimarisine güncelliyorsunuz
    - Harici bir OpenClaw Plugin'ini sürdürüyorsunuz
sidebarTitle: Migrate to SDK
summary: Eski geriye dönük uyumluluk katmanından modern Plugin SDK'ya geçin
title: Plugin SDK Geçişi
x-i18n:
    generated_at: "2026-04-17T08:52:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0283f949eec358a12a0709db846cde2a1509f28e5c60db6e563cb8a540b979d
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Plugin SDK Geçişi

OpenClaw, geniş bir geriye dönük uyumluluk katmanından odaklı, belgelenmiş içe aktarmalara sahip modern bir plugin mimarisine geçti. Plugin'iniz yeni mimariden önce oluşturulduysa, bu kılavuz geçiş yapmanıza yardımcı olur.

## Neler değişiyor

Eski plugin sistemi, plugin'lerin ihtiyaç duydukları her şeyi tek bir giriş noktasından içe aktarmasına izin veren iki geniş yüzey sağlıyordu:

- **`openclaw/plugin-sdk/compat`** — onlarca yardımcıyı yeniden dışa aktaran tek bir içe aktarma. Yeni plugin mimarisi oluşturulurken eski hook tabanlı plugin'lerin çalışmaya devam etmesini sağlamak için tanıtıldı.
- **`openclaw/extension-api`** — plugin'lere gömülü ajan çalıştırıcısı gibi host tarafı yardımcılarına doğrudan erişim veren bir köprü.

Bu iki yüzey artık **kullanımdan kaldırıldı**. Çalışma zamanında hâlâ çalışırlar, ancak yeni plugin'ler bunları kullanmamalıdır ve mevcut plugin'ler bir sonraki büyük sürüm bunları kaldırmadan önce geçiş yapmalıdır.

<Warning>
  Geriye dönük uyumluluk katmanı gelecekteki bir büyük sürümde kaldırılacaktır.
  Bu yüzeylerden hâlâ içe aktarma yapan plugin'ler bu gerçekleştiğinde bozulacaktır.
</Warning>

## Bu neden değişti

Eski yaklaşım sorunlara yol açıyordu:

- **Yavaş başlangıç** — tek bir yardımcıyı içe aktarmak onlarca ilgisiz modülü yüklüyordu
- **Döngüsel bağımlılıklar** — geniş yeniden dışa aktarmalar içe aktarma döngüleri oluşturmayı kolaylaştırıyordu
- **Belirsiz API yüzeyi** — hangi dışa aktarmaların kararlı, hangilerinin iç kullanım için olduğunu anlamanın bir yolu yoktu

Modern Plugin SDK bunu düzeltir: her içe aktarma yolu (`openclaw/plugin-sdk/\<subpath\>`) açık bir amaca ve belgelenmiş sözleşmeye sahip küçük, kendi içinde yeterli bir modüldür.

Paketlenmiş kanallar için eski sağlayıcı kolaylık yüzeyleri de artık yok. `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`, `openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, kanal markalı yardımcı yüzeyleri ve `openclaw/plugin-sdk/telegram-core` gibi içe aktarmalar, kararlı plugin sözleşmeleri değil, özel mono-repo kısayollarıydı. Bunun yerine dar, genel SDK alt yollarını kullanın. Paketlenmiş plugin çalışma alanı içinde, sağlayıcıya ait yardımcıları o plugin'in kendi `api.ts` veya `runtime-api.ts` dosyasında tutun.

Güncel paketlenmiş sağlayıcı örnekleri:

- Anthropic, Claude'a özgü akış yardımcılarını kendi `api.ts` / `contract-api.ts` yüzeyinde tutar
- OpenAI, sağlayıcı oluşturucuları, varsayılan model yardımcılarını ve gerçek zamanlı sağlayıcı oluşturucularını kendi `api.ts` dosyasında tutar
- OpenRouter, sağlayıcı oluşturucu ve onboarding/config yardımcılarını kendi `api.ts` dosyasında tutar

## Nasıl geçiş yapılır

<Steps>
  <Step title="Onay yerel işleyicilerini yetenek olgularına taşıyın">
    Onay yeteneğine sahip kanal plugin'leri artık yerel onay davranışını
    `approvalCapability.nativeRuntime` ve paylaşılan çalışma zamanı bağlamı kaydı üzerinden sunuyor.

    Temel değişiklikler:

    - `approvalCapability.handler.loadRuntime(...)` yerine
      `approvalCapability.nativeRuntime` kullanın
    - Onaya özgü auth/delivery yapılandırmasını eski `plugin.auth` /
      `plugin.approvals` bağlantısından çıkarıp `approvalCapability` üzerine taşıyın
    - `ChannelPlugin.approvals`, genel kanal-plugin sözleşmesinden kaldırıldı;
      delivery/native/render alanlarını `approvalCapability` üzerine taşıyın
    - `plugin.auth` yalnızca kanal login/logout akışları için kalır; buradaki
      onay auth hook'ları artık core tarafından okunmaz
    - İstemciler, token'lar veya Bolt uygulamaları gibi kanala ait çalışma zamanı nesnelerini
      `openclaw/plugin-sdk/channel-runtime-context` üzerinden kaydedin
    - Yerel onay işleyicilerinden plugin'e ait yeniden yönlendirme bildirimleri göndermeyin;
      core artık gerçekten teslim edilen sonuçlardan gelen başka yere yönlendirildi bildirimlerini yönetiyor
    - `channelRuntime` değerini `createChannelManager(...)` içine geçirirken,
      gerçek bir `createPluginRuntime().channel` yüzeyi sağlayın. Kısmi stub'lar reddedilir.

    Güncel onay yeteneği düzeni için `/plugins/sdk-channel-plugins` bölümüne bakın.

  </Step>

  <Step title="Windows wrapper geri dönüş davranışını denetleyin">
    Plugin'iniz `openclaw/plugin-sdk/windows-spawn` kullanıyorsa, çözümlenmemiş Windows
    `.cmd`/`.bat` wrapper'ları artık siz açıkça `allowShellFallback: true` geçmedikçe
    kapalı şekilde başarısız olur.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Yalnızca shell aracılı geri dönüşü bilerek kabul eden güvenilir
      // uyumluluk çağıranları için bunu ayarlayın.
      allowShellFallback: true,
    });
    ```

    Çağıranınız shell geri dönüşüne bilerek dayanmıyorsa, `allowShellFallback`
    ayarlamayın ve bunun yerine fırlatılan hatayı işleyin.

  </Step>

  <Step title="Kullanımdan kaldırılmış içe aktarmaları bulun">
    Plugin'inizde kullanımdan kaldırılmış iki yüzeyden herhangi birinden yapılan içe aktarmaları arayın:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Odaklı içe aktarmalarla değiştirin">
    Eski yüzeydeki her dışa aktarma, belirli bir modern içe aktarma yoluna eşlenir:

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

    Host tarafı yardımcılar için doğrudan içe aktarmak yerine eklenen plugin çalışma zamanını kullanın:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Aynı kalıp diğer eski köprü yardımcıları için de geçerlidir:

    | Eski içe aktarma | Modern eşdeğer |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | oturum deposu yardımcıları | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Derleyin ve test edin">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## İçe aktarma yolu referansı

  <Accordion title="Yaygın içe aktarma yolu tablosu">
  | İçe aktarma yolu | Amaç | Temel dışa aktarmalar |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanonik plugin giriş yardımcısı | `definePluginEntry` |
  | `plugin-sdk/core` | Kanal giriş tanımları/oluşturucuları için eski şemsiye yeniden dışa aktarma | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Kök config şema dışa aktarımı | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Tek sağlayıcılı giriş yardımcısı | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Odaklı kanal giriş tanımları ve oluşturucuları | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Paylaşılan kurulum sihirbazı yardımcıları | Allowlist istemleri, kurulum durumu oluşturucuları |
  | `plugin-sdk/setup-runtime` | Kurulum zamanı çalışma zamanı yardımcıları | İçe aktarma güvenli setup patch adaptörleri, lookup-note yardımcıları, `promptResolvedAllowFrom`, `splitSetupEntries`, devredilmiş kurulum proxy'leri |
  | `plugin-sdk/setup-adapter-runtime` | Kurulum adaptörü yardımcıları | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Kurulum araç yardımcıları | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Çok hesaplı yardımcılar | Hesap listesi/config/eylem geçidi yardımcıları |
  | `plugin-sdk/account-id` | Hesap kimliği yardımcıları | `DEFAULT_ACCOUNT_ID`, hesap kimliği normalizasyonu |
  | `plugin-sdk/account-resolution` | Hesap arama yardımcıları | Hesap arama + varsayılan geri dönüş yardımcıları |
  | `plugin-sdk/account-helpers` | Dar hesap yardımcıları | Hesap listesi/hesap eylemi yardımcıları |
  | `plugin-sdk/channel-setup` | Kurulum sihirbazı adaptörleri | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ayrıca `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM eşleştirme ilkelleri | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Yanıt öneki + yazıyor bağlantıları | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Config adaptörü fabrikaları | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Config şeması oluşturucuları | Kanal config şeması türleri |
  | `plugin-sdk/telegram-command-config` | Telegram komut config yardımcıları | Komut adı normalizasyonu, açıklama kırpma, yinelenen/çakışma doğrulaması |
  | `plugin-sdk/channel-policy` | Grup/DM politikası çözümleme | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Hesap durumu izleme | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Gelen zarf yardımcıları | Paylaşılan rota + zarf oluşturucu yardımcıları |
  | `plugin-sdk/inbound-reply-dispatch` | Gelen yanıt yardımcıları | Paylaşılan kaydetme ve dispatch yardımcıları |
  | `plugin-sdk/messaging-targets` | Mesajlaşma hedefi ayrıştırma | Hedef ayrıştırma/eşleştirme yardımcıları |
  | `plugin-sdk/outbound-media` | Giden medya yardımcıları | Paylaşılan giden medya yükleme |
  | `plugin-sdk/outbound-runtime` | Giden çalışma zamanı yardımcıları | Giden kimlik/gönderme delegate yardımcıları |
  | `plugin-sdk/thread-bindings-runtime` | İş parçacığı bağlama yardımcıları | İş parçacığı bağlama yaşam döngüsü ve adaptör yardımcıları |
  | `plugin-sdk/agent-media-payload` | Eski medya payload yardımcıları | Eski alan düzenleri için ajan medya payload oluşturucusu |
  | `plugin-sdk/channel-runtime` | Kullanımdan kaldırılmış uyumluluk shim'i | Yalnızca eski kanal çalışma zamanı yardımcı programları |
  | `plugin-sdk/channel-send-result` | Gönderim sonucu türleri | Yanıt sonuç türleri |
  | `plugin-sdk/runtime-store` | Kalıcı plugin depolaması | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Geniş çalışma zamanı yardımcıları | Çalışma zamanı/logging/yedekleme/plugin-install yardımcıları |
  | `plugin-sdk/runtime-env` | Dar çalışma zamanı ortam yardımcıları | Logger/çalışma zamanı ortamı, zaman aşımı, retry ve backoff yardımcıları |
  | `plugin-sdk/plugin-runtime` | Paylaşılan plugin çalışma zamanı yardımcıları | Plugin komutları/hooks/http/etkileşimli yardımcılar |
  | `plugin-sdk/hook-runtime` | Hook ardışık düzen yardımcıları | Paylaşılan Webhook/dahili hook ardışık düzen yardımcıları |
  | `plugin-sdk/lazy-runtime` | Lazy çalışma zamanı yardımcıları | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Süreç yardımcıları | Paylaşılan exec yardımcıları |
  | `plugin-sdk/cli-runtime` | CLI çalışma zamanı yardımcıları | Komut biçimlendirme, beklemeler, sürüm yardımcıları |
  | `plugin-sdk/gateway-runtime` | Gateway yardımcıları | Gateway istemcisi ve kanal durumu patch yardımcıları |
  | `plugin-sdk/config-runtime` | Config yardımcıları | Config yükleme/yazma yardımcıları |
  | `plugin-sdk/telegram-command-config` | Telegram komut yardımcıları | Paketlenmiş Telegram sözleşme yüzeyi kullanılamadığında geri dönüş olarak kararlı Telegram komut doğrulama yardımcıları |
  | `plugin-sdk/approval-runtime` | Onay istemi yardımcıları | Exec/plugin onay payload'ı, onay yeteneği/profili yardımcıları, yerel onay yönlendirme/çalışma zamanı yardımcıları |
  | `plugin-sdk/approval-auth-runtime` | Onay auth yardımcıları | Onaylayıcı çözümleme, aynı sohbet eylemi auth |
  | `plugin-sdk/approval-client-runtime` | Onay istemci yardımcıları | Yerel exec onay profili/filtre yardımcıları |
  | `plugin-sdk/approval-delivery-runtime` | Onay teslim yardımcıları | Yerel onay yeteneği/teslim adaptörleri |
  | `plugin-sdk/approval-gateway-runtime` | Onay Gateway yardımcıları | Paylaşılan onay Gateway çözümleme yardımcısı |
  | `plugin-sdk/approval-handler-adapter-runtime` | Onay adaptörü yardımcıları | Yoğun kanal giriş noktaları için hafif yerel onay adaptörü yükleme yardımcıları |
  | `plugin-sdk/approval-handler-runtime` | Onay işleyici yardımcıları | Daha geniş onay işleyici çalışma zamanı yardımcıları; daha dar adaptör/Gateway yüzeyleri yeterliyse onları tercih edin |
  | `plugin-sdk/approval-native-runtime` | Onay hedef yardımcıları | Yerel onay hedefi/hesap bağlama yardımcıları |
  | `plugin-sdk/approval-reply-runtime` | Onay yanıt yardımcıları | Exec/plugin onay yanıt payload yardımcıları |
  | `plugin-sdk/channel-runtime-context` | Kanal çalışma zamanı bağlamı yardımcıları | Genel kanal çalışma zamanı bağlamı register/get/watch yardımcıları |
  | `plugin-sdk/security-runtime` | Güvenlik yardımcıları | Paylaşılan güven, DM geçidi, harici içerik ve gizli bilgi toplama yardımcıları |
  | `plugin-sdk/ssrf-policy` | SSRF politika yardımcıları | Host allowlist ve özel ağ politikası yardımcıları |
  | `plugin-sdk/ssrf-runtime` | SSRF çalışma zamanı yardımcıları | Sabitlenmiş dispatcher, korumalı fetch, SSRF politika yardımcıları |
  | `plugin-sdk/collection-runtime` | Sınırlı önbellek yardımcıları | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Tanılama geçidi yardımcıları | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Hata biçimlendirme yardımcıları | `formatUncaughtError`, `isApprovalNotFoundError`, hata grafiği yardımcıları |
  | `plugin-sdk/fetch-runtime` | Sarmalanmış fetch/proxy yardımcıları | `resolveFetch`, proxy yardımcıları |
  | `plugin-sdk/host-runtime` | Host normalizasyon yardımcıları | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Retry yardımcıları | `RetryConfig`, `retryAsync`, politika çalıştırıcıları |
  | `plugin-sdk/allow-from` | Allowlist biçimlendirme | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Allowlist girdi eşleme | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Komut geçidi ve komut yüzeyi yardımcıları | `resolveControlCommandGate`, gönderici yetkilendirme yardımcıları, komut kayıt yardımcıları |
  | `plugin-sdk/command-status` | Komut durumu/yardım oluşturucuları | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Gizli bilgi girdisi ayrıştırma | Gizli bilgi girdisi yardımcıları |
  | `plugin-sdk/webhook-ingress` | Webhook istek yardımcıları | Webhook hedef yardımcı programları |
  | `plugin-sdk/webhook-request-guards` | Webhook gövdesi koruma yardımcıları | İstek gövdesi okuma/sınır yardımcıları |
  | `plugin-sdk/reply-runtime` | Paylaşılan yanıt çalışma zamanı | Gelen dispatch, Heartbeat, yanıt planlayıcı, parçalama |
  | `plugin-sdk/reply-dispatch-runtime` | Dar yanıt dispatch yardımcıları | Sonlandırma + sağlayıcı dispatch yardımcıları |
  | `plugin-sdk/reply-history` | Yanıt geçmişi yardımcıları | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Yanıt referansı planlama | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Yanıt parça yardımcıları | Metin/markdown parçalama yardımcıları |
  | `plugin-sdk/session-store-runtime` | Oturum deposu yardımcıları | Depo yolu + updated-at yardımcıları |
  | `plugin-sdk/state-paths` | Durum yolu yardımcıları | Durum ve OAuth dizin yardımcıları |
  | `plugin-sdk/routing` | Yönlendirme/oturum anahtarı yardımcıları | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, oturum anahtarı normalizasyon yardımcıları |
  | `plugin-sdk/status-helpers` | Kanal durumu yardımcıları | Kanal/hesap durumu özet oluşturucuları, çalışma zamanı durumu varsayılanları, sorun meta veri yardımcıları |
  | `plugin-sdk/target-resolver-runtime` | Hedef çözümleyici yardımcıları | Paylaşılan hedef çözümleyici yardımcıları |
  | `plugin-sdk/string-normalization-runtime` | Dize normalizasyon yardımcıları | Slug/dize normalizasyon yardımcıları |
  | `plugin-sdk/request-url` | İstek URL yardımcıları | Request benzeri girdilerden dize URL'leri çıkarma |
  | `plugin-sdk/run-command` | Zamanlanmış komut yardımcıları | Normalize edilmiş stdout/stderr ile zamanlanmış komut çalıştırıcısı |
  | `plugin-sdk/param-readers` | Parametre okuyucular | Yaygın tool/CLI parametre okuyucuları |
  | `plugin-sdk/tool-payload` | Tool payload çıkarma | Tool sonuç nesnelerinden normalize edilmiş payload'ları çıkarma |
  | `plugin-sdk/tool-send` | Tool gönderim çıkarma | Tool argümanlarından kanonik gönderim hedef alanlarını çıkarma |
  | `plugin-sdk/temp-path` | Geçici yol yardımcıları | Paylaşılan geçici indirme yolu yardımcıları |
  | `plugin-sdk/logging-core` | Logging yardımcıları | Alt sistem logger ve redaction yardımcıları |
  | `plugin-sdk/markdown-table-runtime` | Markdown tablo yardımcıları | Markdown tablo modu yardımcıları |
  | `plugin-sdk/reply-payload` | Mesaj yanıt türleri | Yanıt payload türleri |
  | `plugin-sdk/provider-setup` | Özenle seçilmiş yerel/self-hosted sağlayıcı kurulum yardımcıları | Self-hosted sağlayıcı keşif/config yardımcıları |
  | `plugin-sdk/self-hosted-provider-setup` | Odaklı OpenAI uyumlu self-hosted sağlayıcı kurulum yardımcıları | Aynı self-hosted sağlayıcı keşif/config yardımcıları |
  | `plugin-sdk/provider-auth-runtime` | Sağlayıcı çalışma zamanı auth yardımcıları | Çalışma zamanı API key çözümleme yardımcıları |
  | `plugin-sdk/provider-auth-api-key` | Sağlayıcı API key kurulum yardımcıları | API key onboarding/profil yazma yardımcıları |
  | `plugin-sdk/provider-auth-result` | Sağlayıcı auth-result yardımcıları | Standart OAuth auth-result oluşturucusu |
  | `plugin-sdk/provider-auth-login` | Sağlayıcı etkileşimli login yardımcıları | Paylaşılan etkileşimli login yardımcıları |
  | `plugin-sdk/provider-env-vars` | Sağlayıcı env var yardımcıları | Sağlayıcı auth env var arama yardımcıları |
  | `plugin-sdk/provider-model-shared` | Paylaşılan sağlayıcı model/replay yardımcıları | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan replay-policy oluşturucuları, sağlayıcı endpoint yardımcıları ve model kimliği normalizasyon yardımcıları |
  | `plugin-sdk/provider-catalog-shared` | Paylaşılan sağlayıcı katalog yardımcıları | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Sağlayıcı onboarding yamaları | Onboarding config yardımcıları |
  | `plugin-sdk/provider-http` | Sağlayıcı HTTP yardımcıları | Genel sağlayıcı HTTP/endpoint yetenek yardımcıları |
  | `plugin-sdk/provider-web-fetch` | Sağlayıcı web-fetch yardımcıları | Web-fetch sağlayıcı kaydı/önbellek yardımcıları |
  | `plugin-sdk/provider-web-search-config-contract` | Sağlayıcı web-search config yardımcıları | Plugin etkinleştirme bağlantısına ihtiyaç duymayan sağlayıcılar için dar web-search config/kimlik bilgisi yardımcıları |
  | `plugin-sdk/provider-web-search-contract` | Sağlayıcı web-search sözleşme yardımcıları | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` ve kapsamlı kimlik bilgisi ayarlayıcıları/alıcıları gibi dar web-search config/kimlik bilgisi sözleşme yardımcıları |
  | `plugin-sdk/provider-web-search` | Sağlayıcı web-search yardımcıları | Web-search sağlayıcı kaydı/önbellek/çalışma zamanı yardımcıları |
  | `plugin-sdk/provider-tools` | Sağlayıcı tool/şema compat yardımcıları | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini şema temizliği + tanılama ve `resolveXaiModelCompatPatch` / `applyXaiModelCompat` gibi xAI compat yardımcıları |
  | `plugin-sdk/provider-usage` | Sağlayıcı kullanım yardımcıları | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` ve diğer sağlayıcı kullanım yardımcıları |
  | `plugin-sdk/provider-stream` | Sağlayıcı akış sarmalayıcı yardımcıları | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri ve paylaşılan Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot sarmalayıcı yardımcıları |
  | `plugin-sdk/keyed-async-queue` | Sıralı async kuyruk | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Paylaşılan medya yardımcıları | Medya fetch/transform/store yardımcıları ve medya payload oluşturucuları |
  | `plugin-sdk/media-generation-runtime` | Paylaşılan medya oluşturma yardımcıları | Görsel/video/müzik üretimi için paylaşılan failover yardımcıları, aday seçimi ve eksik model mesajlaşması |
  | `plugin-sdk/media-understanding` | Media-understanding yardımcıları | Media understanding sağlayıcı türleri ve sağlayıcıya yönelik görsel/ses yardımcı dışa aktarmaları |
  | `plugin-sdk/text-runtime` | Paylaşılan metin yardımcıları | Asistan tarafından görülebilen metin ayıklama, markdown render/parçalama/tablo yardımcıları, redaction yardımcıları, directive-tag yardımcıları, güvenli metin yardımcıları ve ilgili metin/logging yardımcıları |
  | `plugin-sdk/text-chunking` | Metin parçalama yardımcıları | Giden metin parçalama yardımcısı |
  | `plugin-sdk/speech` | Konuşma yardımcıları | Konuşma sağlayıcı türleri ve sağlayıcıya yönelik directive, kayıt ve doğrulama yardımcıları |
  | `plugin-sdk/speech-core` | Paylaşılan konuşma çekirdeği | Konuşma sağlayıcı türleri, kayıt, directive'ler, normalizasyon |
  | `plugin-sdk/realtime-transcription` | Gerçek zamanlı transkripsiyon yardımcıları | Sağlayıcı türleri ve kayıt yardımcıları |
  | `plugin-sdk/realtime-voice` | Gerçek zamanlı ses yardımcıları | Sağlayıcı türleri ve kayıt yardımcıları |
  | `plugin-sdk/image-generation-core` | Paylaşılan görsel üretimi çekirdeği | Görsel üretimi türleri, failover, auth ve kayıt yardımcıları |
  | `plugin-sdk/music-generation` | Müzik üretimi yardımcıları | Müzik üretimi sağlayıcı/istek/sonuç türleri |
  | `plugin-sdk/music-generation-core` | Paylaşılan müzik üretimi çekirdeği | Müzik üretimi türleri, failover yardımcıları, sağlayıcı araması ve model-ref ayrıştırma |
  | `plugin-sdk/video-generation` | Video üretimi yardımcıları | Video üretimi sağlayıcı/istek/sonuç türleri |
  | `plugin-sdk/video-generation-core` | Paylaşılan video üretimi çekirdeği | Video üretimi türleri, failover yardımcıları, sağlayıcı araması ve model-ref ayrıştırma |
  | `plugin-sdk/interactive-runtime` | Etkileşimli yanıt yardımcıları | Etkileşimli yanıt payload normalizasyonu/indirgeme |
  | `plugin-sdk/channel-config-primitives` | Kanal config ilkelleri | Dar kanal config-schema ilkelleri |
  | `plugin-sdk/channel-config-writes` | Kanal config yazma yardımcıları | Kanal config yazma yetkilendirme yardımcıları |
  | `plugin-sdk/channel-plugin-common` | Paylaşılan kanal prelude'u | Paylaşılan kanal Plugin prelude dışa aktarmaları |
  | `plugin-sdk/channel-status` | Kanal durumu yardımcıları | Paylaşılan kanal durumu anlık görüntü/özet yardımcıları |
  | `plugin-sdk/allowlist-config-edit` | Allowlist config yardımcıları | Allowlist config düzenleme/okuma yardımcıları |
  | `plugin-sdk/group-access` | Grup erişimi yardımcıları | Paylaşılan grup erişimi karar yardımcıları |
  | `plugin-sdk/direct-dm` | Doğrudan DM yardımcıları | Paylaşılan doğrudan DM auth/guard yardımcıları |
  | `plugin-sdk/extension-shared` | Paylaşılan extension yardımcıları | Pasif kanal/durum ve ambient proxy yardımcı ilkelleri |
  | `plugin-sdk/webhook-targets` | Webhook hedef yardımcıları | Webhook hedef kaydı ve route kurulum yardımcıları |
  | `plugin-sdk/webhook-path` | Webhook yol yardımcıları | Webhook yol normalizasyon yardımcıları |
  | `plugin-sdk/web-media` | Paylaşılan web medya yardımcıları | Uzak/yerel medya yükleme yardımcıları |
  | `plugin-sdk/zod` | Zod yeniden dışa aktarma | Plugin SDK tüketicileri için yeniden dışa aktarılan `zod` |
  | `plugin-sdk/memory-core` | Paketlenmiş memory-core yardımcıları | Bellek yöneticisi/config/dosya/CLI yardımcı yüzeyi |
  | `plugin-sdk/memory-core-engine-runtime` | Bellek motoru çalışma zamanı cephesi | Bellek indeksleme/arama çalışma zamanı cephesi |
  | `plugin-sdk/memory-core-host-engine-foundation` | Bellek host temel motoru | Bellek host temel motoru dışa aktarmaları |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Bellek host embedding motoru | Bellek embedding sözleşmeleri, kayıt erişimi, yerel sağlayıcı ve genel toplu/uzak yardımcılar; somut uzak sağlayıcılar kendi plugin'lerinde bulunur |
  | `plugin-sdk/memory-core-host-engine-qmd` | Bellek host QMD motoru | Bellek host QMD motoru dışa aktarmaları |
  | `plugin-sdk/memory-core-host-engine-storage` | Bellek host depolama motoru | Bellek host depolama motoru dışa aktarmaları |
  | `plugin-sdk/memory-core-host-multimodal` | Bellek host çok kipli yardımcıları | Bellek host çok kipli yardımcıları |
  | `plugin-sdk/memory-core-host-query` | Bellek host sorgu yardımcıları | Bellek host sorgu yardımcıları |
  | `plugin-sdk/memory-core-host-secret` | Bellek host gizli bilgi yardımcıları | Bellek host gizli bilgi yardımcıları |
  | `plugin-sdk/memory-core-host-events` | Bellek host olay günlüğü yardımcıları | Bellek host olay günlüğü yardımcıları |
  | `plugin-sdk/memory-core-host-status` | Bellek host durum yardımcıları | Bellek host durum yardımcıları |
  | `plugin-sdk/memory-core-host-runtime-cli` | Bellek host CLI çalışma zamanı | Bellek host CLI çalışma zamanı yardımcıları |
  | `plugin-sdk/memory-core-host-runtime-core` | Bellek host çekirdek çalışma zamanı | Bellek host çekirdek çalışma zamanı yardımcıları |
  | `plugin-sdk/memory-core-host-runtime-files` | Bellek host dosya/çalışma zamanı yardımcıları | Bellek host dosya/çalışma zamanı yardımcıları |
  | `plugin-sdk/memory-host-core` | Bellek host çekirdek çalışma zamanı takma adı | Bellek host çekirdek çalışma zamanı yardımcıları için satıcıdan bağımsız takma ad |
  | `plugin-sdk/memory-host-events` | Bellek host olay günlüğü takma adı | Bellek host olay günlüğü yardımcıları için satıcıdan bağımsız takma ad |
  | `plugin-sdk/memory-host-files` | Bellek host dosya/çalışma zamanı takma adı | Bellek host dosya/çalışma zamanı yardımcıları için satıcıdan bağımsız takma ad |
  | `plugin-sdk/memory-host-markdown` | Yönetilen markdown yardımcıları | Belleğe komşu plugin'ler için paylaşılan yönetilen markdown yardımcıları |
  | `plugin-sdk/memory-host-search` | Active Memory arama cephesi | Lazy Active Memory search-manager çalışma zamanı cephesi |
  | `plugin-sdk/memory-host-status` | Bellek host durum takma adı | Bellek host durum yardımcıları için satıcıdan bağımsız takma ad |
  | `plugin-sdk/memory-lancedb` | Paketlenmiş memory-lancedb yardımcıları | Memory-lancedb yardımcı yüzeyi |
  | `plugin-sdk/testing` | Test yardımcı programları | Test yardımcıları ve mock'lar |
</Accordion>

Bu tablo bilinçli olarak tam SDK yüzeyi değil, yaygın geçiş alt kümesidir.
200+'den fazla giriş noktasının tam listesi
`scripts/lib/plugin-sdk-entrypoints.json` içinde bulunur.

Bu liste hâlâ `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` ve `plugin-sdk/matrix*` gibi bazı paketlenmiş plugin
yardımcı yüzeylerini içerir. Bunlar paketlenmiş plugin bakımı ve uyumluluk için
dışa aktarılmaya devam eder, ancak yaygın geçiş tablosuna bilerek dahil
edilmemiştir ve yeni plugin kodu için önerilen hedef değildir.

Aynı kural diğer paketlenmiş yardımcı aileleri için de geçerlidir, örneğin:

- tarayıcı destek yardımcıları: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` ve `plugin-sdk/voice-call` gibi
  paketlenmiş yardımcı/plugin yüzeyleri

`plugin-sdk/github-copilot-token` şu anda dar token-yardımcı
yüzeyi olan `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` ve `resolveCopilotApiToken` dışa aktarmalarını sunar.

Yapılan işe en uygun en dar içe aktarmayı kullanın. Bir dışa aktarma
bulamıyorsanız, `src/plugin-sdk/` içindeki kaynağı kontrol edin veya Discord'da sorun.

## Kaldırma zaman çizelgesi

| Ne zaman | Ne olur |
| ---------------------- | ----------------------------------------------------------------------- |
| **Şimdi** | Kullanımdan kaldırılan yüzeyler çalışma zamanında uyarılar üretir |
| **Bir sonraki büyük sürüm** | Kullanımdan kaldırılan yüzeyler kaldırılacak; bunları hâlâ kullanan plugin'ler başarısız olacak |

Tüm core plugin'ler zaten taşındı. Harici plugin'ler bir sonraki büyük sürümden
önce geçiş yapmalıdır.

## Uyarıları geçici olarak bastırma

Geçiş üzerinde çalışırken bu ortam değişkenlerini ayarlayın:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Bu geçici bir kaçış kapağıdır, kalıcı bir çözüm değildir.

## İlgili

- [Başlangıç](/tr/plugins/building-plugins) — ilk plugin'inizi oluşturun
- [SDK Genel Bakış](/tr/plugins/sdk-overview) — tam alt yol içe aktarma başvurusu
- [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) — kanal plugin'leri oluşturma
- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) — sağlayıcı plugin'leri oluşturma
- [Plugin İç Yapısı](/tr/plugins/architecture) — mimariye derinlemesine bakış
- [Plugin Manifesti](/tr/plugins/manifest) — manifest şeması başvurusu

---
read_when:
    - '`OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED` uyarısını görüyorsunuz'
    - '`OPENCLAW_EXTENSION_API_DEPRECATED` uyarısını görüyorsunuz'
    - Bir plugin'i modern plugin mimarisine güncelliyorsunuz
    - Harici bir OpenClaw plugin'inin bakımını yapıyorsunuz
sidebarTitle: Migrate to SDK
summary: Eski geriye dönük uyumluluk katmanından modern Plugin SDK'ya geçiş
title: Plugin SDK Geçişi
x-i18n:
    generated_at: "2026-04-22T04:25:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 72c9fc2d77f5feda336a1119fc42ebe088d5037f99c2b3843e9f06efed20386d
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Plugin SDK Geçişi

OpenClaw, geniş bir geriye dönük uyumluluk katmanından odaklı, belgelenmiş içe aktarımlara sahip modern bir plugin
mimarisine geçti. Plugin'iniz yeni mimariden önce oluşturulduysa,
bu kılavuz geçiş yapmanıza yardımcı olur.

## Neler değişiyor

Eski plugin sistemi, plugin'lerin tek bir giriş noktasından
ihtiyaç duydukları her şeyi içe aktarmasına izin veren iki geniş yüzey sağlıyordu:

- **`openclaw/plugin-sdk/compat`** — onlarca
  yardımcıyı yeniden dışa aktaran tek bir içe aktarma. Yeni plugin mimarisi oluşturulurken daha eski hook tabanlı plugin'lerin çalışmaya devam etmesi için tanıtıldı.
- **`openclaw/extension-api`** — plugin'lere
  gömülü ajan çalıştırıcısı gibi host tarafı yardımcılarına doğrudan erişim veren bir köprü.

Her iki yüzey de artık **kullanımdan kaldırılmıştır**. Çalışma anında hâlâ çalışırlar, ancak yeni
plugin'ler bunları kullanmamalıdır ve mevcut plugin'ler, bunlar bir sonraki
büyük sürümde kaldırılmadan önce geçiş yapmalıdır.

<Warning>
  Geriye dönük uyumluluk katmanı gelecekteki bir büyük sürümde kaldırılacaktır.
  Bu yüzeylerden hâlâ içe aktarma yapan plugin'ler bu gerçekleştiğinde bozulacaktır.
</Warning>

## Bu neden değişti

Eski yaklaşım sorunlara neden oluyordu:

- **Yavaş başlangıç** — tek bir yardımcıyı içe aktarmak onlarca alakasız modülü yüklüyordu
- **Döngüsel bağımlılıklar** — geniş yeniden dışa aktarmalar içe aktarma döngüleri oluşturmayı kolaylaştırıyordu
- **Belirsiz API yüzeyi** — hangi dışa aktarımların kararlı, hangilerinin dahili olduğunu ayırt etmenin yolu yoktu

Modern Plugin SDK bunu düzeltir: her içe aktarma yolu (`openclaw/plugin-sdk/\<subpath\>`)
açık bir amaca ve belgelenmiş sözleşmeye sahip küçük, kendi içinde yeterli bir modüldür.

Paketle gelen kanallar için eski sağlayıcı kolaylık katmanları da kaldırıldı. `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
kanal markalı yardımcı katmanları ve
`openclaw/plugin-sdk/telegram-core` gibi içe aktarımlar özel mono-repo kısayollarıydı,
kararlı plugin sözleşmeleri değildi. Bunun yerine dar genel SDK alt yollarını kullanın. Paketle gelen
plugin çalışma alanı içinde sağlayıcıya ait yardımcıları o plugin'in kendi
`api.ts` veya `runtime-api.ts` dosyasında tutun.

Güncel paketle gelen sağlayıcı örnekleri:

- Anthropic, Claude'a özgü akış yardımcılarını kendi `api.ts` /
  `contract-api.ts` katmanında tutar
- OpenAI, sağlayıcı oluşturucularını, varsayılan model yardımcılarını ve gerçek zamanlı sağlayıcı
  oluşturucularını kendi `api.ts` dosyasında tutar
- OpenRouter, sağlayıcı oluşturucu ile onboarding/config yardımcılarını kendi
  `api.ts` dosyasında tutar

## Nasıl geçiş yapılır

<Steps>
  <Step title="Onaya özgü yerel işleyicileri yetenek olgularına taşıyın">
    Onay destekleyen kanal plugin'leri artık yerel onay davranışını
    `approvalCapability.nativeRuntime` ve paylaşılan çalışma zamanı bağlamı kayıt defteri üzerinden açığa çıkarır.

    Temel değişiklikler:

    - `approvalCapability.handler.loadRuntime(...)` yerine
      `approvalCapability.nativeRuntime` kullanın
    - Onaya özgü auth/delivery yapılandırmasını eski `plugin.auth` /
      `plugin.approvals` bağlamasından çıkarıp `approvalCapability` üzerine taşıyın
    - `ChannelPlugin.approvals`, genel kanal plugin
      sözleşmesinden kaldırıldı; delivery/native/render alanlarını `approvalCapability` üzerine taşıyın
    - `plugin.auth`, yalnızca kanal giriş/çıkış akışları için kalır; oradaki onay auth
      hook'ları artık çekirdek tarafından okunmaz
    - İstemciler, token'lar veya Bolt
      uygulamaları gibi kanala ait çalışma zamanı nesnelerini `openclaw/plugin-sdk/channel-runtime-context` üzerinden kaydedin
    - Yerel onay işleyicilerinden plugin'e ait yeniden yönlendirme bildirimleri göndermeyin;
      çekirdek artık gerçek teslimat sonuçlarından gelen başka yere yönlendirilmiş bildirimlerin sahibidir
    - `channelRuntime` nesnesini `createChannelManager(...)` içine geçirirken,
      gerçek bir `createPluginRuntime().channel` yüzeyi sağlayın. Kısmi stub'lar reddedilir.

    Güncel onay yeteneği
    düzeni için `/plugins/sdk-channel-plugins` bölümüne bakın.

  </Step>

  <Step title="Windows sarmalayıcı geri dönüş davranışını denetleyin">
    Plugin'iniz `openclaw/plugin-sdk/windows-spawn` kullanıyorsa,
    çözümlenmemiş Windows `.cmd`/`.bat` sarmalayıcıları artık siz açıkça `allowShellFallback: true` geçmediğiniz sürece kapalı başarısız olur.

    ```typescript
    // Önce
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Sonra
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Bunu yalnızca kasıtlı olarak
      // kabuk aracılı geri dönüşü kabul eden güvenilir uyumluluk çağıranları için ayarlayın.
      allowShellFallback: true,
    });
    ```

    Çağıranınız kasıtlı olarak kabuk geri dönüşüne dayanmıyorsa,
    `allowShellFallback` ayarlamayın ve bunun yerine atılan hatayı işleyin.

  </Step>

  <Step title="Kullanımdan kaldırılmış içe aktarımları bulun">
    Plugin'inizde kullanımdan kaldırılmış bu iki yüzeyden yapılan içe aktarımları arayın:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Bunları odaklı içe aktarımlarla değiştirin">
    Eski yüzeydeki her dışa aktarma belirli bir modern içe aktarma yoluna eşlenir:

    ```typescript
    // Önce (kullanımdan kaldırılmış geriye dönük uyumluluk katmanı)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Sonra (modern odaklı içe aktarımlar)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Host tarafı yardımcıları için, doğrudan içe aktarmak yerine enjekte edilmiş
    plugin çalışma zamanını kullanın:

    ```typescript
    // Önce (kullanımdan kaldırılmış extension-api köprüsü)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Sonra (enjekte edilmiş çalışma zamanı)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Aynı desen diğer eski köprü yardımcıları için de geçerlidir:

    | Eski içe aktarma | Modern eşdeğeri |
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

## İçe aktarma yolu başvurusu

  <Accordion title="Yaygın içe aktarma yolu tablosu">
  | İçe aktarma yolu | Amaç | Temel dışa aktarımlar |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanonik plugin giriş yardımcısı | `definePluginEntry` |
  | `plugin-sdk/core` | Kanal giriş tanımları/oluşturucuları için eski şemsiye yeniden dışa aktarma | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Kök yapılandırma şeması dışa aktarımı | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Tek sağlayıcılı giriş yardımcısı | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Odaklı kanal giriş tanımları ve oluşturucular | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Paylaşılan kurulum sihirbazı yardımcıları | İzin listesi istemleri, kurulum durumu oluşturucuları |
  | `plugin-sdk/setup-runtime` | Kurulum zamanı çalışma zamanı yardımcıları | İçe aktarma açısından güvenli kurulum patch bağdaştırıcıları, lookup-note yardımcıları, `promptResolvedAllowFrom`, `splitSetupEntries`, devredilmiş kurulum proxy'leri |
  | `plugin-sdk/setup-adapter-runtime` | Kurulum bağdaştırıcı yardımcıları | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Kurulum araç yardımcıları | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Çok hesaplı yardımcılar | Hesap listesi/yapılandırma/eylem geçidi yardımcıları |
  | `plugin-sdk/account-id` | Hesap kimliği yardımcıları | `DEFAULT_ACCOUNT_ID`, hesap kimliği normalleştirme |
  | `plugin-sdk/account-resolution` | Hesap arama yardımcıları | Hesap arama + varsayılan geri dönüş yardımcıları |
  | `plugin-sdk/account-helpers` | Dar hesap yardımcıları | Hesap listesi/hesap eylemi yardımcıları |
  | `plugin-sdk/channel-setup` | Kurulum sihirbazı bağdaştırıcıları | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ayrıca `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM eşleştirme ilkel öğeleri | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Yanıt öneki + yazıyor bağlama | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Yapılandırma bağdaştırıcı fabrikaları | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Yapılandırma şeması oluşturucuları | Kanal yapılandırma şeması türleri |
  | `plugin-sdk/telegram-command-config` | Telegram komut yapılandırma yardımcıları | Komut adı normalleştirme, açıklama kırpma, yinelenen/çakışma doğrulama |
  | `plugin-sdk/channel-policy` | Grup/DM ilke çözümlemesi | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Hesap durumu ve taslak akış yaşam döngüsü yardımcıları | `createAccountStatusSink`, taslak önizleme sonlandırma yardımcıları |
  | `plugin-sdk/inbound-envelope` | Gelen zarf yardımcıları | Paylaşılan rota + zarf oluşturucu yardımcıları |
  | `plugin-sdk/inbound-reply-dispatch` | Gelen yanıt yardımcıları | Paylaşılan kaydet ve dağıt yardımcıları |
  | `plugin-sdk/messaging-targets` | Mesajlaşma hedefi ayrıştırma | Hedef ayrıştırma/eşleştirme yardımcıları |
  | `plugin-sdk/outbound-media` | Giden medya yardımcıları | Paylaşılan giden medya yükleme |
  | `plugin-sdk/outbound-runtime` | Giden çalışma zamanı yardımcıları | Giden kimlik/gönderim devresi ve yük planlama yardımcıları |
  | `plugin-sdk/thread-bindings-runtime` | İş parçacığı bağlama yardımcıları | İş parçacığı bağlama yaşam döngüsü ve bağdaştırıcı yardımcıları |
  | `plugin-sdk/agent-media-payload` | Eski medya yükü yardımcıları | Eski alan düzenleri için ajan medya yükü oluşturucu |
  | `plugin-sdk/channel-runtime` | Kullanımdan kaldırılmış uyumluluk shim'i | Yalnızca eski kanal çalışma zamanı yardımcıları |
  | `plugin-sdk/channel-send-result` | Gönderim sonucu türleri | Yanıt sonucu türleri |
  | `plugin-sdk/runtime-store` | Kalıcı plugin depolaması | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Geniş çalışma zamanı yardımcıları | Çalışma zamanı/günlükleme/yedekleme/plugin-kurulum yardımcıları |
  | `plugin-sdk/runtime-env` | Dar çalışma zamanı ortam yardımcıları | Logger/çalışma zamanı ortamı, zaman aşımı, yeniden deneme ve backoff yardımcıları |
  | `plugin-sdk/plugin-runtime` | Paylaşılan plugin çalışma zamanı yardımcıları | Plugin komutları/hook'lar/http/etkileşimli yardımcıları |
  | `plugin-sdk/hook-runtime` | Hook hattı yardımcıları | Paylaşılan Webhook/dahili hook hattı yardımcıları |
  | `plugin-sdk/lazy-runtime` | Lazy çalışma zamanı yardımcıları | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Süreç yardımcıları | Paylaşılan exec yardımcıları |
  | `plugin-sdk/cli-runtime` | CLI çalışma zamanı yardımcıları | Komut biçimlendirme, beklemeler, sürüm yardımcıları |
  | `plugin-sdk/gateway-runtime` | Gateway yardımcıları | Gateway istemcisi ve kanal durumu patch yardımcıları |
  | `plugin-sdk/config-runtime` | Yapılandırma yardımcıları | Yapılandırma yükleme/yazma yardımcıları |
  | `plugin-sdk/telegram-command-config` | Telegram komut yardımcıları | Paketle gelen Telegram sözleşme yüzeyi kullanılamadığında geri dönüş açısından kararlı Telegram komut doğrulama yardımcıları |
  | `plugin-sdk/approval-runtime` | Onay istemi yardımcıları | Exec/plugin onay yükü, onay yeteneği/profili yardımcıları, yerel onay yönlendirme/çalışma zamanı yardımcıları |
  | `plugin-sdk/approval-auth-runtime` | Onay auth yardımcıları | Onaylayıcı çözümleme, aynı sohbet eylem auth |
  | `plugin-sdk/approval-client-runtime` | Onay istemci yardımcıları | Yerel exec onay profili/filtre yardımcıları |
  | `plugin-sdk/approval-delivery-runtime` | Onay teslimat yardımcıları | Yerel onay yeteneği/teslimat bağdaştırıcıları |
  | `plugin-sdk/approval-gateway-runtime` | Onay Gateway yardımcıları | Paylaşılan onay Gateway çözümleme yardımcısı |
  | `plugin-sdk/approval-handler-adapter-runtime` | Onay bağdaştırıcı yardımcıları | Sıcak kanal giriş noktaları için hafif yerel onay bağdaştırıcısı yükleme yardımcıları |
  | `plugin-sdk/approval-handler-runtime` | Onay işleyici yardımcıları | Daha geniş onay işleyici çalışma zamanı yardımcıları; dar bağdaştırıcı/Gateway katmanları yeterliyse onları tercih edin |
  | `plugin-sdk/approval-native-runtime` | Onay hedef yardımcıları | Yerel onay hedefi/hesap bağlama yardımcıları |
  | `plugin-sdk/approval-reply-runtime` | Onay yanıt yardımcıları | Exec/plugin onay yanıt yükü yardımcıları |
  | `plugin-sdk/channel-runtime-context` | Kanal çalışma zamanı bağlamı yardımcıları | Genel kanal çalışma zamanı bağlamı register/get/watch yardımcıları |
  | `plugin-sdk/security-runtime` | Güvenlik yardımcıları | Paylaşılan güven, DM geçitleme, harici içerik ve secret toplama yardımcıları |
  | `plugin-sdk/ssrf-policy` | SSRF ilke yardımcıları | Ana makine izin listesi ve özel ağ ilkesi yardımcıları |
  | `plugin-sdk/ssrf-runtime` | SSRF çalışma zamanı yardımcıları | Sabitlenmiş dağıtıcı, korumalı fetch, SSRF ilke yardımcıları |
  | `plugin-sdk/collection-runtime` | Sınırlı önbellek yardımcıları | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Tanılama geçitleme yardımcıları | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Hata biçimlendirme yardımcıları | `formatUncaughtError`, `isApprovalNotFoundError`, hata grafiği yardımcıları |
  | `plugin-sdk/fetch-runtime` | Sarmalanmış fetch/proxy yardımcıları | `resolveFetch`, proxy yardımcıları |
  | `plugin-sdk/host-runtime` | Ana makine normalleştirme yardımcıları | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Yeniden deneme yardımcıları | `RetryConfig`, `retryAsync`, ilke çalıştırıcıları |
  | `plugin-sdk/allow-from` | İzin listesi biçimlendirme | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | İzin listesi girdisi eşleme | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Komut geçitleme ve komut yüzeyi yardımcıları | `resolveControlCommandGate`, gönderen yetkilendirme yardımcıları, komut kayıt defteri yardımcıları |
  | `plugin-sdk/command-status` | Komut durumu/yardım işleyicileri | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Secret girdisi ayrıştırma | Secret girdi yardımcıları |
  | `plugin-sdk/webhook-ingress` | Webhook istek yardımcıları | Webhook hedef yardımcı programları |
  | `plugin-sdk/webhook-request-guards` | Webhook gövde koruma yardımcıları | İstek gövdesi okuma/sınır yardımcıları |
  | `plugin-sdk/reply-runtime` | Paylaşılan yanıt çalışma zamanı | Gelen dağıtım, Heartbeat, yanıt planlayıcı, parçalama |
  | `plugin-sdk/reply-dispatch-runtime` | Dar yanıt dağıtım yardımcıları | Sonlandırma + sağlayıcı dağıtım yardımcıları |
  | `plugin-sdk/reply-history` | Yanıt geçmişi yardımcıları | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Yanıt başvurusu planlama | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Yanıt parçası yardımcıları | Metin/Markdown parçalama yardımcıları |
  | `plugin-sdk/session-store-runtime` | Oturum deposu yardımcıları | Depo yolu + updated-at yardımcıları |
  | `plugin-sdk/state-paths` | Durum yolu yardımcıları | Durum ve OAuth dizini yardımcıları |
  | `plugin-sdk/routing` | Yönlendirme/oturum anahtarı yardımcıları | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, oturum anahtarı normalleştirme yardımcıları |
  | `plugin-sdk/status-helpers` | Kanal durumu yardımcıları | Kanal/hesap durumu özeti oluşturucuları, çalışma zamanı durumu varsayılanları, issue meta veri yardımcıları |
  | `plugin-sdk/target-resolver-runtime` | Hedef çözümleyici yardımcıları | Paylaşılan hedef çözümleyici yardımcıları |
  | `plugin-sdk/string-normalization-runtime` | Dize normalleştirme yardımcıları | Slug/dize normalleştirme yardımcıları |
  | `plugin-sdk/request-url` | İstek URL yardımcıları | İstek benzeri girdilerden dize URL'leri çıkarın |
  | `plugin-sdk/run-command` | Zamanlanmış komut yardımcıları | Normalize edilmiş stdout/stderr ile zamanlanmış komut çalıştırıcısı |
  | `plugin-sdk/param-readers` | Parametre okuyucular | Yaygın araç/CLI parametre okuyucuları |
  | `plugin-sdk/tool-payload` | Araç yükü çıkarma | Araç sonuç nesnelerinden normalize edilmiş yükleri çıkarın |
  | `plugin-sdk/tool-send` | Araç gönderim çıkarma | Araç argümanlarından kanonik gönderim hedef alanlarını çıkarın |
  | `plugin-sdk/temp-path` | Geçici yol yardımcıları | Paylaşılan geçici indirme yolu yardımcıları |
  | `plugin-sdk/logging-core` | Günlükleme yardımcıları | Alt sistem logger ve redaksiyon yardımcıları |
  | `plugin-sdk/markdown-table-runtime` | Markdown tablo yardımcıları | Markdown tablo modu yardımcıları |
  | `plugin-sdk/reply-payload` | Mesaj yanıt türleri | Yanıt yükü türleri |
  | `plugin-sdk/provider-setup` | Derlenmiş yerel/self-hosted sağlayıcı kurulum yardımcıları | Self-hosted sağlayıcı keşfi/yapılandırma yardımcıları |
  | `plugin-sdk/self-hosted-provider-setup` | Odaklı OpenAI uyumlu self-hosted sağlayıcı kurulum yardımcıları | Aynı self-hosted sağlayıcı keşfi/yapılandırma yardımcıları |
  | `plugin-sdk/provider-auth-runtime` | Sağlayıcı çalışma zamanı auth yardımcıları | Çalışma zamanı API anahtarı çözümleme yardımcıları |
  | `plugin-sdk/provider-auth-api-key` | Sağlayıcı API anahtarı kurulum yardımcıları | API anahtarı onboarding/profil yazma yardımcıları |
  | `plugin-sdk/provider-auth-result` | Sağlayıcı auth-result yardımcıları | Standart OAuth auth-result oluşturucusu |
  | `plugin-sdk/provider-auth-login` | Sağlayıcı etkileşimli giriş yardımcıları | Paylaşılan etkileşimli giriş yardımcıları |
  | `plugin-sdk/provider-env-vars` | Sağlayıcı ortam değişkeni yardımcıları | Sağlayıcı auth ortam değişkeni arama yardımcıları |
  | `plugin-sdk/provider-model-shared` | Paylaşılan sağlayıcı model/replay yardımcıları | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan replay-policy oluşturucuları, sağlayıcı uç nokta yardımcıları ve model kimliği normalleştirme yardımcıları |
  | `plugin-sdk/provider-catalog-shared` | Paylaşılan sağlayıcı katalog yardımcıları | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Sağlayıcı onboarding patch'leri | Onboarding yapılandırma yardımcıları |
  | `plugin-sdk/provider-http` | Sağlayıcı HTTP yardımcıları | Genel sağlayıcı HTTP/uç nokta yetenek yardımcıları |
  | `plugin-sdk/provider-web-fetch` | Sağlayıcı web-fetch yardımcıları | Web-fetch sağlayıcı kayıt/önbellek yardımcıları |
  | `plugin-sdk/provider-web-search-config-contract` | Sağlayıcı web-search yapılandırma yardımcıları | Plugin etkinleştirme bağlamasına ihtiyaç duymayan sağlayıcılar için dar web-search yapılandırma/kimlik bilgisi yardımcıları |
  | `plugin-sdk/provider-web-search-contract` | Sağlayıcı web-search sözleşme yardımcıları | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` ve kapsamlı kimlik bilgisi ayarlayıcı/alıcılar gibi dar web-search yapılandırma/kimlik bilgisi sözleşme yardımcıları |
  | `plugin-sdk/provider-web-search` | Sağlayıcı web-search yardımcıları | Web-search sağlayıcı kayıt/önbellek/çalışma zamanı yardımcıları |
  | `plugin-sdk/provider-tools` | Sağlayıcı araç/şema uyumluluk yardımcıları | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini şema temizleme + tanılama ve `resolveXaiModelCompatPatch` / `applyXaiModelCompat` gibi xAI uyumluluk yardımcıları |
  | `plugin-sdk/provider-usage` | Sağlayıcı kullanım yardımcıları | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` ve diğer sağlayıcı kullanım yardımcıları |
  | `plugin-sdk/provider-stream` | Sağlayıcı akış sarmalayıcı yardımcıları | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri ve paylaşılan Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot sarmalayıcı yardımcıları |
  | `plugin-sdk/provider-transport-runtime` | Sağlayıcı taşıma yardımcıları | Korumalı fetch, taşıma mesaj dönüşümleri ve yazılabilir taşıma olay akışları gibi yerel sağlayıcı taşıma yardımcıları |
  | `plugin-sdk/keyed-async-queue` | Sıralı async kuyruk | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Paylaşılan medya yardımcıları | Medya fetch/dönüştürme/depolama yardımcıları artı medya yükü oluşturucuları |
  | `plugin-sdk/media-generation-runtime` | Paylaşılan medya oluşturma yardımcıları | Görsel/video/müzik oluşturma için paylaşılan failover yardımcıları, aday seçimi ve eksik model mesajlaşması |
  | `plugin-sdk/media-understanding` | Medya anlama yardımcıları | Medya anlama sağlayıcı türleri artı sağlayıcıya dönük görsel/ses yardımcı dışa aktarımları |
  | `plugin-sdk/text-runtime` | Paylaşılan metin yardımcıları | Asistan görünür metin ayıklama, markdown işleme/parçalama/tablo yardımcıları, redaksiyon yardımcıları, directive-tag yardımcıları, güvenli metin yardımcıları ve ilgili metin/günlükleme yardımcıları |
  | `plugin-sdk/text-chunking` | Metin parçalama yardımcıları | Giden metin parçalama yardımcısı |
  | `plugin-sdk/speech` | Konuşma yardımcıları | Konuşma sağlayıcı türleri artı sağlayıcıya dönük directive, kayıt defteri ve doğrulama yardımcıları |
  | `plugin-sdk/speech-core` | Paylaşılan konuşma çekirdeği | Konuşma sağlayıcı türleri, kayıt defteri, directive'ler, normalleştirme |
  | `plugin-sdk/realtime-transcription` | Gerçek zamanlı transkripsiyon yardımcıları | Sağlayıcı türleri ve kayıt defteri yardımcıları |
  | `plugin-sdk/realtime-voice` | Gerçek zamanlı ses yardımcıları | Sağlayıcı türleri ve kayıt defteri yardımcıları |
  | `plugin-sdk/image-generation-core` | Paylaşılan görsel oluşturma çekirdeği | Görsel oluşturma türleri, failover, auth ve kayıt defteri yardımcıları |
  | `plugin-sdk/music-generation` | Müzik oluşturma yardımcıları | Müzik oluşturma sağlayıcı/istek/sonuç türleri |
  | `plugin-sdk/music-generation-core` | Paylaşılan müzik oluşturma çekirdeği | Müzik oluşturma türleri, failover yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
  | `plugin-sdk/video-generation` | Video oluşturma yardımcıları | Video oluşturma sağlayıcı/istek/sonuç türleri |
  | `plugin-sdk/video-generation-core` | Paylaşılan video oluşturma çekirdeği | Video oluşturma türleri, failover yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
  | `plugin-sdk/interactive-runtime` | Etkileşimli yanıt yardımcıları | Etkileşimli yanıt yükü normalleştirme/indirgeme |
  | `plugin-sdk/channel-config-primitives` | Kanal yapılandırma ilkel öğeleri | Dar kanal config-schema ilkel öğeleri |
  | `plugin-sdk/channel-config-writes` | Kanal yapılandırma yazma yardımcıları | Kanal yapılandırma yazma yetkilendirme yardımcıları |
  | `plugin-sdk/channel-plugin-common` | Paylaşılan kanal prelude | Paylaşılan kanal plugin prelude dışa aktarımları |
  | `plugin-sdk/channel-status` | Kanal durumu yardımcıları | Paylaşılan kanal durum anlık görüntüsü/özet yardımcıları |
  | `plugin-sdk/allowlist-config-edit` | İzin listesi yapılandırma yardımcıları | İzin listesi yapılandırma düzenleme/okuma yardımcıları |
  | `plugin-sdk/group-access` | Grup erişim yardımcıları | Paylaşılan grup erişim kararı yardımcıları |
  | `plugin-sdk/direct-dm` | Doğrudan DM yardımcıları | Paylaşılan doğrudan DM auth/koruma yardımcıları |
  | `plugin-sdk/extension-shared` | Paylaşılan uzantı yardımcıları | Pasif kanal/durum ve ambient proxy yardımcı ilkel öğeleri |
  | `plugin-sdk/webhook-targets` | Webhook hedef yardımcıları | Webhook hedef kayıt defteri ve rota kurulum yardımcıları |
  | `plugin-sdk/webhook-path` | Webhook yol yardımcıları | Webhook yol normalleştirme yardımcıları |
  | `plugin-sdk/web-media` | Paylaşılan web medya yardımcıları | Uzak/yerel medya yükleme yardımcıları |
  | `plugin-sdk/zod` | Zod yeniden dışa aktarımı | Plugin SDK kullanıcıları için yeniden dışa aktarılan `zod` |
  | `plugin-sdk/memory-core` | Paketle gelen memory-core yardımcıları | Bellek yöneticisi/yapılandırma/dosya/CLI yardımcı yüzeyi |
  | `plugin-sdk/memory-core-engine-runtime` | Bellek motoru çalışma zamanı cephesi | Bellek dizin/arama çalışma zamanı cephesi |
  | `plugin-sdk/memory-core-host-engine-foundation` | Bellek host foundation motoru | Bellek host foundation motor dışa aktarımları |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Bellek host embedding motoru | Bellek embedding sözleşmeleri, kayıt defteri erişimi, yerel sağlayıcı ve genel batch/uzak yardımcılar; somut uzak sağlayıcılar onları sahiplenen plugin'lerde yaşar |
  | `plugin-sdk/memory-core-host-engine-qmd` | Bellek host QMD motoru | Bellek host QMD motor dışa aktarımları |
  | `plugin-sdk/memory-core-host-engine-storage` | Bellek host depolama motoru | Bellek host depolama motor dışa aktarımları |
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
  | `plugin-sdk/memory-host-markdown` | Yönetilen Markdown yardımcıları | Belleğe komşu plugin'ler için paylaşılan yönetilen Markdown yardımcıları |
  | `plugin-sdk/memory-host-search` | Active Memory arama cephesi | Lazy Active Memory arama yöneticisi çalışma zamanı cephesi |
  | `plugin-sdk/memory-host-status` | Bellek host durum takma adı | Bellek host durum yardımcıları için sağlayıcıdan bağımsız takma ad |
  | `plugin-sdk/memory-lancedb` | Paketle gelen memory-lancedb yardımcıları | Memory-lancedb yardımcı yüzeyi |
  | `plugin-sdk/testing` | Test yardımcı programları | Test yardımcıları ve mock'lar |
</Accordion>

Bu tablo, tam Plugin SDK
yüzeyi değil, kasıtlı olarak yaygın geçiş alt kümesidir. 200+'dan fazla giriş noktasının tam listesi
`scripts/lib/plugin-sdk-entrypoints.json` içinde bulunur.

Bu liste hâlâ
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` ve `plugin-sdk/matrix*` gibi bazı paketle gelen plugin yardımcı katmanlarını içerir. Bunlar
paketle gelen plugin bakımı ve uyumluluk için dışa aktarılmaya devam eder, ancak kasıtlı olarak
yaygın geçiş tablosunda yer almazlar ve yeni plugin kodu için önerilen hedef değildirler.

Aynı kural diğer paketle gelen yardımcı aileleri için de geçerlidir; örneğin:

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
  `plugin-sdk/thread-ownership` ve `plugin-sdk/voice-call` gibi paketle gelen yardımcı/plugin yüzeyleri

`plugin-sdk/github-copilot-token` şu anda dar token-helper
yüzeyi olan `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` ve `resolveCopilotApiToken` dışa aktarımlarını sunar.

Yapılan işe en dar uyan içe aktarmayı kullanın. Bir dışa aktarma bulamazsanız,
kaynağı `src/plugin-sdk/` altında kontrol edin veya Discord'da sorun.

## Kaldırma zaman çizelgesi

| Ne zaman              | Ne olur                                                               |
| --------------------- | --------------------------------------------------------------------- |
| **Şimdi**             | Kullanımdan kaldırılmış yüzeyler çalışma anında uyarılar üretir       |
| **Bir sonraki büyük sürüm** | Kullanımdan kaldırılmış yüzeyler kaldırılır; bunları hâlâ kullanan plugin'ler başarısız olur |

Tüm çekirdek plugin'ler zaten taşındı. Harici plugin'ler
bir sonraki büyük sürümden önce geçiş yapmalıdır.

## Uyarıları geçici olarak bastırma

Geçiş üzerinde çalışırken şu ortam değişkenlerini ayarlayın:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Bu geçici bir kaçış kapağıdır, kalıcı bir çözüm değildir.

## İlgili

- [Getting Started](/tr/plugins/building-plugins) — ilk plugin'inizi oluşturun
- [SDK Overview](/tr/plugins/sdk-overview) — tam alt yol içe aktarma başvurusu
- [Channel Plugins](/tr/plugins/sdk-channel-plugins) — kanal plugin'leri oluşturma
- [Provider Plugins](/tr/plugins/sdk-provider-plugins) — sağlayıcı plugin'leri oluşturma
- [Plugin Internals](/tr/plugins/architecture) — mimariye derin dalış
- [Plugin Manifest](/tr/plugins/manifest) — manifest şeması başvurusu

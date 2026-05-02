---
read_when:
    - Bir Plugin içe aktarımı için doğru plugin-sdk alt yolunu seçme
    - Paketle birlikte gelen Plugin alt yollarını ve yardımcı yüzeylerini denetleme
summary: 'Plugin SDK alt yol kataloğu: hangi içe aktarmaların nerede bulunduğu, alana göre gruplandırılmış'
title: Plugin SDK alt yolları
x-i18n:
    generated_at: "2026-05-02T20:59:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc0d2dcf030796d2c73d4d679b9f8d7f6a8aaf71c6b5232b60afbbb50f42b348
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  Plugin SDK, `openclaw/plugin-sdk/` altında dar kapsamlı alt yollar kümesi olarak sunulur.
  Bu sayfa, yaygın kullanılan alt yolları amaca göre gruplandırarak listeler. Üretilen
  200+ alt yoldan oluşan tam liste `scripts/lib/plugin-sdk-entrypoints.json` içinde yer alır;
  ayrılmış paketli Plugin yardımcı alt yolları burada görünür ancak bir dokümantasyon
  sayfası bunları açıkça öne çıkarmadıkça bunlar uygulama detayıdır. Bakımcılar, etkin
  ayrılmış yardımcı alt yolları `pnpm plugins:boundary-report:summary` ile denetleyebilir;
  kullanılmayan ayrılmış yardımcı dışa aktarımları, herkese açık SDK içinde atıl
  uyumluluk borcu olarak kalmak yerine CI raporunu başarısız kılar.

  Plugin yazma kılavuzu için bkz. [Plugin SDK genel bakışı](/tr/plugins/sdk-overview).

  ## Plugin girişi

  | Alt yol                                   | Temel dışa aktarımlar                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Eski Plugin testleri için geniş uyumluluk barrel’i; yeni uzantı testleri için odaklı test alt yollarını tercih edin                                                                     |
  | `plugin-sdk/plugin-test-api`              | Doğrudan Plugin kaydı birim testleri için minimal `OpenClawPluginApi` mock oluşturucu                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | Kimlik doğrulama profilleri, teslim bastırma, fallback sınıflandırması, araç hook’ları, istem bindirmeleri, şemalar ve transcript onarımı için yerel agent-runtime adapter sözleşme fixture’ları |
  | `plugin-sdk/channel-test-helpers`         | Kanal hesap yaşam döngüsü, dizin, gönderim yapılandırması, runtime mock’u, hook, paketli kanal girişi, zarf zaman damgası, eşleştirme yanıtı ve genel kanal sözleşmesi test yardımcıları   |
  | `plugin-sdk/channel-target-testing`       | Paylaşılan kanal hedef çözümleme hata durumu test paketi                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | Plugin kaydı, paket manifest’i, herkese açık artifact, runtime API, içe aktarma yan etkisi ve doğrudan içe aktarma sözleşmesi yardımcıları                                                  |
  | `plugin-sdk/plugin-test-runtime`          | Testler için Plugin runtime’ı, registry, sağlayıcı kaydı, kurulum sihirbazı ve runtime TaskFlow fixture’ları                                                                      |
  | `plugin-sdk/provider-test-contracts`      | Sağlayıcı runtime’ı, kimlik doğrulama, keşif, onboarding, katalog, medya yeteneği, yeniden oynatma ilkesi, gerçek zamanlı STT canlı ses, web arama/getirme ve sihirbaz sözleşmesi yardımcıları                 |
  | `plugin-sdk/provider-http-test-mocks`     | `plugin-sdk/provider-http` çalıştıran sağlayıcı testleri için isteğe bağlı Vitest HTTP/kimlik doğrulama mock’ları                                                                                    |
  | `plugin-sdk/test-env`                     | Test ortamı, fetch/ağ, atılabilir HTTP sunucusu, gelen istek, canlı test, geçici dosya sistemi ve zaman denetimi fixture’ları                                        |
  | `plugin-sdk/test-fixtures`                | Genel CLI, sandbox, skill, agent-message, system-event, modül yeniden yükleme, paketli Plugin yolu, terminal, parçalama, auth-token ve tipli-case test fixture’ları                   |
  | `plugin-sdk/test-node-mocks`              | Vitest `vi.mock("node:*")` fabrikaları içinde kullanım için odaklı Node yerleşik mock yardımcıları                                                                                        |
  | `plugin-sdk/migration`                    | `createMigrationItem`, neden sabitleri, öğe durum işaretçileri, redaction yardımcıları ve `summarizeMigrationItems` gibi migrasyon sağlayıcısı öğe yardımcıları                       |
  | `plugin-sdk/migration-runtime`            | `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` ve `writeMigrationReport` gibi runtime migrasyon yardımcıları                                                    |

  <AccordionGroup>
  <Accordion title="Kanal alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Kök `openclaw.json` Zod şema dışa aktarımı (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ayrıca `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Paylaşılan kurulum sihirbazı yardımcıları, allowlist istemleri, kurulum durumu oluşturucuları |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Çoklu hesap yapılandırma/action-gate yardımcıları, varsayılan hesap fallback yardımcıları |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, account-id normalleştirme yardımcıları |
    | `plugin-sdk/account-resolution` | Hesap arama + varsayılan fallback yardımcıları |
    | `plugin-sdk/account-helpers` | Dar kapsamlı hesap listesi/hesap eylemi yardımcıları |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Paylaşılan kanal yapılandırma şeması primitive’leri ile Zod ve doğrudan JSON/TypeBox oluşturucuları |
    | `plugin-sdk/bundled-channel-config-schema` | Yalnızca bakımı sürdürülen paketli Plugin’ler için paketli OpenClaw kanal yapılandırma şemaları |
    | `plugin-sdk/channel-config-schema-legacy` | Paketli kanal yapılandırma şemaları için kullanımdan kaldırılmış uyumluluk alias’ı |
    | `plugin-sdk/telegram-command-config` | Paketli sözleşme fallback’iyle Telegram özel komut normalleştirme/doğrulama yardımcıları |
    | `plugin-sdk/command-gating` | Dar kapsamlı komut yetkilendirme gate yardımcıları |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, taslak akış yaşam döngüsü/sonlandırma yardımcıları |
    | `plugin-sdk/inbound-envelope` | Paylaşılan gelen rota + zarf oluşturucu yardımcıları |
    | `plugin-sdk/inbound-reply-dispatch` | Paylaşılan gelen kayıt ve dispatch yardımcıları |
    | `plugin-sdk/messaging-targets` | Hedef ayrıştırma/eşleştirme yardımcıları |
    | `plugin-sdk/outbound-media` | Paylaşılan giden medya yükleme yardımcıları |
    | `plugin-sdk/outbound-send-deps` | Kanal adapter’ları için hafif giden gönderim bağımlılığı araması |
    | `plugin-sdk/outbound-runtime` | Giden teslim, kimlik, gönderim delegesi, oturum, biçimlendirme ve payload planlama yardımcıları |
    | `plugin-sdk/poll-runtime` | Dar kapsamlı poll normalleştirme yardımcıları |
    | `plugin-sdk/thread-bindings-runtime` | Thread-binding yaşam döngüsü ve adapter yardımcıları |
    | `plugin-sdk/agent-media-payload` | Eski agent medya payload oluşturucu |
    | `plugin-sdk/conversation-runtime` | Konuşma/thread binding, eşleştirme ve yapılandırılmış-binding yardımcıları |
    | `plugin-sdk/runtime-config-snapshot` | Runtime yapılandırma snapshot yardımcısı |
    | `plugin-sdk/runtime-group-policy` | Runtime grup ilkesi çözümleme yardımcıları |
    | `plugin-sdk/channel-status` | Paylaşılan kanal durumu snapshot/özet yardımcıları |
    | `plugin-sdk/channel-config-primitives` | Dar kapsamlı kanal yapılandırma şeması primitive’leri |
    | `plugin-sdk/channel-config-writes` | Kanal yapılandırma yazma yetkilendirme yardımcıları |
    | `plugin-sdk/channel-plugin-common` | Paylaşılan kanal Plugin prelude dışa aktarımları |
    | `plugin-sdk/allowlist-config-edit` | Allowlist yapılandırması düzenleme/okuma yardımcıları |
    | `plugin-sdk/group-access` | Paylaşılan grup erişimi karar yardımcıları |
    | `plugin-sdk/direct-dm` | Paylaşılan doğrudan DM kimlik doğrulama/guard yardımcıları |
    | `plugin-sdk/discord` | Yayınlanmış `@openclaw/discord@2026.3.13` ve izlenen sahip uyumluluğu için kullanımdan kaldırılmış Discord uyumluluk facade’ı; yeni Plugin’ler genel kanal SDK alt yollarını kullanmalıdır |
    | `plugin-sdk/telegram-account` | İzlenen sahip uyumluluğu için kullanımdan kaldırılmış Telegram hesap çözümleme uyumluluk facade’ı; yeni Plugin’ler enjekte edilen runtime yardımcılarını veya genel kanal SDK alt yollarını kullanmalıdır |
    | `plugin-sdk/zalouser` | Gönderen komut yetkilendirmesini hâlâ içe aktaran yayınlanmış Lark/Zalo paketleri için kullanımdan kaldırılmış Zalo Personal uyumluluk facade’ı; yeni Plugin’ler `plugin-sdk/command-auth` kullanmalıdır |
    | `plugin-sdk/interactive-runtime` | Semantik mesaj sunumu, teslimi ve eski etkileşimli yanıt yardımcıları. Bkz. [Mesaj Sunumu](/tr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Gelen debounce, mention eşleştirme, mention ilkesi yardımcıları ve zarf yardımcıları için uyumluluk barrel’i |
    | `plugin-sdk/channel-inbound-debounce` | Dar kapsamlı gelen debounce yardımcıları |
    | `plugin-sdk/channel-mention-gating` | Daha geniş gelen runtime yüzeyi olmadan dar kapsamlı mention ilkesi, mention işaretçisi ve mention metni yardımcıları |
    | `plugin-sdk/channel-envelope` | Dar kapsamlı gelen zarf biçimlendirme yardımcıları |
    | `plugin-sdk/channel-location` | Kanal konum bağlamı ve biçimlendirme yardımcıları |
    | `plugin-sdk/channel-logging` | Gelen drop’lar ve typing/ack başarısızlıkları için kanal loglama yardımcıları |
    | `plugin-sdk/channel-send-result` | Yanıt sonucu türleri |
    | `plugin-sdk/channel-actions` | Kanal mesaj eylemi yardımcıları, ayrıca Plugin uyumluluğu için tutulan kullanımdan kaldırılmış yerel şema yardımcıları |
    | `plugin-sdk/channel-route` | Paylaşılan rota normalleştirme, ayrıştırıcı güdümlü hedef çözümleme, thread-id stringification, dedupe/compact rota anahtarları, ayrıştırılmış hedef türleri ve rota/hedef karşılaştırma yardımcıları |
    | `plugin-sdk/channel-targets` | Hedef ayrıştırma yardımcıları; rota karşılaştırma çağırıcıları `plugin-sdk/channel-route` kullanmalıdır |
    | `plugin-sdk/channel-contract` | Kanal sözleşmesi türleri |
    | `plugin-sdk/channel-feedback` | Feedback/reaction bağlantıları |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` ve secret hedef türleri gibi dar kapsamlı secret sözleşmesi yardımcıları |
  </Accordion>

  <Accordion title="Sağlayıcı alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Kurulum, katalog keşfi ve çalışma zamanı modeli hazırlığı için desteklenen LM Studio sağlayıcı cephesi |
    | `plugin-sdk/lmstudio-runtime` | Yerel sunucu varsayılanları, model keşfi, istek başlıkları ve yüklenmiş model yardımcıları için desteklenen LM Studio çalışma zamanı cephesi |
    | `plugin-sdk/provider-setup` | Özenle seçilmiş yerel/kendi barındırılan sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/self-hosted-provider-setup` | Odaklanmış OpenAI uyumlu kendi barındırılan sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/cli-backend` | CLI arka uç varsayılanları + watchdog sabitleri |
    | `plugin-sdk/provider-auth-runtime` | Sağlayıcı plugin'leri için çalışma zamanı API anahtarı çözümleme yardımcıları |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` gibi API anahtarı başlangıç/profil yazma yardımcıları |
    | `plugin-sdk/provider-auth-result` | Standart OAuth kimlik doğrulama sonucu oluşturucusu |
    | `plugin-sdk/provider-auth-login` | Sağlayıcı plugin'leri için paylaşılan etkileşimli oturum açma yardımcıları |
    | `plugin-sdk/provider-env-vars` | Sağlayıcı kimlik doğrulama ortam değişkeni arama yardımcıları |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan yeniden oynatma ilkesi oluşturucuları, sağlayıcı uç nokta yardımcıları ve `normalizeNativeXaiModelId` gibi model kimliği normalleştirme yardımcıları |
    | `plugin-sdk/provider-catalog-runtime` | Sözleşme testleri için sağlayıcı katalog genişletme çalışma zamanı kancası ve plugin sağlayıcı kayıt defteri seam'leri |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Genel sağlayıcı HTTP/uç nokta yetenek yardımcıları, sağlayıcı HTTP hataları ve ses transkripsiyonu multipart form yardımcıları |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` ve `WebFetchProviderPlugin` gibi dar web-fetch yapılandırma/seçim sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-fetch` | Web-fetch sağlayıcı kayıt/önbellek yardımcıları |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin etkinleştirme bağlantısına ihtiyaç duymayan sağlayıcılar için dar web-search yapılandırma/kimlik bilgisi yardımcıları |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` ve kapsamlı kimlik bilgisi ayarlayıcıları/alıcıları gibi dar web-search yapılandırma/kimlik bilgisi sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-search` | Web-search sağlayıcı kayıt/önbellek/çalışma zamanı yardımcıları |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini şema temizleme + tanılama ve `resolveXaiModelCompatPatch` / `applyXaiModelCompat` gibi xAI uyumluluk yardımcıları |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` ve benzerleri |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri ve paylaşılan Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot sarmalayıcı yardımcıları |
    | `plugin-sdk/provider-transport-runtime` | Korumalı fetch, aktarım mesajı dönüşümleri ve yazılabilir aktarım olay akışları gibi yerel sağlayıcı aktarım yardımcıları |
    | `plugin-sdk/provider-onboard` | Başlangıç yapılandırma yaması yardımcıları |
    | `plugin-sdk/global-singleton` | Sürece yerel singleton/harita/önbellek yardımcıları |
    | `plugin-sdk/group-activation` | Dar grup etkinleştirme modu ve komut ayrıştırma yardımcıları |
  </Accordion>

  <Accordion title="Kimlik doğrulama ve güvenlik alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, dinamik bağımsız değişken menüsü biçimlendirmesi dahil komut kayıt defteri yardımcıları, gönderici yetkilendirme yardımcıları |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` ve `buildHelpMessage` gibi komut/yardım iletisi oluşturucuları |
    | `plugin-sdk/approval-auth-runtime` | Onaylayıcı çözümleme ve aynı sohbet eylem kimlik doğrulaması yardımcıları |
    | `plugin-sdk/approval-client-runtime` | Yerel exec onay profili/filtre yardımcıları |
    | `plugin-sdk/approval-delivery-runtime` | Yerel onay yeteneği/teslim adaptörleri |
    | `plugin-sdk/approval-gateway-runtime` | Paylaşılan onay Gateway çözümleme yardımcısı |
    | `plugin-sdk/approval-handler-adapter-runtime` | Sıcak kanal giriş noktaları için hafif yerel onay adaptörü yükleme yardımcıları |
    | `plugin-sdk/approval-handler-runtime` | Daha geniş onay işleyici çalışma zamanı yardımcıları; yeterli olduklarında daha dar adaptör/gateway seam'lerini tercih edin |
    | `plugin-sdk/approval-native-runtime` | Yerel onay hedefi + hesap bağlama yardımcıları |
    | `plugin-sdk/approval-reply-runtime` | Exec/plugin onay yanıtı yük yardımcıları |
    | `plugin-sdk/approval-runtime` | Exec/plugin onay yük yardımcıları, yerel onay yönlendirme/çalışma zamanı yardımcıları ve `formatApprovalDisplayPath` gibi yapılandırılmış onay gösterim yardımcıları |
    | `plugin-sdk/reply-dedupe` | Dar gelen yanıt tekilleştirme sıfırlama yardımcıları |
    | `plugin-sdk/channel-contract-testing` | Geniş test barrel'ı olmadan dar kanal sözleşmesi test yardımcıları |
    | `plugin-sdk/command-auth-native` | Yerel komut kimlik doğrulaması, dinamik bağımsız değişken menüsü biçimlendirmesi ve yerel oturum hedefi yardımcıları |
    | `plugin-sdk/command-detection` | Paylaşılan komut algılama yardımcıları |
    | `plugin-sdk/command-primitives-runtime` | Sıcak kanal yolları için hafif komut metni yüklemleri |
    | `plugin-sdk/command-surface` | Komut gövdesi normalleştirme ve komut yüzeyi yardımcıları |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Kanal/plugin secret yüzeyleri için dar secret sözleşmesi toplama yardımcıları |
    | `plugin-sdk/secret-ref-runtime` | Secret sözleşmesi/yapılandırma ayrıştırması için dar `coerceSecretRef` ve SecretRef türleme yardımcıları |
    | `plugin-sdk/security-runtime` | Paylaşılan güven, DM kapılama, dış içerik, hassas metin redaksiyonu, sabit zamanlı secret karşılaştırması ve secret toplama yardımcıları |
    | `plugin-sdk/ssrf-policy` | Ana makine izin listesi ve özel ağ SSRF ilkesi yardımcıları |
    | `plugin-sdk/ssrf-dispatcher` | Geniş altyapı çalışma zamanı yüzeyi olmadan dar sabitlenmiş dispatcher yardımcıları |
    | `plugin-sdk/ssrf-runtime` | Sabitlenmiş dispatcher, SSRF korumalı fetch, SSRF hatası ve SSRF ilkesi yardımcıları |
    | `plugin-sdk/secret-input` | Secret girdi ayrıştırma yardımcıları |
    | `plugin-sdk/webhook-ingress` | Webhook istek/hedef yardımcıları ve ham websocket/gövde zorlaması |
    | `plugin-sdk/webhook-request-guards` | İstek gövdesi boyutu/zaman aşımı yardımcıları |
  </Accordion>

  <Accordion title="Çalışma zamanı ve depolama alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/runtime` | Geniş çalışma zamanı/günlükleme/yedekleme/plugin yükleme yardımcıları |
    | `plugin-sdk/runtime-env` | Dar çalışma zamanı env, günlükleyici, zaman aşımı, yeniden deneme ve geri çekilme yardımcıları |
    | `plugin-sdk/browser-config` | Normalleştirilmiş profil/varsayılanlar, CDP URL ayrıştırma ve tarayıcı denetimi kimlik doğrulama yardımcıları için desteklenen tarayıcı yapılandırması cephesi |
    | `plugin-sdk/channel-runtime-context` | Genel kanal çalışma zamanı bağlamı kaydı ve arama yardımcıları |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Paylaşılan plugin komut/hook/http/etkileşimli yardımcıları |
    | `plugin-sdk/hook-runtime` | Paylaşılan webhook/dahili hook işlem hattı yardımcıları |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod` ve `createLazyRuntimeSurface` gibi tembel çalışma zamanı içe aktarma/bağlama yardımcıları |
    | `plugin-sdk/process-runtime` | Süreç yürütme yardımcıları |
    | `plugin-sdk/cli-runtime` | CLI biçimlendirme, bekleme, sürüm, bağımsız değişken çağrısı ve tembel komut grubu yardımcıları |
    | `plugin-sdk/gateway-runtime` | Gateway istemcisi, olay döngüsüne hazır istemci başlatma yardımcısı, gateway CLI RPC, gateway protokol hataları ve kanal durumu yama yardımcıları |
    | `plugin-sdk/config-types` | `OpenClawConfig` ve kanal/sağlayıcı yapılandırma türleri gibi plugin yapılandırma şekilleri için yalnızca tür yapılandırma yüzeyi |
    | `plugin-sdk/plugin-config-runtime` | `requireRuntimeConfig`, `resolvePluginConfigObject` ve `resolveLivePluginConfigObject` gibi çalışma zamanı plugin yapılandırması arama yardımcıları |
    | `plugin-sdk/config-mutation` | `mutateConfigFile`, `replaceConfigFile` ve `logConfigUpdated` gibi işlemsel yapılandırma mutasyonu yardımcıları |
    | `plugin-sdk/runtime-config-snapshot` | `getRuntimeConfig`, `getRuntimeConfigSnapshot` ve test anlık görüntü ayarlayıcıları gibi geçerli süreç yapılandırma anlık görüntüsü yardımcıları |
    | `plugin-sdk/telegram-command-config` | Paketlenen Telegram sözleşme yüzeyi kullanılamadığında bile Telegram komut adı/açıklama normalleştirmesi ve yinelenen/çakışma denetimleri |
    | `plugin-sdk/text-autolink-runtime` | Geniş text-runtime barrel olmadan dosya başvurusu otomatik bağlantı algılama |
    | `plugin-sdk/approval-runtime` | Exec/plugin onay yardımcıları, onay yeteneği oluşturucuları, kimlik doğrulama/profil yardımcıları, yerel yönlendirme/çalışma zamanı yardımcıları ve yapılandırılmış onay görüntüleme yolu biçimlendirmesi |
    | `plugin-sdk/reply-runtime` | Paylaşılan gelen/yanıt çalışma zamanı yardımcıları, parçalama, gönderim, heartbeat, yanıt planlayıcı |
    | `plugin-sdk/reply-dispatch-runtime` | Dar yanıt gönderme/sonlandırma ve konuşma etiketi yardımcıları |
    | `plugin-sdk/reply-history` | Paylaşılan kısa pencereli yanıt geçmişi yardımcıları ve `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` ve `clearHistoryEntriesIfEnabled` gibi işaretleyiciler |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Dar metin/markdown parçalama yardımcıları |
    | `plugin-sdk/session-store-runtime` | Oturum deposu yolu, oturum anahtarı, updated-at ve depo mutasyonu yardımcıları |
    | `plugin-sdk/cron-store-runtime` | Cron deposu yol/yükleme/kaydetme yardımcıları |
    | `plugin-sdk/state-paths` | State/OAuth dizin yolu yardımcıları |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey` ve `resolveDefaultAgentBoundAccountId` gibi rota/oturum anahtarı/hesap bağlama yardımcıları |
    | `plugin-sdk/status-helpers` | Paylaşılan kanal/hesap durumu özeti yardımcıları, çalışma zamanı durumu varsayılanları ve sorun meta verisi yardımcıları |
    | `plugin-sdk/target-resolver-runtime` | Paylaşılan hedef çözümleyici yardımcıları |
    | `plugin-sdk/string-normalization-runtime` | Slug/dize normalleştirme yardımcıları |
    | `plugin-sdk/request-url` | Fetch/request benzeri girdilerden dize URL'leri çıkarır |
    | `plugin-sdk/run-command` | Normalleştirilmiş stdout/stderr sonuçlarıyla zamanlanmış komut çalıştırıcı |
    | `plugin-sdk/param-readers` | Ortak araç/CLI parametre okuyucuları |
    | `plugin-sdk/tool-payload` | Araç sonuç nesnelerinden normalleştirilmiş yükleri çıkarır |
    | `plugin-sdk/tool-send` | Araç bağımsız değişkenlerinden kanonik gönderim hedefi alanlarını çıkarır |
    | `plugin-sdk/temp-path` | Paylaşılan geçici indirme yolu yardımcıları |
    | `plugin-sdk/logging-core` | Alt sistem günlükleyicisi ve redaksiyon yardımcıları |
    | `plugin-sdk/markdown-table-runtime` | Markdown tablo modu ve dönüştürme yardımcıları |
    | `plugin-sdk/model-session-runtime` | `applyModelOverrideToSessionEntry` ve `resolveAgentMaxConcurrent` gibi model/oturum geçersiz kılma yardımcıları |
    | `plugin-sdk/talk-config-runtime` | Talk sağlayıcı yapılandırma çözümleme yardımcıları |
    | `plugin-sdk/json-store` | Küçük JSON durumu okuma/yazma yardımcıları |
    | `plugin-sdk/file-lock` | Yeniden girişli dosya kilidi yardımcıları |
    | `plugin-sdk/persistent-dedupe` | Disk destekli tekilleştirme önbelleği yardımcıları |
    | `plugin-sdk/acp-runtime` | ACP çalışma zamanı/oturum ve yanıt gönderme yardımcıları |
    | `plugin-sdk/acp-runtime-backend` | Başlangıçta yüklenen plugin'ler için hafif ACP arka uç kaydı ve yanıt gönderme yardımcıları |
    | `plugin-sdk/acp-binding-resolve-runtime` | Yaşam döngüsü başlangıç içe aktarmaları olmadan salt okunur ACP bağlama çözümlemesi |
    | `plugin-sdk/agent-config-primitives` | Dar aracı çalışma zamanı yapılandırma şeması ilkelleri |
    | `plugin-sdk/boolean-param` | Gevşek boolean parametre okuyucu |
    | `plugin-sdk/dangerous-name-runtime` | Tehlikeli ad eşleşmesi çözümleme yardımcıları |
    | `plugin-sdk/device-bootstrap` | Cihaz bootstrap ve eşleştirme belirteci yardımcıları |
    | `plugin-sdk/extension-shared` | Paylaşılan pasif kanal, durum ve ortam proxy yardımcısı ilkelleri |
    | `plugin-sdk/models-provider-runtime` | `/models` komut/sağlayıcı yanıt yardımcıları |
    | `plugin-sdk/skill-commands-runtime` | Skill komut listeleme yardımcıları |
    | `plugin-sdk/native-command-registry` | Yerel komut kayıt defteri/oluşturma/serileştirme yardımcıları |
    | `plugin-sdk/agent-harness` | Düşük düzeyli aracı harness'leri için deneysel güvenilir plugin yüzeyi: harness türleri, etkin çalışma yönlendirme/iptal yardımcıları, OpenClaw araç köprüsü yardımcıları, çalışma zamanı planı araç ilkesi yardımcıları, terminal sonuç sınıflandırması, araç ilerlemesi biçimlendirme/ayrıntı yardımcıları ve deneme sonucu yardımcı programları |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI uç nokta algılama yardımcıları |
    | `plugin-sdk/async-lock-runtime` | Küçük çalışma zamanı durum dosyaları için süreç yerelinde async kilit yardımcısı |
    | `plugin-sdk/channel-activity-runtime` | Kanal etkinliği telemetri yardımcısı |
    | `plugin-sdk/concurrency-runtime` | Sınırlı async görev eşzamanlılığı yardımcısı |
    | `plugin-sdk/dedupe-runtime` | Bellek içi tekilleştirme önbelleği yardımcıları |
    | `plugin-sdk/delivery-queue-runtime` | Giden bekleyen teslimat boşaltma yardımcısı |
    | `plugin-sdk/file-access-runtime` | Güvenli yerel dosya ve medya kaynağı yolu yardımcıları |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat olayı ve görünürlük yardımcıları |
    | `plugin-sdk/number-runtime` | Sayısal zorlama yardımcısı |
    | `plugin-sdk/secure-random-runtime` | Güvenli belirteç/UUID yardımcıları |
    | `plugin-sdk/system-event-runtime` | Sistem olay kuyruğu yardımcıları |
    | `plugin-sdk/transport-ready-runtime` | Taşıma hazır olma bekleme yardımcısı |
    | `plugin-sdk/infra-runtime` | Kullanımdan kaldırılmış uyumluluk shim'i; yukarıdaki odaklanmış çalışma zamanı alt yollarını kullanın |
    | `plugin-sdk/collection-runtime` | Küçük sınırlı önbellek yardımcıları |
    | `plugin-sdk/diagnostic-runtime` | Tanılama bayrağı, olay ve izleme bağlamı yardımcıları |
    | `plugin-sdk/error-runtime` | Hata grafiği, biçimlendirme, paylaşılan hata sınıflandırma yardımcıları, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Sarmalanmış fetch, proxy, EnvHttpProxyAgent seçeneği ve sabitlenmiş lookup yardımcıları |
    | `plugin-sdk/runtime-fetch` | Proxy/guarded-fetch içe aktarmaları olmadan dispatcher uyumlu çalışma zamanı fetch'i |
    | `plugin-sdk/response-limit-runtime` | Geniş medya çalışma zamanı yüzeyi olmadan sınırlı yanıt gövdesi okuyucu |
    | `plugin-sdk/session-binding-runtime` | Yapılandırılmış bağlama yönlendirmesi veya eşleştirme depoları olmadan geçerli konuşma bağlama durumu |
    | `plugin-sdk/session-store-runtime` | Geniş yapılandırma yazmaları/bakım içe aktarmaları olmadan oturum deposu yardımcıları |
    | `plugin-sdk/context-visibility-runtime` | Geniş yapılandırma/güvenlik içe aktarmaları olmadan bağlam görünürlüğü çözümlemesi ve ek bağlam filtreleme |
    | `plugin-sdk/string-coerce-runtime` | Markdown/günlükleme içe aktarmaları olmadan dar ilkel kayıt/dize zorlama ve normalleştirme yardımcıları |
    | `plugin-sdk/host-runtime` | Ana makine adı ve SCP ana makine normalleştirme yardımcıları |
    | `plugin-sdk/retry-runtime` | Yeniden deneme yapılandırması ve yeniden deneme çalıştırıcı yardımcıları |
    | `plugin-sdk/agent-runtime` | Aracı dizini/kimlik/çalışma alanı yardımcıları |
    | `plugin-sdk/directory-runtime` | Yapılandırma destekli dizin sorgusu/tekilleştirme |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Yetenek ve test alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Paylaşılan medya getirme/dönüştürme/depolama yardımcıları, ffprobe destekli video boyutu sorgulama ve medya yükü oluşturucuları |
    | `plugin-sdk/media-store` | `saveMediaBuffer` gibi dar kapsamlı medya deposu yardımcıları |
    | `plugin-sdk/media-generation-runtime` | Paylaşılan medya oluşturma devretme yardımcıları, aday seçimi ve eksik model mesajlaşması |
    | `plugin-sdk/media-understanding` | Medya anlama sağlayıcı türleri ve sağlayıcıya yönelik görüntü/ses yardımcı dışa aktarımları |
    | `plugin-sdk/text-runtime` | Asistan tarafından görülebilen metni ayıklama, markdown işleme/parçalama/tablo yardımcıları, redaksiyon yardımcıları, yönerge etiketi yardımcıları ve güvenli metin yardımcı programları gibi paylaşılan metin/markdown/günlükleme yardımcıları |
    | `plugin-sdk/text-chunking` | Giden metin parçalama yardımcısı |
    | `plugin-sdk/speech` | Konuşma sağlayıcı türleri ve sağlayıcıya yönelik yönerge, kayıt defteri, doğrulama, OpenAI uyumlu TTS oluşturucusu ve konuşma yardımcısı dışa aktarımları |
    | `plugin-sdk/speech-core` | Paylaşılan konuşma sağlayıcı türleri, kayıt defteri, yönerge, normalleştirme ve konuşma yardımcısı dışa aktarımları |
    | `plugin-sdk/realtime-transcription` | Gerçek zamanlı transkripsiyon sağlayıcı türleri, kayıt defteri yardımcıları ve paylaşılan WebSocket oturum yardımcısı |
    | `plugin-sdk/realtime-voice` | Gerçek zamanlı ses sağlayıcı türleri ve kayıt defteri yardımcıları |
    | `plugin-sdk/image-generation` | Görüntü oluşturma sağlayıcı türleri, görüntü varlığı/veri URL'si yardımcıları ve OpenAI uyumlu görüntü sağlayıcı oluşturucusu |
    | `plugin-sdk/image-generation-core` | Paylaşılan görüntü oluşturma türleri, devretme, kimlik doğrulama ve kayıt defteri yardımcıları |
    | `plugin-sdk/music-generation` | Müzik oluşturma sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/music-generation-core` | Paylaşılan müzik oluşturma türleri, devretme yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
    | `plugin-sdk/video-generation` | Video oluşturma sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/video-generation-core` | Paylaşılan video oluşturma türleri, devretme yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
    | `plugin-sdk/webhook-targets` | Webhook hedef kayıt defteri ve rota kurulum yardımcıları |
    | `plugin-sdk/webhook-path` | Webhook yolu normalleştirme yardımcıları |
    | `plugin-sdk/web-media` | Paylaşılan uzak/yerel medya yükleme yardımcıları |
    | `plugin-sdk/zod` | Plugin SDK tüketicileri için yeniden dışa aktarılan `zod` |
    | `plugin-sdk/testing` | Eski Plugin testleri için geniş uyumluluk barrel'ı. Yeni uzantı testleri bunun yerine `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` veya `plugin-sdk/test-fixtures` gibi odaklı SDK alt yollarını içe aktarmalıdır |
    | `plugin-sdk/plugin-test-api` | Depo test yardımcısı köprülerini içe aktarmadan doğrudan Plugin kaydı birim testleri için minimal `createTestPluginApi` yardımcısı |
    | `plugin-sdk/agent-runtime-test-contracts` | Kimlik doğrulama, teslim, yedek, araç kancası, istem katmanı, şema ve transkript projeksiyonu testleri için yerel ajan çalışma zamanı bağdaştırıcısı sözleşme fikstürleri |
    | `plugin-sdk/channel-test-helpers` | Genel eylem/kurulum/durum sözleşmeleri, dizin doğrulamaları, hesap başlatma yaşam döngüsü, gönderim yapılandırması iş parçacığı, çalışma zamanı taklitleri, durum sorunları, giden teslim ve kanca kaydı için kanal odaklı test yardımcıları |
    | `plugin-sdk/channel-target-testing` | Kanal testleri için paylaşılan hedef çözümleme hata durumu paketi |
    | `plugin-sdk/plugin-test-contracts` | Plugin paketi, kayıt, herkese açık artefakt, doğrudan içe aktarma, çalışma zamanı API'si ve içe aktarma yan etkisi sözleşme yardımcıları |
    | `plugin-sdk/provider-test-contracts` | Sağlayıcı çalışma zamanı, kimlik doğrulama, keşif, onboarding, katalog, sihirbaz, medya yeteneği, yeniden oynatma politikası, gerçek zamanlı STT canlı ses, web arama/getirme ve akış sözleşmesi yardımcıları |
    | `plugin-sdk/provider-http-test-mocks` | `plugin-sdk/provider-http` kullanan sağlayıcı testleri için isteğe bağlı Vitest HTTP/kimlik doğrulama taklitleri |
    | `plugin-sdk/test-fixtures` | Genel CLI çalışma zamanı yakalama, sandbox bağlamı, skill yazıcı, ajan mesajı, sistem olayı, modül yeniden yükleme, paketlenmiş Plugin yolu, terminal metni, parçalama, kimlik doğrulama belirteci ve türlendirilmiş durum fikstürleri |
    | `plugin-sdk/test-node-mocks` | Vitest `vi.mock("node:*")` fabrikaları içinde kullanım için odaklı Node yerleşik taklit yardımcıları |
  </Accordion>

  <Accordion title="Bellek alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/memory-core` | Yönetici/yapılandırma/dosya/CLI yardımcıları için paketlenmiş memory-core yardımcı yüzeyi |
    | `plugin-sdk/memory-core-engine-runtime` | Bellek dizini/arama çalışma zamanı cephesi |
    | `plugin-sdk/memory-core-host-engine-foundation` | Bellek ana makine foundation motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Bellek ana makine gömme sözleşmeleri, kayıt defteri erişimi, yerel sağlayıcı ve genel toplu/uzak yardımcılar |
    | `plugin-sdk/memory-core-host-engine-qmd` | Bellek ana makine QMD motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-storage` | Bellek ana makine depolama motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-multimodal` | Bellek ana makine çok modlu yardımcıları |
    | `plugin-sdk/memory-core-host-query` | Bellek ana makine sorgu yardımcıları |
    | `plugin-sdk/memory-core-host-secret` | Bellek ana makine gizli bilgi yardımcıları |
    | `plugin-sdk/memory-core-host-events` | Bellek ana makine olay günlüğü yardımcıları |
    | `plugin-sdk/memory-core-host-status` | Bellek ana makine durum yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-cli` | Bellek ana makine CLI çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-core` | Bellek ana makine çekirdek çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-files` | Bellek ana makine dosya/çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-host-core` | Bellek ana makine çekirdek çalışma zamanı yardımcıları için satıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-host-events` | Bellek ana makine olay günlüğü yardımcıları için satıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-host-files` | Bellek ana makine dosya/çalışma zamanı yardımcıları için satıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-host-markdown` | Bellekle ilişkili Plugin'ler için paylaşılan yönetilen markdown yardımcıları |
    | `plugin-sdk/memory-host-search` | Arama yöneticisi erişimi için active memory çalışma zamanı cephesi |
    | `plugin-sdk/memory-host-status` | Bellek ana makine durum yardımcıları için satıcıdan bağımsız takma ad |
  </Accordion>

  <Accordion title="Ayrılmış paketlenmiş yardımcı alt yolları">
    Şu anda ayrılmış paketlenmiş yardımcı SDK alt yolu yoktur. Sahibine özgü
    yardımcılar sahip Plugin paketinin içinde bulunurken, yeniden kullanılabilir ana makine sözleşmeleri
    `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` ve `plugin-sdk/plugin-config-runtime`
    gibi genel SDK alt yollarını kullanır.
  </Accordion>
</AccordionGroup>

## İlgili

- [Plugin SDK genel bakışı](/tr/plugins/sdk-overview)
- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)

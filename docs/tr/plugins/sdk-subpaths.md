---
read_when:
    - Bir Plugin içe aktarımı için doğru plugin-sdk alt yolunu seçme
    - Birlikte gelen Plugin alt yollarını ve yardımcı yüzeyleri denetleme
summary: 'Plugin SDK alt yol kataloğu: hangi içe aktarımların nerede bulunduğu, alana göre gruplandırılmış'
title: Plugin SDK alt yolları
x-i18n:
    generated_at: "2026-04-30T09:38:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a8c431c1835fff6720a00984171e3f55886363654074d81859f50ca28a35104
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  Plugin SDK, `openclaw/plugin-sdk/` altında dar alt yollar kümesi olarak sunulur.
  Bu sayfa, yaygın olarak kullanılan alt yolları amaca göre gruplandırarak kataloglar. Oluşturulan
  200+ alt yolun tam listesi `scripts/lib/plugin-sdk-entrypoints.json` içinde yer alır;
  ayrılmış paketli Plugin yardımcı alt yolları burada görünür, ancak bir dokümantasyon sayfası bunları açıkça öne çıkarmadıkça uygulama
  ayrıntısıdır. Bakımcılar etkin
  ayrılmış yardımcı alt yolları `pnpm plugins:boundary-report:summary` ile denetleyebilir; kullanılmayan
  ayrılmış yardımcı dışa aktarımları, herkese açık SDK içinde uyuyan uyumluluk borcu olarak kalmak yerine CI raporunda başarısız olur.

  Plugin yazma kılavuzu için bkz. [Plugin SDK genel bakışı](/tr/plugins/sdk-overview).

  ## Plugin girişi

  | Alt yol                                   | Ana dışa aktarımlar                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Eski Plugin testleri için geniş uyumluluk barrel'ı; yeni uzantı testleri için odaklanmış test alt yollarını tercih edin                                                                     |
  | `plugin-sdk/plugin-test-api`              | Doğrudan Plugin kaydı birim testleri için minimal `OpenClawPluginApi` mock oluşturucu                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | Kimlik doğrulama profilleri, teslimat bastırma, geri dönüş sınıflandırması, araç kancaları, prompt katmanları, şemalar ve transcript onarımı için yerel agent-runtime adaptör sözleşmesi fixture'ları |
  | `plugin-sdk/channel-test-helpers`         | Kanal hesabı yaşam döngüsü, dizin, gönderme yapılandırması, runtime mock'u, kanca, paketli kanal girişi, envelope zaman damgası, eşleme yanıtı ve genel kanal sözleşmesi test yardımcıları   |
  | `plugin-sdk/channel-target-testing`       | Paylaşılan kanal hedef çözümleme hata durumu test paketi                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | Plugin kaydı, paket manifest'i, herkese açık artifact, runtime API, import yan etkisi ve doğrudan import sözleşmesi yardımcıları                                                  |
  | `plugin-sdk/plugin-test-runtime`          | Testler için Plugin runtime'ı, kayıt defteri, provider kaydı, kurulum sihirbazı ve runtime task-flow fixture'ları                                                                      |
  | `plugin-sdk/provider-test-contracts`      | Provider runtime'ı, kimlik doğrulama, keşif, onboarding, katalog, medya yeteneği, replay ilkesi, gerçek zamanlı STT canlı ses, web arama/getirme ve sihirbaz sözleşmesi yardımcıları                 |
  | `plugin-sdk/provider-http-test-mocks`     | `plugin-sdk/provider-http` kullanan provider testleri için isteğe bağlı Vitest HTTP/kimlik doğrulama mock'ları                                                                                    |
  | `plugin-sdk/test-env`                     | Test ortamı, fetch/ağ, tek kullanımlık HTTP sunucusu, gelen istek, canlı test, geçici dosya sistemi ve zaman denetimi fixture'ları                                        |
  | `plugin-sdk/test-fixtures`                | Genel CLI, sandbox, skill, agent-message, system-event, modül yeniden yükleme, paketli Plugin yolu, terminal, chunking, auth-token ve typed-case test fixture'ları                   |
  | `plugin-sdk/test-node-mocks`              | Vitest `vi.mock("node:*")` factory'leri içinde kullanım için odaklanmış Node yerleşik mock yardımcıları                                                                                        |
  | `plugin-sdk/migration`                    | `createMigrationItem` gibi migration provider öğesi yardımcıları, neden sabitleri, öğe durum işaretçileri, redaction yardımcıları ve `summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` ve `writeMigrationReport` gibi runtime migration yardımcıları                                                    |

  <AccordionGroup>
  <Accordion title="Kanal alt yolları">
    | Alt yol | Ana dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Kök `openclaw.json` Zod şeması dışa aktarımı (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ayrıca `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Paylaşılan kurulum sihirbazı yardımcıları, allowlist prompt'ları, kurulum durumu oluşturucuları |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Çok hesaplı yapılandırma/eylem kapısı yardımcıları, varsayılan hesap geri dönüş yardımcıları |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, hesap kimliği normalleştirme yardımcıları |
    | `plugin-sdk/account-resolution` | Hesap arama + varsayılan geri dönüş yardımcıları |
    | `plugin-sdk/account-helpers` | Dar hesap listesi/hesap eylemi yardımcıları |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Paylaşılan kanal yapılandırma şeması ilkel öğeleri ve genel oluşturucu |
    | `plugin-sdk/bundled-channel-config-schema` | Yalnızca bakımı yapılan paketli Plugin'ler için paketli OpenClaw kanal yapılandırma şemaları |
    | `plugin-sdk/channel-config-schema-legacy` | Paketli kanal yapılandırma şemaları için kullanımdan kaldırılmış uyumluluk takma adı |
    | `plugin-sdk/telegram-command-config` | Paketli sözleşme geri dönüşüyle Telegram özel komut normalleştirme/doğrulama yardımcıları |
    | `plugin-sdk/command-gating` | Dar komut yetkilendirme kapısı yardımcıları |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, taslak akış yaşam döngüsü/sonlandırma yardımcıları |
    | `plugin-sdk/inbound-envelope` | Paylaşılan gelen route + envelope oluşturucu yardımcıları |
    | `plugin-sdk/inbound-reply-dispatch` | Paylaşılan gelen kayıt ve dispatch yardımcıları |
    | `plugin-sdk/messaging-targets` | Hedef ayrıştırma/eşleştirme yardımcıları |
    | `plugin-sdk/outbound-media` | Paylaşılan giden medya yükleme yardımcıları |
    | `plugin-sdk/outbound-send-deps` | Kanal adaptörleri için hafif giden gönderim bağımlılığı araması |
    | `plugin-sdk/outbound-runtime` | Giden teslimat, kimlik, gönderme delegesi, oturum, biçimlendirme ve payload planlama yardımcıları |
    | `plugin-sdk/poll-runtime` | Dar anket normalleştirme yardımcıları |
    | `plugin-sdk/thread-bindings-runtime` | Thread-binding yaşam döngüsü ve adaptör yardımcıları |
    | `plugin-sdk/agent-media-payload` | Eski agent medya payload oluşturucu |
    | `plugin-sdk/conversation-runtime` | Konuşma/thread binding, eşleme ve yapılandırılmış binding yardımcıları |
    | `plugin-sdk/runtime-config-snapshot` | Runtime yapılandırma snapshot yardımcısı |
    | `plugin-sdk/runtime-group-policy` | Runtime grup ilkesi çözümleme yardımcıları |
    | `plugin-sdk/channel-status` | Paylaşılan kanal durumu snapshot/özet yardımcıları |
    | `plugin-sdk/channel-config-primitives` | Dar kanal yapılandırma şeması ilkel öğeleri |
    | `plugin-sdk/channel-config-writes` | Kanal yapılandırma yazma yetkilendirme yardımcıları |
    | `plugin-sdk/channel-plugin-common` | Paylaşılan kanal Plugin prelude dışa aktarımları |
    | `plugin-sdk/allowlist-config-edit` | Allowlist yapılandırma düzenleme/okuma yardımcıları |
    | `plugin-sdk/group-access` | Paylaşılan grup erişimi karar yardımcıları |
    | `plugin-sdk/direct-dm` | Paylaşılan doğrudan DM kimlik doğrulama/koruma yardımcıları |
    | `plugin-sdk/discord` | Yayınlanmış `@openclaw/discord@2026.3.13` ve izlenen sahip uyumluluğu için kullanımdan kaldırılmış Discord uyumluluk facade'ı; yeni Plugin'ler genel kanal SDK alt yollarını kullanmalıdır |
    | `plugin-sdk/telegram-account` | İzlenen sahip uyumluluğu için kullanımdan kaldırılmış Telegram hesap çözümleme uyumluluk facade'ı; yeni Plugin'ler enjekte edilen runtime yardımcılarını veya genel kanal SDK alt yollarını kullanmalıdır |
    | `plugin-sdk/zalouser` | Hala gönderici komut yetkilendirmesini import eden yayınlanmış Lark/Zalo paketleri için kullanımdan kaldırılmış Zalo Personal uyumluluk facade'ı; yeni Plugin'ler `plugin-sdk/command-auth` kullanmalıdır |
    | `plugin-sdk/interactive-runtime` | Anlamsal mesaj sunumu, teslimatı ve eski etkileşimli yanıt yardımcıları. Bkz. [Mesaj Sunumu](/tr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Gelen debounce, bahsetme eşleştirme, bahsetme ilkesi yardımcıları ve envelope yardımcıları için uyumluluk barrel'ı |
    | `plugin-sdk/channel-inbound-debounce` | Dar gelen debounce yardımcıları |
    | `plugin-sdk/channel-mention-gating` | Daha geniş gelen runtime yüzeyi olmadan dar bahsetme ilkesi, bahsetme işaretleyicisi ve bahsetme metni yardımcıları |
    | `plugin-sdk/channel-envelope` | Dar gelen envelope biçimlendirme yardımcıları |
    | `plugin-sdk/channel-location` | Kanal konum bağlamı ve biçimlendirme yardımcıları |
    | `plugin-sdk/channel-logging` | Gelen düşürmeler ve yazıyor/ack hataları için kanal günlükleme yardımcıları |
    | `plugin-sdk/channel-send-result` | Yanıt sonuç türleri |
    | `plugin-sdk/channel-actions` | Kanal mesaj eylemi yardımcıları, ayrıca Plugin uyumluluğu için korunan kullanımdan kaldırılmış yerel şema yardımcıları |
    | `plugin-sdk/channel-route` | Paylaşılan route normalleştirme, parser odaklı hedef çözümleme, thread-id stringification, dedupe/compact route anahtarları, ayrıştırılmış hedef türleri ve route/hedef karşılaştırma yardımcıları |
    | `plugin-sdk/channel-targets` | Hedef ayrıştırma yardımcıları; route karşılaştırması yapan çağırıcılar `plugin-sdk/channel-route` kullanmalıdır |
    | `plugin-sdk/channel-contract` | Kanal sözleşmesi türleri |
    | `plugin-sdk/channel-feedback` | Feedback/reaction bağlantıları |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` ve secret hedef türleri gibi dar secret sözleşmesi yardımcıları |
  </Accordion>

  <Accordion title="Provider subpaths">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Kurulum, katalog keşfi ve çalışma zamanı model hazırlığı için desteklenen LM Studio sağlayıcı arayüzü |
    | `plugin-sdk/lmstudio-runtime` | Yerel sunucu varsayılanları, model keşfi, istek başlıkları ve yüklü model yardımcıları için desteklenen LM Studio çalışma zamanı arayüzü |
    | `plugin-sdk/provider-setup` | Düzenlenmiş yerel/kendi barındırılan sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/self-hosted-provider-setup` | Odaklanmış OpenAI uyumlu kendi barındırılan sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/cli-backend` | CLI arka uç varsayılanları + watchdog sabitleri |
    | `plugin-sdk/provider-auth-runtime` | Sağlayıcı plugin'leri için çalışma zamanı API anahtarı çözümleme yardımcıları |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` gibi API anahtarı katılım/profil yazma yardımcıları |
    | `plugin-sdk/provider-auth-result` | Standart OAuth auth-result oluşturucu |
    | `plugin-sdk/provider-auth-login` | Sağlayıcı plugin'leri için paylaşılan etkileşimli oturum açma yardımcıları |
    | `plugin-sdk/provider-env-vars` | Sağlayıcı kimlik doğrulama env-var arama yardımcıları |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan replay-policy oluşturucuları, sağlayıcı uç noktası yardımcıları ve `normalizeNativeXaiModelId` gibi model kimliği normalleştirme yardımcıları |
    | `plugin-sdk/provider-catalog-runtime` | Sözleşme testleri için sağlayıcı katalog artırma çalışma zamanı kancası ve plugin-provider kayıt defteri seam'leri |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Genel sağlayıcı HTTP/uç nokta yetenek yardımcıları, sağlayıcı HTTP hataları ve ses transkripsiyonu multipart form yardımcıları |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` ve `WebFetchProviderPlugin` gibi dar web-fetch yapılandırma/seçim sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-fetch` | Web-fetch sağlayıcı kayıt/cache yardımcıları |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin etkinleştirme kablolamasına ihtiyaç duymayan sağlayıcılar için dar web-search yapılandırma/kimlik bilgisi yardımcıları |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` ve kapsamlı kimlik bilgisi ayarlayıcıları/alıcıları gibi dar web-search yapılandırma/kimlik bilgisi sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-search` | Web-search sağlayıcı kayıt/cache/çalışma zamanı yardımcıları |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini şema temizleme + tanılama ve `resolveXaiModelCompatPatch` / `applyXaiModelCompat` gibi xAI uyumluluk yardımcıları |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` ve benzerleri |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri ve paylaşılan Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot sarmalayıcı yardımcıları |
    | `plugin-sdk/provider-transport-runtime` | Korumalı fetch, aktarım ileti dönüşümleri ve yazılabilir aktarım olay akışları gibi yerel sağlayıcı aktarım yardımcıları |
    | `plugin-sdk/provider-onboard` | Katılım yapılandırma yaması yardımcıları |
    | `plugin-sdk/global-singleton` | Sürece yerel singleton/map/cache yardımcıları |
    | `plugin-sdk/group-activation` | Dar grup etkinleştirme modu ve komut ayrıştırma yardımcıları |
  </Accordion>

  <Accordion title="Auth and security subpaths">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, dinamik argüman menüsü biçimlendirmesi dahil komut kayıt defteri yardımcıları, gönderici yetkilendirme yardımcıları |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` ve `buildHelpMessage` gibi komut/yardım iletisi oluşturucuları |
    | `plugin-sdk/approval-auth-runtime` | Onaylayıcı çözümleme ve aynı sohbet action-auth yardımcıları |
    | `plugin-sdk/approval-client-runtime` | Yerel exec onay profili/filtre yardımcıları |
    | `plugin-sdk/approval-delivery-runtime` | Yerel onay yeteneği/teslimat bağdaştırıcıları |
    | `plugin-sdk/approval-gateway-runtime` | Paylaşılan onay Gateway çözümleme yardımcısı |
    | `plugin-sdk/approval-handler-adapter-runtime` | Sıcak kanal giriş noktaları için hafif yerel onay bağdaştırıcısı yükleme yardımcıları |
    | `plugin-sdk/approval-handler-runtime` | Daha geniş onay işleyici çalışma zamanı yardımcıları; yeterli olduklarında daha dar bağdaştırıcı/Gateway seam'lerini tercih edin |
    | `plugin-sdk/approval-native-runtime` | Yerel onay hedefi + hesap bağlama yardımcıları |
    | `plugin-sdk/approval-reply-runtime` | Exec/plugin onay yanıtı payload yardımcıları |
    | `plugin-sdk/approval-runtime` | Exec/plugin onay payload yardımcıları, yerel onay yönlendirme/çalışma zamanı yardımcıları ve `formatApprovalDisplayPath` gibi yapılandırılmış onay gösterimi yardımcıları |
    | `plugin-sdk/reply-dedupe` | Dar gelen yanıt dedupe sıfırlama yardımcıları |
    | `plugin-sdk/channel-contract-testing` | Geniş test barrel'i olmadan dar kanal sözleşmesi test yardımcıları |
    | `plugin-sdk/command-auth-native` | Yerel komut kimlik doğrulaması, dinamik argüman menüsü biçimlendirmesi ve yerel oturum hedefi yardımcıları |
    | `plugin-sdk/command-detection` | Paylaşılan komut algılama yardımcıları |
    | `plugin-sdk/command-primitives-runtime` | Sıcak kanal yolları için hafif komut metni koşul yardımcıları |
    | `plugin-sdk/command-surface` | Komut gövdesi normalleştirme ve komut yüzeyi yardımcıları |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Kanal/plugin gizli bilgi yüzeyleri için dar gizli bilgi sözleşmesi toplama yardımcıları |
    | `plugin-sdk/secret-ref-runtime` | Gizli bilgi sözleşmesi/yapılandırma ayrıştırması için dar `coerceSecretRef` ve SecretRef tipleme yardımcıları |
    | `plugin-sdk/security-runtime` | Paylaşılan güven, DM kapılaması, harici içerik, hassas metin redaksiyonu, sabit zamanlı gizli bilgi karşılaştırması ve gizli bilgi toplama yardımcıları |
    | `plugin-sdk/ssrf-policy` | Host izin listesi ve özel ağ SSRF ilkesi yardımcıları |
    | `plugin-sdk/ssrf-dispatcher` | Geniş altyapı çalışma zamanı yüzeyi olmadan dar sabitlenmiş dağıtıcı yardımcıları |
    | `plugin-sdk/ssrf-runtime` | Sabitlenmiş dağıtıcı, SSRF korumalı fetch, SSRF hatası ve SSRF ilkesi yardımcıları |
    | `plugin-sdk/secret-input` | Gizli bilgi girdisi ayrıştırma yardımcıları |
    | `plugin-sdk/webhook-ingress` | Webhook istek/hedef yardımcıları ve ham websocket/gövde zorlaması |
    | `plugin-sdk/webhook-request-guards` | İstek gövdesi boyutu/zaman aşımı yardımcıları |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Alt yol | Ana dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/runtime` | Geniş runtime/günlükleme/yedekleme/Plugin kurulum yardımcıları |
    | `plugin-sdk/runtime-env` | Dar runtime ortamı, günlükleyici, zaman aşımı, yeniden deneme ve backoff yardımcıları |
    | `plugin-sdk/browser-config` | Normalize edilmiş profil/varsayılanlar, CDP URL ayrıştırma ve tarayıcı denetimi kimlik doğrulama yardımcıları için desteklenen tarayıcı yapılandırma cephesi |
    | `plugin-sdk/channel-runtime-context` | Genel kanal runtime bağlamı kaydı ve arama yardımcıları |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Paylaşılan Plugin komut/hook/http/etkileşimli yardımcıları |
    | `plugin-sdk/hook-runtime` | Paylaşılan Webhook/dahili hook işlem hattı yardımcıları |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod` ve `createLazyRuntimeSurface` gibi tembel runtime içe aktarma/bağlama yardımcıları |
    | `plugin-sdk/process-runtime` | Süreç yürütme yardımcıları |
    | `plugin-sdk/cli-runtime` | CLI biçimlendirme, bekleme, sürüm, bağımsız değişken çağırma ve tembel komut grubu yardımcıları |
    | `plugin-sdk/gateway-runtime` | Gateway istemcisi, olay döngüsü hazır istemci başlatma yardımcısı, Gateway CLI RPC, Gateway protokol hataları ve kanal durumu yama yardımcıları |
    | `plugin-sdk/config-types` | `OpenClawConfig` ve kanal/sağlayıcı yapılandırma türleri gibi Plugin yapılandırma şekilleri için yalnızca tür yapılandırma yüzeyi |
    | `plugin-sdk/plugin-config-runtime` | `requireRuntimeConfig`, `resolvePluginConfigObject` ve `resolveLivePluginConfigObject` gibi runtime Plugin yapılandırması arama yardımcıları |
    | `plugin-sdk/config-mutation` | `mutateConfigFile`, `replaceConfigFile` ve `logConfigUpdated` gibi işlemsel yapılandırma mutasyonu yardımcıları |
    | `plugin-sdk/runtime-config-snapshot` | `getRuntimeConfig`, `getRuntimeConfigSnapshot` ve test anlık görüntü ayarlayıcıları gibi geçerli süreç yapılandırma anlık görüntüsü yardımcıları |
    | `plugin-sdk/telegram-command-config` | Paketlenmiş Telegram sözleşme yüzeyi kullanılamadığında bile Telegram komut adı/açıklaması normalleştirme ve yinelenen/çakışma denetimleri |
    | `plugin-sdk/text-autolink-runtime` | Geniş metin runtime barrel'ı olmadan dosya referansı otomatik bağlantı algılama |
    | `plugin-sdk/approval-runtime` | Yürütme/Plugin onay yardımcıları, onay yeteneği oluşturucuları, kimlik doğrulama/profil yardımcıları, yerel yönlendirme/runtime yardımcıları ve yapılandırılmış onay görüntüleme yolu biçimlendirme |
    | `plugin-sdk/reply-runtime` | Paylaşılan gelen/yanıt runtime yardımcıları, parçalama, dispatch, Heartbeat, yanıt planlayıcı |
    | `plugin-sdk/reply-dispatch-runtime` | Dar yanıt dispatch/sonlandırma ve konuşma etiketi yardımcıları |
    | `plugin-sdk/reply-history` | Paylaşılan kısa pencere yanıt geçmişi yardımcıları ve `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` ve `clearHistoryEntriesIfEnabled` gibi işaretçiler |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Dar metin/Markdown parçalama yardımcıları |
    | `plugin-sdk/session-store-runtime` | Oturum deposu yolu, oturum anahtarı, güncellenme zamanı ve depo mutasyonu yardımcıları |
    | `plugin-sdk/cron-store-runtime` | Cron deposu yol/yükleme/kaydetme yardımcıları |
    | `plugin-sdk/state-paths` | Durum/OAuth dizin yolu yardımcıları |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey` ve `resolveDefaultAgentBoundAccountId` gibi rota/oturum anahtarı/hesap bağlama yardımcıları |
    | `plugin-sdk/status-helpers` | Paylaşılan kanal/hesap durumu özet yardımcıları, runtime durumu varsayılanları ve sorun meta verisi yardımcıları |
    | `plugin-sdk/target-resolver-runtime` | Paylaşılan hedef çözümleyici yardımcıları |
    | `plugin-sdk/string-normalization-runtime` | Slug/dize normalleştirme yardımcıları |
    | `plugin-sdk/request-url` | Fetch/request benzeri girdilerden dize URL'leri çıkarma |
    | `plugin-sdk/run-command` | Normalize edilmiş stdout/stderr sonuçlarıyla zamanlanmış komut çalıştırıcı |
    | `plugin-sdk/param-readers` | Ortak araç/CLI parametre okuyucuları |
    | `plugin-sdk/tool-payload` | Araç sonucu nesnelerinden normalize edilmiş payload'ları çıkarma |
    | `plugin-sdk/tool-send` | Araç argümanlarından kanonik gönderim hedefi alanlarını çıkarma |
    | `plugin-sdk/temp-path` | Paylaşılan geçici indirme yolu yardımcıları |
    | `plugin-sdk/logging-core` | Alt sistem günlükleyici ve redaksiyon yardımcıları |
    | `plugin-sdk/markdown-table-runtime` | Markdown tablo modu ve dönüştürme yardımcıları |
    | `plugin-sdk/model-session-runtime` | `applyModelOverrideToSessionEntry` ve `resolveAgentMaxConcurrent` gibi model/oturum geçersiz kılma yardımcıları |
    | `plugin-sdk/talk-config-runtime` | Talk sağlayıcı yapılandırma çözümleme yardımcıları |
    | `plugin-sdk/json-store` | Küçük JSON durum okuma/yazma yardımcıları |
    | `plugin-sdk/file-lock` | Yeniden girilebilir dosya kilidi yardımcıları |
    | `plugin-sdk/persistent-dedupe` | Disk destekli tekilleştirme önbelleği yardımcıları |
    | `plugin-sdk/acp-runtime` | ACP runtime/oturum ve yanıt dispatch yardımcıları |
    | `plugin-sdk/acp-runtime-backend` | Başlangıçta yüklenen Plugin'ler için hafif ACP arka uç kaydı ve yanıt dispatch yardımcıları |
    | `plugin-sdk/acp-binding-resolve-runtime` | Yaşam döngüsü başlangıç içe aktarımları olmadan salt okunur ACP bağlama çözümlemesi |
    | `plugin-sdk/agent-config-primitives` | Dar ajan runtime yapılandırma şeması temel öğeleri |
    | `plugin-sdk/boolean-param` | Gevşek boolean parametre okuyucu |
    | `plugin-sdk/dangerous-name-runtime` | Tehlikeli ad eşleştirme çözümleme yardımcıları |
    | `plugin-sdk/device-bootstrap` | Cihaz bootstrap ve eşleştirme belirteci yardımcıları |
    | `plugin-sdk/extension-shared` | Paylaşılan pasif kanal, durum ve ortam proxy yardımcı temel öğeleri |
    | `plugin-sdk/models-provider-runtime` | `/models` komut/sağlayıcı yanıt yardımcıları |
    | `plugin-sdk/skill-commands-runtime` | Skill komutu listeleme yardımcıları |
    | `plugin-sdk/native-command-registry` | Yerel komut kayıt defteri/oluşturma/serileştirme yardımcıları |
    | `plugin-sdk/agent-harness` | Düşük seviyeli ajan harness'leri için deneysel güvenilir Plugin yüzeyi: harness türleri, etkin çalıştırma yönlendirme/iptal yardımcıları, OpenClaw araç köprüsü yardımcıları, runtime planı araç ilkesi yardımcıları, terminal sonucu sınıflandırması, araç ilerleme biçimlendirme/ayrıntı yardımcıları ve deneme sonucu yardımcı araçları |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI uç nokta algılama yardımcıları |
    | `plugin-sdk/async-lock-runtime` | Küçük runtime durum dosyaları için süreç yerelinde async kilit yardımcısı |
    | `plugin-sdk/channel-activity-runtime` | Kanal etkinliği telemetri yardımcısı |
    | `plugin-sdk/concurrency-runtime` | Sınırlı async görev eşzamanlılığı yardımcısı |
    | `plugin-sdk/dedupe-runtime` | Bellek içi tekilleştirme önbelleği yardımcıları |
    | `plugin-sdk/delivery-queue-runtime` | Giden bekleyen teslimat boşaltma yardımcısı |
    | `plugin-sdk/file-access-runtime` | Güvenli yerel dosya ve medya kaynağı yolu yardımcıları |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat olayı ve görünürlük yardımcıları |
    | `plugin-sdk/number-runtime` | Sayısal zorlama yardımcısı |
    | `plugin-sdk/secure-random-runtime` | Güvenli belirteç/UUID yardımcıları |
    | `plugin-sdk/system-event-runtime` | Sistem olayı kuyruğu yardımcıları |
    | `plugin-sdk/transport-ready-runtime` | Taşıma hazır olma bekleme yardımcısı |
    | `plugin-sdk/infra-runtime` | Kullanımdan kaldırılmış uyumluluk shim'i; yukarıdaki odaklanmış runtime alt yollarını kullanın |
    | `plugin-sdk/collection-runtime` | Küçük sınırlı önbellek yardımcıları |
    | `plugin-sdk/diagnostic-runtime` | Tanılama bayrağı, olay ve izleme bağlamı yardımcıları |
    | `plugin-sdk/error-runtime` | Hata grafı, biçimlendirme, paylaşılan hata sınıflandırma yardımcıları, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Sarmalanmış fetch, proxy, EnvHttpProxyAgent seçeneği ve sabitlenmiş arama yardımcıları |
    | `plugin-sdk/runtime-fetch` | Proxy/korumalı fetch içe aktarımları olmadan dispatcher farkındalığına sahip runtime fetch |
    | `plugin-sdk/response-limit-runtime` | Geniş medya runtime yüzeyi olmadan sınırlı yanıt gövdesi okuyucu |
    | `plugin-sdk/session-binding-runtime` | Yapılandırılmış bağlama yönlendirmesi veya eşleştirme depoları olmadan geçerli konuşma bağlama durumu |
    | `plugin-sdk/session-store-runtime` | Geniş yapılandırma yazmaları/bakım içe aktarımları olmadan oturum deposu yardımcıları |
    | `plugin-sdk/context-visibility-runtime` | Geniş yapılandırma/güvenlik içe aktarımları olmadan bağlam görünürlüğü çözümleme ve tamamlayıcı bağlam filtreleme |
    | `plugin-sdk/string-coerce-runtime` | Markdown/günlükleme içe aktarımları olmadan dar ilkel kayıt/dize zorlama ve normalleştirme yardımcıları |
    | `plugin-sdk/host-runtime` | Host adı ve SCP host normalleştirme yardımcıları |
    | `plugin-sdk/retry-runtime` | Yeniden deneme yapılandırması ve yeniden deneme çalıştırıcı yardımcıları |
    | `plugin-sdk/agent-runtime` | Ajan dizini/kimlik/çalışma alanı yardımcıları |
    | `plugin-sdk/directory-runtime` | Yapılandırma destekli dizin sorgusu/tekilleştirme |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Yetenek ve test alt yolları">
    | Alt yol | Ana dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Paylaşılan medya getirme/dönüştürme/depolama yardımcıları, ffprobe destekli video boyutu sorgulama ve medya yükü oluşturucuları |
    | `plugin-sdk/media-store` | `saveMediaBuffer` gibi dar kapsamlı medya deposu yardımcıları |
    | `plugin-sdk/media-generation-runtime` | Paylaşılan medya üretimi failover yardımcıları, aday seçimi ve eksik model mesajlaşması |
    | `plugin-sdk/media-understanding` | Medya anlama sağlayıcı türleri ve sağlayıcıya dönük görüntü/ses yardımcı dışa aktarımları |
    | `plugin-sdk/text-runtime` | Asistan tarafından görülebilen metin temizleme, markdown render/parçalama/tablo yardımcıları, redaksiyon yardımcıları, yönerge etiketi yardımcıları ve güvenli metin araçları gibi paylaşılan metin/markdown/günlükleme yardımcıları |
    | `plugin-sdk/text-chunking` | Giden metin parçalama yardımcısı |
    | `plugin-sdk/speech` | Konuşma sağlayıcı türleri ve sağlayıcıya dönük yönerge, kayıt, doğrulama, OpenAI uyumlu TTS oluşturucu ve konuşma yardımcı dışa aktarımları |
    | `plugin-sdk/speech-core` | Paylaşılan konuşma sağlayıcı türleri, kayıt, yönerge, normalleştirme ve konuşma yardımcı dışa aktarımları |
    | `plugin-sdk/realtime-transcription` | Gerçek zamanlı transkripsiyon sağlayıcı türleri, kayıt yardımcıları ve paylaşılan WebSocket oturumu yardımcısı |
    | `plugin-sdk/realtime-voice` | Gerçek zamanlı ses sağlayıcı türleri ve kayıt yardımcıları |
    | `plugin-sdk/image-generation` | Görüntü üretimi sağlayıcı türleri, görüntü varlığı/veri URL'si yardımcıları ve OpenAI uyumlu görüntü sağlayıcı oluşturucu |
    | `plugin-sdk/image-generation-core` | Paylaşılan görüntü üretimi türleri, failover, kimlik doğrulama ve kayıt yardımcıları |
    | `plugin-sdk/music-generation` | Müzik üretimi sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/music-generation-core` | Paylaşılan müzik üretimi türleri, failover yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
    | `plugin-sdk/video-generation` | Video üretimi sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/video-generation-core` | Paylaşılan video üretimi türleri, failover yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
    | `plugin-sdk/webhook-targets` | Webhook hedef kaydı ve rota kurulum yardımcıları |
    | `plugin-sdk/webhook-path` | Webhook yolu normalleştirme yardımcıları |
    | `plugin-sdk/web-media` | Paylaşılan uzak/yerel medya yükleme yardımcıları |
    | `plugin-sdk/zod` | Plugin SDK tüketicileri için yeniden dışa aktarılan `zod` |
    | `plugin-sdk/testing` | Eski Plugin testleri için geniş uyumluluk barrel'i. Yeni uzantı testleri bunun yerine `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` veya `plugin-sdk/test-fixtures` gibi odaklı SDK alt yollarını içe aktarmalıdır |
    | `plugin-sdk/plugin-test-api` | Depo test yardımcısı köprülerini içe aktarmadan doğrudan Plugin kayıt birim testleri için minimal `createTestPluginApi` yardımcısı |
    | `plugin-sdk/agent-runtime-test-contracts` | Kimlik doğrulama, teslim, fallback, araç hook'u, prompt overlay, şema ve transkript projeksiyonu testleri için yerel agent-runtime bağdaştırıcı sözleşmesi fixture'ları |
    | `plugin-sdk/channel-test-helpers` | Genel eylem/kurulum/durum sözleşmeleri, dizin doğrulamaları, hesap başlatma yaşam döngüsü, gönderim yapılandırması iş parçacığı, runtime mock'ları, durum sorunları, giden teslim ve hook kaydı için kanal odaklı test yardımcıları |
    | `plugin-sdk/channel-target-testing` | Kanal testleri için paylaşılan hedef çözümleme hata durumu paketi |
    | `plugin-sdk/plugin-test-contracts` | Plugin paketi, kayıt, herkese açık artefakt, doğrudan içe aktarma, runtime API ve içe aktarma yan etkisi sözleşmesi yardımcıları |
    | `plugin-sdk/provider-test-contracts` | Sağlayıcı runtime, kimlik doğrulama, keşif, onboard, katalog, sihirbaz, medya yeteneği, tekrar oynatma ilkesi, gerçek zamanlı STT canlı ses, web arama/getirme ve stream sözleşmesi yardımcıları |
    | `plugin-sdk/provider-http-test-mocks` | `plugin-sdk/provider-http` kullanan sağlayıcı testleri için isteğe bağlı Vitest HTTP/kimlik doğrulama mock'ları |
    | `plugin-sdk/test-fixtures` | Genel CLI runtime yakalama, sandbox bağlamı, skill yazıcı, agent-message, system-event, modül yeniden yükleme, paketlenmiş Plugin yolu, terminal metni, parçalama, auth-token ve typed-case fixture'ları |
    | `plugin-sdk/test-node-mocks` | Vitest `vi.mock("node:*")` factory'leri içinde kullanım için odaklı Node yerleşik mock yardımcıları |
  </Accordion>

  <Accordion title="Bellek alt yolları">
    | Alt yol | Ana dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/memory-core` | Yönetici/yapılandırma/dosya/CLI yardımcıları için paketlenmiş memory-core yardımcı yüzeyi |
    | `plugin-sdk/memory-core-engine-runtime` | Bellek dizini/arama runtime facade'i |
    | `plugin-sdk/memory-core-host-engine-foundation` | Bellek host foundation motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Bellek host embedding sözleşmeleri, kayıt erişimi, yerel sağlayıcı ve genel toplu/uzak yardımcılar |
    | `plugin-sdk/memory-core-host-engine-qmd` | Bellek host QMD motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-storage` | Bellek host depolama motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-multimodal` | Bellek host çok modlu yardımcıları |
    | `plugin-sdk/memory-core-host-query` | Bellek host sorgu yardımcıları |
    | `plugin-sdk/memory-core-host-secret` | Bellek host gizli bilgi yardımcıları |
    | `plugin-sdk/memory-core-host-events` | Bellek host olay günlüğü yardımcıları |
    | `plugin-sdk/memory-core-host-status` | Bellek host durum yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-cli` | Bellek host CLI runtime yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-core` | Bellek host çekirdek runtime yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-files` | Bellek host dosya/runtime yardımcıları |
    | `plugin-sdk/memory-host-core` | Bellek host çekirdek runtime yardımcıları için satıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-host-events` | Bellek host olay günlüğü yardımcıları için satıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-host-files` | Bellek host dosya/runtime yardımcıları için satıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-host-markdown` | Belleğe yakın Plugin'ler için paylaşılan yönetilen markdown yardımcıları |
    | `plugin-sdk/memory-host-search` | Arama yöneticisi erişimi için active memory runtime facade'i |
    | `plugin-sdk/memory-host-status` | Bellek host durum yardımcıları için satıcıdan bağımsız takma ad |
  </Accordion>

  <Accordion title="Ayrılmış paketlenmiş yardımcı alt yolları">
    Şu anda ayrılmış paketlenmiş yardımcı SDK alt yolu yoktur. Sahibe özgü
    yardımcılar sahip Plugin paketinin içinde bulunurken, yeniden kullanılabilir host sözleşmeleri
    `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` ve
    `plugin-sdk/plugin-config-runtime` gibi genel SDK alt yollarını kullanır.
  </Accordion>
</AccordionGroup>

## İlgili

- [Plugin SDK genel bakışı](/tr/plugins/sdk-overview)
- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)

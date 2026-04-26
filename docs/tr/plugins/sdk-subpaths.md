---
read_when:
    - Bir Plugin içe aktarımı için doğru plugin-sdk alt yolunu seçme
    - Paketlenmiş Plugin alt yollarını ve yardımcı yüzeylerini denetleme
summary: 'Plugin SDK alt yol kataloğu: hangi içe aktarmaların nerede bulunduğu, alana göre gruplandırılmış olarak'
title: Plugin SDK alt yolları
x-i18n:
    generated_at: "2026-04-26T11:37:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcb49ee51301b79985d43470cd8c149c858e79d685908605317de253121d4736
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Plugin SDK, `openclaw/plugin-sdk/` altında dar alt yollar kümesi olarak sunulur.
  Bu sayfa, yaygın kullanılan alt yolları amaca göre gruplandırarak kataloglar. Üretilmiş
  200+ alt yolun tam listesi `scripts/lib/plugin-sdk-entrypoints.json` içinde bulunur;
  ayrılmış paketlenmiş-Plugin yardımcı alt yolları da orada görünür ancak bir belge sayfası bunları açıkça öne çıkarmadıkça
  uygulama ayrıntısıdır.

  Plugin yazma kılavuzu için bkz. [Plugin SDK genel bakış](/tr/plugins/sdk-overview).

  ## Plugin girişi

  | Alt yol                    | Temel dışa aktarımlar                                                                                                                  |
  | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`  | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`          | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema` | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry`| `defineSingleProviderPluginEntry`                                                                                                      |

  <AccordionGroup>
  <Accordion title="Kanal alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Kök `openclaw.json` Zod şema dışa aktarımı (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ayrıca `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Paylaşılan kurulum sihirbazı yardımcıları, izin listesi istemleri, kurulum durumu oluşturucuları |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Çok hesaplı yapılandırma/eylem kapısı yardımcıları, varsayılan hesap yedek yardımcıları |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, hesap kimliği normalleştirme yardımcıları |
    | `plugin-sdk/account-resolution` | Hesap arama + varsayılan yedek yardımcıları |
    | `plugin-sdk/account-helpers` | Dar hesap listesi/hesap eylemi yardımcıları |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Kanal yapılandırma şeması türleri |
    | `plugin-sdk/telegram-command-config` | Paketlenmiş sözleşme yedeğiyle Telegram özel komut normalleştirme/doğrulama yardımcıları |
    | `plugin-sdk/command-gating` | Dar komut yetkilendirme kapısı yardımcıları |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, taslak akışı yaşam döngüsü/sonlandırma yardımcıları |
    | `plugin-sdk/inbound-envelope` | Paylaşılan gelen yönlendirme + zarf oluşturucu yardımcıları |
    | `plugin-sdk/inbound-reply-dispatch` | Paylaşılan gelen kaydetme ve sevk yardımcıları |
    | `plugin-sdk/messaging-targets` | Hedef ayrıştırma/eşleştirme yardımcıları |
    | `plugin-sdk/outbound-media` | Paylaşılan giden medya yükleme yardımcıları |
    | `plugin-sdk/outbound-send-deps` | Kanal bağdaştırıcıları için hafif giden gönderim bağımlılığı araması |
    | `plugin-sdk/outbound-runtime` | Giden teslimat, kimlik, gönderim temsilcisi, oturum, biçimlendirme ve yük planlama yardımcıları |
    | `plugin-sdk/poll-runtime` | Dar anket normalleştirme yardımcıları |
    | `plugin-sdk/thread-bindings-runtime` | İş parçacığı bağlama yaşam döngüsü ve bağdaştırıcı yardımcıları |
    | `plugin-sdk/agent-media-payload` | Eski aracı medya yükü oluşturucu |
    | `plugin-sdk/conversation-runtime` | Sohbet/iş parçacığı bağlama, eşleştirme ve yapılandırılmış bağlama yardımcıları |
    | `plugin-sdk/runtime-config-snapshot` | Çalışma zamanı yapılandırma anlık görüntüsü yardımcısı |
    | `plugin-sdk/runtime-group-policy` | Çalışma zamanı grup ilkesi çözümleme yardımcıları |
    | `plugin-sdk/channel-status` | Paylaşılan kanal durum anlık görüntüsü/özet yardımcıları |
    | `plugin-sdk/channel-config-primitives` | Dar kanal yapılandırma şeması ilkelleri |
    | `plugin-sdk/channel-config-writes` | Kanal yapılandırma yazma yetkilendirme yardımcıları |
    | `plugin-sdk/channel-plugin-common` | Paylaşılan kanal Plugin ön hazırlık dışa aktarımları |
    | `plugin-sdk/allowlist-config-edit` | İzin listesi yapılandırma düzenleme/okuma yardımcıları |
    | `plugin-sdk/group-access` | Paylaşılan grup erişim kararı yardımcıları |
    | `plugin-sdk/direct-dm` | Paylaşılan doğrudan DM kimlik doğrulama/koruma yardımcıları |
    | `plugin-sdk/interactive-runtime` | Anlamsal mesaj sunumu, teslimat ve eski etkileşimli yanıt yardımcıları. Bkz. [Mesaj Sunumu](/tr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Gelen debounce, mention eşleştirme, mention ilkesi yardımcıları ve zarf yardımcıları için uyumluluk barrel'i |
    | `plugin-sdk/channel-inbound-debounce` | Dar gelen debounce yardımcıları |
    | `plugin-sdk/channel-mention-gating` | Daha geniş gelen çalışma zamanı yüzeyi olmadan dar mention ilkesi ve mention metni yardımcıları |
    | `plugin-sdk/channel-envelope` | Dar gelen zarf biçimlendirme yardımcıları |
    | `plugin-sdk/channel-location` | Kanal konum bağlamı ve biçimlendirme yardımcıları |
    | `plugin-sdk/channel-logging` | Gelen düşürmeler ve yazıyor/onay hataları için kanal günlükleme yardımcıları |
    | `plugin-sdk/channel-send-result` | Yanıt sonuç türleri |
    | `plugin-sdk/channel-actions` | Kanal mesaj eylemi yardımcıları, ayrıca Plugin uyumluluğu için korunan kullanımdan kaldırılmış yerel şema yardımcıları |
    | `plugin-sdk/channel-targets` | Hedef ayrıştırma/eşleştirme yardımcıları |
    | `plugin-sdk/channel-contract` | Kanal sözleşme türleri |
    | `plugin-sdk/channel-feedback` | Geri bildirim/tepki bağlantısı |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` ve gizli hedef türleri gibi dar gizli sözleşme yardımcıları |
  </Accordion>

  <Accordion title="Sağlayıcı alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Seçilmiş yerel/kendi kendine barındırılan sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/self-hosted-provider-setup` | OpenAI uyumlu, kendi kendine barındırılan sağlayıcılar için odaklı kurulum yardımcıları |
    | `plugin-sdk/cli-backend` | CLI arka ucu varsayılanları + watchdog sabitleri |
    | `plugin-sdk/provider-auth-runtime` | Sağlayıcı Plugin'leri için çalışma zamanı API anahtarı çözümleme yardımcıları |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` gibi API anahtarı onboarding/profil yazma yardımcıları |
    | `plugin-sdk/provider-auth-result` | Standart OAuth kimlik doğrulama sonucu oluşturucu |
    | `plugin-sdk/provider-auth-login` | Sağlayıcı Plugin'leri için paylaşılan etkileşimli oturum açma yardımcıları |
    | `plugin-sdk/provider-env-vars` | Sağlayıcı kimlik doğrulama ortam değişkeni arama yardımcıları |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan replay ilkesi oluşturucuları, sağlayıcı uç nokta yardımcıları ve `normalizeNativeXaiModelId` gibi model kimliği normalleştirme yardımcıları |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Genel sağlayıcı HTTP/uç nokta yetenek yardımcıları, sağlayıcı HTTP hataları ve ses yazıya dökme multipart form yardımcıları |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` ve `WebFetchProviderPlugin` gibi dar web-fetch yapılandırma/seçim sözleşme yardımcıları |
    | `plugin-sdk/provider-web-fetch` | Web-fetch sağlayıcı kayıt/önbellek yardımcıları |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin etkinleştirme bağlantısına ihtiyaç duymayan sağlayıcılar için dar web arama yapılandırma/kimlik bilgisi yardımcıları |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` ve kapsamlı kimlik bilgisi ayarlayıcıları/alıcıları gibi dar web arama yapılandırma/kimlik bilgisi sözleşme yardımcıları |
    | `plugin-sdk/provider-web-search` | Web arama sağlayıcı kayıt/önbellek/çalışma zamanı yardımcıları |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini şema temizleme + tanılama ve `resolveXaiModelCompatPatch` / `applyXaiModelCompat` gibi xAI uyumluluk yardımcıları |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` ve benzerleri |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri ve paylaşılan Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot sarmalayıcı yardımcıları |
    | `plugin-sdk/provider-transport-runtime` | Korumalı fetch, taşıma mesajı dönüştürmeleri ve yazılabilir taşıma olay akışları gibi yerel sağlayıcı taşıma yardımcıları |
    | `plugin-sdk/provider-onboard` | Onboarding yapılandırma yama yardımcıları |
    | `plugin-sdk/global-singleton` | Süreç yerel singleton/map/önbellek yardımcıları |
    | `plugin-sdk/group-activation` | Dar grup etkinleştirme modu ve komut ayrıştırma yardımcıları |
  </Accordion>

  <Accordion title="Kimlik doğrulama ve güvenlik alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, dinamik bağımsız değişken menüsü biçimlendirmesi dahil komut kayıt yardımcıları, gönderen yetkilendirme yardımcıları |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` ve `buildHelpMessage` gibi komut/yardım mesajı oluşturucuları |
    | `plugin-sdk/approval-auth-runtime` | Onaylayıcı çözümleme ve aynı sohbet eylem-kimlik doğrulama yardımcıları |
    | `plugin-sdk/approval-client-runtime` | Yerel yürütme onay profili/filtre yardımcıları |
    | `plugin-sdk/approval-delivery-runtime` | Yerel onay yeteneği/teslimat bağdaştırıcıları |
    | `plugin-sdk/approval-gateway-runtime` | Paylaşılan onay Gateway çözümleme yardımcısı |
    | `plugin-sdk/approval-handler-adapter-runtime` | Sık kullanılan kanal giriş noktaları için hafif yerel onay bağdaştırıcısı yükleme yardımcıları |
    | `plugin-sdk/approval-handler-runtime` | Daha geniş onay işleyici çalışma zamanı yardımcıları; daha dar bağdaştırıcı/Gateway sınırları yeterliyse onları tercih edin |
    | `plugin-sdk/approval-native-runtime` | Yerel onay hedefi + hesap bağlama yardımcıları |
    | `plugin-sdk/approval-reply-runtime` | Yürütme/Plugin onay yanıt yükü yardımcıları |
    | `plugin-sdk/approval-runtime` | Yürütme/Plugin onay yükü yardımcıları, yerel onay yönlendirme/çalışma zamanı yardımcıları ve `formatApprovalDisplayPath` gibi yapılandırılmış onay gösterim yardımcıları |
    | `plugin-sdk/reply-dedupe` | Dar gelen yanıt yineleme kaldırma sıfırlama yardımcıları |
    | `plugin-sdk/channel-contract-testing` | Geniş test barrel'i olmadan dar kanal sözleşmesi test yardımcıları |
    | `plugin-sdk/command-auth-native` | Yerel komut kimlik doğrulaması, dinamik bağımsız değişken menüsü biçimlendirmesi ve yerel oturum-hedef yardımcıları |
    | `plugin-sdk/command-detection` | Paylaşılan komut algılama yardımcıları |
    | `plugin-sdk/command-primitives-runtime` | Sık kullanılan kanal yolları için hafif komut metni yüklem yardımcıları |
    | `plugin-sdk/command-surface` | Komut gövdesi normalleştirme ve komut yüzeyi yardımcıları |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Kanal/Plugin gizli yüzeyleri için dar gizli sözleşme toplama yardımcıları |
    | `plugin-sdk/secret-ref-runtime` | Gizli sözleşme/yapılandırma ayrıştırması için dar `coerceSecretRef` ve SecretRef türleme yardımcıları |
    | `plugin-sdk/security-runtime` | Paylaşılan güven, DM kapılama, harici içerik ve gizli toplama yardımcıları |
    | `plugin-sdk/ssrf-policy` | Ana makine izin listesi ve özel ağ SSRF ilkesi yardımcıları |
    | `plugin-sdk/ssrf-dispatcher` | Geniş altyapı çalışma zamanı yüzeyi olmadan dar sabitlenmiş dağıtıcı yardımcıları |
    | `plugin-sdk/ssrf-runtime` | Sabitlenmiş dağıtıcı, SSRF korumalı fetch ve SSRF ilkesi yardımcıları |
    | `plugin-sdk/secret-input` | Gizli girdi ayrıştırma yardımcıları |
    | `plugin-sdk/webhook-ingress` | Webhook istek/hedef yardımcıları |
    | `plugin-sdk/webhook-request-guards` | İstek gövdesi boyutu/zaman aşımı yardımcıları |
  </Accordion>

  <Accordion title="Çalışma zamanı ve depolama alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/runtime` | Geniş çalışma zamanı/günlükleme/yedekleme/Plugin kurulum yardımcıları |
    | `plugin-sdk/runtime-env` | Dar çalışma zamanı ortamı, günlükleyici, zaman aşımı, yeniden deneme ve geri çekilme yardımcıları |
    | `plugin-sdk/channel-runtime-context` | Genel kanal çalışma zamanı bağlamı kaydetme ve arama yardımcıları |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Paylaşılan Plugin komutu/kanca/http/etkileşimli yardımcılar |
    | `plugin-sdk/hook-runtime` | Paylaşılan Webhook/dahili kanca işlem hattı yardımcıları |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod` ve `createLazyRuntimeSurface` gibi tembel çalışma zamanı içe aktarma/bağlama yardımcıları |
    | `plugin-sdk/process-runtime` | Süreç yürütme yardımcıları |
    | `plugin-sdk/cli-runtime` | CLI biçimlendirme, bekleme, sürüm, bağımsız değişken çağırma ve tembel komut grubu yardımcıları |
    | `plugin-sdk/gateway-runtime` | Gateway istemcisi ve kanal durumu yama yardımcıları |
    | `plugin-sdk/config-runtime` | Yapılandırma yükleme/yazma yardımcıları ve Plugin yapılandırması arama yardımcıları |
    | `plugin-sdk/telegram-command-config` | Paketlenmiş Telegram sözleşme yüzeyi kullanılamadığında bile Telegram komut adı/açıklama normalleştirme ve yineleme/çakışma denetimleri |
    | `plugin-sdk/text-autolink-runtime` | Geniş text-runtime barrel'i olmadan dosya başvurusu otomatik bağlantı algılama |
    | `plugin-sdk/approval-runtime` | Yürütme/Plugin onay yardımcıları, onay yeteneği oluşturucuları, kimlik doğrulama/profil yardımcıları, yerel yönlendirme/çalışma zamanı yardımcıları ve yapılandırılmış onay gösterim yolu biçimlendirmesi |
    | `plugin-sdk/reply-runtime` | Paylaşılan gelen/yanıt çalışma zamanı yardımcıları, parçalara ayırma, sevk, Heartbeat, yanıt planlayıcısı |
    | `plugin-sdk/reply-dispatch-runtime` | Dar yanıt sevk/sonlandırma ve sohbet etiketi yardımcıları |
    | `plugin-sdk/reply-history` | `buildHistoryContext`, `recordPendingHistoryEntry` ve `clearHistoryEntriesIfEnabled` gibi paylaşılan kısa pencere yanıt geçmişi yardımcıları |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Dar metin/Markdown parçalama yardımcıları |
    | `plugin-sdk/session-store-runtime` | Oturum deposu yolu + updated-at yardımcıları |
    | `plugin-sdk/state-paths` | Durum/OAuth dizin yolu yardımcıları |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey` ve `resolveDefaultAgentBoundAccountId` gibi yönlendirme/oturum anahtarı/hesap bağlama yardımcıları |
    | `plugin-sdk/status-helpers` | Paylaşılan kanal/hesap durumu özeti yardımcıları, çalışma zamanı durum varsayılanları ve sorun meta verisi yardımcıları |
    | `plugin-sdk/target-resolver-runtime` | Paylaşılan hedef çözümleyici yardımcıları |
    | `plugin-sdk/string-normalization-runtime` | Slug/dize normalleştirme yardımcıları |
    | `plugin-sdk/request-url` | Fetch/istek benzeri girdilerden dize URL'leri çıkarın |
    | `plugin-sdk/run-command` | Normalize edilmiş stdout/stderr sonuçlarıyla zamanlanmış komut çalıştırıcı |
    | `plugin-sdk/param-readers` | Yaygın araç/CLI parametre okuyucuları |
    | `plugin-sdk/tool-payload` | Araç sonuç nesnelerinden normalize edilmiş yükleri çıkarın |
    | `plugin-sdk/tool-send` | Araç bağımsız değişkenlerinden kanonik gönderim hedef alanlarını çıkarın |
    | `plugin-sdk/temp-path` | Paylaşılan geçici indirme yolu yardımcıları |
    | `plugin-sdk/logging-core` | Alt sistem günlükleyicisi ve sansürleme yardımcıları |
    | `plugin-sdk/markdown-table-runtime` | Markdown tablo modu ve dönüştürme yardımcıları |
    | `plugin-sdk/json-store` | Küçük JSON durum okuma/yazma yardımcıları |
    | `plugin-sdk/file-lock` | Yeniden girişli dosya kilidi yardımcıları |
    | `plugin-sdk/persistent-dedupe` | Disk destekli yineleme kaldırma önbelleği yardımcıları |
    | `plugin-sdk/acp-runtime` | ACP çalışma zamanı/oturum ve yanıt sevk yardımcıları |
    | `plugin-sdk/acp-binding-resolve-runtime` | Yaşam döngüsü başlatma içe aktarımları olmadan salt okunur ACP bağlama çözümleme |
    | `plugin-sdk/agent-config-primitives` | Dar aracı çalışma zamanı yapılandırma şeması ilkelleri |
    | `plugin-sdk/boolean-param` | Gevşek boolean parametre okuyucusu |
    | `plugin-sdk/dangerous-name-runtime` | Tehlikeli ad eşleştirme çözümleme yardımcıları |
    | `plugin-sdk/device-bootstrap` | Cihaz önyükleme ve eşleştirme belirteci yardımcıları |
    | `plugin-sdk/extension-shared` | Paylaşılan edilgen kanal, durum ve ortam proxy yardımcı ilkelleri |
    | `plugin-sdk/models-provider-runtime` | `/models` komutu/sağlayıcı yanıt yardımcıları |
    | `plugin-sdk/skill-commands-runtime` | Skills komut listeleme yardımcıları |
    | `plugin-sdk/native-command-registry` | Yerel komut kaydı/oluşturma/serileştirme yardımcıları |
    | `plugin-sdk/agent-harness` | Düşük düzey aracı harness'leri için deneysel güvenilir-Plugin yüzeyi: harness türleri, etkin çalıştırma yönlendirme/iptal yardımcıları, OpenClaw araç köprüsü yardımcıları, çalışma zamanı planı araç ilkesi yardımcıları, terminal sonuç sınıflandırması, araç ilerleme biçimlendirme/ayrıntı yardımcıları ve deneme sonuç yardımcıları |
    | `plugin-sdk/provider-zai-endpoint` | Z.A.I uç nokta algılama yardımcıları |
    | `plugin-sdk/infra-runtime` | Sistem olayı/Heartbeat yardımcıları |
    | `plugin-sdk/collection-runtime` | Küçük sınırlı önbellek yardımcıları |
    | `plugin-sdk/diagnostic-runtime` | Tanılama bayrağı ve olay yardımcıları |
    | `plugin-sdk/error-runtime` | Hata grafiği, biçimlendirme, paylaşılan hata sınıflandırma yardımcıları, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Sarmalanmış fetch, proxy ve sabitlenmiş arama yardımcıları |
    | `plugin-sdk/runtime-fetch` | Proxy/korumalı-fetch içe aktarımları olmadan dağıtıcı farkındalıklı çalışma zamanı fetch |
    | `plugin-sdk/response-limit-runtime` | Geniş medya çalışma zamanı yüzeyi olmadan sınırlı yanıt gövdesi okuyucu |
    | `plugin-sdk/session-binding-runtime` | Yapılandırılmış bağlama yönlendirmesi veya eşleştirme depoları olmadan geçerli sohbet bağlama durumu |
    | `plugin-sdk/session-store-runtime` | Geniş yapılandırma yazma/bakım içe aktarımları olmadan oturum deposu okuma yardımcıları |
    | `plugin-sdk/context-visibility-runtime` | Geniş yapılandırma/güvenlik içe aktarımları olmadan bağlam görünürlüğü çözümleme ve ek bağlam filtreleme |
    | `plugin-sdk/string-coerce-runtime` | Markdown/günlükleme içe aktarımları olmadan dar ilkel kayıt/dize zorlama ve normalleştirme yardımcıları |
    | `plugin-sdk/host-runtime` | Ana makine adı ve SCP ana makine normalleştirme yardımcıları |
    | `plugin-sdk/retry-runtime` | Yeniden deneme yapılandırması ve yeniden deneme çalıştırıcısı yardımcıları |
    | `plugin-sdk/agent-runtime` | Aracı dizini/kimliği/çalışma alanı yardımcıları |
    | `plugin-sdk/directory-runtime` | Yapılandırma destekli dizin sorgulama/yineleme kaldırma |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Yetenek ve test alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Paylaşılan medya fetch/dönüştürme/depolama yardımcıları ve medya yükü oluşturucuları |
    | `plugin-sdk/media-store` | `saveMediaBuffer` gibi dar medya deposu yardımcıları |
    | `plugin-sdk/media-generation-runtime` | Paylaşılan medya üretimi failover yardımcıları, aday seçimi ve eksik model mesajları |
    | `plugin-sdk/media-understanding` | Medya anlama sağlayıcı türleri ve sağlayıcıya dönük görüntü/ses yardımcı dışa aktarımları |
    | `plugin-sdk/text-runtime` | Yardımcıya görünür metin ayıklama, Markdown işleme/parçalama/tablo yardımcıları, sansürleme yardımcıları, yönerge etiketi yardımcıları ve güvenli metin yardımcıları gibi paylaşılan metin/Markdown/günlükleme yardımcıları |
    | `plugin-sdk/text-chunking` | Giden metin parçalama yardımcısı |
    | `plugin-sdk/speech` | Konuşma sağlayıcı türleri ve sağlayıcıya dönük yönerge, kayıt, doğrulama ve konuşma yardımcı dışa aktarımları |
    | `plugin-sdk/speech-core` | Paylaşılan konuşma sağlayıcı türleri, kayıt, yönerge, normalleştirme ve konuşma yardımcı dışa aktarımları |
    | `plugin-sdk/realtime-transcription` | Gerçek zamanlı yazıya dökme sağlayıcı türleri, kayıt yardımcıları ve paylaşılan WebSocket oturum yardımcısı |
    | `plugin-sdk/realtime-voice` | Gerçek zamanlı ses sağlayıcı türleri ve kayıt yardımcıları |
    | `plugin-sdk/image-generation` | Görüntü üretimi sağlayıcı türleri |
    | `plugin-sdk/image-generation-core` | Paylaşılan görüntü üretimi türleri, failover, kimlik doğrulama ve kayıt yardımcıları |
    | `plugin-sdk/music-generation` | Müzik üretimi sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/music-generation-core` | Paylaşılan müzik üretimi türleri, failover yardımcıları, sağlayıcı araması ve model-ref ayrıştırması |
    | `plugin-sdk/video-generation` | Video üretimi sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/video-generation-core` | Paylaşılan video üretimi türleri, failover yardımcıları, sağlayıcı araması ve model-ref ayrıştırması |
    | `plugin-sdk/webhook-targets` | Webhook hedef kaydı ve rota kurulum yardımcıları |
    | `plugin-sdk/webhook-path` | Webhook yolu normalleştirme yardımcıları |
    | `plugin-sdk/web-media` | Paylaşılan uzak/yerel medya yükleme yardımcıları |
    | `plugin-sdk/zod` | Plugin SDK tüketicileri için yeniden dışa aktarılan `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Active Memory alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/memory-core` | Yönetici/yapılandırma/dosya/CLI yardımcıları için paketlenmiş memory-core yardımcı yüzeyi |
    | `plugin-sdk/memory-core-engine-runtime` | Active Memory dizinleme/arama çalışma zamanı cephesi |
    | `plugin-sdk/memory-core-host-engine-foundation` | Active Memory ana makine temel motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Active Memory ana makine gömme sözleşmeleri, kayıt erişimi, yerel sağlayıcı ve genel toplu/uzak yardımcılar |
    | `plugin-sdk/memory-core-host-engine-qmd` | Active Memory ana makine QMD motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-storage` | Active Memory ana makine depolama motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-multimodal` | Active Memory ana makine çok kipli yardımcıları |
    | `plugin-sdk/memory-core-host-query` | Active Memory ana makine sorgu yardımcıları |
    | `plugin-sdk/memory-core-host-secret` | Active Memory ana makine gizli yardımcıları |
    | `plugin-sdk/memory-core-host-events` | Active Memory ana makine olay günlüğü yardımcıları |
    | `plugin-sdk/memory-core-host-status` | Active Memory ana makine durum yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-cli` | Active Memory ana makine CLI çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-core` | Active Memory ana makine çekirdek çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-files` | Active Memory ana makine dosya/çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-host-core` | Active Memory ana makine çekirdek çalışma zamanı yardımcıları için üreticiden bağımsız takma ad |
    | `plugin-sdk/memory-host-events` | Active Memory ana makine olay günlüğü yardımcıları için üreticiden bağımsız takma ad |
    | `plugin-sdk/memory-host-files` | Active Memory ana makine dosya/çalışma zamanı yardımcıları için üreticiden bağımsız takma ad |
    | `plugin-sdk/memory-host-markdown` | Active Memory ile ilişkili Plugin'ler için paylaşılan yönetilen Markdown yardımcıları |
    | `plugin-sdk/memory-host-search` | Arama yöneticisi erişimi için Active Memory çalışma zamanı cephesi |
    | `plugin-sdk/memory-host-status` | Active Memory ana makine durum yardımcıları için üreticiden bağımsız takma ad |
    | `plugin-sdk/memory-lancedb` | Paketlenmiş memory-lancedb yardımcı yüzeyi |
  </Accordion>

  <Accordion title="Ayrılmış paketlenmiş yardımcı alt yolları">
    | Aile | Geçerli alt yollar | Amaçlanan kullanım |
    | --- | --- | --- |
    | Tarayıcı | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Paketlenmiş tarayıcı Plugin destek yardımcıları. `browser-profiles`, normalize edilmiş `browser.tabCleanup` biçimi için `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` ve `ResolvedBrowserTabCleanupConfig` dışa aktarır. `browser-support`, uyumluluk barrel'i olarak kalır. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Paketlenmiş Matrix yardımcısı/çalışma zamanı yüzeyi |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Paketlenmiş LINE yardımcısı/çalışma zamanı yüzeyi |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Paketlenmiş IRC yardımcı yüzeyi |
    | Kanala özgü yardımcılar | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Paketlenmiş kanal uyumluluğu/yardımcı sınırları |
    | Kimlik doğrulama/Plugin'e özgü yardımcılar | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Paketlenmiş özellik/Plugin yardımcı sınırları; `plugin-sdk/github-copilot-token` şu anda `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` ve `resolveCopilotApiToken` dışa aktarır |
  </Accordion>
</AccordionGroup>

## İlgili

- [Plugin SDK genel bakış](/tr/plugins/sdk-overview)
- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)

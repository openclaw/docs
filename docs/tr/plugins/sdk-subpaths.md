---
read_when:
    - Bir Plugin içe aktarımı için doğru plugin-sdk alt yolunu seçme
    - Paketle gelen Plugin alt yollarını ve yardımcı yüzeyleri denetleme
summary: 'Plugin SDK alt yol kataloğu: hangi içe aktarmaların nerede yer aldığı, alana göre gruplandırılmış'
title: Plugin SDK alt yolları
x-i18n:
    generated_at: "2026-05-06T09:25:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 98b16cd3fcd6babc64df20ad4e679c35553fc21894617f30907bbf0e579a4d89
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK, `openclaw/plugin-sdk/` altında dar kapsamlı alt yollar kümesi olarak sunulur.
Bu sayfa, yaygın kullanılan alt yolları amaca göre gruplanmış şekilde kataloglar. Oluşturulan
200'den fazla alt yolun tam listesi `scripts/lib/plugin-sdk-entrypoints.json` içinde bulunur;
ayrılmış, pakete dahil plugin yardımcı alt yolları burada görünür ancak bir belge sayfası bunları açıkça öne çıkarmadıkça uygulama
ayrıntısıdır. Bakımcılar, etkin ayrılmış yardımcı alt yollarını `pnpm plugins:boundary-report:summary` ile denetleyebilir; kullanılmayan
ayrılmış yardımcı dışa aktarımları, genel SDK içinde atıl uyumluluk borcu olarak kalmak yerine CI raporunda başarısız olur.

Plugin yazma kılavuzu için bkz. [Plugin SDK genel bakışı](/tr/plugins/sdk-overview).

## Plugin girişi

| Alt yol                                   | Temel dışa aktarımlar                                                                                                                                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
| `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
| `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
| `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
| `plugin-sdk/testing`                      | Eski plugin testleri için geniş uyumluluk barrel'ı; yeni extension testleri için odaklı test alt yollarını tercih edin                                                                     |
| `plugin-sdk/plugin-test-api`              | Doğrudan plugin kaydı birim testleri için en küçük `OpenClawPluginApi` mock oluşturucu                                                                                           |
| `plugin-sdk/agent-runtime-test-contracts` | Kimlik doğrulama profilleri, teslimat bastırma, yedek sınıflandırma, araç hook'ları, istem katmanları, şemalar ve transcript onarımı için yerel agent-runtime bağdaştırıcı sözleşme fikstürleri |
| `plugin-sdk/channel-test-helpers`         | Kanal hesabı yaşam döngüsü, dizin, gönderme yapılandırması, çalışma zamanı mock'u, hook, pakete dahil kanal girişi, zarf zaman damgası, eşleme yanıtı ve genel kanal sözleşmesi test yardımcıları   |
| `plugin-sdk/channel-target-testing`       | Paylaşılan kanal hedef çözümleme hata durumu test paketi                                                                                                                       |
| `plugin-sdk/plugin-test-contracts`        | Plugin kaydı, paket manifest'i, genel artifact, çalışma zamanı API'si, içe aktarma yan etkisi ve doğrudan içe aktarma sözleşmesi yardımcıları                                                  |
| `plugin-sdk/plugin-test-runtime`          | Testler için plugin çalışma zamanı, registry, provider kaydı, kurulum sihirbazı ve çalışma zamanı görev akışı fikstürleri                                                                      |
| `plugin-sdk/provider-test-contracts`      | Provider çalışma zamanı, kimlik doğrulama, keşif, onboarding, katalog, medya yeteneği, yeniden oynatma politikası, gerçek zamanlı STT canlı ses, web arama/getirme ve sihirbaz sözleşmesi yardımcıları                 |
| `plugin-sdk/provider-http-test-mocks`     | `plugin-sdk/provider-http` çalıştıran provider testleri için isteğe bağlı Vitest HTTP/kimlik doğrulama mock'ları                                                                                    |
| `plugin-sdk/test-env`                     | Test ortamı, fetch/ağ, tek kullanımlık HTTP sunucusu, gelen istek, canlı test, geçici dosya sistemi ve zaman denetimi fikstürleri                                        |
| `plugin-sdk/test-fixtures`                | Genel CLI, sandbox, skill, agent-message, system-event, modül yeniden yükleme, pakete dahil plugin yolu, terminal, parçalama, auth-token ve typed-case test fikstürleri                   |
| `plugin-sdk/test-node-mocks`              | Vitest `vi.mock("node:*")` factory'leri içinde kullanım için odaklı Node yerleşik mock yardımcıları                                                                                        |
| `plugin-sdk/migration`                    | `createMigrationItem` gibi taşıma provider öğesi yardımcıları, neden sabitleri, öğe durum işaretleyicileri, redaksiyon yardımcıları ve `summarizeMigrationItems`                       |
| `plugin-sdk/migration-runtime`            | `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` ve `writeMigrationReport` gibi çalışma zamanı taşıma yardımcıları                                                    |

  <AccordionGroup>
  <Accordion title="Kanal alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Kök `openclaw.json` Zod şeması dışa aktarımı (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ayrıca `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Paylaşılan kurulum sihirbazı yardımcıları, izin listesi istemleri, kurulum durumu oluşturucuları |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Çok hesaplı yapılandırma/eylem geçidi yardımcıları, varsayılan hesap yedek yardımcıları |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, hesap kimliği normalleştirme yardımcıları |
    | `plugin-sdk/account-resolution` | Hesap arama + varsayılan-yedek yardımcıları |
    | `plugin-sdk/account-helpers` | Dar kapsamlı hesap listesi/hesap eylemi yardımcıları |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Eski yanıt işlem hattı yardımcıları. Yeni kanal yanıt işlem hattı kodu, `plugin-sdk/channel-message` içinden `createChannelMessageReplyPipeline` ve `resolveChannelMessageSourceReplyDeliveryMode` kullanmalıdır. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Paylaşılan kanal yapılandırma şeması ilkel öğeleri ile Zod ve doğrudan JSON/TypeBox oluşturucuları |
    | `plugin-sdk/bundled-channel-config-schema` | Yalnızca bakımı yapılan paketli pluginler için paketli OpenClaw kanal yapılandırma şemaları |
    | `plugin-sdk/channel-config-schema-legacy` | Paketli kanal yapılandırma şemaları için kullanım dışı uyumluluk takma adı |
    | `plugin-sdk/telegram-command-config` | Paketli sözleşme yedeğiyle Telegram özel komut normalleştirme/doğrulama yardımcıları |
    | `plugin-sdk/command-gating` | Dar kapsamlı komut yetkilendirme geçidi yardımcıları |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue` ve eski taslak akış yaşam döngüsü yardımcıları. Yeni önizleme sonlandırma kodu `plugin-sdk/channel-message` kullanmalıdır. |
    | `plugin-sdk/channel-message` | `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode` gibi düşük maliyetli ileti yaşam döngüsü sözleşme yardımcıları, uyumluluk cepheleri, kalıcı-final yetenek türetimi, gönderme/alındı/yan etki yetenekleri için yetenek kanıt yardımcıları, `MessageReceiveContext`, alım onayı ilkesi kanıtları, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, canlı önizleme ve canlı sonlandırıcı yetenek kanıtları, kalıcı kurtarma durumu, `RenderedMessageBatch`, ileti alındı türleri ve alındı kimliği yardımcıları. Bkz. [Kanal ileti API'si](/tr/plugins/sdk-channel-message). Eski `createChannelTurnReplyPipeline` yalnızca uyumluluk dağıtıcıları için kalır. |
    | `plugin-sdk/channel-message-runtime` | `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch`, `withDurableMessageSendContext`, `dispatchChannelMessageReplyWithBase` ve `recordChannelMessageReplyDispatch` dahil olmak üzere, giden teslimatı yükleyebilen çalışma zamanı teslimat yardımcıları. Sıcak plugin önyükleme dosyalarından değil, izleme/gönderme çalışma zamanı modüllerinden kullanın. |
    | `plugin-sdk/inbound-envelope` | Paylaşılan gelen rota + zarf oluşturucu yardımcıları |
    | `plugin-sdk/inbound-reply-dispatch` | Eski paylaşılan gelen kayıt-ve-dağıtım yardımcıları, görünür/final dağıtım öngörüleri ve hazırlanmış kanal dağıtıcıları için kullanım dışı `deliverDurableInboundReplyPayload` uyumluluğu. Yeni kanal alma/dağıtım kodu, çalışma zamanı yaşam döngüsü yardımcılarını `plugin-sdk/channel-message-runtime` içinden içe aktarmalıdır. |
    | `plugin-sdk/messaging-targets` | Hedef ayrıştırma/eşleştirme yardımcıları |
    | `plugin-sdk/outbound-media` | Paylaşılan giden medya yükleme yardımcıları |
    | `plugin-sdk/outbound-send-deps` | Kanal bağdaştırıcıları için hafif giden gönderim bağımlılığı araması |
    | `plugin-sdk/outbound-runtime` | Giden teslimat, kimlik, gönderme temsilcisi, oturum, biçimlendirme ve yük planlama yardımcıları |
    | `plugin-sdk/poll-runtime` | Dar kapsamlı anket normalleştirme yardımcıları |
    | `plugin-sdk/thread-bindings-runtime` | Konu bağlama yaşam döngüsü ve bağdaştırıcı yardımcıları |
    | `plugin-sdk/agent-media-payload` | Eski aracı medya yükü oluşturucu |
    | `plugin-sdk/conversation-runtime` | Konuşma/konu bağlama, eşleştirme ve yapılandırılmış bağlama yardımcıları |
    | `plugin-sdk/runtime-config-snapshot` | Çalışma zamanı yapılandırma anlık görüntüsü yardımcısı |
    | `plugin-sdk/runtime-group-policy` | Çalışma zamanı grup ilkesi çözümleme yardımcıları |
    | `plugin-sdk/channel-status` | Paylaşılan kanal durumu anlık görüntüsü/özeti yardımcıları |
    | `plugin-sdk/channel-config-primitives` | Dar kapsamlı kanal yapılandırma şeması ilkel öğeleri |
    | `plugin-sdk/channel-config-writes` | Kanal yapılandırma yazma yetkilendirme yardımcıları |
    | `plugin-sdk/channel-plugin-common` | Paylaşılan kanal plugin başlangıç dışa aktarımları |
    | `plugin-sdk/allowlist-config-edit` | İzin listesi yapılandırma düzenleme/okuma yardımcıları |
    | `plugin-sdk/group-access` | Paylaşılan grup erişimi karar yardımcıları |
    | `plugin-sdk/direct-dm` | Paylaşılan doğrudan-DM kimlik doğrulama/koruma yardımcıları |
    | `plugin-sdk/discord` | Yayınlanmış `@openclaw/discord@2026.3.13` ve izlenen sahip uyumluluğu için kullanım dışı Discord uyumluluk cephesi; yeni pluginler genel kanal SDK alt yollarını kullanmalıdır |
    | `plugin-sdk/telegram-account` | İzlenen sahip uyumluluğu için kullanım dışı Telegram hesap çözümleme uyumluluk cephesi; yeni pluginler enjekte edilmiş çalışma zamanı yardımcılarını veya genel kanal SDK alt yollarını kullanmalıdır |
    | `plugin-sdk/zalouser` | Gönderen komut yetkilendirmesini hâlâ içe aktaran yayınlanmış Lark/Zalo paketleri için kullanım dışı Zalo Personal uyumluluk cephesi; yeni pluginler `plugin-sdk/command-auth` kullanmalıdır |
    | `plugin-sdk/interactive-runtime` | Anlamsal ileti sunumu, teslimatı ve eski etkileşimli yanıt yardımcıları. Bkz. [İleti Sunumu](/tr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Gelen debounce, bahsetme eşleştirme, bahsetme ilkesi yardımcıları ve zarf yardımcıları için uyumluluk barrel'ı |
    | `plugin-sdk/channel-inbound-debounce` | Dar kapsamlı gelen debounce yardımcıları |
    | `plugin-sdk/channel-mention-gating` | Daha geniş gelen çalışma zamanı yüzeyi olmadan dar kapsamlı bahsetme ilkesi, bahsetme işaretçisi ve bahsetme metni yardımcıları |
    | `plugin-sdk/channel-envelope` | Dar kapsamlı gelen zarf biçimlendirme yardımcıları |
    | `plugin-sdk/channel-location` | Kanal konum bağlamı ve biçimlendirme yardımcıları |
    | `plugin-sdk/channel-logging` | Gelen bırakmalar ve yazma/onay hataları için kanal günlükleme yardımcıları |
    | `plugin-sdk/channel-send-result` | Yanıt sonucu türleri |
    | `plugin-sdk/channel-actions` | Kanal ileti eylemi yardımcıları, ayrıca plugin uyumluluğu için tutulan kullanım dışı yerel şema yardımcıları |
    | `plugin-sdk/channel-route` | Paylaşılan rota normalleştirme, ayrıştırıcı güdümlü hedef çözümleme, konu kimliği dizgeleştirme, yinelenenleri kaldırma/kompakt rota anahtarları, ayrıştırılmış hedef türleri ve rota/hedef karşılaştırma yardımcıları |
    | `plugin-sdk/channel-targets` | Hedef ayrıştırma yardımcıları; rota karşılaştırması çağıranlar `plugin-sdk/channel-route` kullanmalıdır |
    | `plugin-sdk/channel-contract` | Kanal sözleşmesi türleri |
    | `plugin-sdk/channel-feedback` | Geri bildirim/tepki kablolaması |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` ve gizli hedef türleri gibi dar kapsamlı gizli sözleşme yardımcıları |
  </Accordion>

  <Accordion title="Sağlayıcı alt yolları">
    | Alt yol | Başlıca dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Kurulum, katalog keşfi ve çalışma zamanında model hazırlığı için desteklenen LM Studio sağlayıcı cephesi |
    | `plugin-sdk/lmstudio-runtime` | Yerel sunucu varsayılanları, model keşfi, istek üst bilgileri ve yüklü model yardımcıları için desteklenen LM Studio çalışma zamanı cephesi |
    | `plugin-sdk/provider-setup` | Seçilmiş yerel/kendi barındırılan sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/self-hosted-provider-setup` | Odaklı OpenAI uyumlu kendi barındırılan sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/cli-backend` | CLI arka uç varsayılanları + watchdog sabitleri |
    | `plugin-sdk/provider-auth-runtime` | Sağlayıcı Plugin'leri için çalışma zamanı API anahtarı çözümleme yardımcıları |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` gibi API anahtarı ilk katılım/profil yazma yardımcıları |
    | `plugin-sdk/provider-auth-result` | Standart OAuth kimlik doğrulama sonucu oluşturucusu |
    | `plugin-sdk/provider-auth-login` | Sağlayıcı Plugin'leri için paylaşılan etkileşimli oturum açma yardımcıları |
    | `plugin-sdk/provider-env-vars` | Sağlayıcı kimlik doğrulama ortam değişkeni arama yardımcıları |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, kullanımdan kaldırılmış `resolveOpenClawAgentDir` uyumluluk dışa aktarımı |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan yeniden oynatma ilkesi oluşturucuları, sağlayıcı uç noktası yardımcıları ve `normalizeNativeXaiModelId` gibi model kimliği normalleştirme yardımcıları |
    | `plugin-sdk/provider-catalog-runtime` | Sözleşme testleri için sağlayıcı katalog genişletme çalışma zamanı kancası ve Plugin-sağlayıcı kayıt dikişleri |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Genel sağlayıcı HTTP/uç nokta yetenek yardımcıları, sağlayıcı HTTP hataları ve ses yazıya dökme multipart form yardımcıları |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` ve `WebFetchProviderPlugin` gibi dar web-fetch yapılandırma/seçim sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-fetch` | Web-fetch sağlayıcı kayıt/önbellek yardımcıları |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin etkinleştirme bağlantısına ihtiyaç duymayan sağlayıcılar için dar web-search yapılandırma/kimlik bilgisi yardımcıları |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` ve kapsamlı kimlik bilgisi ayarlayıcıları/alıcıları gibi dar web-search yapılandırma/kimlik bilgisi sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-search` | Web-search sağlayıcı kayıt/önbellek/çalışma zamanı yardımcıları |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini şema temizleme + tanılamalar ve `resolveXaiModelCompatPatch` / `applyXaiModelCompat` gibi xAI uyumluluk yardımcıları |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` ve benzerleri |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri ve paylaşılan Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot sarmalayıcı yardımcıları |
    | `plugin-sdk/provider-transport-runtime` | Korumalı fetch, taşıma iletisi dönüşümleri ve yazılabilir taşıma olay akışları gibi yerel sağlayıcı taşıma yardımcıları |
    | `plugin-sdk/provider-onboard` | İlk katılım yapılandırma yaması yardımcıları |
    | `plugin-sdk/global-singleton` | Sürece yerel singleton/harita/önbellek yardımcıları |
    | `plugin-sdk/group-activation` | Dar grup etkinleştirme modu ve komut ayrıştırma yardımcıları |
  </Accordion>

  <Accordion title="Kimlik doğrulama ve güvenlik alt yolları">
    | Alt yol | Başlıca dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, dinamik argüman menüsü biçimlendirmesi dahil komut kayıt yardımcıları, gönderen yetkilendirme yardımcıları |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` ve `buildHelpMessage` gibi komut/yardım iletisi oluşturucuları |
    | `plugin-sdk/approval-auth-runtime` | Onaylayan çözümleme ve aynı sohbet eylem kimlik doğrulama yardımcıları |
    | `plugin-sdk/approval-client-runtime` | Yerel exec onay profili/filtre yardımcıları |
    | `plugin-sdk/approval-delivery-runtime` | Yerel onay yeteneği/teslim adaptörleri |
    | `plugin-sdk/approval-gateway-runtime` | Paylaşılan onay Gateway çözümleme yardımcısı |
    | `plugin-sdk/approval-handler-adapter-runtime` | Sıcak kanal giriş noktaları için hafif yerel onay adaptörü yükleme yardımcıları |
    | `plugin-sdk/approval-handler-runtime` | Daha geniş onay işleyici çalışma zamanı yardımcıları; yeterli olduklarında daha dar adaptör/Gateway dikişlerini tercih edin |
    | `plugin-sdk/approval-native-runtime` | Yerel onay hedefi + hesap bağlama yardımcıları |
    | `plugin-sdk/approval-reply-runtime` | Exec/Plugin onay yanıtı yük yardımcıları |
    | `plugin-sdk/approval-runtime` | Exec/Plugin onay yük yardımcıları, yerel onay yönlendirme/çalışma zamanı yardımcıları ve `formatApprovalDisplayPath` gibi yapılandırılmış onay görüntüleme yardımcıları |
    | `plugin-sdk/reply-dedupe` | Dar gelen yanıt yinelenenleri ayıklama sıfırlama yardımcıları |
    | `plugin-sdk/channel-contract-testing` | Geniş test barrel'i olmadan dar kanal sözleşmesi test yardımcıları |
    | `plugin-sdk/command-auth-native` | Yerel komut kimlik doğrulaması, dinamik argüman menüsü biçimlendirmesi ve yerel oturum hedefi yardımcıları |
    | `plugin-sdk/command-detection` | Paylaşılan komut algılama yardımcıları |
    | `plugin-sdk/command-primitives-runtime` | Sıcak kanal yolları için hafif komut metni koşulları |
    | `plugin-sdk/command-surface` | Komut gövdesi normalleştirme ve komut yüzeyi yardımcıları |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Kanal/Plugin gizli bilgi yüzeyleri için dar gizli bilgi sözleşmesi toplama yardımcıları |
    | `plugin-sdk/secret-ref-runtime` | Gizli bilgi sözleşmesi/yapılandırma ayrıştırması için dar `coerceSecretRef` ve SecretRef tipleme yardımcıları |
    | `plugin-sdk/security-runtime` | Güven, DM geçitleme, yalnızca oluşturma yazmaları dahil kökle sınırlı dosya/yol yardımcıları, eşzamanlı/eşzamansız atomik dosya değiştirme, kardeş geçici yazmalar, cihazlar arası taşıma geri dönüşü, özel dosya deposu yardımcıları, sembolik bağlantı üst dizin korumaları, dış içerik, hassas metin redaksiyonu, sabit zamanlı gizli bilgi karşılaştırması ve gizli bilgi toplama yardımcıları |
    | `plugin-sdk/ssrf-policy` | Ana makine izin listesi ve özel ağ SSRF ilkesi yardımcıları |
    | `plugin-sdk/ssrf-dispatcher` | Geniş altyapı çalışma zamanı yüzeyi olmadan dar sabitlenmiş dispatcher yardımcıları |
    | `plugin-sdk/ssrf-runtime` | Sabitlenmiş dispatcher, SSRF korumalı fetch, SSRF hatası ve SSRF ilkesi yardımcıları |
    | `plugin-sdk/secret-input` | Gizli bilgi girişi ayrıştırma yardımcıları |
    | `plugin-sdk/webhook-ingress` | Webhook istek/hedef yardımcıları ve ham websocket/gövde zorlaması |
    | `plugin-sdk/webhook-request-guards` | İstek gövdesi boyutu/zaman aşımı yardımcıları |
  </Accordion>

  <Accordion title="Çalışma zamanı ve depolama alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/runtime` | Geniş kapsamlı çalışma zamanı/günlükleme/yedekleme/Plugin yükleme yardımcıları |
    | `plugin-sdk/runtime-env` | Dar kapsamlı çalışma zamanı ortamı, günlükleyici, zaman aşımı, yeniden deneme ve geri çekilme yardımcıları |
    | `plugin-sdk/browser-config` | Normalleştirilmiş profil/varsayılanlar, CDP URL ayrıştırma ve tarayıcı denetimi kimlik doğrulama yardımcıları için desteklenen tarayıcı yapılandırması cephesi |
    | `plugin-sdk/channel-runtime-context` | Genel kanal çalışma zamanı bağlamı kaydı ve arama yardımcıları |
    | `plugin-sdk/matrix` | Eski üçüncü taraf kanal paketleri için kullanımdan kaldırılmış Matrix uyumluluk cephesi; yeni Plugin'ler doğrudan `plugin-sdk/run-command` içe aktarmalıdır |
    | `plugin-sdk/mattermost` | Eski üçüncü taraf kanal paketleri için kullanımdan kaldırılmış Mattermost uyumluluk cephesi; yeni Plugin'ler genel SDK alt yollarını doğrudan içe aktarmalıdır |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Paylaşılan Plugin komut/hook/http/etkileşimli yardımcıları |
    | `plugin-sdk/hook-runtime` | Paylaşılan Webhook/dahili hook işlem hattı yardımcıları |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod` ve `createLazyRuntimeSurface` gibi tembel çalışma zamanı içe aktarma/bağlama yardımcıları |
    | `plugin-sdk/process-runtime` | Süreç yürütme yardımcıları |
    | `plugin-sdk/cli-runtime` | CLI biçimlendirme, bekleme, sürüm, argümanla çağırma ve tembel komut grubu yardımcıları |
    | `plugin-sdk/gateway-runtime` | Gateway istemcisi, olay döngüsü hazır istemci başlatma yardımcısı, Gateway CLI RPC, Gateway protokol hataları ve kanal durumu yama yardımcıları |
    | `plugin-sdk/config-types` | `OpenClawConfig` ve kanal/sağlayıcı yapılandırma türleri gibi Plugin yapılandırma şekilleri için yalnızca tür yapılandırma yüzeyi |
    | `plugin-sdk/plugin-config-runtime` | `requireRuntimeConfig`, `resolvePluginConfigObject` ve `resolveLivePluginConfigObject` gibi çalışma zamanı Plugin yapılandırması arama yardımcıları |
    | `plugin-sdk/config-mutation` | `mutateConfigFile`, `replaceConfigFile` ve `logConfigUpdated` gibi işlemsel yapılandırma mutasyonu yardımcıları |
    | `plugin-sdk/runtime-config-snapshot` | `getRuntimeConfig`, `getRuntimeConfigSnapshot` ve test anlık görüntüsü ayarlayıcıları gibi geçerli süreç yapılandırması anlık görüntü yardımcıları |
    | `plugin-sdk/telegram-command-config` | Paketlenmiş Telegram sözleşme yüzeyi kullanılamadığında bile Telegram komut adı/açıklama normalleştirme ve yineleme/çakışma denetimleri |
    | `plugin-sdk/text-autolink-runtime` | Geniş metin çalışma zamanı barrel'ı olmadan dosya referansı otomatik bağlantı algılama |
    | `plugin-sdk/approval-runtime` | Yürütme/Plugin onay yardımcıları, onay yeteneği oluşturucuları, kimlik doğrulama/profil yardımcıları, yerel yönlendirme/çalışma zamanı yardımcıları ve yapılandırılmış onay görüntüleme yolu biçimlendirme |
    | `plugin-sdk/reply-runtime` | Paylaşılan gelen/yanıt çalışma zamanı yardımcıları, parçalama, dağıtım, Heartbeat, yanıt planlayıcı |
    | `plugin-sdk/reply-dispatch-runtime` | Dar kapsamlı yanıt dağıtımı/sonlandırma ve konuşma etiketi yardımcıları |
    | `plugin-sdk/reply-history` | Paylaşılan kısa pencereli yanıt geçmişi yardımcıları ve `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` ve `clearHistoryEntriesIfEnabled` gibi işaretçiler |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Dar kapsamlı metin/markdown parçalama yardımcıları |
    | `plugin-sdk/session-store-runtime` | Oturum deposu yolu, oturum anahtarı, güncellenme zamanı ve depo mutasyonu yardımcıları |
    | `plugin-sdk/cron-store-runtime` | Cron deposu yol/yükleme/kaydetme yardımcıları |
    | `plugin-sdk/state-paths` | Durum/OAuth dizin yolu yardımcıları |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey` ve `resolveDefaultAgentBoundAccountId` gibi rota/oturum anahtarı/hesap bağlama yardımcıları |
    | `plugin-sdk/status-helpers` | Paylaşılan kanal/hesap durumu özet yardımcıları, çalışma zamanı durumu varsayılanları ve sorun meta veri yardımcıları |
    | `plugin-sdk/target-resolver-runtime` | Paylaşılan hedef çözümleyici yardımcıları |
    | `plugin-sdk/string-normalization-runtime` | Slug/dize normalleştirme yardımcıları |
    | `plugin-sdk/request-url` | Fetch/istek benzeri girdilerden dize URL'leri çıkarma |
    | `plugin-sdk/run-command` | Normalleştirilmiş stdout/stderr sonuçlarıyla zamanlanmış komut çalıştırıcı |
    | `plugin-sdk/param-readers` | Ortak araç/CLI parametre okuyucuları |
    | `plugin-sdk/tool-payload` | Araç sonuç nesnelerinden normalleştirilmiş yükleri çıkarma |
    | `plugin-sdk/tool-send` | Araç argümanlarından standart gönderim hedefi alanlarını çıkarma |
    | `plugin-sdk/temp-path` | Paylaşılan geçici indirme yolu yardımcıları ve özel güvenli geçici çalışma alanları |
    | `plugin-sdk/logging-core` | Alt sistem günlükleyici ve redaksiyon yardımcıları |
    | `plugin-sdk/markdown-table-runtime` | Markdown tablo modu ve dönüştürme yardımcıları |
    | `plugin-sdk/model-session-runtime` | `applyModelOverrideToSessionEntry` ve `resolveAgentMaxConcurrent` gibi model/oturum geçersiz kılma yardımcıları |
    | `plugin-sdk/talk-config-runtime` | Konuşma sağlayıcı yapılandırması çözümleme yardımcıları |
    | `plugin-sdk/json-store` | Küçük JSON durum okuma/yazma yardımcıları |
    | `plugin-sdk/file-lock` | Yeniden girilebilir dosya kilidi yardımcıları |
    | `plugin-sdk/persistent-dedupe` | Disk destekli yineleme önleme önbelleği yardımcıları |
    | `plugin-sdk/acp-runtime` | ACP çalışma zamanı/oturum ve yanıt dağıtımı yardımcıları |
    | `plugin-sdk/acp-runtime-backend` | Başlangıçta yüklenen Plugin'ler için hafif ACP arka uç kaydı ve yanıt dağıtımı yardımcıları |
    | `plugin-sdk/acp-binding-resolve-runtime` | Yaşam döngüsü başlangıç içe aktarmaları olmadan salt okunur ACP bağlama çözümleme |
    | `plugin-sdk/agent-config-primitives` | Dar kapsamlı ajan çalışma zamanı yapılandırma şeması ilkel öğeleri |
    | `plugin-sdk/boolean-param` | Esnek boole parametresi okuyucu |
    | `plugin-sdk/dangerous-name-runtime` | Tehlikeli ad eşleştirme çözümleme yardımcıları |
    | `plugin-sdk/device-bootstrap` | Cihaz önyükleme ve eşleştirme belirteci yardımcıları |
    | `plugin-sdk/extension-shared` | Paylaşılan pasif kanal, durum ve ortam proxy yardımcı ilkel öğeleri |
    | `plugin-sdk/models-provider-runtime` | `/models` komut/sağlayıcı yanıt yardımcıları |
    | `plugin-sdk/skill-commands-runtime` | Skills komut listeleme yardımcıları |
    | `plugin-sdk/native-command-registry` | Yerel komut kayıt defteri/oluşturma/serileştirme yardımcıları |
    | `plugin-sdk/agent-harness` | Düşük seviyeli ajan harness'ları için deneysel güvenilir Plugin yüzeyi: harness türleri, aktif çalıştırma yönlendirme/iptal yardımcıları, OpenClaw araç köprüsü yardımcıları, çalışma zamanı planı araç ilkesi yardımcıları, terminal sonucu sınıflandırma, araç ilerlemesi biçimlendirme/ayrıntı yardımcıları ve deneme sonucu yardımcı araçları |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI uç nokta algılama yardımcıları |
    | `plugin-sdk/async-lock-runtime` | Küçük çalışma zamanı durum dosyaları için süreç yerelinde async kilit yardımcısı |
    | `plugin-sdk/channel-activity-runtime` | Kanal etkinliği telemetri yardımcısı |
    | `plugin-sdk/concurrency-runtime` | Sınırlı async görev eşzamanlılığı yardımcısı |
    | `plugin-sdk/dedupe-runtime` | Bellek içi yineleme önleme önbelleği yardımcıları |
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
    | `plugin-sdk/fetch-runtime` | Sarmalanmış fetch, proxy, EnvHttpProxyAgent seçeneği ve sabitlenmiş arama yardımcıları |
    | `plugin-sdk/runtime-fetch` | Proxy/korumalı fetch içe aktarmaları olmadan dispatcher duyarlı çalışma zamanı fetch'i |
    | `plugin-sdk/response-limit-runtime` | Geniş medya çalışma zamanı yüzeyi olmadan sınırlı yanıt gövdesi okuyucu |
    | `plugin-sdk/session-binding-runtime` | Yapılandırılmış bağlama yönlendirmesi veya eşleştirme depoları olmadan geçerli konuşma bağlama durumu |
    | `plugin-sdk/session-store-runtime` | Geniş yapılandırma yazmaları/bakım içe aktarmaları olmadan oturum deposu yardımcıları |
    | `plugin-sdk/context-visibility-runtime` | Geniş yapılandırma/güvenlik içe aktarmaları olmadan bağlam görünürlüğü çözümleme ve ek bağlam filtreleme |
    | `plugin-sdk/string-coerce-runtime` | Markdown/günlükleme içe aktarmaları olmadan dar kapsamlı ilkel kayıt/dize zorlama ve normalleştirme yardımcıları |
    | `plugin-sdk/host-runtime` | Ana makine adı ve SCP ana makinesi normalleştirme yardımcıları |
    | `plugin-sdk/retry-runtime` | Yeniden deneme yapılandırması ve yeniden deneme çalıştırıcı yardımcıları |
    | `plugin-sdk/agent-runtime` | `resolveAgentDir`, `resolveDefaultAgentDir` ve kullanımdan kaldırılmış `resolveOpenClawAgentDir` uyumluluk dışa aktarımı dahil ajan dizini/kimlik/çalışma alanı yardımcıları |
    | `plugin-sdk/directory-runtime` | Yapılandırma destekli dizin sorgusu/yineleme önleme |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Yetenek ve test alt yolları">
    | Alt yol | Başlıca dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Paylaşılan medya getirme/dönüştürme/depolama yardımcıları, ffprobe destekli video boyutu yoklaması ve medya yükü oluşturucuları |
    | `plugin-sdk/media-store` | `saveMediaBuffer` gibi dar kapsamlı medya deposu yardımcıları |
    | `plugin-sdk/media-generation-runtime` | Paylaşılan medya üretimi yük devretme yardımcıları, aday seçimi ve eksik model mesajlaşması |
    | `plugin-sdk/media-understanding` | Medya anlama sağlayıcı türleri ve sağlayıcıya yönelik görüntü/ses yardımcı dışa aktarımları |
    | `plugin-sdk/text-runtime` | Asistanın görebildiği metni kaldırma, markdown işleme/parçalama/tablo yardımcıları, maskeleme yardımcıları, yönerge etiketi yardımcıları ve güvenli metin yardımcı araçları gibi paylaşılan metin/markdown/günlükleme yardımcıları |
    | `plugin-sdk/text-chunking` | Giden metin parçalama yardımcısı |
    | `plugin-sdk/speech` | Konuşma sağlayıcı türleri ve sağlayıcıya yönelik yönerge, kayıt defteri, doğrulama, OpenAI uyumlu TTS oluşturucu ve konuşma yardımcı dışa aktarımları |
    | `plugin-sdk/speech-core` | Paylaşılan konuşma sağlayıcı türleri, kayıt defteri, yönerge, normalleştirme ve konuşma yardımcı dışa aktarımları |
    | `plugin-sdk/realtime-transcription` | Gerçek zamanlı transkripsiyon sağlayıcı türleri, kayıt defteri yardımcıları ve paylaşılan WebSocket oturumu yardımcısı |
    | `plugin-sdk/realtime-voice` | Gerçek zamanlı ses sağlayıcı türleri ve kayıt defteri yardımcıları |
    | `plugin-sdk/image-generation` | Görüntü üretimi sağlayıcı türleri, görüntü varlığı/veri URL'si yardımcıları ve OpenAI uyumlu görüntü sağlayıcısı oluşturucusu |
    | `plugin-sdk/image-generation-core` | Paylaşılan görüntü üretimi türleri, yük devretme, kimlik doğrulama ve kayıt defteri yardımcıları |
    | `plugin-sdk/music-generation` | Müzik üretimi sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/music-generation-core` | Paylaşılan müzik üretimi türleri, yük devretme yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
    | `plugin-sdk/video-generation` | Video üretimi sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/video-generation-core` | Paylaşılan video üretimi türleri, yük devretme yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
    | `plugin-sdk/webhook-targets` | Webhook hedef kayıt defteri ve rota yükleme yardımcıları |
    | `plugin-sdk/webhook-path` | Webhook yolu normalleştirme yardımcıları |
    | `plugin-sdk/web-media` | Paylaşılan uzak/yerel medya yükleme yardımcıları |
    | `plugin-sdk/zod` | Plugin SDK tüketicileri için yeniden dışa aktarılan `zod` |
    | `plugin-sdk/testing` | Eski Plugin testleri için geniş uyumluluk barrel'ı. Yeni uzantı testleri bunun yerine `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` veya `plugin-sdk/test-fixtures` gibi odaklanmış SDK alt yollarını içe aktarmalıdır |
    | `plugin-sdk/plugin-test-api` | Depo test yardımcı köprülerini içe aktarmadan doğrudan Plugin kaydı birim testleri için minimal `createTestPluginApi` yardımcısı |
    | `plugin-sdk/agent-runtime-test-contracts` | Kimlik doğrulama, teslimat, geri dönüş, tool-hook, prompt-overlay, şema ve transkript projeksiyonu testleri için yerel agent-runtime bağdaştırıcı sözleşmesi fikstürleri |
    | `plugin-sdk/channel-test-helpers` | Genel eylemler/kurulum/durum sözleşmeleri, dizin doğrulamaları, hesap başlatma yaşam döngüsü, send-config iş parçacığı, çalışma zamanı taklitleri, durum sorunları, giden teslimat ve kanca kaydı için kanal odaklı test yardımcıları |
    | `plugin-sdk/channel-target-testing` | Kanal testleri için paylaşılan hedef çözümleme hata durumu paketi |
    | `plugin-sdk/plugin-test-contracts` | Plugin paketi, kayıt, genel artefakt, doğrudan içe aktarma, çalışma zamanı API'si ve içe aktarma yan etkisi sözleşme yardımcıları |
    | `plugin-sdk/provider-test-contracts` | Sağlayıcı çalışma zamanı, kimlik doğrulama, keşif, ilk kurulum, katalog, sihirbaz, medya yeteneği, yeniden oynatma ilkesi, gerçek zamanlı STT canlı ses, web arama/getirme ve akış sözleşme yardımcıları |
    | `plugin-sdk/provider-http-test-mocks` | `plugin-sdk/provider-http` kullanımı yapan sağlayıcı testleri için isteğe bağlı Vitest HTTP/kimlik doğrulama taklitleri |
    | `plugin-sdk/test-fixtures` | Genel CLI çalışma zamanı yakalama, sandbox bağlamı, Skills yazıcısı, agent-message, system-event, modül yeniden yükleme, paketlenmiş Plugin yolu, terminal-text, parçalama, auth-token ve typed-case fikstürleri |
    | `plugin-sdk/test-node-mocks` | Vitest `vi.mock("node:*")` fabrikaları içinde kullanılacak odaklanmış Node yerleşik taklit yardımcıları |
  </Accordion>

  <Accordion title="Bellek alt yolları">
    | Alt yol | Başlıca dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/memory-core` | Yönetici/yapılandırma/dosya/CLI yardımcıları için paketlenmiş memory-core yardımcı yüzeyi |
    | `plugin-sdk/memory-core-engine-runtime` | Bellek dizini/arama çalışma zamanı cephesi |
    | `plugin-sdk/memory-core-host-engine-foundation` | Bellek ana bilgisayarı temel motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Bellek ana bilgisayarı gömme sözleşmeleri, kayıt defteri erişimi, yerel sağlayıcı ve genel toplu/uzak yardımcılar |
    | `plugin-sdk/memory-core-host-engine-qmd` | Bellek ana bilgisayarı QMD motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-storage` | Bellek ana bilgisayarı depolama motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-multimodal` | Bellek ana bilgisayarı çok modlu yardımcıları |
    | `plugin-sdk/memory-core-host-query` | Bellek ana bilgisayarı sorgu yardımcıları |
    | `plugin-sdk/memory-core-host-secret` | Bellek ana bilgisayarı gizli bilgi yardımcıları |
    | `plugin-sdk/memory-core-host-events` | Bellek ana bilgisayarı olay günlüğü yardımcıları |
    | `plugin-sdk/memory-core-host-status` | Bellek ana bilgisayarı durum yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-cli` | Bellek ana bilgisayarı CLI çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-core` | Bellek ana bilgisayarı çekirdek çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-files` | Bellek ana bilgisayarı dosya/çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-host-core` | Bellek ana bilgisayarı çekirdek çalışma zamanı yardımcıları için satıcıdan bağımsız diğer ad |
    | `plugin-sdk/memory-host-events` | Bellek ana bilgisayarı olay günlüğü yardımcıları için satıcıdan bağımsız diğer ad |
    | `plugin-sdk/memory-host-files` | Bellek ana bilgisayarı dosya/çalışma zamanı yardımcıları için satıcıdan bağımsız diğer ad |
    | `plugin-sdk/memory-host-markdown` | Belleğe yakın Plugin'ler için paylaşılan yönetilen markdown yardımcıları |
    | `plugin-sdk/memory-host-search` | search-manager erişimi için Active Memory çalışma zamanı cephesi |
    | `plugin-sdk/memory-host-status` | Bellek ana bilgisayarı durum yardımcıları için satıcıdan bağımsız diğer ad |
  </Accordion>

  <Accordion title="Ayrılmış paketlenmiş yardımcı alt yolları">
    Şu anda ayrılmış paketlenmiş yardımcı SDK alt yolu yok. Sahibe özgü
    yardımcılar sahip Plugin paketinin içinde bulunurken, yeniden kullanılabilir ana bilgisayar sözleşmeleri
    `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` ve `plugin-sdk/plugin-config-runtime` gibi genel SDK alt yollarını kullanır.
  </Accordion>
</AccordionGroup>

## İlgili

- [Plugin SDK genel bakışı](/tr/plugins/sdk-overview)
- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)

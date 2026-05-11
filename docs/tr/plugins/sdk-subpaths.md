---
read_when:
    - Bir Plugin içe aktarması için doğru plugin-sdk alt yolunu seçme
    - Paketli Plugin alt yollarını ve yardımcı yüzeyleri denetleme
summary: 'Plugin SDK alt yol kataloğu: hangi içe aktarımların nerede bulunduğu, alana göre gruplandırılmış'
title: Plugin SDK alt yolları
x-i18n:
    generated_at: "2026-05-11T20:34:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2ef3c37e00ca59a567e55b3b47962803e43514d6791d8fda75c7bfeffb1e142
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK, `openclaw/plugin-sdk/` altında dar kapsamlı herkese açık alt yollar kümesi olarak sunulur. Bu sayfa, yaygın kullanılan alt yolları amaca göre gruplandırarak kataloglar. Üretilen derleyici giriş noktası envanteri `scripts/lib/plugin-sdk-entrypoints.json` içinde bulunur; paket dışa aktarımları, `scripts/lib/plugin-sdk-private-local-only-subpaths.json` içinde listelenen repo yerel test/dahili alt yolları çıkarıldıktan sonraki herkese açık alt kümedir. Bakımcılar, herkese açık dışa aktarım sayısını `pnpm plugin-sdk:surface` ile, etkin ayrılmış yardımcı alt yolları ise `pnpm plugins:boundary-report:summary` ile denetleyebilir; kullanılmayan ayrılmış yardımcı dışa aktarımları, hareketsiz uyumluluk borcu olarak herkese açık SDK içinde kalmak yerine CI raporunu başarısız kılar.

Plugin yazarlığı kılavuzu için bkz. [Plugin SDK genel bakışı](/tr/plugins/sdk-overview).

## Plugin girişi

| Alt yol                        | Temel dışa aktarımlar                                                                                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | `createMigrationItem` gibi migration provider öğesi yardımcıları, neden sabitleri, öğe durumu işaretleyicileri, redaksiyon yardımcıları ve `summarizeMigrationItems`   |
| `plugin-sdk/migration-runtime` | `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` ve `writeMigrationReport` gibi çalışma zamanı migration yardımcıları                                      |

### Kullanımı sonlandırılmış uyumluluk ve test yardımcıları

Bu alt yollar, eski Plugin’ler ve OpenClaw test paketleri için paket dışa aktarımları olarak kalır, ancak yeni kod bunlardan import eklememelidir: `agent-runtime-test-contracts`, `channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`, `plugin-test-api`, `plugin-test-contracts`, `provider-http-test-mocks`, `provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`, `testing`, `channel-runtime`, `compat`, `config-types`, `infra-runtime`, `text-runtime` ve `zod`. Yeni Plugin kodunda `zod` öğesini doğrudan `zod` içinden import edin. `plugin-test-runtime` hâlâ etkin, odaklı bir test yardımcısı alt yoludur.

### Kullanımı sonlandırılmış kullanılmayan herkese açık alt yollar

Bu herkese açık alt yollar en az bir aydır vardı ve şu anda paketle gelen uzantılarda üretim importları yok. Uyumluluk için import edilebilir kalırlar, ancak yeni Plugin kodu bunun yerine odaklı, etkin olarak kullanılan SDK alt yollarını kullanmalıdır: `agent-config-primitives`, `channel-config-schema-legacy`, `channel-reply-pipeline`, `channel-runtime`, `channel-secret-runtime`, `command-auth`, `compat`, `config-runtime`, `config-schema`, `discord`, `group-access`, `infra-runtime`, `matrix`, `mattermost`, `media-generation-runtime-shared`, `memory-core-engine-runtime`, `memory-core-host-multimodal`, `memory-core-host-query`, `music-generation-core`, `self-hosted-provider-setup`, `telegram-account`, `telegram-command-config` ve `zalouser`.

### Kullanımı sonlandırılmış nadir herkese açık alt yollar

Şu anda yalnızca bir veya iki paketle gelen Plugin sahibi tarafından kullanılan herkese açık alt yollar da yeni Plugin kodu için kullanımı sonlandırılmıştır. Uyumluluk için paket dışa aktarımları olarak kalırlar, ancak yeni kod etkin olarak paylaşılan SDK bağlantı noktalarını veya Plugin’in sahip olduğu paket API’lerini tercih etmelidir. Bakımcılar tam kümeyi `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` içinde, mevcut bütçeyi ise `pnpm plugin-sdk:surface` ile izler.

### Kullanımı sonlandırılmış geniş barrel’lar

Bu geniş yeniden dışa aktarma barrel’ları OpenClaw kaynağı ve uyumluluk kontrolleri için derlenebilir kalır, ancak yeni kod odaklı SDK alt yollarını tercih etmelidir: `agent-runtime`, `channel-lifecycle`, `channel-runtime`, `cli-runtime`, `compat`, `config-types`, `conversation-runtime`, `hook-runtime`, `infra-runtime`, `media-runtime`, `plugin-runtime`, `security-runtime` ve `text-runtime`. `channel-runtime`, `compat`, `config-types`, `infra-runtime` ve `text-runtime` yalnızca geriye dönük uyumluluk için paket dışa aktarımları olarak kalır; bunun yerine odaklı kanal/çalışma zamanı alt yollarını, `config-contracts`, `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` ve `logging-core` kullanın.

  <AccordionGroup>
  <Accordion title="Kanal alt yolları">
    | Alt yol | Anahtar dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Kök `openclaw.json` Zod şeması dışa aktarımı (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Plugin’e ait şemalar için önbelleğe alınmış JSON Schema doğrulama yardımcısı |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`; ayrıca `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Paylaşılan kurulum sihirbazı yardımcıları, izin listesi istemleri, kurulum durumu oluşturucuları |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Kullanımdan kaldırılmış uyumluluk takma adı; `plugin-sdk/setup-runtime` kullanın |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Çok hesaplı yapılandırma/eylem kapısı yardımcıları, varsayılan hesap geri dönüş yardımcıları |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, hesap kimliği normalleştirme yardımcıları |
    | `plugin-sdk/account-resolution` | Hesap arama + varsayılan geri dönüş yardımcıları |
    | `plugin-sdk/account-helpers` | Dar kapsamlı hesap listesi/hesap eylemi yardımcıları |
    | `plugin-sdk/access-groups` | Erişim grubu izin listesi ayrıştırma ve redakte edilmiş grup tanılama yardımcıları |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Eski yanıt işlem hattı yardımcıları. Yeni kanal yanıt işlem hattı kodu, `plugin-sdk/channel-message` içinden `createChannelMessageReplyPipeline` ve `resolveChannelMessageSourceReplyDeliveryMode` kullanmalıdır. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Paylaşılan kanal yapılandırma şeması ilkel öğeleri ile Zod ve doğrudan JSON/TypeBox oluşturucuları |
    | `plugin-sdk/bundled-channel-config-schema` | Yalnızca bakımı sürdürülen paketli pluginler için paketli OpenClaw kanal yapılandırma şemaları |
    | `plugin-sdk/channel-config-schema-legacy` | Paketli kanal yapılandırma şemaları için kullanımdan kaldırılmış uyumluluk takma adı |
    | `plugin-sdk/telegram-command-config` | Paketli sözleşme geri dönüşüyle Telegram özel komut normalleştirme/doğrulama yardımcıları |
    | `plugin-sdk/command-gating` | Dar kapsamlı komut yetkilendirme kapısı yardımcıları |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Kullanımdan kaldırılmış düşük düzey kanal giriş uyumluluk cephesi. Yeni alma yolları `plugin-sdk/channel-ingress-runtime` kullanmalıdır. |
    | `plugin-sdk/channel-ingress-runtime` | Taşınmış kanal alma yolları için deneysel üst düzey kanal giriş çalışma zamanı çözümleyicisi ve rota olgu oluşturucuları. Etkili izin listelerini, komut izin listelerini ve eski projeksiyonları her pluginde birleştirmek yerine bunu tercih edin. Bkz. [Kanal giriş API’si](/tr/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue` ve eski taslak akışı yaşam döngüsü yardımcıları. Yeni önizleme sonlandırma kodu `plugin-sdk/channel-message` kullanmalıdır. |
    | `plugin-sdk/channel-message` | `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createChannelMessageReplyPipeline`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, dayanıklı son yetenek türetimi, gönderme/alındı/yan etki yetenekleri için yetenek kanıtı yardımcıları, `MessageReceiveContext`, alma onayı ilkesi kanıtları, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, canlı önizleme ve canlı sonlandırıcı yetenek kanıtları, dayanıklı kurtarma durumu, `RenderedMessageBatch`, mesaj alındı türleri ve alındı kimliği yardımcıları gibi ucuz mesaj yaşam döngüsü sözleşme yardımcıları. Bkz. [Kanal mesaj API’si](/tr/plugins/sdk-channel-message). Eski yanıt dağıtım cepheleri yalnızca kullanımdan kaldırılmış uyumluluk içindir. |
    | `plugin-sdk/channel-message-runtime` | `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch` ve `withDurableMessageSendContext` dahil olmak üzere giden teslimatı yükleyebilen çalışma zamanı teslimat yardımcıları. Kullanımdan kaldırılmış yanıt dağıtım köprüleri yalnızca uyumluluk dağıtıcıları için içe aktarılabilir kalır. Sıcak plugin önyükleme dosyalarından değil, izleme/gönderme çalışma zamanı modüllerinden kullanın. |
    | `plugin-sdk/inbound-envelope` | Paylaşılan gelen rota + zarf oluşturucu yardımcıları |
    | `plugin-sdk/inbound-reply-dispatch` | Eski paylaşılan gelen kayıt ve dağıtım yardımcıları, görünür/son dağıtım kestirimleri ve hazırlanmış kanal dağıtıcıları için kullanımdan kaldırılmış `deliverDurableInboundReplyPayload` uyumluluğu. Yeni kanal alma/dağıtım kodu çalışma zamanı yaşam döngüsü yardımcılarını `plugin-sdk/channel-message-runtime` içinden içe aktarmalıdır. |
    | `plugin-sdk/messaging-targets` | Hedef ayrıştırma/eşleştirme yardımcıları |
    | `plugin-sdk/outbound-media` | Paylaşılan giden medya yükleme yardımcıları |
    | `plugin-sdk/outbound-send-deps` | Kanal bağdaştırıcıları için hafif giden gönderim bağımlılığı araması |
    | `plugin-sdk/outbound-runtime` | Giden kimlik, gönderim temsilcisi, oturum, biçimlendirme ve yük planlama yardımcıları. `deliverOutboundPayloads` gibi doğrudan teslimat yardımcıları kullanımdan kaldırılmış uyumluluk alt katmanıdır; yeni gönderim yolları için `plugin-sdk/channel-message-runtime` kullanın. |
    | `plugin-sdk/poll-runtime` | Dar kapsamlı anket normalleştirme yardımcıları |
    | `plugin-sdk/thread-bindings-runtime` | Konu bağlama yaşam döngüsü ve bağdaştırıcı yardımcıları |
    | `plugin-sdk/agent-media-payload` | Eski ajan medya yükü oluşturucusu |
    | `plugin-sdk/conversation-runtime` | Konuşma/konu bağlama, eşleştirme ve yapılandırılmış bağlama yardımcıları |
    | `plugin-sdk/runtime-config-snapshot` | Çalışma zamanı yapılandırma anlık görüntüsü yardımcısı |
    | `plugin-sdk/runtime-group-policy` | Çalışma zamanı grup ilkesi çözümleme yardımcıları |
    | `plugin-sdk/channel-status` | Paylaşılan kanal durumu anlık görüntüsü/özet yardımcıları |
    | `plugin-sdk/channel-config-primitives` | Dar kapsamlı kanal yapılandırma şeması ilkel öğeleri |
    | `plugin-sdk/channel-config-writes` | Kanal yapılandırma yazma yetkilendirme yardımcıları |
    | `plugin-sdk/channel-plugin-common` | Paylaşılan kanal plugini başlangıç dışa aktarımları |
    | `plugin-sdk/allowlist-config-edit` | İzin listesi yapılandırması düzenleme/okuma yardımcıları |
    | `plugin-sdk/group-access` | Paylaşılan grup erişimi karar yardımcıları |
    | `plugin-sdk/direct-dm` | Paylaşılan doğrudan DM kimlik doğrulama/koruma yardımcıları |
    | `plugin-sdk/discord` | Yayınlanmış `@openclaw/discord@2026.3.13` ve izlenen sahip uyumluluğu için kullanımdan kaldırılmış Discord uyumluluk cephesi; yeni pluginler genel kanal SDK alt yollarını kullanmalıdır |
    | `plugin-sdk/telegram-account` | İzlenen sahip uyumluluğu için kullanımdan kaldırılmış Telegram hesap çözümleme uyumluluk cephesi; yeni pluginler enjekte edilen çalışma zamanı yardımcılarını veya genel kanal SDK alt yollarını kullanmalıdır |
    | `plugin-sdk/zalouser` | Gönderici komut yetkilendirmesini hâlâ içe aktaran yayınlanmış Lark/Zalo paketleri için kullanımdan kaldırılmış Zalo Personal uyumluluk cephesi; yeni pluginler `plugin-sdk/command-auth` kullanmalıdır |
    | `plugin-sdk/interactive-runtime` | Anlamsal mesaj sunumu, teslimat ve eski etkileşimli yanıt yardımcıları. Bkz. [Mesaj Sunumu](/tr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Gelen debounce, bahsetme eşleştirme, bahsetme ilkesi yardımcıları ve zarf yardımcıları için uyumluluk barrel’ı |
    | `plugin-sdk/channel-inbound-debounce` | Dar kapsamlı gelen debounce yardımcıları |
    | `plugin-sdk/channel-mention-gating` | Daha geniş gelen çalışma zamanı yüzeyi olmadan dar kapsamlı bahsetme ilkesi, bahsetme işaretçisi ve bahsetme metni yardımcıları |
    | `plugin-sdk/channel-envelope` | Dar kapsamlı gelen zarf biçimlendirme yardımcıları |
    | `plugin-sdk/channel-location` | Kanal konumu bağlamı ve biçimlendirme yardımcıları |
    | `plugin-sdk/channel-logging` | Gelen düşürmeler ve yazıyor/onay hataları için kanal günlükleme yardımcıları |
    | `plugin-sdk/channel-send-result` | Yanıt sonucu türleri |
    | `plugin-sdk/channel-actions` | Kanal mesaj eylemi yardımcıları ve plugin uyumluluğu için korunan, kullanımdan kaldırılmış yerel şema yardımcıları |
    | `plugin-sdk/channel-route` | Paylaşılan rota normalleştirme, ayrıştırıcı güdümlü hedef çözümleme, konu kimliği dizgeleştirme, tekilleştirme/kompakt rota anahtarları, ayrıştırılmış hedef türleri ve rota/hedef karşılaştırma yardımcıları |
    | `plugin-sdk/channel-targets` | Hedef ayrıştırma yardımcıları; rota karşılaştırması çağıranlar `plugin-sdk/channel-route` kullanmalıdır |
    | `plugin-sdk/channel-contract` | Kanal sözleşme türleri |
    | `plugin-sdk/channel-feedback` | Geri bildirim/tepki kablolaması |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` ve gizli hedef türleri gibi dar kapsamlı gizli sözleşme yardımcıları |
  </Accordion>

  <Accordion title="Sağlayıcı alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Kurulum, katalog keşfi ve çalışma zamanı model hazırlığı için desteklenen LM Studio sağlayıcı arayüzü |
    | `plugin-sdk/lmstudio-runtime` | Yerel sunucu varsayılanları, model keşfi, istek başlıkları ve yüklenmiş model yardımcıları için desteklenen LM Studio çalışma zamanı arayüzü |
    | `plugin-sdk/provider-setup` | Düzenlenmiş yerel/kendi barındırdığınız sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/self-hosted-provider-setup` | OpenAI uyumlu kendi barındırdığınız sağlayıcı kurulum yardımcılarına odaklanır |
    | `plugin-sdk/cli-backend` | CLI backend varsayılanları + watchdog sabitleri |
    | `plugin-sdk/provider-auth-runtime` | Sağlayıcı Plugin'leri için çalışma zamanı API anahtarı çözümleme yardımcıları |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` gibi API anahtarı başlangıç/profil yazma yardımcıları |
    | `plugin-sdk/provider-auth-result` | Standart OAuth kimlik doğrulama sonucu oluşturucusu |
    | `plugin-sdk/provider-env-vars` | Sağlayıcı kimlik doğrulama ortam değişkeni arama yardımcıları |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, kullanımdan kaldırılmış `resolveOpenClawAgentDir` uyumluluk dışa aktarımı |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan replay-policy oluşturucuları, sağlayıcı uç nokta yardımcıları ve paylaşılan model kimliği normalleştirme yardımcıları |
    | `plugin-sdk/provider-catalog-runtime` | Sözleşme testleri için sağlayıcı katalog genişletme çalışma zamanı hook'u ve plugin-provider kayıt bağlantı noktaları |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Genel sağlayıcı HTTP/uç nokta kabiliyet yardımcıları, sağlayıcı HTTP hataları ve ses transkripsiyonu multipart form yardımcıları |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` ve `WebFetchProviderPlugin` gibi dar web-fetch yapılandırma/seçim sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-fetch` | Web-fetch sağlayıcı kayıt/önbellek yardımcıları |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin etkinleştirme bağlantısına ihtiyaç duymayan sağlayıcılar için dar web-search yapılandırma/kimlik bilgisi yardımcıları |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` ve kapsamlı kimlik bilgisi ayarlayıcı/alıcıları gibi dar web-search yapılandırma/kimlik bilgisi sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-search` | Web-search sağlayıcı kayıt/önbellek/çalışma zamanı yardımcıları |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` ve Gemini şema temizliği + tanılama |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` ve benzerleri |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri ve paylaşılan Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot sarmalayıcı yardımcıları |
    | `plugin-sdk/provider-transport-runtime` | Korumalı fetch, taşıma mesajı dönüşümleri ve yazılabilir taşıma olay akışları gibi yerel sağlayıcı taşıma yardımcıları |
    | `plugin-sdk/provider-onboard` | Başlangıç yapılandırma yaması yardımcıları |
    | `plugin-sdk/global-singleton` | Sürece yerel singleton/map/cache yardımcıları |
    | `plugin-sdk/group-activation` | Dar grup etkinleştirme modu ve komut ayrıştırma yardımcıları |
  </Accordion>

  <Accordion title="Kimlik doğrulama ve güvenlik alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, dinamik argüman menüsü biçimlendirmesi dahil komut kayıt yardımcıları, gönderen yetkilendirme yardımcıları |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` ve `buildHelpMessage` gibi komut/yardım mesajı oluşturucuları |
    | `plugin-sdk/approval-auth-runtime` | Onaylayıcı çözümleme ve aynı sohbet eylem kimlik doğrulama yardımcıları |
    | `plugin-sdk/approval-client-runtime` | Yerel exec onay profili/filtre yardımcıları |
    | `plugin-sdk/approval-delivery-runtime` | Yerel onay kabiliyeti/teslimat adaptörleri |
    | `plugin-sdk/approval-gateway-runtime` | Paylaşılan onay Gateway çözümleme yardımcısı |
    | `plugin-sdk/approval-handler-adapter-runtime` | Sıcak kanal giriş noktaları için hafif yerel onay adaptörü yükleme yardımcıları |
    | `plugin-sdk/approval-handler-runtime` | Daha geniş onay işleyici çalışma zamanı yardımcıları; yeterli olduklarında daha dar adaptör/gateway bağlantı noktalarını tercih edin |
    | `plugin-sdk/approval-native-runtime` | Yerel onay hedefi + hesap bağlama yardımcıları |
    | `plugin-sdk/approval-reply-runtime` | Exec/Plugin onay yanıtı payload yardımcıları |
    | `plugin-sdk/approval-runtime` | Exec/Plugin onay payload yardımcıları, yerel onay yönlendirme/çalışma zamanı yardımcıları ve `formatApprovalDisplayPath` gibi yapılandırılmış onay görüntüleme yardımcıları |
    | `plugin-sdk/reply-dedupe` | Dar gelen yanıt tekilleştirme sıfırlama yardımcıları |
    | `plugin-sdk/channel-contract-testing` | Geniş test barrel'ı olmadan dar kanal sözleşmesi test yardımcıları |
    | `plugin-sdk/command-auth-native` | Yerel komut kimlik doğrulaması, dinamik argüman menüsü biçimlendirmesi ve yerel oturum hedefi yardımcıları |
    | `plugin-sdk/command-detection` | Paylaşılan komut algılama yardımcıları |
    | `plugin-sdk/command-primitives-runtime` | Sıcak kanal yolları için hafif komut metni yüklemleri |
    | `plugin-sdk/command-surface` | Komut gövdesi normalleştirme ve komut yüzeyi yardımcıları |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Kanal/Plugin gizli yüzeyleri için dar gizli sözleşme toplama yardımcıları |
    | `plugin-sdk/secret-ref-runtime` | Gizli sözleşme/yapılandırma ayrıştırması için dar `coerceSecretRef` ve SecretRef türleme yardımcıları |
    | `plugin-sdk/security-runtime` | Güven, DM kapılama, yalnızca oluşturma yazımları dahil kök sınırlandırılmış dosya/yol yardımcıları, senkron/asenkron atomik dosya değiştirme, kardeş geçici yazımlar, cihazlar arası taşıma geri dönüşü, özel dosya deposu yardımcıları, symlink üst dizin korumaları, dış içerik, hassas metin redaksiyonu, sabit zamanlı gizli karşılaştırması ve gizli toplama yardımcıları |
    | `plugin-sdk/ssrf-policy` | Ana makine izin listesi ve özel ağ SSRF ilkesi yardımcıları |
    | `plugin-sdk/ssrf-dispatcher` | Geniş altyapı çalışma zamanı yüzeyi olmadan dar sabitlenmiş dispatcher yardımcıları |
    | `plugin-sdk/ssrf-runtime` | Sabitlenmiş dispatcher, SSRF korumalı fetch, SSRF hatası ve SSRF ilkesi yardımcıları |
    | `plugin-sdk/secret-input` | Gizli girdi ayrıştırma yardımcıları |
    | `plugin-sdk/webhook-ingress` | Webhook istek/hedef yardımcıları ve ham websocket/gövde dönüştürme |
    | `plugin-sdk/webhook-request-guards` | İstek gövdesi boyutu/zaman aşımı yardımcıları |
  </Accordion>

  <Accordion title="Çalışma zamanı ve depolama alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/runtime` | Geniş çalışma zamanı/günlükleme/yedekleme/Plugin kurulum yardımcıları |
    | `plugin-sdk/runtime-env` | Dar çalışma zamanı ortamı, günlükleyici, zaman aşımı, yeniden deneme ve geri çekilme yardımcıları |
    | `plugin-sdk/browser-config` | Normalleştirilmiş profil/varsayılanlar, CDP URL ayrıştırma ve tarayıcı denetimi kimlik doğrulama yardımcıları için desteklenen tarayıcı yapılandırma yüzeyi |
    | `plugin-sdk/channel-runtime-context` | Genel kanal çalışma zamanı bağlamı kaydı ve arama yardımcıları |
    | `plugin-sdk/matrix` | Eski üçüncü taraf kanal paketleri için kullanımdan kaldırılmış Matrix uyumluluk yüzeyi; yeni plugin'ler doğrudan `plugin-sdk/run-command` içe aktarmalıdır |
    | `plugin-sdk/mattermost` | Eski üçüncü taraf kanal paketleri için kullanımdan kaldırılmış Mattermost uyumluluk yüzeyi; yeni plugin'ler genel SDK alt yollarını doğrudan içe aktarmalıdır |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Paylaşılan Plugin komutu/hook/http/etkileşimli yardımcıları |
    | `plugin-sdk/hook-runtime` | Paylaşılan Webhook/dahili hook işlem hattı yardımcıları |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod` ve `createLazyRuntimeSurface` gibi tembel çalışma zamanı içe aktarma/bağlama yardımcıları |
    | `plugin-sdk/process-runtime` | Süreç yürütme yardımcıları |
    | `plugin-sdk/cli-runtime` | CLI biçimlendirme, bekleme, sürüm, bağımsız değişken çağrısı ve tembel komut grubu yardımcıları |
    | `plugin-sdk/gateway-runtime` | Gateway istemcisi, olay döngüsüne hazır istemci başlatma yardımcısı, gateway CLI RPC, gateway protokol hataları ve kanal durumu yama yardımcıları |
    | `plugin-sdk/config-contracts` | `OpenClawConfig` ve kanal/sağlayıcı yapılandırma türleri gibi Plugin yapılandırma şekilleri için odaklı, yalnızca tür yapılandırma yüzeyi |
    | `plugin-sdk/plugin-config-runtime` | `requireRuntimeConfig`, `resolvePluginConfigObject` ve `resolveLivePluginConfigObject` gibi çalışma zamanı Plugin yapılandırması arama yardımcıları |
    | `plugin-sdk/config-mutation` | `mutateConfigFile`, `replaceConfigFile` ve `logConfigUpdated` gibi işlemsel yapılandırma değiştirme yardımcıları |
    | `plugin-sdk/runtime-config-snapshot` | `getRuntimeConfig`, `getRuntimeConfigSnapshot` ve test anlık görüntü ayarlayıcıları gibi geçerli süreç yapılandırma anlık görüntüsü yardımcıları |
    | `plugin-sdk/telegram-command-config` | Paketlenmiş Telegram sözleşme yüzeyi kullanılamadığında bile Telegram komut adı/açıklama normalleştirme ve yinelenen/çakışma denetimleri |
    | `plugin-sdk/text-autolink-runtime` | Geniş metin barrel'ı olmadan dosya başvurusu otomatik bağlantı algılama |
    | `plugin-sdk/approval-runtime` | Exec/Plugin onay yardımcıları, onay yeteneği oluşturucuları, kimlik doğrulama/profil yardımcıları, yerel yönlendirme/çalışma zamanı yardımcıları ve yapılandırılmış onay görüntüleme yolu biçimlendirme |
    | `plugin-sdk/reply-runtime` | Paylaşılan gelen/yanıt çalışma zamanı yardımcıları, parçalama, gönderim, heartbeat, yanıt planlayıcı |
    | `plugin-sdk/reply-dispatch-runtime` | Dar yanıt gönderimi/sonlandırma ve konuşma etiketi yardımcıları |
    | `plugin-sdk/reply-history` | Paylaşılan kısa pencereli yanıt geçmişi yardımcıları ve `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` ve `clearHistoryEntriesIfEnabled` gibi işaretçiler |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Dar metin/markdown parçalama yardımcıları |
    | `plugin-sdk/session-store-runtime` | Oturum deposu yolu, oturum anahtarı, güncellenme zamanı ve depo değiştirme yardımcıları |
    | `plugin-sdk/cron-store-runtime` | Cron deposu yolu/yükleme/kaydetme yardımcıları |
    | `plugin-sdk/state-paths` | Durum/OAuth dizin yolu yardımcıları |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey` ve `resolveDefaultAgentBoundAccountId` gibi rota/oturum anahtarı/hesap bağlama yardımcıları |
    | `plugin-sdk/status-helpers` | Paylaşılan kanal/hesap durum özeti yardımcıları, çalışma zamanı durumu varsayılanları ve sorun meta verisi yardımcıları |
    | `plugin-sdk/target-resolver-runtime` | Paylaşılan hedef çözümleyici yardımcıları |
    | `plugin-sdk/string-normalization-runtime` | Slug/dize normalleştirme yardımcıları |
    | `plugin-sdk/request-url` | fetch/istek benzeri girdilerden dize URL'lerini ayıkla |
    | `plugin-sdk/run-command` | Normalleştirilmiş stdout/stderr sonuçlarıyla zamanlamalı komut çalıştırıcı |
    | `plugin-sdk/param-readers` | Ortak araç/CLI parametre okuyucuları |
    | `plugin-sdk/tool-payload` | Araç sonuç nesnelerinden normalleştirilmiş yükleri ayıkla |
    | `plugin-sdk/tool-send` | Araç bağımsız değişkenlerinden kurallı gönderim hedef alanlarını ayıkla |
    | `plugin-sdk/temp-path` | Paylaşılan geçici indirme yolu yardımcıları ve özel güvenli geçici çalışma alanları |
    | `plugin-sdk/logging-core` | Alt sistem günlükleyici ve redaksiyon yardımcıları |
    | `plugin-sdk/markdown-table-runtime` | Markdown tablo modu ve dönüştürme yardımcıları |
    | `plugin-sdk/model-session-runtime` | `applyModelOverrideToSessionEntry` ve `resolveAgentMaxConcurrent` gibi model/oturum geçersiz kılma yardımcıları |
    | `plugin-sdk/talk-config-runtime` | Konuşma sağlayıcısı yapılandırma çözümleme yardımcıları |
    | `plugin-sdk/json-store` | Küçük JSON durum okuma/yazma yardımcıları |
    | `plugin-sdk/file-lock` | Yeniden girişli dosya kilidi yardımcıları |
    | `plugin-sdk/persistent-dedupe` | Disk destekli tekilleştirme önbelleği yardımcıları |
    | `plugin-sdk/acp-runtime` | ACP çalışma zamanı/oturumu ve yanıt gönderimi yardımcıları |
    | `plugin-sdk/acp-runtime-backend` | Başlangıçta yüklenen plugin'ler için hafif ACP arka uç kaydı ve yanıt gönderimi yardımcıları |
    | `plugin-sdk/acp-binding-resolve-runtime` | Yaşam döngüsü başlangıç içe aktarmaları olmadan salt okunur ACP bağlama çözümleme |
    | `plugin-sdk/agent-config-primitives` | Dar ajan çalışma zamanı yapılandırma şeması ilkelleri |
    | `plugin-sdk/boolean-param` | Gevşek boolean parametre okuyucu |
    | `plugin-sdk/dangerous-name-runtime` | Tehlikeli ad eşleştirme çözümleme yardımcıları |
    | `plugin-sdk/device-bootstrap` | Cihaz önyükleme ve eşleştirme belirteci yardımcıları |
    | `plugin-sdk/extension-shared` | Paylaşılan pasif kanal, durum ve ortam proxy yardımcısı ilkelleri |
    | `plugin-sdk/models-provider-runtime` | `/models` komutu/sağlayıcı yanıt yardımcıları |
    | `plugin-sdk/skill-commands-runtime` | Skill komutu listeleme yardımcıları |
    | `plugin-sdk/native-command-registry` | Yerel komut kayıt defteri/oluşturma/serileştirme yardımcıları |
    | `plugin-sdk/agent-harness` | Düşük seviyeli ajan harness'leri için deneysel güvenilir Plugin yüzeyi: harness türleri, etkin çalıştırmayı yönlendirme/iptal yardımcıları, OpenClaw araç köprüsü yardımcıları, çalışma zamanı planı araç ilkesi yardımcıları, terminal sonuç sınıflandırması, araç ilerleme biçimlendirme/ayrıntı yardımcıları ve deneme sonucu yardımcı programları |
    | `plugin-sdk/provider-zai-endpoint` | Kullanımdan kaldırılmış Z.AI sağlayıcı sahipli endpoint algılama yüzeyi; Z.AI Plugin genel API'sini kullanın |
    | `plugin-sdk/async-lock-runtime` | Küçük çalışma zamanı durum dosyaları için süreç yerelinde async kilit yardımcısı |
    | `plugin-sdk/channel-activity-runtime` | Kanal etkinliği telemetri yardımcısı |
    | `plugin-sdk/concurrency-runtime` | Sınırlı async görev eşzamanlılığı yardımcısı |
    | `plugin-sdk/dedupe-runtime` | Bellek içi tekilleştirme önbelleği yardımcıları |
    | `plugin-sdk/delivery-queue-runtime` | Giden bekleyen teslimat boşaltma yardımcısı |
    | `plugin-sdk/file-access-runtime` | Güvenli yerel dosya ve medya kaynağı yolu yardımcıları |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat uyandırma, olay ve görünürlük yardımcıları |
    | `plugin-sdk/number-runtime` | Sayısal zorlama yardımcısı |
    | `plugin-sdk/secure-random-runtime` | Güvenli belirteç/UUID yardımcıları |
    | `plugin-sdk/system-event-runtime` | Sistem olay kuyruğu yardımcıları |
    | `plugin-sdk/transport-ready-runtime` | Aktarım hazır olma bekleme yardımcısı |
    | `plugin-sdk/infra-runtime` | Kullanımdan kaldırılmış uyumluluk shim'i; yukarıdaki odaklı çalışma zamanı alt yollarını kullanın |
    | `plugin-sdk/collection-runtime` | Küçük sınırlı önbellek yardımcıları |
    | `plugin-sdk/diagnostic-runtime` | Tanılama bayrağı, olay ve izleme bağlamı yardımcıları |
    | `plugin-sdk/error-runtime` | Hata grafiği, biçimlendirme, paylaşılan hata sınıflandırma yardımcıları, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Sarılmış fetch, proxy, EnvHttpProxyAgent seçeneği ve sabitlenmiş lookup yardımcıları |
    | `plugin-sdk/runtime-fetch` | Proxy/korumalı fetch içe aktarmaları olmadan dispatcher farkındalıklı çalışma zamanı fetch'i |
    | `plugin-sdk/response-limit-runtime` | Geniş medya çalışma zamanı yüzeyi olmadan sınırlı yanıt gövdesi okuyucu |
    | `plugin-sdk/session-binding-runtime` | Yapılandırılmış bağlama yönlendirmesi veya eşleştirme depoları olmadan geçerli konuşma bağlama durumu |
    | `plugin-sdk/session-store-runtime` | Geniş yapılandırma yazmaları/bakım içe aktarmaları olmadan oturum deposu yardımcıları |
    | `plugin-sdk/context-visibility-runtime` | Geniş yapılandırma/güvenlik içe aktarmaları olmadan bağlam görünürlüğü çözümleme ve ek bağlam filtreleme |
    | `plugin-sdk/string-coerce-runtime` | Markdown/günlükleme içe aktarmaları olmadan dar ilkel kayıt/dize zorlama ve normalleştirme yardımcıları |
    | `plugin-sdk/host-runtime` | Ana makine adı ve SCP ana makine normalleştirme yardımcıları |
    | `plugin-sdk/retry-runtime` | Yeniden deneme yapılandırması ve yeniden deneme çalıştırıcı yardımcıları |
    | `plugin-sdk/agent-runtime` | `resolveAgentDir`, `resolveDefaultAgentDir` ve kullanımdan kaldırılmış `resolveOpenClawAgentDir` uyumluluk dışa aktarımı dahil ajan dizini/kimlik/çalışma alanı yardımcıları |
    | `plugin-sdk/directory-runtime` | Yapılandırma destekli dizin sorgusu/tekilleştirme |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Yetenek ve test alt yolları">
    | Alt yol | Başlıca dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Paylaşılan medya alma/dönüştürme/depolama yardımcıları, ffprobe destekli video boyutu yoklama ve medya yükü oluşturucuları |
    | `plugin-sdk/media-mime` | Dar kapsamlı MIME normalizasyonu, dosya uzantısı eşlemesi, MIME algılama ve medya türü yardımcıları |
    | `plugin-sdk/media-store` | `saveMediaBuffer` gibi dar kapsamlı medya deposu yardımcıları |
    | `plugin-sdk/media-generation-runtime` | Paylaşılan medya oluşturma failover yardımcıları, aday seçimi ve eksik model mesajları |
    | `plugin-sdk/media-understanding` | Medya anlama sağlayıcı türleri ve sağlayıcıya yönelik görüntü/ses/yapılandırılmış çıkarım yardımcı dışa aktarımları |
    | `plugin-sdk/text-chunking` | Metin ve markdown parçalama/işleme yardımcıları, markdown tablo dönüştürme, yönerge etiketi kaldırma ve güvenli metin yardımcı programları |
    | `plugin-sdk/text-chunking` | Giden metin parçalama yardımcısı |
    | `plugin-sdk/speech` | Konuşma sağlayıcı türleri ve sağlayıcıya yönelik yönerge, kayıt defteri, doğrulama, OpenAI uyumlu TTS oluşturucu ve konuşma yardımcı dışa aktarımları |
    | `plugin-sdk/speech-core` | Paylaşılan konuşma sağlayıcı türleri, kayıt defteri, yönerge, normalizasyon ve konuşma yardımcı dışa aktarımları |
    | `plugin-sdk/realtime-transcription` | Gerçek zamanlı transkripsiyon sağlayıcı türleri, kayıt defteri yardımcıları ve paylaşılan WebSocket oturum yardımcısı |
    | `plugin-sdk/realtime-voice` | Gerçek zamanlı ses sağlayıcı türleri ve kayıt defteri yardımcıları |
    | `plugin-sdk/image-generation` | Görüntü oluşturma sağlayıcı türleri, görüntü varlığı/veri URL'si yardımcıları ve OpenAI uyumlu görüntü sağlayıcı oluşturucu |
    | `plugin-sdk/image-generation-core` | Paylaşılan görüntü oluşturma türleri, failover, kimlik doğrulama ve kayıt defteri yardımcıları |
    | `plugin-sdk/music-generation` | Müzik oluşturma sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/music-generation-core` | Paylaşılan müzik oluşturma türleri, failover yardımcıları, sağlayıcı arama ve model başvurusu ayrıştırma |
    | `plugin-sdk/video-generation` | Video oluşturma sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/video-generation-core` | Paylaşılan video oluşturma türleri, failover yardımcıları, sağlayıcı arama ve model başvurusu ayrıştırma |
    | `plugin-sdk/webhook-targets` | Webhook hedef kayıt defteri ve rota yükleme yardımcıları |
    | `plugin-sdk/webhook-path` | Kullanımdan kaldırılmış uyumluluk takma adı; `plugin-sdk/webhook-ingress` kullanın |
    | `plugin-sdk/web-media` | Paylaşılan uzak/yerel medya yükleme yardımcıları |
    | `plugin-sdk/zod` | Kullanımdan kaldırılmış uyumluluk yeniden dışa aktarımı; `zod` paketinden doğrudan `zod` içe aktarın |
    | `plugin-sdk/testing` | Eski OpenClaw testleri için depo yerelindeki kullanımdan kaldırılmış uyumluluk barrel'ı. Yeni depo testleri bunun yerine `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` veya `plugin-sdk/test-fixtures` gibi odaklı yerel test alt yollarını içe aktarmalıdır |
    | `plugin-sdk/plugin-test-api` | Depo test yardımcı köprülerini içe aktarmadan doğrudan Plugin kaydı birim testleri için depo yerelinde minimal `createTestPluginApi` yardımcısı |
    | `plugin-sdk/agent-runtime-test-contracts` | Kimlik doğrulama, teslim, fallback, araç hook'u, istem overlay'i, şema ve transkript projeksiyonu testleri için depo yerelinde yerel ajan çalışma zamanı bağdaştırıcı sözleşme fixture'ları |
    | `plugin-sdk/channel-test-helpers` | Genel eylem/kurulum/durum sözleşmeleri, dizin doğrulamaları, hesap başlatma yaşam döngüsü, gönderim yapılandırması iş parçacığı, çalışma zamanı mock'ları, durum sorunları, giden teslim ve hook kaydı için depo yerelinde kanal odaklı test yardımcıları |
    | `plugin-sdk/channel-target-testing` | Kanal testleri için depo yerelinde paylaşılan hedef çözümleme hata durumu paketi |
    | `plugin-sdk/plugin-test-contracts` | Depo yerelinde Plugin paketi, kayıt, herkese açık artifact, doğrudan içe aktarma, çalışma zamanı API'si ve içe aktarma yan etkisi sözleşme yardımcıları |
    | `plugin-sdk/provider-test-contracts` | Depo yerelinde sağlayıcı çalışma zamanı, kimlik doğrulama, keşif, onboarding, katalog, sihirbaz, medya yeteneği, replay ilkesi, gerçek zamanlı STT canlı ses, web arama/getirme ve akış sözleşme yardımcıları |
    | `plugin-sdk/provider-http-test-mocks` | `plugin-sdk/provider-http` kullanan sağlayıcı testleri için depo yerelinde isteğe bağlı Vitest HTTP/kimlik doğrulama mock'ları |
    | `plugin-sdk/test-fixtures` | Depo yerelinde genel CLI çalışma zamanı yakalama, sandbox bağlamı, skill yazıcı, ajan mesajı, sistem olayı, modül yeniden yükleme, paketlenmiş Plugin yolu, terminal metni, parçalama, kimlik doğrulama token'ı ve türlendirilmiş durum fixture'ları |
    | `plugin-sdk/test-node-mocks` | Vitest `vi.mock("node:*")` factory'leri içinde kullanım için depo yerelinde odaklı Node yerleşik mock yardımcıları |
  </Accordion>

  <Accordion title="Bellek alt yolları">
    | Alt yol | Başlıca dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/memory-core` | Yönetici/yapılandırma/dosya/CLI yardımcıları için paketlenmiş memory-core yardımcı yüzeyi |
    | `plugin-sdk/memory-core-engine-runtime` | Bellek dizini/arama çalışma zamanı facade'ı |
    | `plugin-sdk/memory-core-host-engine-foundation` | Bellek ana makine foundation motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Bellek ana makine embedding sözleşmeleri, kayıt defteri erişimi, yerel sağlayıcı ve genel toplu/uzak yardımcılar |
    | `plugin-sdk/memory-core-host-engine-qmd` | Bellek ana makine QMD motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-storage` | Bellek ana makine depolama motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-multimodal` | Bellek ana makine çok modlu yardımcıları |
    | `plugin-sdk/memory-core-host-query` | Bellek ana makine sorgu yardımcıları |
    | `plugin-sdk/memory-core-host-secret` | Bellek ana makine secret yardımcıları |
    | `plugin-sdk/memory-core-host-events` | Kullanımdan kaldırılmış uyumluluk takma adı; `plugin-sdk/memory-host-events` kullanın |
    | `plugin-sdk/memory-core-host-status` | Bellek ana makine durum yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-cli` | Bellek ana makine CLI çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-core` | Bellek ana makine çekirdek çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-files` | Bellek ana makine dosya/çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-host-core` | Bellek ana makine çekirdek çalışma zamanı yardımcıları için satıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-host-events` | Bellek ana makine olay günlüğü yardımcıları için satıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-host-files` | Kullanımdan kaldırılmış uyumluluk takma adı; `plugin-sdk/memory-core-host-runtime-files` kullanın |
    | `plugin-sdk/memory-host-markdown` | Belleğe yakın Plugin'ler için paylaşılan yönetilen markdown yardımcıları |
    | `plugin-sdk/memory-host-search` | Arama yöneticisi erişimi için Active Memory çalışma zamanı facade'ı |
    | `plugin-sdk/memory-host-status` | Kullanımdan kaldırılmış uyumluluk takma adı; `plugin-sdk/memory-core-host-status` kullanın |
  </Accordion>

  <Accordion title="Ayrılmış paketlenmiş yardımcı alt yolları">
    Şu anda ayrılmış paketlenmiş yardımcı SDK alt yolu yok. Sahibe özgü
    yardımcılar sahip Plugin paketinin içinde bulunur; yeniden kullanılabilir ana makine sözleşmeleri ise
    `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` ve
    `plugin-sdk/plugin-config-runtime` gibi genel SDK alt yollarını kullanır.
  </Accordion>
</AccordionGroup>

## İlgili

- [Plugin SDK genel bakışı](/tr/plugins/sdk-overview)
- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)

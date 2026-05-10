---
read_when:
    - Bir Plugin içe aktarması için doğru plugin-sdk alt yolunu seçme
    - Paketle gelen Plugin alt yollarını ve yardımcı arayüzleri denetleme
summary: 'Plugin SDK alt yol kataloğu: alana göre gruplanmış olarak hangi içe aktarmaların nerede bulunduğu'
title: Plugin SDK alt yolları
x-i18n:
    generated_at: "2026-05-10T19:49:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: ddcb1223ce9f749e57e866cc0ed3329a1aeeb5d90d00568b5942f7f779086f1f
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK, `openclaw/plugin-sdk/` altında dar kapsamlı herkese açık alt yollar kümesi olarak sunulur. Bu sayfa, yaygın kullanılan alt yolları amaca göre gruplayarak kataloglar. Oluşturulan derleyici giriş noktası envanteri `scripts/lib/plugin-sdk-entrypoints.json` içinde yer alır; paket dışa aktarımları, `scripts/lib/plugin-sdk-private-local-only-subpaths.json` içinde listelenen repo yerel test/dahili alt yolları çıkarıldıktan sonra kalan herkese açık alt kümedir. Bakımcılar, herkese açık dışa aktarım sayısını `pnpm plugin-sdk:surface` ile ve etkin ayrılmış yardımcı alt yolları `pnpm plugins:boundary-report:summary` ile denetleyebilir; kullanılmayan ayrılmış yardımcı dışa aktarımları, hareketsiz uyumluluk borcu olarak herkese açık SDK içinde kalmak yerine CI raporunu başarısız kılar.

Plugin yazım kılavuzu için bkz. [Plugin SDK genel bakışı](/tr/plugins/sdk-overview).

## Plugin girişi

| Alt yol                        | Ana dışa aktarımlar                                                                                                                                                    |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | `createMigrationItem` gibi geçiş sağlayıcısı öğe yardımcıları, neden sabitleri, öğe durumu işaretleyicileri, redaksiyon yardımcıları ve `summarizeMigrationItems`       |
| `plugin-sdk/migration-runtime` | `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` ve `writeMigrationReport` gibi çalışma zamanı geçiş yardımcıları                                           |

### Kullanımdan kaldırılmış uyumluluk ve test yardımcıları

Bu alt yollar eski Plugin’ler ve OpenClaw test paketleri için paket dışa aktarımları olarak kalır, ancak yeni kod bunlardan içe aktarma eklememelidir: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `provider-http-test-mocks`,
`provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`,
`testing`, `channel-runtime`, `compat`, `config-types`, `infra-runtime`,
`text-runtime` ve `zod`. Yeni Plugin kodunda `zod` öğesini doğrudan `zod` içinden içe aktarın.
`plugin-test-runtime` hâlâ etkin ve odaklı bir test yardımcısı alt yoludur.

### Kullanımdan kaldırılmış, kullanılmayan herkese açık alt yollar

Bu herkese açık alt yollar en az bir ay boyunca var oldu ve şu anda paketlenmiş uzantı üretim içe aktarmalarında kullanılmıyor. Uyumluluk için içe aktarılabilir kalırlar, ancak yeni Plugin kodu bunun yerine odaklı, etkin olarak kullanılan SDK alt yollarını kullanmalıdır:
`agent-config-primitives`, `channel-config-schema-legacy`,
`channel-reply-pipeline`, `channel-runtime`, `channel-secret-runtime`,
`command-auth`, `compat`, `config-runtime`, `config-schema`, `discord`,
`group-access`, `infra-runtime`, `matrix`, `mattermost`,
`media-generation-runtime-shared`, `memory-core-engine-runtime`,
`memory-core-host-multimodal`, `memory-core-host-query`,
`music-generation-core`, `self-hosted-provider-setup`, `telegram-account`,
`telegram-command-config` ve `zalouser`.

### Kullanımdan kaldırılmış, nadir kullanılan herkese açık alt yollar

Şu anda yalnızca bir veya iki paketlenmiş Plugin sahibi tarafından kullanılan herkese açık alt yollar da yeni Plugin kodu için kullanımdan kaldırılmıştır. Uyumluluk için paket dışa aktarımları olarak kalırlar, ancak yeni kod etkin olarak paylaşılan SDK bağlantı noktalarını veya Plugin’e ait paket API’lerini tercih etmelidir. Bakımcılar tam kümeyi `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` içinde, mevcut bütçeyi ise `pnpm plugin-sdk:surface` ile izler.

### Kullanımdan kaldırılmış geniş barrel’lar

Bu geniş yeniden dışa aktarım barrel’ları OpenClaw kaynağı ve uyumluluk denetimleri için derlenebilir kalır, ancak yeni kod odaklı SDK alt yollarını tercih etmelidir:
`agent-runtime`, `channel-lifecycle`, `channel-runtime`, `cli-runtime`,
`compat`, `config-types`, `conversation-runtime`, `hook-runtime`,
`infra-runtime`, `media-runtime`, `plugin-runtime`, `security-runtime` ve
`text-runtime`. `channel-runtime`, `compat`, `config-types`, `infra-runtime` ve `text-runtime` yalnızca geriye dönük uyumluluk için paket dışa aktarımları olarak kalır; bunun yerine odaklı kanal/çalışma zamanı alt yollarını, `config-contracts`, `string-coerce-runtime`,
`text-chunking`, `text-utility-runtime` ve `logging-core` kullanın.

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Alt yol | Ana dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Kök `openclaw.json` Zod şeması dışa aktarımı (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Plugin'e ait şemalar için önbelleğe alınmış JSON Schema doğrulama yardımcısı |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`; ayrıca `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Paylaşılan kurulum sihirbazı yardımcıları, izin listesi istemleri, kurulum durumu oluşturucuları |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Kullanımdan kaldırılmış uyumluluk takma adı; `plugin-sdk/setup-runtime` kullanın |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Çok hesaplı yapılandırma/eylem kapısı yardımcıları, varsayılan hesap yedek yardımcıları |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, hesap kimliği normalleştirme yardımcıları |
    | `plugin-sdk/account-resolution` | Hesap arama + varsayılan yedeğe düşme yardımcıları |
    | `plugin-sdk/account-helpers` | Dar kapsamlı hesap listesi/hesap eylemi yardımcıları |
    | `plugin-sdk/access-groups` | Erişim grubu izin listesi ayrıştırma ve gizlenmiş grup tanılama yardımcıları |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Eski yanıt işlem hattı yardımcıları. Yeni kanal yanıt işlem hattı kodu, `plugin-sdk/channel-message` içinden `createChannelMessageReplyPipeline` ve `resolveChannelMessageSourceReplyDeliveryMode` kullanmalıdır. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Paylaşılan kanal yapılandırma şeması temel öğeleri ile Zod ve doğrudan JSON/TypeBox oluşturucuları |
    | `plugin-sdk/bundled-channel-config-schema` | Yalnızca bakımı yapılan paketli Plugin'ler için paketli OpenClaw kanal yapılandırma şemaları |
    | `plugin-sdk/channel-config-schema-legacy` | Paketli kanal yapılandırma şemaları için kullanımdan kaldırılmış uyumluluk takma adı |
    | `plugin-sdk/telegram-command-config` | Paketli sözleşme yedeğiyle Telegram özel komut normalleştirme/doğrulama yardımcıları |
    | `plugin-sdk/command-gating` | Dar kapsamlı komut yetkilendirme kapısı yardımcıları |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Kullanımdan kaldırılmış düşük düzeyli kanal girişi uyumluluk cephesi. Yeni alma yolları `plugin-sdk/channel-ingress-runtime` kullanmalıdır. |
    | `plugin-sdk/channel-ingress-runtime` | Taşınmış kanal alma yolları için deneysel yüksek düzeyli kanal girişi çalışma zamanı çözümleyicisi ve rota olgusu oluşturucuları. Her Plugin'de etkin izin listelerini, komut izin listelerini ve eski izdüşümleri birleştirmek yerine bunu tercih edin. Bkz. [Kanal girişi API'si](/tr/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue` ve eski taslak akış yaşam döngüsü yardımcıları. Yeni önizleme sonlandırma kodu `plugin-sdk/channel-message` kullanmalıdır. |
    | `plugin-sdk/channel-message` | `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createChannelMessageReplyPipeline`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode` gibi ucuz ileti yaşam döngüsü sözleşmesi yardımcıları, dayanıklı son yetenek türetimi, gönderme/alındı/yan etki yetenekleri için yetenek kanıtı yardımcıları, `MessageReceiveContext`, alma onay ilkesi kanıtları, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, canlı önizleme ve canlı sonlandırıcı yetenek kanıtları, dayanıklı kurtarma durumu, `RenderedMessageBatch`, ileti alındı türleri ve alındı kimliği yardımcıları. Bkz. [Kanal iletisi API'si](/tr/plugins/sdk-channel-message). Eski yanıt gönderim cepheleri yalnızca kullanımdan kaldırılmış uyumluluk içindir. |
    | `plugin-sdk/channel-message-runtime` | `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch` ve `withDurableMessageSendContext` dahil olmak üzere giden teslimatı yükleyebilen çalışma zamanı teslimat yardımcıları. Kullanımdan kaldırılmış yanıt gönderim köprüleri yalnızca uyumluluk göndericileri için içe aktarılabilir durumda kalır. Sıcak Plugin önyükleme dosyalarından değil, izleme/gönderme çalışma zamanı modüllerinden kullanın. |
    | `plugin-sdk/inbound-envelope` | Paylaşılan gelen rota + zarf oluşturucu yardımcıları |
    | `plugin-sdk/inbound-reply-dispatch` | Eski paylaşılan gelen kayıt ve gönderim yardımcıları, görünür/son gönderim koşulları ve hazırlanmış kanal göndericileri için kullanımdan kaldırılmış `deliverDurableInboundReplyPayload` uyumluluğu. Yeni kanal alma/gönderim kodu, çalışma zamanı yaşam döngüsü yardımcılarını `plugin-sdk/channel-message-runtime` içinden içe aktarmalıdır. |
    | `plugin-sdk/messaging-targets` | Hedef ayrıştırma/eşleştirme yardımcıları |
    | `plugin-sdk/outbound-media` | Paylaşılan giden medya yükleme yardımcıları |
    | `plugin-sdk/outbound-send-deps` | Kanal bağdaştırıcıları için hafif giden gönderim bağımlılığı araması |
    | `plugin-sdk/outbound-runtime` | Giden kimlik, gönderim yetkilisi, oturum, biçimlendirme ve yük planlama yardımcıları. `deliverOutboundPayloads` gibi doğrudan teslimat yardımcıları kullanımdan kaldırılmış uyumluluk altyapısıdır; yeni gönderme yolları için `plugin-sdk/channel-message-runtime` kullanın. |
    | `plugin-sdk/poll-runtime` | Dar kapsamlı anket normalleştirme yardımcıları |
    | `plugin-sdk/thread-bindings-runtime` | Konu bağlama yaşam döngüsü ve bağdaştırıcı yardımcıları |
    | `plugin-sdk/agent-media-payload` | Eski aracı medya yükü oluşturucu |
    | `plugin-sdk/conversation-runtime` | Konuşma/konu bağlama, eşleme ve yapılandırılmış bağlama yardımcıları |
    | `plugin-sdk/runtime-config-snapshot` | Çalışma zamanı yapılandırma anlık görüntüsü yardımcısı |
    | `plugin-sdk/runtime-group-policy` | Çalışma zamanı grup ilkesi çözümleme yardımcıları |
    | `plugin-sdk/channel-status` | Paylaşılan kanal durumu anlık görüntüsü/özeti yardımcıları |
    | `plugin-sdk/channel-config-primitives` | Dar kapsamlı kanal yapılandırma şeması temel öğeleri |
    | `plugin-sdk/channel-config-writes` | Kanal yapılandırma yazma yetkilendirme yardımcıları |
    | `plugin-sdk/channel-plugin-common` | Paylaşılan kanal Plugin başlangıç dışa aktarımları |
    | `plugin-sdk/allowlist-config-edit` | İzin listesi yapılandırma düzenleme/okuma yardımcıları |
    | `plugin-sdk/group-access` | Paylaşılan grup erişimi karar yardımcıları |
    | `plugin-sdk/direct-dm` | Paylaşılan doğrudan DM kimlik doğrulama/koruma yardımcıları |
    | `plugin-sdk/discord` | Yayımlanmış `@openclaw/discord@2026.3.13` ve izlenen sahip uyumluluğu için kullanımdan kaldırılmış Discord uyumluluk cephesi; yeni Plugin'ler genel kanal SDK alt yollarını kullanmalıdır |
    | `plugin-sdk/telegram-account` | İzlenen sahip uyumluluğu için kullanımdan kaldırılmış Telegram hesap çözümleme uyumluluk cephesi; yeni Plugin'ler enjekte edilmiş çalışma zamanı yardımcılarını veya genel kanal SDK alt yollarını kullanmalıdır |
    | `plugin-sdk/zalouser` | Hâlâ gönderici komut yetkilendirmesini içe aktaran yayımlanmış Lark/Zalo paketleri için kullanımdan kaldırılmış Zalo Personal uyumluluk cephesi; yeni Plugin'ler `plugin-sdk/command-auth` kullanmalıdır |
    | `plugin-sdk/interactive-runtime` | Anlamsal ileti sunumu, teslimatı ve eski etkileşimli yanıt yardımcıları. Bkz. [İleti Sunumu](/tr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Gelen debounce, bahsetme eşleştirme, bahsetme ilkesi yardımcıları ve zarf yardımcıları için uyumluluk barrel'ı |
    | `plugin-sdk/channel-inbound-debounce` | Dar kapsamlı gelen debounce yardımcıları |
    | `plugin-sdk/channel-mention-gating` | Daha geniş gelen çalışma zamanı yüzeyi olmadan dar kapsamlı bahsetme ilkesi, bahsetme işaretçisi ve bahsetme metni yardımcıları |
    | `plugin-sdk/channel-envelope` | Dar kapsamlı gelen zarf biçimlendirme yardımcıları |
    | `plugin-sdk/channel-location` | Kanal konum bağlamı ve biçimlendirme yardımcıları |
    | `plugin-sdk/channel-logging` | Gelen düşürmeler ve yazıyor/onay hataları için kanal günlükleme yardımcıları |
    | `plugin-sdk/channel-send-result` | Yanıt sonucu türleri |
    | `plugin-sdk/channel-actions` | Kanal ileti eylemi yardımcıları ve Plugin uyumluluğu için tutulan, kullanımdan kaldırılmış yerel şema yardımcıları |
    | `plugin-sdk/channel-route` | Paylaşılan rota normalleştirme, ayrıştırıcı güdümlü hedef çözümleme, konu kimliği dizeleştirme, tekilleştirme/sıkıştırılmış rota anahtarları, ayrıştırılmış hedef türleri ve rota/hedef karşılaştırma yardımcıları |
    | `plugin-sdk/channel-targets` | Hedef ayrıştırma yardımcıları; rota karşılaştırması çağırıcıları `plugin-sdk/channel-route` kullanmalıdır |
    | `plugin-sdk/channel-contract` | Kanal sözleşme türleri |
    | `plugin-sdk/channel-feedback` | Geri bildirim/tepki bağlantıları |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` ve gizli hedef türleri gibi dar kapsamlı gizli sözleşme yardımcıları |
  </Accordion>

  <Accordion title="Sağlayıcı alt yolları">
    | Alt yol | Başlıca dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Kurulum, katalog keşfi ve çalışma zamanı model hazırlığı için desteklenen LM Studio sağlayıcı arayüzü |
    | `plugin-sdk/lmstudio-runtime` | Yerel sunucu varsayılanları, model keşfi, istek üst bilgileri ve yüklenmiş model yardımcıları için desteklenen LM Studio çalışma zamanı arayüzü |
    | `plugin-sdk/provider-setup` | Özenle seçilmiş yerel/kendi barındırmalı sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/self-hosted-provider-setup` | Odaklanmış OpenAI uyumlu kendi barındırmalı sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/cli-backend` | CLI arka uç varsayılanları + watchdog sabitleri |
    | `plugin-sdk/provider-auth-runtime` | Sağlayıcı Plugin'leri için çalışma zamanı API anahtarı çözümleme yardımcıları |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` gibi API anahtarıyla ilk kullanım/profil yazma yardımcıları |
    | `plugin-sdk/provider-auth-result` | Standart OAuth kimlik doğrulama sonucu oluşturucu |
    | `plugin-sdk/provider-env-vars` | Sağlayıcı kimlik doğrulama ortam değişkeni arama yardımcıları |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, kullanımdan kaldırılmış `resolveOpenClawAgentDir` uyumluluk dışa aktarımı |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan yeniden oynatma ilkesi oluşturucuları, sağlayıcı uç nokta yardımcıları ve paylaşılan model kimliği normalleştirme yardımcıları |
    | `plugin-sdk/provider-catalog-runtime` | Sözleşme testleri için sağlayıcı katalog genişletme çalışma zamanı kancası ve Plugin-sağlayıcı kayıt seams'leri |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Genel sağlayıcı HTTP/uç nokta yetenek yardımcıları, sağlayıcı HTTP hataları ve ses transkripsiyonu multipart form yardımcıları |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` ve `WebFetchProviderPlugin` gibi dar web-fetch yapılandırma/seçim sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-fetch` | Web-fetch sağlayıcı kayıt/önbellek yardımcıları |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin etkinleştirme kablolamasına ihtiyaç duymayan sağlayıcılar için dar web-search yapılandırma/kimlik bilgisi yardımcıları |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` ve kapsamlı kimlik bilgisi ayarlayıcıları/alıcıları gibi dar web-search yapılandırma/kimlik bilgisi sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-search` | Web-search sağlayıcı kayıt/önbellek/çalışma zamanı yardımcıları |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` ve Gemini şema temizliği + tanılama |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` ve benzerleri |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri ve paylaşılan Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot sarmalayıcı yardımcıları |
    | `plugin-sdk/provider-transport-runtime` | Korumalı fetch, taşıma iletisi dönüşümleri ve yazılabilir taşıma olay akışları gibi yerel sağlayıcı taşıma yardımcıları |
    | `plugin-sdk/provider-onboard` | İlk kullanım yapılandırması yama yardımcıları |
    | `plugin-sdk/global-singleton` | Sürece yerel singleton/harita/önbellek yardımcıları |
    | `plugin-sdk/group-activation` | Dar grup etkinleştirme modu ve komut ayrıştırma yardımcıları |
  </Accordion>

  <Accordion title="Kimlik doğrulama ve güvenlik alt yolları">
    | Alt yol | Başlıca dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, dinamik argüman menüsü biçimlendirmesi dahil komut kayıt yardımcıları, gönderen yetkilendirme yardımcıları |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` ve `buildHelpMessage` gibi komut/yardım iletisi oluşturucuları |
    | `plugin-sdk/approval-auth-runtime` | Onaylayıcı çözümleme ve aynı sohbet eylem kimlik doğrulama yardımcıları |
    | `plugin-sdk/approval-client-runtime` | Yerel exec onay profili/filtre yardımcıları |
    | `plugin-sdk/approval-delivery-runtime` | Yerel onay yeteneği/teslimat bağdaştırıcıları |
    | `plugin-sdk/approval-gateway-runtime` | Paylaşılan onay Gateway çözümleme yardımcısı |
    | `plugin-sdk/approval-handler-adapter-runtime` | Sıcak kanal giriş noktaları için hafif yerel onay bağdaştırıcısı yükleme yardımcıları |
    | `plugin-sdk/approval-handler-runtime` | Daha geniş onay işleyicisi çalışma zamanı yardımcıları; yeterli olduklarında daha dar bağdaştırıcı/Gateway seams'lerini tercih edin |
    | `plugin-sdk/approval-native-runtime` | Yerel onay hedefi + hesap bağlama yardımcıları |
    | `plugin-sdk/approval-reply-runtime` | Exec/Plugin onay yanıtı yük yardımcıları |
    | `plugin-sdk/approval-runtime` | Exec/Plugin onay yük yardımcıları, yerel onay yönlendirme/çalışma zamanı yardımcıları ve `formatApprovalDisplayPath` gibi yapılandırılmış onay gösterimi yardımcıları |
    | `plugin-sdk/reply-dedupe` | Dar gelen yanıt tekilleştirme sıfırlama yardımcıları |
    | `plugin-sdk/channel-contract-testing` | Geniş test barrel'ı olmadan dar kanal sözleşmesi test yardımcıları |
    | `plugin-sdk/command-auth-native` | Yerel komut kimlik doğrulaması, dinamik argüman menüsü biçimlendirmesi ve yerel oturum hedefi yardımcıları |
    | `plugin-sdk/command-detection` | Paylaşılan komut algılama yardımcıları |
    | `plugin-sdk/command-primitives-runtime` | Sıcak kanal yolları için hafif komut metni koşul ifadeleri |
    | `plugin-sdk/command-surface` | Komut gövdesi normalleştirme ve komut yüzeyi yardımcıları |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Kanal/Plugin gizli bilgi yüzeyleri için dar gizli bilgi sözleşmesi toplama yardımcıları |
    | `plugin-sdk/secret-ref-runtime` | Gizli bilgi sözleşmesi/yapılandırma ayrıştırması için dar `coerceSecretRef` ve SecretRef tipleme yardımcıları |
    | `plugin-sdk/security-runtime` | Yalnızca oluşturma yazmaları, senkron/asenkron atomik dosya değiştirme, kardeş geçici yazmaları, cihazlar arası taşıma yedeklemesi, özel dosya deposu yardımcıları, sembolik bağlantı ebeveyn korumaları, harici içerik, hassas metin redaksiyonu, sabit zamanlı gizli bilgi karşılaştırması ve gizli bilgi toplama yardımcıları dahil paylaşılan güven, DM geçitleme, kök sınırlı dosya/yol yardımcıları |
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
    | `plugin-sdk/runtime` | Geniş çalışma zamanı/günlükleme/yedekleme/Plugin kurulum yardımcıları |
    | `plugin-sdk/runtime-env` | Dar çalışma zamanı ortamı, günlükleyici, zaman aşımı, yeniden deneme ve geri çekilme yardımcıları |
    | `plugin-sdk/browser-config` | Normalleştirilmiş profil/varsayılanlar, CDP URL ayrıştırma ve tarayıcı denetimi kimlik doğrulama yardımcıları için desteklenen tarayıcı yapılandırma cephesi |
    | `plugin-sdk/channel-runtime-context` | Genel kanal çalışma zamanı bağlamı kayıt ve arama yardımcıları |
    | `plugin-sdk/matrix` | Eski üçüncü taraf kanal paketleri için kullanımdan kaldırılmış Matrix uyumluluk cephesi; yeni Plugin'ler doğrudan `plugin-sdk/run-command` içe aktarmalıdır |
    | `plugin-sdk/mattermost` | Eski üçüncü taraf kanal paketleri için kullanımdan kaldırılmış Mattermost uyumluluk cephesi; yeni Plugin'ler doğrudan genel SDK alt yollarını içe aktarmalıdır |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Paylaşılan Plugin komut/kanca/http/etkileşimli yardımcıları |
    | `plugin-sdk/hook-runtime` | Paylaşılan Webhook/dahili kanca işlem hattı yardımcıları |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod` ve `createLazyRuntimeSurface` gibi geç çalışma zamanı içe aktarma/bağlama yardımcıları |
    | `plugin-sdk/process-runtime` | Süreç çalıştırma yardımcıları |
    | `plugin-sdk/cli-runtime` | CLI biçimlendirme, bekleme, sürüm, argüman çağırma ve geç komut grubu yardımcıları |
    | `plugin-sdk/gateway-runtime` | Gateway istemcisi, olay döngüsüne hazır istemci başlatma yardımcısı, Gateway CLI RPC, Gateway protokol hataları ve kanal durumu yama yardımcıları |
    | `plugin-sdk/config-contracts` | `OpenClawConfig` ve kanal/sağlayıcı yapılandırma türleri gibi Plugin yapılandırma şekilleri için odaklanmış, yalnızca tür içeren yapılandırma yüzeyi |
    | `plugin-sdk/plugin-config-runtime` | `requireRuntimeConfig`, `resolvePluginConfigObject` ve `resolveLivePluginConfigObject` gibi çalışma zamanı Plugin yapılandırması arama yardımcıları |
    | `plugin-sdk/config-mutation` | `mutateConfigFile`, `replaceConfigFile` ve `logConfigUpdated` gibi işlemsel yapılandırma değiştirme yardımcıları |
    | `plugin-sdk/runtime-config-snapshot` | `getRuntimeConfig`, `getRuntimeConfigSnapshot` ve test anlık görüntüsü ayarlayıcıları gibi geçerli süreç yapılandırma anlık görüntüsü yardımcıları |
    | `plugin-sdk/telegram-command-config` | Paketlenmiş Telegram sözleşme yüzeyi kullanılamadığında bile Telegram komut adı/açıklaması normalleştirme ve yinelenen/çakışan denetimleri |
    | `plugin-sdk/text-autolink-runtime` | Geniş metin barrel'ı olmadan dosya referansı otomatik bağlantı algılama |
    | `plugin-sdk/approval-runtime` | Exec/Plugin onay yardımcıları, onay yeteneği oluşturucuları, kimlik doğrulama/profil yardımcıları, yerel yönlendirme/çalışma zamanı yardımcıları ve yapılandırılmış onay görüntüleme yolu biçimlendirme |
    | `plugin-sdk/reply-runtime` | Paylaşılan gelen/yanıt çalışma zamanı yardımcıları, parçalama, gönderim, Heartbeat, yanıt planlayıcı |
    | `plugin-sdk/reply-dispatch-runtime` | Dar yanıt gönderme/sonlandırma ve konuşma etiketi yardımcıları |
    | `plugin-sdk/reply-history` | `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` ve `clearHistoryEntriesIfEnabled` gibi paylaşılan kısa pencereli yanıt geçmişi yardımcıları ve işaretçileri |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Dar metin/markdown parçalama yardımcıları |
    | `plugin-sdk/session-store-runtime` | Oturum deposu yolu, oturum anahtarı, güncellenme zamanı ve depo değiştirme yardımcıları |
    | `plugin-sdk/cron-store-runtime` | Cron deposu yolu/yükleme/kaydetme yardımcıları |
    | `plugin-sdk/state-paths` | Durum/OAuth dizin yolu yardımcıları |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey` ve `resolveDefaultAgentBoundAccountId` gibi rota/oturum anahtarı/hesap bağlama yardımcıları |
    | `plugin-sdk/status-helpers` | Paylaşılan kanal/hesap durum özeti yardımcıları, çalışma zamanı durumu varsayılanları ve sorun meta verisi yardımcıları |
    | `plugin-sdk/target-resolver-runtime` | Paylaşılan hedef çözümleyici yardımcıları |
    | `plugin-sdk/string-normalization-runtime` | Slug/dize normalleştirme yardımcıları |
    | `plugin-sdk/request-url` | fetch/istek benzeri girdilerden dize URL'leri çıkarır |
    | `plugin-sdk/run-command` | Normalleştirilmiş stdout/stderr sonuçlarıyla zaman sınırlı komut çalıştırıcı |
    | `plugin-sdk/param-readers` | Ortak araç/CLI parametre okuyucuları |
    | `plugin-sdk/tool-payload` | Araç sonuç nesnelerinden normalleştirilmiş yükleri çıkarır |
    | `plugin-sdk/tool-send` | Araç argümanlarından kanonik gönderme hedefi alanlarını çıkarır |
    | `plugin-sdk/temp-path` | Paylaşılan geçici indirme yolu yardımcıları ve özel güvenli geçici çalışma alanları |
    | `plugin-sdk/logging-core` | Alt sistem günlükleyici ve redaksiyon yardımcıları |
    | `plugin-sdk/markdown-table-runtime` | Markdown tablo modu ve dönüştürme yardımcıları |
    | `plugin-sdk/model-session-runtime` | `applyModelOverrideToSessionEntry` ve `resolveAgentMaxConcurrent` gibi model/oturum geçersiz kılma yardımcıları |
    | `plugin-sdk/talk-config-runtime` | Talk sağlayıcı yapılandırma çözümleme yardımcıları |
    | `plugin-sdk/json-store` | Küçük JSON durum okuma/yazma yardımcıları |
    | `plugin-sdk/file-lock` | Yeniden girilebilir dosya kilidi yardımcıları |
    | `plugin-sdk/persistent-dedupe` | Disk destekli tekilleştirme önbelleği yardımcıları |
    | `plugin-sdk/acp-runtime` | ACP çalışma zamanı/oturum ve yanıt gönderme yardımcıları |
    | `plugin-sdk/acp-runtime-backend` | Başlangıçta yüklenen Plugin'ler için hafif ACP arka uç kaydı ve yanıt gönderme yardımcıları |
    | `plugin-sdk/acp-binding-resolve-runtime` | Yaşam döngüsü başlangıç içe aktarmaları olmadan salt okunur ACP bağlama çözümleme |
    | `plugin-sdk/agent-config-primitives` | Dar aracı çalışma zamanı yapılandırma şeması ilkelleri |
    | `plugin-sdk/boolean-param` | Gevşek boolean parametre okuyucu |
    | `plugin-sdk/dangerous-name-runtime` | Tehlikeli ad eşleştirme çözümleme yardımcıları |
    | `plugin-sdk/device-bootstrap` | Cihaz bootstrap ve eşleştirme belirteci yardımcıları |
    | `plugin-sdk/extension-shared` | Paylaşılan pasif kanal, durum ve ortam proxy yardımcısı ilkelleri |
    | `plugin-sdk/models-provider-runtime` | `/models` komutu/sağlayıcı yanıt yardımcıları |
    | `plugin-sdk/skill-commands-runtime` | Skill komut listeleme yardımcıları |
    | `plugin-sdk/native-command-registry` | Yerel komut kayıt defteri/oluşturma/serileştirme yardımcıları |
    | `plugin-sdk/agent-harness` | Düşük seviyeli aracı harness'leri için deneysel güvenilir Plugin yüzeyi: harness türleri, etkin çalıştırma yönlendirme/iptal yardımcıları, OpenClaw araç köprüsü yardımcıları, çalışma zamanı planı araç ilkesi yardımcıları, terminal sonucu sınıflandırma, araç ilerleme biçimlendirme/ayrıntı yardımcıları ve deneme sonucu yardımcı programları |
    | `plugin-sdk/provider-zai-endpoint` | Kullanımdan kaldırılmış, Z.AI sağlayıcısına ait endpoint algılama cephesi; Z.AI Plugin genel API'sini kullanın |
    | `plugin-sdk/async-lock-runtime` | Küçük çalışma zamanı durum dosyaları için süreç yerel async kilit yardımcısı |
    | `plugin-sdk/channel-activity-runtime` | Kanal etkinliği telemetri yardımcısı |
    | `plugin-sdk/concurrency-runtime` | Sınırlı async görev eşzamanlılığı yardımcısı |
    | `plugin-sdk/dedupe-runtime` | Bellek içi tekilleştirme önbelleği yardımcıları |
    | `plugin-sdk/delivery-queue-runtime` | Giden bekleyen teslimat boşaltma yardımcısı |
    | `plugin-sdk/file-access-runtime` | Güvenli yerel dosya ve medya kaynağı yolu yardımcıları |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat uyandırma, olay ve görünürlük yardımcıları |
    | `plugin-sdk/number-runtime` | Sayısal dönüştürme yardımcısı |
    | `plugin-sdk/secure-random-runtime` | Güvenli belirteç/UUID yardımcıları |
    | `plugin-sdk/system-event-runtime` | Sistem olayı kuyruğu yardımcıları |
    | `plugin-sdk/transport-ready-runtime` | Taşıma hazır olma bekleme yardımcısı |
    | `plugin-sdk/infra-runtime` | Kullanımdan kaldırılmış uyumluluk shim'i; yukarıdaki odaklanmış çalışma zamanı alt yollarını kullanın |
    | `plugin-sdk/collection-runtime` | Küçük sınırlı önbellek yardımcıları |
    | `plugin-sdk/diagnostic-runtime` | Tanılama bayrağı, olay ve iz bağlamı yardımcıları |
    | `plugin-sdk/error-runtime` | Hata grafiği, biçimlendirme, paylaşılan hata sınıflandırma yardımcıları, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Sarmalanmış fetch, proxy, EnvHttpProxyAgent seçeneği ve sabitlenmiş arama yardımcıları |
    | `plugin-sdk/runtime-fetch` | Proxy/korumalı fetch içe aktarmaları olmadan dispatcher uyumlu çalışma zamanı fetch'i |
    | `plugin-sdk/response-limit-runtime` | Geniş medya çalışma zamanı yüzeyi olmadan sınırlı yanıt gövdesi okuyucu |
    | `plugin-sdk/session-binding-runtime` | Yapılandırılmış bağlama yönlendirmesi veya eşleştirme depoları olmadan geçerli konuşma bağlama durumu |
    | `plugin-sdk/session-store-runtime` | Geniş yapılandırma yazmaları/bakım içe aktarmaları olmadan oturum deposu yardımcıları |
    | `plugin-sdk/context-visibility-runtime` | Geniş yapılandırma/güvenlik içe aktarmaları olmadan bağlam görünürlüğü çözümleme ve ek bağlam filtreleme |
    | `plugin-sdk/string-coerce-runtime` | Markdown/günlükleme içe aktarmaları olmadan dar ilkel kayıt/dize dönüştürme ve normalleştirme yardımcıları |
    | `plugin-sdk/host-runtime` | Ana makine adı ve SCP ana makine normalleştirme yardımcıları |
    | `plugin-sdk/retry-runtime` | Yeniden deneme yapılandırması ve yeniden deneme çalıştırıcısı yardımcıları |
    | `plugin-sdk/agent-runtime` | `resolveAgentDir`, `resolveDefaultAgentDir` ve kullanımdan kaldırılmış `resolveOpenClawAgentDir` uyumluluk dışa aktarımı dahil aracı dizini/kimliği/çalışma alanı yardımcıları |
    | `plugin-sdk/directory-runtime` | Yapılandırma destekli dizin sorgusu/tekilleştirme |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Yetenek ve test alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Paylaşılan medya getirme/dönüştürme/depolama yardımcıları, ffprobe destekli video boyutu yoklama ve medya yükü oluşturucuları |
    | `plugin-sdk/media-mime` | Dar kapsamlı MIME normalleştirme, dosya uzantısı eşleme, MIME algılama ve medya türü yardımcıları |
    | `plugin-sdk/media-store` | `saveMediaBuffer` gibi dar kapsamlı medya deposu yardımcıları |
    | `plugin-sdk/media-generation-runtime` | Paylaşılan medya oluşturma failover yardımcıları, aday seçimi ve eksik model mesajları |
    | `plugin-sdk/media-understanding` | Medya anlama sağlayıcı türleri ve sağlayıcıya yönelik görüntü/ses yardımcısı dışa aktarımları |
    | `plugin-sdk/text-chunking` | Metin ve markdown parçalara ayırma/işleme yardımcıları, markdown tablo dönüştürme, yönerge etiketi çıkarma ve güvenli metin yardımcı programları |
    | `plugin-sdk/text-chunking` | Giden metin parçalara ayırma yardımcısı |
    | `plugin-sdk/speech` | Konuşma sağlayıcı türleri ve sağlayıcıya yönelik yönerge, kayıt defteri, doğrulama, OpenAI uyumlu TTS oluşturucu ve konuşma yardımcısı dışa aktarımları |
    | `plugin-sdk/speech-core` | Paylaşılan konuşma sağlayıcı türleri, kayıt defteri, yönerge, normalleştirme ve konuşma yardımcısı dışa aktarımları |
    | `plugin-sdk/realtime-transcription` | Gerçek zamanlı transkripsiyon sağlayıcı türleri, kayıt defteri yardımcıları ve paylaşılan WebSocket oturum yardımcısı |
    | `plugin-sdk/realtime-voice` | Gerçek zamanlı ses sağlayıcı türleri ve kayıt defteri yardımcıları |
    | `plugin-sdk/image-generation` | Görüntü oluşturma sağlayıcı türleri, görüntü varlığı/veri URL'si yardımcıları ve OpenAI uyumlu görüntü sağlayıcı oluşturucu |
    | `plugin-sdk/image-generation-core` | Paylaşılan görüntü oluşturma türleri, failover, kimlik doğrulama ve kayıt defteri yardımcıları |
    | `plugin-sdk/music-generation` | Müzik oluşturma sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/music-generation-core` | Paylaşılan müzik oluşturma türleri, failover yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
    | `plugin-sdk/video-generation` | Video oluşturma sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/video-generation-core` | Paylaşılan video oluşturma türleri, failover yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
    | `plugin-sdk/webhook-targets` | Webhook hedef kayıt defteri ve rota kurulum yardımcıları |
    | `plugin-sdk/webhook-path` | Kullanımdan kaldırılmış uyumluluk takma adı; `plugin-sdk/webhook-ingress` kullanın |
    | `plugin-sdk/web-media` | Paylaşılan uzak/yerel medya yükleme yardımcıları |
    | `plugin-sdk/zod` | Kullanımdan kaldırılmış uyumluluk yeniden dışa aktarımı; `zod` öğesini doğrudan `zod` üzerinden içe aktarın |
    | `plugin-sdk/testing` | Eski OpenClaw testleri için repo-yerel, kullanımdan kaldırılmış uyumluluk barrel'ı. Yeni repo testleri bunun yerine `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` veya `plugin-sdk/test-fixtures` gibi odaklı yerel test alt yollarını içe aktarmalıdır |
    | `plugin-sdk/plugin-test-api` | Repo test yardımcısı köprülerini içe aktarmadan doğrudan Plugin kaydı birim testleri için repo-yerel minimal `createTestPluginApi` yardımcısı |
    | `plugin-sdk/agent-runtime-test-contracts` | Kimlik doğrulama, teslim, fallback, tool-hook, prompt-overlay, şema ve transkript projeksiyonu testleri için repo-yerel yerel agent-runtime bağdaştırıcısı sözleşme fikstürleri |
    | `plugin-sdk/channel-test-helpers` | Genel eylemler/kurulum/durum sözleşmeleri, dizin doğrulamaları, hesap başlatma yaşam döngüsü, send-config iş parçacığı oluşturma, çalışma zamanı mock'ları, durum sorunları, giden teslim ve hook kaydı için repo-yerel kanal odaklı test yardımcıları |
    | `plugin-sdk/channel-target-testing` | Kanal testleri için repo-yerel paylaşılan hedef çözümleme hata durumu paketi |
    | `plugin-sdk/plugin-test-contracts` | Repo-yerel Plugin paketi, kayıt, herkese açık yapıt, doğrudan içe aktarma, çalışma zamanı API'si ve içe aktarma yan etkisi sözleşme yardımcıları |
    | `plugin-sdk/provider-test-contracts` | Repo-yerel sağlayıcı çalışma zamanı, kimlik doğrulama, keşif, onboarding, katalog, sihirbaz, medya yeteneği, yeniden oynatma ilkesi, gerçek zamanlı STT canlı ses, web-search/fetch ve akış sözleşmesi yardımcıları |
    | `plugin-sdk/provider-http-test-mocks` | `plugin-sdk/provider-http` üzerinde çalışan sağlayıcı testleri için repo-yerel isteğe bağlı Vitest HTTP/kimlik doğrulama mock'ları |
    | `plugin-sdk/test-fixtures` | Repo-yerel genel CLI çalışma zamanı yakalama, sandbox bağlamı, skill yazıcı, agent-message, system-event, modül yeniden yükleme, paketlenmiş Plugin yolu, terminal-text, chunking, auth-token ve typed-case fikstürleri |
    | `plugin-sdk/test-node-mocks` | Vitest `vi.mock("node:*")` fabrikaları içinde kullanım için repo-yerel odaklı Node yerleşik mock yardımcıları |
  </Accordion>

  <Accordion title="Bellek alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/memory-core` | Yönetici/yapılandırma/dosya/CLI yardımcıları için paketlenmiş memory-core yardımcısı yüzeyi |
    | `plugin-sdk/memory-core-engine-runtime` | Bellek dizini/arama çalışma zamanı cephesi |
    | `plugin-sdk/memory-core-host-engine-foundation` | Bellek host temel motor dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Bellek host embedding sözleşmeleri, kayıt defteri erişimi, yerel sağlayıcı ve genel toplu/uzak yardımcılar |
    | `plugin-sdk/memory-core-host-engine-qmd` | Bellek host QMD motor dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-storage` | Bellek host depolama motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-multimodal` | Bellek host çok modlu yardımcıları |
    | `plugin-sdk/memory-core-host-query` | Bellek host sorgu yardımcıları |
    | `plugin-sdk/memory-core-host-secret` | Bellek host secret yardımcıları |
    | `plugin-sdk/memory-core-host-events` | Kullanımdan kaldırılmış uyumluluk takma adı; `plugin-sdk/memory-host-events` kullanın |
    | `plugin-sdk/memory-core-host-status` | Bellek host durum yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-cli` | Bellek host CLI çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-core` | Bellek host core çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-files` | Bellek host dosya/çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-host-core` | Bellek host core çalışma zamanı yardımcıları için satıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-host-events` | Bellek host olay günlüğü yardımcıları için satıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-host-files` | Kullanımdan kaldırılmış uyumluluk takma adı; `plugin-sdk/memory-core-host-runtime-files` kullanın |
    | `plugin-sdk/memory-host-markdown` | Belleğe bitişik Plugin'ler için paylaşılan yönetilen markdown yardımcıları |
    | `plugin-sdk/memory-host-search` | Arama yöneticisi erişimi için Active Memory çalışma zamanı cephesi |
    | `plugin-sdk/memory-host-status` | Kullanımdan kaldırılmış uyumluluk takma adı; `plugin-sdk/memory-core-host-status` kullanın |
  </Accordion>

  <Accordion title="Ayrılmış paketlenmiş-yardımcı alt yolları">
    Şu anda ayrılmış paketlenmiş-yardımcı SDK alt yolu yoktur. Owner'a özgü
    yardımcılar sahibi Plugin paketinin içinde bulunurken, yeniden kullanılabilir host sözleşmeleri
    `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` ve `plugin-sdk/plugin-config-runtime` gibi genel SDK alt yollarını kullanır.
  </Accordion>
</AccordionGroup>

## İlgili

- [Plugin SDK genel bakışı](/tr/plugins/sdk-overview)
- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)

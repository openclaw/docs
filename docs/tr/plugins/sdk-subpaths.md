---
read_when:
    - Bir Plugin içe aktarması için doğru plugin-sdk alt yolunu seçme
    - Paketlenmiş Plugin alt yollarını ve yardımcı yüzeyleri denetleme
summary: 'Plugin SDK alt yol kataloğu: hangi içe aktarmaların nerede bulunduğu, alana göre gruplandırılmış'
title: Plugin SDK alt yolları
x-i18n:
    generated_at: "2026-07-01T08:29:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 689af6c9c17eb6b3231c5f445d7de0af97d1a8a087bdbc26640851d4b11ada2b
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK, `openclaw/plugin-sdk/` altında dar genel alt yollar kümesi olarak sunulur. Bu sayfa, yaygın kullanılan alt yolları amaca göre gruplayarak kataloglar. Üretilen derleyici giriş noktası envanteri `scripts/lib/plugin-sdk-entrypoints.json` dosyasında bulunur; paket dışa aktarımları, `scripts/lib/plugin-sdk-private-local-only-subpaths.json` içinde listelenen repo-yerel test/dahili alt yollar çıkarıldıktan sonraki genel alt kümedir. Bakımcılar genel dışa aktarım sayısını `pnpm plugin-sdk:surface` ile, etkin ayrılmış yardımcı alt yolları ise `pnpm plugins:boundary-report:summary` ile denetleyebilir; kullanılmayan ayrılmış yardımcı dışa aktarımları, genel SDK'da atıl uyumluluk borcu olarak kalmak yerine CI raporunun başarısız olmasına neden olur.

Plugin yazma kılavuzu için bkz. [Plugin SDK genel bakışı](/tr/plugins/sdk-overview).

## Plugin girişi

| Alt yol                        | Temel dışa aktarımlar                                                                                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | `createMigrationItem` gibi migration sağlayıcı öğesi yardımcıları, neden sabitleri, öğe durum işaretleyicileri, redaksiyon yardımcıları ve `summarizeMigrationItems`    |
| `plugin-sdk/migration-runtime` | `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` ve `writeMigrationReport` gibi runtime migration yardımcıları                                              |
| `plugin-sdk/health`            | Paketli sağlık tüketicileri için Doctor sağlık denetimi kaydı, algılama, onarım, seçim, önem derecesi ve bulgu türleri                                                |

### Kullanımdan kaldırılmış uyumluluk ve test yardımcıları

Kullanımdan kaldırılmış alt yollar eski Plugin'ler için dışa aktarılmaya devam eder, ancak yeni kod aşağıdaki odaklanmış SDK alt yollarını kullanmalıdır. Bakımı yapılan liste `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` içindedir; CI, paketli üretim içe aktarımlarını bu listeden reddeder. `compat`, `config-types`, `infra-runtime`, `text-runtime` ve `zod` gibi geniş barrel'lar yalnızca uyumluluk içindir. `zod` öğesini doğrudan `zod` içinden içe aktarın.

OpenClaw'ın Vitest destekli test-yardımcısı alt yolları yalnızca repo-yereldir ve artık paket dışa aktarımları değildir: `agent-runtime-test-contracts`, `channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`, `plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks` ve `testing`.

### Ayrılmış paketli Plugin yardımcı alt yolları

Bu alt yollar, genel SDK API'leri değil, sahipleri olan paketli Plugin için Plugin'e ait uyumluluk yüzeyleridir: `plugin-sdk/codex-mcp-projection` ve `plugin-sdk/codex-native-task-runtime`. Sahipler arası eklenti içe aktarımları, paket sözleşmesi koruma mekanizmaları tarafından engellenir.

<AccordionGroup>
  <Accordion title="Channel subpaths">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Kök `openclaw.json` Zod şeması dışa aktarımı (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Plugin sahipli şemalar için önbelleğe alınmış JSON Schema doğrulama yardımcısı |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ayrıca `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Paylaşılan kurulum sihirbazı yardımcıları, kurulum çeviricisi, izin listesi istemleri, kurulum durumu oluşturucuları |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Kullanımdan kaldırılmış uyumluluk takma adı; `plugin-sdk/setup-runtime` kullanın |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Çok hesaplı yapılandırma/eylem geçidi yardımcıları, varsayılan hesap geri dönüş yardımcıları |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, hesap kimliği normalleştirme yardımcıları |
    | `plugin-sdk/account-resolution` | Hesap arama + varsayılan geri dönüş yardımcıları |
    | `plugin-sdk/account-helpers` | Dar hesap listesi/hesap eylemi yardımcıları |
    | `plugin-sdk/access-groups` | Erişim grubu izin listesi ayrıştırma ve redakte edilmiş grup tanılama yardımcıları |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Kullanımdan kaldırılmış uyumluluk cephesi. `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Paylaşılan kanal yapılandırma şeması ilkelleri, ayrıca Zod ve doğrudan JSON/TypeBox oluşturucuları |
    | `plugin-sdk/bundled-channel-config-schema` | Yalnızca bakımı sürdürülen paketli Plugin'ler için paketli OpenClaw kanal yapılandırma şemaları |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Kendi tablolarını sabit kodlamadan zarf önekli metni tanıması gereken Plugin'ler için kanonik paketli/resmi sohbet kanalı kimlikleri, ayrıca biçimlendirici etiketleri/takma adları. |
    | `plugin-sdk/channel-config-schema-legacy` | Paketli kanal yapılandırma şemaları için kullanımdan kaldırılmış uyumluluk takma adı |
    | `plugin-sdk/telegram-command-config` | Paketli sözleşme geri dönüşüyle Telegram özel komut normalleştirme/doğrulama yardımcıları |
    | `plugin-sdk/command-gating` | Dar komut yetkilendirme geçidi yardımcıları |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Kullanımdan kaldırılmış düşük düzey kanal giriş uyumluluk cephesi. Yeni alma yolları `plugin-sdk/channel-ingress-runtime` kullanmalıdır. |
    | `plugin-sdk/channel-ingress-runtime` | Taşınmış kanal alma yolları için deneysel yüksek düzey kanal giriş çalışma zamanı çözümleyicisi ve rota olgu oluşturucuları. Her Plugin'de etkili izin listeleri, komut izin listeleri ve eski projeksiyonları birleştirmek yerine bunu tercih edin. Bkz. [Kanal girişi API'si](/tr/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Kullanımdan kaldırılmış uyumluluk cephesi. `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/channel-outbound` | Mesaj yaşam döngüsü sözleşmeleri, ayrıca yanıt işlem hattı seçenekleri, alındılar, canlı önizleme/akış, yaşam döngüsü yardımcıları, giden kimlik, yük planlama, kalıcı gönderimler ve mesaj gönderme bağlamı yardımcıları. Bkz. [Kanal çıkışı API'si](/tr/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | `plugin-sdk/channel-outbound` için kullanımdan kaldırılmış uyumluluk takma adı, ayrıca eski yanıt gönderim cepheleri. |
    | `plugin-sdk/channel-message-runtime` | `plugin-sdk/channel-outbound` için kullanımdan kaldırılmış uyumluluk takma adı, ayrıca eski yanıt gönderim cepheleri. |
    | `plugin-sdk/inbound-envelope` | Paylaşılan gelen rota + zarf oluşturucu yardımcıları |
    | `plugin-sdk/inbound-reply-dispatch` | Kullanımdan kaldırılmış uyumluluk cephesi. Gelen çalıştırıcılar ve gönderim yüklemleri için `plugin-sdk/channel-inbound`, mesaj teslim yardımcıları için `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/messaging-targets` | Kullanımdan kaldırılmış hedef ayrıştırma takma adı; `plugin-sdk/channel-targets` kullanın |
    | `plugin-sdk/outbound-media` | Paylaşılan giden medya yükleme ve barındırılan medya durumu yardımcıları |
    | `plugin-sdk/outbound-send-deps` | Kullanımdan kaldırılmış uyumluluk cephesi. `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/outbound-runtime` | Kullanımdan kaldırılmış uyumluluk cephesi. `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/poll-runtime` | Dar anket normalleştirme yardımcıları |
    | `plugin-sdk/thread-bindings-runtime` | İş parçacığı bağlama yaşam döngüsü ve adaptör yardımcıları |
    | `plugin-sdk/agent-media-payload` | Eski ajan medya yükü oluşturucu |
    | `plugin-sdk/conversation-runtime` | Konuşma/iş parçacığı bağlama, eşleştirme ve yapılandırılmış bağlama yardımcıları |
    | `plugin-sdk/runtime-config-snapshot` | Çalışma zamanı yapılandırma anlık görüntüsü yardımcısı |
    | `plugin-sdk/runtime-group-policy` | Çalışma zamanı grup ilkesi çözümleme yardımcıları |
    | `plugin-sdk/channel-status` | Paylaşılan kanal durumu anlık görüntü/özet yardımcıları |
    | `plugin-sdk/channel-config-primitives` | Dar kanal yapılandırma şeması ilkelleri |
    | `plugin-sdk/channel-config-writes` | Kanal yapılandırma yazma yetkilendirme yardımcıları |
    | `plugin-sdk/channel-plugin-common` | Paylaşılan kanal Plugin giriş dışa aktarımları |
    | `plugin-sdk/allowlist-config-edit` | İzin listesi yapılandırmasını düzenleme/okuma yardımcıları |
    | `plugin-sdk/group-access` | Paylaşılan grup erişimi karar yardımcıları |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Kullanımdan kaldırılmış uyumluluk cepheleri. `plugin-sdk/channel-inbound` kullanın. |
    | `plugin-sdk/direct-dm-guard-policy` | Dar doğrudan DM kripto öncesi koruma ilkesi yardımcıları |
    | `plugin-sdk/discord` | Yayınlanmış `@openclaw/discord@2026.3.13` ve izlenen sahip uyumluluğu için kullanımdan kaldırılmış Discord uyumluluk cephesi; yeni Plugin'ler genel kanal SDK alt yollarını kullanmalıdır |
    | `plugin-sdk/telegram-account` | İzlenen sahip uyumluluğu için kullanımdan kaldırılmış Telegram hesap çözümleme uyumluluk cephesi; yeni Plugin'ler enjekte edilen çalışma zamanı yardımcılarını veya genel kanal SDK alt yollarını kullanmalıdır |
    | `plugin-sdk/zalouser` | Hâlâ gönderen komut yetkilendirmesini içe aktaran yayınlanmış Lark/Zalo paketleri için kullanımdan kaldırılmış Zalo Personal uyumluluk cephesi; yeni Plugin'ler `plugin-sdk/command-auth` kullanmalıdır |
    | `plugin-sdk/interactive-runtime` | Anlamsal mesaj sunumu, teslimi ve eski etkileşimli yanıt yardımcıları. Bkz. [Mesaj Sunumu](/tr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Olay sınıflandırma, bağlam oluşturma, biçimlendirme, kökler, debounce, bahsetme eşleştirme, bahsetme ilkesi ve gelen günlükleme için paylaşılan gelen yardımcıları |
    | `plugin-sdk/channel-inbound-debounce` | Dar gelen debounce yardımcıları |
    | `plugin-sdk/channel-mention-gating` | Daha geniş gelen çalışma zamanı yüzeyi olmadan dar bahsetme ilkesi, bahsetme işaretçisi ve bahsetme metni yardımcıları |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Kullanımdan kaldırılmış uyumluluk cepheleri. `plugin-sdk/channel-inbound` veya `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/channel-pairing-paths` | Kullanımdan kaldırılmış uyumluluk cephesi. `plugin-sdk/channel-pairing` kullanın. |
    | `plugin-sdk/channel-reply-options-runtime` | Kullanımdan kaldırılmış uyumluluk cephesi. `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/channel-streaming` | Kullanımdan kaldırılmış uyumluluk cephesi. `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/channel-send-result` | Yanıt sonucu türleri |
    | `plugin-sdk/channel-actions` | Kanal mesaj eylemi yardımcıları, ayrıca Plugin uyumluluğu için tutulan kullanımdan kaldırılmış yerel şema yardımcıları |
    | `plugin-sdk/channel-route` | Paylaşılan rota normalleştirme, ayrıştırıcı odaklı hedef çözümleme, iş parçacığı kimliği dizgeleştirme, tekilleştirme/kompakt rota anahtarları, ayrıştırılmış hedef türleri ve rota/hedef karşılaştırma yardımcıları |
    | `plugin-sdk/channel-targets` | Hedef ayrıştırma yardımcıları; rota karşılaştırma çağırıcıları `plugin-sdk/channel-route` kullanmalıdır |
    | `plugin-sdk/channel-contract` | Kanal sözleşmesi türleri |
    | `plugin-sdk/channel-feedback` | Geri bildirim/tepki bağlantıları |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` gibi dar gizli sözleşme yardımcıları ve gizli hedef türleri |
  </Accordion>

Kullanımdan kaldırılmış kanal yardımcı aileleri yalnızca yayınlanmış Plugin
uyumluluğu için kullanılabilir kalır. Kaldırma planı şudur: dış Plugin
taşıma penceresi boyunca bunları tutmak, depo/paketli Plugin'leri `channel-inbound` ve
`channel-outbound` üzerinde tutmak, ardından bir sonraki büyük
SDK temizliğinde uyumluluk alt yollarını kaldırmak. Bu; eski kanal mesajı/çalışma zamanı, kanal
akışı, doğrudan DM erişimi, gelen yardımcı parçaları, yanıt seçenekleri
ve eşleştirme yolu aileleri için geçerlidir.

  <Accordion title="Sağlayıcı alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Kurulum, katalog keşfi ve çalışma zamanı model hazırlığı için desteklenen LM Studio sağlayıcı facade'ı |
    | `plugin-sdk/lmstudio-runtime` | Yerel sunucu varsayılanları, model keşfi, istek üstbilgileri ve yüklü model yardımcıları için desteklenen LM Studio çalışma zamanı facade'ı |
    | `plugin-sdk/provider-setup` | Derlenmiş yerel/kendi barındırılan sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/self-hosted-provider-setup` | Odaklı OpenAI uyumlu kendi barındırılan sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/cli-backend` | CLI arka uç varsayılanları + watchdog sabitleri |
    | `plugin-sdk/provider-auth-runtime` | Sağlayıcı Plugin'leri için çalışma zamanı API anahtarı çözümleme yardımcıları |
    | `plugin-sdk/provider-oauth-runtime` | Genel sağlayıcı OAuth geri çağırma türleri, geri çağırma sayfası işleme, PKCE/durum yardımcıları, yetkilendirme girdisi ayrıştırma, token süre sonu yardımcıları ve iptal yardımcıları |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` gibi API anahtarı ilk kurulum/profil yazma yardımcıları |
    | `plugin-sdk/provider-auth-result` | Standart OAuth kimlik doğrulama sonucu oluşturucu |
    | `plugin-sdk/provider-env-vars` | Sağlayıcı kimlik doğrulama ortam değişkeni arama yardımcıları |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, OpenAI Codex kimlik doğrulama içe aktarma yardımcıları, kullanımdan kaldırılmış `resolveOpenClawAgentDir` uyumluluk dışa aktarımı |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan replay politikası oluşturucuları, sağlayıcı uç noktası yardımcıları ve paylaşılan model kimliği normalleştirme yardımcıları |
    | `plugin-sdk/provider-catalog-live-runtime` | Korumalı `/models` tarzı keşif için canlı sağlayıcı model kataloğu yardımcıları: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, model kimliği filtreleme, TTL önbelleği ve statik geri dönüş |
    | `plugin-sdk/provider-catalog-runtime` | Sağlayıcı katalog genişletme çalışma zamanı kancası ve sözleşme testleri için Plugin-sağlayıcı kayıt seam'leri |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Genel sağlayıcı HTTP/uç nokta yetenek yardımcıları, sağlayıcı HTTP hataları ve ses transkripsiyonu multipart form yardımcıları |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` ve `WebFetchProviderPlugin` gibi dar web-fetch yapılandırma/seçim sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-fetch` | Web-fetch sağlayıcı kayıt/önbellek yardımcıları |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin etkinleştirme bağlantısına ihtiyaç duymayan sağlayıcılar için dar web-search yapılandırma/kimlik bilgisi yardımcıları |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` ve kapsamlı kimlik bilgisi ayarlayıcıları/alıcıları gibi dar web-search yapılandırma/kimlik bilgisi sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-search` | Web-search sağlayıcı kayıt/önbellek/çalışma zamanı yardımcıları |
    | `plugin-sdk/embedding-providers` | `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` ve `listEmbeddingProviders(...)` dahil genel embedding sağlayıcı türleri ve okuma yardımcıları; manifest sahipliğinin zorunlu kılınması için Plugin'ler sağlayıcıları `api.registerEmbeddingProvider(...)` üzerinden kaydeder |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` ve DeepSeek/Gemini/OpenAI şema temizleme + tanılama |
    | `plugin-sdk/provider-usage` | Sağlayıcı kullanım anlık görüntüsü türleri, paylaşılan kullanım getirme yardımcıları ve `fetchClaudeUsage` gibi sağlayıcı getiriciler |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, stream wrapper türleri, düz metin tool-call uyumluluğu ve paylaşılan Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper yardımcıları |
    | `plugin-sdk/provider-stream-shared` | `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` ve Anthropic/DeepSeek/OpenAI uyumlu stream yardımcı programları dahil genel paylaşılan sağlayıcı stream wrapper yardımcıları |
    | `plugin-sdk/provider-transport-runtime` | Korumalı fetch, araç sonucu metin çıkarma, taşıma mesajı dönüşümleri ve yazılabilir taşıma olay stream'leri gibi yerel sağlayıcı taşıma yardımcıları |
    | `plugin-sdk/provider-onboard` | İlk kurulum yapılandırma yaması yardımcıları |
    | `plugin-sdk/global-singleton` | Süreç yerel singleton/map/önbellek yardımcıları |
    | `plugin-sdk/group-activation` | Dar grup etkinleştirme modu ve komut ayrıştırma yardımcıları |
  </Accordion>

Sağlayıcı kullanım anlık görüntüleri normalde bir veya daha fazla kota `windows`
bildirir; her birinde bir etiket, kullanılan yüzde ve isteğe bağlı sıfırlama zamanı
bulunur. Sıfırlanabilir kota pencereleri yerine bakiye veya hesap durumu metni
sunan sağlayıcılar, yüzde uydurmak yerine boş bir `windows` dizisiyle birlikte
`summary` döndürmelidir. OpenClaw bu özet metnini durum çıktısında gösterir;
`error` yalnızca kullanım uç noktası başarısız olduğunda veya kullanılabilir
kullanım verisi döndürmediğinde kullanılmalıdır.

  <Accordion title="Kimlik doğrulama ve güvenlik alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, dinamik argüman menüsü biçimlendirme dahil komut kayıt yardımcıları, gönderen yetkilendirme yardımcıları |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` ve `buildHelpMessage` gibi komut/yardım mesajı oluşturucuları |
    | `plugin-sdk/approval-auth-runtime` | Onaylayan çözümleme ve aynı sohbet eylem kimlik doğrulama yardımcıları |
    | `plugin-sdk/approval-client-runtime` | Yerel exec onay profili/filtre yardımcıları |
    | `plugin-sdk/approval-delivery-runtime` | Yerel onay yetenek/teslimat adaptörleri |
    | `plugin-sdk/approval-gateway-runtime` | Paylaşılan onay Gateway çözümleme yardımcısı |
    | `plugin-sdk/approval-handler-adapter-runtime` | Sıcak kanal giriş noktaları için hafif yerel onay adaptörü yükleme yardımcıları |
    | `plugin-sdk/approval-handler-runtime` | Daha geniş onay işleyici çalışma zamanı yardımcıları; yeterli olduklarında daha dar adaptör/Gateway seam'lerini tercih edin |
    | `plugin-sdk/approval-native-runtime` | Yerel onay hedefi, hesap bağlama, rota kapısı, yönlendirme geri dönüşü ve yerel yerel exec istemi bastırma yardımcıları |
    | `plugin-sdk/approval-reaction-runtime` | Sabit kodlanmış onay tepki bağlamaları, tepki istemi yükleri, tepki hedef depoları ve yerel yerel exec istemi bastırma için uyumluluk dışa aktarımı |
    | `plugin-sdk/approval-reply-runtime` | Exec/Plugin onay yanıtı yük yardımcıları |
    | `plugin-sdk/approval-runtime` | Exec/Plugin onay yük yardımcıları, yerel onay yönlendirme/çalışma zamanı yardımcıları ve `formatApprovalDisplayPath` gibi yapılandırılmış onay görüntüleme yardımcıları |
    | `plugin-sdk/reply-dedupe` | Dar gelen yanıt dedupe sıfırlama yardımcıları |
    | `plugin-sdk/channel-contract-testing` | Geniş test barrel'ı olmadan dar kanal sözleşmesi test yardımcıları |
    | `plugin-sdk/command-auth-native` | Yerel komut kimlik doğrulaması, dinamik argüman menüsü biçimlendirme ve yerel oturum hedefi yardımcıları |
    | `plugin-sdk/command-detection` | Paylaşılan komut algılama yardımcıları |
    | `plugin-sdk/command-primitives-runtime` | Sıcak kanal yolları için hafif komut metni predicate'leri |
    | `plugin-sdk/command-surface` | Komut gövdesi normalleştirme ve komut yüzeyi yardımcıları |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Kanal/Plugin gizli bilgi yüzeyleri için dar gizli bilgi sözleşmesi toplama yardımcıları |
    | `plugin-sdk/secret-ref-runtime` | Gizli bilgi sözleşmesi/yapılandırma ayrıştırması için dar `coerceSecretRef` ve SecretRef türleme yardımcıları |
    | `plugin-sdk/secret-provider-integration` | Harici gizli bilgi sağlayıcı ön ayarları yayımlayan Plugin'ler için yalnızca tür SecretRef sağlayıcı entegrasyon manifest'i ve ön ayar sözleşmeleri |
    | `plugin-sdk/security-runtime` | Paylaşılan güven, DM kapılama, yalnızca oluşturma yazmaları dahil kökle sınırlı dosya/yol yardımcıları, senkron/asenkron atomik dosya değiştirme, kardeş geçici yazmalar, cihazlar arası taşıma geri dönüşü, özel dosya deposu yardımcıları, symlink üst dizin korumaları, harici içerik, hassas metin redaksiyonu, sabit zamanlı gizli bilgi karşılaştırması ve gizli bilgi toplama yardımcıları |
    | `plugin-sdk/ssrf-policy` | Ana makine izin listesi ve özel ağ SSRF politikası yardımcıları |
    | `plugin-sdk/ssrf-dispatcher` | Geniş altyapı çalışma zamanı yüzeyi olmadan dar sabitlenmiş dispatcher yardımcıları |
    | `plugin-sdk/ssrf-runtime` | Sabitlenmiş dispatcher, SSRF korumalı fetch, SSRF hatası ve SSRF politikası yardımcıları |
    | `plugin-sdk/secret-input` | Gizli bilgi girdisi ayrıştırma yardımcıları |
    | `plugin-sdk/webhook-ingress` | Webhook istek/hedef yardımcıları ve ham websocket/gövde dönüştürme |
    | `plugin-sdk/webhook-request-guards` | İstek gövdesi boyutu/zaman aşımı yardımcıları |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/runtime` | Geniş çalışma zamanı/günlükleme/yedekleme/plugin-kurulum yardımcıları |
    | `plugin-sdk/runtime-env` | Dar çalışma zamanı ortamı, günlükleyici, zaman aşımı, yeniden deneme ve geri çekilme yardımcıları |
    | `plugin-sdk/browser-config` | Normalize edilmiş profil/varsayılanlar, CDP URL ayrıştırma ve tarayıcı denetimi kimlik doğrulama yardımcıları için desteklenen tarayıcı yapılandırma cephesi |
    | `plugin-sdk/agent-harness-task-runtime` | Ana makine tarafından verilmiş görev kapsamı kullanan harness destekli ajanlar için genel görev yaşam döngüsü ve tamamlanma teslimi yardımcıları |
    | `plugin-sdk/codex-mcp-projection` | Kullanıcı MCP sunucu yapılandırmasını Codex iş parçacığı yapılandırmasına yansıtmak için ayrılmış paketli Codex yardımcısı; üçüncü taraf Plugin'ler için değildir |
    | `plugin-sdk/codex-native-task-runtime` | Yerel görev aynalama/çalışma zamanı kablolaması için özel paketli Codex yardımcısı; üçüncü taraf Plugin'ler için değildir |
    | `plugin-sdk/channel-runtime-context` | Genel kanal çalışma zamanı bağlamı kaydı ve arama yardımcıları |
    | `plugin-sdk/matrix` | Eski üçüncü taraf kanal paketleri için kullanımdan kaldırılmış Matrix uyumluluk cephesi; yeni Plugin'ler doğrudan `plugin-sdk/run-command` içe aktarmalıdır |
    | `plugin-sdk/mattermost` | Eski üçüncü taraf kanal paketleri için kullanımdan kaldırılmış Mattermost uyumluluk cephesi; yeni Plugin'ler genel SDK alt yollarını doğrudan içe aktarmalıdır |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Paylaşılan plugin komut/hook/http/etkileşimli yardımcıları |
    | `plugin-sdk/hook-runtime` | Paylaşılan webhook/dahili hook işlem hattı yardımcıları |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod` ve `createLazyRuntimeSurface` gibi tembel çalışma zamanı içe aktarma/bağlama yardımcıları |
    | `plugin-sdk/process-runtime` | Süreç exec yardımcıları |
    | `plugin-sdk/cli-runtime` | CLI biçimlendirme, bekleme, sürüm, argümanla çağırma ve tembel komut grubu yardımcıları |
    | `plugin-sdk/qa-live-transport-scenarios` | Paylaşılan canlı taşıma QA senaryo kimlikleri, temel kapsam yardımcıları ve senaryo seçimi yardımcısı |
    | `plugin-sdk/gateway-method-runtime` | `contracts.gatewayMethodDispatch: ["authenticated-request"]` bildiren plugin HTTP rotaları için ayrılmış Gateway yöntemi yönlendirme yardımcısı |
    | `plugin-sdk/gateway-runtime` | Gateway istemcisi, olay döngüsüne hazır istemci başlatma yardımcısı, gateway CLI RPC, gateway protokol hataları ve kanal durumu yama yardımcıları |
    | `plugin-sdk/config-contracts` | `OpenClawConfig` ve kanal/sağlayıcı yapılandırma türleri gibi plugin yapılandırma şekilleri için odaklı, yalnızca tür yapılandırma yüzeyi |
    | `plugin-sdk/plugin-config-runtime` | `requireRuntimeConfig`, `resolvePluginConfigObject` ve `resolveLivePluginConfigObject` gibi çalışma zamanı plugin yapılandırması arama yardımcıları |
    | `plugin-sdk/config-mutation` | `mutateConfigFile`, `replaceConfigFile` ve `logConfigUpdated` gibi işlemsel yapılandırma mutasyonu yardımcıları |
    | `plugin-sdk/message-tool-delivery-hints` | Paylaşılan ileti aracı teslim meta verisi ipucu dizeleri |
    | `plugin-sdk/runtime-config-snapshot` | `getRuntimeConfig`, `getRuntimeConfigSnapshot` ve test anlık görüntüsü ayarlayıcıları gibi geçerli süreç yapılandırma anlık görüntüsü yardımcıları |
    | `plugin-sdk/telegram-command-config` | Paketli Telegram sözleşme yüzeyi kullanılamadığında bile Telegram komut adı/açıklama normalizasyonu ve yinelenen/çakışma denetimleri |
    | `plugin-sdk/text-autolink-runtime` | Geniş metin barrel'ı olmadan dosya başvurusu otomatik bağlantı algılama |
    | `plugin-sdk/approval-reaction-runtime` | Sabit kodlanmış onay tepki bağlamaları, tepki istemi yükleri, tepki hedef depoları ve yerel yerel exec istemi bastırma için uyumluluk dışa aktarımı |
    | `plugin-sdk/approval-runtime` | Exec/plugin onay yardımcıları, onay yeteneği oluşturucuları, kimlik doğrulama/profil yardımcıları, yerel yönlendirme/çalışma zamanı yardımcıları ve yapılandırılmış onay görüntüleme yolu biçimlendirmesi |
    | `plugin-sdk/reply-runtime` | Paylaşılan gelen/yanıt çalışma zamanı yardımcıları, parçalara ayırma, yönlendirme, heartbeat, yanıt planlayıcı |
    | `plugin-sdk/reply-dispatch-runtime` | Dar yanıt yönlendirme/sonlandırma ve konuşma etiketi yardımcıları |
    | `plugin-sdk/reply-history` | Paylaşılan kısa pencereli yanıt geçmişi yardımcıları. Yeni ileti turu kodu `createChannelHistoryWindow` kullanmalıdır; daha düşük seviyeli harita yardımcıları yalnızca kullanımdan kaldırılmış uyumluluk dışa aktarımları olarak kalır |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Dar metin/markdown parçalara ayırma yardımcıları |
    | `plugin-sdk/session-store-runtime` | Oturum iş akışı yardımcıları (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), oturum kimliğine göre sınırlandırılmış son kullanıcı/asistan transkript metni okumaları, eski oturum deposu yolu/oturum anahtarı yardımcıları, updated-at okumaları ve yalnızca geçiş amaçlı tüm-depo/dosya-yolu uyumluluk yardımcıları |
    | `plugin-sdk/session-transcript-runtime` | Transkript kimliği, kapsamlı hedef/okuma/yazma yardımcıları, güncelleme yayımlama, yazma kilitleri ve transkript bellek isabet anahtarları |
    | `plugin-sdk/sqlite-runtime` | Birinci taraf çalışma zamanı için odaklı SQLite ajan şeması, yol ve işlem yardımcıları |
    | `plugin-sdk/cron-store-runtime` | Cron deposu yol/yükleme/kaydetme yardımcıları |
    | `plugin-sdk/state-paths` | Durum/OAuth dizin yolu yardımcıları |
    | `plugin-sdk/plugin-state-runtime` | Plugin yan SQLite anahtarlı durum türleri ile plugin sahipli veritabanları için merkezi bağlantı pragma ve WAL bakım kurulumu |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey` ve `resolveDefaultAgentBoundAccountId` gibi rota/oturum anahtarı/hesap bağlama yardımcıları |
    | `plugin-sdk/status-helpers` | Paylaşılan kanal/hesap durum özeti yardımcıları, çalışma zamanı durumu varsayılanları ve sorun meta verisi yardımcıları |
    | `plugin-sdk/target-resolver-runtime` | Paylaşılan hedef çözümleyici yardımcıları |
    | `plugin-sdk/string-normalization-runtime` | Slug/dize normalizasyon yardımcıları |
    | `plugin-sdk/request-url` | fetch/istek benzeri girdilerden dize URL'leri çıkarma |
    | `plugin-sdk/run-command` | Normalize edilmiş stdout/stderr sonuçlarıyla süreli komut çalıştırıcı |
    | `plugin-sdk/param-readers` | Ortak araç/CLI parametre okuyucuları |
    | `plugin-sdk/tool-plugin` | Basit tipli ajan aracı plugin'i tanımlama ve manifest üretimi için statik meta verileri açığa çıkarma |
    | `plugin-sdk/tool-payload` | Araç sonuç nesnelerinden normalize edilmiş yükleri çıkarma |
    | `plugin-sdk/tool-send` | Araç argümanlarından kanonik gönderim hedef alanlarını çıkarma |
    | `plugin-sdk/sandbox` | Fail-fast exec komutu ön denetimi dahil sandbox arka uç türleri ve SSH/OpenShell komut yardımcıları |
    | `plugin-sdk/temp-path` | Paylaşılan geçici indirme yolu yardımcıları ve özel güvenli geçici çalışma alanları |
    | `plugin-sdk/logging-core` | Alt sistem günlükleyicisi ve redaksiyon yardımcıları |
    | `plugin-sdk/markdown-table-runtime` | Markdown tablo modu ve dönüştürme yardımcıları |
    | `plugin-sdk/model-session-runtime` | `applyModelOverrideToSessionEntry` ve `resolveAgentMaxConcurrent` gibi model/oturum geçersiz kılma yardımcıları |
    | `plugin-sdk/talk-config-runtime` | Konuşma sağlayıcısı yapılandırma çözümleme yardımcıları |
    | `plugin-sdk/json-store` | Küçük JSON durum okuma/yazma yardımcıları |
    | `plugin-sdk/json-unsafe-integers` | Güvenli olmayan tam sayı literallerini dize olarak koruyan JSON ayrıştırma yardımcıları |
    | `plugin-sdk/file-lock` | Yeniden girilebilir dosya kilidi yardımcıları |
    | `plugin-sdk/persistent-dedupe` | Disk destekli tekilleştirme önbelleği yardımcıları |
    | `plugin-sdk/acp-runtime` | ACP çalışma zamanı/oturum ve yanıt yönlendirme yardımcıları |
    | `plugin-sdk/acp-runtime-backend` | Başlangıçta yüklenen Plugin'ler için hafif ACP arka uç kaydı ve yanıt yönlendirme yardımcıları |
    | `plugin-sdk/acp-binding-resolve-runtime` | Yaşam döngüsü başlangıç içe aktarmaları olmadan salt okunur ACP bağlama çözümlemesi |
    | `plugin-sdk/agent-config-primitives` | Dar ajan çalışma zamanı yapılandırma şeması temel öğeleri |
    | `plugin-sdk/boolean-param` | Gevşek boolean parametre okuyucu |
    | `plugin-sdk/dangerous-name-runtime` | Tehlikeli ad eşleştirme çözümleme yardımcıları |
    | `plugin-sdk/device-bootstrap` | Cihaz bootstrap ve eşleştirme token yardımcıları |
    | `plugin-sdk/extension-shared` | Paylaşılan pasif kanal, durum ve ortam proxy yardımcı temel öğeleri |
    | `plugin-sdk/models-provider-runtime` | `/models` komutu/sağlayıcı yanıt yardımcıları |
    | `plugin-sdk/skill-commands-runtime` | Skill komutu listeleme yardımcıları |
    | `plugin-sdk/native-command-registry` | Yerel komut kayıt/oluşturma/serileştirme yardımcıları |
    | `plugin-sdk/agent-harness` | Düşük seviyeli ajan harness'ları için deneysel güvenilir-plugin yüzeyi: harness türleri, etkin çalıştırma yönlendirme/iptal yardımcıları, OpenClaw araç köprüsü yardımcıları, çalışma zamanı planı araç politikası yardımcıları, terminal sonucu sınıflandırması, araç ilerleme biçimlendirme/ayrıntı yardımcıları ve deneme sonucu yardımcı araçları |
    | `plugin-sdk/provider-zai-endpoint` | Kullanımdan kaldırılmış Z.AI sağlayıcı sahipli endpoint algılama cephesi; Z.AI plugin genel API'sini kullanın |
    | `plugin-sdk/async-lock-runtime` | Küçük çalışma zamanı durum dosyaları için süreç yerel async kilit yardımcısı |
    | `plugin-sdk/channel-activity-runtime` | Kanal etkinliği telemetri yardımcısı |
    | `plugin-sdk/concurrency-runtime` | Sınırlı async görev eşzamanlılığı yardımcısı |
    | `plugin-sdk/dedupe-runtime` | Bellek içi tekilleştirme önbelleği yardımcıları |
    | `plugin-sdk/delivery-queue-runtime` | Giden bekleyen teslimat boşaltma yardımcısı |
    | `plugin-sdk/file-access-runtime` | Güvenli yerel dosya ve medya kaynağı yolu yardımcıları |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat uyandırma, olay ve görünürlük yardımcıları |
    | `plugin-sdk/number-runtime` | Sayısal zorlama yardımcısı |
    | `plugin-sdk/secure-random-runtime` | Güvenli token/UUID yardımcıları |
    | `plugin-sdk/system-event-runtime` | Sistem olayı kuyruğu yardımcıları |
    | `plugin-sdk/transport-ready-runtime` | Taşıma hazır olma bekleme yardımcısı |
    | `plugin-sdk/exec-approvals-runtime` | Geniş infra-runtime barrel'ı olmadan exec onay politikası dosyası yardımcıları |
    | `plugin-sdk/infra-runtime` | Kullanımdan kaldırılmış uyumluluk shim'i; yukarıdaki odaklı çalışma zamanı alt yollarını kullanın |
    | `plugin-sdk/collection-runtime` | Küçük sınırlı önbellek yardımcıları |
    | `plugin-sdk/diagnostic-runtime` | Tanılama bayrağı, olay ve izleme bağlamı yardımcıları |
    | `plugin-sdk/error-runtime` | Hata grafiği, biçimlendirme, paylaşılan hata sınıflandırma yardımcıları, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Sarılmış fetch, proxy, EnvHttpProxyAgent seçeneği ve sabitlenmiş arama yardımcıları |
    | `plugin-sdk/runtime-fetch` | Proxy/korumalı-fetch içe aktarmaları olmadan dispatcher farkındalıklı çalışma zamanı fetch'i |
    | `plugin-sdk/inline-image-data-url-runtime` | Geniş medya çalışma zamanı yüzeyi olmadan satır içi görüntü veri URL'si temizleyici ve imza koklama yardımcıları |
    | `plugin-sdk/response-limit-runtime` | Geniş medya çalışma zamanı yüzeyi olmadan sınırlı yanıt gövdesi okuyucu |
    | `plugin-sdk/session-binding-runtime` | Yapılandırılmış bağlama yönlendirmesi veya eşleştirme depoları olmadan geçerli konuşma bağlama durumu |
    | `plugin-sdk/session-store-runtime` | Geniş yapılandırma yazma/bakım içe aktarmaları olmadan oturum deposu yardımcıları |
    | `plugin-sdk/sqlite-runtime` | Veritabanı yaşam döngüsü kontrolleri olmadan odaklı SQLite ajan şeması, yol ve işlem yardımcıları |
    | `plugin-sdk/context-visibility-runtime` | Geniş yapılandırma/güvenlik içe aktarmaları olmadan bağlam görünürlüğü çözümlemesi ve ek bağlam filtreleme |
    | `plugin-sdk/string-coerce-runtime` | Markdown/günlükleme içe aktarmaları olmadan dar temel kayıt/dize zorlama ve normalizasyon yardımcıları |
    | `plugin-sdk/host-runtime` | Ana makine adı ve SCP ana makine normalizasyon yardımcıları |
    | `plugin-sdk/retry-runtime` | Yeniden deneme yapılandırması ve yeniden deneme çalıştırıcı yardımcıları |
    | `plugin-sdk/agent-runtime` | `resolveAgentDir`, `resolveDefaultAgentDir` ve kullanımdan kaldırılmış `resolveOpenClawAgentDir` uyumluluk dışa aktarımı dahil ajan dizini/kimliği/çalışma alanı yardımcıları |
    | `plugin-sdk/directory-runtime` | Yapılandırma destekli dizin sorgulama/tekilleştirme |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Yetenek ve test alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/media-runtime` | `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` ve kullanımdan kaldırılmış `fetchRemoteMedia` dahil paylaşılan medya getirme/dönüştürme/depolama yardımcıları; bir URL OpenClaw medyasına dönüşecekse tampon okumalarından önce depolama yardımcılarını tercih edin |
    | `plugin-sdk/media-mime` | Dar kapsamlı MIME normalleştirme, dosya uzantısı eşleme, MIME algılama ve medya türü yardımcıları |
    | `plugin-sdk/media-store` | `saveMediaBuffer` ve `saveMediaStream` gibi dar kapsamlı medya deposu yardımcıları |
    | `plugin-sdk/media-generation-runtime` | Paylaşılan medya üretimi yük devretme yardımcıları, aday seçimi ve eksik model mesajlaşması |
    | `plugin-sdk/media-understanding` | Medya anlama sağlayıcı türleri ve sağlayıcıya dönük görüntü/ses/yapılandırılmış çıkarım yardımcı dışa aktarımları |
    | `plugin-sdk/text-chunking` | Metin ve markdown parçalama/işleme yardımcıları, markdown tablo dönüştürme, yönerge etiketi ayıklama ve güvenli metin araçları |
    | `plugin-sdk/text-chunking` | Giden metin parçalama yardımcısı |
    | `plugin-sdk/speech` | Konuşma sağlayıcı türleri ve sağlayıcıya dönük yönerge, kayıt defteri, doğrulama, OpenAI uyumlu TTS oluşturucu ve konuşma yardımcı dışa aktarımları |
    | `plugin-sdk/speech-core` | Paylaşılan konuşma sağlayıcı türleri, kayıt defteri, yönerge, normalleştirme ve konuşma yardımcı dışa aktarımları |
    | `plugin-sdk/realtime-transcription` | Gerçek zamanlı transkripsiyon sağlayıcı türleri, kayıt defteri yardımcıları ve paylaşılan WebSocket oturumu yardımcısı |
    | `plugin-sdk/realtime-bootstrap-context` | Sınırlı `IDENTITY.md`, `USER.md` ve `SOUL.md` bağlam ekleme için gerçek zamanlı profil bootstrap yardımcısı |
    | `plugin-sdk/realtime-voice` | Çıkış etkinliği izleme dahil gerçek zamanlı ses sağlayıcı türleri, kayıt defteri yardımcıları ve paylaşılan gerçek zamanlı ses davranışı yardımcıları |
    | `plugin-sdk/image-generation` | Görüntü üretimi sağlayıcı türleri, görüntü varlığı/veri URL'si yardımcıları ve OpenAI uyumlu görüntü sağlayıcı oluşturucusu |
    | `plugin-sdk/image-generation-core` | Paylaşılan görüntü üretimi türleri, yük devretme, kimlik doğrulama ve kayıt defteri yardımcıları |
    | `plugin-sdk/music-generation` | Müzik üretimi sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/music-generation-core` | Paylaşılan müzik üretimi türleri, yük devretme yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
    | `plugin-sdk/video-generation` | Video üretimi sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/video-generation-core` | Paylaşılan video üretimi türleri, yük devretme yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
    | `plugin-sdk/transcripts` | Paylaşılan transkript kaynak sağlayıcı türleri, kayıt defteri yardımcıları, oturum tanımlayıcıları ve sözce meta verileri |
    | `plugin-sdk/webhook-targets` | Webhook hedef kayıt defteri ve rota yükleme yardımcıları |
    | `plugin-sdk/webhook-path` | Kullanımdan kaldırılmış uyumluluk takma adı; `plugin-sdk/webhook-ingress` kullanın |
    | `plugin-sdk/web-media` | Paylaşılan uzak/yerel medya yükleme yardımcıları |
    | `plugin-sdk/zod` | Kullanımdan kaldırılmış uyumluluk yeniden dışa aktarımı; `zod` öğesini doğrudan `zod` içinden içe aktarın |
    | `plugin-sdk/testing` | Eski OpenClaw testleri için depoya yerel, kullanımdan kaldırılmış uyumluluk barrel'ı. Yeni depo testleri bunun yerine `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` veya `plugin-sdk/test-fixtures` gibi odaklı yerel test alt yollarını içe aktarmalıdır |
    | `plugin-sdk/plugin-test-api` | Depo test yardımcı köprülerini içe aktarmadan doğrudan Plugin kaydı birim testleri için depoya yerel minimal `createTestPluginApi` yardımcısı |
    | `plugin-sdk/agent-runtime-test-contracts` | Kimlik doğrulama, teslim, geri dönüş, araç kancası, istem kaplaması, şema ve transkript projeksiyonu testleri için depoya yerel yerel agent-runtime adaptörü sözleşme fixture'ları |
    | `plugin-sdk/channel-test-helpers` | Genel eylem/kurulum/durum sözleşmeleri, dizin assertion'ları, hesap başlatma yaşam döngüsü, gönderme yapılandırması iş parçacığı, çalışma zamanı mock'ları, durum sorunları, giden teslim ve kanca kaydı için depoya yerel kanal odaklı test yardımcıları |
    | `plugin-sdk/channel-target-testing` | Kanal testleri için depoya yerel paylaşılan hedef çözümleme hata durumu paketi |
    | `plugin-sdk/plugin-test-contracts` | Depoya yerel Plugin paketi, kayıt, herkese açık artifact, doğrudan içe aktarma, çalışma zamanı API'si ve içe aktarma yan etkisi sözleşme yardımcıları |
    | `plugin-sdk/provider-test-contracts` | Depoya yerel sağlayıcı çalışma zamanı, kimlik doğrulama, keşif, onboard, katalog, sihirbaz, medya yeteneği, yeniden oynatma politikası, gerçek zamanlı STT canlı ses, web arama/getirme ve stream sözleşme yardımcıları |
    | `plugin-sdk/provider-http-test-mocks` | `plugin-sdk/provider-http` kullanan sağlayıcı testleri için depoya yerel isteğe bağlı Vitest HTTP/kimlik doğrulama mock'ları |
    | `plugin-sdk/test-fixtures` | Depoya yerel genel CLI çalışma zamanı yakalama, sandbox bağlamı, skill yazıcı, agent-message, system-event, modül yeniden yükleme, paketle gelen Plugin yolu, terminal metni, parçalama, kimlik doğrulama token'ı ve tipli-case fixture'ları |
    | `plugin-sdk/test-node-mocks` | Vitest `vi.mock("node:*")` factory'leri içinde kullanım için depoya yerel odaklı Node yerleşik mock yardımcıları |
  </Accordion>

  <Accordion title="Bellek alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/memory-core` | Manager/config/dosya/CLI yardımcıları için paketle gelen memory-core yardımcı yüzeyi |
    | `plugin-sdk/memory-core-engine-runtime` | Bellek indeksleme/arama çalışma zamanı cephesi |
    | `plugin-sdk/memory-core-host-embedding-registry` | Hafif bellek embedding sağlayıcı kayıt defteri yardımcıları |
    | `plugin-sdk/memory-core-host-engine-foundation` | Bellek ana makine foundation motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Bellek ana makine embedding sözleşmeleri, kayıt defteri erişimi, yerel sağlayıcı ve genel toplu/uzak yardımcılar. Bu yüzeydeki `registerMemoryEmbeddingProvider` kullanımdan kaldırılmıştır; yeni sağlayıcılar için genel embedding sağlayıcı API'sini kullanın. |
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
    | `plugin-sdk/memory-host-markdown` | Belleğe bitişik Plugin'ler için paylaşılan yönetilen markdown yardımcıları |
    | `plugin-sdk/memory-host-search` | Arama yöneticisi erişimi için Active Memory çalışma zamanı cephesi |
    | `plugin-sdk/memory-host-status` | Kullanımdan kaldırılmış uyumluluk takma adı; `plugin-sdk/memory-core-host-status` kullanın |
  </Accordion>

  <Accordion title="Ayrılmış paketlenmiş yardımcı alt yolları">
    Ayrılmış paketlenmiş yardımcı SDK alt yolları, paketle gelen Plugin kodu için
    dar kapsamlı sahibe özgü yüzeylerdir. Paket derlemeleri ve takma adlama
    deterministik kalsın diye SDK envanterinde izlenirler, ancak genel Plugin
    yazma API'leri değildirler. Yeni yeniden kullanılabilir ana makine sözleşmeleri
    `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` ve
    `plugin-sdk/plugin-config-runtime` gibi genel SDK alt yollarını kullanmalıdır.

    | Alt yol | Sahip ve amaç |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Kullanıcı MCP sunucu yapılandırmasını Codex uygulama sunucusu iş parçacığı yapılandırmasına projekte etmek için paketle gelen Codex Plugin yardımcısı |
    | `plugin-sdk/codex-native-task-runtime` | Codex uygulama sunucusu yerel alt agent'larını OpenClaw görev durumuna yansıtmak için paketle gelen Codex Plugin yardımcısı |

  </Accordion>
</AccordionGroup>

## İlgili

- [Plugin SDK genel bakışı](/tr/plugins/sdk-overview)
- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)

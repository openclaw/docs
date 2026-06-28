---
read_when:
    - Plugin içe aktarımı için doğru plugin-sdk alt yolunu seçme
    - Paketlenmiş Plugin alt yollarını ve yardımcı yüzeyleri denetleme
summary: 'Plugin SDK alt yol kataloğu: alana göre gruplandırılmış olarak hangi içe aktarmaların nerede bulunduğu'
title: Plugin SDK alt yolları
x-i18n:
    generated_at: "2026-06-28T01:05:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120877dfcc2ddc17237f1ea1a6eb6daf38dcf714ae6446f59ee06e0ef0dfdcc
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK, `openclaw/plugin-sdk/` altında dar kapsamlı genel alt yollar kümesi olarak sunulur. Bu sayfa, yaygın kullanılan alt yolları amaçlarına göre gruplandırarak kataloglar. Oluşturulan derleyici giriş noktası envanteri `scripts/lib/plugin-sdk-entrypoints.json` içindedir; paket dışa aktarımları, `scripts/lib/plugin-sdk-private-local-only-subpaths.json` içinde listelenen repo-yerel test/dahili alt yollar çıkarıldıktan sonra kalan genel alt kümedir. Bakımcılar genel dışa aktarım sayısını `pnpm plugin-sdk:surface` ile, etkin ayrılmış yardımcı alt yolları ise `pnpm plugins:boundary-report:summary` ile denetleyebilir; kullanılmayan ayrılmış yardımcı dışa aktarımlar, genel SDK içinde atıl uyumluluk borcu olarak kalmak yerine CI raporunu başarısız kılar.

Plugin yazma kılavuzu için bkz. [Plugin SDK'ye genel bakış](/tr/plugins/sdk-overview).

## Plugin girişi

| Alt yol                        | Önemli dışa aktarımlar                                                                                                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | `createMigrationItem` gibi migration sağlayıcı öğesi yardımcıları, neden sabitleri, öğe durum işaretleyicileri, redaksiyon yardımcıları ve `summarizeMigrationItems`    |
| `plugin-sdk/migration-runtime` | `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` ve `writeMigrationReport` gibi çalışma zamanı migration yardımcıları                                       |
| `plugin-sdk/health`            | Paketle gelen sağlık tüketicileri için Doctor sağlık denetimi kaydı, algılama, onarım, seçim, önem derecesi ve bulgu türleri                                           |

### Kullanımdan kaldırılmış uyumluluk ve test yardımcıları

Kullanımdan kaldırılmış alt yollar eski Plugin'ler için dışa aktarılmaya devam eder, ancak yeni kod aşağıdaki odaklı SDK alt yollarını kullanmalıdır. Bakımı yapılan liste `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` dosyasındadır; CI, buradan yapılan paketle gelen üretim içe aktarımlarını reddeder. `compat`, `config-types`, `infra-runtime`, `text-runtime` ve `zod` gibi geniş toplu dışa aktarım modülleri yalnızca uyumluluk içindir. `zod` öğesini doğrudan `zod` üzerinden içe aktarın.

OpenClaw'ın Vitest destekli test yardımcısı alt yolları yalnızca repo-yereldir ve artık paket dışa aktarımı değildir: `agent-runtime-test-contracts`, `channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`, `plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks` ve `testing`.

### Ayrılmış paketle gelen Plugin yardımcı alt yolları

Bu alt yollar, genel SDK API'leri değil, sahipleri olan paketle gelen Plugin'e ait uyumluluk yüzeyleridir: `plugin-sdk/codex-mcp-projection` ve `plugin-sdk/codex-native-task-runtime`. Sahipler arası eklenti içe aktarımları, paket sözleşmesi koruma kuralları tarafından engellenir.

<AccordionGroup>
  <Accordion title="Kanal alt yolları">
    | Alt yol | Anahtar dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Kök `openclaw.json` Zod şeması dışa aktarımı (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Plugin'e ait şemalar için önbelleğe alınmış JSON Schema doğrulama yardımcısı |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ayrıca `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Paylaşılan kurulum sihirbazı yardımcıları, kurulum çevirmeni, izin listesi istemleri, kurulum durumu oluşturucuları |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Kullanımdan kaldırılmış uyumluluk diğer adı; `plugin-sdk/setup-runtime` kullanın |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Çok hesaplı yapılandırma/eylem kapısı yardımcıları, varsayılan hesap geri dönüş yardımcıları |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, hesap kimliği normalleştirme yardımcıları |
    | `plugin-sdk/account-resolution` | Hesap arama + varsayılan geri dönüş yardımcıları |
    | `plugin-sdk/account-helpers` | Dar kapsamlı hesap listesi/hesap eylemi yardımcıları |
    | `plugin-sdk/access-groups` | Erişim grubu izin listesi ayrıştırma ve redakte edilmiş grup tanılama yardımcıları |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Kullanımdan kaldırılmış uyumluluk cephesi. `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Paylaşılan kanal yapılandırma şeması ilkel öğeleri ve Zod ile doğrudan JSON/TypeBox oluşturucuları |
    | `plugin-sdk/bundled-channel-config-schema` | Yalnızca bakımı sürdürülen paketlenmiş Plugin'ler için paketlenmiş OpenClaw kanal yapılandırma şemaları |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Kendi tablolarını sabit kodlamadan zarf önekli metni tanıması gereken Plugin'ler için kanonik paketlenmiş/resmi sohbet kanalı kimlikleri ve biçimlendirici etiketleri/diğer adları. |
    | `plugin-sdk/channel-config-schema-legacy` | Paketlenmiş kanal yapılandırma şemaları için kullanımdan kaldırılmış uyumluluk diğer adı |
    | `plugin-sdk/telegram-command-config` | Paketlenmiş sözleşme geri dönüşüyle Telegram özel komut normalleştirme/doğrulama yardımcıları |
    | `plugin-sdk/command-gating` | Dar kapsamlı komut yetkilendirme kapısı yardımcıları |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Kullanımdan kaldırılmış düşük seviyeli kanal giriş uyumluluk cephesi. Yeni alma yolları `plugin-sdk/channel-ingress-runtime` kullanmalıdır. |
    | `plugin-sdk/channel-ingress-runtime` | Taşınmış kanal alma yolları için deneysel üst seviyeli kanal giriş çalışma zamanı çözümleyicisi ve rota olgu oluşturucuları. Her Plugin'de etkili izin listelerini, komut izin listelerini ve eski projeksiyonları birleştirmek yerine bunu tercih edin. Bkz. [Kanal giriş API'si](/tr/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Kullanımdan kaldırılmış uyumluluk cephesi. `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/channel-outbound` | Mesaj yaşam döngüsü sözleşmeleri ve yanıt işlem hattı seçenekleri, alındılar, canlı önizleme/akış, yaşam döngüsü yardımcıları, giden kimlik, yük planlama, dayanıklı gönderimler ve mesaj gönderme bağlamı yardımcıları. Bkz. [Kanal giden API'si](/tr/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | `plugin-sdk/channel-outbound` için kullanımdan kaldırılmış uyumluluk diğer adı ve eski yanıt dağıtım cepheleri. |
    | `plugin-sdk/channel-message-runtime` | `plugin-sdk/channel-outbound` için kullanımdan kaldırılmış uyumluluk diğer adı ve eski yanıt dağıtım cepheleri. |
    | `plugin-sdk/inbound-envelope` | Paylaşılan gelen rota + zarf oluşturucu yardımcıları |
    | `plugin-sdk/inbound-reply-dispatch` | Kullanımdan kaldırılmış uyumluluk cephesi. Gelen çalıştırıcılar ve dağıtım yüklemleri için `plugin-sdk/channel-inbound`, mesaj teslim yardımcıları için `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/messaging-targets` | Kullanımdan kaldırılmış hedef ayrıştırma diğer adı; `plugin-sdk/channel-targets` kullanın |
    | `plugin-sdk/outbound-media` | Paylaşılan giden medya yükleme ve barındırılan medya durumu yardımcıları |
    | `plugin-sdk/outbound-send-deps` | Kullanımdan kaldırılmış uyumluluk cephesi. `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/outbound-runtime` | Kullanımdan kaldırılmış uyumluluk cephesi. `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/poll-runtime` | Dar kapsamlı anket normalleştirme yardımcıları |
    | `plugin-sdk/thread-bindings-runtime` | İş parçacığı bağlama yaşam döngüsü ve adaptör yardımcıları |
    | `plugin-sdk/agent-media-payload` | Eski ajan medya yükü oluşturucusu |
    | `plugin-sdk/conversation-runtime` | Konuşma/iş parçacığı bağlama, eşleme ve yapılandırılmış bağlama yardımcıları |
    | `plugin-sdk/runtime-config-snapshot` | Çalışma zamanı yapılandırma anlık görüntüsü yardımcısı |
    | `plugin-sdk/runtime-group-policy` | Çalışma zamanı grup politikası çözümleme yardımcıları |
    | `plugin-sdk/channel-status` | Paylaşılan kanal durumu anlık görüntü/özet yardımcıları |
    | `plugin-sdk/channel-config-primitives` | Dar kapsamlı kanal yapılandırma şeması ilkel öğeleri |
    | `plugin-sdk/channel-config-writes` | Kanal yapılandırma yazma yetkilendirme yardımcıları |
    | `plugin-sdk/channel-plugin-common` | Paylaşılan kanal Plugin başlangıç dışa aktarımları |
    | `plugin-sdk/allowlist-config-edit` | İzin listesi yapılandırma düzenleme/okuma yardımcıları |
    | `plugin-sdk/group-access` | Paylaşılan grup erişimi karar yardımcıları |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Kullanımdan kaldırılmış uyumluluk cepheleri. `plugin-sdk/channel-inbound` kullanın. |
    | `plugin-sdk/direct-dm-guard-policy` | Dar kapsamlı doğrudan DM kripto öncesi koruma politikası yardımcıları |
    | `plugin-sdk/discord` | Yayımlanmış `@openclaw/discord@2026.3.13` ve izlenen sahip uyumluluğu için kullanımdan kaldırılmış Discord uyumluluk cephesi; yeni Plugin'ler genel kanal SDK alt yollarını kullanmalıdır |
    | `plugin-sdk/telegram-account` | İzlenen sahip uyumluluğu için kullanımdan kaldırılmış Telegram hesap çözümleme uyumluluk cephesi; yeni Plugin'ler enjekte edilen çalışma zamanı yardımcılarını veya genel kanal SDK alt yollarını kullanmalıdır |
    | `plugin-sdk/zalouser` | Gönderen komut yetkilendirmesini hâlâ içe aktaran yayımlanmış Lark/Zalo paketleri için kullanımdan kaldırılmış Zalo Personal uyumluluk cephesi; yeni Plugin'ler `plugin-sdk/command-auth` kullanmalıdır |
    | `plugin-sdk/interactive-runtime` | Anlamsal mesaj sunumu, teslimi ve eski etkileşimli yanıt yardımcıları. Bkz. [Mesaj Sunumu](/tr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Olay sınıflandırma, bağlam oluşturma, biçimlendirme, kökler, debounce, bahsetme eşleştirme, bahsetme politikası ve gelen kayıt günlüğü için paylaşılan gelen yardımcıları |
    | `plugin-sdk/channel-inbound-debounce` | Dar kapsamlı gelen debounce yardımcıları |
    | `plugin-sdk/channel-mention-gating` | Daha geniş gelen çalışma zamanı yüzeyi olmadan dar kapsamlı bahsetme politikası, bahsetme işaretçisi ve bahsetme metni yardımcıları |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Kullanımdan kaldırılmış uyumluluk cepheleri. `plugin-sdk/channel-inbound` veya `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/channel-pairing-paths` | Kullanımdan kaldırılmış uyumluluk cephesi. `plugin-sdk/channel-pairing` kullanın. |
    | `plugin-sdk/channel-reply-options-runtime` | Kullanımdan kaldırılmış uyumluluk cephesi. `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/channel-streaming` | Kullanımdan kaldırılmış uyumluluk cephesi. `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/channel-send-result` | Yanıt sonucu türleri |
    | `plugin-sdk/channel-actions` | Kanal mesaj eylemi yardımcıları ve Plugin uyumluluğu için tutulan, kullanımdan kaldırılmış yerel şema yardımcıları |
    | `plugin-sdk/channel-route` | Paylaşılan rota normalleştirme, ayrıştırıcı güdümlü hedef çözümleme, iş parçacığı kimliği dizgeleştirme, tekilleştirme/kompakt rota anahtarları, ayrıştırılmış hedef türleri ve rota/hedef karşılaştırma yardımcıları |
    | `plugin-sdk/channel-targets` | Hedef ayrıştırma yardımcıları; rota karşılaştırma çağırıcıları `plugin-sdk/channel-route` kullanmalıdır |
    | `plugin-sdk/channel-contract` | Kanal sözleşmesi türleri |
    | `plugin-sdk/channel-feedback` | Geri bildirim/tepki bağlantıları |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` gibi dar kapsamlı gizli sözleşme yardımcıları ve gizli hedef türleri |
  </Accordion>

Kullanımdan kaldırılmış kanal yardımcı aileleri yalnızca yayımlanmış Plugin
uyumluluğu için kullanılabilir kalır. Kaldırma planı: dış Plugin
taşıma penceresi boyunca bunları tutmak, repo/paketlenmiş Plugin'leri `channel-inbound` ve
`channel-outbound` üzerinde tutmak, ardından bir sonraki büyük
SDK temizliğinde uyumluluk alt yollarını kaldırmaktır. Bu, eski kanal message/runtime, kanal
streaming, doğrudan DM erişimi, gelen yardımcı parçaları, reply-options
ve pairing-path aileleri için geçerlidir.

  <Accordion title="Sağlayıcı alt yolları">
    | Alt yol | Ana dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Kurulum, katalog keşfi ve çalışma zamanı modeli hazırlığı için desteklenen LM Studio sağlayıcı cephesi |
    | `plugin-sdk/lmstudio-runtime` | Yerel sunucu varsayılanları, model keşfi, istek başlıkları ve yüklenmiş model yardımcıları için desteklenen LM Studio çalışma zamanı cephesi |
    | `plugin-sdk/provider-setup` | Özenle seçilmiş yerel/kendi barındırılan sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/self-hosted-provider-setup` | Odaklanmış OpenAI uyumlu kendi barındırılan sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/cli-backend` | CLI arka uç varsayılanları + izleyici sabitleri |
    | `plugin-sdk/provider-auth-runtime` | Sağlayıcı Plugin'leri için çalışma zamanı API anahtarı çözümleme yardımcıları |
    | `plugin-sdk/provider-oauth-runtime` | Genel sağlayıcı OAuth geri çağırma türleri, geri çağırma sayfası işleme, PKCE/durum yardımcıları, yetkilendirme girdisi ayrıştırma, belirteç süre sonu yardımcıları ve iptal yardımcıları |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` gibi API anahtarı başlangıç/profile yazma yardımcıları |
    | `plugin-sdk/provider-auth-result` | Standart OAuth kimlik doğrulama sonucu oluşturucu |
    | `plugin-sdk/provider-env-vars` | Sağlayıcı kimlik doğrulama ortam değişkeni arama yardımcıları |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, OpenAI Codex kimlik doğrulama içe aktarma yardımcıları, kullanımdan kaldırılmış `resolveOpenClawAgentDir` uyumluluk dışa aktarımı |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan yeniden oynatma ilkesi oluşturucuları, sağlayıcı uç noktası yardımcıları ve paylaşılan model kimliği normalleştirme yardımcıları |
    | `plugin-sdk/provider-catalog-live-runtime` | Korumalı `/models` tarzı keşif için canlı sağlayıcı model kataloğu yardımcıları: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, model kimliği filtreleme, TTL önbelleği ve statik geri dönüş |
    | `plugin-sdk/provider-catalog-runtime` | Sözleşme testleri için sağlayıcı katalog genişletme çalışma zamanı kancası ve Plugin-sağlayıcı kayıt defteri birleşim noktaları |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Genel sağlayıcı HTTP/uç nokta yetenek yardımcıları, sağlayıcı HTTP hataları ve ses yazıya dökme multipart form yardımcıları |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` ve `WebFetchProviderPlugin` gibi dar web-getirme yapılandırma/seçim sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-fetch` | Web-getirme sağlayıcısı kayıt/önbellek yardımcıları |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin etkinleştirme bağlantısına ihtiyaç duymayan sağlayıcılar için dar web araması yapılandırma/kimlik bilgisi yardımcıları |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` ve kapsamlı kimlik bilgisi ayarlayıcıları/alıcıları gibi dar web araması yapılandırma/kimlik bilgisi sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-search` | Web araması sağlayıcısı kayıt/önbellek/çalışma zamanı yardımcıları |
    | `plugin-sdk/embedding-providers` | `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` ve `listEmbeddingProviders(...)` dahil genel gömme sağlayıcısı türleri ve okuma yardımcıları; Plugin'ler sağlayıcıları `api.registerEmbeddingProvider(...)` aracılığıyla kaydeder, böylece manifest sahipliği zorunlu kılınır |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` ve DeepSeek/Gemini/OpenAI şema temizliği + tanılamalar |
    | `plugin-sdk/provider-usage` | Sağlayıcı kullanım anlık görüntüsü türleri, paylaşılan kullanım getirme yardımcıları ve `fetchClaudeUsage` gibi sağlayıcı getiricileri |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri, düz metin araç çağrısı uyumluluğu ve paylaşılan Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot sarmalayıcı yardımcıları |
    | `plugin-sdk/provider-stream-shared` | `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` ve Anthropic/DeepSeek/OpenAI uyumlu akış yardımcı programları dahil herkese açık paylaşılan sağlayıcı akış sarmalayıcı yardımcıları |
    | `plugin-sdk/provider-transport-runtime` | Korumalı fetch, taşıma iletisi dönüşümleri ve yazılabilir taşıma olay akışları gibi yerel sağlayıcı taşıma yardımcıları |
    | `plugin-sdk/provider-onboard` | Başlangıç yapılandırması yama yardımcıları |
    | `plugin-sdk/global-singleton` | Sürece yerel singleton/harita/önbellek yardımcıları |
    | `plugin-sdk/group-activation` | Dar grup etkinleştirme modu ve komut ayrıştırma yardımcıları |
  </Accordion>

Sağlayıcı kullanım anlık görüntüleri normalde her biri bir etiket, kullanılan yüzde
ve isteğe bağlı sıfırlama zamanı içeren bir veya daha fazla kota `windows` bildirir.
Sıfırlanabilir kota pencereleri yerine bakiye veya hesap durumu metni sunan
sağlayıcılar, yüzdeler uydurmak yerine boş bir `windows` dizisiyle
`summary` döndürmelidir. OpenClaw bu özet metnini durum çıktısında gösterir;
`error` yalnızca kullanım uç noktası başarısız olduğunda veya kullanılabilir
kullanım verisi döndürmediğinde kullanılmalıdır.

  <Accordion title="Kimlik doğrulama ve güvenlik alt yolları">
    | Alt yol | Ana dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, dinamik bağımsız değişken menüsü biçimlendirmesi dahil komut kayıt defteri yardımcıları, gönderen yetkilendirme yardımcıları |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` ve `buildHelpMessage` gibi komut/yardım iletisi oluşturucuları |
    | `plugin-sdk/approval-auth-runtime` | Onaylayan çözümleme ve aynı sohbet eylem kimlik doğrulaması yardımcıları |
    | `plugin-sdk/approval-client-runtime` | Yerel exec onay profili/filtre yardımcıları |
    | `plugin-sdk/approval-delivery-runtime` | Yerel onay yeteneği/teslimat bağdaştırıcıları |
    | `plugin-sdk/approval-gateway-runtime` | Paylaşılan onay Gateway çözümleme yardımcısı |
    | `plugin-sdk/approval-handler-adapter-runtime` | Sıcak kanal giriş noktaları için hafif yerel onay bağdaştırıcısı yükleme yardımcıları |
    | `plugin-sdk/approval-handler-runtime` | Daha geniş onay işleyicisi çalışma zamanı yardımcıları; yeterli olduklarında daha dar bağdaştırıcı/Gateway birleşim noktalarını tercih edin |
    | `plugin-sdk/approval-native-runtime` | Yerel onay hedefi, hesap bağlama, rota geçidi, iletme geri dönüşü ve yerel yerel exec istemi bastırma yardımcıları |
    | `plugin-sdk/approval-reaction-runtime` | Sabit kodlanmış onay tepkisi bağlamaları, tepki istemi yükleri, tepki hedef depoları ve yerel yerel exec istemi bastırma için uyumluluk dışa aktarımı |
    | `plugin-sdk/approval-reply-runtime` | Exec/Plugin onay yanıtı yük yardımcıları |
    | `plugin-sdk/approval-runtime` | Exec/Plugin onay yük yardımcıları, yerel onay yönlendirme/çalışma zamanı yardımcıları ve `formatApprovalDisplayPath` gibi yapılandırılmış onay görüntüleme yardımcıları |
    | `plugin-sdk/reply-dedupe` | Dar gelen yanıt tekilleştirme sıfırlama yardımcıları |
    | `plugin-sdk/channel-contract-testing` | Geniş test barrel'ı olmadan dar kanal sözleşmesi test yardımcıları |
    | `plugin-sdk/command-auth-native` | Yerel komut kimlik doğrulaması, dinamik bağımsız değişken menüsü biçimlendirmesi ve yerel oturum hedefi yardımcıları |
    | `plugin-sdk/command-detection` | Paylaşılan komut algılama yardımcıları |
    | `plugin-sdk/command-primitives-runtime` | Sıcak kanal yolları için hafif komut metni yüklemleri |
    | `plugin-sdk/command-surface` | Komut gövdesi normalleştirme ve komut yüzeyi yardımcıları |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Kanal/Plugin gizli bilgi yüzeyleri için dar gizli bilgi sözleşmesi toplama yardımcıları |
    | `plugin-sdk/secret-ref-runtime` | Gizli bilgi sözleşmesi/yapılandırma ayrıştırması için dar `coerceSecretRef` ve SecretRef türleme yardımcıları |
    | `plugin-sdk/secret-provider-integration` | Harici gizli bilgi sağlayıcısı ön ayarları yayımlayan Plugin'ler için yalnızca tür SecretRef sağlayıcı entegrasyon manifesti ve ön ayar sözleşmeleri |
    | `plugin-sdk/security-runtime` | Yalnızca oluşturma yazmaları, eşzamanlı/eşzamansız atomik dosya değiştirme, kardeş geçici yazmalar, aygıtlar arası taşıma geri dönüşü, özel dosya deposu yardımcıları, sembolik bağlantı üst dizin korumaları, harici içerik, hassas metin redaksiyonu, sabit zamanlı gizli bilgi karşılaştırması ve gizli bilgi toplama yardımcıları dahil paylaşılan güven, DM geçidi, kökle sınırlı dosya/yol yardımcıları |
    | `plugin-sdk/ssrf-policy` | Ana makine izin listesi ve özel ağ SSRF ilkesi yardımcıları |
    | `plugin-sdk/ssrf-dispatcher` | Geniş altyapı çalışma zamanı yüzeyi olmadan dar sabitlenmiş dağıtıcı yardımcıları |
    | `plugin-sdk/ssrf-runtime` | Sabitlenmiş dağıtıcı, SSRF korumalı fetch, SSRF hatası ve SSRF ilkesi yardımcıları |
    | `plugin-sdk/secret-input` | Gizli bilgi girdisi ayrıştırma yardımcıları |
    | `plugin-sdk/webhook-ingress` | Webhook istek/hedef yardımcıları ve ham websocket/gövde zorlaması |
    | `plugin-sdk/webhook-request-guards` | İstek gövdesi boyutu/zaman aşımı yardımcıları |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Alt yol | Ana dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/runtime` | Geniş çalışma zamanı/günlükleme/yedekleme/Plugin kurulum yardımcıları |
    | `plugin-sdk/runtime-env` | Dar kapsamlı çalışma zamanı ortamı, günlükleyici, zaman aşımı, yeniden deneme ve geri çekilme yardımcıları |
    | `plugin-sdk/browser-config` | Normalleştirilmiş profil/varsayılanlar, CDP URL ayrıştırma ve tarayıcı denetimi kimlik doğrulama yardımcıları için desteklenen tarayıcı yapılandırma cephesi |
    | `plugin-sdk/agent-harness-task-runtime` | Ana makine tarafından verilen görev kapsamını kullanan harness destekli ajanlar için genel görev yaşam döngüsü ve tamamlanma teslimi yardımcıları |
    | `plugin-sdk/codex-mcp-projection` | Kullanıcı MCP sunucusu yapılandırmasını Codex iş parçacığı yapılandırmasına yansıtmak için ayrılmış paketli Codex yardımcısı; üçüncü taraf Plugin'leri için değildir |
    | `plugin-sdk/codex-native-task-runtime` | Yerel görev yansıtma/çalışma zamanı bağlantıları için özel paketli Codex yardımcısı; üçüncü taraf Plugin'leri için değildir |
    | `plugin-sdk/channel-runtime-context` | Genel kanal çalışma zamanı bağlamı kaydı ve arama yardımcıları |
    | `plugin-sdk/matrix` | Eski üçüncü taraf kanal paketleri için kullanımdan kaldırılmış Matrix uyumluluk cephesi; yeni Plugin'ler doğrudan `plugin-sdk/run-command` içe aktarmalıdır |
    | `plugin-sdk/mattermost` | Eski üçüncü taraf kanal paketleri için kullanımdan kaldırılmış Mattermost uyumluluk cephesi; yeni Plugin'ler genel SDK alt yollarını doğrudan içe aktarmalıdır |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Paylaşılan Plugin komut/hook/http/etkileşimli yardımcıları |
    | `plugin-sdk/hook-runtime` | Paylaşılan Webhook/iç hook işlem hattı yardımcıları |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod` ve `createLazyRuntimeSurface` gibi tembel çalışma zamanı içe aktarma/bağlama yardımcıları |
    | `plugin-sdk/process-runtime` | İşlem yürütme yardımcıları |
    | `plugin-sdk/cli-runtime` | CLI biçimlendirme, bekleme, sürüm, argüman çağırma ve tembel komut grubu yardımcıları |
    | `plugin-sdk/qa-live-transport-scenarios` | Paylaşılan canlı taşıma QA senaryo kimlikleri, temel kapsam yardımcıları ve senaryo seçimi yardımcısı |
    | `plugin-sdk/gateway-method-runtime` | `contracts.gatewayMethodDispatch: ["authenticated-request"]` bildiren Plugin HTTP rotaları için ayrılmış Gateway yöntem yönlendirme yardımcısı |
    | `plugin-sdk/gateway-runtime` | Gateway istemcisi, olay döngüsüne hazır istemci başlatma yardımcısı, Gateway CLI RPC, Gateway protokol hataları ve kanal durumu yama yardımcıları |
    | `plugin-sdk/config-contracts` | `OpenClawConfig` ve kanal/sağlayıcı yapılandırma türleri gibi Plugin yapılandırma şekilleri için odaklanmış, yalnızca tür içeren yapılandırma yüzeyi |
    | `plugin-sdk/plugin-config-runtime` | `requireRuntimeConfig`, `resolvePluginConfigObject` ve `resolveLivePluginConfigObject` gibi çalışma zamanı Plugin yapılandırması arama yardımcıları |
    | `plugin-sdk/config-mutation` | `mutateConfigFile`, `replaceConfigFile` ve `logConfigUpdated` gibi işlemsel yapılandırma mutasyonu yardımcıları |
    | `plugin-sdk/message-tool-delivery-hints` | Paylaşılan mesaj aracı teslim meta verisi ipucu dizeleri |
    | `plugin-sdk/runtime-config-snapshot` | `getRuntimeConfig`, `getRuntimeConfigSnapshot` ve test anlık görüntüsü ayarlayıcıları gibi geçerli işlem yapılandırması anlık görüntüsü yardımcıları |
    | `plugin-sdk/telegram-command-config` | Paketli Telegram sözleşme yüzeyi kullanılamadığında bile Telegram komut adı/açıklaması normalleştirme ve yineleme/çakışma kontrolleri |
    | `plugin-sdk/text-autolink-runtime` | Geniş metin varili olmadan dosya referansı otomatik bağlantı algılama |
    | `plugin-sdk/approval-reaction-runtime` | Sabit kodlanmış onay tepki bağlamaları, tepki istemi yükleri, tepki hedef depoları ve yerel native exec istem bastırması için uyumluluk dışa aktarımı |
    | `plugin-sdk/approval-runtime` | Exec/Plugin onay yardımcıları, onay yeteneği oluşturucuları, kimlik doğrulama/profil yardımcıları, yerel yönlendirme/çalışma zamanı yardımcıları ve yapılandırılmış onay görüntüleme yolu biçimlendirmesi |
    | `plugin-sdk/reply-runtime` | Paylaşılan gelen/yanıt çalışma zamanı yardımcıları, parçalama, yönlendirme, Heartbeat, yanıt planlayıcı |
    | `plugin-sdk/reply-dispatch-runtime` | Dar kapsamlı yanıt yönlendirme/sonlandırma ve konuşma etiketi yardımcıları |
    | `plugin-sdk/reply-history` | Paylaşılan kısa pencere yanıt geçmişi yardımcıları. Yeni mesaj turu kodu `createChannelHistoryWindow` kullanmalıdır; alt düzey harita yardımcıları yalnızca kullanımdan kaldırılmış uyumluluk dışa aktarımları olarak kalır |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Dar kapsamlı metin/Markdown parçalama yardımcıları |
    | `plugin-sdk/session-store-runtime` | Oturum iş akışı yardımcıları (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), oturum kimliğine göre sınırlı son kullanıcı/asistan transkript metni okumaları, eski oturum deposu yolu/oturum anahtarı yardımcıları, güncellenme zamanı okumaları ve yalnızca geçişe yönelik tüm depo/dosya yolu uyumluluk yardımcıları |
    | `plugin-sdk/session-transcript-runtime` | Transkript kimliği, kapsamlı hedef/okuma/yazma yardımcıları, güncelleme yayımlama, yazma kilitleri ve transkript bellek isabet anahtarları |
    | `plugin-sdk/sqlite-runtime` | Birinci taraf çalışma zamanı için odaklanmış SQLite ajan şeması, yol ve işlem yardımcıları |
    | `plugin-sdk/cron-store-runtime` | Cron deposu yol/yükleme/kaydetme yardımcıları |
    | `plugin-sdk/state-paths` | Durum/OAuth dizin yolu yardımcıları |
    | `plugin-sdk/plugin-state-runtime` | Plugin sidecar SQLite anahtarlı durum türleri ile Plugin sahipli veritabanları için merkezi bağlantı pragma ve WAL bakım kurulumu |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey` ve `resolveDefaultAgentBoundAccountId` gibi rota/oturum anahtarı/hesap bağlama yardımcıları |
    | `plugin-sdk/status-helpers` | Paylaşılan kanal/hesap durum özeti yardımcıları, çalışma zamanı durumu varsayılanları ve sorun meta verisi yardımcıları |
    | `plugin-sdk/target-resolver-runtime` | Paylaşılan hedef çözümleyici yardımcıları |
    | `plugin-sdk/string-normalization-runtime` | Slug/dize normalleştirme yardımcıları |
    | `plugin-sdk/request-url` | Fetch/istek benzeri girdilerden dize URL'leri çıkarma |
    | `plugin-sdk/run-command` | Normalleştirilmiş stdout/stderr sonuçlarıyla süreli komut çalıştırıcı |
    | `plugin-sdk/param-readers` | Ortak araç/CLI parametre okuyucuları |
    | `plugin-sdk/tool-plugin` | Basit türlenmiş bir ajan aracı Plugin'i tanımlama ve manifest üretimi için statik meta verileri açığa çıkarma |
    | `plugin-sdk/tool-payload` | Araç sonucu nesnelerinden normalleştirilmiş yükleri çıkarma |
    | `plugin-sdk/tool-send` | Araç argümanlarından kanonik gönderme hedefi alanlarını çıkarma |
    | `plugin-sdk/sandbox` | Hızlı başarısız olan exec komut ön denetimi dahil sandbox arka uç türleri ve SSH/OpenShell komut yardımcıları |
    | `plugin-sdk/temp-path` | Paylaşılan geçici indirme yolu yardımcıları ve özel güvenli geçici çalışma alanları |
    | `plugin-sdk/logging-core` | Alt sistem günlükleyici ve redaksiyon yardımcıları |
    | `plugin-sdk/markdown-table-runtime` | Markdown tablo modu ve dönüştürme yardımcıları |
    | `plugin-sdk/model-session-runtime` | `applyModelOverrideToSessionEntry` ve `resolveAgentMaxConcurrent` gibi model/oturum geçersiz kılma yardımcıları |
    | `plugin-sdk/talk-config-runtime` | Talk sağlayıcı yapılandırması çözümleme yardımcıları |
    | `plugin-sdk/json-store` | Küçük JSON durum okuma/yazma yardımcıları |
    | `plugin-sdk/json-unsafe-integers` | Güvenli olmayan tam sayı literallerini dize olarak koruyan JSON ayrıştırma yardımcıları |
    | `plugin-sdk/file-lock` | Yeniden girişli dosya kilidi yardımcıları |
    | `plugin-sdk/persistent-dedupe` | Disk destekli tekilleştirme önbelleği yardımcıları |
    | `plugin-sdk/acp-runtime` | ACP çalışma zamanı/oturum ve yanıt yönlendirme yardımcıları |
    | `plugin-sdk/acp-runtime-backend` | Başlangıçta yüklenen Plugin'ler için hafif ACP arka uç kaydı ve yanıt yönlendirme yardımcıları |
    | `plugin-sdk/acp-binding-resolve-runtime` | Yaşam döngüsü başlangıç içe aktarımları olmadan salt okunur ACP bağlama çözümlemesi |
    | `plugin-sdk/agent-config-primitives` | Dar kapsamlı ajan çalışma zamanı yapılandırma şeması ilkelleri |
    | `plugin-sdk/boolean-param` | Gevşek boolean parametre okuyucusu |
    | `plugin-sdk/dangerous-name-runtime` | Tehlikeli ad eşleştirme çözümleme yardımcıları |
    | `plugin-sdk/device-bootstrap` | Cihaz bootstrap ve eşleştirme belirteci yardımcıları |
    | `plugin-sdk/extension-shared` | Paylaşılan pasif kanal, durum ve ortam proxy yardımcısı ilkelleri |
    | `plugin-sdk/models-provider-runtime` | `/models` komut/sağlayıcı yanıt yardımcıları |
    | `plugin-sdk/skill-commands-runtime` | Skill komutu listeleme yardımcıları |
    | `plugin-sdk/native-command-registry` | Yerel komut kayıt defteri/oluşturma/serileştirme yardımcıları |
    | `plugin-sdk/agent-harness` | Alt düzey ajan harness'leri için deneysel güvenilir Plugin yüzeyi: harness türleri, etkin çalışma yönlendirme/iptal yardımcıları, OpenClaw araç köprüsü yardımcıları, çalışma zamanı planı araç ilkesi yardımcıları, terminal sonuç sınıflandırması, araç ilerleme biçimlendirme/ayrıntı yardımcıları ve deneme sonucu yardımcı programları |
    | `plugin-sdk/provider-zai-endpoint` | Kullanımdan kaldırılmış Z.AI sağlayıcı sahipli uç nokta algılama cephesi; Z.AI Plugin public API'sini kullanın |
    | `plugin-sdk/async-lock-runtime` | Küçük çalışma zamanı durum dosyaları için işlem yerel async kilit yardımcısı |
    | `plugin-sdk/channel-activity-runtime` | Kanal etkinliği telemetri yardımcısı |
    | `plugin-sdk/concurrency-runtime` | Sınırlı async görev eşzamanlılığı yardımcısı |
    | `plugin-sdk/dedupe-runtime` | Bellek içi tekilleştirme önbelleği yardımcıları |
    | `plugin-sdk/delivery-queue-runtime` | Giden bekleyen teslimat boşaltma yardımcısı |
    | `plugin-sdk/file-access-runtime` | Güvenli yerel dosya ve medya kaynağı yolu yardımcıları |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat uyandırma, olay ve görünürlük yardımcıları |
    | `plugin-sdk/number-runtime` | Sayısal zorlama yardımcısı |
    | `plugin-sdk/secure-random-runtime` | Güvenli belirteç/UUID yardımcıları |
    | `plugin-sdk/system-event-runtime` | Sistem olay kuyruğu yardımcıları |
    | `plugin-sdk/transport-ready-runtime` | Taşıma hazır olma bekleme yardımcısı |
    | `plugin-sdk/exec-approvals-runtime` | Geniş infra-runtime varili olmadan exec onay ilkesi dosyası yardımcıları |
    | `plugin-sdk/infra-runtime` | Kullanımdan kaldırılmış uyumluluk shim'i; yukarıdaki odaklanmış çalışma zamanı alt yollarını kullanın |
    | `plugin-sdk/collection-runtime` | Küçük sınırlı önbellek yardımcıları |
    | `plugin-sdk/diagnostic-runtime` | Tanılama bayrağı, olay ve izleme bağlamı yardımcıları |
    | `plugin-sdk/error-runtime` | Hata grafiği, biçimlendirme, paylaşılan hata sınıflandırma yardımcıları, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Sarmalanmış fetch, proxy, EnvHttpProxyAgent seçeneği ve sabitlenmiş arama yardımcıları |
    | `plugin-sdk/runtime-fetch` | Proxy/korumalı fetch içe aktarımları olmadan dispatcher farkındalıklı çalışma zamanı fetch'i |
    | `plugin-sdk/inline-image-data-url-runtime` | Geniş medya çalışma zamanı yüzeyi olmadan satır içi görüntü data URL temizleyici ve imza koklama yardımcıları |
    | `plugin-sdk/response-limit-runtime` | Geniş medya çalışma zamanı yüzeyi olmadan sınırlı yanıt gövdesi okuyucu |
    | `plugin-sdk/session-binding-runtime` | Yapılandırılmış bağlama yönlendirmesi veya eşleştirme depoları olmadan geçerli konuşma bağlama durumu |
    | `plugin-sdk/session-store-runtime` | Geniş yapılandırma yazmaları/bakım içe aktarımları olmadan oturum deposu yardımcıları |
    | `plugin-sdk/sqlite-runtime` | Veritabanı yaşam döngüsü denetimleri olmadan odaklanmış SQLite ajan şeması, yol ve işlem yardımcıları |
    | `plugin-sdk/context-visibility-runtime` | Geniş yapılandırma/güvenlik içe aktarımları olmadan bağlam görünürlüğü çözümleme ve ek bağlam filtreleme |
    | `plugin-sdk/string-coerce-runtime` | Markdown/günlükleme içe aktarımları olmadan dar kapsamlı ilkel kayıt/dize zorlama ve normalleştirme yardımcıları |
    | `plugin-sdk/host-runtime` | Ana makine adı ve SCP ana makine normalleştirme yardımcıları |
    | `plugin-sdk/retry-runtime` | Yeniden deneme yapılandırması ve yeniden deneme çalıştırıcı yardımcıları |
    | `plugin-sdk/agent-runtime` | `resolveAgentDir`, `resolveDefaultAgentDir` ve kullanımdan kaldırılmış `resolveOpenClawAgentDir` uyumluluk dışa aktarımı dahil ajan dizini/kimliği/çalışma alanı yardımcıları |
    | `plugin-sdk/directory-runtime` | Yapılandırma destekli dizin sorgusu/tekilleştirme |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Yetenek ve test alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/media-runtime` | `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` ve kullanımı önerilmeyen `fetchRemoteMedia` dahil paylaşılan medya getirme/dönüştürme/depolama yardımcıları; bir URL OpenClaw medyasına dönüşmeliyse arabellek okumalarından önce depo yardımcılarını tercih edin |
    | `plugin-sdk/media-mime` | Dar kapsamlı MIME normalleştirme, dosya uzantısı eşleme, MIME algılama ve medya türü yardımcıları |
    | `plugin-sdk/media-store` | `saveMediaBuffer` ve `saveMediaStream` gibi dar kapsamlı medya deposu yardımcıları |
    | `plugin-sdk/media-generation-runtime` | Paylaşılan medya üretimi yük devretme yardımcıları, aday seçimi ve eksik model iletileri |
    | `plugin-sdk/media-understanding` | Medya anlama sağlayıcı türleri ve sağlayıcıya yönelik görsel/ses/yapılandırılmış çıkarım yardımcı dışa aktarımları |
    | `plugin-sdk/text-chunking` | Metin ve markdown parçalama/işleme yardımcıları, markdown tablo dönüştürme, yönerge etiketi temizleme ve güvenli metin yardımcı programları |
    | `plugin-sdk/text-chunking` | Giden metin parçalama yardımcısı |
    | `plugin-sdk/speech` | Konuşma sağlayıcı türleri ve sağlayıcıya yönelik yönerge, kayıt defteri, doğrulama, OpenAI uyumlu TTS oluşturucu ve konuşma yardımcı dışa aktarımları |
    | `plugin-sdk/speech-core` | Paylaşılan konuşma sağlayıcı türleri, kayıt defteri, yönerge, normalleştirme ve konuşma yardımcı dışa aktarımları |
    | `plugin-sdk/realtime-transcription` | Gerçek zamanlı transkripsiyon sağlayıcı türleri, kayıt defteri yardımcıları ve paylaşılan WebSocket oturum yardımcısı |
    | `plugin-sdk/realtime-bootstrap-context` | Sınırlı `IDENTITY.md`, `USER.md` ve `SOUL.md` bağlam enjeksiyonu için gerçek zamanlı profil önyükleme yardımcısı |
    | `plugin-sdk/realtime-voice` | Çıktı etkinliği izleme dahil gerçek zamanlı ses sağlayıcı türleri, kayıt defteri yardımcıları ve paylaşılan gerçek zamanlı ses davranışı yardımcıları |
    | `plugin-sdk/image-generation` | Görsel üretimi sağlayıcı türleri, görsel varlık/veri URL'si yardımcıları ve OpenAI uyumlu görsel sağlayıcı oluşturucu |
    | `plugin-sdk/image-generation-core` | Paylaşılan görsel üretimi türleri, yük devretme, kimlik doğrulama ve kayıt defteri yardımcıları |
    | `plugin-sdk/music-generation` | Müzik üretimi sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/music-generation-core` | Paylaşılan müzik üretimi türleri, yük devretme yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
    | `plugin-sdk/video-generation` | Video üretimi sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/video-generation-core` | Paylaşılan video üretimi türleri, yük devretme yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
    | `plugin-sdk/transcripts` | Paylaşılan transkript kaynak sağlayıcı türleri, kayıt defteri yardımcıları, oturum tanımlayıcıları ve sözce meta verileri |
    | `plugin-sdk/webhook-targets` | Webhook hedef kayıt defteri ve rota kurulum yardımcıları |
    | `plugin-sdk/webhook-path` | Kullanımı önerilmeyen uyumluluk takma adı; `plugin-sdk/webhook-ingress` kullanın |
    | `plugin-sdk/web-media` | Paylaşılan uzak/yerel medya yükleme yardımcıları |
    | `plugin-sdk/zod` | Kullanımı önerilmeyen uyumluluk yeniden dışa aktarımı; `zod` öğesini doğrudan `zod` kaynağından içe aktarın |
    | `plugin-sdk/testing` | Eski OpenClaw testleri için depo yerelinde kullanımı önerilmeyen uyumluluk toplu dışa aktarım modülü. Yeni depo testleri bunun yerine `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` veya `plugin-sdk/test-fixtures` gibi odaklanmış yerel test alt yollarını içe aktarmalıdır |
    | `plugin-sdk/plugin-test-api` | Depo test yardımcısı köprülerini içe aktarmadan doğrudan Plugin kaydı birim testleri için depo yerelinde en küçük `createTestPluginApi` yardımcısı |
    | `plugin-sdk/agent-runtime-test-contracts` | Kimlik doğrulama, teslim, yedek davranış, araç kancası, istem kaplaması, şema ve transkript projeksiyon testleri için depo yerelinde yerel ajan çalışma zamanı bağdaştırıcı sözleşmesi fikstürleri |
    | `plugin-sdk/channel-test-helpers` | Genel eylem/kurulum/durum sözleşmeleri, dizin doğrulamaları, hesap başlatma yaşam döngüsü, gönderme yapılandırması iş parçacığı oluşturma, çalışma zamanı taklitleri, durum sorunları, giden teslim ve kanca kaydı için depo yerelinde kanal odaklı test yardımcıları |
    | `plugin-sdk/channel-target-testing` | Kanal testleri için depo yerelinde paylaşılan hedef çözümleme hata durumu paketi |
    | `plugin-sdk/plugin-test-contracts` | Depo yerelinde Plugin paketi, kayıt, herkese açık yapıt, doğrudan içe aktarma, çalışma zamanı API'si ve içe aktarma yan etkisi sözleşmesi yardımcıları |
    | `plugin-sdk/provider-test-contracts` | Depo yerelinde sağlayıcı çalışma zamanı, kimlik doğrulama, keşif, onboard, katalog, sihirbaz, medya yeteneği, yeniden oynatma politikası, gerçek zamanlı STT canlı sesi, web arama/getirme ve akış sözleşmesi yardımcıları |
    | `plugin-sdk/provider-http-test-mocks` | `plugin-sdk/provider-http` kullanan sağlayıcı testleri için depo yerelinde isteğe bağlı Vitest HTTP/kimlik doğrulama taklitleri |
    | `plugin-sdk/test-fixtures` | Depo yerelinde genel CLI çalışma zamanı yakalama, sandbox bağlamı, skill yazıcı, ajan iletisi, sistem olayı, modül yeniden yükleme, paketlenmiş Plugin yolu, terminal metni, parçalama, kimlik doğrulama belirteci ve tipli durum fikstürleri |
    | `plugin-sdk/test-node-mocks` | Vitest `vi.mock("node:*")` fabrikaları içinde kullanım için depo yerelinde odaklanmış Node yerleşik taklit yardımcıları |
  </Accordion>

  <Accordion title="Bellek alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/memory-core` | Yönetici/yapılandırma/dosya/CLI yardımcıları için paketlenmiş memory-core yardımcı yüzeyi |
    | `plugin-sdk/memory-core-engine-runtime` | Bellek dizin/arama çalışma zamanı cephesi |
    | `plugin-sdk/memory-core-host-embedding-registry` | Hafif bellek gömme sağlayıcı kayıt defteri yardımcıları |
    | `plugin-sdk/memory-core-host-engine-foundation` | Bellek ana makinesi temel motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Bellek ana makinesi gömme sözleşmeleri, kayıt defteri erişimi, yerel sağlayıcı ve genel toplu/uzak yardımcılar. Bu yüzeydeki `registerMemoryEmbeddingProvider` kullanımı önerilmez; yeni sağlayıcılar için genel gömme sağlayıcı API'sini kullanın. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Bellek ana makinesi QMD motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-storage` | Bellek ana makinesi depolama motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-multimodal` | Bellek ana makinesi çok modlu yardımcıları |
    | `plugin-sdk/memory-core-host-query` | Bellek ana makinesi sorgu yardımcıları |
    | `plugin-sdk/memory-core-host-secret` | Bellek ana makinesi gizli yardımcıları |
    | `plugin-sdk/memory-core-host-events` | Kullanımı önerilmeyen uyumluluk takma adı; `plugin-sdk/memory-host-events` kullanın |
    | `plugin-sdk/memory-core-host-status` | Bellek ana makinesi durum yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-cli` | Bellek ana makinesi CLI çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-core` | Bellek ana makinesi çekirdek çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-files` | Bellek ana makinesi dosya/çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-host-core` | Bellek ana makinesi çekirdek çalışma zamanı yardımcıları için satıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-host-events` | Bellek ana makinesi olay günlüğü yardımcıları için satıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-host-files` | Kullanımı önerilmeyen uyumluluk takma adı; `plugin-sdk/memory-core-host-runtime-files` kullanın |
    | `plugin-sdk/memory-host-markdown` | Belleğe yakın Plugin'ler için paylaşılan yönetilen markdown yardımcıları |
    | `plugin-sdk/memory-host-search` | Arama yöneticisi erişimi için aktif bellek çalışma zamanı cephesi |
    | `plugin-sdk/memory-host-status` | Kullanımı önerilmeyen uyumluluk takma adı; `plugin-sdk/memory-core-host-status` kullanın |
  </Accordion>

  <Accordion title="Ayrılmış paketlenmiş yardımcı alt yolları">
    Ayrılmış paketlenmiş yardımcı SDK alt yolları,
    paketlenmiş Plugin kodu için dar kapsamlı, sahibine özgü yüzeylerdir.
    Paket derlemeleri ve takma ad oluşturma belirleyici kalsın diye SDK envanterinde izlenirler,
    ancak genel Plugin yazma API'leri değildirler. Yeni yeniden kullanılabilir ana makine sözleşmeleri
    `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` ve
    `plugin-sdk/plugin-config-runtime` gibi genel SDK alt yollarını kullanmalıdır.

    | Alt yol | Sahip ve amaç |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Kullanıcı MCP sunucu yapılandırmasını Codex app-server iş parçacığı yapılandırmasına projekte etmek için paketlenmiş Codex Plugin yardımcısı |
    | `plugin-sdk/codex-native-task-runtime` | Codex app-server yerel alt ajanlarını OpenClaw görev durumuna yansıtmak için paketlenmiş Codex Plugin yardımcısı |

  </Accordion>
</AccordionGroup>

## İlgili

- [Plugin SDK genel bakışı](/tr/plugins/sdk-overview)
- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)

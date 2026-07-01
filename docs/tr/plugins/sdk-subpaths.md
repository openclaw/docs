---
read_when:
    - Bir Plugin içe aktarması için doğru plugin-sdk alt yolunu seçme
    - Paketlenmiş Plugin alt yolları ve yardımcı yüzeyleri denetleniyor
summary: 'Plugin SDK alt yol kataloğu: hangi içe aktarmalar nerede bulunur, alana göre gruplandırılmış'
title: Plugin SDK alt yolları
x-i18n:
    generated_at: "2026-07-01T20:32:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d67ec0c9d837fa23a80abe46e5bab981e82e6c7a29cfbf84ff47a9eca5cc582f
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK'si, `openclaw/plugin-sdk/` altında dar kapsamlı genel alt yollardan oluşan bir küme olarak sunulur. Bu sayfa, yaygın kullanılan alt yolları amaçlarına göre gruplandırarak kataloglar. Üretilen derleyici giriş noktası envanteri `scripts/lib/plugin-sdk-entrypoints.json` içinde bulunur; paket dışa aktarımları, `scripts/lib/plugin-sdk-private-local-only-subpaths.json` içinde listelenen repo yerel test/dahili alt yollar çıkarıldıktan sonraki genel alt kümedir. Bakımcılar, genel dışa aktarım sayısını `pnpm plugin-sdk:surface` ile ve etkin ayrılmış yardımcı alt yolları `pnpm plugins:boundary-report:summary` ile denetleyebilir; kullanılmayan ayrılmış yardımcı dışa aktarımlar, genel SDK'de uyuyan uyumluluk borcu olarak kalmak yerine CI raporunu başarısız kılar.

Plugin yazma kılavuzu için bkz. [Plugin SDK genel bakışı](/tr/plugins/sdk-overview).

## Plugin girişi

| Alt yol                        | Temel dışa aktarımlar                                                                                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | `createMigrationItem` gibi migrasyon sağlayıcı öğesi yardımcıları, neden sabitleri, öğe durumu işaretleyicileri, redaksiyon yardımcıları ve `summarizeMigrationItems`   |
| `plugin-sdk/migration-runtime` | `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` ve `writeMigrationReport` gibi çalışma zamanı migrasyon yardımcıları                                       |
| `plugin-sdk/health`            | Birlikte paketlenen sağlık tüketicileri için Doctor sağlık denetimi kaydı, algılama, onarım, seçim, önem derecesi ve bulgu türleri                                    |

### Kullanımdan kaldırılmış uyumluluk ve test yardımcıları

Kullanımdan kaldırılmış alt yollar eski Plugin'ler için dışa aktarılmaya devam eder, ancak yeni kod aşağıdaki odaklanmış SDK alt yollarını kullanmalıdır. Bakımı yapılan liste `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` içindedir; CI, birlikte paketlenen üretim içe aktarımlarını buradan reddeder. `compat`, `config-types`, `infra-runtime`, `text-runtime` ve `zod` gibi geniş barrel'lar yalnızca uyumluluk içindir. `zod` öğesini doğrudan `zod` paketinden içe aktarın.

OpenClaw'ın Vitest destekli test yardımcısı alt yolları yalnızca repo yereldir ve artık paket dışa aktarımları değildir: `agent-runtime-test-contracts`, `channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`, `plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks` ve `testing`.

### Ayrılmış birlikte paketlenen Plugin yardımcı alt yolları

Bu alt yollar, genel SDK API'leri değil, sahibi olan birlikte paketlenen Plugin için Plugin'e ait uyumluluk yüzeyleridir: `plugin-sdk/codex-mcp-projection` ve `plugin-sdk/codex-native-task-runtime`. Sahipler arası uzantı içe aktarımları paket sözleşmesi koruma kuralları tarafından engellenir.

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Alt yol | Ana dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Kök `openclaw.json` Zod şema dışa aktarımı (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Plugin'e ait şemalar için önbelleğe alınmış JSON Schema doğrulama yardımcısı |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`; ayrıca `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Paylaşılan kurulum sihirbazı yardımcıları, kurulum çevirmeni, izin verilenler listesi istemleri, kurulum durumu oluşturucuları |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Kullanımdan kaldırılmış uyumluluk takma adı; `plugin-sdk/setup-runtime` kullanın |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Çok hesaplı yapılandırma/eylem kapısı yardımcıları, varsayılan hesap geri dönüş yardımcıları |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, hesap kimliği normalleştirme yardımcıları |
    | `plugin-sdk/account-resolution` | Hesap arama + varsayılan geri dönüş yardımcıları |
    | `plugin-sdk/account-helpers` | Dar kapsamlı hesap listesi/hesap eylemi yardımcıları |
    | `plugin-sdk/access-groups` | Erişim grubu izin verilenler listesi ayrıştırma ve gizlenmiş grup tanılama yardımcıları |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Kullanımdan kaldırılmış uyumluluk cephesi. `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Paylaşılan kanal yapılandırma şeması temel öğeleri, ayrıca Zod ve doğrudan JSON/TypeBox oluşturucuları |
    | `plugin-sdk/bundled-channel-config-schema` | Yalnızca bakımı yapılan paketlenmiş plugin'ler için paketlenmiş OpenClaw kanal yapılandırma şemaları |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Kendi tablolarını sabit kodlamadan zarf önekli metni tanıması gereken plugin'ler için kanonik paketlenmiş/resmi sohbet kanalı kimlikleri ve biçimlendirici etiketleri/takma adları. |
    | `plugin-sdk/channel-config-schema-legacy` | Paketlenmiş kanal yapılandırma şemaları için kullanımdan kaldırılmış uyumluluk takma adı |
    | `plugin-sdk/telegram-command-config` | Paketlenmiş sözleşme geri dönüşüyle Telegram özel komut normalleştirme/doğrulama yardımcıları |
    | `plugin-sdk/command-gating` | Dar kapsamlı komut yetkilendirme kapısı yardımcıları |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Kullanımdan kaldırılmış düşük düzey kanal giriş uyumluluk cephesi. Yeni alma yolları `plugin-sdk/channel-ingress-runtime` kullanmalıdır. |
    | `plugin-sdk/channel-ingress-runtime` | Taşınmış kanal alma yolları için deneysel üst düzey kanal giriş çalışma zamanı çözümleyicisi ve rota olgu oluşturucuları. Etkin izin verilenler listelerini, komut izin verilenler listelerini ve eski projeksiyonları her plugin içinde birleştirmek yerine bunu tercih edin. Bkz. [Kanal giriş API'si](/tr/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Kullanımdan kaldırılmış uyumluluk cephesi. `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/channel-outbound` | Mesaj yaşam döngüsü sözleşmeleri, ayrıca yanıt işlem hattı seçenekleri, alındılar, canlı önizleme/akış, yaşam döngüsü yardımcıları, giden kimlik, yük planlama, dayanıklı gönderimler ve mesaj gönderme bağlamı yardımcıları. Bkz. [Kanal giden API'si](/tr/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | `plugin-sdk/channel-outbound` için kullanımdan kaldırılmış uyumluluk takma adı, ayrıca eski yanıt gönderim cepheleri. |
    | `plugin-sdk/channel-message-runtime` | `plugin-sdk/channel-outbound` için kullanımdan kaldırılmış uyumluluk takma adı, ayrıca eski yanıt gönderim cepheleri. |
    | `plugin-sdk/inbound-envelope` | Paylaşılan gelen rota + zarf oluşturucu yardımcıları |
    | `plugin-sdk/inbound-reply-dispatch` | Kullanımdan kaldırılmış uyumluluk cephesi. Gelen çalıştırıcılar ve gönderim yüklemleri için `plugin-sdk/channel-inbound`, mesaj teslimi yardımcıları için `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/messaging-targets` | Kullanımdan kaldırılmış hedef ayrıştırma takma adı; `plugin-sdk/channel-targets` kullanın |
    | `plugin-sdk/outbound-media` | Paylaşılan giden medya yükleme ve barındırılan medya durumu yardımcıları |
    | `plugin-sdk/outbound-send-deps` | Kullanımdan kaldırılmış uyumluluk cephesi. `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/outbound-runtime` | Kullanımdan kaldırılmış uyumluluk cephesi. `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/poll-runtime` | Dar kapsamlı anket normalleştirme yardımcıları |
    | `plugin-sdk/thread-bindings-runtime` | İş parçacığı bağlama yaşam döngüsü ve bağdaştırıcı yardımcıları |
    | `plugin-sdk/agent-media-payload` | Eski agent medya yükü oluşturucu |
    | `plugin-sdk/conversation-runtime` | Konuşma/iş parçacığı bağlama, eşleştirme ve yapılandırılmış bağlama yardımcıları |
    | `plugin-sdk/runtime-config-snapshot` | Çalışma zamanı yapılandırma anlık görüntü yardımcısı |
    | `plugin-sdk/runtime-group-policy` | Çalışma zamanı grup politikası çözümleme yardımcıları |
    | `plugin-sdk/channel-status` | Paylaşılan kanal durumu anlık görüntü/özet yardımcıları |
    | `plugin-sdk/channel-config-primitives` | Dar kapsamlı kanal yapılandırma şeması temel öğeleri |
    | `plugin-sdk/channel-config-writes` | Kanal yapılandırma yazma yetkilendirme yardımcıları |
    | `plugin-sdk/channel-plugin-common` | Paylaşılan kanal plugin ön bölüm dışa aktarımları |
    | `plugin-sdk/allowlist-config-edit` | İzin verilenler listesi yapılandırma düzenleme/okuma yardımcıları |
    | `plugin-sdk/group-access` | Paylaşılan grup erişimi karar yardımcıları |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Kullanımdan kaldırılmış uyumluluk cepheleri. `plugin-sdk/channel-inbound` kullanın. |
    | `plugin-sdk/direct-dm-guard-policy` | Dar kapsamlı doğrudan DM kripto öncesi koruma politikası yardımcıları |
    | `plugin-sdk/discord` | Yayımlanmış `@openclaw/discord@2026.3.13` ve izlenen sahip uyumluluğu için kullanımdan kaldırılmış Discord uyumluluk cephesi; yeni plugin'ler genel kanal SDK alt yollarını kullanmalıdır |
    | `plugin-sdk/telegram-account` | İzlenen sahip uyumluluğu için kullanımdan kaldırılmış Telegram hesap çözümleme uyumluluk cephesi; yeni plugin'ler enjekte edilen çalışma zamanı yardımcılarını veya genel kanal SDK alt yollarını kullanmalıdır |
    | `plugin-sdk/zalouser` | Hâlâ gönderen komut yetkilendirmesini içe aktaran yayımlanmış Lark/Zalo paketleri için kullanımdan kaldırılmış Zalo Personal uyumluluk cephesi; yeni plugin'ler `plugin-sdk/command-auth` kullanmalıdır |
    | `plugin-sdk/interactive-runtime` | Semantik mesaj sunumu, teslimi ve eski etkileşimli yanıt yardımcıları. Bkz. [Mesaj Sunumu](/tr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Olay sınıflandırması, bağlam oluşturma, biçimlendirme, kökler, debounce, bahsetme eşleştirme, bahsetme politikası ve gelen günlükleme için paylaşılan gelen yardımcıları |
    | `plugin-sdk/channel-inbound-debounce` | Dar kapsamlı gelen debounce yardımcıları |
    | `plugin-sdk/channel-mention-gating` | Daha geniş gelen çalışma zamanı yüzeyi olmadan dar kapsamlı bahsetme politikası, bahsetme işaretçisi ve bahsetme metni yardımcıları |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Kullanımdan kaldırılmış uyumluluk cepheleri. `plugin-sdk/channel-inbound` veya `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/channel-pairing-paths` | Kullanımdan kaldırılmış uyumluluk cephesi. `plugin-sdk/channel-pairing` kullanın. |
    | `plugin-sdk/channel-reply-options-runtime` | Kullanımdan kaldırılmış uyumluluk cephesi. `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/channel-streaming` | Kullanımdan kaldırılmış uyumluluk cephesi. `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/channel-send-result` | Yanıt sonucu türleri |
    | `plugin-sdk/channel-actions` | Kanal mesaj eylemi yardımcıları, ayrıca plugin uyumluluğu için tutulan kullanımdan kaldırılmış yerel şema yardımcıları |
    | `plugin-sdk/channel-route` | Paylaşılan rota normalleştirme, ayrıştırıcı odaklı hedef çözümleme, iş parçacığı kimliği dizgeleştirme, tekilleştirme/kompakt rota anahtarları, ayrıştırılmış hedef türleri ve rota/hedef karşılaştırma yardımcıları |
    | `plugin-sdk/channel-targets` | Hedef ayrıştırma yardımcıları; rota karşılaştırma çağırıcıları `plugin-sdk/channel-route` kullanmalıdır |
    | `plugin-sdk/channel-contract` | Kanal sözleşme türleri |
    | `plugin-sdk/channel-feedback` | Geri bildirim/tepki bağlantılandırması |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` gibi dar kapsamlı gizli bilgi sözleşmesi yardımcıları ve gizli bilgi hedef türleri |
  </Accordion>

Kullanımdan kaldırılan kanal yardımcı aileleri yalnızca yayımlanmış Plugin
uyumluluğu için kullanılabilir kalır. Kaldırma planı şöyledir: bunları harici Plugin
geçiş penceresi boyunca koru, repo/paketle gelen Plugin'leri `channel-inbound` ve
`channel-outbound` üzerinde tut, ardından bir sonraki büyük SDK temizliğinde
uyumluluk alt yollarını kaldır. Bu, eski kanal ileti/çalışma zamanı, kanal
akışı, doğrudan DM erişimi, gelen yardımcı ayrımı, yanıt seçenekleri
ve eşleştirme yolu aileleri için geçerlidir.

  <Accordion title="Sağlayıcı alt yolları">
    | Alt yol | Ana dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Kurulum, katalog keşfi ve çalışma zamanı model hazırlığı için desteklenen LM Studio sağlayıcı cephesi |
    | `plugin-sdk/lmstudio-runtime` | Yerel sunucu varsayılanları, model keşfi, istek başlıkları ve yüklenmiş model yardımcıları için desteklenen LM Studio çalışma zamanı cephesi |
    | `plugin-sdk/provider-setup` | Seçilmiş yerel/kendi barındırılan sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/self-hosted-provider-setup` | Odaklı OpenAI uyumlu kendi barındırılan sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/cli-backend` | CLI arka uç varsayılanları + watchdog sabitleri |
    | `plugin-sdk/provider-auth-runtime` | Sağlayıcı plugin'leri için çalışma zamanı API anahtarı çözümleme yardımcıları |
    | `plugin-sdk/provider-oauth-runtime` | Genel sağlayıcı OAuth geri çağırma türleri, geri çağırma sayfası işleme, PKCE/durum yardımcıları, yetkilendirme girdisi ayrıştırma, token sona erme yardımcıları ve iptal yardımcıları |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` gibi API anahtarı başlangıç/profil yazma yardımcıları |
    | `plugin-sdk/provider-auth-result` | Standart OAuth kimlik doğrulama sonucu oluşturucusu |
    | `plugin-sdk/provider-env-vars` | Sağlayıcı kimlik doğrulama ortam değişkeni arama yardımcıları |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, OpenAI Codex kimlik doğrulama içe aktarma yardımcıları, kullanımdan kaldırılmış `resolveOpenClawAgentDir` uyumluluk dışa aktarımı |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan tekrar ilkesi oluşturucuları, sağlayıcı uç noktası yardımcıları ve paylaşılan model kimliği normalleştirme yardımcıları |
    | `plugin-sdk/provider-catalog-live-runtime` | Korunmuş `/models` tarzı keşif için canlı sağlayıcı model kataloğu yardımcıları: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, model kimliği filtreleme, TTL önbelleği ve statik fallback |
    | `plugin-sdk/provider-catalog-runtime` | Sözleşme testleri için sağlayıcı katalog genişletme çalışma zamanı hook'u ve plugin-sağlayıcı kayıt seam'leri |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Genel sağlayıcı HTTP/uç nokta yetenek yardımcıları, sağlayıcı HTTP hataları ve ses transkripsiyonu çok parçalı form yardımcıları |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` ve `WebFetchProviderPlugin` gibi dar web-fetch yapılandırma/seçim sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-fetch` | Web-fetch sağlayıcı kayıt/önbellek yardımcıları |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin etkinleştirme bağlantısına ihtiyaç duymayan sağlayıcılar için dar web-search yapılandırma/kimlik bilgisi yardımcıları |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` ve kapsamlı kimlik bilgisi ayarlayıcıları/alıcıları gibi dar web-search yapılandırma/kimlik bilgisi sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-search` | Web-search sağlayıcı kayıt/önbellek/çalışma zamanı yardımcıları |
    | `plugin-sdk/embedding-providers` | `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` ve `listEmbeddingProviders(...)` dahil genel embedding sağlayıcı türleri ve okuma yardımcıları; plugin'ler sağlayıcıları `api.registerEmbeddingProvider(...)` üzerinden kaydeder, böylece manifest sahipliği zorunlu kılınır |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` ve DeepSeek/Gemini/OpenAI şema temizliği + tanılama |
    | `plugin-sdk/provider-usage` | Sağlayıcı kullanım anlık görüntüsü türleri, paylaşılan kullanım getirme yardımcıları ve `fetchClaudeUsage` gibi sağlayıcı getiricileri |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri, düz metin tool-call uyumluluğu ve paylaşılan Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot sarmalayıcı yardımcıları |
    | `plugin-sdk/provider-stream-shared` | `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` ve Anthropic/DeepSeek/OpenAI uyumlu akış yardımcı programları dahil herkese açık paylaşılan sağlayıcı akış sarmalayıcı yardımcıları |
    | `plugin-sdk/provider-transport-runtime` | Korunmuş fetch, tool-result metni çıkarma, taşıma mesajı dönüşümleri ve yazılabilir taşıma olay akışları gibi yerel sağlayıcı taşıma yardımcıları |
    | `plugin-sdk/provider-onboard` | Başlangıç yapılandırma yaması yardımcıları |
    | `plugin-sdk/global-singleton` | Süreç yerelinde singleton/map/önbellek yardımcıları |
    | `plugin-sdk/group-activation` | Dar grup etkinleştirme modu ve komut ayrıştırma yardımcıları |
  </Accordion>

Sağlayıcı kullanım anlık görüntüleri normalde her biri bir etiket, kullanılan yüzde
ve isteğe bağlı sıfırlama zamanı içeren bir veya daha fazla kota `windows` bildirir.
Sıfırlanabilir kota pencereleri yerine bakiye veya hesap durumu metni sunan sağlayıcılar,
yüzdeler uydurmak yerine boş bir `windows` dizisiyle `summary` döndürmelidir.
OpenClaw bu özet metnini durum çıktısında gösterir; `error` yalnızca kullanım
uç noktası başarısız olduğunda veya kullanılabilir kullanım verisi döndürmediğinde kullanılmalıdır.

  <Accordion title="Kimlik doğrulama ve güvenlik alt yolları">
    | Alt yol | Ana dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, dinamik argüman menüsü biçimlendirme dahil komut kayıt yardımcıları, gönderen yetkilendirme yardımcıları |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` ve `buildHelpMessage` gibi komut/yardım mesajı oluşturucuları |
    | `plugin-sdk/approval-auth-runtime` | Onaylayıcı çözümleme ve aynı sohbet eylem kimlik doğrulama yardımcıları |
    | `plugin-sdk/approval-client-runtime` | Yerel exec onay profili/filtre yardımcıları |
    | `plugin-sdk/approval-delivery-runtime` | Yerel onay yeteneği/teslimat bağdaştırıcıları |
    | `plugin-sdk/approval-gateway-runtime` | Paylaşılan onay gateway çözümleme yardımcısı |
    | `plugin-sdk/approval-handler-adapter-runtime` | Sıcak kanal giriş noktaları için hafif yerel onay bağdaştırıcısı yükleme yardımcıları |
    | `plugin-sdk/approval-handler-runtime` | Daha geniş onay işleyici çalışma zamanı yardımcıları; yeterli olduklarında daha dar bağdaştırıcı/gateway seam'lerini tercih edin |
    | `plugin-sdk/approval-native-runtime` | Yerel onay hedefi, hesap bağlama, rota geçidi, yönlendirme fallback'i ve yerel yerel exec istemini bastırma yardımcıları |
    | `plugin-sdk/approval-reaction-runtime` | Sabit kodlanmış onay tepki bağları, tepki istemi payload'ları, tepki hedef depoları ve yerel yerel exec istemini bastırma için uyumluluk dışa aktarımı |
    | `plugin-sdk/approval-reply-runtime` | Exec/plugin onay yanıtı payload yardımcıları |
    | `plugin-sdk/approval-runtime` | Exec/plugin onay payload yardımcıları, yerel onay yönlendirme/çalışma zamanı yardımcıları ve `formatApprovalDisplayPath` gibi yapılandırılmış onay gösterimi yardımcıları |
    | `plugin-sdk/reply-dedupe` | Dar gelen yanıt tekilleştirme sıfırlama yardımcıları |
    | `plugin-sdk/channel-contract-testing` | Geniş test barrel'i olmadan dar kanal sözleşmesi test yardımcıları |
    | `plugin-sdk/command-auth-native` | Yerel komut kimlik doğrulaması, dinamik argüman menüsü biçimlendirme ve yerel oturum hedefi yardımcıları |
    | `plugin-sdk/command-detection` | Paylaşılan komut algılama yardımcıları |
    | `plugin-sdk/command-primitives-runtime` | Sıcak kanal yolları için hafif komut metni yüklemleri |
    | `plugin-sdk/command-surface` | Komut gövdesi normalleştirme ve komut yüzeyi yardımcıları |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Özel kanal ve Web UI cihaz kodu eşleştirme için lazy sağlayıcı kimlik doğrulama oturum açma akışı yardımcıları |
    | `plugin-sdk/channel-secret-runtime` | Kanal/plugin gizli yüzeyleri için dar gizli sözleşmesi toplama yardımcıları |
    | `plugin-sdk/secret-ref-runtime` | Gizli sözleşmesi/yapılandırma ayrıştırması için dar `coerceSecretRef` ve SecretRef türleme yardımcıları |
    | `plugin-sdk/secret-provider-integration` | Harici gizli sağlayıcı ön ayarları yayımlayan plugin'ler için yalnızca tür SecretRef sağlayıcı entegrasyon manifesti ve ön ayar sözleşmeleri |
    | `plugin-sdk/security-runtime` | Paylaşılan güven, DM geçitleme, yalnızca oluşturma yazmaları dahil kök sınırlı dosya/yol yardımcıları, sync/async atomik dosya değiştirme, kardeş geçici yazmalar, cihazlar arası taşıma fallback'i, özel dosya deposu yardımcıları, symlink üst dizin korumaları, harici içerik, hassas metin redaksiyonu, sabit zamanlı gizli karşılaştırması ve gizli toplama yardımcıları |
    | `plugin-sdk/ssrf-policy` | Host izin listesi ve özel ağ SSRF ilkesi yardımcıları |
    | `plugin-sdk/ssrf-dispatcher` | Geniş altyapı çalışma zamanı yüzeyi olmadan dar sabitlenmiş dispatcher yardımcıları |
    | `plugin-sdk/ssrf-runtime` | Sabitlenmiş dispatcher, SSRF korumalı fetch, SSRF hatası ve SSRF ilkesi yardımcıları |
    | `plugin-sdk/secret-input` | Gizli girdi ayrıştırma yardımcıları |
    | `plugin-sdk/webhook-ingress` | Webhook istek/hedef yardımcıları ve ham websocket/gövde zorlama |
    | `plugin-sdk/webhook-request-guards` | İstek gövdesi boyutu/zaman aşımı yardımcıları |
  </Accordion>

  <Accordion title="Çalışma zamanı ve depolama alt yolları">
    | Alt yol | Ana dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/runtime` | Geniş çalışma zamanı/günlükleme/yedekleme/Plugin kurulum yardımcıları |
    | `plugin-sdk/runtime-env` | Dar kapsamlı çalışma zamanı ortamı, günlükleyici, zaman aşımı, yeniden deneme ve geri çekilme yardımcıları |
    | `plugin-sdk/browser-config` | Normalleştirilmiş profil/varsayılanlar, CDP URL ayrıştırma ve tarayıcı denetimi kimlik doğrulama yardımcıları için desteklenen tarayıcı yapılandırma cephesi |
    | `plugin-sdk/agent-harness-task-runtime` | Ana bilgisayar tarafından verilen görev kapsamını kullanan harness destekli agent'lar için genel görev yaşam döngüsü ve tamamlama teslimi yardımcıları |
    | `plugin-sdk/codex-mcp-projection` | Kullanıcı MCP sunucusu yapılandırmasını Codex iş parçacığı yapılandırmasına yansıtmak için ayrılmış paket Codex yardımcısı; üçüncü taraf Plugin'ler için değildir |
    | `plugin-sdk/codex-native-task-runtime` | Yerel görev yansıtma/çalışma zamanı kablolaması için özel paket Codex yardımcısı; üçüncü taraf Plugin'ler için değildir |
    | `plugin-sdk/channel-runtime-context` | Genel kanal çalışma zamanı bağlamı kayıt ve arama yardımcıları |
    | `plugin-sdk/matrix` | Eski üçüncü taraf kanal paketleri için kullanımdan kaldırılmış Matrix uyumluluk cephesi; yeni Plugin'ler doğrudan `plugin-sdk/run-command` içe aktarmalıdır |
    | `plugin-sdk/mattermost` | Eski üçüncü taraf kanal paketleri için kullanımdan kaldırılmış Mattermost uyumluluk cephesi; yeni Plugin'ler genel SDK alt yollarını doğrudan içe aktarmalıdır |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Paylaşılan Plugin komut/hook/http/etkileşimli yardımcıları |
    | `plugin-sdk/hook-runtime` | Paylaşılan Webhook/dahili hook işlem hattı yardımcıları |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod` ve `createLazyRuntimeSurface` gibi geç çalışma zamanı içe aktarma/bağlama yardımcıları |
    | `plugin-sdk/process-runtime` | Süreç exec yardımcıları |
    | `plugin-sdk/cli-runtime` | CLI biçimlendirme, bekleme, sürüm, argüman çağırma ve geç komut grubu yardımcıları |
    | `plugin-sdk/qa-live-transport-scenarios` | Paylaşılan canlı taşıma QA senaryo kimlikleri, temel kapsam yardımcıları ve senaryo seçimi yardımcısı |
    | `plugin-sdk/gateway-method-runtime` | `contracts.gatewayMethodDispatch: ["authenticated-request"]` bildiren Plugin HTTP rotaları için ayrılmış Gateway yöntem dağıtım yardımcısı |
    | `plugin-sdk/gateway-runtime` | Gateway istemcisi, olay döngüsüne hazır istemci başlatma yardımcısı, gateway CLI RPC, gateway protokol hataları, duyurulan LAN ana bilgisayar çözümleme ve kanal durumu yama yardımcıları |
    | `plugin-sdk/config-contracts` | `OpenClawConfig` gibi Plugin yapılandırma şekilleri ve kanal/sağlayıcı yapılandırma türleri için odaklanmış yalnızca tür yapılandırma yüzeyi |
    | `plugin-sdk/plugin-config-runtime` | `requireRuntimeConfig`, `resolvePluginConfigObject` ve `resolveLivePluginConfigObject` gibi çalışma zamanı Plugin yapılandırması arama yardımcıları |
    | `plugin-sdk/config-mutation` | `mutateConfigFile`, `replaceConfigFile` ve `logConfigUpdated` gibi işlemsel yapılandırma mutasyon yardımcıları |
    | `plugin-sdk/message-tool-delivery-hints` | Paylaşılan mesaj aracı teslim meta verisi ipucu dizeleri |
    | `plugin-sdk/runtime-config-snapshot` | `getRuntimeConfig`, `getRuntimeConfigSnapshot` ve test anlık görüntüsü ayarlayıcıları gibi geçerli süreç yapılandırması anlık görüntü yardımcıları |
    | `plugin-sdk/telegram-command-config` | Paket Telegram sözleşme yüzeyi kullanılamadığında bile Telegram komut adı/açıklama normalleştirme ve yinelenen/çakışma denetimleri |
    | `plugin-sdk/text-autolink-runtime` | Geniş metin barrel'ı olmadan dosya başvurusu otomatik bağlantı algılama |
    | `plugin-sdk/approval-reaction-runtime` | Sabit kodlanmış onay tepkisi bağlamaları, tepki istemi yükleri, tepki hedefi depoları ve yerel yerel exec istemi bastırma için uyumluluk dışa aktarımı |
    | `plugin-sdk/approval-runtime` | Exec/Plugin onay yardımcıları, onay yeteneği oluşturucuları, kimlik doğrulama/profil yardımcıları, yerel yönlendirme/çalışma zamanı yardımcıları ve yapılandırılmış onay görüntüleme yolu biçimlendirmesi |
    | `plugin-sdk/reply-runtime` | Paylaşılan gelen/yanıt çalışma zamanı yardımcıları, parçalama, dağıtım, Heartbeat, yanıt planlayıcı |
    | `plugin-sdk/reply-dispatch-runtime` | Dar kapsamlı yanıt dağıtım/sonlandırma ve konuşma etiketi yardımcıları |
    | `plugin-sdk/reply-history` | Paylaşılan kısa pencereli yanıt geçmişi yardımcıları. Yeni mesaj dönüşü kodu `createChannelHistoryWindow` kullanmalıdır; alt düzey map yardımcıları yalnızca kullanımdan kaldırılmış uyumluluk dışa aktarımları olarak kalır |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Dar kapsamlı metin/markdown parçalama yardımcıları |
    | `plugin-sdk/session-store-runtime` | Oturum iş akışı yardımcıları (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), oturum kimliğine göre sınırlı son kullanıcı/asistan transkript metni okumaları, eski oturum deposu yolu/oturum anahtarı yardımcıları, güncellenme zamanı okumaları ve yalnızca geçiş amaçlı tüm depo/dosya yolu uyumluluk yardımcıları |
    | `plugin-sdk/session-transcript-runtime` | Transkript kimliği, kapsamlı hedef/okuma/yazma yardımcıları, güncelleme yayımlama, yazma kilitleri ve transkript bellek isabet anahtarları |
    | `plugin-sdk/sqlite-runtime` | Birinci taraf çalışma zamanı için odaklanmış SQLite agent şeması, yol ve işlem yardımcıları |
    | `plugin-sdk/cron-store-runtime` | Cron depo yolu/yükleme/kaydetme yardımcıları |
    | `plugin-sdk/state-paths` | Durum/OAuth dizin yolu yardımcıları |
    | `plugin-sdk/plugin-state-runtime` | Plugin sidecar SQLite anahtarlı durum türleri ve Plugin'e ait veritabanları için merkezi bağlantı pragma ve WAL bakım kurulumu |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey` ve `resolveDefaultAgentBoundAccountId` gibi rota/oturum anahtarı/hesap bağlama yardımcıları |
    | `plugin-sdk/status-helpers` | Paylaşılan kanal/hesap durum özeti yardımcıları, çalışma zamanı durumu varsayılanları ve sorun meta verisi yardımcıları |
    | `plugin-sdk/target-resolver-runtime` | Paylaşılan hedef çözümleyici yardımcıları |
    | `plugin-sdk/string-normalization-runtime` | Slug/dize normalleştirme yardımcıları |
    | `plugin-sdk/request-url` | fetch/istek benzeri girdilerden dize URL'leri çıkar |
    | `plugin-sdk/run-command` | Normalleştirilmiş stdout/stderr sonuçlarıyla zamanlanmış komut çalıştırıcı |
    | `plugin-sdk/param-readers` | Ortak araç/CLI parametre okuyucuları |
    | `plugin-sdk/tool-plugin` | Basit türlendirilmiş agent aracı Plugin'i tanımla ve manifest oluşturma için statik meta veriyi açığa çıkar |
    | `plugin-sdk/tool-payload` | Araç sonuç nesnelerinden normalleştirilmiş yükleri çıkar |
    | `plugin-sdk/tool-send` | Araç argümanlarından kanonik gönderim hedefi alanlarını çıkar |
    | `plugin-sdk/sandbox` | Hızlı başarısız olan exec komutu ön denetimi dahil olmak üzere sandbox arka uç türleri ve SSH/OpenShell komut yardımcıları |
    | `plugin-sdk/temp-path` | Paylaşılan geçici indirme yolu yardımcıları ve özel güvenli geçici çalışma alanları |
    | `plugin-sdk/logging-core` | Alt sistem günlükleyici ve redaksiyon yardımcıları |
    | `plugin-sdk/markdown-table-runtime` | Markdown tablo modu ve dönüştürme yardımcıları |
    | `plugin-sdk/model-session-runtime` | `applyModelOverrideToSessionEntry` ve `resolveAgentMaxConcurrent` gibi model/oturum geçersiz kılma yardımcıları |
    | `plugin-sdk/talk-config-runtime` | Konuşma sağlayıcısı yapılandırma çözümleme yardımcıları |
    | `plugin-sdk/json-store` | Küçük JSON durum okuma/yazma yardımcıları |
    | `plugin-sdk/json-unsafe-integers` | Güvenli olmayan tamsayı sabitlerini dize olarak koruyan JSON ayrıştırma yardımcıları |
    | `plugin-sdk/file-lock` | Yeniden girişli dosya kilidi yardımcıları |
    | `plugin-sdk/persistent-dedupe` | Disk destekli tekilleştirme önbelleği yardımcıları |
    | `plugin-sdk/acp-runtime` | ACP çalışma zamanı/oturum ve yanıt dağıtım yardımcıları |
    | `plugin-sdk/acp-runtime-backend` | Başlangıçta yüklenen Plugin'ler için hafif ACP arka uç kayıt ve yanıt dağıtım yardımcıları |
    | `plugin-sdk/acp-binding-resolve-runtime` | Yaşam döngüsü başlangıç içe aktarmaları olmadan salt okunur ACP bağlama çözümlemesi |
    | `plugin-sdk/agent-config-primitives` | Dar kapsamlı agent çalışma zamanı yapılandırma şeması temel öğeleri |
    | `plugin-sdk/boolean-param` | Gevşek boolean parametre okuyucu |
    | `plugin-sdk/dangerous-name-runtime` | Tehlikeli ad eşleştirme çözümleme yardımcıları |
    | `plugin-sdk/device-bootstrap` | Cihaz bootstrap ve eşleştirme belirteci yardımcıları |
    | `plugin-sdk/extension-shared` | Paylaşılan pasif kanal, durum ve ortam proxy yardımcı temel öğeleri |
    | `plugin-sdk/models-provider-runtime` | `/models` komut/sağlayıcı yanıt yardımcıları |
    | `plugin-sdk/skill-commands-runtime` | Skill komutu listeleme yardımcıları |
    | `plugin-sdk/native-command-registry` | Yerel komut kayıt defteri/oluşturma/serileştirme yardımcıları |
    | `plugin-sdk/agent-harness` | Alt düzey agent harness'ları için deneysel güvenilir Plugin yüzeyi: harness türleri, aktif çalıştırma yönlendirme/iptal yardımcıları, OpenClaw araç köprüsü yardımcıları, çalışma zamanı planı araç ilkesi yardımcıları, terminal sonuç sınıflandırması, araç ilerleme biçimlendirme/ayrıntı yardımcıları ve deneme sonucu yardımcı programları |
    | `plugin-sdk/provider-zai-endpoint` | Kullanımdan kaldırılmış Z.AI sağlayıcısına ait uç nokta algılama cephesi; Z.AI Plugin genel API'sini kullanın |
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
    | `plugin-sdk/transport-ready-runtime` | Taşıma hazır olma bekleme yardımcısı |
    | `plugin-sdk/exec-approvals-runtime` | Geniş infra-runtime barrel'ı olmadan exec onay ilkesi dosya yardımcıları |
    | `plugin-sdk/infra-runtime` | Kullanımdan kaldırılmış uyumluluk shim'i; yukarıdaki odaklanmış çalışma zamanı alt yollarını kullanın |
    | `plugin-sdk/collection-runtime` | Küçük sınırlı önbellek yardımcıları |
    | `plugin-sdk/diagnostic-runtime` | Tanılama bayrağı, olay ve iz bağlamı yardımcıları |
    | `plugin-sdk/error-runtime` | Hata grafiği, biçimlendirme, paylaşılan hata sınıflandırma yardımcıları, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Sarılmış fetch, proxy, EnvHttpProxyAgent seçeneği ve sabitlenmiş arama yardımcıları |
    | `plugin-sdk/runtime-fetch` | Proxy/korumalı fetch içe aktarmaları olmadan dispatcher duyarlı çalışma zamanı fetch'i |
    | `plugin-sdk/inline-image-data-url-runtime` | Geniş medya çalışma zamanı yüzeyi olmadan satır içi görüntü veri URL'si temizleyici ve imza koklama yardımcıları |
    | `plugin-sdk/response-limit-runtime` | Geniş medya çalışma zamanı yüzeyi olmadan sınırlı yanıt gövdesi okuyucu |
    | `plugin-sdk/session-binding-runtime` | Yapılandırılmış bağlama yönlendirmesi veya eşleştirme depoları olmadan geçerli konuşma bağlama durumu |
    | `plugin-sdk/session-store-runtime` | Geniş yapılandırma yazmaları/bakım içe aktarmaları olmadan oturum deposu yardımcıları |
    | `plugin-sdk/sqlite-runtime` | Veritabanı yaşam döngüsü denetimleri olmadan odaklanmış SQLite agent şeması, yol ve işlem yardımcıları |
    | `plugin-sdk/context-visibility-runtime` | Geniş yapılandırma/güvenlik içe aktarmaları olmadan bağlam görünürlüğü çözümlemesi ve ek bağlam filtreleme |
    | `plugin-sdk/string-coerce-runtime` | Markdown/günlükleme içe aktarmaları olmadan dar kapsamlı ilkel kayıt/dize zorlama ve normalleştirme yardımcıları |
    | `plugin-sdk/host-runtime` | Ana bilgisayar adı ve SCP ana bilgisayar normalleştirme yardımcıları |
    | `plugin-sdk/retry-runtime` | Yeniden deneme yapılandırması ve yeniden deneme çalıştırıcısı yardımcıları |
    | `plugin-sdk/agent-runtime` | `resolveAgentDir`, `resolveDefaultAgentDir` ve kullanımdan kaldırılmış `resolveOpenClawAgentDir` uyumluluk dışa aktarımı dahil olmak üzere agent dizini/kimliği/çalışma alanı yardımcıları |
    | `plugin-sdk/directory-runtime` | Yapılandırma destekli dizin sorgusu/tekilleştirme |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Yetenek ve test alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/media-runtime` | `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` ve kullanımdan kaldırılmış `fetchRemoteMedia` dahil paylaşılan medya getirme/dönüştürme/depolama yardımcıları; bir URL OpenClaw medyasına dönüşmesi gerektiğinde arabellek okumalarından önce depolama yardımcılarını tercih edin |
    | `plugin-sdk/media-mime` | Dar kapsamlı MIME normalleştirme, dosya uzantısı eşleme, MIME algılama ve medya türü yardımcıları |
    | `plugin-sdk/media-store` | `saveMediaBuffer` ve `saveMediaStream` gibi dar kapsamlı medya deposu yardımcıları |
    | `plugin-sdk/media-generation-runtime` | Paylaşılan medya üretimi failover yardımcıları, aday seçimi ve eksik model mesajlaşması |
    | `plugin-sdk/media-understanding` | Medya anlama sağlayıcı türleri ve sağlayıcıya yönelik görüntü/ses/yapılandırılmış çıkarım yardımcı dışa aktarımları |
    | `plugin-sdk/text-chunking` | Metin ve markdown parçalama/işleme yardımcıları, markdown tablo dönüştürme, yönerge etiketi soyma ve güvenli metin yardımcı programları |
    | `plugin-sdk/text-chunking` | Giden metin parçalama yardımcısı |
    | `plugin-sdk/speech` | Konuşma sağlayıcı türleri ve sağlayıcıya yönelik yönerge, kayıt, doğrulama, OpenAI uyumlu TTS oluşturucu ve konuşma yardımcı dışa aktarımları |
    | `plugin-sdk/speech-core` | Paylaşılan konuşma sağlayıcı türleri, kayıt, yönerge, normalleştirme ve konuşma yardımcı dışa aktarımları |
    | `plugin-sdk/realtime-transcription` | Gerçek zamanlı transkripsiyon sağlayıcı türleri, kayıt yardımcıları ve paylaşılan WebSocket oturum yardımcısı |
    | `plugin-sdk/realtime-bootstrap-context` | Sınırlı `IDENTITY.md`, `USER.md` ve `SOUL.md` bağlam enjeksiyonu için gerçek zamanlı profil bootstrap yardımcısı |
    | `plugin-sdk/realtime-voice` | Çıkış etkinliği izleme dahil gerçek zamanlı ses sağlayıcı türleri, kayıt yardımcıları ve paylaşılan gerçek zamanlı ses davranışı yardımcıları |
    | `plugin-sdk/image-generation` | Görüntü üretimi sağlayıcı türleri, görüntü varlığı/veri URL'si yardımcıları ve OpenAI uyumlu görüntü sağlayıcı oluşturucu |
    | `plugin-sdk/image-generation-core` | Paylaşılan görüntü üretimi türleri, failover, kimlik doğrulama ve kayıt yardımcıları |
    | `plugin-sdk/music-generation` | Müzik üretimi sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/music-generation-core` | Paylaşılan müzik üretimi türleri, failover yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
    | `plugin-sdk/video-generation` | Video üretimi sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/video-generation-core` | Paylaşılan video üretimi türleri, failover yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
    | `plugin-sdk/transcripts` | Paylaşılan transkript kaynak sağlayıcı türleri, kayıt yardımcıları, oturum tanımlayıcıları ve sözce meta verileri |
    | `plugin-sdk/webhook-targets` | Webhook hedef kaydı ve rota kurulum yardımcıları |
    | `plugin-sdk/webhook-path` | Kullanımdan kaldırılmış uyumluluk takma adı; `plugin-sdk/webhook-ingress` kullanın |
    | `plugin-sdk/web-media` | Paylaşılan uzak/yerel medya yükleme yardımcıları |
    | `plugin-sdk/zod` | Kullanımdan kaldırılmış uyumluluk yeniden dışa aktarımı; `zod` paketinden doğrudan `zod` içe aktarın |
    | `plugin-sdk/testing` | Eski OpenClaw testleri için depoya yerel, kullanımdan kaldırılmış uyumluluk barrel'ı. Yeni depo testleri bunun yerine `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` veya `plugin-sdk/test-fixtures` gibi odaklı yerel test alt yollarını içe aktarmalıdır |
    | `plugin-sdk/plugin-test-api` | Depo test yardımcı köprülerini içe aktarmadan doğrudan plugin kaydı birim testleri için depoya yerel minimal `createTestPluginApi` yardımcısı |
    | `plugin-sdk/agent-runtime-test-contracts` | Kimlik doğrulama, teslim, fallback, araç kancası, istem katmanı, şema ve transkript projeksiyon testleri için depoya yerel yerel agent-runtime bağdaştırıcı sözleşme fikstürleri |
    | `plugin-sdk/channel-test-helpers` | Genel eylem/kurulum/durum sözleşmeleri, dizin doğrulamaları, hesap başlangıç yaşam döngüsü, send-config iş parçacığı, çalışma zamanı mock'ları, durum sorunları, giden teslim ve kanca kaydı için depoya yerel kanal odaklı test yardımcıları |
    | `plugin-sdk/channel-target-testing` | Kanal testleri için depoya yerel paylaşılan hedef çözümleme hata durumu paketi |
    | `plugin-sdk/plugin-test-contracts` | Depoya yerel plugin paketi, kayıt, genel artifact, doğrudan içe aktarma, çalışma zamanı API'si ve içe aktarma yan etkisi sözleşme yardımcıları |
    | `plugin-sdk/provider-test-contracts` | Depoya yerel sağlayıcı çalışma zamanı, kimlik doğrulama, keşif, onboard, katalog, sihirbaz, medya yeteneği, yeniden oynatma politikası, gerçek zamanlı STT canlı ses, web arama/getirme ve akış sözleşme yardımcıları |
    | `plugin-sdk/provider-http-test-mocks` | `plugin-sdk/provider-http` kullanan sağlayıcı testleri için depoya yerel isteğe bağlı Vitest HTTP/kimlik doğrulama mock'ları |
    | `plugin-sdk/test-fixtures` | Depoya yerel genel CLI çalışma zamanı yakalama, sandbox bağlamı, skill yazıcı, agent-message, system-event, modül yeniden yükleme, paketlenmiş plugin yolu, terminal metni, parçalama, auth-token ve typed-case fikstürleri |
    | `plugin-sdk/test-node-mocks` | Vitest `vi.mock("node:*")` fabrikaları içinde kullanım için depoya yerel odaklı Node yerleşik mock yardımcıları |
  </Accordion>

  <Accordion title="Bellek alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/memory-core` | Yönetici/yapılandırma/dosya/CLI yardımcıları için paketlenmiş memory-core yardımcı yüzeyi |
    | `plugin-sdk/memory-core-engine-runtime` | Bellek dizini/arama çalışma zamanı cephesi |
    | `plugin-sdk/memory-core-host-embedding-registry` | Hafif bellek embedding sağlayıcı kayıt yardımcıları |
    | `plugin-sdk/memory-core-host-engine-foundation` | Bellek host foundation motor dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Bellek host embedding sözleşmeleri, kayıt erişimi, yerel sağlayıcı ve genel batch/uzak yardımcılar. Bu yüzeydeki `registerMemoryEmbeddingProvider` kullanımdan kaldırılmıştır; yeni sağlayıcılar için genel embedding sağlayıcı API'sini kullanın. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Bellek host QMD motor dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-storage` | Bellek host depolama motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-multimodal` | Bellek host çok modlu yardımcıları |
    | `plugin-sdk/memory-core-host-query` | Bellek host sorgu yardımcıları |
    | `plugin-sdk/memory-core-host-secret` | Bellek host gizli yardımcıları |
    | `plugin-sdk/memory-core-host-events` | Kullanımdan kaldırılmış uyumluluk takma adı; `plugin-sdk/memory-host-events` kullanın |
    | `plugin-sdk/memory-core-host-status` | Bellek host durum yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-cli` | Bellek host CLI çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-core` | Bellek host core çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-files` | Bellek host dosya/çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-host-core` | Bellek host core çalışma zamanı yardımcıları için tedarikçiden bağımsız takma ad |
    | `plugin-sdk/memory-host-events` | Bellek host olay günlüğü yardımcıları için tedarikçiden bağımsız takma ad |
    | `plugin-sdk/memory-host-files` | Kullanımdan kaldırılmış uyumluluk takma adı; `plugin-sdk/memory-core-host-runtime-files` kullanın |
    | `plugin-sdk/memory-host-markdown` | Belleğe yakın plugin'ler için paylaşılan yönetilen-markdown yardımcıları |
    | `plugin-sdk/memory-host-search` | Arama yöneticisi erişimi için Active Memory çalışma zamanı cephesi |
    | `plugin-sdk/memory-host-status` | Kullanımdan kaldırılmış uyumluluk takma adı; `plugin-sdk/memory-core-host-status` kullanın |
  </Accordion>

  <Accordion title="Ayrılmış paketlenmiş yardımcı alt yolları">
    Ayrılmış paketlenmiş yardımcı SDK alt yolları,
    paketlenmiş plugin kodu için dar kapsamlı, sahibe özgü yüzeylerdir. Paket
    derlemeleri ve takma adlandırma deterministik kalsın diye SDK envanterinde
    izlenirler, ancak genel plugin yazma API'leri değildirler. Yeni yeniden kullanılabilir host sözleşmeleri,
    `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` ve
    `plugin-sdk/plugin-config-runtime` gibi genel SDK alt yollarını kullanmalıdır.

    | Alt yol | Sahip ve amaç |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Kullanıcı MCP sunucu yapılandırmasını Codex app-server iş parçacığı yapılandırmasına projekte etmek için paketlenmiş Codex plugin yardımcısı |
    | `plugin-sdk/codex-native-task-runtime` | Codex app-server yerel alt agent'larını OpenClaw görev durumuna yansıtmak için paketlenmiş Codex plugin yardımcısı |

  </Accordion>
</AccordionGroup>

## İlgili

- [Plugin SDK genel bakışı](/tr/plugins/sdk-overview)
- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)

---
read_when:
    - Bir plugin içe aktarımı için doğru plugin-sdk alt yolunu seçme
    - Paketle gelen Plugin alt yollarını ve yardımcı yüzeylerini denetleme
summary: 'Plugin SDK alt yol kataloğu: hangi içe aktarımların nerede bulunduğu, alana göre gruplandırılmış olarak'
title: Plugin SDK alt yolları
x-i18n:
    generated_at: "2026-07-16T17:28:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 937b616d7a95c250f7ff328ea3faa12143272722ffa638f50214fdd72ef5f225
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK, `openclaw/plugin-sdk/` altında dar kapsamlı genel alt yollar kümesi olarak sunulur. Bu sayfa, yaygın kullanılan alt yolları amaçlarına göre gruplandırarak listeler. Yüzeyi üç dosya tanımlar:

- `scripts/lib/plugin-sdk-entrypoints.json`: derlemenin oluşturduğu, bakımı yapılan giriş noktası envanteri.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: depoya özgü test/dahili alt yollar. Paket dışa aktarımları, bu listenin envanterden çıkarılmasıyla elde edilir.
- `src/plugin-sdk/entrypoints.ts`: kullanımdan kaldırılmış alt yollar, ayrılmış paketlenmiş yardımcılar, desteklenen paketlenmiş cepheler ve Plugin'e ait genel yüzeyler için sınıflandırma meta verileri.

Bakım sorumluları, genel dışa aktarım sayısını `pnpm plugin-sdk:surface` ve etkin ayrılmış yardımcı alt yolları `pnpm plugins:boundary-report:summary` ile denetler; kullanılmayan ayrılmış yardımcı dışa aktarımlar, genel SDK'da atıl uyumluluk borcu olarak kalmak yerine CI raporunun başarısız olmasına neden olur.

Plugin geliştirme kılavuzu için [Plugin SDK'ya genel bakış](/tr/plugins/sdk-overview) bölümüne bakın.

## Plugin girişi

| Alt yol                        | Temel dışa aktarımlar                                                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | `createMigrationItem` gibi geçiş sağlayıcısı öğe yardımcıları, neden sabitleri, öğe durum işaretçileri, redaksiyon yardımcıları ve `summarizeMigrationItems`                                                  |
| `plugin-sdk/migration-runtime` | `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` ve `writeMigrationReport` gibi çalışma zamanı geçiş yardımcıları                                             |
| `plugin-sdk/health`            | Paketlenmiş sistem durumu tüketicileri için Doctor sistem durumu denetimi kaydı, algılama, onarım, seçim, önem derecesi ve bulgu türleri                                                                                |
| `plugin-sdk/config-schema`     | Kullanımdan kaldırıldı. Kök `openclaw.json` Zod şeması (`OpenClawSchema`); bunun yerine Plugin'e özgü yerel şemalar tanımlayın ve `plugin-sdk/json-schema-runtime` ile doğrulayın                                                  |

### Kullanımdan kaldırılmış uyumluluk ve test yardımcıları

Kullanımdan kaldırılmış alt yollar eski Plugin'ler için dışa aktarılmaya devam eder, ancak yeni kod aşağıdaki odaklanmış SDK alt yollarını kullanmalıdır. Bakımı yapılan liste `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` şeklindedir; CI, bu listeden yapılan paketlenmiş üretim içe aktarımlarını reddeder. `plugin-sdk/compat`, `plugin-sdk/config-types`, `plugin-sdk/infra-runtime` ve `plugin-sdk/text-runtime` gibi geniş kapsamlı dışa aktarım grupları yalnızca uyumluluk içindir; `plugin-sdk/zod` ise bir uyumluluk yeniden dışa aktarımıdır: `zod` öğesini doğrudan `zod` konumundan içe aktarın. `plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`, `plugin-sdk/channel-runtime`, `plugin-sdk/cli-runtime`, `plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`, `plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` ve `plugin-sdk/security-runtime` geniş kapsamlı etki alanı dışa aktarım grupları da odaklanmış alt yollar lehine kullanımdan kaldırılmıştır.

OpenClaw'ın Vitest tabanlı test yardımcısı alt yolları yalnızca depoya özgüdür ve artık paket dışa aktarımları değildir: `agent-runtime-test-contracts`, `channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`, `plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`, `reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`, `test-node-mocks` ve `testing`. Özel paketlenmiş yardımcı yüzeyleri `ssrf-runtime-internal` ve `codex-native-task-runtime` de yalnızca depoya özgüdür.

### Ayrılmış paketlenmiş Plugin yardımcısı alt yolları

`plugin-sdk/codex-mcp-projection` tek ayrılmış alt yoldur: genel bir SDK API'si değil, paketlenmiş Codex Plugin'i için Plugin'e ait bir uyumluluk yüzeyidir. Farklı sahipler arasındaki Plugin içe aktarımları paket sözleşmesi koruma önlemleri tarafından engellenir ve ayrılmış bir alt yol artık içe aktarılmadığında CI başarısız olur. `plugin-sdk/codex-native-task-runtime` yalnızca depoya özgüdür ve bir paket dışa aktarımı değildir.

`src/plugin-sdk/entrypoints.ts`, genel sözleşmeler bunların yerini alana kadar paketlenmiş Plugin'leri tarafından desteklenen SDK giriş noktaları olan desteklenen paketlenmiş cepheleri de izler: `plugin-sdk/discord`, `plugin-sdk/lmstudio`, `plugin-sdk/lmstudio-runtime`, `plugin-sdk/matrix`, `plugin-sdk/mattermost`, `plugin-sdk/memory-core-engine-runtime`, `plugin-sdk/provider-zai-endpoint`, `plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`, `plugin-sdk/tts-runtime` ve `plugin-sdk/zalouser`. Bunların bazıları yeni kod için de kullanımdan kaldırılmıştır; aşağıdaki satır bazındaki notlara bakın.

  <AccordionGroup>
  <Accordion title="Kanal alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | Plugin tarafından yönetilen şemalar için önbelleğe alınmış JSON Schema doğrulama yardımcısı |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`; ayrıca `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Paylaşılan kurulum sihirbazı yardımcıları, kurulum çevirmeni, izin listesi istemleri, kurulum durumu oluşturucuları |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Kullanımdan kaldırılmış uyumluluk diğer adı; `plugin-sdk/setup-runtime` kullanın |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Çok hesaplı yapılandırma/eylem geçidi yardımcıları, varsayılan hesaba geri dönüş yardımcıları |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, hesap kimliği normalleştirme yardımcıları |
    | `plugin-sdk/account-resolution` | Hesap arama ve varsayılana geri dönüş yardımcıları |
    | `plugin-sdk/account-helpers` | Dar kapsamlı hesap listesi/hesap eylemi yardımcıları |
    | `plugin-sdk/access-groups` | Erişim grubu izin listesi ayrıştırma ve gizlenmiş grup tanılama yardımcıları |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Kullanımdan kaldırılmış uyumluluk cephesi. `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Paylaşılan kanal yapılandırma şeması temel öğelerinin yanı sıra Zod ve doğrudan JSON/TypeBox oluşturucuları |
    | `plugin-sdk/bundled-channel-config-schema` | Yalnızca bakımı sürdürülen paketlenmiş pluginler için paketlenmiş OpenClaw kanal yapılandırma şemaları |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Kendi tablolarını sabit kodlamadan zarf önekli metni tanıması gereken pluginler için standart paketlenmiş/resmî sohbet kanalı kimliklerinin yanı sıra biçimlendirici etiketleri/diğer adları. |
    | `plugin-sdk/channel-config-schema-legacy` | Paketlenmiş kanal yapılandırma şemaları için kullanımdan kaldırılmış uyumluluk diğer adı |
    | `plugin-sdk/telegram-command-config` | Kullanımdan kaldırılmış Telegram komut adı/açıklaması normalleştirmesi ve yineleme/çakışma denetimleri; yeni plugin kodunda plugin yerelindeki komut yapılandırması işlemeyi kullanın |
    | `plugin-sdk/command-gating` | Dar kapsamlı komut yetkilendirme geçidi yardımcıları |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | Taşınmış kanal alma yolları için deneysel üst düzey kanal giriş çalışma zamanı çözümleyicisi ve rota olgusu oluşturucuları. Her pluginde etkin izin listelerini, komut izin listelerini ve eski projeksiyonları bir araya getirmek yerine bunu tercih edin. Bkz. [Kanal giriş API'si](/tr/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Kullanımdan kaldırılmış uyumluluk cephesi. `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/channel-outbound` | Mesaj yaşam döngüsü sözleşmelerinin yanı sıra yanıt işlem hattı seçenekleri, alındılar, canlı önizleme/akış, yaşam döngüsü yardımcıları, giden kimliği, yük planlama, kalıcı gönderimler ve mesaj gönderme bağlamı yardımcıları. Bkz. [Kanal giden API'si](/tr/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | `plugin-sdk/channel-outbound` için kullanımdan kaldırılmış uyumluluk diğer adı. |
    | `plugin-sdk/channel-message-runtime` | `plugin-sdk/channel-outbound` için kullanımdan kaldırılmış uyumluluk diğer adı. |
    | `plugin-sdk/inbound-envelope` | Paylaşılan gelen rota ve zarf oluşturucu yardımcıları |
    | `plugin-sdk/inbound-reply-dispatch` | Kullanımdan kaldırılmış uyumluluk cephesi. Gelen çalıştırıcılar ve dağıtım koşulları için `plugin-sdk/channel-inbound`, mesaj teslimi yardımcıları için `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/messaging-targets` | Kullanımdan kaldırılmış hedef ayrıştırma diğer adı; `plugin-sdk/channel-targets` kullanın |
    | `plugin-sdk/outbound-media` | Paylaşılan giden medya yükleme ve barındırılan medya durumu yardımcıları |
    | `plugin-sdk/outbound-send-deps` | Kullanımdan kaldırılmış uyumluluk cephesi. `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/outbound-runtime` | Kullanımdan kaldırılmış uyumluluk cephesi. `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/poll-runtime` | Dar kapsamlı anket normalleştirme yardımcıları |
    | `plugin-sdk/thread-bindings-runtime` | İleti dizisi bağlama yaşam döngüsü ve bağdaştırıcı yardımcıları |
    | `plugin-sdk/agent-media-payload` | Aracı medya yükü kökleri ve yükleyicileri |
    | `plugin-sdk/conversation-runtime` | Konuşma/ileti dizisi bağlama, eşleştirme ve yapılandırılmış bağlama yardımcıları için kullanımdan kaldırılmış geniş kapsamlı toplu dışa aktarım; `plugin-sdk/thread-bindings-runtime` ve `plugin-sdk/session-binding-runtime` gibi odaklı bağlama alt yollarını tercih edin |
    | `plugin-sdk/runtime-group-policy` | Çalışma zamanı grup politikası çözümleme yardımcıları |
    | `plugin-sdk/channel-status` | Paylaşılan kanal durumu anlık görüntü/özet yardımcıları |
    | `plugin-sdk/channel-config-primitives` | Dar kapsamlı kanal yapılandırma şeması temel öğeleri |
    | `plugin-sdk/channel-config-writes` | Kanal yapılandırması yazma yetkilendirme yardımcıları |
    | `plugin-sdk/channel-plugin-common` | Paylaşılan kanal plugini başlangıç dışa aktarımları |
    | `plugin-sdk/allowlist-config-edit` | İzin listesi yapılandırmasını düzenleme/okuma yardımcıları |
    | `plugin-sdk/group-access` | Kullanımdan kaldırılmış grup erişimi karar yardımcıları; `plugin-sdk/channel-ingress-runtime` içindeki `resolveChannelMessageIngress` öğesini kullanın |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Kullanımdan kaldırılmış uyumluluk cepheleri. `plugin-sdk/channel-inbound` kullanın. |
    | `plugin-sdk/direct-dm-guard-policy` | Dar kapsamlı, kriptografi öncesi doğrudan DM koruma politikası yardımcıları |
    | `plugin-sdk/discord` | Yayımlanmış `@openclaw/discord@2026.3.13` ve izlenen sahip uyumluluğu için kullanımdan kaldırılmış Discord uyumluluk cephesi; yeni pluginler genel kanal SDK alt yollarını kullanmalıdır |
    | `plugin-sdk/telegram-account` | İzlenen sahip uyumluluğu için kullanımdan kaldırılmış Telegram hesap çözümleme uyumluluk cephesi; yeni pluginler enjekte edilen çalışma zamanı yardımcılarını veya genel kanal SDK alt yollarını kullanmalıdır |
    | `plugin-sdk/zalouser` | Gönderen komutu yetkilendirmesini hâlâ içe aktaran yayımlanmış Lark/Zalo paketleri için kullanımdan kaldırılmış Zalo Personal uyumluluk cephesi; yeni pluginler genel kanal SDK alt yollarını kullanmalıdır |
    | `plugin-sdk/interactive-runtime` | Anlamsal mesaj sunumu, teslimi ve eski etkileşimli yanıt yardımcıları. Bkz. [Mesaj Sunumu](/tr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Olay sınıflandırması, bağlam oluşturma, biçimlendirme, kökler, sıçrama önleme, bahsetme eşleştirme, bahsetme politikası ve gelen günlük kaydı için paylaşılan gelen yardımcıları |
    | `plugin-sdk/channel-inbound-debounce` | Dar kapsamlı gelen sıçrama önleme yardımcıları |
    | `plugin-sdk/channel-mention-gating` | Daha geniş gelen çalışma zamanı yüzeyi olmadan dar kapsamlı bahsetme politikası, bahsetme işaretçisi ve bahsetme metni yardımcıları |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Kullanımdan kaldırılmış uyumluluk cepheleri. `plugin-sdk/channel-inbound` veya `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/channel-pairing-paths` | Kullanımdan kaldırılmış uyumluluk cephesi. `plugin-sdk/channel-pairing` kullanın. |
    | `plugin-sdk/channel-reply-options-runtime` | Kullanımdan kaldırılmış uyumluluk cephesi. `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/channel-streaming` | Kullanımdan kaldırılmış uyumluluk cephesi. `plugin-sdk/channel-outbound` kullanın. |
    | `plugin-sdk/channel-send-result` | Yanıt sonucu türleri |
    | `plugin-sdk/channel-actions` | Kanal mesajı eylemi yardımcılarının yanı sıra plugin uyumluluğu için korunan, kullanımdan kaldırılmış yerel şema yardımcıları |
    | `plugin-sdk/channel-route` | Paylaşılan rota normalleştirme, ayrıştırıcı güdümlü hedef çözümleme, ileti dizisi kimliğini dizgeleştirme, yinelemeleri kaldırılmış/kompakt rota anahtarları, ayrıştırılmış hedef türleri ve rota/hedef karşılaştırma yardımcıları |
    | `plugin-sdk/channel-targets` | Hedef ayrıştırma yardımcıları; rota karşılaştırma çağıranları `plugin-sdk/channel-route` kullanmalıdır |
    | `plugin-sdk/channel-contract` | Kanal sözleşmesi türleri |
    | `plugin-sdk/channel-feedback` | Geri bildirim/tepki bağlantıları |
  </Accordion>

Kullanımdan kaldırılmış kanal yardımcı aileleri yalnızca yayımlanmış Plugin uyumluluğu için kullanılabilir durumda kalır. Kaldırma planı şöyledir: harici Plugin geçiş dönemi boyunca bunları korumak, depo/paketlenmiş Plugin'leri `channel-inbound` ve `channel-outbound` üzerinde tutmak, ardından bir sonraki büyük SDK temizliğinde uyumluluk alt yollarını kaldırmak. Bu plan; eski kanal mesajı/çalışma zamanı, kanal akışı, doğrudan DM erişimi, gelen yardımcı parçaları, yanıtlama seçenekleri ve eşleştirme yolu aileleri için geçerlidir.

  <Accordion title="Sağlayıcı alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Kurulum, katalog keşfi ve çalışma zamanı model hazırlığı için desteklenen LM Studio sağlayıcı cephesi |
    | `plugin-sdk/lmstudio-runtime` | Yerel sunucu varsayılanları, model keşfi, istek başlıkları ve yüklenmiş model yardımcıları için desteklenen LM Studio çalışma zamanı cephesi |
    | `plugin-sdk/provider-setup` | Seçilmiş yerel/kendi sunucunuzda barındırılan sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/self-hosted-provider-setup` | Kullanımdan kaldırılmış OpenAI uyumlu, kendi sunucunuzda barındırılan kurulum yardımcıları; `plugin-sdk/provider-setup` veya plugin'e ait kurulum yardımcılarını kullanın |
    | `plugin-sdk/cli-backend` | CLI arka uç varsayılanları + gözetim zamanlayıcısı sabitleri |
    | `plugin-sdk/provider-auth-runtime` | Sağlayıcı kimlik doğrulama çalışma zamanı yardımcıları: OAuth geri döngü akışı, token değişimi, kimlik doğrulama kalıcılığı ve API anahtarı çözümleme |
    | `plugin-sdk/provider-oauth-runtime` | Genel sağlayıcı OAuth geri çağırma türleri, geri çağırma sayfası oluşturma, PKCE/durum yardımcıları, yetkilendirme girdisi ayrıştırma, token süre sonu yardımcıları ve iptal yardımcıları |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` gibi API anahtarı ilk katılım/profil yazma yardımcıları |
    | `plugin-sdk/provider-auth-result` | Standart OAuth kimlik doğrulama sonucu oluşturucusu |
    | `plugin-sdk/provider-env-vars` | Sağlayıcı kimlik doğrulama ortam değişkeni arama yardımcıları |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, OpenAI Codex kimlik doğrulama içe aktarma yardımcıları, kullanımdan kaldırılmış `resolveOpenClawAgentDir` uyumluluk dışa aktarımı |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan yeniden oynatma ilkesi oluşturucuları, sağlayıcı uç noktası yardımcıları ve paylaşılan model kimliği normalleştirme yardımcıları |
    | `plugin-sdk/provider-catalog-live-runtime` | Korumalı `/models` tarzı keşif için canlı sağlayıcı model kataloğu yardımcıları: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, model kimliği filtreleme, TTL önbelleği ve statik geri dönüş |
    | `plugin-sdk/provider-catalog-runtime` | Sözleşme testleri için sağlayıcı kataloğu genişletme çalışma zamanı kancası ve plugin sağlayıcı kayıt defteri bağlantı noktaları |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Genel sağlayıcı HTTP/uç nokta yetenek yardımcıları, sağlayıcı HTTP hataları ve ses yazıya dökme için çok parçalı form yardımcıları |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` ve `WebFetchProviderPlugin` gibi dar kapsamlı web getirme yapılandırma/seçim sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-fetch` | Web getirme sağlayıcısı kayıt/önbellek yardımcıları |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin etkinleştirme bağlantısına ihtiyaç duymayan sağlayıcılar için dar kapsamlı web araması yapılandırma/kimlik bilgisi yardımcıları |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` gibi dar kapsamlı web araması yapılandırma/kimlik bilgisi sözleşmesi yardımcıları ve kapsamlı kimlik bilgisi ayarlayıcıları/alıcıları |
    | `plugin-sdk/provider-web-search` | Web araması sağlayıcısı kayıt/önbellek/çalışma zamanı yardımcıları |
    | `plugin-sdk/embedding-providers` | `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` ve `listEmbeddingProviders(...)` dahil genel gömme sağlayıcısı türleri ve okuma yardımcıları; manifest sahipliğinin uygulanması için plugin'ler sağlayıcıları `api.registerEmbeddingProvider(...)` aracılığıyla kaydeder |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` ve DeepSeek/Gemini/OpenAI şema temizleme + tanılama |
    | `plugin-sdk/provider-usage` | Sağlayıcı kullanım anlık görüntüsü türleri, paylaşılan kullanım getirme yardımcıları ve `fetchClaudeUsage` gibi sağlayıcı getiricileri |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri, düz metin araç çağrısı uyumluluğu ve paylaşılan Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI sarmalayıcı yardımcıları |
    | `plugin-sdk/provider-stream-shared` | `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` ve Anthropic/DeepSeek/OpenAI uyumlu akış yardımcı programları dahil herkese açık paylaşılan sağlayıcı akış sarmalayıcı yardımcıları |
    | `plugin-sdk/provider-transport-runtime` | Korumalı getirme, araç sonucu metni çıkarma, aktarım iletisi dönüştürmeleri ve yazılabilir aktarım olay akışları gibi yerel sağlayıcı aktarım yardımcıları |
    | `plugin-sdk/provider-onboard` | İlk katılım yapılandırma yaması yardımcıları |
    | `plugin-sdk/global-singleton` | İşlem yerelinde tekil eşleme/önbellek yardımcıları |
    | `plugin-sdk/group-activation` | Dar kapsamlı grup etkinleştirme modu ve komut ayrıştırma yardımcıları |
  </Accordion>

Sağlayıcı kullanım anlık görüntüleri normalde bir veya daha fazla kota `windows` bildirir; her biri
bir etiket, kullanılan yüzde ve isteğe bağlı sıfırlama zamanı içerir. Sıfırlanabilir kota
aralıkları yerine bakiye veya hesap durumu metni sunan sağlayıcılar, yüzdeler uydurmak yerine
boş bir `windows` dizisiyle `summary` döndürmelidir.
OpenClaw bu özet metnini durum çıktısında görüntüler; `error` yalnızca
kullanım uç noktası başarısız olduğunda veya kullanılabilir kullanım verisi döndürmediğinde kullanılmalıdır.

  <Accordion title="Kimlik doğrulama ve güvenlik alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/command-auth` | Kullanımdan kaldırılmış geniş komut yetkilendirme yüzeyi (`resolveControlCommandGate`, dinamik bağımsız değişken menüsü biçimlendirmesi dahil komut kayıt defteri yardımcıları, gönderen yetkilendirme yardımcıları); kanal girişi/çalışma zamanı yetkilendirmesini veya komut durumu yardımcılarını kullanın |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` ve `buildHelpMessage` gibi komut/yardım iletisi oluşturucuları |
    | `plugin-sdk/approval-auth-runtime` | Onaylayan çözümleme ve aynı sohbet eylem yetkilendirmesi yardımcıları |
    | `plugin-sdk/approval-client-runtime` | Yerel yürütme onayı profil/filtre yardımcıları |
    | `plugin-sdk/approval-delivery-runtime` | Yerel onay yeteneği/teslimat bağdaştırıcıları |
    | `plugin-sdk/approval-gateway-runtime` | Paylaşılan onay Gateway çözümleyicisi |
    | `plugin-sdk/approval-reference-runtime` | Aktarım açısından sınırlı onay geri çağırmaları için belirlenimci kalıcı konumlandırıcı yardımcısı |
    | `plugin-sdk/approval-handler-adapter-runtime` | Sık kullanılan kanal giriş noktaları için hafif yerel onay bağdaştırıcısı yükleme yardımcıları |
    | `plugin-sdk/approval-handler-runtime` | Daha geniş onay işleyicisi çalışma zamanı yardımcıları; yeterli olduklarında daha dar kapsamlı bağdaştırıcı/Gateway bağlantı noktalarını tercih edin |
    | `plugin-sdk/approval-native-runtime` | Yerel onay hedefi, hesap bağlama, rota geçidi, yönlendirme geri dönüşü ve yerel yürütme istemini engelleme yardımcıları |
    | `plugin-sdk/approval-reaction-runtime` | Sabit kodlanmış onay tepki bağlamaları, tepki istemi yükleri, tepki hedefi depoları, tepki ipucu metni yardımcıları ve yerel yürütme istemini engelleme için uyumluluk dışa aktarımı |
    | `plugin-sdk/approval-reply-runtime` | Yürütme/plugin onay yanıtı yükü yardımcıları |
    | `plugin-sdk/approval-runtime` | Yürütme/plugin onay yükü yardımcıları, onay yeteneği oluşturucuları, onay kimlik doğrulama/profil yardımcıları, yerel onay yönlendirme/çalışma zamanı yardımcıları ve `formatApprovalDisplayPath` gibi yapılandırılmış onay görüntüleme yardımcıları |
    | `plugin-sdk/reply-dedupe` | Kullanımdan kaldırılmış dar kapsamlı gelen yanıt yinelenenleri kaldırma sıfırlama yardımcıları |
    | `plugin-sdk/command-auth-native` | Yerel komut yetkilendirmesi, dinamik bağımsız değişken menüsü biçimlendirmesi ve yerel oturum hedefi yardımcıları |
    | `plugin-sdk/command-detection` | Paylaşılan komut algılama yardımcıları |
    | `plugin-sdk/command-primitives-runtime` | Sık kullanılan kanal yolları için hafif komut metni koşulları |
    | `plugin-sdk/command-surface` | Komut gövdesi normalleştirme ve komut yüzeyi yardımcıları |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Özel kanal ve Web kullanıcı arayüzü cihaz kodu eşleştirmesi için gecikmeli sağlayıcı kimlik doğrulama giriş akışı yardımcıları |
    | `plugin-sdk/channel-secret-runtime` | Kullanımdan kaldırılmış geniş gizli bilgi sözleşmesi yüzeyi (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, gizli bilgi hedefi türleri); aşağıdaki odaklanmış alt yolları tercih edin |
    | `plugin-sdk/channel-secret-basic-runtime` | TTS dışı kanal/plugin gizli bilgi yüzeyleri için dar kapsamlı gizli bilgi sözleşmesi dışa aktarımları ve hedef kayıt defteri oluşturucuları |
    | `plugin-sdk/channel-secret-tts-runtime` | Dar kapsamlı iç içe kanal TTS gizli bilgi atama yardımcıları |
    | `plugin-sdk/secret-ref-runtime` | Gizli bilgi sözleşmesi/yapılandırma ayrıştırması için dar kapsamlı SecretRef tür tanımlama, çözümleme ve plan hedefi yolu arama |
    | `plugin-sdk/secret-provider-integration` | Harici gizli bilgi sağlayıcısı ön ayarları yayımlayan plugin'ler için yalnızca tür içeren SecretRef sağlayıcı entegrasyonu manifesti ve ön ayar sözleşmeleri |
    | `plugin-sdk/security-runtime` | Güven, DM geçidi, yalnızca oluşturmaya izin veren yazmalar dahil kök ile sınırlı dosya/yol yardımcıları, eşzamanlı/eşzamansız atomik dosya değiştirme, kardeş geçici yazmalar, cihazlar arası taşıma geri dönüşü, özel dosya deposu yardımcıları, sembolik bağlantı üst dizini korumaları, harici içerik, hassas metin karartma, sabit süreli gizli bilgi karşılaştırması ve gizli bilgi toplama yardımcıları için kullanımdan kaldırılmış geniş varil; odaklanmış güvenlik/SSRF/gizli bilgi alt yollarını tercih edin |
    | `plugin-sdk/ssrf-policy` | Ana makine izin listesi ve özel ağ SSRF ilkesi yardımcıları |
    | `plugin-sdk/ssrf-dispatcher` | Geniş altyapı çalışma zamanı yüzeyi olmadan dar kapsamlı sabitlenmiş dağıtıcı yardımcıları |
    | `plugin-sdk/ssrf-runtime` | Sabitlenmiş dağıtıcı, SSRF korumalı getirme, SSRF hatası ve SSRF ilkesi yardımcıları |
    | `plugin-sdk/secret-input` | Gizli bilgi girdisi ayrıştırma yardımcıları |
    | `plugin-sdk/webhook-ingress` | Webhook istek/hedef yardımcıları ve ham web soketi/gövde dönüştürme |
    | `plugin-sdk/webhook-request-guards` | İstek gövdesi boyutu/zaman aşımı yardımcıları ve izlenen onay sonrası işleme için `runDetachedWebhookWork` |
  </Accordion>

  <Accordion title="Çalışma zamanı ve depolama alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/runtime` | Çalışma zamanı/günlükleme/yedekleme yardımcıları, plugin kurulum yolu uyarıları ve süreç yardımcıları |
    | `plugin-sdk/runtime-env` | Dar kapsamlı çalışma zamanı ortamı, günlükleyici, zaman aşımı, yeniden deneme ve geri çekilme yardımcıları |
    | `plugin-sdk/browser-config` | Normalleştirilmiş profil/varsayılanlar, CDP URL ayrıştırma ve tarayıcı denetimi kimlik doğrulama yardımcıları için desteklenen tarayıcı yapılandırma cephesi |
    | `plugin-sdk/agent-harness-task-runtime` | Ana makine tarafından verilen bir görev kapsamını kullanan, çalışma düzeneği destekli ajanlar için genel görev yaşam döngüsü ve tamamlanma teslimi yardımcıları |
    | `plugin-sdk/codex-mcp-projection` | Kullanıcı MCP sunucusu yapılandırmasını Codex iş parçacığı yapılandırmasına yansıtmak için ayrılmış paketlenmiş Codex yardımcısı; üçüncü taraf pluginler için değildir |
    | `plugin-sdk/codex-native-task-runtime` | Yerel görev yansıtma/çalışma zamanı bağlantıları için depo içi paketlenmiş Codex yardımcısı; paket dışa aktarımı değildir |
    | `plugin-sdk/channel-runtime-context` | Genel kanal çalışma zamanı bağlamı kaydı ve arama yardımcıları |
    | `plugin-sdk/matrix` | Eski üçüncü taraf kanal paketleri için kullanımdan kaldırılmış Matrix uyumluluk cephesi; yeni pluginler doğrudan `plugin-sdk/run-command` içe aktarmalıdır |
    | `plugin-sdk/mattermost` | Eski üçüncü taraf kanal paketleri için kullanımdan kaldırılmış Mattermost uyumluluk cephesi; yeni pluginler genel SDK alt yollarını doğrudan içe aktarmalıdır |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Plugin komutu/kancası/HTTP/etkileşim yardımcıları için kullanımdan kaldırılmış geniş kapsamlı dışa aktarım varili; odaklı plugin çalışma zamanı alt yollarını tercih edin |
    | `plugin-sdk/hook-runtime` | Webhook/dahili kanca işlem hattı yardımcıları için kullanımdan kaldırılmış geniş kapsamlı dışa aktarım varili; odaklı kanca/plugin çalışma zamanı alt yollarını tercih edin |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod` ve `createLazyRuntimeSurface` gibi gecikmeli çalışma zamanı içe aktarma/bağlama yardımcıları |
    | `plugin-sdk/process-runtime` | Süreç yürütme yardımcıları |
    | `plugin-sdk/node-host` | Node ana makinesi yürütülebilir dosya çözümleme ve PTY sürdürme yardımcıları |
    | `plugin-sdk/cli-runtime` | CLI biçimlendirme, bekleme, sürüm, bağımsız değişken çağırma ve gecikmeli komut grubu yardımcıları için kullanımdan kaldırılmış geniş kapsamlı dışa aktarım varili; odaklı CLI/çalışma zamanı alt yollarını tercih edin |
    | `plugin-sdk/qa-runner-runtime` | Plugin kalite güvencesi senaryolarını CLI komut yüzeyi üzerinden sunan desteklenen cephe |
    | `plugin-sdk/tts-runtime` | Metinden konuşmaya yapılandırma şemaları ve çalışma zamanı yardımcıları için desteklenen cephe |
    | `plugin-sdk/gateway-method-runtime` | `contracts.gatewayMethodDispatch: ["authenticated-request"]` bildiren plugin HTTP rotaları için ayrılmış Gateway yöntem yönlendirme yardımcısı |
    | `plugin-sdk/gateway-runtime` | Gateway istemcisi, olay döngüsüne hazır istemci başlatma yardımcısı, Gateway CLI RPC, Gateway protokol hataları, duyurulan LAN ana makinesi çözümleme ve kanal durumu yama yardımcıları |
    | `plugin-sdk/config-contracts` | `OpenClawConfig` ve kanal/sağlayıcı yapılandırma türleri gibi plugin yapılandırma şekilleri için odaklı, yalnızca tür içeren yapılandırma yüzeyi |
    | `plugin-sdk/plugin-config-runtime` | `mergeDeep`, `requireRuntimeConfig`, `resolvePluginConfigObject` ve `resolveLivePluginConfigObject` gibi çalışma zamanı plugin yapılandırma yardımcıları |
    | `plugin-sdk/config-mutation` | `mutateConfigFile`, `replaceConfigFile` ve `logConfigUpdated` gibi işlemsel yapılandırma değiştirme yardımcıları |
    | `plugin-sdk/message-tool-delivery-hints` | Paylaşılan mesaj aracı teslim meta verisi ipucu dizeleri |
    | `plugin-sdk/runtime-config-snapshot` | `getRuntimeConfig`, `getRuntimeConfigSnapshot` ve test anlık görüntü ayarlayıcıları gibi geçerli süreç yapılandırması anlık görüntü yardımcıları |
    | `plugin-sdk/text-autolink-runtime` | Geniş kapsamlı metin dışa aktarım varili olmadan dosya başvurusu otomatik bağlantı algılama |
    | `plugin-sdk/reply-runtime` | Paylaşılan gelen/yanıt çalışma zamanı yardımcıları, parçalara ayırma, yönlendirme, Heartbeat, yanıt planlayıcı |
    | `plugin-sdk/reply-dispatch-runtime` | Dar kapsamlı yanıt yönlendirme/sonlandırma ve konuşma etiketi yardımcıları |
    | `plugin-sdk/reply-history` | Paylaşılan kısa zaman aralıklı yanıt geçmişi yardımcıları. Yeni mesaj sırası kodu `createChannelHistoryWindow` kullanmalıdır; düşük düzeyli eşleme yardımcıları yalnızca kullanımdan kaldırılmış uyumluluk dışa aktarımları olarak kalır |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Dar kapsamlı metin/Markdown parçalara ayırma yardımcıları |
    | `plugin-sdk/session-store-runtime` | Oturum iş akışı yardımcıları (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), onarım/yaşam döngüsü yardımcıları (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), geçiş niteliğindeki `sessionFile` değerleri için işaretleyici yardımcıları, oturum kimliğine göre sınırlandırılmış son kullanıcı/asistan transkript metni okumaları, oturum deposu yolu/oturum anahtarı yardımcıları ve güncellenme zamanı okumaları; geniş kapsamlı yapılandırma yazma/bakım içe aktarımları olmadan |
    | `plugin-sdk/session-transcript-runtime` | Transkript kimliği, kapsamlı hedef/okuma/yazma yardımcıları, görünür mesaj girdisi yansıtma, güncelleme yayımlama, yazma kilitleri ve transkript bellek isabet anahtarları |
    | `plugin-sdk/sqlite-runtime` | Veritabanı yaşam döngüsü denetimleri olmadan birinci taraf çalışma zamanı için odaklı SQLite ajan şeması, yol ve işlem yardımcıları |
    | `plugin-sdk/cron-store-runtime` | Cron deposu yolu/yükleme/kaydetme yardımcıları |
    | `plugin-sdk/state-paths` | Durum/OAuth dizini yolu yardımcıları |
    | `plugin-sdk/plugin-state-runtime` | Plugin yan süreç SQLite anahtarlı durum türlerinin yanı sıra pluginlerin sahip olduğu veritabanları için merkezî bağlantı pragma'sı, doğrulanmış WAL bakımı ve atomik STRICT şema geçişi yardımcıları |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey` ve `resolveDefaultAgentBoundAccountId` gibi rota/oturum anahtarı/hesap bağlama yardımcıları |
    | `plugin-sdk/status-helpers` | Paylaşılan kanal/hesap durumu özeti yardımcıları, çalışma zamanı durumu varsayılanları ve sorun meta verisi yardımcıları |
    | `plugin-sdk/target-resolver-runtime` | Paylaşılan hedef çözümleyici yardımcıları |
    | `plugin-sdk/string-normalization-runtime` | Kısa ad/dize normalleştirme yardımcıları |
    | `plugin-sdk/request-url` | Fetch/istek benzeri girdilerden dize URL'leri çıkarma |
    | `plugin-sdk/run-command` | Normalleştirilmiş stdout/stderr sonuçları sunan süreli komut çalıştırıcısı |
    | `plugin-sdk/param-readers` | Ortak araç/CLI parametresi okuyucuları |
    | `plugin-sdk/tool-plugin` | Basit, türü belirlenmiş bir ajan aracı plugini tanımlama ve bildirim oluşturma için statik meta verileri sunma |
    | `plugin-sdk/tool-payload` | Araç sonucu nesnelerinden normalleştirilmiş yükleri çıkarma |
    | `plugin-sdk/tool-send` | Araç bağımsız değişkenlerinden standart gönderim hedefi alanlarını çıkarma |
    | `plugin-sdk/sandbox` | Hızlı başarısız olan yürütme komutu ön denetimi dâhil olmak üzere korumalı alan arka uç türleri ve SSH/OpenShell komut yardımcıları |
    | `plugin-sdk/temp-path` | Paylaşılan geçici indirme yolu yardımcıları ve özel, güvenli geçici çalışma alanları |
    | `plugin-sdk/logging-core` | Alt sistem günlükleyicisi ve redaksiyon yardımcıları |
    | `plugin-sdk/markdown-table-runtime` | Markdown tablo modu ve dönüştürme yardımcıları |
    | `plugin-sdk/model-session-runtime` | `applyModelOverrideToSessionEntry` ve `resolveAgentMaxConcurrent` gibi model/oturum geçersiz kılma yardımcıları |
    | `plugin-sdk/talk-config-runtime` | Konuşma sağlayıcısı yapılandırma çözümleme yardımcıları |
    | `plugin-sdk/json-store` | Küçük JSON durumu okuma/yazma yardımcıları |
    | `plugin-sdk/json-unsafe-integers` | Güvenli olmayan tamsayı değişmezlerini dize olarak koruyan JSON ayrıştırma yardımcıları |
    | `plugin-sdk/file-lock` | Yeniden girişli dosya kilidi yardımcıları |
    | `plugin-sdk/persistent-dedupe` | Disk destekli yinelenenleri ayıklama önbelleği yardımcıları |
    | `plugin-sdk/acp-runtime` | ACP çalışma zamanı/oturum ve yanıt yönlendirme yardımcıları |
    | `plugin-sdk/acp-runtime-backend` | Başlangıçta yüklenen pluginler için hafif ACP arka uç kaydı ve yanıt yönlendirme yardımcıları |
    | `plugin-sdk/acp-binding-resolve-runtime` | Yaşam döngüsü başlatma içe aktarımları olmadan salt okunur ACP bağlama çözümlemesi |
    | `plugin-sdk/agent-config-primitives` | Kullanımdan kaldırılmış ajan çalışma zamanı yapılandırma şeması temel öğeleri; şema temel öğelerini bakımı yapılan, pluginin sahip olduğu bir yüzeyden içe aktarın |
    | `plugin-sdk/boolean-param` | Gevşek Boole parametresi okuyucusu |
    | `plugin-sdk/dangerous-name-runtime` | Tehlikeli ad eşleştirme çözümleme yardımcıları |
    | `plugin-sdk/device-bootstrap` | `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` dâhil cihaz önyükleme ve eşleştirme belirteci yardımcıları |
    | `plugin-sdk/extension-shared` | Paylaşılan pasif kanal, durum ve ortam proxy'si yardımcı temel öğeleri |
    | `plugin-sdk/models-provider-runtime` | `/models` komut/sağlayıcı yanıt yardımcıları |
    | `plugin-sdk/skill-commands-runtime` | Skill komutu listeleme yardımcıları |
    | `plugin-sdk/native-command-registry` | Yerel komut kayıt defteri/oluşturma/seri hâle getirme yardımcıları |
    | `plugin-sdk/agent-harness` | Düşük düzeyli ajan çalışma düzenekleri için deneysel güvenilir plugin yüzeyi: çalışma düzeneği türleri, etkin çalıştırmayı yönlendirme/iptal etme yardımcıları, OpenClaw araç köprüsü yardımcıları, çalışma zamanı planı araç politikası yardımcıları, terminal sonucu sınıflandırması, araç ilerleme biçimlendirme/ayrıntı yardımcıları ve deneme sonucu yardımcı programları |
    | `plugin-sdk/provider-zai-endpoint` | Kullanımdan kaldırılmış, Z.AI sağlayıcısına ait uç nokta algılama cephesi; Z.AI plugininin genel API'sini kullanın |
    | `plugin-sdk/async-lock-runtime` | Küçük çalışma zamanı durumu dosyaları için süreç içi eşzamansız kilit yardımcısı |
    | `plugin-sdk/channel-activity-runtime` | Kanal etkinliği telemetri yardımcısı |
    | `plugin-sdk/concurrency-runtime` | Sınırlandırılmış eşzamansız görev eşzamanlılığı yardımcısı |
    | `plugin-sdk/dedupe-runtime` | Bellek içi ve kalıcı depolama destekli yinelenenleri ayıklama önbelleği yardımcıları |
    | `plugin-sdk/delivery-queue-runtime` | Giden bekleyen teslimatları boşaltma yardımcısı |
    | `plugin-sdk/file-access-runtime` | Güvenli yerel dosya ve medya kaynağı yolu yardımcıları |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat uyandırma, olay ve görünürlük yardımcıları |
    | `plugin-sdk/expect-runtime` | Kanıtlanabilir çalışma zamanı değişmezleri için gerekli değer doğrulama yardımcısı |
    | `plugin-sdk/number-runtime` | Sayısal tür dönüştürme yardımcısı |
    | `plugin-sdk/secure-random-runtime` | Güvenli belirteç/UUID yardımcıları |
    | `plugin-sdk/system-event-runtime` | Sistem olayı kuyruğu yardımcıları |
    | `plugin-sdk/transport-ready-runtime` | Aktarım hazır olma durumu bekleme yardımcısı |
    | `plugin-sdk/exec-approvals-runtime` | Geniş kapsamlı altyapı çalışma zamanı dışa aktarım varili olmadan yürütme onay politikası dosyası yardımcıları |
    | `plugin-sdk/infra-runtime` | Kullanımdan kaldırılmış uyumluluk katmanı; yukarıdaki odaklı çalışma zamanı alt yollarını kullanın |
    | `plugin-sdk/collection-runtime` | Küçük, sınırlandırılmış önbellek yardımcıları |
    | `plugin-sdk/diagnostic-runtime` | Tanılama bayrağı, olay ve izleme bağlamı yardımcıları |
    | `plugin-sdk/error-runtime` | Hata grafiği, biçimlendirme, paylaşılan hata sınıflandırma yardımcıları, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Sarmalanmış fetch, proxy, EnvHttpProxyAgent seçeneği ve sabitlenmiş arama yardımcıları |
    | `plugin-sdk/runtime-fetch` | Proxy/korumalı fetch içe aktarımları olmadan yönlendirici duyarlı çalışma zamanı fetch işlevi |
    | `plugin-sdk/inline-image-data-url-runtime` | Geniş kapsamlı medya çalışma zamanı yüzeyi olmadan satır içi görüntü verisi URL temizleyicisi ve imza algılama yardımcıları |
    | `plugin-sdk/response-limit-runtime` | Geniş kapsamlı medya çalışma zamanı yüzeyi olmadan bayt, boşta kalma süresi ve son tarihle sınırlandırılmış yanıt gövdesi okuyucuları |
    | `plugin-sdk/session-binding-runtime` | Yapılandırılmış bağlama yönlendirmesi veya eşleştirme depoları olmadan geçerli konuşma bağlama durumu |
    | `plugin-sdk/context-visibility-runtime` | Geniş kapsamlı yapılandırma/güvenlik içe aktarımları olmadan bağlam görünürlüğü çözümleme ve ek bağlam filtreleme |
    | `plugin-sdk/string-coerce-runtime` | Markdown/günlükleme içe aktarımları olmadan dar kapsamlı temel kayıt/dize tür dönüştürme ve normalleştirme yardımcıları |
    | `plugin-sdk/html-entity-runtime` | Geniş kapsamlı metin yardımcı programları olmadan tek geçişli, noktalı virgülle sonlandırılmış HTML5 varlık kodu çözme |
    | `plugin-sdk/text-utility-runtime` | Beş varlıklı HTML kaçışını da içeren düşük düzeyli metin ve yol yardımcıları |
    | `plugin-sdk/widget-html` | Kendi kendine yeterli HTML widget'ları için tam belge algılama, boyut doğrulama ve araç girdisi hataları |
    | `plugin-sdk/host-runtime` | Ana makine adı ve SCP ana makinesi normalleştirme yardımcıları |
    | `plugin-sdk/retry-runtime` | Yeniden deneme yapılandırması ve yeniden deneme çalıştırıcısı yardımcıları |
    | `plugin-sdk/agent-runtime` | `resolveAgentDir`, `resolveDefaultAgentDir` ve kullanımdan kaldırılmış `resolveOpenClawAgentDir` uyumluluk dışa aktarımı dâhil olmak üzere ajan dizini/kimliği/çalışma alanı yardımcıları için kullanımdan kaldırılmış geniş kapsamlı dışa aktarım varili; odaklı ajan/çalışma zamanı alt yollarını tercih edin |
    | `plugin-sdk/directory-runtime` | Yapılandırma destekli dizin sorgulama/yinelenenleri ayıklama |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Yetenek ve test alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/media-runtime` | `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` ve kullanımdan kaldırılmış `fetchRemoteMedia` öğelerini içeren, kullanımdan kaldırılmış geniş medya aktarım noktası; `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media` ve yetenek çalışma zamanı alt yollarını tercih edin; ayrıca bir URL'nin OpenClaw medyasına dönüşmesi gerektiğinde arabellek okumalarından önce depo yardımcılarını tercih edin |
    | `plugin-sdk/media-mime` | Dar kapsamlı MIME normalleştirme, dosya uzantısı eşleme, MIME algılama ve medya türü yardımcıları |
    | `plugin-sdk/media-store` | `saveMediaBuffer` ve `saveMediaStream` gibi dar kapsamlı medya deposu yardımcıları |
    | `plugin-sdk/media-generation-runtime` | Paylaşılan medya oluşturma yük devretme yardımcıları, aday seçimi ve eksik model mesajları |
    | `plugin-sdk/media-understanding` | Medya anlama sağlayıcı türlerinin yanı sıra sağlayıcıya yönelik görüntü, ses ve yapılandırılmış veri çıkarma yardımcılarının dışa aktarımları |
    | `plugin-sdk/text-chunking` | Giden metin ve ofsetleri koruyan aralık parçalama, markdown parçalama/işleme yardımcıları, alıntıları dikkate alan HTML etiketi belirteçleştirme, markdown tablosu dönüştürme, yönerge etiketi kaldırma ve güvenli metin yardımcıları |
    | `plugin-sdk/speech` | Konuşma sağlayıcı türlerinin yanı sıra sağlayıcıya yönelik yönerge, kayıt defteri, doğrulama, OpenAI uyumlu TTS oluşturucu ve konuşma yardımcılarının dışa aktarımları |
    | `plugin-sdk/speech-core` | Paylaşılan konuşma sağlayıcı türleri, kayıt defteri, yönerge, normalleştirme ve konuşma yardımcılarının dışa aktarımları |
    | `plugin-sdk/realtime-transcription` | Gerçek zamanlı transkripsiyon sağlayıcı türleri, kayıt defteri yardımcıları ve paylaşılan WebSocket oturumu yardımcısı |
    | `plugin-sdk/realtime-bootstrap-context` | Sınırlı `IDENTITY.md`, `USER.md` ve `SOUL.md` bağlam ekleme işlemleri için gerçek zamanlı profil önyükleme yardımcısı |
    | `plugin-sdk/realtime-voice` | Gerçek zamanlı ses sağlayıcı türleri, kayıt defteri yardımcıları ve çıktı etkinliği takibi dâhil paylaşılan gerçek zamanlı ses davranışı yardımcıları |
    | `plugin-sdk/image-generation` | Görüntü oluşturma sağlayıcı türlerinin yanı sıra görüntü varlığı/veri URL'si yardımcıları ve OpenAI uyumlu görüntü sağlayıcı oluşturucusu |
    | `plugin-sdk/image-generation-core` | Paylaşılan görüntü oluşturma türleri, yük devretme, kimlik doğrulama ve kayıt defteri yardımcıları |
    | `plugin-sdk/music-generation` | Müzik oluşturma sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/music-generation-core` | Kullanımdan kaldırılmış paylaşılan müzik oluşturma türleri, yük devretme yardımcıları, sağlayıcı arama ve model başvurusu ayrıştırma; Plugin tarafından sahip olunan müzik sağlayıcı yüzeylerini tercih edin |
    | `plugin-sdk/video-generation` | Video oluşturma sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/video-generation-core` | Paylaşılan video oluşturma türleri, yük devretme yardımcıları, sağlayıcı arama ve model başvurusu ayrıştırma |
    | `plugin-sdk/transcripts` | Paylaşılan transkript kaynağı sağlayıcı türleri, kayıt defteri yardımcıları, oturum tanımlayıcıları ve sözce meta verileri |
    | `plugin-sdk/webhook-targets` | Webhook hedef kayıt defteri ve rota kurulum yardımcıları |
    | `plugin-sdk/webhook-path` | Kullanımdan kaldırılmış uyumluluk diğer adı; `plugin-sdk/webhook-ingress` kullanın |
    | `plugin-sdk/web-media` | Paylaşılan uzak/yerel medya yükleme yardımcıları |
    | `plugin-sdk/zod` | Kullanımdan kaldırılmış uyumluluk yeniden dışa aktarımı; `zod` öğesini doğrudan `zod` üzerinden içe aktarın |
    | `plugin-sdk/plugin-test-api` | Depo test yardımcısı köprülerini içe aktarmadan doğrudan Plugin kaydı birim testleri için depo içi asgari `createTestPluginApi` yardımcısı |
    | `plugin-sdk/agent-runtime-test-contracts` | Kimlik doğrulama, teslimat, geri dönüş, araç kancası, istem kaplaması, şema ve transkript izdüşümü testleri için depo içi yerel ajan çalışma zamanı bağdaştırıcısı sözleşme fikstürleri |
    | `plugin-sdk/channel-test-helpers` | Genel eylem/kurulum/durum sözleşmeleri, dizin doğrulamaları, hesap başlatma yaşam döngüsü, gönderme yapılandırması aktarma, çalışma zamanı taklitleri, durum sorunları, giden teslimat ve kanca kaydı için depo içi kanal odaklı test yardımcıları |
    | `plugin-sdk/channel-target-testing` | Kanal testleri için depo içi paylaşılan hedef çözümleme hata durumu paketi |
    | `plugin-sdk/channel-contract-testing` | Geniş test aktarım noktası olmadan depo içi dar kapsamlı kanal sözleşmesi test yardımcıları |
    | `plugin-sdk/plugin-test-contracts` | Depo içi Plugin paketi, kayıt, genel kullanıma açık yapıt, doğrudan içe aktarım, çalışma zamanı API'si ve içe aktarma yan etkisi sözleşmesi yardımcıları |
    | `plugin-sdk/plugin-state-test-runtime` | Depo içi Plugin durum deposu, giriş kuyruğu ve durum veritabanı test yardımcıları |
    | `plugin-sdk/provider-test-contracts` | Depo içi sağlayıcı çalışma zamanı, kimlik doğrulama, keşif, ilk kurulum, katalog, sihirbaz, medya yeteneği, yeniden oynatma politikası, gerçek zamanlı STT canlı ses, web arama/getirme ve akış sözleşmesi yardımcıları |
    | `plugin-sdk/provider-http-test-mocks` | `plugin-sdk/provider-http` kullanan sağlayıcı testleri için depo içi isteğe bağlı Vitest HTTP/kimlik doğrulama taklitleri |
    | `plugin-sdk/reply-payload-testing` | Yanıt yükü fikstürlerine meta veri eklemek için depo içi yardımcılar |
    | `plugin-sdk/sqlite-runtime-testing` | Birinci taraf testleri için depo içi SQLite yaşam döngüsü yardımcıları |
    | `plugin-sdk/test-fixtures` | Depo içi genel CLI çalışma zamanı yakalama, korumalı alan bağlamı, beceri yazıcısı, ajan mesajı, sistem olayı, modül yeniden yükleme, paketlenmiş Plugin yolu, terminal metni, parçalama, kimlik doğrulama belirteci ve türü belirlenmiş durum fikstürleri |
    | `plugin-sdk/test-node-mocks` | Vitest `vi.mock("node:*")` fabrikalarında kullanılmak üzere depo içi odaklanmış yerleşik Node modülü taklit yardımcıları |
  </Accordion>

  <Accordion title="Bellek alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/memory-core` | Kullanımdan kaldırılmış uyumluluk diğer adı; `plugin-sdk/memory-host-core` kullanın |
    | `plugin-sdk/memory-core-engine-runtime` | Kullanımdan kaldırılmış bellek dizini/arama çalışma zamanı cephesi; sağlayıcıdan bağımsız bellek ana makinesi alt yollarını tercih edin |
    | `plugin-sdk/memory-core-host-embedding-registry` | Hafif bellek gömme sağlayıcısı kayıt defteri yardımcıları |
    | `plugin-sdk/memory-core-host-engine-foundation` | Bellek ana makinesi temel motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Bellek ana makinesi gömme sözleşmeleri, kayıt defteri erişimi, yerel sağlayıcı ve genel toplu/uzak yardımcılar. Bu yüzeydeki `registerMemoryEmbeddingProvider` kullanımdan kaldırılmıştır; yeni sağlayıcılar için genel gömme sağlayıcısı API'sini kullanın. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Bellek ana makinesi QMD motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-storage` | Bellek ana makinesi depolama motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-multimodal` | Kullanımdan kaldırılmış bellek ana makinesi çok modlu yardımcıları; sağlayıcıdan bağımsız bellek ana makinesi alt yollarını tercih edin |
    | `plugin-sdk/memory-core-host-query` | Kullanımdan kaldırılmış bellek ana makinesi sorgu yardımcıları; sağlayıcıdan bağımsız bellek ana makinesi alt yollarını tercih edin |
    | `plugin-sdk/memory-core-host-secret` | Bellek ana makinesi gizli bilgi yardımcıları |
    | `plugin-sdk/memory-core-host-events` | Kullanımdan kaldırılmış uyumluluk diğer adı; `plugin-sdk/memory-host-events` kullanın |
    | `plugin-sdk/memory-core-host-status` | Bellek ana makinesi durum yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-cli` | Bellek ana makinesi CLI çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-core` | Bellek ana makinesi çekirdek çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-files` | Bellek ana makinesi dosya/çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-host-core` | Bellek ana makinesi çekirdek çalışma zamanı yardımcıları için sağlayıcıdan bağımsız diğer ad |
    | `plugin-sdk/memory-host-events` | Bellek ana makinesi olay günlüğü yardımcıları için sağlayıcıdan bağımsız diğer ad |
    | `plugin-sdk/memory-host-files` | Kullanımdan kaldırılmış uyumluluk diğer adı; `plugin-sdk/memory-core-host-runtime-files` kullanın |
    | `plugin-sdk/memory-host-markdown` | Bellekle ilişkili Plugin'ler için paylaşılan, yönetilen markdown yardımcıları |
    | `plugin-sdk/memory-host-search` | Arama yöneticisi erişimi için Active Memory çalışma zamanı cephesi |
    | `plugin-sdk/memory-host-status` | Kullanımdan kaldırılmış uyumluluk diğer adı; `plugin-sdk/memory-core-host-status` kullanın |
  </Accordion>

  <Accordion title="Ayrılmış paketlenmiş yardımcı alt yolları">
    Ayrılmış paketlenmiş yardımcı SDK alt yolları, paketlenmiş Plugin koduna
    yönelik dar kapsamlı, sahibe özgü yüzeylerdir. Paket derlemelerinin ve diğer
    adlandırmanın belirlenimci kalması için SDK envanterinde izlenirler, ancak
    genel Plugin geliştirme API'leri değildirler. Yeni yeniden kullanılabilir
    ana makine sözleşmeleri `plugin-sdk/gateway-runtime`, `plugin-sdk/ssrf-runtime` ve
    `plugin-sdk/plugin-config-runtime` gibi genel SDK alt yollarını kullanmalıdır.

    | Alt yol | Sahip ve amaç |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Kullanıcı MCP sunucusu yapılandırmasını Codex uygulama sunucusu iş parçacığı yapılandırmasına yansıtmak için paketlenmiş Codex Plugin yardımcısı (ayrılmış paket dışa aktarımı) |
    | `plugin-sdk/codex-native-task-runtime` | Codex uygulama sunucusunun yerel alt ajanlarını OpenClaw görev durumuna yansıtmak için paketlenmiş Codex Plugin yardımcısı (yalnızca depo içi, paket dışa aktarımı değildir) |

  </Accordion>
</AccordionGroup>

## İlgili

- [Plugin SDK'ye genel bakış](/tr/plugins/sdk-overview)
- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)

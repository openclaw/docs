---
read_when:
    - Hangi SDK alt yolundan içe aktarma yapmanız gerektiğini bilmeniz gerekir
    - OpenClawPluginApi üzerindeki tüm kayıt yöntemleri için bir başvuru istiyorsunuz
    - Belirli bir SDK dışa aktarımını arıyorsunuz
sidebarTitle: SDK Overview
summary: İçe aktarma eşlemi, kayıt API başvurusu ve SDK mimarisi
title: Plugin SDK Genel Bakış
x-i18n:
    generated_at: "2026-04-18T08:32:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05d3d0022cca32d29c76f6cea01cdf4f88ac69ef0ef3d7fb8a60fbf9a6b9b331
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Plugin SDK Genel Bakış

Plugin SDK, plugin'ler ile çekirdek arasındaki tiplenmiş sözleşmedir. Bu sayfa,
**neyin içe aktarılacağı** ve **neleri kaydedebileceğiniz** için başvuru
kaynağıdır.

<Tip>
  **Bir nasıl yapılır rehberi mi arıyorsunuz?**
  - İlk plugin'iniz mi? [Başlangıç](/tr/plugins/building-plugins) ile başlayın
  - Kanal plugin'i mi? [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) bölümüne bakın
  - Sağlayıcı plugin'i mi? [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) bölümüne bakın
</Tip>

## İçe aktarma kuralı

Her zaman belirli bir alt yoldan içe aktarın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Her alt yol küçük ve kendi içinde yeterli bir modüldür. Bu, başlangıcı hızlı
tutar ve dairesel bağımlılık sorunlarını önler. Kanala özgü giriş/derleme
yardımcıları için `openclaw/plugin-sdk/channel-core` tercih edin; daha geniş
şemsiye yüzey ve `buildChannelConfigSchema` gibi paylaşılan yardımcılar için
`openclaw/plugin-sdk/core` yolunu kullanın.

`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` gibi
sağlayıcı adlı kolaylık katmanlarını veya kanal markalı yardımcı katmanları
eklemeyin ya da bunlara bağımlı olmayın. Paketlenmiş plugin'ler, kendi
`api.ts` veya `runtime-api.ts` barrel dosyalarında genel SDK alt yollarını
birleştirmelidir ve çekirdek, ya bu plugin-yerel barrel'ları kullanmalı ya da
ihtiyaç gerçekten kanallar arasıysa dar, genel bir SDK sözleşmesi eklemelidir.

Oluşturulan dışa aktarma eşlemi hâlâ `plugin-sdk/feishu`,
`plugin-sdk/feishu-setup`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` ve
`plugin-sdk/matrix*` gibi küçük bir paketlenmiş plugin yardımcı katmanı kümesi
içerir. Bu alt yollar yalnızca paketlenmiş plugin bakımı ve uyumluluk için
vardır; aşağıdaki ortak tabloda kasıtlı olarak yer verilmemiştir ve yeni üçüncü
taraf plugin'ler için önerilen içe aktarma yolu değildir.

## Alt yol başvurusu

En sık kullanılan alt yollar, amaca göre gruplandırılmıştır. 200'den fazla alt
yolun oluşturulmuş tam listesi `scripts/lib/plugin-sdk-entrypoints.json`
dosyasında bulunur.

Ayrılmış paketlenmiş plugin yardımcı alt yolları, oluşturulan listede yine de
görünür. Bir dokümantasyon sayfası açıkça birini herkese açık olarak öne
çıkarmadıkça bunları uygulama ayrıntısı/uyumluluk yüzeyleri olarak değerlendirin.

### Plugin girişi

| Alt yol                     | Temel dışa aktarımlar                                                                                                                  |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

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
    | `plugin-sdk/account-core` | Çok hesaplı yapılandırma/eylem geçidi yardımcıları, varsayılan hesap geri dönüş yardımcıları |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, account-id normalleştirme yardımcıları |
    | `plugin-sdk/account-resolution` | Hesap arama + varsayılan geri dönüş yardımcıları |
    | `plugin-sdk/account-helpers` | Dar hesap listesi/hesap eylemi yardımcıları |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Kanal yapılandırma şeması türleri |
    | `plugin-sdk/telegram-command-config` | Paketlenmiş sözleşme geri dönüşü ile Telegram özel komut normalleştirme/doğrulama yardımcıları |
    | `plugin-sdk/command-gating` | Dar komut yetkilendirme geçidi yardımcıları |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Paylaşılan gelen yönlendirme + zarf oluşturucu yardımcıları |
    | `plugin-sdk/inbound-reply-dispatch` | Paylaşılan gelen kaydetme ve dağıtım yardımcıları |
    | `plugin-sdk/messaging-targets` | Hedef ayrıştırma/eşleme yardımcıları |
    | `plugin-sdk/outbound-media` | Paylaşılan giden medya yükleme yardımcıları |
    | `plugin-sdk/outbound-runtime` | Giden kimlik/gönderim temsilci yardımcıları |
    | `plugin-sdk/poll-runtime` | Dar anket normalleştirme yardımcıları |
    | `plugin-sdk/thread-bindings-runtime` | İleti dizisi bağlama yaşam döngüsü ve bağdaştırıcı yardımcıları |
    | `plugin-sdk/agent-media-payload` | Eski ajan medya yükü oluşturucusu |
    | `plugin-sdk/conversation-runtime` | Konuşma/ileti dizisi bağlama, eşleştirme ve yapılandırılmış bağlama yardımcıları |
    | `plugin-sdk/runtime-config-snapshot` | Çalışma zamanı yapılandırma anlık görüntü yardımcısı |
    | `plugin-sdk/runtime-group-policy` | Çalışma zamanı grup ilkesi çözümleme yardımcıları |
    | `plugin-sdk/channel-status` | Paylaşılan kanal durum anlık görüntüsü/özet yardımcıları |
    | `plugin-sdk/channel-config-primitives` | Dar kanal yapılandırma şeması ilkel öğeleri |
    | `plugin-sdk/channel-config-writes` | Kanal yapılandırması yazma yetkilendirme yardımcıları |
    | `plugin-sdk/channel-plugin-common` | Paylaşılan kanal plugin başlangıç dışa aktarımları |
    | `plugin-sdk/allowlist-config-edit` | İzin listesi yapılandırması düzenleme/okuma yardımcıları |
    | `plugin-sdk/group-access` | Paylaşılan grup erişim kararı yardımcıları |
    | `plugin-sdk/direct-dm` | Paylaşılan doğrudan DM kimlik doğrulama/koruma yardımcıları |
    | `plugin-sdk/interactive-runtime` | Etkileşimli yanıt yükü normalleştirme/indirgeme yardımcıları |
    | `plugin-sdk/channel-inbound` | Gelen debounce, mention eşleme, mention-policy yardımcıları ve zarf yardımcıları için uyumluluk barrel'ı |
    | `plugin-sdk/channel-mention-gating` | Daha geniş gelen çalışma zamanı yüzeyi olmadan dar mention-policy yardımcıları |
    | `plugin-sdk/channel-location` | Kanal konumu bağlamı ve biçimlendirme yardımcıları |
    | `plugin-sdk/channel-logging` | Gelen bırakmalar ve yazıyor/onay hataları için kanal günlükleme yardımcıları |
    | `plugin-sdk/channel-send-result` | Yanıt sonuç türleri |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Hedef ayrıştırma/eşleme yardımcıları |
    | `plugin-sdk/channel-contract` | Kanal sözleşmesi türleri |
    | `plugin-sdk/channel-feedback` | Geri bildirim/reaksiyon bağlantıları |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` gibi dar secret sözleşme yardımcıları ve secret hedef türleri |
  </Accordion>

  <Accordion title="Sağlayıcı alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Düzenlenmiş yerel/kendi kendine barındırılan sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/self-hosted-provider-setup` | Odaklanmış OpenAI uyumlu kendi kendine barındırılan sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/cli-backend` | CLI arka uç varsayılanları + watchdog sabitleri |
    | `plugin-sdk/provider-auth-runtime` | Sağlayıcı plugin'leri için çalışma zamanı API anahtarı çözümleme yardımcıları |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` gibi API anahtarı onboarding/profil yazma yardımcıları |
    | `plugin-sdk/provider-auth-result` | Standart OAuth auth-result oluşturucusu |
    | `plugin-sdk/provider-auth-login` | Sağlayıcı plugin'leri için paylaşılan etkileşimli giriş yardımcıları |
    | `plugin-sdk/provider-env-vars` | Sağlayıcı kimlik doğrulama env-var arama yardımcıları |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan replay-policy oluşturucuları, sağlayıcı uç nokta yardımcıları ve `normalizeNativeXaiModelId` gibi model-id normalleştirme yardımcıları |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Genel sağlayıcı HTTP/uç nokta yetenek yardımcıları |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` ve `WebFetchProviderPlugin` gibi dar web-fetch yapılandırma/seçim sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-fetch` | Web-fetch sağlayıcı kaydı/önbellek yardımcıları |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin etkinleştirme bağlantısına ihtiyaç duymayan sağlayıcılar için dar web-search yapılandırma/kimlik bilgisi yardımcıları |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` ve kapsamlı kimlik bilgisi ayarlayıcıları/getter'ları gibi dar web-search yapılandırma/kimlik bilgisi sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-search` | Web-search sağlayıcı kaydı/önbellek/çalışma zamanı yardımcıları |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini şema temizleme + tanılama ve `resolveXaiModelCompatPatch` / `applyXaiModelCompat` gibi xAI uyumluluk yardımcıları |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` ve benzerleri |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri ve paylaşılan Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot sarmalayıcı yardımcıları |
    | `plugin-sdk/provider-onboard` | Onboarding yapılandırma yama yardımcıları |
    | `plugin-sdk/global-singleton` | Süreç-yerel singleton/map/önbellek yardımcıları |
  </Accordion>

  <Accordion title="Kimlik doğrulama ve güvenlik alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, komut kayıt defteri yardımcıları, gönderen yetkilendirme yardımcıları |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` ve `buildHelpMessage` gibi komut/yardım mesajı oluşturucuları |
    | `plugin-sdk/approval-auth-runtime` | Onaylayıcı çözümleme ve aynı sohbet eylem kimlik doğrulama yardımcıları |
    | `plugin-sdk/approval-client-runtime` | Yerel exec onay profili/filtre yardımcıları |
    | `plugin-sdk/approval-delivery-runtime` | Yerel onay yeteneği/teslim bağdaştırıcıları |
    | `plugin-sdk/approval-gateway-runtime` | Paylaşılan onay Gateway çözümleme yardımcısı |
    | `plugin-sdk/approval-handler-adapter-runtime` | Sıcak kanal giriş noktaları için hafif yerel onay bağdaştırıcısı yükleme yardımcıları |
    | `plugin-sdk/approval-handler-runtime` | Daha geniş onay işleyici çalışma zamanı yardımcıları; yeterli olduklarında daha dar bağdaştırıcı/Gateway katmanlarını tercih edin |
    | `plugin-sdk/approval-native-runtime` | Yerel onay hedefi + hesap bağlama yardımcıları |
    | `plugin-sdk/approval-reply-runtime` | Exec/plugin onay yanıt yükü yardımcıları |
    | `plugin-sdk/command-auth-native` | Yerel komut kimlik doğrulama + yerel oturum hedefi yardımcıları |
    | `plugin-sdk/command-detection` | Paylaşılan komut algılama yardımcıları |
    | `plugin-sdk/command-surface` | Komut gövdesi normalleştirme ve komut yüzeyi yardımcıları |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Kanal/plugin secret yüzeyleri için dar secret sözleşmesi toplama yardımcıları |
    | `plugin-sdk/secret-ref-runtime` | Secret sözleşmesi/yapılandırma ayrıştırması için dar `coerceSecretRef` ve SecretRef tipleme yardımcıları |
    | `plugin-sdk/security-runtime` | Paylaşılan güven, DM geçitleme, harici içerik ve secret toplama yardımcıları |
    | `plugin-sdk/ssrf-policy` | Host izin listesi ve özel ağ SSRF ilkesi yardımcıları |
    | `plugin-sdk/ssrf-dispatcher` | Geniş infra çalışma zamanı yüzeyi olmadan dar sabitlenmiş dağıtıcı yardımcıları |
    | `plugin-sdk/ssrf-runtime` | Sabitlenmiş dağıtıcı, SSRF korumalı fetch ve SSRF ilkesi yardımcıları |
    | `plugin-sdk/secret-input` | Secret girdi ayrıştırma yardımcıları |
    | `plugin-sdk/webhook-ingress` | Webhook istek/hedef yardımcıları |
    | `plugin-sdk/webhook-request-guards` | İstek gövdesi boyutu/zaman aşımı yardımcıları |
  </Accordion>

  <Accordion title="Çalışma zamanı ve depolama alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/runtime` | Geniş çalışma zamanı/günlükleme/yedekleme/plugin kurulum yardımcıları |
    | `plugin-sdk/runtime-env` | Dar çalışma zamanı env, günlükleyici, zaman aşımı, yeniden deneme ve geri çekilme yardımcıları |
    | `plugin-sdk/channel-runtime-context` | Genel kanal çalışma zamanı bağlamı kaydı ve arama yardımcıları |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Paylaşılan plugin komut/hook/http/etkileşimli yardımcıları |
    | `plugin-sdk/hook-runtime` | Paylaşılan Webhook/internal hook işlem hattı yardımcıları |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod` ve `createLazyRuntimeSurface` gibi tembel çalışma zamanı içe aktarma/bağlama yardımcıları |
    | `plugin-sdk/process-runtime` | Süreç exec yardımcıları |
    | `plugin-sdk/cli-runtime` | CLI biçimlendirme, bekleme ve sürüm yardımcıları |
    | `plugin-sdk/gateway-runtime` | Gateway istemcisi ve kanal durum yaması yardımcıları |
    | `plugin-sdk/config-runtime` | Yapılandırma yükleme/yazma yardımcıları |
    | `plugin-sdk/telegram-command-config` | Paketlenmiş Telegram sözleşmesi yüzeyi kullanılamadığında bile Telegram komut adı/açıklaması normalleştirme ve yinelenen/çakışma denetimleri |
    | `plugin-sdk/text-autolink-runtime` | Geniş text-runtime barrel'ı olmadan dosya başvurusu otomatik bağlantı algılama |
    | `plugin-sdk/approval-runtime` | Exec/plugin onay yardımcıları, onay yeteneği oluşturucuları, kimlik doğrulama/profil yardımcıları, yerel yönlendirme/çalışma zamanı yardımcıları |
    | `plugin-sdk/reply-runtime` | Paylaşılan gelen/yanıt çalışma zamanı yardımcıları, parçalama, dağıtım, Heartbeat, yanıt planlayıcı |
    | `plugin-sdk/reply-dispatch-runtime` | Dar yanıt dağıtım/tamamlama yardımcıları |
    | `plugin-sdk/reply-history` | `buildHistoryContext`, `recordPendingHistoryEntry` ve `clearHistoryEntriesIfEnabled` gibi paylaşılan kısa pencere yanıt geçmişi yardımcıları |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Dar metin/markdown parçalama yardımcıları |
    | `plugin-sdk/session-store-runtime` | Oturum deposu yolu + updated-at yardımcıları |
    | `plugin-sdk/state-paths` | Durum/OAuth dizin yolu yardımcıları |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey` ve `resolveDefaultAgentBoundAccountId` gibi rota/oturum anahtarı/hesap bağlama yardımcıları |
    | `plugin-sdk/status-helpers` | Paylaşılan kanal/hesap durum özeti yardımcıları, çalışma zamanı durum varsayılanları ve sorun meta verisi yardımcıları |
    | `plugin-sdk/target-resolver-runtime` | Paylaşılan hedef çözümleyici yardımcıları |
    | `plugin-sdk/string-normalization-runtime` | Slug/dize normalleştirme yardımcıları |
    | `plugin-sdk/request-url` | Fetch/istek benzeri girdilerden dize URL'leri çıkarın |
    | `plugin-sdk/run-command` | Normalize edilmiş stdout/stderr sonuçlarıyla zamanlanmış komut çalıştırıcısı |
    | `plugin-sdk/param-readers` | Ortak araç/CLI parametre okuyucuları |
    | `plugin-sdk/tool-payload` | Araç sonuç nesnelerinden normalize edilmiş yükleri çıkarın |
    | `plugin-sdk/tool-send` | Araç argümanlarından kanonik gönderim hedef alanlarını çıkarın |
    | `plugin-sdk/temp-path` | Paylaşılan geçici indirme yolu yardımcıları |
    | `plugin-sdk/logging-core` | Alt sistem günlükleyici ve redaksiyon yardımcıları |
    | `plugin-sdk/markdown-table-runtime` | Markdown tablo modu yardımcıları |
    | `plugin-sdk/json-store` | Küçük JSON durum okuma/yazma yardımcıları |
    | `plugin-sdk/file-lock` | Yeniden girişli dosya kilidi yardımcıları |
    | `plugin-sdk/persistent-dedupe` | Disk destekli yinelenen kaldırma önbelleği yardımcıları |
    | `plugin-sdk/acp-runtime` | ACP çalışma zamanı/oturum ve yanıt dağıtım yardımcıları |
    | `plugin-sdk/acp-binding-resolve-runtime` | Yaşam döngüsü başlatma içe aktarmaları olmadan salt okunur ACP bağlama çözümlemesi |
    | `plugin-sdk/agent-config-primitives` | Dar ajan çalışma zamanı yapılandırma şeması ilkel öğeleri |
    | `plugin-sdk/boolean-param` | Esnek boolean parametre okuyucusu |
    | `plugin-sdk/dangerous-name-runtime` | Tehlikeli ad eşleme çözümleme yardımcıları |
    | `plugin-sdk/device-bootstrap` | Cihaz önyükleme ve eşleştirme token yardımcıları |
    | `plugin-sdk/extension-shared` | Paylaşılan pasif kanal, durum ve ambient proxy yardımcı ilkel öğeleri |
    | `plugin-sdk/models-provider-runtime` | `/models` komutu/sağlayıcı yanıt yardımcıları |
    | `plugin-sdk/skill-commands-runtime` | Skills komut listeleme yardımcıları |
    | `plugin-sdk/native-command-registry` | Yerel komut kayıt defteri/oluşturma/serileştirme yardımcıları |
    | `plugin-sdk/agent-harness` | Düşük seviyeli ajan harness'leri için deneysel güvenilir plugin yüzeyi: harness türleri, etkin çalıştırma yönlendirme/durdurma yardımcıları, OpenClaw araç köprüsü yardımcıları ve deneme sonucu yardımcıları |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI uç nokta algılama yardımcıları |
    | `plugin-sdk/infra-runtime` | Sistem olayı/Heartbeat yardımcıları |
    | `plugin-sdk/collection-runtime` | Küçük sınırlı önbellek yardımcıları |
    | `plugin-sdk/diagnostic-runtime` | Tanılama bayrağı ve olay yardımcıları |
    | `plugin-sdk/error-runtime` | Hata grafiği, biçimlendirme, paylaşılan hata sınıflandırma yardımcıları, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Sarmalanmış fetch, proxy ve sabitlenmiş arama yardımcıları |
    | `plugin-sdk/runtime-fetch` | Proxy/korumalı fetch içe aktarmaları olmadan dağıtıcı farkındalıklı çalışma zamanı fetch'i |
    | `plugin-sdk/response-limit-runtime` | Geniş medya çalışma zamanı yüzeyi olmadan sınırlı yanıt gövdesi okuyucusu |
    | `plugin-sdk/session-binding-runtime` | Yapılandırılmış bağlama yönlendirmesi veya eşleştirme depoları olmadan geçerli konuşma bağlama durumu |
    | `plugin-sdk/session-store-runtime` | Geniş yapılandırma yazma/bakım içe aktarmaları olmadan oturum deposu okuma yardımcıları |
    | `plugin-sdk/context-visibility-runtime` | Geniş yapılandırma/güvenlik içe aktarmaları olmadan bağlam görünürlüğü çözümleme ve ek bağlam filtreleme |
    | `plugin-sdk/string-coerce-runtime` | Markdown/günlükleme içe aktarmaları olmadan dar ilkel kayıt/dize zorlama ve normalleştirme yardımcıları |
    | `plugin-sdk/host-runtime` | Hostname ve SCP host normalleştirme yardımcıları |
    | `plugin-sdk/retry-runtime` | Yeniden deneme yapılandırması ve yeniden deneme çalıştırıcısı yardımcıları |
    | `plugin-sdk/agent-runtime` | Ajan dizini/kimliği/çalışma alanı yardımcıları |
    | `plugin-sdk/directory-runtime` | Yapılandırma destekli dizin sorgulama/yinelenen kaldırma |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Yetenek ve test alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Medya yükü oluşturucularına ek olarak paylaşılan medya fetch/dönüştürme/depolama yardımcıları |
    | `plugin-sdk/media-generation-runtime` | Paylaşılan medya oluşturma failover yardımcıları, aday seçimi ve eksik model mesajlaşması |
    | `plugin-sdk/media-understanding` | Medya anlama sağlayıcı türleri ve sağlayıcıya yönelik görsel/ses yardımcı dışa aktarımları |
    | `plugin-sdk/text-runtime` | Asistan tarafından görülebilen metin ayıklama, markdown render/parçalama/tablo yardımcıları, redaksiyon yardımcıları, directive-tag yardımcıları ve güvenli metin yardımcıları gibi paylaşılan metin/markdown/günlükleme yardımcıları |
    | `plugin-sdk/text-chunking` | Giden metin parçalayıcı yardımcısı |
    | `plugin-sdk/speech` | Konuşma sağlayıcı türleri ile sağlayıcıya yönelik directive, kayıt defteri ve doğrulama yardımcıları |
    | `plugin-sdk/speech-core` | Paylaşılan konuşma sağlayıcı türleri, kayıt defteri, directive ve normalleştirme yardımcıları |
    | `plugin-sdk/realtime-transcription` | Gerçek zamanlı transkripsiyon sağlayıcı türleri ve kayıt defteri yardımcıları |
    | `plugin-sdk/realtime-voice` | Gerçek zamanlı ses sağlayıcı türleri ve kayıt defteri yardımcıları |
    | `plugin-sdk/image-generation` | Görsel oluşturma sağlayıcı türleri |
    | `plugin-sdk/image-generation-core` | Paylaşılan görsel oluşturma türleri, failover, kimlik doğrulama ve kayıt defteri yardımcıları |
    | `plugin-sdk/music-generation` | Müzik oluşturma sağlayıcısı/istek/sonuç türleri |
    | `plugin-sdk/music-generation-core` | Paylaşılan müzik oluşturma türleri, failover yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
    | `plugin-sdk/video-generation` | Video oluşturma sağlayıcısı/istek/sonuç türleri |
    | `plugin-sdk/video-generation-core` | Paylaşılan video oluşturma türleri, failover yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
    | `plugin-sdk/webhook-targets` | Webhook hedef kayıt defteri ve rota kurulum yardımcıları |
    | `plugin-sdk/webhook-path` | Webhook yol normalleştirme yardımcıları |
    | `plugin-sdk/web-media` | Paylaşılan uzak/yerel medya yükleme yardımcıları |
    | `plugin-sdk/zod` | Plugin SDK kullanıcıları için yeniden dışa aktarılan `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Bellek alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/memory-core` | Yönetici/yapılandırma/dosya/CLI yardımcıları için paketlenmiş memory-core yardımcı yüzeyi |
    | `plugin-sdk/memory-core-engine-runtime` | Bellek dizinleme/arama çalışma zamanı cephesi |
    | `plugin-sdk/memory-core-host-engine-foundation` | Bellek host temel engine dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Bellek host embedding sözleşmeleri, kayıt defteri erişimi, yerel sağlayıcı ve genel toplu/uzak yardımcılar |
    | `plugin-sdk/memory-core-host-engine-qmd` | Bellek host QMD engine dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-storage` | Bellek host depolama engine dışa aktarımları |
    | `plugin-sdk/memory-core-host-multimodal` | Bellek host çok modlu yardımcıları |
    | `plugin-sdk/memory-core-host-query` | Bellek host sorgu yardımcıları |
    | `plugin-sdk/memory-core-host-secret` | Bellek host secret yardımcıları |
    | `plugin-sdk/memory-core-host-events` | Bellek host olay günlüğü yardımcıları |
    | `plugin-sdk/memory-core-host-status` | Bellek host durum yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-cli` | Bellek host CLI çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-core` | Bellek host çekirdek çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-files` | Bellek host dosya/çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-host-core` | Bellek host çekirdek çalışma zamanı yardımcıları için üreticiden bağımsız takma ad |
    | `plugin-sdk/memory-host-events` | Bellek host olay günlüğü yardımcıları için üreticiden bağımsız takma ad |
    | `plugin-sdk/memory-host-files` | Bellek host dosya/çalışma zamanı yardımcıları için üreticiden bağımsız takma ad |
    | `plugin-sdk/memory-host-markdown` | Belleğe bitişik plugin'ler için paylaşılan yönetilen markdown yardımcıları |
    | `plugin-sdk/memory-host-search` | Arama yöneticisi erişimi için Active Memory çalışma zamanı cephesi |
    | `plugin-sdk/memory-host-status` | Bellek host durum yardımcıları için üreticiden bağımsız takma ad |
    | `plugin-sdk/memory-lancedb` | Paketlenmiş memory-lancedb yardımcı yüzeyi |
  </Accordion>

  <Accordion title="Ayrılmış bundled-helper alt yolları">
    | Aile | Geçerli alt yollar | Amaçlanan kullanım |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Paketlenmiş browser plugin destek yardımcıları (`browser-support` uyumluluk barrel'ı olarak kalır) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Paketlenmiş Matrix yardımcı/çalışma zamanı yüzeyi |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Paketlenmiş LINE yardımcı/çalışma zamanı yüzeyi |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Paketlenmiş IRC yardımcı yüzeyi |
    | Kanala özgü yardımcılar | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Paketlenmiş kanal uyumluluk/yardımcı katmanları |
    | Kimlik doğrulama/plugin'e özgü yardımcılar | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Paketlenmiş özellik/plugin yardımcı katmanları; `plugin-sdk/github-copilot-token` şu anda `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` ve `resolveCopilotApiToken` dışa aktarımlarını içerir |
  </Accordion>
</AccordionGroup>

## Kayıt API'si

`register(api)` geri çağrısı, şu yöntemlere sahip bir `OpenClawPluginApi`
nesnesi alır:

### Yetenek kaydı

| Yöntem                                           | Kaydettiği şey                        |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Metin çıkarımı (LLM)                  |
| `api.registerAgentHarness(...)`                  | Deneysel düşük seviyeli ajan yürütücüsü |
| `api.registerCliBackend(...)`                    | Yerel CLI çıkarım arka ucu            |
| `api.registerChannel(...)`                       | Mesajlaşma kanalı                     |
| `api.registerSpeechProvider(...)`                | Metinden konuşmaya / STT sentezi      |
| `api.registerRealtimeTranscriptionProvider(...)` | Akışlı gerçek zamanlı transkripsiyon  |
| `api.registerRealtimeVoiceProvider(...)`         | Çift yönlü gerçek zamanlı ses oturumları |
| `api.registerMediaUnderstandingProvider(...)`    | Görsel/ses/video analizi              |
| `api.registerImageGenerationProvider(...)`       | Görsel oluşturma                      |
| `api.registerMusicGenerationProvider(...)`       | Müzik oluşturma                       |
| `api.registerVideoGenerationProvider(...)`       | Video oluşturma                       |
| `api.registerWebFetchProvider(...)`              | Web fetch / scrape sağlayıcısı        |
| `api.registerWebSearchProvider(...)`             | Web araması                           |

### Araçlar ve komutlar

| Yöntem                          | Kaydettiği şey                               |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Ajan aracı (zorunlu veya `{ optional: true }`) |
| `api.registerCommand(def)`      | Özel komut (LLM'yi atlar)                    |

### Altyapı

| Yöntem                                         | Kaydettiği şey                         |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Olay hook'u                            |
| `api.registerHttpRoute(params)`                | Gateway HTTP uç noktası                |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC yöntemi                    |
| `api.registerCli(registrar, opts?)`            | CLI alt komutu                         |
| `api.registerService(service)`                 | Arka plan servisi                      |
| `api.registerInteractiveHandler(registration)` | Etkileşimli işleyici                   |
| `api.registerMemoryPromptSupplement(builder)`  | Eklemeli bellek-bitişik prompt bölümü  |
| `api.registerMemoryCorpusSupplement(adapter)`  | Eklemeli bellek arama/okuma corpus'u   |

Ayrılmış çekirdek yönetici ad alanları (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`), bir plugin daha dar bir Gateway yöntem kapsamı atamaya çalışsa bile
her zaman `operator.admin` olarak kalır. Plugin'e ait yöntemler için plugin'e
özgü önekleri tercih edin.

### CLI kayıt meta verisi

`api.registerCli(registrar, opts?)`, iki tür üst düzey meta veri kabul eder:

- `commands`: registrar'a ait açık komut kökleri
- `descriptors`: kök CLI yardımı, yönlendirme ve tembel plugin CLI kaydı için ayrıştırma zamanı komut tanımlayıcıları

Bir plugin komutunun normal kök CLI yolunda tembel yüklemeli kalmasını
istiyorsanız, o registrar tarafından dışa açılan her üst düzey komut kökünü
kapsayan `descriptors` sağlayın.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Matrix hesaplarını, doğrulamayı, cihazları ve profil durumunu yönetin",
        hasSubcommands: true,
      },
    ],
  },
);
```

`commands` alanını tek başına yalnızca tembel kök CLI kaydına ihtiyaç
duymadığınızda kullanın. Bu hevesli uyumluluk yolu desteklenmeye devam eder,
ancak ayrıştırma zamanında tembel yükleme için tanımlayıcı destekli yer tutucular
kurmaz.

### CLI arka uç kaydı

`api.registerCliBackend(...)`, bir plugin'in `codex-cli` gibi yerel bir
AI CLI arka ucunun varsayılan yapılandırmasına sahip olmasına izin verir.

- Arka uç `id` değeri, `codex-cli/gpt-5` gibi model başvurularında sağlayıcı öneki olur.
- Arka uç `config` değeri, `agents.defaults.cliBackends.<id>` ile aynı biçimi kullanır.
- Kullanıcı yapılandırması yine önceliklidir. OpenClaw, CLI'yi çalıştırmadan önce `agents.defaults.cliBackends.<id>` değerini plugin varsayılanı üzerine birleştirir.
- Bir arka uç, birleştirme sonrasında uyumluluk yeniden yazımları gerektiriyorsa `normalizeConfig` kullanın
  (örneğin eski bayrak biçimlerini normalleştirmek için).

### Özel yuvalar

| Yöntem                                     | Kaydettiği şey                                                                                                                                             |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Bağlam engine'i (aynı anda yalnızca biri etkin). `assemble()` geri çağrısı, engine'in prompt eklemelerini uyarlayabilmesi için `availableTools` ve `citationsMode` alır. |
| `api.registerMemoryCapability(capability)` | Birleşik bellek yeteneği                                                                                                                                   |
| `api.registerMemoryPromptSection(builder)` | Bellek prompt bölümü oluşturucusu                                                                                                                          |
| `api.registerMemoryFlushPlan(resolver)`    | Bellek flush planı çözümleyicisi                                                                                                                           |
| `api.registerMemoryRuntime(runtime)`       | Bellek çalışma zamanı bağdaştırıcısı                                                                                                                       |

### Bellek embedding bağdaştırıcıları

| Yöntem                                         | Kaydettiği şey                                  |
| ---------------------------------------------- | ----------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Etkin plugin için bellek embedding bağdaştırıcısı |

- `registerMemoryCapability`, tercih edilen özel bellek plugin API'sidir.
- `registerMemoryCapability`, eşlik eden plugin'lerin dışa aktarılan bellek yapıtlarını
  belirli bir bellek plugin'inin özel yerleşimine girmek yerine
  `openclaw/plugin-sdk/memory-host-core` üzerinden tüketebilmesi için
  `publicArtifacts.listArtifacts(...)` de sunabilir.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` ve
  `registerMemoryRuntime`, eski uyumlu özel bellek plugin API'leridir.
- `registerMemoryEmbeddingProvider`, etkin bellek plugin'inin bir
  veya daha fazla embedding bağdaştırıcı kimliği kaydetmesine izin verir
  (örneğin `openai`, `gemini` veya plugin tarafından tanımlanmış özel bir kimlik).
- `agents.defaults.memorySearch.provider` ve
  `agents.defaults.memorySearch.fallback` gibi kullanıcı yapılandırmaları,
  bu kayıtlı bağdaştırıcı kimliklerine göre çözülür.

### Olaylar ve yaşam döngüsü

| Yöntem                                       | Yaptığı şey                  |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Tiplenmiş yaşam döngüsü hook'u |
| `api.onConversationBindingResolved(handler)` | Konuşma bağlama geri çağrısı   |

### Hook karar semantiği

- `before_tool_call`: `{ block: true }` döndürmek sonlandırıcıdır. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` döndürmek karar verilmemiş olarak değerlendirilir (`block` alanını atlamakla aynıdır), geçersiz kılma olarak değil.
- `before_install`: `{ block: true }` döndürmek sonlandırıcıdır. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` döndürmek karar verilmemiş olarak değerlendirilir (`block` alanını atlamakla aynıdır), geçersiz kılma olarak değil.
- `reply_dispatch`: `{ handled: true, ... }` döndürmek sonlandırıcıdır. Herhangi bir işleyici dağıtımı üstlendiğini belirttiğinde, daha düşük öncelikli işleyiciler ve varsayılan model dağıtım yolu atlanır.
- `message_sending`: `{ cancel: true }` döndürmek sonlandırıcıdır. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` döndürmek karar verilmemiş olarak değerlendirilir (`cancel` alanını atlamakla aynıdır), geçersiz kılma olarak değil.

### API nesnesi alanları

| Alan                     | Tür                       | Açıklama                                                                                      |
| ------------------------ | ------------------------- | --------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin kimliği                                                                                |
| `api.name`               | `string`                  | Görünen ad                                                                                    |
| `api.version`            | `string?`                 | Plugin sürümü (isteğe bağlı)                                                                  |
| `api.description`        | `string?`                 | Plugin açıklaması (isteğe bağlı)                                                              |
| `api.source`             | `string`                  | Plugin kaynak yolu                                                                            |
| `api.rootDir`            | `string?`                 | Plugin kök dizini (isteğe bağlı)                                                              |
| `api.config`             | `OpenClawConfig`          | Geçerli yapılandırma anlık görüntüsü (varsa etkin bellek içi çalışma zamanı anlık görüntüsü) |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` içindeki plugin'e özgü yapılandırma                             |
| `api.runtime`            | `PluginRuntime`           | [Çalışma zamanı yardımcıları](/tr/plugins/sdk-runtime)                                           |
| `api.logger`             | `PluginLogger`            | Kapsamlı günlükleyici (`debug`, `info`, `warn`, `error`)                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | Geçerli yükleme modu; `"setup-runtime"` hafif tam giriş öncesi başlatma/kurulum penceresidir |
| `api.resolvePath(input)` | `(string) => string`      | Yolu plugin köküne göre çözümle                                                               |

## İç modül kuralı

Plugin'iniz içinde, içe aktarmalar için yerel barrel dosyalarını kullanın:

```
my-plugin/
  api.ts            # Harici tüketiciler için herkese açık dışa aktarımlar
  runtime-api.ts    # Yalnızca iç kullanım için çalışma zamanı dışa aktarımları
  index.ts          # Plugin giriş noktası
  setup-entry.ts    # Yalnızca kurulum için hafif giriş (isteğe bağlı)
```

<Warning>
  Üretim kodunda kendi plugin'inizi asla `openclaw/plugin-sdk/<your-plugin>`
  üzerinden içe aktarmayın. İç içe aktarmaları `./api.ts` veya
  `./runtime-api.ts` üzerinden yönlendirin. SDK yolu yalnızca harici sözleşmedir.
</Warning>

Cephe yüklemeli paketlenmiş plugin herkese açık yüzeyleri (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` ve benzeri herkese açık giriş dosyaları), OpenClaw
zaten çalışıyorsa artık etkin çalışma zamanı yapılandırma anlık görüntüsünü
tercih eder. Henüz çalışma zamanı anlık görüntüsü yoksa, disk üzerindeki
çözümlenmiş yapılandırma dosyasına geri dönerler.

Sağlayıcı plugin'leri, bir yardımcı kasıtlı olarak sağlayıcıya özgüyse ve henüz
genel bir SDK alt yoluna ait değilse dar bir plugin-yerel sözleşme barrel'ı da
sunabilir. Güncel paketlenmiş örnek: Anthropic sağlayıcısı, Anthropic beta-header
ve `service_tier` mantığını genel bir `plugin-sdk/*` sözleşmesine taşımak yerine
Claude akış yardımcılarını kendi herkese açık `api.ts` / `contract-api.ts`
katmanında tutar.

Diğer güncel paketlenmiş örnekler:

- `@openclaw/openai-provider`: `api.ts`, sağlayıcı oluşturucuları,
  varsayılan model yardımcılarını ve gerçek zamanlı sağlayıcı oluşturucularını dışa aktarır
- `@openclaw/openrouter-provider`: `api.ts`, sağlayıcı oluşturucusunun yanı sıra
  onboarding/yapılandırma yardımcılarını dışa aktarır

<Warning>
  Extension üretim kodu ayrıca `openclaw/plugin-sdk/<other-plugin>`
  içe aktarmalarından da kaçınmalıdır. Bir yardımcı gerçekten paylaşılıyorsa,
  iki plugin'i birbirine bağlamak yerine bunu `openclaw/plugin-sdk/speech`,
  `.../provider-model-shared` veya başka bir yetenek odaklı yüzey gibi nötr bir
  SDK alt yoluna taşıyın.
</Warning>

## İlgili

- [Giriş Noktaları](/tr/plugins/sdk-entrypoints) — `definePluginEntry` ve `defineChannelPluginEntry` seçenekleri
- [Çalışma Zamanı Yardımcıları](/tr/plugins/sdk-runtime) — tam `api.runtime` ad alanı başvurusu
- [Kurulum ve Yapılandırma](/tr/plugins/sdk-setup) — paketleme, manifest'ler, yapılandırma şemaları
- [Test](/tr/plugins/sdk-testing) — test yardımcı programları ve lint kuralları
- [SDK Geçişi](/tr/plugins/sdk-migration) — kullanımdan kaldırılmış yüzeylerden geçiş
- [Plugin İç Yapısı](/tr/plugins/architecture) — derin mimari ve yetenek modeli

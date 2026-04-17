---
read_when:
    - Hangi SDK alt yolundan içe aktarma yapmanız gerektiğini bilmeniz gerekir
    - OpenClawPluginApi üzerindeki tüm kayıt yöntemleri için bir başvuru istiyorsunuz
    - Belirli bir SDK dışa aktarımını arıyorsunuz
sidebarTitle: SDK Overview
summary: Import map, kayıt API başvurusu ve SDK mimarisi
title: Plugin SDK Genel Bakış
x-i18n:
    generated_at: "2026-04-17T08:52:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: b177fdb6830f415d998a24812bc2c7db8124d3ba77b0174c9a67ac7d747f7e5a
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Plugin SDK Genel Bakış

Plugin SDK, pluginler ile çekirdek arasındaki türlendirilmiş sözleşmedir. Bu sayfa,
**neyin içe aktarılacağı** ve **neleri kaydedebileceğiniz** için başvuru kaynağıdır.

<Tip>
  **Nasıl yapılır kılavuzu mu arıyorsunuz?**
  - İlk plugin mi? [Başlangıç](/tr/plugins/building-plugins) ile başlayın
  - Kanal plugin’i mi? [Kanal Pluginleri](/tr/plugins/sdk-channel-plugins) sayfasına bakın
  - Sağlayıcı plugin’i mi? [Sağlayıcı Pluginleri](/tr/plugins/sdk-provider-plugins) sayfasına bakın
</Tip>

## İçe aktarma kuralı

Her zaman belirli bir alt yoldan içe aktarın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Her alt yol küçük, kendi içinde yeterli bir modüldür. Bu, başlangıcın hızlı
kalmasını sağlar ve dairesel bağımlılık sorunlarını önler. Kanala özgü
giriş/oluşturma yardımcıları için `openclaw/plugin-sdk/channel-core` yolunu
tercih edin; daha geniş şemsiye yüzey ve `buildChannelConfigSchema` gibi paylaşılan
yardımcılar için `openclaw/plugin-sdk/core` yolunu kullanın.

`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` gibi
sağlayıcı adlı kolaylık yüzeylerini veya kanal markalı yardımcı yüzeylerini
eklemeyin ya da bunlara bağımlı olmayın. Paketlenmiş pluginler, genel
SDK alt yollarını kendi `api.ts` veya `runtime-api.ts` barrel dosyaları içinde
birleştirmelidir; çekirdek ise ya bu plugin-yerel barrel dosyalarını kullanmalı
ya da ihtiyaç gerçekten kanallar arasıysa dar bir genel SDK
sözleşmesi eklemelidir.

Oluşturulmuş dışa aktarma eşlemesi hâlâ `plugin-sdk/feishu`,
`plugin-sdk/feishu-setup`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` ve
`plugin-sdk/matrix*` gibi küçük bir grup paketlenmiş-plugin yardımcı
yüzeyi içerir. Bu alt yollar yalnızca paketlenmiş-plugin bakımı ve uyumluluk
için vardır; aşağıdaki ortak tabloda bilerek atlanmıştır ve yeni üçüncü taraf
pluginler için önerilen içe aktarma yolu değildir.

## Alt yol başvurusu

Amaçlarına göre gruplanmış, en yaygın kullanılan alt yollar. 200’den fazla alt
yolun tam oluşturulmuş listesi `scripts/lib/plugin-sdk-entrypoints.json`
dosyasında bulunur.

Ayrılmış paketlenmiş-plugin yardımcı alt yolları bu oluşturulmuş listede hâlâ
görünür. Bir dokümantasyon sayfası birini açıkça genel olarak öne çıkarmadıkça,
bunları uygulama ayrıntısı/uyumluluk yüzeyleri olarak değerlendirin.

### Plugin girişi

| Alt yol                     | Temel dışa aktarımlar                                                                                                                 |
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
    | `plugin-sdk/account-core` | Çoklu hesap yapılandırma/eylem kapısı yardımcıları, varsayılan hesap geri dönüş yardımcıları |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, hesap kimliği normalleştirme yardımcıları |
    | `plugin-sdk/account-resolution` | Hesap arama + varsayılan geri dönüş yardımcıları |
    | `plugin-sdk/account-helpers` | Dar hesap listesi/hesap eylemi yardımcıları |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Kanal yapılandırma şeması türleri |
    | `plugin-sdk/telegram-command-config` | Paketlenmiş sözleşme geri dönüşüyle Telegram özel komut normalleştirme/doğrulama yardımcıları |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Paylaşılan gelen rota + zarf oluşturucu yardımcıları |
    | `plugin-sdk/inbound-reply-dispatch` | Paylaşılan gelen kaydetme ve gönderme yardımcıları |
    | `plugin-sdk/messaging-targets` | Hedef ayrıştırma/eşleştirme yardımcıları |
    | `plugin-sdk/outbound-media` | Paylaşılan giden medya yükleme yardımcıları |
    | `plugin-sdk/outbound-runtime` | Giden kimlik/gönderme temsilci yardımcıları |
    | `plugin-sdk/thread-bindings-runtime` | İleti dizisi bağlama yaşam döngüsü ve adaptör yardımcıları |
    | `plugin-sdk/agent-media-payload` | Eski ajan medya yükü oluşturucusu |
    | `plugin-sdk/conversation-runtime` | Konuşma/ileti dizisi bağlama, eşleme ve yapılandırılmış bağlama yardımcıları |
    | `plugin-sdk/runtime-config-snapshot` | Çalışma zamanı yapılandırma anlık görüntü yardımcısı |
    | `plugin-sdk/runtime-group-policy` | Çalışma zamanı grup ilkesi çözümleme yardımcıları |
    | `plugin-sdk/channel-status` | Paylaşılan kanal durumu anlık görüntü/özet yardımcıları |
    | `plugin-sdk/channel-config-primitives` | Dar kanal yapılandırma şeması ilkel türleri |
    | `plugin-sdk/channel-config-writes` | Kanal yapılandırma yazma yetkilendirme yardımcıları |
    | `plugin-sdk/channel-plugin-common` | Paylaşılan kanal plugin prelude dışa aktarımları |
    | `plugin-sdk/allowlist-config-edit` | İzin listesi yapılandırması düzenleme/okuma yardımcıları |
    | `plugin-sdk/group-access` | Paylaşılan grup erişim kararı yardımcıları |
    | `plugin-sdk/direct-dm` | Paylaşılan doğrudan DM kimlik doğrulama/koruma yardımcıları |
    | `plugin-sdk/interactive-runtime` | Etkileşimli yanıt yükü normalleştirme/indirgeme yardımcıları |
    | `plugin-sdk/channel-inbound` | Gelen debounce, anılma eşleştirme, anılma ilkesi yardımcıları ve zarf yardımcıları |
    | `plugin-sdk/channel-send-result` | Yanıt sonuç türleri |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Hedef ayrıştırma/eşleştirme yardımcıları |
    | `plugin-sdk/channel-contract` | Kanal sözleşmesi türleri |
    | `plugin-sdk/channel-feedback` | Geri bildirim/reaksiyon bağlantıları |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` ve gizli hedef türleri gibi dar gizli sözleşme yardımcıları |
  </Accordion>

  <Accordion title="Sağlayıcı alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Düzenlenmiş yerel/kendi kendine barındırılan sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/self-hosted-provider-setup` | Odaklı OpenAI uyumlu kendi kendine barındırılan sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/cli-backend` | CLI arka uç varsayılanları + watchdog sabitleri |
    | `plugin-sdk/provider-auth-runtime` | Sağlayıcı pluginleri için çalışma zamanı API anahtarı çözümleme yardımcıları |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` gibi API anahtarı onboarding/profil yazma yardımcıları |
    | `plugin-sdk/provider-auth-result` | Standart OAuth kimlik doğrulama sonucu oluşturucusu |
    | `plugin-sdk/provider-auth-login` | Sağlayıcı pluginleri için paylaşılan etkileşimli giriş yardımcıları |
    | `plugin-sdk/provider-env-vars` | Sağlayıcı kimlik doğrulama ortam değişkeni arama yardımcıları |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan replay-policy oluşturucuları, sağlayıcı uç nokta yardımcıları ve `normalizeNativeXaiModelId` gibi model kimliği normalleştirme yardımcıları |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Genel sağlayıcı HTTP/uç nokta yetenek yardımcıları |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` ve `WebFetchProviderPlugin` gibi dar web-fetch yapılandırma/seçim sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-fetch` | Web-fetch sağlayıcı kaydı/önbellek yardımcıları |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin etkinleştirme bağlantısı gerektirmeyen sağlayıcılar için dar web-search yapılandırma/kimlik bilgisi yardımcıları |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` ve kapsamlı kimlik bilgisi ayarlayıcıları/alıcıları gibi dar web-search yapılandırma/kimlik bilgisi sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-search` | Web-search sağlayıcı kaydı/önbellek/çalışma zamanı yardımcıları |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini şema temizleme + tanılama ve `resolveXaiModelCompatPatch` / `applyXaiModelCompat` gibi xAI uyumluluk yardımcıları |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` ve benzerleri |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri ve paylaşılan Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot sarmalayıcı yardımcıları |
    | `plugin-sdk/provider-onboard` | Onboarding yapılandırma yama yardımcıları |
    | `plugin-sdk/global-singleton` | Süreç-yerel singleton/map/cache yardımcıları |
  </Accordion>

  <Accordion title="Kimlik doğrulama ve güvenlik alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, komut kayıt defteri yardımcıları, gönderen yetkilendirme yardımcıları |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` ve `buildHelpMessage` gibi komut/yardım mesajı oluşturucuları |
    | `plugin-sdk/approval-auth-runtime` | Onaylayıcı çözümleme ve aynı sohbet eylem kimlik doğrulama yardımcıları |
    | `plugin-sdk/approval-client-runtime` | Yerel exec onay profili/filtre yardımcıları |
    | `plugin-sdk/approval-delivery-runtime` | Yerel onay yeteneği/teslim adaptörleri |
    | `plugin-sdk/approval-gateway-runtime` | Paylaşılan onay Gateway çözümleme yardımcısı |
    | `plugin-sdk/approval-handler-adapter-runtime` | Sıcak kanal giriş noktaları için hafif yerel onay adaptörü yükleme yardımcıları |
    | `plugin-sdk/approval-handler-runtime` | Daha geniş onay işleyici çalışma zamanı yardımcıları; yeterli olduğunda daha dar adaptör/Gateway yüzeylerini tercih edin |
    | `plugin-sdk/approval-native-runtime` | Yerel onay hedefi + hesap bağlama yardımcıları |
    | `plugin-sdk/approval-reply-runtime` | Exec/plugin onay yanıt yükü yardımcıları |
    | `plugin-sdk/command-auth-native` | Yerel komut kimlik doğrulama + yerel oturum hedefi yardımcıları |
    | `plugin-sdk/command-detection` | Paylaşılan komut algılama yardımcıları |
    | `plugin-sdk/command-surface` | Komut gövdesi normalleştirme ve komut yüzeyi yardımcıları |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Kanal/plugin gizli yüzeyleri için dar gizli sözleşme toplama yardımcıları |
    | `plugin-sdk/secret-ref-runtime` | Gizli sözleşme/yapılandırma ayrıştırma için dar `coerceSecretRef` ve SecretRef türlendirme yardımcıları |
    | `plugin-sdk/security-runtime` | Paylaşılan güven, DM geçitleme, harici içerik ve gizli toplama yardımcıları |
    | `plugin-sdk/ssrf-policy` | Ana makine izin listesi ve özel ağ SSRF ilkesi yardımcıları |
    | `plugin-sdk/ssrf-runtime` | Sabitlenmiş dispatcher, SSRF korumalı fetch ve SSRF ilkesi yardımcıları |
    | `plugin-sdk/secret-input` | Gizli girdi ayrıştırma yardımcıları |
    | `plugin-sdk/webhook-ingress` | Webhook istek/hedef yardımcıları |
    | `plugin-sdk/webhook-request-guards` | İstek gövdesi boyutu/zaman aşımı yardımcıları |
  </Accordion>

  <Accordion title="Çalışma zamanı ve depolama alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/runtime` | Geniş çalışma zamanı/günlükleme/yedekleme/plugin kurulum yardımcıları |
    | `plugin-sdk/runtime-env` | Dar çalışma zamanı ortamı, günlükleyici, zaman aşımı, yeniden deneme ve backoff yardımcıları |
    | `plugin-sdk/channel-runtime-context` | Genel kanal çalışma zamanı bağlamı kaydı ve arama yardımcıları |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Paylaşılan plugin komut/kanca/http/etkileşimli yardımcıları |
    | `plugin-sdk/hook-runtime` | Paylaşılan Webhook/dahili kanca işlem hattı yardımcıları |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod` ve `createLazyRuntimeSurface` gibi tembel çalışma zamanı içe aktarma/bağlama yardımcıları |
    | `plugin-sdk/process-runtime` | Süreç exec yardımcıları |
    | `plugin-sdk/cli-runtime` | CLI biçimlendirme, bekleme ve sürüm yardımcıları |
    | `plugin-sdk/gateway-runtime` | Gateway istemcisi ve kanal durumu yama yardımcıları |
    | `plugin-sdk/config-runtime` | Yapılandırma yükleme/yazma yardımcıları |
    | `plugin-sdk/telegram-command-config` | Paketlenmiş Telegram sözleşme yüzeyi kullanılamadığında bile Telegram komut adı/açıklama normalleştirme ve yinelenen/çakışma denetimleri |
    | `plugin-sdk/approval-runtime` | Exec/plugin onay yardımcıları, onay yeteneği oluşturucuları, kimlik doğrulama/profil yardımcıları, yerel yönlendirme/çalışma zamanı yardımcıları |
    | `plugin-sdk/reply-runtime` | Paylaşılan gelen/yanıt çalışma zamanı yardımcıları, parçalara ayırma, gönderme, Heartbeat, yanıt planlayıcısı |
    | `plugin-sdk/reply-dispatch-runtime` | Dar yanıt gönderme/tamamlama yardımcıları |
    | `plugin-sdk/reply-history` | `buildHistoryContext`, `recordPendingHistoryEntry` ve `clearHistoryEntriesIfEnabled` gibi paylaşılan kısa pencere yanıt geçmişi yardımcıları |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Dar metin/markdown parçalara ayırma yardımcıları |
    | `plugin-sdk/session-store-runtime` | Oturum deposu yolu + updated-at yardımcıları |
    | `plugin-sdk/state-paths` | Durum/OAuth dizin yolu yardımcıları |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey` ve `resolveDefaultAgentBoundAccountId` gibi rota/oturum anahtarı/hesap bağlama yardımcıları |
    | `plugin-sdk/status-helpers` | Paylaşılan kanal/hesap durumu özeti yardımcıları, çalışma zamanı durumu varsayılanları ve sorun meta veri yardımcıları |
    | `plugin-sdk/target-resolver-runtime` | Paylaşılan hedef çözümleyici yardımcıları |
    | `plugin-sdk/string-normalization-runtime` | Slug/dize normalleştirme yardımcıları |
    | `plugin-sdk/request-url` | Fetch/istek benzeri girdilerden dize URL’leri çıkarın |
    | `plugin-sdk/run-command` | Normalleştirilmiş stdout/stderr sonuçlarıyla zamanlanmış komut çalıştırıcısı |
    | `plugin-sdk/param-readers` | Yaygın araç/CLI parametre okuyucuları |
    | `plugin-sdk/tool-payload` | Araç sonuç nesnelerinden normalleştirilmiş yükleri çıkarın |
    | `plugin-sdk/tool-send` | Araç bağımsız değişkenlerinden kanonik gönderim hedef alanlarını çıkarın |
    | `plugin-sdk/temp-path` | Paylaşılan geçici indirme yolu yardımcıları |
    | `plugin-sdk/logging-core` | Alt sistem günlükleyici ve sansürleme yardımcıları |
    | `plugin-sdk/markdown-table-runtime` | Markdown tablo modu yardımcıları |
    | `plugin-sdk/json-store` | Küçük JSON durumu okuma/yazma yardımcıları |
    | `plugin-sdk/file-lock` | Yeniden girişli dosya kilidi yardımcıları |
    | `plugin-sdk/persistent-dedupe` | Disk destekli tekilleştirme önbelleği yardımcıları |
    | `plugin-sdk/acp-runtime` | ACP çalışma zamanı/oturum ve yanıt gönderme yardımcıları |
    | `plugin-sdk/agent-config-primitives` | Dar ajan çalışma zamanı yapılandırma şeması ilkel türleri |
    | `plugin-sdk/boolean-param` | Gevşek boolean parametre okuyucusu |
    | `plugin-sdk/dangerous-name-runtime` | Tehlikeli ad eşleştirme çözümleme yardımcıları |
    | `plugin-sdk/device-bootstrap` | Cihaz önyükleme ve eşleme token yardımcıları |
    | `plugin-sdk/extension-shared` | Paylaşılan pasif kanal, durum ve ortam proxy yardımcı ilkel türleri |
    | `plugin-sdk/models-provider-runtime` | `/models` komutu/sağlayıcı yanıt yardımcıları |
    | `plugin-sdk/skill-commands-runtime` | Skills komut listeleme yardımcıları |
    | `plugin-sdk/native-command-registry` | Yerel komut kayıt defteri/oluşturma/serileştirme yardımcıları |
    | `plugin-sdk/agent-harness` | Düşük seviye ajan harness’leri için deneysel güvenilir plugin yüzeyi: harness türleri, etkin çalıştırma yönlendirme/durdurma yardımcıları, OpenClaw araç köprüsü yardımcıları ve deneme sonucu yardımcı programları |
    | `plugin-sdk/provider-zai-endpoint` | Z.A.I uç nokta algılama yardımcıları |
    | `plugin-sdk/infra-runtime` | Sistem olayı/Heartbeat yardımcıları |
    | `plugin-sdk/collection-runtime` | Küçük sınırlı önbellek yardımcıları |
    | `plugin-sdk/diagnostic-runtime` | Tanılama bayrağı ve olay yardımcıları |
    | `plugin-sdk/error-runtime` | Hata grafiği, biçimlendirme, paylaşılan hata sınıflandırma yardımcıları, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Sarılmış fetch, proxy ve sabitlenmiş arama yardımcıları |
    | `plugin-sdk/host-runtime` | Ana makine adı ve SCP ana makine normalleştirme yardımcıları |
    | `plugin-sdk/retry-runtime` | Yeniden deneme yapılandırması ve yeniden deneme çalıştırıcısı yardımcıları |
    | `plugin-sdk/agent-runtime` | Ajan dizini/kimliği/çalışma alanı yardımcıları |
    | `plugin-sdk/directory-runtime` | Yapılandırma destekli dizin sorgusu/tekilleştirme |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Yetenek ve test alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Medya yükü oluşturucularına ek olarak paylaşılan medya fetch/dönüştürme/depolama yardımcıları |
    | `plugin-sdk/media-generation-runtime` | Paylaşılan medya üretimi failover yardımcıları, aday seçimi ve eksik model mesajlaşması |
    | `plugin-sdk/media-understanding` | Medya anlama sağlayıcı türleri ve sağlayıcıya yönelik görsel/ses yardımcı dışa aktarımları |
    | `plugin-sdk/text-runtime` | Yardımcıya görünür metin ayıklama, markdown işleme/parçalara ayırma/tablo yardımcıları, sansürleme yardımcıları, yönerge etiketi yardımcıları ve güvenli metin yardımcıları gibi paylaşılan metin/markdown/günlükleme yardımcıları |
    | `plugin-sdk/text-chunking` | Giden metin parçalara ayırma yardımcısı |
    | `plugin-sdk/speech` | Konuşma sağlayıcı türleri ve sağlayıcıya yönelik yönerge, kayıt defteri ve doğrulama yardımcıları |
    | `plugin-sdk/speech-core` | Paylaşılan konuşma sağlayıcı türleri, kayıt defteri, yönerge ve normalleştirme yardımcıları |
    | `plugin-sdk/realtime-transcription` | Gerçek zamanlı transkripsiyon sağlayıcı türleri ve kayıt defteri yardımcıları |
    | `plugin-sdk/realtime-voice` | Gerçek zamanlı ses sağlayıcı türleri ve kayıt defteri yardımcıları |
    | `plugin-sdk/image-generation` | Görsel üretimi sağlayıcı türleri |
    | `plugin-sdk/image-generation-core` | Paylaşılan görsel üretimi türleri, failover, kimlik doğrulama ve kayıt defteri yardımcıları |
    | `plugin-sdk/music-generation` | Müzik üretimi sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/music-generation-core` | Paylaşılan müzik üretimi türleri, failover yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
    | `plugin-sdk/video-generation` | Video üretimi sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/video-generation-core` | Paylaşılan video üretimi türleri, failover yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
    | `plugin-sdk/webhook-targets` | Webhook hedef kayıt defteri ve rota kurulum yardımcıları |
    | `plugin-sdk/webhook-path` | Webhook yolu normalleştirme yardımcıları |
    | `plugin-sdk/web-media` | Paylaşılan uzak/yerel medya yükleme yardımcıları |
    | `plugin-sdk/zod` | Plugin SDK kullanıcıları için yeniden dışa aktarılan `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Bellek alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/memory-core` | Yönetici/yapılandırma/dosya/CLI yardımcıları için paketlenmiş memory-core yardımcı yüzeyi |
    | `plugin-sdk/memory-core-engine-runtime` | Bellek dizini/arama çalışma zamanı cephesi |
    | `plugin-sdk/memory-core-host-engine-foundation` | Bellek ana makinesi foundation motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Bellek ana makinesi embedding sözleşmeleri, kayıt defteri erişimi, yerel sağlayıcı ve genel toplu/uzak yardımcılar |
    | `plugin-sdk/memory-core-host-engine-qmd` | Bellek ana makinesi QMD motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-storage` | Bellek ana makinesi depolama motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-multimodal` | Bellek ana makinesi çok kipli yardımcıları |
    | `plugin-sdk/memory-core-host-query` | Bellek ana makinesi sorgu yardımcıları |
    | `plugin-sdk/memory-core-host-secret` | Bellek ana makinesi gizli yardımcıları |
    | `plugin-sdk/memory-core-host-events` | Bellek ana makinesi olay günlüğü yardımcıları |
    | `plugin-sdk/memory-core-host-status` | Bellek ana makinesi durum yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-cli` | Bellek ana makinesi CLI çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-core` | Bellek ana makinesi çekirdek çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-files` | Bellek ana makinesi dosya/çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-host-core` | Bellek ana makinesi çekirdek çalışma zamanı yardımcıları için üretici bağımsız takma ad |
    | `plugin-sdk/memory-host-events` | Bellek ana makinesi olay günlüğü yardımcıları için üretici bağımsız takma ad |
    | `plugin-sdk/memory-host-files` | Bellek ana makinesi dosya/çalışma zamanı yardımcıları için üretici bağımsız takma ad |
    | `plugin-sdk/memory-host-markdown` | Belleğe komşu pluginler için paylaşılan yönetilen markdown yardımcıları |
    | `plugin-sdk/memory-host-search` | Arama yöneticisi erişimi için Active Memory çalışma zamanı cephesi |
    | `plugin-sdk/memory-host-status` | Bellek ana makinesi durum yardımcıları için üretici bağımsız takma ad |
    | `plugin-sdk/memory-lancedb` | Paketlenmiş memory-lancedb yardımcı yüzeyi |
  </Accordion>

  <Accordion title="Ayrılmış paketlenmiş yardımcı alt yolları">
    | Aile | Geçerli alt yollar | Amaçlanan kullanım |
    | --- | --- | --- |
    | Tarayıcı | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Paketlenmiş browser plugin destek yardımcıları (`browser-support` uyumluluk barrel’i olarak kalır) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Paketlenmiş Matrix yardımcı/çalışma zamanı yüzeyi |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Paketlenmiş LINE yardımcı/çalışma zamanı yüzeyi |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Paketlenmiş IRC yardımcı yüzeyi |
    | Kanala özgü yardımcılar | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Paketlenmiş kanal uyumluluk/yardımcı yüzeyleri |
    | Kimlik doğrulama/plugin’e özgü yardımcılar | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Paketlenmiş özellik/plugin yardımcı yüzeyleri; `plugin-sdk/github-copilot-token` şu anda `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` ve `resolveCopilotApiToken` dışa aktarımlarını içerir |
  </Accordion>
</AccordionGroup>

## Kayıt API’si

`register(api)` geri çağırması, bu yöntemlere sahip bir `OpenClawPluginApi`
nesnesi alır:

### Yetenek kaydı

| Yöntem                                           | Kaydettiği şey                        |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Metin çıkarımı (LLM)                  |
| `api.registerAgentHarness(...)`                  | Deneysel düşük seviye ajan yürütücüsü |
| `api.registerCliBackend(...)`                    | Yerel CLI çıkarım arka ucu            |
| `api.registerChannel(...)`                       | Mesajlaşma kanalı                     |
| `api.registerSpeechProvider(...)`                | Metinden konuşmaya / STT sentezi      |
| `api.registerRealtimeTranscriptionProvider(...)` | Akışlı gerçek zamanlı transkripsiyon  |
| `api.registerRealtimeVoiceProvider(...)`         | Çift yönlü gerçek zamanlı ses oturumları |
| `api.registerMediaUnderstandingProvider(...)`    | Görsel/ses/video analizi              |
| `api.registerImageGenerationProvider(...)`       | Görsel üretimi                        |
| `api.registerMusicGenerationProvider(...)`       | Müzik üretimi                         |
| `api.registerVideoGenerationProvider(...)`       | Video üretimi                         |
| `api.registerWebFetchProvider(...)`              | Web fetch / scrape sağlayıcısı        |
| `api.registerWebSearchProvider(...)`             | Web araması                           |

### Araçlar ve komutlar

| Yöntem                          | Kaydettiği şey                                |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Ajan aracı (zorunlu veya `{ optional: true }`) |
| `api.registerCommand(def)`      | Özel komut (LLM’yi atlar)                     |

### Altyapı

| Yöntem                                         | Kaydettiği şey                          |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Olay kancası                            |
| `api.registerHttpRoute(params)`                | Gateway HTTP uç noktası                 |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC yöntemi                     |
| `api.registerCli(registrar, opts?)`            | CLI alt komutu                          |
| `api.registerService(service)`                 | Arka plan hizmeti                       |
| `api.registerInteractiveHandler(registration)` | Etkileşimli işleyici                    |
| `api.registerMemoryPromptSupplement(builder)`  | Eklemeli bellek komşusu istem bölümü    |
| `api.registerMemoryCorpusSupplement(adapter)`  | Eklemeli bellek arama/okuma korpusu     |

Ayrılmış çekirdek yönetici ad alanları (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`), bir plugin daha dar bir Gateway yöntem kapsamı atamaya çalışsa bile,
her zaman `operator.admin` olarak kalır. Plugin’in sahip olduğu yöntemler için
plugin’e özgü önekleri tercih edin.

### CLI kayıt meta verileri

`api.registerCli(registrar, opts?)` iki tür üst düzey meta veri kabul eder:

- `commands`: kaydedicinin sahip olduğu açık komut kökleri
- `descriptors`: kök CLI yardımı, yönlendirme ve tembel plugin CLI kaydı için
  ayrıştırma zamanında kullanılan komut tanımlayıcıları

Bir plugin komutunun normal kök CLI yolunda tembel yüklemeli kalmasını
istiyorsanız, bu kaydedicinin sunduğu her üst düzey komut kökünü kapsayan
`descriptors` sağlayın.

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

Yalnızca `commands` kullanın; bunu da yalnızca tembel kök CLI kaydına
ihtiyacınız olmadığında yapın. Bu açgözlü uyumluluk yolu desteklenmeye devam
eder, ancak ayrıştırma zamanında tembel yükleme için tanımlayıcı destekli
yer tutucular kurmaz.

### CLI arka uç kaydı

`api.registerCliBackend(...)`, bir plugin’in `codex-cli` gibi yerel bir
AI CLI arka ucunun varsayılan yapılandırmasına sahip olmasını sağlar.

- Arka uç `id` değeri, `codex-cli/gpt-5` gibi model referanslarında sağlayıcı ön eki olur.
- Arka uç `config`, `agents.defaults.cliBackends.<id>` ile aynı şekli kullanır.
- Kullanıcı yapılandırması yine önceliklidir. OpenClaw, CLI’yi çalıştırmadan önce
  eklenti varsayılanı üzerine `agents.defaults.cliBackends.<id>` değerini birleştirir.
- Bir arka uç birleştirmeden sonra uyumluluk yeniden yazımları gerektiriyorsa
  (örneğin eski bayrak şekillerini normalleştirmek için) `normalizeConfig` kullanın.

### Özel yuvalar

| Yöntem                                     | Kaydettiği şey                                                                                                                                           |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Bağlam motoru (aynı anda yalnızca biri etkin). `assemble()` geri çağırması, motorun istem eklemelerini uyarlayabilmesi için `availableTools` ve `citationsMode` alır. |
| `api.registerMemoryCapability(capability)` | Birleşik bellek yeteneği                                                                                                                                  |
| `api.registerMemoryPromptSection(builder)` | Bellek istem bölümü oluşturucusu                                                                                                                          |
| `api.registerMemoryFlushPlan(resolver)`    | Bellek flush planı çözümleyicisi                                                                                                                          |
| `api.registerMemoryRuntime(runtime)`       | Bellek çalışma zamanı adaptörü                                                                                                                            |

### Bellek embedding adaptörleri

| Yöntem                                         | Kaydettiği şey                                 |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Etkin plugin için bellek embedding adaptörü    |

- `registerMemoryCapability`, tercih edilen özel bellek-plugin API’sidir.
- `registerMemoryCapability`, eşlik eden pluginlerin belirli bir
  bellek plugin’inin özel düzenine erişmek yerine
  `openclaw/plugin-sdk/memory-host-core` üzerinden dışa aktarılan bellek
  yapıtlarını tüketebilmesi için `publicArtifacts.listArtifacts(...)`
  da sunabilir.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` ve
  `registerMemoryRuntime`, eskiyle uyumlu özel bellek-plugin API’leridir.
- `registerMemoryEmbeddingProvider`, etkin bellek plugin’inin bir veya daha
  fazla embedding adaptörü kimliği (örneğin `openai`, `gemini` veya özel,
  plugin tanımlı bir kimlik) kaydetmesine olanak tanır.
- `agents.defaults.memorySearch.provider` ve
  `agents.defaults.memorySearch.fallback` gibi kullanıcı yapılandırmaları,
  kaydedilmiş bu adaptör kimliklerine göre çözülür.

### Olaylar ve yaşam döngüsü

| Yöntem                                       | Ne yapar                     |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Türlendirilmiş yaşam döngüsü kancası |
| `api.onConversationBindingResolved(handler)` | Konuşma bağlama geri çağırması |

### Kanca karar semantiği

- `before_tool_call`: `{ block: true }` döndürmek terminaldir. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` döndürmek karar yok olarak değerlendirilir (`block` alanını hiç vermemekle aynıdır), geçersiz kılma olarak değil.
- `before_install`: `{ block: true }` döndürmek terminaldir. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` döndürmek karar yok olarak değerlendirilir (`block` alanını hiç vermemekle aynıdır), geçersiz kılma olarak değil.
- `reply_dispatch`: `{ handled: true, ... }` döndürmek terminaldir. Herhangi bir işleyici gönderimi üstlendiğinde, daha düşük öncelikli işleyiciler ve varsayılan model gönderim yolu atlanır.
- `message_sending`: `{ cancel: true }` döndürmek terminaldir. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` döndürmek karar yok olarak değerlendirilir (`cancel` alanını hiç vermemekle aynıdır), geçersiz kılma olarak değil.

### API nesnesi alanları

| Alan                    | Tür                       | Açıklama                                                                                  |
| ----------------------- | ------------------------- | ----------------------------------------------------------------------------------------- |
| `api.id`                | `string`                  | Plugin kimliği                                                                            |
| `api.name`              | `string`                  | Görünen ad                                                                                |
| `api.version`           | `string?`                 | Plugin sürümü (isteğe bağlı)                                                              |
| `api.description`       | `string?`                 | Plugin açıklaması (isteğe bağlı)                                                          |
| `api.source`            | `string`                  | Plugin kaynak yolu                                                                        |
| `api.rootDir`           | `string?`                 | Plugin kök dizini (isteğe bağlı)                                                          |
| `api.config`            | `OpenClawConfig`          | Geçerli yapılandırma anlık görüntüsü (varsa etkin bellek içi çalışma zamanı anlık görüntüsü) |
| `api.pluginConfig`      | `Record<string, unknown>` | `plugins.entries.<id>.config` içinden plugin’e özgü yapılandırma                          |
| `api.runtime`           | `PluginRuntime`           | [Çalışma zamanı yardımcıları](/tr/plugins/sdk-runtime)                                       |
| `api.logger`            | `PluginLogger`            | Kapsamlı günlükleyici (`debug`, `info`, `warn`, `error`)                                  |
| `api.registrationMode`  | `PluginRegistrationMode`  | Geçerli yükleme modu; `"setup-runtime"` hafif tam giriş öncesi başlatma/kurulum penceresidir |
| `api.resolvePath(input)` | `(string) => string`     | Plugin köküne göre yolu çözümle                                                           |

## Dahili modül kuralı

Plugin’iniz içinde, dahili içe aktarımlar için yerel barrel dosyaları kullanın:

```
my-plugin/
  api.ts            # Harici kullanıcılar için genel dışa aktarımlar
  runtime-api.ts    # Yalnızca dahili çalışma zamanı dışa aktarımları
  index.ts          # Plugin giriş noktası
  setup-entry.ts    # Yalnızca kurulum için hafif giriş (isteğe bağlı)
```

<Warning>
  Üretim kodunda kendi plugin’inizi hiçbir zaman `openclaw/plugin-sdk/<your-plugin>`
  üzerinden içe aktarmayın. Dahili içe aktarımları `./api.ts` veya
  `./runtime-api.ts` üzerinden yönlendirin. SDK yolu yalnızca harici sözleşmedir.
</Warning>

Cephe üzerinden yüklenen paketlenmiş plugin genel yüzeyleri (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` ve benzer genel giriş dosyaları) artık OpenClaw
zaten çalışıyorsa etkin çalışma zamanı yapılandırma anlık görüntüsünü tercih eder.
Henüz çalışma zamanı anlık görüntüsü yoksa, disk üzerindeki çözülmüş yapılandırma
dosyasına geri dönerler.

Sağlayıcı pluginleri, bir yardımcı kasıtlı olarak sağlayıcıya özgüyse ve henüz genel bir
SDK alt yoluna ait değilse dar bir plugin-yerel sözleşme barrel’i de sunabilir.
Geçerli paketlenmiş örnek: Anthropic sağlayıcısı, Anthropic beta-header ve
`service_tier` mantığını genel bir `plugin-sdk/*` sözleşmesine taşımak yerine,
Claude akış yardımcılarını kendi genel `api.ts` / `contract-api.ts` yüzeyinde tutar.

Diğer geçerli paketlenmiş örnekler:

- `@openclaw/openai-provider`: `api.ts`, sağlayıcı oluşturucularını,
  varsayılan model yardımcılarını ve gerçek zamanlı sağlayıcı oluşturucularını dışa aktarır
- `@openclaw/openrouter-provider`: `api.ts`, sağlayıcı oluşturucusunun yanı sıra
  onboarding/yapılandırma yardımcılarını dışa aktarır

<Warning>
  Extension üretim kodu ayrıca `openclaw/plugin-sdk/<other-plugin>`
  içe aktarımlarından da kaçınmalıdır. Bir yardımcı gerçekten paylaşılıyorsa,
  iki plugin’i birbirine bağlamak yerine onu `openclaw/plugin-sdk/speech`,
  `.../provider-model-shared` veya başka bir yetenek odaklı yüzey gibi tarafsız
  bir SDK alt yoluna taşıyın.
</Warning>

## İlgili

- [Giriş Noktaları](/tr/plugins/sdk-entrypoints) — `definePluginEntry` ve `defineChannelPluginEntry` seçenekleri
- [Çalışma Zamanı Yardımcıları](/tr/plugins/sdk-runtime) — tam `api.runtime` ad alanı başvurusu
- [Kurulum ve Yapılandırma](/tr/plugins/sdk-setup) — paketleme, manifestler, yapılandırma şemaları
- [Test](/tr/plugins/sdk-testing) — test yardımcı programları ve lint kuralları
- [SDK Geçişi](/tr/plugins/sdk-migration) — kullanımdan kaldırılmış yüzeylerden geçiş
- [Plugin Dahili Yapısı](/tr/plugins/architecture) — derin mimari ve yetenek modeli

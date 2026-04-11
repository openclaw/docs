---
read_when:
    - Hangi SDK alt yolundan içe aktarma yapmanız gerektiğini bilmeniz gerekiyor
    - OpenClawPluginApi üzerindeki tüm kayıt yöntemleri için bir başvuru istiyorsunuz
    - Belirli bir SDK dışa aktarımını arıyorsunuz
sidebarTitle: SDK Overview
summary: İçe aktarma eşlemesi, kayıt API başvurusu ve SDK mimarisi
title: Plugin SDK Genel Bakış
x-i18n:
    generated_at: "2026-04-11T02:46:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4bfeb5896f68e3e4ee8cf434d43a019e0d1fe5af57f5bf7a5172847c476def0c
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Plugin SDK Genel Bakış

Plugin SDK, eklentiler ile çekirdek arasındaki türlendirilmiş sözleşmedir. Bu sayfa,
**neyi içe aktarmanız gerektiği** ve **neleri kaydedebileceğiniz** için başvurudur.

<Tip>
  **Nasıl yapılır kılavuzu mu arıyorsunuz?**
  - İlk eklenti mi? [Başlangıç](/tr/plugins/building-plugins) ile başlayın
  - Kanal eklentisi mi? [Kanal Eklentileri](/tr/plugins/sdk-channel-plugins) bölümüne bakın
  - Sağlayıcı eklentisi mi? [Sağlayıcı Eklentileri](/tr/plugins/sdk-provider-plugins) bölümüne bakın
</Tip>

## İçe aktarma kuralı

Her zaman belirli bir alt yoldan içe aktarın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Her alt yol küçük, kendi içinde yeterli bir modüldür. Bu, başlatmayı hızlı tutar ve
döngüsel bağımlılık sorunlarını önler. Kanala özgü giriş/derleme yardımcıları için
`openclaw/plugin-sdk/channel-core` tercih edin; daha geniş şemsiye yüzey ve
`buildChannelConfigSchema` gibi paylaşılan yardımcılar için `openclaw/plugin-sdk/core`
kullanın.

`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` gibi
sağlayıcı adlı kolaylık yüzeyleri veya kanal markalı yardımcı yüzeyler
eklemeyin ya da bunlara bağımlı olmayın. Paketlenmiş eklentiler,
genel SDK alt yollarını kendi `api.ts` veya `runtime-api.ts` barrel dosyaları içinde
birleştirmelidir; çekirdek ise ya bu eklenti yerel barrel dosyalarını kullanmalı ya da ihtiyaç gerçekten
kanallar arasıysa dar bir genel SDK sözleşmesi eklemelidir.

Üretilen dışa aktarma eşlemesi hâlâ `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` ve `plugin-sdk/matrix*` gibi
küçük bir paketlenmiş eklenti yardımcı yüzeyi kümesini içerir. Bu
alt yollar yalnızca paketlenmiş eklenti bakımı ve uyumluluk içindir; aşağıdaki genel tabloda
bilinçli olarak yer verilmez ve yeni üçüncü taraf eklentiler için önerilen
içe aktarma yolu değildir.

## Alt yol başvurusu

En sık kullanılan alt yollar, amaca göre gruplandırılmıştır. 200'den fazla alt yol içeren
üretilmiş tam liste `scripts/lib/plugin-sdk-entrypoints.json` içinde yer alır.

Ayrılmış paketlenmiş eklenti yardımcı alt yolları bu üretilmiş listede görünmeye devam eder.
Bir belge sayfası bunlardan birini açıkça genel olarak öne çıkarmadıkça, bunları
uygulama ayrıntısı/uyumluluk yüzeyleri olarak değerlendirin.

### Eklenti girişi

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
    | `plugin-sdk/config-schema` | Kök `openclaw.json` Zod şeması dışa aktarımı (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ayrıca `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Paylaşılan kurulum sihirbazı yardımcıları, izin listesi istemleri, kurulum durumu oluşturucuları |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Çok hesaplı yapılandırma/eylem kapısı yardımcıları, varsayılan hesap geri dönüş yardımcıları |
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
    | `plugin-sdk/inbound-envelope` | Paylaşılan gelen yönlendirme + zarf oluşturucu yardımcıları |
    | `plugin-sdk/inbound-reply-dispatch` | Paylaşılan gelen kaydetme ve dağıtım yardımcıları |
    | `plugin-sdk/messaging-targets` | Hedef ayrıştırma/eşleştirme yardımcıları |
    | `plugin-sdk/outbound-media` | Paylaşılan giden medya yükleme yardımcıları |
    | `plugin-sdk/outbound-runtime` | Giden kimlik/gönderme temsilci yardımcıları |
    | `plugin-sdk/thread-bindings-runtime` | İş parçacığı bağlama yaşam döngüsü ve bağdaştırıcı yardımcıları |
    | `plugin-sdk/agent-media-payload` | Eski aracı medya yükü oluşturucusu |
    | `plugin-sdk/conversation-runtime` | Konuşma/iş parçacığı bağlama, eşleştirme ve yapılandırılmış bağlama yardımcıları |
    | `plugin-sdk/runtime-config-snapshot` | Çalışma zamanı yapılandırma anlık görüntü yardımcısı |
    | `plugin-sdk/runtime-group-policy` | Çalışma zamanı grup ilkesi çözümleme yardımcıları |
    | `plugin-sdk/channel-status` | Paylaşılan kanal durum anlık görüntüsü/özet yardımcıları |
    | `plugin-sdk/channel-config-primitives` | Dar kanal yapılandırma şeması ilkel öğeleri |
    | `plugin-sdk/channel-config-writes` | Kanal yapılandırma yazma yetkilendirme yardımcıları |
    | `plugin-sdk/channel-plugin-common` | Paylaşılan kanal eklentisi önsöz dışa aktarımları |
    | `plugin-sdk/allowlist-config-edit` | İzin listesi yapılandırma düzenleme/okuma yardımcıları |
    | `plugin-sdk/group-access` | Paylaşılan grup erişim kararı yardımcıları |
    | `plugin-sdk/direct-dm` | Paylaşılan doğrudan DM kimlik doğrulama/koruma yardımcıları |
    | `plugin-sdk/interactive-runtime` | Etkileşimli yanıt yükü normalleştirme/indirgeme yardımcıları |
    | `plugin-sdk/channel-inbound` | Gelen debounce, mention eşleştirme, mention politikası yardımcıları ve zarf yardımcıları |
    | `plugin-sdk/channel-send-result` | Yanıt sonuç türleri |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Hedef ayrıştırma/eşleştirme yardımcıları |
    | `plugin-sdk/channel-contract` | Kanal sözleşmesi türleri |
    | `plugin-sdk/channel-feedback` | Geri bildirim/reaksiyon kablolaması |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` gibi dar gizli sözleşme yardımcıları ve gizli hedef türleri |
  </Accordion>

  <Accordion title="Sağlayıcı alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Derlenmiş yerel/self-hosted sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/self-hosted-provider-setup` | Odaklı OpenAI uyumlu self-hosted sağlayıcı kurulum yardımcıları |
    | `plugin-sdk/cli-backend` | CLI arka uç varsayılanları + watchdog sabitleri |
    | `plugin-sdk/provider-auth-runtime` | Sağlayıcı eklentileri için çalışma zamanı API anahtarı çözümleme yardımcıları |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` gibi API anahtarı katılım/profil yazma yardımcıları |
    | `plugin-sdk/provider-auth-result` | Standart OAuth kimlik doğrulama sonucu oluşturucusu |
    | `plugin-sdk/provider-auth-login` | Sağlayıcı eklentileri için paylaşılan etkileşimli oturum açma yardımcıları |
    | `plugin-sdk/provider-env-vars` | Sağlayıcı kimlik doğrulama env değişkeni arama yardımcıları |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan replay-policy oluşturucuları, sağlayıcı uç noktası yardımcıları ve `normalizeNativeXaiModelId` gibi model kimliği normalleştirme yardımcıları |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Genel sağlayıcı HTTP/uç nokta yetenek yardımcıları |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` ve `WebFetchProviderPlugin` gibi dar web-fetch yapılandırma/seçim sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-fetch` | Web-fetch sağlayıcı kaydı/önbellek yardımcıları |
    | `plugin-sdk/provider-web-search-config-contract` | Eklenti etkinleştirme kablolaması gerektirmeyen sağlayıcılar için dar web-search yapılandırma/kimlik bilgisi yardımcıları |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` ve kapsamlı kimlik bilgisi ayarlayıcıları/getter'ları gibi dar web-search yapılandırma/kimlik bilgisi sözleşmesi yardımcıları |
    | `plugin-sdk/provider-web-search` | Web-search sağlayıcı kaydı/önbellek/çalışma zamanı yardımcıları |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini şema temizleme + tanılama ve `resolveXaiModelCompatPatch` / `applyXaiModelCompat` gibi xAI uyumluluk yardımcıları |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` ve benzerleri |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri ve paylaşılan Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot sarmalayıcı yardımcıları |
    | `plugin-sdk/provider-onboard` | Katılım yapılandırma yama yardımcıları |
    | `plugin-sdk/global-singleton` | Süreç yerel singleton/map/cache yardımcıları |
  </Accordion>

  <Accordion title="Kimlik doğrulama ve güvenlik alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, komut kayıt defteri yardımcıları, gönderen yetkilendirme yardımcıları |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` ve `buildHelpMessage` gibi komut/yardım mesajı oluşturucuları |
    | `plugin-sdk/approval-auth-runtime` | Onaylayıcı çözümleme ve aynı sohbet eylem-kimlik doğrulama yardımcıları |
    | `plugin-sdk/approval-client-runtime` | Doğal yürütme onay profili/filtre yardımcıları |
    | `plugin-sdk/approval-delivery-runtime` | Doğal onay yeteneği/teslimat bağdaştırıcıları |
    | `plugin-sdk/approval-gateway-runtime` | Paylaşılan onay ağ geçidi çözümleme yardımcısı |
    | `plugin-sdk/approval-handler-adapter-runtime` | Sıcak kanal giriş noktaları için hafif doğal onay bağdaştırıcısı yükleme yardımcıları |
    | `plugin-sdk/approval-handler-runtime` | Daha geniş onay işleyici çalışma zamanı yardımcıları; dar bağdaştırıcı/ağ geçidi yüzeyleri yeterliyse onları tercih edin |
    | `plugin-sdk/approval-native-runtime` | Doğal onay hedefi + hesap bağlama yardımcıları |
    | `plugin-sdk/approval-reply-runtime` | Yürütme/eklenti onay yanıt yükü yardımcıları |
    | `plugin-sdk/command-auth-native` | Doğal komut kimlik doğrulaması + doğal oturum hedefi yardımcıları |
    | `plugin-sdk/command-detection` | Paylaşılan komut algılama yardımcıları |
    | `plugin-sdk/command-surface` | Komut gövdesi normalleştirme ve komut yüzeyi yardımcıları |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Kanal/eklenti gizli yüzeyleri için dar gizli sözleşme toplama yardımcıları |
    | `plugin-sdk/secret-ref-runtime` | Gizli sözleşme/yapılandırma ayrıştırma için dar `coerceSecretRef` ve SecretRef türlendirme yardımcıları |
    | `plugin-sdk/security-runtime` | Paylaşılan güven, DM geçitleme, harici içerik ve gizli toplama yardımcıları |
    | `plugin-sdk/ssrf-policy` | Ana makine izin listesi ve özel ağ SSRF ilkesi yardımcıları |
    | `plugin-sdk/ssrf-runtime` | Sabitlenmiş dağıtıcı, SSRF korumalı fetch ve SSRF ilkesi yardımcıları |
    | `plugin-sdk/secret-input` | Gizli girdi ayrıştırma yardımcıları |
    | `plugin-sdk/webhook-ingress` | Webhook istek/hedef yardımcıları |
    | `plugin-sdk/webhook-request-guards` | İstek gövdesi boyutu/zaman aşımı yardımcıları |
  </Accordion>

  <Accordion title="Çalışma zamanı ve depolama alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/runtime` | Geniş çalışma zamanı/günlükleme/yedekleme/eklenti kurulum yardımcıları |
    | `plugin-sdk/runtime-env` | Dar çalışma zamanı env, logger, zaman aşımı, yeniden deneme ve backoff yardımcıları |
    | `plugin-sdk/channel-runtime-context` | Genel kanal çalışma zamanı bağlamı kaydı ve arama yardımcıları |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Paylaşılan eklenti komutu/kanca/http/etkileşimli yardımcılar |
    | `plugin-sdk/hook-runtime` | Paylaşılan webhook/dahili kanca işlem hattı yardımcıları |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod` ve `createLazyRuntimeSurface` gibi tembel çalışma zamanı içe aktarma/bağlama yardımcıları |
    | `plugin-sdk/process-runtime` | Süreç yürütme yardımcıları |
    | `plugin-sdk/cli-runtime` | CLI biçimlendirme, bekleme ve sürüm yardımcıları |
    | `plugin-sdk/gateway-runtime` | Ağ geçidi istemcisi ve kanal durumu yama yardımcıları |
    | `plugin-sdk/config-runtime` | Yapılandırma yükleme/yazma yardımcıları |
    | `plugin-sdk/telegram-command-config` | Paketlenmiş Telegram sözleşme yüzeyi kullanılamadığında bile Telegram komut adı/açıklaması normalleştirmesi ve yinelenen/çatışma denetimleri |
    | `plugin-sdk/approval-runtime` | Yürütme/eklenti onay yardımcıları, onay yeteneği oluşturucuları, kimlik doğrulama/profil yardımcıları, doğal yönlendirme/çalışma zamanı yardımcıları |
    | `plugin-sdk/reply-runtime` | Paylaşılan gelen/yanıt çalışma zamanı yardımcıları, parçalama, dağıtım, heartbeat, yanıt planlayıcısı |
    | `plugin-sdk/reply-dispatch-runtime` | Dar yanıt dağıtma/sonlandırma yardımcıları |
    | `plugin-sdk/reply-history` | `buildHistoryContext`, `recordPendingHistoryEntry` ve `clearHistoryEntriesIfEnabled` gibi paylaşılan kısa pencere yanıt geçmişi yardımcıları |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Dar metin/Markdown parçalama yardımcıları |
    | `plugin-sdk/session-store-runtime` | Oturum deposu yolu + updated-at yardımcıları |
    | `plugin-sdk/state-paths` | Durum/OAuth dizin yolu yardımcıları |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey` ve `resolveDefaultAgentBoundAccountId` gibi rota/oturum anahtarı/hesap bağlama yardımcıları |
    | `plugin-sdk/status-helpers` | Paylaşılan kanal/hesap durum özeti yardımcıları, çalışma zamanı durum varsayılanları ve sorun meta verisi yardımcıları |
    | `plugin-sdk/target-resolver-runtime` | Paylaşılan hedef çözümleyici yardımcıları |
    | `plugin-sdk/string-normalization-runtime` | Slug/dize normalleştirme yardımcıları |
    | `plugin-sdk/request-url` | Fetch/istek benzeri girdilerden dize URL'ler çıkarın |
    | `plugin-sdk/run-command` | Normalize edilmiş stdout/stderr sonuçlarıyla zamanlanmış komut çalıştırıcısı |
    | `plugin-sdk/param-readers` | Ortak araç/CLI parametre okuyucuları |
    | `plugin-sdk/tool-payload` | Araç sonuç nesnelerinden normalize edilmiş yükleri çıkarın |
    | `plugin-sdk/tool-send` | Araç argümanlarından kurallı gönderim hedefi alanlarını çıkarın |
    | `plugin-sdk/temp-path` | Paylaşılan geçici indirme yolu yardımcıları |
    | `plugin-sdk/logging-core` | Alt sistem logger ve sansürleme yardımcıları |
    | `plugin-sdk/markdown-table-runtime` | Markdown tablo modu yardımcıları |
    | `plugin-sdk/json-store` | Küçük JSON durum okuma/yazma yardımcıları |
    | `plugin-sdk/file-lock` | Yeniden girişli dosya kilidi yardımcıları |
    | `plugin-sdk/persistent-dedupe` | Disk destekli yineleme kaldırma önbelleği yardımcıları |
    | `plugin-sdk/acp-runtime` | ACP çalışma zamanı/oturum ve yanıt dağıtma yardımcıları |
    | `plugin-sdk/agent-config-primitives` | Dar aracı çalışma zamanı yapılandırma şeması ilkel öğeleri |
    | `plugin-sdk/boolean-param` | Gevşek boolean parametre okuyucusu |
    | `plugin-sdk/dangerous-name-runtime` | Tehlikeli ad eşleştirme çözümleme yardımcıları |
    | `plugin-sdk/device-bootstrap` | Cihaz bootstrap ve eşleştirme belirteci yardımcıları |
    | `plugin-sdk/extension-shared` | Paylaşılan pasif kanal, durum ve ortam proxy yardımcı ilkel öğeleri |
    | `plugin-sdk/models-provider-runtime` | `/models` komutu/sağlayıcı yanıt yardımcıları |
    | `plugin-sdk/skill-commands-runtime` | Skills komut listeleme yardımcıları |
    | `plugin-sdk/native-command-registry` | Doğal komut kayıt defteri/derleme/serileştirme yardımcıları |
    | `plugin-sdk/agent-harness` | Düşük seviyeli agent harness'leri için deneysel güvenilir eklenti yüzeyi: harness türleri, etkin çalıştırma yönlendirme/durdurma yardımcıları, OpenClaw araç köprüsü yardımcıları ve deneme sonuç yardımcıları |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI uç nokta algılama yardımcıları |
    | `plugin-sdk/infra-runtime` | Sistem olayı/heartbeat yardımcıları |
    | `plugin-sdk/collection-runtime` | Küçük sınırlı önbellek yardımcıları |
    | `plugin-sdk/diagnostic-runtime` | Tanılama bayrağı ve olay yardımcıları |
    | `plugin-sdk/error-runtime` | Hata grafiği, biçimlendirme, paylaşılan hata sınıflandırma yardımcıları, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Sarmalanmış fetch, proxy ve sabitlenmiş arama yardımcıları |
    | `plugin-sdk/host-runtime` | Ana makine adı ve SCP ana makine normalleştirme yardımcıları |
    | `plugin-sdk/retry-runtime` | Yeniden deneme yapılandırması ve yeniden deneme çalıştırıcısı yardımcıları |
    | `plugin-sdk/agent-runtime` | Agent dizini/kimlik/çalışma alanı yardımcıları |
    | `plugin-sdk/directory-runtime` | Yapılandırma destekli dizin sorgulama/yineleme kaldırma |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Yetenek ve test alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Paylaşılan medya fetch/dönüştürme/depolama yardımcıları ve medya yükü oluşturucuları |
    | `plugin-sdk/media-generation-runtime` | Paylaşılan medya oluşturma geri dönüş yardımcıları, aday seçimi ve eksik model mesajlaşması |
    | `plugin-sdk/media-understanding` | Medya anlama sağlayıcı türleri ve sağlayıcıya yönelik görsel/ses yardımcı dışa aktarımları |
    | `plugin-sdk/text-runtime` | Asistan tarafından görülebilen metin temizleme, Markdown işleme/parçalama/tablo yardımcıları, sansürleme yardımcıları, directive-tag yardımcıları ve güvenli metin yardımcıları gibi paylaşılan metin/Markdown/günlükleme yardımcıları |
    | `plugin-sdk/text-chunking` | Giden metin parçalama yardımcısı |
    | `plugin-sdk/speech` | Konuşma sağlayıcı türleri ve sağlayıcıya yönelik directive, kayıt defteri ve doğrulama yardımcıları |
    | `plugin-sdk/speech-core` | Paylaşılan konuşma sağlayıcı türleri, kayıt defteri, directive ve normalleştirme yardımcıları |
    | `plugin-sdk/realtime-transcription` | Gerçek zamanlı transkripsiyon sağlayıcı türleri ve kayıt defteri yardımcıları |
    | `plugin-sdk/realtime-voice` | Gerçek zamanlı ses sağlayıcı türleri ve kayıt defteri yardımcıları |
    | `plugin-sdk/image-generation` | Görsel oluşturma sağlayıcı türleri |
    | `plugin-sdk/image-generation-core` | Paylaşılan görsel oluşturma türleri, geri dönüş, kimlik doğrulama ve kayıt defteri yardımcıları |
    | `plugin-sdk/music-generation` | Müzik oluşturma sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/music-generation-core` | Paylaşılan müzik oluşturma türleri, geri dönüş yardımcıları, sağlayıcı arama ve model başvurusu ayrıştırma |
    | `plugin-sdk/video-generation` | Video oluşturma sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/video-generation-core` | Paylaşılan video oluşturma türleri, geri dönüş yardımcıları, sağlayıcı arama ve model başvurusu ayrıştırma |
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
    | `plugin-sdk/memory-core-host-engine-embeddings` | Bellek ana makinesi embedding motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-qmd` | Bellek ana makinesi QMD motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-storage` | Bellek ana makinesi depolama motoru dışa aktarımları |
    | `plugin-sdk/memory-core-host-multimodal` | Bellek ana makinesi multimodal yardımcıları |
    | `plugin-sdk/memory-core-host-query` | Bellek ana makinesi sorgu yardımcıları |
    | `plugin-sdk/memory-core-host-secret` | Bellek ana makinesi gizli yardımcıları |
    | `plugin-sdk/memory-core-host-events` | Bellek ana makinesi olay günlüğü yardımcıları |
    | `plugin-sdk/memory-core-host-status` | Bellek ana makinesi durum yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-cli` | Bellek ana makinesi CLI çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-core` | Bellek ana makinesi çekirdek çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-files` | Bellek ana makinesi dosya/çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-host-core` | Bellek ana makinesi çekirdek çalışma zamanı yardımcıları için satıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-host-events` | Bellek ana makinesi olay günlüğü yardımcıları için satıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-host-files` | Bellek ana makinesi dosya/çalışma zamanı yardımcıları için satıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-host-markdown` | Belleğe bitişik eklentiler için paylaşılan yönetilen-Markdown yardımcıları |
    | `plugin-sdk/memory-host-search` | Arama yöneticisi erişimi için etkin bellek çalışma zamanı cephesi |
    | `plugin-sdk/memory-host-status` | Bellek ana makinesi durum yardımcıları için satıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-lancedb` | Paketlenmiş memory-lancedb yardımcı yüzeyi |
  </Accordion>

  <Accordion title="Ayrılmış paketlenmiş yardımcı alt yollar">
    | Aile | Geçerli alt yollar | Amaçlanan kullanım |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Paketlenmiş browser eklentisi destek yardımcıları (`browser-support` uyumluluk barrel dosyası olarak kalır) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Paketlenmiş Matrix yardımcı/çalışma zamanı yüzeyi |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Paketlenmiş LINE yardımcı/çalışma zamanı yüzeyi |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Paketlenmiş IRC yardımcı yüzeyi |
    | Kanal özelindeki yardımcılar | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Paketlenmiş kanal uyumluluğu/yardımcı yüzeyleri |
    | Kimlik doğrulama/eklenti özelindeki yardımcılar | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Paketlenmiş özellik/eklenti yardımcı yüzeyleri; `plugin-sdk/github-copilot-token` şu anda `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` ve `resolveCopilotApiToken` dışa aktarımlarını sağlar |
  </Accordion>
</AccordionGroup>

## Kayıt API'si

`register(api)` geri çağrısı, şu
yöntemlere sahip bir `OpenClawPluginApi` nesnesi alır:

### Yetenek kaydı

| Yöntem                                           | Kaydettiği şey                     |
| ------------------------------------------------ | ---------------------------------- |
| `api.registerProvider(...)`                      | Metin çıkarımı (LLM)               |
| `api.registerAgentHarness(...)`                  | Deneysel düşük seviyeli agent yürütücüsü |
| `api.registerCliBackend(...)`                    | Yerel CLI çıkarım arka ucu         |
| `api.registerChannel(...)`                       | Mesajlaşma kanalı                  |
| `api.registerSpeechProvider(...)`                | Metinden konuşmaya / STT sentezi   |
| `api.registerRealtimeTranscriptionProvider(...)` | Akışlı gerçek zamanlı transkripsiyon |
| `api.registerRealtimeVoiceProvider(...)`         | Çift yönlü gerçek zamanlı ses oturumları |
| `api.registerMediaUnderstandingProvider(...)`    | Görsel/ses/video analizi           |
| `api.registerImageGenerationProvider(...)`       | Görsel oluşturma                   |
| `api.registerMusicGenerationProvider(...)`       | Müzik oluşturma                    |
| `api.registerVideoGenerationProvider(...)`       | Video oluşturma                    |
| `api.registerWebFetchProvider(...)`              | Web getirme / scrape sağlayıcısı   |
| `api.registerWebSearchProvider(...)`             | Web arama                          |

### Araçlar ve komutlar

| Yöntem                          | Kaydettiği şey                               |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent aracı (zorunlu veya `{ optional: true }`) |
| `api.registerCommand(def)`      | Özel komut (LLM'yi atlar)                    |

### Altyapı

| Yöntem                                         | Kaydettiği şey                         |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Olay kancası                           |
| `api.registerHttpRoute(params)`                | Ağ geçidi HTTP uç noktası              |
| `api.registerGatewayMethod(name, handler)`     | Ağ geçidi RPC yöntemi                  |
| `api.registerCli(registrar, opts?)`            | CLI alt komutu                         |
| `api.registerService(service)`                 | Arka plan hizmeti                      |
| `api.registerInteractiveHandler(registration)` | Etkileşimli işleyici                   |
| `api.registerMemoryPromptSupplement(builder)`  | Toplayıcı bellek-bitişik istem bölümü  |
| `api.registerMemoryCorpusSupplement(adapter)`  | Toplayıcı bellek arama/okuma derlemi   |

Ayrılmış çekirdek yönetici ad alanları (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) bir eklenti daha dar bir ağ geçidi yöntemi kapsamı atamaya çalışsa bile her zaman
`operator.admin` olarak kalır. Eklentiye ait yöntemler için
eklenti özelindeki önekleri tercih edin.

### CLI kayıt meta verisi

`api.registerCli(registrar, opts?)`, iki tür üst düzey meta veri kabul eder:

- `commands`: registrar'a ait açık komut kökleri
- `descriptors`: kök CLI yardımı,
  yönlendirme ve tembel eklenti CLI kaydı için ayrıştırma zamanında kullanılan komut tanımlayıcıları

Bir eklenti komutunun normal kök CLI yolunda tembel yüklü kalmasını istiyorsanız,
o registrar tarafından açığa çıkarılan her üst düzey komut kökünü kapsayan `descriptors`
sağlayın.

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

Yalnızca tembel kök CLI kaydına ihtiyacınız olmadığında `commands` öğesini tek başına kullanın.
Bu istekli uyumluluk yolu desteklenmeye devam eder, ancak ayrıştırma zamanında tembel yükleme için
descriptor destekli yer tutucular kurmaz.

### CLI arka uç kaydı

`api.registerCliBackend(...)`, bir eklentinin `codex-cli` gibi
yerel bir AI CLI arka ucu için varsayılan yapılandırmaya sahip olmasını sağlar.

- Arka uç `id` değeri, `codex-cli/gpt-5` gibi model başvurularında sağlayıcı öneki olur.
- Arka uç `config`, `agents.defaults.cliBackends.<id>` ile aynı şekli kullanır.
- Kullanıcı yapılandırması yine önceliklidir. OpenClaw, CLI'yi çalıştırmadan önce
  `agents.defaults.cliBackends.<id>` değerini eklenti varsayılanı üzerine birleştirir.
- Bir arka ucun birleştirmeden sonra uyumluluk yeniden yazımlarına ihtiyacı varsa
  `normalizeConfig` kullanın (örneğin eski bayrak şekillerini normalleştirmek için).

### Ayrılmış tekil yuvalar

| Yöntem                                     | Kaydettiği şey                                                                                                                                          |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Bağlam motoru (aynı anda yalnızca biri etkindir). `assemble()` geri çağrısı, motorun istem eklemelerini uyarlayabilmesi için `availableTools` ve `citationsMode` alır. |
| `api.registerMemoryCapability(capability)` | Birleşik bellek yeteneği                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Bellek istem bölümü oluşturucusu                                                                                                                        |
| `api.registerMemoryFlushPlan(resolver)`    | Bellek temizleme planı çözümleyicisi                                                                                                                    |
| `api.registerMemoryRuntime(runtime)`       | Bellek çalışma zamanı bağdaştırıcısı                                                                                                                    |

### Bellek embedding bağdaştırıcıları

| Yöntem                                         | Kaydettiği şey                              |
| ---------------------------------------------- | ------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Etkin eklenti için bellek embedding bağdaştırıcısı |

- `registerMemoryCapability`, tercih edilen tekil bellek eklentisi API'sidir.
- `registerMemoryCapability`, eşlik eden eklentilerin dışa aktarılan bellek artifaktlarını
  belirli bir bellek eklentisinin özel yerleşimine erişmek yerine
  `openclaw/plugin-sdk/memory-host-core` üzerinden tüketebilmesi için
  `publicArtifacts.listArtifacts(...)` da açığa çıkarabilir.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` ve
  `registerMemoryRuntime`, eski uyumlu tekil bellek eklentisi API'leridir.
- `registerMemoryEmbeddingProvider`, etkin bellek eklentisinin bir
  veya daha fazla embedding bağdaştırıcısı kimliği kaydetmesine izin verir (örneğin `openai`, `gemini` veya eklenti tanımlı özel bir kimlik).
- `agents.defaults.memorySearch.provider` ve
  `agents.defaults.memorySearch.fallback` gibi kullanıcı yapılandırmaları, kaydedilen bu
  bağdaştırıcı kimliklerine göre çözülür.

### Olaylar ve yaşam döngüsü

| Yöntem                                       | Yaptığı şey                  |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Türlendirilmiş yaşam döngüsü kancası |
| `api.onConversationBindingResolved(handler)` | Konuşma bağlama geri çağrısı |

### Kanca karar semantiği

- `before_tool_call`: `{ block: true }` döndürmek nihaidir. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` döndürmek karar yok olarak değerlendirilir (`block` öğesini atlamakla aynıdır), geçersiz kılma olarak değil.
- `before_install`: `{ block: true }` döndürmek nihaidir. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` döndürmek karar yok olarak değerlendirilir (`block` öğesini atlamakla aynıdır), geçersiz kılma olarak değil.
- `reply_dispatch`: `{ handled: true, ... }` döndürmek nihaidir. Herhangi bir işleyici dağıtımı üstlendiğinde, daha düşük öncelikli işleyiciler ve varsayılan model dağıtım yolu atlanır.
- `message_sending`: `{ cancel: true }` döndürmek nihaidir. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` döndürmek karar yok olarak değerlendirilir (`cancel` öğesini atlamakla aynıdır), geçersiz kılma olarak değil.

### API nesnesi alanları

| Alan                    | Tür                       | Açıklama                                                                                     |
| ----------------------- | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                | `string`                  | Eklenti kimliği                                                                              |
| `api.name`              | `string`                  | Görünen ad                                                                                   |
| `api.version`           | `string?`                 | Eklenti sürümü (isteğe bağlı)                                                                |
| `api.description`       | `string?`                 | Eklenti açıklaması (isteğe bağlı)                                                            |
| `api.source`            | `string`                  | Eklenti kaynak yolu                                                                          |
| `api.rootDir`           | `string?`                 | Eklenti kök dizini (isteğe bağlı)                                                            |
| `api.config`            | `OpenClawConfig`          | Geçerli yapılandırma anlık görüntüsü (varsa etkin bellek içi çalışma zamanı anlık görüntüsü) |
| `api.pluginConfig`      | `Record<string, unknown>` | `plugins.entries.<id>.config` içindeki eklentiye özgü yapılandırma                           |
| `api.runtime`           | `PluginRuntime`           | [Çalışma zamanı yardımcıları](/tr/plugins/sdk-runtime)                                          |
| `api.logger`            | `PluginLogger`            | Kapsamlı logger (`debug`, `info`, `warn`, `error`)                                           |
| `api.registrationMode`  | `PluginRegistrationMode`  | Geçerli yükleme modu; `"setup-runtime"` hafif tam giriş öncesi başlatma/kurulum penceresidir |
| `api.resolvePath(input)` | `(string) => string`     | Yolu eklenti köküne göre çözümler                                                            |

## Dahili modül kuralı

Eklentiniz içinde, dahili içe aktarımlar için yerel barrel dosyaları kullanın:

```
my-plugin/
  api.ts            # Harici kullanıcılar için genel dışa aktarımlar
  runtime-api.ts    # Yalnızca dahili çalışma zamanı dışa aktarımları
  index.ts          # Eklenti giriş noktası
  setup-entry.ts    # Yalnızca hafif kurulum girişi (isteğe bağlı)
```

<Warning>
  Üretim kodunda kendi eklentinizi asla `openclaw/plugin-sdk/<your-plugin>`
  üzerinden içe aktarmayın. Dahili içe aktarımları `./api.ts` veya
  `./runtime-api.ts` üzerinden yönlendirin. SDK yolu yalnızca harici sözleşmedir.
</Warning>

Cephe üzerinden yüklenen paketlenmiş eklenti genel yüzeyleri (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` ve benzeri genel giriş dosyaları), OpenClaw zaten
çalışıyorsa artık etkin çalışma zamanı yapılandırma anlık görüntüsünü tercih eder. Henüz bir çalışma zamanı
anlık görüntüsü yoksa, diskteki çözümlenmiş yapılandırma dosyasına geri dönerler.

Sağlayıcı eklentileri ayrıca, bir yardımcı bilinçli olarak sağlayıcıya özgüyse ve henüz
genel bir SDK alt yoluna ait değilse, dar bir eklenti yerel sözleşme barrel dosyası da açığa çıkarabilir.
Mevcut paketlenmiş örnek: Anthropic sağlayıcısı, Anthropic beta-header ve `service_tier`
mantığını genel bir `plugin-sdk/*` sözleşmesine taşımak yerine
Claude akış yardımcılarını kendi genel `api.ts` / `contract-api.ts` yüzeyinde tutar.

Diğer mevcut paketlenmiş örnekler:

- `@openclaw/openai-provider`: `api.ts`, sağlayıcı oluşturucuları,
  varsayılan model yardımcılarını ve gerçek zamanlı sağlayıcı oluşturucularını dışa aktarır
- `@openclaw/openrouter-provider`: `api.ts`, sağlayıcı oluşturucusunu ve ayrıca
  katılım/yapılandırma yardımcılarını dışa aktarır

<Warning>
  Eklenti üretim kodu ayrıca `openclaw/plugin-sdk/<other-plugin>`
  içe aktarımlarından da kaçınmalıdır. Bir yardımcı gerçekten paylaşılıyorsa, iki eklentiyi birbirine bağlamak yerine
  bunu `openclaw/plugin-sdk/speech`, `.../provider-model-shared` veya başka bir
  yetenek odaklı yüzey gibi nötr bir SDK alt yoluna taşıyın.
</Warning>

## İlgili

- [Giriş Noktaları](/tr/plugins/sdk-entrypoints) — `definePluginEntry` ve `defineChannelPluginEntry` seçenekleri
- [Çalışma Zamanı Yardımcıları](/tr/plugins/sdk-runtime) — tam `api.runtime` ad alanı başvurusu
- [Kurulum ve Yapılandırma](/tr/plugins/sdk-setup) — paketleme, bildirimler, yapılandırma şemaları
- [Test](/tr/plugins/sdk-testing) — test yardımcıları ve lint kuralları
- [SDK Geçişi](/tr/plugins/sdk-migration) — kullanımdan kaldırılmış yüzeylerden geçiş
- [Eklenti Dahili Yapıları](/tr/plugins/architecture) — derin mimari ve yetenek modeli

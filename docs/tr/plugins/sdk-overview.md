---
read_when:
    - Hangi SDK alt yolundan içe aktarma yapmanız gerektiğini bilmeniz gerekiyor
    - OpenClawPluginApi üzerindeki tüm kayıt yöntemleri için bir başvuru istiyorsunuz
    - Belirli bir SDK dışa aktarımını arıyorsunuz
sidebarTitle: SDK Overview
summary: Import eşlemesi, kayıt API başvurusu ve SDK mimarisi
title: Plugin SDK Genel Bakış
x-i18n:
    generated_at: "2026-04-05T14:03:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d7d8b6add0623766d36e81588ae783b525357b2f5245c38c8e2b07c5fc1d2b5
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Plugin SDK Genel Bakış

Plugin SDK, pluginler ile çekirdek arasındaki türlendirilmiş sözleşmedir. Bu sayfa,
**neyin içe aktarılacağını** ve **neleri kaydedebileceğinizi** açıklayan başvuru kaynağıdır.

<Tip>
  **Nasıl yapılır kılavuzu mu arıyorsunuz?**
  - İlk plugininiz mi? [Getting Started](/plugins/building-plugins) ile başlayın
  - Channel plugin mi? [Channel Plugins](/plugins/sdk-channel-plugins) sayfasına bakın
  - Provider plugin mi? [Provider Plugins](/plugins/sdk-provider-plugins) sayfasına bakın
</Tip>

## İçe aktarma kuralı

Her zaman belirli bir alt yoldan içe aktarın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Her alt yol küçük, kendi içinde tamamlanmış bir modüldür. Bu, başlangıcı hızlı tutar
ve dairesel bağımlılık sorunlarını önler. Channel'a özgü giriş/derleme yardımcıları için
`openclaw/plugin-sdk/channel-core` yolunu tercih edin; `openclaw/plugin-sdk/core` yolunu ise
daha geniş şemsiye yüzeyi ve
`buildChannelConfigSchema` gibi paylaşılan yardımcılar için kullanın.

`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` gibi provider adlı kolaylık yüzeylerini
veya channel markalı yardımcı yüzeyleri eklemeyin ya da bunlara bağımlı olmayın.
Paketle gelen pluginler, genel
SDK alt yollarını kendi `api.ts` veya `runtime-api.ts` barrel dosyaları içinde birleştirmelidir; çekirdek ise
ya bu plugin-yerel barrel dosyalarını kullanmalı ya da ihtiyaç gerçekten
kanallar arasıysa dar bir genel SDK
sözleşmesi eklemelidir.

Oluşturulan dışa aktarma eşlemesi hâlâ
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` ve `plugin-sdk/matrix*` gibi küçük bir paketlenmiş-plugin yardımcı
yüzeyi kümesi içerir. Bu
alt yollar yalnızca paketlenmiş-plugin bakımı ve uyumluluk için vardır; aşağıdaki ortak tabloda
bilinçli olarak yer almazlar ve yeni üçüncü taraf pluginler için önerilen
içe aktarma yolu değildir.

## Alt yol başvurusu

Amaçlarına göre gruplandırılmış, en yaygın kullanılan alt yollar. 200+'den fazla alt yol içeren
tam oluşturulmuş liste `scripts/lib/plugin-sdk-entrypoints.json` içinde yer alır.

Ayrılmış paketlenmiş-plugin yardımcı alt yolları yine de bu oluşturulmuş listede görünür.
Bir doküman sayfası bunlardan birini açıkça herkese açık olarak önermedikçe bunları uygulama ayrıntısı/uyumluluk yüzeyleri olarak değerlendirin.

### Plugin girişi

| Alt yol                     | Temel dışa aktarımlar                                                                                                                 |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Channel alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Kök `openclaw.json` Zod şema dışa aktarımı (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ayrıca `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Paylaşılan kurulum sihirbazı yardımcıları, allowlist istemleri, kurulum durumu oluşturucuları |
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
    | `plugin-sdk/channel-config-schema` | Channel yapılandırma şeması türleri |
    | `plugin-sdk/telegram-command-config` | Paketlenmiş-sözleşme geri dönüşüyle Telegram özel komut normalleştirme/doğrulama yardımcıları |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Paylaşılan gelen rota + zarf oluşturucu yardımcıları |
    | `plugin-sdk/inbound-reply-dispatch` | Paylaşılan gelen kaydetme-ve-dağıtım yardımcıları |
    | `plugin-sdk/messaging-targets` | Hedef ayrıştırma/eşleştirme yardımcıları |
    | `plugin-sdk/outbound-media` | Paylaşılan giden medya yükleme yardımcıları |
    | `plugin-sdk/outbound-runtime` | Giden kimlik/gönderim temsilci yardımcıları |
    | `plugin-sdk/thread-bindings-runtime` | İş parçacığı bağlama yaşam döngüsü ve bağdaştırıcı yardımcıları |
    | `plugin-sdk/agent-media-payload` | Eski ajan medya payload oluşturucusu |
    | `plugin-sdk/conversation-runtime` | Konuşma/iş parçacığı bağlama, eşleştirme ve yapılandırılmış bağlama yardımcıları |
    | `plugin-sdk/runtime-config-snapshot` | Runtime yapılandırma anlık görüntü yardımcısı |
    | `plugin-sdk/runtime-group-policy` | Runtime grup ilkesi çözümleme yardımcıları |
    | `plugin-sdk/channel-status` | Paylaşılan channel durum anlık görüntüsü/özet yardımcıları |
    | `plugin-sdk/channel-config-primitives` | Dar channel yapılandırma-şeması ilkel öğeleri |
    | `plugin-sdk/channel-config-writes` | Channel yapılandırma-yazma yetkilendirme yardımcıları |
    | `plugin-sdk/channel-plugin-common` | Paylaşılan channel plugin başlangıç dışa aktarımları |
    | `plugin-sdk/allowlist-config-edit` | Allowlist yapılandırma düzenleme/okuma yardımcıları |
    | `plugin-sdk/group-access` | Paylaşılan grup erişim kararı yardımcıları |
    | `plugin-sdk/direct-dm` | Paylaşılan doğrudan-DM kimlik doğrulama/koruma yardımcıları |
    | `plugin-sdk/interactive-runtime` | Etkileşimli yanıt payload normalleştirme/indirgeme yardımcıları |
    | `plugin-sdk/channel-inbound` | Debounce, bahsetme eşleştirme, zarf yardımcıları |
    | `plugin-sdk/channel-send-result` | Yanıt sonuç türleri |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Hedef ayrıştırma/eşleştirme yardımcıları |
    | `plugin-sdk/channel-contract` | Channel sözleşmesi türleri |
    | `plugin-sdk/channel-feedback` | Geri bildirim/tepki bağlantıları |
  </Accordion>

  <Accordion title="Provider alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Düzenlenmiş yerel/self-hosted provider kurulum yardımcıları |
    | `plugin-sdk/self-hosted-provider-setup` | Odaklanmış OpenAI-uyumlu self-hosted provider kurulum yardımcıları |
    | `plugin-sdk/cli-backend` | CLI backend varsayılanları + watchdog sabitleri |
    | `plugin-sdk/provider-auth-runtime` | Provider pluginleri için runtime API anahtarı çözümleme yardımcıları |
    | `plugin-sdk/provider-auth-api-key` | API anahtarı onboarding/profil yazma yardımcıları |
    | `plugin-sdk/provider-auth-result` | Standart OAuth kimlik doğrulama-sonucu oluşturucusu |
    | `plugin-sdk/provider-auth-login` | Provider pluginleri için paylaşılan etkileşimli giriş yardımcıları |
    | `plugin-sdk/provider-env-vars` | Provider auth ortam değişkeni arama yardımcıları |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan replay-policy oluşturucuları, provider-endpoint yardımcıları ve `normalizeNativeXaiModelId` gibi model-id normalleştirme yardımcıları |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Genel provider HTTP/endpoint yetenek yardımcıları |
    | `plugin-sdk/provider-web-fetch` | Web-fetch provider kayıt/önbellek yardımcıları |
    | `plugin-sdk/provider-web-search` | Web-search provider kayıt/önbellek/yapılandırma yardımcıları |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini şema temizleme + tanılama ve `resolveXaiModelCompatPatch` / `applyXaiModelCompat` gibi xAI uyumluluk yardımcıları |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` ve benzerleri |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri ve paylaşılan Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot sarmalayıcı yardımcıları |
    | `plugin-sdk/provider-onboard` | Onboarding yapılandırma yama yardımcıları |
    | `plugin-sdk/global-singleton` | Süreç-yerel singleton/map/cache yardımcıları |
  </Accordion>

  <Accordion title="Auth ve güvenlik alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, komut kayıt defteri yardımcıları, gönderici yetkilendirme yardımcıları |
    | `plugin-sdk/approval-auth-runtime` | Onaylayıcı çözümleme ve aynı-sohbet eylem-auth yardımcıları |
    | `plugin-sdk/approval-client-runtime` | Yerel exec onay profili/filtre yardımcıları |
    | `plugin-sdk/approval-delivery-runtime` | Yerel onay yeteneği/teslim bağdaştırıcıları |
    | `plugin-sdk/approval-native-runtime` | Yerel onay hedefi + hesap bağlama yardımcıları |
    | `plugin-sdk/approval-reply-runtime` | Exec/plugin onay yanıt payload yardımcıları |
    | `plugin-sdk/command-auth-native` | Yerel komut auth + yerel oturum-hedef yardımcıları |
    | `plugin-sdk/command-detection` | Paylaşılan komut algılama yardımcıları |
    | `plugin-sdk/command-surface` | Komut gövdesi normalleştirme ve komut yüzeyi yardımcıları |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/security-runtime` | Paylaşılan güven, DM kapılama, harici içerik ve gizli bilgi toplama yardımcıları |
    | `plugin-sdk/ssrf-policy` | Ana makine allowlist ve özel ağ SSRF ilkesi yardımcıları |
    | `plugin-sdk/ssrf-runtime` | Sabitlenmiş-dispatcher, SSRF korumalı fetch ve SSRF ilkesi yardımcıları |
    | `plugin-sdk/secret-input` | Gizli girdi ayrıştırma yardımcıları |
    | `plugin-sdk/webhook-ingress` | Webhook istek/hedef yardımcıları |
    | `plugin-sdk/webhook-request-guards` | İstek gövdesi boyutu/zaman aşımı yardımcıları |
  </Accordion>

  <Accordion title="Runtime ve depolama alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/runtime` | Geniş runtime/günlükleme/yedekleme/plugin-kurma yardımcıları |
    | `plugin-sdk/runtime-env` | Dar runtime ortamı, logger, zaman aşımı, retry ve backoff yardımcıları |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Paylaşılan plugin komutu/hook/http/etkileşimli yardımcıları |
    | `plugin-sdk/hook-runtime` | Paylaşılan webhook/internal hook pipeline yardımcıları |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod` ve `createLazyRuntimeSurface` gibi tembel runtime içe aktarma/bağlama yardımcıları |
    | `plugin-sdk/process-runtime` | Süreç exec yardımcıları |
    | `plugin-sdk/cli-runtime` | CLI biçimlendirme, bekleme ve sürüm yardımcıları |
    | `plugin-sdk/gateway-runtime` | Gateway istemcisi ve channel-status yama yardımcıları |
    | `plugin-sdk/config-runtime` | Yapılandırma yükleme/yazma yardımcıları |
    | `plugin-sdk/telegram-command-config` | Paketlenmiş Telegram sözleşme yüzeyi mevcut olmadığında bile Telegram komut adı/açıklama normalleştirme ve yinelenen/çakışma denetimleri |
    | `plugin-sdk/approval-runtime` | Exec/plugin onay yardımcıları, onay-yeteneği oluşturucuları, auth/profil yardımcıları, yerel yönlendirme/runtime yardımcıları |
    | `plugin-sdk/reply-runtime` | Paylaşılan gelen/yanıt runtime yardımcıları, parçalama, dağıtım, heartbeat, yanıt planlayıcı |
    | `plugin-sdk/reply-dispatch-runtime` | Dar yanıt dağıtım/tamamlama yardımcıları |
    | `plugin-sdk/reply-history` | `buildHistoryContext`, `recordPendingHistoryEntry` ve `clearHistoryEntriesIfEnabled` gibi paylaşılan kısa pencere yanıt geçmişi yardımcıları |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Dar metin/markdown parçalama yardımcıları |
    | `plugin-sdk/session-store-runtime` | Oturum deposu yolu + updated-at yardımcıları |
    | `plugin-sdk/state-paths` | Durum/OAuth dizin yolu yardımcıları |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey` ve `resolveDefaultAgentBoundAccountId` gibi rota/oturum anahtarı/hesap bağlama yardımcıları |
    | `plugin-sdk/status-helpers` | Paylaşılan channel/hesap durum özeti yardımcıları, runtime-state varsayılanları ve sorun meta veri yardımcıları |
    | `plugin-sdk/target-resolver-runtime` | Paylaşılan hedef çözümleyici yardımcıları |
    | `plugin-sdk/string-normalization-runtime` | Slug/dizgi normalleştirme yardımcıları |
    | `plugin-sdk/request-url` | Fetch/istek benzeri girdilerden dizgi URL’lerini çıkarın |
    | `plugin-sdk/run-command` | Normalleştirilmiş stdout/stderr sonuçlarıyla zamanlanmış komut çalıştırıcısı |
    | `plugin-sdk/param-readers` | Ortak araç/CLI parametre okuyucuları |
    | `plugin-sdk/tool-send` | Araç argümanlarından standart gönderim hedef alanlarını çıkarın |
    | `plugin-sdk/temp-path` | Paylaşılan geçici indirme yolu yardımcıları |
    | `plugin-sdk/logging-core` | Alt sistem logger ve redaksiyon yardımcıları |
    | `plugin-sdk/markdown-table-runtime` | Markdown tablo modu yardımcıları |
    | `plugin-sdk/json-store` | Küçük JSON durum okuma/yazma yardımcıları |
    | `plugin-sdk/file-lock` | Yeniden girişli dosya kilidi yardımcıları |
    | `plugin-sdk/persistent-dedupe` | Disk destekli yinelenen kaldırma önbelleği yardımcıları |
    | `plugin-sdk/acp-runtime` | ACP runtime/oturum yardımcıları |
    | `plugin-sdk/agent-config-primitives` | Dar ajan runtime yapılandırma-şeması ilkel öğeleri |
    | `plugin-sdk/boolean-param` | Gevşek boole parametre okuyucusu |
    | `plugin-sdk/dangerous-name-runtime` | Tehlikeli ad eşleştirme çözümleme yardımcıları |
    | `plugin-sdk/device-bootstrap` | Cihaz bootstrap ve eşleştirme token yardımcıları |
    | `plugin-sdk/extension-shared` | Paylaşılan pasif-channel ve durum yardımcısı ilkel öğeleri |
    | `plugin-sdk/models-provider-runtime` | `/models` komutu/provider yanıt yardımcıları |
    | `plugin-sdk/skill-commands-runtime` | Skill komut listeleme yardımcıları |
    | `plugin-sdk/native-command-registry` | Yerel komut kayıt defteri/oluşturma/serileştirme yardımcıları |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI endpoint algılama yardımcıları |
    | `plugin-sdk/infra-runtime` | Sistem olayı/heartbeat yardımcıları |
    | `plugin-sdk/collection-runtime` | Küçük sınırlı önbellek yardımcıları |
    | `plugin-sdk/diagnostic-runtime` | Tanılama bayrağı ve olay yardımcıları |
    | `plugin-sdk/error-runtime` | Hata grafiği, biçimlendirme, paylaşılan hata sınıflandırma yardımcıları, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Sarmalanmış fetch, proxy ve sabitlenmiş arama yardımcıları |
    | `plugin-sdk/host-runtime` | Ana makine adı ve SCP ana makinesi normalleştirme yardımcıları |
    | `plugin-sdk/retry-runtime` | Retry yapılandırması ve retry çalıştırıcısı yardımcıları |
    | `plugin-sdk/agent-runtime` | Ajan dizini/kimliği/çalışma alanı yardımcıları |
    | `plugin-sdk/directory-runtime` | Yapılandırma destekli dizin sorgusu/yinelenen kaldırma |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Yetenek ve test alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Paylaşılan medya fetch/dönüştürme/depolama yardımcıları ve medya payload oluşturucuları |
    | `plugin-sdk/media-understanding` | Medya anlama provider türleri ve provider tarafı görüntü/ses yardımcı dışa aktarımları |
    | `plugin-sdk/text-runtime` | Asistan tarafından görülebilen metin kaldırma, markdown render/parçalama/tablo yardımcıları, redaksiyon yardımcıları, directive-tag yardımcıları ve güvenli metin yardımcıları gibi paylaşılan metin/markdown/günlükleme yardımcıları |
    | `plugin-sdk/text-chunking` | Giden metin parçalama yardımcısı |
    | `plugin-sdk/speech` | Speech provider türleri ve provider tarafı directive, kayıt defteri ve doğrulama yardımcıları |
    | `plugin-sdk/speech-core` | Paylaşılan speech provider türleri, kayıt defteri, directive ve normalleştirme yardımcıları |
    | `plugin-sdk/realtime-transcription` | Gerçek zamanlı transcription provider türleri ve kayıt defteri yardımcıları |
    | `plugin-sdk/realtime-voice` | Gerçek zamanlı ses provider türleri ve kayıt defteri yardımcıları |
    | `plugin-sdk/image-generation` | Görüntü üretimi provider türleri |
    | `plugin-sdk/image-generation-core` | Paylaşılan görüntü üretimi türleri, failover, auth ve kayıt defteri yardımcıları |
    | `plugin-sdk/video-generation` | Video üretimi provider/istek/sonuç türleri |
    | `plugin-sdk/video-generation-core` | Paylaşılan video üretimi türleri, failover yardımcıları, provider arama ve model-ref ayrıştırma |
    | `plugin-sdk/webhook-targets` | Webhook hedef kayıt defteri ve rota-kurma yardımcıları |
    | `plugin-sdk/webhook-path` | Webhook yolu normalleştirme yardımcıları |
    | `plugin-sdk/web-media` | Paylaşılan uzak/yerel medya yükleme yardımcıları |
    | `plugin-sdk/zod` | Plugin SDK kullanıcıları için yeniden dışa aktarılan `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Bellek alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/memory-core` | Yönetici/yapılandırma/dosya/CLI yardımcıları için paketlenmiş memory-core yardım yüzeyi |
    | `plugin-sdk/memory-core-engine-runtime` | Bellek dizinleme/arama runtime cephesi |
    | `plugin-sdk/memory-core-host-engine-foundation` | Bellek ana makine foundation engine dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Bellek ana makine embedding engine dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-qmd` | Bellek ana makine QMD engine dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-storage` | Bellek ana makine depolama engine dışa aktarımları |
    | `plugin-sdk/memory-core-host-multimodal` | Bellek ana makine multimodal yardımcıları |
    | `plugin-sdk/memory-core-host-query` | Bellek ana makine sorgu yardımcıları |
    | `plugin-sdk/memory-core-host-secret` | Bellek ana makine gizli bilgi yardımcıları |
    | `plugin-sdk/memory-core-host-status` | Bellek ana makine durum yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-cli` | Bellek ana makine CLI runtime yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-core` | Bellek ana makine çekirdek runtime yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-files` | Bellek ana makine dosya/runtime yardımcıları |
    | `plugin-sdk/memory-lancedb` | Paketlenmiş memory-lancedb yardımcı yüzeyi |
  </Accordion>

  <Accordion title="Ayrılmış paketlenmiş-yardımcı alt yollar">
    | Aile | Geçerli alt yollar | Amaçlanan kullanım |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-config-support`, `plugin-sdk/browser-support` | Paketlenmiş browser plugin destek yardımcıları |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Paketlenmiş Matrix yardımcı/runtime yüzeyi |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Paketlenmiş LINE yardımcı/runtime yüzeyi |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Paketlenmiş IRC yardımcı yüzeyi |
    | Channel'a özgü yardımcılar | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Paketlenmiş channel uyumluluk/yardımcı yüzeyleri |
    | Auth/plugin'e özgü yardımcılar | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Paketlenmiş özellik/plugin yardımcı yüzeyleri; `plugin-sdk/github-copilot-token` şu anda `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` ve `resolveCopilotApiToken` dışa aktarımlarını içerir |
  </Accordion>
</AccordionGroup>

## Kayıt API’si

`register(api)` geri çağrısı, şu yöntemleri içeren bir `OpenClawPluginApi` nesnesi alır:

### Yetenek kaydı

| Yöntem                                           | Kaydettiği şey                  |
| ------------------------------------------------ | ------------------------------- |
| `api.registerProvider(...)`                      | Metin çıkarımı (LLM)            |
| `api.registerCliBackend(...)`                    | Yerel CLI çıkarım backend’i     |
| `api.registerChannel(...)`                       | Mesajlaşma kanalı               |
| `api.registerSpeechProvider(...)`                | Metinden sese / STT sentezi     |
| `api.registerRealtimeTranscriptionProvider(...)` | Akışlı gerçek zamanlı transcription |
| `api.registerRealtimeVoiceProvider(...)`         | Çift yönlü gerçek zamanlı ses oturumları |
| `api.registerMediaUnderstandingProvider(...)`    | Görüntü/ses/video analizi       |
| `api.registerImageGenerationProvider(...)`       | Görüntü üretimi                 |
| `api.registerVideoGenerationProvider(...)`       | Video üretimi                   |
| `api.registerWebFetchProvider(...)`              | Web fetch / scrape provider     |
| `api.registerWebSearchProvider(...)`             | Web arama                       |

### Araçlar ve komutlar

| Yöntem                          | Kaydettiği şey                               |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Ajan aracı (zorunlu veya `{ optional: true }`) |
| `api.registerCommand(def)`      | Özel komut (LLM’yi atlar)                    |

### Altyapı

| Yöntem                                         | Kaydettiği şey      |
| ---------------------------------------------- | ------------------- |
| `api.registerHook(events, handler, opts?)`     | Olay hook’u         |
| `api.registerHttpRoute(params)`                | Gateway HTTP endpoint’i |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC yöntemi |
| `api.registerCli(registrar, opts?)`            | CLI alt komutu      |
| `api.registerService(service)`                 | Arka plan hizmeti   |
| `api.registerInteractiveHandler(registration)` | Etkileşimli işleyici |

Ayrılmış çekirdek yönetici ad alanları (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) bir plugin daha dar bir gateway yöntem kapsamı atamaya çalışsa bile her zaman
`operator.admin` olarak kalır. Plugin’in sahip olduğu yöntemler için
plugin’e özgü önekleri tercih edin.

### CLI kayıt meta verisi

`api.registerCli(registrar, opts?)` iki tür üst seviye meta veri kabul eder:

- `commands`: registrar’ın sahip olduğu açık komut kökleri
- `descriptors`: kök CLI yardımı,
  yönlendirme ve tembel plugin CLI kaydı için ayrıştırma zamanında kullanılan komut tanımlayıcıları

Bir plugin komutunun normal kök CLI yolunda tembel yüklenmiş olarak kalmasını istiyorsanız,
bu registrar tarafından sunulan her üst seviye komut kökünü kapsayan `descriptors` sağlayın.

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

Yalnızca `commands`, normal kök CLI kaydı için tembel yükleme gerekmiyorsa kullanılmalıdır.
Bu istekli uyumluluk yolu desteklenmeye devam eder, ancak ayrıştırma zamanı tembel yükleme için
descriptor destekli yer tutucular kurmaz.

### CLI backend kaydı

`api.registerCliBackend(...)`, bir pluginin `claude-cli` veya `codex-cli` gibi yerel bir
AI CLI backend’i için varsayılan yapılandırmaya sahip olmasını sağlar.

- Backend `id`, `claude-cli/opus` gibi model ref’lerinde provider öneki olur.
- Backend `config`, `agents.defaults.cliBackends.<id>` ile aynı şekli kullanır.
- Kullanıcı yapılandırması yine önceliklidir. OpenClaw, CLI’yi çalıştırmadan önce
  `agents.defaults.cliBackends.<id>` değerini plugin varsayılanının üzerine birleştirir.
- Bir backend, birleştirme sonrası uyumluluk yeniden yazımları gerektiriyorsa
  (örneğin eski bayrak biçimlerini normalleştirmek için) `normalizeConfig` kullanın.

### Ayrılmış yuvalar

| Yöntem                                     | Kaydettiği şey                       |
| ------------------------------------------ | ------------------------------------ |
| `api.registerContextEngine(id, factory)`   | Bağlam motoru (aynı anda bir etkin)  |
| `api.registerMemoryPromptSection(builder)` | Bellek istem bölümü oluşturucusu     |
| `api.registerMemoryFlushPlan(resolver)`    | Bellek flush planı çözümleyicisi     |
| `api.registerMemoryRuntime(runtime)`       | Bellek runtime bağdaştırıcısı        |

### Bellek embedding bağdaştırıcıları

| Yöntem                                         | Kaydettiği şey                                   |
| ---------------------------------------------- | ------------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Etkin plugin için bellek embedding bağdaştırıcısı |

- `registerMemoryPromptSection`, `registerMemoryFlushPlan` ve
  `registerMemoryRuntime`, bellek pluginlerine özeldir.
- `registerMemoryEmbeddingProvider`, etkin bellek plugininin bir
  veya daha fazla embedding bağdaştırıcı kimliği (`openai`, `gemini` veya plugin tarafından tanımlanmış özel bir kimlik gibi) kaydetmesini sağlar.
- `agents.defaults.memorySearch.provider` ve
  `agents.defaults.memorySearch.fallback` gibi kullanıcı yapılandırmaları,
  bu kayıtlı bağdaştırıcı kimliklerine göre çözülür.

### Olaylar ve yaşam döngüsü

| Yöntem                                       | Ne yapar                    |
| -------------------------------------------- | --------------------------- |
| `api.on(hookName, handler, opts?)`           | Türlendirilmiş yaşam döngüsü hook’u |
| `api.onConversationBindingResolved(handler)` | Konuşma bağlama geri çağrısı |

### Hook karar semantiği

- `before_tool_call`: `{ block: true }` döndürmek nihaidir. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` döndürmek bir karar verilmemiş olarak değerlendirilir (`block` alanını hiç vermemekle aynıdır), geçersiz kılma olarak değil.
- `before_install`: `{ block: true }` döndürmek nihaidir. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` döndürmek bir karar verilmemiş olarak değerlendirilir (`block` alanını hiç vermemekle aynıdır), geçersiz kılma olarak değil.
- `message_sending`: `{ cancel: true }` döndürmek nihaidir. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` döndürmek bir karar verilmemiş olarak değerlendirilir (`cancel` alanını hiç vermemekle aynıdır), geçersiz kılma olarak değil.

### API nesnesi alanları

| Alan                    | Tür                       | Açıklama                                                                                           |
| ----------------------- | ------------------------- | -------------------------------------------------------------------------------------------------- |
| `api.id`                | `string`                  | Plugin kimliği                                                                                     |
| `api.name`              | `string`                  | Görünen ad                                                                                         |
| `api.version`           | `string?`                 | Plugin sürümü (isteğe bağlı)                                                                       |
| `api.description`       | `string?`                 | Plugin açıklaması (isteğe bağlı)                                                                   |
| `api.source`            | `string`                  | Plugin kaynak yolu                                                                                 |
| `api.rootDir`           | `string?`                 | Plugin kök dizini (isteğe bağlı)                                                                   |
| `api.config`            | `OpenClawConfig`          | Geçerli yapılandırma anlık görüntüsü (varsa etkin bellek içi runtime anlık görüntüsü)             |
| `api.pluginConfig`      | `Record<string, unknown>` | `plugins.entries.<id>.config` içinden plugin’e özgü yapılandırma                                   |
| `api.runtime`           | `PluginRuntime`           | [Runtime yardımcıları](/plugins/sdk-runtime)                                                       |
| `api.logger`            | `PluginLogger`            | Kapsamlı logger (`debug`, `info`, `warn`, `error`)                                                 |
| `api.registrationMode`  | `PluginRegistrationMode`  | Geçerli yükleme modu; `"setup-runtime"` hafif tam-giriş-öncesi başlangıç/kurulum penceresidir     |
| `api.resolvePath(input)`| `(string) => string`      | Plugin köküne göre yolu çözümle                                                                    |

## Dahili modül kuralı

Plugininiz içinde dahili içe aktarmalar için yerel barrel dosyaları kullanın:

```
my-plugin/
  api.ts            # Harici kullanıcılar için herkese açık dışa aktarımlar
  runtime-api.ts    # Yalnızca dahili runtime dışa aktarımları
  index.ts          # Plugin giriş noktası
  setup-entry.ts    # Yalnızca kurulum için hafif giriş (isteğe bağlı)
```

<Warning>
  Üretim kodunda kendi plugininizi asla
  `openclaw/plugin-sdk/<your-plugin>` üzerinden içe aktarmayın.
  Dahili içe aktarmaları `./api.ts` veya
  `./runtime-api.ts` üzerinden yönlendirin. SDK yolu yalnızca harici sözleşmedir.
</Warning>

Cephe yüklü paketlenmiş plugin herkese açık yüzeyleri (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` ve benzer herkese açık giriş dosyaları),
OpenClaw zaten çalışıyorsa artık etkin runtime yapılandırma anlık görüntüsünü tercih eder.
Henüz runtime anlık görüntüsü yoksa, diskteki çözümlenmiş yapılandırma dosyasına geri dönerler.

Provider pluginleri ayrıca, bir yardımcı bilinçli olarak provider’a özgüyse ve henüz
genel bir SDK alt yoluna ait değilse dar bir plugin-yerel sözleşme barrel dosyası da sunabilir.
Mevcut paketlenmiş örnek: Anthropic provider, Claude
akış yardımcılarını, Anthropic beta-header ve `service_tier` mantığını genel bir
`plugin-sdk/*` sözleşmesine yükseltmek yerine kendi herkese açık `api.ts` / `contract-api.ts` yüzeyinde tutar.

Diğer güncel paketlenmiş örnekler:

- `@openclaw/openai-provider`: `api.ts`, provider oluşturucularını,
  varsayılan model yardımcılarını ve gerçek zamanlı provider oluşturucularını dışa aktarır
- `@openclaw/openrouter-provider`: `api.ts`, provider oluşturucusunu ve
  onboarding/yapılandırma yardımcılarını dışa aktarır

<Warning>
  Extension üretim kodu da `openclaw/plugin-sdk/<other-plugin>`
  içe aktarmalarından kaçınmalıdır. Bir yardımcı gerçekten paylaşılıyorsa, iki plugini birbirine bağlamak yerine onu
  `openclaw/plugin-sdk/speech`, `.../provider-model-shared` veya başka
  bir yetenek odaklı yüzey gibi tarafsız bir SDK alt yoluna yükseltin.
</Warning>

## İlgili

- [Entry Points](/plugins/sdk-entrypoints) — `definePluginEntry` ve `defineChannelPluginEntry` seçenekleri
- [Runtime Helpers](/plugins/sdk-runtime) — tam `api.runtime` ad alanı başvurusu
- [Setup and Config](/plugins/sdk-setup) — paketleme, manifestler, yapılandırma şemaları
- [Testing](/plugins/sdk-testing) — test yardımcıları ve lint kuralları
- [SDK Migration](/plugins/sdk-migration) — kullanımdan kaldırılmış yüzeylerden geçiş
- [Plugin Internals](/plugins/architecture) — derin mimari ve yetenek modeli

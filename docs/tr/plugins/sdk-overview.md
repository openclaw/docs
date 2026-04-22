---
read_when:
    - Hangi SDK alt yolundan içe aktarma yapmanız gerektiğini bilmeniz gerekiyor
    - OpenClawPluginApi üzerindeki tüm kayıt yöntemleri için bir başvuru istiyorsunuz
    - Belirli bir SDK dışa aktarımını arıyorsunuz
sidebarTitle: SDK Overview
summary: İçe aktarma eşlemesi, kayıt API başvurusu ve SDK mimarisi
title: Plugin SDK Genel Bakışı
x-i18n:
    generated_at: "2026-04-22T04:25:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8045c11976bbda6afe3303a0aab08caf0d0a86ebcf1aaaf927943b90cc517673
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Plugin SDK Genel Bakışı

Plugin SDK, plugin'ler ile çekirdek arasındaki türlenmiş sözleşmedir. Bu sayfa,
**neyi içe aktarmanız gerektiği** ve **neyi kaydedebileceğiniz** için başvurudur.

<Tip>
  **Nasıl yapılır kılavuzu mu arıyorsunuz?**
  - İlk plugin mi? [Getting Started](/tr/plugins/building-plugins) ile başlayın
  - Kanal plugin'i mi? [Channel Plugins](/tr/plugins/sdk-channel-plugins) bölümüne bakın
  - Sağlayıcı plugin'i mi? [Provider Plugins](/tr/plugins/sdk-provider-plugins) bölümüne bakın
</Tip>

## İçe aktarma kuralı

Her zaman belirli bir alt yoldan içe aktarın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Her alt yol küçük, kendi içinde yeterli bir modüldür. Bu, başlangıcı hızlı tutar
ve döngüsel bağımlılık sorunlarını önler. Kanala özgü giriş/oluşturma yardımcıları için
`openclaw/plugin-sdk/channel-core` tercih edin; daha geniş şemsiye yüzeyi ve
`buildChannelConfigSchema` gibi paylaşılan yardımcılar için
`openclaw/plugin-sdk/core` kullanın.

`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` gibi
sağlayıcı adlı kolaylık arayüzleri veya kanal markalı yardımcı arayüzleri eklemeyin ve bunlara
bağımlı olmayın. Paketlenmiş plugin'ler kendi `api.ts` veya `runtime-api.ts`
barrel dosyaları içinde genel SDK alt yollarını birleştirmelidir; çekirdek ise
ya bu plugin-yerel barrel dosyalarını kullanmalı ya da ihtiyaç gerçekten kanallar arasıysa dar bir genel SDK
sözleşmesi eklemelidir.

Oluşturulan dışa aktarma eşlemesi hâlâ `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` ve `plugin-sdk/matrix*` gibi küçük bir
paketlenmiş-plugin yardımcı arayüzleri kümesi içerir. Bu
alt yollar yalnızca paketlenmiş-plugin bakımı ve uyumluluğu için vardır; aşağıdaki ortak tabloda kasıtlı olarak
atlanırlar ve yeni üçüncü taraf plugin'ler için önerilen içe aktarma yolu değildir.

## Alt yol başvurusu

En yaygın kullanılan alt yollar, amaçlarına göre gruplandırılmıştır. Oluşturulan tam
200+'den fazla alt yol listesi `scripts/lib/plugin-sdk-entrypoints.json` içinde bulunur.

Ayrılmış paketlenmiş-plugin yardımcı alt yolları bu oluşturulan listede yine görünür.
Bir belge sayfası açıkça birini genel olarak öne çıkarmadıkça bunları uygulama ayrıntısı/uyumluluk yüzeyleri olarak değerlendirin.

### Plugin girişi

| Alt yol                     | Temel dışa aktarımlar                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                  |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                     |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                    |

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
    | `plugin-sdk/account-core` | Çok hesaplı yapılandırma/eylem geçidi yardımcıları, varsayılan hesap geri dönüş yardımcıları |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, hesap kimliği normalleştirme yardımcıları |
    | `plugin-sdk/account-resolution` | Hesap arama + varsayılan geri dönüş yardımcıları |
    | `plugin-sdk/account-helpers` | Dar hesap listesi/hesap eylemi yardımcıları |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Kanal yapılandırma şeması türleri |
    | `plugin-sdk/telegram-command-config` | Paketlenmiş sözleşme geri dönüşü ile Telegram özel komut normalleştirme/doğrulama yardımcıları |
    | `plugin-sdk/command-gating` | Dar komut yetkilendirme geçidi yardımcıları |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, taslak akış yaşam döngüsü/nihai hâle getirme yardımcıları |
    | `plugin-sdk/inbound-envelope` | Paylaşılan gelen yönlendirme + zarf oluşturucu yardımcıları |
    | `plugin-sdk/inbound-reply-dispatch` | Paylaşılan gelen kaydetme ve dağıtma yardımcıları |
    | `plugin-sdk/messaging-targets` | Hedef ayrıştırma/eşleme yardımcıları |
    | `plugin-sdk/outbound-media` | Paylaşılan giden medya yükleme yardımcıları |
    | `plugin-sdk/outbound-runtime` | Giden kimlik, gönderim temsilcisi ve yük planlama yardımcıları |
    | `plugin-sdk/poll-runtime` | Dar anket normalleştirme yardımcıları |
    | `plugin-sdk/thread-bindings-runtime` | Konu bağlama yaşam döngüsü ve bağdaştırıcı yardımcıları |
    | `plugin-sdk/agent-media-payload` | Eski aracı medya yükü oluşturucusu |
    | `plugin-sdk/conversation-runtime` | Konuşma/konu bağlama, eşleme ve yapılandırılmış bağlama yardımcıları |
    | `plugin-sdk/runtime-config-snapshot` | Çalışma zamanı yapılandırma anlık görüntüsü yardımcısı |
    | `plugin-sdk/runtime-group-policy` | Çalışma zamanı grup ilkesi çözümleme yardımcıları |
    | `plugin-sdk/channel-status` | Paylaşılan kanal durum anlık görüntüsü/özet yardımcıları |
    | `plugin-sdk/channel-config-primitives` | Dar kanal yapılandırma şeması ilkel öğeleri |
    | `plugin-sdk/channel-config-writes` | Kanal yapılandırma yazma yetkilendirme yardımcıları |
    | `plugin-sdk/channel-plugin-common` | Paylaşılan kanal plugin başlangıç dışa aktarımları |
    | `plugin-sdk/allowlist-config-edit` | İzin listesi yapılandırma düzenleme/okuma yardımcıları |
    | `plugin-sdk/group-access` | Paylaşılan grup erişimi karar yardımcıları |
    | `plugin-sdk/direct-dm` | Paylaşılan doğrudan DM kimlik doğrulama/koruma yardımcıları |
    | `plugin-sdk/interactive-runtime` | Anlamsal mesaj sunumu, teslimat ve eski etkileşimli yanıt yardımcıları. Bkz. [Message Presentation](/tr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Gelen debounce, bahsetme eşleme, mention-policy yardımcıları ve zarf yardımcıları için uyumluluk barrel dosyası |
    | `plugin-sdk/channel-mention-gating` | Daha geniş gelen çalışma zamanı yüzeyi olmadan dar mention-policy yardımcıları |
    | `plugin-sdk/channel-location` | Kanal konum bağlamı ve biçimlendirme yardımcıları |
    | `plugin-sdk/channel-logging` | Gelen düşüşler ve yazıyor/ack hataları için kanal günlükleme yardımcıları |
    | `plugin-sdk/channel-send-result` | Yanıt sonuç türleri |
    | `plugin-sdk/channel-actions` | Kanal mesaj eylemi yardımcıları, ayrıca plugin uyumluluğu için tutulan kullanımdan kaldırılmış yerel şema yardımcıları |
    | `plugin-sdk/channel-targets` | Hedef ayrıştırma/eşleme yardımcıları |
    | `plugin-sdk/channel-contract` | Kanal sözleşmesi türleri |
    | `plugin-sdk/channel-feedback` | Geri bildirim/tepki bağlantıları |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` ve gizli hedef türleri gibi dar gizli sözleşme yardımcıları |
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
    | `plugin-sdk/provider-env-vars` | Sağlayıcı kimlik doğrulama ortam değişkeni arama yardımcıları |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, paylaşılan replay-policy oluşturucuları, sağlayıcı uç nokta yardımcıları ve `normalizeNativeXaiModelId` gibi model kimliği normalleştirme yardımcıları |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Genel sağlayıcı HTTP/uç nokta yetenek yardımcıları |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` ve `WebFetchProviderPlugin` gibi dar web-fetch yapılandırma/seçim sözleşme yardımcıları |
    | `plugin-sdk/provider-web-fetch` | Web-fetch sağlayıcı kayıt/önbellek yardımcıları |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin etkinleştirme bağlantısına ihtiyaç duymayan sağlayıcılar için dar web-search yapılandırma/kimlik bilgisi yardımcıları |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` ve kapsamlı kimlik bilgisi ayarlayıcıları/getter'ları gibi dar web-search yapılandırma/kimlik bilgisi sözleşme yardımcıları |
    | `plugin-sdk/provider-web-search` | Web-search sağlayıcı kayıt/önbellek/çalışma zamanı yardımcıları |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini şema temizleme + tanılama ve `resolveXaiModelCompatPatch` / `applyXaiModelCompat` gibi xAI uyumluluk yardımcıları |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` ve benzerleri |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, akış sarmalayıcı türleri ve paylaşılan Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot sarmalayıcı yardımcıları |
    | `plugin-sdk/provider-transport-runtime` | Korunan fetch, taşıma mesajı dönüşümleri ve yazılabilir taşıma olay akışları gibi yerel sağlayıcı taşıma yardımcıları |
    | `plugin-sdk/provider-onboard` | Onboarding yapılandırma yama yardımcıları |
    | `plugin-sdk/global-singleton` | Süreç-yerel singleton/map/önbellek yardımcıları |
  </Accordion>

  <Accordion title="Kimlik doğrulama ve güvenlik alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, komut kayıt defteri yardımcıları, gönderen yetkilendirme yardımcıları |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` ve `buildHelpMessage` gibi komut/yardım mesajı oluşturucuları |
    | `plugin-sdk/approval-auth-runtime` | Onaylayan çözümleme ve aynı sohbet eylem kimlik doğrulama yardımcıları |
    | `plugin-sdk/approval-client-runtime` | Yerel exec onay profili/filtre yardımcıları |
    | `plugin-sdk/approval-delivery-runtime` | Yerel onay yeteneği/teslimat bağdaştırıcıları |
    | `plugin-sdk/approval-gateway-runtime` | Paylaşılan onay gateway çözümleme yardımcısı |
    | `plugin-sdk/approval-handler-adapter-runtime` | Sıcak kanal giriş noktaları için hafif yerel onay bağdaştırıcısı yükleme yardımcıları |
    | `plugin-sdk/approval-handler-runtime` | Daha geniş onay işleyici çalışma zamanı yardımcıları; dar bağdaştırıcı/gateway arayüzleri yeterliyse onları tercih edin |
    | `plugin-sdk/approval-native-runtime` | Yerel onay hedefi + hesap bağlama yardımcıları |
    | `plugin-sdk/approval-reply-runtime` | Exec/plugin onay yanıt yükü yardımcıları |
    | `plugin-sdk/command-auth-native` | Yerel komut kimlik doğrulama + yerel oturum hedef yardımcısı |
    | `plugin-sdk/command-detection` | Paylaşılan komut algılama yardımcıları |
    | `plugin-sdk/command-surface` | Komut gövdesi normalleştirme ve komut yüzeyi yardımcıları |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Kanal/plugin gizli bilgi yüzeyleri için dar gizli sözleşme toplama yardımcıları |
    | `plugin-sdk/secret-ref-runtime` | Gizli sözleşme/yapılandırma ayrıştırması için dar `coerceSecretRef` ve SecretRef türleme yardımcıları |
    | `plugin-sdk/security-runtime` | Paylaşılan güven, DM geçitlemesi, harici içerik ve gizli bilgi toplama yardımcıları |
    | `plugin-sdk/ssrf-policy` | Ana makine izin listesi ve özel ağ SSRF ilke yardımcıları |
    | `plugin-sdk/ssrf-dispatcher` | Geniş altyapı çalışma zamanı yüzeyi olmadan dar sabitlenmiş dağıtıcı yardımcıları |
    | `plugin-sdk/ssrf-runtime` | Sabitlenmiş dağıtıcı, SSRF korumalı fetch ve SSRF ilke yardımcıları |
    | `plugin-sdk/secret-input` | Gizli bilgi girdisi ayrıştırma yardımcıları |
    | `plugin-sdk/webhook-ingress` | Webhook istek/hedef yardımcıları |
    | `plugin-sdk/webhook-request-guards` | İstek gövdesi boyutu/zaman aşımı yardımcıları |
  </Accordion>

  <Accordion title="Çalışma zamanı ve depolama alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/runtime` | Geniş çalışma zamanı/günlükleme/yedekleme/plugin yükleme yardımcıları |
    | `plugin-sdk/runtime-env` | Dar çalışma zamanı ortamı, günlükleyici, zaman aşımı, yeniden deneme ve backoff yardımcıları |
    | `plugin-sdk/channel-runtime-context` | Genel kanal çalışma zamanı bağlamı kaydı ve arama yardımcıları |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Paylaşılan plugin komutu/hook/http/etkileşimli yardımcıları |
    | `plugin-sdk/hook-runtime` | Paylaşılan Webhook/dahili hook işlem hattı yardımcıları |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod` ve `createLazyRuntimeSurface` gibi tembel çalışma zamanı içe aktarma/bağlama yardımcıları |
    | `plugin-sdk/process-runtime` | Süreç exec yardımcıları |
    | `plugin-sdk/cli-runtime` | CLI biçimlendirme, bekleme ve sürüm yardımcıları |
    | `plugin-sdk/gateway-runtime` | Gateway istemcisi ve kanal durumu yama yardımcıları |
    | `plugin-sdk/config-runtime` | Yapılandırma yükleme/yazma yardımcıları |
    | `plugin-sdk/telegram-command-config` | Paketlenmiş Telegram sözleşme yüzeyi kullanılamadığında bile Telegram komut adı/açıklama normalleştirme ve kopya/çakışma denetimleri |
    | `plugin-sdk/text-autolink-runtime` | Geniş text-runtime barrel dosyası olmadan dosya başvurusu otomatik bağlantı algılama |
    | `plugin-sdk/approval-runtime` | Exec/plugin onay yardımcıları, onay yeteneği oluşturucuları, kimlik doğrulama/profil yardımcıları, yerel yönlendirme/çalışma zamanı yardımcıları |
    | `plugin-sdk/reply-runtime` | Paylaşılan gelen/yanıt çalışma zamanı yardımcıları, parçalama, dağıtma, Heartbeat, yanıt planlayıcısı |
    | `plugin-sdk/reply-dispatch-runtime` | Dar yanıt dağıtma/nihai hâle getirme yardımcıları |
    | `plugin-sdk/reply-history` | `buildHistoryContext`, `recordPendingHistoryEntry` ve `clearHistoryEntriesIfEnabled` gibi paylaşılan kısa pencere yanıt geçmişi yardımcıları |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Dar metin/markdown parçalama yardımcıları |
    | `plugin-sdk/session-store-runtime` | Oturum deposu yolu + updated-at yardımcıları |
    | `plugin-sdk/state-paths` | State/OAuth dizin yolu yardımcıları |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey` ve `resolveDefaultAgentBoundAccountId` gibi yönlendirme/oturum anahtarı/hesap bağlama yardımcıları |
    | `plugin-sdk/status-helpers` | Paylaşılan kanal/hesap durum özeti yardımcıları, çalışma zamanı durum varsayılanları ve sorun meta verisi yardımcıları |
    | `plugin-sdk/target-resolver-runtime` | Paylaşılan hedef çözümleyici yardımcıları |
    | `plugin-sdk/string-normalization-runtime` | Slug/dize normalleştirme yardımcıları |
    | `plugin-sdk/request-url` | Fetch/istek benzeri girdilerden dize URL'leri ayıklama |
    | `plugin-sdk/run-command` | Normalize edilmiş stdout/stderr sonuçlarıyla zamanlamalı komut çalıştırıcısı |
    | `plugin-sdk/param-readers` | Yaygın araç/CLI parametre okuyucuları |
    | `plugin-sdk/tool-payload` | Araç sonuç nesnelerinden normalize yükleri ayıklama |
    | `plugin-sdk/tool-send` | Araç bağımsız değişkenlerinden kanonik gönderim hedef alanlarını ayıklama |
    | `plugin-sdk/temp-path` | Paylaşılan geçici indirme yolu yardımcıları |
    | `plugin-sdk/logging-core` | Alt sistem günlükleyicisi ve kırpma yardımcıları |
    | `plugin-sdk/markdown-table-runtime` | Markdown tablo modu yardımcıları |
    | `plugin-sdk/json-store` | Küçük JSON durumu okuma/yazma yardımcıları |
    | `plugin-sdk/file-lock` | Yeniden girişli dosya kilidi yardımcıları |
    | `plugin-sdk/persistent-dedupe` | Disk destekli dedupe önbellek yardımcıları |
    | `plugin-sdk/acp-runtime` | ACP çalışma zamanı/oturumu ve yanıt dağıtma yardımcıları |
    | `plugin-sdk/acp-binding-resolve-runtime` | Yaşam döngüsü başlangıç içe aktarımları olmadan salt okunur ACP bağlama çözümleme |
    | `plugin-sdk/agent-config-primitives` | Dar aracı çalışma zamanı yapılandırma şeması ilkel öğeleri |
    | `plugin-sdk/boolean-param` | Gevşek boolean parametre okuyucusu |
    | `plugin-sdk/dangerous-name-runtime` | Tehlikeli ad eşleme çözümleme yardımcıları |
    | `plugin-sdk/device-bootstrap` | Cihaz bootstrap ve eşleme belirteci yardımcıları |
    | `plugin-sdk/extension-shared` | Paylaşılan pasif kanal, durum ve ambient proxy yardımcı ilkel öğeleri |
    | `plugin-sdk/models-provider-runtime` | `/models` komutu/sağlayıcı yanıt yardımcıları |
    | `plugin-sdk/skill-commands-runtime` | Skills komut listeleme yardımcıları |
    | `plugin-sdk/native-command-registry` | Yerel komut kayıt defteri/oluşturma/serileştirme yardımcıları |
    | `plugin-sdk/agent-harness` | Düşük düzey aracı harness'leri için deneysel güvenilir plugin yüzeyi: harness türleri, etkin çalıştırma yönlendirme/abort yardımcıları, OpenClaw araç köprüsü yardımcıları ve deneme sonucu yardımcıları |
    | `plugin-sdk/provider-zai-endpoint` | Z.A.I uç nokta algılama yardımcıları |
    | `plugin-sdk/infra-runtime` | Sistem olayı/Heartbeat yardımcıları |
    | `plugin-sdk/collection-runtime` | Küçük sınırlı önbellek yardımcıları |
    | `plugin-sdk/diagnostic-runtime` | Tanılama bayrağı ve olay yardımcıları |
    | `plugin-sdk/error-runtime` | Hata grafiği, biçimlendirme, paylaşılan hata sınıflandırma yardımcıları, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Sarılmış fetch, proxy ve sabitlenmiş arama yardımcıları |
    | `plugin-sdk/runtime-fetch` | Proxy/korumalı-fetch içe aktarımları olmadan dağıtıcı farkındalıklı çalışma zamanı fetch |
    | `plugin-sdk/response-limit-runtime` | Geniş medya çalışma zamanı yüzeyi olmadan sınırlı yanıt gövdesi okuyucusu |
    | `plugin-sdk/session-binding-runtime` | Yapılandırılmış bağlama yönlendirmesi veya eşleme depoları olmadan mevcut konuşma bağlama durumu |
    | `plugin-sdk/session-store-runtime` | Geniş yapılandırma yazma/bakım içe aktarımları olmadan oturum deposu okuma yardımcıları |
    | `plugin-sdk/context-visibility-runtime` | Geniş yapılandırma/güvenlik içe aktarımları olmadan bağlam görünürlüğü çözümleme ve ek bağlam filtreleme |
    | `plugin-sdk/string-coerce-runtime` | Markdown/günlükleme içe aktarımları olmadan dar ilkel kayıt/dize zorlama ve normalleştirme yardımcıları |
    | `plugin-sdk/host-runtime` | Ana makine adı ve SCP ana makine normalleştirme yardımcıları |
    | `plugin-sdk/retry-runtime` | Yeniden deneme yapılandırması ve yeniden deneme çalıştırıcı yardımcıları |
    | `plugin-sdk/agent-runtime` | Aracı dizini/kimlik/çalışma alanı yardımcıları |
    | `plugin-sdk/directory-runtime` | Yapılandırma destekli dizin sorgulama/dedupe |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Yetenek ve test alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Medya yükü oluşturucularına ek olarak paylaşılan medya fetch/dönüştürme/depolama yardımcıları |
    | `plugin-sdk/media-generation-runtime` | Paylaşılan medya oluşturma geri dönüş yardımcıları, aday seçimi ve eksik model mesajlaşması |
    | `plugin-sdk/media-understanding` | Medya anlama sağlayıcı türleri ile sağlayıcıya dönük görsel/ses yardımcı dışa aktarımları |
    | `plugin-sdk/text-runtime` | Aracı tarafından görülebilen metin temizleme, markdown oluşturma/parçalama/tablo yardımcıları, kırpma yardımcıları, yönerge etiketi yardımcıları ve güvenli metin yardımcıları gibi paylaşılan metin/markdown/günlükleme yardımcıları |
    | `plugin-sdk/text-chunking` | Giden metin parçalama yardımcısı |
    | `plugin-sdk/speech` | Konuşma sağlayıcı türleri ile sağlayıcıya dönük yönerge, kayıt defteri ve doğrulama yardımcıları |
    | `plugin-sdk/speech-core` | Paylaşılan konuşma sağlayıcı türleri, kayıt defteri, yönerge ve normalleştirme yardımcıları |
    | `plugin-sdk/realtime-transcription` | Gerçek zamanlı transkripsiyon sağlayıcı türleri ve kayıt defteri yardımcıları |
    | `plugin-sdk/realtime-voice` | Gerçek zamanlı ses sağlayıcı türleri ve kayıt defteri yardımcıları |
    | `plugin-sdk/image-generation` | Görsel oluşturma sağlayıcı türleri |
    | `plugin-sdk/image-generation-core` | Paylaşılan görsel oluşturma türleri, geri dönüş, kimlik doğrulama ve kayıt defteri yardımcıları |
    | `plugin-sdk/music-generation` | Müzik oluşturma sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/music-generation-core` | Paylaşılan müzik oluşturma türleri, geri dönüş yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
    | `plugin-sdk/video-generation` | Video oluşturma sağlayıcı/istek/sonuç türleri |
    | `plugin-sdk/video-generation-core` | Paylaşılan video oluşturma türleri, geri dönüş yardımcıları, sağlayıcı arama ve model-ref ayrıştırma |
    | `plugin-sdk/webhook-targets` | Webhook hedef kayıt defteri ve rota yükleme yardımcıları |
    | `plugin-sdk/webhook-path` | Webhook yol normalleştirme yardımcıları |
    | `plugin-sdk/web-media` | Paylaşılan uzak/yerel medya yükleme yardımcıları |
    | `plugin-sdk/zod` | Plugin SDK kullanıcıları için yeniden dışa aktarılan `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Memory alt yolları">
    | Alt yol | Temel dışa aktarımlar |
    | --- | --- |
    | `plugin-sdk/memory-core` | Yönetici/yapılandırma/dosya/CLI yardımcıları için paketlenmiş memory-core yardımcı yüzeyi |
    | `plugin-sdk/memory-core-engine-runtime` | Memory dizin/arama çalışma zamanı cephesi |
    | `plugin-sdk/memory-core-host-engine-foundation` | Memory host foundation engine dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Memory host embedding sözleşmeleri, kayıt defteri erişimi, yerel sağlayıcı ve genel toplu/uzak yardımcılar |
    | `plugin-sdk/memory-core-host-engine-qmd` | Memory host QMD engine dışa aktarımları |
    | `plugin-sdk/memory-core-host-engine-storage` | Memory host storage engine dışa aktarımları |
    | `plugin-sdk/memory-core-host-multimodal` | Memory host multimodal yardımcıları |
    | `plugin-sdk/memory-core-host-query` | Memory host sorgu yardımcıları |
    | `plugin-sdk/memory-core-host-secret` | Memory host gizli bilgi yardımcıları |
    | `plugin-sdk/memory-core-host-events` | Memory host olay günlüğü yardımcıları |
    | `plugin-sdk/memory-core-host-status` | Memory host durum yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-cli` | Memory host CLI çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-core` | Memory host çekirdek çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-core-host-runtime-files` | Memory host dosya/çalışma zamanı yardımcıları |
    | `plugin-sdk/memory-host-core` | Memory host çekirdek çalışma zamanı yardımcıları için sağlayıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-host-events` | Memory host olay günlüğü yardımcıları için sağlayıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-host-files` | Memory host dosya/çalışma zamanı yardımcıları için sağlayıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-host-markdown` | Memory'ye komşu plugin'ler için paylaşılan yönetilen-markdown yardımcıları |
    | `plugin-sdk/memory-host-search` | Arama yöneticisi erişimi için Active Memory çalışma zamanı cephesi |
    | `plugin-sdk/memory-host-status` | Memory host durum yardımcıları için sağlayıcıdan bağımsız takma ad |
    | `plugin-sdk/memory-lancedb` | Paketlenmiş memory-lancedb yardımcı yüzeyi |
  </Accordion>

  <Accordion title="Ayrılmış paketlenmiş yardımcı alt yolları">
    | Aile | Geçerli alt yollar | Amaçlanan kullanım |
    | --- | --- | --- |
    | Tarayıcı | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Paketlenmiş tarayıcı plugin desteği yardımcıları (`browser-support` uyumluluk barrel dosyası olarak kalır) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Paketlenmiş Matrix yardımcı/çalışma zamanı yüzeyi |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Paketlenmiş LINE yardımcı/çalışma zamanı yüzeyi |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Paketlenmiş IRC yardımcı yüzeyi |
    | Kanala özgü yardımcılar | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Paketlenmiş kanal uyumluluk/yardımcı arayüzleri |
    | Kimlik doğrulama/plugin'e özgü yardımcılar | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Paketlenmiş özellik/plugin yardımcı arayüzleri; `plugin-sdk/github-copilot-token` şu anda `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` ve `resolveCopilotApiToken` dışa aktarır |
  </Accordion>
</AccordionGroup>

## Kayıt API'si

`register(api)` geri çağrısı, şu yöntemlere sahip bir `OpenClawPluginApi` nesnesi alır:

### Yetenek kaydı

| Yöntem                                           | Kaydettiği şey                       |
| ------------------------------------------------ | ------------------------------------ |
| `api.registerProvider(...)`                      | Metin çıkarımı (LLM)                 |
| `api.registerAgentHarness(...)`                  | Deneysel düşük düzey aracı yürütücüsü |
| `api.registerCliBackend(...)`                    | Yerel CLI çıkarım arka ucu           |
| `api.registerChannel(...)`                       | Mesajlaşma kanalı                    |
| `api.registerSpeechProvider(...)`                | Metinden konuşmaya / STT sentezi     |
| `api.registerRealtimeTranscriptionProvider(...)` | Akış gerçek zamanlı transkripsiyon   |
| `api.registerRealtimeVoiceProvider(...)`         | Çift yönlü gerçek zamanlı ses oturumları |
| `api.registerMediaUnderstandingProvider(...)`    | Görsel/ses/video analizi             |
| `api.registerImageGenerationProvider(...)`       | Görsel oluşturma                     |
| `api.registerMusicGenerationProvider(...)`       | Müzik oluşturma                      |
| `api.registerVideoGenerationProvider(...)`       | Video oluşturma                      |
| `api.registerWebFetchProvider(...)`              | Web getirme / kazıma sağlayıcısı     |
| `api.registerWebSearchProvider(...)`             | Web arama                            |

### Araçlar ve komutlar

| Yöntem                          | Kaydettiği şey                                 |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Aracı aracı (zorunlu veya `{ optional: true }`) |
| `api.registerCommand(def)`      | Özel komut (LLM'yi atlar)                      |

### Altyapı

| Yöntem                                         | Kaydettiği şey                          |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Olay hook'u                             |
| `api.registerHttpRoute(params)`                | Gateway HTTP uç noktası                 |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC yöntemi                     |
| `api.registerCli(registrar, opts?)`            | CLI alt komutu                          |
| `api.registerService(service)`                 | Arka plan hizmeti                       |
| `api.registerInteractiveHandler(registration)` | Etkileşimli işleyici                    |
| `api.registerMemoryPromptSupplement(builder)`  | Eklemeli memory-komşu istem bölümü      |
| `api.registerMemoryCorpusSupplement(adapter)`  | Eklemeli memory arama/okuma korpusu     |

Ayrılmış çekirdek yönetici ad alanları (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`), bir plugin daha dar bir gateway yöntem kapsamı atamaya çalışsa bile,
her zaman `operator.admin` olarak kalır. Plugin'e ait yöntemler için
plugin'e özgü önekleri tercih edin.

### CLI kayıt meta verileri

`api.registerCli(registrar, opts?)`, iki tür üst düzey meta veriyi kabul eder:

- `commands`: registrar'ın sahip olduğu açık komut kökleri
- `descriptors`: kök CLI yardımı,
  yönlendirme ve tembel plugin CLI kaydı için ayrıştırma zamanı komut tanımlayıcıları

Bir plugin komutunun normal kök CLI yolunda tembel yüklenmesini istiyorsanız,
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
        description: "Matrix hesaplarını, doğrulamayı, cihazları ve profil durumunu yönet",
        hasSubcommands: true,
      },
    ],
  },
);
```

Yalnızca tembel kök CLI kaydına ihtiyacınız yoksa `commands` alanını tek başına kullanın.
Bu hevesli uyumluluk yolu desteklenmeye devam eder, ancak ayrıştırma zamanı tembel yükleme için
tanımlayıcı destekli yer tutucular yüklemez.

### CLI arka uç kaydı

`api.registerCliBackend(...)`, bir plugin'in `codex-cli` gibi yerel bir
AI CLI arka ucu için varsayılan yapılandırmaya sahip olmasına izin verir.

- Arka uç `id` değeri, `codex-cli/gpt-5` gibi model başvurularında sağlayıcı öneki olur.
- Arka uç `config`, `agents.defaults.cliBackends.<id>` ile aynı şekli kullanır.
- Kullanıcı yapılandırması yine kazanır. OpenClaw, CLI'yi çalıştırmadan önce
  plugin varsayılanı üzerine `agents.defaults.cliBackends.<id>` değerini birleştirir.
- Bir arka uç birleştirmeden sonra uyumluluk yeniden yazımları gerektiriyorsa
  (örneğin eski bayrak biçimlerini normalleştirmek gibi) `normalizeConfig` kullanın.

### Özel yuvalar

| Yöntem                                     | Kaydettiği şey                                                                                                                                              |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Bağlam motoru (aynı anda bir etkin). `assemble()` geri çağrısı `availableTools` ve `citationsMode` alır; böylece motor istem eklerini buna göre uyarlayabilir. |
| `api.registerMemoryCapability(capability)` | Birleşik memory yeteneği                                                                                                                                    |
| `api.registerMemoryPromptSection(builder)` | Memory istem bölümü oluşturucusu                                                                                                                            |
| `api.registerMemoryFlushPlan(resolver)`    | Memory boşaltma planı çözümleyicisi                                                                                                                         |
| `api.registerMemoryRuntime(runtime)`       | Memory çalışma zamanı bağdaştırıcısı                                                                                                                        |

### Memory embedding bağdaştırıcıları

| Yöntem                                         | Kaydettiği şey                               |
| ---------------------------------------------- | -------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Etkin plugin için Memory embedding bağdaştırıcısı |

- `registerMemoryCapability`, tercih edilen özel memory-plugin API'sidir.
- `registerMemoryCapability`, eşlik eden plugin'lerin dışa aktarılan memory çıktılarını
  belirli bir memory plugin'in özel düzenine uzanmak yerine
  `openclaw/plugin-sdk/memory-host-core` üzerinden tüketebilmesi için
  `publicArtifacts.listArtifacts(...)` de gösterebilir.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` ve
  `registerMemoryRuntime`, eski uyumlu özel memory-plugin API'leridir.
- `registerMemoryEmbeddingProvider`, etkin memory plugin'in bir
  veya daha fazla embedding bağdaştırıcı kimliği (örneğin `openai`, `gemini` veya özel
  bir plugin tanımlı kimlik) kaydetmesine izin verir.
- `agents.defaults.memorySearch.provider` ve
  `agents.defaults.memorySearch.fallback` gibi kullanıcı yapılandırmaları, kayıtlı bu
  bağdaştırıcı kimliklerine göre çözülür.

### Olaylar ve yaşam döngüsü

| Yöntem                                       | Yaptığı şey                 |
| -------------------------------------------- | --------------------------- |
| `api.on(hookName, handler, opts?)`           | Türlenmiş yaşam döngüsü hook'u |
| `api.onConversationBindingResolved(handler)` | Konuşma bağlama geri çağrısı |

### Hook karar anlambilimi

- `before_tool_call`: `{ block: true }` döndürmek terminaldir. Herhangi bir işleyici bunu ayarladığında daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` döndürmek karar verilmemiş sayılır (`block` alanını hiç vermemekle aynıdır), geçersiz kılma değildir.
- `before_install`: `{ block: true }` döndürmek terminaldir. Herhangi bir işleyici bunu ayarladığında daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` döndürmek karar verilmemiş sayılır (`block` alanını hiç vermemekle aynıdır), geçersiz kılma değildir.
- `reply_dispatch`: `{ handled: true, ... }` döndürmek terminaldir. Herhangi bir işleyici gönderimi üstlendiğinde daha düşük öncelikli işleyiciler ve varsayılan model gönderim yolu atlanır.
- `message_sending`: `{ cancel: true }` döndürmek terminaldir. Herhangi bir işleyici bunu ayarladığında daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` döndürmek karar verilmemiş sayılır (`cancel` alanını hiç vermemekle aynıdır), geçersiz kılma değildir.

### API nesnesi alanları

| Alan                     | Tür                       | Açıklama                                                                                     |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin kimliği                                                                               |
| `api.name`               | `string`                  | Görünen ad                                                                                   |
| `api.version`            | `string?`                 | Plugin sürümü (isteğe bağlı)                                                                 |
| `api.description`        | `string?`                 | Plugin açıklaması (isteğe bağlı)                                                             |
| `api.source`             | `string`                  | Plugin kaynak yolu                                                                           |
| `api.rootDir`            | `string?`                 | Plugin kök dizini (isteğe bağlı)                                                             |
| `api.config`             | `OpenClawConfig`          | Geçerli yapılandırma anlık görüntüsü (varsa etkin bellek içi çalışma zamanı anlık görüntüsü) |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` içindeki plugin'e özgü yapılandırma                            |
| `api.runtime`            | `PluginRuntime`           | [Runtime yardımcıları](/tr/plugins/sdk-runtime)                                                 |
| `api.logger`             | `PluginLogger`            | Kapsamlı günlükleyici (`debug`, `info`, `warn`, `error`)                                     |
| `api.registrationMode`   | `PluginRegistrationMode`  | Geçerli yükleme modu; `"setup-runtime"` tam giriş öncesi hafif başlangıç/kurulum penceresidir |
| `api.resolvePath(input)` | `(string) => string`      | Yolu plugin köküne göre çözümle                                                              |

## Dahili modül kuralı

Plugin'iniz içinde, dahili içe aktarmalar için yerel barrel dosyaları kullanın:

```
my-plugin/
  api.ts            # Harici kullanıcılar için genel dışa aktarımlar
  runtime-api.ts    # Yalnızca dahili çalışma zamanı dışa aktarımları
  index.ts          # Plugin giriş noktası
  setup-entry.ts    # Hafif yalnızca kurulum girişi (isteğe bağlı)
```

<Warning>
  Üretim kodunda kendi plugin'inizi asla `openclaw/plugin-sdk/<your-plugin>`
  üzerinden içe aktarmayın. Dahili içe aktarmaları `./api.ts` veya
  `./runtime-api.ts` üzerinden yönlendirin. SDK yolu yalnızca harici sözleşmedir.
</Warning>

Facade ile yüklenen paketlenmiş plugin genel yüzeyleri (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` ve benzer genel giriş dosyaları) artık OpenClaw zaten
çalışıyorsa etkin çalışma zamanı yapılandırma anlık görüntüsünü tercih eder. Henüz çalışma zamanı
anlık görüntüsü yoksa disk üzerindeki çözülmüş yapılandırma dosyasına geri dönerler.

Sağlayıcı plugin'leri, bir yardımcı kasıtlı olarak sağlayıcıya özgüyse ve henüz genel bir SDK
alt yoluna ait değilse dar bir plugin-yerel sözleşme barrel dosyası da gösterebilir. Geçerli paketlenmiş örnek:
Anthropic sağlayıcısı Claude akış yardımcılarını, Anthropic beta-header ve `service_tier`
mantığını genel bir `plugin-sdk/*` sözleşmesine taşımak yerine kendi genel `api.ts` / `contract-api.ts`
arayüzünde tutar.

Diğer geçerli paketlenmiş örnekler:

- `@openclaw/openai-provider`: `api.ts`, sağlayıcı oluşturucularını,
  varsayılan model yardımcılarını ve gerçek zamanlı sağlayıcı oluşturucularını dışa aktarır
- `@openclaw/openrouter-provider`: `api.ts`, sağlayıcı oluşturucusunu ve
  onboarding/yapılandırma yardımcılarını dışa aktarır

<Warning>
  Uzantı üretim kodu ayrıca `openclaw/plugin-sdk/<other-plugin>`
  içe aktarımlarından kaçınmalıdır. Bir yardımcı gerçekten paylaşılıyorsa iki plugin'i birbirine bağlamak yerine
  bunu `openclaw/plugin-sdk/speech`, `.../provider-model-shared` veya başka
  bir yetenek odaklı yüzey gibi nötr bir SDK alt yoluna taşıyın.
</Warning>

## İlgili

- [Entry Points](/tr/plugins/sdk-entrypoints) — `definePluginEntry` ve `defineChannelPluginEntry` seçenekleri
- [Runtime Helpers](/tr/plugins/sdk-runtime) — tam `api.runtime` ad alanı başvurusu
- [Setup and Config](/tr/plugins/sdk-setup) — paketleme, manifest'ler, yapılandırma şemaları
- [Testing](/tr/plugins/sdk-testing) — test yardımcıları ve lint kuralları
- [SDK Migration](/tr/plugins/sdk-migration) — kullanımdan kaldırılmış yüzeylerden geçiş
- [Plugin Internals](/tr/plugins/architecture) — derin mimari ve yetenek modeli

---
read_when:
    - Memilih subpath plugin-sdk yang tepat untuk import Plugin
    - Mengaudit subpath Plugin bawaan dan permukaan helper
summary: 'Katalog subpath SDK Plugin: impor mana berada di mana, dikelompokkan per area'
title: Subpath SDK Plugin
x-i18n:
    generated_at: "2026-04-24T09:21:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20b923e392b3ec65cfc958ccc7452b52d82bc372ae57cc9becad74a5085ed71b
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  SDK Plugin diekspos sebagai sekumpulan subpath sempit di bawah `openclaw/plugin-sdk/`.
  Halaman ini mengatalogkan subpath yang umum digunakan, dikelompokkan berdasarkan tujuan. Daftar lengkap
  200+ subpath yang dihasilkan berada di `scripts/lib/plugin-sdk-entrypoints.json`;
  subpath helper Plugin bawaan yang dicadangkan muncul di sana tetapi merupakan detail
  implementasi kecuali sebuah halaman dokumen secara eksplisit mempromosikannya.

  Untuk panduan penulisan Plugin, lihat [Ikhtisar SDK Plugin](/id/plugins/sdk-overview).

  ## Entri Plugin

  | Subpath                     | Ekspor kunci                                                                                                                             |
  | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                      |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`   |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                         |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                        |

  <AccordionGroup>
  <Accordion title="Subpath kanal">
    | Subpath | Ekspor kunci |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Ekspor skema Zod root `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper wizard setup bersama, prompt allowlist, builder status setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper config/action-gate multi-akun, helper fallback akun default |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper normalisasi account-id |
    | `plugin-sdk/account-resolution` | Helper pencarian akun + fallback default |
    | `plugin-sdk/account-helpers` | Helper sempit daftar-akun/tindakan-akun |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipe skema konfigurasi kanal |
    | `plugin-sdk/telegram-command-config` | Helper normalisasi/validasi custom-command Telegram dengan fallback kontrak bawaan |
    | `plugin-sdk/command-gating` | Helper gate otorisasi perintah sempit |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, helper lifecycle/finalisasi draft stream |
    | `plugin-sdk/inbound-envelope` | Helper pembangun rute + envelope inbound bersama |
    | `plugin-sdk/inbound-reply-dispatch` | Helper pencatatan-dan-dispatch inbound bersama |
    | `plugin-sdk/messaging-targets` | Helper parsing/pencocokan target |
    | `plugin-sdk/outbound-media` | Helper pemuatan media outbound bersama |
    | `plugin-sdk/outbound-runtime` | Helper identitas outbound, delegasi pengiriman, dan perencanaan payload |
    | `plugin-sdk/poll-runtime` | Helper normalisasi poll sempit |
    | `plugin-sdk/thread-bindings-runtime` | Helper lifecycle dan adapter thread-binding |
    | `plugin-sdk/agent-media-payload` | Builder payload media agen lama |
    | `plugin-sdk/conversation-runtime` | Helper binding percakapan/thread, pairing, dan configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshot konfigurasi runtime |
    | `plugin-sdk/runtime-group-policy` | Helper resolusi kebijakan grup runtime |
    | `plugin-sdk/channel-status` | Helper snapshot/ringkasan status kanal bersama |
    | `plugin-sdk/channel-config-primitives` | Primitive skema konfigurasi kanal sempit |
    | `plugin-sdk/channel-config-writes` | Helper otorisasi penulisan konfigurasi kanal |
    | `plugin-sdk/channel-plugin-common` | Ekspor prelude Plugin kanal bersama |
    | `plugin-sdk/allowlist-config-edit` | Helper edit/baca konfigurasi allowlist |
    | `plugin-sdk/group-access` | Helper keputusan akses grup bersama |
    | `plugin-sdk/direct-dm` | Helper auth/guard DM langsung bersama |
    | `plugin-sdk/interactive-runtime` | Presentasi pesan semantik, pengiriman, dan helper balasan interaktif legacy. Lihat [Presentasi Pesan](/id/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel kompatibilitas untuk helper debounce inbound, pencocokan mention, kebijakan mention, dan envelope |
    | `plugin-sdk/channel-inbound-debounce` | Helper debounce inbound sempit |
    | `plugin-sdk/channel-mention-gating` | Helper kebijakan mention dan teks mention sempit tanpa permukaan runtime inbound yang lebih luas |
    | `plugin-sdk/channel-envelope` | Helper pemformatan envelope inbound sempit |
    | `plugin-sdk/channel-location` | Helper konteks dan pemformatan lokasi kanal |
    | `plugin-sdk/channel-logging` | Helper logging kanal untuk inbound drop dan kegagalan typing/ack |
    | `plugin-sdk/channel-send-result` | Tipe hasil balasan |
    | `plugin-sdk/channel-actions` | Helper tindakan pesan kanal, plus helper skema native deprecated yang dipertahankan untuk kompatibilitas Plugin |
    | `plugin-sdk/channel-targets` | Helper parsing/pencocokan target |
    | `plugin-sdk/channel-contract` | Tipe kontrak kanal |
    | `plugin-sdk/channel-feedback` | Wiring feedback/reaksi |
    | `plugin-sdk/channel-secret-runtime` | Helper kontrak secret sempit seperti `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, dan tipe target secret |
  </Accordion>

  <Accordion title="Subpath provider">
    | Subpath | Ekspor kunci |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helper setup provider lokal/self-hosted yang dikurasi |
    | `plugin-sdk/self-hosted-provider-setup` | Helper setup provider self-hosted fokus yang kompatibel dengan OpenAI |
    | `plugin-sdk/cli-backend` | Default backend CLI + konstanta watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper resolusi API key runtime untuk Provider Plugin |
    | `plugin-sdk/provider-auth-api-key` | Helper onboarding/penulisan profil API key seperti `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder hasil auth OAuth standar |
    | `plugin-sdk/provider-auth-login` | Helper login interaktif bersama untuk Provider Plugin |
    | `plugin-sdk/provider-env-vars` | Helper pencarian env-var auth provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder kebijakan replay bersama, helper endpoint provider, dan helper normalisasi model-id seperti `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper kapabilitas HTTP/endpoint provider generik, termasuk helper form multipart transkripsi audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper kontrak konfigurasi/pemilihan web-fetch sempit seperti `enablePluginInConfig` dan `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper pendaftaran/cache provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper konfigurasi/kredensial web-search sempit untuk provider yang tidak memerlukan wiring pengaktifan Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper kontrak konfigurasi/kredensial web-search sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial bercakupan |
    | `plugin-sdk/provider-web-search` | Helper pendaftaran/cache/runtime provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pembersihan skema Gemini + diagnostik, dan helper kompatibilitas xAI seperti `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` dan sejenisnya |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe pembungkus stream, dan helper pembungkus bersama Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helper transport provider native seperti guarded fetch, transform pesan transport, dan stream event transport yang dapat ditulis |
    | `plugin-sdk/provider-onboard` | Helper patch konfigurasi onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/cache lokal-proses |
    | `plugin-sdk/group-activation` | Helper mode aktivasi grup dan parsing perintah yang sempit |
  </Accordion>

  <Accordion title="Subpath auth dan keamanan">
    | Subpath | Ekspor kunci |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper registry perintah, helper otorisasi pengirim |
    | `plugin-sdk/command-status` | Builder pesan perintah/help seperti `buildCommandsMessagePaginated` dan `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Resolusi approver dan helper auth tindakan chat-yang-sama |
    | `plugin-sdk/approval-client-runtime` | Helper profil/filter persetujuan exec native |
    | `plugin-sdk/approval-delivery-runtime` | Adapter kapabilitas/pengiriman persetujuan native |
    | `plugin-sdk/approval-gateway-runtime` | Helper resolusi gateway persetujuan bersama |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper pemuatan adapter persetujuan native ringan untuk entrypoint kanal panas |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime handler persetujuan yang lebih luas; utamakan seam adapter/gateway yang lebih sempit bila sudah cukup |
    | `plugin-sdk/approval-native-runtime` | Helper target persetujuan native + binding akun |
    | `plugin-sdk/approval-reply-runtime` | Helper payload balasan persetujuan exec/Plugin |
    | `plugin-sdk/reply-dedupe` | Helper reset dedupe balasan inbound yang sempit |
    | `plugin-sdk/channel-contract-testing` | Helper uji kontrak kanal yang sempit tanpa barrel testing yang luas |
    | `plugin-sdk/command-auth-native` | Helper auth perintah native + target sesi native |
    | `plugin-sdk/command-detection` | Helper deteksi perintah bersama |
    | `plugin-sdk/command-primitives-runtime` | Predikat teks perintah ringan untuk jalur kanal panas |
    | `plugin-sdk/command-surface` | Helper normalisasi body perintah dan permukaan perintah |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper pengumpulan kontrak secret yang sempit untuk permukaan secret kanal/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper sempit `coerceSecretRef` dan typing SecretRef untuk parsing kontrak secret/konfigurasi |
    | `plugin-sdk/security-runtime` | Helper trust, gating DM, konten eksternal, dan pengumpulan secret bersama |
    | `plugin-sdk/ssrf-policy` | Helper allowlist host dan kebijakan SSRF jaringan privat |
    | `plugin-sdk/ssrf-dispatcher` | Helper dispatcher pinned yang sempit tanpa permukaan runtime infra yang luas |
    | `plugin-sdk/ssrf-runtime` | Helper dispatcher pinned, fetch ber-guard SSRF, dan kebijakan SSRF |
    | `plugin-sdk/secret-input` | Helper parsing input secret |
    | `plugin-sdk/webhook-ingress` | Helper permintaan/target Webhook |
    | `plugin-sdk/webhook-request-guards` | Helper ukuran body permintaan/timeout |
  </Accordion>

  <Accordion title="Subpath runtime dan penyimpanan">
    | Subpath | Ekspor kunci |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper runtime/logging/backup/instalasi Plugin yang luas |
    | `plugin-sdk/runtime-env` | Helper env runtime, logger, timeout, retry, dan backoff yang sempit |
    | `plugin-sdk/channel-runtime-context` | Helper pendaftaran dan pencarian konteks runtime kanal generik |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper perintah/hook/http/interaktif Plugin bersama |
    | `plugin-sdk/hook-runtime` | Helper pipeline Webhook/hook internal bersama |
    | `plugin-sdk/lazy-runtime` | Helper import/binding runtime lazy seperti `createLazyRuntimeModule`, `createLazyRuntimeMethod`, dan `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper exec proses |
    | `plugin-sdk/cli-runtime` | Helper pemformatan CLI, wait, dan versi |
    | `plugin-sdk/gateway-runtime` | Helper klien Gateway dan patch status kanal |
    | `plugin-sdk/config-runtime` | Helper pemuatan/penulisan konfigurasi dan helper pencarian konfigurasi Plugin |
    | `plugin-sdk/telegram-command-config` | Normalisasi nama/deskripsi perintah Telegram dan pemeriksaan duplikat/konflik, bahkan saat permukaan kontrak Telegram bawaan tidak tersedia |
    | `plugin-sdk/text-autolink-runtime` | Deteksi autolink referensi file tanpa barrel text-runtime yang luas |
    | `plugin-sdk/approval-runtime` | Helper persetujuan exec/Plugin, builder kapabilitas persetujuan, helper auth/profil, helper perutean/runtime native |
    | `plugin-sdk/reply-runtime` | Helper runtime inbound/balasan bersama, chunking, dispatch, Heartbeat, perencana balasan |
    | `plugin-sdk/reply-dispatch-runtime` | Helper sempit dispatch/finalisasi balasan dan label percakapan |
    | `plugin-sdk/reply-history` | Helper riwayat balasan jendela pendek bersama seperti `buildHistoryContext`, `recordPendingHistoryEntry`, dan `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper chunking teks/Markdown sempit |
    | `plugin-sdk/session-store-runtime` | Helper path penyimpanan sesi + updated-at |
    | `plugin-sdk/state-paths` | Helper path direktori state/OAuth |
    | `plugin-sdk/routing` | Helper binding rute/sesi/account seperti `resolveAgentRoute`, `buildAgentSessionKey`, dan `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper ringkasan status kanal/akun bersama, default runtime-state, dan helper metadata issue |
    | `plugin-sdk/target-resolver-runtime` | Helper resolver target bersama |
    | `plugin-sdk/string-normalization-runtime` | Helper normalisasi slug/string |
    | `plugin-sdk/request-url` | Ekstrak URL string dari input mirip fetch/request |
    | `plugin-sdk/run-command` | Runner perintah bertiming dengan hasil stdout/stderr ternormalisasi |
    | `plugin-sdk/param-readers` | Pembaca parameter alat/CLI umum |
    | `plugin-sdk/tool-payload` | Ekstrak payload ternormalisasi dari objek hasil alat |
    | `plugin-sdk/tool-send` | Ekstrak field target pengiriman kanonis dari arg alat |
    | `plugin-sdk/temp-path` | Helper path unduhan sementara bersama |
    | `plugin-sdk/logging-core` | Helper logger subsistem dan redaksi |
    | `plugin-sdk/markdown-table-runtime` | Helper mode dan konversi tabel Markdown |
    | `plugin-sdk/json-store` | Helper kecil baca/tulis state JSON |
    | `plugin-sdk/file-lock` | Helper file-lock re-entrant |
    | `plugin-sdk/persistent-dedupe` | Helper cache dedupe berbasis disk |
    | `plugin-sdk/acp-runtime` | Helper runtime/sesi ACP dan reply-dispatch |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolusi binding ACP hanya-baca tanpa import startup lifecycle |
    | `plugin-sdk/agent-config-primitives` | Primitive skema konfigurasi runtime agen yang sempit |
    | `plugin-sdk/boolean-param` | Pembaca parameter boolean longgar |
    | `plugin-sdk/dangerous-name-runtime` | Helper resolusi pencocokan nama berbahaya |
    | `plugin-sdk/device-bootstrap` | Helper bootstrap perangkat dan token pairing |
    | `plugin-sdk/extension-shared` | Primitive helper pasif-kanal, status, dan ambient proxy bersama |
    | `plugin-sdk/models-provider-runtime` | Helper balasan perintah/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helper daftar perintah skill |
    | `plugin-sdk/native-command-registry` | Helper registry/build/serialize perintah native |
    | `plugin-sdk/agent-harness` | Permukaan Plugin tepercaya eksperimental untuk harness agen tingkat rendah: tipe harness, helper steer/abort eksekusi aktif, helper bridge alat OpenClaw, helper pemformatan/detail progres alat, dan utilitas hasil percobaan |
    | `plugin-sdk/provider-zai-endpoint` | Helper deteksi endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Helper system event/Heartbeat |
    | `plugin-sdk/collection-runtime` | Helper cache bounded kecil |
    | `plugin-sdk/diagnostic-runtime` | Helper flag dan peristiwa diagnostik |
    | `plugin-sdk/error-runtime` | Graph error, pemformatan, helper klasifikasi error bersama, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helper fetch terbungkus, proxy, dan pencarian pinned |
    | `plugin-sdk/runtime-fetch` | Runtime fetch sadar-dispatcher tanpa import proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Pembaca body respons bounded tanpa permukaan media runtime yang luas |
    | `plugin-sdk/session-binding-runtime` | State binding percakapan saat ini tanpa perutean configured binding atau penyimpanan pairing |
    | `plugin-sdk/session-store-runtime` | Helper baca session-store tanpa import penulisan/pemeliharaan konfigurasi yang luas |
    | `plugin-sdk/context-visibility-runtime` | Resolusi visibilitas konteks dan pemfilteran konteks tambahan tanpa import konfigurasi/keamanan yang luas |
    | `plugin-sdk/string-coerce-runtime` | Helper sempit coercion dan normalisasi record/string primitif tanpa import Markdown/logging |
    | `plugin-sdk/host-runtime` | Helper normalisasi hostname dan host SCP |
    | `plugin-sdk/retry-runtime` | Helper konfigurasi retry dan runner retry |
    | `plugin-sdk/agent-runtime` | Helper agent dir/identity/workspace |
    | `plugin-sdk/directory-runtime` | Query/dedupe direktori yang didukung konfigurasi |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpath kapabilitas dan pengujian">
    | Subpath | Ekspor kunci |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper bersama fetch/transform/store media plus builder payload media |
    | `plugin-sdk/media-store` | Helper media store sempit seperti `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helper failover media-generation bersama, pemilihan kandidat, dan pesan model yang hilang |
    | `plugin-sdk/media-understanding` | Tipe provider pemahaman media plus ekspor helper gambar/audio yang berhadapan dengan provider |
    | `plugin-sdk/text-runtime` | Helper bersama teks/Markdown/logging seperti penghapusan teks yang terlihat asisten, helper render/chunking/tabel Markdown, helper redaksi, helper directive-tag, dan utilitas teks aman |
    | `plugin-sdk/text-chunking` | Helper chunking teks outbound |
    | `plugin-sdk/speech` | Tipe provider speech plus helper directive, registry, dan validasi yang berhadapan dengan provider |
    | `plugin-sdk/speech-core` | Helper bersama tipe provider speech, registry, directive, dan normalisasi |
    | `plugin-sdk/realtime-transcription` | Tipe provider transkripsi realtime, helper registry, dan helper sesi WebSocket bersama |
    | `plugin-sdk/realtime-voice` | Tipe provider voice realtime dan helper registry |
    | `plugin-sdk/image-generation` | Tipe provider pembuatan gambar |
    | `plugin-sdk/image-generation-core` | Helper bersama tipe image-generation, failover, auth, dan registry |
    | `plugin-sdk/music-generation` | Tipe provider/permintaan/hasil pembuatan musik |
    | `plugin-sdk/music-generation-core` | Helper bersama tipe music-generation, failover, pencarian provider, dan parsing model-ref |
    | `plugin-sdk/video-generation` | Tipe provider/permintaan/hasil pembuatan video |
    | `plugin-sdk/video-generation-core` | Helper bersama tipe video-generation, failover, pencarian provider, dan parsing model-ref |
    | `plugin-sdk/webhook-targets` | Helper registry target Webhook dan instalasi rute |
    | `plugin-sdk/webhook-path` | Helper normalisasi path Webhook |
    | `plugin-sdk/web-media` | Helper bersama pemuatan media remote/lokal |
    | `plugin-sdk/zod` | Re-export `zod` untuk konsumen SDK Plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subpath memori">
    | Subpath | Ekspor kunci |
    | --- | --- |
    | `plugin-sdk/memory-core` | Permukaan helper memory-core bawaan untuk helper manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facade runtime indeks/pencarian memori |
    | `plugin-sdk/memory-core-host-engine-foundation` | Ekspor engine fondasi host memori |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrak embedding host memori, akses registry, provider lokal, dan helper batch/remote generik |
    | `plugin-sdk/memory-core-host-engine-qmd` | Ekspor engine QMD host memori |
    | `plugin-sdk/memory-core-host-engine-storage` | Ekspor engine storage host memori |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodal host memori |
    | `plugin-sdk/memory-core-host-query` | Helper query host memori |
    | `plugin-sdk/memory-core-host-secret` | Helper secret host memori |
    | `plugin-sdk/memory-core-host-events` | Helper jurnal peristiwa host memori |
    | `plugin-sdk/memory-core-host-status` | Helper status host memori |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI host memori |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime inti host memori |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host memori |
    | `plugin-sdk/memory-host-core` | Alias vendor-netral untuk helper runtime inti host memori |
    | `plugin-sdk/memory-host-events` | Alias vendor-netral untuk helper jurnal peristiwa host memori |
    | `plugin-sdk/memory-host-files` | Alias vendor-netral untuk helper file/runtime host memori |
    | `plugin-sdk/memory-host-markdown` | Helper managed-Markdown bersama untuk Plugin yang berdekatan dengan memori |
    | `plugin-sdk/memory-host-search` | Facade runtime Active Memory untuk akses search-manager |
    | `plugin-sdk/memory-host-status` | Alias vendor-netral untuk helper status host memori |
    | `plugin-sdk/memory-lancedb` | Permukaan helper memory-lancedb bawaan |
  </Accordion>

  <Accordion title="Subpath helper bawaan yang dicadangkan">
    | Family | Subpath saat ini | Penggunaan yang dimaksud |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helper dukungan Plugin browser bawaan (`browser-support` tetap menjadi compatibility barrel) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Permukaan helper/runtime Matrix bawaan |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Permukaan helper/runtime LINE bawaan |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Permukaan helper IRC bawaan |
    | Helper khusus kanal | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seam kompatibilitas/helper kanal bawaan |
    | Helper khusus auth/Plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seam helper fitur/Plugin bawaan; `plugin-sdk/github-copilot-token` saat ini mengekspor `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, dan `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Terkait

- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview)
- [Penyiapan SDK Plugin](/id/plugins/sdk-setup)
- [Membangun Plugin](/id/plugins/building-plugins)

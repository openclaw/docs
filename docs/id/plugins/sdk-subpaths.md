---
read_when:
    - Memilih subpath plugin-sdk yang tepat untuk import Plugin
    - Mengaudit subpath Plugin bawaan dan surface helper
summary: 'Katalog subpath SDK Plugin: import mana berada di mana, dikelompokkan berdasarkan area'
title: Subpath SDK Plugin
x-i18n:
    generated_at: "2026-04-26T11:36:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcb49ee51301b79985d43470cd8c149c858e79d685908605317de253121d4736
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  SDK Plugin diekspos sebagai kumpulan subpath sempit di bawah `openclaw/plugin-sdk/`.
  Halaman ini membuat katalog subpath yang umum digunakan, dikelompokkan berdasarkan tujuan. Daftar lengkap 200+ subpath yang dihasilkan ada di `scripts/lib/plugin-sdk-entrypoints.json`;
  subpath helper Plugin bawaan yang dicadangkan muncul di sana tetapi merupakan
  detail implementasi kecuali halaman dokumen secara eksplisit mempromosikannya.

  Untuk panduan penulisan Plugin, lihat [Ikhtisar SDK Plugin](/id/plugins/sdk-overview).

  ## Entri Plugin

  | Subpath                     | Ekspor utama                                                                                                                            |
  | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

  <AccordionGroup>
  <Accordion title="Subpath channel">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Ekspor schema Zod root `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ditambah `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper wizard setup bersama, prompt allowlist, builder status setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper multi-akun config/action-gate, helper fallback akun default |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper normalisasi account-id |
    | `plugin-sdk/account-resolution` | Helper lookup akun + fallback default |
    | `plugin-sdk/account-helpers` | Helper sempit account-list/account-action |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipe schema config channel |
    | `plugin-sdk/telegram-command-config` | Helper normalisasi/validasi perintah kustom Telegram dengan fallback kontrak bawaan |
    | `plugin-sdk/command-gating` | Helper authorization gate perintah yang sempit |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, helper siklus hidup/finalisasi draft stream |
    | `plugin-sdk/inbound-envelope` | Helper route inbound + builder envelope bersama |
    | `plugin-sdk/inbound-reply-dispatch` | Helper record-and-dispatch inbound bersama |
    | `plugin-sdk/messaging-targets` | Helper parsing/pencocokan target |
    | `plugin-sdk/outbound-media` | Helper pemuatan media outbound bersama |
    | `plugin-sdk/outbound-send-deps` | Lookup dependensi pengiriman outbound yang ringan untuk adapter channel |
    | `plugin-sdk/outbound-runtime` | Helper pengiriman outbound, identitas, delegasi send, sesi, formatting, dan perencanaan payload |
    | `plugin-sdk/poll-runtime` | Helper normalisasi poll yang sempit |
    | `plugin-sdk/thread-bindings-runtime` | Helper siklus hidup dan adapter thread-binding |
    | `plugin-sdk/agent-media-payload` | Builder payload media agen lama |
    | `plugin-sdk/conversation-runtime` | Helper binding percakapan/thread, pairing, dan configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshot config runtime |
    | `plugin-sdk/runtime-group-policy` | Helper resolusi kebijakan grup runtime |
    | `plugin-sdk/channel-status` | Helper snapshot/ringkasan status channel bersama |
    | `plugin-sdk/channel-config-primitives` | Primitive schema config channel yang sempit |
    | `plugin-sdk/channel-config-writes` | Helper authorization penulisan config channel |
    | `plugin-sdk/channel-plugin-common` | Ekspor prelude Plugin channel bersama |
    | `plugin-sdk/allowlist-config-edit` | Helper edit/baca config allowlist |
    | `plugin-sdk/group-access` | Helper keputusan akses grup bersama |
    | `plugin-sdk/direct-dm` | Helper auth/guard direct-DM bersama |
    | `plugin-sdk/interactive-runtime` | Presentasi pesan semantik, helper pengiriman, dan balasan interaktif lama. Lihat [Presentasi Pesan](/id/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel kompatibilitas untuk debounce inbound, pencocokan mention, helper kebijakan mention, dan helper envelope |
    | `plugin-sdk/channel-inbound-debounce` | Helper debounce inbound yang sempit |
    | `plugin-sdk/channel-mention-gating` | Helper kebijakan mention dan teks mention yang sempit tanpa surface runtime inbound yang lebih luas |
    | `plugin-sdk/channel-envelope` | Helper formatting envelope inbound yang sempit |
    | `plugin-sdk/channel-location` | Helper konteks dan formatting lokasi channel |
    | `plugin-sdk/channel-logging` | Helper logging channel untuk drop inbound dan kegagalan typing/ack |
    | `plugin-sdk/channel-send-result` | Tipe hasil balasan |
    | `plugin-sdk/channel-actions` | Helper message-action channel, ditambah helper schema native usang yang dipertahankan untuk kompatibilitas Plugin |
    | `plugin-sdk/channel-targets` | Helper parsing/pencocokan target |
    | `plugin-sdk/channel-contract` | Tipe kontrak channel |
    | `plugin-sdk/channel-feedback` | Wiring feedback/reaksi |
    | `plugin-sdk/channel-secret-runtime` | Helper kontrak secret yang sempit seperti `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, dan tipe target secret |
  </Accordion>

  <Accordion title="Subpath provider">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helper setup provider lokal/self-hosted yang terkurasi |
    | `plugin-sdk/self-hosted-provider-setup` | Helper setup provider self-hosted yang kompatibel dengan OpenAI dan terfokus |
    | `plugin-sdk/cli-backend` | Default backend CLI + konstanta watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper resolusi API-key runtime untuk Plugin provider |
    | `plugin-sdk/provider-auth-api-key` | Helper onboarding/penulisan profil API-key seperti `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder hasil auth OAuth standar |
    | `plugin-sdk/provider-auth-login` | Helper login interaktif bersama untuk Plugin provider |
    | `plugin-sdk/provider-env-vars` | Helper lookup env var auth provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder replay-policy bersama, helper endpoint provider, dan helper normalisasi model-id seperti `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper kapabilitas HTTP/endpoint provider generik, error HTTP provider, dan helper multipart form transkripsi audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper kontrak config/seleksi web-fetch yang sempit seperti `enablePluginInConfig` dan `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper registrasi/cache provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper config/kredensial web-search yang sempit untuk provider yang tidak memerlukan wiring plugin-enable |
    | `plugin-sdk/provider-web-search-contract` | Helper kontrak config/kredensial web-search yang sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial bercakupan |
    | `plugin-sdk/provider-web-search` | Helper registrasi/cache/runtime provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, cleanup + diagnostik schema Gemini, dan helper kompatibilitas xAI seperti `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` dan yang serupa |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe stream wrapper, dan helper wrapper bersama Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helper transport provider native seperti guarded fetch, transform pesan transport, dan writable transport event streams |
    | `plugin-sdk/provider-onboard` | Helper patch config onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/cache lokal proses |
    | `plugin-sdk/group-activation` | Helper mode aktivasi grup dan parsing perintah yang sempit |
  </Accordion>

  <Accordion title="Subpath auth dan keamanan">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper registry perintah termasuk formatting menu argumen dinamis, helper otorisasi pengirim |
    | `plugin-sdk/command-status` | Builder pesan perintah/bantuan seperti `buildCommandsMessagePaginated` dan `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper resolusi approver dan action-auth same-chat |
    | `plugin-sdk/approval-client-runtime` | Helper profil/filter persetujuan exec native |
    | `plugin-sdk/approval-delivery-runtime` | Adapter kapabilitas/pengiriman persetujuan native |
    | `plugin-sdk/approval-gateway-runtime` | Helper resolusi gateway persetujuan bersama |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper ringan pemuatan adapter persetujuan native untuk entrypoint channel panas |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime handler persetujuan yang lebih luas; utamakan seam adapter/gateway yang lebih sempit bila sudah cukup |
    | `plugin-sdk/approval-native-runtime` | Helper target persetujuan native + binding akun |
    | `plugin-sdk/approval-reply-runtime` | Helper payload balasan persetujuan exec/Plugin |
    | `plugin-sdk/approval-runtime` | Helper payload persetujuan exec/Plugin, helper routing/runtime persetujuan native, dan helper tampilan persetujuan terstruktur seperti `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper reset dedupe balasan inbound yang sempit |
    | `plugin-sdk/channel-contract-testing` | Helper uji kontrak channel yang sempit tanpa barrel pengujian yang luas |
    | `plugin-sdk/command-auth-native` | Auth perintah native, formatting menu argumen dinamis, dan helper target-sesi native |
    | `plugin-sdk/command-detection` | Helper deteksi perintah bersama |
    | `plugin-sdk/command-primitives-runtime` | Predikat teks perintah yang ringan untuk jalur channel panas |
    | `plugin-sdk/command-surface` | Helper normalisasi isi perintah dan surface perintah |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper koleksi kontrak secret yang sempit untuk surface secret channel/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper `coerceSecretRef` sempit dan typing SecretRef untuk parsing kontrak secret/config |
    | `plugin-sdk/security-runtime` | Helper trust, pembatasan DM, konten eksternal, dan koleksi secret bersama |
    | `plugin-sdk/ssrf-policy` | Helper allowlist host dan kebijakan SSRF private-network |
    | `plugin-sdk/ssrf-dispatcher` | Helper pinned-dispatcher yang sempit tanpa surface runtime infra yang luas |
    | `plugin-sdk/ssrf-runtime` | Helper pinned-dispatcher, fetch berpengaman SSRF, dan kebijakan SSRF |
    | `plugin-sdk/secret-input` | Helper parsing input secret |
    | `plugin-sdk/webhook-ingress` | Helper permintaan/target Webhook |
    | `plugin-sdk/webhook-request-guards` | Helper ukuran body permintaan/timeout |
  </Accordion>

  <Accordion title="Subpath runtime dan penyimpanan">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper runtime/logging/backup/instalasi Plugin yang luas |
    | `plugin-sdk/runtime-env` | Helper env runtime, logger, timeout, retry, dan backoff yang sempit |
    | `plugin-sdk/channel-runtime-context` | Helper generik registrasi dan lookup konteks runtime channel |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper bersama untuk perintah/hook/http/interaktif Plugin |
    | `plugin-sdk/hook-runtime` | Helper pipeline Webhook/hook internal bersama |
    | `plugin-sdk/lazy-runtime` | Helper import/binding runtime lazy seperti `createLazyRuntimeModule`, `createLazyRuntimeMethod`, dan `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper exec proses |
    | `plugin-sdk/cli-runtime` | Helper formatting, wait, version, invocation argumen, dan command-group lazy CLI |
    | `plugin-sdk/gateway-runtime` | Helper klien gateway dan patch status channel |
    | `plugin-sdk/config-runtime` | Helper load/write config dan helper lookup config Plugin |
    | `plugin-sdk/telegram-command-config` | Helper normalisasi nama/deskripsi perintah Telegram dan pemeriksaan duplikat/konflik, bahkan saat surface kontrak Telegram bawaan tidak tersedia |
    | `plugin-sdk/text-autolink-runtime` | Deteksi autolink referensi file tanpa barrel text-runtime yang luas |
    | `plugin-sdk/approval-runtime` | Helper persetujuan exec/Plugin, builder kapabilitas persetujuan, helper auth/profil, helper routing/runtime native, dan formatting path tampilan persetujuan terstruktur |
    | `plugin-sdk/reply-runtime` | Helper runtime inbound/balasan bersama, chunking, dispatch, Heartbeat, planner balasan |
    | `plugin-sdk/reply-dispatch-runtime` | Helper dispatch/finalisasi balasan dan label percakapan yang sempit |
    | `plugin-sdk/reply-history` | Helper riwayat balasan jendela pendek bersama seperti `buildHistoryContext`, `recordPendingHistoryEntry`, dan `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper chunking teks/markdown yang sempit |
    | `plugin-sdk/session-store-runtime` | Helper path session store + updated-at |
    | `plugin-sdk/state-paths` | Helper path direktori status/OAuth |
    | `plugin-sdk/routing` | Helper rute/session-key/binding akun seperti `resolveAgentRoute`, `buildAgentSessionKey`, dan `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper ringkasan status channel/akun bersama, default status runtime, dan helper metadata issue |
    | `plugin-sdk/target-resolver-runtime` | Helper resolver target bersama |
    | `plugin-sdk/string-normalization-runtime` | Helper normalisasi slug/string |
    | `plugin-sdk/request-url` | Ekstrak URL string dari input mirip fetch/request |
    | `plugin-sdk/run-command` | Runner perintah bertimer dengan hasil stdout/stderr yang dinormalisasi |
    | `plugin-sdk/param-readers` | Reader param tool/CLI umum |
    | `plugin-sdk/tool-payload` | Ekstrak payload yang dinormalisasi dari objek hasil tool |
    | `plugin-sdk/tool-send` | Ekstrak field target send kanonis dari argumen tool |
    | `plugin-sdk/temp-path` | Helper path unduhan sementara bersama |
    | `plugin-sdk/logging-core` | Helper logger subsistem dan redaksi |
    | `plugin-sdk/markdown-table-runtime` | Helper mode dan konversi tabel markdown |
    | `plugin-sdk/json-store` | Helper kecil baca/tulis status JSON |
    | `plugin-sdk/file-lock` | Helper file-lock re-entrant |
    | `plugin-sdk/persistent-dedupe` | Helper cache dedupe berbasis disk |
    | `plugin-sdk/acp-runtime` | Helper runtime/sesi ACP dan reply-dispatch |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolusi binding ACP read-only tanpa import startup lifecycle |
    | `plugin-sdk/agent-config-primitives` | Primitive schema config runtime agen yang sempit |
    | `plugin-sdk/boolean-param` | Reader param boolean longgar |
    | `plugin-sdk/dangerous-name-runtime` | Helper resolusi pencocokan nama berbahaya |
    | `plugin-sdk/device-bootstrap` | Helper token bootstrap dan pairing device |
    | `plugin-sdk/extension-shared` | Primitive helper bersama untuk passive-channel, status, dan proxy ambient |
    | `plugin-sdk/models-provider-runtime` | Helper balasan perintah/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helper pencantuman perintah Skills |
    | `plugin-sdk/native-command-registry` | Helper registry/build/serialize perintah native |
    | `plugin-sdk/agent-harness` | Surface Plugin tepercaya eksperimental untuk harness agen level rendah: tipe harness, helper steer/abort active-run, helper bridge tool OpenClaw, helper kebijakan tool runtime-plan, klasifikasi hasil terminal, helper formatting/detail progres tool, dan utilitas hasil percobaan |
    | `plugin-sdk/provider-zai-endpoint` | Helper deteksi endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Helper system event/Heartbeat |
    | `plugin-sdk/collection-runtime` | Helper cache kecil yang dibatasi |
    | `plugin-sdk/diagnostic-runtime` | Helper flag dan event diagnostik |
    | `plugin-sdk/error-runtime` | Helper graf error, formatting, klasifikasi error bersama, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helper wrapped fetch, proxy, dan lookup tersemat |
    | `plugin-sdk/runtime-fetch` | Fetch runtime yang sadar dispatcher tanpa import proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Reader body respons yang dibatasi tanpa surface media runtime yang luas |
    | `plugin-sdk/session-binding-runtime` | Status binding percakapan saat ini tanpa routing configured binding atau store pairing |
    | `plugin-sdk/session-store-runtime` | Helper baca session-store tanpa import penulisan config/pemeliharaan yang luas |
    | `plugin-sdk/context-visibility-runtime` | Resolusi visibilitas konteks dan pemfilteran konteks tambahan tanpa import config/keamanan yang luas |
    | `plugin-sdk/string-coerce-runtime` | Helper sempit untuk coercion dan normalisasi record/string primitif tanpa import markdown/logging |
    | `plugin-sdk/host-runtime` | Helper normalisasi hostname dan host SCP |
    | `plugin-sdk/retry-runtime` | Helper config retry dan runner retry |
    | `plugin-sdk/agent-runtime` | Helper direktori/identitas/workspace agen |
    | `plugin-sdk/directory-runtime` | Query/dedup direktori berbasis config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpath kapabilitas dan pengujian">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper bersama fetch/transform/store media plus builder payload media |
    | `plugin-sdk/media-store` | Helper store media yang sempit seperti `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helper failover pembuatan media bersama, pemilihan kandidat, dan pesan model hilang |
    | `plugin-sdk/media-understanding` | Tipe provider pemahaman media plus ekspor helper gambar/audio untuk provider |
    | `plugin-sdk/text-runtime` | Helper bersama teks/markdown/logging seperti penghapusan teks yang terlihat oleh asisten, helper render/chunking/tabel markdown, helper redaksi, helper tag directive, dan utilitas teks aman |
    | `plugin-sdk/text-chunking` | Helper chunking teks outbound |
    | `plugin-sdk/speech` | Tipe provider speech plus ekspor helper directive, registry, validasi, dan speech untuk provider |
    | `plugin-sdk/speech-core` | Ekspor helper bersama untuk tipe provider speech, registry, directive, normalisasi, dan speech |
    | `plugin-sdk/realtime-transcription` | Tipe provider transkripsi realtime, helper registry, dan helper sesi WebSocket bersama |
    | `plugin-sdk/realtime-voice` | Tipe provider suara realtime dan helper registry |
    | `plugin-sdk/image-generation` | Tipe provider pembuatan gambar |
    | `plugin-sdk/image-generation-core` | Helper bersama tipe, failover, auth, dan registry pembuatan gambar |
    | `plugin-sdk/music-generation` | Tipe provider/permintaan/hasil pembuatan musik |
    | `plugin-sdk/music-generation-core` | Helper bersama tipe pembuatan musik, failover, lookup provider, dan parsing model-ref |
    | `plugin-sdk/video-generation` | Tipe provider/permintaan/hasil pembuatan video |
    | `plugin-sdk/video-generation-core` | Helper bersama tipe pembuatan video, failover, lookup provider, dan parsing model-ref |
    | `plugin-sdk/webhook-targets` | Helper registry target Webhook dan pemasangan rute |
    | `plugin-sdk/webhook-path` | Helper normalisasi path Webhook |
    | `plugin-sdk/web-media` | Helper bersama pemuatan media remote/lokal |
    | `plugin-sdk/zod` | `zod` yang diekspor ulang untuk konsumen SDK Plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subpath memori">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/memory-core` | Surface helper memory-core bawaan untuk helper manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasad runtime indeks/pencarian memori |
    | `plugin-sdk/memory-core-host-engine-foundation` | Ekspor mesin fondasi host memori |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrak embedding host memori, akses registry, provider lokal, dan helper batch/remote generik |
    | `plugin-sdk/memory-core-host-engine-qmd` | Ekspor mesin QMD host memori |
    | `plugin-sdk/memory-core-host-engine-storage` | Ekspor mesin penyimpanan host memori |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodal host memori |
    | `plugin-sdk/memory-core-host-query` | Helper query host memori |
    | `plugin-sdk/memory-core-host-secret` | Helper secret host memori |
    | `plugin-sdk/memory-core-host-events` | Helper jurnal peristiwa host memori |
    | `plugin-sdk/memory-core-host-status` | Helper status host memori |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI host memori |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime inti host memori |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host memori |
    | `plugin-sdk/memory-host-core` | Alias netral-vendor untuk helper runtime inti host memori |
    | `plugin-sdk/memory-host-events` | Alias netral-vendor untuk helper jurnal peristiwa host memori |
    | `plugin-sdk/memory-host-files` | Alias netral-vendor untuk helper file/runtime host memori |
    | `plugin-sdk/memory-host-markdown` | Helper managed-markdown bersama untuk Plugins yang berdekatan dengan memori |
    | `plugin-sdk/memory-host-search` | Fasad runtime Active Memory untuk akses search-manager |
    | `plugin-sdk/memory-host-status` | Alias netral-vendor untuk helper status host memori |
    | `plugin-sdk/memory-lancedb` | Surface helper memory-lancedb bawaan |
  </Accordion>

  <Accordion title="Subpath helper bawaan yang dicadangkan">
    | Keluarga | Subpath saat ini | Penggunaan yang dimaksud |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helper dukungan Plugin browser bawaan. `browser-profiles` mengekspor `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile`, dan `ResolvedBrowserTabCleanupConfig` untuk bentuk `browser.tabCleanup` yang telah dinormalisasi. `browser-support` tetap menjadi barrel kompatibilitas. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Surface helper/runtime Matrix bawaan |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Surface helper/runtime LINE bawaan |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Surface helper IRC bawaan |
    | Helper khusus channel | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seam helper/kompatibilitas channel bawaan |
    | Helper khusus auth/Plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seam helper fitur/Plugin bawaan; `plugin-sdk/github-copilot-token` saat ini mengekspor `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, dan `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Terkait

- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview)
- [Setup SDK Plugin](/id/plugins/sdk-setup)
- [Membangun Plugins](/id/plugins/building-plugins)

---
read_when:
    - Anda perlu mengetahui subpath SDK mana yang harus diimpor dari sana
    - Anda menginginkan referensi untuk semua metode registrasi di `OpenClawPluginApi`
    - Anda sedang mencari ekspor SDK tertentu
sidebarTitle: SDK Overview
summary: Peta impor, referensi API registrasi, dan arsitektur SDK
title: Ikhtisar Plugin SDK
x-i18n:
    generated_at: "2026-04-18T09:05:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05d3d0022cca32d29c76f6cea01cdf4f88ac69ef0ef3d7fb8a60fbf9a6b9b331
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Ikhtisar Plugin SDK

Plugin SDK adalah kontrak bertipe antara plugin dan core. Halaman ini adalah
referensi untuk **apa yang harus diimpor** dan **apa yang dapat Anda daftarkan**.

<Tip>
  **Mencari panduan cara melakukannya?**
  - Plugin pertama? Mulai dengan [Memulai](/id/plugins/building-plugins)
  - Plugin channel? Lihat [Plugin Channel](/id/plugins/sdk-channel-plugins)
  - Plugin provider? Lihat [Plugin Provider](/id/plugins/sdk-provider-plugins)
</Tip>

## Konvensi impor

Selalu impor dari subpath tertentu:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Setiap subpath adalah modul kecil yang berdiri sendiri. Ini menjaga startup tetap cepat dan
mencegah masalah circular dependency. Untuk helper entri/build khusus channel,
utamakan `openclaw/plugin-sdk/channel-core`; pertahankan `openclaw/plugin-sdk/core` untuk
permukaan payung yang lebih luas dan helper bersama seperti
`buildChannelConfigSchema`.

Jangan tambahkan atau bergantung pada seam kemudahan bernama provider seperti
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, atau
seam helper berlabel channel. Plugin bawaan harus menyusun subpath
SDK generik di dalam barrel `api.ts` atau `runtime-api.ts` milik mereka sendiri, dan core
harus menggunakan barrel lokal plugin tersebut atau menambahkan kontrak SDK generik yang sempit
ketika kebutuhannya benar-benar lintas channel.

Peta ekspor yang dihasilkan masih memuat sejumlah kecil
seam helper bundled-plugin seperti `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup`, dan `plugin-sdk/matrix*`. Subpath tersebut
hanya ada untuk pemeliharaan dan kompatibilitas bundled-plugin; subpath itu
sengaja dihilangkan dari tabel umum di bawah dan bukan jalur impor yang
direkomendasikan untuk plugin pihak ketiga yang baru.

## Referensi subpath

Subpath yang paling umum digunakan, dikelompokkan berdasarkan tujuan. Daftar lengkap yang dihasilkan berisi
200+ subpath ada di `scripts/lib/plugin-sdk-entrypoints.json`.

Subpath helper bundled-plugin yang dicadangkan masih muncul dalam daftar yang dihasilkan tersebut.
Perlakukan itu sebagai permukaan detail implementasi/kompatibilitas kecuali halaman dokumen
secara eksplisit mempromosikan salah satunya sebagai publik.

### Entri plugin

| Subpath                     | Ekspor utama                                                                                                                           |
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
    | `plugin-sdk/config-schema` | Ekspor skema Zod root `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ditambah `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper wizard penyiapan bersama, prompt allowlist, pembuat status penyiapan |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper config/pagar tindakan multi-akun, helper fallback akun default |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper normalisasi account-id |
    | `plugin-sdk/account-resolution` | Pencarian akun + helper fallback default |
    | `plugin-sdk/account-helpers` | Helper sempit daftar-aksi akun/aksi akun |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipe skema config channel |
    | `plugin-sdk/telegram-command-config` | Helper normalisasi/validasi perintah kustom Telegram dengan fallback kontrak bawaan |
    | `plugin-sdk/command-gating` | Helper pagar otorisasi perintah yang sempit |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Helper route masuk dan pembangun envelope bersama |
    | `plugin-sdk/inbound-reply-dispatch` | Helper pencatatan-dan-dispatch masuk bersama |
    | `plugin-sdk/messaging-targets` | Helper parsing/pencocokan target |
    | `plugin-sdk/outbound-media` | Helper pemuatan media keluar bersama |
    | `plugin-sdk/outbound-runtime` | Helper identitas keluar/delegasi pengiriman |
    | `plugin-sdk/poll-runtime` | Helper normalisasi poll yang sempit |
    | `plugin-sdk/thread-bindings-runtime` | Siklus hidup thread-binding dan helper adapter |
    | `plugin-sdk/agent-media-payload` | Pembuat payload media agen lama |
    | `plugin-sdk/conversation-runtime` | Helper percakapan/thread binding, pairing, dan binding terkonfigurasi |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshot config runtime |
    | `plugin-sdk/runtime-group-policy` | Helper resolusi kebijakan grup runtime |
    | `plugin-sdk/channel-status` | Helper snapshot/ringkasan status channel bersama |
    | `plugin-sdk/channel-config-primitives` | Primitif skema config channel yang sempit |
    | `plugin-sdk/channel-config-writes` | Helper otorisasi penulisan config channel |
    | `plugin-sdk/channel-plugin-common` | Ekspor prelude plugin channel bersama |
    | `plugin-sdk/allowlist-config-edit` | Helper edit/baca config allowlist |
    | `plugin-sdk/group-access` | Helper keputusan akses grup bersama |
    | `plugin-sdk/direct-dm` | Helper auth/pengaman direct-DM bersama |
    | `plugin-sdk/interactive-runtime` | Helper normalisasi/pengurangan payload balasan interaktif |
    | `plugin-sdk/channel-inbound` | Barrel kompatibilitas untuk debounce masuk, pencocokan mention, helper kebijakan mention, dan helper envelope |
    | `plugin-sdk/channel-mention-gating` | Helper kebijakan mention yang sempit tanpa permukaan runtime masuk yang lebih luas |
    | `plugin-sdk/channel-location` | Helper konteks lokasi channel dan pemformatan |
    | `plugin-sdk/channel-logging` | Helper logging channel untuk drop masuk dan kegagalan typing/ack |
    | `plugin-sdk/channel-send-result` | Tipe hasil balasan |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helper parsing/pencocokan target |
    | `plugin-sdk/channel-contract` | Tipe kontrak channel |
    | `plugin-sdk/channel-feedback` | Wiring umpan balik/reaksi |
    | `plugin-sdk/channel-secret-runtime` | Helper kontrak secret yang sempit seperti `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, dan tipe target secret |
  </Accordion>

  <Accordion title="Subpath provider">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helper penyiapan provider lokal/self-hosted yang dikurasi |
    | `plugin-sdk/self-hosted-provider-setup` | Helper penyiapan provider self-hosted yang kompatibel dengan OpenAI dan terfokus |
    | `plugin-sdk/cli-backend` | Default backend CLI + konstanta watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper resolusi API key runtime untuk plugin provider |
    | `plugin-sdk/provider-auth-api-key` | Helper onboarding/penulisan profil API key seperti `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Pembangun hasil auth OAuth standar |
    | `plugin-sdk/provider-auth-login` | Helper login interaktif bersama untuk plugin provider |
    | `plugin-sdk/provider-env-vars` | Helper pencarian env var auth provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, pembangun kebijakan replay bersama, helper endpoint provider, dan helper normalisasi model-id seperti `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper kemampuan HTTP/endpoint provider generik |
    | `plugin-sdk/provider-web-fetch-contract` | Helper kontrak config/seleksi web-fetch yang sempit seperti `enablePluginInConfig` dan `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper registrasi/cache provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper config/kredensial web-search yang sempit untuk provider yang tidak memerlukan wiring plugin-enable |
    | `plugin-sdk/provider-web-search-contract` | Helper kontrak config/kredensial web-search yang sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial berskala |
    | `plugin-sdk/provider-web-search` | Helper registrasi/cache/runtime provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pembersihan skema Gemini + diagnostik, dan helper kompat xAI seperti `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` dan yang serupa |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe wrapper stream, dan helper wrapper bersama Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Helper patch config onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/cache lokal-proses |
  </Accordion>

  <Accordion title="Subpath auth dan keamanan">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper registry perintah, helper otorisasi pengirim |
    | `plugin-sdk/command-status` | Pembangun pesan perintah/bantuan seperti `buildCommandsMessagePaginated` dan `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper resolusi approver dan auth tindakan dalam chat yang sama |
    | `plugin-sdk/approval-client-runtime` | Helper profil/filter approval native exec |
    | `plugin-sdk/approval-delivery-runtime` | Adapter kemampuan/pengiriman approval native |
    | `plugin-sdk/approval-gateway-runtime` | Helper resolusi Gateway approval bersama |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper pemuatan adapter approval native yang ringan untuk entrypoint channel hot |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime approval handler yang lebih luas; utamakan seam adapter/gateway yang lebih sempit jika itu sudah cukup |
    | `plugin-sdk/approval-native-runtime` | Helper target approval native + account-binding |
    | `plugin-sdk/approval-reply-runtime` | Helper payload balasan approval exec/plugin |
    | `plugin-sdk/command-auth-native` | Helper auth perintah native + session-target native |
    | `plugin-sdk/command-detection` | Helper deteksi perintah bersama |
    | `plugin-sdk/command-surface` | Normalisasi badan perintah dan helper permukaan perintah |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper pengumpulan secret-contract yang sempit untuk permukaan secret channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper `coerceSecretRef` dan pengetikan SecretRef yang sempit untuk parsing secret-contract/config |
    | `plugin-sdk/security-runtime` | Helper trust, DM gating, konten eksternal, dan pengumpulan secret bersama |
    | `plugin-sdk/ssrf-policy` | Helper kebijakan SSRF host allowlist dan jaringan privat |
    | `plugin-sdk/ssrf-dispatcher` | Helper pinned-dispatcher yang sempit tanpa permukaan runtime infra yang luas |
    | `plugin-sdk/ssrf-runtime` | Helper pinned-dispatcher, fetch yang dijaga SSRF, dan kebijakan SSRF |
    | `plugin-sdk/secret-input` | Helper parsing input secret |
    | `plugin-sdk/webhook-ingress` | Helper permintaan/target Webhook |
    | `plugin-sdk/webhook-request-guards` | Helper ukuran body/timeout permintaan |
  </Accordion>

  <Accordion title="Subpath runtime dan penyimpanan">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper runtime/logging/backup/instalasi plugin yang luas |
    | `plugin-sdk/runtime-env` | Helper env runtime, logger, timeout, retry, dan backoff yang sempit |
    | `plugin-sdk/channel-runtime-context` | Helper registrasi dan pencarian runtime-context channel generik |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper perintah/hook/http/interaktif plugin bersama |
    | `plugin-sdk/hook-runtime` | Helper pipeline Webhook/hook internal bersama |
    | `plugin-sdk/lazy-runtime` | Helper impor/binding runtime lazy seperti `createLazyRuntimeModule`, `createLazyRuntimeMethod`, dan `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper eksekusi proses |
    | `plugin-sdk/cli-runtime` | Helper format, wait, dan versi CLI |
    | `plugin-sdk/gateway-runtime` | Helper klien Gateway dan patch status channel |
    | `plugin-sdk/config-runtime` | Helper pemuatan/penulisan config |
    | `plugin-sdk/telegram-command-config` | Normalisasi nama/deskripsi perintah Telegram dan pemeriksaan duplikat/konflik, bahkan ketika permukaan kontrak Telegram bawaan tidak tersedia |
    | `plugin-sdk/text-autolink-runtime` | Deteksi autolink referensi file tanpa barrel text-runtime yang luas |
    | `plugin-sdk/approval-runtime` | Helper approval exec/plugin, pembangun kemampuan approval, helper auth/profil, helper routing/runtime native |
    | `plugin-sdk/reply-runtime` | Helper runtime masuk/balasan bersama, chunking, dispatch, Heartbeat, perencana balasan |
    | `plugin-sdk/reply-dispatch-runtime` | Helper dispatch/finalisasi balasan yang sempit |
    | `plugin-sdk/reply-history` | Helper riwayat balasan jendela pendek bersama seperti `buildHistoryContext`, `recordPendingHistoryEntry`, dan `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper chunking teks/markdown yang sempit |
    | `plugin-sdk/session-store-runtime` | Helper path session store + updated-at |
    | `plugin-sdk/state-paths` | Helper path direktori state/OAuth |
    | `plugin-sdk/routing` | Helper route/session-key/account binding seperti `resolveAgentRoute`, `buildAgentSessionKey`, dan `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper ringkasan status channel/akun bersama, default state runtime, dan helper metadata issue |
    | `plugin-sdk/target-resolver-runtime` | Helper target resolver bersama |
    | `plugin-sdk/string-normalization-runtime` | Helper normalisasi slug/string |
    | `plugin-sdk/request-url` | Ekstrak URL string dari input mirip fetch/request |
    | `plugin-sdk/run-command` | Runner perintah bertimer dengan hasil stdout/stderr yang dinormalisasi |
    | `plugin-sdk/param-readers` | Pembaca param tool/CLI umum |
    | `plugin-sdk/tool-payload` | Ekstrak payload yang dinormalisasi dari objek hasil tool |
    | `plugin-sdk/tool-send` | Ekstrak field target pengiriman kanonis dari argumen tool |
    | `plugin-sdk/temp-path` | Helper path unduhan sementara bersama |
    | `plugin-sdk/logging-core` | Helper logger subsistem dan redaksi |
    | `plugin-sdk/markdown-table-runtime` | Helper mode tabel Markdown |
    | `plugin-sdk/json-store` | Helper kecil baca/tulis state JSON |
    | `plugin-sdk/file-lock` | Helper file-lock re-entrant |
    | `plugin-sdk/persistent-dedupe` | Helper cache dedupe berbasis disk |
    | `plugin-sdk/acp-runtime` | Helper runtime/sesi ACP dan reply-dispatch |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolusi binding ACP hanya-baca tanpa impor startup siklus hidup |
    | `plugin-sdk/agent-config-primitives` | Primitif skema config runtime agen yang sempit |
    | `plugin-sdk/boolean-param` | Pembaca param boolean longgar |
    | `plugin-sdk/dangerous-name-runtime` | Helper resolusi pencocokan nama berbahaya |
    | `plugin-sdk/device-bootstrap` | Helper bootstrap perangkat dan token pairing |
    | `plugin-sdk/extension-shared` | Primitif helper pasif-channel, status, dan proxy ambient bersama |
    | `plugin-sdk/models-provider-runtime` | Helper balasan perintah `/models`/provider |
    | `plugin-sdk/skill-commands-runtime` | Helper daftar perintah Skills |
    | `plugin-sdk/native-command-registry` | Helper registrasi/build/serialisasi perintah native |
    | `plugin-sdk/agent-harness` | Permukaan trusted-plugin eksperimental untuk agent harness level rendah: tipe harness, helper steer/abort active-run, helper bridge tool OpenClaw, dan utilitas hasil upaya |
    | `plugin-sdk/provider-zai-endpoint` | Helper deteksi endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Helper event sistem/Heartbeat |
    | `plugin-sdk/collection-runtime` | Helper cache kecil yang dibatasi |
    | `plugin-sdk/diagnostic-runtime` | Helper flag dan event diagnostik |
    | `plugin-sdk/error-runtime` | Helper graf error, pemformatan, klasifikasi error bersama, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helper fetch terbungkus, proxy, dan pencarian pinned |
    | `plugin-sdk/runtime-fetch` | Fetch runtime yang sadar-dispatcher tanpa impor proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Pembaca body respons terbatas tanpa permukaan media runtime yang luas |
    | `plugin-sdk/session-binding-runtime` | State binding percakapan saat ini tanpa routing binding terkonfigurasi atau pairing store |
    | `plugin-sdk/session-store-runtime` | Helper baca session-store tanpa impor penulisan/pemeliharaan config yang luas |
    | `plugin-sdk/context-visibility-runtime` | Resolusi visibilitas konteks dan pemfilteran konteks tambahan tanpa impor config/keamanan yang luas |
    | `plugin-sdk/string-coerce-runtime` | Helper sempit untuk record/string primitif, coercion, dan normalisasi tanpa impor markdown/logging |
    | `plugin-sdk/host-runtime` | Helper normalisasi hostname dan host SCP |
    | `plugin-sdk/retry-runtime` | Helper config retry dan runner retry |
    | `plugin-sdk/agent-runtime` | Helper direktori/identitas/workspace agen |
    | `plugin-sdk/directory-runtime` | Query/dedupe direktori berbasis config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpath kemampuan dan pengujian">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper fetch/transform/store media bersama ditambah pembangun payload media |
    | `plugin-sdk/media-generation-runtime` | Helper failover media-generation bersama, pemilihan kandidat, dan pesan model hilang |
    | `plugin-sdk/media-understanding` | Tipe provider media understanding ditambah ekspor helper image/audio untuk provider |
    | `plugin-sdk/text-runtime` | Helper teks/markdown/logging bersama seperti penghapusan teks yang terlihat oleh asisten, helper render/chunking/tabel Markdown, helper redaksi, helper directive-tag, dan utilitas safe-text |
    | `plugin-sdk/text-chunking` | Helper chunking teks keluar |
    | `plugin-sdk/speech` | Tipe provider speech ditambah helper directive, registry, dan validasi untuk provider |
    | `plugin-sdk/speech-core` | Tipe provider speech bersama, registry, directive, dan helper normalisasi |
    | `plugin-sdk/realtime-transcription` | Tipe provider realtime transcription dan helper registry |
    | `plugin-sdk/realtime-voice` | Tipe provider realtime voice dan helper registry |
    | `plugin-sdk/image-generation` | Tipe provider image generation |
    | `plugin-sdk/image-generation-core` | Tipe image-generation bersama, failover, auth, dan helper registry |
    | `plugin-sdk/music-generation` | Tipe provider/permintaan/hasil music generation |
    | `plugin-sdk/music-generation-core` | Tipe music-generation bersama, helper failover, pencarian provider, dan parsing model-ref |
    | `plugin-sdk/video-generation` | Tipe provider/permintaan/hasil video generation |
    | `plugin-sdk/video-generation-core` | Tipe video-generation bersama, helper failover, pencarian provider, dan parsing model-ref |
    | `plugin-sdk/webhook-targets` | Helper registrasi target Webhook dan instalasi route |
    | `plugin-sdk/webhook-path` | Helper normalisasi path Webhook |
    | `plugin-sdk/web-media` | Helper pemuatan media jarak jauh/lokal bersama |
    | `plugin-sdk/zod` | `zod` yang diekspor ulang untuk konsumen plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subpath Memory">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/memory-core` | Permukaan helper memory-core bawaan untuk helper manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasad runtime indeks/pencarian Memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Ekspor engine foundation host Memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrak embedding host Memory, akses registry, provider lokal, dan helper batch/jarak jauh generik |
    | `plugin-sdk/memory-core-host-engine-qmd` | Ekspor engine QMD host Memory |
    | `plugin-sdk/memory-core-host-engine-storage` | Ekspor engine storage host Memory |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodal host Memory |
    | `plugin-sdk/memory-core-host-query` | Helper kueri host Memory |
    | `plugin-sdk/memory-core-host-secret` | Helper secret host Memory |
    | `plugin-sdk/memory-core-host-events` | Helper jurnal event host Memory |
    | `plugin-sdk/memory-core-host-status` | Helper status host Memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI host Memory |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime core host Memory |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host Memory |
    | `plugin-sdk/memory-host-core` | Alias netral-vendor untuk helper runtime core host Memory |
    | `plugin-sdk/memory-host-events` | Alias netral-vendor untuk helper jurnal event host Memory |
    | `plugin-sdk/memory-host-files` | Alias netral-vendor untuk helper file/runtime host Memory |
    | `plugin-sdk/memory-host-markdown` | Helper managed-markdown bersama untuk plugin yang berdekatan dengan memory |
    | `plugin-sdk/memory-host-search` | Fasad runtime Active Memory untuk akses search-manager |
    | `plugin-sdk/memory-host-status` | Alias netral-vendor untuk helper status host Memory |
    | `plugin-sdk/memory-lancedb` | Permukaan helper memory-lancedb bawaan |
  </Accordion>

  <Accordion title="Subpath helper-bawaan yang dicadangkan">
    | Family | Subpath saat ini | Penggunaan yang dimaksudkan |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helper dukungan plugin Browser bawaan (`browser-support` tetap menjadi barrel kompatibilitas) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Permukaan helper/runtime Matrix bawaan |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Permukaan helper/runtime LINE bawaan |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Permukaan helper IRC bawaan |
    | Helper khusus channel | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seam kompatibilitas/helper channel bawaan |
    | Helper khusus auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seam helper fitur/plugin bawaan; `plugin-sdk/github-copilot-token` saat ini mengekspor `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, dan `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API registrasi

Callback `register(api)` menerima objek `OpenClawPluginApi` dengan metode-metode
berikut:

### Registrasi kemampuan

| Metode                                           | Yang didaftarkan                        |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Inferensi teks (LLM)                   |
| `api.registerAgentHarness(...)`                  | Eksekutor agen tingkat rendah eksperimental |
| `api.registerCliBackend(...)`                    | Backend inferensi CLI lokal            |
| `api.registerChannel(...)`                       | Channel perpesanan                     |
| `api.registerSpeechProvider(...)`                | Text-to-speech / sintesis STT          |
| `api.registerRealtimeTranscriptionProvider(...)` | Transkripsi realtime streaming         |
| `api.registerRealtimeVoiceProvider(...)`         | Sesi suara realtime dupleks            |
| `api.registerMediaUnderstandingProvider(...)`    | Analisis gambar/audio/video            |
| `api.registerImageGenerationProvider(...)`       | Pembuatan gambar                       |
| `api.registerMusicGenerationProvider(...)`       | Pembuatan musik                        |
| `api.registerVideoGenerationProvider(...)`       | Pembuatan video                        |
| `api.registerWebFetchProvider(...)`              | Provider fetch / scrape web            |
| `api.registerWebSearchProvider(...)`             | Pencarian web                          |

### Tool dan perintah

| Metode                          | Yang didaftarkan                              |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Tool agen (wajib atau `{ optional: true }`) |
| `api.registerCommand(def)`      | Perintah kustom (melewati LLM)                |

### Infrastruktur

| Metode                                         | Yang didaftarkan                        |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook event                              |
| `api.registerHttpRoute(params)`                | endpoint HTTP Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | metode RPC Gateway                      |
| `api.registerCli(registrar, opts?)`            | subperintah CLI                         |
| `api.registerService(service)`                 | layanan latar belakang                  |
| `api.registerInteractiveHandler(registration)` | handler interaktif                      |
| `api.registerMemoryPromptSupplement(builder)`  | Bagian prompt aditif yang berdekatan dengan memory |
| `api.registerMemoryCorpusSupplement(adapter)`  | Korpus pencarian/baca memory aditif     |

Namespace admin core yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) selalu tetap `operator.admin`, meskipun plugin mencoba menetapkan
cakupan metode Gateway yang lebih sempit. Utamakan prefix khusus plugin untuk
metode yang dimiliki plugin.

### Metadata registrasi CLI

`api.registerCli(registrar, opts?)` menerima dua jenis metadata level atas:

- `commands`: root perintah eksplisit yang dimiliki oleh registrar
- `descriptors`: deskriptor perintah saat parse yang digunakan untuk bantuan CLI root,
  routing, dan registrasi CLI plugin lazy

Jika Anda ingin perintah plugin tetap dimuat secara lazy di jalur CLI root normal,
berikan `descriptors` yang mencakup setiap root perintah level atas yang diekspos oleh
registrar tersebut.

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
        description: "Kelola akun Matrix, verifikasi, perangkat, dan status profil",
        hasSubcommands: true,
      },
    ],
  },
);
```

Gunakan `commands` saja hanya ketika Anda tidak memerlukan registrasi CLI root yang lazy.
Jalur kompatibilitas eager itu tetap didukung, tetapi tidak memasang
placeholder berbasis descriptor untuk pemuatan lazy saat parse.

### Registrasi backend CLI

`api.registerCliBackend(...)` memungkinkan plugin memiliki config default untuk
backend CLI AI lokal seperti `codex-cli`.

- `id` backend menjadi prefix provider dalam model ref seperti `codex-cli/gpt-5`.
- `config` backend menggunakan bentuk yang sama dengan `agents.defaults.cliBackends.<id>`.
- Config pengguna tetap menang. OpenClaw menggabungkan `agents.defaults.cliBackends.<id>` di atas
  default plugin sebelum menjalankan CLI.
- Gunakan `normalizeConfig` ketika backend memerlukan penulisan ulang kompatibilitas setelah penggabungan
  (misalnya menormalkan bentuk flag lama).

### Slot eksklusif

| Metode                                     | Yang didaftarkan                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Engine konteks (satu aktif pada satu waktu). Callback `assemble()` menerima `availableTools` dan `citationsMode` agar engine dapat menyesuaikan tambahan prompt. |
| `api.registerMemoryCapability(capability)` | Kemampuan memory terpadu                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Pembuat bagian prompt memory                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver rencana flush memory                                                                                                                            |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime memory                                                                                                                                   |

### Adapter embedding memory

| Metode                                         | Yang didaftarkan                               |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embedding memory untuk plugin aktif |

- `registerMemoryCapability` adalah API plugin memory eksklusif yang diutamakan.
- `registerMemoryCapability` juga dapat mengekspos `publicArtifacts.listArtifacts(...)`
  agar plugin pendamping dapat menggunakan artefak memory yang diekspor melalui
  `openclaw/plugin-sdk/memory-host-core` alih-alih menjangkau layout privat
  plugin memory tertentu.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, dan
  `registerMemoryRuntime` adalah API plugin memory eksklusif yang kompatibel
  dengan versi lama.
- `registerMemoryEmbeddingProvider` memungkinkan plugin memory aktif mendaftarkan satu
  atau lebih id adapter embedding (misalnya `openai`, `gemini`, atau id kustom
  yang didefinisikan plugin).
- Config pengguna seperti `agents.defaults.memorySearch.provider` dan
  `agents.defaults.memorySearch.fallback` diresolusikan terhadap id adapter yang
  terdaftar tersebut.

### Event dan siklus hidup

| Metode                                       | Fungsinya                     |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook siklus hidup bertipe     |
| `api.onConversationBindingResolved(handler)` | Callback binding percakapan   |

### Semantik keputusan hook

- `before_tool_call`: mengembalikan `{ block: true }` bersifat terminal. Setelah ada handler yang menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `before_tool_call`: mengembalikan `{ block: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `before_install`: mengembalikan `{ block: true }` bersifat terminal. Setelah ada handler yang menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `before_install`: mengembalikan `{ block: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `reply_dispatch`: mengembalikan `{ handled: true, ... }` bersifat terminal. Setelah ada handler yang mengklaim dispatch, handler dengan prioritas lebih rendah dan jalur dispatch model default dilewati.
- `message_sending`: mengembalikan `{ cancel: true }` bersifat terminal. Setelah ada handler yang menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `message_sending`: mengembalikan `{ cancel: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `cancel`), bukan sebagai override.

### Field objek API

| Field                    | Tipe                      | Deskripsi                                                                                  |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | id plugin                                                                                  |
| `api.name`               | `string`                  | Nama tampilan                                                                               |
| `api.version`            | `string?`                 | Versi plugin (opsional)                                                                     |
| `api.description`        | `string?`                 | Deskripsi plugin (opsional)                                                                 |
| `api.source`             | `string`                  | Path sumber plugin                                                                          |
| `api.rootDir`            | `string?`                 | Direktori root plugin (opsional)                                                            |
| `api.config`             | `OpenClawConfig`          | Snapshot config saat ini (snapshot runtime in-memory aktif jika tersedia)                   |
| `api.pluginConfig`       | `Record<string, unknown>` | Config khusus plugin dari `plugins.entries.<id>.config`                                     |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/id/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | Logger berskala (`debug`, `info`, `warn`, `error`)                                          |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode pemuatan saat ini; `"setup-runtime"` adalah jendela startup/setup ringan sebelum full-entry |
| `api.resolvePath(input)` | `(string) => string`      | Resolve path relatif terhadap root plugin                                                   |

## Konvensi modul internal

Di dalam plugin Anda, gunakan file barrel lokal untuk impor internal:

```
my-plugin/
  api.ts            # Ekspor publik untuk konsumen eksternal
  runtime-api.ts    # Ekspor runtime khusus internal
  index.ts          # Entry point plugin
  setup-entry.ts    # Entri khusus setup yang ringan (opsional)
```

<Warning>
  Jangan pernah mengimpor plugin Anda sendiri melalui `openclaw/plugin-sdk/<your-plugin>`
  dari kode production. Rute impor internal harus melalui `./api.ts` atau
  `./runtime-api.ts`. Path SDK hanya merupakan kontrak eksternal.
</Warning>

Permukaan publik plugin bawaan yang dimuat lewat facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, dan file entri publik serupa) sekarang mengutamakan
snapshot config runtime aktif ketika OpenClaw sudah berjalan. Jika belum ada snapshot
runtime, mereka akan fallback ke file config yang sudah di-resolve di disk.

Plugin provider juga dapat mengekspos barrel kontrak lokal-plugin yang sempit ketika sebuah
helper memang khusus provider dan belum pantas dimasukkan ke subpath SDK
generik. Contoh bawaan saat ini: provider Anthropic menyimpan helper stream Claude
di seam publik `api.ts` / `contract-api.ts` miliknya sendiri alih-alih
mempromosikan header beta Anthropic dan logika `service_tier` ke kontrak
`plugin-sdk/*` generik.

Contoh bawaan saat ini lainnya:

- `@openclaw/openai-provider`: `api.ts` mengekspor pembangun provider,
  helper default-model, dan pembangun provider realtime
- `@openclaw/openrouter-provider`: `api.ts` mengekspor pembangun provider serta
  helper onboarding/config

<Warning>
  Kode production extension juga harus menghindari impor `openclaw/plugin-sdk/<other-plugin>`.
  Jika suatu helper benar-benar dibagikan, promosikan ke subpath SDK netral
  seperti `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, atau
  permukaan lain yang berorientasi kemampuan alih-alih mengaitkan dua plugin secara langsung.
</Warning>

## Terkait

- [Entry Points](/id/plugins/sdk-entrypoints) — opsi `definePluginEntry` dan `defineChannelPluginEntry`
- [Helper Runtime](/id/plugins/sdk-runtime) — referensi lengkap namespace `api.runtime`
- [Setup dan Config](/id/plugins/sdk-setup) — packaging, manifest, skema config
- [Testing](/id/plugins/sdk-testing) — utilitas pengujian dan aturan lint
- [Migrasi SDK](/id/plugins/sdk-migration) — migrasi dari permukaan yang sudah deprecated
- [Internal Plugin](/id/plugins/architecture) — arsitektur mendalam dan model kemampuan

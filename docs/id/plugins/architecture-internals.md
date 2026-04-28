---
read_when:
    - Mengimplementasikan hook runtime provider, lifecycle channel, atau paket pack
    - Melakukan debugging urutan pemuatan Plugin atau state registry
    - Menambahkan kapabilitas Plugin baru atau Plugin mesin context
summary: 'Internal arsitektur Plugin: pipeline pemuatan, registry, hook runtime, rute HTTP, dan tabel referensi'
title: Internal arsitektur Plugin
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:34:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a435e118dc6acbacd44008f0b1c47b51da32dc3f17c24fe4c99f75c8cbd9311
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Untuk model kapabilitas publik, bentuk Plugin, dan kontrak kepemilikan/eksekusi,
lihat [Plugin architecture](/id/plugins/architecture). Halaman ini adalah
referensi untuk mekanisme internal: pipeline pemuatan, registry, hook runtime,
rute HTTP Gateway, path import, dan tabel schema.

## Pipeline pemuatan

Saat startup, OpenClaw secara kasar melakukan ini:

1. menemukan kandidat root Plugin
2. membaca manifest bundle native atau kompatibel dan metadata paket
3. menolak kandidat yang tidak aman
4. menormalisasi config Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. memutuskan enablement untuk setiap kandidat
6. memuat modul native yang diaktifkan: modul bundled yang sudah dibangun menggunakan native loader;
   Plugin native yang belum dibangun menggunakan jiti
7. memanggil hook native `register(api)` dan mengumpulkan registrasi ke dalam registry Plugin
8. mengekspos registry ke permukaan perintah/runtime

<Note>
`activate` adalah alias legacy untuk `register` — loader me-resolve mana pun yang ada (`def.register ?? def.activate`) dan memanggilnya pada titik yang sama. Semua Plugin bundled menggunakan `register`; gunakan `register` untuk Plugin baru.
</Note>

Gerbang keamanan terjadi **sebelum** eksekusi runtime. Kandidat diblokir
saat entri keluar dari root Plugin, path dapat ditulis oleh world, atau
kepemilikan path tampak mencurigakan untuk Plugin non-bundled.

### Perilaku manifest-first

Manifest adalah sumber kebenaran control-plane. OpenClaw menggunakannya untuk:

- mengidentifikasi Plugin
- menemukan channel/Skills/schema config yang dideklarasikan atau kapabilitas bundle
- memvalidasi `plugins.entries.<id>.config`
- menambah label/placeholder Control UI
- menampilkan metadata install/katalog
- mempertahankan deskriptor aktivasi dan setup yang ringan tanpa memuat runtime Plugin

Untuk Plugin native, modul runtime adalah bagian data-plane. Modul ini mendaftarkan
perilaku aktual seperti hook, tool, perintah, atau alur provider.

Blok `activation` dan `setup` manifest opsional tetap berada di control plane.
Blok-blok ini adalah deskriptor khusus metadata untuk perencanaan aktivasi dan penemuan setup;
blok-blok ini tidak menggantikan registrasi runtime, `register(...)`, atau `setupEntry`.
Konsumen aktivasi live pertama kini menggunakan petunjuk perintah, channel, dan provider manifest
untuk mempersempit pemuatan Plugin sebelum materialisasi registry yang lebih luas:

- Pemuatan CLI dipersempit ke Plugin yang memiliki primary command yang diminta
- Resolusi setup/channel Plugin dipersempit ke Plugin yang memiliki
  id channel yang diminta
- Resolusi setup/runtime provider eksplisit dipersempit ke Plugin yang memiliki
  id provider yang diminta

Planner aktivasi mengekspos API khusus id untuk caller yang ada dan
API plan untuk diagnostik baru. Entri plan melaporkan mengapa sebuah Plugin dipilih,
memisahkan petunjuk planner eksplisit `activation.*` dari fallback kepemilikan manifest
seperti `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, dan hook. Pemisahan alasan itu adalah batas kompatibilitas:
metadata Plugin yang ada tetap berfungsi, sementara kode baru dapat mendeteksi petunjuk luas
atau perilaku fallback tanpa mengubah semantik pemuatan runtime.

Penemuan setup sekarang lebih memilih id milik deskriptor seperti `setup.providers` dan
`setup.cliBackends` untuk mempersempit kandidat Plugin sebelum fallback ke
`setup-api` untuk Plugin yang masih memerlukan hook runtime waktu setup. Daftar setup provider
menggunakan `providerAuthChoices` manifest, pilihan setup turunan deskriptor, dan metadata katalog install tanpa memuat runtime provider. `setup.requiresRuntime: false` eksplisit adalah cutoff khusus deskriptor; `requiresRuntime` yang tidak diisi mempertahankan fallback `setup-api` legacy untuk kompatibilitas. Jika lebih dari
satu Plugin yang ditemukan mengklaim id provider setup atau backend CLI ternormalisasi yang sama, pencarian setup menolak pemilik yang ambigu alih-alih bergantung pada urutan penemuan. Saat runtime setup benar-benar dieksekusi, diagnostik registry melaporkan drift antara `setup.providers` / `setup.cliBackends` dan provider atau backend CLI yang didaftarkan oleh setup-api tanpa memblokir Plugin legacy.

### Apa yang di-cache oleh loader

OpenClaw menyimpan cache in-process jangka pendek untuk:

- hasil penemuan
- data registry manifest
- registry Plugin yang dimuat

Cache ini mengurangi startup yang meledak-ledak dan overhead perintah berulang. Cache ini aman
untuk dipahami sebagai cache performa berumur pendek, bukan persistensi.

Catatan performa:

- Atur `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` atau
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` untuk menonaktifkan cache ini.
- Sesuaikan jendela cache dengan `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` dan
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Model registry

Plugin yang dimuat tidak secara langsung mengubah global core secara acak. Mereka mendaftar ke
registry Plugin pusat.

Registry melacak:

- catatan Plugin (identitas, sumber, origin, status, diagnostik)
- tool
- hook legacy dan hook bertipe
- channel
- provider
- handler RPC gateway
- rute HTTP
- registrar CLI
- layanan latar belakang
- perintah milik Plugin

Fitur core lalu membaca dari registry itu alih-alih berbicara langsung ke modul Plugin.
Ini menjaga pemuatan tetap satu arah:

- modul Plugin -> registrasi registry
- runtime core -> konsumsi registry

Pemisahan itu penting untuk kemudahan pemeliharaan. Artinya sebagian besar permukaan core hanya
memerlukan satu titik integrasi: "baca registry", bukan "perlakukan khusus setiap modul Plugin".

## Callback binding percakapan

Plugin yang mengikat percakapan dapat bereaksi saat persetujuan diselesaikan.

Gunakan `api.onConversationBindingResolved(...)` untuk menerima callback setelah permintaan bind
disetujui atau ditolak:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Sebuah binding sekarang ada untuk plugin + percakapan ini.
        console.log(event.binding?.conversationId);
        return;
      }

      // Permintaan ditolak; bersihkan state pending lokal.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Field payload callback:

- `status`: `"approved"` atau `"denied"`
- `decision`: `"allow-once"`, `"allow-always"`, atau `"deny"`
- `binding`: binding hasil resolusi untuk permintaan yang disetujui
- `request`: ringkasan permintaan asli, petunjuk detach, id pengirim, dan
  metadata percakapan

Callback ini hanya untuk notifikasi. Ini tidak mengubah siapa yang diizinkan untuk mengikat
percakapan, dan berjalan setelah penanganan persetujuan core selesai.

## Hook runtime provider

Plugin provider memiliki tiga lapisan:

- **Metadata manifest** untuk lookup pra-runtime yang ringan:
  `setup.providers[].envVars`, kompatibilitas deprecated `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices`, dan `channelEnvVars`.
- **Hook waktu config**: `catalog` (legacy `discovery`) plus
  `applyConfigDefaults`.
- **Hook runtime**: 40+ hook opsional yang mencakup auth, resolusi model,
  pembungkusan stream, level thinking, kebijakan replay, dan endpoint penggunaan. Lihat
  daftar lengkap di bawah [Urutan dan penggunaan hook](#hook-order-and-usage).

OpenClaw tetap memiliki loop agent generik, failover, penanganan transkrip, dan
kebijakan tool. Hook-hook ini adalah permukaan ekstensi untuk perilaku khusus provider
tanpa memerlukan seluruh transport inferensi kustom.

Gunakan manifest `setup.providers[].envVars` saat provider memiliki kredensial berbasis env
yang perlu dilihat oleh jalur auth/status/model-picker generik tanpa
memuat runtime Plugin. `providerAuthEnvVars` yang deprecated masih dibaca oleh
adapter kompatibilitas selama jendela deprecation, dan Plugin non-bundled
yang menggunakannya menerima diagnostik manifest. Gunakan manifest `providerAuthAliases`
saat satu id provider harus menggunakan ulang env vars, auth profile,
auth berbasis config, dan pilihan onboarding API key milik id provider lain. Gunakan manifest
`providerAuthChoices` saat permukaan CLI onboarding/pilihan auth perlu mengetahui
id pilihan provider, label grup, dan wiring auth satu-flag sederhana tanpa
memuat runtime provider. Pertahankan runtime provider
`envVars` untuk petunjuk yang menghadap operator seperti label onboarding atau
variabel setup client-id/client-secret OAuth.

Gunakan manifest `channelEnvVars` saat sebuah channel memiliki auth atau setup berbasis env yang
perlu dilihat oleh fallback shell-env generik, pemeriksaan config/status, atau prompt setup
tanpa memuat runtime channel.

### Urutan dan penggunaan hook

Untuk Plugin model/provider, OpenClaw memanggil hook dalam urutan kasar berikut.
Kolom "Kapan digunakan" adalah panduan keputusan cepat.

| #   | Hook                              | Fungsinya                                                                                                      | Kapan digunakan                                                                                                                               |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Memublikasikan config provider ke `models.providers` selama pembuatan `models.json`                           | Provider memiliki katalog atau default base URL                                                                                               |
| 2   | `applyConfigDefaults`             | Menerapkan default config global milik provider selama materialisasi config                                    | Default bergantung pada mode auth, env, atau semantik keluarga model provider                                                                 |
| --  | _(lookup model bawaan)_           | OpenClaw mencoba jalur registry/katalog normal terlebih dahulu                                                 | _(bukan hook Plugin)_                                                                                                                         |
| 3   | `normalizeModelId`                | Menormalkan alias model-id legacy atau preview sebelum lookup                                                  | Provider memiliki pembersihan alias sebelum resolusi model kanonis                                                                            |
| 4   | `normalizeTransport`              | Menormalkan `api` / `baseUrl` keluarga provider sebelum perakitan model generik                               | Provider memiliki pembersihan transport untuk id provider kustom dalam keluarga transport yang sama                                           |
| 5   | `normalizeConfig`                 | Menormalkan `models.providers.<id>` sebelum resolusi runtime/provider                                          | Provider memerlukan pembersihan config yang sebaiknya berada bersama Plugin; helper keluarga Google bawaan juga menjadi backstop untuk entri config Google yang didukung |
| 6   | `applyNativeStreamingUsageCompat` | Menerapkan penulisan ulang kompatibilitas native streaming-usage ke provider config                            | Provider memerlukan perbaikan metadata native streaming usage berbasis endpoint                                                               |
| 7   | `resolveConfigApiKey`             | Meneresolusikan auth env-marker untuk provider config sebelum pemuatan auth runtime                            | Provider memiliki resolusi API key env-marker milik provider; `amazon-bedrock` juga memiliki resolver env-marker AWS bawaan di sini          |
| 8   | `resolveSyntheticAuth`            | Menampilkan auth lokal/self-hosted atau berbasis config tanpa menyimpan plaintext                              | Provider dapat beroperasi dengan penanda kredensial sintetis/lokal                                                                            |
| 9   | `resolveExternalAuthProfiles`     | Melapisi auth profile eksternal milik provider; default `persistence` adalah `runtime-only` untuk kredensial milik CLI/app | Provider menggunakan ulang kredensial auth eksternal tanpa menyimpan refresh token yang disalin; deklarasikan `contracts.externalAuthProviders` di manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Menurunkan prioritas placeholder profil sintetis yang disimpan di bawah auth berbasis env/config              | Provider menyimpan profil placeholder sintetis yang tidak seharusnya menang dalam prioritas                                                   |
| 11  | `resolveDynamicModel`             | Fallback sinkron untuk id model milik provider yang belum ada di registry lokal                                | Provider menerima id model upstream arbitrer                                                                                                  |
| 12  | `prepareDynamicModel`             | Warm-up async, lalu `resolveDynamicModel` dijalankan lagi                                                      | Provider memerlukan metadata jaringan sebelum meresolusikan id yang tidak dikenal                                                             |
| 13  | `normalizeResolvedModel`          | Penulisan ulang akhir sebelum runner tersemat menggunakan model yang diresolusikan                             | Provider memerlukan penulisan ulang transport tetapi tetap menggunakan transport core                                                         |
| 14  | `contributeResolvedModelCompat`   | Menyumbangkan flag kompatibilitas untuk model vendor di balik transport kompatibel lain                        | Provider mengenali modelnya sendiri pada transport proxy tanpa mengambil alih provider                                                        |
| 15  | `capabilities`                    | Metadata transkrip/tooling milik provider yang digunakan oleh logika core bersama                              | Provider memerlukan keanehan transkrip/keluarga provider                                                                                      |
| 16  | `normalizeToolSchemas`            | Menormalkan schema tool sebelum runner tersemat melihatnya                                                     | Provider memerlukan pembersihan schema keluarga transport                                                                                     |
| 17  | `inspectToolSchemas`              | Menampilkan diagnostik schema milik provider setelah normalisasi                                               | Provider menginginkan peringatan keyword tanpa mengajarkan aturan khusus provider ke core                                                     |
| 18  | `resolveReasoningOutputMode`      | Memilih kontrak output reasoning native vs bertag                                                              | Provider memerlukan output reasoning/final bertag alih-alih field native                                                                      |
| 19  | `prepareExtraParams`              | Normalisasi parameter permintaan sebelum wrapper opsi stream generik                                            | Provider memerlukan parameter permintaan default atau pembersihan parameter per-provider                                                      |
| 20  | `createStreamFn`                  | Mengganti sepenuhnya jalur stream normal dengan transport kustom                                               | Provider memerlukan wire protocol kustom, bukan sekadar wrapper                                                                               |
| 21  | `wrapStreamFn`                    | Wrapper stream setelah wrapper generik diterapkan                                                              | Provider memerlukan wrapper header/body/model compat permintaan tanpa transport kustom                                                        |
| 22  | `resolveTransportTurnState`       | Melampirkan header atau metadata transport native per-turn                                                     | Provider ingin transport generik mengirim identitas giliran native milik provider                                                             |
| 23  | `resolveWebSocketSessionPolicy`   | Melampirkan header WebSocket native atau kebijakan cool-down sesi                                              | Provider ingin transport WS generik menyesuaikan header sesi atau kebijakan fallback                                                          |
| 24  | `formatApiKey`                    | Formatter auth-profile: profil yang disimpan menjadi string `apiKey` runtime                                   | Provider menyimpan metadata auth tambahan dan memerlukan bentuk token runtime kustom                                                          |
| 25  | `refreshOAuth`                    | Override refresh OAuth untuk endpoint refresh kustom atau kebijakan kegagalan refresh                          | Provider tidak cocok dengan refresher `pi-ai` bersama                                                                                         |
| 26  | `buildAuthDoctorHint`             | Petunjuk perbaikan yang ditambahkan saat refresh OAuth gagal                                                   | Provider memerlukan panduan perbaikan auth milik provider setelah kegagalan refresh                                                           |
| 27  | `matchesContextOverflowError`     | Matcher overflow context milik provider                                                                        | Provider memiliki error overflow mentah yang tidak terjangkau oleh heuristik generik                                                          |
| 28  | `classifyFailoverReason`          | Klasifikasi alasan failover milik provider                                                                     | Provider dapat memetakan error API/transport mentah ke rate-limit/overload/dll                                                                |
| 29  | `isCacheTtlEligible`              | Kebijakan prompt-cache untuk provider proxy/backhaul                                                           | Provider memerlukan gating cache TTL khusus proxy                                                                                             |
| 30  | `buildMissingAuthMessage`         | Pengganti untuk pesan pemulihan missing-auth generik                                                           | Provider memerlukan petunjuk pemulihan missing-auth khusus provider                                                                           |
| 31  | `suppressBuiltInModel`            | Penekanan model upstream basi plus petunjuk error opsional yang terlihat pengguna                              | Provider perlu menyembunyikan baris upstream basi atau menggantinya dengan petunjuk vendor                                                    |
| 32  | `augmentModelCatalog`             | Baris katalog sintetis/akhir yang ditambahkan setelah penemuan                                                 | Provider memerlukan baris forward-compat sintetis di `models list` dan picker                                                                 |
| 33  | `resolveThinkingProfile`          | Set level `/think` spesifik model, label tampilan, dan default                                                 | Provider mengekspos jenjang thinking kustom atau label biner untuk model yang dipilih                                                         |
| 34  | `isBinaryThinking`                | Hook kompatibilitas toggle reasoning on/off                                                                    | Provider hanya mengekspos thinking biner aktif/nonaktif                                                                                       |
| 35  | `supportsXHighThinking`           | Hook kompatibilitas dukungan reasoning `xhigh`                                                                 | Provider menginginkan `xhigh` hanya pada sebagian model                                                                                       |
| 36  | `resolveDefaultThinkingLevel`     | Hook kompatibilitas default level `/think`                                                                     | Provider memiliki kebijakan default `/think` untuk keluarga model                                                                             |
| 37  | `isModernModelRef`                | Matcher model modern untuk filter profil live dan pemilihan smoke                                              | Provider memiliki pencocokan preferred-model live/smoke                                                                                       |
| 38  | `prepareRuntimeAuth`              | Menukar kredensial yang dikonfigurasi menjadi token/key runtime aktual tepat sebelum inferensi                | Provider memerlukan pertukaran token atau kredensial permintaan berumur pendek                                                               |
| 39  | `resolveUsageAuth`                | Meresolusikan kredensial usage/billing untuk `/usage` dan permukaan status terkait                            | Provider memerlukan parsing token usage/kuota kustom atau kredensial usage yang berbeda                                                      |
| 40  | `fetchUsageSnapshot`              | Mengambil dan menormalkan snapshot usage/kuota khusus provider setelah auth diresolusikan                     | Provider memerlukan endpoint usage atau parser payload khusus provider                                                                        |
| 41  | `createEmbeddingProvider`         | Membangun adapter embedding milik provider untuk memory/search                                                 | Perilaku embedding Memory sebaiknya berada bersama Plugin provider                                                                            |
| 42  | `buildReplayPolicy`               | Mengembalikan kebijakan replay yang mengontrol penanganan transkrip untuk provider                             | Provider memerlukan kebijakan transkrip kustom (misalnya penghapusan blok thinking)                                                          |
| 43  | `sanitizeReplayHistory`           | Menulis ulang riwayat replay setelah pembersihan transkrip generik                                             | Provider memerlukan penulisan ulang replay khusus provider di luar helper Compaction bersama                                                  |
| 44  | `validateReplayTurns`             | Validasi atau pembentukan ulang replay-turn akhir sebelum runner tersemat                                      | Transport provider memerlukan validasi giliran yang lebih ketat setelah sanitasi generik                                                     |
| 45  | `onModelSelected`                 | Menjalankan efek samping pasca-pemilihan milik provider                                                        | Provider memerlukan telemetri atau state milik provider saat sebuah model menjadi aktif                                                      |

`normalizeModelId`, `normalizeTransport`, dan `normalizeConfig` pertama-tama memeriksa
Plugin provider yang cocok, lalu meneruskan ke Plugin provider lain yang mendukung hook
sampai salah satunya benar-benar mengubah model id atau transport/config. Ini menjaga
shim provider alias/compat tetap berfungsi tanpa mengharuskan caller mengetahui Plugin bundled mana yang memiliki penulisan ulang tersebut. Jika tidak ada hook provider yang menulis ulang entri config keluarga Google yang didukung, normalizer config Google bawaan tetap menerapkan pembersihan kompatibilitas tersebut.

Jika provider memerlukan wire protocol kustom penuh atau eksekutor permintaan kustom,
itu adalah kelas ekstensi yang berbeda. Hook-hook ini ditujukan untuk perilaku provider
yang tetap berjalan pada loop inferensi normal OpenClaw.

### Contoh provider

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Contoh bawaan

Plugin provider bundled menggabungkan hook-hook di atas agar sesuai dengan kebutuhan katalog,
auth, thinking, replay, dan usage masing-masing vendor. Set hook yang otoritatif berada bersama
setiap Plugin di bawah `extensions/`; halaman ini mengilustrasikan bentuknya alih-alih
mencerminkan daftarnya.

<AccordionGroup>
  <Accordion title="Provider katalog pass-through">
    OpenRouter, Kilocode, Z.AI, xAI mendaftarkan `catalog` plus
    `resolveDynamicModel` / `prepareDynamicModel` sehingga mereka dapat menampilkan
    model id upstream sebelum katalog statis OpenClaw.
  </Accordion>
  <Accordion title="Provider OAuth dan endpoint usage">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai memasangkan
    `prepareRuntimeAuth` atau `formatApiKey` dengan `resolveUsageAuth` +
    `fetchUsageSnapshot` untuk memiliki pertukaran token dan integrasi `/usage`.
  </Accordion>
  <Accordion title="Keluarga pembersihan replay dan transkrip">
    Keluarga bernama bersama (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) memungkinkan provider ikut serta
    dalam kebijakan transkrip melalui `buildReplayPolicy` alih-alih setiap Plugin
    mengimplementasikan ulang pembersihan.
  </Accordion>
  <Accordion title="Provider khusus katalog">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway`, dan
    `volcengine` hanya mendaftarkan `catalog` dan menggunakan loop inferensi bersama.
  </Accordion>
  <Accordion title="Helper stream khusus Anthropic">
    Beta header, `/fast` / `serviceTier`, dan `context1m` berada di dalam
    seam publik `api.ts` / `contract-api.ts` milik Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) alih-alih di
    SDK generik.
  </Accordion>
</AccordionGroup>

## Helper runtime

Plugin dapat mengakses helper core tertentu melalui `api.runtime`. Untuk TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Catatan:

- `textToSpeech` mengembalikan payload output TTS core normal untuk permukaan file/catatan suara.
- Menggunakan konfigurasi core `messages.tts` dan pemilihan provider.
- Mengembalikan buffer audio PCM + sample rate. Plugin harus melakukan resample/encode untuk provider.
- `listVoices` bersifat opsional per provider. Gunakan ini untuk picker suara milik vendor atau alur setup.
- Daftar suara dapat menyertakan metadata yang lebih kaya seperti locale, gender, dan tag kepribadian untuk picker yang sadar provider.
- OpenAI dan ElevenLabs mendukung telephony saat ini. Microsoft tidak.

Plugin juga dapat mendaftarkan speech provider melalui `api.registerSpeechProvider(...)`.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Catatan:

- Pertahankan kebijakan TTS, fallback, dan pengiriman balasan di core.
- Gunakan speech provider untuk perilaku sintesis milik vendor.
- Input `edge` Microsoft legacy dinormalisasi ke id provider `microsoft`.
- Model kepemilikan yang disukai berorientasi perusahaan: satu Plugin vendor dapat memiliki
  provider text, speech, image, dan media masa depan saat OpenClaw menambahkan
  kontrak kapabilitas tersebut.

Untuk image/audio/video understanding, Plugin mendaftarkan satu
provider media-understanding bertipe alih-alih kumpulan key/value generik:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Catatan:

- Pertahankan orkestrasi, fallback, config, dan wiring channel di core.
- Pertahankan perilaku vendor di Plugin provider.
- Ekspansi aditif harus tetap bertipe: method opsional baru, field hasil opsional baru, kapabilitas opsional baru.
- Pembuatan video sudah mengikuti pola yang sama:
  - core memiliki kontrak kapabilitas dan helper runtime
  - Plugin vendor mendaftarkan `api.registerVideoGenerationProvider(...)`
  - Plugin fitur/channel menggunakan `api.runtime.videoGeneration.*`

Untuk helper runtime media-understanding, Plugin dapat memanggil:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

Untuk transkripsi audio, Plugin dapat menggunakan runtime media-understanding
atau alias STT yang lebih lama:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Opsional saat MIME tidak dapat diinferensikan dengan andal:
  mime: "audio/ogg",
});
```

Catatan:

- `api.runtime.mediaUnderstanding.*` adalah permukaan bersama yang disukai untuk
  image/audio/video understanding.
- Menggunakan konfigurasi audio media-understanding core (`tools.media.audio`) dan urutan fallback provider.
- Mengembalikan `{ text: undefined }` saat tidak ada output transkripsi yang dihasilkan (misalnya input dilewati/tidak didukung).
- `api.runtime.stt.transcribeAudioFile(...)` tetap tersedia sebagai alias kompatibilitas.

Plugin juga dapat meluncurkan eksekusi subagent latar belakang melalui `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Catatan:

- `provider` dan `model` adalah override per-run opsional, bukan perubahan sesi persisten.
- OpenClaw hanya menghormati field override tersebut untuk caller tepercaya.
- Untuk eksekusi fallback milik Plugin, operator harus melakukan opt-in dengan `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Gunakan `plugins.entries.<id>.subagent.allowedModels` untuk membatasi Plugin tepercaya ke target `provider/model` kanonis tertentu, atau `"*"` untuk mengizinkan target apa pun secara eksplisit.
- Eksekusi subagent Plugin tidak tepercaya tetap berfungsi, tetapi permintaan override ditolak alih-alih diam-diam fallback.

Untuk pencarian web, Plugin dapat menggunakan helper runtime bersama alih-alih
menjangkau wiring tool agent:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Plugin juga dapat mendaftarkan web-search provider melalui
`api.registerWebSearchProvider(...)`.

Catatan:

- Pertahankan pemilihan provider, resolusi kredensial, dan semantik permintaan bersama di core.
- Gunakan web-search provider untuk transport pencarian khusus vendor.
- `api.runtime.webSearch.*` adalah permukaan bersama yang disukai untuk Plugin fitur/channel yang memerlukan perilaku pencarian tanpa bergantung pada wrapper tool agent.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: hasilkan image menggunakan rantai provider image-generation yang dikonfigurasi.
- `listProviders(...)`: daftarkan provider image-generation yang tersedia beserta kapabilitasnya.

## Rute HTTP Gateway

Plugin dapat mengekspos endpoint HTTP dengan `api.registerHttpRoute(...)`.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Field rute:

- `path`: path rute di bawah server HTTP gateway.
- `auth`: wajib. Gunakan `"gateway"` untuk mewajibkan auth gateway normal, atau `"plugin"` untuk auth/verifikasi Webhook yang dikelola Plugin.
- `match`: opsional. `"exact"` (default) atau `"prefix"`.
- `replaceExisting`: opsional. Mengizinkan Plugin yang sama mengganti registrasi rute miliknya sendiri yang sudah ada.
- `handler`: kembalikan `true` saat rute menangani permintaan.

Catatan:

- `api.registerHttpHandler(...)` telah dihapus dan akan menyebabkan error pemuatan Plugin. Gunakan `api.registerHttpRoute(...)` sebagai gantinya.
- Rute Plugin harus mendeklarasikan `auth` secara eksplisit.
- Konflik `path + match` exact ditolak kecuali `replaceExisting: true`, dan satu Plugin tidak dapat mengganti rute Plugin lain.
- Rute yang tumpang tindih dengan level `auth` yang berbeda akan ditolak. Pertahankan rantai fallthrough `exact`/`prefix` hanya pada level auth yang sama.
- Rute `auth: "plugin"` **tidak** otomatis menerima scope runtime operator. Rute ini ditujukan untuk verifikasi Webhook/tanda tangan yang dikelola Plugin, bukan panggilan helper Gateway berprivilegi.
- Rute `auth: "gateway"` berjalan di dalam scope runtime permintaan Gateway, tetapi scope itu sengaja konservatif:
  - auth bearer shared-secret (`gateway.auth.mode = "token"` / `"password"`) menjaga scope runtime rute-Plugin tetap terkunci ke `operator.write`, bahkan jika caller mengirim `x-openclaw-scopes`
  - mode HTTP pembawa identitas tepercaya (misalnya `trusted-proxy` atau `gateway.auth.mode = "none"` pada ingress privat) hanya menghormati `x-openclaw-scopes` saat header tersebut hadir secara eksplisit
  - jika `x-openclaw-scopes` tidak ada pada permintaan rute-Plugin pembawa identitas tersebut, scope runtime fallback ke `operator.write`
- Aturan praktis: jangan berasumsi bahwa rute Plugin ber-auth gateway adalah permukaan admin implisit. Jika rute Anda memerlukan perilaku khusus admin, wajibkan mode auth pembawa identitas dan dokumentasikan kontrak header `x-openclaw-scopes` yang eksplisit.

## Path import SDK Plugin

Gunakan subpath SDK yang sempit alih-alih root barrel monolitik `openclaw/plugin-sdk`
saat menulis Plugin baru. Subpath core:

| Subpath                             | Tujuan                                             |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitive registrasi Plugin                        |
| `openclaw/plugin-sdk/channel-core`  | Helper entry/build channel                         |
| `openclaw/plugin-sdk/core`          | Helper bersama generik dan kontrak payung          |
| `openclaw/plugin-sdk/config-schema` | Schema Zod root `openclaw.json` (`OpenClawSchema`) |

Plugin channel memilih dari keluarga seam sempit — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, dan `channel-actions`. Perilaku persetujuan sebaiknya dikonsolidasikan
pada satu kontrak `approvalCapability` alih-alih dicampur di berbagai field
Plugin yang tidak terkait. Lihat [Channel plugins](/id/plugins/sdk-channel-plugins).

Helper runtime dan config berada di bawah subpath `*-runtime` yang sesuai
(`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store`, dll.).

<Info>
`openclaw/plugin-sdk/channel-runtime` sudah deprecated — shim kompatibilitas untuk
Plugin lama. Kode baru sebaiknya mengimpor primitive generik yang lebih sempit.
</Info>

Titik masuk internal repo (per root paket Plugin bundled):

- `index.js` — entry Plugin bundled
- `api.js` — barrel helper/tipe
- `runtime-api.js` — barrel khusus runtime
- `setup-entry.js` — entry Plugin setup

Plugin eksternal hanya boleh mengimpor subpath `openclaw/plugin-sdk/*`. Jangan
pernah mengimpor `src/*` dari paket Plugin lain dari core atau dari Plugin lain.
Titik masuk yang dimuat melalui facade lebih memilih snapshot config runtime aktif bila ada, lalu fallback ke file config yang diresolusikan di disk.

Subpath khusus kapabilitas seperti `image-generation`, `media-understanding`,
dan `speech` ada karena Plugin bundled menggunakannya saat ini. Subpath tersebut tidak
secara otomatis menjadi kontrak eksternal jangka panjang yang dibekukan — periksa halaman
referensi SDK yang relevan saat bergantung padanya.

## Schema tool pesan

Plugin sebaiknya memiliki kontribusi schema `describeMessageTool(...)` khusus channel
untuk primitive non-pesan seperti reaksi, pembacaan, dan poll.
Presentasi kirim bersama sebaiknya menggunakan kontrak generik `MessagePresentation`
alih-alih field tombol, komponen, blok, atau kartu native provider.
Lihat [Message Presentation](/id/plugins/message-presentation) untuk kontrak,
aturan fallback, pemetaan provider, dan checklist penulis Plugin.

Plugin yang mampu mengirim mendeklarasikan apa yang dapat dirender melalui kapabilitas pesan:

- `presentation` untuk blok presentasi semantik (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` untuk permintaan pengiriman yang dipin

Core memutuskan apakah akan merender presentasi secara native atau menurunkannya menjadi teks.
Jangan mengekspos escape hatch UI native provider dari tool pesan generik.
Helper SDK deprecated untuk schema native legacy tetap diekspor untuk Plugin pihak ketiga
yang sudah ada, tetapi Plugin baru sebaiknya tidak menggunakannya.

## Resolusi target channel

Plugin channel sebaiknya memiliki semantik target khusus channel. Pertahankan host outbound
bersama tetap generik dan gunakan permukaan adapter perpesanan untuk aturan provider:

- `messaging.inferTargetChatType({ to })` memutuskan apakah target ternormalisasi
  harus diperlakukan sebagai `direct`, `group`, atau `channel` sebelum lookup direktori.
- `messaging.targetResolver.looksLikeId(raw, normalized)` memberi tahu core apakah sebuah
  input harus langsung melewati ke resolusi mirip-id alih-alih pencarian direktori.
- `messaging.targetResolver.resolveTarget(...)` adalah fallback Plugin saat
  core memerlukan resolusi akhir milik provider setelah normalisasi atau setelah
  directory miss.
- `messaging.resolveOutboundSessionRoute(...)` memiliki konstruksi rute sesi
  khusus provider setelah target diresolusikan.

Pemisahan yang direkomendasikan:

- Gunakan `inferTargetChatType` untuk keputusan kategori yang harus terjadi sebelum
  mencari peer/group.
- Gunakan `looksLikeId` untuk pemeriksaan "perlakukan ini sebagai id target eksplisit/native".
- Gunakan `resolveTarget` untuk fallback normalisasi khusus provider, bukan untuk
  pencarian direktori yang luas.
- Pertahankan id native provider seperti chat id, thread id, JID, handle, dan room
  id di dalam nilai `target` atau parameter khusus provider, bukan di field SDK generik.

## Direktori berbasis config

Plugin yang menurunkan entri direktori dari config sebaiknya mempertahankan logika itu di
Plugin dan menggunakan ulang helper bersama dari
`openclaw/plugin-sdk/directory-runtime`.

Gunakan ini saat sebuah channel memerlukan peer/group berbasis config seperti:

- peer DM yang digerakkan allowlist
- peta channel/group yang dikonfigurasi
- fallback direktori statis yang dicakup akun

Helper bersama di `directory-runtime` hanya menangani operasi generik:

- penyaringan kueri
- penerapan limit
- helper deduping/normalisasi
- membangun `ChannelDirectoryEntry[]`

Inspeksi akun khusus channel dan normalisasi id sebaiknya tetap berada di
implementasi Plugin.

## Katalog provider

Plugin provider dapat mendefinisikan katalog model untuk inferensi dengan
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` mengembalikan bentuk yang sama dengan yang ditulis OpenClaw ke dalam
`models.providers`:

- `{ provider }` untuk satu entri provider
- `{ providers }` untuk beberapa entri provider

Gunakan `catalog` saat Plugin memiliki model id khusus provider, default base URL,
atau metadata model yang digerakkan auth.

`catalog.order` mengontrol kapan katalog Plugin digabung relatif terhadap provider implisit bawaan OpenClaw:

- `simple`: provider berbasis API key atau env biasa
- `profile`: provider yang muncul saat auth profile ada
- `paired`: provider yang mensintesis beberapa entri provider terkait
- `late`: pass terakhir, setelah provider implisit lainnya

Provider yang datang belakangan menang pada benturan key, sehingga Plugin dapat secara sengaja menimpa
entri provider bawaan dengan id provider yang sama.

Kompatibilitas:

- `discovery` masih berfungsi sebagai alias legacy
- jika `catalog` dan `discovery` sama-sama didaftarkan, OpenClaw menggunakan `catalog`

## Inspeksi channel baca-saja

Jika Plugin Anda mendaftarkan sebuah channel, lebih baik mengimplementasikan
`plugin.config.inspectAccount(cfg, accountId)` bersama `resolveAccount(...)`.

Mengapa:

- `resolveAccount(...)` adalah jalur runtime. Method ini boleh berasumsi bahwa kredensial
  telah sepenuhnya dimaterialisasikan dan dapat gagal cepat saat secret yang diperlukan hilang.
- Jalur perintah baca-saja seperti `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, dan alur doctor/perbaikan
  config tidak seharusnya perlu mematerialisasikan kredensial runtime hanya untuk
  menjelaskan konfigurasi.

Perilaku `inspectAccount(...)` yang direkomendasikan:

- Kembalikan hanya state akun deskriptif.
- Pertahankan `enabled` dan `configured`.
- Sertakan field source/status kredensial jika relevan, seperti:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Anda tidak perlu mengembalikan nilai token mentah hanya untuk melaporkan ketersediaan baca-saja. Mengembalikan `tokenStatus: "available"` (dan field source yang sesuai) sudah cukup untuk perintah bergaya status.
- Gunakan `configured_unavailable` saat kredensial dikonfigurasi melalui SecretRef tetapi
  tidak tersedia pada jalur perintah saat ini.

Ini memungkinkan perintah baca-saja melaporkan "dikonfigurasi tetapi tidak tersedia pada jalur perintah ini" alih-alih crash atau salah melaporkan akun sebagai belum dikonfigurasi.

## Paket pack

Direktori Plugin dapat menyertakan `package.json` dengan `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Setiap entri menjadi sebuah Plugin. Jika pack mencantumkan beberapa extension, id Plugin
menjadi `name/<fileBase>`.

Jika Plugin Anda mengimpor dependensi npm, instal dependensi tersebut di direktori itu agar
`node_modules` tersedia (`npm install` / `pnpm install`).

Pengaman keamanan: setiap entri `openclaw.extensions` harus tetap berada di dalam direktori Plugin
setelah resolusi symlink. Entri yang keluar dari direktori paket akan
ditolak.

Catatan keamanan: `openclaw plugins install` menginstal dependensi Plugin dengan
`npm install --omit=dev --ignore-scripts` lokal proyek (tanpa lifecycle script,
tanpa dependensi dev saat runtime), mengabaikan pengaturan instalasi npm global yang diwariskan.
Pertahankan tree dependensi Plugin tetap "pure JS/TS" dan hindari paket yang memerlukan
build `postinstall`.

Opsional: `openclaw.setupEntry` dapat menunjuk ke modul setup-only yang ringan.
Saat OpenClaw memerlukan permukaan setup untuk Plugin channel yang dinonaktifkan, atau
saat Plugin channel diaktifkan tetapi masih belum dikonfigurasi, OpenClaw memuat `setupEntry`
alih-alih entry Plugin penuh. Ini menjaga startup dan setup tetap lebih ringan
saat entry Plugin utama Anda juga memasang tool, hook, atau kode khusus runtime lainnya.

Opsional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
dapat memilihkan sebuah Plugin channel ke jalur `setupEntry` yang sama selama fase
startup pra-listen gateway, bahkan saat channel sudah dikonfigurasi.

Gunakan ini hanya ketika `setupEntry` sepenuhnya mencakup permukaan startup yang harus ada
sebelum gateway mulai mendengarkan. Dalam praktiknya, ini berarti entry setup
harus mendaftarkan setiap kapabilitas milik channel yang menjadi dependensi startup, seperti:

- registrasi channel itu sendiri
- setiap rute HTTP yang harus tersedia sebelum gateway mulai mendengarkan
- setiap method gateway, tool, atau layanan yang harus ada selama jendela yang sama

Jika entry penuh Anda masih memiliki kapabilitas startup yang diperlukan, jangan aktifkan
flag ini. Pertahankan perilaku default Plugin dan biarkan OpenClaw memuat
entry penuh saat startup.

Channel bundled juga dapat memublikasikan helper permukaan kontrak khusus setup yang
dapat dikonsultasikan oleh core sebelum runtime channel penuh dimuat. Permukaan promosi setup saat ini adalah:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core menggunakan permukaan tersebut saat perlu mempromosikan config channel akun tunggal legacy
ke `channels.<id>.accounts.*` tanpa memuat entry Plugin penuh.
Matrix adalah contoh bundled saat ini: Matrix hanya memindahkan key auth/bootstrap
ke akun hasil promosi bernama saat akun bernama sudah ada, dan dapat mempertahankan
key default-account non-kanonis yang dikonfigurasi alih-alih selalu membuat
`accounts.default`.

Adapter patch setup tersebut menjaga penemuan permukaan kontrak bundled tetap lazy. Waktu import tetap ringan; permukaan promosi dimuat hanya saat pertama kali digunakan alih-alih memasuki ulang startup channel bundled saat import modul.

Saat permukaan startup tersebut mencakup method RPC gateway, pertahankan method itu pada
prefiks khusus Plugin. Namespace admin core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu diresolusikan
ke `operator.admin`, bahkan jika Plugin meminta scope yang lebih sempit.

Contoh:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Metadata katalog channel

Plugin channel dapat mengiklankan metadata setup/penemuan melalui `openclaw.channel` dan
petunjuk instalasi melalui `openclaw.install`. Ini menjaga data katalog core tetap bebas data.

Contoh:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Chat self-hosted melalui bot Webhook Nextcloud Talk.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

Field `openclaw.channel` yang berguna di luar contoh minimal:

- `detailLabel`: label sekunder untuk permukaan katalog/status yang lebih kaya
- `docsLabel`: timpa teks tautan untuk tautan docs
- `preferOver`: id Plugin/channel prioritas lebih rendah yang harus dikalahkan oleh entri katalog ini
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrol copy permukaan pemilihan
- `markdownCapable`: menandai channel sebagai mampu markdown untuk keputusan format outbound
- `exposure.configured`: sembunyikan channel dari permukaan daftar channel yang telah dikonfigurasi saat diatur ke `false`
- `exposure.setup`: sembunyikan channel dari picker setup/configure interaktif saat diatur ke `false`
- `exposure.docs`: tandai channel sebagai internal/pribadi untuk permukaan navigasi docs
- `showConfigured` / `showInSetup`: alias legacy yang masih diterima untuk kompatibilitas; lebih baik gunakan `exposure`
- `quickstartAllowFrom`: pilih channel ke alur quickstart `allowFrom` standar
- `forceAccountBinding`: wajibkan binding akun eksplisit bahkan saat hanya ada satu akun
- `preferSessionLookupForAnnounceTarget`: lebih pilih lookup sesi saat meresolusikan target announce

OpenClaw juga dapat menggabungkan **katalog channel eksternal** (misalnya, ekspor
registry MPM). Letakkan file JSON di salah satu lokasi berikut:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Atau arahkan `OPENCLAW_PLUGIN_CATALOG_PATHS` (atau `OPENCLAW_MPM_CATALOG_PATHS`) ke
satu atau lebih file JSON (dipisahkan koma/titik koma/`PATH`). Setiap file harus
berisi `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser juga menerima `"packages"` atau `"plugins"` sebagai alias legacy untuk key `"entries"`.

Entri katalog channel yang dihasilkan dan entri katalog instalasi provider mengekspos
fakta install-source yang dinormalisasi di samping blok `openclaw.install` mentah. Fakta
yang dinormalisasi mengidentifikasi apakah spesifikasi npm adalah versi eksak atau selector mengambang, apakah metadata integritas yang diharapkan ada, dan apakah path source lokal juga tersedia. Saat identitas katalog/paket diketahui, fakta yang dinormalisasi memperingatkan jika nama paket npm yang diparse menyimpang dari identitas tersebut.
Fakta-fakta ini juga memperingatkan saat `defaultChoice` tidak valid atau menunjuk ke source yang
tidak tersedia, dan saat metadata integritas npm ada tanpa source npm yang valid.
Konsumen sebaiknya memperlakukan `installSource` sebagai field opsional aditif agar
entri buatan tangan dan shim katalog tidak harus mensintesisnya.
Ini memungkinkan onboarding dan diagnostik menjelaskan state source-plane tanpa
mengimpor runtime Plugin.

Entri npm eksternal resmi sebaiknya lebih memilih `npmSpec` eksak ditambah
`expectedIntegrity`. Nama paket polos dan dist-tag tetap berfungsi demi
kompatibilitas, tetapi keduanya menampilkan peringatan source-plane agar katalog dapat bergerak
menuju instalasi yang dipin dan diperiksa integritasnya tanpa merusak Plugin yang ada.
Saat onboarding menginstal dari path katalog lokal, OpenClaw mencatat entri indeks Plugin managed dengan `source: "path"` dan
`sourcePath` relatif terhadap workspace bila memungkinkan. Path load operasional absolut tetap berada di
`plugins.load.paths`; catatan instalasi menghindari penduplikasian path workstation lokal
ke config berumur panjang. Ini menjaga instalasi pengembangan lokal tetap terlihat oleh
diagnostik source-plane tanpa menambahkan permukaan pengungkapan path filesystem mentah kedua.
Indeks Plugin `plugins/installs.json` yang dipersistenkan adalah sumber kebenaran instalasi dan dapat di-refresh tanpa memuat modul runtime Plugin.
Peta `installRecords` bersifat tahan lama bahkan saat manifest Plugin hilang atau
tidak valid; array `plugins` adalah tampilan cache/manifest yang dapat dibangun ulang.

## Plugin mesin context

Plugin mesin context memiliki orkestrasi context sesi untuk ingest, assembly,
dan Compaction. Daftarkan Plugin tersebut dari Plugin Anda dengan
`api.registerContextEngine(id, factory)`, lalu pilih engine aktif dengan
`plugins.slots.contextEngine`.

Gunakan ini saat Plugin Anda perlu mengganti atau memperluas pipeline context default
alih-alih sekadar menambahkan memory search atau hook.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Jika engine Anda **tidak** memiliki algoritme Compaction, tetap implementasikan `compact()`
dan delegasikan secara eksplisit:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Menambahkan kapabilitas baru

Saat Plugin memerlukan perilaku yang tidak cocok dengan API saat ini, jangan melewati
sistem Plugin dengan reach-in privat. Tambahkan kapabilitas yang kurang.

Urutan yang direkomendasikan:

1. definisikan kontrak core
   Tentukan perilaku bersama apa yang sebaiknya dimiliki core: kebijakan, fallback, penggabungan config,
   lifecycle, semantik yang menghadap channel, dan bentuk helper runtime.
2. tambahkan permukaan registrasi/runtime Plugin bertipe
   Perluas `OpenClawPluginApi` dan/atau `api.runtime` dengan permukaan
   kapabilitas bertipe terkecil yang berguna.
3. sambungkan core + konsumen channel/fitur
   Channel dan Plugin fitur sebaiknya menggunakan kapabilitas baru melalui core,
   bukan dengan mengimpor implementasi vendor secara langsung.
4. daftarkan implementasi vendor
   Plugin vendor kemudian mendaftarkan backend mereka terhadap kapabilitas tersebut.
5. tambahkan cakupan kontrak
   Tambahkan pengujian agar kepemilikan dan bentuk registrasi tetap eksplisit seiring waktu.

Inilah cara OpenClaw tetap opinionated tanpa menjadi hardcoded ke
pandangan satu provider. Lihat [Capability Cookbook](/id/plugins/architecture)
untuk checklist file konkret dan contoh yang sudah dikerjakan.

### Checklist kapabilitas

Saat Anda menambahkan kapabilitas baru, implementasinya biasanya harus menyentuh
permukaan berikut secara bersamaan:

- tipe kontrak core di `src/<capability>/types.ts`
- runner/helper runtime core di `src/<capability>/runtime.ts`
- permukaan registrasi API Plugin di `src/plugins/types.ts`
- wiring registry Plugin di `src/plugins/registry.ts`
- eksposur runtime Plugin di `src/plugins/runtime/*` saat Plugin fitur/channel
  perlu menggunakannya
- helper capture/test di `src/test-utils/plugin-registration.ts`
- assertion kepemilikan/kontrak di `src/plugins/contracts/registry.ts`
- docs operator/Plugin di `docs/`

Jika salah satu permukaan itu tidak ada, biasanya itu pertanda bahwa kapabilitas tersebut
belum sepenuhnya terintegrasi.

### Template kapabilitas

Pola minimal:

```ts
// kontrak core
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API Plugin
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// helper runtime bersama untuk Plugin fitur/channel
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Pola uji kontrak:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Itu menjaga aturannya tetap sederhana:

- core memiliki kontrak kapabilitas + orkestrasi
- Plugin vendor memiliki implementasi vendor
- Plugin fitur/channel menggunakan helper runtime
- uji kontrak menjaga kepemilikan tetap eksplisit

## Terkait

- [Plugin architecture](/id/plugins/architecture) — model dan bentuk kapabilitas publik
- [Subpath SDK Plugin](/id/plugins/sdk-subpaths)
- [Setup SDK Plugin](/id/plugins/sdk-setup)
- [Membangun Plugin](/id/plugins/building-plugins)

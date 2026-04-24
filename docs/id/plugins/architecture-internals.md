---
read_when:
    - Mengimplementasikan hook runtime penyedia, siklus hidup channel, atau pack package
    - Men-debug urutan pemuatan Plugin atau state registry
    - Menambahkan kemampuan Plugin baru atau Plugin mesin konteks
summary: 'Internal arsitektur Plugin: pipeline pemuatan, registry, hook runtime, rute HTTP, dan tabel referensi'
title: Internal arsitektur Plugin
x-i18n:
    generated_at: "2026-04-24T09:18:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9370788c5f986e9205b1108ae633e829edec8890e442a49f80d84bb0098bb393
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Untuk model kemampuan publik, bentuk Plugin, dan kontrak kepemilikan/eksekusi,
lihat [Plugin architecture](/id/plugins/architecture). Halaman ini adalah
referensi untuk mekanik internal: pipeline pemuatan, registry, hook runtime,
rute HTTP Gateway, path impor, dan tabel skema.

## Pipeline pemuatan

Saat startup, OpenClaw secara kasar melakukan ini:

1. menemukan root Plugin kandidat
2. membaca manifes bundle native atau kompatibel serta metadata package
3. menolak kandidat yang tidak aman
4. menormalkan config Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. memutuskan pengaktifan untuk setiap kandidat
6. memuat modul native yang diaktifkan: modul bawaan yang sudah dibangun menggunakan loader native;
   Plugin native yang belum dibangun menggunakan jiti
7. memanggil hook native `register(api)` dan mengumpulkan pendaftaran ke registry Plugin
8. mengekspos registry ke permukaan perintah/runtime

<Note>
`activate` adalah alias legacy untuk `register` — loader meresolusikan yang mana pun yang ada (`def.register ?? def.activate`) dan memanggilnya pada titik yang sama. Semua Plugin bawaan menggunakan `register`; pilih `register` untuk Plugin baru.
</Note>

Gerbang keamanan terjadi **sebelum** eksekusi runtime. Kandidat diblokir
ketika entry keluar dari root Plugin, path dapat ditulis dunia, atau kepemilikan path
terlihat mencurigakan untuk Plugin non-bawaan.

### Perilaku manifest-first

Manifes adalah sumber kebenaran control-plane. OpenClaw menggunakannya untuk:

- mengidentifikasi Plugin
- menemukan channel/Skills/skema config yang dideklarasikan atau kemampuan bundle
- memvalidasi `plugins.entries.<id>.config`
- menambah label/placeholder UI Control
- menampilkan metadata instalasi/katalog
- mempertahankan deskriptor aktivasi dan setup yang murah tanpa memuat runtime Plugin

Untuk Plugin native, modul runtime adalah bagian data-plane. Modul ini mendaftarkan
perilaku aktual seperti hooks, alat, perintah, atau alur penyedia.

Blok manifes `activation` dan `setup` opsional tetap berada di control plane.
Keduanya adalah deskriptor metadata saja untuk perencanaan aktivasi dan penemuan setup;
keduanya tidak menggantikan pendaftaran runtime, `register(...)`, atau `setupEntry`.
Konsumen aktivasi live pertama sekarang menggunakan petunjuk manifes perintah, channel, dan provider
untuk mempersempit pemuatan Plugin sebelum materialisasi registry yang lebih luas:

- Pemuatan CLI dipersempit ke Plugin yang memiliki perintah utama yang diminta
- Resolusi setup/channel Plugin dipersempit ke Plugin yang memiliki id
  channel yang diminta
- Resolusi setup/runtime provider eksplisit dipersempit ke Plugin yang memiliki
  id provider yang diminta

Perencana aktivasi mengekspos API hanya-id untuk pemanggil yang ada dan
API rencana untuk diagnostik baru. Entri rencana melaporkan mengapa sebuah Plugin dipilih,
memisahkan petunjuk perencana `activation.*` eksplisit dari fallback kepemilikan manifes
seperti `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, dan hooks. Pemisahan alasan itulah batas kompatibilitasnya:
metadata Plugin yang ada tetap bekerja, sementara kode baru dapat mendeteksi petunjuk luas
atau perilaku fallback tanpa mengubah semantik pemuatan runtime.

Penemuan setup sekarang lebih memilih id yang dimiliki deskriptor seperti `setup.providers` dan
`setup.cliBackends` untuk mempersempit Plugin kandidat sebelum fallback ke
`setup-api` bagi Plugin yang masih memerlukan hook runtime saat setup. Jika lebih dari
satu Plugin yang ditemukan mengklaim id setup provider atau backend CLI
ternormalisasi yang sama, lookup setup menolak pemilik ambigu tersebut alih-alih mengandalkan urutan penemuan.

### Apa yang di-cache oleh loader

OpenClaw menyimpan cache pendek dalam proses untuk:

- hasil penemuan
- data registry manifes
- registry Plugin yang dimuat

Cache ini mengurangi startup yang meledak-ledak dan overhead perintah berulang. Cache ini aman
untuk dipahami sebagai cache performa berumur pendek, bukan persistensi.

Catatan performa:

- Setel `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` atau
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` untuk menonaktifkan cache ini.
- Sesuaikan jendela cache dengan `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` dan
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Model registry

Plugin yang dimuat tidak langsung mengubah global inti secara acak. Plugin mendaftar ke
registry Plugin pusat.

Registry melacak:

- record Plugin (identitas, sumber, origin, status, diagnostik)
- alat
- hook legacy dan hook bertipe
- channel
- provider
- handler RPC Gateway
- rute HTTP
- registrar CLI
- layanan latar belakang
- perintah milik Plugin

Fitur inti kemudian membaca dari registry tersebut alih-alih berbicara ke modul Plugin
secara langsung. Ini menjaga pemuatan tetap satu arah:

- modul Plugin -> pendaftaran registry
- runtime inti -> konsumsi registry

Pemisahan itu penting untuk pemeliharaan. Artinya sebagian besar permukaan inti hanya
memerlukan satu titik integrasi: "baca registry", bukan "buat kasus khusus untuk setiap modul Plugin".

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
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
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

Callback ini hanya untuk notifikasi. Callback ini tidak mengubah siapa yang diizinkan mengikat
percakapan, dan berjalan setelah penanganan persetujuan inti selesai.

## Hook runtime provider

Plugin provider memiliki tiga lapisan:

- **Metadata manifes** untuk lookup pra-runtime yang murah: `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices`, dan `channelEnvVars`.
- **Hook saat config**: `catalog` (legacy `discovery`) plus
  `applyConfigDefaults`.
- **Hook runtime**: 40+ hook opsional yang mencakup auth, resolusi model,
  pembungkusan stream, thinking levels, kebijakan replay, dan endpoint penggunaan. Lihat
  daftar lengkap di [Hook order and usage](#hook-order-and-usage).

OpenClaw tetap memiliki loop agen generik, failover, penanganan transkrip, dan
kebijakan alat. Hook ini adalah permukaan ekstensi untuk perilaku khusus provider
tanpa memerlukan seluruh transport inferensi kustom.

Gunakan manifes `providerAuthEnvVars` saat provider memiliki kredensial berbasis env
yang seharusnya terlihat oleh jalur auth/status/model-picker generik tanpa memuat runtime Plugin. Gunakan manifes `providerAuthAliases` saat satu id provider seharusnya menggunakan ulang env vars, profil auth, auth berbasis config, dan pilihan onboarding kunci API milik id provider lain. Gunakan manifes `providerAuthChoices` saat onboarding/permukaan CLI pilihan-auth
perlu mengetahui id pilihan provider, label grup, dan wiring auth satu-flag sederhana tanpa memuat runtime provider. Pertahankan `envVars` runtime provider untuk petunjuk yang menghadap operator seperti label onboarding atau var setup OAuth client-id/client-secret.

Gunakan manifes `channelEnvVars` saat channel memiliki auth atau setup yang digerakkan env
yang seharusnya terlihat oleh fallback shell-env generik, pemeriksaan config/status, atau prompt setup tanpa memuat runtime channel.

### Urutan hook dan penggunaan

Untuk Plugin model/provider, OpenClaw memanggil hook dalam urutan kasar ini.
Kolom "When to use" adalah panduan keputusan cepat.

| #   | Hook                              | What it does                                                                                                   | When to use                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Memublikasikan config provider ke `models.providers` selama pembuatan `models.json`                            | Provider memiliki katalog atau default `baseUrl`                                                                                              |
| 2   | `applyConfigDefaults`             | Menerapkan default config global milik provider selama materialisasi config                                    | Default bergantung pada mode auth, env, atau semantik keluarga model provider                                                                 |
| --  | _(built-in model lookup)_         | OpenClaw mencoba jalur registry/katalog normal terlebih dahulu                                                 | _(bukan hook Plugin)_                                                                                                                         |
| 3   | `normalizeModelId`                | Menormalkan alias model-id legacy atau preview sebelum lookup                                                  | Provider memiliki pembersihan alias sebelum resolusi model kanonis                                                                            |
| 4   | `normalizeTransport`              | Menormalkan keluarga provider `api` / `baseUrl` sebelum perakitan model generik                               | Provider memiliki pembersihan transport untuk id provider kustom dalam keluarga transport yang sama                                           |
| 5   | `normalizeConfig`                 | Menormalkan `models.providers.<id>` sebelum resolusi runtime/provider                                          | Provider membutuhkan pembersihan config yang seharusnya hidup bersama Plugin; helper keluarga Google bawaan juga menopang entri config Google yang didukung |
| 6   | `applyNativeStreamingUsageCompat` | Menerapkan penulisan ulang compat native streaming-usage ke provider config                                    | Provider membutuhkan perbaikan metadata native streaming usage yang didorong endpoint                                                          |
| 7   | `resolveConfigApiKey`             | Meresolusikan auth penanda-env untuk provider config sebelum pemuatan auth runtime                             | Provider memiliki resolusi API-key penanda-env milik provider; `amazon-bedrock` juga memiliki resolver penanda-env AWS bawaan di sini        |
| 8   | `resolveSyntheticAuth`            | Menampilkan auth lokal/self-hosted atau berbasis config tanpa mempersistenkan plaintext                        | Provider dapat beroperasi dengan penanda kredensial sintetis/lokal                                                                            |
| 9   | `resolveExternalAuthProfiles`     | Menumpangkan profil auth eksternal milik provider; default `persistence` adalah `runtime-only` untuk kredensial milik CLI/aplikasi | Provider menggunakan ulang kredensial auth eksternal tanpa mempersistenkan token refresh yang disalin; deklarasikan `contracts.externalAuthProviders` di manifes |
| 10  | `shouldDeferSyntheticProfileAuth` | Menurunkan placeholder profil sintetis yang disimpan di bawah auth berbasis env/config                         | Provider menyimpan profil placeholder sintetis yang tidak seharusnya menang dalam prioritas                                                   |
| 11  | `resolveDynamicModel`             | Fallback sinkron untuk id model milik provider yang belum ada di registry lokal                                | Provider menerima id model upstream sebarang                                                                                                   |
| 12  | `prepareDynamicModel`             | Warm-up asinkron, lalu `resolveDynamicModel` dijalankan lagi                                                   | Provider membutuhkan metadata jaringan sebelum meresolusikan id yang tidak dikenal                                                            |
| 13  | `normalizeResolvedModel`          | Penulisan ulang akhir sebelum embedded runner menggunakan model hasil resolusi                                 | Provider membutuhkan penulisan ulang transport tetapi tetap menggunakan transport inti                                                         |
| 14  | `contributeResolvedModelCompat`   | Menyumbangkan flag compat untuk model vendor di balik transport kompatibel lain                                | Provider mengenali modelnya sendiri pada transport proxy tanpa mengambil alih provider                                                         |
| 15  | `capabilities`                    | Metadata transkrip/tooling milik provider yang digunakan oleh logika inti bersama                              | Provider membutuhkan keanehan transkrip/keluarga provider                                                                                     |
| 16  | `normalizeToolSchemas`            | Menormalkan skema alat sebelum embedded runner melihatnya                                                      | Provider membutuhkan pembersihan skema keluarga transport                                                                                      |
| 17  | `inspectToolSchemas`              | Menampilkan diagnostik skema milik provider setelah normalisasi                                                | Provider menginginkan peringatan keyword tanpa mengajari core aturan khusus provider                                                           |
| 18  | `resolveReasoningOutputMode`      | Memilih kontrak output penalaran native vs bertag                                                              | Provider membutuhkan output penalaran/final bertag alih-alih field native                                                                     |
| 19  | `prepareExtraParams`              | Normalisasi param permintaan sebelum wrapper opsi stream generik                                               | Provider membutuhkan param permintaan default atau pembersihan param per-provider                                                              |
| 20  | `createStreamFn`                  | Mengganti sepenuhnya jalur stream normal dengan transport kustom                                               | Provider membutuhkan protokol wire kustom, bukan hanya wrapper                                                                                 |
| 21  | `wrapStreamFn`                    | Wrapper stream setelah wrapper generik diterapkan                                                              | Provider membutuhkan wrapper compat header/body/model permintaan tanpa transport kustom                                                        |
| 22  | `resolveTransportTurnState`       | Melampirkan header atau metadata transport per-giliran native                                                  | Provider ingin transport generik mengirim identitas giliran native provider                                                                    |
| 23  | `resolveWebSocketSessionPolicy`   | Melampirkan header WebSocket native atau kebijakan cool-down sesi                                              | Provider ingin transport WS generik menyetel header sesi atau kebijakan fallback                                                               |
| 24  | `formatApiKey`                    | Formatter auth-profile: profil tersimpan menjadi string `apiKey` runtime                                       | Provider menyimpan metadata auth tambahan dan membutuhkan bentuk token runtime kustom                                                          |
| 25  | `refreshOAuth`                    | Override refresh OAuth untuk endpoint refresh kustom atau kebijakan gagal-refresh                              | Provider tidak cocok dengan refresher `pi-ai` bersama                                                                                          |
| 26  | `buildAuthDoctorHint`             | Petunjuk perbaikan yang ditambahkan saat refresh OAuth gagal                                                   | Provider membutuhkan panduan perbaikan auth milik provider setelah kegagalan refresh                                                           |
| 27  | `matchesContextOverflowError`     | Matcher overflow jendela konteks milik provider                                                                | Provider memiliki galat overflow mentah yang akan terlewat oleh heuristik generik                                                              |
| 28  | `classifyFailoverReason`          | Klasifikasi alasan failover milik provider                                                                     | Provider dapat memetakan galat API/transport mentah ke batas laju/kelebihan beban/dll.                                                        |
| 29  | `isCacheTtlEligible`              | Kebijakan prompt-cache untuk provider proxy/backhaul                                                           | Provider membutuhkan gating TTL cache khusus proxy                                                                                              |
| 30  | `buildMissingAuthMessage`         | Pengganti untuk pesan pemulihan auth-hilang generik                                                            | Provider membutuhkan petunjuk pemulihan auth-hilang khusus provider                                                                             |
| 31  | `suppressBuiltInModel`            | Penekanan model upstream yang basi plus petunjuk galat yang menghadap pengguna secara opsional                | Provider perlu menyembunyikan baris upstream basi atau menggantinya dengan petunjuk vendor                                                     |
| 32  | `augmentModelCatalog`             | Baris katalog sintetis/akhir yang ditambahkan setelah penemuan                                                 | Provider membutuhkan baris forward-compat sintetis di `models list` dan picker                                                                  |
| 33  | `resolveThinkingProfile`          | Set level `/think`, label tampilan, dan default yang spesifik model                                            | Provider mengekspos tangga thinking kustom atau label biner untuk model tertentu                                                                |
| 34  | `isBinaryThinking`                | Hook kompatibilitas toggle penalaran nyala/mati                                                                | Provider hanya mengekspos thinking biner nyala/mati                                                                                            |
| 35  | `supportsXHighThinking`           | Hook kompatibilitas dukungan penalaran `xhigh`                                                                 | Provider ingin `xhigh` hanya pada subset model tertentu                                                                                         |
| 36  | `resolveDefaultThinkingLevel`     | Hook kompatibilitas level `/think` default                                                                     | Provider memiliki kebijakan `/think` default untuk keluarga model                                                                              |
| 37  | `isModernModelRef`                | Matcher model-modern untuk filter profil live dan pemilihan smoke                                              | Provider memiliki pencocokan model pilihan untuk live/smoke                                                                                   |
| 38  | `prepareRuntimeAuth`              | Menukar kredensial yang dikonfigurasi menjadi token/kunci runtime aktual tepat sebelum inferensi              | Provider membutuhkan pertukaran token atau kredensial permintaan berumur pendek                                                               |
| 39  | `resolveUsageAuth`                | Meresolusikan kredensial usage/billing untuk `/usage` dan permukaan status terkait                            | Provider membutuhkan parsing token usage/kuota kustom atau kredensial usage yang berbeda                                                      |
| 40  | `fetchUsageSnapshot`              | Mengambil dan menormalkan snapshot usage/kuota khusus provider setelah auth diresolusikan                     | Provider membutuhkan endpoint usage khusus provider atau parser payload                                                                        |
| 41  | `createEmbeddingProvider`         | Membangun adapter embedding milik provider untuk memory/search                                                 | Perilaku embedding memori seharusnya berada bersama Plugin provider                                                                           |
| 42  | `buildReplayPolicy`               | Mengembalikan kebijakan replay yang mengontrol penanganan transkrip untuk provider                            | Provider membutuhkan kebijakan transkrip kustom (misalnya, pengupasan blok thinking)                                                          |
| 43  | `sanitizeReplayHistory`           | Menulis ulang riwayat replay setelah pembersihan transkrip generik                                             | Provider membutuhkan penulisan ulang replay khusus provider di luar helper Compaction bersama                                                 |
| 44  | `validateReplayTurns`             | Validasi atau pembentukan ulang giliran replay akhir sebelum embedded runner                                   | Transport provider membutuhkan validasi giliran yang lebih ketat setelah sanitasi generik                                                     |
| 45  | `onModelSelected`                 | Menjalankan efek samping pasca-pemilihan milik provider                                                        | Provider membutuhkan telemetry atau state milik provider saat sebuah model menjadi aktif                                                      |

`normalizeModelId`, `normalizeTransport`, dan `normalizeConfig` pertama-tama memeriksa
Plugin provider yang cocok, lalu melanjutkan ke Plugin provider lain yang mampu menangani hook
sampai salah satunya benar-benar mengubah model id atau transport/config. Ini menjaga
shim alias/compat provider tetap bekerja tanpa mengharuskan pemanggil mengetahui Plugin bawaan mana yang memiliki penulisan ulang tersebut. Jika tidak ada hook provider yang menulis ulang entri config keluarga Google yang didukung, penormal config Google bawaan tetap menerapkan pembersihan kompatibilitas tersebut.

Jika provider membutuhkan protokol wire yang sepenuhnya kustom atau eksekutor permintaan kustom,
itu adalah kelas ekstensi yang berbeda. Hook ini ditujukan untuk perilaku provider
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

Plugin provider bawaan menggabungkan hook di atas agar sesuai dengan kebutuhan
katalog, auth, thinking, replay, dan usage masing-masing vendor. Kumpulan hook yang otoritatif hidup bersama
setiap Plugin di bawah `extensions/`; halaman ini mengilustrasikan bentuknya alih-alih
mencerminkan daftarnya.

<AccordionGroup>
  <Accordion title="Provider katalog pass-through">
    OpenRouter, Kilocode, Z.AI, xAI mendaftarkan `catalog` plus
    `resolveDynamicModel` / `prepareDynamicModel` sehingga mereka dapat menampilkan id model upstream lebih awal daripada katalog statis OpenClaw.
  </Accordion>
  <Accordion title="Provider OAuth dan endpoint usage">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai memasangkan
    `prepareRuntimeAuth` atau `formatApiKey` dengan `resolveUsageAuth` +
    `fetchUsageSnapshot` untuk memiliki pertukaran token dan integrasi `/usage`.
  </Accordion>
  <Accordion title="Keluarga replay dan pembersihan transkrip">
    Keluarga bernama bersama (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) memungkinkan provider memilih
    kebijakan transkrip melalui `buildReplayPolicy` alih-alih setiap Plugin
    mengimplementasikan ulang pembersihan.
  </Accordion>
  <Accordion title="Provider hanya-katalog">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway`, dan
    `volcengine` hanya mendaftarkan `catalog` dan menggunakan loop inferensi bersama.
  </Accordion>
  <Accordion title="Helper stream khusus Anthropic">
    Header beta, `/fast` / `serviceTier`, dan `context1m` hidup di seam
    `api.ts` / `contract-api.ts` publik milik Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) alih-alih di
    SDK generik.
  </Accordion>
</AccordionGroup>

## Helper runtime

Plugin dapat mengakses helper inti tertentu melalui `api.runtime`. Untuk TTS:

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

- `textToSpeech` mengembalikan payload output TTS inti normal untuk permukaan file/voice-note.
- Menggunakan konfigurasi inti `messages.tts` dan pemilihan provider.
- Mengembalikan buffer audio PCM + sample rate. Plugin harus melakukan resample/encode untuk provider.
- `listVoices` bersifat opsional per provider. Gunakan untuk picker suara atau alur setup milik vendor.
- Daftar suara dapat menyertakan metadata yang lebih kaya seperti locale, gender, dan tag personality untuk picker yang sadar-provider.
- OpenAI dan ElevenLabs mendukung telephony saat ini. Microsoft tidak.

Plugin juga dapat mendaftarkan provider speech melalui `api.registerSpeechProvider(...)`.

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

- Pertahankan kebijakan TTS, fallback, dan pengiriman balasan di inti.
- Gunakan provider speech untuk perilaku sintesis milik vendor.
- Input legacy Microsoft `edge` dinormalisasi ke id provider `microsoft`.
- Model kepemilikan yang disukai berorientasi perusahaan: satu Plugin vendor dapat memiliki
  provider teks, speech, gambar, dan media masa depan saat OpenClaw menambahkan kontrak kemampuan tersebut.

Untuk pemahaman gambar/audio/video, Plugin mendaftarkan satu provider
media-understanding bertipe alih-alih bag key/value generik:

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

- Pertahankan orkestrasi, fallback, config, dan wiring channel di inti.
- Pertahankan perilaku vendor di Plugin provider.
- Ekspansi aditif seharusnya tetap bertipe: metode opsional baru, field hasil opsional baru, kemampuan opsional baru.
- Pembuatan video sudah mengikuti pola yang sama:
  - inti memiliki kontrak kemampuan dan helper runtime
  - Plugin vendor mendaftarkan `api.registerVideoGenerationProvider(...)`
  - Plugin fitur/channel mengonsumsi `api.runtime.videoGeneration.*`

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
atau alias STT lama:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Catatan:

- `api.runtime.mediaUnderstanding.*` adalah permukaan bersama yang disukai untuk
  pemahaman gambar/audio/video.
- Menggunakan konfigurasi audio media-understanding inti (`tools.media.audio`) dan urutan fallback provider.
- Mengembalikan `{ text: undefined }` saat tidak ada output transkripsi yang dihasilkan (misalnya input dilewati/tidak didukung).
- `api.runtime.stt.transcribeAudioFile(...)` tetap ada sebagai alias kompatibilitas.

Plugin juga dapat meluncurkan run subagen latar belakang melalui `api.runtime.subagent`:

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
- OpenClaw hanya menghormati field override tersebut untuk pemanggil tepercaya.
- Untuk run fallback milik Plugin, operator harus memilihnya secara opt-in dengan `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Gunakan `plugins.entries.<id>.subagent.allowedModels` untuk membatasi Plugin tepercaya ke target kanonis `provider/model` tertentu, atau `"*"` untuk mengizinkan target apa pun secara eksplisit.
- Run subagen Plugin yang tidak tepercaya tetap berfungsi, tetapi permintaan override ditolak alih-alih diam-diam fallback.

Untuk pencarian web, Plugin dapat mengonsumsi helper runtime bersama alih-alih
menjangkau wiring alat agen:

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

Plugin juga dapat mendaftarkan provider web-search melalui
`api.registerWebSearchProvider(...)`.

Catatan:

- Pertahankan pemilihan provider, resolusi kredensial, dan semantik permintaan bersama di inti.
- Gunakan provider web-search untuk transport pencarian khusus vendor.
- `api.runtime.webSearch.*` adalah permukaan bersama yang disukai untuk Plugin fitur/channel yang membutuhkan perilaku pencarian tanpa bergantung pada wrapper alat agen.

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

- `generate(...)`: hasilkan gambar menggunakan rantai provider image-generation yang dikonfigurasi.
- `listProviders(...)`: daftar provider image-generation yang tersedia dan kemampuannya.

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
- `replaceExisting`: opsional. Memungkinkan Plugin yang sama mengganti pendaftaran rute miliknya sendiri yang sudah ada.
- `handler`: kembalikan `true` saat rute menangani permintaan.

Catatan:

- `api.registerHttpHandler(...)` telah dihapus dan akan menyebabkan galat pemuatan Plugin. Gunakan `api.registerHttpRoute(...)` sebagai gantinya.
- Rute Plugin harus mendeklarasikan `auth` secara eksplisit.
- Konflik `path + match` yang persis ditolak kecuali `replaceExisting: true`, dan satu Plugin tidak dapat mengganti rute milik Plugin lain.
- Rute yang tumpang tindih dengan level `auth` berbeda ditolak. Pertahankan rantai fallthrough `exact`/`prefix` hanya pada level auth yang sama.
- Rute `auth: "plugin"` **tidak** menerima scope runtime operator secara otomatis. Rute ini ditujukan untuk Webhook/verifikasi tanda tangan yang dikelola Plugin, bukan pemanggilan helper Gateway yang berhak istimewa.
- Rute `auth: "gateway"` berjalan di dalam scope runtime permintaan Gateway, tetapi scope itu sengaja konservatif:
  - auth bearer shared-secret (`gateway.auth.mode = "token"` / `"password"`) mempertahankan scope runtime rute-Plugin tetap dipaku ke `operator.write`, bahkan jika pemanggil mengirim `x-openclaw-scopes`
  - mode HTTP tepercaya pembawa identitas (misalnya `trusted-proxy` atau `gateway.auth.mode = "none"` pada ingress privat) menghormati `x-openclaw-scopes` hanya saat header itu memang ada secara eksplisit
  - jika `x-openclaw-scopes` tidak ada pada permintaan rute-Plugin pembawa identitas tersebut, scope runtime fallback ke `operator.write`
- Aturan praktis: jangan menganggap rute Plugin ber-auth gateway sebagai permukaan admin implisit. Jika rute Anda membutuhkan perilaku khusus admin, wajibkan mode auth pembawa identitas dan dokumentasikan kontrak header `x-openclaw-scopes` yang eksplisit.

## Path impor SDK Plugin

Gunakan subpath SDK yang sempit alih-alih root barrel monolitik `openclaw/plugin-sdk`
saat menulis Plugin baru. Subpath inti:

| Subpath                             | Purpose                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitive pendaftaran Plugin                       |
| `openclaw/plugin-sdk/channel-core`  | Helper entry/build channel                         |
| `openclaw/plugin-sdk/core`          | Helper bersama generik dan kontrak payung          |
| `openclaw/plugin-sdk/config-schema` | Skema Zod root `openclaw.json` (`OpenClawSchema`) |

Plugin channel memilih dari keluarga seam sempit — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, dan `channel-actions`. Perilaku persetujuan seharusnya dikonsolidasikan
pada satu kontrak `approvalCapability` alih-alih bercampur di field
Plugin yang tidak terkait. Lihat [Channel plugins](/id/plugins/sdk-channel-plugins).

Helper runtime dan config hidup di bawah subpath `*-runtime` yang sesuai
(`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store`, dll.).

<Info>
`openclaw/plugin-sdk/channel-runtime` sudah deprecated — shim kompatibilitas untuk
Plugin lama. Kode baru seharusnya mengimpor primitive generik yang lebih sempit.
</Info>

Entry point internal repo (per root package Plugin bawaan):

- `index.js` — entry Plugin bawaan
- `api.js` — barrel helper/tipe
- `runtime-api.js` — barrel khusus runtime
- `setup-entry.js` — entry Plugin setup

Plugin eksternal seharusnya hanya mengimpor subpath `openclaw/plugin-sdk/*`. Jangan
pernah mengimpor `src/*` dari package Plugin lain dari core atau dari Plugin lain.
Entry point yang dimuat melalui facade lebih memilih snapshot config runtime aktif ketika ada,
lalu fallback ke file config yang diresolusikan di disk.

Subpath khusus kemampuan seperti `image-generation`, `media-understanding`,
dan `speech` ada karena Plugin bawaan menggunakannya saat ini. Subpath ini tidak
secara otomatis merupakan kontrak eksternal jangka panjang yang dibekukan — periksa
halaman referensi SDK yang relevan saat mengandalkannya.

## Skema message tool

Plugin seharusnya memiliki kontribusi skema `describeMessageTool(...)` khusus channel
untuk primitive non-pesan seperti reaksi, pembacaan, dan polling.
Presentasi kirim bersama seharusnya menggunakan kontrak `MessagePresentation` generik
alih-alih field tombol, komponen, blok, atau kartu yang native provider.
Lihat [Message Presentation](/id/plugins/message-presentation) untuk kontrak,
aturan fallback, pemetaan provider, dan checklist penulis Plugin.

Plugin yang mampu mengirim mendeklarasikan apa yang dapat mereka render melalui kemampuan pesan:

- `presentation` untuk blok presentasi semantik (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` untuk permintaan pengiriman yang dipin

Core memutuskan apakah presentasi dirender secara native atau diturunkan menjadi teks.
Jangan mengekspos escape hatch UI native provider dari message tool generik.
Helper SDK deprecated untuk skema native lama tetap diekspor untuk Plugin pihak ketiga yang ada, tetapi Plugin baru tidak seharusnya menggunakannya.

## Resolusi target channel

Plugin channel seharusnya memiliki semantik target khusus channel. Pertahankan
host outbound bersama tetap generik dan gunakan permukaan adapter perpesanan untuk aturan provider:

- `messaging.inferTargetChatType({ to })` memutuskan apakah target ternormalisasi
  seharusnya diperlakukan sebagai `direct`, `group`, atau `channel` sebelum lookup direktori.
- `messaging.targetResolver.looksLikeId(raw, normalized)` memberi tahu core apakah suatu
  input harus langsung melompat ke resolusi mirip-id alih-alih pencarian direktori.
- `messaging.targetResolver.resolveTarget(...)` adalah fallback Plugin ketika
  core membutuhkan resolusi akhir milik provider setelah normalisasi atau setelah
  miss direktori.
- `messaging.resolveOutboundSessionRoute(...)` memiliki konstruksi rute sesi
  khusus provider setelah target diresolusikan.

Pemisahan yang direkomendasikan:

- Gunakan `inferTargetChatType` untuk keputusan kategori yang seharusnya terjadi sebelum
  mencari peer/grup.
- Gunakan `looksLikeId` untuk pemeriksaan "perlakukan ini sebagai id target eksplisit/native".
- Gunakan `resolveTarget` untuk fallback normalisasi khusus provider, bukan untuk
  pencarian direktori yang luas.
- Pertahankan id native provider seperti id chat, id thread, JID, handle, dan id room
  di dalam nilai `target` atau parameter khusus provider, bukan di field SDK generik.

## Direktori berbasis config

Plugin yang menurunkan entri direktori dari config seharusnya mempertahankan logika itu di
Plugin dan menggunakan kembali helper bersama dari
`openclaw/plugin-sdk/directory-runtime`.

Gunakan ini saat channel memerlukan peer/grup berbasis config seperti:

- peer DM yang didorong allowlist
- peta channel/grup yang dikonfigurasi
- fallback direktori statis yang dibatasi akun

Helper bersama di `directory-runtime` hanya menangani operasi generik:

- pemfilteran kueri
- penerapan batas
- helper dedupe/normalisasi
- membangun `ChannelDirectoryEntry[]`

Inspeksi akun khusus channel dan normalisasi id seharusnya tetap berada di
implementasi Plugin.

## Katalog provider

Plugin provider dapat mendefinisikan katalog model untuk inferensi dengan
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` mengembalikan bentuk yang sama dengan yang ditulis OpenClaw ke
`models.providers`:

- `{ provider }` untuk satu entri provider
- `{ providers }` untuk beberapa entri provider

Gunakan `catalog` saat Plugin memiliki id model khusus provider, default `baseUrl`,
atau metadata model yang dibatasi auth.

`catalog.order` mengontrol kapan katalog Plugin digabungkan relatif terhadap provider implisit bawaan OpenClaw:

- `simple`: provider biasa berbasis API-key atau env
- `profile`: provider yang muncul saat profil auth ada
- `paired`: provider yang mensintesis beberapa entri provider terkait
- `late`: lintasan terakhir, setelah provider implisit lain

Provider yang lebih akhir menang pada tabrakan kunci, sehingga Plugin dapat
secara sengaja mengoverride entri provider bawaan dengan id provider yang sama.

Kompatibilitas:

- `discovery` tetap berfungsi sebagai alias legacy
- jika `catalog` dan `discovery` keduanya terdaftar, OpenClaw menggunakan `catalog`

## Inspeksi channel hanya-baca

Jika Plugin Anda mendaftarkan sebuah channel, pilih mengimplementasikan
`plugin.config.inspectAccount(cfg, accountId)` di samping `resolveAccount(...)`.

Mengapa:

- `resolveAccount(...)` adalah jalur runtime. Jalur ini boleh mengasumsikan kredensial
  sudah sepenuhnya termaterialisasi dan dapat gagal cepat ketika secret yang diperlukan hilang.
- Jalur perintah hanya-baca seperti `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, dan alur
  perbaikan doctor/config seharusnya tidak perlu mematerialisasi kredensial runtime hanya untuk
  mendeskripsikan konfigurasi.

Perilaku `inspectAccount(...)` yang direkomendasikan:

- Kembalikan hanya state akun yang deskriptif.
- Pertahankan `enabled` dan `configured`.
- Sertakan field sumber/status kredensial bila relevan, seperti:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Anda tidak perlu mengembalikan nilai token mentah hanya untuk melaporkan
  ketersediaan baca-saja. Mengembalikan `tokenStatus: "available"` (dan field sumber yang cocok)
  sudah cukup untuk perintah bergaya status.
- Gunakan `configured_unavailable` ketika kredensial dikonfigurasi melalui SecretRef tetapi
  tidak tersedia di jalur perintah saat ini.

Ini memungkinkan perintah hanya-baca melaporkan "configured but unavailable in this command
path" alih-alih crash atau salah melaporkan akun sebagai tidak dikonfigurasi.

## Pack package

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

Guardrail keamanan: setiap entri `openclaw.extensions` harus tetap berada di dalam direktori Plugin
setelah resolusi symlink. Entri yang keluar dari direktori package akan
ditolak.

Catatan keamanan: `openclaw plugins install` menginstal dependensi Plugin dengan
`npm install --omit=dev --ignore-scripts` (tanpa lifecycle script, tanpa dependensi dev saat runtime). Pertahankan pohon dependensi Plugin tetap "pure JS/TS" dan hindari package yang memerlukan build `postinstall`.

Opsional: `openclaw.setupEntry` dapat menunjuk ke modul ringan khusus setup.
Saat OpenClaw membutuhkan permukaan setup untuk Plugin channel yang dinonaktifkan, atau
saat Plugin channel diaktifkan tetapi masih belum dikonfigurasi, OpenClaw memuat `setupEntry`
alih-alih entry Plugin penuh. Ini menjaga startup dan setup tetap lebih ringan
saat entry Plugin utama Anda juga memasang alat, hook, atau kode khusus runtime lainnya.

Opsional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
dapat membuat sebuah Plugin channel memilih jalur `setupEntry` yang sama selama fase
startup pra-listen gateway, bahkan ketika channel sudah dikonfigurasi.

Gunakan ini hanya ketika `setupEntry` sepenuhnya mencakup permukaan startup yang harus ada
sebelum gateway mulai listening. Dalam praktiknya, ini berarti setup entry
harus mendaftarkan setiap kemampuan milik channel yang dibutuhkan startup, seperti:

- pendaftaran channel itu sendiri
- rute HTTP apa pun yang harus tersedia sebelum gateway mulai listening
- metode gateway, alat, atau layanan apa pun yang harus ada selama jendela yang sama

Jika entry penuh Anda masih memiliki kemampuan startup yang diperlukan, jangan aktifkan
flag ini. Pertahankan Plugin pada perilaku default dan biarkan OpenClaw memuat
entry penuh saat startup.

Channel bawaan juga dapat menerbitkan helper contract-surface khusus setup yang dapat
dikonsultasikan core sebelum runtime channel penuh dimuat. Permukaan promosi setup saat ini adalah:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core menggunakan permukaan itu saat perlu mempromosikan config channel single-account legacy ke
`channels.<id>.accounts.*` tanpa memuat entry Plugin penuh.
Matrix adalah contoh bawaan saat ini: hanya memindahkan kunci auth/bootstrap ke
akun yang dipromosikan bernama ketika akun bernama sudah ada, dan dapat
mempertahankan kunci akun default non-kanonis yang dikonfigurasi alih-alih selalu membuat
`accounts.default`.

Adapter patch setup tersebut menjaga penemuan contract-surface bawaan tetap lazy. Waktu impor tetap ringan; permukaan promosi dimuat hanya saat pertama kali digunakan alih-alih masuk kembali ke startup channel bawaan saat impor modul.

Ketika permukaan startup tersebut mencakup metode RPC gateway, pertahankan pada
prefix khusus Plugin. Namespace admin inti (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu diresolusikan
ke `operator.admin`, bahkan jika sebuah Plugin meminta scope yang lebih sempit.

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

Plugin channel dapat mengiklankan metadata setup/discovery melalui `openclaw.channel` dan
petunjuk instalasi melalui `openclaw.install`. Ini menjaga data katalog inti tetap bebas data.

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
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
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
- `docsLabel`: override teks tautan untuk tautan dokumentasi
- `preferOver`: id Plugin/channel prioritas lebih rendah yang seharusnya dikalahkan entri katalog ini
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrol salinan permukaan pemilihan
- `markdownCapable`: menandai channel sebagai mampu Markdown untuk keputusan pemformatan keluar
- `exposure.configured`: sembunyikan channel dari permukaan daftar channel yang dikonfigurasi saat disetel ke `false`
- `exposure.setup`: sembunyikan channel dari picker setup/configure interaktif saat disetel ke `false`
- `exposure.docs`: tandai channel sebagai internal/pribadi untuk permukaan navigasi dokumentasi
- `showConfigured` / `showInSetup`: alias legacy masih diterima demi kompatibilitas; pilih `exposure`
- `quickstartAllowFrom`: memilih channel ini ke alur quickstart `allowFrom` standar
- `forceAccountBinding`: mewajibkan binding akun eksplisit bahkan ketika hanya ada satu akun
- `preferSessionLookupForAnnounceTarget`: memilih lookup sesi saat meresolusikan target announce

OpenClaw juga dapat menggabungkan **katalog channel eksternal** (misalnya, ekspor
registry MPM). Letakkan file JSON di salah satu dari:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Atau arahkan `OPENCLAW_PLUGIN_CATALOG_PATHS` (atau `OPENCLAW_MPM_CATALOG_PATHS`) ke
satu atau lebih file JSON (dipisahkan koma/titik koma/`PATH`). Setiap file seharusnya
berisi `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser juga menerima `"packages"` atau `"plugins"` sebagai alias legacy untuk kunci `"entries"`.

Entri katalog channel yang dihasilkan dan entri katalog instalasi provider mengekspos
fakta sumber instalasi yang telah dinormalisasi di samping blok `openclaw.install` mentah. Fakta
ternormalisasi tersebut mengidentifikasi apakah spesifikasi npm adalah versi persis atau selector mengambang,
apakah metadata integritas yang diharapkan ada, dan apakah path sumber lokal juga tersedia.
Konsumen seharusnya memperlakukan `installSource` sebagai field opsional aditif sehingga
entri lama yang dibuat manual dan shim kompatibilitas tidak harus mensintesisnya.
Ini memungkinkan onboarding dan diagnostik menjelaskan state source-plane tanpa mengimpor runtime Plugin.

Entri npm eksternal resmi seharusnya memilih `npmSpec` persis plus
`expectedIntegrity`. Nama package polos dan dist-tag tetap bekerja demi
kompatibilitas, tetapi menampilkan peringatan source-plane sehingga katalog dapat bergerak
menuju instalasi yang dipin dan diperiksa integritasnya tanpa merusak Plugin yang ada.
Saat onboarding menginstal dari path katalog lokal, onboarding mencatat sebuah
entri `plugins.installs` dengan `source: "path"` dan
`sourcePath` relatif-workspace jika memungkinkan. Path muat operasional absolut tetap berada di
`plugins.load.paths`; record instalasi menghindari duplikasi path workstation lokal
ke config jangka panjang. Ini menjaga instalasi pengembangan lokal tetap terlihat bagi
diagnostik source-plane tanpa menambahkan permukaan pengungkapan path filesystem mentah kedua.

## Plugin mesin konteks

Plugin mesin konteks memiliki orkestrasi konteks sesi untuk ingest, assembly,
dan Compaction. Daftarkan dari Plugin Anda dengan
`api.registerContextEngine(id, factory)`, lalu pilih mesin aktif dengan
`plugins.slots.contextEngine`.

Gunakan ini saat Plugin Anda perlu mengganti atau memperluas pipeline konteks default
alih-alih sekadar menambahkan pencarian memori atau hooks.

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

Jika mesin Anda **tidak** memiliki algoritme Compaction, pertahankan `compact()`
tetap diimplementasikan dan delegasikan secara eksplisit:

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

## Menambahkan kemampuan baru

Saat sebuah Plugin memerlukan perilaku yang tidak cocok dengan API saat ini, jangan melewati
sistem Plugin dengan reach-in privat. Tambahkan kemampuan yang hilang.

Urutan yang direkomendasikan:

1. definisikan kontrak inti
   Tentukan perilaku bersama apa yang seharusnya dimiliki core: kebijakan, fallback, penggabungan config,
   siklus hidup, semantik yang menghadap channel, dan bentuk helper runtime.
2. tambahkan permukaan pendaftaran/runtime Plugin yang bertipe
   Perluas `OpenClawPluginApi` dan/atau `api.runtime` dengan permukaan kemampuan
   bertipe yang paling kecil namun berguna.
3. wire konsumen core + channel/fitur
   Channel dan Plugin fitur seharusnya mengonsumsi kemampuan baru melalui core,
   bukan dengan mengimpor implementasi vendor secara langsung.
4. daftarkan implementasi vendor
   Plugin vendor lalu mendaftarkan backend mereka terhadap kemampuan tersebut.
5. tambahkan cakupan kontrak
   Tambahkan pengujian agar kepemilikan dan bentuk pendaftaran tetap eksplisit seiring waktu.

Inilah cara OpenClaw tetap opinionated tanpa menjadi hardcoded ke
worldview satu provider. Lihat [Capability Cookbook](/id/plugins/architecture)
untuk checklist file konkret dan contoh kerja.

### Checklist kemampuan

Saat Anda menambahkan kemampuan baru, implementasi biasanya seharusnya menyentuh
permukaan ini bersama-sama:

- tipe kontrak inti di `src/<capability>/types.ts`
- runner/helper runtime inti di `src/<capability>/runtime.ts`
- permukaan pendaftaran API Plugin di `src/plugins/types.ts`
- wiring registry Plugin di `src/plugins/registry.ts`
- eksposur runtime Plugin di `src/plugins/runtime/*` saat Plugin fitur/channel
  perlu mengonsumsinya
- helper capture/test di `src/test-utils/plugin-registration.ts`
- penegasan kepemilikan/kontrak di `src/plugins/contracts/registry.ts`
- dokumentasi operator/Plugin di `docs/`

Jika salah satu permukaan itu hilang, biasanya itu tanda kemampuan tersebut
belum terintegrasi sepenuhnya.

### Template kemampuan

Pola minimal:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Pola pengujian kontrak:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Itu menjaga aturan tetap sederhana:

- core memiliki kontrak kemampuan + orkestrasi
- Plugin vendor memiliki implementasi vendor
- Plugin fitur/channel mengonsumsi helper runtime
- pengujian kontrak menjaga kepemilikan tetap eksplisit

## Terkait

- [Plugin architecture](/id/plugins/architecture) — model dan bentuk kemampuan publik
- [Plugin SDK subpaths](/id/plugins/sdk-subpaths)
- [Plugin SDK setup](/id/plugins/sdk-setup)
- [Building plugins](/id/plugins/building-plugins)

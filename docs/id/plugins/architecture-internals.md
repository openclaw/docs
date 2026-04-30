---
read_when:
    - Mengimplementasikan kait runtime penyedia, siklus hidup kanal, atau paket bundel
    - Men-debug urutan pemuatan Plugin atau status registri
    - Menambahkan kemampuan Plugin baru atau Plugin mesin konteks
summary: 'Internal arsitektur Plugin: pipeline pemuatan, registri, hook runtime, rute HTTP, dan tabel referensi'
title: Internal arsitektur Plugin
x-i18n:
    generated_at: "2026-04-30T10:00:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51020f00fd501c006a8e8e92f4daaeb65a9e211771f8f350d869017332b5da3b
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Untuk model kapabilitas publik, bentuk Plugin, serta kontrak kepemilikan/eksekusi, lihat [arsitektur Plugin](/id/plugins/architecture). Halaman ini adalah referensi untuk mekanisme internal: pipeline pemuatan, registry, hook runtime, rute HTTP Gateway, path import, dan tabel skema.

## Pipeline pemuatan

Saat startup, OpenClaw kira-kira melakukan ini:

1. menemukan root Plugin kandidat
2. membaca manifes bundle native atau kompatibel dan metadata paket
3. menolak kandidat yang tidak aman
4. menormalisasi konfigurasi Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. memutuskan enablement untuk setiap kandidat
6. memuat modul native yang diaktifkan: modul bundled yang sudah dibangun menggunakan loader native;
   Plugin native yang belum dibangun menggunakan jiti
7. memanggil hook native `register(api)` dan mengumpulkan registrasi ke dalam registry Plugin
8. mengekspos registry ke command/permukaan runtime

<Note>
`activate` adalah alias lama untuk `register` — loader menyelesaikan mana pun yang ada (`def.register ?? def.activate`) dan memanggilnya pada titik yang sama. Semua Plugin bundled menggunakan `register`; utamakan `register` untuk Plugin baru.
</Note>

Gerbang keamanan terjadi **sebelum** eksekusi runtime. Kandidat diblokir
ketika entry keluar dari root Plugin, path dapat ditulis oleh semua pengguna, atau kepemilikan
path terlihat mencurigakan untuk Plugin non-bundled.

### Perilaku manifest-first

Manifes adalah sumber kebenaran control-plane. OpenClaw menggunakannya untuk:

- mengidentifikasi Plugin
- menemukan channel/skills/skema konfigurasi yang dideklarasikan atau kapabilitas bundle
- memvalidasi `plugins.entries.<id>.config`
- menambahkan label/placeholder Control UI
- menampilkan metadata install/katalog
- mempertahankan deskriptor aktivasi dan setup yang murah tanpa memuat runtime Plugin

Untuk Plugin native, modul runtime adalah bagian data-plane. Modul ini mendaftarkan
perilaku aktual seperti hook, tool, command, atau alur provider.

Blok manifes opsional `activation` dan `setup` tetap berada di control plane.
Keduanya adalah deskriptor metadata saja untuk perencanaan aktivasi dan penemuan setup;
keduanya tidak menggantikan registrasi runtime, `register(...)`, atau `setupEntry`.
Konsumen aktivasi live pertama sekarang menggunakan petunjuk command, channel, dan provider manifes
untuk mempersempit pemuatan Plugin sebelum materialisasi registry yang lebih luas:

- pemuatan CLI dipersempit ke Plugin yang memiliki command utama yang diminta
- resolusi setup/plugin channel dipersempit ke Plugin yang memiliki
  id channel yang diminta
- resolusi setup/runtime provider eksplisit dipersempit ke Plugin yang memiliki
  id provider yang diminta
- perencanaan startup Gateway menggunakan `activation.onStartup` untuk import startup
  eksplisit dan opt-out startup; setiap Plugin harus mendeklarasikannya saat OpenClaw
  beralih dari import startup implisit, sementara Plugin tanpa metadata kapabilitas
  statis dan tanpa `activation.onStartup` masih menggunakan fallback sidecar startup
  implisit yang sudah deprecated untuk kompatibilitas

Planner aktivasi mengekspos API hanya-id untuk caller yang ada dan API
rencana untuk diagnostik baru. Entry rencana melaporkan mengapa sebuah Plugin dipilih,
memisahkan petunjuk planner `activation.*` eksplisit dari fallback kepemilikan manifes
seperti `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, dan hook. Pemisahan alasan itu adalah batas kompatibilitas:
metadata Plugin yang ada tetap berfungsi, sementara kode baru dapat mendeteksi petunjuk
luas atau perilaku fallback tanpa mengubah semantik pemuatan runtime.

Penemuan setup sekarang mengutamakan id yang dimiliki deskriptor seperti `setup.providers` dan
`setup.cliBackends` untuk mempersempit kandidat Plugin sebelum fallback ke
`setup-api` untuk Plugin yang masih membutuhkan hook runtime saat setup. Daftar setup
provider menggunakan `providerAuthChoices` manifes, pilihan setup yang diturunkan dari deskriptor,
dan metadata katalog install tanpa memuat runtime provider. `setup.requiresRuntime: false`
eksplisit adalah pemutus khusus deskriptor; `requiresRuntime` yang dihilangkan
mempertahankan fallback setup-api lama untuk kompatibilitas. Jika lebih dari satu
Plugin yang ditemukan mengklaim id provider setup atau backend CLI yang sama setelah
dinormalisasi, lookup setup menolak pemilik yang ambigu alih-alih bergantung pada
urutan penemuan. Ketika runtime setup benar-benar berjalan, diagnostik registry melaporkan
drift antara `setup.providers` / `setup.cliBackends` dan provider atau backend CLI
yang didaftarkan oleh setup-api tanpa memblokir Plugin lama.

### Batas cache Plugin

OpenClaw tidak melakukan cache hasil penemuan Plugin atau data registry manifes langsung
di balik jendela waktu wall-clock. Install, edit manifes, dan perubahan load-path
harus terlihat pada pembacaan metadata eksplisit berikutnya atau pembangunan ulang snapshot.
Parser file manifes boleh menyimpan cache signature file terbatas yang dikunci oleh
path manifes yang dibuka, inode, ukuran, dan timestamp; cache itu hanya menghindari
parsing ulang byte yang tidak berubah dan tidak boleh melakukan cache atas jawaban
penemuan, registry, pemilik, atau kebijakan.

Fast path metadata yang aman adalah kepemilikan objek eksplisit, bukan cache tersembunyi.
Hot path startup Gateway harus meneruskan `PluginMetadataSnapshot` saat ini,
`PluginLookUpTable` turunan, atau registry manifes eksplisit melalui rantai panggilan.
Validasi konfigurasi, auto-enable startup, bootstrap Plugin, dan pemilihan provider
dapat menggunakan ulang objek tersebut selama objek itu merepresentasikan konfigurasi
dan inventaris Plugin saat ini. Lookup setup masih merekonstruksi metadata manifes sesuai
kebutuhan kecuali path setup tertentu menerima registry manifes eksplisit; pertahankan itu
sebagai fallback cold-path alih-alih menambahkan cache lookup tersembunyi. Ketika input
berubah, bangun ulang dan ganti snapshot alih-alih memutasinya atau menyimpan
salinan historis.
View atas registry Plugin aktif dan helper bootstrap channel bundled
harus dihitung ulang dari registry/root saat ini. Map berumur pendek boleh digunakan
di dalam satu panggilan untuk menghapus duplikasi pekerjaan atau menjaga reentry; map itu
tidak boleh menjadi cache metadata proses.

Untuk pemuatan Plugin, lapisan cache persisten adalah pemuatan runtime. Lapisan ini dapat menggunakan ulang
state loader ketika kode atau artefak yang terpasang benar-benar dimuat, seperti:

- `PluginLoaderCacheState` dan registry runtime aktif yang kompatibel
- cache jiti/modul dan cache loader permukaan publik yang digunakan untuk menghindari import
  permukaan runtime yang sama berulang kali
- mirror dependensi runtime dan cache filesystem untuk artefak Plugin
  yang terpasang
- map per-panggilan berumur pendek untuk normalisasi path atau resolusi duplikat

Cache tersebut adalah detail implementasi data-plane. Cache itu tidak boleh menjawab
pertanyaan control-plane seperti "Plugin mana yang memiliki provider ini?" kecuali
caller memang sengaja meminta pemuatan runtime.

Jangan menambahkan cache persisten atau wall-clock untuk:

- hasil penemuan
- registry manifes langsung
- registry manifes yang direkonstruksi dari indeks Plugin yang terpasang
- lookup pemilik provider, supresi model, kebijakan provider, atau metadata artefak
  publik
- jawaban lain yang diturunkan dari manifes ketika manifes yang berubah, indeks terpasang,
  atau load path harus terlihat pada pembacaan metadata berikutnya

Caller yang membangun ulang metadata manifes dari indeks Plugin terpasang yang dipersistenkan
merekonstruksi registry itu sesuai kebutuhan. Indeks terpasang adalah state source-plane yang tahan lama;
indeks itu bukan cache metadata in-process yang tersembunyi.

## Model registry

Plugin yang dimuat tidak langsung memutasi global core secara acak. Plugin mendaftar ke
registry Plugin pusat.

Registry melacak:

- record Plugin (identitas, sumber, asal, status, diagnostik)
- tool
- hook lama dan hook bertipe
- channel
- provider
- handler RPC Gateway
- rute HTTP
- registrar CLI
- service latar belakang
- command milik Plugin

Fitur core kemudian membaca dari registry itu alih-alih berbicara langsung ke modul Plugin.
Ini menjaga pemuatan tetap satu arah:

- modul Plugin -> registrasi registry
- runtime core -> konsumsi registry

Pemisahan itu penting untuk maintainability. Artinya sebagian besar permukaan core hanya
membutuhkan satu titik integrasi: "baca registry", bukan "beri perlakuan khusus pada setiap
modul Plugin".

## Callback binding percakapan

Plugin yang mengikat percakapan dapat bereaksi ketika approval diselesaikan.

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
- `binding`: binding yang diselesaikan untuk permintaan yang disetujui
- `request`: ringkasan permintaan asli, petunjuk detach, id pengirim, dan
  metadata percakapan

Callback ini hanya notifikasi. Callback ini tidak mengubah siapa yang diizinkan mengikat
percakapan, dan berjalan setelah penanganan approval core selesai.

## Hook runtime provider

Plugin provider memiliki tiga lapisan:

- **Metadata manifes** untuk lookup pre-runtime yang murah:
  `setup.providers[].envVars`, kompatibilitas deprecated `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices`, dan `channelEnvVars`.
- **Hook waktu konfigurasi**: `catalog` (lama `discovery`) plus
  `applyConfigDefaults`.
- **Hook runtime**: lebih dari 40 hook opsional yang mencakup auth, resolusi model,
  pembungkus stream, level thinking, kebijakan replay, dan endpoint penggunaan. Lihat
  daftar lengkap di [Urutan dan penggunaan hook](#hook-order-and-usage).

OpenClaw tetap memiliki loop agent generik, failover, penanganan transcript, dan
kebijakan tool. Hook ini adalah permukaan ekstensi untuk perilaku khusus provider
tanpa memerlukan transport inferensi kustom sepenuhnya.

Gunakan `setup.providers[].envVars` manifes ketika provider memiliki kredensial berbasis env
yang harus dilihat path auth/status/model-picker generik tanpa memuat runtime Plugin.
`providerAuthEnvVars` yang sudah deprecated masih dibaca oleh adapter kompatibilitas
selama jendela deprecation, dan Plugin non-bundled yang menggunakannya menerima diagnostik
manifes. Gunakan `providerAuthAliases` manifes ketika satu id provider harus menggunakan ulang
env var, profil auth, auth berbasis konfigurasi, dan pilihan onboarding API-key milik id
provider lain. Gunakan `providerAuthChoices` manifes ketika permukaan CLI onboarding/pilihan-auth
harus mengetahui id pilihan provider, label grup, dan wiring auth satu-flag sederhana tanpa
memuat runtime provider. Pertahankan `envVars` runtime provider untuk petunjuk yang dihadapi
operator seperti label onboarding atau var setup client-id/client-secret OAuth.

Gunakan `channelEnvVars` manifes ketika sebuah channel memiliki auth atau setup berbasis env yang
harus dilihat fallback shell-env generik, pemeriksaan konfigurasi/status, atau prompt setup
tanpa memuat runtime channel.

### Urutan dan penggunaan hook

Untuk Plugin model/provider, OpenClaw memanggil hook dalam urutan kasar ini.
Kolom "Kapan digunakan" adalah panduan keputusan cepat.
Field provider khusus kompatibilitas yang tidak lagi dipanggil OpenClaw, seperti
`ProviderPlugin.capabilities` dan `suppressBuiltInModel`, sengaja tidak
dicantumkan di sini.

| #   | Hook                              | Fungsinya                                                                                                      | Kapan digunakan                                                                                                                              |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Menerbitkan konfigurasi penyedia ke `models.providers` selama pembuatan `models.json`                         | Penyedia memiliki katalog atau default URL dasar                                                                                             |
| 2   | `applyConfigDefaults`             | Menerapkan default konfigurasi global milik penyedia selama materialisasi konfigurasi                          | Default bergantung pada mode autentikasi, env, atau semantik keluarga model penyedia                                                         |
| --  | _(pencarian model bawaan)_        | OpenClaw mencoba jalur registry/katalog normal terlebih dahulu                                                 | _(bukan hook Plugin)_                                                                                                                        |
| 3   | `normalizeModelId`                | Menormalkan alias id model lama atau pratinjau sebelum pencarian                                               | Penyedia memiliki pembersihan alias sebelum resolusi model kanonis                                                                           |
| 4   | `normalizeTransport`              | Menormalkan `api` / `baseUrl` keluarga penyedia sebelum perakitan model generik                                | Penyedia memiliki pembersihan transport untuk id penyedia kustom dalam keluarga transport yang sama                                          |
| 5   | `normalizeConfig`                 | Menormalkan `models.providers.<id>` sebelum resolusi runtime/penyedia                                          | Penyedia memerlukan pembersihan konfigurasi yang seharusnya berada bersama Plugin; helper keluarga Google bawaan juga mencadangkan entri konfigurasi Google yang didukung |
| 6   | `applyNativeStreamingUsageCompat` | Menerapkan penulisan ulang kompatibilitas penggunaan streaming native ke penyedia konfigurasi                  | Penyedia memerlukan perbaikan metadata penggunaan streaming native berbasis endpoint                                                         |
| 7   | `resolveConfigApiKey`             | Menyelesaikan autentikasi penanda env untuk penyedia konfigurasi sebelum pemuatan autentikasi runtime          | Penyedia memiliki resolusi kunci API penanda env milik penyedia; `amazon-bedrock` juga memiliki resolver penanda env AWS bawaan di sini      |
| 8   | `resolveSyntheticAuth`            | Memunculkan autentikasi lokal/self-hosted atau berbasis konfigurasi tanpa menyimpan plaintext                  | Penyedia dapat beroperasi dengan penanda kredensial sintetis/lokal                                                                           |
| 9   | `resolveExternalAuthProfiles`     | Menumpuk profil autentikasi eksternal milik penyedia; default `persistence` adalah `runtime-only` untuk kredensial milik CLI/aplikasi | Penyedia menggunakan ulang kredensial autentikasi eksternal tanpa menyimpan token refresh yang disalin; deklarasikan `contracts.externalAuthProviders` dalam manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Menurunkan prioritas placeholder profil sintetis tersimpan di belakang autentikasi berbasis env/konfigurasi   | Penyedia menyimpan profil placeholder sintetis yang tidak boleh mengalahkan prioritas                                                        |
| 11  | `resolveDynamicModel`             | Fallback sinkron untuk id model milik penyedia yang belum ada di registry lokal                                | Penyedia menerima id model upstream arbitrer                                                                                                 |
| 12  | `prepareDynamicModel`             | Pemanasan asinkron, lalu `resolveDynamicModel` berjalan lagi                                                   | Penyedia memerlukan metadata jaringan sebelum menyelesaikan id yang tidak dikenal                                                            |
| 13  | `normalizeResolvedModel`          | Penulisan ulang akhir sebelum runner tertanam menggunakan model yang sudah diselesaikan                        | Penyedia memerlukan penulisan ulang transport tetapi masih menggunakan transport inti                                                        |
| 14  | `contributeResolvedModelCompat`   | Menyumbangkan flag kompatibilitas untuk model vendor di balik transport lain yang kompatibel                   | Penyedia mengenali modelnya sendiri pada transport proxy tanpa mengambil alih penyedia                                                       |
| 15  | `normalizeToolSchemas`            | Menormalkan skema alat sebelum runner tertanam melihatnya                                                      | Penyedia memerlukan pembersihan skema keluarga transport                                                                                     |
| 16  | `inspectToolSchemas`              | Memunculkan diagnostik skema milik penyedia setelah normalisasi                                                | Penyedia menginginkan peringatan kata kunci tanpa mengajari inti aturan khusus penyedia                                                      |
| 17  | `resolveReasoningOutputMode`      | Memilih kontrak output penalaran native vs bertag                                                              | Penyedia memerlukan output penalaran/akhir bertag alih-alih field native                                                                     |
| 18  | `prepareExtraParams`              | Normalisasi parameter permintaan sebelum wrapper opsi stream generik                                           | Penyedia memerlukan parameter permintaan default atau pembersihan parameter per penyedia                                                     |
| 19  | `createStreamFn`                  | Mengganti sepenuhnya jalur stream normal dengan transport kustom                                               | Penyedia memerlukan protokol kabel kustom, bukan sekadar wrapper                                                                             |
| 20  | `wrapStreamFn`                    | Wrapper stream setelah wrapper generik diterapkan                                                              | Penyedia memerlukan wrapper kompatibilitas header/body/model permintaan tanpa transport kustom                                               |
| 21  | `resolveTransportTurnState`       | Melampirkan header atau metadata transport native per giliran                                                  | Penyedia ingin transport generik mengirim identitas giliran native penyedia                                                                  |
| 22  | `resolveWebSocketSessionPolicy`   | Melampirkan header WebSocket native atau kebijakan jeda sesi                                                   | Penyedia ingin transport WS generik menyesuaikan header sesi atau kebijakan fallback                                                         |
| 23  | `formatApiKey`                    | Pemformat profil autentikasi: profil tersimpan menjadi string `apiKey` runtime                                 | Penyedia menyimpan metadata autentikasi tambahan dan memerlukan bentuk token runtime kustom                                                  |
| 24  | `refreshOAuth`                    | Override refresh OAuth untuk endpoint refresh kustom atau kebijakan kegagalan refresh                          | Penyedia tidak cocok dengan refresher `pi-ai` bersama                                                                                        |
| 25  | `buildAuthDoctorHint`             | Petunjuk perbaikan yang ditambahkan saat refresh OAuth gagal                                                   | Penyedia memerlukan panduan perbaikan autentikasi milik penyedia setelah kegagalan refresh                                                   |
| 26  | `matchesContextOverflowError`     | Pencocok overflow jendela konteks milik penyedia                                                               | Penyedia memiliki error overflow mentah yang akan luput dari heuristik generik                                                               |
| 27  | `classifyFailoverReason`          | Klasifikasi alasan failover milik penyedia                                                                     | Penyedia dapat memetakan error API/transport mentah ke rate-limit/overload/dll.                                                              |
| 28  | `isCacheTtlEligible`              | Kebijakan cache prompt untuk penyedia proxy/backhaul                                                           | Penyedia memerlukan pembatasan TTL cache khusus proxy                                                                                        |
| 29  | `buildMissingAuthMessage`         | Pengganti pesan pemulihan autentikasi hilang yang generik                                                      | Penyedia memerlukan petunjuk pemulihan autentikasi hilang khusus penyedia                                                                    |
| 30  | `augmentModelCatalog`             | Baris katalog sintetis/akhir yang ditambahkan setelah discovery                                                | Penyedia memerlukan baris forward-compat sintetis di `models list` dan pemilih                                                              |
| 31  | `resolveThinkingProfile`          | Set level `/think` khusus model, label tampilan, dan default                                                   | Penyedia mengekspos tangga thinking kustom atau label biner untuk model tertentu                                                             |
| 32  | `isBinaryThinking`                | Hook kompatibilitas toggle penalaran aktif/nonaktif                                                            | Penyedia hanya mengekspos thinking biner aktif/nonaktif                                                                                      |
| 33  | `supportsXHighThinking`           | Hook kompatibilitas dukungan penalaran `xhigh`                                                                 | Penyedia menginginkan `xhigh` hanya pada subset model                                                                                         |
| 34  | `resolveDefaultThinkingLevel`     | Hook kompatibilitas level `/think` default                                                                     | Penyedia memiliki kebijakan `/think` default untuk keluarga model                                                                            |
| 35  | `isModernModelRef`                | Pencocok model modern untuk filter profil live dan pemilihan smoke                                             | Penyedia memiliki pencocokan model pilihan live/smoke                                                                                        |
| 36  | `prepareRuntimeAuth`              | Menukar kredensial yang dikonfigurasi menjadi token/kunci runtime aktual tepat sebelum inferensi               | Penyedia memerlukan pertukaran token atau kredensial permintaan berumur pendek                                                               |
| 37  | `resolveUsageAuth`                | Selesaikan kredensial penggunaan/penagihan untuk `/usage` dan permukaan status terkait                         | Penyedia memerlukan penguraian token penggunaan/kuota khusus atau kredensial penggunaan yang berbeda                                           |
| 38  | `fetchUsageSnapshot`              | Ambil dan normalkan snapshot penggunaan/kuota khusus penyedia setelah autentikasi diselesaikan                  | Penyedia memerlukan endpoint penggunaan khusus penyedia atau pengurai payload                                                                  |
| 39  | `createEmbeddingProvider`         | Bangun adaptor embedding milik penyedia untuk memori/pencarian                                                 | Perilaku embedding memori berada pada Plugin penyedia                                                                                         |
| 40  | `buildReplayPolicy`               | Kembalikan kebijakan replay yang mengontrol penanganan transkrip untuk penyedia                                | Penyedia memerlukan kebijakan transkrip khusus (misalnya, penghapusan blok pemikiran)                                                         |
| 41  | `sanitizeReplayHistory`           | Tulis ulang riwayat replay setelah pembersihan transkrip generik                                               | Penyedia memerlukan penulisan ulang replay khusus penyedia di luar helper compaction bersama                                                   |
| 42  | `validateReplayTurns`             | Validasi akhir giliran replay atau pembentukan ulang sebelum runner tersemat                                   | Transport penyedia memerlukan validasi giliran yang lebih ketat setelah sanitasi generik                                                      |
| 43  | `onModelSelected`                 | Jalankan efek samping pascapemilihan milik penyedia                                                            | Penyedia memerlukan telemetri atau status milik penyedia saat sebuah model menjadi aktif                                                      |

`normalizeModelId`, `normalizeTransport`, dan `normalizeConfig` pertama-tama memeriksa
Plugin penyedia yang cocok, lalu meneruskan ke Plugin penyedia lain yang mampu memakai hook
hingga ada yang benar-benar mengubah id model atau transport/config. Ini menjaga
shim penyedia alias/compat tetap bekerja tanpa mengharuskan pemanggil mengetahui Plugin
bawaan mana yang memiliki rewrite tersebut. Jika tidak ada hook penyedia yang menulis ulang
entri config keluarga Google yang didukung, normalizer config Google bawaan tetap menerapkan
pembersihan kompatibilitas tersebut.

Jika penyedia memerlukan protokol wire yang sepenuhnya kustom atau eksekutor permintaan kustom,
itu adalah kelas ekstensi yang berbeda. Hook ini ditujukan untuk perilaku penyedia
yang tetap berjalan pada loop inferensi normal OpenClaw.

### Contoh penyedia

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

Plugin penyedia bawaan menggabungkan hook di atas agar sesuai dengan katalog,
auth, thinking, replay, dan kebutuhan penggunaan tiap vendor. Kumpulan hook otoritatif berada bersama
setiap Plugin di bawah `extensions/`; halaman ini mengilustrasikan bentuknya, bukan
mencerminkan daftar tersebut.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI, xAI mendaftarkan `catalog` beserta
    `resolveDynamicModel` / `prepareDynamicModel` agar mereka dapat menampilkan id model
    upstream sebelum katalog statis OpenClaw.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai memasangkan
    `prepareRuntimeAuth` atau `formatApiKey` dengan `resolveUsageAuth` +
    `fetchUsageSnapshot` untuk memiliki pertukaran token dan integrasi `/usage`.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    Keluarga bernama bersama (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) memungkinkan penyedia ikut memakai
    kebijakan transkrip melalui `buildReplayPolicy`, alih-alih setiap Plugin
    mengimplementasikan ulang pembersihan.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway`, dan
    `volcengine` hanya mendaftarkan `catalog` dan memakai loop inferensi bersama.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Header beta, `/fast` / `serviceTier`, dan `context1m` berada di dalam seam
    publik `api.ts` / `contract-api.ts` milik Plugin Anthropic
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

- `textToSpeech` mengembalikan payload keluaran TTS inti normal untuk permukaan file/catatan suara.
- Menggunakan konfigurasi inti `messages.tts` dan pemilihan penyedia.
- Mengembalikan buffer audio PCM + sample rate. Plugin harus melakukan resample/encode untuk penyedia.
- `listVoices` bersifat opsional per penyedia. Gunakan untuk pemilih suara milik vendor atau alur setup.
- Daftar suara dapat menyertakan metadata yang lebih kaya seperti locale, gender, dan tag personality untuk pemilih yang sadar penyedia.
- OpenAI dan ElevenLabs mendukung telefoni saat ini. Microsoft tidak.

Plugin juga dapat mendaftarkan penyedia speech melalui `api.registerSpeechProvider(...)`.

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
- Gunakan penyedia speech untuk perilaku sintesis milik vendor.
- Input Microsoft lama `edge` dinormalisasi ke id penyedia `microsoft`.
- Model kepemilikan yang disarankan berorientasi perusahaan: satu Plugin vendor dapat memiliki
  penyedia teks, speech, gambar, dan media mendatang saat OpenClaw menambahkan
  kontrak kapabilitas tersebut.

Untuk pemahaman gambar/audio/video, Plugin mendaftarkan satu
penyedia media-understanding bertipe, bukan generic key/value bag:

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
- Pertahankan perilaku vendor di Plugin penyedia.
- Ekspansi aditif harus tetap bertipe: metode opsional baru, field hasil opsional baru,
  kapabilitas opsional baru.
- Pembuatan video sudah mengikuti pola yang sama:
  - inti memiliki kontrak kapabilitas dan helper runtime
  - Plugin vendor mendaftarkan `api.registerVideoGenerationProvider(...)`
  - Plugin fitur/channel memakai `api.runtime.videoGeneration.*`

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
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Catatan:

- `api.runtime.mediaUnderstanding.*` adalah permukaan bersama yang disarankan untuk
  pemahaman gambar/audio/video.
- Menggunakan konfigurasi audio media-understanding inti (`tools.media.audio`) dan urutan fallback penyedia.
- Mengembalikan `{ text: undefined }` ketika tidak ada keluaran transkripsi yang dihasilkan (misalnya input dilewati/tidak didukung).
- `api.runtime.stt.transcribeAudioFile(...)` tetap ada sebagai alias kompatibilitas.

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

- `provider` dan `model` adalah override opsional per eksekusi, bukan perubahan sesi persisten.
- OpenClaw hanya menghormati field override tersebut untuk pemanggil tepercaya.
- Untuk eksekusi fallback milik Plugin, operator harus opt in dengan `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Gunakan `plugins.entries.<id>.subagent.allowedModels` untuk membatasi Plugin tepercaya ke target kanonis `provider/model` tertentu, atau `"*"` untuk mengizinkan target apa pun secara eksplisit.
- Eksekusi subagent Plugin yang tidak tepercaya tetap berfungsi, tetapi permintaan override ditolak alih-alih diam-diam fallback.
- Sesi subagent yang dibuat Plugin diberi tag dengan id Plugin pembuatnya. Fallback `api.runtime.subagent.deleteSession(...)` hanya dapat menghapus sesi yang dimiliki tersebut; penghapusan sesi sembarang tetap memerlukan permintaan Gateway dengan cakupan admin.

Untuk pencarian web, Plugin dapat memakai helper runtime bersama alih-alih
masuk ke wiring tool agen:

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

Plugin juga dapat mendaftarkan penyedia web-search melalui
`api.registerWebSearchProvider(...)`.

Catatan:

- Pertahankan pemilihan penyedia, resolusi kredensial, dan semantik permintaan bersama di inti.
- Gunakan penyedia web-search untuk transport pencarian khusus vendor.
- `api.runtime.webSearch.*` adalah permukaan bersama yang disarankan untuk Plugin fitur/channel yang memerlukan perilaku pencarian tanpa bergantung pada wrapper tool agen.

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

- `generate(...)`: membuat gambar menggunakan chain penyedia image-generation yang dikonfigurasi.
- `listProviders(...)`: mencantumkan penyedia image-generation yang tersedia beserta kapabilitasnya.

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
- `auth`: wajib. Gunakan `"gateway"` untuk mewajibkan auth gateway normal, atau `"plugin"` untuk verifikasi auth/webhook yang dikelola Plugin.
- `match`: opsional. `"exact"` (default) atau `"prefix"`.
- `replaceExisting`: opsional. Memungkinkan Plugin yang sama mengganti registrasi rutenya sendiri yang sudah ada.
- `handler`: kembalikan `true` saat rute menangani permintaan.

Catatan:

- `api.registerHttpHandler(...)` telah dihapus dan akan menyebabkan kesalahan pemuatan plugin. Gunakan `api.registerHttpRoute(...)` sebagai gantinya.
- Rute Plugin harus mendeklarasikan `auth` secara eksplisit.
- Konflik persis `path + match` ditolak kecuali `replaceExisting: true`, dan satu plugin tidak dapat menggantikan rute milik plugin lain.
- Rute yang tumpang tindih dengan level `auth` berbeda ditolak. Pertahankan rantai fallthrough `exact`/`prefix` hanya pada level auth yang sama.
- Rute `auth: "plugin"` **tidak** menerima cakupan runtime operator secara otomatis. Rute tersebut ditujukan untuk webhook/verifikasi tanda tangan yang dikelola plugin, bukan panggilan pembantu Gateway yang memiliki hak istimewa.
- Rute `auth: "gateway"` berjalan di dalam cakupan runtime permintaan Gateway, tetapi cakupan itu sengaja konservatif:
  - auth bearer rahasia bersama (`gateway.auth.mode = "token"` / `"password"`) mempertahankan cakupan runtime rute plugin tetap pada `operator.write`, meskipun pemanggil mengirim `x-openclaw-scopes`
  - mode HTTP pembawa identitas tepercaya (misalnya `trusted-proxy` atau `gateway.auth.mode = "none"` pada ingress privat) menghormati `x-openclaw-scopes` hanya ketika header tersebut hadir secara eksplisit
  - jika `x-openclaw-scopes` tidak ada pada permintaan rute plugin pembawa identitas tersebut, cakupan runtime kembali ke `operator.write`
- Aturan praktis: jangan berasumsi rute plugin dengan auth gateway adalah permukaan admin implisit. Jika rute Anda memerlukan perilaku khusus admin, wajibkan mode auth pembawa identitas dan dokumentasikan kontrak header eksplisit `x-openclaw-scopes`.

## Jalur impor SDK Plugin

Gunakan subjalur SDK yang sempit, bukan barrel root monolitik `openclaw/plugin-sdk`
saat membuat plugin baru. Subjalur inti:

| Subjalur                            | Tujuan                                             |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitif pendaftaran Plugin                        |
| `openclaw/plugin-sdk/channel-core`  | Pembantu entri/build kanal                         |
| `openclaw/plugin-sdk/core`          | Pembantu bersama generik dan kontrak payung        |
| `openclaw/plugin-sdk/config-schema` | Skema Zod root `openclaw.json` (`OpenClawSchema`)  |

Plugin kanal memilih dari keluarga seam sempit — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, dan `channel-actions`. Perilaku persetujuan harus dikonsolidasikan
pada satu kontrak `approvalCapability`, bukan dicampur di berbagai field
plugin yang tidak terkait. Lihat [Plugin kanal](/id/plugins/sdk-channel-plugins).

Pembantu runtime dan konfigurasi berada di bawah subjalur `*-runtime` terfokus
yang sesuai (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, dll.). Pilih `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot`, dan `config-mutation`
alih-alih barrel kompatibilitas `config-runtime` yang luas.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
dan `openclaw/plugin-sdk/infra-runtime` adalah shim kompatibilitas usang untuk
plugin lama. Kode baru harus mengimpor primitif generik yang lebih sempit.
</Info>

Titik entri internal repo (per root paket plugin bawaan):

- `index.js` — entri plugin bawaan
- `api.js` — barrel pembantu/tipe
- `runtime-api.js` — barrel khusus runtime
- `setup-entry.js` — entri plugin setup

Plugin eksternal hanya boleh mengimpor subjalur `openclaw/plugin-sdk/*`. Jangan pernah
mengimpor `src/*` milik paket plugin lain dari core atau dari plugin lain.
Titik entri yang dimuat facade memilih snapshot konfigurasi runtime aktif saat tersedia,
lalu fallback ke file konfigurasi yang telah di-resolve di disk.

Subjalur khusus kapabilitas seperti `image-generation`, `media-understanding`,
dan `speech` ada karena plugin bawaan menggunakannya saat ini. Subjalur tersebut tidak
otomatis menjadi kontrak eksternal jangka panjang yang dibekukan — periksa halaman
referensi SDK yang relevan saat mengandalkannya.

## Skema alat pesan

Plugin harus memiliki kontribusi skema `describeMessageTool(...)` khusus kanal
untuk primitif non-pesan seperti reaksi, baca, dan polling.
Presentasi kirim bersama harus menggunakan kontrak `MessagePresentation` generik
alih-alih field tombol, komponen, blok, atau kartu native penyedia.
Lihat [Presentasi Pesan](/id/plugins/message-presentation) untuk kontrak,
aturan fallback, pemetaan penyedia, dan daftar periksa pembuat plugin.

Plugin yang dapat mengirim mendeklarasikan apa yang dapat mereka render melalui kapabilitas pesan:

- `presentation` untuk blok presentasi semantik (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` untuk permintaan pengiriman yang disematkan

Core memutuskan apakah akan merender presentasi secara native atau menurunkannya menjadi teks.
Jangan mengekspos escape hatch UI native penyedia dari alat pesan generik.
Pembantu SDK usang untuk skema native lama tetap diekspor untuk plugin pihak ketiga
yang sudah ada, tetapi plugin baru tidak boleh menggunakannya.

## Resolusi target kanal

Plugin kanal harus memiliki semantik target khusus kanal. Pertahankan host outbound
bersama tetap generik dan gunakan permukaan adapter pesan untuk aturan penyedia:

- `messaging.inferTargetChatType({ to })` memutuskan apakah target ternormalisasi
  harus diperlakukan sebagai `direct`, `group`, atau `channel` sebelum lookup direktori.
- `messaging.targetResolver.looksLikeId(raw, normalized)` memberi tahu core apakah
  input harus langsung melewati ke resolusi mirip id, bukan pencarian direktori.
- `messaging.targetResolver.resolveTarget(...)` adalah fallback plugin ketika
  core membutuhkan resolusi akhir milik penyedia setelah normalisasi atau setelah
  miss direktori.
- `messaging.resolveOutboundSessionRoute(...)` memiliki konstruksi rute sesi
  khusus penyedia setelah target di-resolve.

Pembagian yang direkomendasikan:

- Gunakan `inferTargetChatType` untuk keputusan kategori yang harus terjadi sebelum
  mencari peer/grup.
- Gunakan `looksLikeId` untuk pemeriksaan "perlakukan ini sebagai id target eksplisit/native".
- Gunakan `resolveTarget` untuk fallback normalisasi khusus penyedia, bukan untuk
  pencarian direktori yang luas.
- Pertahankan id native penyedia seperti id chat, id thread, JID, handle, dan id room
  di dalam nilai `target` atau param khusus penyedia, bukan di field SDK generik.

## Direktori berbasis konfigurasi

Plugin yang menurunkan entri direktori dari konfigurasi harus mempertahankan logika itu di
plugin dan menggunakan kembali pembantu bersama dari
`openclaw/plugin-sdk/directory-runtime`.

Gunakan ini ketika kanal membutuhkan peer/grup berbasis konfigurasi seperti:

- peer DM yang digerakkan allowlist
- peta kanal/grup terkonfigurasi
- fallback direktori statis berlingkup akun

Pembantu bersama di `directory-runtime` hanya menangani operasi generik:

- pemfilteran kueri
- penerapan batas
- pembantu deduplikasi/normalisasi
- membangun `ChannelDirectoryEntry[]`

Inspeksi akun khusus kanal dan normalisasi id harus tetap berada di
implementasi plugin.

## Katalog penyedia

Plugin penyedia dapat mendefinisikan katalog model untuk inferensi dengan
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` mengembalikan bentuk yang sama seperti yang ditulis OpenClaw ke dalam
`models.providers`:

- `{ provider }` untuk satu entri penyedia
- `{ providers }` untuk beberapa entri penyedia

Gunakan `catalog` ketika plugin memiliki id model khusus penyedia, default URL dasar,
atau metadata model yang dibatasi auth.

`catalog.order` mengontrol kapan katalog plugin bergabung relatif terhadap penyedia implisit
bawaan OpenClaw:

- `simple`: penyedia API-key biasa atau digerakkan env
- `profile`: penyedia yang muncul ketika profil auth ada
- `paired`: penyedia yang mensintesis beberapa entri penyedia terkait
- `late`: pass terakhir, setelah penyedia implisit lain

Penyedia yang lebih akhir menang saat terjadi tabrakan key, sehingga plugin dapat sengaja menimpa
entri penyedia bawaan dengan id penyedia yang sama.

Kompatibilitas:

- `discovery` masih berfungsi sebagai alias lama
- jika `catalog` dan `discovery` sama-sama didaftarkan, OpenClaw menggunakan `catalog`

## Inspeksi kanal hanya-baca

Jika plugin Anda mendaftarkan kanal, sebaiknya implementasikan
`plugin.config.inspectAccount(cfg, accountId)` bersama `resolveAccount(...)`.

Alasannya:

- `resolveAccount(...)` adalah jalur runtime. Jalur ini boleh berasumsi kredensial
  sudah sepenuhnya dimaterialisasi dan dapat gagal cepat saat rahasia yang diperlukan hilang.
- Jalur perintah hanya-baca seperti `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, dan alur perbaikan
  doctor/konfigurasi tidak perlu mematerialisasi kredensial runtime hanya untuk
  mendeskripsikan konfigurasi.

Perilaku `inspectAccount(...)` yang direkomendasikan:

- Kembalikan hanya status akun deskriptif.
- Pertahankan `enabled` dan `configured`.
- Sertakan field sumber/status kredensial bila relevan, seperti:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Anda tidak perlu mengembalikan nilai token mentah hanya untuk melaporkan
  ketersediaan hanya-baca. Mengembalikan `tokenStatus: "available"` (dan field
  sumber yang sesuai) sudah cukup untuk perintah bergaya status.
- Gunakan `configured_unavailable` ketika kredensial dikonfigurasi melalui SecretRef tetapi
  tidak tersedia di jalur perintah saat ini.

Ini memungkinkan perintah hanya-baca melaporkan "terkonfigurasi tetapi tidak tersedia di jalur
perintah ini" alih-alih crash atau salah melaporkan akun sebagai tidak terkonfigurasi.

## Paket pack

Direktori plugin dapat menyertakan `package.json` dengan `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Setiap entri menjadi plugin. Jika pack mencantumkan beberapa extensions, id plugin
menjadi `name/<fileBase>`.

Jika plugin Anda mengimpor dependensi npm, instal dependensi tersebut di direktori itu agar
`node_modules` tersedia (`npm install` / `pnpm install`).

Guardrail keamanan: setiap entri `openclaw.extensions` harus tetap berada di dalam direktori plugin
setelah resolusi symlink. Entri yang keluar dari direktori paket akan ditolak.

Catatan keamanan: `openclaw plugins install` menginstal dependensi plugin dengan
`npm install --omit=dev --ignore-scripts` lokal proyek (tanpa skrip lifecycle,
tanpa dependensi dev saat runtime), mengabaikan pengaturan npm install global yang diwarisi.
Pertahankan pohon dependensi plugin "pure JS/TS" dan hindari paket yang memerlukan
build `postinstall`.

Opsional: `openclaw.setupEntry` dapat menunjuk ke modul khusus setup yang ringan.
Saat OpenClaw membutuhkan permukaan setup untuk plugin kanal yang dinonaktifkan, atau
saat plugin kanal diaktifkan tetapi masih belum terkonfigurasi, OpenClaw memuat `setupEntry`
alih-alih entri plugin penuh. Ini membuat startup dan setup lebih ringan
ketika entri plugin utama Anda juga merangkai alat, hook, atau kode khusus runtime lainnya.

Opsional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
dapat memilih plugin kanal masuk ke jalur `setupEntry` yang sama selama fase startup
pra-listen Gateway, bahkan ketika kanal sudah terkonfigurasi.

Gunakan ini hanya ketika `setupEntry` sepenuhnya mencakup permukaan startup yang harus ada
sebelum Gateway mulai listen. Dalam praktiknya, ini berarti entri setup
harus mendaftarkan setiap kapabilitas milik kanal yang diperlukan startup, seperti:

- pendaftaran kanal itu sendiri
- rute HTTP apa pun yang harus tersedia sebelum Gateway mulai listen
- metode, alat, atau layanan gateway apa pun yang harus ada selama jendela yang sama

Jika entri penuh Anda masih memiliki kapabilitas startup yang diperlukan, jangan aktifkan
flag ini. Pertahankan plugin pada perilaku default dan biarkan OpenClaw memuat
entri penuh selama startup.

Kanal bawaan juga dapat menerbitkan pembantu permukaan kontrak khusus setup yang dapat
dikonsultasikan core sebelum runtime kanal penuh dimuat. Permukaan promosi setup
saat ini adalah:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Inti menggunakan permukaan itu saat perlu mempromosikan konfigurasi kanal akun tunggal lama
ke `channels.<id>.accounts.*` tanpa memuat entri plugin penuh.
Matrix adalah contoh bundel saat ini: ini hanya memindahkan kunci auth/bootstrap ke
akun promosi bernama saat akun bernama sudah ada, dan dapat mempertahankan
kunci akun default non-kanonis yang dikonfigurasi alih-alih selalu membuat
`accounts.default`.

Adaptor patch penyiapan tersebut menjaga penemuan permukaan kontrak bundel tetap malas. Waktu
impor tetap ringan; permukaan promosi hanya dimuat saat pertama kali digunakan, bukan
masuk kembali ke startup kanal bundel pada impor modul.

Saat permukaan startup tersebut menyertakan metode RPC Gateway, pertahankan metode itu pada
prefiks khusus plugin. Namespace admin inti (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu di-resolve
ke `operator.admin`, meskipun plugin meminta cakupan yang lebih sempit.

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

### Metadata katalog kanal

Plugin kanal dapat mengiklankan metadata penyiapan/penemuan melalui `openclaw.channel` dan
petunjuk instal melalui `openclaw.install`. Ini menjaga data katalog inti tetap kosong.

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

Bidang `openclaw.channel` yang berguna di luar contoh minimal:

- `detailLabel`: label sekunder untuk permukaan katalog/status yang lebih kaya
- `docsLabel`: timpa teks tautan untuk tautan dokumentasi
- `preferOver`: id plugin/kanal berprioritas lebih rendah yang harus dikalahkan oleh entri katalog ini
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrol salinan permukaan pemilihan
- `markdownCapable`: menandai kanal sebagai mampu markdown untuk keputusan pemformatan keluar
- `exposure.configured`: sembunyikan kanal dari permukaan daftar kanal terkonfigurasi saat diatur ke `false`
- `exposure.setup`: sembunyikan kanal dari pemilih penyiapan/konfigurasi interaktif saat diatur ke `false`
- `exposure.docs`: tandai kanal sebagai internal/privat untuk permukaan navigasi dokumentasi
- `showConfigured` / `showInSetup`: alias lama yang masih diterima untuk kompatibilitas; lebih pilih `exposure`
- `quickstartAllowFrom`: ikutkan kanal ke dalam alur quickstart standar `allowFrom`
- `forceAccountBinding`: wajibkan pengikatan akun eksplisit meskipun hanya ada satu akun
- `preferSessionLookupForAnnounceTarget`: lebih pilih pencarian sesi saat me-resolve target pengumuman

OpenClaw juga dapat menggabungkan **katalog kanal eksternal** (misalnya, ekspor
registri MPM). Letakkan file JSON di salah satu dari:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Atau arahkan `OPENCLAW_PLUGIN_CATALOG_PATHS` (atau `OPENCLAW_MPM_CATALOG_PATHS`) ke
satu atau beberapa file JSON (dipisahkan koma/titik koma/`PATH`). Setiap file harus
berisi `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser juga menerima `"packages"` atau `"plugins"` sebagai alias lama untuk kunci `"entries"`.

Entri katalog kanal yang dihasilkan dan entri katalog instal penyedia mengekspos
fakta sumber instal yang dinormalisasi di samping blok mentah `openclaw.install`. Fakta
yang dinormalisasi mengidentifikasi apakah spesifikasi npm adalah versi eksak atau
pemilih mengambang, apakah metadata integritas yang diharapkan ada, dan apakah jalur
sumber lokal juga tersedia. Saat identitas katalog/paket diketahui, fakta
yang dinormalisasi memperingatkan jika nama paket npm yang diurai menyimpang dari identitas itu.
Fakta tersebut juga memperingatkan saat `defaultChoice` tidak valid atau menunjuk ke sumber yang
tidak tersedia, dan saat metadata integritas npm ada tanpa sumber npm yang valid.
Konsumen harus memperlakukan `installSource` sebagai bidang opsional aditif agar
entri buatan tangan dan shim katalog tidak perlu menyintesiskannya.
Ini memungkinkan onboarding dan diagnostik menjelaskan status bidang sumber tanpa
mengimpor runtime plugin.

Entri npm eksternal resmi sebaiknya lebih memilih `npmSpec` eksak plus
`expectedIntegrity`. Nama paket polos dan dist-tag tetap berfungsi untuk
kompatibilitas, tetapi memunculkan peringatan bidang sumber agar katalog dapat bergerak
menuju instal yang dipasangkan pin dan diperiksa integritasnya tanpa merusak plugin yang ada.
Saat onboarding menginstal dari jalur katalog lokal, proses ini mencatat entri indeks plugin
plugin terkelola dengan `source: "path"` dan `sourcePath` relatif-workspace
bila memungkinkan. Jalur pemuatan operasional absolut tetap berada di
`plugins.load.paths`; catatan instal menghindari duplikasi jalur workstation lokal
ke konfigurasi berumur panjang. Ini membuat instal pengembangan lokal terlihat oleh
diagnostik bidang sumber tanpa menambahkan permukaan pengungkapan jalur filesystem mentah kedua.
Indeks plugin persisten `plugins/installs.json` adalah sumber kebenaran instal
dan dapat disegarkan tanpa memuat modul runtime plugin.
Peta `installRecords`-nya tahan lama meskipun manifes plugin hilang atau
tidak valid; array `plugins`-nya adalah tampilan manifes yang dapat dibangun ulang.

## Plugin mesin konteks

Plugin mesin konteks memiliki orkestrasi konteks sesi untuk ingest, assembly,
dan Compaction. Daftarkan dari plugin Anda dengan
`api.registerContextEngine(id, factory)`, lalu pilih mesin aktif dengan
`plugins.slots.contextEngine`.

Gunakan ini saat plugin Anda perlu mengganti atau memperluas pipeline konteks
default, bukan sekadar menambahkan pencarian memori atau hook.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
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

Factory `ctx` mengekspos nilai opsional `config`, `agentDir`, dan `workspaceDir`
untuk inisialisasi saat konstruksi.

Jika mesin Anda **tidak** memiliki algoritme Compaction, pertahankan `compact()`
tetap diimplementasikan dan delegasikan secara eksplisit:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", (ctx) => ({
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

Saat plugin membutuhkan perilaku yang tidak cocok dengan API saat ini, jangan melewati
sistem plugin dengan akses privat ke dalam. Tambahkan kemampuan yang hilang.

Urutan yang disarankan:

1. definisikan kontrak inti
   Putuskan perilaku bersama apa yang harus dimiliki inti: kebijakan, fallback, penggabungan konfigurasi,
   lifecycle, semantik yang menghadap kanal, dan bentuk helper runtime.
2. tambahkan permukaan registrasi/runtime plugin bertipe
   Perluas `OpenClawPluginApi` dan/atau `api.runtime` dengan permukaan
   kemampuan bertipe terkecil yang berguna.
3. sambungkan konsumen inti + kanal/fitur
   Kanal dan plugin fitur harus mengonsumsi kemampuan baru melalui inti,
   bukan dengan mengimpor implementasi vendor secara langsung.
4. daftarkan implementasi vendor
   Plugin vendor kemudian mendaftarkan backend mereka terhadap kemampuan tersebut.
5. tambahkan cakupan kontrak
   Tambahkan pengujian agar kepemilikan dan bentuk registrasi tetap eksplisit seiring waktu.

Beginilah OpenClaw tetap berpendirian tanpa menjadi hardcoded ke pandangan dunia satu
penyedia. Lihat [Cookbook Kemampuan](/id/plugins/architecture)
untuk checklist file konkret dan contoh yang dikerjakan.

### Checklist kemampuan

Saat Anda menambahkan kemampuan baru, implementasinya biasanya harus menyentuh
permukaan ini bersama-sama:

- tipe kontrak inti di `src/<capability>/types.ts`
- helper runner/runtime inti di `src/<capability>/runtime.ts`
- permukaan registrasi API plugin di `src/plugins/types.ts`
- pengabelan registri plugin di `src/plugins/registry.ts`
- eksposur runtime plugin di `src/plugins/runtime/*` saat plugin fitur/kanal
  perlu mengonsumsinya
- helper capture/pengujian di `src/test-utils/plugin-registration.ts`
- asersi kepemilikan/kontrak di `src/plugins/contracts/registry.ts`
- dokumentasi operator/plugin di `docs/`

Jika salah satu permukaan tersebut hilang, itu biasanya tanda bahwa kemampuan tersebut
belum sepenuhnya terintegrasi.

### Templat kemampuan

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

Itu menjaga aturannya tetap sederhana:

- inti memiliki kontrak kemampuan + orkestrasi
- plugin vendor memiliki implementasi vendor
- plugin fitur/kanal mengonsumsi helper runtime
- pengujian kontrak menjaga kepemilikan tetap eksplisit

## Terkait

- [Arsitektur Plugin](/id/plugins/architecture) — model dan bentuk kemampuan publik
- [Subpath SDK Plugin](/id/plugins/sdk-subpaths)
- [Penyiapan SDK Plugin](/id/plugins/sdk-setup)
- [Membangun plugin](/id/plugins/building-plugins)

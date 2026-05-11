---
read_when:
    - Mengimplementasikan hook runtime penyedia, siklus hidup kanal, atau kumpulan paket
    - Pemecahan masalah urutan pemuatan Plugin atau status registri
    - Menambahkan kapabilitas Plugin baru atau Plugin mesin konteks
summary: 'Internal arsitektur Plugin: pipeline pemuatan, registry, hook runtime, rute HTTP, dan tabel referensi'
title: Internal arsitektur Plugin
x-i18n:
    generated_at: "2026-05-11T20:32:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: a74c068fce039ef3b85b2634caea0854e8ffb246a5ff59ebd8feadb8d93601d6
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Untuk model kapabilitas publik, bentuk Plugin, dan kontrak kepemilikan/eksekusi,
lihat [Arsitektur Plugin](/id/plugins/architecture). Halaman ini adalah
referensi untuk mekanisme internal: pipeline pemuatan, registry, hook runtime,
rute HTTP Gateway, path impor, dan tabel skema.

## Pipeline pemuatan

Saat startup, OpenClaw kurang lebih melakukan ini:

1. menemukan root Plugin kandidat
2. membaca manifes bundel native atau kompatibel dan metadata paket
3. menolak kandidat yang tidak aman
4. menormalkan konfigurasi Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. menentukan pengaktifan untuk setiap kandidat
6. memuat modul native yang diaktifkan: modul bundled bawaan memakai loader native;
   source TypeScript lokal pihak ketiga memakai fallback darurat Jiti
7. memanggil hook native `register(api)` dan mengumpulkan registrasi ke dalam registry Plugin
8. mengekspos registry ke perintah/permukaan runtime

<Note>
`activate` adalah alias lama untuk `register` — loader menyelesaikan mana pun yang ada (`def.register ?? def.activate`) dan memanggilnya pada titik yang sama. Semua Plugin bundled memakai `register`; utamakan `register` untuk Plugin baru.
</Note>

Gerbang keamanan terjadi **sebelum** eksekusi runtime. Kandidat diblokir
ketika entri keluar dari root Plugin, path dapat ditulis oleh semua pengguna, atau
kepemilikan path tampak mencurigakan untuk Plugin non-bundled.

Kandidat yang diblokir tetap terikat ke id Plugin-nya untuk diagnostik. Jika konfigurasi
masih mereferensikan id itu, validasi melaporkan Plugin sebagai ada tetapi diblokir
dan menunjuk kembali ke peringatan keamanan path, alih-alih memperlakukan entri konfigurasi
sebagai usang.

### Perilaku mengutamakan manifes

Manifes adalah sumber kebenaran control-plane. OpenClaw menggunakannya untuk:

- mengidentifikasi Plugin
- menemukan channel/skills/skema konfigurasi atau kapabilitas bundel yang dideklarasikan
- memvalidasi `plugins.entries.<id>.config`
- memperkaya label/placeholder Control UI
- menampilkan metadata instalasi/katalog
- mempertahankan deskriptor aktivasi dan penyiapan murah tanpa memuat runtime Plugin

Untuk Plugin native, modul runtime adalah bagian data-plane. Modul ini mendaftarkan
perilaku aktual seperti hook, tool, perintah, atau alur provider.

Blok manifes opsional `activation` dan `setup` tetap berada di control plane.
Keduanya adalah deskriptor metadata saja untuk perencanaan aktivasi dan penemuan penyiapan;
keduanya tidak menggantikan registrasi runtime, `register(...)`, atau `setupEntry`.
Konsumen aktivasi live pertama sekarang memakai petunjuk perintah, channel, dan provider manifes
untuk mempersempit pemuatan Plugin sebelum materialisasi registry yang lebih luas:

- pemuatan CLI mempersempit ke Plugin yang memiliki perintah utama yang diminta
- resolusi penyiapan/channel Plugin mempersempit ke Plugin yang memiliki
  id channel yang diminta
- resolusi penyiapan/runtime provider eksplisit mempersempit ke Plugin yang memiliki
  id provider yang diminta
- perencanaan startup Gateway memakai `activation.onStartup` untuk impor startup
  eksplisit dan opt-out startup; Plugin tanpa metadata startup hanya dimuat
  melalui pemicu aktivasi yang lebih sempit

Preload runtime saat permintaan yang meminta cakupan luas `all` tetap menurunkan
set id Plugin efektif eksplisit dari konfigurasi, perencanaan startup, channel
yang dikonfigurasi, slot, dan aturan auto-enable. Jika set turunan itu kosong, OpenClaw
memuat registry runtime kosong alih-alih memperluas ke setiap Plugin yang dapat ditemukan.

Perencana aktivasi mengekspos API hanya-id untuk caller yang ada dan API rencana
untuk diagnostik baru. Entri rencana melaporkan alasan sebuah Plugin dipilih,
memisahkan petunjuk perencana `activation.*` eksplisit dari fallback kepemilikan manifes
seperti `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, dan hook. Pemisahan alasan itu adalah batas kompatibilitas:
metadata Plugin yang ada tetap berfungsi, sementara kode baru dapat mendeteksi petunjuk luas
atau perilaku fallback tanpa mengubah semantik pemuatan runtime.

Penemuan penyiapan sekarang mengutamakan id milik deskriptor seperti `setup.providers` dan
`setup.cliBackends` untuk mempersempit Plugin kandidat sebelum fallback ke
`setup-api` untuk Plugin yang masih memerlukan hook runtime saat penyiapan. Daftar penyiapan
provider memakai `providerAuthChoices` manifes, pilihan penyiapan turunan deskriptor,
dan metadata katalog instalasi tanpa memuat runtime provider. `setup.requiresRuntime: false`
eksplisit adalah batas hanya-deskriptor; `requiresRuntime` yang dihilangkan
mempertahankan fallback setup-api lama demi kompatibilitas. Jika lebih dari satu
Plugin yang ditemukan mengklaim id provider penyiapan atau backend CLI ternormalisasi
yang sama, lookup penyiapan menolak owner yang ambigu alih-alih bergantung pada
urutan penemuan. Ketika runtime penyiapan memang dieksekusi, diagnostik registry melaporkan
drift antara `setup.providers` / `setup.cliBackends` dan provider atau backend CLI
yang didaftarkan oleh setup-api tanpa memblokir Plugin lama.

### Batas cache Plugin

OpenClaw tidak meng-cache hasil penemuan Plugin atau data registry manifes langsung
di balik jendela wall-clock. Instalasi, edit manifes, dan perubahan load-path
harus terlihat pada pembacaan metadata eksplisit berikutnya atau pembangunan ulang snapshot.
Parser file manifes dapat menyimpan cache tanda tangan file terbatas yang dikunci oleh
path manifes yang dibuka, inode, ukuran, dan timestamp; cache itu hanya menghindari
parsing ulang byte yang tidak berubah dan tidak boleh meng-cache jawaban penemuan,
registry, owner, atau kebijakan.

Fast path metadata yang aman adalah kepemilikan objek eksplisit, bukan cache tersembunyi.
Hot path startup Gateway harus meneruskan `PluginMetadataSnapshot` saat ini,
`PluginLookUpTable` turunan, atau registry manifes eksplisit melalui call chain.
Validasi konfigurasi, auto-enable startup, bootstrap Plugin, dan pemilihan provider
dapat menggunakan ulang objek tersebut selama objek itu mewakili konfigurasi dan inventori
Plugin saat ini. Lookup penyiapan tetap merekonstruksi metadata manifes sesuai permintaan
kecuali path penyiapan spesifik menerima registry manifes eksplisit; pertahankan itu
sebagai fallback cold-path, alih-alih menambahkan cache lookup tersembunyi. Ketika input
berubah, bangun ulang dan ganti snapshot alih-alih memutasinya atau menyimpan
salinan historis.
View atas registry Plugin aktif dan helper bootstrap channel bundled
harus dihitung ulang dari registry/root saat ini. Map berumur pendek tidak masalah
di dalam satu panggilan untuk menghapus duplikasi kerja atau menjaga reentry; map tersebut
tidak boleh menjadi cache metadata proses.

Untuk pemuatan Plugin, lapisan cache persisten adalah pemuatan runtime. Lapisan ini dapat memakai ulang
state loader ketika kode atau artefak terinstal benar-benar dimuat, seperti:

- `PluginLoaderCacheState` dan registry runtime aktif yang kompatibel
- cache jiti/module dan cache loader permukaan publik yang dipakai untuk menghindari impor
  permukaan runtime yang sama berulang kali
- cache filesystem untuk artefak Plugin terinstal
- map per panggilan berumur pendek untuk normalisasi path atau resolusi duplikat

Cache tersebut adalah detail implementasi data-plane. Cache tersebut tidak boleh menjawab
pertanyaan control-plane seperti "Plugin mana yang memiliki provider ini?" kecuali
caller sengaja meminta pemuatan runtime.

Jangan menambahkan cache persisten atau wall-clock untuk:

- hasil penemuan
- registry manifes langsung
- registry manifes yang direkonstruksi dari indeks Plugin terinstal
- lookup owner provider, penekanan model, kebijakan provider, atau metadata artefak publik
- jawaban turunan manifes lainnya ketika manifes, indeks terinstal,
  atau load path yang berubah harus terlihat pada pembacaan metadata berikutnya

Caller yang membangun ulang metadata manifes dari indeks Plugin terinstal yang dipersistenkan
merekonstruksi registry itu sesuai permintaan. Indeks terinstal adalah state source-plane
yang tahan lama; indeks tersebut bukan cache metadata in-process tersembunyi.

## Model registry

Plugin yang dimuat tidak langsung memutasi global core acak. Plugin mendaftar ke
registry Plugin pusat.

Registry melacak:

- record Plugin (identitas, source, origin, status, diagnostik)
- tool
- hook lama dan hook bertipe
- channel
- provider
- handler RPC Gateway
- rute HTTP
- registrar CLI
- layanan latar belakang
- perintah milik Plugin

Fitur core kemudian membaca dari registry itu alih-alih berbicara langsung ke modul Plugin.
Ini menjaga pemuatan satu arah:

- modul Plugin -> registrasi registry
- runtime core -> konsumsi registry

Pemisahan itu penting untuk kemudahan pemeliharaan. Artinya sebagian besar permukaan core hanya
memerlukan satu titik integrasi: "baca registry", bukan "perlakukan setiap modul Plugin secara khusus".

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
- `binding`: binding yang terselesaikan untuk permintaan yang disetujui
- `request`: ringkasan permintaan asli, petunjuk detach, id pengirim, dan
  metadata percakapan

Callback ini hanya notifikasi. Callback ini tidak mengubah siapa yang diizinkan mengikat
percakapan, dan berjalan setelah penanganan approval core selesai.

## Hook runtime provider

Plugin provider memiliki tiga lapisan:

- **Metadata manifes** untuk lookup murah sebelum runtime:
  `setup.providers[].envVars`, kompatibilitas usang `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices`, dan `channelEnvVars`.
- **Hook waktu konfigurasi**: `catalog` (`discovery` lama) plus
  `applyConfigDefaults`.
- **Hook runtime**: lebih dari 40 hook opsional yang mencakup auth, resolusi model,
  pembungkus stream, tingkat thinking, kebijakan replay, dan endpoint usage. Lihat
  daftar lengkap di [Urutan dan penggunaan hook](#hook-order-and-usage).

OpenClaw tetap memiliki loop agen generik, failover, penanganan transkrip, dan
kebijakan tool. Hook ini adalah permukaan ekstensi untuk perilaku spesifik provider
tanpa memerlukan transport inferensi kustom penuh.

Gunakan manifes `setup.providers[].envVars` ketika provider memiliki kredensial berbasis env
yang harus dilihat oleh path auth/status/pemilih-model generik tanpa memuat runtime Plugin.
`providerAuthEnvVars` yang usang masih dibaca oleh adapter kompatibilitas selama
jendela deprekasi, dan Plugin non-bundled yang menggunakannya menerima diagnostik manifes.
Gunakan manifes `providerAuthAliases` ketika satu id provider harus memakai ulang env var,
profil auth, auth berbasis konfigurasi, dan pilihan onboarding API-key milik id provider lain.
Gunakan manifes `providerAuthChoices` ketika permukaan CLI onboarding/pilihan-auth harus mengetahui
id pilihan provider, label grup, dan wiring auth satu-flag sederhana tanpa
memuat runtime provider. Pertahankan `envVars` runtime provider untuk petunjuk yang menghadap operator
seperti label onboarding atau variabel penyiapan client-id/client-secret OAuth.

Gunakan manifes `channelEnvVars` ketika sebuah channel memiliki auth atau penyiapan berbasis env
yang harus dilihat oleh fallback shell-env generik, pemeriksaan konfigurasi/status, atau prompt penyiapan
tanpa memuat runtime channel.

### Urutan dan penggunaan hook

Untuk Plugin model/provider, OpenClaw memanggil hook dalam urutan kasar ini.
Kolom "Kapan digunakan" adalah panduan keputusan cepat.
Field provider khusus kompatibilitas yang tidak lagi dipanggil OpenClaw, seperti
`ProviderPlugin.capabilities` dan `suppressBuiltInModel`, sengaja tidak
dicantumkan di sini.

| #   | Kait                              | Apa yang dilakukan                                                                                            | Kapan digunakan                                                                                                                            |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Menerbitkan konfigurasi provider ke `models.providers` selama pembuatan `models.json`                         | Provider memiliki katalog atau default URL dasar                                                                                            |
| 2   | `applyConfigDefaults`             | Menerapkan default konfigurasi global milik provider selama materialisasi konfigurasi                          | Default bergantung pada mode autentikasi, env, atau semantik keluarga model provider                                                        |
| --  | _(pencarian model bawaan)_        | OpenClaw mencoba jalur registry/katalog normal terlebih dahulu                                                 | _(bukan kait Plugin)_                                                                                                                       |
| 3   | `normalizeModelId`                | Menormalkan alias id model lama atau pratinjau sebelum pencarian                                               | Provider memiliki pembersihan alias sebelum resolusi model kanonis                                                                         |
| 4   | `normalizeTransport`              | Menormalkan `api` / `baseUrl` keluarga provider sebelum perakitan model generik                                | Provider memiliki pembersihan transport untuk id provider kustom dalam keluarga transport yang sama                                         |
| 5   | `normalizeConfig`                 | Menormalkan `models.providers.<id>` sebelum resolusi runtime/provider                                          | Provider memerlukan pembersihan konfigurasi yang seharusnya berada bersama Plugin; helper keluarga Google bawaan juga menjadi cadangan untuk entri konfigurasi Google yang didukung |
| 6   | `applyNativeStreamingUsageCompat` | Menerapkan penulisan ulang kompatibilitas penggunaan streaming native ke provider konfigurasi                   | Provider memerlukan perbaikan metadata penggunaan streaming native berbasis endpoint                                                        |
| 7   | `resolveConfigApiKey`             | Meresolusikan autentikasi penanda env untuk provider konfigurasi sebelum pemuatan autentikasi runtime          | Provider memiliki resolusi kunci API penanda env milik provider; `amazon-bedrock` juga memiliki resolver penanda env AWS bawaan di sini     |
| 8   | `resolveSyntheticAuth`            | Menampilkan autentikasi lokal/self-hosted atau berbasis konfigurasi tanpa menyimpan plaintext                  | Provider dapat beroperasi dengan penanda kredensial sintetis/lokal                                                                          |
| 9   | `resolveExternalAuthProfiles`     | Melapisi profil autentikasi eksternal milik provider; default `persistence` adalah `runtime-only` untuk kredensial milik CLI/aplikasi | Provider menggunakan ulang kredensial autentikasi eksternal tanpa menyimpan token refresh yang disalin; deklarasikan `contracts.externalAuthProviders` di manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Menurunkan prioritas placeholder profil sintetis tersimpan di belakang autentikasi berbasis env/konfigurasi    | Provider menyimpan profil placeholder sintetis yang tidak boleh menang dalam prioritas                                                      |
| 11  | `resolveDynamicModel`             | Fallback sinkron untuk id model milik provider yang belum ada di registry lokal                                | Provider menerima id model upstream arbitrer                                                                                                |
| 12  | `prepareDynamicModel`             | Pemanasan async, lalu `resolveDynamicModel` berjalan lagi                                                      | Provider memerlukan metadata jaringan sebelum meresolusikan id yang tidak dikenal                                                           |
| 13  | `normalizeResolvedModel`          | Penulisan ulang final sebelum runner tertanam menggunakan model yang telah diresolusikan                       | Provider memerlukan penulisan ulang transport tetapi tetap menggunakan transport inti                                                       |
| 14  | `contributeResolvedModelCompat`   | Menyumbangkan flag kompatibilitas untuk model vendor di balik transport lain yang kompatibel                   | Provider mengenali modelnya sendiri pada transport proxy tanpa mengambil alih provider                                                      |
| 15  | `normalizeToolSchemas`            | Menormalkan skema tool sebelum runner tertanam melihatnya                                                      | Provider memerlukan pembersihan skema keluarga transport                                                                                    |
| 16  | `inspectToolSchemas`              | Menampilkan diagnostik skema milik provider setelah normalisasi                                                | Provider menginginkan peringatan kata kunci tanpa mengajarkan aturan khusus provider ke inti                                                |
| 17  | `resolveReasoningOutputMode`      | Memilih kontrak output penalaran native vs bertag                                                              | Provider memerlukan penalaran/output final bertag alih-alih field native                                                                    |
| 18  | `prepareExtraParams`              | Normalisasi parameter request sebelum wrapper opsi stream generik                                              | Provider memerlukan parameter request default atau pembersihan parameter per provider                                                       |
| 19  | `createStreamFn`                  | Mengganti sepenuhnya jalur stream normal dengan transport kustom                                               | Provider memerlukan protokol wire kustom, bukan sekadar wrapper                                                                             |
| 20  | `wrapStreamFn`                    | Wrapper stream setelah wrapper generik diterapkan                                                              | Provider memerlukan wrapper kompatibilitas header/body/model request tanpa transport kustom                                                 |
| 21  | `resolveTransportTurnState`       | Melampirkan header atau metadata transport native per giliran                                                  | Provider ingin transport generik mengirim identitas giliran native provider                                                                 |
| 22  | `resolveWebSocketSessionPolicy`   | Melampirkan header WebSocket native atau kebijakan jeda sesi                                                   | Provider ingin transport WS generik menyesuaikan header sesi atau kebijakan fallback                                                        |
| 23  | `formatApiKey`                    | Pemformat profil autentikasi: profil tersimpan menjadi string `apiKey` runtime                                 | Provider menyimpan metadata autentikasi tambahan dan memerlukan bentuk token runtime kustom                                                 |
| 24  | `refreshOAuth`                    | Override refresh OAuth untuk endpoint refresh kustom atau kebijakan kegagalan refresh                          | Provider tidak cocok dengan refresher `pi-ai` bersama                                                                                        |
| 25  | `buildAuthDoctorHint`             | Petunjuk perbaikan yang ditambahkan saat refresh OAuth gagal                                                   | Provider memerlukan panduan perbaikan autentikasi milik provider setelah kegagalan refresh                                                  |
| 26  | `matchesContextOverflowError`     | Pencocok overflow jendela konteks milik provider                                                               | Provider memiliki error overflow mentah yang akan terlewat oleh heuristik generik                                                           |
| 27  | `classifyFailoverReason`          | Klasifikasi alasan failover milik provider                                                                     | Provider dapat memetakan error API/transport mentah ke batas laju/kelebihan beban/dll.                                                      |
| 28  | `isCacheTtlEligible`              | Kebijakan cache prompt untuk provider proxy/backhaul                                                           | Provider memerlukan gating TTL cache khusus proxy                                                                                            |
| 29  | `buildMissingAuthMessage`         | Pengganti pesan pemulihan autentikasi hilang generik                                                           | Provider memerlukan petunjuk pemulihan autentikasi hilang yang khusus provider                                                              |
| 30  | `augmentModelCatalog`             | Baris katalog sintetis/final yang ditambahkan setelah discovery                                                | Provider memerlukan baris forward-compat sintetis di `models list` dan pemilih                                                              |
| 31  | `resolveThinkingProfile`          | Set level `/think` khusus model, label tampilan, dan default                                                   | Provider mengekspos tangga berpikir kustom atau label biner untuk model tertentu                                                            |
| 32  | `isBinaryThinking`                | Kait kompatibilitas toggle penalaran aktif/nonaktif                                                            | Provider hanya mengekspos berpikir biner aktif/nonaktif                                                                                     |
| 33  | `supportsXHighThinking`           | Kait kompatibilitas dukungan penalaran `xhigh`                                                                 | Provider menginginkan `xhigh` hanya pada subset model                                                                                        |
| 34  | `resolveDefaultThinkingLevel`     | Kait kompatibilitas level `/think` default                                                                     | Provider memiliki kebijakan `/think` default untuk keluarga model                                                                           |
| 35  | `isModernModelRef`                | Pencocok model modern untuk filter profil live dan pemilihan smoke                                             | Provider memiliki pencocokan model pilihan live/smoke                                                                                       |
| 36  | `prepareRuntimeAuth`              | Menukar kredensial yang dikonfigurasi menjadi token/kunci runtime aktual tepat sebelum inference               | Provider memerlukan pertukaran token atau kredensial request berumur pendek                                                                 |
| 37  | `resolveUsageAuth`                | Menyelesaikan kredensial penggunaan/penagihan untuk `/usage` dan permukaan status terkait                                     | Penyedia memerlukan penguraian token penggunaan/kuota khusus atau kredensial penggunaan yang berbeda                                                               |
| 38  | `fetchUsageSnapshot`              | Mengambil dan menormalisasi snapshot penggunaan/kuota khusus penyedia setelah autentikasi diselesaikan                             | Penyedia memerlukan endpoint penggunaan khusus penyedia atau parser payload yang berbeda                                                                           |
| 39  | `createEmbeddingProvider`         | Membangun adaptor embedding milik penyedia untuk memori/pencarian                                                     | Perilaku embedding memori berada di Plugin penyedia                                                                                    |
| 40  | `buildReplayPolicy`               | Mengembalikan kebijakan replay yang mengontrol penanganan transkrip untuk penyedia                                        | Penyedia memerlukan kebijakan transkrip khusus (misalnya, penghapusan thinking-block)                                                               |
| 41  | `sanitizeReplayHistory`           | Menulis ulang riwayat replay setelah pembersihan transkrip generik                                                        | Penyedia memerlukan penulisan ulang replay khusus penyedia di luar helper compaction bersama                                                             |
| 42  | `validateReplayTurns`             | Validasi atau pembentukan ulang final replay-turn sebelum runner tersemat                                           | Transport penyedia memerlukan validasi giliran yang lebih ketat setelah sanitasi generik                                                                    |
| 43  | `onModelSelected`                 | Menjalankan efek samping pasca-pemilihan milik penyedia                                                                 | Penyedia memerlukan telemetri atau status milik penyedia saat sebuah model menjadi aktif                                                                  |

`normalizeModelId`, `normalizeTransport`, dan `normalizeConfig` pertama-tama memeriksa
Plugin penyedia yang cocok, lalu meneruskan ke Plugin penyedia lain yang mendukung hook
hingga ada yang benar-benar mengubah id model atau transport/config. Ini menjaga
shim penyedia alias/kompat tetap berfungsi tanpa mengharuskan pemanggil mengetahui
Plugin bawaan mana yang memiliki penulisan ulang tersebut. Jika tidak ada hook penyedia
yang menulis ulang entri config keluarga Google yang didukung, penormal config Google
bawaan tetap menerapkan pembersihan kompatibilitas itu.

Jika penyedia membutuhkan protokol wire yang sepenuhnya kustom atau eksekutor permintaan kustom,
itu adalah kelas ekstensi yang berbeda. Hook ini ditujukan untuk perilaku penyedia
yang masih berjalan pada loop inferensi normal OpenClaw.

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

Plugin penyedia bawaan menggabungkan hook di atas agar sesuai dengan kebutuhan katalog,
auth, thinking, replay, dan penggunaan tiap vendor. Set hook otoritatif berada bersama
setiap Plugin di bawah `extensions/`; halaman ini mengilustrasikan bentuknya, bukan
mencerminkan daftar tersebut.

<AccordionGroup>
  <Accordion title="Penyedia katalog pass-through">
    OpenRouter, Kilocode, Z.AI, xAI mendaftarkan `catalog` plus
    `resolveDynamicModel` / `prepareDynamicModel` agar dapat menampilkan id model
    upstream sebelum katalog statis OpenClaw.
  </Accordion>
  <Accordion title="Penyedia endpoint OAuth dan penggunaan">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai memasangkan
    `prepareRuntimeAuth` atau `formatApiKey` dengan `resolveUsageAuth` +
    `fetchUsageSnapshot` untuk memiliki pertukaran token dan integrasi `/usage`.
  </Accordion>
  <Accordion title="Keluarga pembersihan replay dan transkrip">
    Keluarga bernama bersama (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) memungkinkan penyedia ikut memakai
    kebijakan transkrip melalui `buildReplayPolicy`, alih-alih setiap Plugin
    mengimplementasikan ulang pembersihan.
  </Accordion>
  <Accordion title="Penyedia hanya katalog">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway`, dan
    `volcengine` hanya mendaftarkan `catalog` dan memakai loop inferensi bersama.
  </Accordion>
  <Accordion title="Helper stream khusus Anthropic">
    Header beta, `/fast` / `serviceTier`, dan `context1m` berada di dalam seam
    publik `api.ts` / `contract-api.ts` milik Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), bukan di
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

- `textToSpeech` mengembalikan payload keluaran TTS core normal untuk permukaan file/catatan suara.
- Menggunakan konfigurasi core `messages.tts` dan pemilihan penyedia.
- Mengembalikan buffer audio PCM + laju sampel. Plugin harus melakukan resample/encode untuk penyedia.
- `listVoices` bersifat opsional per penyedia. Gunakan untuk pemilih suara atau alur penyiapan milik vendor.
- Daftar suara dapat menyertakan metadata yang lebih kaya seperti locale, gender, dan tag kepribadian untuk pemilih yang sadar penyedia.
- OpenAI dan ElevenLabs mendukung telephony saat ini. Microsoft tidak.

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

- Simpan kebijakan TTS, fallback, dan pengiriman balasan di core.
- Gunakan penyedia speech untuk perilaku sintesis milik vendor.
- Input Microsoft lama `edge` dinormalkan ke id penyedia `microsoft`.
- Model kepemilikan yang disarankan berorientasi perusahaan: satu Plugin vendor dapat memiliki
  penyedia teks, speech, gambar, dan media masa depan saat OpenClaw menambahkan
  kontrak kapabilitas tersebut.

Untuk pemahaman gambar/audio/video, Plugin mendaftarkan satu penyedia
media-understanding bertipe, bukan bag key/value generik:

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

- Simpan orkestrasi, fallback, config, dan pengabelan channel di core.
- Simpan perilaku vendor di Plugin penyedia.
- Ekspansi aditif harus tetap bertipe: metode opsional baru, bidang hasil opsional baru, kapabilitas opsional baru.
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

const extraction = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
  provider: "codex",
  model: "gpt-5.5",
  input: [
    {
      type: "image",
      buffer: receiptImageBuffer,
      fileName: "receipt.png",
      mime: "image/png",
    },
    { type: "text", text: "Use the printed fields as the source of truth." },
  ],
  instructions: "Return entities and searchable tags.",
  schemaName: "example.evidence",
  jsonSchema: {
    type: "object",
    properties: {
      entities: { type: "array", items: { type: "string" } },
      tags: { type: "array", items: { type: "string" } },
    },
  },
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
- `extractStructuredWithModel(...)` adalah seam yang dihadapkan ke Plugin untuk ekstraksi
  terbatas milik penyedia yang mengutamakan gambar. Sertakan setidaknya satu input gambar;
  input teks adalah konteks tambahan.
  Plugin produk memiliki rute dan skemanya, sementara OpenClaw memiliki
  batas penyedia/runtime.
- Menggunakan konfigurasi audio media-understanding core (`tools.media.audio`) dan urutan fallback penyedia.
- Mengembalikan `{ text: undefined }` saat tidak ada keluaran transkripsi yang dihasilkan (misalnya input dilewati/tidak didukung).
- `api.runtime.stt.transcribeAudioFile(...)` tetap tersedia sebagai alias kompatibilitas.

Plugin juga dapat meluncurkan run subagent latar belakang melalui `api.runtime.subagent`:

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
- OpenClaw hanya menghormati bidang override tersebut untuk pemanggil tepercaya.
- Untuk run fallback milik Plugin, operator harus ikut serta dengan `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Gunakan `plugins.entries.<id>.subagent.allowedModels` untuk membatasi Plugin tepercaya ke target kanonis `provider/model` tertentu, atau `"*"` untuk mengizinkan target apa pun secara eksplisit.
- Run subagent Plugin yang tidak tepercaya tetap berfungsi, tetapi permintaan override ditolak alih-alih diam-diam memakai fallback.
- Sesi subagent yang dibuat Plugin diberi tag dengan id Plugin pembuat. Fallback `api.runtime.subagent.deleteSession(...)` hanya dapat menghapus sesi yang dimiliki tersebut; penghapusan sesi arbitrer tetap memerlukan permintaan Gateway dengan cakupan admin.

Untuk pencarian web, Plugin dapat menggunakan helper runtime bersama alih-alih
menjangkau wiring tool agen:

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

Plugin juga dapat mendaftarkan penyedia pencarian web melalui
`api.registerWebSearchProvider(...)`.

Catatan:

- Simpan pemilihan penyedia, resolusi kredensial, dan semantik permintaan bersama di core.
- Gunakan penyedia pencarian web untuk transport pencarian khusus vendor.
- `api.runtime.webSearch.*` adalah permukaan bersama yang disarankan untuk Plugin fitur/channel yang membutuhkan perilaku pencarian tanpa bergantung pada wrapper tool agen.

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

- `generate(...)`: menghasilkan gambar menggunakan rantai penyedia pembuatan gambar yang dikonfigurasi.
- `listProviders(...)`: mencantumkan penyedia pembuatan gambar yang tersedia dan kapabilitasnya.

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

Bidang rute:

- `path`: path rute di bawah server HTTP gateway.
- `auth`: wajib. Gunakan `"gateway"` untuk mewajibkan auth gateway normal, atau `"plugin"` untuk verifikasi auth/webhook yang dikelola Plugin.
- `match`: opsional. `"exact"` (default) atau `"prefix"`.
- `replaceExisting`: opsional. Mengizinkan Plugin yang sama mengganti pendaftaran rute miliknya yang sudah ada.
- `handler`: kembalikan `true` saat rute menangani permintaan.

Catatan:

- `api.registerHttpHandler(...)` telah dihapus dan akan menyebabkan kesalahan pemuatan Plugin. Gunakan `api.registerHttpRoute(...)` sebagai gantinya.
- Rute Plugin harus mendeklarasikan `auth` secara eksplisit.
- Konflik `path + match` yang persis ditolak kecuali `replaceExisting: true`, dan satu Plugin tidak dapat menggantikan rute Plugin lain.
- Rute yang tumpang tindih dengan tingkat `auth` berbeda ditolak. Pertahankan rantai fallback `exact`/`prefix` hanya pada tingkat auth yang sama.
- Rute `auth: "plugin"` **tidak** menerima cakupan runtime operator secara otomatis. Rute ini ditujukan untuk Webhook/verifikasi tanda tangan yang dikelola Plugin, bukan panggilan pembantu Gateway yang memiliki hak istimewa.
- Rute `auth: "gateway"` berjalan di dalam cakupan runtime permintaan Gateway, tetapi cakupan tersebut sengaja dibuat konservatif:
  - auth bearer rahasia bersama (`gateway.auth.mode = "token"` / `"password"`) menjaga cakupan runtime rute Plugin tetap dipatok ke `operator.write`, meskipun pemanggil mengirim `x-openclaw-scopes`
  - mode HTTP pembawa identitas tepercaya (misalnya `trusted-proxy` atau `gateway.auth.mode = "none"` pada ingress privat) menghormati `x-openclaw-scopes` hanya ketika header tersebut hadir secara eksplisit
  - jika `x-openclaw-scopes` tidak ada pada permintaan rute Plugin pembawa identitas tersebut, cakupan runtime kembali ke `operator.write`
- Aturan praktis: jangan berasumsi bahwa rute Plugin dengan auth gateway adalah permukaan admin implisit. Jika rute Anda memerlukan perilaku khusus admin, wajibkan mode auth pembawa identitas dan dokumentasikan kontrak header `x-openclaw-scopes` yang eksplisit.

## Jalur impor SDK Plugin

Gunakan subjalur SDK yang sempit, bukan barrel root `openclaw/plugin-sdk` yang monolitik saat membuat Plugin baru. Subjalur inti:

| Subjalur                            | Tujuan                                             |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitif pendaftaran Plugin                        |
| `openclaw/plugin-sdk/channel-core`  | Pembantu entri/build channel                       |
| `openclaw/plugin-sdk/core`          | Pembantu bersama generik dan kontrak payung        |
| `openclaw/plugin-sdk/config-schema` | Skema Zod root `openclaw.json` (`OpenClawSchema`)  |

Plugin channel memilih dari keluarga seam sempit — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, dan `channel-actions`. Perilaku persetujuan sebaiknya dikonsolidasikan
pada satu kontrak `approvalCapability`, bukan dicampur lintas field
Plugin yang tidak terkait. Lihat [Plugin channel](/id/plugins/sdk-channel-plugins).

Pembantu runtime dan konfigurasi berada di bawah subjalur `*-runtime` terfokus yang cocok
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, dll.). Utamakan `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot`, dan `config-mutation`
daripada barrel kompatibilitas `config-runtime` yang luas.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
dan `openclaw/plugin-sdk/infra-runtime` adalah shim kompatibilitas yang tidak digunakan lagi untuk
Plugin lama. Kode baru sebaiknya mengimpor primitif generik yang lebih sempit.
</Info>

Titik entri internal repo (per root paket Plugin bawaan):

- `index.js` — entri Plugin bawaan
- `api.js` — barrel pembantu/tipe
- `runtime-api.js` — barrel khusus runtime
- `setup-entry.js` — entri Plugin setup

Plugin eksternal hanya boleh mengimpor subjalur `openclaw/plugin-sdk/*`. Jangan pernah
mengimpor `src/*` milik paket Plugin lain dari core atau dari Plugin lain.
Titik entri yang dimuat melalui facade mengutamakan snapshot konfigurasi runtime aktif ketika ada,
lalu fallback ke file konfigurasi yang telah di-resolve di disk.

Subjalur khusus capability seperti `image-generation`, `media-understanding`,
dan `speech` ada karena Plugin bawaan menggunakannya saat ini. Subjalur ini tidak
otomatis menjadi kontrak eksternal yang dibekukan jangka panjang — periksa halaman referensi SDK
yang relevan saat bergantung padanya.

## Skema tool pesan

Plugin sebaiknya memiliki kontribusi skema `describeMessageTool(...)` khusus channel
untuk primitif non-pesan seperti reaksi, baca, dan polling.
Presentasi kirim bersama sebaiknya menggunakan kontrak generik `MessagePresentation`
alih-alih field tombol, komponen, blok, atau kartu native provider.
Lihat [Presentasi Pesan](/id/plugins/message-presentation) untuk kontrak,
aturan fallback, pemetaan provider, dan daftar periksa penulis Plugin.

Plugin yang mampu mengirim mendeklarasikan apa yang dapat dirender melalui capability pesan:

- `presentation` untuk blok presentasi semantik (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` untuk permintaan pengiriman yang dipin

Core memutuskan apakah akan merender presentasi secara native atau menurunkannya menjadi teks.
Jangan mengekspos celah keluar UI native provider dari tool pesan generik.
Pembantu SDK yang tidak digunakan lagi untuk skema native lama tetap diekspor untuk Plugin
pihak ketiga yang sudah ada, tetapi Plugin baru sebaiknya tidak menggunakannya.

## Resolusi target channel

Plugin channel sebaiknya memiliki semantik target khusus channel. Pertahankan host
outbound bersama tetap generik dan gunakan permukaan adapter messaging untuk aturan provider:

- `messaging.inferTargetChatType({ to })` memutuskan apakah target yang dinormalisasi
  harus diperlakukan sebagai `direct`, `group`, atau `channel` sebelum lookup direktori.
- `messaging.targetResolver.looksLikeId(raw, normalized)` memberi tahu core apakah sebuah
  input harus langsung melewati resolusi mirip id alih-alih pencarian direktori.
- `messaging.targetResolver.resolveTarget(...)` adalah fallback Plugin ketika
  core memerlukan resolusi akhir yang dimiliki provider setelah normalisasi atau setelah
  direktori tidak menemukan hasil.
- `messaging.resolveOutboundSessionRoute(...)` memiliki konstruksi rute sesi khusus provider
  setelah target di-resolve.

Pembagian yang direkomendasikan:

- Gunakan `inferTargetChatType` untuk keputusan kategori yang harus terjadi sebelum
  mencari peer/grup.
- Gunakan `looksLikeId` untuk pemeriksaan "perlakukan ini sebagai id target eksplisit/native".
- Gunakan `resolveTarget` untuk fallback normalisasi khusus provider, bukan untuk
  pencarian direktori luas.
- Simpan id native provider seperti id chat, id thread, JID, handle, dan id room
  di dalam nilai `target` atau parameter khusus provider, bukan di field SDK generik.

## Direktori berbasis konfigurasi

Plugin yang menurunkan entri direktori dari konfigurasi sebaiknya menyimpan logika tersebut di
Plugin dan menggunakan kembali pembantu bersama dari
`openclaw/plugin-sdk/directory-runtime`.

Gunakan ini ketika sebuah channel membutuhkan peer/grup berbasis konfigurasi seperti:

- peer DM yang digerakkan allowlist
- peta channel/grup yang dikonfigurasi
- fallback direktori statis bercakupan akun

Pembantu bersama di `directory-runtime` hanya menangani operasi generik:

- pemfilteran kueri
- penerapan limit
- pembantu deduplikasi/normalisasi
- membangun `ChannelDirectoryEntry[]`

Inspeksi akun khusus channel dan normalisasi id sebaiknya tetap berada di
implementasi Plugin.

## Katalog provider

Plugin provider dapat mendefinisikan katalog model untuk inferensi dengan
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` mengembalikan bentuk yang sama seperti yang ditulis OpenClaw ke
`models.providers`:

- `{ provider }` untuk satu entri provider
- `{ providers }` untuk beberapa entri provider

Gunakan `catalog` ketika Plugin memiliki id model khusus provider, default URL dasar,
atau metadata model yang dibatasi auth.

`catalog.order` mengontrol kapan katalog Plugin digabung relatif terhadap provider implisit bawaan OpenClaw:

- `simple`: provider biasa berbasis API key atau env
- `profile`: provider yang muncul ketika profil auth ada
- `paired`: provider yang menyintesis beberapa entri provider terkait
- `late`: pass terakhir, setelah provider implisit lain

Provider yang lebih belakangan menang pada tabrakan key, sehingga Plugin dapat dengan sengaja mengganti
entri provider bawaan dengan id provider yang sama.

Plugin juga dapat menerbitkan baris model hanya-baca melalui
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Ini adalah jalur maju untuk permukaan daftar/bantuan/pemilih dan mendukung
baris `text`, `image_generation`, `video_generation`, dan `music_generation`.
Plugin provider tetap memiliki panggilan endpoint live, pertukaran token, dan pemetaan
respons vendor; core memiliki bentuk baris umum, label sumber, dan pemformatan bantuan tool media.
Pendaftaran provider generasi media menyintesis baris katalog statis secara otomatis dari
`defaultModel`, `models`, dan `capabilities`.

Kompatibilitas:

- `discovery` masih berfungsi sebagai alias lama, tetapi memunculkan peringatan deprecation
- jika `catalog` dan `discovery` sama-sama didaftarkan, OpenClaw menggunakan `catalog`
- `augmentModelCatalog` tidak digunakan lagi; provider bawaan sebaiknya menerbitkan
  baris tambahan melalui `registerModelCatalogProvider`

## Inspeksi channel hanya-baca

Jika Plugin Anda mendaftarkan channel, utamakan mengimplementasikan
`plugin.config.inspectAccount(cfg, accountId)` bersama `resolveAccount(...)`.

Mengapa:

- `resolveAccount(...)` adalah jalur runtime. Jalur ini boleh berasumsi bahwa kredensial
  telah sepenuhnya dimaterialisasi dan dapat gagal cepat ketika rahasia yang diperlukan tidak ada.
- Jalur perintah hanya-baca seperti `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, dan alur perbaikan doctor/konfigurasi
  sebaiknya tidak perlu mematerialisasi kredensial runtime hanya untuk
  mendeskripsikan konfigurasi.

Perilaku `inspectAccount(...)` yang direkomendasikan:

- Kembalikan hanya status akun deskriptif.
- Pertahankan `enabled` dan `configured`.
- Sertakan field sumber/status kredensial bila relevan, seperti:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Anda tidak perlu mengembalikan nilai token mentah hanya untuk melaporkan ketersediaan
  hanya-baca. Mengembalikan `tokenStatus: "available"` (dan field sumber yang cocok)
  sudah cukup untuk perintah bergaya status.
- Gunakan `configured_unavailable` ketika kredensial dikonfigurasi melalui SecretRef tetapi
  tidak tersedia pada jalur perintah saat ini.

Ini memungkinkan perintah hanya-baca melaporkan "dikonfigurasi tetapi tidak tersedia di jalur perintah ini"
alih-alih crash atau salah melaporkan akun sebagai tidak dikonfigurasi.

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

Setiap entri menjadi Plugin. Jika pack mencantumkan beberapa extension, id Plugin
menjadi `name/<fileBase>`.

Jika Plugin Anda mengimpor dependensi npm, instal dependensi tersebut di direktori itu agar
`node_modules` tersedia (`npm install` / `pnpm install`).

Guardrail keamanan: setiap entri `openclaw.extensions` harus tetap berada di dalam direktori Plugin
setelah resolusi symlink. Entri yang keluar dari direktori paket ditolak.

Catatan keamanan: `openclaw plugins install` menginstal dependensi Plugin dengan
`npm install --omit=dev --ignore-scripts` lokal proyek (tanpa skrip lifecycle,
tanpa dependensi dev saat runtime), mengabaikan pengaturan instal npm global yang diwarisi.
Pertahankan pohon dependensi Plugin "JS/TS murni" dan hindari paket yang memerlukan
build `postinstall`.

Opsional: `openclaw.setupEntry` dapat menunjuk ke modul ringan khusus setup.
Ketika OpenClaw membutuhkan permukaan setup untuk Plugin channel yang dinonaktifkan, atau
ketika Plugin channel diaktifkan tetapi masih belum dikonfigurasi, OpenClaw memuat `setupEntry`
alih-alih entri Plugin penuh. Ini membuat startup dan setup lebih ringan
ketika entri Plugin utama Anda juga merangkai tool, hook, atau kode lain yang hanya untuk runtime.

Opsional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
dapat membuat Plugin channel ikut memakai jalur `setupEntry` yang sama selama fase startup
pra-listen gateway, bahkan ketika channel sudah dikonfigurasi.

Gunakan ini hanya ketika `setupEntry` sepenuhnya mencakup permukaan startup yang harus ada
sebelum gateway mulai mendengarkan. Dalam praktiknya, ini berarti entri setup
harus mendaftarkan setiap kapabilitas milik channel yang bergantung pada startup, seperti:

- pendaftaran channel itu sendiri
- route HTTP apa pun yang harus tersedia sebelum gateway mulai mendengarkan
- metode, tool, atau layanan gateway apa pun yang harus ada selama jendela yang sama

Jika entri penuh Anda masih memiliki kapabilitas startup wajib apa pun, jangan aktifkan
flag ini. Pertahankan Plugin pada perilaku default dan biarkan OpenClaw memuat
entri penuh selama startup.

Channel bawaan juga dapat menerbitkan helper permukaan kontrak khusus setup yang dapat
dikonsultasikan core sebelum runtime channel penuh dimuat. Permukaan promosi setup
saat ini adalah:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core menggunakan permukaan itu ketika perlu mempromosikan konfigurasi channel
akun tunggal legacy menjadi `channels.<id>.accounts.*` tanpa memuat entri Plugin penuh.
Matrix adalah contoh bawaan saat ini: ia hanya memindahkan kunci auth/bootstrap ke
akun bernama yang dipromosikan ketika akun bernama sudah ada, dan dapat mempertahankan
kunci akun default non-kanonik yang dikonfigurasi alih-alih selalu membuat
`accounts.default`.

Adapter patch setup tersebut menjaga penemuan permukaan kontrak bawaan tetap lazy. Waktu
impor tetap ringan; permukaan promosi dimuat hanya pada penggunaan pertama alih-alih
memasuki ulang startup channel bawaan saat impor modul.

Ketika permukaan startup tersebut menyertakan metode RPC gateway, pertahankan pada
prefiks khusus Plugin. Namespace admin core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu resolve
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
petunjuk instalasi melalui `openclaw.install`. Ini menjaga katalog core tetap bebas data.

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
- `docsLabel`: timpa teks tautan untuk tautan docs
- `preferOver`: id Plugin/channel berprioritas lebih rendah yang harus dikalahkan oleh entri katalog ini
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrol salinan permukaan seleksi
- `markdownCapable`: menandai channel sebagai mampu markdown untuk keputusan pemformatan outbound
- `exposure.configured`: sembunyikan channel dari permukaan daftar channel yang dikonfigurasi ketika diatur ke `false`
- `exposure.setup`: sembunyikan channel dari pemilih setup/konfigurasi interaktif ketika diatur ke `false`
- `exposure.docs`: tandai channel sebagai internal/privat untuk permukaan navigasi docs
- `showConfigured` / `showInSetup`: alias legacy yang masih diterima untuk kompatibilitas; utamakan `exposure`
- `quickstartAllowFrom`: ikutkan channel ke flow quickstart standar `allowFrom`
- `forceAccountBinding`: wajibkan binding akun eksplisit bahkan ketika hanya ada satu akun
- `preferSessionLookupForAnnounceTarget`: utamakan lookup sesi saat me-resolve target pengumuman

OpenClaw juga dapat menggabungkan **katalog channel eksternal** (misalnya, ekspor registry MPM). Letakkan file JSON di salah satu dari:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Atau arahkan `OPENCLAW_PLUGIN_CATALOG_PATHS` (atau `OPENCLAW_MPM_CATALOG_PATHS`) ke
satu atau beberapa file JSON (dipisahkan koma/titik koma/`PATH`). Setiap file harus
berisi `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser juga menerima `"packages"` atau `"plugins"` sebagai alias legacy untuk kunci `"entries"`.

Entri katalog channel yang dihasilkan dan entri katalog instalasi provider mengekspos
fakta sumber instalasi ternormalisasi di sebelah blok mentah `openclaw.install`. Fakta
ternormalisasi mengidentifikasi apakah spec npm adalah versi persis atau selector
mengambang, apakah metadata integritas yang diharapkan tersedia, dan apakah path sumber
lokal juga tersedia. Ketika identitas katalog/paket diketahui, fakta ternormalisasi
memperingatkan jika nama paket npm yang di-parse bergeser dari identitas tersebut.
Fakta itu juga memperingatkan ketika `defaultChoice` tidak valid atau menunjuk ke sumber
yang tidak tersedia, dan ketika metadata integritas npm tersedia tanpa sumber npm yang valid.
Konsumen harus memperlakukan `installSource` sebagai field opsional aditif sehingga
entri buatan tangan dan shim katalog tidak perlu mensintesisnya.
Ini memungkinkan onboarding dan diagnostik menjelaskan status source-plane tanpa
mengimpor runtime Plugin.

Entri npm eksternal resmi sebaiknya mengutamakan `npmSpec` persis plus
`expectedIntegrity`. Nama paket polos dan dist-tag tetap berfungsi untuk
kompatibilitas, tetapi memunculkan peringatan source-plane sehingga katalog dapat bergerak
menuju instalasi yang dipin dan diperiksa integritasnya tanpa merusak Plugin yang ada.
Ketika onboarding menginstal dari path katalog lokal, ia mencatat entri indeks Plugin
terkelola dengan `source: "path"` dan `sourcePath` relatif workspace bila memungkinkan.
Path pemuatan operasional absolut tetap berada di `plugins.load.paths`; catatan instalasi
menghindari duplikasi path workstation lokal ke konfigurasi jangka panjang. Ini menjaga
instalasi pengembangan lokal tetap terlihat oleh diagnostik source-plane tanpa menambahkan
permukaan pengungkapan path filesystem mentah kedua. Indeks Plugin `plugins/installs.json`
yang dipersist adalah sumber kebenaran instalasi dan dapat disegarkan tanpa memuat modul
runtime Plugin. Map `installRecords`-nya tahan lama bahkan ketika manifest Plugin hilang
atau tidak valid; array `plugins`-nya adalah tampilan manifest yang dapat dibangun ulang.

## Plugin mesin konteks

Plugin mesin konteks memiliki orkestrasi konteks sesi untuk ingest, perakitan,
dan Compaction. Daftarkan dari Plugin Anda dengan
`api.registerContextEngine(id, factory)`, lalu pilih mesin aktif dengan
`plugins.slots.contextEngine`.

Gunakan ini ketika Plugin Anda perlu mengganti atau memperluas pipeline konteks default
alih-alih hanya menambahkan pencarian memori atau hook.

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
untuk inisialisasi waktu konstruksi.

Jika mesin Anda **tidak** memiliki algoritme Compaction, pertahankan `compact()`
terimplementasi dan delegasikan secara eksplisit:

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

## Menambahkan kapabilitas baru

Ketika Plugin membutuhkan perilaku yang tidak cocok dengan API saat ini, jangan memintas
sistem Plugin dengan akses privat ke dalam. Tambahkan kapabilitas yang hilang.

Urutan yang direkomendasikan:

1. definisikan kontrak core
   Putuskan perilaku bersama apa yang harus dimiliki core: kebijakan, fallback, penggabungan konfigurasi,
   lifecycle, semantik yang menghadap channel, dan bentuk helper runtime.
2. tambahkan permukaan registrasi/runtime Plugin bertipe
   Perluas `OpenClawPluginApi` dan/atau `api.runtime` dengan permukaan kapabilitas
   bertipe paling kecil yang berguna.
3. hubungkan konsumen core + channel/fitur
   Plugin channel dan fitur harus mengonsumsi kapabilitas baru melalui core,
   bukan dengan mengimpor implementasi vendor secara langsung.
4. daftarkan implementasi vendor
   Plugin vendor kemudian mendaftarkan backend mereka terhadap kapabilitas tersebut.
5. tambahkan cakupan kontrak
   Tambahkan test agar kepemilikan dan bentuk registrasi tetap eksplisit seiring waktu.

Beginilah OpenClaw tetap beropini tanpa menjadi hardcoded ke pandangan dunia satu
provider. Lihat [Cookbook Kapabilitas](/id/plugins/adding-capabilities)
untuk checklist file konkret dan contoh lengkap.

### Checklist kapabilitas

Ketika Anda menambahkan kapabilitas baru, implementasi biasanya harus menyentuh
permukaan ini bersama-sama:

- tipe kontrak core di `src/<capability>/types.ts`
- helper runner/runtime core di `src/<capability>/runtime.ts`
- permukaan registrasi API Plugin di `src/plugins/types.ts`
- wiring registry Plugin di `src/plugins/registry.ts`
- eksposur runtime Plugin di `src/plugins/runtime/*` ketika Plugin fitur/channel
  perlu mengonsumsinya
- helper capture/test di `src/test-utils/plugin-registration.ts`
- asersi kepemilikan/kontrak di `src/plugins/contracts/registry.ts`
- docs operator/Plugin di `docs/`

Jika salah satu permukaan tersebut hilang, itu biasanya tanda bahwa kapabilitas
belum terintegrasi sepenuhnya.

### Templat kapabilitas

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

Pola test kontrak:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Itu menjaga aturannya tetap sederhana:

- core memiliki kontrak kapabilitas + orkestrasi
- Plugin vendor memiliki implementasi vendor
- Plugin fitur/channel mengonsumsi helper runtime
- test kontrak menjaga kepemilikan tetap eksplisit

## Terkait

- [Arsitektur Plugin](/id/plugins/architecture) — model dan bentuk kapabilitas publik
- [Subpath SDK Plugin](/id/plugins/sdk-subpaths)
- [Setup SDK Plugin](/id/plugins/sdk-setup)
- [Membangun Plugin](/id/plugins/building-plugins)

---
read_when:
    - Mengimplementasikan hook runtime penyedia, siklus hidup saluran, atau paket package
    - Men-debug urutan pemuatan Plugin atau status registri
    - Menambahkan kemampuan Plugin baru atau Plugin mesin konteks
summary: 'Internal arsitektur Plugin: alur pemuatan, registri, hook waktu eksekusi, rute HTTP, dan tabel referensi'
title: Internal arsitektur Plugin
x-i18n:
    generated_at: "2026-05-10T19:41:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: d41a28b83759906df693a00f3a20237bb7b91905eb948ff7bb354608e7997119
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Untuk model kapabilitas publik, bentuk plugin, dan kontrak kepemilikan/eksekusi, lihat [Arsitektur Plugin](/id/plugins/architecture). Halaman ini adalah referensi untuk mekanisme internal: alur pemuatan, registri, hook runtime, rute HTTP Gateway, jalur impor, dan tabel skema.

## Alur pemuatan

Saat awal dijalankan, OpenClaw kira-kira melakukan ini:

1. menemukan akar kandidat plugin
2. membaca manifes bundel native atau kompatibel dan metadata paket
3. menolak kandidat yang tidak aman
4. menormalkan konfigurasi plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. menentukan pengaktifan untuk setiap kandidat
6. memuat modul native yang diaktifkan: modul bawaan terbundel menggunakan pemuat native;
   sumber lokal TypeScript pihak ketiga menggunakan fallback darurat Jiti
7. memanggil hook native `register(api)` dan mengumpulkan pendaftaran ke dalam registri plugin
8. mengekspos registri ke perintah/permukaan runtime

<Note>
`activate` adalah alias lama untuk `register` — pemuat menyelesaikan mana pun yang tersedia (`def.register ?? def.activate`) dan memanggilnya pada titik yang sama. Semua plugin terbundel menggunakan `register`; pilih `register` untuk plugin baru.
</Note>

Gerbang keamanan terjadi **sebelum** eksekusi runtime. Kandidat diblokir
ketika entri keluar dari akar plugin, jalurnya dapat ditulis oleh semua pengguna, atau kepemilikan
jalur terlihat mencurigakan untuk plugin yang tidak terbundel.

Kandidat yang diblokir tetap terikat ke id pluginnya untuk diagnostik. Jika konfigurasi
masih mereferensikan id itu, validasi melaporkan plugin sebagai ada tetapi diblokir
dan merujuk kembali ke peringatan keamanan jalur alih-alih memperlakukan entri konfigurasi
sebagai usang.

### Perilaku manifes terlebih dahulu

Manifes adalah sumber kebenaran bidang kontrol. OpenClaw menggunakannya untuk:

- mengidentifikasi plugin
- menemukan channel/skill/skema konfigurasi yang dideklarasikan atau kapabilitas bundel
- memvalidasi `plugins.entries.<id>.config`
- menambahkan label/placeholder Control UI
- menampilkan metadata instalasi/katalog
- mempertahankan deskriptor aktivasi dan penyiapan yang murah tanpa memuat runtime plugin

Untuk plugin native, modul runtime adalah bagian bidang data. Modul ini mendaftarkan
perilaku aktual seperti hook, alat, perintah, atau alur penyedia.

Blok manifes opsional `activation` dan `setup` tetap berada di bidang kontrol.
Blok tersebut adalah deskriptor metadata saja untuk perencanaan aktivasi dan penemuan penyiapan;
blok tersebut tidak menggantikan pendaftaran runtime, `register(...)`, atau `setupEntry`.
Konsumen aktivasi live pertama kini menggunakan petunjuk perintah, channel, dan penyedia dari manifes
untuk mempersempit pemuatan plugin sebelum materialisasi registri yang lebih luas:

- pemuatan CLI dipersempit ke plugin yang memiliki perintah primer yang diminta
- resolusi penyiapan/plugin channel dipersempit ke plugin yang memiliki
  id channel yang diminta
- resolusi penyiapan/runtime penyedia eksplisit dipersempit ke plugin yang memiliki
  id penyedia yang diminta
- perencanaan startup Gateway menggunakan `activation.onStartup` untuk impor startup
  eksplisit dan opt-out startup; plugin tanpa metadata startup dimuat hanya
  melalui pemicu aktivasi yang lebih sempit

Pramuat runtime saat permintaan yang meminta cakupan luas `all` tetap menurunkan
set id plugin efektif yang eksplisit dari konfigurasi, perencanaan startup, channel
terkonfigurasi, slot, dan aturan auto-enable. Jika set turunan itu kosong, OpenClaw
memuat registri runtime kosong alih-alih memperluas ke setiap plugin yang dapat ditemukan.

Perencana aktivasi mengekspos API hanya-id untuk pemanggil yang ada dan API rencana
untuk diagnostik baru. Entri rencana melaporkan alasan sebuah plugin dipilih,
memisahkan petunjuk perencana `activation.*` eksplisit dari fallback kepemilikan manifes
seperti `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, dan hook. Pemisahan alasan itu adalah batas kompatibilitas:
metadata plugin yang ada tetap berfungsi, sementara kode baru dapat mendeteksi petunjuk luas
atau perilaku fallback tanpa mengubah semantik pemuatan runtime.

Penemuan penyiapan kini mengutamakan id milik deskriptor seperti `setup.providers` dan
`setup.cliBackends` untuk mempersempit kandidat plugin sebelum kembali ke
`setup-api` untuk plugin yang masih memerlukan hook runtime saat penyiapan. Daftar
penyiapan penyedia menggunakan `providerAuthChoices` manifes, pilihan penyiapan
turunan deskriptor, dan metadata katalog instalasi tanpa memuat runtime penyedia. `setup.requiresRuntime: false`
eksplisit adalah batas khusus deskriptor; `requiresRuntime` yang dihilangkan
mempertahankan fallback setup-api lama untuk kompatibilitas. Jika lebih dari satu
plugin yang ditemukan mengklaim penyedia penyiapan atau id backend CLI ternormalisasi yang sama,
lookup penyiapan menolak pemilik ambigu tersebut alih-alih mengandalkan
urutan penemuan. Ketika runtime penyiapan benar-benar dieksekusi, diagnostik registri melaporkan
drift antara `setup.providers` / `setup.cliBackends` dan penyedia atau backend CLI
yang didaftarkan oleh setup-api tanpa memblokir plugin lama.

### Batas cache plugin

OpenClaw tidak menyimpan hasil penemuan plugin atau data registri manifes langsung
di balik jendela waktu jam dinding. Instalasi, edit manifes, dan perubahan jalur pemuatan
harus terlihat pada pembacaan metadata eksplisit berikutnya atau pembangunan ulang snapshot.
Parser file manifes dapat mempertahankan cache tanda tangan file terbatas yang dikunci oleh
jalur manifes yang dibuka, inode, ukuran, dan timestamp; cache itu hanya menghindari
parsing ulang byte yang tidak berubah dan tidak boleh menyimpan jawaban penemuan, registri, pemilik, atau
kebijakan.

Jalur cepat metadata yang aman adalah kepemilikan objek eksplisit, bukan cache tersembunyi.
Jalur panas startup Gateway harus meneruskan `PluginMetadataSnapshot` saat ini,
`PluginLookUpTable` turunan, atau registri manifes eksplisit melalui rantai panggilan.
Validasi konfigurasi, auto-enable startup, bootstrap plugin, dan pemilihan penyedia
dapat menggunakan kembali objek tersebut selama objek tersebut merepresentasikan konfigurasi dan
inventaris plugin saat ini. Lookup penyiapan tetap merekonstruksi metadata manifes sesuai kebutuhan
kecuali jalur penyiapan spesifik menerima registri manifes eksplisit; pertahankan itu
sebagai fallback jalur dingin alih-alih menambahkan cache lookup tersembunyi. Ketika input
berubah, bangun ulang dan ganti snapshot alih-alih memutasinya atau mempertahankan
salinan historis.
Tampilan atas registri plugin aktif dan helper bootstrap channel terbundel
harus dihitung ulang dari registri/akar saat ini. Map berumur pendek boleh digunakan
di dalam satu panggilan untuk menghapus duplikasi pekerjaan atau menjaga reentry; map tersebut tidak boleh menjadi cache
metadata proses.

Untuk pemuatan plugin, lapisan cache persisten adalah pemuatan runtime. Lapisan ini dapat menggunakan ulang
status pemuat ketika kode atau artefak terinstal benar-benar dimuat, seperti:

- `PluginLoaderCacheState` dan registri runtime aktif yang kompatibel
- cache jiti/modul dan cache pemuat permukaan publik yang digunakan untuk menghindari pengimporan
  permukaan runtime yang sama berulang kali
- cache filesystem untuk artefak plugin terinstal
- map per panggilan berumur pendek untuk normalisasi jalur atau resolusi duplikat

Cache tersebut adalah detail implementasi bidang data. Cache tersebut tidak boleh menjawab
pertanyaan bidang kontrol seperti "plugin mana yang memiliki penyedia ini?" kecuali
pemanggil sengaja meminta pemuatan runtime.

Jangan tambahkan cache persisten atau berbasis jam dinding untuk:

- hasil penemuan
- registri manifes langsung
- registri manifes yang direkonstruksi dari indeks plugin terinstal
- lookup pemilik penyedia, penekanan model, kebijakan penyedia, atau metadata artefak publik
- jawaban turunan manifes lainnya ketika manifes, indeks terinstal,
  atau jalur pemuatan yang berubah harus terlihat pada pembacaan metadata berikutnya

Pemanggil yang membangun ulang metadata manifes dari indeks plugin terinstal yang dipersistenkan
merekonstruksi registri tersebut sesuai kebutuhan. Indeks terinstal adalah status bidang sumber yang tahan lama;
itu bukan cache metadata dalam proses yang tersembunyi.

## Model registri

Plugin yang dimuat tidak langsung memutasi global inti acak. Plugin tersebut mendaftar ke
registri plugin pusat.

Registri melacak:

- catatan plugin (identitas, sumber, asal, status, diagnostik)
- alat
- hook lama dan hook bertipe
- channel
- penyedia
- handler RPC Gateway
- rute HTTP
- registrar CLI
- layanan latar belakang
- perintah milik plugin

Fitur inti kemudian membaca dari registri tersebut alih-alih berbicara langsung dengan modul plugin.
Ini menjaga pemuatan satu arah:

- modul plugin -> pendaftaran registri
- runtime inti -> konsumsi registri

Pemisahan itu penting untuk kemudahan pemeliharaan. Artinya sebagian besar permukaan inti hanya
memerlukan satu titik integrasi: "baca registri", bukan "perlakukan setiap modul plugin
secara khusus".

## Callback pengikatan percakapan

Plugin yang mengikat percakapan dapat bereaksi ketika persetujuan diselesaikan.

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

Kolom payload callback:

- `status`: `"approved"` atau `"denied"`
- `decision`: `"allow-once"`, `"allow-always"`, atau `"deny"`
- `binding`: binding yang diselesaikan untuk permintaan yang disetujui
- `request`: ringkasan permintaan asli, petunjuk detach, id pengirim, dan
  metadata percakapan

Callback ini hanya notifikasi. Callback ini tidak mengubah siapa yang diizinkan mengikat
percakapan, dan berjalan setelah penanganan persetujuan inti selesai.

## Hook runtime penyedia

Plugin penyedia memiliki tiga lapisan:

- **Metadata manifes** untuk lookup pra-runtime yang murah:
  `setup.providers[].envVars`, kompatibilitas usang `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices`, dan `channelEnvVars`.
- **Hook waktu konfigurasi**: `catalog` (`discovery` lama) ditambah
  `applyConfigDefaults`.
- **Hook runtime**: 40+ hook opsional yang mencakup auth, resolusi model,
  pembungkusan stream, level thinking, kebijakan replay, dan endpoint penggunaan. Lihat
  daftar lengkap di [Urutan dan penggunaan hook](#hook-order-and-usage).

OpenClaw tetap memiliki loop agen generik, failover, penanganan transkrip, dan
kebijakan alat. Hook ini adalah permukaan ekstensi untuk perilaku spesifik penyedia
tanpa memerlukan transport inferensi kustom penuh.

Gunakan `setup.providers[].envVars` manifes ketika penyedia memiliki kredensial berbasis env
yang harus terlihat oleh jalur auth/status/pemilih-model generik tanpa
memuat runtime plugin. `providerAuthEnvVars` yang sudah usang masih dibaca oleh
adapter kompatibilitas selama periode deprecation, dan plugin yang tidak terbundel
yang menggunakannya menerima diagnostik manifes. Gunakan `providerAuthAliases` manifes
ketika satu id penyedia harus menggunakan ulang env var, profil auth, auth berbasis konfigurasi,
dan pilihan onboarding kunci API milik id penyedia lain. Gunakan `providerAuthChoices` manifes
ketika permukaan CLI onboarding/pilihan-auth harus mengetahui id pilihan penyedia,
label grup, dan wiring auth sederhana satu-flag tanpa
memuat runtime penyedia. Pertahankan `envVars` runtime penyedia
untuk petunjuk yang menghadap operator seperti label onboarding atau variabel penyiapan OAuth
client-id/client-secret.

Gunakan `channelEnvVars` manifes ketika sebuah channel memiliki auth atau penyiapan berbasis env yang
harus terlihat oleh fallback shell-env generik, pemeriksaan konfigurasi/status, atau prompt penyiapan
tanpa memuat runtime channel.

### Urutan dan penggunaan hook

Untuk plugin model/penyedia, OpenClaw memanggil hook dalam urutan kasar ini.
Kolom "Kapan digunakan" adalah panduan keputusan cepat.
Kolom penyedia khusus kompatibilitas yang tidak lagi dipanggil OpenClaw, seperti
`ProviderPlugin.capabilities` dan `suppressBuiltInModel`, sengaja tidak
dicantumkan di sini.

| #   | Hook                              | Fungsinya                                                                                                      | Kapan digunakan                                                                                                                               |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publikasikan konfigurasi penyedia ke `models.providers` selama pembuatan `models.json`                         | Penyedia memiliki katalog atau default URL dasar                                                                                              |
| 2   | `applyConfigDefaults`             | Terapkan default konfigurasi global milik penyedia selama materialisasi konfigurasi                            | Default bergantung pada mode autentikasi, env, atau semantik keluarga model penyedia                                                          |
| --  | _(pencarian model bawaan)_         | OpenClaw mencoba jalur registry/katalog normal terlebih dahulu                                                 | _(bukan hook plugin)_                                                                                                                         |
| 3   | `normalizeModelId`                | Normalisasikan alias model-id lama atau pratinjau sebelum pencarian                                            | Penyedia memiliki pembersihan alias sebelum resolusi model kanonis                                                                            |
| 4   | `normalizeTransport`              | Normalisasikan `api` / `baseUrl` keluarga penyedia sebelum perakitan model generik                             | Penyedia memiliki pembersihan transport untuk id penyedia khusus dalam keluarga transport yang sama                                            |
| 5   | `normalizeConfig`                 | Normalisasikan `models.providers.<id>` sebelum resolusi runtime/penyedia                                       | Penyedia memerlukan pembersihan konfigurasi yang seharusnya berada di plugin; helper keluarga Google bawaan juga mencadangkan entri konfigurasi Google yang didukung |
| 6   | `applyNativeStreamingUsageCompat` | Terapkan penulisan ulang kompat penggunaan streaming native ke penyedia konfigurasi                            | Penyedia memerlukan perbaikan metadata penggunaan streaming native yang digerakkan endpoint                                                    |
| 7   | `resolveConfigApiKey`             | Resolusikan autentikasi env-marker untuk penyedia konfigurasi sebelum pemuatan autentikasi runtime             | Penyedia memiliki resolusi kunci API env-marker milik penyedia; `amazon-bedrock` juga memiliki resolver env-marker AWS bawaan di sini          |
| 8   | `resolveSyntheticAuth`            | Tampilkan autentikasi lokal/self-hosted atau berbasis konfigurasi tanpa menyimpan plaintext                    | Penyedia dapat beroperasi dengan penanda kredensial sintetis/lokal                                                                            |
| 9   | `resolveExternalAuthProfiles`     | Tumpangkan profil autentikasi eksternal milik penyedia; default `persistence` adalah `runtime-only` untuk kredensial milik CLI/aplikasi | Penyedia menggunakan ulang kredensial autentikasi eksternal tanpa menyimpan token refresh yang disalin; deklarasikan `contracts.externalAuthProviders` di manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Turunkan placeholder profil sintetis tersimpan di belakang autentikasi berbasis env/konfigurasi                | Penyedia menyimpan profil placeholder sintetis yang tidak boleh menang prioritas                                                              |
| 11  | `resolveDynamicModel`             | Fallback sinkron untuk id model milik penyedia yang belum ada di registry lokal                                | Penyedia menerima id model upstream arbitrer                                                                                                  |
| 12  | `prepareDynamicModel`             | Pemanasan asinkron, lalu `resolveDynamicModel` berjalan lagi                                                   | Penyedia memerlukan metadata jaringan sebelum meresolusi id yang tidak dikenal                                                                |
| 13  | `normalizeResolvedModel`          | Penulisan ulang final sebelum runner tertanam menggunakan model yang telah diresolusi                          | Penyedia memerlukan penulisan ulang transport tetapi tetap menggunakan transport inti                                                         |
| 14  | `contributeResolvedModelCompat`   | Kontribusikan flag kompat untuk model vendor di belakang transport kompatibel lain                              | Penyedia mengenali modelnya sendiri pada transport proxy tanpa mengambil alih penyedia                                                        |
| 15  | `normalizeToolSchemas`            | Normalisasikan skema alat sebelum runner tertanam melihatnya                                                   | Penyedia memerlukan pembersihan skema keluarga transport                                                                                      |
| 16  | `inspectToolSchemas`              | Tampilkan diagnostik skema milik penyedia setelah normalisasi                                                  | Penyedia menginginkan peringatan kata kunci tanpa mengajarkan aturan spesifik penyedia ke inti                                                |
| 17  | `resolveReasoningOutputMode`      | Pilih kontrak output reasoning native vs bertag                                                                | Penyedia memerlukan reasoning/output final bertag alih-alih field native                                                                      |
| 18  | `prepareExtraParams`              | Normalisasi parameter permintaan sebelum wrapper opsi stream generik                                           | Penyedia memerlukan parameter permintaan default atau pembersihan parameter per penyedia                                                      |
| 19  | `createStreamFn`                  | Ganti sepenuhnya jalur stream normal dengan transport khusus                                                   | Penyedia memerlukan protokol wire khusus, bukan sekadar wrapper                                                                               |
| 20  | `wrapStreamFn`                    | Wrapper stream setelah wrapper generik diterapkan                                                              | Penyedia memerlukan wrapper kompat header/body/model permintaan tanpa transport khusus                                                        |
| 21  | `resolveTransportTurnState`       | Lampirkan header atau metadata transport native per giliran                                                    | Penyedia ingin transport generik mengirim identitas giliran native penyedia                                                                   |
| 22  | `resolveWebSocketSessionPolicy`   | Lampirkan header WebSocket native atau kebijakan jeda sesi                                                     | Penyedia ingin transport WS generik menyesuaikan header sesi atau kebijakan fallback                                                          |
| 23  | `formatApiKey`                    | Pemformat profil autentikasi: profil tersimpan menjadi string `apiKey` runtime                                 | Penyedia menyimpan metadata autentikasi tambahan dan memerlukan bentuk token runtime khusus                                                   |
| 24  | `refreshOAuth`                    | Override refresh OAuth untuk endpoint refresh khusus atau kebijakan kegagalan refresh                          | Penyedia tidak cocok dengan refresher bersama `pi-ai`                                                                                         |
| 25  | `buildAuthDoctorHint`             | Petunjuk perbaikan yang ditambahkan ketika refresh OAuth gagal                                                 | Penyedia memerlukan panduan perbaikan autentikasi milik penyedia setelah kegagalan refresh                                                    |
| 26  | `matchesContextOverflowError`     | Pencocok overflow jendela konteks milik penyedia                                                               | Penyedia memiliki error overflow mentah yang akan terlewat oleh heuristik generik                                                             |
| 27  | `classifyFailoverReason`          | Klasifikasi alasan failover milik penyedia                                                                     | Penyedia dapat memetakan error API/transport mentah ke rate-limit/overload/dll.                                                               |
| 28  | `isCacheTtlEligible`              | Kebijakan cache prompt untuk penyedia proxy/backhaul                                                           | Penyedia memerlukan gating TTL cache khusus proxy                                                                                             |
| 29  | `buildMissingAuthMessage`         | Pengganti pesan pemulihan autentikasi hilang generik                                                           | Penyedia memerlukan petunjuk pemulihan autentikasi hilang yang spesifik penyedia                                                              |
| 30  | `augmentModelCatalog`             | Baris katalog sintetis/final yang ditambahkan setelah discovery                                                | Penyedia memerlukan baris forward-compat sintetis di `models list` dan pemilih                                                                |
| 31  | `resolveThinkingProfile`          | Set level `/think` spesifik model, label tampilan, dan default                                                 | Penyedia mengekspos tangga thinking khusus atau label biner untuk model terpilih                                                              |
| 32  | `isBinaryThinking`                | Hook kompatibilitas toggle reasoning aktif/nonaktif                                                            | Penyedia hanya mengekspos thinking biner aktif/nonaktif                                                                                       |
| 33  | `supportsXHighThinking`           | Hook kompatibilitas dukungan reasoning `xhigh`                                                                 | Penyedia menginginkan `xhigh` hanya pada subset model                                                                                         |
| 34  | `resolveDefaultThinkingLevel`     | Hook kompatibilitas level `/think` default                                                                     | Penyedia memiliki kebijakan `/think` default untuk keluarga model                                                                             |
| 35  | `isModernModelRef`                | Pencocok model modern untuk filter profil live dan pemilihan smoke                                             | Penyedia memiliki pencocokan model pilihan live/smoke                                                                                         |
| 36  | `prepareRuntimeAuth`              | Tukarkan kredensial yang dikonfigurasi menjadi token/kunci runtime aktual tepat sebelum inferensi              | Penyedia memerlukan pertukaran token atau kredensial permintaan berumur pendek                                                                |
| 37  | `resolveUsageAuth`                | Menyelesaikan kredensial penggunaan/penagihan untuk `/usage` dan permukaan status terkait                                     | Penyedia memerlukan penguraian token penggunaan/kuota khusus atau kredensial penggunaan yang berbeda                                                               |
| 38  | `fetchUsageSnapshot`              | Mengambil dan menormalkan snapshot penggunaan/kuota khusus penyedia setelah autentikasi diselesaikan                             | Penyedia memerlukan endpoint penggunaan khusus penyedia atau pengurai payload                                                                           |
| 39  | `createEmbeddingProvider`         | Membangun adaptor embedding milik penyedia untuk memori/pencarian                                                     | Perilaku embedding memori berada pada Plugin penyedia                                                                                    |
| 40  | `buildReplayPolicy`               | Mengembalikan kebijakan replay yang mengontrol penanganan transkrip untuk penyedia                                        | Penyedia memerlukan kebijakan transkrip khusus (misalnya, penghapusan blok berpikir)                                                               |
| 41  | `sanitizeReplayHistory`           | Menulis ulang riwayat replay setelah pembersihan transkrip generik                                                        | Penyedia memerlukan penulisan ulang replay khusus penyedia di luar helper Compaction bersama                                                             |
| 42  | `validateReplayTurns`             | Validasi atau pembentukan ulang giliran replay terakhir sebelum runner tertanam                                           | Transport penyedia memerlukan validasi giliran yang lebih ketat setelah sanitasi generik                                                                    |
| 43  | `onModelSelected`                 | Menjalankan efek samping pasca-pemilihan milik penyedia                                                                 | Penyedia memerlukan telemetri atau status milik penyedia saat model menjadi aktif                                                                  |

`normalizeModelId`, `normalizeTransport`, dan `normalizeConfig` pertama-tama memeriksa
plugin penyedia yang cocok, lalu berlanjut ke plugin penyedia lain yang mendukung hook
sampai salah satunya benar-benar mengubah ID model atau transport/config. Itu menjaga
shim penyedia alias/compat tetap berfungsi tanpa mengharuskan pemanggil mengetahui plugin
bawaan mana yang memiliki penulisan ulang tersebut. Jika tidak ada hook penyedia yang menulis ulang
entri konfigurasi keluarga Google yang didukung, penormalisasi konfigurasi Google bawaan tetap menerapkan
pembersihan kompatibilitas tersebut.

Jika penyedia membutuhkan protokol wire yang sepenuhnya kustom atau eksekutor permintaan kustom,
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

Plugin penyedia bawaan menggabungkan hook di atas agar sesuai dengan kebutuhan katalog,
auth, thinking, replay, dan penggunaan setiap vendor. Set hook otoritatif berada bersama
setiap plugin di bawah `extensions/`; halaman ini mengilustrasikan bentuknya, bukan
mencerminkan daftar tersebut.

<AccordionGroup>
  <Accordion title="Penyedia katalog pass-through">
    OpenRouter, Kilocode, Z.AI, xAI mendaftarkan `catalog` plus
    `resolveDynamicModel` / `prepareDynamicModel` agar dapat menampilkan ID model upstream
    sebelum katalog statis OpenClaw.
  </Accordion>
  <Accordion title="Penyedia endpoint OAuth dan penggunaan">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai memasangkan
    `prepareRuntimeAuth` atau `formatApiKey` dengan `resolveUsageAuth` +
    `fetchUsageSnapshot` untuk memiliki pertukaran token dan integrasi `/usage`.
  </Accordion>
  <Accordion title="Keluarga replay dan pembersihan transkrip">
    Keluarga bernama bersama (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) memungkinkan penyedia ikut menggunakan
    kebijakan transkrip melalui `buildReplayPolicy`, alih-alih setiap plugin
    mengimplementasikan ulang pembersihan.
  </Accordion>
  <Accordion title="Penyedia khusus katalog">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway`, dan
    `volcengine` hanya mendaftarkan `catalog` dan menggunakan loop inferensi bersama.
  </Accordion>
  <Accordion title="Helper stream khusus Anthropic">
    Header beta, `/fast` / `serviceTier`, dan `context1m` berada di dalam seam
    `api.ts` / `contract-api.ts` publik milik plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), bukan di dalam
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
- Mengembalikan buffer audio PCM + laju sampel. Plugin harus melakukan resample/encode untuk penyedia.
- `listVoices` bersifat opsional per penyedia. Gunakan untuk pemilih suara atau alur penyiapan yang dimiliki vendor.
- Daftar suara dapat menyertakan metadata yang lebih kaya seperti locale, gender, dan tag personality untuk pemilih yang sadar penyedia.
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

- Pertahankan kebijakan TTS, fallback, dan pengiriman balasan di inti.
- Gunakan penyedia speech untuk perilaku sintesis yang dimiliki vendor.
- Input Microsoft lama `edge` dinormalisasi ke ID penyedia `microsoft`.
- Model kepemilikan yang disukai berorientasi perusahaan: satu plugin vendor dapat memiliki
  penyedia teks, speech, gambar, dan media masa depan seiring OpenClaw menambahkan
  kontrak kapabilitas tersebut.

Untuk pemahaman gambar/audio/video, plugin mendaftarkan satu penyedia
pemahaman-media bertipe, bukan bag key/value generik:

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

- Pertahankan orkestrasi, fallback, konfigurasi, dan wiring channel di inti.
- Pertahankan perilaku vendor di plugin penyedia.
- Ekspansi aditif harus tetap bertipe: metode opsional baru, field hasil opsional baru,
  kapabilitas opsional baru.
- Pembuatan video sudah mengikuti pola yang sama:
  - inti memiliki kontrak kapabilitas dan helper runtime
  - plugin vendor mendaftarkan `api.registerVideoGenerationProvider(...)`
  - plugin fitur/channel memakai `api.runtime.videoGeneration.*`

Untuk helper runtime pemahaman-media, plugin dapat memanggil:

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

Untuk transkripsi audio, plugin dapat menggunakan runtime pemahaman-media
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

- `api.runtime.mediaUnderstanding.*` adalah permukaan bersama yang disukai untuk
  pemahaman gambar/audio/video.
- Menggunakan konfigurasi audio pemahaman-media inti (`tools.media.audio`) dan urutan fallback penyedia.
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
- Untuk eksekusi fallback yang dimiliki plugin, operator harus ikut serta dengan `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Gunakan `plugins.entries.<id>.subagent.allowedModels` untuk membatasi plugin tepercaya ke target kanonis `provider/model` tertentu, atau `"*"` untuk mengizinkan target apa pun secara eksplisit.
- Eksekusi subagent plugin yang tidak tepercaya tetap berfungsi, tetapi permintaan override ditolak alih-alih diam-diam fallback.
- Sesi subagent yang dibuat plugin diberi tag dengan ID plugin pembuatnya. Fallback `api.runtime.subagent.deleteSession(...)` hanya dapat menghapus sesi yang dimiliki tersebut; penghapusan sesi sembarang tetap memerlukan permintaan Gateway dengan cakupan admin.

Untuk pencarian web, plugin dapat memakai helper runtime bersama alih-alih
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

Plugin juga dapat mendaftarkan penyedia pencarian web melalui
`api.registerWebSearchProvider(...)`.

Catatan:

- Pertahankan pemilihan penyedia, resolusi kredensial, dan semantik permintaan bersama di inti.
- Gunakan penyedia pencarian web untuk transport pencarian khusus vendor.
- `api.runtime.webSearch.*` adalah permukaan bersama yang disukai untuk plugin fitur/channel yang membutuhkan perilaku pencarian tanpa bergantung pada wrapper tool agen.

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

- `generate(...)`: menghasilkan gambar menggunakan rantai penyedia pembuatan-gambar yang dikonfigurasi.
- `listProviders(...)`: mencantumkan penyedia pembuatan-gambar yang tersedia beserta kapabilitasnya.

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
- `auth`: wajib. Gunakan `"gateway"` untuk mewajibkan auth gateway normal, atau `"plugin"` untuk verifikasi auth/webhook yang dikelola plugin.
- `match`: opsional. `"exact"` (default) atau `"prefix"`.
- `replaceExisting`: opsional. Memungkinkan plugin yang sama mengganti pendaftaran rute miliknya sendiri yang sudah ada.
- `handler`: kembalikan `true` ketika rute menangani permintaan.

Catatan:

- `api.registerHttpHandler(...)` telah dihapus dan akan menyebabkan kesalahan pemuatan Plugin. Gunakan `api.registerHttpRoute(...)` sebagai gantinya.
- Rute Plugin harus mendeklarasikan `auth` secara eksplisit.
- Konflik `path + match` persis ditolak kecuali `replaceExisting: true`, dan satu Plugin tidak dapat menggantikan rute Plugin lain.
- Rute yang tumpang tindih dengan level `auth` berbeda ditolak. Pertahankan rantai fallthrough `exact`/`prefix` hanya pada level auth yang sama.
- Rute `auth: "plugin"` **tidak** menerima cakupan runtime operator secara otomatis. Rute ini ditujukan untuk Webhook/verifikasi tanda tangan yang dikelola Plugin, bukan panggilan pembantu Gateway yang memiliki hak istimewa.
- Rute `auth: "gateway"` berjalan di dalam cakupan runtime permintaan Gateway, tetapi cakupan tersebut sengaja dibuat konservatif:
  - auth bearer rahasia bersama (`gateway.auth.mode = "token"` / `"password"`) menjaga cakupan runtime rute Plugin tetap dipatok ke `operator.write`, meskipun pemanggil mengirim `x-openclaw-scopes`
  - mode HTTP tepercaya yang membawa identitas (misalnya `trusted-proxy` atau `gateway.auth.mode = "none"` pada ingress privat) menghormati `x-openclaw-scopes` hanya ketika header tersebut hadir secara eksplisit
  - jika `x-openclaw-scopes` tidak ada pada permintaan rute Plugin yang membawa identitas tersebut, cakupan runtime kembali ke `operator.write`
- Aturan praktis: jangan berasumsi bahwa rute Plugin dengan auth Gateway adalah permukaan admin implisit. Jika rute Anda memerlukan perilaku khusus admin, wajibkan mode auth yang membawa identitas dan dokumentasikan kontrak header `x-openclaw-scopes` eksplisit.

## Jalur impor SDK Plugin

Gunakan subpath SDK yang sempit alih-alih barrel root monolitik `openclaw/plugin-sdk`
saat membuat Plugin baru. Subpath inti:

| Subpath                             | Tujuan                                             |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitif pendaftaran Plugin                       |
| `openclaw/plugin-sdk/channel-core`  | Pembantu entri/pembuatan kanal                    |
| `openclaw/plugin-sdk/core`          | Pembantu bersama generik dan kontrak payung       |
| `openclaw/plugin-sdk/config-schema` | Skema Zod root `openclaw.json` (`OpenClawSchema`) |

Plugin kanal memilih dari keluarga seam sempit — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, dan `channel-actions`. Perilaku persetujuan harus dikonsolidasikan
pada satu kontrak `approvalCapability` daripada mencampur beberapa field
Plugin yang tidak terkait. Lihat [Plugin kanal](/id/plugins/sdk-channel-plugins).

Pembantu runtime dan konfigurasi berada di bawah subpath `*-runtime` terfokus
yang sesuai (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, dll.). Pilih `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot`, dan `config-mutation`
alih-alih barrel kompatibilitas `config-runtime` yang luas.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
dan `openclaw/plugin-sdk/infra-runtime` adalah shim kompatibilitas usang untuk
Plugin lama. Kode baru harus mengimpor primitif generik yang lebih sempit sebagai gantinya.
</Info>

Titik entri internal repo (per root paket Plugin bundel):

- `index.js` — entri Plugin bundel
- `api.js` — barrel pembantu/tipe
- `runtime-api.js` — barrel khusus runtime
- `setup-entry.js` — entri Plugin setup

Plugin eksternal seharusnya hanya mengimpor subpath `openclaw/plugin-sdk/*`. Jangan pernah
mengimpor `src/*` milik paket Plugin lain dari inti atau dari Plugin lain.
Titik entri yang dimuat facade memilih snapshot konfigurasi runtime aktif ketika ada,
lalu fallback ke file konfigurasi yang di-resolve pada disk.

Subpath spesifik kapabilitas seperti `image-generation`, `media-understanding`,
dan `speech` ada karena Plugin bundel menggunakannya saat ini. Subpath tersebut tidak
otomatis menjadi kontrak eksternal jangka panjang yang dibekukan — periksa halaman
referensi SDK yang relevan saat bergantung padanya.

## Skema alat pesan

Plugin harus memiliki kontribusi skema `describeMessageTool(...)` yang spesifik kanal
untuk primitif non-pesan seperti reaksi, pembacaan, dan jajak pendapat.
Presentasi kirim bersama harus menggunakan kontrak `MessagePresentation` generik
alih-alih field tombol, komponen, blok, atau kartu bawaan penyedia.
Lihat [Presentasi Pesan](/id/plugins/message-presentation) untuk kontrak,
aturan fallback, pemetaan penyedia, dan daftar periksa penulis Plugin.

Plugin yang dapat mengirim mendeklarasikan apa yang dapat mereka render melalui kapabilitas pesan:

- `presentation` untuk blok presentasi semantik (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` untuk permintaan pengiriman yang disematkan

Inti memutuskan apakah akan merender presentasi secara native atau menurunkannya menjadi teks.
Jangan mengekspos celah keluar UI bawaan penyedia dari alat pesan generik.
Pembantu SDK yang usang untuk skema native lama tetap diekspor untuk Plugin
pihak ketiga yang sudah ada, tetapi Plugin baru tidak seharusnya menggunakannya.

## Resolusi target kanal

Plugin kanal harus memiliki semantik target spesifik kanal. Pertahankan host
outbound bersama tetap generik dan gunakan permukaan adaptor perpesanan untuk aturan penyedia:

- `messaging.inferTargetChatType({ to })` menentukan apakah target yang dinormalisasi
  harus diperlakukan sebagai `direct`, `group`, atau `channel` sebelum pencarian direktori.
- `messaging.targetResolver.looksLikeId(raw, normalized)` memberi tahu inti apakah sebuah
  input harus langsung melewati resolusi mirip id alih-alih pencarian direktori.
- `messaging.targetResolver.resolveTarget(...)` adalah fallback Plugin ketika
  inti membutuhkan resolusi akhir milik penyedia setelah normalisasi atau setelah
  direktori tidak cocok.
- `messaging.resolveOutboundSessionRoute(...)` memiliki konstruksi rute sesi
  spesifik penyedia setelah target di-resolve.

Pembagian yang disarankan:

- Gunakan `inferTargetChatType` untuk keputusan kategori yang harus terjadi sebelum
  mencari peer/grup.
- Gunakan `looksLikeId` untuk pemeriksaan "perlakukan ini sebagai id target eksplisit/native".
- Gunakan `resolveTarget` untuk fallback normalisasi spesifik penyedia, bukan untuk
  pencarian direktori luas.
- Simpan id native penyedia seperti id chat, id thread, JID, handle, dan id room
  di dalam nilai `target` atau parameter spesifik penyedia, bukan di field SDK
  generik.

## Direktori berbasis konfigurasi

Plugin yang menurunkan entri direktori dari konfigurasi harus mempertahankan logika tersebut di
Plugin dan memakai ulang pembantu bersama dari
`openclaw/plugin-sdk/directory-runtime`.

Gunakan ini ketika sebuah kanal memerlukan peer/grup berbasis konfigurasi seperti:

- peer DM berbasis allowlist
- peta kanal/grup terkonfigurasi
- fallback direktori statis bercakupan akun

Pembantu bersama di `directory-runtime` hanya menangani operasi generik:

- pemfilteran kueri
- penerapan batas
- pembantu deduplikasi/normalisasi
- pembuatan `ChannelDirectoryEntry[]`

Inspeksi akun dan normalisasi id spesifik kanal harus tetap berada di
implementasi Plugin.

## Katalog penyedia

Plugin penyedia dapat mendefinisikan katalog model untuk inferensi dengan
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` mengembalikan bentuk yang sama yang ditulis OpenClaw ke
`models.providers`:

- `{ provider }` untuk satu entri penyedia
- `{ providers }` untuk beberapa entri penyedia

Gunakan `catalog` ketika Plugin memiliki id model spesifik penyedia, default URL dasar,
atau metadata model yang dibatasi auth.

`catalog.order` mengontrol kapan katalog Plugin bergabung relatif terhadap penyedia
implisit bawaan OpenClaw:

- `simple`: penyedia berbasis API key polos atau env
- `profile`: penyedia yang muncul ketika profil auth ada
- `paired`: penyedia yang mensintesis beberapa entri penyedia terkait
- `late`: lintasan terakhir, setelah penyedia implisit lain

Penyedia yang lebih akhir menang pada tabrakan key, sehingga Plugin dapat secara sengaja menimpa
entri penyedia bawaan dengan id penyedia yang sama.

Plugin juga dapat menerbitkan baris model baca-saja melalui
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Ini adalah jalur ke depan untuk permukaan daftar/bantuan/pemilih dan mendukung
baris `text`, `image_generation`, `video_generation`, dan `music_generation`.
Plugin penyedia tetap memiliki panggilan endpoint live, pertukaran token, dan pemetaan
respons vendor; inti memiliki bentuk baris umum, label sumber, dan pemformatan bantuan
alat media. Pendaftaran penyedia generasi-media secara otomatis mensintesis baris
katalog statis dari `defaultModel`, `models`, dan `capabilities`.

Kompatibilitas:

- `discovery` masih berfungsi sebagai alias lama, tetapi memancarkan peringatan penghentian
- jika `catalog` dan `discovery` sama-sama terdaftar, OpenClaw menggunakan `catalog`
- `augmentModelCatalog` sudah usang; penyedia bundel harus menerbitkan
  baris tambahan melalui `registerModelCatalogProvider`

## Inspeksi kanal baca-saja

Jika Plugin Anda mendaftarkan kanal, sebaiknya implementasikan
`plugin.config.inspectAccount(cfg, accountId)` bersama `resolveAccount(...)`.

Alasannya:

- `resolveAccount(...)` adalah jalur runtime. Ini boleh berasumsi bahwa kredensial
  sudah sepenuhnya diwujudkan dan dapat gagal cepat ketika rahasia yang diperlukan hilang.
- Jalur perintah baca-saja seperti `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, dan alur perbaikan doctor/config
  tidak seharusnya perlu mewujudkan kredensial runtime hanya untuk
  mendeskripsikan konfigurasi.

Perilaku `inspectAccount(...)` yang disarankan:

- Kembalikan hanya status akun yang deskriptif.
- Pertahankan `enabled` dan `configured`.
- Sertakan field sumber/status kredensial ketika relevan, seperti:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Anda tidak perlu mengembalikan nilai token mentah hanya untuk melaporkan ketersediaan
  baca-saja. Mengembalikan `tokenStatus: "available"` (dan field sumber yang sesuai)
  sudah cukup untuk perintah bergaya status.
- Gunakan `configured_unavailable` ketika kredensial dikonfigurasi melalui SecretRef tetapi
  tidak tersedia pada jalur perintah saat ini.

Ini memungkinkan perintah baca-saja melaporkan "terkonfigurasi tetapi tidak tersedia di jalur perintah ini"
alih-alih crash atau salah melaporkan akun sebagai tidak terkonfigurasi.

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

Guardrail keamanan: setiap entri `openclaw.extensions` harus tetap berada di dalam direktori Plugin
setelah resolusi symlink. Entri yang keluar dari direktori paket ditolak.

Catatan keamanan: `openclaw plugins install` menginstal dependensi Plugin dengan
`npm install --omit=dev --ignore-scripts` lokal proyek (tanpa skrip lifecycle,
tanpa dependensi dev saat runtime), mengabaikan pengaturan npm install global yang diwariskan.
Jaga agar pohon dependensi Plugin tetap "JS/TS murni" dan hindari paket yang memerlukan
build `postinstall`.

Opsional: `openclaw.setupEntry` dapat menunjuk ke modul ringan khusus setup.
Ketika OpenClaw memerlukan permukaan setup untuk Plugin kanal yang dinonaktifkan, atau
ketika Plugin kanal diaktifkan tetapi masih belum dikonfigurasi, OpenClaw memuat `setupEntry`
alih-alih entri Plugin penuh. Ini membuat startup dan setup lebih ringan
ketika entri Plugin utama Anda juga menghubungkan alat, hook, atau kode khusus runtime
lainnya.

Opsional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
dapat mengikutsertakan Plugin kanal ke jalur `setupEntry` yang sama selama fase startup
pra-listen Gateway, bahkan ketika kanal sudah dikonfigurasi.

Gunakan ini hanya ketika `setupEntry` sepenuhnya mencakup permukaan startup yang harus ada
sebelum Gateway mulai mendengarkan. Dalam praktiknya, ini berarti entri setup
harus mendaftarkan setiap kapabilitas milik kanal yang bergantung pada startup, seperti:

- pendaftaran kanal itu sendiri
- rute HTTP apa pun yang harus tersedia sebelum Gateway mulai mendengarkan
- metode, alat, atau layanan Gateway apa pun yang harus ada selama jendela yang sama

Jika entri penuh Anda masih memiliki kapabilitas startup wajib apa pun, jangan aktifkan
flag ini. Pertahankan plugin pada perilaku default dan biarkan OpenClaw memuat
entri penuh selama startup.

Kanal bawaan juga dapat menerbitkan helper permukaan kontrak khusus setup yang dapat
dikonsultasikan inti sebelum runtime kanal penuh dimuat. Permukaan promosi setup
saat ini adalah:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Inti menggunakan permukaan itu ketika perlu mempromosikan konfigurasi kanal akun tunggal
lama ke `channels.<id>.accounts.*` tanpa memuat entri plugin penuh.
Matrix adalah contoh bawaan saat ini: ia hanya memindahkan kunci auth/bootstrap ke
akun bernama yang dipromosikan ketika akun bernama sudah ada, dan dapat mempertahankan
kunci akun default non-kanonik yang dikonfigurasi alih-alih selalu membuat
`accounts.default`.

Adaptor patch setup tersebut menjaga penemuan permukaan kontrak bawaan tetap lazy. Waktu
impor tetap ringan; permukaan promosi dimuat hanya pada penggunaan pertama alih-alih
memasuki kembali startup kanal bawaan saat impor modul.

Ketika permukaan startup tersebut menyertakan metode RPC Gateway, pertahankan pada
prefiks khusus plugin. Namespace admin inti (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu diselesaikan
ke `operator.admin`, bahkan jika plugin meminta cakupan yang lebih sempit.

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

Plugin kanal dapat mengiklankan metadata setup/penemuan melalui `openclaw.channel` dan
petunjuk instalasi melalui `openclaw.install`. Ini menjaga katalog inti bebas data.

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
- `docsLabel`: timpa teks tautan untuk tautan dokumentasi
- `preferOver`: id plugin/kanal berprioritas lebih rendah yang harus dikalahkan entri katalog ini
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrol salinan permukaan pilihan
- `markdownCapable`: menandai kanal sebagai mampu markdown untuk keputusan pemformatan keluar
- `exposure.configured`: sembunyikan kanal dari permukaan daftar kanal terkonfigurasi ketika disetel ke `false`
- `exposure.setup`: sembunyikan kanal dari pemilih setup/konfigurasi interaktif ketika disetel ke `false`
- `exposure.docs`: tandai kanal sebagai internal/privat untuk permukaan navigasi dokumentasi
- `showConfigured` / `showInSetup`: alias lama yang masih diterima untuk kompatibilitas; utamakan `exposure`
- `quickstartAllowFrom`: ikutkan kanal ke alur quickstart standar `allowFrom`
- `forceAccountBinding`: wajibkan pengikatan akun eksplisit bahkan ketika hanya ada satu akun
- `preferSessionLookupForAnnounceTarget`: utamakan pencarian sesi saat menyelesaikan target pengumuman

OpenClaw juga dapat menggabungkan **katalog kanal eksternal** (misalnya, ekspor registry MPM). Letakkan file JSON di salah satu dari:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Atau arahkan `OPENCLAW_PLUGIN_CATALOG_PATHS` (atau `OPENCLAW_MPM_CATALOG_PATHS`) ke
satu atau beberapa file JSON (dipisahkan koma/titik koma/`PATH`). Setiap file harus
berisi `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser juga menerima `"packages"` atau `"plugins"` sebagai alias lama untuk kunci `"entries"`.

Entri katalog kanal yang dihasilkan dan entri katalog instalasi penyedia mengekspos
fakta sumber instalasi yang dinormalisasi di samping blok mentah `openclaw.install`. Fakta
yang dinormalisasi mengidentifikasi apakah spesifikasi npm adalah versi persis atau
selektor mengambang, apakah metadata integritas yang diharapkan ada, dan apakah path
sumber lokal juga tersedia. Ketika identitas katalog/paket diketahui, fakta yang
dinormalisasi memperingatkan jika nama paket npm hasil parsing bergeser dari identitas itu.
Fakta tersebut juga memperingatkan ketika `defaultChoice` tidak valid atau menunjuk ke sumber yang
tidak tersedia, dan ketika metadata integritas npm ada tanpa sumber npm yang valid.
Konsumen harus memperlakukan `installSource` sebagai field opsional tambahan sehingga
entri buatan tangan dan shim katalog tidak perlu menyintesisnya.
Ini memungkinkan onboarding dan diagnostik menjelaskan status bidang sumber tanpa
mengimpor runtime plugin.

Entri npm eksternal resmi sebaiknya mengutamakan `npmSpec` persis plus
`expectedIntegrity`. Nama paket polos dan dist-tag tetap berfungsi untuk
kompatibilitas, tetapi memunculkan peringatan bidang sumber sehingga katalog dapat bergerak
menuju instalasi yang dipin dan diperiksa integritasnya tanpa merusak plugin yang ada.
Ketika onboarding menginstal dari path katalog lokal, ia mencatat entri indeks plugin
terkelola dengan `source: "path"` dan `sourcePath` relatif workspace bila memungkinkan.
Path pemuatan operasional absolut tetap berada di `plugins.load.paths`; catatan instalasi
menghindari duplikasi path workstation lokal ke dalam konfigurasi berumur panjang. Ini menjaga
instalasi pengembangan lokal tetap terlihat oleh diagnostik bidang sumber tanpa menambahkan
permukaan pengungkapan path filesystem mentah kedua. Indeks plugin `plugins/installs.json`
yang dipersistensikan adalah sumber kebenaran instalasi dan dapat disegarkan tanpa memuat modul
runtime plugin. Peta `installRecords`-nya tahan lama bahkan ketika manifes plugin hilang atau
tidak valid; array `plugins`-nya adalah tampilan manifes yang dapat dibangun ulang.

## Plugin mesin konteks

Plugin mesin konteks memiliki orkestrasi konteks sesi untuk ingest, assembly,
dan Compaction. Daftarkan dari plugin Anda dengan
`api.registerContextEngine(id, factory)`, lalu pilih mesin aktif dengan
`plugins.slots.contextEngine`.

Gunakan ini ketika plugin Anda perlu mengganti atau memperluas pipeline konteks default,
bukan sekadar menambahkan pencarian memori atau hook.

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

Jika mesin Anda **tidak** memiliki algoritma Compaction, pertahankan `compact()`
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

## Menambahkan kapabilitas baru

Ketika plugin membutuhkan perilaku yang tidak cocok dengan API saat ini, jangan memintas
sistem plugin dengan akses privat langsung. Tambahkan kapabilitas yang hilang.

Urutan yang disarankan:

1. definisikan kontrak inti
   Tentukan perilaku bersama yang harus dimiliki inti: kebijakan, fallback, penggabungan konfigurasi,
   lifecycle, semantik yang menghadap kanal, dan bentuk helper runtime.
2. tambahkan permukaan pendaftaran/runtime plugin bertipe
   Perluas `OpenClawPluginApi` dan/atau `api.runtime` dengan permukaan kapabilitas
   bertipe terkecil yang berguna.
3. rangkai inti + konsumen kanal/fitur
   Kanal dan plugin fitur harus mengonsumsi kapabilitas baru melalui inti,
   bukan dengan mengimpor implementasi vendor secara langsung.
4. daftarkan implementasi vendor
   Plugin vendor kemudian mendaftarkan backend mereka terhadap kapabilitas.
5. tambahkan cakupan kontrak
   Tambahkan pengujian agar bentuk kepemilikan dan pendaftaran tetap eksplisit dari waktu ke waktu.

Beginilah OpenClaw tetap berpendirian tanpa menjadi hardcoded ke pandangan dunia satu
penyedia. Lihat [Cookbook Kapabilitas](/id/plugins/adding-capabilities)
untuk checklist file konkret dan contoh kerja.

### Checklist kapabilitas

Ketika Anda menambahkan kapabilitas baru, implementasinya biasanya harus menyentuh
permukaan ini bersama-sama:

- tipe kontrak inti di `src/<capability>/types.ts`
- helper runner/runtime inti di `src/<capability>/runtime.ts`
- permukaan pendaftaran API plugin di `src/plugins/types.ts`
- wiring registry plugin di `src/plugins/registry.ts`
- eksposur runtime plugin di `src/plugins/runtime/*` ketika plugin fitur/kanal
  perlu mengonsumsinya
- helper capture/test di `src/test-utils/plugin-registration.ts`
- asersi kepemilikan/kontrak di `src/plugins/contracts/registry.ts`
- dokumentasi operator/plugin di `docs/`

Jika salah satu permukaan tersebut hilang, itu biasanya tanda bahwa kapabilitas
belum sepenuhnya terintegrasi.

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

Pola pengujian kontrak:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Itu menjaga aturannya tetap sederhana:

- inti memiliki kontrak kapabilitas + orkestrasi
- plugin vendor memiliki implementasi vendor
- plugin fitur/kanal mengonsumsi helper runtime
- pengujian kontrak menjaga kepemilikan tetap eksplisit

## Terkait

- [Arsitektur plugin](/id/plugins/architecture) — model dan bentuk kapabilitas publik
- [Subpath SDK plugin](/id/plugins/sdk-subpaths)
- [Setup SDK plugin](/id/plugins/sdk-setup)
- [Membangun plugin](/id/plugins/building-plugins)

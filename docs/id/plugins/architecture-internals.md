---
read_when:
    - Menerapkan hook runtime penyedia, siklus hidup channel, atau paket package pack
    - Men-debug urutan pemuatan Plugin atau status registri
    - Menambahkan kapabilitas plugin baru atau plugin mesin konteks
summary: 'Internal arsitektur Plugin: alur pemuatan, registry, kait runtime, rute HTTP, dan tabel referensi'
title: Internal arsitektur Plugin
x-i18n:
    generated_at: "2026-06-27T17:44:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29abbd75d696a26cf33702a78abfcc987aaf5358eca2dc1ebe43f039f4ff6edf
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Untuk model kapabilitas publik, bentuk Plugin, dan kontrak kepemilikan/eksekusi,
lihat [Arsitektur Plugin](/id/plugins/architecture). Halaman ini adalah
referensi untuk mekanika internal: alur pemuatan, registri, kait waktu jalan,
rute HTTP Gateway, jalur impor, dan tabel skema.

## Alur pemuatan

Saat mulai berjalan, OpenClaw secara garis besar melakukan ini:

1. menemukan akar Plugin kandidat
2. membaca manifes bundel native atau kompatibel dan metadata paket
3. menolak kandidat yang tidak aman
4. menormalkan konfigurasi Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. menentukan pengaktifan untuk setiap kandidat
6. memuat modul native yang diaktifkan: modul bundel bawaan menggunakan pemuat native;
   sumber lokal TypeScript pihak ketiga menggunakan mekanisme cadangan darurat Jiti
7. memanggil kait native `register(api)` dan mengumpulkan registrasi ke registri Plugin
8. mengekspos registri ke permukaan perintah/waktu jalan

<Note>
`activate` adalah alias lama untuk `register` — pemuat menyelesaikan mana pun yang tersedia (`def.register ?? def.activate`) dan memanggilnya pada titik yang sama. Semua Plugin bundel menggunakan `register`; pilih `register` untuk Plugin baru.
</Note>

Gerbang keamanan terjadi **sebelum** eksekusi waktu jalan. Kandidat diblokir
ketika entri keluar dari akar Plugin, jalurnya dapat ditulis oleh semua pengguna,
atau kepemilikan jalur terlihat mencurigakan untuk Plugin non-bundel.

Kandidat yang diblokir tetap terikat ke id Plugin-nya untuk diagnostik. Jika
konfigurasi masih mereferensikan id itu, validasi melaporkan Plugin sebagai ada
tetapi diblokir dan menunjuk kembali ke peringatan keamanan jalur alih-alih
memperlakukan entri konfigurasi sebagai usang.

### Perilaku mengutamakan manifes

Manifes adalah sumber kebenaran bidang kontrol. OpenClaw menggunakannya untuk:

- mengidentifikasi Plugin
- menemukan kanal/Skills/skema konfigurasi yang dideklarasikan atau kapabilitas bundel
- memvalidasi `plugins.entries.<id>.config`
- memperkaya label/placeholder Control UI
- menampilkan metadata instalasi/katalog
- mempertahankan deskriptor aktivasi dan penyiapan yang murah tanpa memuat waktu jalan Plugin

Untuk Plugin native, modul waktu jalan adalah bagian bidang data. Modul ini
mendaftarkan perilaku aktual seperti kait, alat, perintah, atau alur penyedia.

Blok manifes opsional `activation` dan `setup` tetap berada di bidang kontrol.
Keduanya adalah deskriptor khusus metadata untuk perencanaan aktivasi dan
penemuan penyiapan; keduanya tidak menggantikan registrasi waktu jalan,
`register(...)`, atau `setupEntry`. Konsumen aktivasi langsung pertama kini
menggunakan petunjuk perintah, kanal, dan penyedia dari manifes untuk
mempersempit pemuatan Plugin sebelum materialisasi registri yang lebih luas:

- pemuatan CLI dipersempit ke Plugin yang memiliki perintah utama yang diminta
- penyiapan kanal/resolusi Plugin dipersempit ke Plugin yang memiliki id kanal
  yang diminta
- penyiapan/resolusi waktu jalan penyedia eksplisit dipersempit ke Plugin yang memiliki
  id penyedia yang diminta
- perencanaan startup Gateway menggunakan `activation.onStartup` untuk impor startup
  eksplisit dan pengecualian startup; Plugin tanpa metadata startup hanya dimuat
  melalui pemicu aktivasi yang lebih sempit

Prapemuatan waktu jalan pada saat permintaan yang meminta cakupan `all` yang luas
tetap menurunkan kumpulan id Plugin efektif eksplisit dari konfigurasi,
perencanaan startup, kanal yang dikonfigurasi, slot, dan aturan pengaktifan
otomatis. Jika kumpulan turunan itu kosong, OpenClaw memuat registri waktu jalan
kosong alih-alih memperluas ke setiap Plugin yang dapat ditemukan.

Perencana aktivasi mengekspos API khusus id untuk pemanggil yang sudah ada dan
API rencana untuk diagnostik baru. Entri rencana melaporkan mengapa sebuah
Plugin dipilih, memisahkan petunjuk perencana `activation.*` eksplisit dari
cadangan kepemilikan manifes seperti `providers`, `channels`, `commandAliases`,
`setup.providers`, `contracts.tools`, dan kait. Pemisahan alasan itu adalah
batas kompatibilitas: metadata Plugin yang sudah ada tetap berfungsi, sementara
kode baru dapat mendeteksi petunjuk luas atau perilaku cadangan tanpa mengubah
semantik pemuatan waktu jalan.

Penemuan penyiapan kini lebih memilih id yang dimiliki deskriptor seperti
`setup.providers` dan `setup.cliBackends` untuk mempersempit Plugin kandidat
sebelum kembali ke `setup-api` untuk Plugin yang masih membutuhkan kait waktu
jalan pada saat penyiapan. Daftar penyiapan penyedia menggunakan
`providerAuthChoices` manifes, pilihan penyiapan turunan deskriptor, dan metadata
katalog instalasi tanpa memuat waktu jalan penyedia. `setup.requiresRuntime: false`
eksplisit adalah batas khusus deskriptor; `requiresRuntime` yang dihilangkan
mempertahankan cadangan setup-api lama untuk kompatibilitas. Jika lebih dari
satu Plugin yang ditemukan mengklaim id penyedia penyiapan atau backend CLI
ternormalisasi yang sama, pencarian penyiapan menolak pemilik yang ambigu
alih-alih mengandalkan urutan penemuan. Ketika waktu jalan penyiapan memang
dieksekusi, diagnostik registri melaporkan penyimpangan antara `setup.providers`
/ `setup.cliBackends` dan penyedia atau backend CLI yang didaftarkan oleh
setup-api tanpa memblokir Plugin lama.

### Batas cache Plugin

OpenClaw tidak menyimpan cache hasil penemuan Plugin atau data registri manifes
langsung di balik jendela berbasis jam dinding. Instalasi, penyuntingan
manifes, dan perubahan jalur pemuatan harus terlihat pada pembacaan metadata
eksplisit berikutnya atau pembangunan ulang snapshot berikutnya. Parser file
manifes boleh menyimpan cache tanda tangan file terbatas yang dikunci oleh
jalur manifes yang dibuka, inode, ukuran, dan timestamp; cache itu hanya
menghindari pemarsingan ulang byte yang tidak berubah dan tidak boleh menyimpan
jawaban penemuan, registri, pemilik, atau kebijakan.

Jalur cepat metadata yang aman adalah kepemilikan objek eksplisit, bukan cache
tersembunyi. Jalur panas startup Gateway harus meneruskan `PluginMetadataSnapshot`
saat ini, `PluginLookUpTable` turunan, atau registri manifes eksplisit melalui
rantai panggilan. Validasi konfigurasi, pengaktifan otomatis startup, bootstrap
Plugin, dan pemilihan penyedia dapat menggunakan ulang objek-objek itu selama
mereka merepresentasikan konfigurasi dan inventaris Plugin saat ini. Pencarian
penyiapan tetap merekonstruksi metadata manifes sesuai permintaan kecuali jalur
penyiapan spesifik menerima registri manifes eksplisit; pertahankan itu sebagai
cadangan jalur dingin alih-alih menambahkan cache pencarian tersembunyi. Ketika
input berubah, bangun ulang dan ganti snapshot alih-alih memutasinya atau
menyimpan salinan historis.
Tampilan atas registri Plugin aktif dan pembantu bootstrap kanal bundel harus
dihitung ulang dari registri/akar saat ini. Peta berumur pendek boleh digunakan
di dalam satu panggilan untuk menghapus duplikasi pekerjaan atau menjaga
reentri; peta tersebut tidak boleh menjadi cache metadata proses.

Untuk pemuatan Plugin, lapisan cache persisten adalah pemuatan waktu jalan.
Lapisan ini boleh menggunakan ulang status pemuat ketika kode atau artefak
terpasang benar-benar dimuat, seperti:

- `PluginLoaderCacheState` dan registri waktu jalan aktif yang kompatibel
- cache jiti/modul dan cache pemuat permukaan publik yang digunakan untuk menghindari
  impor permukaan waktu jalan yang sama berulang kali
- cache sistem file untuk artefak Plugin terpasang
- peta per panggilan berumur pendek untuk normalisasi jalur atau resolusi duplikat

Cache tersebut adalah detail implementasi bidang data. Cache tersebut tidak
boleh menjawab pertanyaan bidang kontrol seperti "Plugin mana yang memiliki
penyedia ini?" kecuali pemanggil memang sengaja meminta pemuatan waktu jalan.

Jangan tambahkan cache persisten atau berbasis jam dinding untuk:

- hasil penemuan
- registri manifes langsung
- registri manifes yang direkonstruksi dari indeks Plugin terpasang
- pencarian pemilik penyedia, penekanan model, kebijakan penyedia, atau metadata
  artefak publik
- jawaban turunan manifes lainnya yang seharusnya membuat manifes yang berubah,
  indeks terpasang, atau jalur pemuatan terlihat pada pembacaan metadata berikutnya

Pemanggil yang membangun ulang metadata manifes dari indeks Plugin terpasang
yang dipersistenkan merekonstruksi registri itu sesuai permintaan. Indeks
terpasang adalah status bidang sumber yang tahan lama; itu bukan cache metadata
dalam proses yang tersembunyi.

## Model registri

Plugin yang dimuat tidak secara langsung memutasi global inti acak. Mereka
mendaftar ke registri Plugin pusat.

Registri melacak:

- catatan Plugin (identitas, sumber, asal, status, diagnostik)
- alat
- kait lama dan kait bertipe
- kanal
- penyedia
- handler RPC Gateway
- rute HTTP
- registrar CLI
- layanan latar belakang
- perintah yang dimiliki Plugin

Fitur inti kemudian membaca dari registri itu alih-alih berbicara langsung ke
modul Plugin. Ini membuat pemuatan satu arah:

- modul Plugin -> registrasi registri
- waktu jalan inti -> konsumsi registri

Pemisahan itu penting untuk pemeliharaan. Artinya sebagian besar permukaan inti
hanya membutuhkan satu titik integrasi: "baca registri", bukan "perlakukan setiap
modul Plugin secara khusus".

## Callback pengikatan percakapan

Plugin yang mengikat percakapan dapat bereaksi ketika sebuah persetujuan diselesaikan.

Gunakan `api.onConversationBindingResolved(...)` untuk menerima callback setelah
permintaan pengikatan disetujui atau ditolak:

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
- `binding`: pengikatan yang diselesaikan untuk permintaan yang disetujui
- `request`: ringkasan permintaan asli, petunjuk pelepasan, id pengirim, dan
  metadata percakapan

Callback ini hanya notifikasi. Callback ini tidak mengubah siapa yang diizinkan
mengikat percakapan, dan berjalan setelah penanganan persetujuan inti selesai.

## Kait waktu jalan penyedia

Plugin penyedia memiliki tiga lapisan:

- **Metadata manifes** untuk pencarian murah sebelum waktu jalan:
  `setup.providers[].envVars`, kompatibilitas usang `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices`, dan `channelEnvVars`.
- **Kait waktu konfigurasi**: `catalog` (`discovery` lama) ditambah
  `applyConfigDefaults`.
- **Kait waktu jalan**: 40+ kait opsional yang mencakup autentikasi, resolusi model,
  pembungkusan stream, level berpikir, kebijakan replay, dan endpoint penggunaan. Lihat
  daftar lengkap di [Urutan dan penggunaan kait](#hook-order-and-usage).

OpenClaw tetap memiliki loop agen generik, failover, penanganan transkrip, dan
kebijakan alat. Kait ini adalah permukaan ekstensi untuk perilaku spesifik
penyedia tanpa memerlukan transport inferensi kustom utuh.

Gunakan manifes `setup.providers[].envVars` ketika penyedia memiliki kredensial
berbasis env yang harus dilihat jalur autentikasi/status/pemilih-model generik
tanpa memuat waktu jalan Plugin. `providerAuthEnvVars` yang usang masih dibaca
oleh adapter kompatibilitas selama jendela deprekasi, dan Plugin non-bundel yang
menggunakannya menerima diagnostik manifes. Gunakan manifes
`providerAuthAliases` ketika satu id penyedia harus menggunakan ulang env var,
profil autentikasi, autentikasi berbasis konfigurasi, dan pilihan onboarding
kunci API milik id penyedia lain. Gunakan manifes `providerAuthChoices` ketika
permukaan CLI onboarding/pilihan-autentikasi harus mengetahui id pilihan
penyedia, label grup, dan pengabelan autentikasi satu-flag sederhana tanpa
memuat waktu jalan penyedia. Pertahankan `envVars` waktu jalan penyedia untuk
petunjuk yang menghadap operator seperti label onboarding atau variabel
penyiapan client-id/client-secret OAuth.

Gunakan manifes `channelEnvVars` ketika sebuah kanal memiliki autentikasi atau
penyiapan berbasis env yang harus dilihat oleh cadangan shell-env generik,
pemeriksaan konfigurasi/status, atau prompt penyiapan tanpa memuat waktu jalan
kanal.

### Urutan dan penggunaan kait

Untuk Plugin model/penyedia, OpenClaw memanggil kait dalam urutan kasar ini.
Kolom "Kapan digunakan" adalah panduan keputusan cepat.
Field penyedia khusus kompatibilitas yang tidak lagi dipanggil OpenClaw, seperti
`ProviderPlugin.capabilities` dan `suppressBuiltInModel`, sengaja tidak
dicantumkan di sini.

| #   | Kait                              | Fungsinya                                                                                                      | Kapan digunakan                                                                                                                               |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Menerbitkan konfigurasi penyedia ke `models.providers` selama pembuatan `models.json`                         | Penyedia memiliki katalog atau default URL dasar                                                                                              |
| 2   | `applyConfigDefaults`             | Menerapkan default konfigurasi global milik penyedia selama materialisasi konfigurasi                          | Default bergantung pada mode auth, env, atau semantik keluarga model penyedia                                                                 |
| --  | _(pencarian model bawaan)_        | OpenClaw mencoba jalur registry/katalog normal terlebih dahulu                                                  | _(bukan kait plugin)_                                                                                                                         |
| 3   | `normalizeModelId`                | Menormalkan alias ID model legacy atau pratinjau sebelum pencarian                                             | Penyedia memiliki pembersihan alias sebelum resolusi model kanonis                                                                            |
| 4   | `normalizeTransport`              | Menormalkan `api` / `baseUrl` keluarga penyedia sebelum perakitan model generik                                | Penyedia memiliki pembersihan transport untuk ID penyedia kustom dalam keluarga transport yang sama                                            |
| 5   | `normalizeConfig`                 | Menormalkan `models.providers.<id>` sebelum resolusi runtime/penyedia                                          | Penyedia memerlukan pembersihan konfigurasi yang seharusnya berada di plugin; helper keluarga Google bawaan juga menopang entri konfigurasi Google yang didukung |
| 6   | `applyNativeStreamingUsageCompat` | Menerapkan penulisan ulang kompat native streaming-usage ke penyedia konfigurasi                               | Penyedia memerlukan perbaikan metadata penggunaan streaming native berbasis endpoint                                                          |
| 7   | `resolveConfigApiKey`             | Menyelesaikan auth penanda env untuk penyedia konfigurasi sebelum pemuatan auth runtime                        | Penyedia mengekspos kait resolusi kunci API penanda env milik sendiri                                                                         |
| 8   | `resolveSyntheticAuth`            | Memunculkan auth lokal/self-hosted atau berbasis konfigurasi tanpa menyimpan plaintext                         | Penyedia dapat beroperasi dengan penanda kredensial sintetis/lokal                                                                            |
| 9   | `resolveExternalAuthProfiles`     | Melapisi profil auth eksternal milik penyedia; default `persistence` adalah `runtime-only` untuk kredensial milik CLI/aplikasi | Penyedia menggunakan kembali kredensial auth eksternal tanpa menyimpan refresh token yang disalin; deklarasikan `contracts.externalAuthProviders` di manifes |
| 10  | `shouldDeferSyntheticProfileAuth` | Menurunkan prioritas placeholder profil sintetis tersimpan di belakang auth berbasis env/konfigurasi           | Penyedia menyimpan profil placeholder sintetis yang tidak boleh menang prioritas                                                              |
| 11  | `resolveDynamicModel`             | Fallback sinkron untuk ID model milik penyedia yang belum ada di registry lokal                                | Penyedia menerima ID model upstream arbitrer                                                                                                  |
| 12  | `prepareDynamicModel`             | Pemanasan asinkron, lalu `resolveDynamicModel` berjalan lagi                                                   | Penyedia memerlukan metadata jaringan sebelum menyelesaikan ID yang tidak dikenal                                                             |
| 13  | `normalizeResolvedModel`          | Penulisan ulang final sebelum runner tertanam menggunakan model yang sudah diselesaikan                        | Penyedia memerlukan penulisan ulang transport tetapi tetap menggunakan transport inti                                                          |
| 14  | `normalizeToolSchemas`            | Menormalkan skema tool sebelum runner tertanam melihatnya                                                      | Penyedia memerlukan pembersihan skema keluarga transport                                                                                      |
| 15  | `inspectToolSchemas`              | Memunculkan diagnostik skema milik penyedia setelah normalisasi                                                | Penyedia menginginkan peringatan kata kunci tanpa mengajarkan aturan khusus penyedia ke inti                                                  |
| 16  | `resolveReasoningOutputMode`      | Memilih kontrak output reasoning native vs bertag                                                              | Penyedia memerlukan reasoning/output final bertag alih-alih field native                                                                      |
| 17  | `prepareExtraParams`              | Normalisasi parameter request sebelum wrapper opsi stream generik                                              | Penyedia memerlukan parameter request default atau pembersihan parameter per penyedia                                                         |
| 18  | `createStreamFn`                  | Sepenuhnya mengganti jalur stream normal dengan transport kustom                                               | Penyedia memerlukan protokol wire kustom, bukan hanya wrapper                                                                                 |
| 20  | `wrapStreamFn`                    | Wrapper stream setelah wrapper generik diterapkan                                                              | Penyedia memerlukan wrapper kompat header/body/model request tanpa transport kustom                                                           |
| 21  | `resolveTransportTurnState`       | Melampirkan header atau metadata transport native per giliran                                                  | Penyedia ingin transport generik mengirim identitas giliran native penyedia                                                                   |
| 22  | `resolveWebSocketSessionPolicy`   | Melampirkan header WebSocket native atau kebijakan cool-down sesi                                              | Penyedia ingin transport WS generik menyesuaikan header sesi atau kebijakan fallback                                                          |
| 23  | `formatApiKey`                    | Pemformat profil auth: profil tersimpan menjadi string `apiKey` runtime                                        | Penyedia menyimpan metadata auth tambahan dan memerlukan bentuk token runtime kustom                                                          |
| 24  | `refreshOAuth`                    | Override refresh OAuth untuk endpoint refresh kustom atau kebijakan kegagalan refresh                          | Penyedia tidak cocok dengan refresher OpenClaw bersama                                                                                        |
| 25  | `buildAuthDoctorHint`             | Petunjuk perbaikan yang ditambahkan saat refresh OAuth gagal                                                   | Penyedia memerlukan panduan perbaikan auth milik penyedia setelah kegagalan refresh                                                           |
| 26  | `matchesContextOverflowError`     | Pencocok overflow context-window milik penyedia                                                                | Penyedia memiliki error overflow mentah yang akan terlewat oleh heuristik generik                                                             |
| 27  | `classifyFailoverReason`          | Klasifikasi alasan failover milik penyedia                                                                     | Penyedia dapat memetakan error API/transport mentah ke rate-limit/overload/dll                                                                |
| 28  | `isCacheTtlEligible`              | Kebijakan prompt-cache untuk penyedia proxy/backhaul                                                           | Penyedia memerlukan gating TTL cache khusus proxy                                                                                             |
| 29  | `buildMissingAuthMessage`         | Pengganti pesan pemulihan auth hilang generik                                                                  | Penyedia memerlukan petunjuk pemulihan auth hilang khusus penyedia                                                                            |
| 30  | `augmentModelCatalog`             | Baris katalog sintetis/final yang ditambahkan setelah discovery                                                | Penyedia memerlukan baris forward-compat sintetis di `models list` dan pemilih                                                               |
| 31  | `resolveThinkingProfile`          | Kumpulan level `/think` khusus model, label tampilan, dan default                                              | Penyedia mengekspos tangga thinking kustom atau label biner untuk model terpilih                                                              |
| 32  | `isBinaryThinking`                | Kait kompatibilitas toggle reasoning hidup/mati                                                                | Penyedia hanya mengekspos thinking biner hidup/mati                                                                                           |
| 33  | `supportsXHighThinking`           | Kait kompatibilitas dukungan reasoning `xhigh`                                                                 | Penyedia menginginkan `xhigh` hanya pada sebagian model                                                                                       |
| 34  | `resolveDefaultThinkingLevel`     | Kait kompatibilitas level `/think` default                                                                     | Penyedia memiliki kebijakan `/think` default untuk sebuah keluarga model                                                                      |
| 35  | `isModernModelRef`                | Pencocok model modern untuk filter profil live dan pemilihan smoke                                             | Penyedia memiliki pencocokan model pilihan live/smoke                                                                                         |
| 36  | `prepareRuntimeAuth`              | Menukar kredensial terkonfigurasi menjadi token/kunci runtime aktual tepat sebelum inferensi                   | Penyedia memerlukan pertukaran token atau kredensial request berumur pendek                                                                   |
| 37  | `resolveUsageAuth`                | Menyelesaikan kredensial penggunaan/billing untuk `/usage` dan permukaan status terkait                        | Penyedia memerlukan parsing token penggunaan/kuota kustom atau kredensial penggunaan yang berbeda                                              |
| 38  | `fetchUsageSnapshot`              | Mengambil dan menormalkan snapshot penggunaan/kuota khusus provider setelah auth diselesaikan                             | Provider memerlukan endpoint penggunaan khusus provider atau parser payload                                                                           |
| 39  | `createEmbeddingProvider`         | Membangun adapter embedding milik provider untuk memori/pencarian                                                     | Perilaku embedding memori menjadi milik Plugin provider                                                                                    |
| 40  | `buildReplayPolicy`               | Mengembalikan kebijakan replay yang mengontrol penanganan transkrip untuk provider                                        | Provider memerlukan kebijakan transkrip khusus (misalnya, penghapusan thinking-block)                                                               |
| 41  | `sanitizeReplayHistory`           | Menulis ulang riwayat replay setelah pembersihan transkrip generik                                                        | Provider memerlukan penulisan ulang replay khusus provider di luar helper compaction bersama                                                             |
| 42  | `validateReplayTurns`             | Validasi akhir replay-turn atau pembentukan ulang sebelum runner tertanam                                           | Transport provider memerlukan validasi giliran yang lebih ketat setelah sanitasi generik                                                                    |
| 43  | `onModelSelected`                 | Menjalankan efek samping pasca-pemilihan milik provider                                                                 | Provider memerlukan telemetri atau state milik provider saat model menjadi aktif                                                                  |

`normalizeModelId`, `normalizeTransport`, dan `normalizeConfig` pertama-tama memeriksa
Plugin penyedia yang cocok, lalu meneruskan ke Plugin penyedia lain yang mendukung hook
hingga ada yang benar-benar mengubah id model atau transport/config. Ini menjaga
shim penyedia alias/kompat tetap berfungsi tanpa mengharuskan pemanggil mengetahui
Plugin bawaan mana yang memiliki penulisan ulang tersebut. Jika tidak ada hook penyedia yang menulis ulang entri config
keluarga Google yang didukung, normalizer config Google bawaan tetap menerapkan
pembersihan kompatibilitas tersebut.

Jika penyedia membutuhkan protokol wire yang sepenuhnya khusus atau eksekutor permintaan khusus,
itu adalah kelas ekstensi yang berbeda. Hook ini ditujukan untuk perilaku penyedia
yang masih berjalan pada loop inferensi normal OpenClaw.

`resolveUsageAuth` memutuskan apakah OpenClaw harus memanggil `fetchUsageSnapshot` atau
kembali ke resolusi kredensial generik untuk permukaan penggunaan/status. Kembalikan
`{ token, accountId? }` ketika penyedia memiliki kredensial penggunaan, kembalikan
`{ handled: true }` ketika auth penggunaan milik penyedia telah menangani permintaan dan
harus menekan fallback API-key/OAuth generik, dan kembalikan `null` atau `undefined`
ketika penyedia tidak menangani auth penggunaan.

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

Plugin penyedia bawaan mengombinasikan hook di atas agar sesuai dengan kebutuhan catalog,
auth, pemikiran, replay, dan penggunaan tiap vendor. Kumpulan hook otoritatif berada bersama
setiap Plugin di bawah `extensions/`; halaman ini mengilustrasikan bentuknya, bukan
mencerminkan daftar tersebut.

<AccordionGroup>
  <Accordion title="Penyedia catalog pass-through">
    OpenRouter, Kilocode, Z.AI, xAI mendaftarkan `catalog` plus
    `resolveDynamicModel` / `prepareDynamicModel` agar mereka dapat menampilkan id model
    upstream sebelum catalog statis OpenClaw.
  </Accordion>
  <Accordion title="Penyedia endpoint OAuth dan penggunaan">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai memasangkan
    `prepareRuntimeAuth` atau `formatApiKey` dengan `resolveUsageAuth` +
    `fetchUsageSnapshot` untuk memiliki pertukaran token dan integrasi `/usage`.
  </Accordion>
  <Accordion title="Keluarga pembersihan replay dan transkrip">
    Keluarga bernama bersama (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) memungkinkan penyedia ikut serta dalam
    kebijakan transkrip melalui `buildReplayPolicy`, alih-alih setiap Plugin
    mengimplementasikan ulang pembersihan.
  </Accordion>
  <Accordion title="Penyedia khusus catalog">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway`, dan
    `volcengine` hanya mendaftarkan `catalog` dan menggunakan loop inferensi bersama.
  </Accordion>
  <Accordion title="Helper stream khusus Anthropic">
    Header beta, `/fast` / `serviceTier`, dan `context1m` berada di dalam
    seam publik Plugin Anthropic `api.ts` / `contract-api.ts`
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

- `textToSpeech` mengembalikan payload output TTS inti normal untuk permukaan file/catatan suara.
- Menggunakan konfigurasi `messages.tts` inti dan pemilihan penyedia.
- Mengembalikan buffer audio PCM + laju sampel. Plugin harus melakukan resample/encode untuk penyedia.
- `listVoices` bersifat opsional per penyedia. Gunakan untuk pemilih suara milik vendor atau alur penyiapan.
- Daftar suara dapat menyertakan metadata yang lebih kaya seperti locale, gender, dan tag kepribadian untuk pemilih sadar penyedia.
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
- Gunakan penyedia speech untuk perilaku sintesis milik vendor.
- Input Microsoft lama `edge` dinormalisasi ke id penyedia `microsoft`.
- Model kepemilikan yang disukai berorientasi perusahaan: satu Plugin vendor dapat memiliki
  penyedia teks, speech, gambar, dan media masa depan saat OpenClaw menambahkan
  kontrak kapabilitas tersebut.

Untuk pemahaman gambar/audio/video, Plugin mendaftarkan satu penyedia
pemahaman-media bertipe, bukan kantong key/value generik:

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
  - Plugin fitur/channel mengonsumsi `api.runtime.videoGeneration.*`

Untuk helper runtime pemahaman-media, Plugin dapat memanggil:

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

Untuk transkripsi audio, Plugin dapat menggunakan runtime pemahaman-media
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
- `extractStructuredWithModel(...)` adalah seam yang menghadap Plugin untuk ekstraksi
  milik penyedia yang terbatas dan mengutamakan gambar. Sertakan setidaknya satu input gambar;
  input teks adalah konteks tambahan.
  Plugin produk memiliki route dan skemanya, sementara OpenClaw memiliki
  batas penyedia/runtime.
- Menggunakan konfigurasi audio pemahaman-media inti (`tools.media.audio`) dan urutan fallback penyedia.
- Mengembalikan `{ text: undefined }` ketika tidak ada output transkripsi yang dihasilkan (misalnya input dilewati/tidak didukung).
- `api.runtime.stt.transcribeAudioFile(...)` tetap sebagai alias kompatibilitas.

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
- OpenClaw hanya menghormati field override tersebut untuk pemanggil tepercaya.
- Untuk run fallback milik Plugin, operator harus ikut serta dengan `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Gunakan `plugins.entries.<id>.subagent.allowedModels` untuk membatasi Plugin tepercaya ke target kanonis `provider/model` tertentu, atau `"*"` untuk mengizinkan target apa pun secara eksplisit.
- Run subagent Plugin yang tidak tepercaya tetap berfungsi, tetapi permintaan override ditolak alih-alih diam-diam melakukan fallback.
- Sesi subagent yang dibuat Plugin ditandai dengan id Plugin pembuat. Fallback `api.runtime.subagent.deleteSession(...)` hanya dapat menghapus sesi yang dimiliki tersebut; penghapusan sesi arbitrer tetap membutuhkan permintaan Gateway berscope admin.

Untuk pencarian web, Plugin dapat mengonsumsi helper runtime bersama alih-alih
masuk ke wiring tool agent:

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
- `api.runtime.webSearch.*` adalah permukaan bersama yang disukai untuk Plugin fitur/channel yang membutuhkan perilaku pencarian tanpa bergantung pada wrapper tool agent.

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

- `generate(...)`: hasilkan gambar menggunakan rantai penyedia pembuatan-gambar yang dikonfigurasi.
- `listProviders(...)`: cantumkan penyedia pembuatan-gambar yang tersedia dan kapabilitasnya.

## Route HTTP Gateway

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

Field route:

- `path`: path rute di bawah server HTTP gateway.
- `auth`: wajib. Gunakan `"gateway"` untuk mewajibkan autentikasi gateway normal, atau `"plugin"` untuk autentikasi/verifikasi webhook yang dikelola plugin.
- `match`: opsional. `"exact"` (bawaan) atau `"prefix"`.
- `replaceExisting`: opsional. Memungkinkan plugin yang sama mengganti pendaftaran rute miliknya yang sudah ada.
- `handler`: kembalikan `true` ketika rute menangani permintaan.

Catatan:

- `api.registerHttpHandler(...)` telah dihapus dan akan menyebabkan kesalahan pemuatan plugin. Gunakan `api.registerHttpRoute(...)` sebagai gantinya.
- Rute plugin harus mendeklarasikan `auth` secara eksplisit.
- Konflik `path + match` yang persis ditolak kecuali `replaceExisting: true`, dan satu plugin tidak dapat mengganti rute plugin lain.
- Rute yang bertumpang tindih dengan tingkat `auth` berbeda ditolak. Pertahankan rantai fallthrough `exact`/`prefix` hanya pada tingkat auth yang sama.
- Rute `auth: "plugin"` **tidak** menerima cakupan runtime operator secara otomatis. Rute ini untuk webhook/verifikasi tanda tangan yang dikelola plugin, bukan panggilan pembantu Gateway yang memiliki hak istimewa.
- Rute `auth: "gateway"` berjalan di dalam cakupan runtime permintaan Gateway, tetapi cakupan tersebut sengaja konservatif:
  - autentikasi bearer rahasia bersama (`gateway.auth.mode = "token"` / `"password"`) menjaga cakupan runtime rute plugin tetap tersemat ke `operator.write`, meskipun pemanggil mengirim `x-openclaw-scopes`
  - mode HTTP tepercaya yang membawa identitas (misalnya `trusted-proxy` atau `gateway.auth.mode = "none"` pada ingress privat) menghormati `x-openclaw-scopes` hanya ketika header tersebut hadir secara eksplisit
  - jika `x-openclaw-scopes` tidak ada pada permintaan rute plugin yang membawa identitas tersebut, cakupan runtime kembali ke `operator.write`
- Aturan praktis: jangan menganggap rute plugin dengan auth gateway sebagai permukaan admin implisit. Jika rute Anda membutuhkan perilaku khusus admin, wajibkan mode auth yang membawa identitas dan dokumentasikan kontrak header eksplisit `x-openclaw-scopes`.

## Path impor Plugin SDK

Gunakan subpath SDK yang sempit alih-alih barrel root monolitik `openclaw/plugin-sdk`
saat menulis plugin baru. Subpath inti:

| Subpath                             | Tujuan                                             |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitif pendaftaran plugin                        |
| `openclaw/plugin-sdk/channel-core`  | Pembantu entri/build channel                       |
| `openclaw/plugin-sdk/core`          | Pembantu bersama generik dan kontrak payung        |
| `openclaw/plugin-sdk/config-schema` | Skema Zod root `openclaw.json` (`OpenClawSchema`)  |

Plugin channel memilih dari keluarga seam yang sempit — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, dan `channel-actions`. Perilaku persetujuan sebaiknya dikonsolidasikan
pada satu kontrak `approvalCapability`, bukan dicampur di berbagai field
plugin yang tidak terkait. Lihat [Plugin channel](/id/plugins/sdk-channel-plugins).

Pembantu runtime dan config berada di bawah subpath `*-runtime` terfokus yang cocok
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, dll.). Utamakan `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot`, dan `config-mutation`
alih-alih barrel kompatibilitas `config-runtime` yang luas.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
facade pembantu channel kecil, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`,
dan `openclaw/plugin-sdk/infra-runtime` adalah shim kompatibilitas yang tidak digunakan lagi untuk
plugin lama. Kode baru sebaiknya mengimpor primitif generik yang lebih sempit sebagai gantinya.
</Info>

Titik masuk internal repo (per root paket plugin yang dibundel):

- `index.js` — entri plugin yang dibundel
- `api.js` — barrel pembantu/tipe
- `runtime-api.js` — barrel khusus runtime
- `setup-entry.js` — entri plugin setup

Plugin eksternal sebaiknya hanya mengimpor subpath `openclaw/plugin-sdk/*`. Jangan pernah
mengimpor `src/*` milik paket plugin lain dari core atau dari plugin lain.
Titik masuk yang dimuat facade mengutamakan snapshot config runtime aktif ketika
ada, lalu fallback ke file config yang telah di-resolve di disk.

Subpath khusus kapabilitas seperti `image-generation`, `media-understanding`,
dan `speech` ada karena plugin yang dibundel menggunakannya saat ini. Subpath tersebut tidak
otomatis menjadi kontrak eksternal jangka panjang yang dibekukan — periksa halaman
referensi SDK yang relevan saat mengandalkannya.

## Skema alat pesan

Plugin sebaiknya memiliki kontribusi skema `describeMessageTool(...)` khusus channel
untuk primitif non-pesan seperti reaksi, tanda baca, dan jajak pendapat.
Presentasi kirim bersama sebaiknya menggunakan kontrak `MessagePresentation` generik
alih-alih field tombol, komponen, blok, atau kartu native penyedia.
Lihat [Presentasi Pesan](/id/plugins/message-presentation) untuk kontrak,
aturan fallback, pemetaan penyedia, dan checklist penulis plugin.

Plugin yang mampu mengirim mendeklarasikan apa yang dapat mereka render melalui kapabilitas pesan:

- `presentation` untuk blok presentasi semantik (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` untuk permintaan pengiriman yang disematkan

Core memutuskan apakah akan merender presentasi secara native atau menurunkannya menjadi teks.
Jangan mengekspos escape hatch UI native penyedia dari alat pesan generik.
Pembantu SDK yang tidak digunakan lagi untuk skema native legacy tetap diekspor untuk plugin
pihak ketiga yang ada, tetapi plugin baru sebaiknya tidak menggunakannya.

## Resolusi target channel

Plugin channel sebaiknya memiliki semantik target khusus channel. Jaga host
outbound bersama tetap generik dan gunakan permukaan adapter messaging untuk aturan penyedia:

- `messaging.inferTargetChatType({ to })` memutuskan apakah target yang dinormalisasi
  harus diperlakukan sebagai `direct`, `group`, atau `channel` sebelum lookup direktori.
- `messaging.targetResolver.looksLikeId(raw, normalized)` memberi tahu core apakah
  input harus langsung melewati ke resolusi mirip id alih-alih pencarian direktori.
- `messaging.targetResolver.reservedLiterals` mencantumkan kata polos yang merupakan
  referensi channel/sesi untuk penyedia tersebut. Resolusi mempertahankan entri
  direktori yang dikonfigurasi sebelum menolak literal cadangan, lalu gagal tertutup pada
  lookup direktori yang luput.
- `messaging.targetResolver.resolveTarget(...)` adalah fallback plugin ketika
  core membutuhkan resolusi akhir milik penyedia setelah normalisasi atau setelah
  lookup direktori yang luput.
- `messaging.resolveOutboundSessionRoute(...)` memiliki konstruksi rute sesi
  khusus penyedia setelah target di-resolve.

Pembagian yang direkomendasikan:

- Gunakan `inferTargetChatType` untuk keputusan kategori yang sebaiknya terjadi sebelum
  mencari peer/grup.
- Gunakan `looksLikeId` untuk pemeriksaan "perlakukan ini sebagai id target eksplisit/native".
- Gunakan `resolveTarget` untuk fallback normalisasi khusus penyedia, bukan untuk
  pencarian direktori yang luas.
- Simpan id native penyedia seperti id chat, id thread, JID, handle, dan id room
  di dalam nilai `target` atau params khusus penyedia, bukan di field SDK generik.

## Direktori berbasis config

Plugin yang menurunkan entri direktori dari config sebaiknya menjaga logika tersebut di dalam
plugin dan menggunakan kembali pembantu bersama dari
`openclaw/plugin-sdk/directory-runtime`.

Gunakan ini ketika channel membutuhkan peer/grup berbasis config seperti:

- peer DM yang digerakkan allowlist
- peta channel/grup yang dikonfigurasi
- fallback direktori statis bercakupan akun

Helper bersama di `directory-runtime` hanya menangani operasi generik:

- pemfilteran kueri
- penerapan batas
- helper deduplikasi/normalisasi
- pembuatan `ChannelDirectoryEntry[]`

Inspeksi akun spesifik channel dan normalisasi id harus tetap berada di
implementasi Plugin.

## Katalog penyedia

Plugin penyedia dapat menentukan katalog model untuk inferensi dengan
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` mengembalikan bentuk yang sama dengan yang ditulis OpenClaw ke
`models.providers`:

- `{ provider }` untuk satu entri penyedia
- `{ providers }` untuk beberapa entri penyedia

Gunakan `catalog` saat Plugin memiliki id model spesifik penyedia, default URL
dasar, atau metadata model yang dibatasi autentikasi.

`catalog.order` mengontrol kapan katalog Plugin digabungkan relatif terhadap
penyedia implisit bawaan OpenClaw:

- `simple`: penyedia API-key biasa atau berbasis env
- `profile`: penyedia yang muncul saat profil autentikasi ada
- `paired`: penyedia yang menyintesis beberapa entri penyedia terkait
- `late`: lintasan terakhir, setelah penyedia implisit lainnya

Penyedia yang lebih akhir menang saat terjadi tabrakan kunci, sehingga Plugin
dapat sengaja menimpa entri penyedia bawaan dengan id penyedia yang sama.

Plugin juga dapat menerbitkan baris model baca-saja melalui
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Ini adalah jalur ke depan untuk permukaan daftar/bantuan/pemilih dan
mendukung baris `text`, `image_generation`, `video_generation`, dan
`music_generation`. Plugin penyedia tetap memiliki panggilan endpoint live,
pertukaran token, dan pemetaan respons vendor; core memiliki bentuk baris umum,
label sumber, dan pemformatan bantuan alat media. Registrasi penyedia pembuatan
media menyintesis baris katalog statis secara otomatis dari `defaultModel`,
`models`, dan `capabilities`.

Kompatibilitas:

- `discovery` masih berfungsi sebagai alias lama, tetapi mengeluarkan peringatan
  penghentian
- jika `catalog` dan `discovery` sama-sama terdaftar, OpenClaw menggunakan
  `catalog`
- `augmentModelCatalog` tidak lagi disarankan; penyedia bawaan sebaiknya
  menerbitkan baris tambahan melalui `registerModelCatalogProvider`

## Inspeksi channel baca-saja

Jika Plugin Anda mendaftarkan channel, sebaiknya implementasikan
`plugin.config.inspectAccount(cfg, accountId)` bersama `resolveAccount(...)`.

Mengapa:

- `resolveAccount(...)` adalah jalur runtime. Jalur ini boleh mengasumsikan
  kredensial sudah sepenuhnya tersedia dan dapat gagal cepat saat rahasia wajib
  tidak ada.
- Jalur perintah baca-saja seperti `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, dan alur
  doctor/perbaikan konfigurasi tidak seharusnya perlu menyiapkan kredensial
  runtime hanya untuk mendeskripsikan konfigurasi.

Perilaku `inspectAccount(...)` yang disarankan:

- Hanya kembalikan status akun deskriptif.
- Pertahankan `enabled` dan `configured`.
- Sertakan kolom sumber/status kredensial bila relevan, seperti:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Anda tidak perlu mengembalikan nilai token mentah hanya untuk melaporkan
  ketersediaan baca-saja. Mengembalikan `tokenStatus: "available"` (dan kolom
  sumber yang sesuai) sudah cukup untuk perintah bergaya status.
- Gunakan `configured_unavailable` saat kredensial dikonfigurasi melalui SecretRef
  tetapi tidak tersedia di jalur perintah saat ini.

Ini memungkinkan perintah baca-saja melaporkan "dikonfigurasi tetapi tidak
tersedia di jalur perintah ini" alih-alih crash atau salah melaporkan akun
sebagai belum dikonfigurasi.

## Paket package

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

Setiap entri menjadi Plugin. Jika pack mencantumkan beberapa ekstensi, id Plugin
menjadi `name/<fileBase>`.

Jika Plugin Anda mengimpor dependensi npm, instal dependensi tersebut di
direktori itu agar `node_modules` tersedia (`npm install` / `pnpm install`).

Batasan keamanan: setiap entri `openclaw.extensions` harus tetap berada di dalam
direktori Plugin setelah resolusi symlink. Entri yang keluar dari direktori
package akan ditolak.

Catatan keamanan: `openclaw plugins install` menginstal dependensi Plugin dengan
`npm install --omit=dev --ignore-scripts` lokal proyek (tanpa skrip siklus hidup,
tanpa dependensi dev saat runtime), mengabaikan pengaturan npm install global yang diwarisi.
Jaga pohon dependensi Plugin tetap "JS/TS murni" dan hindari paket yang memerlukan
build `postinstall`.

Opsional: `openclaw.setupEntry` dapat menunjuk ke modul ringan khusus penyiapan.
Ketika OpenClaw memerlukan permukaan penyiapan untuk Plugin kanal yang dinonaktifkan, atau
ketika Plugin kanal diaktifkan tetapi masih belum dikonfigurasi, OpenClaw memuat `setupEntry`
alih-alih entri Plugin penuh. Ini membuat startup dan penyiapan lebih ringan
ketika entri Plugin utama Anda juga merangkai alat, hook, atau kode lain yang
hanya digunakan saat runtime.

Opsional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
dapat mengikutsertakan Plugin kanal ke jalur `setupEntry` yang sama selama fase
startup pra-dengar Gateway, bahkan ketika kanal sudah dikonfigurasi.

Gunakan ini hanya ketika `setupEntry` sepenuhnya mencakup permukaan startup yang harus ada
sebelum Gateway mulai mendengarkan. Dalam praktiknya, ini berarti entri penyiapan
harus mendaftarkan setiap kapabilitas milik kanal yang bergantung pada startup, seperti:

- pendaftaran kanal itu sendiri
- rute HTTP apa pun yang harus tersedia sebelum Gateway mulai mendengarkan
- metode, alat, atau layanan Gateway apa pun yang harus ada selama jendela yang sama

Jika entri penuh Anda masih memiliki kapabilitas startup wajib apa pun, jangan aktifkan
flag ini. Pertahankan Plugin pada perilaku default dan biarkan OpenClaw memuat
entri penuh selama startup.

Kanal yang dibundel juga dapat menerbitkan helper permukaan kontrak khusus penyiapan yang dapat
dikonsultasikan inti sebelum runtime kanal penuh dimuat. Permukaan promosi
penyiapan saat ini adalah:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Inti menggunakan permukaan itu ketika perlu mempromosikan konfigurasi kanal
akun tunggal lama ke `channels.<id>.accounts.*` tanpa memuat entri Plugin penuh.
Matrix adalah contoh bundel saat ini: Matrix hanya memindahkan kunci auth/bootstrap ke
akun bernama yang dipromosikan ketika akun bernama sudah ada, dan dapat mempertahankan
kunci akun default non-kanonis yang dikonfigurasi alih-alih selalu membuat
`accounts.default`.

Adapter patch penyiapan tersebut menjaga penemuan permukaan kontrak bundel tetap malas. Waktu
impor tetap ringan; permukaan promosi dimuat hanya saat pertama kali digunakan, alih-alih
memasuki ulang startup kanal bundel saat impor modul.

Ketika permukaan startup tersebut mencakup metode RPC Gateway, pertahankan dengan
prefiks khusus Plugin. Namespace admin inti (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu diselesaikan
ke `operator.admin`, bahkan jika Plugin meminta cakupan yang lebih sempit.

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

Field `openclaw.channel` yang berguna di luar contoh minimal:

- `detailLabel`: label sekunder untuk permukaan katalog/status yang lebih kaya
- `docsLabel`: timpa teks tautan untuk tautan docs
- `preferOver`: id Plugin/kanal berprioritas lebih rendah yang harus dikalahkan entri katalog ini
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrol salinan permukaan pemilihan
- `markdownCapable`: menandai kanal sebagai mampu markdown untuk keputusan pemformatan keluar
- `exposure.configured`: sembunyikan kanal dari permukaan daftar kanal yang dikonfigurasi ketika disetel ke `false`
- `exposure.setup`: sembunyikan kanal dari pemilih penyiapan/konfigurasi interaktif ketika disetel ke `false`
- `exposure.docs`: tandai kanal sebagai internal/privat untuk permukaan navigasi docs
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

Entri katalog kanal yang dihasilkan dan entri katalog instal penyedia mengekspos
fakta sumber instal yang dinormalisasi di samping blok mentah `openclaw.install`. Fakta
yang dinormalisasi mengidentifikasi apakah spesifikasi npm adalah versi persis atau selektor
mengambang, apakah metadata integritas yang diharapkan tersedia, dan apakah jalur sumber
lokal juga tersedia. Ketika identitas katalog/paket diketahui, fakta yang
dinormalisasi memperingatkan jika nama paket npm yang diurai menyimpang dari identitas tersebut.
Fakta tersebut juga memperingatkan ketika `defaultChoice` tidak valid atau menunjuk ke sumber yang
tidak tersedia, dan ketika metadata integritas npm tersedia tanpa sumber npm yang valid.
Konsumen harus memperlakukan `installSource` sebagai field opsional aditif sehingga
entri buatan tangan dan shim katalog tidak harus menyintesisnya.
Ini memungkinkan onboarding dan diagnostik menjelaskan status bidang sumber tanpa
mengimpor runtime Plugin.

Entri npm eksternal resmi sebaiknya mengutamakan `npmSpec` persis plus
`expectedIntegrity`. Nama paket polos dan dist-tag masih berfungsi untuk
kompatibilitas, tetapi memunculkan peringatan bidang sumber sehingga katalog dapat bergerak
menuju instal yang dipin dan diperiksa integritasnya tanpa merusak Plugin yang ada.
Ketika onboarding menginstal dari jalur katalog lokal, onboarding mencatat entri indeks
Plugin terkelola dengan `source: "path"` dan `sourcePath` relatif workspace
bila memungkinkan. Jalur pemuatan operasional absolut tetap berada di
`plugins.load.paths`; catatan instal menghindari duplikasi jalur workstation lokal
ke dalam konfigurasi berumur panjang. Ini membuat instal pengembangan lokal tetap terlihat oleh
diagnostik bidang sumber tanpa menambahkan permukaan pengungkapan jalur sistem file mentah kedua.
Baris SQLite `installed_plugin_index` yang dipersisten adalah sumber kebenaran instal
dan dapat disegarkan tanpa memuat modul runtime Plugin.
Map `installRecords` miliknya tahan lama bahkan ketika manifes Plugin hilang atau
tidak valid; payload `plugins` miliknya adalah tampilan manifes yang dapat dibangun ulang.

## Plugin mesin konteks

Plugin mesin konteks memiliki orkestrasi konteks sesi untuk ingest, perakitan,
dan Compaction. Daftarkan dari Plugin Anda dengan
`api.registerContextEngine(id, factory)`, lalu pilih mesin aktif dengan
`plugins.slots.contextEngine`.

Gunakan ini ketika Plugin Anda perlu mengganti atau memperluas pipeline konteks
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
untuk inisialisasi waktu konstruksi.

`assemble()` dapat mengembalikan `contextProjection` ketika harness aktif memiliki
thread backend persisten. Hilangkan untuk proyeksi per giliran lama. Kembalikan
`{ mode: "thread_bootstrap", epoch }` ketika konteks yang dirakit harus
disuntikkan sekali ke thread backend dan digunakan ulang sampai epoch berubah. Ubah
epoch setelah konteks semantik mesin berubah, seperti setelah pass Compaction
milik mesin. Host dapat mempertahankan metadata panggilan alat, bentuk input,
dan hasil alat yang telah direda dalam proyeksi thread-bootstrap agar thread
backend baru mempertahankan kontinuitas alat tanpa menyalin payload mentah yang
mengandung rahasia.

Jika mesin Anda **tidak** memiliki algoritma Compaction, tetap implementasikan `compact()`
dan delegasikan secara eksplisit:

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

Ketika Plugin memerlukan perilaku yang tidak cocok dengan API saat ini, jangan melewati
sistem Plugin dengan akses privat ke dalam. Tambahkan kapabilitas yang hilang.

Urutan yang direkomendasikan:

1. definisikan kontrak inti
   Tentukan perilaku bersama apa yang harus dimiliki inti: kebijakan, fallback, penggabungan konfigurasi,
   siklus hidup, semantik yang berhadapan dengan kanal, dan bentuk helper runtime.
2. tambahkan permukaan pendaftaran/runtime Plugin bertipe
   Perluas `OpenClawPluginApi` dan/atau `api.runtime` dengan permukaan
   kapabilitas bertipe paling kecil yang berguna.
3. rangkai konsumen inti + kanal/fitur
   Kanal dan Plugin fitur harus mengonsumsi kapabilitas baru melalui inti,
   bukan dengan mengimpor implementasi vendor secara langsung.
4. daftarkan implementasi vendor
   Plugin vendor kemudian mendaftarkan backend mereka terhadap kapabilitas tersebut.
5. tambahkan cakupan kontrak
   Tambahkan tes agar kepemilikan dan bentuk pendaftaran tetap eksplisit seiring waktu.

Beginilah cara OpenClaw tetap berpendirian tanpa menjadi hardcoded ke pandangan dunia
satu penyedia. Lihat [Buku Masak Kapabilitas](/id/plugins/adding-capabilities)
untuk checklist file konkret dan contoh yang dikerjakan.

### Checklist kapabilitas

Ketika Anda menambahkan kapabilitas baru, implementasinya biasanya harus menyentuh
permukaan berikut secara bersamaan:

- tipe kontrak inti di `src/<capability>/types.ts`
- helper runner/runtime inti di `src/<capability>/runtime.ts`
- permukaan pendaftaran API Plugin di `src/plugins/types.ts`
- perangkaian registry Plugin di `src/plugins/registry.ts`
- eksposur runtime Plugin di `src/plugins/runtime/*` ketika Plugin fitur/kanal
  perlu mengonsumsinya
- helper capture/test di `src/test-utils/plugin-registration.ts`
- asersi kepemilikan/kontrak di `src/plugins/contracts/registry.ts`
- docs operator/Plugin di `docs/`

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

- core memiliki kontrak kapabilitas + orkestrasi
- Plugin vendor memiliki implementasi vendor
- Plugin fitur/channel menggunakan helper runtime
- pengujian kontrak menjaga kepemilikan tetap eksplisit

## Terkait

- [Arsitektur Plugin](/id/plugins/architecture) — model dan bentuk kapabilitas publik
- [Subpath SDK Plugin](/id/plugins/sdk-subpaths)
- [Penyiapan SDK Plugin](/id/plugins/sdk-setup)
- [Membangun Plugin](/id/plugins/building-plugins)

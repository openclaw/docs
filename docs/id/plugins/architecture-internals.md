---
read_when:
    - Mengimplementasikan hook runtime penyedia, siklus hidup saluran, atau paket kemasan
    - Men-debug urutan pemuatan Plugin atau status registri
    - Menambahkan kapabilitas Plugin baru atau Plugin mesin konteks
summary: 'Internal arsitektur Plugin: alur pemuatan, registri, kait runtime, rute HTTP, dan tabel referensi'
title: Internal arsitektur Plugin
x-i18n:
    generated_at: "2026-05-02T20:47:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: fec593518e51f68ce617d5bc4e55cede2188e9247f863364a9ea956e50ca2675
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Untuk model kemampuan publik, bentuk Plugin, dan kontrak kepemilikan/eksekusi,
lihat [Arsitektur Plugin](/id/plugins/architecture). Halaman ini adalah
referensi untuk mekanisme internal: pipeline pemuatan, registry, hook runtime,
rute HTTP Gateway, jalur impor, dan tabel skema.

## Pipeline pemuatan

Saat startup, OpenClaw kurang lebih melakukan ini:

1. menemukan root Plugin kandidat
2. membaca manifes bundle native atau kompatibel dan metadata paket
3. menolak kandidat yang tidak aman
4. menormalkan konfigurasi Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. memutuskan aktivasi untuk setiap kandidat
6. memuat modul native yang diaktifkan: modul bundle bawaan menggunakan pemuat native;
   sumber lokal TypeScript pihak ketiga menggunakan fallback darurat Jiti
7. memanggil hook native `register(api)` dan mengumpulkan registrasi ke registry Plugin
8. mengekspos registry ke perintah/permukaan runtime

<Note>
`activate` adalah alias lama untuk `register` — pemuat menyelesaikan mana pun yang tersedia (`def.register ?? def.activate`) dan memanggilnya pada titik yang sama. Semua Plugin bawaan menggunakan `register`; utamakan `register` untuk Plugin baru.
</Note>

Gerbang keamanan terjadi **sebelum** eksekusi runtime. Kandidat diblokir
ketika entri keluar dari root Plugin, jalurnya dapat ditulis oleh semua pengguna,
atau kepemilikan jalur tampak mencurigakan untuk Plugin non-bawaan.

### Perilaku manifest-first

Manifes adalah sumber kebenaran control-plane. OpenClaw menggunakannya untuk:

- mengidentifikasi Plugin
- menemukan channel/skills/skema konfigurasi yang dideklarasikan atau kemampuan bundle
- memvalidasi `plugins.entries.<id>.config`
- memperkaya label/placeholder Control UI
- menampilkan metadata instalasi/katalog
- mempertahankan deskriptor aktivasi dan penyiapan yang murah tanpa memuat runtime Plugin

Untuk Plugin native, modul runtime adalah bagian data-plane. Modul ini mendaftarkan
perilaku aktual seperti hook, alat, perintah, atau alur provider.

Blok manifes opsional `activation` dan `setup` tetap berada di control plane.
Keduanya adalah deskriptor khusus metadata untuk perencanaan aktivasi dan penemuan penyiapan;
keduanya tidak menggantikan registrasi runtime, `register(...)`, atau `setupEntry`.
Konsumen aktivasi live pertama sekarang menggunakan petunjuk perintah, channel, dan provider manifes
untuk mempersempit pemuatan Plugin sebelum materialisasi registry yang lebih luas:

- pemuatan CLI dipersempit ke Plugin yang memiliki perintah utama yang diminta
- resolusi penyiapan channel/Plugin dipersempit ke Plugin yang memiliki
  id channel yang diminta
- resolusi penyiapan/runtime provider eksplisit dipersempit ke Plugin yang memiliki
  id provider yang diminta
- perencanaan startup Gateway menggunakan `activation.onStartup` untuk impor startup
  eksplisit dan opt-out startup; Plugin tanpa metadata startup hanya dimuat
  melalui pemicu aktivasi yang lebih sempit

Preload runtime saat permintaan yang meminta cakupan luas `all` tetap menurunkan
kumpulan id Plugin efektif eksplisit dari konfigurasi, perencanaan startup, channel
yang dikonfigurasi, slot, dan aturan aktif otomatis. Jika kumpulan turunan itu kosong,
OpenClaw memuat registry runtime kosong alih-alih melebar ke setiap Plugin
yang dapat ditemukan.

Perencana aktivasi mengekspos API khusus id untuk pemanggil yang ada dan API
rencana untuk diagnostik baru. Entri rencana melaporkan mengapa Plugin dipilih,
memisahkan petunjuk perencana `activation.*` eksplisit dari fallback kepemilikan
manifes seperti `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, dan hook. Pemisahan alasan itu adalah batas kompatibilitas:
metadata Plugin yang ada tetap berfungsi, sementara kode baru dapat mendeteksi
petunjuk luas atau perilaku fallback tanpa mengubah semantik pemuatan runtime.

Penemuan penyiapan sekarang mengutamakan id milik deskriptor seperti `setup.providers` dan
`setup.cliBackends` untuk mempersempit Plugin kandidat sebelum fallback ke
`setup-api` untuk Plugin yang masih membutuhkan hook runtime saat penyiapan. Daftar
penyiapan provider menggunakan `providerAuthChoices` manifes, pilihan penyiapan
turunan deskriptor, dan metadata katalog instalasi tanpa memuat runtime provider. `setup.requiresRuntime: false` eksplisit adalah batas khusus deskriptor; `requiresRuntime` yang dihilangkan mempertahankan fallback setup-api lama untuk kompatibilitas. Jika lebih
dari satu Plugin yang ditemukan mengklaim id provider penyiapan atau backend CLI
ternormalisasi yang sama, pencarian penyiapan menolak pemilik ambigu alih-alih
mengandalkan urutan penemuan. Ketika runtime penyiapan benar-benar dieksekusi,
diagnostik registry melaporkan drift antara `setup.providers` / `setup.cliBackends`
dan provider atau backend CLI yang didaftarkan oleh setup-api tanpa memblokir Plugin lama.

### Batas cache Plugin

OpenClaw tidak menyimpan cache hasil penemuan Plugin atau data registry manifes langsung
di balik jendela wall-clock. Instalasi, edit manifes, dan perubahan jalur pemuatan
harus terlihat pada pembacaan metadata eksplisit berikutnya atau rebuild snapshot.
Parser berkas manifes dapat mempertahankan cache tanda tangan berkas terbatas yang dikunci oleh
jalur manifes yang dibuka, inode, ukuran, dan timestamp; cache itu hanya menghindari
parsing ulang byte yang tidak berubah dan tidak boleh menyimpan cache untuk jawaban
penemuan, registry, pemilik, atau kebijakan.

Jalur cepat metadata yang aman adalah kepemilikan objek eksplisit, bukan cache tersembunyi.
Jalur panas startup Gateway harus meneruskan `PluginMetadataSnapshot` saat ini,
`PluginLookUpTable` turunan, atau registry manifes eksplisit melalui rantai panggilan.
Validasi konfigurasi, aktif otomatis startup, bootstrap Plugin, dan pemilihan provider
dapat menggunakan kembali objek tersebut selama objek itu merepresentasikan konfigurasi dan
inventaris Plugin saat ini. Pencarian penyiapan tetap merekonstruksi metadata manifes sesuai kebutuhan
kecuali jalur penyiapan spesifik menerima registry manifes eksplisit; pertahankan itu
sebagai fallback jalur dingin alih-alih menambahkan cache pencarian tersembunyi. Ketika input
berubah, rebuild dan ganti snapshot alih-alih memutasinya atau mempertahankan
salinan historis.
View atas registry Plugin aktif dan helper bootstrap channel bawaan
harus dihitung ulang dari registry/root saat ini. Map berumur pendek boleh digunakan
di dalam satu panggilan untuk mendeduplikasi pekerjaan atau menjaga reentry; map itu tidak boleh menjadi cache
metadata proses.

Untuk pemuatan Plugin, lapisan cache persisten adalah pemuatan runtime. Lapisan ini dapat menggunakan kembali
status pemuat ketika kode atau artefak terinstal benar-benar dimuat, seperti:

- `PluginLoaderCacheState` dan registry runtime aktif yang kompatibel
- cache jiti/modul dan cache pemuat permukaan publik yang digunakan untuk menghindari impor
  permukaan runtime yang sama berulang kali
- cache filesystem untuk artefak Plugin terinstal
- map per panggilan berumur pendek untuk normalisasi jalur atau resolusi duplikat

Cache tersebut adalah detail implementasi data-plane. Cache tersebut tidak boleh menjawab
pertanyaan control-plane seperti "Plugin mana yang memiliki provider ini?" kecuali
pemanggil sengaja meminta pemuatan runtime.

Jangan tambahkan cache persisten atau wall-clock untuk:

- hasil penemuan
- registry manifes langsung
- registry manifes yang direkonstruksi dari indeks Plugin terinstal
- pencarian pemilik provider, penekanan model, kebijakan provider, atau metadata
  artefak publik
- jawaban turunan manifes lain apa pun ketika perubahan manifes, indeks terinstal,
  atau jalur pemuatan harus terlihat pada pembacaan metadata berikutnya

Pemanggil yang membangun ulang metadata manifes dari indeks Plugin terinstal yang dipersistenkan
merekonstruksi registry itu sesuai kebutuhan. Indeks terinstal adalah state source-plane
durabel; itu bukan cache metadata dalam proses yang tersembunyi.

## Model registry

Plugin yang dimuat tidak langsung memutasi global core secara acak. Plugin mendaftar ke
registry Plugin pusat.

Registry melacak:

- rekaman Plugin (identitas, sumber, asal, status, diagnostik)
- alat
- hook lama dan hook bertipe
- channel
- provider
- handler RPC Gateway
- rute HTTP
- registrar CLI
- layanan latar belakang
- perintah milik Plugin

Fitur core kemudian membaca dari registry itu alih-alih berbicara langsung ke modul
Plugin. Ini menjaga pemuatan tetap satu arah:

- modul Plugin -> registrasi registry
- runtime core -> konsumsi registry

Pemisahan itu penting untuk pemeliharaan. Artinya sebagian besar permukaan core hanya
membutuhkan satu titik integrasi: "baca registry", bukan "tangani setiap modul Plugin secara khusus".

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

Callback ini hanya notifikasi. Callback ini tidak mengubah siapa yang diizinkan untuk mengikat
percakapan, dan berjalan setelah penanganan approval core selesai.

## Hook runtime provider

Plugin provider memiliki tiga lapisan:

- **Metadata manifes** untuk pencarian pre-runtime yang murah:
  `setup.providers[].envVars`, kompatibilitas usang `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices`, dan `channelEnvVars`.
- **Hook saat konfigurasi**: `catalog` (`discovery` lama) plus
  `applyConfigDefaults`.
- **Hook runtime**: 40+ hook opsional yang mencakup auth, resolusi model,
  pembungkus stream, level thinking, kebijakan replay, dan endpoint penggunaan. Lihat
  daftar lengkap di [Urutan dan penggunaan hook](#hook-order-and-usage).

OpenClaw tetap memiliki loop agen generik, failover, penanganan transkrip, dan
kebijakan alat. Hook ini adalah permukaan ekstensi untuk perilaku khusus provider
tanpa membutuhkan transport inferensi kustom penuh.

Gunakan manifes `setup.providers[].envVars` ketika provider memiliki kredensial berbasis env
yang harus dilihat jalur auth/status/pemilih model generik tanpa
memuat runtime Plugin. `providerAuthEnvVars` yang usang masih dibaca oleh
adapter kompatibilitas selama jendela deprecation, dan Plugin non-bawaan
yang menggunakannya menerima diagnostik manifes. Gunakan manifes `providerAuthAliases`
ketika satu id provider harus menggunakan ulang env vars, profil auth,
auth berbasis konfigurasi, dan pilihan onboarding API-key dari id provider lain. Gunakan manifes
`providerAuthChoices` ketika permukaan CLI onboarding/pilihan-auth harus mengetahui
id pilihan provider, label grup, dan wiring auth satu-flag sederhana tanpa
memuat runtime provider. Pertahankan `envVars` runtime provider untuk petunjuk
yang ditujukan bagi operator seperti label onboarding atau variabel penyiapan OAuth
client-id/client-secret.

Gunakan manifes `channelEnvVars` ketika sebuah channel memiliki auth atau penyiapan berbasis env yang
harus dilihat oleh fallback shell-env generik, pemeriksaan konfigurasi/status, atau prompt penyiapan
tanpa memuat runtime channel.

### Urutan dan penggunaan hook

Untuk Plugin model/provider, OpenClaw memanggil hook dalam urutan kasar ini.
Kolom "Kapan digunakan" adalah panduan keputusan cepat.
Field provider khusus kompatibilitas yang tidak lagi dipanggil OpenClaw, seperti
`ProviderPlugin.capabilities` dan `suppressBuiltInModel`, sengaja tidak
dicantumkan di sini.

| #   | Kait                              | Apa fungsinya                                                                                                   | Kapan digunakan                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Menerbitkan konfigurasi penyedia ke `models.providers` saat pembuatan `models.json`                                | Penyedia memiliki katalog atau bawaan URL dasar                                                                                                  |
| 2   | `applyConfigDefaults`             | Menerapkan bawaan konfigurasi global milik penyedia saat materialisasi konfigurasi                                      | Bawaan bergantung pada mode autentikasi, env, atau semantik keluarga model penyedia                                                                         |
| --  | _(pencarian model bawaan)_         | OpenClaw mencoba jalur registri/katalog normal terlebih dahulu                                                          | _(bukan kait Plugin)_                                                                                                                         |
| 3   | `normalizeModelId`                | Menormalkan alias ID model lama atau pratinjau sebelum pencarian                                                     | Penyedia memiliki pembersihan alias sebelum resolusi model kanonis                                                                                 |
| 4   | `normalizeTransport`              | Menormalkan `api` / `baseUrl` keluarga penyedia sebelum perakitan model generik                                      | Penyedia memiliki pembersihan transport untuk ID penyedia kustom dalam keluarga transport yang sama                                                          |
| 5   | `normalizeConfig`                 | Menormalkan `models.providers.<id>` sebelum resolusi waktu jalan/penyedia                                           | Penyedia memerlukan pembersihan konfigurasi yang seharusnya berada bersama Plugin; pembantu keluarga Google bawaan juga mencadangkan entri konfigurasi Google yang didukung   |
| 6   | `applyNativeStreamingUsageCompat` | Menerapkan penulisan ulang kompatibilitas penggunaan streaming native ke penyedia konfigurasi                                               | Penyedia memerlukan perbaikan metadata penggunaan streaming native berbasis endpoint                                                                          |
| 7   | `resolveConfigApiKey`             | Menyelesaikan autentikasi penanda env untuk penyedia konfigurasi sebelum pemuatan autentikasi waktu jalan                                       | Penyedia memiliki resolusi kunci API penanda env milik penyedia; `amazon-bedrock` juga memiliki resolver penanda env AWS bawaan di sini                  |
| 8   | `resolveSyntheticAuth`            | Memunculkan autentikasi lokal/dihosting sendiri atau berbasis konfigurasi tanpa menyimpan teks polos                                   | Penyedia dapat beroperasi dengan penanda kredensial sintetis/lokal                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | Menimpa profil autentikasi eksternal milik penyedia; bawaan `persistence` adalah `runtime-only` untuk kredensial milik CLI/aplikasi | Penyedia menggunakan ulang kredensial autentikasi eksternal tanpa menyimpan token refresh yang disalin; deklarasikan `contracts.externalAuthProviders` di manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Menurunkan prioritas placeholder profil sintetis tersimpan di belakang autentikasi berbasis env/konfigurasi                                      | Penyedia menyimpan profil placeholder sintetis yang tidak boleh menang prioritas                                                                 |
| 11  | `resolveDynamicModel`             | Fallback sinkron untuk ID model milik penyedia yang belum ada di registri lokal                                       | Penyedia menerima ID model upstream arbitrer                                                                                                 |
| 12  | `prepareDynamicModel`             | Pemanasan asinkron, lalu `resolveDynamicModel` dijalankan lagi                                                           | Penyedia memerlukan metadata jaringan sebelum menyelesaikan ID yang tidak dikenal                                                                                  |
| 13  | `normalizeResolvedModel`          | Penulisan ulang akhir sebelum runner tertanam menggunakan model yang telah diselesaikan                                               | Penyedia memerlukan penulisan ulang transport tetapi tetap menggunakan transport inti                                                                             |
| 14  | `contributeResolvedModelCompat`   | Menyumbangkan flag kompatibilitas untuk model vendor di balik transport kompatibel lain                                  | Penyedia mengenali modelnya sendiri pada transport proksi tanpa mengambil alih penyedia                                                       |
| 15  | `normalizeToolSchemas`            | Menormalkan skema alat sebelum dilihat oleh runner tertanam                                                    | Penyedia memerlukan pembersihan skema keluarga transport                                                                                                |
| 16  | `inspectToolSchemas`              | Memunculkan diagnostik skema milik penyedia setelah normalisasi                                                  | Penyedia menginginkan peringatan kata kunci tanpa mengajarkan aturan khusus penyedia ke inti                                                                 |
| 17  | `resolveReasoningOutputMode`      | Memilih kontrak keluaran penalaran native vs bertag                                                              | Penyedia memerlukan keluaran penalaran/akhir bertag alih-alih bidang native                                                                         |
| 18  | `prepareExtraParams`              | Normalisasi parameter permintaan sebelum wrapper opsi stream generik                                              | Penyedia memerlukan parameter permintaan bawaan atau pembersihan parameter per penyedia                                                                           |
| 19  | `createStreamFn`                  | Mengganti sepenuhnya jalur stream normal dengan transport kustom                                                   | Penyedia memerlukan protokol kabel kustom, bukan sekadar wrapper                                                                                     |
| 20  | `wrapStreamFn`                    | Wrapper stream setelah wrapper generik diterapkan                                                              | Penyedia memerlukan header permintaan/body/wrapper kompatibilitas model tanpa transport kustom                                                          |
| 21  | `resolveTransportTurnState`       | Melampirkan header transport native per giliran atau metadata                                                           | Penyedia ingin transport generik mengirim identitas giliran native penyedia                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | Melampirkan header WebSocket native atau kebijakan jeda sesi                                                    | Penyedia ingin transport WS generik menyesuaikan header sesi atau kebijakan fallback                                                               |
| 23  | `formatApiKey`                    | Pemformat profil autentikasi: profil tersimpan menjadi string `apiKey` waktu jalan                                     | Penyedia menyimpan metadata autentikasi tambahan dan memerlukan bentuk token waktu jalan kustom                                                                    |
| 24  | `refreshOAuth`                    | Override refresh OAuth untuk endpoint refresh kustom atau kebijakan kegagalan refresh                                  | Penyedia tidak cocok dengan refresher `pi-ai` bersama                                                                                           |
| 25  | `buildAuthDoctorHint`             | Petunjuk perbaikan yang ditambahkan saat refresh OAuth gagal                                                                  | Penyedia memerlukan panduan perbaikan autentikasi milik penyedia setelah kegagalan refresh                                                                      |
| 26  | `matchesContextOverflowError`     | Pencocok overflow jendela konteks milik penyedia                                                                 | Penyedia memiliki error overflow mentah yang akan terlewat oleh heuristik generik                                                                                |
| 27  | `classifyFailoverReason`          | Klasifikasi alasan failover milik penyedia                                                                  | Penyedia dapat memetakan error API/transport mentah ke batas laju/kelebihan beban/dll.                                                                          |
| 28  | `isCacheTtlEligible`              | Kebijakan cache prompt untuk penyedia proksi/backhaul                                                               | Penyedia memerlukan pembatasan TTL cache khusus proksi                                                                                                |
| 29  | `buildMissingAuthMessage`         | Pengganti pesan pemulihan autentikasi hilang yang generik                                                      | Penyedia memerlukan petunjuk pemulihan autentikasi hilang khusus penyedia                                                                                 |
| 30  | `augmentModelCatalog`             | Baris katalog sintetis/akhir yang ditambahkan setelah penemuan                                                          | Penyedia memerlukan baris kompatibilitas maju sintetis di `models list` dan pemilih                                                                     |
| 31  | `resolveThinkingProfile`          | Set tingkat `/think` khusus model, label tampilan, dan bawaan                                                 | Penyedia mengekspos tangga berpikir kustom atau label biner untuk model terpilih                                                                 |
| 32  | `isBinaryThinking`                | Kait kompatibilitas toggle penalaran aktif/nonaktif                                                                     | Penyedia hanya mengekspos berpikir biner aktif/nonaktif                                                                                                  |
| 33  | `supportsXHighThinking`           | Kait kompatibilitas dukungan penalaran `xhigh`                                                                   | Penyedia menginginkan `xhigh` hanya pada subset model                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | Kait kompatibilitas tingkat `/think` bawaan                                                                      | Penyedia memiliki kebijakan `/think` bawaan untuk keluarga model                                                                                      |
| 35  | `isModernModelRef`                | Pencocok model modern untuk filter profil live dan pilihan smoke                                              | Penyedia memiliki pencocokan model pilihan live/smoke                                                                                             |
| 36  | `prepareRuntimeAuth`              | Menukar kredensial yang dikonfigurasi menjadi token/kunci waktu jalan aktual tepat sebelum inferensi                       | Penyedia memerlukan pertukaran token atau kredensial permintaan berumur pendek                                                                             |
| 37  | `resolveUsageAuth`                | Selesaikan kredensial penggunaan/penagihan untuk `/usage` dan permukaan status terkait                                     | Penyedia memerlukan penguraian token penggunaan/kuota khusus atau kredensial penggunaan yang berbeda                                                               |
| 38  | `fetchUsageSnapshot`              | Ambil dan normalkan snapshot penggunaan/kuota spesifik penyedia setelah autentikasi diselesaikan                             | Penyedia memerlukan endpoint penggunaan spesifik penyedia atau pengurai muatan                                                                           |
| 39  | `createEmbeddingProvider`         | Bangun adaptor penyematan milik penyedia untuk memori/pencarian                                                     | Perilaku penyematan memori berada pada Plugin penyedia                                                                                    |
| 40  | `buildReplayPolicy`               | Kembalikan kebijakan replay yang mengontrol penanganan transkrip untuk penyedia                                        | Penyedia memerlukan kebijakan transkrip khusus (misalnya, penghapusan blok berpikir)                                                               |
| 41  | `sanitizeReplayHistory`           | Tulis ulang riwayat replay setelah pembersihan transkrip generik                                                        | Penyedia memerlukan penulisan ulang replay spesifik penyedia di luar helper compaction bersama                                                             |
| 42  | `validateReplayTurns`             | Validasi atau pembentukan ulang giliran replay final sebelum runner tertanam                                           | Transport penyedia memerlukan validasi giliran yang lebih ketat setelah sanitasi generik                                                                    |
| 43  | `onModelSelected`                 | Jalankan efek samping pascapemilihan milik penyedia                                                                 | Penyedia memerlukan telemetri atau status milik penyedia saat sebuah model menjadi aktif                                                                  |

`normalizeModelId`, `normalizeTransport`, dan `normalizeConfig` pertama-tama memeriksa
Plugin penyedia yang cocok, lalu melanjutkan ke Plugin penyedia lain yang
mendukung hook hingga ada yang benar-benar mengubah ID model atau transportasi/konfigurasi.
Ini menjaga shim penyedia alias/kompatibilitas tetap berfungsi tanpa mengharuskan
pemanggil mengetahui Plugin bawaan mana yang memiliki penulisan ulang tersebut. Jika
tidak ada hook penyedia yang menulis ulang entri konfigurasi keluarga Google yang
didukung, penormal konfigurasi Google bawaan tetap menerapkan pembersihan
kompatibilitas tersebut.

Jika penyedia membutuhkan protokol wire yang sepenuhnya khusus atau eksekutor
permintaan khusus, itu adalah kelas ekstensi yang berbeda. Hook ini ditujukan untuk
perilaku penyedia yang tetap berjalan pada loop inferensi normal OpenClaw.

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

Plugin penyedia bawaan menggabungkan hook di atas agar sesuai dengan kebutuhan
katalog, autentikasi, thinking, replay, dan penggunaan setiap vendor. Kumpulan hook
otoritatif berada bersama setiap Plugin di bawah `extensions/`; halaman ini
mengilustrasikan bentuknya, bukan mencerminkan daftar tersebut.

<AccordionGroup>
  <Accordion title="Penyedia katalog pass-through">
    OpenRouter, Kilocode, Z.AI, xAI mendaftarkan `catalog` plus
    `resolveDynamicModel` / `prepareDynamicModel` sehingga mereka dapat menampilkan
    ID model upstream sebelum katalog statis OpenClaw.
  </Accordion>
  <Accordion title="Penyedia endpoint OAuth dan penggunaan">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai memasangkan
    `prepareRuntimeAuth` atau `formatApiKey` dengan `resolveUsageAuth` +
    `fetchUsageSnapshot` untuk memiliki pertukaran token dan integrasi `/usage`.
  </Accordion>
  <Accordion title="Keluarga pembersihan replay dan transkrip">
    Keluarga bernama bersama (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) memungkinkan penyedia ikut
    ke kebijakan transkrip melalui `buildReplayPolicy`, alih-alih setiap Plugin
    mengimplementasikan ulang pembersihan.
  </Accordion>
  <Accordion title="Penyedia hanya katalog">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway`, dan
    `volcengine` hanya mendaftarkan `catalog` dan menggunakan loop inferensi bersama.
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
- Menggunakan konfigurasi `messages.tts` core dan pemilihan penyedia.
- Mengembalikan buffer audio PCM + sample rate. Plugin harus melakukan resample/encode untuk penyedia.
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

- Pertahankan kebijakan TTS, fallback, dan pengiriman balasan di core.
- Gunakan penyedia speech untuk perilaku sintesis milik vendor.
- Input lama Microsoft `edge` dinormalisasi ke ID penyedia `microsoft`.
- Model kepemilikan yang disukai berorientasi perusahaan: satu Plugin vendor dapat
  memiliki penyedia teks, speech, gambar, dan media masa depan saat OpenClaw menambahkan
  kontrak kapabilitas tersebut.

Untuk pemahaman gambar/audio/video, Plugin mendaftarkan satu penyedia
pemahaman media bertipe, bukan bag key/value generik:

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

- Pertahankan orkestrasi, fallback, konfigurasi, dan wiring channel di core.
- Pertahankan perilaku vendor di Plugin penyedia.
- Ekspansi aditif harus tetap bertipe: metode opsional baru, field hasil opsional baru,
  kapabilitas opsional baru.
- Pembuatan video sudah mengikuti pola yang sama:
  - core memiliki kontrak kapabilitas dan helper runtime
  - Plugin vendor mendaftarkan `api.registerVideoGenerationProvider(...)`
  - Plugin fitur/channel memakai `api.runtime.videoGeneration.*`

Untuk helper runtime pemahaman media, Plugin dapat memanggil:

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

Untuk transkripsi audio, Plugin dapat menggunakan runtime pemahaman media
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
- Menggunakan konfigurasi audio pemahaman media core (`tools.media.audio`) dan urutan fallback penyedia.
- Mengembalikan `{ text: undefined }` saat tidak ada keluaran transkripsi yang dihasilkan (misalnya input dilewati/tidak didukung).
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
- Untuk eksekusi fallback milik Plugin, operator harus ikut serta dengan `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Gunakan `plugins.entries.<id>.subagent.allowedModels` untuk membatasi Plugin tepercaya ke target kanonis `provider/model` tertentu, atau `"*"` untuk mengizinkan target apa pun secara eksplisit.
- Eksekusi subagent Plugin yang tidak tepercaya tetap berfungsi, tetapi permintaan override ditolak, bukan diam-diam memakai fallback.
- Sesi subagent yang dibuat Plugin ditandai dengan ID Plugin pembuatnya. Fallback `api.runtime.subagent.deleteSession(...)` hanya boleh menghapus sesi milik tersebut; penghapusan sesi arbitrer tetap memerlukan permintaan Gateway dengan cakupan admin.

Untuk pencarian web, Plugin dapat memakai helper runtime bersama, bukan
masuk ke wiring alat agen:

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

- Pertahankan pemilihan penyedia, resolusi kredensial, dan semantik permintaan bersama di core.
- Gunakan penyedia pencarian web untuk transportasi pencarian khusus vendor.
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

Field rute:

- `path`: path rute di bawah server HTTP gateway.
- `auth`: wajib. Gunakan `"gateway"` untuk mewajibkan autentikasi gateway normal, atau `"plugin"` untuk autentikasi/verifikasi webhook yang dikelola Plugin.
- `match`: opsional. `"exact"` (default) atau `"prefix"`.
- `replaceExisting`: opsional. Memungkinkan Plugin yang sama mengganti pendaftaran rute miliknya yang sudah ada.
- `handler`: kembalikan `true` saat rute menangani permintaan.

Catatan:

- `api.registerHttpHandler(...)` telah dihapus dan akan menyebabkan kesalahan pemuatan Plugin. Gunakan `api.registerHttpRoute(...)` sebagai gantinya.
- Rute Plugin harus mendeklarasikan `auth` secara eksplisit.
- Konflik `path + match` yang persis ditolak kecuali `replaceExisting: true`, dan satu Plugin tidak dapat menggantikan rute Plugin lain.
- Rute yang tumpang tindih dengan level `auth` berbeda ditolak. Pertahankan rantai fallthrough `exact`/`prefix` hanya pada level auth yang sama.
- Rute `auth: "plugin"` **tidak** menerima cakupan runtime operator secara otomatis. Rute ini ditujukan untuk webhook/verifikasi tanda tangan yang dikelola Plugin, bukan panggilan pembantu Gateway berprivilese.
- Rute `auth: "gateway"` berjalan di dalam cakupan runtime permintaan Gateway, tetapi cakupan tersebut sengaja dibuat konservatif:
  - auth bearer rahasia bersama (`gateway.auth.mode = "token"` / `"password"`) menjaga cakupan runtime rute Plugin tetap dipatok ke `operator.write`, meskipun pemanggil mengirim `x-openclaw-scopes`
  - mode HTTP tepercaya yang membawa identitas (misalnya `trusted-proxy` atau `gateway.auth.mode = "none"` pada ingress privat) hanya menghormati `x-openclaw-scopes` ketika header tersebut hadir secara eksplisit
  - jika `x-openclaw-scopes` tidak ada pada permintaan rute Plugin yang membawa identitas tersebut, cakupan runtime kembali ke `operator.write`
- Aturan praktis: jangan menganggap rute Plugin dengan auth Gateway sebagai permukaan admin implisit. Jika rute Anda membutuhkan perilaku khusus admin, wajibkan mode auth yang membawa identitas dan dokumentasikan kontrak header `x-openclaw-scopes` secara eksplisit.

## Path impor SDK Plugin

Gunakan subpath SDK yang sempit alih-alih barrel root `openclaw/plugin-sdk` yang monolitik saat membuat Plugin baru. Subpath inti:

| Subpath                             | Tujuan                                             |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitif pendaftaran Plugin                       |
| `openclaw/plugin-sdk/channel-core`  | Pembantu entri/build saluran                       |
| `openclaw/plugin-sdk/core`          | Pembantu bersama generik dan kontrak payung        |
| `openclaw/plugin-sdk/config-schema` | Skema Zod root `openclaw.json` (`OpenClawSchema`) |

Plugin saluran memilih dari keluarga seam sempit — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, dan `channel-actions`. Perilaku persetujuan harus dikonsolidasikan
pada satu kontrak `approvalCapability` daripada mencampurnya di berbagai
field Plugin yang tidak terkait. Lihat [Plugin saluran](/id/plugins/sdk-channel-plugins).

Pembantu runtime dan konfigurasi berada di bawah subpath `*-runtime` terfokus
yang sesuai (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, dll.). Lebih pilih `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot`, dan `config-mutation`
daripada barrel kompatibilitas `config-runtime` yang luas.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
dan `openclaw/plugin-sdk/infra-runtime` adalah shim kompatibilitas yang sudah tidak dianjurkan untuk
Plugin lama. Kode baru sebaiknya mengimpor primitif generik yang lebih sempit.
</Info>

Titik masuk internal repo (per root paket Plugin bawaan):

- `index.js` — entri Plugin bawaan
- `api.js` — barrel pembantu/tipe
- `runtime-api.js` — barrel khusus runtime
- `setup-entry.js` — entri Plugin penyiapan

Plugin eksternal hanya boleh mengimpor subpath `openclaw/plugin-sdk/*`. Jangan pernah
mengimpor `src/*` milik paket Plugin lain dari core atau dari Plugin lain.
Titik masuk yang dimuat facade lebih memilih snapshot konfigurasi runtime aktif ketika
tersedia, lalu fallback ke file konfigurasi yang telah diselesaikan di disk.

Subpath khusus kapabilitas seperti `image-generation`, `media-understanding`,
dan `speech` ada karena Plugin bawaan menggunakannya saat ini. Subpath tersebut tidak
otomatis menjadi kontrak eksternal yang dibekukan jangka panjang — periksa halaman
referensi SDK yang relevan saat bergantung padanya.

## Skema alat pesan

Plugin harus memiliki kontribusi skema `describeMessageTool(...)` khusus saluran
untuk primitif non-pesan seperti reaksi, pembacaan, dan jajak pendapat.
Presentasi kirim bersama harus menggunakan kontrak generik `MessagePresentation`
alih-alih field tombol, komponen, blok, atau kartu native provider.
Lihat [Presentasi Pesan](/id/plugins/message-presentation) untuk kontrak,
aturan fallback, pemetaan provider, dan checklist penulis Plugin.

Plugin yang dapat mengirim mendeklarasikan apa yang dapat mereka render melalui kapabilitas pesan:

- `presentation` untuk blok presentasi semantik (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` untuk permintaan pengiriman yang dipin

Core memutuskan apakah akan merender presentasi secara native atau menurunkannya menjadi teks.
Jangan mengekspos jalan pintas UI native provider dari alat pesan generik.
Pembantu SDK yang sudah tidak dianjurkan untuk skema native lama tetap diekspor untuk
Plugin pihak ketiga yang sudah ada, tetapi Plugin baru sebaiknya tidak menggunakannya.

## Resolusi target saluran

Plugin saluran harus memiliki semantik target khusus saluran. Pertahankan host
outbound bersama tetap generik dan gunakan permukaan adaptor perpesanan untuk aturan provider:

- `messaging.inferTargetChatType({ to })` menentukan apakah target yang dinormalisasi
  harus diperlakukan sebagai `direct`, `group`, atau `channel` sebelum lookup direktori.
- `messaging.targetResolver.looksLikeId(raw, normalized)` memberi tahu core apakah sebuah
  input harus langsung melewati ke resolusi mirip id alih-alih pencarian direktori.
- `messaging.targetResolver.resolveTarget(...)` adalah fallback Plugin ketika
  core membutuhkan resolusi akhir milik provider setelah normalisasi atau setelah
  miss direktori.
- `messaging.resolveOutboundSessionRoute(...)` memiliki konstruksi rute sesi
  khusus provider setelah target diselesaikan.

Pembagian yang direkomendasikan:

- Gunakan `inferTargetChatType` untuk keputusan kategori yang harus terjadi sebelum
  mencari peer/grup.
- Gunakan `looksLikeId` untuk pemeriksaan "perlakukan ini sebagai id target eksplisit/native".
- Gunakan `resolveTarget` untuk fallback normalisasi khusus provider, bukan untuk
  pencarian direktori yang luas.
- Simpan id native provider seperti id chat, id thread, JID, handle, dan id room
  di dalam nilai `target` atau parameter khusus provider, bukan di field SDK generik.

## Direktori berbasis konfigurasi

Plugin yang menurunkan entri direktori dari konfigurasi harus mempertahankan logika tersebut di
Plugin dan menggunakan ulang pembantu bersama dari
`openclaw/plugin-sdk/directory-runtime`.

Gunakan ini ketika saluran membutuhkan peer/grup berbasis konfigurasi seperti:

- peer DM yang digerakkan allowlist
- peta saluran/grup yang dikonfigurasi
- fallback direktori statis bercakupan akun

Pembantu bersama di `directory-runtime` hanya menangani operasi generik:

- pemfilteran query
- penerapan limit
- pembantu deduplikasi/normalisasi
- membangun `ChannelDirectoryEntry[]`

Inspeksi akun khusus saluran dan normalisasi id harus tetap berada di
implementasi Plugin.

## Katalog provider

Plugin provider dapat menentukan katalog model untuk inferensi dengan
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` mengembalikan bentuk yang sama seperti yang ditulis OpenClaw ke
`models.providers`:

- `{ provider }` untuk satu entri provider
- `{ providers }` untuk beberapa entri provider

Gunakan `catalog` ketika Plugin memiliki id model khusus provider, default URL dasar,
atau metadata model yang dibatasi auth.

`catalog.order` mengontrol kapan katalog sebuah Plugin digabung relatif terhadap
provider implisit bawaan OpenClaw:

- `simple`: provider API-key biasa atau yang digerakkan env
- `profile`: provider yang muncul ketika profil auth ada
- `paired`: provider yang menyintesis beberapa entri provider terkait
- `late`: lintasan terakhir, setelah provider implisit lain

Provider yang lebih akhir menang pada tabrakan key, sehingga Plugin dapat secara sengaja menimpa
entri provider bawaan dengan id provider yang sama.

Kompatibilitas:

- `discovery` masih berfungsi sebagai alias lama
- jika `catalog` dan `discovery` sama-sama didaftarkan, OpenClaw menggunakan `catalog`

## Inspeksi saluran read-only

Jika Plugin Anda mendaftarkan saluran, lebih pilih mengimplementasikan
`plugin.config.inspectAccount(cfg, accountId)` bersama `resolveAccount(...)`.

Alasannya:

- `resolveAccount(...)` adalah path runtime. Ia boleh mengasumsikan kredensial
  sudah sepenuhnya dimaterialisasi dan dapat gagal cepat ketika secret wajib hilang.
- Path perintah read-only seperti `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, dan alur doctor/perbaikan
  konfigurasi seharusnya tidak perlu mematerialisasi kredensial runtime hanya untuk
  mendeskripsikan konfigurasi.

Perilaku `inspectAccount(...)` yang direkomendasikan:

- Hanya kembalikan status akun yang deskriptif.
- Pertahankan `enabled` dan `configured`.
- Sertakan field sumber/status kredensial saat relevan, seperti:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Anda tidak perlu mengembalikan nilai token mentah hanya untuk melaporkan ketersediaan
  read-only. Mengembalikan `tokenStatus: "available"` (dan field sumber yang cocok)
  sudah cukup untuk perintah bergaya status.
- Gunakan `configured_unavailable` ketika kredensial dikonfigurasi melalui SecretRef tetapi
  tidak tersedia pada path perintah saat ini.

Ini memungkinkan perintah read-only melaporkan "dikonfigurasi tetapi tidak tersedia di path
perintah ini" alih-alih crash atau salah melaporkan akun sebagai tidak dikonfigurasi.

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

Opsional: `openclaw.setupEntry` dapat menunjuk ke modul ringan khusus penyiapan.
Ketika OpenClaw membutuhkan permukaan penyiapan untuk Plugin saluran yang dinonaktifkan, atau
ketika Plugin saluran diaktifkan tetapi masih belum dikonfigurasi, OpenClaw memuat `setupEntry`
alih-alih entri Plugin penuh. Ini menjaga startup dan penyiapan lebih ringan
ketika entri Plugin utama Anda juga memasang alat, hook, atau kode khusus runtime lainnya.

Opsional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
dapat membuat Plugin saluran ikut menggunakan path `setupEntry` yang sama selama fase
startup pra-listen Gateway, bahkan ketika saluran sudah dikonfigurasi.

Gunakan ini hanya ketika `setupEntry` sepenuhnya mencakup permukaan startup yang harus ada
sebelum Gateway mulai mendengarkan. Dalam praktiknya, itu berarti entri penyiapan
harus mendaftarkan setiap kapabilitas milik saluran yang menjadi dependensi startup, seperti:

- pendaftaran saluran itu sendiri
- rute HTTP apa pun yang harus tersedia sebelum Gateway mulai mendengarkan
- metode, alat, atau layanan Gateway apa pun yang harus ada selama window yang sama

Jika entri penuh Anda masih memiliki kapabilitas startup wajib apa pun, jangan aktifkan
flag ini. Pertahankan Plugin pada perilaku default dan biarkan OpenClaw memuat
entri penuh selama startup.

Saluran bawaan juga dapat memublikasikan pembantu permukaan kontrak khusus penyiapan yang dapat
dikonsultasikan core sebelum runtime saluran penuh dimuat. Permukaan promosi penyiapan saat ini adalah:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core menggunakan surface tersebut saat perlu mempromosikan konfigurasi channel akun tunggal lama ke `channels.<id>.accounts.*` tanpa memuat entri plugin lengkap. Matrix adalah contoh bundled saat ini: Matrix hanya memindahkan kunci auth/bootstrap ke akun bernama yang dipromosikan saat akun bernama sudah ada, dan dapat mempertahankan kunci akun default non-kanonis yang dikonfigurasi alih-alih selalu membuat `accounts.default`.

Adapter patch penyiapan tersebut menjaga penemuan surface kontrak bundled tetap lazy. Waktu import tetap ringan; surface promosi hanya dimuat pada penggunaan pertama alih-alih memasuki ulang startup channel bundled saat import modul.

Saat surface startup tersebut menyertakan metode RPC Gateway, pertahankan metode tersebut pada prefiks khusus plugin. Namespace admin core (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu di-resolve ke `operator.admin`, sekalipun plugin meminta scope yang lebih sempit.

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

Plugin channel dapat mengiklankan metadata penyiapan/penemuan melalui `openclaw.channel` dan petunjuk instalasi melalui `openclaw.install`. Ini menjaga katalog core bebas data.

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

- `detailLabel`: label sekunder untuk surface katalog/status yang lebih kaya
- `docsLabel`: menimpa teks tautan untuk tautan docs
- `preferOver`: id plugin/channel prioritas lebih rendah yang harus dikalahkan entri katalog ini
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrol salinan surface pemilihan
- `markdownCapable`: menandai channel sebagai mampu markdown untuk keputusan pemformatan outbound
- `exposure.configured`: menyembunyikan channel dari surface daftar channel terkonfigurasi saat disetel ke `false`
- `exposure.setup`: menyembunyikan channel dari pemilih penyiapan/konfigurasi interaktif saat disetel ke `false`
- `exposure.docs`: menandai channel sebagai internal/privat untuk surface navigasi docs
- `showConfigured` / `showInSetup`: alias lama yang masih diterima untuk kompatibilitas; lebih pilih `exposure`
- `quickstartAllowFrom`: mengikutsertakan channel ke alur quickstart standar `allowFrom`
- `forceAccountBinding`: mewajibkan binding akun eksplisit bahkan saat hanya satu akun ada
- `preferSessionLookupForAnnounceTarget`: lebih memilih pencarian sesi saat me-resolve target pengumuman

OpenClaw juga dapat menggabungkan **katalog channel eksternal** (misalnya, ekspor registry MPM). Letakkan file JSON di salah satu dari:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Atau arahkan `OPENCLAW_PLUGIN_CATALOG_PATHS` (atau `OPENCLAW_MPM_CATALOG_PATHS`) ke satu atau beberapa file JSON (dibatasi koma/titik koma/`PATH`). Setiap file harus berisi `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser juga menerima `"packages"` atau `"plugins"` sebagai alias lama untuk kunci `"entries"`.

Entri katalog channel yang dihasilkan dan entri katalog instalasi provider mengekspos fakta sumber instalasi yang dinormalisasi di samping blok mentah `openclaw.install`. Fakta yang dinormalisasi mengidentifikasi apakah spesifikasi npm adalah versi persis atau selector mengambang, apakah metadata integritas yang diharapkan ada, dan apakah path sumber lokal juga tersedia. Saat identitas katalog/paket diketahui, fakta yang dinormalisasi memberi peringatan jika nama paket npm hasil parsing bergeser dari identitas tersebut. Fakta tersebut juga memberi peringatan saat `defaultChoice` tidak valid atau menunjuk ke sumber yang tidak tersedia, dan saat metadata integritas npm ada tanpa sumber npm yang valid. Konsumen harus memperlakukan `installSource` sebagai field opsional aditif sehingga entri buatan tangan dan shim katalog tidak perlu menyintesisnya. Ini memungkinkan onboarding dan diagnostik menjelaskan status bidang sumber tanpa mengimpor runtime plugin.

Entri npm eksternal resmi sebaiknya memilih `npmSpec` persis plus `expectedIntegrity`. Nama paket polos dan dist-tag tetap berfungsi untuk kompatibilitas, tetapi keduanya memunculkan peringatan bidang sumber sehingga katalog dapat bergerak menuju instalasi yang dipin dan diperiksa integritasnya tanpa merusak plugin yang ada. Saat onboarding menginstal dari path katalog lokal, onboarding mencatat entri indeks plugin terkelola dengan `source: "path"` dan `sourcePath` relatif-workspace jika memungkinkan. Path pemuatan operasional absolut tetap berada di `plugins.load.paths`; catatan instalasi menghindari duplikasi path workstation lokal ke konfigurasi jangka panjang. Ini membuat instalasi pengembangan lokal tetap terlihat oleh diagnostik bidang sumber tanpa menambahkan surface pengungkapan path filesystem mentah kedua. Indeks plugin `plugins/installs.json` yang dipersist adalah sumber kebenaran instalasi dan dapat disegarkan tanpa memuat modul runtime plugin. Map `installRecords`-nya tahan lama bahkan saat manifes plugin hilang atau tidak valid; array `plugins`-nya adalah tampilan manifes yang dapat dibangun ulang.

## Plugin mesin konteks

Plugin mesin konteks memiliki orkestrasi konteks sesi untuk ingest, perakitan, dan Compaction. Daftarkan dari plugin Anda dengan `api.registerContextEngine(id, factory)`, lalu pilih mesin aktif dengan `plugins.slots.contextEngine`.

Gunakan ini saat plugin Anda perlu mengganti atau memperluas pipeline konteks default, bukan sekadar menambahkan pencarian memori atau hook.

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

Factory `ctx` mengekspos nilai opsional `config`, `agentDir`, dan `workspaceDir` untuk inisialisasi saat konstruksi.

Jika mesin Anda **tidak** memiliki algoritma Compaction, pertahankan `compact()` tetap diimplementasikan dan delegasikan secara eksplisit:

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

## Menambahkan capability baru

Saat plugin membutuhkan perilaku yang tidak cocok dengan API saat ini, jangan melewati sistem plugin dengan akses privat. Tambahkan capability yang hilang.

Urutan yang direkomendasikan:

1. tentukan kontrak core
   Putuskan perilaku bersama apa yang harus dimiliki core: kebijakan, fallback, penggabungan konfigurasi, lifecycle, semantik yang menghadap channel, dan bentuk helper runtime.
2. tambahkan surface registrasi/runtime plugin bertipe
   Perluas `OpenClawPluginApi` dan/atau `api.runtime` dengan surface capability bertipe terkecil yang berguna.
3. hubungkan konsumen core + channel/fitur
   Plugin channel dan fitur harus mengonsumsi capability baru melalui core, bukan dengan mengimpor implementasi vendor secara langsung.
4. daftarkan implementasi vendor
   Plugin vendor kemudian mendaftarkan backend mereka terhadap capability tersebut.
5. tambahkan cakupan kontrak
   Tambahkan test agar kepemilikan dan bentuk registrasi tetap eksplisit dari waktu ke waktu.

Beginilah OpenClaw tetap opinionated tanpa menjadi hardcoded ke worldview satu provider. Lihat [Capability Cookbook](/id/plugins/architecture) untuk checklist file konkret dan contoh lengkap.

### Checklist capability

Saat Anda menambahkan capability baru, implementasi biasanya harus menyentuh surface ini bersama-sama:

- tipe kontrak core di `src/<capability>/types.ts`
- helper runner/runtime core di `src/<capability>/runtime.ts`
- surface registrasi API plugin di `src/plugins/types.ts`
- wiring registry plugin di `src/plugins/registry.ts`
- eksposur runtime plugin di `src/plugins/runtime/*` saat plugin fitur/channel perlu mengonsumsinya
- helper capture/test di `src/test-utils/plugin-registration.ts`
- asersi kepemilikan/kontrak di `src/plugins/contracts/registry.ts`
- docs operator/plugin di `docs/`

Jika salah satu surface tersebut hilang, itu biasanya tanda capability belum sepenuhnya terintegrasi.

### Template capability

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

Itu menjaga aturannya sederhana:

- core memiliki kontrak capability + orkestrasi
- plugin vendor memiliki implementasi vendor
- plugin fitur/channel mengonsumsi helper runtime
- test kontrak menjaga kepemilikan tetap eksplisit

## Terkait

- [Arsitektur plugin](/id/plugins/architecture) — model dan bentuk capability publik
- [Subpath SDK plugin](/id/plugins/sdk-subpaths)
- [Penyiapan SDK plugin](/id/plugins/sdk-setup)
- [Membangun plugin](/id/plugins/building-plugins)

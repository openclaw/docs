---
read_when:
    - Mengimplementasikan hook runtime penyedia, siklus hidup kanal, atau paket bundel
    - Men-debug urutan pemuatan plugin atau status registri
    - Menambahkan kapabilitas plugin baru atau plugin mesin konteks
summary: 'Internal arsitektur Plugin: alur pemuatan, registri, hook runtime, rute HTTP, dan tabel referensi'
title: Internal arsitektur Plugin
x-i18n:
    generated_at: "2026-07-12T14:22:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fe5b7f34c638da40b43c24da9425ecdeb9ce7381e233b3ebdd5cc95276ba04f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Untuk model kapabilitas publik, bentuk plugin, serta kontrak kepemilikan/eksekusi, lihat [Arsitektur plugin](/id/plugins/architecture). Halaman ini membahas mekanisme internal: pipeline pemuatan, registri, hook runtime, rute HTTP Gateway, jalur impor, dan tabel skema.

## Pipeline pemuatan

Saat dimulai, OpenClaw kurang lebih melakukan hal berikut:

1. menemukan root plugin kandidat
2. membaca manifes bundel native atau kompatibel dan metadata paket
3. menolak kandidat yang tidak aman
4. menormalkan konfigurasi plugin (`plugins.enabled`, `allow`, `deny`, `entries`, `slots`, `load.paths`)
5. menentukan pengaktifan setiap kandidat
6. memuat modul native yang diaktifkan: modul bawaan yang telah dibangun menggunakan pemuat native; kode sumber TypeScript lokal pihak ketiga menggunakan Jiti sebagai mekanisme darurat
7. memanggil hook native `register(api)` dan mengumpulkan pendaftaran ke dalam registri plugin
8. mengekspos registri ke perintah/permukaan runtime

<Note>
`activate` adalah alias lama untuk `register` — pemuat menggunakan yang tersedia (`def.register ?? def.activate`) dan memanggilnya pada titik yang sama. Semua plugin bawaan menggunakan `register`; utamakan `register` untuk plugin baru.
</Note>

Gerbang keamanan dijalankan **sebelum** eksekusi runtime. Penemuan memblokir kandidat ketika:

- entri yang telah diresolusinya keluar dari root plugin
- jalurnya (atau direktori root-nya) dapat ditulis oleh semua pengguna
- untuk plugin nonbawaan, kepemilikan jalur tidak cocok dengan uid saat ini (atau root)

Direktori bawaan yang dapat ditulis oleh semua pengguna terlebih dahulu mendapatkan upaya perbaikan `chmod` langsung di tempat (instalasi npm/global dapat mengirimkan direktori paket dengan mode `0777`) sebelum gerbang memeriksa ulang; pemeriksaan kepemilikan sepenuhnya dilewati untuk asal bawaan.

Kandidat yang diblokir tetap menyertakan id plugin dalam diagnostik yang dihasilkan jika diketahui (termasuk id yang diresolusi dari manifes di dalam direktori yang ditolak karena alasan lain), sehingga konfigurasi yang merujuk id tersebut melihat plugin yang diblokir dan terkait dengan peringatan keamanan jalur, bukan galat "plugin tidak dikenal" yang tidak berkaitan.

### Perilaku yang mengutamakan manifes

Manifes adalah sumber kebenaran bidang kontrol. OpenClaw menggunakannya untuk:

- mengidentifikasi plugin
- menemukan kanal/Skills/skema konfigurasi atau kapabilitas bundel yang dideklarasikan
- memvalidasi `plugins.entries.<id>.config`
- melengkapi label/placeholder UI Kontrol
- menampilkan metadata instalasi/katalog
- mempertahankan deskriptor aktivasi dan penyiapan yang ringan tanpa memuat runtime plugin

Untuk plugin native, modul runtime adalah bagian bidang data. Modul ini mendaftarkan perilaku aktual seperti hook, alat, perintah, atau alur penyedia.

Blok manifes opsional `activation` dan `setup` tetap berada di bidang kontrol. Blok tersebut hanyalah deskriptor metadata untuk perencanaan aktivasi dan penemuan penyiapan; blok tersebut tidak menggantikan pendaftaran runtime, `register(...)`, atau `setupEntry`. Konsumen aktivasi langsung menggunakan petunjuk perintah, kanal, dan penyedia dari manifes untuk mempersempit pemuatan plugin sebelum materialisasi registri yang lebih luas:

- pemuatan CLI dipersempit ke plugin yang memiliki perintah utama yang diminta
- resolusi penyiapan kanal/plugin dipersempit ke plugin yang memiliki id kanal yang diminta
- resolusi penyiapan/runtime penyedia eksplisit dipersempit ke plugin yang memiliki id penyedia yang diminta
- perencanaan awal Gateway menggunakan `activation.onStartup` untuk impor awal eksplisit; plugin tanpa metadata awal hanya dimuat melalui pemicu aktivasi yang lebih sempit

Perencana aktivasi mengekspos API khusus id untuk pemanggil yang sudah ada serta API rencana untuk diagnostik. Entri rencana melaporkan alasan plugin dipilih, dengan memisahkan petunjuk eksplisit `activation.*` dari fallback kepemilikan manifes:

| Alasan (dari petunjuk `activation.*`) | Alasan (dari kepemilikan manifes)                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------- |
| `activation-agent-harness-hint`       | —                                                                                           |
| `activation-capability-hint`          | —                                                                                           |
| `activation-channel-hint`             | `manifest-channel-owner` (`channels`)                                                       |
| `activation-command-hint`             | `manifest-command-alias` (`commandAliases`)                                                 |
| `activation-provider-hint`            | `manifest-provider-owner` (`providers`), `manifest-setup-provider-owner` (`setup.providers`) |
| `activation-route-hint`               | —                                                                                           |
| — (pemicu hook tidak memiliki varian petunjuk) | `manifest-hook-owner` (`hooks`), `manifest-tool-contract` (`contracts.tools`)         |

Pemisahan alasan tersebut adalah batas kompatibilitas: metadata plugin yang sudah ada tetap berfungsi, sementara kode baru dapat mendeteksi petunjuk yang luas atau perilaku fallback tanpa mengubah semantik pemuatan runtime.

Prapemuatan runtime pada waktu permintaan yang meminta cakupan luas `all` tetap memperoleh kumpulan id plugin efektif yang eksplisit dari konfigurasi, perencanaan awal, kanal yang dikonfigurasi, slot, dan aturan pengaktifan otomatis (`resolveEffectivePluginIds` dalam `src/plugins/effective-plugin-ids.ts`). Jika kumpulan yang diperoleh tersebut kosong, OpenClaw mempertahankan cakupan kosong, bukan memperluasnya ke setiap plugin yang dapat ditemukan.

Penemuan penyiapan mengutamakan id milik deskriptor seperti `setup.providers` dan `setup.cliBackends` untuk mempersempit plugin kandidat sebelum melakukan fallback ke `setup-api` bagi plugin yang masih memerlukan hook runtime saat penyiapan. Daftar penyiapan penyedia menggunakan `providerAuthChoices` dari manifes, pilihan penyiapan yang diperoleh dari deskriptor, dan metadata katalog instalasi tanpa memuat runtime penyedia. `setup.requiresRuntime: false` yang eksplisit menjadi batas khusus deskriptor; `requiresRuntime` yang dihilangkan mempertahankan fallback `setup-api` lama demi kompatibilitas. Jika lebih dari satu plugin yang ditemukan mengklaim id penyedia penyiapan atau backend CLI ternormalisasi yang sama, pencarian penyiapan menolak pemilik yang ambigu, bukan mengandalkan urutan penemuan. Ketika runtime penyiapan benar-benar dieksekusi, diagnostik registri melaporkan penyimpangan antara `setup.providers` / `setup.cliBackends` dan penyedia atau backend CLI yang benar-benar didaftarkan oleh `setup-api`, tanpa memblokir plugin lama.

### Batas cache plugin

OpenClaw tidak menyimpan cache hasil penemuan plugin atau data registri manifes langsung di balik jendela waktu dinding. Instalasi, pengeditan manifes, dan perubahan jalur pemuatan harus terlihat pada pembacaan metadata eksplisit atau pembangunan ulang snapshot berikutnya. Parser berkas manifes mempertahankan cache tanda tangan berkas terbatas yang dikunci berdasarkan jalur manifes yang dibuka beserta perangkat/inode, ukuran, dan mtime/ctime; cache tersebut hanya menghindari penguraian ulang byte yang tidak berubah dan tidak boleh menyimpan cache jawaban terkait penemuan, registri, pemilik, atau kebijakan.

Jalur cepat metadata yang aman adalah kepemilikan objek eksplisit, bukan cache tersembunyi. Jalur penting saat Gateway dimulai harus meneruskan `PluginMetadataSnapshot` saat ini, `PluginLookUpTable` yang diperoleh, atau registri manifes eksplisit melalui rantai pemanggilan. Validasi konfigurasi, pengaktifan otomatis saat dimulai, bootstrap plugin, dan pemilihan penyedia dapat menggunakan kembali objek tersebut selama objek tersebut mewakili konfigurasi dan inventaris plugin saat ini. Pencarian penyiapan tetap merekonstruksi metadata manifes sesuai permintaan, kecuali jalur penyiapan tertentu menerima registri manifes eksplisit; pertahankan hal tersebut sebagai fallback jalur dingin, bukan menambahkan cache pencarian tersembunyi. Ketika masukan berubah, bangun ulang dan ganti snapshot, bukan memutasinya atau menyimpan salinan historis. Tampilan atas registri plugin aktif dan pembantu bootstrap kanal bawaan harus dihitung ulang dari registri/root saat ini. Peta berumur pendek dapat digunakan dalam satu pemanggilan untuk mendeduplikasi pekerjaan atau mencegah masuk ulang; peta tersebut tidak boleh menjadi cache metadata proses.

Untuk pemuatan plugin, lapisan cache persisten adalah pemuatan runtime. Lapisan ini dapat menggunakan kembali status pemuat ketika kode atau artefak yang terinstal benar-benar dimuat, seperti:

- `PluginLoaderCacheState` dan registri runtime aktif yang kompatibel
- cache jiti/modul dan cache pemuat permukaan publik yang digunakan untuk menghindari impor berulang atas permukaan runtime yang sama
- cache sistem berkas untuk artefak plugin yang terinstal
- peta per pemanggilan berumur pendek untuk normalisasi jalur atau resolusi duplikat

Cache tersebut merupakan detail implementasi bidang data. Cache tersebut tidak boleh menjawab pertanyaan bidang kontrol seperti "plugin mana yang memiliki penyedia ini?" kecuali pemanggil secara sengaja meminta pemuatan runtime.

Jangan menambahkan cache persisten atau berbasis waktu dinding untuk:

- hasil penemuan
- registri manifes langsung
- registri manifes yang direkonstruksi dari indeks plugin terinstal
- pencarian pemilik penyedia, penekanan model, kebijakan penyedia, atau metadata artefak publik
- jawaban lain apa pun yang berasal dari manifes, ketika perubahan manifes, indeks terinstal, atau jalur pemuatan seharusnya terlihat pada pembacaan metadata berikutnya

Pemanggil yang membangun ulang metadata manifes dari indeks plugin terinstal yang dipersistenkan merekonstruksi registri tersebut sesuai permintaan. Indeks terinstal adalah status bidang sumber yang tahan lama; indeks tersebut bukan cache metadata dalam proses yang tersembunyi.

## Model registri

Plugin yang dimuat tidak secara langsung memutasi global inti secara acak. Plugin mendaftar ke registri plugin pusat (`PluginRegistry` dalam `src/plugins/registry-types.ts`), yang melacak rekaman plugin (identitas, sumber, asal, status, diagnostik) beserta larik untuk setiap kapabilitas: alat, hook lama dan hook bertipe, kanal, penyedia, penangan RPC Gateway, rute HTTP, pendaftar CLI, layanan latar belakang, perintah milik plugin, dan puluhan keluarga penyedia bertipe lainnya (ucapan, embedding, pembuatan gambar/video/musik, pengambilan/pencarian web, harness agen, tindakan sesi, dan sebagainya).

Fitur inti kemudian membaca dari registri tersebut, bukan berkomunikasi langsung dengan modul plugin. Hal ini mempertahankan pemuatan satu arah:

- modul plugin -> pendaftaran registri
- runtime inti -> konsumsi registri

Pemisahan tersebut penting untuk kemudahan pemeliharaan. Artinya, sebagian besar permukaan inti hanya memerlukan satu titik integrasi: "baca registri", bukan "perlakukan setiap modul plugin sebagai kasus khusus".

## Callback pengikatan percakapan

Plugin yang mengikat percakapan dapat bereaksi ketika persetujuan diselesaikan.

Gunakan `api.onConversationBindingResolved(...)` untuk menerima callback setelah permintaan pengikatan disetujui atau ditolak:

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
- `binding`: pengikatan yang telah diselesaikan untuk permintaan yang disetujui
- `request`: ringkasan permintaan asli, petunjuk pelepasan, id pengirim, dan metadata percakapan

Callback ini hanya berupa notifikasi. Callback ini tidak mengubah siapa yang diizinkan mengikat percakapan, dan dijalankan setelah penanganan persetujuan inti selesai.

## Hook runtime penyedia

Plugin penyedia memiliki tiga lapisan:

- **Metadata manifes** untuk pencarian praruntime yang ringan: `setup.providers[].envVars`, kompatibilitas lama yang tidak lagi dianjurkan `providerAuthEnvVars`, `providerAuthAliases`, `providerAuthChoices`, dan `channelEnvVars`.
- **Hook waktu konfigurasi**: `catalog` (`discovery` lama) beserta `applyConfigDefaults`.
- **Hook runtime**: lebih dari 40 hook opsional yang mencakup autentikasi, resolusi model, pembungkusan stream, tingkat penalaran, kebijakan pemutaran ulang, dan endpoint penggunaan. Lihat [Urutan dan penggunaan hook](#hook-order-and-usage).

OpenClaw tetap memiliki loop agen generik, failover, penanganan transkrip, dan kebijakan alat. Hook ini merupakan permukaan ekstensi untuk perilaku khusus penyedia tanpa memerlukan transport inferensi kustom sepenuhnya.

Gunakan manifes `setup.providers[].envVars` ketika penyedia memiliki kredensial berbasis env yang harus dapat dilihat oleh jalur autentikasi/status/pemilih-model generik tanpa memuat runtime plugin. `providerAuthEnvVars` yang telah dihentikan masih dibaca oleh adaptor kompatibilitas selama periode penghentian, dan plugin yang tidak dibundel yang menggunakannya akan menerima diagnostik manifes. Gunakan manifes `providerAuthAliases` ketika satu id penyedia harus menggunakan kembali variabel env, profil autentikasi, autentikasi berbasis konfigurasi, dan pilihan orientasi kunci API milik id penyedia lain. Gunakan manifes `providerAuthChoices` ketika antarmuka CLI pilihan orientasi/autentikasi perlu mengetahui id pilihan penyedia, label grup, dan pengaturan autentikasi sederhana dengan satu flag tanpa memuat runtime penyedia. Pertahankan `envVars` runtime penyedia untuk petunjuk bagi operator seperti label orientasi atau variabel penyiapan id-klien/rahasia-klien OAuth.

Gunakan manifes `channelEnvVars` ketika saluran memiliki autentikasi atau penyiapan berbasis env yang harus dapat dilihat oleh fallback env shell generik, pemeriksaan konfigurasi/status, atau perintah penyiapan tanpa memuat runtime saluran.

### Urutan dan penggunaan hook

Untuk plugin model/penyedia, OpenClaw memanggil hook kurang lebih dalam urutan berikut.
Kolom "Kapan digunakan" adalah panduan pengambilan keputusan cepat.
Kolom penyedia khusus kompatibilitas yang tidak lagi dipanggil oleh OpenClaw, seperti `ProviderPlugin.capabilities` dan `suppressBuiltInModel`, sengaja tidak dicantumkan di sini.

| Hook                              | Fungsinya                                                                                                                        | Kapan digunakan                                                                                                                                                      |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                         | Publikasikan konfigurasi penyedia ke `models.providers` selama pembuatan `models.json`                                            | Penyedia memiliki katalog atau nilai bawaan URL dasar                                                                                                                |
| `applyConfigDefaults`             | Terapkan nilai bawaan konfigurasi global milik penyedia selama materialisasi konfigurasi                                         | Nilai bawaan bergantung pada mode autentikasi, lingkungan, atau semantik keluarga model penyedia                                                                     |
| _(pencarian model bawaan)_        | OpenClaw mencoba jalur registri/katalog normal terlebih dahulu                                                                   | _(bukan hook Plugin)_                                                                                                                                                |
| `normalizeModelId`                | Normalkan alias ID model lama atau pratinjau sebelum pencarian                                                                   | Penyedia menangani pembersihan alias sebelum resolusi model kanonis                                                                                                  |
| `normalizeTransport`              | Normalkan `api` / `baseUrl` keluarga penyedia sebelum perakitan model generik                                                    | Penyedia menangani pembersihan transportasi untuk ID penyedia khusus dalam keluarga transportasi yang sama                                                           |
| `normalizeConfig`                 | Normalkan `models.providers.<id>` sebelum resolusi waktu proses/penyedia                                                         | Penyedia memerlukan pembersihan konfigurasi yang seharusnya berada dalam Plugin; pembantu keluarga Google terbundel juga menjadi cadangan bagi entri konfigurasi Google yang didukung |
| `applyNativeStreamingUsageCompat` | Terapkan penulisan ulang kompatibilitas penggunaan streaming native ke penyedia konfigurasi                                      | Penyedia memerlukan perbaikan metadata penggunaan streaming native yang ditentukan oleh titik akhir                                                                  |
| `resolveConfigApiKey`             | Selesaikan autentikasi penanda lingkungan untuk penyedia konfigurasi sebelum pemuatan autentikasi waktu proses                   | Penyedia mengekspos hook resolusi kunci API penanda lingkungan masing-masing                                                                                         |
| `resolveSyntheticAuth`            | Tampilkan autentikasi lokal/yang dihosting sendiri atau berbasis konfigurasi tanpa menyimpan teks biasa                          | Penyedia dapat beroperasi dengan penanda kredensial sintetis/lokal                                                                                                   |
| `resolveExternalAuthProfiles`     | Lapisi profil autentikasi eksternal milik penyedia; `persistence` bawaan adalah `runtime-only` untuk kredensial milik CLI/aplikasi | Penyedia menggunakan kembali kredensial autentikasi eksternal tanpa menyimpan token penyegaran yang disalin; deklarasikan `contracts.externalAuthProviders` dalam manifes |
| `shouldDeferSyntheticProfileAuth` | Turunkan prioritas placeholder profil sintetis tersimpan di bawah autentikasi berbasis lingkungan/konfigurasi                    | Penyedia menyimpan profil placeholder sintetis yang tidak seharusnya didahulukan                                                                                     |
| `resolveDynamicModel`             | Sinkronkan mekanisme cadangan untuk ID model milik penyedia yang belum ada di registri lokal                                     | Penyedia menerima ID model hulu arbitrer                                                                                                                             |
| `prepareDynamicModel`             | Lakukan pemanasan asinkron, lalu `resolveDynamicModel` dijalankan kembali                                                        | Penyedia memerlukan metadata jaringan sebelum menyelesaikan ID yang tidak dikenal                                                                                    |
| `normalizeResolvedModel`          | Penulisan ulang akhir sebelum pengeksekusi tertanam menggunakan model yang telah diselesaikan                                    | Penyedia memerlukan penulisan ulang transportasi, tetapi tetap menggunakan transportasi inti                                                                         |
| `normalizeToolSchemas`            | Normalkan skema alat sebelum dilihat oleh pengeksekusi tertanam                                                                  | Penyedia memerlukan pembersihan skema keluarga transportasi                                                                                                          |
| `inspectToolSchemas`              | Tampilkan diagnostik skema milik penyedia setelah normalisasi                                                                    | Penyedia menginginkan peringatan kata kunci tanpa mengajarkan aturan khusus penyedia kepada inti                                                                      |
| `resolveReasoningOutputMode`      | Pilih kontrak keluaran penalaran native atau bertag                                                                              | Penyedia memerlukan keluaran penalaran/akhir bertag sebagai pengganti bidang native                                                                                   |
| `prepareExtraParams`              | Normalisasi parameter permintaan sebelum pembungkus opsi aliran generik                                                          | Penyedia memerlukan parameter permintaan bawaan atau pembersihan parameter per penyedia                                                                               |
| `createStreamFn`                  | Ganti sepenuhnya jalur aliran normal dengan transportasi khusus                                                                  | Penyedia memerlukan protokol kabel khusus, bukan sekadar pembungkus                                                                                                  |
| `wrapStreamFn`                    | Pembungkus aliran setelah pembungkus generik diterapkan                                                                          | Penyedia memerlukan pembungkus kompatibilitas header/badan/model permintaan tanpa transportasi khusus                                                                 |
| `resolveTransportTurnState`       | Lampirkan header atau metadata transportasi native per giliran                                                                   | Penyedia ingin transportasi generik mengirim identitas giliran native penyedia                                                                                       |
| `resolveWebSocketSessionPolicy`   | Lampirkan header WebSocket native atau kebijakan masa jeda sesi                                                                  | Penyedia ingin transportasi WS generik menyesuaikan header sesi atau kebijakan cadangan                                                                               |
| `formatApiKey`                    | Pemformat profil autentikasi: profil tersimpan menjadi string `apiKey` waktu proses                                               | Penyedia menyimpan metadata autentikasi tambahan dan memerlukan bentuk token waktu proses khusus                                                                      |
| `refreshOAuth`                    | Penggantian penyegaran OAuth untuk titik akhir penyegaran khusus atau kebijakan kegagalan penyegaran                             | Penyedia tidak sesuai dengan penyegar bersama OpenClaw                                                                                                               |
| `buildAuthDoctorHint`             | Petunjuk perbaikan yang ditambahkan saat penyegaran OAuth gagal                                                                  | Penyedia memerlukan panduan perbaikan autentikasi milik penyedia setelah kegagalan penyegaran                                                                         |
| `matchesContextOverflowError`     | Pencocok luapan jendela konteks milik penyedia                                                                                   | Penyedia memiliki kesalahan luapan mentah yang tidak akan terdeteksi oleh heuristik generik                                                                           |
| `classifyFailoverReason`          | Klasifikasi alasan failover milik penyedia                                                                                       | Penyedia dapat memetakan kesalahan API/transportasi mentah ke pembatasan laju/beban berlebih/dan sebagainya                                                           |
| `isCacheTtlEligible`              | Kebijakan cache prompt untuk penyedia proksi/backhaul                                                                            | Penyedia memerlukan pembatasan TTL cache khusus proksi                                                                                                               |
| `buildMissingAuthMessage`         | Pengganti pesan pemulihan autentikasi yang hilang generik                                                                        | Penyedia memerlukan petunjuk pemulihan autentikasi yang hilang khusus penyedia                                                                                        |
| `augmentModelCatalog`             | Baris katalog sintetis/akhir yang ditambahkan setelah penemuan (tidak digunakan lagi, lihat di bawah)                            | Penyedia memerlukan baris kompatibilitas maju sintetis di `models list` dan pemilih                                                                                   |
| `resolveThinkingProfile`          | Kumpulan tingkat `/think` khusus model, label tampilan, dan nilai bawaan                                                         | Penyedia mengekspos jenjang berpikir khusus atau label biner untuk model yang dipilih                                                                                 |
| `isBinaryThinking`                | Hook kompatibilitas pengalih penalaran aktif/nonaktif                                                                            | Penyedia hanya mengekspos penalaran biner aktif/nonaktif                                                                                                             |
| `supportsXHighThinking`           | Hook kompatibilitas dukungan penalaran `xhigh`                                                                                   | Penyedia hanya menginginkan `xhigh` pada sebagian model                                                                                                              |
| `resolveDefaultThinkingLevel`     | Hook kompatibilitas tingkat `/think` bawaan                                                                                      | Penyedia menangani kebijakan `/think` bawaan untuk suatu keluarga model                                                                                              |
| `isModernModelRef`                | Pencocok model modern untuk filter profil langsung dan pemilihan uji asap                                                        | Penyedia menangani pencocokan model pilihan untuk penggunaan langsung/uji asap                                                                                       |
| `prepareRuntimeAuth`              | Tukarkan kredensial yang dikonfigurasi menjadi token/kunci waktu proses aktual tepat sebelum inferensi                           | Penyedia memerlukan pertukaran token atau kredensial permintaan berumur pendek                                                                                        |
| `resolveUsageAuth`                | Selesaikan kredensial penggunaan/penagihan untuk `/usage` dan permukaan status terkait                                           | Penyedia memerlukan penguraian token penggunaan/kuota khusus atau kredensial penggunaan yang berbeda                                                                  |
| `fetchUsageSnapshot`              | Ambil dan normalkan cuplikan penggunaan/kuota khusus penyedia setelah autentikasi diselesaikan                                   | Penyedia memerlukan titik akhir penggunaan atau pengurai muatan khusus penyedia                                                                                       |
| `createEmbeddingProvider`         | Bangun adaptor embedding milik penyedia untuk memori/pencarian                                                  | Perilaku embedding memori merupakan tanggung jawab Plugin penyedia                                                                             |
| `buildReplayPolicy`               | Kembalikan kebijakan pemutaran ulang yang mengendalikan penanganan transkrip untuk penyedia                     | Penyedia memerlukan kebijakan transkrip khusus (misalnya, penghapusan blok pemikiran)                                                          |
| `sanitizeReplayHistory`           | Tulis ulang riwayat pemutaran ulang setelah pembersihan transkrip generik                                       | Penyedia memerlukan penulisan ulang pemutaran ulang khusus penyedia di luar pembantu Compaction bersama                                        |
| `validateReplayTurns`             | Validasi akhir atau pembentukan ulang giliran pemutaran ulang sebelum runner tersemat                           | Transportasi penyedia memerlukan validasi giliran yang lebih ketat setelah sanitasi generik                                                    |
| `onModelSelected`                 | Jalankan efek samping pascapemilihan milik penyedia                                                             | Penyedia memerlukan telemetri atau status milik penyedia saat model menjadi aktif                                                              |

`normalizeModelId`, `normalizeTransport`, dan `normalizeConfig` terlebih dahulu memeriksa
Plugin penyedia yang cocok, lalu beralih ke Plugin penyedia lain yang mendukung hook
hingga salah satunya benar-benar mengubah id model atau transportasi/konfigurasi. Hal ini menjaga
shim penyedia alias/kompatibilitas tetap berfungsi tanpa mengharuskan pemanggil mengetahui
Plugin bawaan mana yang memiliki penulisan ulang tersebut. Jika tidak ada hook penyedia yang menulis ulang
entri konfigurasi keluarga Google yang didukung, penormal konfigurasi Google bawaan tetap menerapkan
pembersihan kompatibilitas tersebut.

Jika penyedia memerlukan protokol wire yang sepenuhnya khusus atau eksekutor permintaan khusus,
itu merupakan kelas ekstensi yang berbeda. Hook ini ditujukan untuk perilaku penyedia
yang tetap berjalan pada loop inferensi normal OpenClaw.

`resolveUsageAuth` menentukan apakah OpenClaw harus memanggil `fetchUsageSnapshot` atau
kembali ke resolusi kredensial generik untuk permukaan penggunaan/status. Kembalikan
`{ token, accountId?, subscriptionType?, rateLimitTier? }` ketika penyedia
memiliki kredensial penggunaan (metadata paket opsional diteruskan ke
`fetchUsageSnapshot`), kembalikan
`{ handled: true }` ketika autentikasi penggunaan milik penyedia telah menangani permintaan dan
harus menekan fallback kunci API/OAuth generik, serta kembalikan `null` atau `undefined`
ketika penyedia tidak menangani autentikasi penggunaan.

Deklarasikan kredensial organisasi atau penagihan dalam manifes
`providerUsageAuthEnvVars`. Hal ini memungkinkan permukaan penemuan generik dan pembersihan rahasia
mengenalinya tanpa menjadikannya kandidat autentikasi inferensi.

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
autentikasi, penalaran, pemutaran ulang, dan penggunaan setiap vendor. Kumpulan hook otoritatif berada
bersama setiap Plugin di bawah `extensions/`; halaman ini menggambarkan bentuknya alih-alih
mencerminkan daftarnya.

<AccordionGroup>
  <Accordion title="Penyedia katalog pass-through">
    OpenRouter, Kilocode, Z.AI, xAI mendaftarkan `catalog` beserta
    `resolveDynamicModel` / `prepareDynamicModel` sehingga dapat menampilkan id model hulu
    sebelum katalog statis OpenClaw.
  </Accordion>
  <Accordion title="Penyedia titik akhir OAuth dan penggunaan">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai memasangkan
    `prepareRuntimeAuth` atau `formatApiKey` dengan `resolveUsageAuth` +
    `fetchUsageSnapshot` untuk menangani pertukaran token dan integrasi `/usage`.
  </Accordion>
  <Accordion title="Keluarga pembersihan pemutaran ulang dan transkrip">
    Keluarga bersama bernama (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) memungkinkan penyedia mengaktifkan
    kebijakan transkrip melalui `buildReplayPolicy` alih-alih setiap Plugin
    mengimplementasikan ulang pembersihan.
  </Accordion>
  <Accordion title="Penyedia khusus katalog">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway`, dan
    `volcengine` hanya mendaftarkan `catalog` dan menggunakan loop inferensi bersama.
  </Accordion>
  <Accordion title="Pembantu stream khusus Anthropic">
    Header beta, `/fast` / `serviceTier`, dan `context1m` berada di dalam
    batas publik `api.ts` / `contract-api.ts` milik Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), bukan di dalam
    SDK generik.
  </Accordion>
</AccordionGroup>

## Pembantu runtime

Plugin dapat mengakses pembantu inti tertentu melalui `api.runtime`. Untuk TTS:

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
- Menggunakan konfigurasi `messages.tts` inti dan pemilihan penyedia.
- Mengembalikan buffer audio PCM + laju sampel. Plugin harus melakukan resampling/enkode untuk penyedia.
- `listVoices` bersifat opsional untuk setiap penyedia. Gunakan untuk pemilih suara atau alur penyiapan milik vendor.
- Inti meneruskan tenggat permintaan yang telah diresolusi ke hook `listVoices` penyedia; pengaturan batas waktu khusus penyedia dapat menggantikannya.
- Daftar suara dapat menyertakan metadata yang lebih lengkap seperti lokal, gender, dan tag kepribadian untuk pemilih yang menyadari penyedia.
- OpenAI dan ElevenLabs mendukung telefoni saat ini. Microsoft tidak.

Plugin juga dapat mendaftarkan penyedia ucapan melalui `api.registerSpeechProvider(...)`.

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
- Gunakan penyedia ucapan untuk perilaku sintesis milik vendor.
- Masukan `edge` Microsoft lama dinormalisasi menjadi id penyedia `microsoft`.
- Model kepemilikan yang disarankan berorientasi pada perusahaan: satu Plugin vendor dapat memiliki
  penyedia teks, ucapan, gambar, dan media mendatang saat OpenClaw menambahkan
  kontrak kemampuan tersebut.

Untuk pemahaman gambar/audio/video, Plugin mendaftarkan satu penyedia
pemahaman media bertipe, bukan kumpulan pasangan kunci/nilai generik:

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

- Pertahankan orkestrasi, fallback, konfigurasi, dan pengkabelan saluran di inti.
- Pertahankan perilaku vendor di Plugin penyedia.
- Perluasan aditif harus tetap bertipe: metode opsional baru, kolom hasil
  opsional baru, dan kemampuan opsional baru.
- Pembuatan video telah mengikuti pola yang sama:
  - inti memiliki kontrak kemampuan dan pembantu runtime
  - Plugin vendor mendaftarkan `api.registerVideoGenerationProvider(...)`
  - Plugin fitur/saluran menggunakan `api.runtime.videoGeneration.*`

Untuk pembantu runtime pemahaman media, Plugin dapat memanggil:

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
  model: "gpt-5.6-sol",
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

- `api.runtime.mediaUnderstanding.*` adalah permukaan bersama yang disarankan untuk
  pemahaman gambar/audio/video.
- `extractStructuredWithModel(...)` adalah batas yang ditujukan bagi Plugin untuk ekstraksi
  berbatas milik penyedia yang mengutamakan gambar. Sertakan setidaknya satu masukan gambar;
  masukan teks merupakan konteks tambahan. Plugin produk memiliki rute dan
  skemanya, sedangkan OpenClaw memiliki batas penyedia/runtime.
- Menggunakan konfigurasi audio pemahaman media inti (`tools.media.audio`) dan urutan fallback penyedia.
- Mengembalikan `{ text: undefined }` ketika tidak ada keluaran transkripsi yang dihasilkan (misalnya masukan dilewati/tidak didukung).
- `api.runtime.stt.transcribeAudioFile(...)` tetap tersedia sebagai alias kompatibilitas.

Plugin juga dapat menjalankan proses subagen latar belakang melalui `api.runtime.subagent`:

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

- `provider` dan `model` merupakan penggantian opsional per proses, bukan perubahan sesi persisten.
- OpenClaw hanya mematuhi kolom penggantian tersebut untuk pemanggil tepercaya.
- Untuk proses fallback milik Plugin, operator harus mengaktifkannya dengan `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Gunakan `plugins.entries.<id>.subagent.allowedModels` untuk membatasi Plugin tepercaya pada target kanonis `provider/model` tertentu, atau `"*"` untuk mengizinkan target apa pun secara eksplisit.
- Proses subagen Plugin yang tidak tepercaya tetap berfungsi, tetapi permintaan penggantian ditolak, bukan secara diam-diam menggunakan fallback.
- Sesi subagen yang dibuat Plugin diberi tag id Plugin pembuatnya. Fallback `api.runtime.subagent.deleteSession(...)` hanya dapat menghapus sesi yang dimiliki tersebut; penghapusan sesi arbitrer tetap memerlukan permintaan Gateway dengan cakupan admin.

Untuk pencarian web, Plugin dapat menggunakan pembantu runtime bersama alih-alih
mengakses langsung pengkabelan alat agen:

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
- Gunakan penyedia pencarian web untuk transportasi pencarian khusus vendor.
- `api.runtime.webSearch.*` adalah permukaan bersama yang disarankan bagi Plugin fitur/saluran yang memerlukan perilaku pencarian tanpa bergantung pada pembungkus alat agen.

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
- `listProviders(...)`: mencantumkan penyedia pembuatan gambar yang tersedia beserta kemampuannya.

## Rute HTTP Gateway

Plugin dapat mengekspos titik akhir HTTP dengan `api.registerHttpRoute(...)`.

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

Kolom rute:

- `path`: jalur rute di bawah server HTTP Gateway.
- `auth`: wajib, `"gateway"` atau `"plugin"`. Gunakan `"gateway"` untuk mewajibkan autentikasi Gateway normal, atau `"plugin"` untuk autentikasi/verifikasi Webhook yang dikelola Plugin.
- `match`: opsional. `"exact"` (bawaan) atau `"prefix"`.
- `handleUpgrade`: penangan opsional untuk permintaan peningkatan WebSocket pada rute yang sama.
- `replaceExisting`: opsional. Memungkinkan Plugin yang sama mengganti pendaftaran rutenya sendiri yang sudah ada.
- `handler`: kembalikan `true` ketika rute telah menangani permintaan.

Catatan:

- `api.registerHttpHandler(...)` telah dihapus dan akan menyebabkan kesalahan pemuatan Plugin. Gunakan `api.registerHttpRoute(...)` sebagai gantinya.
- Rute Plugin harus mendeklarasikan `auth` secara eksplisit.
- Konflik `path + match` yang sama persis ditolak kecuali `replaceExisting: true`, dan satu Plugin tidak dapat mengganti rute milik Plugin lain.
- Rute yang tumpang tindih dengan tingkat `auth` berbeda ditolak. Pertahankan rantai alih lanjut `exact`/`prefix` hanya pada tingkat autentikasi yang sama.
- Rute `auth: "plugin"` **tidak** menerima cakupan runtime operator secara otomatis. Rute tersebut ditujukan untuk Webhook/verifikasi tanda tangan yang dikelola Plugin, bukan pemanggilan pembantu Gateway dengan hak istimewa.
- Rute `auth: "gateway"` berjalan di dalam cakupan runtime permintaan Gateway. Permukaan bawaan (`gatewayRuntimeScopeSurface: "write-default"`) sengaja dibuat konservatif:
  - autentikasi bearer dengan rahasia bersama (`gateway.auth.mode = "token"` / `"password"`) dan metode autentikasi apa pun selain proksi tepercaya mendapatkan satu cakupan `operator.write`, meskipun pemanggil mengirimkan `x-openclaw-scopes`
  - pemanggil `trusted-proxy` tanpa header `x-openclaw-scopes` eksplisit juga mempertahankan permukaan lama yang hanya memiliki `operator.write`
  - pemanggil `trusted-proxy` yang mengirimkan `x-openclaw-scopes` akan mendapatkan cakupan yang dideklarasikan
  - rute dapat memilih `gatewayRuntimeScopeSurface: "trusted-operator"` agar selalu menghormati `x-openclaw-scopes` untuk mode autentikasi yang menyertakan identitas (dengan menggunakan kumpulan lengkap cakupan bawaan CLI ketika header tidak ada)
- Aturan praktis: jangan menganggap rute Plugin dengan autentikasi Gateway sebagai permukaan admin implisit. Jika rute Anda memerlukan perilaku khusus admin, pilih permukaan cakupan `trusted-operator`, wajibkan mode autentikasi yang menyertakan identitas, dan dokumentasikan kontrak header `x-openclaw-scopes` secara eksplisit.
- Setelah pencocokan rute dan autentikasi, penangan biasa mengikuti penerimaan pekerjaan root Gateway. Gateway yang sedang dipersiapkan atau dimulai ulang mengembalikan `503` sebelum memanggil penangan. Pengecualian terbatasnya adalah rute `auth: "gateway"` yang diberi hak oleh manifes dan juga memilih permukaan `trusted-operator` khusus rute; rute tersebut tetap dapat dijangkau agar pengiriman kontrol penangguhan tidak terputus, sementara rute saudara biasa dari Plugin yang sama tetap berada di belakang batas penerimaan. Kepemilikan `handleUpgrade` WebSocket menggunakan batas penerimaan atomik yang sama; setelah penangan menerima soket, masa pakai soket selanjutnya menjadi milik Plugin dan tidak dilacak oleh batas ini.

## Jalur impor SDK Plugin

Gunakan subjalur SDK yang sempit alih-alih barrel root `openclaw/plugin-sdk` monolitik
saat membuat Plugin baru. Subjalur inti:

| Subjalur                            | Tujuan                                              |
| ----------------------------------- | --------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitif pendaftaran Plugin                         |
| `openclaw/plugin-sdk/channel-core`  | Pembantu entri/pembuatan kanal                      |
| `openclaw/plugin-sdk/core`          | Pembantu bersama generik dan kontrak payung         |
| `openclaw/plugin-sdk/config-schema` | Skema Zod `openclaw.json` root (`OpenClawSchema`)   |

Plugin kanal memilih dari keluarga seam yang sempit — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, dan `channel-actions`. Perilaku persetujuan sebaiknya disatukan
dalam satu kontrak `approvalCapability`, bukan dicampur di berbagai
kolom Plugin yang tidak terkait. Lihat [Plugin kanal](/id/plugins/sdk-channel-plugins).

Pembantu runtime dan konfigurasi berada di subjalur `*-runtime` terfokus yang sesuai
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, dan sebagainya). Utamakan `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot`, dan `config-mutation`
alih-alih barrel kompatibilitas `config-runtime` yang luas.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
fasad pembantu kanal kecil, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`,
dan `openclaw/plugin-sdk/infra-runtime` adalah shim kompatibilitas yang telah
usang untuk Plugin lama. Kode baru sebaiknya mengimpor primitif generik yang
lebih sempit sebagai gantinya.
</Info>

Titik masuk internal repo (per root paket Plugin bawaan):

- `index.js` — entri Plugin bawaan
- `api.js` — barrel pembantu/tipe
- `runtime-api.js` — barrel khusus runtime
- `setup-entry.js` — entri Plugin penyiapan

Plugin eksternal hanya boleh mengimpor subjalur `openclaw/plugin-sdk/*`. Jangan pernah
mengimpor `src/*` milik paket Plugin lain dari inti atau dari Plugin lain.
Titik masuk yang dimuat melalui fasad mengutamakan snapshot konfigurasi runtime aktif jika
tersedia, lalu beralih menggunakan berkas konfigurasi yang telah diurai di disk.

Subjalur khusus kapabilitas seperti `image-generation`, `media-understanding`,
dan `speech` tersedia karena Plugin bawaan menggunakannya saat ini. Subjalur tersebut
tidak otomatis menjadi kontrak eksternal jangka panjang yang dibekukan — periksa halaman
referensi SDK terkait ketika mengandalkannya.

## Skema alat pesan

Plugin sebaiknya memiliki kontribusi skema `describeMessageTool(...)` khusus kanal
untuk primitif nonpesan seperti reaksi, pembacaan, dan jajak pendapat.
Presentasi pengiriman bersama sebaiknya menggunakan kontrak generik `MessagePresentation`
alih-alih kolom tombol, komponen, blok, atau kartu asli penyedia.
Lihat [Presentasi Pesan](/id/plugins/message-presentation) untuk kontrak,
aturan fallback, pemetaan penyedia, dan daftar periksa pembuat Plugin.

Plugin yang mampu mengirim mendeklarasikan apa yang dapat dirender melalui kapabilitas pesan:

- `presentation` untuk blok presentasi semantik (`text`, `context`,
  `divider`, `chart`, `table`, `buttons`, `select`)
- `delivery-pin` untuk permintaan pengiriman yang disematkan

Inti menentukan apakah presentasi dirender secara asli atau diturunkan menjadi teks.
Jangan mengekspos jalan pintas UI asli penyedia dari alat pesan generik.
Pembantu SDK yang telah usang untuk skema asli lama tetap diekspor bagi Plugin
pihak ketiga yang sudah ada, tetapi Plugin baru tidak boleh menggunakannya.

## Resolusi target kanal

Plugin kanal sebaiknya memiliki semantik target khusus kanal. Pertahankan host
keluar bersama tetap generik dan gunakan permukaan adaptor perpesanan untuk aturan penyedia:

- `messaging.inferTargetChatType({ to })` menentukan apakah target yang dinormalisasi
  harus diperlakukan sebagai `direct`, `group`, atau `channel` sebelum pencarian direktori.
- `messaging.targetResolver.looksLikeId(raw, normalized)` memberi tahu inti apakah suatu
  input harus langsung menuju resolusi menyerupai ID alih-alih pencarian direktori.
- `messaging.targetResolver.reservedLiterals` mencantumkan kata polos yang merupakan
  referensi kanal/sesi untuk penyedia tersebut. Resolusi mempertahankan entri direktori
  yang dikonfigurasi sebelum menolak literal yang dicadangkan, lalu gagal secara tertutup
  jika pencarian direktori tidak menemukan hasil.
- `messaging.targetResolver.resolveTarget(...)` adalah fallback Plugin ketika
  inti memerlukan resolusi akhir milik penyedia setelah normalisasi atau setelah
  pencarian direktori tidak menemukan hasil.
- `messaging.resolveOutboundSessionRoute(...)` memiliki konstruksi rute sesi
  khusus penyedia setelah target diresolusi.

Pembagian yang disarankan:

- Gunakan `inferTargetChatType` untuk keputusan kategori yang harus dilakukan sebelum
  mencari rekan/grup.
- Gunakan `looksLikeId` untuk pemeriksaan "perlakukan ini sebagai ID target eksplisit/asli".
- Gunakan `resolveTarget` untuk fallback normalisasi khusus penyedia, bukan untuk
  pencarian direktori yang luas.
- Simpan ID asli penyedia seperti ID obrolan, ID utas, JID, handle, dan ID ruang
  di dalam nilai `target` atau parameter khusus penyedia, bukan di kolom SDK generik.

## Direktori berbasis konfigurasi

Plugin yang memperoleh entri direktori dari konfigurasi sebaiknya menyimpan logika tersebut di
Plugin dan menggunakan kembali pembantu bersama dari
`openclaw/plugin-sdk/directory-runtime`.

Gunakan ini ketika kanal memerlukan rekan/grup berbasis konfigurasi seperti:

- rekan pesan langsung yang ditentukan daftar izin
- peta kanal/grup yang dikonfigurasi
- fallback direktori statis dalam cakupan akun

Pembantu bersama di `directory-runtime` hanya menangani operasi generik:

- pemfilteran kueri
- penerapan batas
- pembantu deduplikasi/normalisasi
- pembuatan `ChannelDirectoryEntry[]`

Pemeriksaan akun dan normalisasi ID khusus kanal harus tetap berada dalam
implementasi Plugin.

## Katalog penyedia

Plugin penyedia dapat menentukan katalog model untuk inferensi dengan
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` mengembalikan bentuk yang sama dengan yang ditulis OpenClaw ke
`models.providers`:

- `{ provider }` untuk satu entri penyedia
- `{ providers }` untuk beberapa entri penyedia

Gunakan `catalog` ketika Plugin memiliki ID model khusus penyedia, URL dasar
bawaan, atau metadata model yang dibatasi autentikasi.

`catalog.order` mengontrol kapan katalog Plugin digabungkan relatif terhadap penyedia
implisit bawaan OpenClaw:

- `simple`: penyedia berbasis kunci API biasa atau variabel lingkungan
- `profile`: penyedia yang muncul ketika profil autentikasi tersedia
- `paired`: penyedia yang menyintesis beberapa entri penyedia terkait
- `late`: tahap terakhir, setelah penyedia implisit lainnya

Penyedia yang diproses belakangan menang saat terjadi benturan kunci, sehingga Plugin dapat
secara sengaja menimpa entri penyedia bawaan dengan ID penyedia yang sama.

Plugin juga dapat memublikasikan baris model hanya-baca melalui
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Ini adalah jalur ke depan untuk permukaan daftar/bantuan/pemilih dan mendukung
baris `text`, `voice`, `image_generation`, `video_generation`, dan `music_generation`.
Plugin penyedia tetap memiliki pemanggilan endpoint langsung, pertukaran token, dan
pemetaan respons vendor; inti memiliki bentuk baris umum, label sumber, dan
pemformatan bantuan alat media. Pendaftaran penyedia pembuatan media menyintesis
baris katalog statis secara otomatis dari `defaultModel`, `models`, dan
`capabilities`.

Kompatibilitas:

- `discovery` masih berfungsi sebagai alias lama, tetapi mengeluarkan peringatan keusangan
- jika `catalog` dan `discovery` keduanya didaftarkan, OpenClaw menggunakan `catalog`
  dan mengeluarkan peringatan
- `augmentModelCatalog` telah usang; penyedia bawaan sebaiknya memublikasikan
  baris tambahan melalui `registerModelCatalogProvider`

## Pemeriksaan kanal hanya-baca

Jika Plugin Anda mendaftarkan kanal, utamakan penerapan
`plugin.config.inspectAccount(cfg, accountId)` bersama `resolveAccount(...)`.

Alasannya:

- `resolveAccount(...)` adalah jalur runtime. Jalur ini boleh mengasumsikan kredensial
  telah diwujudkan sepenuhnya dan dapat langsung gagal ketika rahasia yang diperlukan tidak tersedia.
- Jalur perintah hanya-baca seperti `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, serta alur perbaikan
  doctor/konfigurasi seharusnya tidak perlu mewujudkan kredensial runtime hanya untuk
  mendeskripsikan konfigurasi.

Perilaku `inspectAccount(...)` yang disarankan:

- Hanya kembalikan status akun yang deskriptif.
- Pertahankan `enabled` dan `configured`.
- Sertakan kolom sumber/status kredensial jika relevan, seperti:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Anda tidak perlu mengembalikan nilai token mentah hanya untuk melaporkan
  ketersediaan baca-saja. Mengembalikan `tokenStatus: "available"` (beserta kolom
  sumber yang sesuai) sudah cukup untuk perintah bergaya status.
- Gunakan `configured_unavailable` ketika kredensial dikonfigurasi melalui SecretRef tetapi
  tidak tersedia di jalur perintah saat ini.

Hal ini memungkinkan perintah baca-saja melaporkan "dikonfigurasi tetapi tidak tersedia di jalur
perintah ini" alih-alih mengalami crash atau keliru melaporkan akun sebagai belum dikonfigurasi.

## Paket bundel

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

Setiap entri menjadi sebuah plugin. Jika bundel mencantumkan beberapa ekstensi, id plugin
menjadi `<manifestOrPackageName>/<fileBase>` (id manifes diprioritaskan jika
tersedia; jika tidak, nama `package.json` tanpa cakupan digunakan).

Jika plugin Anda mengimpor dependensi npm, instal dependensi tersebut di direktori itu agar
`node_modules` tersedia (`npm install` / `pnpm install`).

Pembatas keamanan: setiap entri `openclaw.extensions` harus tetap berada di dalam direktori plugin
setelah resolusi symlink. Entri yang keluar dari direktori paket akan
ditolak.

Catatan keamanan: `openclaw plugins install` menginstal dependensi plugin dengan
`npm install --omit=dev --ignore-scripts` lokal proyek (tanpa skrip siklus hidup,
tanpa dependensi pengembangan saat runtime), dengan mengabaikan pengaturan instalasi npm global yang diwariskan.
Pastikan pohon dependensi plugin berupa "JS/TS murni" dan hindari paket yang memerlukan
build `postinstall`.

Opsional: `openclaw.setupEntry` dapat menunjuk ke modul ringan khusus penyiapan.
Ketika OpenClaw membutuhkan permukaan penyiapan untuk plugin kanal yang dinonaktifkan, atau
ketika plugin kanal diaktifkan tetapi masih belum dikonfigurasi, OpenClaw memuat `setupEntry`
alih-alih entri plugin lengkap. Hal ini membuat proses awal dan penyiapan lebih ringan
ketika entri utama plugin Anda juga menghubungkan alat, hook, atau kode lain yang hanya
digunakan saat runtime.

Opsional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
dapat mengikutsertakan plugin kanal dalam jalur `setupEntry` yang sama selama fase proses awal
sebelum gateway mulai mendengarkan, meskipun kanal sudah dikonfigurasi.

Gunakan ini hanya ketika `setupEntry` sepenuhnya mencakup permukaan proses awal yang harus tersedia
sebelum gateway mulai mendengarkan. Dalam praktiknya, ini berarti entri penyiapan
harus mendaftarkan setiap kemampuan milik kanal yang menjadi dependensi proses awal, seperti:

- pendaftaran kanal itu sendiri
- setiap rute HTTP yang harus tersedia sebelum gateway mulai mendengarkan
- setiap metode gateway, alat, atau layanan yang harus tersedia selama rentang waktu yang sama

Jika entri lengkap Anda masih memiliki kemampuan proses awal apa pun yang diwajibkan, jangan aktifkan
flag ini. Pertahankan perilaku default plugin dan biarkan OpenClaw memuat
entri lengkap selama proses awal.

Kanal bawaan juga dapat menerbitkan helper permukaan kontrak khusus penyiapan yang dapat digunakan core
sebelum runtime kanal lengkap dimuat. Permukaan promosi penyiapan saat ini adalah:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core menggunakan permukaan tersebut saat perlu mempromosikan konfigurasi kanal satu akun lama
ke `channels.<id>.accounts.*` tanpa memuat entri plugin lengkap.
Matrix adalah contoh bawaan saat ini: Matrix hanya memindahkan kunci autentikasi/bootstrap ke
akun bernama yang dipromosikan ketika akun bernama sudah ada, dan dapat mempertahankan
kunci akun default nonkanonis yang telah dikonfigurasi alih-alih selalu membuat
`accounts.default`.

Adaptor patch penyiapan tersebut menjaga penemuan permukaan kontrak bawaan tetap lambat. Waktu impor
tetap ringan; permukaan promosi hanya dimuat saat pertama kali digunakan, bukan
memasuki kembali proses awal kanal bawaan saat impor modul.

Ketika permukaan proses awal tersebut menyertakan metode RPC gateway, pertahankan metode itu pada
prefiks khusus plugin. Namespace admin core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu diresolusikan
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

Plugin kanal dapat memublikasikan metadata penyiapan/penemuan melalui `openclaw.channel` dan
petunjuk instalasi melalui `openclaw.install`. Hal ini menjaga katalog core bebas data.

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

Kolom `openclaw.channel` yang berguna selain contoh minimal:

- `detailLabel`: label sekunder untuk permukaan katalog/status yang lebih lengkap
- `docsLabel`: mengganti teks tautan untuk tautan dokumentasi
- `preferOver`: id plugin/kanal berprioritas lebih rendah yang harus dikalahkan entri katalog ini
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrol teks permukaan pemilihan
- `markdownCapable`: menandai kanal sebagai mendukung markdown untuk keputusan pemformatan keluar
- `exposure.configured`: menyembunyikan kanal dari permukaan daftar kanal yang dikonfigurasi jika diatur ke `false`
- `exposure.setup`: menyembunyikan kanal dari pemilih penyiapan/konfigurasi interaktif jika diatur ke `false`
- `exposure.docs`: menandai kanal sebagai internal/privat untuk permukaan navigasi dokumentasi
- `showConfigured` / `showInSetup`: alias lama masih diterima untuk kompatibilitas; utamakan `exposure`
- `quickstartAllowFrom`: mengikutsertakan kanal dalam alur mulai cepat `allowFrom` standar
- `forceAccountBinding`: mewajibkan pengikatan akun secara eksplisit meskipun hanya ada satu akun
- `preferSessionLookupForAnnounceTarget`: mengutamakan pencarian sesi saat menentukan target pengumuman

OpenClaw juga dapat menggabungkan **katalog kanal eksternal** (misalnya, ekspor
registri MPM). Letakkan berkas JSON di salah satu lokasi berikut:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Atau arahkan `OPENCLAW_PLUGIN_CATALOG_PATHS` (atau `OPENCLAW_MPM_CATALOG_PATHS`) ke
satu atau beberapa berkas JSON (dipisahkan koma/titik koma/`PATH`). Setiap berkas harus
berisi `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser juga menerima `"packages"` atau `"plugins"` sebagai alias lama untuk kunci `"entries"`.

Entri katalog kanal dan entri katalog instalasi penyedia yang dihasilkan mengekspos
fakta sumber instalasi yang dinormalisasi di samping blok `openclaw.install` mentah. Fakta
yang dinormalisasi mengidentifikasi apakah spesifikasi npm merupakan versi pasti atau pemilih
mengambang, apakah metadata integritas yang diharapkan tersedia, dan apakah jalur
sumber lokal juga tersedia. Ketika identitas katalog/paket diketahui,
fakta yang dinormalisasi memperingatkan jika nama paket npm yang diurai menyimpang dari identitas tersebut.
Fakta tersebut juga memperingatkan ketika `defaultChoice` tidak valid atau menunjuk ke sumber yang
tidak tersedia, dan ketika metadata integritas npm tersedia tanpa sumber npm yang
valid. Konsumen harus memperlakukan `installSource` sebagai kolom opsional tambahan agar
entri buatan tangan dan shim katalog tidak perlu menyintesisnya.
Hal ini memungkinkan orientasi awal dan diagnostik menjelaskan status lapisan sumber tanpa
mengimpor runtime plugin.

Entri npm eksternal resmi harus mengutamakan `npmSpec` yang pasti beserta
`expectedIntegrity`. Nama paket polos dan dist-tag tetap berfungsi untuk
kompatibilitas, tetapi memunculkan peringatan lapisan sumber agar katalog dapat beralih
menuju instalasi tersemat yang diperiksa integritasnya tanpa merusak plugin yang sudah ada.
Ketika orientasi awal menginstal dari jalur katalog lokal, proses tersebut mencatat entri indeks
plugin terkelola dengan `source: "path"` dan `sourcePath` relatif terhadap workspace
jika memungkinkan. Jalur pemuatan operasional absolut tetap berada di
`plugins.load.paths`; catatan instalasi menghindari duplikasi jalur workstation lokal
ke dalam konfigurasi berumur panjang. Hal ini membuat instalasi pengembangan lokal tetap terlihat oleh
diagnostik lapisan sumber tanpa menambahkan permukaan pengungkapan jalur sistem berkas mentah
kedua. Tabel SQLite `installed_plugin_index` yang dipersistenkan merupakan sumber
kebenaran instalasi dan dapat disegarkan tanpa memuat modul runtime plugin.
Peta `installRecords` bersifat persisten meskipun manifes plugin hilang atau
tidak valid; payload `plugins` merupakan tampilan manifes yang dapat dibangun ulang.

## Plugin mesin konteks

Plugin mesin konteks memiliki orkestrasi konteks sesi untuk penyerapan, perakitan,
dan Compaction. Daftarkan dari plugin Anda dengan
`api.registerContextEngine(id, factory)`, lalu pilih mesin aktif dengan
`plugins.slots.contextEngine`.

Gunakan ini ketika plugin Anda perlu mengganti atau memperluas pipeline konteks
default, bukan sekadar menambahkan pencarian memori atau hook.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, sessionKey, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
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
untuk inisialisasi pada waktu konstruksi.

`assemble()` dapat mengembalikan `contextProjection` ketika harness aktif memiliki
utas backend persisten. Hilangkan kolom tersebut untuk proyeksi per giliran lama. Kembalikan
`{ mode: "thread_bootstrap", epoch }` ketika konteks yang dirakit harus
disuntikkan satu kali ke dalam utas backend dan digunakan kembali hingga epoch berubah. Ubah
epoch setelah konteks semantik mesin berubah, misalnya setelah proses
Compaction yang dimiliki mesin. Host dapat mempertahankan metadata pemanggilan alat, bentuk
input, dan hasil alat yang telah disunting dalam proyeksi bootstrap utas agar
utas backend baru mempertahankan kesinambungan alat tanpa menyalin payload mentah
yang mengandung rahasia.

Jika mesin Anda **tidak** memiliki algoritme Compaction, tetap implementasikan `compact()`
dan delegasikan secara eksplisit:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

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
    async assemble({ messages, sessionKey, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
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

Ketika sebuah plugin membutuhkan perilaku yang tidak sesuai dengan API saat ini, jangan melewati sistem plugin dengan mengakses bagian internal secara langsung. Tambahkan kapabilitas yang belum tersedia tersebut.

Urutan yang disarankan:

1. **Tentukan kontrak inti.** Putuskan perilaku bersama yang harus dimiliki inti:
   kebijakan, mekanisme cadangan, penggabungan konfigurasi, siklus hidup, semantik
   yang ditujukan untuk kanal, dan bentuk pembantu runtime.
2. **Tambahkan permukaan registrasi/runtime plugin bertipe.** Perluas
   `OpenClawPluginApi` dan/atau `api.runtime` dengan permukaan kapabilitas
   bertipe terkecil yang tetap berguna.
3. **Hubungkan inti serta konsumen kanal/fitur.** Kanal dan plugin fitur
   harus menggunakan kapabilitas baru melalui inti, bukan dengan mengimpor
   implementasi vendor secara langsung.
4. **Daftarkan implementasi vendor.** Plugin vendor kemudian mendaftarkan
   backend mereka pada kapabilitas tersebut.
5. **Tambahkan cakupan kontrak.** Tambahkan pengujian agar bentuk kepemilikan
   dan registrasi tetap eksplisit dari waktu ke waktu.

Dengan cara ini, OpenClaw tetap memiliki pendirian yang jelas tanpa menjadi
tertanam secara kaku pada cara pandang satu penyedia. Lihat
[Pedoman Praktis Kapabilitas](/id/plugins/adding-capabilities) untuk daftar periksa
berkas yang konkret dan contoh lengkap.

### Daftar periksa kapabilitas

Ketika Anda menambahkan kapabilitas baru, implementasinya biasanya harus
menyentuh permukaan berikut secara bersamaan:

- tipe kontrak inti di `src/<capability>/types.ts`
- pembantu runner/runtime inti di `src/<capability>/runtime.ts`
- permukaan registrasi API plugin di `src/plugins/types.ts`
- penghubungan registri plugin di `src/plugins/registry.ts`
- eksposur runtime plugin di `src/plugins/runtime/*` ketika plugin fitur/kanal
  perlu menggunakannya
- pembantu pencatatan/pengujian di `src/test-utils/plugin-registration.ts`
- pernyataan kepemilikan/kontrak di `src/plugins/contracts/registry.ts`
- dokumentasi operator/plugin di `docs/`

Jika salah satu permukaan tersebut tidak ada, biasanya itu merupakan tanda
bahwa kapabilitas tersebut belum terintegrasi sepenuhnya.

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

Pola pengujian kontrak (`src/plugins/contracts/registry.ts` mengekspos pencarian
kepemilikan seperti `providerContractPluginIds`; pengujian memastikan daftar
`contracts.videoGenerationProviders` milik sebuah plugin cocok dengan apa yang
sebenarnya didaftarkannya):

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

Hal tersebut menjaga aturan tetap sederhana:

- inti memiliki kontrak kapabilitas dan orkestrasi
- plugin vendor memiliki implementasi vendor
- plugin fitur/kanal menggunakan pembantu runtime
- pengujian kontrak menjaga kepemilikan tetap eksplisit

## Terkait

- [Arsitektur plugin](/id/plugins/architecture) — model dan bentuk kapabilitas publik
- [Subjalur SDK Plugin](/id/plugins/sdk-subpaths)
- [Penyiapan SDK Plugin](/id/plugins/sdk-setup)
- [Membangun plugin](/id/plugins/building-plugins)

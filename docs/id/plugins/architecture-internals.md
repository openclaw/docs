---
read_when:
    - Mengimplementasikan hook runtime penyedia, siklus hidup kanal, atau paket bundel
    - Men-debug urutan pemuatan plugin atau status registri
    - Menambahkan kapabilitas plugin baru atau plugin mesin konteks
summary: 'Internal arsitektur Plugin: pipeline pemuatan, registri, hook runtime, rute HTTP, dan tabel referensi'
title: Internal arsitektur Plugin
x-i18n:
    generated_at: "2026-07-19T05:17:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 38041d0b6bfab4beebdc724561921dfc08ef2d0aa6d1c949c751098ab98c7d14
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Untuk model kapabilitas publik, bentuk plugin, serta kontrak kepemilikan/eksekusi,
lihat [Arsitektur plugin](/id/plugins/architecture). Halaman ini membahas
mekanisme internal: pipeline pemuatan, registri, hook runtime, rute HTTP Gateway,
jalur impor, dan tabel skema.

## Pipeline pemuatan

Saat dimulai, OpenClaw secara garis besar melakukan hal berikut:

1. menemukan root plugin kandidat
2. membaca manifes bundel native atau kompatibel dan metadata paket
3. menolak kandidat yang tidak aman
4. menormalisasi konfigurasi plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. menentukan pengaktifan setiap kandidat
6. memuat modul native yang diaktifkan: modul bundel yang telah dibangun menggunakan pemuat native;
   kode sumber lokal TypeScript pihak ketiga menggunakan fallback Jiti darurat
7. memanggil hook native `register(api)` dan mengumpulkan pendaftaran ke dalam registri plugin
8. mengekspos registri ke perintah/permukaan runtime

<Note>
`activate` adalah alias lama untuk `register` — pemuat menangani mana pun yang tersedia (`def.register ?? def.activate`) dan memanggilnya pada titik yang sama. Semua plugin bundel menggunakan `register`; utamakan `register` untuk plugin baru.
</Note>

Gerbang keamanan dijalankan **sebelum** eksekusi runtime. Penemuan memblokir
kandidat ketika:

- entri yang telah diselesaikan keluar dari root plugin
- jalurnya (atau direktori root-nya) dapat ditulis oleh semua pengguna
- untuk plugin nonbundel, kepemilikan jalur tidak cocok dengan uid saat ini (atau root)

Direktori bundel yang dapat ditulis oleh semua pengguna terlebih dahulu menjalani percobaan perbaikan `chmod`
di tempat (instalasi npm/global dapat mengirimkan direktori paket pada `0777`) sebelum gerbang
memeriksa ulang; pemeriksaan kepemilikan sepenuhnya dilewati untuk asal bundel.

Kandidat yang diblokir tetap menyertakan id plugin dalam diagnostik yang dihasilkan ketika
id tersebut diketahui (termasuk id yang diselesaikan dari manifes di dalam direktori
yang ditolak karena alasan lain), sehingga konfigurasi yang merujuk id tersebut melihat plugin
yang diblokir dan dikaitkan dengan peringatan keamanan jalur, bukan galat "plugin tidak dikenal"
yang tidak terkait.

### Perilaku yang mengutamakan manifes

Manifes adalah sumber kebenaran bidang kontrol. OpenClaw menggunakannya untuk:

- mengidentifikasi plugin
- menemukan channel/Skills/skema konfigurasi atau kapabilitas bundel yang dideklarasikan
- memvalidasi `plugins.entries.<id>.config`
- melengkapi label/placeholder Control UI
- menampilkan metadata instalasi/katalog
- mempertahankan deskriptor aktivasi dan penyiapan yang ringan tanpa memuat runtime plugin

Untuk plugin native, modul runtime adalah bagian bidang data. Modul ini mendaftarkan
perilaku aktual seperti hook, alat, perintah, atau alur penyedia.

Blok manifes opsional `activation` dan `setup` tetap berada di bidang kontrol.
Keduanya merupakan deskriptor khusus metadata untuk perencanaan aktivasi dan penemuan penyiapan;
keduanya tidak menggantikan pendaftaran runtime, `register(...)`, atau `setupEntry`.
Konsumen aktivasi langsung menggunakan petunjuk perintah, channel, dan penyedia dari manifes untuk
mempersempit pemuatan plugin sebelum materialisasi registri yang lebih luas:

- pemuatan CLI dipersempit ke plugin yang memiliki perintah utama yang diminta
- resolusi penyiapan channel/plugin dipersempit ke plugin yang memiliki
  id channel yang diminta
- resolusi penyiapan/runtime penyedia eksplisit dipersempit ke plugin yang memiliki
  id penyedia yang diminta
- perencanaan saat Gateway dimulai menggunakan `activation.onStartup` untuk impor
  saat dimulai yang eksplisit; plugin tanpa metadata saat dimulai hanya dimuat melalui
  pemicu aktivasi yang lebih sempit

Perencana aktivasi menyediakan API khusus id bagi pemanggil yang ada dan
API rencana untuk diagnostik. Entri rencana melaporkan alasan plugin dipilih,
dengan memisahkan petunjuk eksplisit `activation.*` dari fallback kepemilikan manifes:

| Alasan (dari petunjuk `activation.*`)   | Alasan (dari kepemilikan manifes)                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `activation-agent-harness-hint`      | —                                                                                            |
| `activation-capability-hint`         | —                                                                                            |
| `activation-channel-hint`            | `manifest-channel-owner` (`channels`)                                                        |
| `activation-command-hint`            | `manifest-command-alias` (`commandAliases`)                                                  |
| `activation-provider-hint`           | `manifest-provider-owner` (`providers`), `manifest-setup-provider-owner` (`setup.providers`) |
| `activation-route-hint`              | —                                                                                            |
| — (pemicu hook tidak memiliki varian petunjuk) | `manifest-hook-owner` (`hooks`), `manifest-tool-contract` (`contracts.tools`)                |

Pemisahan alasan tersebut merupakan batas kompatibilitas: metadata plugin yang ada
tetap berfungsi, sedangkan kode baru dapat mendeteksi petunjuk luas atau perilaku fallback
tanpa mengubah semantik pemuatan runtime.

Prapemuatan runtime pada waktu permintaan yang meminta cakupan luas `all` tetap menurunkan
sekumpulan id plugin efektif yang eksplisit dari konfigurasi, perencanaan saat dimulai, channel
yang dikonfigurasi, slot, dan aturan pengaktifan otomatis
(`resolveEffectivePluginIds` dalam `src/plugins/effective-plugin-ids.ts`). Jika
kumpulan yang diturunkan tersebut kosong, OpenClaw mempertahankan cakupan tetap kosong alih-alih memperluasnya ke
setiap plugin yang dapat ditemukan.

Penemuan penyiapan mengutamakan id milik deskriptor seperti `setup.providers` dan
`setup.cliBackends` untuk mempersempit plugin kandidat sebelum beralih ke
`setup-api` sebagai fallback bagi plugin yang masih memerlukan hook runtime saat penyiapan. Daftar
penyiapan penyedia menggunakan `providerAuthChoices` dari manifes, pilihan penyiapan
yang diturunkan dari deskriptor, dan metadata katalog instalasi tanpa memuat runtime penyedia. Nilai eksplisit
`setup.requiresRuntime: false` merupakan batas khusus deskriptor; jika
`requiresRuntime` dihilangkan, fallback API penyiapan lama tetap dipertahankan demi kompatibilitas. Jika
lebih dari satu plugin yang ditemukan mengklaim penyedia penyiapan ternormalisasi atau
id backend CLI yang sama, pencarian penyiapan menolak pemilik yang ambigu alih-alih mengandalkan
urutan penemuan. Ketika runtime penyiapan dijalankan, diagnostik registri melaporkan
penyimpangan antara `setup.providers` / `setup.cliBackends` dan penyedia atau backend CLI
yang benar-benar didaftarkan oleh API penyiapan, tanpa memblokir plugin lama.

### Batas cache plugin

OpenClaw tidak menyimpan hasil penemuan plugin atau data registri manifes langsung
dalam cache berdasarkan jendela waktu nyata. Instalasi, pengeditan manifes, dan perubahan jalur pemuatan
harus terlihat pada pembacaan metadata eksplisit atau pembangunan ulang snapshot berikutnya.
Pengurai berkas manifes menyimpan cache tanda tangan berkas terbatas yang dikunci berdasarkan
jalur manifes yang dibuka beserta perangkat/inode, ukuran, dan mtime/ctime; cache tersebut hanya
menghindari penguraian ulang byte yang tidak berubah dan tidak boleh menyimpan jawaban penemuan, registri,
pemilik, atau kebijakan dalam cache.

Jalur cepat metadata yang aman adalah kepemilikan objek eksplisit, bukan cache tersembunyi.
Jalur sibuk saat Gateway dimulai harus meneruskan `PluginMetadataSnapshot` saat ini,
`PluginLookUpTable` yang diturunkan, atau registri manifes eksplisit melalui rantai
pemanggilan. Validasi konfigurasi, pengaktifan otomatis saat dimulai, bootstrap plugin, dan pemilihan
penyedia dapat menggunakan kembali objek tersebut selama objek itu merepresentasikan konfigurasi dan
inventaris plugin saat ini. Pencarian penyiapan tetap merekonstruksi metadata manifes sesuai permintaan
kecuali jalur penyiapan tertentu menerima registri manifes eksplisit; pertahankan
hal tersebut sebagai fallback jalur dingin, bukan menambahkan cache pencarian tersembunyi. Ketika
masukan berubah, bangun ulang dan ganti snapshot, bukan memutasinya atau
menyimpan salinan historis. Tampilan atas registri plugin aktif dan helper
bootstrap channel bundel harus dihitung ulang dari registri/root saat ini.
Peta berumur pendek dapat digunakan dalam satu pemanggilan untuk mendeduplikasi pekerjaan atau
mencegah masuk ulang; peta tersebut tidak boleh menjadi cache metadata proses.

Untuk pemuatan plugin, lapisan cache persisten adalah pemuatan runtime. Lapisan ini dapat menggunakan kembali
status pemuat ketika kode atau artefak yang diinstal benar-benar dimuat, seperti:

- `PluginLoaderCacheState` dan registri runtime aktif yang kompatibel
- cache jiti/modul dan cache pemuat permukaan publik yang digunakan untuk menghindari impor
  permukaan runtime yang sama secara berulang
- cache sistem berkas untuk artefak plugin yang diinstal
- peta per pemanggilan berumur pendek untuk normalisasi jalur atau resolusi duplikat

Cache tersebut merupakan detail implementasi bidang data. Cache tidak boleh menjawab
pertanyaan bidang kontrol seperti "plugin mana yang memiliki penyedia ini?" kecuali
pemanggil secara sengaja meminta pemuatan runtime.

Jangan tambahkan cache persisten atau berbasis waktu nyata untuk:

- hasil penemuan
- registri manifes langsung
- registri manifes yang direkonstruksi dari indeks plugin yang diinstal
- pencarian pemilik penyedia, penyembunyian model, kebijakan penyedia, atau metadata
  artefak publik
- jawaban turunan manifes lainnya yang mengharuskan perubahan manifes, indeks yang diinstal,
  atau jalur pemuatan terlihat pada pembacaan metadata berikutnya

Pemanggil yang membangun ulang metadata manifes dari indeks plugin terinstal yang dipersistenkan
merekonstruksi registri tersebut sesuai permintaan. Indeks terinstal adalah status bidang sumber
yang tahan lama; indeks tersebut bukan cache metadata dalam proses yang tersembunyi.

## Model registri

Plugin yang dimuat tidak secara langsung memutasi global inti secara acak. Plugin mendaftar ke
registri plugin pusat (`PluginRegistry` dalam `src/plugins/registry-types.ts`),
yang melacak rekaman plugin (identitas, sumber, asal, status, diagnostik)
serta larik untuk setiap kapabilitas: alat, hook lama dan hook bertipe,
channel, penyedia, handler RPC Gateway, rute HTTP, pendaftar CLI,
layanan latar belakang, perintah milik plugin, dan banyak keluarga penyedia bertipe
lainnya (ucapan, embedding, pembuatan gambar/video/musik, pengambilan/pencarian
web, harness agen, tindakan sesi, dan sebagainya).

Fitur inti kemudian membaca dari registri tersebut alih-alih berkomunikasi langsung dengan modul
plugin. Hal ini menjaga pemuatan tetap satu arah:

- modul plugin -> pendaftaran registri
- runtime inti -> konsumsi registri

Pemisahan tersebut penting bagi kemudahan pemeliharaan. Artinya, sebagian besar permukaan inti hanya
memerlukan satu titik integrasi: "baca registri", bukan "perlakukan setiap
modul plugin sebagai kasus khusus".

## Callback pengikatan percakapan

Plugin yang mengikat percakapan dapat bereaksi ketika persetujuan diselesaikan.

Gunakan `api.onConversationBindingResolved(...)` untuk menerima callback setelah permintaan pengikatan
disetujui atau ditolak:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Pengikatan kini tersedia untuk plugin + percakapan ini.
        console.log(event.binding?.conversationId);
        return;
      }

      // Permintaan ditolak; hapus semua status tertunda lokal.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Bidang payload callback:

- `status`: `"approved"` atau `"denied"`
- `decision`: `"allow-once"`, `"allow-always"`, atau `"deny"`
- `binding`: pengikatan yang diselesaikan untuk permintaan yang disetujui
- `request`: ringkasan permintaan asli, petunjuk pelepasan, id pengirim, dan
  metadata percakapan

Callback ini hanya untuk notifikasi. Callback ini tidak mengubah siapa yang diizinkan untuk mengikat
percakapan, dan dijalankan setelah penanganan persetujuan inti selesai.

## Hook runtime penyedia

Plugin penyedia memiliki tiga lapisan:

- **Metadata manifes** untuk pencarian murah sebelum runtime:
  `setup.providers[].envVars`, kompatibilitas usang `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices`, dan `channelEnvVars`.
- **Hook saat konfigurasi**: `catalog` (versi lama `discovery`) ditambah
  `applyConfigDefaults`.
- **Hook runtime**: 40+ hook opsional yang mencakup autentikasi, resolusi model,
  pembungkusan aliran, tingkat penalaran, kebijakan pemutaran ulang, dan endpoint penggunaan. Lihat
  [Urutan dan penggunaan hook](#hook-order-and-usage).

OpenClaw tetap menangani loop agen generik, failover, penanganan transkrip, dan
kebijakan alat. Hook ini merupakan permukaan ekstensi untuk perilaku khusus
penyedia tanpa memerlukan transport inferensi kustom sepenuhnya.

Gunakan `setup.providers[].envVars` manifes ketika penyedia memiliki kredensial berbasis
variabel lingkungan yang harus dapat dilihat oleh jalur autentikasi/status/pemilih model generik tanpa
memuat runtime plugin. `providerAuthEnvVars` yang usang masih dibaca oleh
adaptor kompatibilitas selama periode penghentian, dan plugin yang tidak dibundel
yang menggunakannya menerima diagnostik manifes. Gunakan `providerAuthAliases`
manifes ketika satu ID penyedia harus menggunakan kembali variabel lingkungan, profil autentikasi,
autentikasi berbasis konfigurasi, dan pilihan onboarding kunci API dari ID penyedia lain. Gunakan
`providerAuthChoices` manifes ketika permukaan CLI onboarding/pilihan autentikasi harus mengetahui
ID pilihan penyedia, label grup, dan pengaturan autentikasi satu flag sederhana tanpa
memuat runtime penyedia. Pertahankan `envVars`
runtime penyedia untuk petunjuk yang ditujukan kepada operator, seperti label onboarding atau variabel
penyiapan client-id/client-secret OAuth.

Gunakan `channelEnvVars` manifes ketika saluran memiliki autentikasi atau penyiapan berbasis
variabel lingkungan yang harus dapat dilihat oleh fallback variabel lingkungan shell generik, pemeriksaan konfigurasi/status,
atau prompt penyiapan tanpa memuat runtime saluran.

### Urutan dan penggunaan hook

Untuk plugin model/penyedia, OpenClaw memanggil hook kurang lebih dalam urutan berikut.
Kolom "Kapan digunakan" merupakan panduan pengambilan keputusan cepat.
Kolom penyedia khusus kompatibilitas yang tidak lagi dipanggil oleh OpenClaw, seperti
`ProviderPlugin.capabilities` dan `suppressBuiltInModel`, sengaja tidak
dicantumkan di sini.

| Hook                              | Fungsinya                                                                                                      | Kapan digunakan                                                                                                                               |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                         | Publikasikan konfigurasi penyedia ke `models.providers` selama pembuatan `models.json`                         | Penyedia memiliki katalog atau nilai default URL dasar                                                                                        |
| `applyConfigDefaults`             | Terapkan nilai default konfigurasi global milik penyedia selama materialisasi konfigurasi                      | Nilai default bergantung pada mode autentikasi, lingkungan, atau semantik keluarga model penyedia                                              |
| _(pencarian model bawaan)_        | OpenClaw mencoba jalur registri/katalog normal terlebih dahulu                                                 | _(bukan hook plugin)_                                                                                                                          |
| `normalizeModelId`                | Normalisasikan alias ID model lama atau pratinjau sebelum pencarian                                            | Penyedia menangani pembersihan alias sebelum resolusi model kanonis                                                                           |
| `normalizeTransport`              | Normalisasikan `api` / `baseUrl` keluarga penyedia sebelum perakitan model generik                             | Penyedia menangani pembersihan transport untuk ID penyedia khusus dalam keluarga transport yang sama                                          |
| `normalizeConfig`                 | Normalisasikan `models.providers.<id>` sebelum resolusi runtime/penyedia                                        | Penyedia memerlukan pembersihan konfigurasi yang seharusnya berada dalam plugin; pembantu keluarga Google yang dibundel juga mencadangkan entri konfigurasi Google yang didukung |
| `applyNativeStreamingUsageCompat` | Terapkan penulisan ulang kompatibilitas penggunaan streaming native pada penyedia konfigurasi                  | Penyedia memerlukan perbaikan metadata penggunaan streaming native yang ditentukan oleh endpoint                                               |
| `resolveConfigApiKey`             | Selesaikan autentikasi penanda lingkungan untuk penyedia konfigurasi sebelum pemuatan autentikasi runtime      | Penyedia mengekspos hook resolusi kunci API penanda lingkungannya sendiri                                                                      |
| `resolveSyntheticAuth`            | Tampilkan autentikasi lokal/yang dihosting sendiri atau berbasis konfigurasi tanpa menyimpan teks biasa        | Penyedia dapat beroperasi dengan penanda kredensial sintetis/lokal                                                                             |
| `resolveExternalAuthProfiles`     | Lapiskan profil autentikasi eksternal milik penyedia; `persistence` default adalah `runtime-only` untuk kredensial milik CLI/aplikasi | Penyedia menggunakan kembali kredensial autentikasi eksternal tanpa menyimpan salinan token penyegaran; deklarasikan `contracts.externalAuthProviders` dalam manifes |
| `shouldDeferSyntheticProfileAuth` | Turunkan prioritas placeholder profil sintetis tersimpan di bawah autentikasi berbasis lingkungan/konfigurasi  | Penyedia menyimpan profil placeholder sintetis yang tidak boleh mengungguli prioritas lainnya                                                  |
| `resolveDynamicModel`             | Fallback sinkron untuk ID model milik penyedia yang belum ada dalam registri lokal                             | Penyedia menerima ID model upstream arbitrer                                                                                                  |
| `prepareDynamicModel`             | Pemanasan asinkron, lalu `resolveDynamicModel` dijalankan lagi                                                 | Penyedia memerlukan metadata jaringan sebelum menyelesaikan ID yang tidak dikenal                                                              |
| `normalizeResolvedModel`          | Penulisan ulang akhir sebelum runner tertanam menggunakan model yang telah diselesaikan                        | Penyedia memerlukan penulisan ulang transport tetapi tetap menggunakan transport inti                                                         |
| `normalizeToolSchemas`            | Normalisasikan skema alat sebelum runner tertanam melihatnya                                                   | Penyedia memerlukan pembersihan skema keluarga transport                                                                                       |
| `inspectToolSchemas`              | Tampilkan diagnostik skema milik penyedia setelah normalisasi                                                  | Penyedia menginginkan peringatan kata kunci tanpa mengajarkan aturan khusus penyedia kepada inti                                               |
| `resolveReasoningOutputMode`      | Pilih kontrak keluaran penalaran native atau bertag                                                            | Penyedia memerlukan keluaran penalaran/akhir bertag sebagai pengganti bidang native                                                            |
| `prepareExtraParams`              | Normalisasi parameter permintaan sebelum pembungkus opsi stream generik                                        | Penyedia memerlukan parameter permintaan default atau pembersihan parameter per penyedia                                                       |
| `createStreamFn`                  | Ganti sepenuhnya jalur stream normal dengan transport khusus                                                   | Penyedia memerlukan protokol kabel khusus, bukan sekadar pembungkus                                                                            |
| `wrapStreamFn`                    | Pembungkus stream setelah pembungkus generik diterapkan                                                        | Penyedia memerlukan pembungkus kompatibilitas header/bodi/model permintaan tanpa transport khusus                                              |
| `resolveTransportTurnState`       | Lampirkan header atau metadata transport native per giliran                                                    | Penyedia menginginkan transport generik mengirim identitas giliran native penyedia                                                             |
| `resolveWebSocketSessionPolicy`   | Lampirkan header WebSocket native atau kebijakan masa jeda sesi                                                | Penyedia menginginkan transport WS generik menyetel header sesi atau kebijakan fallback                                                        |
| `formatApiKey`                    | Pemformat profil autentikasi: profil tersimpan menjadi string `apiKey` runtime                                  | Penyedia menyimpan metadata autentikasi tambahan dan memerlukan bentuk token runtime khusus                                                    |
| `refreshOAuth`                    | Penggantian penyegaran OAuth untuk endpoint penyegaran khusus atau kebijakan kegagalan penyegaran              | Penyedia tidak sesuai dengan penyegar bersama OpenClaw                                                                                         |
| `buildAuthDoctorHint`             | Petunjuk perbaikan yang ditambahkan ketika penyegaran OAuth gagal                                              | Penyedia memerlukan panduan perbaikan autentikasi milik penyedia setelah kegagalan penyegaran                                                  |
| `matchesContextOverflowError`     | Pencocok luapan jendela konteks milik penyedia                                                                 | Penyedia memiliki kesalahan luapan mentah yang tidak akan terdeteksi oleh heuristik generik                                                    |
| `classifyFailoverReason`          | Klasifikasi alasan failover milik penyedia                                                                     | Penyedia dapat memetakan kesalahan API/transport mentah ke pembatasan laju/beban berlebih/dll.                                                 |
| `isCacheTtlEligible`              | Kebijakan cache prompt untuk penyedia proksi/backhaul                                                          | Penyedia memerlukan pembatasan TTL cache khusus proksi                                                                                         |
| `buildMissingAuthMessage`         | Pengganti pesan pemulihan autentikasi yang hilang secara generik                                               | Penyedia memerlukan petunjuk pemulihan autentikasi yang hilang khusus penyedia                                                                |
| `augmentModelCatalog`             | Baris katalog sintetis/akhir yang ditambahkan setelah penemuan (tidak digunakan lagi, lihat di bawah)          | Penyedia memerlukan baris kompatibilitas maju sintetis dalam `models list` dan pemilih                                                         |
| `resolveThinkingProfile`          | Kumpulan tingkat `/think` khusus model, label tampilan, dan nilai default                                      | Penyedia mengekspos jenjang pemikiran khusus atau label biner untuk model yang dipilih                                                         |
| `isBinaryThinking`                | Hook kompatibilitas pengalih penalaran aktif/nonaktif                                                          | Penyedia hanya mengekspos pemikiran biner aktif/nonaktif                                                                                       |
| `supportsXHighThinking`           | Hook kompatibilitas dukungan penalaran `xhigh`                                                                | Penyedia menginginkan `xhigh` hanya pada sebagian model                                                                                       |
| `resolveDefaultThinkingLevel`     | Hook kompatibilitas tingkat `/think` default                                                                   | Penyedia memiliki kebijakan `/think` default untuk suatu keluarga model                                                                       |
| `isModernModelRef`                | Pencocok model modern untuk filter profil langsung dan pemilihan smoke                                        | Penyedia menangani pencocokan model pilihan untuk pengujian langsung/smoke                                                                    |
| `prepareRuntimeAuth`              | Tukarkan kredensial yang dikonfigurasi menjadi token/kunci runtime aktual tepat sebelum inferensi              | Penyedia memerlukan pertukaran token atau kredensial permintaan berumur pendek                                                                |
| `resolveUsageAuth`                | Selesaikan kredensial penggunaan/penagihan untuk `/usage` dan permukaan status terkait                         | Penyedia memerlukan penguraian token penggunaan/kuota khusus atau kredensial penggunaan yang berbeda                                          |
| `fetchUsageSnapshot`              | Ambil dan normalisasikan snapshot penggunaan/kuota khusus penyedia setelah autentikasi diselesaikan            | Penyedia memerlukan endpoint penggunaan khusus penyedia atau pengurai payload                                                                 |
| `createEmbeddingProvider`         | Buat adaptor embedding milik penyedia untuk memori/pencarian                                                     | Perilaku embedding memori berada dalam Plugin penyedia                                                                                    |
| `buildReplayPolicy`               | Kembalikan kebijakan pemutaran ulang yang mengontrol penanganan transkrip untuk penyedia                                        | Penyedia memerlukan kebijakan transkrip khusus (misalnya, penghapusan blok pemikiran)                                                               |
| `sanitizeReplayHistory`           | Tulis ulang riwayat pemutaran ulang setelah pembersihan transkrip generik                                                        | Penyedia memerlukan penulisan ulang pemutaran ulang khusus penyedia di luar pembantu Compaction bersama                                                             |
| `validateReplayTurns`             | Validasi atau bentuk ulang giliran pemutaran ulang terakhir sebelum runner tertanam                                           | Transportasi penyedia memerlukan validasi giliran yang lebih ketat setelah sanitasi generik                                                                    |
| `onModelSelected`                 | Jalankan efek samping pascapemilihan milik penyedia                                                                 | Penyedia memerlukan telemetri atau status milik penyedia saat model menjadi aktif                                                                  |

`normalizeModelId`, `normalizeTransport`, dan `normalizeConfig` pertama-tama memeriksa
plugin penyedia yang cocok, lalu beralih ke plugin penyedia lain yang mendukung hook
hingga salah satunya benar-benar mengubah id model atau transportasi/konfigurasi. Hal ini menjaga
shim penyedia alias/kompatibilitas tetap berfungsi tanpa mengharuskan pemanggil mengetahui plugin
bawaan mana yang memiliki penulisan ulang tersebut. Jika tidak ada hook penyedia yang menulis ulang entri
konfigurasi keluarga Google yang didukung, penormal konfigurasi Google bawaan tetap menerapkan
pembersihan kompatibilitas tersebut.

Jika penyedia memerlukan protokol wire yang sepenuhnya khusus atau eksekutor permintaan khusus,
itu merupakan kelas ekstensi yang berbeda. Hook ini ditujukan untuk perilaku penyedia
yang tetap berjalan pada loop inferensi normal OpenClaw.

`resolveUsageAuth` menentukan apakah OpenClaw harus memanggil `fetchUsageSnapshot` atau
kembali ke resolusi kredensial generik untuk permukaan penggunaan/status. Kembalikan
`{ token, accountId?, subscriptionType?, rateLimitTier? }` saat penyedia
memiliki kredensial penggunaan (metadata paket opsional mengalir ke
`fetchUsageSnapshot`), kembalikan
`{ handled: true }` saat autentikasi penggunaan milik penyedia telah menangani permintaan dan
harus menekan fallback kunci API/OAuth generik, dan kembalikan `null` atau `undefined`
saat penyedia tidak menangani autentikasi penggunaan.

Deklarasikan kredensial organisasi atau penagihan dalam manifes
`providerUsageAuthEnvVars`. Ini memungkinkan permukaan penemuan generik dan pembersihan rahasia
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
autentikasi, pemikiran, pemutaran ulang, dan penggunaan setiap vendor. Kumpulan hook otoritatif berada
bersama setiap plugin di bawah `extensions/`; halaman ini mengilustrasikan bentuknya, bukan
mencerminkan daftarnya.

<AccordionGroup>
  <Accordion title="Penyedia katalog pass-through">
    OpenRouter, Kilocode, Z.AI, xAI mendaftarkan `catalog` beserta
    `resolveDynamicModel` / `prepareDynamicModel` agar dapat menampilkan id model
    hulu sebelum katalog statis OpenClaw.
  </Accordion>
  <Accordion title="Penyedia endpoint OAuth dan penggunaan">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai memasangkan
    `prepareRuntimeAuth` atau `formatApiKey` dengan `resolveUsageAuth` +
    `fetchUsageSnapshot` untuk memiliki pertukaran token dan integrasi `/usage`.
  </Accordion>
  <Accordion title="Keluarga pembersihan pemutaran ulang dan transkrip">
    Keluarga bernama bersama (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) memungkinkan penyedia mengaktifkan
    kebijakan transkrip melalui `buildReplayPolicy`, alih-alih setiap plugin
    mengimplementasikan ulang pembersihan.
  </Accordion>
  <Accordion title="Penyedia khusus katalog">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway`, dan
    `volcengine` hanya mendaftarkan `catalog` dan menggunakan loop inferensi bersama.
  </Accordion>
  <Accordion title="Pembantu stream khusus Anthropic">
    Header beta, `/fast` / `serviceTier`, dan `context1m` berada di dalam
    seam publik `api.ts` / `contract-api.ts` milik plugin Anthropic
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
- Menggunakan konfigurasi dan pemilihan penyedia `messages.tts` inti.
- Mengembalikan buffer audio PCM + laju sampel. Plugin harus melakukan pengambilan sampel ulang/pengodean untuk penyedia.
- `listVoices` bersifat opsional per penyedia. Gunakan untuk pemilih suara atau alur penyiapan milik vendor.
- Inti meneruskan tenggat permintaan yang telah diresolusi ke hook `listVoices` penyedia; pengaturan batas waktu khusus penyedia dapat menimpanya.
- Daftar suara dapat menyertakan metadata yang lebih kaya seperti lokal, gender, dan tag kepribadian untuk pemilih yang memahami penyedia.
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
- Input Microsoft lama `edge` dinormalisasi menjadi id penyedia `microsoft`.
- Model kepemilikan yang diutamakan berorientasi pada perusahaan: satu plugin vendor dapat memiliki
  penyedia teks, ucapan, gambar, dan media mendatang saat OpenClaw menambahkan
  kontrak kapabilitas tersebut.

Untuk pemahaman gambar/audio/video, plugin mendaftarkan satu penyedia
pemahaman media bertipe, bukan kumpulan kunci/nilai generik:

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

- Pertahankan orkestrasi, fallback, konfigurasi, dan pengabelan saluran di inti.
- Pertahankan perilaku vendor di plugin penyedia.
- Perluasan aditif harus tetap bertipe: metode opsional baru, bidang hasil
  opsional baru, kapabilitas opsional baru.
- Pembuatan video sudah mengikuti pola yang sama:
  - inti memiliki kontrak kapabilitas dan pembantu runtime
  - plugin vendor mendaftarkan `api.registerVideoGenerationProvider(...)`
  - plugin fitur/saluran menggunakan `api.runtime.videoGeneration.*`

Untuk pembantu runtime pemahaman media, plugin dapat memanggil:

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

Untuk transkripsi audio, plugin dapat menggunakan runtime pemahaman media
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

- `api.runtime.mediaUnderstanding.*` adalah permukaan bersama yang diutamakan untuk
  pemahaman gambar/audio/video.
- `extractStructuredWithModel(...)` adalah seam yang menghadap plugin untuk ekstraksi
  berbatas dan berorientasi gambar yang dimiliki penyedia. Sertakan setidaknya satu input gambar;
  input teks merupakan konteks tambahan. Plugin produk memiliki rute dan
  skemanya, sementara OpenClaw memiliki batas penyedia/runtime.
- Menggunakan konfigurasi audio pemahaman media inti (`tools.media.audio`) dan urutan fallback penyedia.
- Mengembalikan `{ text: undefined }` saat tidak ada keluaran transkripsi yang dihasilkan (misalnya input dilewati/tidak didukung).
- `api.runtime.stt.transcribeAudioFile(...)` tetap tersedia sebagai alias kompatibilitas.

Plugin juga dapat meluncurkan proses subagen latar belakang melalui `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  toolsAlsoAllow: ["my_plugin_progress"],
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Catatan:

- `provider` dan `model` adalah penimpaan opsional per proses, bukan perubahan sesi persisten.
- `toolsAlsoAllow` menerima nama alat yang tepat dan dimiliki secara unik, yang didaftarkan oleh plugin pemanggil. Nama inti dan ambigu ditolak. Ini bersifat aditif terhadap profil normal, tetapi daftar izin dan penolakan operator tetap otoritatif.
- OpenClaw hanya menghormati bidang penimpaan tersebut untuk pemanggil tepercaya.
- Untuk proses fallback milik plugin, operator harus ikut serta melalui `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Gunakan `plugins.entries.<id>.subagent.allowedModels` untuk membatasi plugin tepercaya pada target `provider/model` kanonis tertentu, atau `"*"` untuk secara eksplisit mengizinkan target apa pun.
- Proses subagen plugin yang tidak tepercaya tetap berfungsi, tetapi permintaan penimpaan ditolak alih-alih secara diam-diam menggunakan fallback.
- Sesi subagen yang dibuat plugin diberi tag dengan id plugin pembuatnya. Fallback `api.runtime.subagent.deleteSession(...)` hanya dapat menghapus sesi yang dimiliki tersebut; penghapusan sesi arbitrer tetap memerlukan permintaan Gateway dengan cakupan admin.

Untuk pencarian web, plugin dapat menggunakan pembantu runtime bersama alih-alih
mengakses langsung pengabelan alat agen:

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
- `api.runtime.webSearch.*` adalah permukaan bersama yang diutamakan untuk plugin fitur/channel yang memerlukan perilaku pencarian tanpa bergantung pada pembungkus alat agen.

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

- `generate(...)`: hasilkan gambar menggunakan rantai penyedia pembuatan gambar yang dikonfigurasi.
- `listProviders(...)`: cantumkan penyedia pembuatan gambar yang tersedia beserta kemampuannya.

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

- `path`: jalur rute di bawah server HTTP gateway.
- `auth`: wajib, `"gateway"` atau `"plugin"`. Gunakan `"gateway"` untuk mewajibkan autentikasi gateway normal, atau `"plugin"` untuk autentikasi/verifikasi webhook yang dikelola plugin.
- `match`: opsional. `"exact"` (default) atau `"prefix"`.
- `handleUpgrade`: handler opsional untuk permintaan peningkatan WebSocket pada rute yang sama.
- `replaceExisting`: opsional. Memungkinkan plugin yang sama mengganti pendaftaran rutenya sendiri yang sudah ada.
- `handler`: kembalikan `true` ketika rute menangani permintaan.

Catatan:

- `api.registerHttpHandler(...)` telah dihapus dan akan menyebabkan kesalahan pemuatan plugin. Gunakan `api.registerHttpRoute(...)` sebagai gantinya.
- Rute plugin harus mendeklarasikan `auth` secara eksplisit.
- Konflik `path + match` yang sama persis ditolak kecuali `replaceExisting: true`, dan satu plugin tidak dapat mengganti rute milik plugin lain.
- Rute yang tumpang tindih dengan tingkat `auth` berbeda ditolak. Pertahankan rantai fallthrough `exact`/`prefix` hanya pada tingkat autentikasi yang sama.
- Rute `auth: "plugin"` **tidak** menerima cakupan runtime operator secara otomatis. Rute tersebut ditujukan untuk webhook/verifikasi tanda tangan yang dikelola plugin, bukan pemanggilan pembantu Gateway dengan hak istimewa.
- Rute `auth: "gateway"` berjalan di dalam cakupan runtime permintaan Gateway. Permukaan default (`gatewayRuntimeScopeSurface: "write-default"`) sengaja dibuat konservatif:
  - autentikasi bearer rahasia bersama (`gateway.auth.mode = "token"` / `"password"`) dan metode autentikasi apa pun yang bukan proksi tepercaya mendapatkan satu cakupan `operator.write`, meskipun pemanggil mengirim `x-openclaw-scopes`
  - pemanggil `trusted-proxy` tanpa header `x-openclaw-scopes` eksplisit juga tetap menggunakan permukaan lama yang hanya `operator.write`
  - pemanggil `trusted-proxy` yang mengirim `x-openclaw-scopes` mendapatkan cakupan yang dideklarasikan sebagai gantinya
  - rute dapat memilih `gatewayRuntimeScopeSurface: "trusted-operator"` agar selalu mematuhi `x-openclaw-scopes` untuk mode autentikasi yang membawa identitas (kembali ke kumpulan cakupan default CLI lengkap jika header tidak ada)
- Tab Control UI eksternal tersandbox yang didukung oleh rute `auth: "gateway"` menggunakan pemberian cookie bertanda tangan berumur pendek yang hanya dibuat melalui bootstrap terautentikasi; tab dengan autentikasi plugin tetap menggunakan jalur iframe langsungnya. Sebelum memasang, induk menjalankan pemeriksaan milik rute di dalam sandbox opak yang sama dan gagal secara tertutup ketika kebijakan privasi browser memblokir cookie. Pemberian tersebut terikat pada plugin pemilik, akar rute yang cocok, dan generasi autentikasi saat ini; nama cookie acak per proses mencegah Gateway tepercaya pada host yang sama saling menimpa, tetapi cookie tidak pernah mengisolasi port TCP. Oleh karena itu, nama host Gateway merupakan satu batas kredensial: jangan tempatkan bersama layanan yang tidak saling tepercaya pada nama host tersebut, termasuk pada port lain. Pengiriman rute menolak penggunaan ulang terhadap rute bertingkat yang dimiliki plugin lain. Karena turunan sandbox dianggap lintas situs untuk keperluan cookie, pemberian hanya menerima `GET` dan `HEAD` dengan `operator.read`; mutasi dan peningkatan WebSocket tetap berada pada permukaan yang diautentikasi Gateway secara eksplisit. Cookie sengaja tidak dapat menggunakan CHIPS: browser saat ini menyertakan bit leluhur lintas situs dalam kunci partisi, sehingga bingkai sandbox opak bertingkat akan kehilangan akses ke aset pada rute yang sama. Cookie memerlukan konteks aman dan izin browser untuk cookie lintas situs, sehingga tab eksternal dengan autentikasi gateway tidak tersedia pada origin LAN HTTP biasa atau ketika cookie pihak ketiga diblokir sepenuhnya; gunakan HTTPS/Tailscale Serve atau loopback yang dipercaya browser dengan kebijakan cookie yang kompatibel.
- Pemberian tersebut mencegah pengungkapan token bearer Gateway dan penggunaan ulang rute/cakupan yang tidak disengaja; pemberian ini tidak menciptakan batas keamanan antara plugin native. Kode plugin native dan konten UI yang disajikannya tetap menjadi bagian dari batas plugin dalam proses tepercaya yang sama.
- Aturan praktis: jangan menganggap rute plugin dengan autentikasi gateway sebagai permukaan admin implisit. Jika rute Anda memerlukan perilaku khusus admin, pilih permukaan cakupan `trusted-operator`, wajibkan mode autentikasi yang membawa identitas, dan dokumentasikan kontrak header `x-openclaw-scopes` secara eksplisit.
- Setelah pencocokan rute dan autentikasi, handler biasa berpartisipasi dalam penerimaan pekerjaan akar Gateway. Gateway yang disiapkan atau sedang dimulai ulang mengembalikan `503` sebelum memanggil handler. Pengecualian terbatasnya adalah rute `auth: "gateway"` yang diberi hak melalui manifes dan juga memilih permukaan khusus rute `trusted-operator`; rute tersebut tetap dapat dijangkau agar pengiriman kontrol penangguhan tidak terputus, sedangkan rute biasa lain dari plugin yang sama tetap berada di balik batas penerimaan. Kepemilikan `handleUpgrade` WebSocket menggunakan batas penerimaan atomik yang sama; setelah handler menerima soket, masa pakai soket berikutnya dimiliki plugin dan tidak dilacak oleh batas ini.

## Jalur impor SDK Plugin

Gunakan subjalur SDK yang spesifik alih-alih barrel root `openclaw/plugin-sdk` monolitik
saat membuat plugin baru. Subjalur core:

| Subjalur                            | Tujuan                                             |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitif pendaftaran plugin                        |
| `openclaw/plugin-sdk/channel-core`  | Pembantu entri/build channel                       |
| `openclaw/plugin-sdk/core`          | Pembantu bersama generik dan kontrak payung        |
| `openclaw/plugin-sdk/config-schema` | Skema Zod `openclaw.json` root (`OpenClawSchema`) |

Plugin channel memilih dari keluarga seam yang spesifik — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, dan `channel-actions`. Perilaku persetujuan sebaiknya dikonsolidasikan
pada satu kontrak `approvalCapability`, bukan dicampurkan di berbagai
bidang plugin yang tidak terkait. Lihat [Plugin channel](/id/plugins/sdk-channel-plugins).

Pembantu runtime dan konfigurasi berada di bawah subjalur `*-runtime` terfokus yang sesuai
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, dan sebagainya). Utamakan `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot`, dan `config-mutation`
alih-alih barrel kompatibilitas `config-runtime` yang luas.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
fasad pembantu channel kecil, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`,
dan `openclaw/plugin-sdk/infra-runtime` adalah shim kompatibilitas yang tidak digunakan lagi untuk
plugin lama. Kode baru sebaiknya mengimpor primitif generik yang lebih spesifik sebagai gantinya.
</Info>

Titik masuk internal repo (per root paket plugin bawaan):

- `index.js` — entri plugin bawaan
- `api.js` — barrel pembantu/tipe
- `runtime-api.js` — barrel khusus runtime
- `setup-entry.js` — entri plugin penyiapan

Plugin eksternal hanya boleh mengimpor subjalur `openclaw/plugin-sdk/*`. Jangan pernah
mengimpor `src/*` dari paket plugin lain melalui core atau plugin lain.
Titik masuk yang dimuat melalui fasad mengutamakan snapshot konfigurasi runtime aktif jika
tersedia, kemudian kembali ke berkas konfigurasi yang telah diresolusi pada disk.

Subjalur khusus kemampuan seperti `image-generation`, `media-understanding`,
dan `speech` tersedia karena saat ini digunakan oleh plugin bawaan. Subjalur tersebut tidak
secara otomatis menjadi kontrak eksternal jangka panjang yang dibekukan — periksa halaman referensi SDK
yang relevan saat mengandalkannya.

## Skema alat pesan

Plugin sebaiknya memiliki kontribusi skema `describeMessageTool(...)`
khusus channel untuk primitif nonpesan seperti reaksi, pembacaan, dan jajak pendapat.
Presentasi pengiriman bersama sebaiknya menggunakan kontrak generik `MessagePresentation`
alih-alih bidang tombol, komponen, blok, atau kartu native penyedia.
Lihat [Presentasi Pesan](/id/plugins/message-presentation) untuk kontrak,
aturan fallback, pemetaan penyedia, dan daftar periksa pembuat plugin.

Plugin berkemampuan kirim mendeklarasikan hal yang dapat dirender melalui kemampuan pesan:

- `presentation` untuk blok presentasi semantik (`text`, `context`,
  `divider`, `chart`, `table`, `buttons`, `select`)
- `delivery-pin` untuk permintaan pengiriman yang disematkan

Core menentukan apakah presentasi dirender secara native atau diturunkan menjadi teks.
Jangan mengekspos jalan keluar UI native penyedia dari alat pesan generik.
Pembantu SDK yang tidak digunakan lagi untuk skema native lama tetap diekspor bagi plugin
pihak ketiga yang sudah ada, tetapi plugin baru tidak boleh menggunakannya.

## Resolusi target channel

Plugin channel sebaiknya memiliki semantik target khusus channel. Pertahankan host
keluar bersama tetap generik dan gunakan permukaan adaptor perpesanan untuk aturan penyedia:

- `messaging.inferTargetChatType({ to })` menentukan apakah target yang dinormalisasi
  harus diperlakukan sebagai `direct`, `group`, atau `channel` sebelum pencarian direktori.
- `messaging.targetResolver.looksLikeId(raw, normalized)` memberi tahu core apakah
  input harus langsung menuju resolusi mirip ID alih-alih pencarian direktori.
- `messaging.targetResolver.reservedLiterals` mencantumkan kata-kata polos yang merupakan
  referensi channel/sesi untuk penyedia tersebut. Resolusi mempertahankan entri
  direktori yang dikonfigurasi sebelum menolak literal yang dicadangkan, lalu gagal secara tertutup ketika
  tidak ditemukan di direktori.
- `messaging.targetResolver.resolveTarget(...)` adalah fallback plugin ketika
  core memerlukan resolusi akhir milik penyedia setelah normalisasi atau setelah
  tidak ditemukan di direktori.
- `messaging.resolveOutboundSessionRoute(...)` memiliki konstruksi rute sesi
  khusus penyedia setelah target diresolusi.

Pembagian yang disarankan:

- Gunakan `inferTargetChatType` untuk keputusan kategori yang harus dilakukan sebelum
  mencari rekan/grup.
- Gunakan `looksLikeId` untuk pemeriksaan "perlakukan ini sebagai ID target eksplisit/native".
- Gunakan `resolveTarget` untuk fallback normalisasi khusus penyedia, bukan untuk
  pencarian direktori yang luas.
- Pertahankan ID native penyedia seperti ID chat, ID utas, JID, handle, dan ID ruang
  di dalam nilai `target` atau parameter khusus penyedia, bukan dalam bidang SDK
  generik.

## Direktori yang didukung konfigurasi

Plugin yang memperoleh entri direktori dari konfigurasi sebaiknya mempertahankan logika tersebut di dalam
plugin dan menggunakan kembali pembantu bersama dari
`openclaw/plugin-sdk/directory-runtime`.

Gunakan ini ketika channel memerlukan rekan/grup yang didukung konfigurasi seperti:

- peer DM berbasis daftar izin
- peta saluran/grup yang dikonfigurasi
- fallback direktori statis dengan cakupan akun

Pembantu bersama di `directory-runtime` hanya menangani operasi generik:

- pemfilteran kueri
- penerapan batas
- pembantu deduplikasi/normalisasi
- membangun `ChannelDirectoryEntry[]`

Pemeriksaan akun dan normalisasi id khusus saluran harus tetap berada dalam
implementasi plugin.

## Katalog penyedia

Plugin penyedia dapat menentukan katalog model untuk inferensi dengan
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` mengembalikan bentuk yang sama dengan yang ditulis OpenClaw ke
`models.providers`:

- `{ provider }` untuk satu entri penyedia
- `{ providers }` untuk beberapa entri penyedia

Gunakan `catalog` ketika plugin memiliki id model khusus penyedia, nilai
default URL dasar, atau metadata model yang dibatasi autentikasi.

`catalog.order` mengontrol kapan katalog plugin digabungkan relatif terhadap
penyedia implisit bawaan OpenClaw:

- `simple`: penyedia berbasis kunci API biasa atau variabel lingkungan
- `profile`: penyedia yang muncul ketika profil autentikasi tersedia
- `paired`: penyedia yang menyintesis beberapa entri penyedia terkait
- `late`: tahap terakhir, setelah penyedia implisit lainnya

Penyedia yang diproses belakangan menang jika terjadi benturan kunci, sehingga
plugin dapat dengan sengaja mengganti entri penyedia bawaan yang memiliki id
penyedia sama.

Plugin juga dapat menerbitkan baris model hanya-baca melalui
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Ini adalah jalur ke depan untuk permukaan daftar/bantuan/pemilih dan mendukung
baris `text`, `voice`, `image_generation`, `video_generation`, dan `music_generation`.
Plugin penyedia tetap memiliki panggilan endpoint langsung, pertukaran token,
dan pemetaan respons vendor; inti memiliki bentuk baris umum, label sumber, dan
pemformatan bantuan alat media. Pendaftaran penyedia pembuatan media secara
otomatis menyintesis baris katalog statis dari `defaultModel`, `models`, dan
`capabilities`.

Kompatibilitas:

- `discovery` masih berfungsi sebagai alias lama, tetapi memunculkan peringatan penghentian
- jika `catalog` dan `discovery` sama-sama didaftarkan, OpenClaw menggunakan `catalog`
  dan memunculkan peringatan
- `augmentModelCatalog` telah dihentikan; penyedia terpaket harus menerbitkan
  baris tambahan melalui `registerModelCatalogProvider`

## Pemeriksaan saluran hanya-baca

Jika plugin Anda mendaftarkan saluran, sebaiknya implementasikan
`plugin.config.inspectAccount(cfg, accountId)` bersama `resolveAccount(...)`.

Alasannya:

- `resolveAccount(...)` adalah jalur runtime. Jalur ini boleh mengasumsikan kredensial
  telah diwujudkan sepenuhnya dan dapat langsung gagal ketika rahasia wajib tidak tersedia.
- Jalur perintah hanya-baca seperti `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, serta alur
  perbaikan doctor/konfigurasi tidak seharusnya perlu mewujudkan kredensial runtime hanya untuk
  mendeskripsikan konfigurasi.

Perilaku `inspectAccount(...)` yang disarankan:

- Hanya kembalikan status akun deskriptif.
- Pertahankan `enabled` dan `configured`.
- Sertakan bidang sumber/status kredensial jika relevan, seperti:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Anda tidak perlu mengembalikan nilai token mentah hanya untuk melaporkan
  ketersediaan hanya-baca. Mengembalikan `tokenStatus: "available"` (dan bidang sumber
  yang sesuai) sudah cukup untuk perintah bergaya status.
- Gunakan `configured_unavailable` ketika kredensial dikonfigurasi melalui SecretRef tetapi
  tidak tersedia dalam jalur perintah saat ini.

Hal ini memungkinkan perintah hanya-baca melaporkan "dikonfigurasi tetapi tidak
tersedia dalam jalur perintah ini", alih-alih mengalami crash atau salah
melaporkan akun sebagai tidak dikonfigurasi.

## Paket plugin

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

Setiap entri menjadi plugin. Jika paket mencantumkan beberapa ekstensi, id
plugin menjadi `<manifestOrPackageName>/<fileBase>` (id manifes diutamakan jika
tersedia; jika tidak, gunakan nama `package.json` tanpa cakupan).

Jika plugin Anda mengimpor dependensi npm, instal dependensi tersebut di direktori
itu agar `node_modules` tersedia (`npm install` / `pnpm install`).

Batas pengaman keamanan: setiap entri `openclaw.extensions` harus tetap berada di
dalam direktori plugin setelah resolusi symlink. Entri yang keluar dari direktori
paket akan ditolak.

Catatan keamanan: `openclaw plugins install` menginstal dependensi plugin dengan
`npm install --omit=dev --ignore-scripts` yang bersifat lokal bagi proyek (tanpa skrip siklus hidup,
tanpa dependensi pengembangan saat runtime), serta mengabaikan pengaturan instalasi npm global yang diwarisi.
Jaga agar pohon dependensi plugin tetap "JS/TS murni" dan hindari paket yang memerlukan
build `postinstall`.

Opsional: `openclaw.setupEntry` dapat mengarah ke modul ringan khusus penyiapan.
Ketika OpenClaw memerlukan permukaan penyiapan untuk plugin saluran yang dinonaktifkan,
atau ketika plugin saluran diaktifkan tetapi belum dikonfigurasi, OpenClaw memuat `setupEntry`
alih-alih entri plugin lengkap. Hal ini membuat startup dan penyiapan lebih ringan
ketika entri plugin utama Anda juga merangkai alat, hook, atau kode lain yang hanya
digunakan saat runtime.

Opsional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
dapat mengikutsertakan plugin saluran ke jalur `setupEntry` yang sama selama fase
startup prasimak Gateway, bahkan ketika saluran sudah dikonfigurasi.

Gunakan ini hanya ketika `setupEntry` sepenuhnya mencakup permukaan startup yang harus
tersedia sebelum Gateway mulai menyimak. Dalam praktiknya, ini berarti entri penyiapan
harus mendaftarkan setiap kapabilitas milik saluran yang menjadi dependensi startup, seperti:

- pendaftaran saluran itu sendiri
- setiap rute HTTP yang harus tersedia sebelum Gateway mulai menyimak
- setiap metode, alat, atau layanan Gateway yang harus tersedia selama rentang waktu yang sama

Jika entri lengkap Anda masih memiliki kapabilitas startup wajib apa pun, jangan aktifkan
flag ini. Pertahankan perilaku default plugin dan biarkan OpenClaw memuat
entri lengkap selama startup.

Saluran terpaket juga dapat menerbitkan pembantu permukaan kontrak khusus penyiapan
yang dapat diperiksa inti sebelum runtime saluran lengkap dimuat. Permukaan promosi
penyiapan saat ini adalah:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Inti menggunakan permukaan tersebut ketika perlu mempromosikan konfigurasi saluran
akun tunggal lama ke `channels.<id>.accounts.*` tanpa memuat entri plugin lengkap.
Matrix adalah contoh terpaket saat ini: Matrix hanya memindahkan kunci autentikasi/bootstrap ke
akun promosi bernama ketika akun bernama sudah tersedia, dan dapat mempertahankan
kunci akun default nonkanonis yang dikonfigurasi, alih-alih selalu membuat
`accounts.default`.

Adaptor patch penyiapan tersebut menjaga penemuan permukaan kontrak terpaket tetap
malas. Waktu impor tetap ringan; permukaan promosi hanya dimuat pada penggunaan
pertama, alih-alih memasuki kembali startup saluran terpaket saat modul diimpor.

Ketika permukaan startup tersebut mencakup metode RPC Gateway, pertahankan metode itu
dengan prefiks khusus plugin. Namespace admin inti (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu
diresolusikan ke `operator.admin`, bahkan jika plugin meminta cakupan yang lebih sempit.

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

### Metadata katalog saluran

Plugin saluran dapat mengiklankan metadata penyiapan/penemuan melalui `openclaw.channel` dan
petunjuk instalasi melalui `openclaw.install`. Hal ini menjaga katalog inti tetap bebas data.

Contoh:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (dihosting sendiri)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Obrolan yang dihosting sendiri melalui bot webhook Nextcloud Talk.",
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
- `docsLabel`: mengganti teks tautan untuk tautan dokumentasi
- `preferOver`: id plugin/saluran berprioritas lebih rendah yang harus dikalahkan oleh entri katalog ini
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrol teks permukaan pemilihan
- `markdownCapable`: menandai saluran sebagai mendukung markdown untuk keputusan pemformatan keluar
- `exposure.configured`: menyembunyikan saluran dari permukaan daftar saluran yang dikonfigurasi jika diatur ke `false`
- `exposure.setup`: menyembunyikan saluran dari pemilih penyiapan/konfigurasi interaktif jika diatur ke `false`
- `exposure.docs`: menandai saluran sebagai internal/privat untuk permukaan navigasi dokumentasi
- `showConfigured` / `showInSetup`: alias lama masih diterima untuk kompatibilitas; utamakan `exposure`
- `quickstartAllowFrom`: mengikutsertakan saluran ke alur panduan memulai cepat standar `allowFrom`
- `forceAccountBinding`: mewajibkan pengikatan akun secara eksplisit meskipun hanya ada satu akun
- `preferSessionLookupForAnnounceTarget`: mengutamakan pencarian sesi saat menyelesaikan target pengumuman

OpenClaw juga dapat menggabungkan **katalog saluran eksternal** (misalnya, ekspor
registri MPM). Letakkan file JSON di salah satu lokasi berikut:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Atau arahkan `OPENCLAW_PLUGIN_CATALOG_PATHS` (atau `OPENCLAW_MPM_CATALOG_PATHS`) ke
satu atau beberapa file JSON (dipisahkan koma/titik koma/`PATH`). Setiap file harus
berisi `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser juga menerima `"packages"` atau `"plugins"` sebagai alias lama untuk kunci `"entries"`.

Entri katalog saluran dan entri katalog instalasi penyedia yang dihasilkan
mengekspos fakta sumber instalasi yang dinormalisasi di samping blok mentah
`openclaw.install`. Fakta yang dinormalisasi mengidentifikasi apakah spesifikasi npm
merupakan versi pasti atau selektor mengambang, apakah metadata integritas yang
diharapkan tersedia, dan apakah jalur sumber lokal juga tersedia. Jika identitas
katalog/paket diketahui, fakta yang dinormalisasi akan memperingatkan jika nama
paket npm yang diuraikan menyimpang dari identitas tersebut.
Fakta tersebut juga memperingatkan ketika `defaultChoice` tidak valid atau menunjuk
ke sumber yang tidak tersedia, serta ketika metadata integritas npm tersedia tanpa
sumber npm yang valid. Konsumen harus memperlakukan `installSource` sebagai bidang
opsional tambahan agar entri yang dibuat secara manual dan shim katalog tidak perlu
menyintesisnya.
Hal ini memungkinkan onboarding dan diagnostik menjelaskan status bidang sumber tanpa
mengimpor runtime plugin.

Entri npm eksternal resmi sebaiknya mengutamakan `npmSpec` yang persis beserta
`expectedIntegrity`. Nama paket tanpa versi dan dist-tag tetap berfungsi untuk
kompatibilitas, tetapi memunculkan peringatan bidang sumber agar katalog dapat beralih
menuju instalasi yang disematkan dan diperiksa integritasnya tanpa merusak plugin yang ada.
Saat onboarding menginstal dari jalur katalog lokal, proses tersebut mencatat entri indeks
plugin terkelola dengan `source: "path"` dan `sourcePath` yang relatif terhadap
ruang kerja jika memungkinkan. Jalur pemuatan operasional absolut tetap berada di
`plugins.load.paths`; catatan instalasi menghindari duplikasi jalur stasiun kerja lokal
ke dalam konfigurasi berumur panjang. Hal ini menjaga instalasi pengembangan lokal tetap
terlihat oleh diagnostik bidang sumber tanpa menambahkan permukaan pengungkapan jalur
sistem berkas mentah kedua. Tabel SQLite `installed_plugin_index` yang dipersistenkan merupakan
sumber kebenaran instalasi dan dapat disegarkan tanpa memuat modul runtime plugin.
Peta `installRecords` miliknya tetap persisten meskipun manifes plugin tidak ada atau
tidak valid; payload `plugins` miliknya merupakan tampilan manifes yang dapat dibangun ulang.

## Plugin mesin konteks

Plugin mesin konteks memiliki orkestrasi konteks sesi untuk penyerapan, perakitan,
dan Compaction. Daftarkan dari plugin Anda dengan
`api.registerContextEngine(id, factory)`, lalu pilih mesin aktif dengan
`plugins.slots.contextEngine`.

Gunakan ini ketika plugin Anda perlu mengganti atau memperluas pipeline konteks
bawaan, bukan sekadar menambahkan pencarian memori atau hook.

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

Host menyelesaikan persiapan prompt memori asinkron yang terdaftar sebelum memanggil
`assemble()` milik mesin nonwarisan. `buildMemorySystemPromptAddition(...)` tetap
sinkron dan membaca snapshot eksekusi yang tidak dapat diubah tersebut selama `assemble()` aktif.
Teruskan konteks alat dan kutipan yang diberikan tanpa perubahan agar snapshot
tidak dapat melintasi batas eksekusi.

`assemble()` dapat mengembalikan `contextProjection` ketika harness aktif memiliki
thread backend persisten. Hilangkan untuk proyeksi per giliran warisan. Kembalikan
`{ mode: "thread_bootstrap", epoch }` ketika konteks yang dirakit harus
disuntikkan satu kali ke dalam thread backend dan digunakan kembali hingga epoch berubah. Ubah
epoch setelah konteks semantik mesin berubah, misalnya setelah proses
Compaction yang dimiliki mesin. Host dapat mempertahankan metadata panggilan alat, bentuk
input, dan hasil alat yang telah disunting dalam proyeksi bootstrap thread agar
thread backend baru mempertahankan kesinambungan alat tanpa menyalin payload mentah
yang mengandung rahasia.

Jika mesin Anda **tidak** memiliki algoritma Compaction, pertahankan implementasi `compact()`
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

Ketika sebuah plugin memerlukan perilaku yang tidak sesuai dengan API saat ini, jangan melewati
sistem plugin dengan akses langsung privat. Tambahkan kapabilitas yang belum tersedia.

Urutan yang disarankan:

1. **Tentukan kontrak inti.** Putuskan perilaku bersama apa yang harus dimiliki inti:
   kebijakan, fallback, penggabungan konfigurasi, siklus hidup, semantik yang menghadap kanal, dan
   bentuk helper runtime.
2. **Tambahkan permukaan registrasi/runtime plugin bertipe.** Perluas
   `OpenClawPluginApi` dan/atau `api.runtime` dengan permukaan kapabilitas bertipe
   terkecil yang berguna.
3. **Hubungkan inti + konsumen kanal/fitur.** Kanal dan plugin fitur
   harus menggunakan kapabilitas baru melalui inti, bukan dengan mengimpor implementasi
   vendor secara langsung.
4. **Daftarkan implementasi vendor.** Plugin vendor kemudian mendaftarkan
   backend mereka terhadap kapabilitas tersebut.
5. **Tambahkan cakupan kontrak.** Tambahkan pengujian agar bentuk kepemilikan dan registrasi
   tetap eksplisit seiring waktu.

Inilah cara OpenClaw mempertahankan pendirian yang tegas tanpa menjadi terkode keras pada
cara pandang satu penyedia. Lihat [Buku Resep Kapabilitas](/id/plugins/adding-capabilities)
untuk daftar periksa berkas konkret dan contoh lengkap.

### Daftar periksa kapabilitas

Saat menambahkan kapabilitas baru, implementasi biasanya harus menyentuh permukaan
berikut secara bersamaan:

- tipe kontrak inti di `src/<capability>/types.ts`
- runner/helper runtime inti di `src/<capability>/runtime.ts`
- permukaan registrasi API plugin di `src/plugins/types.ts`
- pengkabelan registri plugin di `src/plugins/registry.ts`
- eksposur runtime plugin di `src/plugins/runtime/*` ketika plugin fitur/kanal
  perlu menggunakannya
- helper pengambilan/pengujian di `src/test-utils/plugin-registration.ts`
- asersi kepemilikan/kontrak di `src/plugins/contracts/registry.ts`
- dokumentasi operator/plugin di `docs/`

Jika salah satu permukaan tersebut tidak ada, biasanya itu menandakan bahwa kapabilitas
belum terintegrasi sepenuhnya.

### Templat kapabilitas

Pola minimal:

```ts
// kontrak inti
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API plugin
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// helper runtime bersama untuk plugin fitur/kanal
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Tampilkan robot berjalan melewati laboratorium.",
  cfg,
});
```

Pola pengujian kontrak (`src/plugins/contracts/registry.ts` mengekspos pencarian
kepemilikan seperti `providerContractPluginIds`; pengujian memastikan daftar
`contracts.videoGenerationProviders` sebuah plugin cocok dengan yang benar-benar didaftarkannya):

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

Hal tersebut menjaga aturannya tetap sederhana:

- inti memiliki kontrak kapabilitas + orkestrasi
- plugin vendor memiliki implementasi vendor
- plugin fitur/kanal menggunakan helper runtime
- pengujian kontrak menjaga kepemilikan tetap eksplisit

## Terkait

- [Arsitektur plugin](/id/plugins/architecture) — model dan bentuk kapabilitas publik
- [Subjalur SDK Plugin](/id/plugins/sdk-subpaths)
- [Penyiapan SDK Plugin](/id/plugins/sdk-setup)
- [Membangun plugin](/id/plugins/building-plugins)

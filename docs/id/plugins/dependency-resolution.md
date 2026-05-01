---
read_when:
    - Anda sedang menyelidiki perbaikan dependensi runtime Plugin bawaan
    - Anda mengubah perilaku startup Plugin, doctor, atau penginstalan manajer paket
    - Anda memelihara instalasi OpenClaw terpaket atau manifes Plugin yang dibundel
sidebarTitle: Dependencies
summary: Bagaimana OpenClaw merencanakan, menyiapkan, dan memperbaiki dependensi runtime Plugin yang dibundel
title: Resolusi dependensi Plugin
x-i18n:
    generated_at: "2026-05-01T09:26:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: e09245c2b7e2f1fb2a61d64f0f9dc77e7df7da58fd71608c391e3865345b7bc9
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw tidak menginstal setiap pohon dependensi plugin bawaan saat instalasi paket. OpenClaw terlebih dahulu memperoleh rencana plugin efektif dari konfigurasi dan metadata plugin, lalu menyiapkan dependensi runtime hanya untuk plugin bawaan milik OpenClaw yang benar-benar dapat dimuat oleh rencana tersebut.

Halaman ini membahas dependensi runtime terpaket untuk plugin bawaan OpenClaw. Plugin pihak ketiga dan jalur plugin kustom tetap menggunakan perintah instalasi plugin eksplisit seperti `openclaw plugins install` dan `openclaw plugins update`.

## Pembagian tanggung jawab

OpenClaw memiliki rencana dan kebijakan:

- plugin mana yang aktif untuk konfigurasi ini
- akar dependensi mana yang dapat ditulis atau hanya-baca
- kapan perbaikan diizinkan
- id plugin mana yang disiapkan untuk startup
- pemeriksaan akhir sebelum mengimpor modul runtime plugin

Manajer paket memiliki konvergensi dependensi:

- resolusi grafik paket
- penanganan dependensi produksi, opsional, dan peer
- tata letak `node_modules`
- integritas paket
- metadata kunci dan instalasi

Dalam praktiknya, OpenClaw harus menentukan apa yang perlu ada. `pnpm` atau `npm` harus membuat sistem berkas sesuai dengan keputusan tersebut.

OpenClaw juga memiliki kunci koordinasi per akar instalasi. Manajer paket melindungi transaksi instalasi mereka sendiri, tetapi mereka tidak menserialkan penulisan manifes OpenClaw, penyalinan/penggantian nama tahap terisolasi, validasi akhir, atau impor plugin terhadap proses Gateway, doctor, atau CLI lain yang menyentuh akar dependensi runtime yang sama.

## Rencana plugin efektif

Rencana plugin efektif diperoleh dari konfigurasi ditambah metadata plugin yang ditemukan. Input ini dapat mengaktifkan dependensi runtime plugin bawaan:

- `plugins.entries.<id>.enabled`
- `plugins.allow`, `plugins.deny`, dan `plugins.enabled`
- konfigurasi channel lama seperti `channels.telegram.enabled`
- provider, model, atau referensi backend CLI yang dikonfigurasi dan memerlukan plugin
- default manifes bawaan seperti `enabledByDefault`
- indeks plugin terinstal dan metadata manifes bawaan

Penonaktifan eksplisit menang. Plugin yang dinonaktifkan, id plugin yang ditolak, sistem plugin yang dinonaktifkan, atau channel yang dinonaktifkan tidak memicu perbaikan dependensi runtime. Status auth yang dipersistensikan saja juga tidak mengaktifkan channel atau provider bawaan.

Rencana plugin adalah input yang stabil. Materialisasi dependensi yang dihasilkan adalah output dari rencana tersebut.

## Alur startup

Startup Gateway mengurai konfigurasi dan membangun tabel pencarian plugin startup sebelum modul runtime plugin dimuat. Startup kemudian menyiapkan dependensi runtime hanya untuk `startupPluginIds` yang dipilih oleh rencana tersebut.

Untuk instalasi terpaket, penyiapan dependensi diizinkan sebelum impor plugin. Setelah penyiapan, pemuat runtime mengimpor plugin startup dengan perbaikan instalasi dinonaktifkan; pada titik itu materialisasi dependensi yang hilang diperlakukan sebagai kegagalan pemuatan, bukan loop perbaikan lain.

Ketika penyiapan dependensi startup ditunda di balik bind HTTP, kesiapan Gateway tetap diblokir pada alasan `plugin-runtime-deps` sampai dependensi plugin startup yang dipilih dimaterialisasikan dan runtime plugin startup telah dimuat.

## Kapan perbaikan berjalan

Perbaikan dependensi runtime harus berjalan ketika salah satu hal ini benar:

- rencana plugin efektif berubah dan menambahkan plugin bawaan yang memerlukan dependensi runtime
- manifes dependensi yang dihasilkan tidak lagi cocok dengan rencana efektif
- sentinel paket terinstal yang diharapkan hilang atau tidak lengkap
- `openclaw doctor --fix` atau `openclaw plugins deps --repair` diminta

Perbaikan dependensi runtime tidak boleh berjalan hanya karena OpenClaw dimulai. Startup normal dengan rencana yang tidak berubah dan materialisasi dependensi lengkap harus melewati pekerjaan manajer paket.

Perintah yang mengedit konfigurasi, mengaktifkan plugin, atau memperbaiki temuan doctor dapat masuk ke mode rencana plugin sekali, mematerialisasikan dependensi bawaan yang baru diperlukan, lalu kembali ke alur perintah normal. `openclaw onboard` dan `openclaw configure` lokal melakukan ini secara otomatis setelah berhasil menulis konfigurasi, sehingga eksekusi Gateway berikutnya tidak menemukan paket plugin bawaan yang hilang setelah startup sudah dimulai. Onboarding/konfigurasi jarak jauh tetap hanya-baca untuk dependensi runtime lokal.

## Aturan hot reload

Jalur hot reload yang dapat mengubah plugin aktif harus kembali melalui mode rencana plugin sebelum memuat runtime plugin. Reload harus membandingkan rencana plugin efektif baru dengan yang sebelumnya, menyiapkan dependensi yang hilang untuk plugin bawaan yang baru aktif, lalu memuat atau memulai ulang runtime yang terdampak.

Jika reload konfigurasi tidak mengubah rencana plugin efektif, reload tersebut tidak boleh memperbaiki dependensi runtime bawaan.

## Eksekusi manajer paket

OpenClaw menulis manifes instalasi yang dihasilkan untuk dependensi runtime bawaan yang dipilih dan menjalankan manajer paket di akar instalasi dependensi runtime. OpenClaw lebih memilih `pnpm` jika tersedia dan fallback ke runner `npm` bawaan Node.

Jalur `pnpm` menggunakan dependensi produksi, menonaktifkan skrip lifecycle, mengabaikan workspace, dan menyimpan store di dalam akar instalasi:

```bash
pnpm install \
  --prod \
  --ignore-scripts \
  --ignore-workspace \
  --config.frozen-lockfile=false \
  --config.minimum-release-age=0 \
  --config.store-dir=<install-root>/.openclaw-pnpm-store \
  --config.node-linker=hoisted \
  --config.virtual-store-dir=.pnpm
```

Fallback `npm` menggunakan pembungkus instal npm yang aman dengan dependensi produksi, skrip lifecycle dinonaktifkan, mode workspace dinonaktifkan, audit dinonaktifkan, output fund dinonaktifkan, perilaku dependensi peer lama, dan output package-lock diaktifkan untuk akar instalasi yang dihasilkan.

Setelah instalasi, OpenClaw memvalidasi pohon dependensi yang disiapkan sebelum membuatnya terlihat oleh akar dependensi runtime. Tahap terisolasi disalin ke akar dependensi runtime dan divalidasi lagi.

Seluruh bagian perbaikan/materialisasi dijaga oleh kunci akar instalasi. Pemilik kunci saat ini mencatat PID, waktu mulai proses jika tersedia, dan waktu pembuatan. Kunci lama tanpa bukti waktu mulai proses atau waktu pembuatan hanya direklamasi berdasarkan usia sistem berkas, sehingga kunci Docker PID 1 yang didaur ulang pulih tanpa mengakhiri instalasi berjalan lama saat ini hanya berdasarkan usia.

## Akar instalasi

Instalasi terpaket tidak boleh memutasi direktori paket hanya-baca. OpenClaw dapat membaca akar dependensi dari lapisan terpaket, tetapi menulis dependensi runtime yang dihasilkan ke tahap yang dapat ditulis seperti:

- `OPENCLAW_PLUGIN_STAGE_DIR`
- `$STATE_DIRECTORY`
- `~/.openclaw/plugin-runtime-deps`
- `/var/lib/openclaw/plugin-runtime-deps` dalam instalasi bergaya container

Akar yang dapat ditulis adalah target materialisasi akhir. Akar hanya-baca yang lebih lama disimpan sebagai lapisan kompatibilitas hanya jika diperlukan.

Ketika pembaruan OpenClaw terpaket mengubah akar yang dapat ditulis berversi tetapi rencana dependensi plugin bawaan yang dipilih masih dipenuhi oleh akar tahap sebelumnya, perbaikan menggunakan ulang pohon `node_modules` sebelumnya alih-alih menjalankan manajer paket lagi. Akar berversi baru tetap mendapatkan mirror runtime paket saat ini sendiri, sehingga kode plugin berasal dari paket OpenClaw saat ini sementara pohon dependensi yang tidak berubah dibagikan lintas pembaruan. Penggunaan ulang melewati akar sebelumnya dengan kunci dependensi runtime OpenClaw aktif, sehingga akar baru tidak tertaut ke pohon dependensi yang saat ini sedang diperbaiki oleh proses Gateway, doctor, atau CLI lain.

## Perintah doctor dan CLI

Gunakan `plugins deps` untuk memeriksa atau memperbaiki materialisasi dependensi runtime plugin bawaan:

```bash
openclaw plugins deps
openclaw plugins deps --json
openclaw plugins deps --repair
openclaw plugins deps --prune
```

Gunakan doctor ketika status dependensi merupakan bagian dari kesehatan instalasi yang lebih luas:

```bash
openclaw doctor
openclaw doctor --fix
```

`plugins deps` dan doctor beroperasi pada dependensi runtime plugin bawaan milik OpenClaw yang dipilih oleh rencana plugin efektif. Keduanya bukan perintah instalasi atau pembaruan plugin pihak ketiga.

## Pemecahan masalah

Jika instalasi terpaket melaporkan dependensi runtime bawaan yang hilang:

1. Jalankan `openclaw plugins deps --json` untuk memeriksa rencana yang dipilih dan paket yang hilang.
2. Jalankan `openclaw plugins deps --repair` atau `openclaw doctor --fix` untuk memperbaiki tahap dependensi yang dapat ditulis.
3. Jika akar instalasi hanya-baca, atur `OPENCLAW_PLUGIN_STAGE_DIR` ke jalur yang dapat ditulis dan jalankan ulang perbaikan.
4. Mulai ulang Gateway setelah perbaikan jika dependensi yang hilang memblokir pemuatan plugin startup.

Dalam checkout sumber, instalasi workspace biasanya menyediakan dependensi plugin bawaan. Jalankan `pnpm install` untuk perbaikan dependensi sumber alih-alih menggunakan perbaikan dependensi runtime terpaket sebagai langkah pertama.

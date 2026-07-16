---
read_when:
    - Anda ingin memperbarui checkout sumber dengan aman
    - Anda sedang men-debug output atau opsi `openclaw update`
    - Anda perlu memahami perilaku singkatan `--update`
summary: Referensi CLI untuk `openclaw update` (pembaruan sumber yang cukup aman + mulai ulang Gateway secara otomatis)
title: Perbarui
x-i18n:
    generated_at: "2026-07-16T17:56:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b46696f6b9cba5c318f870bcb6c5ea8e0652940968da2ad85e86709fe4c11146
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Perbarui OpenClaw dan beralih antara saluran stable/extended-stable/beta/dev.

Jika Anda menginstal melalui **npm/pnpm/bun** (instalasi global, tanpa metadata git),
pembaruan dilakukan melalui alur pengelola paket yang dijelaskan dalam
[Memperbarui](/id/install/updating).

## Penggunaan

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --acknowledge-clawhub-risk
openclaw update --json
openclaw --update
```

`openclaw --update` ditulis ulang menjadi `openclaw update` (berguna untuk shell dan
skrip peluncur).

## Opsi

| Flag                                             | Deskripsi                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-restart`                                   | Lewati memulai ulang layanan Gateway setelah pembaruan berhasil. Pembaruan pengelola paket yang memulai ulang akan memverifikasi bahwa layanan yang dimulai ulang melaporkan versi yang diharapkan sebelum perintah dinyatakan berhasil.                                                                                                                                                |
| `--channel <stable\|extended-stable\|beta\|dev>` | Tetapkan saluran pembaruan dan pertahankan setelah pembaruan inti berhasil. Extended-stable hanya tersedia untuk paket.                                                                                                                                                                                                                                            |
| `--tag <dist-tag\|version\|spec>`                | Ganti target paket hanya untuk pembaruan ini. Opsi ini tidak dapat digabungkan dengan saluran `extended-stable` yang berlaku, karena target persis yang telah diverifikasi bersifat wajib. Untuk instalasi paket lainnya, `main` dipetakan ke `github:openclaw/openclaw#main`; spesifikasi sumber GitHub/git dikemas ke dalam tarball sementara sebelum instalasi npm global bertahap. |
| `--dry-run`                                      | Pratinjau tindakan yang direncanakan (alur saluran/tag/target/mulai ulang) tanpa menulis konfigurasi, menginstal, menyinkronkan plugin, atau memulai ulang.                                                                                                                                                                                                                |
| `--json`                                         | Cetak JSON `UpdateRunResult` yang dapat dibaca mesin. Mencakup `postUpdate.plugins.warnings` saat plugin terkelola memerlukan perbaikan, detail fallback plugin saluran beta, dan `postUpdate.plugins.integrityDrifts` saat penyimpangan artefak plugin npm terdeteksi selama sinkronisasi pascapembaruan.                                                                 |
| `--timeout <seconds>`                            | Batas waktu per langkah. Default `1800`.                                                                                                                                                                                                                                                                                                            |
| `--yes`                                          | Lewati prompt konfirmasi (misalnya konfirmasi penurunan versi).                                                                                                                                                                                                                                                                              |
| `--acknowledge-clawhub-risk`                     | Izinkan sinkronisasi plugin pascapembaruan tetap berlanjut meskipun ada peringatan kepercayaan ClawHub komunitas tanpa prompt interaktif. Tanpa opsi ini, rilis komunitas berisiko dilewati dan dibiarkan tidak berubah ketika OpenClaw tidak dapat meminta konfirmasi. Paket ClawHub resmi dan sumber plugin bawaan melewati prompt ini.                                                     |

Tidak ada flag `--verbose`. Gunakan `--dry-run` untuk melihat pratinjau tindakan yang direncanakan,
`--json` untuk hasil yang dapat dibaca mesin, dan `openclaw update status --json`
hanya untuk saluran/ketersediaan. Verbositas konsol Gateway (`--verbose`) dan
tingkat log berkas (`logging.level: "debug"`/`"trace"`) merupakan pengaturan terpisah; lihat
[Pencatatan log Gateway](/id/gateway/logging).

<Note>
Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), proses `openclaw update` yang melakukan perubahan dinonaktifkan. Sebagai gantinya, perbarui sumber Nix atau input flake untuk instalasi ini; untuk nix-openclaw, gunakan [Mulai Cepat](https://github.com/openclaw/nix-openclaw#quick-start) yang mengutamakan agen. `openclaw update status` dan `openclaw update --dry-run` tetap hanya-baca.
</Note>

<Warning>
Penurunan versi memerlukan konfirmasi karena versi lama dapat merusak konfigurasi.
Jika instalasi telah memigrasikan sesi ke SQLite, pulihkan artefak transkrip
lama yang diarsipkan sebelum memulai versi lama yang didukung berkas. Lihat
[Doctor: Menurunkan versi setelah migrasi sesi SQLite](/id/cli/doctor#downgrading-after-session-sqlite-migration).
</Warning>

## `update status`

Tampilkan saluran pembaruan aktif, tag/cabang/SHA git (hanya checkout sumber),
dan ketersediaan pembaruan.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

| Flag                  | Default | Deskripsi                         |
| --------------------- | ------- | ----------------------------------- |
| `--json`              | `false` | Cetak JSON status yang dapat dibaca mesin. |
| `--timeout <seconds>` | `3`     | Batas waktu pemeriksaan.                 |

Untuk instalasi paket extended-stable, status menjalankan pemilih publik
dan verifikasi paket persis yang sama seperti pembaruan latar depan. Status dapat melaporkan
`ahead of extended-stable` ketika versi yang terinstal lebih baru. Kegagalan JSON
mencakup `registry.reason` (`selector_missing`, `selector_query_failed`,
`exact_package_mismatch`, atau `unsupported_git_channel`).

## `update repair`

Jalankan kembali finalisasi pembaruan setelah paket inti berubah tetapi pekerjaan
perbaikan berikutnya tidak selesai dengan baik. Ini adalah jalur pemulihan yang didukung ketika
`openclaw update` menginstal paket inti baru, tetapi sinkronisasi plugin pascainti,
metadata plugin npm terkelola, penyegaran registri, atau perbaikan Doctor tidak
mencapai kondisi konvergen.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

| Flag                                             | Deskripsi                                                                                                                                                                                                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--channel <stable\|extended-stable\|beta\|dev>` | Pertahankan saluran pembaruan inti sebelum perbaikan. Untuk extended-stable, plugin npm resmi yang memenuhi syarat dan mengikuti maksud bare/default atau `latest` akan menargetkan versi inti persis yang terinstal. Perbaikan extended-stable ditolak pada checkout Git tanpa mengubah konfigurasi. |
| `--json`                                         | Cetak JSON finalisasi yang dapat dibaca mesin.                                                                                                                                                                                                                           |
| `--timeout <seconds>`                            | Batas waktu untuk langkah perbaikan. Default `1800`.                                                                                                                                                                                                                           |
| `--yes`                                          | Lewati prompt konfirmasi.                                                                                                                                                                                                                                          |
| `--acknowledge-clawhub-risk`                     | Perilaku sama seperti pada `openclaw update`.                                                                                                                                                                                                                              |
| `--no-restart`                                   | Diterima demi kesetaraan; perbaikan tidak pernah memulai ulang Gateway.                                                                                                                                                                                                             |

`update repair` menjalankan `openclaw doctor --fix`, memuat ulang konfigurasi yang diperbaiki dan
catatan instalasi, menyinkronkan plugin terlacak untuk saluran pembaruan aktif, memperbarui
instalasi plugin npm terkelola, memperbaiki payload plugin terkonfigurasi yang hilang,
menyegarkan registri plugin, dan menulis metadata catatan instalasi yang telah konvergen.
Proses ini tidak menginstal paket inti baru dan tidak memulai ulang Gateway.

## `update wizard`

Alur interaktif untuk memilih saluran pembaruan dan mengonfirmasi apakah Gateway
akan dimulai ulang setelahnya (default-nya memulai ulang). Memilih `dev` tanpa checkout
git menawarkan pembuatan checkout.

| Flag                  | Default | Deskripsi                   |
| --------------------- | ------- | ----------------------------- |
| `--timeout <seconds>` | `1800`  | Batas waktu untuk setiap langkah pembaruan. |

## Cara kerjanya

Beralih saluran secara eksplisit (`--channel ...`) juga menjaga metode instalasi
tetap selaras:

- `dev` -> memastikan adanya checkout git (default `~/openclaw`, atau
  `$OPENCLAW_HOME/openclaw` ketika `OPENCLAW_HOME` ditetapkan; ganti dengan
  `OPENCLAW_GIT_DIR`), memperbaruinya, dan menginstal CLI global dari
  checkout tersebut.
- `stable` -> menginstal dari npm menggunakan `latest`.
- `extended-stable` -> menyelesaikan pemilih npm publik `extended-stable`,
  memverifikasi paket persis yang dipilih, dan menginstal versi persis tersebut. Proses ini
  tidak beralih ke pemilih lain sebagai fallback dan ditolak untuk checkout Git.
- `beta` -> mengutamakan dist-tag npm `beta`, dengan fallback ke `latest` ketika beta
  tidak tersedia atau lebih lama daripada rilis stable saat ini.

### Serah terima mulai ulang

Pembaruan otomatis inti Gateway (ketika diaktifkan melalui konfigurasi) meluncurkan jalur
pembaruan CLI di luar penangan permintaan Gateway yang aktif. Pembaruan pengelola paket
bidang kontrol `update.run` dan pembaruan checkout git yang diawasi menggunakan
serah terima layanan terkelola yang sama, alih-alih mengganti pohon paket atau
membangun ulang `dist/` di dalam proses Gateway yang aktif: Gateway memulai
pembantu terpisah lalu keluar, dan pembantu tersebut menjalankan `openclaw update --yes --json`
dari luar pohon proses Gateway. Jika serah terima tidak tersedia,
`update.run` mengembalikan respons terstruktur berisi perintah shell aman untuk dijalankan
secara manual.

Pilihan extended-stable yang tersimpan menerima petunjuk startup hanya-baca dan pembaruan 24 jam
ketika `update.checkOnStart` diaktifkan. Pemeriksaan ini tidak pernah menerapkan pembaruan,
memulai handoff, memulai ulang Gateway, menggunakan penundaan/jitter stable, atau menggunakan
frekuensi polling beta. Pembaruan foreground eksplisit, pembaruan foreground tanpa argumen dengan
`update.channel: "extended-stable"` tersimpan, status sesuai permintaan, dan handoff Gateway
terkelolanya tetap didukung.

Ketika layanan Gateway terkelola lokal terpasang dan mulai ulang diaktifkan,
pembaruan pengelola paket dan checkout git menghentikan layanan yang berjalan sebelum
mengganti pohon paket atau memodifikasi keluaran checkout/build. Pembaru
kemudian menyegarkan metadata layanan, memulai ulang layanan, dan memverifikasi
Gateway yang dimulai ulang sebelum melaporkan `Gateway: restarted and verified.`.
Pembaruan pengelola paket juga memverifikasi bahwa Gateway yang dimulai ulang melaporkan
versi paket yang diharapkan; pembaruan checkout git memverifikasi kesehatan gateway dan
kesiapan layanan setelah build ulang.

Pembaruan pengelola paket biasanya tetap menggunakan biner Node yang tercatat dalam
layanan terkelola. Jika Node tersebut tidak dapat menjalankan rilis target, tetapi Node
CLI saat ini dapat melakukannya dan layanan terbukti milik paket yang sedang diperbarui,
pembaruan dengan mulai ulang diaktifkan menggunakan Node saat ini untuk finalisasi dan menulis ulang
metadata layanan ke runtime tersebut. `--no-restart` tidak dapat memperbaiki metadata
layanan, sehingga ketidakcocokan runtime yang sama menghentikan proses sebelum modifikasi paket.

Di macOS, pemeriksaan pascapembaruan juga memverifikasi bahwa LaunchAgent
dimuat/berjalan untuk profil aktif dan port loopback yang dikonfigurasi
dalam keadaan sehat. Jika plist terpasang tetapi launchd tidak mengawasinya, OpenClaw
melakukan bootstrap ulang LaunchAgent secara otomatis dan menjalankan ulang pemeriksaan kesehatan/versi/
kesiapan channel (bootstrap baru memuat job `RunAtLoad` secara langsung,
sehingga pemulihan tidak langsung `kickstart -k` Gateway yang baru dimunculkan). Jika
Gateway masih tidak menjadi sehat, perintah keluar dengan nilai bukan nol dan
mencetak jalur log mulai ulang beserta petunjuk mulai ulang, instal ulang, dan rollback
paket.

Jika mulai ulang tidak dapat dijalankan, perintah mencetak `Gateway: restart skipped (...)` atau
`Gateway: restart failed: ...` dengan petunjuk manual `openclaw gateway restart`.
Dengan `--no-restart`, penggantian paket atau build ulang git tetap berjalan, tetapi
layanan terkelola tidak dihentikan atau dimulai ulang, sehingga Gateway yang berjalan tetap
menggunakan kode lama hingga Anda memulai ulang secara manual.

### Bentuk respons bidang kontrol

Ketika `update.run` berjalan melalui bidang kontrol Gateway pada instalasi
pengelola paket atau checkout git yang diawasi, handler melaporkan inisiasi handoff
secara terpisah dari pembaruan CLI yang berlanjut setelah Gateway berhenti:

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"`, dan
  `handoff.status: "started"`: Gateway membuat handoff layanan terkelola
  dan menjadwalkan mulai ulangnya sendiri agar helper terlepas dapat menjalankan
  `openclaw update --yes --json` di luar proses layanan aktif.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"`, dan
  `handoff.status: "unavailable"`: OpenClaw tidak dapat menemukan batas layanan pengawas
  dan identitas layanan persisten untuk handoff yang aman (misalnya,
  handoff systemd memerlukan identitas unit `OPENCLAW_SYSTEMD_UNIT`,
  bukan hanya penanda proses systemd sekitar). Respons menyertakan
  `handoff.command`, perintah shell yang harus dijalankan dari luar Gateway.
- `ok: false`, `result.reason: "managed-service-handoff-failed"`: Gateway
  mencoba membuat handoff tetapi tidak dapat memunculkan helper terlepas.

Payload `sentinel` ditulis sebelum Gateway berhenti, dan handoff CLI
memperbarui sentinel mulai ulang yang sama setelah pemeriksaan kesehatan mulai ulang
layanan terkelola selesai. Selama handoff, sentinel dapat membawa
`stats.reason: "restart-health-pending"` tanpa kelanjutan sukses;
Gateway yang dimulai ulang melakukan polling terhadapnya dan memicu kelanjutan hanya setelah CLI
memverifikasi kesehatan layanan dan menulis ulang sentinel dengan hasil akhir `ok`.
`openclaw status` dan `openclaw status --all` menampilkan baris `Update restart`
saat sentinel tersebut tertunda atau gagal, dan `update.status` menyegarkan serta
mengembalikan sentinel terbaru.

## Alur checkout Git

### Pemilihan channel

- `stable`: checkout tag non-beta terbaru, lalu build dan jalankan doctor.
- `beta`: prioritaskan tag `-beta` terbaru, dengan fallback ke tag stable terbaru
  ketika beta tidak tersedia atau lebih lama.
- `dev`: checkout `main`, lalu fetch dan rebase.
- `extended-stable`: tidak didukung untuk checkout Git; tidak ada modifikasi checkout
  yang dilakukan.

### Langkah pembaruan

<Steps>
  <Step title="Verifikasi worktree bersih">
    Mengharuskan tidak ada perubahan yang belum di-commit.
  </Step>
  <Step title="Ganti channel">
    Beralih ke channel yang dipilih (tag atau branch).
  </Step>
  <Step title="Fetch upstream">
    Hanya dev.
  </Step>
  <Step title="Build preflight (hanya dev)">
    Menjalankan build TypeScript dalam worktree sementara. Jika tip gagal, menelusuri mundur hingga 10 commit untuk menemukan commit terbaru yang dapat di-build. Atur `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` agar lint juga dijalankan selama preflight ini; lint berjalan dalam mode serial terbatas karena host pembaruan pengguna sering kali lebih kecil daripada runner CI.
  </Step>
  <Step title="Rebase">
    Melakukan rebase ke commit yang dipilih (hanya dev).
  </Step>
  <Step title="Instal dependensi">
    Menggunakan pengelola paket repo. Untuk checkout pnpm, pembaru melakukan bootstrap `pnpm` sesuai permintaan (melalui `corepack` terlebih dahulu, kemudian fallback sementara `npm install pnpm@11`) alih-alih menjalankan `npm run build` di dalam workspace pnpm. Jika bootstrap pnpm tetap gagal, pembaru berhenti lebih awal dengan galat khusus pengelola paket alih-alih mencoba `npm run build` di dalam checkout.
  </Step>
  <Step title="Build Control UI">
    Melakukan build gateway dan Control UI.
  </Step>
  <Step title="Jalankan doctor">
    `openclaw doctor` berjalan sebagai pemeriksaan akhir pembaruan aman.
  </Step>
  <Step title="Sinkronkan plugin">
    Menyinkronkan plugin ke channel aktif. Dev menggunakan plugin bawaan; stable dan beta menggunakan npm. Memperbarui instalasi plugin yang dilacak.
  </Step>
</Steps>

### Detail sinkronisasi plugin

Pada channel beta, instalasi plugin npm dan ClawHub terlacak yang mengikuti
jalur default/latest mencoba rilis `@beta` plugin terlebih dahulu. Jika plugin tidak memiliki
rilis beta, OpenClaw menggunakan fallback ke spesifikasi default/latest yang tercatat dan
melaporkan peringatan. Untuk plugin npm, OpenClaw juga menggunakan fallback ketika paket
beta tersedia tetapi gagal dalam validasi instalasi. Peringatan fallback ini tidak
menggagalkan pembaruan inti. Versi persis dan tag eksplisit tidak pernah ditulis ulang.

<Warning>
Jika pembaruan plugin npm yang disematkan ke versi persis menghasilkan artefak yang integritasnya berbeda dari catatan instalasi tersimpan, `openclaw update` membatalkan pembaruan artefak plugin tersebut alih-alih menginstalnya. Instal ulang atau perbarui plugin secara eksplisit hanya setelah memverifikasi bahwa Anda memercayai artefak baru tersebut.
</Warning>

<Note>
Kegagalan sinkronisasi plugin pascapembaruan yang terbatas pada plugin terkelola dan dapat diatasi oleh jalur sinkronisasi (misalnya registry npm yang tidak dapat dijangkau untuk plugin non-esensial) dilaporkan sebagai peringatan setelah pembaruan inti berhasil. Hasil JSON mempertahankan `status: "ok"` pembaruan tingkat atas dan melaporkan `postUpdate.plugins.status: "warning"` dengan panduan `openclaw update repair` dan `openclaw plugins inspect <id> --runtime --json`. Pengecualian tak terduga pada pembaru atau sinkronisasi tetap menggagalkan hasil pembaruan. Perbaiki galat instalasi atau pembaruan plugin, lalu jalankan ulang `openclaw update repair`. Ketika pembaruan yang gagal membuat plugin terkelola tidak dapat digunakan, OpenClaw menonaktifkan entri runtime-nya dan mereset slot aktif tanpa mengubah kebijakan `plugins.allow` atau `plugins.deny` yang ditetapkan operator.

Setelah langkah sinkronisasi per plugin, `openclaw update` menjalankan tahap **konvergensi pasca-inti** wajib sebelum gateway dimulai ulang: tahap ini memperbaiki payload plugin terkonfigurasi yang hilang, memvalidasi setiap catatan instalasi terlacak yang _aktif_ pada disk, dan secara statis memverifikasi bahwa `package.json`-nya dapat diurai (dan setiap `main` yang dideklarasikan secara eksplisit tersedia). Kegagalan dari tahap ini, serta snapshot konfigurasi yang tidak valid, mengembalikan `postUpdate.plugins.status: "error"` dan mengubah `status` pembaruan tingkat atas menjadi `"error"`, sehingga `openclaw update` keluar dengan nilai bukan nol dan gateway _tidak_ dimulai ulang dengan kumpulan plugin yang belum diverifikasi. Galat tersebut menyertakan baris `postUpdate.plugins.warnings[].guidance` terstruktur yang menunjuk ke `openclaw update repair` dan `openclaw plugins inspect <id> --runtime --json`. Entri plugin yang dinonaktifkan dan catatan yang bukan target sinkronisasi resmi tertaut sumber tepercaya dilewati di sini (mencerminkan kebijakan `skipDisabledPlugins` yang digunakan oleh pemeriksaan payload yang hilang), sehingga catatan plugin nonaktif yang usang tidak dapat memblokir pembaruan yang semestinya valid.

Ketika Gateway yang diperbarui dimulai, pemuatan plugin hanya melakukan verifikasi: startup tidak menjalankan pengelola paket atau memodifikasi pohon dependensi. Mulai ulang `update.run` pengelola paket diserahkan ke jalur layanan terkelola CLI, sehingga pertukaran paket terjadi di luar proses Gateway lama dan pemeriksaan kesehatan layanan menentukan apakah pembaruan dapat dilaporkan selesai.
</Note>

Setelah pembaruan inti extended-stable berhasil, integritas dan konvergensi plugin
pasca-inti menargetkan plugin npm resmi yang memenuhi syarat pada versi inti
terpasang yang persis sama. Untuk intent default/`latest`, OpenClaw tidak mengueri
`@extended-stable` plugin atau menggunakan fallback ke `latest` npm; OpenClaw memperoleh versi paket
dari inti yang terpasang. Pin versi eksplisit, tag eksplisit selain `latest`,
paket pihak ketiga, dan sumber non-npm mempertahankan intent yang ada.

Untuk instalasi pengelola paket, `openclaw update` menentukan versi paket
target sebelum memanggil pengelola paket. Instalasi global npm menggunakan instalasi
bertahap: OpenClaw menginstal paket baru ke prefix npm sementara,
memungkinkan paket kandidat memvalidasi versi Node host selama `preinstall`,
dan memverifikasi inventaris `dist` yang dikemas di sana. Penjaga penyelesaian terkemas
tetap berada di luar inventaris tersebut hingga `preinstall` berhasil, sehingga pengelola paket
yang melewati skrip siklus hidup juga berhenti sebelum aktivasi. Pada npm 12 dan yang lebih baru,
pembaru hanya menyetujui siklus hidup OpenClaw kandidat; skrip
dependensi transitif tetap diblokir. OpenClaw kemudian menukar pohon paket yang bersih
ke prefix global sebenarnya. Jika verifikasi gagal, doctor pascapembaruan, sinkronisasi plugin,
dan pekerjaan mulai ulang tidak dijalankan dari pohon yang mencurigakan. Bahkan ketika
versi terpasang sudah cocok dengan target, perintah menyegarkan
instalasi paket global, lalu menjalankan sinkronisasi plugin, penyegaran penyelesaian
perintah inti, dan pekerjaan mulai ulang. Hal ini menjaga sidecar terkemas dan catatan
plugin milik channel tetap selaras dengan build OpenClaw yang terpasang, sekaligus menyerahkan
build ulang penyelesaian perintah plugin secara penuh kepada eksekusi
`openclaw completion --write-state` eksplisit.

## Terkait

- `openclaw doctor` (menawarkan untuk menjalankan pembaruan terlebih dahulu pada checkout git)
- [Channel pengembangan](/id/install/development-channels)
- [Memperbarui](/id/install/updating)
- [Referensi CLI](/id/cli)

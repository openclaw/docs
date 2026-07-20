---
read_when:
    - Memperbarui OpenClaw
    - Ada sesuatu yang bermasalah setelah pembaruan
summary: Memperbarui OpenClaw dengan aman (instalasi global atau dari sumber), beserta strategi rollback
title: Memperbarui
x-i18n:
    generated_at: "2026-07-20T03:51:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b337c3c4c845e054eebb5a7eb018900f9e22b695a59e14c0a6f0cb67d2e4780a
    source_path: install/updating.md
    workflow: 16
---

Tetap perbarui OpenClaw.

Untuk penggantian image Docker, Podman, dan Kubernetes, lihat
[Memperbarui image kontainer](/id/install/docker#upgrading-container-images). Gateway
menjalankan pekerjaan peningkatan yang aman saat startup sebelum siap dan keluar jika state
yang di-mount memerlukan perbaikan manual.

## Direkomendasikan: `openclaw update`

Mendeteksi jenis instalasi Anda (npm, pnpm, Bun, atau git), mengambil versi terbaru, menjalankan `openclaw doctor`, dan memulai ulang Gateway.

```bash
openclaw update
```

Beralih channel atau menargetkan versi tertentu:

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # pratinjau tanpa menerapkan
```

`openclaw update` tidak memiliki flag `--verbose` (penginstal memilikinya). Untuk diagnostik, gunakan
`--dry-run` guna melihat pratinjau tindakan yang direncanakan, `--json` untuk hasil terstruktur, atau
`openclaw update status --json` guna memeriksa state channel dan ketersediaan.

`--channel beta` mengutamakan dist-tag npm beta, tetapi beralih ke stable/latest
jika tag beta tidak tersedia atau versinya lebih lama daripada rilis stabil terbaru.
Sebagai gantinya, gunakan `--tag beta` untuk pembaruan paket satu kali yang disematkan ke
dist-tag beta npm mentah.

`--channel extended-stable` hanya untuk paket, dan instalasi tetap
hanya berjalan di latar depan. OpenClaw membaca pemilih `extended-stable` npm publik,
memverifikasi paket persis yang dipilih, dan menginstal versi tersebut secara persis. Data
registri yang tidak tersedia atau tidak konsisten menyebabkan proses gagal secara tertutup; proses tidak pernah beralih ke `latest`.
Jika versi yang dipilih lebih lama daripada versi yang terinstal, konfirmasi
penurunan versi normal tetap berlaku. CLI menyimpan channel setelah
pembaruan inti berhasil; `npm install -g openclaw@extended-stable` langsung
tidak memperbarui `update.channel`.
Setelah penggantian inti, Plugin npm resmi yang memenuhi syarat dengan intent kosong/default atau
`latest` diselaraskan ke versi inti persis tersebut. Penyematan persis dan tag eksplisit
selain `latest`, Plugin pihak ketiga, serta sumber selain npm tetap tidak berubah.
Instalasi katalog yang dibuat oleh versi OpenClaw saat ini mempertahankan intent
default tersebut. Catatan lama yang hanya berisi versi persis tetap disematkan karena
OpenClaw tidak dapat membedakan penyematan otomatis lama dari penyematan pengguna dengan aman; jalankan
`openclaw plugins update @openclaw/name` satu kali pada channel extended-stable
untuk mengikutsertakan kembali Plugin tersebut dalam pelacakan versi inti persis.

`--channel dev` menyediakan checkout `main` GitHub bergerak yang persisten. Untuk
pembaruan paket satu kali, `--tag main` dipetakan ke spesifikasi paket
`github:openclaw/openclaw#main` dan menginstalnya secara langsung melalui pengelola paket target (npm/pnpm/bun).

Untuk Plugin terkelola, ketiadaan rilis beta merupakan peringatan, bukan kegagalan:
pembaruan inti tetap dapat berhasil sementara Plugin beralih ke
rilis default/latest yang tercatat.

Lihat [Channel rilis](/id/install/development-channels) untuk semantik channel.

## Beralih antara instalasi npm dan git

Gunakan channel untuk mengubah jenis instalasi. Pembaru mempertahankan state, konfigurasi,
kredensial, dan workspace Anda di `~/.openclaw`; pembaru hanya mengubah instalasi kode
OpenClaw yang digunakan oleh CLI dan Gateway.

```bash
# instalasi paket npm -> checkout git yang dapat diedit
openclaw update --channel dev

# checkout git -> instalasi paket npm
openclaw update --channel stable
```

Lihat pratinjau peralihan mode instalasi terlebih dahulu:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` memastikan checkout git tersedia, membangunnya, dan menginstal CLI global dari
checkout tersebut. Channel `stable`, `extended-stable`, dan `beta` menggunakan instalasi
paket. Extended-stable ditolak pada checkout git tanpa mengubah atau
mengonversinya. Jika Gateway sudah terinstal, `openclaw update` menyegarkan
metadata layanan dan memulai ulang layanan tersebut kecuali Anda meneruskan `--no-restart`.

Untuk instalasi paket dengan layanan Gateway terkelola, `openclaw update` menargetkan
root paket yang digunakan oleh layanan tersebut. Jika perintah shell `openclaw` berasal
dari instalasi yang berbeda, pembaru mencetak kedua root dan path Node milik layanan
terkelola, serta memeriksa versi Node tersebut terhadap persyaratan
`engines.node` rilis target sebelum mengganti paket.

## Alternatif: jalankan kembali penginstal

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Tambahkan `--no-onboard` untuk melewati onboarding. Untuk memaksakan jenis instalasi tertentu, teruskan
`--install-method git --no-onboard` atau `--install-method npm --no-onboard`.

Jika `openclaw update` gagal setelah fase instalasi paket npm, jalankan kembali
penginstal. Penginstal tidak memanggil pembaru; penginstal menjalankan instalasi paket
global secara langsung dan dapat memulihkan instalasi npm yang diperbarui sebagian.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Sematkan pemulihan ke versi atau dist-tag tertentu dengan `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternatif: npm, pnpm, atau bun secara manual

```bash
npm i -g openclaw@latest
```

Utamakan `openclaw update` untuk instalasi yang diawasi: perintah tersebut dapat mengoordinasikan penggantian
paket dengan layanan Gateway yang sedang berjalan. Jika Anda memperbarui secara manual pada instalasi
yang diawasi, hentikan Gateway terkelola terlebih dahulu. Pengelola paket mengganti file
di tempatnya, dan Gateway yang sedang berjalan dapat mencoba memuat file inti atau Plugin
di tengah penggantian. Mulai ulang Gateway setelah pengelola paket selesai agar Gateway
menggunakan instalasi baru.

Untuk instalasi global sistem Linux milik root, jika `openclaw update` gagal dengan
`EACCES`, lakukan pemulihan menggunakan npm sistem sambil mempertahankan Gateway dalam keadaan berhenti selama
penggantian manual. Gunakan flag profil/lingkungan yang sama seperti yang biasanya Anda gunakan untuk
Gateway tersebut. Ganti `/usr/bin/npm` dengan npm sistem yang memiliki
prefiks global milik root pada host Anda:

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

Kemudian verifikasi:

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

Saat `openclaw update` mengelola instalasi npm global, perintah tersebut terlebih dahulu menginstal target
ke prefiks npm sementara. Paket kandidat memvalidasi versi Node host
selama `preinstall`; hanya setelah itu OpenClaw memverifikasi inventaris
`dist` dalam paket dan menukar pohon paket bersih ke prefiks global sebenarnya. Penjaga
penyelesaian yang dikemas tidak disertakan dalam inventaris yang diharapkan dan hanya dihapus
setelah `preinstall` berhasil, sehingga skrip siklus hidup yang dilewati juga menyebabkan kegagalan sebelum
penggantian. Pada npm 12 dan yang lebih baru, pembaru hanya menyetujui siklus hidup OpenClaw
kandidat; skrip dependensi transitif tetap diblokir. Hal ini mencegah npm
menimpa paket baru di atas file usang dari paket lama. Jika perintah
instalasi gagal, OpenClaw mencoba kembali satu kali dengan `--omit=optional`, yang membantu host
ketika dependensi opsional native tidak dapat dikompilasi.

Perintah pembaruan npm dan pembaruan Plugin yang dikelola OpenClaw juga menghapus karantina
rantai pasokan `min-release-age` milik npm (atau kunci konfigurasi `before` yang lebih lama)
untuk proses anak npm. Kebijakan tersebut ada untuk perlindungan umum, tetapi pembaruan
OpenClaw eksplisit berarti "instal rilis yang dipilih sekarang."

```bash
pnpm add -g openclaw@latest
```

Jika pnpm 11 menginstal OpenClaw 2026.7.1, jalankan perintah manual tersebut satu kali. Rilis
tersebut mendahului tata letak paket global terisolasi pnpm 11, sehingga pembarunya dapat
salah mengira instalasi npm lain sebagai CLI yang sedang berjalan. Rilis yang lebih baru mempertahankan
kepemilikan pnpm dan mengikuti root paket pengganti selama pembaruan. Rilis tersebut
juga menggunakan direktori bin global yang dilaporkan oleh pengelola pemilik dan berhenti sebelum
perubahan ketika perintah pnpm yang tersedia melaporkan root global atau versi mayor yang berbeda,
atau ketika paket pemanggil menjadi yatim atau bukan satu-satunya instalasi OpenClaw aktif
di sana.

Jika OpenClaw berbagi grup instalasi global pnpm 11 dengan paket lain,
pembaru otomatis berhenti sebelum mengubah grup tersebut. Perbarui grup asal
yang dipisahkan koma secara manual agar paket saudara dan kebijakan build-nya tetap
utuh.

```bash
bun add -g openclaw@latest
```

### Topik instalasi npm tingkat lanjut

<AccordionGroup>
  <Accordion title="Pohon paket hanya-baca">
    OpenClaw memperlakukan instalasi global dalam paket sebagai hanya-baca saat runtime, meskipun direktori paket global dapat ditulis oleh pengguna saat ini. Instalasi paket Plugin berada di root npm/git milik OpenClaw di bawah direktori konfigurasi pengguna, dan startup Gateway tidak mengubah pohon paket OpenClaw.

    Beberapa konfigurasi npm Linux menginstal paket global di bawah direktori milik root seperti `/usr/lib/node_modules/openclaw`. OpenClaw mendukung tata letak tersebut karena perintah instalasi/pembaruan Plugin menulis di luar direktori paket global tersebut.

  </Accordion>
  <Accordion title="Unit systemd yang diperketat">
    Berikan OpenClaw akses tulis ke root konfigurasi/state-nya agar instalasi Plugin eksplisit, pembaruan Plugin, dan pembersihan oleh doctor dapat menyimpan perubahannya:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Pemeriksaan awal ruang disk">
    Sebelum pembaruan paket dan instalasi Plugin eksplisit, OpenClaw mencoba pemeriksaan ruang disk upaya terbaik untuk volume target. Ruang yang sedikit menghasilkan peringatan dengan path yang diperiksa, tetapi tidak memblokir pembaruan karena kuota sistem file, snapshot, dan volume jaringan dapat berubah setelah pemeriksaan. Instalasi pengelola paket yang sebenarnya dan verifikasi pascainstalasi tetap menjadi acuan utama.
  </Accordion>
</AccordionGroup>

## Pembaru otomatis

Nonaktif secara default. Aktifkan di `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
    },
  },
}
```

| Channel           | Perilaku                                                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | Diterapkan setelah penundaan bawaan dengan jitter deterministik untuk peluncuran bertahap.                                                |
| `extended-stable` | Memeriksa petunjuk pembaruan hanya-baca saat startup dan setiap 24 jam ketika `checkOnStart` diaktifkan. Tidak pernah menerapkannya secara otomatis. |
| `beta`            | Memeriksa pada interval bawaan dan langsung menerapkannya.                                                                        |
| `dev`             | Tidak ada penerapan otomatis. Gunakan `openclaw update` secara manual.                                                                           |

Gateway juga mencatat petunjuk pembaruan saat startup (nonaktifkan dengan
`update.checkOnStart: false`). Pilihan extended-stable yang tersimpan menggunakan
jalur petunjuk hanya-baca ini dan interval petunjuk 24 jam yang ada, tetapi tidak pernah menjalankan
instalasi otomatis, handoff, mulai ulang, penundaan/jitter stable, atau polling beta.
Untuk penurunan versi atau pemulihan insiden, atur `OPENCLAW_NO_AUTO_UPDATE=1` di lingkungan Gateway guna memblokir penerapan otomatis meskipun `update.auto.enabled` dikonfigurasi. Petunjuk pembaruan saat startup tetap dapat berjalan kecuali `update.checkOnStart` juga dinonaktifkan.

Pembaruan pengelola paket yang diminta melalui bidang kontrol Gateway langsung
(`update.run`) tidak mengganti pohon paket di dalam proses Gateway
yang sedang berjalan. Pada instalasi layanan terkelola, Gateway memulai handoff terlepas,
keluar, dan membiarkan jalur CLI `openclaw update --yes --json` normal menghentikan
layanan, mengganti paket, menyegarkan metadata layanan, memulai ulang, memverifikasi
versi dan keterjangkauan Gateway, serta memulihkan LaunchAgent macOS yang terinstal tetapi tidak dimuat
jika memungkinkan. Jika Gateway tidak dapat melakukan handoff tersebut dengan aman,
`update.run` melaporkan perintah shell yang aman alih-alih menjalankan pengelola
paket di dalam proses.

Kartu pembaruan bilah sisi Control UI menampilkan **Perbarui Gateway** saat kartu tersebut akan langsung memulai
alur `update.run` ini. Hal ini mencakup Control UI yang di-host di browser, Gateway
jarak jauh, dan Gateway lokal yang dikelola secara manual.

Dalam aplikasi macOS yang ditandatangani, Gateway lokal milik aplikasi mengubah kartu tersebut menjadi
**Perbarui aplikasi Mac + Gateway**. Sparkle memperbarui aplikasi terlebih dahulu; setelah diluncurkan ulang,
aplikasi menjalankan `openclaw update --tag <app-version> --json`, memulai ulang Gateway-nya,
dan memverifikasi kondisi dalam jendela progres bergaya penyiapan. Jendela tersebut hanya muncul
ketika Gateway terkelola itu perlu diperbarui, diperbaiki, atau diinstal; pembaruan khusus aplikasi diluncurkan ulang
langsung ke aplikasi. Detail kegagalan tetap terlihat dengan tindakan Coba Lagi, [Panduan pembaruan](/id/install/updating), dan
[Discord](https://discord.gg/clawd). Aplikasi tidak pernah menggunakan jalur terkoordinasi ini
untuk Gateway jarak jauh atau yang dikelola secara eksternal, tidak pernah menurunkan versi Gateway
yang lebih baru, dan tidak pernah mengesampingkan pin saluran `extended-stable`.

Ketika pembaruan berhasil, aplikasi mengantrekan peristiwa sambutan satu kali untuk sesi langsung
tingkat teratas terbaru yang memiliki interaksi pengguna/saluran nyata. Proses Cron,
heartbeat, dan pembaruan sesi khusus latar belakang tidak mengubah pilihan tersebut. Dalam
mode jarak jauh, aplikasi hanya memperbarui runtime node Mac lokalnya dan mengirimkan peristiwa
hanya ketika Gateway jarak jauh yang terhubung setidaknya sama barunya dengan aplikasi.

## Setelah memperbarui

<Steps>

### Jalankan doctor

```bash
openclaw doctor
```

Memigrasikan konfigurasi, mengaudit kebijakan DM, dan memeriksa kondisi Gateway. Detail: [Doctor](/id/gateway/doctor)

### Mulai ulang Gateway

```bash
openclaw gateway restart
```

### Verifikasi

```bash
openclaw health
```

</Steps>

## Pemulihan versi

Pemulihan versi memiliki dua lapisan:

1. Instal ulang kode OpenClaw yang lebih lama sambil mempertahankan status saat ini.
2. Pulihkan status sebelum pembaruan hanya ketika kode yang lebih lama tidak dapat menggunakan konfigurasi atau basis data
   yang telah dimigrasikan.

Mulailah dengan pemulihan versi kode saja. Memulihkan status akan menghapus perubahan yang dibuat setelah
pencadangan.

### Sebelum memperbarui: buat cadangan terverifikasi

`openclaw update` mempertahankan salinan konfigurasi otomatis sebelum pembaruan, tetapi tidak
membuat titik pemulihan status lengkap. Sebelum pembaruan yang signifikan, buat satu
secara eksplisit:

```bash
mkdir -p ~/Backups/openclaw
openclaw backup create --output ~/Backups/openclaw --verify
```

Manifes arsip mencatat versi OpenClaw dan jalur sumber yang disertakan
dalam cadangan. Arsip dapat berisi kredensial, profil autentikasi, dan status
saluran, jadi simpan dengan izin khusus pemilik dan perlindungan yang sama seperti
direktori status aktif. Lihat [Pencadangan](/id/cli/backup) untuk berkas yang disertakan dan sengaja
dihilangkan.

Untuk titik pemulihan byte demi byte yang menyertakan artefak volatil yang dihilangkan dari
arsip portabel, hentikan Gateway dan gunakan snapshot sistem berkas, volume, atau VM
yang disediakan oleh platform Anda.

### Pulihkan versi instalasi paket

Cantumkan versi yang dipublikasikan, lalu pratinjau dan instal versi yang diketahui berfungsi dengan baik:

```bash
npm view openclaw versions --json
openclaw update --tag <known-good-version> --dry-run
openclaw update --tag <known-good-version>
```

`openclaw update --tag` lebih disarankan daripada instalasi langsung melalui pengelola paket. Perintah ini
mendeteksi penurunan versi, meminta konfirmasi, menjalankan konvergensi Plugin terkelola
dan pemeriksaan kompatibilitas terhadap target yang diinstal, menyegarkan metadata
layanan, memulai ulang Gateway, dan memverifikasi versi yang berjalan. Jika saluran yang tersimpan
adalah `extended-stable`, gunakan
`--channel stable --tag <known-good-version>` karena tag satu kali yang persis tidak dapat
digabungkan dengan pemilih `extended-stable`.

Pembaruan paket menyiapkan dan memverifikasi kandidat sebelum aktivasi. Jika
pertukaran sistem berkas atau penggantian shim perintah gagal, OpenClaw memulihkan paket lama
secara otomatis. Setelah pertukaran berhasil, kegagalan kondisi Gateway berikutnya
melaporkan versi sebelumnya dan petunjuk pemulihan versi manual alih-alih
mengganti paket kembali secara otomatis.

Jika jalur pembaruan CLI tidak tersedia, gunakan pengelola paket dan cakupan
instalasi yang sama dengan yang memiliki Gateway saat ini:

```bash
openclaw gateway stop
npm i -g openclaw@<known-good-version>
openclaw gateway install --force
openclaw gateway restart
```

Ganti `npm` dengan `pnpm` atau `bun` ketika pengelola tersebut memiliki instalasi. Selama
pemulihan insiden, cegah pembaru otomatis yang diaktifkan agar tidak segera menerapkan
rilis yang lebih baru dengan menetapkan `OPENCLAW_NO_AUTO_UPDATE=1` di lingkungan Gateway.

### Pulihkan versi checkout sumber

Gunakan checkout yang bersih dan pilih tag atau commit yang diketahui berfungsi dengan baik:

```bash
git fetch --all --tags
git checkout --detach <known-good-tag-or-commit>
pnpm install && pnpm build
openclaw gateway restart
```

Untuk kembali ke versi terbaru: `git checkout main && git pull`.

Pembaru secara otomatis mengembalikan checkout git ke cabang dan
SHA sebelumnya ketika instalasi dependensi, build, build UI, atau doctor gagal setelah
pembaruan git dimulai. Checkout manual tetap diperlukan ketika Anda sengaja memilih
commit yang lebih lama.

### Menurunkan versi melewati migrasi SQLite sesi

Sebelum memulai rilis OpenClaw berbasis berkas yang lebih lama, gunakan CLI saat ini untuk
memulihkan artefak transkrip lama yang diarsipkan:

```bash
openclaw gateway stop
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Tindakan ini tidak menghapus data SQLite. Sesi yang dibuat setelah migrasi SQLite
hanya ada di SQLite dan tidak akan muncul pada runtime yang lebih lama. Lihat
[Menurunkan versi setelah migrasi SQLite sesi](/id/cli/doctor#downgrading-after-session-sqlite-migration).

### Pulihkan status hanya jika diperlukan

Jika kode yang lebih lama tidak dapat membaca konfigurasi atau skema basis data yang lebih baru, hentikan
Gateway dan pulihkan snapshot sistem berkas, volume, atau VM sebelum pembaruan yang telah diverifikasi.
Pertahankan status saat ini secara terpisah sebelum memulihkan karena tindakan ini menghapus
perubahan yang dibuat setelah snapshot.

Arsip `openclaw backup create` yang luas mendukung pembuatan dan verifikasi, tetapi
tidak mendukung aktivasi seluruh arsip secara langsung di tempat. Ekstrak arsip yang luas ke direktori
penyiapan dan gunakan pemetaan sumber-ke-arsip `manifest.json` untuk pemulihan
luring. `openclaw backup sqlite restore` juga menulis basis data terverifikasi
ke target baru; pengaktifan target tersebut tetap menjadi langkah operator luring yang
eksplisit.

### Verifikasi pemulihan versi

```bash
openclaw --version
openclaw health
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

## Jika Anda mengalami kendala

- Jalankan kembali `openclaw doctor` dan baca keluarannya dengan saksama.
- Untuk `openclaw update --channel dev` pada checkout sumber, pembaru melakukan bootstrap otomatis terhadap `pnpm` saat diperlukan. Jika Anda melihat galat bootstrap pnpm/corepack, instal `pnpm` secara manual (atau aktifkan kembali `corepack`) dan jalankan ulang pembaruan.
- Periksa: [Pemecahan masalah](/id/gateway/troubleshooting)
- Tanyakan di Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Terkait

- [Ringkasan instalasi](/id/install): semua metode instalasi.
- [Doctor](/id/gateway/doctor): pemeriksaan kondisi setelah pembaruan.
- [Migrasi](/id/install/migrating): panduan migrasi versi mayor.

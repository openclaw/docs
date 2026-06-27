---
read_when:
    - Memperbarui OpenClaw
    - Ada yang rusak setelah pembaruan
summary: Memperbarui OpenClaw dengan aman (instalasi global atau sumber), beserta strategi rollback
title: Memperbarui
x-i18n:
    generated_at: "2026-06-27T17:39:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a96c5b9b12040fe9bb8b1623c88a9c305d58dc6fcee7003f500e897ded9e7b4a
    source_path: install/updating.md
    workflow: 16
---

Jaga OpenClaw tetap mutakhir.

## Direkomendasikan: `openclaw update`

Cara tercepat untuk memperbarui. Perintah ini mendeteksi jenis instalasi Anda (npm atau git), mengambil versi terbaru, menjalankan `openclaw doctor`, dan memulai ulang gateway.

```bash
openclaw update
```

Untuk beralih channel atau menargetkan versi tertentu:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --dry-run   # pratinjau tanpa menerapkan
```

`openclaw update` tidak menerima `--verbose`. Untuk diagnostik pembaruan, gunakan
`--dry-run` untuk melihat pratinjau tindakan yang direncanakan, `--json` untuk hasil terstruktur, atau
`openclaw update status --json` untuk memeriksa status channel dan ketersediaan. Installer
memiliki flag `--verbose` sendiri, tetapi flag tersebut bukan bagian dari
`openclaw update`.

`--channel beta` memprioritaskan beta, tetapi runtime akan kembali ke stable/latest ketika
tag beta tidak ada atau lebih lama daripada rilis stable terbaru. Gunakan `--tag beta`
jika Anda menginginkan dist-tag beta npm mentah untuk pembaruan paket satu kali.

Gunakan `--channel dev` untuk checkout GitHub `main` bergerak yang persisten. Untuk pembaruan
paket, `--tag main` dipetakan ke `github:openclaw/openclaw#main` untuk satu kali jalan, dan
spesifikasi sumber GitHub/git dikemas ke dalam tarball sementara sebelum instalasi npm bertahap.

Untuk Plugin terkelola, fallback channel beta adalah peringatan: pembaruan core masih dapat
berhasil sementara Plugin memakai rilis default/latest yang tercatat karena tidak ada beta
Plugin yang tersedia.

Lihat [Channel pengembangan](/id/install/development-channels) untuk semantik channel.

## Beralih antara instalasi npm dan git

Gunakan channel ketika Anda ingin mengubah jenis instalasi. Updater mempertahankan
state, konfigurasi, kredensial, dan workspace Anda di `~/.openclaw`; perintah ini hanya mengubah
instalasi kode OpenClaw mana yang digunakan CLI dan gateway.

```bash
# instalasi paket npm -> checkout git yang dapat diedit
openclaw update --channel dev

# checkout git -> instalasi paket npm
openclaw update --channel stable
```

Jalankan dengan `--dry-run` terlebih dahulu untuk melihat pratinjau peralihan mode instalasi yang tepat:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Channel `dev` memastikan checkout git, membangunnya, dan menginstal CLI global
dari checkout tersebut. Channel `stable` dan `beta` menggunakan instalasi paket. Jika
gateway sudah terpasang, `openclaw update` menyegarkan metadata layanan
dan memulai ulang layanan kecuali Anda meneruskan `--no-restart`.

Untuk instalasi paket dengan layanan Gateway terkelola, `openclaw update` menargetkan
root paket yang digunakan oleh layanan tersebut. Jika perintah shell `openclaw` berasal
dari instalasi berbeda, updater mencetak kedua root dan path Node layanan terkelola.
Pembaruan paket menggunakan package manager yang memiliki root layanan
dan memeriksa Node layanan terkelola terhadap engine rilis target
sebelum mengganti paket.

## Alternatif: jalankan ulang installer

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Tambahkan `--no-onboard` untuk melewati onboarding. Untuk memaksa jenis instalasi tertentu melalui
installer, teruskan `--install-method git --no-onboard` atau
`--install-method npm --no-onboard`.

Jika `openclaw update` gagal setelah fase instalasi paket npm, jalankan ulang
installer. Installer tidak memanggil updater lama; ia menjalankan instalasi
paket global secara langsung dan dapat memulihkan instalasi npm yang diperbarui sebagian.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Untuk menyematkan pemulihan ke versi atau dist-tag tertentu, tambahkan `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternatif: npm, pnpm, atau bun manual

```bash
npm i -g openclaw@latest
```

Utamakan `openclaw update` untuk instalasi tersupervisi karena perintah ini dapat mengoordinasikan
pergantian paket dengan layanan Gateway yang sedang berjalan. Jika Anda memperbarui secara manual pada
instalasi tersupervisi, hentikan Gateway terkelola sebelum package manager dimulai.
Package manager mengganti file di tempat, dan Gateway yang sedang berjalan jika tidak dapat mencoba
memuat file core atau Plugin saat pohon paket untuk sementara baru terganti sebagian.
Mulai ulang Gateway setelah package manager selesai agar layanan mengambil
instalasi baru.

Untuk instalasi global sistem Linux milik root, jika `openclaw update` gagal dengan
`EACCES` dan Anda memulihkan dengan npm sistem, biarkan Gateway berhenti selama
penggantian paket manual. Gunakan flag profil `openclaw` atau environment yang sama
yang biasanya Anda gunakan untuk Gateway tersebut. Ganti `/usr/bin/npm` dengan npm sistem
yang memiliki prefix global milik root di host Anda:

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

Lalu verifikasi layanan:

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

Ketika `openclaw update` mengelola instalasi npm global, perintah ini menginstal target ke
prefix npm sementara terlebih dahulu, memverifikasi inventaris `dist` paket, lalu menukar
pohon paket bersih ke prefix global sebenarnya. Itu menghindari npm menimpa
paket baru di atas file basi dari paket lama. Jika perintah instalasi gagal,
OpenClaw mencoba ulang sekali dengan `--omit=optional`. Percobaan ulang itu membantu host tempat
dependensi opsional native tidak dapat dikompilasi, sambil tetap membuat kegagalan awal terlihat
jika fallback juga gagal.

Perintah pembaruan npm dan pembaruan Plugin yang dikelola OpenClaw juga menghapus karantina
`min-release-age` npm untuk proses turunan npm. npm dapat melaporkan
kebijakan tersebut sebagai cutoff `before` turunan; keduanya berguna untuk kebijakan karantina
rantai pasok umum, tetapi pembaruan OpenClaw eksplisit berarti "instal rilis OpenClaw yang dipilih sekarang."

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Topik lanjutan instalasi npm

<AccordionGroup>
  <Accordion title="Pohon paket hanya baca">
    OpenClaw memperlakukan instalasi global paket sebagai hanya baca saat runtime, bahkan ketika direktori paket global dapat ditulis oleh pengguna saat ini. Instalasi paket Plugin berada di root npm/git milik OpenClaw di bawah direktori konfigurasi pengguna, dan startup Gateway tidak memutasi pohon paket OpenClaw.

    Beberapa setup npm Linux menginstal paket global di bawah direktori milik root seperti `/usr/lib/node_modules/openclaw`. OpenClaw mendukung tata letak tersebut karena perintah instalasi/pembaruan Plugin menulis di luar direktori paket global tersebut.

  </Accordion>
  <Accordion title="Unit systemd yang diperkeras">
    Beri OpenClaw akses tulis ke root konfigurasi/state miliknya agar instalasi Plugin eksplisit, pembaruan Plugin, dan pembersihan doctor dapat mempertahankan perubahannya:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Preflight ruang disk">
    Sebelum pembaruan paket dan instalasi Plugin eksplisit, OpenClaw mencoba pemeriksaan ruang disk best-effort untuk volume target. Ruang rendah menghasilkan peringatan dengan path yang diperiksa, tetapi tidak memblokir pembaruan karena kuota filesystem, snapshot, dan volume jaringan dapat berubah setelah pemeriksaan. Instalasi package manager aktual dan verifikasi pascainstalasi tetap otoritatif.
  </Accordion>
</AccordionGroup>

## Auto-updater

Auto-updater nonaktif secara default. Aktifkan di `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Channel  | Perilaku                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| `stable` | Menunggu `stableDelayHours`, lalu menerapkan dengan jitter deterministik di seluruh `stableJitterHours` (rollout tersebar). |
| `beta`   | Memeriksa setiap `betaCheckIntervalHours` (default: per jam) dan langsung menerapkan.                              |
| `dev`    | Tidak ada penerapan otomatis. Gunakan `openclaw update` secara manual.                                             |

Gateway juga mencatat petunjuk pembaruan saat startup (nonaktifkan dengan `update.checkOnStart: false`).
Untuk downgrade atau pemulihan insiden, tetapkan `OPENCLAW_NO_AUTO_UPDATE=1` di environment gateway untuk memblokir penerapan otomatis bahkan ketika `update.auto.enabled` dikonfigurasi. Petunjuk pembaruan startup masih dapat berjalan kecuali `update.checkOnStart` juga dinonaktifkan.

Pembaruan package manager yang diminta melalui handler control-plane Gateway live
tidak mengganti pohon paket di dalam proses Gateway yang sedang berjalan. Pada instalasi
layanan terkelola, Gateway memulai handoff terlepas, keluar, dan membiarkan
jalur CLI normal `openclaw update --yes --json` menghentikan layanan, mengganti
paket, menyegarkan metadata layanan, memulai ulang, memverifikasi versi dan
keterjangkauan Gateway, serta memulihkan LaunchAgent macOS yang terinstal tetapi belum dimuat
jika memungkinkan. Jika Gateway tidak dapat melakukan handoff tersebut dengan aman, `update.run` melaporkan
perintah shell aman alih-alih menjalankan package manager dalam proses.

## Setelah memperbarui

<Steps>

### Jalankan doctor

```bash
openclaw doctor
```

Memigrasikan konfigurasi, mengaudit kebijakan DM, dan memeriksa kesehatan gateway. Detail: [Doctor](/id/gateway/doctor)

### Mulai ulang gateway

```bash
openclaw gateway restart
```

### Verifikasi

```bash
openclaw health
```

</Steps>

## Rollback

### Sematkan versi (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` menampilkan versi terbit saat ini.
</Tip>

### Sematkan commit (sumber)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Untuk kembali ke terbaru: `git checkout main && git pull`.

## Jika Anda buntu

- Jalankan `openclaw doctor` lagi dan baca output dengan saksama.
- Untuk `openclaw update --channel dev` pada checkout sumber, updater melakukan bootstrap otomatis `pnpm` saat diperlukan. Jika Anda melihat error bootstrap pnpm/corepack, instal `pnpm` secara manual (atau aktifkan kembali `corepack`) dan jalankan ulang pembaruan.
- Periksa: [Pemecahan masalah](/id/gateway/troubleshooting)
- Tanyakan di Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Terkait

- [Ikhtisar instalasi](/id/install): semua metode instalasi.
- [Doctor](/id/gateway/doctor): pemeriksaan kesehatan setelah pembaruan.
- [Migrasi](/id/install/migrating): panduan migrasi versi mayor.

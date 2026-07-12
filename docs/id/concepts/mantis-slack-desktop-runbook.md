---
read_when:
    - Menjalankan QA desktop Mantis Slack dari GitHub atau secara lokal
    - Men-debug proses Mantis yang lambat di desktop Slack
    - Memilih mode sumber, prahidrasi, atau sewa hangat
    - Memposting bukti tangkapan layar dan video ke PR
summary: 'Panduan operasional untuk QA desktop Slack Mantis: pemicu GitHub, CLI lokal, sewa VNC siap pakai, mode hidrasi, interpretasi waktu, artefak, dan penanganan kegagalan.'
title: Panduan operasional desktop Slack Mantis
x-i18n:
    generated_at: "2026-07-12T14:08:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3e956d99fc43a7b6fe65e2e820812b0e0e8b9e32badd25be27c74d302ab30dc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack desktop QA adalah jalur UI nyata untuk bug kelas Slack yang memerlukan
desktop Linux, pemulihan VNC, Slack Web, Gateway OpenClaw nyata, tangkapan layar,
video, dan komentar bukti PR. Gunakan jalur ini ketika pengujian unit atau jalur
langsung Slack tanpa antarmuka grafis tidak dapat membuktikan bug tersebut.

## Model penyimpanan

Mantis menggunakan tiga lapisan penyimpanan:

- **Citra penyedia** - dimiliki oleh Crabbox, disimpan di akun penyedia cloud.
  Menampung kemampuan mesin (Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, alat pembangunan native) dan direktori cache kosong.
- **Status lease hangat** - dimiliki oleh sesi operator saat ini. Dapat menampung
  profil peramban yang sudah masuk, `/var/cache/crabbox/pnpm`, dan checkout sumber
  yang telah disiapkan selama lease masih aktif.
- **Artefak Mantis** - dimiliki oleh proses OpenClaw. Berada di
  `.artifacts/qa-e2e/mantis/...`; GitHub Actions mengunggahnya dan Aplikasi GitHub
  Mantis memberikan komentar bukti sebaris pada PR.

Jangan pernah menyertakan rahasia, cookie peramban, status masuk Slack, checkout repositori,
`node_modules`, atau `dist/` ke dalam citra penyedia.

## Pengiriman GitHub

Jalankan alur kerja dari `main`:

```bash
gh workflow run mantis-slack-desktop-smoke.yml \
  --ref main \
  -f candidate_ref=<trusted-ref-or-sha> \
  -f pr_number=<pr-number> \
  -f scenario_id=slack-canary \
  -f crabbox_provider=aws \
  -f keep_vm=false \
  -f hydrate_mode=source
```

`candidate_ref` dibatasi karena alur kerja menggunakan kredensial langsung: referensi ini
harus mengarah ke leluhur `main` saat ini, tag rilis, atau head PR terbuka di
`openclaw/openclaw`.

Alur kerja menghasilkan:

- artefak yang diunggah `mantis-slack-desktop-smoke-<run-id>-<attempt>`
- komentar PR sebaris dari Aplikasi GitHub Mantis
- `slack-desktop-smoke.png`, `slack-desktop-smoke.mp4`
- `slack-desktop-smoke-preview.gif`, `slack-desktop-smoke-change.mp4`
- `mantis-slack-desktop-smoke-summary.json`, `mantis-slack-desktop-smoke-report.md`
- log jarak jauh: `slack-desktop-command.log`, `openclaw-gateway.log`, `chrome.log`, `ffmpeg.log`

Komentar PR diperbarui di tempat melalui penanda tersembunyi `<!-- mantis-slack-desktop-smoke -->`.

## CLI lokal

Bukti sumber dingin:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --credential-source convex \
  --credential-role maintainer \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --scenario slack-canary \
  --hydrate-mode source
```

Pertahankan VM untuk pemulihan VNC:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Buka VNC:

```bash
crabbox vnc --provider aws --id <cbx_id> --open
```

Gunakan kembali lease hangat:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

Gunakan `--hydrate-mode prehydrated` hanya ketika ruang kerja jarak jauh yang digunakan kembali sudah
memiliki `node_modules` dan `dist/` yang telah dibangun; jika tidak, Mantis akan gagal secara tertutup.

Buktikan UI persetujuan native Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

`--approval-checkpoints` tidak dapat digunakan bersamaan dengan `--gateway-setup`. Opsi ini menjalankan
skenario pilihan `slack-approval-exec-native` dan `slack-approval-plugin-native`,
kecuali jika Anda meneruskan `--scenario` titik pemeriksaan persetujuan secara eksplisit; skenario
Slack lainnya ditolak sebelum VM dimulai. Pelaksana QA Slack menulis
setiap berkas JSON titik pemeriksaan dari pesan API Slack nyata yang diamatinya, lalu
pemantau jarak jauh merender pesan tersebut ke
`approval-checkpoints/<scenario>-pending.png` dan
`approval-checkpoints/<scenario>-resolved.png`. Proses gagal jika ada
JSON titik pemeriksaan, bukti pesan, JSON konfirmasi, atau tangkapan layar hasil render yang hilang
atau kosong.

Lease GitHub Actions dingin tidak memiliki cookie Slack Web, sehingga tangkapan perambannya
dapat berakhir di layar masuk Slack. Untuk bukti titik pemeriksaan persetujuan, percayai
gambar titik pemeriksaan hasil render dan artefak QA Slack, bukan
`slack-desktop-smoke.png`. Gunakan lease hangat yang dipertahankan dengan profil
Slack Web yang telah masuk secara manual hanya ketika tangkapan layar peramban itu sendiri harus menampilkan
Slack Web.

## Mode hidrasi

| Mode          | Gunakan ketika                             | Perilaku jarak jauh                                                                    | Konsekuensi                                              |
| ------------- | ------------------------------------------ | -------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | Bukti PR normal, mesin dingin, CI          | Menjalankan `pnpm install --frozen-lockfile --prefer-offline` dan `pnpm build` di dalam VM | Paling lambat, bukti checkout sumber paling kuat         |
| `prehydrated` | Anda sengaja menyiapkan lease yang digunakan kembali | Memerlukan `node_modules` dan `dist/` yang sudah ada; melewati pemasangan/pembangunan | Cepat, tetapi hanya valid untuk lease hangat yang dikendalikan operator |

GitHub Actions selalu menyiapkan checkout kandidat sebelum VM dijalankan. Penyimpanan
pnpm-nya di-cache berdasarkan OS, versi Node, dan lockfile. Proses `source` di VM
juga menggunakan kembali `/var/cache/crabbox/pnpm` jika tersedia.

## Interpretasi waktu

`mantis-slack-desktop-smoke-report.md` menyertakan waktu setiap fase:

- `crabbox.warmup` - boot penyedia cloud, kesiapan desktop/peramban, SSH.
- `crabbox.inspect` - pencarian metadata lease.
- `credentials.prepare` - perolehan lease kredensial Convex.
- `crabbox.remote_run` - sinkronisasi, peluncuran peramban, pemasangan/pembangunan OpenClaw atau
  validasi hidrasi, startup Gateway, tangkapan layar, dan perekaman video.
- `artifacts.copy` - rsync kembali dari VM.

`crabbox.remote_run` dapat menampilkan `accepted` ketika Crabbox mengembalikan status jarak jauh
bukan nol, tetapi Mantis menyalin metadata yang membuktikan bahwa penyiapan Gateway OpenClaw
telah selesai atau perintah QA Slack itu sendiri berhasil keluar. Perlakukan
`accepted` sebagai lulus-dengan-penjelasan, bukan skenario yang gagal.

Jika proses berjalan lambat:

- Warmup mendominasi: buat terlebih dahulu atau promosikan citra penyedia Crabbox yang lebih baik.
- `remote_run` mendominasi dalam `source`: gunakan lease hangat, tingkatkan penggunaan kembali penyimpanan
  pnpm, atau pindahkan prasyarat mesin ke dalam citra penyedia.
- `remote_run` mendominasi dalam `prehydrated`: ruang kerja jarak jauh sebenarnya belum
  siap, atau penyiapan Gateway/peramban/Slack lambat.
- Penyalinan artefak mendominasi: periksa ukuran video dan isi direktori artefak.

## Daftar periksa bukti

Komentar PR yang baik menampilkan:

- ID skenario dan SHA kandidat
- URL proses GitHub Actions dan URL artefak
- tangkapan layar titik pemeriksaan persetujuan sebaris, atau tangkapan layar Slack Web dari
  lease hangat yang sudah masuk
- pratinjau animasi sebaris jika tersedia
- tautan MP4 lengkap dan MP4 yang dipangkas
- status lulus/gagal dan ringkasan waktu laporan

Jangan commit tangkapan layar atau video ke dalam repositori. Simpan di artefak GitHub
Actions atau komentar PR.

## Penanganan kegagalan

Jika alur kerja gagal sebelum VM dijalankan, periksa tugas Actions terlebih dahulu.
Penyebab umum: `candidate_ref` tidak tepercaya, rahasia lingkungan tidak tersedia, atau
kegagalan pemasangan/pembangunan kandidat.

Jika proses VM gagal tetapi tangkapan layar berhasil disalin kembali, periksa:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Jika proses mempertahankan lease, buka VNC dengan perintah `crabbox vnc ...`
dari laporan, lalu hentikan lease setelah selesai:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Jika login Slack kedaluwarsa, perbaiki melalui VNC pada lease yang dipertahankan dan jalankan kembali dengan
`--lease-id`. Jangan sertakan profil peramban tersebut ke dalam citra penyedia.

## Terkait

- [Ikhtisar QA](/id/concepts/qa-e2e-automation)
- [Kanal Slack](/id/channels/slack)
- [Pengujian](/id/help/testing)

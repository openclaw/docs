---
read_when:
    - Menjalankan QA desktop Mantis Slack dari GitHub atau secara lokal
    - Men-debug run desktop Mantis Slack yang lambat
    - Memilih mode sumber, prehydrated, atau warm-lease
    - Memposting bukti tangkapan layar dan video ke PR
summary: 'Panduan operasional operator untuk QA desktop Slack Mantis: dispatch GitHub, CLI lokal, lease VNC hangat, mode hydrate, interpretasi waktu, artefak, dan penanganan kegagalan.'
title: Runbook desktop Slack Mantis
x-i18n:
    generated_at: "2026-06-27T17:24:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9310b460a4da84afab72f9e5b5515a94e74b4f4a5030332bd2021d60deb07cc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack desktop QA adalah jalur UI nyata untuk bug sekelas Slack yang memerlukan
desktop Linux, penyelamatan VNC, Slack Web, Gateway OpenClaw nyata, tangkapan layar,
video, dan komentar bukti PR.

Gunakan saat pengujian unit atau jalur live Slack tanpa kepala tidak dapat membuktikan bug.

## Model penyimpanan

Mantis menggunakan tiga lapisan penyimpanan yang berbeda:

- Citra penyedia: dimiliki oleh Crabbox dan disimpan di akun penyedia cloud.
  Ini berisi kemampuan mesin seperti Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, alat build native, dan direktori cache kosong.
- Status lease hangat: dimiliki oleh sesi operator saat ini. Ini dapat berisi
  profil browser yang sudah masuk, `/var/cache/crabbox/pnpm`, dan checkout sumber
  yang sudah disiapkan selama lease masih aktif.
- Artefak Mantis: dimiliki oleh proses OpenClaw. Artefak ini berada di bawah
  `.artifacts/qa-e2e/mantis/...`, lalu GitHub Actions mengunggahnya dan
  Mantis GitHub App mengomentari bukti sebaris pada PR.

Jangan pernah memasukkan rahasia, cookie browser, status login Slack, checkout repositori,
`node_modules`, atau `dist/` ke dalam citra penyedia yang sudah diprebake.

## Dispatch GitHub

Jalankan workflow dari `main`:

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

Nilai `candidate_ref` yang diizinkan sengaja dibatasi karena workflow
menggunakan kredensial live: ancestry `main` saat ini, tag rilis, atau head PR terbuka
dari `openclaw/openclaw`.

Workflow menulis:

- artefak yang diunggah: `mantis-slack-desktop-smoke-<run-id>-<attempt>`;
- komentar PR sebaris dari Mantis GitHub App;
- `slack-desktop-smoke.png`;
- `slack-desktop-smoke.mp4`;
- `slack-desktop-smoke-preview.gif`;
- `slack-desktop-smoke-change.mp4`;
- `mantis-slack-desktop-smoke-summary.json`;
- `mantis-slack-desktop-smoke-report.md`;
- log remote seperti `slack-desktop-command.log`, `openclaw-gateway.log`,
  `chrome.log`, dan `ffmpeg.log`.

Komentar PR diperbarui di tempat oleh penanda tersembunyi
`<!-- mantis-slack-desktop-smoke -->`.

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

Pertahankan VM untuk penyelamatan VNC:

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

Gunakan ulang lease hangat:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

Gunakan `--hydrate-mode prehydrated` hanya saat workspace remote yang digunakan ulang sudah
memiliki `node_modules` dan `dist/` yang sudah dibuild. Mantis gagal tertutup jika itu
hilang.

Buktikan UI persetujuan Slack native:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

Mode checkpoint persetujuan saling eksklusif dengan `--gateway-setup`. Mode ini menjalankan
skenario opt-in `slack-approval-exec-native` dan `slack-approval-plugin-native`
kecuali Anda meneruskan flag `--scenario` checkpoint persetujuan eksplisit; skenario
Slack lainnya ditolak sebelum VM dimulai. Runner Slack QA menulis
setiap file JSON checkpoint dari pesan Slack API nyata yang diamatinya, lalu
watcher remote merender snapshot pesan tersebut ke
`approval-checkpoints/<scenario>-pending.png` dan
`approval-checkpoints/<scenario>-resolved.png`. Proses gagal jika ada JSON checkpoint,
bukti pesan, JSON ack, atau tangkapan layar hasil render yang hilang atau kosong.

Lease GitHub Actions dingin tidak memiliki cookie Slack Web, sehingga tangkapan browsernya
dapat berhenti di proses masuk Slack. Untuk bukti checkpoint persetujuan, percayai
gambar checkpoint hasil render dan artefak Slack QA daripada
`slack-desktop-smoke.png`. Gunakan lease hangat yang dipertahankan dengan profil Slack
Web yang sudah login secara manual hanya saat tangkapan layar browser itu sendiri harus menampilkan Slack Web.

## Mode hydrate

| Mode          | Gunakan saat                               | Perilaku remote                                                                       | Tradeoff                                                 |
| ------------- | ------------------------------------------ | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | Bukti PR normal, mesin dingin, CI          | Menjalankan `pnpm install --frozen-lockfile --prefer-offline` dan `pnpm build` di dalam VM | Paling lambat, bukti checkout sumber paling kuat         |
| `prehydrated` | Anda sengaja menyiapkan lease yang digunakan ulang | Memerlukan `node_modules` dan `dist/` yang sudah ada; melewati install/build          | Cepat, tetapi hanya valid untuk lease hangat yang dikendalikan operator |

GitHub Actions selalu menyiapkan checkout kandidat sebelum proses VM. Store
pnpm-nya dicache berdasarkan OS, versi Node, dan lockfile. Proses sumber VM juga
menggunakan `/var/cache/crabbox/pnpm` saat tersedia.

## Interpretasi waktu

`mantis-slack-desktop-smoke-report.md` mencakup waktu fase:

- `crabbox.warmup`: boot penyedia cloud, kesiapan desktop/browser, dan SSH.
- `crabbox.inspect`: pencarian metadata lease.
- `credentials.prepare`: akuisisi lease kredensial Convex.
- `crabbox.remote_run`: sinkronisasi, peluncuran browser, install/build OpenClaw atau
  validasi hydrate, startup Gateway, tangkapan layar, dan perekaman video.
- `artifacts.copy`: rsync balik dari VM.

`crabbox.remote_run` dapat ditandai `accepted` saat Crabbox mengembalikan status
remote bukan nol setelah Mantis menyalin metadata yang membuktikan bahwa setup Gateway
OpenClaw selesai atau perintah Slack QA itu sendiri berhasil keluar.
Anggap `accepted` sebagai lulus dengan penjelasan, bukan skenario gagal.

Jika proses lambat:

- warmup mendominasi: prebake atau promosikan citra penyedia Crabbox yang lebih baik;
- remote_run mendominasi di `source`: gunakan lease hangat, tingkatkan penggunaan ulang store pnpm,
  atau pindahkan prasyarat mesin ke citra penyedia;
- remote_run mendominasi di `prehydrated`: workspace remote sebenarnya belum
  siap, atau setup Gateway/browser/Slack lambat;
- penyalinan artefak mendominasi: periksa ukuran video dan isi direktori artefak.

## Checklist bukti

Komentar PR yang baik harus menampilkan:

- id skenario dan SHA kandidat;
- URL proses GitHub Actions;
- URL artefak;
- tangkapan layar checkpoint persetujuan sebaris, atau tangkapan layar Slack Web dari
  lease hangat yang sudah login;
- pratinjau animasi sebaris saat tersedia;
- tautan MP4 penuh dan MP4 yang dipangkas;
- status lulus/gagal;
- ringkasan waktu dalam laporan terlampir.

Jangan commit tangkapan layar atau video ke dalam repositori. Simpan di artefak
GitHub Actions atau komentar PR.

## Penanganan kegagalan

Jika workflow gagal sebelum proses VM, periksa job Actions terlebih dahulu. Penyebab
umumnya adalah `candidate_ref` yang tidak tepercaya, rahasia environment yang hilang, atau kegagalan
install/build kandidat.

Jika proses VM gagal tetapi tangkapan layar berhasil disalin kembali, periksa:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Jika proses mempertahankan lease, buka VNC dengan perintah `crabbox vnc ...` dari laporan.
Hentikan lease setelah selesai:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Jika login Slack kedaluwarsa, perbaiki di VNC pada lease yang dipertahankan dan jalankan ulang dengan
`--lease-id`. Jangan bake profil browser itu ke dalam citra penyedia.

## Terkait

- [Ikhtisar QA](/id/concepts/qa-e2e-automation)
- [Kanal Slack](/id/channels/slack)
- [Pengujian](/id/help/testing)

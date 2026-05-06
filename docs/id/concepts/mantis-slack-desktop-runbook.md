---
read_when:
    - Menjalankan QA desktop Mantis Slack dari GitHub atau secara lokal
    - Men-debug eksekusi desktop Mantis Slack yang lambat
    - Memilih mode sumber, pra-terhidrasi, atau sewa-hangat
    - Memposting bukti tangkapan layar dan video ke PR
summary: 'Runbook operator untuk QA desktop Mantis Slack: dispatch GitHub, CLI lokal, lease VNC hangat, mode hydrate, interpretasi waktu, artefak, dan penanganan kegagalan.'
title: Panduan operasional desktop Mantis Slack
x-i18n:
    generated_at: "2026-05-06T09:07:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83ca8792b53e5b14e592c2cbec6f6adfc936834e19f340f8e5eb3d467ecd3209
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack desktop QA adalah jalur UI nyata untuk bug kelas Slack yang memerlukan
desktop Linux, penyelamatan VNC, Slack Web, Gateway OpenClaw nyata, tangkapan layar,
video, dan komentar bukti PR.

Gunakan ini saat pengujian unit atau jalur live Slack headless tidak dapat membuktikan bug tersebut.

## Model penyimpanan

Mantis menggunakan tiga lapisan penyimpanan berbeda:

- Image penyedia: dimiliki oleh Crabbox dan disimpan di akun penyedia cloud.
  Ini berisi kapabilitas mesin seperti Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, alat build native, dan direktori cache kosong.
- Status lease hangat: dimiliki oleh sesi operator saat ini. Ini dapat berisi
  profil browser yang sudah login, `/var/cache/crabbox/pnpm`, dan checkout sumber
  yang sudah disiapkan selama lease masih aktif.
- Artefak Mantis: dimiliki oleh run OpenClaw. Artefak ini berada di bawah
  `.artifacts/qa-e2e/mantis/...`, lalu GitHub Actions mengunggahnya dan
  Mantis GitHub App mengomentari bukti inline pada PR.

Jangan pernah memasukkan rahasia, cookie browser, status login Slack, checkout repositori,
`node_modules`, atau `dist/` ke dalam image penyedia yang sudah dipanggang sebelumnya.

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

Nilai `candidate_ref` yang diizinkan sengaja dibuat sempit karena workflow
menggunakan kredensial live: ancestry `main` saat ini, tag rilis, atau head PR terbuka
dari `openclaw/openclaw`.

Workflow menulis:

- artefak yang diunggah: `mantis-slack-desktop-smoke-<run-id>-<attempt>`;
- komentar PR inline dari Mantis GitHub App;
- `slack-desktop-smoke.png`;
- `slack-desktop-smoke.mp4`;
- `slack-desktop-smoke-preview.gif`;
- `slack-desktop-smoke-change.mp4`;
- `mantis-slack-desktop-smoke-summary.json`;
- `mantis-slack-desktop-smoke-report.md`;
- log remote seperti `slack-desktop-command.log`, `openclaw-gateway.log`,
  `chrome.log`, dan `ffmpeg.log`.

Komentar PR diperbarui di tempat oleh marker tersembunyi
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

Gunakan kembali lease hangat:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

Gunakan `--hydrate-mode prehydrated` hanya saat workspace remote yang digunakan kembali sudah
memiliki `node_modules` dan `dist/` yang sudah dibangun. Mantis gagal tertutup jika keduanya
tidak ada.

## Mode hydrate

| Mode          | Gunakan saat                               | Perilaku remote                                                                       | Tradeoff                                                 |
| ------------- | ------------------------------------------ | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | Bukti PR normal, mesin dingin, CI          | Menjalankan `pnpm install --frozen-lockfile --prefer-offline` dan `pnpm build` di dalam VM | Paling lambat, bukti checkout sumber paling kuat         |
| `prehydrated` | Anda sengaja menyiapkan lease yang digunakan kembali | Mengharuskan `node_modules` dan `dist/` sudah ada; melewati install/build             | Cepat, tetapi hanya valid untuk lease hangat yang dikontrol operator |

GitHub Actions selalu menyiapkan checkout kandidat sebelum run VM. Store
pnpm-nya di-cache berdasarkan OS, versi Node, dan lockfile. Run sumber VM juga
menggunakan `/var/cache/crabbox/pnpm` jika ada.

## Interpretasi waktu

`mantis-slack-desktop-smoke-report.md` mencakup waktu fase:

- `crabbox.warmup`: boot penyedia cloud, kesiapan desktop/browser, dan SSH.
- `crabbox.inspect`: lookup metadata lease.
- `credentials.prepare`: akuisisi lease kredensial Convex.
- `crabbox.remote_run`: sinkronisasi, peluncuran browser, install/build OpenClaw atau
  validasi hydrate, startup Gateway, tangkapan layar, dan perekaman video.
- `artifacts.copy`: rsync kembali dari VM.

`crabbox.remote_run` dapat ditandai `accepted` saat Crabbox mengembalikan status
remote bukan nol setelah Mantis menyalin metadata yang membuktikan bahwa Gateway OpenClaw
hidup dan penyiapan selesai. Perlakukan `accepted` sebagai lulus-dengan-penjelasan,
bukan skenario gagal.

Jika run lambat:

- warmup mendominasi: panggang sebelumnya atau promosikan image penyedia Crabbox yang lebih baik;
- remote_run mendominasi dalam `source`: gunakan lease hangat, tingkatkan penggunaan ulang store pnpm,
  atau pindahkan prasyarat mesin ke image penyedia;
- remote_run mendominasi dalam `prehydrated`: workspace remote sebenarnya belum
  siap, atau penyiapan Gateway/browser/Slack lambat;
- penyalinan artefak mendominasi: periksa ukuran video dan isi direktori artefak.

## Checklist bukti

Komentar PR yang baik harus menampilkan:

- id skenario dan SHA kandidat;
- URL run GitHub Actions;
- URL artefak;
- tangkapan layar inline;
- pratinjau animasi inline jika tersedia;
- tautan MP4 penuh dan MP4 yang dipangkas;
- status lulus/gagal;
- ringkasan waktu dalam laporan terlampir.

Jangan commit tangkapan layar atau video ke repositori. Simpan di artefak GitHub
Actions atau komentar PR.

## Penanganan kegagalan

Jika workflow gagal sebelum run VM, periksa job Actions terlebih dahulu. Penyebab umum
adalah `candidate_ref` yang tidak tepercaya, secret lingkungan yang hilang, atau kegagalan
install/build kandidat.

Jika run VM gagal tetapi tangkapan layar berhasil disalin kembali, periksa:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Jika run mempertahankan lease, buka VNC dengan perintah `crabbox vnc ...` dari laporan.
Hentikan lease setelah selesai:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Jika login Slack kedaluwarsa, perbaiki di VNC pada lease yang dipertahankan dan jalankan ulang dengan
`--lease-id`. Jangan panggang profil browser itu ke dalam image penyedia.

## Terkait

- [Ikhtisar QA](/id/concepts/qa-e2e-automation)
- [Channel Slack](/id/channels/slack)
- [Pengujian](/id/help/testing)

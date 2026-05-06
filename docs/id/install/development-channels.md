---
read_when:
    - Anda ingin beralih antara stable/beta/dev
    - Anda ingin mengunci versi, tag, atau SHA tertentu
    - Anda sedang memberi tag atau menerbitkan prarilis
sidebarTitle: Release Channels
summary: 'Saluran stabil, beta, dan pengembangan: semantik, peralihan, penyematan, dan pemberian tag'
title: Saluran rilis
x-i18n:
    generated_at: "2026-05-06T09:16:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2516165635eb8fbaddf19e07fbb591b659479b5226c2bf467e29247552ababb
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw menyediakan tiga kanal pembaruan:

- **stable**: npm dist-tag `latest`. Direkomendasikan untuk sebagian besar pengguna.
- **beta**: npm dist-tag `beta` saat masih terkini; jika beta tidak ada atau lebih lama dari
  rilis stable terbaru, alur pembaruan kembali menggunakan `latest`.
- **dev**: head bergerak dari `main` (git). npm dist-tag: `dev` (saat dipublikasikan).
  Branch `main` ditujukan untuk eksperimen dan pengembangan aktif. Branch ini dapat berisi
  fitur yang belum lengkap atau perubahan yang merusak kompatibilitas. Jangan gunakan untuk gateway produksi.

Kami biasanya merilis build stable ke **beta** terlebih dahulu, mengujinya di sana, lalu menjalankan
langkah promosi eksplisit yang memindahkan build yang sudah diverifikasi ke `latest` tanpa
mengubah nomor versi. Maintainer juga dapat menerbitkan rilis stable
langsung ke `latest` saat diperlukan. Dist-tag adalah sumber kebenaran untuk instalasi npm.

## Beralih kanal

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` menyimpan pilihan Anda di config (`update.channel`) dan menyelaraskan
metode instalasi:

- **`stable`** (instalasi paket): memperbarui melalui npm dist-tag `latest`.
- **`beta`** (instalasi paket): memprioritaskan npm dist-tag `beta`, tetapi kembali ke
  `latest` saat `beta` tidak ada atau lebih lama dari tag stable saat ini.
- **`stable`** (instalasi git): checkout tag git stable terbaru.
- **`beta`** (instalasi git): memprioritaskan tag git beta terbaru, tetapi kembali ke
  tag git stable terbaru saat beta tidak ada atau lebih lama.
- **`dev`**: memastikan checkout git (default `~/openclaw`, timpa dengan
  `OPENCLAW_GIT_DIR`), beralih ke `main`, melakukan rebase ke upstream, membangun, dan
  menginstal CLI global dari checkout tersebut.

<Tip>
Jika Anda ingin stable dan dev berjalan paralel, simpan dua clone dan arahkan gateway Anda ke clone stable.
</Tip>

## Penargetan versi atau tag satu kali

Gunakan `--tag` untuk menargetkan dist-tag, versi, atau spesifikasi paket tertentu untuk satu
pembaruan **tanpa** mengubah kanal yang tersimpan:

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Install from GitHub main branch (npm tarball)
openclaw update --tag main

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1
```

Catatan:

- `--tag` hanya berlaku untuk **instalasi paket (npm)**. Instalasi git mengabaikannya.
- Tag tidak disimpan. `openclaw update` berikutnya menggunakan kanal yang Anda konfigurasi
  seperti biasa.
- Perlindungan downgrade: jika versi target lebih lama daripada versi Anda saat ini,
  OpenClaw meminta konfirmasi (lewati dengan `--yes`).
- `--channel beta` berbeda dari `--tag beta`: alur kanal dapat kembali
  ke stable/latest saat beta tidak ada atau lebih lama, sedangkan `--tag beta` menargetkan
  dist-tag `beta` mentah untuk satu kali proses tersebut.

## Dry run

Pratinjau apa yang akan dilakukan `openclaw update` tanpa membuat perubahan:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Dry run menampilkan kanal efektif, versi target, tindakan yang direncanakan, dan
apakah konfirmasi downgrade akan diperlukan.

## Plugin dan kanal

Saat Anda beralih kanal dengan `openclaw update`, OpenClaw juga menyinkronkan sumber
Plugin:

- `dev` memprioritaskan Plugin bawaan dari checkout git.
- `stable` dan `beta` memulihkan paket Plugin yang diinstal melalui npm.
- Plugin yang diinstal melalui npm diperbarui setelah pembaruan inti selesai.

## Memeriksa status saat ini

```bash
openclaw update status
```

Menampilkan kanal aktif, jenis instalasi (git atau paket), versi saat ini, dan
sumber (config, tag git, branch git, atau default).

## Praktik terbaik tagging

- Beri tag pada rilis yang Anda inginkan sebagai tujuan checkout git (`vYYYY.M.D` untuk stable,
  `vYYYY.M.D-beta.N` untuk beta).
- `vYYYY.M.D.beta.N` juga dikenali untuk kompatibilitas, tetapi utamakan `-beta.N`.
- Tag lama `vYYYY.M.D-<patch>` masih dikenali sebagai stable (non-beta).
- Jaga agar tag tidak berubah: jangan pernah memindahkan atau menggunakan ulang tag.
- npm dist-tag tetap menjadi sumber kebenaran untuk instalasi npm:
  - `latest` -> stable
  - `beta` -> build kandidat atau build stable yang dirilis ke beta terlebih dahulu
  - `dev` -> snapshot main (opsional)

## Ketersediaan aplikasi macOS

Build beta dan dev mungkin **tidak** menyertakan rilis aplikasi macOS. Itu tidak masalah:

- Tag git dan npm dist-tag tetap dapat dipublikasikan.
- Sebutkan "tidak ada build macOS untuk beta ini" dalam catatan rilis atau changelog.

## Terkait

- [Memperbarui](/id/install/updating)
- [Internal installer](/id/install/installer)

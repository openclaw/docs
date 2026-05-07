---
read_when:
    - Anda ingin beralih antara stabil/beta/dev
    - Anda ingin mengunci versi, tag, atau SHA tertentu
    - Anda sedang membuat tag atau menerbitkan prarilis
sidebarTitle: Release Channels
summary: 'Saluran stabil, beta, dan dev: semantik, peralihan, penyematan, dan penandaan'
title: Saluran rilis
x-i18n:
    generated_at: "2026-05-07T13:20:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2516165635eb8fbaddf19e07fbb591b659479b5226c2bf467e29247552ababb
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw menyediakan tiga saluran pembaruan:

- **stable**: npm dist-tag `latest`. Direkomendasikan untuk sebagian besar pengguna.
- **beta**: npm dist-tag `beta` saat masih terkini; jika beta tidak ada atau lebih lama daripada
  rilis stabil terbaru, alur pembaruan kembali menggunakan `latest`.
- **dev**: head bergerak dari `main` (git). npm dist-tag: `dev` (saat dipublikasikan).
  Cabang `main` ditujukan untuk eksperimen dan pengembangan aktif. Cabang ini dapat berisi
  fitur yang belum lengkap atau perubahan yang merusak kompatibilitas. Jangan gunakan untuk gateway produksi.

Kami biasanya merilis build stabil ke **beta** terlebih dahulu, mengujinya di sana, lalu menjalankan
langkah promosi eksplisit yang memindahkan build yang sudah diperiksa ke `latest` tanpa
mengubah nomor versi. Maintainer juga dapat memublikasikan rilis stabil
langsung ke `latest` bila diperlukan. Dist-tag adalah sumber kebenaran untuk instalasi npm.

## Beralih saluran

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` menyimpan pilihan Anda di konfigurasi (`update.channel`) dan menyelaraskan
metode instalasi:

- **`stable`** (instalasi paket): diperbarui melalui npm dist-tag `latest`.
- **`beta`** (instalasi paket): mengutamakan npm dist-tag `beta`, tetapi kembali menggunakan
  `latest` ketika `beta` tidak ada atau lebih lama daripada tag stabil saat ini.
- **`stable`** (instalasi git): checkout tag git stabil terbaru.
- **`beta`** (instalasi git): mengutamakan tag git beta terbaru, tetapi kembali menggunakan
  tag git stabil terbaru ketika beta tidak ada atau lebih lama.
- **`dev`**: memastikan checkout git (default `~/openclaw`, timpa dengan
  `OPENCLAW_GIT_DIR`), beralih ke `main`, melakukan rebase pada upstream, membangun, dan
  memasang CLI global dari checkout tersebut.

<Tip>
Jika Anda ingin menjalankan stable dan dev secara paralel, simpan dua clone dan arahkan gateway Anda ke clone stable.
</Tip>

## Menargetkan versi atau tag sekali pakai

Gunakan `--tag` untuk menargetkan dist-tag, versi, atau spesifikasi paket tertentu untuk satu
pembaruan **tanpa** mengubah saluran yang tersimpan:

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
- Tag tidak disimpan. `openclaw update` berikutnya menggunakan saluran yang Anda konfigurasikan
  seperti biasa.
- Perlindungan downgrade: jika versi target lebih lama daripada versi Anda saat ini,
  OpenClaw meminta konfirmasi (lewati dengan `--yes`).
- `--channel beta` berbeda dari `--tag beta`: alur saluran dapat kembali
  ke stable/latest ketika beta tidak ada atau lebih lama, sedangkan `--tag beta` menargetkan
  dist-tag `beta` mentah untuk satu kali proses tersebut.

## Dry run

Pratinjau apa yang akan dilakukan `openclaw update` tanpa membuat perubahan:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Dry run menampilkan saluran efektif, versi target, tindakan yang direncanakan, dan
apakah konfirmasi downgrade akan diperlukan.

## Plugin dan saluran

Saat Anda beralih saluran dengan `openclaw update`, OpenClaw juga menyinkronkan
sumber Plugin:

- `dev` mengutamakan Plugin bawaan dari checkout git.
- `stable` dan `beta` memulihkan paket Plugin yang diinstal melalui npm.
- Plugin yang diinstal melalui npm diperbarui setelah pembaruan inti selesai.

## Memeriksa status saat ini

```bash
openclaw update status
```

Menampilkan saluran aktif, jenis instalasi (git atau paket), versi saat ini, dan
sumber (konfigurasi, tag git, cabang git, atau default).

## Praktik terbaik penandaan

- Tandai rilis yang Anda ingin checkout git gunakan (`vYYYY.M.D` untuk stable,
  `vYYYY.M.D-beta.N` untuk beta).
- `vYYYY.M.D.beta.N` juga dikenali untuk kompatibilitas, tetapi sebaiknya gunakan `-beta.N`.
- Tag lama `vYYYY.M.D-<patch>` masih dikenali sebagai stabil (non-beta).
- Jaga agar tag tidak berubah: jangan pernah memindahkan atau menggunakan ulang tag.
- npm dist-tag tetap menjadi sumber kebenaran untuk instalasi npm:
  - `latest` -> stable
  - `beta` -> build kandidat atau build stabil beta-first
  - `dev` -> snapshot main (opsional)

## Ketersediaan aplikasi macOS

Build beta dan dev mungkin **tidak** menyertakan rilis aplikasi macOS. Itu tidak masalah:

- Tag git dan npm dist-tag tetap dapat dipublikasikan.
- Sebutkan "tidak ada build macOS untuk beta ini" dalam catatan rilis atau changelog.

## Terkait

- [Memperbarui](/id/install/updating)
- [Internal installer](/id/install/installer)

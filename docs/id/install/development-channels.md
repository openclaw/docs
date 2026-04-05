---
read_when:
    - Anda ingin berpindah antara stable/beta/dev
    - Anda ingin menetapkan versi, tag, atau SHA tertentu
    - Anda sedang menandai atau memublikasikan prerelease
sidebarTitle: Release Channels
summary: 'Channel stable, beta, dan dev: semantik, perpindahan, pinning, dan penandaan tag'
title: Channel Rilis
x-i18n:
    generated_at: "2026-04-05T13:57:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f33a77bf356f989cd4de5f8bb57f330c276e7571b955bea6994a4527e40258d
    source_path: install/development-channels.md
    workflow: 15
---

# Channel pengembangan

OpenClaw menyediakan tiga channel pembaruan:

- **stable**: npm dist-tag `latest`. Direkomendasikan untuk sebagian besar pengguna.
- **beta**: npm dist-tag `beta` jika tersedia saat ini; jika beta tidak ada atau lebih lama daripada
  rilis stable terbaru, alur pembaruan akan kembali menggunakan `latest`.
- **dev**: head yang terus bergerak dari `main` (git). npm dist-tag: `dev` (jika dipublikasikan).
  Branch `main` digunakan untuk eksperimen dan pengembangan aktif. Branch ini dapat berisi
  fitur yang belum lengkap atau perubahan yang merusak. Jangan gunakan untuk gateway produksi.

Kami biasanya merilis build stable ke **beta** terlebih dahulu, mengujinya di sana, lalu menjalankan
langkah promosi eksplisit yang memindahkan build yang sudah tervalidasi ke `latest` tanpa
mengubah nomor versinya. Maintainer juga dapat memublikasikan rilis stable
langsung ke `latest` jika diperlukan. Dist-tag adalah sumber kebenaran untuk instalasi npm.

## Berpindah channel

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` menyimpan pilihan Anda di konfigurasi (`update.channel`) dan menyelaraskan
metode instalasi:

- **`stable`** (instalasi package): diperbarui melalui npm dist-tag `latest`.
- **`beta`** (instalasi package): mengutamakan npm dist-tag `beta`, tetapi kembali ke
  `latest` saat `beta` tidak ada atau lebih lama dari tag stable saat ini.
- **`stable`** (instalasi git): checkout tag git stable terbaru.
- **`beta`** (instalasi git): mengutamakan tag git beta terbaru, tetapi kembali ke
  tag git stable terbaru saat beta tidak ada atau lebih lama.
- **`dev`**: memastikan ada checkout git (default `~/openclaw`, dapat dioverride dengan
  `OPENCLAW_GIT_DIR`), berpindah ke `main`, melakukan rebase ke upstream, membangun, dan
  menginstal CLI global dari checkout tersebut.

Tip: jika Anda ingin stable + dev berjalan paralel, simpan dua clone dan arahkan
gateway Anda ke clone stable.

## Penargetan versi atau tag sekali jalan

Gunakan `--tag` untuk menargetkan dist-tag, versi, atau spesifikasi package tertentu untuk satu
pembaruan **tanpa** mengubah channel tersimpan Anda:

```bash
# Instal versi tertentu
openclaw update --tag 2026.4.1-beta.1

# Instal dari dist-tag beta (sekali jalan, tidak disimpan)
openclaw update --tag beta

# Instal dari branch GitHub main (npm tarball)
openclaw update --tag main

# Instal spesifikasi package npm tertentu
openclaw update --tag openclaw@2026.4.1-beta.1
```

Catatan:

- `--tag` berlaku hanya untuk **instalasi package (npm)**. Instalasi git mengabaikannya.
- Tag tidak disimpan. `openclaw update` berikutnya akan menggunakan
  channel yang Anda konfigurasi seperti biasa.
- Perlindungan downgrade: jika versi target lebih lama daripada versi Anda saat ini,
  OpenClaw akan meminta konfirmasi (lewati dengan `--yes`).
- `--channel beta` berbeda dari `--tag beta`: alur channel dapat kembali
  ke stable/latest saat beta tidak ada atau lebih lama, sedangkan `--tag beta` menargetkan
  dist-tag `beta` mentah hanya untuk satu kali eksekusi.

## Dry run

Pratinjau apa yang akan dilakukan `openclaw update` tanpa membuat perubahan:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Dry run menampilkan channel efektif, versi target, tindakan yang direncanakan, dan
apakah konfirmasi downgrade akan diperlukan.

## Plugins dan channel

Saat Anda berpindah channel dengan `openclaw update`, OpenClaw juga menyinkronkan sumber
plugin:

- `dev` mengutamakan plugin bawaan dari checkout git.
- `stable` dan `beta` memulihkan package plugin yang diinstal melalui npm.
- Plugin yang diinstal lewat npm diperbarui setelah pembaruan inti selesai.

## Memeriksa status saat ini

```bash
openclaw update status
```

Menampilkan channel aktif, jenis instalasi (git atau package), versi saat ini, dan
sumbernya (konfigurasi, tag git, branch git, atau default).

## Praktik terbaik penandaan tag

- Tandai rilis yang Anda inginkan agar checkout git mendarat di sana (`vYYYY.M.D` untuk stable,
  `vYYYY.M.D-beta.N` untuk beta).
- `vYYYY.M.D.beta.N` juga dikenali untuk kompatibilitas, tetapi gunakan `-beta.N`.
- Tag lama `vYYYY.M.D-<patch>` masih dikenali sebagai stable (bukan beta).
- Pertahankan tag agar immutable: jangan pernah memindahkan atau menggunakan ulang tag.
- npm dist-tag tetap menjadi sumber kebenaran untuk instalasi npm:
  - `latest` -> stable
  - `beta` -> build kandidat atau build stable yang lebih dulu dirilis ke beta
  - `dev` -> snapshot `main` (opsional)

## Ketersediaan aplikasi macOS

Build beta dan dev mungkin **tidak** menyertakan rilis aplikasi macOS. Itu tidak masalah:

- Tag git dan npm dist-tag tetap dapat dipublikasikan.
- Cantumkan "no macOS build for this beta" dalam catatan rilis atau changelog.

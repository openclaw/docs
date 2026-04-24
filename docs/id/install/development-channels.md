---
read_when:
    - Anda ingin beralih di antara stable/beta/dev
    - Anda ingin mem-pin versi, tag, atau SHA tertentu
    - Anda sedang memberi tag atau memublikasikan prerelease
sidebarTitle: Release Channels
summary: 'Kanal stable, beta, dan dev: semantik, perpindahan, pinning, dan tagging'
title: Kanal rilis
x-i18n:
    generated_at: "2026-04-24T09:12:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: d892f3b801cb480652e6e7e757c91c000e842689070564f18782c25108dafa3e
    source_path: install/development-channels.md
    workflow: 15
---

# Kanal pengembangan

OpenClaw menyediakan tiga kanal pembaruan:

- **stable**: npm dist-tag `latest`. Direkomendasikan untuk sebagian besar pengguna.
- **beta**: npm dist-tag `beta` ketika sedang aktif; jika beta tidak ada atau lebih lama dari
  rilis stable terbaru, alur pembaruan fallback ke `latest`.
- **dev**: moving head dari `main` (git). npm dist-tag: `dev` (jika dipublikasikan).
  Branch `main` ditujukan untuk eksperimen dan pengembangan aktif. Branch ini dapat berisi
  fitur yang belum lengkap atau perubahan yang breaking. Jangan gunakan untuk gateway produksi.

Kami biasanya merilis build stable ke **beta** terlebih dahulu, mengujinya di sana, lalu menjalankan
langkah promosi eksplisit yang memindahkan build yang sudah tervalidasi ke `latest` tanpa
mengubah nomor versinya. Maintainer juga dapat memublikasikan rilis stable
langsung ke `latest` bila diperlukan. Dist-tag adalah sumber kebenaran untuk
instalasi npm.

## Beralih kanal

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` mempertahankan pilihan Anda di konfigurasi (`update.channel`) dan menyelaraskan
metode instalasi:

- **`stable`** (instalasi package): memperbarui melalui npm dist-tag `latest`.
- **`beta`** (instalasi package): mengutamakan npm dist-tag `beta`, tetapi fallback ke
  `latest` ketika `beta` tidak ada atau lebih lama dari tag stable saat ini.
- **`stable`** (instalasi git): checkout tag git stable terbaru.
- **`beta`** (instalasi git): mengutamakan tag git beta terbaru, tetapi fallback ke
  tag git stable terbaru ketika beta tidak ada atau lebih lama.
- **`dev`**: memastikan ada checkout git (default `~/openclaw`, override dengan
  `OPENCLAW_GIT_DIR`), beralih ke `main`, rebase ke upstream, build, dan
  menginstal CLI global dari checkout tersebut.

Tip: jika Anda ingin stable + dev secara paralel, pertahankan dua clone dan arahkan
gateway Anda ke clone stable.

## Penargetan versi atau tag satu kali

Gunakan `--tag` untuk menargetkan dist-tag, versi, atau spesifikasi package tertentu untuk satu
pembaruan **tanpa** mengubah kanal yang dipertahankan:

```bash
# Instal versi tertentu
openclaw update --tag 2026.4.1-beta.1

# Instal dari beta dist-tag (satu kali, tidak dipertahankan)
openclaw update --tag beta

# Instal dari branch main GitHub (npm tarball)
openclaw update --tag main

# Instal spesifikasi package npm tertentu
openclaw update --tag openclaw@2026.4.1-beta.1
```

Catatan:

- `--tag` hanya berlaku untuk **instalasi package (npm)**. Instalasi git mengabaikannya.
- Tag tidak dipertahankan. `openclaw update` Anda berikutnya menggunakan kanal yang telah dikonfigurasi
  seperti biasa.
- Perlindungan downgrade: jika versi target lebih lama daripada versi Anda saat ini,
  OpenClaw meminta konfirmasi (lewati dengan `--yes`).
- `--channel beta` berbeda dari `--tag beta`: alur kanal dapat fallback
  ke stable/latest ketika beta tidak ada atau lebih lama, sedangkan `--tag beta` menargetkan
  dist-tag `beta` mentah untuk satu run tersebut.

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
plugin:

- `dev` mengutamakan plugin bawaan dari checkout git.
- `stable` dan `beta` memulihkan package plugin yang diinstal dengan npm.
- Plugin yang diinstal dengan npm diperbarui setelah pembaruan inti selesai.

## Memeriksa status saat ini

```bash
openclaw update status
```

Menampilkan kanal aktif, jenis instalasi (git atau package), versi saat ini, dan
sumber (config, tag git, branch git, atau default).

## Praktik terbaik tagging

- Beri tag pada rilis yang Anda ingin checkout git berhenti di sana (`vYYYY.M.D` untuk stable,
  `vYYYY.M.D-beta.N` untuk beta).
- `vYYYY.M.D.beta.N` juga dikenali untuk kompatibilitas, tetapi utamakan `-beta.N`.
- Tag legacy `vYYYY.M.D-<patch>` masih dikenali sebagai stable (non-beta).
- Pertahankan tag tetap immutable: jangan pernah memindahkan atau menggunakan ulang sebuah tag.
- npm dist-tag tetap menjadi sumber kebenaran untuk instalasi npm:
  - `latest` -> stable
  - `beta` -> candidate build atau build stable yang dirilis dulu ke beta
  - `dev` -> snapshot main (opsional)

## Ketersediaan aplikasi macOS

Build beta dan dev mungkin **tidak** menyertakan rilis aplikasi macOS. Itu tidak masalah:

- Tag git dan npm dist-tag tetap dapat dipublikasikan.
- Sebutkan "no macOS build for this beta" dalam catatan rilis atau changelog.

## Terkait

- [Updating](/id/install/updating)
- [Installer internals](/id/install/installer)

---
read_when:
    - Anda ingin beralih antara stable/beta/dev
    - Anda ingin mengunci versi, tag, atau SHA tertentu
    - Anda sedang memberi tag atau menerbitkan prarilis
sidebarTitle: Release Channels
summary: 'Saluran stabil, beta, dan dev: semantik, peralihan, penyematan, dan penandaan'
title: Saluran rilis
x-i18n:
    generated_at: "2026-04-30T09:55:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 741d8ed2a1599264e1b41a99e81fac4b06d14cb026aa945a8757b15e5733f682
    source_path: install/development-channels.md
    workflow: 16
---

# Saluran pengembangan

OpenClaw mengirimkan tiga saluran pembaruan:

- **stable**: npm dist-tag `latest`. Direkomendasikan untuk sebagian besar pengguna.
- **beta**: npm dist-tag `beta` saat masih terkini; jika beta tidak ada atau lebih lama daripada
  rilis stable terbaru, alur pembaruan kembali menggunakan `latest`.
- **dev**: posisi terbaru yang terus bergerak dari `main` (git). npm dist-tag: `dev` (saat diterbitkan).
  Cabang `main` ditujukan untuk eksperimen dan pengembangan aktif. Cabang ini dapat berisi
  fitur yang belum lengkap atau perubahan yang merusak kompatibilitas. Jangan gunakan untuk gateway produksi.

Kami biasanya mengirimkan build stable ke **beta** terlebih dahulu, mengujinya di sana, lalu menjalankan
langkah promosi eksplisit yang memindahkan build yang sudah diperiksa ke `latest` tanpa
mengubah nomor versi. Maintainer juga dapat menerbitkan rilis stable
langsung ke `latest` saat diperlukan. Dist-tag adalah sumber kebenaran untuk instalasi npm.

## Beralih saluran

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` menyimpan pilihan Anda di konfigurasi (`update.channel`) dan menyelaraskan
metode instalasi:

- **`stable`** (instalasi paket): diperbarui melalui npm dist-tag `latest`.
- **`beta`** (instalasi paket): mengutamakan npm dist-tag `beta`, tetapi kembali ke
  `latest` saat `beta` tidak ada atau lebih lama daripada tag stable saat ini.
- **`stable`** (instalasi git): melakukan checkout ke tag git stable terbaru.
- **`beta`** (instalasi git): mengutamakan tag git beta terbaru, tetapi kembali ke
  tag git stable terbaru saat beta tidak ada atau lebih lama.
- **`dev`**: memastikan checkout git (default `~/openclaw`, timpa dengan
  `OPENCLAW_GIT_DIR`), beralih ke `main`, melakukan rebase pada upstream, membangun, dan
  menginstal CLI global dari checkout tersebut.

<Tip>
Jika Anda ingin stable dan dev berjalan paralel, simpan dua clone dan arahkan gateway Anda ke yang stable.
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
  ke stable/latest saat beta tidak ada atau lebih lama, sedangkan `--tag beta` menargetkan
  dist-tag mentah `beta` hanya untuk sekali jalan tersebut.

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
sumber plugin:

- `dev` mengutamakan plugin bawaan dari checkout git.
- `stable` dan `beta` memulihkan paket plugin yang diinstal dari npm.
- Plugin yang diinstal dari npm diperbarui setelah pembaruan inti selesai.

## Memeriksa status saat ini

```bash
openclaw update status
```

Menampilkan saluran aktif, jenis instalasi (git atau paket), versi saat ini, dan
sumber (konfigurasi, tag git, cabang git, atau default).

## Praktik terbaik penandaan

- Beri tag pada rilis yang Anda ingin checkout git tuju (`vYYYY.M.D` untuk stable,
  `vYYYY.M.D-beta.N` untuk beta).
- `vYYYY.M.D.beta.N` juga dikenali untuk kompatibilitas, tetapi utamakan `-beta.N`.
- Tag lama `vYYYY.M.D-<patch>` masih dikenali sebagai stable (non-beta).
- Jaga tag tetap tidak berubah: jangan pernah memindahkan atau menggunakan ulang tag.
- npm dist-tag tetap menjadi sumber kebenaran untuk instalasi npm:
  - `latest` -> stable
  - `beta` -> build kandidat atau build stable yang masuk beta terlebih dahulu
  - `dev` -> snapshot main (opsional)

## Ketersediaan aplikasi macOS

Build beta dan dev mungkin **tidak** menyertakan rilis aplikasi macOS. Itu tidak masalah:

- Tag git dan npm dist-tag tetap dapat diterbitkan.
- Sebutkan "tidak ada build macOS untuk beta ini" di catatan rilis atau changelog.

## Terkait

- [Memperbarui](/id/install/updating)
- [Internal installer](/id/install/installer)

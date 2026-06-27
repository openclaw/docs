---
read_when:
    - Anda ingin beralih antara stabil/beta/dev
    - Anda ingin mengunci versi, tag, atau SHA tertentu
    - Anda sedang menandai atau menerbitkan prerelease
sidebarTitle: Release Channels
summary: 'Kanal stable, beta, dan dev: semantik, perpindahan, penyematan, dan penandaan'
title: Saluran rilis
x-i18n:
    generated_at: "2026-06-27T17:37:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b5b0b8b43dd15b3fdd83d28c5d0292d260594325ad6e6e95533720ba3e59277
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw mengirimkan tiga saluran pembaruan:

- **stable**: npm dist-tag `latest`. Direkomendasikan untuk sebagian besar pengguna.
- **beta**: npm dist-tag `beta` saat masih mutakhir; jika beta tidak ada atau lebih lama daripada
  rilis stable terbaru, alur pembaruan kembali menggunakan `latest`.
- **dev**: head bergerak dari `main` (git). npm dist-tag: `dev` (saat dipublikasikan).
  Branch `main` ditujukan untuk eksperimen dan pengembangan aktif. Branch ini dapat berisi
  fitur yang belum lengkap atau perubahan yang merusak kompatibilitas. Jangan gunakan untuk Gateway produksi.

Kami biasanya mengirimkan build stable ke **beta** terlebih dahulu, mengujinya di sana, lalu menjalankan
langkah promosi eksplisit yang memindahkan build yang telah diverifikasi ke `latest` tanpa
mengubah nomor versi. Maintainer juga dapat menerbitkan rilis stable
langsung ke `latest` bila diperlukan. Dist-tag adalah sumber kebenaran untuk instalasi npm.

## Beralih saluran

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` menyimpan pilihan Anda di config (`update.channel`) dan menyelaraskan
metode instalasi:

- **`stable`** (instalasi paket): diperbarui melalui npm dist-tag `latest`.
- **`beta`** (instalasi paket): mengutamakan npm dist-tag `beta`, tetapi kembali ke
  `latest` saat `beta` tidak ada atau lebih lama daripada tag stable saat ini.
- **`stable`** (instalasi git): checkout tag git stable terbaru, mengecualikan
  tag prarilis semver seperti `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`,
  `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N`, dan sufiks prarilis
  lainnya.
- **`beta`** (instalasi git): mengutamakan tag git beta terbaru, tetapi kembali ke
  tag git stable terbaru saat beta tidak ada atau lebih lama.
- **`dev`**: memastikan checkout git (default `~/openclaw`, atau
  `$OPENCLAW_HOME/openclaw` saat `OPENCLAW_HOME` disetel; timpa dengan
  `OPENCLAW_GIT_DIR`), beralih ke `main`, melakukan rebase pada upstream, build, dan
  menginstal CLI global dari checkout tersebut.

<Tip>
Jika Anda ingin stable dan dev berjalan paralel, simpan dua clone dan arahkan Gateway Anda ke yang stable.
</Tip>

## Menargetkan versi atau tag satu kali

Gunakan `--tag` untuk menargetkan dist-tag, versi, atau spesifikasi paket tertentu untuk satu
pembaruan **tanpa** mengubah saluran tersimpan Anda:

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Switch to the moving GitHub main checkout
openclaw update --channel dev

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1

# Install from GitHub main once without persisting the channel
openclaw update --tag main
```

Catatan:

- `--tag` berlaku **hanya untuk instalasi paket (npm)**. Instalasi git mengabaikannya.
- Tag tidak disimpan. `openclaw update` Anda berikutnya menggunakan saluran yang dikonfigurasi
  seperti biasa.
- Untuk instalasi paket, OpenClaw melakukan pre-pack spesifikasi sumber GitHub/git ke dalam
  tarball sementara sebelum instalasi npm bertahap. Gunakan `--channel dev` atau
  `--install-method git --version main` saat Anda menginginkan checkout `main`
  bergerak sebagai instalasi persisten.
- Perlindungan downgrade: jika versi target lebih lama daripada versi Anda saat ini,
  OpenClaw meminta konfirmasi (lewati dengan `--yes`).
- `--channel beta` berbeda dari `--tag beta`: alur saluran dapat kembali
  ke stable/latest saat beta tidak ada atau lebih lama, sedangkan `--tag beta` menargetkan
  dist-tag `beta` mentah untuk satu proses tersebut.

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

Saat Anda beralih saluran dengan `openclaw update`, OpenClaw juga menyinkronkan sumber
Plugin:

- `dev` mengutamakan Plugin bawaan dari checkout git.
- `stable` dan `beta` memulihkan paket Plugin yang diinstal npm.
- Plugin yang diinstal npm diperbarui setelah pembaruan inti selesai.

## Memeriksa status saat ini

```bash
openclaw update status
```

Menampilkan saluran aktif, jenis instalasi (git atau paket), versi saat ini, dan
sumber (config, tag git, branch git, atau default).

## Praktik terbaik penandaan

- Beri tag pada rilis yang Anda inginkan menjadi tujuan akhir checkout git (`vYYYY.M.PATCH` untuk stable,
  `vYYYY.M.PATCH-beta.N` untuk beta; sufiks prarilis semver bernama seperti
  `-alpha.N`, `-rc.N`, dan `-next.N` bukan target stable).
- Tag stable numerik lama seperti `vYYYY.M.PATCH-1` dan `v1.0.1-1` masih
  dikenali sebagai tag git stable untuk kompatibilitas.
- `vYYYY.M.PATCH.beta.N` juga dikenali untuk kompatibilitas, tetapi lebih baik gunakan `-beta.N`.
- Jaga agar tag tidak berubah: jangan pernah memindahkan atau menggunakan ulang tag.
- npm dist-tag tetap menjadi sumber kebenaran untuk instalasi npm:
  - `latest` -> stable
  - `beta` -> build kandidat atau build stable yang masuk beta terlebih dahulu
  - `dev` -> snapshot main (opsional)

## Ketersediaan aplikasi macOS

Build beta dan dev mungkin **tidak** menyertakan rilis aplikasi macOS. Itu tidak masalah:

- Tag git dan npm dist-tag tetap dapat dipublikasikan.
- Sebutkan "tidak ada build macOS untuk beta ini" di catatan rilis atau changelog.

## Terkait

- [Memperbarui](/id/install/updating)
- [Internal installer](/id/install/installer)

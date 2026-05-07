---
read_when:
    - Anda ingin beralih antara stable/beta/dev
    - Anda ingin menyematkan versi, tag, atau SHA tertentu
    - Anda sedang memberi tag atau menerbitkan prarilis
sidebarTitle: Release Channels
summary: 'Kanal stable, beta, dan dev: semantik, peralihan, penyematan, dan penandaan'
title: Saluran rilis
x-i18n:
    generated_at: "2026-05-07T01:52:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6579110cc5c0e62ef238d7e4200db5fea188f35dc9366a17b3cf92a58c8935cc
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw menyediakan tiga kanal pembaruan:

- **stable**: npm dist-tag `latest`. Direkomendasikan untuk sebagian besar pengguna.
- **beta**: npm dist-tag `beta` saat masih terkini; jika beta tidak ada atau lebih lama dari
  rilis stabil terbaru, alur pembaruan kembali menggunakan `latest`.
- **dev**: posisi head bergerak dari `main` (git). npm dist-tag: `dev` (saat dipublikasikan).
  Branch `main` ditujukan untuk eksperimen dan pengembangan aktif. Branch ini dapat berisi
  fitur yang belum lengkap atau perubahan yang merusak kompatibilitas. Jangan gunakan untuk Gateway produksi.

Kami biasanya merilis build stabil ke **beta** terlebih dahulu, mengujinya di sana, lalu menjalankan
langkah promosi eksplisit yang memindahkan build yang sudah diperiksa ke `latest` tanpa
mengubah nomor versi. Maintainer juga dapat memublikasikan rilis stabil
langsung ke `latest` saat diperlukan. Dist-tag adalah sumber kebenaran untuk instalasi npm.

## Jalur dukungan bulanan yang direncanakan

OpenClaw belum menyediakan kanal LTS atau dukungan bulanan. Kami sedang berupaya
menuju jalur dukungan bulanan yang kompatibel dengan SemVer agar pengguna dapat tetap berada di jalur yang lebih tenang
sementara `latest` terus bergerak cepat.

Bentuk versi yang direncanakan adalah `YYYY.M.PATCH`:

- `YYYY` adalah tahun.
- `M` adalah jalur rilis bulanan, tanpa nol di depan.
- `PATCH` bertambah di dalam jalur bulanan tersebut dan dapat melewati 100 jika diperlukan.

Contoh tag di masa mendatang:

- `v2026.6.0`, `v2026.6.1`, `v2026.6.2` untuk jalur Juni.
- `v2026.6.3-beta.1` untuk prerelease pada jalur cepat/latest.
- Dist-tag jalur dukungan di masa mendatang seperti `stable-2026-6` atau `lts-2026-6` dapat
  menunjuk ke jalur bulanan, tetapi kanal seperti itu belum tersedia hari ini.

Sampai migrasi tersebut tersedia, kanal pembaruan publik tetap `stable`, `beta`,
dan `dev`.

## Beralih kanal

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` menyimpan pilihan Anda di konfigurasi (`update.channel`) dan menyelaraskan
metode instalasi:

- **`stable`** (instalasi paket): memperbarui melalui npm dist-tag `latest`.
- **`beta`** (instalasi paket): mengutamakan npm dist-tag `beta`, tetapi kembali ke
  `latest` saat `beta` tidak ada atau lebih lama dari tag stabil saat ini.
- **`stable`** (instalasi git): checkout tag git stabil terbaru.
- **`beta`** (instalasi git): mengutamakan tag git beta terbaru, tetapi kembali ke
  tag git stabil terbaru saat beta tidak ada atau lebih lama.
- **`dev`**: memastikan checkout git tersedia (default `~/openclaw`, timpa dengan
  `OPENCLAW_GIT_DIR`), beralih ke `main`, melakukan rebase ke upstream, membangun, dan
  menginstal CLI global dari checkout tersebut.

<Tip>
Jika Anda ingin menjalankan stable dan dev secara paralel, simpan dua clone dan arahkan gateway Anda ke clone stable.
</Tip>

## Penargetan versi atau tag sekali pakai

Gunakan `--tag` untuk menargetkan dist-tag, versi, atau spesifikasi paket tertentu untuk satu
pembaruan **tanpa** mengubah kanal tersimpan Anda:

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
- Tag tidak disimpan. `openclaw update` berikutnya akan menggunakan kanal yang Anda konfigurasikan
  seperti biasa.
- Perlindungan downgrade: jika versi target lebih lama dari versi Anda saat ini,
  OpenClaw meminta konfirmasi (lewati dengan `--yes`).
- `--channel beta` berbeda dari `--tag beta`: alur kanal dapat kembali
  ke stable/latest saat beta tidak ada atau lebih lama, sementara `--tag beta` menargetkan
  dist-tag `beta` mentah untuk satu kali proses tersebut.

## Dry run

Pratinjau tindakan yang akan dilakukan `openclaw update` tanpa membuat perubahan:

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
- `stable` dan `beta` memulihkan paket plugin yang diinstal melalui npm.
- Plugin yang diinstal melalui npm diperbarui setelah pembaruan inti selesai.

## Memeriksa status saat ini

```bash
openclaw update status
```

Menampilkan kanal aktif, jenis instalasi (git atau paket), versi saat ini, dan
sumber (konfigurasi, tag git, branch git, atau default).

## Praktik terbaik penandaan

- Tandai rilis yang Anda inginkan sebagai tujuan checkout git (`vYYYY.M.D` untuk rilis
  stabil saat ini, `vYYYY.M.D-beta.N` untuk rilis beta saat ini).
- `vYYYY.M.D.beta.N` juga dikenali untuk kompatibilitas, tetapi utamakan `-beta.N`.
- Tag lama `vYYYY.M.D-<patch>` masih dikenali sebagai stabil (non-beta),
  tetapi model dukungan bulanan yang direncanakan akan menggunakan nomor patch normal
  (`vYYYY.M.PATCH`) alih-alih suffix koreksi dengan tanda hubung.
- Jaga tag tetap immutable: jangan pernah memindahkan atau menggunakan ulang tag.
- npm dist-tag tetap menjadi sumber kebenaran untuk instalasi npm:
  - `latest` -> stable
  - `beta` -> build kandidat atau build stabil yang masuk beta terlebih dahulu
  - `dev` -> snapshot main (opsional)

## Ketersediaan aplikasi macOS

Build beta dan dev mungkin **tidak** menyertakan rilis aplikasi macOS. Itu tidak masalah:

- Tag git dan npm dist-tag tetap dapat dipublikasikan.
- Sebutkan "tidak ada build macOS untuk beta ini" di catatan rilis atau changelog.

## Terkait

- [Memperbarui](/id/install/updating)
- [Internal installer](/id/install/installer)

---
read_when:
    - Anda ingin beralih antara stable/extended-stable/beta/dev
    - Anda ingin menetapkan versi, tag, atau SHA tertentu
    - Anda sedang memberi tag atau memublikasikan prarilis
sidebarTitle: Release Channels
summary: 'Kanal stabil, stabil-diperpanjang, beta, dan pengembangan: semantik, peralihan, penyematan, dan penandaan'
title: Kanal rilis
x-i18n:
    generated_at: "2026-07-12T14:18:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a99e31f5121c0ab8696e638cb10a7ce16e8f32c81e4b2bef1f703eef71191494
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw menyediakan empat saluran pembaruan:

- **stable**: dist-tag npm `latest`. Direkomendasikan untuk sebagian besar pengguna.
- **extended-stable**: dist-tag npm `extended-stable`. Saluran paket baru dengan
  bulan dukungan sebelumnya yang masih didukung. Saluran ini hanya untuk paket,
  dan instalasi hanya dapat dilakukan di latar depan. Pilihan yang tersimpan
  menerima petunjuk pembaruan hanya-baca saat `update.checkOnStart` diaktifkan,
  tetapi tidak pernah menerapkannya secara otomatis.
- **beta**: dist-tag npm `beta`. Beralih ke `latest` sebagai fallback saat `beta`
  tidak tersedia atau lebih lama daripada rilis stabil saat ini.
- **dev**: ujung bergerak dari `main` (git). dist-tag npm `dev` saat dipublikasikan.
  `main` ditujukan untuk eksperimen dan pengembangan aktif; saluran ini mungkin
  berisi fitur yang belum lengkap atau perubahan yang merusak kompatibilitas.
  Jangan menjalankannya untuk Gateway produksi.

Build stabil biasanya dirilis ke **beta** terlebih dahulu, diperiksa di sana,
lalu dipromosikan ke **latest** tanpa menaikkan versi. Pengelola juga dapat
mempublikasikan langsung ke `latest`. Dist-tag merupakan sumber kebenaran untuk
instalasi npm.

## Beralih saluran

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` menyimpan pilihan ke `update.channel` dalam konfigurasi dan
mengendalikan kedua jalur instalasi:

| Saluran           | Instalasi npm/paket                                                                                                                                                                                                 | Instalasi git                                                                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stable`          | dist-tag `latest`                                                                                                                                                                                                   | tag git stabil terbaru (tidak mencakup `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`, `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N`, dan sufiks prarilis bernama lainnya) |
| `extended-stable` | menyelesaikan pemilih npm publik `extended-stable`, memverifikasi paket persis yang dipilih, dan menginstal versi persis tersebut. Gagal secara tertutup tanpa fallback ke `latest`, `beta`, atau `dev`.             | tidak didukung: OpenClaw membiarkan checkout tidak berubah dan meminta Anda menggunakan instalasi paket                                                                   |
| `beta`            | dist-tag `beta`, dengan fallback ke `latest` saat `beta` tidak tersedia atau lebih lama                                                                                                                             | tag git beta terbaru, dengan fallback ke tag git stabil terbaru saat beta tidak tersedia atau lebih lama                                                                  |
| `dev`             | dist-tag `dev` (jarang; sebagian besar pengguna dev menjalankan instalasi git)                                                                                                                                       | mengambil perubahan, melakukan rebase checkout ke cabang `main` hulu, membangun, dan menginstal ulang CLI global                                                          |

Untuk instalasi git `dev`, checkout default adalah `~/openclaw` (atau
`$OPENCLAW_HOME/openclaw` saat `OPENCLAW_HOME` ditetapkan); timpa dengan
`OPENCLAW_GIT_DIR`.

<Tip>
Untuk mempertahankan stable dan dev secara paralel, gunakan dua checkout terpisah dan arahkan setiap Gateway ke checkout-nya masing-masing.
</Tip>

## Menargetkan versi atau tag satu kali

Gunakan `--tag` untuk menargetkan dist-tag, versi, atau spesifikasi paket
tertentu untuk satu pembaruan **tanpa** mengubah saluran yang tersimpan:

```bash
# Instal versi tertentu
openclaw update --tag 2026.4.1-beta.1

# Instal dari dist-tag beta (satu kali, tidak disimpan)
openclaw update --tag beta

# Beralih ke checkout utama GitHub yang bergerak (persisten)
openclaw update --channel dev

# Instal spesifikasi paket npm tertentu
openclaw update --tag openclaw@2026.4.1-beta.1

# Instal dari GitHub main sekali tanpa menyimpan saluran
openclaw update --tag main
```

Catatan:

- `--tag` hanya berlaku untuk **instalasi paket (npm)**; instalasi git
  mengabaikannya.
- Tag tidak disimpan; `openclaw update` berikutnya menggunakan saluran yang
  dikonfigurasi.
- `--tag main` dipetakan ke spesifikasi yang kompatibel dengan npm
  `github:openclaw/openclaw#main` untuk satu eksekusi tersebut. Untuk instalasi
  `main` bergerak yang persisten, gunakan `openclaw update --channel dev`
  (instalasi paket beralih ke checkout git) atau instal ulang dengan metode git
  penginstal:
  `curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --version main`.
  Jalur instalasi npm menolak target sumber GitHub/git sepenuhnya dan sebagai
  gantinya mengarahkan Anda ke metode git.
- Perlindungan penurunan versi: jika versi target lebih lama daripada versi saat
  ini, OpenClaw meminta konfirmasi (lewati dengan `--yes`).
- Extended-stable selalu menggunakan target paket persis yang telah
  diverifikasi. Saluran ini bukan alias satu kali untuk
  `--tag extended-stable`, dan `--tag` tidak dapat digabungkan dengan saluran
  extended-stable yang efektif.
- `--channel beta` berbeda dari `--tag beta`: alur saluran dapat beralih ke
  stable/latest sebagai fallback saat beta tidak tersedia atau lebih lama,
  sedangkan `--tag beta` selalu menargetkan dist-tag `beta` mentah untuk satu
  eksekusi tersebut.

## Simulasi

Pratinjau tindakan yang akan dilakukan `openclaw update` tanpa membuat perubahan:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Simulasi melaporkan saluran efektif, versi target, tindakan yang direncanakan,
dan apakah konfirmasi penurunan versi diperlukan.

## Plugin dan saluran

Beralih saluran dengan `openclaw update` juga menyinkronkan sumber Plugin:

- `dev` mengalihkan Plugin terinstal yang memiliki padanan bawaan kembali ke
  sumber bawaannya (checkout git).
- `stable` dan `beta` memulihkan paket Plugin yang diinstal melalui npm atau
  ClawHub.
- `extended-stable` menyelesaikan Plugin npm resmi yang memenuhi syarat dengan
  maksud kosong/default atau `latest` ke versi inti terinstal yang persis.
  Saluran ini tidak meminta tag Plugin `@extended-stable` pada waktu proses.
- Plugin yang diinstal melalui npm diperbarui setelah pembaruan inti selesai.

## Memeriksa status saat ini

```bash
openclaw update status
```

Menampilkan saluran aktif (beserta sumber yang menentukannya: konfigurasi, tag
git, cabang git, versi terinstal, atau default), jenis instalasi (git atau
paket), versi saat ini, dan ketersediaan pembaruan.

## Praktik terbaik pemberian tag

- Beri tag pada rilis yang ingin Anda jadikan tujuan checkout git:
  `vYYYY.M.PATCH` untuk stabil, `vYYYY.M.PATCH-beta.N` untuk beta. Sufiks
  prarilis bernama seperti `-alpha.N`, `-rc.N`, dan `-next.N` bukan target
  stabil atau beta.
- Tag stabil numerik lama seperti `vYYYY.M.PATCH-1` dan `v1.0.1-1` masih
  dikenali sebagai tag git stabil demi kompatibilitas.
- `vYYYY.M.PATCH.beta.N` (dipisahkan titik) juga dikenali demi kompatibilitas;
  utamakan `-beta.N`.
- Pertahankan tag agar tidak berubah: jangan pernah memindahkan atau menggunakan
  ulang tag.
- Dist-tag npm tetap menjadi sumber kebenaran untuk instalasi npm:
  - `latest` -> stabil
  - `extended-stable` -> rilis paket bulan dukungan sebelumnya yang masih didukung
  - `beta` -> build kandidat atau build stabil yang dirilis ke beta terlebih dahulu
  - `dev` -> snapshot main (opsional)

## Ketersediaan aplikasi macOS

Build beta dan dev mungkin **tidak** menyertakan rilis aplikasi macOS. Hal
tersebut tidak masalah:

- Tag git dan dist-tag npm tetap dapat dipublikasikan secara terpisah.
- Nyatakan "tidak ada build macOS untuk beta ini" dalam catatan rilis atau
  log perubahan.

## Terkait

- [Memperbarui](/id/install/updating)
- [Internal penginstal](/id/install/installer)

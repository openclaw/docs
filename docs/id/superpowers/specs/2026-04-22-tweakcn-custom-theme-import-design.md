---
x-i18n:
    generated_at: "2026-05-02T22:22:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9f2b5783c5762ebe7b5db108a89692e653c515138110b4fa9d23663e2ccbbd5
    source_path: superpowers/specs/2026-04-22-tweakcn-custom-theme-import-design.md
    workflow: 16
---

# Desain Impor Tema Kustom Tweakcn

Status: disetujui di terminal pada 2026-04-22

## Ringkasan

Tambahkan tepat satu slot tema UI Kontrol kustom lokal browser yang dapat diimpor dari tautan berbagi tweakcn. Keluarga tema bawaan yang ada tetap `claw`, `knot`, dan `dash`. Keluarga baru `custom` berperilaku seperti keluarga tema OpenClaw normal dan mendukung mode `light`, `dark`, dan `system` ketika payload tweakcn yang diimpor menyertakan set token terang dan gelap.

Tema yang diimpor hanya disimpan di profil browser saat ini bersama pengaturan UI Kontrol lainnya. Tema ini tidak ditulis ke konfigurasi Gateway dan tidak disinkronkan lintas perangkat atau browser.

## Masalah

Sistem tema UI Kontrol saat ini tertutup pada tiga keluarga tema yang di-hard-code:

- `ui/src/ui/theme.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/styles/base.css`

Pengguna dapat beralih di antara keluarga bawaan dan varian mode, tetapi mereka tidak dapat membawa tema dari tweakcn tanpa mengedit CSS repo. Hasil yang diminta lebih kecil daripada sistem tema umum: pertahankan tiga bawaan dan tambahkan satu slot impor yang dikendalikan pengguna yang dapat diganti dari tautan tweakcn.

## Tujuan

- Pertahankan keluarga tema bawaan yang ada tanpa perubahan.
- Tambahkan tepat satu slot kustom yang diimpor, bukan pustaka tema.
- Terima tautan berbagi tweakcn atau URL langsung `https://tweakcn.com/r/themes/{id}`.
- Pertahankan tema yang diimpor hanya di penyimpanan lokal browser.
- Buat slot yang diimpor berfungsi dengan kontrol mode `light`, `dark`, dan `system` yang ada.
- Jaga perilaku kegagalan tetap aman: impor yang buruk tidak pernah merusak tema UI aktif.

## Bukan tujuan

- Tidak ada pustaka multi-tema atau daftar impor lokal browser.
- Tidak ada persistensi sisi Gateway atau sinkronisasi lintas perangkat.
- Tidak ada editor CSS arbitrer atau editor JSON tema mentah.
- Tidak ada pemuatan otomatis aset font jarak jauh dari tweakcn.
- Tidak ada upaya mendukung payload tweakcn yang hanya mengekspos satu mode.
- Tidak ada refaktor tema seluruh repo di luar seam yang diperlukan untuk UI Kontrol.

## Keputusan pengguna yang sudah dibuat

- Pertahankan tiga tema bawaan.
- Tambahkan satu slot impor bertenaga tweakcn.
- Simpan tema yang diimpor di browser, bukan konfigurasi Gateway.
- Dukung `light`, `dark`, dan `system` untuk slot yang diimpor.
- Menimpa slot kustom dengan impor berikutnya adalah perilaku yang dimaksudkan.

## Pendekatan yang direkomendasikan

Tambahkan id keluarga tema keempat, `custom`, ke model tema UI Kontrol. Keluarga `custom` menjadi dapat dipilih hanya ketika impor tweakcn yang valid tersedia. Payload yang diimpor dinormalisasi menjadi rekaman tema kustom khusus OpenClaw dan disimpan di penyimpanan lokal browser bersama pengaturan UI lainnya.

Saat runtime, OpenClaw merender tag `<style>` terkelola yang mendefinisikan blok variabel CSS kustom yang sudah di-resolve:

```css
:root[data-theme="custom"] { ... }
:root[data-theme="custom-light"] { ... }
```

Ini menjaga variabel tema kustom tetap terscope ke keluarga `custom` dan menghindari kebocoran variabel CSS inline ke keluarga bawaan.

## Arsitektur

### Model tema

Perbarui `ui/src/ui/theme.ts`:

- Perluas `ThemeName` untuk menyertakan `custom`.
- Perluas `ResolvedTheme` untuk menyertakan `custom` dan `custom-light`.
- Perluas `VALID_THEME_NAMES`.
- Perbarui `resolveTheme()` agar `custom` mencerminkan perilaku keluarga yang ada:
  - `custom + dark` -> `custom`
  - `custom + light` -> `custom-light`
  - `custom + system` -> `custom` atau `custom-light` berdasarkan preferensi OS

Tidak ada alias lama yang ditambahkan untuk `custom`.

### Model persistensi

Perluas persistensi `UiSettings` di `ui/src/ui/storage.ts` dengan satu payload tema kustom opsional:

- `customTheme?: ImportedCustomTheme`

Bentuk tersimpan yang direkomendasikan:

```ts
type ImportedCustomTheme = {
  sourceUrl: string;
  themeId: string;
  label: string;
  importedAt: string;
  light: Record<string, string>;
  dark: Record<string, string>;
};
```

Catatan:

- `sourceUrl` menyimpan input pengguna asli setelah normalisasi.
- `themeId` adalah id tema tweakcn yang diekstrak dari URL.
- `label` adalah bidang `name` tweakcn saat tersedia, jika tidak `Custom`.
- `light` dan `dark` sudah berupa peta token OpenClaw yang dinormalisasi, bukan payload tweakcn mentah.
- Payload yang diimpor berada berdampingan dengan pengaturan lokal browser lainnya dan diserialisasi di dokumen penyimpanan lokal yang sama.
- Jika data tema kustom tersimpan hilang atau tidak valid saat dimuat, abaikan payload dan kembali ke `theme: "claw"` ketika keluarga tersimpan adalah `custom`.

### Penerapan runtime

Tambahkan pengelola stylesheet tema kustom yang sempit di runtime UI Kontrol, dimiliki dekat `ui/src/ui/app-settings.ts` dan `ui/src/ui/theme.ts`.

Tanggung jawab:

- Buat atau perbarui satu tag `<style id="openclaw-custom-theme">` yang stabil di `document.head`.
- Emit CSS hanya ketika payload tema kustom yang valid tersedia.
- Hapus konten tag style ketika payload dihapus.
- Pertahankan CSS keluarga bawaan di `ui/src/styles/base.css`; jangan menyisipkan token yang diimpor ke stylesheet yang di-check-in.

Pengelola ini berjalan setiap kali pengaturan dimuat, disimpan, diimpor, atau dihapus.

### Selector mode terang

Implementasi sebaiknya memilih `data-theme-mode="light"` untuk styling terang lintas keluarga, bukan memperlakukan `custom-light` secara khusus. Jika selector yang ada dipatok ke `data-theme="light"` dan perlu berlaku untuk setiap keluarga terang, perluas selector itu sebagai bagian dari pekerjaan ini.

## UX impor

Perbarui `ui/src/ui/views/config.ts` di bagian `Appearance`:

- Tambahkan kartu tema `Custom` di samping `Claw`, `Knot`, dan `Dash`.
- Tampilkan kartu sebagai nonaktif ketika tidak ada tema kustom yang diimpor.
- Tambahkan panel impor di bawah grid tema dengan:
  - satu input teks untuk tautan berbagi tweakcn atau URL `/r/themes/{id}`
  - satu tombol `Import`
  - satu jalur `Replace` ketika payload kustom sudah ada
  - satu aksi `Clear` ketika payload kustom sudah ada
- Tampilkan label tema yang diimpor dan host sumber ketika payload ada.
- Jika tema aktif adalah `custom`, mengimpor pengganti langsung menerapkannya.
- Jika tema aktif bukan `custom`, impor hanya menyimpan payload baru hingga pengguna memilih kartu `Custom`.

Pemilih tema pengaturan cepat di `ui/src/ui/views/config-quick.ts` juga harus menampilkan `Custom` hanya ketika payload ada.

## Penguraian URL dan pengambilan jarak jauh

Jalur impor browser menerima:

- `https://tweakcn.com/themes/{id}`
- `https://tweakcn.com/r/themes/{id}`

Implementasi harus menormalisasi kedua bentuk menjadi:

- `https://tweakcn.com/r/themes/{id}`

Browser kemudian mengambil endpoint `/r/themes/{id}` yang sudah dinormalisasi secara langsung.

Gunakan validator skema sempit untuk payload eksternal. Skema zod lebih disarankan karena ini adalah batas eksternal yang tidak tepercaya.

Bidang jarak jauh yang diperlukan:

- `name` tingkat atas sebagai string opsional
- `cssVars.theme` sebagai object opsional
- `cssVars.light` sebagai object
- `cssVars.dark` sebagai object

Jika `cssVars.light` atau `cssVars.dark` hilang, tolak impor. Ini disengaja: perilaku produk yang disetujui adalah dukungan mode penuh, bukan sintesis best-effort untuk sisi yang hilang.

## Pemetaan token

Jangan mencerminkan variabel tweakcn secara membabi buta. Normalisasi subset terbatas ke token OpenClaw dan turunkan sisanya dalam helper.

### Token yang diimpor langsung

Dari setiap blok mode tweakcn:

- `background`
- `foreground`
- `card`
- `card-foreground`
- `popover`
- `popover-foreground`
- `primary`
- `primary-foreground`
- `secondary`
- `secondary-foreground`
- `muted`
- `muted-foreground`
- `accent`
- `accent-foreground`
- `destructive`
- `destructive-foreground`
- `border`
- `input`
- `ring`
- `radius`

Dari `cssVars.theme` bersama saat tersedia:

- `font-sans`
- `font-mono`

Jika blok mode menimpa `font-sans`, `font-mono`, atau `radius`, nilai lokal mode yang menang.

### Token yang diturunkan untuk OpenClaw

Pengimpor menurunkan variabel khusus OpenClaw dari warna dasar yang diimpor:

- `--bg-accent`
- `--bg-elevated`
- `--bg-hover`
- `--panel`
- `--panel-strong`
- `--panel-hover`
- `--chrome`
- `--chrome-strong`
- `--text`
- `--text-strong`
- `--chat-text`
- `--muted`
- `--muted-strong`
- `--accent-hover`
- `--accent-muted`
- `--accent-subtle`
- `--accent-glow`
- `--focus`
- `--focus-ring`
- `--focus-glow`
- `--secondary`
- `--secondary-foreground`
- `--danger`
- `--danger-muted`
- `--danger-subtle`

Aturan penurunan berada di helper murni agar dapat diuji secara independen. Formula pencampuran warna yang tepat adalah detail implementasi, tetapi helper harus memenuhi dua batasan:

- mempertahankan kontras yang terbaca dekat dengan maksud tema yang diimpor
- menghasilkan output yang stabil untuk payload impor yang sama

### Token yang diabaikan di v1

Token tweakcn ini sengaja diabaikan pada versi pertama:

- `chart-*`
- `sidebar-*`
- `font-serif`
- `shadow-*`
- `tracking-*`
- `letter-spacing`
- `spacing`

Ini menjaga cakupan pada token yang benar-benar dibutuhkan UI Kontrol saat ini.

### Font

String stack font diimpor jika ada, tetapi OpenClaw tidak memuat aset font jarak jauh di v1. Jika stack yang diimpor mereferensikan font yang tidak tersedia di browser, perilaku fallback normal berlaku.

## Perilaku kegagalan

Impor buruk harus gagal tertutup.

- Format URL tidak valid: tampilkan galat validasi inline, jangan mengambil.
- Host atau bentuk path tidak didukung: tampilkan galat validasi inline, jangan mengambil.
- Kegagalan jaringan, respons non-OK, atau JSON cacat: tampilkan galat inline, biarkan payload tersimpan saat ini tidak tersentuh.
- Kegagalan skema atau blok terang/gelap yang hilang: tampilkan galat inline, biarkan payload tersimpan saat ini tidak tersentuh.
- Aksi hapus:
  - menghapus payload kustom tersimpan
  - menghapus konten tag style kustom terkelola
  - jika `custom` aktif, mengganti keluarga tema kembali ke `claw`
- Payload kustom tersimpan tidak valid pada pemuatan pertama:
  - abaikan payload tersimpan
  - jangan emit CSS kustom
  - jika keluarga tema yang tersimpan adalah `custom`, kembali ke `claw`

Tidak pada titik mana pun impor yang gagal boleh meninggalkan dokumen aktif dengan variabel CSS kustom parsial yang diterapkan.

## File yang diharapkan berubah dalam implementasi

File utama:

- `ui/src/ui/theme.ts`
- `ui/src/ui/storage.ts`
- `ui/src/ui/app-settings.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/ui/views/config-quick.ts`
- `ui/src/styles/base.css`

Helper baru yang mungkin:

- `ui/src/ui/custom-theme.ts`

Pengujian:

- `ui/src/ui/app-settings.test.ts`
- `ui/src/ui/storage.node.test.ts`
- `ui/src/ui/views/config.browser.test.ts`
- pengujian terfokus baru untuk penguraian URL dan normalisasi payload

## Pengujian

Cakupan implementasi minimum:

- uraikan URL tautan berbagi menjadi id tema tweakcn
- normalisasi `/themes/{id}` dan `/r/themes/{id}` menjadi URL fetch
- tolak host yang tidak didukung dan id cacat
- validasi bentuk payload tweakcn
- petakan payload tweakcn yang valid menjadi peta token terang dan gelap OpenClaw yang dinormalisasi
- muat dan simpan payload kustom di pengaturan lokal browser
- resolve `custom` untuk `light`, `dark`, dan `system`
- nonaktifkan pemilihan `Custom` ketika tidak ada payload
- terapkan tema yang diimpor segera ketika `custom` sudah aktif
- kembali ke `claw` ketika tema kustom aktif dihapus

Target verifikasi manual:

- impor tema tweakcn yang diketahui dari Settings
- beralih di antara `light`, `dark`, dan `system`
- beralih antara `custom` dan keluarga bawaan
- muat ulang halaman dan konfirmasi tema kustom yang diimpor bertahan secara lokal

## Catatan rollout

Fitur ini sengaja kecil. Jika pengguna nanti meminta beberapa tema impor, penggantian nama, ekspor, atau sinkronisasi lintas perangkat, perlakukan itu sebagai desain lanjutan. Jangan pra-membangun abstraksi pustaka tema dalam implementasi ini.

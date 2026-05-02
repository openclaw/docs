---
read_when:
    - Anda sedang men-debug instalasi paket Plugin
    - Anda mengubah perilaku startup Plugin, doctor, atau instalasi pengelola paket
    - Anda mengelola instalasi OpenClaw terpaket atau manifes Plugin bawaan
sidebarTitle: Dependencies
summary: Cara OpenClaw menginstal paket Plugin dan menyelesaikan dependensi Plugin
title: Resolusi dependensi Plugin
x-i18n:
    generated_at: "2026-05-02T09:27:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43d8008c837d519fd7c886f9615ad53941da340d753b559dfb0a32877716bc1f
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Resolusi dependensi Plugin

OpenClaw menangani pekerjaan dependensi Plugin pada waktu install/update. Pemuatan runtime
tidak menjalankan manajer paket, memperbaiki pohon dependensi, atau mengubah direktori
paket OpenClaw.

## Pembagian tanggung jawab

Paket Plugin memiliki grafik dependensinya sendiri:

- dependensi runtime berada di `dependencies` atau `optionalDependencies`
  paket Plugin
- impor SDK/core adalah peer atau impor yang disediakan OpenClaw
- Plugin pengembangan lokal membawa dependensinya sendiri yang sudah terinstal
- Plugin npm dan git diinstal ke root paket yang dimiliki OpenClaw

OpenClaw hanya memiliki siklus hidup Plugin:

- menemukan sumber Plugin
- menginstal atau memperbarui paket saat diminta secara eksplisit
- mencatat metadata instalasi
- memuat entrypoint Plugin
- gagal dengan error yang dapat ditindaklanjuti saat dependensi hilang

## Root instalasi

OpenClaw menggunakan root per sumber yang stabil:

- paket npm diinstal di bawah `~/.openclaw/npm`
- paket git dikloning di bawah `~/.openclaw/git`
- instalasi lokal/path/archive disalin atau direferensikan tanpa perbaikan dependensi

Instalasi npm berjalan di root npm dengan:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm dapat meng-hoist dependensi transitif ke `~/.openclaw/npm/node_modules` di samping
paket Plugin. OpenClaw memindai root npm terkelola sebelum memercayai
instalasi dan menggunakan npm untuk menghapus paket yang dikelola npm saat uninstall, sehingga dependensi
runtime yang di-hoist tetap berada di dalam batas pembersihan terkelola.

Instalasi git mengkloning atau me-refresh repositori, lalu menjalankan:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Plugin yang terinstal kemudian dimuat dari direktori paket tersebut, sehingga resolusi
`node_modules` lokal paket dan induk bekerja sama seperti pada paket
Node normal.

## Plugin lokal

Plugin lokal diperlakukan sebagai direktori yang dikendalikan developer. OpenClaw tidak
menjalankan `npm install`, `pnpm install`, atau perbaikan dependensi untuknya. Jika Plugin
lokal memiliki dependensi, instal dependensi tersebut di Plugin itu sebelum memuatnya.

Plugin lokal TypeScript pihak ketiga dapat menggunakan jalur darurat Jiti. Plugin
JavaScript yang dikemas dan Plugin internal bawaan dimuat melalui native
import/require alih-alih Jiti.

## Startup dan muat ulang

Startup Gateway dan muat ulang konfigurasi tidak pernah menginstal dependensi Plugin. Keduanya membaca
catatan instalasi Plugin, menghitung entrypoint, dan memuatnya.

Jika dependensi hilang saat runtime, Plugin gagal dimuat dan error
harus mengarahkan operator ke perbaikan eksplisit:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` dapat membersihkan status dependensi lama yang dihasilkan OpenClaw dan menginstal
Plugin unduhan terkonfigurasi yang hilang dari catatan instalasi lokal.
Perintah ini tidak memperbaiki dependensi untuk Plugin lokal yang sudah terinstal.

## Plugin bawaan

Plugin bawaan yang ringan dan kritis bagi core dikirim sebagai bagian dari OpenClaw.
Plugin tersebut sebaiknya tidak memiliki pohon dependensi runtime yang berat atau dipindahkan ke
paket unduhan di ClawHub/npm.

Manifest Plugin bawaan tidak boleh meminta staging dependensi. Fungsionalitas
Plugin yang besar atau opsional sebaiknya dikemas sebagai Plugin normal dan diinstal melalui
jalur npm/git/ClawHub yang sama seperti Plugin pihak ketiga.

Di checkout sumber, OpenClaw memperlakukan repositori sebagai monorepo pnpm. Setelah
`pnpm install`, Plugin bawaan dimuat dari `extensions/<id>` sehingga dependensi workspace
lokal paket tersedia dan edit diterapkan secara langsung. Pengembangan checkout
sumber hanya mendukung pnpm; `npm install` biasa di root repositori bukan
cara yang didukung untuk menyiapkan dependensi Plugin bawaan.

| Bentuk instalasi                 | Lokasi Plugin bawaan                  | Pemilik dependensi                                                    |
| -------------------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| `npm install -g openclaw`        | Pohon runtime hasil build di dalam paket | Paket OpenClaw dan alur install/update/doctor Plugin eksplisit        |
| Checkout git plus `pnpm install` | Paket workspace `extensions/<id>`     | Workspace pnpm, termasuk dependensi milik tiap paket Plugin sendiri   |
| `openclaw plugins install ...`   | Root Plugin npm/git/ClawHub terkelola | Alur install/update Plugin                                            |

## Pembersihan lama

Versi OpenClaw yang lebih lama menghasilkan root dependensi Plugin bawaan saat startup atau
selama perbaikan doctor. Pembersihan doctor saat ini menghapus direktori dan
symlink usang tersebut saat `--fix` digunakan, termasuk root `plugin-runtime-deps` lama,
manifest `.openclaw-runtime-deps*`, `node_modules` Plugin yang dihasilkan, direktori
stage instalasi, dan store pnpm lokal paket.

Path tersebut hanya sisa lama. Instalasi baru tidak boleh membuatnya.

---
read_when:
    - Menyelidiki kerusakan loader tsx/esbuild yang menyebutkan helper __name yang hilang
summary: Crash historis Node + tsx dengan pesan "__name is not a function" dan penyebabnya
title: Crash Node + tsx
x-i18n:
    generated_at: "2026-07-12T14:12:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97d2f62d24860cee65753027ba84c14c8d4ffb910ee17bb0032cf0409c427589
    source_path: debug/node-issue.md
    workflow: 16
---

# Crash Node + tsx "\_\_name bukan sebuah fungsi"

## Status

Terselesaikan. Crash ini tidak dapat direproduksi pada versi `tsx` saat ini yang dipatok di
`package.json` (`4.22.3`) maupun pada rilis Node saat ini. Dokumentasi ini dipertahankan untuk berjaga-jaga jika
peningkatan `tsx`/esbuild di masa mendatang memunculkannya kembali.

## Gejala awal

Menjalankan skrip pengembangan OpenClaw melalui `tsx` gagal saat startup dengan:

```text
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (src/logging/subsystem.ts)
    at <caller> (src/agents/auth-profiles/constants.ts)
```

Nomor baris dihilangkan; kedua berkas telah berubah sejak crash awal
dan baris spesifik tersebut tidak lagi cocok.

Masalah ini muncul setelah skrip pengembangan beralih dari Bun ke `tsx` (`2871657e`,
2026-01-06) agar Bun bersifat opsional. Jalur setara berbasis Bun tidak mengalami crash.
Masalah ini awalnya ditemukan pada Node v25.3.0 di macOS; platform lain yang menjalankan
Node 25 juga dianggap kemungkinan terdampak.

## Penyebab

`tsx` mentransformasi TS/ESM melalui esbuild dengan `keepNames: true` yang ditetapkan secara permanen dalam
opsi transformasinya. Pengaturan tersebut membuat esbuild membungkus deklarasi fungsi/kelas
bernama dalam panggilan ke pembantu `__name` agar `fn.name` tetap dipertahankan setelah minifikasi
dan pemaketan. Crash tersebut berarti pembantu itu tidak ada atau tertutupi di lokasi
pemanggilan untuk modul tersebut dalam kombinasi `tsx`/Node yang terdampak, sehingga `__name(...)`
melempar galat alih-alih mengembalikan nilai yang dibungkus.

## Pemeriksaan reproduksi saat ini

```bash
node --version
pnpm install
node --import tsx src/entry.ts status
```

Reproduksi minimal terisolasi (hanya memuat modul dari jejak tumpukan awal):

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

Saat ini, kedua perintah selesai tanpa galat. Jika salah satunya kembali melempar `__name is not a
function`, catat versi Node yang tepat, versi `tsx`
(`node_modules/tsx/package.json`), dan jejak tumpukan lengkap sebelum melaporkannya ke hulu.

## Solusi sementara (jika crash kembali)

- Jalankan skrip pengembangan dengan Bun alih-alih `node --import tsx`.
- Jalankan `pnpm tsgo` untuk pemeriksaan tipe, lalu jalankan keluaran hasil build alih-alih
  sumber melalui `tsx`:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Coba versi `tsx` lain (`pnpm add -D tsx@<version>` merupakan perubahan dependensi
  dan memerlukan persetujuan sesuai kebijakan repositori) untuk melakukan biseksi apakah versi esbuild
  yang disertakannya memunculkan kembali bug tersebut.
- Uji pada versi mayor/minor Node yang berbeda untuk melihat apakah kegagalan tersebut
  spesifik pada versi tertentu.

## Referensi

- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Terkait

- [Instalasi Node.js](/id/install/node)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)

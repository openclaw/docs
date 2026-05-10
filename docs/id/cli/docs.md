---
read_when:
    - Anda ingin mencari di dokumentasi OpenClaw langsung dari terminal
    - Anda perlu mengetahui biner pembantu mana yang dijalankan oleh CLI dokumentasi melalui shell
summary: Referensi CLI untuk `openclaw docs` (cari di indeks dokumentasi langsung)
title: Dokumentasi
x-i18n:
    generated_at: "2026-05-10T19:28:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0f733083bf455695ed24b13db6fe53e95aa3804fa8696a2fd29e749f24324c8
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

Cari indeks dokumentasi OpenClaw langsung dari terminal. Perintah ini menjalankan endpoint pencarian MCP dokumentasi publik yang dihosting Mintlify di `https://docs.openclaw.ai/mcp.SearchOpenClaw` dan merender hasilnya di terminal Anda.

## Penggunaan

```bash
openclaw docs                       # cetak titik masuk dokumentasi dan contoh pencarian
openclaw docs <query...>            # cari indeks dokumentasi langsung
```

Argumen:

| Argumen      | Deskripsi                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------- |
| `[query...]` | Kueri pencarian bentuk bebas. Kueri multi-kata digabung dengan spasi dan dikirim sebagai satu kesatuan. |

## Contoh

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Tanpa kueri, `openclaw docs` mencetak URL titik masuk dokumentasi beserta contoh perintah pencarian alih-alih menjalankan pencarian.

## Cara kerjanya

`openclaw docs` memanggil CLI `mcporter` untuk memanggil alat pencarian MCP dokumentasi, lalu mengurai blok `Title: / Link: / Content:` dari keluaran alat menjadi daftar hasil.

Untuk menyelesaikan `mcporter`, OpenClaw memeriksa secara berurutan:

1. `mcporter` di `PATH` (digunakan langsung jika ada).
2. `pnpm dlx mcporter ...` jika `pnpm` terinstal.
3. `npx -y mcporter ...` jika `npx` terinstal.

Jika tidak ada yang tersedia, perintah gagal dengan petunjuk untuk menginstal `pnpm` (`npm install -g pnpm`).

Panggilan pencarian menggunakan batas waktu tetap 30 detik. Cuplikan hasil dipotong menjadi sekitar 220 karakter per entri.

## Keluaran

Di terminal kaya (TTY), hasil dirender sebagai heading yang diikuti daftar berpoin. Setiap poin menampilkan judul halaman, URL dokumentasi tertaut, dan cuplikan singkat pada baris berikutnya. Hasil kosong mencetak "Tidak ada hasil.".

Dalam keluaran non-kaya (disalurkan, `--no-color`, skrip), data yang sama dirender sebagai Markdown:

```markdown
# Pencarian dokumentasi: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## Kode keluar

| Kode | Arti                                                        |
| ---- | ----------------------------------------------------------- |
| `0`  | Pencarian berhasil (termasuk respons tanpa hasil).          |
| `1`  | Panggilan alat MCP gagal; stderr dicetak sebaris.           |

## Terkait

- [Referensi CLI](/id/cli)
- [Dokumentasi langsung](https://docs.openclaw.ai)

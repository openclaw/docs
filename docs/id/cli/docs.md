---
read_when:
    - Anda ingin menelusuri dokumentasi OpenClaw langsung dari terminal
    - Anda perlu mengetahui API pencarian terkelola mana yang dipanggil oleh CLI dokumentasi
summary: Referensi CLI untuk `openclaw docs` (cari di indeks dokumentasi langsung)
title: Dokumentasi
x-i18n:
    generated_at: "2026-07-12T14:01:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0b575f0b76d40a53dd4f79c55fd65969a24eae27e27bd1c46d395f61fe89e42
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

Cari indeks dokumentasi OpenClaw langsung dari terminal.

## Penggunaan

```bash
openclaw docs                       # tampilkan titik masuk dokumentasi dan contoh pencarian
openclaw docs <query...>            # cari di indeks dokumentasi langsung
```

| Argumen      | Deskripsi                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------- |
| `[query...]` | Kueri pencarian bebas. Kueri multikata digabungkan dengan spasi dan dikirim sebagai satu kueri. |

Tanpa kueri, `openclaw docs` menampilkan URL titik masuk dokumentasi dan contoh perintah pencarian alih-alih menjalankan pencarian.

## Contoh

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

## Cara kerjanya

`openclaw docs` memanggil `https://docs.openclaw.ai/api/search` dan merender hasil JSON. Permintaan pencarian menggunakan batas waktu tetap 30 detik.

## Keluaran

Di terminal kaya fitur (TTY), hasil dirender sebagai judul yang diikuti daftar berpoin: judul halaman, URL dokumentasi tertaut, dan cuplikan singkat pada baris berikutnya. Hasil kosong menampilkan "Tidak ada hasil.".

Pada keluaran nonkaya (disalurkan melalui pipe, `--no-color`, skrip), data yang sama dirender sebagai Markdown:

```markdown
# Pencarian dokumentasi: <query>

- [Judul](https://docs.openclaw.ai/...) - cuplikan
- [Judul](https://docs.openclaw.ai/...) - cuplikan
```

## Kode keluar

| Kode | Arti                                                                                  |
| ---- | ------------------------------------------------------------------------------------- |
| `0`  | Pencarian berhasil, termasuk respons tanpa hasil.                                     |
| `1`  | Pemanggilan API pencarian dokumentasi yang dihosting gagal; stderr menampilkan pesan galat. |

## Terkait

- [Referensi CLI](/id/cli)
- [Dokumentasi langsung](https://docs.openclaw.ai)
